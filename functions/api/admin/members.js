// Admin member list: ?q= searches email or name, ?offset= pages by 30, newest first.
import { getDb, json, fail } from "../../_lib/auth.js";
import { requireAdmin, isAdmin } from "../../_lib/admin.js";
import { paywallOn } from "../../_lib/plan.js";

const PAGE = 30;

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    await requireAdmin(db, request);
    const url = new URL(request.url);
    const q = String(url.searchParams.get("q") || "").trim().slice(0, 100);
    const offset = Math.max(0, Math.min(100000, parseInt(url.searchParams.get("offset"), 10) || 0));
    const like = "%" + q.replace(/[\\%_]/g, c => "\\" + c) + "%";
    const where = q ? " WHERE u.email LIKE ?1 ESCAPE '\\' OR u.name LIKE ?1 ESCAPE '\\'" : "";
    const bindQ = st => q ? st.bind(like) : st;
    const [count, rows] = await Promise.all([
      bindQ(db.prepare("SELECT COUNT(*) AS n FROM users u" + where)).first(),
      bindQ(db.prepare("SELECT u.id, u.email, u.name, u.plan, u.pro_until, u.created_at, u.last_seen, (SELECT COUNT(*) FROM progress p WHERE p.user_id = u.id) AS synced, (SELECT COUNT(*) FROM certificates c WHERE c.user_id = u.id) AS certs FROM users u" + where + " ORDER BY u.created_at DESC, u.id DESC LIMIT " + PAGE + " OFFSET " + offset)).all()
    ]);
    const members = (rows.results || []).map(r => ({ ...r, admin: isAdmin(r) }));
    return json({ ok: true, total: count.n, offset, page: PAGE, members, paywall: paywallOn(env) });
  } catch (e) { return fail(e); }
}
