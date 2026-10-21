// Admin: give a member a course for a year, add a year, or take it back («إدّيله كورس» / «مدّ سنة» in the member window of /admin.html).
// POST {id, course, action: "grant" | "extend", note?}  → open for ACCESS_DAYS (1 year) from today, or a year on top of an end date
//                                                        that hasn't passed yet (source 'admin'; same thing for both actions)
// POST {id, course, action: "remove"}        → no longer owned (a Pro plan still opens everything)
import { getDb, readBody, json, fail, HttpError } from "../../_lib/auth.js";
import { requireAdmin, logAction, memberId } from "../../_lib/admin.js";
import { cleanText } from "../../_lib/pay.js";
import { PRODUCTS, productId, grantCourse, removeCourse, ownedCourses } from "../../_lib/products.js";

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const me = await requireAdmin(db, request);
    const id = memberId(body.id), course = productId(body.course), action = String(body.action || "");
    if (!course || (action !== "grant" && action !== "extend" && action !== "remove")) throw new HttpError(400, "bad_request");
    const u = await db.prepare("SELECT id, email FROM users WHERE id = ?").bind(id).first();
    if (!u) throw new HttpError(404, "not_found");
    const title = PRODUCTS[course].title;
    let until = null;
    if (action !== "remove"){
      const note = cleanText(body.note, 200);
      const g = await grantCourse(db, id, course, "admin", note);
      until = g.until;
      await logAction(db, me, g.renewed ? "course_extend" : "course_grant", u, title + " → لحد " + new Date(until + 2 * 3600 * 1000).toISOString().slice(0, 10) + (note ? " · " + note : ""));
    } else if (await removeCourse(db, id, course)) await logAction(db, me, "course_remove", u, title);
    const owned = await ownedCourses(db, id);
    return json({ ok: true, id, until, courses: owned.filter(c => c.active).map(c => c.course), owned: owned.map(c => ({ course: c.course, until: c.until, active: c.active })) });
  } catch (e) { return fail(e); }
}
