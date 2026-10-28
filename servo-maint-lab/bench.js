/* منضدة صيانة محرك السيرفو – LearnElectricals (MSA UI)
   CNC machining centre, 4 servo axes (X, Y, Z, A) on 400 V drives — canonical data in project-data.md.
   Eight tabs, one per lesson (l2…l9). Each tab: a goal, real instruments (tap or drag the test leads),
   the safety sequence, the learner's own calculation with the formula and substituted numbers, and
   «▶ شاهد الحل» which plays the solution on the real controls and never marks the tab.
   Every encoder type: TTL/RS-422, HTL, Hall U/V/W, Sin/Cos 1 Vpp, resolver, SSI, EnDat 2.2, BiSS-C,
   HIPERFACE, HIPERFACE DSL and a vendor serial absolute type, each with its connector, scope signals and faults.
   State in localStorage 'srvm-bench-v1'. All limits are typical values for learning («قيم نموذجية للتعلّم»). */
(function(){
'use strict';
const $ = IL.$, $$ = IL.$$, esc = IL.esc, fmt = IL.fmt;
IL.hubTheme();
const NARROW = () => window.innerWidth < 620;
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* Arabic sentence with Latin symbols / numbers: every Latin run is isolated as LTR */
const LTR_RUN = /[A-Za-z0-9√(+\-−±/][A-Za-z0-9Ωµ°√±≤≥<>=×·()+\-−.,%/²³_ →↔'^~|]*[A-Za-z0-9Ωµ°%)²³+−]|[A-Za-z0-9]/g;
const ar = s => { s = String(s); let out = '', last = 0; s.replace(LTR_RUN, (m, off) => {
  if (m[0] === '(' && m.indexOf(')') < 0){ m = m.slice(1); off++; }
  if (m.endsWith(')') && m.indexOf('(') < 0) m = m.slice(0, -1);
  if (!m) return ''; out += esc(s.slice(last, off)) + '<bdi dir="ltr">' + esc(m) + '</bdi>'; last = off + m.length; return m; }); return '<span>' + out + esc(s.slice(last)) + '</span>'; };
const L = s => `<bdi class="ltr mono">${s}</bdi>`;
const clone = o => JSON.parse(JSON.stringify(o));
const f0 = v => fmt(v, 0), f1 = v => fmt(v, 1), f2 = v => fmt(v, 2), f3 = v => fmt(v, 3);
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = IL.shuffle;
const jit = (v, p) => v * (1 + (Math.random() * 2 - 1) * p);
const num = v => IL.num(v);
const near = (v, t, tol) => isFinite(v) && Math.abs(v - t) <= Math.abs(t) * tol;
const nearA = (v, t, tol) => isFinite(v) && Math.abs(v - t) <= tol;
const SQ2 = Math.SQRT2, SQ3 = Math.sqrt(3), PI2 = Math.PI * 2;
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.8;

/* ---------------- CNC axes (canonical project data) ---------------- */
const AX = {
  X:{id:'X', P:1.5, n:3000, nmax:5000, T:4.77, Tp:14.3, I:4.0, Imax:12.0, Kt:1.19, Ke:72, R:2.8, Lmh:12, poles:8, enc:'vendor', brake:false},
  Y:{id:'Y', P:1.5, n:3000, nmax:5000, T:4.77, Tp:14.3, I:4.0, Imax:12.0, Kt:1.19, Ke:72, R:2.8, Lmh:12, poles:8, enc:'ttl', brake:false},
  Z:{id:'Z', P:2.0, n:2000, nmax:3000, T:9.55, Tp:28.6, I:6.0, Imax:18.0, Kt:1.59, Ke:96, R:1.2, Lmh:7, poles:8, enc:'endat', brake:true},
  A:{id:'A', P:0.75, n:3000, nmax:5000, T:2.39, Tp:7.2, I:2.6, Imax:7.8, Kt:0.92, Ke:56, R:6.2, Lmh:24, poles:8, enc:'res', brake:false}
};
const BRK = {V:24, I:0.6, R:40, Th:12, tr:80, te:30};      // Z holding brake

/* ---------------- state ---------------- */
const KEY = 'srvm-bench-v1';
let S = (() => { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && typeof s === 'object' ? s : {}; } catch (e){ return {}; } })();
let DEMO = 0;
function save(){ if (DEMO) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e){} }

/* =====================================================================
   tabs, goals, demo (same pattern as maint-lab/motor.js)
   ===================================================================== */
const TABS = [
  {id:'nameplate', t:'لوحة البيانات', l:'l2', h:'لوحة بيانات محرك السيرفو وأطراف موصّلاته', goal:'اقرأ لوحة بيانات محرك المحور X، واحسب Kt والتردد الكهربي عند السرعة المعطاة والعزم الأقصى، ثم حدّد أطراف موصّل القدرة والفرامل وموصّل الإنكودر من جدول الكتيّب.'},
  {id:'winding', t:'الملفات و Back-EMF', l:'l3', h:'مقاومة الملفات والعزل و Back-EMF', goal:'قِس مقاومة U-V و V-W و W-U واحسب عدم الاتزان، واختبر العزل بـ 500 V بعد فصل موصّلي الإنكودر والفرامل، ثم أدِر العمود واقرأ Back-EMF على راسم الإشارة، واحسب Ke واحكم على حالة المحرك.'},
  {id:'types', t:'أنواع الإنكودر', l:'l4', h:'تمييز أنواع الإنكودر وتوصيلها بالدرايف', goal:'ميّز الأنواع الأحد عشر للإنكودر من الموصّل والإشارة والملصق، ثم وصّل كل نوع إلى مدخل الدرايف الصحيح بجهد التغذية الصحيح.'},
  {id:'scope', t:'الأوسيلوسكوب', l:'l5', h:'فحص إشارات الإنكودر بالأوسيلوسكوب والملتيميتر', goal:'وصّل مجسّات الأوسيلوسكوب والملتيميتر بنقاط اختبار الإنكودر، واقرأ A/B/Z والأزواج التفاضلية ودائرة Sin/Cos وأغلفة الريزولفر والإطارات التسلسلية والتغذية والبطارية، ثم حدّد عطل كل حالة من الحالات الخمس.'},
  {id:'offset', t:'الإزاحة', l:'l6', h:'استبدال الإنكودر وضبط زاوية الإزاحة', goal:'استبدل إنكودر المحور X بالخطوات الصحيحة، واضبط زاوية الإزاحة بطريقة حقن التيار المستمر، ثم دقّقها بطريقة Back-EMF حتى يدور المحرك بنعومة دون انحياز في التيار.'},
  {id:'brake', t:'الفرامل', l:'l7', h:'اختبار فرامل محرك المحور Z', goal:'ادعم المحور Z ميكانيكيًا، ثم قِس مقاومة ملف الفرامل وجهد التحرير، واقرأ زمني التحرير والتعشيق على راسم الإشارة، واختبر عزم التثبيت بمفتاح العزم، واحكم على الفرامل.'},
  {id:'bearing', t:'المحامل والمغانط', l:'l8', h:'المحامل والسدادات وفقدان المغنطة', goal:'شخّص أربع حالات بالأجهزة: صوت المحمل والاهتزاز، وتسرّب الزيت عبر السدادة، وفقدان المغنطة من Back-EMF والتيار، ثم اختر السبب والإصلاح الصحيحين.'},
  {id:'cable', t:'الكابلات والتشويش', l:'l9', h:'أعطال الكابلات والحجب والتشويش', goal:'تتبّع أربعة أعطال: حجب مقطوع، وغياب التأريض الكامل 360°، وتقارب مسار كابل القدرة وكابل الإنكودر، وزوج إنكودر تالف، ثم اختر الإصلاح الصحيح لكل عطل.'}
];
const tabsEl = $('#tabs'), panes = $('#panes'), G = {}, BUILD = {};
let CUR = '';
TABS.forEach(tb => {
  const b = document.createElement('button'); b.className = 'btn' + (IL.has(tb.l, 'sim') ? ' done' : ''); b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = tb.t; b.dataset.id = tb.id;
  b.addEventListener('click', () => show(tb.id)); tabsEl.appendChild(b);
  const p = document.createElement('section'); p.className = 'pane'; p.id = 'p-' + tb.id; p.setAttribute('role', 'tabpanel');
  p.innerHTML = `<h2 style="margin:0 0 8px">${ar(tb.h)}</h2><div class="goal${IL.has(tb.l, 'sim') ? ' ok' : ''}" id="g-${tb.id}"><b class="k">${IL.has(tb.l, 'sim') ? '✓ أُنجز' : 'المطلوب'}</b>${ar(tb.goal)}</div><div class="body"></div>`;
  panes.appendChild(p); G[tb.id] = tb;
});
function show(id){
  if (!G[id]) id = TABS[0].id;
  CUR = id;
  $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + id));
  $$('#tabs .btn').forEach(b => b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false'));
  if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  if (!G[id].built){ G[id].built = true; BUILD[id]($('#p-' + id + ' .body')); }
  stopAudio();
}
function rebuild(id){ const old = $('#p-' + id + ' .body'), nb = document.createElement('div'); nb.className = 'body'; old.replaceWith(nb); BUILD[id](nb); }
function win(id, msg){
  if (DEMO){ (window.__demoWin = window.__demoWin || []).push(id); return false; }
  const tb = G[id]; if (tb.won) return false; tb.won = true; IL.mark(tb.l, 'sim');
  const g = $('#g-' + id); g.classList.add('ok'); g.innerHTML = `<b class="k">✓ أُنجز</b>${ar(msg || tb.goal)}`;
  $(`#tabs .btn[data-id="${id}"]`).classList.add('done');
  return true;
}
/* «▶ شاهد الحل»: plays the solution on the real controls, then puts the exercise back */
function demo(host, id, run){
  const b = $('.demo-b', host), pane = $('#p-' + id);
  b.addEventListener('click', async () => {
    if (DEMO) return;
    const snap = clone(S);
    DEMO++; b.disabled = true; pane.classList.add('demoing');
    const dm = $('.demo-m', host); if (dm){ dm.className = 'msg demo-m'; dm.textContent = 'العرض يعمل: راقب الخطوات تُنفَّذ على الأجهزة واحدة بعد الأخرى…'; }
    try { await run(); await sleep(1500 / DSPEED); }
    catch (e){ console.warn(e); }
    finally {
      S = snap; DEMO--; stopAudio(); rebuild(id); pane.classList.remove('demoing');
      const m = $('#p-' + id + ' .demo-m'); if (m){ m.textContent = 'انتهى العرض وأُعيد التمرين إلى حالته: نفّذه الآن بنفسك ليُحتسب.'; m.className = 'msg demo-m'; }
    }
  });
}
let DSPEED = 1;   // demo pacing (tests may speed it up)
async function dClick(el, ms){
  if (!el) throw new Error('demo: missing element');
  el.classList.add('dhl'); if (el.scrollIntoView) el.scrollIntoView({block:'nearest', behavior:'smooth'});
  await sleep((ms || 550) / DSPEED); el.classList.remove('dhl');
  el.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window})); await sleep(260 / DSPEED);
}
async function dSet(el, v, ms){
  if (!el) throw new Error('demo: missing element');
  el.classList.add('dhl'); if (el.scrollIntoView) el.scrollIntoView({block:'nearest', behavior:'smooth'}); await sleep((ms || 380) / DSPEED);
  if (el.tagName === 'INPUT' && el.type !== 'range'){ const t = String(v); el.value = ''; for (let i = 1; i <= t.length; i++){ el.value = t.slice(0, i); await sleep(35 / DSPEED); } } else el.value = v;
  el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); await sleep(180 / DSPEED); el.classList.remove('dhl');
}
async function dWait(fn, max){ const t0 = Date.now(); while (!fn()){ if (Date.now() - t0 > (max || 60000)) throw new Error('demo: timeout'); await sleep(100); } }
const foot = () => `<div class="row keep"><button type="button" class="btn demo-b keep">▶ شاهد الحل</button><button type="button" class="btn new-b keep">سيناريو جديد</button></div><p class="msg demo-m keep" aria-live="polite"></p>`;
function newScenario(host, id, fn){
  $('.new-b', host).addEventListener('click', () => { if (DEMO) return; fn(); save(); rebuild(id); });
}
const fld = (k, label, unit, val, ph) => `<label class="fld"><span>${ar(label)}</span><input type="text" inputmode="decimal" data-k="${k}" value="${esc(val == null ? '' : val)}" placeholder="${ph || ''}" autocomplete="off"><b class="u">${unit ? esc(unit) : ''}</b></label>`;
const sel = (k, label, options, val) => `<label class="fld"><span>${ar(label)}</span><select data-k="${k}"><option value="">اختر…</option>${options.map(o => `<option value="${esc(o[0])}"${String(val) === String(o[0]) ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`;
function mark(el, ok){ if (!el) return; el.classList.toggle('ok', ok === true); el.classList.toggle('no', ok === false); }
function say(el, html, cls){ if (!el) return; el.className = 'msg ' + (cls || ''); el.innerHTML = html; }
const warn = (title, txt) => `<div class="warnbox"><b>${ar(title)}</b> ${ar(txt)}</div>`;
const typical = txt => `<p class="typ">${ar('قيم نموذجية للتعلّم' + (txt ? ': ' + txt : '') + '. ارجع إلى كتيّب المحرك والدرايف.')}</p>`;

/* ---------------- test leads: tap a plug then a terminal, or drag the plug onto it ---------------- */
function svgPt(svg, e){ const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : {x:0, y:0}; }
function Leads(svg, o){
  const conn = {}; let selP = null, drag = null, supp = false;
  const lay = svg.querySelector('.cabs');
  const path = (a, b) => { const sag = Math.max(30, Math.abs(b.x - a.x) * 0.3 + Math.abs(b.y - a.y) * 0.15); return `M${f1(a.x)} ${f1(a.y)} C${f1(a.x)} ${f1(a.y + sag)} ${f1(b.x)} ${f1(b.y + sag)} ${f1(b.x)} ${f1(b.y)}`; };
  function draw(){
    let h = '';
    Object.keys(conn).forEach(p => { const P = o.plugs[p], T = o.targets[conn[p]]; if (!T) return; h += `<path class="cab-o" d="${path(P, T)}"/><path class="cab" stroke="${P.color}" d="${path(P, T)}"/><circle cx="${T.x}" cy="${T.y}" r="6.5" fill="${P.color}" stroke="#111" stroke-width="1.2"/>`; });
    if (drag && drag.m) h += `<path class="cab" stroke="${o.plugs[drag.p].color}" stroke-dasharray="8 6" d="${path(o.plugs[drag.p], drag.pt)}"/>`;
    lay.innerHTML = h;
    Object.keys(o.plugs).forEach(p => o.plugs[p].el.classList.toggle('sel', selP === p));
    $$('[data-tg]', svg).forEach(t => t.classList.toggle('sel', !!selP));
  }
  function tryConn(p, t){
    const r = o.ok ? o.ok(p, t) : true;
    if (r !== true){ selP = null; draw(); if (o.msg) o.msg(r); return false; }
    Object.keys(conn).forEach(q => { if (q !== p && conn[q] === t && o.single) delete conn[q]; });
    conn[p] = t; selP = null; draw(); if (o.change) o.change(p, t); return true;
  }
  function disc(p){ if (o.canDis){ const r = o.canDis(p); if (r !== true){ if (o.msg) o.msg(r); return false; } } delete conn[p]; if (o.change) o.change(p, null); return true; }
  svg.addEventListener('click', e => {
    if (supp){ supp = false; return; }
    const pl = e.target.closest('[data-plug]'), tg = e.target.closest('[data-tg]');
    if (pl){ const p = pl.dataset.plug; if (conn[p]){ if (disc(p)) selP = p; } else selP = selP === p ? null : p; draw(); if (selP && o.msg) o.msg(null, p); return; }
    if (tg){ if (!selP){ if (o.msg) o.msg(o.pickFirst || 'اختر طرف السلك من الجهاز أولًا، ثم المكان الذي تريد توصيله به.'); return; } tryConn(selP, tg.dataset.tg); }
  });
  svg.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const t = e.target.closest('[data-plug],[data-tg]'); if (t){ e.preventDefault(); t.dispatchEvent(new MouseEvent('click', {bubbles:true})); } });
  svg.addEventListener('pointerdown', e => {
    const pl = e.target.closest('[data-plug]'); if (!pl || e.button > 0) return;
    if (conn[pl.dataset.plug]) return;
    drag = {p:pl.dataset.plug, x0:e.clientX, y0:e.clientY, m:false, pt:svgPt(svg, e), id:e.pointerId};
  });
  svg.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.m && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8){ drag.m = true; svg.parentNode.classList.add('drag'); try { svg.setPointerCapture(e.pointerId); } catch (er){} }
    if (drag.m){ e.preventDefault(); drag.pt = svgPt(svg, e); draw(); }
  });
  const end = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null; svg.parentNode.classList.remove('drag');
    try { svg.releasePointerCapture(e.pointerId); } catch (er){}
    if (d.m){
      supp = true; setTimeout(() => { supp = false; }, 60);
      const el = document.elementFromPoint(e.clientX, e.clientY), tg = el && el.closest && el.closest('[data-tg]');
      if (tg && svg.contains(tg)) tryConn(d.p, tg.dataset.tg); else draw();
    }
  };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  draw();
  return {conn, draw, set(p, t){ return tryConn(p, t); }, clear(p){ delete conn[p]; draw(); }, clearAll(){ Object.keys(conn).forEach(p => delete conn[p]); draw(); }};
}
/* a plug drawn on an instrument (banana jack / probe tip + coloured lead stub) */
const plugSvg = (id, x, y, color, lab, fs) => `<g class="hit" data-plug="${id}" tabindex="0" role="button" aria-label="${esc(lab)}"><rect x="${x - 22}" y="${y - 18}" width="44" height="52" fill="transparent"/><circle class="ring" cx="${x}" cy="${y}" r="15"/><circle cx="${x}" cy="${y}" r="12" fill="#1a1d1f" stroke="#555" stroke-width="2"/><circle cx="${x}" cy="${y}" r="7" fill="${color}"/><text x="${x}" y="${y + 27}" text-anchor="middle" font-size="${fs || 10}" font-weight="700" fill="#e9eef1">${lab}</text></g>`;
/* a test point / terminal stud the leads can be clipped onto */
const tpSvg = (id, x, y, lab, o) => { o = o || {}; const r = o.r || 12; return `<g class="hit" data-tg="${id}" tabindex="0" role="button" aria-label="${esc(lab)}"><rect x="${x - r - 8}" y="${y - r - 22}" width="${2 * r + 16}" height="${2 * r + 30}" fill="transparent"/><circle class="ring" cx="${x}" cy="${y}" r="${r + 4}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${o.fill || '#c9a24a'}" stroke="${o.stroke || '#6d5420'}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${r * 0.42}" fill="${o.core || '#6d5420'}"/><text x="${x}" y="${y - r - 6}" text-anchor="middle" font-size="${o.fs || 11}" font-weight="700" fill="${o.tc || 'var(--ink)'}">${lab}</text></g>`; };
function hexPts(x, y, r){ let s = ''; for (let i = 0; i < 6; i++){ const a = Math.PI / 6 + i * Math.PI / 3; s += f1(x + r * Math.cos(a)) + ',' + f1(y + r * Math.sin(a)) + ' '; } return s.trim(); }
/* yellow CAT III multimeter body (LCD id: <pfx>-lcd, unit id: <pfx>-u) */
function dmmSvg(pfx, x, y, mode){
  return `<g transform="translate(${x} ${y})">
  <rect x="0" y="0" width="120" height="196" rx="16" fill="#f2c230" stroke="#c99a12" stroke-width="2.5"/>
  <rect x="9" y="9" width="102" height="178" rx="10" fill="#3c4449"/>
  <rect x="16" y="16" width="88" height="48" rx="4" fill="#2b2f31"/><rect x="19" y="19" width="82" height="42" rx="3" fill="#c7d3b4"/>
  <text id="${pfx}-lcd" x="96" y="50" text-anchor="end" font-size="20" font-weight="700" class="lcdt">----</text>
  <text id="${pfx}-u" x="24" y="31" font-size="9" class="lcdt">${mode || 'V DC'}</text>
  <text x="60" y="78" text-anchor="middle" font-size="7.5" font-weight="700" fill="#f6cf45">DMM · CAT III 1000 V</text>
  <circle cx="60" cy="112" r="24" fill="#22282c" stroke="#8d969b" stroke-width="2"/><path d="M60 92 L64 112 L60 116 L56 112Z" fill="#e3e9ec" transform="rotate(${mode === 'Ω' ? 40 : -30} 60 112)"/>
  <text x="26" y="96" font-size="8" fill="#e9eef1">V⎓</text><text x="86" y="96" font-size="8" fill="#e9eef1">Ω</text><text x="24" y="136" font-size="8" fill="#e9eef1">V~</text><text x="88" y="136" font-size="8" fill="#e9eef1">A</text>
  </g>`;
}
function lcdSet(root, pfx, val, unit){ const a = $('#' + pfx + '-lcd', root), b = $('#' + pfx + '-u', root); if (a) a.textContent = val; if (b && unit != null) b.textContent = unit; }

/* ---------------- audio ---------------- */
let AC = null, SRC = null;
function stopAudio(){ try { if (SRC){ SRC.stop(); SRC = null; } } catch (e){} }
function playBuf(data, rate){
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    stopAudio();
    const b = AC.createBuffer(1, data.length, rate); b.getChannelData(0).set(data);
    const s = AC.createBufferSource(); s.buffer = b; const g = AC.createGain(); g.gain.value = 0.5; s.connect(g); g.connect(AC.destination); s.start(); SRC = s;
    return true;
  } catch (e){ return false; }
}

/* =====================================================================
   Digital storage oscilloscope (4 channels + MATH + XY + serial decode)
   a channel source is {f(t) → volts, per (shortest period, s), mm(ta, tb) → [min, max] for narrow pulses}
   ===================================================================== */
const TRC = ['#ffd23f', '#3fd0ff', '#ff6bd6', '#7dff9a'], TRM = '#ff8a5c';
const TDIVS = [0.1e-6, 0.2e-6, 0.5e-6, 1e-6, 2e-6, 5e-6, 10e-6, 20e-6, 50e-6, 100e-6, 200e-6, 500e-6, 1e-3, 2e-3, 5e-3, 10e-3, 20e-3, 50e-3, 100e-3, 200e-3];
const VDIVS = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200];
const sig3 = v => { const a = Math.abs(v); return a >= 100 ? f0(v) : a >= 10 ? f1(v) : a >= 1 ? f2(v) : f3(v); };
const tfmt = s => s >= 1 ? sig3(s) + ' s' : s >= 1e-3 ? sig3(s * 1e3) + ' ms' : s >= 1e-6 ? sig3(s * 1e6) + ' µs' : sig3(s * 1e9) + ' ns';
const vfmt = v => Math.abs(v) >= 1 ? sig3(v) + ' V' : sig3(v * 1e3) + ' mV';
const hzfmt = f => f >= 1e6 ? sig3(f / 1e6) + ' MHz' : f >= 1e3 ? sig3(f / 1e3) + ' kHz' : sig3(f) + ' Hz';
function Scope(box, o){
  o = o || {};
  const NB = NARROW(), SW = 500, SH = 320, X0 = 10, Y0 = 10, GX = SW / 10, GY = SH / 8, CX = X0 + SW / 2, CY = Y0 + SH / 2;
  const fs = NB ? 15 : 11.5, VW = NB ? 520 : 640, VH = NB ? 408 : 392;
  const st = {ch:[0, 1, 2, 3].map(i => ({on:false, src:null, vdiv:1, pos:0, lab:'CH' + (i + 1)})), tdiv:o.tdiv || 20e-6, t0:0, xy:false, math:false, run:true, selCh:0, decode:null, extra:null, meas:null, cursor:null};
  const uid = IL.uid('sc');
  box.classList.add('scope-w');
  box.innerHTML = `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${esc(o.label || 'راسم الإشارة الرقمي')}">
    <defs><clipPath id="${uid}"><rect x="${X0}" y="${Y0}" width="${SW}" height="${SH}"/></clipPath></defs>
    <rect x="0" y="0" width="${VW}" height="${VH}" rx="12" fill="#353b40"/>
    <rect x="${X0 - 4}" y="${Y0 - 4}" width="${SW + 8}" height="${SH + 8}" rx="4" fill="#111"/>
    <rect x="${X0}" y="${Y0}" width="${SW}" height="${SH}" fill="#071009"/>
    <g stroke="#1f3a2f" stroke-width="1">${[1, 2, 3, 4, 6, 7, 8, 9].map(i => `<line x1="${X0 + i * GX}" y1="${Y0}" x2="${X0 + i * GX}" y2="${Y0 + SH}" stroke-dasharray="1 4"/>`).join('')}${[1, 2, 3, 5, 6, 7].map(i => `<line x1="${X0}" y1="${Y0 + i * GY}" x2="${X0 + SW}" y2="${Y0 + i * GY}" stroke-dasharray="1 4"/>`).join('')}</g>
    <g stroke="#2f5a48" stroke-width="1"><line x1="${CX}" y1="${Y0}" x2="${CX}" y2="${Y0 + SH}"/><line x1="${X0}" y1="${CY}" x2="${X0 + SW}" y2="${CY}"/>${Array.from({length:51}, (_, i) => `<line x1="${X0 + i * GX / 5}" y1="${CY - 3}" x2="${X0 + i * GX / 5}" y2="${CY + 3}"/>`).join('')}${Array.from({length:41}, (_, i) => `<line x1="${CX - 3}" y1="${Y0 + i * GY / 5}" x2="${CX + 3}" y2="${Y0 + i * GY / 5}"/>`).join('')}</g>
    <g class="sc-tr" clip-path="url(#${uid})"></g>
    <g class="sc-ov"></g>
    <g class="sc-info"></g>
    ${NB ? '' : `<g transform="translate(524 10)">
      <text x="55" y="14" text-anchor="middle" font-size="11" font-weight="700" fill="#e9eef1">DSO 4 CH</text>
      <text x="55" y="28" text-anchor="middle" font-size="8.5" fill="#aab4ba">200 MHz · 2 GSa/s</text>
      ${[0, 1].map(r => [0, 1].map(c => `<circle cx="${30 + c * 50}" cy="${62 + r * 58}" r="17" fill="#22282c" stroke="#5b656b" stroke-width="2"/><line x1="${30 + c * 50}" y1="${62 + r * 58}" x2="${30 + c * 50}" y2="${48 + r * 58}" stroke="#cfd6da" stroke-width="2"/>`).join('')).join('')}
      <text x="30" y="92" text-anchor="middle" font-size="7.5" fill="#aab4ba">VOLTS</text><text x="80" y="92" text-anchor="middle" font-size="7.5" fill="#aab4ba">TIME</text>
      <text x="30" y="150" text-anchor="middle" font-size="7.5" fill="#aab4ba">POS</text><text x="80" y="150" text-anchor="middle" font-size="7.5" fill="#aab4ba">TRIG</text>
      ${TRC.map((c, i) => `<rect x="${8 + (i % 2) * 52}" y="${166 + Math.floor(i / 2) * 34}" width="44" height="26" rx="5" fill="#22282c" stroke="${c}" stroke-width="2"/><text x="${30 + (i % 2) * 52}" y="${183 + Math.floor(i / 2) * 34}" text-anchor="middle" font-size="10" font-weight="700" fill="${c}">CH${i + 1}</text>`).join('')}
      ${[0, 1, 2, 3].map(i => `<circle cx="${17 + i * 26}" cy="${290}" r="9" fill="#9aa1a6" stroke="#5b656b" stroke-width="2"/><circle cx="${17 + i * 26}" cy="290" r="4" fill="#22282c"/><text x="${17 + i * 26}" y="312" text-anchor="middle" font-size="8" fill="${TRC[i]}">${i + 1}</text>`).join('')}
      <text x="55" y="340" text-anchor="middle" font-size="7.5" fill="#aab4ba">1 MΩ ≤ 300 V CAT II</text>
    </g>`}
  </svg>
  <div class="sc-ctl">
    <button type="button" class="btn" data-sc="t-">◀ t</button><span class="lbl sc-tl"></span><button type="button" class="btn" data-sc="t+">t ▶</button>
    <span class="sc-chs">${[0, 1, 2, 3].map(i => `<button type="button" class="btn" data-sc="c${i}" style="color:${TRC[i]}" aria-pressed="${i === 0}">CH${i + 1}</button>`).join('')}</span>
    <button type="button" class="btn" data-sc="v-">V −</button><button type="button" class="btn" data-sc="v+">V +</button>
    <button type="button" class="btn" data-sc="auto">AUTO</button>
    ${o.math === false ? '' : '<button type="button" class="btn" data-sc="math" aria-pressed="false">MATH 1−2</button>'}
    ${o.xy === false ? '' : '<button type="button" class="btn" data-sc="xy" aria-pressed="false">XY</button>'}
    <button type="button" class="btn" data-sc="run" aria-pressed="false">RUN/STOP</button>
  </div>`;
  const svg = $('svg', box), trG = $('.sc-tr', svg), ovG = $('.sc-ov', svg), inG = $('.sc-info', svg);
  const yOf = (v, c) => CY - (v / c.vdiv + c.pos) * GY;
  function sampleCol(src, t, dt){
    let mn = Infinity, mx = -Infinity;
    const K = src.per && src.per < dt * 4 ? 18 : 3;
    for (let k = 0; k < K; k++){ const v = src.f(t + dt * (K === 3 ? k / 2 : Math.random())); if (v < mn) mn = v; if (v > mx) mx = v; }
    if (src.mm){ const r = src.mm(t, t + dt); if (r){ mn = Math.min(mn, r[0]); mx = Math.max(mx, r[1]); } }
    return [mn, mx];
  }
  function trace(src, c, color, w){
    const NC = 250, dt = st.tdiv * 10 / NC; let up = '', dn = '';
    for (let i = 0; i <= NC; i++){
      const t = st.t0 + i * dt, [mn, mx] = sampleCol(src, t, dt), x = X0 + i * SW / NC;
      const ya = IL.clamp(yOf(mx, c), -40, 400), yb = IL.clamp(yOf(mn, c), -40, 400);
      up += (i ? 'L' : 'M') + f1(x) + ' ' + f1(ya); dn = 'L' + f1(x) + ' ' + f1(yb) + dn;
    }
    return `<path d="${up}${dn}Z" fill="${color}" stroke="${color}" stroke-width="${w || 1.5}" stroke-linejoin="round" opacity=".95"/>`;
  }
  function stats(src){
    const N = 1500, T = st.tdiv * 10; let mn = Infinity, mx = -Infinity, s = 0, s2 = 0; const v = [];
    for (let i = 0; i < N; i++){ const x = src.f(st.t0 + T * i / N); v.push(x); s += x; s2 += x * x; if (x < mn) mn = x; if (x > mx) mx = x; }
    if (src.mm){ const r = src.mm(st.t0, st.t0 + T); if (r){ mn = Math.min(mn, r[0]); mx = Math.max(mx, r[1]); } }
    const mean = s / N, rms = Math.sqrt(s2 / N), mid = (mx + mn) / 2, hy = (mx - mn) * 0.1;
    let cr = [], hi = v[0] > mid;
    for (let i = 1; i < N; i++){ if (!hi && v[i] > mid + hy){ hi = true; cr.push(i); } else if (hi && v[i] < mid - hy) hi = false; }
    const freq = cr.length >= 2 && mx - mn > 0.15 ? (cr.length - 1) / ((cr[cr.length - 1] - cr[0]) * T / N) : 0;
    const fr = src.per && src.per < T / N * 6 && mx - mn > 0.15 ? 1 / src.per : freq;
    return {mn, mx, pp:mx - mn, mean, rms, acrms:Math.sqrt(Math.max(0, rms * rms - mean * mean)), freq:fr};
  }
  function draw(){
    let h = '';
    const on = st.ch.map((c, i) => c.on && c.src ? i : -1).filter(i => i > -1);
    if (st.xy && st.ch[0].on && st.ch[1].on){
      const a = st.ch[0], b = st.ch[1], N = 900, T = st.tdiv * 10; let p = '';
      for (let i = 0; i <= N; i++){ const t = st.t0 + T * i / N, x = CX + (a.src.f(t) / a.vdiv + a.pos) * GX * 0.8, y = CY - (b.src.f(t) / b.vdiv + b.pos) * GY; p += (i ? 'L' : 'M') + f1(x) + ' ' + f1(y); }
      h += `<path d="${p}" fill="none" stroke="${TRC[0]}" stroke-width="1.6" opacity=".9"/>`;
    } else {
      on.forEach(i => { h += trace(st.ch[i].src, st.ch[i], TRC[i]); });
      if (st.math && st.ch[0].on && st.ch[1].on && st.ch[0].src && st.ch[1].src){
        const a = st.ch[0].src, b = st.ch[1].src, m = {f:t => a.f(t) - b.f(t), per:Math.min(a.per || 1, b.per || 1)};
        h += trace(m, {vdiv:st.ch[0].vdiv, pos:st.mathPos == null ? -3 : st.mathPos}, TRM, 1.3);
      }
    }
    if (st.extra) h += st.extra(st, {X0, Y0, SW, SH, GX, GY, CX, CY});
    trG.innerHTML = h;
    /* overlays: ground markers, trigger, decode, measurements */
    let ov = '';
    if (!st.xy) on.forEach(i => { const c = st.ch[i], y = IL.clamp(CY - c.pos * GY, Y0 + 6, Y0 + SH - 6); ov += `<path d="M${X0} ${y - 7} L${X0 + 12} ${y - 7} L${X0 + 18} ${y} L${X0 + 12} ${y + 7} L${X0} ${y + 7}Z" fill="${TRC[i]}"/><text x="${X0 + 7}" y="${y + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#111">${i + 1}</text>`; });
    if (!st.xy){ const tx = X0 + (-st.t0) / (st.tdiv * 10) * SW; if (tx >= X0 && tx <= X0 + SW) ov += `<path d="M${tx - 6} ${Y0} L${tx + 6} ${Y0} L${tx} ${Y0 + 9}Z" fill="#ff9f1c"/>`; }
    if (st.decode && !st.xy){
      const T = st.tdiv * 10, y = Y0 + SH - 30;
      st.decode().forEach(d => {
        const xa = X0 + (d.a - st.t0) / T * SW, xb = X0 + (d.b - st.t0) / T * SW; if (xb < X0 || xa > X0 + SW) return;
        const a = Math.max(X0 + 1, xa), b = Math.min(X0 + SW - 1, xb), w = b - a; if (w < 3) return;
        ov += `<path d="M${f1(a + 4)} ${y} L${f1(b - 4)} ${y} L${f1(b)} ${y + 11} L${f1(b - 4)} ${y + 22} L${f1(a + 4)} ${y + 22} L${f1(a)} ${y + 11}Z" fill="${d.c}" fill-opacity=".28" stroke="${d.c}" stroke-width="1.3"/>`;
        const lb = [d.l, d.l.split(' ')[0]].find(x => w > x.length * fs * 0.56 + 6);
        if (lb) ov += `<text x="${f1((a + b) / 2)}" y="${y + 15.5}" text-anchor="middle" font-size="${fs * 0.9}" font-weight="700" fill="#f2f6f8">${esc(lb)}</text>`;
      });
    }
    const mf = st.meas || o.meas, ml = mf ? (mf(st) || autoMeas(on)) : autoMeas(on);
    if (ml && ml.length){
      const w = Math.max(...ml.map(m => m.t.length)) * fs * 0.6 + 14, x = X0 + SW - w - 6;
      ov += `<rect x="${f1(x)}" y="${Y0 + 6}" width="${f1(w)}" height="${ml.length * (fs + 5) + 8}" rx="4" fill="#000" fill-opacity=".6" stroke="#2f5a48"/>` + ml.map((m, k) => `<text x="${f1(x + 7)}" y="${Y0 + 6 + (k + 1) * (fs + 5)}" font-size="${fs}" font-weight="600" fill="${m.c || '#e9eef1'}">${esc(m.t)}</text>`).join('');
    }
    if (!st.run) ov += `<text x="${X0 + 8}" y="${Y0 + fs + 6}" font-size="${fs}" font-weight="700" fill="#ff5c5c">STOP</text>`;
    ovG.innerHTML = ov;
    /* info bar */
    let inf = '', x = X0, yb = Y0 + SH + 8 + fs;
    st.ch.forEach((c, i) => { if (!c.on) return; const t = `${i + 1}:${vfmt(c.vdiv)}`; inf += `<text x="${x}" y="${yb}" font-size="${fs}" font-weight="700" fill="${TRC[i]}">${t}</text>`; x += t.length * fs * 0.62 + 12; });
    if (st.math && st.ch[0].on && st.ch[1].on){ inf += `<text x="${x}" y="${yb}" font-size="${fs}" font-weight="700" fill="${TRM}">M=1−2</text>`; }
    const t2 = st.xy ? 'XY  X=CH1  Y=CH2' : `${tfmt(st.tdiv)}/div   T ${o.trigLab || 'CH1 ↑'}`;
    inf += `<text x="${X0}" y="${yb + fs + 8}" font-size="${fs}" fill="#cfd6da">${t2}</text>`;
    if (o.title) inf += `<text x="${X0 + SW}" y="${yb + fs + 8}" text-anchor="end" font-size="${fs * 0.9}" fill="#8f9ba2">${esc(o.title)}</text>`;
    inG.innerHTML = inf;
    $('.sc-tl', box).textContent = tfmt(st.tdiv) + '/div';
    $$('[data-sc^="c"]', box).forEach(b => b.setAttribute('aria-pressed', +b.dataset.sc.slice(1) === st.selCh ? 'true' : 'false'));
    const xb = $('[data-sc="xy"]', box); if (xb) xb.setAttribute('aria-pressed', st.xy ? 'true' : 'false');
    const mb = $('[data-sc="math"]', box); if (mb) mb.setAttribute('aria-pressed', st.math ? 'true' : 'false');
    $('[data-sc="run"]', box).setAttribute('aria-pressed', st.run ? 'false' : 'true');
  }
  function autoMeas(on){
    const r = [];
    on.slice(0, 4).forEach(i => { const s = stats(st.ch[i].src); r.push({c:TRC[i], t:`${i + 1}: Vpp ${vfmt(s.pp)}${s.freq ? '  f ' + hzfmt(s.freq) : '  Avg ' + vfmt(s.mean)}`}); });
    return r;
  }
  function auto(){
    const on = st.ch.map((c, i) => c.on && c.src ? i : -1).filter(i => i > -1);
    if (o.autoT){ const t = o.autoT(st); if (t) st.tdiv = t; }
    if (st.xy){ [0, 1].forEach(i => { const c = st.ch[i]; if (!c.on || !c.src) return; const s = stats(c.src); c.vdiv = VDIVS.find(v => v >= Math.max(s.pp, 0.01) / 6) || 200; c.pos = -(s.mx + s.mn) / 2 / c.vdiv; }); draw(); return; }
    const n = Math.max(1, on.length) + (st.math && st.ch[0].on && st.ch[1].on ? 1 : 0);
    on.forEach((i, k) => {
      const c = st.ch[i], s = stats(c.src), span = 8 / n * 0.8, need = Math.max(s.pp, s.pp < 0.2 ? Math.max(0.3, Math.abs(s.mx + s.mn) / 2 * 0.3) : 0) / span;
      c.vdiv = VDIVS.find(v => v >= need) || 200;
      const ctr = 4 - (k + 0.5) * 8 / n; c.pos = ctr - (s.mx + s.mn) / 2 / c.vdiv;
    });
    if (st.math) st.mathPos = 4 - (n - 0.5) * 8 / n;
    draw();
  }
  IL.onAct(box, '[data-sc]', b => {
    const a = b.dataset.sc, c = st.ch[st.selCh];
    if (a === 't-' || a === 't+'){ const i = TDIVS.indexOf(st.tdiv), j = IL.clamp((i < 0 ? 7 : i) + (a === 't+' ? 1 : -1), 0, TDIVS.length - 1); st.tdiv = TDIVS[j]; if (o.onT) o.onT(st); }
    else if (a[0] === 'c' && a.length === 2) st.selCh = +a[1];
    else if (a === 'v-' || a === 'v+'){ const i = VDIVS.indexOf(c.vdiv), j = IL.clamp((i < 0 ? 7 : i) + (a === 'v+' ? 1 : -1), 0, VDIVS.length - 1); const mid = (c.pos) * c.vdiv; c.vdiv = VDIVS[j]; c.pos = mid / c.vdiv; }
    else if (a === 'auto'){ auto(); if (o.onAuto) o.onAuto(st); return; }
    else if (a === 'xy') st.xy = !st.xy;
    else if (a === 'math') st.math = !st.math;
    else if (a === 'run') st.run = !st.run;
    draw(); if (o.onCtl) o.onCtl(a, st);
  });
  let acc = 0;
  const an = IL.animate(box, dt => { if (!box.isConnected){ an.stop(); return; } acc += dt; if (acc < 0.14 || !st.run) return; acc = 0; if (o.tick) o.tick(st); draw(); });
  draw();
  return {st, draw, auto, stats, svg, box, setCh(i, src, opt){ const c = st.ch[i]; c.src = src; c.on = !!src; if (opt) Object.assign(c, opt); }};
}

/* =====================================================================
   the 11 encoder types: connector, label, supply, drive port, scope signals
   ===================================================================== */
const sq = (x) => (x - Math.floor(x)) < 0.5 ? 1 : 0;               // square of a phase in cycles
const frac = x => x - Math.floor(x);
/* PWM-edge noise: decaying ringing at every switching edge of an 8 kHz PWM (edges each 62.5 µs) */
const PWM_E = 62.5e-6;
const ring = (t, a) => { const u = frac(t / PWM_E) * PWM_E; return u < 3e-6 ? a * Math.exp(-u / 0.6e-6) * Math.sin(PI2 * u / 0.5e-6) : 0; };
const ringMM = (ta, tb, a, base) => { const k0 = Math.ceil(ta / PWM_E), k1 = Math.floor(tb / PWM_E); return k1 >= k0 || frac(ta / PWM_E) * PWM_E < 1e-6 ? [base[0] - a * 0.8, base[1] + a] : null; };
const ENC_LIST = ['ttl', 'htl', 'hall', 'sincos', 'res', 'ssi', 'endat', 'biss', 'hiper', 'dsl', 'vendor'];
const ENC = {
  ttl:{n:'TTL / RS-422', ar:'تزايدي TTL (RS-422)', conn:'M23 · 12-pin', port:'X11', sup:['5'],
    pins:[['1', 'B−'], ['2', '0V sense'], ['3', 'Z+'], ['4', 'Z−'], ['5', 'A+'], ['6', 'A−'], ['8', 'B+'], ['10', '0V'], ['12', '+5V']],
    tps:['A+', 'A−', 'B+', 'B−', 'Z+', 'Z−', '+5V', '0V'], hint:'ستة أسلاك إشارة في أزواج A و B و Z مع نفيها وتغذية 5 V وإشارة مربعة 0–3.4 V: هذا تزايدي TTL بخط تفاضلي RS-422.'},
  htl:{n:'HTL push-pull', ar:'تزايدي HTL (دفع وسحب)', conn:'M12 · 8-pin', port:'X12', sup:['12', '24'],
    pins:[['1', '0V'], ['2', '+24V'], ['3', 'A'], ['4', '/A'], ['5', 'B'], ['6', '/B'], ['7', 'Z'], ['8', '/Z']],
    tps:['A', '/A', 'B', '/B', 'Z', '/Z', '+24V', '0V'], hint:'إشارة مربعة بارتفاع قريب من 24 V وتغذية 10–30 V على موصّل M12: هذا تزايدي HTL.'},
  hall:{n:'Hall U/V/W', ar:'حسّاسات Hall للتبديل U/V/W', conn:'5-pin · JST', port:'X11', sup:['5'],
    pins:[['1', '+5V'], ['2', '0V'], ['3', 'HU'], ['4', 'HV'], ['5', 'HW']],
    tps:['HU', 'HV', 'HW', '+5V', '0V'], hint:'ثلاث إشارات مربعة متزحزحة 120° كهربية بأربع دورات في اللفة: هذه حسّاسات Hall للتبديل U/V/W.'},
  sincos:{n:'Sin/Cos 1 Vpp', ar:'جيبي Sin/Cos 1 Vpp', conn:'M23 · 17-pin', port:'X13', sup:['5'],
    pins:[['1', 'A+'], ['2', 'A−'], ['11', 'B+'], ['12', 'B−'], ['3', 'R+'], ['13', 'R−'], ['7', '+5V'], ['10', '0V']],
    tps:['A+', 'A−', 'B+', 'B−', 'R+', 'R−', '+5V', '0V'], hint:'إشارتان جيبيتان 0.5 Vpp حول 2.5 V ترسمان دائرة في وضع XY: هذا إنكودر Sin/Cos 1 Vpp.'},
  res:{n:'Resolver', ar:'ريزولفر', conn:'flying leads · 6-wire', port:'X14', sup:['exc'],
    pins:[['R1', 'EXC+'], ['R2', 'EXC−'], ['S1', 'COS+'], ['S3', 'COS−'], ['S2', 'SIN+'], ['S4', 'SIN−']],
    tps:['R1-R2', 'S1-S3', 'S2-S4', 'R1', 'S1', 'S2'], hint:'ستة أسلاك لملفات بلا إلكترونيات وإثارة 7 Vrms عند 10 kHz: هذا ريزولفر.'},
  ssi:{n:'SSI', ar:'مطلق SSI', conn:'M23 · 12-pin', port:'X15', sup:['12', '24'],
    pins:[['1', '0V'], ['2', '+V'], ['3', 'CLK+'], ['4', 'CLK−'], ['5', 'DATA+'], ['6', 'DATA−']],
    tps:['CLK+', 'CLK−', 'DATA+', 'DATA−', '+24V', '0V'], hint:'خط ساعة وخط بيانات بإطار رمز Gray وتغذية 10–30 V: هذا مطلق SSI.'},
  endat:{n:'EnDat 2.2', ar:'مطلق EnDat 2.2', conn:'M12 · 8-pin', port:'X15', sup:['5', '12'],
    pins:[['1', 'UP sense'], ['2', 'UP'], ['3', 'CLOCK+'], ['4', 'CLOCK−'], ['5', 'DATA+'], ['6', 'DATA−'], ['7', '0V'], ['8', '0V sense']],
    tps:['CLOCK+', 'CLOCK−', 'DATA+', 'DATA−', 'UP', '0V'], hint:'ساعة وبيانات ثنائية الاتجاه يبدأ فيها الدرايف بأمر MODE ثم يرد الإنكودر بالموضع و CRC: هذا EnDat 2.2.'},
  biss:{n:'BiSS-C', ar:'مطلق BiSS-C', conn:'M12 · 8-pin', port:'X15', sup:['5'],
    pins:[['1', '0V'], ['2', '+5V'], ['3', 'MA+'], ['4', 'MA−'], ['5', 'SLO+'], ['6', 'SLO−']],
    tps:['MA+', 'MA−', 'SLO+', 'SLO−', '+5V', '0V'], hint:'خطا MA و SLO مع إطار Ack ثم Start ثم CDS والموضع ثم CRC: هذا BiSS-C.'},
  hiper:{n:'HIPERFACE', ar:'HIPERFACE (Sin/Cos + RS-485)', conn:'8-pin · round', port:'X13', sup:['12'],
    pins:[['1', 'REFCOS'], ['2', 'Data+'], ['3', 'Data−'], ['4', 'COS'], ['5', 'SIN'], ['6', 'REFSIN'], ['7', 'GND'], ['8', 'Us 7–12V']],
    tps:['SIN', 'REFSIN', 'COS', 'REFCOS', 'Data+', 'Data−', 'Us', 'GND'], hint:'إشارتا SIN و COS مع مرجع 2.5 V وقناة بيانات RS-485 وتغذية 7–12 V: هذا HIPERFACE.'},
  dsl:{n:'HIPERFACE DSL', ar:'HIPERFACE DSL (كابل واحد)', conn:'hybrid power · DSL pair', port:'X20', sup:['12'],
    pins:[['1', 'U'], ['2', 'PE'], ['3', 'W'], ['4', 'V'], ['A', 'DSL+'], ['B', 'DSL−'], ['C', 'BR+'], ['D', 'BR−']],
    tps:['DSL+', 'DSL−', 'DSL±'], hint:'لا كابل إنكودر منفصل: زوج DSL داخل كابل القدرة يحمل التغذية والبيانات معًا: هذا HIPERFACE DSL.'},
  vendor:{n:'Serial ABS 23-bit', ar:'مطلق تسلسلي خاص بالمصنّع (23-bit)', conn:'6-pin · mini', port:'X16', sup:['5'],
    pins:[['1', '+5V'], ['2', '0V'], ['3', 'BAT+'], ['4', 'BAT−'], ['5', 'PS'], ['6', '/PS']],
    tps:['PS', '/PS', '+5V', '0V', 'BAT+', 'BAT−'], hint:'زوج واحد PS و /PS نصف مزدوج مع بطارية 3.6 V لحفظ عدد اللفات: هذا مطلق تسلسلي خاص بالمصنّع.'}
};
/* drive feedback ports (multi-encoder interface module) */
const PORTS = [
  {id:'X11', k:'dsub15', t:'INC RS-422 + HALL', d:'مدخل A/B/Z بخط تفاضلي 5 V مع Hall U/V/W'},
  {id:'X12', k:'term', t:'HTL 24 V', d:'مدخل تزايدي HTL بجهد 24 V'},
  {id:'X13', k:'dsub15', t:'SIN/COS 1Vpp · HIPERFACE', d:'مدخل جيبي 1 Vpp مع قناة RS-485 لـ HIPERFACE'},
  {id:'X14', k:'dsub9', t:'RESOLVER', d:'مدخل الريزولفر: إثارة وملفا SIN و COS'},
  {id:'X15', k:'m12', t:'SSI · EnDat · BiSS', d:'مدخل تسلسلي بساعة وبيانات CLK/DATA'},
  {id:'X16', k:'mini', t:'ABS SERIAL + BAT', d:'مدخل تسلسلي ثنائي الأسلاك مع البطارية'},
  {id:'X20', k:'hyb', t:'MOTOR + DSL', d:'موصّل القدرة الهجين للمحرك مع زوج DSL'}
];
const SUPS = [['5', '5 V'], ['12', '12 V'], ['24', '24 V'], ['exc', 'AC EXC 7 Vrms']];

/* ---------------- signal models: one source per test point ---------------- */
const nz = a => a * gauss();
/* Gray code of a position as a bit array (MSB first) */
function grayBits(v, n){ const g = v ^ (v >>> 1); const r = []; for (let i = n - 1; i >= 0; i--) r.push((g >>> i) & 1); return r; }
function binBits(v, n, lsb){ const r = []; for (let i = n - 1; i >= 0; i--) r.push(Math.floor(v / Math.pow(2, i)) % 2); return lsb ? r.reverse() : r; }
const rbits = n => Array.from({length:n}, () => Math.random() < 0.5 ? 1 : 0);
/* a serial line: list of segments [{a,b (s), bits?, bit (s), lvl?}] inside one frame of period P; idle level 'idle' */
function lineFn(segs, P, idle){
  return u => { u = frac(u / P) * P; for (const s of segs){ if (u >= s.a && u < s.b){ if (s.bits){ const k = Math.floor((u - s.a) / s.bit); return s.bits[Math.min(k, s.bits.length - 1)]; } if (s.man){ const k = Math.floor((u - s.a) / s.bit), h = frac((u - s.a) / s.bit) < 0.5; const b = s.man[Math.min(k, s.man.length - 1)]; return h ? b : 1 - b; } return s.lvl; } } return idle; };
}
function encSig(type, fault, rpm, seed){
  seed = seed || {};
  const n = rpm || 300, rev = n / 60, ph = seed.ph == null ? Math.random() : seed.ph;
  const T = {}, noisy = fault === 'noise', RA = noisy ? 1.7 : 0;
  const mk = (f, per, mm, dc) => ({f, per, mm, dc});
  const out = {tp:T, tdiv:20e-6, decode:null, view:[], dmm:{}};
  /* differential RS-422 pair from a 0/1 function */
  const pair = (bit, hi, lo, per, nA, mmPulse) => {
    const p = mk(t => (bit(t) ? hi : lo) + (nA ? ring(t, nA) : 0) + nz(0.012), per, nA ? (a, b) => ringMM(a, b, nA, [lo, hi]) : mmPulse ? (a, b) => mmPulse(a, b) ? [lo, hi] : null : null, (hi + lo) / 2);
    const m = mk(t => (bit(t) ? lo : hi) + (nA ? ring(t, nA * 0.55) : 0) + nz(0.012), per, nA ? (a, b) => ringMM(a, b, nA * 0.55, [lo, hi]) : mmPulse ? (a, b) => mmPulse(a, b) ? [lo, hi] : null : null, (hi + lo) / 2);
    return [p, m];
  };
  const flt = (v, a) => mk(t => v + nz(a || 0.03), 0, null, v);
  if (type === 'ttl' || type === 'htl'){
    const ppr = type === 'ttl' ? 2500 : 1024, fA = ppr * rev, hi = type === 'ttl' ? (fault === 'supply' ? 2.9 : 3.5) : 22.6, lo = type === 'ttl' ? 0.3 : 0.7;
    const A = t => sq(fA * t + ph), B = t => sq(fA * t + ph - 0.25), w = 0.25 / ppr;
    const zr = t => rev * t + 0.37, Z = t => frac(zr(t)) < w ? 1 : 0;
    const zmm = (a, b) => Math.floor(zr(b)) > Math.floor(zr(a)) || frac(zr(a)) < w;
    const nA = noisy ? (type === 'ttl' ? RA : 6.5) : 0;
    const [ap, am] = pair(A, hi, lo, 1 / fA, nA), [bp, bm] = pair(B, hi, lo, 1 / fA, nA), [zp, zm] = pair(Z, hi, lo, 1 / fA, 0, zmm);
    const nm = type === 'ttl' ? ['A+', 'A−', 'B+', 'B−', 'Z+', 'Z−'] : ['A', '/A', 'B', '/B', 'Z', '/Z'];
    T[nm[0]] = ap; T[nm[1]] = fault === 'pair' ? flt(2.4, 0.09) : am; T[nm[2]] = fault === 'chan' ? flt(lo) : bp; T[nm[3]] = fault === 'chan' ? flt(hi) : bm; T[nm[4]] = zp; T[nm[5]] = zm;
    const sup = type === 'ttl' ? '+5V' : '+24V'; T[sup] = flt(type === 'ttl' ? (fault === 'supply' ? 4.38 : 5.04) : 23.8, 0.02); T['0V'] = flt(0, 0.01);
    out.tdiv = 20e-6; out.view = [nm[0], nm[1], nm[2], nm[3]];
  } else if (type === 'hall'){
    const fe = 4 * rev, hi = fault === 'supply' ? 4.1 : 4.9, lo = 0.25;
    const H = k => mk(t => (sq(fe * t + ph - k / 3) ? hi : lo) + nz(0.03), 0, null, (hi + lo) / 2);
    T.HU = H(0); T.HV = fault === 'chan' ? flt(hi) : H(1); T.HW = H(2); T['+5V'] = flt(fault === 'supply' ? 4.2 : 5.02, 0.02); T['0V'] = flt(0, 0.01);
    out.tdiv = 10e-3; out.view = ['HU', 'HV', 'HW'];
  } else if (type === 'sincos' || type === 'hiper'){
    const per = type === 'sincos' ? 2048 : 1024, f = per * rev, a = (type === 'sincos' ? 0.25 : 0.5) * (fault === 'amp' ? 0.34 : 1);
    const s = t => Math.sin(PI2 * (f * t + ph)), c = t => Math.cos(PI2 * (f * t + ph));
    const nA = noisy ? 0.35 : 0;
    const sig = (g, k) => mk(t => 2.5 + k * a * g(t) + (nA ? ring(t, nA) : 0) + nz(0.004), 1 / f, nA ? (x, y) => ringMM(x, y, nA, [2.5 - a, 2.5 + a]) : null, 2.5);
    if (type === 'sincos'){
      T['A+'] = sig(s, 1); T['A−'] = sig(s, -1); T['B+'] = fault === 'chan' ? flt(2.5, 0.004) : sig(c, 1); T['B−'] = fault === 'chan' ? flt(2.5, 0.004) : sig(c, -1);
      const rr = t => rev * t + 0.61, rw = 1.5 / per, R = t => { const x = frac(rr(t)); return x < rw ? Math.sin(Math.PI * x / rw) : 0; };
      T['R+'] = mk(t => 2.5 - 0.2 + 0.45 * R(t) + nz(0.004), 0, (x, y) => Math.floor(rr(y)) > Math.floor(rr(x)) ? [2.3, 2.75] : null, 2.3);
      T['R−'] = mk(t => 2.5 + 0.2 - 0.45 * R(t) + nz(0.004), 0, (x, y) => Math.floor(rr(y)) > Math.floor(rr(x)) ? [2.25, 2.7] : null, 2.7);
      T['+5V'] = flt(5.03, 0.01); T['0V'] = flt(0, 0.01);
      out.view = ['A+', 'B+', 'A−', 'B−']; out.xy = ['A+', 'B+'];
    } else {
      T.SIN = fault === 'chan' ? flt(2.5, 0.004) : sig(s, 1); T.REFSIN = flt(2.5, 0.004); T.COS = sig(c, 1); T.REFCOS = flt(2.5, 0.004);
      /* RS-485 parameter channel: a 4-byte request burst at 9600 Bd every 20 ms */
      const bd = 1 / 9600, bytes = [0x40, 0x42, 0x02, 0x00].map(b => [0].concat(binBits(b, 8, true), [1])).flat();
      const L = lineFn([{a:0.5e-3, b:0.5e-3 + bytes.length * bd, bits:bytes, bit:bd}], 20e-3, 1);
      T['Data+'] = mk(t => (L(t) ? 3.3 : 1.2) + nz(0.02), 0, null, 3.2); T['Data−'] = mk(t => (L(t) ? 1.2 : 3.3) + nz(0.02), 0, null, 1.3);
      T.Us = flt(11.2, 0.02); T.GND = flt(0, 0.01);
      out.view = ['SIN', 'COS', 'REFSIN', 'Data+']; out.xy = ['SIN', 'COS'];
    }
    out.tdiv = 50e-6;
  } else if (type === 'res'){
    const fc = 10e3, Vp = 7 * SQ2, k = 0.5, th = t => PI2 * (rev * t + ph);
    const car = t => Math.sin(PI2 * fc * t);
    T['R1-R2'] = mk(t => Vp * car(t) + nz(0.03), 1 / fc, null, 0);
    T['S1-S3'] = mk(t => k * Vp * Math.cos(th(t)) * car(t) + nz(0.02), 1 / fc, null, 0);
    T['S2-S4'] = fault === 'wind' ? flt(0, 0.02) : mk(t => k * Vp * Math.sin(th(t)) * car(t) + nz(0.02), 1 / fc, null, 0);
    out.tdiv = 20e-3; out.view = ['R1-R2', 'S1-S3', 'S2-S4'];
  } else if (type === 'ssi' || type === 'endat' || type === 'biss'){
    let ck, dt, P, segsC, segsD, dec;
    if (type === 'ssi'){
      const b = 1e-6, pos = seed.pos || rint(1, 33554431), bits = grayBits(pos, 25); P = 50e-6;
      segsC = [{a:2e-6, b:2e-6 + 26 * b, bits:Array.from({length:52}, (_, i) => i % 2), bit:b / 2}];
      segsD = [{a:2e-6, b:2.5e-6, lvl:1}, {a:2.5e-6, b:27.5e-6, bits, bit:b}, {a:27.5e-6, b:47.5e-6, lvl:0}];
      dec = [{a:2.5e-6, b:27.5e-6, l:'POS 25 bit · Gray', c:'#3fd0ff'}, {a:27.5e-6, b:47.5e-6, l:'tm', c:'#9aa1a6'}];
      out.tdiv = 5e-6;
    } else if (type === 'endat'){
      const b = 0.5e-6, a0 = 2e-6; P = 50e-6;
      const mode = [0, 0, 0, 1, 1, 1], st = [1, 0, 1], pos = rbits(37), crc = rbits(5);
      const nCk = 2 + 6 + 3 + 3 + 37 + 5;
      segsC = [{a:a0, b:a0 + nCk * b, bits:Array.from({length:nCk * 2}, (_, i) => i % 2), bit:b / 2}];
      let u = a0; const S = (n, o) => { const s = Object.assign({a:u, b:u + n * b}, o); u += n * b; return s; };
      segsD = [S(2, {lvl:0}), S(6, {bits:mode, bit:b}), S(3, {lvl:0}), S(3, {bits:st, bit:b}), S(37, {bits:pos, bit:b}), S(5, {bits:crc, bit:b})];
      segsD.push({a:u, b:u + 10e-6, lvl:0});
      const d = segsD; dec = [{a:d[1].a, b:d[1].b, l:'MODE ↓', c:'#ff9f1c'}, {a:d[2].a, b:d[2].b, l:'Tcal', c:'#9aa1a6'}, {a:d[3].a, b:d[3].b, l:'S F1 F2', c:'#7dff9a'}, {a:d[4].a, b:d[4].b, l:'POS ST25 + MT12', c:'#3fd0ff'}, {a:d[5].a, b:d[5].b, l:'CRC', c:'#ff6bd6'}, {a:u, b:u + 10e-6, l:'tm', c:'#9aa1a6'}];
      out.tdiv = 5e-6;
    } else {
      const b = 0.4e-6, a0 = 2e-6; P = 40e-6;
      const pos = rbits(26), crc = rbits(6), nCk = 1 + 3 + 1 + 1 + 26 + 2 + 6;
      segsC = [{a:a0, b:a0 + nCk * b, bits:Array.from({length:nCk * 2}, (_, i) => i % 2), bit:b / 2}];
      let u = a0 + b; const S = (n, o) => { const s = Object.assign({a:u, b:u + n * b}, o); u += n * b; return s; };
      segsD = [{a:a0, b:a0 + b, lvl:1}, S(3, {lvl:0}), S(1, {lvl:1}), S(1, {lvl:0}), S(26, {bits:pos, bit:b}), S(2, {bits:[1, 1], bit:b}), S(6, {bits:crc, bit:b})];
      segsD.push({a:u, b:u + 12e-6, lvl:0});
      const d = segsD; dec = [{a:d[1].a, b:d[1].b, l:'Ack', c:'#9aa1a6'}, {a:d[2].a, b:d[3].b, l:'S CDS', c:'#7dff9a'}, {a:d[4].a, b:d[4].b, l:'POS 26 bit', c:'#3fd0ff'}, {a:d[5].a, b:d[5].b, l:'nE nW', c:'#ffd23f'}, {a:d[6].a, b:d[6].b, l:'CRC 6', c:'#ff6bd6'}, {a:u, b:u + 12e-6, l:'timeout', c:'#9aa1a6'}];
      out.tdiv = 5e-6;
    }
    ck = lineFn(segsC, P, 1); dt = lineFn(segsD, P, 1);
    const nm = {ssi:['CLK+', 'CLK−', 'DATA+', 'DATA−', '+24V'], endat:['CLOCK+', 'CLOCK−', 'DATA+', 'DATA−', 'UP'], biss:['MA+', 'MA−', 'SLO+', 'SLO−', '+5V']}[type];
    const [cp, cm] = pair(ck, 3.5, 0.3, 0.2e-6, 0), [dp, dm] = pair(dt, 3.5, 0.3, 0.2e-6, noisy ? RA : 0);
    T[nm[0]] = cp; T[nm[1]] = cm; T[nm[2]] = dp; T[nm[3]] = fault === 'pair' ? flt(2.4, 0.09) : dm;
    T[nm[4]] = flt(type === 'ssi' ? 23.9 : type === 'endat' ? 5.06 : 5.02, 0.02); T['0V'] = flt(0, 0.01);
    out.decode = () => { const r = []; for (let k = 0; k < 3; k++) dec.forEach(d => r.push({a:d.a + k * P, b:d.b + k * P, l:d.l, c:d.c})); return r; };
    out.view = [nm[0], nm[2], nm[3]];
  } else if (type === 'vendor'){
    const b = 0.4e-6, P = 62.5e-6, a0 = 2e-6;
    const byte = v => [0].concat(binBits(v, 8, true), [1]);
    const req = byte(0x32), resp = [0x32, 0x00, rint(0, 255), rint(0, 255), rint(0, 127), rint(0, 255), rint(0, 255), 0x00, rint(0, 255)].map(byte);
    const segs = [{a:a0, b:a0 + 10 * b, bits:req, bit:b}]; let u = a0 + 10 * b + 3e-6; const segB = [];
    resp.forEach(r => { segs.push({a:u, b:u + 10 * b, bits:r, bit:b}); segB.push(u); u += 10 * b; });
    const Ln = lineFn(segs, P, -1);          // -1 → bus idle (no driver), biased
    const lv = (x, p) => x < 0 ? (p ? 2.8 : 2.2) : (x ? (p ? 3.7 : 1.2) : (p ? 1.2 : 3.7));
    const nA = noisy ? RA : 0;
    T.PS = mk(t => lv(Ln(t), 1) + (nA ? ring(t, nA) : 0) + nz(0.025), 0.2e-6, nA ? (x, y) => ringMM(x, y, nA, [1.2, 3.7]) : null, 2.8);
    T['/PS'] = fault === 'pair' ? flt(2.45, 0.09) : mk(t => lv(Ln(t), 0) + nz(0.025), 0.2e-6, null, 2.2);
    T['+5V'] = flt(5.05, 0.02); T['0V'] = flt(0, 0.01); T['BAT+'] = flt(fault === 'batt' ? +rnd(2.72, 2.95).toFixed(2) : +rnd(3.58, 3.66).toFixed(2), 0.003); T['BAT−'] = flt(0, 0.003);
    const lab = ['CF', 'SF', 'D0', 'D1', 'D2', 'MT0', 'MT1', 'ALM', 'CRC'];
    out.decode = () => { const r = []; for (let k = 0; k < 2; k++){ r.push({a:a0 + k * P, b:a0 + 10 * b + k * P, l:'REQ ↓', c:'#ff9f1c'}); segB.forEach((s, i) => r.push({a:s + k * P, b:s + 10 * b + k * P, l:lab[i], c:i >= 2 && i <= 6 ? '#3fd0ff' : '#7dff9a'})); } return r; };
    out.tdiv = 5e-6; out.view = ['PS', '/PS'];
  } else if (type === 'dsl'){
    const b = 1 / 9.375e6, nb = 80, P = nb * b;
    const bits = [1, 0, 1, 0, 1, 0, 1, 1].concat(rbits(8), rbits(40), rbits(8), rbits(16));
    const M = lineFn([{a:0, b:P, man:bits, bit:b}], P, 0);
    const nA = noisy ? 0.9 : 0;
    const dd = t => { const v = M(t) ? 1 : -1; return noisy && frac(t / PWM_E) * PWM_E < 3e-6 ? v * 0.35 + ring(t, nA) : v; };
    T['DSL+'] = mk(t => 11.6 + 0.3 * dd(t) + nz(0.02), b / 2, nA ? (x, y) => ringMM(x, y, nA, [11.3, 11.9]) : null, 11.6);
    T['DSL−'] = mk(t => -0.3 * dd(t) + nz(0.02), b / 2, nA ? (x, y) => ringMM(x, y, nA, [-0.3, 0.3]) : null, 0);
    T['DSL±'] = mk(t => 0.6 * dd(t) + nz(0.015), b / 2, nA ? (x, y) => ringMM(x, y, nA * 1.4, [-0.6, 0.6]) : null, 0);
    const segs = [[0, 8, 'SYNC', '#9aa1a6'], [8, 16, 'HDR', '#7dff9a'], [16, 56, 'POS fast', '#3fd0ff'], [56, 64, 'PIPE', '#ffd23f'], [64, 80, 'CRC', '#ff6bd6']];
    out.decode = () => { const r = []; for (let k = 0; k < 14; k++) segs.forEach(s => r.push({a:k * P + s[0] * b, b:k * P + s[1] * b, l:noisy && k % 3 === 1 && s[2] === 'CRC' ? 'CRC ✗' : s[2], c:noisy && k % 3 === 1 && s[2] === 'CRC' ? '#ff5c5c' : s[3]})); return r; };
    out.tdiv = 1e-6; out.view = ['DSL±', 'DSL+'];
  }
  return out;
}
/* DMM DC reading of a test point */
const dcOf = src => src ? (src.dc != null ? src.dc : 0) : 0;

/* static mini scope (types tab snapshot) */
function miniScope(type){
  const sg = encSig(type, 'ok', 300, {ph:0.1, pos:0x0A3F1C2}), W = 300, H = 150, ids = sg.view.slice(0, 3), T = sg.tdiv * 10, n = ids.length;
  let h = `<svg viewBox="0 0 ${W} ${H + 20}" role="img" aria-label="لقطة إشارات ${esc(ENC[type].n)}"><rect x="0" y="0" width="${W}" height="${H + 20}" rx="8" fill="#353b40"/><rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="#071009"/>`;
  for (let i = 1; i < 10; i++) h += `<line x1="${6 + i * (W - 12) / 10}" y1="6" x2="${6 + i * (W - 12) / 10}" y2="${H - 6}" stroke="#1f3a2f" stroke-dasharray="1 3"/>`;
  ids.forEach((id, k) => {
    const src = sg.tp[id]; let mn = Infinity, mx = -Infinity; for (let i = 0; i < 600; i++){ const v = src.f(T * i / 600); mn = Math.min(mn, v); mx = Math.max(mx, v); }
    if (mx - mn < 0.3){ const m = (mx + mn) / 2; mn = m - 0.5; mx = m + 0.5; }
    const band = (H - 12) / n, y0 = 6 + band * k + 6, y1 = y0 + band - 12, sc = v => y1 - (v - mn) / Math.max(1e-6, mx - mn) * (y1 - y0);
    let up = '', dn = ''; const NC = 150, dt = T / NC;
    for (let i = 0; i <= NC; i++){ let a = Infinity, b = -Infinity; const K = src.per && src.per < dt * 4 ? 14 : 3; for (let j = 0; j < K; j++){ const v = src.f(i * dt + dt * j / K); a = Math.min(a, v); b = Math.max(b, v); } const x = 6 + i * (W - 12) / NC; up += (i ? 'L' : 'M') + f1(x) + ' ' + f1(sc(b)); dn = 'L' + f1(x) + ' ' + f1(sc(a)) + dn; }
    h += `<path d="${up}${dn}Z" fill="${TRC[k]}" stroke="${TRC[k]}" stroke-width="1.2"/><text x="12" y="${y0 + 9}" font-size="10" font-weight="700" fill="${TRC[k]}">${esc(id)}</text>`;
  });
  return h + `<text x="${W - 8}" y="${H + 12}" text-anchor="end" font-size="10" fill="#cfd6da">${tfmt(sg.tdiv)}/div</text></svg>`;
}

/* ---------------- connector faces ---------------- */
/* returns svg <g> drawing of a connector face with its pins; o.tg → each pin is a tap target data-pin */
function connFace(kind, pins, cx, cy, o){
  o = o || {}; const R = o.R || 92; let h = '';
  const pinG = (id, x, y, lab, r) => {
    const t = o.tg ? `<g class="hit" data-pin="${esc(id)}" tabindex="0" role="button" aria-label="${esc((o.al || 'الطرف ') + id)}"><circle class="ring" cx="${f1(x)}" cy="${f1(y)}" r="${r + 5}"/>` : '<g>';
    return t + `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="#d9b25a" stroke="#7a5a1c" stroke-width="2"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${r * 0.45}" fill="#8f6a24"/><text x="${f1(x)}" y="${f1(y - r - 4)}" text-anchor="middle" font-size="${o.fs || 11}" font-weight="700" fill="#f2f2ea">${esc(lab)}</text><text class="pl" data-pl="${esc(id)}" x="${f1(x)}" y="${f1(y + r + 13)}" text-anchor="middle" font-size="${o.fs || 11}" font-weight="700" fill="#7dff9a"></text></g>`;
  };
  if (kind === 'dsub15' || kind === 'dsub9'){
    const n1 = kind === 'dsub15' ? 8 : 5, n2 = kind === 'dsub15' ? 7 : 4, w = n1 * 26 + 24;
    h += `<rect x="${cx - w / 2 - 16}" y="${cy - 40}" width="${w + 32}" height="80" rx="8" fill="#b9c1c7" stroke="#6b7378" stroke-width="2"/><circle cx="${cx - w / 2 - 6}" cy="${cy}" r="6" fill="#6b7378"/><circle cx="${cx + w / 2 + 6}" cy="${cy}" r="6" fill="#6b7378"/>
    <path d="M${cx - w / 2 + 6} ${cy - 26} L${cx + w / 2 - 6} ${cy - 26} L${cx + w / 2 - 18} ${cy + 26} L${cx - w / 2 + 18} ${cy + 26}Z" fill="#22282c" stroke="#555"/>`;
    for (let i = 0; i < n1; i++) h += `<circle cx="${cx - (n1 - 1) * 13 + i * 26}" cy="${cy - 11}" r="5" fill="#d9b25a"/>`;
    for (let i = 0; i < n2; i++) h += `<circle cx="${cx - (n2 - 1) * 13 + i * 26}" cy="${cy + 11}" r="5" fill="#d9b25a"/>`;
    return h;
  }
  if (kind === 'term'){
    h += `<rect x="${cx - 80}" y="${cy - 30}" width="160" height="60" rx="5" fill="#2e8b57" stroke="#1d5a38" stroke-width="2"/>`;
    for (let i = 0; i < 8; i++) h += `<rect x="${cx - 74 + i * 19}" y="${cy - 22}" width="14" height="16" fill="#cfd6da"/><circle cx="${cx - 67 + i * 19}" cy="${cy + 10}" r="5" fill="#9aa1a6" stroke="#555"/>`;
    return h;
  }
  if (kind === 'mini'){
    h += `<rect x="${cx - 52}" y="${cy - 30}" width="104" height="60" rx="6" fill="#eceae2" stroke="#8d969b" stroke-width="2"/><rect x="${cx - 40}" y="${cy - 20}" width="80" height="40" rx="3" fill="#22282c"/>`;
    for (let i = 0; i < 6; i++) h += `<rect x="${cx - 32 + (i % 3) * 26}" y="${cy - 13 + Math.floor(i / 3) * 16}" width="12" height="9" fill="#d9b25a"/>`;
    return h;
  }
  /* round connectors (M23 / M12 / hybrid / flying leads) */
  if (kind === 'leads'){
    const cols = ['#d32f2f', '#222', '#e0b000', '#2f6fd8', '#2e8b57', '#9b59b6'];
    pins.forEach((p, i) => { const x = cx - 100 + i * 40; h += `<path d="M${cx} ${cy - 80} C${cx} ${cy - 30} ${x} ${cy - 40} ${x} ${cy + 10}" fill="none" stroke="${cols[i]}" stroke-width="5"/><rect x="${x - 5}" y="${cy + 8}" width="10" height="16" fill="#cfd6da"/>`; });
    h += `<rect x="${cx - 24}" y="${cy - 100}" width="48" height="24" rx="6" fill="#22282c"/>`;
    pins.forEach((p, i) => { const x = cx - 100 + i * 40; if (o.tg) h += pinG(p[0], x, cy + 40, p[0], 10); else h += `<text x="${x}" y="${cy + 44}" text-anchor="middle" font-size="${o.fs || 11}" font-weight="700" fill="#e9eef1">${p[0]}</text>`; });
    return h;
  }
  const knurl = Array.from({length:36}, (_, i) => { const a = i * PI2 / 36; return `<line x1="${f1(cx + (R + 4) * Math.cos(a))}" y1="${f1(cy + (R + 4) * Math.sin(a))}" x2="${f1(cx + (R + 12) * Math.cos(a))}" y2="${f1(cy + (R + 12) * Math.sin(a))}" stroke="#5b656b" stroke-width="3"/>`; }).join('');
  h += `<circle cx="${cx}" cy="${cy}" r="${R + 14}" fill="#9aa1a6" stroke="#5b656b" stroke-width="2"/>${knurl}<circle cx="${cx}" cy="${cy}" r="${R}" fill="#22282c" stroke="#111" stroke-width="2"/><rect x="${cx - 7}" y="${cy - R - 2}" width="14" height="14" rx="2" fill="#9aa1a6"/>`;
  const np = pins.length, rp = o.pr || (np > 9 ? 9 : 11);
  pins.forEach((p, i) => {
    let x, y;
    if (o.layout && o.layout[i]){ x = cx + o.layout[i][0] * R; y = cy + o.layout[i][1] * R; }
    else { const ring2 = np > 8 && i >= 8, k = ring2 ? i - 8 : i, m = ring2 ? np - 8 : Math.min(np, 8), rr = ring2 ? R * 0.3 : R * 0.68, a = -Math.PI / 2 + (k + 0.5) * PI2 / m; x = cx + rr * Math.cos(a); y = cy + rr * Math.sin(a); }
    h += o.tg ? pinG(p[0], x, y, p[0], rp) : `<circle cx="${f1(x)}" cy="${f1(y)}" r="${rp * 0.7}" fill="#d9b25a" stroke="#7a5a1c"/>`;
  });
  return h;
}

/* =====================================================================
   TAB 1 · nameplate (l2): Kt = T/I, f = p/2·n/60, Tpk = Kt·Imax, connector pins
   ===================================================================== */
const NP_POW = {pins:[['1', 'U'], ['PE', 'PE'], ['3', 'W'], ['4', 'V'], ['A', 'BR+'], ['B', 'BR−'], ['C', 'TH+'], ['D', 'TH−']],
  lay:[[-0.5, -0.28], [0, 0.02], [0.5, -0.28], [0, -0.6], [-0.58, 0.32], [0.58, 0.32], [-0.24, 0.66], [0.24, 0.66]],
  lab:['U', 'V', 'W', 'PE', 'BR+', 'BR−'], fn:{U:'طور U', V:'طور V', W:'طور W', PE:'الأرضي الواقي', 'BR+':'الفرامل +24 V', 'BR−':'الفرامل 0 V', 'TH+':'حسّاس الحرارة', 'TH−':'حسّاس الحرارة'}};
const NP_ENC = {pins:[['1', 'PS'], ['2', '/PS'], ['3', 'BAT+'], ['4', 'BAT−'], ['5', 'n.c.'], ['6', 'n.c.'], ['7', '+5V'], ['8', '0V'], ['9', 'SHIELD']],
  lab:['PS', '/PS', '+5V', '0V', 'BAT+', 'BAT−'], fn:{PS:'بيانات تسلسلية +', '/PS':'بيانات تسلسلية −', 'BAT+':'بطارية 3.6 V +', 'BAT−':'بطارية −', 'n.c.':'غير موصول', '+5V':'تغذية الإنكودر', '0V':'مرجع التغذية', SHIELD:'الحجب'}};
function genNP(){ return {n:pick([1200, 1500, 1800, 2250, 2400, 3600, 4500]), calc:{}, lab:{p:{}, e:{}}, done:{}}; }
function servoPlateSvg(){
  const r = (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="#9aa1a6" stroke="#6b7378"/><circle cx="${x}" cy="${y}" r="1.6" fill="#5b6266"/>`;
  const rows = [['Rated output', '1.5 kW', 'Rated torque', '4.77 N·m'], ['Rated speed', '3000 r/min', 'Rated current', '4.0 A rms'], ['Max. speed', '5000 r/min', 'Max. current', '12.0 A rms'], ['Ke (L-L rms)', '72 V/krpm', 'Poles', '8'], ['R (L-L, 20 °C)', '2.8 Ω', 'L (L-L)', '12 mH']];
  return `<svg viewBox="0 0 440 300" role="img" aria-label="لوحة بيانات محرك المحور X">
  <defs><linearGradient id="sp-al" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef1f2"/><stop offset=".55" stop-color="#cfd5d8"/><stop offset="1" stop-color="#e6eaec"/></linearGradient></defs>
  <rect x="4" y="4" width="432" height="292" rx="12" fill="url(#sp-al)" stroke="#8d969b" stroke-width="2"/>
  ${r(18, 18)}${r(422, 18)}${r(18, 282)}${r(422, 282)}
  <text x="220" y="30" text-anchor="middle" font-size="15" font-weight="700" fill="#1d2529">AC SERVO MOTOR · PMSM</text>
  <text x="220" y="46" text-anchor="middle" font-size="10" fill="#3d474d">IEC 60034-1 · 3~ 400 V class drive</text>
  <line x1="30" y1="54" x2="410" y2="54" stroke="#59636a"/>
  <text x="34" y="70" font-size="11" fill="#1d2529">Type SM-150-30-A23   S/N 26-0911   2026</text>
  <rect x="30" y="78" width="380" height="135" fill="none" stroke="#59636a"/>
  ${rows.map((rw, j) => `<line x1="30" y1="${78 + (j + 1) * 27}" x2="410" y2="${78 + (j + 1) * 27}" stroke="#9aa3a8"/>
    <text x="36" y="${96 + j * 27}" font-size="10.5" fill="#3d474d">${rw[0]}</text><text x="200" y="${96 + j * 27}" text-anchor="end" font-size="12.5" font-weight="700" fill="#11181c">${rw[1]}</text>
    <text x="216" y="${96 + j * 27}" font-size="10.5" fill="#3d474d">${rw[2]}</text><text x="404" y="${96 + j * 27}" text-anchor="end" font-size="12.5" font-weight="700" fill="#11181c">${rw[3]}</text>`).join('')}
  <line x1="208" y1="78" x2="208" y2="213" stroke="#59636a"/>
  <text x="34" y="232" font-size="11" fill="#1d2529">Encoder: ABS 23 bit serial · multi-turn · BAT 3.6 V</text>
  <text x="34" y="250" font-size="11" fill="#1d2529">Brake: —     Ins. class F   IP65   S1   Ta 0–40 °C</text>
  <text x="34" y="268" font-size="11" fill="#1d2529">Mass 5.6 kg    J 2.1 kg·cm²</text>
  <text x="406" y="268" text-anchor="end" font-size="10" fill="#4d575d">LearnElectricals</text>
  </svg>`;
}
function connSvg(which){
  const C = which === 'p' ? NP_POW : NP_ENC, W = 280;
  return `<svg viewBox="0 0 ${W} 280" role="img" aria-label="${which === 'p' ? 'وجه موصّل القدرة' : 'وجه موصّل الإنكودر'}">
  <text x="${W / 2}" y="20" text-anchor="middle" font-size="12" font-weight="700" class="tx">${which === 'p' ? 'POWER · M23 (mating side)' : 'ENCODER · M17 9-pin (mating side)'}</text>
  ${connFace('round', C.pins, W / 2, 150, {tg:true, R:100, layout:C.lay, pr:which === 'p' ? 14 : 12, fs:12})}
  </svg>`;
}
BUILD.nameplate = host => {
  if (!S.np || !S.np.lab) S.np = genNP();
  const N = S.np; const fE = 4 * N.n / 60;
  host.innerHTML = `
  <div class="grid2">
    <div class="dev${N.done.calc ? ' ok' : ''}" id="np-a"><h3><span class="n">1</span>اقرأ لوحة البيانات واحسب</h3>
      <div class="stage">${servoPlateSvg()}</div>
      <p class="sym">${ar(`شاشة الدرايف تعرض سرعة المحرك n = ${N.n} r/min.`)}</p>
      ${fld('kt', 'ثابت العزم Kt من العزم والتيار المقننين', 'N·m/A', N.calc.kt)}
      ${fld('f', `التردد الكهربي للتيار عند ${N.n} r/min`, 'Hz', N.calc.f)}
      ${fld('tp', 'العزم الأقصى عند أقصى تيار', 'N·m', N.calc.tp)}
      <div class="row"><button type="button" class="btn pri" data-a="c1">تحقّق من الحساب</button></div>
      <p class="msg" id="np-m1" aria-live="polite"></p><div id="np-fx"></div>
    </div>
    <div class="dev${N.done.pins ? ' ok' : ''}" id="np-b"><h3><span class="n">2</span>حدّد أطراف الموصّلات من جدول الكتيّب</h3>
      <p class="note">${ar('الوجه مرسوم من جهة التزاوج، والأرقام مطبوعة على العازل. اختر اسم الإشارة ثم انقر طرفها على الموصّل.')}</p>
      <div class="tblw"><table class="tbl hm pins-t"><tr><th>Pin</th>${NP_POW.pins.map(p => `<th>${esc(p[0])}</th>`).join('')}</tr><tr><td>POWER</td>${NP_POW.pins.map(p => `<td>${esc(p[1])}</td>`).join('')}</tr></table></div>
      <div class="tblw"><table class="tbl hm pins-t"><tr><th>Pin</th>${NP_ENC.pins.map(p => `<th>${esc(p[0])}</th>`).join('')}</tr><tr><td>ENCODER</td>${NP_ENC.pins.map(p => `<td>${esc(p[1])}</td>`).join('')}</tr></table></div>
      <p class="typ">${ar('محرك المحور X بلا فرامل، فالطرفان A و B فارغان فيه؛ وهما في المحور Z من العائلة نفسها للفرامل BR+ و BR−.')}</p>
    </div>
  </div>
  <div class="conn-grid">
    <div class="dev" id="np-cp"><h3>${ar('موصّل القدرة والفرامل')}</h3><div class="pinchips" id="np-chp">${NP_POW.lab.map(l => `<button type="button" class="btn" data-lb="p:${esc(l)}">${esc(l)}</button>`).join('')}</div><div class="stage">${connSvg('p')}</div></div>
    <div class="dev" id="np-ce"><h3>${ar('موصّل الإنكودر')}</h3><div class="pinchips" id="np-che">${NP_ENC.lab.map(l => `<button type="button" class="btn" data-lb="e:${esc(l)}">${esc(l)}</button>`).join('')}</div><div class="stage">${connSvg('e')}</div></div>
  </div>
  <p class="msg" id="np-m2" aria-live="polite">${ar('اختر اسم إشارة من الأزرار، ثم انقر طرفها على الموصّل.')}</p>
  ${foot()}`;
  const q = s => $(s, host), inp = k => q(`[data-k="${k}"]`);
  ['kt', 'f', 'tp'].forEach(k => inp(k).addEventListener('input', () => { N.calc[k] = inp(k).value; save(); }));
  function c1(){
    const kt = num(inp('kt').value), f = num(inp('f').value), tp = num(inp('tp').value), m = q('#np-m1');
    const KT = 4.77 / 4.0, TP = KT * 12.0;
    const okK = nearA(kt, KT, 0.02), okF = near(f, fE, 0.01), okT = nearA(tp, TP, 0.2);
    mark(inp('kt'), okK); mark(inp('f'), okF); mark(inp('tp'), okT);
    if (!okK) return say(m, ar(nearA(kt, 4.0 / 4.77, 0.03) ? 'قسمت التيار على العزم؛ Kt = T ÷ I.' : 'Kt = العزم المقنن ÷ التيار المقنن = 4.77 ÷ 4.0.'), 'bad');
    if (!okF) return say(m, ar(near(f, 8 * N.n / 60, 0.01) ? 'استخدمت عدد الأقطاب 8 بدل أزواج الأقطاب 4.' : near(f, N.n / 60, 0.01) ? 'هذا تردد دوران العمود؛ اضربه في أزواج الأقطاب 4.' : 'f = (p ÷ 2) × n ÷ 60 مع p = 8 أقطاب.'), 'bad');
    if (!okT) return say(m, ar(nearA(tp, 4.77, 0.1) ? 'هذا العزم المقنن؛ استخدم أقصى تيار Imax = 12.0 A.' : 'Tpk = Kt × Imax = Kt × 12.0 A.'), 'bad');
    N.done.calc = true; save(); q('#np-a').classList.add('ok');
    q('#np-fx').innerHTML = `<div class="fx">Kt = T / I = 4.77 / 4.0 = <b>${f3(KT)} N·m/A</b><br>check: Kt ≈ √3 · Ke / (1000·2π/60) = √3 × ${f3(72 / (1000 * PI2 / 60))} = <b>${f2(SQ3 * 72 / (1000 * PI2 / 60))}</b> <span class="ok">✓</span><br>f = (p/2) · n / 60 = 4 × ${N.n} / 60 = <b>${f1(fE)} Hz</b><br>Tpk = Kt · Imax = ${f3(KT)} × 12.0 = <b>${f2(TP)} N·m</b> (catalogue 14.3)</div>`;
    say(m, ar('صحيح: الثوابت متسقة مع Ke، والتردد الكهربي أربعة أضعاف تردد الدوران.'), 'ok');
    finish();
  }
  /* pins */
  let cur = null; const m2 = q('#np-m2');
  function paint(){
    ['p', 'e'].forEach(w => {
      const svg = q(w === 'p' ? '#np-cp svg' : '#np-ce svg');
      $$('.pl', svg).forEach(t => { t.textContent = N.lab[w][t.dataset.pl] || ''; });
      $$('[data-lb]', host).forEach(b => { const [ww, l] = b.dataset.lb.split(':'); if (ww !== w) return; const used = Object.values(N.lab[w]).includes(l); b.classList.toggle('used', used); b.setAttribute('aria-pressed', cur === b.dataset.lb ? 'true' : 'false'); });
    });
    const okP = NP_POW.lab.every(l => Object.values(N.lab.p).includes(l)), okE = NP_ENC.lab.every(l => Object.values(N.lab.e).includes(l));
    q('#np-cp').classList.toggle('ok', okP); q('#np-ce').classList.toggle('ok', okE);
    if (okP && okE && !N.done.pins){ N.done.pins = true; save(); q('#np-b').classList.add('ok'); say(m2, ar('صحيح: كل الأطراف في مكانها. لاحظ أن الإنكودر يحتاج زوجًا ملفوفًا للبيانات PS و /PS وأن البطارية تحفظ عدد اللفات.'), 'ok'); finish(); }
  }
  IL.onAct(host, '[data-lb]', b => { if (b.classList.contains('used')) return; cur = cur === b.dataset.lb ? null : b.dataset.lb; paint(); if (cur) say(m2, ar(`انقر الآن الطرف ${cur.split(':')[1]} على الموصّل.`)); });
  IL.onAct(host, '[data-pin]', g => {
    const w = g.closest('#np-cp') ? 'p' : 'e', C = w === 'p' ? NP_POW : NP_ENC, pin = g.dataset.pin, sig = C.pins.find(p => p[0] === pin)[1];
    if (!cur || cur[0] !== w) return say(m2, ar(cur ? 'هذا الاسم لموصّل آخر؛ انقر الطرف على الموصّل الصحيح.' : 'اختر اسم الإشارة من الأزرار أولًا.'), 'bad');
    const l = cur.split(':')[1];
    if (N.lab[w][pin]) return say(m2, ar(`الطرف ${pin} محدَّد من قبل بأنه ${N.lab[w][pin]}.`), 'bad');
    if (sig !== l) return say(m2, ar(sig === 'n.c.' ? `الطرف ${pin} غير موصول n.c. في جدول الكتيّب.` : `الطرف ${pin} في جدول الكتيّب هو ${sig}، لا ${l}.`), 'bad');
    N.lab[w][pin] = l; cur = null; save(); say(m2, ar(`صحيح: ${pin} = ${l} (${C.fn[l]}).`), 'ok'); paint();
  });
  function finish(){ if (N.done.calc && N.done.pins) win('nameplate', 'أحسنت: حسبت Kt والتردد الكهربي والعزم الأقصى، وحدّدت أطراف القدرة والفرامل والإنكودر.'); }
  IL.onAct(host, '[data-a]', b => { if (b.dataset.a === 'c1') c1(); });
  paint(); if (N.done.calc){ N.done.calc = false; c1(); }
  newScenario(host, 'nameplate', () => { S.np = genNP(); });
  demo(host, 'nameplate', async () => {
    N.calc = {}; N.lab = {p:{}, e:{}}; N.done = {}; paint();
    await dSet(inp('kt'), '1.19'); await dSet(inp('f'), f1(fE)); await dSet(inp('tp'), '14.3'); await dClick(q('[data-a="c1"]'));
    for (const w of ['p', 'e']){ const C = w === 'p' ? NP_POW : NP_ENC; for (const l of C.lab){ const pin = C.pins.find(p => p[1] === l)[0]; await dClick(q(`[data-lb="${w}:${l}"]`), 250); await dClick(q(`${w === 'p' ? '#np-cp' : '#np-ce'} [data-pin="${pin}"]`), 250); } }
  });
};

/* =====================================================================
   TAB 2 · winding (l3): R unbalance, 500 V megger (encoder/brake off), Back-EMF → Ke
   ===================================================================== */
const WD_V = [['ok', 'سليم: يعود إلى الخدمة'], ['turn', 'قصر بين لفات ملف: يُستبدل المحرك أو يُعاد لفّه في مركز خدمة'], ['hr', 'وصلة عالية المقاومة في الموصّل أو الطرف: تُصلح الوصلة'], ['moist', 'رطوبة في العزل: يُجفَّف المحرك ثم يُعاد الاختبار'], ['demag', 'فقد في مغنطة الدوّار: يُستبدل الدوّار أو المحرك']];
function genWD(){
  const ax = pick(['X', 'Y', 'Z', 'A']), M = AX[ax], kind = pick(['ok', 'turn', 'hr', 'moist', 'demag']), T = rint(21, 27), k = rint(0, 2);
  const a = 1 + 0.00393 * (T - 20), rph = [0, 1, 2].map(() => jit(M.R / 2 * a, 0.002));
  if (kind === 'turn') rph[k] *= 1 - rnd(0.13, 0.17);
  if (kind === 'hr') rph[k] += M.R * rnd(0.10, 0.14);
  const R = [rph[0] + rph[1], rph[1] + rph[2], rph[2] + rph[0]].map(v => +v.toFixed(3));
  const ke = M.Ke * (kind === 'demag' ? rnd(0.85, 0.89) : rnd(0.985, 1.01));
  const kl = [1, 1, 1].map(() => jit(1, 0.004)); if (kind === 'turn'){ kl[k] *= 0.97; kl[(k + 2) % 3] *= 0.97; }
  const ir = kind === 'moist' ? +rnd(1.5, 6).toFixed(1) : Math.round(rnd(400, 1800));
  return {ax, kind, T, R, ke, kl, ir, meas:{}, irM:null, enc:true, brk:M.brake, short:false, rng:1000, probes:false, rpm:0, calc:{}, done:{}, verdict:''};
}
const ubOf = a => { const mx = Math.max(...a), mn = Math.min(...a), av = (a[0] + a[1] + a[2]) / 3; return (mx - mn) / av * 100; };
const WD_P = ['UV', 'VW', 'WU'];
function lowOhmSvg(NB){
  return `<svg viewBox="${NB ? '0 0 290 500' : '0 0 560 260'}" role="img" aria-label="جهاز المقاومة المنخفضة وأطراف المحرك">
  <rect x="8" y="10" width="250" height="240" rx="16" fill="#3c4449" stroke="#1d2124" stroke-width="2.5"/>
  <rect x="20" y="22" width="226" height="216" rx="10" fill="#4b545a"/>
  <text x="133" y="40" text-anchor="middle" font-size="9.5" font-weight="700" fill="#f6cf45">LOW-OHM METER · 4-WIRE · 1 A</text>
  <rect x="32" y="48" width="202" height="78" rx="5" fill="#1d2124"/><rect x="36" y="52" width="194" height="70" rx="3" fill="#c7d3b4"/>
  <text id="wd-big" x="220" y="96" text-anchor="end" font-size="28" font-weight="700" class="lcdt">-----</text>
  <text x="220" y="115" text-anchor="end" font-size="11" class="lcdt">Ω</text><text id="wd-i" x="42" y="66" font-size="11" class="lcdt">I 0.00 A</text>
  <g class="hit" id="wd-test" tabindex="0" role="button" aria-label="TEST"><circle class="ring" cx="196" cy="166" r="26"/><circle cx="196" cy="166" r="21" fill="#2e7d32" stroke="#103d12" stroke-width="3"/><text x="196" y="170" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">TEST</text></g>
  ${plugSvg('red', 60, 196, '#d32f2f', 'C1·P1')}${plugSvg('blk', 124, 196, '#222', 'P2·C2')}
  <g transform="${NB ? 'translate(-276 252)' : ''}">${adapterSvg(false)}</g>
  <g class="cabs"></g></svg>`;
}
/* motor power-cable test adapter (U V W PE ferrules) and, for the megger, the motor's encoder / brake connectors */
function adapterSvg(meg, W){
  let h = `<rect x="292" y="14" width="258" height="232" rx="12" fill="#5d666c" stroke="#3c4449" stroke-width="3"/>
  <rect x="304" y="26" width="234" height="${meg ? 98 : 208}" rx="8" fill="#ecebe4" stroke="#9aa1a6"/>
  <text x="421" y="${meg ? 42 : 46}" text-anchor="middle" font-size="11" font-weight="700" fill="#333">MOTOR POWER · test adapter</text>`;
  [['U', 340, '#8a5a2b'], ['V', 400, '#22282c'], ['W', 460, '#8d969b'], ['PE', 516, '#3d9b3d']].forEach(([k, x, c]) => {
    const y = meg ? 92 : 150;
    h += `<path d="M${x} ${y + (meg ? 30 : 90)} L${x} ${y + 12}" stroke="${c}" stroke-width="8" stroke-linecap="round"/>`;
    h += (meg && k !== 'PE') ? `<circle cx="${x}" cy="${y}" r="12" fill="#c9a24a" stroke="#6d5420" stroke-width="2"/><text x="${x}" y="${y - 18}" text-anchor="middle" font-size="12" font-weight="700" fill="#11181c">${k}</text>` : tpSvg(meg ? k : k, x, y, k, {tc:'#11181c'});
  });
  if (meg) h += `<g class="hit" data-a="short" tabindex="0" role="button" aria-label="وصلة القصر U-V-W"><rect x="320" y="76" width="160" height="34" fill="transparent"/><rect class="wd-sh" x="328" y="86" width="144" height="12" rx="6" fill="#d08a3a" stroke="#7a4518" stroke-width="2" opacity=".18"/><text class="wd-sht" x="400" y="59" text-anchor="middle" font-size="10" fill="#333">U–V–W short</text></g>${tpSvg('UVW', 400, 92, '', {r:9, fill:'transparent', stroke:'transparent', core:'transparent'})}`;
  if (meg){
    h += `<rect x="304" y="134" width="234" height="100" rx="8" fill="#2b2f33"/>
    <text x="421" y="150" text-anchor="middle" font-size="10.5" font-weight="700" fill="#e9eef1">MOTOR CONNECTORS</text>
    <g class="hit" data-con="enc" tabindex="0" role="button" aria-label="موصّل الإنكودر"><rect x="312" y="158" width="104" height="70" fill="transparent"/><circle class="ring" cx="350" cy="196" r="28"/><circle cx="350" cy="196" r="24" fill="#9aa1a6" stroke="#5b656b" stroke-width="2"/><circle cx="350" cy="196" r="16" fill="#22282c"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<circle cx="${f1(350 + 9 * Math.cos(i * PI2 / 7))}" cy="${f1(196 + 9 * Math.sin(i * PI2 / 7))}" r="2.2" fill="#d9b25a"/>`).join('')}<g class="wd-encp"><rect x="333" y="170" width="34" height="52" rx="6" fill="#3a4146" stroke="#111"/><path d="M350 170 L350 150 C350 140 330 140 320 140" stroke="#2f7d4f" stroke-width="7" fill="none"/></g><text x="388" y="200" font-size="10" font-weight="700" fill="#e9eef1">ENC</text></g>
    ${tpSvg('ENC', 350, 196, '', {r:7, fill:'transparent', stroke:'transparent', core:'transparent'})}
    <g class="hit" data-con="brk" tabindex="0" role="button" aria-label="موصّل الفرامل"><rect x="430" y="158" width="104" height="70" fill="transparent"/><circle class="ring" cx="468" cy="196" r="28"/><circle cx="468" cy="196" r="20" fill="#9aa1a6" stroke="#5b656b" stroke-width="2"/><circle cx="468" cy="196" r="13" fill="#22282c"/><circle cx="462" cy="196" r="2.6" fill="#d9b25a"/><circle cx="474" cy="196" r="2.6" fill="#d9b25a"/><g class="wd-brkp"><rect x="453" y="172" width="30" height="48" rx="6" fill="#3a4146" stroke="#111"/><path d="M468 172 L468 150 C468 140 490 140 500 140" stroke="#b03030" stroke-width="7" fill="none"/></g><text x="500" y="200" font-size="10" font-weight="700" fill="#e9eef1">BRK</text></g>
    ${tpSvg('BRK', 468, 196, '', {r:7, fill:'transparent', stroke:'transparent', core:'transparent'})}`;
  }
  return h;
}
function meggerSvg(NB){
  return `<svg viewBox="${NB ? '0 0 290 500' : '0 0 560 260'}" role="img" aria-label="جهاز اختبار العزل وموصّلات المحرك">
  <rect x="8" y="10" width="250" height="240" rx="16" fill="#f2c230" stroke="#c99a12" stroke-width="2.5"/>
  <rect x="18" y="20" width="230" height="220" rx="10" fill="#3c4449"/>
  <text x="133" y="36" text-anchor="middle" font-size="9.5" font-weight="700" fill="#f6cf45">INSULATION TESTER 5 kV</text>
  <rect x="30" y="44" width="206" height="96" rx="6" fill="#f3f1e6"/>
  <path d="M48 128 A85 85 0 0 1 218 128" fill="none" stroke="#333" stroke-width="1.5"/>
  ${['0.1', '1', '10', '100', '1G', '∞'].map((t, i) => { const a = Math.PI * (1 - i / 5), x = 133 + 85 * Math.cos(a), y = 128 - 85 * Math.sin(a) * 0.95; return `<line x1="${f1(133 + 78 * Math.cos(a))}" y1="${f1(128 - 78 * Math.sin(a) * 0.95)}" x2="${f1(x)}" y2="${f1(y)}" stroke="#333" stroke-width="1.5"/><text x="${f1(133 + 66 * Math.cos(a))}" y="${f1(128 - 66 * Math.sin(a) * 0.95 + 4)}" text-anchor="middle" font-size="9" fill="#333">${t}</text>`; }).join('')}
  <text x="133" y="104" text-anchor="middle" font-size="9" fill="#666">MΩ</text>
  <line id="wd-ndl" x1="133" y1="128" x2="133" y2="50" stroke="#c0352b" stroke-width="2" transform="rotate(-90 133 128)"/><circle cx="133" cy="128" r="5" fill="#333"/>
  <rect x="30" y="146" width="122" height="30" rx="4" fill="#c7d3b4"/><text id="mg-lcd" x="146" y="168" text-anchor="end" font-size="17" font-weight="700" class="lcdt">----</text>
  <g class="hit" data-a="rng" tabindex="0" role="button" aria-label="جهد الاختبار"><rect x="158" y="146" width="78" height="30" rx="6" fill="#22282c" stroke="#8d969b"/><text id="mg-rng" x="197" y="166" text-anchor="middle" font-size="13" font-weight="700" fill="#f6cf45">1000 V</text></g>
  <g class="hit" id="mg-test" tabindex="0" role="button" aria-label="TEST"><circle class="ring" cx="208" cy="208" r="24"/><circle cx="208" cy="208" r="19" fill="#c0352b" stroke="#6e1a14" stroke-width="3"/><text x="208" y="212" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">TEST</text></g>
  ${plugSvg('line', 60, 200, '#d32f2f', 'LINE')}${plugSvg('earth', 124, 200, '#2e7d32', 'EARTH')}
  <g transform="${NB ? 'translate(-276 252)' : ''}">${adapterSvg(true)}</g>
  <g class="cabs"></g></svg>`;
}
BUILD.winding = host => {
  if (!S.wd || !S.wd.R) S.wd = genWD();
  const W = S.wd, M = AX[W.ax], NB = NARROW(), OX = NB ? -276 : 0, OY = NB ? 252 : 0;
  host.innerHTML = `
  <p class="sym">${ar(`محرك المحور ${W.ax} على المنضدة بعد فكّه، وحرارة الورشة ${W.T} °C.`)}<br>${[f1(M.P) + ' kW', 'Ke ' + M.Ke + ' V/1000 r/min', 'R(L-L) ' + M.R + ' Ω @ 20 °C', M.poles + ' poles'].concat(M.brake ? ['brake 24 V'] : []).map(L).join(' · ')}</p>
  <div class="dev" id="wd-d1"><h3><span class="n">1</span>مقاومة الملفات بأربعة أسلاك</h3>
    <p class="note">${ar('ضع ملقط C1·P1 على طرف وملقط P2·C2 على طرف آخر، ثم اضغط TEST. تُسجَّل القراءة في الجدول.')}</p>
    <div class="stage" style="max-width:560px;margin:0 auto;width:100%">${lowOhmSvg(NB)}</div>
    <p class="msg" id="wd-m1" aria-live="polite"></p>
    <div class="tblw"><table class="tbl hm" id="wd-tr"></table></div>
    ${fld('ub', 'عدم الاتزان (max − min)/avg', '%', W.calc.ub)}
    <div class="row"><button type="button" class="btn pri" data-a="cub">تحقّق</button></div>
    <p class="msg" id="wd-m1b" aria-live="polite"></p><div id="wd-fx1"></div>
  </div>
  <div class="dev" id="wd-d2"><h3><span class="n">2</span>اختبار العزل 500 V بين U/V/W المقصورة و PE</h3>
    <p class="note">${ar('افصل موصّل الإنكودر' + (M.brake ? ' وموصّل الفرامل' : '') + ' بالنقر عليه، واقصر U و V و W بالوصلة، واختر 500 V، ثم وصّل LINE إلى الملفات و EARTH إلى PE واضغط TEST.')}</p>
    <div class="stage" style="max-width:560px;margin:0 auto;width:100%">${meggerSvg(NB)}</div>
    <div class="row"><button type="button" class="btn" data-a="short" id="wd-shb"></button><button type="button" class="btn" data-a="rng" id="wd-rgb"></button><button type="button" class="btn" data-a="encT"></button>${M.brake ? '<button type="button" class="btn" data-a="brkT"></button>' : ''}</div>
    <p class="msg" id="wd-m2" aria-live="polite"></p>
  </div>
  <div class="dev" id="wd-d3"><h3><span class="n">3</span>Back-EMF: أدِر العمود واقرأ الجهد</h3>
    <p class="note">${ar('المحرك مفصول عن الدرايف. وصّل ثلاثة مجسّات تفاضلية على U-V و V-W و W-U، ثم أدِر العمود بالمثقاب، واقرأ السرعة من مقياس السرعة الضوئي.')}</p>
    <div class="row"><button type="button" class="btn" data-a="probes">${ar('وصّل المجسّات التفاضلية الثلاثة')}</button><button type="button" class="btn" data-a="drill">${ar('شغّل المثقاب على العمود')}</button><span class="pill" id="wd-tach">${L('---- r/min')}</span></div>
    <div id="wd-sc"></div>
    ${fld('ke', 'Ke المقيس = Vrms(L-L) × 1000 ÷ n', 'V/krpm', W.calc.ke)}
    ${fld('kp', 'Ke المقيس ÷ Ke الاسمي', '%', W.calc.kp)}
    <div class="row"><button type="button" class="btn pri" data-a="cke">تحقّق</button></div>
    <p class="msg" id="wd-m3" aria-live="polite"></p><div id="wd-fx3"></div>
  </div>
  <div class="dev" id="wd-d4"><h3><span class="n">4</span>الحكم</h3>
    <div class="tblw"><table class="tbl hm" id="wd-sum"></table></div>
    ${typical('عدم اتزان المقاومة حتى 2 % مقبول؛ العزل ≥ 100 MΩ لمحرك جديد و ≥ 10 MΩ في الخدمة؛ الجهود الثلاثة لـ Back-EMF متساوية ±2 %؛ Ke أقل من 95 % من الاسمي يدل على فقد مغنطة')}
    ${sel('vd', 'حالة المحرك والإجراء', WD_V, W.verdict)}
    <div class="row"><button type="button" class="btn pri" data-a="vd">احكم</button></div>
    <p class="msg" id="wd-m4" aria-live="polite"></p>
  </div>
  ${foot()}`;
  const q = s => $(s, host), inp = k => q(`[data-k="${k}"]`);
  /* ---- 1 resistance ---- */
  const svg1 = $('#wd-d1 svg', host), m1 = q('#wd-m1'); let busy = false;
  const LD = Leads(svg1, {single:true,
    plugs:{red:{x:60, y:196, color:'#d32f2f', el:$('[data-plug="red"]', svg1)}, blk:{x:124, y:196, color:'#222', el:$('[data-plug="blk"]', svg1)}},
    targets:{U:{x:340 + OX, y:150 + OY}, V:{x:400 + OX, y:150 + OY}, W:{x:460 + OX, y:150 + OY}, PE:{x:516 + OX, y:150 + OY}},
    canDis(){ return busy ? 'انتظر حتى تستقر القراءة.' : true; },
    msg(t){ if (t) say(m1, ar(t), 'bad'); else say(m1, ar('انقر الآن الطرف الذي تضع عليه الملقط، أو اسحب الملقط إليه.')); }, change(){ say(m1, ''); }});
  const big = q('#wd-big'), li = q('#wd-i');
  function test1(){
    if (busy) return;
    const a = LD.conn.red, b = LD.conn.blk;
    if (!a || !b) return say(m1, ar('ضع الملقطين على طرفين أولًا.'), 'bad');
    if (a === b) return say(m1, ar('الملقطان على الطرف نفسه؛ انقل أحدهما.'), 'bad');
    if (a === 'PE' || b === 'PE') return say(m1, ar('المقاومة بين الملف و PE تقاس بجهاز العزل لا بهذا الجهاز؛ ضع الملقطين على طورين.'), 'bad');
    const k = WD_P.find(p => p === a + b || p === b + a) || WD_P.find(p => p === b + a);
    const key = ['UV', 'VW', 'WU'].find(p => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
    const R = W.R[WD_P.indexOf(key)]; busy = true; say(m1, ar('تيار الاختبار يرتفع عبر محاثة الملف… انتظر الاستقرار.'));
    let t = 0, last = 0; const tau = M.Lmh / 1000 / M.R * 40;
    const loop = ts => {
      if (!host.isConnected) return;
      const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts; t += dt * (DEMO ? 2.5 * DSPEED : 1);
      li.textContent = 'I ' + f2(1 - Math.exp(-t / Math.max(0.15, tau))) + ' A';
      big.textContent = t < 0.5 ? '-----' : f3(R * (1 + 0.05 * Math.exp(-(t - 0.5) * 3)) * (1 + (Math.random() - 0.5) * 0.0008));
      if (t >= 2){ big.textContent = f3(R); li.textContent = 'I 1.00 A'; busy = false; W.meas[key] = R; save(); table(); say(m1, ar(`R(${key[0]}-${key[1]}) = ${f3(R)} Ω عند ${W.T} °C؛ سُجّلت في الجدول.`), 'ok'); return; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  q('#wd-test').addEventListener('click', test1);
  function table(){
    const v = WD_P.map(p => W.meas[p]);
    q('#wd-tr').innerHTML = `<tr><th>U-V Ω</th><th>V-W Ω</th><th>W-U Ω</th><th>avg Ω</th><th>ref @20 °C</th></tr><tr>${v.map(x => `<td>${x == null ? '—' : f3(x)}</td>`).join('')}<td>${v.every(x => x != null) ? f3((v[0] + v[1] + v[2]) / 3) : '—'}</td><td>${M.R}</td></tr>`;
    summary();
  }
  inp('ub').addEventListener('input', () => { W.calc.ub = inp('ub').value; save(); });
  function cub(){
    const m = q('#wd-m1b'), v = WD_P.map(p => W.meas[p]);
    if (v.some(x => x == null)) return say(m, ar('قِس المقاومات الثلاث أولًا.'), 'bad');
    const ub = ubOf(v), x = num(inp('ub').value), ok = nearA(x, ub, Math.max(0.12, ub * 0.04)); mark(inp('ub'), ok);
    if (!ok){ const mn = Math.min(...v); return say(m, ar(nearA(x, (Math.max(...v) - mn) / mn * 100, 0.15) ? 'قسّم على المتوسط لا على الأصغر.' : 'عدم الاتزان = (max − min) ÷ avg × 100.'), 'bad'); }
    W.done.r = true; save(); q('#wd-d1').classList.add('ok');
    q('#wd-fx1').innerHTML = `<div class="fx">Unbal. = (${f3(Math.max(...v))} − ${f3(Math.min(...v))}) / ${f3((v[0] + v[1] + v[2]) / 3)} × 100 = <b>${f2(ub)} %</b> <span class="${ub > 2 ? 'bad' : 'ok'}">${ub > 2 ? '> 2 %' : '≤ 2 %'}</span></div>`;
    say(m, ar(ub > 2 ? 'صحيح: عدم الاتزان فوق 2 %؛ قارن أي القراءات أقل أو أعلى من المرجع.' : 'صحيح: المقاومات متزنة.'), 'ok'); summary();
  }
  /* ---- 2 megger ---- */
  const svg2 = $('#wd-d2 svg', host), m2 = q('#wd-m2'); let mbusy = false;
  const LM = Leads(svg2, {single:true,
    plugs:{line:{x:60, y:200, color:'#d32f2f', el:$('[data-plug="line"]', svg2)}, earth:{x:124, y:200, color:'#2e7d32', el:$('[data-plug="earth"]', svg2)}},
    targets:{UVW:{x:400 + OX, y:92 + OY}, PE:{x:516 + OX, y:92 + OY}, ENC:{x:350 + OX, y:196 + OY}, BRK:{x:468 + OX, y:196 + OY}},
    ok(p, t){
      if (t === 'BRK' && !M.brake) return 'هذا المحرك بلا فرامل؛ الموصّل فارغ.';
      if (p === 'line' && t === 'ENC') return 'توقّف: لا تختبر الإنكودر بجهاز العزل أبدًا؛ 500 V تتلف دوائره.';
      if (p === 'line' && t === 'BRK') return 'توقّف: ملف الفرامل دائرة 24 V مستقلة؛ لا يدخل في اختبار ملفات المحرك.';
      if (t === 'ENC' || t === 'BRK') return 'ضع EARTH على PE لا على موصّل الإنكودر أو الفرامل.';
      if (t === 'UVW' && !W.short) return 'اقصر U و V و W بالوصلة أولًا كما يقضي الإجراء.';
      return true;
    },
    canDis(){ return mbusy ? 'لا تفصل المشبك أثناء الاختبار؛ انتظر التفريغ.' : true; },
    msg(t){ if (t) say(m2, ar(t), 'bad'); else say(m2, ar('انقر الآن مكان المشبك.')); }, change(){ say(m2, ''); }});
  function conPaint(){
    $('.wd-encp', svg2).style.display = W.enc ? '' : 'none'; $('.wd-brkp', svg2).style.display = W.brk ? '' : 'none';
    $('.wd-sh', svg2).setAttribute('opacity', W.short ? '1' : '.18'); $('.wd-sht', svg2).textContent = W.short ? 'U–V–W shorted ✓' : 'U–V–W short (tap)';
    q('#mg-rng').textContent = W.rng + ' V';
    if (!M.brake) $('[data-con="brk"]', svg2).style.opacity = '.35';
    q('#wd-shb').innerHTML = ar(W.short ? 'U-V-W مقصورة ✓' : 'اقصر U-V-W بالوصلة'); q('#wd-shb').classList.toggle('ok', W.short); q('#wd-rgb').innerHTML = ar('جهد الاختبار: ' + W.rng + ' V');
    const be = q('[data-a="encT"]'), bb = q('[data-a="brkT"]');
    be.innerHTML = ar(W.enc ? 'افصل موصّل الإنكودر' : 'الإنكودر مفصول ✓'); be.classList.toggle('ok', !W.enc);
    if (bb){ bb.innerHTML = ar(W.brk ? 'افصل موصّل الفرامل' : 'الفرامل مفصولة ✓'); bb.classList.toggle('ok', !W.brk); }
  }
  IL.onAct(svg2, '[data-con]', g => togCon(g.dataset.con));
  function togCon(c){
    if (mbusy) return;
    if (c === 'brk' && !M.brake) return say(m2, ar('هذا المحرك بلا فرامل.'), 'bad');
    if (c === 'enc'){ W.enc = !W.enc; say(m2, ar(W.enc ? 'أُعيد توصيل كابل الإنكودر.' : 'فُصل كابل الإنكودر عن المحرك ✓'), W.enc ? '' : 'ok'); }
    else { W.brk = !W.brk; say(m2, ar(W.brk ? 'أُعيد توصيل كابل الفرامل.' : 'فُصل كابل الفرامل ✓'), W.brk ? '' : 'ok'); }
    save(); conPaint();
  }
  function shortT(){ if (mbusy) return; W.short = !W.short; if (!W.short && LM.conn.line === 'UVW') LM.clear('line'); save(); conPaint(); }
  function rngT(){ if (mbusy) return; W.rng = W.rng === 250 ? 500 : W.rng === 500 ? 1000 : 250; save(); conPaint(); }
  const ndl = q('#wd-ndl'), mlcd = q('#mg-lcd');
  const angOf = r => { const lg = Math.log10(Math.max(0.1, r)); return -90 + IL.clamp((lg + 1) / 4, 0, 1) * 180 * 0.8 - 0; };
  function test2(){
    if (mbusy) return;
    if (W.enc || (M.brake && W.brk)) return say(m2, ar(`توقّف: افصل موصّل ${W.enc ? 'الإنكودر' : 'الفرامل'} قبل الاختبار؛ جهد الاختبار يتلف إلكترونيات الإنكودر ودائرة الفرامل.`), 'bad');
    if (LM.conn.line !== 'UVW' || LM.conn.earth !== 'PE') return say(m2, ar('وصّل LINE إلى الملفات المقصورة و EARTH إلى PE.'), 'bad');
    if (W.rng !== 500) return say(m2, ar(W.rng > 500 ? '1000 V أعلى من جهد الاختبار المعتمد لمحرك سيرفو 400 V؛ اختر 500 V.' : '250 V أقل من جهد الاختبار المعتمد؛ اختر 500 V.'), 'bad');
    mbusy = true; say(m2, ar('500 V DC على الملفات… القراءة ترتفع مع شحن سعة العزل.'));
    let t = 0, last = 0;
    const loop = ts => {
      if (!host.isConnected) return;
      const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts; t += dt * (DEMO ? 2.5 * DSPEED : 1);
      const r = W.ir * (1 - Math.exp(-t * 1.6)) + 0.1, a = angOf(r);
      ndl.setAttribute('transform', `rotate(${f1(a)} 133 128)`); mlcd.textContent = (r >= 100 ? f0(r) : f1(r)) + ' MΩ';
      if (t >= 3){ mbusy = false; W.irM = W.ir; save(); mlcd.textContent = (W.ir >= 100 ? f0(W.ir) : f1(W.ir)) + ' MΩ'; summary(); q('#wd-d2').classList.add('ok'); say(m2, ar(`IR = ${W.ir} MΩ عند 500 V. فرّغ الجهاز الشحنة تلقائيًا.${W.ir < 10 ? ' القيمة أقل من 10 MΩ!' : ''}`), W.ir < 10 ? 'bad' : 'ok'); return; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  q('#mg-test').addEventListener('click', test2);
  /* ---- 3 Back-EMF ---- */
  const sc = Scope(q('#wd-sc'), {xy:false, math:false, label:'راسم الإشارة: Back-EMF', title:'Back-EMF L-L', trigLab:'CH1 ↑',
    autoT(st){ if (!W.rpm) return 5e-3; const f = 4 * W.rpm / 60, tw = 2.5 / f; return TDIVS.find(t => t * 10 >= tw) || 0.1; },
    meas(st){ if (!W.probes || !W.rpm) return null; const f = 4 * W.rpm / 60; return ['U-V', 'V-W', 'W-U'].map((n, i) => ({c:TRC[i], t:`${i + 1} ${n}: ${f1(W.ke * W.kl[i] * W.rpm / 1000)} Vrms  ${f1(f)} Hz`})); }});
  function setEMF(){
    const on = W.probes;
    [0, 1, 2].forEach(i => {
      if (!on){ sc.setCh(i, null); return; }
      const Vp = SQ2 * W.ke * W.kl[i] * W.rpm / 1000, f = 4 * W.rpm / 60;
      sc.setCh(i, {f:t => Vp * Math.sin(PI2 * f * t - i * PI2 / 3) + nz(0.4), per:f ? 1 / f : 0, dc:0});
    });
    sc.auto();
    q('#wd-tach').innerHTML = L(W.rpm ? f0(W.rpm + rint(-2, 2)) + ' r/min' : '---- r/min');
  }
  /* ---- summary + verdict ---- */
  function summary(){
    const v = WD_P.map(p => W.meas[p]), all = v.every(x => x != null);
    q('#wd-sum').innerHTML = `<tr><th>R U-V/V-W/W-U Ω</th><th>Unbal. %</th><th>IR MΩ</th><th>Ke V/krpm</th><th>Ke %</th></tr><tr><td>${all ? v.map(f3).join(' / ') : '—'}</td><td class="${all ? (ubOf(v) > 2 ? 'bad' : 'ok') : ''}">${all && W.done.r ? f2(ubOf(v)) : '—'}</td><td class="${W.irM ? (W.irM < 10 ? 'bad' : 'ok') : ''}">${W.irM || '—'}</td><td>${W.done.ke ? f1(W.ke) : '—'}</td><td class="${W.done.ke ? (W.ke / M.Ke < 0.95 ? 'bad' : 'ok') : ''}">${W.done.ke ? f1(W.ke / M.Ke * 100) : '—'}</td></tr>`;
  }
  ['ke', 'kp'].forEach(k => inp(k).addEventListener('input', () => { W.calc[k] = inp(k).value; save(); }));
  function cke(){
    const m = q('#wd-m3');
    if (!W.probes || !W.rpm) return say(m, ar('وصّل المجسّات وأدِر العمود أولًا.'), 'bad');
    const vr = [0, 1, 2].map(i => W.ke * W.kl[i] * W.rpm / 1000), va = (vr[0] + vr[1] + vr[2]) / 3, ke = va * 1000 / W.rpm, kp = ke / M.Ke * 100;
    const x = num(inp('ke').value), y = num(inp('kp').value), okA = near(x, ke, 0.015), okB = nearA(y, kp, 1.5);
    mark(inp('ke'), okA); mark(inp('kp'), okB);
    if (!okA) return say(m, ar(near(x, va * SQ2 * 1000 / W.rpm, 0.02) ? 'استخدم القيمة الفعّالة rms لا القيمة القصوى.' : near(x, va / W.rpm, 0.02) ? 'Ke لكل 1000 r/min: اضرب في 1000.' : 'Ke = متوسط Vrms(L-L) × 1000 ÷ n.'), 'bad');
    if (!okB) return say(m, ar(`النسبة = Ke المقيس ÷ ${M.Ke} × 100.`), 'bad');
    W.done.ke = true; save(); q('#wd-d3').classList.add('ok');
    const sp = (Math.max(...vr) - Math.min(...vr)) / va * 100;
    q('#wd-fx3').innerHTML = `<div class="fx">V(L-L) avg = (${vr.map(f1).join(' + ')}) / 3 = <b>${f1(va)} V</b> ; spread ${f1(sp)} % <span class="${sp > 2 ? 'bad' : 'ok'}">${sp > 2 ? '> 2 %' : '≤ 2 %'}</span><br>Ke = ${f1(va)} × 1000 / ${f0(W.rpm)} = <b>${f1(ke)} V/1000 r/min</b> → ${f1(ke)} / ${M.Ke} = <b>${f1(kp)} %</b> <span class="${kp < 95 ? 'bad' : 'ok'}">${kp < 95 ? '< 95 %' : '≥ 95 %'}</span><br>f = 4 × ${f0(W.rpm)} / 60 = ${f1(4 * W.rpm / 60)} Hz</div>`;
    say(m, ar('صحيح.'), 'ok'); summary();
  }
  function vd(){
    const m = q('#wd-m4'), s = inp('vd');
    if (!W.done.r || !W.irM || !W.done.ke) return say(m, ar('أكمل المقاومة والعزل و Back-EMF قبل الحكم.'), 'bad');
    W.verdict = s.value; save();
    if (!s.value) return say(m, ar('اختر الحكم.'), 'bad');
    const ok = s.value === W.kind; mark(s, ok);
    if (!ok) return say(m, ar({ok:'القياسات الثلاثة تقع في حدودها: المقاومة متزنة والعزل مرتفع و Ke قريب من الاسمي.', turn:'قراءتان أقل من المرجع وجهدان من Back-EMF أقل قليلًا: هذا قصر بين لفات ملف واحد.', hr:'قراءتان أعلى من المرجع بينما Back-EMF متزن: المقاومة الزائدة في الوصلة لا في المغانط.', moist:'المقاومة و Back-EMF سليمان لكن العزل أقل من 10 MΩ: رطوبة في العزل.', demag:'الجهود الثلاثة متساوية لكن Ke أقل من 95 % من الاسمي: فقد مغنطة.'}[W.kind]), 'bad');
    W.done.vd = true; save(); q('#wd-d4').classList.add('ok');
    say(m, ar('صحيح: ' + WD_V.find(v => v[0] === W.kind)[1] + '.'), 'ok');
    win('winding', 'أحسنت: قست المقاومة والعزل دون الإضرار بالإنكودر، وحسبت Ke، وحكمت على المحرك بالدليل.');
  }
  IL.onAct(host, '[data-a]', b => {
    const a = b.dataset.a;
    if (a === 'cub') cub(); else if (a === 'cke') cke(); else if (a === 'vd') vd();
    else if (a === 'short') shortT(); else if (a === 'rng') rngT();
    else if (a === 'encT') togCon('enc'); else if (a === 'brkT') togCon('brk');
    else if (a === 'probes'){ W.probes = true; save(); setEMF(); say(q('#wd-m3'), ar('المجسّات على U-V و V-W و W-U (CH1–CH3).')); }
    else if (a === 'drill'){ if (!W.probes) return say(q('#wd-m3'), ar('وصّل المجسّات أولًا ثم أدِر العمود.'), 'bad'); W.rpm = rint(940, 1260); save(); setEMF(); say(q('#wd-m3'), ar('العمود يدور؛ اقرأ Vrms من الشاشة والسرعة من المقياس.')); }
  });
  conPaint(); table(); if (W.probes) setEMF();
  if (W.done.r){ W.done.r = false; cub(); } if (W.irM) q('#wd-d2').classList.add('ok'); if (W.done.ke){ W.done.ke = false; cke(); }
  newScenario(host, 'winding', () => { S.wd = genWD(); });
  demo(host, 'winding', async () => {
    W.meas = {}; W.irM = null; W.enc = true; W.brk = M.brake; W.short = false; W.rng = 1000; W.probes = false; W.rpm = 0; W.calc = {}; W.done = {}; W.verdict = ''; table(); conPaint();
    const pr = $('[data-plug="red"]', svg1), pb = $('[data-plug="blk"]', svg1), tg = k => $(`[data-tg="${k}"]`, svg1);
    for (const p of WD_P){
      if (LD.conn.red !== p[0]){ await dClick(pr, 250); await dClick(tg(p[0]), 250); }
      if (LD.conn.blk !== p[1]){ await dClick(pb, 250); await dClick(tg(p[1]), 250); }
      await dClick(q('#wd-test'), 250); await dWait(() => !busy);
    }
    const v = WD_P.map(p => W.meas[p]); await dSet(inp('ub'), f2(ubOf(v))); await dClick(q('[data-a="cub"]'));
    await dClick(q('[data-a="encT"]')); if (M.brake) await dClick(q('[data-a="brkT"]'));
    await dClick(q('#wd-shb')); while (W.rng !== 500) await dClick(q('#wd-rgb'), 250);
    await dClick($('[data-plug="line"]', svg2), 250); await dClick($('[data-tg="UVW"]', svg2), 250);
    await dClick($('[data-plug="earth"]', svg2), 250); await dClick($('[data-tg="PE"]', svg2), 250);
    await dClick(q('#mg-test')); await dWait(() => !mbusy);
    await dClick(q('[data-a="probes"]')); await dClick(q('[data-a="drill"]')); await sleep(800 / DSPEED);
    const vr = [0, 1, 2].map(i => W.ke * W.kl[i] * W.rpm / 1000), ke = (vr[0] + vr[1] + vr[2]) / 3 * 1000 / W.rpm;
    await dSet(inp('ke'), f1(ke)); await dSet(inp('kp'), f1(ke / M.Ke * 100)); await dClick(q('[data-a="cke"]'));
    await dSet(inp('vd'), W.kind); await dClick(q('[data-a="vd"]'));
  });
};

/* =====================================================================
   TAB 3 · types (l4): identify the 11 encoder types and wire each to the right drive input
   ===================================================================== */
function encLabel(t, v){
  return {ttl:['INC ENCODER', '5 V DC ±5 %', `${v} PPR · A B Z`, 'RS-422 LINE DRIVER'],
    htl:['INC ENCODER', '10–30 V DC', `${v} PPR · A B Z`, 'HTL PUSH-PULL'],
    hall:['HALL SENSOR BOARD', '5 V DC · open collector', 'U V W · 8 POLES', '120° el.'],
    sincos:['INC ENCODER 1 Vpp', '5 V DC ±5 %', `${v} LINES · A B R`, 'SIN / COS'],
    res:['RESOLVER 1X', 'EXC 7 Vrms · 10 kHz', 'TR 0.5 ±10 %', 'R1-R2  S1-S3  S2-S4'],
    ssi:['ABS ENCODER', 'SSI · 10–30 V DC', `${v} BIT · GRAY`, 'CLK / DATA'],
    endat:['ABS ENCODER', 'EnDat 2.2 · 3.6–14 V', `ST ${v} BIT · MT 12 BIT`, 'CLOCK / DATA'],
    biss:['ABS ENCODER', 'BiSS-C · 5 V ±10 %', `${v} BIT · CRC 6`, 'MA / SLO'],
    hiper:['MOTOR FEEDBACK', 'HIPERFACE · 7–12 V', `${v} SINE PERIODS`, 'MT 4096 rev'],
    dsl:['MOTOR FEEDBACK', 'DSL · 1 CABLE · 7–12 V', `ST ${v} BIT · MT 12 BIT`, 'via motor cable'],
    vendor:['ABS ENCODER', `${v} BIT · 2.5 Mbps`, 'MULTI-TURN 16 BIT', 'BAT 3.6 V']}[t];
}
const ENC_V = {ttl:[1024, 2048, 2500, 5000], htl:[500, 1024, 2048], hall:[0], sincos:[512, 1024, 2048], res:[0], ssi:[13, 24, 25], endat:[23, 25, 27], biss:[19, 26, 32], hiper:[128, 1024], dsl:[18, 20, 24], vendor:[20, 23, 24]};
function encBodySvg(t, v){
  const lab = encLabel(t, v), E = ENC[t];
  let body = '';
  const sticker = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="74" rx="4" fill="#f4f1e2" stroke="#999"/>${lab.map((l, i) => `<text x="${x + 6}" y="${y + 16 + i * 16}" font-size="${i ? 9.5 : 10}" font-weight="${i ? 600 : 700}" fill="#1d2529">${esc(l)}</text>`).join('')}`;
  if (t === 'hall'){
    body = `<circle cx="100" cy="110" r="78" fill="#1f6b3a" stroke="#0f3d20" stroke-width="3"/><circle cx="100" cy="110" r="34" fill="var(--board)" stroke="#0f3d20" stroke-width="2"/>
      ${[0, 1, 2].map(i => { const a = -Math.PI / 2 + i * PI2 / 3; return `<rect x="${f1(100 + 56 * Math.cos(a) - 9)}" y="${f1(110 + 56 * Math.sin(a) - 6)}" width="18" height="12" rx="2" fill="#222"/><text x="${f1(100 + 56 * Math.cos(a))}" y="${f1(110 + 56 * Math.sin(a) + 22)}" text-anchor="middle" font-size="9" fill="#e9eef1">H${'UVW'[i]}</text>`; }).join('')}
      <path d="M150 160 C180 190 196 196 210 196" stroke="#555" stroke-width="5" fill="none"/>` + sticker(200, 20, 156);
  } else if (t === 'res'){
    body = `<circle cx="100" cy="110" r="80" fill="#4b545a" stroke="#22282c" stroke-width="3"/><circle cx="100" cy="110" r="62" fill="#8d969b"/>
      ${Array.from({length:16}, (_, i) => { const a = i * PI2 / 16; return `<ellipse cx="${f1(100 + 62 * Math.cos(a))}" cy="${f1(110 + 62 * Math.sin(a))}" rx="9" ry="6" transform="rotate(${f1(a * 180 / Math.PI)} ${f1(100 + 62 * Math.cos(a))} ${f1(110 + 62 * Math.sin(a))})" fill="#c8782f" stroke="#7a4518"/>`; }).join('')}
      <circle cx="100" cy="110" r="40" fill="#b9c1c7" stroke="#6b7378" stroke-width="2"/><ellipse cx="100" cy="110" rx="34" ry="22" fill="#9aa1a6"/><circle cx="100" cy="110" r="10" fill="#555"/>
      ${['#d32f2f', '#222', '#e0b000', '#2f6fd8', '#2e8b57', '#9b59b6'].map((c, i) => `<path d="M168 ${80 + i * 6} C190 ${80 + i * 6} 196 ${130 + i * 10} 206 ${130 + i * 10}" stroke="${c}" stroke-width="3" fill="none"/>`).join('')}` + sticker(200, 20, 156);
  } else if (t === 'dsl'){
    body = `<rect x="20" y="40" width="160" height="140" rx="10" fill="#2b2f33" stroke="#111" stroke-width="2"/>${[0, 1, 2, 3, 4, 5].map(i => `<line x1="28" y1="${54 + i * 22}" x2="172" y2="${54 + i * 22}" stroke="#3c4449" stroke-width="5"/>`).join('')}
      <rect x="120" y="14" width="56" height="36" rx="6" fill="#9aa1a6" stroke="#5b656b"/><path d="M148 14 C148 0 200 0 220 0" stroke="#e66b1e" stroke-width="10" fill="none"/>
      <text x="100" y="200" text-anchor="middle" font-size="10" fill="var(--muted)">1 cable: U V W PE + DSL pair</text>` + sticker(200, 20, 156);
  } else {
    const kit = ['sincos', 'endat', 'biss', 'hiper', 'vendor'].includes(t), col = kit ? '#22282c' : '#8d969b';
    body = `<rect x="20" y="40" width="${kit ? 120 : 150}" height="130" rx="${kit ? 14 : 8}" fill="${col}" stroke="#111" stroke-width="2"/>
      ${kit ? '<rect x="28" y="52" width="104" height="106" rx="10" fill="#353b40"/>' : '<rect x="14" y="60" width="12" height="90" fill="#6b7378"/><circle cx="95" cy="105" r="26" fill="#6b7378" stroke="#444"/><circle cx="95" cy="105" r="10" fill="#22282c"/>'}
      <rect x="${kit ? 140 : 170}" y="86" width="34" height="40" rx="5" fill="#9aa1a6" stroke="#5b656b"/><path d="M${kit ? 174 : 204} 106 L206 106" stroke="#2f7d4f" stroke-width="8"/>
      ${t === 'vendor' ? '<rect x="40" y="182" width="80" height="26" rx="4" fill="#5b8bd6" stroke="#2d4f87"/><text x="80" y="199" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">BAT 3.6 V</text><path d="M120 195 C150 195 160 130 174 126" stroke="#555" stroke-width="3" fill="none"/>' : ''}` + sticker(200, 20, 156);
  }
  const face = t === 'res' ? connFace('leads', E.pins, 270, 210, {fs:10}) : t === 'hall' ? connFace('mini', [], 280, 176) : connFace(E.pins.length > 8 ? 'round' : 'round', E.pins, 280, 176, {R:52, pr:9});
  return `<svg viewBox="0 0 360 290" role="img" aria-label="الإنكودر وموصّله وملصقه">${body}
    <g transform="translate(0 ${t === 'res' ? 10 : 30})">${face}</g>
    <text x="280" y="${t === 'res' ? 286 : 286}" text-anchor="middle" font-size="10.5" font-weight="700" class="tx">${esc(E.conn)}</text>
</svg>`;
}
function portsSvg(sel){
  return `<svg viewBox="0 0 320 ${PORTS.length * 58 + 34}" role="img" aria-label="وحدة التغذية الراجعة في الدرايف"><rect x="2" y="2" width="316" height="${PORTS.length * 58 + 30}" rx="10" fill="#2b2f33" stroke="#111" stroke-width="2"/>
  <text x="160" y="22" text-anchor="middle" font-size="11" font-weight="700" fill="#f6cf45">SERVO DRIVE · FEEDBACK MODULE</text>
  ${PORTS.map((p, i) => { const y = 32 + i * 58; return `<g class="hit${sel === p.id ? ' sel' : ''}" data-port="${p.id}" tabindex="0" role="button" aria-label="${p.id} ${esc(p.t)}"><rect x="10" y="${y}" width="300" height="50" rx="7" fill="${sel === p.id ? '#0d7584' : '#3a4146'}" stroke="${sel === p.id ? '#4cc0cf' : '#4d565c'}" stroke-width="2"/><rect class="ring" x="8" y="${y - 2}" width="304" height="54" rx="8" style="fill:none"/>
    <g transform="translate(64 ${y + 25}) scale(.42) translate(-${p.k === 'term' || p.k === 'mini' ? 0 : 0} 0)">${p.k === 'm12' || p.k === 'hyb' ? connFace('round', p.k === 'hyb' ? ENC.dsl.pins : ENC.endat.pins, 0, 0, {R:44}) : connFace(p.k, [], 0, 0)}</g>
    <text x="128" y="${y + 21}" font-size="13" font-weight="700" fill="#f6cf45">${p.id}</text><text x="128" y="${y + 39}" font-size="11" fill="#e9eef1">${esc(p.t)}</text></g>`; }).join('')}</svg>`;
}
function genTY(){ return {order:shuffle(ENC_LIST), v:Object.fromEntries(ENC_LIST.map(t => [t, pick(ENC_V[t])])), ans:{}, cur:0}; }
BUILD.types = host => {
  if (!S.ty || !S.ty.order) S.ty = genTY();
  const Y = S.ty;
  host.innerHTML = `
  <p class="note">${ar('أحد عشر إنكودرًا من مخزن قطع الغيار. لكل واحد: اقرأ الموصّل والملصق ولقطة الإشارة، وحدّد النوع، ثم انقر مدخل الدرايف المناسب واختر جهد التغذية.')}</p>
  <div class="chipline" id="ty-ch">${Y.order.map((t, i) => `<button type="button" class="btn" data-i="${i}">${i + 1}</button>`).join('')}</div>
  <div class="enc-card">
    <div class="dev" id="ty-l"><h3 id="ty-h"></h3><div class="stage" id="ty-body"></div><div class="wave" id="ty-mini"></div><p class="note" id="ty-cl"></p></div>
    <div class="dev" id="ty-r"><h3>${ar('النوع والتوصيل')}</h3>
      ${sel('t', 'نوع الإنكودر', ENC_LIST.map(t => [t, ENC[t].n + ' — ' + ENC[t].ar]), '')}
      <div class="stage" id="ty-ports" style="max-width:340px;margin:0 auto;width:100%"></div>
      <div class="fld"><span>${ar('جهد التغذية من الدرايف')}</span><div class="sgm" id="ty-sup">${SUPS.map(s => `<button type="button" data-sup="${s[0]}" aria-pressed="false">${s[1]}</button>`).join('')}</div></div>
      <div class="row"><button type="button" class="btn pri" data-a="chk">${ar('تحقّق ووصّل')}</button></div>
      <p class="msg" id="ty-m" aria-live="polite"></p>
    </div>
  </div>
  ${typical('الجهود والمنافذ مثال لوحدة تغذية راجعة متعددة الأنواع')}
  ${foot()}`;
  const q = s => $(s, host);
  let cur = Y.cur || 0, port = '', sup = '';
  function load(i){
    cur = i; Y.cur = i; save();
    const t = Y.order[i], A = Y.ans[t] || {};
    port = A.ok ? ENC[t].port : ''; sup = A.ok ? A.sup : '';
    q('#ty-h').innerHTML = ar(`الإنكودر رقم ${i + 1}`);
    q('#ty-body').innerHTML = encBodySvg(t, Y.v[t]);
    q('#ty-mini').innerHTML = miniScope(t);
    q('#ty-cl').innerHTML = ar(t === 'dsl' ? 'لقطة على زوج DSL داخل كابل القدرة.' : t === 'res' ? 'لقطة على ملفات الريزولفر بمجس تفاضلي.' : 'لقطة على أطراف الإنكودر والمحرك يدور ببطء.');
    q('[data-k="t"]').value = A.ok ? t : ''; mark(q('[data-k="t"]'), A.ok ? true : null);
    q('#ty-r').classList.toggle('ok', !!A.ok); say(q('#ty-m'), A.ok ? ar('صحيح: ' + ENC[t].hint) : '', A.ok ? 'ok' : '');
    paint();
  }
  function paint(){
    q('#ty-ports').innerHTML = portsSvg(port);
    $$('#ty-sup [data-sup]', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.sup === sup ? 'true' : 'false'));
    $$('#ty-ch .btn', host).forEach((b, i) => { b.classList.toggle('done', !!(Y.ans[Y.order[i]] || {}).ok); b.classList.toggle('cur', i === cur); });
  }
  IL.onAct(q('#ty-ch'), '[data-i]', b => load(+b.dataset.i));
  IL.onAct(q('#ty-ports'), '[data-port]', g => { port = g.dataset.port; paint(); });
  IL.onAct(q('#ty-sup'), '[data-sup]', b => { sup = b.dataset.sup; paint(); });
  function chk(){
    const t = Y.order[cur], E = ENC[t], s = q('[data-k="t"]'), m = q('#ty-m');
    if (!s.value) return say(m, ar('اختر نوع الإنكودر أولًا.'), 'bad');
    if (s.value !== t){ mark(s, false); return say(m, ar(E.hint.split(':')[0] + '.'), 'bad'); }
    mark(s, true);
    if (!port) return say(m, ar('انقر مدخل الدرايف الذي يوصَّل به هذا الإنكودر.'), 'bad');
    if (port !== E.port){ const P = PORTS.find(p => p.id === port); return say(m, ar(`المنفذ ${port} ${P.d}، وهو لا يناسب ${E.n}.`), 'bad'); }
    if (!sup) return say(m, ar('اختر جهد التغذية.'), 'bad');
    if (!E.sup.includes(sup)){
      const five = ['ttl', 'hall', 'sincos', 'biss', 'vendor'].includes(t);
      return say(m, ar(sup === 'exc' ? 'إثارة AC للريزولفر وحده؛ هذا الإنكودر إلكتروني يحتاج تغذية مستمرة.' : t === 'res' ? 'الريزولفر لا يأخذ تغذية مستمرة؛ يغذّيه الدرايف بإثارة 7 Vrms عند 10 kHz.' : five ? `${E.n} يعمل على 5 V فقط؛ ${sup} V تتلف دائرته.` : t === 'htl' || t === 'ssi' ? `${E.n} هنا يحتاج 10–30 V؛ عند 5 V لا يعمل المُخرج.` : t === 'endat' ? '24 V فوق مدى EnDat 3.6–14 V.' : `${E.n} يحتاج 7–12 V؛ ${sup} V خارج المدى.`), 'bad');
    }
    Y.ans[t] = {ok:true, sup}; save(); q('#ty-r').classList.add('ok'); paint();
    say(m, ar('صحيح: ' + E.hint), 'ok');
    if (ENC_LIST.every(x => (Y.ans[x] || {}).ok)) win('types', 'أحسنت: ميّزت الأنواع الأحد عشر كلها ووصّلت كل نوع إلى مدخله بالتغذية الصحيحة.');
  }
  IL.onAct(host, '[data-a="chk"]', chk);
  load(cur);
  newScenario(host, 'types', () => { S.ty = genTY(); });
  demo(host, 'types', async () => {
    Y.ans = {}; load(0);
    for (let i = 0; i < Y.order.length; i++){
      const t = Y.order[i]; await dClick(q(`#ty-ch [data-i="${i}"]`), 250);
      await dSet(q('[data-k="t"]'), t, 250); await dClick(q(`#ty-ports [data-port="${ENC[t].port}"]`), 250);
      await dClick(q(`#ty-sup [data-sup="${ENC[t].sup[0]}"]`), 250); await dClick(q('[data-a="chk"]'), 250); await sleep(500 / DSPEED);
    }
  });
};

/* =====================================================================
   TAB 4 · scope (l5): probe the encoder, read every signal type, find the fault
   ===================================================================== */
const SC_FT = {chan:['ttl', 'htl', 'hall', 'sincos', 'hiper'], noise:['ttl', 'htl', 'ssi', 'endat', 'biss', 'dsl', 'vendor'], batt:['vendor'], pair:['ttl', 'ssi', 'endat', 'biss', 'vendor'], supply:['ttl', 'hall'], amp:['sincos', 'hiper'], wind:['res']};
const SC_DG = [['chan', 'قناة مفقودة (ثابتة بلا نبضات)'], ['pair', 'سلك مقطوع في زوج تفاضلي'], ['noise', 'تشويش كهرومغناطيسي على الإشارة'], ['batt', 'بطارية الإنكودر ضعيفة'], ['supply', 'جهد التغذية عند الإنكودر منخفض'], ['amp', 'اتساع Sin/Cos منخفض (اتساخ أو فجوة)'], ['wind', 'ملف من ملفات الريزولفر مفتوح']];
const SC_SYM = {chan:'إنذار AL.EnC «خطأ في تسلسل الإشارات» والمحور يرتجف ولا يتحرك بانتظام.', noise:'إنذار AL.EnC أو AL.PoS عشوائي يظهر عند تشغيل المغزل والمحاور معًا ويختفي في السرعات المنخفضة.', batt:'تحذير AL.EnB عند التشغيل، وفُقد مرجع المحور بعد إيقاف طويل.', pair:'إنذار AL.EnC متقطّع يظهر عند حركة الكابل في السلسلة الحاملة.', supply:'إنذار AL.EnC عند التشغيل البارد، والكابل طوله 25 m بموصّلات تغذية رفيعة.', amp:'خطأ موضع متذبذب وضوضاء في التيار عند السرعة المنخفضة بعد سنوات في بيئة سائل التبريد.', wind:'إنذار فقد إشارة الريزولفر فور تمكين المحور A.'};
const SC_NO = {chan:'القناة المفقودة تظهر خطًا ثابتًا بلا نبضات على طرفي الزوج معًا، وهذا لا يطابق قياسك.', pair:'السلك المقطوع يجعل طرفًا واحدًا من الزوج ثابتًا قرب 2.5 V والآخر سليمًا، وهذا لا يطابق قياسك.', noise:'التشويش يظهر رنينًا حادًا فوق الإشارة عند كل حافة PWM، وهذا لا يطابق قياسك.', batt:'البطارية الضعيفة تقرأ أقل من 3.1 V بين BAT+ و BAT−، وهذا لا يطابق قياسك.', supply:'التغذية المنخفضة تقرأ أقل من 4.75 V عند الإنكودر، وهذا لا يطابق قياسك.', amp:'الاتساع المنخفض يرسم دائرة صغيرة في وضع XY، وهذا لا يطابق قياسك.', wind:'الملف المفتوح يجعل غلاف SIN أو COS خطًا صفريًا، وهذا لا يطابق قياسك.'};
const SC_OK = {chan:'القناة ثابتة بلا تغيّر: افحص سلكيها في الكابل، فإن كانا سليمين فاستبدل الإنكودر.', pair:'طرف من الزوج ثابت قرب 2.5 V: السلك مقطوع والمستقبِل التفاضلي يرى نصف الإشارة؛ استبدل الكابل.', noise:'رنين عند كل حافة PWM: افحص الحجب والتأريض 360° وفصل مسار الكابل عن كابل القدرة.', batt:'البطارية أقل من 3.1 V: استبدلها والدرايف موصول بالتغذية حتى لا يضيع عدد اللفات.', supply:'التغذية عند الإنكودر أقل من 4.75 V بسبب هبوط الجهد في الكابل الطويل: فعّل خط الاستشعار أو كبّر مقطع الموصّلات.', amp:'دائرة XY صغيرة: الاتساع أقل من المسموح بسبب اتساخ القرص أو زيادة الفجوة؛ نظّف أو استبدل الإنكودر.', wind:'لا غلاف على S2-S4: ملف SIN مفتوح؛ قِس مقاومته ثم استبدل الكابل أو الريزولفر.'};
const SC_KEY = {chan:{ttl:['B+', 'B−'], htl:['B', '/B'], hall:['HV'], sincos:['B+', 'B−'], hiper:['SIN']}, noise:{ttl:['A+', 'A−', 'B+', 'B−'], htl:['A', '/A', 'B', '/B'], ssi:['DATA+', 'DATA−'], endat:['DATA+', 'DATA−'], biss:['SLO+', 'SLO−'], dsl:['DSL±', 'DSL+', 'DSL−'], vendor:['PS']}, batt:{vendor:['BAT+']}, pair:{ttl:['A−'], ssi:['DATA−'], endat:['DATA−'], biss:['SLO−'], vendor:['/PS']}, supply:{ttl:['+5V'], hall:['+5V']}, amp:{sincos:['A+', 'A−', 'B+', 'B−'], hiper:['SIN', 'COS']}, wind:{res:['S2-S4']}};
const SC_EX = {ttl:'A و B مربعتان بإزاحة 90°، و A− عكس A+ تمامًا. اضغط MATH لترى الفرق A+ − A−، وكبّر الزمن إلى 50 ms/div لترى نبضة Z مرة كل لفة.',
  htl:'إشارات مربعة بارتفاع قريب من 24 V؛ B متأخرة 90° عن A في الدوران الموجب.',
  hall:'ثلاث إشارات مربعة متزحزحة 120° كهربية؛ أربع دورات في اللفة لمحرك 8 أقطاب، ولا تكون الثلاث في المستوى نفسه أبدًا.',
  sincos:'A+ و B+ جيبيتان 0.5 Vpp حول 2.5 V. وصّل A+ إلى CH1 و B+ إلى CH2 واضغط XY ثم AUTO لترى الدائرة؛ نصف قطرها هو الاتساع.',
  res:'غلاف S1-S3 يتبع cos θ وغلاف S2-S4 يتبع sin θ فوق حامل 10 kHz. اختر 50 µs/div لترى الحامل نفسه.',
  ssi:'الساعة من الدرايف؛ البيانات ترد بالموضع برمز Gray بداية من البت الأعلى، ثم زمن tm منخفض.',
  endat:'الدرايف يرسل أمر MODE على خط البيانات نفسه، ثم يحسب الإنكودر Tcal، ثم يرد بـ S و F1 و F2 والموضع و CRC.',
  biss:'Ack منخفض ثم Start و CDS، ثم الموضع و nE و nW و CRC، ثم timeout.',
  hiper:'SIN و COS جيبيتان 1 Vpp حول REFSIN و REFCOS عند 2.5 V، وقناة RS-485 للمعاملات. جرّب XY مع SIN و COS.',
  dsl:'لا كابل إنكودر: زوج DSL داخل كابل القدرة يحمل تغذية مستمرة نحو 11.6 V وبيانات مشفّرة بمعدل 9.375 MBd.',
  vendor:'زوج PS و /PS نصف مزدوج: طلب من الدرايف ثم رد الإنكودر بالبيانات و CRC. قِس البطارية بالملتيميتر بين BAT+ و BAT−.'};
function genSC(){
  const extra = pick(['supply', 'amp', 'wind']), fl = shuffle(['chan', 'noise', 'batt', 'pair', extra]); const used = [];
  const cases = fl.map(f => { const c = SC_FT[f].filter(t => !used.includes(t)), t = pick(c.length ? c : SC_FT[f]); used.push(t); return {t, f, ok:false, pr:{}, dg:''}; });
  return {cases, cur:0, mode:'case', free:'ttl'};
}
function breakoutSvg(type, NB){
  const tps = ENC[type].tps, n = tps.length;
  const pp = NB ? [[176, 44], [236, 44], [296, 44], [176, 128]] : [[200, 44], [262, 44], [324, 44], [386, 44]];
  const pos = tps.map((id, i) => NB ? [52 + (i % 4) * 85, 330 + Math.floor(i / 4) * 92] : [214 + i * (n > 6 ? 54 : 66), 196]);
  const H = NB ? 470 : 262, W = NB ? 380 : 640;
  return {pos, pp, svg:`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="لوحة نقاط اختبار الإنكودر والمجسّات">
    ${dmmSvg('sd', 6, 8)}
    ${plugSvg('dr', 36, 178, '#d32f2f', 'V', 9)}${plugSvg('db', 84, 178, '#222', 'COM', 9)}
    <g transform="translate(${NB ? 140 : 160} 6)"><rect x="0" y="0" width="${NB ? 230 : 290}" height="${NB ? 176 : 92}" rx="10" fill="#2b2f33"/><text x="10" y="16" font-size="10" fill="#cfd6da">PROBES 10:1 → DSO</text></g>
    ${pp.map((p, i) => plugSvg('c' + i, p[0], p[1], TRC[i], 'CH' + (i + 1), 10)).join('')}
    <g transform="translate(${NB ? 6 : 160} ${NB ? 220 : 120})"><rect x="0" y="0" width="${NB ? 368 : 474}" height="${NB ? 244 : 136}" rx="10" fill="#1f6b3a" stroke="#0f3d20" stroke-width="2"/>
      <text x="10" y="18" font-size="11" font-weight="700" fill="#e9eef1">ENCODER TEST ADAPTER · ${esc(ENC[type].n)}</text>
      <text x="10" y="${NB ? 236 : 128}" font-size="9" fill="#bfe3c9">drive ⇄ adapter ⇄ encoder (in line)</text></g>
    ${pos.map((p, i) => tpSvg(tps[i], p[0], p[1], tps[i], {fs:NB ? 13 : 11, tc:'#f2f6f8'})).join('')}
    <g class="cabs"></g></svg>`};
}
BUILD.scope = host => {
  if (!S.sc || !S.sc.cases) S.sc = genSC();
  const C = S.sc, NB = NARROW();
  host.innerHTML = `
  <div class="sgm ar" id="sc-mode" style="align-self:start"><button type="button" data-mode="case">${ar('حالات الأعطال الخمس')}</button><button type="button" data-mode="free">${ar('استكشف كل الأنواع')}</button></div>
  <div class="chipline" id="sc-ch"></div>
  <div class="sym" id="sc-sym"></div>
  <div class="dev"><h3 id="sc-h"></h3>
    <div class="stage" id="sc-bo"></div>
    <p class="msg" id="sc-m1" aria-live="polite"></p>
    <div id="sc-sc"></div>
    <p class="note" id="sc-ex"></p>
  </div>
  <div class="dev" id="sc-dg"><h3>${ar('التشخيص')}</h3>
    ${sel('dg', 'العطل', SC_DG, '')}
    <div class="row"><button type="button" class="btn pri" data-a="dg">احكم</button></div>
    <p class="msg" id="sc-m2" aria-live="polite"></p>
  </div>
  ${typical('مستويات RS-422 نحو 0.3/3.5 V، و Sin/Cos 0.5 Vpp لكل طرف حول 2.5 V، والبطارية 3.6 V وتحذيرها تحت نحو 3.1 V، وتغذية 5 V لا تقل عن 4.75 V عند الإنكودر')}
  ${foot()}`;
  const q = s => $(s, host);
  let LD = null, sc = null, sg = null, type = '', cs = null;
  sc = Scope(q('#sc-sc'), {label:'راسم الإشارة على نقاط اختبار الإنكودر', autoT(){ return sg ? sg.tdiv : null; }});
  function loadCase(){
    cs = C.mode === 'case' ? C.cases[C.cur] : null; type = cs ? cs.t : C.free;
    sg = encSig(type, cs ? cs.f : 'ok', 300);
    $$('#sc-mode [data-mode]', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === C.mode ? 'true' : 'false'));
    q('#sc-ch').innerHTML = C.mode === 'case' ? C.cases.map((c, i) => `<button type="button" class="btn${i === C.cur ? ' cur' : ''}${c.ok ? ' done' : ''}" data-c="${i}">${ar('الحالة ' + (i + 1))}</button>`).join('') : ENC_LIST.map(t => `<button type="button" class="btn${t === C.free ? ' cur' : ''}" data-f="${t}">${esc(ENC[t].n)}</button>`).join('');
    q('#sc-sym').innerHTML = cs ? `<b>${ar('العَرَض:')}</b> ${ar(SC_SYM[cs.f])}` : ar('إنكودر سليم والمحرك يدور ببطء عند 300 r/min: وصّل المجسّات واقرأ الإشارات.');
    q('#sc-h').innerHTML = L(esc(ENC[type].n)) + ' · ' + ar(ENC[type].ar);
    q('#sc-ex').innerHTML = ar(SC_EX[type]);
    q('#sc-dg').hidden = !cs;
    if (cs){ q('[data-k="dg"]').value = cs.dg || ''; mark(q('[data-k="dg"]'), cs.ok ? true : null); q('#sc-dg').classList.toggle('ok', cs.ok); say(q('#sc-m2'), cs.ok ? ar('صحيح: ' + SC_OK[cs.f]) : '', cs.ok ? 'ok' : ''); }
    const B = breakoutSvg(type, NB); q('#sc-bo').innerHTML = B.svg; const svg = $('svg', q('#sc-bo'));
    const plugs = {dr:{x:36, y:178, color:'#d32f2f'}, db:{x:84, y:178, color:'#555'}}; B.pp.forEach((p, i) => plugs['c' + i] = {x:p[0], y:p[1], color:TRC[i]});
    Object.keys(plugs).forEach(k => plugs[k].el = $(`[data-plug="${k}"]`, svg));
    const targets = {}; ENC[type].tps.forEach((id, i) => targets[id] = {x:B.pos[i][0], y:B.pos[i][1]});
    LD = Leads(svg, {plugs, targets, msg(t){ if (t) say(q('#sc-m1'), ar(t), 'bad'); else say(q('#sc-m1'), ar('انقر الآن نقطة الاختبار، أو اسحب المجس إليها.')); }, change(){ say(q('#sc-m1'), ''); route(); }});
    sc.st.xy = false; sc.st.math = false; route(); sc.auto();
  }
  function route(){
    for (let i = 0; i < 4; i++){ const tp = LD.conn['c' + i]; sc.setCh(i, tp ? sg.tp[tp] : null, {lab:tp || ''}); if (tp && cs) cs.pr[tp] = 1; }
    sc.st.decode = sg.decode && [0, 1, 2, 3].some(i => LD.conn['c' + i]) ? sg.decode : null;
    sc.st.tdiv = sc.st.tdiv || sg.tdiv;
    const r = LD.conn.dr, b = LD.conn.db, svg = $('svg', q('#sc-bo'));
    if (r && b){ const v = dcOf(sg.tp[r]) - dcOf(sg.tp[b]) + nz(0.002); lcdSet(svg, 'sd', f2(v), 'V DC'); if (cs){ cs.pr['dmm:' + r] = 1; } }
    else lcdSet(svg, 'sd', '----', 'V DC');
    save(); sc.draw();
  }
  function auto(){ if ([0, 1, 2, 3].some(i => LD.conn['c' + i])) sc.auto(); }
  const prevAuto = sc.auto; sc.auto = () => { sc.st.tdiv = sg ? sg.tdiv : sc.st.tdiv; prevAuto(); };
  IL.onAct(q('#sc-mode'), '[data-mode]', b => { C.mode = b.dataset.mode; save(); loadCase(); });
  IL.onAct(q('#sc-ch'), '[data-c],[data-f]', b => { if (b.dataset.c != null) C.cur = +b.dataset.c; else C.free = b.dataset.f; save(); loadCase(); });
  function probed(c){ const k = SC_KEY[c.f][c.t]; return k.some(id => c.pr[id] || c.pr['dmm:' + id]); }
  function dg(){
    const m = q('#sc-m2'), s = q('[data-k="dg"]'), c = cs; if (!c) return;
    if (!s.value) return say(m, ar('اختر العطل.'), 'bad');
    c.dg = s.value; save();
    if (!probed(c)) return say(m, ar('لم تقس بعد النقطة التي تثبت العطل؛ افحص كل الإشارات والتغذية قبل الحكم.'), 'bad');
    const ok = s.value === c.f; mark(s, ok);
    if (!ok) return say(m, ar(SC_NO[s.value]), 'bad');
    c.ok = true; save(); q('#sc-dg').classList.add('ok'); say(m, ar('صحيح: ' + SC_OK[c.f]), 'ok');
    $(`#sc-ch [data-c="${C.cur}"]`, host).classList.add('done');
    if (C.cases.every(x => x.ok)) win('scope', 'أحسنت: قرأت إشارات الإنكودر بالأوسيلوسكوب والملتيميتر وحدّدت الأعطال الخمسة بالدليل.');
  }
  IL.onAct(host, '[data-a="dg"]', dg);
  loadCase();
  newScenario(host, 'scope', () => { S.sc = genSC(); });
  demo(host, 'scope', async () => {
    C.mode = 'case'; C.cases.forEach(c => { c.ok = false; c.pr = {}; c.dg = ''; }); C.cur = 0; loadCase();
    for (let i = 0; i < C.cases.length; i++){
      await dClick(q(`#sc-ch [data-c="${i}"]`), 300);
      const c = C.cases[i], key = SC_KEY[c.f][c.t], svg = $('svg', q('#sc-bo'));
      if (c.f === 'batt' || c.f === 'supply'){
        await dClick($('[data-plug="dr"]', svg), 250); await dClick($(`[data-tg="${key[0]}"]`, svg), 250);
        await dClick($('[data-plug="db"]', svg), 250); await dClick($(`[data-tg="${c.f === 'batt' ? 'BAT−' : '0V'}"]`, svg), 250);
      } else {
        const tps = ENC[c.t].tps.filter(x => !/V$|^0V|GND|^Us|BAT/.test(x));
        const list = [key[0]].concat(tps.filter(x => x !== key[0])).slice(0, c.f === 'amp' ? 2 : 3);
        if (c.f === 'amp' && c.t === 'sincos'){ list[0] = 'A+'; list[1] = 'B+'; }
        if (c.f === 'amp' && c.t === 'hiper'){ list[0] = 'SIN'; list[1] = 'COS'; }
        for (let k = 0; k < list.length; k++){ await dClick($(`[data-plug="c${k}"]`, svg), 220); await dClick($(`[data-tg="${list[k]}"]`, svg), 220); }
        if (c.f === 'amp') await dClick($('[data-sc="xy"]', q('#sc-sc')), 300);
        await dClick($('[data-sc="auto"]', q('#sc-sc')), 300);
      }
      await sleep(900 / DSPEED);
      await dSet(q('[data-k="dg"]'), c.f, 250); await dClick(q('[data-a="dg"]'), 250); await sleep(500 / DSPEED);
    }
  });
};

/* =====================================================================
   TAB 5 · offset (l6): replace the X encoder, DC injection, Back-EMF fine alignment, test run
   ===================================================================== */
const OF_STEPS = [
  ['bus', 'افصل تغذية الدرايف وأقفلها، ثم قِس جهد الناقل المستمر حتى يقل عن 50 V'],
  ['cab', 'افصل كابل القدرة وكابل الإنكودر عن المحرك'],
  ['cov', 'فك الغطاء الخلفي للإنكودر'],
  ['old', 'فك مسمار الربط واسحب الإنكودر القديم بالمسحب دون طرق'],
  ['new', 'ركّب الإنكودر الجديد وشدّ مسمار الربط بالعزم المحدد'],
  ['back', 'أعد الغطاء والكابلات، ثم اضبط الإزاحة قبل أي حركة']
];
const OF_NO = {bus:'ابدأ بالسلامة: لا يُلمس شيء قبل قياس الناقل تحت 50 V.', cab:'افصل الكابلات قبل فك أي جزء من المحرك.', cov:'فك الغطاء قبل الوصول إلى الإنكودر.', old:'اسحب الإنكودر القديم قبل تركيب الجديد، ولا تطرق العمود فتتلف المحامل والقرص.', new:'ركّب الإنكودر الجديد بعد سحب القديم.', back:'أعد التجميع بعد تركيب الإنكودر الجديد.'};
const wrap = a => { a = ((a + 180) % 360 + 360) % 360 - 180; return a; };
function genOF(){ return {th0:+rnd(0, 359.9).toFixed(1), set:+rnd(0, 359.9).toFixed(1), fr:pick([-1, 1]), Tf:+rnd(0.24, 0.34).toFixed(2), order:shuffle(OF_STEPS.map(s => s[0])), st:[], ipc:20, read:null, iuse:0, wr:false, emf:false, bemf:false, run:null, done:{}}; }
function rotorSvg(){
  let h = `<svg viewBox="0 0 260 260" role="img" aria-label="الدوّار والمجال"><circle cx="130" cy="130" r="122" fill="#5d666c" stroke="#3c4449" stroke-width="3"/><circle cx="130" cy="130" r="100" fill="#2b2f33"/>`;
  ['U', 'V', 'W'].forEach((p, i) => { const a = -Math.PI / 2 + i * PI2 / 3; [0, 1].forEach(s => { const b = a + s * Math.PI; h += `<rect x="${f1(130 + 108 * Math.cos(b) - 12)}" y="${f1(130 + 108 * Math.sin(b) - 9)}" width="24" height="18" rx="4" fill="#c8782f" stroke="#7a4518" transform="rotate(${f1(b * 180 / Math.PI + 90)} ${f1(130 + 108 * Math.cos(b))} ${f1(130 + 108 * Math.sin(b))})"/>`; }); h += `<text x="${f1(130 + 122 * Math.cos(a) * 0.86)}" y="${f1(130 + 122 * Math.sin(a) * 0.86 + 4)}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${p}</text>`; });
  h += `<g id="of-rot">`;
  for (let i = 0; i < 8; i++){ const a0 = i * PI2 / 8, a1 = (i + 1) * PI2 / 8; h += `<path d="M130 130 L${f1(130 + 84 * Math.cos(a0))} ${f1(130 + 84 * Math.sin(a0))} A84 84 0 0 1 ${f1(130 + 84 * Math.cos(a1))} ${f1(130 + 84 * Math.sin(a1))}Z" fill="${i % 2 ? '#2f6fd8' : '#c0352b'}" stroke="#222"/><text x="${f1(130 + 62 * Math.cos((a0 + a1) / 2))}" y="${f1(130 + 62 * Math.sin((a0 + a1) / 2) + 5)}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${i % 2 ? 'S' : 'N'}</text>`; }
  h += `<circle cx="130" cy="130" r="30" fill="#9aa1a6" stroke="#5b656b" stroke-width="2"/><rect x="127" y="100" width="6" height="12" fill="#ffd23f"/></g>`;
  h += `<g id="of-fld" style="display:none"><line x1="130" y1="130" x2="130" y2="34" stroke="#ffd23f" stroke-width="4" marker-end="url(#of-ar)"/></g><defs><marker id="of-ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#ffd23f"/></marker></defs>`;
  return h + '</svg>';
}
function phasorSvg(e, I, Iq){
  const a = e * Math.PI / 180, sc = 80 / Math.max(6, I), x = 140 + Math.sin(a) * I * sc * -1, y = 120 - Math.cos(a) * I * sc;
  return `<svg viewBox="0 0 280 230" role="img" aria-label="متجه التيار على المحورين d و q"><rect x="0" y="0" width="280" height="230" rx="10" fill="var(--bg)"/>
  <line x1="40" y1="120" x2="250" y2="120" stroke="var(--muted)" stroke-dasharray="4 3"/><line x1="140" y1="210" x2="140" y2="20" stroke="var(--muted)" stroke-dasharray="4 3"/>
  <text x="248" y="114" text-anchor="end" font-size="12" class="txm">d</text><text x="146" y="28" font-size="12" class="txm">q (torque)</text>
  <line x1="140" y1="120" x2="${f1(x)}" y2="${f1(y)}" stroke="var(--accent)" stroke-width="4"/><circle cx="${f1(x)}" cy="${f1(y)}" r="5" fill="var(--accent)"/>
  <line x1="140" y1="120" x2="140" y2="${f1(120 - Iq * sc)}" stroke="var(--good)" stroke-width="3" opacity=".7"/>
  <text x="14" y="214" font-size="11" class="tx">e = ${f1(e)}°   |I| = ${f2(I)} A   Iq = ${f2(Iq)} A</text></svg>`;
}
BUILD.offset = host => {
  if (!S.of || S.of.th0 == null) S.of = genOF();
  const O = S.of, M = AX.X;
  host.innerHTML = `
  <p class="sym">${ar('إنكودر المحور X، وهو مطلق تسلسلي 23-bit، يعطي AL.EnC دائمًا. لديك إنكودر جديد من النوع نفسه، وزاوية تركيبه على العمود غير معروفة؛ لذلك يلزم ضبط الإزاحة الكهربية قبل تشغيل المحور.')}</p>
  <div class="dev" id="of-d1"><h3><span class="n">1</span>استبدل الإنكودر بالترتيب الصحيح</h3>
    <div class="loto" id="of-steps">${O.order.map(k => `<button type="button" class="btn" data-st="${k}">${ar(OF_STEPS.find(s => s[0] === k)[1])}</button>`).join('')}</div>
    <div class="row"><span class="pill" id="of-bus">${L('DC bus: --- V')}</span></div>
    <p class="msg" id="of-m1" aria-live="polite"></p>
  </div>
  <div class="grid2">
    <div class="dev" id="of-d2"><h3><span class="n">2</span>طريقة حقن التيار المستمر</h3>
      <p class="note">${ar('المحور مفكوك عن عمود الكرات. يحقن الدرايف تيارًا مستمرًا من U إلى V و W، فيتجه الدوّار إلى الزاوية الكهربية صفر، وتقرأ زاوية الإنكودر الكهربية في ذلك الوضع: هذه هي الإزاحة.')}</p>
      <div class="stage rotor-w">${rotorSvg()}</div>
      <div class="slider"><span>${ar('تيار الحقن')}</span><input type="range" min="5" max="150" step="5" value="${O.ipc}" data-k="ipc" aria-label="تيار الحقن"><output id="of-io"></output></div>
      <div class="row"><button type="button" class="btn" data-a="inj">${ar('احقن DC: U+ → V,W−')}</button><span class="pill" id="of-rd">${L('θe(enc) = ---.-°')}</span></div>
      ${fld('ofs', 'اكتب الإزاحة في معامل الدرايف Pn-OFS', '°el', O.wr ? f1(O.set) : '')}
      <div class="row"><button type="button" class="btn pri" data-a="wr">${ar('اكتب المعامل')}</button></div>
      <p class="msg" id="of-m2" aria-live="polite"></p>
    </div>
    <div class="dev" id="of-d3"><h3><span class="n">3</span>التدقيق بطريقة Back-EMF</h3>
      <p class="note">${ar('الدرايف معطّل (STO) والعمود يدور بالمثقاب. CH1: جهد U إلى نقطة نجمة افتراضية بثلاث مقاومات. CH2: خرج زاوية الإنكودر الكهربية من الدرايف (0–10 V = 0–360°). يجب أن يبدأ المنشار عند عبور CH1 للصفر صاعدًا.')}</p>
      <div class="row"><button type="button" class="btn" data-a="emf">${ar('أدِر العمود ووصّل CH1 و CH2')}</button></div>
      <div id="of-sc"></div>
      <div class="row"><span class="pill" id="of-set"></span></div><div class="dpad"><button type="button" class="btn" data-d="-10">−10°</button><button type="button" class="btn" data-d="-1">−1°</button><button type="button" class="btn" data-d="-0.1">−0.1°</button><button type="button" class="btn" data-d="0.1">+0.1°</button><button type="button" class="btn" data-d="1">+1°</button><button type="button" class="btn" data-d="10">+10°</button></div>
      <div class="row"><button type="button" class="btn pri" data-a="sv">${ar('احفظ الإزاحة')}</button></div>
      <p class="msg" id="of-m3" aria-live="polite"></p>
    </div>
  </div>
  <div class="dev" id="of-d4"><h3><span class="n">4</span>تشغيل اختباري تحت حمل 60 %</h3>
    <div class="grid2"><div class="stage">${'<div id="of-ph"></div>'}</div><div><div class="tblw"><table class="tbl hm" id="of-tb"></table></div><p class="note" id="of-rn"></p></div></div>
    <div class="row"><button type="button" class="btn" data-a="run">${ar('شغّل المحور')}</button></div>
    <p class="msg" id="of-m4" aria-live="polite"></p>
    ${typical('زاوية إزاحة ضمن ±2° كهربية تعطي عزمًا كاملًا تقريبًا؛ الخطأ e يخفض العزم بنسبة cos e ويولّد تيار Id = I·sin e')}
  </div>
  ${foot()}`;
  const q = s => $(s, host), inp = k => q(`[data-k="${k}"]`);
  const err = () => wrap(O.set - O.th0);
  /* ---- 1 ordered replacement ---- */
  let busB = false;
  function paint1(){ $$('#of-steps [data-st]', host).forEach(b => b.classList.toggle('ok', O.st.includes(b.dataset.st))); q('#of-d1').classList.toggle('ok', O.st.length === 6); }
  IL.onAct(q('#of-steps'), '[data-st]', b => {
    const k = b.dataset.st, m = q('#of-m1'); if (O.st.includes(k) || busB) return;
    const need = OF_STEPS[O.st.length][0];
    if (k !== need) return say(m, ar(OF_NO[need]), 'bad');
    if (k === 'bus'){
      busB = true; let t = 0, last = 0; const tau = 235e-6 * 220e3;   // 235 µF · 220 kΩ bleeder ≈ 52 s
      const loop = ts => { if (!host.isConnected) return; const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts; t += dt * 40 * (DEMO ? 3 * DSPEED : 1);
        const v = 540 * Math.exp(-t / tau); q('#of-bus').innerHTML = L(`DC bus: ${f0(v)} V · t = ${f0(t)} s`);
        if (v < 45){ busB = false; O.st.push('bus'); save(); paint1(); say(m, ar(`الناقل ${f0(v)} V < 50 V بعد ${f0(t)} s: V = 540·e^(−t/RC)، RC = 235 µF × 220 kΩ ≈ 52 s. آمن الآن.`), 'ok'); return; }
        requestAnimationFrame(loop); };
      requestAnimationFrame(loop); say(m, ar('مقياس CAT III على الناقل… الجهد يتفرّغ عبر مقاومة التفريغ.')); return;
    }
    O.st.push(k); save(); paint1(); say(m, ar(O.st.length === 6 ? 'صحيح: الإنكودر الجديد مركّب. زاوية تركيبه عشوائية، فاضبط الإزاحة الآن.' : 'صحيح.'), 'ok');
  });
  /* ---- 2 DC injection ---- */
  const rot = q('#of-rot'), fldG = q('#of-fld'); let mech = rnd(0, 360), anim = null;
  const setRot = a => rot.setAttribute('transform', `rotate(${f1(a)} 130 130)`);
  setRot(mech);
  function ipaint(){ q('#of-io').textContent = O.ipc + ' % · ' + f2(M.I * O.ipc / 100) + ' A'; }
  inp('ipc').addEventListener('input', () => { O.ipc = +inp('ipc').value; save(); ipaint(); });
  function inj(){
    const m = q('#of-m2');
    if (O.st.length < 6) return say(m, ar('أكمل استبدال الإنكودر أولًا.'), 'bad');
    if (O.ipc > 110) return say(m, ar('لا تتجاوز التيار المقنن في الحقن المستمر؛ الملف يسخن والمغانط في خطر.'), 'bad');
    const I = M.I * O.ipc / 100, Ta = M.Kt * I, ratio = O.Tf / Ta;
    fldG.style.display = '';
    if (ratio >= 0.9){ O.read = null; save(); return say(m, ar('الدوّار لم يتحرك: عزم المحاذاة أقل من الاحتكاك؛ ارفع التيار إلى 50–100 % من المقنن.'), 'bad'); }
    const d = Math.asin(ratio) * 180 / Math.PI * O.fr;                   // electrical degrees short of alignment
    O.read = +(((O.th0 + d) % 360 + 360) % 360).toFixed(1); O.iuse = O.ipc; save();
    const target = -d / 4 + 360;                                          // mechanical angle (4 pole pairs)
    const from = mech; let t = 0; if (anim) cancelAnimationFrame(anim);
    const step = () => { t = Math.min(1, t + 0.04 * (DEMO ? 2 * DSPEED : 1)); const k = 1 - Math.pow(1 - t, 3); mech = from + (((target - from) % 90 + 135) % 90 - 45) * k; setRot(mech + Math.sin(t * 20) * 3 * (1 - t)); if (t < 1) anim = requestAnimationFrame(step); else { q('#of-rd').innerHTML = L(`θe(enc) = ${f1(O.read)}°`); say(m, ar(`الدوّار استقر. قراءة الإنكودر الكهربية ${f1(O.read)}° عند ${f2(I)} A.${O.ipc < 50 ? ' التيار منخفض فيبقى خطأ الاحتكاك كبيرًا.' : ''}`), O.ipc < 50 ? '' : 'ok'); } };
    anim = requestAnimationFrame(step);
  }
  function wr(){
    const m = q('#of-m2'), v = num(inp('ofs').value);
    if (O.read == null) return say(m, ar('احقن التيار واقرأ زاوية الإنكودر أولًا.'), 'bad');
    if (!nearA(v, O.read, 0.15)){ mark(inp('ofs'), false); return say(m, ar(nearA(wrap(v - O.read), 180, 1) || nearA(wrap(v - O.read), -180, 1) ? 'هذه الزاوية معكوسة 180°؛ اكتب قراءة الإنكودر كما هي.' : 'اكتب قراءة الإنكودر الكهربية في وضع المحاذاة كما ظهرت.'), 'bad'); }
    mark(inp('ofs'), true); O.set = v; O.wr = true; fldG.style.display = 'none'; save(); setPill();
    if (O.iuse < 50) return say(m, ar(`كُتبت الإزاحة، لكن خطأها الآن ${f1(Math.abs(err()))}° بسبب الاحتكاك عند تيار ${O.iuse} %؛ أعد الحقن بتيار 50–100 %.`), 'bad');
    O.done.dc = true; save(); q('#of-d2').classList.add('ok');
    say(m, ar(`صحيح: الإزاحة ${f1(O.set)}°. يبقى خطأ صغير من الاحتكاك (نحو ${f1(Math.abs(err()))}°)؛ دقّقه بطريقة Back-EMF.`), 'ok');
  }
  /* ---- 3 Back-EMF ---- */
  const rpm = 600, fe = 4 * rpm / 60, Vp = SQ2 * M.Ke * rpm / 1000 / SQ3;
  const sc = Scope(q('#of-sc'), {xy:false, math:false, title:'U-N vs θe(enc)', autoT:() => 5e-3,
    meas(){ if (!O.emf) return null; return [{c:TRC[0], t:`1 U-N: ${f1(Vp / SQ2)} Vrms ${f0(fe)} Hz`}, {c:TRC[1], t:`2 θe: 0–10 V = 0–360°`}, {c:'#ff9f1c', t:`Δφ(1↑ → 2 reset) = ${f1(-err())}°`}]; }});
  function setEMF(){
    if (!O.emf){ sc.setCh(0, null); sc.setCh(1, null); sc.draw(); return; }
    sc.setCh(0, {f:t => Vp * Math.sin(PI2 * fe * t) + nz(0.3), per:1 / fe, dc:0});
    sc.setCh(1, {f:t => 10 * frac(fe * t + (-err()) / 360 + 1) + nz(0.02), per:1 / fe, dc:5});
    sc.st.tdiv = 5e-3; sc.st.ch[0].vdiv = 20; sc.st.ch[0].pos = 1.6; sc.st.ch[1].vdiv = 5; sc.st.ch[1].pos = -3.6;
    sc.st.extra = (st, g) => { const x0 = g.X0 + (0 - st.t0) / (st.tdiv * 10) * g.SW; let h = ''; for (let k = 0; k < 4; k++){ const x = x0 + k / fe / (st.tdiv * 10) * g.SW; h += `<line x1="${f1(x)}" y1="${g.Y0}" x2="${f1(x)}" y2="${g.Y0 + g.SH}" stroke="#ff9f1c" stroke-dasharray="3 4" opacity=".7"/>`; } return h; };
    sc.draw();
  }
  function setPill(){ q('#of-set').innerHTML = L('Pn-OFS = ' + f1(((O.set % 360) + 360) % 360) + '°'); }
  IL.onAct(host, '[data-d]', b => { const m = q('#of-m3'); if (!O.done.dc) return say(m, ar('اضبط الإزاحة بحقن التيار المستمر أولًا.'), 'bad'); if (!O.emf) return say(m, ar('أدِر العمود ووصّل القناتين أولًا.'), 'bad'); O.set = +(((O.set + +b.dataset.d) % 360 + 360) % 360).toFixed(1); save(); setPill(); setEMF(); say(m, ''); });
  function sv(){
    const m = q('#of-m3');
    if (!O.emf) return say(m, ar('أدِر العمود ووصّل القناتين أولًا.'), 'bad');
    if (Math.abs(err()) > 0.5) return say(m, ar(`Δφ = ${f1(-err())}°: حرّك الإزاحة حتى يبدأ المنشار عند عبور الصفر الصاعد (|Δφ| ≤ 0.5°).`), 'bad');
    O.done.bemf = true; save(); q('#of-d3').classList.add('ok'); say(m, ar(`صحيح: الإزاحة ${f1(O.set)}° وخطؤها أقل من 0.5° كهربية.`), 'ok');
  }
  /* ---- 4 test run ---- */
  function run(){
    const m = q('#of-m4'), e = O.st.length < 6 ? NaN : err();
    if (O.st.length < 6) return say(m, ar('أكمل استبدال الإنكودر أولًا.'), 'bad');
    const T = 0.6 * M.T, Iq = T / M.Kt, c = Math.cos(e * Math.PI / 180), ae = Math.abs(e);
    let I, Id, out, cls;
    if (ae >= 75){ I = M.Imax; Id = I * Math.sin(e * Math.PI / 180); out = ae < 100 ? 'المحرك لا يعطي عزمًا: يطنّ ويتوقف، والتيار عند الحد الأقصى ثم AL.oL.' : 'العزم معكوس: المحرك يندفع في الاتجاه الخاطئ، ثم AL.PoS أو AL.oc.'; cls = 'bad'; }
    else { I = Math.min(M.Imax, Iq / c); Id = I * Math.sin(e * Math.PI / 180); out = ae > 15 ? 'دوران خشن وطنين مسموع، والتيار أعلى من اللازم والمحرك يسخن.' : ae > 2 ? 'يدور، لكن التيار أعلى قليلًا من اللازم وفيه انحياز Id.' : 'دوران ناعم بلا طنين ولا انحياز في التيار.'; cls = ae > 2 ? 'bad' : 'ok'; }
    q('#of-ph').innerHTML = phasorSvg(e, I, I * Math.max(0, c));
    q('#of-tb').innerHTML = `<tr><th>e °el</th><th>|I| A</th><th>Iq A</th><th>Id A</th><th>T / T(e=0)</th></tr><tr><td class="${cls}">${f1(e)}</td><td>${f2(I)}</td><td>${f2(I * Math.max(0, c))}</td><td class="${Math.abs(Id) > 0.2 ? 'bad' : 'ok'}">${f2(Id)}</td><td>${f0(Math.max(0, c) * 100)} %</td></tr>`;
    q('#of-rn').innerHTML = `<span class="fx" style="display:block">T = 0.6 × ${M.T} = ${f2(T)} N·m → Iq = T/Kt = ${f2(Iq)} A ; |I| = Iq / cos e = ${f2(Iq)} / ${f3(Math.max(0.001, c))}</span>`;
    say(m, ar(out), cls);
    O.run = +e.toFixed(2); save();
    if (cls === 'ok' && O.done.dc && O.done.bemf){ O.done.run = true; save(); q('#of-d4').classList.add('ok'); win('offset', 'أحسنت: استبدلت الإنكودر بأمان، وضبطت الإزاحة بالحقن ثم دقّقتها بـ Back-EMF، والمحرك يدور بنعومة دون انحياز في التيار.'); }
    else if (cls === 'ok') say(m, ar('الدوران ناعم، لكن أكمل الطريقتين كلتيهما ليُحتسب التمرين.'), '');
  }
  IL.onAct(host, '[data-a]', b => { const a = b.dataset.a; if (a === 'inj') inj(); else if (a === 'wr') wr(); else if (a === 'sv') sv(); else if (a === 'run') run(); else if (a === 'emf'){ if (!O.done.dc) return say(q('#of-m3'), ar('اضبط الإزاحة بحقن التيار المستمر أولًا.'), 'bad'); O.emf = true; save(); setEMF(); say(q('#of-m3'), ar('العمود يدور عند 600 r/min: f = 4 × 600/60 = 40 Hz.')); } });
  ipaint(); paint1(); setPill(); setEMF();
  if (O.wr && O.done.dc) q('#of-d2').classList.add('ok'); if (O.done.bemf) q('#of-d3').classList.add('ok');
  q('#of-ph').innerHTML = phasorSvg(0, 0, 0);
  newScenario(host, 'offset', () => { S.of = genOF(); });
  demo(host, 'offset', async () => {
    O.st = []; O.read = null; O.wr = false; O.emf = false; O.done = {}; O.ipc = 20; inp('ipc').value = 20; ipaint(); paint1(); setEMF();
    await dClick(q('[data-a="run"]'), 400); await sleep(900 / DSPEED);
    for (const s of OF_STEPS){ await dClick(q(`#of-steps [data-st="${s[0]}"]`), 300); await dWait(() => !busB); }
    await dClick(q('[data-a="run"]'), 400); await sleep(1200 / DSPEED);
    await dSet(inp('ipc'), 80); await dClick(q('[data-a="inj"]')); await dWait(() => O.read != null && q('#of-rd').textContent.indexOf('---') < 0, 8000);
    await dSet(inp('ofs'), f1(O.read)); await dClick(q('[data-a="wr"]'));
    await dClick(q('[data-a="emf"]')); await sleep(600 / DSPEED);
    for (let g = 0; g < 60 && Math.abs(err()) > 0.5; g++){ const e = err(), d = Math.abs(e) >= 10 ? 10 : Math.abs(e) >= 1 ? 1 : 0.1; await dClick(q(`[data-d="${e > 0 ? -d : d}"]`), 160); }
    await dClick(q('[data-a="sv"]')); await dClick(q('[data-a="run"]'));
  });
};

/* =====================================================================
   TAB 6 · brake (l7): Z supported, coil R, release voltage, tr / te on the scope, holding torque
   ===================================================================== */
const BK_V = [['ok', 'الفرامل سليمة: تعود إلى الخدمة'], ['worn', 'تآكل البطانة واتساع الفجوة: تُستبدل الفرامل'], ['coil', 'قصر بين لفات ملف الفرامل: يُستبدل الملف أو الفرامل'], ['oil', 'زيت على سطح الاحتكاك: أصلح السدادة واستبدل الفرامل'], ['diode', 'ديود إخماد بطيء في اللوحة: استبدله بفاريستور أو زينر']];
function genBK(){
  const f = pick(['ok', 'worn', 'coil', 'oil', 'diode']);
  const R = f === 'coil' ? +rnd(24, 28).toFixed(1) : +rnd(38.6, 41.4).toFixed(1);
  const Vr = f === 'worn' ? +rnd(22.6, 23.4).toFixed(1) : +rnd(15.2, 17.6).toFixed(1);
  const tr = f === 'worn' ? rint(125, 150) : f === 'coil' ? rint(55, 65) : rint(72, 88);
  const te = f === 'diode' ? rint(125, 160) : rint(26, 34);
  const Ts = f === 'worn' ? +rnd(9, 10.5).toFixed(1) : f === 'oil' ? +rnd(5, 7.5).toFixed(1) : +rnd(13.2, 15).toFixed(1);
  return {f, R, Vr, tr, te, Ts, sup:false, psu:0, rel:false, relV:null, mode:'on', shot:false, tq:0, slip:null, calc:{}, done:{}, vd:''};
}
function zSvg(sup){
  return `<svg viewBox="0 0 300 230" role="img" aria-label="المحور Z ورأس المغزل"><rect x="0" y="0" width="300" height="230" rx="10" fill="var(--bg)"/>
  <rect x="40" y="10" width="40" height="210" fill="#8d969b" stroke="#5b656b"/><rect x="60" y="10" width="6" height="200" fill="#c9ccc7"/>
  <rect x="80" y="${sup ? 70 : 70}" width="120" height="70" rx="6" fill="#c9ccc7" stroke="#6b7378" stroke-width="2"/><rect x="128" y="140" width="24" height="40" fill="#6b7378"/>
  <rect x="62" y="14" width="44" height="34" rx="4" fill="#22282c"/><text x="84" y="35" text-anchor="middle" font-size="9" font-weight="700" fill="#f6cf45">Z MOTOR</text>
  <rect x="20" y="214" width="260" height="10" fill="#5b656b"/>
  ${sup ? '<rect x="118" y="180" width="44" height="34" fill="#b7791f" stroke="#6d4510" stroke-width="2"/><rect x="190" y="140" width="22" height="74" fill="#b7791f" stroke="#6d4510" stroke-width="2"/><text x="230" y="120" font-size="11" font-weight="700" fill="var(--good)">SUPPORTED ✓</text>' : '<path d="M140 186 L140 206 M132 198 L140 208 L148 198" stroke="var(--bad)" stroke-width="3" fill="none"/><text x="214" y="200" font-size="11" font-weight="700" fill="var(--bad)">gravity load!</text>'}
  <text x="140" y="110" text-anchor="middle" font-size="11" font-weight="700" fill="#22282c">SPINDLE HEAD</text></svg>`;
}
function bkBenchSvg(NB){
  return `<svg viewBox="${NB ? '0 0 360 440' : '0 0 560 230'}" role="img" aria-label="ملتيميتر ومصدر جهد وموصّل الفرامل">
  ${dmmSvg('bk', 8, 14, 'Ω')}
  ${plugSvg('r', 38, 184, '#d32f2f', 'Ω', 9)}${plugSvg('b', 90, 184, '#222', 'COM', 9)}
  <rect x="150" y="20" width="200" height="190" rx="12" fill="#3c4449" stroke="#1d2124" stroke-width="2"/><text x="250" y="40" text-anchor="middle" font-size="10" font-weight="700" fill="#f6cf45">LAB DC SUPPLY 0–30 V</text>
  <rect x="166" y="50" width="168" height="44" rx="4" fill="#06130b"/><text id="bk-psv" x="250" y="82" text-anchor="middle" font-size="24" font-weight="700" fill="#4dff88">0.0 V</text>
  <text id="bk-psi" x="250" y="112" text-anchor="middle" font-size="13" font-weight="700" fill="#4dff88">0.00 A</text>
  <circle cx="200" cy="160" r="26" fill="#22282c" stroke="#8d969b" stroke-width="2"/><line id="bk-kn" x1="200" y1="160" x2="200" y2="138" stroke="#e9eef1" stroke-width="3"/><text x="200" y="200" text-anchor="middle" font-size="9" fill="#cfd6da">VOLTAGE</text>
  <circle cx="290" cy="150" r="9" fill="#c0352b"/><circle cx="320" cy="150" r="9" fill="#222"/><text x="305" y="180" text-anchor="middle" font-size="9" fill="#cfd6da">to BR+ / BR−</text>
  <g transform="${NB ? 'translate(-230 210)' : ''}"><rect x="380" y="30" width="170" height="180" rx="12" fill="#5d666c" stroke="#3c4449" stroke-width="2"/><text x="465" y="50" text-anchor="middle" font-size="10" font-weight="700" fill="#e9eef1">Z MOTOR · BRAKE PINS</text>
  <circle cx="465" cy="120" r="56" fill="#9aa1a6" stroke="#5b656b" stroke-width="2"/><circle cx="465" cy="120" r="46" fill="#22282c"/>
  ${tpSvg('BR+', 440, 128, 'A · BR+', {tc:'#f2f6f8', fs:10})}${tpSvg('BR−', 490, 128, 'B · BR−', {tc:'#f2f6f8', fs:10})}
  <text id="bk-st" x="465" y="198" text-anchor="middle" font-size="11" font-weight="700" fill="#ff9f1c">ENGAGED</text></g>
  <g class="cabs"></g></svg>`;
}
function wrenchSvg(tq, slip){
  const a = -120 + IL.clamp(tq / 20, 0, 1) * 240;
  return `<svg viewBox="0 0 300 180" role="img" aria-label="مفتاح العزم على عمود المحرك"><rect x="0" y="0" width="300" height="180" rx="10" fill="var(--bg)"/>
  <rect x="20" y="78" width="200" height="24" rx="12" fill="#8d969b" stroke="#5b656b" stroke-width="2"/><rect x="200" y="70" width="40" height="40" rx="6" fill="#5b656b"/><circle cx="252" cy="90" r="14" fill="#c9ccc7" stroke="#6b7378" stroke-width="2"/>
  <circle cx="90" cy="90" r="46" fill="#f3f1e6" stroke="#333" stroke-width="2"/>
  ${[0, 5, 10, 15, 20].map(v => { const b = (-120 + v / 20 * 240 - 90) * Math.PI / 180; return `<line x1="${f1(90 + 38 * Math.cos(b))}" y1="${f1(90 + 38 * Math.sin(b))}" x2="${f1(90 + 45 * Math.cos(b))}" y2="${f1(90 + 45 * Math.sin(b))}" stroke="#333" stroke-width="2"/><text x="${f1(90 + 28 * Math.cos(b))}" y="${f1(90 + 28 * Math.sin(b) + 4)}" text-anchor="middle" font-size="9" fill="#333">${v}</text>`; }).join('')}
  <line x1="90" y1="90" x2="90" y2="52" stroke="#c0352b" stroke-width="3" transform="rotate(${f1(a)} 90 90)"/><circle cx="90" cy="90" r="4" fill="#333"/>
  <text x="90" y="160" text-anchor="middle" font-size="12" font-weight="700" class="tx">${f1(tq)} N·m</text>
  <text x="252" y="140" text-anchor="middle" font-size="11" font-weight="700" fill="${slip ? 'var(--bad)' : 'var(--good)'}">${slip ? 'SLIPS' : 'HOLDS'}</text></svg>`;
}
BUILD.brake = host => {
  if (!S.bk || S.bk.R == null) S.bk = genBK();
  const B = S.bk, Ifin = 24 / B.R;
  host.innerHTML = `
  <p class="sym">${ar('فرامل المحور Z، وشكوى المشغّل: رأس المغزل ينزل قليلًا عند إيقاف المحور.')}<br>${['24 V DC ±10 %', '0.6 A ≈ 40 Ω', 'hold 12 N·m', 'tr ≈ 80 ms', 'te ≈ 30 ms'].map(L).join(' · ')}</p>
  <div class="grid2">
    <div class="dev" id="bk-d1"><h3><span class="n">1</span>ادعم المحور Z أولًا</h3><div class="stage" id="bk-z"></div>
      <div class="row"><button type="button" class="btn" data-a="sup">${ar('أنزل الرأس على كتلة دعم وثبّت الدعامة')}</button></div><p class="msg" id="bk-m1" aria-live="polite"></p></div>
    <div class="dev" id="bk-d2"><h3><span class="n">2</span>مقاومة الملف وجهد التحرير</h3>
      <p class="note">${ar('كابل الفرامل مفصول عن الدرايف. قِس المقاومة بين BR+ و BR−، ثم ارفع جهد المصدر ببطء حتى تُسمع نقرة التحرير.')}</p>
      <div class="stage">${bkBenchSvg(NARROW())}</div>
      <div class="slider"><span>${ar('جهد المصدر')}</span><input type="range" min="0" max="26.4" step="0.1" value="${B.psu}" data-k="psu" aria-label="جهد المصدر"><output id="bk-po"></output></div>
      ${fld('I', 'تيار الملف عند 24 V', 'A', B.calc.I)}${fld('vr', 'جهد التحرير المقيس', 'V', B.calc.vr)}
      <div class="row"><button type="button" class="btn pri" data-a="c2">تحقّق</button></div>
      <p class="msg" id="bk-m2" aria-live="polite"></p><div id="bk-fx2"></div>
    </div>
  </div>
  <div class="dev" id="bk-d3"><h3><span class="n">3</span>زمنا التحرير والتعشيق على راسم الإشارة</h3>
    <p class="note">${ar('CH1 جهد الملف، CH2 تيار الملف بمجس تيار، CH3 مجس إزاحة على قرص الفرامل (مرتفع = محرَّرة). التقاط واحد عند التشغيل وآخر عند الفصل، والقطع عند t = 0.')}</p>
    <div class="sgm ar" id="bk-mode"><button type="button" data-mode="on">${ar('التقاط التحرير (تشغيل 24 V)')}</button><button type="button" data-mode="off">${ar('التقاط التعشيق (فصل 24 V)')}</button></div>
    <div id="bk-sc"></div>
    ${fld('tr', 'زمن التحرير tr', 'ms', B.calc.tr)}${fld('te', 'زمن التعشيق te', 'ms', B.calc.te)}
    <div class="row"><button type="button" class="btn pri" data-a="c3">تحقّق</button></div>
    <p class="msg" id="bk-m3" aria-live="polite"></p>
  </div>
  <div class="grid2">
    <div class="dev" id="bk-d4"><h3><span class="n">4</span>عزم التثبيت بمفتاح العزم</h3>
      <p class="note">${ar('الفرامل معشّقة والعمود مفكوك عن الحمل. زد العزم تدريجيًا حتى 12 N·m؛ إن انزلق العمود قبلها فالعزم غير كافٍ.')}</p>
      <div class="stage" id="bk-w"></div>
      <div class="row"><button type="button" class="btn" data-a="t0">0</button><button type="button" class="btn" data-a="t+">+1 N·m</button><button type="button" class="btn" data-a="t2">+0.5 N·m</button></div>
      <p class="msg" id="bk-m4" aria-live="polite"></p></div>
    <div class="dev" id="bk-d5"><h3><span class="n">5</span>الحكم</h3>
      <div class="tblw"><table class="tbl hm" id="bk-sum"></table></div>
      ${typical('المقاومة 40 Ω ±10 %، التحرير عند جهد ≤ 21.6 V (90 % من 24 V)، tr نحو 80 ms و te نحو 30 ms، عزم تثبيت ≥ 12 N·m')}
      ${sel('vd', 'حالة الفرامل والإجراء', BK_V, B.vd)}
      <div class="row"><button type="button" class="btn pri" data-a="vd">احكم</button></div>
      <p class="msg" id="bk-m5" aria-live="polite"></p></div>
  </div>
  ${foot()}`;
  const q = s => $(s, host), inp = k => q(`[data-k="${k}"]`);
  const needSup = m => { if (!B.sup){ say(m, ar('توقّف: المحور Z غير مدعوم؛ تحرير الفرامل يُسقط رأس المغزل.'), 'bad'); return true; } return false; };
  q('#bk-z').innerHTML = zSvg(B.sup);
  /* DMM on brake pins */
  const svg = $('#bk-d2 svg', host), m2 = q('#bk-m2');
  const LD = Leads(svg, {single:true, plugs:{r:{x:38, y:184, color:'#d32f2f', el:$('[data-plug="r"]', svg)}, b:{x:90, y:184, color:'#222', el:$('[data-plug="b"]', svg)}},
    targets:NARROW() ? {'BR+':{x:210, y:338}, 'BR−':{x:260, y:338}} : {'BR+':{x:440, y:128}, 'BR−':{x:490, y:128}},
    ok(){ return B.psu > 0 ? 'أعد المصدر إلى 0 V قبل قياس المقاومة؛ الأوميتر لا يقيس على دائرة مغذّاة.' : true; },
    msg(t){ if (t) say(m2, ar(t), 'bad'); }, change(){ dmm(); }});
  function dmm(){ const a = LD.conn.r, b = LD.conn.b; if (a && b && a !== b){ lcdSet(svg, 'bk', f1(B.R * (1 + nz(0.002))), 'Ω'); B.done.r = true; save(); summ(); } else lcdSet(svg, 'bk', 'OL', 'Ω'); }
  function psu(){
    const v = B.psu; q('#bk-po').textContent = f1(v) + ' V'; q('#bk-psv').textContent = f1(v) + ' V';
    q('#bk-kn').setAttribute('transform', `rotate(${f1(-130 + v / 30 * 260)} 200 160)`);
    q('#bk-psi').textContent = f2(v / B.R) + ' A';
    if (!B.rel && v >= B.Vr){ B.rel = true; B.relV = +v.toFixed(1); save(); say(m2, ar(`نقرة! تحرّرت الفرامل عند ${f1(v)} V.`), 'ok'); }
    if (B.rel && v < 4){ B.rel = false; save(); say(m2, ar(`عشّقت الفرامل عند ${f1(v)} V (جهد السقوط).`)); }
    q('#bk-st').textContent = B.rel ? 'RELEASED' : 'ENGAGED'; q('#bk-st').setAttribute('fill', B.rel ? '#7dff9a' : '#ff9f1c');
  }
  inp('psu').addEventListener('input', () => {
    const v = +inp('psu').value;
    if (v > 0 && !B.sup){ inp('psu').value = 0; B.psu = 0; psu(); return needSup(m2); }
    if (v > 0 && (LD.conn.r || LD.conn.b)){ LD.clearAll(); lcdSet(svg, 'bk', '----', 'Ω'); }
    B.psu = v; save(); psu();
  });
  ['I', 'vr', 'tr', 'te'].forEach(k => inp(k).addEventListener('input', () => { B.calc[k] = inp(k).value; save(); }));
  function c2(){
    const m = q('#bk-m2');
    if (!B.done.r) return say(m, ar('قِس مقاومة الملف أولًا.'), 'bad');
    if (B.relV == null) return say(m, ar('ارفع جهد المصدر حتى تتحرر الفرامل.'), 'bad');
    const I = num(inp('I').value), v = num(inp('vr').value), okI = nearA(I, 24 / B.R, 0.02), okV = nearA(v, B.relV, 0.6);
    mark(inp('I'), okI); mark(inp('vr'), okV);
    if (!okI) return say(m, ar(`I = V ÷ R = 24 ÷ ${f1(B.R)}.`), 'bad');
    if (!okV) return say(m, ar('اكتب الجهد الذي سُمعت عنده نقرة التحرير.'), 'bad');
    B.done.c2 = true; save(); q('#bk-d2').classList.add('ok');
    q('#bk-fx2').innerHTML = `<div class="fx">I = 24 / ${f1(B.R)} = <b>${f2(24 / B.R)} A</b> <span class="${Math.abs(B.R - 40) > 4 ? 'bad' : 'ok'}">${Math.abs(B.R - 40) > 4 ? 'R outside 40 Ω ±10 %' : 'R OK'}</span> ; P = 24²/R = ${f1(576 / B.R)} W<br>V release = ${f1(B.relV)} V <span class="${B.relV > 21.6 ? 'bad' : 'ok'}">${B.relV > 21.6 ? '> 21.6 V (0.9 × 24)' : '≤ 21.6 V'}</span></div>`;
    say(m, ar('صحيح.'), 'ok'); summ();
  }
  /* scope single shot */
  const sc = Scope(q('#bk-sc'), {xy:false, math:false, title:'brake 24 V', trigLab:'CH1 single', autoT:() => B.mode === 'on' ? (B.tr > 100 ? 50e-3 : 20e-3) : (B.te > 100 ? 50e-3 : 20e-3)});
  const tau = 0.04;
  function setShot(){
    if (!B.shot){ [0, 1, 2].forEach(i => sc.setCh(i, null)); sc.draw(); return; }
    const tr = B.tr / 1000, te = B.te / 1000, diode = B.f === 'diode';
    if (B.mode === 'on'){
      const Itr = Ifin * (1 - Math.exp(-tr / tau)), Imn = Itr * 0.72;
      const I = t => t < 0 ? 0 : t < tr ? Ifin * (1 - Math.exp(-t / tau)) : t < tr + 0.008 ? Itr - (Itr - Imn) * Math.sin((t - tr) / 0.008 * Math.PI / 2) : Ifin - (Ifin - Imn) * Math.exp(-(t - tr - 0.008) / (tau * 1.4));
      sc.setCh(0, {f:t => (t < 0 ? 0 : 24) + nz(0.1), dc:24}); sc.setCh(1, {f:t => I(t) + nz(0.004), dc:Ifin}); sc.setCh(2, {f:t => (t < tr ? 0 : 5) + nz(0.04), dc:5});
    } else {
      const td = diode ? 0.09 : 0.003;
      const I = t => t < 0 ? Ifin : diode ? Ifin * Math.exp(-t / td) : Math.max(0, Ifin * (1 - t / td));
      const V = t => t < 0 ? 24 : diode ? -0.7 * Math.exp(-t / td) : t < td ? -48 : 0;
      sc.setCh(0, {f:t => V(t) + nz(0.1), dc:0, mm:(a, b) => (!diode && a < td && b > 0) ? [-48, 24] : null}); sc.setCh(1, {f:t => I(t) + nz(0.004), dc:0}); sc.setCh(2, {f:t => (t < te ? 5 : 0) + nz(0.04), dc:0});
    }
    sc.st.t0 = -sc.st.tdiv; sc.st.tdiv = B.mode === 'on' ? (B.tr > 100 ? 50e-3 : 20e-3) : (B.te > 100 ? 50e-3 : 20e-3); sc.st.t0 = -sc.st.tdiv;
    const c = sc.st.ch; c[0].vdiv = B.mode === 'on' ? 10 : 20; c[0].pos = B.mode === 'on' ? 1.2 : 1.4; c[1].vdiv = 0.2; c[1].pos = -1.6; c[2].vdiv = 5; c[2].pos = -3.6;
    sc.st.meas = () => [{c:TRC[0], t:'1: V coil'}, {c:TRC[1], t:'2: I coil (0.2 A/div)'}, {c:TRC[2], t:'3: armature (high = released)'}];
    sc.draw();
  }
  IL.onAct(q('#bk-mode'), '[data-mode]', b => {
    if (needSup(q('#bk-m3'))) return;
    B.mode = b.dataset.mode; B.shot = true; B['sh_' + B.mode] = true; save(); paintMode(); setShot(); say(q('#bk-m3'), ar('التقاط واحد. اقرأ الزمن من بداية t = 0 حتى تغيّر CH3، والقسم الأفقي ' + tfmt(sc.st.tdiv) + '.'));
  });
  function paintMode(){ $$('#bk-mode [data-mode]', host).forEach(b => b.setAttribute('aria-pressed', B.shot && b.dataset.mode === B.mode ? 'true' : 'false')); }
  function c3(){
    const m = q('#bk-m3');
    if (!B.sh_on || !B.sh_off) return say(m, ar('التقط التحرير والتعشيق كليهما أولًا.'), 'bad');
    const a = num(inp('tr').value), b = num(inp('te').value), okA = nearA(a, B.tr, 10), okB = nearA(b, B.te, 10);
    mark(inp('tr'), okA); mark(inp('te'), okB);
    if (!okA) return say(m, ar('tr من لحظة تطبيق 24 V (t = 0) حتى ارتفاع CH3، وتظهر معه انخفاضة التيار.'), 'bad');
    if (!okB) return say(m, ar('te من لحظة فصل 24 V (t = 0) حتى انخفاض CH3.'), 'bad');
    B.done.c3 = true; save(); q('#bk-d3').classList.add('ok'); say(m, ar(`صحيح: tr = ${B.tr} ms و te = ${B.te} ms.`), 'ok'); summ();
  }
  /* torque */
  function wpaint(){ q('#bk-w').innerHTML = wrenchSvg(B.tq, B.slip != null && B.tq >= B.slip); }
  function torque(d){
    const m = q('#bk-m4');
    if (needSup(m)) return;
    if (B.rel || B.psu > 0) return say(m, ar('أعد المصدر إلى 0 V حتى تعشّق الفرامل قبل اختبار العزم.'), 'bad');
    if (d === 0){ B.tq = 0; save(); wpaint(); return say(m, ''); }
    if (B.slip != null) return say(m, ar(`انزلق العمود عند ${f1(B.slip)} N·m؛ سُجّلت القيمة.`), 'bad');
    B.tq = Math.min(12, +(B.tq + d).toFixed(1));
    if (B.tq >= B.Ts){ B.slip = B.tq; B.done.tq = true; save(); wpaint(); summ(); return say(m, ar(`انزلق العمود عند ${f1(B.tq)} N·m، أقل من 12 N·m المطلوبة.`), 'bad'); }
    if (B.tq >= 12){ B.done.tq = true; save(); wpaint(); summ(); return say(m, ar('ثبتت الفرامل عند 12 N·m دون انزلاق ✓ لا تتجاوز العزم المقنن.'), 'ok'); }
    save(); wpaint(); say(m, ar(`${f1(B.tq)} N·m: لا انزلاق.`));
  }
  function summ(){
    q('#bk-sum').innerHTML = `<tr><th>R Ω</th><th>I A</th><th>V rel V</th><th>tr ms</th><th>te ms</th><th>hold N·m</th></tr><tr><td class="${B.done.r ? (Math.abs(B.R - 40) > 4 ? 'bad' : 'ok') : ''}">${B.done.r ? f1(B.R) : '—'}</td><td>${B.done.c2 ? f2(24 / B.R) : '—'}</td><td class="${B.done.c2 ? (B.relV > 21.6 ? 'bad' : 'ok') : ''}">${B.done.c2 ? f1(B.relV) : '—'}</td><td class="${B.done.c3 ? (B.tr > 110 ? 'bad' : 'ok') : ''}">${B.done.c3 ? B.tr : '—'}</td><td class="${B.done.c3 ? (B.te > 60 ? 'bad' : 'ok') : ''}">${B.done.c3 ? B.te : '—'}</td><td class="${B.done.tq ? (B.slip != null ? 'bad' : 'ok') : ''}">${B.done.tq ? (B.slip != null ? 'slip ' + f1(B.slip) : '≥ 12') : '—'}</td></tr>`;
  }
  function vd(){
    const m = q('#bk-m5'), s = inp('vd'); B.vd = s.value; save();
    if (!B.done.c2 || !B.done.c3 || !B.done.tq) return say(m, ar('أكمل المقاومة وجهد التحرير والزمنين وعزم التثبيت قبل الحكم.'), 'bad');
    if (!s.value) return say(m, ar('اختر الحكم.'), 'bad');
    const ok = s.value === B.f; mark(s, ok);
    if (!ok) return say(m, ar({ok:'كل القياسات في حدودها، فالفرامل سليمة.', worn:'جهد التحرير فوق 21.6 V وزمن التحرير طويل والعزم ناقص: هذه فجوة متسعة وبطانة متآكلة.', coil:'المقاومة أقل من 36 Ω والتيار أعلى من 0.6 A: قصر بين لفات الملف.', oil:'الكهرباء سليمة لكن العمود ينزلق تحت 12 N·m بكثير: زيت على سطح الاحتكاك.', diode:'كل شيء سليم إلا te الطويل: الديود يبطئ انهيار التيار، فالسبب في دائرة الإخماد لا في الفرامل.'}[B.f]), 'bad');
    B.done.vd = true; save(); q('#bk-d5').classList.add('ok'); say(m, ar('صحيح: ' + BK_V.find(v => v[0] === B.f)[1] + '.'), 'ok');
    win('brake', 'أحسنت: دعمت المحور Z أولًا، وقست الملف والتحرير والزمنين والعزم، وحكمت على الفرامل بالدليل.');
  }
  IL.onAct(host, '[data-a]', b => {
    const a = b.dataset.a;
    if (a === 'sup'){ B.sup = true; save(); q('#bk-z').innerHTML = zSvg(true); q('#bk-d1').classList.add('ok'); say(q('#bk-m1'), ar('الرأس مدعوم بكتلة ودعامة ✓ يمكن الآن تحرير الفرامل بأمان.'), 'ok'); }
    else if (a === 'c2') c2(); else if (a === 'c3') c3(); else if (a === 'vd') vd();
    else if (a === 't+') torque(1); else if (a === 't2') torque(0.5); else if (a === 't0') torque(0);
  });
  if (B.sup) q('#bk-d1').classList.add('ok');
  psu(); paintMode(); setShot(); wpaint(); summ();
  if (B.done.c2){ B.done.c2 = false; c2(); } if (B.done.c3) q('#bk-d3').classList.add('ok');
  newScenario(host, 'brake', () => { S.bk = genBK(); });
  demo(host, 'brake', async () => {
    Object.assign(B, {sup:false, psu:0, rel:false, relV:null, mode:'on', shot:false, sh_on:false, sh_off:false, tq:0, slip:null, calc:{}, done:{}, vd:''}); q('#bk-z').innerHTML = zSvg(false); inp('psu').value = 0; psu(); setShot(); wpaint(); summ();
    await dSet(inp('psu'), 5); await sleep(600 / DSPEED);
    await dClick(q('[data-a="sup"]'));
    await dClick($('[data-plug="r"]', svg), 250); await dClick($('[data-tg="BR+"]', svg), 250); await dClick($('[data-plug="b"]', svg), 250); await dClick($('[data-tg="BR−"]', svg), 250);
    for (let v = 10; v <= 26.4 && !B.rel; v += 0.5){ await dSet(inp('psu'), v.toFixed(1), 60); }
    await dSet(inp('I'), f2(24 / B.R)); await dSet(inp('vr'), f1(B.relV)); await dClick(q('[data-a="c2"]'));
    await dSet(inp('psu'), 0);
    await dClick(q('#bk-mode [data-mode="on"]')); await sleep(1000 / DSPEED); await dClick(q('#bk-mode [data-mode="off"]')); await sleep(1000 / DSPEED);
    await dSet(inp('tr'), B.tr); await dSet(inp('te'), B.te); await dClick(q('[data-a="c3"]'));
    for (let k = 0; k < 13 && !B.done.tq; k++) await dClick(q('[data-a="t+"]'), 180);
    await dSet(inp('vd'), B.f); await dClick(q('[data-a="vd"]'));
  });
};

/* =====================================================================
   shared case engine for the bearing (l8) and cable (l9) tabs:
   symptom → isolate if needed → measure with the right tool → cause → fix
   ===================================================================== */
function CaseTab(host, id, cfg){
  if (!S[cfg.key] || !S[cfg.key].list) S[cfg.key] = {list:cfg.gen(), cur:0};
  const D = S[cfg.key];
  host.innerHTML = `
  ${cfg.intro ? `<div class="stage" id="${id}-ov">${cfg.intro()}</div>` : ''}
  <div class="chipline" id="${id}-tabs">${D.list.map((c, i) => `<button type="button" class="btn${c.ok ? ' done' : ''}" data-s="${i}">${ar('الحالة ' + (i + 1))}</button>`).join('')}</div>
  <div class="case" id="${id}-card"></div>
  ${cfg.typ ? typical(cfg.typ) : ''}
  ${foot()}`;
  const q = s => $(s, host);
  let cur = D.cur || 0, busy = false;
  function render(){
    const c = D.list[cur]; D.cur = cur; save();
    $$(`#${id}-tabs .btn`, host).forEach((b, i) => { b.classList.toggle('cur', i === cur); b.classList.toggle('done', !!D.list[i].ok); });
    q(`#${id}-card`).className = 'case' + (c.ok ? ' ok' : '');
    q(`#${id}-card`).innerHTML = `
      <h4>${ar(cfg.title(c))} <span class="pill ${c.live ? 'warn' : 'ok'}" id="${id}-st">${ar(c.live ? 'المحور في الخدمة' : 'معزول ومقفل · الناقل < 50 V')}</span></h4>
      <div class="sym"><b>${ar('العَرَض:')}</b> ${ar(cfg.sym(c))}</div>
      <div class="row"><button type="button" class="btn" data-a="loto">${ar(c.live ? 'افصل وأقفل وقِس الناقل' : 'أعد المحور إلى التشغيل')}</button>${cfg.extraBtn ? cfg.extraBtn(c) : ''}</div>
      <div class="tools">${Object.keys(cfg.tools).map(k => `<button type="button" class="btn${c.used[k] ? ' used' : ''}" data-t="${k}">${ar(cfg.tools[k].n)}</button>`).join('')}</div>
      <div class="res" id="${id}-res"></div>
      <ul class="note" id="${id}-log" style="margin:0;padding-inline-start:18px">${Object.keys(c.used).map(k => `<li>${ar(cfg.tools[k].n)}: ${ar(cfg.tools[k].log(c))}</li>`).join('')}</ul>
      <div id="${id}-calc"></div>
      ${sel('c', 'السبب', cfg.causes, c.c)}${sel('r', 'الإصلاح', cfg.fixes, c.r)}
      <div class="row"><button type="button" class="btn pri" data-a="chk">احكم</button></div>
      <p class="msg" id="${id}-m" aria-live="polite"></p>`;
    ['c', 'r'].forEach(k => $(`[data-k="${k}"]`, q(`#${id}-card`)).addEventListener('change', e => { c[k] = e.target.value; save(); }));
    calc();
    if (c.ok) say(q(`#${id}-m`), ar('صحيح: ' + cfg.why(c)), 'ok');
  }
  function calc(){
    const c = D.list[cur], el = q(`#${id}-calc`);
    if (!cfg.calc || !cfg.calc.show(c)){ el.innerHTML = ''; return; }
    el.innerHTML = `${fld('cv', cfg.calc.label(c), cfg.calc.unit, c.cv)}<div id="${id}-cfx"></div>`;
    $('[data-k="cv"]', el).addEventListener('input', e => { c.cv = e.target.value; save(); });
  }
  IL.onAct(q(`#${id}-tabs`), '[data-s]', b => { if (busy) return; cur = +b.dataset.s; render(); });
  function loto(){
    const c = D.list[cur], m = q(`#${id}-m`), st = q(`#${id}-st`);
    if (busy) return;
    if (!c.live){ c.live = true; save(); render(); say(q(`#${id}-m`), ar('أُزيل القفل وأعيد المحور إلى التشغيل.')); return; }
    busy = true; let t = 0, last = 0; const tau = 235e-6 * 220e3;
    const loop = ts => { if (!host.isConnected) return; const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts; t += dt * 60 * (DEMO ? 3 * DSPEED : 1);
      const v = 540 * Math.exp(-t / tau); st.innerHTML = ar(`DC bus ${f0(v)} V`);
      if (v < 45){ busy = false; c.live = false; save(); render(); say(q(`#${id}-m`), ar(`القاطع مفصول ومقفل، والناقل ${f0(v)} V < 50 V بعد ${f0(t)} s.`), 'ok'); return; }
      requestAnimationFrame(loop); };
    requestAnimationFrame(loop); say(m, ar('القاطع مفصول ومقفل؛ مقياس CAT III على الناقل المستمر…'));
  }
  function tool(k){
    const c = D.list[cur], T = cfg.tools[k], m = q(`#${id}-m`);
    if (busy) return;
    if (T.live === true && !c.live) return say(m, ar('هذا القياس يحتاج المحور يعمل؛ أعده إلى التشغيل أولًا.'), 'bad');
    if (T.live === false && c.live) return say(m, ar('افصل وأقفل وقِس الناقل تحت 50 V قبل هذا الفحص.'), 'bad');
    if (T.pre){ const r = T.pre(c); if (r !== true) return say(m, ar(r), 'bad'); }
    c.used[k] = 1; save();
    q(`#${id}-res`).innerHTML = T.show(c);
    if (T.after) T.after(c);
    $(`[data-t="${k}"]`, host).classList.add('used');
    q(`#${id}-log`).innerHTML = Object.keys(c.used).map(x => `<li>${ar(cfg.tools[x].n)}: ${ar(cfg.tools[x].log(c))}</li>`).join('');
    calc(); say(m, '');
  }
  function chk(){
    const c = D.list[cur], m = q(`#${id}-m`), card = q(`#${id}-card`), cv = $('[data-k="c"]', card).value, rv = $('[data-k="r"]', card).value;
    if (!cfg.need(c).some(k => c.used[k])) return say(m, ar('قِس أولًا بالأداة التي تثبت السبب؛ لا تخمّن.'), 'bad');
    if (cfg.calc && cfg.calc.show(c)){ const r = cfg.calc.check(c, num($('[data-k="cv"]', card).value)); mark($('[data-k="cv"]', card), r === true); if (r !== true) return say(m, ar(r), 'bad'); q(`#${id}-cfx`).innerHTML = cfg.calc.fx(c); }
    if (!cv || !rv) return say(m, ar('اختر السبب والإصلاح.'), 'bad');
    const okC = cv === cfg.cause(c), okR = rv === cfg.fix(c);
    mark($('[data-k="c"]', card), okC); mark($('[data-k="r"]', card), okR);
    if (!okC) return say(m, ar(cfg.noC(c, cv)), 'bad');
    if (!okR) return say(m, ar(cfg.noR(c, rv)), 'bad');
    c.ok = true; save(); card.classList.add('ok'); $(`#${id}-tabs [data-s="${cur}"]`, host).classList.add('done');
    say(m, ar('صحيح: ' + cfg.why(c)), 'ok');
    if (D.list.every(x => x.ok)) win(id, cfg.winMsg);
  }
  IL.onAct(host, '[data-a],[data-t]', b => { if (b.dataset.t) tool(b.dataset.t); else if (b.dataset.a === 'loto') loto(); else if (b.dataset.a === 'chk') chk(); else if (cfg.onAct) cfg.onAct(b.dataset.a, D.list[cur], render); });
  render();
  newScenario(host, id, () => { S[cfg.key] = {list:cfg.gen(), cur:0}; });
  demo(host, id, async () => {
    D.list.forEach(c => { c.ok = false; c.c = ''; c.r = ''; c.used = {}; c.live = true; c.cv = ''; Object.assign(c, cfg.reset ? cfg.reset(c) : {}); }); cur = 0; render();
    for (let i = 0; i < D.list.length; i++){
      await dClick(q(`#${id}-tabs [data-s="${i}"]`), 300);
      const c = D.list[i], k = cfg.need(c)[0], T = cfg.tools[k];
      if (T.live === false && c.live){ await dClick(q('[data-a="loto"]')); await dWait(() => !busy); }
      if (T.live === true && !c.live){ await dClick(q('[data-a="loto"]')); }
      if (cfg.demoPre) await cfg.demoPre(c, k, q);
      await dClick(q(`[data-t="${k}"]`)); await sleep(700 / DSPEED);
      if (cfg.calc && cfg.calc.show(c)) await dSet(q(`#${id}-calc [data-k="cv"]`), cfg.calc.ans(c));
      await dSet(q(`#${id}-card [data-k="c"]`), cfg.cause(c)); await dSet(q(`#${id}-card [data-k="r"]`), cfg.fix(c));
      await dClick(q('[data-a="chk"]')); await sleep(600 / DSPEED);
    }
  });
}
/* small instrument faces for the case tabs */
const lcdBox = (title, lines, col) => `<svg viewBox="0 0 320 ${44 + lines.length * 26}" role="img" aria-label="${esc(title)}"><rect x="2" y="2" width="316" height="${40 + lines.length * 26}" rx="12" fill="${col || '#3c4449'}" stroke="#1d2124" stroke-width="2"/><text x="160" y="22" text-anchor="middle" font-size="11" font-weight="700" fill="#f6cf45">${esc(title)}</text><rect x="14" y="30" width="292" height="${lines.length * 26 + 4}" rx="4" fill="#c7d3b4"/>${lines.map((l, i) => `<text x="22" y="${51 + i * 26}" font-size="16" font-weight="700" class="lcdt">${esc(l)}</text>`).join('')}</svg>`;
function specSvg(peaks, lab){
  const W = 320, H = 150; let h = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(lab)}"><rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#071009"/><line x1="30" y1="120" x2="${W - 10}" y2="120" stroke="#2f5a48"/><line x1="30" y1="12" x2="30" y2="120" stroke="#2f5a48"/>`;
  for (let i = 0; i < 120; i++){ const x = 30 + i * (W - 40) / 120; h += `<line x1="${f1(x)}" y1="120" x2="${f1(x)}" y2="${f1(120 - 3 - Math.random() * 5)}" stroke="#7dff9a" opacity=".5"/>`; }
  peaks.forEach(p => { const x = 30 + p[0] * (W - 40), y = 120 - p[1] * 100; h += `<line x1="${f1(x)}" y1="120" x2="${f1(x)}" y2="${f1(y)}" stroke="#ffd23f" stroke-width="3"/><text x="${f1(x)}" y="${f1(y - 4)}" text-anchor="middle" font-size="10" fill="#e9eef1">${esc(p[2])}</text>`; });
  return h + `<text x="${W - 12}" y="138" text-anchor="end" font-size="10" fill="#cfd6da">${esc(lab)}</text></svg>`;
}
function soundBuf(kind){
  const r = 22050, n = Math.floor(r * 1.6), d = new Float32Array(n), f1x = 25, bp = 89.5;
  let ring2 = 0, ph = 0;
  for (let i = 0; i < n; i++){
    const t = i / r;
    let v = 0.12 * Math.sin(PI2 * 200 * t) + 0.05 * Math.sin(PI2 * 400 * t) + 0.04 * (Math.random() * 2 - 1);
    if (kind === 'brg'){ if (frac(t * bp) < 1 / r * bp * 1.0001 && Math.random() < 0.9) ring2 = 0.6 + Math.random() * 0.3; ring2 *= 0.9965; ph += PI2 * 3100 / r; v += ring2 * Math.sin(ph) + 0.08 * (Math.random() * 2 - 1); }
    if (kind === 'mis') v *= 1 + 0.6 * Math.sin(PI2 * f1x * t) + 0.3 * Math.sin(PI2 * 2 * f1x * t);
    if (kind === 'screw'){ v += 0.05 * (Math.random() * 2 - 1) * (1 + Math.sin(PI2 * 12 * t)); }
    d[i] = v * 0.7;
  }
  return {d, r};
}
function flangeSvg(oil){
  return `<svg viewBox="0 0 320 170" role="img" aria-label="الشفة وموصّل القدرة"><rect x="0" y="0" width="320" height="170" rx="10" fill="var(--bg)"/>
  <rect x="40" y="40" width="160" height="100" rx="8" fill="#2b2f33"/><rect x="22" y="30" width="24" height="120" rx="4" fill="#8d969b"/><rect x="0" y="80" width="26" height="20" fill="#b9c1c7"/>
  <circle cx="34" cy="90" r="14" fill="#555" stroke="#333"/><circle cx="34" cy="90" r="9" fill="#222"/>
  <rect x="210" y="40" width="60" height="50" rx="6" fill="#9aa1a6" stroke="#5b656b"/><circle cx="240" cy="65" r="18" fill="#22282c"/>${[0, 1, 2, 3].map(i => `<circle cx="${f1(240 + 9 * Math.cos(i * 1.57))}" cy="${f1(65 + 9 * Math.sin(i * 1.57))}" r="3" fill="#d9b25a"/>`).join('')}
  ${oil ? '<ellipse cx="36" cy="128" rx="18" ry="8" fill="#b88a1a" opacity=".75"/><path d="M28 104 Q30 116 26 128" stroke="#b88a1a" stroke-width="5" fill="none" opacity=".8"/><ellipse cx="240" cy="72" rx="10" ry="6" fill="#b88a1a" opacity=".8"/><circle cx="232" cy="60" r="3" fill="#b88a1a"/><text x="160" y="164" text-anchor="middle" font-size="11" font-weight="700" fill="var(--bad)">oil on flange + inside connector</text>' : '<text x="160" y="164" text-anchor="middle" font-size="11" font-weight="700" fill="var(--good)">dry · clean</text>'}</svg>`;
}
function emfSvg(ratio){
  let h = '<svg viewBox="0 0 320 120" role="img" aria-label="Back-EMF"><rect x="0" y="0" width="320" height="120" rx="8" fill="#071009"/><line x1="0" y1="60" x2="320" y2="60" stroke="#2f5a48"/>';
  [0, 1, 2].forEach(k => { let p = ''; for (let i = 0; i <= 160; i++){ const x = i * 2, y = 60 - 46 * ratio * Math.sin(i / 160 * PI2 * 2 - k * PI2 / 3); p += (i ? 'L' : 'M') + x + ' ' + f1(y); } h += `<path d="${p}" fill="none" stroke="${TRC[k]}" stroke-width="1.6"/>`; });
  return h + '<line x1="0" y1="14" x2="320" y2="14" stroke="#ff9f1c" stroke-dasharray="4 4"/><text x="316" y="11" text-anchor="end" font-size="9" fill="#ff9f1c">nominal peak</text></svg>';
}

/* =====================================================================
   TAB 7 · bearing (l8)
   ===================================================================== */
const BRG_C = [['brg', 'تلف محمل: تقشّر في المجرى الخارجي'], ['seal', 'تسرّب زيت علبة التروس عبر سدادة العمود'], ['demag', 'فقد في مغنطة الدوّار'], ['mis', 'عدم محاذاة الوصلة مع عمود الكرات'], ['none', 'المحرك سليم؛ الصوت من محمل دعم عمود الكرات']];
const BRG_F = [['brgx', 'استبدال المحامل في مركز خدمة ثم ضبط الإزاحة'], ['sealx', 'استبدال السدادة وتنظيف الموصّل وتجفيف المحرك وإصلاح مصدر الزيت'], ['rotor', 'استبدال الدوّار أو المحرك وفحص سبب الحرارة أو التيار الزائد'], ['alignx', 'إعادة محاذاة الوصلة وفحص مسامير التثبيت'], ['screw', 'فحص محمل دعم عمود الكرات وترك المحرك في الخدمة'], ['grease', 'إضافة شحم إلى محمل المحرك']];
const BRG_SYM = {brg:'صوت خشن مستمر من المحور X يزداد مع السرعة، وحرارة الغطاء الخلفي أعلى من المعتاد.', seal:'إنذار عزل منخفض متقطّع في المحور Z بعد تنظيف الماكينة، والمحرك مركّب على علبة تروس بالزيت.', demag:'المحور يسخن ويعطي AL.oL عند الأحمال التي كان يتحمّلها، وحدث تصادم بتيار عالٍ الشهر الماضي.', mis:'اهتزاز وطنين في المحور X بعد استبدال الوصلة، والصوت يتبع سرعة الدوران.', none:'طقطقة من جهة المحور X عند الحركة البطيئة، والمحرك جديد نسبيًا.'};
function genBRG(){
  const kinds = shuffle(['brg', 'seal', 'demag', pick(['mis', 'none'])]);
  return kinds.map(k => {
    const ax = k === 'seal' ? 'Z' : k === 'demag' ? pick(['A', 'Y']) : 'X';
    return {kind:k, ax, used:{}, live:true, c:'', r:'', ok:false, enc:false, ratio:k === 'demag' ? rnd(0.85, 0.89) : rnd(0.985, 1.01), v:k === 'mis' ? rnd(5.2, 7.4) : k === 'brg' ? rnd(2.6, 3.4) : rnd(0.7, 1.3), gE:k === 'brg' ? rnd(3.5, 6) : k === 'mis' ? rnd(0.6, 0.9) : rnd(0.2, 0.5), ir:k === 'seal' ? rnd(2.5, 8) : rnd(400, 1500), rpm:rint(980, 1040)};
  });
}
BUILD.bearing = host => CaseTab(host, 'bearing', {
  key:'brg', gen:genBRG, causes:BRG_C, fixes:BRG_F,
  typ:'سرعة الاهتزاز للمحرك الصغير حتى نحو 1.8 mm/s جيدة وفوق 4.5 mm/s سيئة، وغلاف تسارع المحمل gE فوق نحو 2 يدل على تلف، والعزل أقل من 10 MΩ مرفوض، و Ke أقل من 95 % فقد مغنطة',
  title:c => `المحور ${c.ax}`, sym:c => BRG_SYM[c.kind],
  tools:{
    vib:{n:'قلم الاهتزاز وطيف السرعة', live:true, show:c => lcdBox('VIBRATION PEN · ISO 10816', [`v RMS ${f1(c.v)} mm/s`, `env. gE ${f1(c.gE)}`]) + specSvg(c.kind === 'brg' ? [[0.08, 0.2, '1×'], [0.29, 0.55, 'BPFO'], [0.58, 0.4, '2·BPFO'], [0.87, 0.25, '3·BPFO']] : c.kind === 'mis' ? [[0.08, 0.85, '1×'], [0.16, 0.6, '2×'], [0.24, 0.2, '3×']] : [[0.08, 0.15, '1×'], [0.32, 0.08, '']], 'envelope spectrum'), log:c => `${f1(c.v)} mm/s · gE ${f1(c.gE)}`},
    snd:{n:'سمّاعة ميكانيكية على الغطاء', live:true, show:c => { playBuf(soundBuf(c.kind === 'brg' ? 'brg' : c.kind === 'mis' ? 'mis' : c.kind === 'none' ? 'screw' : 'ok').d, 22050); return `<p class="rline">${ar(c.kind === 'brg' ? 'صوت خشن ونقرات منتظمة سريعة فوق طنين التبديل.' : c.kind === 'mis' ? 'طنين يتموّج مع كل لفة، بلا نقرات.' : c.kind === 'none' ? 'المحرك هادئ؛ الطقطقة أوضح عند دعامة عمود الكرات.' : 'صوت ناعم: طنين التبديل الكهربي فقط.')}</p>`; }, log:c => c.kind === 'brg' ? 'خشن' : c.kind === 'mis' ? 'متموّج' : 'هادئ'},
    hand:{n:'تدوير العمود باليد بعد فك الوصلة', live:false, show:c => `<p class="rline">${ar(c.kind === 'brg' ? 'خشونة ونقر محسوس في كل لفة.' : 'دوران ناعم مع تكتّل مغناطيسي منتظم (cogging) وهذا طبيعي.')}</p>`, log:c => c.kind === 'brg' ? 'خشن' : 'ناعم'},
    look:{n:'فحص بصري للشفة والموصّل', live:false, show:c => flangeSvg(c.kind === 'seal'), log:c => c.kind === 'seal' ? 'زيت' : 'نظيف'},
    ir:{n:'العزل 500 V', live:false, pre:c => c.enc ? true : 'افصل موصّلي الإنكودر والفرامل أولًا؛ جهد الاختبار يتلف الإنكودر.', show:c => lcdBox('INSULATION 500 V · U/V/W → PE', [`IR ${c.ir >= 100 ? f0(c.ir) : f1(c.ir)} MΩ`]), log:c => `${c.ir >= 100 ? f0(c.ir) : f1(c.ir)} MΩ`},
    bemf:{n:'Back-EMF بالمثقاب (المحرك مفصول)', live:false, show:c => { const M = AX[c.ax], V = M.Ke * c.ratio * c.rpm / 1000; return emfSvg(c.ratio) + `<p class="rline">${ar('المتوسط بين الأطوار:')} <b>${f1(V)} Vrms</b> ${ar('عند')} <b>${c.rpm} r/min</b> · ${ar('Ke الاسمي')} <b>${M.Ke} V/1000 r/min</b></p>`; }, log:c => `${f1(AX[c.ax].Ke * c.ratio * c.rpm / 1000)} V @ ${c.rpm} r/min`},
    cur:{n:'تيار الدرايف عند 60 % من العزم', live:true, show:c => { const M = AX[c.ax], I = 0.6 * M.I / c.ratio; return lcdBox('DRIVE MONITOR · axis ' + c.ax, [`T 60 %   I ${f2(I)} A rms`, `expected ≈ ${f2(0.6 * M.I)} A`]); }, log:c => `${f2(0.6 * AX[c.ax].I / c.ratio)} A`}
  },
  extraBtn:c => `<button type="button" class="btn${c.enc ? ' ok' : ''}" data-a="enc">${ar(c.enc ? 'الإنكودر والفرامل مفصولان ✓' : 'افصل موصّلي الإنكودر والفرامل')}</button>`,
  onAct(a, c, render){ if (a === 'enc'){ c.enc = !c.enc; save(); render(); } },
  demoPre:async (c, k, q) => { if (k === 'ir' && !c.enc) await dClick(q('[data-a="enc"]')); },
  reset:() => ({enc:false}),
  need:c => ({brg:['vib', 'hand', 'snd'], seal:['look', 'ir'], demag:['bemf'], mis:['vib'], none:['hand', 'vib']})[c.kind],
  calc:{show:c => c.kind === 'demag' && c.used.bemf, label:() => 'Ke المقيس ÷ Ke الاسمي', unit:'%', ans:c => f1(c.ratio * 100),
    check:(c, v) => nearA(v, c.ratio * 100, 1.5) ? true : 'Ke = V × 1000 ÷ n، ثم اقسمه على Ke الاسمي واضرب في 100.',
    fx:c => { const M = AX[c.ax], V = M.Ke * c.ratio * c.rpm / 1000; return `<div class="fx">Ke = ${f1(V)} × 1000 / ${c.rpm} = <b>${f1(V * 1000 / c.rpm)}</b> → ${f1(c.ratio * 100)} % of ${M.Ke} <span class="bad">&lt; 95 %</span> ; I = 0.6·In / ${f2(c.ratio)} = <b>${f2(0.6 * M.I / c.ratio)} A</b></div>`; }},
  cause:c => c.kind,
  fix:c => ({brg:'brgx', seal:'sealx', demag:'rotor', mis:'alignx', none:'screw'})[c.kind],
  noC:(c, v) => ({brg:'نقرات منتظمة وغلاف gE مرتفع وخشونة باليد: هذا تلف في مجرى المحمل.', seal:'الاهتزاز طبيعي، لكن على الشفة والموصّل زيت والعزل منخفض: السدادة تسرّب.', demag:'الميكانيكا سليمة، لكن Ke منخفض والتيار أعلى عند العزم نفسه: فقد مغنطة.', mis:'الاهتزاز عند 1× و 2× دون نقرات المحمل: عدم محاذاة.', none:'المحرك هادئ وناعم بعد فك الوصلة، والصوت من جهة عمود الكرات.'})[c.kind],
  noR:(c, v) => v === 'grease' ? 'محامل محرك السيرفو مغلقة ومشحّمة مدى الحياة؛ لا تُشحَّم.' : 'هذا الإصلاح لا يعالج السبب الذي وجدته.',
  why:c => ({brg:'تلف المجرى الخارجي يظهر في طيف الغلاف عند BPFO؛ تُستبدل المحامل في مركز خدمة ثم تُضبط الإزاحة لأن الإنكودر يُفك.', seal:'زيت علبة التروس تسرّب عبر السدادة إلى الملفات والموصّل فانخفض العزل.', demag:'Ke أقل من 95 % يعني عزمًا أقل لكل أمبير، فيرتفع التيار ويسخن المحرك.', mis:'عدم المحاذاة يحمّل المحامل قطريًا ويرفع الاهتزاز عند 1× و 2×.', none:'لا تستبدل محركًا سليمًا: افصله وافحصه وحده قبل الحكم.'})[c.kind],
  winMsg:'أحسنت: شخّصت المحامل والسدادة والمغنطة بالقياس الصحيح في الحالة الآمنة الصحيحة.'
});

/* =====================================================================
   TAB 8 · cable (l9)
   ===================================================================== */
const CB_C = [['shield', 'الحجب مقطوع داخل كابل الإنكودر'], ['bond', 'الحجب موصول بسلك pigtail لا بمشبك 360°'], ['route', 'كابل الإنكودر بجوار كابل القدرة في المجرى نفسه'], ['pair', 'زوج /B تالف من الانثناء في السلسلة الحاملة'], ['enc', 'الإنكودر نفسه تالف']];
const CB_F = [['repl', 'استبدال كابل الإنكودر بكابل مخصّص للسلاسل الحاملة'], ['clamp', 'إنهاء الحجب بمشبك 360° على الطرفين'], ['sep', 'فصل المسار مسافة ≥ 20 cm أو مجرى منفصل والتقاطع بزاوية 90°'], ['ferrite', 'إضافة حلقة فريت فقط'], ['lift', 'فصل الحجب من طرف واحد'], ['encx', 'استبدال الإنكودر']];
const CB_SYM = {shield:'إنذار AL.EnC عشوائي في المحور Y عند تشغيل المغزل، بعد إصلاح سابق للكابل.', bond:'خطأ تتبّع AL.PoS في المحور X يزداد عند التسارع، بعد استبدال لوحة الدرايف.', route:'إنذار AL.EnC في المحور Z منذ إضافة كابل محرك جديد إلى المجرى.', pair:'إنذار AL.EnC متقطّع في المحور Y عند أطراف الشوط فقط.'};
function genCB(){ const ax = {shield:'Y', bond:'X', route:'Z', pair:'Y'}; return shuffle(['shield', 'bond', 'route', 'pair']).map(k => ({kind:k, ax:ax[k], used:{}, live:true, c:'', r:'', ok:false, rs:rnd(0.18, 0.4)})); }
function noiseSvg(kind, moved){
  const W = 320, H = 140; let up = '', dn = '';
  for (let i = 0; i <= 320; i++){ const t = i / 320 * 200e-6, base = sq(12500 * t) ? 3.5 : 0.3;
    let a = base, b = base;
    if ((kind !== 'pair') && !(kind === 'route' && moved)){ const r = ring(t, kind === 'route' ? 2.2 : 1.8); a += r; b += r * 0.6 - Math.abs(r) * 0.4; if (frac(t / PWM_E) * PWM_E < 2e-6){ a = base + 2; b = base - 1.6; } }
    if (kind === 'pair' && t > 95e-6 && t < 140e-6){ a = b = 2.4 + nz(0.08); }
    const y = v => 112 - v * 22; up += (i ? 'L' : 'M') + i + ' ' + f1(y(Math.max(a, b))); dn = 'L' + i + ' ' + f1(y(Math.min(a, b))) + dn; }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="إشارة الإنكودر عند الدرايف"><rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#071009"/><path d="${up}${dn}Z" fill="${kind === 'pair' ? TRC[1] : TRC[0]}" stroke="${kind === 'pair' ? TRC[1] : TRC[0]}" stroke-width="1.2"/><text x="8" y="16" font-size="10" fill="#e9eef1">${kind === 'pair' ? 'CH2 /B · drag chain flexing' : 'CH1 A+ · axis moving · 20 µs/div'}</text></svg>`;
}
function clampSvg(pig){
  return `<svg viewBox="0 0 320 150" role="img" aria-label="إنهاء الحجب عند الدرايف"><rect x="0" y="0" width="320" height="150" rx="10" fill="var(--bg)"/><rect x="10" y="100" width="300" height="14" fill="#b9c1c7" stroke="#6b7378"/><text x="16" y="132" font-size="10" class="txm">EMC plate (bare metal)</text>
  <rect x="200" y="20" width="100" height="60" rx="6" fill="#2b2f33"/><text x="250" y="54" text-anchor="middle" font-size="10" fill="#e9eef1">DRIVE X11</text>
  <path d="M0 70 L120 70" stroke="#22282c" stroke-width="14"/>
  ${pig ? '<path d="M120 70 L196 50" stroke="#22282c" stroke-width="8"/><path d="M120 76 C140 100 160 96 170 104" stroke="#b5b5a8" stroke-width="3" fill="none"/><circle cx="172" cy="104" r="4" fill="#666"/><text x="150" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="var(--bad)">pigtail 10 cm</text>' : '<path d="M120 70 L196 50" stroke="#22282c" stroke-width="8"/><rect x="92" y="60" width="26" height="40" rx="3" fill="#c9a24a" stroke="#6d5420"/><path d="M80 64 L92 64 M80 76 L92 76" stroke="#d9d9cf" stroke-width="2"/><text x="105" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="var(--good)">360° clamp on braid</text>'}</svg>`;
}
function ductSvg(near){
  return `<svg viewBox="0 0 320 130" role="img" aria-label="المجرى"><rect x="0" y="0" width="320" height="130" rx="10" fill="var(--bg)"/><rect x="10" y="30" width="300" height="70" rx="4" fill="#9aa1a6" stroke="#6b7378"/>
  ${near ? '<path d="M10 62 L310 62" stroke="#e66b1e" stroke-width="12"/><path d="M10 76 L310 76" stroke="#2f7d4f" stroke-width="8"/>' + [60, 140, 220, 290].map(x => `<rect x="${x}" y="56" width="5" height="28" fill="#111"/>`).join('') + '<text x="160" y="120" text-anchor="middle" font-size="11" font-weight="700" fill="var(--bad)">power + encoder tied together · 4 m</text>' : '<path d="M10 48 L310 48" stroke="#e66b1e" stroke-width="12"/><line x1="10" y1="65" x2="310" y2="65" stroke="#555" stroke-width="3"/><path d="M10 86 L310 86" stroke="#2f7d4f" stroke-width="8"/><text x="160" y="120" text-anchor="middle" font-size="11" font-weight="700" fill="var(--good)">separated by metal divider</text>'}
  <text x="16" y="22" font-size="10" class="txm">power (orange) · encoder (green)</text></svg>`;
}
function routeSvg(){
  return `<svg viewBox="0 0 640 150" role="img" aria-label="مسار كابلي القدرة والإنكودر من الدرايف إلى المحرك"><rect x="0" y="0" width="640" height="150" rx="10" fill="var(--bg)"/>
  <rect x="10" y="20" width="90" height="110" rx="6" fill="#2b2f33"/><text x="55" y="76" text-anchor="middle" font-size="11" font-weight="700" fill="#e9eef1">DRIVE</text><rect x="10" y="118" width="90" height="10" fill="#b9c1c7"/>
  <rect x="120" y="50" width="200" height="40" rx="4" fill="#9aa1a6" stroke="#6b7378"/><text x="220" y="44" text-anchor="middle" font-size="10" class="txm">cable duct</text>
  <path d="M100 64 L340 64 C380 64 380 100 420 100 L520 100" stroke="#e66b1e" stroke-width="7" fill="none"/><path d="M100 78 L340 78 C376 78 376 112 420 112 L520 112" stroke="#2f7d4f" stroke-width="5" fill="none"/>
  ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${352 + i * 22}" y="${92 - Math.sin(i / 5 * Math.PI) * 18}" width="18" height="30" rx="3" fill="none" stroke="#5b656b" stroke-width="2"/>`).join('')}<text x="410" y="140" text-anchor="middle" font-size="10" class="txm">drag chain</text>
  <rect x="520" y="70" width="110" height="60" rx="8" fill="#22282c"/><text x="575" y="104" text-anchor="middle" font-size="11" font-weight="700" fill="#e9eef1">SERVO MOTOR</text></svg>`;
}
BUILD.cable = host => CaseTab(host, 'cable', {
  key:'cb', gen:genCB, causes:CB_C, fixes:CB_F, intro:routeSvg,
  typ:'مقاومة الحجب من طرف إلى طرف أقل من 1 Ω، وفصل كابل الإنكودر عن كابل القدرة 20 cm على الأقل أو بفاصل معدني، والحجب مؤرّض 360° على الطرفين وفق IEC 61800-3',
  title:c => `المحور ${c.ax}`, sym:c => CB_SYM[c.kind],
  tools:{
    scope:{n:'الأوسيلوسكوب على زوج A عند الدرايف والمحور يتحرك', live:true, show:c => noiseSvg(c.kind, false), log:c => c.kind === 'pair' ? 'انقطاع متقطّع في /B' : 'رنين عند حواف PWM'},
    move:{n:'أبعد كابل الإنكودر مؤقتًا 30 cm وأعد القياس', live:true, show:c => noiseSvg(c.kind, true) + `<p class="rline">${ar(c.kind === 'route' ? 'اختفى الرنين بعد إبعاد الكابل.' : 'لا تغيّر يُذكر.')}</p>`, log:c => c.kind === 'route' ? 'اختفى التشويش' : 'لا تغيّر'},
    shield:{n:'أوميتر: الحجب من غلاف موصّل الدرايف إلى غلاف موصّل المحرك', live:false, show:c => lcdBox('DMM Ω · shield end-to-end', [c.kind === 'shield' ? 'OL' : f2(c.rs) + ' Ω']), log:c => c.kind === 'shield' ? 'OL' : f2(c.rs) + ' Ω'},
    pairs:{n:'أوميتر: كل موصّل طرفًا لطرف مع ثني السلسلة', live:false, show:c => lcdBox('DMM Ω · conductors, chain flexing', c.kind === 'pair' ? ['A+ A− B+ Z± : 0.6 Ω', '/B : 0.7 Ω ↔ OL (flex)'] : ['all conductors 0.5–0.7 Ω', 'stable while flexing']), log:c => c.kind === 'pair' ? '/B متقطّع' : 'ثابت'},
    clamp:{n:'افحص إنهاء الحجب عند الدرايف', live:false, show:c => clampSvg(c.kind === 'bond'), log:c => c.kind === 'bond' ? 'pigtail' : '360°'},
    duct:{n:'افحص مسار الكابلات في المجرى', show:c => ductSvg(c.kind === 'route'), log:c => c.kind === 'route' ? 'متلاصقان' : 'مفصولان'}
  },
  need:c => ({shield:['shield'], bond:['clamp'], route:['move', 'duct'], pair:['pairs']})[c.kind],
  cause:c => c.kind, fix:c => ({shield:'repl', bond:'clamp', route:'sep', pair:'repl'})[c.kind],
  noC:(c, v) => v === 'enc' ? 'الإنكودر سليم؛ القياس يدل على عيب في الكابل أو تركيبه.' : ({shield:'الحجب يقرأ OL من طرف إلى طرف: الحجب نفسه مقطوع.', bond:'الحجب متصل، لكنه منتهٍ بسلك pigtail طويل بدل مشبك 360°.', route:'الكابل والحجب سليمان، والتشويش اختفى عند إبعاد الكابل: المشكلة في المسار.', pair:'الحجب سليم والتشويش غير موجود، لكن /B ينقطع مع ثني السلسلة.'})[c.kind],
  noR:(c, v) => ({ferrite:'حلقة الفريت تخفّف العَرَض ولا تعالج السبب.', lift:'فصل الحجب من طرف واحد يضعف الحجب في الترددات العالية؛ الحجب يُؤرَّض 360° على الطرفين.', encx:'الإنكودر سليم؛ العطل في الكابل أو تركيبه.'})[v] || 'هذا الإصلاح لا يعالج السبب الذي وجدته.',
  why:c => ({shield:'الحجب المقطوع لا يحمي الأزواج من تيارات الإزاحة السريعة لـ PWM؛ يُستبدل الكابل كله.', bond:'سلك pigtail طوله 10 cm له محاثة كبيرة عند الترددات العالية؛ المشبك 360° يجعل الحجب امتدادًا لصندوق الدرايف.', route:'التقارب الطويل مع كابل القدرة يقرن dv/dt إلى الإشارة؛ افصل المسار أو استخدم فاصلًا معدنيًا وتقاطعًا بزاوية 90°.', pair:'الكابل غير المخصّص للسلاسل الحاملة تنكسر موصّلاته بالانثناء؛ استبدله بكابل مخصّص.'})[c.kind],
  winMsg:'أحسنت: تتبّعت أعطال الحجب والتأريض والمسار والزوج التالف بالقياس، واخترت الإصلاح الصحيح لكل منها.'
});

/* =====================================================================
   start
   ===================================================================== */
TABS.forEach(tb => { if (IL.has(tb.l, 'sim')) G[tb.id].won = false; });
save();
const first = location.hash.slice(1);
show(G[first] ? first : TABS[0].id);
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (G[h]) show(h); });
window.BSIM = {S:() => S, AX, ENC, encSig, speed(x){ DSPEED = x; }};
})();
