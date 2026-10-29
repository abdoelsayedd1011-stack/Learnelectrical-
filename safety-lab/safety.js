/* كورس السيفتي PLC: shared engine for the hub and the lessons (store/progress · theme · lesson shell · quiz).
   Copied from instrumentation-lab/instr.js (same look and behaviour), trimmed to what this course uses. */
(function(){
'use strict';
const IL = window.IL = {};
const KEY = 'safety-lab-v1';

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
  const upd = () => { const d = isDark(); b.textContent = d ? '☀' : '☾'; b.setAttribute('aria-label', d ? 'الوضع الفاتح' : 'الوضع الغامق'); b.title = b.getAttribute('aria-label'); };
  b.addEventListener('click', () => { IL.store.set('theme', isDark() ? 'light' : 'dark'); applyTheme(); upd(); });
  upd(); return b;
}

/* ---------------- course map ---------------- */
IL.COURSE = [
  {id:'l1', n:1, file:'lesson-01.html', title:'يعني إيه سيفتي PLC؟', sub:'ليه الـ PLC العادي ماينفعش للطوارئ، المعالجين، الحالة الآمنة، و PL و SIL و Category',
    tasks:[['quiz','أسئلة الدرس']]},
  {id:'l2', n:2, file:'lesson-02.html', title:'عناصر الأمان والتوصيل بقناتين', sub:'الطوارئ والبوابة والستارة الضوئية والـ Two-hand، الفتح القسري، والقناتين',
    tasks:[['quiz','أسئلة الدرس']]},
  {id:'l3', n:3, file:'lesson-03.html', title:'ريلاي الأمان RT9', sub:'أطرافه ولمباته، خمس طرق توصيل، الريست المراقَب والأوتوماتيك، واختبار الكونتاكتورات',
    tasks:[['sim','تجربة الـ RT9 على المحاكي'],['quiz','أسئلة الدرس']]},
  {id:'l9', n:4, file:'lesson-09.html', title:'ريلاي الأمان Pilz PNOZ X3P', sub:'S11 لـ S34، قناة واحدة وقناتين بكشف القصر، الريست الأوتوماتيك والمراقَب، والفيدباك و Y32',
    tasks:[['sim','تجربة الـ PNOZ على المحاكي'],['quiz','أسئلة الدرس']]},
  {id:'l4', n:5, file:'lesson-04.html', title:'Vital 1 والإشارة الديناميكية', sub:'لوب من T1 لـ R1 لحد 30 حساس على سلك واحد، S1 الزوجي والفردي، واللمبات T و R',
    tasks:[['sim','تجربة الـ Vital على المحاكي'],['quiz','أسئلة الدرس']]},
  {id:'l5', n:6, file:'lesson-05.html', title:'Pluto B20: الأطراف والشاشة', sub:'I0 لـ I7، و IQ10 لـ IQ17، والريلاي Q0 و Q1، والترانزستور Q2 و Q3، الشاشة وزرار K والباص',
    tasks:[['quiz','أسئلة الدرس']]},
  {id:'l6', n:7, file:'lesson-06.html', title:'الإشارات الديناميكية A و B و C في Pluto', sub:'خروج IQ بتطلّع نبضات مختلفة لكل قناة، وإزاي القصر بين الأسلاك يتكشف',
    tasks:[['quiz','أسئلة الدرس']]},
  {id:'l7', n:8, file:'lesson-07.html', title:'البرمجة في Pluto Manager', sub:'العناوين I0.0 و Q0.0 و GM، الـ Ladder، بلوكات TC2RTI و Reset2T و Twohand1، والتنزيل بالباسورد',
    tasks:[['sim','برنامج الطوارئ على المحاكي'],['quiz','أسئلة الدرس']]},
  {id:'l8', n:9, file:'lesson-08.html', title:'الأعطال وأكواد Er + الامتحان النهائي', sub:'Er10 و Er12 و Er15 و Er18 و Er20 و Er40 و Er50، وطريقة التفكير في العطل',
    tasks:[['sim','لعبة الأعطال على المحاكي'],['quiz','أسئلة الدرس'],['final','الامتحان النهائي']]}
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
/* answer options: shuffled, but catch-all choices («الاتنين», «ولا واحد», "Both", "None"…) always stay last */
const QZ_PIN = /^(الاتنين|الاثنين|كلهم|ولا واحد|ولا حاجة|مفيش فرق|مش فارقة|زي بعض|كلهم زي بعض|both|neither|none|all of them|all the same|no difference|it makes no difference)$/i;
function qzOrder(o, keep){ const idx = o.map((_, i) => i); if (keep) return idx; const pin = idx.filter(i => QZ_PIN.test(String(o[i]).replace(/<[^>]*>/g, '').replace(/[⁦-⁩⁠.!]/g, '').trim())); return shuffle(idx.filter(i => !pin.includes(i))).concat(pin); }
/* Latin / number runs inside an RTL option ("+24V", "0.05 A", "DC−", "حوالي +26 °C") would flip: isolate them as LTR */
const QZ_LTR = /[+\-−±]?[0-9A-Za-zΩµ°][0-9A-Za-zΩµ°%.,:/·×_\-–−+ ]*[0-9A-Za-zΩµ°%+\-−]|[+\-−±]?[0-9A-Za-zΩµ°]/g;
function qzTxt(s){ s = String(s); if (document.documentElement.dir !== 'rtl') return s; return s.split(/(<[^>]+>|&[#\w]+;)/).map((p, i) => i % 2 ? p : p.replace(QZ_LTR, m => '<bdi dir="ltr">' + m + '</bdi>')).join(''); }
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
  const ch = $('header.top .chips'); if (ch) ch.appendChild(themeBtn());
  const prog = $('#lprog');
  function renderProg(){
    if (!prog) return;
    const s = IL.summary(id), pct = Math.round(s.done / s.total * 100);
    prog.innerHTML = `<div class="row"><span>تقدّمك في الدرس: <b>${s.done} من ${s.total}</b></span><span class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="التقدّم ${pct}%"><i style="width:${pct}%"></i></span></div><ul>${L.tasks.map(t => `<li class="${IL.has(id, t[0]) ? 'ok' : ''}">${esc(t[1])}</li>`).join('')}</ul>`;
  }
  renderProg(); IL.on(renderProg);
  const nav = $('#lnav');
  if (nav){
    const i = IL.COURSE.indexOf(L), p = IL.COURSE[i - 1], n = IL.COURSE[i + 1];
    nav.innerHTML = (p ? `<a class="btn" href="${p.file}">→ الدرس ${p.n}: ${esc(p.title)}</a>` : `<a class="btn" href="index.html">→ صفحة الكورس</a>`) +
      (n ? `<a class="btn pri" href="${n.file}">الدرس ${n.n}: ${esc(n.title)} ←</a>` : `<a class="btn pri" href="index.html#certSec">الشهادة ←</a>`);
  }
  window.addEventListener('pageshow', e => { if (e.persisted){ IL.store.reload(); renderProg(); } });
};
IL.hubTheme = () => { const ch = $('header.top .chips'); if (ch) ch.appendChild(themeBtn()); };

/* ---------------- select, then confirm ----------------
   tapping an option only selects it (.sel); right/wrong shows after the learner presses the check / confirm button */
const QZ_T = {check:'صحّح إجاباتي', need:'جاوب على كل الأسئلة الأول', cnt:(n, t) => `جاوبت ${n} من ${t}`, ok:'تأكيد'};
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
IL.quiz = function(host, qs, opt){
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
      const f = $('.qz-f', box); f.className = 'qz-f ' + (ok ? 'ok' : 'no'); f.innerHTML = (ok ? 'صح. ' : 'مش دي. ') + (it.q.why || '');
    });
    $('.qz-chk', host).hidden = true;
    finish();
  }
  function finish(){
    const n = ans.filter(Boolean).length, tot = ans.length, ok = n / tot >= pass - 1e-9;
    const sum = $('.qz-sum', host); sum.hidden = false; sum.className = 'qz-sum ' + (ok ? 'ok' : 'no');
    sum.innerHTML = `<b>نتيجتك: ${n} من ${tot}</b><span>${ok ? 'ممتاز، كده عدّيت ✓' : `محتاج ${Math.ceil(pass * tot - 1e-9)} صح على الأقل. راجع الشرح وجرّب تاني.`}</span><button type="button" class="btn" data-qz="again">${ok ? 'حلّ تاني' : 'جرّب تاني'}</button>`;
    if (ok && opt.lesson) IL.mark(opt.lesson, opt.task || 'quiz');
    if (opt.onDone) opt.onDone(n, tot, ok);
  }
  start();
  const api = {solve(wrong){ order.forEach((it, k) => { const i = wrong && k === 0 ? it.oi.find(j => j !== it.q.a) : it.q.a; const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }); check(); return $('.qz-sum', host).textContent; }, answer(k, i){ const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }, check, order: () => order.map(x => x.q), restart: start};
  (IL._q = IL._q || []).push(api); api.host = host;
  return api;
};

})();

/* قفل الدروس بالترتيب: assets/lesson-gate.js */
;(function(){ if (typeof document === "undefined" || window.LEGate) return; var s = document.createElement("script"); s.src = "/assets/lesson-gate.js?v=20261029g1"; document.head.appendChild(s); })();
