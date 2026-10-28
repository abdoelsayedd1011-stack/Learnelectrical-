/* ورشة صيانة المحركات – LearnElectricals (MSA UI)
   Compressor motor C-201 (37 kW, 400 V Δ, 1475 rpm, cos φ 0.86, η 0.939, 66 A) on the test bench.
   Seven tabs, one per lesson (l2…l8). Each tab: a goal, real instruments (tap or drag the test leads),
   the safety sequence (LOTO → disconnect → test → discharge), the learner's own calculation with the
   formula and substituted numbers, and «▶ شاهد الحل» which plays the solution and never marks the tab.
   State in localStorage 'maint-motor-v1'. All limits are typical values for learning («قيم نموذجية للتعلّم»). */
(function(){
'use strict';
const $ = IL.$, $$ = IL.$$, esc = IL.esc, fmt = IL.fmt;
IL.hubTheme();
const NARROW = () => window.innerWidth < 620;
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* Arabic sentence with Latin symbols / numbers: every Latin run is isolated as LTR */
const LTR_RUN = /[A-Za-z0-9√(+\-−±][A-Za-z0-9Ωµ°√±≤≥<>=×·()+\-−.,%/²³_ →↔'^~]*[A-Za-z0-9Ωµ°%)²³]|[A-Za-z0-9]/g;
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

/* ---------------- C-201 data (canonical) ---------------- */
const M = {tag:'C-201', P:37, U:400, f:50, n:1475, cos:0.86, eta:0.939, In:66, InY:38, p:4, frame:'225S', de:'6313 C3', nde:'6213 C3', Rll20:0.12};
M.I = M.P * 1000 / (SQ3 * M.U * M.cos * M.eta);          // 66.13 A
M.ns = 120 * M.f / M.p;                                   // 1500 rpm
M.s = (M.ns - M.n) / M.ns * 100;                          // 1.667 %
M.T = 9550 * M.P / M.n;                                   // 239.6 N·m

/* ---------------- state ---------------- */
const KEY = 'maint-motor-v1';
let S = (() => { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && typeof s === 'object' ? s : {}; } catch (e){ return {}; } })();
let DEMO = 0;
function save(){ if (DEMO) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e){} }

/* =====================================================================
   tabs, goals, demo (same pattern as panel-lab/calc.js)
   ===================================================================== */
const TABS = [
  {id:'nameplate', t:'لوحة البيانات', l:'l2', h:'لوحة البيانات والتوصيل وأطراف الملفات', goal:'احسب من لوحة البيانات التيار المقنن والانزلاق والعزم، وحدّد الأطراف الستة U1–U2 و V1–V2 و W1–W2 بالأوميتر واختبار التوالي، ثم ضع قناطر علبة الأطراف للتوصيل الصحيح على 400 V.'},
  {id:'megger', t:'الميجر', l:'l3', h:'اختبار مقاومة العزل: IR و PI و DAR وفق IEEE 43', goal:'اعزل وأقفل وافصل الكوابل، ووصّل LINE إلى الملف و EARTH إلى الجسم، واختبر بـ 500 V لمدة 10 min، ثم صحّح IR إلى 40 °C واحسب PI و DAR وقرّر، وفرّغ الشحنة في النهاية.'},
  {id:'winding', t:'الملفات', l:'l4', h:'مقاومة الملفات بالميكرو أوم ونسبة عدم الاتزان', goal:'قِس المقاومات الثلاث لكل محرك بالميكرو أوم، وصحّحها إلى 20 °C، واحسب عدم الاتزان للمحرك C-201، ثم حدّد حالة كل محرك من الأربعة.'},
  {id:'bearing', t:'المحامل', l:'l5', h:'تشحيم المحمل 6313 وتشخيص أصوات المحامل', goal:'احسب كمية الشحم وفترة إعادة التشحيم للمحمل 6313، وشحّمه بالخطوات الصحيحة وسدادة التصريف مفتوحة، ثم شخّص ثلاثة محامل من صوتها وحرارتها.'},
  {id:'align', t:'الاهتزاز والمحاذاة', l:'l6', h:'الاهتزاز وفق ISO 20816 والقاعدة المرتخية والمحاذاة بالليزر', goal:'قِس الاهتزاز في النقاط الست وصنّفه في منطقة ISO 20816، وصحّح القاعدة المرتخية، ثم حاذِ المحرك بالشرائح والإزاحة الأفقية حتى يصبح الانحراف ≤ 0.05 mm والزاوية ≤ 0.05 mm/100 mm.'},
  {id:'thermal', t:'الحرارة والتيار', l:'l7', h:'الصورة الحرارية وعدم اتزان الجهد وعمر العزل', goal:'اقرأ الصورة الحرارية والجهود والتيارات، واحسب عدم اتزان الجهد ومعامل تخفيض القدرة وفق NEMA MG 1، وقدّر عمر العزل بقاعدة العشر درجات، ثم اختر الإجراء الصحيح.'},
  {id:'fault', t:'تشخيص الأعطال', l:'l8', h:'تشخيص الأعطال بالأجهزة خطوة بخطوة', goal:'حلّ أربع حالات أعطال حقيقية: قِس بالجهاز المناسب في الحالة الآمنة المناسبة، ثم اختر السبب الصحيح والإصلاح الصحيح.'}
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
    try { await run(); await sleep(1800); }
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
  const path = (a, b) => { const sag = Math.max(30, Math.abs(b.x - a.x) * 0.3 + Math.abs(b.y - a.y) * 0.15); return `M${f1(a.x)} ${f1(a.y)} C${f1(a.x)} ${f1(a.y + sag)} ${f1(b.x)} ${f1(b.y + sag)} ${f1(b.x)} ${f1(b.y)}`; };
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
const lcdSvg = (x, y, w, h, cls) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#2b2f31"/><rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="3" fill="#c7d3b4"/><g class="${cls || ''}"></g>`;

/* ---------------- audio (bearing sounds) ---------------- */
let AC = null, SRC = null;
function stopAudio(){ try { if (SRC){ SRC.stop(); SRC = null; } } catch (e){} }
function playBuf(data, rate){
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    stopAudio();
    const b = AC.createBuffer(1, data.length, rate); b.getChannelData(0).set(data);
    const s = AC.createBufferSource(); s.buffer = b; const g = AC.createGain(); g.gain.value = 0.6; s.connect(g); g.connect(AC.destination); s.start(); SRC = s;
    return true;
  } catch (e){ return false; }
}

/* =====================================================================
   TAB 1 · nameplate (l2): calculation, winding ends, terminal-box links
   ===================================================================== */
const LBL = ['U1', 'U2', 'V1', 'V2', 'W1', 'W2'];
function genNP(){
  const ends = shuffle([[0, 1], [0, 2], [1, 1], [1, 2], [2, 1], [2, 2]]);
  return {map:ends, calc:{I:'', s:'', T:''}, lab:['', '', '', '', '', ''], links:[], done:{}};
}
function plateSvg(){
  const r = (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="#9aa1a6" stroke="#6b7378"/><circle cx="${x}" cy="${y}" r="1.6" fill="#5b6266"/>`;
  const rows = [['400', '50', 'Δ', '37', '1475', '66', '0.86'], ['690', '50', 'Y', '37', '1475', '38', '0.86']];
  const cx = [62, 112, 152, 196, 246, 300, 356];
  return `<svg viewBox="0 0 420 262" role="img" aria-label="لوحة بيانات المحرك C-201">
  <defs><linearGradient id="np-al" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef1f2"/><stop offset=".55" stop-color="#cfd5d8"/><stop offset="1" stop-color="#e6eaec"/></linearGradient></defs>
  <rect x="4" y="4" width="412" height="254" rx="12" fill="url(#np-al)" stroke="#8d969b" stroke-width="2"/>
  ${r(18, 18)}${r(402, 18)}${r(18, 244)}${r(402, 244)}
  <text x="210" y="30" text-anchor="middle" font-size="15" font-weight="700" fill="#1d2529">3~ INDUCTION MOTOR · IEC 60034-1</text>
  <line x1="30" y1="38" x2="390" y2="38" stroke="#59636a"/>
  <text x="34" y="56" font-size="11.5" fill="#1d2529">Type IE3-225S-4   No. 26-0417   2026</text>
  <text x="34" y="74" font-size="11.5" fill="#1d2529">IP55  IC411  S1  Ins.cl. F (ΔT B)  Ta 40 °C</text>
  <rect x="30" y="84" width="360" height="92" fill="none" stroke="#59636a"/>
  <line x1="30" y1="106" x2="390" y2="106" stroke="#59636a"/><line x1="30" y1="141" x2="390" y2="141" stroke="#59636a"/>
  ${[87, 132, 172, 220, 272, 328].map(x => `<line x1="${x}" y1="84" x2="${x}" y2="176" stroke="#59636a"/>`).join('')}
  ${['V', 'Hz', 'conn.', 'kW', 'rpm', 'A', 'cos φ'].map((h, i) => `<text x="${cx[i]}" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="#1d2529">${h}</text>`).join('')}
  ${rows.map((rw, j) => rw.map((v, i) => `<text x="${cx[i]}" y="${129 + j * 35}" text-anchor="middle" font-size="14" font-weight="600" fill="#11181c">${v}</text>`).join('')).join('')}
  <text x="34" y="196" font-size="11.5" fill="#1d2529">η 93.9 % (IE3)   Frame 225S   m ≈ 285 kg</text>
  <text x="34" y="214" font-size="11.5" fill="#1d2529">Bearing DE 6313 C3   NDE 6213 C3</text>
  <text x="34" y="232" font-size="11.5" fill="#1d2529">4 poles   f 50 Hz   IEC 60034-30-1</text>
  <text x="386" y="232" text-anchor="end" font-size="10" fill="#4d575d">LearnElectricals</text>
  </svg>`;
}
const LEAD_X = i => 182 + i * 42;
function leadsSvg(){
  let h = `<svg viewBox="0 0 420 214" role="img" aria-label="الأطراف الستة الخارجة من المحرك">
  <rect x="6" y="22" width="132" height="128" rx="10" fill="var(--ral)" stroke="var(--ral-d)" stroke-width="2"/>
  ${[0, 1, 2, 3, 4, 5, 6].map(k => `<line x1="14" y1="${36 + k * 16}" x2="130" y2="${36 + k * 16}" stroke="var(--ral-d)" stroke-width="2"/>`).join('')}
  <rect x="122" y="56" width="34" height="60" rx="4" fill="#5b6266"/>
  <text x="72" y="170" text-anchor="middle" font-size="11" class="txm">C-201</text>`;
  for (let i = 0; i < 6; i++){
    const x = LEAD_X(i), y0 = 64 + i * 9;
    h += `<path d="M150 ${y0} C${x - 30} ${y0} ${x} ${110} ${x} 150" fill="none" stroke="#1e2326" stroke-width="5" stroke-linecap="round"/>`;
  }
  for (let i = 0; i < 6; i++){
    const x = LEAD_X(i);
    h += `<g class="hit" data-lead="${i}" tabindex="0" role="button" aria-label="الطرف ${i + 1}"><rect x="${x - 19}" y="118" width="38" height="88" fill="transparent"/><circle class="ring" cx="${x}" cy="168" r="17"/>
      <rect x="${x - 11}" y="122" width="22" height="20" rx="3" fill="#f6f6ef" stroke="#888"/><text x="${x}" y="137" text-anchor="middle" font-size="13" font-weight="700" fill="#111">${i + 1}</text>
      <circle cx="${x}" cy="168" r="11" fill="var(--cu)" stroke="#7a4518" stroke-width="2"/><circle cx="${x}" cy="168" r="4" fill="#7a4518"/>
      <text class="np-lt" x="${x}" y="200" text-anchor="middle" font-size="12" font-weight="700" fill="var(--accent)"></text></g>`;
  }
  return h + '</svg>';
}
const STUD = {W2:[100, 92], U2:[180, 92], V2:[260, 92], U1:[100, 182], V1:[180, 182], W1:[260, 182]};
const ADJ = ['W2-U2', 'U2-V2', 'U1-V1', 'V1-W1', 'W2-U1', 'U2-V1', 'V2-W1'];
const DELTA = ['W2-U1', 'U2-V1', 'V2-W1'], STAR = ['W2-U2', 'U2-V2'];
const lkey = (a, b) => ADJ.includes(a + '-' + b) ? a + '-' + b : ADJ.includes(b + '-' + a) ? b + '-' + a : null;
function tboxSvg(links, run){
  let h = `<svg viewBox="0 0 360 290" role="img" aria-label="علبة أطراف المحرك">
  <rect x="20" y="20" width="320" height="240" rx="14" fill="#5d666c" stroke="#3c4449" stroke-width="3"/>
  <rect x="44" y="44" width="272" height="190" rx="8" fill="#ecebe4" stroke="#9aa1a6" stroke-width="2"/>
  <g class="np-rot${run ? ' spin' : ''}" style="transform-origin:318px 30px"><circle cx="318" cy="30" r="16" fill="#3c4449" stroke="#ccc" stroke-width="2"/><path d="M318 16 L322 30 L318 44 L314 30Z M304 30 L318 26 L332 30 L318 34Z" fill="#e3e9ec"/></g>
  ${['L1', 'L2', 'L3'].map((l, i) => { const x = [100, 180, 260][i], c = ['#8a5a2b', '#22282c', '#8d969b'][i]; return `<path d="M${x} 290 L${x} 196" stroke="${c}" stroke-width="9" stroke-linecap="round"/><text x="${x + 12}" y="250" font-size="11" font-weight="700" fill="#e9eef1">${l}</text>`; }).join('')}`;
  links.forEach(k => { const [a, b] = k.split('-'), A = STUD[a], B = STUD[b]; const x = Math.min(A[0], B[0]) - 9, y = Math.min(A[1], B[1]) - 9, w = Math.abs(A[0] - B[0]) + 18, hh = Math.abs(A[1] - B[1]) + 18;
    h += `<g class="hit" data-link="${k}" tabindex="0" role="button" aria-label="قنطرة ${k}"><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="9" fill="#d08a3a" stroke="#7a4518" stroke-width="2"/></g>`; });
  Object.keys(STUD).forEach(k => { const [x, y] = STUD[k];
    h += `<g class="hit" data-stud="${k}" tabindex="0" role="button" aria-label="الطرف ${k}"><rect x="${x - 20}" y="${y - 34}" width="40" height="54" fill="transparent"/><circle class="ring" cx="${x}" cy="${y}" r="17"/><circle cx="${x}" cy="${y}" r="12" fill="#c9a24a" stroke="#6d5420" stroke-width="2"/><polygon points="${hexPts(x, y, 7)}" fill="#b4b8bb" stroke="#555"/><text x="${x}" y="${y - 20}" text-anchor="middle" font-size="13" font-weight="700" fill="#11181c">${k}</text></g>`; });
  return h + `<text x="180" y="280" text-anchor="middle" font-size="11" class="txm">400 V · 50 Hz</text></svg>`;
}
BUILD.nameplate = host => {
  if (!S.np || !S.np.map) S.np = genNP();
  const N = S.np;
  host.innerHTML = `
  <div class="grid2">
    <div class="dev${N.done.calc ? ' ok' : ''}" id="np-a"><h3><span class="n">1</span>اقرأ لوحة البيانات واحسب</h3>
      <div class="stage">${plateSvg()}</div>
      ${fld('I', 'التيار المقنن عند 400 V (من P و cos φ و η)', 'A', N.calc.I)}
      ${fld('s', 'الانزلاق المقنن s', '%', N.calc.s)}
      ${fld('T', 'العزم المقنن على العمود', 'N·m', N.calc.T)}
      <div class="row"><button type="button" class="btn pri" data-a="c1">تحقّق من الحساب</button></div>
      <p class="msg" id="np-m1" aria-live="polite"></p><div id="np-fx1"></div>
    </div>
    <div class="dev${N.done.ends ? ' ok' : ''}" id="np-b"><h3><span class="n">2</span>حدّد أطراف الملفات الستة</h3>
      <p class="note">${ar('فُكّت القناطر وضاعت علامات الأطراف. المحرك معزول ومقفل. قِس بالأوميتر لتجد كل ملف، ثم صِل ملفين على التوالي وغذّهما بـ 24 V AC: إذا ظهر جهد على الملف الثالث فالطرفان الموصولان مختلفان (نهاية مع بداية).')}</p>
      <div class="sgm ar" id="np-mode"><button type="button" data-mode="ohm" aria-pressed="true">أوميتر Ω</button><button type="button" data-mode="ser" aria-pressed="false">اختبار التوالي 24 V AC</button></div>
      <div class="stage">${leadsSvg()}</div>
      <div class="seg" id="np-lcd">-- --</div>
      <p class="msg" id="np-m2" aria-live="polite">${ar('اختر طرفين بالنقر عليهما.')}</p>
      <details class="note"><summary>سجل القياسات</summary><ul id="np-log" style="margin:4px 0 0;padding-inline-start:18px"></ul></details>
      <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px">${[0, 1, 2, 3, 4, 5].map(i => `<label class="fld"><span>الطرف ${i + 1}</span><select data-lab="${i}" style="min-width:5em;flex:0 1 auto;direction:ltr;font-family:var(--font-mono)"><option value="">—</option>${LBL.map(l => `<option${N.lab[i] === l ? ' selected' : ''}>${l}</option>`).join('')}</select></label>`).join('')}</div>
      <div class="row"><button type="button" class="btn pri" data-a="c2">تحقّق من التسمية</button></div>
      <p class="msg" id="np-m3" aria-live="polite"></p>
    </div>
  </div>
  <div class="dev${N.done.links ? ' ok' : ''}" id="np-c"><h3><span class="n">3</span>قناطر علبة الأطراف للتغذية 400 V</h3>
    <div id="np-cb"></div>
  </div>
  ${foot()}`;
  const q = s => $(s, host);
  /* ---- 1. calculation ---- */
  const inp = k => q(`[data-k="${k}"]`);
  ['I', 's', 'T'].forEach(k => inp(k).addEventListener('input', () => { N.calc[k] = inp(k).value; save(); }));
  function chk1(){
    const I = num(inp('I').value), s = num(inp('s').value), T = num(inp('T').value);
    const okI = near(I, M.I, 0.02), okS = nearA(s, M.s, 0.06), okT = near(T, M.T, 0.02);
    mark(inp('I'), okI); mark(inp('s'), okS); mark(inp('T'), okT);
    let m = '';
    if (!okI) m = !isFinite(I) ? 'اكتب التيار بالأمبير.' : near(I, 38.2, 0.05) ? '38 A هو تيار توصيل النجمة على 690 V؛ المطلوب التيار عند 400 V دلتا.' : near(I, 53.4, 0.03) ? 'نسيت cos φ و η في المقام: I = P/(√3·U·cos φ·η).' : near(I, 62.1, 0.02) ? 'نسيت الكفاءة η = 0.939 في المقام.' : 'التيار خطأ: I = P/(√3·U·cos φ·η) و P بالواط.';
    else if (!okS) m = !isFinite(s) ? 'اكتب الانزلاق نسبة مئوية.' : near(s, 0.01667, 0.06) ? 'هذا كسر عشري؛ اضربه في 100 لتكتبه نسبة مئوية.' : nearA(s, 25, 0.5) ? '25 rpm هو فرق السرعة فقط؛ اقسمه على السرعة المتزامنة 1500 rpm.' : 'الانزلاق خطأ: ns = 120·f/p = 1500 rpm، و s = (ns − n)/ns × 100.';
    else if (!okT) m = !isFinite(T) ? 'اكتب العزم بالنيوتن متر.' : near(T, 235.6, 0.006) ? 'استخدم السرعة المقننة 1475 rpm لا السرعة المتزامنة.' : 'العزم خطأ: T = 9550 × P(kW) / n(rpm).';
    if (m){ say(q('#np-m1'), ar(m), 'bad'); return; }
    N.done.calc = true; save(); q('#np-a').classList.add('ok');
    say(q('#np-m1'), ar('صحيح: التيار المحسوب يطابق 66 A على اللوحة.'), 'ok');
    q('#np-fx1').innerHTML = `<div class="fx">I = 37000 / (√3 × 400 × 0.86 × 0.939) = <b>${f1(M.I)} A</b><br>ns = 120 × 50 / 4 = 1500 rpm ; s = (1500 − 1475) / 1500 × 100 = <b>${f2(M.s)} %</b><br>T = 9550 × 37 / 1475 = <b>${f1(M.T)} N·m</b></div>`;
    done();
  }
  /* ---- 2. winding ends ---- */
  let mode = 'ohm', pk = [];
  const lcd = q('#np-lcd'), log = q('#np-log');
  function addLog(t){ const li = document.createElement('li'); li.innerHTML = t; log.prepend(li); while (log.children.length > 10) log.lastChild.remove(); }
  function hiLeads(){ $$('[data-lead]', host).forEach(g => g.classList.toggle('sel', pk.includes(+g.dataset.lead))); }
  IL.onAct(q('#np-mode'), '[data-mode]', b => { mode = b.dataset.mode; $$('#np-mode button', host).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); pk = []; hiLeads(); lcd.textContent = mode === 'ohm' ? '-- -- Ω' : '-- -- V~'; say(q('#np-m2'), ar(mode === 'ohm' ? 'اختر طرفين لقياس المقاومة بينهما.' : 'اختر طرفين من ملفين مختلفين لوصلهما معًا.')); });
  IL.onAct(host, '[data-lead]', g => {
    const i = +g.dataset.lead;
    if (pk.length >= 2) pk = [];
    if (pk.includes(i)){ pk = pk.filter(x => x !== i); hiLeads(); return; }
    pk.push(i); hiLeads();
    if (pk.length < 2){ say(q('#np-m2'), ar(`الطرف ${i + 1} مختار؛ اختر الطرف الثاني.`)); return; }
    const [a, b] = pk, A = N.map[a], B = N.map[b];
    if (mode === 'ohm'){
      if (A[0] === B[0]){ const r = jit(0.18, 0.03); lcd.textContent = f2(r) + ' Ω'; say(q('#np-m2'), ar(`بين ${a + 1} و ${b + 1}: ${f2(r)} Ω؛ استمرارية، فهما طرفا ملف واحد.`), 'ok'); addLog(ar(`${a + 1}–${b + 1}: ${f2(r)} Ω`)); }
      else { lcd.textContent = 'OL  Ω'; say(q('#np-m2'), ar(`بين ${a + 1} و ${b + 1}: OL؛ لا اتصال، فهما من ملفين مختلفين.`)); addLog(ar(`${a + 1}–${b + 1}: OL`)); }
    } else {
      if (A[0] === B[0]){ lcd.textContent = '-- -- V~'; say(q('#np-m2'), ar('الطرفان من الملف نفسه؛ اختر طرفًا من ملف وطرفًا من ملف آخر.'), 'bad'); return; }
      const aid = A[1] !== B[1], v = aid ? jit(10.8, 0.04) : rnd(0.15, 0.45);
      lcd.textContent = f1(v) + ' V~';
      say(q('#np-m2'), ar(`وُصل ${a + 1} مع ${b + 1}، و 24 V AC على الطرفين الحرّين للملفين؛ الفولتميتر على الملف الثالث يقرأ ${f1(v)} V.`) + (aid ? ' ' + ar('جهد واضح: الطرفان الموصولان نهاية وبداية.') : ' ' + ar('جهد شبه معدوم: الطرفان الموصولان من النوع نفسه.')), aid ? 'ok' : '');
      addLog(ar(`توالٍ ${a + 1}+${b + 1}: ${f1(v)} V`));
    }
  });
  function showLab(){ $$('[data-lead]', host).forEach(g => { $('.np-lt', g).textContent = N.lab[+g.dataset.lead] || ''; }); }
  $$('[data-lab]', host).forEach(s => s.addEventListener('change', () => { N.lab[+s.dataset.lab] = s.value; save(); showLab(); $$('[data-lab]', host).forEach(x => mark(x, null)); }));
  showLab();
  function chk2(){
    const lab = N.lab, m3 = q('#np-m3');
    if (lab.some(x => !x)) return say(m3, ar('سمِّ الأطراف الستة كلها أولًا.'), 'bad');
    if (new Set(lab).size < 6) return say(m3, ar('كل اسم يُستخدم مرة واحدة فقط.'), 'bad');
    const idx = l => lab.indexOf(l);
    for (const X of ['U', 'V', 'W']){
      const a = idx(X + '1'), b = idx(X + '2');
      if (N.map[a][0] !== N.map[b][0]){ mark($(`[data-lab="${a}"]`, host), false); mark($(`[data-lab="${b}"]`, host), false); return say(m3, ar(`الطرفان ${a + 1} و ${b + 1} ليسا من ملف واحد: قسهما بالأوميتر، فطرفا الملف يعطيان استمرارية.`), 'bad'); }
    }
    const flip = N.map[idx('U1')][1] === 1 ? 0 : 1;
    for (const X of ['V', 'W']){
      const a = idx(X + '1'), e = N.map[a][1], exp = flip ? 3 - e : e;
      if (exp !== 1){ mark($(`[data-lab="${a}"]`, host), false); mark($(`[data-lab="${idx(X + '2')}"]`, host), false); return say(m3, ar(`قطبية الملف ${X} معكوسة بالنسبة إلى U: صِل U2 بطرف من ${X}؛ إذا ظهر جهد على الملف الثالث فالطرف الموصول هو ${X}1.`), 'bad'); }
    }
    $$('[data-lab]', host).forEach(x => mark(x, true));
    N.done.ends = true; save(); q('#np-b').classList.add('ok');
    say(m3, ar('صحيح: الملفات الثلاثة معروفة وقطبيتها متسقة. ثُبّتت الأطراف على مساميرها في علبة الأطراف.'), 'ok');
    renderBox(); done();
  }
  /* ---- 3. links ---- */
  let sStud = null, run = false;
  function renderBox(){
    const cb = q('#np-cb');
    if (!N.done.ends){ cb.innerHTML = `<p class="note">${ar('حدّد أطراف الملفات في الخطوة 2 أولًا؛ لا تضع قناطر على أطراف مجهولة.')}</p>`; return; }
    cb.innerHTML = `<p class="note">${ar('انقر طرفين متجاورين لوضع قنطرة نحاسية بينهما، وانقر القنطرة لإزالتها. كوابل التغذية L1 و L2 و L3 موصولة على U1 و V1 و W1.')}</p>
      <div class="stage" style="max-width:420px;margin:0 auto">${tboxSvg(N.links, run)}</div>
      <div class="row"><button type="button" class="btn pri" data-a="run">أزل الأقفال وشغّل على 400 V</button><button type="button" class="btn" data-a="clr">أزل كل القناطر</button></div>
      <p class="msg" id="np-m4" aria-live="polite"></p>`;
    if (sStud) { const g = $(`[data-stud="${sStud}"]`, cb); if (g) g.classList.add('sel'); }
  }
  host.addEventListener('click', e => {
    const st = e.target.closest('[data-stud]'), lk = e.target.closest('[data-link]');
    if (lk){ N.links = N.links.filter(x => x !== lk.dataset.link); run = false; save(); renderBox(); return; }
    if (!st) return;
    const k = st.dataset.stud;
    if (!sStud || sStud === k){ sStud = sStud === k ? null : k; renderBox(); return; }
    const key = lkey(sStud, k); sStud = null;
    if (!key){ renderBox(); say(q('#np-m4'), ar('القنطرة القصيرة تصل طرفين متجاورين فقط (أفقيًا أو رأسيًا).'), 'bad'); return; }
    if (!N.links.includes(key)) N.links.push(key);
    run = false; save(); renderBox();
  });
  function runMotor(){
    const L = N.links.slice().sort(), m4 = () => q('#np-m4');
    const same = (a, b) => a.length === b.length && a.slice().sort().every((x, i) => x === b.slice().sort()[i]);
    const short = L.find(k => k === 'U1-V1' || k === 'V1-W1');
    if (short){ say(m4(), ar(`قصر بين طورين: القنطرة ${short} تقصر ${short === 'U1-V1' ? 'L1 مع L2' : 'L2 مع L3'} مباشرة؛ أزلها قبل التشغيل.`), 'bad'); return; }
    if (same(L, STAR)){ say(m4(), ar('هذا توصيل نجمة: كل ملف يأخذ 400/√3 = 231 V فقط، والمحرك مصمَّم 400 V Δ؛ سيفقد ثلثي عزمه ويسخن تحت الحمل. استخدم دلتا.'), 'bad'); return; }
    if (!same(L, DELTA)){ say(m4(), ar('التوصيل غير صحيح: الدلتا تحتاج ثلاث قناطر رأسية W2–U1 و U2–V1 و V2–W1، فيأخذ كل ملف 400 V.'), 'bad'); return; }
    run = true; N.done.links = true; save(); renderBox(); q('#np-c').classList.add('ok');
    say(m4(), ar('صحيح: دلتا على 400 V. المحرك يدور بلا حمل عند نحو 1497 rpm، وتيار اللاحمل نحو 22 A متزن في الأطوار الثلاثة.'), 'ok');
    done();
  }
  IL.onAct(host, '[data-a]', b => { const a = b.dataset.a; if (a === 'c1') chk1(); else if (a === 'c2') chk2(); else if (a === 'run') runMotor(); else if (a === 'clr'){ N.links = []; run = false; save(); renderBox(); } });
  function done(){ if (N.done.calc && N.done.ends && N.done.links) win('nameplate', 'أحسنت: الحساب صحيح، والأطراف معروفة، والمحرك موصول دلتا على 400 V ويدور.'); }
  renderBox();
  if (N.done.calc) chk1();
  newScenario(host, 'nameplate', () => { S.np = genNP(); });
  demo(host, 'nameplate', async () => {
    N.done = {}; N.links = []; N.lab = ['', '', '', '', '', '']; renderBox(); showLab(); $$('[data-lab]', host).forEach(s => { s.value = ''; mark(s, null); });
    await dSet(inp('I'), f1(M.I)); await dSet(inp('s'), f2(M.s)); await dSet(inp('T'), f1(M.T)); await dClick(q('[data-a="c1"]'));
    const by = (c, e) => N.map.findIndex(x => x[0] === c && x[1] === e);
    const lead = i => q(`[data-lead="${i}"]`);
    await dClick(q('[data-mode="ohm"]'), 300);
    await dClick(lead(by(0, 1)), 350); await dClick(lead(by(1, 1)), 350);
    await dClick(lead(by(0, 1)), 350); await dClick(lead(by(0, 2)), 350);
    await dClick(lead(by(1, 1)), 350); await dClick(lead(by(1, 2)), 350);
    await dClick(q('[data-mode="ser"]'));
    await dClick(lead(by(0, 2)), 350); await dClick(lead(by(1, 2)), 350); await sleep(900 / DSPEED);
    await dClick(lead(by(0, 2)), 350); await dClick(lead(by(1, 1)), 350); await sleep(900 / DSPEED);
    await dClick(lead(by(0, 2)), 350); await dClick(lead(by(2, 1)), 350); await sleep(700 / DSPEED);
    for (let i = 0; i < 6; i++){ const [c, e] = N.map[i]; await dSet(q(`[data-lab="${i}"]`), ['U', 'V', 'W'][c] + e, 200); }
    await dClick(q('[data-a="c2"]'));
    for (const k of DELTA){ const [a, b] = k.split('-'); await dClick(q(`[data-stud="${a}"]`), 350); await dClick(q(`[data-stud="${b}"]`), 350); }
    await dClick(q('[data-a="run"]'));
  });
};

/* =====================================================================
   TAB 2 · megger (l3): LOTO → disconnect → leads → 500 V → 10 min → IR40, PI, DAR → decide → discharge
   ===================================================================== */
let TF_MG = 30;   // simulated seconds per real second (600 s test in 20 s)
const s3n = v => num(sig3(v));
function genMG(){
  const kind = pick(['good', 'good', 'wet', 'low']), T = rint(18, 34), Kt = Math.pow(0.5, (40 - T) / 10);
  let R1, PI;
  if (kind === 'good'){ R1 = rnd(250, 2200); PI = rnd(2.4, 3.8); }
  else if (kind === 'wet'){ R1 = rnd(35, 160); PI = rnd(1.2, 1.65); }
  else { R1 = rnd(1.5, 3.8) / Kt; PI = rnd(1.0, 1.35); }
  const k = Math.log10(PI);
  return {kind, T, R1:s3n(R1), R10:s3n(R1 * PI), R30:s3n(R1 * Math.pow(0.5, k)), k, in:{}};
}
function mgRes(sc){
  const Kt = Math.pow(0.5, (40 - sc.T) / 10), R40 = sc.R1 * Kt, PI = sc.R10 / sc.R1, DAR = sc.R1 / sc.R30;
  const dec = R40 < 5 ? 'stop' : PI < 2 ? 'dry' : 'ok';
  return {Kt, R40, PI, DAR, dec};
}
const MG_DEC = [['ok', 'مقبول: أعد توصيل الكوابل وشغّل المحرك'], ['dry', 'نظّف الملفات وجفّفها ثم أعد الاختبار'], ['stop', 'ممنوع التشغيل: العزل دون الحد الأدنى؛ جفّف وأعد الاختبار ثم قرّر إعادة اللف']];
function meggerSvg(N){
  const vs = [250, 500, 1000, 2500, 5000], ang = i => -150 + i * 50;
  let knob = '';
  vs.forEach((v, i) => { const a = ang(i) * Math.PI / 180, x = 82 + 40 * Math.sin(a), y = 198 - 40 * Math.cos(a); knob += `<text x="${f1(x)}" y="${f1(y + 4)}" text-anchor="middle" font-size="10" font-weight="700" fill="#222">${v}</text>`; });
  const st = (k, x, y) => `<g class="hit" data-tg="${k}" tabindex="0" role="button" aria-label="${k}"><rect x="${x - 20}" y="${y - 30}" width="40" height="50" fill="transparent"/><circle class="ring" cx="${x}" cy="${y}" r="16"/><circle cx="${x}" cy="${y}" r="11" fill="#c9a24a" stroke="#6d5420" stroke-width="2"/><polygon points="${hexPts(x, y, 6)}" fill="#b4b8bb" stroke="#555"/><text x="${x}" y="${y - 17}" text-anchor="middle" font-size="11" font-weight="700" fill="#11181c">${k}</text></g>`;
  return `<svg viewBox="${N ? '0 0 266 612' : '0 0 540 318'}" role="img" aria-label="جهاز اختبار العزل وعلبة أطراف المحرك">
  <defs><linearGradient id="mg-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6cf45"/><stop offset="1" stop-color="#d9a915"/></linearGradient></defs>
  <rect x="8" y="8" width="250" height="300" rx="18" fill="url(#mg-c)" stroke="#8a6a0a" stroke-width="2.5"/>
  <rect x="22" y="22" width="222" height="272" rx="12" fill="#2e3439"/>
  <text x="133" y="40" text-anchor="middle" font-size="9.5" font-weight="700" fill="#f6cf45">INSULATION TESTER 5 kV</text>
  <rect x="32" y="48" width="202" height="92" rx="5" fill="#1d2124"/><rect x="36" y="52" width="194" height="84" rx="3" fill="#c7d3b4"/>
  <text id="mg-big" x="222" y="92" text-anchor="end" font-size="26" font-weight="700" class="lcdt">-----</text>
  <text x="222" y="108" text-anchor="end" font-size="11" class="lcdt" id="mg-unit">MΩ</text>
  <text id="mg-v" x="42" y="66" font-size="11" class="lcdt">0 V</text><text id="mg-t" x="222" y="66" text-anchor="end" font-size="11" class="lcdt">00:00</text>
  <text id="mg-mem" x="42" y="128" font-size="9.6" class="lcdt"></text>
  <text id="mg-hv" x="42" y="92" font-size="18" font-weight="700" fill="#b00" opacity="0">⚠</text>
  <circle cx="82" cy="198" r="54" fill="#e9ecee" stroke="#9aa1a6"/>${knob}
  <circle cx="82" cy="198" r="20" fill="#3c4449" stroke="#1d2124" stroke-width="2"/>
  <g id="mg-knob"><rect x="79" y="176" width="6" height="19" rx="3" fill="#f6cf45"/></g>
  <g class="hit" id="mg-test" tabindex="0" role="button" aria-label="TEST"><circle class="ring" cx="192" cy="186" r="30"/><circle cx="192" cy="186" r="25" fill="#c62828" stroke="#6d1010" stroke-width="3"/><text x="192" y="191" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">TEST</text></g>
  <circle cx="132" cy="262" r="11" fill="#1a1d1f" stroke="#555" stroke-width="2"/><circle cx="132" cy="262" r="6" fill="#2e7d32"/><text x="132" y="287" text-anchor="middle" font-size="9.5" font-weight="700" fill="#e9eef1">GUARD</text>
  ${plugSvg('line', 64, 262, '#d32f2f', 'LINE')}${plugSvg('earth', 200, 262, '#222', 'EARTH')}
  <g transform="${N ? 'translate(-282 300)' : ''}"><rect x="292" y="16" width="240" height="222" rx="12" fill="#5d666c" stroke="#3c4449" stroke-width="3"/>
  <rect x="308" y="32" width="208" height="190" rx="8" fill="#ecebe4" stroke="#9aa1a6"/>
  ${['W2-U1', 'U2-V1', 'V2-W1'].map((k, i) => { const x = 346 + i * 66; return `<rect x="${x - 8}" y="70" width="16" height="78" rx="7" fill="#d08a3a" stroke="#7a4518" stroke-width="1.5"/>`; }).join('')}
  ${st('W2', 346, 76)}${st('U2', 412, 76)}${st('V2', 478, 76)}${st('U1', 346, 144)}${st('V1', 412, 144)}${st('W1', 478, 144)}
  <g id="mg-sup">${['#8a5a2b', '#22282c', '#8d969b'].map((c, i) => `<path d="M${346 + i * 66} 300 L${346 + i * 66} 152" stroke="${c}" stroke-width="9" stroke-linecap="round"/>`).join('')}</g>
  <rect x="292" y="238" width="240" height="70" rx="8" fill="var(--ral)" stroke="var(--ral-d)" stroke-width="2"/>
  <text x="370" y="296" text-anchor="middle" font-size="11" fill="#333">C-201 frame</text>
  <g class="hit" data-tg="PE" tabindex="0" role="button" aria-label="PE"><rect x="474" y="238" width="40" height="50" fill="transparent"/><circle class="ring" cx="494" cy="268" r="17"/><circle cx="494" cy="268" r="12" fill="#b4b8bb" stroke="#555" stroke-width="2"/><path d="M486 266h16M489 270h10M492 274h4" stroke="#2e7d32" stroke-width="2"/><text x="494" y="250" text-anchor="middle" font-size="11" font-weight="700" fill="#11181c">PE</text></g></g>
  <g class="cabs"></g>
  </svg>`;
}
BUILD.megger = host => {
  if (!S.mg || !S.mg.sc) S.mg = {sc:genMG()};
  const sc = S.mg.sc, R = mgRes(sc), I = sc.in;
  const NB = NARROW(), OX = NB ? -282 : 0, OY = NB ? 300 : 0;
  const P = {iso:false, lock:false, dead:false, disc:false, volt:0, st:'idle', t:0, hv:0, dis:false, ok:false};
  host.innerHTML = `
  <div class="dev"><h3><span class="n">1</span>السلامة قبل الاختبار</h3>
    <div class="loto">
      <button type="button" class="btn" data-l="iso">افصل قاطع المغذّي في لوحة MCC</button>
      <button type="button" class="btn" data-l="lock">ضع القفل والبطاقة على القاطع</button>
      <button type="button" class="btn" data-l="dead">تحقّق من انعدام الجهد بالكاشف</button>
      <button type="button" class="btn" data-l="disc">افصل كوابل التغذية عن أطراف المحرك</button>
    </div>
    <p class="msg" id="mg-m0" aria-live="polite"></p>
  </div>
  <div class="dev"><h3><span class="n">2</span>وصّل الجهاز واختبر</h3>
    <p class="note">${ar('اسحب طرف LINE إلى أحد أطراف الملف و EARTH إلى مسمار الأرضي PE على الجسم (أو انقر الطرف ثم المكان). القناطر الثلاث تبقى، فيُختبر الملف كله إلى الجسم.')}</p>
    <div class="stage" style="max-width:560px;margin:0 auto;width:100%">${meggerSvg(NB)}</div>
    <div class="row"><span class="note">جهد الاختبار DC:</span><div class="sgm" id="mg-vs">${[250, 500, 1000, 2500, 5000].map(v => `<button type="button" data-v="${v}" aria-pressed="false">${v} V</button>`).join('')}</div></div>
    <div class="row"><button type="button" class="btn pri" data-a="test">TEST · ابدأ 10 min</button><button type="button" class="btn" data-a="dis">تفريغ الملف</button><span class="pill">${ar('حرارة الملف بحسّاس RTD')} ${L(sc.T + ' °C')}</span></div>
    <p class="msg" id="mg-m1" aria-live="polite"></p>
    <div class="svgw stage" style="background:var(--panel);max-width:520px;width:100%;margin:0 auto"><svg id="mg-plot" viewBox="0 0 340 160" role="img" aria-label="منحنى IR مع الزمن"></svg></div>
  </div>
  <div class="dev" id="mg-r"><h3><span class="n">3</span>سجّل واحسب وقرّر</h3>
    ${fld('r1', 'IR بعد 1 min عند حرارة الملف', 'MΩ', I.r1)}
    ${fld('r10', 'IR بعد 10 min', 'MΩ', I.r10)}
    ${fld('r40', 'IR1min مصحّحة إلى 40 °C', 'MΩ', I.r40)}
    ${fld('pi', 'مؤشر الاستقطاب PI', '', I.pi)}
    ${fld('dar', 'نسبة DAR (60 s / 30 s)', '', I.dar)}
    ${sel('dec', 'القرار', MG_DEC, I.dec)}
    <div class="tblw" style="direction:rtl"><table class="tbl hm"><tr><th class="ar">المعيار (IEEE 43)</th><th class="ar">الحد الأدنى</th></tr><tr><td class="ar">${ar('IR1min عند 40 °C، ملفات عشوائية دون 1 kV')}</td><td dir="ltr">5 MΩ</td></tr><tr><td class="ar">${ar('PI لعزل الفئات B و F و H')}</td><td dir="ltr">2.0</td></tr><tr><td class="ar">${ar('DAR فحص سريع')}</td><td dir="ltr">≥ 1.25</td></tr></table></div>
    <p class="typ">${ar('قيم نموذجية للتعلّم من IEEE 43-2013؛ ارجع إلى المعيار وكتيّب المصنّع. لا يُحسب PI إذا كانت IR1min أكبر من 5000 MΩ.')}</p>
    <div class="row"><button type="button" class="btn pri" data-a="chk">تحقّق</button></div>
    <p class="msg" id="mg-m2" aria-live="polite"></p><div id="mg-fx"></div>
  </div>
  ${foot()}`;
  const q = s => $(s, host), m0 = q('#mg-m0'), m1 = q('#mg-m1');
  const svg = $('svg', q('.stage'));
  /* ---- LOTO ---- */
  function lotoUI(){ ['iso', 'lock', 'dead', 'disc'].forEach(k => q(`[data-l="${k}"]`).classList.toggle('ok', P[k])); q('#mg-sup').style.display = P.disc ? 'none' : ''; }
  IL.onAct(host, '[data-l]', b => {
    const k = b.dataset.l;
    if (P[k]) return;
    if (k === 'lock' && !P.iso) return say(m0, ar('افصل القاطع أولًا، ثم ضع القفل عليه وهو مفتوح.'), 'bad');
    if (k === 'dead' && !P.lock) return say(m0, ar('ضع القفل والبطاقة أولًا: قد يعيد شخص آخر التغذية وأنت تعمل.'), 'bad');
    if (k === 'disc' && !P.dead) return say(m0, ar('تحقّق من انعدام الجهد قبل لمس الأطراف؛ الفصل وحده لا يكفي دليلًا.'), 'bad');
    P[k] = true; lotoUI();
    const t = {iso:'القاطع مفتوح.', lock:'القفل الشخصي والبطاقة على القاطع؛ المفتاح معك.', dead:'الكاشف جُرّب على مصدر معروف: L1-L2 = 0 V، L2-L3 = 0 V، L3-L1 = 0 V، وكل طور إلى PE = 0 V؛ ثم جُرّب ثانية على المصدر.', disc:'فُكّت كوابل التغذية وأُبعدت؛ الآن يُختبر المحرك وحده لا الكابل والمصدر معه.'}[k];
    say(m0, ar(t), 'ok');
  });
  /* ---- leads ---- */
  const LD = Leads(svg, {
    plugs:{line:{x:64, y:262, color:'#d32f2f', el:$('[data-plug="line"]', svg)}, earth:{x:200, y:262, color:'#222', el:$('[data-plug="earth"]', svg)}},
    targets:Object.fromEntries(Object.entries({W2:[346, 76], U2:[412, 76], V2:[478, 76], U1:[346, 144], V1:[412, 144], W1:[478, 144], PE:[494, 268]}).map(([k, v]) => [k, {x:v[0] + OX, y:v[1] + OY}])),
    ok(p, t){
      if (!P.lock || !P.dead) return 'اعزل وأقفل وتحقّق من انعدام الجهد أولًا؛ لا توصل أي سلك على محرك قد يكون حيًّا.';
      if (!P.disc) return 'افصل كوابل التغذية أولًا: وإلا ستقيس عزل الكابل والقاطع معًا، وقد يصل جهد الاختبار إلى أجهزة أخرى.';
      if (p === 'line' && t === 'PE') return 'LINE يوصل إلى الملف، و EARTH إلى الجسم (PE).';
      if (p === 'earth' && t !== 'PE') return 'EARTH يوصل إلى مسمار الأرضي PE على الجسم، لا إلى الملف.';
      return true;
    },
    canDis(){ if (P.st === 'run') return 'انتظر نهاية الاختبار؛ لا تفك سلكًا والجهد مطبَّق.'; if (P.hv > 30) return `الملف ما زال مشحونًا (${f0(P.hv)} V): اضغط «تفريغ الملف» وانتظر حتى ينخفض الجهد تحت 30 V قبل فك الأسلاك.`; return true; },
    msg(t){ if (t) say(m1, ar(t), 'bad'); else say(m1, ar('الآن انقر المكان الذي تريد توصيل الطرف به، أو اسحبه إليه.')); },
    change(){ say(m1, ''); }
  });
  /* ---- voltage selector ---- */
  IL.onAct(q('#mg-vs'), '[data-v]', b => {
    if (P.st === 'run') return;
    P.volt = +b.dataset.v; $$('#mg-vs button', host).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    const i = [250, 500, 1000, 2500, 5000].indexOf(P.volt); q('#mg-knob').setAttribute('transform', `rotate(${-150 + i * 50} 82 198)`);
  });
  /* ---- test ---- */
  const lcd = {big:q('#mg-big'), v:q('#mg-v'), t:q('#mg-t'), mem:q('#mg-mem'), hv:q('#mg-hv'), unit:q('#mg-unit')};
  const Rt = t => sc.R1 * Math.pow(t / 60, sc.k);
  const mmss = t => String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  const plot = q('#mg-plot'), y0 = Math.log10(Rt(5) * 0.8), y1 = Math.log10(Rt(600) * 1.3);
  const px = t => 40 + t / 600 * 288, py = r => 140 - (Math.log10(r) - y0) / (y1 - y0) * 124;
  let pts = [];
  function drawPlot(){
    let h = `<rect x="40" y="10" width="288" height="130" fill="none" stroke="var(--line)"/>`;
    for (let m = 0; m <= 10; m += 2) h += `<line x1="${px(m * 60)}" y1="10" x2="${px(m * 60)}" y2="140" stroke="var(--line)" stroke-width=".6"/><text x="${px(m * 60)}" y="153" text-anchor="middle" font-size="10" class="txm">${m}</text>`;
    [Rt(5) * 0.8, Math.sqrt(Rt(5) * Rt(600)), Rt(600) * 1.3].forEach(r => { h += `<text x="36" y="${f1(py(r) + 4)}" text-anchor="end" font-size="9.5" class="txm">${sig3(r)}</text>`; });
    h += `<text x="324" y="22" text-anchor="end" font-size="9.5" class="txm">t (min)</text><text x="44" y="22" font-size="9.5" class="txm">IR (MΩ, log)</text>`;
    if (pts.length > 1) h += `<polyline fill="none" stroke="var(--accent)" stroke-width="2.4" points="${pts.map(p => f1(px(p[0])) + ',' + f1(py(p[1]))).join(' ')}"/>`;
    [[60, '1m'], [600, '10m']].forEach(([t, l]) => { if (P.t >= t) h += `<circle cx="${px(t)}" cy="${f1(py(Rt(t)))}" r="4" fill="var(--cur)"/><text x="${px(t) - 4}" y="${f1(py(Rt(t)) - 8)}" text-anchor="end" font-size="10" fill="var(--cur)">${l}</text>`; });
    plot.innerHTML = h;
  }
  drawPlot();
  function memTxt(){ const a = []; if (P.t >= 30) a.push('R30s ' + sig3(sc.R30)); if (P.t >= 60) a.push('R1m ' + sig3(sc.R1)); if (P.t >= 600) a.push('R10m ' + sig3(sc.R10)); lcd.mem.textContent = a.join('  '); }
  function startTest(){
    if (P.st === 'run') return;
    if (!P.disc || !P.dead) return say(m1, ar('أكمل خطوات السلامة أولًا: افصل، أقفل، تحقّق من انعدام الجهد، افصل الكوابل.'), 'bad');
    if (LD.conn.line == null || LD.conn.earth !== 'PE') return say(m1, ar('وصّل LINE إلى أحد أطراف الملف و EARTH إلى PE قبل الاختبار.'), 'bad');
    if (!P.volt) return say(m1, ar('اختر جهد الاختبار أولًا.'), 'bad');
    if (P.volt === 250) return say(m1, ar('250 V أقل من الموصى به لمحرك 400 V؛ IEEE 43 يوصي بـ 500 V DC للآلات دون 1000 V.'), 'bad');
    if (P.volt === 1000) return say(m1, ar('IEEE 43 يوصي بـ 500 V DC لمحرك جهده المقنن أقل من 1000 V؛ 1000 V للآلات من 1000 إلى 2500 V.'), 'bad');
    if (P.volt > 1000) return say(m1, ar(`${P.volt} V جهد مرتفع جدًا على محرك 400 V: يجهد العزل وقد يتلفه. اختر 500 V.`), 'bad');
    P.st = 'run'; P.t = 0; pts = []; P.dis = false;
    say(m1, ar('الاختبار يعمل: 500 V DC على الملف. لا تلمس الأطراف. القراءة ترتفع مع زمن الاستقطاب.'));
    let last = 0;
    const loop = ts => {
      if (!host.isConnected || P.st !== 'run') return;
      const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts;
      P.t = Math.min(600, P.t + dt * (DEMO ? 120 * DSPEED : TF_MG));
      const v = Math.min(500, P.t / 3 * 500) * (1 + (Math.random() - 0.5) * 0.004); P.hv = v;
      lcd.v.textContent = f0(v) + ' V DC'; lcd.t.textContent = mmss(P.t); lcd.hv.setAttribute('opacity', '1');
      if (P.t < 5) lcd.big.textContent = '-----';
      else { const r = Rt(P.t) * (1 + (Math.random() - 0.5) * 0.012); lcd.big.textContent = sig3(r); if (!pts.length || P.t - pts[pts.length - 1][0] >= 4) pts.push([P.t, Rt(P.t)]); }
      memTxt(); drawPlot();
      if (P.t >= 600){ P.st = 'done'; P.hv = 500; lcd.big.textContent = sig3(sc.R10); memTxt(); drawPlot();
        say(m1, ar('انتهى الاختبار. القيم محفوظة في ذاكرة الجهاز على الشاشة. الملف ما زال مشحونًا بنحو 500 V: فرّغه قبل فك الأسلاك.'), 'bad'); return; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  function discharge(){
    if (P.st === 'run') return say(m1, ar('انتظر نهاية الاختبار.'), 'bad');
    if (P.st !== 'done') return say(m1, ar('لا شحنة على الملف الآن؛ التفريغ يأتي بعد الاختبار.'));
    if (P.hv <= 30) return;
    say(m1, ar('التفريغ يعمل عبر مقاومة الجهاز الداخلية… انتظر.'));
    let last = 0;
    const loop = ts => {
      if (!host.isConnected) return;
      const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts;
      P.hv *= Math.exp(-dt * 1.2 * (DEMO ? 3 * DSPEED : 1));
      lcd.v.textContent = f0(P.hv) + ' V DC';
      if (P.hv <= 30){ P.hv = 0; P.dis = true; lcd.v.textContent = '0 V'; lcd.hv.setAttribute('opacity', '0');
        say(m1, ar('فُرّغ الملف: الجهد أقل من 30 V. افصل الأسلاك الآن، ويُستحسن تأريض الملف مدة لا تقل عن أربعة أضعاف زمن الاختبار.'), 'ok'); finish(); return; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  q('#mg-test').addEventListener('click', startTest);
  IL.onAct(host, '[data-a]', b => { const a = b.dataset.a; if (a === 'test') startTest(); else if (a === 'dis') discharge(); else if (a === 'chk') check(); });
  /* ---- results ---- */
  const inp = k => q(`[data-k="${k}"]`);
  ['r1', 'r10', 'r40', 'pi', 'dar', 'dec'].forEach(k => inp(k).addEventListener('input', () => { I[k] = inp(k).value; save(); }));
  function check(){
    const m2 = q('#mg-m2');
    if (P.st === 'idle' || P.st === 'run' || P.t < 600) return say(m2, ar('أكمل اختبار 10 min أولًا، ثم اقرأ القيم من ذاكرة الجهاز.'), 'bad');
    const v = k => num(inp(k).value);
    const r1 = v('r1'), r10 = v('r10'), r40 = v('r40'), pi = v('pi'), dar = v('dar'), dec = inp('dec').value;
    const ok = {r1:near(r1, sc.R1, 0.01), r10:near(r10, sc.R10, 0.01), r40:near(r40, R.R40, 0.03), pi:near(pi, R.PI, 0.025), dar:near(dar, R.DAR, 0.025), dec:dec === R.dec};
    Object.keys(ok).forEach(k => mark(inp(k), ok[k]));
    let m = '';
    if (!ok.r1) m = `اقرأ R1m من ذاكرة الجهاز: ${sig3(sc.R1)} MΩ.`;
    else if (!ok.r10) m = `اقرأ R10m من ذاكرة الجهاز: ${sig3(sc.R10)} MΩ.`;
    else if (!ok.r40) m = near(r40, sc.R1 / R.Kt, 0.03) ? 'صحّحت في الاتجاه المعاكس: الملف أبرد من 40 °C، فالقيمة عند 40 °C أصغر؛ اضرب في Kt = 0.5^((40−T)/10).' : near(r40, sc.R1, 0.01) ? 'لم تصحّح إلى 40 °C: اضرب R1min في Kt = 0.5^((40−T)/10).' : `IR40 = R1min × 0.5^((40−${sc.T})/10)؛ راجع الأس: (40 − ${sc.T})/10 = ${f1((40 - sc.T) / 10)}.`;
    else if (!ok.pi) m = near(pi, 1 / R.PI, 0.03) ? 'قلبت النسبة: PI = R10min / R1min.' : 'PI = R10min / R1min بالقيمتين المقروءتين (بلا تصحيح حراري).';
    else if (!ok.dar) m = near(dar, 1 / R.DAR, 0.03) ? 'قلبت النسبة: DAR = R60s / R30s.' : `DAR = R1min / R30s، و R30s = ${sig3(sc.R30)} MΩ من الذاكرة.`;
    else if (!ok.dec) m = R.dec === 'ok' ? `PI = ${f2(R.PI)} ≥ 2.0 و IR40 = ${sig3(R.R40)} MΩ ≥ 5 MΩ: العزل مقبول، أعد التوصيل وشغّل.` : R.dec === 'dry' ? `PI = ${f2(R.PI)} أقل من 2.0: العزل مبتلّ أو متسخ؛ نظّف الملفات وجفّفها ثم أعد الاختبار.` : `IR40 = ${sig3(R.R40)} MΩ أقل من الحد الأدنى 5 MΩ: ممنوع التشغيل؛ جفّف وأعد الاختبار، وإن بقي منخفضًا فأعد اللف.`;
    if (m) return say(m2, ar(m), 'bad');
    P.ok = true;
    q('#mg-fx').innerHTML = `<div class="fx">Kt = 0.5^((40 − ${sc.T})/10) = ${f3(R.Kt)} ; IR40 = ${sig3(sc.R1)} × ${f3(R.Kt)} = <b>${sig3(R.R40)} MΩ</b> <span class="${R.R40 >= 5 ? 'ok' : 'bad'}">${R.R40 >= 5 ? '≥' : '<'} 5 MΩ</span><br>PI = R10 / R1 = ${sig3(sc.R10)} / ${sig3(sc.R1)} = <b>${f2(R.PI)}</b> <span class="${R.PI >= 2 ? 'ok' : 'bad'}">${R.PI >= 2 ? '≥' : '<'} 2.0</span><br>DAR = R60s / R30s = ${sig3(sc.R1)} / ${sig3(sc.R30)} = <b>${f2(R.DAR)}</b> <span class="${R.DAR >= 1.25 ? 'ok' : 'bad'}">${R.DAR >= 1.25 ? '≥' : '<'} 1.25</span></div>`;
    q('#mg-r').classList.add('ok');
    say(m2, ar('صحيح: ' + MG_DEC.find(d => d[0] === R.dec)[1] + '.') + (P.dis ? '' : ' ' + ar('بقي تفريغ الملف قبل فك الأسلاك.')), 'ok');
    finish();
  }
  function finish(){ if (P.ok && P.dis) win('megger', 'أحسنت: تسلسل السلامة صحيح، والقياس بـ 500 V، والتصحيح و PI و DAR والقرار صحيحة، والملف مفرَّغ.'); }
  lotoUI();
  newScenario(host, 'megger', () => { S.mg = {sc:genMG()}; });
  demo(host, 'megger', async () => {
    for (const k of ['iso', 'lock', 'dead', 'disc']) await dClick(q(`[data-l="${k}"]`), 400);
    await dClick($('[data-plug="line"]', svg), 350); await dClick($('[data-tg="U1"]', svg), 350);
    await dClick($('[data-plug="earth"]', svg), 350); await dClick($('[data-tg="PE"]', svg), 350);
    await dClick(q('[data-v="500"]'));
    await dClick(q('[data-a="test"]'));
    await dWait(() => P.st === 'done');
    await dSet(inp('r1'), sig3(sc.R1)); await dSet(inp('r10'), sig3(sc.R10)); await dSet(inp('r40'), sig3(R.R40));
    await dSet(inp('pi'), f2(R.PI)); await dSet(inp('dar'), f2(R.DAR)); await dSet(inp('dec'), R.dec);
    await dClick(q('[data-a="chk"]'));
    await dClick(q('[data-a="dis"]'));
    await dWait(() => P.dis);
  });
};

/* =====================================================================
   TAB 3 · winding (l4): micro-ohmmeter, R20, unbalance, find the faults
   ===================================================================== */
const WD_K = [['ok', 'سليم'], ['turn', 'قصر بين اللفات'], ['open', 'ملف مفتوح (فتح طور)'], ['hr', 'وصلة عالية المقاومة'], ['earth', 'تماس مع الجسم (عطل أرضي)']];
const WD_TAGS = ['C-201', 'C-202', 'SP-37A', 'RW-37B'];
const WD_PAIRS = ['UV', 'VW', 'WU'];
const par = (a, b) => !isFinite(a) ? b : !isFinite(b) ? a : a * b / (a + b);
function genWD(){
  const kinds = shuffle(['ok', 'turn', 'open', 'hr', 'earth']).slice(0, 4);
  return {m:WD_TAGS.map((tag, i) => {
    const kind = kinds[i], T = i === 0 ? rint(24, 36) : rint(18, 46);
    const c = [0, 1, 2].map(() => jit(0.18, 0.003)), f = rint(0, 2);
    if (kind === 'turn') c[f] *= 1 - rnd(0.07, 0.11);
    if (kind === 'hr') c[f] *= 1 + rnd(0.10, 0.18);
    if (kind === 'open') c[f] = Infinity;
    const r20 = [par(c[0], c[1] + c[2]), par(c[1], c[0] + c[2]), par(c[2], c[0] + c[1])];
    const rT = r20.map(r => Math.round(r * (235 + T) / 255 * 10000) / 10);   // mΩ, 0.1 resolution
    const ir = kind === 'earth' ? +rnd(0.03, 0.4).toFixed(2) : Math.round(rnd(180, 2000));
    return {tag, kind, T, rT, ir, meas:{}, irM:false, cls:''};
  }), calc:{}};
}
const r20of = (r, T) => r * 255 / (235 + T);
const ubOf = a => { const mx = Math.max(...a), mn = Math.min(...a), av = (a[0] + a[1] + a[2]) / 3; return (mx - mn) / av * 100; };
function mohmSvg(N){
  return `<svg viewBox="${N ? '0 0 266 522' : '0 0 540 270'}" role="img" aria-label="جهاز الميكرو أوم وأطراف المحرك">
  <rect x="8" y="10" width="250" height="250" rx="16" fill="#3c4449" stroke="#1d2124" stroke-width="2.5"/>
  <rect x="20" y="22" width="226" height="226" rx="10" fill="#4b545a"/>
  <text x="133" y="40" text-anchor="middle" font-size="9.5" font-weight="700" fill="#f6cf45">MICRO-OHMMETER 10 A</text>
  <rect x="32" y="48" width="202" height="84" rx="5" fill="#1d2124"/><rect x="36" y="52" width="194" height="76" rx="3" fill="#c7d3b4"/>
  <text id="wd-big" x="220" y="98" text-anchor="end" font-size="27" font-weight="700" class="lcdt">-----</text>
  <text x="220" y="118" text-anchor="end" font-size="11" class="lcdt">mΩ</text>
  <text id="wd-i" x="42" y="68" font-size="11" class="lcdt">I 0.0 A</text><text id="wd-tg" x="220" y="68" text-anchor="end" font-size="11" class="lcdt"></text>
  <g class="hit" id="wd-test" tabindex="0" role="button" aria-label="TEST"><circle class="ring" cx="190" cy="168" r="26"/><circle cx="190" cy="168" r="21" fill="#2e7d32" stroke="#103d12" stroke-width="3"/><text x="190" y="172" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">TEST</text></g>
  ${plugSvg('red', 70, 210, '#d32f2f', 'C1·P1')}${plugSvg('blk', 134, 210, '#222', 'P2·C2')}
  <g transform="${N ? 'translate(-282 262)' : ''}"><rect x="292" y="16" width="240" height="236" rx="12" fill="#5d666c" stroke="#3c4449" stroke-width="3"/>
  <rect x="308" y="32" width="208" height="204" rx="8" fill="#ecebe4" stroke="#9aa1a6"/>
  <text id="wd-mt" x="412" y="226" text-anchor="middle" font-size="12" font-weight="700" fill="#333"></text>
  ${[0, 1, 2].map(i => { const x = 346 + i * 66; return `<rect x="${x - 8}" y="70" width="16" height="84" rx="7" fill="#d08a3a" stroke="#7a4518" stroke-width="1.5"/><circle cx="${x}" cy="76" r="11" fill="#c9a24a" stroke="#6d5420" stroke-width="2"/><text x="${x}" y="58" text-anchor="middle" font-size="11" font-weight="700" fill="#11181c">${['W2', 'U2', 'V2'][i]}</text>`; }).join('')}
  ${[['U', 346], ['V', 412], ['W', 478]].map(([k, x]) => `<g class="hit" data-tg="${k}" tabindex="0" role="button" aria-label="${k}1"><rect x="${x - 20}" y="132" width="40" height="60" fill="transparent"/><circle class="ring" cx="${x}" cy="150" r="17"/><circle cx="${x}" cy="150" r="12" fill="#c9a24a" stroke="#6d5420" stroke-width="2"/><polygon points="${hexPts(x, 150, 7)}" fill="#b4b8bb" stroke="#555"/><text x="${x}" y="186" text-anchor="middle" font-size="12" font-weight="700" fill="#11181c">${k}1</text></g>`).join('')}</g>
  <g class="cabs"></g>
  </svg>`;
}
BUILD.winding = host => {
  if (!S.wd || !S.wd.m) S.wd = genWD();
  const W = S.wd; let cur = 0, busy = false; const NB = NARROW(), OX = NB ? -282 : 0, OY = NB ? 262 : 0;
  host.innerHTML = `
  <div class="dev"><h3><span class="n">1</span>قِس بالميكرو أوم (أربعة أسلاك)</h3>
    <p class="note">${ar('المحركات الأربعة على منضدة الورشة، مفصولة ومعزولة، والقناطر الدلتا في مكانها. ضع ملقط C1·P1 على طرف وملقط P2·C2 على طرف آخر، ثم اضغط TEST. يُسجَّل الناتج في الجدول تلقائيًا.')}</p>
    <div class="chipline" id="wd-ms">${W.m.map((m, i) => `<button type="button" class="btn" data-m="${i}" aria-pressed="${i === 0}">${L(m.tag)}</button>`).join('')}</div>
    <div class="stage" style="max-width:560px;margin:0 auto;width:100%">${mohmSvg(NB)}</div>
    <div class="row"><button type="button" class="btn" data-a="ir">${ar('اختبار العزل إلى الجسم (500 V)')}</button><span class="pill" id="wd-T"></span></div>
    <p class="msg" id="wd-m1" aria-live="polite"></p>
  </div>
  <div class="dev"><h3><span class="n">2</span>السجل والحكم</h3>
    <div class="tblw"><table class="tbl hm" id="wd-tb"></table></div>
    <p class="typ">${ar('قيم نموذجية للتعلّم: المرجع للمحرك C-201 نحو 120 mΩ بين طرفين عند 20 °C. عدم الاتزان حتى 2 % مقبول، و 2–5 % يُفحص، وأكثر من 5 % عطل. ارجع إلى كتيّب المصنّع.')}</p>
    <div class="dev" id="wd-c" style="background:var(--bg)"><h3>${ar('احسب للمحرك C-201')}</h3>
      ${fld('a', 'R20 بين U و V', 'mΩ', W.calc.a)}${fld('b', 'R20 بين V و W', 'mΩ', W.calc.b)}${fld('c', 'R20 بين W و U', 'mΩ', W.calc.c)}
      ${fld('ub', 'عدم الاتزان', '%', W.calc.ub)}
      <div class="row"><button type="button" class="btn pri" data-a="calc">تحقّق من الحساب</button></div>
      <p class="msg" id="wd-m2" aria-live="polite"></p><div id="wd-fx"></div>
    </div>
    <div class="row"><button type="button" class="btn pri" data-a="cls">تحقّق من حالة المحركات</button></div>
    <p class="msg" id="wd-m3" aria-live="polite"></p>
  </div>
  ${foot()}`;
  const q = s => $(s, host), svg = $('svg', q('.stage')), m1 = q('#wd-m1');
  const LD = Leads(svg, {
    single:true,
    plugs:{red:{x:70, y:210, color:'#d32f2f', el:$('[data-plug="red"]', svg)}, blk:{x:134, y:210, color:'#222', el:$('[data-plug="blk"]', svg)}},
    targets:{U:{x:346 + OX, y:150 + OY}, V:{x:412 + OX, y:150 + OY}, W:{x:478 + OX, y:150 + OY}},
    canDis(){ return busy ? 'انتظر حتى تستقر القراءة وينقطع تيار الاختبار.' : true; },
    msg(t){ if (t) say(m1, ar(t), 'bad'); else say(m1, ar('الآن انقر الطرف الذي تريد وضع الملقط عليه، أو اسحب الملقط إليه.')); },
    change(){ say(m1, ''); }
  });
  const big = q('#wd-big'), li = q('#wd-i');
  function selMotor(i){
    if (busy) return;
    cur = i; LD.clearAll(); big.textContent = '-----'; li.textContent = 'I 0.0 A';
    $$('#wd-ms .btn', host).forEach(b => b.setAttribute('aria-pressed', +b.dataset.m === i ? 'true' : 'false'));
    q('#wd-mt').textContent = W.m[i].tag; q('#wd-tg').textContent = W.m[i].tag;
    q('#wd-T').innerHTML = ar(`حرارة الملف ${W.m[i].T} °C (مقيسة على الجسم بعد توقف طويل)`);
    table();
  }
  IL.onAct(q('#wd-ms'), '[data-m]', b => selMotor(+b.dataset.m));
  function pairKey(){ const a = LD.conn.red, b = LD.conn.blk; if (!a || !b || a === b) return null; const k = a + b; return WD_PAIRS.includes(k) ? k : WD_PAIRS.find(p => p === b + a); }
  function test(){
    if (busy) return;
    const k = pairKey();
    if (!LD.conn.red || !LD.conn.blk) return say(m1, ar('ضع الملقطين على طرفين مختلفين أولًا.'), 'bad');
    if (!k) return say(m1, ar('الملقطان على الطرف نفسه: انقل أحدهما إلى طرف آخر.'), 'bad');
    const mo = W.m[cur], R = mo.rT[WD_PAIRS.indexOf(k)];
    busy = true; say(m1, ar('تيار الاختبار يرتفع عبر محاثة الملف… انتظر الاستقرار.'));
    let t = 0, last = 0;
    const loop = ts => {
      if (!host.isConnected) return;
      const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts; t += dt * (DEMO ? 2.5 * DSPEED : 1);
      const I = 10 * (1 - Math.exp(-t * 3));
      li.textContent = 'I ' + f1(I) + ' A';
      if (t < 0.7) big.textContent = '-----';
      else { const v = R * (1 + 0.04 * Math.exp(-(t - 0.7) * 3)) * (1 + (Math.random() - 0.5) * 0.0006); big.textContent = f1(v); }
      if (t >= 2.2){
        big.textContent = f1(R); li.textContent = 'I 10.0 A'; busy = false; mo.meas[k] = R; save(); table();
        say(m1, ar(`المحرك ${mo.tag}: R(${k[0]}-${k[1]}) = ${f1(R)} mΩ عند ${mo.T} °C؛ سُجّلت في الجدول.`), 'ok'); return;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  q('#wd-test').addEventListener('click', test);
  function irTest(){
    if (busy) return;
    const mo = W.m[cur]; busy = true; say(m1, ar('اختبار العزل 500 V DC بين الملف والجسم… (الملقطان مفصولان عن الجهاز)'));
    setTimeout(() => { busy = false; mo.irM = true; save(); table(); say(m1, ar(`المحرك ${mo.tag}: IR1min = ${mo.ir} MΩ عند ${mo.T} °C${mo.ir < 5 ? '؛ قيمة منخفضة جدًا!' : '.'} فُرّغ الملف بعد الاختبار.`), mo.ir < 5 ? 'bad' : 'ok'); }, DEMO ? 400 / DSPEED : 1200);
  }
  const calcOK = () => !!W.calc.ok;
  function table(){
    const rows = W.m.map((mo, i) => {
      const r = WD_PAIRS.map(p => mo.meas[p]), all = r.every(x => x != null);
      const r20 = all ? r.map(x => r20of(x, mo.T)) : null, ub = all ? ubOf(r20) : null;
      const auto = calcOK() && all;
      return `<tr class="${i === cur ? 'cur' : ''}"><td>${mo.tag}</td><td>${mo.T}</td>${r.map(x => `<td>${x == null ? '—' : f1(x)}</td>`).join('')}<td class="${mo.irM ? (mo.ir < 5 ? 'bad' : 'ok') : ''}">${mo.irM ? mo.ir : '—'}</td><td>${auto ? f1((r20[0] + r20[1] + r20[2]) / 3) : '—'}</td><td class="${auto ? (ub > 5 ? 'bad' : ub > 2 ? 'wr' : 'ok') : ''}">${auto ? f1(ub) : '—'}</td><td class="ar"><select data-cls="${i}"><option value="">اختر…</option>${WD_K.map(k => `<option value="${k[0]}"${mo.cls === k[0] ? ' selected' : ''}>${k[1]}</option>`).join('')}</select></td></tr>`;
    }).join('');
    q('#wd-tb').innerHTML = `<tr><th>Motor</th><th>T °C</th><th>U-V mΩ</th><th>V-W mΩ</th><th>W-U mΩ</th><th>IR MΩ</th><th>R20 avg</th><th>Unbal. %</th><th class="ar">الحالة</th></tr>${rows}`;
    $$('[data-cls]', host).forEach(s => s.addEventListener('change', () => { W.m[+s.dataset.cls].cls = s.value; save(); mark(s, null); }));
  }
  const inp = k => q(`[data-k="${k}"]`);
  ['a', 'b', 'c', 'ub'].forEach(k => inp(k).addEventListener('input', () => { W.calc[k] = inp(k).value; save(); }));
  function calc(){
    const mo = W.m[0], m2 = q('#wd-m2');
    if (WD_PAIRS.some(p => mo.meas[p] == null)) return say(m2, ar('قِس المقاومات الثلاث للمحرك C-201 أولًا.'), 'bad');
    const raw = WD_PAIRS.map(p => mo.meas[p]), r20 = raw.map(x => r20of(x, mo.T)), ub = ubOf(r20);
    const v = ['a', 'b', 'c'].map(k => num(inp(k).value)), vub = num(inp('ub').value);
    const okR = v.map((x, i) => nearA(x, r20[i], 0.35)); okR.forEach((o, i) => mark(inp('abc'[i]), o));
    const okU = nearA(vub, ub, 0.15); mark(inp('ub'), okU);
    const bi = okR.indexOf(false);
    if (bi > -1){
      const x = v[bi], k = (235 + mo.T) / 255;
      return say(m2, ar(nearA(x, raw[bi], 0.35) ? 'لم تصحّح إلى 20 °C: R20 = RT × (235 + 20)/(235 + T).' : nearA(x, raw[bi] * k, 0.4) ? 'قلبت معامل التصحيح: الملف أسخن من 20 °C فالقيمة عند 20 °C أصغر؛ R20 = RT × 255/(235 + T).' : `R20 = ${f1(raw[bi])} × 255/(235 + ${mo.T}); راجع الحساب.`), 'bad');
    }
    if (!okU){ const mx = Math.max(...r20), mn = Math.min(...r20); return say(m2, ar(nearA(vub, (mx - mn) / mn * 100, 0.15) ? 'قسّم على المتوسط لا على الأصغر: (max − min)/avg × 100.' : 'عدم الاتزان = (max − min)/avg × 100 من القيم الثلاث المصحّحة.'), 'bad'); }
    W.calc.ok = true; save(); q('#wd-c').classList.add('ok');
    q('#wd-fx').innerHTML = `<div class="fx">R20 = RT × (235 + 20)/(235 + ${mo.T}) = RT × ${f3(255 / (235 + mo.T))}<br>${raw.map((x, i) => `${WD_PAIRS[i]}: ${f1(x)} → <b>${f1(r20[i])} mΩ</b>`).join(' ; ')}<br>Unbal. = (${f1(Math.max(...r20))} − ${f1(Math.min(...r20))}) / ${f1((r20[0] + r20[1] + r20[2]) / 3)} × 100 = <b>${f2(ub)} %</b> <span class="${ub > 5 ? 'bad' : ub > 2 ? '' : 'ok'}">${ub > 5 ? '> 5 %' : ub > 2 ? '2–5 %' : '≤ 2 %'}</span></div>`;
    say(m2, ar('صحيح. يحسب الجدول الآن R20 وعدم الاتزان لبقية المحركات بعد قياسها.'), 'ok');
    table(); finish();
  }
  function why(mo){
    const r20 = WD_PAIRS.map(p => r20of(mo.meas[p], mo.T)), ub = ubOf(r20);
    return {ok:`${mo.tag} سليم: عدم الاتزان ${f1(ub)} % أقل من 2 % والعزل ${mo.ir} MΩ مرتفع.`,
      turn:`${mo.tag}: قراءتان أقل من المرجع 120 mΩ وعدم الاتزان ${f1(ub)} % والعزل سليم: قصر بين لفات أحد الملفات.`,
      open:`${mo.tag}: قراءة نحو 360 mΩ (ثلاثة أضعاف) وقراءتان نحو 180 mΩ: ملف مفتوح داخل الدلتا.`,
      hr:`${mo.tag}: قراءة أعلى من الأخريين وعدم الاتزان ${f1(ub)} %: وصلة أو لحام عالي المقاومة؛ افحص الأطراف والوصلات.`,
      earth:`${mo.tag}: المقاومات متزنة لكن العزل إلى الجسم ${mo.ir} MΩ فقط: تماس بين الملف والجسم، والميكرو أوم لا يكشفه.`}[mo.kind];
  }
  function cls(){
    const m3 = q('#wd-m3');
    if (!calcOK()) return say(m3, ar('احسب R20 وعدم الاتزان للمحرك C-201 أولًا.'), 'bad');
    const miss = W.m.find(mo => WD_PAIRS.some(p => mo.meas[p] == null) || !mo.irM);
    if (miss) return say(m3, ar(`قِس المقاومات الثلاث والعزل للمحرك ${miss.tag} قبل الحكم عليه.`), 'bad');
    const empty = W.m.find(mo => !mo.cls); if (empty) return say(m3, ar(`اختر حالة المحرك ${empty.tag}.`), 'bad');
    let bad = null;
    W.m.forEach((mo, i) => { const ok = mo.cls === mo.kind; mark($(`[data-cls="${i}"]`, host), ok); if (!ok && !bad) bad = mo; });
    if (bad) return say(m3, ar(why(bad)), 'bad');
    W.done = true; save();
    say(m3, ar('صحيح: ' + W.m.map(mo => `${mo.tag} ${WD_K.find(k => k[0] === mo.kind)[1]}`).join('، ') + '.'), 'ok');
    finish();
  }
  function finish(){ if (W.calc.ok && W.done) win('winding', 'أحسنت: القياس والتصحيح إلى 20 °C وعدم الاتزان صحيحة، وعرفت حالة المحركات الأربعة.'); }
  IL.onAct(host, '[data-a]', b => { const a = b.dataset.a; if (a === 'ir') irTest(); else if (a === 'calc') calc(); else if (a === 'cls') cls(); });
  selMotor(0);
  if (W.calc.ok){ W.calc.ok = false; calc(); }
  newScenario(host, 'winding', () => { S.wd = genWD(); });
  demo(host, 'winding', async () => {
    W.m.forEach(mo => { mo.meas = {}; mo.irM = false; mo.cls = ''; }); W.calc = {}; W.done = false; table();
    const pr = $('[data-plug="red"]', svg), pb = $('[data-plug="blk"]', svg), tg = k => $(`[data-tg="${k}"]`, svg);
    for (let i = 0; i < 4; i++){
      await dClick(q(`[data-m="${i}"]`), 300);
      for (const p of WD_PAIRS){
        if (LD.conn.red !== p[0]){ await dClick(pr, 250); await dClick(tg(p[0]), 250); }
        if (LD.conn.blk !== p[1]){ await dClick(pb, 250); await dClick(tg(p[1]), 250); }
        await dClick(q('#wd-test'), 250); await dWait(() => !busy);
      }
      await dClick(q('[data-a="ir"]'), 250); await dWait(() => !busy);
      if (i === 0){
        const mo = W.m[0], r20 = WD_PAIRS.map(p => r20of(mo.meas[p], mo.T));
        await dSet(inp('a'), f1(r20[0])); await dSet(inp('b'), f1(r20[1])); await dSet(inp('c'), f1(r20[2])); await dSet(inp('ub'), f2(ubOf(r20)));
        await dClick(q('[data-a="calc"]'));
      }
    }
    for (let i = 0; i < 4; i++) await dSet(q(`[data-cls="${i}"]`), W.m[i].kind, 250);
    await dClick(q('[data-a="cls"]'));
  });
};

/* =====================================================================
   TAB 4 · bearing (l5): G = 0.005·D·B, t = K·[14e6/(n·√d) − 4d], regreasing, sounds
   ===================================================================== */
const BR = {code:'6313 C3', d:65, D:140, B:33, n:1475};
BR.G = 0.005 * BR.D * BR.B;                                   // 23.1 g
BR.base = 14e6 / (BR.n * Math.sqrt(BR.d)) - 4 * BR.d;         // 917.3 h
const GUN = 1.5;                                              // g per stroke (gun calibrated by weighing)
const BR_K = [['ok', 'سليم'], ['dry', 'نقص التشحيم'], ['over', 'زيادة التشحيم'], ['race', 'تلف في المجرى (تقشّر)'], ['dirt', 'شحم ملوّث بالأتربة']];
function genBR(){
  const kinds = shuffle(['ok', 'dry', 'over', 'race', 'dirt']).slice(0, 3);
  const tmp = {ok:[50, 58], dry:[80, 88], over:[88, 95], race:[62, 68], dirt:[66, 72]};
  const where = shuffle(['P-101 DE', 'P-103 NDE', 'C-202 DE', 'CH-301 NDE', 'C-201 NDE']);
  return {tb:pick([60, 70]), cases:kinds.map((k, i) => ({kind:k, T:rint(tmp[k][0], tmp[k][1]), at:where[i], ans:''})), in:{}};
}
const brMsg = c => ({ok:`صوت ناعم منتظم وحرارة ${c.T} °C طبيعية: المحمل سليم؛ تابع حسب الجدول.`,
  dry:`صفير حاد مع حرارة ${c.T} °C: نقص تشحيم؛ شحّم بالكمية المحسوبة وراقب الحرارة.`,
  over:`صوت هادئ لكن الحرارة ${c.T} °C بعد تشحيم زائد والسدادة مغلقة: افتح سدادة التصريف وشغّل ليخرج الزائد.`,
  race:'طرقات سريعة منتظمة: عيب في المجرى (تقشّر)؛ خطّط لاستبدال المحمل وأكّد بتحليل الاهتزاز.',
  dirt:'خشخشة غير منتظمة: شحم ملوّث بالأتربة؛ نظّف واستبدل الشحم وافحص موانع التسرب.'})[c.kind];
const brHint = {ok:'', dry:'آخر تشحيم قبل 14 شهرًا.', over:'شُحّم قبل ساعتين بنحو 60 g والسدادة مغلقة.', race:'', dirt:'مانع التسرب الخارجي مكسور.'};
/* synthetic stethoscope signal */
function brSignal(kind, rate, dur){
  const n = Math.floor(rate * dur), x = new Float32Array(n);
  let lp = 0, ring = 0, ringV = 0, seed = kind.length * 977 + 13;
  const rnd1 = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const fr = 1475 / 60, bpfo = 3.06 * fr;
  let nextImp = 0;
  for (let i = 0; i < n; i++){
    const t = i / rate, w = rnd1() * 2 - 1;
    lp += 0.08 * (w - lp);
    let v = lp * 0.5 + 0.035 * Math.sin(2 * Math.PI * 100 * t) * (1 + 0.2 * Math.sin(2 * Math.PI * fr * t));
    if (kind === 'over') v *= 0.55;
    if (kind === 'dry'){ const f = 3200 + 160 * Math.sin(2 * Math.PI * 1.3 * t); v += 0.11 * Math.sin(2 * Math.PI * f * t + 3 * Math.sin(2 * Math.PI * 7 * t)) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 3 * t)) + 0.05 * w; }
    if (kind === 'race' || kind === 'dirt'){
      if (t >= nextImp){
        const a = kind === 'race' ? 0.45 * (0.6 + 0.4 * Math.cos(2 * Math.PI * fr * t)) : 0.08 + 0.5 * Math.pow(rnd1(), 2);
        ringV += a; nextImp = t + (kind === 'race' ? 1 / bpfo : -Math.log(1 - rnd1() * 0.999) / 55);
      }
      ring = ringV * Math.sin(2 * Math.PI * (kind === 'race' ? 2600 : 3600) * t); ringV *= Math.exp(-1 / (rate * 0.0016));
      v += ring;
    }
    x[i] = Math.max(-1, Math.min(1, v));
  }
  return x;
}
function waveSvg(kind){
  const x = brSignal(kind, 22050, 0.16), N = 320, step = Math.floor(x.length / N);
  let up = '', dn = '';
  for (let i = 0; i < N; i++){ let mx = -1, mn = 1; for (let j = 0; j < step; j++){ const v = x[i * step + j]; if (v > mx) mx = v; if (v < mn) mn = v; } up += `${i},${f1(40 - mx * 36)} `; dn = `${i},${f1(40 - mn * 36)} ` + dn; }
  return `<svg viewBox="0 0 320 80" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="40" x2="320" y2="40" stroke="#1f3a2f"/><polygon points="${up}${dn}" fill="#7dff9a" opacity=".85"/></svg>`;
}
function housingSvg(){
  return `<svg viewBox="0 0 380 250" role="img" aria-label="مقطع في غطاء المحمل">
  <rect x="0" y="0" width="380" height="250" fill="none"/>
  <rect x="40" y="40" width="250" height="170" rx="10" fill="var(--ral)" stroke="var(--ral-d)" stroke-width="2"/>
  <rect x="62" y="70" width="206" height="110" rx="6" fill="#efe9d6" stroke="#9aa1a6"/>
  <rect id="br-fill" x="64" y="178" width="202" height="0" fill="#e0b84a" opacity=".85"/>
  <rect x="125" y="88" width="80" height="74" rx="4" fill="#9ea6ab" stroke="#555"/>
  ${[0, 1, 2].map(i => `<circle cx="165" cy="${100 + i * 25}" r="10" fill="#d9dde0" stroke="#555"/>`).join('')}
  <rect x="0" y="112" width="380" height="26" fill="#b9c1c7" stroke="#6b7378"/>
  <text x="18" y="129" font-size="10" fill="#333">shaft</text>
  <g id="br-nip"><rect x="155" y="18" width="20" height="24" fill="#b4b8bb" stroke="#555"/><circle cx="165" cy="14" r="8" fill="#c9a24a" stroke="#6d5420" stroke-width="2"/><g id="br-dirt"><circle cx="160" cy="11" r="3" fill="#5a4630"/><circle cx="170" cy="16" r="2.5" fill="#5a4630"/><circle cx="166" cy="8" r="2" fill="#5a4630"/></g></g>
  <path d="M165 42 L165 70" stroke="#e0b84a" stroke-width="5" id="br-flow" opacity="0"/>
  <g class="hit" id="br-plug" tabindex="0" role="button" aria-label="سدادة التصريف"><rect x="140" y="200" width="90" height="40" fill="transparent"/><circle class="ring" cx="165" cy="222" r="18"/><rect id="br-plg" x="153" y="208" width="24" height="20" rx="3" fill="#5d666c" stroke="#222"/><text x="196" y="226" font-size="11" class="tx">relief</text></g>
  <path id="br-purge" d="M165 212 q-6 14 2 26 q8 6 -4 10" fill="none" stroke="#c99a2a" stroke-width="8" stroke-linecap="round" opacity="0"/>
  <text x="300" y="60" font-size="11" class="tx">NDE · DE</text><text x="300" y="76" font-size="11" class="tx">6313 C3</text>
  <g transform="translate(300 160)"><rect x="0" y="-60" width="64" height="70" rx="6" fill="#2e3439"/><rect x="5" y="-54" width="54" height="24" rx="3" fill="#c7d3b4"/><text id="br-g" x="55" y="-37" text-anchor="end" font-size="13" font-weight="700" class="lcdt">0.0 g</text><text x="32" y="-12" text-anchor="middle" font-size="9" fill="#e9eef1">grease</text><text x="32" y="2" text-anchor="middle" font-size="9" fill="#e9eef1">counter</text></g>
  </svg>`;
}
BUILD.bearing = host => {
  if (!S.br || !S.br.cases) S.br = genBR();
  const B = S.br, I = B.in, K = 10 * (B.tb >= 65 ? 0.5 : 1), T = K * BR.base;
  const P = {grease:'', clean:false, open:false, g:0, ran:false, closed:false, fail:false};
  host.innerHTML = `
  <div class="grid2">
  <div class="dev${B.calc ? ' ok' : ''}" id="br-a"><h3><span class="n">1</span>احسب الكمية والفترة</h3>
    <div class="tblw"><table class="tbl hm"><tr><th>Bearing</th><th>d</th><th>D</th><th>B</th><th>n</th><th>T bearing</th></tr><tr><td>6313 C3 (DE)</td><td>65 mm</td><td>140 mm</td><td>33 mm</td><td>1475 rpm</td><td>${B.tb} °C</td></tr></table></div>
    <p class="note">${ar('محرك أفقي، بيئة نظيفة وجافة، والاهتزاز 2.1 mm/s. K حاصل ضرب المعاملات:')}</p>
    <div class="tblw" style="direction:rtl"><table class="tbl hm"><tr><td class="ar">نوع المحمل: كروي</td><td dir="ltr">10</td></tr><tr><td class="ar">${ar('حرارة المحمل أقل من 65 °C')}</td><td dir="ltr">1.0</td></tr><tr><td class="ar">${ar('حرارة المحمل 65–80 °C')}</td><td dir="ltr">0.5</td></tr><tr><td class="ar">${ar('أفقي، نظيف وجاف، اهتزاز أقل من 5 mm/s')}</td><td dir="ltr">1</td></tr></table></div>
    <div class="fx">G = 0.005 · D · B (g) ; t = K · [14·10⁶ / (n·√d) − 4·d] (h)</div>
    ${fld('G', 'كمية الشحم G', 'g', I.G)}${fld('K', 'المعامل K', '', I.K)}${fld('t', 'فترة إعادة التشحيم t', 'h', I.t)}
    <div class="row"><button type="button" class="btn pri" data-a="calc">تحقّق</button></div>
    <p class="msg" id="br-m1" aria-live="polite"></p><div id="br-fx"></div>
    <p class="typ">${ar('قيم نموذجية للتعلّم بطريقة SKF/ISO 281 المبسّطة؛ اتبع كتيّب المحرك ولوحة التشحيم إن وُجدت.')}</p>
  </div>
  <div class="dev" id="br-b"><h3><span class="n">2</span>شحّم المحمل</h3>
    ${sel('gr', 'نوع الشحم', [['li', 'ليثيوم معقّد NLGI 2 (المذكور في كتيّب المحرك)'], ['pu', 'بولي يوريا NLGI 2'], ['ca', 'كالسيوم NLGI 3']], '')}
    <div class="stage">${housingSvg()}</div>
    <div class="loto">
      <button type="button" class="btn" data-g="clean">نظّف الحلمة ورأس المسدس</button>
      <button type="button" class="btn" data-g="open">افتح سدادة التصريف</button>
      <button type="button" class="btn pri" data-g="pump">اضغط المسدس (1.5 g)</button>
      <button type="button" class="btn" data-g="run">شغّل 30 min والسدادة مفتوحة</button>
      <button type="button" class="btn" data-g="close">أغلق السدادة</button>
      <button type="button" class="btn" data-g="reset">أعد التمرين</button>
    </div>
    <p class="msg" id="br-m2" aria-live="polite"></p>
  </div>
  </div>
  <div class="dev" id="br-c"><h3><span class="n">3</span>شخّص المحمل من صوته وحرارته</h3>
    <p class="note">${ar('استمع بالسماعة الميكانيكية (أو اقرأ شكل الموجة)، واقرأ حرارة الغطاء بالمحرار، ثم اختر التشخيص.')}</p>
    <div class="grid2" id="br-cases"></div>
    <p class="msg" id="br-m3" aria-live="polite"></p>
  </div>
  ${foot()}`;
  const q = s => $(s, host), inp = k => q(`[data-k="${k}"]`);
  ['G', 'K', 't'].forEach(k => inp(k).addEventListener('input', () => { I[k] = inp(k).value; save(); }));
  function calc(){
    const g = num(inp('G').value), k = num(inp('K').value), t = num(inp('t').value), m = q('#br-m1');
    const ok = {G:near(g, BR.G, 0.02), K:nearA(k, K, 0.001), t:near(t, T, 0.03)};
    Object.keys(ok).forEach(x => mark(inp(x), ok[x]));
    if (!ok.G) return say(m, ar(near(g, 0.005 * BR.d * BR.B, 0.03) ? 'استخدم القطر الخارجي D = 140 mm لا قطر الثقب d.' : 'G = 0.005 × D × B = 0.005 × 140 × 33 بالغرام.'), 'bad');
    if (!ok.K) return say(m, ar(k === 10 && K === 5 ? `حرارة المحمل ${B.tb} °C تقع في 65–80 °C: اضرب في 0.5، فـ K = 5.` : k === 5 && K === 10 ? `حرارة المحمل ${B.tb} °C أقل من 65 °C: معامل الحرارة 1.0، فـ K = 10.` : 'K حاصل ضرب المعاملات: كروي 10 × الحرارة × 1 × 1 × 1.'), 'bad');
    if (!ok.t) return say(m, ar(near(t, BR.base, 0.03) ? 'لم تضرب في K: هذه القيمة الأساسية فقط.' : 't = K × [14·10⁶/(n·√d) − 4d]، و d قطر الثقب 65 mm و n = 1475 rpm.'), 'bad');
    B.calc = true; save(); q('#br-a').classList.add('ok');
    q('#br-fx').innerHTML = `<div class="fx">G = 0.005 × 140 × 33 = <b>${f1(BR.G)} g</b> ≈ ${Math.round(BR.G / GUN)} × 1.5 g<br>14·10⁶ / (1475 × √65) − 4 × 65 = ${f0(14e6 / (1475 * Math.sqrt(65)))} − 260 = ${f0(BR.base)} h<br>t = ${K} × ${f0(BR.base)} = <b>${f0(T)} h</b> ≈ ${f1(T / 720)} months (24/7)</div>`;
    say(m, ar('صحيح.'), 'ok'); finish();
  }
  /* ---- regreasing ---- */
  const m2 = q('#br-m2');
  function gUI(){
    q('#br-g').textContent = f1(P.g) + ' g';
    q('#br-dirt').style.display = P.clean ? 'none' : '';
    q('#br-plg').setAttribute('y', P.open ? 226 : 208); q('#br-plg').setAttribute('fill', P.open ? '#9aa1a6' : '#5d666c');
    const h = Math.min(100, P.g / BR.G * 60 + (P.ran ? -10 : 0)); const f = q('#br-fill'); f.setAttribute('y', 178 - h); f.setAttribute('height', Math.max(0, h));
    q('#br-purge').setAttribute('opacity', P.open && (P.g > BR.G * 0.7 || P.ran) ? 1 : 0);
    ['clean', 'open', 'run', 'close'].forEach(k => q(`[data-g="${k}"]`).classList.toggle('ok', k === 'clean' ? P.clean : k === 'open' ? P.open : k === 'run' ? P.ran : P.closed));
  }
  q('[data-k="gr"]').addEventListener('change', e => { P.grease = e.target.value; mark(e.target, null); });
  q('#br-plug').addEventListener('click', () => q('[data-g="open"]').click());
  IL.onAct(host, '[data-g]', b => {
    const a = b.dataset.g;
    if (a === 'reset'){ Object.assign(P, {clean:false, open:false, g:0, ran:false, closed:false, fail:false}); q('#br-b').classList.remove('ok'); gUI(); return say(m2, ''); }
    if (P.fail) return say(m2, ar('انتهت المحاولة بخطأ؛ اضغط «أعد التمرين».'), 'bad');
    if (P.closed) return;
    if (a === 'clean'){ P.clean = true; say(m2, ar('نُظّفت الحلمة ورأس المسدس بقطعة قماش نظيفة.'), 'ok'); }
    else if (a === 'open'){ if (P.open) return; P.open = true; say(m2, ar('فُتحت سدادة التصريف: للشحم القديم والزائد مخرج الآن.'), 'ok'); }
    else if (a === 'pump'){
      const gs = q('[data-k="gr"]');
      if (!P.grease) return say(m2, ar('اختر نوع الشحم أولًا.'), 'bad');
      if (P.grease !== 'li'){ mark(gs, false); return say(m2, ar('لا تخلط شحمين مختلفين: استخدم النوع المذكور في كتيّب المحرك (ليثيوم معقّد NLGI 2)؛ الخلط قد يفسد قوام الشحم.'), 'bad'); }
      mark(gs, true);
      if (!P.clean) return say(m2, ar('نظّف الحلمة أولًا: الأوساخ تدخل المحمل مع الشحم.'), 'bad');
      if (!P.open) return say(m2, ar('افتح سدادة التصريف أولًا: الشحم بلا مخرج يرفع الضغط ويدفع الشحم إلى الملفات أو يتلف مانع التسرب.'), 'bad');
      P.g += GUN; const fl = q('#br-flow'); fl.setAttribute('opacity', 1); setTimeout(() => fl.setAttribute('opacity', 0), 250);
      if (P.g > BR.G * 1.35){ P.fail = true; gUI(); return say(m2, ar(`أضفت ${f1(P.g)} g، أكثر بكثير من ${f1(BR.G)} g: الشحم الزائد يرفع حرارة المحمل. اضغط «أعد التمرين».`), 'bad'); }
      say(m2, ar(`${Math.round(P.g / GUN)} ضغطة = ${f1(P.g)} g من ${f1(BR.G)} g.`));
    }
    else if (a === 'run'){
      if (!P.open) return say(m2, ar('افتح سدادة التصريف قبل التشغيل ليخرج الزائد.'), 'bad');
      if (P.g < BR.G - 1.6) return say(m2, ar(`الكمية أقل من المحسوبة (${f1(P.g)} g من ${f1(BR.G)} g)؛ أكمل الضغطات.`), 'bad');
      P.ran = true; say(m2, ar('دار المحرك 30 min: خرج الشحم الزائد من فتحة التصريف، وارتفعت حرارة المحمل قليلًا ثم استقرت.'), 'ok');
    }
    else if (a === 'close'){
      if (!P.ran) return say(m2, ar('شغّل المحرك والسدادة مفتوحة أولًا ليخرج الشحم الزائد، ثم أغلقها.'), 'bad');
      P.closed = true; B.greased = true; save(); q('#br-b').classList.add('ok');
      say(m2, ar(`أُغلقت السدادة. سُجّل التشحيم: ${f1(P.g)} g، والموعد التالي بعد ${f0(T)} h.`), 'ok'); finish();
    }
    gUI();
  });
  /* ---- diagnosis ---- */
  function cases(){
    q('#br-cases').innerHTML = B.cases.map((c, i) => `<div class="case${c.ok ? ' ok' : ''}" data-case="${i}"><h4>${ar('المحمل ' + (i + 1))} · ${L(c.at)} <span class="pill">${L(c.T + ' °C')}</span></h4>
      ${brHint[c.kind] ? `<p class="note">${ar(brHint[c.kind])}</p>` : ''}
      <div class="wave">${waveSvg(c.kind)}</div>
      <div class="row"><button type="button" class="btn" data-play="${i}">▶ استمع</button></div>
      ${sel('c' + i, 'التشخيص', BR_K, c.ans)}
      <div class="row"><button type="button" class="btn pri" data-dx="${i}">تأكيد</button></div><p class="msg" aria-live="polite"></p></div>`).join('');
    $$('[data-k^="c"]', q('#br-cases')).forEach(s => s.addEventListener('change', () => { B.cases[+s.dataset.k.slice(1)].ans = s.value; save(); }));
  }
  IL.onAct(host, '[data-play]', b => { const c = B.cases[+b.dataset.play]; if (!playBuf(brSignal(c.kind, 22050, 2.5), 22050)) say(q('#br-m3'), ar('الصوت غير متاح في هذا المتصفح؛ اعتمد على شكل الموجة.')); });
  IL.onAct(host, '[data-dx]', b => {
    const i = +b.dataset.dx, c = B.cases[i], box = q(`[data-case="${i}"]`), s = $('select', box), m = $('.msg', box);
    if (!s.value) return say(m, ar('اختر التشخيص.'), 'bad');
    const ok = s.value === c.kind; mark(s, ok); c.ok = ok; save();
    box.classList.toggle('ok', ok);
    say(m, ar(ok ? 'صحيح: ' + brMsg(c) : (s.value === 'ok' ? 'ليس سليمًا. ' : 'ليس هذا. ') + 'استمع ثانية وقارن الحرارة؛ ' + (c.kind === 'over' ? 'لاحظ أن الصوت هادئ والحرارة عالية بعد تشحيم حديث.' : c.kind === 'ok' ? 'الصوت ناعم والحرارة طبيعية.' : c.kind === 'dry' ? 'الصوت صفير حاد مستمر.' : c.kind === 'race' ? 'الطرقات منتظمة بإيقاع ثابت.' : 'الطقطقة غير منتظمة.')), ok ? 'ok' : 'bad');
    finish();
  });
  function finish(){ if (B.calc && B.greased && B.cases.every(c => c.ok)) win('bearing', 'أحسنت: الكمية والفترة صحيحتان، والتشحيم بالخطوات الصحيحة، والتشخيصات الثلاثة صحيحة.'); }
  cases(); gUI();
  if (B.calc) calc();
  if (B.greased){ Object.assign(P, {grease:'li', clean:true, open:true, g:Math.round(BR.G / GUN) * GUN, ran:true, closed:true}); q('#br-b').classList.add('ok'); gUI(); }
  newScenario(host, 'bearing', () => { S.br = genBR(); });
  demo(host, 'bearing', async () => {
    B.calc = false; B.greased = false; B.cases.forEach(c => { c.ok = false; c.ans = ''; }); cases();
    Object.assign(P, {grease:'', clean:false, open:false, g:0, ran:false, closed:false, fail:false}); gUI();
    await dSet(inp('G'), f1(BR.G)); await dSet(inp('K'), String(K)); await dSet(inp('t'), f0(T)); await dClick(q('[data-a="calc"]'));
    await dSet(q('[data-k="gr"]'), 'li');
    await dClick(q('[data-g="clean"]')); await dClick(q('[data-g="open"]'));
    const n = Math.round(BR.G / GUN); for (let i = 0; i < n; i++) await dClick(q('[data-g="pump"]'), 140);
    await dClick(q('[data-g="run"]')); await dClick(q('[data-g="close"]'));
    for (let i = 0; i < B.cases.length; i++){ await dSet(q(`[data-k="c${i}"]`), B.cases[i].kind); await dClick(q(`[data-dx="${i}"]`)); }
  });
  IL.onAct(host, '[data-a]', b => { if (b.dataset.a === 'calc') calc(); });
};

/* =====================================================================
   TAB 5 · align (l6): ISO 20816 zones, soft foot, laser alignment with shims
   ===================================================================== */
const ZB = [1.4, 2.8, 4.5];                       // ISO 20816-3, group 2, rigid (typical)
const zoneOf = v => v <= ZB[0] ? 'A' : v <= ZB[1] ? 'B' : v <= ZB[2] ? 'C' : 'D';
const ZTXT = {A:'A: آلة جديدة', B:'B: مقبول للتشغيل الطويل', C:'C: غير مقبول للتشغيل الطويل؛ خطّط للإصلاح', D:'D: خطر التلف؛ أوقف وأصلح'};
const VP = ['DE-H', 'DE-V', 'DE-A', 'NDE-H', 'NDE-V', 'NDE-A'];
const FEET = ['DE-L', 'DE-R', 'NDE-L', 'NDE-R'];
const XF = 200, XR = 600, TOL = 0.05;
const r2 = v => Math.round(v * 100) / 100;
function genAL(){
  const sg = () => Math.random() < 0.5 ? -1 : 1;
  const rng = {'DE-H':[2.1, 2.9], 'DE-V':[1.5, 2.3], 'DE-A':[3.3, 5.6], 'NDE-H':[1.5, 2.2], 'NDE-V':[1.1, 1.7], 'NDE-A':[2.0, 3.1]};
  const vib = {}; VP.forEach(p => vib[p] = Math.round(rnd(rng[p][0], rng[p][1]) * 10) / 10);
  const sf = rint(0, 3), gaps = FEET.map((f, i) => i === sf ? r2(rnd(0.12, 0.26)) : r2(rnd(0.01, 0.03)));
  const a = {Vo:r2(sg() * rnd(0.15, 0.35)), Va:r2(sg() * rnd(0.03, 0.10)), Ho:r2(sg() * rnd(0.12, 0.38)), Ha:r2(sg() * rnd(0.04, 0.10))};
  return {vib, sf, gaps, a0:clone(a), a, vm:{}, fm:{}, sfOk:false, zone:'', cause:'', vibOk:false, alOk:false};
}
const corrV = (o, ang, x) => -(o + ang * x / 100);
function alSideSvg(){
  const mk = (p, x, y) => `<g class="hit" data-vp="${p}" tabindex="0" role="button" aria-label="${p}"><circle class="ring" cx="${x}" cy="${y}" r="19"/><circle cx="${x}" cy="${y}" r="15" fill="var(--accent)" stroke="#fff" stroke-width="2"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">${p.split('-')[1]}</text></g>`;
  return `<svg viewBox="0 -56 560 306" role="img" aria-label="المحرك والضاغط ونقاط قياس الاهتزاز">
  <rect x="10" y="212" width="540" height="16" rx="3" fill="#7d868b"/>
  <rect x="22" y="78" width="168" height="134" rx="12" fill="#4f7aa5" stroke="#2f4f70" stroke-width="2"/><text x="106" y="150" text-anchor="middle" font-size="12" fill="#fff" font-weight="700">COMPRESSOR</text>
  <rect x="190" y="122" width="74" height="14" fill="#b9c1c7" stroke="#6b7378"/>
  <rect x="206" y="104" width="34" height="50" rx="5" fill="#e0b84a" stroke="#8a6a0a" stroke-width="2"/>
  <rect x="270" y="70" width="230" height="122" rx="14" fill="var(--ral)" stroke="var(--ral-d)" stroke-width="2"/>
  ${[0, 1, 2, 3, 4, 5, 6].map(k => `<line x1="296" y1="${84 + k * 15}" x2="474" y2="${84 + k * 15}" stroke="var(--ral-d)" stroke-width="2"/>`).join('')}
  <rect x="264" y="96" width="16" height="70" rx="4" fill="var(--ral-d)"/><rect x="492" y="96" width="16" height="70" rx="4" fill="var(--ral-d)"/>
  <rect x="294" y="192" width="40" height="20" fill="var(--ral-d)"/><rect x="438" y="192" width="40" height="20" fill="var(--ral-d)"/>
  <text x="385" y="64" text-anchor="middle" font-size="11" class="tx">C-201 · 37 kW · 1475 rpm</text>
  ${mk('DE-V', 272, 58)}${mk('DE-H', 300, 131)}${mk('DE-A', 254, 84)}${mk('NDE-V', 500, 58)}${mk('NDE-H', 470, 131)}${mk('NDE-A', 526, 104)}
  <text x="272" y="236" text-anchor="middle" font-size="11" class="tx">DE</text><text x="500" y="236" text-anchor="middle" font-size="11" class="tx">NDE</text>
  <g id="al-pen" transform="translate(-100 -100)"><rect x="-5" y="-62" width="10" height="44" rx="4" fill="#2e3439"/><rect x="-14" y="-104" width="28" height="44" rx="6" fill="#f6cf45" stroke="#8a6a0a"/><rect x="-10" y="-98" width="20" height="14" rx="2" fill="#c7d3b4"/><path d="M0 -18 L0 -12" stroke="#2e3439" stroke-width="3"/></g>
  </svg>`;
}
function feetSvg(){
  const pos = [[150, 50], [150, 150], [370, 50], [370, 150]];
  return `<svg viewBox="0 0 520 200" role="img" aria-label="أقدام المحرك من أعلى">
  <rect x="120" y="40" width="280" height="120" rx="14" fill="var(--ral)" stroke="var(--ral-d)" stroke-width="2"/>
  <rect x="60" y="92" width="60" height="16" fill="#b9c1c7" stroke="#6b7378"/><text x="66" y="84" font-size="10" class="txm">coupling</text>
  <text x="260" y="104" text-anchor="middle" font-size="12" fill="#333">C-201 (top view)</text>
  ${pos.map((p, i) => `<g class="hit" data-ft="${i}" tabindex="0" role="button" aria-label="${FEET[i]}"><circle class="ring" cx="${p[0]}" cy="${p[1]}" r="22"/><rect x="${p[0] - 18}" y="${p[1] - 14}" width="36" height="28" rx="4" fill="var(--ral-d)" stroke="#555"/><circle cx="${p[0]}" cy="${p[1]}" r="8" fill="#b4b8bb" stroke="#333"/><text x="${p[0]}" y="${p[1] + (i % 2 ? 32 : -20)}" text-anchor="middle" font-size="11" font-weight="700" class="tx">${FEET[i]}</text><text class="al-fv" x="${p[0] + (i < 2 ? 52 : -52)}" y="${p[1] + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#0b5a66"></text></g>`).join('')}
  </svg>`;
}
function laserSvg(a, meas, okAll){
  const ex = 220;   // exaggeration
  const line = (o, an, y0, col) => `<line x1="40" y1="${y0}" x2="200" y2="${y0}" stroke="#4f7aa5" stroke-width="5"/><line x1="210" y1="${f1(y0 - IL.clamp(o * ex, -32, 32))}" x2="480" y2="${f1(y0 - IL.clamp((o + an * 2.7) * ex, -32, 32))}" stroke="${col}" stroke-width="5"/><line x1="205" y1="${y0 - 26}" x2="205" y2="${y0 + 26}" stroke="var(--line)" stroke-dasharray="3 3"/>`;
  const st = (v, lim) => Math.abs(v) <= lim ? '#2b7a3d' : Math.abs(v) <= 2 * lim ? '#b7791f' : '#c0352b';
  const vals = meas ? [['V offset', a.Vo, 'mm'], ['V angle', a.Va, '/100'], ['H offset', a.Ho, 'mm'], ['H angle', a.Ha, '/100']] : null;
  return `<svg viewBox="0 0 520 300" role="img" aria-label="شاشة جهاز المحاذاة بالليزر">
  <rect x="4" y="4" width="512" height="292" rx="14" fill="#24292d"/>
  <text x="20" y="28" font-size="14" font-weight="700" fill="#f6cf45">LASER ALIGNMENT</text><text x="500" y="28" text-anchor="end" font-size="12" fill="#cfd5d8">tol 0.05 mm · 0.05/100</text>
  <text x="20" y="52" font-size="12" fill="#cfd5d8">SIDE (V)</text><text x="20" y="130" font-size="12" fill="#cfd5d8">TOP (H)</text>
  <g>${line(meas ? a.Vo : 0, meas ? a.Va : 0, 80, '#c9ccc7')}</g><g>${line(meas ? a.Ho : 0, meas ? a.Ha : 0, 158, '#c9ccc7')}</g>
  <text x="500" y="52" text-anchor="end" font-size="11" fill="#8d969b">×${ex}</text>
  <rect x="16" y="196" width="488" height="88" rx="8" fill="#0e1214"/>
  ${vals ? vals.map((v, i) => { const x = 28 + i * 120; return `<text x="${x}" y="218" font-size="13" fill="#cfd5d8">${v[0]}</text><text x="${x}" y="252" font-size="26" font-weight="700" fill="${st(v[1], TOL)}">${(v[1] >= 0 ? '+' : '') + f2(v[1])}</text><text x="${x}" y="274" font-size="12" fill="#8d969b">${v[2]}</text>`; }).join('') : `<text x="260" y="246" text-anchor="middle" font-size="16" fill="#8d969b">MEASURE 9 - 12 - 3</text>`}
  ${okAll ? '<text x="500" y="188" text-anchor="end" font-size="14" font-weight="700" fill="#5cc06f">IN TOLERANCE ✓</text>' : ''}
  </svg>`;
}
BUILD.align = host => {
  if (!S.al || !S.al.vib) S.al = genAL();
  const A = S.al; let meas = false, busy = false;
  host.innerHTML = `
  <div class="dev${A.vibOk ? ' ok' : ''}" id="al-a"><h3><span class="n">1</span>قِس الاهتزاز وصنّفه</h3>
    <p class="note">${ar('المحرك يدور بالحمل. انقر نقطة القياس لتضع قلم الاهتزاز عليها (سرعة mm/s RMS، 10–1000 Hz).')}</p>
    <div class="stage" style="max-width:640px;width:100%;margin:0 auto">${alSideSvg()}</div>
    <div class="row"><div class="seg" id="al-lcd" style="min-width:9em">-.-- mm/s</div><span class="note" id="al-pt"></span></div>
    <div class="tblw"><table class="tbl hm" id="al-vt"></table></div>
    <div class="zbar"><span style="background:#2b7a3d">A ≤ 1.4</span><span style="background:#6c9a2f">B ≤ 2.8</span><span style="background:#b7791f">C ≤ 4.5</span><span style="background:#c0352b">D &gt; 4.5</span></div>
    <p class="typ">${ar('حدود نموذجية للتعلّم من ISO 20816-3 للمجموعة 2 على قاعدة صلبة؛ ارجع إلى المعيار.')}</p>
    ${sel('zone', 'منطقة الآلة (حسب أعلى قراءة)', Object.keys(ZTXT).map(k => [k, ZTXT[k]]), A.zone)}
    ${sel('cause', 'السبب المرجّح', [['mis', 'عدم محاذاة'], ['unb', 'عدم اتزان الدوّار'], ['loose', 'ارتخاء ميكانيكي']], A.cause)}
    <div class="row"><button type="button" class="btn pri" data-a="vib">تحقّق</button></div>
    <p class="msg" id="al-m1" aria-live="polite"></p>
  </div>
  <div class="grid2">
  <div class="dev${A.sfOk ? ' ok' : ''}" id="al-b"><h3><span class="n">2</span>القاعدة المرتخية Soft Foot</h3>
    <p class="note">${ar('المحرك متوقف ومقفل. انقر قدمًا لتفك مسمارها وحده ومؤشر القياس عليها، فيقرأ ارتفاع القدم. الحد النموذجي ≤ 0.05 mm.')}</p>
    <div class="stage">${feetSvg()}</div>
    ${sel('sfF', 'القدم التي تحتاج شريحة', FEET.map((f, i) => [String(i), f]), '')}
    ${sel('sfS', 'سماكة الشريحة', [0.05, 0.10, 0.15, 0.20, 0.25, 0.30].map(v => [f2(v), f2(v) + ' mm']), '')}
    <div class="row"><button type="button" class="btn pri" data-a="sf">ضع الشريحة وأعد الفحص</button></div>
    <p class="msg" id="al-m2" aria-live="polite"></p>
  </div>
  <div class="dev${A.alOk ? ' ok' : ''}" id="al-c"><h3><span class="n">3</span>المحاذاة بالليزر</h3>
    <div class="stage" id="al-ls"></div>
    <div class="row"><button type="button" class="btn" data-a="meas">قِس (أدر العمودين 9 ← 12 ← 3)</button></div>
    <div class="fx">foot = −(offset + angle × L / 100)<br>L front = ${XF} mm, rear = ${XR} mm</div>
    <p class="note">${ar('الرأسي: موجب = أضف شرائح، سالب = أزل. الأفقي: موجب = حرّك القدم نحو + بمسامير الدفع. عند الضاغط القيم موجبة إذا كان المحرك أعلى أو نحو +.')}</p>
    ${fld('vf', 'شرائح القدمين الأماميتين', 'mm', '')}${fld('vr', 'شرائح القدمين الخلفيتين', 'mm', '')}
    <div class="row"><button type="button" class="btn pri" data-a="appV">طبّق الشرائح</button></div>
    ${fld('hf', 'إزاحة القدمين الأماميتين أفقيًا', 'mm', '')}${fld('hr', 'إزاحة القدمين الخلفيتين أفقيًا', 'mm', '')}
    <div class="row"><button type="button" class="btn pri" data-a="appH">طبّق الإزاحة</button></div>
    <p class="msg" id="al-m3" aria-live="polite"></p><div id="al-fx"></div>
  </div>
  </div>
  ${foot()}`;
  const q = s => $(s, host), inp = k => q(`[data-k="${k}"]`);
  /* ---- vibration ---- */
  const vval = p => A.alOk ? Math.round(A.vib[p] * 0.33 * 10) / 10 : A.vib[p];
  const VPOS = {'DE-V':[272, 58], 'DE-H':[300, 131], 'DE-A':[254, 84], 'NDE-V':[500, 58], 'NDE-H':[470, 131], 'NDE-A':[526, 104]};
  function vt(){
    q('#al-vt').innerHTML = `<tr>${VP.map(p => `<th>${p}</th>`).join('')}</tr><tr>${VP.map(p => { const v = A.vm[p]; return `<td class="${v == null ? '' : v > ZB[2] ? 'bad' : v > ZB[1] ? 'wr' : 'ok'}">${v == null ? '—' : f1(v)}</td>`; }).join('')}</tr>`;
  }
  IL.onAct(host, '[data-vp]', g => {
    if (busy) return;
    const p = g.dataset.vp, [x, y] = VPOS[p], v = vval(p);
    q('#al-pen').setAttribute('transform', `translate(${x} ${y - 6})`); q('#al-pt').textContent = p;
    busy = true; let t = 0, last = 0; const lcd = q('#al-lcd');
    const loop = ts => {
      if (!host.isConnected) return;
      const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts; t += dt * (DEMO ? 3 * DSPEED : 1);
      lcd.textContent = f2(v * (1 - Math.exp(-t * 4)) * (1 + (Math.random() - 0.5) * 0.06)) + ' mm/s';
      if (t >= 1.1){ lcd.textContent = f2(v) + ' mm/s'; A.vm[p] = v; save(); vt(); busy = false; return; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  ['zone', 'cause'].forEach(k => inp(k).addEventListener('change', () => { A[k] = inp(k).value; save(); }));
  function vibChk(){
    const m = q('#al-m1');
    if (VP.some(p => A.vm[p] == null)) return say(m, ar('قِس النقاط الست كلها أولًا.'), 'bad');
    const mx = VP.reduce((a, p) => A.vm[p] > A.vm[a] ? p : a, VP[0]), v = A.vm[mx], z = zoneOf(v);
    const zOk = inp('zone').value === z; mark(inp('zone'), zOk);
    if (!zOk) return say(m, ar(`أعلى قراءة ${f1(v)} mm/s عند ${mx} تقع في المنطقة ${z} (${z === 'A' ? '≤ 1.4' : z === 'B' ? '1.4–2.8' : z === 'C' ? '2.8–4.5' : '> 4.5'} mm/s)؛ الآلة تُصنَّف بأعلى قراءة.`), 'bad');
    if (A.alOk){ A.vibOk = true; save(); return say(m, ar('بعد المحاذاة: المنطقة ' + z + '.'), 'ok'); }
    const cOk = inp('cause').value === 'mis'; mark(inp('cause'), cOk);
    if (!cOk) return say(m, ar(`الاهتزاز المحوري عند DE هو الأعلى (${f1(A.vm['DE-A'])} mm/s) وأكبر من نصف القطري: هذه علامة عدم المحاذاة، لا عدم الاتزان (الذي يظهر قطريًا).`), 'bad');
    A.vibOk = true; save(); q('#al-a').classList.add('ok');
    say(m, ar(`صحيح: المنطقة ${z}؛ ${ZTXT[z].split(': ')[1]}. الاهتزاز المحوري المرتفع عند DE يشير إلى عدم محاذاة.`), 'ok'); finish();
  }
  /* ---- soft foot ---- */
  function feetUI(){ $$('[data-ft]', host).forEach(g => { const i = +g.dataset.ft, v = A.fm[i]; $('.al-fv', g).textContent = v == null ? '' : f2(v) + ' mm'; }); }
  IL.onAct(host, '[data-ft]', g => {
    const i = +g.dataset.ft, v = A.sfOk && i === A.sf ? r2(Math.abs(A.gaps[i] - A.shim)) : A.gaps[i];
    A.fm[i] = v; save(); feetUI();
    say(q('#al-m2'), ar(`${FEET[i]}: فُكّ المسمار فارتفعت القدم ${f2(v)} mm${v > TOL ? '؛ أكبر من 0.05 mm' : ''}. أُعيد شدّه.`), v > TOL ? 'bad' : '');
  });
  function sfApply(){
    const m = q('#al-m2'), fi = inp('sfF').value, s = num(inp('sfS').value);
    if (FEET.some((f, i) => A.fm[i] == null)) return say(m, ar('افحص الأقدام الأربع أولًا؛ القدم المرتخية هي التي ترتفع أكثر.'), 'bad');
    if (A.sfOk) return say(m, ar('صُحّحت القاعدة المرتخية.'), 'ok');
    if (fi === '' || !isFinite(s)) return say(m, ar('اختر القدم وسماكة الشريحة.'), 'bad');
    const i = +fi;
    if (i !== A.sf){ mark(inp('sfF'), false); return say(m, ar(`القدم ${FEET[i]} لم ترتفع إلا ${f2(A.gaps[i])} mm؛ الشريحة توضع تحت القدم التي ارتفعت أكثر.`), 'bad'); }
    mark(inp('sfF'), true);
    const res = Math.abs(A.gaps[i] - s);
    if (res > TOL + 1e-9){ mark(inp('sfS'), false); return say(m, ar(`بقي ارتفاع ${f2(res)} mm؛ الشريحة يجب أن تساوي ارتفاع القدم ${f2(A.gaps[i])} mm تقريبًا.`), 'bad'); }
    mark(inp('sfS'), true);
    A.sfOk = true; A.shim = s; A.fm[i] = r2(res); save(); feetUI(); q('#al-b').classList.add('ok');
    say(m, ar(`صحيح: شريحة ${f2(s)} mm تحت ${FEET[i]}، وارتفاع القدم الآن ${f2(res)} mm ≤ 0.05 mm.`), 'ok'); finish();
  }
  /* ---- laser ---- */
  const inTol = a => Math.abs(a.Vo) <= TOL && Math.abs(a.Va) <= TOL && Math.abs(a.Ho) <= TOL && Math.abs(a.Ha) <= TOL;
  function ls(){ q('#al-ls').innerHTML = laserSvg(A.a, meas, meas && inTol(A.a)); }
  function measure(){
    const m = q('#al-m3');
    if (!A.sfOk) return say(m, ar('صحّح القاعدة المرتخية أولًا: القراءات على قاعدة مرتخية لا تتكرر وتتغير مع شد المسامير.'), 'bad');
    if (busy) return;
    busy = true; say(m, ar('الرأسان يدوران مع العمودين: 9 ← 12 ← 3…'));
    setTimeout(() => {
      busy = false; meas = true; ls();
      if (inTol(A.a)){ A.alOk = true; save(); q('#al-c').classList.add('ok'); say(m, ar('ضمن الحدود في الاتجاهين. شُدّت مسامير القاعدة وأُعيد القياس للتأكيد. أعد قياس الاهتزاز لترى أثر المحاذاة.'), 'ok'); finish(); }
      else say(m, ar('قِيست المحاذاة. احسب الشرائح من القيم الرأسية أولًا، ثم الإزاحة الأفقية.'));
    }, DEMO ? 500 / DSPEED : 1300);
  }
  function apply(dir){
    const m = q('#al-m3');
    if (!A.sfOk) return say(m, ar('صحّح القاعدة المرتخية أولًا.'), 'bad');
    if (!meas) return say(m, ar('قِس أولًا؛ لا تحرّك المحرك على قراءات قديمة.'), 'bad');
    const kf = dir === 'V' ? 'vf' : 'hf', kr = dir === 'V' ? 'vr' : 'hr';
    const sf = num(inp(kf).value), sr = num(inp(kr).value);
    if (!isFinite(sf) || !isFinite(sr)) return say(m, ar('أدخل القيمتين الأمامية والخلفية بالمليمتر (سالب للإزالة أو للاتجاه المعاكس).'), 'bad');
    const o = dir === 'V' ? A.a.Vo : A.a.Ho, an = dir === 'V' ? A.a.Va : A.a.Ha;
    const ef = corrV(o, an, XF), er = corrV(o, an, XR);
    if (dir === 'V' && (sf < -1.0 || sr < -1.0)) return say(m, ar('لا يمكن إزالة أكثر من الشرائح الموجودة تحت القدم (1.00 mm).'), 'bad');
    const okF = nearA(sf, ef, 0.03), okR = nearA(sr, er, 0.03); mark(inp(kf), okF); mark(inp(kr), okR);
    // move the machine: y(x) = o + an·x/100 ; feet move by sf at XF and sr at XR (± execution error)
    const af = sf + rnd(-0.01, 0.01), arr = sr + rnd(-0.01, 0.01), slope = (arr - af) / (XR - XF);
    const no = o + af - slope * XF, nan = an + slope * 100;
    if (dir === 'V'){ A.a.Vo = r2(no); A.a.Va = r2(nan); A.a.Ho = r2(A.a.Ho + rnd(-0.02, 0.02)); }
    else { A.a.Ho = r2(no); A.a.Ha = r2(nan); }
    meas = false; save(); ls();
    q('#al-fx').innerHTML = `<div class="fx">${dir === 'V' ? 'V' : 'H'}: front = −(${f2(o)} + ${f2(an)} × ${XF}/100) = <b>${f2(ef)}</b> mm ; rear = −(${f2(o)} + ${f2(an)} × ${XR}/100) = <b>${f2(er)}</b> mm</div>`;
    if (okF && okR) say(m, ar(dir === 'V' ? 'طُبّقت الشرائح. قِس من جديد، ثم صحّح الاتجاه الأفقي.' : 'طُبّقت الإزاحة. قِس من جديد للتأكد.'), 'ok');
    else say(m, ar(`حسب المثلثات المتشابهة: الأمامية ${f2(ef)} mm والخلفية ${f2(er)} mm؛ ما طبّقته يترك خطأ. قِس وصحّح من جديد.`), 'bad');
  }
  function finish(){ if (A.vibOk && A.sfOk && A.alOk) win('align', 'أحسنت: صنّفت الاهتزاز، وصحّحت القاعدة المرتخية، وحاذيت المحرك ضمن 0.05 mm و 0.05/100.'); }
  IL.onAct(host, '[data-a]', b => ({vib:vibChk, sf:sfApply, meas:measure, appV:() => apply('V'), appH:() => apply('H')})[b.dataset.a]());
  vt(); feetUI(); ls();
  newScenario(host, 'align', () => { S.al = genAL(); });
  demo(host, 'align', async () => {
    Object.assign(A, {a:clone(A.a0), vm:{}, fm:{}, sfOk:false, zone:'', cause:'', vibOk:false, alOk:false}); meas = false; vt(); feetUI(); ls();
    for (const p of VP){ await dClick(q(`[data-vp="${p}"]`), 300); await dWait(() => !busy); }
    const mx = VP.reduce((a, p) => A.vm[p] > A.vm[a] ? p : a, VP[0]);
    await dSet(inp('zone'), zoneOf(A.vm[mx])); await dSet(inp('cause'), 'mis'); await dClick(q('[data-a="vib"]'));
    for (let i = 0; i < 4; i++) await dClick(q(`[data-ft="${i}"]`), 300);
    const sh = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30].reduce((b, v) => Math.abs(v - A.gaps[A.sf]) < Math.abs(b - A.gaps[A.sf]) ? v : b, 0.05);
    await dSet(inp('sfF'), String(A.sf)); await dSet(inp('sfS'), f2(sh)); await dClick(q('[data-a="sf"]'));
    for (let k = 0; k < 3 && !A.alOk; k++){
      await dClick(q('[data-a="meas"]')); await dWait(() => !busy); if (A.alOk) break;
      await dSet(inp('vf'), f2(corrV(A.a.Vo, A.a.Va, XF))); await dSet(inp('vr'), f2(corrV(A.a.Vo, A.a.Va, XR))); await dClick(q('[data-a="appV"]'));
      await dClick(q('[data-a="meas"]')); await dWait(() => !busy); if (A.alOk) break;
      await dSet(inp('hf'), f2(corrV(A.a.Ho, A.a.Ha, XF))); await dSet(inp('hr'), f2(corrV(A.a.Ho, A.a.Ha, XR))); await dClick(q('[data-a="appH"]'));
    }
    if (!A.alOk){ await dClick(q('[data-a="meas"]')); await dWait(() => !busy); }
  });
};

/* =====================================================================
   TAB 6 · thermal (l7): thermography, voltage unbalance, NEMA derating, 10 °C rule
   ===================================================================== */
const NEMA = [[0, 1], [1, 0.98], [2, 0.95], [3, 0.88], [4, 0.82], [5, 0.75]];
function derate(u){ if (u <= 0) return 1; for (let i = 1; i < NEMA.length; i++){ if (u <= NEMA[i][0]){ const [x0, y0] = NEMA[i - 1], [x1, y1] = NEMA[i]; return y0 + (y1 - y0) * (u - x0) / (x1 - x0); } } return NaN; }
const vuOf = V => { const av = (V[0] + V[1] + V[2]) / 3; return Math.max(...V.map(v => Math.abs(v - av))) / av * 100; };
const TH_ACT = [['fix', 'اعزل وأقفل، ثم نظّف الوصلة الساخنة وأعد شدّها بالعزم الصحيح، وأعد القياس'], ['load', 'خفّض الحمل فقط وأعد الفحص بعد شهر'], ['ol', 'ارفع ضبط مرحّل الحمل الزائد حتى لا يفصل'], ['big', 'استبدل المحرك بمحرك أكبر قدرة']];
const LUGX = [130, 170, 210], LUGY = 95;
function genTH(){
  const ph = rint(0, 2), u = rnd(1.6, 4.2), av = rnd(396, 402), e = u / 100 * av / 2, d = rnd(-0.15, 0.15);
  const hi = [1, 2, 0][ph];   // the line voltage that does not include the hot phase
  const V = [0, 1, 2].map(i => i === hi ? av + 2 * e : av - e * (1 + (i === (hi + 1) % 3 ? d : -d))).map(Math.round);
  const vu = vuOf(V), Ia = rnd(57, 62), cu = Math.min(0.3, 0.07 * vu);
  const Iv = [0, 1, 2].map(i => i === ph ? Ia * (1 + cu * 0.66) : Ia * (1 - cu * 0.33 * (1 + (i === (ph + 1) % 3 ? 0.15 : -0.15)))).map(x => Math.round(x * 10) / 10);
  const tn = rnd(44, 49), lug = [0, 1, 2].map(i => i === ph ? Math.round(tn + rnd(18, 32)) : Math.round(tn + rnd(-1.2, 1.2)));
  const base = 105, dTw = Math.round(80 * 2 * vu * vu / 100);
  return {ph, V, I:Iv, lug, base, now:base + dTw, in:{}, frame:Math.round(rnd(58, 63))};
}
/* temperature field: rough scene (scene px 320×240) → grid 160×120, blurred */
function thField(sc, open){
  const W = 160, H = 120, g = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++){
    const x = i * 2 + 1, y = j * 2 + 1; let T = 27 + 0.6 * Math.sin(x / 40) ;
    if (y > 150) T = sc.frame - 4 + 4 * Math.abs(Math.sin(y / 5)) - (x < 20 || x > 300 ? 8 : 0);
    if (x > 88 && x < 252 && y > 38 && y < 152) T = open ? 39 : 43 + (y - 40) / 30;
    if (open){
      for (let k = 0; k < 3; k++){
        const cx = LUGX[k], lt = sc.lug[k];
        if (Math.abs(x - cx) < 7 && y < LUGY) T = Math.max(T, 34 + (lt - 34) * Math.exp(-(LUGY - y) / 45));
        const r = Math.hypot(x - cx, y - LUGY); if (r < 12) T = Math.max(T, lt - r * 0.15);
      }
    }
    g[j * W + i] = T;
  }
  for (let pass = 0; pass < 2; pass++){
    const o = Float32Array.from(g);
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++){ let s = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) s += o[(j + a) * W + i + b]; g[j * W + i] = s / 9; }
  }
  return {g, W, H};
}
const IRON = [[0, [0, 0, 16]], [0.17, [42, 10, 107]], [0.33, [139, 16, 143]], [0.5, [214, 50, 90]], [0.67, [246, 116, 28]], [0.83, [251, 198, 58]], [1, [255, 251, 224]]];
function ironRGB(t){ t = Math.max(0, Math.min(1, t)); for (let i = 1; i < IRON.length; i++){ if (t <= IRON[i][0]){ const [a, ca] = IRON[i - 1], [b, cb] = IRON[i], f = (t - a) / (b - a); return ca.map((c, k) => Math.round(c + (cb[k] - c) * f)); } } return IRON[6][1]; }
BUILD.thermal = host => {
  if (!S.th || !S.th.V) S.th = genTH();
  const H = S.th, I = H.in;
  const P = {ppe:false, vm:{}, xy:null};
  const vu = vuOf(H.V), df = derate(vu), dTw = H.now - H.base, life = 100 * Math.pow(0.5, dTw / 10);
  const LBL3 = ['L1', 'L2', 'L3'], VL = ['L1-L2', 'L2-L3', 'L3-L1'];
  host.innerHTML = `
  <div class="grid2">
  <div class="dev"><h3><span class="n">1</span>الصورة الحرارية لعلبة الأطراف</h3>
    <p class="note">${ar('المحرك يعمل بالحمل. التصوير الحراري يحتاج الغطاء مفتوحًا والدائرة حيّة، فهو عمل قرب أجزاء مكشوفة.')}</p>
    <div class="loto"><button type="button" class="btn" data-a="ppe">إذن عمل + PPE مناسبة، ثم افتح الغطاء</button></div>
    <div class="cam">
      <div class="top"><span>THERMAL CAMERA · ε 0.95</span><span id="th-rd" class="rd">--.- °C</span></div>
      <div class="scr"><canvas id="th-cv" width="320" height="240" aria-label="صورة حرارية؛ انقر لقياس نقطة"></canvas><div class="xh" id="th-xh" hidden></div></div>
      <div class="pal"><span id="th-min">25</span><i></i><span id="th-max">80</span></div>
    </div>
    <p class="msg" id="th-m0" aria-live="polite">${ar('انقر على الصورة لوضع نقطة القياس.')}</p>
    <div class="tblw" style="direction:rtl"><table class="tbl hm"><tr><th class="ar">ΔT بين مكوّنين متماثلين (NETA)</th><th class="ar">التقدير</th></tr><tr><td dir="ltr">1–3 °C</td><td class="ar">نقص محتمل؛ راقب</td></tr><tr><td dir="ltr">4–15 °C</td><td class="ar">نقص مرجّح؛ أصلح في أقرب فرصة</td></tr><tr><td dir="ltr">&gt; 15 °C</td><td class="ar">نقص كبير؛ أصلح فورًا</td></tr></table></div>
    <p class="typ">${ar('قيم نموذجية للتعلّم من معايير NETA؛ ارجع إلى المعيار وإجراءات موقعك.')}</p>
  </div>
  <div class="dev"><h3><span class="n">2</span>الجهود والتيارات عند أطراف المحرك</h3>
    <div class="chipline">${VL.map((l, i) => `<button type="button" class="btn" data-vm="v${i}">V ${l}</button>`).join('')}${LBL3.map((l, i) => `<button type="button" class="btn" data-vm="i${i}">I ${l}</button>`).join('')}</div>
    <div class="seg" id="th-lcd">----</div>
    <div class="tblw"><table class="tbl hm" id="th-tb"></table></div>
    <div class="okbox" style="border-color:var(--line);background:var(--bg)"><b>PT100</b> ${ar(`حرارة الملف الآن ${H.now} °C. في سجل التشغيل بالحمل نفسه وجهد متزن: ${H.base} °C.`)}</div>
    <div class="tblw"><table class="tbl hm"><tr><th>VU %</th>${NEMA.map(p => `<td>${p[0]}</td>`).join('')}</tr><tr><th>factor</th>${NEMA.map(p => `<td>${p[1]}</td>`).join('')}</tr></table></div>
    <p class="typ">${ar('منحنى تخفيض القدرة من NEMA MG 1، قيم نموذجية للتعلّم؛ استكمل خطيًا بين النقاط.')}</p>
  </div>
  </div>
  <div class="dev" id="th-r"><h3><span class="n">3</span>احسب وقرّر</h3>
    ${fld('dt', 'ΔT بين الوصلة الساخنة وأسخن وصلة مماثلة', 'K', I.dt)}
    ${fld('vu', 'عدم اتزان الجهد VU', '%', I.vu)}
    ${fld('df', 'معامل تخفيض القدرة', '', I.df)}
    ${fld('life', 'عمر العزل المتوقع كنسبة من العمر الطبيعي', '%', I.life)}
    ${sel('act', 'الإجراء', TH_ACT, I.act)}
    <div class="row"><button type="button" class="btn pri" data-a="chk">تحقّق</button></div>
    <p class="msg" id="th-m1" aria-live="polite"></p><div id="th-fx"></div>
  </div>
  ${foot()}`;
  const q = s => $(s, host), inp = k => q(`[data-k="${k}"]`), cv = q('#th-cv');
  let F = thField(H, false);
  const tMax = Math.ceil(Math.max(...H.lug) + 3), tMin = 25;
  q('#th-min').textContent = tMin + ' °C'; q('#th-max').textContent = tMax + ' °C';
  function paint(){
    const c = cv.getContext('2d'), sm = document.createElement('canvas'); sm.width = F.W; sm.height = F.H;
    const sx = sm.getContext('2d'), im = sx.createImageData(F.W, F.H);
    for (let k = 0; k < F.g.length; k++){ const [r, g, b] = ironRGB((F.g[k] - tMin) / (tMax - tMin)); im.data[k * 4] = r; im.data[k * 4 + 1] = g; im.data[k * 4 + 2] = b; im.data[k * 4 + 3] = 255; }
    sx.putImageData(im, 0, 0);
    c.imageSmoothingEnabled = true; c.drawImage(sm, 0, 0, 320, 240);
    c.font = '600 11px IBM Plex Mono, monospace'; c.fillStyle = '#fff'; c.textAlign = 'center';
    if (P.ppe) LBL3.forEach((l, i) => c.fillText(l, LUGX[i], 126)); else c.fillText('COVER CLOSED', 170, 100);
    c.fillText('C-201', 160, 200);
  }
  function probe(x, y){
    const gi = Math.round(x / 2), gj = Math.round(y / 2); let mx = -99;
    for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++){ const i = Math.min(F.W - 1, Math.max(0, gi + b)), j = Math.min(F.H - 1, Math.max(0, gj + a)); mx = Math.max(mx, F.g[j * F.W + i]); }
    return mx;
  }
  function setXY(x, y){
    P.xy = [x, y]; const xh = q('#th-xh'); xh.hidden = false; xh.style.left = (x / 320 * 100) + '%'; xh.style.top = (y / 240 * 100) + '%';
    const t = probe(x, y); q('#th-rd').textContent = f1(t) + ' °C';
    const k = LUGX.findIndex(cx => Math.hypot(x - cx, y - LUGY) < 18);
    say(q('#th-m0'), ar(P.ppe && k > -1 ? `وصلة ${LBL3[k]}: ${f1(t)} °C` : `النقطة: ${f1(t)} °C`));
  }
  cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(); setXY((e.clientX - r.left) / r.width * 320, (e.clientY - r.top) / r.height * 240); });
  cv.addEventListener('pointermove', e => { if (e.buttons !== 1) return; const r = cv.getBoundingClientRect(); setXY((e.clientX - r.left) / r.width * 320, (e.clientY - r.top) / r.height * 240); });
  IL.onAct(host, '[data-a="ppe"]', b => { if (P.ppe) return; P.ppe = true; b.classList.add('ok'); F = thField(H, true); paint(); say(q('#th-m0'), ar('فُتح الغطاء بإذن عمل وملابس ومعدات مناسبة لفئة الخطر، ومن مسافة آمنة. انقر كل وصلة لقياسها.'), 'ok'); });
  paint();
  /* ---- V and I ---- */
  function tb(){
    q('#th-tb').innerHTML = `<tr>${VL.map(l => `<th>V ${l}</th>`).join('')}${LBL3.map(l => `<th>I ${l}</th>`).join('')}</tr><tr>${[0, 1, 2].map(i => `<td>${P.vm['v' + i] ? H.V[i] + ' V' : '—'}</td>`).join('')}${[0, 1, 2].map(i => `<td>${P.vm['i' + i] ? f1(H.I[i]) + ' A' : '—'}</td>`).join('')}</tr>`;
  }
  IL.onAct(host, '[data-vm]', b => {
    const k = b.dataset.vm, i = +k[1], lcd = q('#th-lcd');
    const val = k[0] === 'v' ? H.V[i] + ' V~' : f1(H.I[i]) + ' A~';
    lcd.textContent = '····'; setTimeout(() => { lcd.textContent = val; P.vm[k] = true; b.classList.add('done'); tb(); }, DEMO ? 200 / DSPEED : 600);
  });
  tb();
  ['dt', 'vu', 'df', 'life', 'act'].forEach(k => inp(k).addEventListener('input', () => { I[k] = inp(k).value; save(); }));
  function check(){
    const m = q('#th-m1');
    if (!P.ppe) return say(m, ar('افتح علبة الأطراف بإذن عمل و PPE، وصوّر الوصلات أولًا.'), 'bad');
    if (Object.keys(P.vm).length < 6) return say(m, ar('قِس الجهود الثلاثة والتيارات الثلاثة أولًا.'), 'bad');
    const lt = [0, 1, 2].map(i => probe(LUGX[i], LUGY)), hot = lt[H.ph], oth = Math.max(...lt.filter((x, i) => i !== H.ph)), dT = hot - oth;
    const v = k => num(inp(k).value);
    const ok = {dt:nearA(v('dt'), dT, 2.5), vu:nearA(v('vu'), vu, 0.12), df:nearA(v('df'), df, 0.011), life:nearA(v('life'), life, 2.5), act:inp('act').value === 'fix'};
    Object.keys(ok).forEach(k => mark(inp(k), ok[k]));
    const av = (H.V[0] + H.V[1] + H.V[2]) / 3;
    let e = '';
    if (!ok.dt) e = `ΔT = حرارة الوصلة الساخنة ${LBL3[H.ph]} − أسخن الوصلتين الأخريين؛ قِس الوصلات الثلاث بالكاميرا.`;
    else if (!ok.vu) e = nearA(v('vu'), (Math.max(...H.V) - Math.min(...H.V)) / av * 100, 0.12) ? 'NEMA: أقصى انحراف عن المتوسط ÷ المتوسط × 100، لا الفرق بين الأكبر والأصغر.' : `VU = أقصى انحراف عن المتوسط ÷ المتوسط × 100، والمتوسط ${f1(av)} V.`;
    else if (!ok.df) e = `استكمل خطيًا على منحنى NEMA عند ${f2(vu)} %: بين ${Math.floor(vu)} % و ${Math.ceil(vu)} %.`;
    else if (!ok.life) e = nearA(v('life'), 100 - life, 2.5) ? 'هذه نسبة الفقد؛ المطلوب العمر المتبقي: 100 × 0.5^(ΔT/10).' : `الحرارة زادت ${dTw} K عن السجل؛ العمر = 100 × 0.5^(${dTw}/10).`;
    else if (!ok.act) e = {load:`تخفيض الحمل يخفي العرض ولا يصلح السبب: ΔT = ${f0(dT)} K أكبر من 15 K يعني إصلاحًا فوريًا وفق NETA.`, ol:'رفع ضبط الحماية يزيد تلف العزل؛ السبب وصلة رخوة تسبب عدم اتزان الجهد.', big:'المحرك ليس صغيرًا على الحمل؛ السبب وصلة رخوة في علبة الأطراف تسبب عدم اتزان الجهد.'}[inp('act').value] || 'اختر الإجراء.';
    if (e) return say(m, ar(e), 'bad');
    q('#th-r').classList.add('ok');
    q('#th-fx').innerHTML = `<div class="fx">ΔT = ${f1(hot)} − ${f1(oth)} = <b>${f1(dT)} K</b> <span class="bad">&gt; 15 K</span><br>Vavg = (${H.V.join(' + ')}) / 3 = ${f1(av)} V ; VU = ${f1(Math.max(...H.V.map(x => Math.abs(x - av))))} / ${f1(av)} × 100 = <b>${f2(vu)} %</b><br>NEMA: <b>${f3(df)}</b> → max ${f1(37 * df)} kW ; I unbal. = ${f1(Math.max(...H.I.map(x => Math.abs(x - (H.I[0] + H.I[1] + H.I[2]) / 3))) / ((H.I[0] + H.I[1] + H.I[2]) / 3) * 100)} %<br>ΔTw = ${H.now} − ${H.base} = ${dTw} K ; life = 100 × 0.5^(${dTw}/10) = <b>${f0(life)} %</b></div>`;
    say(m, ar(`صحيح: الوصلة ${LBL3[H.ph]} رخوة وتسقط جهدًا فتسبب عدم اتزان ${f2(vu)} %؛ أصلحها فورًا ثم أعد القياس.`), 'ok');
    win('thermal', 'أحسنت: قرأت الصورة الحرارية والجهود، وحسبت عدم الاتزان وتخفيض القدرة وعمر العزل، واخترت الإصلاح الصحيح.');
  }
  IL.onAct(host, '[data-a="chk"]', check);
  newScenario(host, 'thermal', () => { S.th = genTH(); });
  demo(host, 'thermal', async () => {
    Object.keys(I).forEach(k => delete I[k]);
    if (!P.ppe) await dClick(q('[data-a="ppe"]'));
    for (let i = 0; i < 3; i++){ cv.classList.add('dhl'); await sleep(350 / DSPEED); setXY(LUGX[i], LUGY); cv.classList.remove('dhl'); await sleep(500 / DSPEED); }
    for (const k of ['v0', 'v1', 'v2', 'i0', 'i1', 'i2']){ await dClick(q(`[data-vm="${k}"]`), 250); await sleep(250 / DSPEED); }
    const lt = [0, 1, 2].map(i => probe(LUGX[i], LUGY)), dT = lt[H.ph] - Math.max(...lt.filter((x, i) => i !== H.ph));
    await dSet(inp('dt'), f1(dT)); await dSet(inp('vu'), f2(vu)); await dSet(inp('df'), f3(df)); await dSet(inp('life'), f0(life)); await dSet(inp('act'), 'fix');
    await dClick(q('[data-a="chk"]'));
  });
};

/* =====================================================================
   TAB 7 · fault (l8): troubleshooting with real instruments
   ===================================================================== */
const FT_TOOLS = {v:{n:'ملتيميتر: جهد الأطراف', dev:'MULTIMETER · V AC', col:'#f2c230', live:true},
  i:{n:'كلامب: تيار الأطوار', dev:'CLAMP METER · A AC', col:'#d84a3a', live:true},
  rot:{n:'مبيّن تتابع الأطوار', dev:'PHASE ROTATION', col:'#4f7aa5', live:true},
  ir:{n:'ميجر 500 V: الملف إلى الجسم', dev:'INSULATION TESTER · 500 V', col:'#f2c230', live:false},
  r:{n:'ميكرو أوم: المقاومات الثلاث', dev:'MICRO-OHMMETER · 10 A', col:'#3c4449', live:false}};
const FT_C = {sp:'انقطاع طور: مصهر L3 محروق في المغذّي', uv:'انخفاض جهد المصدر يرفع التيار', gf:'تماس بين الملف والجسم (عزل مبتلّ)', ts:'قصر بين لفات أحد الملفات', rot:'تتابع الأطوار معكوس بعد إعادة التوصيل', hr:'وصلة رخوة على طرف W (مقاومة تماس عالية)', ld:'حمل ميكانيكي زائد من الضاغط', br:'محمل مستعصٍ يمنع الدوران'};
const FT_R = {sp:'ابحث عن سبب احتراق المصهر، واستبدله بالقيمة الصحيحة، ثم شغّل', uv:'صحّح الجهد من المصدر (مغيّر الجهد أو مقطع الكابل) ولا ترفع ضبط الحماية', gf:'جفّف الملفات وأعد اختبار IR و PI؛ وإن بقي منخفضًا فأعد اللف', ts:'أعد لف المحرك أو استبدله؛ التجفيف لا يصلح القصر', rot:'بدّل طرفين من أطراف التغذية في علبة الأطراف بعد الإقفال', hr:'نظّف الوصلة وأحكم ربطها بالعزم الصحيح، ثم افحصها بالكاميرا', ol:'ارفع ضبط مرحّل الحمل الزائد', rw:'أعد لف المحرك فورًا'};
const FT_S = {
  sp:{sym:'المحرك C-201 يطنّ ولا يدور عند البدء، ثم يفصل مرحّل الحمل الزائد.', key:['v', 'i'],
    v:['L1-L2 401 V', 'L2-L3 207 V · L3-L1 196 V'], i:['start: L1 392 A · L2 396 A', 'L3 0 A'], rot:['L1-L2-L3', 'L3 missing'], ir:['IR 1250 MΩ', '(20 °C)'], r:['U-V 120.4 · V-W 120.6', 'W-U 120.3 mΩ @20 °C'],
    why:'جهدا L2-L3 و L3-L1 نحو النصف وتيار L3 صفر: الطور L3 مفقود من المصدر، والملفات والعزل سليمة.'},
  uv:{sym:'يفصل مرحّل الحمل الزائد بعد نحو 20 min من التشغيل في ساعات الذروة.', key:['v'],
    v:['L1-L2 361 V · L2-L3 359 V', 'L3-L1 362 V'], i:['L1 74.2 A · L2 74.8 A', 'L3 73.9 A'], rot:['L1-L2-L3', 'OK'], ir:['IR 980 MΩ', '(24 °C)'], r:['U-V 120.1 · V-W 120.3', 'W-U 120.2 mΩ @20 °C'],
    why:'الجهد متزن لكنه نحو 360 V (−10 %) والتيار 74 A أعلى من 66 A: انخفاض الجهد يرفع التيار، والمحرك سليم.'},
  gf:{sym:'بعد غسيل أرضية غرفة الضواغط يفصل مرحّل التسرّب الأرضي فور التشغيل.', key:['ir'],
    v:['L1-L2 400 V · L2-L3 401 V', 'L3-L1 399 V'], i:['trip < 0.1 s', 'no reading'], rot:['L1-L2-L3', 'OK'], ir:['IR 0.08 MΩ', '(22 °C)'], r:['U-V 120.2 · V-W 120.4', 'W-U 120.1 mΩ @20 °C'],
    why:'العزل 0.08 MΩ إلى الجسم والمقاومات متزنة: تماس أرضي، غالبًا رطوبة دخلت بعد الغسيل.'},
  ts:{sym:'المحرك يسخن وتفوح منه رائحة ورنيش محترق، والتيارات غير متزنة رغم اتزان الجهد.', key:['r'],
    v:['L1-L2 400 V · L2-L3 399 V', 'L3-L1 401 V'], i:['L1 71.6 A · L2 64.2 A', 'L3 63.5 A'], rot:['L1-L2-L3', 'OK'], ir:['IR 420 MΩ', '(30 °C)'], r:['U-V 115.1 · V-W 118.8', 'W-U 118.8 mΩ @20 °C'],
    why:'الجهد متزن، وقراءتان أقل من 120 mΩ وعدم الاتزان 3.2 % والعزل سليم: قصر بين اللفات.'},
  rot:{sym:'بعد استبدال كابل التغذية يدور المحرك وضغط الضاغط صفر والتيار منخفض جدًا.', key:['rot'],
    v:['L1-L2 400 V · L2-L3 401 V', 'L3-L1 400 V'], i:['L1 24.5 A · L2 24.8 A', 'L3 24.6 A'], rot:['L1-L3-L2', 'REVERSE ✗'], ir:['IR 1500 MΩ', '(25 °C)'], r:['U-V 120.3 · V-W 120.2', 'W-U 120.4 mΩ @20 °C'],
    why:'تتابع الأطوار عند المحرك عكسي بعد استبدال الكابل، فيدور المحرك عكسيًا ولا يضغط الضاغط.'},
  hr:{sym:'علبة الأطراف ساخنة ورائحة احتراق خفيفة، والمحرك يعمل.', key:['r', 'v'],
    v:['L1-L2 398 V · L2-L3 391 V', 'L3-L1 389 V'], i:['L1 65.8 A · L2 64.1 A', 'L3 70.3 A'], rot:['L1-L2-L3', 'OK'], ir:['IR 900 MΩ', '(35 °C)'], r:['cable lugs: U-V 120.3', 'V-W 131.8 · W-U 132.1 mΩ'],
    why:'القراءتان اللتان تشملان W أعلى بنحو 10 % وجهد W منخفض: مقاومة تماس عالية عند وصلة W.'}
};
const FT_CR = {sp:'sp', uv:'uv', gf:'gf', ts:'ts', rot:'rot', hr:'hr'};
function genFT(){
  return {list:shuffle(Object.keys(FT_S)).slice(0, 4).map(id => {
    const cs = shuffle([id].concat(shuffle(Object.keys(FT_C).filter(k => k !== id)).slice(0, 3)));
    const rp = shuffle([id].concat(shuffle(Object.keys(FT_R).filter(k => k !== id)).slice(0, 3)));
    return {id, cs, rp, ok:false, c:'', r:''};
  })};
}
const logLi = (k, v) => ar(FT_TOOLS[k].n) + ': <bdi dir="ltr" class="mono">' + esc(v) + '</bdi>';
function instSvg(tool, lines){
  const T = FT_TOOLS[tool];
  return `<svg viewBox="0 0 320 128" role="img" aria-label="${esc(T.n)}"><rect x="4" y="4" width="312" height="120" rx="16" fill="${T.col}" stroke="#222" stroke-width="2"/><rect x="16" y="14" width="288" height="100" rx="10" fill="#2e3439"/><text x="160" y="31" text-anchor="middle" font-size="10.5" font-weight="700" fill="#f6cf45">${T.dev}</text>
  <rect x="26" y="40" width="268" height="64" rx="4" fill="#c7d3b4"/><text x="160" y="66" text-anchor="middle" font-size="15" font-weight="700" class="lcdt">${esc(lines[0])}</text><text x="160" y="92" text-anchor="middle" font-size="15" font-weight="700" class="lcdt">${esc(lines[1] || '')}</text></svg>`;
}
BUILD.fault = host => {
  if (!S.ft || !S.ft.list) S.ft = genFT();
  const FS = S.ft; let cur = 0;
  const st = FS.list.map(() => ({live:true, meas:{}}));
  host.innerHTML = `
  <div class="chipline" id="ft-tabs">${FS.list.map((c, i) => `<button type="button" class="btn${c.ok ? ' done' : ''}" data-s="${i}">${ar('الحالة ' + (i + 1))}${c.ok ? ' ✓' : ''}</button>`).join('')}</div>
  <div class="dev" id="ft-card"></div>
  ${foot()}`;
  const q = s => $(s, host);
  function render(){
    const c = FS.list[cur], s = FT_S[c.id], P = st[cur];
    $$('#ft-tabs .btn', host).forEach((b, i) => { b.setAttribute('aria-pressed', i === cur ? 'true' : 'false'); });
    const card = q('#ft-card'); card.classList.toggle('ok', c.ok);
    card.innerHTML = `<h3><span class="n">${cur + 1}</span>${ar('المحرك C-201')}</h3><p style="font-weight:600;line-height:1.8">${ar(s.sym)}</p>
      <div class="row"><span class="pill ${P.live ? 'warn' : 'ok'}" id="ft-st">${P.live ? 'المحرك موصول بالتغذية' : 'معزول ومقفل LOTO'}</span><button type="button" class="btn" data-a="loto">${P.live ? 'اعزل وأقفل وتحقّق من انعدام الجهد' : 'أزل الأقفال وأعد التغذية'}</button></div>
      <div class="chipline">${Object.keys(FT_TOOLS).map(k => `<button type="button" class="btn${P.meas[k] ? ' done' : ''}" data-t="${k}">${FT_TOOLS[k].n}</button>`).join('')}</div>
      <div class="stage" style="max-width:420px;margin:0 auto;width:100%" id="ft-inst">${instSvg('v', ['----', ''])}</div>
      <p class="msg" id="ft-m0" aria-live="polite"></p>
      <ul class="note" id="ft-log" style="margin:0;padding-inline-start:18px">${Object.keys(P.meas).map(k => `<li>${logLi(k, P.meas[k])}</li>`).join('')}</ul>
      ${sel('c', 'السبب', c.cs.map(k => [k, FT_C[k]]), c.c)}
      ${sel('r', 'الإصلاح', c.rp.map(k => [k, FT_R[k]]), c.r)}
      <div class="row"><button type="button" class="btn pri" data-a="chk">تحقّق</button></div>
      <p class="msg" id="ft-m1" aria-live="polite">${c.ok ? ar('حُلّت: ' + s.why) : ''}</p>`;
    ['c', 'r'].forEach(k => $(`[data-k="${k}"]`, card).addEventListener('change', e => { c[k] = e.target.value; save(); }));
  }
  IL.onAct(q('#ft-tabs'), '[data-s]', b => { cur = +b.dataset.s; render(); });
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-t],[data-a]'); if (!b || !q('#ft-card').contains(b)) return;
    const c = FS.list[cur], s = FT_S[c.id], P = st[cur], m0 = q('#ft-m0');
    if (b.dataset.a === 'loto'){
      P.live = !P.live; render();
      say(q('#ft-m0'), ar(P.live ? 'أُزيلت الأقفال بعد إبعاد الأدوات وإعادة الكوابل وإغلاق الغطاء؛ التغذية عادت.' : 'فُصل القاطع وأُقفل، وجُرّب الكاشف: 0 V على الأطوار الثلاثة. يمكن الآن فصل الكوابل والقياس بالميجر والميكرو أوم.'), P.live ? '' : 'ok');
      return;
    }
    if (b.dataset.a === 'chk') return check();
    const t = b.dataset.t, T = FT_TOOLS[t];
    if (!T.live && P.live) return say(m0, ar('توقّف! الميجر والميكرو أوم على دائرة حية خطر ويتلف الجهاز: اعزل وأقفل وتحقّق من انعدام الجهد أولًا.'), 'bad');
    if (T.live && !P.live){ q('#ft-inst').innerHTML = instSvg(t, t === 'i' ? ['0.0 A', ''] : t === 'rot' ? ['----', 'no voltage'] : ['0 V', '']); return say(m0, ar('المحرك معزول: لا جهد ولا تيار. هذا القياس يحتاج التغذية، فأزل الأقفال بعد إنهاء القياسات المعزولة.')); }
    q('#ft-inst').innerHTML = instSvg(t, ['····', '']);
    setTimeout(() => {
      if (!host.isConnected) return;
      q('#ft-inst').innerHTML = instSvg(t, s[t]); P.meas[t] = s[t].join(' · ');
      b.classList.add('done'); const li = document.createElement('li'); li.innerHTML = logLi(t, P.meas[t]); q('#ft-log').appendChild(li);
      say(m0, '');
    }, DEMO ? 250 / DSPEED : 700);
  });
  function check(){
    const c = FS.list[cur], s = FT_S[c.id], P = st[cur], m = q('#ft-m1'), card = q('#ft-card');
    if (!s.key.some(k => P.meas[k])) return say(m, ar('قِس أولًا بالجهاز المناسب (' + s.key.map(k => FT_TOOLS[k].n).join(' أو ') + ') قبل الحكم؛ لا تخمّن.'), 'bad');
    const cv = $('[data-k="c"]', card).value, rv = $('[data-k="r"]', card).value;
    if (!cv || !rv) return say(m, ar('اختر السبب والإصلاح.'), 'bad');
    const okC = cv === FT_CR[c.id], okR = rv === c.id;
    mark($('[data-k="c"]', card), okC); mark($('[data-k="r"]', card), okR);
    if (!okC) return say(m, ar('السبب غير صحيح: ' + s.why), 'bad');
    if (!okR) return say(m, ar(rv === 'ol' ? 'رفع ضبط الحماية يخفي العطل ويحرق العزل؛ عالج السبب.' : rv === 'rw' ? 'إعادة اللف مكلفة ولا تعالج هذا السبب؛ الملفات ليست سبب العطل هنا.' : 'هذا الإصلاح لا يعالج السبب الذي وجدته.'), 'bad');
    c.ok = true; save(); card.classList.add('ok');
    const tb = $(`#ft-tabs [data-s="${cur}"]`, host); tb.classList.add('done'); tb.innerHTML = ar('الحالة ' + (cur + 1)) + ' ✓';
    say(m, ar('صحيح: ' + s.why), 'ok');
    if (FS.list.every(x => x.ok)) win('fault', 'أحسنت: حللت الحالات الأربع بالقياس الصحيح في الحالة الآمنة الصحيحة.');
  }
  render();
  newScenario(host, 'fault', () => { S.ft = genFT(); });
  demo(host, 'fault', async () => {
    FS.list.forEach(c => { c.ok = false; c.c = ''; c.r = ''; }); $$('#ft-tabs .btn', host).forEach((b, i) => { b.classList.remove('done'); b.innerHTML = ar('الحالة ' + (i + 1)); });
    for (let i = 0; i < FS.list.length; i++){
      await dClick(q(`[data-s="${i}"]`), 300);
      const c = FS.list[i], s = FT_S[c.id], k = s.key[0];
      if (!FT_TOOLS[k].live && st[i].live) await dClick(q('[data-a="loto"]'));
      await dClick(q(`[data-t="${k}"]`)); await sleep(700 / DSPEED);
      await dSet(q('[data-k="c"]'), FT_CR[c.id]); await dSet(q('[data-k="r"]'), c.id);
      await dClick(q('[data-a="chk"]')); await sleep(600 / DSPEED);
    }
  });
};

/* =====================================================================
   start
   ===================================================================== */
TABS.forEach(tb => { if (IL.has(tb.l, 'sim')) G[tb.id].won = false; });
save();
const first = location.hash.slice(1);
show(G[first] ? first : TABS[0].id);
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (G[h]) show(h); });
window.MSIM = {S:() => S, M, BR, mgRes, derate, vuOf, zoneOf, corrV, ubOf, r20of, speed(x){ DSPEED = x; TF_MG = 30 * x; }};
})();
