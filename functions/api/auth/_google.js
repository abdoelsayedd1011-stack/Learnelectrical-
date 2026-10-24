// Shared bits of «ادخل بجوجل» (Google sign-in with OpenID Connect).
// Setup, once, by the site owner:
//   1. Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.
//      Authorized redirect URI: https://www.learnelectricals.com/api/auth/google/callback
//   2. Cloudflare Pages project → Settings → Variables and Secrets: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (secret).
// Without GOOGLE_CLIENT_ID the button stays hidden (/api/auth/me says google:false).
// Variables set in Cloudflare only apply from the next deployment, so push any commit after setting them.
export const OAUTH_COOKIE = "le_oauth";

export function oauthCookie(request, value, maxAge){
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${OAUTH_COOKIE}=${value}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function redirectUri(request){
  const u = new URL(request.url);
  return `${u.protocol}//${u.host}/api/auth/google/callback`;
}

// Only same-site paths are allowed as the page to land on after signing in.
export function safeNext(n, fallback){
  n = String(n || "");
  return /^\/(?!\/)[^\s\\]*$/.test(n) ? n : fallback;
}

export function loginPage(next){
  return /^\/en\//.test(next || "") ? "/en/login.html" : "/login.html";
}
