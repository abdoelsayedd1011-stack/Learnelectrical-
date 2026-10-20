import { getDb, readBody, sessionUser, clearCookie, json, fail } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }){
  try {
    await readBody(request);
    const db = await getDb(env);
    const s = await sessionUser(db, request);
    if (s) await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(s.token_hash).run();
    return json({ ok: true }, 200, { "set-cookie": clearCookie(request) });
  } catch (e) { return fail(e); }
}
