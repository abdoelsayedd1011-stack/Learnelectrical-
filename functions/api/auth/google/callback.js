// GET /api/auth/google/callback?code=…&state=… ← Google sends the visitor back here.
// Exchanges the code for an ID token, finds (or creates) the member by their Google email, and signs them in.
// A new member gets no password (pass_hash ""): they sign in with Google, and can set one from «حسابي» if they want.
import { getDb, cleanEmail, cleanName, startSession, readCookie } from "../../../_lib/auth.js";
import { OAUTH_COOKIE, oauthCookie, redirectUri, safeNext, loginPage } from "../_google.js";

function b64urlJson(s){
  s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))));
}

export async function onRequestGet({ request, env }){
  const url = new URL(request.url);
  const saved = readCookie(request, OAUTH_COOKIE) || "";
  const dot = saved.indexOf(".");
  const next = safeNext(dot > 0 ? decodeURIComponent(saved.slice(dot + 1)) : "", "/account.html");
  const clear = oauthCookie(request, "", 0);
  const back = (code) => new Response(null, { status: 303, headers: { location: `${url.origin}${loginPage(next)}?err=${code}`, "set-cookie": clear, "cache-control": "no-store" } });
  try {
    const code = url.searchParams.get("code"), state = url.searchParams.get("state");
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return back("no_google");
    if (url.searchParams.get("error")) return back("google_failed"); // the visitor cancelled on Google's page
    if (!code || !state || dot <= 0 || saved.slice(0, dot) !== state) return back("google_state"); // our cookie did not come back

    const tr = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri(request), grant_type: "authorization_code" })
    });
    const tok = await tr.json().catch(() => ({}));
    if (!tr.ok || !tok.id_token) {
      console.error("google token", tr.status, tok.error || "");
      // invalid_client = the secret in Cloudflare does not belong to this client ID
      return back(tok.error === "invalid_client" || tok.error === "unauthorized_client" ? "google_secret" : "google_token");
    }
    // The ID token came straight from Google over HTTPS, so its claims can be read without checking the signature.
    const claims = b64urlJson(String(tok.id_token).split(".")[1] || "");
    const issOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
    if (!issOk || claims.aud !== env.GOOGLE_CLIENT_ID || !claims.email || claims.email_verified !== true) return back("google_token");
    let email; try { email = cleanEmail(claims.email); } catch (e) { return back("google_failed"); }
    let name = ""; try { name = cleanName(claims.name || claims.given_name || ""); } catch (e) { name = email.split("@")[0].slice(0, 60) || "عضو"; }

    const db = await getDb(env);
    let u = await db.prepare("SELECT id, suspended FROM users WHERE email = ?").bind(email).first();
    if (!u){
      const res = await db.prepare("INSERT INTO users (email, name, pass_hash, pass_salt, created_at) VALUES (?, ?, '', '', ?)").bind(email, name, Date.now()).run();
      u = { id: res.meta.last_row_id, suspended: 0 };
    }
    if (u.suspended) return back("suspended");
    const session = await startSession(db, request, u.id, env);
    const h = new Headers({ location: `${url.origin}${next}`, "cache-control": "no-store" });
    h.append("set-cookie", session); h.append("set-cookie", clear);
    return new Response(null, { status: 303, headers: h });
  } catch (e) { console.error(e); return back("google_failed"); }
}
