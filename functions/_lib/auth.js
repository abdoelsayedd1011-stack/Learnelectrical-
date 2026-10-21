// Shared helpers for the account API (Cloudflare Pages Functions + D1).
// D1 binding name: DB  (Pages project → Settings → Bindings → D1 database → Variable name: DB)

const enc = new TextEncoder();
export const COOKIE = "le_sess";
const SESSION_DAYS = 30;
const PBKDF2_ITER = 100000; // Workers' WebCrypto max for PBKDF2
const MAX_FAILS = 8, FAIL_WINDOW = 15 * 60 * 1000;
// Devices signed in at once per member (stops one account being shared). A new login past this signs out the oldest device.
// Override from Cloudflare (Pages project → Settings → Variables and Secrets) with MAX_DEVICES = 3, for example.
export const MAX_DEVICES = 2;

const MSG = {
  no_db: "الحسابات لسه مش متفعّلة على السيرفر. جرّب كمان شوية.",
  bad_request: "الطلب مش مفهوم، حدّث الصفحة وجرّب تاني.",
  bad_name: "اكتب اسمك (من 2 لـ 60 حرف).",
  bad_email: "الإيميل مكتوب غلط.",
  bad_password: "الباسورد لازم يكون 8 حروف أو أرقام على الأقل.",
  email_taken: "الإيميل ده عليه حساب قبل كده. ادخل بيه بدل ما تعمل حساب جديد.",
  wrong_login: "الإيميل أو الباسورد غلط. لو دي أول مرة ليك، اعمل «حساب جديد» الأول.",
  too_many: "محاولات كتير غلط. استنى ربع ساعة وجرّب تاني.",
  not_logged_in: "انت مش داخل بحساب.",
  too_big: "التقدّم ده أكبر من المسموح.",
  bad_token: "اللينك ده مش شغال أو مدته خلصت. اطلب لينك جديد على واتساب.",
  forbidden: "الصفحة دي للإدارة بس.",
  not_found: "العضو ده مش موجود.",
  too_many_pending: "عندك طلبات اشتراك كتير لسه بنراجعها. استنى لما نراجعها، أو كلّمنا على واتساب.",
  already_done: "الطلب ده اتراجع قبل كده.",
  not_complete: "لسه مخلّصتش الكورس ده. كمّل كل الدروس والتمارين الأول.",
  suspended: "الحساب ده موقوف، كلّم الإدارة.",
  self_action: "مينفعش تعمل كده في حسابك انت.",
  already_owned: "الكورس ده عندك خلاص.",
  not_for_sale: "الكورس ده لسه مش متاح للشرا.",
  bad_phone: "الرقم مكتوب غلط. اكتبه أرقام بس، مثال: 01001234567",
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
      env.DB.prepare("CREATE TABLE IF NOT EXISTS login_fails (email TEXT PRIMARY KEY, count INTEGER NOT NULL, first_at INTEGER NOT NULL)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS progress (user_id INTEGER NOT NULL, k TEXT NOT NULL, v TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (user_id, k))"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS certificates (code TEXT PRIMARY KEY, user_id INTEGER NOT NULL, name TEXT NOT NULL, course TEXT NOT NULL, issued_at INTEGER NOT NULL, UNIQUE (user_id, course))"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS resets (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0)"),
      // Site settings set from the admin dashboard (k = 'banner': the announcement bar, see /api/banner).
      env.DB.prepare("CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT NOT NULL, updated_at INTEGER NOT NULL)"),
      // «سجل العمليات»: what each admin did, newest first in /admin.html.
      env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_log (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, admin_id INTEGER, admin_email TEXT NOT NULL, action TEXT NOT NULL, target_id INTEGER, target_email TEXT, details TEXT)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS admin_log_at ON admin_log (at)"),
      // Courses a member owns for life (bought one course, or given by an admin). See _lib/products.js.
      env.DB.prepare("CREATE TABLE IF NOT EXISTS user_courses (user_id INTEGER NOT NULL, course TEXT NOT NULL, granted_at INTEGER NOT NULL, source TEXT NOT NULL, note TEXT, PRIMARY KEY (user_id, course))")
    ]);
    // Columns added after launch: "duplicate column" on databases that already have them is fine.
    try { await env.DB.prepare("ALTER TABLE users ADD COLUMN last_seen INTEGER").run(); } catch (e) {}
    try { await env.DB.prepare("ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'").run(); } catch (e) {}
    try { await env.DB.prepare("ALTER TABLE users ADD COLUMN pro_until INTEGER").run(); } catch (e) {} // Pro ends here (ms); see _lib/plan.js
    try { await env.DB.prepare("ALTER TABLE users ADD COLUMN suspended INTEGER NOT NULL DEFAULT 0").run(); } catch (e) {} // 1 = «موقوف» from the admin dashboard
    try { await env.DB.prepare("ALTER TABLE users ADD COLUMN suspend_reason TEXT").run(); } catch (e) {}
    try { await env.DB.prepare("ALTER TABLE users ADD COLUMN suspended_at INTEGER").run(); } catch (e) {}
    try { await env.DB.prepare("ALTER TABLE users ADD COLUMN admin_note TEXT").run(); } catch (e) {} // private admin notes, never sent to the member
    try { await env.DB.prepare("ALTER TABLE users ADD COLUMN admin_note_at INTEGER").run(); } catch (e) {}
    // Per-device info for «الأجهزة»: browser + OS summary and country only (no IP address is stored).
    try { await env.DB.prepare("ALTER TABLE sessions ADD COLUMN created_at INTEGER").run(); } catch (e) {}
    try { await env.DB.prepare("ALTER TABLE sessions ADD COLUMN last_seen INTEGER").run(); } catch (e) {}
    try { await env.DB.prepare("ALTER TABLE sessions ADD COLUMN device TEXT").run(); } catch (e) {}
    try { await env.DB.prepare("ALTER TABLE sessions ADD COLUMN country TEXT").run(); } catch (e) {}
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

export async function sha256(s){ return hex(await crypto.subtle.digest("SHA-256", enc.encode(s))); }

export function readCookie(request, name){
  const m = (request.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

function cookieHeader(request, value, maxAge){
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function maxDevices(env){
  const n = parseInt(env && env.MAX_DEVICES, 10);
  return n >= 1 && n <= 20 ? n : MAX_DEVICES;
}

// "Chrome · Android" from a user-agent string: a rough label for the admin's device list, not for any check.
export function deviceLabel(ua){
  ua = String(ua || "");
  const os = /Windows/i.test(ua) ? "Windows" : /iPhone|iPod/i.test(ua) ? "iPhone" : /iPad/i.test(ua) ? "iPad" : /Android/i.test(ua) ? "Android"
    : /CrOS/i.test(ua) ? "ChromeOS" : /Mac OS X|Macintosh/i.test(ua) ? "Mac" : /Linux/i.test(ua) ? "Linux" : "";
  const br = /Edg(?:e|A|iOS)?\//i.test(ua) ? "Edge" : /OPR\/|Opera/i.test(ua) ? "Opera" : /SamsungBrowser/i.test(ua) ? "Samsung Internet"
    : /Firefox|FxiOS/i.test(ua) ? "Firefox" : /Chrome|CriOS|Chromium/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : "";
  return [br, os].filter(Boolean).join(" · ") || "جهاز مش معروف";
}

// New session for this device; past maxDevices(env) the member's oldest sessions are signed out.
export async function startSession(db, request, userId, env){
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const now = Date.now();
  const cf = request.cf || {};
  const country = /^[A-Z]{2}$/.test(String(cf.country || "")) ? cf.country : null;
  await db.batch([
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at < ?").bind(userId, now),
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at, last_seen, device, country) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(await sha256(token), userId, now + SESSION_DAYS * 864e5, now, now, deviceLabel(request.headers.get("user-agent")), country),
    // sessions from before devices were tracked have no created_at: they count as the oldest
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash NOT IN (SELECT token_hash FROM sessions WHERE user_id = ? ORDER BY COALESCE(created_at, 0) DESC, rowid DESC LIMIT ?)").bind(userId, userId, maxDevices(env))
  ]);
  return cookieHeader(request, token, SESSION_DAYS * 86400);
}

export function clearCookie(request){ return cookieHeader(request, "", 0); }

export async function sessionUser(db, request){
  const token = readCookie(request, COOKIE);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const th = await sha256(token);
  const row = await db.prepare("SELECT u.id, u.name, u.email, u.plan, u.pro_until, u.created_at, u.suspended, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?").bind(th).first();
  if (!row || row.suspended) return null; // a suspended member counts as signed out everywhere
  if (row.expires_at < Date.now()){ await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(th).run(); return null; }
  return { token_hash: th, id: row.id, user: publicUser(row) };
}

// "Last active" for the admin list (and its «متصل دلوقتي» dot); written at most once a minute per member,
// and per device (session) when tokenHash is given.
export async function touchUser(db, userId, tokenHash){
  const now = Date.now();
  try { await db.prepare("UPDATE users SET last_seen = ? WHERE id = ? AND (last_seen IS NULL OR last_seen < ?)").bind(now, userId, now - 60 * 1000).run(); } catch (e) {}
  if (tokenHash) try { await db.prepare("UPDATE sessions SET last_seen = ? WHERE token_hash = ? AND (last_seen IS NULL OR last_seen < ?)").bind(now, tokenHash, now - 60 * 1000).run(); } catch (e) {}
}

export function newToken(){ return hex(crypto.getRandomValues(new Uint8Array(32))); }

export function publicUser(u){ return { name: u.name, email: u.email, plan: u.plan, pro_until: u.pro_until || null, created_at: u.created_at }; }

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
