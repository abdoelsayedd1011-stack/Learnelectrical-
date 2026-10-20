// Shared helpers for the account API (Cloudflare Pages Functions + D1).
// D1 binding name: DB  (Pages project → Settings → Bindings → D1 database → Variable name: DB)

const enc = new TextEncoder();
export const COOKIE = "le_sess";
const SESSION_DAYS = 30;
const PBKDF2_ITER = 100000; // Workers' WebCrypto max for PBKDF2
const MAX_FAILS = 8, FAIL_WINDOW = 15 * 60 * 1000;

const MSG = {
  no_db: "الحسابات لسه مش متفعّلة على السيرفر. جرّب كمان شوية.",
  bad_request: "الطلب مش مفهوم، حدّث الصفحة وجرّب تاني.",
  bad_name: "اكتب اسمك (من 2 لـ 60 حرف).",
  bad_email: "الإيميل مكتوب غلط.",
  bad_password: "الباسورد لازم يكون 8 حروف أو أرقام على الأقل.",
  email_taken: "الإيميل ده عليه حساب قبل كده. ادخل بيه بدل ما تعمل حساب جديد.",
  wrong_login: "الإيميل أو الباسورد غلط.",
  too_many: "محاولات كتير غلط. استنى ربع ساعة وجرّب تاني.",
  not_logged_in: "انت مش داخل بحساب.",
  server: "حصلت مشكلة في السيرفر. جرّب تاني بعد شوية."
};

export class HttpError extends Error {
  constructor(status, code){ super(code); this.status = status; this.code = code; }
}

export function json(data, status = 200, headers = {}){
  return new Response(JSON.stringify(data), {
    status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}

export function fail(err){
  if (err instanceof HttpError) return json({ ok: false, error: err.code, message: MSG[err.code] || MSG.server }, err.status);
  console.error(err);
  return json({ ok: false, error: "server", message: MSG.server }, 500);
}

let schemaReady = false;
export async function getDb(env){
  if (!env.DB) throw new HttpError(503, "no_db");
  if (!schemaReady){
    await env.DB.batch([
      env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, pass_hash TEXT NOT NULL, pass_salt TEXT NOT NULL, plan TEXT NOT NULL DEFAULT 'free', created_at INTEGER NOT NULL)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at INTEGER NOT NULL)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS login_fails (email TEXT PRIMARY KEY, count INTEGER NOT NULL, first_at INTEGER NOT NULL)")
    ]);
    schemaReady = true;
  }
  return env.DB;
}

// JSON-only POSTs from our own origin (blocks cross-site form posts).
export async function readBody(request){
  const ct = request.headers.get("content-type") || "";
  if (!ct.startsWith("application/json")) throw new HttpError(415, "bad_request");
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, "bad_request");
  try { const b = await request.json(); if (b && typeof b === "object") return b; } catch (e) {}
  throw new HttpError(400, "bad_request");
}

export function cleanEmail(v){
  const e = String(v || "").trim().toLowerCase();
  if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) throw new HttpError(400, "bad_email");
  return e;
}
export function cleanName(v){
  const n = String(v || "").replace(/\s+/g, " ").trim();
  if (n.length < 2 || n.length > 60) throw new HttpError(400, "bad_name");
  return n;
}
export function checkPassword(v){
  const p = String(v || "");
  if (p.length < 8 || p.length > 128) throw new HttpError(400, "bad_password");
  return p;
}

const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const hex = buf => [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, "0")).join("");

export function newSalt(){ return b64(crypto.getRandomValues(new Uint8Array(16))); }

export async function hashPassword(password, salt){
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: unb64(salt), iterations: PBKDF2_ITER }, key, 256);
  return b64(bits);
}

export function sameString(a, b){
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function sha256(s){ return hex(await crypto.subtle.digest("SHA-256", enc.encode(s))); }

function readCookie(request, name){
  const m = (request.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

function cookieHeader(request, value, maxAge){
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export async function startSession(db, request, userId){
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const now = Date.now();
  await db.batch([
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at < ?").bind(userId, now),
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").bind(await sha256(token), userId, now + SESSION_DAYS * 864e5)
  ]);
  return cookieHeader(request, token, SESSION_DAYS * 86400);
}

export function clearCookie(request){ return cookieHeader(request, "", 0); }

export async function sessionUser(db, request){
  const token = readCookie(request, COOKIE);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const th = await sha256(token);
  const row = await db.prepare("SELECT u.id, u.name, u.email, u.plan, u.created_at, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?").bind(th).first();
  if (!row) return null;
  if (row.expires_at < Date.now()){ await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(th).run(); return null; }
  return { token_hash: th, user: publicUser(row) };
}

export function publicUser(u){ return { name: u.name, email: u.email, plan: u.plan, created_at: u.created_at }; }

// Simple per-email lockout after repeated wrong passwords.
export async function checkFails(db, email){
  const r = await db.prepare("SELECT count, first_at FROM login_fails WHERE email = ?").bind(email).first();
  if (r && r.count >= MAX_FAILS && Date.now() - r.first_at < FAIL_WINDOW) throw new HttpError(429, "too_many");
}
export async function noteFail(db, email){
  const now = Date.now();
  await db.prepare("INSERT INTO login_fails (email, count, first_at) VALUES (?, 1, ?) ON CONFLICT(email) DO UPDATE SET count = CASE WHEN ? - first_at > ? THEN 1 ELSE count + 1 END, first_at = CASE WHEN ? - first_at > ? THEN ? ELSE first_at END")
    .bind(email, now, now, FAIL_WINDOW, now, FAIL_WINDOW, now).run();
}
export async function clearFails(db, email){ await db.prepare("DELETE FROM login_fails WHERE email = ?").bind(email).run(); }
