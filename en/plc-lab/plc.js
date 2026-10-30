/* كورس الـ PLC: shared engine for the hub and the 10 lessons.
   Modules: store/progress · theme · lesson shell · quiz · drill · ladder engine (PL.Engine, pure, script-tested) ·
   plant models (PL.plants: tank, conveyor, traffic light, garage door …) · ladder editor + simulator (PL.sim) ·
   lesson widgets (scan cycle, PLC parts, I/O wiring bench, analog scaling). Lesson pages hold the content + data. */
(function(){
'use strict';
const G = typeof window !== 'undefined' ? window : globalThis;
const HAS_DOM = typeof document !== 'undefined';
const PL = G.PL = {};
const KEY = 'plc-lab-v1', PKEY = 'plc-lab-v1-prog';
/* language: the English twins under /en/plc-lab/ run the same code; the build swaps the strings (i18n.py) */
const EN = PL.EN = HAS_DOM && /^en\b/i.test(document.documentElement.getAttribute('lang') || '');

/* ---------------- store ---------------- */
function lsGet(k){ try { return G.localStorage ? G.localStorage.getItem(k) : null; } catch (e){ return null; } }
function lsSet(k, v){ try { if (G.localStorage) G.localStorage.setItem(k, v); } catch (e){} }
function load(){ try { const s = JSON.parse(lsGet(KEY)); return s && typeof s === 'object' ? s : {}; } catch (e){ return {}; } }
let S = load(); if (!S.done || typeof S.done !== 'object') S.done = {};
function save(){ lsSet(KEY, JSON.stringify(S)); }
const subs = [];
PL.on = fn => subs.push(fn);
PL.store = {
  has: k => !!S.done[k],
  mark(k){ if (S.done[k]) return false; const f = load(); S = Object.assign({}, f, S); S.done = Object.assign({}, f.done || {}, S.done); S.done[k] = Date.now(); save(); subs.forEach(fn => { try { fn(k); } catch (e){} }); return true; },
  get: k => S[k],
  set(k, v){ S[k] = v; save(); },
  reset(){ S = {done:{}}; save(); subs.forEach(fn => { try { fn(); } catch (e){} }); },
  reload(){ S = load(); if (!S.done) S.done = {}; }
};
/* saved ladder programs live under their own key so they never bloat the synced progress */
PL.progs = {
  get(k){ try { const o = JSON.parse(lsGet(PKEY)) || {}; return o[k] || null; } catch (e){ return null; } },
  set(k, v){ let o = {}; try { o = JSON.parse(lsGet(PKEY)) || {}; } catch (e){} if (v == null) delete o[k]; else o[k] = v; lsSet(PKEY, JSON.stringify(o)); }
};

/* ---------------- theme (applied before first paint: plc.js loads in <head>) ---------------- */
function applyTheme(){ if (!HAS_DOM) return; const t = S.theme; if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
applyTheme();
function isDark(){ const t = document.documentElement.getAttribute('data-theme'); if (t) return t === 'dark'; return !!(G.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
function themeBtn(){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn theme-b';
  const upd = () => { const d = isDark(); b.textContent = d ? '☀' : '☾'; b.setAttribute('aria-label', d ? 'Light mode' : 'Dark mode'); b.title = b.getAttribute('aria-label'); };
  b.addEventListener('click', () => { PL.store.set('theme', isDark() ? 'light' : 'dark'); applyTheme(); upd(); });
  upd(); return b;
}

/* ---------------- course map ---------------- */
PL.COURSE = [
  {id:'l1', n:1, file:'lesson-01.html', title:'What is a PLC?', sub:'How it differs from relay circuits, the scan cycle, and its parts: CPU, power supply, input and output cards, and the well-known brands',
    tasks:[['scan','Scan cycle'],['parts','PLC parts'],['quiz','Lesson quiz']]},
  {id:'l2', n:2, file:'lesson-02.html', title:'Wiring the PLC', sub:'24V DC power, sinking and sourcing inputs with PNP and NPN sensors, and relay and transistor outputs',
    tasks:[['pnp','PNP input'],['npn','NPN input'],['tr','Transistor output'],['rly','Relay output'],['quiz','Lesson quiz']]},
  {id:'l3', n:3, file:'lesson-03.html', title:'Your first Ladder program', sub:'NO and NC contacts and the coil, AND and OR, and the trap of a Stop button wired NC',
    tasks:[['and','AND circuit'],['or','OR circuit'],['nc','NC Stop button'],['quiz','Lesson quiz']]},
  {id:'l4', n:4, file:'lesson-04.html', title:'Seal-in and Set/Reset', sub:'Start and stop a DOL motor with seal-in, Set and Reset, and the interlock for reversing',
    tasks:[['seal','Seal-in'],['sr','Set and Reset'],['fr','Forward/reverse with interlock'],['quiz','Lesson quiz']]},
  {id:'l5', n:5, file:'lesson-05.html', title:'Timers', sub:'TON, TOF and TP, and a star/delta program with a timer',
    tasks:[['ton','TON timer'],['tof','TOF timer'],['sd','Star/delta'],['quiz','Lesson quiz']]},
  {id:'l6', n:6, file:'lesson-06.html', title:'Counters and comparison', sub:'CTU and CTD, a packing counter on a conveyor, and compare instructions in a car park',
    tasks:[['ctu','Packing counter'],['cmp','Car park and compare'],['quiz','Lesson quiz']]},
  {id:'l7', n:7, file:'lesson-07.html', title:'Memory, flags and edges', sub:'M bits, rising and falling edges, and one button for start and stop',
    tasks:[['toggle','One button for start/stop'],['alarm','Latched alarm'],['quiz','Lesson quiz']]},
  {id:'l8', n:8, file:'lesson-08.html', title:'Analog signals in the PLC', sub:'From 4–20 mA to raw counts to the real value, and a tank with High and Low alarms and pump control',
    tasks:[['scale','Scaling exercise'],['tank','Tank control'],['quiz','Lesson quiz']]},
  {id:'l9', n:9, file:'lesson-09.html', title:'Practical projects', sub:'Traffic light, mixing tank, box sorting on a conveyor, and a garage door: each project has a moving machine and an automatic test',
    tasks:[['traffic','Traffic light'],['fill','Mixing tank'],['sort','Box sorting'],['garage','Garage door'],['quiz','Lesson quiz']]},
  {id:'l10', n:10, file:'lesson-10.html', title:'Troubleshooting and the final exam', sub:'Online monitoring and forcing, the most common program errors, and the final exam',
    tasks:[['dbl','Double coil'],['ncfix','Wrong NC logic'],['sealfix','Incomplete seal-in'],['quiz','Lesson quiz'],['final','Final exam']]}
];
PL.lessonById = id => PL.COURSE.find(l => l.id === id);
PL.summary = id => { const l = PL.lessonById(id); const done = l.tasks.filter(t => PL.store.has(id + '/' + t[0])).length; return {done, total:l.tasks.length}; };
PL.mark = (lid, task) => PL.store.mark(lid + '/' + task);
PL.has = (lid, task) => PL.store.has(lid + '/' + task);
PL.allDone = () => PL.COURSE.every(l => { const s = PL.summary(l.id); return s.done === s.total; });

/* ---------------- helpers ---------------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
PL.esc = esc;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
PL.$ = $; PL.$$ = $$;
const fmt = (v, d) => { const p = Math.pow(10, d); const r = Math.round(v * p) / p; return (Object.is(r, -0) ? 0 : r).toFixed(d); };
PL.fmt = fmt;
function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
/* answer options: shuffled, but catch-all choices («الاتنين», «ولا واحد», "Both", "None"…) always stay last */
const QZ_PIN = /^(الاتنين|الاثنين|كلهم|ولا واحد|ولا حاجة|مفيش فرق|مش فارقة|زي بعض|كلهم زي بعض|both|neither|none|all of them|all the same|no difference|it makes no difference)$/i;
function qzOrder(o, keep){ const idx = o.map((_, i) => i); if (keep) return idx; const pin = idx.filter(i => QZ_PIN.test(String(o[i]).replace(/<[^>]*>/g, '').replace(/[⁦-⁩⁠.!]/g, '').trim())); return shuffle(idx.filter(i => !pin.includes(i))).concat(pin); }
/* Latin / number runs inside an RTL option ("+24V", "0.05 A", "DC−", "حوالي +26 °C") would flip: isolate them as LTR */
const QZ_LTR = /[+\-−±]?[0-9A-Za-zΩµ°][0-9A-Za-zΩµ°%.,:/·×_\-–−+ ]*[0-9A-Za-zΩµ°%+\-−]|[+\-−±]?[0-9A-Za-zΩµ°]/g;
function qzTxt(s){ s = String(s); if (document.documentElement.dir !== 'rtl') return s; return s.split(/(<[^>]+>|&[#\w]+;)/).map((p, i) => i % 2 ? p : p.replace(QZ_LTR, m => '<bdi dir="ltr">' + m + '</bdi>')).join(''); }
PL.shuffle = shuffle;
const pick = a => a[Math.floor(Math.random() * a.length)];
PL.pick = pick;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
PL.clamp = clamp;
const reduced = () => !!(G.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
PL.reduced = reduced;
let uid = 0; const U = p => p + (++uid);
PL.uid = U;
/* Arabic text with a Latin/number run inside: wrap the run in LRI … PDI so it never reverses */
const iso = s => '' + String(s).replace(/–/g, '–') + '';
PL.iso = iso;
/* run fn(dt, ts) every animation frame while the host is on screen */
function animate(host, fn){
  let raf = 0, vis = true, last = 0, on = true;
  function loop(ts){ raf = 0; if (!vis || !on) return; const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts; fn(dt, ts); raf = requestAnimationFrame(loop); }
  const kick = () => { if (!raf && vis && on){ last = 0; raf = requestAnimationFrame(loop); } };
  if ('IntersectionObserver' in G) new IntersectionObserver(es => { vis = es[0].isIntersecting; kick(); }).observe(host);
  document.addEventListener('visibilitychange', () => { if (document.hidden){ vis = false; } else { vis = true; kick(); } });
  kick();
  return {stop(){ on = false; }, start(){ on = true; kick(); }, get on(){ return on; }};
}
PL.animate = animate;
function onAct(host, sel, fn){
  host.addEventListener('click', e => { const t = e.target.closest(sel); if (t && host.contains(t)) fn(t, e); });
  host.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const t = e.target.closest(sel); if (t && host.contains(t) && t.tagName !== 'BUTTON' && t.tagName !== 'INPUT' && t.tagName !== 'SELECT'){ e.preventDefault(); fn(t, e); } });
}
PL.onAct = onAct;
const num = s => { const v = parseFloat(String(s).replace(',', '.').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))); return isFinite(v) ? v : NaN; };
PL.num = num;
function chal(host, sel, lesson, task){ const c = $(sel, host); if (c && PL.has(lesson, task)) c.classList.add('ok'); return () => { if (c) c.classList.add('ok'); PL.mark(lesson, task); }; }
PL.chal = chal;

/* ---------------- lesson shell ---------------- */
/* «EN» / «ع»: the same page in the other language (/plc-lab/x.html ⇄ /en/plc-lab/x.html) */
function langBtn(){
  const a = document.createElement('a'); a.className = 'btn lang-b';
  const p = location.pathname, en = /^\/en(?=\/)/.test(p);
  a.href = (en ? p.replace(/^\/en(?=\/)/, '') : '/en' + p) + location.hash;
  if (en){ a.textContent = 'ع'; a.lang = 'ar'; a.hreflang = 'ar'; a.setAttribute('aria-label', 'اقرا الصفحة دي بالعربي'); }
  else { a.textContent = 'EN'; a.lang = 'en'; a.hreflang = 'en'; a.setAttribute('aria-label', 'Read this page in English'); }
  a.title = a.getAttribute('aria-label');
  a.addEventListener('click', () => lsSet('le-lang', en ? 'ar' : 'en'));
  return a;
}
function headBtns(){ const ch = $('header.top .chips'); if (ch){ ch.appendChild(langBtn()); ch.appendChild(themeBtn()); } }
PL.lesson = function(id){
  const L = PL.lessonById(id); PL.cur = L;
  headBtns();
  const prog = $('#lprog');
  function renderProg(){
    if (!prog) return;
    const s = PL.summary(id), pct = Math.round(s.done / s.total * 100);
    prog.innerHTML = `<div class="row"><span>Your progress in this lesson: <b>${s.done} of ${s.total}</b></span><span class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progress ${pct}%"><i style="width:${pct}%"></i></span></div><ul>${L.tasks.map(t => `<li class="${PL.has(id, t[0]) ? 'ok' : ''}">${esc(t[1])}</li>`).join('')}</ul>`;
  }
  renderProg(); PL.on(renderProg);
  const nav = $('#lnav');
  if (nav){
    const i = PL.COURSE.indexOf(L), p = PL.COURSE[i - 1], n = PL.COURSE[i + 1];
    nav.innerHTML = (p ? `<a class="btn" href="${p.file}">← Lesson ${p.n}: ${esc(p.title)}</a>` : `<a class="btn" href="index.html">← Course page</a>`) +
      (n ? `<a class="btn pri" href="${n.file}">Lesson ${n.n}: ${esc(n.title)} →</a>` : `<a class="btn pri" href="index.html#certSec">Certificate →</a>`);
  }
  G.addEventListener('pageshow', e => { if (e.persisted){ PL.store.reload(); renderProg(); } });
  if (HAS_DOM) setTimeout(() => PL.gate(id), 0);
};
PL.hubTheme = headBtns;

/* ================= reading gate: a lesson's simulators open only after the explanation above them is read =================
   Every .wd (simulator / try-it box) on a lesson page starts locked: blurred, inert, with a card saying why.
   It opens once the learner has scrolled through the explanation blocks between the previous .wd and this one
   and kept them on screen for a reading time that grows with their length (3 … 20 s). Boxes open in order.
   Opened boxes are remembered per lesson (plc-gate-v1); a finished lesson opens everything. */
const GKEY = 'plc-gate-v1';
function gateLoad(){ try { return JSON.parse(lsGet(GKEY)) || {}; } catch (e){ return {}; } }
PL.gate = function(lid){
  if (!HAS_DOM) return;
  const wds = $$('.lsec .wd'); if (!wds.length) return;
  const sv = gateLoad(), opened = sv[lid] || 0, s0 = PL.summary(lid), all = s0.done === s0.total;
  const blocks = $$('.lsec > *').filter(b => !b.matches('.wd, h2') && !b.querySelector('.wd'));
  let prev = null;
  const G = wds.map((wd, n) => {
    const own = blocks.filter(b => (!prev || (prev.compareDocumentPosition(b) & 4)) && (wd.compareDocumentPosition(b) & 2));
    const chars = own.reduce((a, b) => a + (b.textContent || '').replace(/\s+/g, ' ').length, 0);
    prev = wd;
    return {wd, own, need:own.length ? Math.min(20, Math.max(3, chars / 40)) : 0, t:0, end:!own.length, open:all || n < opened};
  });
  const vis = new Set();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) vis.add(e.target); else vis.delete(e.target);
    G.forEach(g => { const last = g.own[g.own.length - 1]; if (last === e.target && e.isIntersecting && e.boundingClientRect.bottom <= (window.innerHeight || 800) + 40) g.end = true; }); }), {threshold:[0, 0.5, 1]}) : null;
  function kids(g){ return Array.from(g.wd.children).filter(c => c.tagName !== 'H3' && !c.classList.contains('gate')); }
  function lock(g){
    g.wd.classList.add('gated');
    kids(g).forEach(c => { c.inert = true; c.setAttribute('aria-hidden', 'true'); });
    const c = document.createElement('div'); c.className = 'gate'; c.setAttribute('role', 'status');
    c.innerHTML = `<b>🔒 This simulator opens after you finish reading the explanation above it.</b><span class="muted gate-why">Read it first so you know what you are about to try.</span><span class="gate-bar" role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></span>${g.own.length ? '<button type="button" class="btn gate-up">↑ Go to the explanation</button>' : ''}`;
    const h = g.wd.querySelector(':scope > h3'); if (h) h.after(c); else g.wd.prepend(c);
    const up = c.querySelector('.gate-up'); if (up) up.addEventListener('click', () => { const t = g.own.find(b => !vis.has(b)) || g.own[0]; t.scrollIntoView({block:'start', behavior:reduced() ? 'auto' : 'smooth'}); });
    g.card = c; if (io) g.own.forEach(b => io.observe(b));
  }
  function unlock(g, quiet){
    g.open = true; g.wd.classList.remove('gated');
    kids(g).forEach(c => { c.inert = false; c.removeAttribute('aria-hidden'); });
    if (g.card){ if (quiet) g.card.remove(); else { g.card.className = 'gate gate-ok'; g.card.innerHTML = '<b>✓ Open: now try what you just read.</b>'; setTimeout(() => { if (g.card) g.card.remove(); }, 4000); } }
    const n = G.indexOf(g) + 1, o = gateLoad(); if ((o[lid] || 0) < n){ o[lid] = n; lsSet(GKEY, JSON.stringify(o)); }
    (PL._sims || []).concat(PL._bx || []).forEach(a => { if (a.host && g.wd.contains(a.host) && a.preview && a.preview.refresh) a.preview.refresh(); });
  }
  G.forEach(g => { if (!g.open) lock(g); });
  if (G.every(g => g.open)) return;
  const tick = setInterval(() => {
    const g = G.find(x => !x.open); if (!g){ clearInterval(tick); return; }
    if (document.hidden) return;
    if (!g.own.length || g.own.some(b => vis.has(b))) g.t += 0.5;
    if (!io) g.end = true;
    const pct = g.need ? Math.min(100, Math.round(g.t / g.need * 100)) : 100;
    const bar = g.card && g.card.querySelector('.gate-bar'); if (bar){ bar.firstChild.style.width = pct + '%'; bar.setAttribute('aria-valuenow', pct); }
    const why = g.card && g.card.querySelector('.gate-why'); if (why && G.indexOf(g) > 0 && !G[G.indexOf(g) - 1].open) why.textContent = 'Finish the simulator above first.';
    if (g.t >= g.need && g.end) unlock(g);
  }, 500);
};

/* ---------------- select, then confirm ----------------
   tapping an option only selects it (.sel); right/wrong shows after the learner presses the check / confirm button */
const QZ_T = {check:'Check my answers', need:'Answer every question first', cnt:(n, t) => `Answered ${n} of ${t}`, ok:`Confirm`}; // backtick: its own English entry (the quote-key 'تأكيد' is the alarm «Acknowledge»)
const QZ_CF = () => `<div class="dr-cf"><button type="button" class="btn pri dr-ok" disabled>${QZ_T.ok}</button></div>`;
function qzSel(box, o){ $$('.qz-o', box).forEach(x => { const on = x === o; x.classList.toggle('sel', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
function qzUnsel(box){ $$('.qz-o', box).forEach(x => { x.classList.remove('sel'); x.removeAttribute('aria-pressed'); }); }
// one-question cards: returns the confirmed option button, or null while the learner is still choosing
function pickConfirm(e, box){
  const o = e.target.closest('.qz-o');
  if (o){ if (!o.disabled){ qzSel(box, o); const c = $('.dr-ok', box); if (c) c.disabled = false; } return null; }
  if (!e.target.closest('.dr-ok')) return null;
  const p = $('.qz-o.sel', box); if (!p) return null;
  qzUnsel(box); const cf = $('.dr-cf', box); if (cf) cf.hidden = true;
  return p;
}

/* ---------------- quiz ----------------
   qs: [{q, o:[...], a:index, why}] ; opt: {lesson, task, pass(0..1), row, shuffle} */
PL.quiz = function(host, qs, opt){
  opt = opt || {};
  const pass = opt.pass == null ? 0.8 : opt.pass;
  let order, ans, sel;
  function start(){
    order = (opt.shuffle ? shuffle(qs) : qs.slice()).map(q => { const idx = q.o.map((_, i) => i); const oi = opt.keepOrder || q.keep ? idx : qzOrder(q.o); return {q, oi}; });
    ans = order.map(() => null); sel = order.map(() => null); render();
  }
  function render(){
    host.innerHTML = `<div class="qz-list">${order.map((it, k) => `<div class="qz" data-k="${k}"><p class="qz-q">${k + 1}. ${it.q.q}</p><div class="qz-a${opt.row ? ' row' : ''}">${it.oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${qzTxt(it.q.o[i])}</button>`).join('')}</div><p class="qz-f" aria-live="polite"></p></div>`).join('')}</div><div class="qz-chk"><button type="button" class="btn pri" data-qz="check" aria-disabled="true">${QZ_T.check}</button><span class="qz-cnt" aria-live="polite"></span></div><div class="qz-sum" hidden aria-live="polite"></div>`;
    cnt();
  }
  host.addEventListener('click', e => {
    const b = e.target.closest('.qz-o');
    if (b){
      const box = b.closest('.qz'), k = +box.dataset.k;
      if (ans[k] != null || b.disabled) return;
      sel[k] = +b.dataset.i; qzSel(box, b); cnt();
      return;
    }
    if (e.target.closest('[data-qz=check]')){ check(); return; }
    if (e.target.closest('[data-qz=again]')) start();
  });
  function cnt(warn){
    const c = $('.qz-cnt', host), btn = $('[data-qz=check]', host); if (!c) return;
    const n = sel.filter(x => x != null).length, all = n === sel.length;
    btn.setAttribute('aria-disabled', all ? 'false' : 'true');
    c.className = 'qz-cnt' + (warn && !all ? ' warn' : '');
    c.textContent = QZ_T.cnt(n, sel.length) + (warn && !all ? ' · ' + QZ_T.need : '');
  }
  function check(){
    if (ans.some(x => x != null)) return;
    const miss = sel.findIndex(x => x == null);
    if (miss > -1){ cnt(true); const u = host.querySelector(`.qz[data-k="${miss}"]`); if (u && u.scrollIntoView) u.scrollIntoView({block:'center', behavior:'smooth'}); return; }
    order.forEach((it, k) => {
      const box = host.querySelector(`.qz[data-k="${k}"]`), i = sel[k], ok = i === it.q.a; ans[k] = ok;
      qzUnsel(box);
      $$('.qz-o', box).forEach(x => { x.disabled = true; const j = +x.dataset.i; if (j === it.q.a) x.classList.add('ok'); else if (j === i) x.classList.add('no'); });
      if (ok) box.classList.add('ok');
      const f = $('.qz-f', box); f.className = 'qz-f ' + (ok ? 'ok' : 'no'); f.innerHTML = (ok ? 'Correct. ' : 'Not that one. ') + (it.q.why || '');
    });
    $('.qz-chk', host).hidden = true;
    finish();
  }
  function finish(){
    const n = ans.filter(Boolean).length, tot = ans.length, ok = n / tot >= pass - 1e-9;
    const sum = $('.qz-sum', host); sum.hidden = false; sum.className = 'qz-sum ' + (ok ? 'ok' : 'no');
    sum.innerHTML = `<b>Your score: ${n} of ${tot}</b><span>${ok ? 'Great, you passed ✓' : `You need at least ${Math.ceil(pass * tot - 1e-9)} correct. Review the lesson and try again.`}</span><button type="button" class="btn" data-qz="again">${ok ? 'Do it again' : 'Try again'}</button>`;
    if (ok && opt.lesson) PL.mark(opt.lesson, opt.task || 'quiz');
    if (opt.onDone) opt.onDone(n, tot, ok);
  }
  start();
  const api = {solve(wrong){ order.forEach((it, k) => { const i = wrong && k === 0 ? it.oi.find(j => j !== it.q.a) : it.q.a; const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }); check(); return $('.qz-sum', host).textContent; }, answer(k, i){ const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }, check, order: () => order.map(x => x.q), restart: start};
  (PL._q = PL._q || []).push(api); api.host = host; api.opt = opt;
  return api;
};

/* ---------------- drill: a stream of generated questions ---------------- */
PL.drill = function(host, gen, opt){
  opt = opt || {};
  const need = opt.need || 5;
  let ok = 0, tries = 0, cur = null, answered = false;
  host.innerHTML = `<div class="dr"><div class="dr-top"><span class="dr-sc" aria-live="polite"></span><span class="bar dr-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${need}" aria-label="Correct answers"><i></i></span></div><div class="dr-card"></div><div class="dr-act"><button type="button" class="btn pri dr-next" hidden>Next question →</button></div><p class="chal dr-chal">${opt.goal || `Get <b>${need}</b> right to complete this exercise.`}</p></div>`;
  const fin = chal(host, '.dr-chal', opt.lesson, opt.task);
  const card = $('.dr-card', host), nx = $('.dr-next', host);
  function score(){ $('.dr-sc', host).innerHTML = `Correct: <b>${ok}</b> of ${tries}`; const p = Math.min(1, ok / need) * 100; $('.dr-bar i', host).style.width = p + '%'; $('.dr-bar', host).setAttribute('aria-valuenow', Math.min(ok, need)); }
  function next(){
    cur = gen(); answered = false; nx.hidden = true;
    if (cur.input){
      card.innerHTML = `<div class="dr-q">${cur.q}</div><form class="dr-in"><input class="inp" inputmode="decimal" autocomplete="off" aria-label="Your answer" placeholder="Your answer"><span class="mono dr-u">${esc(cur.unit || '')}</span><button class="btn pri" type="submit">Check</button></form><p class="qz-f" aria-live="polite"></p>`;
    } else {
      const oi = qzOrder(cur.o, cur.keep);
      card.innerHTML = `<div class="dr-q">${cur.q}</div><div class="qz-a${cur.row ? ' row' : ''}">${oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${qzTxt(cur.o[i])}</button>`).join('')}</div>${QZ_CF()}<p class="qz-f" aria-live="polite"></p>`;
    }
    score();
  }
  function result(good, chosen){
    answered = true; tries++; if (good) ok++;
    const f = $('.qz-f', card); f.className = 'qz-f ' + (good ? 'ok' : 'no');
    f.innerHTML = (good ? 'Correct. ' : 'Not quite. ') + (cur.ans != null && !good ? `Answer: <b class="mono">${cur.ans}</b>. ` : '') + (cur.why || '');
    if (!cur.input) $$('.qz-o', card).forEach(x => { x.disabled = true; if (+x.dataset.i === cur.a) x.classList.add('ok'); else if (x === chosen) x.classList.add('no'); });
    else $$('input,button', card).forEach(x => x.disabled = true);
    score(); nx.hidden = false;
    if (ok >= need) fin();
    nx.focus({preventScroll:true});
  }
  card.addEventListener('click', e => { if (answered) return; const b = pickConfirm(e, card); if (b) result(+b.dataset.i === cur.a, b); });
  card.addEventListener('submit', e => { e.preventDefault(); if (answered) return; const v = num($('input', card).value); if (!isFinite(v)){ const f = $('.qz-f', card); f.className = 'qz-f no'; f.textContent = 'Type a number.'; return; } result(!!cur.check(v)); });
  nx.addEventListener('click', next);
  next();
  return {get cur(){ return cur; }, answer(v){ if (cur.input){ $('input', card).value = v; $('.dr-in button', card).click(); } else { const b = card.querySelector(`.qz-o[data-i="${v}"]`); if (b){ b.click(); $('.dr-ok', card).click(); } } }, next, get ok(){ return ok; }};
};

/* ================= ladder engine (pure, no DOM) =================
   A program is a list of rungs. A rung is a grid: rows (1..3) × cols (contact columns + 1 output column).
   cells[r][c] = null (nothing) | {t:'W'} (wire) | element.  links[r-1] = node positions joined by a vertical
   wire between row r-1 and row r (node c sits on the left edge of column c; node 0 is the left power rail).
   Power is solved left → right: inside one node column the vertical links OR the rows together, then every
   cell passes power to the next node if its element conducts. Output elements live in the last column.
   Scan = read inputs into the image → execute rungs top → bottom (later rungs see what earlier ones wrote) →
   write the output image to the physical outputs. Exactly like a real PLC. */
const ENG = PL.eng = {};
const CONTACTS = ['NO', 'NC', 'P', 'N', 'CMP', 'ONS'];
const OUTS = ['OUT', 'S', 'R', 'TON', 'TOF', 'TP', 'RTO', 'CTU', 'CTD', 'SCL', 'HSC'];
ENG.CONTACTS = CONTACTS; ENG.OUTS = OUTS;
ENG.isOut = t => OUTS.indexOf(t) >= 0;
ENG.isContact = t => CONTACTS.indexOf(t) >= 0 || t === 'W';
const RX = {bit:/^(I|Q|M)(\d{1,2})\.([0-7])$/, tim:/^T(\d{1,2})$/, tsub:/^T(\d{1,2})\.(TT|EN)$/, cnt:/^C(\d{1,2})$/, word:/^(IW|MW)(\d{1,3})$/, hsc:/^HC(\d)$/};
ENG.norm = a => String(a == null ? '' : a).trim().toUpperCase().replace(/\s+/g, '').replace(/,/g, '.');
/* what kind of operand an address is: 'I' 'Q' 'M' 'T' 'C' 'IW' 'MW' 'HC' (high-speed counter, 32-bit) or null */
ENG.kind = a => { a = ENG.norm(a); let m; if ((m = RX.bit.exec(a))) return m[1]; if (RX.tim.test(a)) return 'T'; if (RX.tsub.test(a)) return 'TB'; if (RX.cnt.test(a)) return 'C'; if ((m = RX.word.exec(a))) return m[1]; if (RX.hsc.test(a)) return 'HC'; return null; };
/* which operand kinds each element accepts */
ENG.accepts = {NO:['I','Q','M','T','C','TB'], NC:['I','Q','M','T','C','TB'], P:['I','Q','M','T','C','TB'], N:['I','Q','M','T','C','TB'], CMP:['C','T','MW','IW','HC'], ONS:['M'],
  OUT:['Q','M'], S:['Q','M'], R:['Q','M','T','C','HC'], TON:['T'], TOF:['T'], TP:['T'], RTO:['T'], CTU:['C'], CTD:['C'], SCL:['IW'], HSC:['HC']};
ENG.CMPOPS = ['>=', '>', '<=', '<', '==', '<>'];
ENG.RAWMAX = 27648; /* Siemens-style full scale for 4–20 mA → 0 … 27648 */

/* 'NO:I0.0' · 'CMP:MW10:>=:80' · 'TON:T0:3' · 'CTU:C0:6' · 'SCL:IW64:MW10:0:100' · 'R:HC0' (reset the high-speed counter)
   'HSC:HC0:10000' (enable the high-speed counter, Delta DCNT style, with its set value) · '-' wire · '' nothing */
ENG.parse = function(tok){
  if (tok == null || tok === '' || tok === '.') return null;
  if (typeof tok === 'object') return tok;
  if (tok === '-') return {t:'W'};
  const p = String(tok).split(':'), t = p[0].toUpperCase();
  const el = {t, a:ENG.norm(p[1] || '')};
  if (t === 'CMP'){ el.op = p[2] || '>='; el.b = +p[3] || 0; }
  else if (t === 'TON' || t === 'TOF' || t === 'TP' || t === 'RTO') el.pt = p[2] != null ? +p[2] : 3;
  else if (t === 'CTU' || t === 'CTD'){ el.pv = p[2] != null ? Math.round(+p[2]) : 5; if (p[3]) el.r = ENG.norm(p[3]); }
  else if (t === 'HSC') el.pv = p[2] != null ? Math.round(+p[2]) : 0;
  else if (t === 'SCL'){ el.o = ENG.norm(p[2] || 'MW10'); el.lo = p[3] != null ? +p[3] : 0; el.hi = p[4] != null ? +p[4] : 100; if (p[5] != null && p[6] != null){ el.rlo = +p[5]; el.rhi = +p[6]; } }
  return el;
};
ENG.tok = function(el){
  if (!el) return '';
  if (el.t === 'W') return '-';
  if (el.t === 'CMP') return `CMP:${el.a}:${el.op}:${el.b}`;
  if (el.pt != null) return `${el.t}:${el.a}:${el.pt}`;
  if (el.pv != null) return `${el.t}:${el.a}:${el.pv}` + (el.r ? ':' + el.r : '');
  if (el.t === 'SCL') return `SCL:${el.a}:${el.o}:${el.lo}:${el.hi}` + (el.rhi != null ? `:${el.rlo}:${el.rhi}` : '');
  return `${el.t}:${el.a}`;
};
/* compact text form → normalised program. def: [{rows:[[tok…]…], links:[[node…]…]}] or a rung string list */
ENG.program = function(def, cols){
  cols = cols || 5;
  return (def || []).map(rg => {
    const rows = (rg.rows || [rg]).map(row => { const out = []; for (let c = 0; c < cols; c++) out.push(ENG.parse(row[c])); return out; });
    const links = []; for (let r = 1; r < rows.length; r++) links.push(((rg.links || [])[r - 1] || []).filter(n => n > 0 && n <= cols - 1).slice());
    return {rows, links};
  });
};
ENG.serialize = prog => prog.map(rg => ({rows:rg.rows.map(row => row.map(ENG.tok)), links:rg.links.map(l => l.slice())}));
ENG.blankRung = cols => ({rows:[Array.from({length:cols}, (_, c) => c < cols - 1 ? {t:'W'} : null)], links:[]});

/* static checks shown to the learner (warnings, not errors): unknown address, wrong operand, double coil */
ENG.lint = function(prog){
  const msgs = [], coils = {};
  prog.forEach((rg, i) => rg.rows.forEach((row, r) => row.forEach((el, c) => {
    if (!el || el.t === 'W') return;
    const k = ENG.kind(el.a);
    if (!el.a || !k){ msgs.push({rung:i, r, c, kind:'addr', text:`Rung ${i + 1}: the ${el.t} element needs a valid address (like I0.0 or Q0.0).`}); return; }
    if (ENG.accepts[el.t].indexOf(k) < 0) msgs.push({rung:i, r, c, kind:'operand', text:`Rung ${i + 1}: address ${el.a} can't be used with ${el.t}.`});
    if (el.t === 'OUT'){ (coils[el.a] = coils[el.a] || []).push(i + 1); }
    if (el.r && ['I', 'Q', 'M'].indexOf(ENG.kind(el.r)) < 0) msgs.push({rung:i, r, c, kind:'operand', text:`Rung ${i + 1}: the R input of ${el.t} must be a bit (like I0.3).`});
    if (el.t === 'SCL' && ENG.kind(el.o) !== 'MW') msgs.push({rung:i, r, c, kind:'operand', text:`Rung ${i + 1}: the SCL output must be an MW (like MW10).`});
  })));
  Object.keys(coils).forEach(a => { const rs = coils[a].filter((v, j, arr) => arr.indexOf(v) === j); if (coils[a].length > 1) msgs.push({kind:'double', addr:a, text:`Coil ${a} is written ${coils[a].length} times (rungs ${rs.join(' and ')}). Only the last rung wins: this is a "double coil".`}); });
  return msgs;
};

function solveRung(rg, pass){
  const R = rg.rows.length, C = rg.rows[0].length, pw = [], cp = [];
  for (let r = 0; r < R; r++){ pw.push(new Array(C + 1).fill(false)); cp.push(new Array(C).fill(false)); }
  for (let r = 0; r < R; r++) pw[r][0] = true; /* left rail */
  for (let c = 0; c < C; c++){
    if (c > 0){ /* close the vertical links at node c (they can chain over several rows) */
      for (let k = 0; k < R; k++){ let ch = false; for (let r = 1; r < R; r++) if (rg.links[r - 1].indexOf(c) >= 0 && pw[r][c] !== pw[r - 1][c]){ pw[r][c] = pw[r - 1][c] = true; ch = true; } if (!ch) break; }
    }
    if (c === C - 1) break; /* output column: its input is the node, outputs do not pass on */
    for (let r = 0; r < R; r++){ const el = rg.rows[r][c]; if (!el) continue; const ok = pass(el, r, c, pw[r][c]); cp[r][c] = ok; pw[r][c + 1] = pw[r][c] && ok; }
  }
  return {pw, cp};
}
ENG.solveRung = solveRung;

/* a running PLC */
ENG.Engine = function(progDef, opt){
  opt = opt || {};
  const cols = opt.cols || 5;
  const me = this;
  me.cols = cols;
  me.phys = {};      /* physical input terminals (what the field devices put on the card) */
  me.force = {};     /* forced I or Q: {addr:0|1} */
  me.II = {};        /* input image */
  me.Q = {};         /* output image (program writes) */
  me.out = {};       /* physical outputs (after force) */
  me.M = {}; me.W = {}; me.T = {}; me.C = {};
  /* high-speed counters: counted by the hardware (the machine model calls hscAdd), not by the scan.
     HC = current value (32-bit signed, wraps like a DInt), hcEn = enabled by a DCNT-style element, hcPv = its set value */
  me.HC = {}; me.hcEn = {}; me.hcPv = {};
  me.edge = {}; me.cin = {}; me.t = 0; me.scans = 0;
  me.prog = [];
  me.setProgram = function(def, keep){
    const isNorm = Array.isArray(def) && def.every(rg => rg && rg.rows && rg.links && rg.links.length === rg.rows.length - 1 && rg.rows.every(row => row.length === cols && row.every(x => x === null || typeof x === 'object')));
    const p = isNorm ? def : ENG.program(def, cols);
    me.prog = p;
    me.up = {}; p.forEach(rg => rg.rows.forEach(row => row.forEach(el => { if (el && el.t === 'CTU') me.up[el.a] = true; })));
    const old = me.edge; me.edge = {}; me.cin = {};
    p.forEach((rg, i) => rg.rows.forEach((row, r) => row.forEach((el, c) => {
      if (!el) return; const k = i + ':' + r + ':' + c;
      if (el.t === 'P' || el.t === 'N') me.edge[k] = keep ? (old[k] != null ? old[k] : me.bit(el.a)) : false;
    })));
    if (keep){ /* online edit: counter edge memory starts from the present rung state, no false count */ me._seedCin = true; }
    me.pw = p.map(() => null);
  };
  me.timer = a => me.T[a] || (me.T[a] = {et:0, q:false, run:false, pin:false, pt:0});
  me.counter = a => me.C[a] || (me.C[a] = {cv:null, pv:0, q:false});
  me.bit = function(a){
    const k = ENG.kind(a);
    if (k === 'I') return !!me.II[a];
    if (k === 'Q') return !!me.Q[a];
    if (k === 'M') return !!me.M[a];
    if (k === 'T') return !!(me.T[a] && me.T[a].q);
    if (k === 'C') return !!(me.C[a] && me.C[a].q);
    if (k === 'TB'){ const m = RX.tsub.exec(a), t = me.T['T' + m[1]]; return !!(t && (m[2] === 'EN' ? t.pin : t.tt)); }
    if (k === 'HC') return me.hcPv[a] != null && me.hcPv[a] > 0 && (me.HC[a] || 0) >= me.hcPv[a];
    return false;
  };
  me.num = function(a){
    const k = ENG.kind(a);
    if (k === 'C') { const c = me.C[a]; return c && c.cv != null ? c.cv : 0; }
    if (k === 'T') return me.T[a] ? me.T[a].et : 0;
    if (k === 'IW') return me.W[a] != null ? me.W[a] : 0;
    if (k === 'MW') return me.W[a] != null ? me.W[a] : 0;
    if (k === 'HC') return me.HC[a] || 0;
    return me.bit(a) ? 1 : 0;
  };
  /* public read: physical output for Q, image for I */
  me.get = function(a){ a = ENG.norm(a); const k = ENG.kind(a); if (k === 'Q') return me.out[a] ? 1 : 0; if (k === 'IW' || k === 'MW' || k === 'HC') return me.num(a); return me.bit(a) ? 1 : 0; };
  /* the counter card / built-in HSC counts encoder edges between scans (whole counts, 32-bit wrap) */
  me.hscAdd = function(a, n){ a = ENG.norm(a); me.HC[a] = ((me.HC[a] || 0) + Math.round(n)) | 0; };
  me.hscSet = function(a, v){ me.HC[ENG.norm(a)] = Math.round(v) | 0; };
  me.setIn = function(a, v){ me.phys[ENG.norm(a)] = v ? 1 : 0; };
  me.setWord = function(a, v){ me.W[ENG.norm(a)] = v; };
  function cmp(v, op, b){ switch (op){ case '>': return v > b; case '>=': return v >= b - 1e-9; case '<': return v < b; case '<=': return v <= b + 1e-9; case '==': return Math.abs(v - b) < 1e-6; case '<>': return Math.abs(v - b) >= 1e-6; } return false; }
  me.scan = function(dt){
    dt = dt == null ? 0.01 : dt;
    /* 1. read inputs */
    Object.keys(me.phys).forEach(a => { me.II[a] = me.phys[a]; });
    Object.keys(me.force).forEach(a => { if (ENG.kind(a) === 'I') me.II[a] = me.force[a]; });
    /* 2. execute */
    me.prog.forEach((rg, i) => {
      const s = solveRung(rg, (el, r, c, pin) => {
        const k = i + ':' + r + ':' + c;
        switch (el.t){
          case 'W': return true;
          case 'NO': return me.bit(el.a);
          case 'NC': return !me.bit(el.a);
          case 'P': { const v = me.bit(el.a), p = me.edge[k]; me.edge[k] = v; return v && !p; }
          case 'N': { const v = me.bit(el.a), p = me.edge[k]; me.edge[k] = v; return !v && p; }
          case 'CMP': return cmp(me.num(el.a), el.op, el.b);
          case 'ONS': { const p = !!me.M[el.a]; me.M[el.a] = pin ? 1 : 0; return pin && !p; }
        }
        return false;
      });
      me.pw[i] = s;
      const C = rg.rows[0].length;
      rg.rows.forEach((row, r) => { const el = row[C - 1]; if (el) exec(el, s.pw[r][C - 1], i + ':' + r + ':' + (C - 1)); });
    });
    me._seedCin = false;
    /* 3. write outputs */
    Object.keys(me.Q).forEach(a => { me.out[a] = me.Q[a]; });
    Object.keys(me.force).forEach(a => { if (ENG.kind(a) === 'Q') me.out[a] = me.force[a]; });
    me.t += dt; me.scans++;
    function exec(el, en, k){
      const a = el.a, kd = ENG.kind(a);
      switch (el.t){
        case 'OUT': if (kd === 'Q') me.Q[a] = en ? 1 : 0; else if (kd === 'M') me.M[a] = en ? 1 : 0; return;
        case 'S': if (en){ if (kd === 'Q') me.Q[a] = 1; else if (kd === 'M') me.M[a] = 1; } return;
        case 'R': if (en){
          if (kd === 'Q') me.Q[a] = 0; else if (kd === 'M') me.M[a] = 0;
          else if (kd === 'T'){ const t = me.timer(a); t.et = 0; t.q = false; t.run = false; }
          else if (kd === 'C'){ const c = me.counter(a); c.cv = me.up[a] ? 0 : c.pv; c.q = me.up[a] ? c.cv >= c.pv && c.pv > 0 : c.cv <= 0; }
          else if (kd === 'HC') me.HC[a] = 0;
        } return;
        case 'HSC': if (kd === 'HC'){ me.hcEn[a] = en ? 1 : 0; me.hcPv[a] = el.pv; } return;
        case 'TON': { if (kd !== 'T') return; const t = me.timer(a); t.pt = el.pt; if (en){ t.et = Math.min(el.pt, t.et + dt); t.q = t.et >= el.pt - 1e-9; } else { t.et = 0; t.q = false; } t.pin = en; t.tt = en && !t.q; return; }
        case 'RTO': { if (kd !== 'T') return; const t = me.timer(a); t.pt = el.pt; if (en){ t.et = Math.min(el.pt, t.et + dt); } t.q = t.et >= el.pt - 1e-9; t.pin = en; t.tt = en && !t.q; return; }
        case 'TOF': { if (kd !== 'T') return; const t = me.timer(a); t.pt = el.pt; if (en){ t.q = true; t.et = 0; } else if (t.q){ t.et = Math.min(el.pt, t.et + dt); if (t.et >= el.pt - 1e-9) t.q = false; } t.pin = en; t.tt = !en && t.q; return; }
        case 'TP': { if (kd !== 'T') return; const t = me.timer(a); t.pt = el.pt;
          if (t.run){ t.et = Math.min(el.pt, t.et + dt); if (t.et >= el.pt - 1e-9){ t.run = false; t.q = false; } }
          else if (en && !t.pin){ t.run = true; t.q = true; t.et = 0; }
          else if (!en) t.et = 0;
          t.pin = en; t.tt = t.run; return; }
        case 'CTU': case 'CTD': { if (kd !== 'C') return; const c = me.counter(a);
          if (c.cv == null) c.cv = el.t === 'CTD' && !me.up[a] ? el.pv : 0;
          if (el.t === 'CTU' || !me.up[a]) c.pv = el.pv;
          if (me._seedCin && me.cin[k] == null) me.cin[k] = en;
          const p = !!me.cin[k]; me.cin[k] = en;
          if (el.r && me.bit(el.r)) c.cv = el.t === 'CTU' ? 0 : el.pv;
          else if (en && !p) c.cv = el.t === 'CTU' ? Math.min(32767, c.cv + 1) : Math.max(0, c.cv - 1);
          c.q = me.up[a] ? c.cv >= c.pv && c.pv > 0 : c.cv <= 0; return; }
        case 'SCL': if (en && ENG.kind(el.o) === 'MW'){ const raw = me.num(a); const r0 = el.rhi != null ? el.rlo : 0, r1 = el.rhi != null ? el.rhi : ENG.RAWMAX; me.W[el.o] = el.lo + clamp((raw - r0) / ((r1 - r0) || 1), 0, 1) * (el.hi - el.lo); } return;
      }
    }
  };
  me.setProgram(progDef || []);
};
ENG.mA2raw = mA => Math.round((mA - 4) / 16 * ENG.RAWMAX);
ENG.raw2eng = (raw, lo, hi) => lo + raw / ENG.RAWMAX * (hi - lo);

/* ---------- auto-check: run a program against an input sequence and expected outputs ----------
   steps: {set:{I0.0:1}} {press:'I0.0'} (tap a push button) {hold:'I0.0'} {release:'I0.0'} {run:s}
          {exp:{Q0.0:1}, msg} {plant:{level:15}} {until:ctx=>bool, max:s, msg} {watch:ctx=>msg|null} {fn:ctx=>msg|null} */
ENG.check = function(progDef, ex, opt){
  opt = opt || {};
  const cols = opt.cols || 5, dt = opt.dt || 0.01;
  const e = new ENG.Engine(progDef, {cols});
  const io = ex.io || {inputs:[], outputs:[]};
  const def = {}; (io.inputs || []).forEach(i => { def[i.a] = i.kind === 'pbnc' || i.kind === 'ncsw' || i.def ? 1 : 0; e.setIn(i.a, def[i.a]); });
  const plant = ex.plant ? PL.plants[ex.plant].create(ex.plantOpt) : null;
  const watches = [], hist = [];
  const ctx = {e, plant, get t(){ return e.t; }, q: a => e.get(a), hist, mark: {}};
  let fail = null;
  function step1(){
    if (plant) PL.plants[ex.plant].step(plant, e, dt);
    e.scan(dt);
    for (const w of watches){ const m = w(ctx); if (m){ fail = m; return false; } }
    return true;
  }
  function run(s){ const n = Math.round(s / dt); for (let i = 0; i < n; i++) if (!step1()) return false; return true; }
  const steps = ex.tests || [];
  run(0.05);
  for (let si = 0; si < steps.length && !fail; si++){
    const st = steps[si];
    if (st.set) Object.keys(st.set).forEach(a => e.setIn(a, st.set[a]));
    if (st.plant && plant) Object.assign(plant, st.plant);
    if (st.word) Object.keys(st.word).forEach(a => e.setWord(a, st.word[a]));
    if (st.press){ const a = st.press; e.setIn(a, def[a] ? 0 : 1); if (!run(st.t || 0.2)) break; e.setIn(a, def[a] ? 1 : 0); if (!run(0.15)) break; }
    if (st.hold) e.setIn(st.hold, def[st.hold] ? 0 : 1);
    if (st.release) e.setIn(st.release, def[st.release] ? 1 : 0);
    if (st.watch) watches.push(st.watch);
    if (st.run != null && !run(st.run)) break;
    if (st.until){ const n = Math.round((st.max || 30) / dt); let ok = false; for (let i = 0; i < n; i++){ if (st.until(ctx)){ ok = true; break; } if (!step1()) break; } if (fail) break; if (!ok){ fail = st.msg || 'The machine didn\'t reach the required state in the expected time.'; break; } }
    if (st.exp){
      const bad = Object.keys(st.exp).filter(a => (e.get(a) ? 1 : 0) !== (st.exp[a] ? 1 : 0));
      if (bad.length){ fail = (st.msg || 'The result isn\'t what was required.') + ' ' + bad.map(a => `Expected ${a} = ${st.exp[a] ? 1 : 0} but got ${e.get(a) ? 1 : 0}.`).join(' '); break; }
    }
    if (st.fn){ const m = st.fn(ctx); if (m){ fail = m; break; } }
  }
  return {ok:!fail, msg:fail, engine:e, plant};
};

/* ================= plant models: the machine the PLC controls =================
   create(opt) → state · step(st, e, dt): read e.out (outputs), write sensors with e.setIn / e.setWord ·
   svg(st, e) → markup for the live view · drives: inputs the machine itself sets (shown as sensors, not buttons) ·
   ctl: extra buttons on the live view ({id, label, act(st)}). The same step() runs in the live view and in the
   auto-check, so the check judges the real machine behaviour, not only the outputs. */
const PLANTS = PL.plants = {};
const on = (e, a) => !!e.out[a];
const svgT = (x, y, s, cls, anchor) => `<text x="${x}" y="${y}" class="${cls || 'pt'}"${anchor ? ` text-anchor="${anchor}"` : ''}>${s}</text>`;
const lampSvg = (x, y, r, col, lit) => `<circle cx="${x}" cy="${y}" r="${r + 3.5}" fill="url(#ra-chrome)"/><circle cx="${x}" cy="${y}" r="${r + 1}" fill="#1c1f22"/><circle cx="${x}" cy="${y}" r="${r}" fill="${lit ? col : '#3a3f43'}"${lit ? ` class="glowc" style="--gc:${col}"` : ''}/>${lit ? '' : `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity=".25"/>`}<circle cx="${x}" cy="${y}" r="${r}" fill="url(#ra-dome)"/>`;
PL.lampSvg = lampSvg;
const LCOL = {red:'#ff4a3d', green:'#2fd35a', yellow:'#ffc21a', white:'#f4f1e6', blue:'#3a9bff', amber:'#ff9a1a'};
PL.LCOL = LCOL;
/* a motor seen from the fan end; ang in degrees */
function motorSvg(x, y, s, ang, run, col){
  const blades = [0, 60, 120, 180, 240, 300].map(a => `<path d="M0 0 L${(s * 0.4).toFixed(1)} -${(s * 0.09).toFixed(1)} Q${(s * 0.44).toFixed(1)} 0 ${(s * 0.4).toFixed(1)} ${(s * 0.09).toFixed(1)}Z" transform="rotate(${a})" fill="#b9c0c5"/>`).join('');
  const rings = [0.2, 0.28, 0.36, 0.44].map(k => `<circle r="${(s * k).toFixed(1)}" fill="none" stroke="#2b3034" stroke-width="${(s * 0.03).toFixed(1)}"/>`).join('');
  return `<g transform="translate(${x} ${y})"><g filter="url(#ra-sh)"><path d="M${-s * 0.5} ${s * 0.36}L${-s * 0.66} ${s * 0.62}H${s * 0.66}L${s * 0.5} ${s * 0.36}Z" fill="${col || '#2f6fb3'}"/><rect x="${-s * 0.7}" y="${s * 0.58}" width="${s * 1.4}" height="${s * 0.08}" rx="2" fill="#3b4146"/>
    <circle r="${s * 0.6}" fill="${col || '#2f6fb3'}"/><circle r="${s * 0.6}" fill="url(#ra-dome)" opacity=".7"/><circle r="${s * 0.56}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="${(s * 0.05).toFixed(1)}" stroke-dasharray="2 3"/>
    <circle r="${s * 0.5}" fill="url(#ra-grey)"/><circle r="${s * 0.47}" fill="#16191b"/></g>
    <g transform="rotate(${ang.toFixed(1)})">${blades}</g>${rings}<path d="M${-s * 0.47} 0H${s * 0.47}M0 ${-s * 0.47}V${s * 0.47}" stroke="#2b3034" stroke-width="${(s * 0.035).toFixed(1)}"/><circle r="${s * 0.08}" fill="url(#ra-chrome)"/>
    ${run ? `<circle r="${s * 0.66}" fill="none" stroke="#2fd35a" stroke-width="2.5" stroke-dasharray="4 5" opacity=".9"/>` : ''}</g>`;
}
PL.motorSvg = motorSvg;
function contactorSvg(x, y, lbl, onv, sub){
  return `<g transform="translate(${x} ${y})"><g filter="url(#ra-sh)"><rect x="-17" y="-22" width="34" height="44" rx="3" fill="url(#ra-plastic)" stroke="#a9aeb2"/><rect x="-15" y="-21" width="30" height="9" rx="1.5" fill="url(#ra-term)"/><rect x="-15" y="12" width="30" height="9" rx="1.5" fill="url(#ra-term)"/>${[-10, 0, 10].map(dx => RA.screw(dx, -16.5, 2.6) + RA.screw(dx, 16.5, 2.6)).join('')}<rect x="-9" y="-8" width="18" height="16" rx="1.5" fill="#1b1e20"/><rect x="-6" y="${onv ? -1 : -6}" width="12" height="6" rx="1" fill="#ffc21a"/></g>${svgT(0, 36, lbl, 'pt pc ar', 'middle')}${sub ? svgT(0, 48, sub, 'pt pm', 'middle') : ''}</g>`;
}

/* ---- generic loads: one tile per output ---- */
PL.loadsSvg = function(outs, e, st){
  const n = outs.length, w = 90, W = Math.max(270, n * w), H = 112;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Loads">`;
  outs.forEach((o, i) => {
    const cx = (W - n * w) / 2 + i * w + w / 2, v = on(e, o.a);
    if (o.kind === 'motor' || o.kind === 'fan') s += motorSvg(cx, 46, 52, st.ang[o.a] || 0, v, o.kind === 'fan' ? '#5a6b78' : null);
    else if (o.kind === 'horn') s += `<g transform="translate(${cx} 46)"><g filter="url(#ra-sh)"><rect x="-24" y="-12" width="10" height="24" rx="2" fill="url(#ra-dark)"/><path d="M-14 -8h6l18 -16v48l-18 -16h-6z" fill="#e0332a"/><path d="M-14 -8h6l18 -16v48l-18 -16h-6z" fill="url(#ra-dome)" opacity=".6"/><ellipse cx="10" cy="0" rx="3" ry="24" fill="#8f1d17"/></g>${v ? '<path d="M14 -12q8 12 0 24M20 -18q12 18 0 36" fill="none" stroke="#ff9a1a" stroke-width="3"/>' : ''}</g>`;
    else if (o.kind === 'valve') s += `<g transform="translate(${cx} 46)">${RA.pipe('M-34 12H34', v ? '#3a8fd8' : null)}${RA.valve(0, 10, v)}${svgT(0, -12, v ? 'ON' : 'OFF', 'pt pw', 'middle')}</g>`;
    else if (o.kind === 'heater') s += `<g transform="translate(${cx} 46)"><rect x="-30" y="14" width="60" height="8" rx="2" fill="url(#ra-grey)" filter="url(#ra-sh)"/><path d="M-24 10q6-20 12 0t12 0t12 0t12 0" fill="none" stroke="#5d6166" stroke-width="7" stroke-linecap="round"/><path d="M-24 10q6-20 12 0t12 0t12 0t12 0" fill="none" stroke="${v ? '#ff5b2a' : '#9ea3a7'}" stroke-width="4" stroke-linecap="round"${v ? ' filter="url(#ra-glow)"' : ''}/>${v ? '<path d="M-14 -6q-4-10 2-18M0 -6q-4-10 2-18M14 -6q-4-10 2-18" fill="none" stroke="#ff9a1a" stroke-width="2.5" opacity=".8"/>' : ''}</g>`;
    else s += lampSvg(cx, 44, 20, LCOL[o.color || 'red'], v);
    s += `<text x="${cx}" y="98" class="pt pc ar" text-anchor="middle">${esc(o.label || o.a)}</text><text x="${cx}" y="110" class="pt pm" text-anchor="middle">${o.a}</text>`;
  });
  return s + '</svg>';
};
PLANTS.loads = {
  create: () => ({ang:{}}),
  step(st, e, dt){ Object.keys(e.out).forEach(a => { if (e.out[a]) st.ang[a] = ((st.ang[a] || 0) + dt * 540) % 360; }); },
  svg: (st, e, ex) => PL.loadsSvg(ex.io.outputs, e, st)
};

/* ---- forward / reverse motor ---- */
PLANTS.fr = {
  create: () => ({ang:0, short:0, dir:0}),
  step(st, e, dt){
    const f = on(e, 'Q0.0'), r = on(e, 'Q0.1');
    if (f && r){ st.short += dt; st.everShort = true; }
    const want = f && !r ? 1 : r && !f ? -1 : 0;
    st.dir += (want - st.dir) * Math.min(1, dt * 2.5);
    st.ang = (st.ang + st.dir * dt * 600 + 360) % 360;
  },
  svg(st, e){
    const f = on(e, 'Q0.0'), r = on(e, 'Q0.1'), bad = f && r;
    return `<svg viewBox="0 0 360 150" role="img" aria-label="Forward/reverse motor">${contactorSvg(60, 40, 'KM1 Fwd', f, 'Q0.0')}${contactorSvg(130, 40, 'KM2 Rev', r, 'Q0.1')}${motorSvg(260, 62, 70, st.ang, f || r)}
      ${Math.abs(st.dir) > 0.05 ? `<path d="${st.dir > 0 ? 'M228 12a40 40 0 0 1 64 0' : 'M292 12a40 40 0 0 0 -64 0'}" fill="none" stroke="#2fd35a" stroke-width="3" marker-end="url(#pa)"/>` : ''}
      <defs><marker id="pa" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#2fd35a"/></marker></defs>
      ${svgT(260, 142, st.dir > 0.05 ? 'Forward ⟳' : st.dir < -0.05 ? 'Reverse ⟲' : 'Stopped', 'pt pc ar', 'middle')}
      ${bad || st.everShort ? `<g transform="translate(95 120)"><rect x="-90" y="-14" width="180" height="26" rx="6" fill="#c0352b"/>${svgT(0, 4, bad ? '⚡ Phase-to-phase short! Both are on' : '⚡ There was a short earlier', 'pt pw ar', 'middle')}</g>` : ''}</svg>`;
  }
};

/* ---- star / delta ---- */
PLANTS.sd = {
  create: () => ({ang:0, spd:0, short:false, mode:'off'}),
  step(st, e, dt){
    const m = on(e, 'Q0.0'), d = on(e, 'Q0.1'), y = on(e, 'Q0.2');
    if (d && y) st.short = true;
    st.mode = !m ? 'off' : d && y ? 'short' : y ? 'star' : d ? 'delta' : 'open';
    const tgt = st.mode === 'star' ? 0.88 : st.mode === 'delta' ? 1 : 0;
    st.spd += (tgt - st.spd) * Math.min(1, dt * (tgt > st.spd ? 0.9 : 0.6));
    st.ang = (st.ang + st.spd * dt * 720) % 360;
  },
  svg(st, e){
    const lab = {off:'Stopped', star:'Star Y: low starting current', delta:'Delta Δ: full speed', open:'KM1 only: motor not connected', short:'⚡ Short! Star and delta together'}[st.mode];
    return `<svg viewBox="0 0 360 150" role="img" aria-label="Star/delta">${contactorSvg(40, 36, 'KM1', on(e, 'Q0.0'), 'Q0.0')}${contactorSvg(100, 36, 'KM2 Δ', on(e, 'Q0.1'), 'Q0.1')}${contactorSvg(160, 36, 'KM3 Y', on(e, 'Q0.2'), 'Q0.2')}${motorSvg(275, 58, 70, st.ang, st.spd > 0.05)}
      <rect x="20" y="96" width="180" height="10" rx="5" fill="#4a5257"/><rect x="20" y="96" width="${(180 * st.spd).toFixed(1)}" height="10" rx="5" fill="#2fd35a"/>${svgT(110, 124, 'Speed ' + Math.round(st.spd * 100) + '%', 'pt pc ar', 'middle')}
      <g transform="translate(180 142)">${st.short || st.mode === 'short' ? `<rect x="-170" y="-13" width="340" height="20" rx="5" fill="#c0352b"/>${svgT(0, 2, '⚡ Short: KM2 and KM3 were on together', 'pt pw ar', 'middle')}` : svgT(0, 2, lab, 'pt pc ar', 'middle')}</g></svg>`;
  }
};

/* ---- packing conveyor: photo-eye I0.2 counts boxes into a carton ---- */
PLANTS.pack = {
  drives:['I0.2'],
  create: () => ({boxes:[{x:10}, {x:-40}, {x:-90}], belt:0, carton:0, gap:50, next:-140, cartons:0, over:false}),
  step(st, e, dt){
    const run = on(e, 'Q0.0'), v = run ? 40 : 0;
    st.belt = (st.belt + v * dt) % 20;
    /* once a box reaches the eye it is on the chute and slides into the carton even if the belt stops */
    st.boxes.forEach(b => { b.x += (b.x > 239 ? 40 : v) * dt; });
    /* the eye at x 250: a box of width 22 blocks it while 239 < x < 261 */
    const eye = st.boxes.some(b => b.x > 239 && b.x < 261);
    e.setIn('I0.2', eye ? 1 : 0);
    const before = st.boxes.length;
    st.boxes = st.boxes.filter(b => b.x < 290);
    st.carton += before - st.boxes.length;
    if (st.carton > 6) st.over = true;
    const minX = st.boxes.reduce((m, b) => Math.min(m, b.x), 1e9);
    if (minX > -10 || !st.boxes.length) st.boxes.push({x:Math.min(minX, 40) - st.gap});
    /* operator swaps the carton when the reset button is pressed */
    const rst = !!e.phys['I0.3'];
    if (rst && !st.rst && st.carton){ st.carton = 0; st.cartons++; st.over = false; }
    st.rst = rst;
  },
  svg(st, e){
    let s = `<svg viewBox="0 0 360 150" role="img" aria-label="Packing conveyor">`;
    s += RA.belt(0, 86, 296, st.belt);
    st.boxes.forEach(b => { if (b.x > -30) s += RA.box(b.x - 11, 64, 22, 22); });
    const eye = !!e.phys['I0.2'];
    s += RA.eye(243, 34, 14, 20, eye) + `<path d="M250 54V86" stroke="${eye ? '#ff4a3d' : '#ff8a80'}" stroke-width="2" stroke-dasharray="4 3" opacity="${eye ? 1 : .55}"/>${svgT(250, 30, 'I0.2', 'pt pm', 'middle')}`;
    /* carton */
    const full = st.carton;
    s += `<g filter="url(#ra-sh)"><path d="M300 106h52v38h-52z" fill="#b07b3c" stroke="#6b4a1e"/><path d="M300 106h52v38h-52z" fill="url(#ra-dome)" opacity=".35"/></g><path d="M300 106l-10 -10M352 106l10 -10" stroke="#8a5a26" stroke-width="4"/>`;
    for (let i = 0; i < Math.min(full, 8); i++) s += RA.box(304 + (i % 4) * 12, 132 - Math.floor(i / 4) * 12, 10, 10, i >= 6 ? '#c0352b' : null);
    s += svgT(326, 124 - (full > 4 ? 14 : 0), full + '/6', 'pt pc', 'middle');
    s += motorSvg(28, 122, 30, st.belt * 18, on(e, 'Q0.0')) + svgT(60, 126, 'M Q0.0', 'pt pm');
    s += lampSvg(24, 24, 11, LCOL.green, on(e, 'Q0.1')) + svgT(42, 22, 'Carton full', 'pt pc ar') + svgT(42, 34, 'Q0.1', 'pt pm');
    if (st.over) s += `<rect x="96" y="116" width="200" height="22" rx="5" fill="#c0352b"/>${svgT(196, 131, 'Carton overfilled past 6!', 'pt pw ar', 'middle')}`;
    return s + '</svg>';
  }
};

/* ---- parking garage: buttons make a car come in / go out ---- */
PLANTS.parking = {
  create: () => ({cars:0, inT:0, outT:0}),
  step(st, e, dt){
    const i = !!e.phys['I0.0'], o = !!e.phys['I0.1'];
    if (i && !st.pi) st.cars++;
    if (o && !st.po && st.cars > 0) st.cars--;
    st.pi = i; st.po = o;
  },
  svg(st, e){
    let s = `<svg viewBox="0 0 360 150" role="img" aria-label="Car park"><rect x="10" y="20" width="230" height="120" rx="8" fill="#4a4f53"/><rect x="10" y="20" width="230" height="120" rx="8" fill="url(#ra-vent)" opacity=".25"/>`;
    for (let k = 0; k < 6; k++){ const x = 22 + (k % 3) * 72, y = 30 + Math.floor(k / 3) * 56; s += `<rect x="${x}" y="${y}" width="62" height="46" rx="4" fill="none" stroke="#e8e2c8" stroke-dasharray="5 4"/>`; if (k < st.cars) s += RA.car(x + 31, y + 26, ['#c0352b', '#2f6fb3', '#e3a43a', '#5cc06f', '#9b59b6', '#ddd'][k], .9); }
    s += svgT(125, 14, 'Cars inside: ' + st.cars + (st.cars > 5 ? ' (full!)' : ''), 'pt pc ar', 'middle');
    s += `<rect x="262" y="20" width="84" height="120" rx="10" fill="url(#ra-dark)" filter="url(#ra-sh)"/>${lampSvg(304, 54, 18, LCOL.green, on(e, 'Q0.0'))}${lampSvg(304, 104, 18, LCOL.red, on(e, 'Q0.1'))}`;
    s += svgT(304, 82, 'Space Q0.0', 'pt pw ar', 'middle') + svgT(304, 134, 'Full Q0.1', 'pt pw ar', 'middle');
    return s + '</svg>';
  }
};

/* ---- analog tank: level transmitter on IW64, pump Q0.0, alarms Q0.1 high / Q0.2 low ---- */
PLANTS.tank = {
  drives:['IW64'],
  create: o => ({level:o && o.level != null ? o.level : 50, use:true, broken:false, wave:0, maxL:0, minL:100, pumpAt:[]}),
  step(st, e, dt){
    const pump = on(e, 'Q0.0');
    st.level += ((pump ? 4.5 : 0) - (st.use ? 2 : 0)) * dt;
    st.level = clamp(st.level, 0, 100);
    st.wave = (st.wave + dt * 3) % (Math.PI * 2);
    st.maxL = Math.max(st.maxL, st.level); st.minL = Math.min(st.minL, st.level);
    const mA = st.broken ? 0 : 4 + st.level / 100 * 16;
    st.mA = mA;
    e.setWord('IW64', st.broken ? -4864 : ENG.mA2raw(mA));
  },
  ctl:[{id:'use', label:st => st.use ? 'Close the outlet' : 'Open the outlet', act:st => { st.use = !st.use; }},
       {id:'brk', label:st => st.broken ? 'Reconnect the transmitter wire' : 'Cut the transmitter wire', act:st => { st.broken = !st.broken; }}],
  svg(st, e){
    const h = 100, top = 22, y = top + h * (1 - st.level / 100), lv = st.level;
    let s = `<svg viewBox="0 0 360 172" role="img" aria-label="Tank with analog level">`;
    s += RA.tank(120, top, 110, h);
    s += `<path d="M122 ${y.toFixed(1)} q14 ${(3 * Math.sin(st.wave)).toFixed(1)} 27 0 t27 0 t27 0 t27 0 V${top + h - 2} H122Z" fill="#3a8fd8" opacity=".85"/>`;
    [[90, 'H'], [80, 'stop'], [20, 'start'], [10, 'L']].forEach(([p, t]) => { const yy = top + h * (1 - p / 100); s += `<path d="M232 ${yy}h10" stroke="#8a949b"/>${svgT(244, yy + 4, p + '%', 'pt pm')}`; });
    s += `<rect x="96" y="${top + 6}" width="18" height="34" rx="3" fill="url(#ra-dark)" filter="url(#ra-sh)"/>${svgT(105, top + 24, 'LT', 'pt pw', 'middle')}<path d="M114 ${top + 20}h6" stroke="#2a3035" stroke-width="3"/>`;
    /* pump & pipes */
    s += `${RA.pipe(`M40 140h50V${top + 8}h30`, on(e, 'Q0.0') ? '#3a8fd8' : null)}${motorSvg(40, 132, 28, (st.wave * 120) % 360, on(e, 'Q0.0'))}${svgT(40, 158, 'Pump Q0.0', 'pt pc ar', 'middle')}`;
    s += `${RA.pipe(`M175 ${top + h}v18h120`, st.use ? '#3a8fd8' : null)}${st.use ? `<path d="M295 ${top + h + 18}v14" stroke="#3a8fd8" stroke-width="4" stroke-dasharray="3 3"/>` : ''}${svgT(296, top + h + 46, st.use ? 'Outlet open' : 'Outlet closed', 'pt pc ar', 'middle')}`;
    s += `<g transform="translate(300 30)">${lampSvg(0, 0, 10, LCOL.red, on(e, 'Q0.1'))}${svgT(16, 0, 'High', 'pt pc')}${svgT(16, 11, 'Q0.1', 'pt pm')}</g><g transform="translate(300 66)">${lampSvg(0, 0, 10, LCOL.amber, on(e, 'Q0.2'))}${svgT(16, 0, 'Low', 'pt pc')}${svgT(16, 11, 'Q0.2', 'pt pm')}</g>`;
    s += `<rect x="126" y="${top + h + 20}" width="98" height="20" rx="3" fill="url(#ra-dark)"/><rect x="128" y="${top + h + 22}" width="94" height="16" rx="2" fill="#c7d3b4"/>${svgT(175, top + h + 34, st.broken ? '0.0 mA ⚠' : PL.fmt(st.mA || 4, 1) + ' mA · ' + Math.round(lv) + '%', 'pt pl', 'middle')}`;
    return s + '</svg>';
  }
};

/* ---- traffic light: Q0.0 red · Q0.1 yellow · Q0.2 green ---- */
PLANTS.traffic = {
  create: () => ({log:[], cur:null, carX:-40}),
  step(st, e, dt){
    const r = on(e, 'Q0.0'), y = on(e, 'Q0.1'), g = on(e, 'Q0.2'), n = r + y + g;
    const s = n === 0 ? '-' : n > 1 ? 'X' : r ? 'R' : y ? 'Y' : 'G';
    if (s !== st.cur){ st.log.push({s, t:e.t}); st.cur = s; }
    const zone = st.carX > 120 && st.carX < 152;
    if (!(zone && !g)) st.carX += 60 * dt;
    if (st.carX > 380) st.carX = -40;
  },
  svg(st, e){
    let s = `<svg viewBox="0 0 360 150" role="img" aria-label="Traffic light"><rect x="0" y="104" width="360" height="4" fill="#9aa0a5"/><rect x="0" y="108" width="360" height="34" fill="#3b4247"/><rect x="0" y="108" width="360" height="34" fill="url(#ra-vent)" opacity=".15"/><path d="M0 125h360" stroke="#e8e2c8" stroke-width="2" stroke-dasharray="14 10"/><rect x="186" y="104" width="8" height="40" fill="#e8e2c8" opacity=".7"/>`;
    s += `<rect x="225" y="40" width="8" height="70" fill="url(#ra-steelV)"/><rect x="210" y="4" width="38" height="96" rx="8" fill="url(#ra-dark)" filter="url(#ra-sh)"/>${[22, 52, 82].map(yy => `<path d="M215 ${yy - 13}h28l-4 -4h-20z" fill="#111"/>`).join('')}${lampSvg(229, 22, 11, LCOL.red, on(e, 'Q0.0'))}${lampSvg(229, 52, 11, LCOL.yellow, on(e, 'Q0.1'))}${lampSvg(229, 82, 11, LCOL.green, on(e, 'Q0.2'))}`;
    s += RA.car(st.carX, 118, '#2f6fb3');
    s += svgT(110, 28, 'R Q0.0 · Y Q0.1 · G Q0.2', 'pt pm', 'middle');
    if (st.cur === 'X') s += `<rect x="20" y="40" width="170" height="22" rx="5" fill="#c0352b"/>${svgT(105, 55, 'More than one lamp on!', 'pt pw ar', 'middle')}`;
    return s + '</svg>';
  }
};

/* ---- mixing tank: fill Q0.0 → high I0.3 → mixer Q0.1 for 4 s → drain Q0.2 → low I0.2 off → done Q0.3 ---- */
PLANTS.mixer = {
  drives:['I0.2', 'I0.3'],
  create: o => ({level:o && o.level != null ? o.level : 0, ang:0, over:false, dry:0, mixAt:null, mixT:0, mixLvl:100, both:false}),
  step(st, e, dt){
    const f = on(e, 'Q0.0'), m = on(e, 'Q0.1'), d = on(e, 'Q0.2');
    st.level += ((f ? 12 : 0) - (d ? 14 : 0)) * dt;
    if (st.level > 100){ st.level = 100; if (f) st.over = true; }
    st.level = Math.max(0, st.level);
    if (f && d) st.both = true;
    if (m){ st.mixT += dt; st.mixLvl = Math.min(st.mixLvl, st.level); if (st.level < 10) st.dry += dt; st.ang = (st.ang + dt * 500) % 360; }
    e.setIn('I0.2', st.level > 10 ? 1 : 0);
    e.setIn('I0.3', st.level >= 90 ? 1 : 0);
  },
  svg(st, e){
    const top = 24, h = 100, y = top + h * (1 - st.level / 100);
    let s = `<svg viewBox="0 0 360 160" role="img" aria-label="Mixing tank">${RA.tank(120, top, 110, h)}<rect x="122" y="${y.toFixed(1)}" width="106" height="${Math.max(0, top + h - y - 1).toFixed(1)}" fill="#8e5bd8" opacity=".75"/>`;
    s += `<path d="M175 6V${top + 70}" stroke="url(#ra-steelV)" stroke-width="5"/><g transform="translate(175 ${top + 74}) scale(${Math.cos(st.ang * Math.PI / 180).toFixed(2)} 1)"><path d="M-30 -4h60v8h-60z" fill="#8a949b"/></g><rect x="160" y="0" width="30" height="14" rx="3" fill="#2f6fb3" filter="url(#ra-sh)"/><rect x="160" y="0" width="30" height="14" rx="3" fill="url(#ra-dome)" opacity=".6"/>${svgT(175, 11, 'M', 'pt pw', 'middle')}`;
    [[90, 'I0.3 High'], [10, 'I0.2 Low']].forEach(([p, t], k) => { const yy = top + h * (1 - p / 100), lit = k ? st.level > 10 : st.level >= 90; s += `<rect x="228" y="${yy - 5}" width="16" height="10" rx="2" fill="${lit ? '#2fd35a' : '#4a5257'}"/>${svgT(250, yy + 4, t, 'pt pm')}`; });
    s += `${RA.pipe(`M20 ${top + 6}h100`, on(e, 'Q0.0') ? '#8e5bd8' : null)}${RA.valve(70, top + 6, on(e, 'Q0.0'))}${svgT(40, top + 26, 'Fill Q0.0', 'pt pc ar', 'middle')}`;
    s += `${RA.pipe(`M175 ${top + h}v14h120`, on(e, 'Q0.2') ? '#8e5bd8' : null)}${RA.valve(250, top + h + 14, on(e, 'Q0.2'))}${svgT(250, top + h + 34, 'Drain Q0.2', 'pt pc ar', 'middle')}`;
    s += `<g transform="translate(46 100)">${lampSvg(0, 0, 11, LCOL.green, on(e, 'Q0.3'))}${svgT(0, 26, 'Done Q0.3', 'pt pc ar', 'middle')}</g>`;
    s += svgT(175, top + h - 8, Math.round(st.level) + '%', 'pt pc', 'middle');
    if (st.over) s += `<rect x="100" y="134" width="160" height="20" rx="5" fill="#c0352b"/>${svgT(180, 148, 'Tank overflowed!', 'pt pw ar', 'middle')}`;
    return s + '</svg>';
  }
};

/* ---- sorting conveyor: tall boxes must be pushed off at the pusher ---- */
PLANTS.sort = {
  drives:['I0.1', 'I0.2'],
  create: o => ({seq:(o && o.seq ? o.seq : null), k:0, boxes:[], belt:0, res:[], push:0, nextIn:0}),
  step(st, e, dt){
    const run = on(e, 'Q0.0'), v = run ? 45 : 0, pu = on(e, 'Q0.1');
    st.belt = (st.belt + v * dt) % 20;
    st.push += ((pu ? 1 : 0) - st.push) * Math.min(1, dt * 12);
    if (run){
      st.nextIn -= v * dt;
      if (st.nextIn <= 0 && (!st.seq || st.k < st.seq.length)){ const tall = st.seq ? !!st.seq[st.k] : Math.random() < 0.45; st.k++; st.boxes.push({x:-14, tall, off:0}); st.nextIn = 180; }
    }
    st.boxes.forEach(b => { if (b.off) { b.off += dt * 80; } else b.x += v * dt; });
    /* pusher zone 236…264: a box there is pushed off if the pusher is out */
    st.boxes.forEach(b => { if (!b.off && pu && b.x > 236 && b.x < 264){ b.off = 1; st.res.push({tall:b.tall, pushed:true}); } });
    st.boxes = st.boxes.filter(b => { if (b.off > 40) return false; if (!b.off && b.x > 340){ st.res.push({tall:b.tall, pushed:false}); return false; } return true; });
    e.setIn('I0.1', st.boxes.some(b => !b.off && b.tall && b.x > 110 && b.x < 132) ? 1 : 0);
    e.setIn('I0.2', st.boxes.some(b => !b.off && b.x > 238 && b.x < 262) ? 1 : 0);
  },
  svg(st, e){
    let s = `<svg viewBox="0 0 360 160" role="img" aria-label="Sorting conveyor">`;
    s += RA.belt(0, 96, 350, st.belt);
    s += `<rect x="226" y="122" width="52" height="34" fill="url(#ra-grey)" stroke="#55595d" filter="url(#ra-sh)"/>${svgT(252, 140, 'Tall', 'pt pw ar', 'middle')}`;
    st.boxes.forEach(b => { const h = b.tall ? 40 : 20, x = b.x, yb = 96 + (b.off ? Math.min(40, b.off) : 0); s += RA.box(x - 11, yb - h, 22, h, b.tall ? '#2f6fb3' : null, b.off ? Math.max(0, 1 - b.off / 40).toFixed(2) : null); });
    const h1 = !!e.phys['I0.1'], h2 = !!e.phys['I0.2'];
    s += RA.eye(99, 39, 12, 18, h1) + `<path d="M110 50H140" stroke="${h1 ? '#ff4a3d' : '#ff8a80'}" stroke-width="2" stroke-dasharray="4 3" opacity="${h1 ? 1 : .5}"/>${svgT(120, 34, 'I0.1 height', 'pt pm ar', 'middle')}`;
    s += RA.eye(295, 71, 12, 18, h2) + `<path d="M296 80H262" stroke="${h2 ? '#ff4a3d' : '#ff8a80'}" stroke-width="2" stroke-dasharray="4 3" opacity="${h2 ? 1 : .5}"/>${svgT(301, 66, 'I0.2', 'pt pm', 'middle')}`;
    const py = 60 + st.push * 26;
    s += `<rect x="234" y="24" width="32" height="18" rx="3" fill="url(#ra-alu)" stroke="#7d8388" filter="url(#ra-sh)"/><rect x="247" y="42" width="6" height="${(py - 40).toFixed(1)}" fill="url(#ra-steelV)"/><rect x="236" y="${py.toFixed(1)}" width="28" height="6" fill="${on(e, 'Q0.1') ? '#e3a43a' : '#8a949b'}"/>${svgT(250, 20, 'Pusher Q0.1', 'pt pm ar', 'middle')}`;
    const okc = st.res.filter(r => r.tall === r.pushed).length, bad = st.res.length - okc;
    s += svgT(10, 146, `OK ${okc} · wrong ${bad}`, 'pt pc ar') + motorSvg(330, 134, 26, st.belt * 18, on(e, 'Q0.0'));
    return s + '</svg>';
  }
};

/* ---- garage door: up Q0.0 · down Q0.1 · lamp Q0.2 · top I0.3 · bottom I0.4 · photo-eye I0.5 ---- */
PLANTS.garage = {
  drives:['I0.3', 'I0.4', 'I0.5'],
  create: o => ({pos:o && o.pos != null ? o.pos : 0, obst:false, short:false, crush:false, stall:0, flash:0}),
  step(st, e, dt){
    const u = on(e, 'Q0.0'), d = on(e, 'Q0.1');
    if (u && d) st.short = true;
    const v = u && !d ? 20 : d && !u ? -20 : 0;
    st.pos += v * dt;
    if (st.pos >= 100){ st.pos = 100; if (u) st.stall += dt; }
    if (st.pos <= 0){ st.pos = 0; if (d) st.stall += dt; }
    if (st.obst && d && st.pos < 25) st.crush = true;
    st.flash = (st.flash + dt) % 1;
    e.setIn('I0.3', st.pos >= 99.5 ? 1 : 0);
    e.setIn('I0.4', st.pos <= 0.5 ? 1 : 0);
    e.setIn('I0.5', st.obst ? 1 : 0);
  },
  ctl:[{id:'obst', label:st => st.obst ? 'Move the car from under the door' : 'Park a car under the door', act:st => { st.obst = !st.obst; }}],
  svg(st, e){
    const open = st.pos / 100, dh = 96 * (1 - open);
    let s = `<svg viewBox="0 0 360 160" role="img" aria-label="Garage door"><rect x="60" y="14" width="200" height="120" fill="#b9a58a"/><rect x="60" y="14" width="200" height="120" fill="url(#ra-vent)" opacity=".18"/><rect x="68" y="22" width="184" height="112" fill="url(#ra-grey)"/><rect x="72" y="26" width="176" height="108" fill="#1b1e20"/>`;
    if (st.obst) s += RA.car(160, 118, '#c0352b', 1.6);
    for (let k = 0; k * 12 < dh; k++){ const y = 26 + dh - (k + 1) * 12; if (y < 26 - 1) break; s += `<rect x="72" y="${Math.max(26, y).toFixed(1)}" width="176" height="${(Math.min(12, y + 12 - 26)).toFixed(1)}" fill="url(#ra-steelH)" stroke="#6b757c" stroke-width=".6"/>`; }
    s += `<path d="M72 128h-8M248 128h8" stroke="${st.obst ? '#ff4a3d' : '#ff8a80'}" stroke-width="3"/><path d="M76 128H244" stroke="#ff4a3d" stroke-width="1.5" stroke-dasharray="4 4" opacity="${st.obst ? 1 : .35}"/>${svgT(160, 150, 'Eye I0.5', 'pt pm ar', 'middle')}`;
    s += `<rect x="264" y="20" width="8" height="10" fill="${st.pos >= 99.5 ? '#2fd35a' : '#4a5257'}"/>${svgT(276, 29, 'I0.3 top', 'pt pm ar')}<rect x="264" y="122" width="8" height="10" fill="${st.pos <= 0.5 ? '#2fd35a' : '#4a5257'}"/>${svgT(276, 131, 'I0.4 bottom', 'pt pm ar')}`;
    const mv = on(e, 'Q0.0') || on(e, 'Q0.1');
    s += lampSvg(30, 30, 10, LCOL.amber, on(e, 'Q0.2') && (st.flash < 0.6 || !mv)) + svgT(30, 54, 'Q0.2', 'pt pm', 'middle');
    s += svgT(30, 84, on(e, 'Q0.0') ? '▲ Q0.0' : on(e, 'Q0.1') ? '▼ Q0.1' : '■', 'pt pc', 'middle') + svgT(310, 84, Math.round(st.pos) + '%', 'pt pc', 'middle');
    if (st.crush || st.short) s += `<rect x="70" y="56" width="180" height="24" rx="5" fill="#c0352b"/>${svgT(160, 72, st.short ? '⚡ Up and down together!' : 'The door came down on the car!', 'pt pw ar', 'middle')}`;
    return s + '</svg>';
  }
};

/* ================= ladder editor + simulator (PL.sim) =================
   opt: {lesson, exercises:[{key, title, task, io:{inputs:[{a,label,kind}], outputs:[{a,label,kind,color}]},
         plant, plantOpt, start, sol, hint, tests | cases:[{name, steps}]}], force:bool, cols} */
const CW = 60, RH = 64, PADL = 12, PADR = 12;
const EL_LABEL = {W:'Wire', NO:'NO contact', NC:'NC contact', P:'Edge ↑ (P)', N:'Edge ↓ (N)', CMP:'Compare', OUT:'Coil', S:'Set', R:'Reset', TON:'TON', TOF:'TOF', TP:'TP', CTU:'CTU', CTD:'CTD', SCL:'Scale'};
const EL_HELP = {
  NO:'Passes power when the bit = 1', NC:'Passes power when the bit = 0', P:'Passes power for one scan only when the bit changes from 0 to 1', N:'Passes power for one scan when the bit changes from 1 to 0',
  CMP:'Passes power if the comparison is true', OUT:'Bit = the power coming into it', S:'If it gets power the bit becomes 1 and stays 1', R:'If it gets power the bit becomes 0 (and on T or C it resets them)',
  TON:'On-delay', TOF:'Off-delay', TP:'Fixed-length pulse', CTU:'Up counter', CTD:'Down counter', SCL:'Converts the raw value to a real value', W:'Straight-through wire'};

/* small icons for the element palette */
function elIcon(t){
  const L = '<path d="M2 12h12M26 12h12" />';
  const m = {
    W:'<path d="M2 12h36"/>', NO:L + '<path d="M14 4v16M26 4v16"/>', NC:L + '<path d="M14 4v16M26 4v16M12 20L28 4"/>',
    P:L + '<path d="M14 4v16M26 4v16"/><text x="20" y="16" text-anchor="middle">P</text>', N:L + '<path d="M14 4v16M26 4v16"/><text x="20" y="16" text-anchor="middle">N</text>',
    CMP:'<rect x="6" y="3" width="28" height="18" rx="2"/><text x="20" y="16" text-anchor="middle">≥</text>',
    OUT:'<path d="M2 12h10M28 12h10"/><path d="M15 4q-5 8 0 16M25 4q5 8 0 16"/>', S:'<path d="M2 12h10M28 12h10"/><path d="M15 4q-5 8 0 16M25 4q5 8 0 16"/><text x="20" y="16" text-anchor="middle">S</text>',
    R:'<path d="M2 12h10M28 12h10"/><path d="M15 4q-5 8 0 16M25 4q5 8 0 16"/><text x="20" y="16" text-anchor="middle">R</text>',
    NONE:'<rect x="6" y="5" width="28" height="14" rx="2" stroke-dasharray="3 3"/>'
  };
  const box = s => `<rect x="4" y="2" width="32" height="20" rx="2"/><text x="20" y="15.5" text-anchor="middle" class="tb">${s}</text>`;
  return `<svg viewBox="0 0 40 24" aria-hidden="true" class="lp-ic">${m[t] || box(t)}</svg>`;
}

/* ---------- one rung as SVG (shared by the editor and the static figures) ---------- */
function cellSvg(K, el, x, y, r, c, rg, i, pw){
  const C = K.cols, yc = y + 34, outCol = c === C - 1;
  const pin = pw ? pw.pw[r][c] : false, pout = pw ? pw.pw[r][c + 1] : false, cond = pw ? pw.cp[r][c] : false;
  const w = (x1, x2, p) => `<path d="M${x1} ${yc}H${x2}" class="lw${p ? ' pw' : ''}"/>`;
  let s = '';
  if (!el){ return s; }
  if (el.t === 'W') return w(x, x + CW, pin && pout || pin);
  const addr = `<text x="${x + CW / 2}" y="${y + 13}" class="la" text-anchor="middle">${esc(el.a || '???')}</text>`;
  const cm = K.lab(el.a); const com = cm ? `<text x="${x + CW / 2}" y="${y + 60}" class="lc ar" text-anchor="middle">${esc(cm.length > 11 ? cm.slice(0, 10) + '…' : cm)}</text>` : '';
  if (CONTACTS.indexOf(el.t) >= 0 && el.t !== 'CMP'){
    const st = K.running && K.e ? (el.t === 'NC' ? !K.e.bit(el.a) : K.e.bit(el.a)) : false;
    const hi = K.running && (el.t === 'P' || el.t === 'N' ? cond : st);
    s += w(x, x + 22, pin) + w(x + 38, x + CW, pout);
    s += `<path d="M${x + 22} ${yc - 11}V${yc + 11}M${x + 38} ${yc - 11}V${yc + 11}" class="ls-sym${hi ? ' on' : ''}"/>`;
    if (el.t === 'NC') s += `<path d="M${x + 20} ${yc + 11}L${x + 40} ${yc - 11}" class="ls-sym${hi ? ' on' : ''}"/>`;
    if (el.t === 'P' || el.t === 'N') s += `<text x="${x + 30}" y="${yc + 4}" class="lk" text-anchor="middle">${el.t}</text>`;
    if (hi) s += `<rect x="${x + 23}" y="${yc - 10}" width="14" height="20" class="ls-fill"/>`;
    return s + addr + com;
  }
  if (el.t === 'CMP'){
    s += w(x, x + 4, pin) + w(x + 56, x + CW, pout);
    s += `<rect x="${x + 4}" y="${yc - 15}" width="52" height="30" rx="3" class="lbx${K.running && cond ? ' on' : ''}"/>`;
    s += `<text x="${x + 30}" y="${yc - 3}" class="lk" text-anchor="middle">${esc(el.op)} ${esc(el.b)}</text>`;
    s += `<text x="${x + 30}" y="${yc + 10}" class="lv" text-anchor="middle">${K.running ? PL.fmt(K.e.num(el.a), ENG.kind(el.a) === 'T' ? 1 : (ENG.kind(el.a) === 'MW' ? 1 : 0)) : 'CMP'}</text>`;
    return s + addr + com;
  }
  /* outputs */
  if (el.t === 'OUT' || el.t === 'S' || el.t === 'R'){
    const v = K.running && pin;
    s += w(x, x + 21, pin) + `<path d="M${x + 39} ${yc}H${x + CW}" class="lw"/>`;
    s += `<path d="M${x + 25} ${yc - 12}q-7 12 0 24M${x + 35} ${yc - 12}q7 12 0 24" class="ls-sym${v ? ' on' : ''}"/>`;
    if (v) s += `<circle cx="${x + 30}" cy="${yc}" r="8" class="ls-fill"/>`;
    if (el.t !== 'OUT') s += `<text x="${x + 30}" y="${yc + 4}" class="lk" text-anchor="middle">${el.t}</text>`;
    return s + addr + com;
  }
  /* boxes: timers, counters, scale */
  let l1 = el.t, l2 = '', q = false;
  if (el.pt != null){ const t = K.running && K.e && K.e.T[el.a]; q = !!(t && t.q); l2 = K.running ? PL.fmt(t ? t.et : 0, 1) + '/' + el.pt + 's' : 'PT ' + el.pt + 's'; }
  else if (el.pv != null){ const cc = K.running && K.e && K.e.C[el.a]; q = !!(cc && cc.q); l2 = K.running ? (cc && cc.cv != null ? cc.cv : 0) + '/' + el.pv : 'PV ' + el.pv; }
  else if (el.t === 'SCL'){ l2 = K.running ? PL.fmt(K.e.num(el.o), 1) : el.lo + '–' + el.hi; }
  s += w(x, x + 4, pin) + `<path d="M${x + 56} ${yc}H${x + CW}" class="lw"/><rect x="${x + 4}" y="${yc - 18}" width="52" height="36" rx="3" class="lbx${q || (el.t === 'SCL' && K.running && pin) ? ' on' : ''}"/>`;
  s += `<text x="${x + 30}" y="${yc - 4}" class="lk" text-anchor="middle">${l1}</text><text x="${x + 30}" y="${yc + 11}" class="lv" text-anchor="middle">${esc(l2)}</text>`;
  const top = el.t === 'SCL' ? `${el.a}→${el.o}` : el.a;
  return s + `<text x="${x + CW / 2}" y="${y + 11}" class="la" text-anchor="middle">${esc(top)}</text>`;
}
function drawRung(rg, i, K){
  const R = rg.rows.length, W = PADL + K.cols * CW + PADR, H = R * RH + 4, pw = K.running && K.e && K.e.pw[i] ? K.e.pw[i] : null;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="ls-svg" role="group" aria-label="Rung ${i + 1}">`;
  s += `<path d="M${PADL - 1} 2V${H - 2}" class="lrail${K.running ? ' pw' : ''}"/><path d="M${W - PADR + 1} 2V${H - 2}" class="lrail"/>`;
  for (let r = 0; r < R; r++){
    const y = r * RH + 2;
    for (let c = 0; c < K.cols; c++){
      const x = PADL + c * CW, el = rg.rows[r][c], isSel = K.sel && K.sel.i === i && K.sel.r === r && K.sel.c === c;
      s += cellSvg(K, el, x, y, r, c, rg, i, pw);
      if (!el && !isSel && K.hit) s += `<rect x="${x + 6}" y="${y + 20}" width="${CW - 12}" height="28" rx="4" class="lph"/>`;
      if (K.hit) s += `<rect x="${x + 1}" y="${y + 1}" width="${CW - 2}" height="${RH - 2}" rx="6" class="lhit${isSel ? ' sel' : ''}" data-i="${i}" data-r="${r}" data-c="${c}" tabindex="0" role="button" aria-label="Rung ${i + 1}, row ${r + 1}, cell ${c + 1}: ${el ? esc(EL_LABEL[el.t] + ' ' + (el.a || '')) : 'empty'}"/>`;
    }
    if (rg.rows[r][K.cols - 1] || r === 0) { const y2 = y + 34; s += `<path d="M${PADL + K.cols * CW - 1} ${y2}H${W - PADR + 1}" class="lw"/>`; }
  }
  for (let r = 1; r < R; r++) rg.links[r - 1].forEach(n => { const x = PADL + n * CW, on = pw && pw.pw[r][n] && pw.pw[r - 1][n]; s += `<path d="M${x} ${(r - 1) * RH + 36}V${r * RH + 36}" class="lw lv2${on ? ' pw' : ''}"/>`; });
  return s + '</svg>';
}
PL.drawRung = drawRung;
/* static ladder figure in the lesson text: PL.ladFig(el, def, {labels:{I0.0:'Start'}}) */
PL.ladFig = function(el, def, o){ o = o || {}; const cols = o.cols || 5, prog = ENG.program(def, cols), lb = o.labels || {}; el.classList.add('ladfig'); el.innerHTML = prog.map((rg, i) => drawRung(rg, i, {cols, running:false, e:null, sel:null, lab:a => lb[a] || '', hit:false})).join(''); };

/* lesson simulators: the real vendor look when brands.js is loaded (PL.lessonSim), else the simple trainer below */
PL.sim = (host, opt) => PL.lessonSim && !opt.plain ? PL.lessonSim(host, opt) : plainSim(host, opt);
const plainSim = PL.plainSim = function(host, opt){
  const cols = opt.cols || 5, exs = opt.exercises;
  let ex, prog, e, plantSt, running = false, sel = null, acc = 0, rdT = 0, forceMode = false, lastRes = null, backup = null, demo = null;
  const forces = {};
  const pressed = {}; /* push-button hold state */
  const saveKey = () => opt.lesson + '/' + ex.key;

  host.classList.add('ls');
  host.innerHTML = `${exs.length > 1 ? '<div class="tabs ls-tabs" role="group" aria-label="Exercises"></div>' : ''}
    <div class="chal ls-task"></div>
    <div class="ls-view"><div class="wd-art ls-plant"></div><div class="ls-pctl"></div><div class="ls-io" role="group" aria-label="Inputs: buttons and switches"></div><div class="ls-leds" aria-label="PLC LEDs"></div></div>
    <div class="ls-bar"><button type="button" class="btn ls-run" aria-pressed="false">▶ RUN</button><button type="button" class="btn pri ls-chk">✓ Test program</button>${opt.force ? '<button type="button" class="btn ls-frc" aria-pressed="false">Force</button>' : ''}</div>
    <div class="ls-res" aria-live="polite" hidden></div>
    <div class="ls-lad" dir="ltr"></div>
    <div class="ls-tools"><button type="button" class="btn" data-t="add">+ New rung</button><button type="button" class="btn" data-t="hint">Hint</button><button type="button" class="btn" data-t="reset">Start over</button><button type="button" class="btn" data-t="sol" hidden>Show solution</button><button type="button" class="btn" data-t="undo" hidden>Restore my program</button></div>
    <div class="ls-hint box" hidden></div>
    <div class="ls-lint" aria-live="polite"></div>`;
  const tabs = $('.ls-tabs', host), task = $('.ls-task', host), plantBox = $('.ls-plant', host), pctl = $('.ls-pctl', host), ioBox = $('.ls-io', host), leds = $('.ls-leds', host);
  const runB = $('.ls-run', host), chkB = $('.ls-chk', host), frcB = $('.ls-frc', host), resBox = $('.ls-res', host), lad = $('.ls-lad', host), hintBox = $('.ls-hint', host), lintBox = $('.ls-lint', host);
  const P = () => PL.plants[ex.plant || 'loads'];
  /* «💡 الخطوة الجاية» (PL.nextStep + /assets/next-hint.js): one line above the ladder, updated after every change */
  const nhCtl = window.NH ? NH.mount(lad, {course:'plc'}) : null;
  let nhPrev = null, nhLast = null; const nhCk = {k:null, r:null};
  function nhCheck(){ const k = JSON.stringify(ENG.serialize(prog)); if (nhCk.k !== k){ nhCk.k = k; nhCk.r = cases().map(c => ENG.check(prog, {io:ex.io, plant:ex.plant, plantOpt:Object.assign({}, ex.plantOpt || {}, c.plantOpt || {}), tests:c.steps}, {cols})).find(r => !r.ok) || {ok:true}; } return nhCk.r; }
  function nhUpdate(){
    if (!nhCtl) return;
    const cur = ENG.serialize(prog);
    if (nhPrev && nhPrev.ex === ex && nhPrev.p.length === cur.length) cur.forEach((rg, i) => rg.rows.forEach((row, r) => row.forEach((t, c) => { const o = ((nhPrev.p[i].rows[r] || [])[c]) || ''; if (t !== o && t && t !== '-') nhLast = {i, r, c}; })));
    else if (!nhPrev || nhPrev.ex !== ex) nhLast = null;
    nhPrev = {ex, p:cur};
    if (demo){ nhCtl.set(null); return; }
    const io = (ex.io.inputs || []).concat(ex.io.outputs || []);
    PL.nhLadder(nhCtl, PL.nextStep(prog, ex, {cols, last:nhLast, lab:a => (io.find(x => x.a === a) || {}).label, btn:chkB.textContent.replace('✓', '').trim(), check:nhCheck}), lad, $('[data-t=add]', host), '.lhit');
  }

  function defIn(i){ return i.kind === 'pbnc' || i.kind === 'ncsw' ? 1 : 0; }
  function physFor(i){ if (i.kind === 'pb' || i.kind === 'pbnc') return pressed[i.a] ? 1 - defIn(i) : defIn(i); if (i.kind === 'sw' || i.kind === 'sensor' || i.kind === 'ncsw') return i.state != null ? i.state : defIn(i); return null; }

  function freshEngine(){
    e = new ENG.Engine(prog, {cols});
    Object.assign(e.force, forces);
    (ex.io.inputs || []).forEach(i => { const v = physFor(i); if (v != null) e.setIn(i.a, v); });
  }
  function select(k){
    if (demo) PL.preview.stop();
    stop();
    if (opt.onSelect) opt.onSelect(k);
    ex = exs[k]; sel = null; lastRes = null; backup = null;
    const saved = PL.progs.get(saveKey());
    prog = ENG.program(saved || ex.start || [ENG.serialize([ENG.blankRung(cols)])[0]], cols);
    if (!prog.length) prog = [ENG.blankRung(cols)];
    (ex.io.inputs || []).forEach(i => { i.state = defIn(i); pressed[i.a] = false; });
    Object.keys(forces).forEach(a => delete forces[a]);
    plantSt = P().create(ex.plantOpt);
    freshEngine();
    task.innerHTML = ex.task + '<p class="bx-how"><b>How to solve it:</b> build the program below → ▶ RUN → test with the buttons → “Test program”.</p>'; task.classList.toggle('ok', PL.has(opt.lesson, ex.key));
    hintBox.hidden = true; hintBox.innerHTML = ex.hint || '';
    $('[data-t=hint]', host).hidden = !ex.hint;
    $('[data-t=sol]', host).hidden = !(ex.sol && PL.has(opt.lesson, ex.key));
    $('[data-t=undo]', host).hidden = true;
    resBox.hidden = true;
    if (tabs) tabs.innerHTML = exs.map((x, j) => `<button type="button" class="btn${PL.has(opt.lesson, x.key) ? ' done' : ''}" data-k="${j}" aria-pressed="${j === k}">${esc(x.title)}</button>`).join('');
    renderIO(); pctlRender(); renderAll(); nhUpdate();
    if (pvAd.refresh) pvAd.refresh();
  }
  function changed(){
    PL.progs.set(saveKey(), ENG.serialize(prog));
    if (running) e.setProgram(prog, true); else e.setProgram(prog);
    renderLadder(); renderLint(); nhUpdate();
  }

  /* ---------- I/O panel ---------- */
  function renderIO(){
    const ins = (ex.io.inputs || []).filter(i => i.kind !== 'auto');
    ioBox.innerHTML = ins.map(i => {
      const k = i.kind, isPb = k === 'pb' || k === 'pbnc';
      const col = i.color || (k === 'pbnc' ? 'red' : k === 'pb' ? 'green' : 'gray');
      return `<button type="button" class="ib ib-${k}" data-a="${i.a}" style="--cap:${PL.LCOL[col] || '#8a949b'}" aria-pressed="false" aria-label="${esc((i.label || '') + ' ' + i.a)}${isPb ? ' (press and release)' : ''}"><span class="cap" aria-hidden="true"></span><span class="l">${esc(i.label || i.a)}</span><span class="a">${i.a}${k === 'pbnc' ? ' · NC' : k === 'ncsw' ? ' · NC' : ''}</span></button>`;
    }).join('');
    ioBox.hidden = !ins.length;
    updIO();
  }
  function updIO(){
    $$('.ib', ioBox).forEach(b => {
      const i = ex.io.inputs.find(x => x.a === b.dataset.a), k = i.kind;
      const act = k === 'pb' || k === 'pbnc' ? !!pressed[i.a] : k === 'ncsw' ? i.state === 0 : i.state === 1;
      b.classList.toggle('on', act); b.setAttribute('aria-pressed', act);
      const st = $('.a', b); if (k === 'ncsw') st.textContent = i.a + (act ? ' · open' : ' · NC');
    });
  }
  function setPress(a, v){
    const i = ex.io.inputs.find(x => x.a === a); if (!i) return;
    if (i.kind === 'pb' || i.kind === 'pbnc'){
      if (v){ pressed[a] = true; i._t = performance.now(); }
      else { const held = performance.now() - (i._t || 0); if (held < 150){ setTimeout(() => { pressed[a] = false; e.setIn(a, physFor(i)); updIO(); }, 150 - held); return; } pressed[a] = false; }
    } else { i.state = i.state ? 0 : 1; }
    e.setIn(a, physFor(i)); updIO(); renderLeds();
  }
  ioBox.addEventListener('pointerdown', ev => { const b = ev.target.closest('.ib'); if (!b) return; const i = ex.io.inputs.find(x => x.a === b.dataset.a); if (i.kind === 'pb' || i.kind === 'pbnc'){ ev.preventDefault(); try { b.setPointerCapture(ev.pointerId); } catch (er){} setPress(i.a, true); } });
  const rel = ev => { const b = ev.target.closest('.ib'); if (!b) return; const i = ex.io.inputs.find(x => x.a === b.dataset.a); if ((i.kind === 'pb' || i.kind === 'pbnc') && pressed[i.a]) setPress(i.a, false); };
  ioBox.addEventListener('pointerup', rel); ioBox.addEventListener('pointercancel', rel); ioBox.addEventListener('lostpointercapture', rel);
  ioBox.addEventListener('click', ev => { const b = ev.target.closest('.ib'); if (!b) return; const i = ex.io.inputs.find(x => x.a === b.dataset.a); if (i.kind !== 'pb' && i.kind !== 'pbnc') setPress(i.a); else if (ev.detail === 0){ setPress(i.a, true); setTimeout(() => setPress(i.a, false), 400); } });
  ioBox.addEventListener('keydown', ev => { const b = ev.target.closest('.ib'); if (!b || ev.repeat) return; const i = ex.io.inputs.find(x => x.a === b.dataset.a); if ((i.kind === 'pb' || i.kind === 'pbnc') && ev.key === ' '){ ev.preventDefault(); setPress(i.a, true); } });
  ioBox.addEventListener('keyup', ev => { const b = ev.target.closest('.ib'); if (!b) return; const i = ex.io.inputs.find(x => x.a === b.dataset.a); if ((i.kind === 'pb' || i.kind === 'pbnc') && ev.key === ' ') setPress(i.a, false); });
  ioBox.addEventListener('contextmenu', ev => ev.preventDefault());

  function pctlRender(){
    const c = P().ctl || [];
    pctl.innerHTML = c.map(x => `<button type="button" class="btn" data-c="${x.id}">${esc(x.label(plantSt))}</button>`).join('');
    pctl.hidden = !c.length;
  }
  pctl.addEventListener('click', ev => { const b = ev.target.closest('[data-c]'); if (!b) return; const c = P().ctl.find(x => x.id === b.dataset.c); c.act(plantSt); pctlRender(); renderPlant(); });

  function renderLeds(){
    const ins = (ex.io.inputs || []).filter(i => i.a[0] === 'I' && i.a[1] !== 'W'), outs = (ex.io.outputs || []);
    const sig = ins.map(i => i.a).join() + '|' + outs.map(o => o.a).join() + '|' + forceMode;
    if (leds.dataset.sig !== sig){
      const chip = (a, lab) => `<button type="button" class="led" data-a="${a}"${forceMode ? '' : ' tabindex="-1"'} title="${esc(lab || '')}" aria-label="${a} ${esc(lab || '')}">${a}<i hidden></i></button>`;
      leds.innerHTML = `<div class="lr"><span class="lt lrun"></span><span class="lt">IN</span>${ins.map(i => chip(i.a, i.label)).join('')}</div><div class="lr"><span class="lt"></span><span class="lt">OUT</span>${outs.map(o => chip(o.a, o.label)).join('')}</div>`;
      leds.dataset.sig = sig; leds.classList.toggle('fm', forceMode);
    }
    const rn = $('.lrun', leds), rh = running ? '<b class="run">RUN</b>' : '<b class="stp">STOP</b>';
    if (rn.innerHTML !== rh) rn.innerHTML = rh;
    $$('.led', leds).forEach(b => {
      const a = b.dataset.a, f = forces[a], v = ENG.kind(a) === 'Q' ? e.out[a] : (a in forces ? forces[a] : e.phys[a]);
      b.classList.toggle('on', !!v); b.classList.toggle('f', f != null);
      const i = b.querySelector('i'); i.hidden = f == null; if (f != null && i.textContent !== 'F' + f) i.textContent = 'F' + f;
    });
  }
  leds.addEventListener('click', ev => {
    const b = ev.target.closest('.led'); if (!b || !forceMode) return;
    const a = b.dataset.a, cur = forces[a];
    if (cur == null) forces[a] = 1; else if (cur === 1) forces[a] = 0; else delete forces[a];
    e.force = Object.assign({}, forces);
    if (!running && ENG.kind(a) === 'Q'){ /* in STOP the outputs stay off: a real PLC only forces in RUN */ }
    renderLeds(); status(`Force: ${a} ${a in forces ? '= ' + forces[a] : 'removed'}. ${running ? '' : 'Switch to RUN to see the force on the outputs.'}`);
  });
  if (frcB) frcB.addEventListener('click', () => { forceMode = !forceMode; frcB.setAttribute('aria-pressed', forceMode); renderLeds(); status(forceMode ? 'Force mode: tap the LED of any I or Q below to force it to 1, tap again to force 0, and a third time to remove it.' : 'You left force mode. Any forces you set stay on until you remove them.'); });

  /* ---------- run / stop ---------- */
  function start(){ if (running) return; freshEngine(); running = true; runB.textContent = '■ STOP'; runB.setAttribute('aria-pressed', 'true'); runB.classList.add('on'); loop.start(); renderAll(); }
  function stop(){ if (!running) return; running = false; runB.textContent = '▶ RUN'; runB.setAttribute('aria-pressed', 'false'); runB.classList.remove('on'); e.out = {}; e.Q = {}; e.pw = e.prog.map(() => null); renderAll(); }
  runB.addEventListener('click', () => running ? stop() : start());
  const loop = PL.animate(host, dt => {
    acc += dt; let n = 0;
    if (demo) acc = 0; /* the machine preview drives the clock itself */
    while (acc >= 0.02 && n < 6){ acc -= 0.02; n++; P().step(plantSt, e, 0.02); if (running) e.scan(0.02); }
    if (n === 6) acc = 0;
    rdT += dt;
    renderPlant(); renderLeds();
    if (running && !demo && rdT > 0.09){ rdT = 0; refreshRungs(); }
  });

  /* ---------- check ---------- */
  function cases(){ return ex.cases || [{steps:ex.tests || []}]; }
  function check(){
    const lint = ENG.lint(prog).filter(m => m.kind === 'addr' || m.kind === 'operand');
    if (lint.length){ show(false, 'An element is missing its address or has a wrong one: ' + esc(lint[0].text)); return {ok:false, msg:lint[0].text}; }
    for (const c of cases()){
      const r = ENG.check(prog, {io:ex.io, plant:ex.plant, plantOpt:Object.assign({}, ex.plantOpt || {}, c.plantOpt || {}), tests:c.steps}, {cols});
      if (!r.ok){ lastRes = r; show(false, (c.name ? `<b>${esc(c.name)}:</b> ` : '') + r.msg); $('[data-t=sol]', host).hidden = !ex.sol; return r; }
    }
    lastRes = {ok:true};
    const first = PL.mark(opt.lesson, ex.key);
    show(true, ex.ok || 'The program passed all the tests.');
    task.classList.add('ok');
    if (tabs) { const b = tabs.querySelector(`[data-k="${exs.indexOf(ex)}"]`); if (b) b.classList.add('done'); }
    if (ex.sol) $('[data-t=sol]', host).hidden = false;
    return {ok:true, first};
  }
  function show(ok, html){ resBox.hidden = false; resBox.className = 'ls-res ' + (ok ? 'ok' : 'no'); resBox.innerHTML = `<b>${ok ? '✓ Done!' : '✗ Not yet:'}</b> ${html}`; }
  function status(html){ resBox.hidden = false; resBox.className = 'ls-res'; resBox.innerHTML = html; }
  chkB.addEventListener('click', () => { check(); resBox.scrollIntoView({block:'nearest', behavior:reduced() ? 'auto' : 'smooth'}); });

  /* ---------- tools ---------- */
  $('.ls-tools', host).addEventListener('click', ev => {
    const b = ev.target.closest('[data-t]'); if (!b) return;
    const t = b.dataset.t;
    if (t === 'add'){ if (prog.length >= 10){ status('Maximum 10 rungs per exercise.'); return; } prog.push(ENG.blankRung(cols)); sel = {i:prog.length - 1, r:0, c:0}; changed(); scrollSel(); }
    else if (t === 'hint') hintBox.hidden = !hintBox.hidden;
    else if (t === 'reset'){ backup = ENG.serialize(prog); prog = ENG.program(ex.start || [ENG.serialize([ENG.blankRung(cols)])[0]], cols); sel = null; changed(); $('[data-t=undo]', host).hidden = false; status('The program is back to its start. If you want what you had, press "Restore my program".'); }
    else if (t === 'sol'){ backup = ENG.serialize(prog); prog = ENG.program(ex.sol, cols); sel = null; changed(); $('[data-t=undo]', host).hidden = false; status('This is one possible solution (not the only one). Run it, try it, and read what each rung does.'); }
    else if (t === 'undo' && backup){ prog = ENG.program(backup, cols); backup = null; sel = null; changed(); b.hidden = true; status('Your program is back.'); }
  });
  if (tabs) tabs.addEventListener('click', ev => { const b = ev.target.closest('[data-k]'); if (b) select(+b.dataset.k); });

  /* ---------- ladder drawing ---------- */
  const lab = a => { const all = (ex.io.inputs || []).concat(ex.io.outputs || []).concat(ex.syms || []); const f = all.find(x => x.a === a); return f ? f.label : ''; };
  const rungSvg = (rg, i) => drawRung(rg, i, {cols, running:running && !demo, e, sel, lab, hit:true});
  function renderLadder(){
    const focus = document.activeElement && lad.contains(document.activeElement) && document.activeElement.dataset ? Object.assign({}, document.activeElement.dataset) : null;
    lad.innerHTML = prog.map((rg, i) => `<div class="ls-rung${sel && sel.i === i ? ' cur' : ''}" data-i="${i}"><div class="ls-rh" dir="ltr"><b>Rung ${i + 1}</b><span class="sp"></span><button type="button" class="btn sm" data-rt="row+" ${rg.rows.length >= 3 ? 'disabled' : ''} aria-label="Add a row (branch) to rung ${i + 1}">+ Branch</button><button type="button" class="btn sm" data-rt="row-" ${rg.rows.length <= 1 ? 'disabled' : ''} aria-label="Remove the last row from rung ${i + 1}">− Row</button><button type="button" class="btn sm" data-rt="del" ${prog.length <= 1 ? 'disabled' : ''} aria-label="Delete rung ${i + 1}">✕</button></div>${rungSvg(rg, i)}</div>${sel && sel.i === i ? pickerHtml() : ''}`).join('');
    if (focus && focus.i != null){ const f = lad.querySelector(`.lhit[data-i="${focus.i}"][data-r="${focus.r}"][data-c="${focus.c}"]`) || (focus.pk ? lad.querySelector(`[data-pk="${focus.pk}"]${focus.v ? `[data-v="${focus.v}"]` : ''}`) : null); if (f) f.focus({preventScroll:true}); }
  }
  /* live monitoring: redraw only the rung drawings, so the open picker (and any field being typed in) stays put */
  function refreshRungs(){
    const ae = document.activeElement, fd = ae && ae.classList && ae.classList.contains('lhit') && lad.contains(ae) ? Object.assign({}, ae.dataset) : null;
    $$('.ls-rung', lad).forEach(div => { const i = +div.dataset.i, old = $('.ls-svg', div); if (!prog[i] || !old) return; const t = document.createElement('div'); t.innerHTML = rungSvg(prog[i], i); old.replaceWith(t.firstChild); });
    if (fd){ const f = lad.querySelector(`.lhit[data-i="${fd.i}"][data-r="${fd.r}"][data-c="${fd.c}"]`); if (f) f.focus({preventScroll:true}); }
  }
  function renderLint(){
    const m = ENG.lint(prog);
    lintBox.innerHTML = m.length ? `<div class="box">${m.map(x => `<div>⚠ ${esc(x.text)}</div>`).join('')}</div>` : '';
  }
  function renderPlant(){ plantBox.innerHTML = P().svg(plantSt, e, ex); }
  function renderAll(){ renderPlant(); renderLeds(); renderLadder(); renderLint(); updIO(); }
  function scrollSel(){ const p = $('.lp', lad); if (p) p.scrollIntoView({block:'nearest', behavior:reduced() ? 'auto' : 'smooth'}); }

  /* ---------- picker ---------- */
  function addrChoices(t){
    const acc = ENG.accepts[t] || [], out = [], seen = {};
    const add = (a, l) => { if (seen[a] || acc.indexOf(ENG.kind(a)) < 0) return; seen[a] = 1; out.push([a, l || '']); };
    (ex.io.inputs || []).forEach(i => add(i.a, i.label)); (ex.io.outputs || []).forEach(o => add(o.a, o.label)); (ex.syms || []).forEach(o => add(o.a, o.label));
    prog.forEach(rg => rg.rows.forEach(row => row.forEach(el => { if (el && el.a) add(el.a, lab(el.a)); if (el && el.o) add(el.o); })));
    ['M0.0', 'M0.1', 'M0.2', 'M0.3', 'T0', 'T1', 'T2', 'C0', 'C1', 'MW10'].forEach(a => add(a));
    return out;
  }
  function pickerHtml(){
    const rg = prog[sel.i], el = rg.rows[sel.r][sel.c], outCol = sel.c === cols - 1;
    const types = outCol ? ['NONE', 'OUT', 'S', 'R', 'TON', 'TOF', 'TP', 'CTU', 'CTD', 'SCL'] : ['NONE', 'W', 'NO', 'NC', 'P', 'N', 'CMP'];
    const cur = el ? el.t : 'NONE';
    let h = `<div class="lp" dir="ltr" role="group" aria-label="Edit cell"><div class="lp-h"><b>Rung ${sel.i + 1} · row ${sel.r + 1} · cell ${sel.c + 1}</b>${outCol ? '<span class="muted"> (output column)</span>' : ''}<button type="button" class="btn sm" data-pk="close" aria-label="Close">✕</button></div>`;
    h += `<div class="lp-els">${types.map(t => `<button type="button" class="btn lp-el" data-pk="el" data-v="${t}" aria-pressed="${t === cur}">${elIcon(t)}<span>${t === 'NONE' ? 'Empty' : EL_LABEL[t]}</span></button>`).join('')}</div>`;
    if (el && el.t !== 'W'){
      h += `<p class="lp-help muted">${EL_HELP[el.t] || ''}</p>`;
      const ch = addrChoices(el.t);
      h += `<div class="lp-addr"><span class="lp-k">${el.t === 'SCL' ? 'Analog input:' : 'Address:'}</span>${ch.map(([a, l]) => `<button type="button" class="btn chip" data-pk="addr" data-v="${a}" aria-pressed="${el.a === a}">${a}${l ? `<small>${esc(l)}</small>` : ''}</button>`).join('')}<form class="lp-free" data-pk="free"><input class="inp mono" name="a" maxlength="8" placeholder="${outCol ? 'Q0.5' : 'I0.5'}" aria-label="Other address" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn sm" type="submit">Set</button></form></div>`;
      if (el.pt != null) h += `<label class="lp-par">Time PT (seconds) <input class="inp mono" type="number" step="0.1" min="0.1" max="600" data-pk="pt" value="${el.pt}" inputmode="decimal"></label>`;
      if (el.pv != null) h += `<label class="lp-par">Value PV <input class="inp mono" type="number" step="1" min="1" max="9999" data-pk="pv" value="${el.pv}" inputmode="numeric"></label>`;
      if (el.t === 'CMP') h += `<div class="lp-par">Condition: <span class="mono">${esc(el.a || '?')}</span><select class="inp mono" data-pk="op" aria-label="Comparison type">${ENG.CMPOPS.map(o => `<option${o === el.op ? ' selected' : ''}>${o}</option>`).join('')}</select><input class="inp mono" type="number" step="any" data-pk="b" value="${el.b}" aria-label="Value" inputmode="decimal"></div>`;
      if (el.t === 'SCL') h += `<div class="lp-par">Output <select class="inp mono" data-pk="o" aria-label="Scale output">${['MW10', 'MW12', 'MW14'].map(o => `<option${o === el.o ? ' selected' : ''}>${o}</option>`).join('')}</select> from <input class="inp mono" type="number" step="any" data-pk="lo" value="${el.lo}" aria-label="Minimum"> to <input class="inp mono" type="number" step="any" data-pk="hi" value="${el.hi}" aria-label="Maximum"></div>`;
    }
    const brs = [];
    if (sel.r === 0 && !outCol) brs.push(`<button type="button" class="btn" data-pk="par">⫴ Parallel branch for this cell (OR)</button>`);
    if (sel.r === 0 && outCol) brs.push(`<button type="button" class="btn" data-pk="par">⫴ Parallel output (another coil)</button>`);
    if (sel.r > 0){
      const L = rg.links[sel.r - 1];
      if (sel.c > 0) brs.push(`<button type="button" class="btn" data-pk="lk" data-v="${sel.c}" aria-pressed="${L.indexOf(sel.c) >= 0}">┘ Link left-up</button>`);
      if (sel.c + 1 <= cols - 1) brs.push(`<button type="button" class="btn" data-pk="lk" data-v="${sel.c + 1}" aria-pressed="${L.indexOf(sel.c + 1) >= 0}">└ Link right-up</button>`);
    }
    h += `<div class="lp-br">${brs.join('')}</div><p class="lp-help muted">The drawing runs left to right like any PLC program: the line on the left is the power source, and the coils are in the last column on the right.</p></div>`;
    return h;
  }
  function setEl(t){
    const rg = prog[sel.i], old = rg.rows[sel.r][sel.c];
    if (t === 'NONE'){ rg.rows[sel.r][sel.c] = null; changed(); return; }
    if (t === 'W'){ rg.rows[sel.r][sel.c] = {t:'W'}; changed(); return; }
    const ch = addrChoices(t), keep = old && old.a && (ENG.accepts[t] || []).indexOf(ENG.kind(old.a)) >= 0;
    let a = keep ? old.a : '';
    if (!a){ const pref = {TON:'T', TOF:'T', TP:'T', CTU:'C', CTD:'C', SCL:'IW', CMP:'C'}[t]; const f = ch.find(x => !pref || ENG.kind(x[0]) === pref) || ch[0]; a = f ? f[0] : ''; if (t === 'SCL') a = 'IW64'; }
    const el = ENG.parse(t + ':' + a); if (t === 'SCL'){ el.a = 'IW64'; el.o = 'MW10'; }
    if (t === 'CMP' && ex.cmpDef){ el.a = ex.cmpDef; }
    rg.rows[sel.r][sel.c] = el; changed();
  }
  function parallel(){
    const rg = prog[sel.i], outCol = sel.c === cols - 1;
    let r = -1;
    for (let k = 1; k < rg.rows.length; k++) if (!rg.rows[k][sel.c]){ r = k; break; }
    if (r < 0){ if (rg.rows.length >= 3){ status('This rung already has 3 rows. That\'s the most the simulator allows.'); return; } rg.rows.push(new Array(cols).fill(null)); rg.links.push([]); r = rg.rows.length - 1; }
    const L = rg.links[r - 1];
    if (outCol){ rg.rows[r][sel.c] = ENG.parse('OUT:'); if (L.indexOf(sel.c) < 0) L.push(sel.c); }
    else { rg.rows[r][sel.c] = ENG.parse('NO:'); if (sel.c > 0 && L.indexOf(sel.c) < 0) L.push(sel.c); if (L.indexOf(sel.c + 1) < 0) L.push(sel.c + 1); }
    /* a branch row deeper than 1 also needs the links through the row above it */
    const nodes = outCol ? [sel.c] : [sel.c, sel.c + 1].filter(n => n > 0);
    for (let k = r - 1; k >= 1; k--){ const LL = rg.links[k - 1]; nodes.forEach(n => { if (LL.indexOf(n) < 0) LL.push(n); }); }
    sel = {i:sel.i, r, c:sel.c};
    changed(); scrollSel();
  }
  lad.addEventListener('click', ev => {
    const hit = ev.target.closest('.lhit');
    if (hit){ const s2 = {i:+hit.dataset.i, r:+hit.dataset.r, c:+hit.dataset.c}; sel = sel && sel.i === s2.i && sel.r === s2.r && sel.c === s2.c ? null : s2; renderLadder(); if (sel){ const f = lad.querySelector(`.lhit[data-i="${s2.i}"][data-r="${s2.r}"][data-c="${s2.c}"]`); if (f) f.focus({preventScroll:true}); scrollSel(); } return; }
    const rt = ev.target.closest('[data-rt]');
    if (rt){ const i = +rt.closest('.ls-rung').dataset.i, rg = prog[i];
      if (rt.dataset.rt === 'row+' && rg.rows.length < 3){ rg.rows.push(new Array(cols).fill(null)); rg.links.push([]); sel = {i, r:rg.rows.length - 1, c:0}; }
      else if (rt.dataset.rt === 'row-' && rg.rows.length > 1){ rg.rows.pop(); rg.links.pop(); if (sel && sel.i === i && sel.r >= rg.rows.length) sel = null; }
      else if (rt.dataset.rt === 'del' && prog.length > 1){ prog.splice(i, 1); sel = null; }
      changed(); return; }
    const pk = ev.target.closest('[data-pk]'); if (!pk || !sel) return;
    const k = pk.dataset.pk, rg = prog[sel.i], el = rg.rows[sel.r][sel.c];
    if (k === 'close'){ sel = null; renderLadder(); }
    else if (k === 'el') setEl(pk.dataset.v);
    else if (k === 'addr' && el){ el.a = pk.dataset.v; changed(); }
    else if (k === 'par') parallel();
    else if (k === 'lk'){ const L = rg.links[sel.r - 1], n = +pk.dataset.v, j = L.indexOf(n); if (j >= 0) L.splice(j, 1); else L.push(n); changed(); }
  });
  lad.addEventListener('keydown', ev => { const hit = ev.target.closest('.lhit'); if (hit && (ev.key === 'Enter' || ev.key === ' ')){ ev.preventDefault(); hit.dispatchEvent(new MouseEvent('click', {bubbles:true})); } });
  lad.addEventListener('submit', ev => {
    ev.preventDefault(); const f = ev.target.closest('form'); if (!f || !sel) return;
    const el = prog[sel.i].rows[sel.r][sel.c], a = ENG.norm(f.a.value), k = ENG.kind(a);
    if (!k || (ENG.accepts[el.t] || []).indexOf(k) < 0){ status(`Address "${esc(f.a.value)}" can't be used with ${el.t}. Valid examples: ${ENG.accepts[el.t].map(x => ({I:'I0.3', Q:'Q0.2', M:'M1.0', T:'T3', C:'C2', IW:'IW64', MW:'MW12'}[x])).join(' · ')}`); return; }
    el.a = a; changed();
  });
  lad.addEventListener('change', ev => {
    const t = ev.target, k = t.dataset && t.dataset.pk; if (!k || !sel) return;
    const el = prog[sel.i].rows[sel.r][sel.c]; if (!el) return;
    if (k === 'pt'){ const v = num(t.value); if (v > 0) el.pt = Math.min(600, Math.round(v * 10) / 10); }
    else if (k === 'pv'){ const v = Math.round(num(t.value)); if (v > 0) el.pv = Math.min(9999, v); }
    else if (k === 'op') el.op = t.value;
    else if (k === 'b'){ const v = num(t.value); if (isFinite(v)) el.b = v; }
    else if (k === 'o') el.o = t.value;
    else if (k === 'lo' || k === 'hi'){ const v = num(t.value); if (isFinite(v)) el[k] = v; }
    changed();
  });

  /* ---------- machine preview («▶ شوف المكنة شغّالة»): the hidden solution runs on a fresh engine + machine ---------- */
  const pvAd = {host, watchEl:plantBox, title:'The machine running correctly',
    mount(box){ task.after(box); }, key:() => 'l/' + opt.lesson + '/' + ex.key, ex:() => ex, has:() => !!(ex && ex.sol),
    begin(po){
      demo = {running, e, plantSt, sel, ins:(ex.io.inputs || []).map(i => ({i, state:i.state})), pressed:Object.assign({}, pressed)};
      sel = null;
      (ex.io.inputs || []).forEach(i => { i.state = defIn(i); pressed[i.a] = false; });
      plantSt = P().create(po);
      e = new ENG.Engine(ENG.program(ex.sol, cols), {cols});
      (ex.io.inputs || []).forEach(i => { const v = physFor(i); if (v != null) e.setIn(i.a, v); });
      running = true; renderAll(); nhUpdate();
    },
    end(){
      if (!demo) return; const d = demo; demo = null;
      running = d.running; e = d.e; plantSt = d.plantSt; sel = d.sel;
      d.ins.forEach(x => { x.i.state = x.state; }); Object.keys(pressed).forEach(a => delete pressed[a]); Object.assign(pressed, d.pressed);
      renderAll(); nhUpdate();
    },
    advance(dt){ P().step(plantSt, e, dt); e.scan(dt); },
    engine:() => e, plant:() => plantSt,
    setIn(a, v){ const i = (ex.io.inputs || []).find(x => x.a === a); if (!i){ e.setIn(a, v); return; }
      if (i.kind === 'pb' || i.kind === 'pbnc') pressed[a] = v !== defIn(i); else i.state = v;
      const pv = physFor(i); e.setIn(a, pv == null ? v : pv); updIO(); renderLeds(); },
    inBtn:a => ioBox.querySelector(`.ib[data-a="${a}"]`), outEl:a => leds.querySelector(`.led[data-a="${a}"]`), plantEl:() => plantBox,
    lab:a => lab(a), addr:a => a, xl:s => s,
    outro:() => '<b>That\'s the machine working as required.</b> Now it\'s your turn: write the program that makes it work like this, switch to <bdi dir="ltr">RUN</bdi> and try it with the buttons, then press "Test program".'};
  if (!opt.demoOnly && !opt.noPreview) PL.preview.attach(pvAd);
  select(0);
  const api = {host, preview:pvAd, get demo(){ return !!demo; }, get ex(){ return ex; }, get prog(){ return prog; }, get engine(){ return e; }, get plant(){ return plantSt; }, get running(){ return running; },
    select, start, stop, check, load(def){ prog = ENG.program(def, cols); changed(); }, press:setPress, exercises:exs, lesson:opt.lesson,
    pick(i, r, c){ sel = {i, r, c}; renderLadder(); }, setEl(t){ setEl(t); }, lint: () => ENG.lint(prog)};
  if (!opt.demoOnly) (PL._sims = PL._sims || []).push(api);
  return api;
};

/* run an exercise's own solution through its tests (used by the test-suite and to make sure every task is solvable) */
PL.selfTest = function(ex, cols){
  const run = def => (ex.cases || [{steps:ex.tests || []}]).map(c => ENG.check(def, {io:ex.io, plant:ex.plant, plantOpt:Object.assign({}, ex.plantOpt || {}, c.plantOpt || {}), tests:c.steps}, {cols:cols || 5})).find(r => !r.ok) || {ok:true};
  return {sol:ex.sol ? run(ex.sol) : null, start:run(ex.start || [])};
};

/* ================= lesson widgets ================= */

/* ---------- PLC drawings for the hub / lesson cards ---------- */
PL.art = {
  plc(o){ o = o || {};
    const ledI = o.i || [1, 0, 1, 0, 0, 1, 0, 0], ledQ = o.q || [1, 0, 0, 1, 0, 0];
    return `<svg viewBox="0 0 160 110" role="img" aria-label="PLC">${RA.rail(0, 50, 160)}<g filter="url(#ra-sh)"><rect x="8" y="8" width="144" height="94" rx="5" fill="url(#ra-plastic)" stroke="#a9aeb2"/><rect x="8" y="8" width="22" height="94" rx="5" fill="#e3e5e6"/>
      <rect x="32" y="10" width="118" height="16" rx="2" fill="url(#ra-term)"/><rect x="32" y="84" width="118" height="16" rx="2" fill="url(#ra-term)"/></g>
      ${Array.from({length:9}, (_, k) => RA.screw(39 + k * 13.2, 18, 3.6) + RA.screw(39 + k * 13.2, 92, 3.6)).join('')}
      ${ledI.map((v, k) => RA.led(36 + k * 9, 32, v, '#36d36a', 6, 4)).join('')}${ledQ.map((v, k) => RA.led(36 + k * 9, 72, v, '#36d36a', 6, 4)).join('')}
      <rect x="36" y="42" width="66" height="24" rx="2" fill="#cfd3d5" stroke="#b5b9bc"/>${RA.T(69, 52, 'CPU', 8, '#3b4146', 'middle', 700)}${RA.T(69, 61, 'DC/DC/DC', 5.5, '#6a6e72', 'middle')}
      ${RA.led(110, 44, true, '#36d36a', 6, 4)}${RA.T(119, 48, 'RUN', 5, '#555')}${RA.led(110, 54, false, '#ff4a3d', 6, 4)}${RA.T(119, 58, 'ERR', 5, '#555')}</svg>`; },
  ladder(){ return `<svg viewBox="0 0 160 110" role="img" aria-label="Ladder program"><path d="M10 8V102M150 8V102" stroke="var(--ink)" stroke-width="3"/><path d="M10 34H40M52 34H80M92 34H112M138 34H150" stroke="#2fd35a" stroke-width="3"/><path d="M40 22V46M52 22V46M80 22V46M92 22V46" stroke="#2fd35a" stroke-width="3"/><path d="M84 46L96 22" stroke="#2fd35a" stroke-width="2"/><path d="M118 22q-8 12 0 24M132 22q8 12 0 24" fill="none" stroke="#2fd35a" stroke-width="3"/><path d="M10 74H40M52 74H66V34" fill="none" stroke="var(--muted)" stroke-width="3"/><path d="M40 62V86M52 62V86" stroke="var(--muted)" stroke-width="3"/><text x="46" y="18" text-anchor="middle" style="font:600 8px var(--font-mono);fill:var(--ink)">I0.0</text><text x="86" y="18" text-anchor="middle" style="font:600 8px var(--font-mono);fill:var(--ink)">I0.1</text><text x="125" y="18" text-anchor="middle" style="font:600 8px var(--font-mono);fill:var(--ink)">Q0.0</text><text x="46" y="58" text-anchor="middle" style="font:600 8px var(--font-mono);fill:var(--ink)">Q0.0</text></svg>`; },
  sensor(){ return `<svg viewBox="0 0 160 110" role="img" aria-label="Sensor"><g transform="translate(34 46) scale(1.15)">${RA.prox(0, 0, 'PNP', {target:false})}</g><path d="M22 38q-12 21 0 42M28 44q-8 15 0 30" fill="none" stroke="var(--accent)" stroke-width="2.5"/></svg>`; },
  contactor(){ return `<svg viewBox="0 0 160 110" role="img" aria-label="Contactor">${contactorSvg(80, 50, '', true).replace('translate(80 50)', 'translate(80 50) scale(1.8)')}</svg>`; },
  motor(){ return `<svg viewBox="0 0 160 110" role="img" aria-label="Motor">${motorSvg(80, 52, 76, 18, true)}</svg>`; }
};

/* ---------- lesson 1: the scan cycle ---------- */
PL.scanDemo = function(host, opt){
  const L = opt.lesson, PH = ['read', 'exec', 'write'];
  const S = {sw:0, II:0, Q:0, out:0, ph:0, t:0, spd:'slow', seenOn:false, seenOff:false, pulse:0, scans:0, hold:false};
  host.innerHTML = `<div class="sd-art wd-art"></div><div class="wd-ctl"><button type="button" class="btn sd-sw" aria-pressed="false">Switch I0.0: OFF</button><button type="button" class="btn sd-pulse">Short pulse 0.3 s</button></div>
    <div class="tabs" role="group" aria-label="Scan speed"><button type="button" class="btn" data-s="slow" aria-pressed="true">Slow (1 s per stage)</button><button type="button" class="btn" data-s="step" aria-pressed="false">Step by step</button><button type="button" class="btn" data-s="fast" aria-pressed="false">Real speed</button></div>
    <div class="wd-ctl"><button type="button" class="btn pri sd-next" hidden>Next stage →</button></div>
    <p class="msg sd-msg" aria-live="polite"></p><p class="chal sd-chal">Turn the switch on and wait for the lamp to light, then turn it off and wait for the lamp to go out. Notice the lamp only changes in the <b>write outputs</b>.</p>`;
  const art = $('.sd-art', host), msg = $('.sd-msg', host), fin = chal(host, '.sd-chal', L, 'scan');
  const txt = {read:'<b>1. Read inputs:</b> the PLC looks at every input terminal once and stores them in a table called the <b>Input image</b>. If the switch changes after that, the program won\'t know until the next scan.',
    exec:'<b>2. Execute the program:</b> it goes through the rungs from top to bottom and works out every coil from the table (not from the wire itself). The result goes into the <b>Output image</b>.',
    write:'<b>3. Write outputs:</b> only now does the result go out to the output terminals and the lamp changes. Then it reads the inputs again… and so on forever.'};
  function phase(){
    const p = PH[S.ph];
    if (p === 'read') S.II = S.sw;
    if (p === 'exec') S.Q = S.II;
    if (p === 'write'){ const was = S.out; S.out = S.Q; S.scans++; if (S.out && S.sw) S.seenOn = true; if (S.seenOn && !S.out && !S.sw && was) S.seenOff = true; if (S.seenOn && S.seenOff) fin(); }
  }
  function advance(){ S.ph = (S.ph + 1) % 3; phase(); draw(); }
  function draw(){
    const p = PH[S.ph], act = k => p === k;
    const box = (x, y, k, t1, t2) => `<g class="sd-box${act(k) ? ' on' : ''}"><rect x="${x}" y="${y}" width="112" height="46" rx="10"/><text x="${x + 56}" y="${y + 20}" text-anchor="middle" class="ar sd-t">${t1}</text><text x="${x + 56}" y="${y + 37}" text-anchor="middle" class="sd-s">${t2}</text></g>`;
    art.innerHTML = `<svg viewBox="0 0 360 240" role="img" aria-label="Scan cycle">
      <g transform="translate(10 96)"><rect width="56" height="64" rx="6" fill="url(#ra-plasticV)" stroke="#a9aeb2" filter="url(#ra-sh)"/><circle cx="28" cy="30" r="17" fill="url(#ra-chrome)"/><circle cx="28" cy="30" r="14" fill="#1c1f22"/><g transform="rotate(${S.sw ? 45 : -45} 28 30)"><rect x="15" y="26" width="26" height="8" rx="4" fill="#4a5056"/><rect x="34" y="28" width="5" height="4" rx="1" fill="#fff"/></g><text x="28" y="80" text-anchor="middle" class="sd-s">I0.0</text><text x="28" y="94" text-anchor="middle" class="ar sd-s">Switch</text></g>
      <path d="M66 128H92" class="sd-w${S.sw ? ' hot' : ''}"/>
      <rect x="92" y="6" width="190" height="228" rx="14" class="sd-plc"/><text x="187" y="24" text-anchor="middle" class="sd-t">PLC</text>
      ${box(131, 34, 'read', 'Read inputs', 'I0.0 → ' + S.II)}
      ${box(131, 102, 'exec', 'Execute program', 'Q0.0 := I0.0')}
      ${box(131, 170, 'write', 'Write outputs', 'Q0.0 → ' + S.Q)}
      <path d="M187 80V100M187 148V168" class="sd-arr" marker-end="url(#sdA)"/><path d="M131 193H112V57H129" class="sd-arr" fill="none" marker-end="url(#sdA)"/>
      <defs><marker id="sdA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" class="sd-ah"/></marker></defs>
      <g transform="translate(104 34)"><rect width="22" height="16" rx="3" class="sd-img${S.II ? ' on' : ''}"/><text x="11" y="12" text-anchor="middle" class="sd-s">${S.II}</text></g>
      <path d="M282 128H300" class="sd-w${S.out ? ' hot' : ''}"/>
      <g transform="translate(300 98)">${lampSvg(28, 28, 20, LCOL.yellow, S.out)}<text x="28" y="72" text-anchor="middle" class="sd-s">Q0.0</text><text x="28" y="86" text-anchor="middle" class="ar sd-s">Lamp</text></g>
      <text x="187" y="230" text-anchor="middle" class="sd-s">scan #${S.scans}</text></svg>`;
    msg.innerHTML = S.spd === 'fast' ? 'In reality a scan takes about <b>1–20 milliseconds</b>, so the lamp seems to light at the same instant. But the order itself never changes.' : txt[p];
    $('.sd-sw', host).textContent = 'Switch I0.0: ' + (S.sw ? 'ON' : 'OFF'); $('.sd-sw', host).setAttribute('aria-pressed', !!S.sw);
  }
  $('.sd-sw', host).addEventListener('click', () => { S.sw = S.sw ? 0 : 1; S.pulse = 0; draw(); });
  $('.sd-pulse', host).addEventListener('click', () => { S.sw = 1; S.pulse = 0.3; draw(); if (S.spd !== 'fast') msg.innerHTML += '<br><b>Try this:</b> if the pulse ends before the "Read inputs" stage, the PLC never sees it at all. That\'s why very fast signals (an encoder, for example) have high-speed counter cards.'; });
  $$('[data-s]', host).forEach(b => b.addEventListener('click', () => { S.spd = b.dataset.s; $$('[data-s]', host).forEach(x => x.setAttribute('aria-pressed', x === b)); $('.sd-next', host).hidden = S.spd !== 'step'; S.t = 0; draw(); }));
  $('.sd-next', host).addEventListener('click', advance);
  animate(host, dt => {
    if (S.pulse > 0){ S.pulse -= dt; if (S.pulse <= 0){ S.pulse = 0; S.sw = 0; draw(); } }
    if (S.spd === 'step') return;
    S.t += dt; const per = S.spd === 'fast' ? 0.004 : 1.0;
    let n = 0; while (S.t >= per && n < 50){ S.t -= per; n++; S.ph = (S.ph + 1) % 3; phase(); }
    if (n) draw();
  });
  phase(); draw();
  return {S, advance, draw, toggle(){ $('.sd-sw', host).click(); }};
};

/* ---------- lesson 1: the parts of a PLC ---------- */
PL.parts = function(host, opt){
  const L = opt.lesson;
  const M = [
    {k:'psu', t:'PS', name:'Power supply (PSU)', en:'Power Supply', col:'#5d6469', d:'Takes 220V AC and gives <b>24V DC</b> for the CPU, the cards and the sensors. Most "the PLC is dead" problems start here or at the fuse before it.'},
    {k:'cpu', t:'CPU', name:'Processing unit (CPU)', en:'Central Processing Unit', col:'#2a3035', d:'The brain: it holds the program and the memory (M bits, timers, counters) and runs the scan cycle. It has <b>RUN / STOP / ERROR</b> LEDs and a programming port (USB or Ethernet).'},
    {k:'di', t:'DI', name:'Digital input card', en:'Digital Input (DI)', col:'#2b7a3d', d:'Receives on/off signals at 24V DC: push buttons, limit switches, PNP/NPN sensors, overload contacts. Each input has a small LED that lights when it gets 24V.'},
    {k:'do', t:'DO', name:'Digital output card', en:'Digital Output (DO)', col:'#b85f00', d:'Drives the loads: contactor coils, relays, pilot lamps, solenoid valves. Two types: <b>relay</b> (AC or DC, slower) and <b>transistor</b> (24V DC only, fast).'},
    {k:'ai', t:'AI', name:'Analog input card', en:'Analog Input (AI)', col:'#2f6fb3', d:'Reads a changing value: <b>4–20 mA</b> or <b>0–10 V</b> from a pressure, level or temperature transmitter, and turns it into a number (raw counts). There are special cards for thermocouples and PT100.'},
    {k:'ao', t:'AO', name:'Analog output card', en:'Analog Output (AO)', col:'#7b4fb3', d:'Gives out 4–20 mA or 0–10 V to control something gradually: a VFD\'s speed, a control valve\'s opening.'},
    {k:'com', t:'COM', name:'Communication card', en:'Communication', col:'#0d7584', d:'Profinet, Ethernet/IP, Modbus, RS485… links the PLC to the HMI, the drives and SCADA. (You don\'t need to visit it for the exercise.)', opt:true}
  ];
  const seen = {};
  host.innerHTML = `<div class="wd-art pa-art"></div><div class="box pa-info" aria-live="polite">Tap any card in the rack to see what it does.</div><p class="chal pa-chal">Visit the 6 main parts: PS, CPU, DI, DO, AI, AO.</p>`;
  const art = $('.pa-art', host), info = $('.pa-info', host), fin = chal(host, '.pa-chal', L, 'parts');
  function draw(cur){
    const w = 46, x0 = 18;
    art.innerHTML = `<svg viewBox="0 0 360 170" role="img" aria-label="PLC rack">${RA.rail(4, 128, 352)}${M.map((m, i) => { const x = x0 + i * w, on = cur === m.k; return `<g class="pa-m${on ? ' on' : ''}${seen[m.k] ? ' seen' : ''}" data-k="${m.k}" tabindex="0" role="button" aria-label="${esc(m.name)}"><g filter="url(#ra-sh)"><rect x="${x}" y="${m.k === 'cpu' ? 14 : 24}" width="${w - 4}" height="${m.k === 'cpu' ? 116 : 106}" rx="3" fill="url(#ra-dark)" stroke="${on ? 'var(--accent)' : '#111'}" stroke-width="${on ? 3 : 1}"/></g><rect x="${x + 2}" y="${m.k === 'cpu' ? 16 : 26}" width="${w - 8}" height="20" rx="2" fill="${m.col === '#2a3035' ? '#4a5157' : m.col}"/><rect x="${x + 2}" y="${m.k === 'cpu' ? 16 : 26}" width="${w - 8}" height="6" rx="2" fill="#fff" opacity=".18"/><text x="${x + (w - 4) / 2}" y="${m.k === 'cpu' ? 30 : 40}" text-anchor="middle" font-family="Arial,sans-serif" font-size="10.5" font-weight="700" fill="#fff">${m.t}</text>${m.k === 'cpu' ? `${RA.led(x + 6, 44, true, '#36d36a', 8, 5)}${RA.led(x + 6, 54, false, '#ff4a3d', 8, 5)}<rect x="${x + 6}" y="68" width="30" height="20" rx="2" fill="#15181a" stroke="#555"/><rect x="${x + 12}" y="74" width="18" height="8" rx="1" fill="#2a2e31"/><rect x="${x + 8}" y="96" width="26" height="12" rx="2" fill="#1b1e20" stroke="#4a5157"/>` : m.k !== 'psu' ? [0, 1, 2, 3, 4, 5].map(j => `${RA.led(x + 5, 52 + j * 11, (j + i) % 3 === 0, '#36d36a', 6, 4)}${RA.screw(x + 29, 54 + j * 11, 3.4)}`).join('') : `<rect x="${x + 6}" y="52" width="30" height="16" fill="url(#ra-vent)"/>${RA.led(x + 6, 76, true, '#36d36a', 8, 5)}<text x="${x + 21}" y="98" text-anchor="middle" font-family="Arial,sans-serif" font-size="7" font-weight="700" fill="#cfd6db">24V DC</text>${RA.screw(x + 12, 114, 3.6)}${RA.screw(x + 30, 114, 3.6)}`}${seen[m.k] ? `<circle cx="${x + w - 10}" cy="${m.k === 'cpu' ? 22 : 32}" r="6" fill="#2fd35a"/>` : ''}</g>`; }).join('')}<text x="180" y="162" text-anchor="middle" class="ar sd-s">The rack: every card mounts next to the other on the same DIN rail</text></svg>`;
  }
  onAct(host, '.pa-m', g => {
    const m = M.find(x => x.k === g.dataset.k); seen[m.k] = 1;
    info.innerHTML = `<b>${m.name}</b> <span class="mono">${m.en}</span><br>${m.d}`;
    draw(m.k); const f = art.querySelector(`[data-k="${m.k}"]`); if (f) f.focus({preventScroll:true});
    if (M.filter(x => !x.opt).every(x => seen[x.k])) fin();
  });
  draw();
  return {visit(k){ const g = art.querySelector(`[data-k="${k}"]`); g.dispatchEvent(new MouseEvent('click', {bubbles:true})); }};
};

/* ---------- lesson 2: I/O wiring bench ---------- */
const TERM_COL = {p24:'#d32f2f', p0:'#1f6fd1', sig:'#222', ac:'#7a4a22', n:'#1f6fd1'};
PL.wire = function(host, opt){
  const L = opt.lesson, exs = opt.exercises;
  let ex, wires = [], pend = null, passed = false, act = {}, demoLive = null, demoSt = null, err = null;
  host.innerHTML = `<div class="tabs" role="group" aria-label="Wiring exercises">${exs.map((x, j) => `<button type="button" class="btn${PL.has(L, x.key) ? ' done' : ''}" data-k="${j}" aria-pressed="${j === 0}">${esc(x.title)}</button>`).join('')}</div>
    <div class="chal wb-task"></div><div class="bn-board wb-board"></div>
    <div class="bn-tools"><button type="button" class="btn pri wb-chk">Test wiring</button><button type="button" class="btn wb-undo">Remove last wire</button><button type="button" class="btn wb-clr">Clear all</button></div>
    <div class="wb-res" aria-live="polite"></div><div class="wd-ctl wb-act" hidden></div>`;
  const board = $('.wb-board', host), res = $('.wb-res', host), actBox = $('.wb-act', host), taskBox = $('.wb-task', host);
  const T = id => ex.terms.find(t => t.id === id);
  function nets(){
    const p = {}; ex.terms.forEach(t => p[t.id] = t.id);
    const f = x => p[x] === x ? x : (p[x] = f(p[x]));
    wires.forEach(([a, b]) => { p[f(a)] = f(b); });
    return f;
  }
  function draw(){
    const live = demoLive || (passed ? ex.live(act) : {});
    let s = `<svg viewBox="0 0 360 ${ex.h || 300}" role="img" aria-label="Wiring board">${ex.art(live)}`;
    (demoLive ? [] : wires).forEach(([a, b], k) => { const A = T(a), B = T(b), mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 + 18, col = TERM_COL[A.pol] || TERM_COL[B.pol] || '#333'; const d = `M${A.x} ${A.y}Q${mx} ${my} ${B.x} ${B.y}`; s += `<g class="bw" data-w="${k}"><path d="${d}" class="bw-o"/><path d="${d}" class="bw-c" stroke="${col}"/><path d="${d}" class="bw-h"/><path d="${d}" class="bw-hit" tabindex="0" role="button" aria-label="Wire from ${esc(A.l)} to ${esc(B.l)}, tap to remove it"/></g>`; });
    ex.terms.forEach(t => { s += `<g class="bt${pend === t.id ? ' pend' : ''}" data-t="${t.id}"><circle cx="${t.x}" cy="${t.y}" r="16" class="bt-hit" tabindex="0" role="button" aria-label="Terminal ${esc(t.l)}"/><circle cx="${t.x}" cy="${t.y}" r="13" class="bt-ring${err && err.has(t.id) ? ' err' : ''}"/><circle cx="${t.x}" cy="${t.y}" r="7" class="bt-s"/><path d="M${t.x - 4} ${t.y}h8" class="bt-x"/><text x="${t.x + (t.lx || 0)}" y="${t.y + (t.ly != null ? t.ly : -12)}" class="bt-lab"${t.anc ? ` text-anchor="${t.anc}"` : ''}>${esc(t.l)}</text></g>`; });
    board.innerHTML = s + '</svg>';
    nhUpdate();
  }
  /* «💡 الخطوة الجاية» (window.NH, /assets/next-hint.js): CPU power first, then each net from its supply end; the latest wrong wire first */
  let nhCtl = null;
  const NH_IDEA = {BN:'sensor', BU:'sensor', PB13:'start', PB14:'input', IM:'com', OL:'com', OM:'com', RL:'com', KA1:'coil', KA2:'coil', HX1:'lamp', HX2:'lamp', I0:'input', I1:'input', Q0:'output', Q1:'output'};
  function nhUpdate(){
    if (!window.NH) return;
    if (!nhCtl) nhCtl = NH.mount(board, {course:'plc', onTap(s){ const my = err = new Set(s.hl); draw(); setTimeout(() => { if (err === my){ err = null; if (board.isConnected) draw(); } }, 3000); }});
    if (demoLive){ nhCtl.set(null); return; }
    const base = ['P24', 'P0', 'CL', 'CM', 'ACL', 'ACN'], sol = [];
    ex.groups.forEach(g => g.slice(1).forEach(t => sol.push([g[0], t])));
    sol.sort((a, c) => (base.includes(a[1]) ? 0 : 1) - (base.includes(c[1]) ? 0 : 1));
    nhCtl.set(NH.net({sol, wires, lab:id => (T(id) || {}).l || id, idea:p => NH.S.idea[base.includes(p[1]) ? 'supply' : NH_IDEA[p[1]] || 'input'], btn:$('.wb-chk', host).textContent.trim()}));
  }
  function select(k){
    if (demoSt) PL.preview.stop();
    ex = exs[k]; wires = []; pend = null; passed = false; act = {};
    taskBox.innerHTML = ex.task; taskBox.classList.toggle('ok', PL.has(L, ex.key));
    $$('.tabs [data-k]', host).forEach(b => b.setAttribute('aria-pressed', +b.dataset.k === k));
    res.innerHTML = ''; actBox.hidden = true; draw();
    if (pvAd.refresh) pvAd.refresh();
  }
  function tapTerm(id){
    if (pend == null){ pend = id; draw(); return; }
    if (pend === id){ pend = null; draw(); return; }
    const a = pend, b = id; pend = null;
    if (!wires.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) wires.push([a, b]);
    passed = false; actBox.hidden = true; res.innerHTML = ''; draw();
  }
  function check(){
    const f = nets(), grp = {}; ex.groups.forEach((g, i) => g.forEach(t => grp[t] = i));
    const gid = t => grp[t] != null ? grp[t] : 'x' + t;
    let bad = null, hl = null;
    /* wrong joins first: they can be dangerous */
    const ids = ex.terms.map(t => t.id);
    const wrong = [];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++){ const a = ids[i], b = ids[j]; if (f(a) === f(b) && gid(a) !== gid(b)) wrong.push([a, b]); }
    if (wrong.length){
      const dz = ex.danger && ex.danger(wrong[0][0], wrong[0][1], f);
      const w = wrong.find(([a, b]) => ex.why && (ex.why[a] || ex.why[b])) || wrong[0], hint = ex.why ? ex.why[w[0]] || ex.why[w[1]] || '' : '';
      bad = dz || `<b>${esc(T(w[0]).l)}</b> is connected to <b>${esc(T(w[1]).l)}</b>: wrong. ${hint}`; hl = dz ? wrong[0] : w;
    }
    if (!bad) for (const g of ex.groups){ for (let i = 1; i < g.length; i++) if (f(g[0]) !== f(g[i])){ bad = `<b>${esc(T(g[i]).l)}</b> is not connected to <b>${esc(T(g[0]).l)}</b> yet.${ex.why && ex.why[g[i]] ? ' ' + ex.why[g[i]] : ''}`; hl = [g[i], g[0]]; break; } if (bad) break; }
    if (bad){ res.innerHTML = `<div class="bn-bad"><b>✗</b> ${bad}</div>`; passed = false; actBox.hidden = true; const my = err = new Set(hl || []); draw(); setTimeout(() => { if (err === my){ err = null; if (board.isConnected) draw(); } }, 3000); return {ok:false, msg:bad}; }
    passed = true; PL.mark(L, ex.key); taskBox.classList.add('ok'); const tb = host.querySelector(`.tabs [data-k="${exs.indexOf(ex)}"]`); if (tb) tb.classList.add('done');
    res.innerHTML = `<div class="bn-ok"><b>Wiring correct ✓</b> ${ex.ok}</div>`;
    actBox.hidden = false; actBox.innerHTML = ex.acts.map(a => `<button type="button" class="btn" data-a="${a.k}" aria-pressed="false">${a.l}</button>`).join('');
    draw(); return {ok:true};
  }
  onAct(board, '.bt', g => tapTerm(g.dataset.t));
  onAct(board, '.bw', g => { wires.splice(+g.dataset.w, 1); passed = false; actBox.hidden = true; draw(); });
  actBox.addEventListener('click', ev => { const b = ev.target.closest('[data-a]'); if (!b) return; act[b.dataset.a] = !act[b.dataset.a]; b.setAttribute('aria-pressed', !!act[b.dataset.a]); draw(); });
  $('.wb-chk', host).addEventListener('click', check);
  $('.wb-undo', host).addEventListener('click', () => { wires.pop(); passed = false; actBox.hidden = true; draw(); });
  $('.wb-clr', host).addEventListener('click', () => { wires = []; pend = null; passed = false; actBox.hidden = true; res.innerHTML = ''; draw(); });
  $$('.tabs [data-k]', host).forEach(b => b.addEventListener('click', () => select(+b.dataset.k)));
  /* machine preview: what the correct wiring does (the wires themselves stay hidden: wiring is the learner's job) */
  const EFF = {target:['The sensor detected the metal', 'The sensor switched off'], i0:['LED I0.0 on the input card lit', 'LED I0.0 on the input card went off'], i1:['LED I0.1 on the input card lit', 'LED I0.1 on the input card went off'], q0:['Output Q0.0 lit and its load started', 'Output Q0.0 went off and its load stopped'], q1:['Output Q0.1 lit and the lamp lit', 'Output Q0.1 went off and the lamp went off'], pb:['The button was pressed', 'The button was released']};
  const pvAd = {host, watchEl:board, title:'What the correct wiring does', goLabel:'See how it should work', goSub:'Watch the board wired correctly and working before you wire it yourself.',
    mount(box){ taskBox.after(box); }, key:() => 'w/' + L + '/' + ex.key, ex:() => ex, has:() => !!ex,
    begin(){ demoSt = {passed, act:Object.assign({}, act), hidden:actBox.hidden, html:actBox.innerHTML, pend}; pend = null; demoLive = ex.live({}); draw(); },
    end(){ if (!demoSt) return; const d = demoSt; demoSt = null; demoLive = null; actBox.hidden = d.hidden; actBox.innerHTML = d.html; act = d.act; passed = d.passed; pend = d.pend; draw(); },
    outro:() => '<b>That\'s what should happen.</b> Now it\'s your turn: wire it yourself (tap one terminal, then another), and press "Test wiring".',
    async script(pl, gen){
      const tx = PL.preview.tx, hold = ms => pl.hold(gen, ms), da = {};
      pl.say('<b>Watch:</b> this is what happens when the wiring is right. The wires are hidden because the wiring is your job.', 'intro'); pl.hl(board, 2400); await hold(2800);
      actBox.hidden = false; actBox.innerHTML = ex.acts.map(a => `<button type="button" class="btn" data-a="${a.k}" aria-pressed="false" tabindex="-1">${a.l}</button>`).join('');
      const effOf = (was, now) => Object.keys(EFF).filter(k => !!now[k] !== !!was[k]).map(k => tx(EFF[k][now[k] ? 0 : 1]));
      for (let j = 0; j < ex.acts.length; j++){
        pl.progress(j / ex.acts.length);
        const a = ex.acts[j], b = actBox.querySelector(`[data-a="${a.k}"]`);
        for (const on of [true, false]){
          pl.say(on ? tx(a.l) : 'And back to how it was', 'act'); await pl.point(gen, b);
          const was = ex.live(da); da[a.k] = on; b.setAttribute('aria-pressed', on); demoLive = ex.live(da); draw(); pl.hl(board, 900);
          const eff = effOf(was, demoLive);
          pl.say((on ? tx(a.l) : 'Back to normal') + (eff.length ? ' <span class="pv-arr">→</span> ' + eff.join(' and ') : ''), 'fx'); await hold(on ? 2300 : 1400);
        }
      }
      pl.progress(1); pl.say(pvAd.outro(), 'end');
    }};
  PL.preview.attach(pvAd);
  select(0);
  const api = {preview:pvAd, connect(a, b){ tapTerm(a); tapTerm(b); }, check, select, solve(){ wires = []; ex.groups.forEach(g => { for (let i = 1; i < g.length; i++) wires.push([g[i - 1], g[i]]); }); draw(); return check(); }, get wires(){ return wires; }, get ex(){ return ex; }};
  (PL._wires = PL._wires || []).push(api);
  return api;
};
/* drawings used by the wiring exercises (realistic devices from /assets/real-art.js) */
PL.wireArt = {
  psu: (x, y) => RA.psu(x, y, 110, 58),
  cpu: (x, y, live) => RA.cpu(x, y, 130, 58, live),
  card: (x, y, w, h, title, leds, live) => RA.card(x, y, w, h, title, leds, live),
  sensor: (x, y, kind, live) => RA.prox(x, y, kind, live),
  pb: (x, y, live, lbl) => RA.pb(x, y, live, lbl),
  coil: (x, y, lbl, on) => RA.contactor(x, y, lbl, on),
  lamp: (x, y, on) => RA.lamp(x + 20, y + 18, 13, LCOL.green, on),
  ac: (x, y) => RA.mcb(x, y, 92, 58, 'After the MCB')
};

/* ---------- lesson 8: analog chain + scaling ---------- */
PL.scaleDemo = function(host, opt){
  const S = {mA:12, lo:0, hi:4, unit:'m'};
  host.innerHTML = `<div class="wd-art sc-art"></div><div class="wd-ctl"><label>Transmitter current <b class="sc-mA"></b><input type="range" min="0" max="22" step="0.1" value="12" class="sc-r" aria-label="Current mA"></label>
    <label class="sc-rng">Range from <input type="number" class="inp mono sc-lo" value="0" step="any" aria-label="Minimum"> to <input type="number" class="inp mono sc-hi" value="4" step="any" aria-label="Maximum"> <select class="inp sc-u" aria-label="Unit"><option>m</option><option>bar</option><option>°C</option><option>%</option></select></label></div>
    <div class="read"><div><span>Raw (IW64)</span><b class="sc-raw"></b></div><div><span>Real value</span><b class="sc-val"></b></div><div><span>Percent</span><b class="sc-pct"></b></div></div><p class="msg sc-msg" aria-live="polite"></p>`;
  const art = $('.sc-art', host);
  function raw(mA){ if (mA < 1.185) return 32767; return Math.max(-4864, Math.min(32511, ENG.mA2raw(mA))); }
  function upd(){
    const r = raw(S.mA), brk = r === 32767, v = ENG.raw2eng(r, S.lo, S.hi), pct = r / ENG.RAWMAX * 100;
    $('.sc-mA', host).textContent = fmt(S.mA, 1) + ' mA';
    $('.sc-raw', host).textContent = r;
    $('.sc-val', host).textContent = brk ? '⚠ ---' : fmt(v, 2) + ' ' + S.unit;
    $('.sc-pct', host).textContent = brk ? '---' : fmt(pct, 1) + ' %';
    const m = $('.sc-msg', host);
    m.className = 'msg' + (brk || S.mA < 3.8 || S.mA > 20.5 ? ' bad' : '');
    m.innerHTML = brk ? 'The current is almost zero: this is a <b>broken wire</b>, not an empty tank. Many cards give a special error value (on Siemens, for example, 32767) or light a diagnostic LED. The program must treat it as a fault.' : S.mA < 3.8 ? 'Below 4 mA: the card reads a negative value (underrange). Usually the transmitter is signalling a fault or its calibration has drifted.' : S.mA > 20.5 ? 'Above 20 mA: overrange. The value is above the URV or the transmitter is in fail-high mode.' : `Formula: value = ${S.lo} + (${r} ÷ 27648) × (${S.hi} − ${S.lo}) = <b>${fmt(v, 2)} ${S.unit}</b>`;
    const lvl = clamp((S.mA - 4) / 16, 0, 1);
    art.innerHTML = `<svg viewBox="0 0 360 120" role="img" aria-label="Analog signal chain"><g transform="translate(6 18)"><rect width="64" height="80" rx="5" fill="#d9e3ea" stroke="#6b757c"/><rect x="2" y="${(78 - 76 * lvl).toFixed(1)}" width="60" height="${(76 * lvl).toFixed(1)}" fill="#3a8fd8" opacity=".85"/><text x="32" y="98" text-anchor="middle" class="ar sd-s">Tank</text></g>
      <path d="M72 58H96" class="sd-w hot"/><g transform="translate(96 34)"><rect width="56" height="48" rx="6" fill="#2a3035"/><rect x="6" y="8" width="44" height="16" rx="2" fill="#c7d3b4"/><text x="28" y="20" text-anchor="middle" style="font:600 9px var(--font-mono);fill:#1b2410">${fmt(S.mA, 1)}mA</text><text x="28" y="40" text-anchor="middle" style="font:700 8px var(--font-mono);fill:#cfd6db">LT</text></g>
      <path d="M152 58H178" class="sd-w${S.mA > 1 ? ' hot' : ''}"/><g transform="translate(178 30)"><rect width="74" height="56" rx="6" fill="#2f6fb3"/><text x="37" y="18" text-anchor="middle" style="font:700 9px var(--font-mono);fill:#fff">AI · ADC</text><text x="37" y="38" text-anchor="middle" style="font:700 12px var(--font-mono);fill:#fff">${r}</text></g>
      <path d="M252 58H272" class="sd-w hot"/><g transform="translate(272 30)"><rect width="82" height="56" rx="6" fill="#2a3035"/><text x="41" y="18" text-anchor="middle" style="font:700 9px var(--font-mono);fill:#cfd6db">SCALE</text><text x="41" y="38" text-anchor="middle" style="font:700 11px var(--font-mono);fill:#2fd35a">${brk ? '---' : fmt(v, 2)}</text><text x="41" y="50" text-anchor="middle" style="font:600 8px var(--font-mono);fill:#cfd6db">${esc(S.unit)}</text></g>
      <text x="215" y="104" text-anchor="middle" class="sd-s">4 mA → 0 · 20 mA → 27648</text></svg>`;
  }
  $('.sc-r', host).addEventListener('input', ev => { S.mA = +ev.target.value; upd(); });
  $('.sc-lo', host).addEventListener('input', ev => { const v = num(ev.target.value); if (isFinite(v)){ S.lo = v; upd(); } });
  $('.sc-hi', host).addEventListener('input', ev => { const v = num(ev.target.value); if (isFinite(v)){ S.hi = v; upd(); } });
  $('.sc-u', host).addEventListener('change', ev => { S.unit = ev.target.value; upd(); });
  upd();
  return {S, upd, raw};
};
/* generator for the scaling drill */
PL.scaleGen = function(){
  const R = pick([[0, 10, 'bar'], [0, 4, 'm'], [0, 100, '°C'], [0, 250, 'm³/h'], [0, 16, 'bar'], [-50, 150, '°C']]);
  const lo = R[0], hi = R[1], u = R[2], kind = pick(['raw2v', 'raw2v', 'mA2raw', 'v2raw']);
  const pct = pick([10, 20, 25, 30, 40, 50, 60, 75, 80, 90]);
  const raw = Math.round(pct / 100 * ENG.RAWMAX), v = lo + pct / 100 * (hi - lo), mA = 4 + pct / 100 * 16;
  const rng = iso(`${lo}–${hi} ${u}`);
  if (kind === 'raw2v') return {q:`A transmitter with range ${rng}, and the card read <b class="mono">IW64 = ${raw}</b>. What is the real value in <span class="mono">${esc(u)}</span>?`, input:true, unit:u, check:x => Math.abs(x - v) <= Math.abs(hi - lo) * 0.01, ans:fmt(v, 2), why:`${raw} ÷ 27648 = ${pct}% of the range.`};
  if (kind === 'mA2raw') return {q:`The transmitter gives <b class="mono">${fmt(mA, 1)} mA</b>. About what will the card read (Siemens-style 0–27648)?`, input:true, unit:'raw', check:x => Math.abs(x - raw) <= 300, ans:raw, why:`(${fmt(mA, 1)} − 4) ÷ 16 = ${pct}% ⇐ ${pct}% × 27648.`};
  return {q:`Range ${rng}. You want the PLC to raise an alarm at <b class="mono">${fmt(v, 1)} ${esc(u)}</b>. What is the matching raw value?`, input:true, unit:'raw', check:x => Math.abs(x - raw) <= 300, ans:raw, why:`${fmt(v, 1)} = ${pct}% of the range ⇐ ${pct}% × 27648.`};
};

/* ---------- lesson 5: live timing diagram for TON / TOF / TP ---------- */
PL.timerDemo = function(host){
  const PT = 2, WIN = 10;
  let type = 'TON', e, hist = [], t = 0, inV = 0;
  host.innerHTML = `<div class="tabs" role="group" aria-label="Timer type">${['TON', 'TOF', 'TP'].map(k => `<button type="button" class="btn" data-k="${k}" aria-pressed="${k === 'TON'}">${k}</button>`).join('')}</div>
    <div class="wd-art td-art"></div><div class="ls-io"><button type="button" class="ib ib-pb td-in" style="--cap:${LCOL.green}" aria-pressed="false" aria-label="Timer input IN (press and release)"><span class="cap" aria-hidden="true"></span><span class="l">IN</span><span class="a">I0.0</span></button><button type="button" class="ib ib-sw td-sw" aria-pressed="false" aria-label="IN switch"><span class="cap" aria-hidden="true"></span><span class="l">Switch</span><span class="a">I0.0</span></button></div><p class="msg td-msg" aria-live="polite"></p>`;
  const art = $('.td-art', host), msg = $('.td-msg', host), btn = $('.td-in', host), sw = $('.td-sw', host);
  let held = false, swOn = false;
  const desc = {TON:'<b>TON (on-delay):</b> output Q turns on after IN has stayed 1 for PT without a break. If IN drops before that, the timer goes back to zero.', TOF:'<b>TOF (off-delay):</b> Q turns on with IN straight away, and when IN drops Q stays on for PT and then turns off.', TP:'<b>TP (pulse):</b> as soon as IN becomes 1, Q gives a pulse exactly PT long, however long or short IN is.'};
  function reset(){ e = new ENG.Engine([{rows:[['NO:I0.0', '-', '-', '-', type + ':T0:' + PT]]}, {rows:[['NO:T0', '-', '-', '-', 'OUT:Q0.0']]}], {cols:5}); hist = []; t = 0; msg.innerHTML = desc[type] + ` (here PT = ${PT} s)`; }
  function draw(){
    const W = 340, X0 = 40, sx = (W - X0 - 6) / WIN, rows = [['IN', 'in', '#2f6fb3'], ['Q', 'q', '#2b7a3d']];
    let s = `<svg viewBox="0 0 ${W} 150" role="img" aria-label="Timing chart ${type}">`;
    for (let k = 0; k <= WIN; k += 2){ const x = X0 + k * sx; s += `<path d="M${x} 8V118" stroke="var(--line)"/><text x="${x}" y="132" text-anchor="middle" class="sd-s">${k - WIN}s</text>`; }
    rows.forEach(([lab, key, col], r) => {
      const y0 = 50 + r * 52, y1 = y0 - 30; let d = '';
      hist.forEach((h, i) => { const x = X0 + (h.t - (t - WIN)) * sx, y = h[key] ? y1 : y0; d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y; if (i < hist.length - 1){ const nx = X0 + (hist[i + 1].t - (t - WIN)) * sx; d += 'L' + nx.toFixed(1) + ' ' + y; } });
      s += `<text x="4" y="${y0 - 10}" class="sd-t">${lab}</text><path d="M${X0} ${y0}H${W - 6}" stroke="var(--line)" stroke-dasharray="3 3"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2.5"/>`;
    });
    const tm = e.T.T0 || {et:0};
    s += `<text x="${W - 6}" y="146" text-anchor="end" class="sd-s">ET = ${fmt(tm.et, 1)} / PT = ${PT}s</text></svg>`;
    art.innerHTML = s;
  }
  $$('[data-k]', host).forEach(b => b.addEventListener('click', () => { type = b.dataset.k; $$('[data-k]', host).forEach(x => x.setAttribute('aria-pressed', x === b)); reset(); }));
  const setIn = () => { inV = held || swOn ? 1 : 0; e.setIn('I0.0', inV); btn.classList.toggle('on', held); btn.setAttribute('aria-pressed', held); sw.classList.toggle('on', swOn); sw.setAttribute('aria-pressed', swOn); };
  btn.addEventListener('pointerdown', ev => { ev.preventDefault(); try { btn.setPointerCapture(ev.pointerId); } catch (er){} held = true; setIn(); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => btn.addEventListener(n, () => { if (held){ held = false; setIn(); } }));
  btn.addEventListener('keydown', ev => { if (ev.key === ' ' && !ev.repeat){ ev.preventDefault(); held = true; setIn(); } });
  btn.addEventListener('keyup', ev => { if (ev.key === ' '){ held = false; setIn(); } });
  btn.addEventListener('contextmenu', ev => ev.preventDefault());
  sw.addEventListener('click', () => { swOn = !swOn; setIn(); });
  reset();
  let acc = 0;
  animate(host, dt => { acc += dt; while (acc >= 0.02){ acc -= 0.02; e.scan(0.02); t += 0.02; hist.push({t, in:inV, q:e.get('Q0.0')}); } while (hist.length && hist[0].t < t - WIN - 0.1) hist.shift(); draw(); });
  draw();
  return {get e(){ return e; }};
};

/* ---------- lesson 2: the four wiring exercises ---------- */
(function(){
  const A = PL.wireArt;
  const base = () => [
    {id:'P24', l:'+24V', x:36, y:54, pol:'p24'}, {id:'P0', l:'0V', x:90, y:54, pol:'p0'},
    {id:'CL', l:'L+', x:252, y:54, pol:'p24'}, {id:'CM', l:'M', x:306, y:54, pol:'p0'}
  ];
  const right = (id, l, y, pol) => ({id, l, x:246, y, pol, lx:14, ly:4, anc:'start'});
  const below = (id, l, x, y, pol) => ({id, l, x, y, pol, ly:24});
  const top = live => RA.rail(0, 27, 360) + A.psu(8, 6) + A.cpu(222, 6, {pwr:true});
  const DC = ['P24', 'P0', 'CL', 'CM'];
  const msgShort = '⚡ <b>Short:</b> +24V and 0V are connected together.';
  const msgMix = '⚡ <b>Danger:</b> 230V AC is connected to the 24V DC circuit.';
  const msgLN = '⚡ <b>Short:</b> L and N are connected together.';
  function mkDanger(ex){ return (a, b, f) => {
    const nets = {}; ex.terms.forEach(t => { const r = f(t.id); (nets[r] = nets[r] || []).push(t.id); });
    const DCT = ['P24', 'P0', 'CL', 'CM', 'IM', 'OL', 'OM', 'BN', 'BU'];
    for (const k in nets){ const n = nets[k], has = id => n.indexOf(id) >= 0;
      if (has('ACL') && has('ACN')) return msgLN;
      if ((has('ACL') || has('ACN')) && n.some(id => DCT.indexOf(id) >= 0)) return msgMix;
      if (has('P24') && has('P0')) return msgShort;
    }
    return null;
  }; }
  const sensorArt = (kind, live) => A.sensor(14, 96, kind, live) + RA.wire('M126 142C126 150 102 146 102 158', '#1a1c1e', 3.2) + RA.wire('M124 142C120 150 66 144 66 158', '#1f5fc0', 3.2) + RA.wire('M122 142C116 150 30 142 30 158', '#7a4a1e', 3.2) + RA.wire('M126 130V143', '#4a4f53', 6.5) + RA.terms(12, 150, 3, 36, ['#8e9398', '#4d7fc4', '#8e9398']);
  const leadT = [below('BN', 'BN', 30, 168, 'p24'), below('BU', 'BU', 66, 168, 'p0'), below('BK', 'BK', 102, 168, 'sig')];
  const pbArt = live => A.pb(20, 206, live, 'Start button NO');
  const pbT = [below('PB13', '13', 34, 268, 'sig'), below('PB14', '14', 78, 268, 'sig')];
  const inCard = (title, live) => A.card(230, 96, 122, 196, title, [{y:180, k:'i0'}, {y:230, k:'i1'}], live) + `<text x="324" y="170" text-anchor="middle" style="font:600 7px var(--font-mono);fill:#2a3035">I0.0</text><text x="324" y="220" text-anchor="middle" style="font:600 7px var(--font-mono);fill:#2a3035">I0.1</text>`;
  const ex = [];
  /* PNP sensor + sinking input card (1M on 0V) */
  ex.push({key:'pnp', title:'PNP input', h:300,
    task:'<p class="tk-g"><b>Goal:</b> wire a PNP sensor and a button to the input card.</p><b>Make these wires (tap one terminal, then the other):</b><ol class="tk-s"><li>CPU power: +24V to L+, and 0V to M.</li><li>Sensor power: brown BN to +24V, blue BU to 0V.</li><li>Sensor signal: black BK to <b>I0.0</b>.</li><li>Button: terminal 13 to +24V, terminal 14 to <b>I0.1</b>.</li><li>Card common: 1M to 0V.</li></ol><p class="tk-n">Then try it: bring metal near the sensor → <b>I0.0</b> lamp lights. Press Start → <b>I0.1</b> lamp lights.</p>',
    terms:base().concat(leadT, pbT, [right('IM', '1M', 130, 'sig'), right('I0', 'I0.0', 180, 'sig'), right('I1', 'I0.1', 230, 'sig')]),
    groups:[['P24', 'CL', 'BN', 'PB13'], ['P0', 'CM', 'BU', 'IM'], ['BK', 'I0'], ['PB14', 'I1']],
    why:{IM:'With PNP, 1M goes to 0V.', BK:'BK goes to the card input.', PB13:'One button terminal to +24V, the other to the input.', CL:'L+ to +24V.', CM:'M to 0V.'},
    art:live => top(live) + sensorArt('PNP', live) + pbArt(live.i1) + inCard('DI 24V DC', live),
    live:a => ({target:a.target, i0:a.target, i1:a.pb}),
    acts:[{k:'target', l:'Bring metal near the sensor'}, {k:'pb', l:'Press the Start button'}],
    ok:'BK gives +24V, and the current returns through 1M to 0V.'});
  /* NPN sensor + sourcing card (1M on +24V) */
  ex.push({key:'npn', title:'NPN input', h:300,
    task:'<p class="tk-g"><b>Goal:</b> the same wiring with an NPN sensor. NPN pulls the signal to 0V, so the common flips.</p><b>Make these wires:</b><ol class="tk-s"><li>CPU power: +24V to L+, and 0V to M.</li><li>Sensor power: brown BN to +24V, blue BU to 0V.</li><li>Sensor signal: black BK to <b>I0.0</b>.</li><li>Card common: 1M to +24V (not 0V).</li><li>Button: terminal 13 to 0V, terminal 14 to <b>I0.1</b>.</li></ol><p class="tk-n">Then try it: bring metal near the sensor, press Start, and watch the input lamps.</p>',
    terms:base().concat(leadT, pbT, [right('IM', '1M', 130, 'sig'), right('I0', 'I0.0', 180, 'sig'), right('I1', 'I0.1', 230, 'sig')]),
    groups:[['P24', 'CL', 'BN', 'IM'], ['P0', 'CM', 'BU', 'PB13'], ['BK', 'I0'], ['PB14', 'I1']],
    why:{IM:'With NPN, 1M goes to +24V.', PB13:'The button pulls the input to 0V.', BK:'BK goes to the card input.', CL:'L+ to +24V.', CM:'M to 0V.'},
    art:live => top(live) + sensorArt('NPN', live) + pbArt(live.i1) + inCard('DI 24V DC', live),
    live:a => ({target:a.target, i0:a.target, i1:a.pb}),
    acts:[{k:'target', l:'Bring metal near the sensor'}, {k:'pb', l:'Press the Start button'}],
    ok:'Current flows +24V → 1M, out of I0.0 to BK.'});
  /* transistor (sourcing) output: 24 V DC loads */
  ex.push({key:'tr', title:'Transistor output', h:300,
    task:'<p class="tk-g"><b>Goal:</b> wire a 24V contactor and a 24V lamp to a transistor output.</p><b>Make these wires:</b><ol class="tk-s"><li>CPU power: +24V to L+, and 0V to M.</li><li>Output card power: 3L+ to +24V, 3M to 0V.</li><li>Contactor: A1 to <b>Q0.0</b>, A2 to 0V.</li><li>Lamp: X1 to <b>Q0.1</b>, X2 to 0V.</li></ol><p class="tk-n">Then try it: let the program switch <b>Q0.0</b> → the contactor pulls in, and <b>Q0.1</b> → the lamp lights.</p>',
    terms:base().concat([below('KA1', 'A1', 30, 166, 'sig'), below('KA2', 'A2', 82, 166, 'p0'), below('HX1', 'X1', 30, 270, 'sig'), below('HX2', 'X2', 82, 270, 'p0'),
      right('OL', '3L+', 130, 'p24'), right('Q0', 'Q0.0', 175, 'sig'), right('Q1', 'Q0.1', 220, 'sig'), right('OM', '3M', 265, 'p0')]),
    groups:[['P24', 'CL', 'OL'], ['P0', 'CM', 'OM', 'KA2', 'HX2'], ['Q0', 'KA1'], ['Q1', 'HX1']],
    why:{OL:'3L+ to +24V.', OM:'3M to 0V.', KA2:'A2 back to 0V.', HX2:'X2 back to 0V.', CL:'L+ to +24V.', CM:'M to 0V.'},
    art:live => top(live) + A.coil(14, 110, 'Contactor 24V DC', live.q0) + `<path d="M30 150v8M82 150v8" stroke="#2a3035" stroke-width="2"/>` + A.lamp(36, 216, live.q1) + `<text x="98" y="238" class="ar" style="font-size:10px;fill:var(--ink)">Lamp 24V</text>` + A.card(230, 96, 122, 196, 'DQ 24V DC (Tr)', [{y:175, k:'q0', c:'#ffb300'}, {y:220, k:'q1', c:'#ffb300'}], live),
    live:a => ({q0:a.q0, q1:a.q1}),
    acts:[{k:'q0', l:'The program turns on Q0.0'}, {k:'q1', l:'The program turns on Q0.1'}],
    ok:'Transistor: fast, but <b>DC only</b> and about 0.5A.'});
  /* relay output: 230 V AC contactor */
  ex.push({key:'rly', title:'Relay output', h:300,
    task:'<p class="tk-g"><b>Goal:</b> wire a 230V AC contactor to a relay output.</p><b>Make these wires:</b><ol class="tk-s"><li>CPU power: +24V to L+, and 0V to M.</li><li>Relay common: 1L to phase L (230V).</li><li>Contactor: A1 to <b>Q0.0</b>, A2 to neutral N.</li></ol><p class="tk-n">Careful: never put 230V on a 24V terminal. Then try it: let the program switch <b>Q0.0</b> → the motor runs.</p>',
    terms:base().concat([{id:'ACL', l:'L', x:150, y:54, pol:'ac'}, {id:'ACN', l:'N', x:196, y:54, pol:'n'},
      below('KA1', 'A1', 30, 166, 'sig'), below('KA2', 'A2', 82, 166, 'coil'), right('RL', '1L', 130, 'sig'), right('Q0', 'Q0.0', 180, 'sig'), right('Q1', 'Q0.1', 230, 'sig')]),
    groups:[['P24', 'CL'], ['P0', 'CM'], ['ACL', 'RL'], ['Q0', 'KA1'], ['ACN', 'KA2']],
    why:{RL:'1L takes the phase L.', KA1:'Q0.0 goes to A1.', KA2:'A2 to N.', CL:'L+ to +24V.', CM:'M to 0V.'},
    art:live => A.psu(8, 6) + RA.mcb(124, 6, 94, 64, 'After the MCB') + A.cpu(222, 6, {pwr:true}) + A.coil(14, 110, 'Contactor 230V AC', live.q0) + `<path d="M30 150v8M82 150v8" stroke="#2a3035" stroke-width="2"/>` + (live.q0 ? `<g transform="translate(20 200)">${PL.motorSvg(36, 40, 54, 30, true)}<text x="90" y="44" class="ar" style="font-size:10px;fill:var(--ink)">Motor running</text></g>` : '') + A.card(230, 96, 122, 196, 'DQ Relay', [{y:180, k:'q0', c:'#ffb300'}, {y:230, k:'q1', c:'#ffb300'}], live),
    live:a => ({q0:a.q0}),
    acts:[{k:'q0', l:'The program turns on Q0.0'}],
    ok:'Relay: AC or DC up to 2A, but slower.'});
  ex.forEach(x => { x.danger = mkDanger(x); x.terms.forEach(t => { if (!t.pol) t.pol = 'sig'; }); });
  PL.wireEx = ex;
})();

/* ================= brand faceplates (drawings of real CPUs, used by the brand simulators and the hub cards) =================
   st: {run, err, frc, ins:{I0.0:1}, outs:{Q0.0:1}, key:'RUN'|'REM'|'PROG', ana} — addresses are engine addresses. */
const FACE = PL.face = {};
const fled = (x, y, on, col, w, h) => `<rect x="${x}" y="${y}" width="${w || 6}" height="${h || 4}" rx="1" fill="${on ? col : '#1a1f22'}"${on ? ` style="filter:drop-shadow(0 0 2.5px ${col})"` : ''}/>`;
const ftx = (x, y, s, sz, col, anchor, wt) => `<text x="${x}" y="${y}" font-family="IBM Plex Mono,ui-monospace,monospace" font-size="${sz || 5.5}" fill="${col || '#cfd6db'}"${anchor ? ` text-anchor="${anchor}"` : ''}${wt ? ` font-weight="${wt}"` : ''}>${s}</text>`;
const screws = (x, y, n, gap) => { let s = ''; for (let i = 0; i < n; i++) s += `<circle cx="${x + i * gap}" cy="${y}" r="2.6" fill="#8a949b" stroke="#55606a" stroke-width=".8"/><path d="M${x + i * gap - 1.6} ${y}h3.2" stroke="#3a4248" stroke-width=".9"/>`; return s; };
const rail = (y) => `<rect x="0" y="${y}" width="320" height="14" fill="#a9b1b6"/><rect x="0" y="${y + 3}" width="320" height="8" fill="#c3cacd"/>${Array.from({length:16}, (_, i) => `<rect x="${8 + i * 20}" y="${y + 5}" width="10" height="4" rx="2" fill="#8d969b"/>`).join('')}`;
const bit = (o, a) => !!(o && o[a]);

/* Siemens S7-1200 CPU 1214C DC/DC/DC: 14 DI (I0.0–I1.5), 10 DQ (Q0.0–Q1.1) */
FACE.sie = function(st){
  st = st || {};
  const ins = st.ins || {}, outs = st.outs || {};
  let s = `<svg viewBox="0 0 320 170" role="img" aria-label="CPU 1214C DC/DC/DC">${rail(78)}`;
  s += `<rect x="22" y="10" width="276" height="150" rx="5" fill="#3b4146" stroke="#22272b"/>`;
  s += `<rect x="22" y="10" width="276" height="26" rx="5" fill="#2a2f33"/>${screws(108, 23, 15, 12)}<rect x="30" y="16" width="64" height="14" rx="2" fill="#4a5157"/>${ftx(62, 26, '24V DC  1M', 5.5, '#aab3b9', 'middle')}`;
  s += `<rect x="22" y="134" width="276" height="26" rx="5" fill="#2a2f33"/>${screws(108, 147, 15, 12)}`;
  s += `<rect x="30" y="40" width="260" height="90" rx="3" fill="#4b5359"/><rect x="30" y="40" width="260" height="90" rx="3" fill="url(#sieg)" opacity=".5"/>`;
  s += `<defs><linearGradient id="sieg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c767d"/><stop offset="1" stop-color="#3b4146"/></linearGradient></defs>`;
  /* status LEDs */
  const runC = st.run ? '#36e06a' : '#ffc21a';
  s += `<g>${fled(38, 50, true, runC, 9, 5)}${ftx(50, 54.5, 'RUN/STOP')}${fled(38, 62, !!st.err, '#ff3b30', 9, 5)}${ftx(50, 66.5, 'ERROR')}${fled(38, 74, !!st.frc, '#ffc21a', 9, 5)}${ftx(50, 78.5, 'MAINT')}</g>`;
  /* PROFINET port */
  s += `<rect x="38" y="92" width="22" height="18" rx="2" fill="#1d2124" stroke="#6c767d"/><rect x="42" y="96" width="14" height="9" fill="#0f1214"/>${fled(39, 112, !!st.run, '#36e06a', 4, 2)}${fled(55, 112, !!st.run, '#ffc21a', 4, 2)}${ftx(64, 104, 'X1 P1', 5, '#aab3b9')}`;
  /* model */
  s += ftx(196, 74, 'S7-1200', 12, '#e8edf0', 'middle', 700) + ftx(196, 86, 'CPU 1214C', 7.5, '#cfd6db', 'middle', 600) + ftx(196, 96, 'DC/DC/DC', 6.5, '#aab3b9', 'middle');
  s += `<rect x="248" y="64" width="34" height="34" rx="3" fill="#00646e" opacity=".9"/>${ftx(265, 79, 'MC', 6.5, '#e6f4f4', 'middle', 700)}${ftx(265, 89, 'card', 5, '#bfe2e2', 'middle')}`;
  /* I/O LEDs */
  const row = (y, pfx, lab1, n1, lab2, n2, src) => {
    let r = ftx(84, y + 4, lab1, 5.5, '#e8edf0', null, 700);
    for (let i = 0; i < n1; i++) r += fled(102 + i * 10, y, bit(src, `${pfx}0.${i}`), '#36e06a', 7, 4) + ftx(105.5 + i * 10, y + 11, '.' + i, 4.5, '#aab3b9', 'middle');
    r += ftx(186, y + 4, lab2, 5.5, '#e8edf0', null, 700);
    for (let i = 0; i < n2; i++) r += fled(204 + i * 10, y, bit(src, `${pfx}1.${i}`), '#36e06a', 7, 4) + ftx(207.5 + i * 10, y + 11, '.' + i, 4.5, '#aab3b9', 'middle');
    return r;
  };
  s += row(46, 'I', 'DIa', 8, 'DIb', 6, ins) + row(110, 'Q', 'DQa', 8, 'DQb', 2, outs);
  return s + '</svg>';
};

/* Delta DVP-14SS2: 8 DI (X0–X7), 6 DO (Y0–Y5), slim module next to a 24 V supply */
FACE.dvp = function(st){
  st = st || {};
  const ins = st.ins || {}, outs = st.outs || {};
  let s = `<svg viewBox="0 0 320 170" role="img" aria-label="DVP-14SS2">${rail(78)}`;
  /* 24 V power supply */
  s += `<rect x="58" y="22" width="62" height="126" rx="4" fill="#cfd4d8" stroke="#8a949b"/><rect x="58" y="22" width="62" height="20" rx="4" fill="#3a4046"/>${screws(70, 32, 4, 13)}<rect x="58" y="128" width="62" height="20" rx="4" fill="#3a4046"/>${screws(70, 138, 4, 13)}`;
  s += ftx(89, 66, '24V DC', 8, '#2a3035', 'middle', 700) + ftx(89, 78, 'POWER', 5.5, '#56636b', 'middle') + ftx(89, 86, 'SUPPLY', 5.5, '#56636b', 'middle') + fled(84, 98, true, '#36e06a', 10, 5) + ftx(89, 112, 'DC OK', 5, '#56636b', 'middle');
  /* PLC body (slim) */
  const X = 140, W = 96;
  s += `<rect x="${X}" y="8" width="${W}" height="154" rx="4" fill="#e3e6e8" stroke="#8a949b"/>`;
  s += `<rect x="${X}" y="8" width="${W}" height="22" rx="4" fill="#33393e"/>${screws(X + 12, 19, 7, 12)}<rect x="${X}" y="140" width="${W}" height="22" rx="4" fill="#33393e"/>${screws(X + 12, 151, 7, 12)}`;
  s += `<rect x="${X + 6}" y="34" width="${W - 12}" height="13" rx="2" fill="#0a5aa8"/>${ftx(X + W / 2, 43.5, 'DVP-14SS2', 7, '#ffffff', 'middle', 700)}`;
  s += fled(X + 10, 53, true, '#36e06a', 7, 4) + ftx(X + 20, 57, 'POWER', 5, '#2a3035') + fled(X + 10, 61, !!st.run, '#36e06a', 7, 4) + ftx(X + 20, 65, 'RUN', 5, '#2a3035') + fled(X + 10, 69, !!st.err, '#ff3b30', 7, 4) + ftx(X + 20, 73, 'ERROR', 5, '#2a3035');
  /* RUN / STOP switch */
  s += `<rect x="${X + 56}" y="52" width="30" height="22" rx="3" fill="#c3c9cd" stroke="#8a949b"/><rect x="${X + 66}" y="${st.run ? 54 : 63}" width="10" height="9" rx="2" fill="#3a4046"/>${ftx(X + 71, 51, 'RUN', 4.8, '#2a3035', 'middle', 700)}${ftx(X + 71, 80, 'STOP', 4.8, '#2a3035', 'middle', 700)}`;
  /* COM1 */
  s += `<circle cx="${X + 74}" cy="96" r="8" fill="#2a3035"/><circle cx="${X + 74}" cy="96" r="5" fill="#1a1f22"/>${ftx(X + 74, 110, 'COM1', 4.8, '#2a3035', 'middle')}`;
  /* I/O LEDs */
  s += ftx(X + 14, 88, 'X', 6, '#0a5aa8', 'middle', 700) + ftx(X + 40, 88, 'Y', 6, '#0a5aa8', 'middle', 700);
  for (let i = 0; i < 8; i++) s += fled(X + 8, 92 + i * 6, bit(ins, 'I0.' + i), '#36e06a', 6, 3.6) + ftx(X + 22, 95.6 + i * 6, String(i), 4.6, '#2a3035', 'middle');
  for (let i = 0; i < 6; i++) s += fled(X + 34, 92 + i * 6, bit(outs, 'Q0.' + i), '#ff3b30', 6, 3.6) + ftx(X + 48, 95.6 + i * 6, String(i), 4.6, '#2a3035', 'middle');
  return s + '</svg>';
};

/* Allen-Bradley CompactLogix 1769-L33ER + 1769-IQ16 + 1769-OB16 (+ 1769-IF4 when ana) */
FACE.ab = function(st){
  st = st || {};
  const ins = st.ins || {}, outs = st.outs || {}, key = st.key || 'REM';
  let s = `<svg viewBox="0 0 320 170" role="img" aria-label="1769-L33ER">${rail(78)}`;
  const X0 = st.ana ? 8 : 26;
  /* controller */
  s += `<rect x="${X0}" y="12" width="122" height="146" rx="4" fill="#3d4247" stroke="#1d2124"/><rect x="${X0}" y="12" width="122" height="16" rx="4" fill="#2c3034"/>`;
  s += ftx(X0 + 8, 24, '1769-L33ER', 6.5, '#e8edf0', null, 700);
  const L = [['RUN', st.run ? '#36e06a' : null], ['FORCE', st.frc ? '#ffb300' : null], ['SD', null], ['OK', '#36e06a']];
  L.forEach(([n, c], i) => { s += fled(X0 + 10, 38 + i * 11, !!c, c || '#000', 9, 5) + ftx(X0 + 22, 42.5 + i * 11, n, 5.5); });
  s += fled(X0 + 10, 86, true, '#36e06a', 9, 5) + ftx(X0 + 22, 90.5, 'NS', 5.5) + fled(X0 + 10, 97, !!st.online, '#36e06a', 9, 5) + ftx(X0 + 22, 101.5, 'LINK 1', 5.5);
  /* keyswitch */
  const kx = X0 + 84, ky = 56, ang = key === 'RUN' ? -45 : key === 'PROG' ? 45 : 0;
  s += `<circle cx="${kx}" cy="${ky}" r="15" fill="#2a2e31" stroke="#6c767d" stroke-width="1.5"/><circle cx="${kx}" cy="${ky}" r="11" fill="#8a949b"/><rect x="${kx - 2.5}" y="${ky - 10}" width="5" height="20" rx="2" fill="#2a2e31" transform="rotate(${ang} ${kx} ${ky})"/>`;
  s += ftx(kx - 20, ky - 17, 'RUN', 5.5, key === 'RUN' ? '#ffffff' : '#9aa3a8', 'middle', 700) + ftx(kx, ky - 20, 'REM', 5.5, key === 'REM' ? '#ffffff' : '#9aa3a8', 'middle', 700) + ftx(kx + 21, ky - 17, 'PROG', 5.5, key === 'PROG' ? '#ffffff' : '#9aa3a8', 'middle', 700);
  s += `<rect x="${X0 + 66}" y="92" width="18" height="15" rx="2" fill="#1d2124" stroke="#6c767d"/><rect x="${X0 + 69}" y="95" width="12" height="8" fill="#0f1214"/><rect x="${X0 + 90}" y="92" width="18" height="15" rx="2" fill="#1d2124" stroke="#6c767d"/><rect x="${X0 + 93}" y="95" width="12" height="8" fill="#0f1214"/>`;
  s += `<rect x="${X0 + 8}" y="116" width="106" height="34" rx="3" fill="#2c3034"/>` + ftx(X0 + 61, 131, 'Logix 5370', 7, '#cfd6db', 'middle', 600) + ftx(X0 + 61, 142, 'Controller', 5.5, '#9aa3a8', 'middle');
  /* I/O modules */
  const mod = (x, name, pfx, src, col) => {
    let m = `<rect x="${x}" y="12" width="44" height="146" rx="3" fill="#3d4247" stroke="#1d2124"/><rect x="${x + 4}" y="18" width="36" height="12" rx="2" fill="#2c3034"/>${ftx(x + 22, 26.5, name, 5.5, '#e8edf0', 'middle', 700)}`;
    m += ftx(x + 22, 38, pfx === 'I' ? 'IN' : 'OUT', 5, '#9aa3a8', 'middle');
    for (let i = 0; i < 16; i++){ const cx = x + 6 + (i >= 8 ? 18 : 0), cy = 44 + (i % 8) * 9; m += fled(cx, cy, src && bit(src, `${pfx}${Math.floor(i / 8)}.${i % 8}`), col, 7, 4.5) + ftx(cx + 12, cy + 4.5, String(i), 4.4, '#9aa3a8', 'middle'); }
    m += `<rect x="${x + 6}" y="122" width="32" height="30" rx="2" fill="#2c3034"/>${screws(x + 13, 130, 3, 9)}${screws(x + 13, 144, 3, 9)}`;
    return m;
  };
  s += mod(X0 + 126, 'IQ16', 'I', ins, '#ffb300') + mod(X0 + 174, 'OB16', 'Q', outs, '#ffb300');
  if (st.ana){ s += `<rect x="${X0 + 222}" y="12" width="44" height="146" rx="3" fill="#3d4247" stroke="#1d2124"/><rect x="${X0 + 226}" y="18" width="36" height="12" rx="2" fill="#2c3034"/>${ftx(X0 + 244, 26.5, 'IF4', 5.5, '#e8edf0', 'middle', 700)}${fled(X0 + 236, 44, true, '#36e06a', 14, 5)}${ftx(X0 + 244, 60, 'OK', 5, '#9aa3a8', 'middle')}${ftx(X0 + 244, 76, 'ANALOG', 4.6, '#9aa3a8', 'middle')}<rect x="${X0 + 228}" y="122" width="32" height="30" rx="2" fill="#2c3034"/>${screws(X0 + 235, 130, 3, 9)}${screws(X0 + 235, 144, 3, 9)}`; }
  const ec = X0 + (st.ana ? 270 : 222);
  s += `<rect x="${ec}" y="16" width="12" height="138" rx="2" fill="#2c3034" stroke="#1d2124"/>`;
  return s + '</svg>';
};

/* hub / lesson 10 cards that link to the three brand simulators (progress read from the synced plcx-lab-v1 store) */
PL.BRANDS = [
  {id:'sie', file:'siemens.html', name:'Siemens S7-1200', sub:'TIA Portal style', tags:['%I0.0', 'TON T#5s', 'NORM_X'], st:{run:true, ins:{'I0.0':1, 'I0.3':1}, outs:{'Q0.0':1, 'Q0.2':1}}},
  {id:'dvp', file:'delta.html', name:'Delta DVP', sub:'ISPSoft and WPLSoft style', tags:['X0 · Y0', 'TMR T0 K50', 'IL'], st:{run:true, ins:{'I0.0':1, 'I0.2':1}, outs:{'Q0.0':1, 'Q0.1':1}}},
  {id:'ab', file:'ab.html', name:'Allen-Bradley', sub:'Studio 5000 style', tags:['XIC · OTE', 'TON .DN', 'Tags'], st:{run:true, key:'RUN', ins:{'I0.0':1, 'I0.1':1}, outs:{'Q0.0':1}}}
];
PL.BRAND_N = 9; /* exercises on each brand page */
PL.brandCards = function(host){
  if (!host) return;
  let done = {}; try { const s = JSON.parse(localStorage.getItem('plcx-lab-v1')); if (s && s.done) done = s.done; } catch (e){}
  const n = id => Object.keys(done).filter(k => k.indexOf(id + '/') === 0).length;
  host.classList.add('bcards');
  host.innerHTML = PL.BRANDS.map(b => { const c = n(b.id); return `<a class="bcard" href="${b.file}"><span class="bf" aria-hidden="true">${FACE[b.id](b.st)}</span><span class="bt"><b dir="ltr">${b.name}</b><span class="bs">${b.sub}</span><span class="btg">${b.tags.map(t => `<i>${t}</i>`).join('')}</span><span class="bp">${c ? `Done ${Math.min(c, PL.BRAND_N)} of ${PL.BRAND_N} ${c >= PL.BRAND_N ? '✓' : '→'}` : PL.BRAND_N + ' exercises →'}</span></span></a>`; }).join('');
};

/* ================= machine preview: «▶ شوف المكنة شغّالة» =================
   Plays an exercise's machine like a short video INSIDE the real simulator, before the learner writes anything:
   the exercise's hidden solution runs on a fresh engine + machine model, a tap marker presses the real input buttons
   following the exercise's own auto-check steps (ex.demo overrides them), and captions narrate cause → effect
   («دوست Start ← KM1 اشتغل»، «بعد 5 ثواني ← ...»). The ladder editor is hidden while it plays.
   The learner's program, I/O state, engine and machine are snapshotted by the simulator and restored exactly on close;
   nothing is saved and nothing is marked complete. Simulators plug in through an adapter:
     {host, watchEl, mount(box), key(), ex(), has(), begin(plantOpt), end(), advance(dt), engine(), plant(),
      setIn(a, raw), inBtn(a), outEl(a), plantEl(), lab(a), addr(a), xl(text), outro, script?(player, ctl)} */
const PV_SEEN = 'plc-preview-seen-v1', PV_AUTO = 'plc-preview-auto';
const PV = PL.preview = {cur:null, rate:0.6};
function pvSeen(){ try { return JSON.parse(lsGet(PV_SEEN)) || {}; } catch (e){ return {}; } }
PV.seen = k => !!pvSeen()[k];
PV.markSeen = k => { const o = pvSeen(); o[k] = 1; lsSet(PV_SEEN, JSON.stringify(o)); };
PV.autoOn = () => lsGet(PV_AUTO) !== 'off';
PV.setAuto = on => lsSet(PV_AUTO, on ? 'on' : 'off');
const PV_CANCEL = {cancel:true};

/* Arabic caption text: escape, and isolate every Latin/number run (I0.0, 5, KM1, %Q0.1, "Start_PB") as LTR */
const PV_W = '["%#]?[A-Za-z0-9][A-Za-z0-9.%#_:+\\-\\/"\\[\\]]*';
const PV_TOK = new RegExp(PV_W + '(?:[ ]+' + PV_W + ')*', 'g');
const PV_IC = {pause:'<path d="M8 5v14M16 5v14"/>', play:'<path d="M7 5l12 7-12 7z"/>', skip:'<path d="M5 5l9 7-9 7zM18 5v14"/>', rep:'<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5"/>'};
const pvIc = k => `<svg viewBox="0 0 24 24" class="pv-ic" aria-hidden="true">${PV_IC[k]}</svg>`;
function ptx(s){
  s = String(s == null ? '' : s); let out = '', last = 0;
  if (EN) return esc(s);
  s.replace(PV_TOK, (m, i) => { out += esc(s.slice(last, i)) + '<bdi dir="ltr">' + esc(m) + '</bdi>'; last = i + m.length; return m; });
  return out + esc(s.slice(last));
}
PV.tx = ptx;
const secs = n => { const v = Math.round(n * 10) / 10; return `<bdi dir="ltr">${fmt(v, v % 1 ? 1 : 0)}</bdi> ${v >= 3 && v <= 10 ? 's' : 's'}`; };

/* ---------- the player: control bar (fixed at the bottom while playing) + tap marker inside the simulator ---------- */
function Player(host, o){
  const bar = document.createElement('div');
  bar.className = 'pv-bar' + (o.loop ? ' pv-loop' : ''); bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Machine running preview');
  bar.innerHTML = `<div class="pv-in"><div class="pv-top"><span class="pv-rec" aria-hidden="true"></span><b class="pv-t">${esc(o.title)}</b><span class="pv-ff" hidden>⏩<span class="pv-fft"> speeding up time</span></span><span class="sp"></span>
    <button type="button" class="btn sm pv-pause" aria-label="Pause" aria-pressed="false">${pvIc('pause')}</button><button type="button" class="btn sm pv-spd" aria-label="Speed">1×</button><button type="button" class="btn sm pv-skip" aria-label="Skip to the end">${pvIc('skip')}</button><button type="button" class="btn sm pv-rep" aria-label="Watch from the start">${pvIc('rep')}</button>${o.loop ? '' : `<button type="button" class="btn sm pri pv-try">Your turn: try it</button>`}</div>
    <div class="pv-cap" aria-live="polite"></div><div class="pv-pr" aria-hidden="true"><i></i></div>
    ${o.auto ? '<div class="pv-end"><button type="button" class="btn sm pv-noauto">Don\'t play it by itself again</button></div>' : ''}</div>`;
  host.insertBefore(bar, host.firstChild); document.body.classList.add('pv-playing');
  const fing = document.createElement('div'); fing.className = 'pv-fing'; fing.setAttribute('aria-hidden', 'true'); fing.innerHTML = '<i></i>';
  host.classList.add('pv-host'); host.appendChild(fing);
  const cap = bar.querySelector('.pv-cap'), prI = bar.querySelector('.pv-pr i'), ffB = bar.querySelector('.pv-ff'), pauseB = bar.querySelector('.pv-pause'), spdB = bar.querySelector('.pv-spd');
  const P = {bar, sp:1, paused:false, gen:0, hls:[]};
  P.frame = gen => new Promise((res, rej) => requestAnimationFrame(ts => {
    if (gen !== P.gen) return rej(PV_CANCEL);
    const dt = P.last ? Math.min(0.1, (ts - P.last) / 1000) : 0; P.last = ts;
    res(P.paused ? 0 : dt * P.sp * PV.rate);
  }));
  P.hold = async (gen, ms) => { let t = 0; while (t < ms) t += (await P.frame(gen)) * 1000; };
  P.say = (html, cls) => { cap.className = 'pv-cap' + (cls ? ' ' + cls : ''); cap.innerHTML = html; };
  P.ff = on => { ffB.hidden = !on; };
  P.progress = f => { prI.style.width = Math.round(Math.max(0, Math.min(1, f)) * 100) + '%'; };
  P.hl = (el, ms) => { if (!el) return; el.classList.add('pv-hl'); P.hls.push(el); setTimeout(() => el.classList.remove('pv-hl'), ms || 1600); };
  P.point = async (gen, el, opt) => {
    if (!el || !el.getBoundingClientRect) return;
    const red = reduced();
    const r0 = el.getBoundingClientRect(), vh = window.innerHeight, bh = bar.getBoundingClientRect().height;
<<<<<<< HEAD
    if (!o.loop && (r0.top < bh + 8 || r0.bottom > vh - 8)) { const y = window.scrollY + r0.top - Math.max(bh + 12, (vh - r0.height) / 2); window.scrollTo({top:Math.max(0, y), behavior:red ? 'auto' : 'smooth'}); await P.hold(gen, red ? 60 : 380); }
=======
    if (r0.top < bh + 8 || r0.bottom > vh - 8) { const y = window.scrollY + r0.top - Math.max(bh + 12, (vh - r0.height) / 2); window.scrollTo({top:Math.max(0, y), behavior:red ? 'auto' : 'smooth'}); await P.hold(gen, red ? 60 : 380); }
>>>>>>> origin/main
    const r = el.getBoundingClientRect(), hr = host.getBoundingClientRect();
    const x = r.left - hr.left + r.width / 2, y = r.top - hr.top + Math.min(r.height / 2, 40);
    fing.classList.toggle('mv', !red && fing.classList.contains('show'));
    fing.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    fing.classList.add('show');
    await P.hold(gen, red ? 80 : 520);
    if (!opt || !opt.noTap){ fing.classList.remove('tap'); void fing.offsetWidth; fing.classList.add('tap'); P.hl(el, 1300); await P.hold(gen, 160); }
  };
  P.hideFinger = () => fing.classList.remove('show', 'mv', 'tap');
  P.reset = () => { P.paused = false; pauseB.innerHTML = pvIc('pause'); pauseB.setAttribute('aria-pressed', 'false'); pauseB.setAttribute('aria-label', 'Pause'); bar.classList.remove('done'); P.ff(false); P.progress(0); P.say(''); P.hideFinger(); P.last = 0; };
  P.finish = () => { bar.classList.add('done'); P.ff(false); P.progress(1); P.hideFinger(); };
  P.destroy = () => { P.gen++; bar.remove(); document.body.classList.remove('pv-playing'); fing.remove(); host.classList.remove('pv-host'); P.hls.forEach(el => el.classList.remove('pv-hl')); };
  pauseB.addEventListener('click', () => { P.paused = !P.paused; pauseB.innerHTML = pvIc(P.paused ? 'play' : 'pause'); pauseB.setAttribute('aria-pressed', P.paused); pauseB.setAttribute('aria-label', P.paused ? 'Resume' : 'Pause'); bar.classList.toggle('paused', P.paused); });
  spdB.addEventListener('click', () => { P.sp = P.sp === 1 ? 2 : 1; spdB.textContent = P.sp + '×'; });
  bar.querySelector('.pv-skip').addEventListener('click', () => o.onSkip());
  bar.querySelector('.pv-rep').addEventListener('click', () => o.onReplay());
  if (!o.loop) bar.querySelector('.pv-try').addEventListener('click', () => o.onTry());
  const na = bar.querySelector('.pv-noauto'); if (na) na.addEventListener('click', () => { PV.setAuto(false); na.textContent = 'OK, it won\'t play by itself again'; na.disabled = true; });
  return P;
}

/* ---------- play / stop ---------- */
PV.play = function(ad, opt){
  opt = opt || {};
  if (PV.cur) PV.cur.close();
  if (!ad.has()) return null;
  const ctl = {ad, closed:false, done:false, expOk:0, expBad:0, err:null, steps:0};
  let pl, gen = 0;
  PV.markSeen(ad.key());
  function run(){
    ctl.done = false; ctl.expOk = 0; ctl.expBad = 0; ctl.err = null;
    pl.reset(); gen = ++pl.gen;
    const ex = ad.ex(), c0 = ex.cases ? ex.cases[0] : null;
    ad.begin(Object.assign({}, ex.plantOpt || {}, c0 && c0.plantOpt || {}));
    ad.host.classList.add('pv-on');
    const p = ad.script ? ad.script(pl, gen, ctl) : simScript(ad, pl, gen, ctl);
    p.then(() => { if (gen === pl.gen){ ctl.done = true; pl.finish(); } }, err => {
      if (err === PV_CANCEL) return;
      ctl.err = String(err && err.message || err); console.warn('preview:', err);
      if (gen === pl.gen){ ctl.done = true; pl.finish(); }
    });
  }
  function stopRun(){ pl.gen++; ad.end(); ad.host.classList.remove('pv-on'); }
  ctl.close = () => { if (ctl.closed) return; ctl.closed = true; stopRun(); pl.destroy(); if (PV.cur === ctl) PV.cur = null; if (ad.onClose) ad.onClose(); };
  ctl.replay = () => { stopRun(); run(); };
  ctl.skip = () => { if (ctl.done) return; pl.gen++; ctl.done = true; ctl.skipped = true; pl.say(ad.outro(), 'end'); pl.finish(); };
  ctl.pause = v => { if (!!v !== pl.paused) pl.bar.querySelector('.pv-pause').click(); };
  pl = Player(ad.host, {title:ad.title || 'The machine running', auto:opt.auto, onTry:ctl.close, onReplay:ctl.replay, onSkip:ctl.skip});
  ctl.player = pl;
  PV.cur = ctl;
  run();
  return ctl;
};
PV.stop = () => { if (PV.cur) PV.cur.close(); };

/* «اتفرج فوق، وطبّق تحت»: a second, display-only copy of the lesson simulator sits above the real one and plays the
   exercise's solution on a loop while it is on screen; the learner's own simulator below stays free to use.
   Not PV.cur, so it never stops (or is stopped by) another preview. */
PV.loop = function(ad, watch){
  let pl = null, gen = 0, vis = false, wait = 0;
  const stopRun = () => { clearTimeout(wait); if (!pl) return; pl.gen++; ad.end(); ad.host.classList.remove('pv-on'); };
  function run(){
    stopRun();
    if (!vis || !ad.host.isConnected || !ad.has()) return;
    if (!pl) pl = Player(ad.host, {title:ad.title || '', loop:true, onReplay:run, onSkip:() => {}});
    const ctl = {ad, closed:false, done:false, expOk:0, expBad:0, err:null, steps:0};
    pl.reset(); gen = ++pl.gen;
    const ex = ad.ex(), c0 = ex.cases ? ex.cases[0] : null;
    ad.begin(Object.assign({}, ex.plantOpt || {}, c0 && c0.plantOpt || {}));
    ad.host.classList.add('pv-on');
    const again = () => { if (gen !== pl.gen) return; pl.finish(); wait = setTimeout(() => { if (gen === pl.gen) run(); }, 3500); };
    (ad.script ? ad.script(pl, gen, ctl) : simScript(ad, pl, gen, ctl)).then(again, err => { if (err === PV_CANCEL) return; console.warn('preview loop:', err); again(); });
  }
  const L = {halt(){ if (pl){ stopRun(); pl.destroy(); pl = null; } }, restart(){ L.halt(); run(); }};
  if ('IntersectionObserver' in G){
    const io = new IntersectionObserver(es => {
      if (!ad.host.isConnected){ io.disconnect(); L.halt(); return; }
      const v = es[es.length - 1].isIntersecting; if (v === vis) return; vis = v;
      if (v) run(); else stopRun();
    }, {threshold:0.25});
    io.observe(watch || ad.host);
  } else { vis = true; run(); }
  return L;
};
if (HAS_DOM) document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && PV.cur) PV.cur.close(); });

/* launch button + auto-play the first time each exercise's machine comes into view */
PV.attach = function(ad){
  const box = document.createElement('div'); box.className = 'pv-launch';
  box.innerHTML = `<button type="button" class="btn pv-go">▶ ${esc(ad.goLabel || 'See the machine running')}</button><span class="muted">${esc(ad.goSub || 'Watch the machine running correctly before you write the program.')}</span>`;
  ad.mount(box);
  box.querySelector('.pv-go').addEventListener('click', () => PV.play(ad));
  let vis = false, tmr = 0;
  const tryAuto = () => {
    clearTimeout(tmr);
    if (!vis || PV.cur || !PV.autoOn() || !ad.has() || PV.seen(ad.key()) || ad.watchEl.closest('.gated')) return;
    tmr = setTimeout(() => { if (vis && !PV.cur && PV.autoOn() && ad.has() && !PV.seen(ad.key()) && !ad.watchEl.closest('.gated')) PV.play(ad, {auto:true}); }, 700);
  };
  ad.refresh = () => { box.hidden = !ad.has(); tryAuto(); };
  if ('IntersectionObserver' in G) new IntersectionObserver(es => { vis = es[0].isIntersecting; tryAuto(); }, {threshold:0.6}).observe(ad.watchEl);
  ad.refresh();
  return box;
};

/* ---------- the generic script: replay the exercise's own check steps on the live machine ---------- */
async function simScript(ad, pl, gen, ctl){
  const ex = ad.ex(), c0 = ex.cases ? ex.cases[0] : null;
  const steps = ex.demo || (c0 ? c0.steps : ex.tests) || [];
  const ins = (ex.io && ex.io.inputs) || [], outs = (ex.io && ex.io.outputs) || [];
  const E = () => ad.engine();
  const inp = a => ins.find(i => i.a === a);
  const def = a => { const i = inp(a); return i && (i.kind === 'pbnc' || i.kind === 'ncsw' || i.def) ? 1 : 0; };
  const ctx = {get e(){ return ad.engine(); }, get plant(){ return ad.plant(); }, get t(){ return ad.engine().t; }, q: a => ad.engine().get(a), hist:[], mark:{}};
  const hold = ms => pl.hold(gen, ms);
  const nm = a => { const l = ad.lab(a), ad2 = ad.addr(a); return `<b>${ptx(l || ad2)}</b>${l ? ` <bdi dir="ltr" class="pv-a">${esc(ad2)}</bdi>` : ''}`; };
  const isLamp = a => { const o = outs.find(x => x.a === a) || {}; return o.kind === 'lamp' || /لمب|lamp|light/i.test(o.label || ''); };
  const chip = (a, on) => `<span class="pv-st${on ? ' on' : ''}">${ptx(ad.lab(a) || ad.addr(a))} <bdi dir="ltr">${on ? 'ON' : 'OFF'}</bdi></span>`;
  const verb = (a, on) => isLamp(a) ? (on ? 'lit' : 'went off') : (on ? 'started' : 'stopped');
  let prev = {}, prevAuto = {}, cause = {txt:'', t:0, key:'start', el:null};
  const snapOuts = () => outs.forEach(o => { prev[o.a] = E().get(o.a) ? 1 : 0; });
  const autos = ins.filter(i => i.kind === 'auto');
  const snapAuto = () => autos.forEach(i => { prevAuto[i.a] = E().get(i.a) ? 1 : 0; });
  const said = {}, watches = [];
  const DT = 0.01;
  /* one 10 ms step of machine + PLC; the check's watch steps keep their bookkeeping (ctx.mark) like in the auto-check */
  let curUntil = null, untilHit = false;
  const step = () => { ad.advance(DT); watches.forEach(w => { try { w(ctx); } catch (er){} }); if (curUntil && !untilHit){ try { if (curUntil(ctx)) untilHit = true; } catch (er){ untilHit = true; } } };
  function changes(){ const ch = []; outs.forEach(o => { const v = E().get(o.a) ? 1 : 0; if (v !== prev[o.a]){ ch.push({a:o.a, on:v}); prev[o.a] = v; } }); return ch; }
  function watchAutos(){ autos.forEach(i => { const v = E().get(i.a) ? 1 : 0; if (v !== prevAuto[i.a]){ prevAuto[i.a] = v; cause = {txt:`${nm(i.a)} ${v ? 'detected' : 'cleared'}`, t:E().t, key:'auto:' + i.a + v, el:null}; } }); }
  async function narrate(ch, done){
    /* outputs that switch a scan or two later belong to the same moment */
    for (let k = 0; k < 4 && !done(); k++){ step(); watchAutos(); changes().forEach(c => { const j = ch.findIndex(x => x.a === c.a); if (j >= 0) ch.splice(j, 1); else ch.push(c); }); }
    if (!ch.length) return;
    const now = E().t, dtc = now - cause.t, quick = dtc <= 0.8 && cause.txt;
    const pre = quick ? cause.txt : cause.t > 0 || cause.key !== 'start' ? `After ${secs(dtc)}` : '';
    const eff = ch.map(x => `${nm(x.a)} ${verb(x.a, x.on)}`).join(' and ');
    const key = (quick ? cause.key : 'time') + '|' + ch.map(x => x.a + x.on).join();
    pl.say(`${pre ? pre + ' <span class="pv-arr">→</span> ' : ''}${eff}`, 'fx');
    if (quick && cause.el) pl.hl(cause.el, 1700);
    ch.forEach(x => pl.hl(ad.outEl(x.a), 1700));
    pl.hl(ad.plantEl(), 900);
    const rep = said[key]; said[key] = 1;
    if (!rep) await hold(2400);
    cause = {txt:'', t:E().t, key:'after', el:null};
  }
  async function sim(sec, until){
    const t0 = E().t, fast = sec > 3 ? 2 : 1;
    curUntil = until || null; untilHit = false;
    const done = () => { if (until){ if (untilHit) return true; try { if (until(ctx)) return true; } catch (er){ return true; } } return E().t - t0 >= sec - 1e-9; };
    let budget = 0;
    pl.ff(fast > 1);
    const f = until ? 1.5 : fast;
    while (!done()){
      budget += (await pl.frame(gen)) * f;
      while (budget >= DT && !done()){
        budget -= DT; step(); watchAutos();
        const ch = changes();
        if (ch.length){ budget = 0; pl.ff(false); await narrate(ch, done); pl.ff(fast > 1); break; }
      }
    }
    pl.ff(false); curUntil = null;
  }
  async function setIn(a, v, how){
    const i = inp(a);
    if (!i || i.kind === 'auto' || i.kind === 'enc'){ E().setIn(a, v); return; }
    const cur = E().phys[a] != null ? E().phys[a] : def(a);
    if (how !== 'force' && cur === v && how !== 'press') return;
    const act = v !== def(a), k = i.kind;
    let txt, done; /* txt: what we do now · done: the same thing said as the cause of what follows */
    if (k === 'pb' || k === 'pbnc'){ txt = how === 'press' ? `Press ${nm(a)} and release it` : act ? `Press ${nm(a)} and hold it` : `Release ${nm(a)}`; done = how === 'press' || act ? `You pressed ${nm(a)}` : `You released ${nm(a)}`; }
    else if (k === 'sw'){ txt = v ? `Turn on switch ${nm(a)}` : `Turn off switch ${nm(a)}`; done = v ? `You turned on switch ${nm(a)}` : `You turned off switch ${nm(a)}`; }
    else if (k === 'sensor') txt = v ? `Sensor ${nm(a)} detected` : `Sensor ${nm(a)} cleared`;
    else if (k === 'ncsw') txt = v ? `${nm(a)} back to normal` : `${nm(a)} opened`;
    else txt = `${nm(a)} = <bdi dir="ltr">${v}</bdi>`;
    let note = '';
    if ((k === 'pbnc' || k === 'ncsw') && act && !said['nc:' + a]){ said['nc:' + a] = 1; note = ` <span class="pv-note">(wired <bdi dir="ltr">NC</bdi>: at rest the signal is <bdi dir="ltr">1</bdi>, and when ${k === 'pbnc' ? 'you press it' : 'it opens'} it becomes <bdi dir="ltr">0</bdi>)</span>`; }
    pl.say(txt + note, 'act');
    await pl.point(gen, ad.inBtn(a));
    ad.setIn(a, v);
    cause = {txt:done || txt, t:E().t, key:'in:' + a + v, el:ad.inBtn(a)};
    if (note) await hold(1500);
  }
  function plantTxt(p){
    if ('obst' in p) return p.obst ? 'A car stopped under the door (the safety eye sees it)' : 'The car moved out from under the door';
    if ('level' in p) return `Tank level is now <bdi dir="ltr">${esc(p.level)}%</bdi>`;
    return 'Something changed in the machine';
  }

  /* ---- go ---- */
  for (let k = 0; k < 5; k++) ad.advance(DT); /* same 0.05 s settle as the auto-check */
  snapOuts(); snapAuto();
  pl.say(`<b>Watch:</b> the correct program is running inside the <bdi dir="ltr">PLC</bdi>, hidden from you. We'll press the buttons just as you will, and you watch what the machine does.`, 'intro');
  pl.hl(ad.plantEl(), 2000);
  await hold(2400);
  ctl.steps = steps.length;
  for (let si = 0; si < steps.length; si++){
    pl.progress(si / steps.length);
    const st = steps[si];
    if (st.watch) watches.push(st.watch);
    if (st.set) for (const a of Object.keys(st.set)) await setIn(a, st.set[a] ? 1 : 0);
    if (st.plant){ pl.say(plantTxt(st.plant), 'act'); await pl.point(gen, ad.plantEl(), {noTap:true}); Object.assign(ad.plant(), st.plant); cause = {txt:plantTxt(st.plant), t:E().t, key:'plant' + JSON.stringify(st.plant), el:null}; await hold(900); }
    if (st.word) Object.keys(st.word).forEach(a => E().setWord(a, st.word[a]));
    if (st.press){ const a = st.press; await setIn(a, 1 - def(a), 'press'); await sim(st.t || 0.3); ad.setIn(a, def(a)); await sim(0.15); }
    if (st.hold) await setIn(st.hold, 1 - def(st.hold), 'force');
    if (st.release) await setIn(st.release, def(st.release), 'force');
    if (st.run != null) await sim(st.run);
    if (st.until) await sim(st.max || 30, st.until);
    if (st.exp){
      const ks = Object.keys(st.exp), good = ks.every(a => (E().get(a) ? 1 : 0) === (st.exp[a] ? 1 : 0));
      if (good) ctl.expOk++; else { ctl.expBad++; (ctl.badAt = ctl.badAt || []).push(si + ' t=' + E().t.toFixed(2) + ' lvl=' + (ad.plant().level != null ? ad.plant().level.toFixed(1) : '') + ': ' + ks.map(x => x + '=' + (E().get(x) ? 1 : 0)).join(' ') + ' ' + (st.msg || '')); }
      if (st.msg){
        const m = ad.xl(String(st.msg)).replace(/[\s:：]+$/, '');
        const key = 'exp:' + m;
        pl.say(`<span class="pv-ok">✓</span> ${ptx(m)}<span class="pv-chips">${ks.map(a => chip(a, !!(E().get(a)))).join('')}</span>`, 'exp');
        ks.forEach(a => pl.hl(ad.outEl(a), 1400));
        await hold(said[key] ? 700 : 2000); said[key] = 1;
      }
    }
    if (st.fn){ try { st.fn(ctx); } catch (er){} }
  }
  pl.progress(1);
  pl.say(ad.outro(), 'end');
}
/* ---------- «💡 الخطوة الجاية» for the ladder editors (lessons + brand pages); text and UI in /assets/next-hint.js (window.NH) ----------
   PL.nextStep(prog, ex, o) → {kind:'next'|'fix'|'done', html, cell:{i,r,c}|null, add:bool, act} or null (no reference solution / no NH).
   o: {cols, last:{i,r,c} (the cell the trainee changed last), disp(a) (address as the editor shows it), box(a) (a timer/counter box's name), lab(a) (I/O label),
       btn (the test button's text), check() → {ok, msg} (the editor's own auto-check, run only when nothing is missing)}.
   Rungs of the reference are matched to the trainee's by their outputs; inside a rung, elements are compared per place
   (series line / output / parallel branch) as multisets, so contacts in another order or column still count. A trainee
   program that passes the auto-check is always «done», whatever its shape. act = what the step does (used by the tests only). */
PL.nextStep = function(prog, ex, o){
  const N = window.NH; if (!N || !ex || !ex.sol || !prog) return null;
  const C = o.cols || 5, S = N.S, I = S.idea, esc = N.esc;
  const sol = ENG.program(ex.sol, C);
  const tok = el => el && el.t !== 'W' ? ENG.tok(el) : null;
  const ad = a => o.disp ? o.disp(a) : a;
  const disp = el => { if (!el || el.t === 'W') return '—'; let s = el.t + ' ' + (o.box && ['TON', 'TOF', 'TP', 'RTO', 'CTU', 'CTD'].includes(el.t) ? o.box(el.a) : ad(el.a)); if (el.t === 'CMP') s += ' ' + el.op + ' ' + el.b; else if (el.pt != null) s += ' ' + el.pt + 's'; else if (el.pv != null) s += ' = ' + el.pv; else if (el.t === 'SCL') s += ' → ' + ad(el.o); return s; };
  /* a parallel branch is keyed by what it bypasses on the series line (the latch around START, not around STOP); a branch row
     with no links yet is not judged on that (closing it is its own step) */
  const cover = (rg, r) => { if (!r) return ''; const row = rg.rows[r], L = rg.links[r - 1] || []; const st = row.findIndex(Boolean); if (st < 0 || st >= C - 1) return '*';
    let end = st; while (end < C - 1 && row[end]) end++; /* the branch conducts through its contiguous cells and rejoins at the next node */
    if (!L.includes(end) || (st > 0 && !L.includes(st))) return '*';
    return rg.rows[0].slice(st, end).map(tok).filter(Boolean).sort().join(','); };
  const items = rg => { const out = []; rg.rows.forEach((row, r) => { const cv = cover(rg, r); row.forEach((el, c) => { const t = tok(el); if (t){ const k = c === C - 1 ? 'out' : r ? 'br' : 'main'; out.push({t, el, r, c, k, key:k + '|' + t + (k === 'br' ? '|' + cv : '')}); } }); }); return out; };
  const outsOf = rg => items(rg).filter(x => x.k === 'out').map(x => x.el.t + ':' + x.el.a);
  const same = (x, y) => x.key === y.key || (x.k === 'br' && y.k === 'br' && x.t === y.t && (x.key.endsWith('|*') || y.key.endsWith('|*')));
  const cnt = (list, x) => list.filter(y => same(x, y)).length;
  /* 1. which trainee rung builds which reference rung */
  const used = new Set(), match = sol.map(sr => {
    const so = outsOf(sr), st = items(sr).map(x => x.t); let best = -1, bs = 0;
    prog.forEach((tr, j) => { if (used.has(j)) return; const to = outsOf(tr), tt = items(tr).map(x => x.t); if (to.length && !so.some(x => to.includes(x))) return;
      const sc = so.filter(x => to.includes(x)).length * 100 + st.filter(x => tt.includes(x)).length; if (sc > bs){ bs = sc; best = j; } });
    if (best < 0) best = prog.findIndex((tr, j) => !used.has(j) && !items(tr).length);
    if (best >= 0) used.add(best);
    return best;
  });
  /* 2. elements the trainee has that the matched reference rung doesn't (per place) */
  const extras = [];
  prog.forEach((tr, j) => { const k = match.indexOf(j), have = items(tr), want = k >= 0 ? items(sol[k]) : [], seen = {};
    const left = want.slice(); have.forEach(x => { const m = left.findIndex(y => same(x, y)); if (m >= 0) left.splice(m, 1); else extras.push(Object.assign({i:j}, x)); }); });
  const fixOf = x => ({kind:'fix', html:S.fixEl(disp(x.el), x.i + 1), cell:{i:x.i, r:x.r, c:x.c}, act:{op:'del', i:x.i, r:x.r, c:x.c}});
  const total = rgs => rgs.reduce((n, rg) => n + items(rg).length, 0);
  let chk = null; const passes = () => { if (!chk) chk = o.check ? o.check() || {ok:false} : {ok:false}; return chk.ok; };
  const done = () => ({kind:'done', html:S.doneProg(o.btn || ''), cell:null});
  if (total(prog) >= total(sol) && passes()) return done();
  const lx = o.last && extras.find(x => x.i === o.last.i && x.r === o.last.r && x.c === o.last.c);
  if (lx) return fixOf(lx);
  /* 3. the first thing the reference has and the trainee doesn't: series contacts left → right, the output, then the branches */
  const qOut = {}; sol.forEach((sr, k) => outsOf(sr).forEach(t => { const a = ENG.parse(t).a; (qOut[a] = qOut[a] || []).push(k); }));
  const idea = (x, sr, k) => {
    const el = x.el, kd = ENG.kind(el.a), myOuts = items(sr).filter(y => y.k === 'out').map(y => y.el.a);
    if (x.k === 'br' && el.t === 'NO' && myOuts.includes(el.a)) return I.latch;
    if (el.t === 'NC' && kd === 'Q' && !myOuts.includes(el.a) && (qOut[el.a] || []).some(m => m !== k)) return I.interlock;
    if (['TON', 'TOF', 'TP', 'RTO'].includes(el.t) || kd === 'T' || kd === 'TB') return I.timer;
    if (['CTU', 'CTD'].includes(el.t) || kd === 'C' || kd === 'HC') return I.counter;
    if (el.t === 'CMP') return I.compare;
    if (el.t === 'S') return I.set;
    if (el.t === 'R') return I.reset;
    if (el.t === 'P' || el.t === 'N') return I.edge;
    if (el.t === 'SCL') return I.scale;
    if (el.t === 'OUT') return I.coil;
    if (kd === 'I' && o.lab){ const l = o.lab(el.a); if (l) return l; }
    return null;
  };
  const say = (id, t) => id ? `${esc(id)}: ${t}` : t;
  const near = (row, c) => { for (let d = c; d >= 0; d--) if (tok(row[d])) return row[d]; for (let d = c + 1; d < C - 1; d++) if (tok(row[d])) return row[d]; return null; };
  for (let k = 0; k < sol.length; k++){
    const sr = sol[k], j = match[k], want = items(sr), sr0 = sr.rows[0];
    if (j < 0) return {kind:'next', html:S.newRung(prog.length + 1), cell:null, add:true, act:{op:'rung'}};
    const tr = prog[j], have = items(tr).filter(x => !extras.some(e => e.i === j && e.r === x.r && e.c === x.c)), ord = want.filter(x => x.k === 'main').sort((a, b) => a.c - b.c).concat(want.filter(x => x.k === 'out').sort((a, b) => a.r - b.r), want.filter(x => x.k === 'br').sort((a, b) => a.r - b.r || a.c - b.c));
    const pool = have.slice();
    for (const x of ord){
      const m = pool.findIndex(y => same(x, y)); if (m >= 0){ pool.splice(m, 1); continue; }
      const d = disp(x.el), id = idea(x, sr, k), n = j + 1;
      /* the same element sitting in the wrong place, or a wrong element on its place: that one goes first */
      const blk = extras.find(e => e.i === j && e.t === x.t) || extras.find(e => e.i === j && e.r === x.r && e.c === x.c) || (x.k === 'main' && tr.rows[0].every((el, cc) => cc >= C - 1 || tok(el)) && extras.find(e => e.i === j && e.k === 'main'));
      if (blk) return fixOf(blk);
      let r = x.r, c = x.c, html;
      if (x.k === 'main'){ const row = tr.rows[0]; if (tok(row[c])) c = row.findIndex((el, cc) => cc < C - 1 && !tok(el)); const prev = near(sr0.slice(0, x.c), x.c - 1); html = prev && x.c > 0 ? S.putAfter(d, disp(prev), n) : S.put(d, n); }
      else if (x.k === 'out' && x.r === 0){ r = 0; html = S.putEnd(d, n); }
      else { const above = x.k === 'out' ? sr0[C - 1] : near(sr0, x.c); html = above ? S.putUnder(d, disp(above), n) : S.put(d, n); if (r >= tr.rows.length) r = tr.rows.length; }
      return {kind:'next', html:say(id, html), cell:{i:j, r, c}, act:{op:'put', i:j, r, c, tok:x.t, links:x.r > 0 ? (sr.links[x.r - 1] || []).slice() : null}};
    }
    /* every element is there: a branch also has to be closed back onto the line (its vertical links) */
    for (let r = 1; r < sr.rows.length; r++){
      const first = items({rows:[sr.rows[r]]}).find(Boolean); if (!first) continue;
      const tr2 = tr.rows.findIndex((row, rr) => rr > 0 && row.some(el => tok(el) === first.t));
      if (tr2 < 1) continue;
      const need = sr.links[r - 1] || [], hasL = tr.links[tr2 - 1] || [];
      const miss = need.find(m => !hasL.includes(m));
      if (miss != null && hasL.length < need.length){ const at = near(sr0, Math.max(0, Math.min(C - 2, miss - 1))); return {kind:'next', html:S.close(at ? disp(at) : '—', j + 1), cell:{i:j, r:tr2, c:Math.min(C - 1, Math.max(0, miss - 1))}, act:{op:'link', i:j, r:tr2, n:miss}}; }
    }
    /* a gap in the series line (a deleted wire) */
    const tr0 = tr.rows[0];
    for (let c = 0; c < C - 1; c++) if (sr0[c] && !tr0[c] && want.some(x => x.k === 'out' && x.r === 0)){ const prev = near(sr0.slice(0, c), c - 1); return {kind:'next', html:prev ? S.putAfter(S.wireCell, disp(prev), j + 1) : S.put(S.wireCell, j + 1), cell:{i:j, r:0, c}, act:{op:'put', i:j, r:0, c, tok:'-'}}; }
  }
  if (extras.length) return fixOf(extras[extras.length - 1]);
  if (passes()) return done();
  return {kind:'fix', html:chk && chk.msg ? String(chk.msg) : S.doneProg(o.btn || ''), cell:null};
};
/* show/refresh the hint line of a ladder editor; tapping it flashes the target cell (or the «new rung» button) for 3 s */
PL.nhLadder = function(ctl, s, lad, addBtn, cellSel){
  if (!ctl) return;
  ctl.set(s);
  ctl.onTap = st => { if (!st) return; if (st.add && addBtn) window.NH.flash(addBtn); else if (st.cell) window.NH.flash(lad, `${cellSel}[data-i="${st.cell.i}"][data-r="${st.cell.r}"][data-c="${st.cell.c}"]`); };
};

})();

/* قفل الدروس بالترتيب: assets/lesson-gate.js */
;(function(){ if (typeof document === "undefined" || window.LEGate) return; var s = document.createElement("script"); s.src = "/assets/lesson-gate.js?v=20261029g1"; document.head.appendChild(s); })();
