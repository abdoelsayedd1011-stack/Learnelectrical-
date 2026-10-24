// Who can open /admin.html and call /api/admin/*.
import { sessionUser, HttpError } from "./auth.js";

// اكتب إيميلات الإدارة هنا بحروف صغيرة، مثال: ["you@example.com"]. وهي فاضية محدش يقدر يدخل لوحة الإدارة.
export const ADMIN_EMAILS = ["abdoelsayedd1011@gmail.com", "mohamedabohabsa84@gmail.com"];

export function isAdmin(user){
  return !!(user && user.email && ADMIN_EMAILS.map(e => String(e).trim().toLowerCase()).includes(String(user.email).toLowerCase()));
}

export async function requireAdmin(db, request){
  const s = await sessionUser(db, request);
  if (!s) throw new HttpError(401, "not_logged_in");
  if (!isAdmin(s.user)) throw new HttpError(403, "forbidden");
  return s;
}

// «سجل العمليات»: one row per admin action. me = requireAdmin(...) result; target = {id, email} of the member (or null).
// A failed log write never undoes or blocks the action itself.
export async function logAction(db, me, action, target, details){
  try {
    await db.prepare("INSERT INTO admin_log (at, admin_id, admin_email, action, target_id, target_email, details) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(Date.now(), me.id, me.user.email, action, target ? target.id : null, target ? target.email : null,
        details == null ? null : String(details).slice(0, 500)).run();
  } catch (e) { console.error(e); }
}

// A member id from a request body or query string, or 400.
export function memberId(v){
  const id = Number(v);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "bad_request");
  return id;
}

// WHERE clause for the member list and its CSV export. q searches email or name; f is one of
// "pro" (مشترك), "free" (مجاني), "suspended" (موقوف), "idle" (مدخلش من 30 يوم), or "" for everyone.
export const FILTERS = ["pro", "free", "suspended", "idle"];
export function memberWhere(q, f, now = Date.now()){
  const parts = [], binds = [];
  if (q){
    parts.push("(u.email LIKE ? ESCAPE '\\' OR u.name LIKE ? ESCAPE '\\')");
    const like = "%" + q.replace(/[\\%_]/g, c => "\\" + c) + "%";
    binds.push(like, like);
  }
  if (f === "pro"){ parts.push("(u.plan = 'pro' AND u.pro_until > ?)"); binds.push(now); }
  else if (f === "free"){ parts.push("NOT (u.plan = 'pro' AND COALESCE(u.pro_until, 0) > ?)"); binds.push(now); }
  else if (f === "suspended") parts.push("COALESCE(u.suspended, 0) = 1");
  else if (f === "idle"){ parts.push("COALESCE(u.last_seen, u.created_at) < ?"); binds.push(now - 30 * 864e5); }
  return { where: parts.length ? " WHERE " + parts.join(" AND ") : "", binds };
}
