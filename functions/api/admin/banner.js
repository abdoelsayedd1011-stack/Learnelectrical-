// Admin: the site-wide announcement bar.   GET → {banner}   POST {text, link, on} → saved banner
import { getDb, readBody, json, fail } from "../../_lib/auth.js";
import { requireAdmin, logAction } from "../../_lib/admin.js";
import { getBanner, cleanBanner, saveBanner } from "../../_lib/banner.js";

export async function onRequestGet({ request, env }){
  try {
    const db = await getDb(env);
    await requireAdmin(db, request);
    return json({ ok: true, banner: await getBanner(db) });
  } catch (e) { return fail(e); }
}

export async function onRequestPost({ request, env }){
  try {
    const db = await getDb(env);
    const body = await readBody(request);
    const me = await requireAdmin(db, request);
    const b = await saveBanner(db, cleanBanner(body));
    await logAction(db, me, "banner", null, (b.on ? "شغّال: " : "مقفول: ") + (b.text || "—") + (b.link ? " · " + b.link : ""));
    return json({ ok: true, banner: b });
  } catch (e) { return fail(e); }
}
