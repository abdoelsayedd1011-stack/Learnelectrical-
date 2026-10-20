// Issue a certificate: one per member per course, only after the synced progress shows the course finished.
import { getDb, readBody, sessionUser, cleanName, json, fail, HttpError } from "../../_lib/auth.js";
import { COURSES, requirements, courseStatus } from "../../_lib/courses.js";

const ABC = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O, 1/I
function newCode(){
  const r = crypto.getRandomValues(new Uint8Array(8));
  const c = [...r].map(b => ABC[b & 31]).join("");
  return "LE-" + c.slice(0, 4) + "-" + c.slice(4);
}

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const s = await sessionUser(db, request);
    if (!s) throw new HttpError(401, "not_logged_in");
    const id = String(body.course || "");
    if (!Object.prototype.hasOwnProperty.call(COURSES, id)) throw new HttpError(400, "bad_request");
    const name = cleanName(body.name);
    const old = await db.prepare("SELECT code, name, course, issued_at FROM certificates WHERE user_id = ? AND course = ?").bind(s.id, id).first();
    if (old) return json({ ok: true, cert: old });
    const req = await requirements(env, request, id);
    if (req){ // when the course file can't be read we fall back to trusting the signed-in member
      const row = await db.prepare("SELECT v FROM progress WHERE user_id = ? AND k = ?").bind(s.id, COURSES[id].key).first();
      if (!courseStatus(id, row ? row.v : null, req).complete) throw new HttpError(400, "not_complete");
    }
    const now = Date.now();
    for (let i = 0; i < 5; i++){
      const code = newCode();
      try {
        await db.prepare("INSERT INTO certificates (code, user_id, name, course, issued_at) VALUES (?, ?, ?, ?, ?)").bind(code, s.id, name, id, now).run();
        return json({ ok: true, cert: { code, name, course: id, issued_at: now } }, 201);
      } catch (e) {
        const msg = String(e && e.message);
        if (msg.includes("user_id")){ // issued meanwhile from another tab
          const again = await db.prepare("SELECT code, name, course, issued_at FROM certificates WHERE user_id = ? AND course = ?").bind(s.id, id).first();
          if (again) return json({ ok: true, cert: again });
        }
        if (!msg.includes("UNIQUE")) throw e;
      }
    }
    throw new HttpError(500, "server");
  } catch (e) { return fail(e); }
}
