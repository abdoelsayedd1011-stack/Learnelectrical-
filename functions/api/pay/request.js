// Member payment requests («أنا حوّلت» on /subscribe.html).
// GET  → { signed, paywall, requests: [latest 10 of this member] }   (guests: signed false)
// POST {plan: monthly|yearly, amount, currency: EGP|USD, method: instapay|vodafone|intl, sender?, note?}
import { getDb, sessionUser, readBody, json, fail, HttpError } from "../../_lib/auth.js";
import { paywallOn, isPro } from "../../_lib/plan.js";
import { payTable, cleanText, publicRequest, PLANS, METHODS, MAX_PENDING, MAX_PER_DAY } from "../../_lib/pay.js";

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    const s = await sessionUser(db, request);
    if (!s) return json({ ok: true, signed: false, paywall: paywallOn(env) });
    await payTable(db);
    const rows = await db.prepare("SELECT * FROM pay_requests WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 10").bind(s.id).all();
    return json({ ok: true, signed: true, paywall: paywallOn(env), user: { email: s.user.email, name: s.user.name, pro: isPro(s.user), pro_until: s.user.pro_until },
      requests: (rows.results || []).map(publicRequest) });
  } catch (e) { return fail(e); }
}

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const s = await sessionUser(db, request);
    if (!s) throw new HttpError(401, "not_logged_in");
    const plan = String(body.plan || ""), method = String(body.method || "");
    const currency = method === "intl" ? "USD" : "EGP";
    const amount = Number(body.amount);
    if (!PLANS.includes(plan) || !METHODS.includes(method) || (body.currency && body.currency !== currency) ||
        !Number.isFinite(amount) || amount <= 0 || amount > 1000000) throw new HttpError(400, "bad_request");
    const sender = cleanText(body.sender, 80), note = cleanText(body.note, 300);
    await payTable(db);
    const now = Date.now();
    const c = await db.prepare("SELECT SUM(status = 'pending') AS pending, SUM(created_at > ?) AS today FROM pay_requests WHERE user_id = ?").bind(now - 864e5, s.id).first();
    if ((c && c.pending || 0) >= MAX_PENDING) throw new HttpError(429, "too_many_pending");
    if ((c && c.today || 0) >= MAX_PER_DAY) throw new HttpError(429, "too_many_pending");
    const r = await db.prepare("INSERT INTO pay_requests (user_id, plan, amount, currency, method, sender, note, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?) RETURNING *")
      .bind(s.id, plan, Math.round(amount * 100) / 100, currency, method, sender, note, now).first();
    return json({ ok: true, request: publicRequest(r) });
  } catch (e) { return fail(e); }
}
