// Members-only pages: visitors without an account are sent to sign up first.
// Open to everyone: the main pages, the PowerFlex 525 lab and classic-control lessons 1–2.
import { getDb, sessionUser } from "./_lib/auth.js";

const MEMBER_LABS = new Set([
  "ab1336-simulator", "pf40-lab", "v20-lab", "atv320-lab", "atv630-lab",
  "ms300-lab", "fc51-lab", "e5cc-lab", "servo-simulator", "vfd-simulator"
]);
const FREE_LESSONS = 2;

function membersOnly(pathname){
  const m = /^\/([^/]+)\/(.*)$/.exec(pathname);
  if (!m) return false;
  const dir = m[1], rest = m[2];
  if (rest && !/\.html$/.test(rest) && /\./.test(rest)) return false; // scripts, images, data
  if (dir === "classic-control-lab"){
    const l = /^lesson-(\d+)/.exec(rest);
    return !!l && Number(l[1]) > FREE_LESSONS;
  }
  return MEMBER_LABS.has(dir);
}

export async function onRequest(ctx){
  const url = new URL(ctx.request.url);
  if (!membersOnly(url.pathname)) return ctx.next();
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
  const res = await ctx.next();
  const out = new Response(res.body, res);
  out.headers.set("cache-control", "private, no-store");
  return out;
}
