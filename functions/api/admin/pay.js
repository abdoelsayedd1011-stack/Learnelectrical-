// Admin: payment requests from /subscribe.html.
// GET ?status=pending (default) | recent      → requests with the member's name, email and current plan
// POST {id, action: "approve"}  → monthly / yearly: Pro for PLAN_DAYS[plan] days from max(now, current pro_until)
//                                 course: that course for a year, or a year more if it is still open (user_courses, _lib/products.js)
// POST {id, action: "reject"}   → request rejected, nothing granted
import { getDb, readBody, json, fail, HttpError } from "../../_lib/auth.js";
import { requireAdmin, logAction } from "../../_lib/admin.js";
import { paywallOn, setPlan, extendedUntil, PLAN_DAYS } from "../../_lib/plan.js";
import { payTable, COURSE_PLAN } from "../../_lib/pay.js";
import { PRODUCTS, grantCourse } from "../../_lib/products.js";

const PLAN_AR = { monthly: "شهري", yearly: "سنوي" };
const what = r => r.plan === COURSE_PLAN ? "كورس " + ((PRODUCTS[r.product] || {}).title || r.product) : "كل الكورسات " + (PLAN_AR[r.plan] || r.plan);
const COLS = "r.id, r.user_id, r.plan, r.product, r.amount, r.currency, r.method, r.sender, r.note, r.status, r.created_at, r.decided_at, r.pro_until AS granted_until, u.name, u.email, u.plan AS user_plan, u.pro_until";

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    await requireAdmin(db, request);
    await payTable(db);
    const recent = new URL(request.url).searchParams.get("status") === "recent";
    const sql = recent
      ? "SELECT " + COLS + " FROM pay_requests r LEFT JOIN users u ON u.id = r.user_id WHERE r.status != 'pending' ORDER BY r.decided_at DESC LIMIT 20"
      : "SELECT " + COLS + " FROM pay_requests r LEFT JOIN users u ON u.id = r.user_id WHERE r.status = 'pending' ORDER BY r.created_at ASC LIMIT 100";
    const rows = await db.prepare(sql).all();
    return json({ ok: true, requests: (rows.results || []).map(r => ({ ...r, product: r.product || r.plan })), paywall: paywallOn(env) });
  } catch (e) { return fail(e); }
}

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const me = await requireAdmin(db, request);
    await payTable(db);
    const id = Number(body.id), action = String(body.action || "");
    if (!Number.isInteger(id) || id < 1 || (action !== "approve" && action !== "reject")) throw new HttpError(400, "bad_request");
    const r = await db.prepare("SELECT r.id, r.user_id, r.plan, r.product, r.amount, r.currency, r.status, u.email, u.plan AS user_plan, u.pro_until FROM pay_requests r LEFT JOIN users u ON u.id = r.user_id WHERE r.id = ?").bind(id).first();
    if (!r) throw new HttpError(404, "not_found");
    if (r.status !== "pending") throw new HttpError(409, "already_done");
    const now = Date.now();
    if (action === "reject"){
      const rej = await db.prepare("UPDATE pay_requests SET status = 'rejected', decided_at = ? WHERE id = ? AND status = 'pending'").bind(now, id).run();
      if (rej.meta && rej.meta.changes) await logAction(db, me, "pay_reject", { id: r.user_id, email: r.email }, "طلب #" + id + " · " + what(r) + " · " + r.amount + " " + r.currency);
      return json({ ok: true, id, status: "rejected" });
    }
    if (r.user_plan === null || r.user_plan === undefined) throw new HttpError(404, "not_found"); // member was deleted
    if (r.plan === COURSE_PLAN){
      if (!PRODUCTS[r.product]) throw new HttpError(400, "bad_request");
      const claim = await db.prepare("UPDATE pay_requests SET status = 'approved', decided_at = ? WHERE id = ? AND status = 'pending'").bind(now, id).run();
      if (!claim.meta || !claim.meta.changes) throw new HttpError(409, "already_done");
      const g = await grantCourse(db, r.user_id, r.product, "pay", "طلب #" + id + " · " + r.amount + " " + r.currency, now);
      await db.prepare("UPDATE pay_requests SET pro_until = ? WHERE id = ?").bind(g.until, id).run(); // shown as «لحد» on the request
      await logAction(db, me, "pay_approve", { id: r.user_id, email: r.email }, "طلب #" + id + " · " + what(r) + " · " + r.amount + " " + r.currency + " → لحد " + new Date(g.until + 2 * 3600 * 1000).toISOString().slice(0, 10));
      return json({ ok: true, id, status: "approved", user_id: r.user_id, course: r.product, until: g.until, paywall: paywallOn(env) });
    }
    const until = extendedUntil({ plan: r.user_plan, pro_until: r.pro_until }, PLAN_DAYS[r.plan] || 30, now);
    // Claim the request first so two admins clicking at once can't add the days twice.
    const claim = await db.prepare("UPDATE pay_requests SET status = 'approved', decided_at = ?, pro_until = ? WHERE id = ? AND status = 'pending'").bind(now, until, id).run();
    if (!claim.meta || !claim.meta.changes) throw new HttpError(409, "already_done");
    if (!(await setPlan(db, r.user_id, until))) throw new HttpError(404, "not_found");
    await logAction(db, me, "pay_approve", { id: r.user_id, email: r.email }, "طلب #" + id + " · " + what(r) + " · " + r.amount + " " + r.currency + " → لحد " + new Date(until + 2 * 3600 * 1000).toISOString().slice(0, 10));
    return json({ ok: true, id, status: "approved", user_id: r.user_id, plan: "pro", pro_until: until, paywall: paywallOn(env) });
  } catch (e) { return fail(e); }
}
