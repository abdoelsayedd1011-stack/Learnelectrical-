// Admin: turn a member's Pro plan on until a date, extend it, or cancel it. Works whether or not the paywall is on (_lib/plan.js).
// Body: {id, until: "YYYY-MM-DD"}  → plan 'pro' until the end of that day (Cairo time)
//       {id, add_days: 30 | 365}   → Pro for that many more days, on top of a plan that hasn't ended yet (same rule as approving a payment)
//       {id, until: null}          → back to 'free'
import { getDb, readBody, json, fail, HttpError } from "../../_lib/auth.js";
import { requireAdmin, logAction, memberId } from "../../_lib/admin.js";
import { paywallOn, setPlan, extendedUntil } from "../../_lib/plan.js";

const ADD_DAYS = [30, 365];
const day = t => new Date(t + 2 * 3600 * 1000).toISOString().slice(0, 10); // Cairo calendar day

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const me = await requireAdmin(db, request);
    const id = memberId(body.id);
    const u = await db.prepare("SELECT id, email, plan, pro_until FROM users WHERE id = ?").bind(id).first();
    if (!u) throw new HttpError(404, "not_found");
    let plan = "free", until = null, what;
    if (body.add_days !== undefined){
      const days = Number(body.add_days);
      if (!ADD_DAYS.includes(days)) throw new HttpError(400, "bad_request");
      until = extendedUntil(u, days); plan = "pro";
      what = "+" + days + " يوم → لحد " + day(until);
    } else if (body.until !== null && body.until !== undefined){
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(body.until));
      if (!m) throw new HttpError(400, "bad_request");
      until = Date.UTC(+m[1], +m[2] - 1, +m[3], 23, 59, 59) - 2 * 3600 * 1000; // 23:59:59 Cairo (UTC+2)
      const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
      if (d.getUTCDate() !== +m[3] || until <= Date.now() || until > Date.now() + 20 * 365 * 864e5) throw new HttpError(400, "bad_request");
      plan = "pro";
      what = "Pro لحد " + day(until);
    } else what = "اتلغى ورجع مجاني";
    if (!(await setPlan(db, id, until))) throw new HttpError(404, "not_found");
    await logAction(db, me, plan === "pro" ? "plan" : "plan_cancel", u, what);
    return json({ ok: true, id, plan, pro_until: until, paywall: paywallOn(env) });
  } catch (e) { return fail(e); }
}
