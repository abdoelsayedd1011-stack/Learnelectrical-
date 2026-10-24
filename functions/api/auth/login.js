import { getDb, readBody, cleanEmail, hashPassword, newSalt, sameString, startSession, publicUser, checkFails, noteFail, clearFails, json, fail, HttpError } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    let email;
    try { email = cleanEmail(body.email); } catch (e) { throw new HttpError(401, "wrong_login"); }
    const password = String(body.password || "").slice(0, 128);
    await checkFails(db, email);
    const u = await db.prepare("SELECT id, name, email, plan, pro_until, created_at, pass_hash, pass_salt, suspended FROM users WHERE email = ?").bind(email).first();
    // Hash even when the user doesn't exist so timing doesn't reveal registered emails.
    const h = await hashPassword(password, u ? u.pass_salt : newSalt());
    if (u && !u.pass_hash){ await noteFail(db, email); throw new HttpError(401, "use_google"); } // created with Google, no password yet
    if (!u || !sameString(h, u.pass_hash)){ await noteFail(db, email); throw new HttpError(401, "wrong_login"); }
    await clearFails(db, email);
    if (u.suspended) throw new HttpError(403, "suspended"); // only after the right password, so it doesn't reveal accounts
    const cookie = await startSession(db, request, u.id, env);
    return json({ ok: true, user: publicUser(u) }, 200, { "set-cookie": cookie });
  } catch (e) { return fail(e); }
}
