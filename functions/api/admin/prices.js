// Admin: «الأسعار» — price per course (+ optional «before discount» price and a for-sale switch), the monthly / yearly
// «كل الكورسات» prices and the payment numbers.   GET → {prices, products, paywall}   POST {courses: {id: {price, was, on}}, monthly, yearly, instapay, vodafone, whatsapp}
import { getDb, readBody, json, fail } from "../../_lib/auth.js";
import { requireAdmin, logAction } from "../../_lib/admin.js";
import { paywallOn } from "../../_lib/plan.js";
import { PRODUCTS, PRODUCT_IDS, getPrices, cleanPrices, savePrices } from "../../_lib/products.js";

const products = () => PRODUCT_IDS.map(id => ({ id, title: PRODUCTS[id].title }));

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    await requireAdmin(db, request);
    return json({ ok: true, prices: await getPrices(db), products: products(), paywall: paywallOn(env) });
  } catch (e) { return fail(e); }
}

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const me = await requireAdmin(db, request);
    const p = await savePrices(db, cleanPrices(body));
    const summary = PRODUCT_IDS.map(id => { const c = p.courses[id]; return PRODUCTS[id].title + ": " + (c.price ? c.price + (c.on ? "" : " (مقفول)") : "—"); }).join(" · ") +
      " · شهري " + (p.monthly || "—") + " · سنوي " + (p.yearly || "—");
    await logAction(db, me, "prices", null, summary);
    return json({ ok: true, prices: p, products: products(), paywall: paywallOn(env) });
  } catch (e) { return fail(e); }
}
