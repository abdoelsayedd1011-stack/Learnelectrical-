// Admin: «تنزيل Excel» — the member list (same ?q= and ?f= as /api/admin/members) as a CSV that Excel opens
// with the Arabic intact (UTF-8 with a BOM). Dates are Cairo time.
import { getDb, json, fail } from "../../_lib/auth.js";
import { requireAdmin, isAdmin, memberWhere, FILTERS, logAction } from "../../_lib/admin.js";
import { isPro } from "../../_lib/plan.js";

const MAX_ROWS = 50000;
const when = t => t ? new Date(t + 2 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " ") : "";
// Quote every cell; a leading = + - @ is defused so Excel never runs it as a formula.
const cell = v => { let s = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };

function countryAr(c){ if (!c) return ""; try { return new Intl.DisplayNames(["ar"], { type: "region" }).of(c) || c; } catch (e){ return c; } }

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    const me = await requireAdmin(db, request);
    const url = new URL(request.url);
    const q = String(url.searchParams.get("q") || "").trim().slice(0, 100);
    const f = FILTERS.includes(url.searchParams.get("f")) ? url.searchParams.get("f") : "";
    const { where, binds } = memberWhere(q, f);
    const st = db.prepare("SELECT u.id, u.email, u.name, u.plan, u.pro_until, u.created_at, u.last_seen, COALESCE(u.suspended, 0) AS suspended, (SELECT COUNT(*) FROM progress p WHERE p.user_id = u.id) AS synced, (SELECT COUNT(*) FROM certificates c WHERE c.user_id = u.id) AS certs, COALESCE(u.country, (SELECT s.country FROM sessions s WHERE s.user_id = u.id AND s.country IS NOT NULL ORDER BY COALESCE(s.last_seen, s.created_at, 0) DESC LIMIT 1)) AS country FROM users u" + where + " ORDER BY u.created_at DESC, u.id DESC LIMIT " + MAX_ROWS);
    const rows = (await (binds.length ? st.bind(...binds) : st).all()).results || [];
    const head = ["الاسم", "الإيميل", "الدولة", "اشترك يوم", "آخر دخول", "الخطة", "Pro لحد", "موقوف", "تقدّم متزامن", "شهادات", "إدارة"];
    const lines = [head.map(cell).join(",")].concat(rows.map(r => [r.name, r.email, countryAr(r.country), when(r.created_at), when(r.last_seen),
      isPro(r) ? "Pro" : "مجاني", isPro(r) ? when(r.pro_until) : "", r.suspended ? "أيوه" : "", r.synced, r.certs, isAdmin(r) ? "أيوه" : ""].map(cell).join(",")));
    await logAction(db, me, "export", null, rows.length + " عضو" + (q ? " · بحث: " + q : "") + (f ? " · " + f : ""));
    const day = new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 10);
    return new Response("﻿" + lines.join("\r\n") + "\r\n", { headers: {
      "content-type": "text/csv; charset=utf-8", "cache-control": "no-store",
      "content-disposition": 'attachment; filename="learnelectricals-members-' + day + '.csv"' } });
  } catch (e) { return fail(e); }
}
