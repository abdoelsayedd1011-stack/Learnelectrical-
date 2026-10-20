import { getDb, sessionUser, touchUser, json, fail } from "../../_lib/auth.js";
import { isAdmin } from "../../_lib/admin.js";

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    const s = await sessionUser(db, request);
    if (!s) return json({ ok: true, user: null });
    await touchUser(db, s.id);
    return json({ ok: true, user: isAdmin(s.user) ? { ...s.user, admin: true } : s.user });
  } catch (e) { return fail(e); }
}
