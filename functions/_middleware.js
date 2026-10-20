// Members-only pages: visitors without an account are sent to sign up first.
// Open to everyone: the main pages, the PowerFlex 525 lab, and lessons 1–2 of the basics and classic-control courses.
// Members' lab/course pages also get /assets/sync.js injected so their progress syncs with the account.
import { getDb, sessionUser, COOKIE } from "./_lib/auth.js";

const MEMBER_LABS = new Set([
  "ab1336-simulator", "pf40-lab", "v20-lab", "atv320-lab", "atv630-lab",
  "ms300-lab", "fc51-lab", "e5cc-lab", "servo-simulator", "vfd-simulator"
]);
const FREE_LESSONS = 2;
const SYNC_DIRS = new Set([...MEMBER_LABS, "pf525-lab", "classic-control-lab", "basics-lab", "instrumentation-lab"]);
const SYNC_TAG = '<script src="/assets/sync.js" defer></script>';

function membersOnly(pathname){
  const m = /^\/([^/]+)\/(.*)$/.exec(pathname);
  if (!m) return false;
  const dir = m[1], rest = m[2];
  if (rest && !/\.html$/.test(rest) && /\./.test(rest)) return false; // scripts, images, data
  if (dir === "classic-control-lab" || dir === "basics-lab" || dir === "instrumentation-lab"){
    const l = /^lesson-(\d+)/.exec(rest);
    return !!l && Number(l[1]) > FREE_LESSONS;
  }
  return MEMBER_LABS.has(dir);
}

function syncDir(pathname){
  const m = /^\/([^/]+)\/(.*)$/.exec(pathname);
  if (!m || !SYNC_DIRS.has(m[1])) return false;
  return !m[2] || /\.html$/.test(m[2]) || !/\./.test(m[2]);
}

function hasSessionCookie(request){
  return new RegExp("(?:^|;\\s*)" + COOKIE + "=[0-9a-f]{64}").test(request.headers.get("cookie") || "");
}

// Fetch the page without the browser's validators (a cached copy from before login has no sync script),
// then add the script before </body>.
async function withSync(ctx){
  const req = new Request(ctx.request);
  req.headers.delete("if-none-match");
  req.headers.delete("if-modified-since");
  const res = await ctx.next(req);
  const type = res.headers.get("content-type") || "";
  if (res.status !== 200 || !type.includes("text/html")) return res;
  const out = new HTMLRewriter().on("body", { element(el){ el.append(SYNC_TAG, { html: true }); } }).transform(res);
  const h = new Response(out.body, out);
  h.headers.delete("etag");
  h.headers.set("cache-control", "private, no-store");
  return h;
}

export async function onRequest(ctx){
  const url = new URL(ctx.request.url);
  const sync = syncDir(url.pathname) && hasSessionCookie(ctx.request);
  if (!membersOnly(url.pathname)) return sync ? withSync(ctx) : ctx.next();
  let member = false;
  try {
    member = !!(await sessionUser(await getDb(ctx.env), ctx.request));
  } catch (e) {
    return ctx.next(); // accounts backend unavailable: don't lock everyone out
  }
  if (!member){
    const to = new URL("/login.html", url);
    to.searchParams.set("next", url.pathname + url.search);
    return new Response(null, { status: 302, headers: { location: to.pathname + to.search, "cache-control": "no-store" } });
  }
  const res = await withSync(ctx);
  const out = new Response(res.body, res);
  out.headers.set("cache-control", "private, no-store");
  return out;
}
