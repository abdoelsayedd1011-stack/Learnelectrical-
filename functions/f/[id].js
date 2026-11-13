// Public download link for a file in the owner's storage: /f/<id>  (?view=1 opens it in the browser instead of downloading).
// Uploaded from /my-files/ (owner only); see functions/api/files/[[path]].js.
const ID = /^[A-Za-z0-9]{20}$/;
const INLINE_OK = /^(image\/(png|jpeg|gif|webp)|application\/pdf|video\/(mp4|webm)|audio\/\w+|text\/plain)$/;

export async function onRequest({ request, env, params }){
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
  const id = String(params.id || "");
  if (!env.FILES || !ID.test(id)) return new Response("Not found", { status: 404 });
  const obj = await env.FILES.get(id, { range: request.headers, onlyIf: request.headers });
  if (!obj) return new Response("Not found", { status: 404 });
  const h = new Headers();
  obj.writeHttpMetadata(h);
  h.set("etag", obj.httpEtag);
  h.set("accept-ranges", "bytes");
  h.set("cache-control", "private, max-age=0");
  h.set("x-robots-tag", "noindex, nofollow");
  h.set("x-content-type-options", "nosniff");
  const type = h.get("content-type") || "application/octet-stream";
  const name = (obj.customMetadata && obj.customMetadata.name) || id;
  const view = new URL(request.url).searchParams.get("view") === "1" && INLINE_OK.test(type);
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  h.set("content-disposition", (view ? "inline" : "attachment") + '; filename="' + ascii + "\"; filename*=UTF-8''" + encodeURIComponent(name));
  if (!("body" in obj)) return new Response(null, { status: 304, headers: h }); // onlyIf failed: not modified
  let status = 200;
  if (obj.range && request.headers.get("range")){
    const r = obj.range, start = r.offset != null ? r.offset : obj.size - r.suffix;
    const len = r.length != null ? r.length : (r.suffix != null ? r.suffix : obj.size - start);
    h.set("content-range", "bytes " + start + "-" + (start + len - 1) + "/" + obj.size);
    h.set("content-length", String(len));
    status = 206;
  } else h.set("content-length", String(obj.size));
  return new Response(request.method === "HEAD" ? null : obj.body, { status, headers: h });
}
