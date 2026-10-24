// POST /api/auth/password {password}: change the signed-in member's password from «حسابي», no reset link needed.
// Being signed in is enough (owner's decision 2026-10-24: no current password asked, so a member who forgot it
// can sign in with Google and set a new one). Other devices are signed out; this device keeps its session.
import { getDb, readBody, sessionUser, checkPassword, hashPassword, newSalt, json, fail, HttpError } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const s = await sessionUser(db, request);
    if (!s) throw new HttpError(401, "not_logged_in");
    const body = await readBody(request);
    const password = checkPassword(body.password);
    const salt = newSalt();
    await db.batch([
      db.prepare("UPDATE users SET pass_hash = ?, pass_salt = ? WHERE id = ?").bind(await hashPassword(password, salt), salt, s.id),
      db.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?").bind(s.id, s.token_hash)
    ]);
    return json({ ok: true });
  } catch (e) { return fail(e); }
}
