// Admin: «سجل العمليات», newest first, 20 a page.   GET ?offset=
import { getDb, json, fail } from "../../_lib/auth.js";
import { requireAdmin } from "../../_lib/admin.js";

const PAGE = 20;

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    await requireAdmin(db, request);
    const offset = Math.max(0, Math.min(1000000, parseInt(new URL(request.url).searchParams.get("offset"), 10) || 0));
    const [count, rows] = await Promise.all([
      db.prepare("SELECT COUNT(*) AS n FROM admin_log").first(),
      db.prepare("SELECT l.id, l.at, l.admin_email, l.action, l.target_id, l.target_email, l.details, u.name AS target_name FROM admin_log l LEFT JOIN users u ON u.id = l.target_id ORDER BY l.at DESC, l.id DESC LIMIT " + PAGE + " OFFSET " + offset).all()
    ]);
    return json({ ok: true, total: count.n, offset, page: PAGE, rows: rows.results || [] });
  } catch (e) { return fail(e); }
}
