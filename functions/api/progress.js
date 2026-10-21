// Progress sync: each course/simulator keeps its progress in localStorage; /assets/sync.js mirrors
// the whitelisted keys here so a member's progress follows them to any device.
import { getDb, readBody, sessionUser, touchUser, json, fail, HttpError } from "../_lib/auth.js";

// Same keys as KEYS in /assets/sync.js (courses, guided-mode progress and saved state of each simulator).
const PROGRESS_KEY = /^(?:basics-lab-v1|instr-lab-v1|classic-lab-v1|vfd-(?:wbx|tc|ex)|[a-z0-9]{2,12}-lab-v1(?:-ui)?|[a-z0-9]{2,12}-sim-v1-ui)$/;
const MAX_VALUE = 64 * 1024, MAX_KEYS = 40, MAX_BODY = 1024 * 1024;
const bytes = s => new TextEncoder().encode(s).length;

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    const s = await sessionUser(db, request);
    if (!s) return json({ ok: true, signed: false });
    await touchUser(db, s.id);
    const rows = await db.prepare("SELECT k, v, updated_at FROM progress WHERE user_id = ?").bind(s.id).all();
    const items = {};
    for (const r of rows.results || []) items[r.k] = { v: r.v, t: r.updated_at };
    return json({ ok: true, signed: true, items });
  } catch (e) { return fail(e); }
}

// Body: {items: {key: "string value" | null}}   (null = the key was cleared on the device)
export async function onRequestPost({ request, env }){
  try {
    if (Number(request.headers.get("content-length") || 0) > MAX_BODY) throw new HttpError(413, "too_big");
    const db = await getDb(env);
    const body = await readBody(request);
    const s = await sessionUser(db, request);
    if (!s) throw new HttpError(401, "not_logged_in");
    const items = body.items;
    if (!items || typeof items !== "object" || Array.isArray(items)) throw new HttpError(400, "bad_request");
    const keys = Object.keys(items);
    if (keys.length > MAX_KEYS) throw new HttpError(413, "too_big");
    for (const k of keys){
      const v = items[k];
      if (!PROGRESS_KEY.test(k)) throw new HttpError(400, "bad_request");
      if (v !== null && typeof v !== "string") throw new HttpError(400, "bad_request");
      if (v !== null && bytes(v) > MAX_VALUE) throw new HttpError(413, "too_big");
    }
    const existing = new Set(((await db.prepare("SELECT k FROM progress WHERE user_id = ?").bind(s.id).all()).results || []).map(r => r.k));
    const after = new Set(existing);
    keys.forEach(k => items[k] === null ? after.delete(k) : after.add(k));
    if (after.size > MAX_KEYS) throw new HttpError(413, "too_big");
    const now = Date.now();
    const stmts = keys.map(k => items[k] === null
      ? db.prepare("DELETE FROM progress WHERE user_id = ? AND k = ?").bind(s.id, k)
      : db.prepare("INSERT INTO progress (user_id, k, v, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, k) DO UPDATE SET v = excluded.v, updated_at = excluded.updated_at").bind(s.id, k, items[k], now));
    if (stmts.length) await db.batch(stmts);
    return json({ ok: true, t: now });
  } catch (e) { return fail(e); }
}
