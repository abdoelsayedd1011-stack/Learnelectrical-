import { getDb, sessionUser, touchUser, readCookie, clearCookie, COOKIE, json, fail } from "../../_lib/auth.js";
import { isAdmin } from "../../_lib/admin.js";

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    const s = await sessionUser(db, request);
    if (!s){
      // A session cookie the server no longer knows: signed out from the dashboard, by a newer device, or suspended.
      // «ended» lets the login page say so gently; the dead cookie is cleared.
      if (/^[0-9a-f]{64}$/.test(readCookie(request, COOKIE) || "")) return json({ ok: true, user: null, ended: true }, 200, { "set-cookie": clearCookie(request) });
      return json({ ok: true, user: null });
    }
    await touchUser(db, s.id, s.token_hash);
    return json({ ok: true, user: isAdmin(s.user) ? { ...s.user, admin: true } : s.user });
  } catch (e) { return fail(e); }
}
