/* أساسيات الكهربا للمبتدئين: shared engine for the hub and the 9 lessons.
   Modules: store/progress · theme · lesson shell · quiz · circuit solver · small widgets ·
   multimeter (BL.meter) · wiring bench (BL.bench). Lesson pages hold the content + data. */
(function(){
'use strict';
const BL = window.BL = {};
const KEY = 'basics-lab-v1';

/* ---------------- store ---------------- */
function load(){ try { const s = JSON.parse(localStorage.getItem(KEY)); return s && typeof s === 'object' ? s : {}; } catch (e){ return {}; } }
let S = load(); if (!S.done) S.done = {};
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e){} }
const subs = [];
BL.on = fn => subs.push(fn);
BL.store = {
  has: k => !!S.done[k],
  mark(k){ if (S.done[k]) return false; const f = load(); S = Object.assign({}, f, S); S.done = Object.assign({}, f.done || {}, S.done); S.done[k] = Date.now(); save(); subs.forEach(fn => { try { fn(k); } catch (e){} }); return true; },
  get: k => S[k],
  set(k, v){ S[k] = v; save(); },
  reset(){ S = {done:{}}; save(); },
  reload(){ S = load(); if (!S.done) S.done = {}; }
};

/* ---------------- theme (applied before first paint: basics.js loads in <head>) ---------------- */
function applyTheme(){ const t = S.theme; if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
applyTheme();
function isDark(){ const t = document.documentElement.getAttribute('data-theme'); if (t) return t === 'dark'; return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
function themeBtn(){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn theme-b';
  const upd = () => { const d = isDark(); b.textContent = d ? '☀' : '☾'; b.setAttribute('aria-label', d ? 'الوضع الفاتح' : 'الوضع الغامق'); b.title = b.getAttribute('aria-label'); };
  b.addEventListener('click', () => { BL.store.set('theme', isDark() ? 'light' : 'dark'); applyTheme(); upd(); });
  upd(); return b;
}

/* ---------------- course map ---------------- */
BL.COURSE = [
  {id:'l1', n:1, file:'lesson-01.html', title:'يعني إيه كهربا؟', sub:'الجهد والتيار والمقاومة والقدرة بتشبيه الميّة، وإزاي فاتورة الكهربا بتتحسب',
    tasks:[['ohm','تجربة الميّة والكهربا'],['bill','حساب الكيلووات ساعة'],['quiz','أسئلة الدرس']]},
  {id:'l2', n:2, file:'lesson-02.html', title:'أنواع الكهربا', sub:'المستمرة والمترددة، سنجل فاز وتلاتة فاز، وألوان الأسلاك والأرضي',
    tasks:[['wave','شكل الموجة'],['wires','تمرين ألوان الأسلاك'],['quiz','أسئلة الدرس']]},
  {id:'l3', n:3, file:'lesson-03.html', title:'السلامة والعدّة', sub:'مفك الاختبار، قاطع التسريب، والعدّة اللي لازم تبقى معاك',
    tasks:[['tester','تجربة مفك الاختبار'],['rcd','تجربة قاطع التسريب'],['dodont','اعمل / ماتعملش'],['quiz','أسئلة الدرس']]},
  {id:'l4', n:4, file:'lesson-04.html', title:'الأفوميتر (AVO)', sub:'تقيس فولت وأوم وتوصيل وتيار من غير ما تتعوّر ولا تحرق العداد',
    tasks:[['ex-socket','جهد البريزة'],['ex-bat9','بطارية 9V'],['ex-bat15','بطارية 1.5V'],['ex-wire','سلك سليم ومقطوع'],['ex-res','قيمة مقاومة'],['quiz','أسئلة الدرس']]},
  {id:'l5', n:5, file:'lesson-05.html', title:'قياس الأجهزة عمليًا', sub:'السخان والغلاية واللمبة والفيوز والموتور، وقياس التيار بالكلامب',
    tasks:[['heater','السخان'],['kettle','الغلاية'],['lamp','لمبة الفتيلة'],['fuse','الفيوز'],['motor3','موتور 3 فاز'],['motor1','موتور سنجل فاز'],['clamp','الكلامب ميتر'],['diag','3 تشخيصات صح'],['quiz','أسئلة الدرس']]},
  {id:'l6', n:6, file:'lesson-06.html', title:'المحوّل (الترانس) والباور سبلاي', sub:'إزاي الترانس بيوطّي الجهد، والباور سبلاي بيحوّل الكهربا المترددة لمستمرة، وإزاي تقيسهم',
    tasks:[['xfmr','تجربة الترانس'],['xmeas','قياس الترانس'],['psu','مراحل الباور سبلاي'],['pmeas','قياس الباور سبلاي'],['quiz','أسئلة الدرس']]},
  {id:'l7', n:7, file:'lesson-07.html', title:'قانون أوم والقدرة واختيار السلك والقاطع', sub:'تحسب التيار من القدرة، وتختار القاطع ومقاس السلك صح',
    tasks:[['calc','الحاسبة'],['drill','اختار القاطع والسلك'],['quiz','أسئلة الدرس']]},
  {id:'l8', n:8, file:'lesson-08.html', title:'توصيل اللمبة والبريزة', sub:'وصّل بإيدك: لمبة بمفتاح، بريزة بأرضي، مفتاح سلم، ولمبتين على التوازي',
    tasks:[['w-a','لمبة ومفتاح'],['w-b','بريزة بأرضي'],['w-c','مفتاح السلم'],['w-d','لمبتين توازي'],['quiz','أسئلة الدرس']]},
  {id:'l9', n:9, file:'lesson-09.html', title:'أعطال البيت الشائعة', sub:'لعبة تدوّر فيها على العطل بالتستر والأفوميتر، والامتحان النهائي',
    tasks:[['g-lamp','اللمبة مش بتنور'],['g-socket','البريزة مفيهاش كهربا'],['g-trip','القاطع بيفصل'],['quiz','أسئلة الدرس'],['final','الامتحان النهائي']]}
];
BL.lessonById = id => BL.COURSE.find(l => l.id === id);
BL.summary = id => { const l = BL.lessonById(id); const done = l.tasks.filter(t => BL.store.has(id + '/' + t[0])).length; return {done, total:l.tasks.length}; };
BL.mark = (lid, task) => BL.store.mark(lid + '/' + task);
BL.has = (lid, task) => BL.store.has(lid + '/' + task);

/* ---------------- helpers ---------------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
BL.esc = esc;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
BL.$ = $; BL.$$ = $$;
function h(html){ const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
BL.h = h;
const fmt = (v, d) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
BL.fmt = fmt;
function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
BL.shuffle = shuffle;
const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
BL.reduced = reduced;
let actx = null;
BL.beep = function(on){
  try {
    if (!on){ if (BL._osc){ BL._osc.stop(); BL._osc = null; } return; }
    if (BL._osc) return;
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 2700; g.gain.value = 0.04; o.connect(g); g.connect(actx.destination); o.start(); BL._osc = o;
    setTimeout(() => BL.beep(false), 450);
  } catch (e){ BL._osc = null; }
};

/* ---------------- lesson shell ---------------- */
BL.lesson = function(id){
  const L = BL.lessonById(id); BL.cur = L;
  const ch = $('header.top .chips'); if (ch) ch.appendChild(themeBtn());
  const prog = $('#lprog');
  function renderProg(){
    if (!prog) return;
    const s = BL.summary(id), pct = Math.round(s.done / s.total * 100);
    prog.innerHTML = `<div class="row"><span>تقدّمك في الدرس: <b>${s.done} من ${s.total}</b></span><span class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="التقدّم ${pct}%"><i style="width:${pct}%"></i></span></div><ul>${L.tasks.map(t => `<li class="${BL.has(id, t[0]) ? 'ok' : ''}">${esc(t[1])}</li>`).join('')}</ul>`;
  }
  renderProg(); BL.on(renderProg);
  const nav = $('#lnav');
  if (nav){
    const i = BL.COURSE.indexOf(L), p = BL.COURSE[i - 1], n = BL.COURSE[i + 1];
    nav.innerHTML = (p ? `<a class="btn" href="${p.file}">→ الدرس ${p.n}: ${esc(p.title)}</a>` : `<a class="btn" href="index.html">→ صفحة الكورس</a>`) +
      (n ? `<a class="btn pri" href="${n.file}">الدرس ${n.n}: ${esc(n.title)} ←</a>` : `<a class="btn pri" href="index.html#certSec">الشهادة ←</a>`);
  }
};
BL.hubTheme = () => { const ch = $('header.top .chips'); if (ch) ch.appendChild(themeBtn()); };

/* ---------------- quiz ----------------
   qs: [{q, o:[...], a:index, why}] ; opt: {lesson, task, pass(0..1), row, shuffle} */
BL.quiz = function(host, qs, opt){
  opt = opt || {};
  const pass = opt.pass == null ? 0.75 : opt.pass;
  let order, ans;
  function start(){
    order = (opt.shuffle ? shuffle(qs) : qs.slice()).map(q => { const idx = q.o.map((_, i) => i); const oi = opt.keepOrder || q.keep ? idx : shuffle(idx); return {q, oi}; });
    ans = order.map(() => null); render();
  }
  function render(){
    host.innerHTML = `<div class="qz-list">${order.map((it, k) => `<div class="qz" data-k="${k}"><p class="qz-q">${k + 1}. ${it.q.q}</p><div class="qz-a${opt.row ? ' row' : ''}">${it.oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${it.q.o[i]}</button>`).join('')}</div><p class="qz-f" aria-live="polite"></p></div>`).join('')}</div><div class="qz-sum" hidden aria-live="polite"></div>`;
  }
  host.addEventListener('click', e => {
    const b = e.target.closest('.qz-o');
    if (b){
      const box = b.closest('.qz'), k = +box.dataset.k, it = order[k];
      if (ans[k] != null) return;
      const i = +b.dataset.i, ok = i === it.q.a; ans[k] = ok;
      $$('.qz-o', box).forEach(x => { x.disabled = true; if (+x.dataset.i === it.q.a) x.classList.add('ok'); });
      if (!ok) b.classList.add('no'); else box.classList.add('ok');
      const f = $('.qz-f', box); f.className = 'qz-f ' + (ok ? 'ok' : 'no'); f.innerHTML = (ok ? 'صح. ' : 'مش دي. ') + (it.q.why || '');
      if (ans.every(x => x != null)) finish();
      return;
    }
    if (e.target.closest('[data-qz=again]')) start();
  });
  function finish(){
    const n = ans.filter(Boolean).length, tot = ans.length, ok = n / tot >= pass - 1e-9;
    const sum = $('.qz-sum', host); sum.hidden = false; sum.className = 'qz-sum ' + (ok ? 'ok' : 'no');
    sum.innerHTML = `<b>نتيجتك: ${n} من ${tot}</b><span>${ok ? 'ممتاز، كده عدّيت ✓' : `محتاج ${Math.ceil(pass * tot)} صح على الأقل. راجع الشرح وجرّب تاني.`}</span><button type="button" class="btn" data-qz="again">${ok ? 'حلّ تاني' : 'جرّب تاني'}</button>`;
    if (ok && opt.lesson) BL.mark(opt.lesson, opt.task || 'quiz');
    if (opt.onDone) opt.onDone(n, tot, ok);
  }
  start();
  const api = {solve(wrong){ order.forEach((it, k) => { const i = wrong && k === 0 ? it.oi.find(j => j !== it.q.a) : it.q.a; const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }); return $('.qz-sum', host).textContent; }, answer(k, i){ const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }, order: () => order.map(x => x.q), restart: start};
  (BL._q = BL._q || []).push(api); api.host = host;
  return api;
};

/* ---------------- circuit solver (nodal analysis) ----------------
   elems: {a, b, r}               resistor (r in Ω; r0 = cold/meter value when the circuit is off)
          {a, b, v, ri, src:true} voltage source (a is +), Norton model with internal resistance ri
   Node 'E' (earth) is the reference 0 V. Every node also leaks 1 GΩ to earth so floating parts solve. */
const C = BL.circuit = {};
function gauss(A, b){
  const n = b.length;
  for (let c = 0; c < n; c++){
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-300) continue;
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = c + 1; r < n; r++){ const f = A[r][c] / A[c][c]; if (!f) continue; for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--){ let s = b[r]; for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k]; x[r] = Math.abs(A[r][r]) < 1e-300 ? 0 : s / A[r][r]; }
  return x;
}
C.solve = function(elems, opt){
  opt = opt || {};
  const ground = opt.ground || 'E', idx = new Map();
  const id = n => { if (n === ground) return -1; if (!idx.has(n)) idx.set(n, idx.size); return idx.get(n); };
  elems.forEach(e => { id(e.a); id(e.b); });
  if (opt.inject) id(opt.inject.node);
  const N = idx.size, A = Array.from({length:N}, () => new Array(N).fill(0)), I = new Array(N).fill(0);
  const st = (a, b, g) => { if (a >= 0) A[a][a] += g; if (b >= 0) A[b][b] += g; if (a >= 0 && b >= 0){ A[a][b] -= g; A[b][a] -= g; } };
  elems.forEach(e => {
    const a = id(e.a), b = id(e.b);
    if (e.src){ const g = 1 / (e.ri || 0.05); st(a, b, g); if (a >= 0) I[a] += g * e.v; if (b >= 0) I[b] -= g * e.v; }
    else st(a, b, 1 / Math.max(opt.cold && e.r0 != null ? e.r0 : e.r, 1e-4));
  });
  const leak = opt.leak == null ? 1e-9 : opt.leak;
  for (let k = 0; k < N; k++) A[k][k] += leak;
  if (opt.inject){ const k = id(opt.inject.node); if (k >= 0) I[k] += opt.inject.i; }
  const x = gauss(A, I);
  const v = n => (n === ground ? 0 : (idx.has(n) ? x[idx.get(n)] : 0));
  return {v, srcI: e => (e.v - (v(e.a) - v(e.b))) / (e.ri || 0.05)};
};
/* nodes joined by conducting elements (sources included when withSrc) */
C.groups = function(elems, withSrc){
  const p = {}; const f = n => { if (p[n] == null) p[n] = n; while (p[n] !== n){ p[n] = p[p[n]]; n = p[n]; } return n; };
  elems.forEach(e => { if (e.src && !withSrc) return; const a = f(e.a), b = f(e.b); if (a !== b) p[a] = b; });
  return n => f(n);
};
/* resistance a–b with all sources removed (the meter's Ω range on a dead circuit). Infinity = open (OL) */
C.resistance = function(elems, a, b){
  if (a === b) return 0;
  const el = elems.filter(e => !e.src), g = C.groups(el, false);
  if (g(a) !== g(b)) return Infinity;
  const comp = el.filter(e => g(e.a) === g(a));
  const s = C.solve(comp, {ground:b, inject:{node:a, i:1}, cold:true, leak:1e-12});
  return s.v(a);
};
/* is node n connected (galvanically) to an active source? */
C.live = function(elems, n){
  const src = elems.filter(e => e.src); if (!src.length) return false;
  const g = C.groups(elems, true); return src.some(s => g(s.a) === g(n));
};

/* ---------------- small shared drawing helpers ---------------- */
let uid = 0; const U = p => p + (++uid);
BL.uid = U;
const WIRE = {L:'#7a4a22', L2:'#1d1d1d', L3:'#8b9196', N:'#1f6fd1', PE:'gy'};
BL.WIRE = WIRE;
/* a short realistic piece of insulated cable (for the colour drill) */
BL.cableSVG = function(col, label){
  const g = U('cb');
  const gy = col === 'gy';
  const base = gy ? '#2e9b3c' : col;
  return `<svg class="swatch" viewBox="0 0 280 60" role="img" aria-label="${esc(label || 'سلك')}"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>${gy ? `<pattern id="${g}p" width="34" height="60" patternUnits="userSpaceOnUse" patternTransform="skewX(-35)"><rect width="34" height="60" fill="#2e9b3c"/><rect width="13" height="60" fill="#f2d21b"/></pattern>` : ''}</defs>
  <rect x="38" y="16" width="226" height="28" rx="14" fill="${gy ? `url(#${g}p)` : base}"/><rect x="38" y="16" width="226" height="28" rx="14" fill="url(#${g})"/>
  <path d="M8 26h34v8H8z" fill="#c98a3a"/><path d="M8 27h34M8 30h34M8 33h34" stroke="#f3c27a" stroke-width=".9"/><path d="M8 26h34v8H8z" fill="url(#${g})"/></svg>`;
};

/* ---------------- oscilloscope (waves, PSU stages) ---------------- */
function Scope(host, opt){
  const W = 360, H = 210, X0 = 44, X1 = 350, Y0 = 14, Y1 = 186, gid = U('sc');
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="شاشة بتعرض شكل الجهد مع الوقت"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1a14"/><stop offset="1" stop-color="#08110c"/></linearGradient></defs>
    <rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="6" fill="url(#${gid})"/><g class="grid"></g><g class="tr"></g><g class="lab"></g>
    <text x="${(X0 + X1) / 2}" y="${H - 4}" text-anchor="middle" class="ar" style="font-size:11px;fill:var(--muted)">الوقت ← (الشاشة كلها 40 مللي ثانية)</text></svg>`;
  const svg = host.firstElementChild, gG = svg.querySelector('.grid'), gT = svg.querySelector('.tr'), gL = svg.querySelector('.lab');
  let cfg = null, t0 = 0, raf = 0, visible = true, last = 0;
  const yOf = v => (Y0 + Y1) / 2 - v / cfg.ymax * (Y1 - Y0) / 2;
  function grid(){
    let s = '';
    for (let i = 0; i <= 8; i++){ const x = X0 + (X1 - X0) * i / 8; s += `<line x1="${x}" y1="${Y0}" x2="${x}" y2="${Y1}" stroke="#2b4a3a" stroke-width="${i % 4 ? .6 : 1}"/>`; }
    for (let i = 0; i <= 6; i++){ const y = Y0 + (Y1 - Y0) * i / 6; s += `<line x1="${X0}" y1="${y}" x2="${X1}" y2="${y}" stroke="#2b4a3a" stroke-width="${i === 3 ? 1.4 : .6}"/>`; }
    gG.innerHTML = s;
    gL.innerHTML = [cfg.ymax, cfg.ymax / 2, 0, -cfg.ymax / 2, -cfg.ymax].map(v => `<text x="${X0 - 4}" y="${yOf(v) + 4}" text-anchor="end" style="font-size:10px;fill:var(--muted)">${v > 0 ? '+' : ''}${Math.round(v)}</text>`).join('') + `<text x="${X0 - 4}" y="${Y0 - 3}" text-anchor="end" style="font-size:10px;fill:var(--muted)">V</text>`;
  }
  function draw(ts){
    const ph = reduced() ? 0 : ((ts - t0) / 1000) * (cfg.speed == null ? 0.004 : cfg.speed);
    let s = '';
    cfg.traces.forEach(tr => {
      let d = ''; const n = 160;
      const ys = tr.series ? tr.series(ph) : null;
      for (let i = 0; i <= n; i++){ const t = i / n * 0.04; const v = ys ? ys[i] : tr.fn(t + ph); d += (i ? 'L' : 'M') + (X0 + (X1 - X0) * i / n).toFixed(1) + ' ' + yOf(v).toFixed(1); }
      s += `<path d="${d}" fill="none" stroke="${tr.color}" stroke-width="2.6" stroke-linejoin="round" style="filter:drop-shadow(0 0 3px ${tr.color})"/>`;
      if (tr.label) s += `<text x="${X1 - 6}" y="${Math.max(Y0 + 12, yOf(tr.labelAt != null ? tr.labelAt : (ys ? ys[n] : tr.fn(0.04 + ph))) - 6)}" text-anchor="end" style="font:700 11px var(--font-body);unicode-bidi:plaintext;fill:${tr.color};paint-order:stroke;stroke:#08110c;stroke-width:3px">${tr.label}</text>`;
    });
    gT.innerHTML = s;
    if (opt && opt.onFrame) opt.onFrame(ph);
  }
  function loop(ts){ raf = 0; if (!visible || !cfg) return; if (ts - last > 33){ last = ts; draw(ts); } if (!reduced()) raf = requestAnimationFrame(loop); }
  if ('IntersectionObserver' in window){ new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(host); }
  return {set(c){ cfg = c; grid(); draw(performance.now()); if (!raf) raf = requestAnimationFrame(loop); }};
}
BL.Scope = Scope;

/* ---------------- L1: water ↔ electricity, Ohm's law ---------------- */
BL.ohm = function(host, opt){
  const g = U('oh');
  host.innerHTML = `<div class="wd-art"><svg viewBox="0 0 360 330" role="img" aria-label="تشبيه الكهربا بالميّة: خزان ومواسير، وجنبه دايرة بطارية ومقاومة ولمبة">
  <defs>
    <linearGradient id="${g}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6cb8f2"/><stop offset="1" stop-color="#1f6fbf"/></linearGradient>
    <linearGradient id="${g}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d1d6"/><stop offset=".5" stop-color="#f4f6f7"/><stop offset="1" stop-color="#8d979d"/></linearGradient>
    <linearGradient id="${g}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2f33"/><stop offset=".45" stop-color="#4b545b"/><stop offset="1" stop-color="#1c2023"/></linearGradient>
    <radialGradient id="${g}g"><stop offset="0" stop-color="#fff7c2"/><stop offset=".45" stop-color="#ffd84a" stop-opacity=".85"/><stop offset="1" stop-color="#ffb300" stop-opacity="0"/></radialGradient>
  </defs>
  <text x="180" y="16" text-anchor="middle" class="dev-ar">الميّة</text>
  <rect x="20" y="24" width="74" height="112" rx="6" fill="url(#${g}p)" stroke="#7d878d"/>
  <rect class="o-tank" x="26" y="60" width="62" height="70" rx="3" fill="url(#${g}w)"/>
  <text x="57" y="152" text-anchor="middle" class="dev-ars">الخزان = البطارية</text>
  <rect x="94" y="104" width="246" height="26" fill="url(#${g}p)" stroke="#7d878d"/>
  <path class="o-pw" d="" fill="url(#${g}w)" opacity=".9"/>
  <path class="o-nwall" d="" fill="url(#${g}p)" stroke="#7d878d"/>
  <line class="o-wflow flow" x1="96" y1="117" x2="338" y2="117" stroke="#e8f6ff" stroke-width="3" stroke-dasharray="6 18" stroke-linecap="round"/>
  <g transform="translate(296 117)"><circle r="24" fill="var(--panel)" stroke="#7d878d" stroke-width="2"/><g class="o-wheel"><path d="M0-20V20M-20 0H20M-14-14L14 14M14-14L-14 14" stroke="#1f6fbf" stroke-width="4" stroke-linecap="round"/></g><circle r="5" fill="#7d878d"/></g>
  <text x="198" y="150" text-anchor="middle" class="dev-ars">الزنقة = المقاومة</text>
  <text x="296" y="160" text-anchor="middle" class="dev-ars">التُربينة = اللمبة</text>
  <line x1="12" y1="172" x2="348" y2="172" stroke="var(--line)" stroke-dasharray="4 4"/>
  <text x="180" y="192" text-anchor="middle" class="dev-ar">الكهربا</text>
  <path class="o-loop" d="M58 214 H300 V306 H58 Z" fill="none" stroke="#7a4a22" stroke-width="4" stroke-linejoin="round"/>
  <path class="o-eflow flow" d="M58 214 H300 V306 H58 Z" fill="none" stroke="#ffe27a" stroke-width="2.4" stroke-dasharray="6 18" stroke-linecap="round"/>
  <g transform="translate(40 230)"><rect x="0" y="0" width="36" height="62" rx="5" fill="url(#${g}b)"/><rect x="10" y="-6" width="16" height="7" rx="2" fill="#b9c1c6"/><rect x="0" y="16" width="36" height="20" fill="#e2a31a"/><text x="18" y="30" text-anchor="middle" style="font-size:10px;font-weight:700;fill:#1c2023" class="o-vtxt">12V</text><text x="18" y="13" text-anchor="middle" style="font-size:12px;fill:#fff">+</text></g>
  <g transform="translate(150 214)"><rect x="-30" y="-9" width="60" height="18" rx="7" fill="#d8c29a" stroke="#8a7550"/><rect x="-18" y="-9" width="5" height="18" fill="#8b5a2b"/><rect x="-8" y="-9" width="5" height="18" fill="#222"/><rect x="2" y="-9" width="5" height="18" fill="#c0352b"/><rect x="18" y="-9" width="4" height="18" fill="#c8a24a"/><text x="0" y="-15" text-anchor="middle" class="dev-t o-rtxt">12Ω</text></g>
  <g transform="translate(300 258)"><circle class="o-glow" r="40" fill="url(#${g}g)" opacity="0"/><path d="M-13 10 C-26 -2 -22 -28 0 -28 C22 -28 26 -2 13 10 Z" fill="#f4f1e6" fill-opacity=".55" stroke="#9aa3a8" stroke-width="1.5" class="o-bulb"/><path d="M-6 8 L-3 -10 L0 -4 L3 -10 L6 8" fill="none" stroke="#6b5a3a" stroke-width="1.6" class="o-fil"/><rect x="-11" y="10" width="22" height="14" rx="2" fill="#b0b7bc" stroke="#7d878d"/><path d="M-11 15h22M-11 19h22" stroke="#7d878d"/></g>
  </svg></div>
  <div class="read"><div><span>الجهد V</span><b class="o-V">12 V</b></div><div><span>المقاومة R</span><b class="o-R">12 Ω</b></div><div><span>التيار I = V ÷ R</span><b class="o-I">1.00 A</b></div><div><span>القدرة P = V × I</span><b class="o-P">12 W</b></div></div>
  <div class="wd-ctl"><label>الجهد (الضغط): <b class="o-vl">12 V</b><input type="range" min="0" max="24" step="1" value="12" class="o-sv" aria-label="الجهد بالفولت"></label>
  <label>المقاومة (الزنقة): <b class="o-rl">12 Ω</b><input type="range" min="2" max="48" step="1" value="12" class="o-sr" aria-label="المقاومة بالأوم"></label></div>
  <p class="chal o-chal">تحدّي: حرّك الجهد والمقاومة لحد ما <b>التيار يبقى 2 أمبير بالظبط</b>. (فكّر: I = V ÷ R)</p>`;
  const sv = $('.o-sv', host), sr = $('.o-sr', host);
  function upd(){
    const V = +sv.value, R = +sr.value, I = V / R, P = V * I;
    $('.o-V', host).textContent = V + ' V'; $('.o-R', host).textContent = R + ' Ω'; $('.o-I', host).textContent = fmt(I, 2) + ' A'; $('.o-P', host).textContent = fmt(P, 1) + ' W';
    $('.o-vl', host).textContent = V + ' V'; $('.o-rl', host).textContent = R + ' Ω'; $('.o-vtxt', host).textContent = V + 'V'; $('.o-rtxt', host).textContent = R + 'Ω';
    const lvl = V / 24 * 70; const tk = $('.o-tank', host); tk.setAttribute('y', 130 - lvl); tk.setAttribute('height', Math.max(lvl, 0.01));
    const th = Math.max(3, Math.min(18, 36 / R * 1.0 + 2)); const top = 117 - th / 2;
    $('.o-nwall', host).setAttribute('d', `M166 104 H230 V${top} H166 Z M166 ${top + th} H230 V130 H166 Z`);
    $('.o-pw', host).setAttribute('d', `M94 108 H166 V${top} H230 V108 H340 V126 H230 V${top + th} H166 V126 H94 Z`);
    const dur = I > 0 ? Math.max(0.12, Math.min(6, 1.2 / I)) : 0;
    [$('.o-wflow', host), $('.o-eflow', host)].forEach(p => { p.style.setProperty('--dur', (dur || 1) + 's'); p.style.opacity = I > 0 ? 1 : 0; });
    $('.o-pw', host).style.opacity = V > 0 ? .9 : .15;
    const wh = $('.o-wheel', host); wh.style.transformBox = 'fill-box'; wh.style.transformOrigin = 'center';
    wh.animate && (wh._a && wh._a.cancel(), I > 0 && !reduced() && (wh._a = wh.animate([{transform:'rotate(0)'}, {transform:'rotate(360deg)'}], {duration:Math.max(250, 2400 / I), iterations:Infinity})));
    const b = Math.min(1, P / 48);
    $('.o-glow', host).setAttribute('opacity', b.toFixed(2)); $('.o-bulb', host).setAttribute('fill', b > .05 ? '#ffe680' : '#f4f1e6'); $('.o-fil', host).setAttribute('stroke', b > .05 ? '#ff9a00' : '#6b5a3a');
    if (Math.abs(I - 2) < 1e-9 && opt && opt.lesson){ $('.o-chal', host).classList.add('ok'); BL.mark(opt.lesson, 'ohm'); }
  }
  sv.addEventListener('input', upd); sr.addEventListener('input', upd); upd();
  if (opt && opt.lesson && BL.has(opt.lesson, 'ohm')) $('.o-chal', host).classList.add('ok');
  return {set(V, R){ sv.value = V; sr.value = R; upd(); }};
};

/* ---------------- L1: electricity bill ---------------- */
BL.bill = function(host, opt){
  const items = opt.items;
  host.innerHTML = `<div class="tblw"><table class="tbl"><thead><tr><th>الجهاز</th><th>القدرة</th><th>ساعات في اليوم</th><th>kWh في الشهر</th></tr></thead><tbody>${items.map((it, i) => `<tr><td>${it.name}</td><td class="mono">${it.w} W</td><td><input class="inp b-h" type="number" min="0" max="24" step="0.5" value="${it.h}" data-i="${i}" aria-label="ساعات تشغيل ${esc(it.name)}" style="width:5.5em;font-family:var(--font-mono);direction:ltr"></td><td class="mono b-k" data-i="${i}"></td></tr>`).join('')}</tbody></table></div>
  <div class="wd-ctl"><label style="flex:1 1 auto">سعر الكيلووات ساعة (بالجنيه، حسب شريحتك): <input class="inp b-p" type="number" min="0" step="0.05" value="${opt.price}" style="width:7em;font-family:var(--font-mono);direction:ltr"></label></div>
  <div class="read"><div><span>المجموع في الشهر</span><b class="b-sum"></b></div><div><span>التكلفة التقريبية</span><b class="b-cost"></b></div></div>
  <div class="chal b-chal">تحدّي: سخان <b>2000 وات</b> شغال <b>3 ساعات</b> كل يوم، يستهلك كام <b>kWh في الشهر (30 يوم)</b>؟
  <div class="wd-ctl" style="margin-top:6px"><input class="inp b-ans" type="number" step="any" aria-label="إجابتك بالكيلووات ساعة" style="width:7em;font-family:var(--font-mono);direction:ltr"><button type="button" class="btn b-chk" style="flex:0 1 auto">اتأكد</button><span class="msg b-msg" aria-live="polite"></span></div></div>`;
  function upd(){
    let sum = 0;
    $$('.b-h', host).forEach(inp => { const i = +inp.dataset.i, h = Math.max(0, Math.min(24, +inp.value || 0)), k = items[i].w * h * 30 / 1000; sum += k; $(`.b-k[data-i="${i}"]`, host).textContent = fmt(k, 1); });
    const p = +$('.b-p', host).value || 0;
    $('.b-sum', host).textContent = fmt(sum, 1) + ' kWh'; $('.b-cost', host).textContent = fmt(sum * p, 0) + ' جنيه';
  }
  host.addEventListener('input', upd); upd();
  const chal = $('.b-chal', host); if (BL.has(opt.lesson, 'bill')) chal.classList.add('ok');
  $('.b-chk', host).addEventListener('click', () => {
    const v = +$('.b-ans', host).value, m = $('.b-msg', host);
    if (Math.abs(v - 180) < 0.01){ m.className = 'msg b-msg ok'; m.textContent = 'صح: 2000W = 2kW × 3 ساعات = 6 kWh في اليوم × 30 = 180 kWh.'; chal.classList.add('ok'); BL.mark(opt.lesson, 'bill'); }
    else { m.className = 'msg b-msg bad'; m.textContent = 'لأ. حوّل الوات لكيلووات الأول (÷ 1000)، واضرب في الساعات، وبعدين في 30 يوم.'; }
  });
};

/* ---------------- L2: DC / AC / 3-phase scope ---------------- */
BL.waves = function(host, opt){
  const modes = [
    {k:'dc', t:'DC بطارية العربية', ymax:15, traces:[{fn:() => 12.6, color:'#ffcf3a', label:'+12.6V'}], txt:'<b>DC:</b> الجهد ثابت ومش بيغيّر اتجاهه. بطارية العربية 12V، والموبايل 3.7V، وخرج الشاحن 5V. ليها طرف <b>+</b> وطرف <b>−</b>.'},
    {k:'ac', t:'AC كهربا البيت', ymax:350, traces:[{fn:t => 311 * Math.sin(2 * Math.PI * 50 * t), color:'#ff8f3a', label:'220V~'}], txt:'<b>AC:</b> الجهد بيطلع وينزل ويعكس اتجاهه <b>50 مرة في الثانية (50Hz)</b>. القمة حوالي <b>311V</b>، بس العداد بيقول <b>220V</b> لأنه بيقيس "القيمة الفعّالة" (RMS) اللي بتعمل نفس شغل DC 220V.'},
    {k:'3p', t:'تلاتة فاز', ymax:350, traces:[0, 1, 2].map(i => ({fn:t => 311 * Math.sin(2 * Math.PI * 50 * t - i * 2 * Math.PI / 3), color:['#c8803f', '#e9edf0', '#9aa3a8'][i], label:['L1', 'L2', 'L3'][i]})), txt:'<b>3 فاز:</b> تلات موجات كل واحدة متأخرة عن التانية <b>تلت لفّة (120°)</b>. بين أي فاز والنيوترال <b>220V</b>، وبين أي فازتين <b>380V</b>. ده اللي بيشغّل الموتورات الكبيرة في المصانع.'}
  ];
  host.innerHTML = `<div class="tabs" role="group" aria-label="نوع الكهربا">${modes.map((m, i) => `<button type="button" class="btn" data-m="${i}" aria-pressed="false">${m.t}</button>`).join('')}</div><div class="wd-art w-sc"></div><p class="w-txt" aria-live="polite"></p>`;
  const sc = Scope($('.w-sc', host)), seen = new Set();
  function set(i){
    const m = modes[i]; $$('[data-m]', host).forEach(b => b.setAttribute('aria-pressed', +b.dataset.m === i ? 'true' : 'false'));
    sc.set({ymax:m.ymax, traces:m.traces, speed:0.004}); $('.w-txt', host).innerHTML = m.txt;
    seen.add(i); $(`[data-m="${i}"]`, host).classList.add('done');
    if (seen.size === modes.length && opt && opt.lesson) BL.mark(opt.lesson, 'wave');
  }
  host.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) set(+b.dataset.m); });
  set(0);
  return {set};
};

/* ---------------- L3: screwdriver tester on a wall socket ---------------- */
BL.tester = function(host, opt){
  const g = U('ts');
  const pts = [
    {id:'L', x:146, y:150, t:'الفتحة الشمال', live:true},
    {id:'N', x:214, y:150, t:'الفتحة اليمين', live:false},
    {id:'E', x:180, y:96, t:'ريشة الأرضي', live:false},
    {id:'S', x:180, y:236, t:'مسمار الوش', live:false}
  ];
  host.innerHTML = `<div class="wd-art"><svg viewBox="0 0 360 300" role="group" aria-label="بريزة في الحيطة ومفك اختبار">
  <defs>
    <linearGradient id="${g}pl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe3e6"/></linearGradient>
    <radialGradient id="${g}cup" cx=".5" cy=".4"><stop offset="0" stop-color="#d5dadd"/><stop offset="1" stop-color="#f8f9fa"/></radialGradient>
    <linearGradient id="${g}h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c62828"/><stop offset=".5" stop-color="#ef5350"/><stop offset="1" stop-color="#9f1f1f"/></linearGradient>
    <linearGradient id="${g}m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d969c"/><stop offset=".5" stop-color="#eef1f3"/><stop offset="1" stop-color="#7a848a"/></linearGradient>
    <radialGradient id="${g}ne"><stop offset="0" stop-color="#fff2c4"/><stop offset=".4" stop-color="#ff8a1e"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient>
  </defs>
  <rect x="0" y="0" width="360" height="300" fill="var(--wall)"/>
  <rect x="80" y="30" width="200" height="236" rx="18" fill="#000" opacity=".12" transform="translate(4 5)"/>
  <rect x="80" y="30" width="200" height="236" rx="18" fill="url(#${g}pl)" stroke="#b8bfc4"/>
  <circle cx="180" cy="150" r="74" fill="url(#${g}cup)" stroke="#c3c9cd" stroke-width="2"/>
  <circle cx="180" cy="150" r="66" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>
  <rect x="168" y="80" width="24" height="12" rx="2" fill="url(#${g}m)" stroke="#7a848a"/><rect x="168" y="208" width="24" height="12" rx="2" fill="url(#${g}m)" stroke="#7a848a"/>
  <circle cx="146" cy="150" r="10" fill="#1d2226"/><circle cx="146" cy="150" r="6" fill="#3b4247"/>
  <circle cx="214" cy="150" r="10" fill="#1d2226"/><circle cx="214" cy="150" r="6" fill="#3b4247"/>
  <circle cx="180" cy="236" r="9" fill="url(#${g}m)" stroke="#7a848a"/><path d="M174 236h12" stroke="#4d565c" stroke-width="2"/>
  <g class="t-pts">${pts.map(p => `<circle class="mp-hit" data-p="${p.id}" cx="${p.x}" cy="${p.y}" r="22" tabindex="0" role="button" aria-label="المس ${p.t}"/><circle class="mp-dot" cx="${p.x}" cy="${p.y}" r="15" style="fill:transparent;stroke-dasharray:4 3;opacity:.8"/>`).join('')}</g>
  <g class="t-tool" style="transition:transform .35s ease" transform="translate(262 292)">
    <g transform="rotate(35)">
      <rect x="-2.5" y="-62" width="5" height="62" fill="url(#${g}m)"/><path d="M-2.5 -2 L0 6 L2.5 -2Z" fill="#7a848a"/>
      <rect x="-9" y="-150" width="18" height="90" rx="6" fill="url(#${g}h)"/>
      <rect x="-6" y="-138" width="12" height="40" rx="3" fill="#fbe9e7" opacity=".8"/>
      <ellipse class="t-neon" cx="0" cy="-118" rx="4" ry="11" fill="#c9b8a0"/>
      <circle class="t-glow" cx="0" cy="-118" r="22" fill="url(#${g}ne)" opacity="0"/>
      <rect x="-7" y="-160" width="14" height="12" rx="3" fill="url(#${g}m)" stroke="#5f686e"/>
      <ellipse cx="0" cy="-170" rx="13" ry="10" fill="#e7b48f" opacity=".95"/><text x="18" y="-170" style="font-size:10px" class="ar" fill="var(--muted)">صباعك</text>
    </g></g>
  </svg></div>
  <p class="msg t-msg" aria-live="polite">دوس على أي نقطة في البريزة عشان تلمسها بسن مفك الاختبار.</p>
  <ul class="mm-ex t-list">${pts.map(p => `<li data-l="${p.id}">${p.t}: <b>لسه ماجرّبتش</b></li>`).join('')}</ul>`;
  const done = new Set();
  function touch(id){
    const p = pts.find(x => x.id === id); if (!p) return;
    $('.t-tool', host).setAttribute('transform', `translate(${p.x + 3} ${p.y + 4})`);
    $('.t-glow', host).setAttribute('opacity', p.live ? 1 : 0); $('.t-neon', host).setAttribute('fill', p.live ? '#ff7a1a' : '#c9b8a0');
    const m = $('.t-msg', host);
    m.className = 'msg t-msg ' + (p.live ? 'bad' : '');
    m.innerHTML = p.live ? `<b>${p.t}: اللمبة نوّرت</b>، يعني ده <b>الفاز (L)</b>. التيار بيعدّي في مقاومة كبيرة جوه المفك وفي جسمك للأرض، صغيّر جدًا فمش بتحس بيه.` :
      (id === 'N' ? `<b>${p.t}: مفيش نور</b>، ده <b>النيوترال (N)</b>. جهده قريب من الأرض فمفيش تيار يعدّي في المفك.` : id === 'E' ? `<b>${p.t}: مفيش نور</b>، دي <b>الأرضي (PE)</b>، متوصّلة بالأرض فجهدها صفر.` : `<b>${p.t}: مفيش نور</b>. المسمار مش متوصّل بالكهربا.`);
    $(`[data-l="${id}"] b`, host).textContent = p.live ? 'نوّر ⇐ فاز' : 'مانوّرش';
    $(`[data-l="${id}"]`, host).classList.add('ok');
    done.add(id); if (['L', 'N', 'E'].every(k => done.has(k)) && opt && opt.lesson) BL.mark(opt.lesson, 'tester');
  }
  host.addEventListener('click', e => { const t = e.target.closest('[data-p]'); if (t) touch(t.dataset.p); });
  host.addEventListener('keydown', e => { const t = e.target.closest('[data-p]'); if (t && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); touch(t.dataset.p); } });
  return {touch};
};

/* ---------------- L3: RCD / earth-leakage breaker ---------------- */
BL.rcd = function(host, opt){
  const g = U('rc');
  host.innerHTML = `<div class="wd-art"><svg viewBox="0 0 360 230" role="img" aria-label="قاطع تسريب بيقارن تيار الفاز بتيار النيوترال">
  <defs><linearGradient id="${g}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9ecee"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#d3d8db"/></linearGradient>
  <linearGradient id="${g}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa3a8"/><stop offset=".5" stop-color="#e3e7ea"/><stop offset="1" stop-color="#7e888e"/></linearGradient></defs>
  <rect x="10" y="70" width="340" height="16" fill="url(#${g}r)"/>
  <rect x="24" y="18" width="104" height="194" rx="8" fill="url(#${g}b)" stroke="#9aa3a8"/>
  <rect x="34" y="34" width="84" height="22" rx="3" fill="#eef1f3" stroke="#c3c9cd"/><text x="76" y="49" text-anchor="middle" style="font-size:10px;font-weight:700;fill:#1d2226">RCD 30mA</text>
  <rect x="52" y="76" width="48" height="70" rx="6" fill="#d7dbde" stroke="#9aa3a8"/>
  <rect class="r-lev" x="62" y="80" width="28" height="30" rx="4" fill="#1d2226"/>
  <text class="r-st ar" x="76" y="164" text-anchor="middle" style="font-size:12px;font-weight:700;fill:#2b7a3d">ON</text>
  <circle cx="76" cy="190" r="10" fill="#f2c94c" stroke="#a88a2a"/><text x="76" y="194" text-anchor="middle" style="font-size:10px;font-weight:700;fill:#1d2226">T</text>
  <path d="M128 112 H230" stroke="#7a4a22" stroke-width="5"/><path d="M128 132 H230" stroke="#1f6fd1" stroke-width="5"/>
  <text x="180" y="105" text-anchor="middle" style="font-size:11px;font-weight:700;fill:var(--ink)" class="r-il">L: 9.000 A</text>
  <text x="180" y="150" text-anchor="middle" style="font-size:11px;font-weight:700;fill:var(--ink)" class="r-in">N: 9.000 A</text>
  <rect x="230" y="96" width="58" height="52" rx="6" fill="var(--panel)" stroke="var(--line)"/><text x="259" y="127" text-anchor="middle" class="ar" style="font-size:11px;fill:var(--ink)">سخان</text>
  <g class="r-man" opacity="0"><circle cx="318" cy="128" r="9" fill="#e7b48f"/><path d="M318 137 V172 M318 146 L300 130 M318 146 L332 158 M318 172 L308 200 M318 172 L328 200" stroke="#e7b48f" stroke-width="5" stroke-linecap="round"/><path d="M300 130 L288 124" stroke="#ff5a00" stroke-width="2" stroke-dasharray="3 3"/><text x="318" y="216" text-anchor="middle" class="ar" style="font-size:10px;fill:var(--muted)">التسريب بيروح للأرض</text></g>
  </svg></div>
  <div class="read"><div><span>الفرق بين L و N</span><b class="r-d">0 mA</b></div><div><span>القاطع</span><b class="r-s">شغّال</b></div></div>
  <div class="wd-ctl"><label>تيار بيهرب للأرض (تسريب): <b class="r-vl">0 mA</b><input type="range" min="0" max="60" step="1" value="0" class="r-sl" aria-label="تيار التسريب بالمللي أمبير"></label>
  <button type="button" class="btn r-touch">حد لمس سلك فاز عريان</button><button type="button" class="btn r-reset">ارفع القاطع تاني</button></div>
  <p class="msg r-msg" aria-live="polite">التيار اللي داخل في الفاز لازم يرجع كله في النيوترال. لو جزء منه هرب للأرض (من جسم إنسان أو جسم جهاز) القاطع بيحس بالفرق ويفصل.</p>`;
  let tripped = false;
  const sl = $('.r-sl', host);
  function upd(){
    const ma = +sl.value, il = tripped ? 0 : 9, inn = tripped ? 0 : 9 - ma / 1000;
    $('.r-vl', host).textContent = ma + ' mA';
    if (!tripped && ma >= 30){ tripped = true; return upd(); }
    $('.r-il', host).textContent = 'L: ' + fmt(il, 3) + ' A'; $('.r-in', host).textContent = 'N: ' + fmt(tripped ? 0 : inn, 3) + ' A';
    $('.r-d', host).textContent = (tripped ? 0 : ma) + ' mA'; $('.r-s', host).textContent = tripped ? 'فصل ✓' : 'شغّال';
    $('.r-lev', host).setAttribute('y', tripped ? 112 : 80); $('.r-st', host).textContent = tripped ? 'OFF' : 'ON'; $('.r-st', host).style.fill = tripped ? '#c0352b' : '#2b7a3d';
    $('.r-man', host).setAttribute('opacity', ma > 0 ? 1 : 0);
    const m = $('.r-msg', host);
    if (tripped){ m.className = 'msg r-msg ok'; m.innerHTML = 'القاطع <b>فصل في أقل من 0.04 ثانية</b> لما الفرق وصل 30mA. ده اللي بينقذ حياة اللي لمس الفاز. (القاطع العادي MCB مش هيحس بـ 30mA أبدًا، هو بيفصل على الأمبيرات الكبيرة بس).'; if (opt && opt.lesson) BL.mark(opt.lesson, 'rcd'); }
    else { m.className = 'msg r-msg'; m.innerHTML = ma ? `في <b>${ma}mA</b> بيهربوا للأرض. لسه أقل من 30mA فالقاطع مستحمل. زوّد شوية...` : 'التيار اللي داخل في الفاز لازم يرجع كله في النيوترال. لو جزء منه هرب للأرض (من جسم إنسان أو جسم جهاز) القاطع بيحس بالفرق ويفصل.'; }
  }
  sl.addEventListener('input', upd);
  $('.r-touch', host).addEventListener('click', () => { sl.value = 50; upd(); });
  $('.r-reset', host).addEventListener('click', () => { sl.value = 0; tripped = false; upd(); });
  upd();
};

/* ---------------- L5: clamp meter ---------------- */
BL.clamp = function(host, opt){
  const apps = opt.apps; const g = U('cl');
  host.innerHTML = `<div class="wd-ctl"><label style="flex:1 1 100%">الجهاز الشغّال: <select class="inp c-app">${apps.map((a, i) => `<option value="${i}">${a.name} (${a.w}W)</option>`).join('')}</select></label></div>
  <div class="tabs c-pos" role="group" aria-label="الكلامب حوالين إيه">
    <button type="button" class="btn" data-c="L" aria-pressed="true">حوالين البني (فاز)</button><button type="button" class="btn" data-c="N" aria-pressed="false">حوالين الأزرق (نيوترال)</button><button type="button" class="btn" data-c="LN" aria-pressed="false">حوالين الكابل كله</button></div>
  <div class="wd-art"><svg viewBox="0 0 360 250" role="img" aria-label="كلامب ميتر حوالين سلك">
  <defs><linearGradient id="${g}y" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d89a12"/><stop offset=".5" stop-color="#f6c33b"/><stop offset="1" stop-color="#c88a0c"/></linearGradient>
  <linearGradient id="${g}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
  <pattern id="${g}gy" width="22" height="12" patternUnits="userSpaceOnUse" patternTransform="skewX(-35)"><rect width="22" height="12" fill="#2e9b3c"/><rect width="8" height="12" fill="#f2d21b"/></pattern></defs>
  <rect x="0" y="34" width="70" height="40" rx="8" fill="#e6e8ea" stroke="#a7afb4"/><rect x="0" y="34" width="70" height="40" rx="8" fill="url(#${g}c)"/>
  <rect x="290" y="34" width="70" height="40" rx="8" fill="#e6e8ea" stroke="#a7afb4"/><rect x="290" y="34" width="70" height="40" rx="8" fill="url(#${g}c)"/>
  <rect x="66" y="38" width="228" height="8" rx="4" fill="#7a4a22"/><rect x="66" y="38" width="228" height="8" rx="4" fill="url(#${g}c)"/>
  <rect x="66" y="50" width="228" height="8" rx="4" fill="#1f6fd1"/><rect x="66" y="50" width="228" height="8" rx="4" fill="url(#${g}c)"/>
  <rect x="66" y="62" width="228" height="8" rx="4" fill="url(#${g}gy)"/><rect x="66" y="62" width="228" height="8" rx="4" fill="url(#${g}c)"/>
  <text x="34" y="96" text-anchor="middle" class="ar" style="font-size:11px;fill:var(--muted)">من البريزة</text><text x="326" y="96" text-anchor="middle" class="ar" style="font-size:11px;fill:var(--muted)">للجهاز</text>
  <g class="c-jaw" style="transition:transform .35s ease">
    <path class="c-ring" d="" fill="none" stroke="url(#${g}y)" stroke-width="11"/>
    <path d="M165 72 L158 120 H202 L195 72 Z" fill="url(#${g}y)"/>
    <rect x="140" y="118" width="80" height="124" rx="14" fill="url(#${g}y)" stroke="#a5720a"/>
    <rect x="150" y="128" width="60" height="34" rx="4" fill="var(--lcd)" stroke="#5c6650"/>
    <text class="c-lcd" x="206" y="152" text-anchor="end" style="font:600 17px var(--font-mono);fill:var(--lcd-ink)">0.00</text>
    <text x="153" y="158" style="font-size:8px;fill:var(--lcd-ink)">A~</text>
    <circle cx="180" cy="198" r="18" fill="#2a2f33" stroke="#111"/><rect x="178" y="182" width="4" height="12" rx="2" fill="#f6c33b"/>
    <text x="180" y="234" text-anchor="middle" style="font-size:8px;font-weight:700;fill:#2a2f33">CLAMP</text>
  </g></svg></div>
  <div class="read"><div><span>قراية الكلامب</span><b class="c-r">0.00 A</b></div><div><span>بالحساب I = P ÷ V</span><b class="c-calc"></b></div></div>
  <p class="msg c-msg" aria-live="polite"></p>`;
  let pos = 'L'; const seen = new Set();
  function upd(){
    const a = apps[+$('.c-app', host).value], I = a.w / 220;
    const val = pos === 'LN' ? 0 : I;
    $('.c-lcd', host).textContent = fmt(val, 2); $('.c-r', host).textContent = fmt(val, 2) + ' A'; $('.c-calc', host).textContent = fmt(I, 2) + ' A';
    const ys = {L:[42, 42], N:[54, 54], LN:[38, 70]}[pos], cy = (ys[0] + ys[1]) / 2, ry = (ys[1] - ys[0]) / 2 + 16;
    $('.c-ring', host).setAttribute('d', `M163 ${cy + ry - 4} A 26 ${ry} 0 1 1 197 ${cy + ry - 4}`);
    $$('[data-c]', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.c === pos ? 'true' : 'false'));
    const m = $('.c-msg', host);
    m.className = 'msg c-msg' + (pos === 'LN' ? ' bad' : ' ok');
    m.innerHTML = pos === 'LN' ? 'الشاشة <b>صفر</b>! التيار رايح في البني وراجع في الأزرق بنفس القيمة، فالمجال المغناطيسي بتاعهم بيلغي بعض. <b>الكلامب لازم يمسك سلك واحد بس.</b>' :
      `الكلامب بيقيس التيار من المجال المغناطيسي حوالين السلك، <b>من غير ما تفك ولا تقطع حاجة</b>. ${a.name} ${a.w}W على 220V ⇐ حوالي <b>${fmt(I, 1)}A</b>.`;
    seen.add(pos === 'LN' ? 'LN' : 'one');
    if (seen.has('LN') && seen.has('one') && opt.lesson) BL.mark(opt.lesson, 'clamp');
  }
  host.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b){ pos = b.dataset.c; upd(); } });
  $('.c-app', host).addEventListener('change', upd); upd();
  return {set(p){ pos = p; upd(); }};
};

/* ---------------- L6: transformer ---------------- */
BL.xfmr = function(host, opt){
  const g = U('xf');
  host.innerHTML = `<div class="wd-art"><svg viewBox="0 0 360 250" role="img" aria-label="ترانس: قلب حديد عليه ملف ابتدائي وملف ثانوي">
  <defs>
    <pattern id="${g}lam" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#6f777d"/><rect width="6" height="1.2" fill="#4a5156"/></pattern>
    <linearGradient id="${g}sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
    <linearGradient id="${g}cu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a4a1c"/><stop offset=".45" stop-color="#e59a52"/><stop offset="1" stop-color="#7a3f15"/></linearGradient>
    <radialGradient id="${g}gl"><stop offset="0" stop-color="#fff7c2"/><stop offset=".45" stop-color="#ffd84a" stop-opacity=".85"/><stop offset="1" stop-color="#ffb300" stop-opacity="0"/></radialGradient>
  </defs>
  <path d="M90 40 H270 V210 H90 Z M134 84 V166 H226 V84 Z" fill="url(#${g}lam)" fill-rule="evenodd"/>
  <path d="M90 40 H270 V210 H90 Z M134 84 V166 H226 V84 Z" fill="url(#${g}sh)" fill-rule="evenodd" stroke="#3f464b"/>
  <path class="x-flux flow" d="M112 62 H248 V188 H112 Z" fill="none" stroke="#7fd3ff" stroke-width="3" stroke-dasharray="6 18" stroke-linecap="round" style="--dur:.6s"/>
  <g class="x-p"></g><g class="x-s"></g>
  <path d="M74 80 H20 M74 170 H20" stroke="#7a4a22" stroke-width="3"/><circle cx="20" cy="80" r="5" fill="#d9dcde" stroke="#5d6469"/><circle cx="20" cy="170" r="5" fill="#d9dcde" stroke="#5d6469"/>
  <text x="14" y="128" class="ar" style="font-size:11px;fill:var(--ink);font-weight:700" text-anchor="start">داخل</text><text x="12" y="144" class="x-vpt" style="font-size:11px;font-weight:700;fill:var(--accent)">220V</text>
  <path d="M286 80 H322 M286 170 H322" stroke="#7a4a22" stroke-width="3"/>
  <g transform="translate(330 125)"><circle class="x-glow" r="30" fill="url(#${g}gl)" opacity="0"/><path d="M-8 -45 V45" stroke="#7a4a22" stroke-width="3"/><circle r="13" fill="#f4f1e6" fill-opacity=".6" stroke="#9aa3a8" stroke-width="1.5" class="x-bulb"/></g>
  <text x="112" y="232" text-anchor="middle" class="ar" style="font-size:11px;fill:var(--muted)">ابتدائي N1</text><text x="248" y="232" text-anchor="middle" class="ar" style="font-size:11px;fill:var(--muted)">ثانوي N2</text>
  <text x="180" y="30" text-anchor="middle" class="ar" style="font-size:11px;fill:var(--cur)">المجال المغناطيسي بيلف في القلب الحديد</text>
  </svg></div>
  <div class="read"><div><span>جهد الخرج Vs</span><b class="x-vs"></b></div><div><span>نسبة اللفّات N1 : N2</span><b class="x-rt"></b></div><div><span>تيار الابتدائي Ip</span><b class="x-ip"></b></div><div><span>تيار الثانوي Is</span><b class="x-is"></b></div></div>
  <div class="wd-ctl">
    <label>جهد الدخول Vp: <b class="x-l1"></b><input type="range" class="x-vp" min="0" max="240" step="10" value="220" aria-label="جهد الدخول"></label>
    <label>لفّات الابتدائي N1: <b class="x-l2"></b><input type="range" class="x-n1" min="500" max="1500" step="50" value="1100" aria-label="عدد لفات الابتدائي"></label>
    <label>لفّات الثانوي N2: <b class="x-l3"></b><input type="range" class="x-n2" min="20" max="600" step="10" value="120" aria-label="عدد لفات الثانوي"></label>
    <label>الحِمل على الخرج: <b class="x-l4"></b><input type="range" class="x-va" min="0" max="120" step="5" value="50" aria-label="الحمل بالفولت أمبير"></label>
  </div>
  <p class="msg x-msg" aria-live="polite"></p>
  <p class="chal x-chal">تحدّي: الدخول <b>220V</b>، خلّي الخرج <b>12V</b> عشان نشغّل لمبات بيان 12V. (الترانس ده 100VA)</p>`;
  const q = s => $(s, host);
  function coil(x, n, cls){
    const k = Math.max(2, Math.min(16, n)), top = 58, bot = 192, step = (bot - top) / k;
    let s = `<rect x="${x - 24}" y="${top - 6}" width="48" height="${bot - top + 12}" rx="6" fill="#3a2a1c"/>`;
    for (let i = 0; i < k; i++){ const y = top + i * step; s += `<rect x="${x - 26}" y="${y + 1}" width="52" height="${Math.max(2, step - 2)}" rx="${Math.min(4, step / 2)}" fill="url(#${g}cu)"/>`; }
    return s;
  }
  function upd(){
    const vp = +q('.x-vp').value, n1 = +q('.x-n1').value, n2 = +q('.x-n2').value, va = +q('.x-va').value;
    const vs = vp * n2 / n1, ip = vp ? va / vp : 0, is = vs > 0.5 ? va / vs : 0;
    q('.x-p').innerHTML = coil(112, Math.round(n1 / 100), 'p'); q('.x-s').innerHTML = coil(248, Math.round(n2 / 40), 's');
    q('.x-vs').textContent = fmt(vs, 1) + ' V'; q('.x-rt').textContent = fmt(n1 / n2, 2) + ' : 1';
    q('.x-ip').textContent = fmt(ip, 2) + ' A'; q('.x-is').textContent = (vs > 0.5 ? fmt(is, 2) : '0.00') + ' A';
    q('.x-l1').textContent = vp + ' V'; q('.x-l2').textContent = n1; q('.x-l3').textContent = n2; q('.x-l4').textContent = va + ' VA';
    q('.x-vpt').textContent = vp + 'V';
    q('.x-flux').style.opacity = (vp / 240 * .9 + .1).toFixed(2); q('.x-flux').style.animationPlayState = vp ? 'running' : 'paused';
    const b = Math.min(1, vs / 24 * (va / 50)); q('.x-glow').setAttribute('opacity', vs > 0.5 && va ? b.toFixed(2) : 0); q('.x-bulb').setAttribute('fill', vs > 2 && va ? '#ffe680' : '#f4f1e6');
    const m = q('.x-msg'); m.className = 'msg x-msg';
    if (va > 100){ m.className = 'msg x-msg bad'; m.innerHTML = `الحمل <b>${va}VA</b> أكبر من قدرة الترانس <b>100VA</b>: الملفات هتسخن وممكن تتحرق. اختار ترانس أكبر.`; }
    else if (n2 > n1){ m.innerHTML = 'لفات الثانوي <b>أكتر</b> من الابتدائي، يبقى الترانس ده <b>رافع</b> للجهد (Step-up).'; }
    else m.innerHTML = `لفات الثانوي <b>أقل</b> فده ترانس <b>خافض</b> (Step-down). لاحظ: الجهد نزل بس <b>التيار في الثانوي أكبر</b>، لأن القدرة تقريبًا واحدة في الناحيتين (${va}VA).`;
    if (vp === 220 && Math.abs(vs - 12) <= 0.2 && opt && opt.lesson){ q('.x-chal').classList.add('ok'); BL.mark(opt.lesson, 'xfmr'); }
  }
  host.addEventListener('input', upd); upd();
  if (opt && opt.lesson && BL.has(opt.lesson, 'xfmr')) q('.x-chal').classList.add('ok');
  return {set(vp, n1, n2, va){ q('.x-vp').value = vp; q('.x-n1').value = n1; q('.x-n2').value = n2; if (va != null) q('.x-va').value = va; upd(); }};
};

/* ---------------- L6: power supply stages ---------------- */
BL.psu = function(host, opt){
  const pk = 24 * Math.SQRT2, rect = t => Math.max(0, Math.abs(pk * Math.sin(2 * Math.PI * 50 * t)) - 1.4);
  const smooth = ph => { const out = []; let vc = pk - 1.4; const n = 160, dt = 0.04 / n;
    for (let i = -40; i <= n; i++){ const t = i * dt + ph; vc = Math.max(rect(t), vc - 220 * dt); if (i >= 0) out.push(vc); } return out; };
  const st = [
    {t:'① AC من الترانس', tr:[{fn:t => pk * Math.sin(2 * Math.PI * 50 * t), color:'#ff8f3a', label:'24V~'}], txt:'الترانس نزّل 220V لـ <b>24V AC</b>. الموجة لسه بتطلع فوق وتنزل تحت الصفر (قمتها حوالي 34V).'},
    {t:'② بعد القنطرة', tr:[{fn:t => pk * Math.sin(2 * Math.PI * 50 * t), color:'#5a6a74'}, {fn:rect, color:'#ffcf3a', label:'نبضات DC'}], txt:'<b>قنطرة الدايودات</b> (Bridge Rectifier) بتقلب الجزء السالب لموجب. الكهربا بقت في اتجاه واحد، بس لسه بتنبض 100 مرة في الثانية.'},
    {t:'③ بعد المكثف', tr:[{fn:rect, color:'#5a6a74'}, {series:smooth, color:'#7fd36a', label:'فيه تموّج'}], txt:'<b>المكثف</b> بيشحن عند القمة ويفضّي بالراحة في الفراغ بين النبضات، فالجهد بقى تقريبًا ثابت مع <b>تموّج صغير (Ripple)</b>.'},
    {t:'④ بعد المنظّم', tr:[{series:smooth, color:'#5a6a74'}, {fn:() => 24, color:'#4cc0ff', label:'24V DC'}], txt:'<b>المنظّم</b> (Regulator) بياخد الجهد اللي فيه تموّج ويطلّع <b>24V DC ثابتة</b> حتى لو الحمل أو جهد البيت اتغيّر شوية. ده الخرج اللي بتقيسه على <b>+V و −V</b>.'}
  ];
  host.innerHTML = `<div class="wd-art p-chain"></div><div class="tabs" role="group" aria-label="مراحل الباور سبلاي">${st.map((s, i) => `<button type="button" class="btn" data-s="${i}" aria-pressed="false">${s.t}</button>`).join('')}</div><div class="wd-art p-sc"></div><p class="p-txt" aria-live="polite"></p>`;
  const sc = Scope($('.p-sc', host)), seen = new Set();
  const blk = ['ترانس', 'قنطرة', 'مكثف', 'منظّم'];
  function chain(k){
    $('.p-chain', host).innerHTML = `<svg viewBox="0 0 360 74" role="img" aria-label="مراحل الباور سبلاي"><text x="6" y="42" style="font-size:10px;fill:var(--muted)">220V~</text>${blk.map((b, i) => { const x = 42 + i * 76; const on = i <= k, cur = i === k; return `<g><rect x="${x}" y="16" width="62" height="40" rx="8" fill="${cur ? 'var(--accent)' : on ? 'var(--accent-soft)' : 'var(--bg)'}" stroke="${on ? 'var(--accent)' : 'var(--line)'}" stroke-width="1.5"/><text x="${x + 31}" y="41" text-anchor="middle" class="ar" style="font-size:12px;font-weight:700;fill:${cur ? '#fff' : 'var(--ink)'}">${b}</text>${i < 3 ? `<path d="M${x + 62} 36 h14" stroke="${i < k ? 'var(--accent)' : 'var(--line)'}" stroke-width="2.5" marker-end=""/>` : ''}</g>`; }).join('')}<text x="354" y="42" text-anchor="end" style="font-size:10px;fill:var(--muted)">DC</text></svg>`;
  }
  function set(i){
    sc.set({ymax:40, traces:st[i].tr, speed:0.004}); $('.p-txt', host).innerHTML = st[i].txt; chain(i);
    $$('[data-s]', host).forEach(b => b.setAttribute('aria-pressed', +b.dataset.s === i ? 'true' : 'false'));
    seen.add(i); $(`[data-s="${i}"]`, host).classList.add('done');
    if (seen.size === st.length && opt && opt.lesson) BL.mark(opt.lesson, 'psu');
  }
  host.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) set(+b.dataset.s); });
  set(0);
  return {set};
};

/* ---------------- L7: calculators ---------------- */
const BRK = [6, 10, 16, 20, 25, 32, 40];
const WIRES = [{mm:1.5, max:10, use:'إنارة'}, {mm:2.5, max:16, use:'برايز'}, {mm:4, max:25, use:'سخان / تكييف'}, {mm:6, max:32, use:'بوتاجاز كهربا / خط تغذية'}, {mm:10, max:40, use:'تغذية رئيسية للشقة'}];
BL.BRK = BRK; BL.WIRES = WIRES;
BL.pickBreaker = I => BRK.find(b => b >= I && b >= 10) || null;
BL.pickWire = In => (WIRES.find(w => w.max >= In) || {}).mm || null;
BL.calc = function(host, opt){
  host.innerHTML = `<div class="two">
  <div class="wd" style="background:var(--panel)"><h3>من القدرة للتيار: I = P ÷ V</h3>
   <div class="wd-ctl"><label>القدرة P (وات): <input type="number" class="inp k-p" min="0" step="10" value="3000"></label><label>الجهد V (فولت): <input type="number" class="inp k-v" min="1" step="1" value="220"></label></div>
   <div class="read"><div><span>التيار I</span><b class="k-i"></b></div><div><span>القاطع المناسب</span><b class="k-b"></b></div><div><span>السلك (نحاس)</span><b class="k-w"></b></div></div></div>
  <div class="wd" style="background:var(--panel)"><h3>قانون أوم: I = V ÷ R</h3>
   <div class="wd-ctl"><label>الجهد V (فولت): <input type="number" class="inp k-v2" min="0" step="1" value="220"></label><label>المقاومة R (أوم): <input type="number" class="inp k-r" min="0.1" step="0.1" value="24.2"></label></div>
   <div class="read"><div><span>التيار I</span><b class="k-i2"></b></div><div><span>القدرة P = V × I</span><b class="k-p2"></b></div></div></div></div>
  <div class="chal k-chal">تحدّي: سخان مكتوب عليه <b>2200W / 220V</b>. التيار بتاعه كام أمبير؟
   <div class="wd-ctl" style="margin-top:6px"><input class="inp k-ans" type="number" step="any" aria-label="إجابتك بالأمبير" style="width:7em;font-family:var(--font-mono);direction:ltr"><button type="button" class="btn k-chk" style="flex:0 1 auto">اتأكد</button><span class="msg k-msg" aria-live="polite"></span></div></div>`;
  const q = s => $(s, host);
  function upd(){
    const P = +q('.k-p').value || 0, V = +q('.k-v').value || 0, I = V ? P / V : 0, br = BL.pickBreaker(I * 1.0), w = br && BL.pickWire(br);
    q('.k-i').textContent = fmt(I, 1) + ' A'; q('.k-b').textContent = br ? br + ' A' : 'أكبر من 40A'; q('.k-w').textContent = w ? w + ' مم²' : 'اسأل مهندس';
    const V2 = +q('.k-v2').value || 0, R = +q('.k-r').value || 0, I2 = R ? V2 / R : 0;
    q('.k-i2').textContent = fmt(I2, 2) + ' A'; q('.k-p2').textContent = fmt(V2 * I2, 0) + ' W';
  }
  host.addEventListener('input', upd); upd();
  if (BL.has(opt.lesson, 'calc')) q('.k-chal').classList.add('ok');
  q('.k-chk').addEventListener('click', () => {
    const v = +q('.k-ans').value, m = q('.k-msg');
    if (Math.abs(v - 10) <= 0.05){ m.className = 'msg k-msg ok'; m.textContent = 'صح: 2200 ÷ 220 = 10A.'; q('.k-chal').classList.add('ok'); BL.mark(opt.lesson, 'calc'); }
    else { m.className = 'msg k-msg bad'; m.textContent = 'لأ. اقسم القدرة على الجهد: I = P ÷ V.'; }
  });
};
/* drill: choose breaker + wire for each appliance */
BL.drill = function(host, opt){
  const items = opt.items;
  host.innerHTML = `<div class="tblw"><table class="tbl"><thead><tr><th>الدايرة / الجهاز</th><th>القاطع</th><th>السلك</th><th></th></tr></thead><tbody>${items.map((it, i) => `<tr data-i="${i}"><td style="text-align:right">${it.name}<br><span class="muted mono" style="font-size:.82rem">${it.w}W</span></td>
   <td><select class="inp d-b" aria-label="القاطع لـ ${esc(it.name)}"><option value="">--</option>${BRK.filter(b => b >= 10).map(b => `<option value="${b}">${b}A</option>`).join('')}</select></td>
   <td><select class="inp d-w" aria-label="السلك لـ ${esc(it.name)}"><option value="">--</option>${WIRES.map(w => `<option value="${w.mm}">${w.mm} مم²</option>`).join('')}</select></td><td class="d-r" style="min-width:2em"></td></tr>`).join('')}</tbody></table></div>
   <div class="wd-ctl"><button type="button" class="btn pri d-chk">صحّح</button></div><div class="d-out msg" aria-live="polite"></div>`;
  function check(i, b, w){
    const it = items[i], I = it.w / 220, minB = Math.max(it.minB || 10, BL.pickBreaker(I) || 99);
    if (!b || !w) return {ok:false, why:'اختار القاطع والسلك.'};
    const k = BRK.indexOf(b), k0 = BRK.indexOf(minB);
    if (b < I) return {ok:false, why:`التيار ${fmt(I, 1)}A أكبر من القاطع ${b}A: هيفصل على طول.`};
    if (b < minB) return {ok:false, why:it.whyMin || `أقل قاطع مناسب هنا ${minB}A.`};
    if (k > k0 + 1) return {ok:false, why:`القاطع ${b}A كبير قوي على تيار ${fmt(I, 1)}A: مش هيحمي الجهاز والسلك. المناسب ${minB}A.`};
    const wm = WIRES.find(x => x.mm === w);
    if (wm.max < b) return {ok:false, why:`سلك ${w}مم² ميستحملش أكتر من ${wm.max}A، والقاطع ${b}A. السلك هيسخن قبل ما القاطع يفصل! لازم السلك يستحمل تيار القاطع.`};
    return {ok:true, why:`تمام: التيار حوالي ${fmt(I, 1)}A ⇐ قاطع ${b}A وسلك ${w}مم².`};
  }
  BL._drillCheck = check;
  $('.d-chk', host).addEventListener('click', () => {
    let n = 0; const out = [];
    $$('tr[data-i]', host).forEach(tr => {
      const i = +tr.dataset.i, r = check(i, +$('.d-b', tr).value, +$('.d-w', tr).value);
      $('.d-r', tr).innerHTML = r.ok ? '<b style="color:var(--good)">✓</b>' : '<b style="color:var(--bad)">✗</b>';
      if (r.ok) n++; else out.push(`<li><b>${items[i].name}:</b> ${r.why}</li>`);
    });
    const o = $('.d-out', host);
    if (n === items.length){ o.className = 'd-out msg ok'; o.innerHTML = 'كله صح ✓ كده انت بتختار القاطع والسلك زي الفني الشاطر.'; BL.mark(opt.lesson, 'drill'); }
    else { o.className = 'd-out msg bad'; o.innerHTML = `${n} من ${items.length} صح. <ul style="margin:4px 0 0">${out.join('')}</ul>`; }
  });
};

/* ---------------- digital multimeter (AVO) + screwdriver tester ----------------
   cfg = {lesson, scenarios:[scen], exercises:[ex], tools:['avo','tester'], diagGoal:{key,n}}
   scen = {id, title, kind:'ac'|'dc', vb:'0 0 W H', elems(st)→[elem], points:[{id,n,x,y,t,lx,ly}],
           art(st)→svg, toggles:[{k,on,off,init}], breaker:{k,In}, init:{…}, note, diag:{pool,options,ans,intro,key}} */
const MODES = [
  {k:'OFF', lab:'OFF', a:-120},
  {k:'ACV', lab:'V~', a:-72},
  {k:'DCV', lab:'V⎓', a:-24},
  {k:'OHM', lab:'Ω', a:24},
  {k:'CONT', lab:'•)))', a:72},
  {k:'A', lab:'A', a:120}
];
const MODE_AR = {OFF:'مقفول', ACV:'فولت متردد V~', DCV:'فولت مستمر V⎓', OHM:'أوم Ω', CONT:'توصيل (صفّارة)', A:'أمبير A'};
BL.MODE_AR = MODE_AR;
function fmtV(v){ const a = Math.abs(v); const d = a < 2 ? 3 : a < 20 ? 2 : 1; const s = fmt(a, d); return (v < 0 && a >= 0.0005 * Math.pow(10, 3 - d) ? '-' : '') + s; }
function fmtR(r){ if (r < 200) return {t:fmt(r, 1), u:'Ω'}; if (r < 2000) return {t:fmt(r, 0), u:'Ω'}; if (r < 2e5) return {t:fmt(r / 1000, 2), u:'kΩ'}; return {t:fmt(r / 1e6, 2), u:'MΩ'}; }
BL.fmtV = fmtV; BL.fmtR = fmtR;

function meterSVG(g){
  const pos = MODES.map(m => { const r = 72, rad = m.a * Math.PI / 180, x = 120 + r * Math.sin(rad), y = 236 - r * Math.cos(rad);
    return `<g class="md-pos" data-mode="${m.k}" tabindex="0" role="button" aria-label="الوضع ${MODE_AR[m.k]}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="20" fill="transparent"/><text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle" style="font:700 ${m.k === 'CONT' ? 11 : 15}px var(--font-mono);fill:${m.k === 'OFF' ? '#b8c0c5' : m.k === 'A' ? '#ff8a80' : '#f4f6f7'}">${m.lab}</text></g>`; }).join('');
  return `<svg viewBox="0 0 240 410" role="group" aria-label="أفوميتر ديجيتال">
  <defs>
    <linearGradient id="${g}y" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffcb3d"/><stop offset=".55" stop-color="#f0a514"/><stop offset="1" stop-color="#c47f06"/></linearGradient>
    <linearGradient id="${g}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4247"/><stop offset="1" stop-color="#1f2427"/></linearGradient>
    <linearGradient id="${g}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4dfc2"/><stop offset="1" stop-color="#aebd98"/></linearGradient>
    <radialGradient id="${g}k" cx=".4" cy=".35"><stop offset="0" stop-color="#5b646a"/><stop offset=".7" stop-color="#262b2e"/><stop offset="1" stop-color="#121516"/></radialGradient>
    <radialGradient id="${g}j"><stop offset="0" stop-color="#050505"/><stop offset=".55" stop-color="#1a1a1a"/><stop offset=".56" stop-color="#9aa3a8"/><stop offset="1" stop-color="#5d6469"/></radialGradient>
    <linearGradient id="${g}pr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9e1b1b"/><stop offset=".5" stop-color="#e53935"/><stop offset="1" stop-color="#8a1515"/></linearGradient>
    <linearGradient id="${g}pk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d0d0d"/><stop offset=".5" stop-color="#4a4f53"/><stop offset="1" stop-color="#0d0d0d"/></linearGradient>
  </defs>
  <rect x="4" y="6" width="232" height="372" rx="28" fill="#000" opacity=".18" transform="translate(3 4)"/>
  <rect x="4" y="4" width="232" height="372" rx="28" fill="url(#${g}y)"/>
  <rect x="18" y="18" width="204" height="344" rx="16" fill="url(#${g}f)"/>
  <rect x="30" y="30" width="180" height="92" rx="9" fill="#0c0e0f"/>
  <rect x="38" y="38" width="164" height="74" rx="4" fill="url(#${g}l)"/>
  <rect x="38" y="38" width="164" height="14" rx="4" fill="#fff" opacity=".18"/>
  <text class="md-ind" x="44" y="54" style="font:600 10px var(--font-mono);fill:var(--lcd-ink)"></text>
  <text class="md-beep" x="196" y="54" text-anchor="end" style="font:700 10px var(--font-mono);fill:var(--lcd-ink)"></text>
  <text class="md-val" x="186" y="96" text-anchor="end" style="font:600 34px var(--font-mono);fill:var(--lcd-ink);letter-spacing:1px"></text>
  <text class="md-unit" x="198" y="108" text-anchor="end" style="font:600 11px var(--font-mono);fill:var(--lcd-ink)"></text>
  <text x="120" y="140" text-anchor="middle" style="font:600 8.5px var(--font-mono);fill:#9aa3a8;letter-spacing:2px">DIGITAL MULTIMETER</text>
  <circle cx="120" cy="236" r="88" fill="#15191b" opacity=".55"/>
  ${pos}
  <g class="md-knob" style="transition:transform .3s cubic-bezier(.3,1.4,.5,1);transform-origin:120px 236px">
    <circle cx="120" cy="236" r="42" fill="url(#${g}k)" stroke="#0a0c0d" stroke-width="2"/>
    <rect x="113" y="196" width="14" height="80" rx="7" fill="#2f3539" stroke="#0a0c0d"/>
    <rect x="117" y="198" width="6" height="22" rx="3" fill="#f4f6f7"/>
  </g>
  <g class="md-jack" data-jack="A" tabindex="0" role="button" aria-label="فتحة 10A"><circle cx="54" cy="336" r="20" fill="transparent"/><circle cx="54" cy="336" r="13" fill="url(#${g}j)" stroke="#c0352b" stroke-width="2.5"/><text x="54" y="314" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#ff8a80">10A</text></g>
  <g><circle cx="120" cy="336" r="13" fill="url(#${g}j)" stroke="#111" stroke-width="2.5"/><text x="120" y="314" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#e3e9ec">COM</text></g>
  <g class="md-jack" data-jack="V" tabindex="0" role="button" aria-label="فتحة VΩ"><circle cx="186" cy="336" r="20" fill="transparent"/><circle cx="186" cy="336" r="13" fill="url(#${g}j)" stroke="#c0352b" stroke-width="2.5"/><text x="186" y="314" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#ff8a80">VΩ</text></g>
  <g class="md-leads" pointer-events="none">
    <path d="M120 344 C120 380 108 392 96 410" fill="none" stroke="#151515" stroke-width="6" stroke-linecap="round"/>
    <rect x="113" y="326" width="14" height="22" rx="4" fill="url(#${g}pk)"/>
    <path class="md-rl" d="" fill="none" stroke="#c62828" stroke-width="6" stroke-linecap="round"/>
    <rect class="md-rp" x="179" y="326" width="14" height="22" rx="4" fill="url(#${g}pr)"/>
  </g>
  </svg>`;
}
function probeSVG(x, y, red, g){
  const rot = red ? -28 : 28;
  return `<g transform="translate(${x} ${y}) rotate(${rot})" pointer-events="none" class="mm-probe">
    <path d="M0 0 L-1.6 -8 H1.6 Z" fill="#c7ced2"/><rect x="-1.6" y="-26" width="3.2" height="19" fill="#d6dcdf"/>
    <rect x="-6" y="-80" width="12" height="54" rx="4" fill="url(#${g}${red ? 'pr' : 'pk'})"/>
    <rect x="-8.5" y="-34" width="17" height="6" rx="2" fill="${red ? '#b71c1c' : '#111'}"/>
    <path d="M0 -80 C0 -100 ${red ? -20 : 20} -112 ${red ? -26 : 26} -140" fill="none" stroke="${red ? '#c62828' : '#151515'}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="4" fill="none" stroke="${red ? '#e53935' : '#111'}" stroke-width="2"/>
  </g>`;
}
function testerSVG(x, y, lit, g){
  return `<g transform="translate(${x} ${y}) rotate(35)" pointer-events="none">
    <rect x="-2" y="-46" width="4" height="46" fill="#cfd5d8"/><path d="M-2 -1 L0 5 L2 -1Z" fill="#9aa3a8"/>
    <rect x="-8" y="-118" width="16" height="74" rx="5" fill="#d32f2f"/><rect x="-5" y="-108" width="10" height="34" rx="3" fill="#fbe9e7" opacity=".85"/>
    <ellipse cx="0" cy="-91" rx="3.5" ry="10" fill="${lit ? '#ff7a1a' : '#c9b8a0'}"/>
    ${lit ? `<circle cx="0" cy="-91" r="20" fill="url(#${g}ne)"/>` : ''}
    <rect x="-6" y="-127" width="12" height="10" rx="3" fill="#b0b7bc"/>
  </g>`;
}

BL.meter = function(host, cfg){
  const g = U('mm'), L = cfg.lesson;
  const tools = cfg.tools || ['avo'];
  const S = {scen:0, mode:'OFF', jack:'V', red:null, black:null, sel:'red', tool:tools[0], st:{}, tpt:null, diag:null, last:null, askv:{}};
  const scen = () => cfg.scenarios[S.scen];
  function initSt(){ const sc = scen(); S.st = Object.assign({}, sc.init || {}); (sc.toggles || []).forEach(t => { if (S.st[t.k] == null) S.st[t.k] = !!t.init; }); S.red = S.black = null; S.sel = 'red'; S.tpt = null; S.diag = null; S.st.fault = null; if (sc.setup) sc.setup(S.st); }
  host.innerHTML = `
  ${cfg.scenarios.length > 1 ? `<div class="tabs mm-scn" role="group" aria-label="اختار اللي هتقيسه">${cfg.scenarios.map((s, i) => `<button type="button" class="btn" data-scn="${i}" aria-pressed="false">${s.title}</button>`).join('')}</div>` : ''}
  <div class="mm">
    <div class="wd-art mm-meter"></div>
    <div class="mm-side">
      ${tools.length > 1 ? `<div class="mm-tools" role="group" aria-label="العدّة"><button type="button" class="btn" data-tool="avo">الأفوميتر</button><button type="button" class="btn" data-tool="tester">مفك الاختبار</button></div>` : ''}
      <div class="mm-tools mm-probes" role="group" aria-label="المجسات"><button type="button" class="btn r" data-probe="red">المجس الأحمر (+)</button><button type="button" class="btn k" data-probe="black">المجس الأسود (−)</button><button type="button" class="btn" data-probe="clear">شيل المجسات</button></div>
      <div class="mm-tools mm-tog"></div>
      <div class="wd-art mm-art"></div>
      <div class="mm-lcdline" aria-live="polite"></div>
      <div class="mm-alert"></div>
    </div>
  </div>
  <div class="mm-diagbox"></div>
  <ul class="mm-ex"></ul>`;
  $('.mm-meter', host).innerHTML = meterSVG(g);
  const q = s => $(s, host);

  /* ---------- physics ---------- */
  function node(pid){ const p = scen().points.find(x => x.id === pid); return p ? p.n : null; }
  function elems(){ return scen().elems(S.st); }
  function tripCheck(){
    const sc = scen(), br = sc.breaker; if (!br || !S.st[br.k]) return false;
    const els = elems(), s = BL.circuit.solve(els), I = Math.max(0, ...els.filter(e => e.src).map(e => Math.abs(s.srcI(e))));
    if (I > br.In){ S.st[br.k] = false; S.st.tripped = true; return true; }
    S.st.tripped = false; return false;
  }
  function measure(){
    const sc = scen(), m = {mode:S.mode, jack:S.jack, red:S.red, black:S.black, val:null, text:'', unit:'', ind:'', beep:false, danger:null, note:null};
    if (S.mode === 'OFF'){ m.text = ''; return m; }
    m.ind = {ACV:'AC', DCV:'DC', OHM:'', CONT:'', A:'AC'}[S.mode];
    const els = elems(), a = node(S.red), b = node(S.black), both = a && b;
    const sol = BL.circuit.solve(els);
    const vab = both ? sol.v(a) - sol.v(b) : 0;
    const live = both && (Math.abs(vab) > 0.5 || Math.abs(sol.v(a)) > 30 || Math.abs(sol.v(b)) > 30);
    const hasV = both && (Math.abs(vab) > 2);
    if (S.jack === 'A' && S.mode !== 'A' && hasV){ m.danger = '<b>غلط خطر!</b> الطرف الأحمر في فتحة <b>10A</b> والعداد على فولت. فتحة الأمبير مقاومتها تقريبًا صفر، يعني انت عملت <b>قصر (شورت)</b> بين النقطتين: شرارة، والفيوز اللي جوه العداد يضرب أو العداد يتحرق في إيدك. <b>رجّع الأحمر لفتحة VΩ قبل ما تقيس جهد.</b>'; return m; }
    if (S.mode === 'A'){
      if (S.jack === 'A' && hasV){ m.danger = '<b>غلط خطر!</b> العداد على أمبير والأحمر في <b>10A</b> وانت حاطط المجسين على نقطتين بينهم جهد. ده <b>قصر مباشر</b> زي ما تحط مسمار في البريزة! الأمبير بيتقاس والعداد <b>على التوالي</b> مع الحمل، والأسهل والأأمن: <b>الكلامب ميتر</b>.'; return m; }
      if (S.jack !== 'A'){ m.text = '----'; m.unit = 'A'; m.note = 'عشان تقيس أمبير لازم الطرف الأحمر يتنقل لفتحة <b>10A</b>. (ومتنساش ترجّعه بعدها).'; return m; }
      m.val = 0; m.text = '0.00'; m.unit = 'A'; m.note = 'قياس الأمبير بالأفوميتر محتاج تفتح الدايرة وتحط العداد على التوالي. في الشغل العملي استخدم <b>الكلامب ميتر</b> (الدرس 5).'; return m;
    }
    if (S.mode === 'ACV' || S.mode === 'DCV'){
      m.unit = S.mode === 'ACV' ? 'V~' : 'V⎓';
      if (S.jack === 'A' || !both){ m.val = 0; m.text = S.mode === 'ACV' ? '0.0' : '0.00'; return m; }
      const s2 = BL.circuit.solve(els.concat([{a, b, r:10e6}])); let v = s2.v(a) - s2.v(b);
      const kind = sc.kindOf ? sc.kindOf(a, b) : sc.kind;
      if (kind === 'ac'){
        if (S.mode === 'DCV'){ m.val = 0; m.text = '0.00'; if (Math.abs(v) > 2) m.note = 'فيه كهربا هنا بس العداد على <b>DC</b> والكهربا دي <b>AC</b>، فالعداد بيقرا صفر تقريبًا. لفّ على <b>V~</b>.'; return m; }
        v = Math.abs(v);
      } else if (S.mode === 'ACV'){ m.val = 0; m.text = '0.0'; if (Math.abs(v) > 0.5) m.note = 'دي بطارية/مصدر <b>DC</b> والعداد على <b>V~</b>، لفّ على <b>V⎓</b>.'; return m; }
      m.val = v; m.text = fmtV(v);
      if (kind === 'dc' && v < -0.05) m.note = 'الإشارة <b>سالب (−)</b> لأنك عاكس المجسات: الأحمر على السالب. مفيش ضرر، بس اعرف إن الأحمر لازم على الموجب عشان القراية تطلع موجبة.';
      return m;
    }
    /* Ω and continuity */
    if (live){ m.danger = `<b>غلط خطر!</b> بتقيس <b>${S.mode === 'OHM' ? 'أوم' : 'توصيل'}</b> على حاجة فيها كهربا. العداد في الوضع ده بيطلّع جهد صغير من البطارية بتاعته، ولو حطيته على كهربا شغّالة ممكن يتحرق أو الفيوز بتاعه يضرب ويطلع شرار في إيدك. <b>افصل الكهربا الأول (أو شيل البطارية) وبعدين قيس أوم.</b>`; return m; }
    m.unit = 'Ω';
    if (S.jack === 'A' || !both){ m.val = Infinity; m.text = 'OL'; m.unit = ''; return m; }
    const r = BL.circuit.resistance(els, a, b);
    if (S.mode === 'OHM'){
      if (!(r < 40e6)){ m.val = Infinity; m.text = 'OL'; m.unit = ''; return m; }
      const f = fmtR(r); m.val = r; m.text = f.t; m.unit = f.u; return m;
    }
    m.ind = '•)))';
    if (r < 600){ m.val = r; m.text = fmt(r, 1); m.beep = r < 30; } else { m.val = Infinity; m.text = 'OL'; m.unit = ''; }
    return m;
  }
  function testerLit(pid){
    const sc = scen(), n = node(pid); if (!n || sc.kind !== 'ac') return false;
    const s = BL.circuit.solve(elems().concat([{a:n, b:'E', r:1e6}])); return Math.abs(s.v(n)) > 60;
  }

  /* ---------- rendering ---------- */
  function renderTabs(){
    $$('[data-scn]', host).forEach(b => { const i = +b.dataset.scn; b.setAttribute('aria-pressed', i === S.scen ? 'true' : 'false'); const ex = cfg.exercises.filter(x => x.scen === cfg.scenarios[i].id); b.classList.toggle('done', ex.length > 0 && ex.every(x => BL.store.has(L + '/x/' + x.id))); });
    $$('[data-tool]', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === S.tool ? 'true' : 'false'));
    $$('[data-probe=red],[data-probe=black]', host).forEach(b => { b.setAttribute('aria-pressed', S.tool === 'avo' && b.dataset.probe === S.sel ? 'true' : 'false'); });
    q('.mm-probes').hidden = S.tool !== 'avo';
    const sc = scen(), tg = (sc.toggles || []).filter(t => !S.diag || t.diag !== false); q('.mm-tog').innerHTML = tg.map(t => `<button type="button" class="btn ${S.st[t.k] ? 'pwr-on' : 'pwr-off'}" data-tog="${t.k}" aria-pressed="${S.st[t.k] ? 'true' : 'false'}">${S.st[t.k] ? t.on : t.off}</button>`).join('');
    q('.mm-tog').hidden = !tg.length;
  }
  function render(){
    const sc = scen(), m = measure(); S.last = m;
    /* meter */
    const md = MODES.find(x => x.k === S.mode); const kn = q('.md-knob'); kn.style.transform = `rotate(${md.a}deg)`;
    const jx = S.jack === 'A' ? 54 : 186;
    q('.md-rp').setAttribute('x', jx - 7); q('.md-rl').setAttribute('d', `M${jx} 344 C${jx} 380 ${jx + (S.jack === 'A' ? 16 : -16)} 392 ${jx + (S.jack === 'A' ? 28 : -26)} 410`);
    q('.md-val').textContent = m.danger ? 'Err' : m.text; q('.md-unit').textContent = m.danger ? '' : m.unit; q('.md-ind').textContent = m.danger ? '!' : m.ind; q('.md-beep').textContent = m.beep ? '♪ BEEP' : '';
    $$('.md-pos', host).forEach(p => p.setAttribute('aria-pressed', p.dataset.mode === S.mode ? 'true' : 'false'));
    /* scene */
    const [, , W, H] = sc.vb.split(' ').map(Number);
    let ov = '';
    sc.points.forEach(p => { ov += `<circle class="mp-hit" data-pt="${p.id}" cx="${p.x}" cy="${p.y}" r="20" tabindex="0" role="button" aria-label="نقطة ${esc(p.a || p.t)}"/><circle class="mp-dot" cx="${p.x}" cy="${p.y}" r="7"/>${p.t ? `<text class="mp-lab" x="${p.lx != null ? p.lx : p.x}" y="${p.ly != null ? p.ly : p.y - 13}" text-anchor="middle">${esc(p.t)}</text>` : ''}`; });
    const pp = id => sc.points.find(x => x.id === id), pn = id => esc(pp(id).a || pp(id).t);
    if (S.tool === 'avo'){ if (S.black && pp(S.black)) ov += probeSVG(pp(S.black).x, pp(S.black).y, false, g); if (S.red && pp(S.red)) ov += probeSVG(pp(S.red).x, pp(S.red).y, true, g); }
    else if (S.tpt && pp(S.tpt)) ov += testerSVG(pp(S.tpt).x, pp(S.tpt).y, testerLit(S.tpt), g);
    q('.mm-art').innerHTML = `<svg viewBox="${sc.vb}" role="group" aria-label="${esc(sc.title)}"><defs>
      <linearGradient id="${g}pr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9e1b1b"/><stop offset=".5" stop-color="#e53935"/><stop offset="1" stop-color="#8a1515"/></linearGradient>
      <linearGradient id="${g}pk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d0d0d"/><stop offset=".5" stop-color="#4a4f53"/><stop offset="1" stop-color="#0d0d0d"/></linearGradient>
      <radialGradient id="${g}ne"><stop offset="0" stop-color="#fff2c4"/><stop offset=".4" stop-color="#ff8a1e"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient></defs>
      ${sc.art(S.st, g)}${ov}</svg>`;
    /* line + alerts */
    let line;
    if (S.tool === 'tester'){ const lit = S.tpt && testerLit(S.tpt); line = S.tpt ? `مفك الاختبار على <b>${pn(S.tpt)}</b>: ${lit ? '<b style="color:var(--bad)">اللمبة نوّرت = فيه فاز</b>' : '<b>مانوّرش</b>'}` : 'دوس على أي نقطة تلمسها بمفك الاختبار.'; }
    else {
      const pr = `<span class="muted">الأحمر: ${S.red ? pn(S.red) : '—'} · الأسود: ${S.black ? pn(S.black) : '—'}</span>`;
      line = S.mode === 'OFF' ? `العداد مقفول. لفّ المفتاح على الوضع المناسب. ${pr}` : `${MODE_AR[S.mode]}: <b>${m.danger ? 'Err' : esc(m.text) + ' ' + esc(m.unit)}</b>${m.beep ? ' <span class="beep">♪ بيصفّر</span>' : ''} ${pr}`;
    }
    q('.mm-lcdline').innerHTML = line;
    q('.mm-alert').innerHTML = (S.tool === 'avo' && m.danger ? `<div class="mm-danger">${m.danger}</div>` : '') + (S.tool === 'avo' && m.note ? `<div class="mm-note">${m.note}</div>` : '') + (S.alert ? `<div class="mm-note">${S.alert}</div>` : '') + (sc.note && !S.diag ? `<div class="mm-note" style="border-color:var(--line);background:var(--panel)">${sc.note(S.st)}</div>` : '');
    BL.beep(S.tool === 'avo' && m.beep);
    renderTabs(); renderEx(m); renderDiag();
  }
  /* ---------- exercises ---------- */
  function exDone(x){ return BL.store.has(L + '/x/' + x.id); }
  function renderEx(m){
    const sc = scen(), list = cfg.exercises.filter(x => x.scen === sc.id);
    if (S.diag){ q('.mm-ex').innerHTML = ''; return; }
    if (S.tool === 'avo' && !S.diag) list.forEach(x => { if (!exDone(x) && !x.ask && x.check(m, S)) finishEx(x); });
    let cur = false;
    q('.mm-ex').innerHTML = list.map(x => { const d = exDone(x), c = !d && !cur; if (c) cur = true;
      return `<li class="${d ? 'ok' : c ? 'cur' : ''}" data-ex="${x.id}">${x.text}${x.ask && !d ? askHTML(x) : ''}${d && x.why ? `<span class="why">${x.why}</span>` : ''}</li>`; }).join('');
  }
  function askHTML(x){ return `<div class="mm-ask">${x.ask.fields.map(f => `<label style="display:inline-flex;gap:4px;align-items:center;margin-inline-end:8px">${f.t} <select data-f="${f.k}" data-x="${x.id}"><option value="">؟</option>${x.ask.choices.map(c => `<option${((S.askv[x.id] || {})[f.k]) === c ? ' selected' : ''}>${c}</option>`).join('')}</select></label>`).join('')}<button type="button" class="btn" data-ask="${x.id}" style="min-height:40px">اتأكد</button><span class="msg" data-askmsg></span></div>`; }
  function finishEx(x){
    BL.store.mark(L + '/x/' + x.id);
    const same = cfg.exercises.filter(y => y.key === x.key);
    if (x.key && same.every(exDone)) BL.mark(L, x.key);
  }
  /* ---------- diagnosis / game ---------- */
  function startDiag(){
    const sc = scen(), d = sc.diag; if (!d) return;
    let pool = d.pool.slice(); if (S.diag && pool.length > 1) pool = pool.filter(f => f !== S.diag.fault);
    const f = pool[Math.floor(Math.random() * pool.length)];
    S.st = Object.assign({}, sc.init || {}); (sc.toggles || []).forEach(t => { if (S.st[t.k] == null) S.st[t.k] = !!t.init; });
    S.st.fault = f; S.diag = {fault:f, answered:false, picked:null}; S.red = S.black = null; S.tpt = null; S.sel = 'red'; S.alert = null;
    if (sc.setup) sc.setup(S.st);
    render();
  }
  function renderDiag(){
    const sc = scen(), d = sc.diag, box = q('.mm-diagbox');
    if (!d){ box.innerHTML = ''; return; }
    if (!S.diag){ box.innerHTML = `<div class="mm-diag"><div>${d.intro}</div><div><button type="button" class="btn pri" data-diag="start">${d.btn || 'شخّص عطل مستخبي'}</button></div></div>`; return; }
    const D = S.diag;
    box.innerHTML = `<div class="mm-diag"><div><b>${d.title || 'جهاز من الورشة: سليم ولا بايظ؟'}</b> ${d.ask}</div><div class="opts">${d.options.map(o => { let c = ''; if (D.answered){ if (o.id === d.ans(D.fault)) c = 'ok'; else if (o.id === D.picked) c = 'no'; } return `<button type="button" class="btn ${c}" data-pick="${o.id}" ${D.answered ? 'disabled' : ''}>${o.label}</button>`; }).join('')}</div>${D.answered ? `<div class="msg ${D.ok ? 'ok' : 'bad'}">${D.msg}</div><div class="wd-ctl"><button type="button" class="btn pri" data-diag="start">${d.again || 'جهاز تاني'}</button>${d.auto ? '' : '<button type="button" class="btn" data-diag="exit">رجوع للتمارين</button>'}</div>` : (d.auto ? '' : `<div class="wd-ctl"><button type="button" class="btn" data-diag="exit">إلغاء</button></div>`)}</div>`;
  }
  function pick(id){
    const sc = scen(), d = sc.diag, D = S.diag; if (!D || D.answered) return;
    const ans = d.ans(D.fault); D.picked = id; D.answered = true; D.ok = id === ans;
    D.msg = (D.ok ? '✓ صح! ' : '✗ مش ده. ') + d.explain(D.fault);
    if (D.ok){
      if (d.key) BL.mark(L, d.key);
      if (cfg.diagGoal){ const k = L + '/diagn', n = (BL.store.get(k) || 0) + 1; BL.store.set(k, n); const seen = new Set(BL.store.get(k + 's') || []); seen.add(sc.id); BL.store.set(k + 's', Array.from(seen)); if (seen.size >= cfg.diagGoal.n) BL.mark(L, cfg.diagGoal.key); D.msg += ` <b>(${seen.size} من ${cfg.diagGoal.n} أجهزة مختلفة اتشخّصت صح)</b>`; }
    }
    render();
  }

  /* ---------- input ---------- */
  function tapPoint(pid){
    S.alert = null;
    if (S.tool === 'tester'){ S.tpt = pid; render(); return; }
    if (S.sel === 'red'){ S.red = pid; S.sel = 'black'; } else { S.black = pid; S.sel = 'red'; }
    render();
  }
  function setMode(k){ S.mode = k; S.alert = null; render(); }
  host.addEventListener('click', e => {
    const t = e.target.closest('[data-pt],[data-mode],[data-jack],[data-scn],[data-tool],[data-probe],[data-tog],[data-diag],[data-pick],[data-ask]');
    if (!t) return;
    if (t.dataset.pt) tapPoint(t.dataset.pt);
    else if (t.dataset.mode) setMode(t.dataset.mode);
    else if (t.dataset.jack){ S.jack = t.dataset.jack; render(); }
    else if (t.dataset.scn != null){ S.scen = +t.dataset.scn; S.alert = null; enter(); }
    else if (t.dataset.tool){ S.tool = t.dataset.tool; render(); }
    else if (t.dataset.probe){ if (t.dataset.probe === 'clear'){ S.red = S.black = null; S.sel = 'red'; } else S.sel = t.dataset.probe; render(); }
    else if (t.dataset.tog){ const k = t.dataset.tog; S.st[k] = !S.st[k]; S.alert = null; if (S.st[k] && tripCheck()) S.alert = scen().tripMsg || '<b>القاطع فصل تاني على طول!</b> فيه قصر أو حمل زيادة في الدايرة.'; render(); }
    else if (t.dataset.diag){ if (t.dataset.diag === 'start') startDiag(); else { S.diag = null; initSt(); render(); } }
    else if (t.dataset.pick != null) pick(t.dataset.pick);
    else if (t.dataset.ask){ const x = cfg.exercises.find(y => y.id === t.dataset.ask), li = t.closest('li'), vals = {}; $$('select[data-f]', li).forEach(s => vals[s.dataset.f] = s.value); const r = x.ask.check(vals, S.st); const msg = $('[data-askmsg]', li); if (r === true){ finishEx(x); render(); } else { msg.className = 'msg bad'; msg.textContent = r; } }
  });
  host.addEventListener('change', e => { const s = e.target.closest('select[data-f]'); if (s){ (S.askv[s.dataset.x] = S.askv[s.dataset.x] || {})[s.dataset.f] = s.value; } });
  host.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const t = e.target.closest('[data-pt],[data-mode],[data-jack]'); if (!t) return; e.preventDefault(); t.dispatchEvent(new MouseEvent('click', {bubbles:true})); });
  function enter(){ initSt(); const d = scen().diag; if (d && d.auto) startDiag(); else render(); }
  enter();
  BL.on(() => { /* keep tab ticks fresh */ });
  return {
    S, measure: () => measure(), render,
    scen(id){ const i = cfg.scenarios.findIndex(s => s.id === id); S.scen = i; enter(); },
    mode: setMode, jack(j){ S.jack = j; render(); }, tool(t){ S.tool = t; render(); },
    probes(r, b){ S.red = r; S.black = b; S.sel = 'red'; S.alert = null; render(); return measure(); },
    tap: tapPoint, toggle(k, v){ const cur = !!S.st[k]; if (v == null || v !== cur){ const btn = host.querySelector(`[data-tog="${k}"]`); if (btn) btn.click(); } },
    tester: pid => { S.tool = 'tester'; S.tpt = pid; render(); return testerLit(pid); },
    diag: startDiag, pick, fault: f => { S.st.fault = f; if (S.diag) S.diag.fault = f; const sc = scen(); if (sc.setup) sc.setup(S.st); render(); }, st: () => S.st
  };
};

/* ---------------- house-wiring bench ----------------
   ex = {key, title, task, tip, kind:'lamp1'|'socket'|'2way'|'parallel', H, comps:[{type,id,x,y,label}], solution:[[a,b,'L'|'N'|'PE']]} */
const COL = {L:'#8a5a2b', N:'#1f6fd1', PE:'gy'};
const COL_AR = {L:'بني', N:'أزرق', PE:'أخضر×أصفر'};
const TDEF = {
  db:     [['L', 38, 128, 'L'], ['N', 92, 128, 'N'], ['PE', 144, 128, 'PE']],
  sw1:    [['L', 20, 116, 'L'], ['L1', 70, 116, 'L']],
  sw2:    [['L1', 12, 116, 'L'], ['C', 60, 116, 'L'], ['L2', 108, 116, 'L']],
  lamp:   [['L', 30, 17, 'L'], ['N', 90, 17, 'N']],
  socket: [['L', 22, 20, 'L'], ['N', 70, 20, 'N'], ['PE', 118, 20, 'PE']]
};
const TLAB = {db:{L:'L', N:'N', PE:'PE'}, sw1:{L:'L', L1:'L1'}, sw2:{L1:'L1', C:'C', L2:'L2'}, lamp:{L:'L', N:'N'}, socket:{L:'L', N:'N', PE:'PE'}};
function drawComp(c, st, g){
  const x = c.x, y = c.y, T = `translate(${x} ${y})`;
  if (c.type === 'db'){
    const on = st.mcb && !st.tripped;
    return `<g transform="${T}"><rect x="0" y="0" width="170" height="150" rx="8" fill="url(#${g}enc)" stroke="#8d969c"/><rect x="8" y="8" width="154" height="134" rx="5" fill="#2b3135"/>
      <path d="M38 -8 V22" stroke="#555" stroke-width="7" stroke-linecap="round"/>
      <rect x="8" y="50" width="154" height="10" fill="url(#${g}rail)"/>
      <rect x="18" y="22" width="40" height="84" rx="4" fill="url(#${g}mod)" stroke="#9aa3a8"/>
      <rect x="28" y="${on ? 34 : 54}" width="20" height="24" rx="3" fill="#1d2226" style="transition:y .2s"/><rect x="${on ? 26 : 26}" y="64" width="24" height="10" rx="2" fill="${on ? '#2b9a4a' : st.tripped ? '#c0352b' : '#c0352b'}"/>
      <text x="38" y="94" text-anchor="middle" style="font:700 9px var(--font-mono);fill:#1d2226">C10</text><text x="38" y="72" text-anchor="middle" style="font:700 7px var(--font-mono);fill:#fff">${on ? 'ON' : 'OFF'}</text>
      <rect x="70" y="76" width="44" height="18" rx="3" fill="#1f6fd1"/><rect x="74" y="80" width="36" height="10" rx="2" fill="url(#${g}brass)"/>
      <rect x="122" y="76" width="44" height="18" rx="3" fill="url(#${g}gy)"/><rect x="126" y="80" width="36" height="10" rx="2" fill="url(#${g}brass)"/>
      <text x="92" y="110" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#8fc1ff">N</text><text x="144" y="110" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#b9e07a">PE ⏚</text>
      <text x="85" y="-12" text-anchor="middle" class="dev-ar">لوحة الكهربا</text></g>`;
  }
  if (c.type === 'sw1' || c.type === 'sw2'){
    const w = c.type === 'sw1' ? 90 : 120, on = c.type === 'sw1' ? !!st.sw[c.id] : !!st.sw[c.id];
    const cx = w / 2;
    return `<g transform="${T}"><g class="bn-tap" data-sw="${c.id}" tabindex="0" role="button" aria-label="${esc(c.label || 'مفتاح')}: دوس عشان تقلبه">
      <rect x="2" y="3" width="${w}" height="90" rx="10" fill="#000" opacity=".15"/><rect x="0" y="0" width="${w}" height="90" rx="10" fill="url(#${g}pl)" stroke="#b5bcc1"/>
      <rect x="${cx - 24}" y="16" width="48" height="58" rx="6" fill="#e9ecee" stroke="#c3c9cd"/>
      <rect x="${cx - 21}" y="${on ? 19 : 45}" width="42" height="26" rx="4" fill="url(#${g}rk)" style="transition:y .15s"/>
      <rect x="${cx - 21}" y="${on ? 45 : 19}" width="42" height="26" rx="4" fill="#f6f7f8"/>
      ${c.type === 'sw2' ? `<path d="M${cx - 8} ${on ? 30 : 56} l8 -6 l8 6" fill="none" stroke="#9aa3a8" stroke-width="2"/>` : `<circle cx="${cx}" cy="${on ? 30 : 58}" r="3" fill="${on ? '#e8590c' : '#c3c9cd'}"/>`}
      </g><text x="${cx}" y="-8" text-anchor="middle" class="dev-ar">${esc(c.label || '')}</text>
      <path d="M${cx} 90 V100" stroke="#9aa3a8" stroke-width="3"/><rect x="0" y="100" width="${w}" height="30" rx="6" fill="#2f3539" opacity=".85"/></g>`;
  }
  if (c.type === 'lamp'){
    const lit = st.lamp[c.id] || 0;
    return `<g transform="${T}"><rect x="0" y="0" width="120" height="34" rx="8" fill="url(#${g}pl)" stroke="#b5bcc1"/><text x="60" y="-8" text-anchor="middle" class="dev-ar">${esc(c.label || 'لمبة')}</text>
      <path d="M60 34 V64" stroke="#e9ecee" stroke-width="3"/><path d="M60 34 V64" stroke="#9aa3a8" stroke-width="1"/>
      <circle cx="60" cy="98" r="${36 + 14 * lit}" fill="url(#${g}glow)" opacity="${lit ? Math.min(1, lit) : 0}" style="transition:opacity .25s"/>
      <rect x="49" y="62" width="22" height="18" rx="3" fill="#3a4045"/><path d="M49 67h22M49 72h22" stroke="#55606a"/>
      <path d="M50 80 C34 92 34 118 60 124 C86 118 86 92 70 80 Z" fill="${lit > .6 ? '#fff3b0' : lit ? '#f5e7a8' : '#f2f2ee'}" fill-opacity="${lit ? .95 : .55}" stroke="#a7afb4" stroke-width="1.4"/>
      <path d="M55 82 L56 102 L60 96 L64 102 L65 82" fill="none" stroke="${lit ? '#ff9a00' : '#7a6a4a'}" stroke-width="1.5"/></g>`;
  }
  if (c.type === 'socket'){
    const plug = st.plug, lit = st.lamp.plug || 0;
    return `<g transform="${T}"><rect x="0" y="6" width="140" height="28" rx="6" fill="#2f3539" opacity=".85"/><text x="70" y="-6" text-anchor="middle" class="dev-ar">${esc(c.label || 'البريزة')} (من ورا)</text>
      <rect x="12" y="48" width="120" height="120" rx="14" fill="#000" opacity=".15"/><rect x="10" y="44" width="120" height="120" rx="14" fill="url(#${g}pl)" stroke="#b5bcc1"/>
      <circle cx="70" cy="104" r="40" fill="url(#${g}cup)" stroke="#c3c9cd"/><rect x="62" y="62" width="16" height="7" rx="2" fill="url(#${g}brass)"/><rect x="62" y="139" width="16" height="7" rx="2" fill="url(#${g}brass)"/>
      <circle cx="52" cy="104" r="6" fill="#1d2226"/><circle cx="88" cy="104" r="6" fill="#1d2226"/>
      ${plug ? `<g><circle cx="70" cy="104" r="30" fill="#2f3539"/><circle cx="70" cy="104" r="22" fill="#3d454a"/><path d="M70 134 V176" stroke="#2f3539" stroke-width="7"/><circle cx="70" cy="196" r="${18 + 8 * lit}" fill="url(#${g}glow)" opacity="${lit ? 1 : 0}"/><circle cx="70" cy="190" r="10" fill="${lit ? '#fff3b0' : '#f2f2ee'}" stroke="#a7afb4"/></g>` : ''}</g>`;
  }
  return '';
}
BL.bench = function(host, cfg){
  const g = U('bn'), L = cfg.lesson;
  const S = {ex:0, wires:[], pend:null, color:'L', ghost:false, power:false, st:null};
  const ex = () => cfg.exercises[S.ex];
  function terms(e){ const out = {}; e.comps.forEach(c => TDEF[c.type].forEach(([k, dx, dy, role]) => { out[c.id + '.' + k] = {id:c.id + '.' + k, x:c.x + dx, y:c.y + dy, role, lab:TLAB[c.type][k], comp:c}; })); return out; }
  function freshSt(){ const e = ex(), sw = {}; e.comps.forEach(c => { if (c.type === 'sw1' || c.type === 'sw2') sw[c.id] = false; }); return {mcb:true, tripped:false, sw, lamp:{}, plug:false}; }
  function loadWires(){ const w = BL.store.get('bench/' + ex().key); S.wires = Array.isArray(w) ? w.filter(x => Array.isArray(x) && x.length === 3) : []; }
  function saveWires(){ BL.store.set('bench/' + ex().key, S.wires); }
  host.innerHTML = `<div class="tabs bn-tabs" role="group" aria-label="التمرين">${cfg.exercises.map((e, i) => `<button type="button" class="btn" data-ex="${i}" aria-pressed="false">${e.title}</button>`).join('')}</div>
   <div class="box key bn-task"></div>
   <div class="bn-bar">
     <div class="bn-cols" role="group" aria-label="لون السلك"><span>لون السلك:</span>${['L', 'N', 'PE'].map(k => `<button type="button" class="btn" data-col="${k}" aria-pressed="false"><i style="background:${k === 'PE' ? 'repeating-linear-gradient(135deg,#2e9b3c 0 6px,#f2d21b 6px 10px)' : COL[k]}"></i>${COL_AR[k]}</button>`).join('')}</div>
     <div class="bn-tools"><button type="button" class="btn pri" data-b="pwr">شغّل الكهربا</button><button type="button" class="btn" data-b="chk">اختبر التوصيل</button><button type="button" class="btn" data-b="undo">تراجع</button><button type="button" class="btn" data-b="clr">امسح الكل</button><button type="button" class="btn" data-b="sol" aria-pressed="false">وريني الحل</button><button type="button" class="btn" data-b="plug" hidden>اشبك لمبة في البريزة</button></div>
     <div class="msg bn-msg" aria-live="polite">دوس على طرف، وبعدين على الطرف التاني عشان تحط سلك. دوس على السلك عشان تشيله.</div>
   </div>
   <div class="bn-board"></div><div class="bn-res" aria-live="polite"></div>`;
  const q = s => $(s, host);
  const msg = (t, c) => { const m = q('.bn-msg'); m.className = 'msg bn-msg ' + (c || ''); m.innerHTML = t; };

  /* ---------- electrical model ---------- */
  function elems(st, opt){
    opt = opt || {}; const e = ex(), out = [];
    if (!opt.dead) out.push({a:'SRC', b:'SRCN', v:226, ri:0.05, src:true});
    out.push({a:'SRCN', b:'E', r:0.1, bond:true});
    e.comps.forEach(c => {
      const id = c.id;
      if (c.type === 'db'){ if (st.mcb && !st.tripped) out.push({a:'SRC', b:id + '.L', r:0.01}); out.push({a:'SRCN', b:id + '.N', r:0.01}); out.push({a:'E', b:id + '.PE', r:0.01}); }
      if (c.type === 'sw1' && st.sw[id]) out.push({a:id + '.L', b:id + '.L1', r:0.01});
      if (c.type === 'sw2') out.push({a:id + '.C', b:id + (st.sw[id] ? '.L2' : '.L1'), r:0.01});
      if (c.type === 'lamp') out.push({a:id + '.L', b:id + '.N', r:484, r0:40, lamp:id});
      if (c.type === 'socket' && st.plug) out.push({a:id + '.L', b:id + '.N', r:484, lamp:'plug'});
    });
    S.wires.forEach((w, i) => out.push({a:w[0], b:w[1], r:0.02, wire:i}));
    return out;
  }
  function evalState(st){
    const els = elems(st), s = BL.circuit.solve(els), I = Math.abs(s.srcI(els[0]));
    const lamps = {}, live = {};
    els.filter(x => x.lamp).forEach(x => { const dv = Math.abs(s.v(x.a) - s.v(x.b)); lamps[x.lamp] = dv > 180 ? 1 : dv > 30 ? 0.35 : 0; live[x.lamp] = Math.abs(s.v(x.a)) > 60 || Math.abs(s.v(x.b)) > 60; });
    const wcur = {}; els.filter(x => x.wire != null).forEach(x => { wcur[x.wire] = Math.abs(s.v(x.a) - s.v(x.b)) / 0.02; });
    return {short:I > 50, I, lamps, live, wcur, v:s.v};
  }
  function swCombos(){ const ids = Object.keys(freshSt().sw); const out = []; for (let m = 0; m < (1 << ids.length); m++){ const sw = {}; ids.forEach((id, k) => sw[id] = !!(m & (1 << k))); out.push(sw); } return {ids, out}; }
  function analyze(){
    const e = ex(), T = terms(e), res = {pass:false, bad:[], warn:[]};
    if (!S.wires.length){ res.bad.push('لسه مفيش ولا سلك. ابدأ من القاطع.'); return res; }
    const {ids, out} = swCombos(), states = out.map(sw => ({sw, r:evalState({mcb:true, tripped:false, sw, lamp:{}, plug:false})}));
    if (states.some(x => x.r.short)){ res.bad.push('<b>قصر (شورت)!</b> في وضع من أوضاع المفاتيح الفاز بيتقابل مع النيوترال أو الأرضي من غير ما يعدّي على لمبة. القاطع هيفصل على طول. راجع الأسلاك اللي داخلة على N أو PE.'); return res; }
    const lampIds = e.comps.filter(c => c.type === 'lamp').map(c => c.id);
    if (e.kind === 'socket'){
      const dead = elems({mcb:true, tripped:false, sw:{}, lamp:{}, plug:false}, {dead:true}).filter(x => !x.bond);
      const R = (a, b) => BL.circuit.resistance(dead, a, b) < 1;
      const so = e.comps.find(c => c.type === 'socket').id;
      if (R(so + '.L', 'db.N') && R(so + '.N', 'db.L')) res.bad.push('<b>الفاز والنيوترال معكوسين</b> في البريزة. البريزة هتشتغل، بس أي جهاز مفتاحه هيقطع النيوترال بدل الفاز ويفضل جواه كهربا وهو مقفول. اعكسهم.');
      else {
        if (!R(so + '.L', 'db.L')) res.bad.push('طرف <b>L</b> في البريزة مش واصل لخرج القاطع (الفاز).');
        if (!R(so + '.N', 'db.N')) res.bad.push('طرف <b>N</b> في البريزة مش واصل لبار النيوترال.');
      }
      if (R(so + '.PE', 'db.N')) res.bad.push('<b>الأرضي متوصّل على بار النيوترال!</b> ممنوع: النيوترال بيشيل تيار، ولو اتقطع جسم الجهاز هيكهرب. الأرضي يروح على بار <b>PE</b> بس.');
      else if (!R(so + '.PE', 'db.PE')) res.bad.push('<b>الأرضي (PE)</b> مش متوصّل! البريزة هتشتغل عادي، بس لو جهاز جسمه كهرب مفيش طريق للتيار يروح للأرض ويفصل القاطع. لازم سلك أخضر×أصفر من بار الأرضي لريشة الأرضي.');
      if (!res.bad.length) res.pass = true;
    } else {
      const on = st => st.sw;
      lampIds.forEach(id => {
        const litStates = states.filter(x => x.r.lamps[id] === 1), dim = states.some(x => x.r.lamps[id] > 0 && x.r.lamps[id] < 1);
        if (dim){ res.bad.push(`<b>${esc(e.comps.find(c => c.id === id).label)}</b> بتنوّر ضعيف: اللمبتين متوصّلين <b>ورا بعض (توالي)</b> فكل واحدة واخدة نص الجهد. لازم كل لمبة طرف منها على الفاز اللي جاي من المفتاح والطرف التاني على النيوترال.`); return; }
        if (!litStates.length){
          const s1 = states[states.length - 1].r, vL = Math.abs(s1.v(id + '.L')), vN = Math.abs(s1.v(id + '.N'));
          res.bad.push(`<b>${esc(e.comps.find(c => c.id === id).label)}</b> مش بتنوّر في أي وضع للمفتاح. ` + (vL > 60 && vN > 60 ? 'الفاز واصل للمبة بس <b>النيوترال مش واصل</b> (اختبرها بالتستر: الطرفين بينوّروا).' : vL < 60 && vN < 60 ? '<b>الفاز مش واصل</b> للمبة. اتأكد إن خرج القاطع داخل على المفتاح وخارج من المفتاح للمبة.' : 'السكة مش مقفولة.'));
          return;
        }
        if (litStates.length === states.length){ res.bad.push(`<b>${esc(e.comps.find(c => c.id === id).label)}</b> منوّرة على طول والمفتاح مش بيأثر فيها: المفتاح مش في سكة الفاز للمبة.`); return; }
      });
      if (e.kind === '2way' && !res.bad.length){
        const [a, b] = ids, lit = sw => states.find(x => x.sw[a] === sw[a] && x.sw[b] === sw[b]).r.lamps[lampIds[0]] === 1;
        const okToggle = out.every(sw => lit(sw) !== lit(Object.assign({}, sw, {[a]:!sw[a]})) && lit(sw) !== lit(Object.assign({}, sw, {[b]:!sw[b]})));
        if (!okToggle) res.bad.push('اللمبة مش بتتحكم من <b>المفتاحين</b>: لازم أي مفتاح تقلبه يغيّر حالة اللمبة. وصّل L1 بـ L1 و L2 بـ L2 بين المفتاحين (سلكين "الرابط")، والفاز على C بتاع الأول، و C بتاع التاني يروح للمبة.');
      }
      if (!res.bad.length){
        const unsafe = states.some(x => lampIds.some(id => x.r.lamps[id] === 0 && x.r.live[id]));
        if (unsafe) res.bad.push('<b>اللمبة بتشتغل، بس التوصيل مش آمن!</b> المفتاح قاطع <b>النيوترال</b> مش الفاز. لما تطفي اللمبة الفاز بيفضل واصل لها: لو مسكت التستر على الدوي هينوّر، ولو حد بيغيّر اللمبة وهي مطفية ممكن ياخد كهربا. <b>المفتاح لازم يبقى على الفاز (البني).</b>');
        else res.pass = true;
      }
      /* lamp holder polarity: switched live should land on the holder's L */
      if (res.pass) lampIds.forEach(id => { const st = states.find(x => x.r.lamps[id] === 1); if (st && Math.abs(st.r.v(id + '.N')) > 60 && Math.abs(st.r.v(id + '.L')) < 60) res.warn.push(`في ${esc(e.comps.find(c => c.id === id).label)} الفاز داخل على طرف N والنيوترال على L. خلّي الفاز (اللي جاي من المفتاح) على <b>L</b> وهو السنّة اللي في نص الدوي، عشان القلاووظ اللي ممكن تلمسه يبقى نيوترال.`); });
    }
    /* colours */
    S.wires.forEach(w => { const ra = (T[w[0]] || {}).role, rb = (T[w[1]] || {}).role, want = ra === 'PE' || rb === 'PE' ? 'PE' : ra === 'N' || rb === 'N' ? 'N' : 'L'; if (ra && rb && w[2] !== want && !(ra === 'N' && rb === 'L') && !(ra === 'L' && rb === 'N')) res.warn.push(`السلك من ${T[w[0]].lab} (${esc(T[w[0]].comp.label || '')}) لـ ${T[w[1]].lab} (${esc(T[w[1]].comp.label || '')}) لونه ${COL_AR[w[2]]}، والمفروض <b>${COL_AR[want]}</b>.`); });
    return res;
  }

  /* ---------- drawing ---------- */
  function route(A, B){ const dy = 26 + Math.min(70, Math.abs(A.x - B.x) * 0.22); return `M${A.x} ${A.y} C${A.x} ${A.y + dy} ${B.x} ${B.y + dy} ${B.x} ${B.y}`; }
  function colStroke(k){ return k === 'PE' ? `url(#${g}gyw)` : COL[k]; }
  function render(){
    const e = ex(), T = terms(e);
    if (!S.st) S.st = freshSt();
    let ev = null;
    if (S.power){ ev = evalState(S.st); if (ev.short){ S.st.tripped = true; S.power = false; ev = null; msg('<b>القاطع فصل!</b> فيه قصر (شورت) في التوصيل. افصل وراجع الأسلاك.', 'bad'); } }
    S.st.lamp = ev ? ev.lamps : {};
    let s = `<svg viewBox="0 0 360 ${e.H}" role="group" aria-label="لوحة التوصيل: ${esc(e.title)}"><defs>
      <linearGradient id="${g}enc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9ecee"/><stop offset="1" stop-color="#b8c0c5"/></linearGradient>
      <linearGradient id="${g}rail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3c9cd"/><stop offset=".5" stop-color="#f4f6f7"/><stop offset="1" stop-color="#8d969c"/></linearGradient>
      <linearGradient id="${g}mod" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9ecee"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#d3d8db"/></linearGradient>
      <linearGradient id="${g}brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d27a"/><stop offset="1" stop-color="#b8892a"/></linearGradient>
      <linearGradient id="${g}pl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe3e6"/></linearGradient>
      <linearGradient id="${g}rk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d5dadd"/><stop offset="1" stop-color="#f8f9fa"/></linearGradient>
      <radialGradient id="${g}cup" cx=".5" cy=".4"><stop offset="0" stop-color="#d5dadd"/><stop offset="1" stop-color="#f8f9fa"/></radialGradient>
      <radialGradient id="${g}glow"><stop offset="0" stop-color="#fff7c2"/><stop offset=".45" stop-color="#ffd84a" stop-opacity=".8"/><stop offset="1" stop-color="#ffb300" stop-opacity="0"/></radialGradient>
      <pattern id="${g}gy" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="#2e9b3c"/><rect width="5" height="12" fill="#f2d21b"/></pattern>
      <pattern id="${g}gyw" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#2e9b3c"/><rect width="6" height="14" fill="#f2d21b"/></pattern>
    </defs><rect x="0" y="0" width="360" height="${e.H}" fill="var(--wall)"/>`;
    e.comps.forEach(c => { s += drawComp(c, S.st, g); });
    if (S.ghost) (e.solution || []).forEach(w => { const A = T[w[0]], B = T[w[1]]; if (A && B) s += `<path class="bw-ghost" d="${route(A, B)}" stroke="${w[2] === 'PE' ? '#2e9b3c' : COL[w[2]]}"/>`; });
    S.wires.forEach((w, i) => { const A = T[w[0]], B = T[w[1]]; if (!A || !B) return; const d = route(A, B), flow = ev && ev.wcur[i] > 0.05;
      s += `<g class="bw"><path class="bw-o" d="${d}"/><path class="bw-c" d="${d}" stroke="${colStroke(w[2])}"/>${flow ? `<path d="${d}" class="flow" fill="none" stroke="#fff6b0" stroke-width="2" stroke-dasharray="6 18" style="--dur:.8s;opacity:.9"/>` : ''}<path class="bw-hit" d="${d}" data-w="${i}" tabindex="0" role="button" aria-label="سلك ${COL_AR[w[2]]} من ${A.lab} لـ ${B.lab}: دوس عشان تشيله"/></g>`; });
    Object.values(T).forEach(t => { const pend = S.pend === t.id;
      s += `<g class="bt${pend ? ' pend' : ''}"><circle class="bt-s" cx="${t.x}" cy="${t.y}" r="9"/><path class="bt-x" d="M${t.x - 5} ${t.y}h10"/><circle class="bt-hit" data-t="${t.id}" cx="${t.x}" cy="${t.y}" r="21" tabindex="0" role="button" aria-label="طرف ${t.lab} في ${esc(t.comp.label || '')}"/><circle class="bt-ring" cx="${t.x}" cy="${t.y}" r="14"/><text class="bt-lab" x="${t.x}" y="${t.y + 25}">${t.lab}</text></g>`; });
    s += '</svg>';
    q('.bn-board').innerHTML = s;
    $$('[data-ex]', host).forEach(b => { const i = +b.dataset.ex; b.setAttribute('aria-pressed', i === S.ex ? 'true' : 'false'); b.classList.toggle('done', BL.has(L, cfg.exercises[i].key)); });
    $$('[data-col]', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.col === S.color ? 'true' : 'false'));
    const pw = q('[data-b=pwr]'); pw.textContent = S.power ? 'افصل الكهربا' : 'شغّل الكهربا'; pw.classList.toggle('pri', !S.power); pw.style.background = S.power ? 'var(--bad)' : ''; pw.style.color = S.power ? '#fff' : ''; pw.style.borderColor = S.power ? 'var(--bad)' : '';
    const sb = q('[data-b=sol]'); sb.textContent = S.ghost ? 'اخفي الحل' : 'وريني الحل'; sb.setAttribute('aria-pressed', S.ghost ? 'true' : 'false');
    const pl = q('[data-b=plug]'); pl.hidden = e.kind !== 'socket'; pl.textContent = S.st.plug ? 'شيل اللمبة من البريزة' : 'اشبك لمبة في البريزة';
    if (S.power && ev){ const any = Object.values(ev.lamps).some(Boolean); msg(any ? 'الكهربا شغّالة. دوس على المفتاح عشان تقلبه وشوف اللمبة.' : 'الكهربا شغّالة، بس مفيش حاجة منوّرة. جرّب تقلب المفتاح، أو اختبر التوصيل.', any ? 'ok' : ''); }
  }
  function renderTask(){ const e = ex(); q('.bn-task').innerHTML = `<h3>${e.title}</h3><p>${e.task}</p>${e.tip ? `<p class="muted" style="font-size:.9rem;margin-top:4px">${e.tip}</p>` : ''}${BL.has(L, e.key) ? '<p style="color:var(--good);font-weight:700;margin-top:4px">✓ خلّصت التمرين ده</p>' : ''}`; }
  function setEx(i){ S.ex = i; S.pend = null; S.ghost = false; S.power = false; S.st = freshSt(); loadWires(); q('.bn-res').innerHTML = ''; renderTask(); msg('دوس على طرف، وبعدين على الطرف التاني عشان تحط سلك. دوس على السلك عشان تشيله.'); render(); }
  function termClick(id){
    if (S.power){ msg('⚡ افصل الكهربا الأول قبل ما تلمس أي سلك.', 'bad'); return; }
    if (!S.pend){ S.pend = id; msg('اختار الطرف التاني للسلك.'); render(); return; }
    if (S.pend === id){ S.pend = null; msg('اتلغى.'); render(); return; }
    const a = S.pend, b = id; S.pend = null;
    if (S.wires.some(w => (w[0] === a && w[1] === b) || (w[0] === b && w[1] === a))){ msg('السلك ده موجود خلاص.'); render(); return; }
    S.wires.push([a, b, S.color]); saveWires(); q('.bn-res').innerHTML = ''; msg(`اتحط سلك ${COL_AR[S.color]}.`); render();
  }
  function check(){
    const r = analyze(), e = ex(), box = q('.bn-res');
    if (r.pass){ BL.mark(L, e.key); box.innerHTML = `<div class="bn-ok"><b>✓ التوصيل صح!</b> ${e.okText || ''}</div>${r.warn.length ? `<div class="bn-warn"><b>ملاحظة:</b><ul style="margin:0;padding-inline-start:18px">${r.warn.map(w => `<li>${w}</li>`).join('')}</ul></div>` : ''}`; renderTask(); }
    else box.innerHTML = `<div class="bn-bad"><b>لسه فيه حاجة:</b><ul style="margin:0;padding-inline-start:18px">${r.bad.map(w => `<li>${w}</li>`).join('')}</ul></div>${r.warn.length ? `<div class="bn-warn"><ul style="margin:0;padding-inline-start:18px">${r.warn.map(w => `<li>${w}</li>`).join('')}</ul></div>` : ''}`;
    render(); return r;
  }
  host.addEventListener('click', e => {
    const t = e.target.closest('[data-t],[data-w],[data-sw],[data-ex],[data-col],[data-b]'); if (!t) return;
    if (t.dataset.t) termClick(t.dataset.t);
    else if (t.dataset.w != null){ if (S.power){ msg('⚡ افصل الكهربا الأول.', 'bad'); return; } S.wires.splice(+t.dataset.w, 1); saveWires(); q('.bn-res').innerHTML = ''; msg('اتشال السلك.'); render(); }
    else if (t.dataset.sw){ S.st.sw[t.dataset.sw] = !S.st.sw[t.dataset.sw]; render(); }
    else if (t.dataset.ex != null) setEx(+t.dataset.ex);
    else if (t.dataset.col){ S.color = t.dataset.col; render(); }
    else if (t.dataset.b === 'pwr'){ S.power = !S.power; if (S.power){ S.st.tripped = false; S.pend = null; } else { msg('الكهربا مفصولة. تقدر تعدّل في الأسلاك.'); } render(); }
    else if (t.dataset.b === 'chk') check();
    else if (t.dataset.b === 'undo'){ if (S.power){ msg('⚡ افصل الكهربا الأول.', 'bad'); return; } S.wires.pop(); saveWires(); render(); }
    else if (t.dataset.b === 'clr'){ if (S.power){ msg('⚡ افصل الكهربا الأول.', 'bad'); return; } S.wires = []; saveWires(); q('.bn-res').innerHTML = ''; render(); }
    else if (t.dataset.b === 'sol'){ S.ghost = !S.ghost; msg(S.ghost ? 'ده الحل بخطوط متقطعة. وصّل انت بإيدك زيه، الحل مش بيتوصّل لوحده.' : 'خبّيت الحل.'); render(); }
    else if (t.dataset.b === 'plug'){ S.st.plug = !S.st.plug; render(); }
  });
  host.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const t = e.target.closest('[data-t],[data-w],[data-sw]'); if (!t) return; e.preventDefault(); t.dispatchEvent(new MouseEvent('click', {bubbles:true})); });
  setEx(0);
  return {S, setEx, wire(a, b, c){ S.pend = null; if (c) S.color = c; termClick(a); termClick(b); }, clear(){ S.wires = []; saveWires(); render(); }, check, analyze, power(v){ S.power = v; if (v) S.st.tripped = false; render(); return S.power; }, flip(id){ S.st.sw[id] = !S.st.sw[id]; render(); }, lamps: () => Object.assign({}, S.st.lamp), solution: () => (ex().solution || []).slice()};
};
})();
