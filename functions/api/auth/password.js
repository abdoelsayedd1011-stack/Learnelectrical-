// POST /api/auth/password {current, password}: change the signed-in member's password from «حسابي», no reset link needed.
// An account created with «ادخل بجوجل» has no password yet, so it sets one without a current password.
// Other devices are signed out; this device keeps its session.
import { getDb, readBody, sessionUser, checkPassword, hashPassword, newSalt, sameString, checkFails, noteFail, clearFails, json, fail, HttpError } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const s = await sessionUser(db, request);
    if (!s) throw new HttpError(401, "not_logged_in");
    const body = await readBody(request);
    const password = checkPassword(body.password);
    const u = await db.prepare("SELECT pass_hash, pass_salt FROM users WHERE id = ?").bind(s.id).first();
    if (!u) throw new HttpError(401, "not_logged_in");
    if (u.pass_hash){
      await checkFails(db, s.user.email);
      const h = await hashPassword(String(body.current || "").slice(0, 128), u.pass_salt);
      if (!sameString(h, u.pass_hash)){ await noteFail(db, s.user.email); throw new HttpError(401, "wrong_password"); }
      await clearFails(db, s.user.email);
    }
    const salt = newSalt();
    await db.batch([
      db.prepare("UPDATE users SET pass_hash = ?, pass_salt = ? WHERE id = ?").bind(await hashPassword(password, salt), salt, s.id),
      db.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?").bind(s.id, s.token_hash)
    ]);
    return json({ ok: true });
  } catch (e) { return fail(e); }
}
