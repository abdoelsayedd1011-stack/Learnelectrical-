// Members-only pages: visitors without an account are sent to sign up first.
// Open to everyone: the main pages, the PowerFlex 525 lab, the interview question bank, and the free lessons of every
// course (FREE_LESSONS_BY_DIR: lesson 1 only). The PLC brand simulators (Siemens/Delta/AB) are members-only.
// Members' lab/course pages also get /assets/sync.js injected so their progress syncs with the account.
// Paywall (off by default, see _lib/plan.js): when on, a member-only page also needs the member to own the course it
// belongs to (_lib/products.js: bought once, or given by an admin), or an active Pro plan («كل الكورسات»), or to be an admin.
// Otherwise they're sent to /subscribe.html?course=<id>.
// Suspended members count as signed out (sessionUser in _lib/auth.js).
// English pages live under /en/ and mirror the Arabic paths: /en/<dir>/... is gated exactly like /<dir>/..., and its
// redirects go to /en/login.html and /en/subscribe.html. A bought course opens for one year (_lib/products.js ACCESS_DAYS).
import { getDb, sessionUser, COOKIE } from "./_lib/auth.js";
import { isAdmin } from "./_lib/admin.js";
import { paywallOn, isPro } from "./_lib/plan.js";
import { productOfDir, ownsCourse } from "./_lib/products.js";

const MEMBER_LABS = new Set([
  "ab1336-simulator", "pf40-lab", "v20-lab", "atv320-lab", "atv630-lab",
  "ms300-lab", "fc51-lab", "e5cc-lab", "servo-simulator", "vfd-simulator",
  "mrje-servo", "sigma7-servo", "kinetix300-servo",
  "acs580-lab", "g120-lab", "fre800-lab", "ga500-lab", "ig5a-lab", "gd20-lab", "c2000-lab", "frenic-lab"
]);
// Lessons open to everyone (no account, no purchase): lesson 1 of every course.
// To open more, add their numbers here and the «مفتوح للكل» tags on the course page in /courses/.
const FREE_LESSONS_BY_DIR = {
  "basics-lab": [1],                // 13 lessons
  "classic-control-lab": [1],       // 9
  "instrumentation-lab": [1],       // 10
  "plc-lab": [1],                   // 10
  "drawings-lab": [1],              // 7
  "vfd-course": [1],                // 12
  "servo-course": [1]               // 12
};
const COURSE_DIRS = new Set(["classic-control-lab", "basics-lab", "instrumentation-lab", "plc-lab", "drawings-lab", "vfd-course", "servo-course"]);
const SYNC_DIRS = new Set([...MEMBER_LABS, ...COURSE_DIRS, "pf525-lab", "interview"]);
const SYNC_TAG = '<script src="/assets/sync.js" defer></script>';

// Lesson explainer videos (/media/lessons/<dir>/lesson-NN.mp4 + .jpg poster) are gated exactly like their lesson page.
function mediaLessonPage(pathname){
  const v = /^\/media\/lessons\/([^/]+)\/(lesson-\d+)\.(?:mp4|jpg)$/.exec(pathname);
  return v && COURSE_DIRS.has(v[1]) ? "/" + v[1] + "/" + v[2] + ".html" : null;
}

function membersOnly(pathname){
  const page = mediaLessonPage(pathname);
  if (page) return membersOnly(page);
  const m = /^\/([^/]+)\/(.*)$/.exec(pathname);
  if (!m) return false;
  const dir = m[1], rest = m[2];
  if (rest && !/\.html$/.test(rest) && /\./.test(rest)) return false; // scripts, images, data
  if (COURSE_DIRS.has(dir)){
    if (dir === "plc-lab" && /^(?:siemens|delta|ab)(?:\.html)?$/.test(rest)) return true; // brand simulators
    const l = /^lesson-(\d+)/.exec(rest);
    return !!l && !(FREE_LESSONS_BY_DIR[dir] || [1]).includes(Number(l[1]));
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

// "/en/plc-lab/lesson-03.html" → { en: true, path: "/plc-lab/lesson-03.html" }
function splitLang(pathname){
  const m = /^\/en(\/.*)$/.exec(pathname);
  return m ? { en: true, path: m[1] } : { en: false, path: pathname };
}

export async function onRequest(ctx){
  const url = new URL(ctx.request.url);
  const lang = splitLang(url.pathname), path = lang.path, pre = lang.en ? "/en" : "";
  const sync = syncDir(path) && hasSessionCookie(ctx.request);
  if (!membersOnly(path)) return sync ? withSync(ctx) : ctx.next();
  let s = null, db = null;
  try {
    db = await getDb(ctx.env);
    s = await sessionUser(db, ctx.request);
  } catch (e) {
    return ctx.next(); // accounts backend unavailable: don't lock everyone out
  }
  const go = page => {
    const to = new URL(page, url);
    to.searchParams.set("next", url.pathname + url.search);
    return new Response(null, { status: 302, headers: { location: to.pathname + to.search, "cache-control": "no-store" } });
  };
  if (!s) return go(pre + (hasSessionCookie(ctx.request) ? "/login.html?out=1" : "/login.html")); // out=1: this device was signed out (see login.html)
  if (paywallOn(ctx.env) && !isPro(s.user) && !isAdmin(s.user)){
    const course = productOfDir((mediaLessonPage(path) || path).split("/")[1]);
    let owns = false;
    try { owns = !!course && await ownsCourse(db, s.id, course); } catch (e) {} // only a course that hasn't expired
    if (!owns) return go(pre + (course ? "/subscribe.html?course=" + course : "/subscribe.html"));
  }
  const res = await withSync(ctx);
  const out = new Response(res.body, res);
  out.headers.set("cache-control", "private, no-store");
  return out;
}
