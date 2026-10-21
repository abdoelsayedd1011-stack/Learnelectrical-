// Admin: private notes on a member (shown only in the admin details view). Body: {id, note}  (empty note clears it)
import { getDb, readBody, json, fail, HttpError } from "../../_lib/auth.js";
import { requireAdmin, logAction, memberId } from "../../_lib/admin.js";
import { cleanText } from "../../_lib/pay.js";

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const me = await requireAdmin(db, request);
    const id = memberId(body.id);
    const note = cleanText(body.note, 2000);
    const u = await db.prepare("SELECT id, email FROM users WHERE id = ?").bind(id).first();
    if (!u) throw new HttpError(404, "not_found");
    const now = Date.now();
    await db.prepare("UPDATE users SET admin_note = ?, admin_note_at = ? WHERE id = ?").bind(note, note ? now : null, id).run();
    await logAction(db, me, "note", u, note ? note.slice(0, 80) + (note.length > 80 ? "…" : "") : "اتمسحت");
    return json({ ok: true, id, admin_note: note, admin_note_at: note ? now : null });
  } catch (e) { return fail(e); }
}
