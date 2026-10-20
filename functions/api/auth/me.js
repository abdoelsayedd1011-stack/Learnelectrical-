import { getDb, sessionUser, json, fail } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    const s = await sessionUser(db, request);
    return json({ ok: true, user: s ? s.user : null });
  } catch (e) { return fail(e); }
}
