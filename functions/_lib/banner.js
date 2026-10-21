// The announcement bar at the top of every page that loads /assets/site.js. Set from /admin.html («إعلان فوق الموقع»),
// stored as JSON in settings (k = 'banner'), read publicly from /api/banner.
import { HttpError } from "./auth.js";
import { cleanText } from "./pay.js";

export const BANNER_MAX = 200;

export async function getBanner(db){
  const r = await db.prepare("SELECT v, updated_at FROM settings WHERE k = 'banner'").first();
  let b = null;
  try { b = r ? JSON.parse(r.v) : null; } catch (e) {}
  return { text: (b && b.text) || "", link: (b && b.link) || "", on: !!(b && b.on && b.text), updated_at: r ? r.updated_at : null };
}

// Body {text, link, on} → cleaned banner. Links: a path on this site ("/subscribe.html") or an https:// address.
export function cleanBanner(body){
  const text = cleanText(String(body.text == null ? "" : body.text).replace(/\s+/g, " "), BANNER_MAX) || "";
  const link = String(body.link == null ? "" : body.link).trim();
  if (link && (link.length > 300 || !/^(?:\/(?!\/)|https:\/\/)[^\s<>"']*$/.test(link))) throw new HttpError(400, "bad_request");
  const on = body.on === true;
  if (on && !text) throw new HttpError(400, "bad_request");
  return { text, link, on };
}

export async function saveBanner(db, b){
  const now = Date.now();
  await db.prepare("INSERT INTO settings (k, v, updated_at) VALUES ('banner', ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, updated_at = excluded.updated_at")
    .bind(JSON.stringify(b), now).run();
  return { ...b, updated_at: now };
}
