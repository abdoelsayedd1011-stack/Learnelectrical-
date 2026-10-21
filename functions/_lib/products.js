// «كل كورس بسعر»: each course is a product bought once for lifetime access. A product covers its course's own
// pages plus the simulators listed in `dirs`. The monthly / yearly Pro plan stays as «كل الكورسات» (every product).
// Prices, the «for sale» switch and the payment numbers are set from /admin.html («الأسعار»), stored as JSON in
// settings (k = 'prices') and read publicly from /api/prices. site-config.js (SITE.pay) is only the fallback.
// Ownership lives in user_courses (see _lib/auth.js); gating is in functions/_middleware.js.
import { HttpError } from "./auth.js";
import { cleanText } from "./pay.js";

// ids match _lib/courses.js (certificates) so one id means one course everywhere.
export const PRODUCTS = {
  basics:  { title: "أساسيات الكهربا",          dirs: ["basics-lab"] },
  classic: { title: "الكلاسيك كنترول",           dirs: ["classic-control-lab"] },
  drw:     { title: "قراية الرسومات الكهربية",   dirs: ["drawings-lab"] },
  instr:   { title: "الإنسترومنتيشن",            dirs: ["instrumentation-lab", "e5cc-lab"] }, // E5CC: temperature control (thermocouple / PT100)
  plc:     { title: "الـ PLC",                    dirs: ["plc-lab"] },                         // includes the Siemens / Delta / AB brand pages
  vfd:     { title: "الانفرتر VFD",               dirs: ["vfd-course", "vfd-simulator", "ab1336-simulator", "pf40-lab", "v20-lab", "atv320-lab", "atv630-lab",
                                                         "ms300-lab", "fc51-lab", "acs580-lab", "g120-lab", "fre800-lab", "ga500-lab", "ig5a-lab", "gd20-lab", "c2000-lab", "frenic-lab"] },
  srv:     { title: "السيرفو موتور والدرايف",     dirs: ["servo-course", "servo-simulator", "mrje-servo", "sigma7-servo", "kinetix300-servo"] }
};
export const PRODUCT_IDS = Object.keys(PRODUCTS);
// Friendlier names in links (subscribe.html?course=servo) → product id
export const ALIASES = { drawings: "drw", servo: "srv", instrumentation: "instr", inverters: "vfd", vfdc: "vfd" };
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
  for (const id of PRODUCT_IDS) courses[id] = { price: null, was: null, on: false };
  return { courses, monthly: null, yearly: null, instapay: "", vodafone: "", whatsapp: "" };
}

export async function getPrices(db){
  const r = await db.prepare("SELECT v, updated_at FROM settings WHERE k = 'prices'").first();
  let p = null;
  try { p = r ? JSON.parse(r.v) : null; } catch (e) {}
  const out = emptyPrices();
  if (p && typeof p === "object"){
    for (const id of PRODUCT_IDS){
      const c = p.courses && p.courses[id];
      if (c) out.courses[id] = { price: Number(c.price) > 0 ? Number(c.price) : null, was: Number(c.was) > 0 ? Number(c.was) : null, on: c.on === true };
    }
    out.monthly = Number(p.monthly) > 0 ? Number(p.monthly) : null;
    out.yearly = Number(p.yearly) > 0 ? Number(p.yearly) : null;
    out.instapay = String(p.instapay || ""); out.vodafone = String(p.vodafone || ""); out.whatsapp = String(p.whatsapp || "");
  }
  out.updated_at = r ? r.updated_at : null;
  return out;
}

// A course is for sale when its switch is on and it has a price.
export function forSale(prices, id){
  const c = prices && prices.courses && prices.courses[id];
  return !!(c && c.on && c.price);
}

// Body from the «الأسعار» form → cleaned prices. Empty price = not for sale («قريب»).
export function cleanPrices(body){
  const out = emptyPrices();
  const src = body && typeof body.courses === "object" && body.courses ? body.courses : {};
  for (const id of PRODUCT_IDS){
    const c = src[id] || {};
    const p = price(c.price), was = price(c.was);
    out.courses[id] = { price: p, was: p && was && was > p ? was : null, on: c.on === true && !!p };
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
  return { ...p, updated_at: now };
}

// ---- ownership ----
export async function ownedCourses(db, userId){
  const r = await db.prepare("SELECT course, granted_at, source, note FROM user_courses WHERE user_id = ? ORDER BY granted_at ASC").bind(userId).all();
  return (r.results || []).filter(x => PRODUCTS[x.course]);
}
export async function ownsCourse(db, userId, id){
  return !!(await db.prepare("SELECT 1 AS x FROM user_courses WHERE user_id = ? AND course = ?").bind(userId, id).first());
}
// Returns true when the course was newly granted (false: they already had it).
export async function grantCourse(db, userId, id, source, note){
  const r = await db.prepare("INSERT OR IGNORE INTO user_courses (user_id, course, granted_at, source, note) VALUES (?, ?, ?, ?, ?)")
    .bind(userId, id, Date.now(), source, note == null ? null : String(note).slice(0, 300)).run();
  return !!(r.meta && r.meta.changes);
}
export async function removeCourse(db, userId, id){
  const r = await db.prepare("DELETE FROM user_courses WHERE user_id = ? AND course = ?").bind(userId, id).run();
  return !!(r.meta && r.meta.changes);
}
