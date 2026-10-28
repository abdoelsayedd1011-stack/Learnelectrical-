/* حاسبة مصمّم اللوحات – LearnElectricals (MSA UI)
   One factory project (1000 kVA, 400 V, TN-S) carried through eight design steps. One shared state
   (localStorage 'panel-calc-v1'); every tab reads the results of the tabs before it, and the single-line
   diagram on top shows the live values and a green / amber / red status for each node.
   All table values are typical values for learning («قيم نموذجية للتعلّم»). */
(function(){
'use strict';
const $ = IL.$, $$ = IL.$$, esc = IL.esc, fmt = IL.fmt;
IL.hubTheme();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const L = s => `<bdi class="ltr mono">${s}</bdi>`;
/* Arabic sentence with Latin formulas: isolate every Latin/number run as LTR so it does not flip */
const LTR_RUN = /[A-Za-z0-9√(][A-Za-z0-9Ωµ°√±≤≥<>=×·()+\-−.,%/²³_ →↔'&;^]*[A-Za-z0-9Ωµ°%)²³;]|[A-Za-z0-9]/g;
const ar = s => esc(s).replace(LTR_RUN, m => `<bdi dir="ltr">${m}</bdi>`);
const clone = o => JSON.parse(JSON.stringify(o));
const SQ3 = Math.sqrt(3), U = 400, U0 = 230;
const f1 = v => fmt(v, 1), f2 = v => fmt(v, 2), f0 = v => fmt(v, 0);
const near = (v, t, tol) => isFinite(v) && Math.abs(v - t) <= Math.abs(t) * (tol == null ? 0.02 : tol);

/* =====================================================================
   1. project data (canonical numbers shared with the lessons)
   ===================================================================== */
const TRF = {S:1000, uk:0.06, c:1.05};
TRF.In = TRF.S * 1000 / (SQ3 * U);                       // 1443.4 A
TRF.Z = TRF.uk * U * U / (TRF.S * 1000);                 // 0.0096 Ω
TRF.R = 0.00168; TRF.X = Math.sqrt(TRF.Z * TRF.Z - TRF.R * TRF.R);
TRF.Ik = TRF.In / TRF.uk / 1000;                         // 24.06 kA (In/uk)
TRF.Ikmax = TRF.c * TRF.Ik;                              // 25.26 kA (c = 1.05)
const KS = 0.9, GROWTH = 1.25;
const TR_OPT = [630, 800, 1000, 1250, 1600];
const ACB_FR = [800, 1000, 1250, 1600, 2000, 2500];

/* load schedule rows */
const ROWS = [
  {f:'smdb', n:'أحمال الإنتاج', kw:400, q:1, ku:0.6, cos:0.75, eta:1},
  {f:'mcc', n:'مضخات P-1…P-4 (3 عاملة + 1 احتياطية)', kw:15, q:4, ku:0.75, cos:0.85, eta:0.92, mot:true},
  {f:'mcc', n:'ضواغط C-1، C-2', kw:37, q:2, ku:1, cos:0.86, eta:0.94, mot:true},
  {f:'mcc', n:'مبرّد المياه CH-1', kw:75, q:1, ku:1, cos:0.87, eta:0.95, mot:true},
  {f:'ldb', n:'إنارة وأحمال أحادية الطور', kw:40, q:1, ku:0.9, cos:0.9, eta:1, ph:0.4},
  {f:'acdb', n:'وحدات التكييف', kw:220, q:1, ku:0.8, cos:0.8, eta:1}
];
const FD = [
  {id:'smdb', tag:'SMDB', n:'لوحة الإنتاج الفرعية', L:40, fin:2.0, lim:5},
  {id:'mcc', tag:'MCC', n:'لوحة المحركات', L:60, fin:1.5, lim:5},
  {id:'ldb', tag:'LDB', n:'لوحة الإنارة', L:60, fin:1.5, lim:3},
  {id:'acdb', tag:'ACDB', n:'لوحة التكييف', L:70, fin:2.0, lim:5}
];
const FDM = {}; FD.forEach(f => FDM[f.id] = f);
/* feeder P and Q (kW, kVAR, electrical input) */
function feederPQ(id){
  let P = 0, Q = 0;
  ROWS.filter(r => r.f === id).forEach(r => { const p = r.kw * r.q * r.ku / r.eta; P += p; Q += p * Math.tan(Math.acos(r.cos)); });
  return {P, Q, S:Math.hypot(P, Q), cos:P / Math.hypot(P, Q)};
}
const PQ = {}; FD.forEach(f => PQ[f.id] = feederPQ(f.id));
const IB = {};
FD.forEach(f => { const r = ROWS.find(x => x.f === f.id); IB[f.id] = r.ph ? r.ph * PQ[f.id].S * 1000 / U0 : PQ[f.id].S * 1000 / (SQ3 * U); });
const MOT = {kw:15, cos:0.85, eta:0.92}; IB.mot = MOT.kw * 1000 / (SQ3 * U * MOT.cos * MOT.eta);   // 27.7 A
const MDB = (() => { let P = 0, Q = 0; FD.forEach(f => { P += PQ[f.id].P; Q += PQ[f.id].Q; }); P *= KS; Q *= KS; const S = Math.hypot(P, Q); return {P, Q, S, Ib:S * 1000 / (SQ3 * U), cos:P / S}; })();
IB.mdb = MDB.Ib;                                         // 1060.8 A
const TR_OK = TR_OPT.find(s => s >= MDB.S * GROWTH);     // 1000 kVA
const INC_OK = s => ACB_FR.find(a => a >= s * 1000 / (SQ3 * U));

/* breakers (typical catalogue) */
const BT = {
  mcb:{n:'MCB', fr:[6, 10, 16, 20, 25, 32, 40, 50, 63], ir:[1], icu:[6, 10]},
  tm:{n:'MCCB TM', fr:[63, 100, 160, 250], ir:[0.7, 0.8, 0.9, 1], icu:[25, 36, 50]},
  el:{n:'MCCB Electronic', fr:[160, 250, 400, 630], ir:[0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 1], icu:[36, 50, 70]},
  acb:{n:'ACB', fr:ACB_FR, ir:[0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1], icu:[42, 50, 65, 85]}
};
const BTN = {mcb:'MCB (IEC 60898)', tm:'MCCB حراري مغناطيسي', el:'MCCB إلكتروني', acb:'ACB'};
const ACB_IR = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1], ISD = [1.5, 2, 3, 4, 5, 6, 8, 10], TSD = [0.1, 0.2, 0.3, 0.4], ACB_II = [2, 3, 4, 6, 8, 10, 12, 15, 0];
const MCC_IR = BT.el.ir, MCC_II = [2, 4, 6, 8, 10, 12, 15, 0];
const MOT_IR = [20, 25, 28, 32, 36, 40, 45, 50], MOT_II = [6, 8, 10, 12, 13, 14];
const TR_A = 12, TR_M = 8;                               // long-time delay tr at 6·Ir (s)

/* cables: IEC 60364-5-52 typical values, 3 loaded conductors */
const SZ = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];
const N_ = null;
const AMP = {
  'Cu-PVC':{C:[17.5, 24, 32, 41, 57, 76, 96, 119, 144, 184, 223, 259, 299, 341, 403, 464], E:[18.5, 25, 34, 43, 60, 80, 101, 126, 153, 196, 238, 276, 319, 364, 430, 497], D:[18, 24, 30, 38, 50, 64, 82, 98, 116, 143, 169, 192, 217, 243, 280, 316]},
  'Cu-XLPE':{C:[22, 30, 40, 51, 70, 94, 119, 148, 180, 232, 282, 328, 379, 434, 514, 593], E:[23, 32, 42, 54, 75, 100, 127, 158, 192, 246, 298, 346, 399, 456, 538, 621], D:[21, 28, 36, 44, 58, 75, 96, 115, 135, 167, 197, 223, 251, 281, 324, 365]},
  'Al-PVC':{C:[N_, N_, N_, N_, N_, 59, 73, 90, 110, 140, 170, 197, 227, 259, 305, 351], E:[N_, N_, N_, N_, N_, 61, 78, 96, 117, 150, 183, 212, 245, 280, 330, 381], D:[N_, N_, N_, N_, N_, 50, 64, 77, 91, 112, 132, 150, 169, 190, 218, 247]},
  'Al-XLPE':{C:[N_, N_, N_, N_, N_, 73, 89, 111, 135, 173, 210, 244, 282, 322, 380, 439], E:[N_, N_, N_, N_, N_, 78, 98, 122, 149, 192, 235, 273, 316, 363, 430, 497], D:[N_, N_, N_, N_, N_, 58, 75, 90, 106, 130, 154, 174, 197, 220, 253, 286]}
};
const R20 = {Cu:[12.1, 7.41, 4.61, 3.08, 1.83, 1.15, 0.727, 0.524, 0.387, 0.268, 0.193, 0.153, 0.124, 0.0991, 0.0754, 0.0601], Al:[N_, N_, N_, N_, N_, 1.91, 1.20, 0.868, 0.641, 0.443, 0.320, 0.253, 0.206, 0.164, 0.125, 0.100]};
const XKM = 0.08;
const KT = {air:{PVC:{25:1.03, 30:1, 35:0.94, 40:0.87, 45:0.79, 50:0.71}, XLPE:{25:1.02, 30:1, 35:0.96, 40:0.91, 45:0.87, 50:0.82}}, gnd:{PVC:{20:1, 25:0.95, 30:0.89, 35:0.84, 40:0.77}, XLPE:{20:1, 25:0.96, 30:0.93, 35:0.89, 40:0.85}}};
const KG = {C:[1, 0.85, 0.79, 0.75, 0.73, 0.72, 0.72, 0.71, 0.70], E:[1, 0.88, 0.82, 0.79, 0.76, 0.73, 0.72, 0.72, 0.71], D:[1, 0.85, 0.75, 0.70, 0.65, 0.60, 0.57, 0.54, 0.52]};
const KSC = {'Cu-PVC':115, 'Cu-XLPE':143, 'Al-PVC':76, 'Al-XLPE':94};
const MNAME = {C:'C · مثبّت على الجدار', E:'E · على حامل كابلات مثقّب', D:'D · في مجرى مدفون'};
const ROUTE = {meth:'E', amb:40};
const rOp = (mat, ins, i) => R20[mat][i] * (1 + (mat === 'Cu' ? 0.00393 : 0.00403) * ((ins === 'XLPE' ? 90 : 70) - 20));

/* busbar (typical values from lesson 6: painted bars inside a closed assembly) */
const BARS = [
  {id:'40x10', a:400, I:800}, {id:'60x10', a:600, I:950}, {id:'80x10', a:800, I:1200}, {id:'100x10', a:1000, I:1450},
  {id:'2x(60x10)', a:1200, I:1650, two:true}, {id:'2x(80x10)', a:1600, I:2050, two:true}, {id:'2x(100x10)', a:2000, I:2450, two:true}
];
const BAR_PH = BARS.slice(1);
const BKT = {35:1, 40:0.94, 45:0.88, 50:0.81};
const ROOM = 40, F_INS = 5000;
const ICW = [25, 36, 50, 65];
const nPeak = I => I <= 5 ? 1.5 : I <= 10 ? 1.7 : I <= 20 ? 2.0 : I <= 50 ? 2.1 : 2.2;
const barName = id => id.replace(/x/g, '×');

/* PFC */
const PFC = {P:600, cos1:0.78, cos2:0.95, Pmin:160, Pmax:600};
PFC.Qc = PFC.P * (Math.tan(Math.acos(PFC.cos1)) - Math.tan(Math.acos(PFC.cos2)));  // 284.2 kVAR
const CFGS = [
  {id:'5x50', st:[50, 50, 50, 50, 50]}, {id:'6x50', st:[50, 50, 50, 50, 50, 50]}, {id:'2x25+5x50', st:[25, 25, 50, 50, 50, 50, 50]},
  {id:'12x25', st:Array(12).fill(25)}, {id:'4x75', st:[75, 75, 75, 75]}, {id:'3x100', st:[100, 100, 100]}
];
const CFGM = {}; CFGS.forEach(c => { c.tot = c.st.reduce((a, b) => a + b, 0); CFGM[c.id] = c; });
const PFC_MCCB = [400, 500, 630, 800], PFC_K = 0.91 * 0.88;

/* final circuits for the earthing tab */
const FINALS = [
  {id:'sock', b:'smdb', n:'مقابس عامة في لوحة الإنتاج', In:16, S:2.5, L:40, sock:true},
  {id:'light', b:'ldb', n:'إنارة خارجية من لوحة الإنارة', In:10, S:1.5, L:90},
  {id:'msock', b:'mcc', n:'مقبس صيانة في لوحة المحركات', In:16, S:2.5, L:25, sock:true}
];
const CURVE = {B:5, C:10, D:20};

/* =====================================================================
   2. state
   ===================================================================== */
const KEY = 'panel-calc-v1';
const DEF = () => ({
  load:{ib:{smdb:'', mcc:'', ldb:'', acdb:'', mot:''}, ibm:'', tr:0, inc:0},
  brk:{smdb:{t:'', In:0, ir:1, icu:0}, mcc:{t:'', In:0, ir:1, icu:0}, ldb:{t:'', In:0, ir:1, icu:0}, acdb:{t:'', In:0, ir:1, icu:0}},
  acb:{ir:1, isd:10, tsd:0.1, ii:4, icu:0},
  mcc:{isd:6, tsd:0.1, ii:12},
  mot:{ir:25, ii:8},
  cab:{smdb:{mat:'Cu', ins:'PVC', meth:'C', amb:30, grp:1, runs:1, s:0}, mcc:{mat:'Cu', ins:'PVC', meth:'C', amb:30, grp:1, runs:1, s:0}, ldb:{mat:'Cu', ins:'PVC', meth:'C', amb:30, grp:1, runs:1, s:0}, acdb:{mat:'Cu', ins:'PVC', meth:'C', amb:30, grp:1, runs:1, s:0}},
  len:{smdb:'', mcc:'', ldb:'', acdb:''},
  bus:{bar:'', icw:0, d:10, L:50, n:'', pe:''},
  earth:{sys:'TT', pe:{smdb:0, mcc:0, ldb:0, acdb:0}, fc:{sock:{cv:'C', rcd:0}, light:{cv:'C', rcd:0}, msock:{cv:'C', rcd:0}}, ldbr:0, pump:6},
  pfc:{qc:'', cfg:'', reac:'', uc:0, tgt:0.95, mccb:0, cs:0, cr:1, tested:false}
});
function merge(d, s){ if (!s || typeof s !== 'object') return d; Object.keys(d).forEach(k => { if (s[k] === undefined) return; if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) d[k] = merge(d[k], s[k]); else if (typeof s[k] === typeof d[k] || d[k] === '' || typeof d[k] === 'number') d[k] = s[k]; }); return d; }
let S = DEF();
try { S = merge(DEF(), JSON.parse(localStorage.getItem(KEY))); } catch (e){ S = DEF(); }
function save(){ if (DEMO) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e){} }

/* =====================================================================
   3. engineering functions
   ===================================================================== */
/* trip curves: mx = true → latest clearing (upper tolerance), false → earliest trip (lower tolerance) */
function tEl(d, I, mx){
  const Irr = d.ir * d.In; let t = Infinity;
  if (d.isd && I >= d.isd * Irr * (mx ? 1.1 : 0.9)) t = mx ? d.tsd + 0.02 : d.tsd - 0.02;      /* S: definite time replaces L above Isd */
  else if (I > Irr * (mx ? 1.2 : 1.05)) t = Math.max(mx ? 0.03 : 0.01, d.tr * (mx ? 1.2 : 0.8) * Math.pow(6 * Irr / I, 2));
  if (d.ii && I >= d.ii * d.In * (mx ? 1.1 : 0.9)) t = Math.min(t, mx ? 0.03 : 0.01);
  return t;
}
function tTM(d, I, mx){                                    // d: {Ir (A), Im (A)}
  const x = I / d.Ir; let t = Infinity;
  if (x > (mx ? 1.3 : 1.05)) t = Math.max(mx ? 0.03 : 0.01, (mx ? 1.2 : 0.8) * 400 / (x * x - 1));
  if (I >= d.Im * (mx ? 1.2 : 0.8)) t = Math.min(t, mx ? 0.03 : 0.01);
  return t;
}
const tDev = (d, I, mx) => d.k === 'tm' ? tTM(d, I, mx) : tEl(d, I, mx);
function selLimit(up, dn, Imax){
  const I0 = (dn.k === 'tm' ? dn.Ir : dn.ir * dn.In) * 1.05;
  for (let i = 0; i <= 500; i++){ const I = I0 * Math.pow(Imax / I0, i / 500); const tu = tDev(up, I, false); if (isFinite(tu) && tu <= tDev(dn, I, true)) return I; }
  return null;
}
/* devices as configured in the state */
function devACB(){ const In = S.load.inc || 1600; return {k:'el', In, ir:S.acb.ir, tr:TR_A, isd:S.acb.isd, tsd:S.acb.tsd, ii:S.acb.ii}; }
function devMCC(){ const b = S.brk.mcc, In = b.t === 'el' && b.In ? b.In : 400, ir = b.t === 'el' && b.In ? b.ir : 0.9; return {k:'el', In, ir, tr:TR_M, isd:S.mcc.isd, tsd:S.mcc.tsd, ii:S.mcc.ii}; }
function devMOT(){ return {k:'tm', In:50, Ir:S.mot.ir, Im:S.mot.ir * S.mot.ii}; }
function devFeeder(id){
  if (id === 'mcc') return devMCC();
  const b = S.brk[id];
  if (!b.t || !b.In) return null;
  if (b.t === 'el' || b.t === 'acb') return {k:'el', In:b.In, ir:b.ir, tr:TR_M, isd:10, tsd:0.1, ii:12};
  if (b.t === 'tm') return {k:'tm', In:b.In, Ir:b.ir * b.In, Im:10 * b.In};
  return {k:'tm', In:b.In, Ir:b.In, Im:10 * b.In};
}
const irOf = id => { const b = S.brk[id]; return b.t === 'mcb' ? b.In : b.ir * b.In; };

/* cable helpers */
function cabI0(c, i){ const t = AMP[c.mat + '-' + c.ins]; return t && t[c.meth] ? t[c.meth][i] : null; }
function cabK(c){ const k1 = (c.meth === 'D' ? KT.gnd : KT.air)[c.ins][c.amb]; const k2 = KG[c.meth][clampI(c.grp, 1, 9) - 1]; return {k1:k1 || 0, k2}; }
const clampI = (v, a, b) => Math.min(b, Math.max(a, v | 0));
function cabIz(c, i){ const I0 = cabI0(c, i); if (!I0) return 0; const k = cabK(c); return c.runs * I0 * k.k1 * k.k2; }
const trayN = () => FD.reduce((a, f) => a + (S.cab[f.id].runs || 1), 0);
function cabImp(c, i, Lm, hot){ const r = (hot ? rOp(c.mat, c.ins, i) : R20[c.mat][i]) * Lm / 1000 / c.runs, x = XKM * Lm / 1000 / c.runs; return {r, x}; }
function vdrop(id, c, i, Lm){
  const ib = IB[id], cos = PQ[id].cos, sin = Math.sqrt(1 - cos * cos), R = rOp(c.mat, c.ins, i) / c.runs, X = XKM / c.runs;
  const dv = SQ3 * ib * (Lm / 1000) * (R * cos + X * sin); return {dv, pct:dv / U * 100, R, X, cos, sin};
}
function iscAt(r, x){ return U / (SQ3 * Math.hypot(TRF.R + r, TRF.X + x)) / 1000; }
const lenOk = id => near(IL.num(S.len[id]), FDM[id].L, 0);

/* PFC regulator: smallest switched combination reaching the target, never leading */
function regPick(st, P, tgt){
  const Ql = P * Math.tan(Math.acos(PFC.cos1)), need = P * (Math.tan(Math.acos(PFC.cos1)) - Math.tan(Math.acos(tgt)));
  const n = st.length, sums = new Map();
  for (let m = 0; m < (1 << n); m++){ let q = 0; for (let b = 0; b < n; b++) if (m & (1 << b)) q += st[b]; if (!sums.has(q) || popc(m) < popc(sums.get(q))) sums.set(q, m); }
  const qs = [...sums.keys()].filter(q => q <= Ql + 1e-9).sort((a, b) => a - b);
  let q = qs.find(v => v >= need - 1e-9); if (q === undefined) q = qs[qs.length - 1];
  const res = Ql - q; return {q, mask:sums.get(q), Ql, cos:P / Math.hypot(P, res)};
}
function popc(m){ let c = 0; while (m){ c += m & 1; m >>= 1; } return c; }
function pfcSweep(cfg, tgt){ const c = CFGM[cfg]; if (!c) return null; let worst = {cos:2, P:0}; for (let P = PFC.Pmin; P <= PFC.Pmax; P += 5){ const r = regPick(c.st, P, tgt); if (r.cos < worst.cos) worst = {cos:r.cos, P}; } return worst; }

/* =====================================================================
   4. checks: one place, read by every tab and by the single-line diagram
   ===================================================================== */
const CK = {};
const R_ = (st, msg) => ({st, msg:msg || ''});        // st: ok | bad | '' (not done)
function ibMsg(id, v){
  const t = IB[id];
  if (!isFinite(v)) return R_('');
  if (near(v, t)) return R_('ok');
  const r = ROWS.find(x => x.f === id) || {};
  if (id === 'ldb' && near(v, PQ.ldb.S * 1000 / (SQ3 * U))) return R_('bad', `Ib = ${f1(v)} A تيار متوازن؛ احسب تيار أكثر الأطوار تحميلًا: 0.40 × S / 230`);
  if (id === 'mot' && near(v, MOT.kw * 1000 / (SQ3 * U * MOT.cos))) return R_('bad', `Ib = ${f1(v)} A دون η: قدرة المحرك على لوحته قدرة خارجة على العمود، فاقسم على η`);
  if (r.eta && r.eta < 1 && id === 'mcc'){ let s = 0; ROWS.filter(x => x.f === 'mcc').forEach(x => s += x.kw * x.q * x.ku / x.cos); if (near(v, s * 1000 / (SQ3 * U))) return R_('bad', `Ib = ${f1(v)} A دون η: اقسم قدرة كل محرك على كفاءته`); let s4 = 0; ROWS.filter(x => x.f === 'mcc').forEach(x => s4 += x.kw * x.q / (x.cos * x.eta)); if (near(v, s4 * 1000 / (SQ3 * U))) return R_('bad', `Ib = ${f1(v)} A يشمل المضخة الاحتياطية: المضخات العاملة 3 فقط (Ku = 0.75)`); }
  if (r.ku && r.ku < 1 && id !== 'mcc' && near(v, t / r.ku)) return R_('bad', `Ib = ${f1(v)} A دون معامل الطلب Ku = ${r.ku}`);
  if (near(v, t * SQ3) || near(v, t / SQ3)) return R_('bad', `Ib = ${f1(v)} A: للحمل ثلاثي الأطوار استخدم √3 × U = 692.8 V`);
  return R_('bad', `Ib = ${f1(v)} A بعيد عن الصحيح بنسبة ${f0(Math.abs(v - t) / t * 100)} %: راجع الحساب`);
}
function evalLoad(){
  const c = {f:{}}; FD.forEach(f => c.f[f.id] = ibMsg(f.id, IL.num(S.load.ib[f.id]))); c.f.mot = ibMsg('mot', IL.num(S.load.ib.mot));
  const vm = IL.num(S.load.ibm);
  if (!isFinite(vm)) c.mdb = R_('');
  else if (near(vm, MDB.Ib)) c.mdb = R_('ok');
  else if (near(vm, MDB.Ib / KS)) c.mdb = R_('bad', `Ib = ${f1(vm)} A دون معامل التباين ks = 0.9`);
  else c.mdb = R_('bad', `Ib = ${f1(vm)} A بعيد عن الصحيح بنسبة ${f0(Math.abs(vm - MDB.Ib) / MDB.Ib * 100)} %: اجمع P و Q للوحات ثم اضرب في ks`);
  const tr = S.load.tr;
  if (!tr) c.tr = R_('');
  else if (tr === TR_OK) c.tr = R_('ok');
  else if (tr < TR_OK) c.tr = R_('bad', `${tr} kVA أقل من ${f1(MDB.S)} × ${GROWTH} = ${f1(MDB.S * GROWTH)} kVA المطلوبة مع احتياطي النمو`);
  else c.tr = R_('bad', `${tr} kVA أكبر من اللازم: اختر أصغر قدرة قياسية ≥ ${f1(MDB.S * GROWTH)} kVA`);
  const inc = S.load.inc, intr = tr ? tr * 1000 / (SQ3 * U) : TRF.In;
  if (!inc) c.inc = R_('');
  else if (c.tr.st !== 'ok') c.inc = R_('bad', 'اختر المحول الصحيح أولًا، فالمدخل يُختار على تيار المحول');
  else if (inc < intr) c.inc = R_('bad', `ACB ${inc} A أقل من In_tr = ${f0(intr)} A: المدخل يجب أن يحمل تيار المحول كاملًا`);
  else if (inc > INC_OK(tr)) c.inc = R_('bad', `ACB ${inc} A أكبر من اللازم: اختر أصغر إطار ≥ In_tr = ${f0(intr)} A`);
  else c.inc = R_('ok');
  c.ibOk = id => c.f[id].st === 'ok';
  c.ok = FD.every(f => c.f[f.id].st === 'ok') && c.f.mot.st === 'ok' && c.mdb.st === 'ok' && c.tr.st === 'ok' && c.inc.st === 'ok';
  CK.load = c;
}
function brkFeeder(id){
  const b = S.brk[id], ib = IB[id];
  if (!CK.load.ibOk(id)) return R_('', 'wait');
  if (!b.t) return R_('');
  const T = BT[b.t];
  if (b.t === 'acb') return R_('bad', `ACB للمخارج الكبيرة فقط (أكبر من 630 A)؛ Ib = ${f1(ib)} A يكفيه MCCB`);
  if (b.t === 'mcb' && ib > 63) return R_('bad', `MCB حتى 63 A فقط، و Ib = ${f1(ib)} A: اختر MCCB`);
  if (!b.In) return R_('');
  if (b.t === 'tm' && ib > 250) return R_('bad', `MCCB الحراري المغناطيسي في هذا الكتالوج حتى 250 A: اختر MCCB إلكترونيًا`);
  if (b.In < ib) return R_('bad', `In = ${b.In} A أقل من Ib = ${f1(ib)} A: اختر إطارًا أكبر`);
  const fr = T.fr.filter(x => x >= ib);
  if (fr.indexOf(b.In) > 1) return R_('bad', `الإطار ${b.In} A أكبر من اللازم: اختر أصغر إطار ≥ Ib أو الذي يليه`);
  const ir = irOf(id);
  if (ir < ib - 1e-9) return R_('bad', `Ir = ${f0(ir)} A أقل من Ib = ${f1(ib)} A: ارفع ضبط Ir`);
  const steps = T.ir.map(m => m * b.In).filter(x => x >= ib - 1e-9);
  if (b.t !== 'mcb' && steps.indexOf(ir) > 1) return R_('bad', `Ir = ${f0(ir)} A أعلى من اللازم: اختر أصغر ضبط ≥ Ib أو الذي يليه`);
  if (!b.icu) return R_('');
  if (b.icu < TRF.Ikmax) return R_('bad', `Icu = ${b.icu} kA أقل من Ik max = ${f2(TRF.Ikmax)} kA عند MDB: اختر قدرة قطع أعلى`);
  return R_('ok');
}
function brkInc(){
  const a = S.acb, In = S.load.inc;
  if (CK.load.inc.st !== 'ok' || CK.load.mdb.st !== 'ok') return {all:R_('', 'wait'), items:[]};
  const Irr = a.ir * In, Isd = a.isd * Irr, it = [];
  it.push(Irr >= MDB.Ib ? R_('ok', `Ir = ${f0(Irr)} A ≥ Ib = ${f1(MDB.Ib)} A`) : R_('bad', `Ir = ${f0(Irr)} A أقل من Ib = ${f1(MDB.Ib)} A: ارفع Ir`));
  it.push(Irr <= TRF.In + 1e-6 ? R_('ok', `Ir = ${f0(Irr)} A ≤ In_tr = ${f0(TRF.In)} A`) : R_('bad', `Ir = ${f0(Irr)} A أكبر من In_tr = ${f0(TRF.In)} A: المحول غير محمي من الحمل الزائد`));
  it.push(Isd <= 0.8 * TRF.Ik * 1000 ? R_('ok', `Isd = ${f0(Isd)} A ≤ 0.8 × Ik = ${f0(0.8 * TRF.Ik * 1000)} A`) : R_('bad', `Isd = ${f0(Isd)} A قريب من Ik = ${f2(TRF.Ik)} kA أو أعلى منه: اخفضه ليكتشف القصر بأمان`));
  it.push(!a.ii || a.ii * In > Isd ? R_('ok', a.ii ? `Ii = ${f0(a.ii * In)} A > Isd` : 'Ii = OFF مسموح لأن Icw = 36 kA ≥ Ik max') : R_('bad', `Ii = ${f0(a.ii * In)} A يجب أن يكون أعلى من Isd = ${f0(Isd)} A`));
  it.push(!a.icu ? R_('', 'اختر Icu') : a.icu >= TRF.Ikmax ? R_('ok', `Icu = ${a.icu} kA ≥ ${f2(TRF.Ikmax)} kA`) : R_('bad', `Icu = ${a.icu} kA أقل من Ik max`));
  const bad = it.find(x => x.st === 'bad');
  return {all:bad ? R_('bad', bad.msg) : it.every(x => x.st === 'ok') ? R_('ok') : R_(''), items:it};
}
function evalBrk(){ const c = {f:{}}; FD.forEach(f => c.f[f.id] = brkFeeder(f.id)); c.inc = brkInc(); c.ok = FD.every(f => c.f[f.id].st === 'ok') && c.inc.all.st === 'ok'; CK.brk = c; }

function cabSmallest(c, ir){ for (let i = 0; i < SZ.length; i++){ const iz = cabIz(c, i); if (iz && iz >= ir - 1e-9) return i; } return -1; }
function vdNeed(id, c, ir){       /* smallest size that passes ampacity, ΔU and k²S² (when the length is known) */
  if (!lenOk(id)) return -1;
  for (let i = 0; i < SZ.length; i++){ const iz = cabIz(c, i); if (!iz || iz < ir - 1e-9) continue; if (vdPass(id, c, i)) return i; }
  return -1;
}
function vdPass(id, c, i){ const v = vdrop(id, c, i, FDM[id].L); if (v.pct + FDM[id].fin > FDM[id].lim + 1e-9) return false; const k = k2s2(id, c, i); return k && k.ok; }
function k2s2(id, c, i){
  const dev = devFeeder(id); if (!dev) return null;
  const Ik = TRF.Ik * 1000, t = tDev(dev, Ik, true), k = KSC[c.mat + '-' + c.ins], Sx = SZ[i];
  const lhs = Math.pow(k * Sx, 2), rhs = Math.pow(Ik / c.runs, 2) * t; return {k, t, lhs, rhs, ok:lhs >= rhs, Ik};
}
function cabFeeder(id){
  const c = S.cab[id];
  if (CK.brk.f[id].st !== 'ok') return R_('', 'wait');
  if (!c.s) return R_('');
  if (c.meth !== ROUTE.meth) return R_('bad', `المسار على حامل كابلات مثقّب: طريقة التمديد E وليست ${c.meth}`);
  if (+c.amb !== ROUTE.amb) return R_('bad', `حرارة الهواء حول الحامل ${ROUTE.amb} °C وليست ${c.amb} °C`);
  const n = trayN();
  if (+c.grp !== n) return R_('bad', `على الحامل ${n} كابلات متجاورة (كل كابل متوازٍ يُحسب دائرة): اجعل عدد الدوائر ${n}`);
  if (!c.s) return R_('');
  const i = SZ.indexOf(c.s), I0 = cabI0(c, i);
  if (!I0) return R_('bad', `الألومنيوم في هذا الجدول من 16 mm² فما فوق`);
  const ir = irOf(id), iz = cabIz(c, i);
  if (iz < ir - 1e-9) return R_('bad', `Iz = ${f1(iz)} A أقل من Ir = ${f0(ir)} A: اختر مقطعًا أكبر أو كابلات متوازية`);
  const s0 = cabSmallest(c, ir), sv = vdNeed(id, c, ir);
  if (i > Math.max(s0, sv) + 1) return R_('bad', `المقطع ${c.s} mm² أكبر من اللازم بأكثر من درجة: جرّب مقطعًا أصغر`);
  return R_('ok');
}
function evalCab(){ const c = {f:{}}; FD.forEach(f => c.f[f.id] = cabFeeder(f.id)); c.ok = FD.every(f => c.f[f.id].st === 'ok'); CK.cab = c; }

function vdFeeder(id){
  const c = S.cab[id];
  if (CK.cab.f[id].st !== 'ok') return {all:R_('', 'wait')};
  const v = IL.num(S.len[id]);
  if (!isFinite(v)) return {all:R_('')};
  if (!lenOk(id)) return {all:R_('bad', `الطول ${f0(v)} m لا يطابق مخطط الموقع: اقرأ طول مسار ${FDM[id].tag}`)};
  const i = SZ.indexOf(c.s), d = vdrop(id, c, i, v), tot = d.pct + FDM[id].fin, k = k2s2(id, c, i);
  const im = cabImp(c, i, v, false), isc = iscAt(im.r, im.x);
  const r = {d, tot, k, isc, im};
  if (tot > FDM[id].lim + 1e-9) r.all = R_('bad', `ΔU الكلي = ${f2(tot)} % أكبر من ${FDM[id].lim} %: كبّر مقطع ${FDM[id].tag}`);
  else if (!k.ok) r.all = R_('bad', `k²S² = ${sci(k.lhs)} أقل من I²t = ${sci(k.rhs)}: كبّر المقطع`);
  else r.all = R_('ok');
  return r;
}
const sci = v => { const e = Math.floor(Math.log10(v)); return `${f2(v / Math.pow(10, e))}×10^${e}`; };
function evalVd(){ const c = {f:{}}; FD.forEach(f => c.f[f.id] = vdFeeder(f.id)); c.ok = FD.every(f => c.f[f.id].all.st === 'ok'); CK.vd = c; }
function iscBoard(id){ const r = CK.vd && CK.vd.f[id]; if (r && r.isc) return r.isc; return null; }

function evalBus(){
  const b = S.bus, inc = S.load.inc || 1600, it = {};
  const bar = BARS.find(x => x.id === b.bar);
  if (!bar) it.th = R_('');
  else { const Iz = bar.I * BKT[ROOM]; const ok = BAR_PH.filter(x => x.I * BKT[ROOM] >= inc);
    it.th = Iz < inc ? R_('bad', `${barName(bar.id)} → ${bar.I} × ${BKT[ROOM]} = ${f0(Iz)} A أقل من ${inc} A`) : ok.indexOf(bar) > 1 ? R_('bad', `${barName(bar.id)} أكبر من اللازم: اختر أصغر بار يحمل ${inc} A أو الذي يليه`) : R_('ok', `${barName(bar.id)} → ${bar.I} × ${BKT[ROOM]} = ${f0(Iz)} A ≥ ${inc} A`); }
  it.icw = !b.icw ? R_('') : b.icw >= TRF.Ikmax ? R_('ok', `Icw = ${b.icw} kA ≥ Ik max = ${f2(TRF.Ikmax)} kA`) : R_('bad', `Icw = ${b.icw} kA أقل من Ik max = ${f2(TRF.Ikmax)} kA`);
  const ip = b.icw ? nPeak(b.icw) * b.icw : 0, F = 0.2 * ip * ip * b.L / b.d;
  it.f = !b.icw ? R_('') : F <= F_INS ? R_('ok', `F = ${f2(F / 1000)} kN ≤ ${F_INS / 1000} kN`) : R_('bad', `F = ${f2(F / 1000)} kN أكبر من تحمّل العازل ${F_INS / 1000} kN: قرّب الدعامات أو باعد الأطوار`);
  const nb = BARS.find(x => x.id === b.n), pb = BARS.find(x => x.id === b.pe);
  if (!nb || !bar) it.n = R_(''); else { const okN = BARS.filter(x => x.a >= bar.a); it.n = nb.a < bar.a ? R_('bad', `N = ${nb.a} mm² أقل من 100 % من الطور (${bar.a} mm²)`) : okN.indexOf(nb) > 1 ? R_('bad', 'بار N أكبر من اللازم: يكفي مقطع الطور') : R_('ok', `N = ${nb.a} mm² ≥ ${bar.a} mm²`); }
  if (!pb || !bar) it.pe = R_(''); else { const okP = BARS.filter(x => x.a >= bar.a / 2); it.pe = pb.a < bar.a / 2 ? R_('bad', `PE = ${pb.a} mm² أقل من S/2 = ${bar.a / 2} mm²`) : okP.indexOf(pb) > 1 ? R_('bad', 'بار PE أكبر من اللازم: يكفي S/2') : R_('ok', `PE = ${pb.a} mm² ≥ S/2 = ${bar.a / 2} mm²`); }
  const v = Object.values(it); CK.bus = {it, ip, F, ok:v.every(x => x.st === 'ok'), bad:v.some(x => x.st === 'bad')};
}

function evalSel(){
  const A = devACB(), M = devMCC(), P = devMOT();
  const iscM = iscBoard('mcc') || (() => { const c = {mat:'Cu', ins:'XLPE', runs:1}; return iscAt(R20.Cu[14] * FDM.mcc.L / 1000, XKM * FDM.mcc.L / 1000); })();
  const lim1 = selLimit(A, M, TRF.Ik * 1000), lim2 = selLimit(M, P, iscM * 1000);
  const Ist = 7.2 * IB.mot, it = {};
  const irA = A.ir * A.In, irM = M.ir * M.In;
  it.ir = irA >= MDB.Ib && irA <= TRF.In + 1e-6 && irM >= IB.mcc && P.Ir >= IB.mot ? R_('ok', 'كل Ir ≥ Ib، و Ir للمدخل ≤ In_tr')
    : irA < MDB.Ib ? R_('bad', `Ir للمدخل ${f0(irA)} A أقل من Ib = ${f1(MDB.Ib)} A`) : irA > TRF.In ? R_('bad', `Ir للمدخل ${f0(irA)} A أكبر من In_tr = ${f0(TRF.In)} A`)
    : irM < IB.mcc ? R_('bad', `Ir لمغذّي MCC ${f0(irM)} A أقل من Ib = ${f1(IB.mcc)} A`) : R_('bad', `Ir لقاطع المضخة ${P.Ir} A أقل من Ib = ${f1(IB.mot)} A`);
  it.st = 0.8 * P.Im > 1.4 * Ist ? R_('ok', `بدء المحرك: 0.8 × Ii = ${f0(0.8 * P.Im)} A > 1.4 × Ist = ${f0(1.4 * Ist)} A`) : R_('bad', `قاطع المضخة يفصل عند البدء: 0.8 × Ii = ${f0(0.8 * P.Im)} A ≤ 1.4 × Ist = ${f0(1.4 * Ist)} A، ارفع Ii`);
  if (it.st.st === 'ok' && tTM(P, Ist, false) < 5) it.st = R_('bad', `الحماية الحرارية تفصل خلال بدء مدته 5 s: ارفع Ir`);
  it.p1 = lim1 ? R_('bad', `ACB ↔ MCC: انتقائية جزئية حتى ${f2(lim1 / 1000)} kA`) : R_('ok', `ACB ↔ MCC: كاملة حتى ${f2(TRF.Ik)} kA`);
  it.p2 = lim2 ? R_('bad', `MCC ↔ المضخة: انتقائية جزئية حتى ${f2(lim2 / 1000)} kA`) : R_('ok', `MCC ↔ المضخة: كاملة حتى ${f2(iscM)} kA`);
  const all = Object.values(it);
  CK.sel = {A, M, P, lim1, lim2, iscM, Ist, it, full:!lim1 && !lim2, ok:all.every(x => x.st === 'ok')};
}

function peReq(s){ return s <= 16 ? s : s <= 35 ? 16 : s / 2; }
function earthLoop(id, pe){
  const c = S.cab[id], i = SZ.indexOf(c.s), j = SZ.indexOf(pe), Lk = FDM[id].L / 1000;
  const r = TRF.R + Lk * (rOp(c.mat, c.ins, i) + rOp(c.mat, c.ins, j)) / c.runs, x = TRF.X + Lk * 2 * XKM / c.runs;
  const Zs = Math.hypot(r, x), If = 0.95 * U0 / Zs; return {r, x, Zs, If};
}
function evalEarth(){
  const e = S.earth, c = {f:{}, fc:{}};
  c.sys = e.sys === 'TN-S' ? R_('ok') : R_('bad', 'نظام المشروع TN-S: ثبّت الاختيار عليه بعد مشاهدة البدائل');
  FD.forEach(f => {
    const cb = S.cab[f.id];
    if (CK.vd.f[f.id].all.st !== 'ok') { c.f[f.id] = R_('', 'wait'); return; }
    const pe = e.pe[f.id]; if (!pe) { c.f[f.id] = R_(''); return; }
    const req = peReq(cb.s), okS = SZ.filter(s => s >= req - 1e-9);
    if (pe < req - 1e-9) { c.f[f.id] = R_('bad', `PE = ${pe} mm² أقل من المطلوب ${f1(req)} mm² لطور ${cb.s} mm²`); return; }
    if (okS.indexOf(pe) > 1) { c.f[f.id] = R_('bad', `PE = ${pe} mm² أكبر من اللازم: اختر أصغر مقطع قياسي ≥ ${f1(req)} mm²`); return; }
    const lp = earthLoop(f.id, pe), t = tDev(devFeeder(f.id), lp.If, true);
    c.f[f.id] = t <= 5 ? Object.assign(R_('ok'), {lp, t}) : Object.assign(R_('bad', `زمن الفصل ${isFinite(t) ? f2(t) + ' s' : '∞'} أكبر من 5 s: كبّر PE أو راجع الضبط`), {lp, t});
  });
  const brdZ = b => { const r = c.f[b] && c.f[b].lp; return r || null; };
  FINALS.forEach(fc => {
    const z = brdZ(fc.b), s = e.fc[fc.id];
    if (!z) { c.fc[fc.id] = R_('', 'wait'); return; }
    const rr = 2 * fc.L / 1000 * R20.Cu[SZ.indexOf(fc.S)] * 1.1965, Zs = Math.hypot(z.r + rr, z.x), If = 0.95 * U0 / Zs;
    const mag = CURVE[s.cv] * fc.In, rcdUp = fc.b === 'ldb' && e.ldbr ? e.ldbr : 0;
    const tMag = If >= mag ? 0.1 : Infinity, tR = s.rcd || rcdUp ? 0.04 : Infinity, t = Math.min(tMag, tR);
    const o = {Zs, If, mag, t};
    if (fc.sock && s.rcd !== 30) c.fc[fc.id] = Object.assign(R_('bad', 'دوائر المقابس حتى 32 A تحتاج RCD بحساسية 30 mA (IEC 60364-4-41)'), o);
    else if (!fc.sock && s.rcd === 30 && false) c.fc[fc.id] = R_('ok');
    else if (t > 0.4) c.fc[fc.id] = Object.assign(R_('bad', `If = ${f0(If)} A أقل من عتبة المنحنى ${s.cv}: ${CURVE[s.cv]} × ${fc.In} = ${mag} A، فلا يفصل خلال 0.4 s`), o);
    else c.fc[fc.id] = Object.assign(R_('ok'), o);
  });
  { const z = c.f.mcc && c.f.mcc.lp, d = devMOT(), Lp = 0.07;
    if (!z) c.pump = R_('', 'wait');
    else { const j = SZ.indexOf(e.pump), rr = 2 * Lp * R20.Cu[j] * 1.1965, Zs = Math.hypot(z.r + rr, z.x + 2 * Lp * XKM), If = 0.95 * U0 / Zs, t = tTM(d, If, true), o = {Zs, If, t, mag:1.2 * d.Im};
      c.pump = t <= 0.4 ? Object.assign(R_('ok'), o) : Object.assign(R_('bad', `If = ${f0(If)} A أقل من ${f0(1.2 * d.Im)} A (1.2 × Ii): الفصل حراري بطيء، كبّر مقطع كابل المضخة`), o); } }
  c.ldbr = !e.ldbr ? R_('bad', 'لوحة الإنارة تحتاج RCD بحساسية 300 mA عند مدخلها للحماية من الحريق') : e.ldbr === 300 ? R_('ok') : R_('bad', `${e.ldbr} mA عند مدخل اللوحة يفصل الإنارة كلها لأي تسرب صغير: اختر 300 mA`);
  if (!e.ldbr && FD.every(f => c.f[f.id].st !== 'ok')) c.ldbr = R_('');
  const v = [c.sys, c.ldbr, c.pump].concat(FD.map(f => c.f[f.id]), FINALS.map(f => c.fc[f.id]));
  c.ok = v.every(x => x.st === 'ok'); CK.earth = c;
}

function evalPfc(){
  const p = S.pfc, it = {}, v = IL.num(p.qc);
  it.qc = !isFinite(v) ? R_('') : near(v, PFC.Qc) ? R_('ok', `Qc = ${f1(PFC.Qc)} kVAR`) : R_('bad', `Qc = ${f1(v)} kVAR بعيد عن الصحيح: Qc = P × (tan φ1 − tan φ2)`);
  const cfg = CFGM[p.cfg], sw = cfg ? pfcSweep(p.cfg, p.tgt) : null;
  it.cfg = !cfg ? R_('') : cfg.tot < PFC.Qc ? R_('bad', `${cfg.tot} kVAR أقل من Qc = ${f1(PFC.Qc)} kVAR`) : sw.cos < 0.95 - 1e-9 ? R_('bad', `عند P = ${sw.P} kW يصبح cos φ = ${fmt(sw.cos, 3)}: ${p.tgt < 0.95 ? 'ارفع هدف المنظّم إلى 0.95 على الأقل' : 'الخطوة الأولى أكبر من اللازم للأحمال الصغيرة'}`) : R_('ok', `أسوأ cos φ في دورة الحمل = ${fmt(sw.cos, 3)}`);
  it.reac = !p.reac ? R_('') : p.reac === '7' ? R_('ok', 'ملف 7 %: fr = 189 Hz أقل من التوافقية الخامسة') : p.reac === '0' ? R_('bad', 'بدون ملفات يقع الرنين قرب التوافقية السابعة مع البنك الكامل وأحمال VFD: اختر 7 %') : R_('bad', '14 % يُستخدم عند غلبة التوافقية الثالثة؛ هنا الخامسة والسابعة من المحوّلات: اختر 7 %');
  it.uc = !p.uc ? R_('') : p.reac === '7' && p.uc < 440 ? R_('bad', `مع ملف 7 % يرتفع جهد المكثف إلى 400 / 0.93 = 430 V: اختر 440 V أو أكثر`) : p.uc > 480 ? R_('bad', `${p.uc} V أعلى من اللازم: ينخفض خرج المكثف كثيرًا عند 400 V`) : R_('ok', `Ur = ${p.uc} V`);
  const tot = cfg ? cfg.tot : 300, In = tot * 1000 / (SQ3 * U), Id = 1.43 * In;
  it.mccb = !p.mccb ? R_('') : p.mccb < Id ? R_('bad', `MCCB ${p.mccb} A أقل من 1.43 × In = ${f0(Id)} A`) : PFC_MCCB.filter(x => x >= Id).indexOf(p.mccb) > 1 ? R_('bad', `MCCB ${p.mccb} A أكبر من اللازم`) : R_('ok', `MCCB ${p.mccb} A ≥ ${f0(Id)} A`);
  let iz = 0;
  if (!p.cs) it.cab = R_('');
  else { const i = SZ.indexOf(p.cs); iz = p.cr * AMP['Cu-XLPE'].E[i] * PFC_K; const need = Math.max(Id, p.mccb || 0);
    let s0 = -1; for (let k = 0; k < SZ.length; k++) if (p.cr * AMP['Cu-XLPE'].E[k] * PFC_K >= need){ s0 = k; break; }
    it.cab = iz < need ? R_('bad', `Iz = ${f0(iz)} A أقل من ${f0(need)} A: كبّر المقطع أو زد الكابلات المتوازية`) : i > s0 + 1 ? R_('bad', 'مقطع الكابل أكبر من اللازم بأكثر من درجة') : R_('ok', `Iz = ${p.cr} × ${AMP['Cu-XLPE'].E[i]} × ${fmt(PFC_K, 3)} = ${f0(iz)} A`); }
  const vals = Object.values(it);
  CK.pfc = {it, sw, In, Id, iz, ready:vals.every(x => x.st === 'ok'), ok:vals.every(x => x.st === 'ok') && p.tested};
}
function evalAll(){ evalLoad(); evalBrk(); evalCab(); evalVd(); evalBus(); evalSel(); evalEarth(); evalPfc(); }

/* =====================================================================
   5. single-line diagram (live)
   ===================================================================== */
const sldEl = $('#sld');
sldEl.innerHTML = `<div class="sld-h"><h2>المخطط الأحادي الخط للمشروع</h2><div class="lg"><span><i style="background:var(--good)"></i>مكتمل</span><span><i style="background:var(--amber)"></i>غير مكتمل</span><span><i style="background:var(--bad)"></i>خطأ</span></div><button type="button" class="btn sld-t" aria-expanded="true">إخفاء</button></div><div class="sld-b"></div>`;
const sldB = $('.sld-b', sldEl);
$('.sld-t', sldEl).addEventListener('click', e => { const b = e.currentTarget, open = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(open)); b.textContent = open ? 'إخفاء' : 'إظهار'; sldB.hidden = !open; if (open) renderSLD(); });
function stOf(list){ if (list.some(x => x && x.st === 'bad')) return 'bad'; if (list.every(x => x && x.st === 'ok')) return 'ok'; return 'warn'; }
function nodeData(){
  const n = {};
  const lv = id => { const v = IL.num(S.load.ib[id]); return isFinite(v) ? f1(v) + ' A' : '—'; };
  n.tr = {st:stOf([CK.load.tr]), l:['TR 11/0.4 kV', S.load.tr ? S.load.tr + ' kVA · uk 6 %' : '— kVA · uk 6 %', `Ik ${f2(TRF.Ik)} kA`], tab:'load'};
  const a = S.acb, inc = S.load.inc;
  n.inc = {st:stOf([CK.load.inc, CK.load.mdb, CK.brk.inc.all, soft(CK.sel.it.p1)]), l:['MDB · Q0', inc ? `ACB ${inc} A · Ir ${f0(a.ir * inc)} A` : 'ACB —', `Ib ${isFinite(IL.num(S.load.ibm)) ? f1(IL.num(S.load.ibm)) + ' A' : '—'}`], tab:'breaker'};
  n.bus = {st:CK.bus.ok ? 'ok' : CK.bus.bad ? 'bad' : 'warn', l:[S.bus.bar ? 'Busbar ' + barName(S.bus.bar) : 'Busbar —', S.bus.icw ? `Icw ${S.bus.icw} kA/1 s` : 'Icw —'], tab:'busbar'};
  FD.forEach(f => {
    const b = S.brk[f.id], c = S.cab[f.id], vd = CK.vd.f[f.id];
    const bt = b.t && b.In ? `${b.t === 'el' ? 'MCCB-E' : b.t === 'tm' ? 'MCCB-TM' : b.t.toUpperCase()} ${b.In} A` + (b.t !== 'mcb' ? ` · Ir ${f0(irOf(f.id))}` : '') : 'CB —';
    const ct = c.s ? `${c.runs > 1 ? c.runs + '×' : ''}${c.s} mm² ${c.mat}/${c.ins}` : 'Cable —';
    const dv = vd && vd.tot != null ? `ΔU ${f2(vd.tot)} % · Ik ${f1(vd.isc)} kA` : 'ΔU — · Ik —';
    const parts = [CK.load.f[f.id], CK.brk.f[f.id], CK.cab.f[f.id], CK.vd.f[f.id].all, CK.earth.f[f.id]];
    if (f.id === 'mcc') parts.push(CK.load.f.mot, soft(CK.sel.it.p2));
    n[f.id] = {st:stOf(parts), l:[f.tag, `Ib ${lv(f.id)}`, bt, ct, dv], tab:firstOpen(parts, ['load', 'breaker', 'cable', 'vdrop', 'earth', 'load', 'select'])};
  });
  const p = S.pfc, cf = CFGM[p.cfg];
  n.pfc = {st:CK.pfc.ok ? 'ok' : Object.values(CK.pfc.it).some(x => x.st === 'bad') ? 'bad' : 'warn', l:['PFC', cf ? `${cf.tot} kVAR · ${cf.id.replace(/x/g, '×')}` : '— kVAR', p.reac ? `${p.reac === '0' ? 'بدون ملفات' : p.reac + ' % reactor'}` : 'reactor —', p.mccb ? `MCCB ${p.mccb} A` : 'MCCB —', 'cos φ ≥ 0.95'], tab:'pfc'};
  return n;
}
/* selectivity is judged on its own tab: on the diagram a partial result is shown as «not complete», not as an error */
const soft = r => r.st === 'bad' ? R_('') : r;
function firstOpen(parts, tabs){ const i = parts.findIndex(x => !x || x.st !== 'ok'); return i < 0 ? tabs[0] : tabs[i]; }
const brkSym = (x, y) => `<g class="sym"><line x1="${x}" y1="${y}" x2="${x}" y2="${y + 8}"/><line x1="${x}" y1="${y + 8}" x2="${x + 9}" y2="${y + 24}"/><line x1="${x}" y1="${y + 26}" x2="${x}" y2="${y + 34}"/><line x1="${x - 4}" y1="${y + 4}" x2="${x + 4}" y2="${y + 12}"/><line x1="${x + 4}" y1="${y + 4}" x2="${x - 4}" y2="${y + 12}"/></g>`;
const trSym = (x, y) => `<g class="sym"><circle cx="${x}" cy="${y}" r="13"/><circle cx="${x}" cy="${y + 17}" r="13"/></g>`;
const capSym = (x, y) => `<g class="sym"><line x1="${x - 11}" y1="${y}" x2="${x + 11}" y2="${y}"/><line x1="${x - 11}" y1="${y + 6}" x2="${x + 11}" y2="${y + 6}"/><line x1="${x}" y1="${y + 6}" x2="${x}" y2="${y + 14}"/></g>`;
function nodeBox(id, d, x, y, w, h){
  const lines = d.l.map((t, i) => `<text x="${x + 18}" y="${y + 17 + i * 15}" class="${i ? 't-v' : 't-h'}">${esc(t)}</text>`).join('');
  return `<g class="nd st-${d.st}" data-tab="${d.tab}" tabindex="0" role="button" aria-label="${esc(d.l[0])}"><rect class="bx" x="${x}" y="${y}" width="${w}" height="${h}" rx="7"/><circle class="dot" cx="${x + 9}" cy="${y + 12}" r="4.5"/>${lines}</g>`;
}
function renderSLD(){
  const n = nodeData(), wide = sldB.clientWidth >= 720, ids = ['smdb', 'mcc', 'ldb', 'acdb', 'pfc'];
  let h;
  if (wide){
    const W = 1000, bx = 184, gap = (W - 20 - 5 * bx) / 4;
    h = `<svg viewBox="0 0 ${W} 330" role="img" aria-label="المخطط الأحادي الخط">`;
    h += trSym(160, 24) + `<line class="ln" x1="160" y1="54" x2="160" y2="80"/>` + brkSym(160, 80) + `<line class="ln" x1="160" y1="114" x2="160" y2="140"/>`;
    h += nodeBox('tr', n.tr, 190, 8, 210, 56) + nodeBox('inc', n.inc, 190, 72, 230, 56) + nodeBox('bus', n.bus, 600, 86, 230, 44);
    h += `<line class="bus" x1="20" y1="140" x2="980" y2="140"/>`;
    ids.forEach((id, i) => { const x = 10 + i * (bx + gap), cx = x + bx / 2;
      h += `<line class="ln" x1="${cx}" y1="140" x2="${cx}" y2="152"/>` + brkSym(cx, 152) + `<line class="ln" x1="${cx}" y1="186" x2="${cx}" y2="${id === 'pfc' ? 200 : 214}"/>`;
      if (id === 'pfc') h += capSym(cx, 201);
      h += nodeBox(id, n[id], x, 216, bx, 90); });
    h += `<text x="20" y="326" class="t-m">400 V · 50 Hz · TN-S · Ik = In/uk · Icu, Icw ≥ Ik max = 25.26 kA (c = 1.05)</text></svg>`;
  } else {
    const W = 360, rowH = 92, top = 150, H = top + ids.length * rowH + 10, bxX = 70;
    h = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="المخطط الأحادي الخط">`;
    h += trSym(34, 20) + `<line class="ln" x1="34" y1="50" x2="34" y2="76"/>` + brkSym(34, 76) + `<line class="ln" x1="34" y1="110" x2="34" y2="${top - 6}"/>`;
    h += nodeBox('tr', n.tr, bxX, 4, W - bxX - 4, 54) + nodeBox('inc', n.inc, bxX, 62, W - bxX - 4, 54) + nodeBox('bus', n.bus, bxX, 120, W - bxX - 4, 26).replace(/<text[^>]*class="t-v">[^<]*<\/text>/, '');
    h += `<line class="bus" x1="34" y1="${top - 6}" x2="34" y2="${top + (ids.length - 1) * rowH + 40}"/>`;
    ids.forEach((id, i) => { const y = top + i * rowH;
      h += `<line class="ln" x1="34" y1="${y + 40}" x2="44" y2="${y + 40}"/><g transform="rotate(-90 44 ${y + 40})">${brkSym(44, y + 40)}</g><line class="ln" x1="78" y1="${y + 40}" x2="${bxX}" y2="${y + 40}"/>`;
      h += nodeBox(id, n[id], bxX, y + 2, W - bxX - 4, rowH - 8); });
    h += `</svg>`;
  }
  sldB.innerHTML = h;
}
IL.onAct(sldEl, '.nd', t => { show(t.dataset.tab); const p = $('#tabs'); if (p.scrollIntoView) p.scrollIntoView({block:'start', behavior:'smooth'}); });
let rzT = 0; window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(renderSLD, 120); });

/* =====================================================================
   6. tabs, goals, demo
   ===================================================================== */
const TABS = [
  {id:'load', t:'الأحمال', l:'l2', h:'جدول الأحمال وتيار التصميم Ib', goal:'احسب Ib لكل لوحة فرعية ولمحرك المضخة P-1 ولمدخل اللوحة الرئيسية بدقة ±2 %، ثم اختر قدرة المحول وإطار قاطع المدخل الصحيحين.'},
  {id:'breaker', t:'القواطع', l:'l3', h:'اختيار القواطع وضبط وحدة الفصل الإلكترونية', goal:'اختر لكل مخرج نوع القاطع وإطاره وضبط Ir ≥ Ib وقدرة قطع Icu ≥ Ik، واضبط وحدة فصل قاطع المدخل ACB ضبطًا صحيحًا.'},
  {id:'cable', t:'الكابلات', l:'l4', h:'مقطع الكابل ومعاملات التصحيح', goal:'اختر لكل مخرج كابلًا يحقق Ib ≤ Ir ≤ Iz بمعاملات التصحيح الصحيحة لمساره، دون زيادة في المقطع تتجاوز درجة واحدة.'},
  {id:'vdrop', t:'هبوط الجهد', l:'l5', h:'هبوط الجهد وتيار القصر وتحمّل الكابل', goal:'أدخل أطوال المسارات من مخطط الموقع، وكبّر مقطع كل مخرج يتجاوز حد هبوط الجهد أو يفشل في فحص k²S² ≥ I²t حتى تنجح المخارج كلها.'},
  {id:'busbar', t:'البارات', l:'l6', h:'بارات اللوحة الرئيسية MDB', goal:'صمّم البار الرئيسي ليحمل تيار المدخل عند حرارة الغرفة، بتحمّل Icw ≥ Ik وقوة على الدعامات أقل من تحمّل العازل، مع مقطعي N و PE صحيحين.'},
  {id:'select', t:'الانتقائية', l:'l7', h:'منحنيات الزمن والتيار والانتقائية', goal:'اضبط القواطع الثلاثة حتى تتحقق انتقائية كاملة بين المستويات حتى تيار القصر عند كل نقطة، دون أن يفصل قاطع المضخة عند البدء.'},
  {id:'earth', t:'التأريض', l:'l8', h:'نظام التأريض وموصل الحماية وزمن الفصل', goal:'ثبّت نظام TN-S، واختر مقطع PE لكل مخرج وأجهزة RCD المناسبة، وحقق زمن فصل ≤ 5 s للمخارج و ≤ 0.4 s للدوائر النهائية.'},
  {id:'pfc', t:'المكثفات', l:'l9', h:'بنك المكثفات وتحسين معامل القدرة', goal:'احسب Qc واختر خطوات البنك والملف المانع وهدف المنظّم وحماية البنك، ثم اختبر دورة حمل كاملة يبقى فيها cos φ ≥ 0.95.'}
];
const tabsEl = $('#tabs'), panes = $('#panes'), G = {}, BUILD = {};
let DEMO = 0, CUR = '';
TABS.forEach(tb => {
  const b = document.createElement('button'); b.className = 'btn' + (IL.has(tb.l, 'sim') ? ' done' : ''); b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = tb.t; b.dataset.id = tb.id;
  b.addEventListener('click', () => show(tb.id)); tabsEl.appendChild(b);
  const p = document.createElement('section'); p.className = 'pane'; p.id = 'p-' + tb.id; p.setAttribute('role', 'tabpanel');
  p.innerHTML = `<h2 style="margin:0 0 8px">${esc(tb.h)}</h2><div class="goal${IL.has(tb.l, 'sim') ? ' ok' : ''}" id="g-${tb.id}"><b class="k">${IL.has(tb.l, 'sim') ? '✓ أُنجز' : 'المطلوب'}</b>${ar(tb.goal)}</div><div class="body"></div>`;
  panes.appendChild(p); G[tb.id] = tb;
});
function show(id){
  if (!G[id]) id = 'load';
  CUR = id;
  $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + id));
  $$('#tabs .btn').forEach(b => b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false'));
  if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  if (!G[id].built){ G[id].built = true; BUILD[id]($('#p-' + id + ' .body')); }
  else if (G[id].upd) G[id].upd();
}
function rebuild(id){ const old = $('#p-' + id + ' .body'), nb = document.createElement('div'); nb.className = 'body'; old.replaceWith(nb); G[id].upd = null; BUILD[id](nb); }
function win(id, msg){
  if (DEMO) return false;
  const tb = G[id]; if (tb.won) return false; tb.won = true; IL.mark(tb.l, 'sim');
  const g = $('#g-' + id); g.classList.add('ok'); g.innerHTML = `<b class="k">✓ أُنجز</b>${ar(msg || tb.goal)}`;
  $(`#tabs .btn[data-id="${id}"]`).classList.add('done');
  return true;
}
const WINMSG = {load:'أحسنت: Ib لكل اللوحات صحيح، والمحول 1000 kVA والمدخل ACB 1600 A.', breaker:'أحسنت: كل القواطع صالحة، ووحدة فصل المدخل مضبوطة.', cable:'أحسنت: كل الكابلات تحقق Ib ≤ Ir ≤ Iz دون زيادة غير لازمة.', vdrop:'أحسنت: هبوط الجهد وتحمّل القصر مقبولان في كل المخارج.', busbar:'أحسنت: تصميم البارات سليم حراريًا وميكانيكيًا.', select:'أحسنت: انتقائية كاملة بين المستويات الثلاثة.', earth:'أحسنت: نظام الحماية من الصعق مطابق في كل الدوائر.', pfc:'أحسنت: cos φ بقي ≥ 0.95 طوال دورة الحمل.'};
/* every user change goes through here: save, re-evaluate, redraw, maybe complete the current tab */
function changed(){
  evalAll(); save(); renderSLD();
  TABS.forEach(tb => { if (G[tb.id].built && G[tb.id].upd) G[tb.id].upd(); });
  if (!DEMO) TABS.forEach(tb => { const c = CK[ckKey(tb.id)]; if (c && c.ok && G[tb.id].built) win(tb.id, WINMSG[tb.id]); });
}
const ckKey = id => ({load:'load', breaker:'brk', cable:'cab', vdrop:'vd', busbar:'bus', select:'sel', earth:'earth', pfc:'pfc'})[id];
/* «▶ شاهد الحل»: plays the solution on the real controls, then puts the exercise back so the learner does it */
function demo(host, id, run){
  const b = $('.demo-b', host), pane = $('#p-' + id);
  b.addEventListener('click', async () => {
    if (DEMO) return;
    const snap = clone(S);
    DEMO++; b.disabled = true; pane.classList.add('demoing');
    const dm = $('.demo-m', host); if (dm){ dm.className = 'msg demo-m'; dm.textContent = 'العرض يعمل: راقب الاختيارات تتغير خطوة بخطوة…'; }
    try { await run(); await sleep(2000); }
    catch (e){ console.warn(e); }
    finally {
      S = snap; DEMO--; evalAll(); renderSLD(); rebuild(id); pane.classList.remove('demoing');
      const m = $('#p-' + id + ' .demo-m'); if (m){ m.textContent = 'انتهى العرض وأُعيد التمرين إلى حالته: نفّذه الآن بنفسك ليُحتسب.'; m.className = 'msg demo-m'; }
    }
  });
}
/* while a demo runs, the earlier tabs are filled with their solutions so this tab has its inputs */
const SOL = {
  load(){ FD.forEach(f => S.load.ib[f.id] = f1(IB[f.id])); S.load.ib.mot = f1(IB.mot); S.load.ibm = f1(MDB.Ib); S.load.tr = 1000; S.load.inc = 1600; },
  breaker(){ S.brk.smdb = {t:'el', In:630, ir:0.8, icu:36}; S.brk.mcc = {t:'el', In:400, ir:0.9, icu:36}; S.brk.ldb = {t:'tm', In:100, ir:0.8, icu:36}; S.brk.acdb = {t:'el', In:400, ir:0.85, icu:36}; Object.assign(S.acb, {ir:0.9, isd:4, tsd:0.3, ii:0, icu:50}); },
  cable(){ const c = s => ({mat:'Cu', ins:'XLPE', meth:'E', amb:40, grp:5, runs:1, s}); S.cab = {smdb:Object.assign(c(150), {runs:2}), mcc:c(240), ldb:c(25), acdb:c(240)}; },
  vdrop(){ FD.forEach(f => S.len[f.id] = String(f.L)); S.cab.ldb.s = 35; },
  select(){ S.mcc = {isd:6, tsd:0.1, ii:0}; S.mot = {ir:32, ii:13}; },
  earth(){ S.earth = {sys:'TN-S', pe:{smdb:95, mcc:120, ldb:16, acdb:120}, fc:{sock:{cv:'C', rcd:30}, light:{cv:'B', rcd:0}, msock:{cv:'C', rcd:30}}, ldbr:300, pump:10}; }
};
function prep(upto){ const order = ['load', 'breaker', 'cable', 'vdrop', 'select']; for (const k of order){ if (k === upto) break; SOL[k](); } evalAll(); renderSLD(); }
async function dClick(el, ms){ if (!el) return; el.classList.add('dhl'); if (el.scrollIntoView) el.scrollIntoView({block:'nearest', behavior:'smooth'}); await sleep(ms || 600); el.classList.remove('dhl'); el.click(); await sleep(300); }
async function dSet(el, v, ms){ if (!el) return; el.classList.add('dhl'); if (el.scrollIntoView) el.scrollIntoView({block:'nearest', behavior:'smooth'}); await sleep(ms || 420);
  if (el.tagName === 'INPUT' && el.type === 'number'){ const t = String(v); el.value = ''; for (let i = 1; i <= t.length; i++){ const part = t.slice(0, i); if (!/\.$/.test(part)){ el.value = part; await sleep(45); } } } else el.value = v;
  el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); await sleep(220); el.classList.remove('dhl'); }
const DEMO_BTN = '<button type="button" class="btn demo-b keep">▶ شاهد الحل</button>';
const DEMO_MSG = '<p class="msg demo-m keep" aria-live="polite"></p>';
const RESET_BTN = '<button type="button" class="btn rst-b keep">ابدأ من جديد</button>';
const pill = (r, okT) => r.st === 'ok' ? `<span class="pill ok">✓ ${okT || 'صحيح'}</span>` : r.st === 'bad' ? `<span class="pill bad">✗ خطأ</span>` : `<span class="pill">○ ${r.msg === 'wait' ? 'ينتظر' : 'لم يكتمل'}</span>`;
const msgOf = r => r.st === 'bad' ? `<p class="msg bad">${ar(r.msg)}</p>` : '';
const opts = (arr, cur, fmtF, ph) => (ph ? `<option value="">${ph}</option>` : '') + arr.map(v => `<option value="${v}"${String(v) === String(cur) ? ' selected' : ''}>${fmtF ? fmtF(v) : v}</option>`).join('');
const waitBox = (txt, tab) => `<div class="dev wait"><p class="note">${txt} <button type="button" class="lnk" data-go="${tab}">اذهب إلى التبويب</button></p></div>`;
function bindCommon(host){
  IL.onAct(host, '[data-go]', t => show(t.dataset.go));
  host.addEventListener('click', e => { if (e.target.closest('.rst-b')) resetAll(); });
}
function resetAll(){
  if (!confirm('ستُمسح كل المدخلات في كل التبويبات وتعود الحاسبة إلى بدايتها. هل تريد المتابعة؟')) return;
  S = DEF(); save(); evalAll(); renderSLD(); TABS.forEach(tb => { if (G[tb.id].built) rebuild(tb.id); });
}
const foot = () => `<div class="row keep">${DEMO_BTN}${RESET_BTN}</div>${DEMO_MSG}`;

/* =====================================================================
   TAB 1 · load schedule
   ===================================================================== */
BUILD.load = host => {
  const grp = {smdb:'SMDB · لوحة الإنتاج', mcc:'MCC · لوحة المحركات', ldb:'LDB · لوحة الإنارة', acdb:'ACDB · لوحة التكييف'};
  let tb = '';
  FD.forEach(f => { tb += `<tr class="grp"><td colspan="7">${grp[f.id]}</td></tr>`; ROWS.filter(r => r.f === f.id).forEach(r => { tb += `<tr><td class="ar">${esc(r.n)}</td><td>${r.kw}</td><td>${r.q}</td><td>${r.ku}</td><td>${r.cos}</td><td>${r.eta < 1 ? r.eta : '—'}</td><td class="ar">${r.ph ? 'أكثر الأطوار تحميلًا 40 %' : r.mot ? 'محرك' : '—'}</td></tr>`; }); });
  host.innerHTML = `
  <p class="note">المصنع يعمل على ${L('400 V · 50 Hz · TN-S')}. قدرة المحرك على لوحته قدرة خارجة على العمود، لذلك تُقسم على η. للمضخات أربع وحدات تعمل منها ثلاث (${L('Ku = 0.75')}). قيم نموذجية للتعلّم.</p>
  <div class="tblw rt"><table class="tbl hm"><thead><tr><th class="ar">الحمل</th><th>P (kW)</th><th>n</th><th>Ku</th><th>cos φ</th><th>η</th><th class="ar">ملاحظة</th></tr></thead><tbody>${tb}</tbody></table></div>
  <div class="fm">Ib = S / (√3 · U)<br>S = √(ΣP² + ΣQ²)<br>P = Pn · n · Ku / η · Q = P · tan φ</div>
  <p class="note">لوحة الإنارة أحمالها أحادية الطور وغير متوازنة، فيُحسب تيار أكثر الأطوار تحميلًا. وللمحرك الواحد بحمل كامل يكفي القانون المباشر:</p>
  <div class="fx">LDB: Ib = 0.40 · S / U0, U0 = 230 V<br>Motor: Ib = Pn / (√3 · U · cos φ · η)</div>
  <div class="grid2" id="ld-f"></div>
  <div class="dev" id="ld-m"><h3><span class="tag">MDB</span>المدخل الرئيسي والمحول</h3>
    <p class="note">معامل التباين بين اللوحات ${L('ks = 0.9')}: اجمع P و Q للوحات الأربع (S لا Ib للإنارة)، واضرب في ks. احتياطي النمو للمحول ${L('× 1.25')}.</p>
    <label>Ib للمدخل (A)<input type="number" step="0.1" inputmode="decimal" id="ld-ibm" value="${esc(S.load.ibm)}" aria-label="Ib MDB"></label><div id="ld-ibm-r"></div>
    <label>قدرة المحول<select id="ld-tr" aria-label="Transformer kVA">${opts(TR_OPT, S.load.tr, v => v + ' kVA', 'اختر…')}</select></label><div id="ld-tr-r"></div>
    <label>إطار قاطع المدخل<select id="ld-inc" aria-label="Incomer ACB">${opts(ACB_FR, S.load.inc, v => 'ACB ' + v + ' A', 'اختر…')}</select></label><div id="ld-inc-r"></div>
  </div>
  ${foot()}`;
  const ff = $('#ld-f', host);
  ff.innerHTML = FD.concat([{id:'mot', tag:'P-1', n:'محرك مضخة واحد 15 kW بحمل كامل'}]).map(f => `<div class="dev" data-f="${f.id}"><h3><span class="tag">${f.tag}</span>${esc(f.n)}</h3><label>Ib (A)<input type="number" step="0.1" inputmode="decimal" data-ib="${f.id}" value="${esc(S.load.ib[f.id])}" aria-label="Ib ${f.tag}"></label><div class="res"></div></div>`).join('');
  host.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.ib){ S.load.ib[t.dataset.ib] = t.value; changed(); }
    else if (t.id === 'ld-ibm'){ S.load.ibm = t.value; changed(); }
    else if (t.id === 'ld-tr'){ S.load.tr = +t.value || 0; changed(); }
    else if (t.id === 'ld-inc'){ S.load.inc = +t.value || 0; changed(); }
  });
  bindCommon(host);
  function subst(id){
    if (id === 'mot') return `Ib = 15000 / (√3 × 400 × 0.85 × 0.92) = <b>${f1(IB.mot)} A</b>`;
    const pq = PQ[id];
    if (id === 'ldb') return `S = 40 × 0.9 / 0.9 = ${f1(pq.S)} kVA → Ib = 0.40 × ${f1(pq.S)}k / 230 = <b>${f1(IB.ldb)} A</b>`;
    return `P = ${f2(pq.P)} kW, Q = ${f2(pq.Q)} kVAR, S = ${f2(pq.S)} kVA → Ib = ${f2(pq.S)}k / (√3 × 400) = <b>${f1(IB[id])} A</b>`;
  }
  G.load.upd = () => {
    $$('[data-f]', ff).forEach(d => { const id = d.dataset.f, r = CK.load.f[id]; d.className = 'dev' + (r.st ? ' ' + r.st : ''); $('.res', d).innerHTML = pill(r) + msgOf(r) + (r.st === 'ok' ? `<div class="fx">${subst(id)}</div>` : ''); });
    const m = CK.load;
    $('#ld-ibm-r', host).innerHTML = pill(m.mdb) + msgOf(m.mdb) + (m.mdb.st === 'ok' ? `<div class="fx">ΣP = ${f1(MDB.P / KS)} kW, ΣQ = ${f1(MDB.Q / KS)} kVAR → × 0.9 → P = ${f1(MDB.P)} kW, Q = ${f1(MDB.Q)} kVAR, S = ${f1(MDB.S)} kVA, cos φ = ${fmt(MDB.cos, 3)} → Ib = <b>${f1(MDB.Ib)} A</b></div>` : '');
    $('#ld-tr-r', host).innerHTML = pill(m.tr) + msgOf(m.tr) + (m.tr.st === 'ok' ? `<div class="fx">${f1(MDB.S)} × 1.25 = ${f1(MDB.S * 1.25)} kVA ≤ <b>1000 kVA</b> → In_tr = 1000k / (√3 × 400) = ${f0(TRF.In)} A</div>` : '');
    $('#ld-inc-r', host).innerHTML = pill(m.inc) + msgOf(m.inc);
    $('#ld-m', host).className = 'dev' + (m.mdb.st === 'ok' && m.tr.st === 'ok' && m.inc.st === 'ok' ? ' ok' : [m.mdb, m.tr, m.inc].some(x => x.st === 'bad') ? ' bad' : '');
  };
  G.load.upd();
  demo(host, 'load', async () => {
    for (const f of FD) await dSet($(`[data-ib="${f.id}"]`, host), f1(IB[f.id]));
    await dSet($('[data-ib="mot"]', host), f1(IB.mot));
    await dSet($('#ld-ibm', host), f1(MDB.Ib)); await dSet($('#ld-tr', host), 1000); await dSet($('#ld-inc', host), 1600);
  });
};

/* =====================================================================
   TAB 2 · breakers + ACB trip unit faceplate
   ===================================================================== */
function dialSVG(pos, n, lab){
  const a0 = -135, a1 = 135, a = n > 1 ? a0 + (a1 - a0) * pos / (n - 1) : 0; let ticks = '';
  for (let i = 0; i < n; i++){ const t = (a0 + (a1 - a0) * i / Math.max(1, n - 1)) * Math.PI / 180; ticks += `<line x1="${40 + 30 * Math.sin(t)}" y1="${40 - 30 * Math.cos(t)}" x2="${40 + 35 * Math.sin(t)}" y2="${40 - 35 * Math.cos(t)}" stroke="#cfd6da" stroke-width="1.6"/>`; }
  return `<svg viewBox="0 0 80 80" aria-hidden="true">${ticks}<circle cx="40" cy="40" r="25" fill="#1b1f22" stroke="#6b757b" stroke-width="2"/><circle cx="40" cy="40" r="19" fill="#2b3135"/><g transform="rotate(${a} 40 40)"><rect x="37.5" y="17" width="5" height="17" rx="2" fill="#ffb84d"/></g><text x="40" y="76" text-anchor="middle" font-size="9" fill="#cfd6da">${lab}</text></svg>`;
}
BUILD.breaker = host => {
  host.innerHTML = `
  <p class="note">تيار القصر عند قضبان MDB من المحول وحده: ${L(`Ik = In_tr / uk = ${f0(TRF.In)} / 0.06 = ${f2(TRF.Ik)} kA`)}، ومع ${L('c = 1.05')} (IEC 60909): ${L(`Ik max = ${f2(TRF.Ikmax)} kA`)}. كل قاطع في MDB يحتاج ${L('Icu ≥ Ik max')}. اختر الإطار ${L('In ≥ Ib')} ثم ضبط ${L('Ir ≥ Ib')} (أصغر ضبط مناسب أو الذي يليه).</p>
  <div class="grid2" id="bk-f"></div>
  <div class="dev" id="bk-inc"></div>
  ${foot()}`;
  const ff = $('#bk-f', host);
  function feederCard(f){
    const b = S.brk[f.id], r = CK.brk.f[f.id];
    if (r.msg === 'wait') return `<div class="dev wait" data-f="${f.id}"><h3><span class="tag">${f.tag}</span>${esc(f.n)}</h3><p class="note">أدخل Ib الصحيح لهذه اللوحة في تبويب الأحمال أولًا. <button type="button" class="lnk" data-go="load">اذهب إلى التبويب</button></p></div>`;
    const T = b.t ? BT[b.t] : null;
    return `<div class="dev" data-f="${f.id}"><h3><span class="tag">${f.tag}</span>${esc(f.n)} ${L('Ib = ' + f1(IB[f.id]) + ' A')}</h3>
      <label>نوع القاطع<select data-k="t" aria-label="Type ${f.tag}"><option value="">اختر…</option>${Object.keys(BT).map(k => `<option value="${k}"${b.t === k ? ' selected' : ''}>${BTN[k]}</option>`).join('')}</select></label>
      ${T ? `<label>${b.t === 'mcb' ? 'In' : 'الإطار In'}<select data-k="In" aria-label="In ${f.tag}">${opts(T.fr, b.In, v => v + ' A', 'اختر…')}</select></label>
      ${b.t !== 'mcb' ? `<label>Ir = × In<select data-k="ir" aria-label="Ir ${f.tag}">${opts(T.ir, b.ir, v => v + ' × In' + (b.In ? ' = ' + f0(v * b.In) + ' A' : ''))}</select></label>` : ''}
      <label>Icu<select data-k="icu" aria-label="Icu ${f.tag}">${opts(T.icu, b.icu, v => v + ' kA', 'اختر…')}</select></label>` : ''}
      <div class="res"></div></div>`;
  }
  function incCard(){
    const r = CK.brk.inc, a = S.acb, In = S.load.inc;
    if (r.all.msg === 'wait') return `<h3><span class="tag">Q0</span>قاطع المدخل ACB</h3><p class="note">اختر إطار المدخل وأدخل Ib للمدخل في تبويب الأحمال أولًا. <button type="button" class="lnk" data-go="load">اذهب إلى التبويب</button></p>`;
    const dl = (k, arr, lab, txt) => { const i = Math.max(0, arr.indexOf(a[k])); return `<div class="dl">${dialSVG(i, arr.length, lab)}<span>${txt}</span><input type="range" min="0" max="${arr.length - 1}" step="1" value="${i}" data-dial="${k}" aria-label="${lab}"></div>`; };
    const Irr = a.ir * In;
    return `<h3><span class="tag">Q0</span>قاطع المدخل ${L('ACB ' + In + ' A')}، وحدة فصل ${L('LSI')}</h3>
      <div class="fp"><div class="fp-h"><span>ACB ${In} A · LSI · Icw 36 kA/1 s</span><span class="lcd">Ir ${f0(Irr)} A</span></div>
      <div class="fp-d">${dl('ir', ACB_IR, 'Ir', `${a.ir}×In = ${f0(Irr)} A`)}${dl('isd', ISD, 'Isd', `${a.isd}×Ir = ${f0(a.isd * Irr)} A`)}${dl('tsd', TSD, 'tsd', `${a.tsd} s`)}${dl('ii', ACB_II, 'Ii', a.ii ? `${a.ii}×In = ${f0(a.ii * In)} A` : 'OFF')}</div></div>
      <label>Icu<select data-acb="icu" aria-label="Icu ACB">${opts(BT.acb.icu, a.icu, v => v + ' kA', 'اختر…')}</select></label>
      <ul class="chk">${r.items.map(x => `<li class="${x.st}">${ar(x.msg)}</li>`).join('')}</ul>`;
  }
  function draw(){ ff.innerHTML = FD.map(feederCard).join(''); $('#bk-inc', host).innerHTML = incCard(); upd(); }
  function upd(){
    $$('[data-f]', ff).forEach(d => { const r = CK.brk.f[d.dataset.f]; if (r.msg === 'wait') return; d.className = 'dev' + (r.st ? ' ' + r.st : ''); $('.res', d).innerHTML = pill(r) + msgOf(r); });
    const ic = $('#bk-inc', host), r = CK.brk.inc.all; ic.className = 'dev' + (r.st ? ' ' + r.st : '');
  }
  ff.addEventListener('change', e => {
    const t = e.target, d = t.closest('[data-f]'); if (!d) return; const b = S.brk[d.dataset.f], k = t.dataset.k;
    if (k === 't'){ b.t = t.value; b.In = 0; b.ir = 1; b.icu = 0; }
    else if (k === 'In') b.In = +t.value || 0; else if (k === 'ir') b.ir = +t.value; else if (k === 'icu') b.icu = +t.value || 0;
    changed(); const i = FD.findIndex(f => f.id === d.dataset.f); const nd = document.createElement('div'); nd.innerHTML = feederCard(FD[i]); d.replaceWith(nd.firstElementChild); upd();
  });
  $('#bk-inc', host).addEventListener('input', e => {
    const t = e.target; if (!t.dataset.dial) return; const arr = {ir:ACB_IR, isd:ISD, tsd:TSD, ii:ACB_II}[t.dataset.dial];
    S.acb[t.dataset.dial] = arr[+t.value]; changed(); const keep = t.dataset.dial; $('#bk-inc', host).innerHTML = incCard(); upd(); const n = $(`[data-dial="${keep}"]`, host); if (n && !DEMO) n.focus();
  });
  $('#bk-inc', host).addEventListener('change', e => { if (e.target.dataset.acb === 'icu'){ S.acb.icu = +e.target.value || 0; changed(); $('#bk-inc', host).innerHTML = incCard(); upd(); } });
  bindCommon(host);
  let lastSig = '';
  G.breaker.upd = () => { const sig = FD.map(f => CK.brk.f[f.id].msg === 'wait').join() + CK.brk.inc.all.msg; if (sig !== lastSig){ lastSig = sig; draw(); } else upd(); };
  draw(); lastSig = FD.map(f => CK.brk.f[f.id].msg === 'wait').join() + CK.brk.inc.all.msg;
  demo(host, 'breaker', async () => {
    prep('breaker'); draw(); await sleep(300);
    const sol = {smdb:['el', 630, 0.8], mcc:['el', 400, 0.9], ldb:['tm', 100, 0.8], acdb:['el', 400, 0.85]};
    for (const f of FD){ const s = sol[f.id];
      await dSet($(`[data-f="${f.id}"] [data-k="t"]`, ff), s[0]); await dSet($(`[data-f="${f.id}"] [data-k="In"]`, ff), s[1]);
      await dSet($(`[data-f="${f.id}"] [data-k="ir"]`, ff), s[2]); await dSet($(`[data-f="${f.id}"] [data-k="icu"]`, ff), 36); }
    for (const [k, arr, v] of [['ir', ACB_IR, 0.9], ['isd', ISD, 4], ['tsd', TSD, 0.3], ['ii', ACB_II, 0]]) await dSet($(`[data-dial="${k}"]`, host), arr.indexOf(v));
    await dSet($('[data-acb="icu"]', host), 50);
  });
};

/* =====================================================================
   TAB 3 · cables
   ===================================================================== */
function cableIcon(c){
  const n = 4, col = ['var(--c-l1)', 'var(--c-l2)', 'var(--c-l3)', 'var(--c-n)'], r = 7 + Math.sqrt(c.s || 16) * 0.9;
  let h = `<svg viewBox="0 0 70 70" width="56" height="56" aria-hidden="true"><circle cx="35" cy="35" r="32" fill="${c.ins === 'XLPE' ? '#2a2f33' : '#3d4448'}" stroke="var(--line)"/>`;
  for (let i = 0; i < n; i++){ const a = Math.PI / 4 + i * Math.PI / 2, x = 35 + 13 * Math.cos(a), y = 35 + 13 * Math.sin(a), rr = Math.min(11, r * 0.55);
    h += `<circle cx="${x}" cy="${y}" r="${rr + 2}" fill="${col[i]}"/><circle cx="${x}" cy="${y}" r="${rr}" fill="${c.mat === 'Al' ? '#c9cfd3' : '#c8834a'}"/>`; }
  return h + '</svg>';
}
BUILD.cable = host => {
  host.innerHTML = `
  <div class="dev"><h3>المسار المشترك</h3><p class="note">كابلات المخارج الأربعة رباعية القلوب على حامل كابلات مثقّب واحد (طريقة ${L('E')})، طبقة واحدة متلامسة، وحرارة الهواء ${L('40 °C')}. كل كابل متوازٍ يُحسب دائرة في معامل التجميع. ${L('Iz = n · I0 · k1 · k2')}، والشرط ${L('Ib ≤ Ir ≤ Iz')}.</p></div>
  <div class="grid2" id="cb-f"></div>
  <details class="tb"><summary>جدول السعات I0 (A) — قيم نموذجية للتعلّم، IEC 60364-5-52، ثلاثة موصلات محمّلة</summary><div id="cb-t"></div></details>
  ${foot()}`;
  const ff = $('#cb-f', host);
  const segB = (k, vals, cur, lab) => `<span class="sgm" role="group" aria-label="${lab}">${vals.map(v => `<button type="button" data-seg="${k}" data-v="${v}" aria-pressed="${String(v) === String(cur)}">${v}</button>`).join('')}</span>`;
  function card(f){
    const c = S.cab[f.id], r = CK.cab.f[f.id];
    if (r.msg === 'wait') return `<div class="dev wait" data-f="${f.id}"><h3><span class="tag">${f.tag}</span>${esc(f.n)}</h3><p class="note">اختر قاطعًا صالحًا لهذا المخرج في تبويب القواطع أولًا. <button type="button" class="lnk" data-go="breaker">اذهب إلى التبويب</button></p></div>`;
    const ambs = Object.keys((c.meth === 'D' ? KT.gnd : KT.air).PVC);
    return `<div class="dev" data-f="${f.id}"><h3><span class="tag">${f.tag}</span>${esc(f.n)} ${L(`Ib ${f1(IB[f.id])} A · Ir ${f0(irOf(f.id))} A`)}</h3>
      <div class="row" style="justify-content:space-between"><div class="row">${segB('mat', ['Cu', 'Al'], c.mat, 'المادة')}${segB('ins', ['PVC', 'XLPE'], c.ins, 'العزل')}</div><span class="ci">${cableIcon(c)}</span></div>
      <label>طريقة التمديد ${segB('meth', ['C', 'E', 'D'], c.meth, 'طريقة التمديد')}</label>
      <label>${c.meth === 'D' ? 'حرارة التربة' : 'حرارة الهواء'}<select data-k="amb" aria-label="Ambient ${f.tag}">${opts(ambs, c.amb, v => v + ' °C')}</select></label>
      <label>عدد الدوائر المتجاورة<select data-k="grp" aria-label="Grouping ${f.tag}">${opts([1, 2, 3, 4, 5, 6, 7, 8, 9], c.grp)}</select></label>
      <label>كابلات متوازية<select data-k="runs" aria-label="Runs ${f.tag}">${opts([1, 2, 3, 4], c.runs)}</select></label>
      <label>المقطع<select data-k="s" aria-label="Size ${f.tag}">${opts(SZ, c.s, v => v + ' mm²', 'اختر…')}</select></label>
      <div class="res"></div></div>`;
  }
  function res(f){
    const c = S.cab[f.id], r = CK.cab.f[f.id]; if (r.msg === 'wait') return '';
    const k = cabK(c); let fx = `k1 (${c.ins}, ${c.amb} °C) = ${k.k1 || '—'} · k2 (${c.meth}, n = ${c.grp}) = ${k.k2}`;
    if (c.s){ const i = SZ.indexOf(c.s), I0 = cabI0(c, i); if (I0){ const iz = cabIz(c, i), ir = irOf(f.id); fx += `<br>Iz = ${c.runs} × ${I0} × ${k.k1} × ${k.k2} = <b>${f1(iz)} A</b><br>${f1(IB[f.id])} ≤ ${f0(ir)} ≤ ${f1(iz)} <span class="${iz >= ir ? 'ok' : 'bad'}">${iz >= ir ? '✓' : '✗'}</span>`; } }
    return pill(r) + msgOf(r) + `<div class="fx">${fx}</div>`;
  }
  function table(){
    const c = FD.map(f => S.cab[f.id]).find(x => x) || {mat:'Cu', ins:'XLPE'};
    const keys = ['Cu-PVC', 'Cu-XLPE', 'Al-PVC', 'Al-XLPE'];
    let h = `<div class="tblw"><table class="tbl hm"><thead><tr><th>S (mm²)</th>${keys.map(k => ['C', 'E', 'D'].map(m => `<th>${k} ${m}</th>`).join('')).join('')}</tr></thead><tbody>`;
    SZ.forEach((s, i) => { h += `<tr><td><b>${s}</b></td>${keys.map(k => ['C', 'E', 'D'].map(m => `<td class="${k === 'Cu-XLPE' && m === 'E' ? 'hl' : ''}">${AMP[k][m][i] || '—'}</td>`).join('')).join('')}</tr>`; });
    h += `</tbody></table></div><p class="note">معامل الحرارة k1 (هواء، مرجع 30 °C): PVC ${L('40 °C → 0.87')}، XLPE ${L('40 °C → 0.91')}. معامل التجميع k2 لطريقة E: ${L('1.00 / 0.88 / 0.82 / 0.79 / 0.76 / 0.73')} لـ ${L('n = 1…6')}.</p>`;
    $('#cb-t', host).innerHTML = h;
  }
  function draw(){ ff.innerHTML = FD.map(card).join(''); upd(); }
  function upd(){ $$('[data-f]', ff).forEach(d => { const f = FDM[d.dataset.f], r = CK.cab.f[f.id]; if (r.msg === 'wait') return; d.className = 'dev' + (r.st ? ' ' + r.st : ''); $('.res', d).innerHTML = res(f); $('.ci', d).innerHTML = cableIcon(S.cab[f.id]); }); }
  function redrawCard(id){ const d = $(`[data-f="${id}"]`, ff); const nd = document.createElement('div'); nd.innerHTML = card(FDM[id]); d.replaceWith(nd.firstElementChild); }
  ff.addEventListener('click', e => { const b = e.target.closest('[data-seg]'); if (!b) return; const d = b.closest('[data-f]'), c = S.cab[d.dataset.f], k = b.dataset.seg;
    c[k] = b.dataset.v; if (k === 'meth'){ const ambs = Object.keys((c.meth === 'D' ? KT.gnd : KT.air).PVC).map(Number); if (ambs.indexOf(+c.amb) < 0) c.amb = c.meth === 'D' ? 20 : 30; }
    changed(); redrawCard(d.dataset.f); upd(); });
  ff.addEventListener('change', e => { const t = e.target, d = t.closest('[data-f]'); if (!d || !t.dataset.k) return; S.cab[d.dataset.f][t.dataset.k] = +t.value || 0; changed(); upd(); });
  bindCommon(host);
  let lastSig = '';
  const sig = () => FD.map(f => CK.cab.f[f.id].msg === 'wait').join();
  G.cable.upd = () => { const s = sig(); if (s !== lastSig){ lastSig = s; draw(); } else upd(); };
  table(); draw(); lastSig = sig();
  demo(host, 'cable', async () => {
    prep('cable'); draw(); await sleep(300);
    const sol = {smdb:[2, 150], mcc:[1, 240], ldb:[1, 25], acdb:[1, 240]};
    for (const f of FD){ const q = s => $(`[data-f="${f.id}"] ${s}`, ff);
      await dClick(q('[data-seg="ins"][data-v="XLPE"]'), 380); await dClick(q('[data-seg="meth"][data-v="E"]'), 380);
      await dSet(q('[data-k="amb"]'), 40); await dSet(q('[data-k="runs"]'), sol[f.id][0]); }
    for (const f of FD){ const q = s => $(`[data-f="${f.id}"] ${s}`, ff); await dSet(q('[data-k="grp"]'), 5); await dSet(q('[data-k="s"]'), sol[f.id][1]); }
  });
};

/* =====================================================================
   TAB 4 · voltage drop, Ik and k²S²
   ===================================================================== */
function sitePlan(){
  const pts = {mdb:[60, 70], smdb:[300, 40], mcc:[330, 112], ldb:[546, 46], acdb:[452, 144]};
  let h = `<svg viewBox="0 0 640 200" role="img" aria-label="مخطط الموقع"><rect x="2" y="2" width="636" height="196" rx="8" fill="var(--bg)" stroke="var(--line)"/>`;
  h += `<rect x="20" y="40" width="90" height="70" rx="4" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="65" y="81" text-anchor="middle" font-size="18" font-weight="700" fill="var(--ink)">MDB</text>`;
  const route = {smdb:'M110 60 H300', mcc:'M110 90 H200 V132 H330', ldb:'M110 50 H180 V20 H588 V46', acdb:'M110 100 H170 V164 H452'};
  FD.forEach(f => { const [x, y] = pts[f.id];
    h += `<path d="${route[f.id]}" fill="none" stroke="var(--cur)" stroke-width="2.4" stroke-dasharray="6 4"/>`;
    h += `<rect x="${x}" y="${y}" width="84" height="40" rx="4" fill="var(--panel)" stroke="var(--ink)"/><text x="${x + 42}" y="${y + 26}" text-anchor="middle" font-size="17" font-weight="700" fill="var(--ink)">${f.tag}</text>`; });
  const lab = {smdb:[205, 56], mcc:[262, 128], ldb:[380, 24], acdb:[310, 160]};
  FD.forEach(f => { const [x, y] = lab[f.id]; h += `<rect x="${x - 32}" y="${y - 15}" width="64" height="23" rx="4" fill="var(--panel)" stroke="var(--cur)"/><text x="${x}" y="${y + 3}" text-anchor="middle" font-size="16" font-weight="700" fill="var(--cur)">${f.L} m</text>`; });
  return h + `</svg>`;
}
BUILD.vdrop = host => {
  host.innerHTML = `
  <div class="svgw">${sitePlan()}</div>
  <div class="fm">ΔU % = √3 · Ib · L · (R·cos φ + X·sin φ) / U × 100</div>
  <p class="note">مخطط الموقع أعلاه يعطي طول كل مسار. تُؤخذ R عند حرارة التشغيل، ويُضاف إلى هبوط المغذّي هبوط الدوائر النهائية داخل كل لوحة. الحد 3 % للإنارة و 5 % لغيرها. ثم يُحسب تيار القصر عند كل لوحة، ويُفحص تحمّل الكابل بتيار القصر عند MDB وزمن فصل قاطعه.</p>
  <div class="fx">R(θ) = R20 · (1 + α·(θ − 20)), θ = 70 °C PVC / 90 °C XLPE, X = 0.08 Ω/km<br>Ik = U / (√3 · |Z_tr + Z_cable|), Z_tr = 1.68 + j9.45 mΩ<br>k²S² ≥ I²t, k = 143 Cu/XLPE · 115 Cu/PVC</div>
  <div class="grid2" id="vd-f"></div>
  <div class="tblw" id="vd-t"></div>
  ${foot()}`;
  const ff = $('#vd-f', host);
  function card(f){
    const c = S.cab[f.id], r = CK.vd.f[f.id];
    if (r.all.msg === 'wait') return `<div class="dev wait" data-f="${f.id}"><h3><span class="tag">${f.tag}</span>${esc(f.n)}</h3><p class="note">أكمل كابل هذا المخرج في تبويب الكابلات أولًا. <button type="button" class="lnk" data-go="cable">اذهب إلى التبويب</button></p></div>`;
    return `<div class="dev" data-f="${f.id}"><h3><span class="tag">${f.tag}</span>${esc(f.n)} ${L(`${c.mat}/${c.ins}`)}</h3>
      <label>طول المسار L (m)<input type="number" step="1" inputmode="numeric" data-k="len" value="${esc(S.len[f.id])}" aria-label="Length ${f.tag}"></label>
      <label>المقطع<select data-k="s" aria-label="Size ${f.tag}">${opts(SZ.filter((s, i) => cabI0(c, i)), c.s, v => (c.runs > 1 ? c.runs + ' × ' : '') + v + ' mm²')}</select></label>
      <div class="res"></div></div>`;
  }
  function res(f){
    const r = CK.vd.f[f.id]; if (r.all.msg === 'wait') return '';
    if (!r.d) return pill(r.all) + msgOf(r.all);
    const c = S.cab[f.id], d = r.d, k = r.k;
    return pill(r.all) + msgOf(r.all) + `<div class="fx">R = ${fmt(d.R, 4)} Ω/km, X = ${fmt(d.X, 3)} Ω/km, cos φ = ${fmt(d.cos, 3)}<br>ΔU = √3 × ${f1(IB[f.id])} × ${fmt(FDM[f.id].L / 1000, 3)}<br>&nbsp;&nbsp;× (${fmt(d.R, 4)} × ${fmt(d.cos, 3)} + ${fmt(d.X, 3)} × ${fmt(d.sin, 3)})<br>&nbsp;&nbsp;= ${f2(d.dv)} V = <b>${f2(d.pct)} %</b><br>ΔU total = ${f2(d.pct)} + ${f1(FDM[f.id].fin)} = <b class="${r.tot <= FDM[f.id].lim ? 'ok' : 'bad'}">${f2(r.tot)} %</b> (≤ ${FDM[f.id].lim} %)<br>Ik at ${f.tag} = <b>${f2(r.isc)} kA</b><br>k²S² = (${k.k} × ${c.s})² = ${sci(k.lhs)}<br>I²t = (${f2(k.Ik / 1000 / c.runs)}k)² × ${f2(k.t)} s = ${sci(k.rhs)} <span class="${k.ok ? 'ok' : 'bad'}">${k.ok ? '✓' : '✗'}</span></div>`;
  }
  function table(){
    let h = `<table class="tbl hm"><thead><tr><th>Feeder</th><th>Cable</th><th>L (m)</th><th>ΔU feeder</th><th>+ final</th><th>ΔU total</th><th>Limit</th><th>Ik (kA)</th><th>k²S²</th></tr></thead><tbody>`;
    FD.forEach(f => { const r = CK.vd.f[f.id], c = S.cab[f.id];
      h += r.d ? `<tr><td><b>${f.tag}</b></td><td>${c.runs > 1 ? c.runs + '×' : ''}${c.s} ${c.mat}/${c.ins}</td><td>${f.L}</td><td>${f2(r.d.pct)} %</td><td>${f1(f.fin)} %</td><td class="${r.tot <= f.lim ? 'ok' : 'bad'}">${f2(r.tot)} %</td><td>${f.lim} %</td><td>${f2(r.isc)}</td><td class="${r.k.ok ? 'ok' : 'bad'}">${r.k.ok ? '✓' : '✗'}</td></tr>` : `<tr><td><b>${f.tag}</b></td><td colspan="8">—</td></tr>`; });
    $('#vd-t', host).innerHTML = h + `<tr><td><b>MDB</b></td><td colspan="6">Ik = In_tr / uk</td><td>${f2(TRF.Ik)}</td><td></td></tr></tbody></table>`;
  }
  function draw(){ ff.innerHTML = FD.map(card).join(''); upd(); }
  function upd(){ $$('[data-f]', ff).forEach(d => { const f = FDM[d.dataset.f], r = CK.vd.f[f.id]; if (r.all.msg === 'wait') return; d.className = 'dev' + (r.all.st ? ' ' + r.all.st : ''); $('.res', d).innerHTML = res(f); }); table(); }
  ff.addEventListener('change', e => { const t = e.target, d = t.closest('[data-f]'); if (!d) return; const id = d.dataset.f;
    if (t.dataset.k === 'len') S.len[id] = t.value; else if (t.dataset.k === 's') S.cab[id].s = +t.value; changed(); upd(); });
  bindCommon(host);
  let lastSig = '';
  const sig = () => FD.map(f => CK.vd.f[f.id].all.msg === 'wait').join();
  G.vdrop.upd = () => { const s = sig(); if (s !== lastSig){ lastSig = s; draw(); } else upd(); };
  draw(); lastSig = sig();
  demo(host, 'vdrop', async () => {
    prep('vdrop'); draw(); await sleep(300);
    for (const f of FD) await dSet($(`[data-f="${f.id}"] [data-k="len"]`, ff), f.L);
    await sleep(700); await dSet($('[data-f="ldb"] [data-k="s"]', ff), 35, 700);
  });
};

/* =====================================================================
   TAB 5 · busbar
   ===================================================================== */
function busSVG(){
  const b = S.bus, bar = BARS.find(x => x.id === b.bar) || BARS[5], two = !!bar.two, w = parseInt(bar.id.replace('2x(', ''), 10) || 80;
  const sc = 1.5, th = 10 * sc, dpx = 30 + b.d * 3.6, H = w * sc, x0 = 28, y0 = 46;
  const col = ['var(--c-l1)', 'var(--c-l2)', 'var(--c-l3)', 'var(--c-n)'], nm = ['L1', 'L2', 'L3', 'N'];
  const mk = id => `<marker id="${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker>`;
  let h = `<div class="grid2"><div class="svgw"><svg viewBox="0 0 340 ${y0 + H + 70}" role="img" aria-label="مقطع البارات"><defs>${mk('ar')}<pattern id="pe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="8" fill="#f2d21b"/></pattern></defs><text x="8" y="18" font-size="13" font-weight="700" fill="var(--ink)">Cross-section</text>`;
  for (let i = 0; i < 4; i++){ const x = x0 + i * dpx;
    h += `<rect x="${x}" y="${y0}" width="${th}" height="${H}" fill="${col[i]}" stroke="var(--ink)" stroke-width=".6"/>`; if (two) h += `<rect x="${x + 2 * th}" y="${y0}" width="${th}" height="${H}" fill="${col[i]}" stroke="var(--ink)" stroke-width=".6"/>`;
    h += `<text x="${x + (two ? 1.5 : 0.5) * th}" y="${y0 + H + 16}" text-anchor="middle" font-size="13" fill="var(--ink)">${nm[i]}</text>`; }
  const ax = x0 + (two ? 1.5 : 0.5) * th;
  h += `<line x1="${ax}" y1="${y0 - 10}" x2="${ax + dpx}" y2="${y0 - 10}" stroke="var(--muted)" marker-end="url(#ar)" marker-start="url(#ar)"/><text x="${ax + dpx + 6}" y="${y0 - 6}" font-size="13" fill="var(--muted)">d = ${b.d} cm</text>`;
  const pb = BARS.find(x => x.id === b.pe), pw = pb ? (parseInt(pb.id.replace('2x(', ''), 10) || 40) * sc : 0;
  if (pb) h += `<rect x="${x0}" y="${y0 + H + 30}" width="${pw}" height="${th}" fill="var(--c-pe)" stroke="var(--ink)" stroke-width=".6"/><rect x="${x0}" y="${y0 + H + 30}" width="${pw}" height="${th}" fill="url(#pe)"/><text x="${x0 + pw + 8}" y="${y0 + H + 42}" font-size="13" fill="var(--ink)">PE ${barName(pb.id)}</text>`;
  h += `<text x="332" y="${y0 + H + 16}" text-anchor="end" font-size="12" fill="var(--muted)">${barName(bar.id)}</text></svg></div>`;
  /* side view with supports */
  const sx = 20, sy = 96, span = b.L * 3, F = CK.bus.F || 0, okF = F <= F_INS, fc = okF ? 'var(--good)' : 'var(--bad)';
  h += `<div class="svgw"><svg viewBox="0 0 340 230" role="img" aria-label="الدعامات"><defs>${mk('ar2')}<marker id="fa" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="${fc}"/></marker></defs><text x="8" y="18" font-size="13" font-weight="700" fill="var(--ink)">Side view · supports</text>`;
  h += `<rect x="${sx}" y="${sy}" width="300" height="12" fill="var(--c-l1)" stroke="var(--ink)" stroke-width=".6"/>`;
  for (let x = sx + 10; x <= sx + 300; x += span){
    h += `<rect x="${x - 7}" y="${sy + 12}" width="14" height="40" rx="3" fill="var(--bg)" stroke="var(--ink)"/><line x1="${x - 14}" y1="${sy + 52}" x2="${x + 14}" y2="${sy + 52}" stroke="var(--ink)" stroke-width="3"/>`;
    if (b.icw){ const len = Math.min(62, 12 + F / 120); h += `<line x1="${x}" y1="${sy - 6}" x2="${x}" y2="${sy - 6 - len}" stroke="${fc}" stroke-width="3" marker-end="url(#fa)"/>`; } }
  h += `<line x1="${sx + 10}" y1="${sy + 66}" x2="${sx + 10 + span}" y2="${sy + 66}" stroke="var(--muted)" marker-end="url(#ar2)" marker-start="url(#ar2)"/><text x="${sx + 10 + span / 2}" y="${sy + 84}" text-anchor="middle" font-size="13" fill="var(--muted)">L = ${b.L} cm</text>`;
  if (b.icw) h += `<text x="${sx}" y="${sy + 116}" font-size="15" font-weight="700" fill="${fc}">F = ${f2(F / 1000)} kN ${okF ? '≤' : '>'} ${F_INS / 1000} kN</text>`;
  return h + '</svg></div></div>';
}
BUILD.busbar = host => {
  const inc = S.load.inc || 1600;
  host.innerHTML = `
  <p class="note">البار الرئيسي يحمل التيار المقنّن لقاطع المدخل (${L(inc + ' A')})، لا الحمل المحسوب فقط. غرفة الكهرباء ${L(ROOM + ' °C')}، فيُضرب تيار الجدول في ${L(String(BKT[ROOM]))}. تحمّل العازل الواحد ${L(F_INS / 1000 + ' kN')}.</p>
  <div class="tblw"><table class="tbl hm"><thead><tr><th>Bar (Cu, painted)</th><th>mm²</th><th>35 °C</th><th>40 °C ×0.94</th><th>45 °C ×0.88</th><th>50 °C ×0.81</th></tr></thead><tbody>${BAR_PH.map(b => `<tr><td><b>${barName(b.id)}</b></td><td>${b.a}</td><td>${b.I}</td><td class="hl">${f0(b.I * 0.94)}</td><td>${f0(b.I * 0.88)}</td><td>${f0(b.I * 0.81)}</td></tr>`).join('')}</tbody></table></div>
  <div class="grid2">
    <div class="dev" id="bb-c">
      <label>بار الطور<select data-k="bar" aria-label="Phase bar">${opts(BAR_PH.map(b => b.id), S.bus.bar, barName, 'اختر…')}</select></label>
      <label>Icw (1 s)<select data-k="icw" aria-label="Icw">${opts(ICW, S.bus.icw, v => v + ' kA', 'اختر…')}</select></label>
      <label>المسافة بين محاور الأطوار d<select data-k="d" aria-label="Phase spacing">${opts([6, 8, 10, 12, 15], S.bus.d, v => v + ' cm')}</select></label>
      <div class="rng"><label><span>الدعامات</span><input type="range" min="20" max="80" step="5" value="${S.bus.L}" data-k="L" aria-label="Support spacing"><b id="bb-L">L = ${S.bus.L} cm</b></label></div>
      <label>بار المحايد N<select data-k="n" aria-label="Neutral bar">${opts(BARS.map(b => b.id), S.bus.n, barName, 'اختر…')}</select></label>
      <label>بار الحماية PE<select data-k="pe" aria-label="PE bar">${opts(BARS.map(b => b.id), S.bus.pe, barName, 'اختر…')}</select></label>
    </div>
    <div class="dev"><div class="fx" id="bb-fx"></div><ul class="chk" id="bb-ck"></ul></div>
  </div>
  <div id="bb-svg"></div>
  ${foot()}`;
  const c = $('#bb-c', host);
  function onCh(e){ const t = e.target, k = t.dataset.k; if (!k) return; S.bus[k] = (k === 'bar' || k === 'n' || k === 'pe') ? t.value : +t.value || 0; if (k === 'L') $('#bb-L', host).textContent = `L = ${S.bus.L} cm`; changed(); }
  c.addEventListener('change', onCh); c.addEventListener('input', e => { if (e.target.dataset.k === 'L') onCh(e); });
  bindCommon(host);
  G.busbar.upd = () => {
    const b = S.bus, ck = CK.bus, ip = ck.ip;
    $('#bb-fx', host).innerHTML = b.icw ? `n (Icw ${b.icw} kA) = ${nPeak(b.icw)}<br>ip = κ·√2·Icw = ${nPeak(b.icw)} × ${b.icw} = <b>${f1(ip)} kA</b><br>F = 0.2 × ip² × L / d<br>&nbsp;&nbsp;= 0.2 × ${f1(ip)}² × ${b.L} / ${b.d} = <b>${f0(ck.F)} N</b><br><span style="color:var(--muted)">ip in kA, L and d in cm → F in N</span>` : 'ip = κ·√2·Icw · F = 0.2 · ip² · L / d';
    const lab = {th:'التيار عند حرارة الغرفة', icw:'تحمّل القصر Icw', f:'القوة على الدعامة', n:'المحايد N = 100 %', pe:'PE ≥ S/2 (IEC 60364-5-54)'};
    $('#bb-ck', host).innerHTML = Object.keys(lab).map(k => `<li class="${ck.it[k].st}">${ar(ck.it[k].msg || lab[k])}</li>`).join('');
    $('#bb-svg', host).innerHTML = busSVG();
  };
  G.busbar.upd();
  demo(host, 'busbar', async () => {
    const q = k => $(`[data-k="${k}"]`, c);
    await dSet(q('bar'), '2x(60x10)'); await sleep(500); await dSet(q('bar'), '2x(80x10)'); await dSet(q('icw'), 36); await dSet(q('d'), 10);
    await dSet(q('L'), 50); await sleep(500); await dSet(q('L'), 40); await dSet(q('n'), '2x(80x10)'); await dSet(q('pe'), '80x10');
  });
};

/* =====================================================================
   TAB 6 · selectivity on log-log time-current curves
   ===================================================================== */
BUILD.select = host => {
  const W = 640, H = 470, X0 = 54, Y0 = 14, PW = W - X0 - 14, PH = H - Y0 - 40;
  const xI = I => X0 + (Math.log10(I) - 1) / 4 * PW, yT = t => Y0 + (4 - Math.log10(t)) / 6 * PH;
  const Ix = x => Math.pow(10, 1 + (x - X0) / PW * 4), Ty = y => Math.pow(10, 4 - (y - Y0) / PH * 6);
  const COL = {A:'var(--t2)', M:'var(--t1)', P:'var(--t3)'};
  let act = 'A';
  host.innerHTML = `
  <div class="row"><div class="chips2" id="sl-d" role="group" aria-label="القاطع">
    <button type="button" class="btn" data-d="A"><i style="background:var(--t2)"></i>ACB المدخل</button>
    <button type="button" class="btn" data-d="M"><i style="background:var(--t1)"></i>مغذّي MCC</button>
    <button type="button" class="btn" data-d="P"><i style="background:var(--t3)"></i>مضخة P-1</button></div><span id="sl-b"></span></div>
  <div class="svgw tcc"><svg viewBox="0 0 ${W} ${H}" id="sl-svg" role="img" aria-label="منحنيات الزمن والتيار"><g id="sl-g"></g><g id="sl-c"></g><g id="sl-h"></g></svg></div>
  <p class="note">في الدرس 7 كانت الانتقائية بين مغذّي MCC وقاطع المضخة جزئية حتى ${L('4.8 kA')} لأن ${L('Ii = 4800 A')}. المطلوب هنا انتقائية كاملة حتى ${L('Ik MCC')}: جرّب إلغاء الفصل اللحظي للمغذّي (قاطع من الفئة B له ${L('Icw')}).</p>
  <p class="note">اسحب المقابض الملوّنة على المنحنى أو استخدم المنزلقات. المنطقة بين الخطين نطاق التفاوت: الخط المتقطع أبكر فصل، والمتصل آخر فصل. الانتقائية تتحقق عندما يبقى آخر فصل للسفلي تحت أبكر فصل للعلوي حتى تيار القصر عند موضع السفلي.</p>
  <div class="grid2"><div class="dev" id="sl-fp"></div><div class="dev"><ul class="chk" id="sl-ck"></ul></div></div>
  ${foot()}`;
  const svg = $('#sl-svg', host);
  /* grid */
  let g = `<rect x="${X0}" y="${Y0}" width="${PW}" height="${PH}" fill="var(--bg)" stroke="var(--line)"/>`;
  for (let d = 1; d <= 5; d++) for (let m = 1; m < 10; m++){ const I = m * Math.pow(10, d); if (I > 1e5) break; const x = xI(I); g += `<line class="${m === 1 ? 'gr' : 'gr2'}" x1="${x}" y1="${Y0}" x2="${x}" y2="${Y0 + PH}"/>`; }
  for (let d = -2; d <= 4; d++) for (let m = 1; m < 10; m++){ const t = m * Math.pow(10, d); if (t > 1e4) break; const y = yT(t); g += `<line class="${m === 1 ? 'gr' : 'gr2'}" x1="${X0}" y1="${y}" x2="${X0 + PW}" y2="${y}"/>`; }
  ['10 A', '100 A', '1 kA', '10 kA', '100 kA'].forEach((s, i) => g += `<text x="${xI(Math.pow(10, i + 1))}" y="${Y0 + PH + 15}" text-anchor="${i ? i === 4 ? 'end' : 'middle' : 'start'}">${s}</text>`);
  ['0.01', '0.1', '1', '10', '100', '1000', '10000'].forEach((s, i) => g += `<text x="${X0 - 5}" y="${yT(Math.pow(10, i - 2)) + 4}" text-anchor="end">${s}</text>`);
  g += `<text x="${X0 + PW}" y="${H - 4}" text-anchor="end">I (A)</text><text x="${X0 + 4}" y="${Y0 + 14}">t (s)</text>`;
  $('#sl-g', svg).innerHTML = g;
  function curve(d, mx){
    const thr = d.k === 'tm' ? [d.Ir * 1.05, d.Ir * 1.3, d.Im * 0.8, d.Im * 1.2] : [d.ir * d.In * 1.05, d.ir * d.In * 1.2, d.isd * d.ir * d.In * 0.9, d.isd * d.ir * d.In * 1.1].concat(d.ii ? [d.ii * d.In * 0.9, d.ii * d.In * 1.1] : []);
    const Is = []; for (let i = 0; i <= 260; i++) Is.push(10 * Math.pow(1e4, i / 260)); thr.forEach(v => { Is.push(v * 0.9999); Is.push(v * 1.0001); }); Is.sort((a, b) => a - b);
    const pts = []; Is.forEach(I => { const t = tDev(d, I, mx); if (isFinite(t) && t <= 1e4) pts.push([xI(I), yT(Math.max(0.01, t))]); });
    return pts;
  }
  const pth = p => p.length ? 'M' + p.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') : '';
  function draw(){
    const ck = CK.sel, D = {A:ck.A, M:ck.M, P:ck.P};
    let h = '';
    /* fault-level markers */
    [[ck.iscM, 'Ik MCC'], [TRF.Ik, 'Ik MDB']].forEach(([k, s]) => { const x = xI(k * 1000); h += `<line x1="${x}" y1="${Y0}" x2="${x}" y2="${Y0 + PH}" stroke="var(--bad)" stroke-dasharray="4 3" stroke-width="1.2"/><text x="${x - 3}" y="${Y0 + 12 + (s === 'Ik MCC' ? 14 : 0)}" text-anchor="end" style="fill:var(--bad)">${s} ${f1(k)} kA</text>`; });
    /* motor start */
    const Ist = ck.Ist; h += `<path d="M${xI(IB.mot)} ${yT(9000)}V${yT(5)}H${xI(Ist)}V${yT(0.01)}" fill="none" stroke="var(--muted)" stroke-width="1.4" stroke-dasharray="2 3"/><text x="${xI(IB.mot) + 4}" y="${yT(5) - 4}" style="font-size:10px">start 5 s</text>`;
    ['A', 'M', 'P'].forEach(k => { const mn = curve(D[k], false), mx = curve(D[k], true);
      const poly = mn.concat(mx.slice().reverse());
      h += `<path d="${pth(poly)}Z" fill="${COL[k]}" opacity="${k === act ? 0.16 : 0.08}"/><path d="${pth(mx)}" fill="none" stroke="${COL[k]}" stroke-width="${k === act ? 2.6 : 1.8}"/><path d="${pth(mn)}" fill="none" stroke="${COL[k]}" stroke-width="1.2" stroke-dasharray="5 3"/>`; });
    [[ck.lim1, 'A'], [ck.lim2, 'M']].forEach(([l]) => { if (l){ const x = xI(l); h += `<line x1="${x}" y1="${Y0}" x2="${x}" y2="${Y0 + PH}" stroke="var(--amber)" stroke-width="2.4"/><text x="${x + 4}" y="${Y0 + PH - 8}" style="fill:var(--amber);font-weight:700">${f2(l / 1000)} kA</text>`; } });
    $('#sl-c', svg).innerHTML = h;
    /* handles of the active device */
    const d = D[act]; let hh = '';
    const hd = (k, x, y, lab, off) => `<g class="hd${off ? ' off' : ''}" data-h="${k}"><circle cx="${x}" cy="${y}" r="11" fill="${COL[act]}"/><text x="${x}" y="${y + 4}" text-anchor="middle" style="fill:#fff;font-size:9px;font-weight:700">${lab}</text></g>`;
    if (d.k === 'el'){ const Irr = d.ir * d.In; hh += hd('ir', xI(Irr * 1.3), yT(Math.min(5000, tEl(d, Irr * 1.3, true))), 'Ir'); hh += hd('isd', xI(d.isd * Irr), yT(d.tsd), 'Isd');
      const iiMax = act === 'A' ? 15 : 15; hh += hd('ii', d.ii ? xI(d.ii * d.In) : Math.min(X0 + PW - 12, xI(iiMax * d.In * 1.35)), yT(0.02), d.ii ? 'Ii' : 'OFF', !d.ii); }
    else { hh += hd('ir', xI(d.Ir * 1.4), yT(Math.min(5000, tTM(d, d.Ir * 1.4, true))), 'Ir'); hh += hd('ii', xI(d.Im), yT(0.02), 'Ii'); }
    $('#sl-h', svg).innerHTML = hh;
    const b = $('#sl-b', host); const lim = [ck.lim1, ck.lim2].filter(Boolean);
    b.innerHTML = ck.full ? `<span class="badge ok">✓ انتقائية كاملة</span>` : `<span class="badge bad">انتقائية جزئية حتى ${L(f2(Math.min(...lim) / 1000) + ' kA')}</span>`;
    $('#sl-ck', host).innerHTML = Object.values(ck.it).map(x => `<li class="${x.st}">${ar(x.msg)}</li>`).join('');
    $$('#sl-d .btn', host).forEach(x => x.setAttribute('aria-pressed', x.dataset.d === act ? 'true' : 'false'));
    faceplate();
  }
  function rngRow(key, lab, arr, cur, txt){ const i = Math.max(0, arr.indexOf(cur)); return `<label><span>${lab}</span><input type="range" min="0" max="${arr.length - 1}" step="1" value="${i}" data-r="${key}" aria-label="${lab}"><b>${txt}</b></label>`; }
  function faceplate(){
    const fp = $('#sl-fp', host), ck = CK.sel; let h;
    if (act === 'A'){ const a = S.acb, In = ck.A.In, Irr = a.ir * In;
      h = `<h3><span class="tag">Q0</span>${L('ACB ' + In + ' A · LSI')}</h3><div class="rng">${rngRow('A.ir', 'Ir', ACB_IR, a.ir, f0(Irr) + ' A')}${rngRow('A.isd', 'Isd', ISD, a.isd, f0(a.isd * Irr) + ' A')}${rngRow('A.tsd', 'tsd', TSD, a.tsd, a.tsd + ' s')}${rngRow('A.ii', 'Ii', ACB_II, a.ii, a.ii ? f0(a.ii * In) + ' A' : 'OFF')}</div><p class="note">${L('tr = 12 s @ 6·Ir')} · نفس ضبط تبويب القواطع.</p>`; }
    else if (act === 'M'){ const m = S.mcc, d = ck.M, Irr = d.ir * d.In;
      h = `<h3><span class="tag">MCC</span>${L('MCCB ' + d.In + ' A')} إلكتروني ${L('Ir = ' + f0(Irr) + ' A')}</h3><div class="rng">${rngRow('M.isd', 'Isd', ISD, m.isd, f0(m.isd * Irr) + ' A')}${rngRow('M.tsd', 'tsd', TSD, m.tsd, m.tsd + ' s')}${rngRow('M.ii', 'Ii', MCC_II, m.ii, m.ii ? f0(m.ii * d.In) + ' A' : 'OFF')}</div><p class="note">Ir من تبويب القواطع. ${L('Ii = OFF')} متاح لقاطع من الفئة B له ${L('Icw')}.</p>`; }
    else { const p = S.mot;
      h = `<h3><span class="tag">P-1</span>${L('MCCB 50 A')} لمضخة ${L('15 kW')} ${L('Ib = ' + f1(IB.mot) + ' A')}</h3><div class="rng">${rngRow('P.ir', 'Ir', MOT_IR, p.ir, p.ir + ' A')}${rngRow('P.ii', 'Ii', MOT_II, p.ii, p.ii + '×Ir = ' + f0(p.ii * p.ir) + ' A')}</div><p class="note">تيار البدء ${L('Ist = 7.2 × Ib = ' + f0(CK.sel.Ist) + ' A')} لمدة ${L('5 s')}.</p>`; }
    if (fp.dataset.k !== act + JSON.stringify([S.acb, S.mcc, S.mot])){ const foc = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.r : null; fp.innerHTML = h; fp.dataset.k = act + JSON.stringify([S.acb, S.mcc, S.mot]); if (foc && !DEMO){ const n = $(`[data-r="${foc}"]`, fp); if (n) n.focus(); } }
  }
  const RARR = {'A.ir':[ACB_IR, 'acb', 'ir'], 'A.isd':[ISD, 'acb', 'isd'], 'A.tsd':[TSD, 'acb', 'tsd'], 'A.ii':[ACB_II, 'acb', 'ii'], 'M.isd':[ISD, 'mcc', 'isd'], 'M.tsd':[TSD, 'mcc', 'tsd'], 'M.ii':[MCC_II, 'mcc', 'ii'], 'P.ir':[MOT_IR, 'mot', 'ir'], 'P.ii':[MOT_II, 'mot', 'ii']};
  $('#sl-fp', host).addEventListener('input', e => { const k = e.target.dataset.r; if (!k) return; const [arr, o, f] = RARR[k]; S[o][f] = arr[+e.target.value]; changed(); });
  IL.onAct(host, '#sl-d .btn', t => { act = t.dataset.d; draw(); });
  /* dragging */
  let drag = null;
  const nearest = (arr, v, skip0) => arr.reduce((b, x) => (skip0 && !x) ? b : (b == null || Math.abs(Math.log(x) - Math.log(v)) < Math.abs(Math.log(b) - Math.log(v)) ? x : b), null);
  function pt(e){ const m = svg.getScreenCTM(); if (!m) return null; const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(m.inverse()); }
  svg.addEventListener('pointerdown', e => { const h = e.target.closest('.hd'); if (!h) return; drag = h.dataset.h; try { svg.setPointerCapture(e.pointerId); } catch (x){} e.preventDefault(); });
  svg.addEventListener('pointermove', e => {
    if (!drag) return; const p = pt(e); if (!p) return; const I = Ix(p.x), t = Ty(p.y), ck = CK.sel;
    const o = act === 'A' ? S.acb : act === 'M' ? S.mcc : S.mot, d = ck[act];
    let ch = false; const set = (k, v) => { if (o[k] !== v){ o[k] = v; ch = true; } };
    if (act === 'P'){ if (drag === 'ir') set('ir', nearest(MOT_IR, I)); else set('ii', nearest(MOT_II, I / S.mot.ir)); }
    else if (drag === 'ir'){ if (act === 'A') set('ir', nearest(ACB_IR, I / d.In)); }
    else if (drag === 'isd'){ set('isd', nearest(ISD, I / (d.ir * d.In))); set('tsd', nearest(TSD, t)); }
    else if (drag === 'ii'){ const arr = act === 'A' ? ACB_II : MCC_II, mx = Math.max(...arr) * d.In; set('ii', I > mx * 1.2 ? 0 : nearest(arr, I / d.In, true)); }
    if (ch) changed();
  });
  const end = () => { drag = null; };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  bindCommon(host);
  G.select.upd = draw;
  draw();
  demo(host, 'select', async () => {
    prep('select'); await sleep(200);
    const q = k => $(`[data-r="${k}"]`, host), idx = (arr, v) => arr.indexOf(v);
    act = 'A'; draw(); await sleep(400);
    await dSet(q('A.ir'), idx(ACB_IR, 0.9)); await dSet(q('A.isd'), idx(ISD, 4)); await dSet(q('A.tsd'), idx(TSD, 0.3)); await dSet(q('A.ii'), idx(ACB_II, 0));
    act = 'M'; draw(); await sleep(500);
    await dSet(q('M.isd'), idx(ISD, 6)); await dSet(q('M.tsd'), idx(TSD, 0.1)); await dSet(q('M.ii'), idx(MCC_II, 0));
    act = 'P'; draw(); await sleep(500);
    await dSet(q('P.ir'), idx(MOT_IR, 32)); await dSet(q('P.ii'), idx(MOT_II, 13));
  });
};

/* =====================================================================
   TAB 7 · earthing
   ===================================================================== */
function earthSVG(sys){
  const tx = 40, ty = 30;
  let h = `<svg viewBox="0 0 640 250" role="img" aria-label="${sys}"><rect x="2" y="2" width="636" height="246" rx="8" fill="var(--bg)" stroke="var(--line)"/>`;
  h += `<circle cx="${tx + 30}" cy="${ty + 40}" r="26" fill="none" stroke="var(--ink)" stroke-width="2"/><text x="${tx + 30}" y="${ty + 44}" text-anchor="middle" font-size="14" fill="var(--ink)">Dyn11</text>`;
  const ys = [ty + 10, ty + 30, ty + 50, ty + 70], nm = ['L1', 'L2', 'L3', 'N'], col = ['var(--c-l1)', 'var(--c-l2)', 'var(--c-l3)', 'var(--c-n)'];
  ys.forEach((y, i) => h += `<line x1="${tx + 56}" y1="${y}" x2="560" y2="${y}" stroke="${col[i]}" stroke-width="2.2"/><text x="566" y="${y + 4}" font-size="14" fill="var(--ink)">${nm[i]}</text>`);
  const peY = ty + 95;
  if (sys === 'TN-S') h += `<line x1="${tx + 30}" y1="${ty + 70}" x2="${tx + 30}" y2="${peY}" stroke="var(--c-pe)" stroke-width="2.2"/><line x1="${tx + 30}" y1="${peY}" x2="560" y2="${peY}" stroke="var(--c-pe)" stroke-width="2.2"/><text x="566" y="${peY + 4}" font-size="14" fill="var(--ink)">PE</text>`;
  /* source earth */
  const ge = (x, y, lab) => `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 16}" stroke="var(--c-pe)" stroke-width="2"/><line x1="${x - 12}" y1="${y + 16}" x2="${x + 12}" y2="${y + 16}" stroke="var(--c-pe)" stroke-width="2"/><line x1="${x - 8}" y1="${y + 21}" x2="${x + 8}" y2="${y + 21}" stroke="var(--c-pe)" stroke-width="2"/><line x1="${x - 4}" y1="${y + 26}" x2="${x + 4}" y2="${y + 26}" stroke="var(--c-pe)" stroke-width="2"/>${lab ? `<text x="${x + 14}" y="${y + 22}" font-size="14" fill="var(--ink)">${lab}</text>` : ''}`;
  if (sys === 'IT') h += `<rect x="${tx + 22}" y="${ty + 100}" width="16" height="30" fill="none" stroke="var(--ink)"/><text x="${tx + 44}" y="${ty + 120}" font-size="13" fill="var(--muted)">IMD</text><line x1="${tx + 30}" y1="${ty + 70}" x2="${tx + 30}" y2="${ty + 100}" stroke="var(--ink)" stroke-dasharray="3 3"/>` + ge(tx + 30, ty + 130, '');
  else h += `<line x1="${tx + 30}" y1="${ty + 70}" x2="${tx + 30}" y2="${sys === 'TN-S' ? peY : ty + 130}" stroke="var(--c-pe)" stroke-width="2"/>` + ge(tx + 30, sys === 'TN-S' ? peY + 40 : ty + 130, sys === 'TT' ? 'RB 1 Ω' : '');
  if (sys === 'TN-S') h += `<line x1="${tx + 30}" y1="${peY}" x2="${tx + 30}" y2="${peY + 40}" stroke="var(--c-pe)" stroke-width="2"/>`;
  /* load with frame fault */
  const lx = 420, ly = ty + 120;
  h += `<rect x="${lx}" y="${ly}" width="90" height="56" rx="6" fill="var(--panel)" stroke="var(--ink)" stroke-width="2"/><text x="${lx + 45}" y="${ly + 33}" text-anchor="middle" font-size="12" fill="var(--ink)">Motor frame</text>`;
  h += `<line x1="${lx + 20}" y1="${ys[0]}" x2="${lx + 20}" y2="${ly}" stroke="var(--c-l1)" stroke-width="2"/><path d="M${lx + 20} ${ly + 6} l8 6 l-8 6 l8 6" fill="none" stroke="var(--bad)" stroke-width="2.5"/>`;
  if (sys === 'TN-S') h += `<line x1="${lx + 70}" y1="${peY}" x2="${lx + 70}" y2="${ly}" stroke="var(--c-pe)" stroke-width="2"/>`;
  else h += `<line x1="${lx + 70}" y1="${ly + 56}" x2="${lx + 70}" y2="${ly + 70}" stroke="var(--c-pe)" stroke-width="2"/>` + ge(lx + 70, ly + 70, 'RA 10 Ω');
  /* animated fault path */
  let p, txt;
  if (sys === 'TN-S'){ p = `M${tx + 56} ${ys[0]} H${lx + 20} V${ly + 20} H${lx + 70} V${peY} H${tx + 30} V${ty + 70}`; txt = 'TN-S: يعود تيار العطل عبر موصل PE إلى نقطة التعادل، فيكون If = 0.95 × U0 / Zs بالكيلو أمبير ويفصل القاطع خلال أجزاء من الثانية.'; }
  else if (sys === 'TT'){ p = `M${tx + 56} ${ys[0]} H${lx + 20} V${ly + 20} H${lx + 70} V${ly + 86} H${tx + 30} V${ty + 70}`; txt = 'TT: يعود التيار عبر الأرض بين القطبين RA و RB، فيكون If = 230 / (10 + 1) ≈ 21 A فقط، ولا يفصل القاطع؛ لذلك يلزم RCD.'; }
  else { p = `M${tx + 56} ${ys[0]} H${lx + 20} V${ly + 20} H${lx + 70} V${ly + 86} H300 V${ty + 150}`; txt = 'IT: نقطة التعادل معزولة، فأول عطل يمرّر تيارًا سعويًا صغيرًا عبر سعة الكابلات، وينبّه جهاز مراقبة العزل IMD دون فصل.'; }
  h += `<path class="fpath" d="${p}"/>`;
  earthSVG.txt = txt;
  if (sys === 'IT') h += `<text x="300" y="${ty + 166}" text-anchor="middle" font-size="13" fill="var(--muted)">C (cable capacitance)</text>`;
  return h + '</svg>';
}
BUILD.earth = host => {
  host.innerHTML = `
  <div class="row"><span class="sgm" id="ea-s" role="group" aria-label="نظام التأريض">${['TN-S', 'TT', 'IT'].map(s => `<button type="button" data-sys="${s}" aria-pressed="${S.earth.sys === s}">${s}</button>`).join('')}</span><span class="note">المصنع على TN-S؛ شاهد مسار تيار العطل في TT و IT ثم ثبّت TN-S.</span></div>
  <div class="svgw" id="ea-svg"></div><p class="msg bad" id="ea-tx" aria-live="polite"></p>
  <div class="dev"><h3>موصل الحماية PE وزمن فصل المخارج</h3><p class="note">مقطع PE لكل كابل متوازٍ وفق IEC 60364-5-54، وزمن الفصل من منحنى القاطع عند تيار العطل.</p><div class="fx">S ≤ 16 → PE = S · 16 &lt; S ≤ 35 → 16 · S &gt; 35 → S/2<br>Zs = Z_tr + L·(Rφ + R_PE)/n · If = 0.95·U0/Zs · t ≤ 5 s</div><div id="ea-pe"></div></div>
  <div class="dev"><h3>الدوائر النهائية وأجهزة RCD</h3><p class="note">${ar('زمن الفصل في الدوائر النهائية حتى 32 A يجب ألا يزيد على 0.4 s في TN عند U0 = 230 V.')}</p>
    <label>RCD عند مدخل لوحة الإنارة LDB<select id="ea-ldbr" aria-label="LDB RCD">${opts([0, 30, 100, 300], S.earth.ldbr, v => v ? v + ' mA' + (v === 300 ? ' (S)' : '') : 'بدون')}</select></label><div id="ea-ldbr-r"></div>
    <div class="grid2" id="ea-fc"></div>
    <div class="dev" id="ea-pump"></div></div>
  ${foot()}`;
  bindCommon(host);
  IL.onAct(host, '[data-sys]', t => { S.earth.sys = t.dataset.sys; $$('[data-sys]', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.sys === S.earth.sys ? 'true' : 'false')); changed(); });
  function peTable(){
    let h = `<div class="tblw"><table class="tbl hm"><thead><tr><th>Feeder</th><th>Phase</th><th>PE / run</th><th>Zs (Ω)</th><th>If (kA)</th><th>t (s)</th><th class="ar">النتيجة</th></tr></thead><tbody>`;
    FD.forEach(f => { const r = CK.earth.f[f.id], c = S.cab[f.id];
      if (r.msg === 'wait'){ h += `<tr><td><b>${f.tag}</b></td><td colspan="6" class="ar">أكمل تبويب هبوط الجهد لهذا المخرج أولًا</td></tr>`; return; }
      h += `<tr data-f="${f.id}"><td><b>${f.tag}</b></td><td>${c.runs > 1 ? c.runs + '×' : ''}${c.s} mm²</td><td><select data-pe="${f.id}" aria-label="PE ${f.tag}">${opts(SZ, S.earth.pe[f.id], v => v + ' mm²', '—')}</select></td><td>${r.lp ? fmt(r.lp.Zs, 4) : '—'}</td><td>${r.lp ? f2(r.lp.If / 1000) : '—'}</td><td class="${r.st}">${r.t != null ? (isFinite(r.t) ? f2(r.t) : '∞') : '—'}</td><td class="ar">${r.st === 'ok' ? '<span class="ok">✓ مقبول</span>' : r.st === 'bad' ? `<span class="bad">${ar(r.msg)}</span>` : '—'}</td></tr>`; });
    return h + '</tbody></table></div>';
  }
  function fcCards(){
    return FINALS.map(fc => { const r = CK.earth.fc[fc.id], s = S.earth.fc[fc.id];
      return `<div class="dev ${r.st}" data-fc="${fc.id}"><h3><span class="tag">${FDM[fc.b].tag}</span>${esc(fc.n)}</h3><p class="note">${L(`MCB ${fc.In} A · ${fc.S} mm² Cu/PVC · ${fc.L} m`)}</p>
        <label>منحنى MCB<span class="sgm">${['B', 'C', 'D'].map(v => `<button type="button" data-cv="${v}" aria-pressed="${s.cv === v}">${v}</button>`).join('')}</span></label>
        <label>RCD<select data-rcd="${fc.id}" aria-label="RCD ${fc.id}">${opts([0, 30, 300], s.rcd, v => v ? v + ' mA' : 'بدون')}</select></label>
        ${r.msg === 'wait' ? '<p class="note">يحتاج مقطع PE للوحة المغذية أولًا.</p>' : `<div class="fx">Zs = ${fmt(r.Zs, 3)} Ω · If = ${f0(r.If)} A<br>${s.cv}${fc.In}: ${CURVE[s.cv]} × ${fc.In} = ${r.mag} A<br>t = ${isFinite(r.t) ? (r.t < 0.05 ? '0.04 (RCD)' : f2(r.t)) : '> 0.4'} s</div>${pill(r)}${msgOf(r)}`}</div>`; }).join('');
  }
  host.addEventListener('change', e => { const t = e.target;
    if (t.dataset.pe){ S.earth.pe[t.dataset.pe] = +t.value || 0; changed(); }
    else if (t.dataset.rcd){ S.earth.fc[t.dataset.rcd].rcd = +t.value || 0; changed(); }
    else if (t.id === 'ea-ldbr'){ S.earth.ldbr = +t.value || 0; changed(); }
    else if (t.dataset.pump){ S.earth.pump = +t.value || 6; changed(); } });
  IL.onAct(host, '[data-cv]', t => { const id = t.closest('[data-fc]').dataset.fc; S.earth.fc[id].cv = t.dataset.cv; changed(); });
  let lastSys = '';
  G.earth.upd = () => {
    if (lastSys !== S.earth.sys){ lastSys = S.earth.sys; $('#ea-svg', host).innerHTML = earthSVG(S.earth.sys); $('#ea-tx', host).innerHTML = ar(earthSVG.txt); }
    const foc = document.activeElement; const fk = foc && foc.dataset ? (foc.dataset.pe || foc.dataset.rcd || (foc.dataset.pump ? 'pump' : null)) : null;
    $('#ea-pe', host).innerHTML = peTable(); $('#ea-fc', host).innerHTML = fcCards();
    const pr = CK.earth.pump, pd = devMOT();
    $('#ea-pump', host).className = 'dev ' + pr.st;
    $('#ea-pump', host).innerHTML = `<h3><span class="tag">P-1</span>كابل المضخة من لوحة المحركات</h3><p class="note">${L(`MCCB Ir ${pd.Ir} A · Ii ${f0(pd.Im)} A · Cu/PVC · 70 m`)}</p><p class="note">الكابل رباعي القلوب، فمقطع PE يساوي مقطع الطور.</p>
      <label>مقطع الكابل<select data-pump="1" aria-label="Pump cable">${opts([4, 6, 10, 16], S.earth.pump, v => v + ' mm²')}</select></label>
      ${pr.msg === 'wait' ? '<p class="note">يحتاج مقطع PE لمغذّي MCC أولًا.</p>' : `<div class="fx">Zs = ${fmt(pr.Zs, 3)} Ω<br>If = 0.95 × 230 / Zs = ${f0(pr.If)} A<br>1.2 × Ii = ${f0(pr.mag)} A<br>t = ${isFinite(pr.t) ? f2(pr.t) : '∞'} s (≤ 0.4 s)</div>${pill(pr)}${msgOf(pr)}`}`;
    const r = CK.earth.ldbr; $('#ea-ldbr-r', host).innerHTML = r.st ? pill(r) + msgOf(r) : '';
    if (fk && !DEMO){ const n = fk === 'pump' ? $('[data-pump]', host) : $(`[data-pe="${fk}"],[data-rcd="${fk}"]`, host); if (n) n.focus(); }
  };
  G.earth.upd();
  demo(host, 'earth', async () => {
    prep('earth'); G.earth.upd(); await sleep(300);
    await dClick($('[data-sys="TT"]', host), 400); await sleep(1500); await dClick($('[data-sys="IT"]', host), 400); await sleep(1500); await dClick($('[data-sys="TN-S"]', host), 400);
    for (const [k, v] of [['smdb', 95], ['mcc', 120], ['ldb', 16], ['acdb', 120]]) await dSet($(`[data-pe="${k}"]`, host), v);
    await dSet($('#ea-ldbr', host), 300);
    await dSet($('[data-rcd="sock"]', host), 30); await dSet($('[data-rcd="msock"]', host), 30);
    await dClick($('[data-fc="light"] [data-cv="B"]', host), 500);
    await dSet($('[data-pump]', host), 10);
  });
};

/* =====================================================================
   TAB 8 · power-factor correction
   ===================================================================== */
BUILD.pfc = host => {
  const p = S.pfc;
  host.innerHTML = `
  <p class="note">حالة التشغيل الأسوأ (معامل قدرة أقل من حمل التصميم ${L('0.806')}): ${L('P = 600 kW · cos φ1 = 0.78')}، والهدف ${L('cos φ2 = 0.95')}. الحمل يتغير خلال اليوم بين ${L(PFC.Pmin + ' kW')} ليلًا و ${L(PFC.Pmax + ' kW')}. المحوّلات (VFD) تولّد التوافقيات 5 و 7.</p>
  <div class="fm">Qc = P · (tan φ1 − tan φ2)</div>
  <div class="grid2">
    <div class="dev" id="pf-c">
      <label>Qc (kVAR)<input type="number" step="0.1" inputmode="decimal" data-k="qc" value="${esc(p.qc)}" aria-label="Qc"></label><div data-r="qc"></div>
      <span class="note">خطوات البنك</span><div class="cfgs" id="pf-cfg">${CFGS.map(c => `<button type="button" class="btn" data-cfg="${c.id}" aria-pressed="${p.cfg === c.id}">${c.id.replace(/x/g, '×')}<small>${c.tot} kVAR</small></button>`).join('')}</div><div data-r="cfg"></div>
      <label>الملفات المانعة<select data-k="reac" aria-label="Reactor">${opts(['0', '7', '14'], p.reac, v => v === '0' ? 'بدون' : 'p = ' + v + ' %', 'اختر…')}</select></label><div data-r="reac"></div>
      <label>جهد المكثفات المقنن<select data-k="uc" aria-label="Capacitor voltage">${opts([400, 440, 480, 525], p.uc, v => v + ' V', 'اختر…')}</select></label><div data-r="uc"></div>
      <label>قاطع البنك<select data-k="mccb" aria-label="Bank MCCB">${opts(PFC_MCCB, p.mccb, v => 'MCCB ' + v + ' A', 'اختر…')}</select></label><div data-r="mccb"></div>
      <label>كابل البنك (Cu/XLPE، E، k = ${fmt(PFC_K, 3)})<span class="row"><select data-k="cr" aria-label="Bank cable runs">${opts([1, 2, 3], p.cr, v => v + ' ×')}</select><select data-k="cs" aria-label="Bank cable size">${opts(SZ, p.cs, v => v + ' mm²', 'اختر…')}</select></span></label><div data-r="cab"></div>
      <div class="fx" id="pf-in"></div>
    </div>
    <div class="dev">
      <div class="reg"><div class="lcd"><span id="pf-lcos">cos φ 0.780</span><span id="pf-lq">Qc 0 kVAR</span></div><div class="leds" id="pf-leds"></div>
        <div class="rng"><label style="color:#e8edf0"><span>الهدف</span><input type="range" min="0" max="4" step="1" value="${[0.92, 0.95, 0.96, 0.97, 0.98].indexOf(p.tgt) < 0 ? 1 : [0.92, 0.95, 0.96, 0.97, 0.98].indexOf(p.tgt)}" data-k="tgt" aria-label="Regulator target"><b id="pf-tgt">${p.tgt}</b></label></div></div>
      <div class="rng"><label><span>الحمل P</span><input type="range" min="${PFC.Pmin}" max="${PFC.Pmax}" step="10" value="600" id="pf-p" aria-label="Load P"><b id="pf-pv">600 kW</b></label></div>
      <div class="svgw" id="pf-svg"></div>
      <div class="row"><button type="button" class="btn pri" id="pf-run">▶ اختبر دورة حمل كاملة (24 h)</button></div>
      <p class="msg" id="pf-m" aria-live="polite"></p>
    </div>
  </div>
  ${foot()}`;
  const TG = [0.92, 0.95, 0.96, 0.97, 0.98];
  let P = 600, shownMask = 0, running = false;
  const c = $('#pf-c', host);
  c.addEventListener('change', e => { const t = e.target, k = t.dataset.k; if (!k) return; S.pfc[k] = k === 'qc' || k === 'reac' ? t.value : +t.value || 0; S.pfc.tested = false; changed(); });
  IL.onAct(host, '[data-cfg]', t => { S.pfc.cfg = t.dataset.cfg; S.pfc.tested = false; $$('[data-cfg]', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.cfg === S.pfc.cfg ? 'true' : 'false')); shownMask = 0; changed(); });
  host.addEventListener('input', e => { const t = e.target;
    if (t.dataset.k === 'tgt'){ S.pfc.tgt = TG[+t.value]; S.pfc.tested = false; $('#pf-tgt', host).textContent = S.pfc.tgt; changed(); }
    else if (t.id === 'pf-p'){ P = +t.value; $('#pf-pv', host).textContent = P + ' kW'; live(); } });
  bindCommon(host);
  function gauge(cos, lead){
    const ang = (1 - cos) / 0.3 * 80 * (lead ? 1 : -1), cx = 110, cy = 120; let h = `<g><path d="M${cx - 90} ${cy} A90 90 0 0 1 ${cx + 90} ${cy}" fill="none" stroke="var(--line)" stroke-width="12"/>`;
    const arc = (a0, a1, col) => { const r = 90, p0 = [cx + r * Math.sin(a0 * Math.PI / 180), cy - r * Math.cos(a0 * Math.PI / 180)], p1 = [cx + r * Math.sin(a1 * Math.PI / 180), cy - r * Math.cos(a1 * Math.PI / 180)]; return `<path d="M${p0[0]} ${p0[1]} A${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}" fill="none" stroke="${col}" stroke-width="12"/>`; };
    const a95 = 0.05 / 0.3 * 80; h += arc(-a95, a95, 'var(--good)');
    [[0.7, -80], [0.8, -53], [0.9, -27], [1, 0], [0.9, 27], [0.8, 53]].forEach(([v, a]) => { const r = 70; h += `<text x="${cx + r * Math.sin(a * Math.PI / 180)}" y="${cy - r * Math.cos(a * Math.PI / 180) + 4}" text-anchor="middle" font-size="10" fill="var(--muted)">${v}</text>`; });
    h += `<text x="${cx - 80}" y="${cy + 16}" font-size="10" fill="var(--muted)">lag</text><text x="${cx + 80}" y="${cy + 16}" text-anchor="end" font-size="10" fill="var(--muted)">lead</text>`;
    h += `<g transform="rotate(${Math.max(-85, Math.min(85, ang))} ${cx} ${cy})"><line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 84}" stroke="var(--ink)" stroke-width="3"/></g><circle cx="${cx}" cy="${cy}" r="6" fill="var(--ink)"/>`;
    return h + `<text x="${cx}" y="${cy + 30}" text-anchor="middle" font-size="16" font-weight="700" fill="${cos >= 0.95 ? 'var(--good)' : 'var(--bad)'}">cos φ = ${fmt(cos, 3)}</text></g>`;
  }
  function tri(P, Ql, Qc){
    const sc = 0.28, x0 = 236, y0 = 40, px = P * sc, ql = Ql * sc, qc = Qc * sc, res = ql - qc;
    let h = `<g><text x="${x0}" y="22" font-size="12" font-weight="700" fill="var(--ink)">Power triangle</text>`;
    h += `<line x1="${x0}" y1="${y0}" x2="${x0 + px}" y2="${y0}" stroke="var(--t1)" stroke-width="3"/><text x="${x0 + px / 2}" y="${y0 - 5}" text-anchor="middle" font-size="10" fill="var(--t1)">P ${P} kW</text>`;
    h += `<line x1="${x0 + px}" y1="${y0}" x2="${x0 + px}" y2="${y0 + ql}" stroke="var(--t2)" stroke-width="3"/><text x="${x0 + px + 4}" y="${y0 + ql / 2}" font-size="10" fill="var(--t2)">Q ${f0(Ql)}</text>`;
    if (qc) h += `<line x1="${x0 + px - 8}" y1="${y0 + ql}" x2="${x0 + px - 8}" y2="${y0 + res}" stroke="var(--t3)" stroke-width="3"/><text x="${x0 + px - 12}" y="${y0 + ql - 4}" text-anchor="end" font-size="10" fill="var(--t3)">Qc ${f0(Qc)}</text>`;
    h += `<line x1="${x0}" y1="${y0}" x2="${x0 + px}" y2="${y0 + ql}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 3"/><line x1="${x0}" y1="${y0}" x2="${x0 + px}" y2="${y0 + res}" stroke="var(--ink)" stroke-width="2.4"/>`;
    return h + `<text x="${x0}" y="192" font-size="10" fill="var(--muted)">S ${f0(Math.hypot(P, res))} kVA (before ${f0(Math.hypot(P, Ql))})</text></g>`;
  }
  function live(){
    const cfg = CFGM[S.pfc.cfg], Ql = P * Math.tan(Math.acos(PFC.cos1));
    let r = {q:0, mask:0, cos:PFC.cos1};
    if (cfg) r = regPick(cfg.st, P, S.pfc.tgt);
    const leds = $('#pf-leds', host);
    if (cfg){ if (leds.childElementCount !== cfg.st.length) leds.innerHTML = cfg.st.map((q, i) => `<span class="led" data-i="${i}"><i></i>${q}</span>`).join(''); }
    else leds.innerHTML = '<span class="note" style="color:#cfd6da">اختر خطوات البنك</span>';
    if (cfg) $$('.led', leds).forEach((l, i) => { const on = !!(r.mask & (1 << i)), was = !!(shownMask & (1 << i)); l.classList.toggle('on', on); l.classList.toggle('dis', was && !on); if (was && !on) setTimeout(() => l.classList.remove('dis'), 900); });
    shownMask = r.mask;
    const lead = Ql - r.q < 0;
    $('#pf-lcos', host).textContent = `cos φ ${fmt(r.cos, 3)}${lead ? ' C' : ' L'}`; $('#pf-lq', host).textContent = `Qc ${r.q} kVAR`;
    $('#pf-svg', host).innerHTML = `<svg viewBox="0 0 440 196" role="img" aria-label="cos φ">${gauge(r.cos, lead)}${tri(P, Ql, r.q)}</svg>`;
    return r;
  }
  $('#pf-run', host).addEventListener('click', async () => {
    if (running) return; running = true; const btn = $('#pf-run', host), m = $('#pf-m', host); btn.disabled = true;
    const prof = h => PFC.Pmin + (PFC.Pmax - PFC.Pmin) * Math.max(0, Math.min(1, 0.5 - 0.5 * Math.cos((h - 3) / 24 * 2 * Math.PI) + (h > 7 && h < 18 ? 0.25 : 0) - (h < 5 ? 0.15 : 0)));
    let worst = 2, wP = 0;
    for (let h = 0; h <= 24; h += 0.5){ P = Math.round(prof(h) / 10) * 10; if (h === 2) P = PFC.Pmin; if (h === 12) P = PFC.Pmax; $('#pf-p', host).value = P; $('#pf-pv', host).textContent = P + ' kW';
      const r = live(); if (r.cos < worst){ worst = r.cos; wP = P; } m.className = 'msg'; m.textContent = `الساعة ${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'} · P = ${P} kW · cos φ = ${fmt(r.cos, 3)}`; await sleep(DEMO ? 110 : 140); }
    const sw = CFGM[S.pfc.cfg] ? pfcSweep(S.pfc.cfg, S.pfc.tgt) : null; if (sw && sw.cos < worst){ worst = sw.cos; wP = sw.P; }
    running = false; btn.disabled = false;
    if (!CK.pfc.ready){ const bad = Object.values(CK.pfc.it).find(x => x.st !== 'ok'); m.className = 'msg bad'; m.textContent = bad && bad.st === 'bad' ? bad.msg : 'أكمل كل اختيارات البنك وحمايته أولًا.'; return; }
    if (worst >= 0.95 - 1e-9){ S.pfc.tested = true; m.className = 'msg ok'; m.textContent = `نجح الاختبار: أسوأ cos φ خلال اليوم = ${fmt(worst, 3)} ≥ 0.95.`; changed(); }
    else { m.className = 'msg bad'; m.textContent = `فشل الاختبار: cos φ = ${fmt(worst, 3)} عند P = ${wP} kW.`; }
  });
  G.pfc.upd = () => {
    const it = CK.pfc.it; ['qc', 'cfg', 'reac', 'uc', 'mccb', 'cab'].forEach(k => { const d = $(`[data-r="${k}"]`, host); if (d) d.innerHTML = it[k].st ? pill(it[k]) + (it[k].st === 'ok' ? `<span class="note"> ${ar(it[k].msg)}</span>` : msgOf(it[k])) : ''; });
    const cfg = CFGM[S.pfc.cfg], tot = cfg ? cfg.tot : 300;
    $('#pf-in', host).innerHTML = `In = ${tot}k / (√3 × 400) = ${f0(CK.pfc.In)} A → 1.43 × In = <b>${f0(CK.pfc.Id)} A</b><br>p = 7 %: fr = 50 / √0.07 = 189 Hz · Uc = 400 / 0.93 = 430 V`;
    live();
  };
  G.pfc.upd();
  demo(host, 'pfc', async () => {
    const q = k => $(`[data-k="${k}"]`, c);
    await dSet(q('qc'), f1(PFC.Qc)); await dClick($('[data-cfg="6x50"]', host)); await dSet(q('reac'), '7'); await dSet(q('uc'), 440);
    await dSet(q('mccb'), 630); await dSet(q('cr'), 2); await dSet(q('cs'), 150); await dSet($('[data-k="tgt"]', host), 1);
    await dClick($('#pf-run', host)); await sleep(26 * 120);
  });
};

/* =====================================================================
   7. start
   ===================================================================== */
evalAll(); renderSLD();
TABS.forEach(tb => { if (IL.has(tb.l, 'sim')) G[tb.id].won = false; });
const first = location.hash.slice(1);
show(G[first] ? first : 'load');
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (G[h]) show(h); });
window.PCALC = {S:() => S, CK, IB, MDB, PQ, TRF, PFC, devACB, devMCC, devMOT, selLimit, pfcSweep, regPick};
})();
