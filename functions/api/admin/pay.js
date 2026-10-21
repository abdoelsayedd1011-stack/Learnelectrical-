// Admin: payment requests from /subscribe.html.
// GET ?status=pending (default) | recent      → requests with the member's name, email and current plan
// POST {id, action: "approve"}  → Pro for PLAN_DAYS[plan] days from max(now, current pro_until), request approved
// POST {id, action: "reject"}   → request rejected, plan unchanged
import { getDb, readBody, json, fail, HttpError } from "../../_lib/auth.js";
import { requireAdmin } from "../../_lib/admin.js";
import { paywallOn, setPlan, extendedUntil, PLAN_DAYS } from "../../_lib/plan.js";
import { payTable } from "../../_lib/pay.js";

const COLS = "r.id, r.user_id, r.plan, r.amount, r.currency, r.method, r.sender, r.note, r.status, r.created_at, r.decided_at, r.pro_until AS granted_until, u.name, u.email, u.plan AS user_plan, u.pro_until";

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
    return json({ ok: true, requests: rows.results || [], paywall: paywallOn(env) });
  } catch (e) { return fail(e); }
}

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    await requireAdmin(db, request);
    await payTable(db);
    const id = Number(body.id), action = String(body.action || "");
    if (!Number.isInteger(id) || id < 1 || (action !== "approve" && action !== "reject")) throw new HttpError(400, "bad_request");
    const r = await db.prepare("SELECT r.id, r.user_id, r.plan, r.status, u.plan AS user_plan, u.pro_until FROM pay_requests r LEFT JOIN users u ON u.id = r.user_id WHERE r.id = ?").bind(id).first();
    if (!r) throw new HttpError(404, "not_found");
    if (r.status !== "pending") throw new HttpError(409, "already_done");
    const now = Date.now();
    if (action === "reject"){
      await db.prepare("UPDATE pay_requests SET status = 'rejected', decided_at = ? WHERE id = ? AND status = 'pending'").bind(now, id).run();
      return json({ ok: true, id, status: "rejected" });
    }
    if (r.user_plan === null || r.user_plan === undefined) throw new HttpError(404, "not_found"); // member was deleted
    const until = extendedUntil({ plan: r.user_plan, pro_until: r.pro_until }, PLAN_DAYS[r.plan] || 30, now);
    // Claim the request first so two admins clicking at once can't add the days twice.
    const claim = await db.prepare("UPDATE pay_requests SET status = 'approved', decided_at = ?, pro_until = ? WHERE id = ? AND status = 'pending'").bind(now, until, id).run();
    if (!claim.meta || !claim.meta.changes) throw new HttpError(409, "already_done");
    if (!(await setPlan(db, r.user_id, until))) throw new HttpError(404, "not_found");
    return json({ ok: true, id, status: "approved", user_id: r.user_id, plan: "pro", pro_until: until, paywall: paywallOn(env) });
  } catch (e) { return fail(e); }
}
