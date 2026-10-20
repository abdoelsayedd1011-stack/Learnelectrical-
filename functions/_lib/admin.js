// Who can open /admin.html and call /api/admin/*.
import { sessionUser, HttpError } from "./auth.js";

// اكتب إيميلات الإدارة هنا بحروف صغيرة، مثال: ["you@example.com"]. وهي فاضية محدش يقدر يدخل لوحة الإدارة.
export const ADMIN_EMAILS = ["abdoelsayedd1011@gmail.com"];

export function isAdmin(user){
  return !!(user && user.email && ADMIN_EMAILS.map(e => String(e).trim().toLowerCase()).includes(String(user.email).toLowerCase()));
}

export async function requireAdmin(db, request){
  const s = await sessionUser(db, request);
  if (!s) throw new HttpError(401, "not_logged_in");
  if (!isAdmin(s.user)) throw new HttpError(403, "forbidden");
  return s;
}
