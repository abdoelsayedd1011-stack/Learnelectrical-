// Admin overview: member counts, daily sign-ups for the last 30 days (Cairo time), synced progress per course,
// and «هتخلص خلال 7 أيام»: Pro plans ending in the next 7 days.
import { getDb, json, fail } from "../../_lib/auth.js";
import { requireAdmin } from "../../_lib/admin.js";

const TZ = "Africa/Cairo";
const ONLINE_MS = 4 * 60 * 1000; // open pages ping every 2 minutes
const dayKey = t => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(t));

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    await requireAdmin(db, request);
    const now = Date.now(), since = now - 32 * 864e5;
    const [total, recent, groups, certs, active, online, expiring] = await Promise.all([
      db.prepare("SELECT COUNT(*) AS n FROM users").first(),
      db.prepare("SELECT created_at FROM users WHERE created_at >= ?").bind(since).all(),
      db.prepare("SELECT CASE WHEN k LIKE 'vfd-%' THEN 'vfd' ELSE substr(k, 1, instr(k, '-') - 1) END AS g, COUNT(DISTINCT user_id) AS n FROM progress GROUP BY g").all(),
      db.prepare("SELECT course, COUNT(*) AS n FROM certificates GROUP BY course").all(),
      db.prepare("SELECT COUNT(*) AS n FROM users WHERE last_seen >= ?").bind(now - 7 * 864e5).first(),
      db.prepare("SELECT COUNT(*) AS n FROM users WHERE last_seen >= ?").bind(now - ONLINE_MS).first(),
      db.prepare("SELECT id, name, email, pro_until, last_seen, COALESCE(suspended, 0) AS suspended FROM users WHERE plan = 'pro' AND pro_until > ? AND pro_until <= ? ORDER BY pro_until ASC LIMIT 100").bind(now, now + 7 * 864e5).all()
    ]);
    // 30 buckets, oldest first, keyed by Cairo calendar day
    const days = [];
    for (let i = 29; i >= 0; i--) days.push({ day: dayKey(now - i * 864e5), n: 0 });
    const idx = {}; days.forEach((d, i) => { idx[d.day] = i; });
    (recent.results || []).forEach(r => { const i = idx[dayKey(r.created_at)]; if (i !== undefined) days[i].n++; });
    const sum = k => days.slice(30 - k).reduce((a, d) => a + d.n, 0);
    const synced = {}; (groups.results || []).forEach(r => { if (r.g) synced[r.g] = r.n; });
    const issued = {}; (certs.results || []).forEach(r => { issued[r.course] = r.n; });
    return json({ ok: true, total: total.n, today: sum(1), week: sum(7), month: sum(30), active_week: active.n, online: online.n, days, synced, certs: issued, expiring: expiring.results || [] });
  } catch (e) { return fail(e); }
}
