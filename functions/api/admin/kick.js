// Admin: sign a member out of one device or all of them. That device simply lands on the login page next time.
// Body: {id, sid}  (sid from /api/admin/member)  |  {id, all: true}
// The admin's own current session is never signed out from here.
import { getDb, readBody, json, fail, HttpError } from "../../_lib/auth.js";
import { requireAdmin, logAction, memberId } from "../../_lib/admin.js";

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const me = await requireAdmin(db, request);
    const id = memberId(body.id);
    const all = body.all === true, sid = String(body.sid || "");
    if (!all && !/^[0-9a-f]{16}$/.test(sid)) throw new HttpError(400, "bad_request");
    if (!all && me.token_hash.slice(0, 16) === sid) throw new HttpError(400, "self_action");
    const u = await db.prepare("SELECT id, email FROM users WHERE id = ?").bind(id).first();
    if (!u) throw new HttpError(404, "not_found");
    let r, what;
    if (all){
      r = await db.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?").bind(id, me.token_hash).run();
      what = "كل الأجهزة";
    } else {
      const s = await db.prepare("SELECT device, country FROM sessions WHERE user_id = ? AND substr(token_hash, 1, 16) = ?").bind(id, sid).first();
      if (!s) throw new HttpError(404, "not_found");
      r = await db.prepare("DELETE FROM sessions WHERE user_id = ? AND substr(token_hash, 1, 16) = ?").bind(id, sid).run();
      what = (s.device || "جهاز") + (s.country ? " (" + s.country + ")" : "");
    }
    const n = (r.meta && r.meta.changes) || 0;
    if (n) await logAction(db, me, "kick", u, what + (all ? " · " + n : ""));
    return json({ ok: true, id, removed: n });
  } catch (e) { return fail(e); }
}
