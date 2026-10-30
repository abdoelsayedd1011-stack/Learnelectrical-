/* كورس أساسيات الميكانيكا: shared engine for the hub and the lessons (store/progress · theme · lesson shell · quiz).
   Same engine as maint-lab/maint.js (copied), only the course map differs. The lesson playgrounds live in mech-sims.js. */
(function(){
'use strict';
const IL = window.IL = {};
const KEY = 'mech-lab-v1';

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
  const upd = () => { const d = isDark(); b.textContent = d ? '☀' : '☾'; b.setAttribute('aria-label', d ? T('الوضع الفاتح', 'Light mode') : T('الوضع الغامق', 'Dark mode')); b.title = b.getAttribute('aria-label'); };
  b.addEventListener('click', () => { IL.store.set('theme', isDark() ? 'light' : 'dark'); applyTheme(); upd(); });
  upd(); return b;
}

/* ---------------- course map ---------------- */
const EN = IL.EN = /^en/i.test(document.documentElement.lang || '');
const T = IL.T = (ar, en) => EN ? en : ar;
/* [id, title AR, title EN, sub AR, sub EN, sim AR, sim EN] — every lesson = one playground («sim») + questions («quiz») */
const MAP = [
  ['l1', 'الميكانيكا بتبدأ منين؟ الكميات والوحدات والمتجهات', 'Where mechanics starts: quantities, units and vectors',
   'الطول والكتلة والزمن، وحدات SI، الكتلة والوزن، والكمية القياسية والمتجهة', 'Length, mass and time, SI units, mass vs weight, scalars vs vectors',
   'اجمع قوتين واعمل المحصّلة المطلوبة', 'Add two forces to hit the target resultant'],
  ['l2', 'السرعة والعجلة', 'Speed and acceleration',
   'المسافة والإزاحة، السرعة المتوسطة، العجلة، معادلات الحركة، ومسافة الفرامل', 'Distance vs displacement, average speed, acceleration, the motion equations and braking distance',
   'فرمل العربية تقف على الخط بالظبط', 'Brake the car to stop right on the line'],
  ['l3', 'السقوط الحر والمقذوفات', 'Free fall and projectiles',
   'الجاذبية g، السقوط من ارتفاع، الحركة الأفقية والرأسية، وأحسن زاوية رمي', 'Gravity g, falling from a height, horizontal and vertical motion, and the best launch angle',
   'ارمي الكورة وصيب الهدف', 'Launch the ball and hit the target'],
  ['l4', 'القوة وقوانين نيوتن', 'Force and Newton’s laws',
   'القصور الذاتي، F = m·a، الفعل ورد الفعل، والقوة المحصّلة', 'Inertia, F = m·a, action and reaction, and net force',
   'ازق الصندوق يوصل الخط في 4 ثواني', 'Push the crate to the line in 4 seconds'],
  ['l5', 'الوزن والاحتكاك والسطح المائل', 'Weight, friction and the ramp',
   'الوزن W = m·g، الاحتكاك السكوني والحركي، معامل الاحتكاك، والسطح المائل', 'Weight W = m·g, static and kinetic friction, the friction coefficient and the ramp',
   'لاقي الزاوية اللي الصندوق يبدأ يتزحلق عندها', 'Find the angle where the crate starts to slide'],
  ['l6', 'الشغل والطاقة والقدرة', 'Work, energy and power',
   'الشغل، طاقة الحركة وطاقة الوضع، حفظ الطاقة، القدرة والكيلووات والحصان', 'Work, kinetic and potential energy, conservation of energy, power, kW and hp',
   'اختار الارتفاع اللي العربية تلف اللوب من غير ما تقع', 'Pick the height so the cart makes the loop'],
  ['l7', 'كمية الحركة والتصادم', 'Momentum and collisions',
   'كمية الحركة p = m·v، حفظها في التصادم، التصادم المرن واللازق، والدفع', 'Momentum p = m·v, conservation in a collision, elastic and sticky collisions, impulse',
   'خلّي العربيتين يقفوا بعد الخبطة', 'Make both carts stop after the crash'],
  ['l8', 'العزم والروافع والاتزان', 'Torque, levers and balance',
   'العزم = القوة × الذراع، المفتاح والرافعة، شرطين الاتزان، ومركز الثقل', 'Torque = force × arm, the wrench and the lever, the two balance conditions, centre of gravity',
   'ظبّط المرجيحة تتزن', 'Balance the seesaw'],
  ['l9', 'الحركة الدائرية والتروس', 'Rotation and gears',
   'اللفة والـ rpm والسرعة الزاوية، القوة المركزية، التروس والسيور، والقدرة P = T·ω', 'Revolutions, rpm and angular speed, centripetal force, gears and belts, and power P = T·ω',
   'اختار الترس اللي يطلّع السرعة المطلوبة', 'Choose the gear that gives the target speed'],
  ['l10', 'الضغط والهيدروليك', 'Pressure and hydraulics',
   'الضغط = القوة ÷ المساحة، البار والباسكال، ضغط السوائل، قاعدة باسكال والكريك الهيدروليك', 'Pressure = force ÷ area, bar and pascal, liquid pressure, Pascal’s principle and the hydraulic jack',
   'ارفع العربية بإيد واحدة', 'Lift the car with one hand'],
  ['l11', 'المشروع: اختار موتور لونش + الامتحان النهائي', 'Project: size a winch motor + final exam',
   'كل اللي اتعلمته في مسألة واحدة: القوة والسرعة والقدرة والعزم والـ rpm، ثم الامتحان النهائي', 'Everything in one job: force, speed, power, torque and rpm, then the final exam',
   'احسب موتور الونش خطوة بخطوة', 'Size the winch motor step by step']
];
IL.COURSE = MAP.map((m, i) => {
  const tasks = [['sim', T(m[5], m[6])], ['quiz', T('أسئلة الدرس', 'Lesson questions')]];
  if (i === MAP.length - 1) tasks.push(['final', T('الامتحان النهائي', 'Final exam')]);
  return {id:m[0], n:i + 1, file:'lesson-' + String(i + 1).padStart(2, '0') + '.html', title:T(m[1], m[2]), sub:T(m[3], m[4]), tasks};
});
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
    prog.innerHTML = `<div class="row"><span>${T('تقدّمك في الدرس', 'Your progress')}: <b>${s.done} ${T('من', 'of')} ${s.total}</b></span><span class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${pct}%"><i style="width:${pct}%"></i></span></div><ul>${L.tasks.map(t => `<li class="${IL.has(id, t[0]) ? 'ok' : ''}">${esc(t[1])}</li>`).join('')}</ul>`;
  }
  renderProg(); IL.on(renderProg);
  const nav = $('#lnav');
  if (nav){
    const i = IL.COURSE.indexOf(L), p = IL.COURSE[i - 1], n = IL.COURSE[i + 1];
    nav.innerHTML = (p ? `<a class="btn" href="${p.file}">${T('→ الدرس', '← Lesson')} ${p.n}: ${esc(p.title)}</a>` : `<a class="btn" href="index.html">${T('→ صفحة الكورس', '← Course page')}</a>`) +
      (n ? `<a class="btn pri" href="${n.file}">${T('الدرس', 'Lesson')} ${n.n}: ${esc(n.title)} ${T('←', '→')}</a>` : `<a class="btn pri" href="index.html#certSec">${T('الشهادة ←', 'Certificate →')}</a>`);
  }
  window.addEventListener('pageshow', e => { if (e.persisted){ IL.store.reload(); renderProg(); } });
};
IL.hubTheme = () => { const ch = $('header.top .chips'); if (ch) ch.appendChild(themeBtn()); };

/* ---------------- select, then confirm ----------------
   tapping an option only selects it (.sel); right/wrong shows after the learner presses the check / confirm button */
const QZ_T = {check:T('صحّح إجاباتي', 'Check my answers'), need:T('جاوب على كل الأسئلة الأول', 'Answer every question first'), cnt:(n, t) => T(`جاوبت ${n} من ${t}`, `Answered ${n} of ${t}`), ok:T('تأكيد', 'Confirm')};
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
      const f = $('.qz-f', box); f.className = 'qz-f ' + (ok ? 'ok' : 'no'); f.innerHTML = (ok ? T('صح. ', 'Correct. ') : T('مش دي. ', 'Not this one. ')) + (it.q.why || '');
    });
    $('.qz-chk', host).hidden = true;
    finish();
  }
  function finish(){
    const n = ans.filter(Boolean).length, tot = ans.length, ok = n / tot >= pass - 1e-9;
    const sum = $('.qz-sum', host); sum.hidden = false; sum.className = 'qz-sum ' + (ok ? 'ok' : 'no');
    sum.innerHTML = `<b>${T('نتيجتك', 'Your score')}: ${n} ${T('من', 'of')} ${tot}</b><span>${ok ? T('ممتاز، عدّيت ✓', 'Great, you passed ✓') : T(`محتاج ${Math.ceil(pass * tot - 1e-9)} صح على الأقل. راجع وجرّب تاني.`, `You need at least ${Math.ceil(pass * tot - 1e-9)} right. Review and try again.`)}</span><button type="button" class="btn" data-qz="again">${ok ? T('حل تاني', 'Solve again') : T('جرّب تاني', 'Try again')}</button>`;
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
