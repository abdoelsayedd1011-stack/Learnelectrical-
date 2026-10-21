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
  const upd = () => { const d = isDark(); b.textContent = d ? '☀' : '☾'; b.setAttribute('aria-label', d ? 'الوضع الفاتح' : 'الوضع الغامق'); b.title = b.getAttribute('aria-label'); };
  b.addEventListener('click', () => { PL.store.set('theme', isDark() ? 'light' : 'dark'); applyTheme(); upd(); });
  upd(); return b;
}

/* ---------------- course map ---------------- */
PL.COURSE = [
  {id:'l1', n:1, file:'lesson-01.html', title:'يعني إيه PLC؟', sub:'الفرق بينه وبين دواير الريلاي، دورة السكان، وأجزاءه: CPU والباور وكروت الدخل والخرج، والشركات المشهورة',
    tasks:[['scan','دورة السكان'],['parts','أجزاء الـ PLC'],['quiz','أسئلة الدرس']]},
  {id:'l2', n:2, file:'lesson-02.html', title:'توصيل الـ PLC', sub:'باور 24V DC، الدخل Sinking و Sourcing مع حساسات PNP و NPN، والخرج ريلاي وترانزستور',
    tasks:[['pnp','دخل PNP'],['npn','دخل NPN'],['tr','خرج ترانزستور'],['rly','خرج ريلاي'],['quiz','أسئلة الدرس']]},
  {id:'l3', n:3, file:'lesson-03.html', title:'أول برنامج Ladder', sub:'الكونتاكت NO و NC والكويل، AND و OR، وفخ زرار الـ Stop المتوصّل NC',
    tasks:[['and','دايرة AND'],['or','دايرة OR'],['nc','زرار الـ Stop الـ NC'],['quiz','أسئلة الدرس']]},
  {id:'l4', n:4, file:'lesson-04.html', title:'التثبيت الذاتي والـ Set/Reset', sub:'تشغيل وإيقاف موتور DOL بالتثبيت، الـ Set و Reset، والإنترلوك في عكس الحركة',
    tasks:[['seal','التثبيت الذاتي'],['sr','Set و Reset'],['fr','أمام وخلف بإنترلوك'],['quiz','أسئلة الدرس']]},
  {id:'l5', n:5, file:'lesson-05.html', title:'التايمرات', sub:'TON و TOF و TP، وبرنامج ستار دلتا بالتايمر',
    tasks:[['ton','تايمر TON'],['tof','تايمر TOF'],['sd','ستار دلتا'],['quiz','أسئلة الدرس']]},
  {id:'l6', n:6, file:'lesson-06.html', title:'العدادات والمقارنة', sub:'CTU و CTD، عدّاد التعبئة على السير، وتعليمات المقارنة في جراج العربيات',
    tasks:[['ctu','عداد التعبئة'],['cmp','الجراج والمقارنة'],['quiz','أسئلة الدرس']]},
  {id:'l7', n:7, file:'lesson-07.html', title:'الذاكرة والـ Flags والـ Edge', sub:'بتات الـ M، الـ Rising و Falling edge، وزرار واحد للتشغيل والإيقاف',
    tasks:[['toggle','زرار واحد تشغيل وإيقاف'],['alarm','إنذار بذاكرة'],['quiz','أسئلة الدرس']]},
  {id:'l8', n:8, file:'lesson-08.html', title:'الإشارات الأنالوج في الـ PLC', sub:'من ⁦4⁠–⁠20mA⁩ لـ Raw counts للقيمة الحقيقية، وتانك بإنذارات High و Low وتحكم في الطلمبة',
    tasks:[['scale','تمرين التحويل'],['tank','تحكم التانك'],['quiz','أسئلة الدرس']]},
  {id:'l9', n:9, file:'lesson-09.html', title:'مشاريع عملية', sub:'إشارة مرور، تانك خلط، فرز كراتين على سير، وباب جراج: كل مشروع بماكينة متحركة واختبار أوتوماتيك',
    tasks:[['traffic','إشارة المرور'],['fill','تانك الخلط'],['sort','فرز الكراتين'],['garage','باب الجراج'],['quiz','أسئلة الدرس']]},
  {id:'l10', n:10, file:'lesson-10.html', title:'التربل شوتنج والامتحان النهائي', sub:'المونيتور أونلاين والفورس، أشهر الأخطاء في البرامج، والامتحان النهائي',
    tasks:[['dbl','الكويل المكرر'],['ncfix','منطق الـ NC الغلط'],['sealfix','التثبيت الناقص'],['quiz','أسئلة الدرس'],['final','الامتحان النهائي']]}
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
const iso = s => '⁦' + String(s).replace(/–/g, '⁠–⁠') + '⁩';
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
PL.lesson = function(id){
  const L = PL.lessonById(id); PL.cur = L;
  const ch = $('header.top .chips'); if (ch) ch.appendChild(themeBtn());
  const prog = $('#lprog');
  function renderProg(){
    if (!prog) return;
    const s = PL.summary(id), pct = Math.round(s.done / s.total * 100);
    prog.innerHTML = `<div class="row"><span>تقدّمك في الدرس: <b>${s.done} من ${s.total}</b></span><span class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="التقدّم ${pct}%"><i style="width:${pct}%"></i></span></div><ul>${L.tasks.map(t => `<li class="${PL.has(id, t[0]) ? 'ok' : ''}">${esc(t[1])}</li>`).join('')}</ul>`;
  }
  renderProg(); PL.on(renderProg);
  const nav = $('#lnav');
  if (nav){
    const i = PL.COURSE.indexOf(L), p = PL.COURSE[i - 1], n = PL.COURSE[i + 1];
    nav.innerHTML = (p ? `<a class="btn" href="${p.file}">→ الدرس ${p.n}: ${esc(p.title)}</a>` : `<a class="btn" href="index.html">→ صفحة الكورس</a>`) +
      (n ? `<a class="btn pri" href="${n.file}">الدرس ${n.n}: ${esc(n.title)} ←</a>` : `<a class="btn pri" href="index.html#certSec">الشهادة ←</a>`);
  }
  G.addEventListener('pageshow', e => { if (e.persisted){ PL.store.reload(); renderProg(); } });
};
PL.hubTheme = () => { const ch = $('header.top .chips'); if (ch) ch.appendChild(themeBtn()); };

/* ---------------- quiz ----------------
   qs: [{q, o:[...], a:index, why}] ; opt: {lesson, task, pass(0..1), row, shuffle} */
PL.quiz = function(host, qs, opt){
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
    if (ok && opt.lesson) PL.mark(opt.lesson, opt.task || 'quiz');
    if (opt.onDone) opt.onDone(n, tot, ok);
  }
  start();
  const api = {solve(wrong){ order.forEach((it, k) => { const i = wrong && k === 0 ? it.oi.find(j => j !== it.q.a) : it.q.a; const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }); return $('.qz-sum', host).textContent; }, answer(k, i){ const b = host.querySelector(`.qz[data-k="${k}"] .qz-o[data-i="${i}"]`); if (b) b.click(); }, order: () => order.map(x => x.q), restart: start};
  (PL._q = PL._q || []).push(api); api.host = host; api.opt = opt;
  return api;
};

/* ---------------- drill: a stream of generated questions ---------------- */
PL.drill = function(host, gen, opt){
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
      card.innerHTML = `<div class="dr-q">${cur.q}</div><div class="qz-a${cur.row ? ' row' : ''}">${oi.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${cur.o[i]}</button>`).join('')}</div><p class="qz-f" aria-live="polite"></p>`;
    }
    score();
  }
  function result(good, chosen){
    answered = true; tries++; if (good) ok++;
    const f = $('.qz-f', card); f.className = 'qz-f ' + (good ? 'ok' : 'no');
    f.innerHTML = (good ? 'صح. ' : 'مش مظبوطة. ') + (cur.ans != null && !good ? `الإجابة: <b class="mono">${cur.ans}</b>. ` : '') + (cur.why || '');
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

/* ================= ladder engine (pure, no DOM) =================
   A program is a list of rungs. A rung is a grid: rows (1..3) × cols (contact columns + 1 output column).
   cells[r][c] = null (nothing) | {t:'W'} (wire) | element.  links[r-1] = node positions joined by a vertical
   wire between row r-1 and row r (node c sits on the left edge of column c; node 0 is the left power rail).
   Power is solved left → right: inside one node column the vertical links OR the rows together, then every
   cell passes power to the next node if its element conducts. Output elements live in the last column.
   Scan = read inputs into the image → execute rungs top → bottom (later rungs see what earlier ones wrote) →
   write the output image to the physical outputs. Exactly like a real PLC. */
const ENG = PL.eng = {};
const CONTACTS = ['NO', 'NC', 'P', 'N', 'CMP'];
const OUTS = ['OUT', 'S', 'R', 'TON', 'TOF', 'TP', 'CTU', 'CTD', 'SCL'];
ENG.CONTACTS = CONTACTS; ENG.OUTS = OUTS;
ENG.isOut = t => OUTS.indexOf(t) >= 0;
ENG.isContact = t => CONTACTS.indexOf(t) >= 0 || t === 'W';
const RX = {bit:/^(I|Q|M)(\d{1,2})\.([0-7])$/, tim:/^T(\d{1,2})$/, cnt:/^C(\d{1,2})$/, word:/^(IW|MW)(\d{1,3})$/};
ENG.norm = a => String(a == null ? '' : a).trim().toUpperCase().replace(/\s+/g, '').replace(/,/g, '.');
/* what kind of operand an address is: 'I' 'Q' 'M' 'T' 'C' 'IW' 'MW' or null */
ENG.kind = a => { a = ENG.norm(a); let m; if ((m = RX.bit.exec(a))) return m[1]; if (RX.tim.test(a)) return 'T'; if (RX.cnt.test(a)) return 'C'; if ((m = RX.word.exec(a))) return m[1]; return null; };
/* which operand kinds each element accepts */
ENG.accepts = {NO:['I','Q','M','T','C'], NC:['I','Q','M','T','C'], P:['I','Q','M','T','C'], N:['I','Q','M','T','C'], CMP:['C','T','MW','IW'],
  OUT:['Q','M'], S:['Q','M'], R:['Q','M','T','C'], TON:['T'], TOF:['T'], TP:['T'], CTU:['C'], CTD:['C'], SCL:['IW']};
ENG.CMPOPS = ['>=', '>', '<=', '<', '==', '<>'];
ENG.RAWMAX = 27648; /* Siemens-style full scale for 4–20 mA → 0 … 27648 */

/* 'NO:I0.0' · 'CMP:MW10:>=:80' · 'TON:T0:3' · 'CTU:C0:6' · 'SCL:IW64:MW10:0:100' · '-' wire · '' nothing */
ENG.parse = function(tok){
  if (tok == null || tok === '' || tok === '.') return null;
  if (typeof tok === 'object') return tok;
  if (tok === '-') return {t:'W'};
  const p = String(tok).split(':'), t = p[0].toUpperCase();
  const el = {t, a:ENG.norm(p[1] || '')};
  if (t === 'CMP'){ el.op = p[2] || '>='; el.b = +p[3] || 0; }
  else if (t === 'TON' || t === 'TOF' || t === 'TP') el.pt = p[2] != null ? +p[2] : 3;
  else if (t === 'CTU' || t === 'CTD') el.pv = p[2] != null ? Math.round(+p[2]) : 5;
  else if (t === 'SCL'){ el.o = ENG.norm(p[2] || 'MW10'); el.lo = p[3] != null ? +p[3] : 0; el.hi = p[4] != null ? +p[4] : 100; }
  return el;
};
ENG.tok = function(el){
  if (!el) return '';
  if (el.t === 'W') return '-';
  if (el.t === 'CMP') return `CMP:${el.a}:${el.op}:${el.b}`;
  if (el.pt != null) return `${el.t}:${el.a}:${el.pt}`;
  if (el.pv != null) return `${el.t}:${el.a}:${el.pv}`;
  if (el.t === 'SCL') return `SCL:${el.a}:${el.o}:${el.lo}:${el.hi}`;
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
    if (!el.a || !k){ msgs.push({rung:i, r, c, kind:'addr', text:`رانج ${i + 1}: العنصر ${el.t} محتاج عنوان صح (زي I0.0 أو Q0.0).`}); return; }
    if (ENG.accepts[el.t].indexOf(k) < 0) msgs.push({rung:i, r, c, kind:'operand', text:`رانج ${i + 1}: العنوان ${el.a} مينفعش مع ${el.t}.`});
    if (el.t === 'OUT'){ (coils[el.a] = coils[el.a] || []).push(i + 1); }
    if (el.t === 'SCL' && ENG.kind(el.o) !== 'MW') msgs.push({rung:i, r, c, kind:'operand', text:`رانج ${i + 1}: خرج الـ SCL لازم يبقى MW (زي MW10).`});
  })));
  Object.keys(coils).forEach(a => { const rs = coils[a].filter((v, j, arr) => arr.indexOf(v) === j); if (coils[a].length > 1) msgs.push({kind:'double', addr:a, text:`الكويل ${a} مكتوب ${coils[a].length} مرات (رانج ${rs.join(' و ')}). آخر رانج بس هو اللي بيكسب: ده "Double coil".`}); });
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
    for (let r = 0; r < R; r++){ const el = rg.rows[r][c]; if (!el) continue; const ok = pass(el, r, c); cp[r][c] = ok; pw[r][c + 1] = pw[r][c] && ok; }
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
    return false;
  };
  me.num = function(a){
    const k = ENG.kind(a);
    if (k === 'C') { const c = me.C[a]; return c && c.cv != null ? c.cv : 0; }
    if (k === 'T') return me.T[a] ? me.T[a].et : 0;
    if (k === 'IW') return me.W[a] != null ? me.W[a] : 0;
    if (k === 'MW') return me.W[a] != null ? me.W[a] : 0;
    return me.bit(a) ? 1 : 0;
  };
  /* public read: physical output for Q, image for I */
  me.get = function(a){ a = ENG.norm(a); const k = ENG.kind(a); if (k === 'Q') return me.out[a] ? 1 : 0; if (k === 'IW' || k === 'MW') return me.num(a); return me.bit(a) ? 1 : 0; };
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
      const s = solveRung(rg, (el, r, c) => {
        const k = i + ':' + r + ':' + c;
        switch (el.t){
          case 'W': return true;
          case 'NO': return me.bit(el.a);
          case 'NC': return !me.bit(el.a);
          case 'P': { const v = me.bit(el.a), p = me.edge[k]; me.edge[k] = v; return v && !p; }
          case 'N': { const v = me.bit(el.a), p = me.edge[k]; me.edge[k] = v; return !v && p; }
          case 'CMP': return cmp(me.num(el.a), el.op, el.b);
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
        } return;
        case 'TON': { if (kd !== 'T') return; const t = me.timer(a); t.pt = el.pt; if (en){ t.et = Math.min(el.pt, t.et + dt); t.q = t.et >= el.pt - 1e-9; } else { t.et = 0; t.q = false; } t.pin = en; return; }
        case 'TOF': { if (kd !== 'T') return; const t = me.timer(a); t.pt = el.pt; if (en){ t.q = true; t.et = 0; } else if (t.q){ t.et = Math.min(el.pt, t.et + dt); if (t.et >= el.pt - 1e-9) t.q = false; } t.pin = en; return; }
        case 'TP': { if (kd !== 'T') return; const t = me.timer(a); t.pt = el.pt;
          if (t.run){ t.et = Math.min(el.pt, t.et + dt); if (t.et >= el.pt - 1e-9){ t.run = false; t.q = false; } }
          else if (en && !t.pin){ t.run = true; t.q = true; t.et = 0; }
          else if (!en) t.et = 0;
          t.pin = en; return; }
        case 'CTU': case 'CTD': { if (kd !== 'C') return; const c = me.counter(a);
          if (c.cv == null) c.cv = el.t === 'CTD' && !me.up[a] ? el.pv : 0;
          if (el.t === 'CTU' || !me.up[a]) c.pv = el.pv;
          if (me._seedCin && me.cin[k] == null) me.cin[k] = en;
          const p = !!me.cin[k]; me.cin[k] = en;
          if (en && !p) c.cv = el.t === 'CTU' ? Math.min(32767, c.cv + 1) : Math.max(0, c.cv - 1);
          c.q = me.up[a] ? c.cv >= c.pv && c.pv > 0 : c.cv <= 0; return; }
        case 'SCL': if (en && ENG.kind(el.o) === 'MW'){ const raw = me.num(a); me.W[el.o] = el.lo + clamp(raw, 0, ENG.RAWMAX) / ENG.RAWMAX * (el.hi - el.lo); } return;
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
    if (st.until){ const n = Math.round((st.max || 30) / dt); let ok = false; for (let i = 0; i < n; i++){ if (st.until(ctx)){ ok = true; break; } if (!step1()) break; } if (fail) break; if (!ok){ fail = st.msg || 'الماكينة موصلتش للحالة المطلوبة في الوقت المتوقع.'; break; } }
    if (st.exp){
      const bad = Object.keys(st.exp).filter(a => (e.get(a) ? 1 : 0) !== (st.exp[a] ? 1 : 0));
      if (bad.length){ fail = (st.msg || 'النتيجة مش زي المطلوب.') + ' ' + bad.map(a => `المتوقع ${a} = ${st.exp[a] ? 1 : 0} لكن طلع ${e.get(a) ? 1 : 0}.`).join(' '); break; }
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
const lampSvg = (x, y, r, col, lit) => `<circle cx="${x}" cy="${y}" r="${r + 3}" fill="#2a3035"/><circle cx="${x}" cy="${y}" r="${r}" fill="${lit ? col : '#4a5257'}"${lit ? ` class="glowc" style="--gc:${col}"` : ''}/>${lit ? `<circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.28}" fill="#fff" opacity=".55"/>` : ''}`;
PL.lampSvg = lampSvg;
const LCOL = {red:'#ff4a3d', green:'#2fd35a', yellow:'#ffc21a', white:'#f4f1e6', blue:'#3a9bff', amber:'#ff9a1a'};
PL.LCOL = LCOL;
/* a motor seen from the fan end; ang in degrees */
function motorSvg(x, y, s, ang, run, col){
  const blades = [0, 72, 144, 216, 288].map(a => `<path d="M0 0 L${(s * 0.42).toFixed(1)} -${(s * 0.1).toFixed(1)} L${(s * 0.42).toFixed(1)} ${(s * 0.1).toFixed(1)}Z" transform="rotate(${a})" fill="#cfd6db"/>`).join('');
  return `<g transform="translate(${x} ${y})"><rect x="${-s * 0.62}" y="${s * 0.5}" width="${s * 1.24}" height="${s * 0.14}" rx="2" fill="#5d6469"/><circle r="${s * 0.56}" fill="${col || '#2f6fb3'}" stroke="#1d3f66" stroke-width="2"/><circle r="${s * 0.46}" fill="#22272b"/><g transform="rotate(${ang.toFixed(1)})">${blades}</g><circle r="${s * 0.09}" fill="#8a949b"/>${run ? `<circle r="${s * 0.62}" fill="none" stroke="#2fd35a" stroke-width="2.5" stroke-dasharray="4 5" opacity=".9"/>` : ''}</g>`;
}
PL.motorSvg = motorSvg;
function contactorSvg(x, y, lbl, onv, sub){
  return `<g transform="translate(${x} ${y})"><rect x="-17" y="-22" width="34" height="44" rx="4" fill="#d9dde0" stroke="#7b858c"/><rect x="-12" y="-6" width="24" height="12" rx="2" fill="${onv ? '#2b7a3d' : '#5d6469'}"/><rect x="-6" y="${onv ? -4 : -10}" width="12" height="4" fill="#ffd400"/>${[-10, 0, 10].map(dx => `<circle cx="${dx}" cy="-16" r="2.4" fill="#9aa3a8"/><circle cx="${dx}" cy="16" r="2.4" fill="#9aa3a8"/>`).join('')}${svgT(0, 36, lbl, 'pt pc ar', 'middle')}${sub ? svgT(0, 48, sub, 'pt pm', 'middle') : ''}</g>`;
}

/* ---- generic loads: one tile per output ---- */
PL.loadsSvg = function(outs, e, st){
  const n = outs.length, w = 90, W = Math.max(270, n * w), H = 112;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="الأحمال">`;
  outs.forEach((o, i) => {
    const cx = (W - n * w) / 2 + i * w + w / 2, v = on(e, o.a);
    if (o.kind === 'motor' || o.kind === 'fan') s += motorSvg(cx, 46, 52, st.ang[o.a] || 0, v, o.kind === 'fan' ? '#5a6b78' : null);
    else if (o.kind === 'horn') s += `<g transform="translate(${cx} 46)"><path d="M-18 -10h10l16 -14v48l-16 -14h-10z" fill="#c9a43a" stroke="#6b5200"/>${v ? '<path d="M14 -12q8 12 0 24M20 -18q12 18 0 36" fill="none" stroke="#ff9a1a" stroke-width="3"/>' : ''}</g>`;
    else if (o.kind === 'valve') s += `<g transform="translate(${cx} 46)"><rect x="-30" y="6" width="60" height="12" fill="#8a949b"/><path d="M-14 0L14 24V0L-14 24Z" fill="${v ? '#2b7a3d' : '#7b858c'}" stroke="#2a3035"/><rect x="-9" y="-26" width="18" height="22" rx="3" fill="#2a3035"/>${svgT(0, -12, v ? 'ON' : 'OFF', 'pt pw', 'middle')}</g>`;
    else if (o.kind === 'heater') s += `<g transform="translate(${cx} 46)"><path d="M-24 10q6-20 12 0t12 0t12 0t12 0" fill="none" stroke="${v ? '#ff5b2a' : '#7b858c'}" stroke-width="5" stroke-linecap="round"/>${v ? '<path d="M-14 -6q-4-10 2-18M0 -6q-4-10 2-18M14 -6q-4-10 2-18" fill="none" stroke="#ff9a1a" stroke-width="2.5" opacity=".8"/>' : ''}</g>`;
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
    return `<svg viewBox="0 0 360 150" role="img" aria-label="موتور أمام وخلف">${contactorSvg(60, 40, 'KM1 أمام', f, 'Q0.0')}${contactorSvg(130, 40, 'KM2 خلف', r, 'Q0.1')}${motorSvg(260, 62, 70, st.ang, f || r)}
      ${Math.abs(st.dir) > 0.05 ? `<path d="${st.dir > 0 ? 'M228 12a40 40 0 0 1 64 0' : 'M292 12a40 40 0 0 0 -64 0'}" fill="none" stroke="#2fd35a" stroke-width="3" marker-end="url(#pa)"/>` : ''}
      <defs><marker id="pa" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#2fd35a"/></marker></defs>
      ${svgT(260, 142, st.dir > 0.05 ? 'أمام ⟳' : st.dir < -0.05 ? 'خلف ⟲' : 'واقف', 'pt pc ar', 'middle')}
      ${bad || st.everShort ? `<g transform="translate(95 120)"><rect x="-90" y="-14" width="180" height="26" rx="6" fill="#c0352b"/>${svgT(0, 4, bad ? '⚡ قصر بين الفازات! الاتنين شغالين' : '⚡ حصل قصر قبل كده', 'pt pw ar', 'middle')}</g>` : ''}</svg>`;
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
    const lab = {off:'واقف', star:'ستار Y: تيار البدء قليل', delta:'دلتا Δ: سرعة كاملة', open:'KM1 بس: الموتور مش متوصّل', short:'⚡ قصر! ستار ودلتا مع بعض'}[st.mode];
    return `<svg viewBox="0 0 360 150" role="img" aria-label="ستار دلتا">${contactorSvg(40, 36, 'KM1', on(e, 'Q0.0'), 'Q0.0')}${contactorSvg(100, 36, 'KM2 Δ', on(e, 'Q0.1'), 'Q0.1')}${contactorSvg(160, 36, 'KM3 Y', on(e, 'Q0.2'), 'Q0.2')}${motorSvg(275, 58, 70, st.ang, st.spd > 0.05)}
      <rect x="20" y="96" width="180" height="10" rx="5" fill="#4a5257"/><rect x="20" y="96" width="${(180 * st.spd).toFixed(1)}" height="10" rx="5" fill="#2fd35a"/>${svgT(110, 124, 'السرعة ' + Math.round(st.spd * 100) + '%', 'pt pc ar', 'middle')}
      <g transform="translate(180 142)">${st.short || st.mode === 'short' ? `<rect x="-170" y="-13" width="340" height="20" rx="5" fill="#c0352b"/>${svgT(0, 2, '⚡ حصل قصر: KM2 و KM3 اشتغلوا مع بعض', 'pt pw ar', 'middle')}` : svgT(0, 2, lab, 'pt pc ar', 'middle')}</g></svg>`;
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
    let s = `<svg viewBox="0 0 360 150" role="img" aria-label="سير التعبئة"><rect x="0" y="86" width="296" height="14" rx="7" fill="#3b4247"/>`;
    for (let x = -20 + st.belt; x < 296; x += 20) s += `<rect x="${x.toFixed(1)}" y="88" width="8" height="10" fill="#555d63"/>`;
    s += `<circle cx="8" cy="93" r="7" fill="#8a949b"/><circle cx="288" cy="93" r="7" fill="#8a949b"/>`;
    st.boxes.forEach(b => { if (b.x > -30) s += `<rect x="${(b.x - 11).toFixed(1)}" y="64" width="22" height="22" rx="2" fill="#c98a3c" stroke="#7a4f17"/><path d="M${(b.x - 11).toFixed(1)} 72h22" stroke="#e4c08a" stroke-width="3"/>`; });
    const eye = !!e.phys['I0.2'];
    s += `<rect x="244" y="36" width="12" height="18" rx="2" fill="#2a3035"/><path d="M250 54V86" stroke="${eye ? '#ff4a3d' : '#ff8a80'}" stroke-width="2" stroke-dasharray="4 3" opacity="${eye ? 1 : .55}"/>${svgT(250, 30, 'I0.2', 'pt pm', 'middle')}`;
    /* carton */
    const full = st.carton;
    s += `<path d="M300 106h52v38h-52z" fill="#b07b3c" stroke="#6b4a1e"/><path d="M300 106l-10 -10M352 106l10 -10" stroke="#6b4a1e" stroke-width="3"/>`;
    for (let i = 0; i < Math.min(full, 8); i++) s += `<rect x="${304 + (i % 4) * 12}" y="${132 - Math.floor(i / 4) * 12}" width="10" height="10" fill="${i >= 6 ? '#c0352b' : '#c98a3c'}" stroke="#7a4f17"/>`;
    s += svgT(326, 124 - (full > 4 ? 14 : 0), full + '/6', 'pt pc', 'middle');
    s += motorSvg(28, 122, 30, st.belt * 18, on(e, 'Q0.0')) + svgT(60, 126, 'M Q0.0', 'pt pm');
    s += lampSvg(24, 24, 11, LCOL.green, on(e, 'Q0.1')) + svgT(42, 22, 'الكرتونة كملت', 'pt pc ar') + svgT(42, 34, 'Q0.1', 'pt pm');
    if (st.over) s += `<rect x="96" y="116" width="200" height="22" rx="5" fill="#c0352b"/>${svgT(196, 131, 'الكرتونة اتملت زيادة عن 6!', 'pt pw ar', 'middle')}`;
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
    let s = `<svg viewBox="0 0 360 150" role="img" aria-label="جراج"><rect x="10" y="20" width="230" height="120" rx="8" fill="#3b4247"/>`;
    for (let k = 0; k < 6; k++){ const x = 22 + (k % 3) * 72, y = 30 + Math.floor(k / 3) * 56; s += `<rect x="${x}" y="${y}" width="62" height="46" rx="4" fill="none" stroke="#e8e2c8" stroke-dasharray="5 4"/>`; if (k < st.cars) s += `<g transform="translate(${x + 31} ${y + 23})"><rect x="-22" y="-13" width="44" height="26" rx="8" fill="${['#c0352b', '#2f6fb3', '#e3a43a', '#5cc06f', '#9b59b6', '#ddd'][k]}"/><rect x="-12" y="-10" width="24" height="20" rx="4" fill="#bcd3e6" opacity=".8"/></g>`; }
    s += svgT(125, 14, 'عربيات جوه: ' + st.cars + (st.cars > 5 ? ' (زحمة!)' : ''), 'pt pc ar', 'middle');
    s += `<rect x="262" y="20" width="84" height="120" rx="10" fill="#2a3035"/>${lampSvg(304, 54, 18, LCOL.green, on(e, 'Q0.0'))}${lampSvg(304, 104, 18, LCOL.red, on(e, 'Q0.1'))}`;
    s += svgT(304, 82, 'فاضي Q0.0', 'pt pw ar', 'middle') + svgT(304, 134, 'كامل Q0.1', 'pt pw ar', 'middle');
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
  ctl:[{id:'use', label:st => st.use ? 'اقفل الاستهلاك' : 'افتح الاستهلاك', act:st => { st.use = !st.use; }},
       {id:'brk', label:st => st.broken ? 'رجّع سلك الترانسميتر' : 'اقطع سلك الترانسميتر', act:st => { st.broken = !st.broken; }}],
  svg(st, e){
    const h = 100, top = 22, y = top + h * (1 - st.level / 100), lv = st.level;
    let s = `<svg viewBox="0 0 360 172" role="img" aria-label="تانك بمستوى أنالوج">`;
    s += `<rect x="120" y="${top}" width="110" height="${h}" rx="6" fill="#d9e3ea" stroke="#6b757c" stroke-width="2"/>`;
    s += `<path d="M122 ${y.toFixed(1)} q14 ${(3 * Math.sin(st.wave)).toFixed(1)} 27 0 t27 0 t27 0 t27 0 V${top + h - 2} H122Z" fill="#3a8fd8" opacity=".85"/>`;
    [[90, 'H'], [80, 'stop'], [20, 'start'], [10, 'L']].forEach(([p, t]) => { const yy = top + h * (1 - p / 100); s += `<path d="M232 ${yy}h10" stroke="#8a949b"/>${svgT(244, yy + 4, p + '%', 'pt pm')}`; });
    s += `<rect x="96" y="${top + 6}" width="18" height="34" rx="3" fill="#2a3035"/>${svgT(105, top + 24, 'LT', 'pt pw', 'middle')}<path d="M114 ${top + 20}h6" stroke="#2a3035" stroke-width="3"/>`;
    /* pump & pipes */
    s += `<path d="M40 140h50V${top + 8}h30" fill="none" stroke="#8a949b" stroke-width="6"/>${motorSvg(40, 132, 28, (st.wave * 120) % 360, on(e, 'Q0.0'))}${svgT(40, 158, 'طلمبة Q0.0', 'pt pc ar', 'middle')}`;
    s += `<path d="M175 ${top + h}v18h120" fill="none" stroke="#8a949b" stroke-width="6"/>${st.use ? `<path d="M295 ${top + h + 18}v14" stroke="#3a8fd8" stroke-width="4" stroke-dasharray="3 3"/>` : ''}${svgT(296, top + h + 46, st.use ? 'استهلاك شغال' : 'الاستهلاك مقفول', 'pt pc ar', 'middle')}`;
    s += `<g transform="translate(300 30)">${lampSvg(0, 0, 10, LCOL.red, on(e, 'Q0.1'))}${svgT(16, 0, 'High', 'pt pc')}${svgT(16, 11, 'Q0.1', 'pt pm')}</g><g transform="translate(300 66)">${lampSvg(0, 0, 10, LCOL.amber, on(e, 'Q0.2'))}${svgT(16, 0, 'Low', 'pt pc')}${svgT(16, 11, 'Q0.2', 'pt pm')}</g>`;
    s += `<rect x="128" y="${top + h + 22}" width="94" height="16" rx="3" fill="#c7d3b4"/>${svgT(175, top + h + 34, st.broken ? '0.0 mA ⚠' : PL.fmt(st.mA || 4, 1) + ' mA · ' + Math.round(lv) + '%', 'pt pl', 'middle')}`;
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
    let s = `<svg viewBox="0 0 360 150" role="img" aria-label="إشارة مرور"><rect x="0" y="108" width="360" height="34" fill="#3b4247"/><path d="M0 125h360" stroke="#e8e2c8" stroke-width="2" stroke-dasharray="14 10"/><rect x="186" y="104" width="8" height="40" fill="#e8e2c8" opacity=".7"/>`;
    s += `<rect x="226" y="40" width="6" height="70" fill="#5d6469"/><rect x="210" y="4" width="38" height="96" rx="8" fill="#22272b"/>${lampSvg(229, 22, 11, LCOL.red, on(e, 'Q0.0'))}${lampSvg(229, 52, 11, LCOL.yellow, on(e, 'Q0.1'))}${lampSvg(229, 82, 11, LCOL.green, on(e, 'Q0.2'))}`;
    s += `<g transform="translate(${st.carX.toFixed(1)} 114)"><rect x="-26" y="-2" width="52" height="16" rx="5" fill="#2f6fb3"/><rect x="-16" y="-12" width="30" height="12" rx="4" fill="#5d8fc9"/><circle cx="-14" cy="14" r="5" fill="#111"/><circle cx="14" cy="14" r="5" fill="#111"/></g>`;
    s += svgT(110, 28, 'R Q0.0 · Y Q0.1 · G Q0.2', 'pt pm', 'middle');
    if (st.cur === 'X') s += `<rect x="20" y="40" width="170" height="22" rx="5" fill="#c0352b"/>${svgT(105, 55, 'أكتر من لمبة منوّرة!', 'pt pw ar', 'middle')}`;
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
    let s = `<svg viewBox="0 0 360 160" role="img" aria-label="تانك خلط"><rect x="120" y="${top}" width="110" height="${h}" rx="6" fill="#d9e3ea" stroke="#6b757c" stroke-width="2"/><rect x="122" y="${y.toFixed(1)}" width="106" height="${Math.max(0, top + h - y - 1).toFixed(1)}" fill="#8e5bd8" opacity=".75"/>`;
    s += `<path d="M175 6V${top + 70}" stroke="#5d6469" stroke-width="4"/><g transform="translate(175 ${top + 74}) scale(${Math.cos(st.ang * Math.PI / 180).toFixed(2)} 1)"><path d="M-30 -4h60v8h-60z" fill="#8a949b"/></g><rect x="160" y="0" width="30" height="14" rx="3" fill="#2f6fb3"/>${svgT(175, 11, 'M', 'pt pw', 'middle')}`;
    [[90, 'I0.3 High'], [10, 'I0.2 Low']].forEach(([p, t], k) => { const yy = top + h * (1 - p / 100), lit = k ? st.level > 10 : st.level >= 90; s += `<rect x="228" y="${yy - 5}" width="16" height="10" rx="2" fill="${lit ? '#2fd35a' : '#4a5257'}"/>${svgT(250, yy + 4, t, 'pt pm')}`; });
    s += `<path d="M20 ${top + 6}h100" stroke="${on(e, 'Q0.0') ? '#8e5bd8' : '#8a949b'}" stroke-width="6"/><g transform="translate(70 ${top + 6})"><path d="M-10 -9L10 9V-9L-10 9Z" fill="${on(e, 'Q0.0') ? '#2b7a3d' : '#7b858c'}" stroke="#2a3035"/></g>${svgT(70, top - 8, 'ملو Q0.0', 'pt pc ar', 'middle')}`;
    s += `<path d="M175 ${top + h}v14h120" stroke="${on(e, 'Q0.2') ? '#8e5bd8' : '#8a949b'}" stroke-width="6" fill="none"/><g transform="translate(250 ${top + h + 14})"><path d="M-10 -9L10 9V-9L-10 9Z" fill="${on(e, 'Q0.2') ? '#2b7a3d' : '#7b858c'}" stroke="#2a3035"/></g>${svgT(250, top + h + 34, 'تفريغ Q0.2', 'pt pc ar', 'middle')}`;
    s += `<g transform="translate(46 100)">${lampSvg(0, 0, 11, LCOL.green, on(e, 'Q0.3'))}${svgT(0, 26, 'خلص Q0.3', 'pt pc ar', 'middle')}</g>`;
    s += svgT(175, top + h - 8, Math.round(st.level) + '%', 'pt pc', 'middle');
    if (st.over) s += `<rect x="100" y="134" width="160" height="20" rx="5" fill="#c0352b"/>${svgT(180, 148, 'التانك فاض!', 'pt pw ar', 'middle')}`;
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
    let s = `<svg viewBox="0 0 360 160" role="img" aria-label="سير فرز"><rect x="0" y="96" width="350" height="14" rx="7" fill="#3b4247"/>`;
    for (let x = -20 + st.belt; x < 350; x += 20) s += `<rect x="${x.toFixed(1)}" y="98" width="8" height="10" fill="#555d63"/>`;
    s += `<rect x="226" y="122" width="52" height="34" fill="#4a5257" stroke="#2a3035"/>${svgT(252, 140, 'الطوال', 'pt pw ar', 'middle')}`;
    st.boxes.forEach(b => { const h = b.tall ? 40 : 20, x = b.x, yb = 96 + (b.off ? Math.min(40, b.off) : 0); s += `<rect x="${(x - 11).toFixed(1)}" y="${(yb - h).toFixed(1)}" width="22" height="${h}" rx="2" fill="${b.tall ? '#2f6fb3' : '#c98a3c'}" stroke="#2a3035" opacity="${b.off ? Math.max(0, 1 - b.off / 40).toFixed(2) : 1}"/>`; });
    const h1 = !!e.phys['I0.1'], h2 = !!e.phys['I0.2'];
    s += `<rect x="100" y="40" width="10" height="16" rx="2" fill="#2a3035"/><path d="M110 50H140" stroke="${h1 ? '#ff4a3d' : '#ff8a80'}" stroke-width="2" stroke-dasharray="4 3" opacity="${h1 ? 1 : .5}"/>${svgT(120, 34, 'I0.1 طول', 'pt pm ar', 'middle')}`;
    s += `<rect x="296" y="72" width="10" height="16" rx="2" fill="#2a3035"/><path d="M296 80H262" stroke="${h2 ? '#ff4a3d' : '#ff8a80'}" stroke-width="2" stroke-dasharray="4 3" opacity="${h2 ? 1 : .5}"/>${svgT(301, 66, 'I0.2', 'pt pm', 'middle')}`;
    const py = 60 + st.push * 26;
    s += `<rect x="236" y="26" width="28" height="14" fill="#5d6469"/><rect x="246" y="40" width="8" height="${(py - 40).toFixed(1)}" fill="#cfd6db"/><rect x="236" y="${py.toFixed(1)}" width="28" height="6" fill="${on(e, 'Q0.1') ? '#e3a43a' : '#8a949b'}"/>${svgT(250, 20, 'دفّاع Q0.1', 'pt pm ar', 'middle')}`;
    const okc = st.res.filter(r => r.tall === r.pushed).length, bad = st.res.length - okc;
    s += svgT(10, 146, `صح ${okc} · غلط ${bad}`, 'pt pc ar') + motorSvg(330, 134, 26, st.belt * 18, on(e, 'Q0.0'));
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
  ctl:[{id:'obst', label:st => st.obst ? 'شيل العربية من تحت الباب' : 'حط عربية تحت الباب', act:st => { st.obst = !st.obst; }}],
  svg(st, e){
    const open = st.pos / 100, dh = 96 * (1 - open);
    let s = `<svg viewBox="0 0 360 160" role="img" aria-label="باب جراج"><rect x="60" y="14" width="200" height="120" fill="#5d6469"/><rect x="72" y="26" width="176" height="108" fill="#22272b"/>`;
    if (st.obst) s += `<g transform="translate(160 118)"><rect x="-48" y="-8" width="96" height="22" rx="7" fill="#c0352b"/><rect x="-28" y="-22" width="54" height="16" rx="5" fill="#d9534f"/><circle cx="-28" cy="14" r="7" fill="#111"/><circle cx="28" cy="14" r="7" fill="#111"/></g>`;
    for (let k = 0; k * 12 < dh; k++){ const y = 26 + dh - (k + 1) * 12; if (y < 26 - 1) break; s += `<rect x="72" y="${Math.max(26, y).toFixed(1)}" width="176" height="${(Math.min(12, y + 12 - 26)).toFixed(1)}" fill="#b8c2c9" stroke="#6b757c"/>`; }
    s += `<path d="M72 128h-8M248 128h8" stroke="${st.obst ? '#ff4a3d' : '#ff8a80'}" stroke-width="3"/><path d="M76 128H244" stroke="#ff4a3d" stroke-width="1.5" stroke-dasharray="4 4" opacity="${st.obst ? 1 : .35}"/>${svgT(160, 150, 'عين I0.5', 'pt pm ar', 'middle')}`;
    s += `<rect x="264" y="20" width="8" height="10" fill="${st.pos >= 99.5 ? '#2fd35a' : '#4a5257'}"/>${svgT(276, 29, 'I0.3 فوق', 'pt pm ar')}<rect x="264" y="122" width="8" height="10" fill="${st.pos <= 0.5 ? '#2fd35a' : '#4a5257'}"/>${svgT(276, 131, 'I0.4 تحت', 'pt pm ar')}`;
    const mv = on(e, 'Q0.0') || on(e, 'Q0.1');
    s += lampSvg(30, 30, 10, LCOL.amber, on(e, 'Q0.2') && (st.flash < 0.6 || !mv)) + svgT(30, 54, 'Q0.2', 'pt pm', 'middle');
    s += svgT(30, 84, on(e, 'Q0.0') ? '▲ Q0.0' : on(e, 'Q0.1') ? '▼ Q0.1' : '■', 'pt pc', 'middle') + svgT(310, 84, Math.round(st.pos) + '%', 'pt pc', 'middle');
    if (st.crush || st.short) s += `<rect x="70" y="56" width="180" height="24" rx="5" fill="#c0352b"/>${svgT(160, 72, st.short ? '⚡ فوق وتحت مع بعض!' : 'الباب نزل على العربية!', 'pt pw ar', 'middle')}`;
    return s + '</svg>';
  }
};

/* ================= ladder editor + simulator (PL.sim) =================
   opt: {lesson, exercises:[{key, title, task, io:{inputs:[{a,label,kind}], outputs:[{a,label,kind,color}]},
         plant, plantOpt, start, sol, hint, tests | cases:[{name, steps}]}], force:bool, cols} */
const CW = 60, RH = 64, PADL = 12, PADR = 12;
const EL_LABEL = {W:'سلك', NO:'كونتاكت NO', NC:'كونتاكت NC', P:'Edge ↑ (P)', N:'Edge ↓ (N)', CMP:'مقارنة', OUT:'كويل', S:'Set', R:'Reset', TON:'TON', TOF:'TOF', TP:'TP', CTU:'CTU', CTD:'CTD', SCL:'Scale'};
const EL_HELP = {
  NO:'بيوصّل لما البت = 1', NC:'بيوصّل لما البت = 0', P:'بيوصّل سكان واحد بس لما البت يتغيّر من 0 لـ 1', N:'بيوصّل سكان واحد لما البت يتغيّر من 1 لـ 0',
  CMP:'بيوصّل لو المقارنة صح', OUT:'البت = الكهربا الداخلة عليه', S:'لو جاله كهربا البت يبقى 1 ويفضل 1', R:'لو جاله كهربا البت يبقى 0 (وعلى T أو C بيصفّرهم)',
  TON:'تأخير في التشغيل', TOF:'تأخير في الفصل', TP:'نبضة بطول ثابت', CTU:'عدّاد طالع', CTD:'عدّاد نازل', SCL:'يحوّل الـ raw لقيمة حقيقية', W:'خط بيوصّل على طول'};

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
  let s = `<svg viewBox="0 0 ${W} ${H}" class="ls-svg" role="group" aria-label="رانج ${i + 1}">`;
  s += `<path d="M${PADL - 1} 2V${H - 2}" class="lrail${K.running ? ' pw' : ''}"/><path d="M${W - PADR + 1} 2V${H - 2}" class="lrail"/>`;
  for (let r = 0; r < R; r++){
    const y = r * RH + 2;
    for (let c = 0; c < K.cols; c++){
      const x = PADL + c * CW, el = rg.rows[r][c], isSel = K.sel && K.sel.i === i && K.sel.r === r && K.sel.c === c;
      s += cellSvg(K, el, x, y, r, c, rg, i, pw);
      if (!el && !isSel && K.hit) s += `<rect x="${x + 6}" y="${y + 20}" width="${CW - 12}" height="28" rx="4" class="lph"/>`;
      if (K.hit) s += `<rect x="${x + 1}" y="${y + 1}" width="${CW - 2}" height="${RH - 2}" rx="6" class="lhit${isSel ? ' sel' : ''}" data-i="${i}" data-r="${r}" data-c="${c}" tabindex="0" role="button" aria-label="رانج ${i + 1}، صف ${r + 1}، خانة ${c + 1}: ${el ? esc(EL_LABEL[el.t] + ' ' + (el.a || '')) : 'فاضية'}"/>`;
    }
    if (rg.rows[r][K.cols - 1] || r === 0) { const y2 = y + 34; s += `<path d="M${PADL + K.cols * CW - 1} ${y2}H${W - PADR + 1}" class="lw"/>`; }
  }
  for (let r = 1; r < R; r++) rg.links[r - 1].forEach(n => { const x = PADL + n * CW, on = pw && pw.pw[r][n] && pw.pw[r - 1][n]; s += `<path d="M${x} ${(r - 1) * RH + 36}V${r * RH + 36}" class="lw lv2${on ? ' pw' : ''}"/>`; });
  return s + '</svg>';
}
PL.drawRung = drawRung;
/* static ladder figure in the lesson text: PL.ladFig(el, def, {labels:{I0.0:'Start'}}) */
PL.ladFig = function(el, def, o){ o = o || {}; const cols = o.cols || 5, prog = ENG.program(def, cols), lb = o.labels || {}; el.classList.add('ladfig'); el.innerHTML = prog.map((rg, i) => drawRung(rg, i, {cols, running:false, e:null, sel:null, lab:a => lb[a] || '', hit:false})).join(''); };

PL.sim = function(host, opt){
  const cols = opt.cols || 5, exs = opt.exercises;
  let ex, prog, e, plantSt, running = false, sel = null, acc = 0, rdT = 0, forceMode = false, lastRes = null, backup = null;
  const forces = {};
  const pressed = {}; /* push-button hold state */
  const saveKey = () => opt.lesson + '/' + ex.key;

  host.classList.add('ls');
  host.innerHTML = `${exs.length > 1 ? '<div class="tabs ls-tabs" role="group" aria-label="التمارين"></div>' : ''}
    <div class="chal ls-task"></div>
    <div class="ls-view"><div class="wd-art ls-plant"></div><div class="ls-pctl"></div><div class="ls-io" role="group" aria-label="المداخل: زراير وسويتشات"></div><div class="ls-leds" aria-label="لمبات الـ PLC"></div></div>
    <div class="ls-bar"><button type="button" class="btn ls-run" aria-pressed="false">▶ RUN</button><button type="button" class="btn pri ls-chk">✓ اختبر البرنامج</button>${opt.force ? '<button type="button" class="btn ls-frc" aria-pressed="false">Force</button>' : ''}</div>
    <div class="ls-res" aria-live="polite" hidden></div>
    <div class="ls-lad" dir="ltr"></div>
    <div class="ls-tools"><button type="button" class="btn" data-t="add">+ رانج جديد</button><button type="button" class="btn" data-t="hint">تلميح</button><button type="button" class="btn" data-t="reset">ابدأ من الأول</button><button type="button" class="btn" data-t="sol" hidden>اعرض الحل</button><button type="button" class="btn" data-t="undo" hidden>رجّع برنامجي</button></div>
    <div class="ls-hint box" hidden></div>
    <div class="ls-lint" aria-live="polite"></div>`;
  const tabs = $('.ls-tabs', host), task = $('.ls-task', host), plantBox = $('.ls-plant', host), pctl = $('.ls-pctl', host), ioBox = $('.ls-io', host), leds = $('.ls-leds', host);
  const runB = $('.ls-run', host), chkB = $('.ls-chk', host), frcB = $('.ls-frc', host), resBox = $('.ls-res', host), lad = $('.ls-lad', host), hintBox = $('.ls-hint', host), lintBox = $('.ls-lint', host);
  const P = () => PL.plants[ex.plant || 'loads'];

  function defIn(i){ return i.kind === 'pbnc' || i.kind === 'ncsw' ? 1 : 0; }
  function physFor(i){ if (i.kind === 'pb' || i.kind === 'pbnc') return pressed[i.a] ? 1 - defIn(i) : defIn(i); if (i.kind === 'sw' || i.kind === 'sensor' || i.kind === 'ncsw') return i.state != null ? i.state : defIn(i); return null; }

  function freshEngine(){
    e = new ENG.Engine(prog, {cols});
    Object.assign(e.force, forces);
    (ex.io.inputs || []).forEach(i => { const v = physFor(i); if (v != null) e.setIn(i.a, v); });
  }
  function select(k){
    stop();
    ex = exs[k]; sel = null; lastRes = null; backup = null;
    const saved = PL.progs.get(saveKey());
    prog = ENG.program(saved || ex.start || [ENG.serialize([ENG.blankRung(cols)])[0]], cols);
    if (!prog.length) prog = [ENG.blankRung(cols)];
    (ex.io.inputs || []).forEach(i => { i.state = defIn(i); pressed[i.a] = false; });
    Object.keys(forces).forEach(a => delete forces[a]);
    plantSt = P().create(ex.plantOpt);
    freshEngine();
    task.innerHTML = ex.task; task.classList.toggle('ok', PL.has(opt.lesson, ex.key));
    hintBox.hidden = true; hintBox.innerHTML = ex.hint || '';
    $('[data-t=hint]', host).hidden = !ex.hint;
    $('[data-t=sol]', host).hidden = !(ex.sol && PL.has(opt.lesson, ex.key));
    $('[data-t=undo]', host).hidden = true;
    resBox.hidden = true;
    if (tabs) tabs.innerHTML = exs.map((x, j) => `<button type="button" class="btn${PL.has(opt.lesson, x.key) ? ' done' : ''}" data-k="${j}" aria-pressed="${j === k}">${esc(x.title)}</button>`).join('');
    renderIO(); pctlRender(); renderAll();
  }
  function changed(){
    PL.progs.set(saveKey(), ENG.serialize(prog));
    if (running) e.setProgram(prog, true); else e.setProgram(prog);
    renderLadder(); renderLint();
  }

  /* ---------- I/O panel ---------- */
  function renderIO(){
    const ins = (ex.io.inputs || []).filter(i => i.kind !== 'auto');
    ioBox.innerHTML = ins.map(i => {
      const k = i.kind, isPb = k === 'pb' || k === 'pbnc';
      const col = i.color || (k === 'pbnc' ? 'red' : k === 'pb' ? 'green' : 'gray');
      return `<button type="button" class="ib ib-${k}" data-a="${i.a}" style="--cap:${PL.LCOL[col] || '#8a949b'}" aria-pressed="false" aria-label="${esc((i.label || '') + ' ' + i.a)}${isPb ? ' (اضغط وسيب)' : ''}"><span class="cap" aria-hidden="true"></span><span class="l">${esc(i.label || i.a)}</span><span class="a">${i.a}${k === 'pbnc' ? ' · NC' : k === 'ncsw' ? ' · NC' : ''}</span></button>`;
    }).join('');
    ioBox.hidden = !ins.length;
    updIO();
  }
  function updIO(){
    $$('.ib', ioBox).forEach(b => {
      const i = ex.io.inputs.find(x => x.a === b.dataset.a), k = i.kind;
      const act = k === 'pb' || k === 'pbnc' ? !!pressed[i.a] : k === 'ncsw' ? i.state === 0 : i.state === 1;
      b.classList.toggle('on', act); b.setAttribute('aria-pressed', act);
      const st = $('.a', b); if (k === 'ncsw') st.textContent = i.a + (act ? ' · اتفصل' : ' · NC');
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
    renderLeds(); status(`Force: ${a} ${a in forces ? '= ' + forces[a] : 'اتشال'}. ${running ? '' : 'شغّل RUN عشان الفورس يبان على الخرج.'}`);
  });
  if (frcB) frcB.addEventListener('click', () => { forceMode = !forceMode; frcB.setAttribute('aria-pressed', forceMode); renderLeds(); status(forceMode ? 'وضع الفورس: دوس على لمبة أي I أو Q تحت عشان تعمله Force 1، دوسة كمان Force 0، والتالتة تشيله.' : 'خرجت من وضع الفورس. الفورس اللي عملته لسه شغال لحد ما تشيله.'); });

  /* ---------- run / stop ---------- */
  function start(){ if (running) return; freshEngine(); running = true; runB.textContent = '■ STOP'; runB.setAttribute('aria-pressed', 'true'); runB.classList.add('on'); loop.start(); renderAll(); }
  function stop(){ if (!running) return; running = false; runB.textContent = '▶ RUN'; runB.setAttribute('aria-pressed', 'false'); runB.classList.remove('on'); e.out = {}; e.Q = {}; e.pw = e.prog.map(() => null); renderAll(); }
  runB.addEventListener('click', () => running ? stop() : start());
  const loop = PL.animate(host, dt => {
    acc += dt; let n = 0;
    while (acc >= 0.02 && n < 6){ acc -= 0.02; n++; P().step(plantSt, e, 0.02); if (running) e.scan(0.02); }
    if (n === 6) acc = 0;
    rdT += dt;
    renderPlant(); renderLeds();
    if (running && rdT > 0.09){ rdT = 0; refreshRungs(); }
  });

  /* ---------- check ---------- */
  function cases(){ return ex.cases || [{steps:ex.tests || []}]; }
  function check(){
    const lint = ENG.lint(prog).filter(m => m.kind === 'addr' || m.kind === 'operand');
    if (lint.length){ show(false, 'فيه عنصر ناقصه عنوان أو عنوانه غلط: ' + esc(lint[0].text)); return {ok:false, msg:lint[0].text}; }
    for (const c of cases()){
      const r = ENG.check(prog, {io:ex.io, plant:ex.plant, plantOpt:Object.assign({}, ex.plantOpt || {}, c.plantOpt || {}), tests:c.steps}, {cols});
      if (!r.ok){ lastRes = r; show(false, (c.name ? `<b>${esc(c.name)}:</b> ` : '') + r.msg); $('[data-t=sol]', host).hidden = !ex.sol; return r; }
    }
    lastRes = {ok:true};
    const first = PL.mark(opt.lesson, ex.key);
    show(true, ex.ok || 'البرنامج عدّى كل الاختبارات.');
    task.classList.add('ok');
    if (tabs) { const b = tabs.querySelector(`[data-k="${exs.indexOf(ex)}"]`); if (b) b.classList.add('done'); }
    if (ex.sol) $('[data-t=sol]', host).hidden = false;
    return {ok:true, first};
  }
  function show(ok, html){ resBox.hidden = false; resBox.className = 'ls-res ' + (ok ? 'ok' : 'no'); resBox.innerHTML = `<b>${ok ? '✓ تمام!' : '✗ لسه:'}</b> ${html}`; }
  function status(html){ resBox.hidden = false; resBox.className = 'ls-res'; resBox.innerHTML = html; }
  chkB.addEventListener('click', () => { check(); resBox.scrollIntoView({block:'nearest', behavior:reduced() ? 'auto' : 'smooth'}); });

  /* ---------- tools ---------- */
  $('.ls-tools', host).addEventListener('click', ev => {
    const b = ev.target.closest('[data-t]'); if (!b) return;
    const t = b.dataset.t;
    if (t === 'add'){ if (prog.length >= 10){ status('أقصى عدد 10 رانج في التمرين.'); return; } prog.push(ENG.blankRung(cols)); sel = {i:prog.length - 1, r:0, c:0}; changed(); scrollSel(); }
    else if (t === 'hint') hintBox.hidden = !hintBox.hidden;
    else if (t === 'reset'){ backup = ENG.serialize(prog); prog = ENG.program(ex.start || [ENG.serialize([ENG.blankRung(cols)])[0]], cols); sel = null; changed(); $('[data-t=undo]', host).hidden = false; status('رجعنا البرنامج لأوّله. لو عايز اللي كنت عامله دوس "رجّع برنامجي".'); }
    else if (t === 'sol'){ backup = ENG.serialize(prog); prog = ENG.program(ex.sol, cols); sel = null; changed(); $('[data-t=undo]', host).hidden = false; status('ده حل ممكن (مش الحل الوحيد). شغّله RUN وجرّبه، واقرا كل رانج بيعمل إيه.'); }
    else if (t === 'undo' && backup){ prog = ENG.program(backup, cols); backup = null; sel = null; changed(); b.hidden = true; status('رجّعنا برنامجك.'); }
  });
  if (tabs) tabs.addEventListener('click', ev => { const b = ev.target.closest('[data-k]'); if (b) select(+b.dataset.k); });

  /* ---------- ladder drawing ---------- */
  const lab = a => { const all = (ex.io.inputs || []).concat(ex.io.outputs || []).concat(ex.syms || []); const f = all.find(x => x.a === a); return f ? f.label : ''; };
  const rungSvg = (rg, i) => drawRung(rg, i, {cols, running, e, sel, lab, hit:true});
  function renderLadder(){
    const focus = document.activeElement && lad.contains(document.activeElement) && document.activeElement.dataset ? Object.assign({}, document.activeElement.dataset) : null;
    lad.innerHTML = prog.map((rg, i) => `<div class="ls-rung${sel && sel.i === i ? ' cur' : ''}" data-i="${i}"><div class="ls-rh" dir="rtl"><b>رانج ${i + 1}</b><span class="sp"></span><button type="button" class="btn sm" data-rt="row+" ${rg.rows.length >= 3 ? 'disabled' : ''} aria-label="زوّد صف (فرع) في رانج ${i + 1}">+ فرع</button><button type="button" class="btn sm" data-rt="row-" ${rg.rows.length <= 1 ? 'disabled' : ''} aria-label="شيل آخر صف من رانج ${i + 1}">− صف</button><button type="button" class="btn sm" data-rt="del" ${prog.length <= 1 ? 'disabled' : ''} aria-label="امسح رانج ${i + 1}">✕</button></div>${rungSvg(rg, i)}</div>${sel && sel.i === i ? pickerHtml() : ''}`).join('');
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
    let h = `<div class="lp" dir="rtl" role="group" aria-label="تعديل الخانة"><div class="lp-h"><b>رانج ${sel.i + 1} · صف ${sel.r + 1} · خانة ${sel.c + 1}</b>${outCol ? '<span class="muted"> (عمود الخرج)</span>' : ''}<button type="button" class="btn sm" data-pk="close" aria-label="اقفل">✕</button></div>`;
    h += `<div class="lp-els">${types.map(t => `<button type="button" class="btn lp-el" data-pk="el" data-v="${t}" aria-pressed="${t === cur}">${elIcon(t)}<span>${t === 'NONE' ? 'فاضي' : EL_LABEL[t]}</span></button>`).join('')}</div>`;
    if (el && el.t !== 'W'){
      h += `<p class="lp-help muted">${EL_HELP[el.t] || ''}</p>`;
      const ch = addrChoices(el.t);
      h += `<div class="lp-addr"><span class="lp-k">${el.t === 'SCL' ? 'الدخل الأنالوج:' : 'العنوان:'}</span>${ch.map(([a, l]) => `<button type="button" class="btn chip" data-pk="addr" data-v="${a}" aria-pressed="${el.a === a}">${a}${l ? `<small>${esc(l)}</small>` : ''}</button>`).join('')}<form class="lp-free" data-pk="free"><input class="inp mono" name="a" maxlength="8" placeholder="${outCol ? 'Q0.5' : 'I0.5'}" aria-label="عنوان تاني" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn sm" type="submit">حط</button></form></div>`;
      if (el.pt != null) h += `<label class="lp-par">الوقت PT (ثانية) <input class="inp mono" type="number" step="0.1" min="0.1" max="600" data-pk="pt" value="${el.pt}" inputmode="decimal"></label>`;
      if (el.pv != null) h += `<label class="lp-par">القيمة PV <input class="inp mono" type="number" step="1" min="1" max="9999" data-pk="pv" value="${el.pv}" inputmode="numeric"></label>`;
      if (el.t === 'CMP') h += `<div class="lp-par">الشرط: <span class="mono">${esc(el.a || '?')}</span><select class="inp mono" data-pk="op" aria-label="نوع المقارنة">${ENG.CMPOPS.map(o => `<option${o === el.op ? ' selected' : ''}>${o}</option>`).join('')}</select><input class="inp mono" type="number" step="any" data-pk="b" value="${el.b}" aria-label="القيمة" inputmode="decimal"></div>`;
      if (el.t === 'SCL') h += `<div class="lp-par">الخرج <select class="inp mono" data-pk="o" aria-label="خرج الـ Scale">${['MW10', 'MW12', 'MW14'].map(o => `<option${o === el.o ? ' selected' : ''}>${o}</option>`).join('')}</select> من <input class="inp mono" type="number" step="any" data-pk="lo" value="${el.lo}" aria-label="أقل قيمة"> لـ <input class="inp mono" type="number" step="any" data-pk="hi" value="${el.hi}" aria-label="أعلى قيمة"></div>`;
    }
    const brs = [];
    if (sel.r === 0 && !outCol) brs.push(`<button type="button" class="btn" data-pk="par">⫴ فرع موازي للخانة دي (OR)</button>`);
    if (sel.r === 0 && outCol) brs.push(`<button type="button" class="btn" data-pk="par">⫴ خرج موازي (كويل تاني)</button>`);
    if (sel.r > 0){
      const L = rg.links[sel.r - 1];
      if (sel.c > 0) brs.push(`<button type="button" class="btn" data-pk="lk" data-v="${sel.c}" aria-pressed="${L.indexOf(sel.c) >= 0}">┘ وصلة شمال لفوق</button>`);
      if (sel.c + 1 <= cols - 1) brs.push(`<button type="button" class="btn" data-pk="lk" data-v="${sel.c + 1}" aria-pressed="${L.indexOf(sel.c + 1) >= 0}">└ وصلة يمين لفوق</button>`);
    }
    h += `<div class="lp-br">${brs.join('')}</div><p class="lp-help muted">الرسم ماشي من الشمال لليمين زي أي برنامج PLC: الخط اللي على الشمال هو مصدر الكهربا، والكويلات في آخر عمود على اليمين.</p></div>`;
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
    if (r < 0){ if (rg.rows.length >= 3){ status('الرانج فيه 3 صفوف خلاص. ده أقصى حاجة في المحاكي.'); return; } rg.rows.push(new Array(cols).fill(null)); rg.links.push([]); r = rg.rows.length - 1; }
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
    if (!k || (ENG.accepts[el.t] || []).indexOf(k) < 0){ status(`العنوان "${esc(f.a.value)}" مينفعش مع ${el.t}. أمثلة صح: ${ENG.accepts[el.t].map(x => ({I:'I0.3', Q:'Q0.2', M:'M1.0', T:'T3', C:'C2', IW:'IW64', MW:'MW12'}[x])).join(' · ')}`); return; }
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

  select(0);
  const api = {host, get ex(){ return ex; }, get prog(){ return prog; }, get engine(){ return e; }, get plant(){ return plantSt; }, get running(){ return running; },
    select, start, stop, check, load(def){ prog = ENG.program(def, cols); changed(); }, press:setPress, exercises:exs, lesson:opt.lesson,
    pick(i, r, c){ sel = {i, r, c}; renderLadder(); }, setEl(t){ setEl(t); }, lint: () => ENG.lint(prog)};
  (PL._sims = PL._sims || []).push(api);
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
    return `<svg viewBox="0 0 160 110" role="img" aria-label="PLC"><rect x="6" y="8" width="148" height="94" rx="6" fill="#d9dde0" stroke="#7b858c"/><rect x="6" y="8" width="148" height="16" rx="6" fill="#3b4247"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<rect x="${14 + k * 13.6}" y="11" width="9" height="10" rx="1" fill="#5d6469"/><circle cx="${18.5 + k * 13.6}" cy="16" r="2" fill="#9aa3a8"/>`).join('')}<rect x="14" y="32" width="60" height="44" rx="3" fill="#2a3035"/><text x="44" y="50" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#cfd6db">CPU</text><circle cx="24" cy="64" r="3" fill="#2fd35a"/><text x="30" y="67" style="font:600 6.5px var(--font-mono);fill:#cfd6db">RUN</text><circle cx="52" cy="64" r="3" fill="#4a5257"/><text x="58" y="67" style="font:600 6.5px var(--font-mono);fill:#cfd6db">ERR</text>${ledI.map((v, k) => `<rect x="${84 + (k % 4) * 15}" y="${34 + Math.floor(k / 4) * 10}" width="8" height="6" rx="1" fill="${v ? '#2fd35a' : '#4a5257'}"/>`).join('')}${ledQ.map((v, k) => `<rect x="${84 + (k % 4) * 15}" y="${60 + Math.floor(k / 4) * 10}" width="8" height="6" rx="1" fill="${v ? '#ffb300' : '#4a5257'}"/>`).join('')}<rect x="6" y="86" width="148" height="16" rx="6" fill="#3b4247"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<rect x="${14 + k * 13.6}" y="89" width="9" height="10" rx="1" fill="#5d6469"/>`).join('')}</svg>`; },
  ladder(){ return `<svg viewBox="0 0 160 110" role="img" aria-label="برنامج Ladder"><path d="M10 8V102M150 8V102" stroke="var(--ink)" stroke-width="3"/><path d="M10 34H40M52 34H80M92 34H112M138 34H150" stroke="#2fd35a" stroke-width="3"/><path d="M40 22V46M52 22V46M80 22V46M92 22V46" stroke="#2fd35a" stroke-width="3"/><path d="M84 46L96 22" stroke="#2fd35a" stroke-width="2"/><path d="M118 22q-8 12 0 24M132 22q8 12 0 24" fill="none" stroke="#2fd35a" stroke-width="3"/><path d="M10 74H40M52 74H66V34" fill="none" stroke="var(--muted)" stroke-width="3"/><path d="M40 62V86M52 62V86" stroke="var(--muted)" stroke-width="3"/><text x="46" y="18" text-anchor="middle" style="font:600 8px var(--font-mono);fill:var(--ink)">I0.0</text><text x="86" y="18" text-anchor="middle" style="font:600 8px var(--font-mono);fill:var(--ink)">I0.1</text><text x="125" y="18" text-anchor="middle" style="font:600 8px var(--font-mono);fill:var(--ink)">Q0.0</text><text x="46" y="58" text-anchor="middle" style="font:600 8px var(--font-mono);fill:var(--ink)">Q0.0</text></svg>`; },
  sensor(){ return `<svg viewBox="0 0 160 110" role="img" aria-label="حساس"><rect x="30" y="44" width="12" height="26" fill="#2f6fb3"/><rect x="42" y="44" width="84" height="26" fill="#c3cad0" stroke="#6b757c"/><path d="M18 36q-12 21 0 42M24 42q-8 15 0 30" fill="none" stroke="var(--accent)" stroke-width="2.5"/><rect x="126" y="49" width="22" height="16" rx="2" fill="#2a3035"/><circle cx="118" cy="57" r="3" fill="#ffb300"/></svg>`; },
  contactor(){ return `<svg viewBox="0 0 160 110" role="img" aria-label="كونتاكتور">${contactorSvg(80, 50, '', true).replace('translate(80 50)', 'translate(80 50) scale(1.8)')}</svg>`; },
  motor(){ return `<svg viewBox="0 0 160 110" role="img" aria-label="موتور">${motorSvg(80, 52, 76, 18, true)}</svg>`; }
};

/* ---------- lesson 1: the scan cycle ---------- */
PL.scanDemo = function(host, opt){
  const L = opt.lesson, PH = ['read', 'exec', 'write'];
  const S = {sw:0, II:0, Q:0, out:0, ph:0, t:0, spd:'slow', seenOn:false, seenOff:false, pulse:0, scans:0, hold:false};
  host.innerHTML = `<div class="sd-art wd-art"></div><div class="wd-ctl"><button type="button" class="btn sd-sw" aria-pressed="false">سويتش I0.0: OFF</button><button type="button" class="btn sd-pulse">نبضة قصيرة 0.3 ثانية</button></div>
    <div class="tabs" role="group" aria-label="سرعة السكان"><button type="button" class="btn" data-s="slow" aria-pressed="true">بطيء (ثانية لكل مرحلة)</button><button type="button" class="btn" data-s="step" aria-pressed="false">خطوة بخطوة</button><button type="button" class="btn" data-s="fast" aria-pressed="false">سرعة حقيقية</button></div>
    <div class="wd-ctl"><button type="button" class="btn pri sd-next" hidden>المرحلة اللي بعدها ←</button></div>
    <p class="msg sd-msg" aria-live="polite"></p><p class="chal sd-chal">شغّل السويتش واستنى اللمبة تنوّر، وبعدين اقفله واستنى اللمبة تطفي. لاحظ إن اللمبة مش بتتغيّر غير في مرحلة <b>اكتب المخارج</b>.</p>`;
  const art = $('.sd-art', host), msg = $('.sd-msg', host), fin = chal(host, '.sd-chal', L, 'scan');
  const txt = {read:'<b>1. اقرا المداخل:</b> الـ PLC بيبص على كل أطراف الدخل مرة واحدة وبيحفظها في جدول اسمه <b>Input image</b>. لو السويتش اتغيّر بعد كده، البرنامج مش هيعرف غير في السكان الجاي.',
    exec:'<b>2. نفّذ البرنامج:</b> بيمشي على الرانجات من فوق لتحت، ويحسب كل كويل من الجدول (مش من السلك نفسه). النتيجة بتتحط في <b>Output image</b>.',
    write:'<b>3. اكتب المخارج:</b> دلوقتي بس، النتيجة بتطلع على أطراف الخرج واللمبة بتتغيّر. وبعدين يرجع يقرا المداخل تاني… وهكذا للأبد.'};
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
    art.innerHTML = `<svg viewBox="0 0 360 240" role="img" aria-label="دورة السكان">
      <g transform="translate(10 96)"><rect width="56" height="64" rx="8" fill="#d9dde0" stroke="#7b858c"/><rect x="18" y="${S.sw ? 10 : 30}" width="20" height="24" rx="4" fill="${S.sw ? '#2fd35a' : '#5d6469'}"/><text x="28" y="80" text-anchor="middle" class="sd-s">I0.0</text><text x="28" y="94" text-anchor="middle" class="ar sd-s">سويتش</text></g>
      <path d="M66 128H92" class="sd-w${S.sw ? ' hot' : ''}"/>
      <rect x="92" y="6" width="190" height="228" rx="14" class="sd-plc"/><text x="187" y="24" text-anchor="middle" class="sd-t">PLC</text>
      ${box(131, 34, 'read', 'اقرا المداخل', 'I0.0 → ' + S.II)}
      ${box(131, 102, 'exec', 'نفّذ البرنامج', 'Q0.0 := I0.0')}
      ${box(131, 170, 'write', 'اكتب المخارج', 'Q0.0 → ' + S.Q)}
      <path d="M187 80V100M187 148V168" class="sd-arr" marker-end="url(#sdA)"/><path d="M131 193H112V57H129" class="sd-arr" fill="none" marker-end="url(#sdA)"/>
      <defs><marker id="sdA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" class="sd-ah"/></marker></defs>
      <g transform="translate(104 34)"><rect width="22" height="16" rx="3" class="sd-img${S.II ? ' on' : ''}"/><text x="11" y="12" text-anchor="middle" class="sd-s">${S.II}</text></g>
      <path d="M282 128H300" class="sd-w${S.out ? ' hot' : ''}"/>
      <g transform="translate(300 98)">${lampSvg(28, 28, 20, LCOL.yellow, S.out)}<text x="28" y="72" text-anchor="middle" class="sd-s">Q0.0</text><text x="28" y="86" text-anchor="middle" class="ar sd-s">لمبة</text></g>
      <text x="187" y="230" text-anchor="middle" class="sd-s">scan #${S.scans}</text></svg>`;
    msg.innerHTML = S.spd === 'fast' ? 'في الحقيقة السكان بياخد حوالي <b>⁦1⁠–⁠20⁩ ملّي ثانية</b>، فبتحس إن اللمبة بتنوّر في نفس اللحظة. بس الترتيب نفسه ما بيتغيّرش.' : txt[p];
    $('.sd-sw', host).textContent = 'سويتش I0.0: ' + (S.sw ? 'ON' : 'OFF'); $('.sd-sw', host).setAttribute('aria-pressed', !!S.sw);
  }
  $('.sd-sw', host).addEventListener('click', () => { S.sw = S.sw ? 0 : 1; S.pulse = 0; draw(); });
  $('.sd-pulse', host).addEventListener('click', () => { S.sw = 1; S.pulse = 0.3; draw(); if (S.spd !== 'fast') msg.innerHTML += '<br><b>جرّب تلاحظ:</b> لو النبضة خلصت قبل مرحلة "اقرا المداخل" الـ PLC مش هيشوفها خالص. عشان كده الإشارات السريعة جدًا (إنكودر مثلاً) ليها كروت High-speed counter.'; });
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
    {k:'psu', t:'PS', name:'باور سبلاي (PSU)', en:'Power Supply', col:'#5d6469', d:'بياخد 220V AC ويطلّع <b>24V DC</b> للـ CPU والكروت والحساسات. أغلب مشاكل "الـ PLC مطفي" بتبدأ من هنا أو من الفيوز اللي قبله.'},
    {k:'cpu', t:'CPU', name:'وحدة المعالجة (CPU)', en:'Central Processing Unit', col:'#2a3035', d:'المخ: فيها البرنامج والذاكرة (M، تايمرات، عدادات) وبتعمل دورة السكان. عليها لمبات <b>RUN / STOP / ERROR</b> وبورت للبرمجة (USB أو Ethernet).'},
    {k:'di', t:'DI', name:'كارت دخل ديجيتال', en:'Digital Input (DI)', col:'#2b7a3d', d:'بيستقبل إشارات "فيه أو مفيش" على 24V DC: زراير، ليميت سويتشات، حساسات PNP/NPN، كونتاكت أوفرلود. كل دخل له لمبة صغيرة بتنوّر لما يجيله 24V.'},
    {k:'do', t:'DO', name:'كارت خرج ديجيتال', en:'Digital Output (DO)', col:'#b85f00', d:'بيشغّل الأحمال: كويلات كونتاكتورات، ريليهات، لمبات بيان، بلوف سولينويد. نوعين: <b>ريلاي</b> (AC أو DC، أبطأ) و<b>ترانزستور</b> (24V DC بس، سريع).'},
    {k:'ai', t:'AI', name:'كارت دخل أنالوج', en:'Analog Input (AI)', col:'#2f6fb3', d:'بيقرا قيمة متغيّرة: <b>⁦4⁠–⁠20mA⁩</b> أو <b>⁦0⁠–⁠10V⁩</b> من ترانسميتر ضغط أو مستوى أو حرارة، ويحوّلها لرقم (Raw counts). فيه كروت مخصوصة للثيرموكبل والـ PT100.'},
    {k:'ao', t:'AO', name:'كارت خرج أنالوج', en:'Analog Output (AO)', col:'#7b4fb3', d:'بيطلّع ⁦4⁠–⁠20mA⁩ أو ⁦0⁠–⁠10V⁩ عشان يتحكم في حاجة بالتدريج: سرعة إنفرتر، فتحة بلف كنترول.'},
    {k:'com', t:'COM', name:'كارت اتصال', en:'Communication', col:'#0d7584', d:'Profinet، Ethernet/IP، Modbus، RS485… بيربط الـ PLC بالـ HMI والإنفرترات والـ SCADA. (مش لازم تزوره عشان التمرين.)', opt:true}
  ];
  const seen = {};
  host.innerHTML = `<div class="wd-art pa-art"></div><div class="box pa-info" aria-live="polite">دوس على أي كارت في الراك عشان تعرف بيعمل إيه.</div><p class="chal pa-chal">زور الـ 6 أجزاء الأساسية: ⁦PS، CPU، DI، DO، AI، AO⁩.</p>`;
  const art = $('.pa-art', host), info = $('.pa-info', host), fin = chal(host, '.pa-chal', L, 'parts');
  function draw(cur){
    const w = 46, x0 = 18;
    art.innerHTML = `<svg viewBox="0 0 360 170" role="img" aria-label="راك PLC"><rect x="8" y="132" width="344" height="12" rx="3" fill="#9aa3a8"/>${M.map((m, i) => { const x = x0 + i * w, on = cur === m.k; return `<g class="pa-m${on ? ' on' : ''}${seen[m.k] ? ' seen' : ''}" data-k="${m.k}" tabindex="0" role="button" aria-label="${esc(m.name)}"><rect x="${x}" y="${m.k === 'cpu' ? 14 : 24}" width="${w - 4}" height="${m.k === 'cpu' ? 116 : 106}" rx="4" fill="${m.col}" stroke="${on ? 'var(--accent)' : '#1d2226'}" stroke-width="${on ? 3 : 1}"/><text x="${x + (w - 4) / 2}" y="46" text-anchor="middle" style="font:700 11px var(--font-mono);fill:#fff">${m.t}</text>${m.k === 'cpu' ? `<circle cx="${x + 12}" cy="64" r="3" fill="#2fd35a"/><circle cx="${x + 12}" cy="76" r="3" fill="#4a5257"/>` : m.k !== 'psu' ? [0, 1, 2, 3, 4, 5].map(j => `<rect x="${x + 8}" y="${58 + j * 10}" width="7" height="5" rx="1" fill="${(j + i) % 3 === 0 ? '#ffd400' : '#3a4045'}"/><rect x="${x + 22}" y="${57 + j * 10}" width="14" height="7" rx="1" fill="#c3cad0"/>`).join('') : `<rect x="${x + 8}" y="60" width="26" height="40" rx="3" fill="#3a4045"/><text x="${x + 21}" y="118" text-anchor="middle" style="font:600 7px var(--font-mono);fill:#fff">24V</text>`}${seen[m.k] ? `<circle cx="${x + w - 10}" cy="${m.k === 'cpu' ? 22 : 32}" r="6" fill="#2fd35a"/>` : ''}</g>`; }).join('')}<text x="180" y="162" text-anchor="middle" class="ar sd-s">الراك: كل كارت بيتركّب جنب التاني على نفس القضيب (DIN rail)</text></svg>`;
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
  let ex, wires = [], pend = null, passed = false, act = {};
  host.innerHTML = `<div class="tabs" role="group" aria-label="تمارين التوصيل">${exs.map((x, j) => `<button type="button" class="btn${PL.has(L, x.key) ? ' done' : ''}" data-k="${j}" aria-pressed="${j === 0}">${esc(x.title)}</button>`).join('')}</div>
    <div class="chal wb-task"></div><div class="bn-board wb-board"></div>
    <div class="bn-tools"><button type="button" class="btn pri wb-chk">اختبر التوصيل</button><button type="button" class="btn wb-undo">شيل آخر سلك</button><button type="button" class="btn wb-clr">امسح كله</button></div>
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
    const live = passed ? ex.live(act) : {};
    let s = `<svg viewBox="0 0 360 ${ex.h || 300}" role="img" aria-label="لوحة التوصيل">${ex.art(live)}`;
    wires.forEach(([a, b], k) => { const A = T(a), B = T(b), mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 + 18, col = TERM_COL[A.pol] || TERM_COL[B.pol] || '#333'; const d = `M${A.x} ${A.y}Q${mx} ${my} ${B.x} ${B.y}`; s += `<g class="bw" data-w="${k}"><path d="${d}" class="bw-o"/><path d="${d}" class="bw-c" stroke="${col}"/><path d="${d}" class="bw-hit" tabindex="0" role="button" aria-label="سلك من ${esc(A.l)} لـ ${esc(B.l)}، دوس عشان تشيله"/></g>`; });
    ex.terms.forEach(t => { s += `<g class="bt${pend === t.id ? ' pend' : ''}" data-t="${t.id}"><circle cx="${t.x}" cy="${t.y}" r="16" class="bt-hit" tabindex="0" role="button" aria-label="طرف ${esc(t.l)}"/><circle cx="${t.x}" cy="${t.y}" r="13" class="bt-ring"/><circle cx="${t.x}" cy="${t.y}" r="7" class="bt-s"/><path d="M${t.x - 4} ${t.y}h8" class="bt-x"/><text x="${t.x + (t.lx || 0)}" y="${t.y + (t.ly != null ? t.ly : -12)}" class="bt-lab"${t.anc ? ` text-anchor="${t.anc}"` : ''}>${esc(t.l)}</text></g>`; });
    board.innerHTML = s + '</svg>';
  }
  function select(k){
    ex = exs[k]; wires = []; pend = null; passed = false; act = {};
    taskBox.innerHTML = ex.task; taskBox.classList.toggle('ok', PL.has(L, ex.key));
    $$('.tabs [data-k]', host).forEach(b => b.setAttribute('aria-pressed', +b.dataset.k === k));
    res.innerHTML = ''; actBox.hidden = true; draw();
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
    let bad = null;
    /* wrong joins first: they can be dangerous */
    const ids = ex.terms.map(t => t.id);
    const wrong = [];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++){ const a = ids[i], b = ids[j]; if (f(a) === f(b) && gid(a) !== gid(b)) wrong.push([a, b]); }
    if (wrong.length){
      const dz = ex.danger && ex.danger(wrong[0][0], wrong[0][1], f);
      const w = wrong.find(([a, b]) => ex.why && (ex.why[a] || ex.why[b])) || wrong[0], hint = ex.why ? ex.why[w[0]] || ex.why[w[1]] || '' : '';
      bad = dz || `<b>${esc(T(w[0]).l)}</b> متوصّل بـ <b>${esc(T(w[1]).l)}</b> وده غلط. ${hint}`;
    }
    if (!bad) for (const g of ex.groups){ for (let i = 1; i < g.length; i++) if (f(g[0]) !== f(g[i])){ bad = `<b>${esc(T(g[i]).l)}</b> لسه مش متوصّل بـ <b>${esc(T(g[0]).l)}</b>.${ex.why && ex.why[g[i]] ? ' ' + ex.why[g[i]] : ''}`; break; } if (bad) break; }
    if (bad){ res.innerHTML = `<div class="bn-bad"><b>لسه:</b> ${bad}</div>`; passed = false; actBox.hidden = true; draw(); return {ok:false, msg:bad}; }
    passed = true; PL.mark(L, ex.key); taskBox.classList.add('ok'); const tb = host.querySelector(`.tabs [data-k="${exs.indexOf(ex)}"]`); if (tb) tb.classList.add('done');
    res.innerHTML = `<div class="bn-ok"><b>التوصيل صح ✓</b> ${ex.ok}</div>`;
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
  select(0);
  const api = {connect(a, b){ tapTerm(a); tapTerm(b); }, check, select, solve(){ wires = []; ex.groups.forEach(g => { for (let i = 1; i < g.length; i++) wires.push([g[i - 1], g[i]]); }); draw(); return check(); }, get wires(){ return wires; }, get ex(){ return ex; }};
  (PL._wires = PL._wires || []).push(api);
  return api;
};
/* drawings used by the wiring exercises */
PL.wireArt = {
  psu: (x, y) => `<g transform="translate(${x} ${y})"><rect width="110" height="58" rx="6" fill="#5d6469" stroke="#2a3035"/><text x="55" y="20" text-anchor="middle" style="font:700 11px var(--font-mono);fill:#fff">PSU 24V DC</text></g>`,
  cpu: (x, y, live) => `<g transform="translate(${x} ${y})"><rect width="130" height="58" rx="6" fill="#2a3035"/><text x="65" y="20" text-anchor="middle" style="font:700 11px var(--font-mono);fill:#cfd6db">CPU</text><circle cx="96" cy="16" r="4" fill="${live.pwr ? '#2fd35a' : '#4a5257'}"/><text x="104" y="19" style="font:600 7px var(--font-mono);fill:#cfd6db">RUN</text></g>`,
  card: (x, y, w, h, title, leds, live) => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="6" fill="#d9dde0" stroke="#7b858c"/><text x="${w / 2}" y="16" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#2a3035">${title}</text>${leds.map((l, k) => `<rect x="${w - 30}" y="${l.y - y - 5}" width="12" height="9" rx="2" fill="${live[l.k] ? (l.c || '#2fd35a') : '#4a5257'}"/>`).join('')}</g>`,
  sensor: (x, y, kind, live) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="12" height="22" fill="#2f6fb3"/><rect x="12" y="0" width="70" height="22" fill="#c3cad0" stroke="#6b757c"/><rect x="82" y="3" width="18" height="16" rx="2" fill="#2a3035"/><circle cx="76" cy="11" r="3" fill="${live.target ? '#ffb300' : '#7b858c'}"/><text x="47" y="15" text-anchor="middle" style="font:700 8.5px var(--font-mono);fill:#2a3035">${kind}</text>${live.target ? '<rect x="-22" y="-2" width="14" height="26" fill="#8a949b" stroke="#2a3035"/>' : ''}<path d="M100 11h10v24" fill="none" stroke="#2a3035" stroke-width="4"/></g>`,
  pb: (x, y, live, lbl) => `<g transform="translate(${x} ${y})"><rect width="70" height="34" rx="6" fill="#2a3035"/><circle cx="35" cy="17" r="11" fill="${live ? '#1d8a3a' : '#2fd35a'}" stroke="#123"/><text x="78" y="21" class="ar" style="font-size:10px;fill:var(--ink)">${lbl}</text></g>`,
  coil: (x, y, lbl, on) => `<g transform="translate(${x} ${y})"><rect width="76" height="40" rx="6" fill="#d9dde0" stroke="#7b858c"/><rect x="24" y="12" width="28" height="16" rx="2" fill="${on ? '#2b7a3d' : '#5d6469'}"/><rect x="31" y="${on ? 14 : 8}" width="14" height="5" fill="#ffd400"/><text x="84" y="18" class="ar" style="font-size:10px;fill:var(--ink)">${lbl}</text><text x="84" y="32" style="font:600 9px var(--font-mono);fill:${on ? '#2b7a3d' : 'var(--muted)'}">${on ? 'ON' : 'OFF'}</text></g>`,
  lamp: (x, y, on) => `<g transform="translate(${x} ${y})">${lampSvg(20, 18, 13, LCOL.green, on)}</g>`,
  ac: (x, y) => `<g transform="translate(${x} ${y})"><rect width="92" height="58" rx="6" fill="#7a4a22" stroke="#3b2410"/><text x="46" y="20" text-anchor="middle" style="font:700 11px var(--font-mono);fill:#fff">230V AC</text><text x="46" y="33" text-anchor="middle" class="ar" style="font-size:9.5px;fill:#f3e6d6">بعد القاطع MCB</text></g>`
};

/* ---------- lesson 8: analog chain + scaling ---------- */
PL.scaleDemo = function(host, opt){
  const S = {mA:12, lo:0, hi:4, unit:'m'};
  host.innerHTML = `<div class="wd-art sc-art"></div><div class="wd-ctl"><label>تيار الترانسميتر <b class="sc-mA"></b><input type="range" min="0" max="22" step="0.1" value="12" class="sc-r" aria-label="التيار mA"></label>
    <label class="sc-rng">الرينج من <input type="number" class="inp mono sc-lo" value="0" step="any" aria-label="أقل قيمة"> لـ <input type="number" class="inp mono sc-hi" value="4" step="any" aria-label="أعلى قيمة"> <select class="inp sc-u" aria-label="الوحدة"><option>m</option><option>bar</option><option>°C</option><option>%</option></select></label></div>
    <div class="read"><div><span>Raw (IW64)</span><b class="sc-raw"></b></div><div><span>القيمة الحقيقية</span><b class="sc-val"></b></div><div><span>النسبة</span><b class="sc-pct"></b></div></div><p class="msg sc-msg" aria-live="polite"></p>`;
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
    m.innerHTML = brk ? 'التيار تقريبًا صفر: ده <b>سلك مقطوع</b> مش تانك فاضي. كروت كتير بتطلّع رقم خطأ مخصوص (في Siemens مثلاً 32767) أو بتشغّل لمبة Diagnostic. البرنامج لازم يعتبرها عطل.' : S.mA < 3.8 ? 'تحت 4mA: الكارت بيقرا قيمة سالبة (Underrange). غالبًا الترانسميتر بيبلّغ عن عطل أو المعايرة مزحزحة.' : S.mA > 20.5 ? 'فوق 20mA: Overrange. القيمة أكبر من URV أو الترانسميتر في وضع Fail-high.' : `القانون: القيمة = ${S.lo} + (${r} ÷ 27648) × (${S.hi} − ${S.lo}) = <b>${fmt(v, 2)} ${S.unit}</b>`;
    const lvl = clamp((S.mA - 4) / 16, 0, 1);
    art.innerHTML = `<svg viewBox="0 0 360 120" role="img" aria-label="سلسلة الإشارة الأنالوج"><g transform="translate(6 18)"><rect width="64" height="80" rx="5" fill="#d9e3ea" stroke="#6b757c"/><rect x="2" y="${(78 - 76 * lvl).toFixed(1)}" width="60" height="${(76 * lvl).toFixed(1)}" fill="#3a8fd8" opacity=".85"/><text x="32" y="98" text-anchor="middle" class="ar sd-s">التانك</text></g>
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
  if (kind === 'raw2v') return {q:`ترانسميتر رينجه ${rng}، والكارت قرا <b class="mono">IW64 = ${raw}</b>. القيمة الحقيقية كام <span class="mono">${esc(u)}</span>؟`, input:true, unit:u, check:x => Math.abs(x - v) <= Math.abs(hi - lo) * 0.01, ans:fmt(v, 2), why:`${raw} ÷ 27648 = ${pct}% من الرينج.`};
  if (kind === 'mA2raw') return {q:`الترانسميتر بيطلّع <b class="mono">${fmt(mA, 1)} mA</b>. الكارت (Siemens-style ⁦0⁠–⁠27648⁩) هيقرا كام تقريبًا؟`, input:true, unit:'raw', check:x => Math.abs(x - raw) <= 300, ans:raw, why:`(${fmt(mA, 1)} − 4) ÷ 16 = ${pct}% ⇐ ${pct}% × 27648.`};
  return {q:`رينج ${rng}. عايز الـ PLC يعمل إنذار عند <b class="mono">${fmt(v, 1)} ${esc(u)}</b>. الـ Raw المقابل كام؟`, input:true, unit:'raw', check:x => Math.abs(x - raw) <= 300, ans:raw, why:`${fmt(v, 1)} = ${pct}% من الرينج ⇐ ${pct}% × 27648.`};
};

/* ---------- lesson 5: live timing diagram for TON / TOF / TP ---------- */
PL.timerDemo = function(host){
  const PT = 2, WIN = 10;
  let type = 'TON', e, hist = [], t = 0, inV = 0;
  host.innerHTML = `<div class="tabs" role="group" aria-label="نوع التايمر">${['TON', 'TOF', 'TP'].map(k => `<button type="button" class="btn" data-k="${k}" aria-pressed="${k === 'TON'}">${k}</button>`).join('')}</div>
    <div class="wd-art td-art"></div><div class="ls-io"><button type="button" class="ib ib-pb td-in" style="--cap:${LCOL.green}" aria-pressed="false" aria-label="دخل التايمر IN (اضغط وسيب)"><span class="cap" aria-hidden="true"></span><span class="l">IN</span><span class="a">I0.0</span></button><button type="button" class="ib ib-sw td-sw" aria-pressed="false" aria-label="سويتش IN"><span class="cap" aria-hidden="true"></span><span class="l">سويتش</span><span class="a">I0.0</span></button></div><p class="msg td-msg" aria-live="polite"></p>`;
  const art = $('.td-art', host), msg = $('.td-msg', host), btn = $('.td-in', host), sw = $('.td-sw', host);
  let held = false, swOn = false;
  const desc = {TON:'<b>TON (On-delay):</b> الخرج Q بيشتغل بعد ما IN يفضل 1 لمدة PT متواصلة. لو IN وقع قبل كده العدّاد بيرجع صفر.', TOF:'<b>TOF (Off-delay):</b> Q بيشتغل مع IN على طول، ولما IN يقع Q بيفضل شغال لمدة PT وبعدين يفصل.', TP:'<b>TP (Pulse):</b> أول ما IN يبقى 1، Q بيطلّع نبضة طولها PT بالظبط، مهما IN طال أو قصر.'};
  function reset(){ e = new ENG.Engine([{rows:[['NO:I0.0', '-', '-', '-', type + ':T0:' + PT]]}, {rows:[['NO:T0', '-', '-', '-', 'OUT:Q0.0']]}], {cols:5}); hist = []; t = 0; msg.innerHTML = desc[type] + ` (هنا PT = ${PT} ثانية)`; }
  function draw(){
    const W = 340, X0 = 40, sx = (W - X0 - 6) / WIN, rows = [['IN', 'in', '#2f6fb3'], ['Q', 'q', '#2b7a3d']];
    let s = `<svg viewBox="0 0 ${W} 150" role="img" aria-label="رسم توقيت ${type}">`;
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
  const top = live => A.psu(8, 6) + A.cpu(222, 6, {pwr:true});
  const DC = ['P24', 'P0', 'CL', 'CM'];
  const msgShort = '⚡ <b>قصر على الباور:</b> الـ +24V اتوصّل بالـ 0V من غير حمل في النص. الباور هيفصل أو الفيوز هيضرب. راجع السلك اللي عملته.';
  const msgMix = '⚡ <b>خطر:</b> خلطت <b>230V AC</b> بدايرة الـ <b>24V DC</b>. ده بيحرق الكارت والحساسات وممكن يكهرب حد. الدايرتين لازم يفضلوا منفصلين.';
  const msgLN = '⚡ <b>قصر بين الفاز والنيوترال!</b> القاطع هيفصل فورًا.';
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
  const sensorArt = (kind, live) => A.sensor(14, 96, kind, live) + `<path d="M124 107h6v30" fill="none" stroke="#2a3035" stroke-width="4"/><rect x="16" y="140" width="110" height="16" rx="3" fill="#3b4247"/><path d="M130 137V148H30V156M130 148H66V156M130 148H102V156" fill="none" stroke="#2a3035" stroke-width="1.5"/>`;
  const leadT = [below('BN', 'BN', 30, 168, 'p24'), below('BU', 'BU', 66, 168, 'p0'), below('BK', 'BK', 102, 168, 'sig')];
  const pbArt = live => A.pb(20, 206, live, 'زرار Start NO');
  const pbT = [below('PB13', '13', 34, 268, 'sig'), below('PB14', '14', 78, 268, 'sig')];
  const inCard = (title, live) => A.card(230, 96, 122, 196, title, [{y:180, k:'i0'}, {y:230, k:'i1'}], live) + `<text x="324" y="170" text-anchor="middle" style="font:600 7px var(--font-mono);fill:#2a3035">I0.0</text><text x="324" y="220" text-anchor="middle" style="font:600 7px var(--font-mono);fill:#2a3035">I0.1</text>`;
  const ex = [];
  /* PNP sensor + sinking input card (1M on 0V) */
  ex.push({key:'pnp', title:'دخل PNP', h:300,
    task:'<b>المطلوب:</b> وصّل باور الـ CPU (L+ و M)، وحساس <b>PNP</b> على <b>I0.0</b>، وزرار Start على <b>I0.1</b>. الكارت ده الـ <b>1M</b> بتاعه لازم يروح على <b>0V</b> (الحساس بيطلّع +24V). دوس على طرف وبعدين على طرف تاني عشان تحط سلك، ودوس على أي سلك عشان تشيله.',
    terms:base().concat(leadT, pbT, [right('IM', '1M', 130, 'sig'), right('I0', 'I0.0', 180, 'sig'), right('I1', 'I0.1', 230, 'sig')]),
    groups:[['P24', 'CL', 'BN', 'PB13'], ['P0', 'CM', 'BU', 'IM'], ['BK', 'I0'], ['PB14', 'I1']],
    why:{IM:'الـ COM بتاع الكارت هو طريق رجوع التيار: مع PNP بيروح على 0V.', BK:'السلك الأسود هو خرج الحساس: مكانه دخل الكارت.', PB13:'طرف من الزرار على +24V، والتاني على الدخل.', CL:'الـ CPU نفسه محتاج باور: L+ على +24V.', CM:'و M على 0V.'},
    art:live => top(live) + sensorArt('PNP', live) + pbArt(live.i1) + inCard('DI 24V DC', live),
    live:a => ({target:a.target, i0:a.target, i1:a.pb}),
    acts:[{k:'target', l:'قرّب حديدة من الحساس'}, {k:'pb', l:'دوس زرار Start'}],
    ok:'الحساس لما يحس بيطلّع +24V على الأسود، التيار بيدخل I0.0 ويرجع من 1M للـ 0V. جرّب الزراير تحت وشوف لمبات الكارت.'});
  /* NPN sensor + sourcing card (1M on +24V) */
  ex.push({key:'npn', title:'دخل NPN', h:300,
    task:'<b>المطلوب:</b> نفس الفكرة بس الحساس <b>NPN</b> (بيسحب خرجه لـ 0V). يعني الـ <b>1M</b> بتاع الكارت لازم يروح على <b>+24V</b>. والزرار؟ فكّر: علشان يبقى فيه تيار في I0.1 الزرار لازم يوصّل الدخل بـ إيه؟',
    terms:base().concat(leadT, pbT, [right('IM', '1M', 130, 'sig'), right('I0', 'I0.0', 180, 'sig'), right('I1', 'I0.1', 230, 'sig')]),
    groups:[['P24', 'CL', 'BN', 'IM'], ['P0', 'CM', 'BU', 'PB13'], ['BK', 'I0'], ['PB14', 'I1']],
    why:{IM:'مع NPN الـ COM بيروح على +24V: التيار داخل من الـ COM وطالع من الدخل للحساس.', PB13:'مع الكارت ده الزرار لازم يسحب الدخل لـ 0V، فطرفه التاني على 0V مش +24V.', BK:'السلك الأسود هو خرج الحساس: مكانه دخل الكارت.', CL:'الـ CPU نفسه محتاج باور: L+ على +24V.', CM:'و M على 0V.'},
    art:live => top(live) + sensorArt('NPN', live) + pbArt(live.i1) + inCard('DI 24V DC', live),
    live:a => ({target:a.target, i0:a.target, i1:a.pb}),
    acts:[{k:'target', l:'قرّب حديدة من الحساس'}, {k:'pb', l:'دوس زرار Start'}],
    ok:'التيار طالع من +24V على 1M، بيعدّي في دايرة الدخل، وبيخرج من I0.0 للسلك الأسود اللي الحساس بيسحبه لـ 0V. نفس الكارت ينفع للاتنين، المهم الـ COM رايح فين.'});
  /* transistor (sourcing) output: 24 V DC loads */
  ex.push({key:'tr', title:'خرج ترانزستور', h:300,
    task:'<b>المطلوب:</b> كارت خرج <b>ترانزستور</b> (Sourcing / PNP): وصّل باور الخرج <b>3L+</b> على +24V و <b>3M</b> على 0V، وكويل الكونتاكتور <b>24V DC</b> على <b>Q0.0</b>، ولمبة البيان 24V على <b>Q0.1</b>. الطرف التاني من كل حمل بيروح فين؟',
    terms:base().concat([below('KA1', 'A1', 30, 166, 'sig'), below('KA2', 'A2', 82, 166, 'p0'), below('HX1', 'X1', 30, 270, 'sig'), below('HX2', 'X2', 82, 270, 'p0'),
      right('OL', '3L+', 130, 'p24'), right('Q0', 'Q0.0', 175, 'sig'), right('Q1', 'Q0.1', 220, 'sig'), right('OM', '3M', 265, 'p0')]),
    groups:[['P24', 'CL', 'OL'], ['P0', 'CM', 'OM', 'KA2', 'HX2'], ['Q0', 'KA1'], ['Q1', 'HX1']],
    why:{OL:'الترانزستورات جوه الكارت محتاجة باور: 3L+ على +24V.', OM:'و 3M على 0V.', KA2:'الخرج بيطلّع +24V على A1، والطرف التاني للحمل لازم يرجع لـ 0V.', HX2:'اللمبة كمان: طرفها التاني على 0V.', CL:'الـ CPU نفسه محتاج باور: L+ على +24V.', CM:'و M على 0V.'},
    art:live => top(live) + A.coil(14, 110, 'كونتاكتور 24V DC', live.q0) + `<path d="M30 150v8M82 150v8" stroke="#2a3035" stroke-width="2"/>` + A.lamp(36, 216, live.q1) + `<text x="98" y="238" class="ar" style="font-size:10px;fill:var(--ink)">لمبة 24V</text>` + A.card(230, 96, 122, 196, 'DQ 24V DC (Tr)', [{y:175, k:'q0', c:'#ffb300'}, {y:220, k:'q1', c:'#ffb300'}], live),
    live:a => ({q0:a.q0, q1:a.q1}),
    acts:[{k:'q0', l:'البرنامج يشغّل Q0.0'}, {k:'q1', l:'البرنامج يشغّل Q0.1'}],
    ok:'كارت الترانزستور سريع ومبيتآكلش، بس <b>DC بس</b> وتياره صغير (حوالي 0.5A للخرج). للأحمال الأكبر حط ريليه وسيط. ولو الحمل كويل DC، الدايود (Flyback) بيحمي الترانزستور.'});
  /* relay output: 230 V AC contactor */
  ex.push({key:'rly', title:'خرج ريلاي', h:300,
    task:'<b>المطلوب:</b> كارت خرج <b>ريلاي</b> بيشغّل كونتاكتور كويله <b>230V AC</b>. الريليه مجرد كونتاكت: وصّل الكومن <b>1L</b> على الفاز <b>L</b>، و <b>Q0.0</b> على A1، و A2 على النيوترال <b>N</b>. ومتنساش باور الـ CPU. أوعى تخلط الـ AC بالـ DC.',
    terms:base().concat([{id:'ACL', l:'L', x:150, y:54, pol:'ac'}, {id:'ACN', l:'N', x:196, y:54, pol:'n'},
      below('KA1', 'A1', 30, 166, 'sig'), below('KA2', 'A2', 82, 166, 'coil'), right('RL', '1L', 130, 'sig'), right('Q0', 'Q0.0', 180, 'sig'), right('Q1', 'Q0.1', 230, 'sig')]),
    groups:[['P24', 'CL'], ['P0', 'CM'], ['ACL', 'RL'], ['Q0', 'KA1'], ['ACN', 'KA2']],
    why:{RL:'الكومن بتاع الريليهات بياخد الجهد اللي هيطلع على الأحمال: هنا الفاز L.', KA1:'الريليه لما يقفل بيوصّل 1L بـ Q0.0، و Q0.0 رايح على A1.', KA2:'A2 بيرجع على النيوترال N.', CL:'الـ CPU نفسه محتاج باور: L+ على +24V.', CM:'و M على 0V.'},
    art:live => A.psu(8, 6) + `<g transform="translate(124 6)"><rect width="94" height="64" rx="6" fill="#7a4a22" stroke="#3b2410"/><text x="47" y="16" text-anchor="middle" style="font:700 10px var(--font-mono);fill:#fff">230V AC</text><text x="47" y="28" text-anchor="middle" class="ar" style="font-size:9px;fill:#f3e6d6">بعد القاطع</text></g>` + A.cpu(222, 6, {pwr:true}) + A.coil(14, 110, 'كونتاكتور 230V AC', live.q0) + `<path d="M30 150v8M82 150v8" stroke="#2a3035" stroke-width="2"/>` + (live.q0 ? `<g transform="translate(20 200)">${PL.motorSvg(36, 40, 54, 30, true)}<text x="90" y="44" class="ar" style="font-size:10px;fill:var(--ink)">الموتور اشتغل</text></g>` : '') + A.card(230, 96, 122, 196, 'DQ Relay', [{y:180, k:'q0', c:'#ffb300'}, {y:230, k:'q1', c:'#ffb300'}], live),
    live:a => ({q0:a.q0}),
    acts:[{k:'q0', l:'البرنامج يشغّل Q0.0'}],
    ok:'الريليه بيشيل AC أو DC وتيار لحد حوالي 2A، بس أبطأ وعمره محدود بعدد مرات الفتح والقفل. كل مجموعة مخارج ليها كومن واحد (1L)، فمتخلطش جهود مختلفة على نفس المجموعة.'});
  ex.forEach(x => { x.danger = mkDanger(x); x.terms.forEach(t => { if (!t.pol) t.pol = 'sig'; }); });
  PL.wireEx = ex;
})();

})();
