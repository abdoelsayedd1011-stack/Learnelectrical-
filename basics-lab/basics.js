/* أساسيات الكهربا للمبتدئين: shared engine for the hub and the 13 lessons.
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
  {id:'vi', n:2, file:'lesson-02.html', title:'الجهد والتيار', sub:'الفولت بيزق والأمبير بيمشي: الدايرة المقفولة، اتجاه التيار، الوحدات وتحويلها، وإزاي تقيسهم',
    tasks:[['flow','تجربة الدايرة'],['units','تمرين تحويل الوحدات'],['meter','فين تحط العداد'],['quiz','أسئلة الدرس']]},
  {id:'cond', n:3, file:'lesson-03.html', title:'التوصيلية والمواد الموصلة والعازلة', sub:'النحاس والألومنيوم والبلاستيك والميّة: مين يوصّل ومين يعزل، وطول وتخانة السلك بيأثروا إزاي',
    tasks:[['mat','جهاز اختبار المواد'],['wire','حاسبة مقاومة السلك'],['quiz','أسئلة الدرس']]},
  {id:'sp', n:4, file:'lesson-04.html', title:'التوصيل على التوالي والتوازي', sub:'لمبات ورا بعض وجنب بعض: التيار والجهد في كل لمبة، ليه البيت كله توازي، والبطاريات',
    tasks:[['build','تجربة التوالي والتوازي'],['total','تمرين حساب المقاومة الكلية'],['quiz','أسئلة الدرس']]},
  {id:'pw', n:5, file:'lesson-05.html', title:'القدرة والطاقة', sub:'الوات والكيلووات والحصان، الكيلووات ساعة وفاتورة البيت، الحرارة في السلك، والكفاءة',
    tasks:[['tri','مثلث القدرة'],['house','حاسبة أجهزة البيت'],['quiz','أسئلة الدرس']]},
  {id:'l2', n:6, file:'lesson-06.html', title:'أنواع الكهربا', sub:'المستمرة والمترددة، سنجل فاز وتلاتة فاز، وألوان الأسلاك والأرضي',
    tasks:[['wave','شكل الموجة'],['wires','تمرين ألوان الأسلاك'],['quiz','أسئلة الدرس']]},
  {id:'l3', n:7, file:'lesson-07.html', title:'السلامة والعدّة', sub:'مفك الاختبار، قاطع التسريب، والعدّة اللي لازم تبقى معاك',
    tasks:[['tester','تجربة مفك الاختبار'],['rcd','تجربة قاطع التسريب'],['dodont','اعمل / ماتعملش'],['quiz','أسئلة الدرس']]},
  {id:'l4', n:8, file:'lesson-08.html', title:'الأفوميتر (AVO)', sub:'تقيس فولت وأوم وتوصيل وتيار من غير ما تتعوّر ولا تحرق العداد',
    tasks:[['ex-socket','جهد البريزة'],['ex-bat9','بطارية 9V'],['ex-bat15','بطارية 1.5V'],['ex-wire','سلك سليم ومقطوع'],['ex-res','قيمة مقاومة'],['quiz','أسئلة الدرس']]},
  {id:'l5', n:9, file:'lesson-09.html', title:'قياس الأجهزة عمليًا', sub:'السخان والغلاية واللمبة والفيوز والموتور، وقياس التيار بالكلامب',
    tasks:[['heater','السخان'],['kettle','الغلاية'],['lamp','لمبة الفتيلة'],['fuse','الفيوز'],['motor3','موتور 3 فاز'],['motor1','موتور سنجل فاز'],['clamp','الكلامب ميتر'],['diag','3 تشخيصات صح'],['quiz','أسئلة الدرس']]},
  {id:'l6', n:10, file:'lesson-10.html', title:'المحوّل (الترانس) والباور سبلاي', sub:'إزاي الترانس بيوطّي الجهد، والباور سبلاي بيحوّل الكهربا المترددة لمستمرة، وإزاي تقيسهم',
    tasks:[['xfmr','تجربة الترانس'],['xmeas','قياس الترانس'],['psu','مراحل الباور سبلاي'],['pmeas','قياس الباور سبلاي'],['quiz','أسئلة الدرس']]},
  {id:'l7', n:11, file:'lesson-11.html', title:'قانون أوم والقدرة واختيار السلك والقاطع', sub:'تحسب التيار من القدرة، وتختار القاطع ومقاس السلك صح',
    tasks:[['calc','الحاسبة'],['drill','اختار القاطع والسلك'],['quiz','أسئلة الدرس']]},
  {id:'l8', n:12, file:'lesson-12.html', title:'توصيل اللمبة والبريزة', sub:'وصّل بإيدك: لمبة بمفتاح، بريزة بأرضي، مفتاح سلم، ولمبتين على التوازي',
    tasks:[['w-a','لمبة ومفتاح'],['w-b','بريزة بأرضي'],['w-c','مفتاح السلم'],['w-d','لمبتين توازي'],['quiz','أسئلة الدرس']]},
  {id:'l9', n:13, file:'lesson-13.html', title:'أعطال البيت الشائعة', sub:'لعبة تدوّر فيها على العطل بالتستر والأفوميتر، والامتحان النهائي',
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
/* answer options: shuffled, but catch-all choices («الاتنين», «ولا واحد», "Both", "None"…) always stay last */
const QZ_PIN = /^(الاتنين|الاثنين|كلهم|ولا واحد|ولا حاجة|مفيش فرق|مش فارقة|زي بعض|كلهم زي بعض|both|neither|none|all of them|all the same|no difference|it makes no difference)$/i;
function qzOrder(o, keep){ const idx = o.map((_, i) => i); if (keep) return idx; const pin = idx.filter(i => QZ_PIN.test(String(o[i]).replace(/<[^>]*>/g, '').replace(/[⁦-⁩⁠.!]/g, '').trim())); return shuffle(idx.filter(i => !pin.includes(i))).concat(pin); }
/* Latin / number runs inside an RTL option ("+24V", "0.05 A", "DC−", "حوالي +26 °C") would flip: isolate them as LTR */
const QZ_LTR = /[+\-−±]?[0-9A-Za-zΩµ°][0-9A-Za-zΩµ°%.,:/·×_\-–−+ ]*[0-9A-Za-zΩµ°%+\-−]|[+\-−±]?[0-9A-Za-zΩµ°]/g;
function qzTxt(s){ s = String(s); if (document.documentElement.dir !== 'rtl') return s; return s.split(/(<[^>]+>|&[#\w]+;)/).map((p, i) => i % 2 ? p : p.replace(QZ_LTR, m => '<bdi dir="ltr">' + m + '</bdi>')).join(''); }
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
BL.quiz = function(host, qs, opt){
  opt = opt || {};
  const pass = opt.pass == null ? 0.75 : opt.pass;
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
    sum.innerHTML = `<b>نتيجتك: ${n} من ${tot}</b><span>${ok ? 'ممتاز، كده عدّيت ✓' : `محتاج ${Math.ceil(pass * tot)} صح على الأقل. راجع الشرح وجرّب تاني.`}</span><button type="button" class="btn" data-qz="again">${ok ? 'حلّ تاني' : 'جرّب تاني'}</button>`;
    if (ok && opt.lesson) BL.mark(opt.lesson, opt.task || 'quiz');
    if (opt.onDone) opt.onDone(n, tot, ok);
  }
  start();
  const api = {solve(wrong){ order.forEach((it, k) => { const i = wrong && k === 0 ? it.oi.find(j => j !== it.q.a) : it.q.a; const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }); check(); return $('.qz-sum', host).textContent; }, answer(k, i){ const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }, check, order: () => order.map(x => x.q), restart: start};
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
  <text x="198" y="150" text-anchor="middle" class="dev-ars">التضييق = المقاومة</text>
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
  <label>المقاومة (التضييق): <b class="o-rl">12 Ω</b><input type="range" min="2" max="48" step="1" value="12" class="o-sr" aria-label="المقاومة بالأوم"></label></div>
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
  <div class="ex b-ex"><b>مثال محلول (مروحة 70 وات شغالة 5 ساعات في اليوم):</b><br>
  1) الوات ÷ 1000 = كيلووات ⇐ <span class="mono" dir="ltr">70 ÷ 1000 = 0.07 kW</span><br>
  2) × ساعات اليوم ⇐ <span class="mono" dir="ltr">0.07 × 5 = 0.35 kWh</span> في اليوم<br>
  3) × 30 يوم ⇐ <span class="mono" dir="ltr">0.35 × 30 = 10.5 kWh</span> في الشهر<br>
  4) × سعر الكيلو ⇐ <span class="mono" dir="ltr">10.5 × 1.35 ≈ 14</span> جنيه<br>
  اعمل نفس الخطوات على السخان اللي تحت.</div>
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
    else { m.className = 'msg b-msg bad'; m.textContent = 'لأ. امشي على خطوات المثال اللي فوق: 2000 ÷ 1000 = 2 kW، × 3 ساعات، × 30 يوم.'; }
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
      m.val = 0; m.text = '0.00'; m.unit = 'A'; m.note = 'قياس الأمبير بالأفوميتر محتاج تفتح الدايرة وتحط العداد على التوالي. في الشغل العملي استخدم <b>الكلامب ميتر</b> (الدرس 9).'; return m;
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
  const S = {ex:0, wires:[], pend:null, color:'L', ghost:0, power:false, st:null};
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
  function hint(){ // the first concrete wiring problem against the reference solution
    const e = ex(), T = terms(e), sol = e.solution || [], has = t => S.wires.some(w => w[0] === t || w[1] === t), nm = t => `${T[t] ? T[t].lab : t} في ${esc((T[t] && T[t].comp.label) || '')}`;
    for (const p of sol) for (const t of [p[0], p[1]]) if (!has(t)) return {t:`الطرف ${nm(t)} مش متوصل.`, hl:[t]};
    return null;
  }
  /* «💡 الخطوة الجاية» (window.NH, /assets/next-hint.js): the next wire against the exercise's reference, with its colour.
     A switch's two ends, a 2-way switch's L1/L2 and a lamp's two ends may be swapped (the check accepts that). */
  let nhCtl = null;
  function nhUpdate(){
    if (!window.NH) return; const e = ex();
    if (!nhCtl) nhCtl = NH.mount(q('.bn-board'), {course:'basics', onTap(s){ pulse(s.hl); render(); }});
    if (!e.solution || !e.solution.length){ nhCtl.set(null); return; }
    const T = terms(e), units = [], sol = e.solution.map(p => [p[0], p[1], p[2]]), W = S.wires.map(w => [w[0], w[1]]);
    e.comps.forEach(c => { const u = (a, b) => units.push({dev:c.id, k:c.type, t:[c.id + '.' + a, c.id + '.' + b], sw:true, solo:true}); if (c.type === 'sw2') u('L1', 'L2'); if (c.type === 'sw1') u('L', 'L1'); if (c.type === 'lamp') u('L', 'N'); });
    const C = NH.canon({sol, wires:W, units});
    const lab = t => T[t] ? `${T[t].comp.label || T[t].comp.id}: ${T[t].lab}` : t;
    nhCtl.set(NH.net({sol, wires:W, canon:C.canon, raw:C.raw, lab, idea:p => NH.S.wire(COL_AR[p[2]] || ''), btn:q('[data-b=chk]').textContent.trim()}));
  }
  function pulse(hl){ S.err = hl && hl.length ? {t:new Set(hl), until:Date.now() + 3000} : null; if (S.err) setTimeout(() => { if (S.err && S.err.until <= Date.now()){ S.err = null; render(); } }, 3100); }
  function analyze(){
    const e = ex(), T = terms(e), res = {pass:false, bad:[], warn:[], hl:null}, bad = (t, hl) => { res.bad.push(t); if (!res.hl && hl) res.hl = hl; };
    if (!S.wires.length){ res.bad.push('لسه مفيش ولا سلك. ابدأ من القاطع.'); return res; }
    const {ids, out} = swCombos(), states = out.map(sw => ({sw, r:evalState({mcb:true, tripped:false, sw, lamp:{}, plug:false})}));
    if (states.some(x => x.r.short)){ res.bad.push('<b>قصر!</b> الفاز بيقابل N أو PE من غير لمبة.'); return res; }
    const lampIds = e.comps.filter(c => c.type === 'lamp').map(c => c.id);
    if (e.kind === 'socket'){
      const dead = elems({mcb:true, tripped:false, sw:{}, lamp:{}, plug:false}, {dead:true}).filter(x => !x.bond);
      const R = (a, b) => BL.circuit.resistance(dead, a, b) < 1;
      const so = e.comps.find(c => c.type === 'socket').id;
      if (R(so + '.L', 'db.N') && R(so + '.N', 'db.L')) bad('<b>L و N معكوسين</b> في البريزة: اعكسهم.', [so + '.L', so + '.N']);
      else {
        if (!R(so + '.L', 'db.L')) bad('طرف <b>L</b> في البريزة مش واصل للقاطع.', [so + '.L']);
        if (!R(so + '.N', 'db.N')) bad('طرف <b>N</b> في البريزة مش واصل لبار N.', [so + '.N']);
      }
      if (R(so + '.PE', 'db.N')) bad('<b>الأرضي على بار N!</b> وصّله على بار PE بس.', [so + '.PE']);
      else if (!R(so + '.PE', 'db.PE')) bad('<b>الأرضي مش متوصّل:</b> أخضر×أصفر من بار PE للبريزة.', [so + '.PE']);
      if (!res.bad.length) res.pass = true;
    } else {
      const on = st => st.sw;
      lampIds.forEach(id => {
        const litStates = states.filter(x => x.r.lamps[id] === 1), dim = states.some(x => x.r.lamps[id] > 0 && x.r.lamps[id] < 1);
        if (dim){ bad(`<b>${esc(e.comps.find(c => c.id === id).label)}</b> ضعيفة: اللمبات توالي. كل لمبة بين L1 و N.`, [id + '.N']); return; }
        if (!litStates.length){
          const s1 = states[states.length - 1].r, vL = Math.abs(s1.v(id + '.L')), vN = Math.abs(s1.v(id + '.N'));
          const h = hint(), lb = `<b>${esc(e.comps.find(c => c.id === id).label)}</b> مش بتنوّر: `; if (h) bad(h.t, h.hl); else if (vL > 60 && vN > 60) bad(lb + 'النيوترال مش واصل.', [id + '.N']); else if (vL < 60 && vN < 60) bad(lb + 'الفاز مش واصل.', [id + '.L']); else bad(lb + 'السكة مفتوحة.');
          return;
        }
        if (litStates.length === states.length){ res.bad.push(`<b>${esc(e.comps.find(c => c.id === id).label)}</b> منوّرة على طول: المفتاح مش في سكة الفاز.`); return; }
      });
      if (e.kind === '2way' && !res.bad.length){
        const [a, b] = ids, lit = sw => states.find(x => x.sw[a] === sw[a] && x.sw[b] === sw[b]).r.lamps[lampIds[0]] === 1;
        const okToggle = out.every(sw => lit(sw) !== lit(Object.assign({}, sw, {[a]:!sw[a]})) && lit(sw) !== lit(Object.assign({}, sw, {[b]:!sw[b]})));
        if (!okToggle){ const h = hint(); if (h) bad(h.t, h.hl); else res.bad.push('اللمبة مش بتتحكم من المفتاحين: L1–L1 و L2–L2.'); }
      }
      if (!res.bad.length){
        const unsafe = states.some(x => lampIds.some(id => x.r.lamps[id] === 0 && x.r.live[id]));
        if (unsafe) res.bad.push('<b>مش آمن:</b> المفتاح على النيوترال. حطّه على الفاز (البني).');
        else res.pass = true;
      }
      /* lamp holder polarity: switched live should land on the holder's L */
      if (res.pass) lampIds.forEach(id => { const st = states.find(x => x.r.lamps[id] === 1); if (st && Math.abs(st.r.v(id + '.N')) > 60 && Math.abs(st.r.v(id + '.L')) < 60) res.warn.push(`في ${esc(e.comps.find(c => c.id === id).label)} الفاز على N: خلّيه على <b>L</b> (السنّة).`); });
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
    if (S.power){ ev = evalState(S.st); if (ev.short){ S.st.tripped = true; S.power = false; ev = null; msg('<b>القاطع فصل!</b> فيه قصر. افصل وراجع الأسلاك.', 'bad'); } }
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
    if (S.ghost) (e.solution || []).slice(0, S.ghost).forEach((w, i) => { const A = T[w[0]], B = T[w[1]]; if (A && B) s += `<path class="bw-ghost${i === S.ghost - 1 ? ' cur' : ''}" d="${route(A, B)}" stroke="${w[2] === 'PE' ? '#2e9b3c' : COL[w[2]]}"/>`; });
    S.wires.forEach((w, i) => { const A = T[w[0]], B = T[w[1]]; if (!A || !B) return; const d = route(A, B), flow = ev && ev.wcur[i] > 0.05;
      s += `<g class="bw"><path class="bw-o" d="${d}"/><path class="bw-c" d="${d}" stroke="${colStroke(w[2])}"/>${flow ? `<path d="${d}" class="flow" fill="none" stroke="#fff6b0" stroke-width="2" stroke-dasharray="6 18" style="--dur:.8s;opacity:.9"/>` : ''}<path class="bw-hit" d="${d}" data-w="${i}" tabindex="0" role="button" aria-label="سلك ${COL_AR[w[2]]} من ${A.lab} لـ ${B.lab}: دوس عشان تشيله"/></g>`; });
    Object.values(T).forEach(t => { const pend = S.pend === t.id;
      s += `<g class="bt${pend ? ' pend' : ''}"><circle class="bt-s" cx="${t.x}" cy="${t.y}" r="9"/><path class="bt-x" d="M${t.x - 5} ${t.y}h10"/><circle class="bt-hit" data-t="${t.id}" cx="${t.x}" cy="${t.y}" r="21" tabindex="0" role="button" aria-label="طرف ${t.lab} في ${esc(t.comp.label || '')}"/><circle class="bt-ring${S.err && S.err.t.has(t.id) ? ' err' : ''}" cx="${t.x}" cy="${t.y}" r="14"/><text class="bt-lab" x="${t.x}" y="${t.y + 25}">${t.lab}</text></g>`; });
    s += '</svg>';
    q('.bn-board').innerHTML = s;
    $$('[data-ex]', host).forEach(b => { const i = +b.dataset.ex; b.setAttribute('aria-pressed', i === S.ex ? 'true' : 'false'); b.classList.toggle('done', BL.has(L, cfg.exercises[i].key)); });
    $$('[data-col]', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.col === S.color ? 'true' : 'false'));
    const pw = q('[data-b=pwr]'); pw.textContent = S.power ? 'افصل الكهربا' : 'شغّل الكهربا'; pw.classList.toggle('pri', !S.power); pw.style.background = S.power ? 'var(--bad)' : ''; pw.style.color = S.power ? '#fff' : ''; pw.style.borderColor = S.power ? 'var(--bad)' : '';
    const sb = q('[data-b=sol]'); sb.textContent = !S.ghost ? 'وريني الحل' : S.ghost < (e.solution || []).length ? `وريني التوصيلة ${S.ghost + 1} من ${(e.solution || []).length}` : 'اخفي الحل'; sb.setAttribute('aria-pressed', S.ghost ? 'true' : 'false');
    const pl = q('[data-b=plug]'); pl.hidden = e.kind !== 'socket'; pl.textContent = S.st.plug ? 'شيل اللمبة من البريزة' : 'اشبك لمبة في البريزة';
    if (S.power && ev){ const any = Object.values(ev.lamps).some(Boolean); msg(any ? 'الكهربا شغّالة. دوس على المفتاح عشان تقلبه وشوف اللمبة.' : 'الكهربا شغّالة، بس مفيش حاجة منوّرة. جرّب تقلب المفتاح، أو اختبر التوصيل.', any ? 'ok' : ''); }
    nhUpdate();
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
    else { box.innerHTML = `<div class="bn-bad"><b>✗</b> ${r.bad[0]}</div>`; pulse(r.hl); }
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
    else if (t.dataset.b === 'sol'){ const e = ex(), N = (e.solution || []).length, T = terms(e), lab = x => T[x] ? `${T[x].comp.label || T[x].comp.id}: ${T[x].lab}` : x; S.ghost = S.ghost >= N ? 0 : (S.ghost || 0) + 1; const w = S.ghost && e.solution[S.ghost - 1]; msg(!S.ghost ? 'خبّيت الحل.' : `التوصيلة ${S.ghost} من ${N}: سلك ${COL_AR[w[2]] || ''} من ${lab(w[0])} لـ ${lab(w[1])} (الخط المتقطع الغامق). وصّلها بإيدك، ودوس تاني عشان تظهر اللي بعدها.` + (S.ghost === N ? ' دي آخر توصيلة.' : '')); render(); }
    else if (t.dataset.b === 'plug'){ S.st.plug = !S.st.plug; render(); }
  });
  host.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const t = e.target.closest('[data-t],[data-w],[data-sw]'); if (!t) return; e.preventDefault(); t.dispatchEvent(new MouseEvent('click', {bubbles:true})); });
  setEx(0);
  return {S, setEx, wire(a, b, c){ S.pend = null; if (c) S.color = c; termClick(a); termClick(b); }, clear(){ S.wires = []; saveWires(); render(); }, check, analyze, power(v){ S.power = v; if (v) S.st.tripped = false; render(); return S.power; }, flip(id){ S.st.sw[id] = !S.st.sw[id]; render(); }, lamps: () => Object.assign({}, S.st.lamp), solution: () => (ex().solution || []).slice()};
};

/* =====================================================================
   Lessons 2–5 (الجهد والتيار · التوصيلية · التوالي والتوازي · القدرة والطاقة)
   Pure physics in BL.phys (script-tested), widgets below it.
   ===================================================================== */
const PH = BL.phys = {};
/* number helpers: trim zeros, accept Arabic digits and comma */
function nf(v, d){ if (!isFinite(v)) return '∞'; d = d == null ? 3 : d; let s = (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, ''); return s === '-0' ? '0' : s; }
BL.nf = nf;
function sig(v, n){ if (!isFinite(v)) return '∞'; if (v === 0) return '0'; const a = Math.abs(v), d = Math.max(0, (n || 3) - 1 - Math.floor(Math.log10(a))); return nf(v, Math.min(d, 9)); }
BL.sig = sig;
function pnum(s){ s = String(s == null ? '' : s).trim().replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٫,]/g, '.').replace(/\s+/g, ''); if (!s || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN; return +s; }
BL.pnum = pnum;
const near = (a, b, tol) => isFinite(a) && Math.abs(a - b) <= (tol == null ? 1e-6 : tol) * Math.max(1, Math.abs(b));
PH.near = near;
/* engineering text for Ω / A / V / W */
function eng(v, u){
  if (!isFinite(v)) return '∞ ' + u;
  const a = Math.abs(v);
  if (a === 0) return '0 ' + u;
  if (a >= 1e6) return sig(v / 1e6, 3) + ' M' + u;
  if (a >= 1e3) return sig(v / 1e3, 3) + ' k' + u;
  if (a >= 1) return sig(v, 3) + ' ' + u;
  if (a >= 1e-3) return sig(v * 1e3, 3) + ' m' + u;
  return sig(v * 1e6, 3) + ' µ' + u;
}
BL.eng = eng;

/* ---------- L2: simple circuit (battery + switch + lamp 12Ω) ---------- */
PH.LAMP_R = 12;
PH.flow = (V, closed, R) => { R = R || PH.LAMP_R; const I = closed ? V / R : 0; return {I, Vlamp:I * R, Vsw:closed ? 0 : V, P:I * I * R}; };
/* units */
PH.PFX = {'µ':1e-6, 'm':1e-3, '':1, 'k':1e3};
PH.conv = (val, from, to) => { const f = PH.PFX[from.slice(0, -1)], t = PH.PFX[to.slice(0, -1)]; if (f == null || t == null || from.slice(-1) !== to.slice(-1)) return NaN; return val * f / t; };

BL.flow = function(host, opt){
  const g = U('fl'), L = opt.lesson;
  host.innerHTML = `<div class="wd-art"><svg viewBox="0 0 360 262" role="img" aria-label="دايرة بسيطة: بطارية ومفتاح وأميتر ولمبة وفولتميتر على طرفين اللمبة">
  <defs><radialGradient id="${g}g"><stop offset="0" stop-color="#fff7c2"/><stop offset=".45" stop-color="#ffd84a" stop-opacity=".85"/><stop offset="1" stop-color="#ffb300" stop-opacity="0"/></radialGradient>
  <linearGradient id="${g}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2f33"/><stop offset=".45" stop-color="#4b545b"/><stop offset="1" stop-color="#1c2023"/></linearGradient></defs>
  <path d="M50 100 V60 H140 M188 60 H290 V200 H50 V160" fill="none" stroke="#b5651d" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
  <path class="f-dots flow" d="M50 160 V200 H290 V60 H188 M140 60 H50 V100" fill="none" stroke="#2f8de4" stroke-width="7" stroke-dasharray="0.01 11.99" stroke-linecap="round"/>
  <path class="f-conv flow" d="M50 100 V60 H140 M188 60 H290 V200 H50 V160" fill="none" stroke="#ff9a1f" stroke-width="3" stroke-dasharray="7 5" stroke-linecap="round"/>
  <g class="f-arr"></g>
  <g transform="translate(32 100)"><rect width="36" height="60" rx="5" fill="url(#${g}b)"/><rect x="10" y="-6" width="16" height="7" rx="2" fill="#b9c1c6"/><rect y="20" width="36" height="20" fill="#e2a31a"/><text x="18" y="34" text-anchor="middle" class="f-bv" style="font-size:10px;font-weight:700;fill:#1c2023">6V</text><text x="18" y="14" text-anchor="middle" style="font-size:13px;fill:#fff">+</text><text x="18" y="55" text-anchor="middle" style="font-size:15px;fill:#fff">−</text></g>
  <g class="bn-tap f-swg" tabindex="0" role="button" aria-label="المفتاح: دوس عشان تفتحه أو تقفله"><rect x="128" y="22" width="72" height="52" fill="transparent"/><circle cx="140" cy="60" r="4.5" fill="var(--sym)"/><circle cx="188" cy="60" r="4.5" fill="var(--sym)"/><line class="f-lever" x1="140" y1="60" x2="186" y2="60" stroke="var(--sym)" stroke-width="4" stroke-linecap="round"/></g>
  <text x="164" y="88" text-anchor="middle" class="dev-ars f-swt">المفتاح مقفول</text>
  <g transform="translate(240 60)"><circle r="15" fill="var(--panel)" stroke="var(--sym)" stroke-width="2"/><text y="5" text-anchor="middle" style="font-size:14px;font-weight:700;fill:var(--ink)">A</text></g>
  <text x="240" y="92" text-anchor="middle" class="dev-ars">أميتر (توالي)</text>
  <g transform="translate(290 130)"><circle class="f-glow" r="44" fill="url(#${g}g)" opacity="0"/><circle r="20" fill="#f4f1e6" fill-opacity=".6" stroke="#9aa3a8" stroke-width="1.5" class="f-bulb"/><path d="M-9 0 l4.5 -7 l4.5 7 l4.5 -7 l4.5 7" fill="none" stroke="#6b5a3a" stroke-width="1.8" class="f-fil" transform="translate(0 1)"/></g>
  <path d="M290 95 H338 V115 M338 145 V165 H290" fill="none" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="4 3"/>
  <g transform="translate(338 130)"><circle r="15" fill="var(--panel)" stroke="var(--sym)" stroke-width="2"/><text y="5" text-anchor="middle" style="font-size:14px;font-weight:700;fill:var(--ink)">V</text></g>
  <text x="354" y="222" text-anchor="end" class="dev-ars">فولتميتر على طرفين اللمبة (توازي)</text>
  <text x="180" y="252" text-anchor="middle" class="dev-ar f-dir"></text>
  </svg></div>
  <div class="read"><div><span>جهد البطارية</span><b class="f-V"></b></div><div><span>الأميتر (التيار)</span><b class="f-I"></b></div><div><span>الفولتميتر على اللمبة</span><b class="f-VL"></b></div><div><span>الجهد على طرفين المفتاح</span><b class="f-VS"></b></div></div>
  <div class="wd-ctl"><label>عدد الخلايا (كل خلية 1.5V): <b class="f-nl"></b><input type="range" min="0" max="8" step="1" value="4" class="f-n" aria-label="عدد خلايا البطارية"></label>
  <button type="button" class="btn f-sw" aria-pressed="true">المفتاح: مقفول (الدايرة كاملة)</button>
  <button type="button" class="btn f-md" aria-pressed="false">اعرض الاتجاه الاصطلاحي</button></div>
  <p class="msg f-msg" aria-live="polite"></p>
  <ul class="mm-ex f-ch"><li data-c="half">خلّي الأميتر يقرا <b>0.5A</b> والمفتاح مقفول.</li><li data-c="open">افتح المفتاح والبطارية فيها جهد: شوف التيار بقى كام، وشوف الجهد على طرفين المفتاح.</li><li data-c="conv">بدّل لعرض الاتجاه الاصطلاحي وقارن بحركة الإلكترونات.</li></ul>`;
  const q = s => $(s, host);
  const st = {n:4, closed:true, conv:false, seen:new Set()};
  function upd(){
    const V = st.n * 1.5, r = PH.flow(V, st.closed);
    q('.f-nl').textContent = st.n + ' × 1.5 = ' + nf(V) + ' V'; q('.f-bv').textContent = nf(V) + 'V';
    q('.f-V').textContent = nf(V, 1) + ' V'; q('.f-I').textContent = nf(r.I, 3) + ' A'; q('.f-VL').textContent = nf(r.Vlamp, 2) + ' V'; q('.f-VS').textContent = nf(r.Vsw, 2) + ' V';
    q('.f-lever').setAttribute('x2', st.closed ? 186 : 178); q('.f-lever').setAttribute('y2', st.closed ? 60 : 30);
    q('.f-swt').textContent = st.closed ? 'المفتاح مقفول' : 'المفتاح مفتوح';
    const sw = q('.f-sw'); sw.setAttribute('aria-pressed', st.closed); sw.textContent = st.closed ? 'المفتاح: مقفول (الدايرة كاملة)' : 'المفتاح: مفتوح (الدايرة مقطوعة)';
    const md = q('.f-md'); md.setAttribute('aria-pressed', st.conv); md.textContent = st.conv ? 'اعرض حركة الإلكترونات' : 'اعرض الاتجاه الاصطلاحي';
    const dur = r.I > 0 ? Math.max(0.25, Math.min(5, 0.9 / r.I)) : 1;
    const dots = q('.f-dots'), conv = q('.f-conv');
    dots.style.display = st.conv ? 'none' : ''; conv.style.display = st.conv ? '' : 'none';
    [dots, conv].forEach(p => { p.style.setProperty('--dur', dur + 's'); p.style.animationPlayState = r.I > 0 ? 'running' : 'paused'; p.style.opacity = r.I > 0 ? 1 : (p === dots ? .35 : 0); });
    // direction arrows: electrons − → + (anticlockwise here), conventional + → − (clockwise)
    const cw = st.conv, col = cw ? '#ff9a1f' : '#2f8de4';
    const arr = (x, y, ang) => `<path d="M-7 -6 L5 0 L-7 6 Z" fill="${col}" transform="translate(${x} ${y}) rotate(${ang})"/>`;
    q('.f-arr').innerHTML = r.I > 0 ? (cw ? arr(215, 47, 0) + arr(170, 213, 180) : arr(215, 47, 180) + arr(170, 213, 0)) : '';
    q('.f-dir').textContent = r.I > 0 ? (cw ? 'الاتجاه الاصطلاحي: من + لـ − (ده اللي في الكتب والرسومات)' : 'الإلكترونات: من − لـ + (عكس الاصطلاحي)') : (st.closed ? 'مفيش جهد: مفيش زق ⇐ مفيش تيار' : 'الدايرة مفتوحة: مفيش تيار');
    const b = Math.min(1, r.P / 12);
    q('.f-glow').setAttribute('opacity', b.toFixed(2)); q('.f-bulb').setAttribute('fill', b > .04 ? '#ffe680' : '#f4f1e6'); q('.f-fil').setAttribute('stroke', b > .04 ? '#ff9a00' : '#6b5a3a');
    const m = q('.f-msg');
    if (!st.closed && V > 0) m.innerHTML = `الدايرة مفتوحة ⇐ <b>التيار صفر</b> واللمبة طافية، بس <b>الجهد لسه موجود</b>: ${nf(V, 1)}V على طرفين المفتاح. عشان كده المفتاح المفتوح لسه فيه كهربا!`;
    else if (st.closed && V === 0) m.textContent = 'مفيش بطارية ⇐ مفيش جهد يزق ⇐ مفيش تيار، حتى والدايرة مقفولة.';
    else if (st.closed) m.innerHTML = `التيار = ${nf(V, 1)}V ÷ ${PH.LAMP_R}Ω = <b>${nf(r.I, 3)}A</b>. كل ما تزوّد الخلايا الزق بيزيد والتيار بيزيد.`;
    else m.textContent = 'مفيش جهد ومفيش دايرة.';
    if (st.closed && near(r.I, 0.5)) st.seen.add('half');
    if (!st.closed && V > 0) st.seen.add('open');
    if (st.conv && r.I > 0) st.seen.add('conv');
    $$('.f-ch li', host).forEach(li => li.classList.toggle('ok', st.seen.has(li.dataset.c) || BL.has(L, 'flow')));
    if (['half', 'open', 'conv'].every(k => st.seen.has(k))) BL.mark(L, 'flow');
  }
  q('.f-n').addEventListener('input', e => { st.n = +e.target.value; upd(); });
  const tog = () => { st.closed = !st.closed; upd(); };
  q('.f-sw').addEventListener('click', tog); q('.f-swg').addEventListener('click', tog);
  q('.f-swg').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); tog(); } });
  q('.f-md').addEventListener('click', () => { st.conv = !st.conv; upd(); });
  upd();
  return {st, upd, set(n, closed, conv){ st.n = n; st.closed = closed; st.conv = !!conv; q('.f-n').value = n; upd(); }};
};

BL.units = function(host, opt){
  const L = opt.lesson, need = opt.need || 5;
  const UN = ['µA', 'mA', 'A', 'mV', 'V', 'kV'];
  const BANK = [
    [1500, 'mV', 'V', 'بطارية قلم مكتوب عليها'], [9, 'V', 'mV', 'بطارية 9 فولت'], [11, 'kV', 'V', 'كابل جهد متوسط'], [220, 'V', 'kV', 'كهربا البيت'],
    [380, 'V', 'kV', 'تلاتة فاز في المصنع'], [66, 'kV', 'V', 'خط ضغط عالي'], [50, 'mA', 'A', 'لمبة LED'], [30, 'mA', 'A', 'قاطع التسريب بيفصل عند'],
    [0.25, 'A', 'mA', 'مروحة صغيرة'], [2.1, 'A', 'mA', 'شاحن موبايل'], [500, 'µA', 'mA', 'ساعة حيطة'], [0.0002, 'A', 'µA', 'حساس صغير'],
    [4, 'mA', 'A', 'إشارة حساس في مصنع'], [0.5, 'V', 'mV', 'إشارة حساس حرارة'], [3300, 'mA', 'A', 'بطارية موبايل بتشحن بـ'], [0.012, 'kV', 'V', 'بطارية عربية']
  ];
  host.innerHTML = `<div class="wd" style="background:var(--panel)"><h3>محوّل سريع</h3>
   <div class="wd-ctl"><input class="inp u-v" type="text" inputmode="decimal" value="1.5" aria-label="القيمة" style="width:7em;font-family:var(--font-mono);direction:ltr"><select class="inp u-f" aria-label="الوحدة">${UN.map(u => `<option${u === 'V' ? ' selected' : ''}>${u}</option>`).join('')}</select></div>
   <div class="read u-out"></div></div>
   <div class="chal u-chal"><b>تمرين التحويل:</b> جاوب <b>${need} أسئلة صح</b>. القاعدة: من الكبير للصغير اضرب في 1000، ومن الصغير للكبير اقسم على 1000.
   <p class="u-q" style="margin:8px 0 4px;font-weight:600"></p>
   <div class="wd-ctl"><input class="inp u-a" type="text" inputmode="decimal" aria-label="إجابتك" style="width:8em;font-family:var(--font-mono);direction:ltr"><span class="u-to mono"></span><button type="button" class="btn u-chk" style="flex:0 1 auto">اتأكد</button><button type="button" class="btn u-nx" style="flex:0 1 auto">سؤال تاني</button></div>
   <p class="msg u-msg" aria-live="polite"></p><p class="muted u-sc" style="font-size:.88rem"></p></div>`;
  const q = s => $(s, host);
  function conv(){
    const v = pnum(q('.u-v').value), f = q('.u-f').value, base = f.slice(-1), fam = UN.filter(u => u.slice(-1) === base);
    q('.u-out').innerHTML = fam.map(u => `<div><span>${u}</span><b>${isFinite(v) ? sig(PH.conv(v, f, u), 6) + ' ' + u : '--'}</b></div>`).join('');
  }
  q('.u-v').addEventListener('input', conv); q('.u-f').addEventListener('change', conv); conv();
  let order = shuffle(BANK.map((_, i) => i)), k = 0, ok = 0, tried = false;
  const cur = () => BANK[order[k % order.length]];
  function ask(){ const c = cur(); q('.u-q').innerHTML = `${c[3]} <span class="eq">${nf(c[0], 6)} ${c[1]}</span> = كام <span class="eq">${c[2]}</span>؟`; q('.u-to').textContent = c[2]; q('.u-a').value = ''; q('.u-msg').textContent = ''; q('.u-msg').className = 'msg u-msg'; tried = false; }
  function score(){ q('.u-sc').textContent = `صح لحد دلوقتي: ${Math.min(ok, need)} من ${need}`; if (BL.has(L, 'units')) q('.u-chal').classList.add('ok'); }
  function check(){
    const c = cur(), v = pnum(q('.u-a').value), right = PH.conv(c[0], c[1], c[2]), m = q('.u-msg');
    if (!isFinite(v)){ m.className = 'msg u-msg bad'; m.textContent = 'اكتب رقم.'; return false; }
    if (near(v, right, 1e-6)){
      m.className = 'msg u-msg ok'; m.textContent = `صح: ${nf(c[0], 6)} ${c[1]} = ${sig(right, 6)} ${c[2]}`;
      if (!tried) ok++; tried = true; score(); if (ok >= need) BL.mark(L, 'units'), q('.u-chal').classList.add('ok');
      setTimeout(() => { if (q('.u-msg').classList.contains('ok')){ k++; ask(); } }, 1400);
      return true;
    }
    m.className = 'msg u-msg bad';
    const big = PH.PFX[c[1].slice(0, -1)] > PH.PFX[c[2].slice(0, -1)];
    m.textContent = `لأ. انت رايح من ${big ? 'وحدة كبيرة لوحدة أصغر ⇐ اضرب في 1000' : 'وحدة صغيرة لوحدة أكبر ⇐ اقسم على 1000'}${Math.abs(Math.log10(PH.PFX[c[1].slice(0, -1)] / PH.PFX[c[2].slice(0, -1)])) > 4 ? ' (هنا خطوتين: 1000 × 1000)' : ''}.`;
    tried = true; return false;
  }
  q('.u-chk').addEventListener('click', check);
  q('.u-a').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); check(); } });
  q('.u-nx').addEventListener('click', () => { k++; ask(); });
  ask(); score();
  return {cur, answer(v){ q('.u-a').value = v; return check(); }, next(){ k++; ask(); }, get ok(){ return ok; }};
};

/* ---------- L3: materials & wire resistance ---------- */
/* rho in Ω·mm²/m at 20°C (= 10⁶ × Ω·m), alpha per °C */
PH.MAT = {
  ag:{n:'فضة', rho:0.0159, a:0.0038, col:'#c9ccd0', cls:'c'},
  cu:{n:'نحاس', rho:0.0172, a:0.00393, col:'#c8753a', cls:'c'},
  au:{n:'دهب', rho:0.0244, a:0.0034, col:'#d8b13a', cls:'c'},
  al:{n:'ألومنيوم', rho:0.0282, a:0.00403, col:'#aab3b9', cls:'c'},
  fe:{n:'حديد (صلب)', rho:0.14, a:0.005, col:'#6f777d', cls:'c'},
  nicr:{n:'نيكل كروم (سلك السخان)', rho:1.1, a:0.0004, col:'#8d8a72', cls:'c'},
  gr:{n:'جرافيت (سن القلم الرصاص)', rho:30, a:-0.0005, col:'#3a3d40', cls:'w'},
  salt:{n:'ميّة بملح', R:300, col:'#7fc4ef', cls:'w'},
  tap:{n:'ميّة الحنفية', R:25000, col:'#9fd3f5', cls:'w'},
  wet:{n:'إيد مبلولة', R:1000, col:'#e3a98a', cls:'w'},
  dry:{n:'إيد ناشفة', R:100000, col:'#e8b898', cls:'w'},
  wwood:{n:'خشب مبلول', R:2e6, col:'#8a5a30', cls:'w'},
  wood:{n:'خشب ناشف', R:Infinity, col:'#c08a52', cls:'i'},
  pvc:{n:'بلاستيك PVC', R:Infinity, col:'#dfe5e8', cls:'i'},
  rub:{n:'كاوتش (مطاط)', R:Infinity, col:'#2b2b2b', cls:'i'},
  gl:{n:'زجاج', R:Infinity, col:'#bfe4ef', cls:'i'},
  cer:{n:'سيراميك (بورسلين)', R:Infinity, col:'#f3efe6', cls:'i'},
  air:{n:'هوا (مفيش حاجة)', R:Infinity, col:'none', cls:'i'}
};
PH.TEST_L = 0.1; PH.TEST_A = 1;           // the sample on the tester: 10 cm long, 1 mm² cross-section
PH.TEST_V = 3; PH.TEST_LAMP = 10;          // 3 V battery, lamp 10 Ω (rated 0.9 W)
PH.matR = id => { const m = PH.MAT[id]; return m.R != null ? m.R : m.rho * PH.TEST_L / PH.TEST_A; };
PH.matTest = id => { const R = PH.matR(id), I = isFinite(R) ? PH.TEST_V / (PH.TEST_LAMP + R) : 0, P = I * I * PH.TEST_LAMP; return {R, I, b:Math.min(1, P / (PH.TEST_V * PH.TEST_V / PH.TEST_LAMP)), meter:R > 40e6 ? 'OL' : null, I220:isFinite(R) ? 220 / R : 0}; };
PH.wire = (o) => {          // o: {mat, L (m), A (mm²), I (A), T (°C), V (supply, default 220)}
  const m = PH.MAT[o.mat], T = o.T == null ? 20 : o.T, rho = m.rho * (1 + m.a * (T - 20));
  const R = rho * o.L / o.A, Rloop = 2 * R, dV = (o.I || 0) * Rloop, Vs = o.V || 220;
  return {rho, R, G:1 / R, Rloop, dV, pct:dV / Vs * 100, Ploss:(o.I || 0) * (o.I || 0) * Rloop};
};
PH.SECT = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50];
PH.minSect = (o, maxPct) => (PH.SECT.find(A => PH.wire(Object.assign({}, o, {A})).pct <= maxPct + 1e-9) || null);

function fmtOhm(R){ if (!isFinite(R)) return 'OL'; if (R < 0.1) return nf(R, 4) + ' Ω'; if (R < 1) return nf(R, 3) + ' Ω'; return eng(R, 'Ω'); }
BL.fmtOhm = fmtOhm;

BL.matTester = function(host, opt){
  const g = U('mt'), L = opt.lesson, need = opt.need || 8, ids = Object.keys(PH.MAT);
  host.innerHTML = `<div class="wd-art"><svg viewBox="0 0 360 210" role="img" aria-label="جهاز اختبار: بطارية 3 فولت ولمبة ومسكتين بينهم العيّنة">
  <defs><radialGradient id="${g}g"><stop offset="0" stop-color="#fff7c2"/><stop offset=".45" stop-color="#ffd84a" stop-opacity=".85"/><stop offset="1" stop-color="#ffb300" stop-opacity="0"/></radialGradient></defs>
  <path d="M60 70 V40 H180 M180 40 H300 V150 H232 M128 150 H60 V110" fill="none" stroke="#b5651d" stroke-width="4" stroke-linejoin="round"/>
  <path class="m-flow flow" d="M60 70 V40 H300 V150 H232 M128 150 H60 V110" fill="none" stroke="#ffe27a" stroke-width="2.2" stroke-dasharray="6 18" stroke-linecap="round"/>
  <g transform="translate(44 70)"><rect width="32" height="40" rx="4" fill="#2f3539"/><rect y="12" width="32" height="15" fill="#e2a31a"/><text x="16" y="23.5" text-anchor="middle" style="font-size:9px;font-weight:700;fill:#1c2023">3V</text><rect x="10" y="-5" width="12" height="6" rx="2" fill="#b9c1c6"/></g>
  <g transform="translate(180 40)"><circle class="m-glow" r="38" fill="url(#${g}g)" opacity="0"/><circle r="17" fill="#f4f1e6" fill-opacity=".6" stroke="#9aa3a8" stroke-width="1.5" class="m-bulb"/><path d="M-8 0 l4 -6 l4 6 l4 -6 l4 6" fill="none" stroke="#6b5a3a" stroke-width="1.6" class="m-fil"/></g>
  <path d="M120 142 l14 8 l-14 8 z M240 142 l-14 8 l14 8 z" fill="#c62828"/>
  <rect class="m-smp" x="132" y="141" width="96" height="18" rx="4" fill="#c8753a" stroke="rgba(0,0,0,.35)"/>
  <text class="dev-ar m-smpn" x="180" y="185" text-anchor="middle"></text>
  <g transform="translate(300 190)"><rect x="-46" y="-16" width="92" height="28" rx="6" fill="#2d3337"/><rect x="-40" y="-12" width="80" height="20" rx="3" fill="var(--lcd)"/><text class="m-lcd" x="34" y="3.5" text-anchor="end" style="font:600 13px var(--font-mono);fill:var(--lcd-ink)">--</text></g>
  <text x="300" y="168" text-anchor="middle" class="dev-ars">الأوميتر على العيّنة</text>
  </svg></div>
  <p class="muted" style="font-size:.88rem">العيّنة: <b>10 سم</b> طول و<b>1 مم²</b> مقطع (للحاجات الصلبة). اختار مادة وحطّها بين المسكتين:</p>
  <div class="tabs m-tabs">${ids.map(id => `<button type="button" class="btn" data-m="${id}" aria-pressed="false">${PH.MAT[id].n}</button>`).join('')}</div>
  <div class="read"><div><span>النوع</span><b class="m-cls" style="font-family:var(--font-body)"></b></div><div><span>المقاومة (العداد)</span><b class="m-R"></b></div><div><span>التيار في اللمبة</span><b class="m-I"></b></div></div>
  <p class="msg m-msg" aria-live="polite"></p>
  <p class="chal m-chal">جرّب <b>${need} مواد مختلفة</b> على الأقل، منهم موصلات وعوازل وحاجات "بين بين". <span class="m-cnt"></span></p>`;
  const q = s => $(s, host), seen = new Set();
  const CLS = {c:'موصل كويس', w:'موصل ضعيف', i:'عازل'};
  function pick(id){
    const m = PH.MAT[id], t = PH.matTest(id);
    $$('[data-m]', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.m === id));
    const smp = q('.m-smp'); smp.setAttribute('fill', m.col === 'none' ? 'transparent' : m.col); smp.setAttribute('stroke', m.col === 'none' ? 'var(--muted)' : 'rgba(0,0,0,.35)'); smp.setAttribute('stroke-dasharray', m.col === 'none' ? '4 3' : '');
    smp.setAttribute('fill-opacity', id === 'gl' || id === 'tap' || id === 'salt' ? .7 : 1);
    q('.m-smpn').textContent = m.n;
    q('.m-lcd').textContent = t.meter || fmtOhm(t.R).replace(' ', '');
    q('.m-cls').textContent = CLS[m.cls]; q('.m-cls').style.color = m.cls === 'c' ? 'var(--good)' : m.cls === 'i' ? 'var(--bad)' : 'var(--warn)';
    q('.m-R').textContent = t.meter || fmtOhm(t.R); q('.m-I').textContent = eng(t.I, 'A');
    q('.m-glow').setAttribute('opacity', t.b.toFixed(2)); q('.m-bulb').setAttribute('fill', t.b > .05 ? '#ffe680' : '#f4f1e6'); q('.m-fil').setAttribute('stroke', t.b > .05 ? '#ff9a00' : '#6b5a3a');
    const fl = q('.m-flow'); fl.style.opacity = t.I > 0.01 ? 1 : 0; fl.style.setProperty('--dur', Math.max(.3, 0.09 / Math.max(t.I, 1e-3)) + 's');
    let txt;
    if (m.cls === 'c') txt = `<b>${m.n}</b> موصل: مقاومة العيّنة ${fmtOhm(t.R)} بس، فاللمبة نوّرت ${t.b > .97 ? 'عادي' : 'بس أضعف شوية'}.${id === 'nicr' ? ' النيكل كروم مقاومته أعلى من النحاس 64 مرة تقريبًا، وعشان كده بيسخن ويتعمل منه سلك السخان والمكواة.' : id === 'fe' ? ' الحديد بيوصّل بس أضعف من النحاس 8 مرات، عشان كده مش بنعمل منه أسلاك.' : ''}${t.R < 0.1 ? ' (العداد الحقيقي هيقرا حوالي 0.1–0.3Ω بسبب أسلاك المجسات نفسها.)' : ''}`;
    else if (m.cls === 'i') txt = `<b>${m.n}</b> عازل: العداد قرا <b>OL</b> (مقاومة كبيرة جدًا) ومفيش تيار.${id === 'air' ? ' الهوا عازل كويس، بس الجهد العالي جدًا (زي البرق أو الضغط العالي) يقدر يكسره ويعمل شرارة.' : id === 'wood' ? ' بس <b>لو اتبلّ</b> بيبقى موصل (جرّب الخشب المبلول).' : ''}`;
    else txt = `<b>${m.n}</b> موصل ضعيف: العداد قرا <b>${fmtOhm(t.R)}</b>${t.b < .05 ? '، واللمبة ماتنورش لأن 3V تيارها صغير' : '، واللمبة نوّرت ضعيف'}.${['salt', 'tap', 'wet', 'dry', 'wwood'].includes(id) ? ` بس على <b>220V</b> التيار يبقى حوالي <b>${eng(t.I220, 'A')}</b>${t.I220 >= 0.03 ? ' وده كفاية <b>يموّت</b> (أكتر من 30mA)' : t.I220 >= 0.001 ? ' وده تحسّه كلسعة' : ''}.` : ''}${id === 'wet' ? ' عشان كده ماتلمسش كهربا وإيدك مبلولة أبدًا.' : ''}`;
    q('.m-msg').innerHTML = txt;
    seen.add(id); cnt();
    if (seen.size >= need && ['c', 'i', 'w'].every(c => [...seen].some(x => PH.MAT[x].cls === c))) { BL.mark(L, 'mat'); q('.m-chal').classList.add('ok'); }
    return t;
  }
  function cnt(){ q('.m-cnt').textContent = `(جرّبت ${seen.size})`; if (BL.has(L, 'mat')) q('.m-chal').classList.add('ok'); }
  host.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) pick(b.dataset.m); });
  pick('cu');
  return {pick, seen};
};

BL.wireCalc = function(host, opt){
  const L = opt.lesson, mats = ['cu', 'al', 'fe', 'ag', 'nicr'];
  host.innerHTML = `<div class="wd-ctl">
   <label style="flex:1 1 140px">المادة: <select class="inp w-m">${mats.map(m => `<option value="${m}">${PH.MAT[m].n}</option>`).join('')}</select></label>
   <label style="flex:1 1 140px">المقطع: <select class="inp w-a">${PH.SECT.map(a => `<option value="${a}"${a === 2.5 ? ' selected' : ''}>${a} مم²</option>`).join('')}</select></label>
   <label>الطول (متر، من اللوحة للجهاز): <b class="w-ll"></b><input type="range" class="w-l" min="1" max="200" step="1" value="25" aria-label="طول السلك بالمتر"></label>
   <label style="flex:1 1 140px">التيار (أمبير): <input type="number" class="inp w-i" min="0" max="200" step="0.5" value="16"></label>
   <label>حرارة السلك: <b class="w-tl"></b><input type="range" class="w-t" min="20" max="90" step="5" value="20" aria-label="حرارة السلك"></label></div>
   <div class="read"><div><span>مقاومة السلك الواحد R</span><b class="w-R"></b></div><div><span>التوصيلية G = 1/R</span><b class="w-G"></b></div><div><span>رايح جاي (فاز + نيوترال)</span><b class="w-RL"></b></div><div><span>هبوط الجهد ΔV = I × R</span><b class="w-dV"></b></div><div><span>الجهد اللي بيوصل للجهاز</span><b class="w-Vd"></b></div><div><span>حرارة ضايعة في السلك</span><b class="w-P"></b></div></div>
   <p class="msg w-msg" aria-live="polite"></p>
   <div class="chal w-chal"><b>تحدّي:</b> سخان بيسحب <b>16A</b>، والسلك <b>نحاس</b> طوله <b>40 متر</b> من اللوحة. إيه <b>أصغر مقطع</b> يخلّي هبوط الجهد <b>3% أو أقل</b>؟ (استخدم الحاسبة فوق)
   <div class="wd-ctl" style="margin-top:6px"><select class="inp w-ans" aria-label="إجابتك"><option value="">اختار</option>${PH.SECT.slice(2, 9).map(a => `<option value="${a}">${a} مم²</option>`).join('')}</select><button type="button" class="btn w-chk" style="flex:0 1 auto">اتأكد</button><span class="msg w-cm" aria-live="polite"></span></div></div>`;
  const q = s => $(s, host);
  function get(){ return {mat:q('.w-m').value, A:+q('.w-a').value, L:+q('.w-l').value, I:Math.max(0, +q('.w-i').value || 0), T:+q('.w-t').value}; }
  function upd(){
    const o = get(), r = PH.wire(o);
    q('.w-ll').textContent = o.L + ' m'; q('.w-tl').textContent = o.T + ' °C';
    q('.w-R').textContent = fmtOhm(r.R); q('.w-G').textContent = sig(r.G, 3) + ' S'; q('.w-RL').textContent = fmtOhm(r.Rloop);
    q('.w-dV').textContent = nf(r.dV, 2) + ' V (' + nf(r.pct, 1) + '%)'; q('.w-Vd').textContent = nf(Math.max(0, 220 - r.dV), 1) + ' V'; q('.w-P').textContent = nf(r.Ploss, 1) + ' W';
    const m = q('.w-msg'); m.className = 'msg w-msg ' + (r.pct <= 3 ? 'ok' : r.pct <= 5 ? '' : 'bad');
    m.innerHTML = (r.pct <= 3 ? 'ممتاز: الهبوط 3% أو أقل.' : r.pct <= 5 ? 'مقبول على القد (بين 3% و5%). لو الجهاز حساس كبّر المقطع.' : 'الهبوط كبير (أكتر من 5%): الجهاز هيشتغل ضعيف والسلك بيسخن. كبّر المقطع أو قصّر المسافة.') + (o.mat === 'al' ? ' الألومنيوم محتاج مقطع أكبر بحوالي 1.6 مرة عشان يدّي نفس مقاومة النحاس.' : '') + (o.T > 20 ? ` السلك السخن مقاومته زادت ${nf((PH.wire(o).R / PH.wire(Object.assign({}, o, {T:20})).R - 1) * 100, 0)}%.` : '');
  }
  host.addEventListener('input', upd); host.addEventListener('change', upd); upd();
  if (BL.has(L, 'wire')) q('.w-chal').classList.add('ok');
  const ans = PH.minSect({mat:'cu', L:40, I:16, T:20}, 3);
  q('.w-chk').addEventListener('click', () => {
    const v = +q('.w-ans').value, m = q('.w-cm'), r = v ? PH.wire({mat:'cu', L:40, I:16, A:v}) : null;
    if (!v){ m.className = 'msg w-cm bad'; m.textContent = 'اختار مقطع.'; return; }
    if (v === ans){ m.className = 'msg w-cm ok'; m.textContent = `صح: ${v}مم² ⇐ الهبوط ${nf(r.dV, 1)}V يعني ${nf(r.pct, 1)}%.`; q('.w-chal').classList.add('ok'); BL.mark(L, 'wire'); }
    else if (v < ans){ m.className = 'msg w-cm bad'; m.textContent = `لأ: ${v}مم² الهبوط فيه ${nf(r.pct, 1)}%، أكتر من 3%.`; }
    else { m.className = 'msg w-cm bad'; m.textContent = `${v}مم² ينفع (${nf(r.pct, 1)}%)، بس فيه مقطع أصغر منه برضه ينفع وأرخص.`; }
  });
  return {get, upd, ans};
};

/* ---------- L4: series / parallel ---------- */
PH.rSer = rs => rs.reduce((a, r) => a + r, 0);
PH.rPar = rs => { if (!rs.length) return Infinity; if (rs.some(r => r === 0)) return 0; return 1 / rs.reduce((a, r) => a + 1 / r, 0); };
PH.LAMP_V = 12;   // lamps on the builder are rated 12 V
/* cfg: {mode:'series'|'parallel'|'mixed', V, R:[r1,r2,r3], burned:[b1,b2,b3], n:2|3}
   → {lamps:[{V,I,P,on}], Rt, It, Pt}. mixed = L1 in series with (L2 ∥ L3). Ideal source. */
PH.sp = function(c){
  const n = c.mode === 'mixed' ? 3 : (c.n || 3), V = c.V, idx = [...Array(n).keys()], out = idx.map(() => ({V:0, I:0, P:0}));
  let Rt, It;
  if (c.mode === 'series'){
    if (idx.some(i => c.burned[i])){ Rt = Infinity; It = 0; const b = idx.filter(i => c.burned[i]); if (b.length === 1) out[b[0]].V = V; /* open: full V across the gap */ else b.forEach(i => out[i].V = NaN); }
    else { Rt = PH.rSer(idx.map(i => c.R[i])); It = V / Rt; idx.forEach(i => { out[i].I = It; out[i].V = It * c.R[i]; }); }
  } else if (c.mode === 'parallel'){
    const live = idx.filter(i => !c.burned[i]); Rt = PH.rPar(live.map(i => c.R[i])); It = 0;
    idx.forEach(i => { out[i].V = V; out[i].I = c.burned[i] ? 0 : V / c.R[i]; It += out[i].I; });
  } else {
    const br = [1, 2].filter(i => !c.burned[i]), Rp = PH.rPar(br.map(i => c.R[i]));
    if (c.burned[0] || !isFinite(Rp)){
      Rt = Infinity; It = 0;
      if (c.burned[0] && isFinite(Rp)) out[0].V = V; else if (!c.burned[0]){ out[1].V = out[2].V = V; } else { out[0].V = NaN; out[1].V = out[2].V = NaN; }
    } else {
      Rt = c.R[0] + Rp; It = V / Rt; out[0].I = It; out[0].V = It * c.R[0];
      const Vp = It * Rp; [1, 2].forEach(i => { out[i].V = Vp; out[i].I = c.burned[i] ? 0 : Vp / c.R[i]; });
    }
  }
  out.forEach((o, i) => { o.P = o.I * o.I * c.R[i]; o.on = o.I > 1e-9; o.b = Math.min(1, o.P / (PH.LAMP_V * PH.LAMP_V / c.R[i])); o.over = o.V > PH.LAMP_V * 1.1 && !c.burned[i]; });
  return {lamps:out, Rt, It, Pt:out.reduce((a, o) => a + o.P, 0)};
};

function bulb(x, y, o, burned, lab, g, i){
  const b = burned ? 0 : o.b;
  return `<g class="bn-tap sp-l" data-l="${i}" tabindex="0" role="button" aria-label="${lab}: دوس عشان تحرقها أو تصلّحها" transform="translate(${x} ${y})">
   <circle r="34" fill="url(#${g}g)" opacity="${b.toFixed(2)}"/>
   <circle r="16" fill="${b > .03 ? '#ffe680' : '#f4f1e6'}" fill-opacity=".85" stroke="${burned ? 'var(--bad)' : '#9aa3a8'}" stroke-width="${burned ? 2.5 : 1.5}"/>
   ${burned ? '<path d="M-8 2 l3 -6 l2 3 M8 2 l-3 -6 l-2 3" fill="none" stroke="#6b5a3a" stroke-width="1.6"/><path d="M-6 -12 L6 12 M6 -12 L-6 12" stroke="var(--bad)" stroke-width="2.4"/>' : `<path d="M-8 2 l4 -6 l4 6 l4 -6 l4 6" fill="none" stroke="${b > .03 ? '#ff9a00' : '#6b5a3a'}" stroke-width="1.6"/>`}
   <text y="-21" text-anchor="middle" style="font-size:11px;font-weight:700;fill:var(--ink);paint-order:stroke;stroke:var(--panel);stroke-width:3px">${lab}</text></g>`;
}
BL.spLab = function(host, opt){
  const g = U('sp'), L = opt.lesson, RV = [6, 12, 24];
  const st = {mode:'series', V:12, R:[12, 12, 12], burned:[false, false, false], n:3, seen:new Set()};
  host.innerHTML = `<div class="tabs sp-modes" role="group" aria-label="طريقة التوصيل"><button type="button" class="btn" data-mode="series">توالي (ورا بعض)</button><button type="button" class="btn" data-mode="parallel">توازي (جنب بعض)</button><button type="button" class="btn" data-mode="mixed">مختلط</button></div>
  <div class="wd-art"><svg class="sp-svg" viewBox="0 0 360 250" role="img" aria-label="دايرة لمبات"></svg></div>
  <div class="tblw"><table class="tbl sp-tbl"></table></div>
  <div class="wd-ctl"><label>جهد البطارية: <b class="sp-vl"></b><input type="range" class="sp-v" min="0" max="24" step="1.5" value="12" aria-label="جهد البطارية"></label></div>
  <div class="wd-ctl sp-rs"></div>
  <p class="msg sp-msg" aria-live="polite"></p>
  <ul class="mm-ex sp-ch"><li data-c="s-burn">توالي: احرق لمبة (دوس عليها) وشوف الباقي.</li><li data-c="p-burn">توازي: احرق لمبة وشوف الباقي.</li><li data-c="m">مختلط: شوف ليه L1 أنور من L2 و L3.</li></ul>`;
  const q = s => $(s, host);
  function wire(d, I, key){ const dur = I > 0 ? Math.max(.25, Math.min(5, 0.5 / I)) : 1; return `<path d="${d}" fill="none" stroke="#b5651d" stroke-width="4" stroke-linejoin="round"/>${I > 1e-9 ? `<path class="flow" d="${d}" fill="none" stroke="#ffe27a" stroke-width="2" stroke-dasharray="6 18" stroke-linecap="round" style="--dur:${dur}s"/>` : ''}`; }
  function lab(x, y, o){ const t = isNaN(o.V) ? '?' : nf(o.V, 2) + 'V · ' + nf(o.I, 2) + 'A'; return `<text x="${x}" y="${y}" text-anchor="middle" style="font:600 10.5px var(--font-mono);fill:var(--cur);paint-order:stroke;stroke:var(--panel);stroke-width:3px">${t}</text>`; }
  const batt = (V) => `<g transform="translate(26 100)"><rect width="34" height="54" rx="5" fill="#2f3539"/><rect y="18" width="34" height="18" fill="#e2a31a"/><text x="17" y="31" text-anchor="middle" style="font-size:10px;font-weight:700;fill:#1c2023">${nf(V, 1)}V</text><rect x="10" y="-5" width="14" height="6" rx="2" fill="#b9c1c6"/><text x="17" y="13" text-anchor="middle" style="font-size:12px;fill:#fff">+</text></g>`;
  function draw(r){
    const n = st.mode === 'mixed' ? 3 : st.n, Ls = r.lamps; let s = `<defs><radialGradient id="${g}g"><stop offset="0" stop-color="#fff7c2"/><stop offset=".45" stop-color="#ffd84a" stop-opacity=".85"/><stop offset="1" stop-color="#ffb300" stop-opacity="0"/></radialGradient></defs>`;
    const It = r.It;
    if (st.mode === 'series'){
      const xs = n === 3 ? [120, 200, 280] : [150, 250];
      s += wire('M43 100 V50 H330 V205 H43 V154', It);
      xs.forEach((x, i) => { s += bulb(x, 50, Ls[i], st.burned[i], 'L' + (i + 1) + ' · ' + st.R[i] + 'Ω', g, i) + lab(x, 88, Ls[i]); });
    } else if (st.mode === 'parallel'){
      const xs = n === 3 ? [140, 220, 300] : [170, 280];
      s += wire(`M43 100 V45 H${xs[n - 1]}`, It) + wire(`M${xs[n - 1]} 210 H43 V154`, It);
      xs.forEach((x, i) => { s += wire(`M${x} 45 V210`, Ls[i].I) + bulb(x, 120, Ls[i], st.burned[i], 'L' + (i + 1) + ' · ' + st.R[i] + 'Ω', g, i) + lab(x, 160, Ls[i]); });
    } else {
      s += wire('M43 100 V45 H220', It) + wire('M300 210 H43 V154', It) + wire('M220 45 H300', Ls[2].I) + wire('M220 210 H300', Ls[2].I);
      s += wire('M220 45 V210', Ls[1].I) + wire('M300 45 V210', Ls[2].I);
      s += bulb(130, 45, Ls[0], st.burned[0], 'L1 · ' + st.R[0] + 'Ω', g, 0) + lab(130, 82, Ls[0]);
      s += bulb(220, 128, Ls[1], st.burned[1], 'L2 · ' + st.R[1] + 'Ω', g, 1) + lab(220, 168, Ls[1]);
      s += bulb(300, 128, Ls[2], st.burned[2], 'L3 · ' + st.R[2] + 'Ω', g, 2) + lab(300, 168, Ls[2]);
    }
    s += batt(st.V);
    s += `<text x="186" y="240" text-anchor="middle" style="font:600 11px var(--font-mono);fill:var(--ink)">R total = ${isFinite(r.Rt) ? nf(r.Rt, 2) + ' Ω' : '∞ (open)'} · I total = ${nf(It, 2)} A</text>`;
    q('.sp-svg').innerHTML = s;
  }
  function upd(){
    const r = PH.sp(st), n = st.mode === 'mixed' ? 3 : st.n;
    $$('[data-mode]', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === st.mode));
    q('.sp-vl').textContent = nf(st.V, 1) + ' V';
    draw(r);
    q('.sp-tbl').innerHTML = `<thead><tr><th>اللمبة</th><th>R</th><th>V</th><th>I</th><th>P</th><th>النور</th></tr></thead><tbody>${r.lamps.map((o, i) => `<tr><td>L${i + 1}${st.burned[i] ? ' <b style="color:var(--bad)">محروقة</b>' : ''}</td><td class="mono">${st.R[i]}Ω</td><td class="mono">${isNaN(o.V) ? '?' : nf(o.V, 2) + 'V'}</td><td class="mono">${nf(o.I, 3)}A</td><td class="mono">${nf(o.P, 2)}W</td><td><span class="bar" style="display:block;min-width:50px"><i style="width:${Math.round(o.b * 100)}%;background:#f0b400"></i></span>${o.over ? '<b style="color:var(--bad)">⚠</b>' : ''}</td></tr>`).join('')}<tr><td><b>الكلّي</b></td><td class="mono">${isFinite(r.Rt) ? nf(r.Rt, 2) + 'Ω' : '∞'}</td><td class="mono">${nf(st.V, 1)}V</td><td class="mono">${nf(r.It, 3)}A</td><td class="mono">${nf(r.Pt, 2)}W</td><td></td></tr></tbody>`;
    q('.sp-rs').innerHTML = (st.mode === 'mixed' ? '' : `<div class="tabs" style="flex:1 1 100%"><span style="align-self:center;font-size:.9rem">عدد اللمبات:</span>${[2, 3].map(k => `<button type="button" class="btn" data-n="${k}" aria-pressed="${st.n === k}">${k}</button>`).join('')}</div>`) +
      [...Array(n).keys()].map(i => `<label style="flex:1 1 100%;gap:4px 6px"><span style="min-width:2.4em">L${i + 1}:</span>${RV.map(v => `<button type="button" class="btn" style="flex:0 1 auto;min-width:56px" data-r="${i}" data-v="${v}" aria-pressed="${st.R[i] === v}">${v}Ω</button>`).join('')}<button type="button" class="btn" style="flex:0 1 auto" data-burn="${i}" aria-pressed="${st.burned[i]}">${st.burned[i] ? 'صلّحها' : 'احرقها'}</button></label>`).join('');
    const m = q('.sp-msg'), anyB = [...Array(n).keys()].some(i => st.burned[i]), over = r.lamps.some(o => o.over);
    let t;
    if (st.mode === 'series') t = anyB ? `<b>توالي + لمبة محروقة = الدايرة اتقطعت.</b> كل اللمبات طفيت، والجهد كله (${nf(st.V, 1)}V) بقى على طرفين اللمبة المحروقة. زي زينة رمضان القديمة: لمبة واحدة تبوظ والسلسلة كلها تطفي.` : `توالي: <b>نفس التيار</b> (${nf(r.It, 2)}A) في كل اللمبات، والجهد اتقسم عليهم ومجموعه = ${nf(st.V, 1)}V. اللمبة اللي مقاومتها أكبر بتاخد جهد أكبر.`;
    else if (st.mode === 'parallel') t = anyB ? `<b>توازي + لمبة محروقة:</b> الباقي شغّال عادي لأن كل لمبة ليها سكتها. ده بالظبط اللي بيحصل في البيت.` : `توازي: <b>نفس الجهد</b> (${nf(st.V, 1)}V) على كل لمبة، والتيارات بتتجمع: ${r.lamps.slice(0, n).map(o => nf(o.I, 2)).join(' + ')} = ${nf(r.It, 2)}A. المقاومة الكلية (${nf(r.Rt, 2)}Ω) أصغر من أصغر لمبة.`;
    else t = st.burned[0] ? 'L1 محروقة: هي في السكة الرئيسية، فكله طفي.' : `مختلط: تيار L1 كله (${nf(r.lamps[0].I, 2)}A) بيتقسم على L2 و L3، فـ L1 أنور منهم. R = ${st.R[0]} + (${st.R[1]} ∥ ${st.R[2]}) = ${isFinite(r.Rt) ? nf(r.Rt, 2) : '∞'}Ω.`;
    if (over) t += ' <b style="color:var(--bad)">⚠ فيه لمبة واخدة أكتر من جهدها (12V): في الحقيقة هتنوّر جامد وتتحرق بسرعة.</b>';
    m.innerHTML = t;
    if (st.mode === 'series' && anyB && st.V > 0) st.seen.add('s-burn');
    if (st.mode === 'parallel' && anyB && st.V > 0 && r.lamps.some(o => o.on)) st.seen.add('p-burn');
    if (st.mode === 'mixed' && !st.burned[0] && r.lamps[0].on && (r.lamps[1].on || r.lamps[2].on)) st.seen.add('m');
    $$('.sp-ch li', host).forEach(li => li.classList.toggle('ok', st.seen.has(li.dataset.c) || BL.has(L, 'build')));
    if (['s-burn', 'p-burn', 'm'].every(k => st.seen.has(k))) BL.mark(L, 'build');
    return r;
  }
  host.addEventListener('click', e => {
    const t = e.target.closest('[data-mode],[data-n],[data-r],[data-burn],[data-l]'); if (!t) return;
    if (t.dataset.mode){ st.mode = t.dataset.mode; }
    else if (t.dataset.n) st.n = +t.dataset.n;
    else if (t.dataset.r != null && t.dataset.v) st.R[+t.dataset.r] = +t.dataset.v;
    else if (t.dataset.burn != null) st.burned[+t.dataset.burn] = !st.burned[+t.dataset.burn];
    else if (t.dataset.l != null) st.burned[+t.dataset.l] = !st.burned[+t.dataset.l];
    upd();
  });
  host.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const t = e.target.closest('[data-l]'); if (!t) return; e.preventDefault(); st.burned[+t.dataset.l] = !st.burned[+t.dataset.l]; upd(); const f = host.querySelector(`[data-l="${t.dataset.l}"]`); if (f) f.focus(); });
  q('.sp-v').addEventListener('input', e => { st.V = +e.target.value; upd(); });
  upd();
  return {st, upd, set(o){ Object.assign(st, o); if (o.V != null) q('.sp-v').value = o.V; return upd(); }};
};

PH.SPQ = [
  {t:'s', r:[4, 8]}, {t:'s', r:[10, 20, 30]}, {t:'s', r:[100, 220]}, {t:'s', r:[2.2, 4.7, 3.3]},
  {t:'p', r:[6, 3]}, {t:'p', r:[12, 6]}, {t:'p', r:[10, 10]}, {t:'p', r:[20, 30]}, {t:'p', r:[4, 12]}, {t:'p', r:[12, 12, 6]}, {t:'p', r:[6, 6, 6]}, {t:'p', r:[30, 60, 20]},
  {t:'m', r:[4, 12, 6]}, {t:'m', r:[2, 6, 3]}, {t:'m', r:[10, 20, 20]}
];
PH.spqAns = p => p.t === 's' ? PH.rSer(p.r) : p.t === 'p' ? PH.rPar(p.r) : p.r[0] + PH.rPar(p.r.slice(1));
BL.spDrill = function(host, opt){
  const L = opt.lesson, need = opt.need || 4;
  host.innerHTML = `<div class="chal t-chal"><b>احسب المقاومة الكلية</b> لـ ${need} دواير صح. اكتب الرقم بالأوم.
   <p class="t-q" style="margin:8px 0 4px;font-weight:600;line-height:1.9"></p>
   <div class="wd-ctl"><input class="inp t-a" type="text" inputmode="decimal" aria-label="المقاومة الكلية بالأوم" style="width:7em;font-family:var(--font-mono);direction:ltr"><span class="mono">Ω</span><button type="button" class="btn t-chk" style="flex:0 1 auto">اتأكد</button><button type="button" class="btn t-nx" style="flex:0 1 auto">دايرة تانية</button></div>
   <p class="msg t-msg" aria-live="polite"></p><p class="muted t-sc" style="font-size:.88rem"></p></div>`;
  const q = s => $(s, host);
  let order = shuffle(PH.SPQ.map((_, i) => i)), k = 0, ok = 0, tried = false;
  const cur = () => PH.SPQ[order[k % order.length]];
  const rs = p => p.r.map(r => `<span class="eq">${r}Ω</span>`);
  function ask(){ const p = cur(); q('.t-q').innerHTML = p.t === 's' ? `على <b>التوالي</b>: ${rs(p).join(' + ')}` : p.t === 'p' ? `على <b>التوازي</b>: ${rs(p).join(' ∥ ')}` : `<b>مختلط:</b> ${rs(p)[0]} توالي مع (${rs(p).slice(1).join(' ∥ ')} توازي)`; q('.t-a').value = ''; q('.t-msg').textContent = ''; q('.t-msg').className = 'msg t-msg'; tried = false; }
  function sc(){ q('.t-sc').textContent = `صح: ${Math.min(ok, need)} من ${need}`; if (BL.has(L, 'total')) q('.t-chal').classList.add('ok'); }
  function check(){
    const p = cur(), v = pnum(q('.t-a').value), a = PH.spqAns(p), m = q('.t-msg');
    if (!isFinite(v)){ m.className = 'msg t-msg bad'; m.textContent = 'اكتب رقم.'; return false; }
    if (near(v, a, 0.01)){ m.className = 'msg t-msg ok'; m.textContent = `صح: ${nf(a, 2)}Ω.`; if (!tried) ok++; tried = true; sc(); if (ok >= need){ BL.mark(L, 'total'); q('.t-chal').classList.add('ok'); } setTimeout(() => { if (q('.t-msg').classList.contains('ok')){ k++; ask(); } }, 1400); return true; }
    m.className = 'msg t-msg bad'; tried = true;
    m.textContent = p.t === 's' ? 'لأ. في التوالي بس اجمعهم.' : p.t === 'p' ? (p.r.length === 2 ? 'لأ. لاتنين: (R1 × R2) ÷ (R1 + R2). والنتيجة لازم تبقى أصغر من أصغر واحدة.' : 'لأ. 1/R = 1/R1 + 1/R2 + 1/R3. ولو كلهم زي بعض: R ÷ عددهم.') : 'لأ. احسب التوازي الأول، وبعدين اجمع عليه المقاومة اللي على التوالي.';
    return false;
  }
  q('.t-chk').addEventListener('click', check); q('.t-a').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); check(); } });
  q('.t-nx').addEventListener('click', () => { k++; ask(); });
  ask(); sc();
  return {cur, answer(v){ q('.t-a').value = v; return check(); }, get ok(){ return ok; }};
};

/* ---------- L5: power & energy ---------- */
PH.HP = 746;
PH.pvi = function(pair, a, b){
  let P, V, I, R;
  switch (pair){
    case 'VI': V = a; I = b; P = V * I; R = V / I; break;
    case 'VR': V = a; R = b; I = V / R; P = V * V / R; break;
    case 'IR': I = a; R = b; V = I * R; P = I * I * R; break;
    case 'PV': P = a; V = b; I = P / V; R = V * V / P; break;
    case 'PI': P = a; I = b; V = P / I; R = P / (I * I); break;
    case 'PR': P = a; R = b; I = Math.sqrt(P / R); V = Math.sqrt(P * R); break;
  }
  return {P, V, I, R};
};
PH.house = function(items, price, V){
  V = V || 220; let W = 0, day = 0;
  const rows = items.map(it => { const on = it.on !== false, w = on ? it.w * (it.q || 1) : 0, d = on ? w * Math.max(0, Math.min(24, it.h)) / 1000 : 0; W += w; day += d; return {w, day:d, month:d * 30}; });
  return {rows, W, I:W / V, day, month:day * 30, cost:day * 30 * (price || 0)};
};
BL.pvi = function(host, opt){
  const L = opt.lesson;
  const PAIRS = {VI:['الجهد V (فولت)', 'التيار I (أمبير)', 220, 9.09], VR:['الجهد V (فولت)', 'المقاومة R (أوم)', 220, 24.2], IR:['التيار I (أمبير)', 'المقاومة R (أوم)', 10, 2], PV:['القدرة P (وات)', 'الجهد V (فولت)', 2000, 220], PI:['القدرة P (وات)', 'التيار I (أمبير)', 60, 5], PR:['القدرة P (وات)', 'المقاومة R (أوم)', 2000, 24.2]};
  const LBL = {VI:'V و I', VR:'V و R', IR:'I و R', PV:'P و V', PI:'P و I', PR:'P و R'};
  const FX = {VI:['P = V × I', 'R = V ÷ I'], VR:['I = V ÷ R', 'P = V² ÷ R'], IR:['V = I × R', 'P = I² × R'], PV:['I = P ÷ V', 'R = V² ÷ P'], PI:['V = P ÷ I', 'R = P ÷ I²'], PR:['I = √(P ÷ R)', 'V = √(P × R)']};
  host.innerHTML = `<div class="two"><div class="wd-art" style="display:grid;place-items:center"><svg viewBox="0 0 220 170" role="img" aria-label="مثلث القدرة: P فوق، V و I تحت" style="max-width:240px">
   <path d="M110 12 L206 158 H14 Z" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/><path d="M50 100 H170 M110 100 V158" stroke="var(--accent)" stroke-width="2"/>
   <text class="pv-P" x="110" y="80" text-anchor="middle" style="font:700 30px var(--font-mono);fill:var(--ink)">P</text><text class="pv-V" x="72" y="142" text-anchor="middle" style="font:700 26px var(--font-mono);fill:var(--ink)">V</text><text class="pv-I" x="148" y="142" text-anchor="middle" style="font:700 26px var(--font-mono);fill:var(--ink)">I</text><text x="110" y="137" text-anchor="middle" style="font:700 16px var(--font-mono);fill:var(--muted)">×</text></svg>
   <p class="muted" style="font-size:.86rem;text-align:center">غطّي اللي انت عايزه: P = V × I، و V = P ÷ I، و I = P ÷ V</p></div>
   <div style="display:grid;gap:8px;align-content:start"><div class="tabs pv-pairs" role="group" aria-label="انت عارف إيه؟"><span style="flex:1 1 100%;font-size:.9rem">انت عارف:</span>${Object.keys(PAIRS).map(k => `<button type="button" class="btn" data-pair="${k}" style="flex:1 1 30%"><span class="eq">${LBL[k]}</span></button>`).join('')}</div>
   <div class="wd-ctl"><label style="flex:1 1 140px"><span class="pv-la"></span> <input type="number" class="inp pv-a" min="0" step="any"></label><label style="flex:1 1 140px"><span class="pv-lb"></span> <input type="number" class="inp pv-b" min="0" step="any"></label></div></div></div>
   <div class="read"><div><span>القدرة P</span><b class="pv-oP"></b></div><div><span>الجهد V</span><b class="pv-oV"></b></div><div><span>التيار I</span><b class="pv-oI"></b></div><div><span>المقاومة R</span><b class="pv-oR"></b></div><div><span>بالكيلووات / بالحصان</span><b class="pv-oK"></b></div></div>
   <p class="msg pv-fx"></p>
   <div class="chal pv-chal"><b>تحدّي:</b> ملف سخان مقاومته <b>24.2Ω</b> متوصّل على <b>220V</b>. قدرته كام وات؟
   <div class="wd-ctl" style="margin-top:6px"><input class="inp pv-ans" type="text" inputmode="decimal" aria-label="إجابتك بالوات" style="width:7em;font-family:var(--font-mono);direction:ltr"><span class="mono">W</span><button type="button" class="btn pv-chk" style="flex:0 1 auto">اتأكد</button><span class="msg pv-m" aria-live="polite"></span></div></div>`;
  const q = s => $(s, host); let pair = 'VI';
  function setPair(k){ pair = k; const p = PAIRS[k]; q('.pv-la').textContent = p[0] + ':'; q('.pv-lb').textContent = p[1] + ':'; q('.pv-a').value = p[2]; q('.pv-b').value = p[3]; $$('[data-pair]', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.pair === k)); upd(); }
  function upd(){
    const a = +q('.pv-a').value, b = +q('.pv-b').value, ok = a > 0 && b > 0, r = ok ? PH.pvi(pair, a, b) : null;
    q('.pv-oP').textContent = ok ? sig(r.P, 4) + ' W' : '--'; q('.pv-oV').textContent = ok ? sig(r.V, 4) + ' V' : '--'; q('.pv-oI').textContent = ok ? sig(r.I, 4) + ' A' : '--'; q('.pv-oR').textContent = ok ? sig(r.R, 4) + ' Ω' : '--';
    q('.pv-oK').textContent = ok ? sig(r.P / 1000, 3) + ' kW · ' + sig(r.P / PH.HP, 3) + ' HP' : '--';
    q('.pv-fx').innerHTML = ok ? 'المعادلات اللي اتحسبت بيها: ' + FX[pair].map(f => `<span class="eq">${f}</span>`).join(' و ') : 'اكتب رقمين أكبر من صفر.';
    ['P', 'V', 'I'].forEach(x => q('.pv-' + x).style.fill = pair.indexOf(x) >= 0 ? 'var(--muted)' : 'var(--accent)');
    return r;
  }
  host.addEventListener('click', e => { const b = e.target.closest('[data-pair]'); if (b) setPair(b.dataset.pair); });
  q('.pv-a').addEventListener('input', upd); q('.pv-b').addEventListener('input', upd);
  setPair('VI');
  if (BL.has(L, 'tri')) q('.pv-chal').classList.add('ok');
  q('.pv-chk').addEventListener('click', () => { const v = pnum(q('.pv-ans').value), m = q('.pv-m'); if (near(v, 2000, 0.005)){ m.className = 'msg pv-m ok'; m.textContent = 'صح: P = V² ÷ R = 220 × 220 ÷ 24.2 = 2000W.'; q('.pv-chal').classList.add('ok'); BL.mark(L, 'tri'); } else { m.className = 'msg pv-m bad'; m.textContent = 'لأ. عندك V و R ⇐ استخدم P = V² ÷ R.'; } });
  return {setPair, upd, set(a, b){ q('.pv-a').value = a; q('.pv-b').value = b; return upd(); }};
};

BL.house = function(host, opt){
  const L = opt.lesson, items = opt.items.map(x => Object.assign({q:1}, x));
  host.innerHTML = `<div class="tblw"><table class="tbl hs-t"><thead><tr><th>الجهاز</th><th>وات</th><th>عدد</th><th>ساعة/يوم</th></tr></thead><tbody>${items.map((it, i) => `<tr data-i="${i}"><td style="text-align:right"><label style="display:flex;gap:6px;align-items:center;min-height:40px;cursor:pointer"><input type="checkbox" class="hs-on" ${it.on === false ? '' : 'checked'} style="width:20px;height:20px;flex:none"><span>${it.name}<br><span class="muted hs-k" style="font-size:.78rem"></span></span></label></td><td><input type="number" class="inp hs-w" min="0" step="1" value="${it.w}" aria-label="قدرة ${esc(it.name)}" style="width:4.4em;padding:4px;font-family:var(--font-mono);direction:ltr"></td><td><input type="number" class="inp hs-q" min="1" max="50" step="1" value="${it.q}" aria-label="عدد ${esc(it.name)}" style="width:3.2em;padding:4px;font-family:var(--font-mono);direction:ltr"></td><td><input type="number" class="inp hs-h" min="0" max="24" step="0.5" value="${it.h}" aria-label="ساعات تشغيل ${esc(it.name)}" style="width:3.8em;padding:4px;font-family:var(--font-mono);direction:ltr"></td></tr>`).join('')}</tbody></table></div>
   <div class="wd-ctl"><label style="flex:1 1 auto">سعر الكيلووات ساعة (جنيه): <input class="inp hs-p" type="number" min="0" step="0.05" value="${opt.price}" style="width:7em;font-family:var(--font-mono);direction:ltr"></label></div>
   <div class="read"><div><span>لو كله شغّال مع بعض</span><b class="hs-W"></b></div><div><span>التيار على 220V</span><b class="hs-I"></b></div><div><span>في اليوم</span><b class="hs-d"></b></div><div><span>في الشهر (30 يوم)</span><b class="hs-m"></b></div><div><span>الفاتورة التقريبية</span><b class="hs-c"></b></div></div>
   <p class="msg hs-msg"></p>
   <div class="chal hs-chal"><b>تحدّي:</b> تكييف <b>1500W</b> شغّال <b>8 ساعات</b> وسخان <b>2000W</b> شغّال <b>ساعتين</b>. الاتنين بيستهلكوا كام <b>kWh في اليوم</b>؟
   <div class="wd-ctl" style="margin-top:6px"><input class="inp hs-ans" type="text" inputmode="decimal" aria-label="إجابتك بالكيلووات ساعة" style="width:7em;font-family:var(--font-mono);direction:ltr"><span class="mono">kWh</span><button type="button" class="btn hs-chk" style="flex:0 1 auto">اتأكد</button><span class="msg hs-cm" aria-live="polite"></span></div></div>`;
  const q = s => $(s, host);
  function read(){ $$('tr[data-i]', host).forEach(tr => { const it = items[+tr.dataset.i]; it.on = $('.hs-on', tr).checked; it.w = Math.max(0, +$('.hs-w', tr).value || 0); it.q = Math.max(0, Math.round(+$('.hs-q', tr).value || 0)); it.h = Math.max(0, Math.min(24, +$('.hs-h', tr).value || 0)); }); }
  function upd(){
    read(); const p = +q('.hs-p').value || 0, r = PH.house(items, p);
    $$('tr[data-i]', host).forEach(tr => { const i = +tr.dataset.i; $('.hs-k', tr).innerHTML = items[i].on ? `<span class="eq">${nf(r.rows[i].month, 1)} kWh</span> في الشهر` : 'مطفي'; tr.style.opacity = items[i].on ? 1 : .55; });
    q('.hs-W').textContent = nf(r.W, 0) + ' W'; q('.hs-I').textContent = nf(r.I, 1) + ' A'; q('.hs-d').textContent = nf(r.day, 2) + ' kWh'; q('.hs-m').textContent = nf(r.month, 1) + ' kWh'; q('.hs-c').textContent = nf(r.cost, 0) + ' جنيه';
    let top = -1, tv = 0; r.rows.forEach((x, i) => { if (x.month > tv){ tv = x.month; top = i; } });
    q('.hs-msg').innerHTML = (top >= 0 ? `أكتر جهاز بياكل: <b>${items[top].name}</b> (${nf(tv / r.month * 100, 0)}% من الاستهلاك). ` : '') + (r.I > 40 ? '<b style="color:var(--bad)">لو كله اشتغل مع بعض التيار أكبر من قاطع الشقة الرئيسي المعتاد (40A): لازم توزّع التشغيل.</b>' : `لو كله اشتغل مع بعض التيار ${nf(r.I, 1)}A، أقل من قاطع الشقة الرئيسي المعتاد 40A.`);
    return r;
  }
  host.addEventListener('input', upd); host.addEventListener('change', upd); upd();
  if (BL.has(L, 'house')) q('.hs-chal').classList.add('ok');
  q('.hs-chk').addEventListener('click', () => { const v = pnum(q('.hs-ans').value), m = q('.hs-cm'); if (near(v, 16, 0.005)){ m.className = 'msg hs-cm ok'; m.textContent = 'صح: 1.5kW × 8 = 12، و 2kW × 2 = 4، المجموع 16 kWh.'; q('.hs-chal').classList.add('ok'); BL.mark(L, 'house'); } else { m.className = 'msg hs-cm bad'; m.textContent = 'لأ. كل جهاز: (وات ÷ 1000) × الساعات، وبعدين اجمعهم.'; } });
  return {items, upd};
};

})();

/* قفل الدروس بالترتيب: assets/lesson-gate.js */
;(function(){ if (typeof document === "undefined" || window.LEGate) return; var s = document.createElement("script"); s.src = "/assets/lesson-gate.js?v=20261029g1"; document.head.appendChild(s); })();
