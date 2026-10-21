// Manual payments: a member transfers (InstaPay / Vodafone Cash, or the international link), then sends a request
// from /subscribe.html; an admin checks the transfer and approves it in /admin.html («طلبات الاشتراك»).
// Numbers and prices live in site-config.js (SITE.pay). The amount here is what the member's page showed;
// the admin always checks it against the real transfer before approving.
import { HttpError } from "./auth.js";

export const PLANS = ["monthly", "yearly"];
// plan = "course" for a single course bought for one year (ACCESS_DAYS); then product = the course id (_lib/products.js).
// For the monthly / yearly «كل الكورسات» plan, product = plan.
export const COURSE_PLAN = "course";
export const METHODS = ["instapay", "vodafone", "intl"];
export const MAX_PENDING = 3;   // pending requests per member
export const MAX_PER_DAY = 6;   // requests of any status per member in 24 hours

let ready = false;
export async function payTable(db){
  if (!ready){
    await db.batch([
      db.prepare("CREATE TABLE IF NOT EXISTS pay_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, plan TEXT NOT NULL, amount REAL NOT NULL, currency TEXT NOT NULL DEFAULT 'EGP', method TEXT NOT NULL, sender TEXT, note TEXT, status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL, decided_at INTEGER, pro_until INTEGER)"),
      db.prepare("CREATE INDEX IF NOT EXISTS pay_requests_user ON pay_requests (user_id, status)"),
      db.prepare("CREATE INDEX IF NOT EXISTS pay_requests_status ON pay_requests (status, created_at)")
    ]);
    try { await db.prepare("ALTER TABLE pay_requests ADD COLUMN product TEXT").run(); } catch (e) {} // added with «كل كورس بسعر»
    ready = true;
  }
  return db;
}

export function cleanText(v, max){
  const s = String(v == null ? "" : v).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").replace(/[ \t]+/g, " ").trim();
  if (s.length > max) throw new HttpError(400, "bad_request");
  return s || null;
}

export function publicRequest(r){
  return { id: r.id, plan: r.plan, product: r.product || r.plan, amount: r.amount, currency: r.currency, method: r.method, sender: r.sender, note: r.note,
    status: r.status, created_at: r.created_at, decided_at: r.decided_at || null, pro_until: r.pro_until || null };
}
