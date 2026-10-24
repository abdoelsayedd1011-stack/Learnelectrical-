// GET /api/auth/google?next=/account.html → sends the visitor to Google to pick their account (see _google.js for setup).
import { OAUTH_COOKIE, oauthCookie, redirectUri, safeNext, loginPage } from "./_google.js";

function hex(buf){ return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join(""); }

export async function onRequestGet({ request, env }){
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"), "/account.html");
  if (!env.GOOGLE_CLIENT_ID) return Response.redirect(`${url.origin}${loginPage(next)}?err=no_google`, 303);
  const state = hex(crypto.getRandomValues(new Uint8Array(16)));
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  auth.searchParams.set("redirect_uri", redirectUri(request));
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "openid email profile");
  auth.searchParams.set("state", state);
  auth.searchParams.set("prompt", "select_account");
  return new Response(null, {
    status: 303,
    headers: {
      location: auth.toString(),
      "cache-control": "no-store",
      // state + where to go afterwards; read back in google/callback.js and cleared there
      "set-cookie": oauthCookie(request, `${state}.${encodeURIComponent(next)}`, 600)
    }
  });
}
