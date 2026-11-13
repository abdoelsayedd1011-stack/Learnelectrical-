// The owner's private file storage (page: /my-files/, owner only). Files live in the R2 bucket bound as FILES
// (Cloudflare dashboard → the Pages project → Settings → Bindings → R2 bucket, variable name FILES).
// Uploads go in parts (multipart upload, PART_SIZE each) so there is no practical size limit. Anyone with a file's
// link (/f/<id>) can download it; only the owner can upload, list or delete.
//   GET  /api/files/list                       → { ok, files:[{id, name, size, type, uploaded}], total }
//   POST /api/files/start    {name, type}      → { ok, id, uploadId }
//   PUT  /api/files/part?id=&uploadId=&n=      (raw bytes of part n, 1-based) → { ok, partNumber, etag }
//   POST /api/files/complete {id, uploadId, parts:[{partNumber, etag}]} → { ok, id, size }
//   POST /api/files/abort    {id, uploadId}
//   POST /api/files/delete   {id}
//   POST /api/files/rename   {id, name}
import { getDb, readBody, json, fail, HttpError } from "../../_lib/auth.js";
import { requireOwner } from "../../_lib/admin.js";

export const PART_SIZE = 20 * 1024 * 1024; // the page sends parts of exactly this size (the last one may be smaller)
const ID = /^[A-Za-z0-9]{20}$/;

function bucket(env){
  if (!env.FILES) throw new HttpError(503, "storage_not_setup");
  return env.FILES;
}
function newId(){
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789", r = crypto.getRandomValues(new Uint8Array(20));
  let s = ""; for (const b of r) s += a[b % a.length]; return s;
}
function cleanName(v){
  const s = String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f\/\\]+/g, " ").trim().slice(0, 200);
  return s || "file";
}
function checkId(v){ const s = String(v || ""); if (!ID.test(s)) throw new HttpError(400, "bad_request"); return s; }

export async function onRequest({ request, env, params }){
  try {
    const db = await getDb(env);
    await requireOwner(db, request);
    const action = (params.path || []).join("/");
    const method = request.method;
    const R2 = bucket(env);

    if (action === "list" && method === "GET"){
      const files = []; let total = 0, cursor;
      do {
        const r = await R2.list({ cursor, include: ["customMetadata", "httpMetadata"], limit: 1000 });
        for (const o of r.objects){
          files.push({ id: o.key, name: (o.customMetadata && o.customMetadata.name) || o.key, size: o.size,
            type: (o.httpMetadata && o.httpMetadata.contentType) || "", uploaded: o.uploaded });
          total += o.size;
        }
        cursor = r.truncated ? r.cursor : null;
      } while (cursor);
      files.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));
      return json({ ok: true, files, total, partSize: PART_SIZE });
    }
    if (action === "part" && method === "PUT"){
      const u = new URL(request.url);
      const id = checkId(u.searchParams.get("id")), uploadId = String(u.searchParams.get("uploadId") || "");
      const n = Number(u.searchParams.get("n"));
      if (!uploadId || !Number.isInteger(n) || n < 1 || n > 10000 || !request.body) throw new HttpError(400, "bad_request");
      const len = Number(request.headers.get("content-length"));
      if (!(len > 0) || len > PART_SIZE) throw new HttpError(400, "bad_request");
      const part = await R2.resumeMultipartUpload(id, uploadId).uploadPart(n, request.body);
      return json({ ok: true, partNumber: part.partNumber, etag: part.etag });
    }
    if (method !== "POST") throw new HttpError(405, "bad_request");
    const body = await readBody(request);

    if (action === "start"){
      const id = newId(), name = cleanName(body.name);
      const type = /^[\w.+-]+\/[\w.+-]+$/.test(String(body.type || "")) ? String(body.type) : "application/octet-stream";
      const up = await R2.createMultipartUpload(id, { httpMetadata: { contentType: type }, customMetadata: { name } });
      return json({ ok: true, id, uploadId: up.uploadId, partSize: PART_SIZE });
    }
    if (action === "complete"){
      const id = checkId(body.id), parts = Array.isArray(body.parts) ? body.parts : [];
      if (!body.uploadId || !parts.length) throw new HttpError(400, "bad_request");
      const clean = parts.map(p => ({ partNumber: Number(p.partNumber), etag: String(p.etag) })).sort((a, b) => a.partNumber - b.partNumber);
      const obj = await R2.resumeMultipartUpload(id, String(body.uploadId)).complete(clean);
      return json({ ok: true, id, size: obj.size });
    }
    if (action === "abort"){
      const id = checkId(body.id);
      try { await R2.resumeMultipartUpload(id, String(body.uploadId || "")).abort(); } catch (e) {}
      return json({ ok: true });
    }
    if (action === "delete"){
      await R2.delete(checkId(body.id));
      return json({ ok: true });
    }
    if (action === "rename"){
      // R2 can't change metadata in place: copy the object onto itself with the new name
      const id = checkId(body.id), obj = await R2.get(id);
      if (!obj) throw new HttpError(404, "not_found");
      await R2.put(id, obj.body, { httpMetadata: obj.httpMetadata, customMetadata: { ...(obj.customMetadata || {}), name: cleanName(body.name) } });
      return json({ ok: true });
    }
    throw new HttpError(404, "not_found");
  } catch (e) { return fail(e); }
}
