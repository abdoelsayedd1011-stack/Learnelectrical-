// Courses that give a completion certificate, and how to tell from synced progress that one is finished.
// The required items are read from each course's own engine file (the same lists its hub page uses),
// so adding a lesson or a task there is picked up here without editing this file.

export const COURSES = {
  basics:  { title: "أساسيات الكهربا للمبتدئين", key: "basics-lab-v1",   src: "/basics-lab/basics.js",          list: "BL.COURSE", hub: "/basics-lab/index.html" },
  classic: { title: "الكلاسيك كنترول",            key: "classic-lab-v1",  src: "/classic-control-lab/engine.js", list: null,        hub: "/classic-control-lab/index.html" },
  safety:  { title: "السيفتي PLC",                key: "safety-lab-v1",   src: "/safety-lab/safety.js",          list: "IL.COURSE", hub: "/safety-lab/index.html" },
  instr:   { title: "الإنسترومنتيشن",             key: "instr-lab-v1",    src: "/instrumentation-lab/instr.js",  list: "IL.COURSE", hub: "/instrumentation-lab/index.html" },
  plc:     { title: "الـ PLC",                     key: "plc-lab-v1",      src: "/plc-lab/plc.js",                list: "PL.COURSE", hub: "/plc-lab/index.html" },
  drw:     { title: "قراية الرسومات الكهربية",     key: "drw-lab-v1",      src: "/drawings-lab/drawings.js",      list: "DR.COURSE", hub: "/drawings-lab/index.html" },
  vfd:     { title: "الانفرتر VFD",                key: "vfdc-lab-v1",     src: "/vfd-course/vfd.js",             list: "VF.COURSE", hub: "/vfd-course/index.html" },
  srv:     { title: "السيرفو موتور والدرايف",      key: "srvc-lab-v1",     src: "/servo-course/servo.js",         list: "SV.COURSE", hub: "/servo-course/index.html" },
  iiot:    { title: "IIoT والشبكات الصناعية",       key: "iiot-lab-v1",     src: "/iiot-lab/iiot.js",              list: "IL.COURSE", hub: "/iiot-lab/index.html" },
  scada:   { title: "SCADA و HMI",                  key: "scada-lab-v1",    src: "/scada-lab/scada.js",            list: "IL.COURSE", hub: "/scada-lab/index.html" },
  panel:   { title: "تصميم اللوحات الكهربية",       key: "panel-lab-v1",    src: "/panel-lab/panel.js",            list: "IL.COURSE", hub: "/panel-lab/index.html" },
  maint:   { title: "صيانة المحركات والمحولات",     key: "maint-lab-v1",    src: "/maint-lab/maint.js",            list: "IL.COURSE", hub: "/maint-lab/index.html" },
  srvm:    { title: "صيانة محركات السيرفو",         key: "srvm-lab-v1",     src: "/servo-maint-lab/srvm.js",       list: "IL.COURSE", hub: "/servo-maint-lab/index.html" }
};

const CACHE_MS = 10 * 60 * 1000;
const cache = {};

// basics / instr / plc / drw: `{id:'l1', … tasks:[['ohm','…'],…]}` → "l1/ohm" in state.done
function parseTasks(src, list){
  const start = src.indexOf(list + " = [");
  if (start < 0) return null;
  const end = src.indexOf("\n];", start);
  const body = src.slice(start, end < 0 ? undefined : end);
  const out = [];
  body.split("{id:'").slice(1).forEach(chunk => {
    const id = chunk.slice(0, chunk.indexOf("'"));
    const t = chunk.indexOf("tasks:[");
    if (!/^l\d+$/.test(id) || t < 0) return;
    const tasks = chunk.slice(t + 7, chunk.indexOf("]]", t) + 1);
    for (const m of tasks.matchAll(/\[\s*'([^']+)'\s*,/g)) out.push(id + "/" + m[1]);
  });
  return out.length ? out : null;
}

// classic: `exercises: {l1:['a','e',…], …}` → "l1/ex/a" in state.p
function parseExercises(src){
  const i = src.search(/exercises:\s*\{\s*l\d+:/);
  if (i < 0) return null;
  const block = src.slice(i, src.indexOf("]}", i) + 2);
  const out = [];
  for (const m of block.matchAll(/(l\d+)\s*:\s*\[([^\]]*)\]/g))
    for (const x of m[2].matchAll(/'([^']+)'/g)) out.push(m[1] + "/ex/" + x[1]);
  return out.length ? out : null;
}

export async function requirements(env, request, id){
  const c = COURSES[id];
  const hit = cache[id];
  if (hit && Date.now() - hit.t < CACHE_MS) return hit.req;
  let req = null;
  try {
    const res = await env.ASSETS.fetch(new Request(new URL(c.src, request.url)));
    if (res.ok){ const src = await res.text(); req = c.list ? parseTasks(src, c.list) : parseExercises(src); }
  } catch (e) {}
  if (req) cache[id] = { t: Date.now(), req };
  return req;
}

// {done, total, complete, name} for one course from its synced progress value (JSON string or null).
export function courseStatus(id, value, req){
  let s = null;
  try { s = JSON.parse(value || "null"); } catch (e) {}
  const map = s && typeof s === "object" ? (id === "classic" ? s.p : s.done) : null;
  const has = k => !!(map && typeof map === "object" && map[k]);
  const name = s && typeof s === "object" ? String((id === "classic" ? (s.p || {})["cert/name"] : s.certName) || "").slice(0, 60) : "";
  if (!req) return { done: 0, total: 0, complete: false, unknown: true, name };
  const done = req.filter(has).length;
  return { done, total: req.length, complete: done === req.length, name };
}
