/* VFD course (English copy): shared engine for the hub and the 12 lessons.
   Modules: store/progress · theme · lesson shell · quiz · drill (same as the instrumentation course) ·
   case game · order game · wiring board · one interactive widget per lesson topic.
   Lesson pages hold the content + data and call the widgets. Numbers are typical teaching values:
   every drive's manual is the reference. */
(function(){
'use strict';
const VF = window.VF = {};
const KEY = 'vfdc-lab-v1';

/* ---------------- store ---------------- */
function load(){ try { const s = JSON.parse(localStorage.getItem(KEY)); return s && typeof s === 'object' ? s : {}; } catch (e){ return {}; } }
let S = load(); if (!S.done || typeof S.done !== 'object') S.done = {};
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e){} }
const subs = [];
VF.on = fn => subs.push(fn);
VF.store = {
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
  b.addEventListener('click', () => { VF.store.set('theme', isDark() ? 'light' : 'dark'); applyTheme(); upd(); });
  upd(); return b;
}

/* ---------------- course map ---------------- */
VF.COURSE = [
  {id:'l1', n:1, file:'lesson-01.html', title:'Why a VFD?', sub:'DOL, star/delta, soft starter and VFD, starting current, and energy savings in pumps and fans',
    tasks:[['start','Compare starting methods'],['fan','Savings calculator'],['aff','Pump laws drill'],['quiz','Lesson quiz']]},
  {id:'l2', n:2, file:'lesson-02.html', title:'Inside the drive', sub:'Rectifier, the DC bus and its voltage, IGBTs, the chopper, and the control board',
    tasks:[['parts','Open the drive'],['bus','DC bus voltage drill'],['quiz','Lesson quiz']]},
  {id:'l3', n:3, file:'lesson-03.html', title:'PWM and V/f', sub:'How IGBTs make a sine wave, the V/f ratio, boost, the carrier, and running above 50 Hz',
    tasks:[['pwm','PWM simulator'],['vf','V/f drill'],['quiz','Lesson quiz']]},
  {id:'l4', n:4, file:'lesson-04.html', title:'Power wiring', sub:'R S T and U V W, earthing, the motor cable, the braking resistor, and an output contactor',
    tasks:[['wire','Wire the power and motor'],['rules','True or false'],['quiz','Lesson quiz']]},
  {id:'l5', n:5, file:'lesson-05.html', title:'Control terminals', sub:'Digital inputs 2-wire and 3-wire, preset speeds, 0–10 V and 4–20 mA, and the relay',
    tasks:[['cwire','Wire the control terminals'],['run','Run from the terminals'],['scale','Speed signal drill'],['quiz','Lesson quiz']]},
  {id:'l6', n:6, file:'lesson-06.html', title:'Basic parameters', sub:'From the motor nameplate to the parameters, accel and decel, min and max speed, and command and speed source',
    tasks:[['plate','Nameplate to parameters'],['ramp','Ramp drill'],['quiz','Lesson quiz']]},
  {id:'l7', n:7, file:'lesson-07.html', title:'Control modes and autotune', sub:'V/f, sensorless vector and vector with encoder, slip, and torque at low speed',
    tasks:[['mode','Low-speed challenge'],['pick','Pick the mode'],['quiz','Lesson quiz']]},
  {id:'l8', n:8, file:'lesson-08.html', title:'Braking and stopping', sub:'Ramp and coast, the OV fault, braking resistor and chopper, and DC injection',
    tasks:[['ov','Cause an OV fault'],['stop','Stop the heavy load'],['quiz','Lesson quiz']]},
  {id:'l9', n:9, file:'lesson-09.html', title:'PID and applications', sub:'Constant-pressure pump, Kp and Ti, sleep, and settings for fans, conveyors and hoists',
    tasks:[['pid','Constant-pressure pump'],['app','Application settings'],['quiz','Lesson quiz']]},
  {id:'l10', n:10, file:'lesson-10.html', title:'Common faults and fixes', sub:'OC, OV, UV, OL, OH, ground fault and phase loss, and how to think before you reset',
    tasks:[['game','Fault game'],['quiz','Lesson quiz']]},
  {id:'l11', n:11, file:'lesson-11.html', title:'Safety and installation', sub:'DC bus discharge, LOTO, EMC and cable length, derating, and harmonics',
    tasks:[['lock','Safety steps in order'],['dc','Measure the DC bus'],['derate','Derating drill'],['quiz','Lesson quiz']]},
  {id:'l12', n:12, file:'lesson-12.html', title:'First start-up + final exam', sub:'Commissioning steps in order, the final exam, and the next step: the simulators',
    tasks:[['comm','Commissioning steps'],['quiz','Lesson quiz'],['final','Final exam']]}
];
VF.lessonById = id => VF.COURSE.find(l => l.id === id);
VF.summary = id => { const l = VF.lessonById(id); const done = l.tasks.filter(t => VF.store.has(id + '/' + t[0])).length; return {done, total:l.tasks.length}; };
VF.mark = (lid, task) => VF.store.mark(lid + '/' + task);
VF.has = (lid, task) => VF.store.has(lid + '/' + task);
VF.allDone = () => VF.COURSE.every(l => { const s = VF.summary(l.id); return s.done === s.total; });

/* ---------------- helpers ---------------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
VF.esc = esc;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
VF.$ = $; VF.$$ = $$;
const fmt = (v, d) => { const p = Math.pow(10, d); const r = Math.round(v * p) / p; return (Object.is(r, -0) ? 0 : r).toFixed(d); };
VF.fmt = fmt;
function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
VF.shuffle = shuffle;
const pick = a => a[Math.floor(Math.random() * a.length)];
VF.pick = pick;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
VF.clamp = clamp;
const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
VF.reduced = reduced;
let uid = 0; const U = p => p + (++uid);
VF.uid = U;
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
VF.animate = animate;
/* tap/keyboard on [data-*] elements inside a host */
function onAct(host, sel, fn){
  host.addEventListener('click', e => { const t = e.target.closest(sel); if (t && host.contains(t)) fn(t, e); });
  host.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const t = e.target.closest(sel); if (t && host.contains(t) && t.tagName !== 'BUTTON' && t.tagName !== 'INPUT' && t.tagName !== 'SELECT'){ e.preventDefault(); fn(t, e); } });
}
VF.onAct = onAct;
const num = s => { const v = parseFloat(String(s).replace(',', '.').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))); return isFinite(v) ? v : NaN; };
VF.num = num;
function chal(host, sel, lesson, task){ const c = $(sel, host); if (c && VF.has(lesson, task)) c.classList.add('ok'); return () => { if (c) c.classList.add('ok'); VF.mark(lesson, task); }; }

/* ---------------- lesson shell ---------------- */
VF.lesson = function(id){
  const L = VF.lessonById(id); VF.cur = L;
  const ch = $('header.top .chips'); if (ch) ch.appendChild(themeBtn());
  const prog = $('#lprog');
  function renderProg(){
    if (!prog) return;
    const s = VF.summary(id), pct = Math.round(s.done / s.total * 100);
    prog.innerHTML = `<div class="row"><span>Your progress in this lesson: <b>${s.done} of ${s.total}</b></span><span class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progress ${pct}%"><i style="width:${pct}%"></i></span></div><ul>${L.tasks.map(t => `<li class="${VF.has(id, t[0]) ? 'ok' : ''}">${esc(t[1])}</li>`).join('')}</ul>`;
  }
  renderProg(); VF.on(renderProg);
  const nav = $('#lnav');
  if (nav){
    const i = VF.COURSE.indexOf(L), p = VF.COURSE[i - 1], n = VF.COURSE[i + 1];
    nav.innerHTML = (p ? `<a class="btn" href="${p.file}">← Lesson ${p.n}: ${esc(p.title)}</a>` : `<a class="btn" href="index.html">← Course page</a>`) +
      (n ? `<a class="btn pri" href="${n.file}">Lesson ${n.n}: ${esc(n.title)} →</a>` : `<a class="btn pri" href="index.html#certSec">Certificate →</a>`);
  }
  window.addEventListener('pageshow', e => { if (e.persisted){ VF.store.reload(); renderProg(); } });
};
VF.hubTheme = () => { const ch = $('header.top .chips'); if (ch) ch.appendChild(themeBtn()); };

/* ---------------- quiz ----------------
   qs: [{q, o:[...], a:index, why}] ; opt: {lesson, task, pass(0..1), row, shuffle} */
VF.quiz = function(host, qs, opt){
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
    sum.innerHTML = `<b>Your score: ${n} of ${tot}</b><span>${ok ? 'Great, you passed ✓' : `You need at least ${Math.ceil(pass * tot - 1e-9)} correct. Review the lesson and try again.`}</span><button type="button" class="btn" data-qz="again">${ok ? 'Take it again' : 'Try again'}</button>`;
    if (ok && opt.lesson) VF.mark(opt.lesson, opt.task || 'quiz');
    if (opt.onDone) opt.onDone(n, tot, ok);
  }
  start();
  const api = {solve(wrong){ order.forEach((it, k) => { const i = wrong && k === 0 ? it.oi.find(j => j !== it.q.a) : it.q.a; const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }); return $('.qz-sum', host).textContent; }, answer(k, i){ const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }, order: () => order.map(x => x.q), restart: start};
  (VF._q = VF._q || []).push(api); api.host = host;
  return api;
};

/* ---------------- drill: a stream of generated questions ----------------
   gen() → {q (html), o:[...] , a:index, why}  or  {q, input:true, unit, check(v)→bool, ans (text), why}
   need: correct answers to finish the task */
VF.drill = function(host, gen, opt){
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
  card.addEventListener('submit', e => { e.preventDefault(); if (answered) return; const v = num($('input', card).value); if (!isFinite(v)){ const f = $('.qz-f', card); f.className = 'qz-f no'; f.textContent = 'Type a number.'; return; } result(!!cur.check(v)); });
  nx.addEventListener('click', next);
  next();
  return {get cur(){ return cur; }, answer(v){ if (cur.input){ $('input', card).value = v; $('.dr-in button', card).click(); } else { const b = card.querySelector(`.qz-o[data-i="${v}"]`); if (b) b.click(); } }, next, get ok(){ return ok; }};
};

/* ================= shared widgets ================= */
/* case game (copied from the instrumentation course) */
VF.caseGame = function(host, cases, opt){
  opt = opt || {};
  const need = opt.need || Math.ceil(cases.length * 0.7);
  const order = shuffle(cases.map((_, i) => i)); let k = 0, ok = 0, ans = 0;
  host.innerHTML = `<div class="dr-top"><span class="cg-sc" aria-live="polite"></span><span class="bar"><i class="cg-bar"></i></span></div><div class="cg-card dr-card"></div><div class="dr-act"><button type="button" class="btn pri cg-next" hidden>Next →</button></div><p class="chal cg-chal">${opt.goal || `Solve at least <b>${need}</b> cases correctly.`}</p>`;
  const q = s => $(s, host), fin = chal(host, '.cg-chal', opt.lesson, opt.task), card = q('.cg-card');
  function score(){ q('.cg-sc').innerHTML = `Case <b>${Math.min(k + 1, cases.length)}</b> of ${cases.length} · correct: <b>${ok}</b>`; q('.cg-bar').style.width = Math.min(100, ok / need * 100) + '%'; }
  function show(){
    const c = cases[order[k]], oi = shuffle(c.o.map((_, i) => i));
    card.innerHTML = `${c.code ? `<div class="kp-scr" aria-label="Drive display">${c.code}</div>` : ''}<h4>${c.t}</h4><div class="dr-q" style="font-weight:500">${c.s}</div>${c.clues && c.clues.length ? `<div class="chips-t">${c.clues.map((cl, i) => `<button type="button" class="btn" data-cl="${i}" aria-expanded="false">Check: ${cl[0]}</button>`).join('')}</div><div class="cg-clue"></div>` : ''}<p style="margin:4px 0 0;font-weight:600">${c.ask || 'What is the most likely cause?'}</p><div class="qz-a">${oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${c.o[i]}</button>`).join('')}</div><p class="qz-f" aria-live="polite"></p>`;
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
    nx.textContent = k + 1 < cases.length ? 'Next case →' : (ok >= need ? 'Play again' : 'Start over');
  });
  q('.cg-next').addEventListener('click', () => { if (k + 1 < cases.length) k++; else { k = 0; ok = 0; order.sort(() => Math.random() - 0.5); } show(); });
  show();
  return {get cur(){ return cases[order[k]]; }, answer(i){ const b = card.querySelector(`.qz-o[data-i="${i}"]`); if (b) b.click(); }, next(){ q('.cg-next').click(); }, get ok(){ return ok; }};
};

/* order game: tap the steps in the right order. steps: html strings in the correct order */
VF.order = function(host, steps, opt){
  opt = opt || {};
  let ord = [], pos = 0;
  host.innerHTML = `<div class="og"><p class="muted">${opt.help || 'Tap the steps in the right order, from first to last.'}</p><ol class="steps-l og-done"></ol><div class="og-pool"></div><p class="msg og-msg" aria-live="polite"></p><div class="wd-ctl"><button type="button" class="btn og-reset">Start over</button></div><p class="chal og-chal">${opt.goal || 'Put all the steps in the right order to complete this exercise.'}</p></div>`;
  const fin = chal(host, '.og-chal', opt.lesson, opt.task);
  const pool = $('.og-pool', host), done = $('.og-done', host), msg = $('.og-msg', host);
  const say = (t, c) => { msg.className = 'msg og-msg ' + (c || ''); msg.innerHTML = t; };
  function start(){ ord = shuffle(steps.map((_, i) => i)); pos = 0; render(); say(''); }
  function render(){
    done.innerHTML = steps.slice(0, pos).map(s => `<li class="ok">${s}</li>`).join('');
    pool.innerHTML = ord.filter(i => i >= pos).map(i => `<button type="button" class="btn og-b" data-i="${i}">${steps[i]}</button>`).join('');
  }
  pool.addEventListener('click', e => {
    const b = e.target.closest('.og-b'); if (!b) return;
    const i = +b.dataset.i;
    if (i === pos){
      pos++; render();
      if (pos === steps.length){ say(opt.done || 'Done, the whole order is correct.', 'ok'); fin(); }
      else say(opt.why && opt.why[i] ? '✓ ' + opt.why[i] : '✓ Correct, keep going.', 'ok');
    } else { b.classList.add('no'); setTimeout(() => b.classList.remove('no'), 800); say('That is not the next step. Think: what has to happen before it?', 'bad'); }
  });
  $('.og-reset', host).addEventListener('click', start);
  start();
  return {solve(){ let n = 0; while (pos < steps.length && n++ < 50){ const b = pool.querySelector(`[data-i="${pos}"]`); if (b) b.click(); } }};
};

/* simple line chart → SVG inner markup.
   o: {W, H, xr, yr, xt, yt, y2:{r, t, col}, series:[{pts, col, w, dash, y2, op}], hl:[{y, col, lab, y2}], xlab, ylab} */
function plot(o){
  const W = o.W || 360, H = o.H || 150, L = 34, R = o.y2 ? 34 : 10, T = 8, B = 22;
  const X = x => L + (x - o.xr[0]) / (o.xr[1] - o.xr[0]) * (W - L - R);
  const Y = y => H - B - (y - o.yr[0]) / (o.yr[1] - o.yr[0]) * (H - B - T);
  const Y2 = o.y2 ? (y => H - B - (y - o.y2.r[0]) / (o.y2.r[1] - o.y2.r[0]) * (H - B - T)) : Y;
  let s = `<rect x="${L}" y="${T}" width="${W - L - R}" height="${H - B - T}" class="w-pn" stroke="var(--line)"/>`;
  (o.yt || []).forEach(v => { s += `<line x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="w-ln" stroke-width=".6"/><text x="${L - 4}" y="${(Y(v) + 3).toFixed(1)}" text-anchor="end" class="w-mu" style="font-size:9px">${v}</text>`; });
  (o.xt || []).forEach(v => { s += `<text x="${X(v).toFixed(1)}" y="${H - B + 12}" text-anchor="middle" class="w-mu" style="font-size:9px">${v}</text>`; });
  if (o.y2) o.y2.t.forEach(v => { s += `<text x="${W - R + 4}" y="${(Y2(v) + 3).toFixed(1)}" style="font-size:9px;fill:${o.y2.col}">${v}</text>`; });
  (o.hl || []).forEach(h => { const y = (h.y2 ? Y2 : Y)(h.y).toFixed(1); s += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="${h.col}" stroke-width="1.2" stroke-dasharray="5 4"/>${h.lab ? `<text x="${L + 4}" y="${y - 3}" style="font-size:9px;fill:${h.col};font-weight:700" class="svg-ar">${h.lab}</text>` : ''}`; });
  (o.series || []).forEach(sr => {
    if (!sr.pts.length) return;
    const yf = sr.y2 ? Y2 : Y;
    const d = sr.pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + clamp(yf(p[1]), T - 2, H - B + 2).toFixed(1)).join('');
    s += `<path d="${d}" fill="none" stroke="${sr.col}" stroke-width="${sr.w || 2}"${sr.dash ? ` stroke-dasharray="${sr.dash}"` : ''}${sr.op ? ` opacity="${sr.op}"` : ''} stroke-linejoin="round"/>`;
    if (sr.dot){ const p = sr.pts[sr.pts.length - 1]; s += `<circle cx="${X(p[0]).toFixed(1)}" cy="${yf(p[1]).toFixed(1)}" r="4" fill="${sr.col}"/>`; }
  });
  if (o.xlab) s += `<text x="${W - R}" y="${H - 2}" text-anchor="end" class="w-mu svg-ar" style="font-size:9px">${o.xlab}</text>`;
  if (o.ylab) s += `<text x="4" y="${T + 8}" class="w-mu svg-ar" style="font-size:9px">${o.ylab}</text>`;
  if (o.legend) s += `<text x="${L + 2}" y="${H - 2}" style="font-size:9px" class="svg-ar">${o.legend}</text>`;
  return s;
}
VF.plot = plot;

/* ---------------- device drawings ---------------- */
VF.art = {
  drive(o){
    o = o || {}; const g = U('dv');
    return `<svg viewBox="0 0 120 170" role="img" aria-label="VFD"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46505a"/><stop offset="1" stop-color="#22292f"/></linearGradient></defs>
    <rect x="10" y="4" width="100" height="162" rx="8" fill="url(#${g})" stroke="#11161a"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${18 + i * 14}" y="8" width="8" height="10" rx="2" fill="#2a3238"/>`).join('')}
    <rect x="20" y="26" width="80" height="30" rx="4" fill="#06130b" stroke="#000"/><text x="96" y="46" text-anchor="end" style="font:700 12px var(--font-mono);fill:#4dff88">${esc(o.disp || '50.00')}</text><text x="26" y="36" style="font:600 6px var(--font-mono);fill:#4dff88">Hz</text>
    <circle cx="36" cy="72" r="6" fill="#2b7a3d" stroke="#0d2a14"/><circle cx="84" cy="72" r="6" fill="#c0352b" stroke="#3a0d0a"/><rect x="50" y="66" width="20" height="12" rx="3" fill="#5a646c"/>
    <circle cx="60" cy="96" r="10" fill="#2a3238" stroke="#7d8890"/><path d="M60 96L60 88" stroke="#c9d1d6" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="18" y="118" width="84" height="40" rx="4" fill="#1a1f23"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${22 + i * 13.5}" y="124" width="10" height="12" rx="1.5" fill="#9aa4ac"/>`).join('')}${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${22 + i * 10}" y="142" width="7" height="9" rx="1" fill="#6f7a82"/>`).join('')}
    <text x="60" y="114" text-anchor="middle" style="font:700 7px var(--font-mono);fill:#c9d1d6">VFD</text></svg>`;
  },
  motor(o){
    o = o || {}; const g = U('mt');
    return `<svg viewBox="0 0 180 120" role="img" aria-label="3-phase motor"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5c8fc4"/><stop offset=".5" stop-color="#2c5f96"/><stop offset="1" stop-color="#1c3f66"/></linearGradient></defs>
    <rect x="34" y="24" width="104" height="70" rx="10" fill="url(#${g})" stroke="#13304f"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<line x1="${44 + i * 14}" y1="26" x2="${44 + i * 14}" y2="92" stroke="#1c3f66" stroke-width="2.4" opacity=".6"/>`).join('')}
    <rect x="70" y="10" width="34" height="16" rx="3" fill="#2c5f96" stroke="#13304f"/><rect x="20" y="40" width="16" height="38" rx="4" fill="#2c5f96" stroke="#13304f"/>
    <rect x="138" y="52" width="34" height="12" rx="3" fill="#b9c1c7" stroke="#5d6469"/><rect x="40" y="94" width="20" height="14" fill="#1c3f66"/><rect x="112" y="94" width="20" height="14" fill="#1c3f66"/><rect x="30" y="106" width="112" height="6" rx="2" fill="#1c3f66"/>
    <rect x="76" y="56" width="22" height="14" rx="2" fill="#e9edef" stroke="#5d6469"/><text x="87" y="66" text-anchor="middle" style="font:700 6px var(--font-mono);fill:#152027">3~</text></svg>`;
  },
  resistor(){
    return `<svg viewBox="0 0 120 120" role="img" aria-label="Braking resistor"><rect x="10" y="30" width="100" height="56" rx="6" fill="#8a949b" stroke="#4a535a"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${18 + i * 11.5}" y="36" width="6" height="44" rx="2" fill="#5d6469"/>`).join('')}<path d="M30 30V14M90 30V14" stroke="#c0352b" stroke-width="3"/><text x="60" y="104" text-anchor="middle" style="font:700 9px var(--font-mono)" class="w-tx">BR</text></svg>`;
  }
};

/* ---------------- motor fan (rotating) used in several widgets ---------------- */
function fanSVG(cls, x, y, r){
  return `<g transform="translate(${x} ${y})"><circle r="${r}" fill="var(--panel)" stroke="var(--ink)" stroke-width="1.6"/><g class="${cls}">${[0, 120, 240].map(a => `<path d="M0 0L${(r * 0.85).toFixed(1)} -${(r * 0.25).toFixed(1)}A${(r * 0.3).toFixed(1)} ${(r * 0.3).toFixed(1)} 0 0 1 ${(r * 0.85).toFixed(1)} ${(r * 0.25).toFixed(1)}z" fill="var(--accent)" opacity=".85" transform="rotate(${a})"/>`).join('')}<circle r="${(r * 0.18).toFixed(1)}" fill="var(--ink)"/></g></g>`;
}

/* ======================================================================
   L1: starting methods
   ====================================================================== */
const START = {
  dol:{n:'Direct on line (DOL)', short:'DOL', fn(t){ const s = 1 - Math.exp(-t / 0.28); return {s, i:1 + 5.6 * Math.max(0, 1 - Math.pow(s / 0.975, 10))}; }, shock:'Very high: a torque kick on belts and gearbox', ctl:'No'},
  yd:{n:'Star / delta', short:'Y/Δ', fn(t){
    if (t < 2.5){ const s = 0.78 * (1 - Math.exp(-t / 0.5)); return {s, i:1 + 1.25 * Math.max(0, 1 - Math.pow(s / 0.78, 10))}; }
    if (t < 2.56) return {s:0.775, i:0};
    const s = 1 - 0.225 * Math.exp(-(t - 2.56) / 0.18); return {s, i:1 + 3.6 * Math.exp(-(t - 2.56) / 0.12)}; }, shock:'Medium, with a current and torque jump at changeover', ctl:'No'},
  ss:{n:'Soft starter', short:'Soft', fn(t){ const T = 3.2; if (t >= T) return {s:1, i:1}; const s = 0.5 * (1 - Math.cos(Math.PI * t / T)), v = Math.min(1, 0.35 + 0.65 * t / T); return {s, i:Math.min(3.5, 1 + 3.2 * v * (1 - Math.pow(s, 6)))}; }, shock:'Low', ctl:'No (soft start and stop only)'},
  vfd:{n:'VFD', short:'VFD', fn(t){ const T = 3; return t < T ? {s:t / T, i:Math.min(1.35, 0.4 + t * 6)} : {s:1, i:1}; }, shock:'Almost none', ctl:'Yes, from 0 to any speed'}
};
VF.START = START;
VF.startCompare = function(host, opt){
  opt = opt || {};
  const IN = 28; /* 15 kW motor ≈ 28 A */
  const S = {m:'dol', t:-1, tried:{}, hist:{}};
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg viewBox="0 0 360 190" class="sc-g" role="img" aria-label="Current and speed during starting"></svg></div>
   <div class="side"><div class="wd-art"><svg viewBox="0 0 200 90" role="img" aria-label="Rotating motor">${fanSVG('sc-fan', 45, 45, 36)}<text x="95" y="30" class="w-mu svg-ar" style="font-size:10px">Speed</text><text x="95" y="52" class="sc-sp w-tx" style="font:700 18px var(--font-mono)">0 %</text><text x="95" y="76" class="sc-i" style="font:700 13px var(--font-mono);fill:var(--bad)">0 A</text></svg></div>
   <div class="read sm"><div><span>Peak current</span><b class="sc-pk">—</b></div><div><span>Mechanical shock</span><b class="sc-sh" style="font:600 .85rem var(--font-body);direction:ltr">—</b></div></div></div></div>
   <div class="tabs sc-tabs" role="group" aria-label="Starting method">${Object.keys(START).map(k => `<button type="button" class="btn" data-m="${k}" aria-pressed="${k === 'dol'}">${START[k].n}</button>`).join('')}</div>
   <div class="wd-ctl"><button type="button" class="btn pri sc-go">Start the motor ▶</button></div>
   <p class="msg sc-msg" aria-live="polite">Pick a method and press “Start”. The motor here is <span class="eq">15 kW</span> with a rated current of <span class="eq">${IN} A</span>.</p>
   <p class="chal sc-chal">Challenge: start the motor with all <b>4 methods</b> and compare the current curves.</p>`;
  const q = s => $(s, host), fin = chal(host, '.sc-chal', opt.lesson, opt.task || 'start');
  onAct(q('.sc-tabs'), '[data-m]', b => { if (S.t >= 0 && S.t < 6) return; S.m = b.dataset.m; $$('[data-m]', host).forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); });
  q('.sc-go').addEventListener('click', () => { S.t = 0; S.hist[S.m] = []; S.pk = 0; q('.sc-go').disabled = true; });
  let ang = 0;
  function draw(){
    const series = [];
    Object.keys(S.hist).forEach(k => { if (k !== S.m && S.hist[k].length) series.push({pts:S.hist[k].map(p => [p[0], p[2]]), col:'var(--muted)', w:1.2, op:.55}); });
    const h = S.hist[S.m] || [];
    series.push({pts:h.map(p => [p[0], p[1] * 100]), col:'var(--cur)', w:2, dash:'5 3', y2:false, sp:true});
    series.push({pts:h.map(p => [p[0], p[2]]), col:'var(--bad)', w:2.4});
    /* speed uses its own scale 0..100 → map to 0..7 */
    series[series.length - 2].pts = h.map(p => [p[0], p[1] * 7]);
    q('.sc-g').innerHTML = plot({W:360, H:190, xr:[0, 6], yr:[0, 7], xt:[0, 1, 2, 3, 4, 5, 6], yt:[0, 1, 2, 3, 4, 5, 6, 7], y2:{r:[0, 100], t:[0, 50, 100], col:'var(--cur)'}, series, xlab:'Time (s)', ylab:'× rated current', legend:`<tspan fill="var(--bad)">━ Current</tspan>  <tspan fill="var(--cur)">┅ Speed %</tspan>  <tspan fill="var(--muted)">━ Methods tried</tspan>`});
  }
  function frame(dt){
    if (S.t >= 0 && S.t < 6){
      S.t = Math.min(6, S.t + dt * 1.2);
      const r = START[S.m].fn(S.t); S.hist[S.m].push([S.t, r.s, r.i]); S.pk = Math.max(S.pk, r.i); S.cur = r;
      if (S.t >= 6){
        q('.sc-go').disabled = false; S.tried[S.m] = 1;
        q('.sc-pk').textContent = fmt(S.pk, 1) + '× ≈ ' + Math.round(S.pk * IN) + ' A'; q('.sc-sh').textContent = START[S.m].shock;
        const n = Object.keys(S.tried).length;
        msg(`${START[S.m].n}: peak current <b class="eq">${Math.round(S.pk * IN)} A</b> (${fmt(S.pk, 1)} × rated). Speed control: <b>${START[S.m].ctl}</b>. ${n < 4 ? `Tried ${n} of 4.` : ''}`, n >= 4 ? 'ok' : '');
        if (n >= 4){ fin(); msg('See the difference? DOL pulls about <b>6 times</b> the current, star/delta about a third but with a jump, the soft starter limits the current, and the VFD starts near rated current <b>and also controls the speed</b>.', 'ok'); }
      }
      draw();
    }
    const sp = S.cur && S.t >= 0 ? S.cur.s : 0;
    if (!reduced()){ ang = (ang + sp * dt * 900) % 360; q('.sc-fan').setAttribute('transform', `rotate(${ang.toFixed(1)})`); }
    q('.sc-sp').textContent = Math.round(sp * 100) + ' %'; q('.sc-i').textContent = S.cur && S.t >= 0 ? Math.round(S.cur.i * IN) + ' A' : '0 A';
  }
  const msg = (t, c) => { const m = q('.sc-msg'); m.className = 'msg sc-msg ' + (c || ''); m.innerHTML = t; };
  draw(); animate(host, frame);
  return {S, run(m){ S.m = m; S.t = 0; S.hist[m] = []; S.pk = 0; for (let k = 0; k < 400 && S.t < 6; k++) frame(0.05); }};
};

/* L1: pump / fan energy (affinity laws) */
VF.fanSaver = function(host, opt){
  opt = opt || {};
  const KW = 30, H = 6000;
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg viewBox="0 0 360 170" class="fs-g" role="img" aria-label="Power versus flow"></svg></div>
   <div class="side"><div class="fs-bars"></div><div class="read sm"><div><span>Savings per year</span><b class="fs-sv">—</b></div><div><span>VFD power</span><b class="fs-pv">—</b></div></div></div></div>
   <div class="wd-ctl"><label>Required flow (pump speed with the VFD): <b class="fs-qv"></b><input type="range" class="fs-q" min="40" max="100" step="1" value="100" aria-label="Required flow %"></label></div>
   <p class="msg fs-msg" aria-live="polite"></p>
   <p class="chal fs-chal">Challenge: find the speed where the VFD power is about <b>half</b> of full power.</p>`;
  const q = s => $(s, host), fin = chal(host, '.fs-chal', opt.lesson, opt.task || 'fan'), sl = q('.fs-q');
  const pVfd = Q => 100 * Math.pow(Q, 3) / 0.97, pVal = Q => 45 + 55 * Q;
  function ui(){
    const Q = +sl.value / 100, a = pVal(Q), b = pVfd(Q);
    q('.fs-qv').textContent = Math.round(Q * 100) + ' %';
    const curve = (f, col, dash) => ({pts:Array.from({length:61}, (_, i) => { const x = 0.4 + i * 0.01; return [x * 100, f(x)]; }), col, w:2, dash});
    q('.fs-g').innerHTML = plot({W:360, H:170, xr:[40, 100], yr:[0, 110], xt:[40, 50, 60, 70, 80, 90, 100], yt:[0, 25, 50, 75, 100], series:[curve(pVal, 'var(--bad)'), curve(pVfd, 'var(--good)'), {pts:[[Q * 100, a]], col:'var(--bad)', dot:true}, {pts:[[Q * 100, b]], col:'var(--good)', dot:true}], xlab:'Flow / speed %', ylab:'Power %', legend:'<tspan fill="var(--bad)">━ Valve (fixed speed)</tspan>  <tspan fill="var(--good)">━ VFD</tspan>'});
    const bar = (lab, p, col) => `<div class="fs-bar"><span>${lab}</span><i style="width:${Math.min(100, p)}%;background:${col}"></i><b class="eq">${fmt(p * KW / 100, 1)} kW</b></div>`;
    q('.fs-bars').innerHTML = bar('Valve', a, 'var(--bad)') + bar('VFD', b, 'var(--good)');
    const save = (a - b) / 100 * KW * H;
    q('.fs-sv').textContent = save > 0 ? Math.round(save).toLocaleString('en-US') + ' kWh' : '0';
    q('.fs-pv').textContent = Math.round(b) + ' %';
    const m = q('.fs-msg');
    if (b >= 46 && b <= 54 && Q < 0.95){ m.className = 'msg fs-msg ok'; m.innerHTML = `Exactly! At <b class="eq">${Math.round(Q * 100)} %</b> speed the power is about <b>half</b>. That is because power in pumps and fans follows the <b>cube</b> of speed: <span class="eq">0.8³ ≈ 0.51</span>.`; fin(); }
    else { m.className = 'msg fs-msg'; m.innerHTML = `A <span class="eq">${KW} kW</span> pump running <span class="eq">${H}</span> hours a year. When you cut the flow with a valve, the motor stays at full speed and uses almost the same power; with a VFD you lower the speed itself.`; }
  }
  sl.addEventListener('input', ui); ui();
  return {set(v){ sl.value = v; ui(); }};
};
VF.affGen = function(){
  const n = pick([50, 60, 70, 80, 90]), kind = pick(['p', 'p', 'q', 'h']);
  if (kind === 'q') return {q:`A pump runs on a VFD. If we lower the speed to <b class="eq">${n} %</b>, what will the flow be, roughly, in %?`, input:true, unit:'%', check:v => Math.abs(v - n) <= 1, ans:n + ' %', why:'Flow is directly proportional to speed.'};
  if (kind === 'h'){ const h = Math.pow(n / 100, 2) * 100; return {q:`A fan runs at <b class="eq">${n} %</b> of its speed. What pressure will it make, roughly, in %?`, input:true, unit:'%', check:v => Math.abs(v - h) <= 2, ans:fmt(h, 0) + ' %', why:`Pressure follows the square of speed: <span class="eq">${n / 100}² × 100 ≈ ${fmt(h, 0)} %</span>.`}; }
  const p = Math.pow(n / 100, 3) * 100;
  return {q:`A centrifugal pump runs at <b class="eq">${n} %</b> of its speed. What will the power be, roughly, as a % of full power?`, input:true, unit:'%', check:v => Math.abs(v - p) <= Math.max(2, p * 0.06), ans:fmt(p, 0) + ' %', why:`Power follows the cube of speed: <span class="eq">${n / 100}³ × 100 ≈ ${fmt(p, 0)} %</span>.`};
};

/* ======================================================================
   L2: inside the drive
   ====================================================================== */
VF.BLOCKS = {
  rect:{t:'1. Rectifier', d:'6 diodes (or 4 on single phase) turn the AC from the supply into DC. A diode passes current in one direction only, so the result is positive humps with ripple. <b>The input here is R S T (or L1 L2 L3)</b>.'},
  bus:{t:'2. The DC bus (capacitors)', d:'Large capacitors store energy and smooth the ripple, so we get an almost steady DC. Its voltage is about <b class="eq">1.35 × supply voltage</b> on three phase (<span class="eq">400V → ≈ 540V</span>). <b>These capacitors stay charged for minutes after you switch off the power</b>, and that is the most dangerous thing in a VFD.'},
  chop:{t:'3. Chopper and braking resistor', d:'When the motor brakes fast it sends energy back to the DC bus and the voltage rises. The chopper (a transistor) switches onto the braking resistor and burns the extra energy as heat. Not every drive has a built-in chopper, and its terminals are usually called <span class="eq">BR+ / BR−</span>, <span class="eq">B1 / B2</span> or <span class="eq">PA / PB</span> depending on the brand.'},
  igbt:{t:'4. The inverter (6 IGBTs)', d:'6 very fast electronic switches (IGBTs) turn on and off thousands of times a second (<b>PWM</b>), making an AC-like voltage from the DC <b>at the frequency and voltage we want</b>. The output here is <b>U V W</b> (or T1 T2 T3) and goes to the motor.'},
  ctrl:{t:'5. Control board', d:'The brain: it reads the keypad and terminals (Start, Stop, speed), works out when each IGBT switches, and measures current, voltage and temperature all the time to protect itself and the motor, and shows a fault code if something is wrong.'}
};
VF.SUPPLY = [{k:'1x230', n:'Single phase 230V', v:230, ph:1}, {k:'3x400', n:'3 phase 400V', v:400, ph:3}, {k:'3x480', n:'3 phase 480V', v:480, ph:3}];
VF.dcBus = (v, ph) => ph === 1 ? v * Math.SQRT2 : v * 1.35;
VF.inside = function(host, opt){
  opt = opt || {};
  const S = {sup:VF.SUPPLY[1], seen:{}, sel:null, ph:0};
  const B = (k, x, y, w, h, body) => `<g class="ins-b" data-blk="${k}" tabindex="0" role="button" aria-label="${esc(VF.BLOCKS[k].t)}"><rect class="ins-r" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>${body}</g>`;
  const diode = (x, y) => `<path d="M${x - 5} ${y + 4}L${x + 5} ${y + 4}L${x} ${y - 4}z" class="w-ac"/><path d="M${x - 5} ${y - 4}H${x + 5}M${x} ${y - 10}V${y + 10}" class="w-in" stroke-width="1.4"/>`;
  const sw = (x, y, i) => `<rect x="${x - 6}" y="${y - 7}" width="12" height="14" rx="2" class="ins-sw" data-sw="${i}"/><path d="M${x} ${y - 12}V${y - 7}M${x} ${y + 7}V${y + 12}" class="w-in" stroke-width="1.4"/>`;
  host.innerHTML = `<div class="wd-art"><svg viewBox="0 0 420 250" role="img" aria-label="Inside the drive: rectifier, DC bus, IGBT inverter and the motor">
    <text x="22" y="40" class="w-tx" style="font:700 10px var(--font-mono)">R S T</text>
    <path d="M10 70H62M10 90H62M10 110H62" class="ins-ac" stroke-width="3"/>
    ${B('rect', 62, 46, 78, 88, `${[0, 1, 2].map(i => diode(80 + i * 22, 72) + diode(80 + i * 22, 112)).join('')}<text x="101" y="128" text-anchor="middle" class="svg-ar w-tx" style="font-size:10px;font-weight:700">Rectifier</text>`)}
    <path d="M140 64H170M140 120H170" class="flow ins-dc" stroke-width="3" stroke-dasharray="8 6"/>
    ${B('bus', 170, 46, 70, 88, `<path d="M190 64V82M190 98V120M182 82H198M182 98H198" class="w-in" stroke-width="2"/><path d="M216 64V82M216 98V120M208 82H224M208 98H224" class="w-in" stroke-width="2"/><path d="M170 64H240M170 120H240" class="w-in" stroke-width="1.6"/><text x="176" y="60" style="font:700 9px var(--font-mono);fill:var(--bad)">DC+</text><text x="176" y="131" style="font:700 9px var(--font-mono);fill:var(--cold)">DC−</text>`)}
    ${B('chop', 246, 8, 66, 34, `<text x="279" y="22" text-anchor="middle" class="svg-ar w-tx" style="font-size:9px;font-weight:700">Chopper + brake</text><rect x="262" y="27" width="34" height="8" rx="2" class="ins-res"/>`)}
    <path d="M250 42V64M296 42V64" class="w-in" stroke-width="1.2" stroke-dasharray="3 3"/>
    <path d="M240 64H252M240 120H252" class="flow ins-dc" stroke-width="3" stroke-dasharray="8 6"/>
    ${B('igbt', 252, 46, 96, 88, `${[0, 1, 2].map(i => sw(270 + i * 30, 76, i) + sw(270 + i * 30, 108, i + 3)).join('')}<path d="M252 64H348M252 120H348" class="w-in" stroke-width="1.2"/><text x="300" y="131" text-anchor="middle" class="w-tx" style="font:700 9px var(--font-mono)">IGBT</text>`)}
    <path d="M348 78H372M348 92H372M348 106H372" class="ins-out flow" stroke-width="3" stroke-dasharray="4 3"/>
    <text x="352" y="72" class="w-tx" style="font:700 8px var(--font-mono)">U V W</text>
    ${fanSVG('ins-fan', 392, 92, 22)}
    ${B('ctrl', 120, 150, 200, 30, `<text x="220" y="169" text-anchor="middle" class="svg-ar w-tx" style="font-size:10px;font-weight:700">Control board (the brain)</text>`)}
    <path d="M300 150V134" class="w-acs" stroke-width="1.4" stroke-dasharray="3 3"/><path d="M200 150V134" class="w-acs" stroke-width="1.4" stroke-dasharray="3 3"/>
    <g transform="translate(0 190)"><text x="36" y="10" text-anchor="middle" class="svg-ar w-mu" style="font-size:9px">AC in</text><path class="ins-w1" fill="none" stroke-width="1.5"/>
      <text x="155" y="10" text-anchor="middle" class="svg-ar w-mu" style="font-size:9px">After rectifier</text><path class="ins-w2" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
      <text x="275" y="10" text-anchor="middle" class="svg-ar w-mu" style="font-size:9px">DC bus</text><path class="ins-w3" fill="none" stroke="var(--bad)" stroke-width="2"/>
      <text x="385" y="10" text-anchor="middle" class="svg-ar w-mu" style="font-size:9px">PWM out</text><path class="ins-w4" fill="none" stroke="var(--cur)" stroke-width="1"/><path class="ins-w5" fill="none" stroke="var(--accent)" stroke-width="2"/></g>
  </svg></div>
  <div class="tabs ins-sup" role="group" aria-label="Supply voltage">${VF.SUPPLY.map(s => `<button type="button" class="btn" data-sup="${s.k}" aria-pressed="${s.k === '3x400'}">${s.n}</button>`).join('')}</div>
  <div class="read"><div><span>Supply voltage</span><b class="ins-vin"></b></div><div><span>DC bus voltage</span><b class="ins-vdc"></b></div><div><span>Motor output</span><b>0 – ${'V'} · 0 – 60 Hz</b></div></div>
  <div class="ins-info box" aria-live="polite">Tap any part of the drawing to see what it does.</div>
  <p class="chal ins-chal">Challenge: open <b>all 5 parts</b> and read what each one does.</p>`;
  const q = s => $(s, host), fin = chal(host, '.ins-chal', opt.lesson, opt.task || 'parts');
  onAct(host, '[data-blk]', b => { const k = b.dataset.blk; S.sel = k; S.seen[k] = 1; $$('[data-blk]', host).forEach(x => x.classList.toggle('on', x === b)); q('.ins-info').innerHTML = `<b>${VF.BLOCKS[k].t}</b><br>${VF.BLOCKS[k].d}`; if (Object.keys(S.seen).length >= 5) fin(); });
  onAct(q('.ins-sup'), '[data-sup]', b => { S.sup = VF.SUPPLY.find(s => s.k === b.dataset.sup); $$('[data-sup]', host).forEach(x => x.setAttribute('aria-pressed', String(x === b))); ui(); });
  function wave(fn, x0, w, y0, h, n){ let d = ''; for (let i = 0; i <= n; i++){ const t = i / n; d += (i ? 'L' : 'M') + (x0 + t * w).toFixed(1) + ' ' + (y0 - fn(t) * h).toFixed(1); } return d; }
  function ui(){
    const s = S.sup, vdc = VF.dcBus(s.v, s.ph);
    q('.ins-vin').textContent = s.v + ' V ' + (s.ph === 1 ? '1~' : '3~'); q('.ins-vdc').textContent = '≈ ' + Math.round(vdc) + ' V DC';
    host.querySelector('.read div:nth-child(3) b').textContent = '0 – ' + (s.ph === 1 ? 230 : s.v) + ' V · 0 – 60 Hz';
    $$('.ins-ac', host).forEach((p, i) => { p.style.display = s.ph === 1 && i === 2 ? 'none' : ''; });
  }
  function frame(dt){
    S.ph += dt * 0.6; const p = S.ph, s = S.sup;
    const ac = s.ph === 1 ? (t => Math.sin(2 * Math.PI * (t * 2 + p))) : null;
    q('.ins-w1').setAttribute('d', s.ph === 1 ? wave(ac, 6, 60, 34, 14, 60) : [0, 1, 2].map(k => wave(t => Math.sin(2 * Math.PI * (t * 2 + p) - k * 2.094), 6, 60, 34, 14, 60)).join(''));
    q('.ins-w1').setAttribute('stroke', 'var(--muted)');
    const rec = s.ph === 1 ? (t => Math.abs(Math.sin(2 * Math.PI * (t * 2 + p)))) : (t => Math.max(...[0, 1, 2].map(k => Math.abs(Math.sin(2 * Math.PI * (t * 2 + p) - k * 2.094)))));
    q('.ins-w2').setAttribute('d', wave(rec, 125, 60, 40, 22, 90));
    q('.ins-w3').setAttribute('d', wave(t => 0.92 + 0.03 * Math.sin(2 * Math.PI * (t * 12 + p * 6)), 245, 60, 40, 22, 30));
    const ref = t => 0.85 * Math.sin(2 * Math.PI * (t + p * 0.5));
    let d = ''; const n = 240; for (let i = 0; i <= n; i++){ const t = i / n, tri = Math.abs(((t * 24) % 1) * 4 - 2) - 1, v = ref(t) > tri ? 1 : -1; d += (i ? 'L' : 'M') + (355 + t * 60).toFixed(1) + ' ' + (28 - v * 10).toFixed(1); }
    q('.ins-w4').setAttribute('d', d); q('.ins-w5').setAttribute('d', wave(ref, 355, 60, 28, 11, 40));
    $$('.ins-sw', host).forEach((r, i) => { const t = (p * 3) % 1, ph = (i % 3) * 0.333, on = Math.sin(2 * Math.PI * (t + ph)) > 0; r.classList.toggle('on', i < 3 ? on : !on); });
    if (!reduced()) q('.ins-fan').setAttribute('transform', `rotate(${(p * 360 % 360).toFixed(1)})`);
  }
  ui(); frame(0); if (!reduced()) animate(host, frame);
  return {S, open(k){ const b = host.querySelector(`[data-blk="${k}"]`); if (b) b.dispatchEvent(new MouseEvent('click', {bubbles:true})); }};
};
VF.busGen = function(){
  const r = Math.random();
  if (r < 0.35){ const v = pick([380, 400, 415, 440, 460, 480]); const dc = v * 1.35; return {q:`A 3-phase drive on a <b class="eq">${v} V</b> supply. Roughly what is the DC bus voltage?`, input:true, unit:'V DC', check:x => Math.abs(x - dc) <= dc * 0.04, ans:Math.round(dc) + ' V', why:`<span class="eq">${v} × 1.35 ≈ ${Math.round(dc)} V</span>.`}; }
  if (r < 0.55){ const v = pick([220, 230, 240]); const dc = v * Math.SQRT2; return {q:`A single-phase drive on <b class="eq">${v} V</b>. Roughly what is the DC bus voltage with no load?`, input:true, unit:'V DC', check:x => Math.abs(x - dc) <= dc * 0.05, ans:Math.round(dc) + ' V', why:`On single phase the capacitor charges to the peak of the wave: <span class="eq">${v} × 1.41 ≈ ${Math.round(dc)} V</span>.`}; }
  if (r < 0.8){ const v = pick([380, 400, 415]); const dc = Math.round(v * 1.35); const low = Math.round(dc * 0.7); return {q:`A 3-phase drive on <b class="eq">${v} V</b>; the DC bus should be about <span class="eq">${dc} V</span>. Suddenly you find it at <b class="eq">${low} V</b>. Which fault will the drive most likely show?`, o:['Undervoltage (UV)', 'Overvoltage (OV)', 'Overcurrent (OC)', 'Ground fault'], a:0, why:'The DC bus dropped below the limit = the supply sagged or a phase was lost ⇒ UV.'}; }
  const v = pick([400, 480]); const dc = Math.round(v * 1.35);
  return {q:`A <b class="eq">${v} V</b> drive is stopping a heavy load fast, and the DC bus rose from <span class="eq">${dc} V</span> to <b class="eq">${Math.round(dc * 1.45)} V</b>. What causes this?`, o:['The motor sends energy back while braking (regeneration)', 'The supply voltage dropped', 'The cable is long', 'The motor is hot'], a:0, why:'While braking, the motor works as a generator and charges the capacitors ⇒ OV if there is no braking resistor.'};
};

/* ======================================================================
   L3: PWM and V/f
   ====================================================================== */
VF.vf = (f, o) => { o = o || {}; const vn = o.vn || 400, fn = o.fn || 50, boost = o.boost || 0; if (f <= 0) return 0; if (f >= fn) return vn; return Math.min(vn, vn * boost / 100 + (vn - vn * boost / 100) * f / fn); };
VF.pwm = function(host, opt){
  opt = opt || {};
  const S = {f:50, fc:4, boost:0, saw25:false, saw60:false};
  host.innerHTML = `<div class="wd-art"><svg viewBox="0 0 360 250" class="pw-g" role="img" aria-label="Carrier and reference, PWM pulses and the resulting current"></svg></div>
  <div class="sim-grid two-col"><div class="wd-ctl"><label>Output frequency: <b class="pw-fv"></b><input type="range" class="pw-f" min="0" max="60" step="0.5" value="50" aria-label="Output frequency Hz"></label>
    <label>Boost at low speed: <b class="pw-bv"></b><input type="range" class="pw-b" min="0" max="10" step="1" value="0" aria-label="Boost %"></label>
    <span class="muted" style="font-size:.88rem">Carrier frequency:</span><div class="tabs pw-fc" role="group" aria-label="Carrier frequency">${[2, 4, 8, 16].map(k => `<button type="button" class="btn" data-fc="${k}" aria-pressed="${k === 4}">${k} kHz</button>`).join('')}</div></div>
   <div class="wd-art"><svg viewBox="0 0 220 150" class="pw-vf" role="img" aria-label="V/f curve"></svg></div></div>
  <div class="read"><div><span>Motor voltage</span><b class="pw-v"></b></div><div><span>V/f</span><b class="pw-r"></b></div><div><span>Speed (4-pole motor)</span><b class="pw-n"></b></div><div><span>Available torque</span><b class="pw-t"></b></div></div>
  <p class="msg pw-msg" aria-live="polite"></p>
  <p class="chal pw-chal">Challenge: set the output to <b class="eq">25 Hz</b> and see what the voltage is, then take it above <b class="eq">55 Hz</b> and see what the voltage does.</p>`;
  const q = s => $(s, host), fin = chal(host, '.pw-chal', opt.lesson, opt.task || 'pwm');
  q('.pw-f').addEventListener('input', e => { S.f = +e.target.value; ui(); });
  q('.pw-b').addEventListener('input', e => { S.boost = +e.target.value; ui(); });
  onAct(q('.pw-fc'), '[data-fc]', b => { S.fc = +b.dataset.fc; $$('[data-fc]', host).forEach(x => x.setAttribute('aria-pressed', String(x === b))); ui(); });
  function ui(){
    const f = S.f, V = VF.vf(f, {boost:S.boost}), m = V / 400, ncar = {2:10, 4:16, 8:26, 16:40}[S.fc];
    const X0 = 34, X1 = 352, N = 900;
    let tri = '', ref = '', pw = '', cur = '', i = 0, ip = [], refs = [];
    const cyc = f > 0 ? 1 : 0;
    for (let k = 0; k <= N; k++){
      const t = k / N, x = (X0 + t * (X1 - X0)).toFixed(1);
      const tr = Math.abs(((t * ncar) % 1) * 4 - 2) - 1, r = cyc ? m * Math.sin(2 * Math.PI * t) : 0, v = r > tr ? 1 : -1;
      tri += (k ? 'L' : 'M') + x + ' ' + (45 - tr * 30).toFixed(1); ref += (k ? 'L' : 'M') + x + ' ' + (45 - r * 30).toFixed(1);
      pw += (k ? 'L' : 'M') + x + ' ' + (120 - v * 22).toFixed(1);
      i += (v - r) * 0.9 / ncar * 6; i *= 0.995; ip.push(i); refs.push(r);
    }
    const avg = ip.reduce((a, b) => a + b, 0) / ip.length;
    ip.forEach((v, k) => { const x = (X0 + k / N * (X1 - X0)).toFixed(1); cur += (k ? 'L' : 'M') + x + ' ' + (205 - (refs[k] + (v - avg) * 0.6) * 32).toFixed(1); });
    const lab = (y, t) => `<text x="${X0 - 4}" y="${y}" text-anchor="end" class="w-mu" style="font:600 8px var(--font-mono)">${t}</text>`;
    q('.pw-g').innerHTML = `<rect x="${X0}" y="12" width="${X1 - X0}" height="66" class="w-pn" stroke="var(--line)"/><rect x="${X0}" y="92" width="${X1 - X0}" height="56" class="w-pn" stroke="var(--line)"/><rect x="${X0}" y="164" width="${X1 - X0}" height="80" class="w-pn" stroke="var(--line)"/>
      <path d="${tri}" fill="none" stroke="var(--muted)" stroke-width=".8"/><path d="${ref}" fill="none" stroke="var(--accent)" stroke-width="2.2"/>
      <path d="${pw}" fill="none" stroke="var(--cur)" stroke-width="1"/><path d="${cur}" fill="none" stroke="var(--bad)" stroke-width="2"/>
      ${lab(24, 'REF')}${lab(36, 'CAR')}${lab(110, 'PWM')}${lab(180, 'I')}
      <text x="${X1 - 4}" y="24" text-anchor="end" class="svg-ar w-mu" style="font-size:9px">Reference (orange) and carrier (grey)</text>
      <text x="${X1 - 4}" y="104" text-anchor="end" class="svg-ar w-mu" style="font-size:9px">Voltage pulses at the motor (DC bus ±)</text>
      <text x="${X1 - 4}" y="176" text-anchor="end" class="svg-ar w-mu" style="font-size:9px">Motor current: almost a sine</text>
      <text x="${(X0 + X1) / 2}" y="248" text-anchor="middle" class="svg-ar w-mu" style="font-size:8px">${f > 0 ? 'One electrical cycle · ' : ''}Simplified: real pulses are far more frequent</text>`;
    const pts = [[0, VF.vf(0.01, {boost:S.boost})], [50, 400], [60, 400]];
    q('.pw-vf').innerHTML = plot({W:220, H:150, xr:[0, 60], yr:[0, 450], xt:[0, 25, 50, 60], yt:[0, 200, 400], series:[{pts, col:'var(--accent)', w:2}, {pts:[[f, V]], col:'var(--bad)', dot:true}], hl:[{y:400, col:'var(--muted)'}], xlab:'Hz', ylab:'V'});
    q('.pw-fv').textContent = fmt(f, 1) + ' Hz'; q('.pw-bv').textContent = S.boost + ' %';
    q('.pw-v').textContent = Math.round(V) + ' V'; q('.pw-r').textContent = f > 0 ? fmt(V / f, 1) + ' V/Hz' : '—';
    q('.pw-n').textContent = Math.round(f * 30) + ' rpm'; const tq = f <= 50 ? 100 : 100 * 50 / f; q('.pw-t').textContent = Math.round(tq) + ' %';
    if (Math.abs(f - 25) < 0.3) S.saw25 = true; if (f >= 55) S.saw60 = true;
    const m2 = q('.pw-msg'); let t = '';
    if (f === 0) t = 'Output is zero: the IGBTs are not switching and the motor is stopped.';
    else if (f > 50) t = `Above <span class="eq">50 Hz</span> the voltage <b>does not rise</b> above <span class="eq">400 V</span> (the motor's rated voltage), so V/f drops and the flux weakens (<b>field weakening</b>): speed goes up but torque goes down.`;
    else if (f < 10 && S.boost === 0) t = 'At very low speed the voltage is small and the resistance of the motor windings eats part of it, so torque gets weak. <b>Boost</b> adds a little voltage at the start so the motor can pick up the load.';
    else t = `Constant ratio: <span class="eq">400 V ÷ 50 Hz = 8 V/Hz</span>. At <span class="eq">${fmt(f, 1)} Hz</span> the voltage is <span class="eq">≈ ${Math.round(V)} V</span>, so the motor flux stays constant and full torque is available.`;
    t += ` Carrier <span class="eq">${S.fc} kHz</span>: ${S.fc <= 2 ? 'loud whine from the motor, but the drive runs cooler.' : S.fc >= 16 ? 'quiet motor and smooth current, but the IGBTs run hotter (derating) and cable noise goes up.' : 'a compromise between noise and heat.'}`;
    if (S.saw25 && S.saw60){ fin(); m2.className = 'msg pw-msg ok'; } else m2.className = 'msg pw-msg';
    m2.innerHTML = t;
  }
  ui();
  return {S, set(f){ q('.pw-f').value = f; S.f = f; ui(); }};
};
VF.vfGen = function(){
  const m = pick([{vn:400, fn:50}, {vn:380, fn:50}, {vn:230, fn:50}, {vn:460, fn:60}]);
  const r = Math.random();
  if (r < 0.65){ const f = pick(m.fn === 60 ? [15, 20, 30, 40, 45] : [10, 15, 20, 25, 30, 35, 40]); const v = m.vn * f / m.fn; return {q:`A <span class="eq">${m.vn} V · ${m.fn} Hz</span> motor on a V/f drive (no boost). At <b class="eq">${f} Hz</b>, roughly how many volts does the drive output?`, input:true, unit:'V', check:x => Math.abs(x - v) <= Math.max(3, v * 0.03), ans:Math.round(v) + ' V', why:`<span class="eq">${m.vn} × ${f} ÷ ${m.fn} ≈ ${Math.round(v)} V</span>.`}; }
  if (r < 0.85){ const f = m.fn + pick([5, 10, 15]); return {q:`The same <span class="eq">${m.vn} V · ${m.fn} Hz</span> motor, now run at <b class="eq">${f} Hz</b>. What is the voltage?`, input:true, unit:'V', check:x => Math.abs(x - m.vn) <= 3, ans:m.vn + ' V', why:'Above rated frequency the voltage stays at the motor rated voltage (field weakening).'}; }
  return {q:`A <span class="eq">${m.vn} V · ${m.fn} Hz</span> motor. What is the V/f ratio?`, input:true, unit:'V/Hz', check:x => Math.abs(x - m.vn / m.fn) <= 0.1, ans:fmt(m.vn / m.fn, 2) + ' V/Hz', why:`<span class="eq">${m.vn} ÷ ${m.fn} = ${fmt(m.vn / m.fn, 2)}</span>.`};
};

/* ======================================================================
   wiring board (L4 power, L5 control)
   cfg: {vb:[w,h], art, terms:[{id, x, y, lab, ly, col, aria}], rules:[{a:[], b:[], all, hint}], danger(a,b) → msg|null, done}
   rules: perm (default) = every a-terminal shares a net with exactly one b-terminal, all different; all = everything in a∪b in one net
   ====================================================================== */
VF.wire = function(host, cfg, opt){
  opt = opt || {};
  const T = {}; cfg.terms.forEach(t => T[t.id] = t);
  const W = []; let pend = null;
  host.innerHTML = `<div class="bn-board"><svg viewBox="0 0 ${cfg.vb[0]} ${cfg.vb[1]}" role="img" aria-label="${esc(cfg.aria || 'Wiring board')}" style="max-width:${cfg.max || 560}px">${cfg.art || ''}<g class="vw-w"></g><g class="vw-t">${cfg.terms.map(t => `<g class="bt" data-t="${t.id}"><circle class="bt-hit" cx="${t.x}" cy="${t.y}" r="13" tabindex="0" role="button" aria-label="${esc(t.aria || t.lab)}"/><circle class="bt-ring" cx="${t.x}" cy="${t.y}" r="10"/><circle class="bt-s" cx="${t.x}" cy="${t.y}" r="6.5"/><path class="bt-x" d="M${t.x - 3} ${t.y - 3}L${t.x + 3} ${t.y + 3}" pointer-events="none"/><text class="bt-lab" x="${t.x}" y="${t.y + (t.ly || -11)}" style="font-size:${cfg.fs || 10}px">${esc(t.lab)}</text></g>`).join('')}</g></svg></div>
  <p class="muted vw-help" style="font-size:.88rem">Tap a terminal, then the other terminal, to run a wire. Tap a wire to remove it.</p>
  <div class="wd-ctl"><button type="button" class="btn pri vw-chk">Check wiring</button><button type="button" class="btn vw-undo">Remove last wire</button><button type="button" class="btn vw-clr">Clear all</button></div>
  <div class="bn-res vw-res" aria-live="polite"></div>
  <p class="chal vw-chal">${opt.goal || 'Wire everything correctly and press “Check wiring”.'}</p>`;
  const q = s => $(s, host), fin = chal(host, '.vw-chal', opt.lesson, opt.task || 'wire'), gw = q('.vw-w');
  const key = (a, b) => [a, b].sort().join('|');
  function nets(extra){
    const p = {}; const f = x => { while (p[x] !== x){ p[x] = p[p[x]]; x = p[x]; } return x; };
    cfg.terms.forEach(t => p[t.id] = t.id); (extra || []).concat(cfg.pre || []).forEach(w => { if (p[w[0]] != null && p[w[1]] != null) p[f(w[0])] = f(w[1]); });
    W.forEach(w => { p[f(w[0])] = f(w[1]); });
    return f;
  }
  VF._lastNets = nets;
  function allowed(a, b){
    return cfg.rules.some(r => { const all = r.a.concat(r.b); if (r.all) return all.includes(a) && all.includes(b); return (r.a.includes(a) && r.b.includes(b)) || (r.a.includes(b) && r.b.includes(a)); });
  }
  function evaluate(){
    const f = nets(), wrong = [], missing = [], shorts = [];
    W.forEach(w => { if (!allowed(w[0], w[1])) wrong.push(w); });
    cfg.rules.forEach(r => {
      if (r.all){ const all = r.a.concat(r.b); if (!all.every(x => f(x) === f(all[0]))) missing.push(r); return; }
      const used = {}; let ok = true;
      r.a.forEach(a => { const hits = r.b.filter(b => f(b) === f(a)); if (hits.length !== 1 || used[hits[0]]) ok = false; else used[hits[0]] = 1; });
      for (let i = 0; i < r.a.length; i++) for (let j = i + 1; j < r.a.length; j++) if (f(r.a[i]) === f(r.a[j])) shorts.push([r.a[i], r.a[j]]);
      if (!ok) missing.push(r);
    });
    return {wrong, missing, shorts, ok:!wrong.length && !missing.length && !shorts.length, f};
  }
  function draw(){
    const ev = evaluate();
    gw.innerHTML = W.map((w, i) => {
      const a = T[w[0]], b = T[w[1]], my = (a.y + b.y) / 2 + (cfg.bend || 0), col = a.col || b.col || '#7a5cc8';
      const d = Math.abs(a.x - b.x) < 2 || Math.abs(a.y - b.y) < 2 ? `M${a.x} ${a.y}L${b.x} ${b.y}` : `M${a.x} ${a.y}C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`;
      return `<g class="bw" data-w="${i}"><path class="bw-o" d="${d}"/><path class="bw-c" d="${d}" stroke="${col}"/><path class="bw-hit" d="${d}" tabindex="0" role="button" aria-label="Wire from ${esc(a.lab)} to ${esc(b.lab)}, tap to remove"/></g>`;
    }).join('');
    $$('.bt', host).forEach(g => g.classList.toggle('pend', g.dataset.t === pend));
    if (opt.onChange) opt.onChange(ev, W.slice());
  }
  function res(html){ q('.vw-res').innerHTML = html; }
  host.addEventListener('click', e => {
    const t = e.target.closest('.bt');
    if (t){
      const id = t.dataset.t;
      if (!pend){ pend = id; draw(); return; }
      if (pend === id){ pend = null; draw(); return; }
      const k = key(pend, id);
      if (!W.some(w => key(w[0], w[1]) === k)){ W.push([pend, id]); const m = cfg.danger && cfg.danger(pend, id); res(m ? `<div class="bn-bad"><b>Careful!</b> ${m}</div>` : ''); }
      pend = null; draw(); return;
    }
    const w = e.target.closest('.bw');
    if (w){ W.splice(+w.dataset.w, 1); pend = null; res(''); draw(); }
  });
  host.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && (e.target.classList.contains('bt-hit') || e.target.classList.contains('bw-hit'))){ e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', {bubbles:true})); } });
  q('.vw-undo').addEventListener('click', () => { W.pop(); pend = null; res(''); draw(); });
  q('.vw-clr').addEventListener('click', () => { W.length = 0; pend = null; res(''); draw(); });
  q('.vw-chk').addEventListener('click', () => {
    const ev = evaluate();
    if (ev.ok){ res(`<div class="bn-ok"><b>Wiring is correct ✓</b> ${cfg.done || ''}</div>`); fin(); if (opt.onOk) opt.onOk(); return; }
    let h = '';
    if (ev.shorts.length) h += `<div class="bn-bad"><b>Short circuit!</b> ${ev.shorts.map(s => `<span class="eq">${esc(T[s[0]].lab)}</span> and <span class="eq">${esc(T[s[1]].lab)}</span>`).join(', ')} are connected together.</div>`;
    if (ev.wrong.length) h += `<div class="bn-bad"><b>Wrong wires (${ev.wrong.length}):</b><ul>${ev.wrong.map(w => `<li><span class="eq">${esc(T[w[0]].lab)} ↔ ${esc(T[w[1]].lab)}</span>: ${(cfg.danger && cfg.danger(w[0], w[1])) || 'These two terminals should not be connected.'}</li>`).join('')}</ul></div>`;
    if (ev.missing.length) h += `<div class="bn-warn"><b>Still missing:</b><ul>${ev.missing.map(r => `<li>${r.hint}</li>`).join('')}</ul></div>`;
    res(h);
  });
  draw();
  return {W, connect(a, b){ if (!W.some(w => key(w[0], w[1]) === key(a, b))) W.push([a, b]); draw(); }, check(){ q('.vw-chk').click(); return q('.vw-res').textContent; }, evaluate, clear(){ W.length = 0; draw(); }};
};

/* L4 power wiring board */
VF.powerBoard = function(host, opt){
  const PH = {L1:'#b5651d', L2:'#222', L3:'#8a8f94'}, PE = '#2b9a3d';
  const terms = [
    {id:'L1', x:70, y:44, lab:'L1', col:PH.L1}, {id:'L2', x:110, y:44, lab:'L2', col:PH.L2}, {id:'L3', x:150, y:44, lab:'L3', col:PH.L3}, {id:'sPE', x:200, y:44, lab:'PE', col:PE, aria:'Supply earth PE'},
    {id:'R', x:70, y:104, lab:'R/L1', ly:20, aria:'Drive input R/L1'}, {id:'S', x:110, y:104, lab:'S/L2', ly:20, aria:'Drive input S/L2'}, {id:'Tt', x:150, y:104, lab:'T/L3', ly:20, aria:'Drive input T/L3'}, {id:'dPEi', x:200, y:104, lab:'PE', ly:20, col:PE, aria:'Drive earth, top'},
    {id:'U', x:70, y:220, lab:'U/T1', aria:'Drive output U/T1'}, {id:'V', x:110, y:220, lab:'V/T2', aria:'Drive output V/T2'}, {id:'W', x:150, y:220, lab:'W/T3', aria:'Drive output W/T3'}, {id:'dPEo', x:200, y:220, lab:'PE', col:PE, aria:'Drive earth, bottom'},
    {id:'BRp', x:250, y:140, lab:'BR+', ly:-12}, {id:'BRn', x:250, y:184, lab:'BR−', ly:20},
    {id:'R1', x:322, y:120, lab:'R1', aria:'Braking resistor terminal 1'}, {id:'R2', x:322, y:204, lab:'R2', ly:20, aria:'Braking resistor terminal 2'},
    {id:'mU', x:70, y:288, lab:'U1', ly:22, aria:'Motor terminal U1'}, {id:'mV', x:110, y:288, lab:'V1', ly:22, aria:'Motor terminal V1'}, {id:'mW', x:150, y:288, lab:'W1', ly:22, aria:'Motor terminal W1'}, {id:'mPE', x:200, y:288, lab:'PE', ly:22, col:PE, aria:'Motor earth'}
  ];
  const art = `<rect x="40" y="6" width="190" height="52" rx="8" fill="var(--panel)" stroke="var(--line)"/><text x="135" y="22" text-anchor="middle" class="svg-ar w-tx" style="font-size:11px;font-weight:700">3-phase supply 400V (after breaker)</text>
    <rect x="40" y="88" width="230" height="146" rx="10" fill="#2a3238" stroke="#11161a"/><text x="110" y="150" text-anchor="middle" class="svg-ar" style="font-size:13px;font-weight:700;fill:#e3e9ec">VFD</text><rect x="70" y="158" width="80" height="24" rx="3" fill="#06130b"/><text x="144" y="175" text-anchor="end" style="font:700 13px var(--font-mono);fill:#4dff88">0.00</text>
    <text x="186" y="126" class="svg-ar" style="font-size:9px;fill:#c9d1d6" text-anchor="end">Input</text><text x="186" y="203" class="svg-ar" style="font-size:9px;fill:#c9d1d6" text-anchor="end">Output</text>
    <rect x="300" y="132" width="44" height="60" rx="5" fill="#8a949b" stroke="#4a535a"/>${[0, 1, 2, 3].map(i => `<rect x="${305 + i * 10}" y="138" width="5" height="48" rx="2" fill="#5d6469"/>`).join('')}<path d="M322 132V126M322 192V198" stroke="#4a535a" stroke-width="2"/><text x="322" y="240" text-anchor="middle" class="svg-ar w-mu" style="font-size:9px">Brake resistor</text>
    <rect x="40" y="270" width="190" height="52" rx="8" fill="#2c5f96" stroke="#13304f"/><text x="276" y="300" text-anchor="middle" class="svg-ar w-tx" style="font-size:11px;font-weight:700">Motor terminal box</text>`;
  const isSup = x => ['L1', 'L2', 'L3'].includes(x), isOut = x => ['U', 'V', 'W'].includes(x), isMot = x => ['mU', 'mV', 'mW'].includes(x), isIn = x => ['R', 'S', 'Tt'].includes(x), isPE = x => /PE/.test(x), isBR = x => ['BRp', 'BRn', 'R1', 'R2'].includes(x);
  const danger = (a, b) => {
    const has = fn => fn(a) || fn(b), both = (f1, f2) => (f1(a) && f2(b)) || (f1(b) && f2(a));
    if (both(isSup, isOut)) return 'The supply is going into the <b>output terminals</b>! The moment you close the breaker the IGBTs burn. The supply goes on R S T only.';
    if (both(isSup, isMot)) return 'That puts the motor straight on the supply (DOL) and the drive is pointless, and if the drive output is connected to it as well, the drive will burn.';
    if (both(isSup, isBR)) return 'These are the brake / DC terminals, not a power input. Supply here = explosion.';
    if (both(isMot, isIn)) return 'The motor connects to the <b>output</b> terminals U V W, not the input.';
    if (both(isPE, x => isSup(x) || isOut(x) || isMot(x) || isIn(x))) return 'A phase to earth = ground fault. Earth goes to earth only.';
    if (has(isBR) && !both(x => ['BRp', 'BRn'].includes(x), x => ['R1', 'R2'].includes(x))) return 'The braking resistor connects to <span class="eq">BR+</span> and <span class="eq">BR−</span> only.';
    return null;
  };
  return VF.wire(host, {vb:[360, 330], art, terms, danger, max:520, aria:'Power wiring board: supply, drive, braking resistor and motor',
    rules:[{a:['L1', 'L2', 'L3'], b:['R', 'S', 'Tt'], hint:'Supply L1 L2 L3 to drive input R S T (the order does not matter here).'}, {a:['sPE'], b:['dPEi', 'dPEo'], hint:'Supply earth to the PE terminal on the drive.'},
      {a:['U', 'V', 'W'], b:['mU', 'mV', 'mW'], hint:'Drive output U V W to motor terminals U1 V1 W1.'}, {a:['mPE'], b:['dPEo', 'dPEi'], hint:'Motor earth back to the drive PE (in the same cable).'},
      {a:['BRp', 'BRn'], b:['R1', 'R2'], hint:'Braking resistor on BR+ and BR−.'}],
    danger, done:'The input phase order does not matter to the drive because it rectifies it. But if you swap any two wires between the drive and the motor, the motor runs in reverse (better to reverse it with a parameter).'}, Object.assign({task:'wire', goal:'Wire the supply, motor, earth and braking resistor correctly and press “Check wiring”.'}, opt));
};
VF.RULES = [
  ['You can put a contactor between the drive and the motor and open it while the motor runs to stop it.', false, 'Opening the contactor under load causes voltage and current spikes that can destroy the IGBTs. Stop from the drive first. (An output contactor opens and closes only with the drive stopped, as in a bypass.)'],
  ['The main contactor before the drive is not the place to start and stop the motor again and again.', true, 'Every time you switch on the power, the capacitors charge with a high current. There is a limit on how often (usually once every few minutes). Start and stop from the control terminals.'],
  ['The phase order L1 L2 L3 at the drive input sets the motor direction.', false, 'The drive rectifies the input to DC, so the order does not matter. Direction is set by the output U V W or by the command.'],
  ['You can put power factor correction capacitors on the drive output.', false, 'Capacitors on a PWM output draw very high currents and destroy both the drive and the capacitors. Never.'],
  ['The motor cable from the drive should ideally be shielded, with the shield earthed at both ends.', true, 'This reduces the noise (EMC) coming from the PWM pulses that affects sensors and signals.'],
  ['You can feed 400V to a drive rated for 230V input if the motor is small.', false, 'The capacitors and rectifier will burn at once. The input voltage must match the nameplate.'],
  ['The braking resistor connects to the DC/brake terminals, not to U V W.', true, 'It connects to BR+ / BR− (or B1/B2, PA/PB) depending on the brand.'],
  ['A drive with a 3-phase 230V output can run a 230/400V motor connected in delta.', true, 'Delta on this motor = 230V, which is exactly the drive output.'],
  ['You can megger the motor insulation while it is still connected to the drive.', false, 'The megger puts out 500–1000 V DC and can destroy the IGBTs. Disconnect the motor cable from the drive first.'],
  ['You can run more than one motor on the same drive in V/f mode, as long as each motor has its own overload.', true, 'The drive only sees the total current, so each motor needs its own protection. This does not work in vector mode.'],
  ['The motor earth can be left out because the drive has ground fault protection.', false, 'Earth is for safety: if the insulation fails, the motor frame becomes live. An earth wire must go back to the drive PE.']
];
VF.ruleGen = function(){ const r = pick(VF.RULES); return {q:r[0], o:['True', 'False'], a:r[1] ? 0 : 1, why:r[2], row:true}; };

/* L5 control wiring board with a live drive */
VF.controlBoard = function(host, opt){
  opt = opt || {};
  const xs = [18, 50, 82, 114, 146, 186, 218, 250, 282, 318, 348];
  const ids = [['p24', '+24V', '#d9534f'], ['DI1', 'DI1'], ['DI2', 'DI2'], ['DI3', 'DI3'], ['COM', 'COM', '#2f7fd8'], ['p10', '+10V', '#e0a400'], ['AI1', 'AI1'], ['AI2', 'AI2'], ['ACM', 'ACM', '#2f7fd8'], ['R1C', 'R1C', '#8e44ad'], ['R1A', 'R1A', '#8e44ad']];
  const terms = ids.map((d, i) => ({id:d[0], x:xs[i], y:44, lab:d[1], col:d[2], aria:'Drive terminal ' + d[1]}))
    .concat([{id:'SWa', x:30, y:176, lab:'1', ly:-10, aria:'Run selector terminal 1'}, {id:'SWb', x:66, y:176, lab:'2', ly:-10, aria:'Run selector terminal 2'},
      {id:'DIRa', x:104, y:176, lab:'1', ly:-10, aria:'Direction selector terminal 1'}, {id:'DIRb', x:140, y:176, lab:'2', ly:-10, aria:'Direction selector terminal 2'},
      {id:'P1', x:184, y:176, lab:'1', ly:-10, aria:'Potentiometer terminal 1'}, {id:'P2', x:214, y:176, lab:'2', ly:-10, aria:'Potentiometer middle terminal'}, {id:'P3', x:244, y:176, lab:'3', ly:-10, aria:'Potentiometer terminal 3'},
      {id:'Lsrc', x:340, y:176, lab:'L', ly:-10, col:'#b5651d', aria:'230V phase for the lamp, L'}, {id:'X1', x:298, y:176, lab:'X1', ly:-10, aria:'Fault lamp X1'}]);
  const art = `<rect x="4" y="18" width="356" height="44" rx="6" fill="#1a1f23"/><text x="180" y="14" text-anchor="middle" class="svg-ar w-mu" style="font-size:9px">Drive control terminals (names vary by brand)</text>
    <g class="cb-sw"><rect x="16" y="190" width="64" height="64" rx="8" fill="var(--panel)" stroke="var(--line)"/><circle cx="48" cy="222" r="17" fill="#2a3238"/><rect class="cb-swk" x="45" y="206" width="6" height="32" rx="3" fill="#e9edef"/><text x="48" y="268" text-anchor="middle" class="svg-ar w-tx" style="font-size:9px;font-weight:700">Run</text></g>
    <g><rect x="90" y="190" width="64" height="64" rx="8" fill="var(--panel)" stroke="var(--line)"/><circle cx="122" cy="222" r="17" fill="#2a3238"/><rect class="cb-dirk" x="119" y="206" width="6" height="32" rx="3" fill="#ffd23f"/><text x="122" y="268" text-anchor="middle" class="svg-ar w-tx" style="font-size:9px;font-weight:700">Fwd / Rev</text></g>
    <g><rect x="168" y="190" width="92" height="64" rx="8" fill="var(--panel)" stroke="var(--line)"/><circle cx="214" cy="222" r="20" fill="#2a3238"/><path class="cb-potk" d="M214 222L214 205" stroke="#e9edef" stroke-width="4" stroke-linecap="round"/><text x="214" y="268" text-anchor="middle" class="svg-ar w-tx" style="font-size:9px;font-weight:700">Speed pot</text></g>
    <g><rect x="276" y="190" width="80" height="64" rx="8" fill="var(--panel)" stroke="var(--line)"/><circle class="cb-lamp" cx="298" cy="222" r="14" fill="#5a2a26" stroke="#2a0d0b"/><path d="M312 222H340V240" stroke="#2f7fd8" stroke-width="2" fill="none"/><text x="340" y="250" text-anchor="middle" style="font:700 8px var(--font-mono);fill:#2f7fd8">N</text><text x="316" y="268" text-anchor="middle" class="svg-ar w-tx" style="font-size:9px;font-weight:700">Fault lamp 230V</text></g>
    <path d="M298 176V208" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="2 2"/>
    <g transform="translate(0 280)"><rect x="4" y="0" width="356" height="36" rx="6" fill="#06130b"/><text class="cb-disp" x="18" y="24" style="font:700 16px var(--font-mono);fill:#4dff88">0.00 Hz</text><text class="cb-dir" x="150" y="24" style="font:700 12px var(--font-mono);fill:#ffd23f">STOP</text><text class="cb-io" x="350" y="23" text-anchor="end" style="font:600 9px var(--font-mono);fill:#7aa08e"></text></g>`;
  const isPow = x => ['p24', 'p10', 'COM', 'ACM'].includes(x);
  const danger = (a, b) => {
    const both = (x, y) => (a === x && b === y) || (a === y && b === x);
    if (both('p24', 'COM')) return 'That is a short circuit on the terminals 24V supply.';
    if (both('p10', 'ACM')) return 'Short on the +10V: the pot goes between them, not a wire.';
    if ((a === 'Lsrc' || b === 'Lsrc') && !(a === 'R1C' || b === 'R1C' || a === 'R1A' || b === 'R1A')) return '<b>230V on the control terminals = the board burns!</b> 230V goes through the relay contact only.';
    if (isPow(a) && isPow(b)) return 'That connects two supplies together = short circuit.';
    if ((a === 'P2' || b === 'P2') && (isPow(a) || isPow(b))) return 'The pot middle terminal (the wiper) gives the signal; it goes to AI1.';
    return null;
  };
  const S = {sw:false, dir:false, pot:0.6, f:0, fault:false, ok:false, sawRev:false, sawLamp:false};
  const box = document.createElement('div'); host.appendChild(box);
  const ctl = document.createElement('div'); ctl.className = 'wd'; ctl.style.marginTop = '10px';
  ctl.innerHTML = `<h3>Test your wiring</h3><div class="wd-ctl"><button type="button" class="btn cb-bsw" aria-pressed="false">Run selector: OFF</button><button type="button" class="btn cb-bdir" aria-pressed="false">Direction: forward</button>
    <label>Potentiometer: <b class="cb-potv"></b><input type="range" class="cb-pot" min="0" max="100" step="1" value="60" aria-label="Potentiometer %"></label>
    <button type="button" class="btn cb-flt">Make the drive trip</button><button type="button" class="btn cb-rst">Reset</button></div>
    <div class="read sm"><div><span>DI1 / DI2</span><b class="cb-di"></b></div><div><span>AI1</span><b class="cb-ai"></b></div><div><span>Output frequency</span><b class="cb-hz"></b></div></div>
    <p class="msg cb-msg" aria-live="polite"></p><p class="chal cb-chal">Challenge: from the terminals (not the keypad), run the motor <b>in reverse at <span class="eq">30 Hz</span> or more</b>, then make a fault and see the fault lamp light.</p>`;
  let ev = null, f = null;
  const B = VF.wire(box, {vb:[364, 320], art, terms, danger, fs:9, max:560, aria:'Control terminal wiring board',
    rules:[{a:['p24'], b:['SWa', 'DIRa'], all:true, hint:'+24V must reach terminal 1 of both selectors (you can jumper from one selector to the other).'}, {a:['SWb'], b:['DI1'], hint:'Terminal 2 of the run selector goes back to DI1 (Run).'}, {a:['DIRb'], b:['DI2'], hint:'Terminal 2 of the direction selector goes back to DI2 (reverse).'},
      {a:['p10', 'ACM'], b:['P1', 'P3'], hint:'The pot ends go to +10V and ACM.'}, {a:['P2'], b:['AI1'], hint:'The pot middle terminal goes to AI1.'}, {a:['R1C', 'R1A'], b:['Lsrc', 'X1'], hint:'The fault relay contact (R1C and R1A) goes between L and the fault lamp.'}],
    danger, done:'Now the drive takes its run command and direction from the selectors, its speed from the pot, and drives the fault lamp from the relay. Try it below.'},
    {lesson:opt.lesson, task:'cwire', goal:'Wire the two selectors, the pot and the fault lamp correctly and press “Check wiring”.', onChange(e){ ev = e; f = e.f; }});
  host.appendChild(ctl);
  const q = s => $(s, host), fin = chal(ctl, '.cb-chal', opt.lesson, 'run');
  function sim(){
    const extra = []; if (S.sw) extra.push(['SWa', 'SWb']); if (S.dir) extra.push(['DIRa', 'DIRb']);
    const g = VF._lastNets(extra);
    const short24 = g('p24') === g('COM'), short10 = g('p10') === g('ACM');
    const di = x => !short24 && g(x) === g('p24');
    let ai = 0;
    if (!short10 && g('AI1') === g('P2')){ const e1 = g('P1') === g('p10') ? 10 : g('P1') === g('ACM') ? 0 : null, e3 = g('P3') === g('p10') ? 10 : g('P3') === g('ACM') ? 0 : null; if (e1 != null && e3 != null) ai = e3 + (e1 - e3) * S.pot; else if (e1 != null) ai = e1; else if (e3 != null) ai = e3; }
    else if (!short10 && g('AI1') === g('p10')) ai = 10;
    const relay = S.fault, lamp = relay && ((g('R1C') === g('Lsrc') && g('R1A') === g('X1')) || (g('R1A') === g('Lsrc') && g('R1C') === g('X1')));
    const live230 = ['p24', 'DI1', 'DI2', 'DI3', 'COM', 'p10', 'AI1', 'AI2', 'ACM'].some(x => g(x) === g('Lsrc'));
    return {di1:di('DI1'), di2:di('DI2'), ai, lamp, short24, short10, live230};
  }
  let st = sim();
  function frame(dt){
    st = sim();
    const tgt = S.fault || !st.di1 || st.live230 ? 0 : st.ai / 10 * 50;
    if (S.fault || st.live230) S.f = 0; else S.f += clamp(tgt - S.f, -10 * dt, 10 * dt);
    ui();
  }
  function ui(){
    q('.cb-swk').setAttribute('transform', S.sw ? 'rotate(40 48 222)' : 'rotate(-40 48 222)');
    q('.cb-dirk').setAttribute('transform', S.dir ? 'rotate(40 122 222)' : 'rotate(-40 122 222)');
    q('.cb-potk').setAttribute('transform', `rotate(${(-135 + S.pot * 270).toFixed(0)} 214 222)`);
    q('.cb-lamp').setAttribute('fill', st.lamp ? '#ff5a3c' : '#5a2a26'); q('.cb-lamp').classList.toggle('glow', st.lamp);
    q('.cb-disp').textContent = S.fault ? 'F 012' : st.live230 ? 'F ---' : fmt(S.f, 2) + ' Hz';
    q('.cb-dir').textContent = S.fault ? 'FAULT' : S.f > 0.05 ? (st.di2 ? 'REV ◀' : 'FWD ▶') : 'STOP';
    q('.cb-io').textContent = `DI1:${st.di1 ? 1 : 0} DI2:${st.di2 ? 1 : 0} AI1:${fmt(st.ai, 1)}V`;
    q('.cb-di').textContent = (st.di1 ? 'ON' : 'OFF') + ' / ' + (st.di2 ? 'ON' : 'OFF'); q('.cb-ai').textContent = fmt(st.ai, 2) + ' V'; q('.cb-hz').textContent = fmt(S.f, 1) + ' Hz';
    q('.cb-potv').textContent = Math.round(S.pot * 100) + ' %';
    if (S.f >= 29.5 && st.di2 && !S.fault) S.sawRev = true; if (st.lamp) S.sawLamp = true;
    const m = q('.cb-msg'); let t = '', c = '';
    if (st.live230){ t = '<b>230V reached the control terminals!</b> In real life the control board would be burnt. Remove that wire.'; c = 'bad'; }
    else if (st.short24){ t = 'Short on the 24V: none of the terminals work.'; c = 'bad'; }
    else if (S.fault) t = st.lamp ? 'The drive tripped on a fault, and the fault relay closed its contact so the lamp is on. Press Reset.' : 'The drive tripped and the relay closed, but the lamp did not light: check the relay and lamp wiring.';
    else if (S.sw && !st.di1) t = 'The selector is closed but DI1 is still OFF: the 24V is not reaching it. Check the wire.';
    else if (st.di1 && st.ai < 0.2) t = 'The motor has a run command but the speed is zero: AI1 has no voltage. Turn the pot or check its wiring.';
    else if (st.di1) t = `Running ${st.di2 ? 'reverse' : 'forward'}: AI1 = <span class="eq">${fmt(st.ai, 1)} V</span> ⇒ <span class="eq">${fmt(st.ai, 1)} ÷ 10 × 50 = ${fmt(st.ai * 5, 1)} Hz</span>.`;
    else t = 'Close the run selector to send a Run command to DI1.';
    if (S.sawRev && S.sawLamp){ fin(); if (!S.fault){ t = 'Well done! You ran in reverse from the terminals, took the speed from the pot, and tested the fault lamp. That is exactly what you do on any panel.'; c = 'ok'; } }
    m.className = 'msg cb-msg ' + c; m.innerHTML = t;
  }
  q('.cb-bsw').addEventListener('click', e => { S.sw = !S.sw; e.currentTarget.setAttribute('aria-pressed', String(S.sw)); e.currentTarget.textContent = 'Run selector: ' + (S.sw ? 'ON' : 'OFF'); });
  q('.cb-bdir').addEventListener('click', e => { S.dir = !S.dir; e.currentTarget.setAttribute('aria-pressed', String(S.dir)); e.currentTarget.textContent = 'Direction: ' + (S.dir ? 'reverse' : 'forward'); });
  q('.cb-pot').addEventListener('input', e => { S.pot = +e.target.value / 100; });
  q('.cb-flt').addEventListener('click', () => { S.fault = true; });
  q('.cb-rst').addEventListener('click', () => { S.fault = false; });
  ui(); animate(host, frame);
  return {S, board:B, run(sec){ for (let t = 0; t < sec; t += 0.05) frame(0.05); }};
};
VF.scaleGen = function(){
  const r = Math.random(), fmax = pick([50, 50, 60]), fmin = pick([0, 0, 10, 20]);
  if (r < 0.5){ const ma = pick([6, 8, 10, 12, 14, 16, 18]); const hz = fmin + (ma - 4) / 16 * (fmax - fmin); return {q:`The speed comes from a PLC as a <span class="eq">4–20 mA</span> signal scaled to <span class="eq">${fmin}–${fmax} Hz</span>. The signal is <b class="eq">${ma} mA</b>. How many Hz will the drive output?`, input:true, unit:'Hz', check:x => Math.abs(x - hz) <= 0.3, ans:fmt(hz, 1) + ' Hz', why:`<span class="eq">${fmin} + (${ma} − 4) ÷ 16 × ${fmax - fmin} = ${fmt(hz, 1)}</span>.`}; }
  if (r < 0.85){ const v = pick([2, 2.5, 4, 5, 6, 7.5, 8]); const hz = fmin + v / 10 * (fmax - fmin); return {q:`A pot on <span class="eq">0–10 V</span> scaled to <span class="eq">${fmin}–${fmax} Hz</span>. The voltage at AI is <b class="eq">${v} V</b>. What is the frequency?`, input:true, unit:'Hz', check:x => Math.abs(x - hz) <= 0.3, ans:fmt(hz, 1) + ' Hz', why:`<span class="eq">${fmin} + ${v} ÷ 10 × ${fmax - fmin} = ${fmt(hz, 1)}</span>.`}; }
  return {q:'The speed signal is <span class="eq">4–20 mA</span> and the drive reads <b class="eq">0 mA</b>. What does this most likely mean?', o:['A broken wire or the PLC is not sending (signal loss)', 'The speed reference is zero', 'Maximum speed', 'The signal is fine'], a:0, why:'On 4–20 mA the real zero is 4 mA. Far below that means a broken loop, and many drives can trip or go to a safe speed.'};
};

/* ======================================================================
   L6: nameplate → parameters
   ====================================================================== */
VF.PLATES = [
  {kw:7.5, v:'400/690', conn:'Δ/Y', a:'14.6/8.4', hz:50, rpm:1455, cos:0.84, sc:'The supply is <b>3 phase 400V</b> and the motor is connected in <b>delta Δ</b>.', ans:{v:400, a:14.6, hz:50, rpm:1455, kw:7.5, p:4}},
  {kw:2.2, v:'230/400', conn:'Δ/Y', a:'8.4/4.9', hz:50, rpm:1425, cos:0.81, sc:'A <b>3 phase 400V</b> drive and the motor is connected in <b>star Y</b>.', ans:{v:400, a:4.9, hz:50, rpm:1425, kw:2.2, p:4}},
  {kw:2.2, v:'230/400', conn:'Δ/Y', a:'8.4/4.9', hz:50, rpm:1425, cos:0.81, sc:'A drive with <b>single phase 220V</b> input and <b>3 phase 230V</b> output, and the motor is connected in <b>delta Δ</b>.', ans:{v:230, a:8.4, hz:50, rpm:1425, kw:2.2, p:4}},
  {kw:11, v:'460', conn:'Y', a:'18.5', hz:60, rpm:1765, cos:0.86, sc:'A machine from the USA: the supply is <b>460V 60Hz</b>.', ans:{v:460, a:18.5, hz:60, rpm:1765, kw:11, p:4}},
  {kw:4, v:'400/690', conn:'Δ/Y', a:'8.1/4.7', hz:50, rpm:2890, cos:0.86, sc:'The supply is <b>400V</b> and the motor is in <b>delta Δ</b>.', ans:{v:400, a:8.1, hz:50, rpm:2890, kw:4, p:2}},
  {kw:0.75, v:'230/400', conn:'Δ/Y', a:'3.3/1.9', hz:50, rpm:935, cos:0.72, sc:'A <b>400V</b> drive and the motor is in <b>star Y</b>.', ans:{v:400, a:1.9, hz:50, rpm:935, kw:0.75, p:6}}
];
VF.PFIELDS = [['v', 'Motor rated voltage', 'V', 'P031', 'P0304', 'UnS'], ['a', 'Motor rated current (FLA)', 'A', 'P034', 'P0305', 'nCr'], ['hz', 'Motor rated frequency', 'Hz', 'P032', 'P0310', 'FrS'], ['rpm', 'Motor rated speed', 'rpm', 'P036', 'P0311', 'nSP'], ['kw', 'Motor power', 'kW', 'P037', 'P0307', 'nPr'], ['p', 'Number of poles', '', 'P035', '—', '—']];
VF.plate = function(host, opt){
  opt = opt || {};
  const need = opt.need || 2; let ok = 0, cur = null, order = shuffle(VF.PLATES.map((_, i) => i)), k = 0;
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art pl-art"></div><div><p class="pl-sc box"></p></div></div>
    <form class="pl-f" autocomplete="off"><div class="pl-grid">${VF.PFIELDS.map(f => `<label><span>${f[1]} <small class="muted mono">PF525 ${f[3]} · V20 ${f[4]} · ATV320 ${f[5]}</small></span><span class="pl-in"><input class="inp" name="${f[0]}" inputmode="decimal" aria-label="${esc(f[1])}"><span class="mono">${f[2]}</span><i class="pl-ok" aria-hidden="true"></i></span></label>`).join('')}</div>
    <div class="wd-ctl"><button type="submit" class="btn pri">Check</button><button type="button" class="btn pl-next" hidden>Next nameplate →</button></div></form>
    <p class="msg pl-msg" aria-live="polite"></p><p class="chal pl-chal">Challenge: enter the data from <b>${need}</b> nameplates correctly.</p>`;
  const q = s => $(s, host), fin = chal(host, '.pl-chal', opt.lesson, opt.task || 'plate');
  function plateSVG(p){
    return `<svg viewBox="0 0 300 170" role="img" aria-label="Motor nameplate"><rect x="4" y="4" width="292" height="162" rx="10" fill="#d9dde0" stroke="#7d8890" stroke-width="2"/><circle cx="16" cy="16" r="4" fill="#9aa4ac"/><circle cx="284" cy="16" r="4" fill="#9aa4ac"/><circle cx="16" cy="154" r="4" fill="#9aa4ac"/><circle cx="284" cy="154" r="4" fill="#9aa4ac"/>
      <text x="150" y="24" text-anchor="middle" style="font:700 11px var(--font-mono);fill:#152027">3~ MOTOR · IEC 60034 · IP55</text><line x1="14" y1="32" x2="286" y2="32" stroke="#7d8890"/>
      ${[[`${p.v} V`, p.conn], [`${p.a} A`, `${p.hz} Hz`], [`${p.kw} kW`, `${p.rpm} min⁻¹`], [`cos φ ${p.cos}`, 'Ins.Cl. F']].map((r, i) => `<text x="22" y="${56 + i * 26}" style="font:700 14px var(--font-mono);fill:#152027">${r[0]}</text><text x="278" y="${56 + i * 26}" text-anchor="end" style="font:700 14px var(--font-mono);fill:#152027">${r[1]}</text>`).join('')}
      <text x="150" y="160" text-anchor="middle" style="font:600 9px var(--font-mono);fill:#56656f">S1 · 40 °C · ${p.hz === 60 ? 'NEMA Design B' : 'IE3'}</text></svg>`;
  }
  function show(){ cur = VF.PLATES[order[k % order.length]]; q('.pl-art').innerHTML = plateSVG(cur); q('.pl-sc').innerHTML = `<b>The situation:</b> ${cur.sc} Type what you will enter in the drive.`; $$('input', host).forEach(i => { i.value = ''; i.disabled = false; }); $$('.pl-ok', host).forEach(i => { i.textContent = ''; i.className = 'pl-ok'; }); q('.pl-next').hidden = true; msg(''); }
  const msg = (t, c) => { const m = q('.pl-msg'); m.className = 'msg pl-msg ' + (c || ''); m.innerHTML = t; };
  q('.pl-f').addEventListener('submit', e => {
    e.preventDefault();
    let all = true, tips = [];
    VF.PFIELDS.forEach(f => {
      const inp = q(`input[name="${f[0]}"]`), v = num(inp.value), want = cur.ans[f[0]], good = isFinite(v) && Math.abs(v - want) <= Math.max(0.01, want * 0.005);
      const ic = inp.parentNode.querySelector('.pl-ok'); ic.textContent = good ? '✓' : '✗'; ic.className = 'pl-ok ' + (good ? 'ok' : 'no');
      if (!good){ all = false; if (f[0] === 'v' || f[0] === 'a') tips.push('Voltage and current depend on the connection the motor is actually in (delta or star).'); if (f[0] === 'p') tips.push('Number of poles: synchronous speed = <span class="eq">120 × f ÷ P</span>, a little above the nameplate speed.'); if (f[0] === 'kw' && !isFinite(v)) tips.push('The power is written in kW on the nameplate.'); }
    });
    if (all){ ok++; $$('input', host).forEach(i => i.disabled = true); q('.pl-next').hidden = false; msg(`Correct ✓ (${ok} of ${need}). ${cur.ans.p === 4 ? '' : `${cur.ans.p} poles because the synchronous speed is ${120 * cur.ans.hz / cur.ans.p} rpm.`}`, 'ok'); if (ok >= need) fin(); }
    else msg('Some fields are wrong (✗). ' + [...new Set(tips)].join(' '), 'bad');
  });
  q('.pl-next').addEventListener('click', () => { k++; show(); });
  show();
  return {get cur(){ return cur; }, fill(){ VF.PFIELDS.forEach(f => { q(`input[name="${f[0]}"]`).value = cur.ans[f[0]]; }); q('.pl-f').requestSubmit ? q('.pl-f').requestSubmit() : q('.pl-f button[type=submit]').click(); }, next(){ q('.pl-next').click(); }};
};
VF.rampGen = function(){
  const fmax = pick([50, 50, 60]), T = pick([5, 8, 10, 12, 15, 20]);
  const f1 = pick([0, 0, 10, 20]), f2 = pick([25, 30, 40, fmax]); if (f2 <= f1) return VF.rampGen();
  const dec = Math.random() < 0.35, t = T * (f2 - f1) / fmax;
  return {q:`${dec ? 'Decel' : 'Accel'} time = <b class="eq">${T} s</b> (set from 0 to <span class="eq">${fmax} Hz</span>). ${dec ? `How many seconds will the motor take to go down from <span class="eq">${f2} Hz</span> to <span class="eq">${f1} Hz</span>?` : `How many seconds will the motor take to go up from <span class="eq">${f1} Hz</span> to <span class="eq">${f2} Hz</span>?`}`, input:true, unit:'s', check:x => Math.abs(x - t) <= 0.1, ans:fmt(t, 1) + ' s', why:`<span class="eq">${T} × ${f2 - f1} ÷ ${fmax} = ${fmt(t, 1)} s</span>. The time is proportional to the change in frequency.`};
};

/* ======================================================================
   L7: control modes
   ====================================================================== */
VF.MODES = {vf:{n:'V/f', d:'Voltage and frequency at a fixed ratio. Simple and needs little data.'}, svc:{n:'Sensorless Vector', d:'The drive estimates flux and torque from current and voltage (needs an autotune).'}, fv:{n:'Vector + encoder', d:'Closed loop: the encoder reports the exact real speed.'}};
VF.modeCalc = function(m, f, load, tuned){
  const sync = 30 * f, slipR = 50; let comp, tmax;
  if (m === 'vf'){ comp = 0; tmax = f >= 10 ? 160 : 40 + 12 * f; }
  else if (m === 'svc'){ comp = tuned ? 0.97 : 0.5; tmax = tuned ? (f >= 1 ? 170 : 90 + 80 * f) : (f >= 10 ? 160 : 70 + 9 * f); }
  else { comp = tuned ? 1 : 0.9; tmax = tuned ? 180 : 150; }
  const stall = load > tmax + 1e-9 && f > 0;
  const rpm = stall ? 0 : Math.max(0, sync - slipR * load / 100 * (1 - comp));
  const err = sync > 0 ? (sync - rpm) / sync * 100 : 0;
  return {sync, rpm, err, tmax, stall};
};
VF.modes = function(host, opt){
  opt = opt || {};
  const S = {m:'vf', f:5, load:100, tuned:false, x:0, tuning:0};
  host.innerHTML = `<div class="tabs md-m" role="group" aria-label="Control mode">${Object.keys(VF.MODES).map(k => `<button type="button" class="btn" data-m="${k}" aria-pressed="${k === 'vf'}">${VF.MODES[k].n}</button>`).join('')}</div>
   <div class="wd-art"><svg viewBox="0 0 360 150" role="img" aria-label="Moving conveyor and torque gauge"><g class="md-belt"></g>${fanSVG('md-fan', 40, 70, 26)}<rect x="74" y="88" width="230" height="10" rx="5" fill="#3a434a"/><circle cx="80" cy="93" r="7" fill="#7d8890"/><circle cx="298" cy="93" r="7" fill="#7d8890"/><g class="md-box"><rect x="0" y="58" width="34" height="30" rx="3" fill="#c08a4a" stroke="#7a5528"/></g>
     <text x="320" y="40" text-anchor="end" class="svg-ar w-mu" style="font-size:9px">Torque needed / available</text><rect x="210" y="46" width="110" height="10" rx="3" class="w-bg" stroke="var(--line)"/><rect class="md-tl" x="210" y="46" width="0" height="10" rx="3" fill="var(--accent)"/><line class="md-tm" x1="0" x2="0" y1="42" y2="60" stroke="var(--bad)" stroke-width="3"/>
     <text x="80" y="128" class="md-st w-tx svg-ar" style="font-size:12px;font-weight:700"></text></svg></div>
   <div class="wd-ctl"><label>Frequency reference: <b class="md-fv"></b><input type="range" class="md-f" min="1" max="50" step="1" value="5" aria-label="Frequency Hz"></label>
     <label>Load (torque needed): <b class="md-lv"></b><input type="range" class="md-l" min="0" max="150" step="5" value="100" aria-label="Load %"></label>
     <button type="button" class="btn md-tune">Run autotune</button></div>
   <div class="read"><div><span>Speed wanted</span><b class="md-sync"></b></div><div><span>Actual speed</span><b class="md-rpm"></b></div><div><span>Speed error</span><b class="md-err"></b></div><div><span>Max torque available</span><b class="md-tmax"></b></div></div>
   <p class="msg md-msg" aria-live="polite"></p>
   <p class="chal md-chal">Challenge: a conveyor loaded to <b>100 % or more</b> at <b class="eq">5 Hz or less</b>. Keep the speed error <b>below 2 %</b> without the motor stalling.</p>`;
  const q = s => $(s, host), fin = chal(host, '.md-chal', opt.lesson, opt.task || 'mode');
  onAct(q('.md-m'), '[data-m]', b => { S.m = b.dataset.m; $$('[data-m]', host).forEach(x => x.setAttribute('aria-pressed', String(x === b))); ui(); });
  q('.md-f').addEventListener('input', e => { S.f = +e.target.value; ui(); });
  q('.md-l').addEventListener('input', e => { S.load = +e.target.value; ui(); });
  q('.md-tune').addEventListener('click', () => { if (S.tuning) return; S.tuning = 1.6; q('.md-tune').disabled = true; });
  let r;
  function ui(){
    r = VF.modeCalc(S.m, S.f, S.load, S.tuned);
    q('.md-fv').textContent = S.f + ' Hz'; q('.md-lv').textContent = S.load + ' %';
    q('.md-sync').textContent = Math.round(r.sync) + ' rpm'; q('.md-rpm').textContent = Math.round(r.rpm) + ' rpm';
    const eb = q('.md-err'); eb.textContent = r.stall ? 'Stalled!' : fmt(r.err, 1) + ' %'; eb.className = 'md-err ' + (r.stall || r.err > 2 ? 'bad' : 'ok');
    q('.md-tmax').textContent = Math.round(r.tmax) + ' %';
    q('.md-tl').setAttribute('width', (Math.min(150, S.load) / 200 * 110).toFixed(1)); const xm = 210 + Math.min(200, r.tmax) / 200 * 110; q('.md-tm').setAttribute('x1', xm); q('.md-tm').setAttribute('x2', xm);
    q('.md-st').textContent = r.stall ? '⚠ Motor stalled: not enough torque ⇒ OL / OC' : `Conveyor running at ${Math.round(r.rpm)} rpm`;
    q('.md-st').style.fill = r.stall ? 'var(--bad)' : '';
    q('.md-tune').textContent = S.tuning ? 'Autotuning…' : S.tuned ? 'Autotune ✓ (done)' : 'Run autotune';
    const m = q('.md-msg'); let t = `<b>${VF.MODES[S.m].n}:</b> ${VF.MODES[S.m].d} `, c = '';
    if (r.stall) t += S.m === 'vf' ? 'At this low frequency V/f cannot produce enough torque for the load.' : 'Not enough torque. Try an autotune or reduce the load.';
    else if (S.m === 'vf' && S.load > 0) t += `The motor slips about <span class="eq">${Math.round(50 * S.load / 100)} rpm</span> and V/f does not compensate, and at low speed that is a big error.`;
    else if (S.m === 'svc' && !S.tuned) t += 'Without an autotune the drive does not know the motor resistance and windings, so its estimate is not accurate.';
    else if (S.m === 'svc') t += 'After the autotune the drive compensates the slip and gives good torque down to about 1 Hz.';
    else t += S.tuned ? 'Speed is exact and full torque is available even at zero speed (like a hoist holding its load).' : 'It needs an autotune to tune the loop.';
    if (S.f <= 5 && S.load >= 100 && !r.stall && r.err < 2){ fin(); t = '✓ ' + t + ' Challenge passed.'; c = 'ok'; }
    m.className = 'msg md-msg ' + c; m.innerHTML = t;
  }
  function frame(dt){
    if (S.tuning){ S.tuning -= dt; if (S.tuning <= 0){ S.tuning = 0; S.tuned = true; q('.md-tune').disabled = false; } ui(); }
    const v = r.rpm / 1500; S.x = (S.x + v * dt * 220) % 300;
    q('.md-box').setAttribute('transform', `translate(${(80 + S.x * 0.75).toFixed(1)} 0)`);
    if (!reduced()) q('.md-fan').setAttribute('transform', `rotate(${((S.x * 9) % 360).toFixed(1)})`);
  }
  ui(); animate(host, frame);
  return {S, set(o){ Object.assign(S, o); ui(); }, get r(){ return r; }};
};
VF.PICKS = [
  ['A large extract fan in a factory', 'vf', 'A fan needs little torque at low speed; V/f (preferably the quadratic curve) is enough and saves energy.'],
  ['A centrifugal water pump', 'vf', 'Like a fan: V/f, and it saves energy.'],
  ['4 small conveyor motors on one drive', 'vf', 'More than one motor on one drive = V/f only, because vector needs to know one motor.'],
  ['A loaded conveyor that starts while full', 'svc', 'Needs high starting torque at low speed ⇒ sensorless vector after an autotune.'],
  ['A heavy dough mixer', 'svc', 'High torque at low speed ⇒ sensorless vector.'],
  ['A plastic extruder that needs steady speed as the load changes', 'svc', 'Vector compensates the slip, so the speed stays steady.'],
  ['A hoist that must hold the load at zero speed', 'fv', 'Holding the load while stopped + safety ⇒ closed loop with an encoder (plus a mechanical brake and a braking resistor).'],
  ['A paper winder that needs exact torque', 'fv', 'Precise torque and speed control ⇒ vector with encoder.'],
  ['A printing machine whose speed must match another machine exactly', 'fv', 'Very high speed accuracy ⇒ encoder.']
];
VF.pickGen = function(){ const p = pick(VF.PICKS), o = ['V/f', 'Sensorless Vector', 'Vector with encoder (closed loop)']; return {q:`Application: <b>${p[0]}</b>. Best control mode?`, o, a:['vf', 'svc', 'fv'].indexOf(p[1]), why:p[2]}; };

/* ======================================================================
   L8: braking
   ====================================================================== */
VF.BRK = {VN:565, OV:810, CH:760};
VF.brake = function(host, opt){
  opt = opt || {};
  const S = {st:'idle', s:0, vdc:565, td:10, m:'ramp', dc:false, t:0, hist:[], heat:0, trip:false, gotOV:false, gotFast:false, dct:0};
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg viewBox="0 0 360 170" class="bk-g" role="img" aria-label="Speed and DC bus voltage over time"></svg></div>
   <div class="wd-art"><svg viewBox="0 0 220 170" role="img" aria-label="Heavy flywheel, drive and braking resistor">
     <circle cx="60" cy="80" r="50" fill="#5d6469" stroke="#2a3035" stroke-width="3"/><g class="bk-fly"><path d="M60 34V126M14 80H106" stroke="#2a3035" stroke-width="8"/><circle cx="60" cy="80" r="12" fill="#2a3035"/></g>
     <text x="60" y="150" text-anchor="middle" class="svg-ar w-tx" style="font-size:10px;font-weight:700">Heavy flywheel (high inertia)</text>
     <rect x="128" y="18" width="80" height="44" rx="6" fill="#06130b"/><text class="bk-scr" x="200" y="38" text-anchor="end" style="font:700 14px var(--font-mono);fill:#4dff88">0.00</text><text class="bk-scr2" x="200" y="55" text-anchor="end" style="font:600 9px var(--font-mono);fill:#7aa08e">DC 565V</text>
     <rect class="bk-res" x="134" y="96" width="70" height="30" rx="4" fill="#8a949b" stroke="#4a535a"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${140 + i * 13}" y="100" width="6" height="22" rx="2" fill="#5d6469"/>`).join('')}<text x="169" y="142" text-anchor="middle" class="svg-ar w-mu" style="font-size:9px">Braking resistor</text>
   </svg></div></div>
   <div class="tabs bk-m" role="group" aria-label="Stop method"><button type="button" class="btn" data-m="ramp" aria-pressed="true">Ramp only</button><button type="button" class="btn" data-m="res" aria-pressed="false">Ramp + braking resistor</button><button type="button" class="btn" data-m="coast" aria-pressed="false">Coast (let it spin down)</button></div>
   <div class="wd-ctl"><label>Decel time: <b class="bk-tv"></b><input type="range" class="bk-t" min="1" max="20" step="0.5" value="10" aria-label="Decel time, seconds"></label>
     <label class="ck"><input type="checkbox" class="bk-dc"> DC injection at the end (holds the shaft as it nears standstill)</label>
     <button type="button" class="btn pri bk-run">Run to 50 Hz ▶</button><button type="button" class="btn bk-stop">Stop ■</button><button type="button" class="btn bk-rst">Reset</button></div>
   <p class="msg bk-msg" aria-live="polite"></p>
   <p class="chal bk-chal">Challenge 1: cause an <b>OV</b> fault yourself (stop fast without a resistor). Challenge 2: stop the flywheel from <span class="eq">50 Hz</span> in <b>3 seconds or less</b> without a fault.</p>`;
  const q = s => $(s, host), finOV = () => { if (opt.lesson) VF.mark(opt.lesson, 'ov'); }, finStop = () => { if (opt.lesson) VF.mark(opt.lesson, 'stop'); };
  const chalEl = q('.bk-chal'); const upChal = () => { if (opt.lesson && VF.has(opt.lesson, 'ov') && VF.has(opt.lesson, 'stop')) chalEl.classList.add('ok'); };
  upChal();
  onAct(q('.bk-m'), '[data-m]', b => { if (S.st === 'stop') return; S.m = b.dataset.m; $$('[data-m]', host).forEach(x => x.setAttribute('aria-pressed', String(x === b))); ui(); });
  q('.bk-t').addEventListener('input', e => { S.td = +e.target.value; ui(); });
  q('.bk-dc').addEventListener('change', e => { S.dc = e.target.checked; });
  q('.bk-run').addEventListener('click', () => { if (S.trip) return; S.st = 'run'; });
  q('.bk-stop').addEventListener('click', () => { if (S.st === 'run' && S.s > 0.98){ S.st = 'stop'; S.t = 0; S.hist = []; S.trip = false; S.t0s = S.s; S.dct = 0; } else if (S.st === 'run') msg('Wait until it reaches 50 Hz first.'); });
  q('.bk-rst').addEventListener('click', () => { S.trip = false; S.st = S.s > 0.01 ? 'coast' : 'idle'; ui(); });
  const msg = (t, c) => { const m = q('.bk-msg'); m.className = 'msg bk-msg ' + (c || ''); m.innerHTML = t; };
  function step(dt){
    const B = VF.BRK;
    if (S.st === 'run'){ S.s = Math.min(1, S.s + dt / 4); S.vdc += (B.VN - S.vdc) * Math.min(1, dt / 0.3); return; }
    if (S.st === 'stop' && !S.trip){
      S.t += dt;
      if (S.m === 'coast'){ S.s = Math.max(0, S.s - dt * (S.s * 0.09 + 0.004)); if (S.dc && S.s < 0.35) S.s = Math.max(0, S.s - dt * 0.22); S.vdc += (B.VN - S.vdc) * Math.min(1, dt / 0.3); }
      else {
        S.s = Math.max(0, S.s - dt / S.td);
        const ex = S.s > 0 ? Math.max(0, S.s * 12 / S.td - 1) : 0; let vt = B.VN + 300 * ex;
        if (S.m === 'res' && vt > B.CH){ S.heat += (vt - B.CH) * dt * 0.02; vt = B.CH + Math.min(14, (vt - B.CH) * 0.05); }
        S.vdc += (vt - S.vdc) * Math.min(1, dt / 0.25);
        if (S.vdc >= B.OV){ S.trip = true; S.gotOV = true; finOV(); upChal(); S.st = 'trip'; }
      }
      if (S.s <= 0.0001){ S.s = 0; if (S.st === 'stop'){ S.st = 'done'; S.res = {t:S.t, m:S.m}; if (S.m !== 'coast' && S.t <= 3.05){ S.gotFast = true; finStop(); upChal(); } } }
      return;
    }
    if (S.st === 'trip' || S.st === 'coast'){ S.t += dt; S.s = Math.max(0, S.s - dt * (S.s * 0.09 + 0.004)); S.vdc += (B.VN - S.vdc) * Math.min(1, dt / 1.5); if (S.s <= 0 && S.st === 'coast') S.st = 'idle'; return; }
    S.vdc += (B.VN - S.vdc) * Math.min(1, dt / 0.3);
    S.heat = Math.max(0, S.heat - dt * 0.05);
  }
  let ang = 0, tick = 0;
  function frame(dt){
    let sim = dt * 1.5; while (sim > 0){ const d = Math.min(0.02, sim); step(d); sim -= d; if (S.st === 'stop' || S.st === 'trip' || S.st === 'done'){ if (S.t < 25 && (!S.hist.length || S.t - S.hist[S.hist.length - 1][0] >= 0.05)) S.hist.push([S.t, S.s * 50, S.vdc]); } }
    ang = (ang + S.s * dt * 600) % 360; if (!reduced()) q('.bk-fly').setAttribute('transform', `rotate(${ang.toFixed(1)} 60 80)`);
    if (++tick % 3 === 0) ui();
  }
  function ui(){
    const B = VF.BRK, tmax = Math.max(6, Math.ceil(((S.hist.length ? S.hist[S.hist.length - 1][0] : 0) + 1) / 2) * 2);
    q('.bk-g').innerHTML = plot({W:360, H:170, xr:[0, Math.min(26, tmax)], yr:[0, 60], xt:[0, Math.min(26, tmax) / 2, Math.min(26, tmax)], yt:[0, 25, 50], y2:{r:[400, 900], t:[500, 565, 760, 810], col:'var(--bad)'},
      hl:[{y:B.OV, y2:true, col:'var(--bad)', lab:'OV limit'}], series:[{pts:S.hist.map(h => [h[0], h[1]]), col:'var(--cur)', w:2.4}, {pts:S.hist.map(h => [h[0], h[2]]), col:'var(--bad)', w:1.8, y2:true}],
      xlab:'seconds', ylab:'Hz', legend:'<tspan fill="var(--cur)">━ Frequency</tspan>  <tspan fill="var(--bad)">━ DC bus voltage</tspan>'});
    q('.bk-tv').textContent = fmt(S.td, 1) + ' s';
    q('.bk-scr').textContent = S.trip ? 'OV' : fmt(S.s * 50, 2); q('.bk-scr').style.fill = S.trip ? '#ff6b5e' : '#4dff88'; q('.bk-scr2').textContent = 'DC ' + Math.round(S.vdc) + 'V';
    const hot = Math.min(1, S.heat / 20); q('.bk-res').setAttribute('fill', S.m === 'res' && S.vdc >= B.CH - 2 && S.st === 'stop' ? '#e4572e' : `rgb(${Math.round(138 + 100 * hot)},${Math.round(148 - 60 * hot)},${Math.round(155 - 90 * hot)})`);
    q('.bk-res').parentNode.style.opacity = S.m === 'res' ? 1 : 0.35;
    if (S.st === 'trip') msg(`<b>OV fault (overvoltage)!</b> While stopping, the flywheel sent energy back to the DC bus and the voltage passed <span class="eq">${B.OV} V</span>. The drive cut its output and the flywheel is coasting on its own. The fix: a longer decel, or a braking resistor. Press Reset.`, 'bad');
    else if (S.st === 'done') msg(S.res.m === 'coast' ? `Stopped in <b class="eq">${fmt(S.res.t, 1)} s</b> by coasting: no OV because the drive cut its output, but the time is long and uncontrolled.${S.dc ? ' DC injection shortened the end, but the energy is burnt in the motor itself so it heats up.' : ''}` : `Stopped in <b class="eq">${fmt(S.res.t, 1)} s</b> with no fault ✓ ${S.res.m === 'res' ? 'The chopper switched onto the resistor when the voltage reached ' + B.CH + ' V and burnt the extra energy as heat.' : 'The decel is long enough for the returned energy to be burnt in motor and drive losses.'}${S.dc ? ' And DC injection at the end holds the shaft so it does not creep.' : ''}`, S.res.m === 'coast' ? '' : 'ok');
    else if (S.st === 'stop') msg(S.m === 'coast' ? 'Coast: the drive cut its output and the flywheel stops on friction alone.' : S.m === 'res' && S.vdc >= B.CH - 2 ? 'The voltage reached the chopper level: the resistor is working and heating up.' : 'Stopping on the ramp… watch the DC bus voltage.');
    else if (S.st === 'run') msg(S.s >= 0.98 ? 'The flywheel is at 50 Hz. Pick the stop method and time, then press Stop.' : 'Ramping up to 50 Hz…');
    else if (S.st === 'idle') msg('Press “Run to 50 Hz”, then Stop.');
  }
  ui(); animate(host, frame);
  return {S, sim(sec){ for (let t = 0; t < sec; t += 0.02) step(0.02); ui(); }};
};

/* ======================================================================
   L9: PID constant pressure pump
   ====================================================================== */
VF.pidStep = function(S, dt){
  /* PI in Hz/bar; pump curve; drive ramp; sensor filter; sleep */
  const SP = S.sp;
  if (S.sleep){ S.f = Math.max(0, S.f - 10 * dt); if (S.pm < SP - 0.4) S.sleep = false; }
  else {
    const e = SP - S.pm;
    S.I = clamp(S.I + S.kp / S.ti * e * dt, 0, 50);
    let cmd = clamp(S.kp * e + S.I, S.fmin, 50);
    S.f += clamp(cmd - S.f, -10 * dt, 10 * dt);
    /* sleep: no demand and the pump is only holding pressure at low speed */
    if (S.D < 0.05 && S.f < 40 && S.pm > SP - 0.2){ S.sl += dt; if (S.sl > 4){ S.sleep = true; S.sl = 0; } } else S.sl = 0;
  }
  /* pump curve; a check valve keeps the pressure when the pump can't push (only leaks and taps drain it) */
  const pss = S.f > 1 ? Math.max(0, 7 * Math.pow(S.f / 50, 2) - 2.8 * S.D * S.D) : 0;
  if (pss >= S.p) S.p += (pss - S.p) * dt; else S.p = Math.max(pss, S.p - Math.min(S.p - pss, (0.02 + 1.2 * S.D) * dt));
  S.pm += (S.p - S.pm) / 1 * dt;
};
VF.pid = function(host, opt){
  opt = opt || {};
  const S = {sp:4, p:3.8, pm:3.8, f:40, I:40, kp:30, ti:0.3, D:0.3, fmin:25, sleep:false, sl:0, t:0, hist:[], hold:0, stepped:false, D0:0.3};
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg viewBox="0 0 360 170" class="pd-g" role="img" aria-label="Pressure and frequency over time"></svg></div>
   <div class="wd-art"><svg viewBox="0 0 220 170" role="img" aria-label="Pump, water line, taps and pressure transmitter">
     ${fanSVG('pd-fan', 40, 110, 24)}<text x="40" y="150" text-anchor="middle" class="svg-ar w-tx" style="font-size:9px;font-weight:700">Pump</text>
     <path d="M64 110H200" stroke="#7f8a92" stroke-width="8"/><path d="M200 110V60" stroke="#7f8a92" stroke-width="8"/>
     ${[100, 140, 180].map((x, i) => `<g><path d="M${x} 114V128" stroke="#7f8a92" stroke-width="5"/><path class="pd-drop" data-i="${i}" d="M${x} 132v12" stroke="var(--water)" stroke-width="4" stroke-linecap="round"/></g>`).join('')}
     <g transform="translate(120 70)"><circle r="20" fill="var(--panel)" stroke="var(--ink)" stroke-width="1.5"/><path class="pd-needle" d="M0 0L0 -15" stroke="var(--bad)" stroke-width="2.5" stroke-linecap="round"/><text y="14" text-anchor="middle" class="w-tx" style="font:700 8px var(--font-mono)">bar</text><path d="M0 20V40" stroke="#7f8a92" stroke-width="3"/></g>
     <text x="150" y="40" class="w-mu" style="font:600 9px var(--font-mono)">PT ⁦0–10 bar⁩</text>
     <rect x="6" y="10" width="92" height="42" rx="5" fill="#06130b"/><text class="pd-scr" x="92" y="30" text-anchor="end" style="font:700 13px var(--font-mono);fill:#4dff88">0.0 Hz</text><text class="pd-scr2" x="92" y="46" text-anchor="end" style="font:600 9px var(--font-mono);fill:#7aa08e"></text>
   </svg></div></div>
   <div class="wd-ctl"><label>Water demand (taps open): <b class="pd-dv"></b><input type="range" class="pd-d" min="0" max="100" step="5" value="30" aria-label="Demand %"></label>
     <label>Kp (gain): <b class="pd-kv"></b><input type="range" class="pd-k" min="1" max="40" step="1" value="30" aria-label="Kp"></label>
     <label>Ti (integral time): <b class="pd-iv"></b><input type="range" class="pd-i" min="0.2" max="10" step="0.1" value="0.3" aria-label="Ti seconds"></label></div>
   <div class="read"><div><span>SP pressure set point</span><b>4.0 bar</b></div><div><span>PV actual pressure</span><b class="pd-pv"></b></div><div><span>Transmitter signal</span><b class="pd-ma"></b></div><div><span>Pump frequency</span><b class="pd-f"></b></div></div>
   <p class="msg pd-msg" aria-live="polite"></p>
   <p class="chal pd-chal">Challenge: change the demand (open or close taps by at least 20 %) and hold the pressure at <span class="eq">4 ± 0.15 bar</span> for <b>8 seconds</b>. The current settings oscillate, so tune Kp and Ti first.</p>`;
  const q = s => $(s, host), fin = chal(host, '.pd-chal', opt.lesson, opt.task || 'pid');
  q('.pd-d').addEventListener('input', e => { S.D = +e.target.value / 100; if (Math.abs(S.D - S.D0) >= 0.2){ S.stepped = true; S.D0 = S.D; } S.hold = 0; ui(); });
  q('.pd-k').addEventListener('input', e => { S.kp = +e.target.value; S.hold = 0; ui(); });
  q('.pd-i').addEventListener('input', e => { S.ti = +e.target.value; S.hold = 0; ui(); });
  let tick = 0, drop = 0;
  function frame(dt){
    let sim = dt; while (sim > 0){ const d = Math.min(0.02, sim); VF.pidStep(S, d); S.t += d; sim -= d; }
    if (!S.hist.length || S.t - S.hist[S.hist.length - 1][0] >= 0.1){ S.hist.push([S.t, S.p, S.f]); if (S.hist.length > 300) S.hist.shift(); }
    if (S.stepped && Math.abs(S.p - S.sp) <= 0.15){ S.hold += dt; if (S.hold >= 8) fin(); } else S.hold = 0;
    drop = (drop + dt * 3) % 1;
    if (!reduced()) q('.pd-fan').setAttribute('transform', `rotate(${((S.t * S.f * 14) % 360).toFixed(1)})`);
    if (++tick % 3 === 0) ui();
  }
  function ui(){
    const t1 = S.t, t0 = Math.max(0, t1 - 30);
    const h = S.hist.filter(x => x[0] >= t0);
    q('.pd-g').innerHTML = plot({W:360, H:170, xr:[t0, Math.max(t0 + 30, t1)], yr:[0, 7], yt:[0, 2, 4, 6], y2:{r:[0, 60], t:[0, 25, 50], col:'var(--cur)'}, hl:[{y:4, col:'var(--good)', lab:'SP'}],
      series:[{pts:h.map(x => [x[0], x[2]]), col:'var(--cur)', w:1.6, y2:true}, {pts:h.map(x => [x[0], x[1]]), col:'var(--bad)', w:2.4}], ylab:'bar', xlab:'last 30 seconds', legend:'<tspan fill="var(--bad)">━ Pressure</tspan>  <tspan fill="var(--cur)">━ Frequency Hz</tspan>'});
    q('.pd-dv').textContent = Math.round(S.D * 100) + ' %'; q('.pd-kv').textContent = S.kp + ' Hz/bar'; q('.pd-iv').textContent = fmt(S.ti, 1) + ' s';
    q('.pd-pv').textContent = fmt(S.p, 2) + ' bar'; q('.pd-ma').textContent = fmt(4 + clamp(S.pm, 0, 10) / 10 * 16, 2) + ' mA'; q('.pd-f').textContent = S.sleep ? 'Sleep' : fmt(S.f, 1) + ' Hz';
    q('.pd-scr').textContent = S.sleep ? 'SLEEP' : fmt(S.f, 1) + ' Hz'; q('.pd-scr2').textContent = 'PV ' + fmt(S.pm, 2) + ' bar';
    q('.pd-needle').setAttribute('transform', `rotate(${(-120 + clamp(S.p, 0, 8) / 8 * 240).toFixed(0)})`);
    $$('.pd-drop', host).forEach((d, i) => { d.style.opacity = S.D > i / 3 + 0.02 ? 1 : 0; d.setAttribute('transform', `translate(0 ${((drop + i * 0.3) % 1 * 6).toFixed(1)})`); });
    const amp = (() => { const r = S.hist.slice(-60).map(x => x[1]); return r.length ? Math.max(...r) - Math.min(...r) : 0; })();
    const m = q('.pd-msg'); let t = '', c = '';
    if (VF.has(opt.lesson, 'pid') && S.hold >= 8){ t = '✓ The pressure is steady and the pump changes its speed by itself to match demand. That is the PID in the drive.'; c = 'ok'; }
    else if (S.sleep) t = 'No demand and the pump is at minimum speed ⇒ it went to <b>sleep</b> to save energy. It will wake up when the pressure drops.';
    else if (amp > 0.6) t = `The pressure oscillates <span class="eq">±${fmt(amp / 2, 1)} bar</span>: Kp is too high or Ti too short, so the controller overcorrects. Lower Kp and lengthen Ti.`;
    else if (Math.abs(S.p - S.sp) > 0.3 && S.f >= 49.5) t = 'The pump is at maximum speed and cannot keep up with the demand.';
    else if (!S.stepped) t = 'Good. Now change the demand by at least 20 % and see if the controller brings the pressure back.';
    else t = S.hold > 0 ? `Steady for <span class="eq">${fmt(S.hold, 1)} s</span>…` : 'The pressure is far from the SP. If it is too slow, raise Kp or shorten Ti a little.';
    m.className = 'msg pd-msg ' + c; m.innerHTML = t;
  }
  ui(); animate(host, frame);
  return {S, set(o){ Object.assign(S, o); ui(); }, run(sec){ for (let t = 0; t < sec; t += 0.05) frame(0.05); }};
};
VF.APPS = [
  ['A building water pump (constant pressure)', 'PID with a pressure transmitter signal + sleep/wake', ['Accel time = 0.5 s so it keeps up', 'Vector with encoder', 'A large braking resistor']],
  ['A large fan that may already be windmilling before start', 'Flying start (catches the spinning motor) + quadratic V/f', ['Long DC injection', 'Zero accel time', 'Reverse']],
  ['A hoist or goods lift', 'Mechanical brake control from a drive relay + braking resistor + vector', ['Quadratic V/f', 'Sleep mode', 'Coast to stop']],
  ['A conveyor carrying glass', 'Smooth accel and decel (S-curve) so the load does not slide', ['Coast to stop', 'Carrier 2 kHz', 'Max speed 100 Hz']],
  ['A heavy centrifuge', 'Long decel or a braking resistor because of OV', ['Very short accel', 'Disable the overload', 'Quadratic V/f']],
  ['A pump drawing from a well that may run dry', 'Underload alarm / dry-run protection', ['More boost', 'Flying start', 'S-curve']],
  ['A compressor that starts against pressure', 'High starting torque (vector / boost) and a minimum speed', ['Sleep straight away', 'Zero decel', 'Quadratic V/f']]
];
VF.appGen = function(){ const a = pick(VF.APPS); return {q:`Application: <b>${a[0]}</b>. The most important setting?`, o:[a[1]].concat(a[2]), a:0, why:a[1] + '.'}; };

/* ======================================================================
   L11: DC bus discharge and lockout
   ====================================================================== */
VF.discharge = function(host, opt){
  opt = opt || {};
  const S = {on:true, v:565, t:0, meas:null, measLow:false, warned:false, open:false};
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg viewBox="0 0 240 160" role="img" aria-label="Drive and multimeter on the DC bus terminals">
     <rect x="10" y="10" width="120" height="140" rx="8" fill="#2a3238" stroke="#11161a"/><rect x="24" y="22" width="92" height="28" rx="4" fill="#06130b"/><text class="ds-scr" x="110" y="42" text-anchor="end" style="font:700 13px var(--font-mono);fill:#4dff88">0.00</text>
     <circle class="ds-led" cx="34" cy="66" r="5" fill="#ff5a3c"/><text x="44" y="70" style="font:600 8px var(--font-mono);fill:#c9d1d6">CHARGE</text>
     <rect x="24" y="112" width="92" height="26" rx="3" fill="#1a1f23"/><text x="46" y="108" style="font:700 8px var(--font-mono);fill:var(--bad)">DC+</text><text x="86" y="108" style="font:700 8px var(--font-mono);fill:#4cc0cf">DC−</text><circle cx="52" cy="125" r="5" fill="#9aa4ac"/><circle cx="92" cy="125" r="5" fill="#9aa4ac"/>
     <path d="M52 125C52 150 170 150 176 110" fill="none" stroke="#d32f2f" stroke-width="2.5"/><path d="M92 125C92 156 196 156 200 110" fill="none" stroke="#222" stroke-width="2.5"/>
     <rect x="160" y="16" width="70" height="96" rx="10" fill="#f2b705" stroke="#8a6a00"/><rect x="168" y="24" width="54" height="26" rx="3" fill="#c7d3b4"/><text class="ds-mm" x="218" y="43" text-anchor="end" style="font:700 12px var(--font-mono);fill:#1b2410">----</text><text x="195" y="66" text-anchor="middle" style="font:700 9px var(--font-mono);fill:#1b2410">V DC</text><circle cx="195" cy="88" r="12" fill="#2a3035"/>
   </svg></div>
   <div><div class="read sm"><div><span>Time since switch-off</span><b class="ds-t">—</b></div><div><span>Last reading</span><b class="ds-m">—</b></div></div>
   <div class="wd-ctl" style="margin-top:8px"><button type="button" class="btn ds-off">Switch off and lock the breaker (LOTO)</button><button type="button" class="btn ds-meas">Measure DC+ to DC−</button><button type="button" class="btn pri ds-open">Open the cover and start work</button><button type="button" class="btn ds-rst">Start over</button></div></div></div>
   <p class="msg ds-msg" aria-live="polite">The drive is on. You want to change a wire on the power terminals.</p>
   <p class="chal ds-chal">Challenge: switch off, wait, and measure for yourself that the voltage is <b>below <span class="eq">50 V</span></b> before you open it. (Time runs 20 times faster here.)</p>`;
  const q = s => $(s, host), fin = chal(host, '.ds-chal', opt.lesson, opt.task || 'dc');
  const msg = (t, c) => { const m = q('.ds-msg'); m.className = 'msg ds-msg ' + (c || ''); m.innerHTML = t; };
  q('.ds-off').addEventListener('click', () => { if (!S.on) return; S.on = false; S.t = 0; msg('Power is off and the breaker is locked and tagged. The display went dark… but look at the CHARGE lamp.'); });
  q('.ds-meas').addEventListener('click', () => { S.meas = S.v; if (!S.on && S.v < 50) S.measLow = true; ui(); msg(S.on ? 'The drive is still on: the DC bus is at about <span class="eq">565 V</span>.' : S.v >= 50 ? `There is still <b class="eq">${Math.round(S.v)} V DC</b>! That can kill. Wait longer.` : `<span class="eq">${Math.round(S.v)} V</span>: below 50 V. It is safe to open now.`, !S.on && S.v < 50 ? 'ok' : S.on ? '' : 'bad'); });
  q('.ds-open').addEventListener('click', () => {
    if (S.on){ msg('<b>No!</b> The power is still connected. Switch off first.', 'bad'); return; }
    if (S.v >= 50){ msg(`<b>Danger!</b> You opened it while the capacitors still hold <span class="eq">${Math.round(S.v)} V DC</span>. A dark display does not mean the voltage is gone. Start over.`, 'bad'); S.warned = true; return; }
    if (!S.measLow){ msg('The voltage really is low, but <b>you did not measure</b>. The rule: do not trust the clock or the lamp, measure it yourself.', 'bad'); return; }
    msg('✓ Exactly: switch off and lock, wait the discharge time, and measure yourself before you touch. That is right every time.', 'ok'); fin();
  });
  q('.ds-rst').addEventListener('click', () => { Object.assign(S, {on:true, v:565, t:0, meas:null, measLow:false}); ui(); msg('The drive is on again.'); });
  function frame(dt){ if (!S.on){ S.t += dt * 20; S.v = 565 * Math.exp(-S.t / 75); } ui(); }
  function ui(){
    q('.ds-scr').textContent = S.on ? '0.00' : S.v > 300 && S.t < 3 ? '- - -' : ''; q('.ds-led').setAttribute('opacity', S.v > 30 ? 1 : 0.15);
    q('.ds-t').textContent = S.on ? 'On' : (S.t >= 60 ? Math.floor(S.t / 60) + ' min ' : '') + Math.floor(S.t % 60) + ' s';
    q('.ds-m').textContent = S.meas == null ? '—' : Math.round(S.meas) + ' V'; q('.ds-mm').textContent = S.meas == null ? '----' : Math.round(S.meas);
  }
  ui(); animate(host, frame);
  return {S, wait(sec){ S.t += sec; S.v = 565 * Math.exp(-S.t / 75); ui(); }};
};
VF.derateGen = function(){
  const I = pick([10, 17, 24, 32, 45, 60]);
  if (Math.random() < 0.5){ const alt = pick([1500, 2000, 2500, 3000]); const k = 1 - (alt - 1000) / 100 * 0.01, v = I * k; return {q:`A drive rated <b class="eq">${I} A</b> will be installed at <b class="eq">${alt} m</b> altitude. If the catalogue says <b>1 % per 100 m above 1000 m</b>, what is the maximum current you can draw?`, input:true, unit:'A', check:x => Math.abs(x - v) <= 0.15, ans:fmt(v, 1) + ' A', why:`<span class="eq">${(alt - 1000) / 100} % ⇒ ${I} × ${fmt(k, 2)} = ${fmt(v, 1)} A</span>.`}; }
  const T = pick([45, 50, 55]); const k = 1 - (T - 40) * 0.02, v = I * k;
  return {q:`A drive rated <b class="eq">${I} A</b> up to <span class="eq">40 °C</span>. Inside the panel it reaches <b class="eq">${T} °C</b>, and the catalogue says <b>2 % per degree above 40</b>. What is the maximum current?`, input:true, unit:'A', check:x => Math.abs(x - v) <= 0.15, ans:fmt(v, 1) + ' A', why:`<span class="eq">${(T - 40) * 2} % ⇒ ${I} × ${fmt(k, 2)} = ${fmt(v, 1)} A</span>.`};
};

/* ======================================================================
   L10: fault cases
   ====================================================================== */
VF.FAULTS = [
  {code:'OC', t:'Overcurrent on start', s:'A drive on a heavy conveyor trips on <b>OC</b> in the first second after Start, every time.', clues:[['Parameters', 'Accel time is set to <span class="eq">0.5 s</span> from 0 to 50 Hz.'], ['Motor insulation', 'Megger on the motor (cable disconnected from the drive): over 100 MΩ. Healthy.']], o:['The accel time is far too short for this load', 'The supply voltage is high', 'The fan is broken', 'The speed signal is broken'], a:0, why:'To accelerate a heavy load in half a second it needs more current than the drive limit. Lengthen the accel (for example 5–10 s) or use vector after an autotune.'},
  {code:'OC', t:'OC as soon as you press Start, even with no load', s:'The drive trips on <b>OC</b> instantly when you give it Start, even with the motor uncoupled from the load.', clues:[['Cable megger', 'Between phase V and earth: <span class="eq">0.2 MΩ</span>. The cable runs in a trench that had water in it.'], ['Accel', '10 seconds.']], o:['A short or failed insulation in the motor cable', 'The accel is long', 'The load is heavy', 'The PID is set wrong'], a:0, why:'Current leaks to earth or between phases from the very first pulse. Repair or replace the cable. (And a tip: always megger with the cable disconnected from the drive.)'},
  {code:'OV', t:'Overvoltage while stopping', s:'A large extract fan trips on <b>OV</b> every time you stop it, and the trip happens halfway through the decel.', clues:[['Parameters', 'Decel = <span class="eq">3 s</span>. No braking resistor.'], ['Supply voltage', '<span class="eq">398 V</span>, normal.']], o:['Energy coming back from the fan raises the DC bus: lengthen the decel, add a braking resistor or coast', 'The supply voltage is high', 'The motor is hot', 'The cable is long'], a:0, why:'The heavy fan drives the motor as a generator while stopping. A longer decel, a braking resistor or coast to stop (a fan does not need to stop fast).'},
  {code:'UV', t:'Undervoltage at night', s:'A drive trips on <b>UV</b> once or twice a day, right when they start a large compressor in the same plant.', clues:[['Supply measurement', 'The voltage drops to <span class="eq">320 V</span> the moment the compressor starts DOL.']], o:['A dip in the supply voltage', 'The motor is faulty', 'The accel is short', 'Earthing'], a:0, why:'The DC bus drops with the supply. The fix is on the supply side (start the compressor with a soft starter), or enable ride-through / auto restart in the drive if suitable.'},
  {code:'PHL', t:'Input phase loss', s:'The drive shows an <b>input phase loss</b> fault when the load rises, and the drive is noisy.', clues:[['Input measurement', 'L1-L2 <span class="eq">400 V</span> · L2-L3 <span class="eq">230 V</span> · L1-L3 <span class="eq">232 V</span>.'], ['Fuses', 'The L3 fuse looks dark.']], o:['The L3 fuse has blown', 'The motor has a short', 'The decel is short', 'A broken 4–20 signal'], a:0, why:'A missing phase = heavy ripple on the DC bus and stressed capacitors. Replace the fuse and find out why it blew.'},
  {code:'OPL', t:'Output phase loss', s:'The motor hums and will not start, and the drive shows <b>output phase loss</b>.', clues:[['Output current', 'U <span class="eq">9 A</span> · V <span class="eq">0 A</span> · W <span class="eq">9 A</span>.'], ['Terminal box', 'The V1 nut is loose and charred.']], o:['Terminal V is loose in the motor box', 'Supply voltage', 'The PID', 'The fan'], a:0, why:'An open phase on the output. Tighten it and replace the burnt terminal. (This can also happen if an output contactor is open.)'},
  {code:'OL', t:'Motor overload after an hour', s:'A pump trips on <b>motor OL</b> after about an hour of running, even though the current is <span class="eq">11 A</span> and the motor nameplate says <span class="eq">14.6 A</span>.', clues:[['Parameters', 'Motor rated current (motor FLA / OL current) is set to <span class="eq">10 A</span>.']], o:['The motor current in the parameters is lower than the nameplate', 'The pump needs a braking resistor', 'The supply is low', 'The cable is long'], a:0, why:'The drive calculates motor heating from the number you entered. Enter the correct nameplate current (14.6 A).'},
  {code:'OH', t:'Drive overtemperature: not in the morning, yes at noon', s:'The drive trips on <b>OH</b> (drive temperature) only in the afternoon, in summer.', clues:[['Fan', 'The drive fan runs, but the heatsink is covered in thick dust.'], ['Panel', 'The panel fan has stopped, the filter is blocked, and it is <span class="eq">52 °C</span> inside.']], o:['Ventilation: a blocked filter and a stopped panel fan', 'The motor', 'Supply voltage', 'The speed signal'], a:0, why:'A drive produces heat that has to get out. Clean the heatsink, change the filter and fix the panel fan, and derate if the temperature is high.'},
  {code:'GF', t:'Ground fault after rain', s:'The drive for a motor outside the building shows a <b>ground fault</b> after every rain.', clues:[['Motor megger', 'The motor alone: <span class="eq">0.5 MΩ</span> after rain and <span class="eq">200 MΩ</span> once it dries.']], o:['Water getting into the motor or the terminal box', 'The decel', 'The PID', 'The carrier'], a:0, why:'Moisture weakens the insulation and current leaks to earth. Seal the terminal box properly (gasket and the right cable gland) and dry the motor.'},
  {code:'AL', t:'The pump suddenly went to max speed / or stopped', s:'The drive takes its speed from a PLC over <b>4–20 mA</b>. Suddenly the drive shows an <b>analog signal loss</b> alarm.', clues:[['Signal measurement', 'At terminal AI2: <span class="eq">0.0 mA</span>. At the PLC output: <span class="eq">12 mA</span>.']], o:['The signal wire is broken between the PLC and the drive', 'The motor is faulty', 'The supply', 'The accel'], a:0, why:'The PLC is sending but it does not reach the drive ⇒ a broken wire or a loose terminal. And the “what to do if the signal is lost” setting (trip / safe speed) needs real thought.'},
  {code:'---', t:'The motor does not turn and the drive shows no fault', s:'The display says <b>Run</b> and the frequency is <span class="eq">0.00 Hz</span>. The run command from the terminals is working.', clues:[['Speed signal', 'AI1 = <span class="eq">0 V</span>.'], ['Speed source', 'The speed source parameter is set to analog AI1, and the pot is wired to AI2.']], o:['Wrong speed source (pot on AI2, parameter on AI1)', 'The motor is burnt', 'OV', 'The cable'], a:0, why:'Run with no speed reference = zero Hz. Make the speed source parameter match the terminal the pot is on.'},
  {code:'OC', t:'OC after they fitted an output contactor', s:'For “safety”, the technician fitted a contactor between the drive and the motor that opens on Stop. Since then: <b>OC</b>, and sometimes a blown IGBT.', clues:[['Inspection', 'The contactor opens and closes while the drive is still putting out voltage.']], o:['Opening and closing the contactor while the drive is running', 'The supply', 'The PID', 'The motor is small'], a:0, why:'An output contactor must only switch with the drive stopped (interlock it with a Run relay, or use STO for safety).'}
];

/* ---------------- hub drawings ---------------- */
VF.hubArt = () => [VF.art.drive({disp:'50.00'}), VF.art.motor(), VF.art.resistor()];

})();
