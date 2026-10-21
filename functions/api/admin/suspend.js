// Admin: suspend or unsuspend a member. Suspending signs them out of every device at once, login then answers
// «الحساب ده موقوف، كلّم الإدارة.», and every page treats them as signed out (sessionUser in _lib/auth.js).
// Body: {id, suspend: true, reason?}  |  {id, suspend: false}
import { getDb, readBody, json, fail, HttpError } from "../../_lib/auth.js";
import { requireAdmin, logAction, memberId } from "../../_lib/admin.js";
import { cleanText } from "../../_lib/pay.js";

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const me = await requireAdmin(db, request);
    const id = memberId(body.id);
    if (id === me.id) throw new HttpError(400, "self_action");
    const on = body.suspend === true;
    const reason = on ? cleanText(body.reason, 200) : null;
    const u = await db.prepare("SELECT id, email FROM users WHERE id = ?").bind(id).first();
    if (!u) throw new HttpError(404, "not_found");
    const now = Date.now();
    if (on) await db.batch([
      db.prepare("UPDATE users SET suspended = 1, suspend_reason = ?, suspended_at = ? WHERE id = ?").bind(reason, now, id),
      db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id)
    ]);
    else await db.prepare("UPDATE users SET suspended = 0, suspend_reason = NULL, suspended_at = NULL WHERE id = ?").bind(id).run();
    await logAction(db, me, on ? "suspend" : "unsuspend", u, reason);
    return json({ ok: true, id, suspended: on ? 1 : 0, suspend_reason: reason, suspended_at: on ? now : null });
  } catch (e) { return fail(e); }
}
