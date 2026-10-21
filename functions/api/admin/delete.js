// Admin: delete a member with their sessions, synced progress, certificates, reset links and payment requests.
// The «سجل العمليات» rows about them stay (with their email) so the deletion itself is on record.
import { getDb, readBody, json, fail, HttpError } from "../../_lib/auth.js";
import { requireAdmin, logAction } from "../../_lib/admin.js";

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const me = await requireAdmin(db, request);
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1 || id === me.id) throw new HttpError(400, "bad_request");
    const u = await db.prepare("SELECT id, email, name FROM users WHERE id = ?").bind(id).first();
    if (!u) throw new HttpError(404, "not_found");
    await db.batch([
      db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id),
      db.prepare("DELETE FROM progress WHERE user_id = ?").bind(id),
      db.prepare("DELETE FROM certificates WHERE user_id = ?").bind(id),
      db.prepare("DELETE FROM resets WHERE user_id = ?").bind(id),
      db.prepare("DELETE FROM login_fails WHERE email = ?").bind(u.email),
      db.prepare("DELETE FROM users WHERE id = ?").bind(id)
    ]);
    try { await db.prepare("DELETE FROM pay_requests WHERE user_id = ?").bind(id).run(); } catch (e) {} // table exists once someone asked to pay
    await logAction(db, me, "delete", u, u.name);
    return json({ ok: true });
  } catch (e) { return fail(e); }
}
