// Member payment requests («أنا حوّلت» on /subscribe.html).
// GET  → { signed, paywall, courses: [ids open now], owned: [{course, until, active}], requests: [latest 10 of this member] }   (guests: signed false)
// POST {product: <course id> | monthly | yearly, amount, currency: EGP|USD, method: instapay|vodafone|intl, sender?, note?}
//      (older pages send {plan: monthly|yearly} instead of product: still accepted)
// A course must be for sale («الأسعار» in /admin.html); its amount is the saved price: EGP, or USD when paid from
// outside Egypt (method intl). It opens for one year; a member can buy it again once it ends.
import { getDb, sessionUser, readBody, json, fail, HttpError } from "../../_lib/auth.js";
import { paywallOn, isPro } from "../../_lib/plan.js";
import { payTable, cleanText, publicRequest, PLANS, METHODS, MAX_PENDING, MAX_PER_DAY, COURSE_PLAN } from "../../_lib/pay.js";
import { productId, getPrices, forSale, ownedCourses, ownsCourse } from "../../_lib/products.js";

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    const s = await sessionUser(db, request);
    if (!s) return json({ ok: true, signed: false, paywall: paywallOn(env) });
    await payTable(db);
    const [rows, owned] = await Promise.all([
      db.prepare("SELECT * FROM pay_requests WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 10").bind(s.id).all(),
      ownedCourses(db, s.id)
    ]);
    return json({ ok: true, signed: true, paywall: paywallOn(env), user: { email: s.user.email, name: s.user.name, pro: isPro(s.user), pro_until: s.user.pro_until },
      courses: owned.filter(c => c.active).map(c => c.course), owned: owned.map(c => ({ course: c.course, until: c.until, active: c.active })), requests: (rows.results || []).map(publicRequest) });
  } catch (e) { return fail(e); }
}

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const s = await sessionUser(db, request);
    if (!s) throw new HttpError(401, "not_logged_in");
    const want = String(body.product || body.plan || ""), method = String(body.method || "");
    const course = PLANS.includes(want) ? null : productId(want);
    const plan = course ? COURSE_PLAN : want;
    const currency = method === "intl" ? "USD" : "EGP";
    let amount = Number(body.amount);
    if ((!course && !PLANS.includes(plan)) || !METHODS.includes(method) || (body.currency && body.currency !== currency)) throw new HttpError(400, "bad_request");
    if (course){
      const prices = await getPrices(db);
      if (!forSale(prices, course, currency)) throw new HttpError(409, "not_for_sale");
      if (await ownsCourse(db, s.id, course)) throw new HttpError(409, "already_owned");
      amount = currency === "USD" ? prices.courses[course].usd : prices.courses[course].price; // the saved price, whatever the page sent
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) throw new HttpError(400, "bad_request");
    const sender = cleanText(body.sender, 80), note = cleanText(body.note, 300);
    await payTable(db);
    const now = Date.now();
    const c = await db.prepare("SELECT SUM(status = 'pending') AS pending, SUM(created_at > ?) AS today FROM pay_requests WHERE user_id = ?").bind(now - 864e5, s.id).first();
    if ((c && c.pending || 0) >= MAX_PENDING) throw new HttpError(429, "too_many_pending");
    if ((c && c.today || 0) >= MAX_PER_DAY) throw new HttpError(429, "too_many_pending");
    const r = await db.prepare("INSERT INTO pay_requests (user_id, plan, product, amount, currency, method, sender, note, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?) RETURNING *")
      .bind(s.id, plan, course || plan, Math.round(amount * 100) / 100, currency, method, sender, note, now).first();
    return json({ ok: true, request: publicRequest(r) });
  } catch (e) { return fail(e); }
}
