import { getDb, sessionUser, touchUser, readCookie, clearCookie, COOKIE, json, fail } from "../../_lib/auth.js";
import { isAdmin } from "../../_lib/admin.js";
import { ownedCourses } from "../../_lib/products.js";

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
    // courses: ids of the courses this member owns for life («اشتريته ✓» on the course cards)
    const user = { ...s.user, courses: (await ownedCourses(db, s.id)).map(c => c.course) };
    if (isAdmin(s.user)) user.admin = true;
    return json({ ok: true, user });
  } catch (e) { return fail(e); }
}
