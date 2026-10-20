// The signed-in member's courses: progress toward each certificate and the certificates already issued.
import { getDb, sessionUser, json, fail } from "../../_lib/auth.js";
import { COURSES, requirements, courseStatus } from "../../_lib/courses.js";

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    const s = await sessionUser(db, request);
    if (!s) return json({ ok: true, signed: false });
    const ids = Object.keys(COURSES);
    const [prog, certs] = await Promise.all([
      db.prepare("SELECT k, v FROM progress WHERE user_id = ? AND k IN (" + ids.map(() => "?").join(",") + ")").bind(s.id, ...ids.map(i => COURSES[i].key)).all(),
      db.prepare("SELECT code, name, course, issued_at FROM certificates WHERE user_id = ?").bind(s.id).all()
    ]);
    const pv = {}; (prog.results || []).forEach(r => { pv[r.k] = r.v; });
    const cv = {}; (certs.results || []).forEach(r => { cv[r.course] = r; });
    const courses = [];
    for (const id of ids){
      const st = courseStatus(id, pv[COURSES[id].key], await requirements(env, request, id));
      courses.push({ id, title: COURSES[id].title, hub: COURSES[id].hub, done: st.done, total: st.total, complete: st.complete,
        name: st.name || s.user.name, cert: cv[id] ? { code: cv[id].code, name: cv[id].name, issued_at: cv[id].issued_at } : null });
    }
    return json({ ok: true, signed: true, courses });
  } catch (e) { return fail(e); }
}
