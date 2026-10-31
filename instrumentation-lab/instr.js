/* كورس الإنسترومنتيشن: shared engine for the hub and the 10 lessons.
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
  const upd = () => { const d = isDark(); b.textContent = d ? '☀' : '☾'; b.setAttribute('aria-label', d ? 'الوضع الفاتح' : 'الوضع الغامق'); b.title = b.getAttribute('aria-label'); };
  b.addEventListener('click', () => { IL.store.set('theme', isDark() ? 'light' : 'dark'); applyTheme(); upd(); });
  upd(); return b;
}

/* ---------------- course map ---------------- */
IL.COURSE = [
  {id:'l1', n:1, file:'lesson-01.html', title:'يعني إيه إنسترومنتيشن؟', sub:'اللوب: حساس، ترانسميتر، كنترولر، وصمّام. PV و SP والرينج، وقراءة التاجات TT-101',
    tasks:[['loop','لوب التسخين'],['tags','فك التاجات'],['quiz','أسئلة الدرس']]},
  {id:'l2', n:2, file:'lesson-02.html', title:'الإشارات الأنالوج ⁦4⁠–⁠20mA⁩ و ⁦0⁠–⁠10V⁩', sub:'ليه 4 مش صفر، ترانسميتر 2 و 3 و 4 سلك، التحويل للقيمة، وقياس التيار في اللوب',
    tasks:[['sim','محاكي اللوب والأعطال'],['scale','تمرين التحويل'],['quiz','أسئلة الدرس']]},
  {id:'l3', n:3, file:'lesson-03.html', title:'الحساسات الديجيتال', sub:'بروكسيميتي وفوتوسيل وليميت سويتش، NO/NC، و PNP و NPN مع كارت الـ PLC',
    tasks:[['pnp','توصيل PNP'],['npn','توصيل NPN'],['quiz','أسئلة الدرس']]},
  {id:'l4', n:4, file:'lesson-04.html', title:'الإنكودر ١: الإنكريمنتال', sub:'القرص والقنوات A و B و Z، الاتجاه، PPR، العدّ x1/x2/x4، السرعة، وأنواع الخرج',
    tasks:[['enc','تجربة الإنكودر'],['edrill','تمرين الاتجاه والتردد'],['quiz','أسئلة الدرس']]},
  {id:'l5', n:5, file:'lesson-05.html', title:'الإنكودر ٢: الأبسليوت والتركيب والأعطال', sub:'Gray code، سنجل ومالتي تيرن، SSI و Profinet، التركيب والشيلد، ولعبة الأعطال',
    tasks:[['gray','قرص الـ Gray code'],['efault','لعبة أعطال الإنكودر'],['quiz','أسئلة الدرس']]},
  {id:'l6', n:6, file:'lesson-06.html', title:'حساسات الحرارة ١: الثيرموكبل', sub:'أنواع K و J و T و S، تعويض الطرف البارد CJC، كابل التعويض، الألوان، والأعطال',
    tasks:[['tc','بنش الثيرموكبل'],['tcdrill','تمرين mV ← درجة'],['quiz','أسئلة الدرس']]},
  {id:'l7', n:7, file:'lesson-07.html', title:'حساسات الحرارة ٢: PT100 و RTD و NTC', sub:'100 أوم على صفر، 2 و 3 و 4 سلك وغلطة السلك، الترانسميتر، و NTC و PTC',
    tasks:[['rtd','بنش الـ PT100'],['ptdrill','تمرين أوم ← درجة'],['quiz','أسئلة الدرس']]},
  {id:'l8', n:8, file:'lesson-08.html', title:'اللود سيل (Load Cell) والميزان', sub:'الإسترين جيدج والقنطرة، mV/V، 4 و 6 سلك، معايرة الميزان، وتشخيص اللود سيل بالأفوميتر',
    tasks:[['lc','بنش اللود سيل'],['cal','معايرة الإنديكيتور'],['lcdiag','تشخيص الأعطال'],['quiz','أسئلة الدرس']]},
  {id:'l9', n:9, file:'lesson-09.html', title:'الضغط والمستوى والفلو', sub:'ترانسميتر الضغط و DP، المستوى بالضغط والرادار، والفلو ماجنتيك وفورتكس وكوريوليس',
    tasks:[['lvl','تانك المستوى'],['pick','اختار الجهاز الصح'],['quiz','أسئلة الدرس']]},
  {id:'l10', n:10, file:'lesson-10.html', title:'المعايرة والتربل شوتنج + الامتحان النهائي', sub:'لوب تشيك، جدول As-found / As-left، الكاليبريتور، لعبة أعطال الموقع، والامتحان النهائي',
    tasks:[['caltab','معايرة 5 نقط'],['fgame','لعبة أعطال الموقع'],['quiz','أسئلة الدرس'],['final','الامتحان النهائي']]}
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

/* ---------------- drill: a stream of generated questions ----------------
   gen() → {q (html), o:[...] , a:index, why}  or  {q, input:true, unit, check(v)→bool, ans (text), why}
   need: correct answers to finish the task */
IL.drill = function(host, gen, opt){
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
      const oi = qzOrder(cur.o, cur.keep);
      card.innerHTML = `<div class="dr-q">${cur.q}</div><div class="qz-a${cur.row ? ' row' : ''}">${oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${qzTxt(cur.o[i])}</button>`).join('')}</div>${QZ_CF()}<p class="qz-f" aria-live="polite"></p>`;
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
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg viewBox="0 0 360 270" role="img" aria-label="تانك ميّة بيتسخّن ببخار: حساس حرارة، كنترولر، وصمّام بخار">${ART.defs(g)}
   <defs><linearGradient id="${g}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb0f0"/><stop offset="1" stop-color="#2a74c0"/></linearGradient></defs>
   <rect x="30" y="70" width="150" height="170" rx="14" fill="url(#${g}mh)" stroke="#5d6469" stroke-width="1.5"/>
   <rect x="38" y="96" width="134" height="136" rx="8" class="hl-water" fill="url(#${g}w)"/>
   <path class="hl-coil" d="M50 214q10-14 20 0t20 0 20 0 20 0 20 0 20 0" fill="none" stroke="#c0352b" stroke-width="5" stroke-linecap="round"/>
   <g class="hl-bub"></g>
   <path d="M150 214H200V250H340" fill="none" stroke="#7f8a92" stroke-width="6"/><text x="300" y="266" class="svg-ar w-mu" style="font-size:10px" text-anchor="middle">بخار داخل</text>
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
   <text x="105" y="60" text-anchor="middle" class="svg-ar w-tx" style="font-size:12px;font-weight:700">تانك ميّة</text>
   <g class="hl-cold" opacity="0"><path d="M10 40H60V80" fill="none" stroke="var(--cold)" stroke-width="6"/><text x="12" y="32" class="svg-ar" style="font-size:10px;fill:var(--cold);font-weight:700">ميّة باردة</text></g>
  </svg></div>
  <div class="mm-side">
   <div class="read"><div><span>PV (الحرارة الفعلية)</span><b class="hl-pv">0</b></div><div><span>SP (المطلوب)</span><b class="hl-sp">0</b></div><div><span>OUT (فتحة الصمّام)</span><b class="hl-out">0</b></div><div><span>إشارة TT-101</span><b class="hl-ma">0</b></div></div>
   <div class="wd-ctl"><label>SP المطلوب: <b class="hl-spv"></b><input type="range" class="hl-sps" min="30" max="95" step="1" value="50" aria-label="نقطة الضبط SP"></label>
   <button type="button" class="btn hl-am" aria-pressed="false">حوّل لـ Manual</button><button type="button" class="btn hl-dis">افتح ميّة باردة (اضطراب)</button>
   <label class="hl-manl" hidden>فتحة الصمّام يدوي: <b class="hl-manv"></b><input type="range" class="hl-man" min="0" max="100" step="1" value="30" aria-label="فتحة الصمّام يدوي"></label></div>
  </div></div>
  <div class="wd-art"><svg class="hl-tr" viewBox="0 0 360 130" role="img" aria-label="رسم بياني: PV و SP و OUT مع الوقت"></svg></div>
  <p class="msg hl-msg" aria-live="polite"></p>
  <p class="chal hl-chal">التحدّي: غيّر الـ SP بـ 10 درجات على الأقل (مثلًا لـ 70) وسيب الكنترولر على <b>AUTO</b> لحد ما الـ PV يستقر عند الـ SP (±1 °C).</p>`;
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
    if (S.auto && Math.abs(S.sp - S.sp0) >= 10 && Math.abs(S.pv - S.sp) <= 1 && S.dist <= 0){ S.ok += dt * 8; if (S.ok > 16 && !IL.has(L, 'loop')){ fin(); msg('ممتاز! الكنترولر غيّر فتحة الصمّام لوحده لحد ما الحرارة وصلت للـ SP واستقرت. ده لوب مقفول (Closed loop).', 'ok'); } } else S.ok = 0;
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
      <text x="${X0 + 4}" y="124" style="font-size:9px"><tspan fill="var(--bad)">━ PV °C</tspan>   <tspan fill="var(--good)">┅ SP °C</tspan>   <tspan fill="var(--cur)">━ OUT %</tspan></text><text x="${X1}" y="124" text-anchor="end" class="svg-ar w-mu" style="font-size:9px">آخر دقيقتين</text>`;
  }
  let tick = 0;
  function ui(){
    const mA = C.pv2mA(S.pv, LRV, URV);
    q('.hl-pv').textContent = fmt(S.pv, 1) + ' °C'; q('.hl-sp').textContent = S.sp + ' °C'; q('.hl-out').textContent = fmt(S.out, 0) + ' %'; q('.hl-ma').textContent = fmt(mA, 2) + ' mA';
    q('.hl-dpv').textContent = fmt(S.pv, 1); q('.hl-dsp').textContent = fmt(S.sp, 1); q('.hl-dout').textContent = fmt(S.out, 0) + '%';
    q('.hl-mode').textContent = S.auto ? 'AUTO' : 'MAN'; q('.hl-spv').textContent = S.sp + ' °C'; q('.hl-manv').textContent = S.man + ' %';
    const am = q('.hl-am'); am.textContent = S.auto ? 'حوّل لـ Manual' : 'رجّع لـ Auto'; am.setAttribute('aria-pressed', String(!S.auto)); q('.hl-manl').hidden = S.auto;
    q('.hl-vpos').setAttribute('width', (S.valve / 100 * 22).toFixed(1));
    const hot = clamp((S.pv - 25) / 70, 0, 1); q('.hl-water').style.fill = `rgb(${Math.round(60 + 170 * hot)},${Math.round(140 - 60 * hot)},${Math.round(220 - 150 * hot)})`;
    q('.hl-coil').style.opacity = 0.3 + S.valve / 140; q('.hl-cold').setAttribute('opacity', S.dist > 0 ? 1 : 0);
    q('.hl-bub').innerHTML = S.pv > 70 && !reduced() ? [60, 95, 130, 155].map((x, i) => `<circle cx="${x}" cy="${110 + ((S.t * 12 + i * 23) % 90)}" r="${2 + (i % 2)}" fill="#fff" opacity=".55"/>`).join('') : '';
    if (++tick % 3 === 0 || !S.hist.length) trend();
    if (!S.auto && !q('.hl-msg').classList.contains('ok')) msg('إنت دلوقتي على <b>Manual</b>: الكنترولر مش بيبص على الـ PV، والصمّام ثابت على اللي إنت حاطّه. اللوب كده <b>مفتوح</b> (Open loop).');
    else if (S.dist > 0) msg('ميّة باردة داخلة التانك: الحرارة بتنزل، والكنترولر بيفتح الصمّام أكتر عشان يعوّض.');
    else if (!q('.hl-msg').classList.contains('ok')) msg(Math.abs(S.pv - S.sp) > 1 ? `الفرق (Error) = SP − PV = <b class="eq">${fmt(S.sp - S.pv, 1)} °C</b>. الكنترولر بيحرّك الصمّام على حسبه.` : 'الـ PV على الـ SP والصمّام ثابت على الفتحة اللي بتعوّض الفقد في الحرارة.');
  }
  for (let k = 0; k < 60; k++){ step(0.25); if (k % 2) S.hist.push([S.pv, S.sp, S.out]); }
  ui(); trend();
  animate(host, frame);
  return {S, setSP(v){ sps.value = v; sps.dispatchEvent(new Event('input')); }, run(sec){ for (let t = 0; t < sec; t++) frame(1 / 8); }};
};

/* ================= L1: P&ID tag decoder ================= */
IL.TAGS = [
  ['TT', 'ترانسميتر حرارة (Temperature Transmitter)'], ['TE', 'عنصر حرارة: الحساس نفسه زي الثيرموكبل أو PT100 (Temperature Element)'], ['TI', 'بيان حرارة محلي (Temperature Indicator)'],
  ['TIC', 'كنترولر حرارة ليه شاشة (Temperature Indicating Controller)'], ['TSH', 'سويتش حرارة عالية (Temperature Switch High)'],
  ['PT', 'ترانسميتر ضغط (Pressure Transmitter)'], ['PI', 'مانومتر/بيان ضغط محلي (Pressure Indicator)'], ['PIC', 'كنترولر ضغط (Pressure Indicating Controller)'], ['PSL', 'سويتش ضغط واطي (Pressure Switch Low)'], ['PDT', 'ترانسميتر فرق ضغط (Differential Pressure Transmitter)'],
  ['FT', 'ترانسميتر فلو/تدفّق (Flow Transmitter)'], ['FE', 'عنصر الفلو: الأوريفيس أو الحساس (Flow Element)'], ['FIC', 'كنترولر فلو (Flow Indicating Controller)'], ['FV', 'صمّام تحكم في الفلو (Flow Valve)'],
  ['LT', 'ترانسميتر مستوى (Level Transmitter)'], ['LSH', 'سويتش مستوى عالي (Level Switch High)'], ['LSL', 'سويتش مستوى واطي (Level Switch Low)'], ['LIC', 'كنترولر مستوى (Level Indicating Controller)'], ['LAH', 'إنذار مستوى عالي (Level Alarm High)'],
  ['WT', 'ترانسميتر وزن: لود سيل وإنديكيتور (Weight Transmitter)'], ['ST', 'ترانسميتر سرعة (Speed Transmitter)'], ['ZT', 'ترانسميتر مكان/وضع (Position Transmitter)'], ['TV', 'صمّام تحكم في الحرارة (Temperature Valve)']
];
IL.tagGen = function(){
  const [tag, mean] = pick(IL.TAGS), n = 100 + Math.floor(Math.random() * 400);
  const others = shuffle(IL.TAGS.filter(t => t[0] !== tag && (t[0][0] === tag[0] || t[0].slice(1) === tag.slice(1)))).slice(0, 3);
  while (others.length < 3){ const t = pick(IL.TAGS); if (t[0] !== tag && !others.includes(t)) others.push(t); }
  return {q:`الجهاز ده مكتوب عليه في الرسم: <div class="tags-row" style="margin-top:6px"><span class="tag-b">${tag}<br>${n}</span></div>يعني إيه؟`, o:[mean].concat(others.map(t => t[1])), a:0,
    why:`الحرف الأول <b>${tag[0]}</b> = ${({T:'الحرارة', P:'الضغط', F:'الفلو', L:'المستوى', W:'الوزن', S:'السرعة', Z:'المكان'})[tag[0]]}، والباقي = الوظيفة. والرقم ${n} رقم اللوب.`};
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
  const FAULTS = [['cut', 'اقطع سلك'], ['short', 'قصر في الكابل'], ['rev', 'اعكس القطبية'], ['fail', 'ترانسميتر بايظ']];
  host.innerHTML = `<div class="wd-art"><svg viewBox="0 0 360 300" role="img" aria-label="لوب ⁦4⁠–⁠20⁩ مللي: باور سبلاي 24 فولت، ترانسميتر ضغط، أفوميتر، وكارت PLC أنالوج">${ART.defs(g)}
    <g class="ls-w"></g>
    <g transform="translate(6 96)"><rect x="0" y="0" width="68" height="104" rx="5" fill="#d7dde1" stroke="#5d6469" stroke-width="1.2"/><rect x="6" y="6" width="56" height="12" rx="2" fill="#3a4248"/>${screw(20, 12, 3.5)}${screw(48, 12, 3.5)}<rect x="6" y="86" width="56" height="12" rx="2" fill="#3a4248"/>${screw(20, 92, 3.5)}${screw(48, 92, 3.5)}
      <text x="34" y="44" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#1c2125" class="ls-vs">24V DC</text><text x="34" y="56" text-anchor="middle" style="font:600 7px var(--font-mono);fill:#3d464c">PSU</text><circle cx="16" cy="70" r="3" fill="#35d06a"/><text x="23" y="73" style="font:600 6.5px var(--font-mono);fill:#3d464c">DC OK</text>
      <text x="56" y="30" style="font:700 9px var(--font-mono);fill:#c0352b">+</text><text x="56" y="82" style="font:700 9px var(--font-mono);fill:#1f6fd1">−</text></g>
    <g transform="translate(232 0) scale(.62)">${ART.transmitter({g, lcd:'', unit:''})}</g>
    <text class="ls-lcd" x="269" y="27" text-anchor="middle" style="font:700 8px var(--font-mono);fill:#16210c">5.00</text><text x="269" y="34" text-anchor="middle" style="font:600 5px var(--font-mono);fill:#16210c">bar</text>
    <text x="226" y="46" text-anchor="end" style="font:700 10px var(--font-mono)" class="w-tx">PT-101</text><text x="226" y="58" text-anchor="end" style="font-size:9px" class="svg-ar w-mu">⁦0⁠–⁠10 bar⁩ · 2 سلك</text>
    <g transform="translate(130 222)"><rect x="0" y="0" width="100" height="70" rx="6" fill="url(#${g}d)" stroke="#111"/><text x="50" y="13" text-anchor="middle" style="font:700 8px var(--font-mono);fill:#e9edf0">PLC AI · CH0</text>
      <path d="M20 40h12l3-6 5 12 5-12 5 12 5-12 5 12 3-6h12" fill="none" stroke="#e9edf0" stroke-width="1.4"/><text x="50" y="62" text-anchor="middle" style="font:600 7px var(--font-mono);fill:#93a2ab">250 Ω</text>
      <circle class="ls-led" cx="88" cy="12" r="3.2" fill="#35d06a"/></g>
    <g class="ls-meter"></g>
    <g class="ls-flt"></g>
  </svg></div>
  <div class="read ls-read"></div>
  <div class="statline ls-st" aria-live="polite"></div>
  <div class="wd-ctl"><label>الضغط الحقيقي في الماسورة: <b class="ls-pv"></b><input type="range" class="ls-p" min="-1" max="11.5" step="0.05" value="5" aria-label="الضغط"></label></div>
  <div class="chips-t"><button type="button" class="btn" data-vs="24" aria-pressed="true">باور 24V</button><button type="button" class="btn" data-vs="12" aria-pressed="false">باور 12V</button><button type="button" class="btn" data-mt="series" aria-pressed="true">الأفوميتر توالي ✓</button><button type="button" class="btn" data-mt="par" aria-pressed="false">الأفوميتر توازي ✗</button></div>
  <div class="flt" role="group" aria-label="أعطال">${FAULTS.map(f => `<button type="button" class="btn" data-f="${f[0]}" aria-pressed="false">${f[1]}</button>`).join('')}</div>
  <p class="msg ls-msg" aria-live="polite"></p>
  <p class="chal ls-chal">التحدّي: جرّب الأعطال التلاتة <b>اقطع سلك</b> و<b>قصر في الكابل</b> و<b>اعكس القطبية</b> وشوف التيار والـ PLC بيقولوا إيه في كل واحد.</p>`;
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
    if (S.fault === 'short') s += `<path d="M200 21V70L208 76L200 82L208 88L200 94L208 100L200 106V118H348" fill="none" stroke="#ffb000" stroke-width="3"/><text x="194" y="100" text-anchor="end" class="svg-ar" style="font-size:10px;font-weight:700;fill:var(--warn)">قصر في الكابل</text>`;
    if (rev) s += `<text x="190" y="14" text-anchor="middle" class="svg-ar" style="font-size:10px;font-weight:700;fill:var(--bad)">+ و − معكوسين</text>`;
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
    q('.ls-read').innerHTML = `<div><span>الأفوميتر (mA)</span><b>${fmt(r.I, 2)} mA</b></div><div><span>قراية الـ PLC</span>${plc}</div><div><span>Raw في الـ PLC</span><b>${r.raw}</b></div><div><span>جهد على 250Ω</span><b>${fmt(r.vR, 2)} V</b></div><div><span>نسبة من الرينج</span><b>${fmt(C.mA2pct(r.I), 1)} %</b></div><div><span>جهد على الترانسميتر</span><b class="${r.vTx < 10.5 && r.how === 'lowv' ? 'bad' : ''}">${fmt(r.vTx, 1)} V</b></div>`;
    const led = q('.ls-led'); led.setAttribute('fill', r.st === 'ok' ? '#35d06a' : '#ff3b30');
    const st = q('.ls-st'), stat = {ok:['ok', 'الإشارة سليمة (⁦3.8⁠–⁠20.5 mA⁩)'], under:['warn', 'تحت الرينج (⁦3.6⁠–⁠3.8 mA⁩)'], over:['warn', 'فوق الرينج (⁦20.5⁠–⁠21 mA⁩)'], 'fail-low':['bad', 'أقل من 3.6 mA: عطل / سلك مقطوع'], 'fail-high':['bad', 'أكتر من 21 mA: عطل / قصر']}[r.st];
    st.className = 'statline ls-st ' + stat[0]; st.innerHTML = `<b>NAMUR NE43:</b> ${stat[1]}`;
    const M = {
      ok:`الضغط ${fmt(S.p, 2)} bar ⇐ <span class="eq">4 + ${fmt(S.p, 2)}/10 × 16 = ${fmt(r.I, 2)} mA</span>. نفس التيار ده ماشي في كل حتة في اللوب، فالأفوميتر في أي مكان على التوالي هيقرا نفس الرقم.`,
      cut:'<b>السلك مقطوع ⇐ 0 mA.</b> مفيش دايرة، فمفيش تيار. الـ PLC شايف أقل من 3.6 mA فبيقول <b>Wire break</b>. ولو كانت الإشارة ⁦0⁠–⁠20 mA⁩ كان هيفتكرها "ضغط صفر" ومش هيعرف إن فيه عطل. ده سر الـ 4 mA!',
      rev:'<b>القطبية معكوسة ⇐ 0 mA.</b> أغلب الترانسميترات جواها دايود حماية بيمنع التيار لو اتعكست، فالجهاز مش بيتحرق بس اللوب ميّت والـ PLC بيقول Wire break. افحص الجهد على أطراف الترانسميتر: هتلاقيه <b>−24V</b>.',
      short:'<b>قصر بين السلكين ⇐ التيار بيعلى جدًا</b> لأن الترانسميتر اتشال من الدايرة والباور واقف على الـ 250Ω بس (24 ÷ 250 = 96 mA!). الحماية في الكارت أو الفيوز بتحدّه، والـ PLC بيقول <b>Overrange</b>. القراية مش بتتحرك مع الضغط.',
      fail:'<b>الترانسميتر عمل تشخيص داخلي واكتشف عطل</b> (حساس بايظ مثلًا)، فبيطلّع تيار إنذار <b>21.75 mA</b> (Fail high) على حسب NAMUR. بعض الأجهزة بتتظبط على Fail low (3.6 mA). الـ PLC يعرف إنه عطل مش قراية.',
      par:'<b>غلط! الأفوميتر على mA مقاومته صغيرة جدًا</b>، فلما تحطه على التوازي مع الترانسميتر بيعمل قصر عليه. التيار يعلى، والـ PLC يشوف Overrange، والقراية مش بتتحرك مع الضغط، وممكن فيوز الأفوميتر يضرب. <b>قياس الـ mA لازم توالي</b>: افتح اللوب ودخّل الأفوميتر في السكة.',
      lowv:`<b>الجهد مش مكفي!</b> الترانسميتر محتاج حوالي <b>10.5V</b> على أطرافه عشان يشتغل. على 12V ومع 250Ω + الأفوميتر، أقصى تيار = <span class="eq">(12 − 10.5) ÷ 260 ≈ 5.8 mA</span>. عشان كده القراية "واقفة" مش بتعلى. ده عطل حقيقي بيحصل لما حد يحط باور ضعيف أو يزوّد مقاومة في اللوب (HART أو بيان تاني).`
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
IL.RANGES = [[0, 10, 'bar', 'ضغط'], [0, 16, 'bar', 'ضغط'], [-1, 9, 'bar', 'ضغط'], [0, 150, '°C', 'حرارة'], [-50, 150, '°C', 'حرارة'], [0, 400, '°C', 'حرارة'], [0, 4, 'm', 'مستوى'], [0, 600, 'kg', 'وزن'], [0, 250, 'm³/h', 'فلو'], [0, 1500, 'rpm', 'سرعة']];
IL.scaleGen = function(){
  const [lrv, urv, u, what] = pick(IL.RANGES), span = urv - lrv;
  if (Math.random() < 0.5){
    const mA = Math.round((4 + Math.random() * 16) * 4) / 4, pv = C.mA2pv(mA, lrv, urv);
    return {input:true, unit:u, q:`ترانسميتر ${what} رينجه <span class="eq">${lrv} … ${urv} ${u}</span>. الأفوميتر بيقرا <b class="eq">${fmt(mA, 2)} mA</b>. القيمة كام؟`, check:v => Math.abs(v - pv) <= span * 0.006, ans:fmt(pv, 2) + ' ' + u, why:`<span class="eq">PV = ${lrv} + (${fmt(mA, 2)} − 4) ÷ 16 × ${span} = ${fmt(pv, 2)}</span>`};
  }
  const pv = lrv + Math.round(Math.random() * 20) / 20 * span, mA = C.pv2mA(pv, lrv, urv);
  return {input:true, unit:'mA', q:`ترانسميتر ${what} رينجه <span class="eq">${lrv} … ${urv} ${u}</span>. القيمة الحقيقية <b class="eq">${fmt(pv, 2)} ${u}</b>. الخرج المفروض كام mA؟`, check:v => Math.abs(v - mA) <= 0.06, ans:fmt(mA, 2) + ' mA', why:`<span class="eq">mA = 4 + (${fmt(pv, 2)} − ${lrv}) ÷ ${span} × 16 = ${fmt(mA, 2)}</span>`};
};
IL.scaleCalc = function(host){
  host.innerHTML = `<div class="wd-ctl"><label style="flex:1 1 30%">LRV <input type="number" class="sc-l" value="0" step="any"></label><label style="flex:1 1 30%">URV <input type="number" class="sc-u" value="10" step="any"></label></div>
  <div class="wd-ctl"><label style="flex:1 1 45%">mA <input type="number" class="sc-m" value="12" step="any"></label><label style="flex:1 1 45%">القيمة PV <input type="number" class="sc-p" value="5" step="any"></label></div><p class="msg sc-msg" aria-live="polite"></p>`;
  const q = s => $(s, host);
  function from(which){
    const l = num(q('.sc-l').value), u = num(q('.sc-u').value);
    if (!isFinite(l) || !isFinite(u) || u === l){ q('.sc-msg').textContent = 'اكتب LRV و URV صح.'; return; }
    if (which === 'm'){ const m = num(q('.sc-m').value); if (isFinite(m)) q('.sc-p').value = +fmt(C.mA2pv(m, l, u), 3); }
    else { const p = num(q('.sc-p').value); if (isFinite(p)) q('.sc-m').value = +fmt(C.pv2mA(p, l, u), 3); }
    const m = num(q('.sc-m').value); q('.sc-msg').innerHTML = `نسبة من الرينج: <b class="eq">${fmt(C.mA2pct(m), 1)} %</b> · جهد على 250Ω: <b class="eq">${fmt(m * 0.25, 2)} V</b> · NAMUR: <b class="eq">${C.namur(m)}</b>`;
  }
  host.addEventListener('input', e => from(e.target.classList.contains('sc-p') ? 'p' : 'm'));
  from('m');
};

/* ================= L3: 3-wire PNP / NPN sensor → PLC input bench ================= */
C.MAT = {steel:[1, 'حديد (Steel 37)'], ss:[0.75, 'ستانلس ستيل'], brass:[0.5, 'نحاس أصفر'], al:[0.4, 'ألومنيوم'], cu:[0.3, 'نحاس أحمر'], plastic:[0, 'بلاستيك']};
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
C.diCheck = function(wires, sensor, card){ // one short, specific message per problem; hl = terminals to pulse
  const a = C.diEval(wires, sensor, card, true), b = C.diEval(wires, sensor, card, false), bad = [], hls = [], B = (t, h) => { bad.push(t); hls.push(h || []); };
  if (a.short) return {pass:false, bad:['<b>قصر:</b> +24V و 0V متوصلين ببعض.'], hl:['P', 'N']};
  if (a.reversed) B('<b>الحساس بالعكس:</b> البني على +24V والأزرق على 0V.', ['BN', 'BU']);
  else if (!a.powered) B('الحساس مش واخد باور: <b>BN</b> على +24V و <b>BU</b> على 0V.', ['BN', 'BU']);
  if (a.outShort) B(`<b>قصر على الخرج:</b> BK ${sensor === 'PNP' ? 'متوصل على 0V' : 'متوصل على +24V'}.`, ['BK']);
  const wantCom = card === 'sink' ? 'N' : 'P';
  if (!a.net.comP && !a.net.comN) B(`طرف <b>COM</b> في الكارت مش متوصل: يروح على <b>${wantCom === 'N' ? '0V' : '+24V'}</b>.`, ['COM']);
  else if ((wantCom === 'N' && a.net.comP) || (wantCom === 'P' && a.net.comN)) B(`الـ COM على ${a.net.comP ? '+24V' : '0V'} والمفروض <b>${wantCom === 'N' ? '0V' : '+24V'}</b>.`, ['COM']);
  if (a.net.i0P || a.net.i0N) B('<b>I0.0</b> على الباور مباشرة: لازم ياخد من <b>BK</b>.', ['I0']);
  else if (!a.net.bkOnI0) B('السلك <b>BK</b> مش رايح على <b>I0.0</b>.', ['BK', 'I0']);
  if (!bad.length && !(a.led && !b.led)) B(sensor === 'PNP' && card === 'source' ? '<b>PNP</b> مع كارت Sourcing مش هينوّر: PNP مع Sinking بس.' : 'لمبة I0.0 مش بتتبع الحساس.', ['I0']);
  return {pass:!bad.length, bad, hl:hls[0] || [], on:a, off:b};
};
IL.diBench = function(host, opt){
  const L = opt.lesson, g = U('di');
  const S = {ex:0, wires:[], pend:null, d:14, mat:'steel', det:false};
  const ex = () => opt.exercises[S.ex];
  const T = {P:[48, 66, '+24V'], N:[98, 66, '0V'], COM:[262, 172, 'COM'], I0:[262, 92, 'I0.0'], I1:[262, 128, 'I0.1'], BN:[200, 214, 'BN'], BK:[236, 214, 'BK'], BU:[164, 214, 'BU']};
  const COL = {BN:'#7a4a22', BU:'#1f6fd1', BK:'#1d1d1d', P:'#d32f2f', N:'#1f6fd1'};
  const load = () => { const w = IL.store.get('di/' + ex().key); S.wires = Array.isArray(w) ? w.filter(x => Array.isArray(x) && T[x[0]] && T[x[1]]) : []; };
  const save = () => IL.store.set('di/' + ex().key, S.wires);
  host.innerHTML = `<div class="tabs" role="group" aria-label="التمرين">${opt.exercises.map((e, i) => `<button type="button" class="btn" data-ex="${i}" aria-pressed="false">${e.title}</button>`).join('')}</div>
  <div class="box key di-task"></div>
  <div class="bn-board"><svg viewBox="0 0 360 330" role="group" aria-label="بنش توصيل حساس بكارت دخل PLC">${ART.defs(g)}
   ${window.RA ? RA.psu(10, 8, 130, 74) : `<g transform="translate(10 8)"><rect x="0" y="0" width="130" height="74" rx="6" fill="#d7dde1" stroke="#5d6469" stroke-width="1.2"/><text x="65" y="20" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#1c2125">24V DC PSU</text><circle cx="118" cy="14" r="3" fill="#35d06a"/></g>`}
   <g transform="translate(244 8)"><rect x="0" y="0" width="108" height="186" rx="6" fill="url(#${g}d)" stroke="#111"/><rect x="6" y="6" width="96" height="20" rx="3" fill="#e9edf0"/><text x="54" y="20" text-anchor="middle" style="font:700 8.5px var(--font-mono);fill:#1c2125" class="di-cardt">DI 24V DC</text>
     <text x="40" y="52" style="font:600 8px var(--font-mono);fill:#c9d1d6">LED</text><circle class="di-led0" cx="80" cy="84" r="6" fill="#24402c"/><circle class="di-led1" cx="80" cy="120" r="6" fill="#24402c"/><text x="70" y="62" style="font:600 7px var(--font-mono);fill:#93a2ab" class="di-cardk"></text></g>
   <g class="di-sens"></g><g class="di-tgt"></g>
   <g class="di-w"></g><g class="di-t"></g>
  </svg></div>
  <div class="bn-tools"><button type="button" class="btn" data-b="undo">تراجع</button><button type="button" class="btn" data-b="clr">امسح الكل</button><button type="button" class="btn pri" data-b="chk">اختبر التوصيل</button></div>
  <p class="msg di-msg" aria-live="polite">دوس على طرف، وبعدين على الطرف التاني عشان تحط سلك. دوس على السلك عشان تشيله.</p>
  <div class="wd-ctl"><label>المسافة بين الحديدة ووش الحساس: <b class="di-dv"></b><input type="range" class="di-d" min="0" max="20" step="0.5" value="14" aria-label="المسافة بالمللي"></label>
   <label style="flex:1 1 100%">الخامة: <select class="inp di-mat">${Object.keys(C.MAT).map(k => `<option value="${k}">${C.MAT[k][1]}</option>`).join('')}</select></label></div>
  <div class="read sm"><div><span>مسافة الإحساس Sn الفعلية</span><b class="di-sn"></b></div><div><span>الحساس شايف؟</span><b class="di-det"></b></div><div><span>جهد السلك الأسود BK</span><b class="di-vbk"></b></div><div><span>لمبة الدخل I0.0</span><b class="di-l"></b></div></div>
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
    q('.di-w').innerHTML = S.wires.map((w, i) => { const a = T[w[0]], b = T[w[1]], c = COL[w[0]] || COL[w[1]] || (w.includes('COM') ? '#7a3fb0' : '#444'); const my = Math.max(a[1], b[1]) + 30; const d = `M${a[0]} ${a[1]}C${a[0]} ${my} ${b[0]} ${my} ${b[0]} ${b[1]}`; return `<g class="bw" data-w="${i}"><path class="bw-o" d="${d}"/><path class="bw-c" d="${d}" stroke="${c}"/><path class="bw-hit" d="${d}" tabindex="0" role="button" aria-label="شيل السلك من ${a[2]} لـ ${b[2]}"/></g>`; }).join('');
    q('.di-t').innerHTML = Object.keys(T).map(k => { const [x, y, lab] = T[k]; const pend = S.pend === k; return `<g class="bt${pend ? ' pend' : ''}"><circle class="bt-s" cx="${x}" cy="${y}" r="8"/><path class="bt-x" d="M${x - 4} ${y}h8"/><circle class="bt-hit" data-t="${k}" cx="${x}" cy="${y}" r="16" tabindex="0" role="button" aria-label="طرف ${lab}"/><circle class="bt-ring${err && err.t.has(k) ? ' err' : ''}" cx="${x}" cy="${y}" r="12"/><text class="bt-lab" x="${x}" y="${['BN', 'BK', 'BU'].includes(k) ? y + 24 : (k === 'P' || k === 'N') ? y - 14 : y + 4}" ${['COM', 'I0', 'I1'].includes(k) ? `text-anchor="end" dx="-14"` : ''}>${lab}</text></g>`; }).join('');
    q('.di-led0').setAttribute('fill', r.led ? '#3dff6e' : '#24402c'); q('.di-led0').style.filter = r.led ? 'drop-shadow(0 0 5px #3dff6e)' : '';
    q('.di-led1').setAttribute('fill', r.I1 ? '#3dff6e' : '#24402c');
    q('.di-cardt').textContent = e.card === 'sink' ? 'DI · SINK (PNP)' : 'DI · SOURCE (NPN)';
    q('.di-cardk').textContent = e.card === 'sink' ? 'COM → 0V' : 'COM → +24V';
    q('.di-dv').textContent = fmt(S.d, 1) + ' mm'; q('.di-sn').textContent = snEff() ? fmt(snEff(), 1) + ' mm' : 'مش بيحس بيه';
    q('.di-det').textContent = S.det ? 'أيوه' : 'لأ'; q('.di-det').classList.toggle('ok', S.det);
    const bk = r.out && !r.outShort ? (e.sensor === 'PNP' ? '24 V' : '0 V') : (r.powered ? 'مفتوح (OFF)' : '—');
    q('.di-vbk').textContent = bk; q('.di-l').textContent = r.led ? 'منوّرة' : 'طافية'; q('.di-l').classList.toggle('ok', r.led);
    $$('[data-ex]', host).forEach((b, i) => { b.setAttribute('aria-pressed', String(i === S.ex)); b.classList.toggle('done', IL.has(L, opt.exercises[i].key)); });
    q('.di-task').innerHTML = e.task;
    nhUpdate();
    return r;
  }
  /* «💡 الخطوة الجاية» (window.NH): sensor power, COM, then the signal BK → I0.0; any wire on the same net counts */
  let nhCtl = null;
  function nhUpdate(){
    if (!window.NH) return;
    if (!nhCtl) nhCtl = NH.mount(q('.bn-board'), {course:'instr', onTap(s){ pulse(s.hl); }});
    const e = ex(), sol = [['BN', 'P', 'sensor'], ['BU', 'N', 'sensor'], ['COM', e.card === 'sink' ? 'N' : 'P', 'com'], ['BK', 'I0', 'input']];
    nhCtl.set(NH.net({sol, wires:S.wires, lab:k => T[k] ? T[k][2] : k, idea:p => NH.S.idea[p[2]], btn:q('[data-b=chk]').textContent.trim()}));
  }
  function tapT(k){
    if (!S.pend){ S.pend = k; msg(`اخترت <b>${T[k][2]}</b>. دوس على الطرف التاني.`); draw(); return; }
    if (S.pend === k){ S.pend = null; msg('اتلغى.'); draw(); return; }
    const w = [S.pend, k]; S.pend = null;
    if (S.wires.some(x => (x[0] === w[0] && x[1] === w[1]) || (x[0] === w[1] && x[1] === w[0]))){ msg('السلك ده موجود.'); draw(); return; }
    S.wires.push(w); save(); q('.di-res').innerHTML = ''; msg(`سلك من <b>${T[w[0]][2]}</b> لـ <b>${T[w[1]][2]}</b>. كمّل أو دوس "اختبر التوصيل".`); draw();
  }
  let err = null;
  function pulse(hl){ err = hl && hl.length ? {t:new Set(hl), until:Date.now() + 3000} : null; draw(); if (err) setTimeout(() => { if (err && err.until <= Date.now()){ err = null; draw(); } }, 3100); }
  function check(){
    const e = ex(), res = C.diCheck(S.wires, e.sensor, e.card);
    if (res.pass){
      q('.di-res').innerHTML = `<div class="bn-ok"><b>تمام! التوصيل صح.</b> ${e.ok} قرّب الحديدة وشوف I0.0.</div>`;
      IL.mark(L, e.key); draw();
    } else { q('.di-res').innerHTML = `<div class="bn-bad"><b>✗</b> ${res.bad[0]}</div>`; pulse(res.hl); }
    return res;
  }
  onAct(host, '[data-t]', t => tapT(t.dataset.t));
  onAct(host, '[data-w]', t => { const i = +t.closest('[data-w]').dataset.w; S.wires.splice(i, 1); save(); msg('اتشال السلك.'); draw(); });
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
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="شاشة سكوب عليها القناة A و B"><rect x="${X0 - 4}" y="2" width="${X1 - X0 + 8}" height="${H - 4}" rx="6" fill="#08130e"/>`;
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
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg viewBox="0 -16 360 246" role="img" aria-label="قرص الإنكودر بيلف، ومعاه حساسات A و B و Z">
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
   <div class="wd-art"><svg class="en-scope" viewBox="0 0 360 150" role="img" aria-label="سكوب: القنوات A و B و Z مع الوقت"></svg></div>
   <div class="tabs" role="group" aria-label="طريقة العدّ">${[1, 2, 4].map(m => `<button type="button" class="btn" data-m="${m}" aria-pressed="${m === 4}">x${m}</button>`).join('')}</div>
  </div></div>
  <div class="wd-ctl"><label>السرعة: <b class="en-sv"></b><input type="range" class="en-s" min="0" max="30" step="1" value="12" aria-label="السرعة rpm"></label>
   <button type="button" class="btn" data-d="1" aria-pressed="true">↻ مع عقارب الساعة CW</button><button type="button" class="btn" data-d="-1" aria-pressed="false">↺ عكس عقارب الساعة CCW</button></div>
  <div class="wd-ctl"><button type="button" class="btn en-run">إيقاف ⏸</button><button type="button" class="btn" data-st="-1">خطوة ربع نبضة ◀</button><button type="button" class="btn" data-st="1">▶ خطوة ربع نبضة</button><button type="button" class="btn en-rst">صفّر العدّاد</button></div>
  <p class="msg en-msg" aria-live="polite"></p>
  <p class="chal en-chal">التحدّي: لِف الإنكودر <b>في الاتجاهين</b>، وجرّب العدّ <b>x1</b> و<b>x4</b> وشوف العدّاد بيعدّ أسرع قد إيه في نفس اللفة.</p>`;
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
    q('.en-run').textContent = S.run ? 'إيقاف ⏸' : 'تشغيل ▶';
    $$('[data-m]', host).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.m === S.m)));
    $$('[data-d]', host).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.d === S.dir)));
    const ab = C.encAB(S.p), f = C.encFreq(N, S.run ? S.rpm : 0);
    q('.en-msg').innerHTML = `A = <b>${ab.A}</b> · B = <b>${ab.B}</b> · ${S.dir > 0 ? '<b>A سابقة B</b> بربع نبضة (90°) ⇐ <b>CW</b>' : '<b>B سابقة A</b> ⇐ <b>CCW</b> والعدّاد بينقص'} · تردد A = <span class="eq">${N} × ${S.run ? S.rpm : 0} ÷ 60 = ${fmt(f, 1)} Hz</span> · كل نبضة = <b>${S.m}</b> عدّة في x${S.m}.`;
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
    return {q:`الإنكودر ده متظبط إن <b>A سابقة B = CW</b>. السكوب بيبيّن:${IL.scopeSVG(lead, 3)}العمود بيلف في أنهي اتجاه؟`, o:['CW (مع عقارب الساعة)', 'CCW (عكس عقارب الساعة)', 'واقف', 'مش هينفع نعرف'], a:lead === 'A' ? 0 : 1,
      why:lead === 'A' ? 'A بتطلع الأول وبعدها B بربع نبضة ⇐ A سابقة ⇐ CW.' : 'B بتطلع الأول وبعدها A ⇐ B سابقة ⇐ CCW.'};
  }
  if (t === 1){
    const ppr = pick([100, 360, 500, 1000, 1024, 2048, 2500]), rpm = pick([300, 600, 1000, 1450, 1500, 3000]), f = C.encFreq(ppr, rpm) / 1000;
    return {input:true, unit:'kHz', q:`إنكودر <b class="eq">${ppr} PPR</b> على موتور بيلف <b class="eq">${rpm} rpm</b>. تردد القناة A كام kHz؟`, check:v => Math.abs(v - f) <= Math.max(0.01, f * 0.02), ans:fmt(f, 2) + ' kHz', why:`<span class="eq">f = PPR × rpm ÷ 60 = ${ppr} × ${rpm} ÷ 60 = ${fmt(f * 1000, 0)} Hz</span>`};
  }
  if (t === 2){
    const ppr = pick([500, 1000, 1024, 2048]), m = pick([1, 2, 4]), rev = pick([2, 3, 5, 10, 2.5, 0.5]), cnt = Math.round(ppr * m * rev);
    return {input:true, unit:'لفة', q:`إنكودر <b class="eq">${ppr} PPR</b> والعدّاد في الـ PLC على <b>x${m}</b>. العدّاد زاد <b class="eq">${cnt}</b> عدّة. العمود لف كام لفة؟`, check:v => Math.abs(v - rev) <= 0.02, ans:String(rev), why:`<span class="eq">لفات = ${cnt} ÷ (${ppr} × ${m}) = ${rev}</span>`};
  }
  if (t === 3){
    const ppr = pick([500, 1000, 1024, 2000]), rpm = pick([150, 300, 600, 900, 1200, 1500]), f = C.encFreq(ppr, rpm);
    return {input:true, unit:'rpm', q:`إنكودر <b class="eq">${ppr} PPR</b>، والـ High Speed Counter قاس تردد <b class="eq">${fmt(f, 0)} Hz</b> على القناة A. السرعة كام rpm؟`, check:v => Math.abs(v - rpm) <= rpm * 0.01, ans:rpm + ' rpm', why:`<span class="eq">rpm = f ÷ PPR × 60 = ${fmt(f, 0)} ÷ ${ppr} × 60 = ${rpm}</span>`};
  }
  const qs = [
    {q:'كابل الإنكودر طويل (50 م) وجنب كابلات إنفرتر. أنهي نوع خرج أحسن؟', o:['Line Driver RS-422', 'Open collector NPN', 'TTL عادي 5V', 'HTL أحادي من غير شيلد'], a:0, why:'الإشارة التفاضلية (Differential) بتلغي النويز المشترك على السلكين.'},
    {q:'إنكودر خرجه <b>Open collector NPN</b> متوصّل على كارت ومش بيطلّع نبضات. ناقص غالبًا:', o:['مقاومة Pull-up للـ +V', 'مقاومة 250Ω توالي في الخط', 'دايود على الخرج', 'مكثف على الباور'], a:0, why:'الأوبن كولكتور بيسحب لـ 0V بس، ومحتاج حاجة ترفع الإشارة لما يفصل.'},
    {q:'إنكودر <b>HTL Push-Pull</b> بيشتغل على جهد كام عادة؟', o:['⁦10⁠–⁠30V⁩ (زي 24V)', '5V بس (زي الـ TTL)', '230V AC', '⁦1⁠–⁠5V⁩ أنالوج'], a:0, why:'HTL = High Threshold Logic: الخرج بيطلع تقريبًا بجهد الباور.'},
    {q:'إنكودر 1000 PPR والعدّ x4. أصغر زاوية يقدر يحسّها؟', o:['0.09°', '0.36°', '1°', '0.18°'], a:0, why:'360 ÷ (1000 × 4) = 0.09°.'}
  ];
  return pick(qs);
};

/* ================= L5: Gray-code absolute disc ================= */
IL.grayDisc = function(host, opt){
  opt = opt || {}; const L = opt.lesson, NB = 4, NP = 1 << NB;
  const S = {pos:0, code:'gray', ang:0, target:0, steps:0, tr:false, sawTr:false};
  host.innerHTML = `<div class="tabs" role="group" aria-label="نوع الكود"><button type="button" class="btn" data-c="bin" aria-pressed="false">Binary عادي</button><button type="button" class="btn" data-c="gray" aria-pressed="true">Gray code</button></div>
  <div class="sim-grid two-col"><div class="wd-art"><svg class="gd-svg" viewBox="0 0 300 250" role="img" aria-label="قرص إنكودر أبسليوت 4 بت"></svg></div>
  <div class="mm-side"><div class="read gd-read"></div><div class="gd-tr"></div></div></div>
  <div class="wd-ctl"><button type="button" class="btn" data-s="-1">◀ خطوة لورا</button><button type="button" class="btn" data-s="1">خطوة لقدّام ▶</button><button type="button" class="btn gd-trb" aria-pressed="false">شوف لحظة الانتقال</button></div>
  <p class="msg gd-msg" aria-live="polite"></p>
  <p class="chal gd-chal">التحدّي: لِف القرص <b>لفة كاملة</b> (16 خطوة)، وافتح "لحظة الانتقال" على <b>Binary</b> عند خطوة بيتغيّر فيها أكتر من بت (زي 7 ⇐ 8)، وقارنها بالـ Gray.</p>`;
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
    q('.gd-read').innerHTML = `<div><span>المكان (خطوة)</span><b>${b} / ${NP}</b></div><div><span>الزاوية</span><b>${fmt(b * 360 / NP, 1)}°</b></div><div><span>الكود اللي الحساسات قريته</span><b>${C.bits(cur, NB)}</b></div><div><span>${S.code === 'gray' ? 'بعد التحويل لـ Binary' : 'Gray للمقارنة'}</span><b>${S.code === 'gray' ? C.bits(C.gray2bin(cur), NB) + ' = ' + C.gray2bin(cur) : C.bits(gcode, NB)}</b></div>`;
    $$('[data-c]', host).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.c === S.code)));
    q('.gd-trb').setAttribute('aria-pressed', String(S.tr));
    if (S.tr){
      const nx = (b + 1) % NP, a = val(b), c = val(nx), diff = a ^ c, bitsCh = [];
      for (let k = 0; k < NB; k++) if ((diff >> k) & 1) bitsCh.push(k);
      const poss = new Set(); for (let m = 0; m < (1 << bitsCh.length); m++){ let v = a; bitsCh.forEach((k, i) => { if ((m >> i) & 1) v ^= 1 << k; }); poss.add(v); }
      const list = Array.from(poss).map(v => { const pos = S.code === 'gray' ? C.gray2bin(v) : v; const ok = pos === b || pos === nx; return `<span class="term" style="${ok ? '' : 'border-color:var(--bad);color:var(--bad)'}">${C.bits(v, NB)} ⇐ ${pos}</span>`; }).join(' ');
      q('.gd-tr').innerHTML = `<div class="statline ${bitsCh.length > 1 ? 'bad' : 'ok'}"><span>من <b>${b}</b> لـ <b>${nx}</b> بيتغيّر <b>${bitsCh.length}</b> بت. لو الحساسات مش متزامنة بالظبط، القراية اللحظية ممكن تبقى: ${list}</span></div>`;
      if (S.code === 'bin' && bitsCh.length > 1) S.sawTr = true;
    } else q('.gd-tr').innerHTML = '';
    q('.gd-msg').innerHTML = S.code === 'gray' ? 'في <b>Gray code</b> بين أي خطوتين جنب بعض <b>بت واحد بس</b> بيتغيّر، فمستحيل تقرا رقم بعيد في لحظة الانتقال.' : 'في <b>Binary العادي</b> ساعات بتتغيّر بتات كتير مرة واحدة (7 = 0111 ⇐ 8 = 1000). افتح "لحظة الانتقال" هناك وشوف.';
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
  host.innerHTML = `<div class="dr-top"><span class="cg-sc" aria-live="polite"></span><span class="bar"><i class="cg-bar"></i></span></div><div class="cg-card dr-card"></div><div class="dr-act"><button type="button" class="btn pri cg-next" hidden>اللي بعده ←</button></div><p class="chal cg-chal">${opt.goal || `حلّ <b>${need}</b> حالات صح على الأقل.`}</p>`;
  const q = s => $(s, host), fin = chal(host, '.cg-chal', opt.lesson, opt.task), card = q('.cg-card');
  function score(){ q('.cg-sc').innerHTML = `الحالة <b>${Math.min(k + 1, cases.length)}</b> من ${cases.length} · صح: <b>${ok}</b>`; q('.cg-bar').style.width = (ok / need * 100 > 100 ? 100 : ok / need * 100) + '%'; }
  function show(){
    const c = cases[order[k]], oi = qzOrder(c.o, c.keep);
    card.innerHTML = `<h4>${c.t}</h4><div class="dr-q" style="font-weight:500">${c.s}</div>${c.clues && c.clues.length ? `<div class="chips-t">${c.clues.map((cl, i) => `<button type="button" class="btn" data-cl="${i}" aria-expanded="false">افحص: ${cl[0]}</button>`).join('')}</div><div class="cg-clue"></div>` : ''}<p style="margin:4px 0 0;font-weight:600">السبب غالبًا إيه؟</p><div class="qz-a">${oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${qzTxt(c.o[i])}</button>`).join('')}</div>${QZ_CF()}<p class="qz-f" aria-live="polite"></p>`;
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
/* scope picture from arbitrary traces: [{lab, col, fn(t 0..1) → 0/1 or analog}] */
IL.scopeTr = function(traces, note){
  const W = 340, rowH = 42, H = traces.length * rowH + 14, X0 = 30, X1 = 332, n = 500;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="سكوب"><rect x="${X0 - 4}" y="2" width="${X1 - X0 + 8}" height="${H - 4}" rx="6" fill="#08130e"/>`;
  traces.forEach((tr, r) => { const y0 = 12 + r * rowH + 30; let d = ''; for (let i = 0; i <= n; i++){ const x = X0 + (X1 - X0) * i / n, y = y0 - tr.fn(i / n) * 24; d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } s += `<path d="${d}" fill="none" stroke="${tr.col}" stroke-width="2" stroke-linejoin="round"/><text x="${X0 - 8}" y="${y0 - 8}" text-anchor="end" style="font:700 11px var(--font-mono);fill:${tr.col}">${tr.lab}</text>`; });
  if (note) s += `<text x="${X1 - 4}" y="16" text-anchor="end" style="font:600 9px var(--font-mono);fill:#7aa08e">${note}</text>`;
  return s + '</svg>';
};
const sq = (t, ph) => C.encAB(t * 4 + ph).A;
IL.ENC_CASES = [
  {t:'العدّاد بيزيد والمكنة واقفة', s:'مكنة تغليف: لما الإنفرتر بتاع السير يشتغل، عدّاد الإنكودر بتاع مكنة القص بيزيد عدّات لوحده حتى والمكنة دي واقفة. ولما الإنفرتر يقف، العدّاد يثبت.', clues:[['السكوب على A', IL.scopeTr([{lab:'A', col:'#ffd23f', fn:t => ((t * 37) % 1 < 0.02 ? 0.8 : 0) }], 'VFD ON')], ['مسار الكابل', 'كابل الإنكودر ماشي في نفس الصينية مع كابل الموتور من الإنفرتر، والشيلد مقصوص من الناحيتين ومش متأرّض.']],
    o:['نويز والشيلد مش متأرّض', 'الإنكودر بايظ', 'A و B معكوسين', 'الـ PPR غلط في الـ PLC'], a:0, why:'إشارات الـ PWM من الإنفرتر بتركب على كابل الإنكودر كنبضات زيادة. افصل الكابلات، أرّض الشيلد صح (360° في الكلامب)، واستخدم Line Driver تفاضلي.'},
  {t:'العدّ بينقص والسير ماشي لقدّام', s:'بعد تغيير إنكودر بإنكودر جديد، العدّاد بقى بينقص والسير ماشي في اتجاهه العادي، والمكان في الـ HMI بقى بالسالب.', clues:[['السكوب', IL.scopeTr([{lab:'A', col:'#ffd23f', fn:t => sq(t, 0.85)}, {lab:'B', col:'#3fd0ff', fn:t => sq(t, 0.1)}], 'FWD')]],
    o:['A و B متبدّلين', 'نويز من الإنفرتر', 'القناة Z مش واصلة', 'الـ PPR أكبر من القديم'], a:0, why:'B سابقة A ⇐ الكارت فاهم إنه CCW. بدّل سلكين A و B، أو اعكس الاتجاه من باراميتر الكارت.'},
  {t:'العدّاد بيعدّ نص العدد وبيرجع لما المكنة تهتز', s:'المكان بيطلع نص المسافة الحقيقية تقريبًا، ولما العمود بيهتز وهو واقف العدّاد بيزيد بس عمره ما ينقص.', clues:[['السكوب', IL.scopeTr([{lab:'A', col:'#ffd23f', fn:t => sq(t, 0.1)}, {lab:'B', col:'#3fd0ff', fn:t => 0}])], ['قياس بالأفوميتر', 'جهد القناة B على ترمنال الكارت = 0V ثابت، وعلى أطراف الإنكودر نفسه بيتغيّر.']],
    o:['القناة B مقطوعة', 'إنكودر PPR أكبر', 'نويز من الإنفرتر', 'الباور ضعيف'], a:0, why:'من غير B الكارت مش عارف الاتجاه وبيعدّ حافّات A بس. اربط الترمنال أو غيّر السلك المقطوع.'},
  {t:'المقاسات مظبوطة في البطيء وبتبوظ في السريع', s:'مكنة قص: لما السرعة 20 م/دقيقة الألواح مظبوطة، ولما ترفع لـ 80 م/دقيقة الألواح تطلع أطول وكل مرة بفرق مختلف.', clues:[['الحسبة', 'الإنكودر 2048 PPR والعمود بيوصل 2900 rpm ⇐ <span class="eq">2048 × 2900 ÷ 60 ≈ 99 kHz</span>. والـ High Speed Counter في الـ PLC أقصاه <b>30 kHz</b>.']],
    o:['الكارت بيضيّع نبضات', 'نويز من الإنفرتر', 'A و B معكوسين', 'العجلة بتزحلق دايمًا'], a:0, why:'الكارت مش لاحق فبيضيّع نبضات وبالتالي اللوح بيطلع أطول. استخدم كارت أسرع أو إنكودر PPR أقل.'},
  {t:'المكان بيزحف شوية بشوية', s:'طاولة دوّارة: بعد كام يوم الوقفة بتبعد عن مكانها بالتدريج، ومفيش نويز وكل حاجة في السكوب نضيفة.', clues:[['الفحص الميكانيكي', 'عملت علامة بالقلم على العمود وعلى الكابلنج، وبعد شوية شغل العلامتين بعدوا عن بعض.']],
    o:['الكابلنج مرتخي', 'الإنكودر TTL مش HTL', 'الباور 24V ضعيف', 'الـ PLC بطيء'], a:0, why:'العمود بيلف والإنكودر بيلف أقل منه شوية. اربط مسمار الكابلنج على السطح المسطّح للعمود (أو غيّر الكابلنج).'},
  {t:'رولمان بلي الإنكودر بيبوظ كل شهرين', s:'إنكودر بعمود مفرّغ (Hollow shaft) على موتور. كل شهرين البلي يصفّر ويبوظ.', clues:[['التركيب', 'جسم الإنكودر مربوط بـ 4 مسامير على شاسيه الموتور ربط جامد، وعمود الموتور فيه "طوحان" (Runout) بسيط.']],
    o:['تركيب جامد من غير Torque arm', 'نويز من الموتور على البلي', 'الـ PPR صغير', 'الكابل طويل'], a:0, why:'الـ Hollow shaft لازم يتربط من ناحية العمود بس، وجسمه يتمسك بذراع عزم مرن يسمح بالطوحان. أي ربط جامد بيحمّل البلي ويكسره.'},
  {t:'بعد قطع الكهربا الونش مش عارف هو فين', s:'كل مرة الكهربا تقطع وترجع، لازم الونش يروح للبداية (Homing) عشان يعرف مكانه، والمصنع زهق.', clues:[['الإنكودر', 'إنكودر إنكريمنتال 1000 PPR.']],
    o:['محتاجين أبسليوت Multi-turn', 'الإنكودر بايظ ولازم يتغيّر', 'الباور ضعيف', 'محتاجين PPR أعلى'], a:0, why:'الإنكريمنتال مالوش ذاكرة: بعد الباور العدّاد بيبدأ من صفر. الأبسليوت المالتي تيرن بيعرف مكانه وعدد لفاته حتى بعد قطع الكهربا.'},
  {t:'كابل 80 متر والعدّ مش مظبوط', s:'إنكودر TTL 5V خرج عادي (من غير A̅ B̅) والكابل 80 متر لحد اللوحة. العدّ بيضيع أحيانًا والإشارة ضعيفة.', clues:[['السكوب عند الكارت', IL.scopeTr([{lab:'A', col:'#ffd23f', fn:t => { const v = sq(t, 0.1); return v * 0.55 + Math.sin(t * 300) * 0.06; }}], '2V/div')]],
    o:['استخدم Line Driver أو HTL', 'الإنكودر بيلف بالعكس', 'الكابلنج مرتخي على العمود', 'القناة Z مش واصلة'], a:0, why:'جهد 5V بيقع على الكابل الطويل ويلقط نويز. الـ RS-422 التفاضلي بيمشي مسافات أطول بكتير، أو HTL 24V مع كارت مناسب.'}
];

/* ================= L6: thermocouple bench ================= */
C.TC_COL = {K:['#2e9b3c', 'أخضر'], J:['#1d1d1d', 'أسود'], T:['#7a4a22', 'بني'], N:['#e07aa8', 'بمبي'], S:['#f08a24', 'برتقاني'], R:['#f08a24', 'برتقاني'], B:['#9aa4ac', 'رمادي']};
IL.tcBench = function(host, opt){
  opt = opt || {}; const L = opt.lesson, g = U('tc');
  const S = {type:'K', th:400, thead:70, tamb:30, cjc:true, cable:'ext', rev:false, open:false, seen:new Set()};
  const typ = Object.keys(C.TC);
  host.innerHTML = `<div class="wd-art"><svg viewBox="0 0 360 250" role="img" aria-label="ثيرموكبل في فرن، كابل، وجهاز قياس في اللوحة">${ART.defs(g)}
    <defs><linearGradient id="${g}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#d9381e"/></linearGradient></defs>
    <rect class="tc-furn" x="0" y="156" width="130" height="90" rx="6" fill="url(#${g}f)"/><rect x="0" y="150" width="130" height="10" fill="#7f8a92"/>
    <text x="8" y="240" class="svg-ar" style="font-size:10px;font-weight:700;fill:#fff">الفرن</text>
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
  <div class="wd-ctl"><label style="flex:1 1 100%">نوع الثيرموكبل: <select class="inp tc-type" dir="ltr">${typ.map(t => `<option value="${t}">Type ${t} · ${C.TC[t].pair}</option>`).join('')}</select></label>
   <label>حرارة الفرن (الطرف السخن): <b class="tc-thv"></b><input type="range" class="tc-th" min="0" max="1250" step="5" value="400" aria-label="حرارة الطرف السخن"></label>
   <label>حرارة راس الثيرموكبل: <b class="tc-hv"></b><input type="range" class="tc-hd" min="10" max="150" step="1" value="70" aria-label="حرارة الراس"></label>
   <label>حرارة اللوحة (عند الجهاز): <b class="tc-av"></b><input type="range" class="tc-amb" min="0" max="55" step="1" value="30" aria-label="حرارة اللوحة"></label></div>
  <div class="flt" role="group" aria-label="تجارب وأعطال"><button type="button" class="btn" data-k="cjc" aria-pressed="false">اقفل الـ CJC</button><button type="button" class="btn" data-k="cu" aria-pressed="false">كابل نحاس عادي بدل كابل التعويض</button><button type="button" class="btn" data-k="rev" aria-pressed="false">اعكس القطبية</button><button type="button" class="btn" data-k="open" aria-pressed="false">اقطع الثيرموكبل</button></div>
  <p class="msg tc-msg" aria-live="polite"></p>
  <p class="chal tc-chal">التحدّي: جرّب <b>اقفل الـ CJC</b> و<b>كابل نحاس</b> و<b>اعكس القطبية</b>، وفي كل مرة شوف الغلط كام درجة ومن فين جه.</p>`;
  const q = s => $(s, host), fin = chal(host, '.tc-chal', L, 'tc');
  function cable(){
    const col = S.cable === 'cu' ? ['#b87333', '#b87333'] : [C.TC_COL[S.type][0], '#f2f2f2'], sheath = S.cable === 'cu' ? '#5d6469' : C.TC_COL[S.type][0];
    const pa = S.rev ? 'M236 104' : 'M236 96', pb = S.rev ? 'M236 96' : 'M236 104';
    let s = `<path d="M100 46C150 46 160 100 220 100" fill="none" stroke="${sheath}" stroke-width="12" stroke-linecap="round" opacity=".85"/><path d="M100 46C150 46 160 100 220 100" fill="none" stroke="#000" stroke-width="12" stroke-linecap="round" opacity=".15"/>`;
    s += `<path d="M220 100C226 100 226 96 236 96" fill="none" stroke="${S.rev ? col[1] : col[0]}" stroke-width="3.4"/><path d="M220 100C226 100 226 104 236 104" fill="none" stroke="${S.rev ? col[0] : col[1]}" stroke-width="3.4" stroke-dasharray="${S.rev ? '' : ''}"/>`;
    s += `<text x="${S.rev ? 230 : 230}" y="92" text-anchor="end" style="font:700 9px var(--font-mono);fill:var(--bad)">+</text><text x="230" y="116" text-anchor="end" style="font:700 9px var(--font-mono);fill:var(--cold)">−</text>`;
    s += `<text x="165" y="${S.cable === 'cu' ? 132 : 132}" text-anchor="middle" class="svg-ar" style="font-size:10px;font-weight:700;fill:${S.cable === 'cu' ? 'var(--bad)' : 'var(--ink)'}">${S.cable === 'cu' ? 'سلك نحاس عادي' : 'كابل تعويض Type ' + S.type}</text>`;
    if (S.open) s += `<path d="M150 56l12 12M162 56l-12 12" stroke="var(--bad)" stroke-width="3.5"/>`;
    void pa; void pb;
    q('.tc-cab').innerHTML = s;
    const cj = S.cable === 'cu' ? [100, 46, 'الطرف البارد هنا (الراس)'] : [236, 100, 'الطرف البارد هنا'];
    q('.tc-cjm').innerHTML = `<circle cx="${cj[0]}" cy="${cj[1]}" r="5.5" fill="var(--cold)" stroke="#fff" stroke-width="1.5"/><text x="${cj[0] + (S.cable === 'cu' ? 0 : -6)}" y="${cj[1] + (S.cable === 'cu' ? -10 : 26)}" text-anchor="${S.cable === 'cu' ? 'start' : 'end'}" class="svg-ar" style="font-size:10px;font-weight:700;fill:var(--cold)">${cj[2]}</text>`;
  }
  function ui(){
    const T = C.TC[S.type], r = C.tcRead({type:S.type, th:S.th, thead:S.thead, tamb:S.tamb, cjc:S.cjc, cable:S.cable, rev:S.rev, open:S.open});
    const E = t => C.tcMv(S.type, t);
    cable();
    const disp = r.status === 'open' ? 'OPEN' : r.status === 'under' ? 'LLLL' : r.status === 'over' ? 'HHHH' : fmt(r.shown, 1);
    q('.tc-disp').textContent = disp; q('.tc-ty').textContent = S.type; q('.tc-cj').textContent = S.cjc ? 'ON' : 'OFF';
    q('.tc-tht').textContent = S.th + '°C'; q('.tc-headt').textContent = 'الراس \u2066' + S.thead + ' °C\u2069'; q('.tc-headt').setAttribute('class', 'tc-headt svg-ar w-tx');
    q('.tc-ambt').textContent = 'اللوحة \u2066' + S.tamb + ' °C\u2069'; q('.tc-ambt').setAttribute('class', 'tc-ambt svg-ar w-mu');
    q('.tc-furn').style.opacity = 0.35 + Math.min(1, S.th / 900) * 0.65;
    q('.tc-thv').textContent = S.th + ' °C'; q('.tc-hv').textContent = S.thead + ' °C'; q('.tc-av').textContent = S.tamb + ' °C';
    const err = r.shown == null ? null : r.shown - S.th;
    q('.tc-read').innerHTML = `<div><span>mV عند أطراف الجهاز</span><b>${isFinite(r.mv) ? fmt(r.mv, 3) + ' mV' : 'OL'}</b></div><div><span>الـ CJC بيضيف</span><b>${S.cjc ? '+' + fmt(E(S.tamb), 3) + ' mV' : '0'}</b></div><div><span>الجهاز بيعرض</span><b>${disp}${r.shown != null ? ' °C' : ''}</b></div><div><span>الغلط</span><b class="${err == null || Math.abs(err) > 3 ? 'bad' : 'ok'}">${err == null ? '—' : (err > 0 ? '+' : '') + fmt(err, 1) + ' °C'}</b></div>`;
    const st = q('.tc-st'); const good = err != null && Math.abs(err) <= 2.5;
    st.className = 'statline tc-st ' + (good ? 'ok' : 'bad');
    st.innerHTML = `<span><b>المعادلة:</b> <span class="eq">E(Th) − E(Tcj) = ${fmt(E(S.th), 3)} − ${fmt(E(S.cable === 'cu' ? S.thead : S.tamb), 3)} = ${fmt(E(S.th) - E(S.cable === 'cu' ? S.thead : S.tamb), 3)} mV</span></span>`;
    let m;
    if (S.open) m = '<b>الثيرموكبل مقطوع:</b> مفيش دايرة. الجهاز بيبعت تيار صغير جدًا في الحساس (Burnout detection) فلما يتقطع الجهد يعلى، فبيعرض <b>OPEN</b> أو بيروح لأعلى قيمة (Upscale) والترانسميتر يطلّع 21+ mA. ده عشان الفرن ميفضلش يسخّن على قراية واطية.';
    else if (S.rev) m = `<b>القطبية معكوسة:</b> الـ mV بقى بالسالب. لاحظ الغريبة: لو سخّنت الفرن أكتر، القراية <b>تنزل</b>! ${r.status === 'under' ? 'وهنا راحت تحت الرينج خالص (LLLL).' : ''} في الموقع: قراية بتقل والفرن بيسخن = قطبية معكوسة في حتة (الراس أو الجنكشن أو الجهاز).`;
    else if (S.cable === 'cu') m = `<b>كابل نحاس عادي:</b> الثيرموكبل خلص عند <b>الراس</b> (<span class="eq">${S.thead} °C</span>)، فالطرف البارد بقى هناك. لكن الجهاز بيعوّض على حرارة <b>اللوحة</b> (<span class="eq">${S.tamb} °C</span>). الغلط تقريبًا = <span class="eq">${S.tamb} − ${S.thead} = ${S.tamb - S.thead} °C</span>. ولو الراس جنب فرن حرارته بتتغير، الغلط بيتغير معاها. الحل: <b>كابل تعويض من نفس النوع</b> لحد أطراف الجهاز.`;
    else if (!S.cjc) m = `<b>الـ CJC مقفول:</b> الثيرموكبل بيقيس <b>الفرق</b> بين الطرف السخن والطرف البارد. الجهاز بيحوّل الـ mV كأن الطرف البارد على 0°C، فبيعرض تقريبًا <span class="eq">${S.th} − ${S.tamb}</span>. الغلط حوالي <b>−${S.tamb} °C</b> (حرارة اللوحة). وعشان كده الثيرموكبل من غير CJC "بيقرا الحرارة اللي في اللوحة" لما الفرن بارد: بيعرض صفر وهو فعلًا 30.`;
    else m = `كله مظبوط: الجهاز قاس <b>${fmt(r.mv, 3)} mV</b>، وحساس CJC جوّاه قاس حرارة أطرافه (<span class="eq">${S.tamb} °C</span>) وضاف <b>${fmt(E(S.tamb), 3)} mV</b>، وبعدين حوّل من الجدول: <span class="eq">${fmt(r.mv + E(S.tamb), 3)} mV ⇐ ${fmt(r.shown, 1)} °C</span>.`;
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
    return {input:true, unit:'°C', q:`ثيرموكبل <b>Type ${type}</b>. الأفوميتر على أطرافه في اللوحة بيقرا <b class="eq">${fmt(mv, 3)} mV</b>، وحرارة الأطراف <b class="eq">${tc} °C</b>. الطرف السخن حرارته كام؟ <small class="muted">(استخدم الجدول اللي فوق)</small>`, check:v => Math.abs(v - ans) <= 4, ans:fmt(ans, 0) + ' °C', why:`ضيف الـ mV بتاع الطرف البارد الأول: <span class="eq">${fmt(mv, 3)} + E(${tc}) ${fmt(C.tcMv(type, tc), 3)} = ${fmt(mv + C.tcMv(type, tc), 3)} mV ⇐ ${fmt(ans, 0)} °C</span>. لو حوّلت الـ mV على طول من غير ما تضيف، هتغلط حوالي ${tc} درجة.`};
  }
  const qs = [
    {q:'ثيرموكبل لونه حسب IEC: السلك الموجب <b>أخضر</b> والسالب <b>أبيض</b>. ده نوع:', o:['K', 'J', 'T', 'S'], a:0, why:'IEC 60584: K أخضر، J أسود، T بني، N بمبي، S و R برتقاني.'},
    {q:'كابل ثيرموكبل أمريكي (ANSI) سلكه <b>الأحمر</b> يبقى:', o:['السالب دايمًا', 'الموجب دايمًا', 'الشيلد', 'على حسب النوع'], a:0, why:'في ANSI السالب أحمر في كل الأنواع (عكس اللي متعودين عليه!). K: أصفر (+) وأحمر (−).'},
    {q:'فرن 1500 °C. أنهي ثيرموكبل يستحمل؟', o:['Type S أو R أو B', 'Type T أو J عادي', 'Type K عادي', 'PT100 Class A'], a:0, why:'T لحد حوالي 350 و J لحد 750 و K لحد حوالي 1250. البلاتين للحرارة العالية جدًا.'},
    {q:'ليه Type B مش محتاج CJC تقريبًا؟', o:['الـ mV بتاعه قرب الصفر', 'لأنه أغلى وأدق من K', 'لأنه بيتوصّل 4 سلك', 'لأنه فيه CJC جوه الراس'], a:0, why:'E(50 °C) ≈ 0.002 mV بس، فتأثير حرارة اللوحة مهمل.'}
  ];
  return pick(qs);
};

/* ================= L7: RTD bench (2/3/4 wire) ================= */
IL.rtdBench = function(host, opt){
  opt = opt || {}; const L = opt.lesson, g = U('rt');
  const S = {w:2, t:80, len:50, mm2:0.5, loose:false, r0:100, seen:new Set()};
  host.innerHTML = `<div class="tabs" role="group" aria-label="عدد الأسلاك">${[2, 3, 4].map(w => `<button type="button" class="btn" data-w="${w}" aria-pressed="${w === 2}">${w} سلك</button>`).join('')}</div>
  <div class="wd-art"><svg class="rt-svg" viewBox="0 34 360 136" role="img" aria-label="حساس PT100 وكابل وجهاز قياس"></svg></div>
  <div class="read rt-read"></div>
  <div class="statline rt-st" aria-live="polite"></div>
  <div class="wd-ctl"><label>الحرارة الحقيقية: <b class="rt-tv"></b><input type="range" class="rt-t" min="-50" max="300" step="1" value="80" aria-label="الحرارة"></label>
   <label>طول الكابل: <b class="rt-lv"></b><input type="range" class="rt-l" min="1" max="300" step="1" value="50" aria-label="طول الكابل"></label>
   <label style="flex:1 1 45%">مقطع السلك: <select class="inp rt-mm" dir="ltr">${[0.22, 0.5, 0.75, 1, 1.5].map(v => `<option value="${v}"${v === 0.5 ? ' selected' : ''}>${v} mm²</option>`).join('')}</select></label>
   <label style="flex:1 1 45%">الحساس: <select class="inp rt-r0" dir="ltr"><option value="100">PT100</option><option value="1000">PT1000</option></select></label></div>
  <div class="flt"><button type="button" class="btn rt-loose" aria-pressed="false">ترمنال مرتخي (+1.5 Ω في سلك واحد)</button></div>
  <p class="msg rt-msg" aria-live="polite"></p>
  <p class="chal rt-chal">التحدّي: شوف الغلط في <b>2 سلك</b> مع كابل 50 م، وبعدين جرّب <b>3 سلك</b> و<b>4 سلك</b>. وجرّب الترمنال المرتخي على الـ 3 سلك.</p>`;
  const q = s => $(s, host), fin = chal(host, '.rt-chal', L, 'rtd');
  function draw(r){
    const cols = {2:['#d32f2f', '#f2f2f2'], 3:['#d32f2f', '#d32f2f', '#f2f2f2'], 4:['#d32f2f', '#d32f2f', '#f2f2f2', '#f2f2f2']}[S.w];
    let s = `<g transform="translate(6 70) scale(.62)">${ART.pt100({g:g, tag:''})}</g>`;
    s += ART.defs(g);
    s += `<text x="44" y="64" text-anchor="middle" style="font:700 10px var(--font-mono)" class="w-tx">PT${S.r0}</text>`;
    s += `<rect x="4" y="80" width="46" height="18" rx="4" fill="none" stroke="var(--accent)" stroke-dasharray="3 3"/><text x="27" y="114" text-anchor="middle" class="w-mu" style="font:600 9px var(--font-mono)">${fmt(r.rt, 2)} Ω</text>`;
    const y0 = 100 - (cols.length - 1) * 8;
    cols.forEach((c, i) => { const y = y0 + i * 16; s += `<path d="M138 100C160 100 160 ${y} 186 ${y}H252" fill="none" stroke="#555" stroke-width="5"/><path d="M138 100C160 100 160 ${y} 186 ${y}H252" fill="none" stroke="${c}" stroke-width="3.2"/>`; if (S.loose && i === 0) s += `<circle cx="252" cy="${y}" r="5" fill="none" stroke="var(--warn)" stroke-width="2.5"/>`; });
    s += `<text x="200" y="${y0 - 14}" text-anchor="middle" class="svg-ar w-mu" style="font-size:10px">⁦${S.len} m · ${S.mm2} mm²⁩ · كل سلك ⁦${fmt(r.rl, 2)} Ω⁩</text>`;
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
    q('.rt-read').innerHTML = `<div><span>مقاومة الحساس</span><b>${fmt(rt, 2)} Ω</b></div><div><span>الجهاز قاس</span><b>${fmt(rm, 2)} Ω</b></div><div><span>الجهاز بيعرض</span><b>${fmt(tm, 1)} °C</b></div><div><span>الغلط</span><b class="${Math.abs(err) > tol ? 'bad' : 'ok'}">${err >= 0 ? '+' : ''}${fmt(err, 2)} °C</b></div><div><span>خرج ترانسميتر ⁦0⁠–⁠150 °C⁩</span><b>${fmt(ma, 2)} mA</b></div>`;
    const st = q('.rt-st'); st.className = 'statline rt-st ' + (Math.abs(err) > tol ? 'bad' : 'ok');
    st.innerHTML = Math.abs(err) > tol ? `الغلط أكبر من سماحية الحساس نفسه: Class B عند الحرارة دي <span class="eq">±${fmt(tol, 2)} °C</span>. يعني الكابل بوّظ القياس أكتر من الحساس!` : `الغلط جوه سماحية Class B: <span class="eq">±${fmt(tol, 2)} °C</span>.`;
    const d = S.r0 === 100 ? 0.385 : 3.85;
    const M = {
      2:`<b>2 سلك:</b> الجهاز بيقيس الحساس <b>+ السلكين</b>: <span class="eq">${fmt(rt, 2)} + 2 × ${fmt(rl, 2)}${S.loose ? ' + 1.5' : ''} = ${fmt(rm, 2)} Ω</span>. وكل 1 Ω زيادة في PT${S.r0} = حوالي <span class="eq">${fmt(1 / d, 2)} °C</span>. ${S.r0 === 1000 ? 'لاحظ: الـ PT1000 الغلط بتاعه أصغر 10 مرات لأن مقاومته أكبر 10 مرات.' : 'عشان كده الـ 2 سلك ينفع بس مع كابل قصير جدًا أو PT1000.'}`,
      3:`<b>3 سلك:</b> الجهاز بيقيس مقاومة سلك زيادة لوحده ويطرحها، على افتراض إن <b>السلكين متساويين</b>. ${S.loose ? '<b>بس الترمنال المرتخي</b> زوّد مقاومة في سلك واحد بس، فالتعويض اتلخبط والغلط رجع: <span class="eq">+1.5 Ω ≈ +' + fmt(1.5 / d, 1) + ' °C</span>. ده عطل حقيقي بيحصل من أكسدة الترمنالات.' : 'وده الأشهر في المصانع: رخيص ودقيق كفاية.'}`,
      4:`<b>4 سلك:</b> سلكين بيوصّلوا تيار القياس، وسلكين تانيين بيقيسوا الجهد على الحساس نفسه ومفيش فيهم تيار تقريبًا، فمقاومة الكابل <b>مش بتدخل خالص</b>${S.loose ? ' حتى مع الترمنال المرتخي' : ''}. ده للمختبرات والقياس الدقيق والمعايرة.`
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
    return {input:true, unit:'°C', q:`فكّيت الـ PT${r0} من الجهاز وقست بالأفوميتر بين الطرفين (الأحمر والأبيض): <b class="eq">${fmt(R, 2)} Ω</b>. الحرارة تقريبًا كام؟ <small class="muted">(إهمل السلك)</small>`, check:v => Math.abs(v - T) <= 2, ans:T + ' °C', why:`تقريب سريع: <span class="eq">T ≈ (R − ${r0}) ÷ ${r0 === 100 ? '0.385' : '3.85'} = ${fmt((R - r0) / (r0 * 0.00385), 1)} °C</span>، والجدول الدقيق بيقول ${T} °C.`};
  }
  if (t < 0.75){
    const T = pick([0, 25, 50, 100, 150, 200]), R = C.rtdR(T, r0);
    return {input:true, unit:'Ω', q:`PT${r0} على <b class="eq">${T} °C</b>. مقاومته المفروض تبقى كام أوم؟`, check:v => Math.abs(v - R) <= R * 0.006, ans:fmt(R, 2) + ' Ω', why:`من جدول IEC 60751: <span class="eq">R(${T}) = ${fmt(R, 2)} Ω</span>.`};
  }
  return pick([
    {q:'قست PT100 بالأفوميتر لقيت <b>OL</b> (مالانهاية). ده معناه:', o:['الحساس أو سلكه مقطوع', 'الحرارة عالية جدًا', 'الحساس مقصور', 'سليم'], a:0, why:'PT100 السليم بين 80 و 250 Ω تقريبًا في الشغل العادي.'},
    {q:'قست PT100 لقيت <b>0.4 Ω</b>. ده معناه:', o:['قصر في الحساس أو الكابل', 'الحرارة −250 °C فعلًا', 'سليم والحرارة صفر', 'الحساس مقطوع من جوه'], a:0, why:'0.4 Ω مقاومة سلك مش حساس: فيه قصر. الجهاز هيعرض أقل قيمة أو Under range.'},
    {q:'PT100 في 3 سلك. بين السلكين اللي لونهم <b>زي بعض</b> المفروض تقيس:', o:['أقل من 1 Ω', 'حوالي 100 Ω', 'حوالي 138 Ω', 'OL (مفتوح)'], a:0, why:'السلكين دول متوصّلين في نفس طرف الحساس.'},
    {q:'الـ NTC لما الحرارة تزيد مقاومته:', o:['بتقل', 'بتزيد', 'ثابتة', 'بتبقى صفر'], a:0, why:'NTC = Negative Temperature Coefficient.'}
  ]);
};
/* NTC vs PT100 curve */
IL.ntcCurve = function(host){
  const S = {t:25, r25:10000, beta:3950};
  host.innerHTML = `<div class="wd-art"><svg class="nt-svg" viewBox="0 0 360 210" role="img" aria-label="منحنى مقاومة NTC و PT100 مع الحرارة"></svg></div><div class="read nt-read"></div><div class="wd-ctl"><label>الحرارة: <b class="nt-tv"></b><input type="range" class="nt-t" min="-20" max="120" step="1" value="25" aria-label="الحرارة"></label></div>`;
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
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg class="lc-svg" viewBox="0 0 360 290" role="img" aria-label="لود سيل S-type شايل أوزان، والقنطرة بتاعته"></svg></div>
  <div class="mm-side"><div class="read lc-read"></div><div class="statline lc-st" aria-live="polite"></div></div></div>
  <div class="wd-ctl"><button type="button" class="btn" data-add="20"><span class="eq">+20 kg</span></button><button type="button" class="btn" data-add="50"><span class="eq">+50 kg</span></button><button type="button" class="btn" data-add="100"><span class="eq">+100 kg</span></button><button type="button" class="btn" data-add="200"><span class="eq">+200 kg</span></button><button type="button" class="btn" data-add="-1">شيل آخر وزن</button><button type="button" class="btn" data-add="0">فضّي</button></div>
  <div class="tabs" role="group" aria-label="الكابل"><button type="button" class="btn" data-wr="4" aria-pressed="false">كابل 4 سلك</button><button type="button" class="btn" data-wr="6" aria-pressed="true">كابل 6 سلك (Sense)</button></div>
  <div class="wd-ctl"><label>طول الكابل (0.5 mm²): <b class="lc-lv"></b><input type="range" class="lc-l" min="5" max="300" step="5" value="100" aria-label="طول الكابل"></label>
   <label>حرارة الكابل (المعايرة اتعملت على 20 °C): <b class="lc-tv"></b><input type="range" class="lc-t" min="-5" max="60" step="1" value="20" aria-label="حرارة الكابل"></label></div>
  <p class="msg lc-msg" aria-live="polite"></p>
  <p class="chal lc-chal">التحدّي: حط حمل قريب من <b>500 kg</b> وشوف الـ mV، وبعدين قارن <b>4 سلك</b> و<b>6 سلك</b> لما حرارة الكابل تبقى 50 °C.</p>`;
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
    if (!n) s += `<text x="86" y="${yb + 70}" text-anchor="middle" class="svg-ar w-mu" style="font-size:10px">دوس + عشان تحط وزن</text>`;
    /* bridge */
    const cx = 252, cy = 124, d = 58, dR = 0.7 * f, col = (t, k) => t ? `rgb(${200 + Math.round(55 * k)},${Math.round(80 - 40 * k)},${Math.round(60 - 30 * k)})` : `rgb(${Math.round(40 - 20 * k)},${Math.round(110 + 20 * k)},${200 + Math.round(55 * k)})`;
    const arm = (x1, y1, x2, y2, lab, t) => { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI; return `<path d="M${x1} ${y1}L${x2} ${y2}" class="w-in" stroke-width="1.6"/><g transform="translate(${mx} ${my}) rotate(${ang})"><rect x="-17" y="-7" width="34" height="14" rx="2" fill="${col(t, f)}"/><path d="M-13 0h4l2-4 4 8 4-8 4 8 2-4h4" fill="none" stroke="#fff" stroke-width="1.2"/></g><text x="${mx + (mx < cx ? -14 : 14)}" y="${my + (my < cy ? -8 : 16)}" text-anchor="${mx < cx ? 'end' : 'start'}" style="font:600 8px var(--font-mono)" class="w-tx">${lab} ${t ? '+' : '−'}${fmt(dR, 2)}</text>`; };
    s += arm(cx, cy - d, cx - d, cy, 'R1', false) + arm(cx - d, cy, cx, cy + d, 'R2', true) + arm(cx, cy - d, cx + d, cy, 'R3', true) + arm(cx + d, cy, cx, cy + d, 'R4', false);
    s += `<circle cx="${cx}" cy="${cy - d}" r="4" class="w-ac"/><circle cx="${cx}" cy="${cy + d}" r="4" class="w-ac"/><circle cx="${cx - d}" cy="${cy}" r="4" fill="var(--good)"/><circle cx="${cx + d}" cy="${cy}" r="4" fill="var(--good)"/>`;
    s += `<text x="${cx}" y="${cy - d - 10}" text-anchor="middle" style="font:700 9px var(--font-mono);fill:#d32f2f">+EXC ${fmt(r.vcell, 2)}V</text><text x="${cx}" y="${cy + d + 18}" text-anchor="middle" style="font:700 9px var(--font-mono)" class="w-tx">−EXC 0V</text>`;
    s += `<text x="${cx - d - 6}" y="${cy + 4}" text-anchor="end" style="font:700 9px var(--font-mono);fill:var(--good)">+SIG</text><text x="${cx + d + 6}" y="${cy + 4}" style="font:700 9px var(--font-mono);fill:var(--good)">−SIG</text>`;
    s += `<path d="M${cx - d + 8} ${cy}H${cx + d - 8}" stroke="var(--good)" stroke-dasharray="3 3"/><rect x="${cx - 30}" y="${cy - 11}" width="60" height="20" rx="4" fill="#06130b"/><text x="${cx}" y="${cy + 3}" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#4dff88">${fmt(r.mv, 3)} mV</text>`;
    s += `<text x="${cx}" y="226" text-anchor="middle" class="svg-ar w-mu" style="font-size:9.5px">أحمر = شد (R بتزيد) · أزرق = ضغط (R بتقل)</text><text x="${cx}" y="240" text-anchor="middle" class="w-mu" style="font:600 9px var(--font-mono)">ΔR in Ω · 350 Ω gauges</text>`;
    q('.lc-svg').innerHTML = s;
  }
  function ui(){
    const r = calc(); draw(r);
    const err = r.W ? (r.shown - r.W) / r.W * 100 : 0;
    q('.lc-read').innerHTML = `<div><span>الحمل الحقيقي</span><b>${r.W} kg</b></div><div><span>خرج الخلية</span><b>${fmt(r.mv, 3)} mV</b></div><div><span>الجهد الواصل للخلية</span><b>${fmt(r.vcell, 3)} V</b></div><div><span>الميزان بيعرض</span><b class="${Math.abs(err) > 0.1 ? 'bad' : 'ok'}">${fmt(r.shown, 1)} kg</b></div>`;
    const st = q('.lc-st'), over = r.W > CAP;
    st.className = 'statline lc-st ' + (over ? 'bad' : Math.abs(err) > 0.1 ? 'warn' : 'ok');
    st.innerHTML = over ? `<b>Overload!</b> الحمل ${r.W} kg أكبر من سعة الخلية 500 kg. لحد 150 % (Safe overload) مش هيحصل ضرر دائم غالبًا، بعدها الخلية بتتشوّه ويتزحزح الزيرو بتاعها.` : `<span class="eq">mV = ${SENS} mV/V × ${fmt(r.vcell, 2)} V × ${r.W}/${CAP} = ${fmt(r.mv, 3)} mV</span>`;
    q('.lc-msg').innerHTML = S.wires === 4 ? `<b>4 سلك:</b> مقاومة السلكين (كل واحد <span class="eq">${fmt(r.rw, 2)} Ω</span> على ${S.tc} °C) بتاكل من الـ 10V، فالخلية بتاخد <span class="eq">${fmt(r.vcell, 3)} V</span> بس. المعايرة على 20 °C بتشيل الفرق ده، بس لما حرارة الكابل تتغيّر مقاومته بتتغيّر والقراية تزحف${Math.abs(err) > 0.01 ? `: الغلط دلوقتي <b class="eq">${fmt(err, 2)} %</b> يعني <span class="eq">${fmt(r.shown - r.W, 2)} kg</span> على الـ ${r.W} kg` : ''}.` : `<b>6 سلك:</b> سلكين Sense بيقيسوا الجهد <b>عند الخلية نفسها</b> (<span class="eq">${fmt(r.vcell, 3)} V</span>) ومفيهمش تيار، والإنديكيتور بيقسم الإشارة عليه (Ratiometric). فطول الكابل وحرارته مش بيأثروا: القراية ثابتة.`;
    q('.lc-lv').textContent = S.len + ' m'; q('.lc-tv').textContent = S.tc + ' °C';
    $$('[data-wr]', host).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.wr === S.wires)));
    if (r.W >= 400 && r.W <= 500) S.seen.add('full'); if (Math.abs(S.tc - 20) >= 25) S.seen.add('w' + S.wires);
    if (S.seen.has('full') && S.seen.has('w4') && S.seen.has('w6')) fin();
    return r;
  }
  onAct(host, '[data-add]', b => { const v = +b.dataset.add; if (v > 0){ if (load() + v > 700){ q('.lc-msg').innerHTML = '<b>كفاية!</b> مش هنحمّل الخلية أكتر من 140 % عشان متتشوّهش.'; return; } S.w.push(v); } else if (v < 0) S.w.pop(); else S.w = []; ui(); });
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
    if (a === 'cal'){ M.state = 'cap'; M.ok = false; M.verZero = M.verLoad = false; return 'ادخل سعة الميزان (Capacity) من اليافطة.'; }
    if (a === 'cap'){ if (M.state !== 'cap'){ M.err = 'ادخل على قايمة المعايرة الأول (CAL).'; return M.err; } if (arg !== CAP){ M.err = `السعة غلط. يافطة الميزان مكتوب عليها <b>Max ${CAP} kg</b>.`; return M.err; } M.cap = arg; M.state = 'zero'; return 'فضّي الميزان (الهوبر فاضي بس من غير أوزان) واستنى القراية تثبت، ودوس ZERO.'; }
    if (a === 'zero'){ if (M.state !== 'zero'){ M.err = M.state === 'run' ? 'ده زرار الزيرو في المعايرة. لازم تدخل CAL وتدخل السعة الأول.' : 'لسه مدخلتش السعة.'; return M.err; } if (M.load !== 0){ M.err = '<b>غلط في الإجراء:</b> فيه أوزان على الميزان! نقطة الزيرو لازم تتاخد والميزان فاضي، وإلا كل القرايات هتطلع ناقصة بالوزن ده.'; return M.err; } M.z = mv(); M.state = 'span'; return 'حط وزن المعايرة (Test weight) المعروف، واكتب قيمته، ودوس SPAN.'; }
    if (a === 'span'){ if (M.state !== 'span'){ M.err = M.state === 'zero' ? '<b>غلط في الإجراء:</b> لازم تعمل ZERO الأول وبعدين SPAN.' : 'ادخل CAL الأول.'; return M.err; }
      if (!(arg > 0)){ M.err = 'اكتب قيمة وزن المعايرة.'; return M.err; }
      if (M.load === 0){ M.err = 'مفيش وزن على الميزان! حط وزن المعايرة الأول.'; return M.err; }
      if (Math.abs(arg - M.load) > 0.01){ M.err = `<b>القيمة اللي كتبتها (${arg} kg) غير الوزن اللي على الميزان (${M.load} kg).</b> لو كمّلت كده كل القرايات هتطلع غلط بنسبة ${fmt((arg / M.load - 1) * 100, 1)} %.`; return M.err; }
      if (M.load < CAP * 0.2){ M.err = `<b>وزن المعايرة صغير قوي</b> (${M.load} kg = ${fmt(M.load / CAP * 100, 0)} % من السعة). أي غلط صغير هيتضرب ويكبر عند السعة الكاملة. استخدم 20 % من السعة على الأقل (والأحسن ⁦50⁠–⁠100 %⁩).`; return M.err; }
      M.k = arg / (mv() - M.z); M.state = 'run'; M.ok = true; return 'تمام: المعايرة اتسجّلت. دلوقتي <b>اتأكد</b>: شيل كل الأوزان (لازم 0)، وحط وزن تاني (لازم يقرا صح).'; }
    if (a === 'exit'){ M.state = 'run'; return 'خرجت من المعايرة من غير حفظ.'; }
    if (a === 'load'){ M.load = arg; if (M.ok && M.state === 'run'){ const w = M.weight(); if (M.load === 0 && Math.abs(w) < 0.3) M.verZero = true; if (M.load > 0 && Math.abs(w - M.load) <= Math.max(0.5, M.load * 0.002)) M.verLoad = true; } return ''; }
    return '';
  };
  return M;
};
IL.indicator = function(host, opt){
  opt = opt || {}; const L = opt.lesson, g = U('in');
  const M = C.indCal(); const S = {w:[]};
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg class="in-svg" viewBox="0 0 360 250" role="img" aria-label="هوبر على لود سيل وإنديكيتور وزن"></svg></div>
  <div class="mm-side"><ol class="steps-l in-steps"><li>دوس <b>CAL</b>، اكتب السعة <b>Capacity</b> من اليافطة، ودوس <b>ENTER</b></li><li><b>ZERO</b> والميزان فاضي</li><li>حط وزن معايرة معروف، اكتبه، ودوس <b>SPAN</b></li><li>اتأكد: فاضي = 0</li><li>اتأكد: وزن تاني بيقرا صح</li></ol></div></div>
  <div class="wd-ctl"><button type="button" class="btn pri" data-k="cal">CAL</button><button type="button" class="btn" data-k="ent">ENTER</button><button type="button" class="btn" data-k="zero">ZERO</button><button type="button" class="btn" data-k="span">SPAN</button><button type="button" class="btn" data-k="tare">TARE</button><button type="button" class="btn" data-k="exit">EXIT</button></div>
  <div class="wd-ctl"><label style="flex:1 1 100%">الرقم (السعة أو وزن المعايرة kg): <input type="number" class="in-n" inputmode="decimal" value="" placeholder="مثلًا 500" aria-label="الرقم"></label></div>
  <div class="wd-ctl"><span style="flex:1 1 100%;font-size:.9rem">أوزان معايرة معتمدة (M1):</span><button type="button" class="btn" data-a="20"><span class="eq">+20 kg</span></button><button type="button" class="btn" data-a="50"><span class="eq">+50 kg</span></button><button type="button" class="btn" data-a="100"><span class="eq">+100 kg</span></button><button type="button" class="btn" data-a="-1">شيل آخر وزن</button><button type="button" class="btn" data-a="0">فضّي</button></div>
  <div class="statline in-st" aria-live="polite"></div>
  <p class="chal in-chal">التحدّي: اعمل المعايرة كاملة <b>بالترتيب الصح</b>، وبعدين اتأكد بالخطوتين 4 و 5.</p>`;
  const q = s => $(s, host), fin = chal(host, '.in-chal', L, 'cal');
  let tare = 0;
  function draw(){
    const disp = M.state === 'run' ? fmt(Math.round((M.weight() - tare) * 2) / 2, 1) : M.display();
    let s = ART.defs(g);
    s += `<path d="M20 30h120l-20 70H40z" fill="url(#${g}mh)" stroke="#5d6469" stroke-width="1.4"/><rect x="24" y="22" width="112" height="10" rx="2" fill="#7f8a92"/><text x="80" y="64" text-anchor="middle" class="svg-ar" style="font-size:10px;font-weight:700;fill:#1c2125">هوبر</text><text x="80" y="78" text-anchor="middle" style="font:600 8px var(--font-mono);fill:#1c2125">Max 500 kg</text>`;
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
    if (k === 'tare'){ if (M.state !== 'run'){ say('الـ TARE مش جزء من المعايرة.', true); return; } tare = M.weight(); say('<b>TARE:</b> الميزان شال الوزن الحالي (زي وزن البرميل الفاضي) وبيعرض الصافي (Net). ده غير ZERO المعايرة: الـ Tare بيتمسح ومش بيغيّر المعايرة.'); draw(); return; }
    if (k === 'cal') tare = 0;
    let a = k;
    if (k === 'ent') a = M.state === 'cap' ? 'cap' : M.state === 'span' ? 'span' : M.state === 'zero' ? 'zero' : 'none';
    if (a === 'none'){ say('ENTER بيأكد الرقم جوه قايمة المعايرة. دوس CAL الأول.', true); return; }
    const t = M.step(a, a === 'cap' || a === 'span' ? n : undefined); say(t, !!M.err);
    if (a === 'cap' && !M.err) q('.in-n').value = '';
    draw();
  });
  onAct(host, '[data-a]', b => { const v = +b.dataset.a; if (v > 0){ if (total() + v > 500){ say('كده هتعدّي سعة الميزان.', true); return; } S.w.push(v); } else if (v < 0) S.w.pop(); else S.w = []; M.step('load', total()); if (M.ok && M.state === 'run') say(M.verZero && M.verLoad ? '<b>المعايرة كاملة ومتأكَّد منها.</b> الزيرو صفر والوزن التاني بيقرا صح.' : M.verZero ? 'الزيرو تمام. حط وزن تاني (مختلف عن وزن المعايرة لو تقدر) واتأكد.' : 'فضّي الميزان واتأكد إنه بيقرا 0.'); draw(); });
  say('الميزان جديد ومتعايرش (بيقرا أرقام غلط). اتبع الخطوات اللي جنب الرسمة.');
  draw();
  return {M, S, press(k, n){ if (k === 'cap') k = 'ent'; if (n != null) q('.in-n').value = n; host.querySelector(`[data-k="${k}"]`).click(); return M.err; }, add(v){ host.querySelector(`[data-a="${v}"]`).click(); }, get disp(){ return M.state === 'run' ? M.weight() - tare : M.display(); }};
};

/* ---- load cell diagnosis with a multimeter ---- */
IL.LC_FAULTS = [['', 'سليمة'], ['overload', 'اتحمّلت أوفرلود (الزيرو متزحزح)'], ['moisture', 'رطوبة / ميّة (العزل ضعيف)'], ['sense', 'سلك Sense مقطوع'], ['weld', 'بريدج محروق (تيار لحام عدّى فيها)'], ['sig', 'سلك إشارة مقطوع']];
IL.lcDiag = function(host, opt){
  opt = opt || {}; const L = opt.lesson, g = U('ld');
  const cells = shuffle(['', 'overload', 'moisture', 'sense', 'weld']).map((f, i) => ({f, n:i + 1, solved:false}));
  const S = {c:0, mode:'ohm', red:null, blk:null};
  host.innerHTML = `<div class="tabs" role="group" aria-label="اختار الخلية">${cells.map((c, i) => `<button type="button" class="btn" data-c="${i}" aria-pressed="${i === 0}">خلية ${c.n}</button>`).join('')}</div>
  <div class="sim-grid two-col"><div class="wd-art"><svg class="ld-svg" viewBox="0 0 360 256" role="group" aria-label="أطراف كابل اللود سيل في الجنكشن بوكس، وأفوميتر"></svg></div>
  <div class="mm-side"><div class="tabs" role="group" aria-label="وضع الأفوميتر"><button type="button" class="btn" data-m="ohm" aria-pressed="true">Ω (الخلية مفصولة)</button><button type="button" class="btn" data-m="mv" aria-pressed="false">mV DC (متوصّلة ومتغذّية 10V)</button></div>
  <p class="msg ld-msg" aria-live="polite">دوس على طرف عشان تحط <b style="color:#d32f2f">المجس الأحمر</b>، وبعدين طرف تاني للـ <b>الأسود</b>.</p>
  <div class="box" style="font-size:.88rem"><b>المفروض (خلية 350 Ω، 2 mV/V):</b><ul style="margin:4px 0 0;padding-inline-start:18px"><li>+EXC ↔ −EXC: <span class="eq">≈ 390 Ω</span></li><li>+SIG ↔ −SIG: <span class="eq">≈ 350 Ω</span></li><li>+SEN ↔ +EXC: <span class="eq">≈ 1 Ω</span> (سلك بس)</li><li>أي سلك ↔ SHLD: <span class="eq">OL</span></li><li>Zero balance (mV، من غير حمل): <span class="eq">&lt; ±0.2 mV</span></li></ul></div></div></div>
  <div class="ld-dx"></div>
  <p class="chal ld-chal">التحدّي: شخّص <b>4 خلايا</b> على الأقل صح من الخمسة. قيس قبل ما تحكم.</p>`;
  const q = s => $(s, host), fin = chal(host, '.ld-chal', L, 'lcdiag');
  const TP = {}; C.LC_TERMS.forEach((t, i) => { TP[t[0]] = [36 + i * 46, 200, t[1], t[2]]; });
  function reading(){
    const c = cells[S.c];
    if (!S.red || !S.blk) return '----';
    const v = C.lcMeter(c.f, S.mode, S.red, S.blk, 0);
    if (S.mode === 'ohm') return v === Infinity ? 'OL' : v >= 1e6 ? fmt(v / 1e6, 2) + ' MΩ' : v >= 1000 ? fmt(v / 1000, 3) + ' kΩ' : fmt(v, 1) + ' Ω';
    if (isNaN(v)) return '?? (مش ثابتة)';
    return fmt(v, 2) + ' mV';
  }
  function draw(){
    const rd = reading();
    let s = `<rect x="8" y="160" width="344" height="92" rx="8" fill="#d7dde1" stroke="#5d6469"/><text x="180" y="246" text-anchor="middle" class="svg-ar" style="font-size:10px;font-weight:700;fill:#1c2125">ترمنالات الجنكشن بوكس · خلية ${cells[S.c].n}</text>`;
    C.LC_TERMS.forEach(([k, lab, col]) => { const [x, y] = TP[k]; s += `<rect x="${x - 16}" y="${y - 14}" width="32" height="28" rx="3" fill="#3a4248"/>${screw(x, y, 7)}<path d="M${x} ${y + 14}V${y + 30}" stroke="${col}" stroke-width="5"/><text x="${x}" y="${y - 20}" text-anchor="middle" style="font:700 9px var(--font-mono);fill:#1c2125">${lab}</text><circle data-t="${k}" cx="${x}" cy="${y}" r="17" fill="transparent" tabindex="0" role="button" aria-label="طرف ${lab}" style="cursor:pointer"/>`; });
    s += `<g transform="translate(120 6)"><rect width="120" height="120" rx="12" fill="#f2b705" stroke="#6b5200"/><rect x="10" y="10" width="100" height="40" rx="4" fill="#c7d3b4"/><text x="104" y="38" text-anchor="end" style="font:700 ${rd.length > 9 ? 12 : 17}px var(--font-mono);fill:#1b2410">${esc(rd.replace(' (مش ثابتة)', ''))}</text><text x="14" y="62" style="font:700 9px var(--font-mono);fill:#3b2d00">${S.mode === 'ohm' ? 'Ω' : 'mV DC'}</text><circle cx="60" cy="88" r="16" fill="#2a3035"/><path d="M60 88l${S.mode === 'ohm' ? '-11 -8' : '11 -8'}" stroke="#f2b705" stroke-width="3"/><circle cx="34" cy="110" r="5" fill="#d32f2f"/><circle cx="86" cy="110" r="5" fill="#1c2125"/></g>`;
    if (S.red){ const [x, y] = TP[S.red]; s += `<path d="M154 116C150 140 ${x} 130 ${x} ${y - 8}" fill="none" stroke="#d32f2f" stroke-width="3"/><circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#d32f2f" stroke-width="3"/>`; }
    if (S.blk){ const [x, y] = TP[S.blk]; s += `<path d="M206 116C210 140 ${x} 130 ${x} ${y - 8}" fill="none" stroke="#1c2125" stroke-width="3"/><circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#1c2125" stroke-width="3"/>`; }
    q('.ld-svg').innerHTML = s;
    $$('[data-c]', host).forEach((b, i) => { b.setAttribute('aria-pressed', String(i === S.c)); b.classList.toggle('done', cells[i].solved); });
    $$('[data-m]', host).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === S.mode)));
    const c = cells[S.c];
    q('.ld-dx').innerHTML = `<div class="mm-diag"><b>التشخيص بتاعك لخلية ${c.n}:</b><div class="opts">${IL.LC_FAULTS.map(f => `<button type="button" class="btn" data-dx="${f[0]}"${c.ans != null ? ' disabled' : ''}>${f[1]}</button>`).join('')}</div><p class="qz-f ld-f" aria-live="polite"></p></div>`;
    if (c.ans != null){ $$('[data-dx]', host).forEach(b => { if (b.dataset.dx === c.f) b.classList.add('ok'); else if (b.dataset.dx === c.ans) b.classList.add('no'); }); const f = q('.ld-f'); f.className = 'qz-f ld-f ' + (c.solved ? 'ok' : 'no'); f.innerHTML = (c.solved ? 'صح. ' : 'مش ده. ') + WHY[c.f]; }
    if (cells.filter(x => x.solved).length >= 4) fin();
    return rd;
  }
  const WHY = {'':'كل القرايات طبيعية: Input حوالي 390، Output حوالي 350، العزل OL، والزيرو قريب من صفر. المشكلة في حتة تانية (الإنديكيتور أو الميكانيكا).',
    overload:'المقاومات قريبة من الطبيعي، بس الـ <b>Zero balance</b> بدون حمل حوالي <b>5 mV</b> (ربع الرينج!) والمقاومة من EXC+ لـ SIG+ مختلفة عن EXC+ لـ SIG−. الخلية اتشوّهت من حمل زيادة أو خبطة. لازم تتغيّر.',
    moisture:'المقاومات الأساسية سليمة، بس بين أي سلك والشيلد/الجسم فيه <b>حوالي 1 MΩ</b> بدل OL. دي ميّة أو رطوبة دخلت الخلية أو الكابل: القراية هتزحف مع الجو. جرّب تنشّف الكابل، ولو فضلت يبقى الخلية.',
    sense:'من +SEN لـ +EXC = <b>OL</b> بدل مقاومة سلك. سلك الـ Sense مقطوع: الإنديكيتور هيدّي Error أو قراية غلط. صلّح السلك، أو مؤقتًا اعمل جمبر Sense–Excitation عند الإنديكيتور (هيبقى 4 سلك).',
    weld:'الـ Input والـ Output بعيدين خالص عن 390 و 350، والـ mV غريب جدًا. دي بريدج اتحرقت: غالبًا حد لحم في الهيكل وتيار اللحام عدّى في الخلية. القاعدة: <b>قبل اللحام افصل الخلايا أو اعمل لها بايباس بكابل أرضي</b>.',
    sig:'سلك الإشارة مقطوع.'};
  function tapT(k){ if (!S.red || (S.red && S.blk)){ S.red = k; S.blk = null; } else if (k !== S.red) S.blk = k; const rd = draw(); q('.ld-msg').innerHTML = S.red && S.blk ? `الأحمر على <b>${TP[S.red][2]}</b> والأسود على <b>${TP[S.blk][2]}</b> ⇐ <b class="eq">${esc(rd)}</b>` : `الأحمر على <b>${TP[S.red][2]}</b>. دوس طرف للأسود.`; }
  onAct(host, '[data-t]', t => tapT(t.dataset.t));
  onAct(host, '[data-c]', b => { S.c = +b.dataset.c; S.red = S.blk = null; draw(); q('.ld-msg').innerHTML = 'دوس على طرف للمجس الأحمر.'; });
  onAct(host, '[data-m]', b => { S.mode = b.dataset.m; draw(); if (S.red && S.blk) tapT(S.blk); });
  onAct(host, '[data-dx]', b => { const c = cells[S.c]; if (c.ans != null) return; c.ans = b.dataset.dx; c.solved = c.ans === c.f; draw(); });
  draw();
  return {cells, S, measure(a, b, mode){ S.mode = mode || S.mode; S.red = a; S.blk = b; return draw(); }, pick(i){ S.c = i; draw(); }, dx(f){ const b = host.querySelector(`[data-dx="${f}"]`); if (b) b.click(); }};
};

/* ================= L9: hydrostatic / DP level tank ================= */
IL.LIQ = [['water', 'ميّة', 1000], ['diesel', 'سولار', 840], ['milk', 'لبن', 1030], ['brine', 'محلول ملح', 1200], ['acid', 'حمض كبريتيك 98 %', 1840]];
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
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg class="lv-svg" viewBox="0 0 290 290" role="img" aria-label="تانك فيه سايل وترانسميتر مستوى بالضغط تحت"></svg></div>
  <div class="mm-side"><div class="read lv-read"></div><div class="statline lv-st" aria-live="polite"></div></div></div>
  <div class="wd-ctl"><label>المستوى الحقيقي: <b class="lv-hv"></b><input type="range" class="lv-h" min="0" max="4" step="0.05" value="2.5" aria-label="المستوى"></label>
   <label style="flex:1 1 100%">السايل في التانك: <select class="inp lv-liq">${IL.LIQ.map(l => `<option value="${l[0]}">${l[1]} (ρ = ${l[2]} kg/m³)</option>`).join('')}</select></label></div>
  <div class="flt"><button type="button" class="btn" data-k="cfg" aria-pressed="false">اظبط الكثافة في الترانسميتر صح</button><button type="button" class="btn" data-k="closed" aria-pressed="false">تانك مقفول عليه ضغط 0.2 bar</button><button type="button" class="btn" data-k="dp" aria-pressed="false">استخدم ترانسميتر DP (الواطي على فوق)</button></div>
  <p class="msg lv-msg" aria-live="polite"></p>
  <p class="chal lv-chal">التحدّي: (1) غيّر السايل لـ <b>سولار</b> أو <b>حمض</b> والترانسميتر لسه متظبط على الميّة وشوف الغلط. (2) اقفل التانك بضغط وشوف الترانسميتر العادي بيغلط إزاي، وصلّحها بالـ <b>DP</b>.</p>`;
  const q = s => $(s, host), fin = chal(host, '.lv-chal', L, 'lvl');
  const liq = () => IL.LIQ.find(l => l[0] === S.liq);
  function ui(){
    const rho = liq()[2], rhoCfg = S.cfgRight ? rho : 1000, closed = S.closed ? 20000 : 0;
    const r = C.levelSim({h:S.h, rho, rhoCfg, closed, dp:S.dp});
    const X = 40, Y = 30, W = 150, H = 200, yL = Y + H - S.h / 4 * H, col = {water:'#3a8fd8', diesel:'#c9a43a', milk:'#eef1f3', brine:'#7fb8c9', acid:'#8e9a4a'}[S.liq];
    let s = ART.defs(g);
    s += `<rect x="${X}" y="${yL}" width="${W}" height="${Y + H - yL}" fill="${col}" opacity=".85"/><path d="M${X} ${yL}h${W}" stroke="#fff" stroke-width="1.5" opacity=".7"/>`;
    s += `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${S.closed ? 4 : 0}" fill="none" stroke="#5d6469" stroke-width="4"/>${S.closed ? `<path d="M${X} ${Y}h${W}" stroke="#5d6469" stroke-width="6"/><text x="${X + W / 2}" y="${Y + 16}" text-anchor="middle" style="font:700 10px var(--font-mono);fill:var(--warn)">N₂ 0.2 bar</text>` : `<path d="M${X - 2} ${Y}h12M${X + W - 10} ${Y}h12" stroke="#5d6469" stroke-width="4"/><text x="${X + W / 2}" y="${Y + 14}" text-anchor="middle" class="svg-ar w-mu" style="font-size:10px">مفتوح للجو</text>`}`;
    for (let m = 0; m <= 4; m++){ const y = Y + H - m / 4 * H; s += `<path d="M${X - 8} ${y}h8" class="w-in"/><text x="${X - 10}" y="${y + 4}" text-anchor="end" style="font:600 9px var(--font-mono)" class="w-tx">${m} m</text>`; }
    const bx = 196, by = Y + H + 20;
    s += `<path d="M${X + 20} ${Y + H}V${by + 11}H${bx}" fill="none" stroke="#7f8a92" stroke-width="5"/>`;
    if (S.dp) s += `<path d="M${X + W} ${Y + 8}H262V${by + 11}H${bx + 44}" fill="none" stroke="#7f8a92" stroke-width="4" stroke-dasharray="${S.closed ? '' : '6 4'}"/><text x="268" y="${Y + 120}" style="font:700 9px var(--font-mono);fill:var(--muted)" transform="rotate(90 268 ${Y + 120})">LOW side</text>`;
    s += `<rect x="${bx}" y="${by}" width="44" height="22" rx="3" fill="url(#${g}mh)" stroke="#5d6469"/><text x="${bx + 6}" y="${by + 15}" style="font:700 8px var(--font-mono);fill:#1c2125">H</text><text x="${bx + 38}" y="${by + 15}" text-anchor="end" style="font:700 8px var(--font-mono);fill:#1c2125">L</text>`;
    s += `<rect x="${bx + 17}" y="${by - 10}" width="10" height="10" fill="url(#${g}mh)" stroke="#5d6469"/><rect x="${bx - 4}" y="${by - 40}" width="52" height="32" rx="9" fill="url(#${g}b)" stroke="#173d66"/><circle cx="${bx + 22}" cy="${by - 24}" r="12" fill="#b8c7a2" stroke="#3e4a33"/><text x="${bx + 22}" y="${by - 21}" text-anchor="middle" style="font:700 7.5px var(--font-mono);fill:#16210c">${fmt(r.shown, 2)}</text>`;
    s += `<text x="${bx + 22}" y="${by + 36}" text-anchor="middle" style="font:700 10px var(--font-mono)" class="w-tx">LT-301 ${S.dp ? 'DP' : 'GAUGE'}</text>`;
    s += `<text x="${X + W / 2}" y="${Math.max(Y + 30, yL - 6)}" text-anchor="middle" style="font:700 10px var(--font-mono)" class="w-tx">${fmt(S.h, 2)} m</text>`;
    q('.lv-svg').innerHTML = s;
    q('.lv-read').innerHTML = `<div><span>الضغط تحت</span><b>${fmt(r.pBot / 1000, 2)} kPa</b></div><div><span>الترانسميتر بيقيس</span><b>${fmt(r.meas / 1000, 2)} kPa</b></div><div><span>الخرج</span><b>${fmt(r.mA, 2)} mA</b></div><div><span>المستوى في الـ PLC</span><b class="${Math.abs(r.err) > 0.02 ? 'bad' : 'ok'}">${fmt(r.shown, 2)} m</b></div>`;
    const st = q('.lv-st'), bad = Math.abs(r.err) > 0.02; st.className = 'statline lv-st ' + (bad ? 'bad' : 'ok');
    st.innerHTML = `<span class="eq">P = ρ·g·h = ${rho} × 9.81 × ${fmt(S.h, 2)} = ${fmt(C.hydroP(S.h, rho) / 1000, 2)} kPa</span>${bad ? ` · الغلط <b class="eq">${r.err > 0 ? '+' : ''}${fmt(r.err * 100, 0)} cm</b>` : ''}`;
    let m; const rhoMsg = !S.cfgRight && liq()[2] !== 1000 ? ` <b>وكمان</b> الترانسميتر متظبط على كثافة الميّة والسايل كثافته ${liq()[2]}، فالمستوى ${liq()[2] > 1000 ? 'هيطلع أعلى' : 'هيطلع أقل'} من الحقيقة.` : '';
    q('.lv-liq').value = S.liq;
    if (S.closed && !S.dp) m = '<b>التانك مقفول وعليه ضغط غاز:</b> الترانسميتر العادي (Gauge) بيقيس ضغط السايل <b>+ ضغط الغاز</b> اللي فوقه. 0.2 bar = 20 kPa = حوالي <b>2 متر ميّة زيادة</b>! الحل: ترانسميتر <b>DP</b>: الطرف العالي تحت، والطرف الواطي متوصّل بالمساحة اللي فوق السايل، فضغط الغاز بيتلغي.' + rhoMsg;
    else if (S.closed && S.dp) m = '<b>DP:</b> الطرف الواطي شايف ضغط الغاز بس، والعالي شايف الغاز + السايل. الفرق = السايل بس. ده الحل الصح للتنكات المقفولة والغلايات.' + rhoMsg;
    else if (!S.cfgRight && liq()[2] !== 1000) m = `<b>الترانسميتر متظبط على كثافة الميّة (1000)</b> والسايل كثافته ${liq()[2]}. الضغط هو اللي بيتقاس، فالمستوى المحسوب = <span class="eq">P ÷ (1000 × g)</span>. ${liq()[2] > 1000 ? 'السايل أتقل ⇐ القراية <b>أعلى</b> من الحقيقة، وممكن الـ PLC يقفل الطلمبة بدري.' : 'السايل أخف ⇐ القراية <b>أقل</b> من الحقيقة، وممكن التانك <b>يفيض</b> والـ PLC فاكره لسه فيه مكان!'}`;
    else m = 'القياس بالضغط (Hydrostatic) بيقيس <b>الضغط</b> مش المستوى. لازم الكثافة تبقى معروفة وثابتة. لو الكثافة بتتغيّر (خلط، حرارة، رغوة)، استخدم رادار أو لود سيل.';
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
  {q:'فلو <b>ميّة DM (منزوعة الأملاح)</b> في محطة غلايات. أنهي فلومتر <b>مش</b> هينفع؟', o:['ماجنتيك', 'فورتكس', 'كوريوليس', 'أولتراسونيك'], a:0, why:'الماجنتيك محتاج سايل موصّل (أكتر من حوالي 5 µS/cm)، والميّة المنزوعة الأملاح موصليتها أقل بكتير.'},
  {q:'فلو <b>مجاري / طينة (Slurry)</b> فيها رمل:', o:['ماجنتيك', 'تربينة', 'أوريفيس DP', 'فورتكس'], a:0, why:'الماجنتيك مفيهوش أي جزء جوه الماسورة، فمفيش حاجة تتسد أو تتآكل.'},
  {q:'فلو <b>بخار</b> لغلاية:', o:['فورتكس أو أوريفيس DP', 'ماجنتيك', 'كوريوليس صغير', 'أولتراسونيك Clamp-on'], a:0, why:'الفورتكس والـ DP شغّالين ممتاز مع البخار والغازات.'},
  {q:'جرعة كيماوي لازم تتقاس <b>بالكيلو جرام (Mass flow)</b> بدقة عالية:', o:['كوريوليس', 'فورتكس', 'أوريفيس', 'فلوت سويتش'], a:0, why:'الكوريوليس بيقيس الكتلة مباشرة (وكمان الكثافة).'},
  {q:'مستوى <b>بودرة أو حبيبات بلاستيك</b> في سايلو عالي:', o:['رادار 80 GHz', 'ترانسميتر ضغط تحت', 'فلوت سويتش', 'ماجنتيك فلوت'], a:0, why:'الضغط مش بينفع مع المواد الصلبة، والرادار بيقيس المسافة لسطحها.'},
  {q:'مستوى تانك <b>مقفول وعليه ضغط</b> (Vessel):', o:['ترانسميتر DP', 'ترانسميتر ضغط Gauge تحت بس', 'سويتش فلوت', 'ثيرموكبل'], a:0, why:'الـ DP بيلغي ضغط الغاز اللي فوق.'},
  {q:'حماية طلمبة من <b>الشغل على الناشف</b> (Dry run):', o:['سويتش مستوى واطي (LSL)', 'إنكودر على الموتور', 'PT100 على المواسير', 'لود سيل تحت الطلمبة'], a:0, why:'إشارة ON/OFF بسيطة بتفصل الطلمبة لما المستوى ينزل.'},
  {q:'مستوى تانك عليه <b>رغوة كتير</b>:', o:['رادار Guided wave', 'أولتراسونيك من فوق', 'فوتوسيل', 'بروكسيميتي كاباسيتيف'], a:0, why:'الرغوة بتمتص صدى الأولتراسونيك فبيقرا غلط أو يفقد الإشارة.'},
  {q:'وزن تانك خلط فيه <b>مواد كثافتها بتتغيّر</b> وفيه خلاط:', o:['لود سيل تحت الرجول', 'ترانسميتر ضغط تحت', 'فلوت', 'كاباسيتيف'], a:0, why:'اللود سيل بيوزن الكتلة نفسها مهما الكثافة أو الرغوة.'},
  {q:'فلو بماسورة <b>أوريفيس + DP</b>. الفلو زاد الضعف. فرق الضغط:', o:['بيزيد 4 أضعاف', 'بيزيد الضعف', 'بيقل للنص', 'بيفضل ثابت'], a:0, why:'Q ∝ √ΔP ⇐ ΔP ∝ Q². عشان كده الـ DP بيحتاج Square root extraction.'}
];

/* ================= L10: 5-point calibration (as-found / as-left) ================= */
C.txOut = (p, cal) => 4 + (p / 10) * 16 * (1 + cal.gain) + cal.zero; /* ⁦0⁠–⁠10 bar⁩ transmitter with zero (mA) and gain (fraction) errors */
IL.calTable = function(host, opt){
  opt = opt || {}; const L = opt.lesson, TOL = 0.25, PTS = [0, 25, 50, 75, 100];
  const S = {cal:{zero:0.10, gain:-0.012}, phase:'found', applied:null, found:{}, left:{}, judged:null};
  host.innerHTML = `<div class="sim-grid two-col"><div class="wd-art"><svg class="ct-svg" viewBox="0 0 360 200" role="img" aria-label="كاليبريتور ضغط متوصّل بترانسميتر"></svg></div>
  <div class="mm-side"><div class="statline ct-st" aria-live="polite"></div><div class="chips-t ct-pts">${PTS.map(p => `<button type="button" class="btn" data-p="${p}"><span class="eq">${p} % · ${p / 10} bar</span></button>`).join('')}</div>
  <div class="wd-ctl ct-adj"><button type="button" class="btn" data-a="zero">Zero trim</button><button type="button" class="btn" data-a="span">Span trim</button></div></div></div>
  <div class="tblw"><table class="tbl ct-tab"></table></div>
  <div class="ct-judge"></div>
  <p class="msg ct-msg" aria-live="polite"></p>
  <p class="chal ct-chal">التحدّي: سجّل الـ <b>As-found</b> على 5 نقط، احكم Pass ولا Fail (السماحية ±${TOL} % من السبان)، اعمل Zero و Span trim، وسجّل <b>As-left</b> كله Pass.</p>`;
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
    q('.ct-tab').innerHTML = `<thead><tr><th rowspan="2">النقطة</th><th rowspan="2">المفروض mA</th><th colspan="2">As-found</th><th colspan="2">As-left</th></tr><tr><th>mA</th><th>غلط %</th><th>mA</th><th>غلط %</th></tr></thead><tbody>${PTS.map(row).join('')}</tbody>`;
  }
  const allIn = o => PTS.every(p => o[p] != null);
  const passes = o => PTS.every(p => Math.abs(C.errPct(o[p], ideal(p))) <= TOL);
  function status(t, c){ const st = q('.ct-st'); st.className = 'statline ct-st ' + (c || ''); st.innerHTML = t; }
  function ui(){
    draw(); table();
    const adj = S.phase === 'adjust' || S.phase === 'left';
    $$('[data-a]', host).forEach(b => b.disabled = !adj);
    if (S.phase === 'found') status(`<b>1) As-found:</b> اضغط كل نقطة من الخمسة وسجّل القراية زي ما هي <b>قبل أي ظبط</b>. (${Object.keys(S.found).length}/5)`);
    if (S.phase === 'judge'){ status('<b>2) احكم:</b> الترانسميتر As-found جوه السماحية ولا لأ؟'); q('.ct-judge').innerHTML = `<div class="mm-diag"><b>As-found النتيجة:</b><div class="opts"><button type="button" class="btn" data-j="pass">Pass: كله جوه ±${TOL} %</button><button type="button" class="btn" data-j="fail">Fail: محتاج ظبط</button></div></div>`; }
    else q('.ct-judge').innerHTML = '';
    if (S.phase === 'adjust') status('<b>3) الظبط:</b> طبّق <b>0 %</b> واضغط <b>Zero trim</b>، وبعدين طبّق <b>100 %</b> واضغط <b>Span trim</b>.', 'warn');
    if (S.phase === 'left') status(`<b>4) As-left:</b> سجّل الخمس نقط تاني بعد الظبط. (${Object.keys(S.left).length}/5)`, 'warn');
    if (S.phase === 'done') status('<b>تمام:</b> As-left كله جوه السماحية. اكتب التقرير (التاريخ، رقم الكاليبريتور وشهادته، As-found و As-left) والصق ستيكر المعايرة.', 'ok');
  }
  onAct(host, '[data-p]', b => {
    const p = +b.dataset.p; S.applied = p; const v = read(p);
    if (S.phase === 'found'){ S.found[p] = v; if (allIn(S.found)) S.phase = 'judge'; }
    else if (S.phase === 'left'){ S.left[p] = v; if (allIn(S.left)){ if (passes(S.left)){ S.phase = 'done'; fin(); } else { q('.ct-msg').innerHTML = 'لسه فيه نقط برا السماحية. اعمل Zero trim على 0 % و Span trim على 100 % تاني.'; S.left = {}; S.phase = 'adjust'; } } }
    q('.ct-msg').innerHTML = `طبّقت <b class="eq">${fmt(p / 10, 2)} bar</b> والترانسميتر طلّع <b class="eq">${fmt(v, 3)} mA</b> والمفروض <span class="eq">${fmt(ideal(p), 3)} mA</span>.`;
    ui();
  });
  onAct(host, '[data-j]', b => {
    const sayFail = b.dataset.j === 'fail', truth = !passes(S.found);
    if (sayFail === truth){ S.phase = 'adjust'; q('.ct-msg').innerHTML = 'صح: الـ As-found <b>Fail</b>. الزيرو عالي (+0.10 mA = +0.6 %) والسبان واطي. سجّلها زي ما هي في التقرير: الـ As-found بيقول للمهندسين قد إيه الجهاز كان بيغلط في الإنتاج.'; }
    else q('.ct-msg').innerHTML = '<b>بص على عمود الغلط تاني:</b> فيه نقط لونها أحمر يعني برا ±' + TOL + ' %.';
    ui();
  });
  onAct(host, '[data-a]', b => {
    const a = b.dataset.a;
    if (S.applied == null){ q('.ct-msg').textContent = 'طبّق ضغط الأول.'; return; }
    if (a === 'zero'){ if (S.applied !== 0){ q('.ct-msg').innerHTML = '<b>Zero trim</b> بيتعمل والضغط المطبّق = <b>LRV</b> (0 %) بالظبط. طبّق 0 bar الأول.'; return; } S.cal.zero = 0; q('.ct-msg').innerHTML = 'الزيرو اتظبط: 0 bar ⇐ 4.000 mA.'; }
    if (a === 'span'){ if (S.applied !== 100){ q('.ct-msg').innerHTML = '<b>Span trim</b> بيتعمل والضغط = <b>URV</b> (100 %). طبّق 10 bar الأول.'; return; } if (S.cal.zero !== 0){ q('.ct-msg').innerHTML = 'اعمل <b>Zero trim</b> الأول: الظبط بيبدأ بالزيرو لأن غلطه بيدخل في كل النقط.'; return; } S.cal.gain = 0; q('.ct-msg').innerHTML = 'السبان اتظبط: 10 bar ⇐ 20.000 mA. سجّل As-left.'; }
    if (S.cal.zero === 0 && S.cal.gain === 0 && S.phase === 'adjust'){ S.phase = 'left'; S.left = {}; }
    ui();
  });
  ui();
  return {S, apply(p){ host.querySelector(`[data-p="${p}"]`).click(); }, judge(j){ host.querySelector(`[data-j="${j}"]`).click(); }, adj(a){ host.querySelector(`[data-a="${a}"]`).click(); }};
};
IL.FIELD_CASES = [
  {t:'الـ HMI بيقول −25 %', s:'ترانسميتر ضغط ⁦0⁠–⁠10 bar⁩. الشاشة بتعرض <b class="eq">−2.5 bar (−25 %)</b> وفيه إنذار Wire break.', clues:[['الأفوميتر في اللوب', 'التيار <b class="eq">0.00 mA</b>. الجهد على أطراف الترانسميتر <b class="eq">0 V</b>.']], o:['اللوب مفتوح أو مفيش باور', 'الترانسميتر محتاج معايرة', 'نويز على الكابل', 'الرينج في الـ PLC غلط'], a:0, why:'(0 − 4) ÷ 16 = −25 %. صفر تيار وصفر جهد على الترانسميتر = الباور مش واصل. افحص الفيوز والترمنالات.'},
  {t:'القراية واقفة فوق الـ 100 %', s:'ترانسميتر مستوى بيقرا <b class="eq">115 %</b> ثابت حتى والتانك فاضي، بعد مطرة جامدة.', clues:[['الأفوميتر', 'التيار <b class="eq">23.8 mA</b>. علبة الجنكشن اللي في الطريق فيها ميّة.']], o:['قصر في الكابل من الميّة', 'التانك مليان فعلًا', 'قطع في سلك اللوب', 'الشيلد مش متأرّض'], a:0, why:'أكتر من 21 mA وثابت = قصر أو Fail-high. نشّف الجنكشن واعزله وغيّر الجلاند.'},
  {t:'القراية بتتنطط', s:'ترانسميتر حرارة القراية بتتهز ±3 °C كل ثانية والحرارة الحقيقية ثابتة. المشكلة بدأت بعد تركيب إنفرتر جديد.', clues:[['التركيب', 'كابل الإشارة ماشي في نفس الصينية مع كابل الموتور، والشيلد متأرّض من الطرفين.']], o:['نويز و Ground loop في الشيلد', 'الحساس بايظ ومحتاج يتغيّر', 'الرينج غلط', 'الباور ضعيف'], a:0, why:'افصل الكابلات، أرّض الشيلد من طرف واحد (لإشارات ⁦4⁠–⁠20⁩)، واستخدم فلتر في الـ PLC بحدود.'},
  {t:'القراية أقل بنسبة ثابتة', s:'الترانسميتر على شاشته بيقول <b class="eq">8.0 bar</b>، والـ PLC بيعرض <b class="eq">5.0 bar</b>. وعلى 0 الاتنين صفر.', clues:[['البيانات', 'يافطة الترانسميتر: <b class="eq">0–16 bar</b>. بلوك الـ Scale في الـ PLC: <b class="eq">0–10 bar</b>.']], o:['السكيلنج في الـ PLC غلط', 'الترانسميتر محتاج معايرة', 'سلك مرتخي', 'الكارت بايظ'], a:0, why:'8 bar على رينج 16 = 12 mA = 50 %، والـ PLC حوّلها 50 % من 10 = 5. وحّد الرينج.'},
  {t:'الثيرموكبل بيقرا حرارة الغرفة', s:'فرن على 600 °C والشاشة بتعرض <b class="eq">32 °C</b> ثابتة تقريبًا.', clues:[['الفحص', 'لقيت السلكين بتوع الثيرموكبل لامسين بعض جوه علبة جنكشن جنب اللوحة (العزل ساح).']], o:['قصر في سلك الثيرموكبل', 'الـ CJC مقفول', 'نوع الثيرموكبل غلط', 'الثيرموكبل مقطوع'], a:0, why:'الثيرموكبل بيقيس عند أول نقطة السلكين يتلامسوا فيها. القصر عمل "Junction" جديدة على حرارة العلبة.'},
  {t:'PT100 بيقرا أعلى بـ 7 درجات', s:'PT100 على تانك بعيد 120 م، والقراية دايمًا أعلى من الترمومتر اليدوي بحوالي 7 °C.', clues:[['التوصيل', 'الكابل 2×1.5 mm² والجهاز متظبط <b>2 سلك</b>.']], o:['مقاومة السلك في 2 سلك', 'الحساس Class B مش A', 'نويز من الكابل الطويل', 'الـ CJC مقفول'], a:0, why:'كل سلك ≈ 0.0175 × 120 ÷ 1.5 = 1.4 Ω ⇐ السلكين 2.8 Ω ⇐ 2.8 ÷ 0.385 ≈ 7.3 °C. الحل: 3 أو 4 سلك أو ترانسميتر في الراس.'},
  {t:'الميزان بيزحف', s:'ميزان تانك: الصبح بيقرا 0 وهو فاضي، والضهر بيقرا <b class="eq">+35 kg</b> وهو فاضي برضه.', clues:[['الفحص', 'غطا الجنكشن بوكس مكسور ومافيش سيليكا، وفيه ندى جوه. الكابل 4 سلك 80 م في الشمس.']], o:['رطوبة في الجنكشن بوكس', 'لود سيل ناقص', 'المعايرة غلط من الأول', 'الإنديكيتور سريع'], a:0, why:'الرطوبة بتعمل تسريب صغير يغيّر الإشارة، والحرارة بتغيّر مقاومة الكابل في الـ 4 سلك. صلّح العلبة واستخدم 6 سلك.'},
  {t:'العدّاد بيعدّ غلط', s:'مكنة قص: الألواح أطول بـ ⁦3⁠–⁠4⁩ مم بشكل عشوائي. المشكلة بتزيد لما مكنة اللحام اللي جنبها تشتغل.', clues:[['السكوب', IL.scopeTr([{lab:'A', col:'#ffd23f', fn:t => ((t * 29) % 1 < 0.015 ? 0.9 : C.encAB(t * 5).A)}])]], o:['نويز على كابل الإنكودر', 'الإنكودر متركّب بالعكس', 'الـ PPR غلط في الـ PLC', 'العجلة بتزحلق'], a:0, why:'نبضات زيادة من النويز. شيلد وكابل تفاضلي وفصل المسارات.'},
  {t:'المستوى بيقرا زيادة في تانك مقفول', s:'تانك عليه غاز نيتروجين 0.3 bar. ترانسميتر الضغط تحت بيقول المستوى 3 م زيادة عن الزجاجة (Sight glass).', clues:[['الترانسميتر', 'ترانسميتر Gauge عادي، مافيش خط للطرف الواطي.']], o:['بيقيس ضغط الغاز كمان', 'الكثافة اتغيّرت', 'الزجاجة مسدودة', 'الترانسميتر محتاج Zero'], a:0, why:'0.3 bar ≈ 3 م ميّة. الـ DP بيطرح ضغط الغاز.'},
  {t:'القراية ثابتة والضغط بيتغيّر', s:'ترانسميتر ضغط بيقرا <b class="eq">4.2 bar</b> طول الوردية مهما الطلمبة اشتغلت أو وقفت. التيار في اللوب سليم 10.7 mA.', clues:[['الفحص', 'صمام العزل اللي قبل الترانسميتر لقيته مقفول من آخر صيانة.']], o:['صمام العزل مقفول', 'الكارت بايظ', 'نويز على اللوب', 'الباور ضعيف'], a:0, why:'اللوب سليم والإشارة ثابتة = المشكلة في ناحية العملية: صمام، أو خط مسدود أو متجمّد.'}
];

})();

/* قفل الدروس بالترتيب: assets/lesson-gate.js */
;(function(){ if (typeof document === "undefined" || window.LEGate) return; var s = document.createElement("script"); s.src = "/assets/lesson-gate.js?v=20261029g1"; document.head.appendChild(s); })();

/* «المطلوب» والخطوات فوق كل تمرين: assets/instr-tasks.js */
;(function(){ if (typeof document === "undefined" || window.ILTasks) return; var s = document.createElement("script"); s.src = "/assets/instr-tasks.js?v=20261031t1"; document.head.appendChild(s); })();
