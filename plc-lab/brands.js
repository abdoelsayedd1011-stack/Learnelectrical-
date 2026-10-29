(function(){
'use strict';
/* ================= brand practice simulators (Siemens · Delta · Allen-Bradley) =================
   One ladder engine (PL.eng) underneath; every brand is a "skin" that shows the program the way the vendor's
   software does: addresses, instruction names, timer units, editor look, CPU faceplate and the online workflow.
   Programs are stored with engine addresses (I0.0 · Q0.0 · M0.0 · T0 · C0 · IW64 · MW10); the brand layer
   translates them for display and parses what the learner types. Loaded only on siemens.html / delta.html / ab.html. */
const PL = window.PL, ENG = PL.eng, esc = PL.esc, $ = PL.$, $$ = PL.$$, iso = PL.iso;
const BR = PL.BR = {};

/* completed exercises: synced key (members), same shape as the other course stores */
const XKEY = 'plcx-lab-v1';
function xload(){ try { const s = JSON.parse(localStorage.getItem(XKEY)); return s && typeof s === 'object' ? s : {}; } catch (e){ return {}; } }
let XS = xload(); if (!XS.done || typeof XS.done !== 'object') XS.done = {};
PL.px = {
  has: k => !!XS.done[k],
  mark(k){ if (XS.done[k]) return false; const f = xload(); XS = Object.assign({}, f, XS); XS.done = Object.assign({}, f.done || {}, XS.done); XS.done[k] = Date.now(); try { localStorage.setItem(XKEY, JSON.stringify(XS)); } catch (e){} return true; },
  count: pfx => Object.keys(XS.done).filter(k => k.indexOf(pfx + '/') === 0).length,
  reload(){ XS = xload(); if (!XS.done) XS.done = {}; }
};
/* saved programs per brand (local only, never synced) */
function progStore(brand){
  const K = 'plc-lab-v1-' + brand + '-prog';
  return {
    get(k){ try { const o = JSON.parse(localStorage.getItem(K)) || {}; return o[k] || null; } catch (e){ return null; } },
    set(k, v){ let o = {}; try { o = JSON.parse(localStorage.getItem(K)) || {}; } catch (e){} if (v == null) delete o[k]; else o[k] = v; try { localStorage.setItem(K, JSON.stringify(o)); } catch (e){} }
  };
}

/* ---------- SVG text helpers ---------- */
const CHW = {t:5.75, s:4.9, b:6.1, h:6.6};
/* text that never spills out of its slot: squeeze with textLength when the estimate is too wide */
function tx(x, y, s, cls, anchor, maxw){
  s = String(s == null ? '' : s);
  const est = s.length * (CHW[(cls || 't').split(' ')[0]] || 5.6);
  const fit = maxw && est > maxw ? ` textLength="${maxw}" lengthAdjust="spacingAndGlyphs"` : '';
  return `<text x="${x}" y="${y}" class="${cls || 't'}"${anchor ? ` text-anchor="${anchor}"` : ''}${fit}>${esc(s)}</text>`;
}
const cut = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

/* ---------- address helpers ---------- */
const bitIdx = a => { const m = /^(I|Q|M)(\d{1,2})\.([0-7])$/.exec(a); return m ? +m[2] * 8 + +m[3] : -1; };
const bitOf = (p, n) => `${p}${Math.floor(n / 8)}.${n % 8}`;
const tagByA = (T, a) => T.find(t => t.a === a);
const tagByN = (T, n) => { n = String(n || '').replace(/"/g, '').trim().toLowerCase(); return T.find(t => t.n.toLowerCase() === n); };
/* every engine address a program touches */
function usedAddrs(prog){ const s = new Set(); prog.forEach(rg => rg.rows.forEach(row => row.forEach(el => { if (!el) return; if (el.a) s.add(el.a); if (el.o) s.add(el.o); if (el.r) s.add(el.r); }))); return s; }
function freeAddr(kind, prog, T){
  const used = usedAddrs(prog); T.forEach(t => used.add(t.a));
  for (let n = 0; n < 100; n++){ const a = kind === 'M' ? bitOf('M', n) : kind + n; if (!used.has(a)) return a; }
  return null;
}

/* ---------- rung → boolean expression (series / parallel reduction) ----------
   Used for the Delta instruction list and the Allen-Bradley rung text. Returns groups of
   {x: expr, outs:[el…]} (outputs that hang on the same node share one expression), or null if a rung is not series-parallel. */
function rungGroups(rg){
  const R = rg.rows.length, C = rg.rows[0].length, par = {};
  const id = (r, n) => r * C + n;
  const find = k => { while (par[k] != null && par[k] !== k) k = par[k]; return k; };
  const uni = (a, b) => { a = find(a); b = find(b); if (a !== b) par[b] = a; };
  for (let r = 0; r < R; r++) for (let n = 0; n < C; n++) par[id(r, n)] = id(r, n);
  for (let r = 1; r < R; r++) uni(id(0, 0), id(r, 0));
  for (let r = 1; r < R; r++) (rg.links[r - 1] || []).forEach(n => uni(id(r - 1, n), id(r, n)));
  const edges = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C - 1; c++){ const el = rg.rows[r][c]; if (el) edges.push({u:find(id(r, c)), v:find(id(r, c + 1)), x:el.t === 'W' ? {k:'T'} : {k:'L', el}}); }
  const groups = [];
  for (let r = 0; r < R; r++){ const el = rg.rows[r][C - 1]; if (!el) continue; const nd = find(id(r, C - 1)); let g = groups.find(q => q.nd === nd); if (!g){ g = {nd, outs:[]}; groups.push(g); } g.outs.push(el); }
  const S = find(id(0, 0));
  groups.forEach(g => { g.x = reduce(edges, S, g.nd); });
  return groups;
}
function simp(x){
  if (!x || x.k === 'L' || x.k === 'T') return x;
  let a = []; x.a.map(simp).forEach(y => { if (y.k === x.k) a = a.concat(y.a); else a.push(y); });
  if (x.k === 'and'){ a = a.filter(y => y.k !== 'T'); if (!a.length) return {k:'T'}; }
  if (x.k === 'or' && a.some(y => y.k === 'T')) return {k:'T'};
  return a.length === 1 ? a[0] : {k:x.k, a};
}
function reduce(edges0, S, T){
  if (S === T) return {k:'T'};
  const fwd = {[S]:1}, bwd = {[T]:1};
  for (let ch = true; ch;){ ch = false; edges0.forEach(e => { if (fwd[e.u] && !fwd[e.v]){ fwd[e.v] = 1; ch = true; } if (bwd[e.v] && !bwd[e.u]){ bwd[e.u] = 1; ch = true; } }); }
  let E = edges0.filter(e => fwd[e.u] && bwd[e.v]).map(e => Object.assign({}, e));
  if (!E.length) return null;
  for (let guard = 0; guard < 200; guard++){
    if (E.length === 1 && E[0].u === S && E[0].v === T) return simp(E[0].x);
    let done = false;
    /* parallel */
    for (let i = 0; i < E.length && !done; i++) for (let j = i + 1; j < E.length; j++) if (E[i].u === E[j].u && E[i].v === E[j].v){ E[i] = {u:E[i].u, v:E[i].v, x:{k:'or', a:[E[i].x, E[j].x]}}; E.splice(j, 1); done = true; break; }
    if (done) continue;
    /* series */
    const nodes = new Set(); E.forEach(e => { nodes.add(e.u); nodes.add(e.v); });
    for (const n of nodes){ if (n === S || n === T) continue; const ins = E.filter(e => e.v === n), outs = E.filter(e => e.u === n);
      if (ins.length === 1 && outs.length === 1){ const a = ins[0], b = outs[0]; E = E.filter(e => e !== a && e !== b); E.push({u:a.u, v:b.v, x:{k:'and', a:[a.x, b.x]}}); done = true; break; } }
    if (!done) return null;
  }
  return null;
}
PL.rungGroups = rungGroups;

/* ---------- translate engine addresses inside a text (test messages, machine drawings) ---------- */
const ARX = /\b(?:[IQM]\d{1,2}\.[0-7]|IW64|MW\d{1,3}|HC\d)\b/g;
function xlate(B, T, s){ return String(s).replace(ARX, a => B.short(a, T)); }
function xlateSvg(B, T, svg){ return svg.replace(/>([^<]+)</g, (m, t) => '>' + t.replace(ARX, a => esc(B.short(a, T))) + '<'); }

/* engine-time (seconds) → TIA style T#2s_300ms */
function tiaTime(sec){ let ms = Math.round(sec * 1000); if (ms <= 0) return 'T#0ms'; const s = Math.floor(ms / 1000); ms -= s * 1000; return 'T#' + (s ? s + 's' : '') + (s && ms ? '_' : '') + (ms ? ms + 'ms' : ''); }
const nfmt = (v, d) => PL.fmt(v, d);

/* ================= Siemens S7-1200 · TIA Portal style ================= */
const SIE = BR.sie = {id:'sie', name:'Siemens', cpu:'CPU 1214C DC/DC/DC', WY:42, PADL:8, PADR:6, rrail:false, CW:64, CWO:116,
  rn: i => 'Network ' + (i + 1),
  rnAr: i => iso('Network ' + (i + 1))};
SIE.inst = (T, a) => { const t = tagByA(T, a); return t ? t.n : (a[0] === 'T' ? 'IEC_Timer_' : 'IEC_Counter_') + a.slice(1) + '_DB'; };
SIE.ctr = (prog, a) => { let up = false, dn = false; (prog || []).forEach(rg => rg.rows.forEach(row => row.forEach(el => { if (el && el.a === a){ if (el.t === 'CTU') up = true; if (el.t === 'CTD') dn = true; } }))); return up || !dn ? 'QU' : 'QD'; };
/* S7-1200 HSC_1 … HSC_6: the current count is read from %ID1000, %ID1004 … (DInt) */
SIE.abs = function(a){ const k = ENG.kind(a); if (k === 'I' || k === 'Q' || k === 'M' || k === 'IW') return '%' + a; if (k === 'MW') return '%MD' + a.slice(2); if (k === 'HC') return '%ID' + (1000 + 4 * +a.slice(2)); if (k === 'TB') return ''; return ''; };
SIE.sym = function(a, T, prog){
  const k = ENG.kind(a);
  if (k === 'T') return `"${SIE.inst(T, a)}".Q`;
  if (k === 'TB'){ const b = a.split('.'); return `"${SIE.inst(T, b[0])}".${b[1] === 'EN' ? 'IN' : 'Q'}`; }
  if (k === 'C') return `"${SIE.inst(T, a)}".${SIE.ctr(prog, a)}`;
  const t = tagByA(T, a); return t ? `"${t.n}"` : '';
};
SIE.short = (a, T) => { const k = ENG.kind(a); return k === 'T' || k === 'C' ? `"${SIE.inst(T, a)}"` : SIE.abs(a) || a; };
SIE.word = (a, T) => { const k = ENG.kind(a); if (k === 'T') return `"${SIE.inst(T, a)}".ET`; if (k === 'C') return `"${SIE.inst(T, a)}".CV`; const t = tagByA(T, a); return t ? `"${t.n}"` : SIE.abs(a); };
SIE.dtype = a => ({I:'Bool', Q:'Bool', M:'Bool', IW:'Int', MW:'Real', T:'IEC_TIMER', C:'IEC_COUNTER', HC:'DInt'}[ENG.kind(a)] || '');
SIE.hsc = a => 'HSC_' + (1 + +String(a).slice(2));
SIE.pal = [
  {id:'NO', t:'NO', mn:'-| |-', ar:'كونتاكت NO'}, {id:'NC', t:'NC', mn:'-|/|-', ar:'كونتاكت NC'}, {id:'P', t:'P', mn:'-|P|-', ar:'Edge طالع'}, {id:'N', t:'N', mn:'-|N|-', ar:'Edge نازل'}, {id:'CMP', t:'CMP', mn:'CMP', ar:'مقارنة'},
  {id:'OUT', t:'OUT', mn:'-( )-', ar:'كويل'}, {id:'S', t:'S', mn:'-(S)-', ar:'Set'}, {id:'R', t:'R', mn:'-(R)-', ar:'Reset', acc:['Q', 'M']}, {id:'RT', t:'R', mn:'-(RT)-', ar:'صفّر تايمر', acc:['T']},
  {id:'TON', t:'TON', mn:'TON', ar:'تأخير تشغيل'}, {id:'TOF', t:'TOF', mn:'TOF', ar:'تأخير فصل'}, {id:'TP', t:'TP', mn:'TP', ar:'نبضة'}, {id:'CTU', t:'CTU', mn:'CTU', ar:'عدّاد طالع'}, {id:'CTD', t:'CTD', mn:'CTD', ar:'عدّاد نازل'}, {id:'SCL', t:'SCL', mn:'NORM_X+SCALE_X', ar:'تحويل أنالوج'},
  {id:'HSCR', t:'R', mn:'CTRL_HSC', ar:'تصفير العدّاد السريع', acc:['HC'], hsc:true}];
SIE.idOf = el => el.t === 'R' && ENG.kind(el.a) === 'T' ? 'RT' : el.t === 'R' && ENG.kind(el.a) === 'HC' ? 'HSCR' : el.t;
SIE.help = {NO:'بيوصّل لما البت = 1', NC:'بيوصّل لما البت = 0', P:'بيوصّل سكان واحد لما البت يطلع من 0 لـ 1 (P_TRIG)', N:'بيوصّل سكان واحد لما البت ينزل من 1 لـ 0', CMP:'بيوصّل لو المقارنة صح (Int / DInt / Real / Time). عدّ الـ HSC نوعه DInt (32 بت)',
  OUT:'البت = الكهربا الداخلة', S:'لو جاله كهربا البت يبقى 1 ويفضل', R:'لو جاله كهربا البت يبقى 0', RT:'RESET_TIMER: بيصفّر التايمر', TON:'IEC timer: Q بيبقى 1 بعد PT من IN', TOF:'IEC timer: Q بيفضل 1 لمدة PT بعد ما IN يقع', TP:'IEC timer: نبضة بطول PT',
  CTU:'IEC counter: CV بيزيد مع كل نبضة على CU، و QU = 1 لما CV ≥ PV، والـ R يصفّره', CTD:'IEC counter: CV بينقص مع CD، و LD بيحمّل PV', SCL:'NORM_X يحوّل الـ raw (⁦0⁠–⁠27648⁩) لـ ⁦0.0⁠–⁠1.0⁩، و SCALE_X يحوّله للوحدة الحقيقية',
  HSCR:'CTRL_HSC: لما الـ EN يبقى 1 و CV = TRUE بيكتب NEW_CV في العدّاد السريع. هنا NEW_CV = 0 يعني تصفير'};
SIE.pt = {lab:'PT (ثواني)', get:pt => pt, set:v => Math.round(v * 10) / 10, show:tiaTime, step:0.1};
SIE.pv = {lab:'PV'};
SIE.cmpShow = (a, b) => ENG.kind(a) === 'T' ? tiaTime(b) : ENG.kind(a) === 'MW' ? nfmt(b, 1) : String(b);
SIE.cmpType = a => ({T:'Time', MW:'Real', C:'Int', IW:'Int', HC:'DInt'}[ENG.kind(a)] || 'Int');
SIE.cmpLab = a => ENG.kind(a) === 'T' ? 'القيمة (ثواني)' : 'القيمة';
SIE.opName = op => op;
SIE.parse = function(str, acc, T){
  let s = String(str || '').trim().replace(/[“”]/g, '"');
  if (!s) return {err:'اكتب عنوان أو اسم Tag.'};
  const nm = s.replace(/"/g, '').replace(/\.(Q|QU|QD|ET|CV|IN)$/i, '');
  const tg = tagByN(T, nm);
  if (tg){ const k = ENG.kind(tg.a); if (acc.indexOf(k) >= 0) return {a:tg.a}; return {err:`الـ Tag ${iso('"' + tg.n + '"')} نوعه ${iso(SIE.dtype(tg.a))} ومينفعش هنا.`}; }
  const u = s.replace(/"/g, '').toUpperCase().replace(/\s+/g, '').replace(/,/g, '.');
  let m, a = null;
  if ((m = /^%?(I|Q|M)(\d{1,2})\.([0-7])$/.exec(u))) a = m[1] + (+m[2]) + '.' + m[3];
  else if ((m = /^%?(I|Q|M)(\d{1,2})\.([89])$/.exec(u))) return {err:'رقم البت من ⁦0⁩ لـ ⁦7⁩ بس (البايت فيه 8 بت): بعد ' + iso('%' + m[1] + m[2] + '.7') + ' بييجي ' + iso('%' + m[1] + (+m[2] + 1) + '.0') + '.'};
  else if ((m = /^%?IW(\d{1,3})$/.exec(u))) a = 'IW' + (+m[1]);
  else if ((m = /^%?MD(\d{1,3})$/.exec(u))) a = 'MW' + (+m[1]);
  else if ((m = /^%?ID(\d{4})$/.exec(u)) && +m[1] >= 1000 && +m[1] <= 1020 && (+m[1] - 1000) % 4 === 0) a = 'HC' + ((+m[1] - 1000) / 4);
  else if (/^(I|Q|M)\d/.test(u) && u[0] !== '%') a = null;
  if (!a) return {err:`مش فاهم ${iso(s)}. اكتب عنوان زي ${iso('%I0.3')} أو ${iso('%Q0.2')} أو ${iso('%M1.0')}، أو اسم Tag موجود في الجدول.`};
  const k = ENG.kind(a);
  if (acc.indexOf(k) < 0) return {err:`العنوان ${iso(SIE.abs(a))} مينفعش مع العنصر ده.`};
  if (!tagByA(T, a) && (k === 'I' || k === 'Q' || k === 'M')){ let n = 1; while (tagByN(T, 'Tag_' + n)) n++; return {a, tag:{n:'Tag_' + n, a, c:'', u:1}, msg:`TIA بيعمل Tag جديد لوحده للعنوان ده اسمه ${iso('"Tag_' + n + '"')}. تقدر تغيّر اسمه من تبويب PLC tags.`}; }
  return {a};
};
/* new timer / counter instance: TIA asks for a name and offers IEC_Timer_0_DB, IEC_Timer_0_DB_1 … */
SIE.newInst = function(t, T, prog){
  const kind = t === 'CTU' || t === 'CTD' ? 'C' : 'T', a = freeAddr(kind, prog, T); if (!a) return null;
  const base = kind === 'T' ? 'IEC_Timer_0_DB' : 'IEC_Counter_0_DB'; let n = base, i = 0; while (tagByN(T, n)){ i++; n = base + '_' + i; }
  return {a, tag:{n, a, c:'', u:1}};
};

/* ---- drawing ---- */
SIE.cellH = el => !el ? 74 : el.t === 'R' && ENG.kind(el.a) === 'HC' ? 104 : el.t === 'CTU' || el.t === 'CTD' || el.t === 'SCL' ? 104 : el.t === 'TON' || el.t === 'TOF' || el.t === 'TP' ? 88 : el.t === 'CMP' ? 82 : 74;
SIE.icon = function(id){
  const L = '<path d="M2 12h12M26 12h12"/>', P = '<path d="M14 4v16M26 4v16"/>', Cc = '<path d="M2 12h10M28 12h10"/><path d="M15 4q-5 8 0 16M25 4q5 8 0 16"/>';
  const box = s => `<rect x="5" y="2" width="30" height="20" rx="1.5"/><text x="20" y="15.5" text-anchor="middle" class="ic-t">${s}</text>`;
  return `<svg viewBox="0 0 40 24" class="bx-ic" aria-hidden="true">${({NO:L + P, NC:L + P + '<path d="M12 20L28 4"/>', P:L + P + '<text x="20" y="16" text-anchor="middle" class="ic-t">P</text>', N:L + P + '<text x="20" y="16" text-anchor="middle" class="ic-t">N</text>',
    OUT:Cc, S:Cc + '<text x="20" y="16" text-anchor="middle" class="ic-t">S</text>', R:Cc + '<text x="20" y="16" text-anchor="middle" class="ic-t">R</text>', RT:Cc + '<text x="20" y="15.5" text-anchor="middle" class="ic-t" font-size="7">RT</text>', CMP:box('CMP'), SCL:box('NORM'), HSCR:box('HSC')})[id] || box(id)}</svg>`;
};
SIE.cell = function(c){
  const {x, w, wy, el, mon, e, T, prog} = c, cx = x + w / 2;
  const pc = p => mon ? (p ? ' pw' : ' np') : '';
  const wire = (x1, x2, p) => `<path d="M${x1} ${wy}H${x2}" class="w${pc(p)}"/>`;
  let s = '';
  if (el.t === 'W') return wire(x, x + w, c.pin);
  const two = (a, y1) => { const ab = SIE.abs(a), sy = SIE.sym(a, T, prog); return (ab ? tx(cx, y1, ab, 't', 'middle', w - 4) : '') + (sy ? tx(cx, ab ? y1 + 11 : y1 + 5, sy, 's', 'middle', w - 2) : ''); };
  if (el.t === 'NO' || el.t === 'NC' || el.t === 'P' || el.t === 'N'){
    const cl = mon && c.cond;
    s += wire(x, cx - 9, c.pin) + wire(cx + 9, x + w, c.pout);
    s += `<path d="M${cx - 9} ${wy - 11}V${wy + 11}M${cx + 9} ${wy - 11}V${wy + 11}" class="sy${mon ? (cl ? ' on' : ' off') : ''}"/>`;
    if (el.t === 'NC') s += `<path d="M${cx - 11} ${wy + 11}L${cx + 11} ${wy - 11}" class="sy${mon ? (cl ? ' on' : ' off') : ''}"/>`;
    if (el.t === 'P' || el.t === 'N') s += tx(cx, wy + 4, el.t, 'b', 'middle');
    if (cl) s += `<rect x="${cx - 8}" y="${wy - 10}" width="16" height="20" class="fl"/>`;
    return s + two(el.a, wy - 26);
  }
  if (el.t === 'CMP'){
    const on = mon && c.cond;
    s += wire(x, x + 10, c.pin) + wire(x + w - 10, x + w, c.pout);
    s += `<rect x="${x + 10}" y="${wy - 16}" width="${w - 20}" height="30" rx="1.5" class="bx${mon ? (on ? ' on' : ' off') : ''}"/>`;
    s += tx(cx, wy - 3, el.op, 'h', 'middle') + tx(cx, wy + 9, SIE.cmpType(el.a), 's', 'middle');
    s += tx(cx, wy - 22, SIE.word(el.a, T), 's', 'middle', w - 2);
    s += tx(cx, wy + 26, SIE.cmpShow(el.a, el.b), 't', 'middle', w - 4);
    if (mon) s += tx(cx, wy + 37, '= ' + SIE.cmpShow(el.a, e.num(el.a)), 's mv', 'middle', w - 2);
    return s;
  }
  if (el.t === 'R' && ENG.kind(el.a) === 'HC'){
    /* CTRL_HSC box: HSC = hardware ID of the counter, CV = TRUE (write a new value), NEW_CV = 0 */
    const bx = x + 46, bw = w - 52, top = wy - 22, bh = 62, v = mon && c.pin;
    s += wire(x, bx, c.pin) + `<rect x="${bx}" y="${top}" width="${bw}" height="${bh}" rx="1.5" class="bx${mon ? (v ? ' on' : ' off') : ''}"/>`;
    s += tx(bx + bw / 2, top + 10, 'CTRL_HSC', 'b', 'middle', bw - 4) + tx(bx + bw / 2, top + 19, 'HSC_1', 's', 'middle');
    const pinL = (yy, n) => tx(bx + 3, yy + 3, n, 's'), opL = (yy, t) => `<path d="M${bx - 6} ${yy}H${bx}" class="w"/>` + tx(bx - 8, yy + 3, t, 't', 'end', 42);
    s += pinL(wy + 6, 'EN') + pinL(wy + 20, 'CV') + pinL(wy + 34, 'NEW_CV') + opL(wy + 20, 'TRUE') + opL(wy + 34, 'L#0');
    s += tx(bx + bw / 2, top - 6, '"Local~' + SIE.hsc(el.a) + '"', 's', 'middle', w - 8);
    if (mon) s += tx(bx + bw / 2, top + bh + 11, SIE.abs(el.a) + ' = ' + e.num(el.a), 's mv', 'middle', w - 8);
    return s;
  }
  if (el.t === 'OUT' || el.t === 'S' || el.t === 'R'){
    const v = mon && c.pin;
    s += wire(x, cx - 10, c.pin);
    s += `<path d="M${cx - 6} ${wy - 12}q-7 12 0 24M${cx + 6} ${wy - 12}q7 12 0 24" class="sy${mon ? (v ? ' on' : ' off') : ''}"/>`;
    if (v) s += `<circle cx="${cx}" cy="${wy}" r="7" class="fl"/>`;
    if (el.t !== 'OUT') s += tx(cx, wy + 3.5, el.t === 'R' && ENG.kind(el.a) === 'T' ? 'RT' : el.t, el.t === 'R' && ENG.kind(el.a) === 'T' ? 's' : 'b', 'middle');
    return s + two(el.a, wy - 26);
  }
  /* boxes: IEC timers / counters / NORM_X+SCALE_X */
  const bx = x + 46, bw = w - 52, top = wy - 22;
  const isT = el.t === 'TON' || el.t === 'TOF' || el.t === 'TP';
  const tm = isT && e ? e.T[el.a] : null, ct = (el.t === 'CTU' || el.t === 'CTD') && e ? e.C[el.a] : null;
  const q = mon && (isT ? !!(tm && tm.q) : ct ? !!ct.q : !!c.pin);
  const bh = isT ? 44 : 62;
  s += wire(x, bx, c.pin);
  s += `<rect x="${bx}" y="${top}" width="${bw}" height="${bh}" rx="1.5" class="bx${mon ? (q ? ' on' : ' off') : ''}"/>`;
  const pinL = (yy, n) => tx(bx + 3, yy + 3, n, 's');
  const pinR = (yy, n) => tx(bx + bw - 3, yy + 3, n, 's', 'end');
  const opL = (yy, v) => `<path d="M${bx - 6} ${yy}H${bx}" class="w"/>` + tx(bx - 8, yy + 3, v, 't', 'end', 42);
  if (isT){
    s += tx(bx + bw / 2, top + 10, el.t, 'b', 'middle') + tx(bx + bw / 2, top + 19, 'Time', 's', 'middle');
    s += pinL(wy + 6, 'IN') + pinL(wy + 18, 'PT') + pinR(wy + 6, 'Q') + pinR(wy + 18, 'ET');
    s += opL(wy + 18, tiaTime(el.pt));
    s += tx(bx + bw / 2, top - 6, `"${SIE.inst(T, el.a)}"`, 's', 'middle', w - 8);
    if (mon) s += tx(bx + bw / 2, top + bh + 11, 'ET ' + tiaTime(tm ? tm.et : 0), 's mv', 'middle', w - 8);
    return s;
  }
  if (el.t === 'CTU' || el.t === 'CTD'){
    const up = el.t === 'CTU';
    s += tx(bx + bw / 2, top + 10, el.t, 'b', 'middle') + tx(bx + bw / 2, top + 19, 'Int', 's', 'middle');
    s += pinL(wy + 6, up ? 'CU' : 'CD') + pinL(wy + 20, up ? 'R' : 'LD') + pinL(wy + 34, 'PV') + pinR(wy + 6, up ? 'QU' : 'QD') + pinR(wy + 20, 'CV');
    const rv = el.r ? SIE.abs(el.r) : 'false', ron = mon && el.r && e && e.bit(el.r);
    s += `<path d="M${bx - 6} ${wy + 20}H${bx}" class="w${mon ? (ron ? ' pw' : ' np') : ''}"/>` + tx(bx - 8, wy + 23, rv, 't', 'end', 42) + opL(wy + 34, String(el.pv));
    s += tx(bx + bw / 2, top - 6, `"${SIE.inst(T, el.a)}"`, 's', 'middle', w - 8);
    if (mon) s += tx(bx + bw / 2, top + bh + 11, 'CV = ' + (ct && ct.cv != null ? ct.cv : 0), 's mv', 'middle', w - 8);
    return s;
  }
  if (el.t === 'SCL'){
    s += tx(bx + bw / 2, top + 10, 'NORM_X', 'b', 'middle', bw - 4) + tx(bx + bw / 2, top + 19, '▸ SCALE_X', 's', 'middle', bw - 4);
    s += pinL(wy + 6, 'EN') + pinL(wy + 20, 'VALUE') + pinR(wy + 20, 'OUT');
    s += opL(wy + 20, SIE.abs(el.a));
    s += tx(bx + bw / 2, wy + 33, '0…27648 →', 's', 'middle', bw - 4) + tx(bx + bw / 2, wy + 42, nfmt(el.lo, 1) + '…' + nfmt(el.hi, 1), 's', 'middle', bw - 4);
    s += tx(bx + bw / 2, top - 6, '→ ' + SIE.word(el.o, T), 's', 'middle', w - 8);
    if (mon) s += tx(bx + bw / 2, top + bh + 11, SIE.abs(el.o) + ' = ' + nfmt(e.num(el.o), 1), 's mv', 'middle', w - 8);
    return s;
  }
  return s;
};
SIE.lineEnd = () => '';

/* ================= Delta DVP · ISPSoft / WPLSoft style ================= */
const DVP = BR.dvp = {id:'dvp', name:'Delta', cpu:'DVP-14SS2', WY:34, PADL:8, PADR:8, rrail:true, CW:64, CWO:116,
  rn: i => 'رانج ' + (i + 1), rnAr: i => 'رانج ' + (i + 1)};
DVP.abs = function(a){
  const k = ENG.kind(a);
  if (k === 'I') return 'X' + bitIdx(a).toString(8);
  if (k === 'Q') return 'Y' + bitIdx(a).toString(8);
  if (k === 'M') return 'M' + bitIdx(a);
  if (k === 'T' || k === 'C') return a;
  if (k === 'MW') return 'D' + a.slice(2);
  if (k === 'IW') return 'D' + a.slice(2);
  if (k === 'HC') return 'C' + (251 + +a.slice(2));
  return a;
};
DVP.sym = (a, T) => { const t = tagByA(T, a); return t ? t.c || '' : ''; };
DVP.short = a => DVP.abs(a);
DVP.word = a => DVP.abs(a);
DVP.dtype = a => ({I:'X', Q:'Y', M:'M', T:'T', C:'C', MW:'D', HC:'C'}[ENG.kind(a)] || '');
DVP.pal = [
  {id:'NO', t:'NO', mn:'LD', ar:'كونتاكت NO', acc:['I', 'Q', 'M', 'T', 'C', 'HC']}, {id:'NC', t:'NC', mn:'LDI', ar:'كونتاكت NC', acc:['I', 'Q', 'M', 'T', 'C', 'HC']}, {id:'P', t:'P', mn:'LDP', ar:'Edge طالع'}, {id:'N', t:'N', mn:'LDF', ar:'Edge نازل'}, {id:'CMP', t:'CMP', mn:'LD※', ar:'مقارنة'},
  {id:'OUT', t:'OUT', mn:'OUT', ar:'كويل'}, {id:'S', t:'S', mn:'SET', ar:'Set'}, {id:'R', t:'R', mn:'RST', ar:'Reset (Y · M · T · C)', acc:['Q', 'M', 'T', 'C', 'HC']}, {id:'TON', t:'TON', mn:'TMR', ar:'تايمر'}, {id:'CTU', t:'CTU', mn:'CNT', ar:'عدّاد'},
  {id:'HSC', t:'HSC', mn:'DCNT', ar:'عدّاد سريع 32 بت', hsc:true}];
DVP.idOf = el => el.t;
DVP.help = {NO:'LD / AND / OR: بيوصّل لما البت = 1', NC:'LDI / ANI / ORI: بيوصّل لما البت = 0', P:'LDP / ANDP / ORP: سكان واحد لما البت يطلع 0 ← 1', N:'LDF / ANDF / ORF: سكان واحد لما البت ينزل 1 ← 0', CMP:'LD= LD> LD< LD>= LD<= LD<>: بيوصّل لو المقارنة صح (القيمة الثابتة بتتكتب K). مع عدّاد 32 بت زي C251 بتبقى DLD>= و DAND< …',
  OUT:'OUT: البت = الكهربا الداخلة', S:'SET: يخلّي البت 1 ويفضل', R:'RST: يرجّع البت 0، ولو T أو C بيصفّر القيمة', TON:'TMR T0 K50: تايمر تأخير تشغيل. T0–T199 وحدته 100ms، يعني K50 = 5 ثواني', CTU:'CNT C0 K10: عدّاد طالع (16 بت). الكونتاكت C0 بيبقى 1 لما العدّ يوصل K. بيتصفّر بـ RST C0',
  HSC:'DCNT C251 K10000: بيشغّل العدّاد السريع C251 (فاز A على X0 و B على X1، 32 بت). لازم يفضل متنفّذ طول الوقت عشان يعدّ، والكونتاكت C251 بيبقى 1 لما العدّ يوصل K. بيتصفّر بـ RST C251'};
DVP.pt = {lab:'K (×100ms)', get:pt => Math.round(pt * 10), set:v => Math.max(1, Math.round(v)) / 10, show:pt => 'K' + Math.round(pt * 10), step:1};
DVP.pv = {lab:'K'};
DVP.cmpShow = (a, b) => 'K' + (ENG.kind(a) === 'T' ? Math.round(b * 10) : Math.round(b));
DVP.cmpGet = (a, b) => ENG.kind(a) === 'T' ? Math.round(b * 10) : b;
DVP.cmpSet = (a, v) => ENG.kind(a) === 'T' ? Math.round(v) / 10 : Math.round(v);
DVP.cmpLab = a => ENG.kind(a) === 'T' ? 'K (×100ms)' : 'K';
DVP.opName = (op, a) => (a && ENG.kind(a) === 'HC' ? 'DLD' : 'LD') + (op === '==' ? '=' : op);
DVP.parse = function(str, acc){
  const u = String(str || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!u) return {err:'اكتب عنوان زي X3 أو Y2 أو M10.'};
  let m, a = null;
  if ((m = /^([XY])(\d{1,3})$/.exec(u))){
    if (/[89]/.test(m[2])) return {err:`${iso(u)} مش موجود: أرقام X و Y في دلتا بالـ Octal (من 0 لـ 7)، يعني بعد ${iso(m[1] + '7')} بييجي ${iso(m[1] + '10')}.`};
    const n = parseInt(m[2], 8); a = bitOf(m[1] === 'X' ? 'I' : 'Q', n);
    if ((m[1] === 'X' && n > 7) || (m[1] === 'Y' && n > 5)) return {err:`الـ ${iso('DVP-14SS2')} فيه ${iso('X0–X7')} و ${iso('Y0–Y5')} بس.`};
  }
  else if ((m = /^M(\d{1,3})$/.exec(u))){ if (+m[1] > 799) return {err:'استخدم من M0 لـ M799.'}; a = bitOf('M', +m[1]); }
  else if ((m = /^T(\d{1,2})$/.exec(u))) a = 'T' + (+m[1]);
  else if (u === 'C251') a = 'HC0';
  else if (/^C2[0-5]\d$/.test(u)) return {err:`${iso(u)} مش مستخدم هنا. الإنكودر داخل A على ${iso('X0')} و B على ${iso('X1')}، وده العدّاد السريع ${iso('C251')} (فازتين A/B). ${iso('C235')} مثلًا بيعدّ من ${iso('X0')} بس (فاز واحد) فمش هيعرف الاتجاه.`};
  else if ((m = /^C(\d{1,2})$/.exec(u))) a = 'C' + (+m[1]);
  else if ((m = /^D(\d{1,3})$/.exec(u))) a = 'MW' + (+m[1]);
  if (!a) return {err:`مش فاهم ${iso(u)}. أمثلة: ${iso('X3')} · ${iso('Y1')} · ${iso('M10')} · ${iso('T2')} · ${iso('C1')}.`};
  if (acc.indexOf(ENG.kind(a)) < 0) return {err:`${iso(u)} مينفعش مع التعليمة دي.`};
  return {a};
};
DVP.newInst = function(t, T, prog){ const a = freeAddr(t === 'CTU' ? 'C' : 'T', prog, T); return a ? {a} : null; };

DVP.cellH = el => !el ? 62 : el.t === 'TON' || el.t === 'CTU' || el.t === 'HSC' ? 66 : el.t === 'CMP' ? 64 : 62;
DVP.icon = function(id){
  const L = '<path d="M2 12h13M25 12h13"/>', P = '<path d="M15 4v16M25 4v16"/>', br = s => `<path d="M6 3h-3v18h3M34 3h3v18h-3"/><text x="20" y="15.5" text-anchor="middle" class="ic-t">${s}</text>`;
  return `<svg viewBox="0 0 40 24" class="bx-ic" aria-hidden="true">${({NO:L + P, NC:L + P + '<path d="M13 20L27 4"/>', P:L + P + '<path d="M20 17V7M17 10l3-3 3 3"/>', N:L + P + '<path d="M20 7v10M17 14l3 3 3-3"/>', CMP:'<rect x="4" y="4" width="32" height="16"/><text x="20" y="15.5" text-anchor="middle" class="ic-t">&gt;=</text>',
    OUT:'<path d="M2 12h10M28 12h10"/><path d="M15 4q-5 8 0 16M25 4q5 8 0 16"/>', S:br('SET'), R:br('RST'), TON:br('TMR'), CTU:br('CNT'), HSC:br('DCNT')})[id] || br(id)}</svg>`;
};
DVP.cell = function(c){
  const {x, w, wy, el, mon, e, T} = c, cx = x + w / 2;
  const wire = (x1, x2) => `<path d="M${x1} ${wy}H${x2}" class="w"/>`;
  let s = '';
  if (el.t === 'W') return wire(x, x + w);
  const cm = DVP.sym(el.a, T);
  if (el.t === 'NO' || el.t === 'NC' || el.t === 'P' || el.t === 'N'){
    const on = mon && c.cond;
    s += wire(x, cx - 7) + wire(cx + 7, x + w);
    if (on) s += `<rect x="${cx - 7}" y="${wy - 10}" width="14" height="20" class="fl"/>`;
    s += `<path d="M${cx - 7} ${wy - 10}V${wy + 10}M${cx + 7} ${wy - 10}V${wy + 10}" class="sy"/>`;
    if (el.t === 'NC') s += `<path d="M${cx - 9} ${wy + 10}L${cx + 9} ${wy - 10}" class="sy"/>`;
    if (el.t === 'P') s += `<path d="M${cx} ${wy + 6}V${wy - 6}M${cx - 3} ${wy - 3}l3-3 3 3" class="sy th"/>`;
    if (el.t === 'N') s += `<path d="M${cx} ${wy - 6}V${wy + 6}M${cx - 3} ${wy + 3}l3 3 3-3" class="sy th"/>`;
    s += tx(cx, wy - 15, DVP.abs(el.a), 'h', 'middle', w - 6);
    if (cm) s += tx(cx, wy + 23, cut(cm, 12), 's cm', 'middle', w - 4);
    return s;
  }
  if (el.t === 'CMP'){
    const on = mon && c.cond;
    s += wire(x, x + 3) + wire(x + w - 3, x + w);
    s += `<rect x="${x + 3}" y="${wy - 12}" width="${w - 6}" height="24" class="bx${on ? ' on' : ''}"/>`;
    s += tx(cx, wy - 2, DVP.opName(el.op, el.a), 's', 'middle', w - 10) + tx(cx, wy + 8.5, DVP.abs(el.a) + ' ' + DVP.cmpShow(el.a, el.b), 't', 'middle', w - 10);
    if (mon) s += tx(cx, wy + 23, DVP.abs(el.a) + '=' + (ENG.kind(el.a) === 'T' ? Math.round(e.num(el.a) * 10) : Math.round(e.num(el.a))), 's mv', 'middle', w - 4);
    return s;
  }
  if (el.t === 'OUT'){
    const v = mon && c.pin;
    s += wire(x, cx - 10) + wire(cx + 10, x + w);
    if (v) s += `<circle cx="${cx}" cy="${wy}" r="7" class="fl"/>`;
    s += `<path d="M${cx - 6} ${wy - 11}q-7 11 0 22M${cx + 6} ${wy - 11}q7 11 0 22" class="sy"/>`;
    s += tx(cx, wy - 15, DVP.abs(el.a), 'h', 'middle', w - 6);
    if (cm) s += tx(cx, wy + 23, cut(cm, 14), 's cm', 'middle', w - 4);
    return s;
  }
  /* application instructions: [ SET Y0 ] [ RST C0 ] [ TMR T0 K50 ] [ CNT C0 K6 ] */
  const mn = {S:'SET', R:'RST', TON:'TMR', CTU:'CNT', HSC:'DCNT'}[el.t] || el.t;
  const txt = mn + '  ' + DVP.abs(el.a) + (el.t === 'TON' ? '  K' + Math.round(el.pt * 10) : el.t === 'CTU' || el.t === 'HSC' ? '  K' + el.pv : '');
  const v = mon && c.pin, bx = x + 6, bw = w - 12;
  s += wire(x, bx) + wire(bx + bw, x + w);
  s += `<path d="M${bx + 5} ${wy - 11}h-5v22h5M${bx + bw - 5} ${wy - 11}h5v22h-5" class="sy${v ? ' onl' : ''}"/>`;
  if (v) s += `<rect x="${bx + 1}" y="${wy - 10}" width="${bw - 2}" height="20" class="fl2"/>`;
  s += tx(bx + bw / 2, wy + 4, txt, 't', 'middle', bw - 12);
  if (mon && el.t === 'TON'){ const t = e.T[el.a]; s += tx(bx + bw / 2, wy + 24, DVP.abs(el.a) + ' = ' + Math.round((t ? t.et : 0) * 10) + (t && t.q ? '  ●' : ''), 's mv', 'middle', bw); }
  else if (mon && (el.t === 'HSC' || (el.t === 'R' && ENG.kind(el.a) === 'HC'))) s += tx(bx + bw / 2, wy + 24, DVP.abs(el.a) + ' = ' + e.num(el.a), 's mv', 'middle', bw);
  else if (mon && el.t === 'CTU'){ const k = e.C[el.a]; s += tx(bx + bw / 2, wy + 24, DVP.abs(el.a) + ' = ' + (k && k.cv != null ? k.cv : 0) + (k && k.q ? '  ●' : ''), 's mv', 'middle', bw); }
  else if (cm) s += tx(bx + bw / 2, wy + 24, cut(cm, 18), 's cm', 'middle', bw);
  return s;
};

/* instruction list (IL), the way Delta users read programs in WPLSoft / ISPSoft */
DVP.il = function(prog){
  const out = [];
  const opnd = el => el.t === 'CMP' ? DVP.abs(el.a) + '  ' + DVP.cmpShow(el.a, el.b) : DVP.abs(el.a);
  const pre = {NO:['LD', 'AND', 'OR'], NC:['LDI', 'ANI', 'ORI'], P:['LDP', 'ANDP', 'ORP'], N:['LDF', 'ANDF', 'ORF']};
  const mnem = (el, pos) => el.t === 'CMP' ? (ENG.kind(el.a) === 'HC' ? 'D' : '') + ['LD', 'AND', 'OR'][pos] + (el.op === '==' ? '=' : el.op) : pre[el.t][pos];
  function gen(x){
    if (x.k === 'L') return [[mnem(x.el, 0), opnd(x.el)]];
    if (x.k === 'T') return [['LD', 'M1000']];
    let L = gen(x.a[0]);
    for (let i = 1; i < x.a.length; i++){ const y = x.a[i];
      if (y.k === 'L') L.push([mnem(y.el, x.k === 'and' ? 1 : 2), opnd(y.el)]);
      else L = L.concat(gen(y), [[x.k === 'and' ? 'ANB' : 'ORB', '']]); }
    return L;
  }
  const outI = el => el.t === 'OUT' ? ['OUT', DVP.abs(el.a)] : el.t === 'S' ? ['SET', DVP.abs(el.a)] : el.t === 'R' ? ['RST', DVP.abs(el.a)] : el.t === 'TON' ? ['TMR', DVP.abs(el.a) + '  K' + Math.round(el.pt * 10)] : el.t === 'CTU' ? ['CNT', DVP.abs(el.a) + '  K' + el.pv] : el.t === 'HSC' ? ['DCNT', DVP.abs(el.a) + '  K' + el.pv] : [el.t, DVP.abs(el.a)];
  prog.forEach((rg, i) => {
    const gs = rungGroups(rg);
    out.push({rung:i});
    if (!gs.length){ out.push({c:'(الرانج فاضي: مفيش خرج)'}); return; }
    gs.forEach(g => { if (!g.x){ out.push({c:'(الرانج ده فيه فروع متشابكة. بسّطه عشان يتحوّل لـ IL)'}); return; } gen(g.x).forEach(l => out.push({i:l[0], o:l[1]})); g.outs.forEach(el => { const l = outI(el); out.push({i:l[0], o:l[1]}); }); });
  });
  out.push({i:'END', o:''});
  return out;
};
DVP.lineEnd = () => '';

/* ================= Allen-Bradley CompactLogix · Studio 5000 style ================= */
const AB = BR.ab = {id:'ab', name:'Allen-Bradley', cpu:'1769-L33ER', WY:38, PADL:26, PADR:8, rrail:true, CW:64, CWO:116,
  rn: i => 'Rung ' + i, rnAr: i => iso('Rung ' + i)};
AB.base = function(a){
  const k = ENG.kind(a);
  if (k === 'I') return 'Local:1:I.Data.' + bitIdx(a);
  if (k === 'Q') return 'Local:2:O.Data.' + bitIdx(a);
  if (k === 'IW') return 'Local:3:I.Ch0Data';
  if (k === 'HC') return 'Local:4:I.Ch' + a.slice(2) + 'Count';
  return '';
};
/* high-speed counter card in slot 4: the count comes in as a DINT input tag, and an output bit resets it */
AB.hscReset = a => 'Enc_Reset';
AB.hscResetBase = a => 'Local:4:O.Ch' + String(a).slice(2) + 'Reset';
AB.tag = (T, a) => { const t = tagByA(T, a); return t ? t.n : AB.base(a) || a; };
AB.op = function(a, T){
  const k = ENG.kind(a);
  if (k === 'T' || k === 'C') return AB.tag(T, a) + '.DN';
  if (k === 'TB'){ const b = a.split('.'); return AB.tag(T, b[0]) + '.' + b[1]; }
  return AB.tag(T, a);
};
AB.abs = a => { const b = AB.base(a); return b ? '<' + b + '>' : ''; };
AB.sym = (a, T) => AB.op(a, T);
AB.short = (a, T) => AB.op(a, T);
AB.word = (a, T) => { const k = ENG.kind(a); return k === 'T' || k === 'C' ? AB.tag(T, a) + '.ACC' : AB.tag(T, a); };
AB.dtype = a => ({I:'BOOL', Q:'BOOL', M:'BOOL', T:'TIMER', C:'COUNTER', MW:'REAL', IW:'INT', HC:'DINT'}[ENG.kind(a)] || '');
AB.pal = [
  {id:'NO', t:'NO', mn:'XIC', ar:'Examine If Closed'}, {id:'NC', t:'NC', mn:'XIO', ar:'Examine If Open'}, {id:'ONS', t:'ONS', mn:'ONS', ar:'One Shot'}, {id:'CMP', t:'CMP', mn:'EQU/GRT…', ar:'مقارنة'},
  {id:'OUT', t:'OUT', mn:'OTE', ar:'Output Energize'}, {id:'S', t:'S', mn:'OTL', ar:'Output Latch'}, {id:'R', t:'R', mn:'OTU', ar:'Output Unlatch', acc:['Q', 'M']}, {id:'RES', t:'R', mn:'RES', ar:'Reset تايمر / عدّاد', acc:['T', 'C']},
  {id:'TON', t:'TON', mn:'TON', ar:'Timer On Delay'}, {id:'TOF', t:'TOF', mn:'TOF', ar:'Timer Off Delay'}, {id:'RTO', t:'RTO', mn:'RTO', ar:'Retentive Timer On'}, {id:'CTU', t:'CTU', mn:'CTU', ar:'Count Up'}, {id:'CTD', t:'CTD', mn:'CTD', ar:'Count Down'}, {id:'SCL', t:'SCL', mn:'SCP', ar:'Scale w/ Parameters'},
  {id:'HRS', t:'R', mn:'OTE Enc_Reset', ar:'تصفير كارت العدّاد السريع', acc:['HC'], hsc:true}];
AB.idOf = el => el.t === 'R' && (ENG.kind(el.a) === 'T' || ENG.kind(el.a) === 'C') ? 'RES' : el.t === 'R' && ENG.kind(el.a) === 'HC' ? 'HRS' : el.t;
AB.help = {NO:'XIC: بيوصّل لما البت = 1', NC:'XIO: بيوصّل لما البت = 0', ONS:'ONS: بيعدّي سكان واحد بس لما الشرط اللي قبله يبقى true. محتاج Tag بت تخزين (Storage bit)', CMP:'EQU = · NEQ ≠ · GRT > · GEQ ≥ · LES < · LEQ ≤ (Source A مع Source B). بتشتغل على DINT زي عدّ الإنكودر',
  HRS:'OTE على بت الـ Reset بتاع كارت العدّاد السريع (Local:4:O.Ch0Reset): طول ما الرانج true العدّ بيتصفّر',
  OUT:'OTE: البت = حالة الرانج', S:'OTL: يمسك البت 1 (Latch)', R:'OTU: يفك البت 0 (Unlatch)', RES:'RES: يصفّر الـ ACC وبتات التايمر أو العدّاد',
  TON:'TON: الـ DN بيبقى 1 بعد ما الـ ACC يوصل الـ Preset (بالملّي ثانية). EN = الرانج true، TT = بيعدّ', TOF:'TOF: الـ DN بيفضل 1 لمدة الـ Preset بعد ما الرانج يبقى false', RTO:'RTO: زي TON بس الـ ACC مش بيتصفّر لما الرانج يقع، لازم RES',
  CTU:'CTU: الـ ACC بيزيد مع كل false ← true، و DN = 1 لما ACC ≥ Preset. بيتصفّر بـ RES', CTD:'CTD: بينقّص الـ ACC من نفس الـ COUNTER (مع CTU عشان عدّ طالع ونازل)', SCL:'SCP: يحوّل القيمة من مدى الدخل (Input Min/Max) للمدى الحقيقي (Scaled Min/Max)'};
AB.pt = {lab:'Preset (ms)', get:pt => Math.round(pt * 1000), set:v => Math.max(1, Math.round(v)) / 1000, show:pt => String(Math.round(pt * 1000)), step:100};
AB.pv = {lab:'Preset'};
AB.cmpShow = (a, b) => ENG.kind(a) === 'T' ? String(Math.round(b * 1000)) : ENG.kind(a) === 'MW' ? nfmt(b, 1) : String(b);
AB.cmpGet = (a, b) => ENG.kind(a) === 'T' ? Math.round(b * 1000) : b;
AB.cmpSet = (a, v) => ENG.kind(a) === 'T' ? v / 1000 : v;
AB.cmpLab = a => ENG.kind(a) === 'T' ? 'Source B (ms)' : 'Source B';
const ABOP = {'==':'EQU', '<>':'NEQ', '>':'GRT', '>=':'GEQ', '<':'LES', '<=':'LEQ'};
AB.opName = op => ABOP[op] || op;
AB.parse = function(str, acc, T){
  let s = String(str || '').trim();
  if (!s) return {err:'اكتب اسم Tag.'};
  let m, a = null;
  if ((m = /^Local:1:I\.Data\.(\d{1,2})$/i.exec(s))) a = bitOf('I', +m[1]);
  else if ((m = /^Local:2:O\.Data\.(\d{1,2})$/i.exec(s))) a = bitOf('Q', +m[1]);
  else if (/^Local:3:I\.Ch0Data$/i.test(s)) a = 'IW64';
  else if ((m = /^Local:4:I\.Ch(\d)Count$/i.exec(s))) a = 'HC' + m[1];
  else if (acc.indexOf('HC') >= 0 && ((m = /^Local:4:O\.Ch(\d)Reset$/i.exec(s)) || /^Enc_Reset$/i.test(s))) a = 'HC' + (m ? m[1] : 0);
  else {
    const mm = /^(.*?)(?:\.(DN|TT|EN|ACC|PRE))?$/i.exec(s), tg = tagByN(T, mm[1]), suf = (mm[2] || '').toUpperCase();
    if (!tg) return {err:`مفيش Tag اسمه ${iso(s)} في Controller Tags. في Logix لازم تعمل الـ Tag الأول (New Tag) أو تختار واحد موجود.`};
    const k = ENG.kind(tg.a);
    if ((k === 'T' || k === 'C') && (suf === 'TT' || suf === 'EN')){ if (k === 'C') return {err:'العدّاد فيه DN بس هنا.'}; a = tg.a + '.' + suf; }
    else a = tg.a;
  }
  const k = ENG.kind(a);
  if (acc.indexOf(k) < 0) return {err:`${iso(s)} نوعه ${iso(AB.dtype(a.split('.')[0]))} ومينفعش مع التعليمة دي.`};
  return {a};
};
/* Logix tag names: letters, digits and _ ; start with a letter or _ ; up to 40 characters; no double __ */
AB.newTag = function(name, ty, T, prog){
  name = String(name || '').trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]{0,39}$/.test(name) || /__/.test(name) || /_$/.test(name)) return {err:'اسم الـ Tag: حروف إنجليزي وأرقام و _ بس، يبدأ بحرف، ومن غير مسافات (زي ' + iso('Star_TMR') + ').'};
  if (tagByN(T, name)) return {err:'فيه Tag بنفس الاسم.'};
  const a = freeAddr(ty === 'TIMER' ? 'T' : ty === 'COUNTER' ? 'C' : 'M', prog, T);
  if (!a) return {err:'مفيش مكان.'};
  return {tag:{n:name, a, c:'', u:1}};
};
AB.newInst = () => null;

AB.cellH = el => !el ? 66 : el.t === 'SCL' ? 128 : ['TON', 'TOF', 'RTO', 'CTU', 'CTD'].indexOf(el.t) >= 0 ? 92 : el.t === 'CMP' ? 90 : 66;
AB.icon = function(id){
  const L = '<path d="M2 12h12M26 12h12"/>', P = '<path d="M14 4v16M11 4h3M11 20h3M26 4v16M26 4h3M26 20h3"/>', Cc = '<path d="M2 12h10M28 12h10"/><path d="M15 4q-5 8 0 16M25 4q5 8 0 16"/>';
  const box = s => `<rect x="4" y="2" width="32" height="20" rx="1"/><text x="20" y="15.5" text-anchor="middle" class="ic-t">${s}</text>`;
  return `<svg viewBox="0 0 40 24" class="bx-ic" aria-hidden="true">${({NO:L + P, NC:L + P + '<path d="M12 20L28 4"/>', ONS:box('ONS'), CMP:box('GEQ'), HRS:Cc.replace('M2 12h10M28 12h10', 'M2 12h10M28 12h10') + '<text x="20" y="15" text-anchor="middle" class="ic-t" font-size="6.5">RST</text>', OUT:Cc, S:Cc + '<text x="20" y="16" text-anchor="middle" class="ic-t">L</text>', R:Cc + '<text x="20" y="16" text-anchor="middle" class="ic-t">U</text>', RES:'<path d="M2 12h6M32 12h6"/><path d="M11 4q-5 8 0 16M29 4q5 8 0 16"/><text x="20" y="15" text-anchor="middle" class="ic-t" font-size="7">RES</text>', SCL:box('SCP')})[id] || box(id)}</svg>`;
};
AB.cell = function(c){
  const {x, w, wy, el, mon, e, T} = c, cx = x + w / 2;
  const wire = (x1, x2) => `<path d="M${x1} ${wy}H${x2}" class="w"/>`;
  let s = '';
  if (el.t === 'W') return wire(x, x + w);
  const lab = (a, y1) => tx(cx, y1, AB.op(a, T), 't', 'middle', w - 4) + (AB.base(a) && tagByA(T, a) ? tx(cx, wy + 23, AB.abs(a), 's al', 'middle', w - 2) : '');
  if (el.t === 'NO' || el.t === 'NC'){
    const on = mon && c.cond;
    s += wire(x, cx - 8) + wire(cx + 8, x + w);
    if (on) s += `<rect x="${cx - 12}" y="${wy - 12}" width="24" height="24" rx="2" class="fl"/>`;
    s += `<path d="M${cx - 8} ${wy - 10}V${wy + 10}M${cx - 8} ${wy - 10}h-3M${cx - 8} ${wy + 10}h-3M${cx + 8} ${wy - 10}V${wy + 10}M${cx + 8} ${wy - 10}h3M${cx + 8} ${wy + 10}h3" class="sy"/>`;
    if (el.t === 'NC') s += `<path d="M${cx - 6} ${wy + 9}L${cx + 6} ${wy - 9}" class="sy"/>`;
    return s + lab(el.a, wy - 16);
  }
  if (el.t === 'ONS'){
    const on = mon && c.cond;
    s += wire(x, cx - 14) + wire(cx + 14, x + w);
    s += `<rect x="${cx - 14}" y="${wy - 9}" width="28" height="18" rx="1" class="bx${on ? ' on' : ''}"/>` + tx(cx, wy + 3.5, 'ONS', 'b', 'middle');
    return s + tx(cx, wy - 16, AB.tag(T, el.a), 't', 'middle', w - 4);
  }
  if (el.t === 'CMP'){
    const on = mon && c.cond, bx = x + 3, bw = w - 6, top = wy - 14;
    s += wire(x, bx) + wire(bx + bw, x + w);
    s += `<rect x="${bx}" y="${top}" width="${bw}" height="62" rx="1" class="bx${on ? ' on' : ''}"/>`;
    s += tx(bx + 4, top + 10, AB.opName(el.op), 'b') ;
    s += tx(bx + 4, top + 22, 'Source A', 's dim') + tx(bx + bw - 3, top + 31, AB.word(el.a, T), 's', 'end', bw - 6);
    if (mon) s += tx(bx + bw - 3, top + 40, AB.cmpShow(el.a, e.num(el.a)), 's mv', 'end', bw - 6);
    s += tx(bx + 4, top + 50, 'Source B', 's dim') + tx(bx + bw - 3, top + 59, AB.cmpShow(el.a, el.b), 's', 'end', bw - 6);
    return s;
  }
  if (el.t === 'R' && ENG.kind(el.a) === 'HC'){
    /* OTE on the counter card's reset bit */
    const v = mon && c.pin, r = 8;
    s += wire(x, cx - r - 4) + wire(cx + r + 4, x + w);
    if (v) s += `<rect x="${cx - r - 4}" y="${wy - 12}" width="${2 * r + 8}" height="24" rx="3" class="fl"/>`;
    s += `<path d="M${cx - r} ${wy - 11}q-6 11 0 22M${cx + r} ${wy - 11}q6 11 0 22" class="sy"/>`;
    return s + tx(cx, wy - 16, AB.hscReset(el.a), 't', 'middle', w - 4) + tx(cx, wy + 23, '<' + AB.hscResetBase(el.a) + '>', 's al', 'middle', w - 2);
  }
  if (el.t === 'OUT' || el.t === 'S' || el.t === 'R'){
    const v = mon && c.pin, res = el.t === 'R' && (ENG.kind(el.a) === 'T' || ENG.kind(el.a) === 'C');
    const r = res ? 13 : 8;
    s += wire(x, cx - r - 4) + wire(cx + r + 4, x + w);
    if (v) s += `<rect x="${cx - r - 4}" y="${wy - 12}" width="${2 * r + 8}" height="24" rx="3" class="fl"/>`;
    s += `<path d="M${cx - r} ${wy - 11}q-6 11 0 22M${cx + r} ${wy - 11}q6 11 0 22" class="sy"/>`;
    if (el.t !== 'OUT') s += tx(cx, wy + 3.5, res ? 'RES' : el.t === 'S' ? 'L' : 'U', res ? 's' : 'b', 'middle');
    return s + (res ? tx(cx, wy - 16, AB.tag(T, el.a), 't', 'middle', w - 4) : lab(el.a, wy - 16));
  }
  /* output blocks */
  const bx = x + 4, bw = w - 30, top = wy - 14;
  const isT = el.t === 'TON' || el.t === 'TOF' || el.t === 'RTO';
  const tm = isT && e ? e.T[el.a] : null, ct = (el.t === 'CTU' || el.t === 'CTD') && e ? e.C[el.a] : null;
  const hdr = {TON:'Timer On Delay', TOF:'Timer Off Delay', RTO:'Retentive Timer On', CTU:'Count Up', CTD:'Count Down', SCL:'Scale w/ Parameters'}[el.t];
  const mn = el.t === 'SCL' ? 'SCP' : el.t;
  const bh = el.t === 'SCL' ? 104 : 68;
  s += wire(x, bx);
  s += `<rect x="${bx}" y="${top}" width="${bw}" height="${bh}" rx="1" class="bx${mon && c.pin ? ' en' : ''}"/>`;
  s += tx(bx + 4, top + 10, mn, 'b') + tx(bx + bw - 3, top + 10, hdr, 's dim', 'end', bw - 30);
  const row = (i, k, v) => tx(bx + 4, top + 23 + i * 12, k, 's dim') + tx(bx + bw - 3, top + 23 + i * 12, v, 's', 'end', bw - 42);
  const bub = (yy, n, on) => `<path d="M${bx + bw} ${yy}h4" class="w"/><rect x="${bx + bw + 4}" y="${yy - 6}" width="20" height="12" rx="6" class="bb${on ? ' on' : ''}"/>` + tx(bx + bw + 14, yy + 3, n, 's', 'middle');
  if (isT){
    s += row(0, 'Timer', AB.tag(T, el.a)) + row(1, 'Preset', String(Math.round(el.pt * 1000))) + row(2, 'Accum', mon ? String(Math.round((tm ? tm.et : 0) * 1000)) : '0');
    s += bub(wy, 'EN', mon && !!(tm && tm.pin)) + bub(wy + 22, 'DN', mon && !!(tm && tm.q));
    if (mon) s += tx(bx + bw - 3, top + 47, '', 's');
    return s;
  }
  if (el.t === 'CTU' || el.t === 'CTD'){
    s += row(0, 'Counter', AB.tag(T, el.a)) + row(1, 'Preset', String(el.pv)) + row(2, 'Accum', mon ? String(ct && ct.cv != null ? ct.cv : 0) : '0');
    s += bub(wy, el.t === 'CTU' ? 'CU' : 'CD', mon && !!c.pin) + bub(wy + 22, 'DN', mon && !!(ct && ct.q));
    return s;
  }
  if (el.t === 'SCL'){
    const r0 = el.rhi != null ? el.rlo : 0, r1 = el.rhi != null ? el.rhi : ENG.RAWMAX;
    s += row(0, 'Input', AB.tag(T, el.a)) + (mon ? tx(bx + bw - 3, top + 32, String(Math.round(e.num(el.a))), 's mv', 'end') : '');
    s += row(1.8, 'Input Min', String(r0)) + row(2.8, 'Input Max', String(r1)) + row(3.8, 'Scaled Min', nfmt(el.lo, 1)) + row(4.8, 'Scaled Max', nfmt(el.hi, 1)) + row(5.8, 'Output', AB.tag(T, el.o));
    if (mon) s += tx(bx + bw - 3, top + 102, nfmt(e.num(el.o), 2), 's mv', 'end');
    return s;
  }
  return s;
};
/* Studio 5000 rung text (neutral text) */
AB.rungText = function(rg, T){
  const one = el => { const t = AB.tag(T, el.a);
    switch (el.t){
      case 'NO': return `XIC(${AB.op(el.a, T)})`; case 'NC': return `XIO(${AB.op(el.a, T)})`; case 'ONS': return `ONS(${t})`;
      case 'CMP': return `${AB.opName(el.op)}(${AB.word(el.a, T)},${AB.cmpShow(el.a, el.b)})`;
      case 'OUT': return `OTE(${AB.op(el.a, T)})`; case 'S': return `OTL(${AB.op(el.a, T)})`; case 'R': return ENG.kind(el.a) === 'T' || ENG.kind(el.a) === 'C' ? `RES(${t})` : ENG.kind(el.a) === 'HC' ? `OTE(${AB.hscReset(el.a)})` : `OTU(${AB.op(el.a, T)})`;
      case 'TON': case 'TOF': case 'RTO': return `${el.t}(${t},${Math.round(el.pt * 1000)},0)`;
      case 'CTU': case 'CTD': return `${el.t}(${t},${el.pv},0)`;
      case 'SCL': return `SCP(${t},${el.rhi != null ? el.rlo : 0},${el.rhi != null ? el.rhi : ENG.RAWMAX},${el.lo},${el.hi},${AB.tag(T, el.o)})`;
    } return '';
  };
  const ex = x => x.k === 'L' ? one(x.el) : x.k === 'T' ? '' : x.k === 'and' ? x.a.map(ex).join('') : '[' + x.a.map(ex).join(' ,') + ' ]';
  const gs = rungGroups(rg);
  if (!gs.length) return 'NOP();';
  if (gs.some(g => !g.x)) return '…';
  const part = g => ex(g.x) + (g.outs.length > 1 ? '[' + g.outs.map(one).join(' ,') + ' ]' : one(g.outs[0]));
  return (gs.length > 1 ? '[' + gs.map(part).join(' ,') + ' ]' : part(gs[0])) + ';';
};
AB.lineEnd = () => '';

/* ================= the brand simulator UI: scenario · machine · CPU faceplate · vendor-style editor · auto-check ================= */
const LV = {1:['سهل', 'lv1'], 2:['متوسط', 'lv2'], 3:['صعب', 'lv3'], 4:['تحدّي المصنع', 'lv4'], 5:['تربل شوتنج', 'lv5']};
const ICO = {
  compile:'<path d="M4 12l5 5L20 6"/>', dl:'<path d="M12 3v11M7 10l5 5 5-5M4 19h16"/>', ul:'<path d="M4 12h12M12 7l5 5-5 5M20 4v16"/>', online:'<path d="M7 7l10 10M5 12a7 7 0 0 1 7-7M19 12a7 7 0 0 1-7 7"/><circle cx="12" cy="12" r="2"/>',
  mon:'<circle cx="7" cy="14" r="4"/><circle cx="17" cy="14" r="4"/><path d="M11 14h2M3 14l2-7h3M21 14l-2-7h-3"/>', run:'<path d="M7 5l12 7-12 7z"/>', stop:'<rect x="6" y="6" width="12" height="12" rx="1"/>'
};
const ico = k => `<svg viewBox="0 0 24 24" class="tb-ic" aria-hidden="true">${ICO[k]}</svg>`;
/* tag-table order: inputs, outputs, memory, timers, counters, words, high-speed counter last */
const ordK = a => { const k = ENG.kind(a) || ''; return k === 'HC' ? 99 : 'IQMTCIWMW'.indexOf(k[0]); };

PL.brandSim = function(host, cfg){
  const B = BR[cfg.brand], exs = cfg.exercises, PFX = cfg.brand, LES = cfg.lesson;
  /* lesson mode (PL.lessonSim): progress goes to the course store, programs are kept per lesson */
  const PS0 = progStore(cfg.brand), PS = LES ? {get:k => PS0.get('L/' + LES + '/' + k), set:(k, v) => PS0.set('L/' + LES + '/' + k, v)} : PS0;
  const isDone = x => LES ? PL.has(LES, x.key) : PL.px.has(PFX + '/' + x.key);
  const AR = B.id === 'ab', DV = B.id === 'dvp', SI = B.id === 'sie';
  let k = 0, ex, cols, prog, T, plcStr = null, mode = 'STOP', key = 'REM', online = false, monOn = true, e, plantSt, sel = null, tab = 'lad', backup = null, rdT = 0, acc = 0, faceSig = '', newTagOpen = false, demo = null;
  const fails = {}, forces = {}, pressed = {};
  const P = () => PL.plants[ex.plant || 'loads'];
  const xk = () => PFX + '/' + ex.key;

  host.classList.add('bx', 'bx-' + B.id);
  const tabsHtml = `<button type="button" class="bt" data-tab="lad" aria-pressed="true">${SI ? 'Main [OB1]' : DV ? 'Ladder' : 'MainRoutine'}</button><button type="button" class="bt" data-tab="tags">${SI ? 'PLC tags' : DV ? 'Device comments' : 'Controller Tags'}</button>${DV ? '<button type="button" class="bt" data-tab="il">IL</button>' : ''}<button type="button" class="bt" data-tab="frc">${SI ? 'Force table' : DV ? 'Force' : 'I/O Forces'}</button>`;
  const tools = SI ? `<button type="button" class="btn tb" data-a="compile">${ico('compile')}Compile</button><button type="button" class="btn tb pri" data-a="dl">${ico('dl')}Download to device</button><button type="button" class="btn tb" data-a="online" aria-pressed="false">${ico('online')}<span>Go online</span></button><button type="button" class="btn tb" data-a="mon" aria-pressed="false">${ico('mon')}Monitoring</button><button type="button" class="btn tb" data-a="run">${ico('run')}RUN</button><button type="button" class="btn tb" data-a="stop">${ico('stop')}STOP</button>`
    : DV ? `<button type="button" class="btn tb" data-a="compile">${ico('compile')}Compile</button><button type="button" class="btn tb pri" data-a="dl">${ico('ul')}Write to PLC</button><button type="button" class="btn tb" data-a="mon" aria-pressed="false">${ico('mon')}Ladder Monitor</button><button type="button" class="btn tb" data-a="run">${ico('run')}RUN</button><button type="button" class="btn tb" data-a="stop">${ico('stop')}STOP</button>`
    : `<button type="button" class="btn tb" data-a="compile">${ico('compile')}Verify</button><button type="button" class="btn tb" data-a="online" aria-pressed="false">${ico('online')}<span>Go Online</span></button><button type="button" class="btn tb pri" data-a="dl">${ico('dl')}Download</button><button type="button" class="btn tb" data-a="run">${ico('run')}Run Mode</button><button type="button" class="btn tb" data-a="stop">${ico('stop')}Program Mode</button>`;
  const hwCtl = DV ? `<div class="bx-sw" role="group" aria-label="سويتش RUN/STOP على الـ PLC"><span>سويتش الـ PLC:</span><button type="button" class="btn sm" data-sw="RUN" aria-pressed="false">RUN</button><button type="button" class="btn sm" data-sw="STOP" aria-pressed="true">STOP</button></div>`
    : AR ? `<div class="bx-sw" role="group" aria-label="مفتاح الكنترولر"><span>المفتاح:</span><button type="button" class="btn sm" data-key="RUN" aria-pressed="false">RUN</button><button type="button" class="btn sm" data-key="REM" aria-pressed="true">REM</button><button type="button" class="btn sm" data-key="PROG" aria-pressed="false">PROG</button></div>`
    : `<p class="bx-hwn muted">الـ ${iso('S7-1200')} مالوش سويتش RUN/STOP: بيتشغّل ويتوقف من TIA وانت Online، أو لوحده بعد الـ Download.</p>`;
  host.innerHTML = `
    <nav class="bx-list" aria-label="التمارين"></nav>
    <div class="bx-prog"></div>
    <article class="bx-scn" aria-live="polite"></article>
    <div class="bx-stage">
      <section class="bx-mach" aria-label="الماكينة"><div class="bx-h"><b>الماكينة</b><span class="bx-tag">Field</span></div><div class="bx-plant"></div><div class="bx-pctl"></div><div class="bx-io" role="group" aria-label="الزراير والحساسات"></div></section>
      <section class="bx-hw" aria-label="الـ PLC"><div class="bx-h"><b dir="ltr">${esc(B.cpu)}</b><span class="bx-mode"></span></div><div class="bx-face"></div>${hwCtl}</section>
    </div>
    <section class="bx-ide" aria-label="برنامج الـ PLC">
      <div class="bx-title" dir="ltr"></div>
      <div class="bx-tools" dir="ltr">${tools}</div>
      <div class="bx-stat" aria-live="polite"></div>
      <div class="bx-tabs" dir="ltr" role="group" aria-label="التبويبات">${tabsHtml}</div>
      <div class="bx-pane bx-lad" data-p="lad"></div>
      <div class="bx-pane bx-tags" data-p="tags" hidden></div>
      ${DV ? '<div class="bx-pane bx-il" data-p="il" hidden></div>' : ''}
      <div class="bx-pane bx-frc" data-p="frc" hidden></div>
      <div class="bx-ladt"><button type="button" class="btn sm" data-t="add">+ ${SI ? 'Network' : AR ? 'Rung' : 'رانج'} جديد</button></div>
      <div class="bx-lint" aria-live="polite"></div>
    </section>
    <div class="bx-chk"><button type="button" class="btn pri big" data-t="chk">✓ اختبر البرنامج</button><button type="button" class="btn" data-t="hint" hidden>تلميح</button><button type="button" class="btn" data-t="sol" hidden>شوف الحل</button><button type="button" class="btn" data-t="reset">ابدأ من الأول</button><button type="button" class="btn" data-t="undo" hidden>رجّع برنامجي</button></div>
    <div class="bx-res" aria-live="polite" hidden></div>
    <div class="bx-hint box" hidden></div>`;
  const q = s => $(s, host);
  const XL = s => LES ? ('>' + String(s) + '<').replace(/>([^<]+)</g, (m, t) => '>' + t.replace(ARX, a => `<bdi dir="ltr">${esc(B.short(a, T))}</bdi>`) + '<').slice(1, -1) : s;
  const listBox = q('.bx-list'), progBox = q('.bx-prog'), scn = q('.bx-scn'), plantBox = q('.bx-plant'), pctl = q('.bx-pctl'), ioBox = q('.bx-io'), face = q('.bx-face'), modeTag = q('.bx-mode');
  const titleBar = q('.bx-title'), toolBox = q('.bx-tools'), stat = q('.bx-stat'), lad = q('.bx-lad'), tagsBox = q('.bx-tags'), ilBox = q('.bx-il'), frcBox = q('.bx-frc'), lintBox = q('.bx-lint');
  const resBox = q('.bx-res'), hintBox = q('.bx-hint'), ide = q('.bx-ide');
  /* «💡 الخطوة الجاية» (PL.nextStep + /assets/next-hint.js): one line above the ladder; off in the factory challenges (level 4) */
  const nhCtl = window.NH && PL.nextStep ? NH.mount(lad, {course:'plc'}) : null;
  let nhPrev = null, nhLast = null; const nhCk = {k:null, r:null};
  function nhCheck(){ const kk = JSON.stringify(ENG.serialize(prog)); if (nhCk.k !== kk){ nhCk.k = kk; const r = (ex.cases || [{steps:ex.tests || []}]).map(c => ENG.check(prog, {io:ex.io, plant:ex.plant, plantOpt:Object.assign({}, ex.plantOpt || {}, c.plantOpt || {}), tests:c.steps}, {cols})).find(x => !x.ok) || {ok:true}; nhCk.r = r.ok ? r : {ok:false, msg:xlate(B, T, r.msg)}; } return nhCk.r; }
  function nhUpdate(){
    if (!nhCtl) return;
    const cur = ENG.serialize(prog);
    if (nhPrev && nhPrev.ex === ex && nhPrev.p.length === cur.length) cur.forEach((rg, i) => rg.rows.forEach((row, r) => row.forEach((t, c) => { const o = ((nhPrev.p[i].rows[r] || [])[c]) || ''; if (t !== o && t && t !== '-') nhLast = {i, r, c}; })));
    else if (!nhPrev || nhPrev.ex !== ex) nhLast = null;
    nhPrev = {ex, p:cur};
    if (demo || ex.lvl === 4){ nhCtl.set(null); return; }
    const io = (ex.io.inputs || []).concat(ex.io.outputs || []);
    PL.nhLadder(nhCtl, PL.nextStep(prog, ex, {cols, last:nhLast, disp:a => B.short(a, T), box:a => AB && B.id === 'ab' ? AB.tag(T, a) : B.short(a, T), lab:a => (io.find(x => x.a === a) || {}).label, btn:q('[data-t=chk]').textContent.replace('✓', '').trim(), check:nhCheck}), lad, q('.bx-ladt [data-t=add]'), '.hit');
  }

  /* ---------- engine / modes ---------- */
  const defIn = i => i.kind === 'pbnc' || i.kind === 'ncsw' || i.def ? 1 : 0;
  const physFor = i => i.kind === 'pb' || i.kind === 'pbnc' ? (pressed[i.a] ? 1 - defIn(i) : defIn(i)) : i.kind === 'auto' || i.kind === 'enc' ? null : (i.state != null ? i.state : defIn(i));
  function fresh(){
    e = new ENG.Engine(plcStr ? JSON.parse(plcStr) : [], {cols});
    e.force = Object.assign({}, forces);
    (ex.io.inputs || []).forEach(i => { const v = physFor(i); if (v != null) e.setIn(i.a, v); });
    if (plantSt) P().step(plantSt, e, 0);
  }
  const same = () => plcStr != null && plcStr === JSON.stringify(ENG.serialize(prog));
  const monitoring = () => !demo && mode === 'RUN' && same() && (SI ? online && monOn : DV ? monOn : online);
  function setMode(m){
    if (m === mode) return;
    mode = m;
    if (m === 'RUN') fresh(); else { e.out = {}; e.Q = {}; e.pw = e.prog.map(() => null); Object.keys(e.force).forEach(a => { if (ENG.kind(a) === 'Q') e.out[a] = e.force[a]; }); }
    renderAll();
  }

  /* ---------- exercise list + scenario ---------- */
  function renderList(){
    listBox.innerHTML = exs.map((x, j) => { const d = isDone(x); return `<button type="button" class="bx-it${d ? ' done' : ''}${x.lvl === 4 ? ' ch' : ''}" data-k="${j}" aria-pressed="${j === k}"><span class="n">${d ? '✓' : x.lvl === 4 ? '★' : j + 1}</span><span class="t">${esc(x.title)}</span></button>`; }).join('');
    listBox.hidden = !!LES && exs.length < 2; progBox.hidden = !!LES;
    const n = exs.filter(isDone).length, pct = Math.round(n / exs.length * 100);
    progBox.innerHTML = `<span>خلّصت <b>${n} من ${exs.length}</b> تمارين</span><span class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="التقدّم ${pct}%"><i style="width:${pct}%"></i></span>`;
  }
  function ioRows(){
    const kindAr = i => ({pb:'زرار NO', pbnc:'زرار متوصّل NC', sw:'سويتش', sensor:'حساس', ncsw:'متوصّل NC', auto:'حساس على الماكينة', enc:'إنكودر (للعدّاد السريع)'}[i.kind] || '');
    const outAr = o => ({motor:'موتور', fan:'مروحة', horn:'سارينة', valve:'بلف', heater:'سخان', lamp:'لمبة', vfd:'دخل إنفرتر', brake:'فرامل الموتور'}[o.kind] || 'كونتاكتور / حمل');
    const row = (a, lab, kd) => { const t = tagByA(T, a); return `<tr><td class="mono">${esc(SI ? SIE.abs(a) : DV ? DVP.abs(a) : AB.base(a) || a)}</td><td class="mono">${esc(t ? (DV ? t.c : t.n) : '—')}</td><td>${esc(lab)}</td><td class="muted">${esc(kd)}</td></tr>`; };
    let h = (ex.io.inputs || []).map(i => row(i.a, i.label, kindAr(i))).join('') + (ex.io.outputs || []).map(o => row(o.a, o.label, outAr(o))).join('');
    (ex.syms || []).forEach(s => { h += row(s.a, s.label, s.kind || ''); });
    return `<div class="tblw"><table class="tbl bx-iot"><thead><tr><th>${SI ? 'Address' : DV ? 'Device' : 'Address'}</th><th>${SI ? 'Tag' : DV ? 'Comment' : 'Tag'}</th><th>الجهاز</th><th>النوع</th></tr></thead><tbody>${h}</tbody></table></div>`;
  }
  function renderScn(){
    const lv = LV[ex.lvl] || LV[1], d = isDone(ex);
    if (LES){
      scn.className = 'bx-scn bx-les' + (d ? ' ok' : '');
      scn.innerHTML = `${exs.length > 1 || d ? `<div class="bx-scn-h">${exs.length > 1 ? `<span class="muted">تمرين ${exs.indexOf(ex) + 1} من ${exs.length}</span>` : ''}${d ? '<span class="bx-done">✓ خلّصته</span>' : ''}</div>` : ''}
        <h3>${esc(ex.title)}</h3><div class="bx-task">${XL(ex.task)}</div>
        <details class="bx-iod"><summary>جدول الـ I/O بعناوين ${esc(B.name)}</summary>${ioRows()}</details>`;
      return;
    }
    scn.className = 'bx-scn ' + lv[1] + (d ? ' ok' : '');
    scn.innerHTML = `<div class="bx-scn-h"><span class="bx-lv">${lv[0]}</span><span class="muted">تمرين ${exs.indexOf(ex) + 1} من ${exs.length}</span>${d ? '<span class="bx-done">✓ خلّصته</span>' : ''}</div>
      <h3>${esc(ex.title)}</h3><p class="bx-story">${ex.story || ''}</p>
      ${ex.skills ? `<div class="bx-skills">${ex.skills.map(s => `<span>${s}</span>`).join('')}</div>` : ''}
      <div class="bx-task">${Array.isArray(ex.task) ? `<b>المطلوب:</b><ol class="bx-req">${ex.task.map(t => `<li>${t}</li>`).join('')}</ol>` : ex.task}</div>
      <details class="bx-iod"${ex.lvl <= 2 ? ' open' : ''}><summary>جدول الـ I/O والـ Tags</summary>${ioRows()}</details>`;
  }

  /* ---------- select exercise ---------- */
  function select(j){
    if (demo) PL.preview.stop();
    k = j; ex = exs[j]; cols = ex.cols || 5; sel = null; backup = null; newTagOpen = false;
    const saved = PS.get(ex.key);
    T = (ex.tags || []).map(t => Object.assign({}, t));
    if (saved && saved.t) saved.t.forEach(t => { if (!tagByA(T, t.a) && !tagByN(T, t.n)) T.push(Object.assign({u:1}, t)); });
    prog = ENG.program(saved && saved.p ? saved.p : ex.start || [ENG.serialize([ENG.blankRung(cols)])[0]], cols);
    if (!prog.length) prog = [ENG.blankRung(cols)];
    (ex.io.inputs || []).forEach(i => { i.state = defIn(i); pressed[i.a] = false; });
    Object.keys(forces).forEach(a => delete forces[a]);
    plcStr = null; mode = 'STOP'; online = false; monOn = SI ? false : true; if (AR) key = 'REM';
    plantSt = P().create(ex.plantOpt);
    fresh();
    resBox.hidden = true; hintBox.hidden = true; hintBox.innerHTML = XL(ex.hint || '');
    renderList(); renderScn(); renderIO(); pctlRender(); updChk(); setTab(tab === 'il' && !DV ? 'lad' : tab);
    msg(guide());
    renderAll(); nhUpdate();
    if (pvAd.refresh) pvAd.refresh();
  }
  function guide(){
    return SI ? `ابدأ: اكتب البرنامج تحت، وبعدين <b>Download to device</b> (الـ CPU بيبقى RUN لوحده)، ودوس <b>Monitoring</b> عشان تشوف الكهربا ماشية. وجرّب بالزراير اللي تحت الماكينة.`
      : DV ? `ابدأ: اكتب البرنامج، وبعدين <b>Write to PLC</b>، وحوّل سويتش الـ PLC لـ <b>RUN</b>، والـ <b>Ladder Monitor</b> بيوريك الكونتاكتات الشغالة.`
      : `ابدأ: اكتب البرنامج، وبعدين <b>Go Online</b> ← <b>Download</b> ← <b>Run Mode</b> (والمفتاح على REM) أو لف المفتاح على <b>RUN</b>.`;
  }
  function msg(h, cls){ stat.className = 'bx-stat' + (cls ? ' ' + cls : ''); stat.innerHTML = h; }
  function persist(){ PS.set(ex.key, {p:ENG.serialize(prog), t:T.filter(t => t.u).map(t => ({n:t.n, a:t.a, c:t.c || ''}))}); }
  function changed(){ persist(); renderLad(); renderLint(); renderTop(); if (tab === 'tags') renderTags(); if (tab === 'il') renderIL(); nhUpdate(); }

  /* ---------- I/O (field devices) ---------- */
  function renderIO(){
    const ins = (ex.io.inputs || []).filter(i => i.kind !== 'auto' && i.kind !== 'enc');
    ioBox.innerHTML = ins.map(i => { const kd = i.kind, isPb = kd === 'pb' || kd === 'pbnc', col = i.color || (kd === 'pbnc' ? 'red' : kd === 'pb' ? 'green' : 'gray');
      return `<button type="button" class="ib ib-${kd}" data-a="${i.a}" style="--cap:${PL.LCOL[col] || '#8a949b'}" aria-pressed="false" aria-label="${esc(i.label + ' ' + B.short(i.a, T))}${isPb ? ' (اضغط وسيب)' : ''}"><span class="cap" aria-hidden="true"></span><span class="l">${esc(i.label)}</span><span class="a">${esc(B.short(i.a, T))}${kd === 'pbnc' || kd === 'ncsw' ? ' · NC' : ''}</span></button>`; }).join('');
    ioBox.hidden = !ins.length; updIO();
  }
  function updIO(){ $$('.ib', ioBox).forEach(b => { const i = ex.io.inputs.find(x => x.a === b.dataset.a), kd = i.kind; const on = kd === 'pb' || kd === 'pbnc' ? !!pressed[i.a] : kd === 'ncsw' ? i.state === 0 : i.state === 1; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); }
  function press(a, v){
    const i = ex.io.inputs.find(x => x.a === a); if (!i) return;
    if (i.kind === 'pb' || i.kind === 'pbnc'){
      if (v){ pressed[a] = true; i._t = performance.now(); }
      else { const held = performance.now() - (i._t || 0); if (held < 150){ setTimeout(() => { pressed[a] = false; e.setIn(a, physFor(i)); updIO(); }, 150 - held); return; } pressed[a] = false; }
    } else i.state = i.state ? 0 : 1;
    e.setIn(a, physFor(i)); updIO();
  }
  ioBox.addEventListener('pointerdown', ev => { const b = ev.target.closest('.ib'); if (!b) return; const i = ex.io.inputs.find(x => x.a === b.dataset.a); if (i.kind === 'pb' || i.kind === 'pbnc'){ ev.preventDefault(); try { b.setPointerCapture(ev.pointerId); } catch (er){} press(i.a, true); } });
  const rel = ev => { const b = ev.target.closest('.ib'); if (!b) return; const i = ex.io.inputs.find(x => x.a === b.dataset.a); if ((i.kind === 'pb' || i.kind === 'pbnc') && pressed[i.a]) press(i.a, false); };
  ioBox.addEventListener('pointerup', rel); ioBox.addEventListener('pointercancel', rel); ioBox.addEventListener('lostpointercapture', rel);
  ioBox.addEventListener('click', ev => { const b = ev.target.closest('.ib'); if (!b) return; const i = ex.io.inputs.find(x => x.a === b.dataset.a); if (i.kind !== 'pb' && i.kind !== 'pbnc') press(i.a); else if (ev.detail === 0){ press(i.a, true); setTimeout(() => press(i.a, false), 400); } });
  ioBox.addEventListener('keydown', ev => { const b = ev.target.closest('.ib'); if (!b || ev.repeat || ev.key !== ' ') return; const i = ex.io.inputs.find(x => x.a === b.dataset.a); if (i.kind === 'pb' || i.kind === 'pbnc'){ ev.preventDefault(); press(i.a, true); } });
  ioBox.addEventListener('keyup', ev => { const b = ev.target.closest('.ib'); if (!b || ev.key !== ' ') return; const i = ex.io.inputs.find(x => x.a === b.dataset.a); if (i.kind === 'pb' || i.kind === 'pbnc') press(i.a, false); });
  ioBox.addEventListener('contextmenu', ev => ev.preventDefault());
  function pctlRender(){ const c = P().ctl || []; pctl.innerHTML = c.map(x => `<button type="button" class="btn sm" data-c="${x.id}">${esc(x.label(plantSt))}</button>`).join(''); pctl.hidden = !c.length; }
  pctl.addEventListener('click', ev => { const b = ev.target.closest('[data-c]'); if (!b) return; P().ctl.find(x => x.id === b.dataset.c).act(plantSt); pctlRender(); });

  /* ---------- faceplate + header ---------- */
  function renderFace(){
    const ins = {}; (ex.io.inputs || []).forEach(i => { const v = i.a in forces ? forces[i.a] : e.phys[i.a]; if (v) ins[i.a] = 1; });
    const outs = mode === 'RUN' || Object.keys(forces).length ? e.out : {};
    const st = {run:mode === 'RUN', frc:Object.keys(forces).length > 0, ins, outs, key, ana:!!ex.ana, online};
    const sig = JSON.stringify(st);
    if (sig !== faceSig){ faceSig = sig; face.innerHTML = PL.face[B.id](st); }
  }
  function renderTop(){
    const mon = monitoring(), diff = plcStr != null && !same();
    ide.classList.toggle('online', SI ? online : AR ? online : monOn);
    ide.classList.toggle('mon', mon);
    const abMode = !online ? 'Offline' : (key === 'RUN' ? 'Run' : key === 'PROG' ? 'Program' : mode === 'RUN' ? 'Rem Run' : 'Rem Prog');
    modeTag.textContent = AR ? abMode : mode; modeTag.className = 'bx-mode ' + (mode === 'RUN' ? 'run' : 'stp');
    if (SI) titleBar.innerHTML = `<span class="crumb">PLC_1 [${esc(B.cpu)}] › Program blocks › <b>Main [OB1]</b></span><span class="st ${online ? 'on' : ''}">${online ? 'Online' : 'Offline'}</span>`;
    else if (DV) titleBar.innerHTML = `<span class="crumb">${esc(B.cpu)} › <b>Ladder</b> · ${monOn ? 'Monitor' : 'Edit'}</span><span class="st ${mode === 'RUN' ? 'on' : ''}">PLC: ${mode}</span>`;
    else titleBar.innerHTML = `<span class="crumb">Controller › Tasks › MainTask › MainProgram › <b>MainRoutine</b></span><span class="st ${online ? 'on' : ''}">${abMode}</span><span class="st2">${Object.keys(forces).length ? 'Forces Enabled' : 'No Forces'} · ${diff ? 'Edits' : 'No Edits'}</span>`;
    const bt = a => toolBox.querySelector(`[data-a="${a}"]`);
    if (bt('online')){ bt('online').setAttribute('aria-pressed', online); bt('online').querySelector('span').textContent = online ? (SI ? 'Go offline' : 'Go Offline') : (SI ? 'Go online' : 'Go Online'); }
    if (bt('mon')) bt('mon').setAttribute('aria-pressed', SI ? online && monOn : monOn);
    if (SI){ bt('run').disabled = !online || mode === 'RUN'; bt('stop').disabled = !online || mode !== 'RUN'; }
    if (DV){ bt('run').disabled = mode === 'RUN'; bt('stop').disabled = mode !== 'RUN'; $$('[data-sw]', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.sw === mode)); }
    if (AR){ bt('dl').disabled = !online; bt('run').disabled = !online || key !== 'REM' || mode === 'RUN'; bt('stop').disabled = !online || key !== 'REM' || mode !== 'RUN'; $$('[data-key]', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.key === key)); }
    let note = '';
    if (diff) note = SI ? `البرنامج اللي على الشاشة مختلف عن اللي في الـ CPU: اعمل <b>Download to device</b> عشان التعديل يتنفّذ.` : DV ? `البرنامج اتعدّل بعد آخر كتابة: اعمل <b>Write to PLC</b> تاني.` : `فيه تعديل مش في الكنترولر: اعمل <b>Download</b> (والمفتاح REM أو PROG).`;
    else if (mode === 'RUN' && !mon && (SI ? !(online && monOn) : AR ? !online : !monOn)) note = SI ? `الـ CPU شغال RUN. دوس <b>Monitoring</b> عشان تشوف الكهربا جوه البرنامج.` : AR ? `الكنترولر شغال. اعمل <b>Go Online</b> عشان تشوف الرانجات شغالة.` : `الـ PLC شغال. شغّل <b>Ladder Monitor</b> عشان تشوف الكونتاكتات.`;
    const nb = q('.bx-note'); if (note){ if (nb) nb.innerHTML = note; else lad.insertAdjacentHTML('beforebegin', `<div class="bx-note">${note}</div>`); } else if (nb) nb.remove();
  }
  function renderPlant(){ plantBox.innerHTML = xlateSvg(B, T, P().svg(plantSt, e, ex)); }

  /* ---------- toolbar ---------- */
  function lint(){
    const out = [], coils = {}, inst = {};
    prog.forEach((rg, i) => rg.rows.forEach(row => row.forEach(el => {
      if (!el || el.t === 'W') return;
      const ent = B.pal.find(p => p.id === B.idOf(el)) || {}, mn = ent.mn || el.t, accp = ent.acc || ENG.accepts[el.t] || [];
      if (!el.a){ out.push({err:1, text:`${B.rnAr(i)}: ${iso(mn)} محتاج ${AR ? 'Tag' : 'عنوان'}.`}); return; }
      const kd = ENG.kind(el.a);
      if (accp.indexOf(kd) < 0){ out.push({err:1, text:`${B.rnAr(i)}: ${iso(B.short(el.a, T))} مينفعش مع ${iso(mn)}.`}); return; }
      if (el.t === 'OUT') (coils[el.a] = coils[el.a] || []).push(i);
      if (['TON', 'TOF', 'TP', 'RTO', 'CTU', 'CTD'].indexOf(el.t) >= 0) (inst[el.a] = inst[el.a] || []).push(i);
      if (el.t === 'SCL' && el.rhi != null && !(el.rhi > el.rlo)) out.push({err:1, text:`${B.rnAr(i)}: في الـ SCP لازم ${iso('Input Max')} يبقى أكبر من ${iso('Input Min')}.`});
    })));
    Object.keys(coils).forEach(a => { if (coils[a].length > 1) out.push({text:`${iso(B.short(a, T))} مكتوب كويل في أكتر من مكان (${coils[a].map(B.rnAr).join(' و ')}): آخر واحد بس هو اللي بيكسب (Double coil).`}); });
    Object.keys(inst).forEach(a => { const ts = []; prog.forEach(rg => rg.rows.forEach(row => row.forEach(el => { if (el && el.a === a && ['TON', 'TOF', 'TP', 'RTO'].indexOf(el.t) >= 0) ts.push(el.t); }))); if (ts.length > 1) out.push({text:`نفس التايمر ${iso(B.short(a, T))} مستخدم في أكتر من بلوك: كل تايمر لحاجة واحدة.`}); });
    return out;
  }
  function renderLint(){ const m = lint(); lintBox.innerHTML = m.length ? `<div class="box">${m.map(x => `<div class="${x.err ? 'er' : ''}">⚠ ${x.text}</div>`).join('')}</div>` : ''; }
  function download(){
    const errs = lint().filter(x => x.err);
    if (errs.length){ msg(`${SI ? 'Download canceled: compile errors.' : DV ? 'Write failed: syntax error.' : 'Download failed: verify errors.'} <br>${errs[0].text}`, 'bad'); return; }
    if (AR && !online){ msg('اعمل <b>Go Online</b> الأول: في Logix الـ Download بيتعمل وانت Online.', 'bad'); return; }
    if (AR && key === 'RUN'){ msg(`<span dir="ltr">Failed to download: controller keyswitch in RUN.</span><br>المفتاح على RUN: لفّه على <b>REM</b> أو <b>PROG</b> الأول.`, 'bad'); return; }
    plcStr = JSON.stringify(ENG.serialize(prog));
    if (SI){ mode = 'STOP'; setMode('RUN'); msg(`<span dir="ltr" class="con">Compiling… 0 errors · Loading to PLC_1… · Start modules after downloading ✓</span><br>البرنامج نزل والـ CPU رجع <b>RUN</b>. دوس <b>Monitoring</b> عشان تتابعه.`, 'ok'); }
    else if (DV){ const was = mode === 'RUN'; mode = 'RUN'; setMode('STOP'); msg(`<span dir="ltr" class="con">PC ⇒ PLC · Program written (${prog.length} rungs) ✓</span><br>${was ? 'الـ PLC وقف STOP عشان الكتابة. ' : ''}حوّل السويتش أو دوس <b>RUN</b>.`, 'ok'); }
    else { mode = 'RUN'; setMode('STOP'); msg(`<span dir="ltr" class="con">Download complete · Controller in Remote Program mode</span><br>${key === 'PROG' ? 'لف المفتاح على <b>RUN</b>.' : 'دوس <b>Run Mode</b> أو لف المفتاح على RUN.'}`, 'ok'); }
    renderAll();
  }
  toolBox.addEventListener('click', ev => {
    const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return;
    const a = b.dataset.a;
    if (a === 'compile'){ const m = lint(), er = m.filter(x => x.err).length; msg(`<span dir="ltr" class="con">${SI ? 'Compiling finished' : DV ? 'Compile finished' : 'Verify routine'} (errors: ${er}; warnings: ${m.length - er})</span>${m.length ? '<br>' + m[0].text : ''}`, er ? 'bad' : 'ok'); renderLint(); }
    else if (a === 'dl') download();
    else if (a === 'online'){ online = !online; if (SI && online) monOn = monOn || false; msg(online ? (SI ? 'اتوصلت بالـ CPU (Online). الشريط بقى برتقاني زي TIA.' : 'Online مع الكنترولر.') : 'Offline.'); renderAll(); }
    else if (a === 'mon'){ if (SI){ if (!online){ online = true; monOn = true; } else monOn = !monOn; } else monOn = !monOn; renderAll(); }
    else if (a === 'run'){ if (DV && plcStr == null) msg('مفيش برنامج في الـ PLC لسه: اعمل <b>Write to PLC</b> الأول.', 'bad'); else msg(`<span dir="ltr" class="con">${SI ? 'CPU changed to RUN' : DV ? 'PLC RUN' : 'Controller in Remote Run mode'}</span><br>اضغط الزراير اللي تحت الماكينة وشوف البرنامج بيعمل إيه.`, 'ok'); setMode('RUN'); }
    else if (a === 'stop'){ setMode('STOP'); msg(`<span dir="ltr" class="con">${SI ? 'CPU changed to STOP' : DV ? 'PLC STOP' : 'Controller in Remote Program mode'}</span><br>الخرج كله فصل.`); }
  });
  host.addEventListener('click', ev => {
    const s = ev.target.closest('[data-sw]'); if (s){ setMode(s.dataset.sw); if (s.dataset.sw === 'RUN' && plcStr == null) msg('الـ PLC على RUN بس مفيش برنامج: اعمل <b>Write to PLC</b>.', 'bad'); return; }
    const kk = ev.target.closest('[data-key]'); if (kk){ key = kk.dataset.key; if (key === 'RUN') setMode('RUN'); else if (key === 'PROG') setMode('STOP'); else renderAll(); return; }
  });

  /* ---------- tabs ---------- */
  function setTab(t){ tab = t; $$('.bx-tabs .bt', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === t)); $$('.bx-pane', host).forEach(p => { p.hidden = p.dataset.p !== t; }); q('.bx-ladt').hidden = t !== 'lad'; if (t === 'tags') renderTags(); if (t === 'il') renderIL(); if (t === 'frc') renderFrc(); }
  q('.bx-tabs').addEventListener('click', ev => { const b = ev.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); });

  /* ---------- ladder drawing ---------- */
  function geom(rg){
    const C = cols, xs = [], R = rg.rows.length, hs = [], ys = [];
    for (let c = 0; c < C; c++) xs.push(B.PADL + c * B.CW);
    const W = B.PADL + (C - 1) * B.CW + B.CWO + B.PADR;
    let y = 2; for (let r = 0; r < R; r++){ ys.push(y); const h = Math.max.apply(null, rg.rows[r].map(el => B.cellH(el))); hs.push(h); y += h; }
    return {xs, W, ys, hs, H:y + 2, cw:c => c === C - 1 ? B.CWO : B.CW};
  }
  function rungSvg(rg, i, edit){
    const G = geom(rg), mon = monitoring(), pw = mon && e.pw[i] ? e.pw[i] : null, C = cols, R = rg.rows.length;
    let s = `<svg viewBox="0 0 ${G.W} ${G.H}" class="bx-svg" role="group" aria-label="${esc(B.rn(i))}">`;
    const railOn = mon;
    s += `<path d="M${B.PADL - 1} 2V${G.H - 2}" class="rl${railOn ? ' on' : ''}"/>`;
    if (B.rrail) s += `<path d="M${G.W - B.PADR + 1} 2V${G.H - 2}" class="rl${railOn && AR ? ' on' : ''}"/>`;
    if (AR) s += `<text x="${B.PADL / 2}" y="${G.ys[0] + B.WY + 4}" class="rnum" text-anchor="middle">${i}</text>`;
    for (let r = 0; r < R; r++){
      const y = G.ys[r], wy = y + B.WY;
      for (let c = 0; c < C; c++){
        const x = G.xs[c], w = G.cw(c), el = rg.rows[r][c], isSel = edit && sel && sel.i === i && sel.r === r && sel.c === c;
        if (el) s += B.cell({x, y, w, wy, el, mon:!!pw, pin:pw ? pw.pw[r][c] : false, pout:pw ? pw.pw[r][c + 1] : false, cond:pw ? pw.cp[r][c] : false, e, T, prog});
        else if (edit && !mon) s += `<rect x="${x + 7}" y="${wy - 13}" width="${w - 14}" height="26" rx="4" class="ph"/>`;
        if (edit) s += `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${G.hs[r] - 2}" rx="5" class="hit${isSel ? ' sel' : ''}" data-i="${i}" data-r="${r}" data-c="${c}" tabindex="0" role="button" aria-label="${esc(B.rn(i))}، صف ${r + 1}، خانة ${c + 1}: ${el ? esc((B.pal.find(p => p.id === B.idOf(el)) || {mn:el.t}).mn + ' ' + (el.a ? B.short(el.a, T) : '')) : 'فاضية'}"/>`;
      }
      if (B.rrail && rg.rows[r][C - 1] && ['TON', 'TOF', 'RTO', 'CTU', 'CTD', 'SCL', 'CMP'].indexOf(rg.rows[r][C - 1].t) >= 0) s += `<path d="M${G.xs[C - 1] + B.CWO - 2} ${wy}H${G.W - B.PADR}" class="w"/>`;
    }
    for (let r = 1; r < R; r++) rg.links[r - 1].forEach(n => { const x = n >= C ? G.W - B.PADR : G.xs[n], on = pw && pw.pw[r][n] && pw.pw[r - 1][n]; s += `<path d="M${x} ${G.ys[r - 1] + B.WY}V${G.ys[r] + B.WY}" class="w lk${SI && pw ? (on ? ' pw' : ' np') : ''}"/>`; });
    return s + '</svg>';
  }
  function rungHead(i, rg){
    const lbl = SI ? `<b>Network ${i + 1}:</b>` : DV ? `<b>رانج ${i + 1}</b>` : `<b>Rung ${i}</b>`;
    return `<div class="bx-rh">${SI ? '<span class="tri" aria-hidden="true">▼</span>' : ''}<span dir="ltr">${lbl}</span><span class="sp"></span><button type="button" class="btn sm" data-rt="row+" ${rg.rows.length >= 3 ? 'disabled' : ''} aria-label="زوّد فرع">+ فرع</button><button type="button" class="btn sm" data-rt="row-" ${rg.rows.length <= 1 ? 'disabled' : ''} aria-label="شيل آخر صف">− صف</button><button type="button" class="btn sm" data-rt="up" ${i === 0 ? 'disabled' : ''} aria-label="طلّع الرانج لفوق">↑</button><button type="button" class="btn sm" data-rt="del" ${prog.length <= 1 ? 'disabled' : ''} aria-label="امسح">✕</button></div>`;
  }
  function renderLad(){
    const ae = document.activeElement, fd = ae && lad.contains(ae) && ae.dataset ? Object.assign({}, ae.dataset) : null;
    lad.innerHTML = prog.map((rg, i) => `<div class="bx-rung${sel && sel.i === i ? ' cur' : ''}" data-i="${i}">${rungHead(i, rg)}<div class="bx-rs">${rungSvg(rg, i, true)}</div>${AR ? `<div class="bx-rtx" dir="ltr">${esc(AB.rungText(rg, T))}</div>` : ''}</div>${sel && sel.i === i ? picker() : ''}`).join('');
    if (fd && fd.i != null && fd.r != null){ const f = lad.querySelector(`.hit[data-i="${fd.i}"][data-r="${fd.r}"][data-c="${fd.c}"]`); if (f) f.focus({preventScroll:true}); }
  }
  function refreshRungs(){
    const ae = document.activeElement, fd = ae && ae.classList && ae.classList.contains && lad.contains(ae) && ae.dataset && ae.dataset.c != null ? Object.assign({}, ae.dataset) : null;
    $$('.bx-rung', lad).forEach(div => { const i = +div.dataset.i, box = $('.bx-rs', div); if (prog[i] && box) box.innerHTML = rungSvg(prog[i], i, true); });
    if (fd){ const f = lad.querySelector(`.hit[data-i="${fd.i}"][data-r="${fd.r}"][data-c="${fd.c}"]`); if (f) f.focus({preventScroll:true}); }
  }

  /* ---------- picker ---------- */
  const accOf = ent => (ent.acc || ENG.accepts[ent.t] || []).filter(x => x !== 'TB' || AR);
  function choices(ent){
    const acc = accOf(ent), out = [], seen = {};
    const add = a => { if (!a || seen[a] || acc.indexOf(ENG.kind(a)) < 0) return; seen[a] = 1; out.push(a); };
    T.forEach(t => { add(t.a); if (AR && ENG.kind(t.a) === 'T'){ add(t.a + '.TT'); add(t.a + '.EN'); } });
    (ex.io.inputs || []).forEach(i => add(i.a)); (ex.io.outputs || []).forEach(o => add(o.a)); (ex.syms || []).forEach(o => add(o.a));
    usedAddrs(prog).forEach(add);
    if (!AR){ ['M', 'T', 'C'].forEach(kd => { if (acc.indexOf(kd) >= 0){ const f = freeAddr(kd, prog, T); if (f && !(SI && (kd === 'T' || kd === 'C'))) add(f); } }); }
    return out;
  }
  const chipTxt = (a, el) => el && el.t === 'R' && AR && ENG.kind(a) === 'HC' ? AB.hscReset(a) : SI ? (SIE.abs(a) || SIE.sym(a, T, prog)) : DV ? DVP.abs(a) : AB.op(a, T);
  const chipSub = a => { const t = tagByA(T, a); if (SI) return SIE.abs(a) ? (t ? t.n : '') : ''; if (DV) return t ? t.c : ''; return AB.base(a) && t ? AB.base(a) : ''; };
  function picker(){
    const rg = prog[sel.i], el = rg.rows[sel.r][sel.c], outCol = sel.c === cols - 1, cur = el ? B.idOf(el) : 'NONE';
    const ents = B.pal.filter(p => (!p.hsc || ex.hsc) && (outCol ? ENG.isOut(p.t) : ENG.CONTACTS.indexOf(p.t) >= 0));
    let h = `<div class="bx-pk" role="group" aria-label="تعديل الخانة"><div class="pk-h"><b>${esc(B.rn(sel.i))} · صف ${sel.r + 1} · خانة ${sel.c + 1}</b>${outCol ? '<span class="muted"> (عمود الخرج)</span>' : ''}<button type="button" class="btn sm" data-pk="close" aria-label="اقفل">✕</button></div>`;
    h += `<div class="pk-els">${outCol ? '' : `<button type="button" class="btn pk-el" data-pk="el" data-v="W" aria-pressed="${cur === 'W'}"><svg viewBox="0 0 40 24" class="bx-ic" aria-hidden="true"><path d="M2 12h36"/></svg><span>سلك</span></button>`}${ents.map(p => `<button type="button" class="btn pk-el" data-pk="el" data-v="${p.id}" aria-pressed="${cur === p.id}">${B.icon(p.id)}<span class="mono">${esc(p.mn)}</span></button>`).join('')}<button type="button" class="btn pk-el" data-pk="el" data-v="NONE" aria-pressed="${cur === 'NONE'}"><svg viewBox="0 0 40 24" class="bx-ic" aria-hidden="true"><rect x="6" y="5" width="28" height="14" rx="2" stroke-dasharray="3 3"/></svg><span>فاضي</span></button></div>`;
    if (el && el.t !== 'W'){
      const ent = B.pal.find(p => p.id === cur) || {t:el.t};
      h += `<p class="pk-help"><b class="mono">${esc(ent.mn || el.t)}</b> ${B.help[cur] || B.help[el.t] || ''}</p>`;
      if (el.t === 'SCL'){
        const words = T.filter(t => ENG.kind(t.a) === 'MW');
        h += `<div class="pk-par"><span>${AR ? 'Input' : 'VALUE'}:</span><b class="mono">${esc(SI ? '%IW64' : AR ? AB.tag(T, 'IW64') : 'IW64')}</b></div>`;
        if (AR) h += `<div class="pk-par"><label>Input Min <input class="inp mono" type="number" step="any" data-pk="rlo" value="${el.rlo != null ? el.rlo : 0}"></label><label>Input Max <input class="inp mono" type="number" step="any" data-pk="rhi" value="${el.rhi != null ? el.rhi : 0}"></label></div>`;
        h += `<div class="pk-par"><label>${AR ? 'Scaled Min' : 'SCALE_X MIN'} <input class="inp mono" type="number" step="any" data-pk="lo" value="${el.lo}"></label><label>${AR ? 'Scaled Max' : 'MAX'} <input class="inp mono" type="number" step="any" data-pk="hi" value="${el.hi}"></label></div>`;
        h += `<div class="pk-par"><label>${AR ? 'Output' : 'OUT'} <select class="inp mono" data-pk="o">${(words.length ? words.map(t => t.a) : ['MW10']).map(a => `<option value="${a}"${a === el.o ? ' selected' : ''}>${esc(SI ? SIE.word(a, T) + ' ' + SIE.abs(a) : AB.tag(T, a))}</option>`).join('')}</select></label></div>`;
      } else {
        const ch = choices(ent);
        h += `<div class="pk-addr"><span class="pk-k">${AR ? 'Tag:' : SI && (el.t === 'TON' || el.t === 'TOF' || el.t === 'TP' || el.t === 'CTU' || el.t === 'CTD') ? 'Instance DB:' : el.t === 'CMP' ? (AR ? 'Source A:' : 'IN1:') : 'العنوان:'}</span>${ch.map(a => `<button type="button" class="btn chip" data-pk="addr" data-v="${a}" aria-pressed="${el.a === a}"><span class="mono">${esc(chipTxt(a, el))}</span>${chipSub(a) ? `<small>${esc(chipSub(a))}</small>` : ''}</button>`).join('')}`;
        if (SI && ['TON', 'TOF', 'TP', 'CTU', 'CTD'].indexOf(el.t) >= 0) h += `<button type="button" class="btn chip" data-pk="newinst">+ ${el.t[0] === 'C' ? 'IEC_Counter' : 'IEC_Timer'} جديد</button>`;
        if (!AR) h += `<form class="pk-free" data-pk="free"><input class="inp mono" name="a" maxlength="24" placeholder="${SI ? (outCol ? '%Q0.5' : '%I0.5') : outCol ? 'Y5' : 'X5'}" aria-label="عنوان تاني" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn sm" type="submit">حط</button></form>`;
        else h += `<form class="pk-free" data-pk="free"><input class="inp mono" name="a" maxlength="40" placeholder="Tag_Name" aria-label="اسم Tag" autocomplete="off" spellcheck="false"><button class="btn sm" type="submit">حط</button></form>`;
        h += `</div>`;
        if (AR){
          const wantTy = ['TON', 'TOF', 'RTO'].indexOf(el.t) >= 0 || (el.t === 'R' && ENG.kind(el.a) === 'T') ? 'TIMER' : ['CTU', 'CTD'].indexOf(el.t) >= 0 ? 'COUNTER' : 'BOOL';
          const need = !el.a;
          h += `<details class="pk-new"${need || newTagOpen ? ' open' : ''}><summary>+ New Tag ${need ? '<span class="muted">(التعليمة دي محتاجة Tag)</span>' : ''}</summary><form class="pk-nt" data-pk="newtag"><input class="inp mono" name="n" maxlength="40" placeholder="${wantTy === 'TIMER' ? 'Star_TMR' : wantTy === 'COUNTER' ? 'Box_CTR' : 'My_Bit'}" aria-label="اسم الـ Tag" autocomplete="off" spellcheck="false"><select class="inp mono" name="ty" aria-label="Data Type">${['BOOL', 'TIMER', 'COUNTER'].map(t => `<option${t === wantTy ? ' selected' : ''}>${t}</option>`).join('')}</select><button class="btn sm pri" type="submit">Create</button></form></details>`;
        }
        if (el.pt != null) h += `<div class="pk-par"><label>${esc(B.pt.lab)} <input class="inp mono" type="number" step="${B.pt.step}" min="${B.pt.step}" data-pk="pt" value="${B.pt.get(el.pt)}" inputmode="decimal"></label><span class="mono pk-prev">${esc(B.pt.show(el.pt))} = ${nfmt(el.pt, 1)} ث</span></div>`;
        if (el.pv != null){
          h += `<div class="pk-par"><label>${esc(B.pv.lab)} <input class="inp mono" type="number" step="1" min="1" max="${el.t === 'HSC' ? 2147483647 : 32767}" data-pk="pv" value="${el.pv}" inputmode="numeric"></label></div>`;
          if (SI){ const bits = []; (ex.io.inputs || []).forEach(i => bits.push(i.a)); T.forEach(t => { if (ENG.kind(t.a) === 'M' && bits.indexOf(t.a) < 0) bits.push(t.a); });
            h += `<div class="pk-par"><label>${el.t === 'CTU' ? 'R' : 'LD'} <select class="inp mono" data-pk="r"><option value="">false</option>${bits.map(a => `<option value="${a}"${a === el.r ? ' selected' : ''}>${esc(SIE.abs(a) + ' ' + SIE.sym(a, T, prog))}</option>`).join('')}</select></label><span class="muted">${el.t === 'CTU' ? 'دخل الـ R بيصفّر العدّاد' : 'دخل الـ LD بيحمّل PV'}</span></div>`; }
        }
        if (el.t === 'CMP'){
          const get = B.cmpGet || ((a, b) => b);
          h += `<div class="pk-par"><label>${AR ? 'Instruction' : DV ? 'التعليمة' : 'CMP'} <select class="inp mono" data-pk="op">${ENG.CMPOPS.map(o => `<option value="${o}"${o === el.op ? ' selected' : ''}>${esc(B.opName(o, el.a))}${AR ? ' (' + esc(o) + ')' : ''}</option>`).join('')}</select></label><label>${esc(B.cmpLab(el.a))} <input class="inp mono" type="number" step="any" data-pk="b" value="${get(el.a, el.b)}" inputmode="decimal"></label></div>`;
        }
      }
    }
    const brs = [];
    if (sel.r === 0) brs.push(`<button type="button" class="btn" data-pk="par">${outCol ? '⫴ خرج موازي' : '⫴ فرع موازي (OR)'}</button>`);
    if (sel.r > 0){ const L = rg.links[sel.r - 1];
      if (sel.c > 0) brs.push(`<button type="button" class="btn" data-pk="lk" data-v="${sel.c}" aria-pressed="${L.indexOf(sel.c) >= 0}">┘ وصلة شمال لفوق</button>`);
      if (sel.c + 1 <= cols - 1) brs.push(`<button type="button" class="btn" data-pk="lk" data-v="${sel.c + 1}" aria-pressed="${L.indexOf(sel.c + 1) >= 0}">└ وصلة يمين لفوق</button>`); }
    return h + `<div class="pk-br">${brs.join('')}</div></div>`;
  }
  function setEl(id){
    const rg = prog[sel.i], old = rg.rows[sel.r][sel.c];
    if (id === 'NONE'){ rg.rows[sel.r][sel.c] = null; changed(); return; }
    if (id === 'W'){ rg.rows[sel.r][sel.c] = {t:'W'}; changed(); return; }
    const ent = B.pal.find(p => p.id === id), t = ent.t, acc = accOf(ent);
    let a = old && old.a && acc.indexOf(ENG.kind(old.a)) >= 0 ? old.a : '';
    if (!a && t === 'CMP' && ex.cmpDef) a = ex.cmpDef;
    if (!a && t !== 'SCL'){
      const ch = choices(ent), pref = {TON:'T', TOF:'T', TP:'T', RTO:'T', CTU:'C', CTD:'C', CMP:null}[t];
      const f = ch.find(x => pref ? ENG.kind(x) === pref : (ENG.CONTACTS.indexOf(t) >= 0 ? ['I', 'M', 'Q'].indexOf(ENG.kind(x)) >= 0 : ['Q', 'M'].indexOf(ENG.kind(x)) >= 0)) || (pref ? null : ch[0]);
      if (f) a = f;
      else if (pref && !AR){ const n = B.newInst(t, T, prog); if (n){ a = n.a; if (n.tag) T.push(n.tag); } }
    }
    const el = ENG.parse(t + ':' + a);
    if (old && old.pt != null && el.pt != null) el.pt = old.pt; else if (el.pt != null) el.pt = 5;
    if (old && old.pv != null && el.pv != null) el.pv = old.pv; else if (t === 'HSC') el.pv = 10000;
    if (t === 'SCL'){ el.a = 'IW64'; const w = T.find(x => ENG.kind(x.a) === 'MW'); el.o = w ? w.a : 'MW10'; if (AR){ el.rlo = 0; el.rhi = 0; } }
    if (t === 'ONS' && !a) el.a = '';
    rg.rows[sel.r][sel.c] = el; newTagOpen = AR && !el.a; changed();
  }
  function parallel(){
    const rg = prog[sel.i], outCol = sel.c === cols - 1;
    let r = -1;
    for (let j = 1; j < rg.rows.length; j++) if (!rg.rows[j][sel.c]){ r = j; break; }
    if (r < 0){ if (rg.rows.length >= 3){ msg('الرانج فيه 3 صفوف خلاص. ده أقصى حاجة في المحاكي.'); return; } rg.rows.push(new Array(cols).fill(null)); rg.links.push([]); r = rg.rows.length - 1; }
    const L = rg.links[r - 1];
    if (outCol){ rg.rows[r][sel.c] = ENG.parse('OUT:'); if (L.indexOf(sel.c) < 0) L.push(sel.c); }
    else { rg.rows[r][sel.c] = ENG.parse('NO:'); if (sel.c > 0 && L.indexOf(sel.c) < 0) L.push(sel.c); if (L.indexOf(sel.c + 1) < 0) L.push(sel.c + 1); }
    const nodes = outCol ? [sel.c] : [sel.c, sel.c + 1].filter(n => n > 0);
    for (let j = r - 1; j >= 1; j--){ const LL = rg.links[j - 1]; nodes.forEach(n => { if (LL.indexOf(n) < 0) LL.push(n); }); }
    sel = {i:sel.i, r, c:sel.c}; changed();
  }
  const scrollSel = () => { const p = $('.bx-pk', lad); if (p) p.scrollIntoView({block:'nearest', behavior:PL.reduced() ? 'auto' : 'smooth'}); };
  lad.addEventListener('click', ev => {
    const hit = ev.target.closest('.hit');
    if (hit){ const s2 = {i:+hit.dataset.i, r:+hit.dataset.r, c:+hit.dataset.c}; sel = sel && sel.i === s2.i && sel.r === s2.r && sel.c === s2.c ? null : s2; newTagOpen = false; renderLad(); if (sel){ const f = lad.querySelector(`.hit[data-i="${s2.i}"][data-r="${s2.r}"][data-c="${s2.c}"]`); if (f) f.focus({preventScroll:true}); scrollSel(); } return; }
    const rt = ev.target.closest('[data-rt]');
    if (rt && !rt.disabled){ const i = +rt.closest('.bx-rung').dataset.i, rg = prog[i], t = rt.dataset.rt;
      if (t === 'row+' && rg.rows.length < 3){ rg.rows.push(new Array(cols).fill(null)); rg.links.push([]); sel = {i, r:rg.rows.length - 1, c:0}; }
      else if (t === 'row-' && rg.rows.length > 1){ rg.rows.pop(); rg.links.pop(); if (sel && sel.i === i && sel.r >= rg.rows.length) sel = null; }
      else if (t === 'del' && prog.length > 1){ prog.splice(i, 1); sel = null; }
      else if (t === 'up' && i > 0){ prog.splice(i - 1, 0, prog.splice(i, 1)[0]); sel = null; }
      changed(); return; }
    const pk = ev.target.closest('[data-pk]'); if (!pk || !sel || pk.tagName === 'FORM' || pk.tagName === 'INPUT' || pk.tagName === 'SELECT') return;
    const kk = pk.dataset.pk, rg = prog[sel.i], el = rg.rows[sel.r][sel.c];
    if (kk === 'close'){ sel = null; renderLad(); }
    else if (kk === 'el') setEl(pk.dataset.v);
    else if (kk === 'addr' && el){ el.a = pk.dataset.v; changed(); }
    else if (kk === 'newinst' && el){ const n = B.newInst(el.t, T, prog); if (n){ if (n.tag) T.push(n.tag); el.a = n.a; changed(); msg(`اتعمل instance جديد ${iso('"' + (n.tag ? n.tag.n : n.a) + '"')} (في TIA بيطلعلك Call options وبيقترح الاسم ده).`); } }
    else if (kk === 'par') parallel();
    else if (kk === 'lk'){ const L = rg.links[sel.r - 1], n = +pk.dataset.v, j = L.indexOf(n); if (j >= 0) L.splice(j, 1); else L.push(n); changed(); }
  });
  lad.addEventListener('keydown', ev => { const hit = ev.target.closest('.hit'); if (hit && (ev.key === 'Enter' || ev.key === ' ')){ ev.preventDefault(); hit.dispatchEvent(new MouseEvent('click', {bubbles:true})); } });
  lad.addEventListener('toggle', ev => { if (ev.target.classList && ev.target.classList.contains('pk-new')) newTagOpen = ev.target.open; }, true);
  lad.addEventListener('submit', ev => {
    ev.preventDefault(); const f = ev.target.closest('form'); if (!f || !sel) return;
    const el = prog[sel.i].rows[sel.r][sel.c]; if (!el) return;
    if (f.dataset.pk === 'newtag'){
      const r = AB.newTag(f.n.value, f.ty.value, T, prog);
      if (r.err){ msg(r.err, 'bad'); return; }
      T.push(r.tag);
      const ent = B.pal.find(p => p.id === B.idOf(el)) || {t:el.t};
      if (accOf(ent).indexOf(ENG.kind(r.tag.a)) >= 0) el.a = r.tag.a;
      newTagOpen = false; changed(); msg(`اتعمل Tag جديد ${iso(r.tag.n)} نوعه ${iso(f.ty.value)} في Controller Tags.`, 'ok'); return;
    }
    const ent = B.pal.find(p => p.id === B.idOf(el)) || {t:el.t};
    const r = B.parse(f.a.value, accOf(ent), T);
    if (r.err){ msg(r.err, 'bad'); return; }
    if (r.tag) T.push(r.tag);
    el.a = r.a; changed(); if (r.msg) msg(r.msg);
  });
  lad.addEventListener('change', ev => {
    const t = ev.target, kk = t.dataset && t.dataset.pk; if (!kk || !sel) return;
    const el = prog[sel.i].rows[sel.r][sel.c]; if (!el) return;
    const v = PL.num(t.value);
    if (kk === 'pt'){ if (v > 0) el.pt = Math.min(3600, B.pt.set(v)); }
    else if (kk === 'pv'){ if (v > 0) el.pv = Math.min(el.t === 'HSC' ? 2147483647 : 32767, Math.round(v)); }
    else if (kk === 'r'){ if (t.value) el.r = t.value; else delete el.r; }
    else if (kk === 'op') el.op = t.value;
    else if (kk === 'b'){ if (isFinite(v)) el.b = B.cmpSet ? B.cmpSet(el.a, v) : v; }
    else if (kk === 'o') el.o = t.value;
    else if (kk === 'lo' || kk === 'hi' || kk === 'rlo' || kk === 'rhi'){ if (isFinite(v)) el[kk] = v; }
    changed();
  });

  /* ---------- tags / IL / force panes ---------- */
  function liveVal(a){
    const kd = ENG.kind(a);
    if (kd === 'T'){ const t = e.T[a]; return SI ? tiaTime(t ? t.et : 0) : DV ? String(Math.round((t ? t.et : 0) * 10)) : String(Math.round((t ? t.et : 0) * 1000)); }
    if (kd === 'C'){ const c = e.C[a]; return String(c && c.cv != null ? c.cv : 0); }
    if (kd === 'MW') return nfmt(e.num(a), 2);
    if (kd === 'IW' || kd === 'HC') return String(Math.round(e.num(a)));
    const v = kd === 'Q' ? e.out[a] : kd === 'I' ? (a in forces ? forces[a] : e.phys[a]) : e.bit(a);
    return SI ? (v ? 'TRUE' : 'FALSE') : v ? '1' : '0';
  }
  const showLive = () => SI ? online : AR ? online : monOn;
  function renderTags(){
    const live = showLive();
    let rows = '';
    const list = T.slice().sort((a, b) => ordK(a.a) - ordK(b.a));
    list.forEach(t => {
      const used = usedAddrs(prog).has(t.a);
      const name = t.u && !DV ? `<input class="inp mono tn" data-tn="${t.a}" value="${esc(t.n)}" maxlength="40" aria-label="اسم الـ Tag">` : `<span class="mono">${esc(t.n)}</span>`;
      const cm = DV ? (t.u ? `<input class="inp tc" data-tc="${t.a}" value="${esc(t.c || '')}" maxlength="24" aria-label="التعليق">` : esc(t.c || '')) : '';
      const del = t.u ? `<button type="button" class="btn sm" data-tdel="${t.a}" aria-label="امسح" ${used ? 'disabled title="مستخدم في البرنامج"' : ''}>✕</button>` : '';
      if (SI) rows += `<tr><td>${name}</td><td class="mono">${esc(SIE.dtype(t.a))}</td><td class="mono">${esc(SIE.abs(t.a) || (ENG.kind(t.a) === 'T' ? 'DB (IEC_TIMER)' : 'DB (IEC_COUNTER)'))}</td>${live ? `<td class="mono lv">${esc(liveVal(t.a))}</td>` : ''}<td>${del}</td></tr>`;
      else if (DV) rows += `<tr><td class="mono">${esc(DVP.abs(t.a))}</td><td>${cm}</td>${live ? `<td class="mono lv">${esc(liveVal(t.a))}</td>` : ''}<td>${del}</td></tr>`;
      else rows += `<tr><td>${name}</td><td class="mono">${esc(AB.base(t.a))}</td><td class="mono">${esc(AB.dtype(t.a))}</td>${live ? `<td class="mono lv">${esc(liveVal(t.a))}</td>` : ''}<td>${del}</td></tr>`;
    });
    /* the counter card's reset bit is an alias tag too (no engine address of its own) */
    if (AR) list.filter(t => ENG.kind(t.a) === 'HC').forEach(t => { rows += `<tr><td><span class="mono">${esc(AB.hscReset(t.a))}</span></td><td class="mono">${esc(AB.hscResetBase(t.a))}</td><td class="mono">BOOL</td>${live ? '<td class="mono">—</td>' : ''}<td></td></tr>`; });
    const head = SI ? `<th>Name</th><th>Data type</th><th>Address</th>${live ? '<th>Monitor value</th>' : ''}<th></th>` : DV ? `<th>Device</th><th>Comment</th>${live ? '<th>Value</th>' : ''}<th></th>` : `<th>Name</th><th>Alias For</th><th>Data Type</th>${live ? '<th>Value</th>' : ''}<th></th>`;
    const add = SI ? `<form class="tg-add" data-tadd="1"><input class="inp mono" name="n" placeholder="Name" maxlength="40" aria-label="الاسم" autocomplete="off" spellcheck="false"><input class="inp mono" name="a" placeholder="%M2.0" maxlength="10" aria-label="العنوان" autocomplete="off" spellcheck="false"><button class="btn sm" type="submit">Add new</button></form>`
      : DV ? `<form class="tg-add" data-tadd="1"><input class="inp mono" name="a" placeholder="M10" maxlength="6" aria-label="الجهاز" autocomplete="off" spellcheck="false"><input class="inp" name="n" placeholder="تعليق" maxlength="24" aria-label="التعليق" autocomplete="off"><button class="btn sm" type="submit">Add</button></form>`
      : `<form class="tg-add" data-tadd="1"><input class="inp mono" name="n" placeholder="New_Tag" maxlength="40" aria-label="الاسم" autocomplete="off" spellcheck="false"><select class="inp mono" name="ty" aria-label="Data Type"><option>BOOL</option><option>TIMER</option><option>COUNTER</option></select><button class="btn sm" type="submit">New Tag</button></form>`;
    tagsBox.innerHTML = `<div class="tblw"><table class="tbl bx-tt" dir="ltr"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>${add}<p class="muted pk-help">${SI ? 'في TIA كل عنوان ليه اسم (Tag) والبرنامج بيعرضه بين علامتين "…". التايمرات والعدّادات IEC ليها Instance DB.' : DV ? 'في دلتا العنوان نفسه هو الاسم (X0، Y0، M0)، والتعليق بيظهر تحت الكونتاكت.' : 'في Logix مفيش عناوين في البرنامج: كل حاجة Tag. الـ I/O بيتعمله Alias على عنوان الكارت زي ' + iso('Local:1:I.Data.0') + '.'}</p>`;
  }
  tagsBox.addEventListener('change', ev => {
    const t = ev.target;
    if (t.dataset.tn){ const tg = tagByA(T, t.dataset.tn), v = t.value.trim(); if (tg && /^[A-Za-z_][A-Za-z0-9_]{0,39}$/.test(v) && !T.some(x => x !== tg && x.n.toLowerCase() === v.toLowerCase())){ tg.n = v; changed(); } else { t.value = tg ? tg.n : ''; msg('اسم مش مظبوط أو متكرر: حروف إنجليزي وأرقام و _ بس.', 'bad'); } }
    if (t.dataset.tc){ const tg = tagByA(T, t.dataset.tc); if (tg){ tg.c = t.value.trim().slice(0, 24); persist(); renderLad(); } }
  });
  tagsBox.addEventListener('click', ev => { const b = ev.target.closest('[data-tdel]'); if (!b || b.disabled) return; const i = T.findIndex(t => t.a === b.dataset.tdel); if (i >= 0){ T.splice(i, 1); changed(); } });
  tagsBox.addEventListener('submit', ev => {
    ev.preventDefault(); const f = ev.target;
    if (SI){ const n = f.n.value.trim(); if (!/^[A-Za-z_][A-Za-z0-9_]{0,39}$/.test(n) || tagByN(T, n)){ msg('اكتب اسم جديد: حروف إنجليزي وأرقام و _ .', 'bad'); return; } const r = SIE.parse(f.a.value, ['I', 'Q', 'M'], []); if (r.err){ msg(r.err, 'bad'); return; } if (tagByA(T, r.a)){ msg('العنوان ده ليه Tag خلاص.', 'bad'); return; } T.push({n, a:r.a, c:'', u:1}); }
    else if (DV){ const r = DVP.parse(f.a.value, ['I', 'Q', 'M', 'T', 'C']); if (r.err){ msg(r.err, 'bad'); return; } const ex0 = tagByA(T, r.a); if (ex0){ if (!ex0.u){ msg('الجهاز ده ليه تعليق خلاص.', 'bad'); return; } ex0.c = f.n.value.trim(); } else T.push({n:DVP.abs(r.a), a:r.a, c:f.n.value.trim().slice(0, 24), u:1}); }
    else { const r = AB.newTag(f.n.value, f.ty.value, T, prog); if (r.err){ msg(r.err, 'bad'); return; } T.push(r.tag); }
    changed();
  });
  function renderIL(){
    if (!ilBox) return;
    const L = DVP.il(prog); let n = 0;
    ilBox.innerHTML = `<div class="il" dir="ltr">${L.map(x => x.rung != null ? `<div class="il-r">${esc('رانج ' + (x.rung + 1))}</div>` : x.c ? `<div class="il-c">${esc(x.c)}</div>` : `<div class="il-l"><span class="ln">${n++}</span><b>${esc(x.i)}</b><span>${esc(x.o)}</span></div>`).join('')}</div><p class="muted pk-help">ده نفس البرنامج مكتوب Instruction List، زي ما بتشوفه في WPLSoft أو لما تقرا برنامج دلتا مطبوع. LD يبدأ فرع، AND توالي، OR توازي، و ANB / ORB بيجمّعوا بلوكات. الرقم على الشمال ترتيب السطر بس (مش رقم الـ Step).</p>`;
  }
  function renderFrc(){
    const all = (ex.io.inputs || []).map(i => ({a:i.a, l:i.label})).concat((ex.io.outputs || []).map(o => ({a:o.a, l:o.label})));
    const head = SI ? 'Force value' : 'Force';
    frcBox.innerHTML = `<div class="tblw"><table class="tbl bx-tt" dir="ltr"><thead><tr><th>${SI ? 'Address' : DV ? 'Device' : 'Tag'}</th><th>${SI ? 'Name' : 'الجهاز'}</th><th>Value</th><th>${head}</th></tr></thead><tbody>${all.map(x => { const f = forces[x.a]; return `<tr><td class="mono">${esc(SI ? SIE.abs(x.a) : DV ? DVP.abs(x.a) : AB.tag(T, x.a))}</td><td>${esc(SI ? (tagByA(T, x.a) || {n:x.l}).n : x.l)}</td><td class="mono lv" data-fv="${x.a}">${esc(liveVal(x.a))}</td><td><div class="seg"><button type="button" class="btn sm" data-f="${x.a}" data-v="" aria-pressed="${f == null}">—</button><button type="button" class="btn sm" data-f="${x.a}" data-v="1" aria-pressed="${f === 1}">${SI ? 'TRUE' : '1'}</button><button type="button" class="btn sm" data-f="${x.a}" data-v="0" aria-pressed="${f === 0}">${SI ? 'FALSE' : '0'}</button></div></td></tr>`; }).join('')}</tbody></table></div><div class="box safe pk-help"><b>خلي بالك:</b> الـ Force بيكسب على البرنامج والحساسات. ${SI ? 'لمبة MAINT على الـ CPU بتنوّر صفرا طول ما فيه Force.' : AR ? 'لمبة FORCE على الكنترولر بتنوّر طول ما فيه Force.' : 'شيل أي Force أول ما تخلّص.'}</div>`;
  }
  frcBox.addEventListener('click', ev => {
    const b = ev.target.closest('[data-f]'); if (!b) return;
    const a = b.dataset.f, v = b.dataset.v; if (v === '') delete forces[a]; else forces[a] = +v;
    e.force = Object.assign({}, forces);
    if (mode !== 'RUN'){ e.out = {}; Object.keys(forces).forEach(x => { if (ENG.kind(x) === 'Q') e.out[x] = forces[x]; }); }
    renderFrc(); renderTop();
    msg(`Force: ${iso(B.short(a, T))} ${a in forces ? '= ' + forces[a] : 'اتشال'}.`, a in forces ? 'warn' : '');
  });

  /* ---------- check / hint / solution ---------- */
  function updChk(){
    const d = isDone(ex), f = fails[ex.key] || 0;
    q('[data-t=hint]').hidden = !ex.hint || !(f >= 1 || d);
    q('[data-t=sol]').hidden = !ex.sol || !(f >= 2 || d);
  }
  function check(){
    const errs = lint().filter(x => x.err);
    if (errs.length){ fails[ex.key] = (fails[ex.key] || 0) + 1; show(false, 'فيه تعليمة ناقصها عنوان أو عنوانها غلط: ' + errs[0].text); updChk(); return {ok:false, msg:errs[0].text}; }
    for (const c of ex.cases || [{steps:ex.tests || []}]){
      const r = ENG.check(prog, {io:ex.io, plant:ex.plant, plantOpt:Object.assign({}, ex.plantOpt || {}, c.plantOpt || {}), tests:c.steps}, {cols});
      if (!r.ok){ fails[ex.key] = (fails[ex.key] || 0) + 1; const m = (c.name ? `<b>${esc(c.name)}:</b> ` : '') + xlate(B, T, r.msg); show(false, m + (fails[ex.key] === 1 && ex.hint ? ' <span class="muted">(فيه تلميح تحت لو محتاجه)</span>' : fails[ex.key] === 2 && ex.sol ? ' <span class="muted">(تقدر تشوف الحل دلوقتي)</span>' : '')); updChk(); return {ok:false, msg:r.msg}; }
    }
    const first = LES ? PL.mark(LES, ex.key) : PL.px.mark(xk());
    show(true, XL(ex.ok || 'البرنامج عدّى كل الاختبارات.'));
    renderList(); renderScn(); updChk();
    return {ok:true, first};
  }
  function show(ok, html){ resBox.hidden = false; resBox.className = 'bx-res ' + (ok ? 'ok' : 'no'); resBox.innerHTML = `<b>${ok ? '✓ تمام!' : '✗ لسه:'}</b> ${html}`; }
  function loadDef(def, tags){ backup = {p:ENG.serialize(prog), t:T.map(t => Object.assign({}, t))}; prog = ENG.program(def, cols); if (tags) tags.forEach(t => { if (!tagByA(T, t.a)) T.push(Object.assign({u:1}, t)); }); sel = null; changed(); q('[data-t=undo]').hidden = false; }
  q('.bx-chk').addEventListener('click', ev => {
    const b = ev.target.closest('[data-t]'); if (!b) return; const t = b.dataset.t;
    if (t === 'chk'){ check(); resBox.scrollIntoView({block:'nearest', behavior:PL.reduced() ? 'auto' : 'smooth'}); }
    else if (t === 'hint') hintBox.hidden = !hintBox.hidden;
    else if (t === 'sol'){ loadDef(ex.sol, ex.solTags); show(true, 'ده حل ممكن (مش الوحيد). نزّله على الـ PLC وشغّله، واقرا كل رانج بيعمل إيه.'); resBox.className = 'bx-res'; }
    else if (t === 'reset'){ T = (ex.tags || []).map(x => Object.assign({}, x)).concat(T.filter(x => x.u && !(ex.tags || []).some(y => y.a === x.a))); loadDef(ex.start || [ENG.serialize([ENG.blankRung(cols)])[0]]); msg('رجعنا البرنامج لأوّله. لو عايز اللي كنت عامله دوس "رجّع برنامجي".'); }
    else if (t === 'undo' && backup){ prog = ENG.program(backup.p, cols); T = backup.t; backup = null; sel = null; changed(); b.hidden = true; msg('رجّعنا برنامجك.'); }
  });
  q('.bx-ladt').addEventListener('click', ev => { if (!ev.target.closest('[data-t=add]')) return; if (prog.length >= 12){ msg('أقصى عدد 12 رانج في التمرين.'); return; } prog.push(ENG.blankRung(cols)); sel = {i:prog.length - 1, r:0, c:0}; changed(); scrollSel(); });
  listBox.addEventListener('click', ev => { const b = ev.target.closest('[data-k]'); if (!b) return; select(+b.dataset.k); scn.scrollIntoView({block:'start', behavior:PL.reduced() ? 'auto' : 'smooth'}); });

  /* ---------- live loop ---------- */
  function renderAll(){ renderPlant(); renderFace(); renderTop(); renderLad(); renderLint(); updIO(); if (tab === 'tags') renderTags(); if (tab === 'frc') renderFrc(); }
  let tagT = 0;
  const anim = PL.animate(host, dt => {
    if (!host.isConnected){ anim.stop(); return; }
    acc += dt; let n = 0;
    if (demo) acc = 0; /* the machine preview drives the clock itself */
    while (acc >= 0.02 && n < 6){ acc -= 0.02; n++; P().step(plantSt, e, 0.02); if (mode === 'RUN') e.scan(0.02); }
    if (n === 6) acc = 0;
    rdT += dt; tagT += dt;
    renderPlant(); renderFace();
    if (rdT > 0.1){ rdT = 0; if (monitoring()) refreshRungs(); }
    if (tagT > 0.4){ tagT = 0; if (tab === 'tags' && showLive() && !tagsBox.contains(document.activeElement)) $$('td.lv', tagsBox).forEach((td, j) => { const t = T.slice().sort((a, b) => ordK(a.a) - ordK(b.a))[j]; if (t) td.textContent = liveVal(t.a); }); if (tab === 'frc') $$('[data-fv]', frcBox).forEach(td => { td.textContent = liveVal(td.dataset.fv); }); }
  });

  let wasMon = false;
  const wasT = setInterval(() => { if (!host.isConnected){ clearInterval(wasT); return; } const m = monitoring(); if (m !== wasMon){ wasMon = m; renderTop(); refreshRungs(); } }, 300);

  /* ---------- machine preview («▶ شوف المكنة شغّالة»): the hidden solution runs in the PLC, the editor is hidden ---------- */
  const L = s => `<bdi dir="ltr">${s}</bdi>`;
  const pvAd = {host, watchEl:plantBox, title:'المكنة شغالة صح',
    mount(box){ q('.bx-stage').before(box); }, key:() => LES ? 'l/' + LES + '/' + ex.key : 'x/' + PFX + '/' + ex.key, ex:() => ex, has:() => !!(ex && ex.sol),
    begin(po){
      demo = {e, plantSt, mode, sel, ins:(ex.io.inputs || []).map(i => ({i, state:i.state})), pressed:Object.assign({}, pressed)};
      sel = null;
      (ex.io.inputs || []).forEach(i => { i.state = defIn(i); pressed[i.a] = false; });
      plantSt = P().create(po);
      e = new ENG.Engine(ENG.program(ex.sol, cols), {cols});
      (ex.io.inputs || []).forEach(i => { const v = physFor(i); if (v != null) e.setIn(i.a, v); });
      P().step(plantSt, e, 0);
      mode = 'RUN'; faceSig = ''; renderAll(); nhUpdate();
    },
    end(){
      if (!demo) return; const d = demo; demo = null;
      e = d.e; plantSt = d.plantSt; mode = d.mode; sel = d.sel; faceSig = '';
      d.ins.forEach(x => { x.i.state = x.state; }); Object.keys(pressed).forEach(a => delete pressed[a]); Object.assign(pressed, d.pressed);
      renderAll(); nhUpdate();
    },
    advance(dt){ P().step(plantSt, e, dt); e.scan(dt); },
    engine:() => e, plant:() => plantSt,
    setIn(a, v){ const i = (ex.io.inputs || []).find(x => x.a === a); if (!i){ e.setIn(a, v); return; }
      if (i.kind === 'pb' || i.kind === 'pbnc') pressed[a] = v !== defIn(i); else i.state = v;
      const pv = physFor(i); e.setIn(a, pv == null ? v : pv); updIO(); },
    inBtn:a => ioBox.querySelector(`.ib[data-a="${a}"]`), outEl:() => face, plantEl:() => plantBox,
    lab:a => { const x = (ex.io.inputs || []).concat(ex.io.outputs || []).find(y => y.a === a); return x ? x.label : ''; },
    addr:a => B.short(a, T), xl:s => xlate(B, T, s),
    outro:() => '<b>كده المكنة اشتغلت زي المطلوب.</b> دلوقتي دورك: اكتب البرنامج تحت، ' + (SI ? `اعمل ${L('Download to device')} وبعدين ${L('Monitoring')}` : DV ? `اعمل ${L('Write to PLC')} وحوّل الـ PLC لـ ${L('RUN')}` : `اعمل ${L('Go Online')} ← ${L('Download')} ← ${L('Run Mode')}`) + '، وجرّب بالزراير، وبعدين دوس «اختبر البرنامج».'};
  PL.preview.attach(pvAd);

  /* deep link: siemens.html#enc opens that exercise */
  const fromHash = () => { const h = decodeURIComponent((location.hash || '').slice(1)), j = exs.findIndex(x => x.key === h); return j; };
  select(LES ? 0 : Math.max(0, fromHash()));
  if (!LES && fromHash() > 0) setTimeout(() => scn.scrollIntoView({block:'start'}), 60);
  if (!LES) window.addEventListener('hashchange', () => { const j = fromHash(); if (j >= 0 && j !== k){ select(j); scn.scrollIntoView({block:'start', behavior:PL.reduced() ? 'auto' : 'smooth'}); } });
  const api = {host, preview:pvAd, get demo(){ return !!demo; }, brand:B.id, get ex(){ return ex; }, get prog(){ return prog; }, get tags(){ return T; }, get engine(){ return e; }, get plant(){ return plantSt; }, get mode(){ return mode; }, get plcStr(){ return plcStr; }, exercises:exs,
    select, check, load(def){ prog = ENG.program(def, cols); changed(); }, press, pick(i, r, c){ sel = {i, r, c}; renderLad(); }, setEl(id){ setEl(id); }, lint, download, setMode, key:v => { key = v; },
    tool(a){ const b = toolBox.querySelector(`[data-a="${a}"]`); if (b) b.click(); }, monitoring, il: () => DV ? DVP.il(prog) : null, rungText: i => AR ? AB.rungText(prog[i], T) : null};
  (PL._bx = PL._bx || []).push(api);
  return api;
};

/* run an exercise's solution and its starting program through the auto-check (used by the test-suite) */
PL.bxSelfTest = function(ex){
  const run = def => (ex.cases || [{steps:ex.tests || []}]).map(c => ENG.check(def, {io:ex.io, plant:ex.plant, plantOpt:Object.assign({}, ex.plantOpt || {}, c.plantOpt || {}), tests:c.steps}, {cols:ex.cols || 5})).find(r => !r.ok) || {ok:true};
  return {sol:ex.sol ? run(ex.sol) : null, start:run(ex.start || [])};
};
/* AB analog card: 1769-IF4 in engineering units 4000…20000 (= 4.000…20.000 mA) instead of the S7 raw 0…27648 */
PL.plants.tank_ab = Object.assign({}, PL.plants.tank, {
  step(st, e, dt){ PL.plants.tank.step(st, e, dt); const raw = e.W.IW64; e.setWord('IW64', st.broken ? 0 : Math.round(4000 + raw / ENG.RAWMAX * 16000)); }
});

/* ================= shared scenarios: machine, I/O and auto-check steps (engine addresses) =================
   The same factory jobs are practised on every brand: each page adds the vendor's addresses, task text and solution.
   Messages use engine addresses (I0.0, Q0.0 …) and the brand layer rewrites them (%I0.0 · X0 · Start_PB). */
const SC = PL.BXS = {};
const segs = c => { const L = c.plant.log.filter(x => x.t >= c.mark.t0 - 1e-9), out = []; for (let i = 0; i < L.length - 1; i++) out.push({s:L[i].s, d:L[i + 1].t - L[i].t}); return out; };
const flips = {watch:c => { const v = c.q('Q0.0'); if (c.mark.last != null && v !== c.mark.last) c.mark.n = (c.mark.n || 0) + 1; c.mark.last = v; return null; }};

SC.seal_ol = {io:{inputs:[{a:'I0.0', label:'Start', kind:'pb'}, {a:'I0.1', label:'Stop', kind:'pbnc'}, {a:'I0.2', label:'أوفرلود', kind:'ncsw'}], outputs:[{a:'Q0.0', label:'الموتور', kind:'motor'}, {a:'Q0.1', label:'Trip', kind:'lamp', color:'amber'}]},
  tests:[{run:0.2}, {exp:{'Q0.0':0, 'Q0.1':0}, msg:'في البداية من غير ما حد يدوس حاجة:'},
    {press:'I0.0'}, {run:0.5}, {exp:{'Q0.0':1}, msg:'دوست Start وسبته: الموتور لازم يفضل شغال (التثبيت الذاتي).'},
    {press:'I0.1'}, {run:0.3}, {exp:{'Q0.0':0}, msg:'دوست Stop:'},
    {press:'I0.0'}, {run:0.3}, {exp:{'Q0.0':1}, msg:'Start تاني:'},
    {set:{'I0.2':0}}, {run:0.3}, {exp:{'Q0.0':0, 'Q0.1':1}, msg:'الأوفرلود فصل (I0.2 بقى 0):'},
    {set:{'I0.2':1}}, {run:0.5}, {exp:{'Q0.0':0, 'Q0.1':0}, msg:'الأوفرلود رجع: الموتور مايشتغلش لوحده ولمبة Trip تطفي.'},
    {hold:'I0.1'}, {press:'I0.0'}, {run:0.3}, {exp:{'Q0.0':0}, msg:'Stop متداس وحد داس Start: الـ Stop لازم يكسب.'}, {release:'I0.1'}, {run:0.3}, {exp:{'Q0.0':0}, msg:'سابوا الـ Stop:'}]};

SC.seal_lamp = {io:{inputs:[{a:'I0.0', label:'Start', kind:'pb'}, {a:'I0.1', label:'Stop', kind:'pbnc'}], outputs:[{a:'Q0.0', label:'موتور السير', kind:'motor'}, {a:'Q0.1', label:'لمبة تشغيل', kind:'lamp', color:'green'}]},
  tests:[{run:0.2}, {exp:{'Q0.0':0, 'Q0.1':0}, msg:'في البداية:'}, {press:'I0.0'}, {run:0.5}, {exp:{'Q0.0':1, 'Q0.1':1}, msg:'دوست Start وسبته: الموتور يفضل شغال ولمبة التشغيل تنوّر.'},
    {press:'I0.1'}, {run:0.3}, {exp:{'Q0.0':0, 'Q0.1':0}, msg:'دوست Stop:'}, {press:'I0.0'}, {run:0.3}, {exp:{'Q0.0':1, 'Q0.1':1}, msg:'Start تاني:'},
    {hold:'I0.1'}, {press:'I0.0'}, {run:0.3}, {exp:{'Q0.0':0}, msg:'Stop متداس وحد داس Start: الـ Stop لازم يكسب.'}, {release:'I0.1'}, {run:0.3}, {exp:{'Q0.0':0, 'Q0.1':0}, msg:'سابوا الـ Stop: الموتور مايشتغلش لوحده.'}]};

SC.pump_dry = {io:{inputs:[{a:'I0.0', label:'Start', kind:'pb'}, {a:'I0.1', label:'Stop', kind:'pbnc'}, {a:'I0.2', label:'عوامة مية', kind:'ncsw'}], outputs:[{a:'Q0.0', label:'الطلمبة', kind:'motor'}, {a:'Q0.1', label:'مفيش مية', kind:'lamp', color:'red'}]},
  tests:SC.seal_ol.tests.map(s => s.msg ? Object.assign({}, s, {msg:s.msg.replace('الأوفرلود فصل (I0.2 بقى 0):', 'المية خلصت (I0.2 بقى 0):').replace('الأوفرلود رجع: الموتور مايشتغلش لوحده ولمبة Trip تطفي.', 'المية رجعت: الطلمبة ماتشتغلش لوحدها واللمبة تطفي.').replace('الموتور لازم يفضل شغال', 'الطلمبة لازم تفضل شغالة').replace('الموتور', 'الطلمبة')}) : s)};

SC.fr = {io:{inputs:[{a:'I0.0', label:'أمام', kind:'pb'}, {a:'I0.1', label:'خلف', kind:'pb', color:'blue'}, {a:'I0.2', label:'Stop', kind:'pbnc'}], outputs:[{a:'Q0.0', label:'KM1 أمام'}, {a:'Q0.1', label:'KM2 خلف'}]}, plant:'fr',
  tests:[{watch:c => c.q('Q0.0') && c.q('Q0.1') ? 'Q0.0 و Q0.1 اشتغلوا مع بعض: قصر بين الفازات! محتاج كونتاكت NC من كل خرج في رانج التاني.' : null},
    {run:0.2}, {press:'I0.0'}, {run:0.4}, {exp:{'Q0.0':1, 'Q0.1':0}, msg:'دوست أمام وسبته:'},
    {press:'I0.1'}, {run:0.4}, {exp:{'Q0.0':1, 'Q0.1':0}, msg:'الموتور شغال أمام ودوست خلف: لازم مايحصلش حاجة.'},
    {press:'I0.2'}, {run:0.3}, {exp:{'Q0.0':0, 'Q0.1':0}, msg:'دوست Stop:'},
    {press:'I0.1'}, {run:0.4}, {exp:{'Q0.0':0, 'Q0.1':1}, msg:'دوست خلف:'}, {press:'I0.0'}, {run:0.3}, {exp:{'Q0.1':1, 'Q0.0':0}, msg:'شغال خلف ودوست أمام:'},
    {press:'I0.2'}, {run:0.3}, {hold:'I0.0'}, {hold:'I0.1'}, {run:0.4}, {release:'I0.0'}, {release:'I0.1'}, {run:0.3}, {press:'I0.2'}, {run:0.2}, {exp:{'Q0.0':0, 'Q0.1':0}, msg:'بعد Stop:'}]};

SC.sd = {io:{inputs:[{a:'I0.0', label:'Start', kind:'pb'}, {a:'I0.1', label:'Stop', kind:'pbnc'}], outputs:[{a:'Q0.0', label:'KM1 رئيسي'}, {a:'Q0.1', label:'KM2 دلتا'}, {a:'Q0.2', label:'KM3 ستار'}]}, plant:'sd',
  tests:[{watch:c => c.q('Q0.1') && c.q('Q0.2') ? 'الدلتا Q0.1 والستار Q0.2 اشتغلوا مع بعض: قصر! حط NC من كل واحد في رانج التاني.' : null},
    {run:0.2}, {press:'I0.0'}, {run:0.5}, {exp:{'Q0.0':1, 'Q0.2':1, 'Q0.1':0}, msg:'بعد Start على طول: KM1 والستار.'}, {run:3.8}, {exp:{'Q0.0':1, 'Q0.2':1, 'Q0.1':0}, msg:'بعد حوالي 4.6 ثانية لسه ستار:'},
    {run:0.8}, {exp:{'Q0.0':1, 'Q0.2':0, 'Q0.1':1}, msg:'بعد 5 ثواني الستار يفصل والدلتا تشتغل:'}, {run:3}, {exp:{'Q0.0':1, 'Q0.1':1, 'Q0.2':0}, msg:'الموتور لازم يفضل دلتا:'},
    {press:'I0.1'}, {run:0.3}, {exp:{'Q0.0':0, 'Q0.1':0, 'Q0.2':0}, msg:'دوست Stop:'}, {press:'I0.0'}, {run:0.5}, {exp:{'Q0.0':1, 'Q0.2':1, 'Q0.1':0}, msg:'Start تاني: لازم يبدأ ستار من الأول.'}, {press:'I0.1'}, {run:0.2}]};

SC.alarm = {io:{inputs:[{a:'I0.0', label:'ضغط عالي', kind:'sensor'}, {a:'I0.1', label:'تأكيد', kind:'pb', color:'blue'}], outputs:[{a:'Q0.0', label:'لمبة إنذار', kind:'lamp', color:'red'}, {a:'Q0.1', label:'سارينة', kind:'horn'}]},
  tests:[{run:0.2}, {press:'I0.1'}, {exp:{'Q0.0':0, 'Q0.1':0}, msg:'من غير إنذار:'},
    {set:{'I0.0':1}}, {run:0.3}, {set:{'I0.0':0}}, {run:1.5}, {exp:{'Q0.0':1, 'Q0.1':1}, msg:'الضغط علي لحظة ورجع: اللمبة والسارينة لازم يفضلوا شغالين (ذاكرة).'},
    {press:'I0.1'}, {run:0.3}, {exp:{'Q0.1':0, 'Q0.0':0}, msg:'أكّدت والضغط طبيعي: كله يطفي.'},
    {set:{'I0.0':1}}, {run:0.5}, {exp:{'Q0.0':1, 'Q0.1':1}, msg:'إنذار جديد (حتى بعد تأكيد قديم): السارينة لازم ترجع.'}, {press:'I0.1'}, {run:1}, {exp:{'Q0.1':0, 'Q0.0':1}, msg:'أكّدت والضغط لسه عالي: السارينة تسكت واللمبة تفضل.'},
    {set:{'I0.0':0}}, {run:0.3}, {exp:{'Q0.0':0, 'Q0.1':0}, msg:'الضغط رجع طبيعي بعد التأكيد:'}]};

const ctuTests = [{run:0.2}, {press:'I0.0'}, {run:1}, {exp:{'Q0.0':1}, msg:'دوست Start: السير لازم يدور ويفضل داير.'}, {run:16},
  {fn:c => c.plant.carton > 6 ? `الكرتونة خدت ${c.plant.carton} علب! السير لازم يقف أول ما العدّ يوصل 6.` : c.plant.carton < 6 ? `الكرتونة فيها ${c.plant.carton} علب بس والسير ${c.q('Q0.0') ? 'لسه دايرة' : 'وقف'}. لازم يكمّل لحد 6.` : null},
  {exp:{'Q0.0':0, 'Q0.1':1}, msg:'بعد 6 علب: السير يقف واللمبة تنوّر.'}, {press:'I0.0'}, {run:1}, {exp:{'Q0.0':0}, msg:'الكرتونة مليانة ودوست Start من غير ما تغيّرها: السير مايدورش.'},
  {press:'I0.3'}, {run:0.3}, {exp:{'Q0.1':0, 'Q0.0':0}, msg:'دوست كرتونة جديدة: اللمبة تطفي والسير لسه واقف لحد Start.'},
  {press:'I0.0'}, {run:3}, {exp:{'Q0.0':1}, msg:'Start بعد الكرتونة الجديدة:'}, {press:'I0.1'}, {run:0.3}, {exp:{'Q0.0':0}, msg:'دوست Stop في النص:'},
  {fn:c => c.e.num('C0') > 0 && c.e.num('C0') < 6 ? null : `العدّ لازم يفضل محفوظ لما تدوس Stop (العدّاد = ${c.e.num('C0')}).`}];
SC.ctu = {io:{inputs:[{a:'I0.0', label:'Start', kind:'pb'}, {a:'I0.1', label:'Stop', kind:'pbnc'}, {a:'I0.3', label:'كرتونة جديدة', kind:'pb', color:'blue'}, {a:'I0.2', label:'عين العلب', kind:'auto'}], outputs:[{a:'Q0.0', label:'السير', kind:'motor'}, {a:'Q0.1', label:'الكرتونة كملت', kind:'lamp', color:'green'}]}, plant:'pack', cmpDef:'C0', tests:ctuTests};

SC.tank = {io:{inputs:[], outputs:[{a:'Q0.0', label:'طلمبة'}, {a:'Q0.1', label:'High'}, {a:'Q0.2', label:'Low'}]}, plant:'tank', plantOpt:{level:50}, cmpDef:'MW10',
  tests:[{run:1}, {exp:{'Q0.0':0, 'Q0.1':0, 'Q0.2':0}, msg:'المستوى 50%:'}, {fn:c => Math.abs(c.e.num('MW10') - c.plant.level) < 1.5 ? null : `المستوى المحسوب في البرنامج = ${PL.fmt(c.e.num('MW10'), 1)} والمستوى الحقيقي ${Math.round(c.plant.level)}%: راجع بلوك التحويل (المدى ومكان الخرج).`},
    {until:c => c.plant.level <= 19.8 || c.q('Q0.0'), max:25, msg:'التانك مانزلش لحد 20%: الطلمبة شغالة من غير سبب؟'}, {fn:c => c.q('Q0.0') && c.plant.level > 21.5 ? `الطلمبة اشتغلت والمستوى ${Math.round(c.plant.level)}%: المفروض تستنى لحد 20%.` : null}, {run:0.02}, {exp:{'Q0.0':1}, msg:'المستوى نزل تحت 20%: الطلمبة لازم تشتغل.'},
    {until:c => c.plant.level >= 50, max:30, msg:'المستوى مش بيطلع: الطلمبة بتفصل وتوصل حوالين 20%. محتاج هيستيريسيس: Set عند 20% و Reset عند 80%.'}, {exp:{'Q0.0':1}, msg:'المستوى 50% والطلمبة شغالة من تحت: لازم تفضل شغالة لحد 80% (هيستيريسيس).'},
    {until:c => !c.q('Q0.0') || c.plant.level >= 85, max:30, msg:'المستوى ماوصلش 80%.'}, {fn:c => c.q('Q0.0') ? 'المستوى عدّى 80% والطلمبة لسه شغالة: لازم تفصل عند 80%.' : c.plant.level < 78.5 ? `الطلمبة فصلت بدري عند ${Math.round(c.plant.level)}%: المفروض تكمّل لحد 80%.` : null}, {run:3}, {exp:{'Q0.0':0}, msg:'المستوى نازل تحت 80% شوية: الطلمبة تفضل واقفة لحد 20%.'},
    {plant:{level:93}}, {run:0.4}, {exp:{'Q0.1':1, 'Q0.2':0}, msg:'المستوى 93%:'}, {plant:{level:60}}, {run:0.4}, {exp:{'Q0.1':0, 'Q0.2':0}, msg:'المستوى 60%:'}, {plant:{level:7, use:false}}, {run:0.4}, {exp:{'Q0.2':1, 'Q0.0':1, 'Q0.1':0}, msg:'المستوى 7%:'}]};

SC.traffic = {io:{inputs:[{a:'I0.0', label:'تشغيل', kind:'sw'}], outputs:[{a:'Q0.0', label:'أحمر'}, {a:'Q0.1', label:'أصفر'}, {a:'Q0.2', label:'أخضر'}]}, plant:'traffic',
  tests:[{run:0.3}, {exp:{'Q0.0':0, 'Q0.1':0, 'Q0.2':0}, msg:'السويتش OFF:'}, {fn:c => { c.mark.t0 = c.t; return null; }}, {set:{'I0.0':1}}, {run:0.3}, {exp:{'Q0.2':1, 'Q0.1':0, 'Q0.0':0}, msg:'أول ما السويتش يبقى ON: أخضر.'}, {run:30},
    {fn:c => { const s = segs(c); if (s.some(x => x.s === 'X')) return 'في لحظة كان فيه أكتر من لمبة منوّرة مع بعض. لمبة واحدة بس في أي وقت.';
      const m = s.filter(x => !(x.s === '-' && x.d < 0.15)); const want = [['G', 5, 'الأخضر'], ['Y', 2, 'الأصفر'], ['R', 5, 'الأحمر']];
      if (m.length < 5) return 'الإشارة مش بتلف: بعد 30 ثانية لسه ماكملتش دورتين.';
      for (let i = 0; i < Math.min(m.length, 7); i++){ const w = want[i % 3]; if (m[i].s !== w[0]) return `الترتيب غلط: بعد ${want[(i + 2) % 3][2]} المفروض ${w[2]} بس اللي نوّر ${m[i].s === '-' ? 'ولا حاجة' : {G:'الأخضر', Y:'الأصفر', R:'الأحمر'}[m[i].s]}.`; if (Math.abs(m[i].d - w[1]) > 0.3) return `${w[2]} نوّر ${PL.fmt(m[i].d, 1)} ثانية والمطلوب ${w[1]}.`; }
      return null; }},
    {set:{'I0.0':0}}, {run:0.3}, {exp:{'Q0.0':0, 'Q0.1':0, 'Q0.2':0}, msg:'السويتش OFF:'}, {set:{'I0.0':1}}, {run:0.3}, {exp:{'Q0.2':1}, msg:'رجع ON: يبدأ من الأخضر.'}]};

SC.toggle = {io:{inputs:[{a:'I0.0', label:'زرار النور', kind:'pb'}], outputs:[{a:'Q0.0', label:'كشاف', kind:'lamp', color:'yellow'}]},
  tests:[flips, {run:0.2}, {exp:{'Q0.0':0}, msg:'في البداية:'}, {press:'I0.0'}, {run:0.5}, {exp:{'Q0.0':1}, msg:'أول دوسة: الكشاف ينوّر ويفضل منوّر بعد ما تسيب.'}, {run:1}, {exp:{'Q0.0':1}, msg:'بعد ثانية:'},
    {press:'I0.0'}, {run:0.5}, {exp:{'Q0.0':0}, msg:'تاني دوسة: يطفي.'}, {press:'I0.0'}, {run:0.3}, {exp:{'Q0.0':1}, msg:'تالت دوسة: ينوّر.'},
    {fn:c => { c.mark.n = 0; return null; }}, {hold:'I0.0'}, {run:2}, {release:'I0.0'}, {run:0.3},
    {fn:c => c.mark.n === 1 ? null : `وانت ماسك الزرار ثانيتين الكشاف اتقلب ${c.mark.n} مرة. لازم مرة واحدة بس: محتاج نبضة Edge (سكان واحد).`}, {exp:{'Q0.0':0}, msg:'بعد الدوسة الطويلة:'}]};

SC.twohand = {io:{inputs:[{a:'I0.0', label:'إيد شمال', kind:'pb'}, {a:'I0.1', label:'إيد يمين', kind:'pb'}], outputs:[{a:'Q0.0', label:'المكبس', kind:'valve'}]},
  tests:[{run:0.2}, {exp:{'Q0.0':0}, msg:'في البداية:'}, {hold:'I0.0'}, {hold:'I0.1'}, {run:0.3}, {exp:{'Q0.0':1}, msg:'الإيدين مع بعض: المكبس ينزل.'},
    {release:'I0.1'}, {run:0.2}, {exp:{'Q0.0':0}, msg:'العامل شال إيد: المكبس لازم يقف فورًا.'},
    {hold:'I0.1'}, {run:0.3}, {exp:{'Q0.0':0}, msg:'رجّع الإيد التانية وإيد شمال لسه ماسكة من بدري: ممنوع يشتغل لحد ما يسيب الاتنين ويدوس من جديد (عشان محدش يربط زرار بشريط).'},
    {release:'I0.0'}, {release:'I0.1'}, {run:0.3}, {hold:'I0.0'}, {run:1}, {hold:'I0.1'}, {run:0.3}, {exp:{'Q0.0':0}, msg:'إيد سبقت التانية بثانية: الفرق أكتر من نص ثانية فالمكبس مايشتغلش.'},
    {release:'I0.0'}, {release:'I0.1'}, {run:0.3}, {hold:'I0.1'}, {run:0.3}, {hold:'I0.0'}, {run:0.3}, {exp:{'Q0.0':1}, msg:'التانية جت بعد 0.3 ثانية بس: ده مسموح والمكبس يشتغل.'}, {run:2}, {exp:{'Q0.0':1}, msg:'ماسك الاتنين: المكبس يفضل شغال.'},
    {release:'I0.0'}, {release:'I0.1'}, {run:0.3}, {exp:{'Q0.0':0}, msg:'ساب الاتنين:'}]};

SC.sort = {io:{inputs:[{a:'I0.0', label:'تشغيل', kind:'sw'}, {a:'I0.1', label:'حساس الطول', kind:'auto'}, {a:'I0.2', label:'عند الدفّاع', kind:'auto'}], outputs:[{a:'Q0.0', label:'السير'}, {a:'Q0.1', label:'دفّاع'}]}, plant:'sort', plantOpt:{seq:[1, 0, 1, 1, 0, 0, 1, 0]},
  tests:[{run:0.3}, {exp:{'Q0.0':0}, msg:'قبل التشغيل:'}, {set:{'I0.0':1}}, {run:0.3}, {exp:{'Q0.0':1}, msg:'التشغيل ON: السير يدور.'},
    {until:c => c.plant.res.length >= 8 || c.plant.res.some(r => r.tall !== r.pushed), max:60, msg:'الكراتين مخلصتش: السير وقف؟'},
    {fn:c => { const b = c.plant.res.find(r => r.tall !== r.pushed); return b ? (b.tall ? 'كرتونة طويلة عدّت من غير ما تتزق.' : 'الدفّاع زق كرتونة قصيرة!') : null; }},
    {set:{'I0.0':0}}, {run:0.3}, {exp:{'Q0.0':0, 'Q0.1':0}, msg:'التشغيل OFF:'}]};

SC.parking = {io:{inputs:[{a:'I0.0', label:'عربية داخلة', kind:'pb'}, {a:'I0.1', label:'عربية خارجة', kind:'pb', color:'blue'}], outputs:[{a:'Q0.0', label:'فيه أماكن'}, {a:'Q0.1', label:'كامل'}]}, plant:'parking', cmpDef:'C0',
  tests:[{run:0.2}, {exp:{'Q0.0':1, 'Q0.1':0}, msg:'الجراج فاضي:'}, {press:'I0.0'}, {press:'I0.0'}, {press:'I0.0'}, {exp:{'Q0.0':1, 'Q0.1':0}, msg:'3 عربيات جوه:'}, {press:'I0.0'}, {press:'I0.0'}, {press:'I0.0'}, {run:0.1}, {exp:{'Q0.0':0, 'Q0.1':1}, msg:'6 عربيات جوه: كامل.'},
    {press:'I0.1'}, {run:0.1}, {exp:{'Q0.0':1, 'Q0.1':0}, msg:'عربية خرجت (5 جوه):'}, {press:'I0.1'}, {press:'I0.1'}, {press:'I0.1'}, {press:'I0.1'}, {press:'I0.1'}, {press:'I0.1'}, {run:0.1}, {exp:{'Q0.0':1, 'Q0.1':0}, msg:'الجراج فضي:'},
    {press:'I0.0'}, {press:'I0.0'}, {press:'I0.0'}, {press:'I0.0'}, {press:'I0.0'}, {press:'I0.0'}, {run:0.1}, {exp:{'Q0.1':1, 'Q0.0':0}, msg:'6 تاني:'},
    {fn:c => c.e.prog.some(rg => rg.rows.some(row => row.some(el => el && el.t === 'CMP'))) ? null : 'شغال، بس التمرين عايزك تستخدم تعليمة مقارنة واحدة على الأقل (العدد أقل من 6، أو 6 وأكتر).'}]};

SC.garage = {io:{inputs:[{a:'I0.0', label:'فتح', kind:'pb'}, {a:'I0.1', label:'قفل', kind:'pb', color:'blue'}, {a:'I0.2', label:'Stop', kind:'pbnc'}, {a:'I0.3', label:'ليميت فوق', kind:'auto'}, {a:'I0.4', label:'ليميت تحت', kind:'auto'}, {a:'I0.5', label:'عين أمان', kind:'auto'}], outputs:[{a:'Q0.0', label:'طلوع'}, {a:'Q0.1', label:'نزول'}, {a:'Q0.2', label:'لمبة تحذير'}]}, plant:'garage', plantOpt:{pos:0}, cols:6,
  tests:[{watch:c => c.q('Q0.0') && c.q('Q0.1') ? 'طلوع ونزول مع بعض: الموتور هيتحرق! محتاج إنترلوك.' : c.plant.crush ? 'الباب نزل على العربية! عين الأمان لازم توقف النزول.' : null},
    {run:0.3}, {exp:{'Q0.0':0, 'Q0.1':0, 'Q0.2':0}, msg:'الباب مقفول وواقف:'}, {press:'I0.0'}, {run:0.5}, {exp:{'Q0.0':1, 'Q0.2':1}, msg:'دوست فتح: الباب يطلع ولمبة التحذير تنوّر.'},
    {until:c => c.plant.pos >= 99.5, max:8, msg:'الباب مكمّلش لفوق.'}, {run:0.3}, {exp:{'Q0.0':0, 'Q0.2':0}, msg:'وصل ليميت فوق: الموتور يقف.'}, {fn:c => c.plant.stall > 0.6 ? 'الموتور فضل شغال بعد ما الباب وصل فوق: استخدم ليميت فوق I0.3.' : null},
    {press:'I0.1'}, {run:0.5}, {exp:{'Q0.1':1, 'Q0.2':1}, msg:'دوست قفل:'}, {run:1.2}, {press:'I0.2'}, {run:0.3}, {exp:{'Q0.0':0, 'Q0.1':0}, msg:'دوست Stop وهو نازل:'},
    {press:'I0.1'}, {run:0.8}, {plant:{obst:true}}, {run:0.5}, {exp:{'Q0.1':0, 'Q0.0':1}, msg:'عربية تحت الباب وهو نازل: يقف ويطلع لوحده.'},
    {until:c => c.plant.pos >= 99.5, max:8, msg:'الباب ماطلعش لفوق بعد ما العين شافت العربية.'}, {run:0.3}, {exp:{'Q0.0':0}, msg:'رجع فوق:'},
    {press:'I0.1'}, {run:0.5}, {exp:{'Q0.1':0}, msg:'لسه فيه عربية تحت ودوست قفل: مينزلش.'}, {plant:{obst:false}}, {run:0.2}, {press:'I0.1'},
    {until:c => c.plant.pos <= 0.5, max:8, msg:'الباب ماقفلش للآخر.'}, {run:0.3}, {exp:{'Q0.1':0, 'Q0.2':0}, msg:'وصل ليميت تحت:'}]};

/* factory challenge: packing line with a 2 s warning before the belt moves (start and after every carton change) */
SC.line = {io:SC.ctu.io, plant:'pack', cmpDef:'C0',
  tests:[{run:0.2}, {press:'I0.0'}, {run:1.0}, {exp:{'Q0.0':0}, msg:'بعد Start بثانية: السير لسه مايدورش (وقت التحذير 2 ثانية).'}, {run:1.3}, {exp:{'Q0.0':1}, msg:'بعد 2 ثانية من Start: السير يدور.'},
    {run:17}, {fn:c => c.plant.carton > 6 ? `الكرتونة خدت ${c.plant.carton} علب! السير لازم يقف عند 6.` : c.plant.carton < 6 ? `الكرتونة فيها ${c.plant.carton} علب بس. لازم تكمّل 6.` : null},
    {exp:{'Q0.0':0, 'Q0.1':1}, msg:'الكرتونة كملت: السير يقف واللمبة تنوّر.'},
    {press:'I0.3'}, {run:0.4}, {exp:{'Q0.1':0, 'Q0.0':0}, msg:'غيّرت الكرتونة: اللمبة تطفي والسير يستنى 2 ثانية الأول.'}, {run:2.1}, {exp:{'Q0.0':1}, msg:'بعد 2 ثانية من تغيير الكرتونة: السير يرجع يدور لوحده من غير Start.'},
    {run:2}, {press:'I0.1'}, {run:0.3}, {exp:{'Q0.0':0}, msg:'دوست Stop:'}, {run:3}, {exp:{'Q0.0':0}, msg:'بعد Stop مفيش حاجة تدور لوحدها:'},
    {press:'I0.0'}, {run:0.8}, {exp:{'Q0.0':0}, msg:'Start تاني: التحذير 2 ثانية الأول.'}, {run:1.6}, {exp:{'Q0.0':1}, msg:'وبعدها السير يدور ويكمّل نفس الكرتونة.'}]};

/* factory challenge: three automatic mixing batches */
SC.batch3 = {io:{inputs:[{a:'I0.0', label:'Start', kind:'pb'}, {a:'I0.1', label:'Stop', kind:'pbnc'}, {a:'I0.2', label:'عوامة Low', kind:'auto'}, {a:'I0.3', label:'عوامة High', kind:'auto'}], outputs:[{a:'Q0.0', label:'بلف ملو'}, {a:'Q0.1', label:'خلاط'}, {a:'Q0.2', label:'بلف تفريغ'}, {a:'Q0.3', label:'خلص'}]}, plant:'mixer',
  tests:[{watch:c => c.q('Q0.0') && c.q('Q0.2') ? 'بلف الملو والتفريغ مفتوحين مع بعض!' : c.plant.over ? 'التانك فاض: الملو ماقفلش عند الـ High.' : c.plant.dry > 0.6 ? 'الخلاط اشتغل والتانك فاضي!' : null},
    {watch:c => { const v = c.q('Q0.2'); if (c.mark.d && !v) c.mark.b = (c.mark.b || 0) + 1; c.mark.d = v; const f = c.q('Q0.0'); if (f && !c.mark.f) c.mark.fills = (c.mark.fills || 0) + 1; c.mark.f = f; return null; }},
    {run:0.3}, {exp:{'Q0.0':0, 'Q0.1':0, 'Q0.2':0, 'Q0.3':0}, msg:'قبل Start:'}, {press:'I0.0'}, {run:0.3}, {exp:{'Q0.0':1}, msg:'بعد Start: الملو يفتح.'},
    {until:c => c.plant.level >= 90, max:12, msg:'التانك مااتملاش لحد الـ High.'}, {run:0.3}, {exp:{'Q0.0':0, 'Q0.1':1, 'Q0.2':0}, msg:'وصل High: الملو يقفل والخلاط يشتغل.'}, {run:3.2}, {exp:{'Q0.1':1, 'Q0.2':0}, msg:'الخلاط لسه مكمّلش 4 ثواني:'}, {run:1.0}, {exp:{'Q0.1':0, 'Q0.2':1}, msg:'بعد 4 ثواني خلط: الخلاط يقف والتفريغ يفتح.'},
    {until:c => c.plant.level <= 10, max:12, msg:'التانك مافضاش.'}, {run:0.6}, {exp:{'Q0.2':0, 'Q0.0':1, 'Q0.3':0}, msg:'الدفعة الأولى خلصت: التانية لازم تبدأ لوحدها (الملو يفتح).'},
    {until:c => (c.mark.b || 0) >= 3, max:60, msg:'التلات دفعات ماخلصوش: الدورة وقفت في النص؟'}, {run:0.6},
    {exp:{'Q0.0':0, 'Q0.1':0, 'Q0.2':0, 'Q0.3':1}, msg:'بعد 3 دفعات: كله يقف ولمبة خلص تنوّر.'}, {run:3}, {fn:c => c.mark.fills === 3 ? null : `الملو اتفتح ${c.mark.fills} مرات. المطلوب 3 دفعات بالظبط.`},
    {press:'I0.0'}, {run:0.3}, {exp:{'Q0.0':1, 'Q0.3':0}, msg:'Start جديد: يبدأ عدّ جديد من الأول ولمبة خلص تطفي.'}, {run:2}, {press:'I0.1'}, {run:0.3}, {exp:{'Q0.0':0, 'Q0.1':0, 'Q0.2':0}, msg:'Stop في النص: كل البلوف والخلاط يقفلوا.'}, {run:2}, {exp:{'Q0.0':0}, msg:'بعد Stop مفيش حاجة تبدأ لوحدها:'}]};

/* ================= encoder positioning: sheet-metal cut-to-length line =================
   1000 PPR encoder on a measuring roller of 200 mm circumference, counted x4 by the PLC's high-speed counter:
   4000 counts per turn → 20 counts per mm → a 500 mm piece = 10000 counts.
   I/O (engine addresses, each brand page shows its own names):
   I0.0 / I0.1 encoder A / B (Siemens HSC_1 and Delta C251 inputs) · I0.2 Start · I0.3 Stop (NC) · I0.4 shear is up
   Q0.0 feed run (inverter FWD) · Q0.1 fast speed (inverter multi-speed input, off = slow) · Q0.2 brake · Q0.3 shear down
   HC0 = the high-speed counter value (32-bit). The machine counts it between scans, like the real counter hardware. */
const ENC = {CPM:20, FAST:150, SLOW:25, ACC:600, DEC:500, BRAKE:125, COAST:30, LEN:500, TOL:1, DOWN:0.3, UP:0.3};
PL.ENC = ENC;
const eon = (e, a) => !!e.out[a];
const etx = (x, y, s, cls, anchor) => `<text x="${x}" y="${y}" class="${cls || 'pt'}"${anchor ? ` text-anchor="${anchor}"` : ''}>${s}</text>`;
const mm1 = v => PL.fmt(v, 1);
const sgn = v => (v > 0.05 ? '+' : v < -0.05 ? '−' : '±') + mm1(Math.abs(v));

PL.plants.cut = {
  drives:['I0.0', 'I0.1', 'I0.4'],
  create: o => ({pos:0, v:0, last:0, s:0, hit:false, pieces:[], frac:0, enc:0, t:0, gate:!!(o && o.gate), hc:o && o.hc != null ? o.hc : null, init:false,
    fault:null, fight:0, runP:false, fastP:false, slowAt:null, stopAt:null, vStop:0, coast:null, coastFrom:null, flash:0, gateMiss:false, short:0, cutsLost:0, fall:1}),
  step(st, e, dt){
    if (!st.init){ st.init = true; if (st.hc != null) e.hscSet('HC0', st.hc); }
    const run = eon(e, 'Q0.0'), fast = eon(e, 'Q0.1'), brake = eon(e, 'Q0.2'), down = eon(e, 'Q0.3');
    st.t += dt; st.flash = Math.max(0, st.flash - dt); st.fall = Math.min(1, st.fall + dt * 1.6);
    /* inverter ramps · brake · coasting */
    if (run && brake){ st.fight += dt; if (st.fight > 0.06 && !st.fault) st.fault = 'الموتور Q0.0 شغال والفرامل Q0.2 ماسكة في نفس الوقت: الموتور هيسخن والفرامل هتتاكل. الفرامل تمسك بس والموتور واقف.'; } else st.fight = 0;
    if (run && !brake){ const tg = fast ? ENC.FAST : ENC.SLOW; st.v = st.v < tg ? Math.min(tg, st.v + ENC.ACC * dt) : Math.max(tg, st.v - ENC.DEC * dt); }
    else st.v = Math.max(0, st.v - (brake ? ENC.BRAKE : ENC.COAST) * dt);
    if (run && st.s > 0.04 && !st.fault) st.fault = 'الموتور Q0.0 اشتغل والسكينة لسه مش فوق (I0.4 = 0): الصاج هيتزق في السكينة. الصاج يمشي بس لما السكينة تبقى فوق.';
    /* run falling edge: remember where and how fast it stopped, then measure the coasting */
    if (st.runP && !run){ st.stopAt = e.num('HC0'); st.vStop = st.v; st.coastFrom = st.pos; st.coast = null; }
    if (st.fastP && !fast && run) st.slowAt = e.num('HC0');
    if (st.runP && !st.fastP && fast) st.slowAt = null;
    if (!st.runP && run){ st.slowAt = null; }
    st.runP = run; st.fastP = fast;
    const dx = st.v * dt; st.pos += dx;
    if (st.coastFrom != null && st.v === 0 && !run){ st.coast = st.pos - st.coastFrom; st.coastFrom = null; }
    /* encoder → high-speed counter (whole counts) */
    st.frac += dx * ENC.CPM; const n = Math.floor(st.frac); st.frac -= n;
    if (n){ st.enc += n; if (!st.gate || e.hcEn.HC0) e.hscAdd('HC0', n); else st.gateMiss = true; }
    e.setIn('I0.0', st.v > 0 && Math.floor(st.enc / 60) % 2 ? 1 : 0); e.setIn('I0.1', st.v > 0 && Math.floor((st.enc + 30) / 60) % 2 ? 1 : 0);
    /* shear: 0 = up … 1 = down. It touches the sheet at 0.6 and cuts at the bottom */
    const s0 = st.s;
    st.s = down ? Math.min(1, st.s + dt / ENC.DOWN) : Math.max(0, st.s - dt / ENC.UP);
    if (s0 < 0.6 && st.s >= 0.6 && st.v > 0.5 && !st.fault) st.fault = `السكينة نزلت والصاج لسه ماشي (${mm1(st.v)} mm/s): البلاطة هتتقطع مايلة والسكينة ممكن تتكسر. استنى الصاج يقف خالص (تايمر صغير بعد الوقوف) وبعدين نزّل السكينة.`;
    if (st.s >= 1 && !st.hit){ st.hit = true; const len = st.pos - st.last; st.last = st.pos; st.pieces.push({len, err:len - ENC.LEN, t:st.t}); st.flash = 0.25; st.fall = 0; }
    if (!down && s0 > 0 && !st.hit && st.s < s0 && s0 < 1 && st.short === 0) st.short = 1;
    if (st.s <= 0){ if (st.short === 1) st.cutsLost++; st.short = 0; st.hit = false; }
    e.setIn('I0.4', st.s < 0.03 ? 1 : 0);
  },
  head: st => st.pos - st.last,
  svg(st, e){
    const run = eon(e, 'Q0.0'), fast = eon(e, 'Q0.1'), brake = eon(e, 'Q0.2'), down = eon(e, 'Q0.3');
    const cv = e.num('HC0'), head = st.pos - st.last;
    const W = 360, H = 228, Y = 128; /* sheet line */
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="خط تقطيع صاج بالطول: العدّاد ${cv} count، ${mm1(cv / ENC.CPM)} mm">`;
    s += `<defs><linearGradient id="encSt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d3da"/><stop offset=".5" stop-color="#9fadb7"/><stop offset="1" stop-color="#7d8b95"/></linearGradient></defs>`;
    /* ---- HUD: counter · speed · brake ---- */
    s += `<rect x="4" y="4" width="148" height="44" rx="7" fill="#11181c" stroke="#2f3b42"/>`;
    s += etx(12, 17, 'HSC  HC0', 'pt enc-lab') + `<text x="144" y="38" text-anchor="end" class="enc-cv">${cv}</text>` + etx(12, 42, mm1(cv / ENC.CPM) + ' mm', 'pt enc-mm');
    const spd = !run ? (st.v > 0.5 ? ['COAST', '#ff9a1a'] : ['STOP', '#7b858c']) : fast ? ['FAST', '#2fd35a'] : ['SLOW', '#ffc21a'];
    s += `<rect x="158" y="4" width="62" height="20" rx="10" fill="${spd[1]}"/>` + etx(189, 18, spd[0], 'pt enc-chip', 'middle');
    s += `<rect x="158" y="28" width="62" height="20" rx="10" fill="${brake ? '#c0352b' : '#3b4247'}"/>` + etx(189, 42, brake ? 'BRAKE' : 'brake off', 'pt enc-chip', 'middle');
    s += `<rect x="226" y="4" width="130" height="44" rx="7" fill="none" stroke="var(--board-line)"/>`;
    s += etx(232, 18, `${mm1(st.v)} mm/s`, 'pt') + `<rect x="232" y="24" width="118" height="6" rx="3" fill="#3b4247"/><rect x="232" y="24" width="${(118 * Math.min(1, st.v / ENC.FAST)).toFixed(1)}" height="6" rx="3" fill="${spd[1]}"/>`;
    s += etx(350, 43, 'زحلقة', 'pt ar', 'end') + etx(232, 43, st.coast != null ? `${Math.round(st.coast * ENC.CPM)} count · ${mm1(st.coast)} mm` : '—', 'pt enc-sm');
    /* ---- coil + feed rolls + motor ---- */
    const cr = Math.max(17, 26 - st.pos / 3000), ca = (st.pos / (2 * Math.PI * cr) * 360) % 360;
    s += `<g transform="translate(36 ${Y - cr - 1})"><circle r="${cr + 1}" fill="#5d6a73"/><g transform="rotate(${(-ca).toFixed(1)})">${[0, 1, 2, 3].map(i => `<circle r="${(cr - 3 - i * 3.6).toFixed(1)}" fill="none" stroke="#94a3ad" stroke-width="1.2"/>`).join('')}<path d="M0 -6V6M-6 0H6" stroke="#2a3035" stroke-width="2"/></g><circle r="4" fill="#2a3035"/></g>`;
    s += `<path d="M36 ${Y - 1}L${W - 8} ${Y - 1}" stroke="none"/>`;
    s += `<rect x="36" y="${Y - 1.5}" width="164" height="3" fill="url(#encSt)"/>`;
    const fr = (st.pos * 4) % 360;
    [Y - 8, Y + 8].forEach(cy => { s += `<g transform="translate(86 ${cy})"><circle r="6.5" fill="#8a949b" stroke="#2a3035"/><path d="M-5 0H5" stroke="#2a3035" stroke-width="1.5" transform="rotate(${(cy < Y ? -fr : fr).toFixed(1)})"/></g>`; });
    s += PL.motorSvg(86, Y + 38, 22, (st.pos * 6) % 360, run) + etx(104, Y + 36, 'Q0.0', 'pt pm');
    s += etx(86, Y + 66, run ? (fast ? 'سريع' : 'بطيء') : 'واقف', 'pt ar', 'middle');
    /* ---- encoder measuring roller ---- */
    const ex = 136, er = 11, ey = Y - 1.5 - er, ea = (st.pos / 200 * 360) % 360, led = st.v > 0.2 && Math.floor(st.enc / 25) % 2 === 1;
    s += `<path d="M${ex} ${ey}L${ex + 22} ${ey - 26}" stroke="#5d6469" stroke-width="3"/><circle cx="${ex + 22}" cy="${ey - 26}" r="3" fill="#5d6469"/>`;
    s += `<g transform="translate(${ex} ${ey})"><circle r="${er}" fill="#2a3035" stroke="#8a949b" stroke-width="2"/><g transform="rotate(${ea.toFixed(1)})">${[0, 60, 120, 180, 240, 300].map(a => `<path d="M0 0L0 -${er - 2}" stroke="#cfd6db" stroke-width="1.6" transform="rotate(${a})"/>`).join('')}<circle cx="0" cy="-${er - 3}" r="1.6" fill="#ff9a1a"/></g><circle r="2.5" fill="#8a949b"/></g>`;
    s += `<rect x="${ex + 4}" y="${ey - 22}" width="20" height="14" rx="3" fill="#1d2a33" stroke="#3a9bff"/><circle cx="${ex + 19}" cy="${ey - 15}" r="2.6" fill="${led ? '#2fd35a' : '#2a3a2f'}"${led ? ' class="glowc" style="--gc:#2fd35a"' : ''}/>`;
    s += etx(ex - 4, ey - 26, '1000 PPR', 'pt pm', 'end');
    s += `<path d="M${ex + 24} ${ey - 15}q14 0 18 -16" fill="none" stroke="#3a9bff" stroke-width="1.4" stroke-dasharray="3 2"/>`;
    /* ---- shear ---- */
    const sx = 204, bladeY = Y - 30 + st.s * 31;
    s += `<rect x="${sx - 16}" y="${Y - 52}" width="5" height="64" fill="#5d6469"/><rect x="${sx + 11}" y="${Y - 52}" width="5" height="64" fill="#5d6469"/><rect x="${sx - 18}" y="${Y - 56}" width="36" height="7" rx="2" fill="#4a5257"/>`;
    s += `<rect x="${sx - 4}" y="${Y - 66}" width="8" height="12" fill="#3a9bff" opacity=".8"/><path d="M${sx} ${Y - 49}V${bladeY - 6}" stroke="#cfd6db" stroke-width="3"/>`;
    s += `<path d="M${sx - 10} ${bladeY - 7}h20v5l-20 4z" fill="${down ? '#ffc21a' : '#b9c3c9'}" stroke="#2a3035"/>`;
    s += `<rect x="${sx - 12}" y="${Y + 2}" width="12" height="9" fill="#4a5257"/>`;
    s += PL.lampSvg(sx + 26, Y - 60, 4, PL.LCOL.green, st.s < 0.03) + etx(sx + 33, Y - 57, 'I0.4', 'pt pm');
    s += etx(sx, Y - 70, 'Q0.3', 'pt pm', 'middle');
    if (st.flash > 0) s += `<g opacity="${(st.flash / 0.25).toFixed(2)}"><path d="M${sx} ${Y}l-9 -7M${sx} ${Y}l9 -8M${sx} ${Y}l-7 8M${sx} ${Y}l8 7" stroke="#ffd400" stroke-width="2"/></g>`;
    /* ---- run-out table + ruler (0 … 600 mm past the shear) ---- */
    const t0 = sx, sc = 0.24, tx0 = x => t0 + x * sc, tEnd = W - 6;
    s += `<rect x="${t0}" y="${Y + 2}" width="${tEnd - t0}" height="5" fill="#4a5257"/>`;
    for (let m = 0; m <= 600; m += 50){ const x = tx0(m); if (x > tEnd) break; s += `<path d="M${x.toFixed(1)} ${Y + 7}v${m % 100 ? 3 : 6}" stroke="var(--muted)" stroke-width="1"/>`; if (m % 250 === 0) s += etx(x, Y + 22, String(m), 'pt pm', 'middle'); }
    s += `<path d="M${tx0(450).toFixed(1)} ${Y - 24}V${Y + 2}" stroke="#ffc21a" stroke-width="1.5" stroke-dasharray="3 2"/>` + etx(tx0(450), Y - 27, '9000', 'pt pm', 'middle');
    s += `<path d="M${tx0(500).toFixed(1)} ${Y - 14}V${Y + 2}" stroke="#2fd35a" stroke-width="2"/>` + etx(tx0(500) + 2, Y - 16, '10000', 'pt pm');
    const hx = Math.min(tEnd, tx0(Math.max(0, head))), over = head > ENC.LEN + ENC.TOL;
    if (head > 0.2) s += `<rect x="${t0}" y="${Y - 1.5}" width="${(hx - t0).toFixed(1)}" height="3" fill="${over ? '#ff6a5a' : 'url(#encSt)'}"/><path d="M${hx.toFixed(1)} ${Y - 6}v8" stroke="${over ? '#ff4a3d' : '#cfd6db'}" stroke-width="1.6"/>`;
    s += etx(Math.min(tEnd - 2, Math.max(t0 + 30, hx)), Y + 34, mm1(Math.max(0, head)) + ' mm', 'pt' + (over ? ' enc-badb' : ''), 'end');
    /* ---- falling piece + stack ---- */
    const P = st.pieces, n = P.length, last = P[n - 1];
    if (last && st.fall < 1){ const f = st.fall, w = Math.min(tEnd - t0, last.len * sc), y = Y - 1.5 + f * (H - 30 - Y), x = t0 + 4 + f * 30; s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="3" fill="url(#encSt)" transform="rotate(${(f * 4).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }
    const shown = P.slice(Math.max(0, n - 12), st.fall < 1 ? n - 1 : n);
    shown.forEach((p, i) => { const w = Math.min(122, p.len * sc), bad = Math.abs(p.err) > ENC.TOL; s += `<rect x="${238}" y="${H - 8 - i * 3.6}" width="${w.toFixed(1)}" height="3" rx="1" fill="${bad ? '#ff6a5a' : 'url(#encSt)'}" stroke="${bad ? '#c0352b' : '#6b7a84'}" stroke-width=".5"/>`; });
    s += `<rect x="232" y="${H - 4}" width="128" height="3" fill="#4a5257"/>`;
    /* ---- piece counter + last error ---- */
    s += `<rect x="128" y="${H - 50}" width="96" height="44" rx="7" fill="#11181c" stroke="#2f3b42"/>`;
    s += etx(176, H - 34, `القطع: ${n}`, 'pt ar enc-w', 'middle');
    if (last){ const bad = Math.abs(last.err) > ENC.TOL; s += etx(176, H - 14, `${mm1(last.len)} mm (${sgn(last.err)})`, 'pt ' + (bad ? 'enc-bad' : 'enc-ok'), 'middle'); }
    else s += etx(176, H - 14, `الهدف 500 ± ${ENC.TOL} mm`, 'pt ar enc-w', 'middle');
    if (st.fault) s += `<rect x="6" y="${H - 50}" width="116" height="44" rx="7" fill="#c0352b"/>` + etx(64, H - 32, '⚠ خطأ في التشغيل', 'pt pw ar', 'middle') + etx(64, H - 16, 'شوف نتيجة الاختبار', 'pt pw ar', 'middle');
    else if (st.gate && st.gateMiss && st.v > 0) s += `<rect x="6" y="${H - 50}" width="116" height="44" rx="7" fill="#b86e00"/>` + etx(64, H - 32, 'العدّاد مش بيعدّ!', 'pt pw ar', 'middle') + etx(64, H - 16, 'محتاج DCNT C251', 'pt pw', 'middle');
    return s + '</svg>';
  }
};

/* ---------- the auto-check (engine addresses; the brand layer translates them) ---------- */
const lenMsg = (c, i) => {
  const p = c.plant.pieces[i]; if (!p) return null;
  const e = p.err, a = Math.abs(e);
  if (a <= ENC.TOL) return null;
  const head = `القطعة رقم ${i + 1} طلعت ${mm1(p.len)} mm (${e > 0 ? 'زيادة' : 'ناقصة'} ${mm1(a)} mm)، والمسموح 500 ± ${ENC.TOL} mm.`;
  if (c.plant.cutsLost) return head + ' السكينة رجعت قبل ما توصل لتحت فمقطعتش: وقت التقطيع لازم يكون أطول من وقت نزول السكينة (0.3 ثانية).';
  if (e > 200) return head + ' الصاج ماتقطعش في وقته: العدّاد HC0 لازم يتصفّر بعد كل قطعة عشان القطعة اللي بعدها تتقاس من الأول.';
  if (e > ENC.TOL && e < 12) return head + ' الماكينة بتزحلق شوية بعد ما الموتور يفصل والفرامل تمسك (Overshoot). بص على «زحلقة» في الشاشة واطرحها من الهدف: يعني أوقف الموتور عند 10000 ناقص الزحلقة.';
  if (e >= 12) return head + ' الموتور وقف متأخر قوي: لازم يبطّأ عند 9000 ويقف قبل 10000.';
  return head + ' الموتور وقف بدري: راجع رقم المقارنة اللي بتوقف عنده.';
};
const settled = c => { c.mark.k = c.plant.pieces.length; return null; };
PL.BXS.cut = {
  io:{inputs:[{a:'I0.2', label:'Start', kind:'pb'}, {a:'I0.3', label:'Stop', kind:'pbnc'}, {a:'I0.4', label:'السكينة فوق', kind:'auto'}],
    outputs:[{a:'Q0.0', label:'تشغيل الموتور (FWD)', kind:'vfd'}, {a:'Q0.1', label:'سرعة عالية', kind:'vfd'}, {a:'Q0.2', label:'فرامل', kind:'brake'}, {a:'Q0.3', label:'السكينة تنزل', kind:'valve'}]},
  plant:'cut', cmpDef:'HC0', hsc:true, cols:5,
  cases:[{plantOpt:{hc:6000}, steps:[
    {watch:c => c.plant.fault || null},
    {watch:c => c.plant.pos - c.plant.last > 1150 ? (c.plant.gate && c.plant.gateMiss ? 'العدّاد السريع HC0 مش بيعدّ والصاج ماشي لحد ما خرج برّه الترابيزة: في دلتا العدّاد السريع مابيعدّش غير لما تعليمة DCNT بتاعته تتنفّذ، فاعمل رانج DCNT من غير شروط.' : 'الصاج عدّى أكتر من متر بعد السكينة ومحدش وقفه: لازم الموتور Q0.0 يفصل لما العدّاد HC0 يوصل لطول القطعة.') : null},
    {run:0.3}, {exp:{'Q0.0':0, 'Q0.1':0, 'Q0.3':0}, msg:'قبل Start: الماكينة لازم تكون واقفة.'},
    {exp:{'Q0.2':1}, msg:'والماكينة واقفة الفرامل Q0.2 لازم تكون ماسكة عشان الصاج مايتحركش.'},
    {press:'I0.2'}, {run:0.05}, {exp:{'Q0.0':1, 'Q0.1':1, 'Q0.2':0}, msg:'دوست Start: الموتور يدور سريع (Q0.0 و Q0.1) والفرامل تفك.'},
    {fn:c => c.e.num('HC0') < 1500 ? null : `العدّاد HC0 كان فيه 6000 من الشغل اللي فات، ودوست Start والعدّاد لسه ${c.e.num('HC0')}: Start لازم يصفّر HC0 (بـ Edge، مرة واحدة) قبل ما القطعة تتقاس.`},
    {until:c => !c.q('Q0.1') || !c.q('Q0.0'), max:6, msg:'الموتور فضل سريع 6 ثواني ومش بيبطّأ: لازم Q0.1 يفصل لما HC0 يوصل 9000.'},
    {fn:c => { const n = c.e.num('HC0');
      if (!c.q('Q0.0')) return `الموتور وقف من السرعة العالية عند ${n} count من غير ما يبطّأ، فالصاج زحلق كتير. لازم يتحوّل بطيء (Q0.1 يفصل) عند 9000 (450 mm) ويكمّل بطيء لحد الآخر.`;
      if (n < 8900) return `الموتور بطّأ بدري عند ${n} count (${mm1(n / ENC.CPM)} mm): المطلوب يفضل سريع لحد 9000 عشان الإنتاج.`;
      if (n > 9100) return `الموتور بطّأ متأخر عند ${n} count: المطلوب عند 9000.`;
      return null; }},
    {until:c => !c.q('Q0.0'), max:4, msg:'الصاج ماشي بطيء ومش بيقف: لازم Q0.0 يفصل قبل ما HC0 يوصل 10000.'},
    {run:0.02}, {exp:{'Q0.2':1, 'Q0.3':0}, msg:'الموتور فصل: الفرامل Q0.2 تمسك على طول، والسكينة لسه ماتنزلش.'},
    {until:c => c.plant.pieces.length >= 1, max:4, msg:'الصاج وقف بس السكينة ماقطعتش: بعد ما الصاج يقف خالص نزّل السكينة Q0.3 بتايمر (نص ثانية مثلًا).'},
    {fn:c => lenMsg(c, 0)},
    {until:c => c.plant.pieces.length >= 3, max:15, msg:'بعد القطعة الأولى الماكينة ماكمّلتش لوحدها: بعد ما السكينة ترجع فوق (I0.4) صفّر HC0 والصاج يمشي تاني لوحده.'},
    {fn:c => lenMsg(c, 1) || lenMsg(c, 2)},
    {fn:c => c.e.num('C0') === c.plant.pieces.length ? null : `عدّاد القطع فيه ${c.e.num('C0')} لكن اللي اتقطع فعلًا ${c.plant.pieces.length} قطع: اعمل CTU يعدّ كل نزلة للسكينة (من Q0.3).`},
    {until:c => c.q('Q0.0') && c.e.num('HC0') > 4000, max:8, msg:'الماكينة مارجعتش تمشي بعد القطعة التالتة.'},
    {fn:settled}, {press:'I0.3'},
    {exp:{'Q0.0':0, 'Q0.1':0, 'Q0.2':1, 'Q0.3':0}, msg:'دوست Stop والصاج ماشي: الموتور يقف والفرامل تمسك على طول.'},
    {run:2.5}, {exp:{'Q0.0':0, 'Q0.3':0}, msg:'بعد Stop مفيش حاجة تتحرك لوحدها، ولا السكينة تنزل.'},
    {fn:c => c.plant.pieces.length === c.mark.k ? null : 'بعد Stop السكينة نزلت وقطعت: Stop لازم يوقف الدورة كلها.'},
    {press:'I0.2'}, {run:0.1}, {exp:{'Q0.0':1}, msg:'Start تاني بعد Stop: الماكينة ترجع تشتغل.'},
    {until:c => c.plant.pieces.length >= c.mark.k + 2, max:14, msg:'بعد Start التاني الماكينة مكمّلتش تقطّع.'},
    {fn:c => lenMsg(c, c.mark.k + 1)},
    {press:'I0.3'}, {run:0.5}, {exp:{'Q0.0':0, 'Q0.2':1}, msg:'Stop في الآخر:'}]}]
};

/* ================= lesson simulators in the real vendor look =================
   PL.sim (plc.js) hands every lesson exercise set to PL.lessonSim: a brand bar (Siemens · Allen-Bradley · Delta · simple)
   above the same brandSim the brand pages use, in lesson mode. The choice is one per learner (localStorage 'plc-brand')
   and switches every simulator on the page together. An exercise whose solution needs an instruction the brand doesn't
   have (Delta: TOF, CTD, SCL · Allen-Bradley: P/N edges) opens on Siemens with a one-line note. */
const LBKEY = 'plc-brand';
const LBOPTS = [['sie', 'Siemens', 'TIA Portal'], ['ab', 'Allen-Bradley', 'Studio 5000'], ['dvp', 'Delta', 'ISPSoft'], ['plain', 'مبسّط', 'شكل عام']];
function lbGet(){ try { const v = localStorage.getItem(LBKEY); return LBOPTS.some(o => o[0] === v) ? v : 'sie'; } catch (e){ return 'sie'; } }
function lbSet(v){ try { localStorage.setItem(LBKEY, v); } catch (e){} }
/* instructions an exercise needs that brand B can't show */
function lbMissing(b, x){
  const B = BR[b], ids = new Set(B.pal.map(p => p.id)), miss = new Set();
  [x.sol, x.start].forEach(def => { if (def) ENG.program(def, x.cols || 5).forEach(rg => rg.rows.forEach(row => row.forEach(el => { if (el && el.t !== 'W' && !ids.has(B.idOf(el))) miss.add(el.t); }))); });
  return Array.from(miss);
}
const LBX = [];
/* lesson I/O have Arabic labels: give Siemens / Allen-Bradley real-looking tag names, and Delta device comments */
const LBN = {'Stop':'Stop_PB', 'Start':'Start_PB', 'موتور':'Motor', 'لمبة':'Lamp', 'عين':'Photo_Eye', 'طلمبة':'Pump', 'تشغيل':'Run_Sw', 'السير':'Conveyor', 'أوفرلود':'Overload', 'Trip':'Trip_Lamp',
  'Low':'Level_Low', 'High':'Level_High', 'نزول':'Down', 'ملو':'Fill_Valve', 'مفتاح فوق':'Sw_Upstairs', 'مفتاح تحت':'Sw_Downstairs', 'مستوى raw':'Level_Raw', 'مستوى %':'Level_Pct', 'مروحة':'Fan',
  'لمبة إنذار':'Alarm_Lamp', 'كملت':'Batch_Done', 'كرتونة جديدة':'New_Box', 'كامل':'Full_Lamp', 'قفل':'Close_PB', 'فيه أماكن':'Free_Lamp', 'فوق':'Top_LS', 'فتح':'Open_PB', 'عند الدفّاع':'At_Pusher',
  'عربية داخلة':'Car_In', 'عربية خارجة':'Car_Out', 'طول':'Long_Sensor', 'طلوع':'Up', 'ضغط عالي':'High_Press', 'سويتش':'Switch', 'سلكتور':'Selector', 'سارينة':'Horn', 'زرار':'Push_PB', 'دفّاع':'Pusher',
  'خلف':'Rev', 'خلص':'Done', 'خلاط':'Mixer', 'تفريغ':'Drain_Valve', 'تحت':'Bottom_LS', 'تأكيد':'Ack_PB', 'المكبس':'Press', 'اللمبة':'Lamp', 'إيد يمين':'Hand_Right', 'إيد شمال':'Hand_Left', 'أمام':'Fwd',
  'أصفر':'Amber', 'أخضر':'Green', 'أحمر':'Red', 'Start محلي':'Start_Local', 'Start بعيد':'Start_Remote', 'KM3 Y':'KM3_Star', 'KM2 خلف':'KM2_Rev', 'KM2 Δ':'KM2_Delta', 'KM1 أمام':'KM1_Fwd', 'KM1':'KM1'};
function lbTags(b, x){
  if (x.tags) return x.tags;
  const io = (x.io.inputs || []).concat(x.io.outputs || []).concat(x.syms || []), seen = {};
  return io.filter(i => i.a && /^(I|Q|M)\d/.test(i.a)).map(i => {
    if (b === 'dvp') return {n:DVP.abs(i.a), a:i.a, c:String(i.label || '').slice(0, 24)};
    let n = LBN[String(i.label || '').trim()] || (/^[A-Za-z][A-Za-z0-9_ ]*$/.test(i.label || '') ? i.label.trim().replace(/\s+/g, '_') : (i.a[0] === 'I' ? 'DI_' : i.a[0] === 'Q' ? 'DO_' : 'Flag_') + i.a.replace('.', '_'));
    if (seen[n]) n += '_' + i.a.replace('.', '_'); seen[n] = 1;
    return {n, a:i.a};
  });
}
PL.lessonSim = function(host, opt){
  host.classList.add('lbx');
  host.innerHTML = `<div class="lbx-bar" role="group" aria-label="ماركة الـ PLC"><span class="lbx-l">اشتغل على:</span>${LBOPTS.map(o => `<button type="button" class="lbx-b lbx-${o[0]}" data-b="${o[0]}" aria-pressed="false"><b dir="${o[0] === 'plain' ? 'auto' : 'ltr'}">${o[1]}</b><span dir="${o[0] === 'plain' ? 'auto' : 'ltr'}">${o[2]}</span></button>`).join('')}</div><p class="lbx-note" hidden></p><div class="lbx-in"></div>`;
  const bar = $('.lbx-bar', host), note = $('.lbx-note', host);
  let inner = $('.lbx-in', host), api = null, cur = null;
  function mount(b){
    if (b === cur) return;
    cur = b;
    if (PL.preview.cur) PL.preview.stop();
    $$('.lbx-b', bar).forEach(x => x.setAttribute('aria-pressed', x.dataset.b === b ? 'true' : 'false'));
    let use = b; note.hidden = true;
    if (b !== 'plain'){
      const miss = Array.from(new Set(opt.exercises.map(x => lbMissing(b, x)).flat()));
      if (miss.length && b !== 'sie'){ use = 'sie'; const list = miss.map(m => iso(m)).join(' / '), B = BR[b].name; note.innerHTML = `التمرين ده فيه ${list}، ودي مش موجودة بنفس الشكل في ${B}، فهيفتح على Siemens.`; note.hidden = false; }
    }
    const fresh = document.createElement('div'); fresh.className = 'lbx-in';
    inner.replaceWith(fresh); inner = fresh;
    /* the lesson's column count, and a brand's own way of writing the solution (ex.solB.sie …) */
    const exs = opt.exercises.map(x => { const o = Object.assign({}, x); if (opt.cols && !o.cols) o.cols = opt.cols; if (x.solB && x.solB[use]) o.sol = x.solB[use]; if (x.hintB && x.hintB[use]) o.hint = x.hintB[use]; if (use !== 'plain') o.tags = lbTags(use, x); return o; });
    api = use === 'plain' ? PL.plainSim(inner, opt) : PL.brandSim(inner, {brand:use, exercises:exs, lesson:opt.lesson});
  }
  bar.addEventListener('click', ev => { const t = ev.target.closest('[data-b]'); if (!t) return; lbSet(t.dataset.b); LBX.forEach(f => f(t.dataset.b)); });
  LBX.push(mount);
  mount(lbGet());
  const w = {host, get brand(){ return cur; }, get sim(){ return api; }, exercises:opt.exercises, lesson:opt.lesson, mount};
  ['select', 'check', 'load', 'press', 'pick', 'setEl', 'lint'].forEach(k => { w[k] = (...a) => api[k](...a); });
  ['ex', 'prog', 'engine', 'plant', 'preview', 'demo'].forEach(k => Object.defineProperty(w, k, {get:() => api[k]}));
  return w;
};

})();
