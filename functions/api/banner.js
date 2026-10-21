// Public: the current announcement bar for /assets/site.js. {banner: {text, link} | null}, cached for a minute.
import { getDb, json, fail } from "../_lib/auth.js";
import { getBanner } from "../_lib/banner.js";

export async function onRequestGet({ env }){
  try {
    const b = await getBanner(await getDb(env));
    return json({ ok: true, banner: b.on ? { text: b.text, link: b.link || null } : null }, 200, { "cache-control": "public, max-age=60" });
  } catch (e) {
    return json({ ok: true, banner: null }, 200, { "cache-control": "public, max-age=60" }); // no DB: no banner, never an error bar
  }
}
