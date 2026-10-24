import { getDb, sessionUser, touchUser, readCookie, clearCookie, COOKIE, json, fail } from "../../_lib/auth.js";
import { isAdmin } from "../../_lib/admin.js";
import { activeCourses } from "../../_lib/products.js";

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    const s = await sessionUser(db, request);
    if (!s){
      // A session cookie the server no longer knows: signed out from the dashboard, by a newer device, or suspended.
      // «ended» lets the login page say so gently; the dead cookie is cleared.
      // google: the login page shows «ادخل بجوجل» only when GOOGLE_CLIENT_ID is set in Cloudflare (see /api/auth/google)
      const google = !!env.GOOGLE_CLIENT_ID;
      if (/^[0-9a-f]{64}$/.test(readCookie(request, COOKIE) || "")) return json({ ok: true, user: null, ended: true, google }, 200, { "set-cookie": clearCookie(request) });
      return json({ ok: true, user: null, google });
    }
    await touchUser(db, s.id, s.token_hash);
    // courses: ids of the courses open to this member now («اشتريته ✓» on the course cards); course_until: id → end of access (ms)
    const own = await activeCourses(db, s.id), until = {};
    own.forEach(c => { until[c.course] = c.until; });
    const user = { ...s.user, courses: own.map(c => c.course), course_until: until };
    if (isAdmin(s.user)) user.admin = true;
    return json({ ok: true, user });
  } catch (e) { return fail(e); }
}
