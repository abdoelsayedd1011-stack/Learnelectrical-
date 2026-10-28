// «كل كورس بسعر»: each course is a product bought for one year (ACCESS_DAYS). A product covers its course's own
// pages plus the simulators listed in `dirs`. The monthly / yearly Pro plan («كل الكورسات») is no longer sold, but
// existing Pro grants still open every product (see _lib/plan.js).
// Prices, the «for sale» switch and the payment numbers are set from /admin.html («الأسعار»), stored as JSON in
// settings (k = 'prices') and read publicly from /api/prices. site-config.js (SITE.pay) is only the fallback.
// Ownership lives in user_courses (see _lib/auth.js); gating is in functions/_middleware.js.
import { HttpError } from "./auth.js";
import { cleanText } from "./pay.js";
import { cairoEndOfDay } from "./plan.js";

// A bought or granted course stays open for this many days. Buying again (or «مدّ سنة» in the admin member
// window) while it is still open adds a year on top of the current end date.
export const ACCESS_DAYS = 365; // 1 year. Change here only; the pages say «سنة كاملة» / "1 year" (assets/pay.js, assets/i18n-en.js, assets/admin.js, subscribe.html, refund.html)
// Prices used when the «الأسعار» tab has no price saved for a course: EGP (price, was = before discount) and USD for
// buyers outside Egypt (usd, usd_was). The admin tab overrides each one; a cleared box falls back to its default here.
// link: the course's Gumroad page (card payment from outside Egypt); the admin can override it in «الأسعار».
export const DEFAULT_PRICES = {
  basics:  { price: 299, was: 449, usd: 25, usd_was: 39, link: "https://learnelectricals.gumroad.com/l/cmweg" },
  drw:     { price: 299, was: 449, usd: 25, usd_was: 39, link: "https://learnelectricals.gumroad.com/l/Drawing" },
  classic: { price: 449, was: 649, usd: 35, usd_was: 55, link: "https://learnelectricals.gumroad.com/l/Classiccontrol" },
  safety:  { price: 499, was: 749, usd: 39, usd_was: 59, link: "" },
  instr:   { price: 499, was: 749, usd: 39, usd_was: 59, link: "https://learnelectricals.gumroad.com/l/Instrumentation" },
  vfd:     { price: 499, was: 749, usd: 39, usd_was: 59, link: "https://learnelectricals.gumroad.com/l/VFD" },
  srv:     { price: 499, was: 749, usd: 39, usd_was: 59, link: "https://learnelectricals.gumroad.com/l/Servo" },
  plc:     { price: 749, was: 999, usd: 59, usd_was: 89, link: "https://learnelectricals.gumroad.com/l/PLC" },
  iiot:    { price: 599, was: 849, usd: 49, usd_was: 69, link: "https://learnelectricals.gumroad.com/l/jpjhhd" },
  scada:   { price: 599, was: 849, usd: 49, usd_was: 69, link: "https://learnelectricals.gumroad.com/l/kaebwcv" },
  panel:   { price: 599, was: 849, usd: 49, usd_was: 69, link: "https://learnelectricals.gumroad.com/l/Electricalpanel" }
};

// ids match _lib/courses.js (certificates) so one id means one course everywhere.
export const PRODUCTS = {
  basics:  { title: "أساسيات الكهربا",          dirs: ["basics-lab"] },
  classic: { title: "الكلاسيك كنترول",           dirs: ["classic-control-lab"] },
  safety:  { title: "السيفتي PLC",               dirs: ["safety-lab"] },                    // RT9, Vital 1, Pluto B20
  drw:     { title: "قراية الرسومات الكهربية",   dirs: ["drawings-lab"] },
  instr:   { title: "الإنسترومنتيشن",            dirs: ["instrumentation-lab", "e5cc-lab", "clm223-lab"] }, // E5CC: temperature control (thermocouple / PT100)
  plc:     { title: "الـ PLC",                    dirs: ["plc-lab"] },                         // includes the Siemens / Delta / AB brand pages
  vfd:     { title: "الانفرتر VFD",               dirs: ["vfd-course", "vfd-simulator", "ab1336-simulator", "pf40-lab", "v20-lab", "atv320-lab", "atv630-lab",
                                                         "ms300-lab", "fc51-lab", "vlt2800-lab", "acs580-lab", "g120-lab", "fre800-lab", "ga500-lab", "ig5a-lab", "gd20-lab", "c2000-lab", "frenic-lab"] },
  srv:     { title: "السيرفو موتور والدرايف",     dirs: ["servo-course", "servo-simulator", "mrje-servo", "sigma7-servo", "kinetix300-servo"] },
  iiot:    { title: "IIoT والشبكات الصناعية",      dirs: ["iiot-lab"] },
  scada:   { title: "SCADA و HMI",                 dirs: ["scada-lab"] },
  panel:   { title: "تصميم اللوحات الكهربية",      dirs: ["panel-lab"] }
};
export const PRODUCT_IDS = Object.keys(PRODUCTS);
// Friendlier names in links (subscribe.html?course=servo) → product id
export const ALIASES = { "safety-plc": "safety", drawings: "drw", servo: "srv", instrumentation: "instr", inverters: "vfd", vfdc: "vfd", networks: "iiot", "industrial-networks": "iiot", hmi: "scada", "scada-hmi": "scada", panels: "panel", "panel-design": "panel", "electrical-panels": "panel" };
export function productId(v){
  const s = String(v || "").trim().toLowerCase();
  const id = ALIASES[s] || s;
  return PRODUCTS[id] ? id : null;
}

const DIR_PRODUCT = {};
for (const id of PRODUCT_IDS) for (const d of PRODUCTS[id].dirs) DIR_PRODUCT[d] = id;
export function productOfDir(dir){ return DIR_PRODUCT[dir] || null; }

// ---- prices (settings k = 'prices') ----
const MAX_PRICE = 1000000;
function price(v){
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > MAX_PRICE) throw new HttpError(400, "bad_request");
  return n > 0 ? Math.round(n * 100) / 100 : null;
}

function emptyPrices(){
  const courses = {};
  for (const id of PRODUCT_IDS) courses[id] = { price: null, was: null, usd: null, usd_was: null, link: "", on: false };
  return { courses, monthly: null, yearly: null, instapay: "", vodafone: "", whatsapp: "" };
}
const pos = v => Number(v) > 0 ? Number(v) : null;
const cleanLink = v => { const s = String(v == null ? "" : v).trim(); return /^https:\/\/[^\s"<>]{3,500}$/i.test(s) ? s : ""; };
// One course with the defaults filled in. A course that was never saved is for sale («للبيع») at its defaults.
function withDefaults(id, c){
  const d = DEFAULT_PRICES[id] || {};
  if (!c) return { price: d.price || null, was: d.was || null, usd: d.usd || null, usd_was: d.usd_was || null, link: d.link || "", on: !!d.price };
  const price = pos(c.price) || d.price || null, usd = pos(c.usd) || d.usd || null;
  const was = pos(c.price) ? pos(c.was) : pos(c.was) || d.was || null;
  const usdWas = pos(c.usd) ? pos(c.usd_was) : pos(c.usd_was) || d.usd_was || null;
  return { price, was: was && price && was > price ? was : null, usd, usd_was: usdWas && usd && usdWas > usd ? usdWas : null, link: cleanLink(c.link) || d.link || "", on: c.on === true && !!price };
}

export async function getPrices(db){
  const r = await db.prepare("SELECT v, updated_at FROM settings WHERE k = 'prices'").first();
  let p = null;
  try { p = r ? JSON.parse(r.v) : null; } catch (e) {}
  const out = emptyPrices();
  for (const id of PRODUCT_IDS) out.courses[id] = withDefaults(id, p && p.courses && p.courses[id]);
  if (p && typeof p === "object"){
    // monthly / yearly («كل الكورسات») are no longer sold; kept so old requests and Pro grants still read
    out.monthly = pos(p.monthly); out.yearly = pos(p.yearly);
    out.instapay = String(p.instapay || ""); out.vodafone = String(p.vodafone || ""); out.whatsapp = String(p.whatsapp || "");
  }
  out.updated_at = r ? r.updated_at : null;
  return out;
}

// A course is for sale when its switch is on and it has a price (EGP), or a USD price for buyers outside Egypt.
export function forSale(prices, id, currency = "EGP"){
  const c = prices && prices.courses && prices.courses[id];
  return !!(c && c.on && (currency === "USD" ? c.usd : c.price));
}

// Body from the «الأسعار» form → cleaned prices. An empty box = that course's default price; untick «للبيع» for «قريب».
export function cleanPrices(body){
  const out = emptyPrices();
  const src = body && typeof body.courses === "object" && body.courses ? body.courses : {};
  for (const id of PRODUCT_IDS){
    const c = src[id] || {};
    const link = String(c.link == null ? "" : c.link).trim();
    if (link && !cleanLink(link)) throw new HttpError(400, "bad_link");
    out.courses[id] = { price: price(c.price), was: price(c.was), usd: price(c.usd), usd_was: price(c.usd_was), link, on: c.on === true };
  }
  out.monthly = price(body.monthly); out.yearly = price(body.yearly);
  out.instapay = cleanText(body.instapay, 80) || "";
  const phone = v => { const s = String(v == null ? "" : v).replace(/[\s-]/g, ""); if (s && !/^\+?\d{6,15}$/.test(s)) throw new HttpError(400, "bad_phone"); return s.replace(/^\+/, ""); };
  out.vodafone = phone(body.vodafone);
  out.whatsapp = phone(body.whatsapp);
  return out;
}

export async function savePrices(db, p){
  const now = Date.now();
  await db.prepare("INSERT INTO settings (k, v, updated_at) VALUES ('prices', ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, updated_at = excluded.updated_at")
    .bind(JSON.stringify(p), now).run();
  return getPrices(db);
}

// ---- ownership ----
// Each row has expires_at (ms, Cairo end of day). Rows from before one-year access (expires_at NULL) count as
// granted_at + ACCESS_DAYS: same rule as a new purchase, dated from when they got it.
export function courseUntil(row){
  const e = Number(row && row.expires_at);
  return e > 0 ? e : cairoEndOfDay(Number(row && row.granted_at || 0) + ACCESS_DAYS * 864e5);
}
// Every course row of a member (expired ones too), with until (end of access) and active.
export async function ownedCourses(db, userId, now = Date.now()){
  const r = await db.prepare("SELECT course, granted_at, source, note, expires_at FROM user_courses WHERE user_id = ? ORDER BY granted_at ASC").bind(userId).all();
  return (r.results || []).filter(x => PRODUCTS[x.course]).map(x => { const until = courseUntil(x); return { ...x, until, active: until > now }; });
}
// Only the courses that are open now.
export async function activeCourses(db, userId, now = Date.now()){
  return (await ownedCourses(db, userId, now)).filter(x => x.active);
}
export async function ownsCourse(db, userId, id, now = Date.now()){
  const row = await db.prepare("SELECT granted_at, expires_at FROM user_courses WHERE user_id = ? AND course = ?").bind(userId, id).first();
  return !!row && courseUntil(row) > now;
}
// Give a member a course for ACCESS_DAYS: from today, or on top of the current end date while it is still open.
// Returns { until, renewed } (renewed: they already had a row for this course).
export async function grantCourse(db, userId, id, source, note, now = Date.now()){
  const old = await db.prepare("SELECT granted_at, expires_at FROM user_courses WHERE user_id = ? AND course = ?").bind(userId, id).first();
  const base = old && courseUntil(old) > now ? courseUntil(old) : now;
  const until = cairoEndOfDay(base + ACCESS_DAYS * 864e5);
  const n = note == null ? null : String(note).slice(0, 300);
  if (old) await db.prepare("UPDATE user_courses SET expires_at = ?, source = ?, note = COALESCE(?, note) WHERE user_id = ? AND course = ?").bind(until, source, n, userId, id).run();
  else await db.prepare("INSERT INTO user_courses (user_id, course, granted_at, source, note, expires_at) VALUES (?, ?, ?, ?, ?, ?)").bind(userId, id, now, source, n, until).run();
  return { until, renewed: !!old };
}
export async function removeCourse(db, userId, id){
  const r = await db.prepare("DELETE FROM user_courses WHERE user_id = ? AND course = ?").bind(userId, id).run();
  return !!(r.meta && r.meta.changes);
}
