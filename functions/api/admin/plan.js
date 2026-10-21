// Admin: turn a member's Pro plan on until a date, or cancel it. Works whether or not the paywall is on (_lib/plan.js).
// Body: {id, until: "YYYY-MM-DD"}  → plan 'pro' until the end of that day (Cairo time)
//       {id, until: null}          → back to 'free'
import { getDb, readBody, json, fail, HttpError } from "../../_lib/auth.js";
import { requireAdmin } from "../../_lib/admin.js";
import { paywallOn } from "../../_lib/plan.js";

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    await requireAdmin(db, request);
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "bad_request");
    let plan = "free", until = null;
    if (body.until !== null && body.until !== undefined){
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(body.until));
      if (!m) throw new HttpError(400, "bad_request");
      until = Date.UTC(+m[1], +m[2] - 1, +m[3], 23, 59, 59) - 2 * 3600 * 1000; // 23:59:59 Cairo (UTC+2)
      const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
      if (d.getUTCDate() !== +m[3] || until <= Date.now() || until > Date.now() + 20 * 365 * 864e5) throw new HttpError(400, "bad_request");
      plan = "pro";
    }
    const r = await db.prepare("UPDATE users SET plan = ?, pro_until = ? WHERE id = ?").bind(plan, until, id).run();
    if (!r.meta || !r.meta.changes) throw new HttpError(404, "not_found");
    return json({ ok: true, id, plan, pro_until: until, paywall: paywallOn(env) });
  } catch (e) { return fail(e); }
}
