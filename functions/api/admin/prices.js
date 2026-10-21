// Admin: «الأسعار» — per course: EGP price (+ optional «before discount»), USD price for buyers outside Egypt (+ optional
// «before discount»), an optional card-payment link, and a for-sale switch; plus the payment numbers. Empty boxes fall back
// to DEFAULT_PRICES (_lib/products.js). The monthly / yearly «كل الكورسات» bundle is no longer sold.
// GET → {prices, products, defaults, paywall}   POST {courses: {id: {price, was, usd, usd_was, link, on}}, instapay, vodafone, whatsapp}
import { getDb, readBody, json, fail } from "../../_lib/auth.js";
import { requireAdmin, logAction } from "../../_lib/admin.js";
import { paywallOn } from "../../_lib/plan.js";
import { PRODUCTS, PRODUCT_IDS, DEFAULT_PRICES, getPrices, cleanPrices, savePrices } from "../../_lib/products.js";

const products = () => PRODUCT_IDS.map(id => ({ id, title: PRODUCTS[id].title }));

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    await requireAdmin(db, request);
    return json({ ok: true, prices: await getPrices(db), products: products(), defaults: DEFAULT_PRICES, paywall: paywallOn(env) });
  } catch (e) { return fail(e); }
}

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const me = await requireAdmin(db, request);
    const p = await savePrices(db, cleanPrices(body));
    const summary = PRODUCT_IDS.map(id => { const c = p.courses[id]; return PRODUCTS[id].title + ": " + c.price + " ج / $" + c.usd + (c.link ? " + لينك" : "") + (c.on ? "" : " (مقفول)"); }).join(" · ");
    await logAction(db, me, "prices", null, summary);
    return json({ ok: true, prices: p, products: products(), defaults: DEFAULT_PRICES, paywall: paywallOn(env) });
  } catch (e) { return fail(e); }
}
