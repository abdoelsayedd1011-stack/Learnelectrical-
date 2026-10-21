// Admin: one-time password link for a member (valid 24 hours). Only the hash of the token is stored.
import { getDb, readBody, sha256, newToken, json, fail, HttpError } from "../../_lib/auth.js";
import { requireAdmin, logAction } from "../../_lib/admin.js";

const RESET_HOURS = 24;

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const me = await requireAdmin(db, request);
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "bad_request");
    const u = await db.prepare("SELECT id, email, name FROM users WHERE id = ?").bind(id).first();
    if (!u) throw new HttpError(404, "not_found");
    const token = newToken(), now = Date.now(), expires = now + RESET_HOURS * 3600 * 1000;
    await db.batch([
      db.prepare("DELETE FROM resets WHERE user_id = ? OR expires_at < ?").bind(id, now),
      db.prepare("INSERT INTO resets (token_hash, user_id, expires_at, used) VALUES (?, ?, ?, 0)").bind(await sha256(token), id, expires)
    ]);
    await logAction(db, me, "reset_link", u, null);
    const link = new URL("/reset.html?t=" + token, request.url).href;
    return json({ ok: true, link, expires_at: expires, email: u.email, name: u.name });
  } catch (e) { return fail(e); }
}
