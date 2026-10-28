/* محطة صيانة درايف السيرفو – LearnElectricals (MSA UI)
   The four servo drives of the course CNC (400 V 3-phase, DC bus ≈ 540 V, 2 × 470 µF / 450 V in series = 235 µF,
   regen 100 Ω 400 W, chopper ≈ 760 V, OV ≈ 800 V, UV ≈ 380 V). Four tabs (l10…l13):
   parts: safe discharge + diode test + caps / regen / fan → find the failed part;
   alarms: 7-segment alarms worked through with measurements → root cause + repair;
   tuning: inertia ratio, PI velocity loop + position loop on a two-mass model, resonance and notch;
   cnc: a complete axis-repair scenario from the alarm to verified production.
   «▶ شاهد الحل» plays the solution on the real controls and never marks the tab.
   State in localStorage 'srvm-drive-v1'. All limits are typical values for learning («قيم نموذجية للتعلّم»). */
(function(){
'use strict';
const $ = IL.$, $$ = IL.$$, esc = IL.esc, fmt = IL.fmt;
IL.hubTheme();
const NARROW = () => window.innerWidth < 620;
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* Arabic sentence with Latin symbols / numbers: every Latin run is isolated as LTR */
const LTR_RUN = /[A-Za-z0-9√(+\-−±][A-Za-z0-9Ωµ°√±≤≥<>=×·()+\-−–.,%/²³_ →↔'^~⁻⁴]*[A-Za-z0-9Ωµ°%)²³]|[A-Za-z0-9]/g;
const ar = s => { s = String(s); let out = '', last = 0; s.replace(LTR_RUN, (m, off) => { out += esc(s.slice(last, off)) + '<bdi dir="ltr">' + esc(m) + '</bdi>'; last = off + m.length; return m; }); return out + esc(s.slice(last)); };
const L = s => `<bdi class="ltr mono">${s}</bdi>`;
const clone = o => JSON.parse(JSON.stringify(o));
const f0 = v => fmt(v, 0), f1 = v => fmt(v, 1), f2 = v => fmt(v, 2), f3 = v => fmt(v, 3);
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = IL.shuffle;
const jit = (v, p) => v * (1 + (Math.random() * 2 - 1) * p);
const sig3 = v => v >= 100 ? f0(v) : v >= 10 ? f1(v) : v >= 1 ? f2(v) : f3(v);
const num = v => IL.num(v);
const near = (v, t, tol) => isFinite(v) && Math.abs(v - t) <= Math.abs(t) * tol;
const nearA = (v, t, tol) => isFinite(v) && Math.abs(v - t) <= tol;
const SQ3 = Math.sqrt(3);

/* ---------------- state ---------------- */
const KEY = 'srvm-drive-v1';
let S = (() => { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && typeof s === 'object' ? s : {}; } catch (e){ return {}; } })();
let DEMO = 0;
function save(){ if (DEMO) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e){} }

/* =====================================================================
   tabs, goals, demo (same pattern as maint-lab/motor.js)
   ===================================================================== */

/* =====================================================================
   canonical data (project-data.md)
   ===================================================================== */
const DRV = {Vin:400, V0:540, Vpk:565, Cu:470, Cbus:235, Rbl:300, Rreg:100, Preg:400, Vch:760, Vov:800, Vuv:380, Rtool:2};
DRV.tau = DRV.Rbl * 1e3 * DRV.Cbus * 1e-6;               // 70.5 s
const AX = {
  X:{n:'X', P:1.5, rpm:3000, T:4.77, Tp:14.3, I:4.0, Kt:1.19, Ke:72, R:2.8, L:12, enc:'23-bit serial', encAr:'مطلق تسلسلي 23-bit مع بطارية 3.6 V', brake:false},
  Y:{n:'Y', P:1.5, rpm:3000, T:4.77, Tp:14.3, I:4.0, Kt:1.19, Ke:72, R:2.8, L:12, enc:'2500 ppr TTL', encAr:'تزايدي 2500 ppr TTL مع Hall', brake:false},
  Z:{n:'Z', P:2.0, rpm:2000, T:9.55, Tp:28.6, I:6.0, Kt:1.59, Ke:96, R:1.2, L:7, enc:'EnDat 2.2', encAr:'مطلق EnDat 2.2 / BiSS-C', brake:true},
  A:{n:'A', P:0.75, rpm:3000, T:2.39, Tp:7.2, I:2.6, Kt:0.92, Ke:56, R:6.2, L:24, enc:'resolver', encAr:'ريزولفر 7 V rms 10 kHz', brake:false}
};
const TABS = [
  {id:'parts', t:'مكوّنات الدرايف', l:'l10', h:'فتح الدرايف بأمان واختبار مكوّناته', goal:'افصل وأقفل، ثم قِس الناقل المستمر P–N حتى يصبح دون 50 V، واختبر بوضع الديود ديودات المقوّم الستة وديودات IGBT الستة، وافحص المكثفين C و ESR، ومقاومة الكبح والمروحة، ثم حدّد الجزء المعطوب.'},
  {id:'alarms', t:'الإنذارات', l:'l11', h:'تشخيص إنذارات الدرايف بالقياس', goal:'حلّ أربعة إنذارات على شاشة الدرايف: قِس بالأداة المناسبة في الحالة الآمنة المناسبة، ثم اختر السبب الجذري والإصلاح الصحيح.'},
  {id:'tuning', t:'الضبط Tuning', l:'l12', h:'ضبط المحور بعد الإصلاح: القصور الذاتي والكسب و Notch', goal:'قدّر نسبة القصور الذاتي من اختبار التسارع، وارفع كسب حلقة السرعة إلى 200 Hz على الأقل مع تجاوز ≤ 25 %، وأزل الرنين بمرشّح Notch عند تردده، واضبط كسب الموضع ليكون خطأ التتبّع ≤ 1.2 mm عند 10 m/min مع تجاوز موضع ≤ 5 %.'},
  {id:'cnc', t:'مشروع CNC', l:'l13', h:'إصلاح محور ماكينة CNC من الإنذار حتى الإنتاج', goal:'اقرأ الإنذار وحدّد المحور، واجعل الماكينة آمنة، وشخّص بالقياس، واختر السبب والإصلاح ونفّذ خطواته بالترتيب، ثم أعد التشغيل وتحقّق حتى تخرج قطعة سليمة.'}
];

/* ---------------- 7-segment display ---------------- */
const SEG7 = {'0':'abcdef','1':'bc','2':'abdeg','3':'abcdg','4':'bcfg','5':'acdfg','6':'acdefg','7':'abc','8':'abcdefg','9':'abcdfg',
  'A':'abcefg','b':'cdefg','C':'adef','c':'deg','d':'bcdeg','E':'adefg','F':'aefg','H':'bcefg','h':'cefg','L':'def','n':'ceg','o':'cdeg','P':'abefg','r':'eg','S':'acdfg','t':'defg','U':'bcdef','u':'cde','v':'cde','y':'bcdfg','Y':'bcdfg','B':'cdefg','k':'acefg','-':'g',' ':''};
function seg7(txt, x, y, h, n, on){
  const gl = []; String(txt).split('').forEach(c => { if (c === '.' && gl.length) gl[gl.length - 1].dp = true; else gl.push({c, dp:false}); });
  while (gl.length < n) gl.unshift({c:' ', dp:false});
  const w = h * 0.55, t = h * 0.12, gap = h * 0.22, sk = 0.1;
  let s = `<g transform="translate(${x} ${y}) skewX(${-sk * 57.3})">`;
  gl.slice(-n).forEach((g, i) => {
    const ox = i * (w + gap), lit = SEG7[g.c] == null ? '' : SEG7[g.c];
    const H = (x0, y0) => `M${f1(ox + x0 + t / 2)} ${f1(y0)} l${f1(t / 2)} ${f1(-t / 2)} h${f1(w - 2 * t)} l${f1(t / 2)} ${f1(t / 2)} l${f1(-t / 2)} ${f1(t / 2)} h${f1(-(w - 2 * t))}z`;
    const V = (x0, y0) => `M${f1(ox + x0)} ${f1(y0 + t / 2)} l${f1(t / 2)} ${f1(-t / 2)} l${f1(t / 2)} ${f1(t / 2)} v${f1(h / 2 - 2 * t)} l${f1(-t / 2)} ${f1(t / 2)} l${f1(-t / 2)} ${f1(-t / 2)}z`;
    const P = {a:H(0, 0), g:H(0, h / 2), d:H(0, h), f:V(0, 0), b:V(w - t, 0), e:V(0, h / 2), c:V(w - t, h / 2)};
    Object.keys(P).forEach(k => { s += `<path d="${P[k]}" fill="${lit.includes(k) ? on : '#2a1110'}"/>`; });
    s += `<circle cx="${f1(ox + w + gap * 0.45)}" cy="${f1(h)}" r="${f1(t * 0.6)}" fill="${g.dp ? on : '#2a1110'}"/>`;
  });
  return s + '</g>';
}
/* digital multimeter (CAT III), 220 × 300, origin top-left */
function dmmSvg(ox, oy, k){
  const md = (k, x, lab) => `<g class="hit" data-mode="${k}" tabindex="0" role="button" aria-label="${k}"><rect class="ring" x="${x - 30}" y="146" width="60" height="34" rx="9"/><rect x="${x - 27}" y="149" width="54" height="28" rx="7" fill="#e9ecee" stroke="#6b7378" stroke-width="1.5" class="mdb"/><text x="${x}" y="168" text-anchor="middle" font-size="13" font-weight="700" fill="#1d2124">${lab}</text></g>`;
  return `<g transform="translate(${ox} ${oy}) scale(${k || 1})"><rect x="0" y="0" width="220" height="300" rx="20" fill="var(--case)" stroke="var(--case-d)" stroke-width="3"/>
  <rect x="10" y="10" width="200" height="280" rx="14" fill="#2e3439"/>
  <text x="110" y="28" text-anchor="middle" font-size="8.6" font-weight="700" fill="#f6cf45" textLength="186" lengthAdjust="spacingAndGlyphs">DIGITAL MULTIMETER · CAT III 1000 V</text>
  <rect x="20" y="36" width="180" height="96" rx="6" fill="#1d2124"/><rect x="24" y="40" width="172" height="88" rx="4" fill="#c7d3b4"/>
  <text id="dm-mode" x="32" y="56" font-size="11" class="lcdt">DC V</text><text id="dm-hold" x="188" y="56" text-anchor="end" font-size="10" class="lcdt"></text>
  <text id="dm-big" x="188" y="98" text-anchor="end" font-size="32" font-weight="700" class="lcdt">----</text>
  <text id="dm-unit" x="188" y="120" text-anchor="end" font-size="12" class="lcdt">V</text>
  <text id="dm-sub" x="32" y="120" font-size="10" class="lcdt"></text>
  ${md('V', 50, 'V⎓')}${md('R', 110, 'Ω')}${md('D', 170, '▶|')}
  <circle cx="110" cy="214" r="26" fill="#e9ecee" stroke="#9aa1a6"/><circle cx="110" cy="214" r="12" fill="#3c4449"/><g id="dm-knob"><rect x="107" y="190" width="6" height="18" rx="3" fill="#f6cf45"/></g>
  ${plugSvg('blk', 52, 254, '#222', 'COM')}${plugSvg('red', 168, 254, '#d32f2f', 'VΩ▶|')}</g>`;
}
const DSTUD = {L1:34, L2:76, L3:118, P:172, B:214, N:256, U:310, V:352, W:394, PE:450};
const DTY = 352;

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
    try { await run(); await sleep(1800); }
    catch (e){ console.warn(e); }
    finally {
      S = snap; DEMO--; rebuild(id); pane.classList.remove('demoing');
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
  if (el.tagName === 'INPUT'){ const t = String(v); el.value = ''; for (let i = 1; i <= t.length; i++){ el.value = t.slice(0, i); await sleep(35 / DSPEED); } } else el.value = v;
  el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); await sleep(180 / DSPEED); el.classList.remove('dhl');
}
async function dWait(fn, max){ const t0 = Date.now(); while (!fn()){ if (Date.now() - t0 > (max || 60000)) throw new Error('demo: timeout'); await sleep(120); } }
const foot = () => `<div class="row keep"><button type="button" class="btn demo-b keep">▶ شاهد الحل</button><button type="button" class="btn new-b keep">سيناريو جديد</button></div><p class="msg demo-m keep" aria-live="polite"></p>`;
function newScenario(host, id, fn){
  $('.new-b', host).addEventListener('click', () => { if (DEMO) return; fn(); save(); rebuild(id); });
}
/* one input field */
const fld = (k, label, unit, val, ph) => `<label class="fld"><span>${ar(label)}</span><input type="text" inputmode="decimal" data-k="${k}" value="${esc(val == null ? '' : val)}" placeholder="${ph || ''}" autocomplete="off"><b class="u">${unit ? esc(unit) : ''}</b></label>`;
const sel = (k, label, options, val) => `<label class="fld"><span>${ar(label)}</span><select data-k="${k}"><option value="">اختر…</option>${options.map(o => `<option value="${esc(o[0])}"${String(val) === String(o[0]) ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`;
function mark(el, ok){ if (!el) return; el.classList.toggle('ok', ok === true); el.classList.toggle('no', ok === false); }
function say(el, html, cls){ if (!el) return; el.className = 'msg ' + (cls || ''); el.innerHTML = html; }
const warn = (title, txt) => `<div class="warnbox"><b>${ar(title)}</b> ${ar(txt)}</div>`;

/* ---------------- test leads: tap a plug then a terminal, or drag the plug onto it ---------------- */
function svgPt(svg, e){ const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : {x:0, y:0}; }
function Leads(svg, o){
  const conn = {}; let selP = null, drag = null, supp = false;
  const lay = svg.querySelector('.cabs');
  const path = (a, b) => { const sag = Math.max(30, Math.abs(b.x - a.x) * 0.3 + Math.abs(b.y - a.y) * 0.15), vb = svg.viewBox.baseVal, lim = vb && vb.height ? vb.height - 4 : 1e9, c1 = Math.min(a.y + sag, lim), c2 = Math.min(b.y + sag, lim); return `M${f1(a.x)} ${f1(a.y)} C${f1(a.x)} ${f1(c1)} ${f1(b.x)} ${f1(c2)} ${f1(b.x)} ${f1(b.y)}`; };
  function draw(){
    let h = '';
    Object.keys(conn).forEach(p => { const P = o.plugs[p], T = o.targets[conn[p]]; h += `<path class="cab-o" d="${path(P, T)}"/><path class="cab" stroke="${P.color}" d="${path(P, T)}"/><circle cx="${T.x}" cy="${T.y}" r="6.5" fill="${P.color}" stroke="#111" stroke-width="1.2"/>`; });
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
/* a plug drawn on an instrument (banana jack + coloured lead stub) */
const plugSvg = (id, x, y, color, lab) => `<g class="hit" data-plug="${id}" tabindex="0" role="button" aria-label="${esc(lab)}"><rect x="${x - 20}" y="${y - 18}" width="40" height="50" fill="transparent"/><circle class="ring" cx="${x}" cy="${y}" r="14"/><circle cx="${x}" cy="${y}" r="11" fill="#1a1d1f" stroke="#555" stroke-width="2"/><circle cx="${x}" cy="${y}" r="6.5" fill="${color}"/><text x="${x}" y="${y + 25}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#e9eef1">${lab}</text></g>`;
/* a terminal stud that leads can be clipped onto */
const studSvg = (id, x, y, lab, r) => `<g class="hit" data-tg="${id}" tabindex="0" role="button" aria-label="${esc(lab)}"><circle class="ring" cx="${x}" cy="${y}" r="${(r || 11) + 4}"/><circle cx="${x}" cy="${y}" r="${r || 11}" fill="#c9a24a" stroke="#6d5420" stroke-width="2"/><polygon points="${hexPts(x, y, (r || 11) * 0.55)}" fill="#b4b8bb" stroke="#555" stroke-width="1"/><text x="${x}" y="${y - (r || 11) - 6}" text-anchor="middle" font-size="11" font-weight="700" class="tx">${lab}</text></g>`;
function hexPts(x, y, r){ let s = ''; for (let i = 0; i < 6; i++){ const a = Math.PI / 6 + i * Math.PI / 3; s += f1(x + r * Math.cos(a)) + ',' + f1(y + r * Math.sin(a)) + ' '; } return s.trim(); }
/* instrument LCD */

/* =====================================================================
   TAB 1 · parts (l10): discharge, diode test, caps, regen, fan
   ===================================================================== */
const PT_ROWS = [
  {id:'D1', r:'L1', b:'P', g:'rect'}, {id:'D2', r:'L2', b:'P', g:'rect'}, {id:'D3', r:'L3', b:'P', g:'rect'},
  {id:'D4', r:'N', b:'L1', g:'rect'}, {id:'D5', r:'N', b:'L2', g:'rect'}, {id:'D6', r:'N', b:'L3', g:'rect'},
  {id:'U+', r:'U', b:'P', g:'igbt'}, {id:'V+', r:'V', b:'P', g:'igbt'}, {id:'W+', r:'W', b:'P', g:'igbt'},
  {id:'U−', r:'N', b:'U', g:'igbt'}, {id:'V−', r:'N', b:'V', g:'igbt'}, {id:'W−', r:'N', b:'W', g:'igbt'}
];
const PT_PARTS = [['rect', 'مقوّم الدخل (وحدة الديودات الستة)'], ['igbt', 'وحدة IGBT (مرحلة الخرج)'], ['C1', 'المكثف C1'], ['C2', 'المكثف C2'], ['regen', 'مقاومة الكبح الخارجية'], ['fan', 'مروحة التبريد'], ['bleed', 'مقاومات التفريغ على المكثفات']];
function genPT(){
  const kind = pick(['rect', 'igbt', 'cap', 'regen', 'fan', 'bleed']);
  const sc = {kind, V0:Math.round(rnd(548, 566)), vf:{}, sub:'', row:'', cap:{}, R:+f1(rnd(98.2, 102.6)), fan:{rpm:Math.round(rnd(4600, 4900)), I:+f2(rnd(0.16, 0.19))}};
  PT_ROWS.forEach(r => { sc.vf[r.id] = +f3(r.g === 'rect' ? rnd(0.442, 0.488) : rnd(0.331, 0.392)); });
  ['C1', 'C2'].forEach(c => { sc.cap[c] = {C:Math.round(rnd(452, 478)), E:+f2(rnd(0.20, 0.29))}; });
  if (kind === 'rect'){ sc.row = pick(['D1', 'D2', 'D3', 'D4', 'D5', 'D6']); sc.sub = pick(['short', 'open']); }
  if (kind === 'igbt'){ sc.row = pick(['U+', 'V+', 'W+', 'U−', 'V−', 'W−']); sc.sub = 'short'; }
  if (kind === 'cap'){ sc.sub = pick(['C1', 'C2']); sc.cap[sc.sub] = {C:Math.round(rnd(318, 362)), E:+f2(rnd(0.62, 0.95))}; }
  if (kind === 'regen'){ sc.sub = pick(['open', 'drift']); sc.R = sc.sub === 'open' ? Infinity : +f1(rnd(152, 178)); }
  if (kind === 'fan'){ sc.sub = pick(['seized', 'slow']); sc.fan = sc.sub === 'seized' ? {rpm:0, I:+f2(rnd(0.38, 0.45))} : {rpm:Math.round(rnd(1900, 2300)), I:+f2(rnd(0.23, 0.27))}; }
  return sc;
}
const ptAnswer = sc => sc.kind === 'cap' ? sc.sub : sc.kind;
/* the power stage as a graph of diodes (forward edges) for the diode test */
function ptEdges(sc){
  const E = [];
  PT_ROWS.forEach(r => {
    const bad = r.id === sc.row;
    if (bad && sc.sub === 'open') return;
    if (bad && sc.sub === 'short'){ E.push([r.r, r.b, 0.003], [r.b, r.r, 0.003]); return; }
    E.push([r.r, r.b, sc.vf[r.id]]);
  });
  E.push(['B', 'P', 0.402], ['N', 'B', 0.371]);                      // chopper free-wheel and IGBT diode
  if (isFinite(sc.R)) { const v = sc.R / 1000; E.push(['P', 'B', v], ['B', 'P', v]); } // the resistor at the meter's 1 mA
  return E;
}
function ptPath(sc, a, b){
  const E = ptEdges(sc), d = {}; d[a] = 0; const Q = [a];
  while (Q.length){ const u = Q.shift(); E.forEach(([x, y, v]) => { if (x === u && (d[y] == null || d[u] + v < d[y] - 1e-9)){ d[y] = d[u] + v; Q.push(y); } }); }
  return d[b] == null ? Infinity : d[b];
}
function dStud(id, x, y){
  return `<g class="hit" data-tg="${id}" tabindex="0" role="button" aria-label="${id}"><rect x="${x - 19}" y="${y - 22}" width="38" height="44" fill="transparent"/><circle class="ring" cx="${x}" cy="${y}" r="16"/><circle cx="${x}" cy="${y}" r="12" fill="#c9a24a" stroke="#6d5420" stroke-width="2"/><polygon points="${hexPts(x, y, 6.5)}" fill="#b4b8bb" stroke="#555"/><text x="${x}" y="${y - 18}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#11181c">${id}</text></g>`;
}
function capSvg(id, cx, bulge){
  const top = bulge ? `<path d="M${cx - 24} 76 Q${cx} 52 ${cx + 24} 76" fill="#c3c8cc" stroke="#7d858a" stroke-width="1.5"/><path d="M${cx - 10} 70 l20 0 M${cx} 62 l0 14" stroke="#8a6d3b" stroke-width="2"/>` : `<ellipse cx="${cx}" cy="76" rx="24" ry="7" fill="#c3c8cc" stroke="#7d858a" stroke-width="1.5"/><path d="M${cx - 9} 76 l18 0 M${cx} 70 l0 12" stroke="#7d858a" stroke-width="1.6"/>`;
  return `<g><rect x="${cx - 24}" y="76" width="48" height="122" rx="6" fill="#2f4f8a" stroke="#1b2f55" stroke-width="1.5"/><rect x="${cx - 24}" y="186" width="48" height="12" fill="#1b2f55"/>${top}
  <text transform="translate(${cx + 5} 140) rotate(-90)" text-anchor="middle" font-size="10" font-weight="700" fill="#e8eef5">470µF 450V</text><text x="${cx}" y="215" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${id}</text></g>`;
}
function driveSvg(sc, NB){
  const W = NB ? 490 : 760, H = NB ? 866 : 440, dmx = NB ? 96 : 526, dmy = NB ? 450 : 70, dk = NB ? 1.35 : 1;
  const dio = (x, y) => `<path d="M${x} ${y} l10 6 l-10 6z M${x + 10} ${y} v12" fill="#e9eef1" stroke="#e9eef1" stroke-width="1.2"/>`;
  let st = ''; Object.keys(DSTUD).forEach(k => { st += dStud(k, DSTUD[k], DTY); });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="الدرايف مفتوحًا وجهاز القياس متعدد الأغراض">
  <rect x="6" y="6" width="478" height="428" rx="12" fill="#3c4449" stroke="#22282b" stroke-width="2"/>
  <rect x="18" y="18" width="454" height="300" rx="6" fill="#1f5a3d" stroke="#123824"/>
  <text x="30" y="38" font-size="11" font-weight="700" fill="#cfe8d7">SERVO DRIVE · 400 V 3~ · DC BUS</text>
  <path d="M90 108 V96 H420 V108" fill="none" stroke="var(--cu)" stroke-width="6" stroke-linejoin="round"/><text x="150" y="91" font-size="10" font-weight="700" fill="#f3c7a0">P (+)</text>
  <path d="M90 176 V236 H420 V176" fill="none" stroke="#9aa3a8" stroke-width="6" stroke-linejoin="round"/><text x="150" y="252" font-size="10" font-weight="700" fill="#d5dbde">N (−)</text>
  <rect x="34" y="108" width="112" height="68" rx="5" fill="#15181a" stroke="#000"/><text x="90" y="124" text-anchor="middle" font-size="10" font-weight="700" fill="#e9eef1">RECT 1600 V</text>
  ${dio(46, 132)}${dio(80, 132)}${dio(114, 132)}${dio(46, 154)}${dio(80, 154)}${dio(114, 154)}
  ${capSvg('C1', 202, sc.kind === 'cap' && sc.sub === 'C1')}${capSvg('C2', 266, sc.kind === 'cap' && sc.sub === 'C2')}
  <g><rect x="226" y="206" width="16" height="7" rx="3" fill="#d8c8a0" stroke="#7a6a40"/><rect x="290" y="206" width="16" height="7" rx="3" fill="#d8c8a0" stroke="#7a6a40"/><text x="298" y="226" text-anchor="middle" font-size="9" fill="#cfe8d7">150k ×2</text></g>
  <circle id="pt-led" cx="234" cy="276" r="7" fill="#ff2a2a" stroke="#600" stroke-width="1.5"/><text x="248" y="280" font-size="10" font-weight="700" fill="#ffd0d0">CHARGE</text>
  <rect x="306" y="108" width="114" height="68" rx="5" fill="#15181a" stroke="#000"/><text x="363" y="124" text-anchor="middle" font-size="10" font-weight="700" fill="#e9eef1">IGBT 6-in-1</text>
  ${dio(318, 132)}${dio(352, 132)}${dio(386, 132)}${dio(318, 154)}${dio(352, 154)}${dio(386, 154)}
  <rect x="34" y="262" width="150" height="44" rx="4" fill="#173f2b" stroke="#2c6b4b"/><text x="109" y="289" text-anchor="middle" font-size="10" fill="#cfe8d7">CONTROL · GATE DRIVE</text>
  <g><rect x="372" y="22" width="92" height="74" rx="6" fill="#22282b" stroke="#111"/><g transform="translate(418 59)"><circle r="31" fill="#15181a"/><g id="pt-fan">${[0, 72, 144, 216, 288].map(a => `<path transform="rotate(${a})" d="M0 -6 C10 -10 22 -18 26 -6 C18 0 8 2 0 6z" fill="#5b6468"/>`).join('')}<circle r="8" fill="#2e3439" stroke="#777"/></g></g><text x="418" y="108" text-anchor="middle" font-size="9.5" font-weight="700" fill="#e9eef1">FAN 24 V</text></g>
  <rect x="14" y="326" width="462" height="54" rx="6" fill="#e6e2d6" stroke="#9a9484"/>
  ${[148, 286, 426].map(x => `<line x1="${x + 4}" y1="330" x2="${x + 4}" y2="376" stroke="#9a9484" stroke-width="2"/>`).join('')}
  <path d="M34 366 V440 M76 366 V440 M118 366 V440" stroke-width="5" stroke="#5b3a1e"/><path d="M76 366 V440" stroke="#222" stroke-width="5"/><path d="M118 366 V440" stroke="#8d969b" stroke-width="5"/>
  <path d="M310 366 V440 M352 366 V440 M394 366 V440" stroke-width="5" stroke="#1d2124"/><path d="M450 366 V440" stroke="#2e7d32" stroke-width="5" stroke-dasharray="6 6"/><path d="M450 366 V440" stroke="#e1c21a" stroke-width="5" stroke-dasharray="6 6" stroke-dashoffset="6"/>
  <path d="M172 366 V404 M214 366 V404" stroke="#c62828" stroke-width="4"/>
  <rect x="150" y="402" width="88" height="30" rx="4" fill="#b9c1c7" stroke="#6b7378"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<line x1="${158 + i * 12}" y1="404" x2="${158 + i * 12}" y2="430" stroke="#8d969b"/>`).join('')}<text x="194" y="421" text-anchor="middle" font-size="9.5" font-weight="700" fill="#1d2124">100Ω 400W</text>
  <text x="76" y="436" text-anchor="middle" font-size="9" font-weight="700" fill="#e9eef1">400 V 3~</text><text x="352" y="436" text-anchor="middle" font-size="9" font-weight="700" fill="#e9eef1">→ MOTOR</text>
  ${st}
  ${dmmSvg(dmx, dmy, dk)}
  <g class="cabs"></g></svg>`;
}
function esrSvg(){
  return `<svg viewBox="0 0 300 120" role="img" aria-label="جهاز قياس السعة و ESR"><rect x="4" y="4" width="292" height="112" rx="14" fill="#5d666c" stroke="#2e3439" stroke-width="2"/><text x="150" y="22" text-anchor="middle" font-size="10" font-weight="700" fill="#f2f4f5">LCR · ESR METER · 100 Hz</text>
  <rect x="16" y="30" width="268" height="76" rx="5" fill="#1d2124"/><rect x="20" y="34" width="260" height="68" rx="3" fill="#c7d3b4"/>
  <text x="30" y="52" font-size="11" class="lcdt" id="es-who">—</text><text x="270" y="64" text-anchor="end" font-size="22" font-weight="700" class="lcdt" id="es-c">----</text><text x="270" y="94" text-anchor="end" font-size="18" font-weight="700" class="lcdt" id="es-e">----</text>
  <text x="30" y="72" font-size="11" class="lcdt">Cs</text><text x="30" y="94" font-size="11" class="lcdt">ESR</text></svg>`;
}
BUILD.parts = host => {
  if (!S.pt || !S.pt.sc) S.pt = {sc:genPT()};
  const PS = S.pt, sc = PS.sc, NB = NARROW();
  if (!PS.st) PS.st = {off:false, lock:false, t:0, tool:false, V:sc.V0, busOK:false, fwd:{}, rev:{}, cap:{}, reg:null, fan:null, busLog:[]};
  const P = PS.st; if (!isFinite(P.V)) P.V = sc.V0;
  const tauEff = () => sc.kind === 'bleed' ? 14400 : DRV.tau;
  host.innerHTML = `
  <div class="dev"><h3><span class="n">1</span>${ar('افصل وأقفل، ثم انتظر التفريغ')}</h3>
    <div class="loto">
      <button type="button" class="btn" data-l="off">${ar('افصل القاطع الرئيسي Q1 للدرايف')}</button>
      <button type="button" class="btn" data-l="lock">${ar('ضع القفل والبطاقة على Q1')}</button>
      <button type="button" class="btn" data-l="tool">${ar('وصّل أداة التفريغ 2 kΩ / 50 W بين P و N')}</button>
    </div>
    <div class="read"><div><span>${ar('الزمن منذ الفصل (الساعة مسرَّعة ×20)')}</span><b id="pt-clk">--:--</b></div><div><span>${ar('مؤشر الشحن CHARGE')}</span><b id="pt-ledt">ON</b></div></div>
    <div class="fx" id="pt-fx"></div>
    <p class="note">${ar('مؤشر CHARGE لا يكفي دليلًا: الملصق يقول «انتظر 10 min»، لكن القاعدة هي القياس بجهاز CAT III بين P و N حتى يصبح الجهد دون 50 V.')}</p>
    <p class="msg" id="pt-m0" aria-live="polite"></p>
  </div>
  <div class="dev"><h3><span class="n">2</span>${ar('قِس بالمالتيميتر')}</h3>
    <p class="note">${ar('اختر الوضع على الجهاز (V⎓ أو Ω أو ▶|)، ثم اسحب الطرف الأحمر والطرف الأسود إلى مسمارين على شريط الأطراف، أو انقر الطرف ثم المسمار.')}</p>
    <div class="stage" style="max-width:${NB ? 520 : 820}px;margin:0 auto;width:100%">${driveSvg(sc, NB)}</div>
    <p class="msg" id="pt-m1" aria-live="polite"></p>
    <div class="tblw"><table class="tbl hm" id="pt-tbl"><tr><th>diode</th><th>red +</th><th>black −</th><th>forward</th><th>reverse</th></tr>
      ${PT_ROWS.map(r => `<tr data-row="${r.id}"><td>${r.id}</td><td>${r.r}</td><td>${r.b}</td><td class="f">—</td><td class="r">—</td></tr>`).join('')}</table></div>
    <p class="typ">${ar('قيم نموذجية للتعلّم: الديود السليم 0.3–0.5 V في الاتجاه الأمامي و OL في العكسي؛ القصر ≈ 0 V في الاتجاهين؛ الديود المفتوح OL في الاتجاهين. ارجع إلى كتيّب الدرايف.')}</p>
  </div>
  <div class="grid2">
    <div class="dev"><h3><span class="n">3</span>${ar('مكثفات الناقل: السعة و ESR')}</h3>
      <div class="stage" style="max-width:360px;margin:0 auto;width:100%;background:var(--panel)">${esrSvg()}</div>
      <div class="row"><button type="button" class="btn" data-c="C1">${ar('ضع المشابك على C1 وقِس')}</button><button type="button" class="btn" data-c="C2">${ar('ضع المشابك على C2 وقِس')}</button></div>
      ${fld('cs', 'سعة الناقل للمكثفين على التوالي', 'µF', PS.cs)}
      <div class="fx" id="pt-cfx">C = C1·C2 / (C1 + C2)</div>
      <p class="typ">${ar('قيم نموذجية للتعلّم: استبدل المكثف إذا نقصت سعته أكثر من 20 % (دون 376 µF) أو تضاعف ESR عن قيمته الجديدة (نحو 0.25 Ω عند 100 Hz).')}</p>
      <p class="msg" id="pt-m2" aria-live="polite"></p>
    </div>
    <div class="dev"><h3><span class="n">4</span>${ar('مقاومة الكبح والمروحة')}</h3>
      <p class="note">${ar('مقاومة الكبح: قِسها بوضع Ω بين P و B. ثم احسب أقصى نسبة تشغيل مسموحة لها عند جهد المروحة الكابحة 760 V.')}</p>
      ${fld('duty', 'أقصى نسبة تشغيل لمقاومة 100 Ω / 400 W', '%', PS.duty)}
      <div class="fx" id="pt-dfx">P = V² / R · duty = P<sub>rated</sub> / P</div>
      <div class="row"><button type="button" class="btn" data-a="fan">${ar('غذِّ المروحة بـ 24 V وقِس السرعة والتيار')}</button></div>
      <div class="read"><div><span>${ar('سرعة المروحة')}</span><b id="pt-rpm">—</b></div><div><span>${ar('تيار المروحة')}</span><b id="pt-fi">—</b></div></div>
      <p class="typ">${ar('قيم نموذجية للتعلّم: مروحة 24 V سليمة نحو 4500–5000 rpm و 0.15–0.20 A.')}</p>
      <p class="msg" id="pt-m3" aria-live="polite"></p>
    </div>
  </div>
  <div class="dev" id="pt-dec"><h3><span class="n">5</span>${ar('القرار')}</h3>
    ${sel('part', 'الجزء المعطوب', PT_PARTS, PS.part)}
    <div class="row"><button type="button" class="btn pri" data-a="chk">تحقّق</button></div>
    <p class="msg" id="pt-m4" aria-live="polite"></p>
  </div>
  ${foot()}`;
  const q = s => $(s, host), svg = $('svg', q('.stage'));
  const m0 = q('#pt-m0'), m1 = q('#pt-m1');
  const dmx = NB ? 96 : 526, dmy = NB ? 450 : 70, dk = NB ? 1.35 : 1;
  let mode = 'V', shown = '----', settle = 0, lastKey = '', fanOn = false, fanA = 0;
  /* ---- LOTO ---- */
  function lotoUI(){
    q('[data-l="off"]').classList.toggle('ok', P.off); q('[data-l="lock"]').classList.toggle('ok', P.lock); q('[data-l="tool"]').classList.toggle('ok', P.tool);
    $$('#pt-tbl tr[data-row]', host).forEach(tr => { const id = tr.dataset.row; $('.f', tr).textContent = P.fwd[id] || '—'; $('.r', tr).textContent = P.rev[id] || '—'; });
  }
  IL.onAct(host, '[data-l]', b => {
    const k = b.dataset.l;
    if (k === 'off'){ if (P.off) return; P.off = true; P.t = 0; say(m0, ar('فُصل Q1: انقطعت التغذية، لكن المكثفات ما زالت مشحونة وتتفرّغ عبر مقاومات التفريغ.'), 'ok'); }
    if (k === 'lock'){ if (P.lock) return; if (!P.off) return say(m0, ar('افصل القاطع Q1 أولًا، ثم ضع القفل عليه وهو مفتوح.'), 'bad'); P.lock = true; say(m0, ar('القفل الشخصي والبطاقة على Q1؛ المفتاح معك.'), 'ok'); }
    if (k === 'tool'){ if (P.tool) return; if (!P.lock) return say(m0, ar('لا توصل أداة التفريغ والدرايف موصول بالتغذية: افصل وأقفل أولًا.'), 'bad'); P.tool = true; say(m0, ar('أداة التفريغ موصولة بين P و N بمقبضين معزولين: τ = 2 kΩ × 235 µF = 0.47 s. قِس بعدها، ولا تفترض أنها نجحت.'), 'ok'); }
    lotoUI(); save();
  });
  /* ---- DMM ---- */
  const MODES = {V:['DC V', 'V'], R:['Ω', 'Ω'], D:['DIODE', 'V']};
  function setMode(k){
    mode = k; $$('[data-mode]', svg).forEach(g => $('.mdb', g).setAttribute('fill', g.dataset.mode === k ? '#f6cf45' : '#e9ecee'));
    q('#dm-mode').textContent = MODES[k][0]; q('#dm-unit').textContent = MODES[k][1];
    q('#dm-knob').setAttribute('transform', `rotate(${k === 'V' ? -60 : k === 'R' ? 0 : 60} 110 214)`);
    lastKey = ''; settle = 0;
  }
  IL.onAct(svg, '[data-mode]', g => setMode(g.dataset.mode));
  const plugXY = (x, y) => ({x:dmx + x * dk, y:dmy + y * dk});
  const LD = Leads(svg, {
    plugs:{red:Object.assign(plugXY(168, 254), {color:'#d32f2f', el:$('[data-plug="red"]', svg)}), blk:Object.assign(plugXY(52, 254), {color:'#222', el:$('[data-plug="blk"]', svg)})},
    targets:Object.fromEntries(Object.keys(DSTUD).map(k => [k, {x:DSTUD[k], y:DTY}])),
    single:true,
    ok(p, t){ return true; },
    msg(t){ if (t) say(m1, ar(t), 'bad'); else say(m1, ar('الآن انقر المسمار الذي تريد توصيل الطرف به، أو اسحبه إليه.')); },
    change(){ lastKey = ''; settle = 0; say(m1, ''); }
  });
  function reading(){
    const r = LD.conn.red, k = LD.conn.blk;
    if (!r || !k) return null;
    if (r === k) return {v:0, txt:'0.000'};
    if (mode === 'V'){
      const V = P.V, pot = {P:V, B:V, N:0};
      if (pot[r] == null || pot[k] == null) return {v:0, txt:'0.0'};
      const v = pot[r] - pot[k]; return {v, txt:f1(v)};
    }
    if (P.V > 50 || !P.busOK) return {block:true};
    if (mode === 'R'){
      const pr = new Set([r, k]);
      if (pr.has('P') && pr.has('B') && pr.size === 2) return isFinite(sc.R) ? {v:sc.R, txt:f1(sc.R), reg:true} : {v:Infinity, txt:'OL', reg:true};
      const a = ptPath(sc, r, k), b = ptPath(sc, k, r);
      if (a < 0.05 && b < 0.05) return {v:0.3, txt:'0.3'};
      return {v:Infinity, txt:'OL'};
    }
    const v = ptPath(sc, r, k);
    if (r === 'N' && (k === 'P' || k === 'B')) return {v, txt:'OL', cap:true};
    return v > 2 ? {v:Infinity, txt:'OL'} : {v, txt:f3(v)};
  }
  function busFx(){
    const V = P.V, t50 = DRV.tau * Math.log(sc.V0 / 50);
    q('#pt-fx').innerHTML = `V(t) = V<sub>0</sub>·e<sup>−t/τ</sup> · τ = R·C = ${DRV.Rbl} kΩ × ${DRV.Cbus} µF = <b>${f1(DRV.tau)} s</b> · t(50 V) = τ·ln(V<sub>0</sub>/50) = ${f1(DRV.tau)} × ln(${sc.V0}/50) = <b>${f0(t50)} s ≈ ${f1(t50 / 60)} min</b>`;
  }
  busFx();
  const clk = q('#pt-clk'), ledt = q('#pt-ledt'), led = q('#pt-led'), big = q('#dm-big'), sub = q('#dm-sub'), fanG = q('#pt-fan');
  let lastSave = 0;
  const anim = IL.animate(host, dt => {
    if (!host.isConnected){ anim.stop(); return; }
    if (P.off){ const k = DEMO ? 20 * DSPEED * 2 : 20; P.t += dt * k; P.V *= Math.exp(-dt * k / tauEff()); if (P.tool) P.V *= Math.exp(-dt / 0.47); if (P.V < 0.05) P.V = 0; }
    else P.V = sc.V0;
    clk.textContent = P.off ? String(Math.floor(P.t / 60)).padStart(2, '0') + ':' + String(Math.floor(P.t % 60)).padStart(2, '0') : '--:--';
    const lv = Math.min(1, P.V / 120); led.setAttribute('opacity', f2(0.12 + 0.88 * lv)); ledt.textContent = P.V > 25 ? 'ON' : 'OFF';
    /* fan: runs while the drive is powered, or on the 24 V test */
    const rpm = (!P.off || fanOn) ? sc.fan.rpm : 0; fanA = (fanA + dt * Math.min(rpm, 900) * 6 * 0.25) % 360; fanG.setAttribute('transform', `rotate(${f1(fanA)})`);
    /* meter */
    const R = reading(), key = (LD.conn.red || '') + '|' + (LD.conn.blk || '') + '|' + mode;
    if (key !== lastKey){ lastKey = key; settle = 0; if (R && R.block){ say(m1, ar(P.V > 50 ? 'توقّف: الناقل ما زال مشحونًا؛ وضع Ω أو الديود على ناقل حي يتلف الجهاز ويعرّضك للخطر. قِس P–N بوضع V⎓ حتى يصبح دون 50 V.' : 'قِس P–N بوضع V⎓ أولًا وسجّل أنه دون 50 V قبل أي اختبار آخر.'), 'bad'); } }
    settle += dt;
    if (!R || R.block){ big.textContent = R && R.block ? '----' : (mode === 'V' ? '0.0' : 'OL'); sub.textContent = ''; }
    else if (R.cap){ const v = Math.min(2.5, 0.7 + settle * 0.6); big.textContent = v >= 2.5 ? 'OL' : f3(v); sub.textContent = 'charging C'; }
    else if (settle < 0.6){ big.textContent = isFinite(R.v) && settle > 0.25 ? (mode === 'V' ? f1(R.v * (0.9 + settle * 0.16)) : f3(R.v * (1.3 - settle * 0.5))).slice(0, 6) : '- - -'; sub.textContent = ''; }
    else {
      big.textContent = R.txt; sub.textContent = '';
      if (settle - dt < 0.6) record(R);
      else if (mode === 'V' && P.off && !P.busOK && Math.abs(R.v) < 50 && ((LD.conn.red === 'P' && LD.conn.blk === 'N') || (LD.conn.red === 'N' && LD.conn.blk === 'P'))) record(R);
    }
    if (performance.now() - lastSave > 2000){ lastSave = performance.now(); save(); }
  });
  function record(R){
    const r = LD.conn.red, k = LD.conn.blk;
    if (mode === 'V' && ((r === 'P' && k === 'N') || (r === 'N' && k === 'P'))){
      const v = Math.abs(R.v);
      if (!P.off) return say(m1, ar('الناقل P–N = ' + f0(v) + ' V والدرايف موصول بالتغذية. افصل وأقفل أولًا.'));
      if (v < 50){ if (!P.busOK){ P.busOK = true; save(); } return say(m1, ar('الناقل P–N = ' + f1(v) + ' V، أي دون 50 V: يجوز الآن العمل داخل الدرايف. أبقِ القفل.'), 'ok'); }
      return say(m1, ar('الناقل P–N = ' + f0(v) + ' V، أعلى من 50 V: لا تلمس شيئًا وانتظر ثم أعد القياس.'), 'bad');
    }
    if (mode === 'D'){
      const fw = PT_ROWS.find(x => x.r === r && x.b === k), rv = PT_ROWS.find(x => x.r === k && x.b === r);
      if (fw){ P.fwd[fw.id] = R.txt; lotoUI(); save(); return say(m1, ar(fw.id + ' أمامي: ' + R.txt + (R.txt === 'OL' ? '' : ' V')), ''); }
      if (rv){ P.rev[rv.id] = R.txt; lotoUI(); save(); return say(m1, ar(rv.id + ' عكسي: ' + R.txt + (R.txt === 'OL' ? '' : ' V')), ''); }
      if (R.cap) return say(m1, ar('بين N و P يشحن تيار الجهاز مكثفات الناقل فترتفع القراءة حتى OL؛ هذا سلوك طبيعي.'));
    }
    if (mode === 'R' && R.reg){ P.reg = R.txt; save(); return say(m1, ar('مقاومة الكبح P–B = ' + R.txt + (R.txt === 'OL' ? '' : ' Ω') + ' (القيمة الاسمية 100 Ω).')); }
  }
  setMode('V'); lotoUI();
  /* ---- capacitors ---- */
  function capShow(id, v){
    q('#es-who').textContent = id ? id + ' · 470µF 450V' : '—';
    q('#es-c').textContent = v ? f0(v.C) + ' µF' : '----'; q('#es-e').textContent = v ? f2(v.E) + ' Ω' : '----';
  }
  function capFx(){
    const a = P.cap.C1, b = P.cap.C2;
    q('#pt-cfx').innerHTML = a && b ? `C = C1·C2 / (C1 + C2) = ${a.C} × ${b.C} / (${a.C} + ${b.C}) = <b>${f1(a.C * b.C / (a.C + b.C))} µF</b> · ${ar('الاسمية')} 470/2 = 235 µF` : 'C = C1·C2 / (C1 + C2)';
  }
  capFx();
  IL.onAct(host, '[data-c]', b => {
    const id = b.dataset.c, m2 = q('#pt-m2');
    if (!P.busOK) return say(m2, ar('قِس الناقل P–N وتأكّد أنه دون 50 V قبل وضع المشابك على المكثف.'), 'bad');
    q('#es-who').textContent = id + ' · measuring'; q('#es-c').textContent = '- - -'; q('#es-e').textContent = '- - -';
    setTimeout(() => { if (!host.isConnected) return; P.cap[id] = sc.cap[id]; capShow(id, sc.cap[id]); b.classList.add('ok'); capFx(); save(); say(m2, ar(id + ': C = ' + sc.cap[id].C + ' µF و ESR = ' + f2(sc.cap[id].E) + ' Ω.')); }, DEMO ? 300 / DSPEED : 900);
  });
  Object.keys(P.cap).forEach(id => q(`[data-c="${id}"]`).classList.add('ok'));
  /* ---- fan ---- */
  function fanShow(){ if (!P.fan) return; q('#pt-rpm').textContent = P.fan.rpm + ' rpm'; q('#pt-fi').textContent = f2(P.fan.I) + ' A'; }
  fanShow();
  IL.onAct(host, '[data-a="fan"]', b => {
    const m3 = q('#pt-m3');
    if (!P.busOK) return say(m3, ar('افصل وأقفل وقِس الناقل دون 50 V، ثم افصل موصّل المروحة وغذِّها من مصدر 24 V خارجي.'), 'bad');
    fanOn = true; b.classList.add('ok');
    setTimeout(() => { if (!host.isConnected) return; P.fan = sc.fan; fanShow(); save(); say(m3, ar('المروحة: ' + sc.fan.rpm + ' rpm عند ' + f2(sc.fan.I) + ' A.')); setTimeout(() => { fanOn = false; }, 2500); }, DEMO ? 300 / DSPEED : 1100);
  });
  /* ---- duty ---- */
  const Pk = DRV.Vch * DRV.Vch / DRV.Rreg, duty = DRV.Preg / Pk * 100;
  q('#pt-dfx').innerHTML = `P = V² / R = ${DRV.Vch}² / ${DRV.Rreg} = <b>${f0(Pk)} W</b> · duty = ${DRV.Preg} / ${f0(Pk)} = <b id="pt-dv">?</b>`;
  host.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.k; if (k === 'cs' || k === 'duty' || k === 'part'){ PS[k] = e.target.value; save(); } });
  host.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.k; if (k === 'part'){ PS.part = e.target.value; save(); } });
  /* ---- decision ---- */
  IL.onAct(host, '[data-a="chk"]', () => {
    const m4 = q('#pt-m4'), miss = [];
    if (!P.busOK) miss.push('قياس الناقل دون 50 V');
    const nf = PT_ROWS.filter(r => !P.fwd[r.id]).length; if (nf) miss.push('اختبار الديود الأمامي (' + nf + ' متبقية من 12)');
    if (!P.cap.C1 || !P.cap.C2) miss.push('قياس C1 و C2');
    if (P.reg == null) miss.push('قياس مقاومة الكبح P–B');
    if (!P.fan) miss.push('اختبار المروحة');
    if (miss.length) return say(m4, ar('أكمل القياسات أولًا: ' + miss.join('، ') + '.'), 'bad');
    const csIn = num($('[data-k="cs"]', host).value), dIn = num($('[data-k="duty"]', host).value);
    const csT = P.cap.C1.C * P.cap.C2.C / (P.cap.C1.C + P.cap.C2.C);
    const okC = near(csIn, csT, 0.02), okD = near(dIn, duty, 0.04);
    mark($('[data-k="cs"]', host), okC); mark($('[data-k="duty"]', host), okD);
    if (!okC) return say(m4, ar('سعة المكثفين على التوالي = C1·C2/(C1+C2) من قراءتيك، وهي نحو نصف سعة المكثف الواحد.'), 'bad');
    if (!okD) return say(m4, ar('نسبة التشغيل = 400 W ÷ (760² ÷ 100) × 100 %.'), 'bad');
    q('#pt-dv').textContent = f1(duty) + ' %';
    const pv = $('[data-k="part"]', host).value, ans = ptAnswer(sc);
    if (!pv) return say(m4, ar('اختر الجزء المعطوب.'), 'bad');
    const why = ptWhy(sc, P);
    mark($('[data-k="part"]', host), pv === ans);
    if (pv !== ans) return say(m4, ar(PT_WRONG[pv] ? PT_WRONG[pv](sc, P) : 'هذا الجزء سليم بقراءاتك؛ ابحث عن القراءة الخارجة عن المدى النموذجي.'), 'bad');
    say(m4, ar('صحيح: ' + why), 'ok');
    win('parts', 'أحسنت: فرّغت الناقل وقسته دون 50 V، واختبرت المكوّنات كلها ووجدت الجزء المعطوب: ' + why);
  });
  newScenario(host, 'parts', () => { S.pt = {sc:genPT()}; });
  demo(host, 'parts', async () => {
    Object.assign(P, {off:false, lock:false, t:0, tool:false, V:sc.V0, busOK:false, fwd:{}, rev:{}, cap:{}, reg:null, fan:null}); lotoUI();
    await dClick(q('[data-l="off"]')); await dClick(q('[data-l="lock"]'));
    await dClick($('[data-mode="V"]', svg), 300);
    const conn = async (r, k) => { const pr = $('[data-plug="red"]', svg), pb = $('[data-plug="blk"]', svg); pr.classList.add('dhl'); pb.classList.add('dhl'); await sleep(260 / DSPEED); LD.set('red', r); LD.set('blk', k); pr.classList.remove('dhl'); pb.classList.remove('dhl'); await sleep(Math.max(800, 900 / DSPEED)); };
    await conn('P', 'N');
    if (sc.kind === 'bleed'){ await sleep(2500 / DSPEED); await dClick(q('[data-l="tool"]')); }
    await dWait(() => P.V < 45, 60000); await sleep(900 / DSPEED);
    await dWait(() => P.busOK, 8000);
    await dClick($('[data-mode="D"]', svg), 300);
    for (const r of PT_ROWS){ await conn(r.r, r.b); }
    await dClick($('[data-mode="R"]', svg), 300); await conn('P', 'B');
    await dClick(q('[data-c="C1"]')); await sleep(800 / DSPEED); await dClick(q('[data-c="C2"]')); await sleep(800 / DSPEED);
    await dClick(q('[data-a="fan"]')); await sleep(900 / DSPEED);
    const cs = sc.cap.C1.C * sc.cap.C2.C / (sc.cap.C1.C + sc.cap.C2.C);
    await dSet($('[data-k="cs"]', host), f1(cs)); await dSet($('[data-k="duty"]', host), f1(duty));
    await dSet($('[data-k="part"]', host), ptAnswer(sc)); await dClick(q('[data-a="chk"]')); await sleep(800 / DSPEED);
  });
};
function ptWhy(sc){
  const r = PT_ROWS.find(x => x.id === sc.row);
  if (sc.kind === 'rect') return sc.sub === 'short' ? `الديود ${r.id} (${r.r}→${r.b}) يقرأ نحو 0 V في الاتجاهين: قصر؛ تُستبدل وحدة المقوّم.` : `الديود ${r.id} (${r.r}→${r.b}) يقرأ OL في الاتجاهين: مفتوح؛ تُستبدل وحدة المقوّم.`;
  if (sc.kind === 'igbt') return `الموضع ${r.id} (${r.r}→${r.b}) يقرأ نحو 0 V في الاتجاهين: IGBT في قصر؛ تُستبدل وحدة IGBT بعد فحص المحرك والكابل.`;
  if (sc.kind === 'cap'){ const c = sc.cap[sc.sub]; return `${sc.sub}: السعة ${c.C} µF (أقل من 80 %) و ESR ${f2(c.E)} Ω (أكثر من الضعف): مكثف متقادم؛ يُستبدل المكثفان معًا.`; }
  if (sc.kind === 'regen') return sc.sub === 'open' ? 'مقاومة الكبح P–B تقرأ OL: مفتوحة، فسيظهر AL.ov عند الفرملة.' : `مقاومة الكبح P–B تقرأ ${f1(sc.R)} Ω بدل 100 Ω: انحرفت بالحرارة، فيقلّ تيار الكبح ويظهر AL.ov.`;
  if (sc.kind === 'fan') return sc.sub === 'seized' ? `المروحة لا تدور وتسحب ${f2(sc.fan.I)} A: محمل عالق؛ تُستبدل قبل أن يظهر AL.oH.` : `المروحة ${sc.fan.rpm} rpm فقط: محملها متآكل؛ تُستبدل قبل أن يظهر AL.oH.`;
  return 'الناقل لم ينخفض تقريبًا في الزمن المتوقع: مقاومات التفريغ مفتوحة؛ تُستبدل، ويُفرَّغ الناقل بالأداة حتى ذلك الحين.';
}
const PT_WRONG = {
  rect: () => 'ديودات المقوّم الستة تقرأ 0.4–0.5 V أماميًا و OL عكسيًا: المقوّم سليم.',
  igbt: () => 'ديودات IGBT الستة تقرأ 0.3–0.4 V أماميًا و OL عكسيًا: وحدة IGBT سليمة.',
  C1: (sc, P) => 'C1 ضمن المدى: ' + P.cap.C1.C + ' µF و ESR ' + f2(P.cap.C1.E) + ' Ω.',
  C2: (sc, P) => 'C2 ضمن المدى: ' + P.cap.C2.C + ' µF و ESR ' + f2(P.cap.C2.E) + ' Ω.',
  regen: (sc, P) => 'مقاومة الكبح تقرأ ' + P.reg + ' Ω، وهي ضمن ±5 % من 100 Ω.',
  fan: (sc, P) => 'المروحة تدور ' + P.fan.rpm + ' rpm بتيار طبيعي: سليمة.',
  bleed: () => 'الناقل انخفض في الزمن المتوقع من τ = R·C: مقاومات التفريغ سليمة.'
};

/* =====================================================================
   TAB 2 · alarms (l11): 7-segment alarms → measurement → root cause → repair
   ===================================================================== */
const AL_T = {
  mon:{n:'شاشة المراقبة في الدرايف', dev:'DRIVE MONITOR', col:'#3c4449', live:true},
  vin:{n:'جهد الدخل L1-L2-L3', dev:'DMM · AC V · CAT III', col:'#f2c230', live:true},
  fan:{n:'المروحة وحرارة المبرّد', dev:'TACHO + IR THERMOMETER', col:'#5d666c', live:true},
  brk:{n:'جهد الفرامل عند المحرك', dev:'DMM · DC V · BRAKE', col:'#f2c230', live:true, zs:true},
  bat:{n:'جهد بطارية الإنكودر', dev:'DMM · DC V · BATTERY', col:'#f2c230', any:true},
  meg:{n:'ميجر 500 V: المحرك والكابل', dev:'INSULATION TESTER 500 V', col:'#f2c230', live:false},
  dio:{n:'اختبار الديود لخرج الدرايف', dev:'DMM · DIODE TEST', col:'#f2c230', live:false},
  ohm:{n:'الأوميتر على مقاومة الكبح وملف الفرامل', dev:'DMM · OHM', col:'#f2c230', live:false},
  encc:{n:'استمرارية كابل الإنكودر مع ثني السلسلة', dev:'CABLE TESTER', col:'#2e6db4', live:false},
  hand:{n:'تدوير المحور يدويًا وقياس عزم الاحتكاك', dev:'TORQUE WRENCH', col:'#8d969b', live:false, zs:true},
  megenc:{n:'ميجر على كابل الإنكودر', trap:'توقّف: الميجر يتلف إلكترونيات الإنكودر، فلا يُختبر الإنكودر ولا كابله الموصول به بالميجر أبدًا.'},
  megdrv:{n:'ميجر على أطراف خرج الدرايف U/V/W', trap:'توقّف: الميجر يتلف دوائر الدرايف؛ افصل كابل المحرك عن الدرايف واختبر المحرك والكابل وحدهما.'}
};
function alNormal(ax, t){
  const A = AX[ax], j = (a, b, d) => fmt(rnd(a, b), d || 0);
  return {
    mon:['Vbus ' + j(536, 546) + ' V · I ' + j(0.8, 1.6, 1) + ' A', 'load ' + j(28, 45) + ' % · ' + j(38, 46) + ' °C'],
    vin:['L1-L2 ' + j(397, 404) + ' · L2-L3 ' + j(397, 404), 'L3-L1 ' + j(397, 404) + ' V AC'],
    fan:['fan ' + j(4600, 4900) + ' rpm', 'heatsink ' + j(42, 52) + ' °C'],
    brk:A.brake ? ['PSU ' + j(23.9, 24.3, 1) + ' V · motor ' + j(23.3, 23.8, 1) + ' V', 'release ' + j(74, 86) + ' ms'] : ['no brake on ' + ax, '—'],
    bat:ax === 'X' ? ['battery ' + j(3.52, 3.62, 2) + ' V', 'alarm < 3.1 V'] : ax === 'Z' ? ['battery-less multi-turn', '(gear type)'] : ['no battery', '(' + A.enc + ')'],
    meg:['motor U/V/W-PE ' + j(900, 2500) + ' MΩ', 'cable ' + j(2000, 4000) + ' MΩ @500 V'],
    dio:['→P ' + j(0.33, 0.37, 2) + ' V · N→ ' + j(0.33, 0.37, 2) + ' V', 'reverse OL ×6'],
    ohm:['P-B ' + j(99, 102, 1) + ' Ω', A.brake ? 'brake coil ' + j(39.5, 41, 1) + ' Ω' : 'no brake'],
    encc:ax === 'A' ? ['EXC ' + j(17, 19, 1) + ' · SIN ' + j(40, 44, 1) + ' Ω', 'COS ' + j(40, 44, 1) + ' Ω · shield OK'] : ['all pairs < 1 Ω flexed', 'shield 360° ' + j(0.1, 0.3, 1) + ' Ω'],
    hand:['friction ' + j(0.7, 1.1, 1) + ' N·m', 'smooth whole stroke']
  }[t];
}
const AL_S = {
  oc_cable:{ax:'X', code:'AL.oc', sym:'AL.oc على X عند التسارع السريع، ويتكرر بعد المسح.', key:['meg'],
    r:() => ({meg:['motor U/V/W-PE ' + Math.round(rnd(900, 1800)) + ' MΩ', 'cable U-PE ' + f2(rnd(0.2, 0.5)) + ' MΩ ✗'], mon:['I peak ' + f1(rnd(30, 33)) + ' A → trip', 'Vbus ' + Math.round(rnd(536, 544)) + ' V']}),
    why:'عزل كابل القدرة U إلى الأرضي أقل من 1 MΩ بينما المحرك وحده سليم: تيار تسرّب نبضي يفصل بالتيار الزائد.'},
  oc_igbt:{ax:'Y', code:'AL.oc', sym:'AL.oc فور Servo ON على Y، حتى وكابل المحرك مفصول عن الدرايف.', key:['dio'],
    r:() => ({dio:['V→P ' + f3(rnd(0.001, 0.004)) + ' · P→V ' + f3(rnd(0.001, 0.004)) + ' ✗', 'other 5: ' + f2(rnd(0.33, 0.37)) + ' V / OL']}),
    why:'الموضع العلوي للطور V يقرأ نحو 0 V في الاتجاهين وكابل المحرك مفصول: IGBT في قصر داخل الدرايف.'},
  ov_regen:{ax:'Z', code:'AL.ov', sym:'AL.ov عند توقّف Z بعد نزول سريع.', key:['ohm'],
    r:() => ({ohm:['P-B OL ✗', 'brake coil ' + f1(rnd(39.5, 41)) + ' Ω'], mon:['Vbus peak ' + Math.round(rnd(801, 812)) + ' V at stop ✗', 'regen load 0 %']}),
    why:'المقاومة بين P و B مفتوحة، فلا تُصرَّف طاقة الفرملة ويرتفع الناقل فوق 800 V.'},
  ph_fuse:{ax:'A', code:'AL.Ph', sym:'AL.Ph عند التشغيل، والطاولة الدوّارة A لا تتحرك.', key:['vin'],
    r:() => ({vin:['L1-L2 ' + Math.round(rnd(398, 404)) + ' · L2-L3 ' + Math.round(rnd(2, 9)) + ' ✗', 'L3-L1 ' + Math.round(rnd(2, 9)) + ' V AC ✗'], mon:['Vbus ' + Math.round(rnd(440, 470)) + ' V · ripple 100 Hz', 'load 0 %']}),
    why:'جهدا L2-L3 و L3-L1 قرب الصفر: الطور L3 مفقود عند دخل الدرايف، والسبب مصهر L3 محترق.'},
  enb:{ax:'X', code:'AL.EnB', sym:'AL.EnB عند التشغيل صباحًا، مع تحذير قرب فقدان الموضع المطلق.', key:['bat'],
    r:() => ({bat:['battery ' + f2(rnd(2.71, 2.94)) + ' V ✗', 'alarm < 3.1 V']}),
    why:'جهد البطارية دون حد الإنذار 3.1 V: بطارية الإنكودر المطلق ضعيفة.'},
  enc_cable:{ax:'X', code:'AL.EnC', sym:'AL.EnC متقطّع على X عند جزء معيّن من الشوط فقط.', key:['encc'],
    r:() => ({encc:['DATA+ open when chain flexed ✗', 'shield 360° ' + f1(rnd(0.1, 0.3)) + ' Ω'], mon:['CRC errors ' + Math.round(rnd(150, 400)) + ' ✗ rising', 'at X > ' + Math.round(rnd(320, 420)) + ' mm']}),
    why:'زوج البيانات ينقطع عند ثني سلسلة الكابلات: سلك مكسور داخل كابل الإنكودر.'},
  pos_brake:{ax:'Z', code:'AL.PoS', sym:'AL.PoS على Z عند الصعود، والمحرك ساخن مع رائحة احتكاك.', key:['brk'],
    r:() => ({brk:['PSU ' + f1(rnd(23.9, 24.2)) + ' V · motor ' + f1(rnd(15.8, 18.2)) + ' V ✗', 'drop at terminal X12:3'], mon:['load ' + Math.round(rnd(150, 175)) + ' % moving up', 'following error ' + f1(rnd(3.6, 4.8)) + ' mm'], ohm:['P-B ' + f1(rnd(99, 102)) + ' Ω', 'brake coil ' + f1(rnd(39.5, 41)) + ' Ω ✓']}),
    why:'جهد الفرامل عند المحرك دون 21.6 V (24 V −10 %) مع ملف سليم: الفرامل لا تتحرّر كاملًا وتحتك.'},
  ol_mech:{ax:'Y', code:'AL.oL', sym:'AL.oL على Y بعد نصف ساعة، والتيار مرتفع في الاتجاهين.', key:['hand'],
    r:() => ({hand:['friction ' + f1(rnd(3.4, 4.2)) + ' N·m ✗ (typ. 1)', 'tight along whole stroke'], mon:['load ' + Math.round(rnd(120, 135)) + ' % at constant feed', 'I ' + f1(rnd(4.8, 5.4)) + ' A both directions']}),
    why:'عزم الاحتكاك نحو أربعة أضعاف المعتاد على طول الشوط: احتكاك ميكانيكي من انقطاع التزييت.'},
  oh_fan:{ax:'A', code:'AL.oH', sym:'AL.oH بعد ساعة من التشغيل في يوم حار.', key:['fan'],
    r:() => ({fan:['fan 0 rpm ✗', 'heatsink ' + Math.round(rnd(88, 95)) + ' °C ✗']}),
    why:'المروحة متوقفة والمبرّد فوق 85 °C: التبريد مفقود.'}
};
const AL_C = {oc_cable:'عزل كابل القدرة تالف داخل سلسلة الكابلات', oc_igbt:'IGBT في قصر داخل مرحلة الخرج', ov_regen:'مقاومة الكبح مفتوحة', ph_fuse:'فقدان طور في الدخل: مصهر L3 محترق', enb:'بطارية الإنكودر المطلق ضعيفة', enc_cable:'سلك مكسور في كابل الإنكودر عند سلسلة الكابلات', pos_brake:'الفرامل لا تتحرّر كاملًا لأن جهدها منخفض عند المحرك', ol_mech:'احتكاك ميكانيكي من انقطاع تزييت المجاري', oh_fan:'مروحة تبريد الدرايف متوقفة',
  gain:'كسب حلقة السرعة مرتفع أكثر من اللازم', param:'بارامترات الدرايف ممسوحة', demag:'مغانط المحرك فقدت جزءًا من مغنطتها'};
const AL_R = {oc_cable:'استبدل كابل القدرة بكابل مرن مناسب، ثم أعد التشغيل', oc_igbt:'افحص المحرك والكابل بالميجر، ثم استبدل الدرايف وانقل البارامترات', ov_regen:'استبدل مقاومة الكبح بأخرى 100 Ω / 400 W وتحقّق من توصيلها', ph_fuse:'ابحث عن سبب احتراق المصهر، ثم استبدله بالقيمة نفسها', enb:'استبدل البطارية وتغذية التحكم موصولة كي لا يضيع العدّ متعدد اللفات', enc_cable:'استبدل كابل الإنكودر بكابل مرن مجدول الأزواج مع حجب 360°', pos_brake:'أصلح طرف تغذية الفرامل المرتخي حتى يصل 24 V ±10 % إلى المحرك', ol_mech:'أعد التزييت وافحص المجاري واللولب الكروي قبل التشغيل', oh_fan:'استبدل المروحة ونظّف مرشّح الهواء ومجاري التبريد',
  raise:'ارفع حد الإنذار أو حد التيار في البارامترات', motor:'استبدل المحرك فورًا', reset:'امسح الإنذار وأعد التشغيل'};
const AL_RW = {raise:'رفع حد الإنذار يخفي العطل ولا يعالج سببه.', motor:'المحرك ليس سبب هذا الإنذار بقياساتك، فاستبداله هدر.', reset:'مسح الإنذار دون إصلاح السبب يعيده فورًا وقد يتلف الدرايف.'};
function genAL(){
  return {list:shuffle(Object.keys(AL_S)).slice(0, 4).map(id => {
    const cs = shuffle([id].concat(shuffle(Object.keys(AL_C).filter(k => k !== id)).slice(0, 3)));
    const rp = shuffle([id].concat(shuffle(Object.keys(AL_R).filter(k => k !== id)).slice(0, 3)));
    return {id, cs, rp, rd:AL_S[id].r(), ok:false, c:'', r:''};
  })};
}
function cabSvg(ax, code){
  let s = `<svg viewBox="0 0 640 196" role="img" aria-label="خزانة الدرايفات الأربعة"><rect x="2" y="2" width="636" height="192" rx="10" fill="#d9dcd6" stroke="#9ea39d" stroke-width="2"/>`;
  ['X', 'Y', 'Z', 'A'].forEach((a, i) => {
    const x = 14 + i * 156, bad = a === ax;
    s += `<g><rect x="${x}" y="12" width="144" height="172" rx="8" fill="#2e3439" stroke="${bad ? '#d32f2f' : '#1d2124'}" stroke-width="${bad ? 3 : 1.5}"/>
    <text x="${x + 12}" y="32" font-size="12" font-weight="700" fill="#e9eef1">AXIS ${a}</text><circle cx="${x + 128}" cy="28" r="5" fill="${bad ? '#ff3b30' : '#35c759'}"/>
    <rect x="${x + 10}" y="42" width="124" height="46" rx="5" fill="#0b0f10"/><g class="${bad ? 'blink' : ''}">${seg7(bad ? code : 'rdY', x + 18, 52, 26, 5, '#ff3b30')}</g>
    <rect x="${x + 10}" y="98" width="124" height="14" rx="3" fill="#1d2124"/><text x="${x + 72}" y="109" text-anchor="middle" font-size="9" fill="#9aa1a6">MODE  ▲  ▼  SET</text>
    ${[0, 1, 2, 3].map(k => `<rect x="${x + 14 + k * 30}" y="122" width="22" height="30" rx="3" fill="#15181a" stroke="#444"/>`).join('')}
    <text x="${x + 72}" y="172" text-anchor="middle" font-size="9.5" fill="#9aa1a6">400 V · ${AX[a].P} kW</text></g>`;
  });
  return s + '</svg>';
}
function alInst(t, lines){
  const T = AL_T[t] || {dev:'—', col:'#3c4449'};
  return `<svg viewBox="0 0 320 128" role="img" aria-label="${esc(T.n || '')}"><rect x="4" y="4" width="312" height="120" rx="16" fill="${T.col}" stroke="#222" stroke-width="2"/><rect x="16" y="14" width="288" height="100" rx="10" fill="#2e3439"/><text x="160" y="31" text-anchor="middle" font-size="10.5" font-weight="700" fill="#f6cf45">${T.dev}</text>
  <rect x="26" y="40" width="268" height="64" rx="4" fill="#c7d3b4"/><text x="160" y="66" text-anchor="middle" font-size="14" font-weight="700" class="lcdt">${esc(lines[0])}</text><text x="160" y="92" text-anchor="middle" font-size="14" font-weight="700" class="lcdt">${esc(lines[1] || '')}</text></svg>`;
}
BUILD.alarms = host => {
  if (!S.al || !S.al.list) S.al = genAL();
  const AS = S.al; let cur = 0;
  const st = AS.list.map(() => ({live:true, iso:false, wait:false, dead:false, sup:false, meas:{}}));
  host.innerHTML = `
  <div class="chipline" id="al-tabs">${AS.list.map((c, i) => `<button type="button" class="btn${c.ok ? ' done' : ''}" data-s="${i}">${ar('الإنذار ' + (i + 1))}${c.ok ? ' ✓' : ''}</button>`).join('')}</div>
  <div class="dev" id="al-card"></div>
  <p class="typ">${ar('قيم نموذجية للتعلّم: الناقل ≈ 540 V، الكبح ≈ 760 V، الجهد الزائد ≈ 800 V، المنخفض ≈ 380 V، الفرامل 24 V ±10 %، إنذار البطارية دون 3.1 V. ارجع إلى كتيّب الدرايف والمحرك.')}</p>
  ${foot()}`;
  const q = s => $(s, host);
  const val = (c, t) => (c.rd[t] || alNormal(AL_S[c.id].ax, t));
  function render(){
    const c = AS.list[cur], s = AL_S[c.id], P = st[cur];
    if (!c.nr) c.nr = {};
    $$('#al-tabs .btn', host).forEach((b, i) => b.setAttribute('aria-pressed', i === cur ? 'true' : 'false'));
    const card = q('#al-card'); card.classList.toggle('ok', c.ok);
    const stTxt = P.live ? 'الدرايف موصول بالتغذية' : P.dead ? 'معزول ومقفل · الناقل دون 50 V' : 'معزول ومقفل · الناقل لم يُقَس بعد';
    card.innerHTML = `<h3><span class="n">${cur + 1}</span>${ar('المحور ' + s.ax + ' · ' + s.code)}</h3>
      <div class="stage" style="max-width:640px;margin:0 auto;width:100%">${cabSvg(s.ax, s.code)}</div>
      <p style="font-weight:600;line-height:1.8">${ar(s.sym)}</p>
      <div class="row"><span class="pill ${P.live ? 'warn' : P.dead ? 'ok' : 'bad'}">${ar(stTxt)}</span></div>
      <div class="row">${P.live ? `<button type="button" class="btn" data-a="iso">${ar('افصل وأقفل Q1')}</button>` : `<button type="button" class="btn" data-a="bus">${ar('قِس الناقل P–N')}</button><button type="button" class="btn" data-a="wait">${ar('انتظر 4 min')}</button><button type="button" class="btn" data-a="on">${ar('أزل الأقفال وأعد التغذية')}</button>`}
      ${s.ax === 'Z' ? `<button type="button" class="btn${P.sup ? ' ok' : ''}" data-a="sup" aria-pressed="${P.sup}">${ar(P.sup ? 'المحور Z مدعوم بكتلة ✓' : 'ادعم المحور Z بكتلة ميكانيكية')}</button>` : ''}</div>
      <div class="chipline">${Object.keys(AL_T).map(k => `<button type="button" class="btn${P.meas[k] ? ' done' : ''}" data-t="${k}">${ar(AL_T[k].n)}</button>`).join('')}</div>
      <div class="stage" style="max-width:420px;margin:0 auto;width:100%" id="al-inst">${alInst('mon', ['----', ''])}</div>
      <p class="msg" id="al-m0" aria-live="polite"></p>
      <ul class="log" id="al-log">${Object.keys(P.meas).map(k => `<li>${logAl(k, P.meas[k])}</li>`).join('')}</ul>
      ${sel('c', 'السبب الجذري', c.cs.map(k => [k, AL_C[k]]), c.c)}
      ${sel('r', 'الإصلاح', c.rp.map(k => [k, AL_R[k]]), c.r)}
      <div class="row"><button type="button" class="btn pri" data-a="chk">تحقّق</button></div>
      <p class="msg" id="al-m1" aria-live="polite">${c.ok ? ar('حُلّ: ' + s.why) : ''}</p>`;
    ['c', 'r'].forEach(k => $(`[data-k="${k}"]`, card).addEventListener('change', e => { c[k] = e.target.value; save(); }));
  }
  const logAl = (k, v) => '<b>' + ar(AL_T[k].n) + ':</b> <bdi dir="ltr" class="mono">' + esc(v) + '</bdi>';
  IL.onAct(q('#al-tabs'), '[data-s]', b => { cur = +b.dataset.s; render(); });
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-t],[data-a]'); if (!b || !q('#al-card').contains(b)) return;
    const c = AS.list[cur], s = AL_S[c.id], P = st[cur], m0 = q('#al-m0');
    const a = b.dataset.a;
    if (a === 'chk') return check();
    if (a === 'iso'){ P.live = false; P.iso = true; P.wait = false; P.dead = false; render(); return say(q('#al-m0'), ar('فُصل Q1 وأُقفل. المكثفات ما زالت مشحونة: قِس الناقل قبل أي عمل.'), 'ok'); }
    if (a === 'on'){ P.live = true; P.dead = false; P.wait = false; render(); return say(q('#al-m0'), ar('أُزيلت الأقفال بعد إعادة الكوابل والموصّلات وإغلاق الغطاء؛ التغذية عادت.')); }
    if (a === 'wait'){ P.wait = true; return say(m0, ar('مرّت 4 min؛ الناقل يتفرّغ عبر مقاومات التفريغ (τ ≈ 70 s).')); }
    if (a === 'bus'){
      const v = P.wait ? rnd(18, 36) : rnd(380, 470);
      $('#al-inst', host).innerHTML = alInst('vin', ['P–N ' + f0(v) + ' V DC', v < 50 ? '< 50 V ✓' : '> 50 V ✗']);
      if (v < 50){ P.dead = true; render(); $('#al-inst', host).innerHTML = alInst('vin', ['P–N ' + f0(v) + ' V DC', '< 50 V ✓']); return say(q('#al-m0'), ar('P–N = ' + f0(v) + ' V، أي دون 50 V: يجوز العمل على الدرايف والكوابل.'), 'ok'); }
      return say(m0, ar('P–N = ' + f0(v) + ' V: الناقل ما زال خطرًا؛ انتظر ثم أعد القياس.'), 'bad');
    }
    if (a === 'sup'){ P.sup = true; render(); return say(q('#al-m0'), ar('المحور Z مستند إلى كتلة ميكانيكية: لن يسقط عند تحرير الفرامل.'), 'ok'); }
    const t = b.dataset.t, T = AL_T[t]; if (!t) return;
    if (T.trap) return say(m0, ar(T.trap), 'bad');
    if (T.live === false && !P.dead) return say(m0, ar(P.live ? 'هذا القياس على دائرة ميتة فقط: افصل وأقفل وقِس الناقل دون 50 V أولًا.' : 'قِس الناقل P–N وتأكّد أنه دون 50 V قبل هذا القياس.'), 'bad');
    if (T.live && !P.live) return say(m0, ar('الدرايف معزول: هذا القياس يحتاج التغذية، فأزل الأقفال بعد إنهاء القياسات المعزولة.'));
    if (T.zs && s.ax === 'Z' && !P.sup) return say(m0, ar('ادعم المحور Z بكتلة ميكانيكية أولًا: تحرير الفرامل أو تدوير المحور دون دعم يُسقطه.'), 'bad');
    $('#al-inst', host).innerHTML = alInst(t, ['····', '']);
    setTimeout(() => {
      if (!host.isConnected || AS.list[cur] !== c) return;
      const v = val(c, t); if (!c.rd[t]) c.rd[t] = v;
      $('#al-inst', host).innerHTML = alInst(t, v); P.meas[t] = v.join(' · ');
      b.classList.add('done'); const li = document.createElement('li'); li.innerHTML = logAl(t, P.meas[t]); if (/✗/.test(P.meas[t])) li.className = 'bad'; q('#al-log').appendChild(li);
      say(m0, ''); save();
    }, DEMO ? 250 / DSPEED : 700);
  });
  function check(){
    const c = AS.list[cur], s = AL_S[c.id], P = st[cur], m = q('#al-m1'), card = q('#al-card');
    if (!s.key.some(k => P.meas[k])) return say(m, ar('قِس أولًا بالأداة المناسبة (' + s.key.map(k => AL_T[k].n).join(' أو ') + ') قبل الحكم؛ لا تخمّن.'), 'bad');
    const cv = $('[data-k="c"]', card).value, rv = $('[data-k="r"]', card).value;
    if (!cv || !rv) return say(m, ar('اختر السبب الجذري والإصلاح.'), 'bad');
    const okC = cv === c.id, okR = rv === c.id;
    mark($('[data-k="c"]', card), okC); mark($('[data-k="r"]', card), okR);
    if (!okC) return say(m, ar('السبب غير صحيح: ' + s.why), 'bad');
    if (!okR) return say(m, ar(AL_RW[rv] || 'هذا الإصلاح لا يعالج السبب الذي وجدته.'), 'bad');
    c.ok = true; save(); card.classList.add('ok');
    const tb = $(`#al-tabs [data-s="${cur}"]`, host); tb.classList.add('done'); tb.innerHTML = ar('الإنذار ' + (cur + 1)) + ' ✓';
    say(m, ar('صحيح: ' + s.why), 'ok');
    if (AS.list.every(x => x.ok)) win('alarms', 'أحسنت: شخّصت الإنذارات الأربعة بالقياس الصحيح في الحالة الآمنة الصحيحة.');
  }
  render();
  newScenario(host, 'alarms', () => { S.al = genAL(); });
  demo(host, 'alarms', async () => {
    AS.list.forEach(c => { c.ok = false; c.c = ''; c.r = ''; }); $$('#al-tabs .btn', host).forEach((b, i) => { b.classList.remove('done'); b.innerHTML = ar('الإنذار ' + (i + 1)); });
    for (let i = 0; i < AS.list.length; i++){
      await dClick(q(`[data-s="${i}"]`), 300);
      const c = AS.list[i], s = AL_S[c.id], k = s.key[0], T = AL_T[k];
      if (T.live === false){ await dClick(q('[data-a="iso"]')); await dClick(q('[data-a="wait"]')); await dClick(q('[data-a="bus"]')); }
      if (T.zs && s.ax === 'Z') await dClick(q('[data-a="sup"]'));
      await dClick(q(`[data-t="${k}"]`)); await sleep(700 / DSPEED);
      await dSet(q('[data-k="c"]'), c.id); await dSet(q('[data-k="r"]'), c.id);
      await dClick(q('[data-a="chk"]')); await sleep(600 / DSPEED);
    }
  });
};

/* =====================================================================
   TAB 3 · tuning (l12): two-mass axis, PI velocity loop, P position loop, notch
   ===================================================================== */
const TN = {Jm:2.9e-4, pitch:10, Ttest:3.0, nTest:500, Ts:1 / 16000, tauI:50e-6, tauF:1e-4, Tmax:14.3, zr:0.02, Q:0.7, depth:0.02, F:10};
TN.v = TN.F * 1000 / 60;                               // 166.7 mm/s at 10 m/min
function genTN(){ return {r:+f1(rnd(8.0, 10.0)), fr:Math.round(rnd(540, 820) / 5) * 5, kacc:rnd(0.995, 1.005)}; }
function tnPlant(sc){ const Jm = TN.Jm, Jl = Jm * sc.r, mu = 1 / (1 / Jm + 1 / Jl), wr = 2 * Math.PI * sc.fr, ks = wr * wr * mu; return {Jm, Jl, ks, cs:2 * TN.zr * Math.sqrt(ks * mu)}; }
/* time simulation: mode 'vel' (30 rpm step), 'ramp' (G01 10 m/min move), 'pstep' (small position step) */
function tnSim(sc, o, mode){
  const M = tnPlant(sc), Ts = TN.Ts, sub = 4, h = Ts / sub;
  const Jest = M.Jm * (1 + Math.max(0, o.ratio || 0)), Kvp = 2 * Math.PI * o.fv * Jest, Ti = o.Ti / 1000, Kp = o.Kp || 0;
  let nb = null;
  if (o.nOn){ const w0 = 2 * Math.PI * o.nf, K = w0 / Math.tan(w0 * Ts / 2), Q = TN.Q, d = TN.depth;
    const a = [K * K + w0 / Q * K + w0 * w0, 2 * (w0 * w0 - K * K), K * K - w0 / Q * K + w0 * w0], b = [K * K + d * w0 / Q * K + w0 * w0, 2 * (w0 * w0 - K * K), K * K - d * w0 / Q * K + w0 * w0];
    nb = {b:b.map(x => x / a[0]), a:a.map(x => x / a[0]), x1:0, x2:0, y1:0, y2:0}; }
  const T = mode === 'vel' ? 0.06 : mode === 'pstep' ? 0.08 : 0.32, N = Math.round(T / Ts), t0 = 0.005;
  const wstep = 30 * 2 * Math.PI / 60, vmax = 1000 * 2 * Math.PI / 60, ta = 0.05, tc = 0.12, pst = 0.05;
  const pref = t => { if (mode === 'pstep') return t < 0 ? 0 : pst; if (t < 0) return 0; if (t < ta) return 0.5 * vmax / ta * t * t; const p1 = 0.5 * vmax * ta; if (t < ta + tc) return p1 + vmax * (t - ta); if (t < 2 * ta + tc){ const u = t - ta - tc; return p1 + vmax * tc + vmax * u - 0.5 * vmax / ta * u * u; } return 2 * p1 + vmax * tc; };
  let wm = 0, wl = 0, th = 0, pm = 0, integ = 0, tf = 0, ti = 0, wmeas = 0, pmeas = 0, vout = 0;
  const R = {t:[], y:[], e:[], tq:[], mode};
  const kf = 1 - Math.exp(-Ts / TN.tauF);
  for (let n = 0; n < N; n++){
    const t = n * Ts - t0;
    const wref = mode === 'vel' ? (t >= 0 ? wstep : 0) : Kp * (pref(t) - pmeas);
    const e = wref - wmeas; integ += e * Ts / Ti; integ = Math.max(-50, Math.min(50, integ)); const u = Kvp * (e + integ);
    tf += (u - tf) * kf; let v = tf;
    if (nb){ const y = nb.b[0] * v + nb.b[1] * nb.x1 + nb.b[2] * nb.x2 - nb.a[1] * nb.y1 - nb.a[2] * nb.y2; nb.x2 = nb.x1; nb.x1 = v; nb.y2 = nb.y1; nb.y1 = y; v = y; }
    v = Math.max(-TN.Tmax, Math.min(TN.Tmax, v)); const va = vout; vout = v;
    for (let k = 0; k < sub; k++){ ti += (va - ti) * (h / TN.tauI); const tsh = M.ks * th + M.cs * (wm - wl); wm += h * (ti - tsh) / M.Jm; wl += h * tsh / M.Jl; th += h * (wm - wl); pm += h * wm; }
    wmeas = wm; pmeas = pm;
    if (n % 4 === 0){ R.t.push(t); R.y.push(mode === 'vel' ? wm / wstep : mode === 'pstep' ? pm / pst : pm); R.e.push(mode === 'ramp' ? (pref(t) - pm) / (2 * Math.PI) * TN.pitch : 0); R.tq.push(ti); }
  }
  /* metrics */
  const tail = R.tq.slice(-Math.round(0.015 / (Ts * 4)));
  const mean = tail.reduce((a, b) => a + b, 0) / tail.length; let rip = 0; tail.forEach(x => { rip = Math.max(rip, Math.abs(x - mean)); });
  let zc = 0; for (let i = 1; i < tail.length; i++) if ((tail[i - 1] - mean) * (tail[i] - mean) < 0) zc++;
  R.osc = rip > 0.05 ? zc / 2 / (tail.length * Ts * 4) : 0;
  R.rip = rip;
  if (mode !== 'ramp'){ let mx = 0; R.y.forEach((y, i) => { if (R.t[i] >= 0) mx = Math.max(mx, y); }); R.os = Math.max(0, (mx - 1) * 100);
    let ts = 0; R.y.forEach((y, i) => { if (Math.abs(y - 1) > 0.05) ts = R.t[i]; }); R.ts = ts * 1000; }
  else { let em = 0; R.e.forEach((e, i) => { if (R.t[i] > 0.06 && R.t[i] < 0.17) em = Math.max(em, Math.abs(e)); }); R.ef = em; }
  return R;
}
function tnMag(sc, f){
  const M = tnPlant(sc), w = 2 * Math.PI * f, Jt = M.Jm + M.Jl;
  const nr = M.ks - M.Jl * w * w, ni = M.cs * w, dr = Jt * M.ks - M.Jm * M.Jl * w * w, di = Jt * M.cs * w;
  return 20 * Math.log10(Jt * Math.hypot(nr, ni) / Math.hypot(dr, di));
}
function notchMag(fn, f){ const x = f / fn, d = TN.depth, Q = TN.Q; const re = 1 - x * x; return 20 * Math.log10(Math.hypot(re, d * x / Q) / Math.hypot(re, x / Q)); }
BUILD.tuning = host => {
  if (!S.tn || !S.tn.sc) S.tn = {sc:genTN()};
  const TS = S.tn, sc = TS.sc;
  if (!TS.p) TS.p = {ratio:'1.0', fv:40, Ti:20, nOn:false, nf:1000, Kp:40};
  const p = TS.p;
  const knob = (k, lab, unit, min, max, step) => `<div class="knob"><div class="hd"><span>${ar(lab)}</span><b><span data-v="${k}">${p[k]}</span> ${unit}</b></div><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${p[k]}" aria-label="${esc(lab)}"></div>`;
  host.innerHTML = `
  <div class="note">${ar('المحور X بعد استبدال الدرايف: البارامترات عادت إلى ضبط المصنع (نسبة القصور 1.0). المحرك 1.5 kW، Jm = 2.9 × 10⁻⁴ kg·m² (قيمة نموذجية)، واللولب الكروي بخطوة 10 mm.')}</div>
  <div class="dev"><h3><span class="n">1</span>${ar('نسبة القصور الذاتي Inertia ratio')}</h3>
    <p class="note">${ar('يطبّق الدرايف عزمًا ثابتًا 3.0 N·m ويقيس زمن التسارع من 0 إلى 500 rpm (الاحتكاك مهمل).')}</p>
    <div class="row"><button type="button" class="btn" data-a="acc">${ar('شغّل اختبار التسارع')}</button></div>
    <div class="plot"><svg id="tn-pa" viewBox="0 0 340 120" role="img" aria-label="منحنى التسارع"></svg></div>
    <div class="fx" id="tn-fa">J = T·t / Δω · ratio = J / Jm − 1</div>
    ${fld('ratio', 'نسبة القصور الذاتي (بارامتر الدرايف)', '×', p.ratio)}
  </div>
  <div class="dev"><h3><span class="n">2</span>${ar('حلقة السرعة: الكسب وزمن التكامل')}</h3>
    <div class="kgrid">${knob('fv', 'كسب حلقة السرعة fv', 'Hz', 20, 400, 5)}${knob('Ti', 'زمن التكامل Ti', 'ms', 2, 40, 0.5)}</div>
    <div class="row"><button type="button" class="btn pri" data-a="vel">${ar('خطوة سرعة 30 rpm')}</button></div>
    <div class="plot"><svg id="tn-pv" viewBox="0 0 340 160" role="img" aria-label="استجابة السرعة للخطوة"></svg></div>
    <div class="read" id="tn-rv"><div><span>${ar('التجاوز')}</span><b>—</b></div><div><span>${ar('زمن الاستقرار ±5 %')}</span><b>—</b></div><div><span>${ar('تذبذب')}</span><b>—</b></div></div>
    <div class="fx" id="tn-fv"></div>
    <p class="typ">${ar('ζ و Mp من نموذج مثالي من الدرجة الثانية دون صفر PI والتأخير؛ التجاوز المقيس على المنحنى أكبر منه.')}</p>
    <p class="msg" id="tn-mv" aria-live="polite"></p>
  </div>
  <div class="dev"><h3><span class="n">3</span>${ar('محلّل التردد ومرشّح Notch')}</h3>
    <div class="row"><button type="button" class="btn" data-a="fft">${ar('شغّل محلّل التردد')}</button><span class="note">${ar('اسحب على المنحنى لقراءة التردد.')}</span></div>
    <div class="plot"><svg id="tn-pf" viewBox="0 0 340 170" role="img" aria-label="الاستجابة الترددية للميكانيكا"></svg></div>
    <div class="row"><button type="button" class="btn" data-a="non" aria-pressed="${p.nOn}">${ar('تفعيل مرشّح Notch')}</button></div>
    <div class="kgrid">${knob('nf', 'تردد Notch', 'Hz', 100, 1500, 5)}</div>
    <div class="fx" id="tn-fn">N(s) = (s² + 2·d·ζ·ω<sub>n</sub>·s + ω<sub>n</sub>²) / (s² + 2·ζ·ω<sub>n</sub>·s + ω<sub>n</sub>²)</div>
  </div>
  <div class="dev"><h3><span class="n">4</span>${ar('حلقة الموضع وخطأ التتبّع')}</h3>
    <div class="kgrid">${knob('Kp', 'كسب حلقة الموضع Kp', '1/s', 10, 400, 5)}</div>
    <div class="row"><button type="button" class="btn pri" data-a="mov">${ar('حركة G01 بسرعة 10 m/min')}</button></div>
    <div class="plot"><svg id="tn-pp" viewBox="0 0 340 160" role="img" aria-label="خطأ التتبّع"></svg></div>
    <div class="read" id="tn-rp"><div><span>${ar('خطأ التتبّع الأقصى')}</span><b>—</b></div><div><span>${ar('تجاوز الموضع')}</span><b>—</b></div></div>
    <div class="fx" id="tn-fp"></div>
    <p class="typ">${ar('القاعدة Kp ≤ ωv/4 تقريبية؛ الحكم للتجاوز المقيس.')}</p>
  </div>
  <div class="dev" id="tn-dec"><h3><span class="n">5</span>${ar('تحقّق من الضبط')}</h3>
    <p class="typ">${ar('قيم نموذجية للتعلّم: fv ≥ 200 Hz، تجاوز السرعة ≤ 25 %، لا تذبذب، Notch ضمن ±5 % من تردد الرنين، خطأ التتبّع ≤ 1.2 mm عند 10 m/min، تجاوز الموضع ≤ 5 %.')}</p>
    <div class="row"><button type="button" class="btn pri" data-a="chk">تحقّق</button></div>
    <p class="msg" id="tn-m" aria-live="polite"></p>
  </div>
  ${foot()}`;
  const q = s => $(s, host);
  const opt = () => ({ratio:num(p.ratio), fv:+p.fv, Ti:+p.Ti, nOn:p.nOn, nf:+p.nf, Kp:+p.Kp});
  /* ---- plotting helpers ---- */
  const X0 = 40, X1 = 330, Y0 = 12;
  function axes(svg, H, xl, yl, xt, yt){
    let s = `<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${H - Y0 - 22}" fill="none" stroke="var(--line)"/>`;
    xt.forEach(([v, x]) => { s += `<line x1="${f1(x)}" y1="${Y0}" x2="${f1(x)}" y2="${H - 22}" stroke="var(--line)" stroke-width=".6"/><text x="${f1(x)}" y="${H - 9}" text-anchor="middle" font-size="9.5" class="txm">${v}</text>`; });
    yt.forEach(([v, y]) => { s += `<line x1="${X0}" y1="${f1(y)}" x2="${X1}" y2="${f1(y)}" stroke="var(--line)" stroke-width=".6"/><text x="${X0 - 4}" y="${f1(y + 3.5)}" text-anchor="end" font-size="9.5" class="txm">${v}</text>`; });
    s += `<text x="${X1 - 2}" y="${Y0 + 11}" text-anchor="end" font-size="9.5" class="txm">${xl}</text><text x="${X0 + 4}" y="${Y0 + 11}" font-size="9.5" class="txm">${yl}</text>`;
    svg.innerHTML = s;
  }
  const poly = (pts, col, w, dash) => `<polyline fill="none" stroke="${col}" stroke-width="${w || 2}" ${dash ? `stroke-dasharray="${dash}"` : ''} stroke-linejoin="round" points="${pts.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ')}"/>`;
  /* ---- 1 · inertia ---- */
  const dW = TN.nTest * 2 * Math.PI / 60, Jt = TN.Jm * (1 + sc.r), tAcc = Jt * dW / TN.Ttest * sc.kacc;
  function drawAcc(done){
    const svg = q('#tn-pa'), H = 120, tm = 0.08, px = t => X0 + t / tm * (X1 - X0), py = n => H - 22 - n / 600 * (H - 22 - Y0);
    axes(svg, H, 't (ms)', 'n (rpm)', [0, 20, 40, 60, 80].map(v => [v, px(v / 1000)]), [0, 250, 500].map(v => [v, py(v)]));
    if (!done) return;
    const pts = []; for (let t = 0; t <= tm; t += 0.002) pts.push([px(t), py(Math.min(TN.nTest, TN.nTest * t / tAcc))]);
    svg.insertAdjacentHTML('beforeend', poly(pts, 'var(--accent)', 2.4) + `<line x1="${f1(px(tAcc))}" y1="${Y0}" x2="${f1(px(tAcc))}" y2="${H - 22}" stroke="var(--cur)" stroke-dasharray="4 3"/><text x="${f1(px(tAcc) + 4)}" y="${py(250)}" font-size="10" fill="var(--cur)">t = ${f1(tAcc * 1000)} ms</text>`);
    const J = TN.Ttest * tAcc / dW;
    q('#tn-fa').innerHTML = `Δω = 2π·${TN.nTest}/60 = ${f2(dW)} rad/s · J = T·t/Δω = ${f1(TN.Ttest)} × ${f4(tAcc)} / ${f2(dW)} = <b>${f2(J * 1e3)} × 10⁻³ kg·m²</b> · ratio = J / Jm − 1 = ?`;
  }
  const f4 = v => fmt(v, 4);
  drawAcc(!!TS.acc);
  /* ---- 2 · velocity ---- */
  function fvFx(){
    const o = opt(), r = isFinite(o.ratio) ? o.ratio : 0, Kv = 2 * Math.PI * o.fv * TN.Jm * (1 + r), wv = 2 * Math.PI * o.fv, z = 0.5 * Math.sqrt(wv * o.Ti / 1000);
    const Mp = z < 1 ? Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)) * 100 : 0;
    q('#tn-fv').innerHTML = `Kvp = 2π·fv·Jm·(1 + ratio) = 2π × ${o.fv} × 2.9×10⁻⁴ × ${f1(1 + r)} = <b>${f3(Kv)} N·m·s/rad</b><br>ζ ≈ ½·√(ω<sub>v</sub>·Ti) = ½·√(${f0(wv)} × ${f4(o.Ti / 1000)}) = <b>${f2(z)}</b> · M<sub>p</sub> = e<sup>−πζ/√(1−ζ²)</sup> = <b>${z < 1 ? f1(Mp) + ' %' : '0 % (ζ ≥ 1)'}</b>`;
  }
  function drawVel(R){
    const svg = q('#tn-pv'), H = 160, tm = 0.055, px = t => X0 + t / tm * (X1 - X0), py = y => H - 22 - y / 2 * (H - 22 - Y0);
    axes(svg, H, 't (ms)', 'n / n*', [0, 10, 20, 30, 40, 50].map(v => [v, px(v / 1000)]), [[0, py(0)], ['1.0', py(1)], ['2.0', py(2)]]);
    if (!R) return;
    const cmd = [[px(0), py(0)], [px(0), py(1)], [px(tm), py(1)]], pts = [];
    R.t.forEach((t, i) => { if (t >= 0 && t <= tm) pts.push([px(t), py(Math.max(-0.1, Math.min(2.08, R.y[i])))]); });
    svg.insertAdjacentHTML('beforeend', poly(cmd, 'var(--muted)', 1.4, '5 4') + poly(pts, R.osc ? 'var(--bad)' : 'var(--accent)', 2.2));
  }
  function velRead(R){
    const b = $$('#tn-rv b', host);
    b[0].textContent = f1(R.os) + ' %'; b[0].className = R.os <= 25 ? 'ok' : 'bad';
    b[1].textContent = R.osc ? '—' : f1(R.ts) + ' ms';
    b[2].textContent = R.osc ? '± ' + f1(R.rip) + ' N·m' : '0'; b[2].className = R.osc ? 'bad' : 'ok';
    say(q('#tn-mv'), R.osc ? ar('أزيز عالٍ والعزم يتذبذب ±' + f1(R.rip) + ' N·m: قمة الرنين الميكانيكي ترفع كسب الحلقة فتفقد الاستقرار. خفّض الكسب، ثم اقرأ الرنين على المحلّل.') : R.os > 25 ? ar('التجاوز ' + f1(R.os) + ' %: زد زمن التكامل Ti أو راجع نسبة القصور.') : ar('استجابة مستقرة: التجاوز ' + f1(R.os) + ' % وزمن الاستقرار ' + f1(R.ts) + ' ms.'), R.osc || R.os > 25 ? 'bad' : 'ok');
  }
  fvFx(); drawVel(null);
  /* ---- 3 · analyzer ---- */
  const fMin = 50, fMax = 2000, lx = f => X0 + Math.log(f / fMin) / Math.log(fMax / fMin) * (X1 - X0), fx = x => fMin * Math.pow(fMax / fMin, (x - X0) / (X1 - X0));
  const HF = 170, dbY = d => Y0 + (50 - d) / 90 * (HF - 22 - Y0);
  let fftOn = !!TS.fft, cursorF = null;
  function drawFft(){
    const svg = q('#tn-pf');
    axes(svg, HF, 'f (Hz, log)', 'dB', [50, 100, 200, 500, 1000, 2000].map(v => [v, lx(v)]), [40, 20, 0, -20, -40].map(v => [v, dbY(v)]));
    if (!fftOn) return;
    const pm = [], pn = [], pt = [];
    for (let x = X0; x <= X1; x += 1.5){ const f = fx(x), m = tnMag(sc, f), n = notchMag(+p.nf, f); pm.push([x, dbY(Math.max(-40, Math.min(50, m)))]); if (p.nOn){ pn.push([x, dbY(Math.max(-40, n))]); pt.push([x, dbY(Math.max(-40, Math.min(50, m + n)))]); } }
    let h = poly(pm, 'var(--accent)', 2.2);
    if (p.nOn) h += poly(pn, 'var(--muted)', 1.4, '4 3') + poly(pt, 'var(--good)', 2);
    if (cursorF){ const x = lx(cursorF), m = tnMag(sc, cursorF); h += `<line x1="${f1(x)}" y1="${Y0}" x2="${f1(x)}" y2="${HF - 22}" stroke="var(--cur)" stroke-width="1.5"/><rect x="${f1(Math.min(x + 4, X1 - 92))}" y="${Y0 + 16}" width="88" height="30" rx="4" fill="var(--panel)" stroke="var(--cur)"/><text x="${f1(Math.min(x + 8, X1 - 88))}" y="${Y0 + 28}" font-size="10" fill="var(--ink)">${Math.round(cursorF)} Hz</text><text x="${f1(Math.min(x + 8, X1 - 88))}" y="${Y0 + 41}" font-size="10" fill="var(--ink)">${f1(m)} dB</text>`; }
    svg.insertAdjacentHTML('beforeend', h);
  }
  drawFft();
  const pf = q('#tn-pf');
  const cur = e => { if (!fftOn) return; const pt = svgPt(pf, e); if (pt.x < X0 || pt.x > X1) return; cursorF = fx(pt.x); drawFft(); };
  pf.addEventListener('pointerdown', e => { cur(e); try { pf.setPointerCapture(e.pointerId); } catch (er){} });
  pf.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'mouse') cur(e); });
  function nFx(){ q('[data-a="non"]').setAttribute('aria-pressed', p.nOn ? 'true' : 'false'); q('#tn-fn').innerHTML = `N(s) = (s² + 2·d·ζ·ω<sub>n</sub>·s + ω<sub>n</sub>²) / (s² + 2·ζ·ω<sub>n</sub>·s + ω<sub>n</sub>²) · ω<sub>n</sub> = 2π × ${p.nf} = ${f0(2 * Math.PI * p.nf)} rad/s · ζ = ${f2(1 / (2 * TN.Q))} · d = ${TN.depth} (${f0(20 * Math.log10(TN.depth))} dB) · ${p.nOn ? 'ON' : 'OFF'}`; }
  nFx();
  /* ---- 4 · position ---- */
  function fpFx(){ q('#tn-fp').innerHTML = `e = v / Kp = ${f1(TN.v)} mm/s ÷ ${p.Kp} 1/s = <b>${f2(TN.v / p.Kp)} mm</b> · Kp ≤ ω<sub>v</sub>/4 = 2π × ${p.fv} / 4 = ${f0(2 * Math.PI * p.fv / 4)} 1/s`; }
  function drawPos(R, Rs){
    const svg = q('#tn-pp'), H = 160, tm = 0.3, emax = Math.max(1.5, Math.ceil(TN.v / Math.max(10, p.Kp) * 1.2 * 2) / 2), px = t => X0 + t / tm * (X1 - X0), py = e => H - 22 - e / emax * (H - 22 - Y0);
    axes(svg, H, 't (ms)', 'e (mm)', [0, 100, 200, 300].map(v => [v, px(v / 1000)]), [[0, py(0)], [f1(emax / 2), py(emax / 2)], [f1(emax), py(emax)]]);
    if (!R) return;
    const pts = []; R.t.forEach((t, i) => { if (t >= 0 && t <= tm && i % 2 === 0) pts.push([px(t), py(Math.max(-emax * 0.1, Math.min(emax, R.e[i])))]); });
    svg.insertAdjacentHTML('beforeend', `<line x1="${X0}" y1="${f1(py(1.2))}" x2="${X1}" y2="${f1(py(1.2))}" stroke="var(--bad)" stroke-dasharray="5 4"/><text x="${X1 - 4}" y="${f1(py(1.2) - 4)}" text-anchor="end" font-size="9.5" fill="var(--bad)">1.2 mm</text>` + poly(pts, 'var(--accent)', 2.2));
    const b = $$('#tn-rp b', host); b[0].textContent = f2(R.ef) + ' mm'; b[0].className = R.ef <= 1.2 ? 'ok' : 'bad';
    b[1].textContent = Rs.osc ? 'تذبذب' : f1(Rs.os) + ' %'; b[1].className = !Rs.osc && Rs.os <= 5 ? 'ok' : 'bad';
  }
  fpFx(); drawPos(null);
  /* ---- controls ---- */
  host.addEventListener('input', e => {
    const k = e.target.dataset && e.target.dataset.k; if (!k) return;
    p[k] = k === 'ratio' ? e.target.value : +e.target.value;
    const sp = $(`[data-v="${k}"]`, host); if (sp) sp.textContent = p[k];
    fvFx(); fpFx(); if (k === 'nf'){ nFx(); drawFft(); } save();
  });
  IL.onAct(host, '[data-a]', b => {
    const a = b.dataset.a, o = opt();
    if (a === 'acc'){ TS.acc = true; drawAcc(true); save(); return; }
    if (a === 'vel'){ const R = tnSim(sc, o, 'vel'); drawVel(R); velRead(R); return; }
    if (a === 'fft'){ fftOn = true; TS.fft = true; drawFft(); save(); return; }
    if (a === 'non'){ p.nOn = !p.nOn; nFx(); drawFft(); save(); return; }
    if (a === 'mov'){ const R = tnSim(sc, o, 'ramp'), Rs = tnSim(sc, o, 'pstep'); drawPos(R, Rs); return; }
    if (a === 'chk') return check();
  });
  function check(){
    const m = q('#tn-m'), o = opt();
    if (!TS.acc) return say(m, ar('شغّل اختبار التسارع أولًا لتقدير نسبة القصور الذاتي.'), 'bad');
    const okR = near(o.ratio, sc.r, 0.1); mark($('[data-k="ratio"]', host), okR);
    if (!okR) return say(m, ar('نسبة القصور غير صحيحة: ratio = (T·t/Δω) ÷ Jm − 1 من نتيجة اختبار التسارع.'), 'bad');
    if (o.fv < 200) return say(m, ar('كسب حلقة السرعة ' + o.fv + ' Hz أقل من المطلوب 200 Hz: المحور بطيء ويضعف أمام اضطراب القطع.'), 'bad');
    const R = tnSim(sc, o, 'vel'); drawVel(R); velRead(R);
    if (R.osc && !o.nOn) return say(m, ar('المحور يتذبذب عند الرنين الميكانيكي: شغّل المحلّل وضع مرشّح Notch عند قمة الرنين.'), 'bad');
    if (!o.nOn || Math.abs(o.nf - sc.fr) > sc.fr * 0.05) return say(m, ar('مرشّح Notch ليس عند قمة الرنين: اقرأ تردد القمة على المحلّل وضعه ضمن ±5 %.'), 'bad');
    if (R.osc) return say(m, ar('ما زال المحور يتذبذب: خفّض fv قليلًا.'), 'bad');
    if (R.os > 25) return say(m, ar('تجاوز السرعة ' + f1(R.os) + ' % أكبر من 25 %: زد زمن التكامل Ti.'), 'bad');
    const Rr = tnSim(sc, o, 'ramp'), Rs = tnSim(sc, o, 'pstep'); drawPos(Rr, Rs);
    if (Rr.ef > 1.2) return say(m, ar('خطأ التتبّع ' + f2(Rr.ef) + ' mm أكبر من 1.2 mm: ارفع Kp.'), 'bad');
    if (Rs.osc || Rs.os > 5) return say(m, ar('تجاوز الموضع ' + f1(Rs.os) + ' % أكبر من 5 %: خفّض Kp.'), 'bad');
    say(m, ar('ضبط سليم: ratio ' + f1(o.ratio) + '، fv ' + o.fv + ' Hz بتجاوز ' + f1(R.os) + ' %، Notch عند ' + o.nf + ' Hz (الرنين ' + sc.fr + ' Hz)، وخطأ التتبّع ' + f2(Rr.ef) + ' mm.'), 'ok');
    win('tuning', 'أحسنت: قدّرت القصور الذاتي، ورفعت الكسب بعد إزالة الرنين بمرشّح Notch، وضبطت كسب الموضع ضمن الحدود.');
  }
  newScenario(host, 'tuning', () => { S.tn = {sc:genTN()}; });
  demo(host, 'tuning', async () => {
    const setK = async (k, v) => { const el = $(`[data-k="${k}"]`, host); await dSet(el, v); };
    await dClick(q('[data-a="acc"]')); await sleep(700 / DSPEED);
    await setK('ratio', f1(TN.Ttest * tAcc / dW / TN.Jm - 1));
    await setK('fv', 160); await dClick(q('[data-a="vel"]')); await sleep(900 / DSPEED);
    await setK('fv', 230); await dClick(q('[data-a="vel"]')); await sleep(1200 / DSPEED);
    await dClick(q('[data-a="fft"]')); cursorF = sc.fr; drawFft(); await sleep(1200 / DSPEED);
    await dClick(q('[data-a="non"]')); await setK('nf', sc.fr);
    await setK('fv', 220); await setK('Ti', 20); await dClick(q('[data-a="vel"]')); await sleep(900 / DSPEED);
    await setK('Kp', 160); await dClick(q('[data-a="mov"]')); await sleep(900 / DSPEED);
    await dClick(q('[data-a="chk"]')); await sleep(800 / DSPEED);
  });
};

/* =====================================================================
   TAB 4 · cnc (l13): complete axis repair, alarm → safety → diagnosis → repair → verification
   ===================================================================== */
const CN_T = {
  hist:{n:'سجل الإنذارات وشاشة المراقبة', dev:'DRIVE MONITOR', col:'#3c4449'},
  enc:{n:'الإنكودر: التغذية والبطارية والإشارات', dev:'ENCODER / SCOPE', col:'#2e6db4'},
  meg:{n:'ميجر 500 V على المحرك (الإنكودر والفرامل مفصولان)', dev:'INSULATION TESTER 500 V', col:'#f2c230', dead:true},
  megc:{n:'ميجر 500 V على كابل القدرة', dev:'INSULATION TESTER 500 V', col:'#f2c230', dead:true},
  res:{n:'مقاومة الملفات U-V و V-W و W-U', dev:'MICRO-OHMMETER', col:'#f2c230', dead:true},
  bemf:{n:'Back-EMF: دوّر المحرك عند 1000 rpm', dev:'SCOPE · 3 × V rms', col:'#2e6db4', dead:true, zs:true},
  encc:{n:'استمرارية كابل الإنكودر مع ثني السلسلة', dev:'CABLE TESTER', col:'#2e6db4', dead:true},
  brk:{n:'الفرامل: جهد التحرير وزمنه', dev:'DMM · DC V · BRAKE', col:'#f2c230', zs:true},
  hold:{n:'عزم تثبيت الفرامل بمفتاح العزم', dev:'TORQUE WRENCH', col:'#8d969b', dead:true, zs:true},
  dio:{n:'اختبار الديود لخرج الدرايف', dev:'DMM · DIODE TEST', col:'#f2c230', dead:true},
  rgn:{n:'مقاومة الكبح P–B', dev:'DMM · OHM', col:'#f2c230', dead:true},
  megenc:{n:'ميجر على الإنكودر', trap:'توقّف: الميجر يتلف إلكترونيات الإنكودر، فلا يُختبر الإنكودر بالميجر أبدًا.'},
  megdrv:{n:'ميجر على خرج الدرايف', trap:'توقّف: الميجر يتلف دوائر الدرايف؛ اختبر المحرك والكابل بعد فصلهما عن الدرايف.'}
};
function cnNormal(ax, t){
  const A = AX[ax], j = (a, b, d) => fmt(rnd(a, b), d || 0), rr = () => f2(A.R * rnd(0.995, 1.005)), ke = () => f1(A.Ke * rnd(0.99, 1.01));
  return {
    hist:['no active alarm', 'load ' + j(25, 45) + ' %'],
    enc:ax === 'X' ? ['5.02 V · battery ' + j(3.52, 3.62, 2) + ' V', 'CRC errors 0'] : ax === 'Y' ? ['5.03 V · A/B 90° · Z 1/rev', 'count errors 0'] : ax === 'Z' ? ['5.01 V · EnDat 2.2 OK', 'CRC errors 0'] : ['EXC 7.0 V rms 10 kHz', 'SIN/COS 3.5 V rms (ratio 0.5)'],
    meg:['U/V/W-PE ' + j(800, 2500) + ' MΩ', '@500 V · 1 min'],
    megc:['U/V/W-PE ' + j(2000, 5000) + ' MΩ', 'core-core > 1000 MΩ'],
    res:['U-V ' + rr() + ' · V-W ' + rr() + ' Ω', 'W-U ' + rr() + ' Ω (' + A.R + ' Ω typ.)'],
    bemf:['U-V ' + ke() + ' · V-W ' + ke() + ' · W-U ' + ke() + ' V', '@1000 rpm · ' + f1(4 * 1000 / 60) + ' Hz'],
    encc:ax === 'A' ? ['EXC ' + j(17, 19, 1) + ' · SIN ' + j(40, 44, 1) + ' Ω', 'COS ' + j(40, 44, 1) + ' Ω'] : ['all pairs < 1 Ω flexed', 'shield 360° ' + j(0.1, 0.3, 1) + ' Ω'],
    brk:A.brake ? ['PSU ' + j(23.9, 24.2, 1) + ' · motor ' + j(23.3, 23.8, 1) + ' V', 'release ' + j(74, 86) + ' ms · coil ' + j(39.5, 41, 1) + ' Ω'] : ['no brake on ' + ax, '—'],
    hold:A.brake ? ['slip at ' + j(13.2, 14.5, 1) + ' N·m', '≥ 12 N·m ✓'] : ['no brake on ' + ax, '—'],
    dio:['→P ' + j(0.33, 0.37, 2) + ' · N→ ' + j(0.33, 0.37, 2) + ' V', 'reverse OL ×6'],
    rgn:['P-B ' + j(99, 102, 1) + ' Ω', '100 Ω 400 W']
  }[t];
}
const CN_S = {
  zmotor:{ax:'Z', code:'AL.oc', rep:'المحور Z يتوقف بإنذار عند النزول السريع منذ تسرّب سائل التبريد أمس.', key:['meg'],
    r:() => ({hist:['AL.oc Z ×3 · rapid down', 'I peak ' + Math.round(rnd(55, 62)) + ' A → trip'], meg:['U/V/W-PE ' + f2(rnd(0.2, 0.6)) + ' MΩ ✗', 'coolant in connector']}),
    cause:'عزل ملفات محرك Z انهار بدخول سائل التبريد', fix:'استبدل محرك Z وأصلح مانع تسرّب سائل التبريد',
    steps:['افصل موصّلات القدرة والإنكودر والفرامل', 'فكّ المحرك من الوصلة والشفة', 'ركّب المحرك الجديد وأحكم الوصلة بعزم الشد', 'اختبر عزل المحرك الجديد بالميجر 500 V', 'أعد الموصّلات مع سدادات الحماية من السائل'],
    bad:[['جفّف المحرك بمسدس هواء ساخن وشغّله فورًا', 'عزل 0.4 MΩ بعد سائل التبريد لا يُعتمد عليه بتجفيف سريع؛ المحرك يُستبدل.']],
    need:{ref:true, brake:true}, why:'عزل محرك Z أقل من 1 MΩ والكابل سليم: سائل التبريد دخل الموصّل والملفات.'},
  xbat:{ax:'X', code:'AL.EnB', rep:'بعد عطلة نهاية الأسبوع ظهر إنذار البطارية ثم ضاع الصفر المرجعي للمحور X.', key:['enc'],
    r:() => ({hist:['AL.EnB X → multi-turn lost', 'absolute position invalid'], enc:['5.02 V · battery ' + f2(rnd(2.55, 2.85)) + ' V ✗', 'multi-turn data lost']}),
    cause:'بطارية الإنكودر المطلق للمحور X فارغة', fix:'استبدل البطارية وتغذية التحكم موصولة',
    steps:['تأكّد أن تغذية التحكم 24 V موصولة', 'افتح غطاء حامل البطارية', 'ركّب بطارية 3.6 V من النوع نفسه', 'امسح إنذار البطارية من الدرايف'],
    bad:[['افصل تغذية التحكم ثم استبدل البطارية', 'فصل تغذية التحكم أثناء الاستبدال يمسح عدّ اللفات المطلق في الإنكودر.']],
    need:{ref:true}, why:'جهد البطارية دون 3.1 V فضاع عدّ اللفات المطلق عند فصل التغذية.'},
  ycable:{ax:'Y', code:'AL.EnC', rep:'القطع تخرج بخطأ يتراكم في بُعد Y، ثم ظهر إنذار متقطّع.', key:['encc', 'enc'],
    r:() => ({hist:['AL.EnC Y intermittent', 'at Y > ' + Math.round(rnd(260, 340)) + ' mm'], enc:['5.03 V · A− missing at times ✗', 'count errors ' + Math.round(rnd(20, 60))], encc:['A− open when chain flexed ✗', 'shield OK']}),
    cause:'سلك A− مكسور في كابل الإنكودر داخل سلسلة الكابلات', fix:'استبدل كابل الإنكودر بكابل مرن مجدول الأزواج',
    steps:['افصل الكابل من الدرايف والمحرك', 'مدّ كابلًا مرنًا مجدول الأزواج بعيدًا عن كابلات القدرة', 'اربط الحجب 360° في الطرفين', 'اختبر الاستمرارية مع ثني السلسلة'],
    bad:[['اربط السلكين المقطوعين بشريط لاصق داخل السلسلة', 'الوصلة داخل السلسلة تنكسر ثانية وتلتقط التشويش.']],
    need:{ref:true}, why:'القناة A− تنقطع عند ثني السلسلة فتضيع نبضات العدّ ويتراكم الخطأ.'},
  zbrake:{ax:'Z', code:'AL.oL', rep:'المحور Z بطيء في الصعود، والمحرك ساخن جدًا مع رائحة احتكاك.', key:['brk'],
    r:() => ({hist:['AL.oL Z · load ' + Math.round(rnd(150, 170)) + ' % up', 'motor ' + Math.round(rnd(112, 124)) + ' °C'], brk:['PSU 24.1 · motor ' + f1(rnd(16.5, 18.4)) + ' V ✗', 'release > 300 ms ✗ · coil 40.2 Ω']}),
    cause:'جهد الفرامل منخفض عند المحرك فلا تتحرّر كاملًا', fix:'أصلح طرف تغذية الفرامل المرتخي',
    steps:['تتبّع الجهد من المصدر إلى المحرك نقطة نقطة', 'نظّف الطرف المرتخي X12:3 واربطه بعزم الشد', 'قِس جهد الفرامل عند المحرك أثناء التحرير', 'قِس زمن التحرير ≈ 80 ms'],
    bad:[['ارفع جهد مصدر الفرامل إلى 30 V', 'رفع الجهد فوق 24 V +10 % يحرق ملف الفرامل ولا يعالج الطرف المرتخي.']],
    need:{brake:true}, why:'الملف سليم لكن الجهد عند المحرك دون 21.6 V: الفرامل تحتك وتُحمّل المحرك.'},
  zhold:{ax:'Z', code:'AL.PoS', rep:'عند فصل التغذية ينزل رأس Z ببطء عدة مليمترات.', key:['hold'],
    r:() => ({hist:['AL.PoS Z at servo OFF', 'drop ' + f1(rnd(2.5, 4.5)) + ' mm in 2 s'], hold:['slip at ' + f1(rnd(5.8, 7.5)) + ' N·m ✗', 'oil on friction disc']}),
    cause:'بطانة الفرامل ملوّثة بالزيت فضعف عزم التثبيت', fix:'استبدل وحدة الفرامل وسدادة العمود التالفة',
    steps:['فكّ المحرك والرأس مستند إلى الكتلة', 'استبدل وحدة الفرامل', 'استبدل سدادة العمود التالفة', 'قِس عزم التثبيت ≥ 12 N·m'],
    bad:[['نظّف البطانة بمذيب وأعد تركيبها', 'البطانة المشبعة بالزيت لا تستعيد عزمها بالتنظيف.']],
    need:{ref:true, brake:true}, why:'عزم التثبيت أقل من 12 N·m وعلى القرص زيت: الفرامل لا تمسك الحمل العمودي.'},
  xdrive:{ax:'X', code:'AL.oc', rep:'المحور X يعطي إنذارًا فور Servo ON، حتى بعد مسحه.', key:['dio'],
    r:() => ({hist:['AL.oc X at servo ON', 'also with motor cable off ✗'], dio:['W→P ' + f3(rnd(0.001, 0.004)) + ' · P→W ' + f3(rnd(0.001, 0.004)) + ' ✗', 'others ' + f2(rnd(0.33, 0.37)) + ' V / OL']}),
    cause:'IGBT في قصر داخل درايف X', fix:'استبدل درايف X بعد فحص المحرك والكابل',
    steps:['احفظ نسخة من بارامترات الدرايف', 'افحص المحرك والكابل بالميجر', 'ركّب الدرايف الجديد واربط الأطراف بعزم الشد', 'أعد توصيل الكابلات والحجب'],
    bad:[['ركّب الدرايف الجديد قبل فحص المحرك والكابل', 'إن كان سبب القصر في المحرك أو الكابل فسيتلف الدرايف الجديد فورًا.']],
    need:{params:true}, why:'الطور W يقرأ نحو 0 V في الاتجاهين وكابل المحرك مفصول: IGBT في قصر.'},
  zregen:{ax:'Z', code:'AL.ov', rep:'إنذار جهد زائد على Z عند توقّف النزول السريع.', key:['rgn'],
    r:() => ({hist:['AL.ov Z at stop · Vbus ' + Math.round(rnd(801, 812)) + ' V', 'regen load 0 %'], rgn:['P-B OL ✗', 'resistor housing cold']}),
    cause:'مقاومة الكبح لدرايف Z مفتوحة', fix:'استبدل مقاومة الكبح بأخرى 100 Ω / 400 W',
    steps:['افصل أسلاك المقاومة القديمة', 'ركّب مقاومة 100 Ω / 400 W على سطح يبدّد الحرارة', 'قِس P–B ≈ 100 Ω', 'اضبط بارامتر قدرة مقاومة الكبح على 400 W'],
    bad:[['اترك المقاومة مفصولة وخفّض التسارع فقط', 'دون مقاومة يعود AL.ov عند أي فرملة على المحور العمودي.']],
    need:{}, why:'P–B مفتوحة والناقل يتجاوز 800 V عند التوقف: طاقة النزول لا تُصرَّف.'},
  xdemag:{ax:'X', code:'AL.oL', rep:'بعد اصطدام قوي الأسبوع الماضي، المحور X يسخن ويظهر إنذار الحمل الزائد.', key:['bemf'],
    r:() => { const k = rnd(0.82, 0.87); return {hist:['AL.oL X · I ' + f1(rnd(4.6, 5.2)) + ' A light cut', 'load +' + Math.round((1 / k - 1) * 100) + ' % vs history'], bemf:['U-V ' + f1(72 * k) + ' · V-W ' + f1(72 * k * 0.998) + ' · W-U ' + f1(72 * k * 1.002) + ' V ✗', '@1000 rpm · 66.7 Hz (72 V typ.)']}; },
    cause:'مغانط محرك X فقدت جزءًا من مغنطتها', fix:'استبدل محرك X',
    steps:['افصل موصّلات القدرة والإنكودر', 'فكّ المحرك من الوصلة', 'ركّب المحرك الجديد وأحكم الوصلة', 'اختبر عزل المحرك الجديد بالميجر 500 V'],
    bad:[['ارفع حد التيار ليتحمّل المحرك الحمل', 'رفع حد التيار يسخّن المحرك أكثر ويزيد فقد المغنطة.']],
    need:{ref:true}, why:'Back-EMF أقل من 72 V بنحو 15 % في الأطوار الثلاثة بالتساوي: المغانط ضعفت.'},
  aresolver:{ax:'A', code:'AL.EnC', rep:'الطاولة الدوّارة A تعطي إنذار الإنكودر عند التشغيل بعد غسيل الماكينة.', key:['encc', 'enc'],
    r:() => ({hist:['AL.EnC A at power up', 'resolver signal lost'], enc:['EXC 7.0 V rms 10 kHz', 'SIN 3.5 V · COS 0.0 V ✗'], encc:['EXC ' + f1(rnd(17, 19)) + ' · SIN ' + f1(rnd(40, 44)) + ' Ω', 'COS OL ✗ (motor side)']}),
    cause:'ملف COS في الريزولفر مفتوح', fix:'استبدل الريزولفر ثم اضبط إزاحة التبديل',
    steps:['علّم وضع الريزولفر القديم على الجسم', 'فكّ الريزولفر التالف', 'ركّب الريزولفر الجديد', 'قِس مقاومات EXC و SIN و COS'],
    bad:[['اربط طرفي COS بطرفي SIN ليعمل المحور مؤقتًا', 'دون إشارة COS لا يعرف الدرايف زاوية الدوّار فيفقد التحكم بالمحرك.']],
    need:{offset:true, ref:true}, why:'ملف COS مفتوح وإشارته صفر بينما EXC و SIN سليمتان: الريزولفر تالف.'}
};
const CN_V = [['params', 'حمّل البارامترات المحفوظة في الدرايف'], ['offset', 'اضبط إزاحة التبديل Commutation offset'], ['ref', 'أعد ضبط المرجع (Homing أو الصفر المطلق)'], ['brake', 'اختبر الفرامل: التحرير والتثبيت']];
const CN_VM = {
  params:'الدرايف الجديد بضبط المصنع: دون البارامترات لا يعرف المحرك ولا الإنكودر ولا الكسب.',
  offset:'الإنكودر ركِّب في زاوية جديدة على العمود: دون ضبط الإزاحة يضعف العزم ويهتز المحرك أو يندفع.',
  ref:'موضع المحور بالنسبة إلى الماكينة لم يعد معروفًا: دون إعادة المرجع ستُقطع القطعة في مكان خاطئ.',
  brake:'عُمل على الفرامل أو المحور العمودي: تحقّق من التحرير والتثبيت قبل التشغيل وإلا قد يسقط المحور.'
};
const CN_VX = {params:'البارامترات لم تتغيّر في هذا الإصلاح، فتحميلها غير لازم.', offset:'الإنكودر لم يتحرك على العمود، فضبط الإزاحة غير لازم هنا.', ref:'موضع المحور لم يضع في هذا الإصلاح، فإعادة المرجع غير لازمة.', brake:'هذا الإصلاح لم يمس الفرامل، فاختبارها غير لازم الآن.'};
const CN_STG = ['الإنذار', 'الأمان', 'التشخيص', 'الإصلاح', 'التحقق'];
function genCN(){
  const root = pick(Object.keys(CN_S)), s = CN_S[root];
  const others = shuffle(Object.keys(CN_S).filter(k => k !== root)).slice(0, 3);
  const fixes = shuffle([root].concat(shuffle(Object.keys(CN_S).filter(k => k !== root && CN_S[k].ax === s.ax).concat(others)).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3)));
  return {root, rd:s.r(), cs:shuffle([root].concat(others)), fx:fixes, ord:shuffle(s.steps.map((t, i) => 's' + i).concat(s.bad.map((b, i) => 'b' + i)))};
}
function machineSvg(ax, hi){
  const g = a => hi === a ? ' class="glow"' : '';
  return `<svg viewBox="0 0 400 250" role="img" aria-label="ماكينة CNC رأسية ولوحة التحكم">
  <rect x="0" y="232" width="400" height="18" fill="var(--board-line)"/>
  <rect x="20" y="196" width="240" height="38" rx="4" fill="var(--ral)" stroke="var(--ral-d)" stroke-width="2"/>
  <rect x="170" y="30" width="70" height="168" rx="4" fill="var(--ral)" stroke="var(--ral-d)" stroke-width="2"/>
  <g${g('Z')}><rect x="104" y="${ax === 'Z' ? 60 : 56}" width="84" height="56" rx="6" fill="#d7dad5" stroke="var(--ral-d)" stroke-width="2"/><rect x="128" y="18" width="36" height="40" rx="4" fill="#2e3439"/><text x="146" y="42" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">Z</text><rect x="136" y="116" width="20" height="26" fill="#8d969b"/><path d="M140 142 h12 l-3 16 h-6z" fill="#5d666c"/></g>
  <g${g('Y')}><rect x="44" y="176" width="190" height="20" rx="3" fill="#b9bdb6" stroke="var(--ral-d)"/><rect x="236" y="178" width="26" height="16" rx="3" fill="#2e3439"/><text x="249" y="190" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">Y</text></g>
  <g${g('X')}><rect x="34" y="160" width="210" height="16" rx="3" fill="#9ea39d" stroke="#6b7378"/><rect x="6" y="160" width="28" height="16" rx="3" fill="#2e3439"/><text x="20" y="172" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">X</text></g>
  <g${g('A')}><rect x="60" y="138" width="66" height="22" rx="4" fill="#7d858a"/><ellipse cx="93" cy="138" rx="30" ry="6" fill="#b4b8bb" stroke="#6b7378"/><text x="93" y="153" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">A</text></g>
  <rect x="274" y="40" width="118" height="160" rx="8" fill="#3c4449" stroke="#22282b" stroke-width="2"/>
  <rect x="284" y="50" width="98" height="70" rx="3" fill="#0b1410"/>
  <text x="290" y="64" font-size="9" font-weight="700" fill="#ffd23f">ALARM</text>
  <text x="290" y="80" font-size="9" fill="#7dff9a" id="cn-scr1"></text><text x="290" y="94" font-size="9" fill="#7dff9a" id="cn-scr2"></text><text x="290" y="108" font-size="9" fill="#7dff9a" id="cn-scr3"></text>
  ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${286 + (i % 4) * 24}" y="${130 + Math.floor(i / 4) * 18}" width="18" height="12" rx="2" fill="#5d666c"/>`).join('')}
  <circle cx="300" cy="182" r="10" fill="#d32f2f" stroke="#e1c21a" stroke-width="3"/><text x="318" y="186" font-size="8.5" fill="#e9eef1">E-STOP</text>
  </svg>`;
}
BUILD.cnc = host => {
  if (!S.cn || !S.cn.sc) S.cn = {sc:genCN()};
  const CS = S.cn, sc = CS.sc, s = CN_S[sc.root];
  if (!CS.st) CS.st = {stage:0, ax:'', safe:{}, meas:{}, cause:'', fix:'', ord:[], ver:{}, on:false, done:false};
  const P = CS.st;
  host.innerHTML = `<div class="trk" id="cn-trk">${CN_STG.map((t, i) => `<span data-i="${i}">${i + 1}. ${t}</span>`).join('')}</div><div id="cn-body" class="body"></div>${foot()}`;
  const q = sl => $(sl, host);
  const val = t => sc.rd[t] || (sc.rd[t] = cnNormal(s.ax, t));
  const logLi = (k, v) => `<li class="${/✗/.test(v) ? 'bad' : ''}"><b>${ar(CN_T[k].n)}:</b> <bdi dir="ltr" class="mono">${esc(v)}</bdi></li>`;
  function trk(){ $$('#cn-trk span', host).forEach((sp, i) => { sp.className = i < P.stage || P.done ? 'ok' : i === P.stage ? 'on' : ''; }); }
  function render(){
    trk();
    const b = q('#cn-body'); let h = '';
    /* 1 · alarm */
    h += `<div class="dev${P.stage > 0 ? ' ok' : ''}"><h3><span class="n">1</span>${ar('الإنذار وبلاغ المشغّل')}</h3>
      <div class="grid2"><div class="stage" style="background:var(--panel)">${machineSvg(s.ax, P.stage > 0 ? s.ax : '')}</div><div class="stage">${cabSvg(s.ax, s.code)}</div></div>
      <p style="font-weight:600;line-height:1.8">${ar('بلاغ المشغّل: ' + s.rep)}</p>
      ${P.stage === 0 ? `<div class="row"><span class="note">${ar('أي محور تعطّل؟')}</span><div class="sgm" id="cn-ax">${['X', 'Y', 'Z', 'A'].map(a => `<button type="button" data-ax="${a}" aria-pressed="false">${a}</button>`).join('')}</div></div>` : `<p class="msg ok">${ar('المحور ' + s.ax + ' · ' + s.code)}</p>`}
      <p class="msg" id="cn-m0" aria-live="polite"></p></div>`;
    /* 2 · safety */
    if (P.stage >= 1){
      const sf = P.safe;
      h += `<div class="dev${P.stage > 1 ? ' ok' : ''}"><h3><span class="n">2</span>${ar('اجعل الماكينة آمنة')}</h3>
      <div class="loto">
        <button type="button" class="btn${sf.sup ? ' ok' : ''}" data-f="sup">${ar('أنزل الرأس Z على كتلة دعم ميكانيكية')}</button>
        <button type="button" class="btn${sf.estop ? ' ok' : ''}" data-f="estop">${ar('أوقف البرنامج واضغط E-STOP')}</button>
        <button type="button" class="btn${sf.loto ? ' ok' : ''}" data-f="loto">${ar('افصل القدرة الرئيسية Q1 وضع القفل والبطاقة')}</button>
        <button type="button" class="btn${sf.wait ? ' ok' : ''}" data-f="wait">${ar('انتظر 4 min')}</button>
        <button type="button" class="btn${sf.bus ? ' ok' : ''}" data-f="bus">${ar('قِس P–N على درايف ' + s.ax)}</button>
      </div><p class="note">${ar('تغذية التحكم 24 V تبقى موصولة لقراءة السجل والإنكودر؛ القدرة الرئيسية وحدها مقفلة.')}</p>
      <p class="msg" id="cn-m1" aria-live="polite"></p></div>`;
    }
    /* 3 · diagnosis */
    if (P.stage >= 2){
      h += `<div class="dev${P.stage > 2 ? ' ok' : ''}"><h3><span class="n">3</span>${ar('شخّص بالقياس')}</h3>
      <div class="chipline">${Object.keys(CN_T).map(k => `<button type="button" class="btn${P.meas[k] ? ' done' : ''}" data-t="${k}">${ar(CN_T[k].n)}</button>`).join('')}</div>
      <div class="stage" style="max-width:420px;margin:0 auto;width:100%" id="cn-inst">${cnInst('hist', ['----', ''])}</div>
      <p class="msg" id="cn-m2" aria-live="polite"></p>
      <ul class="log" id="cn-log">${Object.keys(P.meas).map(k => logLi(k, P.meas[k])).join('')}</ul>
      ${sel('cause', 'السبب الجذري', sc.cs.map(k => [k, CN_S[k].cause]), P.cause)}
      ${P.stage === 2 ? `<div class="row"><button type="button" class="btn pri" data-a="cause">${ar('ثبّت السبب')}</button></div>` : ''}
      <p class="msg" id="cn-m3" aria-live="polite">${P.stage > 2 ? ar('صحيح: ' + s.why) : ''}</p></div>`;
    }
    /* 4 · repair */
    if (P.stage >= 3){
      h += `<div class="dev${P.stage > 3 ? ' ok' : ''}"><h3><span class="n">4</span>${ar('الإصلاح')}</h3>
      ${sel('fix', 'الإصلاح', sc.fx.map(k => [k, CN_S[k].fix]), P.fix)}
      <p class="note">${ar('ثم نفّذ خطوات الإصلاح بالترتيب الصحيح بالنقر عليها.')}</p>
      <div class="ord" id="cn-ord">${sc.ord.map(k => { const i = P.ord.indexOf(k); const t = k[0] === 's' ? s.steps[+k.slice(1)] : s.bad[+k.slice(1)][0]; return `<button type="button" class="btn${i >= 0 ? ' ok' : ''}" data-o="${k}">${i >= 0 ? `<span class="k">${i + 1}</span>` : ''}${ar(t)}</button>`; }).join('')}</div>
      <p class="msg" id="cn-m4" aria-live="polite"></p></div>`;
    }
    /* 5 · verification */
    if (P.stage >= 4){
      h += `<div class="dev${P.done ? ' ok' : ''}"><h3><span class="n">5</span>${ar('أعد التشغيل وتحقّق')}</h3>
      <div class="row"><button type="button" class="btn${P.on ? ' ok' : ''}" data-v="on">${ar('أبعد الأدوات والكتلة، أزل الأقفال، وأعد التغذية')}</button></div>
      <p class="note">${ar('اختر ما يلزم بعد هذا الإصلاح فقط:')}</p>
      <div class="loto" id="cn-ver">${CN_V.map(([k, t]) => `<button type="button" class="btn${P.ver[k] ? ' ok' : ''}" data-vk="${k}" aria-pressed="${!!P.ver[k]}">${ar(t)}</button>`).join('')}</div>
      <div class="row"><button type="button" class="btn pri" data-v="run">${ar('شغّل برنامج الاختبار وقِس القطعة')}</button></div>
      <div class="read" id="cn-res"></div>
      <p class="msg" id="cn-m5" aria-live="polite"></p></div>`;
    }
    b.innerHTML = h;
    if (P.stage >= 1) screen();
    const se = $('[data-k="cause"]', b); if (se) se.addEventListener('change', e => { P.cause = e.target.value; save(); });
    const sf = $('[data-k="fix"]', b); if (sf) sf.addEventListener('change', e => { P.fix = e.target.value; save(); });
    if (P.done) showRes();
  }
  function screen(){ const a = q('#cn-scr1'); if (!a) return; a.textContent = 'SV-' + s.ax + ' ' + s.code; q('#cn-scr2').textContent = P.stage >= 1 ? 'AXIS ' + s.ax + ' STOP' : ''; q('#cn-scr3').textContent = P.done ? 'READY' : 'RESET ?'; }
  function setScreen0(){ const a = q('#cn-scr1'); if (a){ a.textContent = 'SV-' + s.ax + ' ' + s.code; q('#cn-scr2').textContent = 'SERVO ALARM'; q('#cn-scr3').textContent = 'RESET ?'; } }
  function go(n){ P.stage = n; save(); render(); }
  function cnInst(t, lines){ const T = CN_T[t]; return `<svg viewBox="0 0 320 128" role="img" aria-label="${esc(T.n)}"><rect x="4" y="4" width="312" height="120" rx="16" fill="${T.col}" stroke="#222" stroke-width="2"/><rect x="16" y="14" width="288" height="100" rx="10" fill="#2e3439"/><text x="160" y="31" text-anchor="middle" font-size="10.5" font-weight="700" fill="#f6cf45">${T.dev}</text><rect x="26" y="40" width="268" height="64" rx="4" fill="#c7d3b4"/><text x="160" y="66" text-anchor="middle" font-size="13.5" font-weight="700" class="lcdt">${esc(lines[0])}</text><text x="160" y="92" text-anchor="middle" font-size="13.5" font-weight="700" class="lcdt">${esc(lines[1] || '')}</text></svg>`; }
  function showRes(){
    const el = q('#cn-res'); if (!el) return;
    const r = P.res || (P.res = {fe:+f3(rnd(0.006, 0.012)), ld:Math.round(rnd(32, 48)), d:+f3(rnd(-0.004, 0.004))});
    el.innerHTML = `<div><span>${ar('الإنذارات')}</span><b class="ok">0</b></div><div><span>${ar('خطأ التتبّع عند F2000')}</span><b class="ok">${f3(r.fe)} mm</b></div><div><span>${ar('حمل المحور')}</span><b class="ok">${r.ld} %</b></div><div><span>${ar('القطعة Ø40 ±0.01')}</span><b class="ok">${f3(40 + r.d)}</b></div>`;
  }
  render(); setScreen0();
  host.addEventListener('click', e => {
    const t = e.target.closest('[data-ax],[data-f],[data-t],[data-a],[data-o],[data-v],[data-vk]'); if (!t || !q('#cn-body').contains(t)) return;
    const d = t.dataset;
    /* 1 */
    if (d.ax){ if (d.ax === s.ax) return go(1); return say(q('#cn-m0'), ar('الرسالة على الشاشة ورقم الدرايف الذي يومض يشيران إلى المحور ' + s.ax + '، لا ' + d.ax + '.'), 'bad'); }
    /* 2 */
    if (d.f){
      const sf = P.safe, m = q('#cn-m1'), k = d.f;
      if (sf[k] && k !== 'bus') return;
      if (k === 'sup'){ if (sf.loto) return say(m, ar('إنزال Z على الكتلة يحتاج التغذية: كان يجب فعله قبل الإقفال.'), 'bad'); sf.sup = true; }
      if (k === 'estop'){ if (s.ax === 'Z' && !sf.sup) return say(m, ar('أنزل الرأس Z على كتلة الدعم أولًا وهو تحت التحكم، ثم أوقف واضغط E-STOP.'), 'bad'); sf.estop = true; }
      if (k === 'loto'){ if (!sf.estop) return say(m, ar('أوقف البرنامج واضغط E-STOP أولًا، ثم افصل وأقفل.'), 'bad'); sf.loto = true; sf.t0 = true; }
      if (k === 'wait'){ if (!sf.loto) return say(m, ar('افصل وأقفل أولًا؛ الانتظار يبدأ بعد فصل القدرة.'), 'bad'); sf.wait = true; }
      if (k === 'bus'){
        if (!sf.loto) return say(m, ar('افصل وأقفل أولًا، ثم قِس الناقل.'), 'bad');
        const v = sf.wait ? rnd(14, 34) : rnd(390, 480);
        if (v >= 50){ say(m, ar('P–N = ' + f0(v) + ' V: الناقل ما زال خطرًا؛ انتظر ثم أعد القياس.'), 'bad'); return; }
        sf.bus = true; save(); render(); say(q('#cn-m1'), ar('P–N = ' + f0(v) + ' V، أي دون 50 V.'), 'ok');
        if (sf.estop && sf.loto && (sf.sup || s.ax !== 'Z')) setTimeout(() => { if (host.isConnected && P.stage === 1) go(2); }, DEMO ? 300 / DSPEED : 700);
        return;
      }
      save(); render();
      const msg = {sup:'الرأس Z مستند إلى كتلة ميكانيكية: لن يسقط عند تحرير الفرامل أو فك المحرك.', estop:'البرنامج متوقف و E-STOP مضغوط.', loto:'Q1 مفصول ومقفل؛ المفتاح معك.', wait:'مرّت 4 min؛ الناقل يتفرّغ عبر مقاومات التفريغ.'}[k];
      say(q('#cn-m1'), ar(msg), 'ok');
      return;
    }
    /* 3 */
    if (d.t){
      const T = CN_T[d.t], m = q('#cn-m2');
      if (P.stage !== 2) return;
      if (T.trap) return say(m, ar(T.trap), 'bad');
      if (T.zs && s.ax === 'Z' && !P.safe.sup) return say(m, ar('ادعم المحور Z أولًا: هذا الاختبار يحرّر الفرامل أو يدير المحور.'), 'bad');
      q('#cn-inst').innerHTML = cnInst(d.t, ['····', '']);
      setTimeout(() => {
        if (!host.isConnected || !q('#cn-inst')) return;
        const v = val(d.t); P.meas[d.t] = v.join(' · '); save();
        q('#cn-inst').innerHTML = cnInst(d.t, v); t.classList.add('done');
        q('#cn-log').insertAdjacentHTML('beforeend', logLi(d.t, P.meas[d.t])); say(m, '');
      }, DEMO ? 250 / DSPEED : 700);
      return;
    }
    if (d.a === 'cause'){
      const m = q('#cn-m3'), cv = $('[data-k="cause"]', host).value;
      if (!s.key.some(k => P.meas[k])) return say(m, ar('قِس أولًا بالأداة التي تثبت السبب؛ لا تخمّن من الإنذار وحده.'), 'bad');
      if (!cv) return say(m, ar('اختر السبب الجذري.'), 'bad');
      if (cv !== sc.root){ mark($('[data-k="cause"]', host), false); return say(m, ar('السبب غير صحيح: ' + s.why), 'bad'); }
      P.cause = cv; return go(3);
    }
    /* 4 */
    if (d.o){
      const m = q('#cn-m4'), fv = $('[data-k="fix"]', host).value;
      if (P.stage !== 3) return;
      if (!fv) return say(m, ar('اختر الإصلاح أولًا.'), 'bad');
      if (fv !== sc.root){ mark($('[data-k="fix"]', host), false); return say(m, ar('هذا الإصلاح لا يعالج السبب: ' + s.cause + '.'), 'bad'); }
      mark($('[data-k="fix"]', host), true); P.fix = fv;
      if (P.ord.includes(d.o)) return;
      if (d.o[0] === 'b'){ t.classList.add('no'); setTimeout(() => t.classList.remove('no'), 900); return say(m, ar(s.bad[+d.o.slice(1)][1]), 'bad'); }
      const nxt = 's' + P.ord.length;
      if (d.o !== nxt) return say(m, ar('ليست هذه الخطوة التالية: الخطوة التالية «' + s.steps[P.ord.length] + '».'), 'bad');
      P.ord.push(d.o); save();
      t.classList.add('ok'); t.insertAdjacentHTML('afterbegin', `<span class="k">${P.ord.length}</span>`);
      say(m, ar('تم: ' + s.steps[P.ord.length - 1] + '.'), 'ok');
      if (P.ord.length === s.steps.length) setTimeout(() => { if (host.isConnected) go(4); }, DEMO ? 300 / DSPEED : 800);
      return;
    }
    /* 5 */
    if (d.vk){ if (P.done) return; P.ver[d.vk] = !P.ver[d.vk]; t.classList.toggle('ok', P.ver[d.vk]); t.setAttribute('aria-pressed', P.ver[d.vk]); save(); return; }
    if (d.v === 'on'){ if (P.on) return; P.on = true; t.classList.add('ok'); save(); return say(q('#cn-m5'), ar('أُبعدت الأدوات والكتلة، وأُزيلت الأقفال، وعادت التغذية؛ لا إنذار عند التشغيل.'), 'ok'); }
    if (d.v === 'run'){
      const m = q('#cn-m5');
      if (P.done) return;
      if (!P.on) return say(m, ar('أعد التغذية أولًا بعد إبعاد الأدوات والكتلة وإزالة الأقفال.'), 'bad');
      for (const [k] of CN_V){ if (s.need[k] && !P.ver[k]) return say(m, ar(CN_VM[k]), 'bad'); }
      for (const [k] of CN_V){ if (!s.need[k] && P.ver[k]) return say(m, ar(k === 'brake' && s.ax !== 'Z' ? 'المحور ' + s.ax + ' بلا فرامل.' : CN_VX[k]), 'bad'); }
      P.done = true; save(); showRes(); trk(); screen();
      say(m, ar('القطعة الأولى ضمن التفاوت، ولا إنذارات، وخطأ التتبّع والحمل طبيعيان: الماكينة جاهزة للإنتاج.'), 'ok');
      win('cnc', 'أحسنت: أصلحت المحور ' + s.ax + ' من الإنذار حتى قطعة سليمة: ' + s.why);
    }
  });
  newScenario(host, 'cnc', () => { S.cn = {sc:genCN()}; });
  demo(host, 'cnc', async () => {
    Object.assign(P, {stage:0, ax:'', safe:{}, meas:{}, cause:'', fix:'', ord:[], ver:{}, on:false, done:false, res:null}); render(); setScreen0();
    await dClick(q(`[data-ax="${s.ax}"]`));
    if (s.ax === 'Z') await dClick(q('[data-f="sup"]'));
    await dClick(q('[data-f="estop"]')); await dClick(q('[data-f="loto"]')); await dClick(q('[data-f="wait"]')); await dClick(q('[data-f="bus"]'));
    await dWait(() => P.stage === 2, 8000);
    for (const k of s.key){ await dClick(q(`[data-t="${k}"]`)); await sleep(800 / DSPEED); }
    await dSet($('[data-k="cause"]', host), sc.root); await dClick(q('[data-a="cause"]'));
    await dSet($('[data-k="fix"]', host), sc.root);
    for (let i = 0; i < s.steps.length; i++) await dClick(q(`[data-o="s${i}"]`), 400);
    await dWait(() => P.stage === 4, 8000);
    await dClick(q('[data-v="on"]'));
    for (const [k] of CN_V) if (s.need[k]) await dClick(q(`[data-vk="${k}"]`), 400);
    await dClick(q('[data-v="run"]')); await sleep(900 / DSPEED);
  });
};

/* =====================================================================
   start
   ===================================================================== */
save();
const first = location.hash.slice(1);
show(G[first] ? first : TABS[0].id);
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (G[h]) show(h); });
window.DSIM = {S:() => S, DRV, AX, AL_S, AL_T, CN_S, CN_T, CN_V, ptPath, tnSim, tnMag, speed(x){ DSPEED = x; }};
})();
