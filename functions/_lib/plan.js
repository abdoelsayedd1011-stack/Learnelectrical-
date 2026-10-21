// Paid plan (Pro) — prepared but OFF. While the paywall is off, every member opens every page exactly as before
// (guests: PowerFlex 525 + the free lessons of each course; members: everything), and «تفعيل اشتراك» in the admin
// dashboard only records users.plan / users.pro_until.
//
// How to turn it on (no other code changes needed):
//   • Cloudflare dashboard → Pages project → Settings → Variables and Secrets → add PAYWALL_ON = true → redeploy, or
//   • change `PAYWALL_ON = false` below to `true` and deploy.
//   (The env variable wins when it is set; PAYWALL_ON = false in the dashboard turns it back off.)
// Then a member-only page needs one of: the course it belongs to (bought for one year, see _lib/products.js ACCESS_DAYS),
// plan 'pro' with pro_until in the future («كل الكورسات» monthly / yearly), or an admin account (ADMIN_EMAILS).
// Others are sent to /subscribe.html?course=<id>. The free pages and free lessons stay open for everyone.
// Set the prices, the for-sale switches and the payment numbers from /admin.html («الأسعار»); approve payment
// requests there («طلبات الاشتراك»), or give a member a course from their window («إدّيله كورس»).
// Before switching on, update the «مجاني» wording on the course pages and FAQs.

export const PAYWALL_ON = false;

export function paywallOn(env){
  const v = env && env.PAYWALL_ON;
  if (v === undefined || v === null || String(v).trim() === "") return PAYWALL_ON;
  return /^(1|true|on|yes)$/i.test(String(v).trim());
}

// user: a row/publicUser with plan and pro_until (ms since epoch)
export function isPro(user, now = Date.now()){
  return !!user && user.plan === "pro" && Number(user.pro_until) > now;
}

// 23:59:59 Cairo time (UTC+2) on the Cairo calendar day that contains `ms`.
export function cairoEndOfDay(ms){
  const d = new Date(ms + 2 * 3600 * 1000);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59) - 2 * 3600 * 1000;
}

// Set a member's plan: until = ms (Pro until then) or null (back to free). Returns false when the member doesn't exist.
// Used by /api/admin/plan («تفعيل اشتراك») and /api/admin/pay (approving a payment request).
export async function setPlan(db, id, until){
  const plan = until ? "pro" : "free";
  const r = await db.prepare("UPDATE users SET plan = ?, pro_until = ? WHERE id = ?").bind(plan, until || null, id).run();
  return !!(r.meta && r.meta.changes);
}

// Days of Pro each paid plan buys. A renewal adds them on top of a Pro plan that hasn't ended yet.
export const PLAN_DAYS = { monthly: 30, yearly: 365 };
export function extendedUntil(user, days, now = Date.now()){
  const base = isPro(user, now) ? Number(user.pro_until) : now;
  return cairoEndOfDay(base + days * 864e5);
}
