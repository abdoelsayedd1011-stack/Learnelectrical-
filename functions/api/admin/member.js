// Admin: everything about one member for the details view in /admin.html: account, plan, signed-in devices,
// progress per course (same rule as the certificates, _lib/courses.js), certificates, payment requests,
// owned courses («كورساته»), private admin notes and the latest «سجل العمليات» rows about them.   GET ?id=
import { getDb, json, fail, HttpError, maxDevices } from "../../_lib/auth.js";
import { requireAdmin, isAdmin, memberId } from "../../_lib/admin.js";
import { paywallOn } from "../../_lib/plan.js";
import { payTable } from "../../_lib/pay.js";
import { COURSES, requirements, courseStatus } from "../../_lib/courses.js";
import { PRODUCTS, ownedCourses } from "../../_lib/products.js";

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    const me = await requireAdmin(db, request);
    const id = memberId(new URL(request.url).searchParams.get("id"));
    const u = await db.prepare("SELECT id, email, name, country, plan, pro_until, created_at, last_seen, COALESCE(suspended, 0) AS suspended, suspend_reason, suspended_at, admin_note, admin_note_at FROM users WHERE id = ?").bind(id).first();
    if (!u) throw new HttpError(404, "not_found");
    await payTable(db);
    const now = Date.now(), ids = Object.keys(COURSES);
    const [sess, prog, certs, pays, log, owned] = await Promise.all([
      db.prepare("SELECT token_hash, created_at, last_seen, device, country FROM sessions WHERE user_id = ? AND expires_at > ? ORDER BY COALESCE(last_seen, created_at, 0) DESC").bind(id, now).all(),
      db.prepare("SELECT k, v, updated_at FROM progress WHERE user_id = ? AND k IN (" + ids.map(() => "?").join(",") + ")").bind(id, ...ids.map(i => COURSES[i].key)).all(),
      db.prepare("SELECT code, name, course, issued_at FROM certificates WHERE user_id = ? ORDER BY issued_at DESC").bind(id).all(),
      db.prepare("SELECT id, plan, COALESCE(product, plan) AS product, amount, currency, method, sender, note, status, created_at, decided_at, pro_until FROM pay_requests WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50").bind(id).all(),
      db.prepare("SELECT id, at, admin_email, action, details FROM admin_log WHERE target_id = ? ORDER BY at DESC, id DESC LIMIT 10").bind(id).all(),
      ownedCourses(db, id)
    ]);
    const pv = {}; (prog.results || []).forEach(r => { pv[r.k] = r; });
    const courses = [];
    for (const c of ids){
      const row = pv[COURSES[c].key];
      const st = courseStatus(c, row ? row.v : null, await requirements(env, request, c));
      courses.push({ id: c, title: COURSES[c].title, done: st.done, total: st.total, started: !!row, updated_at: row ? row.updated_at : null });
    }
    // Devices are named by the first 16 hex characters of the session's token hash (never the token itself).
    const devices = (sess.results || []).map(s => ({ sid: s.token_hash.slice(0, 16), device: s.device || "جهاز قديم (قبل تسجيل الأجهزة)", country: s.country || null,
      created_at: s.created_at || null, last_seen: s.last_seen || null, current: s.token_hash === me.token_hash }));
    return json({ ok: true, member: { ...u, admin: isAdmin(u), self: u.id === me.id }, devices, courses,
      certs: (certs.results || []).map(c => ({ ...c, course_title: (COURSES[c.course] || {}).title || c.course })),
      pays: pays.results || [], owned: owned.map(c => ({ ...c, title: PRODUCTS[c.course].title })),
      products: Object.keys(PRODUCTS).map(k => ({ id: k, title: PRODUCTS[k].title })), log: log.results || [], max_devices: maxDevices(env), paywall: paywallOn(env) });
  } catch (e) { return fail(e); }
}
