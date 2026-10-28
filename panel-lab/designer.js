/* مصمّم اللوحات الكهربية – LearnElectricals (MSA UI)
   One shared enclosure editor (front view in mm, mounting plates, DIN rails, ducts, busbars, barriers)
   with a part library, a live rules engine, an IEC TR 60890-style heat calculation and a live BOM.
   Three tabs use it: a lighting DB (l10), an MCC with four Type 2 feeders (l11) and the factory MDB with routine tests (l12).
   All table values are typical values for learning. */
(function(){
'use strict';
const $ = IL.$, $$ = IL.$$, esc = IL.esc, fmt = IL.fmt, clamp = IL.clamp;
IL.hubTheme();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clone = o => JSON.parse(JSON.stringify(o));
const SKEY = 'panel-designer-v1';
const L = s => `<bdi dir="ltr" class="mono">${esc(s)}</bdi>`;
const LI = s => '\u2066' + s + '\u2069';
const SN = 10;                       /* grid snap, mm */
const snap = v => Math.round(v / SN) * SN;
const AMB = 35, TLIM = 55, TEL = 50, KH = 5.5, CTOP = 1.3; /* ambient, air limit at the top, limit at electronic devices (°C) */
const RHO = 0.0206;                  /* Cu at about 70 °C, Ω·mm²/m */
const LCAB = 0.5;                    /* internal connection length per circuit, m */

const TABS = [
  {id:'layout', t:'لوحة الإنارة', l:'l10', h:'لوحة الإنارة والتكييف LTG DB: الترتيب والحرارة', goal:'رتّب لوحة الإنارة: قاطع دخول MCCB 100 A، و12 قاطع MCB، وقاطعا RCCB، وعدّاد طاقة مع 3 محولات تيار، وواقي صواعق SPD؛ مع غلاف IP54 وشكل فصل Form 2b، حتى تصبح قائمة التحقق كلها خضراء.'},
  {id:'mcc', t:'لوحة المحركات MCC', l:'l11', h:'لوحة المحركات MCC: أربعة مخارج بتنسيق Type 2', goal:'ابنِ أربعة مخارج للمحركات، كلٌّ في مقصورته (Form 4b): مضخة 15 kW بالتشغيل المباشر، وضاغط 37 kW ستار دلتا، وضاغط 37 kW ببادئ ناعم، ومبرّد 75 kW بمحوّل تردد؛ بمكونات Type 2 من جدول التنسيق، مع اجتياز فحص الحرارة.'},
  {id:'project', t:'المشروع: MDB', l:'l12', h:'المشروع: لوحة التوزيع الرئيسية MDB واختبارات التسليم', goal:'صمّم لوحة MDB متعددة الأقسام: ACB 1600 A، والبارات الرئيسية، و6 مخارج MCCB، والقياس، وقسم مكثفات منفصل بست خطوات؛ اجتز قواعد الترتيب وForm 3b والحرارة، ثم أكمل «اختبارات التسليم».'}
];

/* ---------------- enclosures (typical sizes) ---------------- */
const ENC = [
  {id:'w4060', W:400, H:600, D:200, kind:'wall', secs:[400]},
  {id:'w6080', W:600, H:800, D:250, kind:'wall', secs:[600]},
  {id:'w80100', W:800, H:1000, D:300, kind:'wall', secs:[800]},
  {id:'w80120', W:800, H:1200, D:300, kind:'wall', secs:[800]},
  {id:'f8020', W:800, H:2000, D:600, kind:'floor', secs:[800]},
  {id:'f1020', W:1000, H:2000, D:600, kind:'floor', secs:[1000]},
  {id:'m2', W:1800, H:2000, D:600, kind:'floor', secs:[800, 1000]},
  {id:'m3', W:2400, H:2000, D:600, kind:'floor', secs:[800, 800, 800]},
  {id:'m4', W:3200, H:2000, D:600, kind:'floor', secs:[800, 800, 800, 800]}
];
const ENCI = {}; ENC.forEach(e => { ENCI[e.id] = e; });
const encName = e => `${e.W}×${e.H}×${e.D}`;
const encAr = e => e.kind === 'wall' ? 'جداري' : e.secs.length > 1 ? `أرضي · ${e.secs.length} أقسام` : 'أرضي';
const IPS = ['IP31', 'IP42', 'IP54', 'IP65'];
const FORMS = ['1', '2a', '2b', '3a', '3b', '4a', '4b'];
const FLV = f => ({'1':0, '2a':2, '2b':2, '3a':3, '3b':3, '4a':4, '4b':4})[f];
const FORMT = [ /* [form, busbars↔FU, FU↔FU, terminals↔busbars, terminals↔own FU] */
  ['1', 0, 0, 0, 0], ['2a', 1, 0, 0, 0], ['2b', 1, 0, 1, 0], ['3a', 1, 1, 0, 0], ['3b', 1, 1, 1, 0], ['4a', 1, 1, 1, 0], ['4b', 1, 1, 1, 1]
];
/* plates: inset from the enclosure body */
function plates(D){
  const e = ENCI[D.enc], fl = e.kind === 'floor', t = fl ? 100 : 50, b = fl ? 100 : 50, s = 50;
  let x = 0;
  return e.secs.map((w, i) => { const p = {i, sx:x, sw:w, x:x + s, y:t, w:w - 2 * s, h:e.H - t - b}; x += w; return p; });
}

/* ---------------- typical tables ---------------- */
const CABS = [[16, 2.5], [25, 4], [32, 6], [40, 10], [63, 16], [80, 25], [100, 35], [125, 50], [160, 70], [200, 95], [250, 120], [320, 185], [400, 240], [500, 300], [630, 370], [800, 480], [1000, 555], [1250, 740], [1600, 960], [2000, 1200]];
const cabS = I => { for (const r of CABS) if (I <= r[0]) return r[1]; return 1200; };
const cabT = S => S === 300 ? '2×150' : S === 370 ? '2×185' : S === 480 ? '2×240' : S === 555 ? '3×185' : S === 740 ? '4×185' : S === 960 ? '4×240' : S === 1200 ? '5×240' : String(S);
/* busbar ampacity, DIN 43671-style, bare Cu, 35 °C ambient (typical); inside the enclosure ×0.8 */
const BUSZ = [
  {id:'30x5', S:150, I:400}, {id:'40x10', S:400, I:715}, {id:'60x10', S:600, I:985}, {id:'80x10', S:800, I:1240},
  {id:'100x10', S:1000, I:1490}, {id:'2x80x10', S:1600, I:2160}, {id:'2x100x10', S:2000, I:2560}
];
const BUSI = {}; BUSZ.forEach(b => { BUSI[b.id] = b; });
const busTxt = id => id.startsWith('2x') ? `2×(${id.slice(2).replace('x', '×')})` : id.replace('x', '×');
const KBUS = 0.8;
const RDF = n => n <= 1 ? 1 : n <= 3 ? 0.9 : n <= 5 ? 0.8 : n <= 9 ? 0.7 : 0.6; /* IEC 61439-1 rated diversity factor (typical) */

const MCCB_TM = [100, 160, 250, 400, 630], MCCB_MA = [50, 100, 150, 220];
const MPCB_R = ['9–14', '13–18', '17–23', '20–25', '24–32', '30–40'];
const KM_I = [9, 12, 18, 25, 32, 38, 40, 50, 65, 80, 95, 115, 150, 185, 225, 265];
const OL_R = ['17–25', '23–32', '30–40', '37–50', '48–65', '63–80', '80–104', '90–150', '132–220'];
const SS_I = [32, 48, 66, 79, 88, 110, 140, 170];
const VFD_KW = [7.5, 15, 22, 37, 55, 75, 90];
const LR_I = [32, 75, 150, 180];
const FAN_V = [55, 105, 230, 550, 700];
const FAN_S = {55:148, 105:204, 230:255, 550:323, 700:323};
const rHi = r => +String(r).split('–')[1];
const kmCat = I => I <= 38 ? 0 : I <= 65 ? 1 : I <= 95 ? 2 : I <= 150 ? 3 : 4;

/* ---------------- part kinds ----------------
   size(o) → [w,h] mm · loss(o) → W at In (catalogue, typical) · kg · clr {t,b,s,duct: ducts allowed in the zone}
   lbl(o) → designation (Latin) · a → Arabic name · din: mounts on a DIN rail · door: on the door */
const K = {};
const mpcbSz = r => r === '30–40' ? [55, 125] : [45, 90];
const olSz = r => { const h = rHi(r); return h <= 40 ? [45, 70] : h <= 104 ? [55, 75] : h <= 150 ? [120, 90] : [140, 100]; };
const kmSz = I => [[45, 85], [55, 120], [70, 125], [120, 170], [140, 200]][kmCat(I)];
const ssSz = I => I <= 48 ? [90, 220] : I <= 110 ? [130, 260] : [200, 320];
const vfdSz = kW => ({7.5:[130, 350], 15:[170, 420], 22:[210, 480], 37:[245, 560], 55:[280, 620], 75:[320, 680], 90:[320, 780]})[kW] || [320, 680];
const vfdKg = kW => ({7.5:7, 15:11, 22:16, 37:25, 55:35, 75:45, 90:52})[kW] || 45;
const lrD = I => ({32:[150, 140, 30, 5], 75:[180, 170, 70, 12], 150:[240, 220, 140, 28], 180:[260, 230, 170, 34]})[I] || [240, 220, 140, 28];
const emcD = I => ({32:[60, 250, 10, 2], 75:[80, 300, 18, 4], 150:[90, 330, 30, 6], 180:[100, 360, 36, 7]})[I] || [90, 330, 30, 6];
const mcbP = I => ({6:1.5, 10:2, 16:2.5, 20:2.8, 25:3.2, 32:3.6, 40:4.3, 50:5.2, 63:6.2})[I] || 2.5;
const termW = s => ({4:6.2, 16:12.2, 35:16, 95:25})[s] || 6.2;
const termH = s => ({4:50, 16:60, 35:70, 95:90})[s] || 50;
K.acb = {a:'قاطع هوائي ACB (سحب)', cat:0, size:() => [440, 430], loss:o => ({800:120, 1000:160, 1250:230, 1600:330, 2000:450})[o.In] || 330, kg:() => 60,
  clr:() => ({t:100, b:50, s:0}), lbl:o => `ACB ${o.In} A 3P 36 kA`, opts:[['In', 'In', [800, 1000, 1250, 1600, 2000], 'A']], def:{In:1600}, scpd:true, inc:true};
K.mccb = {a:'قاطع علبة مقولبة MCCB', cat:0, size:o => o.In <= 250 ? [105, 161] : [140, 255], loss:o => o.ty === 'MA' ? ({50:6, 100:12, 150:20, 220:30})[o.In] || 12 : ({100:15, 160:25, 250:40, 400:55, 630:80})[o.In] || 40,
  kg:o => o.In <= 250 ? 2.2 : 6, clr:o => o.In <= 250 ? {t:40, b:40, s:0, duct:1} : {t:60, b:60, s:0, duct:1},
  lbl:o => o.ty === 'MA' ? `MCCB-MA ${o.In} A` : `MCCB ${o.In} A TM 36 kA`, opts:[['ty', 'النوع', ['TM', 'MA'], ''], ['In', 'In', o => o.ty === 'MA' ? MCCB_MA : MCCB_TM, 'A']], def:{In:250, ty:'TM'}, scpd:true};
K.mcb = {a:'قاطع مصغّر MCB', cat:0, din:1, size:o => [18 * o.p, 85], loss:o => mcbP(o.In) * o.p, kg:() => 0.12, lbl:o => `MCB ${o.c}${o.In} ${o.p}P 10 kA`,
  opts:[['p', 'الأقطاب', [1, 2, 3, 4], 'P'], ['c', 'المنحنى', ['B', 'C', 'D'], ''], ['In', 'In', [6, 10, 16, 20, 25, 32, 40, 50, 63], 'A']], def:{p:1, c:'C', In:16}, scpd:true};
K.rccb = {a:'قاطع التيار المتبقي RCCB', cat:0, din:1, size:o => [o.p === 2 ? 36 : 72, 85], loss:o => o.p === 2 ? 3 : 6, kg:() => 0.35, lbl:o => `RCCB ${o.p}P ${o.In} A ${o.dn} mA`,
  opts:[['p', 'الأقطاب', [2, 4], 'P'], ['In', 'In', [40, 63], 'A'], ['dn', 'IΔn', [30, 300], 'mA']], def:{p:4, In:63, dn:30}};
K.spd = {a:'واقي الصواعق SPD Type 2', cat:0, din:1, size:() => [72, 90], loss:() => 1, kg:() => 0.5, lbl:() => 'SPD T2 4P 40 kA', def:{}};
K.fsw = {a:'مصهر ومفصل NH', cat:0, size:() => [100, 190], loss:o => o.t === 'aR' ? ({80:22, 125:30, 160:36, 200:42})[o.In] || 36 : ({63:8, 100:12, 125:15, 160:18})[o.In] || 12, kg:() => 3,
  clr:() => ({t:30, b:30, s:0, duct:1}), lbl:o => `NH00 ${o.t} ${o.In} A`, opts:[['t', 'نوع المصهر', ['gG', 'aR'], ''], ['In', 'In', o => o.t === 'aR' ? [80, 125, 160, 200] : [63, 100, 125, 160], 'A']], def:{t:'gG', In:100}, scpd:true};
K.mpcb = {a:'قاطع حماية محرك MPCB', cat:0, din:1, size:o => mpcbSz(o.r), loss:o => ({'9–14':6, '13–18':6.5, '17–23':7, '20–25':7.5, '24–32':8, '30–40':9})[o.r] || 8, kg:() => 0.6,
  lbl:o => `MPCB ${o.r} A`, opts:[['r', 'المدى', MPCB_R, 'A']], def:{r:'24–32'}, scpd:true, Iof:o => rHi(o.r)};
K.km = {a:'كونتاكتور AC-3', cat:1, din:1, size:o => kmSz(o.Ie), loss:o => [1.5, 3, 6, 10, 15, 25][o.Ie <= 18 ? 0 : kmCat(o.Ie) + 1], kg:o => [0.4, 1, 1.6, 4, 6][kmCat(o.Ie)], lbl:o => `KM AC-3 ${o.Ie} A`,
  opts:[['Ie', 'Ie AC-3', KM_I, 'A']], def:{Ie:32}};
K.ol = {a:'مرحّل حمل زائد', cat:1, size:o => olSz(o.r), loss:o => rHi(o.r) <= 40 ? 4.5 : rHi(o.r) <= 104 ? 7 : 2, kg:() => 0.4, lbl:o => `OL ${o.r} A`, opts:[['r', 'المدى', OL_R, 'A']], def:{r:'23–32'}};
K.ss = {a:'بادئ ناعم (Bypass)', cat:1, size:o => ssSz(o.In), loss:o => Math.round(0.3 * o.In), kg:o => o.In <= 48 ? 2 : o.In <= 110 ? 4.5 : 9, clr:() => ({t:100, b:100, s:10}), lbl:o => `Soft starter ${o.In} A`,
  opts:[['In', 'In', SS_I, 'A']], def:{In:79}, elec:1};
K.vfd = {a:'محوّل تردد VFD', cat:1, size:o => vfdSz(o.kW), loss:o => Math.round(30 * o.kW), kg:o => vfdKg(o.kW), clr:() => ({t:100, b:100, s:10}), lbl:o => `VFD ${o.kW} kW 400 V`,
  opts:[['kW', 'القدرة', VFD_KW, 'kW']], def:{kW:75}, elec:1};
K.lr = {a:'ملف خط (Line reactor 3 %)', cat:1, size:o => lrD(o.In).slice(0, 2), loss:o => lrD(o.In)[2], kg:o => lrD(o.In)[3], clr:() => ({t:50, b:50, s:20}), lbl:o => `Line reactor ${o.In} A 3 %`,
  opts:[['In', 'In', LR_I, 'A']], def:{In:150}};
K.emc = {a:'مرشّح EMC', cat:1, size:o => emcD(o.In).slice(0, 2), loss:o => emcD(o.In)[2], kg:o => emcD(o.In)[3], lbl:o => `EMC filter ${o.In} A`, opts:[['In', 'In', LR_I, 'A']], def:{In:150}};
K.plc = {a:'متحكم PLC', cat:2, din:1, size:() => [110, 100], loss:() => 8, kg:() => 0.5, lbl:() => 'PLC CPU + 16DI/16DO', def:{}, elec:1};
K.psu = {a:'مزوّد قدرة 24 V DC', cat:2, din:1, size:o => o.A === 20 ? [125, 125] : o.A === 10 ? [85, 125] : [65, 125], loss:o => ({5:12, 10:22, 20:40})[o.A] || 12, kg:() => 0.8, lbl:o => `PSU 24 V DC ${o.A} A`,
  opts:[['A', 'التيار', [5, 10, 20], 'A']], def:{A:5}, elec:1};
K.em = {a:'عدّاد طاقة (DIN)', cat:2, din:1, size:() => [72, 90], loss:() => 4, kg:() => 0.4, lbl:() => 'Energy meter 3P CT /5 A', def:{}};
K.pm = {a:'جهاز قياس متعدد (على الباب)', cat:2, door:1, size:() => [96, 96], loss:() => 4, kg:() => 0.4, lbl:() => 'Multifunction meter 96×96', def:{}};
K.ct = {a:'محوّل تيار CT', cat:2, size:() => [50, 60], loss:() => 2, kg:() => 0.6, lbl:o => `CT ${o.r}/5 A cl.1`, opts:[['r', 'النسبة', [100, 150, 250, 400, 1600], ''], ], def:{r:100}};
K.term = {a:'مجموعة أطراف توصيل', cat:2, din:1, size:o => [Math.round(termW(o.s) * o.n), termH(o.s)], loss:() => 0, kg:o => 0.02 * o.n, lbl:o => `Terminals ${o.n}× ${o.s} mm²`,
  opts:[['n', 'العدد', [4, 6, 8, 10, 12, 16, 20], ''], ['s', 'المقطع', [4, 16, 35, 95], 'mm²']], def:{n:10, s:4}};
K.bus = {a:'بارات رئيسية (L1 L2 L3 N)', cat:3, size:o => [o.L, 160], loss:() => 0, kg:o => o.L / 1000 * 4 * BUSI[o.sz].S * 0.0089, lbl:o => `Main busbar Cu ${busTxt(o.sz)} 4P`,
  opts:[['sz', 'المقطع', BUSZ.map(b => b.id), 'mm']], def:{L:1000, sz:'40x10'}, len:'w', bus:1};
K.drop = {a:'بارات نازلة (Droppers)', cat:3, size:o => [120, o.L], loss:() => 0, kg:o => o.L / 1000 * 4 * BUSI[o.sz].S * 0.0089, lbl:o => `Dropper Cu ${busTxt(o.sz)} 4P`,
  opts:[['sz', 'المقطع', BUSZ.map(b => b.id), 'mm']], def:{L:1200, sz:'40x10'}, len:'h', bus:1};
K.rail = {a:'قضيب DIN 35 mm', cat:3, size:o => o.rot ? [35, o.L] : [o.L, 35], loss:() => 0, kg:o => o.L / 1000 * 0.3, lbl:o => `DIN rail TS35 × ${o.L}`, def:{L:400, rot:0}, len:'r', rot:1};
K.duct = {a:'مجرى أسلاك', cat:3, size:o => o.rot ? [o.b, o.L] : [o.L, o.b], loss:() => 0, kg:o => o.L / 1000 * 0.5, lbl:o => `Wiring duct ${o.b}×${o.b} × ${o.L}`,
  opts:[['b', 'العرض', [40, 60, 80], 'mm']], def:{L:400, b:60, rot:0}, len:'r', rot:1};
K.bar = {a:'حاجز فصل أفقي', cat:3, size:o => [o.w || 500, 6], loss:() => 0, kg:o => (o.w || 500) / 1000 * 2, lbl:o => `Barrier ${o.w || 500}`, def:{}};
K.fan = {a:'مروحة مع فلتر (دخول)', cat:4, door:1, size:o => [FAN_S[o.V], FAN_S[o.V]], loss:() => 0, kg:() => 2, lbl:o => `Filter fan ${o.V} m³/h IP54`, opts:[['V', 'التدفق', FAN_V, 'm³/h']], def:{V:105}};
K.grille = {a:'فلتر خروج الهواء', cat:4, door:1, size:o => [FAN_S[o.V], FAN_S[o.V]], loss:() => 0, kg:() => 0.6, lbl:o => `Exhaust filter ${FAN_S[o.V]}×${FAN_S[o.V]} IP54`, opts:[['V', 'للمروحة', FAN_V, 'm³/h']], def:{V:105}};
K.cap = {a:'مكثف 50 kVAR (3 أسطوانات)', cat:5, size:() => [200, 260], loss:o => Math.round(0.5 * o.Q), kg:() => 12, clr:() => ({t:50, b:50, s:20}), lbl:o => `Capacitor ${o.Q} kVAR 440 V`, opts:[['Q', 'kVAR', [25, 50], '']], def:{Q:50}};
K.capk = {a:'كونتاكتور مكثفات', cat:5, din:1, size:() => [55, 125], loss:() => 4, kg:() => 1, lbl:o => `Capacitor contactor ${o.Q} kVAR`, opts:[['Q', 'kVAR', [25, 50], '']], def:{Q:50}};
K.dr = {a:'ملف مانع للتوافقيات 7 %', cat:5, size:() => [200, 180], loss:o => o.Q === 25 ? 100 : 180, kg:o => o.Q === 25 ? 18 : 30, clr:() => ({t:50, b:50, s:20}), lbl:o => `Detuned reactor ${o.Q} kVAR 7 %`, opts:[['Q', 'kVAR', [25, 50], '']], def:{Q:50}};
K.pfcr = {a:'منظّم معامل القدرة', cat:5, door:1, size:() => [144, 144], loss:() => 4, kg:() => 0.7, lbl:() => 'PF controller 6 steps 144×144', def:{}};
const CATS = ['الحماية', 'المحركات', 'التحكم والقياس', 'التوزيع والتركيب', 'التهوية', 'تحسين معامل القدرة'];
const ORDER = ['acb', 'mccb', 'mcb', 'rccb', 'spd', 'fsw', 'mpcb', 'km', 'ol', 'ss', 'vfd', 'lr', 'emc', 'plc', 'psu', 'em', 'pm', 'ct', 'term', 'bus', 'drop', 'rail', 'duct', 'bar', 'fan', 'grille', 'cap', 'capk', 'dr', 'pfcr'];
const SHORT = {acb:'ACB', mccb:'MCCB', mcb:'MCB', rccb:'RCCB', spd:'SPD', fsw:'NH fuse', mpcb:'MPCB', km:'KM', ol:'OL', ss:'Soft st.', vfd:'VFD', lr:'Reactor', emc:'EMC', plc:'PLC', psu:'PSU 24V', em:'kWh', pm:'PM 96', ct:'CT', term:'X terms', bus:'Busbar', drop:'Dropper', rail:'DIN rail', duct:'Duct', bar:'Barrier', fan:'Fan', grille:'Filter', cap:'Cap', capk:'Cap KM', dr:'Reactor 7%', pfcr:'PFC rel.'};
const sz = p => K[p.k].size(p.o);
const lbl = p => K[p.k].lbl(p.o);
const kgOf = p => K[p.k].kg(p.o);
const clrOf = p => K[p.k].clr ? K[p.k].clr(p.o) : null;
const lossOf = p => K[p.k].loss(p.o);

/* ---------------- part drawings (local mm coordinates) ---------------- */
const R = (x, y, w, h, c, rx, ex) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${rx ? ` rx="${rx}"` : ''} class="${c}"${ex || ''}/>`;
const T = (x, y, s, fs, c, ex) => `<text x="${x}" y="${y}" font-size="${fs}" class="${c || 'p-t'}" text-anchor="middle"${ex || ''}>${esc(s)}</text>`;
const C = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" class="${c}"/>`;
const screws = (n, w, y, r) => { let s = ''; for (let i = 0; i < n; i++) s += C((i + 0.5) * w / n, y, r, 'p-sc'); return s; };
function fitT(s, w, max){ return Math.max(5, Math.min(max, w / (String(s).length * 0.62))); }
const DRAW = {
  acb(o, w, h){
    return R(0, 0, w, h, 'p-m', 6) + R(14, 30, w - 28, h - 44, 'p-k', 8) + R(60, 54, w - 120, h - 100, 'p-k2', 6) +
      R(80, 72, 120, 64, 'p-lcd', 4) + T(140, 98, 'Ir 1440 A', 14, 'p-lcdt') + T(140, 122, 'Isd 5760 A', 12, 'p-lcdt') +
      R(232, 76, 30, 30, 'p-on', 15) + T(247, 96, 'I', 14, 'p-tw') + R(272, 76, 30, 30, 'p-off', 15) + T(287, 96, 'O', 14, 'p-tw') +
      R(232, 120, 70, 22, 'p-w', 3) + T(267, 136, 'CHARGED', 10, 'p-t') + R(80, 160, 220, 90, 'p-k3', 6) + T(190, 196, `ACB ${o.In} A`, 22, 'p-tw') + T(190, 226, 'Icu 36 kA', 15, 'p-tw2') +
      R(w / 2 - 40, h - 70, 80, 30, 'p-m', 4) + T(w / 2, h - 50, 'RACK', 12, 'p-t') + R(330, 160, 40, 90, 'p-y', 3) + T(350, 210, '⚠', 18, 'p-t') + R(0, h - 10, w, 10, 'p-m2');
  },
  mccb(o, w, h){
    const big = o.In > 250, f = big ? 1.3 : 1;
    return R(0, 0, w, h, 'p-k', 6) + R(4, 0, w - 8, 26 * f, 'p-k2', 3) + R(4, h - 26 * f, w - 8, 26 * f, 'p-k2', 3) + screws(3, w, 13 * f, 6 * f) + screws(3, w, h - 13 * f, 6 * f) +
      R(w * 0.18, h * 0.24, w * 0.64, h * 0.52, 'p-k3', 5) + R(w / 2 - 9 * f, h * 0.3, 18 * f, h * 0.2, 'p-w', 3) + R(w / 2 - 6 * f, h * 0.3, 12 * f, h * 0.09, 'p-k', 2) +
      (o.ty === 'MA' ? R(w * 0.24, h * 0.56, w * 0.52, h * 0.15, 'p-y', 2) + T(w / 2, h * 0.67, 'MA ' + o.In, 11 * f, 'p-t') :
        R(w * 0.24, h * 0.56, w * 0.52, h * 0.15, 'p-tu', 2) + C(w * 0.36, h * 0.635, 5 * f, 'p-w') + C(w * 0.64, h * 0.635, 5 * f, 'p-w')) +
      T(w / 2, h * 0.215, `${o.In} A`, 13 * f, 'p-tw');
  },
  mcb(o, w, h){
    let s = R(0, 0, w, h, 'p-w', 2) + R(0, 0, w, 14, 'p-wd') + R(0, h - 14, w, 14, 'p-wd');
    for (let i = 0; i < o.p; i++){ const x = i * 18; s += C(x + 9, 7, 4, 'p-sc') + C(x + 9, h - 7, 4, 'p-sc') + R(x + 5, 30, 8, 22, 'p-k', 2) + R(x + 6, 31, 6, 7, i ? 'p-off' : 'p-on', 1); if (i) s += `<line x1="${x}" y1="16" x2="${x}" y2="${h - 16}" class="p-ln"/>`; }
    return s + T(w / 2, 66, o.c + o.In, fitT(o.c + o.In, w, 8), 'p-t');
  },
  rccb(o, w, h){
    let s = R(0, 0, w, h, 'p-w', 2) + R(0, 0, w, 14, 'p-wd') + R(0, h - 14, w, 14, 'p-wd') + screws(o.p, w, 7, 4) + screws(o.p, w, h - 7, 4);
    s += R(w / 2 - 8, 26, 16, 24, 'p-k', 2) + R(w / 2 - 7, 27, 14, 7, 'p-on', 1) + C(w - 12, 36, 6, 'p-y') + T(w - 12, 39, 'T', 7, 'p-t');
    return s + T(w / 2, 62, `${o.In}A`, 8, 'p-t') + T(w / 2, 72, `${o.dn}mA`, 7, 'p-ts');
  },
  spd(o, w, h){ let s = R(0, 0, w, h, 'p-w', 2) + screws(4, w, 7, 4) + screws(4, w, h - 7, 4); for (let i = 0; i < 4; i++) s += R(i * 18 + 3, 18, 12, 40, 'p-wd', 1) + R(i * 18 + 6, 44, 6, 8, 'p-g', 1); return s + T(w / 2, 72, 'SPD T2', 9, 'p-t'); },
  fsw(o, w, h){ let s = R(0, 0, w, h, 'p-k', 5) + screws(3, w, 12, 6) + screws(3, w, h - 12, 6) + R(8, 30, w - 16, h - 60, 'p-k3', 4); for (let i = 0; i < 3; i++) s += R(14 + i * 26, 44, 20, 80, 'p-m', 3) + R(18 + i * 26, 60, 12, 46, o.t === 'aR' ? 'p-y' : 'p-w', 2); return s + R(10, 130, w - 20, 22, 'p-off', 4) + T(w / 2, 146, `${o.t} ${o.In}A`, 12, 'p-tw'); },
  mpcb(o, w, h){ return R(0, 0, w, h, 'p-w', 3) + screws(3, w, 8, 4) + screws(3, w, h - 8, 4) + C(w / 2, h * 0.42, w * 0.3, 'p-k') + R(w / 2 - 3, h * 0.42 - w * 0.27, 6, w * 0.27, 'p-off', 2) + T(w / 2, h * 0.78, o.r, fitT(o.r, w - 4, 10), 'p-t'); },
  km(o, w, h){ return R(0, 0, w, h, 'p-w', 3) + R(0, 0, w, h * 0.17, 'p-wd') + R(0, h * 0.83, w, h * 0.17, 'p-wd') + screws(3, w, h * 0.085, Math.min(5, w / 10)) + screws(3, w, h * 0.915, Math.min(5, w / 10)) + R(w * 0.2, h * 0.3, w * 0.6, h * 0.24, 'p-k3', 3) + T(w / 2, h * 0.47, 'A1 A2', fitT('A1 A2', w * 0.6, 9), 'p-tw2') + T(w / 2, h * 0.72, `${o.Ie} A`, fitT(o.Ie + ' A', w - 6, 12), 'p-t'); },
  ol(o, w, h){ return R(0, 0, w, h, 'p-w', 3) + screws(3, w, h - 8, 4) + C(w * 0.3, h * 0.38, Math.min(w, h) * 0.17, 'p-k') + R(w * 0.58, h * 0.25, w * 0.28, h * 0.22, 'p-blue', 3) + T(w / 2, h * 0.75, o.r, fitT(o.r, w - 4, 10), 'p-t'); },
  ss(o, w, h){ return R(0, 0, w, h, 'p-k', 6) + screws(3, w, 14, 6) + screws(3, w, h - 14, 6) + R(w * 0.15, h * 0.22, w * 0.7, h * 0.18, 'p-lcd', 3) + T(w / 2, h * 0.335, 'RUN', Math.min(16, w / 6), 'p-lcdt') + R(w * 0.2, h * 0.47, w * 0.6, h * 0.14, 'p-k3', 3) + T(w / 2, h * 0.75, `SS ${o.In} A`, Math.min(15, w / 6), 'p-tw') + T(w / 2, h * 0.84, 'bypass', Math.min(11, w / 8), 'p-tw2'); },
  vfd(o, w, h){ let s = R(0, 0, w, h, 'p-k', 8); for (let i = 0; i < 9; i++){ s += R(18 + i * (w - 36) / 9, 10, (w - 36) / 18, 50, 'p-k2', 2) + R(18 + i * (w - 36) / 9, h - 60, (w - 36) / 18, 50, 'p-k2', 2); }
    return s + R(w * 0.3, h * 0.2, w * 0.4, h * 0.2, 'p-k3', 6) + R(w * 0.36, h * 0.23, w * 0.28, h * 0.07, 'p-lcd', 3) + T(w / 2, h * 0.28, '50.0 Hz', Math.min(18, w / 9), 'p-lcdt') + C(w * 0.42, h * 0.35, Math.min(9, w / 25), 'p-on') + C(w * 0.58, h * 0.35, Math.min(9, w / 25), 'p-off') + T(w / 2, h * 0.55, `${o.kW} kW`, Math.min(30, w / 5), 'p-tw') + T(w / 2, h * 0.62, 'VFD 400 V', Math.min(16, w / 9), 'p-tw2'); },
  lr(o, w, h){ let s = R(0, h * 0.06, w, h * 0.12, 'p-m', 2) + R(0, h * 0.82, w, h * 0.12, 'p-m', 2); for (let i = 0; i < 3; i++){ const x = w * (0.04 + i * 0.33); s += R(x, h * 0.18, w * 0.26, h * 0.64, 'p-cu', 8); for (let j = 1; j < 6; j++) s += `<line x1="${x + 3}" y1="${h * (0.18 + j * 0.107)}" x2="${x + w * 0.26 - 3}" y2="${h * (0.18 + j * 0.107)}" class="p-cul"/>`; } return s + T(w / 2, h * 0.14, `${o.In}A 3%`, Math.min(16, w / 9), 'p-t'); },
  emc(o, w, h){ return R(0, 0, w, h, 'p-m', 4) + screws(3, w, 14, 5) + screws(3, w, h - 14, 5) + R(w * 0.12, h * 0.3, w * 0.76, h * 0.36, 'p-w', 3) + T(w / 2, h * 0.45, 'EMC', Math.min(18, w / 3.6), 'p-t') + T(w / 2, h * 0.58, `${o.In} A`, Math.min(13, w / 5), 'p-ts'); },
  plc(o, w, h){ let s = R(0, 0, w, h, 'p-w', 3) + R(0, 0, w, 16, 'p-wd') + R(0, h - 16, w, 16, 'p-wd'); for (let i = 0; i < 8; i++) s += C(8 + i * 13, 8, 3, 'p-sc') + C(8 + i * 13, h - 8, 3, 'p-sc') + C(46 + (i % 4) * 9, 30 + Math.floor(i / 4) * 9, 2.5, i % 3 ? 'p-g' : 'p-wd'); return s + R(8, 26, 30, 30, 'p-k3', 2) + T(24, 46, 'RUN', 7, 'p-tw') + T(w / 2, 80, 'PLC', 13, 'p-t'); },
  psu(o, w, h){ let s = R(0, 0, w, h, 'p-m', 3); for (let i = 0; i < 6; i++) s += R(8, 20 + i * 6, w - 16, 2.5, 'p-m2'); return s + screws(4, w, h - 10, 4) + C(w - 12, 70, 3, 'p-g') + T(w / 2, 84, '24V DC', Math.min(12, w / 5), 'p-t') + T(w / 2, 98, o.A + ' A', 10, 'p-ts'); },
  em(o, w, h){ return R(0, 0, w, h, 'p-w', 2) + screws(4, w, 7, 4) + screws(4, w, h - 7, 4) + R(8, 22, w - 16, 24, 'p-lcd', 2) + T(w / 2, 39, '012345', 11, 'p-lcdt') + T(w / 2, 62, 'kWh', 10, 'p-t') + C(w - 12, 60, 3, 'p-off'); },
  pm(o, w, h){ return R(0, 0, w, h, 'p-k', 4) + R(8, 10, w - 16, 50, 'p-lcd', 3) + T(w / 2, 30, '1440 A', 13, 'p-lcdt') + T(w / 2, 50, 'PF 0.95', 11, 'p-lcdt') + screws(4, w, 78, 5); },
  ct(o, w, h){ return R(4, h * 0.62, w - 8, h * 0.38, 'p-k3', 3) + `<circle cx="${w / 2}" cy="${h * 0.42}" r="${w * 0.44}" class="p-k"/>` + C(w / 2, h * 0.42, w * 0.22, 'p-cu') + T(w / 2, h * 0.92, 'CT', 9, 'p-tw'); },
  term(o, w, h){ const tw = termW(o.s); let s = ''; for (let i = 0; i < o.n; i++) s += R(i * tw + 0.4, 0, tw - 0.8, h, i % 5 === 4 ? 'p-tpe' : 'p-tb', 1) + C(i * tw + tw / 2, h * 0.2, tw * 0.28, 'p-sc') + C(i * tw + tw / 2, h * 0.8, tw * 0.28, 'p-sc'); return s; },
  bus(o, w, h){
    let s = ''; const cl = ['p-l1', 'p-l2', 'p-l3', 'p-n'];
    for (let x = 60; x < w - 20; x += 400) s += R(x, 0, 30, h, 'p-ins', 3);
    for (let i = 0; i < 4; i++) s += R(0, 12 + i * 37, w, 24, 'p-cu', 2) + R(w - 24, 12 + i * 37, 24, 24, cl[i]) + T(w - 12, 29 + i * 37, ['L1', 'L2', 'L3', 'N'][i], 11, 'p-tw');
    return s + T(Math.min(w / 2, 300), 9, busTxt(o.sz), 10, 'p-ts');
  },
  drop(o, w, h){ let s = ''; const cl = ['p-l1', 'p-l2', 'p-l3', 'p-n']; for (let y = 120; y < h - 20; y += 400) s += R(0, y, w, 30, 'p-ins', 3);
    for (let i = 0; i < 4; i++) s += R(8 + i * 28, 0, 20, h, 'p-cu', 2) + R(8 + i * 28, h - 24, 20, 24, cl[i]);
    return s; },
  rail(o, w, h){ let s = R(0, 0, w, h, 'p-rail', 1) + R(o.rot ? 6 : 0, o.rot ? 0 : 6, o.rot ? w - 12 : w, o.rot ? h : h - 12, 'p-rail2'); const n = Math.floor((o.rot ? h : w) / 50);
    for (let i = 0; i < n; i++) s += o.rot ? R(w / 2 - 3, 20 + i * 50, 6, 15, 'p-k2', 3) : R(20 + i * 50, h / 2 - 3, 15, 6, 'p-k2', 3); return s; },
  duct(o, w, h){ let s = R(0, 0, w, h, 'p-duct', 2); const L = o.rot ? h : w, n = Math.floor((L - 10) / 12);
    for (let i = 0; i < n; i++) s += o.rot ? R(0, 8 + i * 12, w * 0.3, 5, 'p-ductg') + R(w * 0.7, 8 + i * 12, w * 0.3, 5, 'p-ductg') : R(8 + i * 12, 0, 5, h * 0.3, 'p-ductg') + R(8 + i * 12, h * 0.7, 5, h * 0.3, 'p-ductg');
    return s + (o.rot ? R(w * 0.3, 0, w * 0.4, h, 'p-ductc') : R(0, h * 0.3, w, h * 0.4, 'p-ductc')); },
  bar(o, w, h){ return R(0, 0, w, h, 'p-bar') + `<line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" class="p-barl"/>`; },
  fan(o, w, h){ let s = R(0, 0, w, h, 'p-k3', 8) + `<circle cx="${w / 2}" cy="${h / 2}" r="${w * 0.4}" class="p-k"/>`; for (let i = 0; i < 6; i++) s += `<line x1="${w * 0.12}" y1="${h * (0.25 + i * 0.1)}" x2="${w * 0.88}" y2="${h * (0.25 + i * 0.1)}" class="p-grl"/>`;
    for (let i = 0; i < 5; i++){ const a = i * 72 * Math.PI / 180; s += `<path d="M${w / 2} ${h / 2} q${Math.cos(a) * w * 0.25} ${Math.sin(a) * w * 0.25} ${Math.cos(a + 0.6) * w * 0.33} ${Math.sin(a + 0.6) * w * 0.33}" class="p-blade"/>`; }
    return s + C(w / 2, h / 2, w * 0.06, 'p-m') + T(w / 2, h - 8, o.V + ' m³/h', Math.min(16, w / 8), 'p-tw'); },
  grille(o, w, h){ let s = R(0, 0, w, h, 'p-k3', 8); for (let i = 0; i < 8; i++) s += R(w * 0.1, h * (0.12 + i * 0.09), w * 0.8, h * 0.045, 'p-k', 2); return s + T(w / 2, h - 8, 'OUT', Math.min(16, w / 8), 'p-tw'); },
  cap(o, w, h){ let s = R(0, h - 20, w, 20, 'p-m2', 2); for (let i = 0; i < 3; i++){ const x = 8 + i * 64; s += R(x, 40, 56, h - 64, 'p-capc', 8) + R(x + 10, 20, 36, 22, 'p-k', 3) + C(x + 20, 30, 4, 'p-sc') + C(x + 36, 30, 4, 'p-sc'); } return s + T(w / 2, h * 0.6, `${o.Q} kVAR`, 18, 'p-t'); },
  capk(o, w, h){ return R(0, 0, w, h, 'p-w', 3) + R(4, 0, w - 8, 30, 'p-y', 3) + T(w / 2, 20, 'R', 12, 'p-t') + screws(3, w, 40, 4) + screws(3, w, h - 9, 4) + R(10, 52, w - 20, 26, 'p-k3', 3) + T(w / 2, 100, `${o.Q}kVAR`, 9, 'p-t'); },
  dr(o, w, h){ let s = R(0, h * 0.08, w, h * 0.13, 'p-m', 2) + R(0, h * 0.8, w, h * 0.13, 'p-m', 2); for (let i = 0; i < 3; i++){ const x = w * (0.04 + i * 0.33); s += R(x, h * 0.2, w * 0.26, h * 0.6, 'p-cu', 8); for (let j = 1; j < 5; j++) s += `<line x1="${x + 3}" y1="${h * (0.2 + j * 0.12)}" x2="${x + w * 0.26 - 3}" y2="${h * (0.2 + j * 0.12)}" class="p-cul"/>`; } return s + T(w / 2, h * 0.17, `7 % ${o.Q} kVAR`, 13, 'p-t'); },
  pfcr(o, w, h){ let s = R(0, 0, w, h, 'p-k', 5) + R(12, 12, w - 24, 56, 'p-lcd', 3) + T(w / 2, 36, 'cos φ 0.96', 15, 'p-lcdt') + T(w / 2, 58, '■■■■■□', 13, 'p-lcdt'); for (let i = 0; i < 4; i++) s += R(16 + i * 30, 90, 22, 22, 'p-k3', 4); return s + T(w / 2, 132, 'PFC', 12, 'p-tw2'); }
};
const icon = (k, o) => { const p = {k, o:Object.assign({}, K[k].def, o || {})}; if (K[k].len){ if (k === 'bus') p.o.L = 400; else if (k === 'drop') p.o.L = 400; else p.o.L = 200; } if (k === 'bar') p.o.w = 200; const [w, h] = sz(p); const pad = Math.max(w, h) * 0.06;
  return `<svg viewBox="${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}" aria-hidden="true" preserveAspectRatio="xMidYMid meet">${DRAW[k](p.o, w, h)}</svg>`; };

/* =====================================================================
   project data (canonical factory numbers, shared with the lessons and the calculator)
   ===================================================================== */
const MOT = {
  M1:{a:'P-01 مضخة', kW:15, Ib:27.7, st:'dol'},
  M2:{a:'C-01 ضاغط', kW:37, Ib:66.1, st:'sd'},
  M3:{a:'C-02 ضاغط', kW:37, Ib:66.1, st:'ss'},
  M4:{a:'CH-01 مبرّد', kW:75, Ib:131.0, st:'vfd'}
};
const STN = {dol:'تشغيل مباشر DOL', sd:'ستار دلتا', ss:'بادئ ناعم', vfd:'محوّل تردد VFD'};
const FLD = {dol:['scpd', 'km1', 'ol'], sd:['scpd', 'km1', 'km2', 'km3', 'ol'], ss:['scpd', 'km1', 'ss'], vfd:['scpd', 'vfd', 'lr', 'emc']};
const FLN = {scpd:'جهاز الحماية من القصر', km1:'KM1 كونتاكتور الخط', km2:'KM2 كونتاكتور الدلتا', km3:'KM3 كونتاكتور الستار', ol:'مرحّل الحمل الزائد', ss:'البادئ الناعم', vfd:'محوّل التردد', lr:'ملف الخط', emc:'مرشّح EMC'};
const SCPD_OPT = MPCB_R.map(r => 'MPCB ' + r).concat(MCCB_MA.map(i => 'MA ' + i), [80, 125, 160, 200].map(i => 'aR ' + i), [100, 160, 250].map(i => 'TM ' + i));
const FOPT = {scpd:SCPD_OPT, km1:KM_I.map(String), km2:KM_I.map(String), km3:KM_I.map(String), ol:['int'].concat(OL_R), ss:SS_I.map(String), vfd:VFD_KW.map(String), lr:LR_I.map(String), emc:LR_I.map(String)};
const fTxt = (f, v) => {
  if (!v) return '—';
  if (f === 'scpd'){ const [t, x] = v.split(' '); return t === 'MPCB' ? `MPCB ${x} A` : t === 'MA' ? `MCCB-MA ${x} A` : t === 'aR' ? `aR ${x} A + NH` : `MCCB TM ${x} A`; }
  if (f === 'ol') return v === 'int' ? 'مدمج' : v + ' A';
  if (f === 'vfd') return v + ' kW';
  return v + ' A';
};
/* Type 2 coordination tables, 400 V, Iq 36 kA (typical values for learning) */
const COORD = {
  dol:[[7.5, 15.2, {scpd:'MPCB 13–18', km1:'18', ol:'int'}], [11, 21.5, {scpd:'MPCB 20–25', km1:'25', ol:'int'}], [15, 27.7, {scpd:'MPCB 24–32', km1:'32', ol:'int'}],
    [18.5, 34.5, {scpd:'MPCB 30–40', km1:'38', ol:'int'}], [22, 41, {scpd:'MA 50', km1:'50', ol:'37–50'}], [30, 55.5, {scpd:'MA 100', km1:'65', ol:'48–65'}]],
  sd:[[22, 41, {scpd:'MA 50', km1:'25', km2:'25', km3:'18', ol:'23–32'}], [30, 55.5, {scpd:'MA 100', km1:'32', km2:'32', km3:'25', ol:'30–40'}],
    [37, 66.1, {scpd:'MA 100', km1:'40', km2:'40', km3:'25', ol:'37–50'}], [45, 80, {scpd:'MA 100', km1:'50', km2:'50', km3:'32', ol:'37–50'}], [55, 98, {scpd:'MA 150', km1:'65', km2:'65', km3:'40', ol:'48–65'}]],
  ss:[[22, 41, {scpd:'aR 80', km1:'50', ss:'48'}], [30, 55.5, {scpd:'aR 125', km1:'65', ss:'66'}], [37, 66.1, {scpd:'aR 160', km1:'80', ss:'79'}], [45, 80, {scpd:'aR 160', km1:'95', ss:'88'}], [55, 98, {scpd:'aR 200', km1:'115', ss:'110'}]],
  vfd:[[37, 66.1, {scpd:'TM 100', vfd:'37', lr:'75', emc:'75'}], [55, 98, {scpd:'TM 160', vfd:'55', lr:'150', emc:'150'}], [75, 131, {scpd:'TM 160', vfd:'75', lr:'150', emc:'150'}], [90, 157, {scpd:'TM 250', vfd:'90', lr:'180', emc:'180'}]]
};
const coordRow = m => COORD[MOT[m].st].find(r => r[0] === MOT[m].kW);
function fPart(f, v){
  if (!v || (f === 'ol' && v === 'int')) return null;
  if (f === 'scpd'){ const [t, x] = v.split(' '); if (t === 'MPCB') return {k:'mpcb', o:{r:x}}; if (t === 'aR') return {k:'fsw', o:{t:'aR', In:+x}}; return {k:'mccb', o:{ty:t === 'MA' ? 'MA' : 'TM', In:+x}}; }
  if (f.startsWith('km')) return {k:'km', o:{Ie:+v}};
  if (f === 'ol') return {k:'ol', o:{r:v}};
  if (f === 'ss') return {k:'ss', o:{In:+v}};
  if (f === 'vfd') return {k:'vfd', o:{kW:+v}};
  return {k:f, o:{In:+v}};
}
/* MDB outgoing schedule (from the calculator / lessons 2–4) */
const FD = [
  {id:'SMDB', a:'لوحة الإنتاج SMDB', In:630, Ib:461.9}, {id:'MCC', a:'لوحة المحركات MCC', In:400, Ib:346.1}, {id:'LTG', a:'لوحة الإنارة LTG DB', In:100, Ib:69.6},
  {id:'AC', a:'لوحة التكييف AC DB', In:400, Ib:317.5}, {id:'PFC', a:'بنك المكثفات PFC', In:630, Ib:433}, {id:'SPR', a:'احتياطي', In:250, Ib:0}
];
const FDI = {}; FD.forEach(f => { FDI[f.id] = f; });
/* per-tab configuration */
const TC = {
  layout:{inc:'mccb', incIb:69.6, busI:69.6, LF:0.7, ip:'IP54', form:'2b', start:{enc:'w6080', ip:'IP31', form:'1', entry:'top'},
    def:{mccb:{In:100, ty:'TM'}, mcb:{p:3, c:'C', In:16}, ct:{r:100}, rccb:{p:4, In:63, dn:300}, bus:{L:500, sz:'30x5'}}},
  mcc:{inc:null, busI:346.1, LF:0.7, form:'4b', start:{enc:'f8020', ip:'IP54', form:'1', entry:'bottom'},
    def:{bus:{L:1700, sz:'40x10'}, drop:{L:1200, sz:'40x10'}, mccb:{In:160, ty:'TM'}}},
  project:{inc:'acb', incIb:1060.8, busI:1060.8, LF:0.7, form:'3b', start:{enc:'m3', ip:'IP31', form:'1', entry:'bottom'},
    def:{mccb:{In:400, ty:'TM', fd:''}, bus:{L:2300, sz:'80x10'}, drop:{L:1500, sz:'40x10'}, ct:{r:1600}, rail:{L:600, rot:0}, fan:{V:230}, grille:{V:230}}}
};

/* =====================================================================
   geometry + rules engine
   ===================================================================== */
function bb(p){ const [w, h] = sz(p); return {x:p.x, y:p.y, w, h, x2:p.x + w, y2:p.y + h, cx:p.x + w / 2, cy:p.y + h / 2}; }
const hit = (a, b) => a.x < b.x2 - 0.5 && b.x < a.x2 - 0.5 && a.y < b.y2 - 0.5 && b.y < a.y2 - 0.5;
const gap = (a, b) => Math.hypot(Math.max(0, a.x - b.x2, b.x - a.x2), Math.max(0, a.y - b.y2, b.y - a.y2));
function secIdx(P, x){ for (const p of P) if (x >= p.sx && x < p.sx + p.sw) return p.i; return x < 0 ? 0 : P.length - 1; }
function norm(D){
  const P = plates(D);
  D.parts.forEach(p => { if (p.k === 'bar'){ const s = P[secIdx(P, p.x + (p.o.w || 0) / 2)]; p.x = s.x; p.o.w = s.w; } });
}
const isDoor = p => !!K[p.k].door;
const isDin = p => !!K[p.k].din;
function exempt(a, b){
  const ka = a.k, kb = b.k, da = isDoor(a), db = isDoor(b);
  if (da !== db) return true;
  const pair = (x, y) => (ka === x && kb === y) || (ka === y && kb === x);
  if ((ka === 'rail' && (isDin(b) || kb === 'ol')) || (kb === 'rail' && (isDin(a) || ka === 'ol'))) return true;
  if (pair('bar', 'bus') || pair('bar', 'drop') || pair('bus', 'drop') || pair('ct', 'bus') || pair('ct', 'drop')) return true;
  return false;
}
function Irat(p){ const o = p.o; switch (p.k){ case 'acb': case 'mccb': case 'mcb': case 'fsw': case 'ss': case 'lr': case 'emc': return o.In; case 'mpcb': case 'ol': return rHi(o.r); case 'km': return o.Ie; default: return null; } }
function incOf(tab, D){
  const c = TC[tab].inc; if (!c) return null;
  const xs = D.parts.filter(p => p.k === c && (c !== 'mccb' || p.o.ty !== 'MA'));
  return xs.sort((a, b) => b.o.In - a.o.In)[0] || null;
}
function ibOf(p, tab, D, inc){
  const ir = Irat(p); if (ir == null) return null;
  if (p.o.f && MOT[p.o.f]){ const m = MOT[p.o.f]; if (m.st === 'sd'){ if (p.o.role === 'km3') return 0; if (p.o.role === 'km1' || p.o.role === 'km2' || p.o.role === 'ol') return m.Ib / Math.sqrt(3); } return m.Ib; }
  if (inc && p === inc) return TC[tab].incIb;
  if (tab === 'project' && p.k === 'mccb') return p.o.fd && FDI[p.o.fd] ? FDI[p.o.fd].Ib : 0;
  return TC[tab].LF * ir;
}
const pLoss = (p, ib) => { const ir = Irat(p), pn = lossOf(p); return ir == null || ib == null || p.k === 'vfd' ? pn : pn * Math.pow(ib / ir, 2); };
function zones(p, b, c){
  const z = [];
  if (c.t) z.push({x:b.x, y:b.y - c.t, x2:b.x2, y2:b.y, w:b.w, h:c.t, d:'t', n:c.t});
  if (c.b) z.push({x:b.x, y:b.y2, x2:b.x2, y2:b.y2 + c.b, w:b.w, h:c.b, d:'b', n:c.b});
  if (c.s){ z.push({x:b.x - c.s, y:b.y, x2:b.x, y2:b.y2, w:c.s, h:b.h, d:'s', n:c.s}); z.push({x:b.x2, y:b.y, x2:b.x2 + c.s, y2:b.y2, w:c.s, h:b.h, d:'s', n:c.s}); }
  return z;
}
const DIRT = {t:'فوق', b:'أسفل', s:'بجانب'};
function areaA(D, i){
  const e = ENCI[D.enc], W = e.secs[i] / 1000, H = e.H / 1000, Dp = e.D / 1000, n = e.secs.length;
  if (n === 1) return {A:1.4 * W * (H + Dp) + 1.8 * Dp * H, f:'A = 1.4·W·(H+D) + 1.8·D·H', s:`1.4×${W}×(${H}+${Dp}) + 1.8×${Dp}×${H}`, t:'منفرد على جدار'};
  if (i === 0 || i === n - 1) return {A:1.4 * H * (W + Dp) + 1.4 * W * Dp, f:'A = 1.4·H·(W+D) + 1.4·W·D', s:`1.4×${H}×(${W}+${Dp}) + 1.4×${W}×${Dp}`, t:'طرف صف على جدار'};
  return {A:1.4 * W * (H + Dp) + Dp * H, f:'A = 1.4·W·(H+D) + D·H', s:`1.4×${W}×(${H}+${Dp}) + ${Dp}×${H}`, t:'وسط صف على جدار'};
}
function analyze(tab, D){
  norm(D);
  const P = plates(D), e = ENCI[D.enc], parts = D.parts, B = new Map(), iss = new Map(), bad = [], cat = {};
  parts.forEach(p => B.set(p.id, bb(p)));
  const sec = p => secIdx(P, B.get(p.id).cx);
  const add = (p, c, m) => { if (!iss.has(p.id)) iss.set(p.id, []); iss.get(p.id).push(m); if (!cat[c]) cat[c] = []; cat[c].push(m); };
  /* inside */
  parts.forEach(p => {
    const b = B.get(p.id); let ok;
    if (isDoor(p)) ok = b.x >= 0 && b.y >= 0 && b.x2 <= e.W && b.y2 <= e.H;
    else if (p.k === 'bus') ok = b.y >= P[0].y - 0.5 && b.y2 <= P[0].y + P[0].h + 0.5 && b.x >= P[0].x - 0.5 && b.x2 <= P[P.length - 1].x + P[P.length - 1].w + 0.5;
    else { const s = P[sec(p)]; ok = b.x >= s.x - 0.5 && b.y >= s.y - 0.5 && b.x2 <= s.x + s.w + 0.5 && b.y2 <= s.y + s.h + 0.5; }
    if (!ok) add(p, 'in', `${LI(lbl(p))} خارج ${isDoor(p) ? 'الباب' : 'لوح التركيب'}: اسحبه إلى الداخل.`);
  });
  /* overlaps */
  for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++){
    const a = parts[i], b = parts[j]; if (exempt(a, b)) continue;
    if (hit(B.get(a.id), B.get(b.id))){ const m = `${LI(lbl(a))} يتداخل مع ${LI(lbl(b))}: أبعد أحدهما.`; add(a, 'ov', m); if (!iss.has(b.id)) iss.set(b.id, []); iss.get(b.id).push(m); }
  }
  /* DIN rails and overload relays */
  const rails = parts.filter(p => p.k === 'rail' && !p.o.rot), kms = parts.filter(p => p.k === 'km' || p.k === 'capk');
  const olUnder = km => { const k = B.get(km.id); return parts.find(q => q.k === 'ol' && Math.abs(B.get(q.id).x - k.x) <= 12 && Math.abs(B.get(q.id).y - k.y2) <= 3); };
  parts.forEach(p => {
    if (isDin(p)){ const b = B.get(p.id); if (!rails.some(r => { const rb = B.get(r.id); return Math.abs(rb.cy - b.cy) <= 1.5 && b.x >= rb.x - 0.5 && b.x2 <= rb.x2 + 0.5; })) add(p, 'din', `${LI(lbl(p))} ليس على قضيب DIN: ضعه على قضيب.`); }
    if (p.k === 'ol' && !kms.some(k => olUnder(k) === p)) add(p, 'din', `${LI(lbl(p))} يُركّب مباشرة أسفل الكونتاكتور: ألصقه بأسفله.`);
  });
  /* wiring ducts above and below every row of modular devices */
  const ducts = parts.filter(p => p.k === 'duct' && !p.o.rot).map(p => B.get(p.id));
  parts.filter(isDin).forEach(p => {
    const b = B.get(p.id), o = (p.k === 'km' || p.k === 'capk') ? olUnder(p) : null, yb = o ? B.get(o.id).y2 : b.y2;
    const up = ducts.some(d => d.x <= b.cx && d.x2 >= b.cx && b.y - d.y2 >= 20 && b.y - d.y2 <= 120);
    const dn = ducts.some(d => d.x <= b.cx && d.x2 >= b.cx && d.y - yb >= 20 && d.y - yb <= 120);
    if (!up) add(p, 'duct', `لا يوجد مجرى أسلاك فوق ${LI(lbl(p))} على بعد 20–120 mm.`);
    else if (!dn) add(p, 'duct', `لا يوجد مجرى أسلاك أسفل ${LI(lbl(p))} على بعد 20–120 mm.`);
  });
  /* catalogue clearances */
  const zs = [];
  parts.forEach(p => {
    const c = clrOf(p); if (!c || isDoor(p)) return;
    const b = B.get(p.id);
    zones(p, b, c).forEach(z => {
      const q = parts.find(q => q !== p && !isDoor(q) && q.k !== 'rail' && q.k !== 'bar' && !(c.duct && q.k === 'duct') && !((p.k === 'mccb' || p.k === 'acb' || p.k === 'fsw') && (q.k === 'bus' || q.k === 'drop')) && hit(z, B.get(q.id)));
      z.bad = !!q; z.pid = p.id; zs.push(z);
      if (q) add(p, 'clr', `يلزم ${z.n} mm خالية ${DIRT[z.d]} ${LI(lbl(p))}: أبعد ${LI(lbl(q))}.`);
    });
  });
  /* heavy parts low */
  parts.forEach(p => { const kg = kgOf(p); if (kg >= 20 && !K[p.k].bus){ const b = B.get(p.id), s = P[sec(p)]; if (b.cy < s.y + s.h / 2) add(p, 'heavy', `${LI(lbl(p))} ثقيل (${Math.round(kg)} kg): انقله إلى النصف السفلي.`); } });
  /* incomer near the cable entry, CTs near the incomer */
  const inc = incOf(tab, D);
  if (inc){
    const b = B.get(inc.id), s = P[sec(inc)], top = b.cy < s.y + s.h / 2;
    if (D.entry === 'top' && !top) add(inc, 'entry', `الكابل يدخل من أعلى: ضع ${LI(lbl(inc))} في النصف العلوي.`);
    if (D.entry === 'bottom' && top) add(inc, 'entry', `الكابل يدخل من أسفل: ضع ${LI(lbl(inc))} في النصف السفلي.`);
    parts.filter(p => p.k === 'ct').forEach(p => { if (gap(B.get(p.id), b) > 250) add(p, 'ct', `محوّل التيار بعيد عن ${LI(lbl(inc))}: قرّبه إلى ≤ 250 mm.`); });
  }
  /* compartments (horizontal barriers inside each section) */
  const slices = P.map(s => { const bs = parts.filter(p => p.k === 'bar' && sec(p) === s.i).map(p => B.get(p.id)).sort((a, b) => a.y - b.y); const r = []; let y = s.y; bs.forEach(b => { r.push([y, b.y]); y = b.y2; }); r.push([y, s.y + s.h]); return r; });
  const comp = p => { const b = B.get(p.id), i = sec(p), sl = slices[i]; for (let j = 0; j < sl.length; j++) if (b.y >= sl[j][0] - 0.5 && b.y2 <= sl[j][1] + 0.5) return i + ':' + j; return null; };
  /* heat per section */
  const heat = P.map(s => {
    const rows = [], ps = parts.filter(p => sec(p) === s.i && !K[p.k].bus);
    let tot = 0;
    const grp = {};
    ps.forEach(p => {
      const ib = ibOf(p, tab, D, inc), pv = pLoss(p, ib);
      if (pv > 0){ const key = lbl(p) + '|' + (ib == null ? '' : fmt(ib, 1)); grp[key] = grp[key] || {n:lbl(p), q:0, pn:lossOf(p), ib, ir:Irat(p), p:0, vfd:p.k === 'vfd'}; grp[key].q++; grp[key].p += pv; tot += pv; }
    });
    Object.values(grp).forEach(g => rows.push(g));
    /* internal cables, one per protective device */
    let pc = 0, nc = 0;
    ps.forEach(p => { if (!K[p.k].scpd) return; const ib = ibOf(p, tab, D, inc), ir = Irat(p); if (!ib) return; const n = p.k === 'mcb' ? p.o.p : 3; pc += n * ib * ib * RHO * LCAB / cabS(ir); nc++; });
    if (pc > 0){ rows.push({n:`الكابلات الداخلية (${nc} دائرة × ${LCAB} m)`, cab:true, p:pc}); tot += pc; }
    /* busbars */
    parts.filter(p => K[p.k].bus).forEach(p => {
      const b = B.get(p.id), Ls = Math.max(0, Math.min(b.x2, s.sx + s.sw) - Math.max(b.x, s.sx)) / 1000; if (p.k === 'bus' ? Ls <= 0 : sec(p) !== s.i) return;
      let I = TC[tab].busI, L = Ls;
      if (p.k === 'drop'){ L = b.h / 1000; const hasInc = inc && sec(inc) === s.i; I = hasInc ? TC[tab].incIb : ps.filter(q => K[q.k].scpd && q !== inc).reduce((a, q) => a + (ibOf(q, tab, D, inc) || 0), 0); }
      const S = BUSI[p.o.sz].S, pv = 3 * I * I * RHO * L / S;
      rows.push({n:lbl(p), bus:true, I, L, S, p:pv}); tot += pv;
    });
    const a = areaA(D, s.i), dt05 = tot / (KH * a.A);
    const fans = parts.filter(p => p.k === 'fan' && sec(p) === s.i), gr = parts.filter(p => p.k === 'grille' && sec(p) === s.i);
    const fanOk = fans.filter(f => B.get(f.id).cy >= e.H * 2 / 3), grOk = gr.filter(g => B.get(g.id).cy <= e.H / 3);
    const V = fanOk.length && grOk.length ? fanOk.reduce((x, f) => x + f.o.V, 0) : 0;
    const dta = TLIM - AMB, pv = Math.max(0, tot - KH * a.A * dta), Vreq = 3.1 * pv / dta;
    let d05, d10;
    if (V){ d10 = tot / (KH * a.A + V / 3.1); d05 = d10 / 2; } else { d05 = dt05; d10 = CTOP * dt05; }
    const Tat = h => AMB + (h <= 0.5 ? d05 * h / 0.5 : d05 + (d10 - d05) * (h - 0.5) / 0.5);
    const el = ps.filter(p => K[p.k].elec).map(p => { const b = B.get(p.id), h = (e.H - b.cy) / e.H; return {p, T:Tat(clamp(h, 0, 1))}; });
    const msgs = [];
    if (fans.length && !fanOk.length) msgs.push('المروحة في أعلى اللوحة: ضعها في الثلث السفلي لتدفع الهواء البارد.');
    else if (fans.length && !grOk.length) msgs.push('لا يوجد فلتر خروج في الثلث العلوي من القسم نفسه.');
    if (V && V < Vreq) msgs.push(`تدفق المروحة ${V} m³/h أقل من المطلوب ${fmt(Vreq, 0)} m³/h: اختر مروحة أكبر.`);
    if (AMB + d10 > TLIM + 1e-9 && !msgs.length) msgs.push(`الحرارة أعلى القسم ${fmt(AMB + d10, 1)} °C > ${TLIM} °C: أضف مروحة بفلتر (V ≥ ${fmt(Math.max(Vreq, FAN_V[0]), 0)} m³/h) أو غلافًا أكبر.`);
    el.forEach(x => { if (x.T > TEL + 1e-9) msgs.push(`الهواء عند ${LI(lbl(x.p))} نحو ${fmt(x.T, 1)} °C > ${TEL} °C: أضف مروحة أو انقله إلى الأسفل.`); });
    return {s, rows, P:tot, a, dt05, d05, d10, V, Vreq, pv, fans:fans.length, Tat, el, msgs, ok:!msgs.length && AMB + d10 <= TLIM + 1e-9, empty:!ps.length && !rows.length};
  });
  return {P, B, iss, cat, zs, heat, inc, slices, comp, sec, olUnder};
}

/* =====================================================================
   store
   ===================================================================== */
function fresh(tab){ const s = TC[tab].start; return {enc:s.enc, ip:s.ip, form:s.form, entry:s.entry, parts:[], seq:1, fe:{}, tests:{}}; }
function loadAll(){ let s = null; try { s = JSON.parse(localStorage.getItem(SKEY)); } catch (e){} const o = {}; TABS.forEach(t => { const d = s && s.tabs && s.tabs[t.id]; o[t.id] = d && Array.isArray(d.parts) && ENCI[d.enc] ? Object.assign(fresh(t.id), d) : fresh(t.id); o[t.id].parts = o[t.id].parts.filter(p => K[p.k] && p.o); }); return o; }
const ST = loadAll();
let saveT = 0;
function flush(){ clearTimeout(saveT); saveT = 0; if (DEMO) return; try { localStorage.setItem(SKEY, JSON.stringify({v:1, tabs:ST})); } catch (e){} }
function saveAll(){ clearTimeout(saveT); saveT = setTimeout(flush, 250); }
window.addEventListener('pagehide', () => { if (saveT) flush(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && saveT) flush(); });

/* =====================================================================
   the editor (one instance per tab, same code)
   ===================================================================== */
const heatCol = t => { const st = [[35, [47, 111, 214]], [43, [58, 166, 85]], [50, [227, 194, 27]], [55, [240, 138, 29]], [62, [214, 47, 47]]]; t = clamp(t, 35, 62);
  for (let i = 1; i < st.length; i++) if (t <= st[i][0]){ const a = st[i - 1], b = st[i], f = (t - a[0]) / (b[0] - a[0]); return 'rgb(' + a[1].map((v, j) => Math.round(v + (b[1][j] - v) * f)).join(',') + ')'; } return 'rgb(214,47,47)'; };
function genItems(R, D){
  const c = R.cat, f = k => (c[k] || [])[0], any = D.parts.some(p => kgOf(p) >= 20 && !K[p.k].bus), out = [];
  out.push({ok:!c.in && !c.ov, t:'كل المكونات داخل اللوح ولا تداخل بينها', why:f('in') || f('ov')});
  if (D.parts.some(p => isDin(p) || p.k === 'ol')){
    out.push({ok:!c.din, t:'الأجهزة النمطية على قضبان DIN، والـ OL أسفل الكونتاكتور', why:f('din')});
    out.push({ok:!c.duct, t:`مجرى أسلاك فوق كل صف وأسفله على بعد ${L('20–120 mm')}`, why:f('duct')});
  }
  out.push({ok:!c.clr, t:'مسافات الكتالوج حول القواطع والأجهزة الساخنة', why:f('clr')});
  if (any) out.push({ok:!c.heavy, t:`الأجهزة الثقيلة ${L('≥ 20 kg')} في النصف السفلي`, why:f('heavy')});
  return out;
}
function heatItem(R){
  const used = R.heat.filter(h => !h.empty), bad = used.find(h => !h.ok);
  const top = used.length ? Math.max(...used.map(h => AMB + h.d10)) : AMB;
  return {ok:used.length > 0 && !bad, t:`الحرارة: أعلى نقطة ${L(fmt(top, 1) + ' °C ≤ ' + TLIM + ' °C')}${used.length > 1 ? ' في كل قسم' : ''}`, why:bad ? (R.P.length > 1 ? `القسم S${bad.s.i + 1}: ` : '') + bad.msgs[0] : ''};
}

function makeEditor(tab, host, opt){
  const D0 = () => ST[tab];
  const E = {tab, sel:null, arm:null, zoom:1, heat:false, demo:false, R:null};
  const fo = (v, l) => `<option value="${esc(v)}">${esc(l)}</option>`;
  host.insertAdjacentHTML('beforeend', `
  <div class="ed">
    <div class="ed-tool">
      <label>الغلاف <select data-c="enc" class="inp">${ENC.map(e => fo(e.id, `${encName(e)} · ${encAr(e)}`)).join('')}</select></label>
      <label>IP <select data-c="ip" class="inp">${IPS.map(i => fo(i, i)).join('')}</select></label>
      <label>دخول الكابلات <select data-c="entry" class="inp">${fo('top', 'من أعلى')}${fo('bottom', 'من أسفل')}</select></label>
      <label>شكل الفصل <select data-c="form" class="inp">${FORMS.map(f => fo(f, 'Form ' + f)).join('')}</select></label>
      <span class="sp"></span>
      <button type="button" class="btn" data-a="zoom">تكبير 1×</button>
      <button type="button" class="btn" data-a="heat" aria-pressed="false">خريطة الحرارة</button>
      <button type="button" class="btn" data-a="reset">ابدأ من جديد</button>
    </div>
    <div class="ed-pal" aria-label="مكتبة المكونات">${CATS.map((c, ci) => `<h3>${esc(c)}</h3><div class="pal-g">${ORDER.filter(k => K[k].cat === ci).map(k => `<button type="button" class="pal-i" data-k="${k}" title="${esc(K[k].a)}" aria-pressed="false">${icon(k, TC[tab].def[k])}<span>${esc(SHORT[k])}</span></button>`).join('')}</div>`).join('')}</div>
    <div class="ed-cv">
      <div class="ed-wrap"><svg tabindex="0" aria-label="الواجهة الأمامية للوحة بالمليمتر" role="img"></svg></div>
      <p class="ed-msg" aria-live="polite"></p>
    </div>
    <div class="ed-side">
      <div class="panel ed-props"></div>
      <div class="panel ed-chk"></div>
    </div>
  </div>
  <div class="ed-x"></div>
  <div class="grid2"><div class="panel ed-heat"></div><div class="panel ed-form"></div></div>
  <div class="panel ed-bom"></div>`);
  const root = $('.ed', host), svg = $('.ed-wrap svg', root), wrap = $('.ed-wrap', root), pal = $('.ed-pal', root), props = $('.ed-props', root), chk = $('.ed-chk', root), msgEl = $('.ed-msg', root);
  const heatEl = $('.ed-heat', host), formEl = $('.ed-form', host), bomEl = $('.ed-bom', host);
  E.root = root; E.svg = svg; E.x = $('.ed-x', host);
  E.say = (t, c) => { msgEl.textContent = t || ''; msgEl.className = 'ed-msg' + (c ? ' ' + c : ''); };
  const D = () => ST[tab];
  const find = id => D().parts.find(p => p.id === id);

  /* ---------- placement + snapping ---------- */
  function snapPart(p, exact){
    const d = D(), b = bb(p);
    if (!exact){ p.x = snap(p.x); p.y = snap(p.y); }
    if (isDin(p)){
      const b2 = bb(p), r = d.parts.filter(q => q.k === 'rail' && !q.o.rot).map(q => bb(q)).find(rb => Math.abs(rb.cy - b2.cy) <= 45 && b2.cx >= rb.x && b2.cx <= rb.x2);
      if (r){
        p.y = r.cy - b2.h / 2;
        if (!exact){ const nb = d.parts.filter(q => q !== p && isDin(q) && Math.abs(bb(q).cy - r.cy) < 2).map(bb);
          for (const q of nb){ if (Math.abs(p.x - q.x2) < 10){ p.x = q.x2; break; } if (Math.abs(p.x + b2.w - q.x) < 10){ p.x = q.x - b2.w; break; } } }
      }
    }
    if (p.k === 'ol' && !exact){ const b2 = bb(p), km = d.parts.filter(q => q.k === 'km').map(q => bb(q)).find(k => Math.abs(k.cx - b2.cx) < 40 && Math.abs(b2.y - k.y2) < 45); if (km){ p.x = km.x; p.y = km.y2; } }
    if (p.k === 'bar'){ const P = plates(d), s = P[secIdx(P, b.cx)]; p.x = s.x; p.o.w = s.w; }
  }
  E.place = (k, o, pt, exact, quiet) => {
    const d = D(), p = {id:'p' + (d.seq++), k, o:Object.assign({}, K[k].def, TC[tab].def[k] || {}, o || {}), x:0, y:0};
    if (k === 'bar'){ const P = plates(d); p.o.w = P[secIdx(P, pt.x)].w; }
    const [w, h] = sz(p);
    if (exact){ p.x = pt.x; p.y = pt.y; } else { p.x = pt.x - w / 2; p.y = pt.y - h / 2; }
    snapPart(p, exact);
    d.parts.push(p); E.sel = p.id; E.update(true);
    if (!quiet) E.say(`وُضع ${LI(lbl(p))}.`, '');
    return p;
  };
  E.dup = p => {
    const d = D(), P = plates(d), b = bb(p), s = P[secIdx(P, b.cx)], q = {id:'p' + (d.seq++), k:p.k, o:clone(p.o), x:p.x, y:p.y};
    delete q.o.role;
    const free = (x, y) => { q.x = x; q.y = y; const qb = bb(q); if (qb.x < s.x - 0.5 || qb.x2 > s.x + s.w + 0.5 || qb.y < s.y - 0.5 || qb.y2 > s.y + s.h + 0.5) return false; return !d.parts.some(r => !exempt(q, r) && hit(qb, bb(r))); };
    const step = isDin(p) ? 0 : 10, cand = [];
    for (let x = b.x2 + step; x + b.w <= s.x + s.w + 0.5; x += isDin(p) ? b.w : 10) cand.push([x, p.y]);
    for (let y = b.y2 + 20; y + b.h <= s.y + s.h; y += 10) for (let x = s.x; x + b.w <= s.x + s.w; x += 10) cand.push([x, y]);
    const c = cand.find(([x, y]) => free(x, y));
    if (!c){ d.seq--; E.say('لا يوجد مكان فارغ قريب للنسخة.', 'bad'); return null; }
    q.x = c[0]; q.y = c[1]; if (!isDin(p)) snapPart(q, true);
    d.parts.push(q); E.sel = q.id; E.update(true); E.say(`نُسخ ${LI(lbl(q))}.`, ''); return q;
  };
  E.del = p => { const d = D(); d.parts.splice(d.parts.indexOf(p), 1); if (E.sel === p.id) E.sel = null; E.update(true); };

  /* ---------- render ---------- */
  function render(){
    const d = D(), e = ENCI[d.enc], P = plates(d), R = E.R, fl = e.kind === 'floor', H2 = e.H + (fl ? 100 : 0);
    const fs = Math.max(1, e.W / 900), TM = 40 + 80 * fs; svg.setAttribute('viewBox', `-110 ${-TM} ${e.W + 220} ${H2 + TM + 100}`); svg.setAttribute('width', e.W + 220); svg.setAttribute('height', H2 + TM + 100);
    let s = `<defs><pattern id="${tab}-hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="16" height="16" class="p-shr"/><line x1="0" y1="0" x2="0" y2="16" class="p-shl"/></pattern>
      <pattern id="${tab}-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" class="p-grid"/></pattern>`;
    if (E.heat && R) R.heat.forEach(h => { s += `<linearGradient id="${tab}-hg${h.s.i}" x1="0" y1="1" x2="0" y2="0">${[0, 0.25, 0.5, 0.75, 1].map(f => `<stop offset="${f}" stop-color="${heatCol(h.Tat(f))}"/>`).join('')}</linearGradient>`; });
    s += '</defs>';
    /* body, plates, gland plate */
    P.forEach(p => { s += R0(p.sx, 0, p.sw, e.H, 'enc') + R0(p.sx + 14, 14, p.sw - 28, e.H - 28, 'enc2') + R0(p.x, p.y, p.w, p.h, 'plate2') + R0(p.x, p.y, p.w, p.h, '', ` fill="url(#${tab}-grid)"`);
      const gy = d.entry === 'top' ? 18 : e.H - 46; s += R0(p.sx + 70, gy, p.sw - 140, 28, 'gland'); for (let x = p.sx + 100; x < p.sx + p.sw - 90; x += 70) s += `<circle cx="${x}" cy="${gy + 14}" r="9" class="gl"/>`;
      s += `<text x="${p.sx + p.sw / 2}" y="-10" class="dim" style="font-size:${26 * fs}px" text-anchor="middle">S${p.i + 1} · ${p.sw}</text>`; });
    if (fl) s += R0(0, e.H, e.W, 100, 'plinth');
    s += R0(0, 0, e.W, e.H, 'encO');
    s += `<text x="${e.W / 2}" y="${-(20 + 40 * fs)}" class="dim2" style="font-size:${36 * fs}px" text-anchor="middle">${e.W} × ${e.H} × ${e.D} mm · ${esc(d.ip)} · Form ${esc(d.form)}</text>`;
    s += `<text x="-30" y="${e.H / 2}" class="dim" text-anchor="middle" transform="rotate(-90 -30 ${e.H / 2})">${e.H} mm</text>`;
    const ay = d.entry === 'top' ? -40 : H2 + 40, ad = d.entry === 'top' ? 1 : -1;
    s += `<path d="M${-70} ${ay} v${ad * 50}" class="arr-e"/><path d="M${-80} ${ay + ad * 36} l10 ${ad * 14} l10 ${-ad * 14}" class="arr-e"/>`;
    /* parts in layers */
    const layer = p => K[p.k].door ? 5 : p.k === 'rail' ? 0 : p.k === 'duct' ? 1 : K[p.k].bus ? 2 : p.k === 'bar' ? 4 : 3;
    const sorted = d.parts.slice().sort((a, b) => layer(a) - layer(b));
    const lv = FLV(d.form);
    sorted.forEach(p => {
      const [w, h] = sz(p), bad = R && R.iss.has(p.id), sel = E.sel === p.id;
      s += `<g data-id="${p.id}" class="pt${bad ? ' bad' : ''}${sel ? ' sel' : ''}${K[p.k].door ? ' door' : ''}" transform="translate(${p.x} ${p.y})">${DRAW[p.k](p.o, w, h)}${lv >= 2 && K[p.k].bus ? R0(-6, -6, w + 12, h + 12, '', ` fill="url(#${tab}-hatch)" class="shroud"`) : ''}${p.o.f && p.k !== 'ol' ? `<text x="4" y="-4" class="ftag">${esc(p.o.f)}</text>` : ''}${p.o.fd ? `<text x="${w / 2}" y="-6" class="ftag" text-anchor="middle">${esc(p.o.fd)}</text>` : ''}<rect x="-2" y="-2" width="${w + 4}" height="${h + 4}" class="pt-o" rx="3"/></g>`;
    });
    /* clearance zones */
    if (R) R.zs.forEach(z => { if (z.bad || z.pid === E.sel) s += R0(z.x, z.y, z.w, z.h, 'zn' + (z.bad ? ' bad' : '')); });
    /* heat map */
    if (E.heat && R) R.heat.forEach(h => { const p = h.s; s += R0(p.x, p.y, p.w, p.h, 'hm', ` fill="url(#${tab}-hg${h.s.i})"`) + `<text x="${p.x + p.w / 2}" y="${p.y + 60}" class="hm-t" text-anchor="middle">${fmt(AMB + h.d10, 1)} °C</text><text x="${p.x + p.w / 2}" y="${p.y + p.h / 2 + 20}" class="hm-t s" text-anchor="middle">${fmt(AMB + h.d05, 1)} °C</text>`; });
    /* resize handle */
    const sp = find(E.sel);
    if (sp && K[sp.k].len && !E.demo){ const b = bb(sp), hz = K[sp.k].len === 'w' || (K[sp.k].len === 'r' && !sp.o.rot); s += `<g class="hdl" data-h="1"><circle cx="${hz ? b.x2 : b.cx}" cy="${hz ? b.cy : b.y2}" r="22" class="hdl-c"/><path d="${hz ? `M${b.x2 - 10} ${b.cy}h20` : `M${b.cx} ${b.y2 - 10}v20`}" class="hdl-l"/></g>`; }
    if (E.arm) s += R0(0, 0, e.W, e.H, 'armz');
    svg.innerHTML = s;
  }
  const R0 = (x, y, w, h, c, ex) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${c ? ` class="${c}"` : ''}${ex || ''}/>`;

  /* ---------- side panels ---------- */
  function renderProps(){
    const p = find(E.sel);
    if (!p){ props.innerHTML = `<h3>الخصائص</h3><p class="tip">اسحب مكوّنًا من المكتبة إلى اللوح، أو انقره ثم انقر مكانه. انقر مكوّنًا على اللوح لتحريكه أو تعديله.</p><p class="tip">${L('W×H×D')} الأبعاد بالمليمتر، والشبكة ${L('10 mm')}.</p>`; return; }
    const k = K[p.k], [w, h] = sz(p), R = E.R, is = (R && R.iss.get(p.id)) || [];
    const opts = (k.opts || []).map(([f, a, v, u]) => { const list = typeof v === 'function' ? v(p.o) : v; return `<label>${esc(a)}<select data-o="${f}" dir="ltr">${list.map(x => `<option value="${esc(x)}"${String(p.o[f]) === String(x) ? ' selected' : ''}>${esc(f === 'sz' ? busTxt(x) : x)}${u ? ' ' + esc(u) : ''}</option>`).join('')}</select></label>`; }).join('');
    const len = k.len ? `<label>الطول${L(' mm')}<input type="number" data-p="L" min="60" max="4000" step="10" value="${p.o.L}" dir="ltr"></label>` : '';
    const fsel = tab === 'mcc' && !k.door ? `<label>يتبع المخرج<select data-o="f" dir="ltr"><option value="">—</option>${Object.keys(MOT).map(m => `<option${p.o.f === m ? ' selected' : ''}>${m}</option>`).join('')}</select></label>` : '';
    const fdsel = tab === 'project' && p.k === 'mccb' ? `<label>المخرج<select data-o="fd"><option value="">—</option>${FD.map(f => `<option value="${f.id}"${p.o.fd === f.id ? ' selected' : ''}>${esc(f.a)} · ${f.In} A</option>`).join('')}</select></label>` : '';
    const ib = R ? ibOf(p, tab, D(), R.inc) : null;
    props.innerHTML = `<h3>${L(lbl(p))}<span class="acts">${k.rot ? '<button type="button" class="btn" data-pa="rot" title="تدوير">⟳ تدوير</button>' : ''}<button type="button" class="btn" data-pa="dup">نسخ</button><button type="button" class="btn" data-pa="del">حذف</button></span></h3>
      <p class="tip">${esc(k.a)} · ${L(`${Math.round(w)}×${Math.round(h)} mm`)}${kgOf(p) >= 1 ? ' · ' + L(fmt(kgOf(p), 0) + ' kg') : ''}${lossOf(p) ? ' · ' + L(`Pn ${lossOf(p)} W`) : ''}${ib != null && p.k !== 'vfd' ? ' · ' + L(`Ib ${fmt(ib, 1)} A`) : ''}</p>
      <div class="g4"><label>X<input type="number" data-p="x" step="10" value="${Math.round(p.x)}" dir="ltr"></label><label>Y<input type="number" data-p="y" step="10" value="${Math.round(p.y)}" dir="ltr"></label></div>
      ${opts}${len}${fsel}${fdsel}${is.length ? `<p class="iss">${esc(is[0])}</p>` : ''}`;
  }
  props.addEventListener('change', e => {
    const p = find(E.sel); if (!p || E.demo) return;
    const t = e.target;
    if (t.dataset.o){ const f = t.dataset.o, v = t.value; p.o[f] = v === '' ? '' : (isNaN(+v) || f === 'sz' || f === 'r' || f === 'ty' || f === 't' || f === 'c' || f === 'f' || f === 'fd' ? v : +v);
      if (f === 'ty' || f === 't'){ const l = K[p.k].opts.find(x => x[0] === 'In')[2](p.o); if (!l.includes(p.o.In)) p.o.In = l[0]; }
      if (f === 'f'){ if (!v) delete p.o.f; delete p.o.role; }
      if (f === 'fd' && v && FDI[v]) p.o.In = FDI[v].In;
      snapPart(p, true); }
    else if (t.dataset.p){ const v = IL.num(t.value); if (!isFinite(v)) return; if (t.dataset.p === 'L') p.o.L = clamp(snap(v), 60, 4000); else { p[t.dataset.p] = v; snapPart(p, false); } }
    E.update(true);
  });
  IL.onAct(props, '[data-pa]', b => { const p = find(E.sel); if (!p || E.demo) return; const a = b.dataset.pa;
    if (a === 'del'){ E.del(p); E.say(`حُذف ${LI(lbl(p))}.`, ''); }
    else if (a === 'dup') E.dup(p);
    else if (a === 'rot'){ p.o.rot = p.o.rot ? 0 : 90; E.update(true); } });

  function renderChk(items){
    const n = items.filter(i => i.ok).length;
    chk.innerHTML = `<h3>قائمة التحقق <span>${n}/${items.length}</span></h3><ul>${items.map(i => `<li class="${i.ok ? 'ok' : ''}"><div>${i.t}${!i.ok && i.why ? `<small>${esc(i.why)}</small>` : ''}</div></li>`).join('')}</ul>`;
  }
  function renderHeat(R){
    const d = D(), e = ENCI[d.enc];
    const blocks = R.heat.filter(h => !h.empty || R.heat.length === 1).map(h => {
      const a = h.a, dta = TLIM - AMB;
      const rows = h.rows.map(r => r.cab ? `<tr><td class="ar">${esc(r.n)}</td><td></td><td>n·I²·ρ·L/S</td><td></td><td>${fmt(r.p, 1)}</td></tr>` :
        r.bus ? `<tr><td>${esc(r.n)}</td><td>1</td><td>3·I²·ρ·L/S</td><td>${fmt(r.I, 0)} A · ${fmt(r.L, 2)} m</td><td>${fmt(r.p, 1)}</td></tr>` :
        `<tr><td>${esc(r.n)}</td><td>${r.q}</td><td>${r.pn}${r.vfd ? ' (3 %·kW)' : ''}</td><td>${r.ib == null || r.vfd ? '—' : fmt(r.ib, 1) + '/' + r.ir}</td><td>${fmt(r.p, 1)}</td></tr>`).join('');
      const fan = h.V ? `<div>Δt1.0 = P / (k·A + V/3.1) = ${fmt(h.P, 1)} / (5.5×${fmt(a.A, 2)} + ${h.V}/3.1) = <b>${fmt(h.d10, 1)} K</b></div>` :
        `<div>Δt1.0 = c·Δt0.5 = ${CTOP}×${fmt(h.dt05, 2)} = <b>${fmt(h.d10, 1)} K</b></div>`;
      return `<div class="hb${h.ok ? ' ok' : ' bad'}"><h4>${R.P.length > 1 ? `S${h.s.i + 1} · ` : ''}${e.secs[h.s.i]}×${e.H}×${e.D} <small>${esc(a.t)}</small> <span class="pill ${h.ok ? 'ok' : 'bad'}">${fmt(AMB + h.d10, 1)} °C</span></h4>
        <div class="fx">
          <div>P = ΣPv = <b>${fmt(h.P, 1)} W</b> <small>(Pv = Pn·(Ib/In)²)</small></div>
          <div>${a.f} = ${a.s} = <b>${fmt(a.A, 2)} m²</b></div>
          <div>Δt0.5 = P / (k·A) = ${fmt(h.P, 1)} / (5.5×${fmt(a.A, 2)}) = <b>${fmt(h.dt05, 1)} K</b>${h.V ? ' <small>(بلا مروحة)</small>' : ''}</div>
          ${fan}
          <div>T = ${AMB} + ${fmt(h.d10, 1)} = <b>${fmt(AMB + h.d10, 1)} °C</b> ${AMB + h.d10 <= TLIM + 1e-9 ? '≤' : '>'} ${TLIM} °C</div>
          <div>V = 3.1·(P − k·A·ΔT)/ΔT = 3.1×(${fmt(h.P, 1)} − 5.5×${fmt(a.A, 2)}×${dta})/${dta} = <b>${h.pv > 0 ? fmt(3.1 * h.pv / dta, 0) + ' m³/h' : '0'}</b>${h.V ? ` · المروحة ${h.V} m³/h` : ''}</div>
          ${h.el.map(x => `<div>T @ ${esc(lbl(x.p))} ≈ ${fmt(x.T, 1)} °C ${x.T <= TEL + 1e-9 ? '≤' : '>'} ${TEL} °C</div>`).join('')}
        </div>
        ${h.msgs.length ? `<p class="iss">${esc(h.msgs[0])}</p>` : ''}
        <details><summary>المفقودات (${h.rows.length})</summary><div class="tblw"><table class="tbl hm"><thead><tr><th>Item</th><th>Qty</th><th>Pn W</th><th>Ib/In A</th><th>Pv W</th></tr></thead><tbody>${rows || '<tr><td colspan="5">—</td></tr>'}</tbody></table></div></details></div>`;
    }).join('');
    heatEl.innerHTML = `<h3>حساب الحرارة <small>IEC TR 60890 مبسّط · قيم نموذجية للتعلّم</small></h3><p class="note">المحيط ${L(AMB + ' °C')}، و ${L('k = 5.5 W/(m²·K)')}، و ${L('ρ = 0.0206 Ω·mm²/m')}، والحد أعلى الهواء ${L(TLIM + ' °C')} وعند الإلكترونيات ${L(TEL + ' °C')}.</p>${blocks}`;
  }
  function renderForm(){
    const d = D(), cur = d.form, need = TC[tab].form;
    const tx = {'1':'لا حواجز داخلية.', '2a':'حاجز يغطي البارات (يُرسم مخططًا فوقها).', '2b':'حاجز يغطي البارات، وأطراف الكابلات مفصولة عن البارات.', '3a':'حاجز للبارات، وحاجز أفقي بين كل وحدة وظيفية وأخرى.', '3b':'حاجز للبارات، وحواجز أفقية بين الوحدات، والأطراف مفصولة عن البارات.', '4a':'كما في 3b، مع فصل أطراف كل وحدة عن أطراف الوحدات الأخرى.', '4b':'كل وحدة وأطرافها في مقصورة مستقلة، والأطراف في حجرة كابلات منفصلة.'};
    formEl.innerHTML = `<h3>أشكال الفصل الداخلي <small>IEC 61439-2</small></h3><div class="tblw"><table class="tbl hm ft"><thead><tr><th>Form</th><th class="ar">البارات / الوحدات</th><th class="ar">وحدة / وحدة</th><th class="ar">الأطراف / البارات</th><th class="ar">أطراف كل وحدة</th></tr></thead><tbody>${FORMT.map(r => `<tr class="${r[0] === cur ? 'cur' : ''}${r[0] === need ? ' need' : ''}"><td>Form ${r[0]}${r[0] === need ? ' ★' : ''}</td>${r.slice(1).map(v => `<td>${v ? '✓' : '—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="note">الحواجز المطلوبة لـ ${L('Form ' + cur)}: ${esc(tx[cur])} المطلوب في هذا التمرين ${L('Form ' + need)} ★.</p>`;
  }
  function renderBom(R){
    const d = D(), e = ENCI[d.enc], g = {};
    d.parts.forEach(p => { const k = lbl(p); g[k] = g[k] || {q:0, a:K[p.k].a, w:0, kg:0}; g[k].q++; g[k].kg += kgOf(p); });
    const rows = [[1, `Enclosure ${encName(e)} ${d.ip}`, `غلاف ${encAr(e)}`, '']].concat(Object.entries(g).map(([k, v]) => [v.q, k, v.a, fmt(v.kg, 1)]));
    if (FLV(d.form) >= 2 && d.parts.some(p => K[p.k].bus)) rows.push([1, `Busbar shrouds Form ${d.form}`, 'أغطية عازلة للبارات', '']);
    rows.push([1, `Gland plate (${d.entry === 'top' ? 'top' : 'bottom'})`, 'لوح جلندات الكابلات', '']);
    const tot = R.heat.reduce((a, h) => a + h.P, 0), kg = d.parts.reduce((a, p) => a + kgOf(p), 0);
    bomEl.innerHTML = `<h3>قائمة المواد BOM <small>${d.parts.length} مكوّن · ${L(fmt(kg, 0) + ' kg')} · ${L('ΣPv ' + fmt(tot, 0) + ' W')}</small></h3><div class="tblw"><table class="tbl hm"><thead><tr><th>#</th><th>Qty</th><th>Designation</th><th class="ar">الوصف</th><th>kg</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${esc(r[1])}</td><td class="ar">${esc(r[2])}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function syncTool(){ const d = D(); ['enc', 'ip', 'entry', 'form'].forEach(c => { const s = $(`[data-c="${c}"]`, root); if (s.value !== d[c]) s.value = d[c]; });
    const z = $('[data-a="zoom"]', root); z.textContent = 'تكبير ' + E.zoom + '×'; $('[data-a="heat"]', root).setAttribute('aria-pressed', E.heat ? 'true' : 'false');
    wrap.className = 'ed-wrap' + (E.zoom > 1 ? ' z' + E.zoom : ''); }
  E.update = (save, light) => {
    const d = D();
    E.R = analyze(tab, d);
    render();
    if (light) return;
    syncTool(); renderProps(); renderHeat(E.R); renderForm(); renderBom(E.R);
    const items = opt.check(E.R, d, E);
    renderChk(items);
    E.items = items;
    if (opt.after) opt.after(E.R, d, items);
    if (save) saveAll();
  };

  /* ---------- toolbar ---------- */
  root.addEventListener('change', e => { const c = e.target.dataset.c; if (!c || E.demo) return; D()[c] = e.target.value; E.update(true);
    if (c === 'enc') E.say(`الغلاف الآن ${encName(ENCI[D().enc])} mm.`, ''); });
  let resetArm = 0;
  IL.onAct($('.ed-tool', root), '[data-a]', b => {
    const a = b.dataset.a; if (E.demo) return;
    if (a === 'zoom'){ E.zoom = E.zoom === 1 ? 2 : E.zoom === 2 ? 4 : 1; syncTool(); }
    else if (a === 'heat'){ E.heat = !E.heat; E.update(false); }
    else if (a === 'reset'){
      if (Date.now() - resetArm > 3000){ resetArm = Date.now(); b.textContent = 'اضغط مرة أخرى للتأكيد'; setTimeout(() => { b.textContent = 'ابدأ من جديد'; }, 3000); return; }
      resetArm = 0; b.textContent = 'ابدأ من جديد'; ST[tab] = fresh(tab); E.sel = null; E.update(true); if (opt.onReset) opt.onReset(); E.say('بدأ التصميم من جديد.', '');
    }
  });

  /* ---------- palette: drag, or tap then tap ---------- */
  const pt = ev => { const m = svg.getScreenCTM(); if (!m) return {x:0, y:0}; const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse()); return {x:p.x, y:p.y}; };
  E.pt = pt;
  function disarm(){ E.arm = null; $$('[aria-pressed="true"][data-k],[data-chip][aria-pressed="true"]', host).forEach(b => b.setAttribute('aria-pressed', 'false')); }
  E.disarm = disarm;
  let pd = null, ghost = null, justDragged = false;
  E.srcDown = (ev, src, el) => { if (E.demo || ev.button > 0) return; pd = {src, x:ev.clientX, y:ev.clientY, drag:false, id:ev.pointerId, el}; try { el.setPointerCapture(ev.pointerId); } catch (er){} };
  E.srcMove = ev => {
    if (!pd || ev.pointerId !== pd.id) return;
    if (!pd.drag && Math.hypot(ev.clientX - pd.x, ev.clientY - pd.y) > 8){ pd.drag = true; disarm(); ghost = document.createElement('div'); ghost.className = 'pd-ghost'; ghost.innerHTML = icon(pd.src.k, pd.src.o); document.body.appendChild(ghost); }
    if (pd.drag){ ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; ev.preventDefault(); }
  };
  E.srcUp = (ev, cancel) => {
    if (!pd || ev.pointerId !== pd.id) return;
    const st = pd; pd = null; if (ghost){ ghost.remove(); ghost = null; }
    if (!st.drag) return;
    justDragged = true; setTimeout(() => { justDragged = false; }, 400);
    if (cancel) return;
    const r = wrap.getBoundingClientRect();
    if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) E.place(st.src.k, st.src.o, pt(ev));
    else E.say('أفلت المكوّن فوق اللوحة لوضعه.', '');
  };
  E.srcClick = (ev, src, el) => {
    if (E.demo) return;
    if (justDragged){ justDragged = false; return; }
    if (E.arm && E.arm.el === el){ disarm(); E.say('', ''); render(); return; }
    disarm(); E.arm = Object.assign({el}, src); el.setAttribute('aria-pressed', 'true'); render();
    E.say(`انقر مكانًا على اللوحة لوضع ${src.n || K[src.k].a}.`, '');
  };
  const palSrc = el => ({k:el.dataset.k, o:null});
  pal.addEventListener('pointerdown', ev => { const b = ev.target.closest('[data-k]'); if (b) E.srcDown(ev, palSrc(b), b); });
  pal.addEventListener('pointermove', E.srcMove);
  pal.addEventListener('pointerup', ev => E.srcUp(ev, false));
  pal.addEventListener('pointercancel', ev => E.srcUp(ev, true));
  pal.addEventListener('click', ev => { const b = ev.target.closest('[data-k]'); if (b) E.srcClick(ev, palSrc(b), b); });

  /* ---------- canvas: select, move, resize, pan ---------- */
  let drag = null;
  svg.addEventListener('pointerdown', ev => {
    if (E.demo || ev.button > 0) return;
    const p = pt(ev);
    if (E.arm){ const a = E.arm; disarm(); E.place(a.k, a.o, p); if (a.after) a.after(); return; }
    const hd = ev.target.closest('[data-h]'), sp = find(E.sel);
    if (hd && sp){ drag = {m:'rs', p0:p, L:sp.o.L, moved:false}; }
    else {
      const g = ev.target.closest('[data-id]');
      if (g){ if (E.sel !== g.dataset.id){ E.sel = g.dataset.id; E.update(false); } const t = find(E.sel); drag = {m:'mv', p0:p, o:{x:t.x, y:t.y}, moved:false}; }
      else { if (E.sel){ E.sel = null; E.update(false); } if (E.zoom > 1) drag = {m:'pan', cx:ev.clientX, cy:ev.clientY, sl:wrap.scrollLeft, st:wrap.scrollTop}; }
    }
    if (drag){ try { svg.setPointerCapture(ev.pointerId); } catch (er){} ev.preventDefault(); }
    svg.focus({preventScroll:true});
  });
  svg.addEventListener('pointermove', ev => {
    if (!drag) return;
    if (drag.m === 'pan'){ wrap.scrollLeft = drag.sl - (ev.clientX - drag.cx); wrap.scrollTop = drag.st - (ev.clientY - drag.cy); return; }
    const it = find(E.sel); if (!it) return;
    const p = pt(ev), dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    if (drag.m === 'mv'){ it.x = drag.o.x + dx; it.y = drag.o.y + dy; snapPart(it, false); }
    else { const k = K[it.k].len, hz = k === 'w' || (k === 'r' && !it.o.rot); it.o.L = clamp(snap(drag.L + (hz ? dx : dy)), 60, 4000); }
    E.update(false, true);
  });
  const endDrag = () => { if (!drag) return; const mv = drag.moved; drag = null; if (mv) E.update(true); };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', () => { drag = null; E.update(false); });
  svg.addEventListener('keydown', ev => {
    if (E.demo) return; const it = find(E.sel); if (!it) return;
    if (ev.key === 'Delete' || ev.key === 'Backspace'){ ev.preventDefault(); E.del(it); return; }
    const mv = {ArrowLeft:[-SN, 0], ArrowRight:[SN, 0], ArrowUp:[0, -SN], ArrowDown:[0, SN]}[ev.key];
    if (mv){ ev.preventDefault(); it.x += mv[0]; it.y += mv[1]; snapPart(it, false); E.update(true); }
  });
  return E;
}

/* =====================================================================
   page shell: tabs, goals, demo helpers
   ===================================================================== */
const tabsEl = $('#tabs'), panes = $('#panes'), G = {}, BUILD = {}, EDS = {};
let DEMO = 0, CUR = null;
TABS.forEach(tb => {
  const b = document.createElement('button'); b.className = 'btn' + (IL.has(tb.l, 'sim') ? ' done' : ''); b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = tb.t; b.dataset.id = tb.id;
  b.addEventListener('click', () => show(tb.id)); tabsEl.appendChild(b);
  const p = document.createElement('section'); p.className = 'pane'; p.id = 'p-' + tb.id; p.setAttribute('role', 'tabpanel');
  p.innerHTML = `<h2 style="margin:0 0 8px">${esc(tb.h)}</h2><div class="goal${IL.has(tb.l, 'sim') ? ' ok' : ''}" id="g-${tb.id}"><b class="k">${IL.has(tb.l, 'sim') ? '✓ أُنجز' : 'المطلوب'}</b>${esc(tb.goal)}</div><div class="body"></div>`;
  panes.appendChild(p); G[tb.id] = tb;
});
function show(id){
  if (!G[id]) id = 'layout';
  CUR = id;
  $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + id));
  $$('#tabs .btn').forEach(b => b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false'));
  if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  if (!G[id].built){ G[id].built = true; BUILD[id]($('#p-' + id + ' .body')); }
}
function win(id, msg){
  if (DEMO) return false;
  const tb = G[id]; if (tb.won) return false; tb.won = true; IL.mark(tb.l, 'sim');
  const g = $('#g-' + id); g.classList.add('ok'); g.innerHTML = `<b class="k">✓ أُنجز</b>${esc(msg || tb.goal)}`;
  $(`#tabs .btn[data-id="${id}"]`).classList.add('done');
  return true;
}
const DEMO_BAR = '<div class="row demo-r keep"><button type="button" class="btn demo-b keep">▶ شاهد الحل</button><p class="msg demo-m keep" aria-live="polite"></p></div>';
async function hl(el, ms){ if (!el) return; el.classList.add('dhl'); if (el.scrollIntoView) el.scrollIntoView({block:'nearest', behavior:'smooth'}); await sleep(ms || 420); el.classList.remove('dhl'); }
/* «▶ شاهد الحل»: builds the solution on the real editor, then gives the learner's own design back */
function demo(host, id, E, run, after){
  const b = $('.demo-b', host), m = $('.demo-m', host);
  b.addEventListener('click', async () => {
    if (DEMO) return;
    const snap = clone(ST[id]);
    DEMO++; b.disabled = true; E.demo = true; E.root.classList.add('busy'); E.disarm(); E.sel = null;
    ST[id] = fresh(id); E.update(false);
    try { await run(m); m.textContent = 'اكتمل الحل: قائمة التحقق خضراء. سيُعاد تصميمك بعد لحظات.'; await sleep(2600); }
    catch (e){ console.warn(e); }
    finally { ST[id] = snap; E.demo = false; DEMO--; E.root.classList.remove('busy'); b.disabled = false; E.sel = null; E.update(false); if (after) after(); m.textContent = 'انتهى العرض وأُعيد تصميمك كما كان: نفّذه الآن بنفسك ليُحتسب.'; m.className = 'msg demo-m'; }
  });
}
/* run a solution: settings, then parts one by one */
async function playSol(E, tab, sol, m, extra){
  const d = ST[tab];
  for (const c of ['enc', 'ip', 'entry', 'form']){ const s = $(`[data-c="${c}"]`, E.root); s.value = sol[c]; await hl(s, 300); d[c] = sol[c]; E.update(false); }
  if (extra) await extra();
  for (const st of sol.steps){
    if (st.say){ m.textContent = 'العرض: ' + st.say; await sleep(500); continue; }
    if (st.fn){ await st.fn(); continue; }
    const pal = $(`.pal-i[data-k="${st[0]}"]`, E.root); if (pal){ pal.classList.add('dhl'); }
    E.place(st[0], st[3], {x:st[1], y:st[2]}, true, true); E.sel = null;
    await sleep(170); if (pal) pal.classList.remove('dhl');
  }
  E.update(false);
}
const onRail = (ry, h) => ry + 17.5 - h / 2;

/* =====================================================================
   TAB 1 · layout (l10): lighting / AC distribution board
   ===================================================================== */
BUILD.layout = host => {
  host.innerHTML = `<p class="note">لوحة الإنارة ${L('LTG DB')} تتغذى من الـ ${L('MDB')} بقاطع ${L('100 A')}، و ${L('Ib = 69.6 A')} (الطور الأكثر تحميلًا)، و ${L('Ir = 80 A')}. المنطقة مُغبرة، والكابل يدخل من أعلى. المخارج ${L('MCB 3P C16')} محمّلة بنحو ${L('70 %')}.</p>` + DEMO_BAR;
  const E = makeEditor('layout', host, {check:(R, D) => {
    const ps = D.parts, cnt = k => ps.filter(p => p.k === k).length;
    const inc = ps.filter(p => p.k === 'mccb' && p.o.ty === 'TM');
    const need = [];
    if (!inc.length) need.push('أضف قاطع الدخول MCCB 100 A.'); else if (inc.length > 1) need.push('قاطع دخول واحد فقط: احذف الـ MCCB الزائد.'); else if (inc[0].o.In !== 100) need.push(`قاطع الدخول ${inc[0].o.In} A: اختر 100 A حسب حساب المغذّي.`);
    if (cnt('mcb') < 12) need.push(`ينقص ${12 - cnt('mcb')} قاطع MCB من 12.`);
    if (!ps.some(p => p.k === 'rccb' && p.o.dn === 300)) need.push('أضف RCCB بحساسية 300 mA للحماية من الحريق.');
    if (!ps.some(p => p.k === 'rccb' && p.o.dn === 30)) need.push('أضف RCCB بحساسية 30 mA لدوائر المقابس.');
    if (cnt('em') < 1) need.push('أضف عدّاد الطاقة.');
    if (cnt('ct') < 3) need.push(`ينقص ${3 - cnt('ct')} محوّل تيار CT للعدّاد.`);
    if (cnt('spd') < 1) need.push('أضف واقي الصواعق SPD.');
    const it = [
      {ok:D.ip === 'IP54' || D.ip === 'IP65', t:`الغلاف ${L(D.ip)} يمنع الغبار (IP5X على الأقل)`, why:`${D.ip} لا يمنع دخول الغبار: اختر IP54.`},
      {ok:!need.length, t:`المكونات: ${L('MCCB 100 A')} و 12 ${L('MCB')} و ${L('RCCB 300 / 30 mA')} وعدّاد مع 3 ${L('CT')} و ${L('SPD')}`, why:need[0]},
      ...genItems(R, D),
      {ok:!!R.inc && !R.cat.entry && !R.cat.ct, t:'قاطع الدخول جهة دخول الكابل، ومحولات التيار قربه', why:(R.cat.entry || R.cat.ct || ['أضف قاطع الدخول.'])[0]},
      {ok:D.form === '2b', t:`شكل الفصل ${L('Form 2b')}`, why:`اخترت Form ${D.form}: لوحة التوزيع الفرعية هنا Form 2b.`},
      heatItem(R)
    ];
    return it;
  }, after:(R, D, items) => { if (!E || E.demo) return; if (items.every(i => i.ok) && win('layout', 'لوحة الإنارة مكتملة: المكونات والترتيب و IP54 و Form 2b والحرارة كلها سليمة ✓')) E.say('✓ قائمة التحقق كلها خضراء.', 'ok'); }});
  EDS.layout = E; E.update(false);
  const C = (k, x, y, o) => [k, x, y, o];
  const steps = [{say:'الدخول من أعلى: قاطع الدخول ومحولات التيار في الأعلى.'},
    C('mccb', 80, 100, {In:100, ty:'TM'}), C('ct', 210, 120, {r:100}), C('ct', 270, 120, {r:100}), C('ct', 330, 120, {r:100}),
    {say:'قضيبا DIN بين ثلاثة مجاري أسلاك، مع 20–120 mm للانحناء.'},
    C('duct', 60, 290, {L:680, b:60}), C('rail', 60, 400, {L:680}), C('duct', 60, 490, {L:680, b:60}), C('rail', 60, 620, {L:680}), C('duct', 60, 710, {L:680, b:60}),
    {say:'الصف الأول: RCCB 300 mA وستة MCB ثم العدّاد والـ SPD.'},
    C('rccb', 70, onRail(400, 85), {p:4, In:63, dn:300})];
  for (let i = 0; i < 6; i++) steps.push(C('mcb', 142 + i * 54, onRail(400, 85), {p:3, c:'C', In:16}));
  steps.push(C('em', 486, onRail(400, 90), {}), C('spd', 578, onRail(400, 90), {}), {say:'الصف الثاني: RCCB 30 mA للمقابس وستة MCB.'}, C('rccb', 70, onRail(620, 85), {p:4, In:63, dn:30}));
  for (let i = 0; i < 6; i++) steps.push(C('mcb', 142 + i * 54, onRail(620, 85), {p:3, c:'C', In:16}));
  steps.push({say:'أطراف المخارج على قضيب ثالث بين مجريين.'}, C('rail', 60, 840, {L:680}), C('term', 70, onRail(840, 50), {n:20, s:4}), C('term', 210, onRail(840, 50), {n:20, s:4}), C('duct', 60, 920, {L:680, b:60}));
  const SOL = {enc:'w80120', ip:'IP54', entry:'top', form:'2b', steps};
  IL._pd = IL._pd || {}; IL._pd.layout = SOL;
  demo(host, 'layout', E, m => playSol(E, 'layout', SOL, m));
};

/* =====================================================================
   TAB 2 · mcc (l11): four Type 2 feeders, Form 4b
   ===================================================================== */
function fdState(m, D, R){
  const st = MOT[m].st, c = D.fe[m] || {}, row = coordRow(m)[2], fl = FLD[st];
  const parts = D.parts.filter(p => p.o.f === m);
  const res = {fields:{}, why:'', ok:false};
  fl.forEach(f => { const v = c[f], placed = parts.some(p => p.o.role === f); res.fields[f] = !v ? 'no' : v !== row[f] ? 'bad' : (fPart(f, v) && !placed) ? 'sel' : 'ok'; });
  const miss = fl.find(f => !c[f]), wrong = fl.find(f => c[f] && c[f] !== row[f]);
  if (miss){ res.why = `اختر ${FLN[miss]} من جدول التنسيق.`; return res; }
  if (wrong){ res.why = `جدول Type 2 لـ ${MOT[m].kW} kW (${STN[st]}): ${FLN[wrong]} = ${fTxt(wrong, row[wrong])}.`; return res; }
  const np = fl.find(f => fPart(f, c[f]) && !parts.some(p => p.o.role === f));
  if (np){ res.why = `ضع ${FLN[np]} (${fTxt(np, c[np])}) في مقصورة ${m}.`; return res; }
  const pi = parts.find(p => R.iss.has(p.id)); if (pi){ res.why = R.iss.get(pi.id)[0]; return res; }
  const cs = parts.map(p => R.comp(p));
  if (cs.includes(null)){ res.why = `جهاز من ${m} يعبر حاجزًا: اجعله داخل مقصورة واحدة.`; return res; }
  if (new Set(cs).size > 1){ res.why = `أجهزة ${m} موزّعة على أكثر من مقصورة: اجمعها في مقصورة واحدة.`; return res; }
  const other = D.parts.find(p => p.o.f && p.o.f !== m && R.comp(p) === cs[0]);
  if (other){ res.why = `${m} و ${other.o.f} في مقصورة واحدة: افصل بينهما بحاجز أفقي.`; return res; }
  res.ok = true; return res;
}
function fdDiag(m, s, D){
  const st = MOT[m].st, c = D.fe[m] || {};
  const cls = f => 'dg-e st-' + (s.fields[f] || 'no');
  const lab = (f, x, y) => `<text x="${x}" y="${y}" class="dg-t">${esc(fTxt(f, c[f]))}</text>`;
  const cb = (f, y, fuse) => `<g class="${cls(f)}">${fuse ? `<rect x="54" y="${y - 14}" width="12" height="28" rx="2" class="dg-s"/>` : `<path d="M60 ${y - 16}V${y - 8}M60 ${y - 8}L70 ${y + 10}M60 ${y + 12}V${y + 16}M56 ${y - 12}l8 8M64 ${y - 12}l-8 8" class="dg-s"/>`}${lab(f, 76, y + 4)}</g>`;
  const km = (f, y, x, t) => `<g class="${cls(f)}"><path d="M${x} ${y - 16}V${y - 8}M${x} ${y - 8}L${x + 10} ${y + 10}M${x} ${y + 12}V${y + 16}" class="dg-s"/><path d="M${x - 4} ${y - 8}a4 4 0 0 1 8 0" class="dg-s"/>${t ? `<text x="${x + 14}" y="${y - 6}" class="dg-t s">${t}</text>` : ''}${lab(f, x + 14, y + 8)}</g>`;
  const box = (f, y, t, x) => `<g class="${cls(f)}"><rect x="${(x || 60) - 18}" y="${y - 13}" width="36" height="26" rx="3" class="dg-s"/><text x="${x || 60}" y="${y + 4}" class="dg-t c" text-anchor="middle">${t}</text>${lab(f, (x || 60) + 24, y + 4)}</g>`;
  const ol = y => c.ol === 'int' ? `<text x="76" y="${y + 4}" class="dg-t s">OL ${st === 'dol' ? 'في MPCB' : 'مدمج'}</text>` : `<g class="${cls('ol')}"><rect x="52" y="${y - 10}" width="16" height="20" class="dg-s"/><path d="M56 ${y - 6}l8 4l-8 4l8 4" class="dg-s"/>${lab('ol', 76, y + 4)}</g>`;
  const mot = (y, x) => `<circle cx="${x || 60}" cy="${y}" r="17" class="dg-m"/><text x="${x || 60}" y="${y + 4}" class="dg-t c" text-anchor="middle">M 3~</text>`;
  let g = '<path d="M10 10H160" class="dg-bus"/><path d="M60 10V24" class="dg-w"/>';
  if (st === 'dol') g += cb('scpd', 40, false) + '<path d="M60 56V79" class="dg-w"/>' + km('km1', 95, 60) + '<path d="M60 111V128" class="dg-w"/>' + ol(140) + '<path d="M60 152V178" class="dg-w"/>' + mot(195);
  else if (st === 'sd') g += cb('scpd', 40, false) + '<path d="M60 56V74M60 64H130V100" class="dg-w"/>' + km('km1', 90, 60, 'KM1') + km('km2', 116, 130, 'KM2') + '<path d="M60 106V120" class="dg-w"/>' + ol(130) + '<path d="M60 140V183M130 132V195H77" class="dg-w"/>' + mot(200) + km('km3', 220, 130, 'Y') + '<path d="M130 236V238" class="dg-w"/>';
  else if (st === 'ss') g += cb('scpd', 40, true) + '<path d="M60 54V74" class="dg-w"/>' + km('km1', 90, 60) + '<path d="M60 106V132" class="dg-w"/>' + box('ss', 145, 'SS') + '<path d="M60 158V183" class="dg-w"/>' + mot(200);
  else g += cb('scpd', 35, false) + '<path d="M60 51V68" class="dg-w"/>' + `<g class="${cls('lr')}"><path d="M60 68a5 5 0 0 1 0 8a5 5 0 0 1 0 8a5 5 0 0 1 0 8" class="dg-s"/>${lab('lr', 76, 84)}</g>` + '<path d="M60 92V107" class="dg-w"/>' + box('emc', 120, 'EMC') + '<path d="M60 133V147" class="dg-w"/>' + box('vfd', 160, '≈/≈') + '<path d="M60 173V193" class="dg-w"/>' + mot(210);
  return `<svg viewBox="0 0 170 245" width="170" height="245" class="dg" aria-label="مخطط القدرة للمخرج ${m}">${g}</svg>`;
}
BUILD.mcc = host => {
  host.innerHTML = `<p class="note">لوحة المحركات تتغذى بقاطع ${L('MCCB 400 A')} من الـ ${L('MDB')} (${L('Ib = 346.1 A')}). اختر مكونات كل مخرج من جدول التنسيق ${L('Type 2')}، ثم اسحب أزرار «ضع» إلى المقصورة. الحواجز الأفقية تصنع المقصورات.</p>` + DEMO_BAR;
  let E = null;
  const ex = document.createElement('div'); ex.className = 'fds';
  const feeders = () => Object.keys(MOT).map(m => { const M = MOT[m], st = M.st;
    return `<div class="fd" data-m="${m}"><h4>${m} · ${esc(M.a)} ${L(M.kW + ' kW')} <small>${esc(STN[st])} · ${L('Ib ' + fmt(M.Ib, 1) + ' A')}</small></h4><div class="fd-b"><div class="fd-d"></div><div class="fd-f">${FLD[st].map(f => `<label><span>${esc(FLN[f])}</span><span class="fd-c"><select data-fe="${m}:${f}" dir="ltr"><option value="">—</option>${FOPT[f].filter(v => f !== 'ol' || v !== 'int' || st !== 'vfd').map(v => `<option value="${esc(v)}">${esc(fTxt(f, v))}</option>`).join('')}</select><button type="button" class="btn chip" data-chip="${m}:${f}" aria-pressed="false">ضع</button></span></label>`).join('')}</div></div><p class="fd-s"></p></div>`; }).join('');
  const ctab = () => ['dol', 'sd', 'ss', 'vfd'].map(st => { const fl = FLD[st]; return `<div><h4>${esc(STN[st])}</h4><div class="tblw"><table class="tbl hm ct"><thead><tr><th>kW</th><th>In A</th>${fl.map(f => `<th>${({scpd:'SCPD', km1:'KM1', km2:'KM2', km3:'KM3', ol:'OL', ss:'SS', vfd:'VFD', lr:'Reactor', emc:'EMC'})[f]}</th>`).join('')}</tr></thead><tbody>${COORD[st].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td>${fl.map(f => `<td>${esc(fTxt(f, r[2][f]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`; }).join('');
  ex.innerHTML = `<div class="panel"><h3>مخارج المحركات</h3><div class="fd-g">${feeders()}</div></div><details class="panel ctw" open><summary><b>جدول التنسيق Type 2</b> <small>${L('400 V · 36 kA')} · قيم نموذجية للتعلّم</small></summary><div class="ct-g">${ctab()}</div><p class="note">${L('Type 2')}: بعد القصر يعود المشغّل للعمل دون تلف (لحام خفيف لتلامسات الكونتاكتور مقبول إذا فُصلت بسهولة). البادئ الناعم يحتاج مصاهر ${L('aR')} لتحقيق ${L('Type 2')}. في ستار دلتا: ${L('KM1 = KM2 ≥ In/√3')}، و ${L('KM3 ≥ In/3')}، و ${L('OL')} على ${L('In/√3')}.</p></details>`;
  E = makeEditor('mcc', host, {check:(R, D) => {
    const bus = D.parts.find(p => p.k === 'bus');
    const bi = bus ? BUSI[bus.o.sz].I * KBUS : 0;
    const it = [{ok:!!bus && bi >= 400, t:`البارات الرئيسية تحمل ${L('≥ 400 A')} داخل اللوحة`, why:!bus ? 'أضف البارات الرئيسية أعلى اللوحة.' : `البار ${busTxt(bus.o.sz)} يحمل ${fmt(bi, 0)} A داخل اللوحة < 400 A: اختر مقطعًا أكبر.`}];
    Object.keys(MOT).forEach(m => { const s = fdState(m, D, R); it.push({ok:s.ok, t:`${m} · ${esc(MOT[m].a)} ${L(MOT[m].kW + ' kW')} ${esc(STN[MOT[m].st])}: مكونات Type 2 في مقصورتها`, why:s.why}); });
    it.push(...genItems(R, D));
    it.push({ok:D.form === '4b', t:`شكل الفصل ${L('Form 4b')}`, why:`اخترت Form ${D.form}: لوحة MCC هنا Form 4b.`});
    it.push(heatItem(R));
    return it;
  }, after:(R, D, items) => { renderFd(R, D); if (!E || E.demo) return; if (items.every(i => i.ok) && win('mcc', 'المخارج الأربعة صحيحة بتنسيق Type 2، كلٌّ في مقصورته، والحرارة مقبولة ✓')) E.say('✓ قائمة التحقق كلها خضراء.', 'ok'); }});
  E.x.appendChild(ex); EDS.mcc = E;
  function renderFd(R, D){
    if (!ex.isConnected && !E) return;
    Object.keys(MOT).forEach(m => {
      const card = $(`.fd[data-m="${m}"]`, ex); if (!card) return;
      const s = fdState(m, D, R), c = D.fe[m] || {};
      $('.fd-d', card).innerHTML = fdDiag(m, s, D);
      FLD[MOT[m].st].forEach(f => { const sel = $(`[data-fe="${m}:${f}"]`, card); if (sel.value !== (c[f] || '')) sel.value = c[f] || ''; sel.className = s.fields[f] === 'bad' ? 'bad' : s.fields[f] === 'no' ? '' : 'good';
        const ch = $(`[data-chip="${m}:${f}"]`, card), pp = fPart(f, c[f]), placed = D.parts.some(p => p.o.f === m && p.o.role === f);
        ch.disabled = !pp; ch.classList.toggle('placed', placed); ch.textContent = !pp ? (c[f] === 'int' ? 'مدمج' : 'ضع') : placed ? '✓ مكانه' : 'ضع'; });
      const st = $('.fd-s', card); st.className = 'fd-s ' + (s.ok ? 'ok' : ''); st.textContent = s.ok ? '✓ المخرج سليم.' : s.why;
    });
  }
  ex.addEventListener('change', e => {
    const t = e.target.closest('[data-fe]'); if (!t || E.demo) return;
    const [m, f] = t.dataset.fe.split(':'), D = ST.mcc; D.fe[m] = D.fe[m] || {}; D.fe[m][f] = t.value;
    const p = D.parts.find(q => q.o.f === m && q.o.role === f), np = fPart(f, t.value);
    if (p){ if (!np) E.del(p); else { p.k = np.k; p.o = Object.assign({}, K[np.k].def, np.o, {f:m, role:f}); } }
    E.update(true);
  });
  const chipSrc = el => { const [m, f] = el.dataset.chip.split(':'), c = ST.mcc.fe[m] || {}, np = fPart(f, c[f]); return np ? {k:np.k, o:Object.assign({}, np.o, {f:m, role:f}), n:`${FLN[f]} ${fTxt(f, c[f])}`} : null; };
  const placedPart = el => { const [m, f] = el.dataset.chip.split(':'); return ST.mcc.parts.find(p => p.o.f === m && p.o.role === f); };
  ex.addEventListener('pointerdown', ev => { const b = ev.target.closest('[data-chip]'); if (!b || b.disabled || placedPart(b)) return; const s = chipSrc(b); if (s) E.srcDown(ev, s, b); });
  ex.addEventListener('pointermove', E.srcMove);
  ex.addEventListener('pointerup', ev => E.srcUp(ev, false));
  ex.addEventListener('pointercancel', ev => E.srcUp(ev, true));
  ex.addEventListener('click', ev => { const b = ev.target.closest('[data-chip]'); if (!b || b.disabled || E.demo) return; const pp = placedPart(b);
    if (pp){ E.sel = pp.id; E.update(false); E.say(`حُدّد ${LI(lbl(pp))} على اللوحة.`, ''); E.svg.scrollIntoView({block:'nearest', behavior:'smooth'}); return; }
    const s = chipSrc(b); if (s){ E.srcClick(ev, s, b); if (E.arm && innerWidth < 1100) E.svg.scrollIntoView({block:'center', behavior:'smooth'}); } });
  E.update(false);
  /* solution */
  const C = (k, x, y, o) => [k, x, y, o];
  const fe = {M1:{scpd:'MPCB 24–32', km1:'32', ol:'int'}, M2:{scpd:'MA 100', km1:'40', km2:'40', km3:'25', ol:'37–50'}, M3:{scpd:'aR 160', km1:'80', ss:'79'}, M4:{scpd:'TM 160', vfd:'75', lr:'150', emc:'150'}};
  const F = (m, f, x, y) => { const np = fPart(f, fe[m][f]); return [np.k, x, y, Object.assign({}, np.o, {f:m, role:f})]; };
  const steps = [{say:'البارات الرئيسية 40×10 أعلى القسمين، وحاجز تحتها.'}, C('bus', 60, 120, {L:1680, sz:'40x10'}), C('bar', 60, 300, {}),
    {say:'M1 · DOL: MPCB 24–32 A وكونتاكتور 32 A على قضيب بين مجريين.'}, C('duct', 60, 370, {L:680, b:60}), C('rail', 60, 480, {L:680}), F('M1', 'scpd', 100, onRail(480, 90)), F('M1', 'km1', 160, onRail(480, 85)), C('duct', 60, 570, {L:680, b:60}), C('bar', 60, 700, {}),
    {say:'M2 · ستار دلتا: MCCB-MA 100 A، و KM1 = KM2 = 40 A، و KM3 = 25 A، و OL 37–50 A أسفل KM1.'}, F('M2', 'scpd', 80, 760), C('duct', 200, 920, {L:540, b:40}), C('rail', 200, 1040, {L:540}), F('M2', 'km1', 220, onRail(1040, 120)), F('M2', 'ol', 220, onRail(1040, 120) + 120), F('M2', 'km2', 285, onRail(1040, 120)), F('M2', 'km3', 350, onRail(1040, 85)), C('duct', 60, 1220, {L:680, b:40}), C('bar', 60, 1290, {}),
    {say:'M3 · بادئ ناعم: مصاهر aR 160 A، وكونتاكتور 80 A، وبادئ 79 A مع 100 mm فوقه وتحته.'}, C('duct', 60, 1300, {L:480, b:40}), F('M3', 'scpd', 80, 1340), C('rail', 200, 1440, {L:300}), F('M3', 'km1', 230, onRail(1440, 125)), C('duct', 60, 1550, {L:480, b:40}), F('M3', 'ss', 560, 1360),
    {say:'M4 · VFD 75 kW في قسمه: MCCB 160 A ومرشّح EMC وملف خط، والثقيل في الأسفل.'}, F('M4', 'scpd', 900, 330), F('M4', 'emc', 1100, 330), F('M4', 'vfd', 900, 1000), F('M4', 'lr', 1350, 1620),
    {say:'مفقود الـ VFD نحو 2250 W: مروحة 550 m³/h في الأسفل وفلتر خروج في الأعلى.'}, C('fan', 1380, 1200, {V:550}), C('grille', 1380, 350, {V:550})];
  const SOL = {enc:'m2', ip:'IP54', entry:'bottom', form:'4b', fe, steps};
  IL._pd = IL._pd || {}; IL._pd.mcc = SOL;
  demo(host, 'mcc', E, m => playSol(E, 'mcc', SOL, m, async () => {
    for (const mm of Object.keys(fe)) for (const f of Object.keys(fe[mm])){ const s = $(`[data-fe="${mm}:${f}"]`, ex); s.value = fe[mm][f]; ST.mcc.fe[mm] = ST.mcc.fe[mm] || {}; ST.mcc.fe[mm][f] = fe[mm][f]; await hl(s, 160); E.update(false); }
  }));
};

/* =====================================================================
   TAB 3 · project (l12): the factory MDB + routine tests (IEC 61439-2)
   ===================================================================== */
const PFCK = ['cap', 'capk', 'dr', 'pfcr'];
function mdbItems(R, D){
  const ps = D.parts, P = R.P, e = ENCI[D.enc], it = [];
  it.push({ok:e.kind === 'floor' && e.secs.length >= 3, t:'تجميعة أرضية متعددة الأقسام (3 أقسام على الأقل)', why:`الغلاف ${encName(e)} لا يكفي: اختر غلافًا أرضيًّا متعدد الأقسام.`});
  const acb = ps.filter(p => p.k === 'acb');
  it.push({ok:acb.length === 1 && acb[0].o.In === 1600 && !R.cat.entry, t:`قاطع الدخول ${L('ACB 1600 A')} جهة دخول الكابلات`, why:!acb.length ? 'أضف قاطع الدخول ACB 1600 A.' : acb.length > 1 ? 'قاطع دخول واحد فقط.' : acb[0].o.In !== 1600 ? `ACB ${acb[0].o.In} A: الحساب يعطي 1443 A للمحوّل، فاختر 1600 A.` : (R.cat.entry || [''])[0]});
  /* busbars */
  const bus = ps.find(p => p.k === 'bus'), drops = ps.filter(p => p.k === 'drop');
  let bw = '';
  if (!bus) bw = 'أضف البارات الرئيسية أعلى الأقسام.';
  else if (BUSI[bus.o.sz].I * KBUS < 1600) bw = `البار ${busTxt(bus.o.sz)} يحمل ${fmt(BUSI[bus.o.sz].I * KBUS, 0)} A داخل اللوحة < 1600 A: اختر مقطعًا أكبر.`;
  else {
    const bb0 = bb(bus);
    const secs = new Set(ps.filter(p => p.k === 'mccb' || p.k === 'acb').map(p => R.sec(p)));
    for (const si of secs){ const s = P[si]; if (bb0.x > s.x + 20 || bb0.x2 < s.x + s.w - 20){ bw = `البارات الرئيسية لا تمتد عبر القسم S${si + 1}.`; break; }
      const dd = drops.filter(d => R.sec(d) === si); if (!dd.length){ bw = `القسم S${si + 1} بلا بارات نازلة: أضف Dropper.`; break; }
      const d = dd[0], b = bb(d);
      if (!(b.y <= bb0.y2 + 5 && b.y2 > bb0.y2 && b.x < bb0.x2 && b.x2 > bb0.x)){ bw = `البارات النازلة في S${si + 1} غير متصلة بالبارات الرئيسية: ألصق أعلاها بها.`; break; }
      const inc = R.inc && R.sec(R.inc) === si, I = inc ? TC.project.incIb : ps.filter(q => q.k === 'mccb' && R.sec(q) === si).reduce((a, q) => a + (ibOf(q, 'project', D, R.inc) || 0), 0);
      if (BUSI[d.o.sz].I * KBUS < I){ bw = `البارات النازلة في S${si + 1} تحمل ${fmt(BUSI[d.o.sz].I * KBUS, 0)} A < ${fmt(I, 0)} A: اختر مقطعًا أكبر.`; break; } }
  }
  it.push({ok:!bw, t:'البارات الرئيسية والنازلة: الاتصال والمقطع', why:bw});
  /* outgoing feeders */
  let fw = '', nf = 0;
  for (const f of FD){ const xs = ps.filter(p => p.k === 'mccb' && p.o.fd === f.id);
    if (!xs.length){ if (!fw) fw = `لم يُعيَّن مخرج «${f.a}» لأي MCCB: اختره من الخصائص.`; continue; }
    if (xs.length > 1){ if (!fw) fw = `مخرج «${f.a}» معيَّن لأكثر من MCCB.`; continue; }
    if (xs[0].o.In !== f.In || xs[0].o.ty !== 'TM'){ if (!fw) fw = `MCCB مخرج «${f.a}» يجب أن يكون ${f.In} A TM.`; continue; }
    nf++; }
  it.push({ok:nf === 6 && !fw, t:`المخارج الستة حسب الجدول (${nf}/6)`, why:fw});
  const ct = ps.filter(p => p.k === 'ct').length;
  it.push({ok:ps.some(p => p.k === 'pm') && ct >= 3 && !R.cat.ct, t:`القياس: جهاز متعدد على الباب و 3 ${L('CT')} قرب الـ ACB`, why:!ps.some(p => p.k === 'pm') ? 'أضف جهاز القياس المتعدد على باب قسم الدخول.' : ct < 3 ? `ينقص ${3 - ct} محوّل تيار CT.` : (R.cat.ct || [''])[0]});
  /* PFC section */
  const pf = ps.filter(p => PFCK.includes(p.k)), n = k => ps.filter(p => p.k === k && (k === 'pfcr' || p.o.Q === 50)).length;
  let pw = '';
  if (n('capk') < 6 || n('cap') < 6 || n('dr') < 6) pw = `قسم المكثفات يحتاج 6 خطوات × 50 kVAR: مكثف + ملف 7 % + كونتاكتور لكل خطوة (الآن ${Math.min(n('capk'), n('cap'), n('dr'))}).`;
  else if (!n('pfcr')) pw = 'أضف منظّم معامل القدرة على باب قسم المكثفات.';
  else { const ss = new Set(pf.filter(p => !isDoor(p)).map(p => R.sec(p))); if (ss.size > 1) pw = 'أجهزة المكثفات موزّعة على أكثر من قسم: اجمعها في قسم واحد.';
    else { const si = [...ss][0]; const o = ps.find(p => R.sec(p) === si && (p.k === 'acb' || p.k === 'mccb' || K[p.k].bus)); if (o) pw = `قسم المكثفات S${si + 1} فيه ${LI(lbl(o))}: افصل المكثفات في قسم مستقل.`; } }
  it.push({ok:!pw, t:`قسم مكثفات منفصل: ${L('6 × 50 kVAR')} مع ملفات ${L('7 %')}`, why:pw});
  it.push(...genItems(R, D));
  /* form 3b: each functional unit in its own compartment */
  let cw = '';
  if (D.form !== '3b') cw = `اخترت Form ${D.form}: لوحة MDB هنا Form 3b.`;
  else { const fu = new Map(); const fus = ps.filter(p => p.k === 'acb' || p.k === 'mccb').map(p => [p, lbl(p) + (p.o.fd ? ' ' + p.o.fd : '')]);
    pf.filter(p => !isDoor(p)).forEach(p => fus.push([p, 'PFC']));
    for (const [p, name] of fus){ const c = R.comp(p); if (c == null){ cw = `${name} يعبر حاجزًا: اجعله داخل مقصورة.`; break; }
      if (fu.has(c) && fu.get(c) !== name){ cw = `${fu.get(c)} و ${name} في مقصورة واحدة: أضف حاجزًا أفقيًّا بينهما.`; break; } fu.set(c, name); } }
  it.push({ok:!cw, t:`${L('Form 3b')}: كل وحدة وظيفية في مقصورة`, why:cw});
  it.push(heatItem(R));
  return it;
}
/* routine tests */
const TQ = [['M12', 'وصلة البارات الرئيسية', 70], ['M10', 'وصلة البارات النازلة', 40], ['M8', 'أطراف MCCB 400 A', 20]];
const PEP = [['door1', 'باب S1'], ['plate', 'لوح التركيب S2'], ['acb', 'هيكل ACB'], ['door4', 'باب S4 (المكثفات)']];
const FNS = [['chg', 'اشحن نابض ACB'], ['cls', 'أغلق ACB'], ['trip', 'اختبار الفصل (Trip test)'], ['pfc', 'اختبار خطوات المنظّم']];
function tDone(T){
  return {vis:(T.vis || []).length === 4, tq:TQ.every(t => T.tq && +T.tq[t[0]] === t[2]) && !!T.tqm, meg:!!(T.meg && T.meg.fix && ['L1', 'L2', 'L3', 'N'].every(k => T.meg.r && T.meg.r[k] >= 1)), die:!!(T.die && T.die.ok), pe:!!(T.pe && PEP.every(p => T.pe.m && T.pe.m[p[0]] != null && T.pe.m[p[0]] <= 0.1)), fn:(T.fn || 0) >= 4};
}
BUILD.project = host => {
  host.innerHTML = `<p class="note">المحوّل ${L('1000 kVA · Uk 6 %')} يعطي ${L('In = 1443 A')} و ${L('Ik ≈ 24 kA')}؛ كل قواطع الـ ${L('MDB')} بقدرة قطع ${L('Icu 36 kA')}. الحمل الأقصى ${L('1060.8 A')}، والبارات ${L('2×(80×10)')}. اختر المخرج لكل ${L('MCCB')} من الخصائص.</p>` + DEMO_BAR;
  let E = null;
  const ex = document.createElement('div');
  ex.innerHTML = `<div class="panel"><h3>جدول مخارج الـ MDB <small>من الحاسبة والدروس</small></h3><div class="tblw"><table class="tbl hm"><thead><tr><th>Feeder</th><th class="ar">المخرج</th><th>MCCB</th><th>Ib A</th><th class="ar">الحالة</th></tr></thead><tbody id="sch"></tbody></table></div></div>
  <div class="panel tests" id="tests"><h3>اختبارات التسليم <small>${L('IEC 61439-2 · routine verification')}</small></h3><div class="tlock note">تُفتح الاختبارات بعد أن تصبح قائمة التحقق للتصميم كلها خضراء.</div><div class="tgrid"></div></div>`;
  const sch = $('#sch', ex), tg = $('.tgrid', ex), tl = $('.tlock', ex);
  let designOk = false;
  E = makeEditor('project', host, {check:(R, D) => mdbItems(R, D), after:(R, D, items) => {
    designOk = items.every(i => i.ok);
    sch.innerHTML = FD.map(f => { const xs = D.parts.filter(p => p.k === 'mccb' && p.o.fd === f.id), ok = xs.length === 1 && xs[0].o.In === f.In; return `<tr><td>Q-${f.id}</td><td class="ar">${esc(f.a)}</td><td>${f.In} A TM</td><td>${fmt(f.Ib, 1)}</td><td class="ar ${ok ? 'ok' : ''}">${ok ? '✓ مُعيَّن' : xs.length ? 'تحقق من القيمة' : '—'}</td></tr>`; }).join('');
    renderTests(); }});
  E.x.appendChild(ex); EDS.project = E;
  const T = () => ST.project.tests;
  let megAnim = null;
  function renderTests(){
    const t = T(), dn = tDone(t), all = Object.values(dn).every(Boolean);
    tl.hidden = designOk; tg.classList.toggle('off', !designOk);
    const st = k => `<span class="pill ${dn[k] ? 'ok' : ''}">${dn[k] ? '✓ ناجح' : 'لم يكتمل'}</span>`;
    const meg = t.meg || {}, mr = meg.r || {};
    const pe = t.pe || {}, pm = pe.m || {};
    tg.innerHTML = `
    <div class="tc"><h4>1. الفحص البصري ${st('vis')}</h4>${['اللوحة التعريفية والعلامات والمخطط داخل الباب', 'درجة IP والحواجز وأغطية البارات كما في التصميم', 'التوصيلات ومقاطعها وألوانها حسب المخطط', 'لا أدوات ولا بقايا أسلاك ولا غبار داخل اللوحة'].map((x, i) => `<label class="cb"><input type="checkbox" data-vis="${i}"${(t.vis || []).includes(i) ? ' checked' : ''}> ${esc(x)}</label>`).join('')}</div>
    <div class="tc"><h4>2. عزم الربط وعلامته ${st('tq')}</h4>${TQ.map(q => `<label>${esc(q[1])} ${L(q[0] + ' 8.8')}<select data-tq="${q[0]}" dir="ltr"><option value="">— Nm</option>${[10, 20, 40, 70, 90].map(v => `<option${t.tq && +t.tq[q[0]] === v ? ' selected' : ''}>${v}</option>`).join('')}</select></label>`).join('')}<button type="button" class="btn" data-t="tqm">ضع علامة العزم</button><p class="tm" id="tq-m"></p></div>
    <div class="tc"><h4>3. مقاومة العزل (Megger) ${st('meg')}</h4>
      <label>جهد الاختبار<select data-mv dir="ltr"><option value="">—</option>${[250, 500, 1000].map(v => `<option${meg.v === v ? ' selected' : ''}>${v}</option>`).join('')}</select> ${L('V DC')}</label>
      <div class="meg">${megSvg(meg.last)}</div>
      <div class="row">${['L1', 'L2', 'L3', 'N'].map(k => `<button type="button" class="btn" data-mg="${k}">${k}–PE<small>${mr[k] != null ? fmt(mr[k], 2) + ' MΩ' : ''}</small></button>`).join('')}</div>
      ${mr.L3 != null && mr.L3 < 1 && !meg.fix ? `<div class="opts">${[['v', 'ارفع الجهد إلى 1000 V'], ['fix', 'افصل مدخلات الجهد لجهاز القياس والمنظّم وواقي الصواعق'], ['ok', 'اقبل القيمة: أكبر من 0.1 MΩ']].map(o => `<button type="button" class="btn" data-mf="${o[0]}">${esc(o[1])}</button>`).join('')}</div>` : ''}<p class="tm" id="mg-m"></p></div>
    <div class="tc"><h4>4. اختبار العزل بالجهد (Dielectric) ${st('die')}</h4><p class="note">${L('Ui = 690 V')} لدوائر القدرة، والمدة في الاختبار الروتيني ${L('1 s')}.</p>
      <label>جهد الاختبار<select data-dv dir="ltr"><option value="">—</option>${[1000, 1500, 1890, 2500].map(v => `<option${t.die && t.die.v === v ? ' selected' : ''}>${v}</option>`).join('')}</select> ${L('V AC 50 Hz')}</label><button type="button" class="btn" data-t="die">طبّق 1 s</button><p class="tm" id="die-m"></p></div>
    <div class="tc"><h4>5. استمرارية دائرة الحماية PE ${st('pe')}</h4><p class="note">${L('10 A DC')} بين كل جزء معدني وطرف ${L('PE')}؛ الحد ${L('≤ 0.1 Ω')}.</p><div class="row">${PEP.map(p => `<button type="button" class="btn" data-pe="${p[0]}">${esc(p[1])}<small>${pm[p[0]] != null ? (pm[p[0]] > 9 ? 'OL' : fmt(pm[p[0]], 3) + ' Ω') : ''}</small></button>`).join('')}</div>${pm.door4 > 9 && !pe.fix ? '<button type="button" class="btn" data-t="braid">ركّب ضفيرة تأريض للباب</button>' : ''}<p class="tm" id="pe-m"></p></div>
    <div class="tc"><h4>6. الاختبار الوظيفي ${st('fn')}</h4><div class="row">${FNS.map((f, i) => `<button type="button" class="btn${(t.fn || 0) > i ? ' okd' : ''}" data-fn="${i}">${(t.fn || 0) > i ? '✓ ' : ''}${esc(f[1])}</button>`).join('')}</div><p class="tm" id="fn-m"></p></div>`;
    if (designOk && all && !E.demo) { if (win('project', 'لوحة الـ MDB مصمّمة ومختبرة: الترتيب و Form 3b والحرارة واختبارات التسليم الستة كلها ناجحة ✓')) E.say('✓ التصميم والاختبارات كلها ناجحة.', 'ok'); }
  }
  function megSvg(v){ const a = v == null ? -60 : -60 + 120 * clamp(Math.log10(Math.max(v, 0.01) / 0.01) / Math.log10(10000 / 0.01), 0, 1);
    const tick = [0.1, 1, 10, 100, 1000].map(x => { const aa = (-60 + 120 * Math.log10(x / 0.01) / 6) * Math.PI / 180; return `<line x1="${100 + 62 * Math.sin(aa)}" y1="${92 - 62 * Math.cos(aa)}" x2="${100 + 72 * Math.sin(aa)}" y2="${92 - 72 * Math.cos(aa)}" class="mg-tk"/><text x="${100 + 84 * Math.sin(aa)}" y="${96 - 84 * Math.cos(aa)}" class="mg-tt" text-anchor="middle">${x}</text>`; }).join('');
    const r = (a * Math.PI / 180);
    return `<svg viewBox="0 0 200 110" width="200" height="110" aria-label="قراءة جهاز الميجر"><path d="M${100 - 72 * Math.sin(Math.PI / 3)} ${92 - 36}A72 72 0 0 1 ${100 + 72 * Math.sin(Math.PI / 3)} ${92 - 36}" class="mg-a"/><path d="M${100 - 72 * Math.sin(Math.PI / 3)} ${92 - 36}A72 72 0 0 1 ${100 + 72 * Math.sin(-Math.PI / 6)} ${92 - 72 * Math.cos(Math.PI / 6)}" class="mg-bad"/>${tick}<line x1="100" y1="92" x2="${100 + 66 * Math.sin(r)}" y2="${92 - 66 * Math.cos(r)}" class="mg-n"/><circle cx="100" cy="92" r="5" class="mg-c"/><text x="100" y="108" class="mg-tt" text-anchor="middle">MΩ ${v == null ? '' : '· ' + fmt(v, 2)}</text></svg>`; }
  const say = (id, t, ok) => { const el = $('#' + id, tg); if (el){ el.textContent = t; el.className = 'tm ' + (ok ? 'ok' : 'bad'); } };
  const sv = () => saveAll();
  tg.addEventListener('change', e => {
    if (!designOk || E.demo) return; const t = T(), x = e.target;
    if (x.dataset.vis != null){ t.vis = $$('[data-vis]', tg).filter(c => c.checked).map(c => +c.dataset.vis); }
    else if (x.dataset.tq){ t.tq = t.tq || {}; t.tq[x.dataset.tq] = x.value; t.tqm = false; }
    else if (x.hasAttribute('data-mv')){ t.meg = t.meg || {}; t.meg.v = +x.value || null; t.meg.r = {}; t.meg.last = null; }
    else if (x.hasAttribute('data-dv')){ t.die = {v:+x.value || null, ok:false}; }
    renderTests(); sv();
  });
  IL.onAct(tg, 'button', async (b) => {
    if (!designOk || E.demo || megAnim) return; const t = T();
    if (b.dataset.t === 'tqm'){ const w = TQ.find(q => !t.tq || +t.tq[q[0]] !== q[2]); if (w){ renderTests(); say('tq-m', `عزم ${w[0]} 8.8 في وصلة نحاسية ${w[2]} Nm (قيمة نموذجية): صحّح الضبط قبل العلامة.`); return; } t.tqm = true; renderTests(); say('tq-m', 'رُبطت الوصلات بالعزم الصحيح وعُلّمت بخط ملوّن.', true); }
    else if (b.dataset.mg){ const k = b.dataset.mg, m = t.meg = t.meg || {}; if (m.v !== 500){ say('mg-m', m.v ? `${m.v} V غير مناسب: اختبار مقاومة العزل لدائرة 400 V يكون بـ 500 V DC.` : 'اختر جهد الاختبار أولًا.'); return; }
      m.r = m.r || {}; const v = k === 'L3' && !m.fix ? 0.42 : {L1:850, L2:920, L3:780, N:640}[k];
      megAnim = 1; for (let i = 1; i <= 10; i++){ m.last = v * i / 10; $('.meg', tg).innerHTML = megSvg(m.last); await sleep(60); } megAnim = null;
      m.r[k] = v; m.last = v; renderTests(); say('mg-m', v < 1 ? `${k}–PE = ${fmt(v, 2)} MΩ < 1 MΩ: ابحث عن السبب.` : `${k}–PE = ${fmt(v, 0)} MΩ ≥ 1 MΩ ✓`, v >= 1); }
    else if (b.dataset.mf){ const m = t.meg; if (b.dataset.mf === 'fix'){ m.fix = true; m.r = {}; m.last = null; renderTests(); say('mg-m', 'فُصلت الأجهزة الإلكترونية؛ أعد قياس الأطوار الأربعة.', true); }
      else { renderTests(); say('mg-m', b.dataset.mf === 'v' ? 'رفع الجهد لا يعالج السبب: الأجهزة الإلكترونية الموصولة تُخفض القراءة.' : 'القيمة أقل من الحد 1 MΩ: لا تُقبل.'); } }
    else if (b.dataset.t === 'die'){ const d = t.die = t.die || {}; if (d.v !== 1890){ renderTests(); say('die-m', d.v ? `${d.v} V غير صحيح: جدول IEC 61439-1 يعطي 1890 V AC لـ Ui 690 V.` : 'اختر جهد الاختبار أولًا.'); return; }
      if (!(t.meg && t.meg.fix)){ say('die-m', 'افصل الأجهزة الإلكترونية أولًا (راجع اختبار الميجر).'); return; }
      say('die-m', '… 1890 V لمدة 1 s', true); await sleep(900); d.ok = true; renderTests(); say('die-m', 'لا انهيار ولا وميض: الاختبار ناجح.', true); }
    else if (b.dataset.pe){ const p = t.pe = t.pe || {}; p.m = p.m || {}; const k = b.dataset.pe; p.m[k] = k === 'door4' && !p.fix ? 99 : {door1:0.045, plate:0.012, acb:0.008, door4:0.052}[k];
      renderTests(); say('pe-m', p.m[k] > 9 ? `${PEP.find(x => x[0] === k)[1]}: الدائرة مفتوحة (OL): الباب غير موصول بالأرضي.` : `${fmt(p.m[k], 3)} Ω ≤ 0.1 Ω ✓`, p.m[k] <= 0.1); }
    else if (b.dataset.t === 'braid'){ t.pe.fix = true; delete t.pe.m.door4; renderTests(); say('pe-m', 'رُكّبت الضفيرة: أعد قياس باب S4.', true); }
    else if (b.dataset.fn != null){ const i = +b.dataset.fn, n = t.fn || 0; if (i < n) return; if (i > n){ say('fn-m', `ابدأ بـ «${FNS[n][1]}» أولًا.`); return; } t.fn = n + 1; renderTests(); say('fn-m', ['النابض مشحون: المؤشر CHARGED.', 'ACB مغلق: المؤشر I والجهد على البارات.', 'فصل ACB بزر الاختبار، ورجع المؤشر إلى O.', 'المنظّم شغّل الخطوات الست وفصلها بالتتابع.'][i], true); }
    sv();
  });
  E.update(false);
  /* solution */
  const C = (k, x, y, o) => [k, x, y, o];
  const steps = [{say:'البارات الرئيسية 2×(80×10) عبر S1–S3، وACB 1600 A في أسفل S1 (دخول من أسفل).'}, C('bus', 60, 120, {L:2280, sz:'2x80x10'}), C('acb', 180, 1350, {In:1600}), C('drop', 620, 280, {L:1300, sz:'2x80x10'}),
    C('ct', 250, 1150, {r:1600}), C('ct', 320, 1150, {r:1600}), C('ct', 390, 1150, {r:1600}), C('pm', 350, 500, {}),
    {say:'S2: SMDB 630 A و MCC 400 A و PFC 630 A، كلٌّ في مقصورة بين حاجزين.'}, C('drop', 1410, 280, {L:1580, sz:'2x80x10'}),
    C('mccb', 1000, 420, {In:630, fd:'SMDB'}), C('bar', 860, 760, {}), C('mccb', 1000, 860, {In:400, fd:'MCC'}), C('bar', 860, 1220, {}), C('mccb', 1000, 1320, {In:630, fd:'PFC'}),
    C('fan', 1000, 1300, {V:105}), C('grille', 1000, 400, {V:105}),
    {say:'S3: LTG 100 A و AC 400 A والاحتياطي 250 A.'}, C('drop', 2210, 280, {L:1580, sz:'40x10'}),
    C('mccb', 1800, 420, {In:100, fd:'LTG'}), C('bar', 1660, 760, {}), C('mccb', 1800, 860, {In:400, fd:'AC'}), C('bar', 1660, 1220, {}), C('mccb', 1800, 1320, {In:250, fd:'SPR'}),
    {say:'S4 قسم مستقل للمكثفات: 6 كونتاكتورات، و6 مكثفات 50 kVAR، و6 ملفات 7 % في الأسفل، ومروحة.'}, C('pfcr', 2850, 300, {}), C('duct', 2460, 270, {L:680, b:60}), C('rail', 2460, 400, {L:680}), C('duct', 2460, 510, {L:680, b:60})];
  for (let i = 0; i < 6; i++) steps.push(C('capk', 2470 + i * 65, onRail(400, 125), {Q:50}));
  [700, 1030].forEach(y => [2470, 2690, 2910].forEach(x => steps.push(C('cap', x, y, {Q:50}))));
  [1360, 1600].forEach(y => [2470, 2690, 2910].forEach(x => steps.push(C('dr', x, y, {Q:50}))));
  steps.push(C('fan', 2520, 1300, {V:230}), C('grille', 2520, 400, {V:230}));
  const SOL = {enc:'m4', ip:'IP31', entry:'bottom', form:'3b', steps};
  IL._pd = IL._pd || {}; IL._pd.project = SOL;
  demo(host, 'project', E, async m => {
    await playSol(E, 'project', SOL, m);
    m.textContent = 'العرض: اختبارات التسليم.';
    ST.project.tests = {vis:[0, 1, 2, 3], tq:{M12:70, M10:40, M8:20}, tqm:true, meg:{v:500, fix:true, r:{L1:850, L2:920, L3:780, N:640}, last:640}, die:{v:1890, ok:true}, pe:{fix:true, m:{door1:0.045, plate:0.012, acb:0.008, door4:0.052}}, fn:4};
    E.update(false); await hl($('#tests', ex), 900);
  });
};

/* =====================================================================
   start
   ===================================================================== */
const first = location.hash.slice(1);
show(G[first] ? first : 'layout');
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (G[h]) show(h); });
})();
