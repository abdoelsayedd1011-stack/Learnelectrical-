// Public certificate check for /cert.html?c=CODE. Unknown codes answer {cert: null}.
import { getDb, json, fail } from "../../_lib/auth.js";
import { COURSES } from "../../_lib/courses.js";

export async function onRequestGet({ params, env }){
  try {
    const code = String(params.code || "").trim().toUpperCase();
    if (!/^LE-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(code)) return json({ ok: true, cert: null });
    const db = await getDb(env);
    const c = await db.prepare("SELECT code, name, course, issued_at FROM certificates WHERE code = ?").bind(code).first();
    if (!c) return json({ ok: true, cert: null });
    return json({ ok: true, cert: { code: c.code, name: c.name, course: c.course, course_title: (COURSES[c.course] || {}).title || c.course, issued_at: c.issued_at } });
  } catch (e) { return fail(e); }
}
