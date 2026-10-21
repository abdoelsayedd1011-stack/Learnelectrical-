/* Instrumentation course (English): shared engine for the hub and the 10 lessons.
   Modules: store/progress · theme · lesson shell · quiz · drill · physics (IL.calc: ⁦4⁠–⁠20 mA⁩, encoder,
   Gray code, thermocouple tables, RTD/NTC, load cell, hydrostatic level) · device drawings (IL.art) ·
   one widget per lesson topic. Lesson pages hold the content + data and call the widgets. */
(function(){
'use strict';
const IL = window.IL = {};
const KEY = 'instr-lab-v1';

/* ---------------- store ---------------- */
function load(){ try { const s = JSON.parse(localStorage.getItem(KEY)); return s && typeof s === 'object' ? s : {}; } catch (e){ return {}; } }
let S = load(); if (!S.done || typeof S.done !== 'object') S.done = {};
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e){} }
const subs = [];
IL.on = fn => subs.push(fn);
IL.store = {
  has: k => !!S.done[k],
  mark(k){ if (S.done[k]) return false; const f = load(); S = Object.assign({}, f, S); S.done = Object.assign({}, f.done || {}, S.done); S.done[k] = Date.now(); save(); subs.forEach(fn => { try { fn(k); } catch (e){} }); return true; },
  get: k => S[k],
  set(k, v){ S[k] = v; save(); },
  reset(){ S = {done:{}}; save(); subs.forEach(fn => { try { fn(); } catch (e){} }); },
  reload(){ S = load(); if (!S.done) S.done = {}; }
};

/* ---------------- theme (applied before first paint: instr.js loads in <head>) ---------------- */
function applyTheme(){ const t = S.theme; if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
applyTheme();
function isDark(){ const t = document.documentElement.getAttribute('data-theme'); if (t) return t === 'dark'; return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
function themeBtn(){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn theme-b';
  const upd = () => { const d = isDark(); b.textContent = d ? '☀' : '☾'; b.setAttribute('aria-label', d ? 'Light mode' : 'Dark mode'); b.title = b.getAttribute('aria-label'); };
  b.addEventListener('click', () => { IL.store.set('theme', isDark() ? 'light' : 'dark'); applyTheme(); upd(); });
  upd(); return b;
}

/* ---------------- course map ---------------- */
IL.COURSE = [
  {id:'l1', n:1, file:'lesson-01.html', title:'What is instrumentation?', sub:'The loop: sensor, transmitter, controller and valve. PV, SP and range, and reading tags like TT-101',
    tasks:[['loop','Heating loop'],['tags','Decode the tags'],['quiz','Lesson quiz']]},
  {id:'l2', n:2, file:'lesson-02.html', title:'Analog signals: 4–20 mA and 0–10 V', sub:'Why 4 and not zero, 2-, 3- and 4-wire transmitters, scaling to a value, and measuring loop current',
    tasks:[['sim','Loop simulator and faults'],['scale','Scaling drill'],['quiz','Lesson quiz']]},
  {id:'l3', n:3, file:'lesson-03.html', title:'Digital sensors', sub:'Proximity, photoelectric and limit switches, NO/NC, and PNP vs NPN on a PLC input card',
    tasks:[['pnp','Wire a PNP sensor'],['npn','Wire an NPN sensor'],['quiz','Lesson quiz']]},
  {id:'l4', n:4, file:'lesson-04.html', title:'Encoders 1: incremental', sub:'The disc and channels A, B and Z, direction, PPR, x1/x2/x4 counting, speed and output types',
    tasks:[['enc','Encoder experiment'],['edrill','Direction and frequency drill'],['quiz','Lesson quiz']]},
  {id:'l5', n:5, file:'lesson-05.html', title:'Encoders 2: absolute, mounting and faults', sub:'Gray code, single-turn and multi-turn, SSI and Profinet, mounting and shielding, and the fault game',
    tasks:[['gray','Gray code disc'],['efault','Encoder fault game'],['quiz','Lesson quiz']]},
  {id:'l6', n:6, file:'lesson-06.html', title:'Temperature 1: thermocouples', sub:'Types K, J, T and S, cold junction compensation (CJC), compensating cable, colours and faults',
    tasks:[['tc','Thermocouple bench'],['tcdrill','mV → °C drill'],['quiz','Lesson quiz']]},
  {id:'l7', n:7, file:'lesson-07.html', title:'Temperature 2: PT100, RTD and NTC', sub:'100 Ω at zero, 2-, 3- and 4-wire and the lead-wire error, the transmitter, and NTC and PTC',
    tasks:[['rtd','PT100 bench'],['ptdrill','Ω → °C drill'],['quiz','Lesson quiz']]},
  {id:'l8', n:8, file:'lesson-08.html', title:'Load cells and scales', sub:'Strain gauges and the bridge, mV/V, 4- and 6-wire, scale calibration, and checking a load cell with a multimeter',
    tasks:[['lc','Load cell bench'],['cal','Indicator calibration'],['lcdiag','Fault diagnosis'],['quiz','Lesson quiz']]},
  {id:'l9', n:9, file:'lesson-09.html', title:'Pressure, level and flow', sub:'Pressure and DP transmitters, level by pressure and radar, and magnetic, vortex and Coriolis flowmeters',
    tasks:[['lvl','Level tank'],['pick','Pick the right instrument'],['quiz','Lesson quiz']]},
  {id:'l10', n:10, file:'lesson-10.html', title:'Calibration, troubleshooting + final exam', sub:'Loop check, the as-found / as-left sheet, the calibrator, the field fault game and the final exam',
    tasks:[['caltab','5-point calibration'],['fgame','Field fault game'],['quiz','Lesson quiz'],['final','Final exam']]}
];
IL.lessonById = id => IL.COURSE.find(l => l.id === id);
IL.summary = id => { const l = IL.lessonById(id); const done = l.tasks.filter(t => IL.store.has(id + '/' + t[0])).length; return {done, total:l.tasks.length}; };
IL.mark = (lid, task) => IL.store.mark(lid + '/' + task);
IL.has = (lid, task) => IL.store.has(lid + '/' + task);
IL.allDone = () => IL.COURSE.every(l => { const s = IL.summary(l.id); return s.done === s.total; });

/* ---------------- helpers ---------------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
IL.esc = esc;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
IL.$ = $; IL.$$ = $$;
const fmt = (v, d) => { const p = Math.pow(10, d); const r = Math.round(v * p) / p; return (Object.is(r, -0) ? 0 : r).toFixed(d); };
IL.fmt = fmt;
function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
IL.shuffle = shuffle;
const pick = a => a[Math.floor(Math.random() * a.length)];
IL.pick = pick;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
IL.clamp = clamp;
const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
IL.reduced = reduced;
let uid = 0; const U = p => p + (++uid);
IL.uid = U;
/* run fn(dt, ts) every animation frame while the host is on screen */
function animate(host, fn){
  let raf = 0, vis = true, last = 0, on = true;
  function loop(ts){ raf = 0; if (!vis || !on) return; const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts; fn(dt, ts); raf = requestAnimationFrame(loop); }
  const kick = () => { if (!raf && vis && on){ last = 0; raf = requestAnimationFrame(loop); } };
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { vis = es[0].isIntersecting; kick(); }).observe(host);
  document.addEventListener('visibilitychange', () => { if (document.hidden){ vis = false; } else { vis = true; kick(); } });
  kick();
  return {stop(){ on = false; }, start(){ on = true; kick(); }};
}
IL.animate = animate;
/* tap/keyboard on [data-*] elements inside a host */
function onAct(host, sel, fn){
  host.addEventListener('click', e => { const t = e.target.closest(sel); if (t && host.contains(t)) fn(t, e); });
  host.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const t = e.target.closest(sel); if (t && host.contains(t) && t.tagName !== 'BUTTON' && t.tagName !== 'INPUT' && t.tagName !== 'SELECT'){ e.preventDefault(); fn(t, e); } });
}
IL.onAct = onAct;
const num = s => { const v = parseFloat(String(s).replace(',', '.').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))); return isFinite(v) ? v : NaN; };
IL.num = num;
function chal(host, sel, lesson, task){ const c = $(sel, host); if (c && IL.has(lesson, task)) c.classList.add('ok'); return () => { if (c) c.classList.add('ok'); IL.mark(lesson, task); }; }

/* ---------------- lesson shell ---------------- */
IL.lesson = function(id){
  const L = IL.lessonById(id); IL.cur = L;
  const ch = $('header.top .chips'); if (ch){ langBtn(ch); ch.appendChild(themeBtn()); }
  const prog = $('#lprog');
  function renderProg(){
    if (!prog) return;
    const s = IL.summary(id), pct = Math.round(s.done / s.total * 100);
    prog.innerHTML = `<div class="row"><span>Your progress in this lesson: <b>${s.done} of ${s.total}</b></span><span class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progress ${pct}%"><i style="width:${pct}%"></i></span></div><ul>${L.tasks.map(t => `<li class="${IL.has(id, t[0]) ? 'ok' : ''}">${esc(t[1])}</li>`).join('')}</ul>`;
  }
  renderProg(); IL.on(renderProg);
  const nav = $('#lnav');
  if (nav){
    const i = IL.COURSE.indexOf(L), p = IL.COURSE[i - 1], n = IL.COURSE[i + 1];
    nav.innerHTML = (p ? `<a class="btn" href="${p.file}">← Lesson ${p.n}: ${esc(p.title)}</a>` : `<a class="btn" href="index.html">← Course page</a>`) +
      (n ? `<a class="btn pri" href="${n.file}">Lesson ${n.n}: ${esc(n.title)} →</a>` : `<a class="btn pri" href="index.html#certSec">Certificate →</a>`);
  }
  window.addEventListener('pageshow', e => { if (e.persisted){ IL.store.reload(); renderProg(); } });
};
IL.hubTheme = () => { const ch = $('header.top .chips'); if (ch){ langBtn(ch); ch.appendChild(themeBtn()); } };
/* «ع» switch to the Arabic twin: course pages have no .site-header, so add it here unless assets/i18n.js already did */
function langBtn(ch){
  if (document.querySelector('.lang-btn, .lang-b')) return;
  const I = window.LE_I18N, a = document.createElement('a');
  a.className = 'btn lang-b'; a.setAttribute('data-keep', ''); a.lang = 'ar'; a.hreflang = 'ar'; a.textContent = 'ع';
  a.href = I && I.twin ? I.twin() : location.pathname.replace(/^\/en\//, '/') + location.hash;
  a.setAttribute('aria-label', 'اقرا الصفحة دي بالعربي'); a.title = a.getAttribute('aria-label');
  a.addEventListener('click', () => { try { localStorage.setItem('le-lang', 'ar'); } catch (e){} });
  ch.appendChild(a);
}

/* ---------------- quiz ----------------
   qs: [{q, o:[...], a:index, why}] ; opt: {lesson, task, pass(0..1), row, shuffle} */
IL.quiz = function(host, qs, opt){
  opt = opt || {};
  const pass = opt.pass == null ? 0.8 : opt.pass;
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
      const f = $('.qz-f', box); f.className = 'qz-f ' + (ok ? 'ok' : 'no'); f.innerHTML = (ok ? 'Correct. ' : 'Not that one. ') + (it.q.why || '');
      if (ans.every(x => x != null)) finish();
      return;
    }
    if (e.target.closest('[data-qz=again]')) start();
  });
  function finish(){
    const n = ans.filter(Boolean).length, tot = ans.length, ok = n / tot >= pass - 1e-9;
    const sum = $('.qz-sum', host); sum.hidden = false; sum.className = 'qz-sum ' + (ok ? 'ok' : 'no');
    sum.innerHTML = `<b>Your score: ${n} of ${tot}</b><span>${ok ? 'Excellent, you passed ✓' : `You need at least ${Math.ceil(pass * tot - 1e-9)} correct. Review the lesson and try again.`}</span><button type="button" class="btn" data-qz="again">${ok ? 'Take it again' : 'Try again'}</button>`;
    if (ok && opt.lesson) IL.mark(opt.lesson, opt.task || 'quiz');
    if (opt.onDone) opt.onDone(n, tot, ok);
  }
  start();
  const api = {solve(wrong){ order.forEach((it, k) => { const i = wrong && k === 0 ? it.oi.find(j => j !== it.q.a) : it.q.a; const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }); return $('.qz-sum', host).textContent; }, answer(k, i){ const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }, order: () => order.map(x => x.q), restart: start};
  (IL._q = IL._q || []).push(api); api.host = host;
  return api;
};

/* ---------------- drill: a stream of generated questions ----------------
   gen() → {q (html), o:[...] , a:index, why}  or  {q, input:true, unit, check(v)→bool, ans (text), why}
   need: correct answers to finish the task */
IL.drill = function(host, gen, opt){
  opt = opt || {};
  const need = opt.need || 5;
  let ok = 0, tries = 0, cur = null, answered = false;
  host.innerHTML = `<div class="dr"><div class="dr-top"><span class="dr-sc" aria-live="polite"></span><span class="bar dr-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${need}" aria-label="Correct answers"><i></i></span></div><div class="dr-card"></div><div class="dr-act"><button type="button" class="btn pri dr-next" hidden>Next question →</button></div><p class="chal dr-chal">${opt.goal || `Get <b>${need}</b> right to complete this drill.`}</p></div>`;
  const fin = chal(host, '.dr-chal', opt.lesson, opt.task);
  const card = $('.dr-card', host), nx = $('.dr-next', host);
  function score(){ $('.dr-sc', host).innerHTML = `Correct: <b>${ok}</b> of ${tries}`; const p = Math.min(1, ok / need) * 100; $('.dr-bar i', host).style.width = p + '%'; $('.dr-bar', host).setAttribute('aria-valuenow', Math.min(ok, need)); }
  function next(){
    cur = gen(); answered = false; nx.hidden = true;
    if (cur.input){
      card.innerHTML = `<div class="dr-q">${cur.q}</div><form class="dr-in"><input class="inp" inputmode="decimal" autocomplete="off" aria-label="Your answer" placeholder="Your answer"><span class="mono dr-u">${esc(cur.unit || '')}</span><button class="btn pri" type="submit">Check</button></form><p class="qz-f" aria-live="polite"></p>`;
    } else {
      const oi = shuffle(cur.o.map((_, i) => i));
      card.innerHTML = `<div class="dr-q">${cur.q}</div><div class="qz-a${cur.row ? ' row' : ''}">${oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${cur.o[i]}</button>`).join('')}</div><p class="qz-f" aria-live="polite"></p>`;
    }
    score();
  }
  function result(good, chosen){
    answered = true; tries++; if (good) ok++;
    const f = $('.qz-f', card); f.className = 'qz-f ' + (good ? 'ok' : 'no');
    f.innerHTML = (good ? 'Correct. ' : 'Not quite. ') + (cur.ans != null && !good ? `Answer: <b class="eq">${cur.ans}</b>. ` : '') + (cur.why || '');
    if (!cur.input) $$('.qz-o', card).forEach(x => { x.disabled = true; if (+x.dataset.i === cur.a) x.classList.add('ok'); else if (x === chosen) x.classList.add('no'); });
    else $$('input,button', card).forEach(x => x.disabled = true);
    score(); nx.hidden = false;
    if (ok >= need) fin();
    nx.focus({preventScroll:true});
  }
  card.addEventListener('click', e => { const b = e.target.closest('.qz-o'); if (b && !answered) result(+b.dataset.i === cur.a, b); });
  card.addEventListener('submit', e => { e.preventDefault(); if (answered) return; const v = num($('input', card).value); if (!isFinite(v)){ const f = $('.qz-f', card); f.className = 'qz-f no'; f.textContent = 'Enter a number.'; return; } result(!!cur.check(v)); });
  nx.addEventListener('click', next);
  next();
  return {get cur(){ return cur; }, answer(v){ if (cur.input){ $('input', card).value = v; $('.dr-in button', card).click(); } else { const b = card.querySelector(`.qz-o[data-i="${v}"]`); if (b) b.click(); } }, next, get ok(){ return ok; }};
};

/* ================= physics / logic (pure functions, script-tested) ================= */
const C = IL.calc = {};

/* ---- ⁦4⁠–⁠20 mA⁩ ---- */
C.pv2mA = (pv, lrv, urv) => 4 + (pv - lrv) / (urv - lrv) * 16;
C.mA2pv = (mA, lrv, urv) => lrv + (mA - 4) / 16 * (urv - lrv);
C.mA2pct = mA => (mA - 4) / 16 * 100;
/* NAMUR NE43 status of a loop current */
C.namur = mA => mA < 3.6 ? 'fail-low' : mA < 3.8 ? 'under' : mA <= 20.5 ? 'ok' : mA < 21 ? 'over' : 'fail-high';
/* a 2-wire loop: supply V, load R (Ω), transmitter wants I (mA), needs vmin across itself; card current limit */
C.loop2w = function(o){
  const want = o.mA, R = o.R, vs = o.vs, vmin = o.vmin == null ? 10.5 : o.vmin;
  const iMax = Math.max(0, (vs - vmin) / R * 1000);
  const I = Math.min(want, iMax);
  return {mA:I, limited:want > iMax + 1e-9, vTx:vs - I / 1000 * R, vLoad:I / 1000 * R};
};

/* ---- encoder ---- */
/* position p in pulses (float, signed). channel states, B lags A by 90° when p increases (CW) */
C.encAB = p => { const f = ((p % 1) + 1) % 1, g = (((p - 0.25) % 1) + 1) % 1; return {A:f < 0.5 ? 1 : 0, B:g < 0.5 ? 1 : 0}; };
C.encZ = (p, ppr) => { const q = ((p % ppr) + ppr) % ppr; return q < 0.25 ? 1 : 0; };
/* counter value for decoding mode m (1, 2 or 4) = number of counted edges from 0 to p (signed) */
C.encCount = (p, m) => Math.floor(p * m + 1e-9);
C.encFreq = (ppr, rpm) => ppr * rpm / 60;
C.encRpm = (counts, m, ppr, sec) => counts / m / ppr / sec * 60;
/* direction from two successive AB samples (quadrature state machine): +1, −1, 0 or NaN (illegal jump) */
C.quadStep = (a0, b0, a1, b1) => {
  const s = [2, 3, 1, 0]; /* CW sequence of (A,B): 10 → 11 → 01 → 00, coded A*2+B */
  const code = (a, b) => s.indexOf(a * 2 + b);
  const d = (code(a1, b1) - code(a0, b0) + 4) % 4;
  return d === 0 ? 0 : d === 1 ? 1 : d === 3 ? -1 : NaN;
};

/* ---- Gray code ---- */
C.bin2gray = n => n ^ (n >> 1);
C.gray2bin = g => { let n = g; for (let s = g >> 1; s; s >>= 1) n ^= s; return n; };
C.bits = (n, w) => n.toString(2).padStart(w, '0');

/* ---- thermocouples: NIST ITS-90 reference tables, mV with reference junction at 0 °C ---- */
C.TC = {
  K:{name:'K', pair:'Chromel / Alumel (NiCr–NiAl)', range:[-200, 1250], tab:[[-200,-5.891],[-100,-3.554],[-50,-1.889],[0,0],[25,1.000],[50,2.023],[100,4.096],[150,6.138],[200,8.138],[250,10.153],[300,12.209],[350,14.293],[400,16.397],[450,18.516],[500,20.644],[550,22.776],[600,24.905],[650,27.025],[700,29.129],[750,31.213],[800,33.275],[850,35.313],[900,37.326],[950,39.314],[1000,41.276],[1050,43.211],[1100,45.119],[1150,46.995],[1200,48.838],[1250,50.644],[1300,52.410],[1350,54.138]]},
  J:{name:'J', pair:'Iron / Constantan (Fe–CuNi)', range:[-40, 750], tab:[[-100,-4.633],[-50,-2.431],[0,0],[25,1.277],[50,2.585],[100,5.269],[150,8.010],[200,10.779],[250,13.555],[300,16.327],[350,19.090],[400,21.848],[450,24.610],[500,27.393],[550,30.216],[600,33.102],[650,36.071],[700,39.132],[750,42.281],[800,45.494]]},
  T:{name:'T', pair:'Copper / Constantan (Cu–CuNi)', range:[-200, 350], tab:[[-200,-5.603],[-150,-4.648],[-100,-3.379],[-50,-1.819],[0,0],[25,0.992],[50,2.036],[100,4.279],[150,6.704],[200,9.288],[250,12.013],[300,14.862],[350,17.819],[400,20.872]]},
  N:{name:'N', pair:'Nicrosil / Nisil', range:[-200, 1250], tab:[[-200,-3.990],[-100,-2.407],[0,0],[25,0.659],[50,1.340],[100,2.774],[200,5.913],[300,9.341],[400,12.974],[500,16.748],[600,20.613],[700,24.527],[800,28.455],[900,32.371],[1000,36.256],[1100,40.087],[1200,43.846],[1300,47.513]]},
  S:{name:'S', pair:'Pt10%Rh / Pt', range:[0, 1600], tab:[[-50,-0.236],[0,0],[25,0.143],[50,0.296],[100,0.646],[200,1.441],[300,2.323],[400,3.259],[500,4.233],[600,5.239],[700,6.275],[800,7.345],[900,8.449],[1000,9.587],[1100,10.757],[1200,11.951],[1300,13.159],[1400,14.373],[1500,15.582],[1600,16.777]]},
  R:{name:'R', pair:'Pt13%Rh / Pt', range:[0, 1600], tab:[[-50,-0.226],[0,0],[25,0.141],[50,0.296],[100,0.647],[200,1.469],[300,2.401],[400,3.408],[500,4.471],[600,5.583],[700,6.743],[800,7.950],[900,9.205],[1000,10.506],[1100,11.850],[1200,13.228],[1300,14.629],[1400,16.040],[1500,17.451],[1600,18.849]]},
  B:{name:'B', pair:'Pt30%Rh / Pt6%Rh', range:[250, 1800], tab:[[0,0],[50,0.002],[100,0.033],[200,0.178],[300,0.431],[400,0.787],[500,1.242],[600,1.792],[700,2.431],[800,3.154],[900,3.957],[1000,4.834],[1100,5.780],[1200,6.786],[1300,7.848],[1400,8.956],[1500,10.099],[1600,11.263],[1700,12.433],[1800,13.591]]}
};
function interp(tab, x, i0, i1){
  if (x <= tab[0][i0]) { const a = tab[0], b = tab[1]; return a[i1] + (x - a[i0]) * (b[i1] - a[i1]) / (b[i0] - a[i0]); }
  for (let k = 1; k < tab.length; k++){ const a = tab[k - 1], b = tab[k]; if (x <= b[i0]) return a[i1] + (x - a[i0]) * (b[i1] - a[i1]) / (b[i0] - a[i0]); }
  const a = tab[tab.length - 2], b = tab[tab.length - 1]; return a[i1] + (x - a[i0]) * (b[i1] - a[i1]) / (b[i0] - a[i0]);
}
C.interp = interp;
C.tcMv = (type, t) => interp(C.TC[type].tab, t, 0, 1);
C.tcT = (type, mv) => interp(C.TC[type].tab, mv, 1, 0);
C.tcInTable = (type, mv) => { const t = C.TC[type].tab; return mv >= t[0][1] - 1e-9 && mv <= t[t.length - 1][1] + 1e-9; };
/* full bench: hot junction th, terminal/head temperature thead (where the TC wires end), instrument terminals tamb.
   cable: 'ext' (matching extension / compensating cable) or 'cu' (plain copper from the head), cjc on/off, rev (polarity swapped at the instrument),
   open (burn-out) → returns {mv (at instrument), shown (°C or null), status} */
C.tcRead = function(o){
  const E = t => C.tcMv(o.type, t);
  if (o.open) return {mv:NaN, shown:null, status:'open'};
  const tcj = o.cable === 'cu' ? o.thead : o.tamb; /* where the thermoelectric circuit really ends */
  let mv = E(o.th) - E(tcj);
  if (o.rev) mv = -mv;
  const sum = mv + (o.cjc ? E(o.tamb) : 0);
  if (!C.tcInTable(o.type, sum)) return {mv, shown:null, status:sum < 0 ? 'under' : 'over'};
  return {mv, shown:C.tcT(o.type, sum), status:'ok'};
};

/* ---- RTD: IEC 60751 Callendar–Van Dusen ---- */
const A_ = 3.9083e-3, B_ = -5.775e-7, C_ = -4.183e-12;
C.rtdR = (t, r0) => { r0 = r0 || 100; return t >= 0 ? r0 * (1 + A_ * t + B_ * t * t) : r0 * (1 + A_ * t + B_ * t * t + C_ * (t - 100) * t * t * t); };
C.rtdT = (r, r0) => {
  r0 = r0 || 100;
  if (r >= r0) return (-A_ + Math.sqrt(A_ * A_ - 4 * B_ * (1 - r / r0))) / (2 * B_);
  let t = (r / r0 - 1) / 0.00385; for (let k = 0; k < 30; k++){ const f = C.rtdR(t, r0) - r, d = (C.rtdR(t + 0.01, r0) - C.rtdR(t - 0.01, r0)) / 0.02; t -= f / d; } return t;
};
C.CU_RHO = 0.0175; /* Ω·mm²/m copper at 20 °C */
C.leadR = (len, mm2) => C.CU_RHO * len / mm2;
/* wires: 2 | 3 | 4 ; rl: one lead's resistance; extra: extra contact resistance in ONE lead (a loose / corroded terminal) */
C.rtdMeasured = (t, wires, rl, extra, r0) => {
  const rt = C.rtdR(t, r0); extra = extra || 0;
  if (wires === 2) return rt + 2 * rl + extra;
  if (wires === 3) return rt + extra; /* bridge / ratiometric 3-wire: equal leads cancel, an imbalance in one lead does not */
  return rt;
};
/* IEC 60751 tolerance classes (°C) */
const TOLC = {AA:[0.1, 0.0017], A:[0.15, 0.002], B:[0.3, 0.005], C:[0.6, 0.01]};
C.rtdTol = (cls, t) => TOLC[cls] ? TOLC[cls][0] + TOLC[cls][1] * Math.abs(t) : NaN;
/* NTC beta model */
C.ntcR = (t, r25, beta) => r25 * Math.exp(beta * (1 / (t + 273.15) - 1 / 298.15));
C.ntcT = (r, r25, beta) => 1 / (1 / 298.15 + Math.log(r / r25) / beta) - 273.15;

/* ---- load cell ---- */
/* output (mV) at the cell: sens (mV/V) × Vexc_at_cell × load/cap + zero offset */
C.lcMv = (load, cap, sens, vexc, zero) => sens * vexc * load / cap + (zero || 0);
/* excitation reaching the cell through a 4-wire cable: Rin of the cell, one wire's resistance rw */
C.lcVcell = (vexc, rin, rw) => vexc * rin / (rin + 2 * rw);
/* copper resistance at temperature */
C.cuR = (r20, t) => r20 * (1 + 0.00393 * (t - 20));
/* weighing indicator two-point calibration: zero counts z (mV), span point (mV at test weight w) → kg per mV */
C.calib = (zmv, smv, w) => ({z:zmv, k:w / (smv - zmv)});
C.weigh = (cal, mv) => (mv - cal.z) * cal.k;

/* ---- hydrostatic level ---- */
C.G = 9.80665;
C.hydroP = (h, rho) => rho * C.G * h;            /* Pa */
C.hydroH = (p, rho) => p / (rho * C.G);          /* m */

/* ---- calibration error in % of span for a ⁦4⁠–⁠20 mA⁩ output ---- */
C.errPct = (mA, ideal) => (mA - ideal) / 16 * 100;

/* ================= device drawings (inline SVG) =================
   Each IL.art.X(opt) returns SVG markup for a group drawn at the origin in its own box size (IL.art.size[X]).
   IL.art.svg(name, opt) wraps one in a stand-alone <svg>. Colours are neutral industrial ones that work in both themes. */
const ART = IL.art = {};
function grads(g){
  return `<linearGradient id="${g}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1f3"/><stop offset=".35" stop-color="#c3cad0"/><stop offset=".7" stop-color="#9aa4ac"/><stop offset="1" stop-color="#d7dde1"/></linearGradient>
  <linearGradient id="${g}mh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a3adb4"/><stop offset=".3" stop-color="#eef1f3"/><stop offset=".65" stop-color="#b9c1c7"/><stop offset="1" stop-color="#8d979f"/></linearGradient>
  <linearGradient id="${g}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a535a"/><stop offset=".5" stop-color="#2a3035"/><stop offset="1" stop-color="#1c2125"/></linearGradient>
  <linearGradient id="${g}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f8fd0"/><stop offset=".55" stop-color="#2c6aac"/><stop offset="1" stop-color="#1f4f85"/></linearGradient>
  <linearGradient id="${g}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22302a"/><stop offset="1" stop-color="#0d1712"/></linearGradient>
  <radialGradient id="${g}r" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`;
}
ART.defs = g => `<defs>${grads(g)}</defs>`;
ART.size = {transmitter:[120, 170], aicard:[96, 180], encoder:[170, 110], tchead:[90, 210], pt100:[210, 60], scell:[96, 150], beam:[220, 70], indicator:[190, 120], prox:[170, 50], psu:[100, 120]};
ART.svg = function(name, opt){
  opt = opt || {}; const g = U('ar'), [w, h] = ART.size[name];
  return `<svg viewBox="-4 -4 ${w + 8} ${h + 8}" role="img" aria-label="${esc(opt.label || name)}">${ART.defs(g)}${ART[name](Object.assign({g}, opt))}</svg>`;
};
const screw = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r || 4}" fill="#cfd5da" stroke="#5d6469" stroke-width="1"/><path d="M${x - (r || 4) * .7} ${y}h${(r || 4) * 1.4}" stroke="#4a5257" stroke-width="1.2"/>`;
ART.screw = screw;
/* pressure / DP transmitter with a local LCD */
ART.transmitter = function(o){
  const g = o.g, v = o.lcd == null ? '12.50' : o.lcd, u = o.unit || 'mA';
  return `<g>
  <rect x="2" y="26" width="10" height="16" rx="2" fill="url(#${g}mh)" stroke="#6b757c"/><rect x="108" y="26" width="10" height="16" rx="2" fill="url(#${g}mh)" stroke="#6b757c"/>
  <rect x="10" y="8" width="100" height="62" rx="16" fill="url(#${g}b)" stroke="#173d66" stroke-width="1.5"/>
  <rect x="14" y="11" width="92" height="10" rx="5" fill="#fff" opacity=".18"/>
  <circle cx="60" cy="39" r="26" fill="url(#${g}mh)" stroke="#5d6469" stroke-width="1.5"/>
  <circle cx="60" cy="39" r="20" fill="#b8c7a2" stroke="#3e4a33"/><circle cx="60" cy="39" r="20" fill="url(#${g}r)"/>
  <text x="60" y="42" text-anchor="middle" style="font:700 11px var(--font-mono);fill:#16210c">${esc(v)}</text><text x="60" y="52" text-anchor="middle" style="font:600 7px var(--font-mono);fill:#16210c">${esc(u)}</text>
  <rect x="50" y="70" width="20" height="16" fill="url(#${g}mh)" stroke="#6b757c"/>
  <rect x="34" y="86" width="52" height="40" rx="6" fill="url(#${g}mh)" stroke="#6b757c"/>
  <path d="M40 98h40M40 112h40" stroke="#7f8a92" stroke-width="1"/>
  <path d="M42 126h36l-4 16H46z" fill="url(#${g}mh)" stroke="#6b757c"/>
  <rect x="50" y="142" width="20" height="22" fill="url(#${g}mh)" stroke="#6b757c"/>
  <path d="M50 146h20M50 150h20M50 154h20M50 158h20" stroke="#7f8a92" stroke-width=".9"/></g>`;
};
/* PLC analog input card */
ART.aicard = function(o){
  const g = o.g, ch = o.ch || [false, false, false, false], sf = !!o.sf;
  let t = '';
  for (let i = 0; i < 8; i++){ const y = 92 + i * 10.5; t += `<rect x="54" y="${y - 4.5}" width="30" height="9" rx="1.5" fill="#2a3035"/>${screw(76, y, 3.4)}<text x="58" y="${y + 3}" style="font:600 6.5px var(--font-mono);fill:#c9d1d6">${['0+', '0−', '1+', '1−', '2+', '2−', '3+', '3−'][i]}</text>`; }
  return `<g><rect x="4" y="2" width="88" height="176" rx="6" fill="url(#${g}d)" stroke="#111" stroke-width="1.2"/>
  <rect x="10" y="8" width="76" height="22" rx="3" fill="#e9edf0"/><text x="48" y="18" text-anchor="middle" style="font:700 8px var(--font-mono);fill:#1c2125">AI 4×I</text><text x="48" y="27" text-anchor="middle" style="font:600 6.5px var(--font-mono);fill:#3d464c">⁦4⁠–⁠20 mA⁩</text>
  <circle cx="18" cy="42" r="3.6" fill="#35d06a"/><text x="25" y="45" style="font:600 7px var(--font-mono);fill:#c9d1d6">RUN</text>
  <circle cx="18" cy="54" r="3.6" fill="${sf ? '#ff3b30' : '#4a2522'}"${sf ? ' style="filter:drop-shadow(0 0 4px #ff3b30)"' : ''}/><text x="25" y="57" style="font:600 7px var(--font-mono);fill:#c9d1d6">SF</text>
  ${ch.map((on, i) => `<circle cx="18" cy="${70 + i * 10}" r="3" fill="${on === 'err' ? '#ff3b30' : on ? '#35d06a' : '#24402c'}"/><text x="25" y="${73 + i * 10}" style="font:600 6.5px var(--font-mono);fill:#c9d1d6">CH${i}</text>`).join('')}
  <rect x="50" y="84" width="38" height="88" rx="3" fill="#3a4248" stroke="#111"/>${t}</g>`;
};
/* incremental / absolute encoder, side view (shaft to the left, connector on the back) */
ART.encoder = function(o){
  const g = o.g;
  return `<g><rect x="0" y="48" width="34" height="14" rx="2" fill="url(#${g}m)" stroke="#6b757c"/><rect x="6" y="51" width="22" height="3" fill="#7f8a92"/>
  <rect x="30" y="28" width="12" height="54" rx="2" fill="url(#${g}m)" stroke="#5d6469"/>
  ${screw(36, 34, 2.6)}${screw(36, 76, 2.6)}
  <rect x="42" y="18" width="88" height="74" rx="8" fill="url(#${g}d)" stroke="#0f1215"/>
  <rect x="46" y="22" width="80" height="8" rx="4" fill="#fff" opacity=".12"/>
  <rect x="56" y="40" width="58" height="30" rx="3" fill="#e9edf0"/><text x="85" y="52" text-anchor="middle" style="font:700 8px var(--font-mono);fill:#1c2125">${esc(o.tag || '1024 PPR')}</text><text x="85" y="63" text-anchor="middle" style="font:600 6.5px var(--font-mono);fill:#3d464c">${esc(o.sub || '⁦10⁠–⁠30V⁩ HTL')}</text>
  <rect x="130" y="40" width="16" height="30" rx="2" fill="url(#${g}m)" stroke="#5d6469"/>
  <rect x="146" y="44" width="22" height="22" rx="3" fill="url(#${g}mh)" stroke="#5d6469"/><path d="M150 48v14M155 48v14M160 48v14M164 48v14" stroke="#6b757c" stroke-width="1"/></g>`;
};
/* thermocouple / RTD assembly: DIN B connection head + thermowell */
ART.tchead = function(o){
  const g = o.g;
  return `<g><path d="M8 40q0-34 37-34t37 34v22H8z" fill="url(#${g}mh)" stroke="#5d6469" stroke-width="1.3"/>
  <path d="M14 40q0-27 31-27" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>${screw(45, 24, 4.5)}
  <rect x="4" y="58" width="82" height="12" rx="3" fill="url(#${g}m)" stroke="#5d6469"/>
  <rect x="80" y="36" width="10" height="16" rx="2" fill="#2a3035"/><path d="M84 38v12" stroke="#4a535a" stroke-width="2"/>
  <rect x="36" y="70" width="18" height="14" fill="url(#${g}mh)" stroke="#6b757c"/>
  <path d="M30 84h30l-3 12H33z" fill="url(#${g}mh)" stroke="#6b757c"/>
  <rect x="38" y="96" width="14" height="96" fill="url(#${g}mh)" stroke="#6b757c"/>
  <path d="M38 192h14l-4 14h-6z" fill="url(#${g}mh)" stroke="#6b757c"/>
  ${o.tag ? `<text x="45" y="52" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#1c2125">${esc(o.tag)}</text>` : ''}</g>`;
};
/* RTD probe with M12 connector */
ART.pt100 = function(o){
  const g = o.g;
  return `<g><rect x="0" y="24" width="120" height="12" rx="6" fill="url(#${g}m)" stroke="#6b757c"/>
  <rect x="116" y="18" width="26" height="24" fill="url(#${g}m)" stroke="#5d6469"/><path d="M122 18v24M128 18v24M134 18v24" stroke="#8d979f"/>
  <rect x="142" y="22" width="28" height="16" rx="2" fill="url(#${g}m)" stroke="#5d6469"/>
  <rect x="170" y="16" width="38" height="28" rx="5" fill="url(#${g}d)" stroke="#111"/><path d="M176 22v16M182 22v16M188 22v16M194 22v16M200 22v16" stroke="#4a535a" stroke-width="1.5"/>
  <text x="60" y="16" text-anchor="middle" style="font:700 9px var(--font-mono);fill:var(--ink)">${esc(o.tag == null ? 'PT100 · 4-wire' : o.tag)}</text></g>`;
};
/* S-type load cell */
ART.scell = function(o){
  const g = o.g;
  return `<g><rect x="40" y="0" width="16" height="16" fill="url(#${g}mh)" stroke="#6b757c"/><path d="M40 4h16M40 8h16M40 12h16" stroke="#8d979f" stroke-width=".8"/>
  <path d="M6 16h84v40H40v38h50v40H6V94h34V56H6z" fill="url(#${g}mh)" stroke="#5d6469" stroke-width="1.4"/>
  <rect x="8" y="58" width="30" height="34" fill="#c7ced3" stroke="#8d979f"/><rect x="58" y="58" width="30" height="34" fill="#c7ced3" stroke="#8d979f"/>
  <rect x="40" y="56" width="16" height="38" fill="url(#${g}m)" stroke="#5d6469"/>
  <circle cx="48" cy="75" r="9" fill="none" stroke="#7f8a92" stroke-width="1.2"/>
  <rect x="88" y="66" width="8" height="16" rx="2" fill="#2a3035"/>
  <rect x="40" y="134" width="16" height="16" fill="url(#${g}mh)" stroke="#6b757c"/><path d="M40 138h16M40 142h16M40 146h16" stroke="#8d979f" stroke-width=".8"/></g>`;
};
/* shear-beam load cell (fixed end on the left, load on the right) */
ART.beam = function(o){
  const g = o.g;
  return `<g><rect x="0" y="16" width="210" height="40" rx="3" fill="url(#${g}m)" stroke="#5d6469" stroke-width="1.4"/>
  <circle cx="22" cy="36" r="7" fill="#8d979f" stroke="#5d6469"/><circle cx="52" cy="36" r="7" fill="#8d979f" stroke="#5d6469"/>
  <circle cx="186" cy="36" r="9" fill="#8d979f" stroke="#5d6469"/>
  <rect x="96" y="22" width="56" height="28" rx="12" fill="#b4bcc2" stroke="#7f8a92"/><circle cx="124" cy="36" r="8" fill="#a3adb4" stroke="#7f8a92"/>
  <rect x="70" y="56" width="14" height="8" fill="#2a3035"/><path d="M77 64q0 6 -10 6H0" fill="none" stroke="#3a3f44" stroke-width="5" stroke-linecap="round"/></g>`;
};
/* weighing indicator */
ART.indicator = function(o){
  const g = o.g;
  return `<g><rect x="2" y="2" width="186" height="116" rx="10" fill="url(#${g}d)" stroke="#0f1215" stroke-width="1.2"/>
  <rect x="12" y="14" width="166" height="44" rx="4" fill="#06130b" stroke="#000"/>
  <text x="170" y="48" text-anchor="end" style="font:700 26px var(--font-mono);fill:#4dff88">${esc(o.disp == null ? '0' : o.disp)}</text><text x="20" y="28" style="font:600 8px var(--font-mono);fill:#2f9e58">kg</text>
  ${['ZERO', 'TARE', 'F', 'ENT'].map((k, i) => `<rect x="${16 + i * 42}" y="72" width="36" height="24" rx="5" fill="#d7dde1" stroke="#5d6469"/><text x="${34 + i * 42}" y="88" text-anchor="middle" style="font:700 8px var(--font-mono);fill:#1c2125">${k}</text>`).join('')}
  <text x="95" y="111" text-anchor="middle" style="font:600 7px var(--font-mono);fill:#93a2ab">WEIGHING INDICATOR</text></g>`;
};
/* M18 inductive proximity sensor (face to the left) */
ART.prox = function(o){
  const g = o.g, on = !!o.on;
  return `<g><rect x="0" y="13" width="14" height="24" rx="2" fill="${o.face || '#2f6fb3'}"/>
  <rect x="12" y="12" width="96" height="26" fill="url(#${g}m)" stroke="#6b757c"/>${Array.from({length:22}, (_, i) => `<path d="M${16 + i * 4} 12v26" stroke="#8d979f" stroke-width=".8"/>`).join('')}
  <rect x="34" y="8" width="12" height="34" rx="1" fill="url(#${g}mh)" stroke="#5d6469"/><rect x="84" y="8" width="12" height="34" rx="1" fill="url(#${g}mh)" stroke="#5d6469"/>
  <rect x="108" y="15" width="22" height="20" fill="url(#${g}d)"/><circle cx="119" cy="25" r="4.2" fill="${on ? '#ffb000' : '#5a4a20'}"${on ? ' style="filter:drop-shadow(0 0 4px #ffb000)"' : ''}/>
  <rect x="130" y="18" width="38" height="14" rx="3" fill="url(#${g}d)"/><path d="M136 18v14M142 18v14M148 18v14M154 18v14" stroke="#4a535a"/></g>`;
};
/* 24 V DC DIN-rail power supply */
ART.psu = function(o){
  const g = o.g;
  return `<g><rect x="2" y="2" width="96" height="116" rx="5" fill="#d7dde1" stroke="#5d6469" stroke-width="1.2"/>
  <rect x="8" y="8" width="84" height="14" rx="2" fill="#3a4248"/>${[0, 1, 2, 3].map(i => screw(18 + i * 21, 15, 4)).join('')}
  <text x="50" y="44" text-anchor="middle" style="font:700 11px var(--font-mono);fill:#1c2125">24V DC</text><text x="50" y="56" text-anchor="middle" style="font:600 7.5px var(--font-mono);fill:#3d464c">POWER SUPPLY</text>
  <circle cx="20" cy="74" r="3.5" fill="#35d06a"/><text x="27" y="77" style="font:600 7px var(--font-mono);fill:#3d464c">DC OK</text>
  <rect x="8" y="98" width="84" height="14" rx="2" fill="#3a4248"/>${[0, 1, 2, 3].map(i => screw(18 + i * 21, 105, 4)).join('')}
  <text x="18" y="94" text-anchor="middle" style="font:700 7px var(--font-mono);fill:#c0352b">+</text><text x="39" y="94" text-anchor="middle" style="font:700 7px var(--font-mono);fill:#c0352b">+</text><text x="60" y="94" text-anchor="middle" style="font:700 7px var(--font-mono);fill:#1f6fd1">−</text><text x="81" y="94" text-anchor="middle" style="font:700 7px var(--font-mono);fill:#1f6fd1">−</text></g>`;
};

/* ================= L1: tank heating control loop ================= */
C.pi = function(st, pv, sp, dt, p){ /* PI controller with anti-windup; st={i}; returns output % */
  const e = sp - pv; let out = p.kc * e + st.i;
  if (out > 100 || out < 0){ out = clamp(out, 0, 100); } else st.i += p.kc * e * dt / p.ti;
  st.i = clamp(st.i, -20, 110);
  return clamp(out, 0, 100);
};
IL.heatLoop = function(host, opt){
  opt = opt || {};
  const L = opt.lesson, T0 = 25, LRV = 0, URV = 150, g = U('hl');
  const S = {pv:30, sp:50, out:0, valve:0, auto:true, man:30, dist:0, t:0, st:{i:0}, hist:[], ok:0, sp0:50};
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg viewBox="0 0 360 270" role="img" aria-label="A water tank heated by steam: temperature sensor, controller and steam valve">${ART.defs(g)}
   <defs><linearGradient id="${g}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb0f0"/><stop offset="1" stop-color="#2a74c0"/></linearGradient></defs>
   <rect x="30" y="70" width="150" height="170" rx="14" fill="url(#${g}mh)" stroke="#5d6469" stroke-width="1.5"/>
   <rect x="38" y="96" width="134" height="136" rx="8" class="hl-water" fill="url(#${g}w)"/>
   <path class="hl-coil" d="M50 214q10-14 20 0t20 0 20 0 20 0 20 0 20 0" fill="none" stroke="#c0352b" stroke-width="5" stroke-linecap="round"/>
   <g class="hl-bub"></g>
    <path d="M150 214H200V250H340" fill="none" stroke="#7f8a92" stroke-width="6"/><text x="300" y="266" class="svg-ar w-mu" style="font-size:10px" text-anchor="middle">Steam in</text>
   <g transform="translate(240 250)"><path d="M-14 -9L14 9V-9L-14 9z" fill="url(#${g}m)" stroke="#5d6469" stroke-width="1.4"/><path d="M0 0V-24" stroke="#5d6469" stroke-width="3"/><path d="M-16 -24a16 12 0 0 1 32 0z" fill="url(#${g}b)" stroke="#173d66"/>
     <rect x="-12" y="-46" width="24" height="10" rx="2" fill="var(--panel)" stroke="var(--line)"/><rect class="hl-vpos" x="-11" y="-45" width="0" height="8" fill="var(--accent)"/></g>
   <text x="262" y="222" style="font-size:10px" class="w-tx">TV-101</text>
   <g transform="translate(180 120)"><path d="M0 0H22" stroke="#7f8a92" stroke-width="5"/><circle cx="34" cy="0" r="14" fill="var(--panel)" stroke="var(--ink)" stroke-width="1.6"/><path d="M20 0H48" stroke="var(--ink)" stroke-width="1"/><text x="34" y="-3" text-anchor="middle" style="font:700 8px var(--font-mono)" class="w-tx">TT</text><text x="34" y="9" text-anchor="middle" style="font:600 7px var(--font-mono)" class="w-tx">101</text></g>
   <rect x="250" y="40" width="100" height="92" rx="8" fill="#1d2328" stroke="#0f1215"/>
   <text x="300" y="54" text-anchor="middle" style="font:700 9px var(--font-mono);fill:#c9d1d6">TIC-101</text>
   <text x="258" y="72" style="font:600 9px var(--font-mono);fill:#93a2ab">PV</text><text class="hl-dpv" x="342" y="73" text-anchor="end" style="font:700 14px var(--font-mono);fill:#ff6b5e">0</text>
   <text x="258" y="92" style="font:600 9px var(--font-mono);fill:#93a2ab">SP</text><text class="hl-dsp" x="342" y="93" text-anchor="end" style="font:700 14px var(--font-mono);fill:#4dff88">0</text>
   <text x="258" y="112" style="font:600 9px var(--font-mono);fill:#93a2ab">OUT</text><text class="hl-dout" x="342" y="113" text-anchor="end" style="font:700 14px var(--font-mono);fill:#3fd0ff">0</text>
   <text class="hl-mode" x="300" y="127" text-anchor="middle" style="font:700 8px var(--font-mono);fill:#ffd23f">AUTO</text>
   <path class="flow" d="M228 120H240V100H250" fill="none" stroke="var(--cur)" stroke-width="2" stroke-dasharray="6 6"/>
   <path class="flow" d="M300 132V160H240V202" fill="none" stroke="var(--cur)" stroke-width="2" stroke-dasharray="6 6"/>
   <text x="236" y="94" class="w-mu" style="font-size:9px" text-anchor="end">⁦4⁠–⁠20 mA⁩</text><text x="304" y="152" class="w-mu" style="font-size:9px">⁦4⁠–⁠20 mA⁩</text>
    <text x="105" y="60" text-anchor="middle" class="svg-ar w-tx" style="font-size:12px;font-weight:700">Water tank</text>
    <g class="hl-cold" opacity="0"><path d="M10 40H60V80" fill="none" stroke="var(--cold)" stroke-width="6"/><text x="12" y="32" class="svg-ar" style="font-size:10px;fill:var(--cold);font-weight:700">Cold water</text></g>
  </svg></div>
  <div class="mm-side">
    <div class="read"><div><span>PV (actual temperature)</span><b class="hl-pv">0</b></div><div><span>SP (wanted)</span><b class="hl-sp">0</b></div><div><span>OUT (valve opening)</span><b class="hl-out">0</b></div><div><span>TT-101 signal</span><b class="hl-ma">0</b></div></div>
    <div class="wd-ctl"><label>Setpoint SP: <b class="hl-spv"></b><input type="range" class="hl-sps" min="30" max="95" step="1" value="50" aria-label="Setpoint SP"></label>
    <button type="button" class="btn hl-am" aria-pressed="false">Switch to Manual</button><button type="button" class="btn hl-dis">Open cold water (disturbance)</button>
    <label class="hl-manl" hidden>Manual valve opening: <b class="hl-manv"></b><input type="range" class="hl-man" min="0" max="100" step="1" value="30" aria-label="Manual valve opening"></label></div>
  </div></div>
  <div class="wd-art"><svg class="hl-tr" viewBox="0 0 360 130" role="img" aria-label="Trend: PV, SP and OUT over time"></svg></div>
  <p class="msg hl-msg" aria-live="polite"></p>
  <p class="chal hl-chal">Challenge: change the SP by at least 10 degrees (to 70, for example) and leave the controller in <b>AUTO</b> until the PV settles at the SP (±1 °C).</p>`;
  const q = s => $(s, host), fin = chal(host, '.hl-chal', L, 'loop');
  const sps = q('.hl-sps'), man = q('.hl-man');
  sps.addEventListener('input', () => { S.sp = +sps.value; S.ok = 0; ui(); });
  man.addEventListener('input', () => { S.man = +man.value; ui(); });
  q('.hl-am').addEventListener('click', () => { S.auto = !S.auto; if (S.auto) S.st.i = S.out - 4 * (S.sp - S.pv); else { S.man = Math.round(S.out); man.value = S.man; } S.ok = 0; ui(); });
  q('.hl-dis').addEventListener('click', () => { S.dist = 40; ui(); });
  function step(dt){ /* dt in simulated seconds */
    S.t += dt;
    S.out = S.auto ? C.pi(S.st, S.pv, S.sp, dt, {kc:4, ti:30}) : S.man;
    S.valve += (S.out - S.valve) * Math.min(1, dt / 4);
    const loss = S.dist > 0 ? 18 : 0; if (S.dist > 0) S.dist -= dt;
    S.pv += (T0 + S.valve * 1.0 - loss - S.pv) / 45 * dt;
  }
  let acc = 0;
  function frame(dt){
    let sim = dt * 8; /* 8× faster than real time */
    while (sim > 0){ const d = Math.min(0.25, sim); step(d); sim -= d; acc += d; if (acc >= 0.5){ acc -= 0.5; S.hist.push([S.pv, S.sp, S.out]); if (S.hist.length > 240) S.hist.shift(); } }
    if (S.auto && Math.abs(S.sp - S.sp0) >= 10 && Math.abs(S.pv - S.sp) <= 1 && S.dist <= 0){ S.ok += dt * 8; if (S.ok > 16 && !IL.has(L, 'loop')){ fin(); msg('Excellent! The controller moved the valve by itself until the temperature reached the SP and settled. That is a closed loop.', 'ok'); } } else S.ok = 0;
    ui();
  }
  const msg = (t, c) => { const m = q('.hl-msg'); m.className = 'msg hl-msg ' + (c || ''); m.innerHTML = t; };
  function trend(){
    const X0 = 30, X1 = 352, Y0 = 8, Y1 = 112, yT = v => Y1 - (v - 20) / 80 * (Y1 - Y0), yO = v => Y1 - v / 100 * (Y1 - Y0);
    const n = S.hist.length, xs = i => X1 - (n - 1 - i) / 239 * (X1 - X0);
    const path = (f) => S.hist.map((h, i) => (i ? 'L' : 'M') + xs(i).toFixed(1) + ' ' + f(h).toFixed(1)).join('');
    let gl = ''; [20, 40, 60, 80, 100].forEach(v => { gl += `<line x1="${X0}" x2="${X1}" y1="${yT(v)}" y2="${yT(v)}" class="w-ln" stroke-width=".6"/><text x="${X0 - 4}" y="${yT(v) + 3}" text-anchor="end" class="w-mu" style="font-size:9px">${v}</text>`; });
    q('.hl-tr').innerHTML = gl + `<text x="${X0 - 4}" y="126" text-anchor="end" class="w-mu" style="font-size:9px">°C</text>
      <path d="${path(h => yO(h[2]))}" fill="none" stroke="var(--cur)" stroke-width="1.6" opacity=".8"/>
      <path d="${path(h => yT(h[1]))}" fill="none" stroke="var(--good)" stroke-width="2" stroke-dasharray="6 4"/>
      <path d="${path(h => yT(h[0]))}" fill="none" stroke="var(--bad)" stroke-width="2.4"/>
      <text x="${X0 + 4}" y="124" style="font-size:9px"><tspan fill="var(--bad)">━ PV °C</tspan>   <tspan fill="var(--good)">┅ SP °C</tspan>   <tspan fill="var(--cur)">━ OUT %</tspan></text><text x="${X1}" y="124" text-anchor="end" class="svg-ar w-mu" style="font-size:9px">Last 2 minutes</text>`;
  }
  let tick = 0;
  function ui(){
    const mA = C.pv2mA(S.pv, LRV, URV);
    q('.hl-pv').textContent = fmt(S.pv, 1) + ' °C'; q('.hl-sp').textContent = S.sp + ' °C'; q('.hl-out').textContent = fmt(S.out, 0) + ' %'; q('.hl-ma').textContent = fmt(mA, 2) + ' mA';
    q('.hl-dpv').textContent = fmt(S.pv, 1); q('.hl-dsp').textContent = fmt(S.sp, 1); q('.hl-dout').textContent = fmt(S.out, 0) + '%';
    q('.hl-mode').textContent = S.auto ? 'AUTO' : 'MAN'; q('.hl-spv').textContent = S.sp + ' °C'; q('.hl-manv').textContent = S.man + ' %';
    const am = q('.hl-am'); am.textContent = S.auto ? 'Switch to Manual' : 'Back to Auto'; am.setAttribute('aria-pressed', String(!S.auto)); q('.hl-manl').hidden = S.auto;
    q('.hl-vpos').setAttribute('width', (S.valve / 100 * 22).toFixed(1));
    const hot = clamp((S.pv - 25) / 70, 0, 1); q('.hl-water').style.fill = `rgb(${Math.round(60 + 170 * hot)},${Math.round(140 - 60 * hot)},${Math.round(220 - 150 * hot)})`;
    q('.hl-coil').style.opacity = 0.3 + S.valve / 140; q('.hl-cold').setAttribute('opacity', S.dist > 0 ? 1 : 0);
    q('.hl-bub').innerHTML = S.pv > 70 && !reduced() ? [60, 95, 130, 155].map((x, i) => `<circle cx="${x}" cy="${110 + ((S.t * 12 + i * 23) % 90)}" r="${2 + (i % 2)}" fill="#fff" opacity=".55"/>`).join('') : '';
    if (++tick % 3 === 0 || !S.hist.length) trend();
    if (!S.auto && !q('.hl-msg').classList.contains('ok')) msg('You are in <b>Manual</b> now: the controller ignores the PV and the valve stays where you set it. The loop is <b>open</b>.');
    else if (S.dist > 0) msg('Cold water is entering the tank: the temperature drops and the controller opens the valve further to make up for it.');
    else if (!q('.hl-msg').classList.contains('ok')) msg(Math.abs(S.pv - S.sp) > 1 ? `Error = SP − PV = <b class="eq">${fmt(S.sp - S.pv, 1)} °C</b>. The controller moves the valve based on it.` : 'The PV is at the SP and the valve holds the opening that makes up for the heat loss.');
  }
  for (let k = 0; k < 60; k++){ step(0.25); if (k % 2) S.hist.push([S.pv, S.sp, S.out]); }
  ui(); trend();
  animate(host, frame);
  return {S, setSP(v){ sps.value = v; sps.dispatchEvent(new Event('input')); }, run(sec){ for (let t = 0; t < sec; t++) frame(1 / 8); }};
};

/* ================= L1: P&ID tag decoder ================= */
IL.TAGS = [
  ['TT', 'Temperature Transmitter'], ['TE', 'Temperature Element: the sensor itself, like a thermocouple or PT100'], ['TI', 'Local Temperature Indicator'],
  ['TIC', 'Temperature Indicating Controller (controller with a display)'], ['TSH', 'Temperature Switch High'],
  ['PT', 'Pressure Transmitter'], ['PI', 'Local Pressure Indicator (gauge)'], ['PIC', 'Pressure Indicating Controller'], ['PSL', 'Pressure Switch Low'], ['PDT', 'Differential Pressure Transmitter'],
  ['FT', 'Flow Transmitter'], ['FE', 'Flow Element: the orifice plate or sensor'], ['FIC', 'Flow Indicating Controller'], ['FV', 'Flow control valve'],
  ['LT', 'Level Transmitter'], ['LSH', 'Level Switch High'], ['LSL', 'Level Switch Low'], ['LIC', 'Level Indicating Controller'], ['LAH', 'Level Alarm High'],
  ['WT', 'Weight Transmitter: load cell and indicator'], ['ST', 'Speed Transmitter'], ['ZT', 'Position Transmitter'], ['TV', 'Temperature control valve']
];
IL.tagGen = function(){
  const [tag, mean] = pick(IL.TAGS), n = 100 + Math.floor(Math.random() * 400);
  const others = shuffle(IL.TAGS.filter(t => t[0] !== tag && (t[0][0] === tag[0] || t[0].slice(1) === tag.slice(1)))).slice(0, 3);
  while (others.length < 3){ const t = pick(IL.TAGS); if (t[0] !== tag && !others.includes(t)) others.push(t); }
  return {q:`The drawing shows this instrument: <div class="tags-row" style="margin-top:6px"><span class="tag-b">${tag}<br>${n}</span></div>What does it mean?`, o:[mean].concat(others.map(t => t[1])), a:0,
    why:`The first letter <b>${tag[0]}</b> = ${({T:'temperature', P:'pressure', F:'flow', L:'level', W:'weight', S:'speed', Z:'position'})[tag[0]]}, the rest = the function. The number ${n} is the loop number.`};
};

/* ================= L2: ⁦4⁠–⁠20 mA⁩ loop simulator ================= */
/* pure model of the bench loop: o = {p (bar), lrv, urv, vs, R, fault: ''|cut|short|rev|fail, meter: 'series'|'par'} */
C.loopSim = function(o){
  const ILIM = 25; /* card / fuse protection limits a dead short to about this (mA) */
  const lrv = o.lrv == null ? 0 : o.lrv, urv = o.urv == null ? 10 : o.urv, R = o.R || 250;
  let txWant = clamp(C.pv2mA(o.p, lrv, urv), 3.8, 20.5); /* NAMUR NE43 saturation of a healthy transmitter */
  if (o.fault === 'fail') txWant = 21.75;
  let I, how = 'ok', vTx = 0;
  if (o.fault === 'cut' || o.fault === 'rev'){ I = 0; how = o.fault; vTx = o.fault === 'rev' ? -o.vs : o.vs; }
  else if (o.fault === 'short' || o.meter === 'par'){ I = Math.min(ILIM, o.vs / (R + (o.meter === 'par' ? 10 : 0)) * 1000); how = o.fault === 'short' ? 'short' : 'par'; vTx = 0; }
  else { const r = C.loop2w({mA:txWant, R:R + 10, vs:o.vs, vmin:10.5}); I = r.mA; vTx = r.vTx; if (r.limited) how = 'lowv'; }
  const st = C.namur(I);
  /* Siemens-style raw counts: 4 mA → 0, 20 mA → 27648, overflow 32767 */
  const raw = st === 'fail-low' ? 32767 : Math.min(32511, Math.round((I - 4) / 16 * 27648));
  return {I, how, st, vTx, vR:I / 1000 * R, raw, pv:C.mA2pv(I, lrv, urv), txWant};
};
IL.loopSim = function(host, opt){
  opt = opt || {}; const L = opt.lesson, g = U('ls');
  const S = {p:5, vs:24, fault:'', meter:'series', seen:new Set()};
  const FAULTS = [['cut', 'Cut a wire'], ['short', 'Short in the cable'], ['rev', 'Reverse polarity'], ['fail', 'Failed transmitter']];
  host.innerHTML = `<div class="wd-art"><svg viewBox="0 0 360 300" role="img" aria-label="A 4–20 mA loop: 24 V power supply, pressure transmitter, multimeter and PLC analog card">${ART.defs(g)}
    <g class="ls-w"></g>
    <g transform="translate(6 96)"><rect x="0" y="0" width="68" height="104" rx="5" fill="#d7dde1" stroke="#5d6469" stroke-width="1.2"/><rect x="6" y="6" width="56" height="12" rx="2" fill="#3a4248"/>${screw(20, 12, 3.5)}${screw(48, 12, 3.5)}<rect x="6" y="86" width="56" height="12" rx="2" fill="#3a4248"/>${screw(20, 92, 3.5)}${screw(48, 92, 3.5)}
      <text x="34" y="44" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#1c2125" class="ls-vs">24V DC</text><text x="34" y="56" text-anchor="middle" style="font:600 7px var(--font-mono);fill:#3d464c">PSU</text><circle cx="16" cy="70" r="3" fill="#35d06a"/><text x="23" y="73" style="font:600 6.5px var(--font-mono);fill:#3d464c">DC OK</text>
      <text x="56" y="30" style="font:700 9px var(--font-mono);fill:#c0352b">+</text><text x="56" y="82" style="font:700 9px var(--font-mono);fill:#1f6fd1">−</text></g>
    <g transform="translate(232 0) scale(.62)">${ART.transmitter({g, lcd:'', unit:''})}</g>
    <text class="ls-lcd" x="269" y="27" text-anchor="middle" style="font:700 8px var(--font-mono);fill:#16210c">5.00</text><text x="269" y="34" text-anchor="middle" style="font:600 5px var(--font-mono);fill:#16210c">bar</text>
    <text x="226" y="46" text-anchor="end" style="font:700 10px var(--font-mono)" class="w-tx">PT-101</text><text x="226" y="58" text-anchor="end" style="font-size:9px" class="svg-ar w-mu">0–10 bar · 2-wire</text>
    <g transform="translate(130 222)"><rect x="0" y="0" width="100" height="70" rx="6" fill="url(#${g}d)" stroke="#111"/><text x="50" y="13" text-anchor="middle" style="font:700 8px var(--font-mono);fill:#e9edf0">PLC AI · CH0</text>
      <path d="M20 40h12l3-6 5 12 5-12 5 12 5-12 5 12 3-6h12" fill="none" stroke="#e9edf0" stroke-width="1.4"/><text x="50" y="62" text-anchor="middle" style="font:600 7px var(--font-mono);fill:#93a2ab">250 Ω</text>
      <circle class="ls-led" cx="88" cy="12" r="3.2" fill="#35d06a"/></g>
    <g class="ls-meter"></g>
    <g class="ls-flt"></g>
  </svg></div>
  <div class="read ls-read"></div>
  <div class="statline ls-st" aria-live="polite"></div>
  <div class="wd-ctl"><label>Actual pipe pressure: <b class="ls-pv"></b><input type="range" class="ls-p" min="-1" max="11.5" step="0.05" value="5" aria-label="Pressure"></label></div>
  <div class="chips-t"><button type="button" class="btn" data-vs="24" aria-pressed="true">24 V supply</button><button type="button" class="btn" data-vs="12" aria-pressed="false">12 V supply</button><button type="button" class="btn" data-mt="series" aria-pressed="true">Meter in series ✓</button><button type="button" class="btn" data-mt="par" aria-pressed="false">Meter in parallel ✗</button></div>
  <div class="flt" role="group" aria-label="Faults">${FAULTS.map(f => `<button type="button" class="btn" data-f="${f[0]}" aria-pressed="false">${f[1]}</button>`).join('')}</div>
  <p class="msg ls-msg" aria-live="polite"></p>
  <p class="chal ls-chal">Challenge: try the three faults <b>Cut a wire</b>, <b>Short in the cable</b> and <b>Reverse polarity</b> and see what the current and the PLC say in each one.</p>`;
  const q = s => $(s, host), fin = chal(host, '.ls-chal', L, 'sim');
  function wires(r){
    const sp = r.I > 0.05 ? Math.max(0.25, 3.2 - r.I / 10) : 0, fl = sp ? ` class="flow" style="--dur:${sp.toFixed(2)}s"` : '';
    const cut = S.fault === 'cut', rev = S.fault === 'rev';
    const red = rev ? '#1f6fd1' : '#d32f2f', blk = '#30363b', blu = rev ? '#d32f2f' : '#1f6fd1';
    const w = (d, c) => `<path d="${d}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/>${sp ? `<path d="${d}" fill="none" stroke="#ffe680" stroke-width="1.6" stroke-dasharray="3 9"${fl}/>` : ''}`;
    let s = w('M74 116H110V21H233', red);
    const par = S.meter === 'par';
    if (cut) s += w('M305 21H348V64', blk) + w(par ? 'M348 80V258H230' : 'M348 80V226', blk) + `<path d="M340 66l16 10M356 66l-16 10" stroke="var(--bad)" stroke-width="3"/>`;
    else s += w(par ? 'M305 21H348V258H230' : 'M305 21H348V226', blk);
    if (!par) s += w('M348 226H300Q276 226 276 206', blk) + w('M308 206V258H230', blk);
    s += w('M130 258H110V178H74', blu);
    if (S.fault === 'short') s += `<path d="M200 21V70L208 76L200 82L208 88L200 94L208 100L200 106V118H348" fill="none" stroke="#ffb000" stroke-width="3"/><text x="194" y="100" text-anchor="end" class="svg-ar" style="font-size:10px;font-weight:700;fill:var(--warn)">Short in the cable</text>`;
    if (rev) s += `<text x="190" y="14" text-anchor="middle" class="svg-ar" style="font-size:10px;font-weight:700;fill:var(--bad)">+ and − swapped</text>`;
    q('.ls-w').innerHTML = s;
  }
  function meter(r){
    const v = fmt(r.I, 2), par = S.meter === 'par';
    const box = `<rect x="0" y="0" width="64" height="74" rx="8" fill="#f2b705" stroke="#6b5200"/><rect x="5" y="5" width="54" height="22" rx="3" fill="#c7d3b4"/><text x="54" y="22" text-anchor="end" style="font:700 12px var(--font-mono);fill:#1b2410">${v}</text><text x="8" y="36" style="font:700 7px var(--font-mono);fill:#3b2d00">mA DC</text><circle cx="32" cy="50" r="10" fill="#2a3035"/><path d="M32 50l-6-6" stroke="#f2b705" stroke-width="2"/><circle cx="16" cy="66" r="4" fill="#d32f2f"/><circle cx="48" cy="66" r="4" fill="#1c2125"/>`;
    if (!par) q('.ls-meter').innerHTML = `<g transform="translate(260 136)">${box}</g>`;
    else q('.ls-meter').innerHTML = `<g transform="translate(260 136)">${box}</g><path d="M276 206C250 230 180 140 180 21" fill="none" stroke="#d32f2f" stroke-width="2.4"/><path d="M308 206C330 220 348 140 348 110" fill="none" stroke="#1c2125" stroke-width="2.4"/><circle cx="180" cy="21" r="4" fill="#d32f2f"/><circle cx="348" cy="110" r="4" fill="#1c2125"/>`;
  }
  function ui(){
    const r = C.loopSim({p:S.p, vs:S.vs, fault:S.fault, meter:S.meter});
    wires(r); meter(r);
    q('.ls-vs').textContent = S.vs + 'V DC';
    q('.ls-lcd').textContent = S.fault === 'fail' ? 'FAIL' : (S.fault === 'cut' || S.fault === 'rev' || S.fault === 'short' || S.meter === 'par') ? '' : fmt(clamp(S.p, -0.5, 10.4), 2);
    q('.ls-pv').textContent = fmt(S.p, 2) + ' bar';
    const plc = r.st === 'fail-low' ? '<b class="bad">Wire break</b>' : r.st === 'fail-high' ? '<b class="bad">Overrange</b>' : `<b>${fmt(r.pv, 2)} bar</b>`;
    q('.ls-read').innerHTML = `<div><span>Multimeter (mA)</span><b>${fmt(r.I, 2)} mA</b></div><div><span>PLC reading</span>${plc}</div><div><span>Raw value in the PLC</span><b>${r.raw}</b></div><div><span>Voltage across 250Ω</span><b>${fmt(r.vR, 2)} V</b></div><div><span>Percent of range</span><b>${fmt(C.mA2pct(r.I), 1)} %</b></div><div><span>Voltage at the transmitter</span><b class="${r.vTx < 10.5 && r.how === 'lowv' ? 'bad' : ''}">${fmt(r.vTx, 1)} V</b></div>`;
    const led = q('.ls-led'); led.setAttribute('fill', r.st === 'ok' ? '#35d06a' : '#ff3b30');
    const st = q('.ls-st'), stat = {ok:['ok', 'Signal healthy (3.8–20.5 mA)'], under:['warn', 'Under range (3.6–3.8 mA)'], over:['warn', 'Over range (20.5–21 mA)'], 'fail-low':['bad', 'Below 3.6 mA: fault / broken wire'], 'fail-high':['bad', 'Above 21 mA: fault / short']}[r.st];
    st.className = 'statline ls-st ' + stat[0]; st.innerHTML = `<b>NAMUR NE43:</b> ${stat[1]}`;
    const M = {
      ok:`Pressure ${fmt(S.p, 2)} bar ⇒ <span class="eq">4 + ${fmt(S.p, 2)}/10 × 16 = ${fmt(r.I, 2)} mA</span>. The same current flows everywhere in the loop, so a meter anywhere in series reads the same number.`,
      cut:'<b>Wire cut ⇒ 0 mA.</b> No circuit, no current. The PLC sees less than 3.6 mA and reports <b>Wire break</b>. With a 0–20 mA signal it would read "zero pressure" and never know there was a fault. That is the secret of the 4 mA!',
      rev:'<b>Polarity reversed ⇒ 0 mA.</b> Most transmitters have a protection diode that blocks the current when reversed, so the device does not burn, but the loop is dead and the PLC reports Wire break. Measure the voltage at the transmitter terminals: you will find <b>−24V</b>.',
      short:'<b>Short between the two wires ⇒ the current shoots up</b> because the transmitter is bypassed and the supply sees only the 250Ω (24 ÷ 250 = 96 mA!). The card protection or fuse limits it and the PLC reports <b>Overrange</b>. The reading no longer follows the pressure.',
      fail:'<b>The transmitter ran its internal diagnostics and found a fault</b> (a failed sensor, for example), so it drives an alarm current of <b>21.75 mA</b> (fail high) per NAMUR. Some devices are set to fail low (3.6 mA). The PLC knows it is a fault, not a reading.',
      par:'<b>Wrong! A meter on mA has a very low resistance</b>, so in parallel with the transmitter it shorts it out. The current rises, the PLC sees Overrange, the reading stops following the pressure, and the meter fuse may blow. <b>Measure mA in series</b>: open the loop and put the meter in the path.',
      lowv:`<b>Not enough voltage!</b> The transmitter needs about <b>10.5V</b> at its terminals to work. On 12V with 250Ω + the meter, the maximum current = <span class="eq">(12 − 10.5) ÷ 260 ≈ 5.8 mA</span>. That is why the reading is "stuck" and won't rise. This is a real fault when someone fits a weak supply or adds loop resistance (HART or another indicator).`
    };
    const m = q('.ls-msg'); m.innerHTML = M[r.how]; m.className = 'msg ls-msg ' + (r.how === 'ok' ? '' : 'bad');
    $$('[data-f]', host).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === S.fault)));
    $$('[data-vs]', host).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.vs === S.vs)));
    $$('[data-mt]', host).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mt === S.meter)));
    if (S.fault) S.seen.add(S.fault);
    if (['cut', 'short', 'rev'].every(f => S.seen.has(f))) fin();
    return r;
  }
  q('.ls-p').addEventListener('input', e => { S.p = +e.target.value; ui(); });
  onAct(host, '[data-f]', b => { S.fault = S.fault === b.dataset.f ? '' : b.dataset.f; ui(); });
  onAct(host, '[data-vs]', b => { S.vs = +b.dataset.vs; ui(); });
  onAct(host, '[data-mt]', b => { S.meter = b.dataset.mt; ui(); });
  ui();
  return {S, ui, set(o){ Object.assign(S, o); return ui(); }};
};

/* ================= L2: scaling drill + calculator ================= */
IL.RANGES = [[0, 10, 'bar', 'pressure'], [0, 16, 'bar', 'pressure'], [-1, 9, 'bar', 'pressure'], [0, 150, '°C', 'temperature'], [-50, 150, '°C', 'temperature'], [0, 400, '°C', 'temperature'], [0, 4, 'm', 'level'], [0, 600, 'kg', 'weight'], [0, 250, 'm³/h', 'flow'], [0, 1500, 'rpm', 'speed']];
IL.scaleGen = function(){
  const [lrv, urv, u, what] = pick(IL.RANGES), span = urv - lrv;
  if (Math.random() < 0.5){
    const mA = Math.round((4 + Math.random() * 16) * 4) / 4, pv = C.mA2pv(mA, lrv, urv);
    return {input:true, unit:u, q:`A ${what} transmitter with range <span class="eq">${lrv} … ${urv} ${u}</span>. The meter reads <b class="eq">${fmt(mA, 2)} mA</b>. What is the value?`, check:v => Math.abs(v - pv) <= span * 0.006, ans:fmt(pv, 2) + ' ' + u, why:`<span class="eq">PV = ${lrv} + (${fmt(mA, 2)} − 4) ÷ 16 × ${span} = ${fmt(pv, 2)}</span>`};
  }
  const pv = lrv + Math.round(Math.random() * 20) / 20 * span, mA = C.pv2mA(pv, lrv, urv);
  return {input:true, unit:'mA', q:`A ${what} transmitter with range <span class="eq">${lrv} … ${urv} ${u}</span>. The actual value is <b class="eq">${fmt(pv, 2)} ${u}</b>. What should the output be in mA?`, check:v => Math.abs(v - mA) <= 0.06, ans:fmt(mA, 2) + ' mA', why:`<span class="eq">mA = 4 + (${fmt(pv, 2)} − ${lrv}) ÷ ${span} × 16 = ${fmt(mA, 2)}</span>`};
};
IL.scaleCalc = function(host){
  host.innerHTML = `<div class="wd-ctl"><label style="flex:1 1 30%">LRV <input type="number" class="sc-l" value="0" step="any"></label><label style="flex:1 1 30%">URV <input type="number" class="sc-u" value="10" step="any"></label></div>
  <div class="wd-ctl"><label style="flex:1 1 45%">mA <input type="number" class="sc-m" value="12" step="any"></label><label style="flex:1 1 45%">Value PV <input type="number" class="sc-p" value="5" step="any"></label></div><p class="msg sc-msg" aria-live="polite"></p>`;
  const q = s => $(s, host);
  function from(which){
    const l = num(q('.sc-l').value), u = num(q('.sc-u').value);
    if (!isFinite(l) || !isFinite(u) || u === l){ q('.sc-msg').textContent = 'Enter a valid LRV and URV.'; return; }
    if (which === 'm'){ const m = num(q('.sc-m').value); if (isFinite(m)) q('.sc-p').value = +fmt(C.mA2pv(m, l, u), 3); }
    else { const p = num(q('.sc-p').value); if (isFinite(p)) q('.sc-m').value = +fmt(C.pv2mA(p, l, u), 3); }
    const m = num(q('.sc-m').value); q('.sc-msg').innerHTML = `Percent of range: <b class="eq">${fmt(C.mA2pct(m), 1)} %</b> · Voltage across 250Ω: <b class="eq">${fmt(m * 0.25, 2)} V</b> · NAMUR: <b class="eq">${C.namur(m)}</b>`;
  }
  host.addEventListener('input', e => from(e.target.classList.contains('sc-p') ? 'p' : 'm'));
  from('m');
};

/* ================= L3: 3-wire PNP / NPN sensor → PLC input bench ================= */
C.MAT = {steel:[1, 'Mild steel (St 37)'], ss:[0.75, 'Stainless steel'], brass:[0.5, 'Brass'], al:[0.4, 'Aluminium'], cu:[0.3, 'Copper'], plastic:[0, 'Plastic']};
/* electrical evaluation of the bench. wires: [[a,b],...], terminals: P(+24) N(0V) BN BU BK COM I0 I1 */
C.diEval = function(wires, sensor, card, detected){
  const p = {}, f = x => { if (p[x] == null) p[x] = x; while (p[x] !== x){ p[x] = p[p[x]]; x = p[x]; } return x; };
  ['P', 'N', 'BN', 'BU', 'BK', 'COM', 'I0', 'I1'].forEach(f);
  wires.forEach(([a, b]) => { const A = f(a), B = f(b); if (A !== B) p[A] = B; });
  const P = f('P'), N = f('N'), r = {short:P === N, powered:false, reversed:false, out:false, outShort:false, led:false, I1:false};
  if (r.short) return r;
  r.powered = f('BN') === P && f('BU') === N; r.reversed = f('BN') === N && f('BU') === P;
  r.out = r.powered && detected;
  const V = {}; V[P] = 24; V[N] = 0;
  const bk = f('BK');
  if (r.out){ const want = sensor === 'PNP' ? 24 : 0; if (V[bk] != null && V[bk] !== want) r.outShort = true; else V[bk] = want; }
  const vc = V[f('COM')], vi = V[f('I0')], v1 = V[f('I1')];
  const on = vin => card === 'sink' ? vc === 0 && vin === 24 : vc === 24 && vin === 0;
  r.led = !r.outShort && on(vi); r.I1 = on(v1);
  r.net = {bkOnI0:f('BK') === f('I0'), comP:f('COM') === P, comN:f('COM') === N, i0P:f('I0') === P, i0N:f('I0') === N};
  return r;
};
C.diCheck = function(wires, sensor, card){
  const a = C.diEval(wires, sensor, card, true), b = C.diEval(wires, sensor, card, false), bad = [];
  if (a.short) return {pass:false, bad:['<b>Short circuit!</b> +24V is wired straight to 0V. The power supply will trip or the fuse will blow.']};
  if (a.reversed) bad.push('<b>The sensor is wired backwards:</b> brown goes to +24V and blue to 0V. Most sensors are protected so it will not burn, but it will not work.');
  else if (!a.powered) bad.push('The sensor <b>has no power</b>: <b>brown BN to +24V</b> and <b>blue BU to 0V</b>.');
  if (a.outShort) bad.push(`<b>The sensor output is shorted:</b> the black wire ${sensor === 'PNP' ? 'switches +24V and you wired it to 0V' : 'pulls to 0V and you wired it to +24V'}. The sensor goes into short-circuit protection (its LED flashes).`);
  const wantCom = card === 'sink' ? 'N' : 'P';
  if (!a.net.comP && !a.net.comN) bad.push(`The card's <b>COM</b> terminal is not connected. On this card COM must go to <b>${wantCom === 'N' ? '0V' : '+24V'}</b>.`);
  else if ((wantCom === 'N' && a.net.comP) || (wantCom === 'P' && a.net.comN)) bad.push(`COM is wired to ${a.net.comP ? '+24V' : '0V'}, but this card is ${card === 'sink' ? '<b>sinking</b> (the input receives +24V), so its COM goes to <b>0V</b>' : '<b>sourcing</b> (the input is pulled to 0V), so its COM goes to <b>+24V</b>'}.`);
  if (a.net.i0P || a.net.i0N) bad.push('Input <b>I0.0</b> is wired straight to the supply, so it stays fixed whatever the sensor does. The input must come from <b>the black wire BK</b>.');
  else if (!a.net.bkOnI0) bad.push('<b>The black wire BK</b> (sensor output) must go to PLC input <b>I0.0</b>.');
  if (!bad.length && !(a.led && !b.led)) bad.push(sensor === 'PNP' && card === 'source' ? 'A <b>PNP</b> sensor switches +24V, but a sourcing card needs something to pull the input to 0V, so the LED will never light. They must match: PNP with sinking, NPN with sourcing.' : 'The input LED does not follow the sensor. Check the wiring.');
  return {pass:!bad.length, bad, on:a, off:b};
};
IL.diBench = function(host, opt){
  const L = opt.lesson, g = U('di');
  const S = {ex:0, wires:[], pend:null, d:14, mat:'steel', det:false};
  const ex = () => opt.exercises[S.ex];
  const T = {P:[48, 66, '+24V'], N:[98, 66, '0V'], COM:[262, 172, 'COM'], I0:[262, 92, 'I0.0'], I1:[262, 128, 'I0.1'], BN:[200, 214, 'BN'], BK:[236, 214, 'BK'], BU:[164, 214, 'BU']};
  const COL = {BN:'#7a4a22', BU:'#1f6fd1', BK:'#1d1d1d', P:'#d32f2f', N:'#1f6fd1'};
  const load = () => { const w = IL.store.get('di/' + ex().key); S.wires = Array.isArray(w) ? w.filter(x => Array.isArray(x) && T[x[0]] && T[x[1]]) : []; };
  const save = () => IL.store.set('di/' + ex().key, S.wires);
  host.innerHTML = `<div class="tabs" role="group" aria-label="Exercise">${opt.exercises.map((e, i) => `<button type="button" class="btn" data-ex="${i}" aria-pressed="false">${e.title}</button>`).join('')}</div>
  <div class="box key di-task"></div>
  <div class="bn-board"><svg viewBox="0 0 360 330" role="group" aria-label="Bench for wiring a sensor to a PLC input card">${ART.defs(g)}
   <g transform="translate(10 8)"><rect x="0" y="0" width="130" height="74" rx="6" fill="#d7dde1" stroke="#5d6469" stroke-width="1.2"/><text x="65" y="20" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#1c2125">24V DC PSU</text><circle cx="118" cy="14" r="3" fill="#35d06a"/></g>
   <g transform="translate(244 8)"><rect x="0" y="0" width="108" height="186" rx="6" fill="url(#${g}d)" stroke="#111"/><rect x="6" y="6" width="96" height="20" rx="3" fill="#e9edf0"/><text x="54" y="20" text-anchor="middle" style="font:700 8.5px var(--font-mono);fill:#1c2125" class="di-cardt">DI 24V DC</text>
     <text x="40" y="52" style="font:600 8px var(--font-mono);fill:#c9d1d6">LED</text><circle class="di-led0" cx="80" cy="84" r="6" fill="#24402c"/><circle class="di-led1" cx="80" cy="120" r="6" fill="#24402c"/><text x="70" y="62" style="font:600 7px var(--font-mono);fill:#93a2ab" class="di-cardk"></text></g>
   <g class="di-sens"></g><g class="di-tgt"></g>
   <g class="di-w"></g><g class="di-t"></g>
  </svg></div>
  <div class="bn-tools"><button type="button" class="btn" data-b="undo">Undo</button><button type="button" class="btn" data-b="clr">Clear all</button><button type="button" class="btn pri" data-b="chk">Test wiring</button></div>
  <p class="msg di-msg" aria-live="polite">Tap a terminal, then another terminal to add a wire. Tap a wire to remove it.</p>
  <div class="wd-ctl"><label>Distance from the target to the sensor face: <b class="di-dv"></b><input type="range" class="di-d" min="0" max="20" step="0.5" value="14" aria-label="Distance in mm"></label>
   <label style="flex:1 1 100%">Material: <select class="inp di-mat">${Object.keys(C.MAT).map(k => `<option value="${k}">${C.MAT[k][1]}</option>`).join('')}</select></label></div>
  <div class="read sm"><div><span>Actual sensing distance Sn</span><b class="di-sn"></b></div><div><span>Target detected?</span><b class="di-det"></b></div><div><span>Black wire BK voltage</span><b class="di-vbk"></b></div><div><span>Input LED I0.0</span><b class="di-l"></b></div></div>
  <div class="bn-res di-res" aria-live="polite"></div>`;
  const q = s => $(s, host);
  const msg = (t, c) => { const m = q('.di-msg'); m.className = 'msg di-msg ' + (c || ''); m.innerHTML = t; };
  function snEff(){ return 8 * C.MAT[S.mat][0]; }
  function detect(){ const sn = snEff(); if (sn <= 0) S.det = false; else if (S.det){ if (S.d > sn * 1.1) S.det = false; } else if (S.d <= sn) S.det = true; }
  function draw(){
    const e = ex(), r = C.diEval(S.wires, e.sensor, e.card, S.det);
    /* sensor + cable */
    q('.di-sens').innerHTML = `<g transform="translate(96 262) scale(.9)">${ART.prox({g, on:r.out && !r.outShort, face:e.sensor === 'PNP' ? '#2f6fb3' : '#c46a00'})}</g>
      <text x="166" y="252" text-anchor="middle" style="font:700 9px var(--font-mono)" class="w-tx">M18 · ${e.sensor} · NO</text>
      <path d="M249 284C280 284 280 250 200 240" fill="none" stroke="#30363b" stroke-width="7" stroke-linecap="round"/>
      ${['BU', 'BN', 'BK'].map(k => `<path d="M200 240C200 232 ${T[k][0]} 232 ${T[k][0]} ${T[k][1] + 6}" fill="none" stroke="${COL[k]}" stroke-width="3.4"/>`).join('')}`;
    const tx = 96 - 3 - S.d * 4, col = {steel:'#8d979f', ss:'#c3cad0', brass:'#c9a43a', al:'#d4d9dd', cu:'#c46a3a', plastic:'#e6e1d1'}[S.mat];
    q('.di-tgt').innerHTML = `<rect x="${tx - 16}" y="258" width="16" height="46" rx="2" fill="${col}" stroke="#5d6469"/><path d="M${tx - 22} 281H${tx - 16}" stroke="#5d6469" stroke-width="3"/>
      ${snEff() > 0 ? `<path d="M${96 - 3 - snEff() * 4} 252V312" stroke="var(--accent)" stroke-dasharray="4 3" stroke-width="1.4"/><text x="${96 - 3 - snEff() * 4}" y="324" text-anchor="middle" style="font:600 9px var(--font-mono)" class="w-ac">Sn</text>` : ''}`;
    /* wires */
    q('.di-w').innerHTML = S.wires.map((w, i) => { const a = T[w[0]], b = T[w[1]], c = COL[w[0]] || COL[w[1]] || (w.includes('COM') ? '#7a3fb0' : '#444'); const my = Math.max(a[1], b[1]) + 30; const d = `M${a[0]} ${a[1]}C${a[0]} ${my} ${b[0]} ${my} ${b[0]} ${b[1]}`; return `<g class="bw" data-w="${i}"><path class="bw-o" d="${d}"/><path class="bw-c" d="${d}" stroke="${c}"/><path class="bw-hit" d="${d}" tabindex="0" role="button" aria-label="Remove the wire from ${a[2]} to ${b[2]}"/></g>`; }).join('');
    q('.di-t').innerHTML = Object.keys(T).map(k => { const [x, y, lab] = T[k]; const pend = S.pend === k; return `<g class="bt${pend ? ' pend' : ''}"><circle class="bt-s" cx="${x}" cy="${y}" r="8"/><path class="bt-x" d="M${x - 4} ${y}h8"/><circle class="bt-hit" data-t="${k}" cx="${x}" cy="${y}" r="16" tabindex="0" role="button" aria-label="Terminal ${lab}"/><circle class="bt-ring" cx="${x}" cy="${y}" r="12"/><text class="bt-lab" x="${x}" y="${['BN', 'BK', 'BU'].includes(k) ? y + 24 : (k === 'P' || k === 'N') ? y - 14 : y + 4}" ${['COM', 'I0', 'I1'].includes(k) ? `text-anchor="end" dx="-14"` : ''}>${lab}</text></g>`; }).join('');
    q('.di-led0').setAttribute('fill', r.led ? '#3dff6e' : '#24402c'); q('.di-led0').style.filter = r.led ? 'drop-shadow(0 0 5px #3dff6e)' : '';
    q('.di-led1').setAttribute('fill', r.I1 ? '#3dff6e' : '#24402c');
    q('.di-cardt').textContent = e.card === 'sink' ? 'DI · SINK (PNP)' : 'DI · SOURCE (NPN)';
    q('.di-cardk').textContent = e.card === 'sink' ? 'COM → 0V' : 'COM → +24V';
    q('.di-dv').textContent = fmt(S.d, 1) + ' mm'; q('.di-sn').textContent = snEff() ? fmt(snEff(), 1) + ' mm' : 'Not detected';
    q('.di-det').textContent = S.det ? 'Yes' : 'No'; q('.di-det').classList.toggle('ok', S.det);
    const bk = r.out && !r.outShort ? (e.sensor === 'PNP' ? '24 V' : '0 V') : (r.powered ? 'Open (OFF)' : '—');
    q('.di-vbk').textContent = bk; q('.di-l').textContent = r.led ? 'ON' : 'OFF'; q('.di-l').classList.toggle('ok', r.led);
    $$('[data-ex]', host).forEach((b, i) => { b.setAttribute('aria-pressed', String(i === S.ex)); b.classList.toggle('done', IL.has(L, opt.exercises[i].key)); });
    q('.di-task').innerHTML = e.task;
    return r;
  }
  function tapT(k){
    if (!S.pend){ S.pend = k; msg(`You picked <b>${T[k][2]}</b>. Now tap the other terminal.`); draw(); return; }
    if (S.pend === k){ S.pend = null; msg('Cancelled.'); draw(); return; }
    const w = [S.pend, k]; S.pend = null;
    if (S.wires.some(x => (x[0] === w[0] && x[1] === w[1]) || (x[0] === w[1] && x[1] === w[0]))){ msg('That wire is already there.'); draw(); return; }
    S.wires.push(w); save(); q('.di-res').innerHTML = ''; msg(`Wire from <b>${T[w[0]][2]}</b> to <b>${T[w[1]][2]}</b>. Carry on or tap "Test wiring".`); draw();
  }
  function check(){
    const e = ex(), res = C.diCheck(S.wires, e.sensor, e.card);
    if (res.pass){
      q('.di-res').innerHTML = `<div class="bn-ok"><b>Done! The wiring is correct.</b> ${e.ok} Move the target towards the sensor with the slider and watch the I0.0 LED.</div>`;
      IL.mark(L, e.key); draw();
    } else q('.di-res').innerHTML = `<div class="bn-bad"><b>Still a problem:</b><ul>${res.bad.map(b => `<li>${b}</li>`).join('')}</ul></div>`;
    return res;
  }
  onAct(host, '[data-t]', t => tapT(t.dataset.t));
  onAct(host, '[data-w]', t => { const i = +t.closest('[data-w]').dataset.w; S.wires.splice(i, 1); save(); msg('Wire removed.'); draw(); });
  onAct(host, '[data-b]', b => { const k = b.dataset.b; if (k === 'undo'){ S.wires.pop(); save(); draw(); } else if (k === 'clr'){ S.wires = []; S.pend = null; save(); q('.di-res').innerHTML = ''; draw(); } else check(); });
  onAct(host, '[data-ex]', b => { S.ex = +b.dataset.ex; S.pend = null; load(); q('.di-res').innerHTML = ''; draw(); });
  q('.di-d').addEventListener('input', e => { S.d = +e.target.value; detect(); draw(); });
  q('.di-mat').addEventListener('change', e => { S.mat = e.target.value; detect(); draw(); });
  load(); detect(); draw();
  return {S, check, draw, setWires(w){ S.wires = w; save(); return draw(); }, tab(i){ S.ex = i; load(); draw(); }, dist(d){ S.d = d; detect(); return draw(); }};
};

/* ================= L4: incremental encoder (disc + scope + counter) ================= */
function sector(cx, cy, r0, r1, a0, a1){ /* annular sector, angles in degrees clockwise from 12 o'clock */
  const P = (r, a) => { const t = (a - 90) * Math.PI / 180; return (cx + r * Math.cos(t)).toFixed(2) + ' ' + (cy + r * Math.sin(t)).toFixed(2); };
  const big = a1 - a0 > 180 ? 1 : 0;
  return `M${P(r1, a0)}A${r1} ${r1} 0 ${big} 1 ${P(r1, a1)}L${P(r0, a1)}A${r0} ${r0} 0 ${big} 0 ${P(r0, a0)}Z`;
}
IL.sector = sector;
/* a static A/B(/Z) scope picture for drills: lead = 'A' or 'B' */
IL.scopeSVG = function(lead, cycles, withZ){
  const W = 340, H = withZ ? 130 : 96, X0 = 30, X1 = 332, n = 400; cycles = cycles || 3;
  const tr = (fn, y0) => { let d = '', prev = null; for (let i = 0; i <= n; i++){ const x = X0 + (X1 - X0) * i / n, v = fn(i / n * cycles); const y = y0 - v * 22; if (prev !== null && prev !== y) d += `L${x.toFixed(1)} ${prev}`; d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y; prev = y; } return d; };
  const A = t => C.encAB(lead === 'A' ? t + 0.1 : -t + 0.1).A, B = t => C.encAB(lead === 'A' ? t + 0.1 : -t + 0.1).B;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Scope screen showing channels A and B"><rect x="${X0 - 4}" y="2" width="${X1 - X0 + 8}" height="${H - 4}" rx="6" fill="#08130e"/>`;
  s += `<path d="${tr(A, 40)}" fill="none" stroke="#ffd23f" stroke-width="2.4"/><path d="${tr(B, 84)}" fill="none" stroke="#3fd0ff" stroke-width="2.4"/>`;
  s += `<text x="${X0 - 8}" y="34" text-anchor="end" style="font:700 11px var(--font-mono);fill:#ffd23f">A</text><text x="${X0 - 8}" y="78" text-anchor="end" style="font:700 11px var(--font-mono);fill:#3fd0ff">B</text>`;
  s += `<text x="${X1}" y="${H - 6}" text-anchor="end" style="font:600 9px var(--font-mono);fill:#7aa08e">time →</text></svg>`;
  return s;
};
IL.encoder = function(host, opt){
  opt = opt || {}; const L = opt.lesson, N = 16, g = U('en');
  const S = {p:0.1, ref:0.1, rpm:12, dir:1, run:true, m:4, hist:[], lastP:0.1, meas:0, mAcc:0, mCnt:0, seen:{cw:false, ccw:false, x4:false, x1:false}};
  const P = 360 / N;
  let slots = '', zs = sector(110, 110, 52, 64, 360 - P / 4, 360);
  for (let k = 0; k < N; k++) slots += sector(110, 110, 76, 96, k * P - P / 2, k * P);
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg viewBox="0 -16 360 246" role="img" aria-label="The encoder disc turning, with sensors A, B and Z">
   <defs><radialGradient id="${g}l" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c0"/><stop offset="1" stop-color="#ffd23f" stop-opacity=".2"/></radialGradient><linearGradient id="${g}d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b656c"/><stop offset=".5" stop-color="#9aa4ac"/><stop offset="1" stop-color="#4a535a"/></linearGradient></defs>
   <circle cx="110" cy="110" r="100" fill="url(#${g}l)"/>
   <g class="en-disc"><path fill-rule="evenodd" d="M110 10a100 100 0 1 0 .01 0Z ${slots} ${zs}" fill="url(#${g}d)" stroke="#2a3035" stroke-width="1"/><circle cx="110" cy="110" r="22" fill="#2a3035"/><circle cx="110" cy="110" r="8" fill="#c3cad0"/><path d="M110 102V96" stroke="#c3cad0" stroke-width="3"/></g>
   <g class="en-heads"></g>
   <rect x="232" y="16" width="120" height="196" rx="10" fill="#1d2328" stroke="#0f1215"/>
   <text x="292" y="36" text-anchor="middle" style="font:700 9px var(--font-mono);fill:#93a2ab">COUNTER</text>
   <text class="en-cnt" x="342" y="66" text-anchor="end" style="font:700 22px var(--font-mono);fill:#4dff88">0</text>
   <text x="242" y="90" style="font:600 8px var(--font-mono);fill:#93a2ab">MODE</text><text class="en-mode" x="342" y="90" text-anchor="end" style="font:700 10px var(--font-mono);fill:#ffd23f">x4</text>
   <text x="242" y="110" style="font:600 8px var(--font-mono);fill:#93a2ab">DIR</text><text class="en-dir" x="342" y="110" text-anchor="end" style="font:700 10px var(--font-mono);fill:#3fd0ff">CW</text>
   <text x="242" y="130" style="font:600 8px var(--font-mono);fill:#93a2ab">REV (Z)</text><text class="en-rev" x="342" y="130" text-anchor="end" style="font:700 10px var(--font-mono);fill:#ff6bd6">0</text>
   <text x="242" y="150" style="font:600 8px var(--font-mono);fill:#93a2ab">ANGLE</text><text class="en-ang" x="342" y="150" text-anchor="end" style="font:700 10px var(--font-mono);fill:#e9edf0">0°</text>
   <text x="242" y="170" style="font:600 8px var(--font-mono);fill:#93a2ab">SPEED</text><text class="en-rpm" x="342" y="170" text-anchor="end" style="font:700 10px var(--font-mono);fill:#e9edf0">0 rpm</text>
   <text x="242" y="198" style="font:600 7.5px var(--font-mono);fill:#5f6d75">PPR = ${N} (demo disc)</text>
  </svg></div>
  <div class="mm-side">
   <div class="wd-art"><svg class="en-scope" viewBox="0 0 360 150" role="img" aria-label="Scope: channels A, B and Z over time"></svg></div>
   <div class="tabs" role="group" aria-label="Counting mode">${[1, 2, 4].map(m => `<button type="button" class="btn" data-m="${m}" aria-pressed="${m === 4}">x${m}</button>`).join('')}</div>
  </div></div>
  <div class="wd-ctl"><label>Speed: <b class="en-sv"></b><input type="range" class="en-s" min="0" max="30" step="1" value="12" aria-label="Speed rpm"></label>
   <button type="button" class="btn" data-d="1" aria-pressed="true">↻ Clockwise CW</button><button type="button" class="btn" data-d="-1" aria-pressed="false">↺ Counter-clockwise CCW</button></div>
  <div class="wd-ctl"><button type="button" class="btn en-run">Pause ⏸</button><button type="button" class="btn" data-st="-1">◀ Quarter-pulse step</button><button type="button" class="btn" data-st="1">Quarter-pulse step ▶</button><button type="button" class="btn en-rst">Reset counter</button></div>
  <p class="msg en-msg" aria-live="polite"></p>
  <p class="chal en-chal">Challenge: turn the encoder <b>both ways</b>, and try <b>x1</b> and <b>x4</b> counting to see how much faster the counter counts in the same turn.</p>`;
  const q = s => $(s, host), fin = chal(host, '.en-chal', L, 'enc');
  const heads = () => { /* fixed read heads: A at 0°, B at 2.25 pitch, Z on the inner track at 0° */
    const s = C.encAB(S.p), z = C.encZ(S.p, N), pos = (r, a) => { const t = (a - 90) * Math.PI / 180; return [110 + r * Math.cos(t), 110 + r * Math.sin(t)]; };
    const h = (r, a, on, col, lab) => { const [x, y] = pos(r, a); const [lx, ly] = pos(r + 26, a); return `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2" transform="rotate(${a} ${x} ${y})" fill="${on ? col : '#2a3035'}" stroke="${col}" stroke-width="1.5"${on ? ` style="filter:drop-shadow(0 0 5px ${col})"` : ''}/><text x="${lx}" y="${ly + 4}" text-anchor="middle" style="font:700 11px var(--font-mono);fill:${col}">${lab}</text>`; };
    q('.en-heads').innerHTML = h(86, 0, s.A, '#e0b000', 'A') + h(86, 2.25 * P, s.B, '#1fa8d8', 'B') + h(58, 0, z, '#d63fb0', 'Z');
  };
  function scope(){
    const X0 = 26, X1 = 352, n = S.hist.length, rows = [[0, 'A', '#ffd23f', 30], [1, 'B', '#3fd0ff', 78], [2, 'Z', '#ff6bd6', 126]];
    let s = `<rect x="${X0 - 4}" y="4" width="${X1 - X0 + 8}" height="142" rx="6" fill="#08130e"/>`;
    for (let i = 1; i < 10; i++) s += `<line x1="${X0 + (X1 - X0) * i / 10}" x2="${X0 + (X1 - X0) * i / 10}" y1="6" y2="144" stroke="#1f3a2f" stroke-width=".6"/>`;
    rows.forEach(([k, lab, col, y0]) => {
      let d = '', prev = null;
      S.hist.forEach((h, i) => { const x = (X1 - (n - 1 - i) / 179 * (X1 - X0)).toFixed(1), y = y0 - h[k] * 20; if (prev !== null && prev !== y) d += `L${x} ${prev}`; d += (d ? 'L' : 'M') + x + ' ' + y; prev = y; });
      s += `<path d="${d}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round"/><text x="${X0 - 8}" y="${y0 - 6}" text-anchor="end" style="font:700 11px var(--font-mono);fill:${col}">${lab}</text>`;
    });
    q('.en-scope').innerHTML = s;
  }
  function ui(){
    q('.en-disc').setAttribute('transform', `rotate(${(S.p / N * 360).toFixed(2)} 110 110)`);
    heads();
    const cnt = C.encCount(S.p, S.m) - C.encCount(S.ref, S.m);
    q('.en-cnt').textContent = cnt; q('.en-mode').textContent = 'x' + S.m;
    q('.en-dir').textContent = !S.run || S.rpm === 0 ? (S.lastDir > 0 ? 'CW' : S.lastDir < 0 ? 'CCW' : '—') : (S.dir > 0 ? 'CW' : 'CCW');
    q('.en-rev').textContent = Math.floor(S.p / N); q('.en-ang').textContent = fmt(((S.p / N * 360) % 360 + 360) % 360, 1) + '°';
    q('.en-rpm').textContent = fmt(S.meas, 1) + ' rpm';
    q('.en-sv').textContent = S.rpm + ' rpm';
    q('.en-run').textContent = S.run ? 'Pause ⏸' : 'Run ▶';
    $$('[data-m]', host).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.m === S.m)));
    $$('[data-d]', host).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.d === S.dir)));
    const ab = C.encAB(S.p), f = C.encFreq(N, S.run ? S.rpm : 0);
    q('.en-msg').innerHTML = `A = <b>${ab.A}</b> · B = <b>${ab.B}</b> · ${S.dir > 0 ? '<b>A leads B</b> by a quarter pulse (90°) ⇒ <b>CW</b>' : '<b>B leads A</b> ⇒ <b>CCW</b> and the counter counts down'} · A frequency = <span class="eq">${N} × ${S.run ? S.rpm : 0} ÷ 60 = ${fmt(f, 1)} Hz</span> · each pulse = <b>${S.m}</b> counts in x${S.m}.`;
    if (S.seen.cw && S.seen.ccw && S.seen.x4 && S.seen.x1) fin();
  }
  function move(dp){ const p0 = S.p; S.p += dp; if (dp) S.lastDir = Math.sign(dp); if (dp > 0) S.seen.cw = true; if (dp < 0) S.seen.ccw = true; S.seen['x' + S.m] = true; return p0; }
  let tick = 0;
  function frame(dt){
    const v = S.run ? S.dir * S.rpm / 60 * N : 0; /* pulses per second */
    const sub = 4;
    for (let k = 0; k < sub; k++){ move(v * dt / sub); }
    const ab = C.encAB(S.p); S.hist.push([ab.A, ab.B, C.encZ(S.p, N)]); if (S.hist.length > 180) S.hist.shift();
    S.mAcc += dt; if (S.mAcc >= 0.5){ const c = C.encCount(S.p, S.m) - C.encCount(S.lastP, S.m); S.meas = Math.abs(C.encRpm(c, S.m, N, S.mAcc)); S.lastP = S.p; S.mAcc = 0; }
    if (++tick % 2 === 0) scope();
    ui();
  }
  q('.en-s').addEventListener('input', e => { S.rpm = +e.target.value; ui(); });
  onAct(host, '[data-d]', b => { S.dir = +b.dataset.d; S.run = true; ui(); });
  onAct(host, '[data-m]', b => { S.m = +b.dataset.m; S.seen['x' + S.m] = true; ui(); });
  q('.en-run').addEventListener('click', () => { S.run = !S.run; ui(); });
  onAct(host, '[data-st]', b => { S.run = false; move(+b.dataset.st * 0.25); const ab = C.encAB(S.p); S.hist.push([ab.A, ab.B, C.encZ(S.p, N)]); if (S.hist.length > 180) S.hist.shift(); scope(); ui(); });
  q('.en-rst').addEventListener('click', () => { S.ref = S.p; ui(); });
  for (let k = 0; k < 180; k++) S.hist.push([C.encAB(S.p).A, C.encAB(S.p).B, 0]);
  scope(); ui();
  animate(host, frame);
  return {S, ui, count: () => C.encCount(S.p, S.m) - C.encCount(S.ref, S.m)};
};

/* ================= L4: encoder drill ================= */
IL.encGen = function(){
  const t = Math.floor(Math.random() * 5);
  if (t === 0){
    const lead = Math.random() < 0.5 ? 'A' : 'B';
    return {q:`This encoder is set so that <b>A leads B = CW</b>. The scope shows:${IL.scopeSVG(lead, 3)}Which way is the shaft turning?`, o:['CW (clockwise)', 'CCW (counter-clockwise)', 'Stopped', 'Cannot tell'], a:lead === 'A' ? 0 : 1,
      why:lead === 'A' ? 'A rises first, then B a quarter pulse later ⇒ A leads ⇒ CW.' : 'B rises first, then A ⇒ B leads ⇒ CCW.'};
  }
  if (t === 1){
    const ppr = pick([100, 360, 500, 1000, 1024, 2048, 2500]), rpm = pick([300, 600, 1000, 1450, 1500, 3000]), f = C.encFreq(ppr, rpm) / 1000;
    return {input:true, unit:'kHz', q:`A <b class="eq">${ppr} PPR</b> encoder on a motor turning at <b class="eq">${rpm} rpm</b>. What is the channel A frequency in kHz?`, check:v => Math.abs(v - f) <= Math.max(0.01, f * 0.02), ans:fmt(f, 2) + ' kHz', why:`<span class="eq">f = PPR × rpm ÷ 60 = ${ppr} × ${rpm} ÷ 60 = ${fmt(f * 1000, 0)} Hz</span>`};
  }
  if (t === 2){
    const ppr = pick([500, 1000, 1024, 2048]), m = pick([1, 2, 4]), rev = pick([2, 3, 5, 10, 2.5, 0.5]), cnt = Math.round(ppr * m * rev);
    return {input:true, unit:'rev', q:`A <b class="eq">${ppr} PPR</b> encoder and the PLC counter is set to <b>x${m}</b>. The counter went up by <b class="eq">${cnt}</b> counts. How many revolutions did the shaft turn?`, check:v => Math.abs(v - rev) <= 0.02, ans:String(rev), why:`<span class="eq">revolutions = ${cnt} ÷ (${ppr} × ${m}) = ${rev}</span>`};
  }
  if (t === 3){
    const ppr = pick([500, 1000, 1024, 2000]), rpm = pick([150, 300, 600, 900, 1200, 1500]), f = C.encFreq(ppr, rpm);
    return {input:true, unit:'rpm', q:`A <b class="eq">${ppr} PPR</b> encoder, and the high-speed counter measured <b class="eq">${fmt(f, 0)} Hz</b> on channel A. What is the speed in rpm?`, check:v => Math.abs(v - rpm) <= rpm * 0.01, ans:rpm + ' rpm', why:`<span class="eq">rpm = f ÷ PPR × 60 = ${fmt(f, 0)} ÷ ${ppr} × 60 = ${rpm}</span>`};
  }
  const qs = [
    {q:'The encoder cable is long (50 m) and runs next to VFD cables. Which output type is best?', o:['Line driver RS-422 (A, A̅, B and B̅)', 'Open collector NPN', 'Plain TTL without complements', 'Any type'], a:0, why:'A differential signal cancels the noise common to both wires.'},
    {q:'An encoder with an <b>open collector NPN</b> output is wired to a card and gives no pulses. What is probably missing?', o:['A pull-up resistor to +V', 'A 250Ω resistor', 'A diode', 'A capacitor on the supply'], a:0, why:'An open collector only pulls to 0V; it needs something to pull the signal up when it turns off.'},
    {q:'What voltage does an <b>HTL push-pull</b> encoder usually run on?', o:['10–30V (like 24V)', '5V only', '220V', '1–5V'], a:0, why:'HTL = High Threshold Logic: the output swings close to the supply voltage.'},
    {q:'A 1000 PPR encoder with x4 counting. What is the smallest angle it can sense?', o:['0.09°', '0.36°', '1°', '0.18°'], a:0, why:'360 ÷ (1000 × 4) = 0.09°.'}
  ];
  return pick(qs);
};

/* ================= L5: Gray-code absolute disc ================= */
IL.grayDisc = function(host, opt){
  opt = opt || {}; const L = opt.lesson, NB = 4, NP = 1 << NB;
  const S = {pos:0, code:'gray', ang:0, target:0, steps:0, tr:false, sawTr:false};
  host.innerHTML = `<div class="tabs" role="group" aria-label="Code type"><button type="button" class="btn" data-c="bin" aria-pressed="false">Plain binary</button><button type="button" class="btn" data-c="gray" aria-pressed="true">Gray code</button></div>
  <div class="sim-grid two-col"><div class="wd-art"><svg class="gd-svg" viewBox="0 0 300 250" role="img" aria-label="A 4-bit absolute encoder disc"></svg></div>
  <div class="mm-side"><div class="read gd-read"></div><div class="gd-tr"></div></div></div>
  <div class="wd-ctl"><button type="button" class="btn" data-s="-1">◀ Step back</button><button type="button" class="btn" data-s="1">Step forward ▶</button><button type="button" class="btn gd-trb" aria-pressed="false">Show the transition moment</button></div>
  <p class="msg gd-msg" aria-live="polite"></p>
  <p class="chal gd-chal">Challenge: turn the disc <b>one full turn</b> (16 steps), and open "transition moment" on <b>Binary</b> at a step where more than one bit changes (like 7 ⇒ 8), then compare it with Gray.</p>`;
  const q = s => $(s, host), fin = chal(host, '.gd-chal', L, 'gray');
  const val = k => S.code === 'gray' ? C.bin2gray(k) : k;
  function disc(){
    const cx = 150, cy = 128, P = 360 / NP; let s = `<circle cx="${cx}" cy="${cy}" r="112" fill="#e9edf0" stroke="#5d6469"/>`;
    s += `<g transform="rotate(${(-S.ang * P).toFixed(2)} ${cx} ${cy})">`;
    for (let k = 0; k < NP; k++){ const v = val(k); for (let b = 0; b < NB; b++){ const r0 = 34 + b * 19, r1 = r0 + 17; if ((v >> (NB - 1 - b)) & 1) s += `<path d="${sector(cx, cy, r0, r1, k * P - P / 2, k * P + P / 2)}" fill="#1c2125"/>`; } s += `<text x="${cx}" y="${cy - 104}" transform="rotate(${k * P} ${cx} ${cy})" text-anchor="middle" style="font:600 8px var(--font-mono);fill:#5d6469">${k}</text>`; }
    for (let k = 0; k < NP; k++) s += `<path d="M${cx} ${cy - 34}V${cy - 110}" transform="rotate(${k * P + P / 2} ${cx} ${cy})" stroke="#9aa4ac" stroke-width=".6"/>`;
    s += `</g><circle cx="${cx}" cy="${cy}" r="30" fill="#c3cad0" stroke="#5d6469"/><circle cx="${cx}" cy="${cy}" r="8" fill="#5d6469"/>`;
    const cur = val(S.pos);
    s += `<rect x="${cx - 9}" y="${cy - 114}" width="18" height="84" rx="4" fill="none" stroke="var(--accent)" stroke-width="2.4"/>`;
    for (let b = 0; b < NB; b++){ const y = cy - (34 + b * 19 + 8.5), on = (cur >> (NB - 1 - b)) & 1; s += `<circle cx="${cx + 22}" cy="${y}" r="6" fill="${on ? '#ffb000' : '#5a4a20'}"${on ? ' style="filter:drop-shadow(0 0 4px #ffb000)"' : ''}/><text x="${cx + 32}" y="${y + 4}" style="font:600 9px var(--font-mono)" class="w-tx">bit${NB - 1 - b}</text>`; }
    q('.gd-svg').innerHTML = s;
  }
  function ui(){
    disc();
    const b = S.pos, gcode = C.bin2gray(b), cur = val(b);
    q('.gd-read').innerHTML = `<div><span>Position (step)</span><b>${b} / ${NP}</b></div><div><span>Angle</span><b>${fmt(b * 360 / NP, 1)}°</b></div><div><span>Code read by the sensors</span><b>${C.bits(cur, NB)}</b></div><div><span>${S.code === 'gray' ? 'Converted to binary' : 'Gray, for comparison'}</span><b>${S.code === 'gray' ? C.bits(C.gray2bin(cur), NB) + ' = ' + C.gray2bin(cur) : C.bits(gcode, NB)}</b></div>`;
    $$('[data-c]', host).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.c === S.code)));
    q('.gd-trb').setAttribute('aria-pressed', String(S.tr));
    if (S.tr){
      const nx = (b + 1) % NP, a = val(b), c = val(nx), diff = a ^ c, bitsCh = [];
      for (let k = 0; k < NB; k++) if ((diff >> k) & 1) bitsCh.push(k);
      const poss = new Set(); for (let m = 0; m < (1 << bitsCh.length); m++){ let v = a; bitsCh.forEach((k, i) => { if ((m >> i) & 1) v ^= 1 << k; }); poss.add(v); }
      const list = Array.from(poss).map(v => { const pos = S.code === 'gray' ? C.gray2bin(v) : v; const ok = pos === b || pos === nx; return `<span class="term" style="${ok ? '' : 'border-color:var(--bad);color:var(--bad)'}">${C.bits(v, NB)} ⇐ ${pos}</span>`; }).join(' ');
      q('.gd-tr').innerHTML = `<div class="statline ${bitsCh.length > 1 ? 'bad' : 'ok'}"><span>From <b>${b}</b> to <b>${nx}</b>, <b>${bitsCh.length}</b> bit(s) change. If the sensors are not perfectly in step, the reading at that instant could be: ${list}</span></div>`;
      if (S.code === 'bin' && bitsCh.length > 1) S.sawTr = true;
    } else q('.gd-tr').innerHTML = '';
    q('.gd-msg').innerHTML = S.code === 'gray' ? 'In <b>Gray code</b> only <b>one bit</b> changes between any two neighbouring steps, so you can never read a far-off number during a transition.' : 'In <b>plain binary</b> several bits sometimes change at once (7 = 0111 ⇒ 8 = 1000). Open "transition moment" there and see.';
    if (S.steps >= NP && S.sawTr) fin();
  }
  let raf = 0;
  function tween(){ raf = 0; const d = S.target - S.ang; if (Math.abs(d) < 0.01 || reduced()){ S.ang = S.target; disc(); return; } S.ang += d * 0.25; disc(); raf = requestAnimationFrame(tween); }
  function step(k){ S.pos = (S.pos + k + NP) % NP; S.target += k; S.steps++; ui(); if (!raf) raf = requestAnimationFrame(tween); }
  onAct(host, '[data-s]', x => step(+x.dataset.s));
  onAct(host, '[data-c]', x => { S.code = x.dataset.c; ui(); });
  q('.gd-trb').addEventListener('click', () => { S.tr = !S.tr; ui(); });
  ui();
  return {S, step, ui, set(o){ Object.assign(S, o); ui(); }};
};

/* ================= generic case game (encoder faults, field faults) =================
   cases: [{t (title), s (story html), clues:[[label, html]], o:[...], a, why}] */
IL.caseGame = function(host, cases, opt){
  opt = opt || {};
  const need = opt.need || Math.ceil(cases.length * 0.7);
  const order = shuffle(cases.map((_, i) => i)); let k = 0, ok = 0, ans = 0;
  host.innerHTML = `<div class="dr-top"><span class="cg-sc" aria-live="polite"></span><span class="bar"><i class="cg-bar"></i></span></div><div class="cg-card dr-card"></div><div class="dr-act"><button type="button" class="btn pri cg-next" hidden>Next →</button></div><p class="chal cg-chal">${opt.goal || `Solve at least <b>${need}</b> cases correctly.`}</p>`;
  const q = s => $(s, host), fin = chal(host, '.cg-chal', opt.lesson, opt.task), card = q('.cg-card');
  function score(){ q('.cg-sc').innerHTML = `Case <b>${Math.min(k + 1, cases.length)}</b> of ${cases.length} · Correct: <b>${ok}</b>`; q('.cg-bar').style.width = (ok / need * 100 > 100 ? 100 : ok / need * 100) + '%'; }
  function show(){
    const c = cases[order[k]], oi = shuffle(c.o.map((_, i) => i));
    card.innerHTML = `<h4>${c.t}</h4><div class="dr-q" style="font-weight:500">${c.s}</div>${c.clues && c.clues.length ? `<div class="chips-t">${c.clues.map((cl, i) => `<button type="button" class="btn" data-cl="${i}" aria-expanded="false">Check: ${cl[0]}</button>`).join('')}</div><div class="cg-clue"></div>` : ''}<p style="margin:4px 0 0;font-weight:600">What is the most likely cause?</p><div class="qz-a">${oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${c.o[i]}</button>`).join('')}</div><p class="qz-f" aria-live="polite"></p>`;
    q('.cg-next').hidden = true; ans = 0; score();
  }
  card.addEventListener('click', e => {
    const cl = e.target.closest('[data-cl]');
    if (cl){ const c = cases[order[k]], x = c.clues[+cl.dataset.cl]; $$('[data-cl]', card).forEach(b => b.setAttribute('aria-expanded', String(b === cl))); $('.cg-clue', card).innerHTML = `<div class="box" style="margin-top:6px">${x[1]}</div>`; return; }
    const b = e.target.closest('.qz-o'); if (!b || ans) return;
    const c = cases[order[k]], good = +b.dataset.i === c.a; ans = 1; if (good) ok++;
    $$('.qz-o', card).forEach(x => { x.disabled = true; if (+x.dataset.i === c.a) x.classList.add('ok'); else if (x === b) x.classList.add('no'); });
    const f = $('.qz-f', card); f.className = 'qz-f ' + (good ? 'ok' : 'no'); f.innerHTML = (good ? 'Correct. ' : 'Not that. ') + c.why;
    score(); if (ok >= need) fin();
    const nx = q('.cg-next'); nx.hidden = false;
    nx.textContent = k + 1 < cases.length ? 'Next case →' : (ok >= need ? 'Play again' : 'Try again from the start');
  });
  q('.cg-next').addEventListener('click', () => { if (k + 1 < cases.length) k++; else { k = 0; ok = 0; order.sort(() => Math.random() - 0.5); } show(); });
  show();
  return {get cur(){ return cases[order[k]]; }, answer(i){ const b = card.querySelector(`.qz-o[data-i="${i}"]`); if (b) b.click(); }, next(){ q('.cg-next').click(); }, get ok(){ return ok; }};
};
/* scope picture from arbitrary traces: [{lab, col, fn(t 0..1) → 0/1 or analog}] */
IL.scopeTr = function(traces, note){
  const W = 340, rowH = 42, H = traces.length * rowH + 14, X0 = 30, X1 = 332, n = 500;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Scope"><rect x="${X0 - 4}" y="2" width="${X1 - X0 + 8}" height="${H - 4}" rx="6" fill="#08130e"/>`;
  traces.forEach((tr, r) => { const y0 = 12 + r * rowH + 30; let d = ''; for (let i = 0; i <= n; i++){ const x = X0 + (X1 - X0) * i / n, y = y0 - tr.fn(i / n) * 24; d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } s += `<path d="${d}" fill="none" stroke="${tr.col}" stroke-width="2" stroke-linejoin="round"/><text x="${X0 - 8}" y="${y0 - 8}" text-anchor="end" style="font:700 11px var(--font-mono);fill:${tr.col}">${tr.lab}</text>`; });
  if (note) s += `<text x="${X1 - 4}" y="16" text-anchor="end" style="font:600 9px var(--font-mono);fill:#7aa08e">${note}</text>`;
  return s + '</svg>';
};
const sq = (t, ph) => C.encAB(t * 4 + ph).A;
IL.ENC_CASES = [
  {t:'The counter climbs while the machine is stopped', s:'A packing machine: when the conveyor VFD starts, the encoder counter of the cutting machine counts up by itself even though that machine is stopped. When the VFD stops, the counter holds.', clues:[['Scope on A', IL.scopeTr([{lab:'A', col:'#ffd23f', fn:t => ((t * 37) % 1 < 0.02 ? 0.8 : 0) }], 'VFD ON')], ['Cable route', 'The encoder cable runs in the same tray as the VFD motor cable, and the shield is cut back at both ends and not grounded.']],
    o:['Noise from the VFD cable and an ungrounded shield', 'Failed encoder', 'A and B swapped', 'Wrong PPR in the PLC'], a:0, why:'The PWM edges from the VFD couple onto the encoder cable as extra pulses. Separate the cables, ground the shield properly (360° in the clamp), and use a differential line driver.'},
  {t:'It counts down while the conveyor runs forward', s:'After replacing the encoder with a new one, the counter counts down while the conveyor runs in its normal direction, and the position on the HMI is negative.', clues:[['Scope', IL.scopeTr([{lab:'A', col:'#ffd23f', fn:t => sq(t, 0.85)}, {lab:'B', col:'#3fd0ff', fn:t => sq(t, 0.1)}], 'FWD')]],
    o:['A and B swapped (or the encoder mounted the other way round)', 'Noise', 'Channel Z not connected', 'Frequency too high'], a:0, why:'B leads A ⇒ the card thinks it is CCW. Swap the A and B wires, or reverse the direction with the card parameter.'},
  {t:'It counts half and creeps when the machine vibrates', s:'The position comes out at about half the real distance, and when the shaft vibrates while stopped the counter only goes up, never down.', clues:[['Scope', IL.scopeTr([{lab:'A', col:'#ffd23f', fn:t => sq(t, 0.1)}, {lab:'B', col:'#3fd0ff', fn:t => 0}])], ['Multimeter check', 'Channel B voltage at the card terminal = a steady 0V, but at the encoder terminals it changes.']],
    o:['Channel B is open (broken wire or loose terminal)', 'A higher-PPR encoder', 'The VFD', 'Weak power supply'], a:0, why:'Without B the card cannot tell the direction and counts only the A edges. Tighten the terminal or replace the broken wire.'},
  {t:'Lengths are right at low speed and wrong at high speed', s:'A cut-to-length machine: at 20 m/min the sheets are correct, but at 80 m/min they come out longer, and by a different amount each time.', clues:[['The numbers', 'The encoder is 2048 PPR and the shaft reaches 2900 rpm ⇒ <span class="eq">2048 × 2900 ÷ 60 ≈ 99 kHz</span>. The PLC high-speed counter maxes out at <b>30 kHz</b>.']],
    o:['The frequency is above what the card can count, so it misses pulses', 'Noise from the VFD', 'A and B swapped', 'The measuring wheel slips'], a:0, why:'The card cannot keep up and misses pulses, so the sheet comes out longer. Use a faster card or a lower-PPR encoder.'},
  {t:'The position drifts little by little', s:'A rotary table: after a few days the stop position gradually moves away from where it should be. No noise, and everything on the scope is clean.', clues:[['Mechanical check', 'You put a pen mark across the shaft and the coupling, and after some running the two marks moved apart.']],
    o:['A loose coupling slipping on the shaft', 'The encoder is TTL', 'The 24V supply', 'The PLC is slow'], a:0, why:'The shaft turns and the encoder turns slightly less. Tighten the coupling screw on the flat of the shaft (or replace the coupling).'},
  {t:'The encoder bearing fails every two months', s:'A hollow-shaft encoder on a motor. Every two months the bearing starts to whine and fails.', clues:[['Mounting', 'The encoder body is bolted rigidly to the motor frame with 4 screws, and the motor shaft has a slight runout.']],
    o:['Rigid mounting without a flexible torque arm loads the bearing', 'Noise', 'PPR too low', 'Long cable'], a:0, why:'A hollow-shaft encoder must be fixed on the shaft only, with its body held by a flexible torque arm that allows for runout. Any rigid fixing loads the bearing and breaks it.'},
  {t:'After a power cut the crane does not know where it is', s:'Every time the power goes off and comes back, the crane has to go to its start point (homing) to find its position, and the plant is fed up.', clues:[['Encoder', 'An incremental encoder, 1000 PPR.']],
    o:['An incremental encoder only counts from power-up; the fix is a multi-turn absolute encoder', 'Failed encoder', 'Weak power supply', 'Needs a higher PPR'], a:0, why:'An incremental encoder has no memory: after power-up the counter starts from zero. A multi-turn absolute encoder knows its position and turn count even after a power cut.'},
  {t:'80 m cable and the count is wrong', s:'A 5V TTL encoder with single-ended output (no A̅ B̅) and an 80 m cable to the panel. Counts are lost now and then and the signal is weak.', clues:[['Scope at the card', IL.scopeTr([{lab:'A', col:'#ffd23f', fn:t => { const v = sq(t, 0.1); return v * 0.55 + Math.sin(t * 300) * 0.06; }}], '2V/div')]],
    o:['Single-ended TTL is not suited to a long cable; use a differential line driver or HTL', 'The encoder turns backwards', 'Loose coupling', 'Channel Z'], a:0, why:'5V drops along a long cable and picks up noise. Differential RS-422 runs much longer distances, or use 24V HTL with a suitable card.'}
];

/* ================= L6: thermocouple bench ================= */
C.TC_COL = {K:['#2e9b3c', 'green'], J:['#1d1d1d', 'black'], T:['#7a4a22', 'brown'], N:['#e07aa8', 'pink'], S:['#f08a24', 'orange'], R:['#f08a24', 'orange'], B:['#9aa4ac', 'grey']};
IL.tcBench = function(host, opt){
  opt = opt || {}; const L = opt.lesson, g = U('tc');
  const S = {type:'K', th:400, thead:70, tamb:30, cjc:true, cable:'ext', rev:false, open:false, seen:new Set()};
  const typ = Object.keys(C.TC);
  host.innerHTML = `<div class="wd-art"><svg viewBox="0 0 360 250" role="img" aria-label="A thermocouple in a furnace, a cable, and an instrument in the panel">${ART.defs(g)}
    <defs><linearGradient id="${g}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#d9381e"/></linearGradient></defs>
    <rect class="tc-furn" x="0" y="156" width="130" height="90" rx="6" fill="url(#${g}f)"/><rect x="0" y="150" width="130" height="10" fill="#7f8a92"/>
    <text x="8" y="240" class="svg-ar" style="font-size:10px;font-weight:700;fill:#fff">Furnace</text>
    <g transform="translate(26 10) scale(.88)">${ART.tchead({g})}</g>
    <circle class="tc-hj" cx="65.6" cy="190" r="5" fill="#ff3b30" stroke="#fff" stroke-width="1.5"/>
    <text class="tc-tht" x="76" y="214" style="font:700 10px var(--font-mono);fill:#fff">400°C</text>
    <text class="tc-headt" x="66" y="8" text-anchor="middle" style="font:600 9px var(--font-mono)"></text>
    <g class="tc-cab"></g>
    <rect x="236" y="40" width="118" height="110" rx="8" fill="#1d2328" stroke="#0f1215"/>
    <rect x="246" y="50" width="98" height="40" rx="4" fill="#06130b"/><text class="tc-disp" x="338" y="80" text-anchor="end" style="font:700 22px var(--font-mono);fill:#4dff88">0</text>
    <text x="250" y="104" style="font:600 8px var(--font-mono);fill:#93a2ab">TC TYPE</text><text class="tc-ty" x="344" y="104" text-anchor="end" style="font:700 9px var(--font-mono);fill:#ffd23f">K</text>
    <text x="250" y="120" style="font:600 8px var(--font-mono);fill:#93a2ab">CJC</text><text class="tc-cj" x="344" y="120" text-anchor="end" style="font:700 9px var(--font-mono);fill:#3fd0ff">ON</text>
    <text x="250" y="140" style="font:600 7px var(--font-mono);fill:#5f6d75">TEMPERATURE INDICATOR</text>
    <text class="tc-ambt" x="295" y="168" text-anchor="middle" style="font-size:10px"></text>
    <g class="tc-cjm"></g>
  </svg></div>
  <div class="read tc-read"></div>
  <div class="statline tc-st" aria-live="polite"></div>
  <div class="wd-ctl"><label style="flex:1 1 100%">Thermocouple type: <select class="inp tc-type" dir="ltr">${typ.map(t => `<option value="${t}">Type ${t} · ${C.TC[t].pair}</option>`).join('')}</select></label>
   <label>Furnace temperature (hot junction): <b class="tc-thv"></b><input type="range" class="tc-th" min="0" max="1250" step="5" value="400" aria-label="Hot junction temperature"></label>
   <label>Thermocouple head temperature: <b class="tc-hv"></b><input type="range" class="tc-hd" min="10" max="150" step="1" value="70" aria-label="Head temperature"></label>
   <label>Panel temperature (at the instrument): <b class="tc-av"></b><input type="range" class="tc-amb" min="0" max="55" step="1" value="30" aria-label="Panel temperature"></label></div>
  <div class="flt" role="group" aria-label="Experiments and faults"><button type="button" class="btn" data-k="cjc" aria-pressed="false">Turn CJC off</button><button type="button" class="btn" data-k="cu" aria-pressed="false">Plain copper cable instead of compensating cable</button><button type="button" class="btn" data-k="rev" aria-pressed="false">Reverse polarity</button><button type="button" class="btn" data-k="open" aria-pressed="false">Break the thermocouple</button></div>
  <p class="msg tc-msg" aria-live="polite"></p>
  <p class="chal tc-chal">Challenge: try <b>Turn CJC off</b>, <b>copper cable</b> and <b>reverse polarity</b>, and each time see how many degrees the error is and where it comes from.</p>`;
  const q = s => $(s, host), fin = chal(host, '.tc-chal', L, 'tc');
  function cable(){
    const col = S.cable === 'cu' ? ['#b87333', '#b87333'] : [C.TC_COL[S.type][0], '#f2f2f2'], sheath = S.cable === 'cu' ? '#5d6469' : C.TC_COL[S.type][0];
    const pa = S.rev ? 'M236 104' : 'M236 96', pb = S.rev ? 'M236 96' : 'M236 104';
    let s = `<path d="M100 46C150 46 160 100 220 100" fill="none" stroke="${sheath}" stroke-width="12" stroke-linecap="round" opacity=".85"/><path d="M100 46C150 46 160 100 220 100" fill="none" stroke="#000" stroke-width="12" stroke-linecap="round" opacity=".15"/>`;
    s += `<path d="M220 100C226 100 226 96 236 96" fill="none" stroke="${S.rev ? col[1] : col[0]}" stroke-width="3.4"/><path d="M220 100C226 100 226 104 236 104" fill="none" stroke="${S.rev ? col[0] : col[1]}" stroke-width="3.4" stroke-dasharray="${S.rev ? '' : ''}"/>`;
    s += `<text x="${S.rev ? 230 : 230}" y="92" text-anchor="end" style="font:700 9px var(--font-mono);fill:var(--bad)">+</text><text x="230" y="116" text-anchor="end" style="font:700 9px var(--font-mono);fill:var(--cold)">−</text>`;
    s += `<text x="165" y="${S.cable === 'cu' ? 132 : 132}" text-anchor="middle" class="svg-ar" style="font-size:10px;font-weight:700;fill:${S.cable === 'cu' ? 'var(--bad)' : 'var(--ink)'}">${S.cable === 'cu' ? 'Plain copper wire' : 'Type ' + S.type + ' compensating cable'}</text>`;
    if (S.open) s += `<path d="M150 56l12 12M162 56l-12 12" stroke="var(--bad)" stroke-width="3.5"/>`;
    void pa; void pb;
    q('.tc-cab').innerHTML = s;
    const cj = S.cable === 'cu' ? [100, 46, 'Cold junction here (head)'] : [236, 100, 'Cold junction here'];
    q('.tc-cjm').innerHTML = `<circle cx="${cj[0]}" cy="${cj[1]}" r="5.5" fill="var(--cold)" stroke="#fff" stroke-width="1.5"/><text x="${cj[0] + (S.cable === 'cu' ? 0 : -6)}" y="${cj[1] + (S.cable === 'cu' ? -10 : 26)}" text-anchor="${S.cable === 'cu' ? 'start' : 'end'}" class="svg-ar" style="font-size:10px;font-weight:700;fill:var(--cold)">${cj[2]}</text>`;
  }
  function ui(){
    const T = C.TC[S.type], r = C.tcRead({type:S.type, th:S.th, thead:S.thead, tamb:S.tamb, cjc:S.cjc, cable:S.cable, rev:S.rev, open:S.open});
    const E = t => C.tcMv(S.type, t);
    cable();
    const disp = r.status === 'open' ? 'OPEN' : r.status === 'under' ? 'LLLL' : r.status === 'over' ? 'HHHH' : fmt(r.shown, 1);
    q('.tc-disp').textContent = disp; q('.tc-ty').textContent = S.type; q('.tc-cj').textContent = S.cjc ? 'ON' : 'OFF';
    q('.tc-tht').textContent = S.th + '°C'; q('.tc-headt').textContent = 'Head ⁦' + S.thead + ' °C⁩'; q('.tc-headt').setAttribute('class', 'tc-headt svg-ar w-tx');
    q('.tc-ambt').textContent = 'Panel ⁦' + S.tamb + ' °C⁩'; q('.tc-ambt').setAttribute('class', 'tc-ambt svg-ar w-mu');
    q('.tc-furn').style.opacity = 0.35 + Math.min(1, S.th / 900) * 0.65;
    q('.tc-thv').textContent = S.th + ' °C'; q('.tc-hv').textContent = S.thead + ' °C'; q('.tc-av').textContent = S.tamb + ' °C';
    const err = r.shown == null ? null : r.shown - S.th;
    q('.tc-read').innerHTML = `<div><span>mV at the instrument terminals</span><b>${isFinite(r.mv) ? fmt(r.mv, 3) + ' mV' : 'OL'}</b></div><div><span>CJC adds</span><b>${S.cjc ? '+' + fmt(E(S.tamb), 3) + ' mV' : '0'}</b></div><div><span>Instrument shows</span><b>${disp}${r.shown != null ? ' °C' : ''}</b></div><div><span>Error</span><b class="${err == null || Math.abs(err) > 3 ? 'bad' : 'ok'}">${err == null ? '—' : (err > 0 ? '+' : '') + fmt(err, 1) + ' °C'}</b></div>`;
    const st = q('.tc-st'); const good = err != null && Math.abs(err) <= 2.5;
    st.className = 'statline tc-st ' + (good ? 'ok' : 'bad');
    st.innerHTML = `<span><b>Equation:</b> <span class="eq">E(Th) − E(Tcj) = ${fmt(E(S.th), 3)} − ${fmt(E(S.cable === 'cu' ? S.thead : S.tamb), 3)} = ${fmt(E(S.th) - E(S.cable === 'cu' ? S.thead : S.tamb), 3)} mV</span></span>`;
    let m;
    if (S.open) m = '<b>Thermocouple open:</b> no circuit. The instrument sends a tiny current through the sensor (burnout detection), so when it breaks the voltage rises and it shows <b>OPEN</b> or goes to full scale (upscale), and a transmitter drives 21+ mA. This is so the furnace does not keep heating on a low reading.';
    else if (S.rev) m = `<b>Polarity reversed:</b> the mV is now negative. Notice the odd part: heat the furnace more and the reading <b>drops</b>! ${r.status === 'under' ? 'Here it has gone completely below range (LLLL).' : ''} In the field: reading falls while the furnace heats up = reversed polarity somewhere (the head, a junction box or the instrument).`;
    else if (S.cable === 'cu') m = `<b>Plain copper cable:</b> the thermocouple ends at the <b>head</b> (<span class="eq">${S.thead} °C</span>), so the cold junction is now there. But the instrument compensates for the <b>panel</b> temperature (<span class="eq">${S.tamb} °C</span>). The error ≈ <span class="eq">${S.tamb} − ${S.thead} = ${S.tamb - S.thead} °C</span>. And if the head sits next to a furnace whose temperature changes, the error changes with it. The fix: <b>compensating cable of the same type</b> all the way to the instrument terminals.`;
    else if (!S.cjc) m = `<b>CJC off:</b> a thermocouple measures the <b>difference</b> between the hot and cold junctions. The instrument converts the mV as if the cold junction were at 0°C, so it shows about <span class="eq">${S.th} − ${S.tamb}</span>. The error is about <b>−${S.tamb} °C</b> (the panel temperature). That is why a thermocouple without CJC "reads the panel temperature" when the furnace is cold: it shows zero when it is really 30.`;
    else m = `All correct: the instrument measured <b>${fmt(r.mv, 3)} mV</b>, its internal CJC sensor measured its terminal temperature (<span class="eq">${S.tamb} °C</span>) and added <b>${fmt(E(S.tamb), 3)} mV</b>, then converted from the table: <span class="eq">${fmt(r.mv + E(S.tamb), 3)} mV ⇒ ${fmt(r.shown, 1)} °C</span>.`;
    q('.tc-msg').innerHTML = m;
    $$('[data-k]', host).forEach(b => { const k = b.dataset.k; b.setAttribute('aria-pressed', String(k === 'cjc' ? !S.cjc : k === 'cu' ? S.cable === 'cu' : S[k])); });
    if (['cjc', 'cu', 'rev'].every(k => S.seen.has(k))) fin();
    return r;
  }
  q('.tc-type').addEventListener('change', e => { S.type = e.target.value; const [lo, hi] = C.TC[S.type].range, sl = q('.tc-th'); sl.min = Math.max(0, lo); sl.max = hi; S.th = clamp(S.th, +sl.min, hi); sl.value = S.th; ui(); });
  q('.tc-th').addEventListener('input', e => { S.th = +e.target.value; ui(); });
  q('.tc-hd').addEventListener('input', e => { S.thead = +e.target.value; ui(); });
  q('.tc-amb').addEventListener('input', e => { S.tamb = +e.target.value; ui(); });
  onAct(host, '[data-k]', b => { const k = b.dataset.k; if (k === 'cjc') S.cjc = !S.cjc; else if (k === 'cu') S.cable = S.cable === 'cu' ? 'ext' : 'cu'; else S[k] = !S[k]; if (k === 'cjc' ? !S.cjc : k === 'cu' ? S.cable === 'cu' : S[k]) S.seen.add(k); ui(); });
  ui();
  return {S, ui, set(o){ Object.assign(S, o); return ui(); }};
};
IL.tcGen = function(){
  const t = Math.random();
  if (t < 0.6){
    const type = pick(['K', 'K', 'J', 'T']), tc = pick([20, 25, 30, 35]), [lo, hi] = C.TC[type].range, th = Math.round((Math.max(lo, 50) + Math.random() * (Math.min(hi, 900) - Math.max(lo, 50))) / 5) * 5;
    const mv = +(C.tcMv(type, th) - C.tcMv(type, tc)).toFixed(3), ans = C.tcT(type, mv + C.tcMv(type, tc));
    return {input:true, unit:'°C', q:`A <b>Type ${type}</b> thermocouple. The meter at its terminals in the panel reads <b class="eq">${fmt(mv, 3)} mV</b>, and the terminal temperature is <b class="eq">${tc} °C</b>. What is the hot junction temperature? <small class="muted">(use the table above)</small>`, check:v => Math.abs(v - ans) <= 4, ans:fmt(ans, 0) + ' °C', why:`Add the cold junction mV first: <span class="eq">${fmt(mv, 3)} + E(${tc}) ${fmt(C.tcMv(type, tc), 3)} = ${fmt(mv + C.tcMv(type, tc), 3)} mV ⇒ ${fmt(ans, 0)} °C</span>. If you convert the mV straight away without adding it, you will be off by about ${tc} degrees.`};
  }
  const qs = [
    {q:'A thermocouple coloured per IEC: the positive wire is <b>green</b> and the negative is <b>white</b>. Which type is it?', o:['K', 'J', 'T', 'S'], a:0, why:'IEC 60584: K green, J black, T brown, N pink, S and R orange.'},
    {q:'On an American (ANSI) thermocouple cable, the <b>red</b> wire is:', o:['Always the negative', 'Always the positive', 'The shield', 'Depends on the type'], a:0, why:'In ANSI the negative is red on every type (the opposite of what you are used to!). K: yellow (+) and red (−).'},
    {q:'A 1500 °C furnace. Which thermocouple can handle it?', o:['Type S, R or B (platinum)', 'Type T', 'Type J', 'PT100'], a:0, why:'T goes to about 350, J to 750 and K to about 1250. Platinum types are for very high temperatures.'},
    {q:'Why does Type B hardly need CJC?', o:['Because its mV from 0 to 50 °C is almost zero', 'Because it is more expensive', 'Because it is 4-wire', 'Because it measures negative'], a:0, why:'E(50 °C) ≈ 0.002 mV only, so the panel temperature has a negligible effect.'}
  ];
  return pick(qs);
};

/* ================= L7: RTD bench (2/3/4 wire) ================= */
IL.rtdBench = function(host, opt){
  opt = opt || {}; const L = opt.lesson, g = U('rt');
  const S = {w:2, t:80, len:50, mm2:0.5, loose:false, r0:100, seen:new Set()};
  host.innerHTML = `<div class="tabs" role="group" aria-label="Number of wires">${[2, 3, 4].map(w => `<button type="button" class="btn" data-w="${w}" aria-pressed="${w === 2}">${w}-wire</button>`).join('')}</div>
  <div class="wd-art"><svg class="rt-svg" viewBox="0 34 360 136" role="img" aria-label="A PT100 sensor, a cable and an instrument"></svg></div>
  <div class="read rt-read"></div>
  <div class="statline rt-st" aria-live="polite"></div>
  <div class="wd-ctl"><label>Actual temperature: <b class="rt-tv"></b><input type="range" class="rt-t" min="-50" max="300" step="1" value="80" aria-label="Temperature"></label>
   <label>Cable length: <b class="rt-lv"></b><input type="range" class="rt-l" min="1" max="300" step="1" value="50" aria-label="Cable length"></label>
   <label style="flex:1 1 45%">Wire size: <select class="inp rt-mm" dir="ltr">${[0.22, 0.5, 0.75, 1, 1.5].map(v => `<option value="${v}"${v === 0.5 ? ' selected' : ''}>${v} mm²</option>`).join('')}</select></label>
   <label style="flex:1 1 45%">Sensor: <select class="inp rt-r0" dir="ltr"><option value="100">PT100</option><option value="1000">PT1000</option></select></label></div>
  <div class="flt"><button type="button" class="btn rt-loose" aria-pressed="false">Loose terminal (+1.5 Ω in one wire)</button></div>
  <p class="msg rt-msg" aria-live="polite"></p>
  <p class="chal rt-chal">Challenge: see the error on <b>2-wire</b> with a 50 m cable, then try <b>3-wire</b> and <b>4-wire</b>. And try the loose terminal on 3-wire.</p>`;
  const q = s => $(s, host), fin = chal(host, '.rt-chal', L, 'rtd');
  function draw(r){
    const cols = {2:['#d32f2f', '#f2f2f2'], 3:['#d32f2f', '#d32f2f', '#f2f2f2'], 4:['#d32f2f', '#d32f2f', '#f2f2f2', '#f2f2f2']}[S.w];
    let s = `<g transform="translate(6 70) scale(.62)">${ART.pt100({g:g, tag:''})}</g>`;
    s += ART.defs(g);
    s += `<text x="44" y="64" text-anchor="middle" style="font:700 10px var(--font-mono)" class="w-tx">PT${S.r0}</text>`;
    s += `<rect x="4" y="80" width="46" height="18" rx="4" fill="none" stroke="var(--accent)" stroke-dasharray="3 3"/><text x="27" y="114" text-anchor="middle" class="w-mu" style="font:600 9px var(--font-mono)">${fmt(r.rt, 2)} Ω</text>`;
    const y0 = 100 - (cols.length - 1) * 8;
    cols.forEach((c, i) => { const y = y0 + i * 16; s += `<path d="M138 100C160 100 160 ${y} 186 ${y}H252" fill="none" stroke="#555" stroke-width="5"/><path d="M138 100C160 100 160 ${y} 186 ${y}H252" fill="none" stroke="${c}" stroke-width="3.2"/>`; if (S.loose && i === 0) s += `<circle cx="252" cy="${y}" r="5" fill="none" stroke="var(--warn)" stroke-width="2.5"/>`; });
    s += `<text x="200" y="${y0 - 14}" text-anchor="middle" class="svg-ar w-mu" style="font-size:10px">${S.len} m · ${S.mm2} mm² · each wire ${fmt(r.rl, 2)} Ω</text>`;
    s += `<rect x="252" y="40" width="102" height="120" rx="8" fill="#1d2328" stroke="#0f1215"/><rect x="260" y="50" width="86" height="36" rx="4" fill="#06130b"/><text x="340" y="76" text-anchor="end" style="font:700 19px var(--font-mono);fill:#4dff88">${fmt(r.tm, 1)}</text>`;
    s += `<text x="260" y="104" style="font:600 8px var(--font-mono);fill:#93a2ab">INPUT</text><text x="346" y="104" text-anchor="end" style="font:700 9px var(--font-mono);fill:#ffd23f">PT${S.r0} ${S.w}W</text>`;
    s += `<text x="260" y="122" style="font:600 8px var(--font-mono);fill:#93a2ab">R meas</text><text x="346" y="122" text-anchor="end" style="font:700 9px var(--font-mono);fill:#e9edf0">${fmt(r.rm, 2)} Ω</text>`;
    s += `<text x="260" y="140" style="font:600 8px var(--font-mono);fill:#93a2ab">°C</text><text x="303" y="152" text-anchor="middle" style="font:600 7px var(--font-mono);fill:#5f6d75">RTD INPUT</text>`;
    q('.rt-svg').innerHTML = s;
  }
  function ui(){
    const rt = C.rtdR(S.t, S.r0), rl = C.leadR(S.len, S.mm2), rm = C.rtdMeasured(S.t, S.w, rl, S.loose ? 1.5 : 0, S.r0), tm = C.rtdT(rm, S.r0), err = tm - S.t;
    const r = {rt, rl, rm, tm, err}; draw(r);
    const tol = C.rtdTol('B', S.t), ma = C.pv2mA(clamp(tm, 0, 150), 0, 150);
    q('.rt-read').innerHTML = `<div><span>Sensor resistance</span><b>${fmt(rt, 2)} Ω</b></div><div><span>Instrument measured</span><b>${fmt(rm, 2)} Ω</b></div><div><span>Instrument shows</span><b>${fmt(tm, 1)} °C</b></div><div><span>Error</span><b class="${Math.abs(err) > tol ? 'bad' : 'ok'}">${err >= 0 ? '+' : ''}${fmt(err, 2)} °C</b></div><div><span>0–150 °C transmitter output</span><b>${fmt(ma, 2)} mA</b></div>`;
    const st = q('.rt-st'); st.className = 'statline rt-st ' + (Math.abs(err) > tol ? 'bad' : 'ok');
    st.innerHTML = Math.abs(err) > tol ? `The error is bigger than the sensor's own tolerance: Class B at this temperature is <span class="eq">±${fmt(tol, 2)} °C</span>. The cable has spoiled the measurement more than the sensor!` : `The error is within the Class B tolerance: <span class="eq">±${fmt(tol, 2)} °C</span>.`;
    const d = S.r0 === 100 ? 0.385 : 3.85;
    const M = {
      2:`<b>2-wire:</b> the instrument measures the sensor <b>+ both wires</b>: <span class="eq">${fmt(rt, 2)} + 2 × ${fmt(rl, 2)}${S.loose ? ' + 1.5' : ''} = ${fmt(rm, 2)} Ω</span>. And every extra 1 Ω on a PT${S.r0} ≈ <span class="eq">${fmt(1 / d, 2)} °C</span>. ${S.r0 === 1000 ? 'Notice: the PT1000 error is 10 times smaller because its resistance is 10 times bigger.' : 'That is why 2-wire is only OK with a very short cable or a PT1000.'}`,
      3:`<b>3-wire:</b> the instrument measures the resistance of one extra wire on its own and subtracts it, assuming <b>the two leads are equal</b>. ${S.loose ? '<b>But the loose terminal</b> added resistance to only one wire, so the compensation is upset and the error is back: <span class="eq">+1.5 Ω ≈ +' + fmt(1.5 / d, 1) + ' °C</span>. This is a real fault caused by oxidised terminals.' : 'This is the most common in plants: cheap and accurate enough.'}`,
      4:`<b>4-wire:</b> two wires carry the measuring current, and two other wires measure the voltage at the sensor itself with almost no current in them, so the cable resistance <b>does not count at all</b>${S.loose ? ', even with the loose terminal' : ''}. This is for labs, precision measurement and calibration.`
    };
    q('.rt-msg').innerHTML = M[S.w];
    q('.rt-tv').textContent = S.t + ' °C'; q('.rt-lv').textContent = S.len + ' m';
    $$('[data-w]', host).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.w === S.w)));
    q('.rt-loose').setAttribute('aria-pressed', String(S.loose));
    S.seen.add(S.w + (S.loose ? 'L' : '')); if (S.seen.has('2') && S.seen.has('3') && S.seen.has('4') && S.seen.has('3L')) fin();
    return r;
  }
  onAct(host, '[data-w]', b => { S.w = +b.dataset.w; ui(); });
  q('.rt-t').addEventListener('input', e => { S.t = +e.target.value; ui(); });
  q('.rt-l').addEventListener('input', e => { S.len = +e.target.value; ui(); });
  q('.rt-mm').addEventListener('change', e => { S.mm2 = +e.target.value; ui(); });
  q('.rt-r0').addEventListener('change', e => { S.r0 = +e.target.value; ui(); });
  q('.rt-loose').addEventListener('click', () => { S.loose = !S.loose; ui(); });
  ui();
  return {S, ui, set(o){ Object.assign(S, o); return ui(); }};
};
IL.ptGen = function(){
  const r0 = Math.random() < 0.75 ? 100 : 1000, t = Math.random();
  if (t < 0.45){
    const T = pick([-20, 0, 20, 25, 37, 50, 65, 80, 100, 120, 150, 180, 200, 250]), R = +C.rtdR(T, r0).toFixed(2);
    return {input:true, unit:'°C', q:`You disconnected the PT${r0} from the instrument and measured between its ends (red and white) with a meter: <b class="eq">${fmt(R, 2)} Ω</b>. Roughly what is the temperature? <small class="muted">(ignore the leads)</small>`, check:v => Math.abs(v - T) <= 2, ans:T + ' °C', why:`Quick estimate: <span class="eq">T ≈ (R − ${r0}) ÷ ${r0 === 100 ? '0.385' : '3.85'} = ${fmt((R - r0) / (r0 * 0.00385), 1)} °C</span>, and the exact table gives ${T} °C.`};
  }
  if (t < 0.75){
    const T = pick([0, 25, 50, 100, 150, 200]), R = C.rtdR(T, r0);
    return {input:true, unit:'Ω', q:`A PT${r0} at <b class="eq">${T} °C</b>. What should its resistance be in ohms?`, check:v => Math.abs(v - R) <= R * 0.006, ans:fmt(R, 2) + ' Ω', why:`From the IEC 60751 table: <span class="eq">R(${T}) = ${fmt(R, 2)} Ω</span>.`};
  }
  return pick([
    {q:'You measured a PT100 with a meter and got <b>OL</b> (infinite). That means:', o:['The sensor or its lead is open', 'The temperature is very high', 'The sensor is shorted', 'It is healthy'], a:0, why:'A healthy PT100 reads roughly between 80 and 250 Ω in normal service.'},
    {q:'You measured a PT100 and got <b>0.4 Ω</b>. That means:', o:['A short in the sensor or cable', 'The temperature is −250 °C', 'It is healthy', 'It is open'], a:0, why:'0.4 Ω is wire resistance, not a sensor: there is a short. The instrument will show its minimum or under range.'},
    {q:'A 3-wire PT100. Between the two wires of the <b>same colour</b> you should measure:', o:['A small resistance (the wire only)', '100 Ω', '138 Ω', 'OL'], a:0, why:'Those two wires are connected to the same end of the sensor.'},
    {q:'When the temperature rises, an NTC\'s resistance:', o:['Falls', 'Rises', 'Stays the same', 'Becomes zero'], a:0, why:'NTC = Negative Temperature Coefficient.'}
  ]);
};
/* NTC vs PT100 curve */
IL.ntcCurve = function(host){
  const S = {t:25, r25:10000, beta:3950};
  host.innerHTML = `<div class="wd-art"><svg class="nt-svg" viewBox="0 0 360 210" role="img" aria-label="Resistance curves of an NTC and a PT100 against temperature"></svg></div><div class="read nt-read"></div><div class="wd-ctl"><label>Temperature: <b class="nt-tv"></b><input type="range" class="nt-t" min="-20" max="120" step="1" value="25" aria-label="Temperature"></label></div>`;
  const q = s => $(s, host);
  function ui(){
    const X0 = 44, X1 = 300, Y0 = 12, Y1 = 180, xT = t => X0 + (t + 20) / 140 * (X1 - X0), lg = r => Y1 - (Math.log10(r) - 2) / 4 * (Y1 - Y0);
    let s = ''; [100, 1e3, 1e4, 1e5, 1e6].forEach(r => { s += `<line x1="${X0}" x2="${X1}" y1="${lg(r)}" y2="${lg(r)}" class="w-ln" stroke-width=".6"/><text x="${X0 - 4}" y="${lg(r) + 3}" text-anchor="end" class="w-mu" style="font-size:9px">${r >= 1e6 ? '1M' : r >= 1e3 ? r / 1e3 + 'k' : r}</text>`; });
    [-20, 0, 25, 50, 75, 100, 120].forEach(t => { s += `<text x="${xT(t)}" y="194" text-anchor="middle" class="w-mu" style="font-size:9px">${t}</text>`; });
    let dn = '', dp = ''; for (let t = -20; t <= 120; t += 2){ dn += (dn ? 'L' : 'M') + xT(t).toFixed(1) + ' ' + lg(C.ntcR(t, S.r25, S.beta)).toFixed(1); dp += (dp ? 'L' : 'M') + xT(t).toFixed(1) + ' ' + lg(C.rtdR(t)).toFixed(1); }
    s += `<path d="${dn}" fill="none" stroke="var(--cold)" stroke-width="2.6"/><path d="${dp}" fill="none" stroke="var(--heat)" stroke-width="2.6"/>`;
    const rn = C.ntcR(S.t, S.r25, S.beta), rp = C.rtdR(S.t);
    s += `<line x1="${xT(S.t)}" x2="${xT(S.t)}" y1="${Y0}" y2="${Y1}" stroke="var(--accent)" stroke-dasharray="4 3"/><circle cx="${xT(S.t)}" cy="${lg(rn)}" r="5" fill="var(--cold)"/><circle cx="${xT(S.t)}" cy="${lg(rp)}" r="5" fill="var(--heat)"/>`;
    s += `<text x="306" y="${lg(C.ntcR(120, S.r25, S.beta)) + 4}" style="font:700 10px var(--font-mono);fill:var(--cold)">NTC</text><text x="306" y="${lg(C.rtdR(120)) + 4}" style="font:700 10px var(--font-mono);fill:var(--heat)">PT100</text><text x="${X1}" y="206" text-anchor="end" class="w-mu" style="font-size:9px">°C</text><text x="4" y="10" class="w-mu" style="font-size:9px">Ω (log)</text>`;
    q('.nt-svg').innerHTML = s;
    q('.nt-read').innerHTML = `<div><span>NTC 10k (β 3950)</span><b>${rn >= 1000 ? fmt(rn / 1000, 2) + ' kΩ' : fmt(rn, 0) + ' Ω'}</b></div><div><span>PT100</span><b>${fmt(rp, 2)} Ω</b></div>`;
    q('.nt-tv').textContent = S.t + ' °C';
  }
  q('.nt-t').addEventListener('input', e => { S.t = +e.target.value; ui(); });
  ui();
};

/* ================= L8: load cell ================= */
/* small DC network solver: elems [{a,b,r}] ; fixed {node: volts} → node voltages */
C.netSolve = function(elems, fixed){
  const nodes = []; const id = n => { let i = nodes.indexOf(n); if (i < 0){ nodes.push(n); i = nodes.length - 1; } return i; };
  elems.forEach(e => { id(e.a); id(e.b); }); Object.keys(fixed).forEach(id);
  const N = nodes.length, A = Array.from({length:N}, () => new Array(N).fill(0)), b = new Array(N).fill(0);
  elems.forEach(e => { const i = id(e.a), j = id(e.b), g = 1 / e.r; A[i][i] += g; A[j][j] += g; A[i][j] -= g; A[j][i] -= g; });
  for (let i = 0; i < N; i++) A[i][i] += 1e-12;
  Object.keys(fixed).forEach(n => { const i = id(n); A[i] = new Array(N).fill(0); A[i][i] = 1; b[i] = fixed[n]; });
  for (let c = 0; c < N; c++){ let p = c; for (let r = c + 1; r < N; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]]; const d = A[c][c] || 1e-300; for (let r = c + 1; r < N; r++){ const f = A[r][c] / d; if (!f) continue; for (let k = c; k < N; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; } }
  const x = new Array(N).fill(0); for (let r = N - 1; r >= 0; r--){ let s = b[r]; for (let k = r + 1; k < N; k++) s -= A[r][k] * x[k]; x[r] = s / (A[r][r] || 1e-300); }
  return n => { const i = nodes.indexOf(n); return i < 0 ? NaN : x[i]; };
};
C.connected = function(elems, a, b){ const p = {}, f = x => { if (p[x] == null) p[x] = x; while (p[x] !== x) x = p[x] = p[p[x]]; return x; }; elems.forEach(e => { if (isFinite(e.r)) { const A = f(e.a), B = f(e.b); if (A !== B) p[A] = B; } }); return f(a) === f(b); };
C.netR = function(elems, a, b){
  if (a === b) return 0;
  const el = elems.filter(e => isFinite(e.r) && e.r > 0);
  if (!C.connected(el, a, b)) return Infinity;
  const v = C.netSolve(el, {[a]:1, [b]:0});
  let i = 0; el.forEach(e => { if (e.a === a) i += (1 - v(e.b)) / e.r; else if (e.b === a) i += (1 - v(e.a)) / e.r; });
  return 1 / i;
};
/* a 6-wire load cell + cable, seen from the cable end. fault: '' | overload | moisture | sense | weld | sig ; load fraction of capacity */
C.lcNet = function(fault, frac){
  const R = 350, dR = R * 0.002 * (frac || 0); /* 2 mV/V full bridge: ΔR/R = 0.002 at capacity */
  const arms = {R1:R - dR, R2:R + dR, R3:R + dR, R4:R - dR};
  if (fault === 'overload') arms.R1 += 0.7;
  if (fault === 'weld') arms.R3 = Infinity;
  const w = 0.5, OPEN = Infinity;
  const el = [
    {a:'E+', b:'cE+', r:w}, {a:'E-', b:'cE-', r:w}, {a:'S+', b:'cS+', r:fault === 'sig' ? OPEN : w}, {a:'S-', b:'cS-', r:w},
    {a:'SN+', b:'cE+', r:fault === 'sense' ? OPEN : w}, {a:'SN-', b:'cE-', r:w},
    {a:'cE+', b:'T', r:20}, {a:'B', b:'cE-', r:20},
    {a:'T', b:'cS+', r:arms.R1}, {a:'cS+', b:'B', r:arms.R2}, {a:'T', b:'cS-', r:arms.R3}, {a:'cS-', b:'B', r:arms.R4}
  ];
  const ins = fault === 'moisture' ? 2.1e6 : 2e10;
  ['T', 'B'].forEach(n => el.push({a:n, b:'BODY', r:ins}));
  return el;
};
C.LC_TERMS = [['E+', '+EXC', '#d32f2f'], ['E-', '−EXC', '#1d1d1d'], ['S+', '+SIG', '#2e9b3c'], ['S-', '−SIG', '#f2f2f2'], ['SN+', '+SEN', '#f2d21b'], ['SN-', '−SEN', '#1f6fd1'], ['BODY', 'SHLD', '#9aa4ac']];
/* meter reading between a (red) and b (black). mode 'ohm' (cell disconnected) or 'mv' (indicator connected: 10 V excitation, sense on) */
C.lcMeter = function(fault, mode, a, b, frac){
  const el = C.lcNet(fault, frac);
  if (mode === 'ohm'){ const r = C.netR(el, a, b); return r > 40e6 ? Infinity : r; }
  const fixed = {'E+':10, 'E-':0};
  const live = el.filter(e => isFinite(e.r));
  const v = C.netSolve(live, fixed);
  const fl = n => !C.connected(live, n, 'E+');
  if (fl(a) || fl(b)) return NaN; /* floating: unstable reading */
  return (v(a) - v(b)) * 1000;
};
/* ---- bench: weights on a cell, bridge animation, 4-wire vs 6-wire ---- */
IL.lcBench = function(host, opt){
  opt = opt || {}; const L = opt.lesson, g = U('lc'), CAP = 500, SENS = 2, VEX = 10;
  const S = {w:[], wires:6, len:100, tc:20, seen:new Set()};
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg class="lc-svg" viewBox="0 0 360 290" role="img" aria-label="An S-type load cell carrying weights, and its bridge"></svg></div>
  <div class="mm-side"><div class="read lc-read"></div><div class="statline lc-st" aria-live="polite"></div></div></div>
  <div class="wd-ctl"><button type="button" class="btn" data-add="20"><span class="eq">+20 kg</span></button><button type="button" class="btn" data-add="50"><span class="eq">+50 kg</span></button><button type="button" class="btn" data-add="100"><span class="eq">+100 kg</span></button><button type="button" class="btn" data-add="200"><span class="eq">+200 kg</span></button><button type="button" class="btn" data-add="-1">Remove last weight</button><button type="button" class="btn" data-add="0">Unload</button></div>
  <div class="tabs" role="group" aria-label="Cable"><button type="button" class="btn" data-wr="4" aria-pressed="false">4-wire cable</button><button type="button" class="btn" data-wr="6" aria-pressed="true">6-wire cable (sense)</button></div>
  <div class="wd-ctl"><label>Cable length (0.5 mm²): <b class="lc-lv"></b><input type="range" class="lc-l" min="5" max="300" step="5" value="100" aria-label="Cable length"></label>
   <label>Cable temperature (calibrated at 20 °C): <b class="lc-tv"></b><input type="range" class="lc-t" min="-5" max="60" step="1" value="20" aria-label="Cable temperature"></label></div>
  <p class="msg lc-msg" aria-live="polite"></p>
  <p class="chal lc-chal">Challenge: put a load close to <b>500 kg</b> and watch the mV, then compare <b>4-wire</b> and <b>6-wire</b> when the cable temperature is 50 °C.</p>`;
  const q = s => $(s, host), fin = chal(host, '.lc-chal', L, 'lc');
  const load = () => S.w.reduce((a, b) => a + b, 0);
  function calc(){
    const W = load(), rw20 = C.leadR(S.len, 0.5), rw = C.cuR(rw20, S.tc), RIN = 390;
    const vcell = S.wires === 6 ? C.lcVcell(VEX, RIN, rw) : C.lcVcell(VEX, RIN, rw);
    const mv = C.lcMv(W, CAP, SENS, vcell, 0);
    /* indicator calibrated at 20 °C. 6-wire: ratiometric on sensed excitation → exact. 4-wire: assumes 10 V at the cell */
    const k20 = C.lcVcell(VEX, RIN, rw20);
    const shown = S.wires === 6 ? W : W * vcell / k20;
    return {W, rw, vcell, mv, shown, frac:W / CAP};
  }
  function draw(r){
    const f = Math.min(1.3, r.frac), def = f * 3, n = S.w.length;
    let s = ART.defs(g);
    s += `<rect x="20" y="8" width="150" height="14" rx="3" fill="#5d6469"/><path d="M28 8V0M162 8V0" stroke="#5d6469" stroke-width="4"/>`;
    s += `<g transform="translate(47 22) scale(.8 ${(0.8 * (1 + def / 100)).toFixed(4)})">${ART.scell({g})}</g>`;
    const yb = 22 + 150 * 0.8 * (1 + def / 100);
    s += `<path d="M86 ${yb}V${yb + 14}" stroke="#5d6469" stroke-width="4"/><path d="M86 ${yb + 14}l-40 26M86 ${yb + 14}l40 26" stroke="#7f8a92" stroke-width="2"/><rect x="36" y="${yb + 40}" width="100" height="8" rx="2" fill="#5d6469"/>`;
    let y = yb + 40; S.w.forEach(w => { const h = w >= 200 ? 22 : w >= 100 ? 17 : w >= 50 ? 13 : 9, wd = w >= 200 ? 80 : w >= 100 ? 66 : w >= 50 ? 52 : 40; y -= h; s += `<rect x="${86 - wd / 2}" y="${y}" width="${wd}" height="${h - 1}" rx="3" fill="#3a4248" stroke="#1c2125"/><text x="86" y="${y + h / 2 + 3.5}" text-anchor="middle" style="font:700 8px var(--font-mono);fill:#e9edf0">${w} kg</text>`; });
    if (!n) s += `<text x="86" y="${yb + 70}" text-anchor="middle" class="svg-ar w-mu" style="font-size:10px">Tap + to add a weight</text>`;
    /* bridge */
    const cx = 252, cy = 124, d = 58, dR = 0.7 * f, col = (t, k) => t ? `rgb(${200 + Math.round(55 * k)},${Math.round(80 - 40 * k)},${Math.round(60 - 30 * k)})` : `rgb(${Math.round(40 - 20 * k)},${Math.round(110 + 20 * k)},${200 + Math.round(55 * k)})`;
    const arm = (x1, y1, x2, y2, lab, t) => { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI; return `<path d="M${x1} ${y1}L${x2} ${y2}" class="w-in" stroke-width="1.6"/><g transform="translate(${mx} ${my}) rotate(${ang})"><rect x="-17" y="-7" width="34" height="14" rx="2" fill="${col(t, f)}"/><path d="M-13 0h4l2-4 4 8 4-8 4 8 2-4h4" fill="none" stroke="#fff" stroke-width="1.2"/></g><text x="${mx + (mx < cx ? -14 : 14)}" y="${my + (my < cy ? -8 : 16)}" text-anchor="${mx < cx ? 'end' : 'start'}" style="font:600 8px var(--font-mono)" class="w-tx">${lab} ${t ? '+' : '−'}${fmt(dR, 2)}</text>`; };
    s += arm(cx, cy - d, cx - d, cy, 'R1', false) + arm(cx - d, cy, cx, cy + d, 'R2', true) + arm(cx, cy - d, cx + d, cy, 'R3', true) + arm(cx + d, cy, cx, cy + d, 'R4', false);
    s += `<circle cx="${cx}" cy="${cy - d}" r="4" class="w-ac"/><circle cx="${cx}" cy="${cy + d}" r="4" class="w-ac"/><circle cx="${cx - d}" cy="${cy}" r="4" fill="var(--good)"/><circle cx="${cx + d}" cy="${cy}" r="4" fill="var(--good)"/>`;
    s += `<text x="${cx}" y="${cy - d - 10}" text-anchor="middle" style="font:700 9px var(--font-mono);fill:#d32f2f">+EXC ${fmt(r.vcell, 2)}V</text><text x="${cx}" y="${cy + d + 18}" text-anchor="middle" style="font:700 9px var(--font-mono)" class="w-tx">−EXC 0V</text>`;
    s += `<text x="${cx - d - 6}" y="${cy + 4}" text-anchor="end" style="font:700 9px var(--font-mono);fill:var(--good)">+SIG</text><text x="${cx + d + 6}" y="${cy + 4}" style="font:700 9px var(--font-mono);fill:var(--good)">−SIG</text>`;
    s += `<path d="M${cx - d + 8} ${cy}H${cx + d - 8}" stroke="var(--good)" stroke-dasharray="3 3"/><rect x="${cx - 30}" y="${cy - 11}" width="60" height="20" rx="4" fill="#06130b"/><text x="${cx}" y="${cy + 3}" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#4dff88">${fmt(r.mv, 3)} mV</text>`;
    s += `<text x="${cx}" y="226" text-anchor="middle" class="svg-ar w-mu" style="font-size:9.5px">Red = tension (R rises) · Blue = compression (R falls)</text><text x="${cx}" y="240" text-anchor="middle" class="w-mu" style="font:600 9px var(--font-mono)">ΔR in Ω · 350 Ω gauges</text>`;
    q('.lc-svg').innerHTML = s;
  }
  function ui(){
    const r = calc(); draw(r);
    const err = r.W ? (r.shown - r.W) / r.W * 100 : 0;
    q('.lc-read').innerHTML = `<div><span>Actual load</span><b>${r.W} kg</b></div><div><span>Cell output</span><b>${fmt(r.mv, 3)} mV</b></div><div><span>Voltage reaching the cell</span><b>${fmt(r.vcell, 3)} V</b></div><div><span>Scale shows</span><b class="${Math.abs(err) > 0.1 ? 'bad' : 'ok'}">${fmt(r.shown, 1)} kg</b></div>`;
    const st = q('.lc-st'), over = r.W > CAP;
    st.className = 'statline lc-st ' + (over ? 'bad' : Math.abs(err) > 0.1 ? 'warn' : 'ok');
    st.innerHTML = over ? `<b>Overload!</b> The load of ${r.W} kg is above the 500 kg cell capacity. Up to 150 % (safe overload) there is usually no permanent damage; beyond that the cell deforms and its zero shifts.` : `<span class="eq">mV = ${SENS} mV/V × ${fmt(r.vcell, 2)} V × ${r.W}/${CAP} = ${fmt(r.mv, 3)} mV</span>`;
    q('.lc-msg').innerHTML = S.wires === 4 ? `<b>4-wire:</b> the resistance of the two leads (each <span class="eq">${fmt(r.rw, 2)} Ω</span> at ${S.tc} °C) eats into the 10V, so the cell gets only <span class="eq">${fmt(r.vcell, 3)} V</span>. Calibrating at 20 °C removes that difference, but when the cable temperature changes its resistance changes and the reading drifts${Math.abs(err) > 0.01 ? `: the error now is <b class="eq">${fmt(err, 2)} %</b>, i.e. <span class="eq">${fmt(r.shown - r.W, 2)} kg</span> on ${r.W} kg` : ''}.` : `<b>6-wire:</b> two sense wires measure the voltage <b>at the cell itself</b> (<span class="eq">${fmt(r.vcell, 3)} V</span>) and carry no current, and the indicator divides the signal by it (ratiometric). So cable length and temperature have no effect: the reading stays steady.`;
    q('.lc-lv').textContent = S.len + ' m'; q('.lc-tv').textContent = S.tc + ' °C';
    $$('[data-wr]', host).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.wr === S.wires)));
    if (r.W >= 400 && r.W <= 500) S.seen.add('full'); if (Math.abs(S.tc - 20) >= 25) S.seen.add('w' + S.wires);
    if (S.seen.has('full') && S.seen.has('w4') && S.seen.has('w6')) fin();
    return r;
  }
  onAct(host, '[data-add]', b => { const v = +b.dataset.add; if (v > 0){ if (load() + v > 700){ q('.lc-msg').innerHTML = '<b>That\'s enough!</b> We won\'t load the cell beyond 140 % so it does not deform.'; return; } S.w.push(v); } else if (v < 0) S.w.pop(); else S.w = []; ui(); });
  onAct(host, '[data-wr]', b => { S.wires = +b.dataset.wr; ui(); });
  q('.lc-l').addEventListener('input', e => { S.len = +e.target.value; ui(); });
  q('.lc-t').addEventListener('input', e => { S.tc = +e.target.value; ui(); });
  ui();
  return {S, ui, calc, set(o){ Object.assign(S, o); return ui(); }};
};

/* ---- weighing indicator calibration ---- */
C.indCal = function(){ /* pure state machine; returns object with step(action, arg) */
  const CAP = 500, DEAD = 38.4, SENS = 2, VEX = 10, NOISE = 0;
  const M = {state:'run', cap:null, z:null, k:null, load:0, err:'', ok:false, verZero:false, verLoad:false, factory:{z:0.6, k:CAP / (SENS * VEX)}};
  const mv = () => C.lcMv(DEAD + M.load, 1000, SENS, VEX, 0) + NOISE; /* hopper 38.4 kg dead load; cell 1000 kg capacity */
  const cal = () => M.z != null && M.k != null ? {z:M.z, k:M.k} : M.factory;
  M.mv = mv;
  M.display = () => { if (M.state === 'cap') return 'CAP ?'; if (M.state === 'zero') return 'ZERO ?'; if (M.state === 'span') return 'LOAD ?'; const w = C.weigh(cal(), mv()); return fmt(Math.round(w * 2) / 2, 1); };
  M.weight = () => C.weigh(cal(), mv());
  M.step = function(a, arg){
    M.err = '';
    if (a === 'cal'){ M.state = 'cap'; M.ok = false; M.verZero = M.verLoad = false; return 'Enter the scale capacity from the nameplate.'; }
    if (a === 'cap'){ if (M.state !== 'cap'){ M.err = 'Enter the calibration menu (CAL) first.'; return M.err; } if (arg !== CAP){ M.err = `Wrong capacity. The scale nameplate says <b>Max ${CAP} kg</b>.`; return M.err; } M.cap = arg; M.state = 'zero'; return 'Empty the scale (the bare hopper, no weights), wait for the reading to settle, and press ZERO.'; }
    if (a === 'zero'){ if (M.state !== 'zero'){ M.err = M.state === 'run' ? 'This is the calibration ZERO key. Enter CAL and the capacity first.' : 'You have not entered the capacity yet.'; return M.err; } if (M.load !== 0){ M.err = '<b>Procedure error:</b> there are weights on the scale! The zero point must be taken with the scale empty, otherwise every reading will be short by that weight.'; return M.err; } M.z = mv(); M.state = 'span'; return 'Place the known test weight, type its value, and press SPAN.'; }
    if (a === 'span'){ if (M.state !== 'span'){ M.err = M.state === 'zero' ? '<b>Procedure error:</b> do ZERO first, then SPAN.' : 'Enter CAL first.'; return M.err; }
      if (!(arg > 0)){ M.err = 'Type the test weight value.'; return M.err; }
      if (M.load === 0){ M.err = 'There is no weight on the scale! Place the test weight first.'; return M.err; }
      if (Math.abs(arg - M.load) > 0.01){ M.err = `<b>The value you typed (${arg} kg) is not the weight on the scale (${M.load} kg).</b> If you carry on like this, every reading will be off by ${fmt((arg / M.load - 1) * 100, 1)} %.`; return M.err; }
      if (M.load < CAP * 0.2){ M.err = `<b>The test weight is too small</b> (${M.load} kg = ${fmt(M.load / CAP * 100, 0)} % of capacity). Any small error gets multiplied at full capacity. Use at least 20 % of capacity (ideally 50–100 %).`; return M.err; }
      M.k = arg / (mv() - M.z); M.state = 'run'; M.ok = true; return 'Done: the calibration is stored. Now <b>verify</b>: remove all the weights (must read 0), then put on a different weight (must read correctly).'; }
    if (a === 'exit'){ M.state = 'run'; return 'Left calibration without saving.'; }
    if (a === 'load'){ M.load = arg; if (M.ok && M.state === 'run'){ const w = M.weight(); if (M.load === 0 && Math.abs(w) < 0.3) M.verZero = true; if (M.load > 0 && Math.abs(w - M.load) <= Math.max(0.5, M.load * 0.002)) M.verLoad = true; } return ''; }
    return '';
  };
  return M;
};
IL.indicator = function(host, opt){
  opt = opt || {}; const L = opt.lesson, g = U('in');
  const M = C.indCal(); const S = {w:[]};
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg class="in-svg" viewBox="0 0 360 250" role="img" aria-label="A hopper on a load cell and a weighing indicator"></svg></div>
  <div class="mm-side"><ol class="steps-l in-steps"><li>Press <b>CAL</b>, type the <b>capacity</b> from the nameplate, and press <b>ENTER</b></li><li><b>ZERO</b> with the scale empty</li><li>Place a known test weight, type it, and press <b>SPAN</b></li><li>Verify: empty = 0</li><li>Verify: a different weight reads correctly</li></ol></div></div>
  <div class="wd-ctl"><button type="button" class="btn pri" data-k="cal">CAL</button><button type="button" class="btn" data-k="ent">ENTER</button><button type="button" class="btn" data-k="zero">ZERO</button><button type="button" class="btn" data-k="span">SPAN</button><button type="button" class="btn" data-k="tare">TARE</button><button type="button" class="btn" data-k="exit">EXIT</button></div>
  <div class="wd-ctl"><label style="flex:1 1 100%">Number (capacity or test weight, kg): <input type="number" class="in-n" inputmode="decimal" value="" placeholder="e.g. 500" aria-label="Number"></label></div>
  <div class="wd-ctl"><span style="flex:1 1 100%;font-size:.9rem">Certified test weights (M1):</span><button type="button" class="btn" data-a="20"><span class="eq">+20 kg</span></button><button type="button" class="btn" data-a="50"><span class="eq">+50 kg</span></button><button type="button" class="btn" data-a="100"><span class="eq">+100 kg</span></button><button type="button" class="btn" data-a="-1">Remove last weight</button><button type="button" class="btn" data-a="0">Unload</button></div>
  <div class="statline in-st" aria-live="polite"></div>
  <p class="chal in-chal">Challenge: do the whole calibration <b>in the right order</b>, then verify with steps 4 and 5.</p>`;
  const q = s => $(s, host), fin = chal(host, '.in-chal', L, 'cal');
  let tare = 0;
  function draw(){
    const disp = M.state === 'run' ? fmt(Math.round((M.weight() - tare) * 2) / 2, 1) : M.display();
    let s = ART.defs(g);
    s += `<path d="M20 30h120l-20 70H40z" fill="url(#${g}mh)" stroke="#5d6469" stroke-width="1.4"/><rect x="24" y="22" width="112" height="10" rx="2" fill="#7f8a92"/><text x="80" y="64" text-anchor="middle" class="svg-ar" style="font-size:10px;font-weight:700;fill:#1c2125">Hopper</text><text x="80" y="78" text-anchor="middle" style="font:600 8px var(--font-mono);fill:#1c2125">Max 500 kg</text>`;
    s += `<rect x="40" y="100" width="80" height="8" fill="#5d6469"/><g transform="translate(46 108) scale(.62)">${ART.beam({g})}</g><rect x="20" y="150" width="140" height="10" rx="2" fill="#5d6469"/>`;
    let y = 30; S.w.forEach(w => { const h = w >= 100 ? 14 : w >= 50 ? 11 : 8, wd = w >= 100 ? 56 : w >= 50 ? 44 : 32; y -= h; s += `<rect x="${80 - wd / 2}" y="${y}" width="${wd}" height="${h - 1}" rx="2" fill="#3a4248" stroke="#1c2125"/><text x="80" y="${y + h / 2 + 3}" text-anchor="middle" style="font:700 7px var(--font-mono);fill:#e9edf0">${w}</text>`; });
    s += `<path d="M60 170C100 200 160 200 168 150" fill="none" stroke="#3a3f44" stroke-width="5"/>`;
    s += `<g transform="translate(168 60)">${ART.indicator({g, disp})}</g>`;
    s += `<text x="263" y="200" text-anchor="middle" style="font:600 9px var(--font-mono)" class="w-mu">${M.state === 'run' ? (M.ok ? 'CAL OK' : 'FACTORY / NOT CALIBRATED') : 'CAL MODE'}${tare ? ' · TARE ' + fmt(tare, 1) : ''}</text>`;
    s += `<text x="263" y="216" text-anchor="middle" style="font:600 9px var(--font-mono)" class="w-mu">cell: ${fmt(M.mv(), 3)} mV</text>`;
    q('.in-svg').innerHTML = s;
    const stepIdx = M.state === 'cap' ? 0 : M.state === 'zero' ? 1 : M.state === 'span' ? 2 : M.ok ? (M.verZero && M.verLoad ? 5 : M.verZero ? 4 : 3) : -1;
    $$('.in-steps li', host).forEach((li, i) => { li.className = i < stepIdx || stepIdx === 5 ? 'ok' : i === stepIdx ? 'cur' : ''; });
    if (M.ok && M.verZero && M.verLoad) fin();
  }
  function say(t, bad){ const st = q('.in-st'); st.className = 'statline in-st ' + (bad ? 'bad' : M.ok && M.verZero && M.verLoad ? 'ok' : ''); st.innerHTML = t || ''; }
  const total = () => S.w.reduce((a, b) => a + b, 0);
  onAct(host, '[data-k]', b => {
    const k = b.dataset.k, n = num(q('.in-n').value);
    if (k === 'tare'){ if (M.state !== 'run'){ say('TARE is not part of the calibration.', true); return; } tare = M.weight(); say('<b>TARE:</b> the scale subtracted the current weight (like an empty drum) and shows the net. This is not the calibration ZERO: tare is cleared and does not change the calibration.'); draw(); return; }
    if (k === 'cal') tare = 0;
    let a = k;
    if (k === 'ent') a = M.state === 'cap' ? 'cap' : M.state === 'span' ? 'span' : M.state === 'zero' ? 'zero' : 'none';
    if (a === 'none'){ say('ENTER confirms the number inside the calibration menu. Press CAL first.', true); return; }
    const t = M.step(a, a === 'cap' || a === 'span' ? n : undefined); say(t, !!M.err);
    if (a === 'cap' && !M.err) q('.in-n').value = '';
    draw();
  });
  onAct(host, '[data-a]', b => { const v = +b.dataset.a; if (v > 0){ if (total() + v > 500){ say('That would exceed the scale capacity.', true); return; } S.w.push(v); } else if (v < 0) S.w.pop(); else S.w = []; M.step('load', total()); if (M.ok && M.state === 'run') say(M.verZero && M.verLoad ? '<b>Calibration complete and verified.</b> Zero reads zero and the second weight reads correctly.' : M.verZero ? 'Zero is fine. Put on a different weight (different from the test weight if you can) and verify.' : 'Empty the scale and check that it reads 0.'); draw(); });
  say('The scale is new and not calibrated (it reads wrong numbers). Follow the steps next to the drawing.');
  draw();
  return {M, S, press(k, n){ if (k === 'cap') k = 'ent'; if (n != null) q('.in-n').value = n; host.querySelector(`[data-k="${k}"]`).click(); return M.err; }, add(v){ host.querySelector(`[data-a="${v}"]`).click(); }, get disp(){ return M.state === 'run' ? M.weight() - tare : M.display(); }};
};

/* ---- load cell diagnosis with a multimeter ---- */
IL.LC_FAULTS = [['', 'Healthy'], ['overload', 'Overloaded (zero shifted)'], ['moisture', 'Moisture / water (low insulation)'], ['sense', 'Sense wire broken'], ['weld', 'Burnt bridge (welding current passed through it)'], ['sig', 'Signal wire broken']];
IL.lcDiag = function(host, opt){
  opt = opt || {}; const L = opt.lesson, g = U('ld');
  const cells = shuffle(['', 'overload', 'moisture', 'sense', 'weld']).map((f, i) => ({f, n:i + 1, solved:false}));
  const S = {c:0, mode:'ohm', red:null, blk:null};
  host.innerHTML = `<div class="tabs" role="group" aria-label="Choose the cell">${cells.map((c, i) => `<button type="button" class="btn" data-c="${i}" aria-pressed="${i === 0}">Cell ${c.n}</button>`).join('')}</div>
  <div class="sim-grid two-col"><div class="wd-art"><svg class="ld-svg" viewBox="0 0 360 256" role="group" aria-label="Load cell cable terminals in the junction box, and a multimeter"></svg></div>
  <div class="mm-side"><div class="tabs" role="group" aria-label="Meter mode"><button type="button" class="btn" data-m="ohm" aria-pressed="true">Ω (cell disconnected)</button><button type="button" class="btn" data-m="mv" aria-pressed="false">mV DC (connected, 10V excitation)</button></div>
  <p class="msg ld-msg" aria-live="polite">Tap a terminal to place the <b style="color:#d32f2f">red probe</b>, then another terminal for the <b>black</b>.</p>
  <div class="box" style="font-size:.88rem"><b>Expected (350 Ω cell, 2 mV/V):</b><ul style="margin:4px 0 0;padding-inline-start:18px"><li>+EXC ↔ −EXC: <span class="eq">≈ 390 Ω</span></li><li>+SIG ↔ −SIG: <span class="eq">≈ 350 Ω</span></li><li>+SEN ↔ +EXC: <span class="eq">≈ 1 Ω</span> (wire only)</li><li>Any wire ↔ SHLD: <span class="eq">OL</span></li><li>Zero balance (mV, no load): <span class="eq">&lt; ±0.2 mV</span></li></ul></div></div></div>
  <div class="ld-dx"></div>
  <p class="chal ld-chal">Challenge: diagnose at least <b>4 of the 5 cells</b> correctly. Measure before you decide.</p>`;
  const q = s => $(s, host), fin = chal(host, '.ld-chal', L, 'lcdiag');
  const TP = {}; C.LC_TERMS.forEach((t, i) => { TP[t[0]] = [36 + i * 46, 200, t[1], t[2]]; });
  function reading(){
    const c = cells[S.c];
    if (!S.red || !S.blk) return '----';
    const v = C.lcMeter(c.f, S.mode, S.red, S.blk, 0);
    if (S.mode === 'ohm') return v === Infinity ? 'OL' : v >= 1e6 ? fmt(v / 1e6, 2) + ' MΩ' : v >= 1000 ? fmt(v / 1000, 3) + ' kΩ' : fmt(v, 1) + ' Ω';
    if (isNaN(v)) return '?? (unstable)';
    return fmt(v, 2) + ' mV';
  }
  function draw(){
    const rd = reading();
    let s = `<rect x="8" y="160" width="344" height="92" rx="8" fill="#d7dde1" stroke="#5d6469"/><text x="180" y="246" text-anchor="middle" class="svg-ar" style="font-size:10px;font-weight:700;fill:#1c2125">Junction box terminals · cell ${cells[S.c].n}</text>`;
    C.LC_TERMS.forEach(([k, lab, col]) => { const [x, y] = TP[k]; s += `<rect x="${x - 16}" y="${y - 14}" width="32" height="28" rx="3" fill="#3a4248"/>${screw(x, y, 7)}<path d="M${x} ${y + 14}V${y + 30}" stroke="${col}" stroke-width="5"/><text x="${x}" y="${y - 20}" text-anchor="middle" style="font:700 9px var(--font-mono);fill:#1c2125">${lab}</text><circle data-t="${k}" cx="${x}" cy="${y}" r="17" fill="transparent" tabindex="0" role="button" aria-label="Terminal ${lab}" style="cursor:pointer"/>`; });
    s += `<g transform="translate(120 6)"><rect width="120" height="120" rx="12" fill="#f2b705" stroke="#6b5200"/><rect x="10" y="10" width="100" height="40" rx="4" fill="#c7d3b4"/><text x="104" y="38" text-anchor="end" style="font:700 ${rd.length > 9 ? 12 : 17}px var(--font-mono);fill:#1b2410">${esc(rd.replace(' (unstable)', ''))}</text><text x="14" y="62" style="font:700 9px var(--font-mono);fill:#3b2d00">${S.mode === 'ohm' ? 'Ω' : 'mV DC'}</text><circle cx="60" cy="88" r="16" fill="#2a3035"/><path d="M60 88l${S.mode === 'ohm' ? '-11 -8' : '11 -8'}" stroke="#f2b705" stroke-width="3"/><circle cx="34" cy="110" r="5" fill="#d32f2f"/><circle cx="86" cy="110" r="5" fill="#1c2125"/></g>`;
    if (S.red){ const [x, y] = TP[S.red]; s += `<path d="M154 116C150 140 ${x} 130 ${x} ${y - 8}" fill="none" stroke="#d32f2f" stroke-width="3"/><circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#d32f2f" stroke-width="3"/>`; }
    if (S.blk){ const [x, y] = TP[S.blk]; s += `<path d="M206 116C210 140 ${x} 130 ${x} ${y - 8}" fill="none" stroke="#1c2125" stroke-width="3"/><circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#1c2125" stroke-width="3"/>`; }
    q('.ld-svg').innerHTML = s;
    $$('[data-c]', host).forEach((b, i) => { b.setAttribute('aria-pressed', String(i === S.c)); b.classList.toggle('done', cells[i].solved); });
    $$('[data-m]', host).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === S.mode)));
    const c = cells[S.c];
    q('.ld-dx').innerHTML = `<div class="mm-diag"><b>Your diagnosis for cell ${c.n}:</b><div class="opts">${IL.LC_FAULTS.map(f => `<button type="button" class="btn" data-dx="${f[0]}"${c.ans != null ? ' disabled' : ''}>${f[1]}</button>`).join('')}</div><p class="qz-f ld-f" aria-live="polite"></p></div>`;
    if (c.ans != null){ $$('[data-dx]', host).forEach(b => { if (b.dataset.dx === c.f) b.classList.add('ok'); else if (b.dataset.dx === c.ans) b.classList.add('no'); }); const f = q('.ld-f'); f.className = 'qz-f ld-f ' + (c.solved ? 'ok' : 'no'); f.innerHTML = (c.solved ? 'Correct. ' : 'Not that. ') + WHY[c.f]; }
    if (cells.filter(x => x.solved).length >= 4) fin();
    return rd;
  }
  const WHY = {'':'All readings are normal: input about 390, output about 350, insulation OL, and zero close to nothing. The problem is elsewhere (the indicator or the mechanics).',
    overload:'The resistances are close to normal, but the <b>zero balance</b> with no load is about <b>5 mV</b> (a quarter of the range!) and the resistance from EXC+ to SIG+ differs from EXC+ to SIG−. The cell was deformed by an overload or a knock. It must be replaced.',
    moisture:'The main resistances are fine, but between any wire and the shield/body there is <b>about 1 MΩ</b> instead of OL. Water or moisture has got into the cell or cable: the reading will drift with the weather. Try drying the cable; if it stays, it is the cell.',
    sense:'+SEN to +EXC = <b>OL</b> instead of a wire resistance. The sense wire is broken: the indicator shows an error or a wrong reading. Repair the wire, or as a temporary fix put a sense–excitation jumper at the indicator (it becomes 4-wire).',
    weld:'Input and output are far off 390 and 350, and the mV is very strange. The bridge is burnt: most likely someone welded on the frame and the welding current passed through the cell. The rule: <b>before welding, disconnect the cells or bypass them with an earth cable</b>.',
    sig:'The signal wire is broken.'};
  function tapT(k){ if (!S.red || (S.red && S.blk)){ S.red = k; S.blk = null; } else if (k !== S.red) S.blk = k; const rd = draw(); q('.ld-msg').innerHTML = S.red && S.blk ? `Red on <b>${TP[S.red][2]}</b> and black on <b>${TP[S.blk][2]}</b> ⇒ <b class="eq">${esc(rd)}</b>` : `Red on <b>${TP[S.red][2]}</b>. Tap a terminal for the black.`; }
  onAct(host, '[data-t]', t => tapT(t.dataset.t));
  onAct(host, '[data-c]', b => { S.c = +b.dataset.c; S.red = S.blk = null; draw(); q('.ld-msg').innerHTML = 'Tap a terminal for the red probe.'; });
  onAct(host, '[data-m]', b => { S.mode = b.dataset.m; draw(); if (S.red && S.blk) tapT(S.blk); });
  onAct(host, '[data-dx]', b => { const c = cells[S.c]; if (c.ans != null) return; c.ans = b.dataset.dx; c.solved = c.ans === c.f; draw(); });
  draw();
  return {cells, S, measure(a, b, mode){ S.mode = mode || S.mode; S.red = a; S.blk = b; return draw(); }, pick(i){ S.c = i; draw(); }, dx(f){ const b = host.querySelector(`[data-dx="${f}"]`); if (b) b.click(); }};
};

/* ================= L9: hydrostatic / DP level tank ================= */
IL.LIQ = [['water', 'Water', 1000], ['diesel', 'Diesel', 840], ['milk', 'Milk', 1030], ['brine', 'Brine', 1200], ['acid', 'Sulphuric acid 98 %', 1840]];
/* pure: tank model. o = {h (m), rho, rhoCfg, closed (gas pressure Pa), dp (true = DP with low side on the gas space)} */
C.levelSim = function(o){
  const span = C.hydroP(4, o.rhoCfg); /* transmitter range 0 … 4 m of the configured liquid */
  const pBot = C.hydroP(o.h, o.rho) + (o.closed || 0);
  const meas = o.dp ? pBot - (o.closed || 0) : pBot;
  const mA = clamp(4 + meas / span * 16, 3.8, 20.5);
  const shown = C.hydroH(clamp(meas, -1e9, 1e9), o.rhoCfg);
  return {pBot, meas, mA, shown: clamp(shown, 0, 4.1), err:clamp(shown, -1, 4.1) - o.h, span};
};
IL.levelTank = function(host, opt){
  opt = opt || {}; const L = opt.lesson, g = U('lv');
  const S = {h:2.5, liq:'water', cfgRight:false, closed:false, dp:false, seen:new Set()};
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg class="lv-svg" viewBox="0 0 290 290" role="img" aria-label="A tank of liquid with a pressure-type level transmitter at the bottom"></svg></div>
  <div class="mm-side"><div class="read lv-read"></div><div class="statline lv-st" aria-live="polite"></div></div></div>
  <div class="wd-ctl"><label>Actual level: <b class="lv-hv"></b><input type="range" class="lv-h" min="0" max="4" step="0.05" value="2.5" aria-label="Level"></label>
   <label style="flex:1 1 100%">Liquid in the tank: <select class="inp lv-liq">${IL.LIQ.map(l => `<option value="${l[0]}">${l[1]} (ρ = ${l[2]} kg/m³)</option>`).join('')}</select></label></div>
  <div class="flt"><button type="button" class="btn" data-k="cfg" aria-pressed="false">Set the right density in the transmitter</button><button type="button" class="btn" data-k="closed" aria-pressed="false">Closed tank with 0.2 bar pressure</button><button type="button" class="btn" data-k="dp" aria-pressed="false">Use a DP transmitter (low side to the top)</button></div>
  <p class="msg lv-msg" aria-live="polite"></p>
  <p class="chal lv-chal">Challenge: (1) change the liquid to <b>diesel</b> or <b>acid</b> while the transmitter is still set for water, and see the error. (2) Close the tank under pressure, see how the plain transmitter goes wrong, and fix it with <b>DP</b>.</p>`;
  const q = s => $(s, host), fin = chal(host, '.lv-chal', L, 'lvl');
  const liq = () => IL.LIQ.find(l => l[0] === S.liq);
  function ui(){
    const rho = liq()[2], rhoCfg = S.cfgRight ? rho : 1000, closed = S.closed ? 20000 : 0;
    const r = C.levelSim({h:S.h, rho, rhoCfg, closed, dp:S.dp});
    const X = 40, Y = 30, W = 150, H = 200, yL = Y + H - S.h / 4 * H, col = {water:'#3a8fd8', diesel:'#c9a43a', milk:'#eef1f3', brine:'#7fb8c9', acid:'#8e9a4a'}[S.liq];
    let s = ART.defs(g);
    s += `<rect x="${X}" y="${yL}" width="${W}" height="${Y + H - yL}" fill="${col}" opacity=".85"/><path d="M${X} ${yL}h${W}" stroke="#fff" stroke-width="1.5" opacity=".7"/>`;
    s += `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${S.closed ? 4 : 0}" fill="none" stroke="#5d6469" stroke-width="4"/>${S.closed ? `<path d="M${X} ${Y}h${W}" stroke="#5d6469" stroke-width="6"/><text x="${X + W / 2}" y="${Y + 16}" text-anchor="middle" style="font:700 10px var(--font-mono);fill:var(--warn)">N₂ 0.2 bar</text>` : `<path d="M${X - 2} ${Y}h12M${X + W - 10} ${Y}h12" stroke="#5d6469" stroke-width="4"/><text x="${X + W / 2}" y="${Y + 14}" text-anchor="middle" class="svg-ar w-mu" style="font-size:10px">Open to air</text>`}`;
    for (let m = 0; m <= 4; m++){ const y = Y + H - m / 4 * H; s += `<path d="M${X - 8} ${y}h8" class="w-in"/><text x="${X - 10}" y="${y + 4}" text-anchor="end" style="font:600 9px var(--font-mono)" class="w-tx">${m} m</text>`; }
    const bx = 196, by = Y + H + 20;
    s += `<path d="M${X + 20} ${Y + H}V${by + 11}H${bx}" fill="none" stroke="#7f8a92" stroke-width="5"/>`;
    if (S.dp) s += `<path d="M${X + W} ${Y + 8}H262V${by + 11}H${bx + 44}" fill="none" stroke="#7f8a92" stroke-width="4" stroke-dasharray="${S.closed ? '' : '6 4'}"/><text x="268" y="${Y + 120}" style="font:700 9px var(--font-mono);fill:var(--muted)" transform="rotate(90 268 ${Y + 120})">LOW side</text>`;
    s += `<rect x="${bx}" y="${by}" width="44" height="22" rx="3" fill="url(#${g}mh)" stroke="#5d6469"/><text x="${bx + 6}" y="${by + 15}" style="font:700 8px var(--font-mono);fill:#1c2125">H</text><text x="${bx + 38}" y="${by + 15}" text-anchor="end" style="font:700 8px var(--font-mono);fill:#1c2125">L</text>`;
    s += `<rect x="${bx + 17}" y="${by - 10}" width="10" height="10" fill="url(#${g}mh)" stroke="#5d6469"/><rect x="${bx - 4}" y="${by - 40}" width="52" height="32" rx="9" fill="url(#${g}b)" stroke="#173d66"/><circle cx="${bx + 22}" cy="${by - 24}" r="12" fill="#b8c7a2" stroke="#3e4a33"/><text x="${bx + 22}" y="${by - 21}" text-anchor="middle" style="font:700 7.5px var(--font-mono);fill:#16210c">${fmt(r.shown, 2)}</text>`;
    s += `<text x="${bx + 22}" y="${by + 36}" text-anchor="middle" style="font:700 10px var(--font-mono)" class="w-tx">LT-301 ${S.dp ? 'DP' : 'GAUGE'}</text>`;
    s += `<text x="${X + W / 2}" y="${Math.max(Y + 30, yL - 6)}" text-anchor="middle" style="font:700 10px var(--font-mono)" class="w-tx">${fmt(S.h, 2)} m</text>`;
    q('.lv-svg').innerHTML = s;
    q('.lv-read').innerHTML = `<div><span>Pressure at the bottom</span><b>${fmt(r.pBot / 1000, 2)} kPa</b></div><div><span>Transmitter measures</span><b>${fmt(r.meas / 1000, 2)} kPa</b></div><div><span>Output</span><b>${fmt(r.mA, 2)} mA</b></div><div><span>Level in the PLC</span><b class="${Math.abs(r.err) > 0.02 ? 'bad' : 'ok'}">${fmt(r.shown, 2)} m</b></div>`;
    const st = q('.lv-st'), bad = Math.abs(r.err) > 0.02; st.className = 'statline lv-st ' + (bad ? 'bad' : 'ok');
    st.innerHTML = `<span class="eq">P = ρ·g·h = ${rho} × 9.81 × ${fmt(S.h, 2)} = ${fmt(C.hydroP(S.h, rho) / 1000, 2)} kPa</span>${bad ? ` · error <b class="eq">${r.err > 0 ? '+' : ''}${fmt(r.err * 100, 0)} cm</b>` : ''}`;
    let m; const rhoMsg = !S.cfgRight && liq()[2] !== 1000 ? ` <b>On top of that</b>, the transmitter is set for water density and the liquid's density is ${liq()[2]}, so the level reads ${liq()[2] > 1000 ? 'higher' : 'lower'} than the real one.` : '';
    q('.lv-liq').value = S.liq;
    if (S.closed && !S.dp) m = '<b>The tank is closed with gas pressure on top:</b> a plain (gauge) transmitter measures the liquid pressure <b>+ the gas pressure</b> above it. 0.2 bar = 20 kPa = about <b>2 metres of extra water</b>! The fix: a <b>DP</b> transmitter: high side at the bottom, low side connected to the space above the liquid, so the gas pressure cancels out.' + rhoMsg;
    else if (S.closed && S.dp) m = '<b>DP:</b> the low side sees only the gas pressure, the high side sees gas + liquid. The difference = the liquid only. This is the right fix for closed tanks and boilers.' + rhoMsg;
    else if (!S.cfgRight && liq()[2] !== 1000) m = `<b>The transmitter is set for water density (1000)</b> and the liquid's density is ${liq()[2]}. Pressure is what gets measured, so the calculated level = <span class="eq">P ÷ (1000 × g)</span>. ${liq()[2] > 1000 ? 'Heavier liquid ⇒ the reading is <b>higher</b> than reality, and the PLC may stop the pump early.' : 'Lighter liquid ⇒ the reading is <b>lower</b> than reality, and the tank may <b>overflow</b> while the PLC thinks there is still room!'}`;
    else m = 'Hydrostatic measurement measures <b>pressure</b>, not level. The density must be known and constant. If the density changes (mixing, temperature, foam), use radar or load cells.';
    q('.lv-msg').innerHTML = m;
    q('.lv-hv').textContent = fmt(S.h, 2) + ' m';
    $$('[data-k]', host).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === 'cfg' ? S.cfgRight : S[b.dataset.k])));
    if (!S.cfgRight && Math.abs(liq()[2] - 1000) > 100 && S.h > 0.5) S.seen.add('rho');
    if (S.closed && !S.dp) S.seen.add('cg'); if (S.closed && S.dp) S.seen.add('cdp');
    if (S.seen.has('rho') && S.seen.has('cg') && S.seen.has('cdp')) fin();
    return r;
  }
  q('.lv-h').addEventListener('input', e => { S.h = +e.target.value; ui(); });
  q('.lv-liq').addEventListener('change', e => { S.liq = e.target.value; ui(); });
  onAct(host, '[data-k]', b => { const k = b.dataset.k; if (k === 'cfg') S.cfgRight = !S.cfgRight; else S[k] = !S[k]; ui(); });
  ui();
  return {S, ui, set(o){ Object.assign(S, o); return ui(); }};
};
IL.PICK = [
  {q:'Flow of <b>demineralised (DM) water</b> in a boiler house. Which flowmeter will <b>not</b> work?', o:['Magnetic (electromagnetic)', 'Vortex', 'Coriolis', 'Ultrasonic'], a:0, why:'A magmeter needs a conductive liquid (above about 5 µS/cm), and demineralised water is far below that.'},
  {q:'Flow of <b>sewage / slurry</b> containing sand:', o:['Magnetic', 'Turbine', 'Orifice DP', 'Vortex'], a:0, why:'A magmeter has nothing inside the pipe, so nothing can block or wear.'},
  {q:'<b>Steam</b> flow to a boiler:', o:['Vortex or orifice DP', 'Magnetic', 'Small Coriolis', 'Load cell'], a:0, why:'Vortex and DP meters work very well with steam and gases.'},
  {q:'A chemical dose must be measured <b>in kilograms (mass flow)</b> with high accuracy:', o:['Coriolis', 'Vortex', 'Orifice', 'Float switch'], a:0, why:'Coriolis measures mass directly (and density too).'},
  {q:'Level of <b>powder or plastic pellets</b> in a tall silo:', o:['Radar (80 GHz or guided wave)', 'Pressure transmitter at the bottom', 'Float', 'Magnetic'], a:0, why:'Pressure does not work with solids; radar measures the distance to their surface.'},
  {q:'Level in a <b>closed, pressurised tank</b> (vessel):', o:['DP transmitter', 'Gauge pressure transmitter at the bottom only', 'Float switch', 'Thermocouple'], a:0, why:'DP cancels the gas pressure above.'},
  {q:'Protecting a pump against <b>running dry</b>:', o:['Low level switch (LSL)', 'Encoder', 'PT100', 'Load cell'], a:0, why:'A simple ON/OFF signal stops the pump when the level drops.'},
  {q:'Level in a tank with <b>a lot of foam</b>:', o:['Guided wave radar or a pressure transmitter (if the density is constant)', 'Ultrasonic', 'Photoelectric', 'Proximity'], a:0, why:'Foam absorbs the ultrasonic echo, so it reads wrong or loses the signal.'},
  {q:'Weighing a mixing tank with <b>materials of changing density</b> and an agitator:', o:['Load cells under the tank legs', 'Pressure transmitter', 'Float', 'Capacitive'], a:0, why:'Load cells weigh the mass itself whatever the density or foam.'},
  {q:'Flow through an <b>orifice + DP</b>. The flow doubles. The differential pressure:', o:['Goes up 4 times', 'Doubles', 'Falls', 'Stays the same'], a:0, why:'Q ∝ √ΔP ⇒ ΔP ∝ Q². That is why DP flow needs square root extraction.'}
];

/* ================= L10: 5-point calibration (as-found / as-left) ================= */
C.txOut = (p, cal) => 4 + (p / 10) * 16 * (1 + cal.gain) + cal.zero; /* ⁦0⁠–⁠10 bar⁩ transmitter with zero (mA) and gain (fraction) errors */
IL.calTable = function(host, opt){
  opt = opt || {}; const L = opt.lesson, TOL = 0.25, PTS = [0, 25, 50, 75, 100];
  const S = {cal:{zero:0.10, gain:-0.012}, phase:'found', applied:null, found:{}, left:{}, judged:null};
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg class="ct-svg" viewBox="0 0 360 200" role="img" aria-label="A pressure calibrator connected to a transmitter"></svg></div>
  <div class="mm-side"><div class="statline ct-st" aria-live="polite"></div><div class="chips-t ct-pts">${PTS.map(p => `<button type="button" class="btn" data-p="${p}"><span class="eq">${p} % · ${p / 10} bar</span></button>`).join('')}</div>
  <div class="wd-ctl ct-adj"><button type="button" class="btn" data-a="zero">Zero trim</button><button type="button" class="btn" data-a="span">Span trim</button></div></div></div>
  <div class="tblw"><table class="tbl ct-tab"></table></div>
  <div class="ct-judge"></div>
  <p class="msg ct-msg" aria-live="polite"></p>
  <p class="chal ct-chal">Challenge: record the <b>as-found</b> at 5 points, judge Pass or Fail (tolerance ±${TOL} % of span), do a zero and span trim, and record an <b>as-left</b> that is all Pass.</p>`;
  const q = s => $(s, host), fin = chal(host, '.ct-chal', L, 'caltab');
  const ideal = p => 4 + p / 100 * 16;
  const read = p => C.txOut(p / 10, S.cal);
  function draw(){
    const p = S.applied, mA = p == null ? null : read(p);
    let s = `<g transform="translate(10 20)"><rect width="120" height="160" rx="12" fill="#e9b500" stroke="#6b5200"/><rect x="10" y="10" width="100" height="62" rx="4" fill="#c7d3b4"/>
      <text x="16" y="26" style="font:600 8px var(--font-mono);fill:#3b2d00">SOURCE P</text><text x="104" y="40" text-anchor="end" style="font:700 14px var(--font-mono);fill:#1b2410">${p == null ? '---' : fmt(p / 10, 3) + ' bar'}</text>
      <text x="16" y="54" style="font:600 8px var(--font-mono);fill:#3b2d00">MEASURE mA</text><text x="104" y="67" text-anchor="end" style="font:700 14px var(--font-mono);fill:#1b2410">${mA == null ? '---' : fmt(mA, 3)}</text>
      <text x="60" y="94" text-anchor="middle" style="font:700 9px var(--font-mono);fill:#3b2d00">LOOP CALIBRATOR</text>
      <rect x="14" y="104" width="28" height="18" rx="3" fill="#2a3035"/><rect x="46" y="104" width="28" height="18" rx="3" fill="#2a3035"/><rect x="78" y="104" width="28" height="18" rx="3" fill="#2a3035"/>
      <circle cx="34" cy="142" r="6" fill="#d32f2f"/><circle cx="86" cy="142" r="6" fill="#1c2125"/><text x="60" y="146" text-anchor="middle" style="font:600 7px var(--font-mono);fill:#3b2d00">24V LOOP</text></g>`;
    s += `<path d="M130 60H200" stroke="#7f8a92" stroke-width="5" fill="none"/><text x="165" y="52" text-anchor="middle" style="font:600 8px var(--font-mono)" class="w-mu">hose</text>`;
    s += `<path d="M44 182C60 196 250 196 262 150" fill="none" stroke="#d32f2f" stroke-width="2.4"/><path d="M96 182C110 190 240 190 280 150" fill="none" stroke="#1c2125" stroke-width="2.4"/>`;
    s += `<g transform="translate(234 2) scale(.82)">${ART.transmitter({g:'ctg', lcd:mA == null ? '' : fmt(mA, 2), unit:'mA'})}</g>${ART.defs('ctg')}`;
    s += `<text x="283" y="198" text-anchor="middle" style="font:700 9px var(--font-mono)" class="w-tx">PT-101 · ⁦0⁠–⁠10 bar⁩</text>`;
    q('.ct-svg').innerHTML = s;
  }
  function table(){
    const row = (p) => { const f = S.found[p], l = S.left[p], e = v => C.errPct(v, ideal(p)), cell = v => v == null ? '<td>—</td><td>—</td>' : `<td class="mono">${fmt(v, 3)}</td><td class="mono" style="color:${Math.abs(e(v)) <= TOL ? 'var(--good)' : 'var(--bad)'};font-weight:700">${e(v) >= 0 ? '+' : ''}${fmt(e(v), 2)} %</td>`; return `<tr><td class="mono">${p} %<br><small>${fmt(p / 10, 1)} bar</small></td><td class="mono">${fmt(ideal(p), 2)}</td>${cell(f)}${cell(l)}</tr>`; };
    q('.ct-tab').innerHTML = `<thead><tr><th rowspan="2">Point</th><th rowspan="2">Expected mA</th><th colspan="2">As-found</th><th colspan="2">As-left</th></tr><tr><th>mA</th><th>Error %</th><th>mA</th><th>Error %</th></tr></thead><tbody>${PTS.map(row).join('')}</tbody>`;
  }
  const allIn = o => PTS.every(p => o[p] != null);
  const passes = o => PTS.every(p => Math.abs(C.errPct(o[p], ideal(p))) <= TOL);
  function status(t, c){ const st = q('.ct-st'); st.className = 'statline ct-st ' + (c || ''); st.innerHTML = t; }
  function ui(){
    draw(); table();
    const adj = S.phase === 'adjust' || S.phase === 'left';
    $$('[data-a]', host).forEach(b => b.disabled = !adj);
    if (S.phase === 'found') status(`<b>1) As-found:</b> apply each of the five points and record the reading as it is, <b>before any adjustment</b>. (${Object.keys(S.found).length}/5)`);
    if (S.phase === 'judge'){ status('<b>2) Judge:</b> is the transmitter as-found within tolerance or not?'); q('.ct-judge').innerHTML = `<div class="mm-diag"><b>As-found result:</b><div class="opts"><button type="button" class="btn" data-j="pass">Pass: all within ±${TOL} %</button><button type="button" class="btn" data-j="fail">Fail: needs adjustment</button></div></div>`; }
    else q('.ct-judge').innerHTML = '';
    if (S.phase === 'adjust') status('<b>3) Adjust:</b> apply <b>0 %</b> and press <b>Zero trim</b>, then apply <b>100 %</b> and press <b>Span trim</b>.', 'warn');
    if (S.phase === 'left') status(`<b>4) As-left:</b> record the five points again after the adjustment. (${Object.keys(S.left).length}/5)`, 'warn');
    if (S.phase === 'done') status('<b>Done:</b> the as-left is all within tolerance. Write the report (date, calibrator number and its certificate, as-found and as-left) and stick on the calibration label.', 'ok');
  }
  onAct(host, '[data-p]', b => {
    const p = +b.dataset.p; S.applied = p; const v = read(p);
    if (S.phase === 'found'){ S.found[p] = v; if (allIn(S.found)) S.phase = 'judge'; }
    else if (S.phase === 'left'){ S.left[p] = v; if (allIn(S.left)){ if (passes(S.left)){ S.phase = 'done'; fin(); } else { q('.ct-msg').innerHTML = 'Some points are still outside tolerance. Do the zero trim at 0 % and the span trim at 100 % again.'; S.left = {}; S.phase = 'adjust'; } } }
    q('.ct-msg').innerHTML = `You applied <b class="eq">${fmt(p / 10, 2)} bar</b>, the transmitter gave <b class="eq">${fmt(v, 3)} mA</b>, and it should be <span class="eq">${fmt(ideal(p), 3)} mA</span>.`;
    ui();
  });
  onAct(host, '[data-j]', b => {
    const sayFail = b.dataset.j === 'fail', truth = !passes(S.found);
    if (sayFail === truth){ S.phase = 'adjust'; q('.ct-msg').innerHTML = 'Correct: the as-found is a <b>Fail</b>. The zero is high (+0.10 mA = +0.6 %) and the span is low. Record it as it is in the report: the as-found tells the engineers how far off the device was in production.'; }
    else q('.ct-msg').innerHTML = '<b>Look at the error column again:</b> red points are outside ±' + TOL + ' %.';
    ui();
  });
  onAct(host, '[data-a]', b => {
    const a = b.dataset.a;
    if (S.applied == null){ q('.ct-msg').textContent = 'Apply a pressure first.'; return; }
    if (a === 'zero'){ if (S.applied !== 0){ q('.ct-msg').innerHTML = '<b>Zero trim</b> is done with the applied pressure exactly at <b>LRV</b> (0 %). Apply 0 bar first.'; return; } S.cal.zero = 0; q('.ct-msg').innerHTML = 'Zero adjusted: 0 bar ⇒ 4.000 mA.'; }
    if (a === 'span'){ if (S.applied !== 100){ q('.ct-msg').innerHTML = '<b>Span trim</b> is done with the pressure at <b>URV</b> (100 %). Apply 10 bar first.'; return; } if (S.cal.zero !== 0){ q('.ct-msg').innerHTML = 'Do the <b>zero trim</b> first: adjustment starts with zero because its error affects every point.'; return; } S.cal.gain = 0; q('.ct-msg').innerHTML = 'Span adjusted: 10 bar ⇒ 20.000 mA. Record the as-left.'; }
    if (S.cal.zero === 0 && S.cal.gain === 0 && S.phase === 'adjust'){ S.phase = 'left'; S.left = {}; }
    ui();
  });
  ui();
  return {S, apply(p){ host.querySelector(`[data-p="${p}"]`).click(); }, judge(j){ host.querySelector(`[data-j="${j}"]`).click(); }, adj(a){ host.querySelector(`[data-a="${a}"]`).click(); }};
};
IL.FIELD_CASES = [
  {t:'The HMI says −25 %', s:'A 0–10 bar pressure transmitter. The screen shows <b class="eq">−2.5 bar (−25 %)</b> with a wire break alarm.', clues:[['Meter in the loop', 'Current <b class="eq">0.00 mA</b>. Voltage at the transmitter terminals <b class="eq">0 V</b>.']], o:['The loop is open or has no power (loop fuse blown / broken wire)', 'The transmitter needs calibrating', 'Noise', 'Wrong range in the PLC'], a:0, why:'(0 − 4) ÷ 16 = −25 %. Zero current and zero volts at the transmitter = no power reaching it. Check the fuse and the terminals.'},
  {t:'The reading is stuck above 100 %', s:'A level transmitter reads a steady <b class="eq">115 %</b> even with the tank empty, after heavy rain.', clues:[['Meter', 'Current <b class="eq">23.8 mA</b>. The junction box on the route has water in it.']], o:['A short in the cable from water in the junction box', 'The tank really is full', 'A broken wire', 'The shield'], a:0, why:'Above 21 mA and steady = a short or fail-high. Dry out the junction box, reseal it and replace the gland.'},
  {t:'The reading jumps around', s:'A temperature transmitter reading swings ±3 °C every second while the real temperature is steady. It started after a new VFD was installed.', clues:[['Installation', 'The signal cable runs in the same tray as the motor cable, and the shield is grounded at both ends.']], o:['Noise from the VFD cable and a ground loop in the shield', 'Failed sensor', 'Wrong range', 'Weak power supply'], a:0, why:'Separate the cables, ground the shield at one end (for 4–20 mA signals), and use a modest filter in the PLC.'},
  {t:'The reading is low by a fixed ratio', s:'The transmitter display says <b class="eq">8.0 bar</b>, and the PLC shows <b class="eq">5.0 bar</b>. At 0 both read zero.', clues:[['The data', 'Transmitter nameplate: <b class="eq">0–16 bar</b>. Scale block in the PLC: <b class="eq">0–10 bar</b>.']], o:['Wrong scaling in the PLC (should be 0–16)', 'Failed transmitter', 'Loose wire', 'Failed card'], a:0, why:'8 bar on a 16 bar range = 12 mA = 50 %, and the PLC turned that into 50 % of 10 = 5. Make the ranges match.'},
  {t:'The thermocouple reads room temperature', s:'A furnace at 600 °C, and the screen shows an almost steady <b class="eq">32 °C</b>.', clues:[['Inspection', 'You found the two thermocouple wires touching inside a junction box near the panel (the insulation had melted).']], o:['A short in the thermocouple wire at a cool spot, creating a new hot junction there', 'CJC turned off', 'Wrong type', 'Open circuit'], a:0, why:'A thermocouple measures at the first point where its two wires touch. The short created a new "junction" at the box temperature.'},
  {t:'A PT100 reads 7 degrees high', s:'A PT100 on a tank 120 m away, and the reading is always about 7 °C above the hand thermometer.', clues:[['Wiring', 'The cable is 2×1.5 mm² and the instrument is set to <b>2-wire</b>.']], o:['Lead resistance in a 2-wire connection', 'The sensor is Class B', 'Noise', 'CJC'], a:0, why:'Each wire ≈ 0.0175 × 120 ÷ 1.5 = 1.4 Ω ⇒ both wires 2.8 Ω ⇒ 2.8 ÷ 0.385 ≈ 7.3 °C. The fix: 3- or 4-wire, or a head-mounted transmitter.'},
  {t:'The scale drifts', s:'A tank scale: in the morning it reads 0 when empty, and at noon it reads <b class="eq">+35 kg</b>, still empty.', clues:[['Inspection', 'The junction box lid is broken, there is no silica gel, and there is condensation inside. The cable is 4-wire, 80 m, in the sun.']], o:['Moisture in the junction box + temperature changes on a 4-wire cable', 'A load cell missing', 'The calibration was wrong from the start', 'The indicator is too fast'], a:0, why:'Moisture creates a small leakage that shifts the signal, and temperature changes the cable resistance on 4-wire. Repair the box and use 6-wire.'},
  {t:'The counter counts wrong', s:'A cut-to-length machine: the sheets come out 3–4 mm too long at random. It gets worse when the welding machine next to it runs.', clues:[['Scope', IL.scopeTr([{lab:'A', col:'#ffd23f', fn:t => ((t * 29) % 1 < 0.015 ? 0.9 : C.encAB(t * 5).A)}])]], o:['Noise getting onto the encoder cable', 'Encoder reversed', 'Gray code', '4–20 mA range'], a:0, why:'Extra pulses from noise. Shield, a differential cable, and separate cable routes.'},
  {t:'The level reads high in a closed tank', s:'A tank under 0.3 bar nitrogen. The pressure transmitter at the bottom shows the level 3 m higher than the sight glass.', clues:[['Transmitter', 'A plain gauge transmitter, with no low-side line.']], o:['It also measures the gas pressure; a DP is needed', 'Density', 'The shield', 'Broken wire'], a:0, why:'0.3 bar ≈ 3 m of water. A DP subtracts the gas pressure.'},
  {t:'The reading is steady while the pressure changes', s:'A pressure transmitter reads <b class="eq">4.2 bar</b> all shift whether the pump runs or stops. The loop current is a healthy 10.7 mA.', clues:[['Inspection', 'The isolation valve before the transmitter was found closed since the last maintenance.']], o:['Isolation valve closed (pressure trapped inside)', 'Failed card', 'Noise', 'Power supply'], a:0, why:'Healthy loop and a frozen signal = the problem is on the process side: a valve, or a blocked or frozen impulse line.'}
];

})();
