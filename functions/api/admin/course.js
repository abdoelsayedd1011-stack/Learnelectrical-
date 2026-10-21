// Admin: give a member a course for life, or take it back («إدّيله كورس» in the member window of /admin.html).
// POST {id, course, action: "grant", note?}  → owned from now (source 'admin')
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
    if (!course || (action !== "grant" && action !== "remove")) throw new HttpError(400, "bad_request");
    const u = await db.prepare("SELECT id, email FROM users WHERE id = ?").bind(id).first();
    if (!u) throw new HttpError(404, "not_found");
    const title = PRODUCTS[course].title;
    if (action === "grant"){
      const note = cleanText(body.note, 200);
      if (await grantCourse(db, id, course, "admin", note)) await logAction(db, me, "course_grant", u, title + (note ? " · " + note : ""));
    } else if (await removeCourse(db, id, course)) await logAction(db, me, "course_remove", u, title);
    return json({ ok: true, id, courses: (await ownedCourses(db, id)).map(c => c.course) });
  } catch (e) { return fail(e); }
}
