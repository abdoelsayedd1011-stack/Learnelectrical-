// Set a new password with a one-time link from the admin. Signs out every other session, then signs in here.
import { getDb, readBody, checkPassword, newSalt, hashPassword, sha256, startSession, publicUser, clearFails, json, fail, HttpError } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const token = String(body.token || "");
    if (!/^[0-9a-f]{64}$/.test(token)) throw new HttpError(400, "bad_token");
    const th = await sha256(token), now = Date.now();
    const r = await db.prepare("SELECT user_id FROM resets WHERE token_hash = ? AND used = 0 AND expires_at > ?").bind(th, now).first();
    if (!r) throw new HttpError(400, "bad_token");
    const password = checkPassword(body.password);
    const u = await db.prepare("SELECT id, name, email, plan, created_at FROM users WHERE id = ?").bind(r.user_id).first();
    if (!u) throw new HttpError(400, "bad_token");
    const salt = newSalt();
    // "used = 0" in the UPDATE makes a double submit of the same link a no-op
    const res = await db.prepare("UPDATE resets SET used = 1 WHERE token_hash = ? AND used = 0").bind(th).run();
    if (!res.meta || !res.meta.changes) throw new HttpError(400, "bad_token");
    await db.batch([
      db.prepare("UPDATE users SET pass_hash = ?, pass_salt = ? WHERE id = ?").bind(await hashPassword(password, salt), salt, u.id),
      db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(u.id),
      db.prepare("DELETE FROM resets WHERE user_id = ?").bind(u.id)
    ]);
    await clearFails(db, u.email);
    const cookie = await startSession(db, request, u.id);
    return json({ ok: true, user: publicUser(u) }, 200, { "set-cookie": cookie });
  } catch (e) { return fail(e); }
}
