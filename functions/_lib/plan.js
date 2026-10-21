// Paid plan (Pro) — prepared but OFF. While the paywall is off, every member opens every page exactly as before
// (guests: PowerFlex 525 + lessons 1–2 of each course; members: everything), and «تفعيل اشتراك» in the admin
// dashboard only records users.plan / users.pro_until.
//
// How to turn it on (no other code changes needed):
//   • Cloudflare dashboard → Pages project → Settings → Variables and Secrets → add PAYWALL_ON = true → redeploy, or
//   • change `PAYWALL_ON = false` below to `true` and deploy.
//   (The env variable wins when it is set; PAYWALL_ON = false in the dashboard turns it back off.)
// Then member-only pages need plan 'pro' with pro_until in the future; free members are sent to
// /account.html?need=pro. The free pages stay open for everyone, and admins (ADMIN_EMAILS) always get in.
// Activate / extend / cancel a member from /admin.html («تفعيل اشتراك»). Before switching on, add a way to pay
// and a pricing page, and update the «مجاني» wording on the course pages and FAQs.

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
