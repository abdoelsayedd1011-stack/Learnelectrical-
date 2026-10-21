// Public: prices for the catalog, the course pages and /subscribe.html, cached for a minute.
// {paywall, courses: {id: {title, price, was} | {title, price: null}}, monthly, yearly, instapay, vodafone, whatsapp}
// A course that isn't for sale comes back with price null («قريب»). Empty values: the page falls back to site-config.js.
import { getDb, json } from "../_lib/auth.js";
import { paywallOn } from "../_lib/plan.js";
import { PRODUCTS, PRODUCT_IDS, getPrices, forSale } from "../_lib/products.js";

const CACHE = { "cache-control": "public, max-age=60" };

export async function onRequestGet({ env }){
  let p = null;
  try { p = await getPrices(await getDb(env)); } catch (e) {} // no DB: no prices, never an error
  const courses = {};
  for (const id of PRODUCT_IDS){
    const on = p && forSale(p, id), c = p && p.courses[id];
    courses[id] = { title: PRODUCTS[id].title, price: on ? c.price : null, was: on ? c.was : null };
  }
  return json({ ok: true, paywall: paywallOn(env), courses, monthly: p ? p.monthly : null, yearly: p ? p.yearly : null,
    instapay: p ? p.instapay : "", vodafone: p ? p.vodafone : "", whatsapp: p ? p.whatsapp : "" }, 200, CACHE);
}
