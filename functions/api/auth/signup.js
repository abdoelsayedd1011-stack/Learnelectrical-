import { getDb, readBody, cleanEmail, cleanName, checkPassword, newSalt, hashPassword, startSession, json, fail, HttpError } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const name = cleanName(body.name), email = cleanEmail(body.email), password = checkPassword(body.password);
    if (await db.prepare("SELECT 1 FROM users WHERE email = ?").bind(email).first()) throw new HttpError(409, "email_taken");
    const salt = newSalt();
    const res = await db.prepare("INSERT INTO users (email, name, pass_hash, pass_salt, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(email, name, await hashPassword(password, salt), salt, Date.now()).run();
    const cookie = await startSession(db, request, res.meta.last_row_id);
    return json({ ok: true, user: { name, email, plan: "free" } }, 201, { "set-cookie": cookie });
  } catch (e) {
    if (String(e && e.message).includes("UNIQUE")) return fail(new HttpError(409, "email_taken"));
    return fail(e);
  }
}
