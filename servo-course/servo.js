/* كورس السيرفو موتور والدرايف: shared engine for the hub and the 12 lessons.
   Modules: store/progress · theme · lesson shell · quiz · drill · case game (copied from instrumentation-lab/instr.js)
   · device drawings (SV.art) · one interactive widget per lesson topic. Lesson pages hold the text + data and call the widgets.
   Progress key: srvc-lab-v1 (synced by /assets/sync.js; certificate rules read SV.COURSE from this file). */
(function(){
'use strict';
const SV = window.SV = {};
const KEY = 'srvc-lab-v1';

/* ---------------- store ---------------- */
function load(){ try { const s = JSON.parse(localStorage.getItem(KEY)); return s && typeof s === 'object' ? s : {}; } catch (e){ return {}; } }
let S = load(); if (!S.done || typeof S.done !== 'object') S.done = {};
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e){} }
const subs = [];
SV.on = fn => subs.push(fn);
SV.store = {
  has: k => !!S.done[k],
  mark(k){ if (S.done[k]) return false; const f = load(); S = Object.assign({}, f, S); S.done = Object.assign({}, f.done || {}, S.done); S.done[k] = Date.now(); save(); subs.forEach(fn => { try { fn(k); } catch (e){} }); return true; },
  get: k => S[k],
  set(k, v){ S[k] = v; save(); },
  reset(){ S = {done:{}}; save(); subs.forEach(fn => { try { fn(); } catch (e){} }); },
  reload(){ S = load(); if (!S.done) S.done = {}; }
};

/* ---------------- theme (applied before first paint: servo.js loads in <head>) ---------------- */
function applyTheme(){ const t = S.theme; if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
applyTheme();
function isDark(){ const t = document.documentElement.getAttribute('data-theme'); if (t) return t === 'dark'; return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
function themeBtn(){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn theme-b';
  const upd = () => { const d = isDark(); b.textContent = d ? '☀' : '☾'; b.setAttribute('aria-label', d ? 'الوضع الفاتح' : 'الوضع الغامق'); b.title = b.getAttribute('aria-label'); };
  b.addEventListener('click', () => { SV.store.set('theme', isDark() ? 'light' : 'dark'); applyTheme(); upd(); });
  upd(); return b;
}

/* ---------------- course map ---------------- */
SV.COURSE = [
  {id:'l1', n:1, file:'lesson-01.html', title:'يعني إيه سيرفو؟', sub:'اللوب المفتوح والمقفول، والفرق بين السيرفو والستيبر والانفرتر مع موتور إندكشن',
    tasks:[['loop','تجربة اللوب المقفول'],['pick','اختار الموتور المناسب'],['quiz','أسئلة الدرس']]},
  {id:'l2', n:2, file:'lesson-02.html', title:'جوه السيرفو موتور', sub:'الستاتور والمغناطيس الدائم، الإنكودر على ضهر الموتور، الفرامل، وقراية اليافطة',
    tasks:[['parts','أجزاء الموتور'],['plate','قراية اليافطة'],['quiz','أسئلة الدرس']]},
  {id:'l3', n:3, file:'lesson-03.html', title:'الإنكودر: عين السيرفو', sub:'إنكريمنتال وأبسليوت، الريزولوشن بالـ PPR والـ bits، وليه بيفرق في الدقة',
    tasks:[['enc','تجربة قطع الكهربا'],['res','تمرين الريزولوشن'],['quiz','أسئلة الدرس']]},
  {id:'l4', n:4, file:'lesson-04.html', title:'الدرايف من جوه', sub:'دايرة القوى (الموحّد و DC bus و IGBT) وتلات لوبات جوه بعض: التيار والسرعة والمكان',
    tasks:[['blocks','الدايجرام التفاعلي'],['order','رتّب مسار الإشارة'],['quiz','أسئلة الدرس']]},
  {id:'l5', n:5, file:'lesson-05.html', title:'توصيل السيرفو', sub:'الباور L1 L2 L3، خرج U V W (الترتيب مهم)، الإنكودر، الفرامل، مقاومة الفرملة، CN1 و STO',
    tasks:[['wire','وصّل الدرايف'],['swap','جرّب غلطة U و W'],['quiz','أسئلة الدرس']]},
  {id:'l6', n:6, file:'lesson-06.html', title:'أوضاع التشغيل', sub:'وضع المكان بالنبضات، وضع السرعة، وضع العزم، والمواضع الداخلية',
    tasks:[['modes','جرّب الأوضاع الأربعة'],['fmt','تمرين أشكال النبضات'],['quiz','أسئلة الدرس']]},
  {id:'l7', n:7, file:'lesson-07.html', title:'الجير الإلكتروني', sub:'تحسب نسبة الجير من خطوة السكرو أو البكرة أو الجيربوكس، وتربط النبضة بالمللي',
    tasks:[['calc','حاسبة الجير على 3 مكن'],['gdrill','تمارين الحساب'],['quiz','أسئلة الدرس']]},
  {id:'l8', n:8, file:'lesson-08.html', title:'التيونينج وضبط الجين', sub:'نسبة الـ Inertia، جين المكان والسرعة، الأوتو تيون، والفرق بين البطء والاهتزاز',
    tasks:[['auto','جرّب الأوتو تيون'],['tune','ظبط الجين بإيدك'],['quiz','أسئلة الدرس']]},
  {id:'l9', n:9, file:'lesson-09.html', title:'الهومينج والحدود', sub:'حساس الهوم ونبضة Z، الليميت سويتش NC، الـ Software limits، والإنكودر الأبسليوت',
    tasks:[['home','اعمل هومينج'],['limits','جرّب الحدود'],['quiz','أسئلة الدرس']]},
  {id:'l10', n:10, file:'lesson-10.html', title:'التحكم من الـ PLC', sub:'النبضات وحدودها، الأنالوج، والشبكات زي EtherCAT و Profinet و Modbus',
    tasks:[['pulse','محاكي نبضات الـ PLC'],['pick','اختار طريقة التحكم'],['quiz','أسئلة الدرس']]},
  {id:'l11', n:11, file:'lesson-11.html', title:'الأعطال الشائعة', sub:'Overload و Position deviation و Encoder error و Overvoltage و Overspeed، ولعبة أعطال',
    tasks:[['regen','تجربة الـ Overvoltage'],['fgame','لعبة الأعطال'],['quiz','أسئلة الدرس']]},
  {id:'l12', n:12, file:'lesson-12.html', title:'التشغيل لأول مرة + الامتحان النهائي', sub:'خطوات تشغيل سيرفو جديد بالترتيب، وامتحان نهائي على الكورس كله',
    tasks:[['steps','ترتيب خطوات التشغيل'],['final','الامتحان النهائي']]}
];
SV.lessonById = id => SV.COURSE.find(l => l.id === id);
SV.summary = id => { const l = SV.lessonById(id); const done = l.tasks.filter(t => SV.store.has(id + '/' + t[0])).length; return {done, total:l.tasks.length}; };
SV.mark = (lid, task) => SV.store.mark(lid + '/' + task);
SV.has = (lid, task) => SV.store.has(lid + '/' + task);
SV.allDone = () => SV.COURSE.every(l => { const s = SV.summary(l.id); return s.done === s.total; });

/* ---------------- helpers ---------------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
SV.esc = esc;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
SV.$ = $; SV.$$ = $$;
const fmt = (v, d) => { const p = Math.pow(10, d); const r = Math.round(v * p) / p; return (Object.is(r, -0) ? 0 : r).toFixed(d); };
SV.fmt = fmt;
function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
SV.shuffle = shuffle;
const pick = a => a[Math.floor(Math.random() * a.length)];
SV.pick = pick;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
SV.clamp = clamp;
const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
SV.reduced = reduced;
let uid = 0; const U = p => p + (++uid);
SV.uid = U;
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
SV.animate = animate;
/* tap/keyboard on [data-*] elements inside a host */
function onAct(host, sel, fn){
  host.addEventListener('click', e => { const t = e.target.closest(sel); if (t && host.contains(t)) fn(t, e); });
  host.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const t = e.target.closest(sel); if (t && host.contains(t) && t.tagName !== 'BUTTON' && t.tagName !== 'INPUT' && t.tagName !== 'SELECT'){ e.preventDefault(); fn(t, e); } });
}
SV.onAct = onAct;
const num = s => { const v = parseFloat(String(s).replace(',', '.').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))); return isFinite(v) ? v : NaN; };
SV.num = num;
function chal(host, sel, lesson, task){ const c = $(sel, host); if (c && SV.has(lesson, task)) c.classList.add('ok'); return () => { if (c) c.classList.add('ok'); SV.mark(lesson, task); }; }

/* number + unit inside RTL buttons ("3.82 N·m") would flip; isolate those runs as LTR */
const LTR_RE = /([−\-+]?\d[\d.,]*\s?(?:N·m|rpm|kHz|MHz|Hz|kW|kg|mm|µm|ms|mV|V DC|V AC|V|W|A|°|%)(?![A-Za-z]))/g;
const ow = s => String(s).indexOf('<') > -1 ? String(s) : String(s).replace(LTR_RE, '<bdi dir="ltr">$1</bdi>');
SV.ow = ow;

/* ---------------- lesson shell ---------------- */
SV.lesson = function(id){
  const L = SV.lessonById(id); SV.cur = L;
  const ch = $('header.top .chips'); if (ch) ch.appendChild(themeBtn());
  const prog = $('#lprog');
  function renderProg(){
    if (!prog) return;
    const s = SV.summary(id), pct = Math.round(s.done / s.total * 100);
    prog.innerHTML = `<div class="row"><span>تقدّمك في الدرس: <b>${s.done} من ${s.total}</b></span><span class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="التقدّم ${pct}%"><i style="width:${pct}%"></i></span></div><ul>${L.tasks.map(t => `<li class="${SV.has(id, t[0]) ? 'ok' : ''}">${esc(t[1])}</li>`).join('')}</ul>`;
  }
  renderProg(); SV.on(renderProg);
  const nav = $('#lnav');
  if (nav){
    const i = SV.COURSE.indexOf(L), p = SV.COURSE[i - 1], n = SV.COURSE[i + 1];
    nav.innerHTML = (p ? `<a class="btn" href="${p.file}">→ الدرس ${p.n}: ${esc(p.title)}</a>` : `<a class="btn" href="index.html">→ صفحة الكورس</a>`) +
      (n ? `<a class="btn pri" href="${n.file}">الدرس ${n.n}: ${esc(n.title)} ←</a>` : `<a class="btn pri" href="index.html#certSec">الشهادة ←</a>`);
  }
  window.addEventListener('pageshow', e => { if (e.persisted){ SV.store.reload(); renderProg(); } });
};
SV.hubTheme = () => { const ch = $('header.top .chips'); if (ch) ch.appendChild(themeBtn()); };

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
SV.quiz = function(host, qs, opt){
  opt = opt || {};
  const pass = opt.pass == null ? 0.8 : opt.pass;
  let order, ans, sel;
  function start(){
    order = (opt.shuffle ? shuffle(qs) : qs.slice()).map(q => { const idx = q.o.map((_, i) => i); const oi = opt.keepOrder || q.keep ? idx : shuffle(idx); return {q, oi}; });
    ans = order.map(() => null); sel = order.map(() => null); render();
  }
  function render(){
    host.innerHTML = `<div class="qz-list">${order.map((it, k) => `<div class="qz" data-k="${k}"><p class="qz-q">${k + 1}. ${it.q.q}</p><div class="qz-a${opt.row ? ' row' : ''}">${it.oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${ow(it.q.o[i])}</button>`).join('')}</div><p class="qz-f" aria-live="polite"></p></div>`).join('')}</div><div class="qz-chk"><button type="button" class="btn pri" data-qz="check" aria-disabled="true">${QZ_T.check}</button><span class="qz-cnt" aria-live="polite"></span></div><div class="qz-sum" hidden aria-live="polite"></div>`;
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
    if (ok && opt.lesson) SV.mark(opt.lesson, opt.task || 'quiz');
    if (opt.onDone) opt.onDone(n, tot, ok);
  }
  start();
  const api = {solve(wrong){ order.forEach((it, k) => { const i = wrong && k === 0 ? it.oi.find(j => j !== it.q.a) : it.q.a; const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }); check(); return $('.qz-sum', host).textContent; }, answer(k, i){ const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }, check, order: () => order.map(x => x.q), restart: start};
  (SV._q = SV._q || []).push(api); api.host = host;
  return api;
};

/* ---------------- drill: a stream of generated questions ----------------
   gen() → {q (html), o:[...] , a:index, why}  or  {q, input:true, unit, check(v)→bool, ans (text), why}
   need: correct answers to finish the task */
SV.drill = function(host, gen, opt){
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
      card.innerHTML = `<div class="dr-q">${cur.q}</div><div class="qz-a${cur.row ? ' row' : ''}">${oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${ow(cur.o[i])}</button>`).join('')}</div>${QZ_CF()}<p class="qz-f" aria-live="polite"></p>`;
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
  card.addEventListener('click', e => { if (answered) return; const b = pickConfirm(e, card); if (b) result(+b.dataset.i === cur.a, b); });
  card.addEventListener('submit', e => { e.preventDefault(); if (answered) return; const v = num($('input', card).value); if (!isFinite(v)){ const f = $('.qz-f', card); f.className = 'qz-f no'; f.textContent = 'اكتب رقم.'; return; } result(!!cur.check(v)); });
  nx.addEventListener('click', next);
  next();
  return {get cur(){ return cur; }, answer(v){ if (cur.input){ $('input', card).value = v; $('.dr-in button', card).click(); } else { const b = card.querySelector(`.qz-o[data-i="${v}"]`); if (b){ b.click(); $('.dr-ok', card).click(); } } }, next, get ok(){ return ok; }};
};

/* ---------------- case game (field faults) ---------------- */
SV.caseGame = function(host, cases, opt){
  opt = opt || {};
  const need = opt.need || Math.ceil(cases.length * 0.7);
  const order = shuffle(cases.map((_, i) => i)); let k = 0, ok = 0, ans = 0;
  host.innerHTML = `<div class="dr-top"><span class="cg-sc" aria-live="polite"></span><span class="bar"><i class="cg-bar"></i></span></div><div class="cg-card dr-card"></div><div class="dr-act"><button type="button" class="btn pri cg-next" hidden>اللي بعده ←</button></div><p class="chal cg-chal">${opt.goal || `حلّ <b>${need}</b> حالات صح على الأقل.`}</p>`;
  const q = s => $(s, host), fin = chal(host, '.cg-chal', opt.lesson, opt.task), card = q('.cg-card');
  function score(){ q('.cg-sc').innerHTML = `الحالة <b>${Math.min(k + 1, cases.length)}</b> من ${cases.length} · صح: <b>${ok}</b>`; q('.cg-bar').style.width = (ok / need * 100 > 100 ? 100 : ok / need * 100) + '%'; }
  function show(){
    const c = cases[order[k]], oi = shuffle(c.o.map((_, i) => i));
    card.innerHTML = `<h4>${c.t}</h4><div class="dr-q" style="font-weight:500">${c.s}</div>${c.clues && c.clues.length ? `<div class="chips-t">${c.clues.map((cl, i) => `<button type="button" class="btn" data-cl="${i}" aria-expanded="false">افحص: ${cl[0]}</button>`).join('')}</div><div class="cg-clue"></div>` : ''}<p style="margin:4px 0 0;font-weight:600">السبب غالبًا إيه؟</p><div class="qz-a">${oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${ow(c.o[i])}</button>`).join('')}</div>${QZ_CF()}<p class="qz-f" aria-live="polite"></p>`;
    q('.cg-next').hidden = true; ans = 0; score();
  }
  card.addEventListener('click', e => {
    const cl = e.target.closest('[data-cl]');
    if (cl){ const c = cases[order[k]], x = c.clues[+cl.dataset.cl]; $$('[data-cl]', card).forEach(b => b.setAttribute('aria-expanded', String(b === cl))); $('.cg-clue', card).innerHTML = `<div class="box" style="margin-top:6px">${x[1]}</div>`; return; }
    if (ans) return; const b = pickConfirm(e, card); if (!b) return;
    const c = cases[order[k]], good = +b.dataset.i === c.a; ans = 1; if (good) ok++;
    $$('.qz-o', card).forEach(x => { x.disabled = true; if (+x.dataset.i === c.a) x.classList.add('ok'); else if (x === b) x.classList.add('no'); });
    const f = $('.qz-f', card); f.className = 'qz-f ' + (good ? 'ok' : 'no'); f.innerHTML = (good ? 'صح. ' : 'مش ده. ') + c.why;
    score(); if (ok >= need) fin();
    const nx = q('.cg-next'); nx.hidden = false;
    nx.textContent = k + 1 < cases.length ? 'الحالة اللي بعدها ←' : (ok >= need ? 'العب تاني' : 'جرّب تاني من الأول');
  });
  q('.cg-next').addEventListener('click', () => { if (k + 1 < cases.length) k++; else { k = 0; ok = 0; order.sort(() => Math.random() - 0.5); } show(); });
  show();
  return {get cur(){ return cases[order[k]]; }, answer(i){ const b = card.querySelector(`.qz-o[data-i="${i}"]`); if (b){ b.click(); $('.dr-ok', card).click(); } }, next(){ q('.cg-next').click(); }, get ok(){ return ok; }};
};

/* ================= shared drawing helpers ================= */
/* status line colour without losing the element's own class */
function stc(el, c){ el.classList.remove('ok', 'bad', 'warn'); if (c) el.classList.add(c); }
const deg = d => d * Math.PI / 180;
const pol = (cx, cy, r, a) => [cx + r * Math.sin(deg(a)), cy - r * Math.cos(deg(a))]; /* a: degrees, 0 = up, clockwise */
const P2 = p => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
const tx = (x, y, s, o) => { o = o || {}; return `<text x="${x}" y="${y}"${o.a ? ` text-anchor="${o.a}"` : ''} class="${o.ar ? 'svg-ar ' : ''}${o.c || 'w-tx'}" style="font-size:${o.s || 12}px;${o.w ? 'font-weight:' + o.w + ';' : ''}${o.st || ''}">${s}</text>`; };
SV.tx = tx;
function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while (b){ [a, b] = [b, a % b]; } return a; }
SV.gcd = gcd;
const sub = (lesson, key) => { const o = SV.store.get(key); return o && typeof o === 'object' ? o : {}; };
function subMark(key, k){ const o = sub(null, key); if (o[k]) return o; o[k] = 1; SV.store.set(key, o); return o; }

/* motor dial: a shaft disk with a marker; returns svg group string */
function dial(cx, cy, r, a, o){
  o = o || {};
  const m = pol(cx, cy, r - 6, a), m2 = pol(cx, cy, 8, a + 180);
  let s = `<g><circle cx="${cx}" cy="${cy}" r="${r + 8}" fill="#2a3238" stroke="#11171b" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#3d4850" stroke="#59656e" stroke-width="1.5"/>`;
  for (let i = 0; i < 12; i++){ const p1 = pol(cx, cy, r + 2, i * 30), p2 = pol(cx, cy, r + 7, i * 30); s += `<line x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" stroke="#8d99a1" stroke-width="${i % 3 ? 1 : 2.5}"/>`; }
  if (o.ghost != null){ const g = pol(cx, cy, r - 4, o.ghost); s += `<line x1="${cx}" y1="${cy}" x2="${g[0].toFixed(1)}" y2="${g[1].toFixed(1)}" stroke="#7ea6ff" stroke-width="4" stroke-dasharray="5 4" opacity=".9"/>`; }
  s += `<line x1="${m2[0].toFixed(1)}" y1="${m2[1].toFixed(1)}" x2="${m[0].toFixed(1)}" y2="${m[1].toFixed(1)}" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="7" fill="#b9c1c7" stroke="#6b757c"/></g>`;
  return s;
}
SV.dial = dial;

/* ================= device drawings (hub + cards) ================= */
SV.art = {
  motor(o){
    o = o || {};
    let fins = ''; for (let x = 58; x < 140; x += 8) fins += `<line x1="${x}" y1="30" x2="${x}" y2="80" stroke="#3a444b" stroke-width="2"/>`;
    return `<svg viewBox="0 0 200 110" role="img" aria-label="${o.label || 'سيرفو موتور'}"><rect x="4" y="50" width="34" height="10" rx="2" fill="#c3cad0" stroke="#6b757c"/><rect x="12" y="53" width="14" height="4" fill="#8d99a1"/><rect x="34" y="20" width="14" height="70" rx="2" fill="#3b444b"/><circle cx="41" cy="27" r="2.5" fill="#8d99a1"/><circle cx="41" cy="83" r="2.5" fill="#8d99a1"/><rect x="48" y="26" width="98" height="58" rx="5" fill="#252c31"/>${fins}<rect x="146" y="30" width="46" height="50" rx="8" fill="#1b2125"/><rect x="152" y="38" width="30" height="5" rx="2" fill="#2456c9"/><rect x="74" y="10" width="22" height="18" rx="3" fill="#59656e"/><rect x="160" y="16" width="18" height="16" rx="3" fill="#59656e"/><circle cx="85" cy="19" r="5" fill="#2a3238"/><circle cx="169" cy="24" r="4" fill="#2a3238"/></svg>`;
  },
  drive(o){
    o = o || {};
    return `<svg viewBox="0 0 110 150" role="img" aria-label="${o.label || 'درايف سيرفو'}"><rect x="5" y="4" width="100" height="142" rx="6" fill="#2f363c" stroke="#161b1f"/><rect x="15" y="14" width="80" height="26" rx="3" fill="#120707"/><text x="88" y="33" text-anchor="end" style="font:700 14px var(--font-mono);fill:#ff4d3a">${o.disp || 'S-ON'}</text><g fill="#59656e">${[0, 1, 2, 3].map(i => `<rect x="${17 + i * 20}" y="46" width="15" height="10" rx="2"/>`).join('')}</g><rect x="15" y="64" width="34" height="56" rx="3" fill="#1d2327"/>${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="32" cy="${71 + i * 8.5}" r="2.6" fill="#b9c1c7"/>`).join('')}<rect x="58" y="64" width="38" height="22" rx="3" fill="#1d2327"/><rect x="58" y="92" width="38" height="28" rx="3" fill="#1d2327"/><text x="77" y="79" text-anchor="middle" style="font:600 8px var(--font-mono);fill:#b9c1c7">CN1</text><text x="77" y="110" text-anchor="middle" style="font:600 8px var(--font-mono);fill:#b9c1c7">CN2</text><rect x="15" y="128" width="80" height="10" rx="2" fill="#3d4850"/></svg>`;
  },
  disk(o){
    o = o || {};
    let s = `<svg viewBox="0 0 120 120" role="img" aria-label="${o.label || 'قرص إنكودر'}"><circle cx="60" cy="60" r="54" fill="#cfd7dc" stroke="#59656e" stroke-width="2"/><circle cx="60" cy="60" r="44" fill="#9aa6ad"/>`;
    for (let i = 0; i < 36; i++){ const a = pol(60, 60, 52, i * 10), b = pol(60, 60, 45, i * 10); s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="#1d2327" stroke-width="3.5"/>`; }
    return s + `<circle cx="60" cy="60" r="14" fill="#59656e"/><circle cx="60" cy="60" r="5" fill="#cfd7dc"/></svg>`;
  },
  screw(o){
    o = o || {};
    let th = ''; for (let x = 18; x < 190; x += 7) th += `<line x1="${x}" y1="50" x2="${x + 5}" y2="62" stroke="#7d878e" stroke-width="1.6"/>`;
    return `<svg viewBox="0 0 200 110" role="img" aria-label="${o.label || 'بول سكرو'}"><rect x="6" y="36" width="12" height="40" rx="2" fill="#59656e"/><rect x="182" y="36" width="12" height="40" rx="2" fill="#59656e"/><rect x="18" y="50" width="164" height="12" fill="#c3cad0"/>${th}<rect x="78" y="30" width="44" height="52" rx="4" fill="#2456c9"/><rect x="84" y="22" width="32" height="10" rx="2" fill="#3b444b"/></svg>`;
  },
  plc(o){
    o = o || {};
    return `<svg viewBox="0 0 120 120" role="img" aria-label="${o.label || 'PLC'}"><rect x="6" y="10" width="108" height="100" rx="6" fill="#d9dee2" stroke="#59656e"/><rect x="6" y="10" width="108" height="20" rx="6" fill="#3b444b"/><text x="60" y="25" text-anchor="middle" style="font:700 11px var(--font-mono);fill:#e3e9ec">PLC</text>${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${18 + i * 17}" cy="44" r="4" fill="${i % 2 ? '#5cc06f' : '#a9b3b9'}"/>`).join('')}<rect x="14" y="58" width="92" height="40" rx="3" fill="#bfc7cc"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${18 + i * 11}" y="64" width="7" height="28" rx="1" fill="#59656e"/>`).join('')}</svg>`;
  }
};

/* ================= generic: put steps in order ================= */
SV.order = function(host, items, opt){
  opt = opt || {};
  host.innerHTML = `<div class="ord"><ol class="steps-l ord-done"></ol><p class="muted ord-lead">${opt.lead || 'دوس على الخطوة اللي عليها الدور:'}</p><div class="ord-pool"></div><p class="msg ord-msg" aria-live="polite"></p><div class="wd-ctl"><button type="button" class="btn ord-reset">ابدأ من الأول</button></div><p class="chal ord-chal">${opt.goal || 'رتّب كل الخطوات صح.'}</p></div>`;
  const fin = chal(host, '.ord-chal', opt.lesson, opt.task);
  let pos = 0, pool = [];
  const done = $('.ord-done', host), pl = $('.ord-pool', host), msg = $('.ord-msg', host);
  function render(){
    done.innerHTML = items.slice(0, pos).map(t => `<li class="ok">${t}</li>`).join('');
    pl.innerHTML = pool.filter(i => i >= pos).map(i => `<button type="button" class="btn ord-o" data-o="${i}">${items[i]}</button>`).join('');
    $('.ord-lead', host).hidden = pos >= items.length;
  }
  function reset(){ pos = 0; pool = shuffle(items.map((_, i) => i)); render(); msg.className = 'msg'; msg.textContent = ''; }
  pl.addEventListener('click', e => {
    const b = e.target.closest('[data-o]'); if (!b) return; const i = +b.dataset.o;
    if (i === pos){ pos++; render(); msg.className = 'msg ok'; msg.innerHTML = pos === items.length ? (opt.done || 'ترتيب مظبوط ✓') : ((opt.why && opt.why[i]) || 'صح، كمّل.'); if (pos === items.length) fin(); }
    else { msg.className = 'msg bad'; msg.innerHTML = 'مش دي اللي عليها الدور. ' + ((opt.wrong && opt.wrong[i]) || 'فكّر إيه اللي لازم يحصل الأول.'); }
  });
  $('.ord-reset', host).addEventListener('click', reset);
  reset();
  return {solve(){ while (pos < items.length){ const b = pl.querySelector(`[data-o="${pos}"]`); if (!b) break; b.click(); } }};
};

/* generic drill from a fixed list of cases (each shown once per round) */
SV.caseDrill = function(cases, opts){
  let bag = [];
  return () => { if (!bag.length) bag = shuffle(cases.slice()); const c = bag.pop(); return {q:c.s, o:c.o || opts, a:c.a, why:c.why}; };
};

/* ================= L1: open loop vs closed loop ================= */
SV.loopSim = function(host, opt){
  opt = opt || {};
  host.innerHTML = `<div class="tabs" role="group" aria-label="نوع التحكم"><button type="button" class="btn" data-m="open">لوب مفتوح (ستيبر)</button><button type="button" class="btn" data-m="closed">لوب مقفول (سيرفو)</button></div>
  <div class="wd-art ls-art"></div>
  <div class="read"><div><span>الأمر</span><b class="r-cmd">0°</b></div><div><span>الكنترولر فاكر</span><b class="r-bel">0°</b></div><div><span>المكان الحقيقي</span><b class="r-act">0°</b></div><div><span>التيار</span><b class="r-cur">0%</b></div></div>
  <div class="wd-ctl"><button type="button" class="btn pri" data-a="mv">اتحرك 90° ↻</button><button type="button" class="btn" data-a="load" aria-pressed="false">حمل تقيل على العمود</button><button type="button" class="btn" data-a="reset">رجّع للصفر</button></div>
  <p class="statline ls-msg" aria-live="polite"></p>
  <p class="chal ls-chal">شغّل <b>«حمل تقيل»</b> وحرّك <b>في الوضعين</b>: شوف الستيبر بيضيّع خطوات من غير ما يعرف، والسيرفو بيزوّد التيار ويوصل.</p>`;
  const q = s => $(s, host), fin = chal(host, '.ls-chal', opt.lesson, opt.task || 'loop');
  const S = {mode:'open', load:false, cmd:0, bel:0, act:0, tgt:0, seen:{}};
  function draw(){
    const fb = S.mode === 'closed';
    q('.ls-art').innerHTML = `<svg viewBox="0 0 360 222" role="img" aria-label="رسمة اللوب">
      <rect x="8" y="20" width="104" height="62" rx="8" class="w-pn" stroke="currentColor" style="stroke:var(--line)"/>${tx(60, 44, 'الكنترولر', {a:'middle', ar:1, w:700})}${tx(60, 66, 'فاكر: ' + Math.round(S.bel) + '°', {a:'middle', ar:1, s:12, c:'w-mu'})}
      <path d="M112 50 H200 V62" fill="none" class="w-acs" stroke-width="3" marker-end="url(#ar1)"/>${tx(156, 42, 'أمر', {a:'middle', ar:1, s:11, c:'w-mu'})}
      <defs><marker id="ar1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker><marker id="ar2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#2b7a3d"/></marker></defs>
      ${dial(240, 128, 50, S.act, {ghost:S.cmd})}
      ${S.load ? `<rect x="288" y="104" width="62" height="48" rx="6" fill="#8b5a2b" stroke="#5c3a1a"/>${tx(319, 133, 'حمل', {a:'middle', ar:1, w:700, st:'fill:#fff'})}` : ''}
      ${fb ? `<path d="M240 186 V212 H40 V82" fill="none" stroke="#2b7a3d" stroke-width="3" stroke-dasharray="7 5" class="flow" style="--dur:.7s" marker-end="url(#ar2)"/>${tx(140, 204, 'الإنكودر بيرجّع المكان الحقيقي', {a:'middle', ar:1, s:11, st:'fill:#2b7a3d;font-weight:600'})}` : tx(110, 196, 'مفيش رجوع: الكنترولر مش عارف الموتور وصل فين', {a:'middle', ar:1, s:11, c:'w-mu'})}
      ${tx(240, 34, S.mode === 'open' ? 'ستيبر' : 'سيرفو', {a:'middle', ar:1, w:700})}
    </svg>`;
  }
  function cur(){ const moving = Math.abs(S.tgt - S.act) > 0.5; if (S.mode === 'open') return 70; return Math.round((moving ? 45 : 8) + (S.load ? (moving ? 120 : 35) : 0)); }
  function readout(){
    q('.r-cmd').textContent = Math.round(S.cmd) + '°'; q('.r-bel').textContent = Math.round(S.bel) + '°'; q('.r-act').textContent = Math.round(S.act) + '°'; q('.r-cur').textContent = cur() + '%';
    const err = Math.round(S.cmd - S.act), moving = Math.abs(S.tgt - S.act) > 0.5, m = q('.ls-msg');
    if (moving){ stc(m, ''); m.textContent = 'بيتحرك…'; return; }
    if (Math.abs(err) >= 1){ stc(m, 'bad'); m.innerHTML = `الموتور ناقص <b class="eq">${err}°</b> عن الأمر، والكنترولر <b>مش واخد باله</b> لأنه مفيش إنكودر بيقوله. ده اسمه <b>ضياع خطوات (Missed steps)</b>.`; }
    else if (S.cmd){ stc(m, 'ok'); m.innerHTML = S.mode === 'closed' ? (S.load ? 'وصل بالظبط رغم الحمل: الدرايف شاف الغلط من الإنكودر وزوّد التيار (العزم) لحد ما وصل.' : 'وصل بالظبط. لاحظ التيار قليل وهو واقف: السيرفو بياخد على قد الحمل بس.') : 'وصل بالظبط لأن الحمل خفيف. الستيبر بياخد تيار ثابت حتى وهو واقف.'; }
    else { stc(m, ''); m.textContent = 'اختار نوع التحكم ودوس «اتحرك 90°».'; }
  }
  function setMode(m){ S.mode = m; $$('[data-m]', host).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m))); S.cmd = S.bel = S.act = S.tgt = 0; draw(); readout(); }
  onAct(host, '[data-m]', b => setMode(b.dataset.m));
  onAct(host, '[data-a]', b => {
    const a = b.dataset.a;
    if (a === 'load'){ S.load = !S.load; b.setAttribute('aria-pressed', String(S.load)); draw(); readout(); return; }
    if (a === 'reset'){ S.cmd = S.bel = S.act = S.tgt = 0; draw(); readout(); return; }
    if (Math.abs(S.tgt - S.act) > 0.5) return;
    S.cmd += 90; S.bel = S.cmd;
    if (S.mode === 'open') S.tgt += S.load ? Math.round(90 * 0.6 / 1.8) * 1.8 : 90; else S.tgt = S.cmd;
    if (S.load){ S.seen[S.mode] = 1; }
  });
  animate(host, dt => {
    if (S.act !== S.tgt){
      const sp = (S.mode === 'closed' && S.load ? 150 : 200) * dt; const d = S.tgt - S.act;
      S.act = Math.abs(d) <= sp ? S.tgt : S.act + Math.sign(d) * sp; draw(); readout();
      if (S.act === S.tgt && S.seen.open && S.seen.closed) fin();
    }
  });
  setMode('open');
  return {S, move(){ q('[data-a=mv]').click(); }, mode: setMode, load(on){ if (S.load !== on) q('[data-a=load]').click(); }};
};
SV.MOTOR_OPTS = ['سيرفو', 'ستيبر', 'انفرتر + موتور إندكشن'];
SV.MOTOR_CASES = [
  {s:'مروحة شفط كبيرة في مصنع، سرعتها بتتغيّر على حسب الحرارة، ومش مهم هي واقفة فين.', a:2, why:'المطلوب سرعة بس. الانفرتر أرخص وأبسط بكتير.'},
  {s:'ذراع بيلقط علب من سير ويحطها في كرتونة بدقة 0.1 mm وبسرعة عالية.', a:0, why:'دقة مكان + سرعة + حمل بيتغيّر = سيرفو.'},
  {s:'طابعة 3D صغيرة رخيصة، الحمل خفيف وثابت والسرعة قليلة.', a:1, why:'الحمل ثابت وخفيف والميزانية قليلة: الستيبر بيكفّي من غير إنكودر.'},
  {s:'مكنة قص على الطول: الخامة لازم تتقص كل 1250 mm بالظبط، 60 قطعة في الدقيقة.', a:0, why:'تسارع عالي ومكان مظبوط كل مرة: سيرفو.'},
  {s:'طلمبة مياه شغّالة 24 ساعة على ضغط ثابت.', a:2, why:'تحكم سرعة عادي بالـ PID على الضغط: انفرتر.'},
  {s:'محور CNC بيتحرك 30 m/min ولازم يعرف مكانه حتى لو الحمل اتغيّر فجأة.', a:0, why:'لازم feedback حقيقي من الإنكودر: سيرفو.'},
  {s:'محبس دوّار صغير بيلف ربع لفة كل شوية، الحمل خفيف جدًا والميزانية قليلة.', a:1, why:'حركة بسيطة بحمل خفيف: ستيبر رخيص يكفّي.'},
  {s:'سير ناقل طويل في مخزن، المهم السرعة وبس.', a:2, why:'مفيش مكان مطلوب: انفرتر.'},
  {s:'مكنة تغليف: سكينة القص لازم تقص بالظبط على علامة الطباعة اللي على الفيلم.', a:0, why:'تزامن ومكان مظبوط وتسارع عالي: سيرفو.'},
  {s:'كاميرا مراقبة بتلف ببطء على كام مكان ثابت.', a:1, why:'سرعة قليلة وحمل خفيف وثابت: ستيبر.'}
];

/* ================= L2: motor parts ================= */
SV.PARTS = [
  {k:'stator', n:1, x:165, y:52, t:'الستاتور (الملفات)', d:'ملفات نحاس تلاتة فاز ثابتة في جسم الموتور. الدرايف بيبعتلها تيار بيعمل <b>مجال مغناطيسي بيلف</b>. الحرارة بتطلع من هنا، عشان كده جسم الموتور هو اللي بيسخن.'},
  {k:'rotor', n:2, x:165, y:100, t:'الروتور بمغناطيس دائم', d:'مغناطيس قوي (نيوديميوم) لازق على الروتور. ده اللي بيخلّيه <b>موتور متزامن PMSM</b>: بيلف مع المجال بالظبط من غير Slip زي الإندكشن، وعزمه عالي وهو صغير. عشان كده لو لفّيت عمود سيرفو بإيدك وأطرافه U V W مقصورة هتلاقيه تقيل.'},
  {k:'shaft', n:3, x:40, y:100, t:'العمود والرولمان', d:'العمود بيطلع العزم للحمل، وغالبًا فيه خابور (Key) أو ناعم للكوبلنج. <b>متخبطش العمود بشاكوش</b> عشان الإنكودر اللي ورا حساس جدًا للخبط.'},
  {k:'brake', n:4, x:265, y:100, t:'الفرامل (اختيارية)', d:'فرامل <b>بتمسك لما الكهربا تتشال</b> (Fail-safe) وبتفتح لما تاخد <span class="eq">24 V DC</span>. وظيفتها تمسك الحمل وهو واقف (زي محور رأسي) مش إنها توقف الموتور وهو ماشي. الدرايف بيفتحها بعد Servo ON وبيقفلها قبل Servo OFF.'},
  {k:'enc', n:5, x:310, y:100, t:'الإنكودر', d:'على ضهر الموتور، متركّب على نفس العمود. بيقول للدرايف <b>العمود فين بالظبط وبيلف بسرعة كام</b>، آلاف المرات في الثانية. من غيره مفيش سيرفو. هتفهمه بالتفصيل في الدرس 3.'},
  {k:'conn', n:6, x:157, y:26, t:'الكونكتورات', d:'غالبًا اتنين: <b>كونكتور الباور</b> (U V W و PE وأحيانًا سلكين الفرامل) و<b>كونكتور الإنكودر</b>. كل كابل ليه مكانه ومينفعش تبدّلهم، وكابل الإنكودر لازم يكون مشيلد.'}
];
SV.motorParts = function(host, opt){
  opt = opt || {};
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art mp-art"></div><div class="mp-info box" aria-live="polite">دوس على أي رقم في الرسمة.</div></div>
  <div class="wd-ctl"><button type="button" class="btn" data-a="brake" aria-pressed="true">موتور بفرامل</button><button type="button" class="btn" data-a="spin" aria-pressed="false">شوف الروتور بيلف</button></div>
  <div class="wd-art mp-x" hidden></div>
  <p class="chal mp-chal">افتح <b>الـ 6 أجزاء</b> كلهم.</p>`;
  const q = s => $(s, host), fin = chal(host, '.mp-chal', opt.lesson, opt.task || 'parts');
  let brake = true, seen = {}, cur = null, rot = 0;
  function draw(){
    let mag = ''; for (let i = 0; i < 9; i++) mag += `<rect x="${100 + i * 15}" y="74" width="12" height="7" fill="${i % 2 ? '#2f7fd8' : '#e4572e'}"/><rect x="${100 + i * 15}" y="119" width="12" height="7" fill="${i % 2 ? '#e4572e' : '#2f7fd8'}"/>`;
    let coil = ''; for (let i = 0; i < 10; i++) coil += `<rect x="${92 + i * 15}" y="44" width="11" height="24" rx="3" fill="#c97a32" stroke="#8a4f17"/><rect x="${92 + i * 15}" y="132" width="11" height="24" rx="3" fill="#c97a32" stroke="#8a4f17"/>`;
    const encX = brake ? 282 : 252;
    q('.mp-art').innerHTML = `<svg viewBox="0 0 360 200" role="img" aria-label="قطاع في سيرفو موتور">
      <rect x="8" y="94" width="78" height="12" rx="2" fill="#c3cad0" stroke="#6b757c"/>
      <rect x="64" y="34" width="16" height="132" rx="2" fill="#3b444b"/>
      <rect x="80" y="38" width="${brake ? 200 : 170}" height="124" rx="6" fill="#59656e" opacity=".35" stroke="#3b444b"/>
      ${coil}<rect x="96" y="72" width="140" height="56" rx="3" fill="#7d878e"/>${mag}
      <rect x="80" y="94" width="${encX - 80 + 30}" height="12" fill="#c3cad0" opacity=".85"/>
      <rect x="82" y="84" width="10" height="32" fill="#2a3238"/><rect x="238" y="84" width="10" height="32" fill="#2a3238"/>
      ${brake ? `<rect x="252" y="62" width="26" height="76" rx="3" fill="#a86a00" opacity=".85"/><rect x="262" y="70" width="6" height="60" fill="#3b444b"/>` : ''}
      <rect x="${encX}" y="56" width="58" height="88" rx="8" fill="#1b2125"/><rect x="${encX + 10}" y="68" width="5" height="64" fill="#cfd7dc"/><rect x="${encX + 24}" y="70" width="22" height="60" rx="2" fill="#2b7a3d"/>
      <rect x="140" y="18" width="34" height="20" rx="3" fill="#3b444b"/><rect x="${encX + 14}" y="38" width="28" height="18" rx="3" fill="#3b444b"/>
      ${SV.PARTS.filter(p => brake || p.k !== 'brake').map(p => { const x = p.k === 'enc' ? encX + 28 : p.x; return `<g class="mp-h${seen[p.k] ? ' seen' : ''}${cur === p.k ? ' cur' : ''}" data-p="${p.k}" role="button" tabindex="0" aria-label="${p.t}"><circle cx="${x}" cy="${p.y}" r="13"/><text x="${x}" y="${p.y + 4.5}" text-anchor="middle">${p.n}</text></g>`; }).join('')}
    </svg>`;
  }
  function cross(){
    const cx = 90, cy = 90; let s = `<svg viewBox="0 0 360 180" role="img" aria-label="قطاع عرضي: الروتور بيلف مع المجال">`;
    for (let i = 0; i < 9; i++){ const a = i * 40, ph = ((rot * 4 - a) % 360 + 360) % 360, on = ph < 90 || ph > 330; const p = pol(cx, cy, 70, a); s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="13" fill="${on ? '#ffb300' : '#c97a32'}" stroke="#8a4f17"/>`; }
    s += `<circle cx="${cx}" cy="${cy}" r="48" fill="#7d878e"/>`;
    for (let i = 0; i < 8; i++){ const a0 = rot + i * 45; let d = 'M' + P2(pol(cx, cy, 47, a0 - 18)); d += ' A47 47 0 0 1 ' + P2(pol(cx, cy, 47, a0 + 18)) + ' L' + P2(pol(cx, cy, 36, a0 + 18)) + ' A36 36 0 0 0 ' + P2(pol(cx, cy, 36, a0 - 18)) + 'Z'; s += `<path d="${d}" fill="${i % 2 ? '#2f7fd8' : '#e4572e'}"/>`; }
    s += `<circle cx="${cx}" cy="${cy}" r="9" fill="#c3cad0"/>`;
    s += tx(250, 60, 'الملفات اللي منوّرة = المجال', {a:'middle', ar:1, s:12}) + tx(250, 82, 'المغناطيس بيلف معاه بالظبط', {a:'middle', ar:1, s:12}) + tx(250, 104, '(Synchronous: مفيش Slip)', {a:'middle', ar:1, s:12, c:'w-mu'}) + tx(250, 136, 'أحمر N · أزرق S', {a:'middle', ar:1, s:11, c:'w-mu'});
    q('.mp-x').innerHTML = s + '</svg>';
  }
  function show(k){
    const p = SV.PARTS.find(x => x.k === k); cur = k; seen[k] = 1; draw();
    q('.mp-info').innerHTML = `<b>${p.n}. ${p.t}</b><br>${p.d}`;
    if (SV.PARTS.every(x => seen[x.k])) fin();
  }
  onAct(host, '[data-p]', t => show(t.dataset.p));
  let spin = false, anim = null;
  onAct(host, '[data-a]', b => {
    if (b.dataset.a === 'brake'){ brake = !brake; b.setAttribute('aria-pressed', String(brake)); b.textContent = brake ? 'موتور بفرامل' : 'موتور من غير فرامل'; if (!brake && cur === 'brake') cur = null; draw(); }
    else { spin = !spin; b.setAttribute('aria-pressed', String(spin)); q('.mp-x').hidden = !spin; if (spin){ cross(); if (!anim) anim = animate(q('.mp-x'), dt => { if (!spin || reduced()) return; rot = (rot + dt * 30) % 360; cross(); }); } }
  });
  draw();
  return {show, all(){ SV.PARTS.forEach(p => show(p.k)); }};
};
SV.MOTORS = [
  {m:'100', p:100, t:0.32, tm:0.96, i:0.9, n:3000, nm:6000, enc:17},
  {m:'200', p:200, t:0.64, tm:1.91, i:1.5, n:3000, nm:6000, enc:20},
  {m:'400', p:400, t:1.27, tm:3.82, i:2.6, n:3000, nm:6000, enc:17},
  {m:'750', p:750, t:2.39, tm:7.16, i:4.8, n:3000, nm:5000, enc:23},
  {m:'1K0', p:1000, t:4.77, tm:14.3, i:5.6, n:2000, nm:3000, enc:20}
];
SV.plateSvg = function(m, brake){
  const row = (y, k, v) => `<text x="16" y="${y}" style="font:600 11px var(--font-mono);fill:#3b444b">${k}</text><text x="304" y="${y}" text-anchor="end" style="font:700 11px var(--font-mono);fill:#11171b">${v}</text>`;
  return `<svg viewBox="0 0 320 210" role="img" aria-label="يافطة موتور سيرفو"><rect x="2" y="2" width="316" height="206" rx="8" fill="#e6e9eb" stroke="#8d99a1" stroke-width="2"/><rect x="2" y="2" width="316" height="26" rx="8" fill="#3b444b"/><text x="160" y="20" text-anchor="middle" style="font:700 12px var(--font-mono);fill:#e3e9ec">AC SERVO MOTOR · SM-${m.m}${brake ? 'B' : ''}</text>
  ${row(46, 'RATED OUTPUT', m.p + ' W')}${row(64, 'RATED TORQUE', m.t + ' N·m')}${row(82, 'MAX TORQUE', m.tm + ' N·m')}${row(100, 'RATED SPEED', m.n + ' r/min')}${row(118, 'MAX SPEED', m.nm + ' r/min')}${row(136, 'RATED CURRENT', m.i + ' A')}${row(154, 'ENCODER', m.enc + '-bit ABS')}${row(172, 'BRAKE', brake ? '24 V DC' : '—')}${row(194, 'IP65  ·  INS. F  ·  3PH 200V', '')}</svg>`;
};
SV.plateGen = function(){
  const m = pick(SV.MOTORS), brake = Math.random() < 0.6, k = pick(brake ? ['t', 'tm', 'p', 'enc', 'br', 't'] : ['t', 'tm', 'p', 'enc', 'tm']);
  const plate = SV.plateSvg(m, brake);
  if (k === 't') return {q:'إيه <b>العزم المقنن</b> اللي الموتور ده يقدر يشيله على طول من غير ما يسخن؟' + plate, o:[m.t + ' N·m', m.tm + ' N·m', m.i + ' A', m.p + ' W'], a:0, why:'Rated torque = العزم المستمر. الـ Max torque لحظي بس (تسارع وفرملة).'};
  if (k === 'tm') return {q:'الموتور ده يقدر يدّي <b>كام عزم لحظي</b> وقت التسارع؟' + plate, o:[m.tm + ' N·m', m.t + ' N·m', (m.t * 2).toFixed(2) + ' N·m', m.i + ' A'], a:0, why:'Max torque = حوالي 3 أضعاف المقنن، لثواني قليلة بس.'};
  if (k === 'p') return {q:'اتأكد من القدرة: <b class="eq">P = T × 2π × n ÷ 60</b>. احسب القدرة بالوات من العزم المقنن والسرعة المقننة.' + plate, input:true, unit:'W', check:v => Math.abs(v - m.t * 2 * Math.PI * m.n / 60) <= Math.max(8, m.p * 0.04), ans:Math.round(m.t * 2 * Math.PI * m.n / 60) + ' W', why:`${m.t} × 2π × ${m.n} ÷ 60 ≈ ${Math.round(m.t * 2 * Math.PI * m.n / 60)} W، قريبة من الـ ${m.p} W المكتوبة.`};
  if (k === 'enc') return {q:`الإنكودر مكتوب <b class="eq">${m.enc}-bit</b>. يعني كام عدّة (Count) في اللفة؟` + plate, o:[String(Math.pow(2, m.enc)), String(m.enc * 1000), String(Math.pow(2, m.enc - 1)), String(m.enc * 1024)], a:0, why:`2 أُس ${m.enc} = ${Math.pow(2, m.enc)} عدّة في اللفة.`};
  return {q:'الفرامل بتاعة الموتور ده بتفتح على كام؟' + plate, o:['24 V DC', '220 V AC', '380 V AC', 'مش محتاجة كهربا'], a:0, why:'مكتوب على اليافطة 24 V DC، وبتفتح لما تاخد الكهربا وتمسك لما تتشال.'};
};

/* ================= L3: encoder, incremental vs absolute ================= */
SV.encoderSim = function(host, opt){
  opt = opt || {};
  host.innerHTML = `<div class="tabs" role="group" aria-label="نوع الإنكودر"><button type="button" class="btn" data-t="inc">إنكريمنتال</button><button type="button" class="btn" data-t="abs">أبسليوت (ببطارية)</button></div>
  <div class="wd-art en-art"></div>
  <div class="read"><div><span>العدّاد في الدرايف</span><b class="r-cnt">0</b></div><div><span>المكان اللي الدرايف شايفه</span><b class="r-pos">0°</b></div><div><span>المكان الحقيقي</span><b class="r-true">0°</b></div></div>
  <div class="wd-ctl"><button type="button" class="btn" data-a="l">↺ لف 45°</button><button type="button" class="btn" data-a="r">لف 45° ↻</button><button type="button" class="btn pri" data-a="pwr">⚡ اقطع الكهربا وارجعها</button></div>
  <p class="statline en-msg" aria-live="polite"></p>
  <p class="chal en-chal">لِف العمود شوية، وبعدين اعمل <b>«اقطع الكهربا»</b> مرة على <b>الإنكريمنتال</b> ومرة على <b>الأبسليوت</b> وقارن.</p>`;
  const q = s => $(s, host), fin = chal(host, '.en-chal', opt.lesson, opt.task || 'enc');
  const S = {type:'inc', ang:0, vis:0, off:0, known:true, off2:false, busy:false, seen:{}};
  function draw(){
    const cx = 92, cy = 100, a = S.vis;
    let s = `<svg viewBox="0 0 360 200" role="img" aria-label="قرص إنكودر"><circle cx="${cx}" cy="${cy}" r="84" fill="#cfd7dc" stroke="#59656e" stroke-width="2"/>`;
    if (S.type === 'inc'){
      for (let i = 0; i < 40; i++){ const b1 = pol(cx, cy, 80, a + i * 9), b2 = pol(cx, cy, 64, a + i * 9); s += `<line x1="${b1[0].toFixed(1)}" y1="${b1[1].toFixed(1)}" x2="${b2[0].toFixed(1)}" y2="${b2[1].toFixed(1)}" stroke="#1d2327" stroke-width="4"/>`; }
      const z1 = pol(cx, cy, 58, a), z2 = pol(cx, cy, 48, a); s += `<line x1="${z1[0].toFixed(1)}" y1="${z1[1].toFixed(1)}" x2="${z2[0].toFixed(1)}" y2="${z2[1].toFixed(1)}" stroke="#ff4d8a" stroke-width="5"/>`;
    } else {
      for (let r = 0; r < 4; r++){ const R1 = 80 - r * 11, R2 = R1 - 9, n = 2 << r; for (let i = 0; i < n; i++){ if ((i ^ (i >> 1)) & 1){ continue; } const a0 = a + i * 360 / n, a1 = a0 + 360 / n; s += `<path d="M${P2(pol(cx, cy, R1, a0))} A${R1} ${R1} 0 0 1 ${P2(pol(cx, cy, R1, a1))} L${P2(pol(cx, cy, R2, a1))} A${R2} ${R2} 0 0 0 ${P2(pol(cx, cy, R2, a0))}Z" fill="#1d2327"/>`; } }
    }
    s += `<circle cx="${cx}" cy="${cy}" r="20" fill="#59656e"/><circle cx="${cx}" cy="${cy}" r="6" fill="#cfd7dc"/><rect x="${cx - 9}" y="6" width="18" height="${S.type === 'inc' ? 52 : 52}" rx="3" fill="#2456c9" opacity=".85"/>`;
    s += tx(cx, 196, S.type === 'inc' ? 'قنوات A و B ونبضة Z (الوردي)' : 'كل حتة في القرص ليها كود خاص بيها', {a:'middle', ar:1, s:11, c:'w-mu'});
    const on = !S.off2;
    s += `<rect x="196" y="24" width="152" height="96" rx="8" fill="#2f363c"/><rect x="206" y="34" width="132" height="34" rx="4" fill="#120707"/><text x="330" y="58" text-anchor="end" style="font:700 18px var(--font-mono);fill:${on ? '#ff4d3a' : '#3a1a17'}">${on ? (S.known ? cnt() : '-----') : ''}</text>`;
    s += tx(272, 92, on ? (S.known ? 'المكان معروف ✓' : 'المكان مجهول! محتاج هومينج') : 'الكهربا مقطوعة', {a:'middle', ar:1, s:12, st:'fill:' + (on ? (S.known ? '#5cc06f' : '#ffb300') : '#93a2ab') + ';font-weight:700'});
    s += tx(272, 110, S.type === 'inc' ? '10000 عدّة في اللفة' : '131072 عدّة في اللفة (17-bit)', {a:'middle', ar:1, s:10.5, st:'fill:#b9c1c7'});
    if (S.type === 'abs') s += `<rect x="220" y="140" width="104" height="34" rx="5" fill="#a86a00"/>` + tx(272, 162, 'بطارية للـ Multi-turn', {a:'middle', ar:1, s:11, st:'fill:#fff;font-weight:600'});
    q('.en-art').innerHTML = s + '</svg>';
  }
  function counts(){ return S.type === 'inc' ? Math.round((S.ang - S.off) * 10000 / 360) : Math.round(S.ang * 131072 / 360); }
  function cnt(){ const c = counts(); if (S.type === 'abs'){ const t = Math.floor(c / 131072); return t + ':' + String(((c % 131072) + 131072) % 131072).padStart(6, '0'); } return String(c); }
  function readout(){
    q('.r-cnt').textContent = S.off2 ? '—' : (S.known ? cnt() : '؟');
    q('.r-pos').textContent = S.off2 ? '—' : (S.type === 'inc' ? Math.round(S.ang - S.off) : Math.round(S.ang)) + '°';
    q('.r-true').textContent = Math.round(S.ang) + '°';
  }
  function setType(t){ S.type = t; S.off = 0; S.known = true; S.ang = 0; S.vis = 0; $$('[data-t]', host).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === t))); msg('', 'لِف العمود وبعدين اقطع الكهربا.'); draw(); readout(); }
  function msg(c, h){ const m = q('.en-msg'); stc(m, c); m.innerHTML = h; }
  function turn(d, then){ S.busy = true; const from = S.ang; S.ang += d; const t0 = performance.now(), dur = reduced() ? 1 : 500;
    (function st(){ const k = Math.min(1, (performance.now() - t0) / dur); S.vis = from + d * k; draw(); if (k < 1) requestAnimationFrame(st); else { S.busy = false; readout(); if (then) then(); } })(); }
  onAct(host, '[data-t]', b => setType(b.dataset.t));
  onAct(host, '[data-a]', b => {
    if (S.busy) return; const a = b.dataset.a;
    if (a === 'l' || a === 'r'){ turn(a === 'l' ? -45 : 45); return; }
    S.off2 = true; draw(); readout(); msg('warn', 'الكهربا مقطوعة… حد لف العمود بإيده (أو المحور نزل شوية بالتقل).');
    setTimeout(() => turn(75, () => setTimeout(() => {
      S.off2 = false;
      if (S.type === 'inc'){ S.known = false; S.off = S.ang; msg('bad', 'رجعت الكهربا: الإنكريمنتال <b>بدأ يعد من الصفر</b> ومش عارف إن العمود اتحرك 75°. لازم تعمل <b>هومينج</b> قبل أي حركة، وإلا المكنة هتروح مكان غلط.'); }
      else msg('ok', 'رجعت الكهربا: الأبسليوت <b>عارف مكانه على طول</b> حتى اللفة اللي اتحركت وهو مطفي (البطارية حافظة عدد اللفات). مفيش هومينج.');
      S.seen[S.type] = 1; draw(); readout(); if (S.seen.inc && S.seen.abs) fin();
    }, reduced() ? 1 : 400)), reduced() ? 1 : 500);
  });
  setType('inc');
  return {S, setType};
};
SV.resGen = function(){
  const k = pick(['bits', 'um', 'ppr', 'deg']);
  if (k === 'bits'){ const b = pick([17, 20, 23]); const v = Math.pow(2, b); return {q:`إنكودر <b class="eq">${b}-bit</b>: كام عدّة في اللفة؟`, o:[String(v), String(v / 2), String(b * 1000), String(v * 2)], a:0, why:`2^${b} = ${v}.`}; }
  if (k === 'ppr'){ const p = pick([1000, 2500, 2048, 5000]); return {q:`إنكودر إنكريمنتال <b class="eq">${p} PPR</b> والدرايف بيعد على الحواف الأربعة (x4). كام عدّة في اللفة؟`, input:true, unit:'counts', check:v => v === p * 4, ans:String(p * 4), why:`${p} × 4 = ${p * 4}.`}; }
  if (k === 'um'){ const pitch = pick([5, 10, 20]), c = pick([10000, 131072]); const v = pitch * 1000 / c; return {q:`سكرو خطوته <b class="eq">${pitch} mm</b> متركّب على الموتور مباشرة، والإنكودر <b class="eq">${c}</b> عدّة في اللفة. أصغر حركة الإنكودر يحسّها كام <b>ميكرون (µm)</b>؟`, input:true, unit:'µm', check:x => Math.abs(x - v) <= v * 0.03 + 0.0005, ans:fmt(v, v < 0.1 ? 4 : 3) + ' µm', why:`${pitch} mm = ${pitch * 1000} µm ÷ ${c} = ${fmt(v, v < 0.1 ? 4 : 3)} µm.`}; }
  const c = pick([10000, 131072, 1048576]); const v = 360 / c; return {q:`إنكودر <b class="eq">${c}</b> عدّة في اللفة. العدّة الواحدة كام <b>درجة</b>؟`, o:[fmt(v, 6) + '°', fmt(v * 10, 5) + '°', fmt(360 / (c / 4), 5) + '°', fmt(c / 360, 1) + '°'], a:0, why:`360 ÷ ${c} = ${fmt(v, 6)}°.`};
};

/* ================= L4: inside the drive ================= */
SV.BLOCKS = [
  {k:'cmd', t:'أمر المكان', d:'جاي من الـ PLC (نبضات أو شبكة) أو من جدول جوه الدرايف. بيقول «روح للمكان ده».'},
  {k:'pos', t:'لوب المكان', d:'بيقارن المكان المطلوب بالمكان الحقيقي من الإنكودر. الفرق اسمه <b>Following error</b>. بيضربه في <b>جين المكان (Kp)</b> ويطلّع <b>سرعة مطلوبة</b>. ده أبطأ لوب (عشرات الـ Hz).'},
  {k:'spd', t:'لوب السرعة', d:'بيقارن السرعة المطلوبة بالسرعة الحقيقية (محسوبة من الإنكودر) وبيطلّع <b>عزم مطلوب</b> بـ PI: جين السرعة (Kv) وزمن التكامل (Ti). سرعته مئات الـ Hz.'},
  {k:'cur', t:'لوب التيار (العزم)', d:'العزم في السيرفو = تيار. اللوب ده بيقيس تيار U و V و W وبيظبطه بالظبط. ده <b>أسرع لوب</b> (كذا kHz)، وغالبًا مش بنلعب في جيناته.'},
  {k:'igbt', t:'الإنفرتر (IGBT)', d:'6 ترانزستورات IGBT بيقطّعوا جهد الـ DC bus بالـ PWM عشان يطلّعوا تلاتة فاز بالتردد والجهد المطلوبين على U V W. نفس فكرة الانفرتر العادي.'},
  {k:'pwr', t:'الموحّد و DC bus', d:'الكهربا الداخلة (L1 L2 L3) بتتوحّد وبتشحن كباستورات = <b>DC bus</b> (حوالي <span class="eq">310 V</span> على درايف 220V). لما الموتور يفرمل الطاقة بترجع هنا، ولو زادت بتتحرق في <b>مقاومة الفرملة</b>.'},
  {k:'motor', t:'الموتور', d:'PMSM بمغناطيس دائم. العزم بيطلع على قد التيار اللي داخله.'},
  {k:'enc', t:'الإنكودر (Feedback)', d:'بيرجّع المكان للوب المكان، ومنه الدرايف بيحسب السرعة للوب السرعة، وكمان زاوية الروتور عشان يعرف يوجّه التيار صح (Commutation).'}
];
SV.driveDiagram = function(host, opt){
  opt = opt || {};
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art dd-art"></div><div class="dd-info box" aria-live="polite">دوس على أي بلوك في الرسمة.</div></div><p class="chal dd-chal">افتح <b>كل البلوكات الـ 8</b>.</p>`;
  const q = s => $(s, host), fin = chal(host, '.dd-chal', opt.lesson, opt.task || 'blocks');
  let seen = {}, cur = null;
  const B = (k, x, y, w, h, l1, l2, col) => `<g class="dd-b${seen[k] ? ' seen' : ''}${cur === k ? ' cur' : ''}" data-b="${k}" role="button" tabindex="0" aria-label="${SV.BLOCKS.find(b => b.k === k).t}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" style="fill:${col || 'var(--panel)'}"/>${tx(x + w / 2, y + (l2 ? h / 2 - 3 : h / 2 + 5), l1, {a:'middle', ar:1, s:12.5, w:700})}${l2 ? tx(x + w / 2, y + h / 2 + 14, l2, {a:'middle', ar:1, s:10.5, c:'w-mu'}) : ''}</g>`;
  const L = (d, c, dash) => `<path d="${d}" fill="none" stroke="${c || 'var(--accent)'}" stroke-width="2.5" ${dash ? `stroke-dasharray="6 5" class="flow" style="--dur:${dash}s"` : ''} marker-end="url(#dda${c ? 'g' : ''})"/>`;
  function draw(){
    q('.dd-art').innerHTML = `<svg viewBox="0 0 360 520" role="img" aria-label="الدرايف من جوه"><defs><marker id="dda" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker><marker id="ddag" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#2b9a4a"/></marker></defs>
      <rect x="4" y="6" width="112" height="300" rx="10" fill="none" stroke="var(--line)" stroke-dasharray="4 4"/>${tx(60, 24, 'دايرة القوى', {a:'middle', ar:1, s:11, c:'w-mu'})}
      <rect x="128" y="6" width="228" height="300" rx="10" fill="none" stroke="var(--line)" stroke-dasharray="4 4"/>${tx(242, 24, 'الكنترول: 3 لوبات', {a:'middle', ar:1, s:11, c:'w-mu'})}
      ${tx(60, 48, 'L1 L2 L3', {a:'middle', s:11, w:700})}${L('M60 54 V78', '#c0352b', .6)}
      ${B('pwr', 12, 80, 96, 64, 'موحّد + DC bus', '≈ 310 V DC', 'var(--warn-soft)')}
      ${L('M60 146 V268', '#c0352b', .6)}${tx(64, 205, 'R مقاومة', {a:'start', ar:1, s:10, c:'w-mu'})}<rect x="20" y="188" width="10" height="34" fill="#a86a00"/>
      ${B('cmd', 150, 34, 186, 40, 'أمر المكان', 'PLC / جدول')}
      ${L('M243 76 V92', null, .8)}
      ${B('pos', 150, 94, 186, 46, 'لوب المكان', 'Kp → سرعة مطلوبة')}
      ${L('M243 142 V158', null, .7)}
      ${B('spd', 150, 160, 186, 46, 'لوب السرعة', 'Kv, Ti → عزم مطلوب')}
      ${L('M243 208 V224', null, .5)}
      ${B('cur', 150, 226, 186, 46, 'لوب التيار', 'kHz → PWM')}
      ${L('M243 274 V312', null, .4)}
      ${B('igbt', 12, 314, 340, 44, 'الإنفرتر IGBT', 'PWM → U V W', 'var(--accent-soft)')}
      ${L('M182 360 V386', '#c0352b', .5)}${tx(196, 378, 'U V W', {a:'start', s:10.5, w:700})}
      ${B('motor', 112, 388, 140, 52, 'الموتور', 'PMSM', 'var(--bg)')}
      ${B('enc', 112, 452, 140, 44, 'الإنكودر', 'Feedback', 'var(--good-soft)')}
      <line x1="182" y1="440" x2="182" y2="452" stroke="#59656e" stroke-width="5"/>
      ${L('M252 474 H346 V117 H338', '#2b9a4a', .9)}${L('M346 183 H338', '#2b9a4a')}${tx(340, 300, 'مكان + سرعة', {a:'end', ar:1, s:10, st:'fill:#2b9a4a;font-weight:600'})}
      ${L('M110 378 H96 V249 H148', '#2b9a4a', .7)}${tx(92, 300, 'تيار', {a:'end', ar:1, s:10, st:'fill:#2b9a4a;font-weight:600'})}
      ${tx(180, 514, 'الخطوط المتقطعة الخضرا = Feedback', {a:'middle', ar:1, s:11, c:'w-mu'})}
    </svg>`;
  }
  function show(k){ const b = SV.BLOCKS.find(x => x.k === k); cur = k; seen[k] = 1; draw(); q('.dd-info').innerHTML = `<b>${b.t}</b><br>${b.d}`; if (SV.BLOCKS.every(x => seen[x.k])) fin(); }
  onAct(host, '[data-b]', t => show(t.dataset.b));
  draw();
  return {show, all(){ SV.BLOCKS.forEach(b => show(b.k)); }};
};

/* ================= L5: wiring board ================= */
SV.wiring = function(host, opt){
  opt = opt || {};
  const DT = [['dL1', 'L1'], ['dL2', 'L2'], ['dL3', 'L3'], ['dP', 'P+'], ['dC', 'C'], ['dU', 'U'], ['dV', 'V'], ['dW', 'W'], ['dPE', 'PE ⏚'], ['dCN2', 'CN2'], ['dBRK', 'BRK'], ['dCN1', 'CN1'], ['dSTO', 'STO']];
  const RT = [['mU', 'U'], ['mV', 'V'], ['mW', 'W'], ['mPE', 'PE ⏚'], ['mENC', 'ENC'], ['kBR', 'ريلاي'], ['r1', 'R'], ['r2', 'R'], ['plc', 'PLC'], ['sr', 'Safety'], ['sL1', 'L1'], ['sL2', 'L2'], ['sL3', 'L3']];
  const GROUPS = [['الموتور', 0, 3], ['الإنكودر', 4, 4], ['الفرامل 24V', 5, 5], ['مقاومة الفرملة', 6, 7], ['الـ PLC', 8, 8], ['سيفتي ريلاي', 9, 9], ['الكهربا (البريكر)', 10, 12]];
  const RIGHT = {dL1:'sL1', dL2:'sL2', dL3:'sL3', dU:'mU', dV:'mV', dW:'mW', dPE:'mPE', dCN2:'mENC', dBRK:'kBR', dCN1:'plc', dSTO:'sr'};
  const Y0 = 44, DY = 35, XL = 122, XR = 238;
  const y = id => { let i = DT.findIndex(t => t[0] === id); if (i < 0) i = RT.findIndex(t => t[0] === id); return Y0 + i * DY; };
  const lab = id => (DT.find(t => t[0] === id) || RT.find(t => t[0] === id))[1];
  const col = id => /L\d|^dP$|^dC$|^r\d/.test(id) ? '#1d2327' : /U$|V$|W$/.test(id) ? '#c0352b' : /PE/.test(id) ? '#2b9a4a' : '#2456c9';
  host.innerHTML = `<div class="wd-art wr-art"></div>
  <div class="wd-ctl"><button type="button" class="btn pri" data-a="run">شغّل الدرايف (Servo ON)</button><button type="button" class="btn" data-a="clear">امسح الأسلاك</button><button type="button" class="btn" data-a="swap" hidden>جرّب الغلطة: بدّل U و W</button></div>
  <div class="wr-res bn-res" aria-live="polite"></div>
  <p class="muted" style="font-size:.88rem">دوس طرف في الدرايف (شمال) وبعدين طرفه (يمين). دوس السلك تشيله.</p>
  <p class="chal wr-chal">وصّل <b>الـ 13 سلك</b> صح وشغّل الدرايف من غير ولا إنذار.</p>`;
  const q = s => $(s, host), fin = chal(host, '.wr-chal', opt.lesson, opt.task || 'wire');
  const finSwap = chal(host, '.nothing', opt.lesson, 'swap');
  let W = [], pend = null, ang = 0, runMode = null, anim = null;
  function draw(){
    let s = `<svg viewBox="0 0 360 ${Y0 + DY * 13}" role="img" aria-label="لوحة توصيل الدرايف">`;
    s += `<rect x="6" y="8" width="${XL - 4}" height="${DY * 13 + 20}" rx="10" fill="#2f363c"/>` + tx(XL / 2 + 2, 28, 'الدرايف', {a:'middle', ar:1, s:13, w:700, st:'fill:#e3e9ec'});
    DT.forEach(t => { s += tx(XL - 14, y(t[0]) + 4, t[1], {a:'end', s:12, w:700, st:'fill:#e3e9ec'}); });
    s += tx(XL / 2 - 6, y('dC') + 22, 'شيل جمبر P+ D', {a:'middle', ar:1, s:9, st:'fill:#ffb300'});
    GROUPS.forEach(g => { const y1 = y(RT[g[1]][0]) - 16, y2 = y(RT[g[2]][0]) + 14; s += `<rect x="${XR + 4}" y="${y1}" width="${360 - XR - 8}" height="${y2 - y1}" rx="8" class="w-pn" style="stroke:var(--line)"/>` + tx(354, y1 + 12, g[0], {a:'end', ar:1, s:9.5, c:'w-mu'}); });
    RT.forEach(t => { s += tx(XR + 14, y(t[0]) + 6, t[1], {a:'start', ar:/[؀-ۿ]/.test(t[1]), s:12, w:700}); });
    W.forEach((w, i) => { const y1 = y(w[0]), y2 = y(w[1]), d = `M${XL} ${y1} C${XL + 60} ${y1} ${XR - 60} ${y2} ${XR} ${y2}`; s += `<g class="bw${err && err.w.includes(w.join('|')) ? ' bad' : ''}" data-w="${i}" role="button" tabindex="0" aria-label="شيل السلك ${lab(w[0])} - ${lab(w[1])}"><path class="bw-o" d="${d}"/><path class="bw-c" d="${d}" stroke="${col(w[0])}"/><path class="bw-hit" d="${d}"/></g>`; });
    [...DT.map(t => [t[0], XL]), ...RT.map(t => [t[0], XR])].forEach(([id, x]) => { s += `<g class="bt${pend === id ? ' pend' : ''}${err && err.t.has(id) ? ' err' : ''}" data-t="${id}" role="button" tabindex="0" aria-label="طرف ${lab(id)}"><circle class="bt-hit" cx="${x}" cy="${y(id)}" r="15"/><circle class="bt-s" cx="${x}" cy="${y(id)}" r="7"/></g>`; });
    q('.wr-art').innerHTML = s + '</svg>';
  }
  function side(id){ return id[0] === 'd' ? 'L' : 'R'; }
  onAct(host, '[data-t]', t => {
    const id = t.dataset.t;
    if (!pend || side(pend) === side(id)){ pend = pend === id ? null : id; draw(); return; }
    const a = side(pend) === 'L' ? pend : id, b = side(pend) === 'L' ? id : pend;
    W = W.filter(w => w[0] !== a && w[1] !== b); W.push([a, b]); pend = null; runMode = null; q('.wr-res').innerHTML = ''; draw();
  });
  onAct(host, '[data-w]', t => { W.splice(+t.dataset.w, 1); runMode = null; draw(); });
  const box = (c, h) => `<div class="${c}">${h}</div>`;
  function check(){ // one concrete problem at a time (first wrong wire, then the first missing connection)
    const has = (a, b) => W.some(w => w[0] === a && w[1] === b), to = a => (W.find(w => w[0] === a) || [])[1];
    const wrongPower = W.filter(w => (/^d[UVW]$/.test(w[0]) && /^sL/.test(w[1])) || (/^dL/.test(w[0]) && /^m[UVW]$/.test(w[1])));
    if (wrongPower.length) return {bad:true, html:box('bn-bad', '<b>توقف!</b> الكهربا على U V W: الـ IGBT هيضرب. الكهربا على L1 L2 L3 بس.'), hl:{w:[wrongPower[0]], t:wrongPower[0]}};
    const uvw = ['dU', 'dV', 'dW'].map(to), uvwSet = uvw.every(x => /^m[UVW]$/.test(x || '')) && new Set(uvw).size === 3;
    const swapped = uvwSet && !(uvw[0] === 'mU' && uvw[1] === 'mV' && uvw[2] === 'mW');
    const regenOk = ((to('dP') === 'r1' && to('dC') === 'r2') || (to('dP') === 'r2' && to('dC') === 'r1'));
    const wrong = W.filter(w => !(RIGHT[w[0]] === w[1] || (/^d[PC]$/.test(w[0]) && /^r\d$/.test(w[1])) || (swapped && /^d[UVW]$/.test(w[0]) && /^m[UVW]$/.test(w[1]))));
    if (wrong.length){ const w = wrong[0]; return {bad:true, html:box('bn-bad', '<b>✗</b> ' + `السلك من ${lab(w[0])} رايح لـ ${lab(w[1])} والمفروض ${RIGHT[w[0]] ? lab(RIGHT[w[0]]) : 'R'}.`), hl:{w:[w], t:[w[0], w[1]]}}; }
    if (!['dL1', 'dL2', 'dL3'].every(a => has(a, RIGHT[a]))) return {bad:true, html:box('bn-bad', '<b>✗</b> ' + 'الكهربا L1 L2 L3 مش متوصلة: الشاشة مطفية.'), hl:{t:[['dL1', 'dL2', 'dL3'].find(a => !has(a, RIGHT[a]))]}};
    if (!uvwSet) return {bad:true, html:box('bn-bad', '<b>✗</b> ' + 'U V W مش متوصلين كلهم: إنذار فقد فاز.'), hl:{t:[['dU', 'dV', 'dW'].find(a => !/^m[UVW]$/.test(to(a) || '')) || 'dU']}};
    if (!has('dPE', 'mPE')) return {bad:true, html:box('bn-bad', '<b>✗</b> ' + 'الأرضي PE مش متوصل: خطر صعق.'), hl:{t:['dPE']}};
    if (!has('dCN2', 'mENC')) return {bad:true, html:box('bn-bad', '<b>✗</b> ' + 'الإنكودر CN2 مش متوصل: Encoder error.'), hl:{t:['dCN2']}};
    if (!has('dBRK', 'kBR')) return {bad:true, html:box('bn-bad', '<b>✗</b> ' + 'الفرامل BRK مش متوصلة: هتطلع Overload.'), hl:{t:['dBRK']}};
    if (!regenOk) return {bad:true, html:box('bn-bad', '<b>✗</b> ' + 'مقاومة الفرملة على P+ و C ناقصة: Overvoltage.'), hl:{t:[to('dP') ? 'dC' : 'dP']}};
    if (!has('dCN1', 'plc')) return {bad:true, html:box('bn-bad', '<b>✗</b> ' + 'CN1 مش متوصل: الـ PLC مش هيبعت Servo ON.'), hl:{t:['dCN1']}};
    if (!has('dSTO', 'sr')) return {bad:true, html:box('bn-bad', '<b>✗</b> ' + 'STO مش متوصل: الدرايف هيفضل على STO.'), hl:{t:['dSTO']}};
    if (swapped) return {swap:true, html:box('bn-bad', '<b>إنذار Overload / Runaway:</b> U V W متبدّلين. في السيرفو وصّل U على U و V على V و W على W.'), hl:{t:['dU', 'dV', 'dW']}};
    return {ok:true, html:box('bn-ok', '<b>تمام! الدرايف شغّال من غير إنذار.</b> الفرامل فتحت والموتور ماسك مكانه.')};
  }
  let err = null;
  function pulse(hl){ err = hl ? {t:new Set(hl.t || []), w:(hl.w || []).map(w => w.join('|')), until:Date.now() + 3000} : null; draw(); if (err) setTimeout(() => { if (err && err.until <= Date.now()){ err = null; draw(); } }, 3100); }
  function spin(){
    if (anim) return;
    anim = animate(q('.wr-res'), dt => {
      const d = q('.wr-dial'); if (!d || !runMode) return;
      if (runMode === 'ok') ang = (ang + dt * 120) % 360; else ang += (Math.random() - 0.5) * 40 + dt * 300;
      d.innerHTML = `<svg viewBox="0 0 120 120" aria-hidden="true">${dial(60, 60, 42, ang)}</svg>`;
    });
  }
  function run(){
    const r = check(); runMode = r.ok ? 'ok' : r.swap ? 'swap' : null;
    pulse(r.hl);
    q('.wr-res').innerHTML = r.html + (runMode ? `<div class="wr-dial${runMode === 'swap' ? ' bad' : ''}"></div>` : '');
    if (r.ok){ fin(); q('[data-a=swap]').hidden = false; }
    if (r.swap) finSwap();
    spin();
  }
  onAct(host, '[data-a]', b => {
    const a = b.dataset.a;
    if (a === 'run') run();
    else if (a === 'clear'){ W = []; pend = null; runMode = null; q('.wr-res').innerHTML = ''; draw(); }
    else if (a === 'swap'){ W = W.map(w => w[0] === 'dU' ? ['dU', 'mW'] : w[0] === 'dW' ? ['dW', 'mU'] : w); draw(); run(); }
  });
  draw();
  return {solve(){ W = Object.keys(RIGHT).map(k => [k, RIGHT[k]]); W.push(['dP', 'r1'], ['dC', 'r2']); draw(); }, run, get W(){ return W; }};
};

/* ================= L6: control modes ================= */
SV.pulseSvg = function(fmt, dir, o){
  o = o || {};
  const W = 320, H = 120, x0 = 50, x1 = 312, n = 6;
  const rows = fmt === 'pd' ? [['PULSE', t => (t * n) % 1 < 0.5 ? 1 : 0], ['SIGN', () => dir > 0 ? 1 : 0]]
    : fmt === 'cw' ? [['CW', t => dir > 0 && (t * n) % 1 < 0.5 ? 1 : 0], ['CCW', t => dir < 0 && (t * n) % 1 < 0.5 ? 1 : 0]]
    : [['A', t => ((t * n + (dir > 0 ? 0 : 0.25)) % 1) < 0.5 ? 1 : 0], ['B', t => ((t * n + (dir > 0 ? 0.25 : 0)) % 1 + 1) % 1 < 0.5 ? 0 : 1]];
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="شكل النبضات"><rect x="${x0 - 6}" y="4" width="${x1 - x0 + 12}" height="${H - 8}" rx="6" fill="#08130e"/>`;
  const cols = ['#ffd23f', '#3fd0ff'];
  rows.forEach((r, k) => { const yb = 48 + k * 52; let d = ''; for (let i = 0; i <= 600; i++){ const t = i / 600, x = x0 + (x1 - x0) * t, v = r[1](t), yy = yb - v * 28; d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + yy.toFixed(1); } s += `<path d="${d}" fill="none" stroke="${cols[k]}" stroke-width="2"/><text x="${x0 - 10}" y="${yb - 8}" text-anchor="end" style="font:700 11px var(--font-mono);fill:${cols[k]}">${r[0]}</text>`; });
  return s + '</svg>';
};
SV.modes = function(host, opt){
  opt = opt || {};
  const KEYM = 'l6m', PPR = 10000;
  const ch = sub(null, KEYM);
  host.innerHTML = `<div class="tabs" role="group" aria-label="وضع التشغيل"><button type="button" class="btn" data-m="pt">مكان (نبضات)</button><button type="button" class="btn" data-m="s">سرعة</button><button type="button" class="btn" data-m="t">عزم</button><button type="button" class="btn" data-m="pr">مواضع داخلية</button></div>
  <div class="sim-grid two-col"><div class="wd-art md-art"></div><div class="md-side"><div class="read sm"><div><span>السرعة</span><b class="r-spd">0 rpm</b></div><div><span>المكان</span><b class="r-pos">0</b></div><div><span>العزم</span><b class="r-trq">0%</b></div></div><div class="wd-ctl"><button type="button" class="btn" data-a="son" aria-pressed="false">Servo ON (SON)</button></div><div class="md-panel"></div></div></div>
  <p class="statline md-msg" aria-live="polite"></p>
  <p class="chal md-chal">خلّص <b>تحدّي كل وضع</b> من الأربعة (التحدّي مكتوب تحت كل وضع).</p>`;
  const q = s => $(s, host), fin = chal(host, '.md-chal', opt.lesson, opt.task || 'modes');
  const S = {m:'pt', son:false, spd:0, pos:0, trq:0, pulses:0, queue:0, fmt:'pd', lastDir:1, f:50, v:0, tv:0, lim:1000, web:true, pr:0, bits:[0, 0], prTgt:null, held:0};
  const PRT = [0, 90, 180, 270];
  const done = k => { const o = subMark(KEYM, k); renderChal(); if (['pt', 's', 't', 'pr'].every(x => o[x])) fin(); };
  const CH = {pt:'ابعت نبضات تخلّي الموتور يلف <b>لفة كاملة بالظبط لقدّام</b> (المكان = 10000 نبضة، يعني لفة).', s:'خلّي الموتور يلف <b>1500 rpm في الاتجاه العكسي</b> (السالب).', t:'حط عزم <b>50%</b> وحد سرعة <b>500 rpm أو أقل</b>، وبعدين اقطع الخامة وشوف السرعة وقفت عند الحد.', pr:'روح للموضع <b>P3</b> باستخدام مداخل POS0 و POS1 وبعدين CTRG.'};
  function renderChal(){ const o = sub(null, KEYM); $$('[data-m]', host).forEach(b => b.classList.toggle('done', !!o[b.dataset.m])); const c = q('.md-ch'); if (c){ c.classList.toggle('ok', !!o[S.m]); } }
  function panel(){
    const p = q('.md-panel'), o = sub(null, KEYM);
    if (S.m === 'pt') p.innerHTML = `<div class="wd-ctl"><label>شكل النبضات <select class="inp" data-c="fmt"><option value="pd">Pulse + Direction</option><option value="cw">CW / CCW (نبضتين)</option><option value="ab">A / B (فرق 90°)</option></select></label><label>عدد النبضات <input type="number" class="inp" data-c="n" value="2500" min="1" max="50000" step="1"></label><button type="button" class="btn" data-a="fw">ابعت لقدّام</button><button type="button" class="btn" data-a="rv">ابعت لورا</button></div><div class="wd-art md-wave"></div><p class="muted" style="font-size:.86rem">الجير هنا متظبط إن <b class="eq">10000</b> نبضة = لفة.</p>`;
    else if (S.m === 's') p.innerHTML = `<div class="wd-ctl"><label>أمر السرعة على V-REF: <b class="v-v">0.0 V</b><input type="range" min="-10" max="10" step="0.5" value="${S.v}" data-c="v" aria-label="جهد أمر السرعة"></label></div><p class="muted" style="font-size:.86rem"><b class="eq">+10 V = +3000 rpm</b> و <b class="eq">−10 V = −3000 rpm</b>.</p>`;
    else if (S.m === 't') p.innerHTML = `<div class="wd-ctl"><label>أمر العزم على T-REF: <b class="t-v">0.0 V</b><input type="range" min="0" max="10" step="0.5" value="${S.tv}" data-c="tv" aria-label="جهد أمر العزم"></label><label>حد السرعة: <b class="l-v">${S.lim} rpm</b><input type="range" min="100" max="3000" step="100" value="${S.lim}" data-c="lim" aria-label="حد السرعة"></label><button type="button" class="btn" data-a="web">${S.web ? 'اقطع الخامة ✂' : 'رجّع الخامة'}</button></div><p class="muted" style="font-size:.86rem"><b class="eq">10 V = 100%</b> من العزم المقنن. الخامة المشدودة بتقاوم الموتور.</p>`;
    else p.innerHTML = `<div class="tblw"><table class="tbl"><thead><tr><th>الموضع</th><th>POS1</th><th>POS0</th><th>المكان</th></tr></thead><tbody>${PRT.map((v, i) => `<tr${S.pr === i ? ' style="font-weight:700"' : ''}><td>P${i + 1}</td><td>${i >> 1}</td><td>${i & 1}</td><td>${v}°</td></tr>`).join('')}</tbody></table></div><div class="wd-ctl"><button type="button" class="btn" data-a="b1" aria-pressed="${!!S.bits[1]}">POS1 = ${S.bits[1]}</button><button type="button" class="btn" data-a="b0" aria-pressed="${!!S.bits[0]}">POS0 = ${S.bits[0]}</button><button type="button" class="btn pri" data-a="ctrg">CTRG (نفّذ)</button></div>`;
    p.insertAdjacentHTML('beforeend', `<p class="chal md-ch${o[S.m] ? ' ok' : ''}"><b>التحدّي:</b> ${CH[S.m]}</p>`);
    if (S.m === 'pt'){ q('[data-c=fmt]').value = S.fmt; wave(); }
    if (S.m === 's') q('.v-v').textContent = fmt(S.v, 1) + ' V';
    if (S.m === 't') q('.t-v').textContent = fmt(S.tv, 1) + ' V';
  }
  function wave(){ const w = q('.md-wave'); if (w) w.innerHTML = SV.pulseSvg(S.fmt, S.lastDir); }
  function draw(){
    const a = ((S.pos % 360) + 360) % 360;
    q('.md-art').innerHTML = `<svg viewBox="0 0 220 200" role="img" aria-label="الموتور">${dial(110, 92, 62, a, {ghost:S.m === 'pr' && S.prTgt != null ? PRT[S.prTgt] : null})}${S.m === 't' ? `<path d="M182 92 H216" stroke="${S.web ? '#a86a00' : 'transparent'}" stroke-width="6"/>` : ''}${tx(110, 188, S.son ? 'Servo ON' : 'Servo OFF', {a:'middle', s:13, w:700, st:'fill:' + (S.son ? '#2b9a4a' : '#c0352b')})}</svg>`;
    q('.r-spd').textContent = Math.round(S.spd) + ' rpm';
    q('.r-pos').textContent = S.m === 'pt' ? S.pulses + ' نبضة' : S.m === 'pr' ? Math.round(((S.pos % 360) + 360) % 360) + '°' : fmt(S.pos / 360, 1) + ' لفة';
    q('.r-trq').textContent = Math.round(S.trq) + '%';
  }
  function msg(c, h){ const m = q('.md-msg'); stc(m, c); m.innerHTML = h; }
  function setMode(m){
    if (S.son && m !== S.m){ msg('warn', 'غيّر المود والسيرفو OFF الأول. في أغلب الدرايفات تغيير المود بيحتاج Servo OFF (وأحيانًا إعادة تشغيل).'); return; }
    S.m = m; S.spd = 0; S.trq = 0; S.prTgt = null; $$('[data-m]', host).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m))); panel(); renderChal(); draw();
    msg('', {pt:'الـ PLC بيبعت نبضات: كل نبضة = خطوة صغيرة. عدد النبضات = المسافة، وترددها = السرعة.', s:'جهد أنالوج من ⁦−10⁩ لـ ⁦+10 V⁩ بيحدد السرعة والاتجاه. الدرايف بيقفل لوب السرعة بس.', t:'الجهد بيحدد العزم (الشد)، مش السرعة. لازم حد سرعة عشان لو الحمل اتشال.', pr:'المواضع مكتوبة جوه الدرايف. الـ PLC بيختار رقم الموضع بمداخل ديجيتال ويدّي CTRG.'}[m]);
  }
  host.addEventListener('input', e => {
    const c = e.target.dataset.c; if (!c) return;
    if (c === 'v'){ S.v = +e.target.value; q('.v-v').textContent = fmt(S.v, 1) + ' V'; }
    if (c === 'tv'){ S.tv = +e.target.value; q('.t-v').textContent = fmt(S.tv, 1) + ' V'; }
    if (c === 'lim'){ S.lim = +e.target.value; q('.l-v').textContent = S.lim + ' rpm'; }
  });
  host.addEventListener('change', e => { if (e.target.dataset.c === 'fmt'){ S.fmt = e.target.value; wave(); } });
  onAct(host, '[data-m]', b => setMode(b.dataset.m));
  onAct(host, '[data-a]', b => {
    const a = b.dataset.a;
    if (a === 'son'){ S.son = !S.son; b.setAttribute('aria-pressed', String(S.son)); if (!S.son){ S.queue = 0; } msg(S.son ? 'ok' : '', S.son ? 'السيرفو ماسك (الفرامل فتحت والموتور عليه عزم).' : 'Servo OFF: الموتور سايب ومفيش عزم.'); draw(); return; }
    if (!S.son){ msg('bad', 'الدرايف مش هيسمع أي أمر غير لما يبقى <b>Servo ON</b>. دوس SON الأول.'); return; }
    if (a === 'fw' || a === 'rv'){ const n = Math.max(1, Math.min(50000, Math.round(+q('[data-c=n]').value || 0))); S.lastDir = a === 'fw' ? 1 : -1; S.queue += S.lastDir * n; wave(); msg('', `بيبعت ${n} نبضة ${a === 'fw' ? 'لقدّام' : 'لورا'}…`); }
    if (a === 'web'){ S.web = !S.web; panel(); }
    if (a === 'b0' || a === 'b1'){ const i = +a[1]; S.bits[i] = S.bits[i] ? 0 : 1; panel(); }
    if (a === 'ctrg'){ S.prTgt = S.bits[1] * 2 + S.bits[0]; S.pr = S.prTgt; panel(); msg('', `CTRG: رايح للموضع P${S.prTgt + 1} (${PRT[S.prTgt]}°).`); }
  });
  animate(host, dt => {
    if (!dt) return;
    let tgtSpd = 0;
    if (!S.son){ S.spd *= Math.max(0, 1 - dt * 3); S.trq = 0; S.pos += S.spd * 6 * dt; draw(); return; }
    if (S.m === 'pt'){
      const rate = 1200 * PPR / 60 * dt; /* 1200 rpm worth of pulses per second */
      if (S.queue){ const st = Math.sign(S.queue) * Math.min(Math.abs(S.queue), Math.round(rate)); S.queue -= st; S.pulses += st; S.pos += st * 360 / PPR; S.spd = st / dt * 60 / PPR; S.trq = 30; if (!S.queue){ S.spd = 0; S.trq = 5; if (S.pulses === PPR){ msg('ok', 'بالظبط لفة: 10000 نبضة. لاحظ إن الدرايف عدّ النبضات زي ما هي، وسرعتها حددت السرعة.'); done('pt'); } else msg('', `المكان دلوقتي ${S.pulses} نبضة = ${fmt(S.pulses / PPR, 2)} لفة.`); } }
      draw(); return;
    }
    if (S.m === 's'){ tgtSpd = S.v * 300; const d = tgtSpd - S.spd, st = 6000 * dt; S.spd = Math.abs(d) < st ? tgtSpd : S.spd + Math.sign(d) * st; S.trq = Math.abs(d) > 1 ? 80 * Math.sign(d) : 10 * Math.sign(S.spd); S.pos += S.spd * 6 * dt;
      if (Math.round(S.spd) === -1500){ S.held += dt; if (S.held > 0.6){ S.held = -99; msg('ok', '−5 V = −1500 rpm في الاتجاه العكسي. الجهد بيحدد السرعة والإشارة بتحدد الاتجاه.'); done('s'); } } else if (S.held > 0) S.held = 0;
      draw(); return; }
    if (S.m === 't'){ S.trq = S.tv * 10; const lim = S.lim;
      if (S.web){ const d = 0 - S.spd; S.spd += Math.sign(d) * Math.min(Math.abs(d), 4000 * dt); }
      else { const d = (S.tv > 0 ? lim : 0) - S.spd; S.spd += Math.sign(d) * Math.min(Math.abs(d), 3000 * dt); if (S.tv > 0 && Math.abs(S.spd - lim) < 1 && S.trq !== 0){ S.trq = Math.min(S.trq, 15); } }
      S.pos += S.spd * 6 * dt;
      if (!S.web && S.tv === 5 && S.lim <= 500 && Math.abs(S.spd - S.lim) < 1 && !sub(null, KEYM).t){ msg('ok', `الخامة اتقطعت والموتور جري لحد <b>${S.lim} rpm</b> ووقف عند حد السرعة. من غير الحد كان هيجري لأقصى سرعة!`); done('t'); }
      draw(); return; }
    if (S.m === 'pr' && S.prTgt != null){ const a = ((S.pos % 360) + 360) % 360; let d = PRT[S.prTgt] - a; if (d > 180) d -= 360; if (d < -180) d += 360; const st = 270 * dt; if (Math.abs(d) <= st){ S.pos += d; S.spd = 0; S.trq = 5; if (S.prTgt === 2) done('pr'); msg(S.prTgt === 2 ? 'ok' : '', `وصل P${S.prTgt + 1}.` + (S.prTgt === 2 ? ' POS1=1 و POS0=0 ⇐ رقم 2 بالباينري ⇐ الموضع التالت.' : '')); S.prTgt = null; } else { S.pos += Math.sign(d) * st; S.spd = Math.sign(d) * 45; S.trq = 25; } draw(); }
  });
  setMode('pt'); draw();
  return {S, setMode, son(on){ if (S.son !== on) q('[data-a=son]').click(); }};
};
SV.fmtGen = function(){
  const f = pick(['pd', 'cw', 'ab']), d = pick([1, -1]), names = {pd:'Pulse + Direction', cw:'CW / CCW', ab:'A / B (فرق 90°)'};
  if (Math.random() < 0.5) return {q:'النبضات اللي على السكوب دي شكلها إيه؟' + SV.pulseSvg(f, d), o:[names.pd, names.cw, names.ab], a:['pd', 'cw', 'ab'].indexOf(f), keep:true, why:{pd:'قناة نبضات وقناة تانية ثابتة بتحدد الاتجاه.', cw:'كل اتجاه ليه قناة نبضات لوحده، والتانية ساكتة.', ab:'القناتين بينبضوا بفرق ربع نبضة (90°).'}[f]};
  return {q:`النبضات دي <b>${names[f]}</b>. الموتور هيلف في أنهي اتجاه؟ (على الإعداد القياسي)` + SV.pulseSvg(f, d), o:['لقدّام (موجب)', 'لورا (سالب)'], a:d > 0 ? 0 : 1, why:{pd:'SIGN عالية = لقدّام، واطية = لورا (وده بيتعكس بباراميتر).', cw:'النبضات على CW = لقدّام، على CCW = لورا.', ab:'A سابقة B = لقدّام، B سابقة A = لورا.'}[f]};
};

/* ================= L7: electronic gear ================= */
SV.MACH = {
  screw:{t:'بول سكرو', u:'mm', opts:[5, 10, 20], lab:'خطوة السكرو (mm)', per:v => v},
  belt:{t:'بكرة وسير', u:'mm', opts:[100, 120, 150], lab:'المسافة في لفة البكرة (mm)', per:v => v},
  table:{t:'ترابيزة دوّارة بجيربوكس', u:'°', opts:[5, 10, 36], lab:'نسبة الجيربوكس (1:x)', per:v => 360 / v}
};
SV.ENCS = [[131072, '\u2066131072 (17-bit)\u2069'], [1048576, '\u20661048576 (20-bit)\u2069'], [8388608, '\u20668388608 (23-bit)\u2069'], [10000, '\u206610000 (2500 PPR × 4)\u2069']];
SV.GEAR_CH = [
  {m:'screw', v:10, enc:131072, unit:0.001, t:'مكنة تخريم: بول سكرو خطوته <b class="eq">10 mm</b> على الموتور مباشرة، إنكودر <b class="eq">17-bit</b>، وعايزين <b>1 نبضة = <span class="eq">0.001 mm</span></b>.'},
  {m:'belt', v:120, enc:1048576, unit:0.01, t:'سير نقل: البكرة <b><span class="eq">24</span> سنة × <span class="eq">5 mm = 120 mm</span></b> في اللفة، إنكودر <b class="eq">20-bit</b>، وعايزين <b>1 نبضة = <span class="eq">0.01 mm</span></b>.'},
  {m:'table', v:10, enc:8388608, unit:0.001, t:'ترابيزة دوّارة بجيربوكس <b class="eq">1:10</b> (لفة الموتور = 36°)، إنكودر <b class="eq">23-bit</b>، وعايزين <b>1 نبضة = <span class="eq">0.001°</span></b>.'}
];
SV.gearCalc = function(host, opt){
  opt = opt || {};
  const KEYG = 'l7c';
  host.innerHTML = `<div class="wd-ctl gc-in"><label>الماكينة <select class="inp" data-c="m">${Object.keys(SV.MACH).map(k => `<option value="${k}">${SV.MACH[k].t}</option>`).join('')}</select></label><label><span class="gc-vl"></span> <select class="inp" data-c="v"></select></label><label>الإنكودر <select class="inp" data-c="enc">${SV.ENCS.map(e => `<option value="${e[0]}">${e[1]}</option>`).join('')}</select></label><label>النبضة الواحدة = <select class="inp" data-c="unit"><option>0.1</option><option selected>0.01</option><option>0.001</option></select> <span class="gc-u"></span></label></div>
  <div class="wd-art gc-art"></div>
  <div class="read gc-read"></div>
  <div class="wd-ctl"><button type="button" class="btn" data-a="send">ابعت 1000 نبضة</button><button type="button" class="btn" data-a="zero">رجّع</button></div>
  <p class="statline gc-msg" aria-live="polite"></p>
  <h4 style="margin-top:6px">التحدّي: احسب الجير لـ 3 مكن حقيقية</h4>
  <div class="gc-ch"></div>
  <p class="chal gc-chal">حلّ <b>التلات مكن</b>. اكتب البسط N والمقام M (أي كسر مساوي مقبول).</p>`;
  const q = s => $(s, host), fin = chal(host, '.gc-chal', opt.lesson, opt.task || 'calc');
  const S = {m:'screw', v:10, enc:131072, unit:0.01, pos:0, vis:0};
  function calc(o){ const per = SV.MACH[o.m].per(o.v), ppr = per / o.unit, g = gcd(o.enc, Math.round(ppr)); return {per, ppr, N:o.enc / g, M:Math.round(ppr) / g, f:ppr * 3000 / 60}; }
  function fillV(){ const M = SV.MACH[S.m]; q('.gc-vl').textContent = M.lab; q('[data-c=v]').innerHTML = M.opts.map(v => `<option${v === S.v ? ' selected' : ''}>${v}</option>`).join(''); if (M.opts.indexOf(S.v) < 0){ S.v = M.opts[1]; q('[data-c=v]').value = S.v; } q('.gc-u').textContent = M.u; }
  function draw(){
    const r = calc(S), M = SV.MACH[S.m], u = M.u;
    let art;
    const px = 40 + (((S.vis % 300) + 300) % 300);
    if (S.m === 'table'){ const a = S.vis; art = `<svg viewBox="0 0 360 150" role="img" aria-label="ترابيزة دوّارة"><rect x="30" y="50" width="70" height="50" rx="6" fill="#252c31"/>${tx(65, 120, 'الموتور', {a:'middle', ar:1, s:11, c:'w-mu'})}<rect x="100" y="62" width="60" height="26" rx="4" fill="#59656e"/>${tx(130, 120, 'جيربوكس 1:' + S.v, {a:'middle', s:11, c:'w-mu'})}${dial(250, 75, 56, a)}${tx(250, 146, 'الترابيزة', {a:'middle', ar:1, s:11, c:'w-mu'})}</svg>`; }
    else { let th = ''; for (let x = 40; x < 340; x += 8) th += `<line x1="${x}" y1="${S.m === 'screw' ? 74 : 78}" x2="${x + 5}" y2="${S.m === 'screw' ? 86 : 78}" stroke="#7d878e" stroke-width="1.5"/>`;
      art = `<svg viewBox="0 0 360 150" role="img" aria-label="${M.t}"><rect x="4" y="56" width="34" height="48" rx="5" fill="#252c31"/>${S.m === 'screw' ? `<rect x="38" y="74" width="300" height="12" fill="#c3cad0"/>` : `<circle cx="50" cy="80" r="14" fill="#59656e"/><circle cx="330" cy="80" r="14" fill="#59656e"/><rect x="50" y="64" width="280" height="6" fill="#1d2327"/><rect x="50" y="90" width="280" height="6" fill="#1d2327"/>`}${th}<rect x="${px - 20}" y="${S.m === 'screw' ? 58 : 44}" width="40" height="${S.m === 'screw' ? 44 : 22}" rx="4" fill="#2456c9"/>${tx(180, 130, 'المسافة: \u2066' + fmt(S.pos, 3) + ' mm\u2069', {a:'middle', ar:1, s:12, w:700})}</svg>`; }
    q('.gc-art').innerHTML = art;
    q('.gc-read').innerHTML = `<div><span>حركة لفة الموتور</span><b>${fmt(r.per, 3)} ${u}</b></div><div><span>نبضات الـ PLC في اللفة</span><b>${fmt(r.ppr, 0)}</b></div><div><span>الجير N / M</span><b>${r.N} / ${r.M}</b></div><div><span>تردد النبضات على 3000 rpm</span><b class="${r.f > 200000 ? 'bad' : 'ok'}">${fmt(r.f / 1000, 1)} kHz</b></div>`;
    const m = q('.gc-msg');
    if (!Number.isInteger(+fmt(r.ppr, 6))){ stc(m, 'warn'); m.innerHTML = 'نبضات اللفة طلعت كسر: ده معناه خطأ تراكمي صغير مع كل لفة. اختار وحدة تقسم حركة اللفة بالظبط.'; }
    else if (r.f > 200000){ stc(m, 'bad'); m.innerHTML = `عشان الموتور يوصل 3000 rpm الـ PLC محتاج يطلّع <b class="eq">${fmt(r.f / 1000, 0)} kHz</b>. خرج ترانزستور عادي آخره حوالي 100 لـ 200 kHz. كبّر الوحدة (دقة أقل) أو استخدم Line driver.`; }
    else { stc(m, 'ok'); m.innerHTML = `الدرايف هيضرب كل نبضة جاية في <b class="eq">${r.N}/${r.M}</b> ويحوّلها لعدّات إنكودر. يعني 1 نبضة = <span class="eq">${S.unit} ${u}</span> بالظبط.`; }
  }
  function chs(){
    const o = sub(null, KEYG);
    q('.gc-ch').innerHTML = SV.GEAR_CH.map((c, i) => `<form class="dr-card gc-c${o[i] ? ' ok' : ''}" data-i="${i}"><div>${i + 1}. ${c.t}</div><div class="dr-in"><input class="inp" inputmode="numeric" aria-label="البسط N" placeholder="N" value="${o[i] ? calc(c).N : ''}"><span class="mono">/</span><input class="inp" inputmode="numeric" aria-label="المقام M" placeholder="M" value="${o[i] ? calc(c).M : ''}"><button class="btn pri" type="submit">تأكيد</button></div><p class="qz-f${o[i] ? ' ok' : ''}" aria-live="polite">${o[i] ? 'صح ✓' : ''}</p></form>`).join('');
  }
  host.addEventListener('submit', e => {
    e.preventDefault(); const f = e.target.closest('.gc-c'); if (!f) return;
    const i = +f.dataset.i, c = SV.GEAR_CH[i], r = calc(c), ins = $$('input', f), N = num(ins[0].value), M = num(ins[1].value), fb = $('.qz-f', f);
    if (!(N > 0 && M > 0)){ fb.className = 'qz-f no'; fb.textContent = 'اكتب رقمين أكبر من صفر.'; return; }
    if (Math.abs(N * Math.round(r.ppr) - M * c.enc) < 1e-6 * M * c.enc){ fb.className = 'qz-f ok'; fb.innerHTML = `صح ✓ نبضات اللفة = ${fmt(r.per, 0)} ÷ ${c.unit} = ${fmt(r.ppr, 0)}، والجير = ${c.enc} / ${fmt(r.ppr, 0)} = <b class="eq">${r.N}/${r.M}</b>.`; f.classList.add('ok'); const o = subMark(KEYG, i); if (SV.GEAR_CH.every((_, k) => o[k])) fin(); }
    else { fb.className = 'qz-f no'; fb.innerHTML = 'مش مظبوط. احسب الأول: نبضات اللفة = حركة لفة الموتور ÷ قيمة النبضة. وبعدين الجير = عدّات الإنكودر ÷ نبضات اللفة.'; }
  });
  host.addEventListener('change', e => { const c = e.target.dataset.c; if (!c) return; S[c] = c === 'm' ? e.target.value : +e.target.value; if (c === 'm') fillV(); S.pos = 0; S.vis = 0; draw(); });
  onAct(host, '[data-a]', b => {
    if (b.dataset.a === 'zero'){ S.pos = 0; S.vis = 0; draw(); return; }
    const d = 1000 * S.unit, from = S.vis; S.pos += d;
    const target = S.m === 'table' ? S.pos : S.pos * (S.m === 'screw' ? 10 : 2), t0 = performance.now();
    (function st(){ const k = reduced() ? 1 : Math.min(1, (performance.now() - t0) / 500); S.vis = from + (target - from) * k; draw(); if (k < 1) requestAnimationFrame(st); })();
  });
  fillV(); draw(); chs();
  return {calc, solve(){ SV.GEAR_CH.forEach((c, i) => { const f = q(`.gc-c[data-i="${i}"]`), r = calc(c), ins = $$('input', f); ins[0].value = r.N; ins[1].value = r.M; f.requestSubmit(); }); }};
};
SV.gearGen = function(){
  const k = pick(['dist', 'freq', 'ppr', 'rpm']);
  if (k === 'dist'){ const u = pick([0.01, 0.001]), d = pick([12.5, 250, 75, 1200]); const v = Math.round(d / u); return {q:`الجير متظبط إن <b>1 نبضة = <span class="eq">${u} mm</span></b>. عشان المحور يتحرك <b class="eq">${d} mm</b> الـ PLC يبعت كام نبضة؟`, input:true, unit:'نبضة', check:x => x === v, ans:String(v), why:`${d} ÷ ${u} = ${v}.`}; }
  if (k === 'freq'){ const p = pick([1000, 5000, 10000]), n = pick([600, 1500, 3000]); const v = p * n / 60 / 1000; return {q:`الـ PLC بيبعت <b class="eq">${p}</b> نبضة في لفة الموتور. عشان الموتور يلف <b class="eq">${n} rpm</b> التردد لازم يبقى كام <b>kHz</b>؟`, input:true, unit:'kHz', check:x => Math.abs(x - v) <= v * 0.02, ans:fmt(v, 1) + ' kHz', why:`${p} × ${n} ÷ 60 = ${fmt(v * 1000, 0)} Hz = ${fmt(v, 1)} kHz.`}; }
  if (k === 'ppr'){ const pt = pick([5, 10, 20]), u = pick([0.01, 0.001]); const v = Math.round(pt / u); return {q:`سكرو خطوته <b class="eq">${pt} mm</b> على الموتور مباشرة، وعايزين <b>1 نبضة = <span class="eq">${u} mm</span></b>. كام نبضة في لفة الموتور؟`, input:true, unit:'نبضة/لفة', check:x => x === v, ans:String(v), why:`${pt} ÷ ${u} = ${v}.`}; }
  const v = pick([6, 12, 30]), pt = pick([10, 20]); const n = v * 1000 / pt; return {q:`محور بول سكرو خطوته <b class="eq">${pt} mm</b>، وعايزينه يمشي <b class="eq">${v} m/min</b>. الموتور يلف كام <b>rpm</b>؟`, input:true, unit:'rpm', check:x => Math.abs(x - n) < 1, ans:String(n), why:`${v} m/min = ${v * 1000} mm/min ÷ ${pt} = ${n} rpm.`};
};

/* ================= L8: tuning ================= */
/* cascaded P (position) + PI (speed) loops, current loop as a lag + transport delay. Units: rev, s. */
SV.tuneSim = function(p){
  const dt = 5e-5, Tend = 0.25, J = 1 + p.ratio, Jest = 1 + p.est, D = 1, Tm = 0.1, A = 4 * D / (Tm * Tm), Tmax = 31 * A / 0.7;
  const Kv = 2 * Math.PI * p.fv, Kp = p.kp, Ti = p.ti / 1000, tc = 3e-4, tf = 5e-4, nd = Math.round(4e-4 / dt), buf = new Array(nd).fill(0);
  let bi = 0, th = 0, w = 0, T = 0, wm = 0, I = 0, ov = 0, lastBad = 0, peak = 0, osc = 0;
  const ref = t => t <= 0 ? 0 : t < Tm / 2 ? 0.5 * A * t * t : t < Tm ? D - 0.5 * A * (Tm - t) * (Tm - t) : D;
  const vref = t => t <= 0 || t >= Tm ? 0 : t < Tm / 2 ? A * t : A * (Tm - t);
  const out = {t:[], v:[], vr:[], e:[]};
  for (let k = 0; k * dt < Tend; k++){
    const t = k * dt, r = ref(t), wr = Kp * (r - th), e = wr - wm; I += e * dt / Ti;
    let Tc = Kv * Jest * (e + I); if (Math.abs(Tc) > Tmax){ Tc = Math.sign(Tc) * Tmax; I -= e * dt / Ti; }
    const Td = buf[bi]; buf[bi] = Tc; bi = (bi + 1) % nd; T += (Td - T) * dt / tc; w += T / J * dt; th += w * dt; wm += (w - wm) * dt / tf;
    if (!isFinite(th) || Math.abs(th) > 50) return {unstable:true, out};
    const err = (r - th) * 10000;
    if (t < Tm) peak = Math.max(peak, Math.abs(err)); else { ov = Math.max(ov, (th - D) * 10000); if (Math.abs(err) > 10) lastBad = t; }
    if (t > Tend - 0.06) osc = Math.max(osc, Math.abs(T) / Tmax);
    if (k % 20 === 0){ out.t.push(t); out.v.push(w * 60); out.vr.push(vref(t) * 60); out.e.push(err); }
  }
  return {ov, settle:Math.max(0, (lastBad - Tm) * 1000), done:lastBad < Tend - 0.002, peak, osc, buzz:osc > 0.1, out};
};
SV.tuning = function(host, opt){
  opt = opt || {};
  const LOADS = [[1, 'حمل خفيف (×1)'], [10, 'سير تقيل (×10)'], [25, 'ترابيزة تقيلة (×25)']];
  const S = {ratio:10, est:0, kp:35, fv:40, ti:20, ran:false, busy:false};
  const sl = (k, l, min, max, step, u) => `<label>${l}: <b class="tu-${k}"></b> <span class="muted">${u}</span><input type="range" min="${min}" max="${max}" step="${step}" data-c="${k}" aria-label="${l}"></label>`;
  host.innerHTML = `<div class="wd-ctl"><label>الحمل الحقيقي على الموتور (نسبة الـ Inertia) <select class="inp" data-c="ratio">${LOADS.map(l => `<option value="${l[0]}"${l[0] === S.ratio ? ' selected' : ''}>${l[1]}</option>`).join('')}</select></label></div>
  <div class="sim-grid two-col"><div class="wd-art tu-art"></div><div class="wd-ctl tu-sl">${sl('est', 'نسبة الـ Inertia في الباراميتر (JL/JM)', 0, 50, 1, '×')}${sl('kp', 'جين المكان Kp', 10, 500, 5, 'rad/s')}${sl('fv', 'جين السرعة Kv', 10, 400, 5, 'Hz')}${sl('ti', 'زمن التكامل Ti', 1, 50, 1, 'ms')}</div></div>
  <div class="wd-ctl"><button type="button" class="btn pri" data-a="run">شغّل حركة: لفة في <bdi dir="ltr">100 ms</bdi></button><button type="button" class="btn" data-a="auto">Auto-tune</button></div>
  <div class="read sm tu-read"></div>
  <p class="statline tu-msg" aria-live="polite"></p>
  <p class="chal tu-chal">على <b>السير التقيل (×10)</b>: خلّي الـ <b>Settling أقل من 20 ms</b> والـ <b>Overshoot أقل من 5 نبضات</b> و<b>من غير زنّة</b>. الأوتو تيون لوحده مش هيوصلك، كمّل بإيدك.</p>`;
  const q = s => $(s, host), finA = chal(host, '.nothing', opt.lesson, 'auto'), fin = chal(host, '.tu-chal', opt.lesson, opt.task || 'tune');
  function sync(){ ['est', 'kp', 'fv', 'ti'].forEach(k => { q(`[data-c=${k}]`).value = S[k]; q('.tu-' + k).textContent = S[k]; }); }
  function plot(r){
    const W = 360, H = 250, x0 = 40, x1 = 352, tmax = 0.25, X = t => x0 + (x1 - x0) * t / tmax;
    const vmax = 1500, Yv = v => 100 - Math.max(-10, Math.min(1.1, v / vmax)) * 80;
    const emax = 60, Ye = e => 190 + Math.max(-1, Math.min(1, e / emax)) * -45;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="منحنى الاستجابة"><rect x="${x0}" y="12" width="${x1 - x0}" height="96" class="w-bg" stroke="var(--line)"/><rect x="${x0}" y="142" width="${x1 - x0}" height="96" class="w-bg" stroke="var(--line)"/>`;
    s += `<rect x="${x0}" y="${Ye(10)}" width="${x1 - x0}" height="${Ye(-10) - Ye(10)}" fill="#2b9a4a" opacity=".18"/><line x1="${x0}" x2="${x1}" y1="${Ye(0)}" y2="${Ye(0)}" stroke="var(--line)"/><line x1="${X(0.1)}" x2="${X(0.1)}" y1="12" y2="238" stroke="var(--muted)" stroke-dasharray="3 3"/>`;
    s += tx(x0 + 4, 26, 'السرعة (rpm)', {ar:1, s:10.5, c:'w-mu'}) + tx(x0 + 4, 156, 'غلط المكان (نبضات) · الأخضر = ±10', {ar:1, s:10.5, c:'w-mu'}) + tx(X(0.1), 250, '100 ms', {a:'middle', s:9.5, c:'w-mu'}) + tx(x0 - 4, Ye(emax) + 4, '+60', {a:'end', s:9, c:'w-mu'}) + tx(x0 - 4, Ye(-emax) + 4, '−60', {a:'end', s:9, c:'w-mu'}) + tx(x0 - 4, Yv(1200) + 4, '1200', {a:'end', s:9, c:'w-mu'});
    if (r){
      const o = r.out, line = (arr, Y, c, w, da) => `<path d="${arr.map((v, i) => (i ? 'L' : 'M') + X(o.t[i]).toFixed(1) + ' ' + Y(v).toFixed(1)).join('')}" fill="none" stroke="${c}" stroke-width="${w}"${da ? ' stroke-dasharray="5 4"' : ''}/>`;
      s += line(o.vr, Yv, 'var(--muted)', 2, 1) + line(o.v, Yv, 'var(--accent)', 2.2) + `<g clip-path="url(#tuc)">${line(o.e, Ye, '#e4572e', 2)}</g><clipPath id="tuc"><rect x="${x0}" y="142" width="${x1 - x0}" height="96"/></clipPath>`;
    }
    q('.tu-art').innerHTML = s + '</svg>';
  }
  function verdict(r){
    if (r.unstable || r.buzz) return ['bad', '<b>بيزن / بيهتز!</b> الجين عالي على الحمل ده (أو نسبة الـ Inertia في الباراميتر أكبر بكتير من الحقيقة). في الحقيقة هتسمع صوت صفير والموتور يسخن. نزّل Kv أو Kp.'];
    if (r.ov > 5) return ['warn', `<b>Overshoot ${fmt(r.ov, 0)} نبضة:</b> المحور بيعدّي الهدف ويرجع (Ringing). غالبًا نسبة الـ Inertia في الباراميتر أقل من الحقيقة، أو Kp عالي على Kv، أو Ti صغير.`];
    if (!r.done) return ['warn', '<b>مستقرّش في الوقت ده.</b> بطيء جدًا (Sluggish): الجين واطي. زوّد Kv وبعدين Kp.'];
    if (r.settle > 20) return ['warn', `<b>بطيء شوية:</b> بياخد ${fmt(r.settle, 0)} ms عشان يدخل في الـ In-position. ممكن تزوّد Kp (وKv لو لزم).`];
    return ['ok', `<b>ممتاز!</b> Settling ${fmt(r.settle, 1)} ms من غير Overshoot ولا زنّة.`];
  }
  function run(){
    const r = SV.tuneSim(S); S.ran = true; plot(r);
    q('.tu-read').innerHTML = `<div><span>Overshoot</span><b class="${r.ov > 5 ? 'warn' : 'ok'}">${r.unstable ? '—' : fmt(r.ov, 0)} نبضة</b></div><div><span>Settling</span><b class="${!r.done || r.settle > 20 ? 'warn' : 'ok'}">${r.done ? fmt(r.settle, 1) + ' ms' : '> 150 ms'}</b></div><div><span>أقصى Following error</span><b>${r.unstable ? '—' : fmt(r.peak, 0)}</b></div><div><span>زنّة</span><b class="${r.buzz || r.unstable ? 'bad' : 'ok'}">${r.buzz || r.unstable ? 'أيوه' : 'لأ'}</b></div>`;
    const v = verdict(r), m = q('.tu-msg'); stc(m, v[0]); m.innerHTML = v[1];
    if (S.ratio >= 10 && v[0] === 'ok' && r.settle < 20 && r.ov < 5) fin();
    return r;
  }
  host.addEventListener('input', e => { const c = e.target.dataset.c; if (!c || c === 'ratio') return; S[c] = +e.target.value; q('.tu-' + c).textContent = S[c]; });
  host.addEventListener('change', e => { const c = e.target.dataset.c; if (c === 'ratio'){ S.ratio = +e.target.value; stc(q('.tu-msg'), ''); q('.tu-msg').textContent = 'الحمل اتغيّر. شغّل حركة وشوف الجين القديم بقى عامل إزاي.'; } if (c && S.ran) run(); });
  onAct(host, '[data-a]', b => {
    if (S.busy) return;
    if (b.dataset.a === 'run'){ run(); return; }
    S.busy = true; const m = q('.tu-msg'); stc(m, ''); m.innerHTML = 'Auto-tune: الموتور بيتحرك يمين وشمال حركات صغيرة عشان يقيس الـ Inertia…';
    let k = 0; const steps = reduced() ? 1 : 6;
    (function st(){ if (k++ < steps){ S.est = Math.round(Math.random() * 40); sync(); setTimeout(st, 180); return; }
      S.est = Math.max(0, Math.round(S.ratio * (0.95 + Math.random() * 0.1))); S.fv = 100; S.kp = 120; S.ti = 8; sync(); S.busy = false; const r = run(); finA();
      stc(m, verdict(r)[0]); m.innerHTML = `Auto-tune خلّص: قاس نسبة الـ Inertia = <b>${S.est}</b> وحط جين متوسط (Kv 100 Hz و Kp 120). ` + verdict(r)[1];
    })();
  });
  sync(); plot(null);
  stc(q('.tu-msg'), ''); q('.tu-msg').innerHTML = 'الإعدادات دلوقتي إعدادات المصنع (نسبة Inertia = 0) والموتور عليه سير تقيل. دوس «شغّل حركة».';
  return {S, run, sync, set(o){ Object.assign(S, o); sync(); }};
};

/* ================= L9: homing and limits ================= */
SV.axis = function(host, opt){
  opt = opt || {};
  const KEYL = 'l9s', LSN = 15, LSP = 385, DOG = [60, 80], ZOFF = 3.7, X = mm => 20 + mm * 0.8;
  host.innerHTML = `<div class="wd-art ax-art"></div>
  <div class="read sm"><div><span>المكان (إحداثيات المكنة)</span><b class="r-mc">؟</b></div><div><span>الهومينج</span><b class="r-h">مش متعمل</b></div><div><span>الحساسات</span><b class="r-s">—</b></div></div>
  <div class="wd-ctl"><button type="button" class="btn" data-a="jn">◀ JOG سالب</button><button type="button" class="btn" data-a="jp">JOG موجب ▶</button><button type="button" class="btn" data-a="stop">وقّف</button></div>
  <div class="wd-ctl"><label>طريقة الهومينج <select class="inp" data-c="meth"><option value="dog">لحد حساس الهوم وبعدين نبضة Z</option><option value="ls">لحد الليميت السالب وبعدين نبضة Z</option><option value="here">المكان الحالي = صفر</option></select></label><button type="button" class="btn pri" data-a="home">ابدأ الهومينج</button></div>
  <div class="wd-ctl"><label>الإنكودر <select class="inp" data-c="enc"><option value="inc">إنكريمنتال</option><option value="abs">أبسليوت</option></select></label><label>الليميت سويتش <select class="inp" data-c="lst"><option value="nc">NC (مقفول طبيعي)</option><option value="no">NO (مفتوح طبيعي)</option></select></label><button type="button" class="btn" data-a="cut" aria-pressed="false">اقطع سلك الـ +LS ✂</button><button type="button" class="btn" data-a="pwr">⚡ اقطع الكهربا وارجعها</button><button type="button" class="btn" data-a="reset">Reset إنذار</button></div>
  <p class="statline ax-msg" aria-live="polite"></p>
  <p class="chal ax-chal">اعمل <b>هومينج</b> بحساس الهوم أو بالليميت، وبعدين جرّب توصل لـ <b>Software limit</b> ولـ <b>الليميت سويتش</b>.</p>`;
  const q = s => $(s, host), finH = chal(host, '.ax-chal', opt.lesson, 'home'), finL = chal(host, '.nothing', opt.lesson, 'limits');
  const S = {pos:130 + Math.random() * 140, v:0, homed:false, org:0, meth:'dog', enc:'inc', lst:'nc', cut:false, alarm:null, ph:null, inDog:false, lastZ:null};
  const SWA = [34, 364]; /* software limits, absolute machine travel (mm) */
  const dog = () => S.pos >= DOG[0] && S.pos <= DOG[1];
  const lsP = () => S.cut ? S.lst === 'nc' : S.pos >= LSP, lsN = () => S.pos <= LSN;
  const mc = () => S.pos - S.org;
  function msg(c, h){ const m = q('.ax-msg'); stc(m, c); m.innerHTML = h; }
  function seen(k){ const o = subMark(KEYL, k); if (o.soft && o.hw) finL(); }
  function draw(){
    let z = ''; for (let mm = ZOFF; mm < 400; mm += 10) z += `<line x1="${X(mm).toFixed(1)}" x2="${X(mm).toFixed(1)}" y1="96" y2="102" stroke="#ff4d8a" stroke-width="1.2"/>`;
    const sens = (mm, l, on, up) => `<g><path d="M${X(mm) - 6} ${up ? 44 : 132} h12 l-6 ${up ? 10 : -10}z" fill="${on ? '#ffb300' : '#8d99a1'}"/>${tx(X(mm), up ? 38 : 148, l, {a:'middle', s:10, w:700})}<circle cx="${X(mm)}" cy="${up ? 26 : 160}" r="4" fill="${on ? '#ffb300' : '#3b444b'}"/></g>`;
    const sw = S.homed ? `<line x1="${X(SWA[0])}" x2="${X(SWA[0])}" y1="58" y2="122" stroke="#2456c9" stroke-dasharray="4 3" stroke-width="2"/><line x1="${X(SWA[1])}" x2="${X(SWA[1])}" y1="58" y2="122" stroke="#2456c9" stroke-dasharray="4 3" stroke-width="2"/>${tx(X(SWA[0]), 172, 'SW−', {a:'middle', s:10, st:'fill:#2456c9;font-weight:700'})}${tx(X(SWA[1]), 172, 'SW+', {a:'middle', s:10, st:'fill:#2456c9;font-weight:700'})}${tx(X(S.org), 172, '0', {a:'middle', s:11, st:'fill:#2b9a4a;font-weight:700'})}<line x1="${X(S.org)}" x2="${X(S.org)}" y1="104" y2="126" stroke="#2b9a4a" stroke-width="2"/>` : '';
    q('.ax-art').innerHTML = `<svg viewBox="0 0 360 180" role="img" aria-label="محور بول سكرو بحساسات"><rect x="4" y="60" width="16" height="62" fill="#3b444b"/><rect x="340" y="60" width="16" height="62" fill="#3b444b"/>${tx(12, 56, 'Hard', {a:'middle', s:8, c:'w-mu'})}<rect x="20" y="84" width="320" height="12" fill="#c3cad0"/>${z}${sw}
      <rect x="${X(DOG[0])}" y="56" width="${X(DOG[1]) - X(DOG[0])}" height="6" fill="#a86a00"/>
      ${sens(LSN, '−LS', lsN(), 1)}${sens(DOG[0] - 2, 'HOME', dog(), 0)}${sens(LSP, '+LS', lsP(), 1)}
      <rect x="${X(S.pos) - 14}" y="66" width="28" height="48" rx="4" fill="${S.alarm ? '#c0352b' : '#2456c9'}"/>
      ${S.cut ? tx(X(LSP), 16, '✂ سلك مقطوع', {a:'middle', ar:1, s:10, st:'fill:#c0352b;font-weight:700'}) : ''}</svg>`;
    q('.r-mc').textContent = S.homed ? fmt(mc(), 1) + ' mm' : '؟ (مش معروف)';
    q('.r-h').textContent = S.homed ? 'متعمل ✓' : S.ph ? 'شغّال…' : 'مش متعمل';
    q('.r-s').textContent = [lsN() ? '−LS' : '', dog() ? 'HOME' : '', lsP() ? '+LS' : ''].filter(Boolean).join(' · ') || 'كله OFF';
  }
  function stop(){ S.v = 0; S.ph = null; }
  function alarm(t){ S.alarm = t; stop(); msg('bad', t); }
  onAct(host, '[data-a]', b => {
    const a = b.dataset.a;
    if (a === 'reset'){ if (S.pos >= 400 - 14 || S.pos <= 14){ S.pos = Math.min(Math.max(S.pos, 30), 370); } S.alarm = null; msg('', 'الإنذار اتمسح.'); draw(); return; }
    if (a === 'cut'){ S.cut = !S.cut; b.setAttribute('aria-pressed', String(S.cut)); msg(S.cut ? 'warn' : '', S.cut ? (S.lst === 'nc' ? 'قطعت سلك +LS وهو <b>NC</b>: الدرايف شايفه «اتضرب» على طول. ده الأمان: أي قطع = وقف.' : 'قطعت سلك +LS وهو <b>NO</b>: الدرايف مش هيعرف إنه اتقطع… جرّب تتحرك موجب ومن غير Software limit (يعني قبل الهومينج).') : 'السلك اتصلّح.'); draw(); return; }
    if (a === 'pwr'){ stop(); if (S.enc === 'inc'){ S.homed = false; msg('warn', 'رجعت الكهربا: الإنكريمنتال نسي مكانه. الـ Software limits مش شغّالة لحد ما تعمل هومينج تاني.'); } else msg('ok', 'رجعت الكهربا: الأبسليوت فاكر مكانه، والـ Software limits شغّالة على طول. مفيش هومينج.'); draw(); return; }
    if (a === 'stop'){ stop(); draw(); return; }
    if (S.alarm){ msg('bad', S.alarm + ' دوس <b>Reset إنذار</b> الأول.'); return; }
    if (a === 'jn' || a === 'jp'){ S.ph = null; S.v = a === 'jp' ? 50 : -50; msg('', 'JOG… دوس «وقّف» لما توصل.'); return; }
    if (a === 'home'){
      if (S.meth === 'here'){ S.org = S.pos; S.homed = true; msg('warn', 'المكان الحالي بقى صفر. سهل، بس لو المحور مش في مكان مظبوط ومتعلّم، الصفر هيتغيّر كل مرة. استخدمها بس مع أبسليوت أو مكان معروف.'); draw(); return; }
      S.homed = false; S.ph = S.meth === 'dog' ? 'seek' : 'toLs'; S.v = -60; msg('', S.meth === 'dog' ? 'بيدوّر على حساس الهوم في الاتجاه السالب…' : 'رايح للليميت السالب…');
    }
  });
  host.addEventListener('change', e => { const c = e.target.dataset.c; if (!c) return; S[c] = e.target.value; draw(); });
  animate(host, dt => {
    if (!dt || !S.v) return;
    const prev = S.pos; S.pos += S.v * dt;
    if (S.ph === 'seek'){
      if (dog()){ S.ph = 'leave'; S.v = 10; msg('', 'لقى الهوم! بيرجع ببطء لحد ما يسيب الحساس…'); }
      else if (lsN()){ S.ph = 'back'; S.v = 60; msg('', 'خبط الليميت السالب قبل الهوم (كان بادئ على الناحية التانية). بيعكس ويدوّر على الهوم من الناحية التانية…'); }
    } else if (S.ph === 'back'){ if (dog()){ S.ph = 'leave'; S.v = 10; } }
    else if (S.ph === 'toLs'){ if (lsN()){ S.ph = 'leaveLs'; S.v = 10; msg('', 'وصل الليميت. بيرجع ببطء ويدوّر على نبضة Z…'); } }
    else if (S.ph === 'leave' && !dog() && S.pos > DOG[1]){ S.ph = 'z'; msg('', 'ساب الحساس. بيدوّر على أول نبضة Z…'); }
    else if (S.ph === 'leaveLs' && !lsN()){ S.ph = 'z'; }
    else if (S.ph === 'z'){ const z1 = Math.floor((prev - ZOFF) / 10), z2 = Math.floor((S.pos - ZOFF) / 10); if (z2 > z1){ S.pos = ZOFF + z2 * 10; S.org = S.pos; S.homed = true; stop(); msg('ok', `الهومينج خلّص ✓ الصفر اتحط على نبضة Z (مكانها ثابت في كل مرة بدقة نبضة). دلوقتي الـ <b>Software limits</b> (الخطوط الزرقا) شغّالة.`); finH(); draw(); return; } }
    if (!S.ph){
      if (S.homed && ((S.v > 0 && S.pos >= SWA[1]) || (S.v < 0 && S.pos <= SWA[0]))){ S.pos = S.v > 0 ? SWA[1] : SWA[0]; stop(); msg('warn', `<b>Software limit ${S.v > 0 ? '+' : '−'}:</b> الدرايف وقف المحور قبل الليميت سويتش بمسافة أمان. ده بيشتغل بس بعد الهومينج.`); seen('soft'); }
      else if (S.v > 0 && lsP()){ S.v = 0; msg('warn', S.cut ? '<b>+LS شغّال (السلك NC مقطوع):</b> الدرايف مانع الحركة الموجبة. اصلح السلك. ده بالظبط ليه الليميت بيتعمل NC.' : '<b>+LS اتضرب:</b> الدرايف وقف الحركة الموجبة (Forward inhibit)، وتقدر تتحرك سالب بس عشان تطلع.'); seen('hw'); }
      else if (S.v < 0 && lsN()){ S.v = 0; msg('warn', '<b>−LS اتضرب:</b> الحركة السالبة ممنوعة، اتحرك موجب عشان تطلع.'); seen('hw'); }
    }
    if (S.pos >= 400 - 14 || S.pos <= 14){ S.pos = S.pos > 200 ? 400 - 14 : 14; alarm('<b>تصادم!</b> المحور خبط في الـ Hard stop والدرايف طلّع <b>Overload / Position deviation</b>. ' + (S.cut && S.lst === 'no' ? 'السلك المقطوع على ليميت NO = الحماية اختفت من غير ما حد يعرف. عشان كده الليميت بيتعمل NC.' : '')); }
    draw();
  });
  draw(); msg('', 'المحور واقف في مكان مش معروف. جرّب JOG، وبعدين اعمل هومينج.');
  return {S, draw, set(o){ Object.assign(S, o); draw(); }};
};

/* ================= L10: pulses from a PLC ================= */
SV.plcPulse = function(host, opt){
  opt = opt || {};
  const OUT = {oc:[100, 'ترانزستور (Open collector) · \u2066100 kHz\u2069'], ld:[1000, 'تفاضلي (Line driver) · \u20661 MHz\u2069']};
  const S = {out:'oc', f:100, ppr:10000, rpm:0, ang:0};
  host.innerHTML = `<div class="wd-ctl"><label>خرج الـ PLC <select class="inp" data-c="out">${Object.keys(OUT).map(k => `<option value="${k}">${OUT[k][1]}</option>`).join('')}</select></label><label>نبضات الأمر في اللفة (الجير) <select class="inp" data-c="ppr">${[1000, 2000, 5000, 10000, 20000].map(v => `<option${v === S.ppr ? ' selected' : ''}>${v}</option>`).join('')}</select></label><label>تردد النبضات: <b class="pp-f"></b><input type="range" min="0" max="1000" step="5" value="${S.f}" data-c="f" aria-label="تردد النبضات kHz"></label></div>
  <div class="wd-art pp-art"></div>
  <div class="read sm pp-read"></div>
  <p class="statline pp-msg" aria-live="polite"></p>
  <p class="chal pp-chal">بـ <b>خرج الترانزستور</b> (Open collector): خلّي الموتور يلف <b>3000 rpm</b> من غير ما نبضات تضيع.</p>`;
  const q = s => $(s, host), fin = chal(host, '.pp-chal', opt.lesson, opt.task || 'pulse');
  function state(){ const lim = OUT[S.out][0], fOk = S.f <= lim, eff = fOk ? S.f : lim * 0.8, want = S.f * 1000 / S.ppr * 60, rpm = eff * 1000 / S.ppr * 60; return {lim, fOk, want, rpm:Math.min(rpm, 5200), over:want > 5000}; }
  function draw(){
    const r = state();
    q('.pp-f').textContent = S.f + ' kHz';
    q('.pp-art').innerHTML = `<svg viewBox="0 0 360 150" role="img" aria-label="PLC بيبعت نبضات للدرايف"><rect x="6" y="30" width="78" height="80" rx="6" fill="#d9dee2" stroke="#59656e"/>${tx(45, 52, 'PLC', {a:'middle', s:13, w:700, st:'fill:#1d2327'})}${tx(45, 72, S.out === 'oc' ? 'OC' : 'LD', {a:'middle', s:11, st:'fill:#3b444b'})}
      <path d="M84 70 H170" stroke="${r.fOk ? '#ffd23f' : '#c0352b'}" stroke-width="4" stroke-dasharray="4 6" class="${S.f ? 'flow' : ''}" style="--dur:${S.f ? Math.max(0.15, 30 / S.f) : 1}s"/>${tx(127, 60, S.f + ' kHz', {a:'middle', s:11, w:700})}
      ${!r.fOk ? tx(127, 92, 'نبضات بتضيع!', {a:'middle', ar:1, s:11, st:'fill:#c0352b;font-weight:700'}) : ''}
      <rect x="170" y="26" width="70" height="90" rx="6" fill="#2f363c"/><rect x="178" y="34" width="54" height="22" rx="3" fill="#120707"/><text x="228" y="50" text-anchor="end" style="font:700 12px var(--font-mono);fill:#ff4d3a">${r.over ? 'AL.OS' : Math.round(r.rpm)}</text>
      <path d="M240 70 H262" stroke="#c0352b" stroke-width="3"/><g class="pp-dial">${dial(304, 72, 38, S.ang)}</g></svg>`;
    q('.pp-read').innerHTML = `<div><span>السرعة المطلوبة</span><b>${Math.round(r.want)} rpm</b></div><div><span>السرعة الفعلية</span><b class="${r.fOk && !r.over ? 'ok' : 'bad'}">${r.over ? 'إنذار' : Math.round(r.rpm) + ' rpm'}</b></div><div><span>حد الخرج</span><b>${r.lim} kHz</b></div>`;
    const m = q('.pp-msg');
    if (r.over){ stc(m, 'bad'); m.innerHTML = '<b>Overspeed:</b> الأمر أعلى من أقصى سرعة للموتور (5000 rpm هنا). الدرايف بيفصل.'; }
    else if (!r.fOk){ stc(m, 'bad'); m.innerHTML = `التردد أعلى من اللي الخرج يقدر يطلّعه نضيف (${r.lim} kHz): النبضات بتتشوّه وبتضيع، والمكنة <b>هتوصل مكان غلط من غير إنذار</b>. قلّل نبضات اللفة (الجير) أو استخدم Line driver.`; }
    else if (Math.abs(r.rpm - 3000) < 1 && S.out === 'oc'){ stc(m, 'ok'); m.innerHTML = `تمام: ${S.f} kHz ÷ ${S.ppr} × 60 = 3000 rpm، والتردد جوه حد الخرج. التمن: كل نبضة دلوقتي أكبر (دقة أقل).`; fin(); }
    else { stc(m, ''); m.innerHTML = `السرعة = التردد ÷ نبضات اللفة × 60 = <b class="eq">${S.f * 1000} ÷ ${S.ppr} × 60 = ${Math.round(r.want)} rpm</b>.`; }
  }
  host.addEventListener('input', e => { if (e.target.dataset.c === 'f'){ S.f = +e.target.value; draw(); } });
  host.addEventListener('change', e => { const c = e.target.dataset.c; if (c === 'out'){ S.out = e.target.value; draw(); } if (c === 'ppr'){ S.ppr = +e.target.value; draw(); } });
  animate(host, dt => { const r = state(); if (r.over || !S.f) return; if (reduced()) return; S.ang = (S.ang + r.rpm / 60 * 360 * dt * 0.05) % 360; const g = q('.pp-dial'); if (g) g.innerHTML = dial(304, 72, 38, S.ang); });
  draw();
  return {S, set(o){ Object.assign(S, o); q('[data-c=out]').value = S.out; q('[data-c=ppr]').value = S.ppr; q('[data-c=f]').value = S.f; draw(); }};
};
SV.IF_OPTS = ['نبضات (Pulse train)', 'أنالوج ±10 V', 'شبكة سريعة (EtherCAT / Profinet)', 'Modbus RS-485'];
SV.IF_CASES = [
  {s:'PLC صغير رخيص وعندك محور واحد بيتحرك من مكان لمكان (مكنة تقطيع بسيطة).', a:0, why:'أبسط وأرخص حل: خرج ترانزستور سريع ونبضات.'},
  {s:'خط فيه 12 محور لازم يتحركوا متزامنين مع بعض (Electronic cam) وعايز تقرا العزم والإنذارات من الـ PLC.', a:2, why:'محاور كتير + تزامن + بيانات: شبكة Motion سريعة زي EtherCAT.'},
  {s:'كارت Motion قديم بيطلّع أمر سرعة، وهو اللي قافل لوب المكان من الإنكودر بتاعه.', a:1, why:'الكارت بيبعت أمر سرعة أنالوج والدرايف في وضع السرعة.'},
  {s:'عايز تقرا الإنذار ودرجة حرارة الدرايف وتغيّر سرعة ثابتة كل فين وفين على سير بطيء.', a:3, why:'Modbus بطيء بس كويس للمراقبة والباراميترات، مش للحركة السريعة.'},
  {s:'لفّافة خامة (Winder) محتاجة شد ثابت، والـ PLC عنده خرج أنالوج فاضي.', a:1, why:'وضع العزم بأمر أنالوج.'},
  {s:'مكنة تعبئة جديدة بـ PLC من نفس شركة الدرايف، بـ 4 محاور وشاشة بتعرض الـ Following error.', a:2, why:'الشبكة بتدّيلك تحكم ومراقبة على كابل واحد.'},
  {s:'المسافة بين الـ PLC والدرايف 30 متر، ومكنة فيها انفرترات كتير ونويز عالي، وعايز نبضات.', a:0, why:'نبضات بس لازم Line driver تفاضلي مع كابل مشيلد (Open collector مش هيستحمل المسافة دي).'}
];

/* ================= L11: regen / overvoltage ================= */
SV.regen = function(host, opt){
  opt = opt || {};
  const S = {ratio:10, td:150, res:false, tripped:false, sawTrip:false};
  host.innerHTML = `<div class="wd-ctl"><label>الحمل <select class="inp" data-c="ratio"><option value="1">موتور لوحده تقريبًا (×1)</option><option value="10" selected>ترابيزة تقيلة (×10)</option></select></label><label>زمن الفرملة من 3000 rpm: <b class="rg-td"></b><input type="range" min="50" max="800" step="10" value="${S.td}" data-c="td" aria-label="زمن الفرملة"></label><button type="button" class="btn" data-a="res" aria-pressed="false">مقاومة فرملة خارجية: مش متوصّلة</button></div>
  <div class="wd-ctl"><button type="button" class="btn pri" data-a="run">وقّف الموتور</button></div>
  <div class="wd-art rg-art"></div>
  <p class="statline rg-msg" aria-live="polite"></p>
  <p class="chal rg-chal">اعمل وقفة تطلّع <b>Overvoltage</b>، وبعدين اصلحها بطريقة من الطريقتين ووقّف من غير إنذار.</p>`;
  const q = s => $(s, host), fin = chal(host, '.rg-chal', opt.lesson, opt.task || 'regen');
  function sim(){
    const Jm = 1.13e-4, J = Jm * (1 + S.ratio), w0 = 3000 * 2 * Math.PI / 60, td = S.td / 1000, C = 680e-6, Pl = 150, R = 60, dt = 1e-3;
    let V = 310, w = w0, trip = null, peak = V; const t = [], vs = [], ws = [];
    for (let k = 0; k * dt < 1.0; k++){
      const tt = k * dt;
      if (!trip){ const a = tt < td ? w0 / td : 0; w = Math.max(0, w0 - w0 * tt / td); const P = J * w * a - Pl * (tt < td ? 1 : 0); if (P > 0) V = Math.sqrt(V * V + 2 * P * dt / C); }
      else w = Math.max(0, w - 40 * dt);
      if (S.res && V > 370){ V = Math.sqrt(Math.max(310 * 310, V * V - 2 * V * V / R * dt / C)); }
      if (!trip && V >= 400){ trip = tt; }
      peak = Math.max(peak, V);
      if (k % 5 === 0){ t.push(tt); vs.push(V); ws.push(w * 60 / (2 * Math.PI)); }
    }
    return {t, vs, ws, trip, peak};
  }
  function plot(r){
    const x0 = 44, x1 = 350, X = t => x0 + (x1 - x0) * t, Yv = v => 120 - (Math.min(v, 560) - 280) / 280 * 100, Yw = w => 230 - w / 3000 * 80;
    let s = `<svg viewBox="0 0 360 250" role="img" aria-label="جهد الـ DC bus والسرعة"><rect x="${x0}" y="16" width="${x1 - x0}" height="106" class="w-bg" stroke="var(--line)"/><rect x="${x0}" y="146" width="${x1 - x0}" height="88" class="w-bg" stroke="var(--line)"/>`;
    s += `<line x1="${x0}" x2="${x1}" y1="${Yv(400)}" y2="${Yv(400)}" stroke="#c0352b" stroke-dasharray="5 4"/>${tx(x1 - 2, Yv(400) - 4, 'OV trip ≈ 400 V', {a:'end', s:10, st:'fill:#c0352b;font-weight:700'})}<line x1="${x0}" x2="${x1}" y1="${Yv(370)}" y2="${Yv(370)}" stroke="#a86a00" stroke-dasharray="2 4"/>${tx(x0 + 4, Yv(370) + 12, 'هنا المقاومة بتشتغل', {ar:1, s:9.5, st:'fill:#a86a00'})}${tx(x1 - 2, Yv(370) + 12, '370 V', {a:'end', s:9.5, st:'fill:#a86a00'})}`;
    s += tx(x0 + 4, 30, 'جهد الـ DC bus', {ar:1, s:10.5, c:'w-mu'}) + tx(x0 + 4, 160, 'سرعة الموتور', {ar:1, s:10.5, c:'w-mu'}) + tx(x0 - 4, Yv(310) + 4, '310', {a:'end', s:9, c:'w-mu'}) + tx(x0 - 4, Yv(500) + 4, '500', {a:'end', s:9, c:'w-mu'}) + tx(x0 - 4, Yw(3000) + 4, '3000', {a:'end', s:9, c:'w-mu'}) + tx(x1, 246, '1 s', {a:'end', s:9, c:'w-mu'});
    if (r){ const line = (a, Y, c) => `<path d="${a.map((v, i) => (i ? 'L' : 'M') + X(r.t[i]).toFixed(1) + ' ' + Y(v).toFixed(1)).join('')}" fill="none" stroke="${c}" stroke-width="2.2"/>`; s += line(r.vs, Yv, '#e4572e') + line(r.ws, Yw, 'var(--accent)'); if (r.trip != null) s += `<circle cx="${X(r.trip)}" cy="${Yv(400)}" r="6" fill="none" stroke="#c0352b" stroke-width="2.5"/>`; }
    q('.rg-art').innerHTML = s + '</svg>';
  }
  function run(){
    const r = sim(); plot(r); const m = q('.rg-msg');
    if (r.trip != null){ S.sawTrip = true; stc(m, 'bad'); m.innerHTML = `<b>إنذار Overvoltage</b> بعد ${Math.round(r.trip * 1000)} ms: الموتور وهو بيفرمل بقى <b>جنريتور</b> ورجّع طاقة الحمل للكباستورات، والجهد عدّى الحد. الدرايف فصل والموتور كمّل لوحده (Coast).`; }
    else { stc(m, 'ok'); m.innerHTML = `وقف من غير إنذار. أعلى جهد وصله الـ DC bus = <b class="eq">${Math.round(r.peak)} V</b>. ` + (S.res ? 'المقاومة حرقت الطاقة الزيادة على شكل حرارة.' : S.td >= 300 ? 'الفرملة الأبطأ خلّت الطاقة تتوزّع على وقت أطول وتضيع في الموتور نفسه.' : 'الحمل خفيف فالطاقة قليلة.'); if (S.sawTrip && S.ratio >= 10) fin(); }
    return r;
  }
  host.addEventListener('input', e => { if (e.target.dataset.c === 'td'){ S.td = +e.target.value; q('.rg-td').textContent = S.td + ' ms'; } });
  host.addEventListener('change', e => { if (e.target.dataset.c === 'ratio') S.ratio = +e.target.value; });
  onAct(host, '[data-a]', b => { if (b.dataset.a === 'res'){ S.res = !S.res; b.setAttribute('aria-pressed', String(S.res)); b.textContent = 'مقاومة فرملة خارجية: ' + (S.res ? 'متوصّلة' : 'مش متوصّلة'); return; } run(); });
  q('.rg-td').textContent = S.td + ' ms'; plot(null);
  return {S, run, set(o){ Object.assign(S, o); q('[data-c=td]').value = S.td; q('.rg-td').textContent = S.td + ' ms'; }};
};
SV.FAULT_CASES = [
  {t:'محور رأسي: Overload وهو بيبدأ', s:'محور Z رأسي في مكنة. كل ما يدّي Servo ON ويبدأ يتحرك يطلع <b>Overload</b> بعد ثواني، والموتور سخن جدًا رغم إن الحمل مش كبير.', clues:[['اسمع', 'مفيش صوت «تكة» الفرامل لما يدّي Servo ON.'], ['قيس', 'على طرفين الفرامل <span class="eq">0 V</span>. فيوز الـ 24V بتاع الفرامل محروق.']], o:['الفرامل مش بتفتح (الموتور بيشد ضدها)', 'الجين عالي', 'الإنكودر بايظ', 'مقاومة الفرملة'], a:0, why:'الموتور بيلف ضد فرامل ماسكة: تيار عالي ⇐ Overload. اتأكد من 24V الفرامل والريلاي وتوقيت فتحها.'},
  {t:'Position deviation excessive في التسارع', s:'بعد ما زوّدوا سرعة المكنة، بقى يطلع <b>Position deviation excessive</b> (Following error كبير) في أول كل حركة بس.', clues:[['المونيتور', 'العزم بيوصل للحد الأقصى (300%) في التسارع.'], ['التعديل', 'زمن التسارع اتغيّر من 200 ms لـ 30 ms.']], o:['التسارع أسرع من العزم المتاح', 'كابل الإنكودر', 'الـ STO', 'الكهربا ضعيفة'], a:0, why:'الموتور مش قادر يلحق الأمر ⇐ الغلط بيكبر لحد الحد. زوّد زمن التسارع، أو موتور أكبر، أو قلّل الحمل. (وممكن كمان حاجة ميكانيكية زانقة).'},
  {t:'Encoder error بيظهر ويختفي', s:'إنذار <b>Encoder error / Encoder communication</b> بيطلع مرة كل يوم أو يومين، دايمًا والمحور بيتحرك في آخر المشوار.', clues:[['الكابل', 'كابل الإنكودر ماشي في سلسلة كابلات (Cable chain) وهو كابل عادي مش مخصوص للحركة.'], ['الكونكتور', 'سليم ومربوط كويس.']], o:['كابل الإنكودر بيتقطع جوه من الحركة', 'الجين', 'الجير الإلكتروني', 'مقاومة الفرملة'], a:0, why:'الكابل العادي بيتكسر من الثني المتكرر. لازم كابل High-flex للـ Cable chain، وتأريض الشيلد صح.'},
  {t:'Overvoltage على الوقفة', s:'ترابيزة دوّارة تقيلة. بيطلع <b>Overvoltage</b> كل ما توقف، ومش بيطلع وهي ماشية.', clues:[['التوصيل', 'المقاومة الخارجية متوصّلة على P+ و C، بس فيه جمبر P+ و D لسه موجود والباراميتر على «مقاومة داخلية».'], ['الحمل', 'نسبة الـ Inertia حوالي 15.']], o:['الطاقة الراجعة مش لاقية مقاومة تتحرق فيها', 'الكهربا الداخلة عالية', 'الإنكودر', 'الجين'], a:0, why:'ظبط الباراميتر على المقاومة الخارجية وقيمتها وقدرتها حسب المانيوال، أو طوّل زمن الفرملة.'},
  {t:'الموتور جري لوحده بعد التغيير', s:'غيّروا موتور السيرفو بواحد جديد نفس الموديل. أول Servo ON الموتور اتنفض وجري لحد ما طلع <b>Overspeed</b> أو Overload.', clues:[['الكابل', 'الكابل الجديد متوصّل بأطراف منفصلة مش بكونكتور، والكهربائي وصّل U V W زي ما بيوصّل الموتور الإندكشن.']], o:['U V W مش في ترتيبها', 'الجير غلط', 'الجين واطي', 'البطارية فاضية'], a:0, why:'السيرفو لازم U على U و V على V و W على W. تبديل فازتين مش بيعكس الاتجاه هنا، ده بيبوّظ التحكم كله.'},
  {t:'Undervoltage لما المكبس يشتغل', s:'في نفس اللوحة مكبس هيدروليك كبير. كل ما موتور المكبس يبدأ، السيرفو يطلع <b>Undervoltage</b> ويفصل.', clues:[['قيس', 'الجهد بيهبط لحظيًا من 380 لـ 300 V على الباسبار وقت بدء المكبس.']], o:['هبوط في الكهربا الداخلة', 'الإنكودر', 'الجين عالي', 'الليميت'], a:0, why:'افصل تغذية السيرفو أو قوّيها، أو اعمل سوفت ستارتر للمكبس، واتأكد من مفيش فاز ضعيف أو كونتاكتور واكل.'},
  {t:'الدرايف عارض STO ومش بيدّي عزم', s:'بعد تعديل في دايرة الأمان، الدرايف بقى يعرض <b>STO</b> ومفيش عزم حتى مع Servo ON.', clues:[['الدايرة', 'سويتش باب الحماية الجديد متوصّل وهو مفتوح، والسيفتي ريلاي مش بيدّي الإشارتين.']], o:['دايرة الـ STO مفتوحة (باب أو سيفتي ريلاي)', 'الموتور بايظ', 'الجير', 'الإنكودر'], a:0, why:'الـ STO بيقطع العزم بالهاردوير عشان أمان الناس. صلّح الدايرة، ومتعملش جمبر عليها في مكنة شغّالة.'},
  {t:'الموتور بيزن وهو واقف', s:'ركّبوا ترابيزة أتقل على المحور. من ساعتها الموتور بيصفّر/يزن وهو واقف، والمحور بيترعش.', clues:[['الباراميترات', 'الجين عالي ومتظبط على الترابيزة القديمة الخفيفة، ونسبة الـ Inertia متغيّرتش.']], o:['محتاج تيونينج من جديد للحمل الجديد', 'الإنكودر', 'Overvoltage', 'STO'], a:0, why:'أي تغيير في الحمل محتاج Auto-tune تاني (وممكن Notch filter للرنين).'},
  {t:'المحور بيزحف شوية كل ساعة', s:'وضع النبضات من PLC. المحور بيبعد عن مكانه حوالي 0.2 mm كل ساعة، ومن غير أي إنذار.', clues:[['الكابل', 'كابل النبضات Open collector طوله 25 متر وماشي جنب كابلات انفرترات.'], ['التجربة', 'لما الانفرترات تقف، الزحف بيختفي.']], o:['نويز على كابل النبضات بيزوّد نبضات', 'الجين', 'الفرامل', 'الجير'], a:0, why:'النويز بيعمل نبضات زيادة. استخدم Line driver وكابل مشيلد مجدول وبعيد عن كابلات القوى.'},
  {t:'المكنة خبطت بعد انقطاع الكهربا', s:'بعد انقطاع الكهربا، الأوبريتور شغّل المكنة على طول، والمحور خبط في آخر المشوار.', clues:[['الإنكودر', 'إنكريمنتال، والبرنامج مش بيجبر هومينج بعد رجوع الكهربا.']], o:['المكان ضاع ومفيش هومينج', 'Overvoltage', 'الجين', 'الفرامل'], a:0, why:'الإنكريمنتال بيبدأ من صفر. لازم البرنامج يمنع الحركة لحد الهومينج، أو تستخدم أبسليوت.'},
  {t:'مش راضي يتحرك موجب', s:'المحور بيتحرك سالب عادي، بس الموجب ممنوع والدرايف عارض <b>Forward limit</b>. المحور في النص خالص.', clues:[['الحساس', 'لمبة الـ +LS على الكارت مطفية. الليميت NC.'], ['الكابل', 'الكابل متقطّع عند السلسلة.']], o:['سلك الليميت NC مقطوع', 'الإنكودر', 'الجين', 'الجير'], a:0, why:'NC مقطوع = الدرايف شايفه متضرب. ده تصميم آمن، صلّح السلك.'}
];

})();
