(function(){
'use strict';
const DR = window.DR = {};
const KEY = 'drw-lab-v1';

/* ---------------- store ---------------- */
function load(){ try { const s = JSON.parse(localStorage.getItem(KEY)); return s && typeof s === 'object' ? s : {}; } catch (e){ return {}; } }
let S = load(); if (!S.done || typeof S.done !== 'object') S.done = {};
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e){} }
const subs = [];
DR.on = fn => subs.push(fn);
DR.store = {
  has: k => !!S.done[k],
  mark(k){ if (S.done[k]) return false; const f = load(); S = Object.assign({}, f, S); S.done = Object.assign({}, f.done || {}, S.done); S.done[k] = Date.now(); save(); subs.forEach(fn => { try { fn(k); } catch (e){} }); return true; },
  get: k => S[k],
  set(k, v){ S[k] = v; save(); },
  reset(){ S = {done:{}}; save(); subs.forEach(fn => { try { fn(); } catch (e){} }); },
  reload(){ S = load(); if (!S.done) S.done = {}; }
};

/* ---------------- theme (applied before first paint: drawings.js loads in <head>) ---------------- */
function applyTheme(){ const t = S.theme; if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
applyTheme();
function isDark(){ const t = document.documentElement.getAttribute('data-theme'); if (t) return t === 'dark'; return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
function themeBtn(){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn theme-b';
  const upd = () => { const d = isDark(); b.textContent = d ? '☀' : '☾'; b.setAttribute('aria-label', d ? 'الوضع الفاتح' : 'الوضع الغامق'); b.title = b.getAttribute('aria-label'); };
  b.addEventListener('click', () => { DR.store.set('theme', isDark() ? 'light' : 'dark'); applyTheme(); upd(); });
  upd(); return b;
}

/* ---------------- course map ---------------- */
DR.COURSE = [
  {id:'l1', n:1, file:'lesson-01.html', title:'أنواع الرسومات الكهربية', sub:'الـ Single line ودايرة القوى ودايرة التحكم والـ Wiring والـ Terminal ورسمة اللوحة والـ P&ID وجدول الكابلات: كل واحدة بتجاوب على سؤال',
    tasks:[['types','جولة في الرسومات'],['which','أنهي رسمة أفتحها؟'],['quiz','أسئلة الدرس']]},
  {id:'l2', n:2, file:'lesson-02.html', title:'الرموز: IEC و ANSI/NEMA', sub:'الكونتاكتات NO و NC، الكويل، الزراير، السليكتور، الليميت، التايمر، الأوفرلود، القاطع، الفيوز، الموتور، المحوّل، اللمبات والحساسات',
    tasks:[['cards','كروت الرموز'],['match','تمرين طابق الرمز'],['quiz','أسئلة الدرس']]},
  {id:'l3', n:3, file:'lesson-03.html', title:'ترقيم الأجهزة والأطراف والكروس ريفرنس', sub:'تاجات ⁦-K1⁩ و ⁦-Q1⁩ و ⁦-F1⁩، أطراف ⁦13-14⁩ و ⁦21-22⁩ و ⁦A1-A2⁩ و ⁦95-96⁩، أرقام السلوك، والمرجع ⁦/3.4⁩',
    tasks:[['xref','نط بالكروس ريفرنس'],['num','تمرين الأرقام'],['quiz','أسئلة الدرس']]},
  {id:'l4', n:4, file:'lesson-04.html', title:'قراية دايرة التحكم', sub:'خطوة بخطوة في دايرة DOL ودايرة العكس، ومسار التيار وإنت بتدوس الزراير',
    tasks:[['dol','تشغيل دايرة DOL'],['rev','دايرة العكس والإنترلوك'],['quiz','أسئلة الدرس']]},
  {id:'l5', n:5, file:'lesson-05.html', title:'الـ Single line ودايرة القوى', sub:'من المحوّل للـ MDB للقواطع للـ MCC للموتور: الريتنج ومقاسات الكابلات على الرسمة',
    tasks:[['sld','اقرا الـ Single line'],['trace','من المحوّل للموتور'],['rate','تمرين الريتنج'],['quiz','أسئلة الدرس']]},
  {id:'l6', n:6, file:'lesson-06.html', title:'رسمة اللوحة والـ Terminal strip', sub:'الدين ريل والمجاري والأجهزة، الترمنالات ⁦X1⁩ و ⁦X2⁩، عروق الكابل والفيرول، وتتبّع سلك من الحساس للـ PLC',
    tasks:[['layout','استكشف اللوحة'],['follow','تتبّع السلك'],['quiz','أسئلة الدرس']]},
  {id:'l7', n:7, file:'lesson-07.html', title:'تتبّع العطل من الرسمة + الامتحان النهائي', sub:'العَرَض ← الرسمة ← نقطة القياس ← العطل، لعبة الأعطال، والامتحان النهائي',
    tasks:[['tgame','لعبة تتبّع الأعطال'],['quiz','أسئلة الدرس'],['final','الامتحان النهائي']]}
];
DR.lessonById = id => DR.COURSE.find(l => l.id === id);
DR.summary = id => { const l = DR.lessonById(id); const done = l.tasks.filter(t => DR.store.has(id + '/' + t[0])).length; return {done, total:l.tasks.length}; };
DR.mark = (lid, task) => DR.store.mark(lid + '/' + task);
DR.has = (lid, task) => DR.store.has(lid + '/' + task);
DR.allDone = () => DR.COURSE.every(l => { const s = DR.summary(l.id); return s.done === s.total; });

/* ---------------- helpers ---------------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
DR.esc = esc;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
DR.$ = $; DR.$$ = $$;
const fmt = (v, d) => { const p = Math.pow(10, d); const r = Math.round(v * p) / p; return (Object.is(r, -0) ? 0 : r).toFixed(d); };
DR.fmt = fmt;
function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
DR.shuffle = shuffle;
const pick = a => a[Math.floor(Math.random() * a.length)];
DR.pick = pick;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
DR.clamp = clamp;
const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
DR.reduced = reduced;
let uid = 0; const U = p => p + (++uid);
DR.uid = U;
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
DR.animate = animate;
/* tap/keyboard on [data-*] elements inside a host */
function onAct(host, sel, fn){
  host.addEventListener('click', e => { const t = e.target.closest(sel); if (t && host.contains(t)) fn(t, e); });
  host.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const t = e.target.closest(sel); if (t && host.contains(t) && t.tagName !== 'BUTTON' && t.tagName !== 'INPUT' && t.tagName !== 'SELECT'){ e.preventDefault(); fn(t, e); } });
}
DR.onAct = onAct;
const num = s => { const v = parseFloat(String(s).replace(',', '.').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))); return isFinite(v) ? v : NaN; };
DR.num = num;
function chal(host, sel, lesson, task){ const c = $(sel, host); if (c && DR.has(lesson, task)) c.classList.add('ok'); return () => { if (c) c.classList.add('ok'); DR.mark(lesson, task); }; }

/* ---------------- lesson shell ---------------- */
DR.lesson = function(id){
  const L = DR.lessonById(id); DR.cur = L;
  const ch = $('header.top .chips'); if (ch) ch.appendChild(themeBtn());
  const prog = $('#lprog');
  function renderProg(){
    if (!prog) return;
    const s = DR.summary(id), pct = Math.round(s.done / s.total * 100);
    prog.innerHTML = `<div class="row"><span>تقدّمك في الدرس: <b>${s.done} من ${s.total}</b></span><span class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="التقدّم ${pct}%"><i style="width:${pct}%"></i></span></div><ul>${L.tasks.map(t => `<li class="${DR.has(id, t[0]) ? 'ok' : ''}">${esc(t[1])}</li>`).join('')}</ul>`;
  }
  renderProg(); DR.on(renderProg);
  const nav = $('#lnav');
  if (nav){
    const i = DR.COURSE.indexOf(L), p = DR.COURSE[i - 1], n = DR.COURSE[i + 1];
    nav.innerHTML = (p ? `<a class="btn" href="${p.file}">→ الدرس ${p.n}: ${esc(p.title)}</a>` : `<a class="btn" href="index.html">→ صفحة الكورس</a>`) +
      (n ? `<a class="btn pri" href="${n.file}">الدرس ${n.n}: ${esc(n.title)} ←</a>` : `<a class="btn pri" href="index.html#certSec">الشهادة ←</a>`);
  }
  window.addEventListener('pageshow', e => { if (e.persisted){ DR.store.reload(); renderProg(); } });
};
DR.hubTheme = () => { const ch = $('header.top .chips'); if (ch) ch.appendChild(themeBtn()); };

/* ---------------- quiz ----------------
   qs: [{q, o:[...], a:index, why}] ; opt: {lesson, task, pass(0..1), row, shuffle} */
DR.quiz = function(host, qs, opt){
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
      const f = $('.qz-f', box); f.className = 'qz-f ' + (ok ? 'ok' : 'no'); f.innerHTML = (ok ? 'صح. ' : 'مش دي. ') + (it.q.why || '');
      if (ans.every(x => x != null)) finish();
      return;
    }
    if (e.target.closest('[data-qz=again]')) start();
  });
  function finish(){
    const n = ans.filter(Boolean).length, tot = ans.length, ok = n / tot >= pass - 1e-9;
    const sum = $('.qz-sum', host); sum.hidden = false; sum.className = 'qz-sum ' + (ok ? 'ok' : 'no');
    sum.innerHTML = `<b>نتيجتك: ${n} من ${tot}</b><span>${ok ? 'ممتاز، كده عدّيت ✓' : `محتاج ${Math.ceil(pass * tot - 1e-9)} صح على الأقل. راجع الشرح وجرّب تاني.`}</span><button type="button" class="btn" data-qz="again">${ok ? 'حلّ تاني' : 'جرّب تاني'}</button>`;
    if (ok && opt.lesson) DR.mark(opt.lesson, opt.task || 'quiz');
    if (opt.onDone) opt.onDone(n, tot, ok);
  }
  start();
  const api = {solve(wrong){ order.forEach((it, k) => { const i = wrong && k === 0 ? it.oi.find(j => j !== it.q.a) : it.q.a; const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }); return $('.qz-sum', host).textContent; }, answer(k, i){ const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }, order: () => order.map(x => x.q), restart: start};
  (DR._q = DR._q || []).push(api); api.host = host;
  return api;
};

/* ---------------- drill: a stream of generated questions ----------------
   gen() → {q (html), o:[...] , a:index, why}  or  {q, input:true, unit, check(v)→bool, ans (text), why}
   need: correct answers to finish the task */
DR.drill = function(host, gen, opt){
  opt = opt || {};
  const need = opt.need || 5;
  let ok = 0, tries = 0, cur = null, answered = false;
  host.innerHTML = `<div class="dr"><div class="dr-top"><span class="dr-sc" aria-live="polite"></span><span class="bar dr-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${need}" aria-label="الإجابات الصح"><i></i></span></div><div class="dr-card"></div><div class="dr-act"><button type="button" class="btn pri dr-next" hidden>السؤال اللي بعده ←</button></div><p class="chal dr-chal">${opt.goal || `جاوب <b>${need}</b> صح عشان التمرين يتعلّم عليه.`}</p></div>`;
  const fin = chal(host, '.dr-chal', opt.lesson, opt.task);
  const card = $('.dr-card', host), nx = $('.dr-next', host);
  function score(){ $('.dr-sc', host).innerHTML = `صح: <b>${ok}</b> من ${tries}`; const p = Math.min(1, ok / need) * 100; $('.dr-bar i', host).style.width = p + '%'; $('.dr-bar', host).setAttribute('aria-valuenow', Math.min(ok, need)); }
  function next(){
    cur = gen(); answered = false; nx.hidden = true;
    if (cur.input){
      card.innerHTML = `<div class="dr-q">${cur.q}</div><form class="dr-in"><input class="inp" inputmode="decimal" autocomplete="off" aria-label="إجابتك" placeholder="إجابتك"><span class="mono dr-u">${esc(cur.unit || '')}</span><button class="btn pri" type="submit">تأكيد</button></form><p class="qz-f" aria-live="polite"></p>`;
    } else {
      const oi = shuffle(cur.o.map((_, i) => i));
      card.innerHTML = `<div class="dr-q">${cur.q}</div><div class="qz-a${cur.row ? ' row' : ''}${cur.cls ? ' ' + cur.cls : ''}">${oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${cur.o[i]}</button>`).join('')}</div><p class="qz-f" aria-live="polite"></p>`;
    }
    score();
  }
  function result(good, chosen){
    answered = true; tries++; if (good) ok++;
    const f = $('.qz-f', card); f.className = 'qz-f ' + (good ? 'ok' : 'no');
    f.innerHTML = (good ? 'صح. ' : 'مش مظبوطة. ') + (cur.ans != null && !good ? `الإجابة: <b class="eq">${cur.ans}</b>. ` : '') + (cur.why || '');
    if (!cur.input) $$('.qz-o', card).forEach(x => { x.disabled = true; if (+x.dataset.i === cur.a) x.classList.add('ok'); else if (x === chosen) x.classList.add('no'); });
    else $$('input,button', card).forEach(x => x.disabled = true);
    score(); nx.hidden = false;
    if (ok >= need) fin();
    nx.focus({preventScroll:true});
  }
  card.addEventListener('click', e => { const b = e.target.closest('.qz-o'); if (b && !answered) result(+b.dataset.i === cur.a, b); });
  card.addEventListener('submit', e => { e.preventDefault(); if (answered) return; const v = num($('input', card).value); if (!isFinite(v)){ const f = $('.qz-f', card); f.className = 'qz-f no'; f.textContent = 'اكتب رقم.'; return; } result(!!cur.check(v)); });
  nx.addEventListener('click', next);
  next();
  return {get cur(){ return cur; }, answer(v){ if (cur.input){ $('input', card).value = v; $('.dr-in button', card).click(); } else { const b = card.querySelector(`.qz-o[data-i="${v}"]`); if (b) b.click(); } }, next, get ok(){ return ok; }};
};

/* ================= generic case game (encoder faults, field faults) =================
   cases: [{t (title), s (story html), clues:[[label, html]], o:[...], a, why}] */
DR.caseGame = function(host, cases, opt){
  opt = opt || {};
  const need = opt.need || Math.ceil(cases.length * 0.7);
  const order = shuffle(cases.map((_, i) => i)); let k = 0, ok = 0, ans = 0;
  host.innerHTML = `<div class="dr-top"><span class="cg-sc" aria-live="polite"></span><span class="bar"><i class="cg-bar"></i></span></div><div class="cg-card dr-card"></div><div class="dr-act"><button type="button" class="btn pri cg-next" hidden>اللي بعده ←</button></div><p class="chal cg-chal">${opt.goal || `حلّ <b>${need}</b> حالات صح على الأقل.`}</p>`;
  const q = s => $(s, host), fin = chal(host, '.cg-chal', opt.lesson, opt.task), card = q('.cg-card');
  function score(){ q('.cg-sc').innerHTML = `الحالة <b>${Math.min(k + 1, cases.length)}</b> من ${cases.length} · صح: <b>${ok}</b>`; q('.cg-bar').style.width = (ok / need * 100 > 100 ? 100 : ok / need * 100) + '%'; }
  function show(){
    const c = cases[order[k]], oi = shuffle(c.o.map((_, i) => i));
    card.innerHTML = `<h4>${c.t}</h4><div class="dr-q" style="font-weight:500">${c.s}</div>${c.clues && c.clues.length ? `<div class="chips-t">${c.clues.map((cl, i) => `<button type="button" class="btn" data-cl="${i}" aria-expanded="false">افحص: ${cl[0]}</button>`).join('')}</div><div class="cg-clue"></div>` : ''}<p style="margin:4px 0 0;font-weight:600">السبب غالبًا إيه؟</p><div class="qz-a">${oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${c.o[i]}</button>`).join('')}</div><p class="qz-f" aria-live="polite"></p>`;
    q('.cg-next').hidden = true; ans = 0; score();
  }
  card.addEventListener('click', e => {
    const cl = e.target.closest('[data-cl]');
    if (cl){ const c = cases[order[k]], x = c.clues[+cl.dataset.cl]; $$('[data-cl]', card).forEach(b => b.setAttribute('aria-expanded', String(b === cl))); $('.cg-clue', card).innerHTML = `<div class="box" style="margin-top:6px">${x[1]}</div>`; return; }
    const b = e.target.closest('.qz-o'); if (!b || ans) return;
    const c = cases[order[k]], good = +b.dataset.i === c.a; ans = 1; if (good) ok++;
    $$('.qz-o', card).forEach(x => { x.disabled = true; if (+x.dataset.i === c.a) x.classList.add('ok'); else if (x === b) x.classList.add('no'); });
    const f = $('.qz-f', card); f.className = 'qz-f ' + (good ? 'ok' : 'no'); f.innerHTML = (good ? 'صح. ' : 'مش ده. ') + c.why;
    score(); if (ok >= need) fin();
    const nx = q('.cg-next'); nx.hidden = false;
    nx.textContent = k + 1 < cases.length ? 'الحالة اللي بعدها ←' : (ok >= need ? 'العب تاني' : 'جرّب تاني من الأول');
  });
  q('.cg-next').addEventListener('click', () => { if (k + 1 < cases.length) k++; else { k = 0; ok = 0; order.sort(() => Math.random() - 0.5); } show(); });
  show();
  return {get cur(){ return cases[order[k]]; }, answer(i){ const b = card.querySelector(`.qz-o[data-i="${i}"]`); if (b) b.click(); }, next(){ q('.cg-next').click(); }, get ok(){ return ok; }};
};

/* ================= symbol library =================
   IEC bodies are drawn vertical (current flows top → bottom, y from −15 to +15).
   ANSI/NEMA bodies are drawn horizontal (current flows left → right, x from −15 to +15).
   DR.sym() transposes a body (matrix 0 1 1 0) when it is used in the other direction. */
const P = (d, c) => `<path class="${c || 'dk'}" d="${d}"/>`;
const Ci = (x, y, r, c) => `<circle class="${c || 'dk'}" cx="${x}" cy="${y}" r="${r}"/>`;
const Re = (x, y, w, h, c) => `<rect class="${c || 'dk'}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const DASH = d => P(d, 'dk thin dash');
const iNO = P('M0 -15V-9M0 15V9M0 9L-9 -11'), iNC = P('M0 -15V-9H9M0 15V9M0 9L10.5 -13');
const iBtn = Re(-18, -6, 0.01, 10, 'dk') + P('M-14 -6H-18V4H-14');
const iTherm = P('M-12 -1V-5H-16V3H-20V-1');
const aNO = P('M-15 0H-5M5 0H15M-5 -8V8M5 -8V8'), aNCx = P('M-9 9L9 -9');
const aSq = P('M-6 -14q3 -5 6 0t6 0');
const SY = DR.SY = {
  iec:{
    no:iNO,
    nc:iNC,
    pbno:iNO + DASH('M-4.5 -1H-14') + iBtn,
    pbnc:iNC + DASH('M5.2 -2H-14') + P('M-14 -7H-18V3H-14'),
    estop:iNC + DASH('M5.2 -2H-13') + P('M-13 -10V6A8 8 0 0 1 -13 -10Z'),
    sel:iNO + DASH('M-4.5 -1H-13') + P('M-13 -5H-17V3H-21'),
    lsno:iNO + P('M-4.5 -1L-12 -5.5V3.5Z'),
    lsnc:iNC + P('M5.2 -2L-2.5 -6.5V2.5Z'),
    prox:iNO + DASH('M-4.5 -1H-12') + P('M-17.5 -6.5L-12 -1L-17.5 4.5L-23 -1Z') + P('M-20 -1H-15'),
    coil:P('M0 -15V-8M0 15V8') + Re(-15, -8, 30, 16, 'dk coilf'),
    tcoil:P('M0 -15V-8M0 15V8') + Re(-11, -8, 26, 16, 'dk coilf') + Re(-23, -8, 12, 16, 'dk coilf') + P('M-23 -8L-11 8M-11 -8L-23 8'),
    tno:iNO + P('M-4 -3H-11M-5 1H-11') + P('M-11 -7A6 6 0 0 0 -11 5'),
    tnc:iNC + P('M5 -4H-9M5 0H-9') + P('M-9 -8A6 6 0 0 0 -9 4'),
    olt:P('M0 -15V-8M0 15V8') + Re(-7, -8, 14, 16, 'dk coilf') + P('M0 -8V-3H-3.5V3H0V8'),
    olc:iNC + DASH('M5.2 -2H-12') + iTherm,
    olo:iNO + DASH('M-4.5 -1H-12') + iTherm,
    cb:P('M0 -15V-9M0 15V9M0 9L-9 -11M-3 -12L3 -6M3 -12L-3 -6') + DASH('M-4.5 -1H-12') + Re(-18, -4, 6, 6),
    kno:iNO + P('M-3.4 -9A3.4 3.4 0 0 0 3.4 -9'),
    disc:iNO + P('M-4 -9H4'),
    fuse:Re(-4.5, -11, 9, 22, 'dk coilf') + P('M0 -15V15'),
    motor:P('M0 -15V-13') + Ci(0, 0, 13, 'dk coilf'),
    tr:P('M0 -15V-12M0 15V12') + Ci(0, -4.5, 7.5, 'dk') + Ci(0, 4.5, 7.5, 'dk'),
    lamp:P('M0 -15V-9M0 15V9') + Ci(0, 0, 9, 'dk lampf') + P('M-6.4 -6.4L6.4 6.4M6.4 -6.4L-6.4 6.4'),
    wire:P('M0 -15V15')
  },
  ansi:{
    no:aNO,
    nc:aNO + aNCx,
    pbno:P('M-15 3H-11.2M11.2 3H15') + Ci(-9, 3, 2.2) + Ci(9, 3, 2.2) + P('M-11 -4H11M0 -4V-11M-4 -11H4'),
    pbnc:P('M-15 -3H-11.2M11.2 -3H15') + Ci(-9, -3, 2.2) + Ci(9, -3, 2.2) + P('M-11 0.5H11M0 0.5V-11M-4 -11H4'),
    estop:P('M-15 -3H-11.2M11.2 -3H15') + Ci(-9, -3, 2.2) + Ci(9, -3, 2.2) + P('M-11 0.5H11M0 0.5V-9') + P('M-7 -9A7 7 0 0 1 7 -9Z'),
    sel:P('M-15 2H-11.2M11.2 2H15') + Ci(-9, 2, 2.2) + Ci(9, 2, 2.2) + P('M-9 2L8 -7') + P('M-4 -11A6 6 0 0 1 4 -11'),
    lsno:P('M-15 2H-12.2M12.2 2H15') + Ci(-10, 2, 2.2) + Ci(10, 2, 2.2) + P('M-10 2L10 -7') + P('M-1 -2.5L1 4.5L-4 4.5Z'),
    lsnc:P('M-15 -2H-12.2M12.2 -2H15') + Ci(-10, -2, 2.2) + Ci(10, -2, 2.2) + P('M-10 -2L12 5') + P('M1 1.5L-1 -5.5L4 -5.5Z'),
    prox:P('M-15 0H-5M5 0H15M-5 -6V6M5 -6V6') + P('M0 -13L13 0L0 13L-13 0Z', 'dk thin'),
    coil:P('M-15 0H-11M11 0H15') + Ci(0, 0, 11, 'dk coilf'),
    tcoil:P('M-15 0H-11M11 0H15') + Ci(0, 0, 11, 'dk coilf'),
    tno:aNO + P('M-7 15Q0 6 7 15M0 9V5'),
    tnc:aNO + aNCx + P('M-7 15Q0 6 7 15M0 9V5'),
    olt:P('M-15 0H-9C-9 -9 0 -9 0 0S9 9 9 0H15'),
    olc:aNO + aNCx + aSq,
    olo:aNO + aSq,
    cb:P('M-15 3H-12.2M12.2 3H15') + Ci(-10, 3, 2.2) + Ci(10, 3, 2.2) + P('M-11 -1Q0 -15 11 -1'),
    kno:aNO,
    disc:aNO,
    fuse:P('M-15 0H-10C-6 -10 -1 -10 0 0S6 10 10 0H15'),
    motor:P('M-15 0H-13') + Ci(0, 0, 13, 'dk coilf'),
    tr:P('M-15 -5a3.75 3.75 0 0 1 7.5 0a3.75 3.75 0 0 1 7.5 0a3.75 3.75 0 0 1 7.5 0a3.75 3.75 0 0 1 7.5 0M-15 -5V-12M15 -5V-12') + P('M-15 0H15M-15 2.5H15', 'dk thin') + P('M-15 7.5a3.75 3.75 0 0 0 7.5 0a3.75 3.75 0 0 0 7.5 0a3.75 3.75 0 0 0 7.5 0a3.75 3.75 0 0 0 7.5 0M-15 7.5V14M15 7.5V14'),
    lamp:P('M-15 0H-9M9 0H15') + Ci(0, 0, 9, 'dk lampf') + P('M-12.5 -12.5L-8.5 -8.5M12.5 -12.5L8.5 -8.5M-12.5 12.5L-8.5 8.5M12.5 12.5L8.5 8.5'),
    wire:P('M-15 0H15')
  }
};
/* letters drawn upright on top of a body (never transposed) */
const SYTXT = {
  iec:{motor:'<text class="dt" x="0" y="-1" text-anchor="middle" style="font-size:11px">M</text><text class="dt" x="0" y="9" text-anchor="middle" style="font-size:8px">3~</text>'},
  ansi:{motor:'<text class="dt" x="0" y="4" text-anchor="middle" style="font-size:9px">MTR</text>', coil:'<text class="dt" x="0" y="3.5" text-anchor="middle" style="font-size:9px">CR</text>', tcoil:'<text class="dt" x="0" y="3.5" text-anchor="middle" style="font-size:9px">TR</text>', lamp:'<text class="dt" x="0" y="3.5" text-anchor="middle" style="font-size:9px">R</text>', olt:'', prox:''}
};
const NATIVE = {iec:'v', ansi:'h'};
/* body of symbol k in standard std at (x, y), flow direction dir ('v' or 'h'); txt: letters override */
DR.sym = function(std, k, x, y, dir, txt){
  const b = (SY[std] || SY.iec)[k] || SY.iec[k] || '';
  const tr = (dir || NATIVE[std]) !== NATIVE[std];
  const t = txt != null ? txt : ((SYTXT[std] || {})[k] || '');
  return `<g transform="translate(${x} ${y})">${tr ? `<g transform="matrix(0 1 1 0 0 0)">${b}</g>` : b}${t}</g>`;
};
/* standalone figure of one symbol (flashcards, drills) */
DR.symFig = function(std, k, opt){
  opt = opt || {}; const dir = opt.dir || NATIVE[std];
  const vb = dir === 'v' ? '-34 -26 68 52' : '-34 -22 68 44';
  return `<svg viewBox="${vb}" role="img" aria-label="${esc(opt.label || '')}">${DR.sym(std, k, 0, 0, dir, opt.txt)}</svg>`;
};
/* three single-pole bodies side by side (power circuits), with a dashed mechanical link */
DR.pole3 = function(k, x, y, pitch, link, std){
  pitch = pitch || 24; let s = '';
  for (let i = 0; i < 3; i++) s += DR.sym(std || 'iec', k, x + i * pitch, y, 'v');
  if (link !== false) s += P(`M${x - 4.5} ${y - 1}H${x + 2 * pitch - 4.5}`, 'dk thin dash');
  return s;
};

/* ================= zoom / pan viewer =================
   DR.viewer(host, {w, h, svg, title, maxH, minH, hint})
   Pinch or drag with two fingers / the +/− buttons / ctrl+wheel / arrow keys. At "fit" the page scrolls normally. */
DR.viewer = function(host, o){
  o = o || {};
  host.classList.add('vw');
  host.innerHTML = `<div class="vw-bar"><span class="vw-t">${o.title || ''}</span><span class="vw-z" aria-live="polite">100%</span><button type="button" class="btn" data-z="out" aria-label="تصغير">−</button><button type="button" class="btn" data-z="in" aria-label="تكبير">+</button><button type="button" class="btn" data-z="fit" aria-label="الرسمة كلها" title="الرسمة كلها">⤢</button></div><div class="vw-port" tabindex="0" role="group" aria-label="${esc(o.label || 'رسمة: كبّر وحرّك')}"></div>${o.hint === false ? '' : `<p class="vw-hint">${o.hint || 'كبّر بصباعين أو بزرار <b>+</b>، وحرّك الرسمة بصباعك لما تكون مكبّرة. زرار <b>⤢</b> بيرجّعها كاملة.'}</p>`}`;
  const port = $('.vw-port', host), zl = $('.vw-z', host);
  let W = o.w, H = o.h, svg, cw = 1, ch = 1, s0 = 1, s = 1, cx = W / 2, cy = H / 2, anim = 0;
  function setSvg(markup, w, h){
    if (w){ W = w; H = h; }
    port.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${markup}</svg>`;
    svg = port.firstChild; size(true);
  }
  function portH(w){
    const maxH = o.maxH || Math.min(620, Math.max(300, (window.innerHeight || 800) * 0.72)), minH = o.minH || 220;
    return Math.round(clamp(w * H / W, minH, maxH));
  }
  function size(reset){
    const w = port.clientWidth || 340; port.style.height = portH(w) + 'px';
    cw = w; ch = port.clientHeight || portH(w);
    const ratio = s / s0; s0 = Math.min(cw / W, ch / H);
    if (reset){ s = s0; cx = W / 2; cy = H / 2; } else s = s0 * ratio;
    apply();
  }
  const smax = () => Math.max(s0 * 6, 3);
  function clampC(){
    const vw = cw / s, vh = ch / s;
    cx = vw >= W ? W / 2 : clamp(cx, vw / 2, W - vw / 2);
    cy = vh >= H ? H / 2 : clamp(cy, vh / 2, H - vh / 2);
  }
  function apply(){
    s = clamp(s, s0, smax()); clampC();
    const vw = cw / s, vh = ch / s;
    if (svg){ svg.setAttribute('viewBox', `${(cx - vw / 2).toFixed(2)} ${(cy - vh / 2).toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}`); }
    const z = s / s0; zl.textContent = Math.round(z * 100) + '%';
    port.classList.toggle('zoomed', z > 1.01);
  }
  function zoomAt(f, px, py){ /* px,py: point in port pixels */
    const vw = cw / s, vh = ch / s;
    const ux = cx - vw / 2 + px / s, uy = cy - vh / 2 + py / s;
    const ns = clamp(s * f, s0, smax());
    cx = ux - (px - cw / 2) / ns; cy = uy - (py - ch / 2) / ns; s = ns; apply();
  }
  function animTo(ncx, ncy, ns){
    cancelAnimationFrame(anim);
    if (reduced()){ cx = ncx; cy = ncy; s = ns; apply(); return; }
    const a = {cx, cy, s}, t0 = performance.now(), dur = 380;
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; cx = a.cx + (ncx - a.cx) * e; cy = a.cy + (ncy - a.cy) * e; s = a.s * Math.pow(ns / a.s, e); apply(); if (k < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-z]'); if (!b) return;
    const z = b.dataset.z;
    if (z === 'fit') animTo(W / 2, H / 2, s0);
    else animTo(cx, cy, clamp(s * (z === 'in' ? 1.6 : 1 / 1.6), s0, smax()));
  });
  /* pointers: pan with one, pinch with two */
  const pts = new Map(); let moved = 0, start = null, suppress = false;
  const rel = e => { const r = port.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  port.addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button > 0) return;
    pts.set(e.pointerId, rel(e)); moved = 0; suppress = false;
    start = {cx, cy, s, list:[...pts.values()].map(p => p.slice())};
    if (pts.size === 2){ try { [...pts.keys()].forEach(id => port.setPointerCapture(id)); } catch (er){} }
  });
  port.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    const p = rel(e); const prev = pts.get(e.pointerId); pts.set(e.pointerId, p);
    if (pts.size === 1){
      const zoomed = s > s0 * 1.01; if (!zoomed && e.pointerType === 'touch') return;
      const dx = p[0] - prev[0], dy = p[1] - prev[1]; moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 6){ if (!port.classList.contains('drag')){ port.classList.add('drag'); try { port.setPointerCapture(e.pointerId); } catch (er){} } cx -= dx / s; cy -= dy / s; apply(); suppress = true; }
    } else if (pts.size === 2){
      const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (!start || start.list.length !== 2){ start = {cx, cy, s, list:[a.slice(), b.slice()]}; }
      const [a0, b0] = start.list, d0 = Math.hypot(a0[0] - b0[0], a0[1] - b0[1]) || 1, m0 = [(a0[0] + b0[0]) / 2, (a0[1] + b0[1]) / 2];
      const ns = clamp(start.s * d / d0, s0, smax());
      const ux = start.cx + (m0[0] - cw / 2) / start.s, uy = start.cy + (m0[1] - ch / 2) / start.s;
      cx = ux - (m[0] - cw / 2) / ns; cy = uy - (m[1] - ch / 2) / ns; s = ns; apply(); suppress = true; moved = 99;
      e.preventDefault();
    }
  });
  const up = e => { pts.delete(e.pointerId); port.classList.remove('drag'); start = pts.size ? {cx, cy, s, list:[...pts.values()].map(p => p.slice())} : null; };
  port.addEventListener('pointerup', up); port.addEventListener('pointercancel', up); port.addEventListener('lostpointercapture', e => { if (pts.has(e.pointerId) && e.pointerType !== 'mouse') return; });
  port.addEventListener('click', e => { if (suppress){ e.stopPropagation(); e.preventDefault(); suppress = false; } }, true);
  port.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); const p = rel(e); zoomAt(Math.exp(-e.deltaY * 0.0022), p[0], p[1]); }, {passive:false});
  port.addEventListener('keydown', e => {
    if (e.target !== port) return;
    const k = e.key, st = 40 / s;
    if (k === '+' || k === '='){ zoomAt(1.4, cw / 2, ch / 2); e.preventDefault(); }
    else if (k === '-' || k === '_'){ zoomAt(1 / 1.4, cw / 2, ch / 2); e.preventDefault(); }
    else if (k === '0'){ animTo(W / 2, H / 2, s0); e.preventDefault(); }
    else if (s > s0 * 1.01 && /^Arrow/.test(k)){ if (k === 'ArrowLeft') cx -= st; if (k === 'ArrowRight') cx += st; if (k === 'ArrowUp') cy -= st; if (k === 'ArrowDown') cy += st; apply(); e.preventDefault(); }
  });
  if ('ResizeObserver' in window){ let lw = 0; new ResizeObserver(() => { const w = port.clientWidth; if (w && Math.abs(w - lw) > 1){ lw = w; size(false); } }).observe(host); }
  setSvg(o.svg || '', W, H);
  const api = {
    host, port, get svg(){ return svg; },
    set: setSvg,
    q: sel => svg && svg.querySelector(sel), qa: sel => svg ? Array.from(svg.querySelectorAll(sel)) : [],
    fit(){ animTo(W / 2, H / 2, s0); },
    zoom(f){ zoomAt(f, cw / 2, ch / 2); },
    /* bring a content-space box into view; minZ: zoom factor (relative to fit) at least */
    focus(b, minZ){
      if (!b) return;
      const ns = clamp(Math.min(cw / (b.w + 60), ch / (b.h + 60)), s0 * (minZ || 1), Math.max(s0 * (minZ || 1), s0 * 3));
      animTo(b.x + b.w / 2, b.y + b.h / 2, Math.max(ns, s0 * (minZ || 1)));
    },
    focusEl(el, minZ){ if (!el) return; let b; try { b = el.getBBox(); } catch (e){ return; } const t = tx(el); api.focus({x:b.x + t.x, y:b.y + t.y, w:b.width, h:b.height}, minZ); },
    get zoomLevel(){ return s / s0; },
    get view(){ return {cx, cy, s, s0}; }
  };
  /* sum of translate() on ancestors up to the root svg (our drawings only use translate on groups) */
  function tx(el){ let x = 0, y = 0, n = el; while (n && n !== svg){ const t = n.getAttribute && n.getAttribute('transform'); const m = t && /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)/.exec(t); if (m){ x += +m[1]; y += +m[2]; } n = n.parentNode; } return {x, y}; }
  return api;
};
/* wrap content in a drawing sheet with frame, column numbers and title block. Returns markup. */
DR.sheet = function(o){ /* {x, y, w, h, cols, page, title, sub} */
  const {x, y, w, h} = o, cols = o.cols || 8, cwid = w / cols;
  let s = `<rect class="dfr" x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/><rect class="dfr" x="${x}" y="${y}" width="${w}" height="14"/>`;
  for (let i = 0; i < cols; i++){ s += `<text class="dcol" x="${x + cwid * (i + .5)}" y="${y + 10.5}" text-anchor="middle">${i + 1}</text>`; if (i) s += `<path class="dfr" d="M${x + cwid * i} ${y}v14"/>`; }
  const tbw = Math.min(240, w * 0.6), tbx = x + w - tbw, tby = y + h - 30;
  s += `<rect class="dfr" x="${tbx}" y="${tby}" width="${tbw}" height="30"/><path class="dfr" d="M${tbx + tbw - 44} ${tby}v30M${tbx} ${tby + 15}h${tbw - 44}"/>`;
  s += `<text class="dsm" x="${tbx + 6}" y="${tby + 11}">${esc(o.title || '')}</text><text class="dsm" x="${tbx + 6}" y="${tby + 26}">${esc(o.sub || 'LearnElectricals · =A1 +CP1')}</text>`;
  s += `<text class="dsm" x="${tbx + tbw - 22}" y="${tby + 11}" text-anchor="middle">Page</text><text class="dtag" x="${tbx + tbw - 22}" y="${tby + 26}" text-anchor="middle">${o.page || 1}</text>`;
  return s;
};
DR.colOf = (sh, px) => clamp(Math.floor((px - sh.x) / (sh.w / (sh.cols || 8))) + 1, 1, sh.cols || 8);

/* ================= control-circuit engine =================
   A circuit is one series list from the supply (L / +) to the return (N / 0V). Items are elements
   {k, tag, dev, t:[t1,t2], id} or parallel groups {par:[list, list, …]}. The same description is
   laid out as an IEC page (vertical current paths, parallel branches go to the right) or as a
   NEMA ladder (horizontal rungs, branches go down), then solved: node voltages, current paths,
   coils that pick up, lamps that light. */
const ROLE = {no:'no', pbno:'no', lsno:'no', prox:'no', tno:'no', olo:'no', kno:'no', sel:'no', disc:'no',
  nc:'nc', pbnc:'nc', lsnc:'nc', estop:'nc', tnc:'nc', olc:'nc', fuse:'fix', cb:'fix', wire:'fix', coil:'load', tcoil:'load', lamp:'load'};
DR.ROLE = ROLE;
const LAY = {v:{EL:52, G:14, VS:84}, h:{EL:60, G:14, VS:64}};
DR.circuit = function(def){
  const dir = def.dir || 'v', std = def.std || 'iec', C = Object.assign({}, LAY[dir], def.lay || {});
  const pts = [], key = {}, edges = [];
  const pt = (u, v) => { const k = Math.round(u * 10) + ',' + Math.round(v * 10); if (key[k] == null){ key[k] = pts.length; pts.push({u, v}); } return key[k]; };
  const wire = (a, b) => { if (a !== b) edges.push({i:edges.length, a, b, type:'w'}); };
  const isPar = n => !!n.par;
  const wid = n => isPar(n) ? C.G * 2 + Math.max(...n.par.map(wSeq)) : C.EL;
  const wSeq = q => q.reduce((a, n) => a + wid(n), 0);
  const ext = n => { if (!isPar(n)) return 0; let off = 0, e = 0; n.par.forEach((b, k) => { if (k) off += eSeq(n.par[k - 1]) + C.VS; e = off + eSeq(b); }); return e; };
  const eSeq = q => q.reduce((a, n) => Math.max(a, ext(n)), 0);
  function place(q, u, v, L){
    if (!q.length){ wire(pt(u, v), pt(u + L, v)); return; }
    const nat = wSeq(q), extra = Math.max(0, L - nat); let pos = u;
    q.forEach((n, i) => {
      let w = wid(n);
      if (i === q.length - 1 && extra){ if (isPar(n)) w += extra; else { wire(pt(pos, v), pt(pos + extra, v)); pos += extra; } }
      if (isPar(n)) placePar(n, pos, v, w, i === q.length - 1);
      else { const e = {i:edges.length, a:pt(pos, v), b:pt(pos + C.EL, v), type:'e', el:n, u:pos + C.EL / 2, v}; edges.push(e); n._e = e; }
      pos += w;
    });
  }
  function placePar(n, u, v, W, flush){
    const inner = W - (flush ? 1 : 2) * C.G; let off = 0, prevV = v;
    n.par.forEach((b, k) => {
      if (k) off += eSeq(n.par[k - 1]) + C.VS;
      const vk = v + off;
      if (k){ wire(pt(u, prevV), pt(u, vk)); wire(pt(u + W, prevV), pt(u + W, vk)); }
      wire(pt(u, vk), pt(u + C.G, vk));
      place(b, u + C.G, vk, inner);
      wire(pt(u + C.G + inner, vk), pt(u + W, vk));
      prevV = vk;
    });
  }
  const U = def.U || (wSeq(def.seq) + 2 * (def.lead || 18));
  const lead = (U - wSeq(def.seq)) / 2;
  const SRC = pt(0, 0); place(def.seq, lead, 0, U - 2 * lead); wire(SRC, pt(lead, 0)); const END = pt(U, 0); wire(pt(U - lead, 0), END);
  const VX = eSeq(def.seq);
  const M = {def, dir, std, pts, edges, SRC, END, U, VX, C, els:edges.filter(e => e.type === 'e')};
  /* map to drawing coordinates */
  M.ox = def.ox || 0; M.oy = def.oy || 0;
  M.xy = p => dir === 'v' ? [M.ox + p.v, M.oy + p.u] : [M.ox + p.u, M.oy + p.v];
  pts.forEach(p => { const c = M.xy(p); p.x = c[0]; p.y = c[1]; });
  M.els.forEach(e => { const c = M.xy({u:e.u, v:e.v}); e.x = c[0]; e.y = c[1]; e.id = e.el.id || (def.idp || 'c') + '-' + e.i; });
  M.w = dir === 'v' ? VX : U; M.h = dir === 'v' ? U : VX;
  /* nets (wire numbers): points joined by plain wires */
  const par = pts.map((_, i) => i), f = i => par[i] === i ? i : (par[i] = f(par[i]));
  edges.forEach(e => { if (e.type === 'w'){ par[f(e.a)] = f(e.b); } });
  const order = pts.map((p, i) => i).sort((a, b) => (pts[a].u - pts[b].u) || (pts[a].v - pts[b].v));
  const netNo = {}; let nn = 0;
  order.forEach(i => { const r = f(i); if (netNo[r] == null){ netNo[r] = r === f(SRC) ? 'L' : r === f(END) ? 'N' : String(++nn); } });
  M.net = i => netNo[f(i)];
  M.byDev = d => M.els.filter(e => e.el.dev === d);
  M.coilOf = d => M.els.find(e => e.el.dev === d && ROLE[e.el.k] === 'load' && e.el.k !== 'lamp');
  M.elById = id => M.els.find(e => e.id === id);
  return M;
};

/* --------- solve ---------
   st: {on:{dev:true}  (buttons pressed, OL tripped, coils forced), fault:{edgeIndexOrElId:'open'|'short'}, Vs}
   devices whose coil is in the circuit follow the coil; others follow st.on */
DR.solve = function(M, st){
  st = st || {}; const Vs = st.Vs || 230, fault = st.fault || {};
  const coilDevs = {}; M.els.forEach(e => { if (ROLE[e.el.k] === 'load' && e.el.k !== 'lamp' && e.el.dev) coilDevs[e.el.dev] = true; });
  let dev = Object.assign({}, st.on || {}); Object.keys(coilDevs).forEach(d => { if (dev[d] == null) dev[d] = !!(st.prev && st.prev[d]); });
  const fl = e => fault[e.i] || (e.id && fault[e.id]) || null;
  let R, it = 0;
  for (; it < 14; it++){
    R = pass(dev);
    let ch = false; const nd = Object.assign({}, dev);
    Object.keys(coilDevs).forEach(d => { const c = R.ener[d] || false; if (nd[d] !== c){ nd[d] = c; ch = true; } });
    dev = nd; if (!ch) break;
  }
  R.dev = dev; R.osc = it >= 14; return R;
  function closed(e, d){
    const f = fl(e); if (f === 'open') return false; if (f === 'liftB') return e.type === 'w' ? true : closedRole(e, d);
    return closedRole(e, d);
  }
  function closedRole(e, d){
    const f = fl(e); if (f === 'short') return true;
    if (e.type === 'w') return true;
    const r = ROLE[e.el.k], on = !!d[e.el.dev];
    return r === 'no' ? on : r === 'nc' ? !on : r === 'fix' ? true : false;
  }
  function pass(d){
    const n0 = M.pts.length, lifts = M.els.filter(e => fl(e) === 'liftB'), vmap = {}; lifts.forEach((e, k) => vmap[e.i] = n0 + k);
    const n = n0 + lifts.length, par = Array.from({length:n}, (_, i) => i), f = i => par[i] === i ? i : (par[i] = f(par[i]));
    const cl = M.edges.map(e => e.type === 'w' || ROLE[e.el.k] !== 'load' ? closed(e, d) : false);
    M.edges.forEach((e, i) => { if (cl[i]) par[f(e.a)] = f(e.b); });
    const sL = f(M.SRC), sN = f(M.END), short = sL === sN;
    const loads = M.edges.filter(e => e.type === 'e' && ROLE[e.el.k] === 'load' && fl(e) !== 'open').map(e => ({e, a:f(e.a), b:vmap[e.i] != null ? f(vmap[e.i]) : f(e.b), g:e.el.k === 'lamp' ? 0.6 : 1}));
    /* supernode graph */
    const V = {}; const adj = {};
    loads.forEach(l => { (adj[l.a] = adj[l.a] || []).push(l); (adj[l.b] = adj[l.b] || []).push(l); });
    const roots = new Set(); for (let i = 0; i < n; i++) roots.add(f(i));
    const seen = {};
    roots.forEach(r => {
      if (seen[r]) return;
      const comp = [], stack = [r]; seen[r] = 1;
      while (stack.length){ const x = stack.pop(); comp.push(x); (adj[x] || []).forEach(l => { const y = l.a === x ? l.b : l.a; if (!seen[y]){ seen[y] = 1; stack.push(y); } }); }
      const hasL = comp.includes(sL), hasN = comp.includes(sN);
      if (short){ comp.forEach(x => V[x] = x === sL ? Vs : null); return; }
      if (!hasL && !hasN){ comp.forEach(x => V[x] = null); return; }
      if (hasL && !hasN){ comp.forEach(x => V[x] = Vs); return; }
      if (!hasL && hasN){ comp.forEach(x => V[x] = 0); return; }
      const unk = comp.filter(x => x !== sL && x !== sN), idx = {}; unk.forEach((x, i) => idx[x] = i);
      const m = unk.length, A = Array.from({length:m}, () => new Float64Array(m + 1));
      loads.forEach(l => {
        if (!comp.includes(l.a)) return;
        const add = (p, q) => { if (idx[p] == null) return; const i = idx[p]; A[i][i] += l.g; if (idx[q] != null) A[i][idx[q]] -= l.g; else A[i][m] += l.g * (q === sL ? Vs : 0); };
        add(l.a, l.b); add(l.b, l.a);
      });
      const x = gauss(A, m); V[sL] = Vs; V[sN] = 0; unk.forEach((u, i) => V[u] = x[i]);
    });
    const pv = i => V[f(i)];
    const I = {}, ener = {}, lit = {}, flow = {};
    loads.forEach(l => { const va = V[l.a], vb = V[l.b]; const dv = va == null || vb == null ? 0 : va - vb; I[l.e.i] = dv * l.g; if (Math.abs(dv) >= 0.75 * Vs){ if (l.e.el.k === 'lamp') lit[l.e.el.dev || l.e.id] = true; else ener[l.e.el.dev] = true; } if (Math.abs(dv) > 1e-6) flow[l.e.i] = true; });
    /* current through zero-ohm edges: an edge carries current if each side reaches a different current terminal */
    const term = {}; const addT = (p, k) => (term[p] = term[p] || new Set()).add(k);
    loads.forEach(l => { if (flow[l.e.i]){ addT(l.e.a, 'l' + l.e.i + 'a'); addT(l.e.b, 'l' + l.e.i + 'b'); } });
    if (!short && Object.keys(flow).length){ addT(M.SRC, 'S'); addT(M.END, 'E'); }
    const cadj = {}; M.edges.forEach((e, i) => { if (cl[i]){ (cadj[e.a] = cadj[e.a] || []).push(i); (cadj[e.b] = cadj[e.b] || []).push(i); } });
    const reach = (p0, skip) => { const T = new Set(), vis = {[p0]:1}, st2 = [p0]; while (st2.length){ const p = st2.pop(); if (term[p]) term[p].forEach(t => T.add(t)); (cadj[p] || []).forEach(i => { if (i === skip) return; const e = M.edges[i], q = e.a === p ? e.b : e.a; if (!vis[q]){ vis[q] = 1; st2.push(q); } }); } return T; };
    M.edges.forEach((e, i) => {
      if (!cl[i] || flow[i]) return;
      const r = f(e.a); if (V[r] == null) return;
      const Ta = reach(e.a, i); if (!Ta.size) return; const Tb = reach(e.b, i); if (!Tb.size) return;
      for (const a of Ta) for (const b of Tb) if (a !== b){ flow[i] = true; return; }
    });
    const lift = {}; lifts.forEach(e => lift[e.i] = V[f(vmap[e.i])]);
    return {V:pv, I, ener, lit, flow, closed:cl, short, lift};
  }
};
function gauss(A, m){
  for (let c = 0; c < m; c++){
    let p = c; for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]]; const d = A[c][c]; if (Math.abs(d) < 1e-12) continue;
    for (let r = 0; r < m; r++){ if (r === c) continue; const k = A[r][c] / d; if (!k) continue; for (let j = c; j <= m; j++) A[r][j] -= k * A[c][j]; }
  }
  return Array.from({length:m}, (_, i) => Math.abs(A[i][i]) < 1e-12 ? 0 : A[i][m] / A[i][i]);
}

/* --------- render ---------
   opt: {sheet:{x,y,w,h,cols,page,title}, xref:true, wn:true (wire numbers), tp:true (test points), tap:[devs clickable], mirrorExtra:{dev:[[k,t1,t2,ref,gotoId]]}, ladder line numbers automatic for dir h} */
DR.renderCircuit = function(M, opt){
  opt = opt || {}; const dir = M.dir, std = M.std, sh = opt.sheet, page = (sh && sh.page) || M.def.page || 1;
  let wires = '', flows = '', els = '', labs = '', extra = '';
  const P2 = (a, b) => `M${M.pts[a].x} ${M.pts[a].y}L${M.pts[b].x} ${M.pts[b].y}`;
  M.edges.forEach(e => {
    if (e.type === 'w'){ wires += `<path class="cw" data-w="${e.i}" d="${P2(e.a, e.b)}"/>`; flows += `<path class="cf" data-f="${e.i}" d="${P2(e.a, e.b)}"/>`; }
    else flows += `<path class="cf" data-f="${e.i}" d="${P2(e.a, e.b)}"/>`;
  });
  const colRef = e => sh ? `/${page}.${DR.colOf(sh, e.x)}` : '';
  const lines = dir === 'h' ? [...new Set(M.els.map(e => e.v))].sort((a, b) => a - b) : [];
  const lineNo = v => lines.indexOf(v) + 1;
  M.els.forEach(e => {
    const el = e.el, half = M.C.EL / 2, x = e.x, y = e.y, r = ROLE[el.k];
    const lead = dir === 'v' ? `M${x} ${y - half}V${y - 15}M${x} ${y + 15}V${y + half}` : `M${x - half} ${y}H${x - 15}M${x + 15} ${y}H${x + half}`;
    const tapA = opt.tap && opt.tap.includes(el.dev) ? ` tap" tabindex="0" role="button" aria-label="${esc((el.tag || '') + ' ' + (el.name || ''))}` : '';
    const hb = dir === 'v' ? `<rect class="hlbox" x="${x - 30}" y="${y - half + 2}" width="56" height="${M.C.EL - 4}"/>` : `<rect class="hlbox" x="${x - half + 2}" y="${y - 30}" width="${M.C.EL - 4}" height="52"/>`;
    els += `<g class="ce${tapA}" id="${e.id}" data-e="${e.i}" data-dev="${esc(el.dev || '')}">${hb}<path class="dk" d="${lead}"/>${DR.sym(std, el.k, x, y, dir, std === 'ansi' && r === 'load' ? '' : undefined)}<rect class="hit" x="${dir === 'v' ? x - 28 : x - half}" y="${dir === 'v' ? y - half : y - 28}" width="${dir === 'v' ? 52 : M.C.EL}" height="${dir === 'v' ? M.C.EL : 48}"/></g>`;
    const t = el.t || [];
    const act = /^(pb|ls|prox|sel|estop|ol[co]|t[nc]o?|tn)/.test(el.k) && r !== 'load';
    if (dir === 'v'){
      const tx = x - (act ? 24 : r === 'load' ? 19 : 13);
      labs += `<text class="dtag dhalo" x="${tx}" y="${y + (opt.xref && r !== 'load' ? -1 : 4)}" text-anchor="end">${esc(el.tag || '')}</text>`;
      if (t[0]) labs += `<text class="dterm" x="${x + 4}" y="${y - half + 9}">${esc(t[0])}</text>`;
      if (t[1]) labs += `<text class="dterm" x="${x + 4}" y="${y + half - 2}">${esc(t[1])}</text>`;
      if (el.note) labs += `<text class="dsm" x="${x + (r === 'load' ? 19 : 12)}" y="${y + 4}">${esc(el.note)}</text>`;
    } else {
      const ty = y - (act ? 28 : r === 'load' && std === 'ansi' ? 16 : 19);
      labs += `<text class="dtag dhalo" x="${x}" y="${ty}" text-anchor="middle">${esc(el.tag || '')}</text>`;
      if (t[0]) labs += `<text class="dterm" x="${x - half + 3}" y="${y - 4}">${esc(t[0])}</text>`;
      if (t[1]) labs += `<text class="dterm" x="${x + half - 3}" y="${y - 4}" text-anchor="end">${esc(t[1])}</text>`;
      if (el.note) labs += `<text class="dsm" x="${x}" y="${y + 23}" text-anchor="middle">${esc(el.note)}</text>`;
    }
    /* cross references */
    if (opt.xref && el.dev){
      if (r !== 'load'){
        const coil = M.coilOf(el.dev);
        const ext3 = !coil && opt.extRef && opt.extRef[el.dev];
        if (ext3 && dir === 'v') labs += `<g class="xr-g" tabindex="0" role="button" data-goto="${ext3.go}" aria-label="روح لـ ${esc(el.tag)} في دايرة القوى"><rect class="hit" x="${x - 58}" y="${y + 1}" width="44" height="14"/><text class="xr" x="${x - (act ? 24 : 13)}" y="${y + 11}" text-anchor="end">${ext3.ref}</text></g>`;
        if (coil && dir === 'v') labs += `<g class="xr-g" tabindex="0" role="button" data-goto="${coil.id}" aria-label="روح للكويل ${esc(coil.el.tag)}"><rect class="hit" x="${x - 58}" y="${y + 1}" width="44" height="14"/><text class="xr" x="${x - (act ? 24 : 13)}" y="${y + 11}" text-anchor="end">${colRef(coil)}</text></g>`;
      } else if (el.k !== 'lamp'){
        const cs = M.byDev(el.dev).filter(c => ROLE[c.el.k] !== 'load');
        const ext2 = (opt.mirrorExtra && opt.mirrorExtra[el.dev]) || [];
        if (dir === 'v'){
          const rows = ext2.map(r2 => ({k:r2[0], t:[r2[1], r2[2]], ref:r2[3], go:r2[4]})).concat(cs.map(c => ({k:ROLE[c.el.k] === 'nc' ? 'nc' : 'no', t:c.el.t || [], ref:colRef(c), go:c.id})));
          const by = (opt.mirrorY || (M.oy + M.U + 30));
          rows.forEach((rw, k) => {
            const yy = by + k * 22;
            extra += `<g class="xr-g" tabindex="0" role="button" data-goto="${rw.go}" aria-label="روح للكونتاكت ${esc(rw.t.join('-'))}"><rect class="hit" x="${x - 26}" y="${yy - 10}" width="62" height="21"/><g transform="translate(${x - 14} ${yy}) scale(.55)"><g>${SY.iec[rw.k === 'nc' ? 'nc' : rw.k === 'kno' ? 'kno' : 'no']}</g></g><text class="dsm" x="${x - 22}" y="${yy - 3}" text-anchor="end">${esc(rw.t[0] || '')}</text><text class="dsm" x="${x - 22}" y="${yy + 8}" text-anchor="end">${esc(rw.t[1] || '')}</text><text class="xr" x="${x - 4}" y="${yy + 3.5}">${esc(rw.ref)}</text></g>`;
          });
        } else {
          const ls = cs.map(c => ({n:lineNo(c.v), nc:ROLE[c.el.k] === 'nc', go:c.id}));
          extra += `<text class="dsm" x="${M.ox + M.U + 8}" y="${y + 4}">${ls.map(l => `<tspan class="xr"${l.nc ? ' text-decoration="underline overline"' : ''}>${l.n}</tspan>`).join(', ')}</text>`;
        }
      }
    }
  });
  if (dir === 'h') lines.forEach((v, k) => { extra += `<text class="dcol" x="${M.ox - 12}" y="${M.oy + v + 3.5}" text-anchor="end">${k + 1}</text>`; });
  /* wire numbers: one label per net on its longest wire segment */
  if (opt.wn){
    const best = {};
    M.edges.forEach(e => { if (e.type !== 'w') return; const n = M.net(e.a); if (n === 'L' || n === 'N') return; const a = M.pts[e.a], b = M.pts[e.b], len = Math.hypot(a.x - b.x, a.y - b.y); const along = dir === 'v' ? a.x === b.x : a.y === b.y; const sc = len + (along ? 40 : 0); if (!best[n] || sc > best[n].sc) best[n] = {sc, a, b}; });
    Object.keys(best).forEach(n => { const {a, b} = best[n], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, vert = a.x === b.x; labs += vert ? `<text class="dwn dhalo" x="${mx + 4}" y="${my + 3}">${n}</text>` : `<text class="dwn dhalo" x="${mx}" y="${my - 4}" text-anchor="middle">${n}</text>`; });
    const s0 = M.pts[M.SRC], e0 = M.pts[M.END];
    labs += `<text class="dtag" x="${s0.x + (dir === 'v' ? 0 : 0)}" y="${s0.y + (dir === 'v' ? -5 : -7)}" text-anchor="${dir === 'v' ? 'middle' : 'start'}">${esc(M.def.srcLab || 'L')}</text><text class="dtag" x="${e0.x + (dir === 'v' ? 0 : 0)}" y="${e0.y + (dir === 'v' ? 13 : -7)}" text-anchor="${dir === 'v' ? 'middle' : 'end'}">${esc(M.def.endLab || 'N')}</text>`;
  }
  /* test points: each element terminal */
  let tps = '';
  if (opt.tp){
    const seen = {};
    M.els.forEach(e => { const t = e.el.t || []; [[e.a, t[0]], [e.b, t[1]]].forEach(([p, tn], k) => { const id = (e.el.tag || '') + ':' + (tn || (k ? 'b' : 'a')); if (seen[id]) return; seen[id] = 1; const q = M.pts[p], dx = dir === 'v' ? -7 : 0, dy = dir === 'v' ? (k ? -6 : 6) : 0, ox = dir === 'v' ? 0 : (k ? -8 : 8); tps += `<g class="tp" tabindex="0" role="button" data-tp="${esc(id)}" data-p="${p}" aria-label="نقطة قياس ${esc(id)}"><circle class="hit" cx="${q.x + dx + ox}" cy="${q.y + dy}" r="11" fill="transparent"/><circle class="tpd" cx="${q.x + dx + ox}" cy="${q.y + dy}" r="4"/></g>`; }); });
  }
  M.tpList = () => { const out = []; M.els.forEach(e => { const t = e.el.t || []; [[e.a, t[0]], [e.b, t[1]]].forEach(([p, tn], k) => out.push({id:(e.el.tag || '') + ':' + (tn || (k ? 'b' : 'a')), p})); }); return out; };
  return `<g class="ckt">${sh ? DR.sheet(sh) : ''}${wires}${flows}${els}${labs}${extra}${tps}</g>`;
};
/* push a solve result onto the rendered drawing */
DR.paint = function(root, M, R, opt){
  opt = opt || {};
  M.edges.forEach(e => {
    const live = (R.V(e.a) || 0) > 1 && (R.V(e.b) || 0) > 1;
    if (e.type === 'w'){ const w = root.querySelector(`[data-w="${e.i}"]`); if (w) w.classList.toggle('live', !!live); }
    const f = root.querySelector(`[data-f="${e.i}"]`); if (f) f.classList.toggle('on', !!R.flow[e.i]);
    if (e.type === 'e'){
      const g = root.querySelector(`[data-e="${e.i}"]`); if (!g) return;
      const r = ROLE[e.el.k];
      g.classList.toggle('on', r !== 'load' && !!R.closed[e.i] && r !== 'fix');
      g.classList.toggle('ener', r === 'load' && e.el.k !== 'lamp' && !!R.ener[e.el.dev] && !!R.flow[e.i]);
      g.classList.toggle('lit', e.el.k === 'lamp' && !!R.flow[e.i]);
    }
  });
};

/* ================= circuits used in the lessons ================= */
const E = (k, tag, dev, t, more) => Object.assign({k, tag, dev, t}, more || {});
DR.defDOL = () => ({srcLab:'L', endLab:'N', seq:[
  E('fuse', '-F1', 'F1', ['1', '2'], {nt:'FU1', name:'فيوز التحكم'}),
  {par:[
    [E('olc', '-F2', 'F2', ['95', '96'], {nt:'OL', name:'كونتاكت الأوفرلود'}), E('pbnc', '-S0', 'S0', ['11', '12'], {nt:'STOP', name:'زرار الإيقاف'}),
      {par:[[E('pbno', '-S1', 'S1', ['13', '14'], {nt:'START', name:'زرار التشغيل'})], [E('no', '-K1', 'K1', ['13', '14'], {nt:'M', name:'كونتاكت التثبيت'})]]},
      E('coil', '-K1', 'K1', ['A1', 'A2'], {nt:'M', name:'كويل الكونتاكتور'})],
    [E('no', '-K1', 'K1', ['33', '34'], {nt:'M'}), E('lamp', '-H1', 'H1', ['X1', 'X2'], {nt:'R', note:'RUN', name:'لمبة شغّال'})],
    [E('nc', '-K1', 'K1', ['21', '22'], {nt:'M'}), E('lamp', '-H2', 'H2', ['X1', 'X2'], {nt:'G', note:'STOP', name:'لمبة واقف'})],
    [E('olo', '-F2', 'F2', ['97', '98'], {nt:'OL'}), E('lamp', '-H3', 'H3', ['X1', 'X2'], {nt:'A', note:'TRIP', name:'لمبة عطل'})]
  ]}
]});
DR.defREV = () => ({srcLab:'L', endLab:'N', seq:[
  E('fuse', '-F1', 'F1', ['1', '2'], {nt:'FU1'}),
  {par:[
    [E('olc', '-F2', 'F2', ['95', '96'], {nt:'OL'}), E('pbnc', '-S0', 'S0', ['11', '12'], {nt:'STOP'}),
      {par:[
        [{par:[[E('pbno', '-S1', 'S1', ['13', '14'], {nt:'FWD'})], [E('no', '-K1', 'K1', ['13', '14'], {nt:'F'})]]}, E('nc', '-K2', 'K2', ['21', '22'], {nt:'R', name:'إنترلوك'}), E('coil', '-K1', 'K1', ['A1', 'A2'], {nt:'F', note:'FWD'})],
        [{par:[[E('pbno', '-S2', 'S2', ['13', '14'], {nt:'REV'})], [E('no', '-K2', 'K2', ['13', '14'], {nt:'R'})]]}, E('nc', '-K1', 'K1', ['21', '22'], {nt:'F', name:'إنترلوك'}), E('coil', '-K2', 'K2', ['A1', 'A2'], {nt:'R', note:'REV'})]
      ]}],
    [E('no', '-K1', 'K1', ['33', '34'], {nt:'F'}), E('lamp', '-H1', 'H1', ['X1', 'X2'], {nt:'FL', note:'FWD'})],
    [E('no', '-K2', 'K2', ['33', '34'], {nt:'R'}), E('lamp', '-H2', 'H2', ['X1', 'X2'], {nt:'RL', note:'REV'})],
    [E('olo', '-F2', 'F2', ['97', '98'], {nt:'OL'}), E('lamp', '-H3', 'H3', ['X1', 'X2'], {nt:'A', note:'TRIP'})]
  ]}
]});
/* NEMA-style copy of a definition: tags become FU1 / OL / STOP / START / M, terminal numbers dropped */
DR.toNema = def => { const walk = q => q.map(n => n.par ? {par:n.par.map(walk)} : Object.assign({}, n, {tag:n.nt || n.tag, itag:n.tag, t:[], id:undefined})); return Object.assign({}, def, {seq:walk(def.seq), std:'ansi', dir:'h', srcLab:'L1', endLab:'L2'}); };

/* build an IEC page around a circuit: returns {M, svg, w, h, sheet} */
DR.iecPage = function(def, o){
  o = o || {};
  const M0 = DR.circuit(Object.assign({}, def, {dir:'v', std:'iec'}));
  const mirrorRows = Math.max(0, ...M0.els.filter(e => ROLE[e.el.k] === 'load' && e.el.k !== 'lamp').map(e => M0.byDev(e.el.dev).length - 1 + ((o.mirrorExtra && o.mirrorExtra[e.el.dev]) || []).length));
  const sx = o.x || 0, sy = o.y || 0, w = Math.max(o.minW || 0, M0.w + 150), h = M0.h + 74 + mirrorRows * 22 + 54;
  const sheet = {x:sx, y:sy, w, h, cols:o.cols || 8, page:o.page || 3, title:o.title || 'Control circuit', sub:o.sub};
  const M = DR.circuit(Object.assign({}, def, {dir:'v', std:'iec', ox:sx + 82 + Math.max(0, (w - 150 - M0.w) / 2), oy:sy + 34, idp:o.idp || 'p' + sheet.page}));
  const svg = DR.renderCircuit(M, {sheet, xref:o.xref !== false, wn:o.wn !== false, tp:o.tp, tap:o.tap, mirrorExtra:o.mirrorExtra, extRef:o.extRef});
  return {M, svg, w, h, sheet};
};
DR.ladderPage = function(def, o){
  o = o || {};
  const nd = DR.toNema(def);
  const M = DR.circuit(Object.assign({}, nd, {ox:(o.x || 0) + 40, oy:(o.y || 0) + 56, idp:o.idp || 'ld'}));
  const w = M.w + 120, h = M.h + 86;
  const svg = `<rect class="dfr" x="${o.x || 0}" y="${o.y || 0}" width="${w}" height="${h}" rx="2"/><text class="dsm" x="${(o.x || 0) + 8}" y="${(o.y || 0) + 14}">NEMA ladder · ${esc(o.title || '')}</text>` + DR.renderCircuit(M, {xref:true, wn:true, tap:o.tap, tp:o.tp});
  return {M, svg, w, h};
};

/* ================= power circuit (multi-line) =================
   DOL feeder: L1 L2 L3 → -Q1 (MPCB) → -K1 main contacts → -F2 thermal overload → -X1 → -M1 */
DR.drawPower = function(o){
  o = o || {}; const x0 = o.x || 0, y0 = o.y || 0, pitch = 26, cx = x0 + (o.cx || 120), P0 = cx - pitch;
  let s = '';
  const sheet = o.sheet ? {x:x0, y:y0, w:o.w || 300, h:o.h || 520, cols:o.cols || 8, page:o.page || 2, title:'Power circuit · Motor M1', sub:o.sub} : null;
  if (sheet) s += DR.sheet(sheet);
  const yL = y0 + 40, yQ = y0 + 100, yK = y0 + 190, yF = y0 + 280, yX = y0 + 352, yM = y0 + 430;
  ['L1', 'L2', 'L3'].forEach((l, i) => { const x = P0 + i * pitch; s += `<text class="dtag" x="${x}" y="${yL - 8}" text-anchor="middle">${l}</text>`; s += P(`M${x} ${yL}V${yQ - 15}M${x} ${yQ + 15}V${yK - 15}M${x} ${yK + 15}V${yF - 15}M${x} ${yF + 15}V${yX - 5}`, 'cw'); });
  s += `<text class="dtag" x="${P0 + 3 * pitch + 6}" y="${yL - 8}" text-anchor="middle">PE</text>` + P(`M${P0 + 3 * pitch + 6} ${yL}V${yX - 5}`, 'dk thin');
  const tn = (y, a, b) => [0, 1, 2].map(i => `<text class="dterm" x="${P0 + i * pitch + 3}" y="${y - 17}">${a[i]}</text><text class="dterm" x="${P0 + i * pitch + 3}" y="${y + 25}">${b[i]}</text>`).join('');
  const grp = (id, inner, lab, x, y, ww, hh) => `<g class="hot" id="${id}" tabindex="0" role="button" aria-label="${esc(lab)}"><rect class="hlbox" x="${x}" y="${y}" width="${ww}" height="${hh}"/>${inner}<rect class="hit" x="${x}" y="${y}" width="${ww}" height="${hh}"/></g>`;
  s += grp('pw-Q1', DR.pole3('cb', P0, yQ, pitch) + tn(yQ, ['1', '3', '5'], ['2', '4', '6']) + `<text class="dtag" x="${P0 - 26}" y="${yQ + 2}" text-anchor="end">-Q1</text><text class="dsm" x="${P0 - 26}" y="${yQ + 14}" text-anchor="end">10–16A</text>`, '-Q1', P0 - 70, yQ - 24, 3 * pitch + 70, 52);
  s += grp('pw-K1', DR.pole3('kno', P0, yK, pitch) + tn(yK, ['1', '3', '5'], ['2', '4', '6']) + `<text class="dtag" x="${P0 - 26}" y="${yK + 2}" text-anchor="end">-K1</text>`, '-K1', P0 - 70, yK - 24, 3 * pitch + 70, 52);
  if (o.k1ref) s += `<g class="xr-g" tabindex="0" role="button" data-goto="${o.k1go}" aria-label="روح للكويل -K1"><rect class="hit" x="${P0 - 70}" y="${yK + 4}" width="46" height="16"/><text class="xr" x="${P0 - 26}" y="${yK + 15}" text-anchor="end">${o.k1ref}</text></g>`;
  s += grp('pw-F2', [0, 1, 2].map(i => DR.sym('iec', 'olt', P0 + i * pitch, yF, 'v')).join('') + P(`M${P0 + 7} ${yF}H${P0 + 2 * pitch - 7}`, 'dk thin dash') + tn(yF, ['1', '3', '5'], ['2', '4', '6']) + `<text class="dtag" x="${P0 - 26}" y="${yF + 2}" text-anchor="end">-F2</text>`, '-F2', P0 - 70, yF - 24, 3 * pitch + 70, 52);
  if (o.f2ref) s += `<g class="xr-g" tabindex="0" role="button" data-goto="${o.f2go}" aria-label="روح لكونتاكت -F2"><rect class="hit" x="${P0 - 70}" y="${yF + 4}" width="46" height="16"/><text class="xr" x="${P0 - 26}" y="${yF + 15}" text-anchor="end">${o.f2ref}</text></g>`;
  ['U', 'V', 'W', 'PE'].forEach((l, i) => { const x = i < 3 ? P0 + i * pitch : P0 + 3 * pitch + 6; s += `<circle class="dk coilf" cx="${x}" cy="${yX}" r="4.5"/><text class="dterm" x="${x + 6}" y="${yX + 3}">${l}</text>`; });
  s += `<text class="dtag" x="${P0 - 26}" y="${yX + 4}" text-anchor="end">-X1</text>`;
  s += `<path class="dk" d="M${P0} ${yX + 5}V${yM - 34}L${cx - 8} ${yM - 14}M${P0 + pitch} ${yX + 5}V${yM - 14}M${P0 + 2 * pitch} ${yX + 5}V${yM - 34}L${cx + 8} ${yM - 14}"/><path class="dk thin" d="M${P0 + 3 * pitch + 6} ${yX + 5}V${yM}H${cx + 22}"/>`;
  s += `<ellipse class="dk thin" cx="${cx}" cy="${yX + 30}" rx="${pitch * 2.1}" ry="7"/><text class="dsm" x="${P0 + 3 * pitch + 12}" y="${yX + 26}">-W1</text><text class="dsm" x="${P0 + 3 * pitch + 12}" y="${yX + 37}">4G2.5</text>`;
  s += grp('pw-M1', `<circle class="dk coilf" cx="${cx}" cy="${yM + 8}" r="22"/><text class="dt" x="${cx}" y="${yM + 7}" text-anchor="middle" style="font-size:13px">M</text><text class="dt" x="${cx}" y="${yM + 20}" text-anchor="middle" style="font-size:9px">3~</text><text class="dtag" x="${cx - 30}" y="${yM + 12}" text-anchor="end">-M1</text><text class="dsm" x="${P0 + 3 * pitch + 14}" y="${yM + 12}">5.5 kW</text><text class="dsm" x="${P0 + 3 * pitch + 14}" y="${yM + 23}">11.2 A</text><text class="dsm" x="${P0 + 3 * pitch + 14}" y="${yM + 34}">400V Δ</text>`, '-M1', cx - 62, yM - 16, 160, 56);
  return s;
};
/* the same feeder as a single line */
DR.drawPowerSL = function(o){
  o = o || {}; const x = (o.x || 0) + 110, y0 = (o.y || 0);
  const sl = y => P(`M${x - 6} ${y + 5}L${x + 6} ${y - 5}M${x - 6} ${y + 9}L${x + 6} ${y - 1}M${x - 6} ${y + 13}L${x + 6} ${y + 3}`, 'dk thin');
  let s = `<text class="dtag" x="${x}" y="${y0 + 32}" text-anchor="middle">400 V 3~ 50 Hz</text>` + P(`M${x} ${y0 + 40}V${y0 + 85}M${x} ${y0 + 115}V${y0 + 175}M${x} ${y0 + 205}V${y0 + 265}M${x} ${y0 + 295}V${y0 + 390}`, 'cw') + sl(y0 + 55);
  s += DR.sym('iec', 'cb', x, y0 + 100, 'v') + `<text class="dtag" x="${x - 26}" y="${y0 + 104}" text-anchor="end">-Q1</text><text class="dsm" x="${x + 16}" y="${y0 + 98}">MPCB</text><text class="dsm" x="${x + 16}" y="${y0 + 109}">10–16 A</text>`;
  s += DR.sym('iec', 'kno', x, y0 + 190, 'v') + `<text class="dtag" x="${x - 26}" y="${y0 + 194}" text-anchor="end">-K1</text><text class="dsm" x="${x + 16}" y="${y0 + 194}">AC-3 12 A</text>`;
  s += DR.sym('iec', 'olt', x, y0 + 280, 'v') + `<text class="dtag" x="${x - 26}" y="${y0 + 284}" text-anchor="end">-F2</text><text class="dsm" x="${x + 16}" y="${y0 + 284}">9–13 A · 11.2</text>` + sl(y0 + 330);
  s += `<text class="dsm" x="${x + 16}" y="${y0 + 340}">-W1 4G2.5 Cu</text>`;
  s += `<circle class="dk coilf" cx="${x}" cy="${y0 + 412}" r="22"/><text class="dt" x="${x}" y="${y0 + 411}" text-anchor="middle" style="font-size:13px">M</text><text class="dt" x="${x}" y="${y0 + 424}" text-anchor="middle" style="font-size:9px">3~</text><text class="dtag" x="${x - 30}" y="${y0 + 416}" text-anchor="end">-M1</text><text class="dsm" x="${x + 28}" y="${y0 + 410}">5.5 kW</text>`;
  return s;
};

/* ================= single line diagram (L5) ================= */
DR.SLD_ITEMS = {
  grid:['المصدر 11 kV', 'التغذية جاية من شبكة الكهربا على الجهد المتوسط <span class="eq">11 kV</span> عن طريق خلية RMU. السهم معناه "جاي من برا الرسمة".'],
  tr:['المحوّل TR-1', '<span class="eq">1000 kVA · 11/0.4 kV · Dyn11 · uk 6%</span>. <b>Dyn11</b>: الابتدائي دلتا والثانوي ستار بنيوترال طالع (n) وفرق الزاوية 330°. تيار الثانوي الكامل ≈ <span class="eq">1000 ÷ (1.732 × 0.4) ≈ 1443 A</span>. والـ uk بتقولك تيار القصر ≈ <span class="eq">1443 ÷ 0.06 ≈ 24 kA</span>.'],
  acb:['القاطع الرئيسي Q1 (ACB)', '<span class="eq">ACB 1600 A · 4P · Icu 50 kA · Ir 0.9</span>. الـ <b>In</b> 1600 هو مقاس الفريم، والـ <b>Ir = 0.9 × In = 1440 A</b> هو الظبط الحقيقي للحماية، على قد تيار المحوّل. و<b>Icu 50 kA</b> أكبر من تيار القصر 24 kA.'],
  mdb:['البسبار الرئيسي MDB', '<span class="eq">MDB · 400 V 3Ph+N · 1600 A · 50 kA/1s</span>. الخط التخين في الـ Single line هو البسبار. الرقم 1600 A تحمّل البسبار، و50 kA لمدة ثانية هو اللي يستحمله وقت القصر.'],
  q2:['Q2: لوحة الإنارة', '<span class="eq">MCCB 250 A · Ir 0.8 → 200 A</span> بيغذّي <b>DB-L</b> لوحة الإنارة والبرايز.'],
  q3:['Q3: مغذّي الـ MCC', '<span class="eq">MCCB 400 A · 3P · Icu 50 kA · Ir 1.0</span>. ده القاطع اللي بيحمي الكابل W-03 ولوحة MCC-1 كلها.'],
  w03:['الكابل W-03', '<span class="eq">4C×185 mm² Cu/XLPE/SWA/PVC · 45 m</span>: 4 عروق (3 فازات + نيوترال) مقطع كل عرق 185 مم²، نحاس، عازل XLPE، مسلّح بسلك صلب (SWA)، وغلاف خارجي PVC. طوله 45 متر.'],
  mcc:['بسبار MCC-1', '<span class="eq">MCC-1 · 400 V · 400 A · 36 kA</span>. لوحة مراكز تحكم الموتورات: كل خانة (Bucket) فيها حماية وتشغيل موتور.'],
  q11:['Q11 (MPCB)', '<span class="eq">MPCB 10–16 A · Ir 15</span>: قاطع حماية موتور فيه حماية قصر (مغناطيسي) وأوفرلود (حراري) قابل للظبط. اتظبط على تيار يافطة الموتور 15 A.'],
  k11:['K11: الكونتاكتور', '<span class="eq">AC-3 · 18 A · 230V AC coil</span>. الـ <b>AC-3</b> يعني فئة الاستخدام لموتورات القفص السنجابي (تقويم وفصل وهو شغّال).'],
  m101:['الموتور M-101', '<span class="eq">7.5 kW · 400 V · 15 A</span>. تشغيل مباشر DOL. الكابل <span class="eq">4C×4 mm² Cu</span>.'],
  q12:['Q12: مغذّي الإنفرتر', '<span class="eq">MCCB 100 A · Ir 0.8 → 80 A</span> قبل الإنفرتر. والقاطع هنا بيحمي الكابل والإنفرتر من القصر، والإنفرتر نفسه بيحمي الموتور.'],
  vfd:['الإنفرتر U12', '<span class="eq">VFD 37 kW · 400 V</span>. الرمز مربع فيه خط مايل (تحويل). كابل الموتور بعده لازم يكون <b>مشيلد</b> (Shielded).'],
  m102:['الموتور M-102', '<span class="eq">37 kW · 400 V · ≈ 68 A</span>، الكابل <span class="eq">4C×25 mm² Cu shielded</span>.'],
  sp:['خانة احتياطي', '<b>Spare</b>: قاطع متركّب ومش متوصّل عشان أي حمل يتضاف بعدين.']
};
DR.drawSLD = function(){
  const W = 560, H = 730, x = 150; let s = '';
  const hot = (id, inner, bx, by, bw, bh) => `<g class="hot" data-i="${id}" tabindex="0" role="button" aria-label="${esc(DR.SLD_ITEMS[id][0])}"><rect class="hlbox" x="${bx}" y="${by}" width="${bw}" height="${bh}"/>${inner}<rect class="hit" x="${bx}" y="${by}" width="${bw}" height="${bh}"/></g>`;
  const sl3 = (xx, y) => P(`M${xx - 6} ${y + 4}L${xx + 6} ${y - 4}M${xx - 6} ${y + 8}L${xx + 6} ${y}M${xx - 6} ${y + 12}L${xx + 6} ${y + 4}`, 'dk thin');
  const T = (xx, y, t, c, a) => `<text class="${c || 'dsm'}" x="${xx}" y="${y}"${a ? ` text-anchor="${a}"` : ''}>${t}</text>`;
  s += `<rect class="dfr" x="4" y="4" width="${W - 8}" height="${H - 8}" rx="2"/>` + T(14, 20, 'SINGLE LINE DIAGRAM · MAIN LV SYSTEM', 'dsm');
  /* grid + transformer */
  s += hot('grid', P(`M${x} 40V78`, 'cw') + P(`M${x - 6} 48L${x} 38L${x + 6} 48`) + T(x + 14, 48, '11 kV · 50 Hz', 'dtag') + T(x + 14, 61, 'from RMU', 'dsm'), x - 30, 30, 160, 44);
  s += hot('tr', P(`M${x} 78V90M${x} 150V160`, 'cw') + Ci(x, 108, 17) + Ci(x, 132, 17) + P(`M${x - 6} 102L${x} 112L${x + 6} 102Z`, 'dk thin') + P(`M${x} 131V137M${x} 131L${x - 5} 127M${x} 131L${x + 5} 127`, 'dk thin') + T(x - 26, 112, 'TR-1', 'dtag', 'end') + T(x + 26, 104, '1000 kVA') + T(x + 26, 116, '11/0.4 kV · Dyn11') + T(x + 26, 128, 'uk = 6 %'), x - 70, 84, 210, 74);
  s += P(`M${x} 160V200`, 'cw') + sl3(x, 172) + T(x + 12, 184, '4×(1C×300) + PE', 'dsm');
  s += hot('acb', DR.sym('iec', 'cb', x, 215, 'v') + T(x - 26, 219, 'Q1', 'dtag', 'end') + T(x + 20, 209, 'ACB 1600 A · 4P') + T(x + 20, 221, 'Icu 50 kA · Ir 0.9'), x - 60, 196, 200, 40);
  s += P(`M${x} 230V262`, 'cw');
  /* MDB bus */
  const by = 262; s += hot('mdb', `<path class="bus3" d="M40 ${by}H${W - 40}"/>` + T(160, by - 8, 'MDB · 400 V 3Ph+N · 1600 A · 50 kA/1s', 'dtag'), 34, by - 22, W - 68, 30);
  const fx = [100, 220, 340, 460];
  const feeder = (id, xx, lab, a, b) => hot(id, P(`M${xx} ${by}V${by + 22}M${xx} ${by + 52}V${by + 76}`, 'cw') + DR.sym('iec', 'cb', xx, by + 37, 'v') + T(xx - 22, by + 41, lab, 'dtag', 'end') + T(xx + 16, by + 34, a) + T(xx + 16, by + 46, b), xx - 54, by + 18, 120, 44);
  s += feeder('q2', fx[0], 'Q2', 'MCCB 250 A', 'Ir 0.8');
  s += P(`M${fx[0]} ${by + 76}V${by + 104}`, 'cw') + `<rect class="dk" x="${fx[0] - 28}" y="${by + 104}" width="56" height="24"/>` + T(fx[0], by + 120, 'DB-L', 'dtag', 'middle');
  s += feeder('q3', fx[1], 'Q3', 'MCCB 400 A', 'Ir 1.0');
  s += feeder('sp', fx[3], 'Q5', 'MCCB 250 A', 'SPARE');
  s += P(`M${fx[2]} ${by}V${by + 22}M${fx[2]} ${by + 52}V${by + 76}`, 'cw') + DR.sym('iec', 'cb', fx[2], by + 37, 'v') + T(fx[2] - 22, by + 41, 'Q4', 'dtag', 'end') + T(fx[2] + 16, by + 34, 'MCCB 160 A') + P(`M${fx[2]} ${by + 76}V${by + 92}`, 'cw') + `<path class="dk" d="M${fx[2] - 10} ${by + 92}H${fx[2] + 10}M${fx[2] - 10} ${by + 98}H${fx[2] + 10}"/>` + T(fx[2] + 14, by + 98, 'PFC 200 kVAr');
  /* cable to MCC */
  s += hot('w03', P(`M${fx[1]} ${by + 76}V${by + 170}`, 'cw') + sl3(fx[1], by + 92) + T(fx[1] + 10, by + 106, 'W-03', 'dtag') + T(fx[1] + 10, by + 119, '4C×185 mm²') + T(fx[1] + 10, by + 131, 'Cu/XLPE/SWA/PVC') + T(fx[1] + 10, by + 143, 'L = 45 m'), fx[1] - 16, by + 80, 130, 86);
  const my = by + 170;
  s += hot('mcc', `<path class="bus3" d="M60 ${my}H${W - 60}"/>` + T(232, my - 8, 'MCC-1 · 400 V · 400 A · 36 kA', 'dtag'), 54, my - 22, W - 108, 30);
  s += P(`M${fx[1]} ${my - 2}V${my}`, 'cw');
  /* MCC feeders */
  const m1 = 130, m2 = 330, m3 = 470;
  s += hot('q11', P(`M${m1} ${my}V${my + 22}M${m1} ${my + 52}V${my + 70}`, 'cw') + DR.sym('iec', 'cb', m1, my + 37, 'v') + T(m1 - 22, my + 41, 'Q11', 'dtag', 'end') + T(m1 + 16, my + 34, 'MPCB 10–16 A') + T(m1 + 16, my + 46, 'Ir = 15 A'), m1 - 60, my + 18, 160, 44);
  s += hot('k11', P(`M${m1} ${my + 70}V${my + 85}M${m1} ${my + 115}V${my + 132}`, 'cw') + DR.sym('iec', 'kno', m1, my + 100, 'v') + DR.sym('iec', 'olt', m1, my + 147, 'v') + T(m1 - 22, my + 104, 'K11', 'dtag', 'end') + T(m1 - 22, my + 151, 'F11', 'dtag', 'end') + T(m1 + 16, my + 104, 'AC-3 18 A') + T(m1 + 16, my + 151, 'OL 12–18 A'), m1 - 60, my + 80, 160, 86);
  s += hot('m101', P(`M${m1} ${my + 162}V${my + 222}`, 'cw') + sl3(m1, my + 176) + T(m1 + 12, my + 200, '4C×4 mm² Cu', 'dsm') + Ci(m1, my + 244, 22, 'dk coilf') + `<text class="dt" x="${m1}" y="${my + 243}" text-anchor="middle" style="font-size:13px">M</text><text class="dt" x="${m1}" y="${my + 256}" text-anchor="middle" style="font-size:9px">3~</text>` + T(m1 - 28, my + 248, 'M-101', 'dtag', 'end') + T(m1 + 28, my + 240, '7.5 kW') + T(m1 + 28, my + 252, 'DOL'), m1 - 80, my + 168, 170, 104);
  s += hot('q12', P(`M${m2} ${my}V${my + 22}M${m2} ${my + 52}V${my + 76}`, 'cw') + DR.sym('iec', 'cb', m2, my + 37, 'v') + T(m2 - 22, my + 41, 'Q12', 'dtag', 'end') + T(m2 + 16, my + 34, 'MCCB 100 A') + T(m2 + 16, my + 46, 'Ir 0.8'), m2 - 58, my + 18, 150, 44);
  s += hot('vfd', `<rect class="dk coilf" x="${m2 - 22}" y="${my + 76}" width="44" height="44"/>` + P(`M${m2 - 22} ${my + 120}L${m2 + 22} ${my + 76}`, 'dk thin') + `<text class="dt" x="${m2 - 12}" y="${my + 92}" text-anchor="middle" style="font-size:9px">~</text><text class="dt" x="${m2 + 12}" y="${my + 114}" text-anchor="middle" style="font-size:9px">~</text>` + T(m2 - 28, my + 102, 'U12', 'dtag', 'end') + T(m2 + 28, my + 96, 'VFD 37 kW') + T(m2 + 28, my + 108, '400 V'), m2 - 64, my + 72, 170, 52);
  s += hot('m102', P(`M${m2} ${my + 120}V${my + 222}`, 'cw') + sl3(m2, my + 140) + T(m2 + 12, my + 166, '4C×25 mm² Cu', 'dsm') + T(m2 + 12, my + 178, 'shielded', 'dsm') + Ci(m2, my + 244, 22, 'dk coilf') + `<text class="dt" x="${m2}" y="${my + 243}" text-anchor="middle" style="font-size:13px">M</text><text class="dt" x="${m2}" y="${my + 256}" text-anchor="middle" style="font-size:9px">3~</text>` + T(m2 - 28, my + 248, 'M-102', 'dtag', 'end') + T(m2 + 28, my + 240, '37 kW') + T(m2 + 28, my + 252, 'VFD'), m2 - 80, my + 126, 170, 146);
  s += P(`M${m3} ${my}V${my + 22}M${m3} ${my + 52}V${my + 70}`, 'cw') + DR.sym('iec', 'cb', m3, my + 37, 'v') + T(m3 - 22, my + 41, 'Q13', 'dtag', 'end') + T(m3 + 14, my + 72, 'SPARE 63 A', 'dsm', 'middle');
  return {svg:s, w:W, h:H};
};

/* ================= panel layout (L6) ================= */
DR.PANEL_ITEMS = {
  plate:['الـ Mounting plate', 'اللوح الصاج المجلفن اللي بيتركّب جوه الصندوق وكل حاجة بتتربط عليه. الرسمة بتتعمل بمقاس حقيقي (Scale) عشان تعرف الحاجات هتكفّي ولا لأ.'],
  duct:['مجرى السلك (Wiring duct)', 'مجرى بلاستيك بفتحات جانبية، السلوك بتمشي جوّاه من جهاز لجهاز. مقاسه مكتوب على الرسمة زي <span class="eq">60×80</span> (عرض × عمق). اسيب فاضي ⁦30⁠–⁠40%⁩ للتعديلات.'],
  rail:['الدين ريل DIN rail', 'قضيب معدني <span class="eq">TS35</span> (عرضه 35 مم) الأجهزة الصغيرة بتتكبس عليه: قواطع وكونتاكتورات وترمنالات وباور سبلاي.'],
  Q1:['-Q1 السكينة الرئيسية', 'Main switch <span class="eq">3P 63 A</span> بيد على باب اللوحة. بيفصل الكهربا عن اللوحة كلها، ويتقفل بقفل وقت الصيانة (LOTO).'],
  F1:['-F1 قاطع 3 فاز', 'MCB <span class="eq">3P C16</span> بيغذّي دواير القوى الصغيرة.'],
  F2:['-F2 فيوز/قاطع التحكم', 'MCB <span class="eq">2P C6</span> بيحمي دايرة التحكم 230V.'],
  G1:['-G1 باور سبلاي 24V DC', 'بيحوّل 230V AC لـ <span class="eq">24V DC 5 A</span> للـ PLC والحساسات. على رسمة الدايرة اسمه ⁦-G1⁩ أو ⁦-T1⁩.'],
  F3:['-F3 قاطع الـ 24V', 'MCB <span class="eq">1P C2</span> على خرج الـ 24V بيحمي سلوك الحساسات من القصر.'],
  Q11:['-Q11 قاطع حماية الموتور', 'MPCB <span class="eq">10–16 A</span> متظبط على تيار يافطة الموتور. حماية قصر + أوفرلود.'],
  K11:['-K11 الكونتاكتور', 'كونتاكتور <span class="eq">AC-3 18 A</span> بكويل 230V. جنب القاطع بتاعه عشان السلوك تبقى قصيرة.'],
  U12:['-U12 الإنفرتر', 'إنفرتر <span class="eq">37 kW</span>. متركّب لوحده وفوقه وتحته مسافة للتهوية زي ما الكتالوج بيقول (غالبًا 100 مم).'],
  A1:['-A1 الـ PLC (CPU)', 'وحدة المعالجة: فيها البرنامج والاتصال. الكروت جنبها بالترتيب اللي في الرسمة.'],
  A2:['-A2 كارت الدخل DI', 'كارت <span class="eq">16 DI 24V DC</span>. الحساسات والزراير بتدخل عليه عن طريق ترمنالات ⁦-X2⁩.'],
  X1:['-X1 ترمنالات القوى', 'دخول الكهربا <span class="eq">L1 L2 L3 N PE</span> وخروج الموتور <span class="eq">U V W PE</span>. ترمنالات أكبر مقاس (مثلًا 16 mm²).'],
  X2:['-X2 ترمنالات التحكم', 'ترمنالات الإشارات من وإلى الموقع (حساسات وليميتات وزراير). 1 لـ 3 عليهم <span class="eq">+24V</span> متوصّلين ببريدج، و9 و10 عليهم <span class="eq">0V</span>.'],
  PE:['بار الأرضي PE', 'بار نحاس كل سلوك الأرضي (أخضر/أصفر) بتتربط عليه، وهو متربط بجسم اللوحة وبأرضي المبنى.'],
  sp:['مكان احتياطي', 'مساحة فاضية مقصودة (Spare ⁦20%⁩) عشان أي جهاز يتضاف بعدين من غير ما نغيّر اللوحة.']
};
DR.drawPanel = function(){
  const W = 600, H = 830; let s = '';
  const hot = (id, inner, x, y, w, h) => `<g class="hot" data-i="${id}" tabindex="0" role="button" aria-label="${esc(DR.PANEL_ITEMS[id][0])}"><rect class="hlbox" x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}"/>${inner}<rect class="hit" x="${x}" y="${y}" width="${w}" height="${h}"/></g>`;
  const duct = (x, y, w, h) => { let d = `<rect class="pl-duct" x="${x}" y="${y}" width="${w}" height="${h}"/>`; if (w > h){ for (let i = x + 8; i < x + w - 4; i += 10) d += `<path class="pl-slot" d="M${i} ${y + 3}V${y + 9}M${i} ${y + h - 9}V${y + h - 3}"/>`; } else { for (let i = y + 8; i < y + h - 4; i += 10) d += `<path class="pl-slot" d="M${x + 3} ${i}H${x + 9}M${x + w - 9} ${i}H${x + w - 3}"/>`; } return d; };
  const rail = (y) => { let d = `<rect class="pl-rail" x="80" y="${y - 9}" width="440" height="18"/>`; for (let i = 90; i < 515; i += 22) d += `<rect class="pl-railh" x="${i}" y="${y - 3}" width="12" height="6" rx="2"/>`; return d; };
  const dev = (x, y, w, h, tag, sub, extra) => `<rect class="pl-dev" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>${extra || ''}<text class="dtag" x="${x + w / 2}" y="${y + 16}" text-anchor="middle" style="font-size:${w < 30 ? 9 : 11}px">${tag}</text>${sub ? `<text class="dsm" x="${x + w / 2}" y="${y + h - 7}" text-anchor="middle" style="font-size:${w < 40 ? 7.5 : 9}px">${sub}</text>` : ''}`;
  const screws = (x, y, w, n) => { let d = ''; for (let i = 0; i < n; i++){ const cx = x + w * (i + .5) / n; d += `<circle class="pl-screw" cx="${cx}" cy="${y}" r="3"/>`; } return d; };
  s += hot('plate', `<rect class="pl-plate" x="20" y="20" width="560" height="790" rx="6"/>`, 20, 20, 560, 14) ;
  s += `<text class="dsm" x="30" y="16">MOUNTING PLATE 600 × 800 · =A1 +CP1 · scale 1:5</text>`;
  s += hot('duct', duct(40, 36, 520, 40) + duct(40, 76, 30, 680) + duct(530, 76, 30, 680) + duct(70, 228, 460, 36) + duct(70, 448, 460, 36) + duct(70, 640, 460, 34), 40, 36, 520, 40);
  s += `<text class="dsm" x="300" y="60" text-anchor="middle">WIRING DUCT 60×80</text>`;
  s += hot('rail', rail(150) + rail(355) + rail(565), 80, 556, 440, 18);
    /* row 1 */
  s += hot('Q1', dev(86, 92, 70, 116, '-Q1', 'MAIN 63A', `<circle class="pl-knob" cx="121" cy="150" r="20"/><rect class="pl-hand" x="117" y="128" width="8" height="44" rx="3"/>` + screws(86, 104, 70, 3) + screws(86, 184, 70, 3)), 86, 92, 70, 116);
  s += hot('F1', dev(166, 100, 54, 100, '-F1', 'C16 3P', `<rect class="pl-hand" x="176" y="140" width="34" height="12" rx="2"/>` + screws(166, 110, 54, 3) + screws(166, 176, 54, 3)), 166, 100, 54, 100);
  s += hot('F2', dev(226, 100, 36, 100, '-F2', 'C6 2P', `<rect class="pl-hand" x="232" y="140" width="24" height="12" rx="2"/>` + screws(226, 110, 36, 2) + screws(226, 176, 36, 2)), 226, 100, 36, 100);
  s += hot('G1', dev(270, 96, 84, 108, '-G1', '24V DC 5A', `<text class="dsm" x="312" y="150" text-anchor="middle">230V~</text><text class="dsm" x="312" y="162" text-anchor="middle">→ 24V⎓</text>` + screws(270, 108, 84, 4) + screws(270, 178, 84, 4)), 270, 96, 84, 108);
  s += hot('F3', dev(362, 100, 20, 100, '-F3', 'C2', screws(362, 110, 20, 1) + screws(362, 176, 20, 1)), 362, 100, 20, 100);
  s += hot('sp', `<rect class="pl-spare" x="392" y="100" width="124" height="100" rx="3"/><text class="dsm" x="454" y="148" text-anchor="middle">SPARE</text><text class="dsm" x="454" y="160" text-anchor="middle">20 %</text>`, 392, 100, 124, 100);
  /* row 2 */
  s += hot('Q11', dev(86, 300, 44, 110, '-Q11', '10–16A', `<rect class="pl-hand" x="94" y="345" width="28" height="18" rx="9"/>` + screws(86, 312, 44, 3) + screws(86, 384, 44, 3)), 86, 300, 44, 110);
  s += hot('K11', dev(136, 300, 44, 110, '-K11', 'AC-3 18A', `<rect class="pl-win" x="146" y="340" width="24" height="14" rx="2"/>` + screws(136, 312, 44, 3) + screws(136, 384, 44, 3)), 136, 300, 44, 110);
  s += hot('U12', dev(190, 276, 120, 164, '-U12', 'VFD 37 kW', `<rect class="pl-win" x="214" y="300" width="72" height="34" rx="3"/><text class="dsm" x="250" y="321" text-anchor="middle">50.0 Hz</text><path class="pl-slot" d="M206 360h88M206 368h88M206 376h88M206 384h88"/>`), 190, 276, 120, 164);
  s += hot('A1', dev(322, 300, 76, 110, '-A1', 'CPU', `<rect class="pl-win" x="332" y="326" width="56" height="20" rx="2"/><circle cx="338" cy="360" r="3" fill="#3fd168"/><circle cx="348" cy="360" r="3" fill="#3fd168"/><circle cx="358" cy="360" r="3" class="pl-screw"/>`), 322, 300, 76, 110);
  s += hot('A2', dev(402, 300, 44, 110, '-A2', 'DI 16', screws(402, 330, 44, 2) + screws(402, 344, 44, 2) + screws(402, 358, 44, 2) + screws(402, 372, 44, 2)), 402, 300, 44, 110);
  s += `<g>${dev(450, 300, 44, 110, '-A3', 'DO 16', screws(450, 330, 44, 2) + screws(450, 344, 44, 2) + screws(450, 358, 44, 2) + screws(450, 372, 44, 2))}</g>`;
  /* row 3: terminals */
  const term = (x, n, labels, cls) => { let d = ''; for (let i = 0; i < n; i++){ const tx = x + i * 13; d += `<rect class="${cls || 'pl-term'}" x="${tx}" y="532" width="12" height="66" rx="1.5"/><circle class="pl-screw" cx="${tx + 6}" cy="542" r="3"/><circle class="pl-screw" cx="${tx + 6}" cy="588" r="3"/><text class="dsm" x="${tx + 6}" y="568" text-anchor="middle" style="font-size:7px">${labels[i]}</text>`; } return d; };
  const x1 = ['L1', 'L2', 'L3', 'N', 'PE', 'U', 'V', 'W', 'PE'];
  s += hot('X1', `<rect class="pl-end" x="84" y="530" width="6" height="70"/>` + term(92, 9, x1).replace(/class="pl-term" x="(144|196)"/g, 'class="pl-term pe" x="$1"') + `<rect class="pl-end" x="210" y="530" width="6" height="70"/><text class="dtag" x="150" y="524" text-anchor="middle">-X1</text>`, 84, 514, 132, 88);
  const x2 = Array.from({length:16}, (_, i) => String(i + 1));
  s += hot('X2', `<rect class="pl-end" x="276" y="530" width="6" height="70"/>` + term(284, 16, x2) + `<rect class="pl-end" x="492" y="530" width="6" height="70"/><path class="pl-bridge" d="M290 552H316M401 552H414"/><text class="dtag" x="388" y="524" text-anchor="middle">-X2</text>`, 276, 514, 222, 88);
  s += hot('PE', `<rect class="pl-pe" x="120" y="700" width="360" height="14" rx="2"/>` + Array.from({length:12}, (_, i) => `<circle class="pl-screw" cx="${136 + i * 30}" cy="707" r="3"/>`).join('') + `<text class="dtag" x="300" y="734" text-anchor="middle">PE</text>`, 120, 696, 360, 22);
  s += `<text class="dsm" x="300" y="790" text-anchor="middle">▼ CABLE ENTRY · GLANDS M20 / M32 ▼</text>`;
  return {svg:s, w:W, h:H};
};

/* ================= terminal diagram + wire follow (L6) ================= */
DR.TERM = {
  rows:['+24V', '+24V', '+24V', 'B1', 'B3', 'S5', 'spare', 'spare', '0V', '0V'],
  cables:[
    {id:'W20', dev:'-B1', what:'حساس بروكسيميتي PNP', type:'3×0.34 mm²', y:2.6, cores:[['BN', 1], ['BK', 4], ['BU', 9]], col:['#8a4b1f', '#1d1d1d', '#2f6fd6']},
    {id:'W22', dev:'-B3', what:'عوّامة مستوى', type:'2×1.0 mm²', y:5.2, cores:[['1', 3], ['2', 5]]},
    {id:'W21', dev:'-S5', what:'ليميت سويتش', type:'3G1.5 mm²', y:7.6, cores:[['1', 2], ['2', 6], ['GNYE', 0]]}
  ],
  plc:{'4':'I0.3', '5':'I0.0', '6':'I0.5', '10':'1M'},
  wn:{'4':'103', '5':'100', '6':'105', '10':'0V'}
};
DR.drawTerm = function(){
  const W = 600, H = 470, T = DR.TERM, ry = n => 70 + (n - 1) * 36, X = 262;
  let s = `<rect class="dfr" x="4" y="4" width="${W - 8}" height="${H - 8}" rx="2"/><text class="dsm" x="14" y="20">TERMINAL DIAGRAM -X2 · =A1 +CP1 · Page 12</text>`;
  s += `<text class="dars" x="60" y="36" text-anchor="middle">الموقع (Field)</text><text class="dars" x="190" y="36" text-anchor="middle">الكابل والعروق</text><text class="dtag" x="${X + 20}" y="36" text-anchor="middle">-X2</text><text class="dars" x="380" y="36" text-anchor="middle">سلوك جوه اللوحة</text><text class="dtag" x="${W - 62}" y="36" text-anchor="middle">-A2 (DI)</text>`;
  /* terminals */
  T.rows.forEach((r, i) => { const n = i + 1, y = ry(n); s += `<g class="hot" data-t="X2:${n}" tabindex="0" role="button" aria-label="ترمنال X2:${n}"><rect class="hlbox" x="${X - 3}" y="${y - 17}" width="46" height="34"/><rect class="pl-term" x="${X}" y="${y - 15}" width="40" height="30" rx="2"/><text class="dt" x="${X + 20}" y="${y + 4}" text-anchor="middle">${n}</text><rect class="hit" x="${X - 3}" y="${y - 17}" width="46" height="34"/></g>`; });
  s += `<path class="pl-bridgeL" d="M${X + 47} ${ry(1)}V${ry(3)}M${X + 47} ${ry(9)}V${ry(10)}"/>` + [1, 2, 3, 9, 10].map(n => `<circle class="dkf" cx="${X + 47}" cy="${ry(n)}" r="2.6"/><path class="dk thin" d="M${X + 40} ${ry(n)}H${X + 47}"/>`).join('');
  s += `<text class="dsm" x="${X + 52}" y="${ry(2) + 3}">bridge</text>`;
  /* field devices + cables */
  const chx = {W20:[150, 160, 170], W22:[190, 200], W21:[214, 224, 234]};
  T.cables.forEach((c, ci) => {
    const yd = 70 + (c.y - 1) * 36, xs = chx[c.id];
    s += `<rect class="pl-dev" x="18" y="${yd - 22}" width="84" height="44" rx="4"/><text class="dtag" x="60" y="${yd - 6}" text-anchor="middle">${c.dev}</text><text class="dars" x="60" y="${yd + 12}" text-anchor="middle" style="font-size:9.5px">${c.what}</text>`;
    s += `<path class="dk" d="M102 ${yd}H128"/><ellipse class="dk thin" cx="134" cy="${yd}" rx="5" ry="${4 + c.cores.length * 3}"/><text class="dsm" x="132" y="${yd - 16 - c.cores.length * 2}" text-anchor="middle">-${c.id}</text><text class="dsm" x="132" y="${yd + 24 + c.cores.length * 2}" text-anchor="middle" style="font-size:8px">${c.type}</text>`;
    c.cores.forEach((co, k) => {
      const x = xs[k], yt = co[1] ? ry(co[1]) : 0, y0 = yd - (c.cores.length - 1) * 4 + k * 8;
      const col = c.col ? c.col[k] : null;
      if (!co[1]){ s += `<path class="dk thin" d="M139 ${y0}H${x}V${yd + 30}"/><path class="dk" d="M${x - 6} ${yd + 30}H${x + 6}M${x - 4} ${yd + 34}H${x + 4}M${x - 2} ${yd + 38}H${x + 2}"/><text class="dsm" x="${x + 6}" y="${yd + 27}" style="font-size:8px">PE</text>`; return; }
      s += `<g class="hot" data-c="${c.id}-${co[0]}" tabindex="0" role="button" aria-label="الكابل ${c.id} العرق ${co[0]}"><rect class="hlbox" x="${x - 6}" y="${Math.min(y0, yt) - 8}" width="${X - x + 6}" height="${Math.abs(yt - y0) + 16}" style="opacity:0"/><path class="cw core" d="M139 ${y0}H${x}V${yt}H${X}"${col ? ` style="stroke:${col}"` : ''}/><rect class="hlbox" x="${x + 2}" y="${yt - 10}" width="${X - x - 4}" height="20"/><text class="dterm dhalo" x="${X - 6}" y="${yt - 4}" text-anchor="end" style="font-weight:700">${co[0]}</text><rect class="hit" x="${x + 2}" y="${yt - 10}" width="${X - x - 4}" height="20"/></g>`;
    });
  });
  /* internal wires to PLC card */
  const cx = W - 96, cy = n => 74 + n * 34, chi = {'4':348, '5':372, '6':396, '10':420, '1':0};
  s += `<rect class="pl-dev" x="${cx}" y="54" width="78" height="${9 * 34 + 26}" rx="4"/>`;
  const pins = ['I0.0', 'I0.1', 'I0.2', 'I0.3', 'I0.4', 'I0.5', 'I0.6', 'I0.7', '1M'];
  pins.forEach((p, i) => { const y = cy(i); s += `<g class="hot" data-p="${p}" tabindex="0" role="button" aria-label="دخل الـ PLC ${p}"><rect class="hlbox" x="${cx - 4}" y="${y - 15}" width="86" height="30"/><circle class="pl-screw" cx="${cx + 10}" cy="${y}" r="4.5"/><text class="dt" x="${cx + 22}" y="${y + 4}">${p}</text><rect class="hit" x="${cx - 4}" y="${y - 15}" width="86" height="30"/></g>`; });
  Object.keys(T.plc).forEach(t => {
    const y1 = ry(+t), p = T.plc[t], y2 = cy(pins.indexOf(p)), x = chi[t];
    s += `<path class="cw" d="M${X + 40} ${y1}H${x}V${y2}H${cx + 5}"/><text class="dwn dhalo" x="${X + 66}" y="${y1 - 4}">${T.wn[t]}</text><text class="dsm dhalo" x="${cx - 6}" y="${y2 - 4}" text-anchor="end" style="font-size:8px">X2:${t}</text>`;
  });
  s += `<path class="cw" d="M${X + 47} ${ry(1)}V${ry(1) - 18}H${X + 110}"/><text class="dwn" x="${X + 114}" y="${ry(1) - 15}">L+ (-G1 / -F3:2)</text>`;
  return {svg:s, w:W, h:H};
};
DR.FOLLOW = [
  {dev:'-S5', what:'الليميت سويتش', c:'W21-2', t:'X2:6', p:'I0.5'},
  {dev:'-B1', what:'حساس البروكسيميتي', c:'W20-BK', t:'X2:4', p:'I0.3'},
  {dev:'-B3', what:'العوّامة', c:'W22-2', t:'X2:5', p:'I0.0'}
];

/* ================= small drawings for lesson 1 ================= */
DR.drawPID = function(){
  const W = 560, H = 300;
  const bub = (x, y, a, b, ctl) => `<circle class="dk coilf" cx="${x}" cy="${y}" r="20"/>${ctl ? `<path class="dk thin" d="M${x - 20} ${y}H${x + 20}"/>` : ''}<text class="dt" x="${x}" y="${y - (ctl ? 4 : 2)}" text-anchor="middle" style="font-size:10px">${a}</text><text class="dt" x="${x}" y="${y + (ctl ? 12 : 11)}" text-anchor="middle" style="font-size:9px">${b}</text>`;
  let s = `<rect class="dfr" x="4" y="4" width="${W - 8}" height="${H - 8}" rx="2"/><text class="dsm" x="14" y="20">P&amp;ID · TANK T-101 TRANSFER</text>`;
  s += `<path class="dk" d="M60 70Q60 54 110 54Q160 54 160 70V210Q160 226 110 226Q60 226 60 210Z"/><text class="dtag" x="110" y="145" text-anchor="middle">T-101</text><path class="dk thin" d="M66 110H154" style="stroke-dasharray:6 4"/>`;
  s += `<path class="dk" d="M110 226V256H200"/><path class="dk" d="M10 80H60" /><path class="dk" d="M42 75L52 80L42 85Z"/>`;
  s += `<circle class="dk coilf" cx="222" cy="256" r="20"/><path class="dk" d="M208 242L238 256L208 270"/><text class="dtag" x="222" y="292" text-anchor="middle">P-101</text>`;
  s += `<path class="dk" d="M242 256H520"/><path class="dk" d="M510 251L520 256L510 261Z"/><text class="dsm" x="518" y="246" text-anchor="end">to process</text>`;
  s += `<path class="dk" d="M300 256m0 0"/>` + bub(320, 196, 'FT', '101') + `<path class="dk thin dash" d="M320 216V256"/>`;
  s += `<path class="dk" d="M420 246L420 266L444 246L444 266Z"/><path class="dk" d="M432 256V232M420 232A12 9 0 0 1 444 232Z"/><text class="dtag" x="432" y="290" text-anchor="middle">FV-101</text>`;
  s += bub(400, 120, 'FIC', '101', true) + `<path class="dk thin dash" d="M340 196H372L380 132"/><path class="dk thin dash" d="M420 120H432V223"/>`;
  s += bub(200, 100, 'LT', '101') + `<path class="dk thin dash" d="M180 100H160"/>`;
  s += bub(270, 60, 'LSH', '102') + `<path class="dk thin dash" d="M250 60H160"/>`;
  return {svg:s, w:W, h:H};
};
DR.drawWiring = function(){
  const W = 560, H = 300;
  let s = `<rect class="dfr" x="4" y="4" width="${W - 8}" height="${H - 8}" rx="2"/><text class="dsm" x="14" y="20">WIRING DIAGRAM · destination marking</text>`;
  const box = (x, y, w, h, tag, top, bot) => {
    s += `<rect class="pl-dev" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/><text class="dtag" x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle">${tag}</text>`;
    const put = (list, isTop) => list.forEach((t, i) => { const tx = x + w * (i + .5) / list.length, ty = isTop ? y + 10 : y + h - 10, sy = isTop ? y - 26 : y + h + 26;
      s += `<path class="cw" d="M${tx} ${ty}V${sy}"/><circle class="pl-screw" cx="${tx}" cy="${ty}" r="4"/><text class="dterm" x="${tx}" y="${isTop ? ty + 16 : ty - 8}" text-anchor="middle">${t[0]}</text>`;
      if (t[1]) s += `<text class="dsm dhalo" x="${tx}" y="${isTop ? sy - 4 : sy + 11}" text-anchor="middle" style="font-size:8.5px">${t[1]}</text>`;
      if (t[2]) s += `<text class="dwn dhalo" x="${tx + 3}" y="${(ty + sy) / 2 + (isTop ? -4 : 8)}">${t[2]}</text>`; });
    put(top, true); put(bot, false);
  };
  box(290, 96, 240, 96, '-K1', [['1', '-Q1:2'], ['3', '-Q1:4'], ['5', '-Q1:6'], ['13', '-S1:13', '2'], ['A1', '-S1:14', '3']], [['2', '-F2:1'], ['4', '-F2:3'], ['6', '-F2:5'], ['14', '-S1:14', '3'], ['A2', '-X1:N', 'N']]);
  box(40, 96, 200, 96, '-S0 / -S1', [], [['11', '-F2:96', '1'], ['12', ''], ['13', '-K1:13', '2'], ['14', '-K1:A1', '3']]);
  s += `<path class="cw" d="M115 205V212H165V205"/><text class="dwn" x="140" y="208" text-anchor="middle" dy="-2">2</text>`;
  s += `<text class="dars" x="140" y="76" text-anchor="middle">على باب اللوحة</text><text class="dars" x="410" y="50" text-anchor="middle">على الصاج جوه اللوحة</text>`;
  return {svg:s, w:W, h:H};
};
DR.CABLE_SCHEDULE = [
  ['-W1', '=A1 +CP1 -X1:U/V/W/PE', '-M1 (Pump P-101)', 'NYY-J', '4G2.5', '35 m', 'M25'],
  ['-W3', '=MDB -Q3', '=MCC-1', 'Cu/XLPE/SWA/PVC', '4C×185', '45 m', 'M75'],
  ['-W20', '+CP1 -X2:1/4/9', '-B1 (Prox)', 'PUR', '3×0.34', '12 m', 'M16'],
  ['-W21', '+CP1 -X2:2/6', '-S5 (Limit)', 'NYM-J', '3G1.5', '18 m', 'M20'],
  ['-W22', '+CP1 -X2:3/5', '-B3 (Float)', 'H07RN-F', '2×1.0', '25 m', 'M20'],
  ['-W40', '+CP1 -A1:X1', 'HMI +OP1', 'Profinet CAT6', '4×2×0.14', '8 m', 'M20']
];
DR.cableTable = () => `<div class="tblw"><table class="tbl cs-tbl"><thead><tr><th>Cable</th><th>From</th><th>To</th><th>Type</th><th>Cores × mm²</th><th>Length</th><th>Gland</th></tr></thead><tbody>${DR.CABLE_SCHEDULE.map(r => `<tr>${r.map((c, i) => `<td class="${i === 0 ? 'mono' : 'mono'}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

/* ================= L1: drawing types explorer ================= */
DR.TYPES = [
  {id:'sld', name:'Single line diagram', ar:'الرسمة أحادية الخط', q:'الكهربا جاية منين ورايحة فين، وبأي مقاسات؟', use:['توزيع الكهربا في المصنع كله: محوّل، لوحات، قواطع، كابلات وموتورات', 'خط واحد بيمثّل الـ 3 فازات (الشرط المايلة /// بتقولك عددهم)', 'عليها الريتنج: kVA، A، kA، ومقاسات الكابلات'], draw:() => DR.drawSLD()},
  {id:'power', name:'Power circuit', ar:'دايرة القوى', q:'الموتور بيتغذّى إزاي بالتفصيل؟', use:['كل فاز مرسوم لوحده: L1 و L2 و L3 و PE', 'القاطع وكونتاكتات الكونتاكتور الرئيسية والأوفرلود والموتور', 'أطراف القوى ⁦1-2⁩ و ⁦3-4⁩ و ⁦5-6⁩ ومقاس الكابل'], draw:() => ({svg:DR.drawPower({sheet:true, w:320, h:500, cx:150}), w:320, h:500})},
  {id:'control', name:'Control circuit (Schematic)', ar:'دايرة التحكم', q:'المكنة بتشتغل وتقف إزاي؟ وإيه اللي بيمنعها؟', use:['الزراير والكونتاكتات والكويلات واللمبات بين L و N (أو +24V و 0V)', 'بتتقري "مسار مسار" (Current path / Rung)', 'دي أكتر رسمة هتفتحها وإنت بتدوّر على عطل'], draw:() => DR.iecPage(DR.defDOL(), {page:3, title:'Control · Motor M1'})},
  {id:'wiring', name:'Wiring diagram', ar:'رسمة التوصيل', q:'السلك ده متربط فين بالظبط على الجهاز؟', use:['الأجهزة مرسومة بشكلها الحقيقي وأطرافها في أماكنها', 'كل طرف عليه رايح فين (Destination) ورقم السلك', 'بتستخدمها وإنت بتوصّل أو بتفك سلوك'], draw:() => DR.drawWiring()},
  {id:'terminal', name:'Terminal diagram', ar:'رسمة الترمنالات', q:'الكابل اللي جاي من الموقع داخل على أنهي ترمنال؟', use:['شريط الترمنالات ⁦-X2⁩ بأرقامه', 'من بره: الكابل وعروقه (ألوان أو أرقام)', 'من جوه: السلك رايح أنهي جهاز أو أنهي دخل PLC'], draw:() => DR.drawTerm()},
  {id:'layout', name:'Panel layout', ar:'رسمة اللوحة (الترتيب)', q:'الجهاز ده متركّب فين في اللوحة؟', use:['منظر أمامي للـ Mounting plate بمقاس', 'المجاري والدين ريل وكل جهاز بالتاج بتاعه', 'بتستخدمها في التصنيع وعشان تلاقي الجهاز بسرعة'], draw:() => DR.drawPanel()},
  {id:'pid', name:'P&ID', ar:'رسمة المواسير والأجهزة', q:'الحساس ده بيقيس إيه وفين في العملية؟', use:['التانكات والطلمبات والمواسير والصمامات', 'دواير بتاجات زي ⁦LT-101⁩ و ⁦FIC-101⁩', 'الخط المتقطّع = إشارة، والخط المليان = ماسورة'], draw:() => DR.drawPID()},
  {id:'cable', name:'Cable schedule', ar:'جدول الكابلات', q:'الكابل ده رايح فين، نوعه إيه، وطوله كام؟', use:['جدول مش رسمة: كل كابل في سطر', 'رقم الكابل، من فين لفين، النوع، عدد العروق والمقطع، الطول والجلاند', 'بتطلب بيه الكابلات وبتعلّم عليه وإنت بتمدّ'], html:() => DR.cableTable()}
];
DR.typeExplorer = function(host, opt){
  opt = opt || {}; const L = opt.lesson, seen = new Set();
  host.innerHTML = `<div class="type-tabs" role="tablist">${DR.TYPES.map(t => `<button type="button" class="btn" role="tab" data-t="${t.id}" aria-selected="false">${t.ar}</button>`).join('')}</div><div class="tdesc"></div><div class="tx-v"></div><div class="tx-h"></div><p class="chal">افتح الـ <b>8</b> أنواع وبص على كل رسمة عشان الجولة تتعلّم عليها.</p>`;
  const fin = chal(host, '.chal', L, opt.task || 'types');
  const v = DR.viewer($('.tx-v', host), {w:100, h:100, svg:'', title:'', label:'الرسمة'});
  function show(id){
    const t = DR.TYPES.find(x => x.id === id); seen.add(id);
    $$('[data-t]', host).forEach(b => { const on = b.dataset.t === id; b.setAttribute('aria-selected', String(on)); b.setAttribute('aria-pressed', String(on)); if (seen.has(b.dataset.t)) b.classList.add('seen'); });
    $('.tdesc', host).innerHTML = `<h4><span class="term">${esc(t.name)}</span> · ${t.ar}</h4><p><b>بتجاوب على:</b> ${t.q}</p><ul>${t.use.map(u => `<li>${u}</li>`).join('')}</ul>`;
    if (t.html){ $('.tx-v', host).hidden = true; $('.tx-h', host).hidden = false; $('.tx-h', host).innerHTML = t.html(); }
    else { $('.tx-h', host).hidden = true; $('.tx-v', host).hidden = false; const d = t.draw(); v.set(d.svg, d.w, d.h); $('.vw-t', host).textContent = t.name; }
    if (seen.size >= DR.TYPES.length) fin();
  }
  onAct(host, '[data-t]', b => show(b.dataset.t));
  show('sld');
  return {show, seen, v};
};
DR.WHICH = [
  ['عايز تعرف الكابل اللي رايح للطلمبة مقاسه كام وطوله قد إيه عشان تطلبه من المخزن.', 'cable'],
  ['الموتور مش بيقوم لما تدوس Start، وعايز تعرف الكويل بياخد الكهربا منين.', 'control'],
  ['إنت قدام اللوحة ومش لاقي الكونتاكتور ⁦-K11⁩ متركّب فين.', 'layout'],
  ['عايز تعرف القاطع اللي بيغذّي لوحة MCC-1 كام أمبير وجاي من أنهي لوحة.', 'sld'],
  ['الكابل اللي جاي من الليميت سويتش داخل على أنهي ترمنال في اللوحة.', 'terminal'],
  ['هتغيّر الكونتاكتور وعايز تعرف كل سلك مربوط في أنهي طرف عليه.', 'wiring'],
  ['عايز تعرف الأوفرلود وكونتاكتات القوى متوصّلين إزاي بالموتور فاز فاز.', 'power'],
  ['الأوبريتور بيقول "LT-101 بيقرا غلط" وعايز تعرف الحساس ده على أنهي تانك.', 'pid'],
  ['عايز تعرف تيار القصر المتوقّع عند البسبار الرئيسي ومقاس القاطع الرئيسي.', 'sld'],
  ['زرار الطوارئ مش بيفصل الموتور، وعايز تعرف هو متوصّل في أنهي مسار.', 'control'],
  ['هتضيف حساس جديد وعايز تعرف فيه ترمنالات فاضية (Spare) ولا لأ.', 'terminal'],
  ['عايز تعرف فيه مساحة فاضية على الدين ريل لقاطع جديد.', 'layout']
];
DR.whichGen = (() => { let last = -1; return () => { let i; do { i = Math.floor(Math.random() * DR.WHICH.length); } while (i === last); last = i; const [q, a] = DR.WHICH[i]; const others = shuffle(DR.TYPES.filter(t => t.id !== a)).slice(0, 3); const opts = shuffle([DR.TYPES.find(t => t.id === a)].concat(others)); return {q:`${q}<br><span class="muted" style="font-weight:500">تفتح أنهي رسمة؟</span>`, o:opts.map(t => `${t.ar} <span class="term">${esc(t.name)}</span>`), a:opts.findIndex(t => t.id === a), why:`${DR.TYPES.find(t => t.id === a).ar} بتجاوب على: ${DR.TYPES.find(t => t.id === a).q}`}; }; })();

/* ================= L2: symbols ================= */
DR.SYMLIST = [
  {k:'no', ar:'كونتاكت مفتوح NO', en:'Normally Open contact (make)', iec:'-K1 13-14', nema:'CR / M', note:'مفتوح والجهاز مفصول، بيقفل لما الكويل بتاعه يشتغل. في IEC خط مايل، وفي NEMA خطين متوازيين ⁦-| |-⁩.'},
  {k:'nc', ar:'كونتاكت مقفول NC', en:'Normally Closed contact (break)', iec:'-K1 21-22', nema:'CR / M', note:'مقفول والجهاز مفصول، بيفتح لما الكويل يشتغل. في NEMA نفس الخطين وعليهم خط مايل.'},
  {k:'coil', ar:'كويل ريلاي / كونتاكتور', en:'Relay / contactor coil', iec:'-K1 A1-A2', nema:'CR / M', note:'IEC مستطيل، و NEMA دايرة جواها اسم الجهاز (CR ريلاي تحكم، M كونتاكتور موتور).'},
  {k:'pbno', ar:'زرار تشغيل NO', en:'Push button NO (Start)', iec:'-S1 13-14', nema:'PB', note:'زرار بيرجع لوحده (Momentary). في IEC الكونتاكت وعليه مسكة الزرار ⁦[⁩ بخط متقطّع.'},
  {k:'pbnc', ar:'زرار إيقاف NC', en:'Push button NC (Stop)', iec:'-S0 11-12', nema:'PB', note:'مقفول طول الوقت وبيفتح لما تدوس. زرار الـ Stop دايمًا NC عشان لو السلك اتقطع المكنة تقف.'},
  {k:'estop', ar:'زرار طوارئ', en:'Emergency stop (mushroom)', iec:'-S10 11-12', nema:'E-STOP', note:'زرار راس مشروم بيعلّق (Latching) لحد ما تلفه. دايمًا NC.'},
  {k:'sel', ar:'سليكتور (مفتاح اختيار)', en:'Selector switch', iec:'-S3 13-14', nema:'SS', note:'بيفضل في مكانه (Maintained). زي Hand / Off / Auto.'},
  {k:'lsno', ar:'ليميت سويتش NO', en:'Limit (position) switch NO', iec:'-S5 13-14', nema:'LS', note:'بيتحرّك بحتة ميكانيكية (كامة). في IEC المثلث الصغير هو الذراع.'},
  {k:'lsnc', ar:'ليميت سويتش NC', en:'Limit (position) switch NC', iec:'-S6 21-22', nema:'LS', note:'بيفتح لما الحركة توصل لآخرها. بيستخدم كحماية نهاية مشوار.'},
  {k:'prox', ar:'حساس تقارب NO', en:'Proximity sensor NO', iec:'-B1', nema:'PRS', note:'الشكل المعيّن (Rhombus) = حساس من غير لمس. الخرج PNP أو NPN.'},
  {k:'tcoil', ar:'كويل تايمر On-delay', en:'Timer coil (on-delay)', iec:'-K2T A1-A2', nema:'TR', note:'IEC: مستطيل الكويل وجنبه مربع فيه X. وفي NEMA دايرة مكتوب جواها TR.'},
  {k:'tno', ar:'كونتاكت تايمر NO متأخر', en:'On-delay NO timed contact', iec:'-K2T 17-18', nema:'TR (NOTC)', note:'بيقفل بعد الوقت ما يخلص. الشكل اللي زي البراشوت بيبيّن إن الحركة متأخّرة.'},
  {k:'olt', ar:'عنصر الأوفرلود الحراري', en:'Thermal overload element', iec:'-F2 1-2', nema:'OL', note:'بيتركّب في دايرة القوى على كل فاز. لما التيار يزيد يسخن ويفصل كونتاكته.'},
  {k:'olc', ar:'كونتاكت الأوفرلود NC', en:'Overload trip contact NC', iec:'-F2 95-96', nema:'OL', note:'في دايرة التحكم في سكة الكويل. لما الأوفرلود يفصل بيفتح فالكونتاكتور يقع.'},
  {k:'cb', ar:'قاطع (Circuit breaker)', en:'Circuit breaker', iec:'-Q1 1-2', nema:'CB', note:'IEC: كونتاكت وعلى طرفه X. NEMA: قوس فوق الطرفين.'},
  {k:'fuse', ar:'فيوز', en:'Fuse', iec:'-F1 1-2', nema:'FU', note:'IEC: مستطيل والخط معدّي جوّاه. NEMA: شكل حرف S أو مستطيل.'},
  {k:'motor', ar:'موتور 3 فاز', en:'Three-phase motor', iec:'-M1', nema:'MTR', note:'دايرة جواها M و ⁦3~⁩. في NEMA ممكن يتكتب MTR أو يترسم بأطراف T1 T2 T3.'},
  {k:'tr', ar:'محوّل', en:'Transformer', iec:'-T1', nema:'T / CPT', note:'IEC: دايرتين داخلين في بعض. NEMA: ملفّين (حلزونات) وبينهم خطين القلب. أطراف الابتدائي H1 H2 والثانوي X1 X2.'},
  {k:'lamp', ar:'لمبة بيان', en:'Pilot lamp', iec:'-H1 X1-X2', nema:'PL (R / G / A)', note:'IEC: دايرة فيها X. NEMA: دايرة بأشعة وجواها حرف اللون: R أحمر، G أخضر، A كهرماني.'}
];
DR.flashcards = function(host, opt){
  opt = opt || {}; const L = opt.lesson, seen = new Set(); let i = 0, open = false;
  host.innerHTML = `<div class="fc-wrap"><div class="fc" aria-live="polite"></div><div class="fc-nav"><button type="button" class="btn" data-f="prev">→ اللي قبله</button><button type="button" class="btn pri" data-f="flip">اقلب الكارت</button><button type="button" class="btn" data-f="next">اللي بعده ←</button></div><div class="fc-dots" aria-hidden="true"></div><p class="chal">اقلب كل الكروت (<b>${DR.SYMLIST.length}</b>) عشان تتعلّم عليهم.</p></div>`;
  const fin = chal(host, '.chal', L, opt.task || 'cards');
  function render(){
    const c = DR.SYMLIST[i];
    $('.fc', host).innerHTML = `<div class="fc-pair"><figure>${DR.symFig('iec', c.k, {label:'IEC ' + c.en})}<figcaption>IEC 60617</figcaption></figure><figure>${DR.symFig('ansi', c.k, {label:'ANSI ' + c.en})}<figcaption>ANSI / NEMA</figcaption></figure></div>${open ? `<div class="fc-back"><div class="fc-name">${c.ar}</div><div><span class="term">${esc(c.en)}</span></div><div>IEC: <span class="term">${esc(c.iec)}</span> · NEMA: <span class="term">${esc(c.nema)}</span></div><div>${c.note}</div></div>` : `<div class="fc-back"><div class="fc-name">ده رمز إيه؟</div><div class="muted">فكّر الأول، وبعدين اقلب الكارت. (${i + 1} من ${DR.SYMLIST.length})</div></div>`}`;
    $('.fc-dots', host).innerHTML = DR.SYMLIST.map((x, k) => `<i class="${seen.has(k) ? 'seen' : ''}${k === i ? ' cur' : ''}"></i>`).join('');
    $('[data-f=flip]', host).textContent = open ? 'اخفي الاسم' : 'اقلب الكارت';
  }
  onAct(host, '[data-f]', b => {
    const f = b.dataset.f;
    if (f === 'flip'){ open = !open; if (open){ seen.add(i); if (seen.size >= DR.SYMLIST.length) fin(); } }
    if (f === 'next'){ i = (i + 1) % DR.SYMLIST.length; open = false; }
    if (f === 'prev'){ i = (i - 1 + DR.SYMLIST.length) % DR.SYMLIST.length; open = false; }
    render();
  });
  render();
  return {flip(){ $('[data-f=flip]', host).click(); }, next(){ $('[data-f=next]', host).click(); }, get seen(){ return seen.size; }};
};
DR.matchGen = (() => { let last = ''; return () => {
  let c; do { c = pick(DR.SYMLIST); } while (c.k === last); last = c.k;
  const mode = pick(['name', 'name', 'i2a', 'a2i']);
  const others = shuffle(DR.SYMLIST.filter(x => x.k !== c.k && !(x.k.slice(0, 2) === c.k.slice(0, 2) && mode !== 'name'))).slice(0, 3);
  const opts = shuffle([c].concat(others)), a = opts.indexOf(c);
  if (mode === 'name'){ const std = pick(['iec', 'ansi']); return {q:`الرمز ده <span class="std-b">${std === 'iec' ? 'IEC' : 'ANSI/NEMA'}</span> معناه إيه؟<div class="sym-q">${DR.symFig(std, c.k)}</div>`, o:opts.map(x => x.ar), a, why:`${c.ar} (<span class="term">${esc(c.en)}</span>).`}; }
  const from = mode === 'i2a' ? 'iec' : 'ansi', to = mode === 'i2a' ? 'ansi' : 'iec';
  return {q:`ده رمز <b>${c.ar}</b> في <span class="std-b">${from === 'iec' ? 'IEC' : 'ANSI/NEMA'}</span>. أنهي رمز هو نفسه في <span class="std-b">${to === 'iec' ? 'IEC' : 'ANSI/NEMA'}</span>؟<div class="sym-q">${DR.symFig(from, c.k)}</div>`, o:opts.map(x => DR.symFig(to, x.k, {label:x.en})), a, cls:'sym-opts', why:`${c.ar}: ${c.note}`};
}; })();

/* ================= L3: cross reference sheets ================= */
DR.xrefSheets = function(host, opt){
  opt = opt || {}; const L = opt.lesson;
  const pg3 = DR.iecPage(DR.defDOL(), {x:340, y:0, page:3, title:'Control · Motor M1', idp:'p3', minW:470});
  const M = pg3.M, coil = M.coilOf('K1'), f2c = M.els.find(e => e.el.dev === 'F2' && e.el.t[0] === '95');
  const pw = {x:0, y:0, w:320, h:pg3.h, cols:6, page:2}, colK = DR.colOf(pw, 150);
  const k1ref = `/3.${DR.colOf(pg3.sheet, coil.x)}`, f2ref = `/3.${DR.colOf(pg3.sheet, f2c.x)}`;
  const pg3b = DR.iecPage(DR.defDOL(), {x:340, y:0, page:3, title:'Control · Motor M1', idp:'p3', minW:470, mirrorExtra:{K1:[['kno', '1', '2', `/2.${colK}`, 'pw-K1'], ['kno', '3', '4', `/2.${colK}`, 'pw-K1'], ['kno', '5', '6', `/2.${colK}`, 'pw-K1']]}, extRef:{F2:{ref:`/2.${colK}`, go:'pw-F2'}}});
  const svg = DR.drawPower({x:0, y:0, sheet:true, w:320, h:pg3b.h, cols:6, cx:150, k1ref, k1go:pg3b.M.coilOf('K1').id, f2ref, f2go:pg3b.M.els.find(e => e.el.dev === 'F2' && e.el.t[0] === '95').id}) + pg3b.svg;
  host.innerHTML = `<div class="xv"></div><div class="info" aria-live="polite"><h4>دوس على أي مرجع أزرق</h4>تحت كل كونتاكت مكتوب مكان الكويل بتاعه (زي <span class="eq">${k1ref}</span>)، وتحت كل كويل جدول بكل الكونتاكتات بتاعته وأماكنها. دوس على المرجع والرسمة هتنط للمكان.</div><p class="chal">نُط <b>4</b> نطّات على الأقل: منهم واحدة من كونتاكت لكويل، وواحدة من جدول الكويل لكونتاكت.</p>`;
  const fin = chal(host, '.chal', L, opt.task || 'xref');
  const v = DR.viewer($('.xv', host), {w:340 + pg3b.w, h:pg3b.h, svg, title:'صفحة 2: القوى · صفحة 3: التحكم', maxH:520});
  const done = {n:0, toCoil:0, toContact:0}; let tmr = 0;
  const desc = el => { if (!el) return ''; if (el.id && el.id.startsWith('pw-')) return `<span class="term">${el.id.slice(3).replace(/^/, '-')}</span> في صفحة 2 (دايرة القوى)`; const e = pg3b.M.elById(el.id); return e ? `<span class="term">${esc(e.el.tag)} ${esc((e.el.t || []).join('-'))}</span> في <span class="eq">/3.${DR.colOf(pg3b.sheet, e.x)}</span>` : ''; };
  v.port.addEventListener('click', e => {
    const g = e.target.closest('[data-goto]'); if (!g) return;
    const id = g.dataset.goto, el = v.svg.getElementById ? v.svg.getElementById(id) : v.q('#' + id); if (!el) return;
    const toCoil = /^p3-/.test(id) && pg3b.M.elById(id) && ROLE[pg3b.M.elById(id).el.k] === 'load';
    const fromMirror = !!g.closest('.ckt') && g.querySelector('g[transform*="scale"]') != null;
    v.qa('.hl').forEach(x => x.classList.remove('hl')); el.classList.add('hl'); clearTimeout(tmr); tmr = setTimeout(() => el.classList.remove('hl'), 3200);
    v.focusEl(el, 2.2);
    done.n++; if (toCoil) done.toCoil++; if (fromMirror || id.startsWith('pw-') && !toCoil) done.toContact++;
    $('.info', host).innerHTML = `<h4>نطّيت لـ ${desc(el)}</h4>${toCoil ? 'ده الكويل اللي بيحرّك الكونتاكت ده. بص تحته على جدول الكونتاكتات (Contact mirror): كل كونتاكت ومكانه.' : 'ده الكونتاكت. المرجع اللي تحته بيرجّعك للكويل أو للجهاز اللي بيحرّكه.'} <span class="muted">(${done.n} نطّات)</span>`;
    if (done.n >= 4 && done.toCoil >= 1 && done.toContact >= 1) fin();
  });
  return {v, M:pg3b.M, done, jump(sel){ const g = v.q(sel); if (g) g.dispatchEvent(new MouseEvent('click', {bubbles:true})); }};
};
DR.numGen = (() => { const pool = [
  () => { const sq = 1 + Math.floor(Math.random() * 8), f = pick([[1, 2], [3, 4]]); const nc = f[0] === 1; return {q:`كونتاكت مساعد أطرافه <span class="term">${sq}${f[0]}-${sq}${f[1]}</span>. ده:`, o:['NC (مقفول)', 'NO (مفتوح)', 'كويل', 'كونتاكت قوى'], a:nc ? 0 : 1, why:`الرقم التاني (الوظيفة): ⁦1-2⁩ = NC و ⁦3-4⁩ = NO. والرقم الأول (${sq}) ترتيب الكونتاكت.`}; },
  () => ({q:'أطراف كويل الكونتاكتور في IEC:', o:['A1 و A2', '13 و 14', '95 و 96', 'L و N'], a:0, why:'الكويل دايمًا A1 و A2.'}),
  () => ({q:'أطراف كونتاكت الأوفرلود اللي بيفصل الكويل (NC):', o:['95-96', '97-98', '13-14', 'A1-A2'], a:0, why:'⁦95-96⁩ NC في سكة الكويل، و ⁦97-98⁩ NO للمبة العطل.'}),
  () => ({q:'الأوفرلود فصل. اللمبة اللي متوصّلة على <span class="term">97-98</span> هتعمل إيه؟', o:['هتنوّر', 'هتطفي', 'مش هيحصل حاجة', 'هتفصل الفيوز'], a:0, why:'⁦97-98⁩ NO بيقفل لما الأوفرلود يفصل فاللمبة تنوّر.'}),
  () => ({q:'أطراف القوى الرئيسية في الكونتاكتور:', o:['1-2، 3-4، 5-6', '13-14، 21-22', 'A1-A2', '95-96، 97-98'], a:0, why:'الدخل 1 و 3 و 5 من فوق، والخرج 2 و 4 و 6 من تحت.'}),
  () => { const it = pick([['-K', 'ريلاي أو كونتاكتور'], ['-Q', 'قاطع أو جهاز فصل قوى'], ['-F', 'حماية (فيوز / أوفرلود / MCB)'], ['-S', 'زرار أو مفتاح'], ['-H', 'لمبة بيان'], ['-M', 'موتور'], ['-B', 'حساس'], ['-X', 'ترمنال'], ['-W', 'كابل'], ['-T', 'محوّل'], ['-A', 'PLC أو موديول']]); const n = 1 + Math.floor(Math.random() * 9); const others = shuffle(['ريلاي أو كونتاكتور', 'قاطع أو جهاز فصل قوى', 'حماية (فيوز / أوفرلود / MCB)', 'زرار أو مفتاح', 'لمبة بيان', 'موتور', 'حساس', 'ترمنال', 'كابل', 'محوّل', 'PLC أو موديول'].filter(x => x !== it[1])).slice(0, 3); const o = shuffle([it[1]].concat(others)); return {q:`التاج <span class="term">${it[0]}${n}</span> في رسمة IEC غالبًا يعني:`, o, a:o.indexOf(it[1]), why:`الحرف الأول بيقول نوع الجهاز: <span class="term">${it[0]}</span> = ${it[1]}.`}; },
  () => { const it = pick([['CR', 'ريلاي تحكم'], ['M', 'كونتاكتور موتور (Starter)'], ['OL', 'أوفرلود'], ['PB', 'زرار'], ['LS', 'ليميت سويتش'], ['TR', 'تايمر'], ['FU', 'فيوز'], ['CB', 'قاطع']]); const all = ['ريلاي تحكم', 'كونتاكتور موتور (Starter)', 'أوفرلود', 'زرار', 'ليميت سويتش', 'تايمر', 'فيوز', 'قاطع']; const o = shuffle([it[1]].concat(shuffle(all.filter(x => x !== it[1])).slice(0, 3))); return {q:`في رسمة أمريكاني (NEMA) الجهاز <span class="term">${it[0]}</span> يعني:`, o, a:o.indexOf(it[1]), why:`${it[0]} = ${it[1]}.`}; },
  () => { const p = 2 + Math.floor(Math.random() * 8), c = 1 + Math.floor(Math.random() * 8); return {q:`جنب كونتاكت مكتوب <span class="term">/${p}.${c}</span>. معناها:`, o:[`الكويل بتاعه في صفحة ${p} عمود ${c}`, `السلك رقم ${p}${c}`, `الترمنال ${p} في الشريط ${c}`, `الكونتاكت رقم ${c} من ${p}`], a:0, why:'المرجع = صفحة.عمود. الأرقام اللي فوق إطار الصفحة هي أرقام الأعمدة.'}; },
  () => ({q:'المكتوب <span class="term">-K1:13</span> معناه:', o:['الطرف 13 على الكونتاكتور -K1', 'السلك 13 في الصفحة 1', 'الكونتاكتور رقم 13', 'العمود 13'], a:0, why:'الجهاز وبعده نقطتين وبعدهم رقم الطرف.'}),
  () => ({q:'السلك اللي عليه فيرول <span class="term">104</span> من الطرفين معناه:', o:['رقم السلك (كل النقط المتوصّلة ببعض واخدة نفس الرقم)', 'طوله 104 سم', 'مقطعه 1.04 mm²', 'رقم الترمنال'], a:0, why:'رقم السلك بيتكتب على الفيرول من الناحيتين. كل سلك متوصّل بنفس النقطة الكهربية بياخد نفس الرقم.'})
]; return () => pick(pool)(); })();

/* ================= L4: control circuit simulator ================= */
DR.ctlSim = function(host, opt){
  opt = opt || {}; const L = opt.lesson, rev = opt.kind === 'rev';
  const mk = rev ? DR.defREV : DR.defDOL;
  const btns = rev ? [['S0', 'إيقاف', 'S0 · 11-12', 'pb-r'], ['S1', 'أمام FWD', 'S1 · 13-14', 'pb-g'], ['S2', 'ورا REV', 'S2 · 13-14', 'pb-g']] : [['S0', 'إيقاف Stop', 'S0 · 11-12', 'pb-r'], ['S1', 'تشغيل Start', 'S1 · 13-14', 'pb-g']];
  const goals = rev ? [['fwd', 'شغّل لقدّام (FWD) والموتور يكمّل بعد ما تسيب الزرار'], ['lock', 'والموتور شغّال لقدّام، دوس REV: لازم ⁦-K2⁩ ميشتغلش (الإنترلوك)'], ['stop', 'وقّف بـ S0'], ['rv', 'شغّل لورا (REV)']] : [['seal', 'دوس Start وسيبه: الموتور يكمّل (التثبيت الذاتي)'], ['stop', 'وقّف بـ Stop'], ['trip', 'والموتور شغّال، اعمل Trip للأوفرلود: الموتور يقف ولمبة TRIP تنوّر'], ['again', 'اعمل Reset للأوفرلود وشغّل تاني']];
  const got = {}; let std = 'iec', page, M, R, st = {on:{}, prev:{}};
  host.innerHTML = `<div class="std-row" role="group" aria-label="نوع الرسمة"><button type="button" class="btn" data-std="iec" aria-pressed="true">IEC (رأسي)</button><button type="button" class="btn" data-std="ansi" aria-pressed="false">NEMA Ladder (أفقي)</button></div><div class="sv"></div><div class="legend"><span><i class="l"></i>عليه جهد (L)</span><span><i class="f"></i>تيار ماشي</span><span><i class="o"></i>كونتاكت مقفول دلوقتي</span></div><div class="sim-ctl">${btns.map(b => `<button type="button" class="btn ${b[3]}" data-pb="${b[0]}">${b[1]}<small>⁦${b[2]}⁩</small></button>`).join('')}<button type="button" class="btn tog" data-ol aria-pressed="false">Trip أوفرلود<small>F2</small></button></div><div class="motor-st"><svg viewBox="0 0 54 54" aria-hidden="true"><circle cx="27" cy="27" r="24" fill="var(--panel)" stroke="var(--dink)" stroke-width="2"/><g class="mspin"><path d="M27 8V46M8 27H46" stroke="var(--accent)" stroke-width="5" stroke-linecap="round"/></g><circle cx="27" cy="27" r="5" fill="var(--dink)"/></svg><div class="statline sm-st" aria-live="polite"></div></div><div class="lamps"></div><ul class="steps-l">${goals.map(g => `<li data-g="${g[0]}">${g[1]}</li>`).join('')}</ul><p class="chal">نفّذ الخطوات اللي فوق كلها.</p>`;
  const fin = chal(host, '.chal', L, opt.task || (rev ? 'rev' : 'dol'));
  const v = DR.viewer($('.sv', host), {w:100, h:100, svg:'', title:'', label:'دايرة التحكم', maxH:540});
  const TAP = rev ? ['S0', 'S1', 'S2'] : ['S0', 'S1'];
  function build(){
    const def = mk();
    page = std === 'iec' ? DR.iecPage(def, {page:rev ? 4 : 3, title:rev ? 'Control · Reversing M1' : 'Control · DOL M1', tap:TAP, idp:'s' + (rev ? 'r' : 'd')}) : DR.ladderPage(def, {title:rev ? 'Reversing' : 'DOL', tap:TAP, idp:'l' + (rev ? 'r' : 'd')});
    M = page.M; v.set(page.svg, page.w, page.h); $('.vw-t', host).textContent = std === 'iec' ? 'IEC 60617 · مسارات رأسية' : 'NEMA · Ladder';
    update();
  }
  function update(){
    R = DR.solve(M, {on:st.on, prev:st.prev, Vs:230}); st.prev = Object.assign({}, R.dev);
    DR.paint(v.svg, M, R);
    const k1 = !!R.dev.K1, k2 = !!R.dev.K2, run = k1 || k2;
    const sp = $('.mspin', host); sp.classList.toggle('f', k1 && !k2); sp.classList.toggle('r', k2 && !k1);
    const lit = id => !!(R.lit[id]);
    const lamps = rev ? [['H1', 'FWD', 'g'], ['H2', 'REV', 'g'], ['H3', 'TRIP', 'y']] : [['H1', 'RUN', 'g'], ['H2', 'STOP', 'r'], ['H3', 'TRIP', 'y']];
    $('.lamps', host).innerHTML = lamps.map(l => `<span class="lamp ${l[2]}${lit(l[0]) ? ' on' : ''}"><i></i><span class="term">-${l[0]}</span> ${l[1]}</span>`).join('');
    const msg = st.on.F2 ? '<b>الأوفرلود فاصل:</b> كونتاكت ⁦95-96⁩ فتح فالكويل فقد الجهد، و ⁦97-98⁩ قفل فلمبة TRIP نوّرت.' : run ? (rev ? (k1 ? '<b>شغّال لقدّام:</b> ⁦-K1⁩ ماسك نفسه بـ ⁦13-14⁩، و ⁦-K1⁩ ⁦21-22⁩ فتح في سكة ⁦-K2⁩ (إنترلوك).' : '<b>شغّال لورا:</b> ⁦-K2⁩ ماسك نفسه، و ⁦-K2⁩ ⁦21-22⁩ فاتح في سكة ⁦-K1⁩.') : (st.on.S1 ? '<b>الكويل ⁦-K1⁩ واخد جهد</b> من سكة ⁦S1⁩ وكمان من ⁦-K1⁩ ⁦13-14⁩ اللي لسه قفل.' : '<b>شغّال ومثبّت:</b> التيار ماشي في ⁦-K1⁩ ⁦13-14⁩ بدل الزرار.')) : '<b>واقف:</b> اتبع الخط الأحمر: الجهد واقف عند أول كونتاكت مفتوح.';
    $('.sm-st', host).innerHTML = msg; $('.sm-st', host).className = 'statline sm-st ' + (st.on.F2 ? 'bad' : run ? 'ok' : '');
    $$('[data-pb]', host).forEach(b => b.classList.toggle('down', !!st.on[b.dataset.pb]));
    $('[data-ol]', host).setAttribute('aria-pressed', String(!!st.on.F2)); $('[data-ol]', host).innerHTML = st.on.F2 ? 'Reset أوفرلود<small>F2</small>' : 'Trip أوفرلود<small>F2</small>';
    check(k1, k2);
  }
  let was = {k1:false, k2:false};
  function check(k1, k2){
    const g = k => { if (!got[k]){ got[k] = true; const li = $(`[data-g="${k}"]`, host); if (li) li.classList.add('ok'); } };
    if (!rev){
      if (k1 && !st.on.S1) g('seal');
      if (was.k1 && !k1 && st.on.S0 && got.seal) g('stop');
      if (was.k1 && !k1 && st.on.F2 && R.lit.H3) g('trip');
      if (got.trip && k1 && !st.on.F2 && !st.on.S1) g('again');
    } else {
      if (k1 && !st.on.S1) g('fwd');
      if (k1 && st.on.S2 && !k2) g('lock');
      if ((was.k1 || was.k2) && !k1 && !k2 && st.on.S0 && got.fwd) g('stop');
      if (k2 && !st.on.S2 && got.stop) g('rv');
    }
    was = {k1, k2};
    if (goals.every(x => got[x[0]])) fin();
  }
  const press = (d, on) => { st.on[d] = on; update(); };
  host.addEventListener('pointerdown', e => { const b = e.target.closest('[data-pb]'); if (!b) return; e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (er){} b._t = Date.now(); press(b.dataset.pb, true); });
  const rel = e => { const b = e.target.closest('[data-pb]'); if (!b || !st.on[b.dataset.pb]) return; const left = Math.max(0, 250 - (Date.now() - (b._t || 0))); setTimeout(() => press(b.dataset.pb, false), left); };
  host.addEventListener('pointerup', rel); host.addEventListener('pointercancel', rel);
  host.addEventListener('contextmenu', e => { if (e.target.closest('[data-pb]')) e.preventDefault(); });
  host.addEventListener('keydown', e => { const b = e.target.closest('[data-pb]'); if (!b || (e.key !== 'Enter' && e.key !== ' ')) return; e.preventDefault(); if (!st.on[b.dataset.pb]) press(b.dataset.pb, true); });
  host.addEventListener('keyup', e => { const b = e.target.closest('[data-pb]'); if (!b || (e.key !== 'Enter' && e.key !== ' ')) return; press(b.dataset.pb, false); });
  host.addEventListener('click', e => {
    const s2 = e.target.closest('[data-std]'); if (s2){ std = s2.dataset.std; $$('[data-std]', host).forEach(x => x.setAttribute('aria-pressed', String(x === s2))); build(); return; }
    if (e.target.closest('[data-ol]')){ press('F2', !st.on.F2); return; }
    const g = e.target.closest('.ce.tap'); if (g){ const d = g.dataset.dev; press(d, true); setTimeout(() => press(d, false), 600); }
  });
  build();
  return {get R(){ return R; }, get M(){ return M; }, st, got, v, press, pulse(d){ press(d, true); press(d, false); }, trip(on){ press('F2', on); }, setStd(s){ $(`[data-std="${s}"]`, host).click(); }};
};
/* reading a circuit one path at a time */
DR.readSteps = function(host, sim, steps){
  let i = -1;
  host.innerHTML = `<div class="read-steps"><div class="rs-t" aria-live="polite">دوس <b>ابدأ القراية</b> وهنمشي على الدايرة مسار مسار. الجزء اللي بنتكلم عنه هيتعلّم باللون الأزرق.</div><div class="rs-nav"><button type="button" class="btn" data-r="prev" disabled>→ اللي قبله</button><button type="button" class="btn pri" data-r="next">ابدأ القراية ←</button></div></div>`;
  function show(){
    const s = steps[i]; const svg = sim.v.svg; svg.querySelectorAll('.hl').forEach(x => x.classList.remove('hl'));
    const els = []; s.on.forEach(([tag, t0, k]) => sim.M.els.forEach(e => { if ((e.el.itag || e.el.tag) === tag && (sim.M.std === 'ansi' ? (!k || e.el.k === k) : (!t0 || (e.el.t || [])[0] === t0))) els.push(e); }));
    let box = null;
    els.forEach(e => { const g = svg.querySelector(`[data-e="${e.i}"]`); if (g) g.classList.add('hl'); const b = {x:e.x - 30, y:e.y - 30, w:60, h:60}; box = box ? {x:Math.min(box.x, b.x), y:Math.min(box.y, b.y), w:Math.max(box.x + box.w, b.x + b.w) - Math.min(box.x, b.x), h:Math.max(box.y + box.h, b.y + b.h) - Math.min(box.y, b.y)} : b; });
    if (box) sim.v.focus(box, 1.3);
    $('.rs-t', host).innerHTML = `<b class="rs-n">${i + 1}/${steps.length} · ${s.t}</b><br>${s.d}`;
    $('[data-r=prev]', host).disabled = i <= 0; $('[data-r=next]', host).textContent = i < steps.length - 1 ? 'اللي بعده ←' : 'من الأول ←';
  }
  onAct(host, '[data-r]', b => { if (b.dataset.r === 'next') i = i < steps.length - 1 ? i + 1 : 0; else i = Math.max(0, i - 1); show(); });
  return {next(){ $('[data-r=next]', host).click(); }, get i(){ return i; }};
};

/* ================= L5: single line explorer + trace ================= */
DR.sldExplorer = function(host, opt){
  opt = opt || {}; const L = opt.lesson, d = DR.drawSLD(), seen = new Set();
  const PATH = ['tr', 'acb', 'mdb', 'q3', 'w03', 'mcc', 'q12', 'vfd', 'm102'];
  let mode = 'x', k = 0;
  host.innerHTML = `<div class="std-row" role="group"><button type="button" class="btn" data-m="x" aria-pressed="true">استكشف: دوس على أي جزء</button><button type="button" class="btn" data-m="t" aria-pressed="false">تحدّي: من المحوّل لـ ⁦M-102⁩</button></div><div class="sv"></div><div class="info" aria-live="polite"><h4>دوس على أي جزء في الرسمة</h4>كل قاطع وكابل وبسبار عليه بيانات. دوس عليه وهتعرف كل رقم معناه إيه.</div><p class="chal c1">اقرا <b>8</b> أجزاء على الأقل من الرسمة.</p><p class="chal c2">في التحدّي: دوس على الأجزاء اللي الكهربا بتعدّي عليها بالترتيب من <b>المحوّل</b> لحد الموتور <b>⁦M-102⁩</b>.</p>`;
  const f1 = chal(host, '.c1', L, 'sld'), f2 = chal(host, '.c2', L, 'trace');
  const v = DR.viewer($('.sv', host), {w:d.w, h:d.h, svg:d.svg, title:'Single line · المصنع', maxH:560});
  const info = $('.info', host);
  function setMode(m){ mode = m; k = 0; $$('[data-m]', host).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m))); v.qa('.hl').forEach(x => x.classList.remove('hl')); info.innerHTML = m === 't' ? `<h4>التحدّي</h4>ابدأ بالمحوّل <b>TR-1</b> ودوس على كل جزء الكهربا بتعدّي عليه لحد <b>⁦M-102⁩</b>. (0/${PATH.length})` : '<h4>استكشف</h4>دوس على أي جزء.'; if (m === 't') v.fit(); }
  v.port.addEventListener('click', e => {
    const g = e.target.closest('.hot[data-i]'); if (!g) return; const id = g.dataset.i, it = DR.SLD_ITEMS[id];
    if (mode === 'x'){
      v.qa('.hl').forEach(x => x.classList.remove('hl')); g.classList.add('hl'); seen.add(id);
      info.innerHTML = `<h4>${it[0]}</h4>${it[1]} <span class="muted">(${seen.size} من 8)</span>`;
      if (seen.size >= 8) f1();
    } else {
      if (id === PATH[k]){ g.classList.add('hl'); k++; info.innerHTML = `<h4>صح: ${it[0]} (${k}/${PATH.length})</h4>${k < PATH.length ? 'كمّل: الكهربا بتروح فين بعده؟' : '<b>تمام!</b> ده المسار كله: محوّل ← قاطع رئيسي ← بسبار MDB ← قاطع المغذّي ← الكابل ← بسبار MCC ← قاطع الموتور ← الإنفرتر ← الموتور.'}`; if (k >= PATH.length) f2(); }
      else if (PATH.indexOf(id) >= 0 && PATH.indexOf(id) < k){ info.innerHTML = `<h4>${it[0]}</h4>ده خلّصته. اللي بعده؟ (${k}/${PATH.length})`; }
      else info.innerHTML = `<h4>مش ده (${k}/${PATH.length})</h4>${it[0]} مش على الطريق ده${k === 0 ? '. ابدأ من المحوّل TR-1.' : '. ارجع للخط اللي بيوصل لـ MCC-1 ومنه لـ M-102.'}`;
    }
  });
  onAct(host, '[data-m]', b => setMode(b.dataset.m));
  const tap = id => { const g = v.q(`.hot[data-i="${id}"]`); if (g) g.dispatchEvent(new MouseEvent('click', {bubbles:true})); };
  return {v, tap, setMode, PATH, seen};
};
DR.powerCompare = function(host){
  host.innerHTML = `<div class="std-row" role="group"><button type="button" class="btn" data-p="m" aria-pressed="true">دايرة القوى (3 خطوط)</button><button type="button" class="btn" data-p="s" aria-pressed="false">نفس المغذّي Single line</button></div><div class="sv"></div>`;
  const v = DR.viewer($('.sv', host), {w:320, h:480, svg:DR.drawPower({sheet:false, cx:150}), title:'Power circuit', maxH:480});
  onAct(host, '[data-p]', b => { $$('[data-p]', host).forEach(x => x.setAttribute('aria-pressed', String(x === b))); if (b.dataset.p === 'm') v.set(DR.drawPower({sheet:false, cx:150}), 320, 480); else v.set(DR.drawPowerSL({}), 320, 480); $('.vw-t', host).textContent = b.dataset.p === 'm' ? 'Power circuit' : 'Single line'; });
  return v;
};
DR.rateGen = (() => { const kva = [500, 630, 800, 1000, 1250, 1600, 2000]; const pool = [
  () => { const s = pick(kva), I = s / (1.732 * 0.4); const r = Math.round(I); return {q:`محوّل <span class="eq">${s} kVA · 11/0.4 kV</span>. تيار الثانوي الكامل تقريبًا كام أمبير؟`, input:true, unit:'A', check:x => Math.abs(x - I) / I <= 0.04, ans:`${r} A`, why:`I = S ÷ (1.732 × V) = ${s} ÷ (1.732 × 0.4) ≈ ${r} A.`}; },
  () => { const s = pick(kva), uk = pick([4, 5, 6]), I = s / (1.732 * 0.4), Isc = I / (uk / 100) / 1000; const r = Math.round(Isc * 10) / 10; return {q:`محوّل <span class="eq">${s} kVA · 400 V · uk ${uk}%</span>. تيار القصر عند أطرافه تقريبًا كام kA؟`, input:true, unit:'kA', check:x => Math.abs(x - Isc) / Isc <= 0.06, ans:`${r} kA`, why:`I = ${Math.round(I)} A، و Isc ≈ I ÷ uk = ${Math.round(I)} ÷ ${uk / 100} ≈ ${r} kA. القاطع الرئيسي لازم الـ Icu بتاعه أكبر من كده.`}; },
  () => { const kw = pick([5.5, 7.5, 11, 15, 22, 30, 37, 45, 55]), I = kw * 1000 / (1.732 * 400 * 0.85 * 0.9); const r = Math.round(I); return {q:`موتور <span class="eq">${kw} kW · 400 V</span>. تياره تقريبًا (pf 0.85 وكفاءة 0.9)؟`, input:true, unit:'A', check:x => Math.abs(x - I) / I <= 0.12, ans:`≈ ${r} A`, why:`I = P ÷ (1.732 × V × pf × η) ≈ ${r} A. وقاعدة سريعة على 400V: حوالي <b>2 A لكل kW</b>.`}; },
  () => ({q:'على الرسمة مكتوب <span class="eq">4C×25 mm² Cu/XLPE/SWA/PVC</span>. الـ <b>SWA</b> معناها:', o:['مسلّح بسلك صلب (Steel Wire Armour)', 'عازل سيليكون', 'كابل مرن', 'شيلد نحاس'], a:0, why:'SWA = Steel Wire Armour، طبقة سلك صلب بتحمي الكابل ميكانيكيًا ومعاها بيتعمل الأرضي في الجلاند.'}),
  () => ({q:'كابل <span class="eq">4C×185 mm²</span>. الـ 185 هي:', o:['مقطع العرق الواحد بالـ mm²', 'مجموع مقطع العروق', 'الطول بالمتر', 'التيار المسموح'], a:0, why:'4C = 4 عروق، و185 = مقطع كل عرق.'}),
  () => ({q:'قاطع <span class="eq">MCCB 250 A · Ir 0.8</span>. هيفصل أوفرلود على حوالي كام؟', o:['200 A', '250 A', '312 A', '80 A'], a:0, why:'Ir × In = 0.8 × 250 = 200 A. الـ In مقاس الفريم والـ Ir الظبط.'}),
  () => ({q:'قاطع مكتوب عليه <span class="eq">Icu 36 kA</span>. ده:', o:['أقصى تيار قصر يقدر يفصله', 'التيار المقنّن', 'تيار الأوفرلود', 'تيار الكويل'], a:0, why:'Icu = Ultimate breaking capacity. لازم يكون أكبر من تيار القصر المتوقّع عند مكانه.'}),
  () => ({q:'الشرط المايلة الـ 3 <span class="eq">///</span> على خط في الـ Single line معناها:', o:['الخط ده 3 فازات', '3 كابلات احتياطي', 'كابل تالف', 'أرضي'], a:0, why:'الـ Single line بيرسم خط واحد، والشرط بتقولك هو بيمثّل كام موصّل.'}),
  () => ({q:'محوّل مكتوب عليه <span class="eq">Dyn11</span>. الـ <b>n</b> معناها:', o:['النيوترال طالع من الثانوي الستار', 'التردد', 'عدد اللفات', 'فيه مروحة'], a:0, why:'D = الابتدائي دلتا، y = الثانوي ستار، n = نيوترال طالع، و11 = فرق الزاوية 330°.'}),
  () => ({q:'كونتاكتور مكتوب عليه <span class="eq">AC-3 18 A</span>. الـ AC-3 معناها:', o:['فئة استخدام لتشغيل وفصل موتورات القفص', 'جهد الكويل', 'عدد الأقطاب', 'التيار المقنّن للكويل'], a:0, why:'AC-1 أحمال مقاومة، AC-3 موتورات قفص سنجابي بتتفصل وهي دايرة.'})
]; return () => pick(pool)(); })();

/* ================= L6: panel explorer + wire follow ================= */
DR.panelExplorer = function(host, opt){
  opt = opt || {}; const L = opt.lesson, d = DR.drawPanel(), seen = new Set();
  host.innerHTML = `<div class="sv"></div><div class="info" aria-live="polite"><h4>دوس على أي جهاز في اللوحة</h4>الرسمة دي منظر أمامي للـ Mounting plate بمقياس رسم. كل جهاز عليه التاج اللي في الدايرة.</div><p class="chal">اقرا <b>6</b> حاجات على الأقل في اللوحة.</p>`;
  const fin = chal(host, '.chal', L, opt.task || 'layout');
  const v = DR.viewer($('.sv', host), {w:d.w, h:d.h, svg:d.svg, title:'Panel layout =A1 +CP1', maxH:560});
  v.port.addEventListener('click', e => { const g = e.target.closest('.hot[data-i]'); if (!g) return; const it = DR.PANEL_ITEMS[g.dataset.i]; v.qa('.hl').forEach(x => x.classList.remove('hl')); g.classList.add('hl'); seen.add(g.dataset.i); $('.info', host).innerHTML = `<h4>${it[0]}</h4>${it[1]} <span class="muted">(${seen.size} من 6)</span>`; if (seen.size >= 6) fin(); });
  return {v, seen, tap(id){ const g = v.q(`.hot[data-i="${id}"]`); if (g) g.dispatchEvent(new MouseEvent('click', {bubbles:true})); }};
};
DR.wireFollow = function(host, opt){
  opt = opt || {}; const L = opt.lesson, d = DR.drawTerm(), F = DR.FOLLOW;
  let si = 0, step = 0, doneN = 0;
  host.innerHTML = `<div class="sv"></div><div class="info" aria-live="polite"></div><ul class="steps-l">${F.map((f, i) => `<li data-s="${i}">تتبّع <span class="term">${f.dev}</span> (${f.what}) لحد دخل الـ PLC</li>`).join('')}</ul><p class="chal">تتبّع الـ <b>3</b> إشارات من الجهاز للـ PLC.</p>`;
  const fin = chal(host, '.chal', L, opt.task || 'follow');
  const v = DR.viewer($('.sv', host), {w:d.w, h:d.h, svg:d.svg, title:'Terminal diagram -X2', maxH:520});
  const STEP = ['العرق (Core) اللي شايل الإشارة من الكابل', 'الترمنال اللي العرق ده داخل عليه في ⁦-X2⁩', 'دخل الـ PLC اللي السلك ده رايح له'];
  function prompt(extra){
    const f = F[si];
    $$('[data-s]', host).forEach(li => { const i = +li.dataset.s; li.classList.toggle('cur', i === si && doneN < F.length); });
    $('.info', host).innerHTML = (extra || '') + (doneN >= F.length ? '<h4>تمام: تتبّعت الـ 3 إشارات ✓</h4>كده تقدر تمسك أي إشارة: <b>الجهاز ← الكابل والعرق ← الترمنال ← رقم السلك (الفيرول) ← الكارت والدخل</b>.' : `<h4>${f.dev}: الخطوة ${step + 1} من 3</h4>دوس على <b>${STEP[step]}</b>.`);
  }
  const keyOf = g => g.dataset.c ? 'c:' + g.dataset.c : g.dataset.t ? 't:' + g.dataset.t : g.dataset.p ? 'p:' + g.dataset.p : '';
  v.port.addEventListener('click', e => {
    const g = e.target.closest('.hot'); if (!g || doneN >= F.length) return;
    const f = F[si], want = step === 0 ? 'c:' + f.c : step === 1 ? 't:' + f.t : 'p:' + f.p, k = keyOf(g);
    if (k === want){
      g.classList.add('hl'); step++;
      const say = step === 1 ? `صح: العرق <b>${f.c.split('-')[1]}</b> في الكابل <span class="term">-${f.c.split('-')[0]}</span>. ` : step === 2 ? `صح: داخل على <span class="term">${f.t}</span>. ` : `صح: <span class="term">${f.t}</span> ← سلك <b>${DR.TERM.wn[f.t.split(':')[1]]}</b> ← دخل <span class="term">${f.p}</span>. `;
      if (step >= 3){ doneN++; const li = $(`[data-s="${si}"]`, host); if (li) li.classList.add('ok'); si++; step = 0; setTimeout(() => v.qa('.hl').forEach(x => x.classList.remove('hl')), 900); if (doneN >= F.length) fin(); }
      prompt(`<p class="done-note">${say}</p>`);
    } else prompt(`<p class="msg bad">مش ده. ${step === 0 ? 'ابدأ من الجهاز وامشي على الكابل بتاعه لحد ما العروق تتفرّق.' : step === 1 ? 'امشي على نفس العرق لحد ما يخبط في الشريط.' : 'من الترمنال امشي على السلك اللي طالع من الناحية التانية.'}</p>`);
  });
  prompt();
  const tapK = k => { const t = k.slice(0, k.indexOf(':')), val = k.slice(k.indexOf(':') + 1); const g = v.q(`.hot[data-${t}="${val}"]`); if (g) g.dispatchEvent(new MouseEvent('click', {bubbles:true})); };
  return {v, tapK, get doneN(){ return doneN; }, solveOne(){ const f = F[si]; if (!f) return; tapK('c:' + f.c); tapK('t:' + f.t); tapK('p:' + f.p); }};
};

/* ================= L7: troubleshooting game ================= */
DR.tsGame = function(host, opt){
  opt = opt || {}; const L = opt.lesson;
  const pg = DR.iecPage(DR.defDOL(), {page:3, title:'Control · DOL M1', idp:'tg', tp:true, xref:false});
  const M = pg.M, el = (tag, t0) => M.els.find(e => e.el.tag === tag && (e.el.t || [])[0] === t0);
  const wireAt = (p, notEdge) => M.edges.find(e => e.type === 'w' && (e.a === p || e.b === p) && e !== notEdge);
  const S0 = el('-S0', '11'), S1 = el('-S1', '13'), K1c = el('-K1', 'A1'), K1s = el('-K1', '13'), F1 = el('-F1', '1'), F2 = el('-F2', '95'), H1 = el('-H1', 'X1');
  const brk = wireAt(S0.b);
  const wn3 = M.net(S0.b), wnA2 = M.net(K1c.b);
  const CASES = [
    {t:'كله مطفي', s:'مفيش ولا لمبة منوّرة على باب اللوحة (حتى لمبة STOP)، والموتور مش بيدور لما تدوس Start.', cond:{on:{S1:true}}, hold:'زميلك ماسك زرار <b>Start</b>.', fault:{[F1.id]:'open'}, o:['فيوز التحكم ⁦-F1⁩ ضارب', 'زرار Stop بايظ', 'كويل ⁦-K1⁩ محروق', 'الأوفرلود فاصل'], a:0, why:'جهد على <span class="eq">-F1:1</span> ومفيش على <span class="eq">-F1:2</span>: الفيوز مفتوح. قبل ما تغيّره دوّر ليه ضرب (قصر في سلك أو كويل).'},
    {t:'Start مش بيعمل حاجة', s:'لمبة STOP منوّرة. بتدوس Start والكونتاكتور مش بيلقط خالص.', cond:{on:{S1:true}}, hold:'زميلك ماسك زرار <b>Start</b>.', fault:{[S0.id]:'open'}, o:['كونتاكت ⁦-S0⁩ (11-12) مفتوح', 'كويل ⁦-K1⁩ محروق', 'فيوز ⁦-F1⁩ ضارب', 'لمبة ⁦-H1⁩ محروقة'], a:0, why:'<span class="eq">-S0:11 = 230 V</span> و <span class="eq">-S0:12 = 0 V</span> والزرار مش مضغوط: الكونتاكت الـ NC مش بيوصّل (متّسخ أو السوستة مكسورة).'},
    {t:'الكويل مش بيلقط وعليه جهد', s:'لمبة STOP منوّرة. بتدوس Start والكونتاكتور مش بيلقط، وريحة حريق خفيفة من اللوحة.', cond:{on:{S1:true}}, hold:'زميلك ماسك زرار <b>Start</b>.', fault:{[K1c.id]:'open'}, o:['كويل ⁦-K1⁩ مفتوح (محروق)', 'زرار Start بايظ', 'سلك النيوترال مقطوع عند A2', 'الأوفرلود فاصل'], a:0, why:'<span class="eq">A1 = 230 V</span> و <span class="eq">A2 = 0 V</span> = الجهد كامل على الكويل ومش بيلقط: الكويل نفسه مفتوح. قيس مقاومته وهو مفصول للتأكيد.'},
    {t:'جهد على الطرفين!', s:'بتدوس Start والكونتاكتور مش بيلقط. الكويل جديد ومقاومته سليمة.', cond:{on:{S1:true}}, hold:'زميلك ماسك زرار <b>Start</b>.', fault:{[K1c.id]:'liftB'}, o:[`سلك النيوترال (N) عند ⁦A2⁩ مقطوع أو مفكوك`, 'الكويل محروق', 'زرار Stop بايظ', 'فيوز ⁦-F1⁩ ضارب'], a:0, why:'لو <span class="eq">A1 = 230 V</span> و <span class="eq">A2 = 230 V</span> كمان، يبقى مفيش فرق جهد على الكويل: الرجوع (N) مقطوع بعده. الكويل السليم بيوصّل الجهد للطرف التاني لما مفيش تيار.'},
    {t:'الموتور بيشتغل بس وإنت ضاغط', s:'الموتور بيدور طول ما إنت ماسك Start، وأول ما تسيبه يقف.', cond:{on:{S1:true}}, hold:'زميلك ماسك زرار <b>Start</b> (الموتور شغّال دلوقتي).', fault:{[K1s.id]:'open'}, o:['كونتاكت التثبيت ⁦-K1⁩ ⁦13-14⁩ (أو سلكه) مش بيوصّل', 'زرار Stop بايظ', 'الأوفرلود ضعيف', 'كويل ⁦-K1⁩ محروق'], a:0, why:'ده عَرَض التثبيت الذاتي: الكونتاكت ⁦13-14⁩ المتوازي مع Start هو اللي بيمسك الكويل. قيس: والكونتاكتور لاقط، <span class="eq">-K1:13 = 230 V</span> ولازم <span class="eq">-K1:14</span> يبقى 230 V من خلاله. افحص الكونتاكت المساعد وسلوكه.'},
    {t:'لمبة TRIP منوّرة', s:'الموتور وقف لوحده في نص الوردية، ولمبة TRIP الصفرا منوّرة.', cond:{on:{F2:true, S1:true}}, hold:'زميلك ماسك زرار <b>Start</b>.', fault:{}, o:['الأوفرلود ⁦-F2⁩ فاصل (عيّنه وشوف تيار الموتور)', 'فيوز ⁦-F1⁩ ضارب', 'كويل ⁦-K1⁩ محروق', 'زرار Start بايظ'], a:0, why:'<span class="eq">-F2:95 = 230 V</span> و <span class="eq">-F2:96 = 0 V</span>، و ⁦97-98⁩ قفل فلمبة TRIP نوّرت. قبل الـ Reset: قيس تيار الموتور وشوف الحمل والفاز والتهوية.'},
    {t:'جهد قبل وجهد مفيش بعد', s:'لمبة STOP منوّرة. بتدوس Start ومفيش حاجة. الزراير جديدة ومجرّبة.', cond:{on:{S1:true}}, hold:'زميلك ماسك زرار <b>Start</b>.', fault:{[brk.i]:'open'}, o:[`السلك رقم ${wn3} بين ⁦-S0:12⁩ و ⁦-S1:13⁩ مقطوع`, 'كويل ⁦-K1⁩ محروق', 'فيوز ⁦-F1⁩ ضارب', 'الأوفرلود فاصل'], a:0, why:`<span class="eq">-S0:12 = 230 V</span> و <span class="eq">-S1:13 = 0 V</span>، والاتنين على نفس رقم السلك (${wn3}) يعني المفروض نفس الجهد: السلك اللي بينهم مقطوع أو الترمنال مفكوك.`},
    {t:'الموتور شغّال واللمبة طافية', s:'الموتور دوّار تمام، بس لمبة RUN الخضرا مش منوّرة.', cond:{on:{}, prev:{K1:true}}, hold:'الموتور <b>شغّال</b> دلوقتي.', fault:{[H1.id]:'open'}, o:['لمبة ⁦-H1⁩ محروقة', 'كونتاكت ⁦-K1⁩ ⁦33-34⁩ بايظ', 'فيوز ⁦-F1⁩ ضارب', 'الأوفرلود فاصل'], a:0, why:'<span class="eq">-H1:X1 = 230 V</span> و <span class="eq">X2 = 0 V</span>: الجهد واصل للمبة ومش بتنوّر يبقى اللمبة نفسها. لو X1 كان 0 V كانت المشكلة في الكونتاكت ⁦33-34⁩.'}
  ];
  const need = opt.need || 6; let order = shuffle(CASES.map((_, i) => i)), k = 0, ok = 0, ans = false, R = null, log = [];
  host.innerHTML = `<div class="dr-top"><span class="cg-sc" aria-live="polite"></span><span class="bar"><i class="cg-bar"></i></span></div><div class="dr-card tsg-case"></div><div class="sv"></div><div class="meter-l"><div class="seg ts-m" aria-live="polite">--- V</div><span class="muted ts-w">الأسود على <b>N</b>. دوس على أي نقطة زرقا (طرف جهاز) للأحمر.</span></div><ul class="mlog"></ul><div class="dr-card ts-q"></div><div class="dr-act"><button type="button" class="btn pri ts-next" hidden>الحالة اللي بعدها ←</button></div><p class="chal">حلّ <b>${need}</b> حالات صح على الأقل من ${CASES.length}.</p>`;
  const fin = chal(host, '.chal', L, opt.task || 'tgame'), q = s => $(s, host);
  const v = DR.viewer(q('.sv'), {w:pg.w, h:pg.h, svg:pg.svg, title:'Control · DOL M1 · نقط القياس', maxH:540});
  const cur = () => CASES[order[k]];
  function score(){ q('.cg-sc').innerHTML = `الحالة <b>${k + 1}</b> من ${CASES.length} · صح: <b>${ok}</b>`; q('.cg-bar').style.width = Math.min(100, ok / need * 100) + '%'; }
  function show(){
    const c = cur(); ans = false; log = [];
    R = DR.solve(M, {on:c.cond.on, prev:c.cond.prev || {}, fault:c.fault, Vs:230});
    q('.tsg-case').innerHTML = `<h4>${c.t}</h4><div class="tsg-sym">${c.s}</div><p style="margin:0">${c.hold} قيس بالأفوميتر على الرسمة، وبعدين اختار العطل.</p>`;
    q('.ts-m').textContent = '--- V'; q('.mlog').innerHTML = '';
    const oi = shuffle(c.o.map((_, i) => i));
    q('.ts-q').innerHTML = `<p style="margin:0;font-weight:600">العطل غالبًا إيه؟</p><div class="qz-a">${oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${c.o[i]}</button>`).join('')}</div><p class="qz-f" aria-live="polite"></p>`;
    q('.ts-next').hidden = true; v.qa('.tp.m').forEach(x => x.classList.remove('m')); score();
  }
  function measure(id){
    const g = v.q(`.tp[data-tp="${CSS.escape(id)}"]`); if (!g) return null;
    const lf = Object.keys(R.lift || {}).find(i => { const e = M.edges[+i]; return e && id === (e.el.tag || '') + ':' + ((e.el.t || [])[1] || 'b'); }); const val = lf != null ? R.lift[lf] : R.V(+g.dataset.p), txt = val == null ? '0.0 V' : `${Math.round(val)} V`;
    g.classList.add('m'); q('.ts-m').textContent = (val == null ? '0' : Math.round(val)) + ' V AC';
    if (!log.find(x => x[0] === id)){ log.push([id, txt]); q('.mlog').innerHTML = log.map(x => `<li class="${parseFloat(x[1]) > 1 ? 'v' : ''}">${esc(x[0])} = ${x[1]}</li>`).join(''); }
    return val == null ? 0 : Math.round(val);
  }
  v.port.addEventListener('click', e => { const g = e.target.closest('.tp'); if (g) measure(g.dataset.tp); });
  q('.ts-q').addEventListener('click', e => {
    const b = e.target.closest('.qz-o'); if (!b || ans) return; const c = cur(), good = +b.dataset.i === c.a; ans = true; if (good) ok++;
    $$('.qz-o', q('.ts-q')).forEach(x => { x.disabled = true; if (+x.dataset.i === c.a) x.classList.add('ok'); else if (x === b) x.classList.add('no'); });
    const f = $('.qz-f', q('.ts-q')); f.className = 'qz-f ' + (good ? 'ok' : 'no'); f.innerHTML = (good ? 'صح. ' : 'مش ده. ') + c.why + (log.length ? '' : ' <b>المرة الجاية قيس الأول قبل ما تحكم.</b>');
    score(); if (ok >= need) fin();
    const nx = q('.ts-next'); nx.hidden = false; nx.textContent = k + 1 < CASES.length ? 'الحالة اللي بعدها ←' : (ok >= need ? 'العب تاني' : 'جرّب تاني من الأول');
  });
  q('.ts-next').addEventListener('click', () => { if (k + 1 < CASES.length) k++; else { k = 0; ok = 0; order = shuffle(order); } show(); });
  show();
  return {v, M, measure, get cur(){ return cur(); }, answer(i){ const b = host.querySelector(`.ts-q .qz-o[data-i="${i}"]`); if (b) b.click(); }, next(){ q('.ts-next').click(); }, get ok(){ return ok; }, CASES};
};

/* ================= hub art ================= */
DR.hubArt = () => [['iec', 'no'], ['iec', 'coil'], ['ansi', 'nc'], ['iec', 'motor'], ['iec', 'tr']].map(d => `<figure>${DR.symFig(d[0], d[1])}</figure>`).join('');

})();
