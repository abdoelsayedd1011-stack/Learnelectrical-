/* محطة صيانة المحولات – LearnElectricals (MSA UI)
   Transformer T1 (1000 kVA, 11/0.4 kV, Dyn11, ONAN) of the factory used across the course.
   Tabs: inspect (l9) · tests (l10) · oil (l11) · plan (l12). State in localStorage 'maint-trafo-v1'.
   All limits are typical values for learning («قيم نموذجية للتعلّم»). */
(function(){
'use strict';
const $ = IL.$, $$ = IL.$$, esc = IL.esc, fmt = IL.fmt;
IL.hubTheme();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const LTR_RUN = /[A-Za-z0-9√(±+−\-][A-Za-z0-9Ωµ°√±≤≥<>=×·()+\-−.,%/²³_ →↔'&;^]*[A-Za-z0-9Ωµ°%)²³;]|[A-Za-z0-9]/g;
const ar = s => esc(s).split(/(&[#\w]+;)/).map((p, i) => i % 2 ? p : p.replace(LTR_RUN, m => `<bdi dir="ltr">${m}</bdi>`)).join('');
const iso = s => String(s).replace(LTR_RUN, m => '\u2066' + m + '\u2069');   // isolate Latin runs in plain-text <option>s
const clone = o => JSON.parse(JSON.stringify(o));
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pickA = a => a[Math.floor(Math.random() * a.length)];
const shuffle = IL.shuffle;
const num = IL.num;
const f1 = v => fmt(v, 1), f2 = v => fmt(v, 2), f0 = v => fmt(v, 0), f3 = v => fmt(v, 3);
const near = (v, t, tol, abs) => isFinite(v) && Math.abs(v - t) <= (abs ? tol : Math.abs(t) * tol);
const SQ3 = Math.sqrt(3);

/* =====================================================================
   1. engineering (exported as window.TRAFO for self-tests)
   ===================================================================== */
const T1 = {S:1000, U1:11000, U2:400, uk:0.06};
T1.I1 = T1.S * 1000 / (SQ3 * T1.U1);                     // 52.5 A
T1.I2 = T1.S * 1000 / (SQ3 * T1.U2);                     // 1443 A
const TAPS = [1, 2, 3, 4, 5];
const tapV = t => T1.U1 * (1 + (3 - t) * 0.025);         // tap 1 = +5 % … tap 5 = −5 %
const ttrNom = t => tapV(t) / (T1.U2 / SQ3);             // HV line-line / LV phase-neutral (Dyn11)
const ttrErr = (m, n) => (m - n) / n * 100;
const OTI = {al:85, tr:95}, WTI = {al:105, tr:115};
/* winding resistance: copper, reference 75 °C for transformers */
const rCorr = (R, T1_, T2) => R * (235 + T2) / (235 + T1_);
const unbal = a => { const mx = Math.max(...a), mn = Math.min(...a), av = a.reduce((x, y) => x + y, 0) / a.length; return (mx - mn) / av * 100; };
/* delta winding measured between two line terminals: Rab ∥ (Rbc + Rca) */
const deltaLL = (Rx, Ry, Rz) => Rx * (Ry + Rz) / (Rx + Ry + Rz);
const R_HV_PH20 = 1.575;                                 // Ω per delta phase at 20 °C → 1.05 Ω line-line
const R_LV_PH20 = 690e-6;                                // Ω per star phase at 20 °C
/* insulation: reading halves for every 10 °C rise → correct to 20 °C */
const kt20 = T => Math.pow(2, (T - 20) / 10);
const IRMIN = {hve:1000, lve:500, hvlv:1000};
const PI_MIN = 1.25;
const irAt = (r1, pi, t) => r1 * Math.pow(t / 60, Math.log10(pi));   // R(t) with R(600)/R(60) = PI
/* oil (IEC 60422 typical, Um ≤ 72.5 kV) */
const bdvClass = v => v > 40 ? 'good' : v >= 30 ? 'fair' : 'poor';
const waterClass = v => v < 20 ? 'good' : v <= 30 ? 'fair' : 'poor';
const acidClass = v => v < 0.10 ? 'good' : v <= 0.20 ? 'fair' : 'poor';
/* Duval triangle 1 (IEC 60599) */
function duvalPct(g){ const s = g.CH4 + g.C2H4 + g.C2H2; return {ch4:g.CH4 / s * 100, c2h4:g.C2H4 / s * 100, c2h2:g.C2H2 / s * 100}; }
function duvalZone(p){
  const m = p.ch4, e = p.c2h4, a = p.c2h2;
  if (m >= 98) return 'PD';
  if (a > 13 && e < 23) return 'D1';
  if (a > 13 && e >= 23 && e < 40) return 'D2';
  if (a > 29 && e >= 40) return 'D2';
  if (a < 4 && e < 20) return 'T1';
  if (a < 4 && e >= 20 && e < 50) return 'T2';
  if (a < 15 && e >= 50) return 'T3';
  return 'DT';
}
/* zone polygons as (C2H4 %, C2H2 %) vertices; CH4 = 100 − both */
const DZ = {
  PD:[[0, 0], [2, 0], [0, 2]],
  T1:[[2, 0], [20, 0], [20, 4], [0, 4], [0, 2]],
  T2:[[20, 0], [50, 0], [50, 4], [20, 4]],
  T3:[[50, 0], [100, 0], [85, 15], [50, 15]],
  DT:[[0, 4], [50, 4], [50, 15], [85, 15], [71, 29], [40, 29], [40, 13], [0, 13]],
  D1:[[0, 13], [23, 13], [23, 77], [0, 100]],
  D2:[[23, 13], [40, 13], [40, 29], [71, 29], [23, 77]]
};
const ZN = {PD:'PD · تفريغ جزئي', T1:'T1 · حراري < 300 °C', T2:'T2 · حراري 300–700 °C', T3:'T3 · حراري > 700 °C', D1:'D1 · تفريغ منخفض الطاقة', D2:'D2 · تفريغ عالي الطاقة (قوس)', DT:'DT · خليط حراري وكهربي'};
const ZCOL = {PD:'#8e7cc3', T1:'#f6d55c', T2:'#f0a03c', T3:'#d9534f', D1:'#6fb7e0', D2:'#3a6fd0', DT:'#9bc88b'};
/* vector-group check: 400 V on HV, 1U bonded to 2U → terminal potentials (complex) */
const C = (re, im) => ({re, im});
const cadd = (a, b) => C(a.re + b.re, a.im + b.im), csub = (a, b) => C(a.re - b.re, a.im - b.im), cabs = a => Math.hypot(a.re, a.im);
const pol = (m, deg) => C(m * Math.cos(deg * Math.PI / 180), m * Math.sin(deg * Math.PI / 180));
const VG = {Dyn11:30, Dyn1:-30, Dyn5:-150, Yyn0:0};
function vgPot(group, tap, Ul){
  Ul = Ul || 400;
  const K = tapV(tap) / T1.U2, ul = Ul / K / SQ3, sh = VG[group];
  const H = {'1U':pol(Ul / SQ3, 90), '1V':pol(Ul / SQ3, -30), '1W':pol(Ul / SQ3, 210)};
  const l = {'2U':pol(ul, 90 + sh), '2V':pol(ul, -30 + sh), '2W':pol(ul, 210 + sh), '2N':C(0, 0)};
  const off = csub(H['1U'], l['2U']), P = Object.assign({}, H);
  Object.keys(l).forEach(k => P[k] = cadd(l[k], off));
  return P;
}
const vgV = (group, tap, a, b) => cabs(csub(vgPot(group, tap)[a], vgPot(group, tap)[b]));
const VG_PAIRS = [['1V', '2V'], ['1W', '2W'], ['1V', '2W'], ['1W', '2V']];
/* NEMA / ISO data for the plan tab are typical; vibration zones (ISO 20816-3 group 2, rigid) */
const ISO = [1.4, 2.8, 4.5];
window.TRAFO = {T1, tapV, ttrNom, ttrErr, rCorr, unbal, deltaLL, kt20, irAt, bdvClass, waterClass, acidClass, duvalPct, duvalZone, vgV, vgPot, DZ};

/* =====================================================================
   2. scenarios (random within realistic noise, stored so a reload keeps them)
   ===================================================================== */
const INSP = [
  {id:'mog', n:'مبيّن مستوى الزيت (MOG)', hint:'قارن موضع المؤشر بعلامتي MIN و MAX وبحرارة الزيت.',
    F:['المستوى طبيعي ويوافق حرارة الزيت', 'المستوى منخفض عند الحد الأدنى MIN', 'المستوى مرتفع عند الحد الأقصى MAX'],
    A:['لا إجراء؛ سجّل القراءة', 'ابحث عن مصدر التسريب، وأكمل الزيت بزيت مطابق IEC 60296 في إيقاف مخطط', 'راجع الحمل والحرارة، واسحب الزيت الزائد في إيقاف مخطط'],
    st:{ok:[0, 0], low:[1, 1]}, why:{low:'المستوى المنخفض قد يكشف مرحّل بوخهولز والملفات؛ ابحث عن التسريب ثم أكمل الزيت.'}},
  {id:'brt', n:'مجفف السيليكا جل', hint:'انظر إلى نسبة الحبيبات التي تغيّر لونها وإلى كأس الزيت أسفل المجفف.',
    F:['السيليكا برتقالية جافة وكأس الزيت ممتلئ', 'أكثر من ثلثي السيليكا تغيّر لونها', 'كأس الزيت أسفل المجفف فارغ'],
    A:['لا إجراء', 'استبدل السيليكا جل أو جدّدها بالتجفيف', 'أكمل زيت الكأس إلى العلامة'],
    st:{ok:[0, 0], sat:[1, 1], cup:[2, 2]}, why:{sat:'السيليكا المشبعة لا تجفف الهواء الداخل، فتصل الرطوبة إلى الزيت وتخفض BDV.', cup:'كأس الزيت يحجز الرطوبة والغبار؛ بدونه تتشبّع السيليكا بسرعة.'}},
  {id:'leak', n:'المبردات والصمامات (التسريب)', hint:'افحص الفلانشة أسفل المبرد والقاعدة تحتها.',
    F:['لا آثار تسريب', 'بقعة رشح خفيف عند فلانشة المبرد', 'تسريب نشط بالتنقيط وبقعة على القاعدة'],
    A:['لا إجراء', 'نظّف المكان وعلّمه وراقبه، واربط الحشية أو استبدلها في الإيقاف القادم', 'تحقّق من مستوى الزيت فورًا، وضع وعاءً لجمع الزيت، وخطّط لإصلاح عاجل للحشية'],
    st:{ok:[0, 0], weep:[1, 1], drip:[2, 2]}, why:{weep:'الرشح الخفيف لا يحتاج إيقافًا عاجلًا، لكن نظّفه وعلّمه لتعرف إن كان يزداد.', drip:'التنقيط يُفقد الزيت باستمرار؛ راقب المستوى وأصلح الحشية عاجلًا.'}},
  {id:'oti', n:'مبيّن حرارة الزيت OTI', hint:'المؤشر الأسود هو القراءة الحالية، والأحمر هو أقصى قراءة منذ آخر ضبط. الإنذار 85 °C والفصل 95 °C.',
    F:['القراءة والمؤشر الأقصى أقل من حد الإنذار 85 °C', 'المؤشر الأقصى تجاوز حد الإنذار 85 °C', 'القراءة الحالية تجاوزت حد الفصل 95 °C'],
    A:['سجّل القراءتين ثم أعد المؤشر الأقصى إلى القراءة الحالية', 'سجّل القراءتين، وراجع سجل الأحمال والتبريد ودائرة الإنذار، ثم أعد المؤشر الأقصى', 'أخرج المحول من الخدمة فورًا'],
    st:{ok:[0, 0], max:[1, 1]}, why:{max:'الزيت تجاوز 85 °C منذ آخر جولة؛ ابحث عن السبب في الأحمال والتبريد وتحقّق أن الإنذار عمل.'}},
  {id:'wti', n:'مبيّن حرارة الملفات WTI', hint:'الإنذار 105 °C والفصل 115 °C (قيم ضبط نموذجية).',
    F:['القراءة والمؤشر الأقصى أقل من حد الإنذار 105 °C', 'القراءة الحالية فوق حد الإنذار 105 °C', 'المؤشر الأقصى تجاوز حد الفصل 115 °C'],
    A:['سجّل القراءتين ثم أعد المؤشر الأقصى', 'خفّف الحمل الآن، وتحقّق من المبردات ودائرة الإنذار، وتابع القراءة', 'لا إجراء؛ الملفات تتحمل حتى 140 °C'],
    st:{ok:[0, 0], hot:[1, 1]}, why:{hot:'حرارة الملفات فوق الإنذار تستهلك عمر العزل بسرعة (كل 6–10 °C زيادة تقارب نصف العمر)؛ خفّف الحمل الآن.'}},
  {id:'buch', n:'نافذة مرحّل بوخهولز', hint:'النافذة السليمة ممتلئة بالزيت تمامًا؛ أي فراغ في أعلاها غاز.',
    F:['النافذة ممتلئة بالزيت دون غاز', 'غاز متجمّع أعلى المرحّل وانخفض الزيت في النافذة', 'الزيت في النافذة داكن اللون'],
    A:['لا إجراء', 'خذ عينة من الغاز ومن الزيت لتحليل DGA فورًا وأبلغ؛ وإن كان الغاز قابلًا للاشتعال فأخرج المحول من الخدمة', 'أطلق الغاز من صمام التنفيس وتابع التشغيل'],
    st:{ok:[0, 0], gas:[1, 1]}, why:{gas:'الغاز في بوخهولز علامة عطل داخلي حتى يثبت العكس؛ إطلاقه دون عينة يضيّع الدليل.'}},
  {id:'bush', n:'العوازل الخارجية Bushings', hint:'افحص سطح الأقراص: النظافة، والشروخ، وآثار التفريغ السطحي.',
    F:['العوازل نظيفة وسليمة', 'طبقة اتساخ وتلوث على السطح', 'شرخ في أحد الأقراص وآثار تفريغ سطحي'],
    A:['لا إجراء', 'نظّف العوازل في الإيقاف المخطط القادم', 'خطّط لإيقاف عاجل لاستبدال العازل، ولا تقترب منه والمحول في الخدمة'],
    st:{ok:[0, 0], dirty:[1, 1], crack:[2, 2]}, why:{dirty:'التلوث يزيد تيار التسرب السطحي؛ النظافة في الإيقاف القادم تكفي.', crack:'العازل المشروخ قد ينهار ويسبب قوسًا؛ لا تقترب منه وخطّط لاستبداله عاجلًا.'}},
  {id:'earth', n:'وصلات التأريض', hint:'افحص شريط تأريض الخزان ووصلة التعادل بالأرضي: التآكل والربط.',
    F:['وصلات التأريض نظيفة ومحكمة', 'وصلة التعادل بالأرضي متآكلة ومرتخية', 'لا توجد وصلة تأريض للخزان'],
    A:['لا إجراء', 'أبلغ فورًا، ونظّف الوصلة وأحكمها بعد العزل والإقفال في أقرب فرصة', 'فكّ الوصلة الآن ونظّفها والمحول في الخدمة'],
    st:{ok:[0, 0], loose:[1, 1]}, why:{loose:'وصلة التعادل المرتخية تهدد نظام TN-S كله؛ لا تفكّها والمحول في الخدمة، بل أصلحها بعد العزل والإقفال.'}}
];
const INSPM = {}; INSP.forEach(i => INSPM[i.id] = i);
function newInsp(){
  const bad = shuffle(INSP.map(i => i.id)).slice(0, rint(3, 4));
  const st = {};
  INSP.forEach(i => { const ab = Object.keys(i.st).filter(k => k !== 'ok'); st[i.id] = bad.includes(i.id) ? pickA(ab) : 'ok'; });
  const oti = st.oti === 'max' ? {v:rint(56, 66), m:rint(87, 93)} : {v:rint(48, 62), m:0};
  if (!oti.m) oti.m = oti.v + rint(8, 16);
  const wti = st.wti === 'hot' ? {v:rint(106, 111), m:0} : {v:oti.v + rint(10, 16), m:0};
  wti.m = st.wti === 'hot' ? wti.v + rint(1, 3) : Math.min(101, wti.v + rint(6, 14));
  if (st.wti === 'hot'){ oti.v = Math.max(oti.v, 72); oti.m = Math.max(oti.m, oti.v + 2); if (st.oti !== 'max') oti.m = Math.min(oti.m, 82); }
  return {st, oti, wti, brt:st.brt === 'sat' ? rnd(0.7, 0.85) : rnd(0.12, 0.3)};
}
function newTests(){
  const T = rint(24, 34);
  const ttrT = pickA(['ok', 'turn', 'tapc']);
  const noise = TAPS.map(() => [0, 1, 2].map(() => rnd(-0.08, 0.08)));
  const ttr = {type:ttrT, ph:rint(0, 2), tap:pickA([1, 2, 4, 5]), mag:rnd(0.8, 1.4) * (ttrT === 'tapc' ? 1 : -1), noise, iex:[rnd(5.6, 6.6), rnd(3.9, 4.6), rnd(5.5, 6.5)]};
  const wrT = pickA(['ok', 'hv', 'lv']);
  const wr = {type:wrT, ph:rint(0, 2), mag:rnd(0.06, 0.1), n:[0, 1, 2, 3, 4, 5].map(() => rnd(-0.003, 0.003))};
  const irT = pickA(['ok', 'ok', 'wet']);
  const v = irT === 'ok' ? {hve:{r1:rnd(2600, 4800), pi:rnd(1.6, 2.4)}, lve:{r1:rnd(1500, 3000), pi:rnd(1.5, 2.2)}, hvlv:{r1:rnd(4000, 7000), pi:rnd(1.6, 2.4)}}
    : {hve:{r1:rnd(450, 800), pi:rnd(1.0, 1.15)}, lve:{r1:rnd(250, 420), pi:rnd(1.0, 1.12)}, hvlv:{r1:rnd(700, 950), pi:rnd(1.05, 1.18)}};
  Object.values(v).forEach(o => o.r1 = Math.round(o.r1));      // values corrected to 20 °C; readings at T are lower
  return {T, ttr, wr, ir:{type:irT, v}, vgn:[0, 1, 2, 3, 4, 5, 6, 7].map(() => rnd(-0.4, 0.4))};
}
/* oil scenarios */
const OILSC = {
  healthy:{bdv:[58, 68], w:[6, 12], a:[0.02, 0.05], g:{H2:[8, 20], CH4:[9, 14], C2H6:[3, 8], C2H4:[1, 1], C2H2:[0, 0], CO:[150, 300], CO2:[1500, 3000]}, act:['ok']},
  wet:{bdv:[23, 28], w:[34, 42], a:[0.05, 0.08], g:{H2:[20, 40], CH4:[30, 45], C2H6:[15, 25], C2H4:[3, 6], C2H2:[0, 0], CO:[300, 500], CO2:[2500, 4000]}, act:['dry']},
  aged:{bdv:[32, 38], w:[14, 19], a:[0.24, 0.3], g:{H2:[15, 30], CH4:[40, 60], C2H6:[25, 40], C2H4:[6, 10], C2H2:[0, 0], CO:[500, 800], CO2:[5000, 8000]}, act:['regen']},
  T3:{bdv:[50, 58], w:[9, 14], a:[0.04, 0.07], g:{H2:[100, 140], CH4:[160, 200], C2H6:[50, 70], C2H4:[380, 460], C2H2:[2, 5], CO:[300, 450], CO2:[3000, 4500]}, act:['plan', 'trip']},
  D2:{bdv:[42, 50], w:[10, 15], a:[0.04, 0.07], g:{H2:[350, 450], CH4:[80, 100], C2H6:[15, 25], C2H4:[110, 130], C2H2:[140, 170], CO:[250, 400], CO2:[2500, 3500]}, act:['trip']}
};
function newOil(){
  const type = pickA(Object.keys(OILSC)), o = OILSC[type], g = {};
  Object.keys(o.g).forEach(k => g[k] = rint(o.g[k][0], o.g[k][1]));
  const mean = rnd(o.bdv[0], o.bdv[1]);
  const bdv = [0, 1, 2, 3, 4, 5].map(i => +(mean * (1 + rnd(-0.09, 0.09)) - (i === 0 ? rnd(0, 2) : 0)).toFixed(1));
  return {type, g, bdv, water:rint(o.w[0], o.w[1]), acid:+rnd(o.a[0], o.a[1]).toFixed(2), Ts:rint(38, 52)};
}
/* plan: assets and tasks */
const GRP = [
  {id:'P', tag:'P-101…P-104', n:'المضخات (4 × 15 kW)', note:'محامل 6309-2Z / 6209-2Z مغلقة مشحّمة مدى العمر'},
  {id:'C', tag:'C-201, C-202', n:'الضواغط (2 × 37 kW)', note:'محامل 6313 / 6213 C3 قابلة لإعادة التشحيم'},
  {id:'CH', tag:'CH-301', n:'المبرّد (75 kW)', note:'محامل 6317 / 6316 C3 قابلة لإعادة التشحيم'},
  {id:'T', tag:'T1', n:'المحول 1000 kVA', note:'ONAN، مبدّل جهد دون حمل، بوخهولز، مجفف سيليكا'}
];
const FQ = ['w', 'm', 'q', 'h', 'y', 'n', 'hrs', 'na'];
const FQN = {w:'أسبوعيًا', m:'شهريًا', q:'كل 3 أشهر', h:'كل 6 أشهر', y:'سنويًا', n:'كل 3–5 سنوات أو عند الحاجة', hrs:'حسب ساعات التشغيل المحسوبة', na:'لا ينطبق'};
const MTASK = [
  {id:'vis', n:'فحص بصري، تنظيف الزعانف، قراءة التيار', ok:{P:['w', 'm'], C:['w', 'm'], CH:['w', 'm']}},
  {id:'vib', n:'قياس الاهتزاز DE/NDE (ISO 20816)', ok:{P:['m', 'q'], C:['m'], CH:['m']}, why:'الضواغط والمبرّد معدات حرجة؛ قِس اهتزازها شهريًا لتلحق بالاتجاه قبل العطل.'},
  {id:'ir', n:'تصوير حراري لصندوق الأطراف والمحامل', ok:{P:['q', 'h'], C:['q', 'h'], CH:['q', 'h']}},
  {id:'grease', n:'تشحيم المحامل', ok:{P:['na'], C:['hrs'], CH:['hrs']}, why:'محامل المضخات 2Z مغلقة مشحّمة مدى العمر فلا تُشحَّم؛ والضواغط والمبرّد تُشحَّم حسب الفترة المحسوبة بساعات التشغيل.'},
  {id:'meg', n:'اختبار العزل IR / PI', ok:{P:['y'], C:['y', 'h'], CH:['y', 'h']}},
  {id:'wr', n:'مقاومة الملفات واتزانها', ok:{P:['n', 'y'], C:['n', 'y'], CH:['n', 'y']}},
  {id:'align', n:'فحص المحاذاة والقاعدة المرتخية', ok:{P:['y'], C:['y'], CH:['y']}, why:'افحص المحاذاة سنويًا وبعد أي فك أو تغيير في القاعدة.'}
];
const TTASK = [
  {id:'walk', n:'جولة تفتيش: الزيت، السيليكا، التسريب، OTI/WTI', ok:['w', 'm']},
  {id:'thermo', n:'تصوير حراري للعوازل والوصلات', ok:['h', 'y']},
  {id:'oil', n:'اختبار الزيت BDV والرطوبة والحموضة', ok:['y']},
  {id:'dga', n:'تحليل الغازات الذائبة DGA', ok:['y', 'h']},
  {id:'prot', n:'اختبار دوائر بوخهولز و OTI/WTI (إنذار وفصل)', ok:['y']},
  {id:'elec', n:'TTR ومقاومة الملفات والعزل', ok:['n'], why:'الاختبارات الكهربية تحتاج إيقافًا؛ تُجرى كل 3–5 سنوات أو عندما يشير DGA أو حدث إلى مشكلة.'},
  {id:'tap', n:'تحريك مبدّل الجهد على كل الأوضاع والمحول مفصول', ok:['y'], why:'تحريك مبدّل الجهد سنويًا في الإيقاف يزيل الأكسدة عن التلامسات.'}
];
const TREND = [
  {id:'c202', tag:'C-202', n:'اهتزاز DE أفقي (mm/s RMS)', base:[1.2, 1.5, 2.1, 2.9, 3.4], unit:'mm/s', zones:ISO, ok:1,
    A:['استمر بالخطة العادية؛ القيمة تحت 4.5 mm/s', 'المنطقة C والاتجاه صاعد: خطّط لفحص المحامل والمحاذاة والاتزان في أقرب إيقاف، وقِس كل أسبوعين', 'أوقف الضاغط فورًا وغيّر المحرك', 'ضاعف كمية الشحم في كل تشحيم'],
    why:'3.4 mm/s في المنطقة C (2.8–4.5 typical)؛ لا تنتظر المنطقة D، ولا تعالج بالشحم دون تشخيص.'},
  {id:'ch301', tag:'CH-301', n:'PI للملفات (IR بعد التصحيح إلى 40 °C)', base:[3.1, 2.8, 2.4, 1.9, 1.6], unit:'PI', lim:2, ok:2,
    A:['استمر؛ IR ما زال أعلى من 5 MΩ', 'أعد لفّ المحرك فورًا', 'PI أقل من 2.0 ويهبط: نظّف الملفات وجفّفها ثم أعد الاختبار', 'غيّر المحامل'],
    why:'PI = 1.6 أقل من 2.0 (class F): العزل رطب أو متسخ؛ التجفيف والتنظيف أولًا، وإعادة اللف آخر الحلول.'},
  {id:'bdv', tag:'T1', n:'BDV للزيت (kV)', base:[68, 61, 52, 44, 36], unit:'kV', lim:40, ok:0,
    A:['BDV في المنطقة المقبولة (30–40 kV) ويهبط: رشّح الزيت وجفّفه، وافحص مجفف السيليكا', 'استبدل الزيت كله فورًا', 'استمر؛ الحد الأدنى 30 kV', 'أخرج المحول من الخدمة'],
    why:'الهبوط المستمر سببه الرطوبة غالبًا؛ الترشيح والتجفيف وفحص المجفف يعالجان السبب قبل أن يصل BDV إلى < 30 kV.'},
  {id:'c2h2', tag:'T1', n:'C2H2 في الزيت (ppm)', base:[0, 0, 1, 4, 12], unit:'ppm', ok:3,
    A:['استمر؛ القيمة صغيرة', 'رشّح الزيت لإزالة الغاز', 'أعد اختبار الزيت بعد سنة', 'أعد DGA فورًا لتأكيد معدل الزيادة؛ وإن تأكّد فأخرج المحول للفحص الداخلي'],
    why:'الأسيتيلين ينتج عن تفريغ أو قوس؛ معدل زيادته هو الخطر، والترشيح يخفي الدليل دون أن يعالج العطل.'},
  {id:'p103', tag:'P-103', n:'حرارة محمل DE (°C)', base:[55, 56, 55, 57, 56], unit:'°C', ok:0,
    A:['مستقرة: استمر بالخطة العادية', 'غيّر المحمل في الإيقاف القادم', 'شحّم المحمل', 'أوقف المضخة'],
    why:'القراءة مستقرة عند 55–57 °C؛ لا داعي لإجراء، ومحمل 2Z لا يُشحَّم أصلًا.'}
];
const TRLAB = ['2024-01', '2024-07', '2025-01', '2025-07', '2026-01'];
function newPlan(){ const v = {}; TREND.forEach(t => v[t.id] = t.base.map((x, i) => x === 0 ? 0 : +(x * (1 + rnd(-0.03, 0.03))).toFixed(t.unit === 'PI' || t.unit === 'mm/s' ? 2 : 0))); return {v, order:{}}; }

/* =====================================================================
   3. state
   ===================================================================== */
const KEY = 'maint-trafo-v1';
const DEF = () => ({
  insp:{sc:null, ppe:false, cur:'', rec:{}},
  tests:{sc:null, sub:'safe', safe:[], tap:3, links:{hvs:false, lvs:false, hve:false, lve:false, jmp:false}, ttr:{nom:{}, meas:{}, verdict:''}, wr:{meas:{}, r75:'', ubh:'', ubl:'', verdict:''},
    ir:{cfg:'hve', V:0, runs:{}, ir20:'', pi:'', dar:'', verdict:''}, vg:{meas:{}, pick:''}, done:{}},
  oil:{sc:null, samp:[], bdv:{rinse:false, gap:'', fill:false, wait:false, res:[]}, avg:'', cls:'', wcls:'', acls:'', pct:{ch4:'', c2h4:'', c2h2:''}, pt:null, zone:'', act:'', done:{}},
  plan:{sc:null, f:{}, tr:{}, made:false}
});
function merge(d, s){
  if (!s || typeof s !== 'object') return d;
  Object.keys(d).forEach(k => {
    if (s[k] === undefined) return;
    const dv = d[k];
    if (dv && typeof dv === 'object' && !Array.isArray(dv) && Object.keys(dv).length) d[k] = merge(dv, s[k]);
    else if (dv === null || dv === '' || typeof s[k] === typeof dv) d[k] = s[k];
  });
  return d;
}
let S = DEF();
try { S = merge(DEF(), JSON.parse(localStorage.getItem(KEY))); } catch (e){ S = DEF(); }
let DEMO = 0;
function save(){ if (DEMO) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e){} }
if (!S.insp.sc) S.insp.sc = newInsp();
if (!S.tests.sc) S.tests.sc = newTests();
if (!S.oil.sc) S.oil.sc = newOil();
if (!S.plan.sc) S.plan.sc = newPlan();
save();

/* =====================================================================
   4. tabs, goals, demo
   ===================================================================== */
const TABS = [
  {id:'inspect', t:'جولة التفتيش', l:'l9', h:'جولة تفتيش حول المحول T1 وهو في الخدمة', goal:'افحص النقاط الثماني حول المحول، وسجّل لكل نقطة الملاحظة الصحيحة والإجراء المناسب.'},
  {id:'tests', t:'الاختبارات الكهربية', l:'l10', h:'اختبارات المحول الكهربية بعد العزل', goal:'اعزل المحول بالترتيب الصحيح، ثم أجرِ TTR على الأوضاع الخمسة، ومقاومة ملفات HV و LV، والعزل و PI، وتحقّق من مجموعة التوصيل، واحكم على كل اختبار.'},
  {id:'oil', t:'الزيت و DGA', l:'l11', h:'عينة الزيت، الجهد الانهياري BDV، وتحليل الغازات DGA', goal:'خذ العينة بالترتيب الصحيح، وأجرِ BDV (6 انهيارات ومتوسطها)، وصنّف الرطوبة والحموضة، وارسم الغازات على مثلث دوفال، واختر الإجراء.'},
  {id:'plan', t:'خطة الصيانة', l:'l12', h:'خطة صيانة المصنع: المحركات السبعة والمحول T1', goal:'حدّد تكرار كل مهمة لكل مجموعة محركات وللمحول، واختر الإجراء الصحيح لكل اتجاه قراءات، ثم أنشئ الخطة في صفحة واحدة.'}
];
const WINMSG = {inspect:'أحسنت: سجّلت النقاط الثماني بملاحظات وإجراءات صحيحة.', tests:'أحسنت: عزلت المحول وأجريت الاختبارات الأربعة وحكمت عليها صحيحًا.', oil:'أحسنت: العينة والاختبارات والتحليل والإجراء كلها صحيحة.', plan:'أحسنت: خطة الصيانة كاملة وصحيحة وجاهزة للطباعة.'};
const tabsEl = $('#tabs'), panes = $('#panes'), G = {}, BUILD = {};
TABS.forEach(tb => {
  const b = document.createElement('button'); b.className = 'btn' + (IL.has(tb.l, 'sim') ? ' done' : ''); b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = tb.t; b.dataset.id = tb.id;
  b.addEventListener('click', () => show(tb.id)); tabsEl.appendChild(b);
  const p = document.createElement('section'); p.className = 'pane'; p.id = 'p-' + tb.id; p.setAttribute('role', 'tabpanel');
  p.innerHTML = `<h2 style="margin:12px 0 8px">${esc(tb.h)}</h2><div class="goal${IL.has(tb.l, 'sim') ? ' ok' : ''}" id="g-${tb.id}"><b class="k">${IL.has(tb.l, 'sim') ? '✓ أُنجز' : 'المطلوب'}</b>${ar(tb.goal)}</div><div class="body"></div>`;
  panes.appendChild(p); G[tb.id] = tb;
});
function show(id){
  if (!G[id]) id = 'inspect';
  $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + id));
  $$('#tabs .btn').forEach(b => b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false'));
  if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  if (!G[id].built){ G[id].built = true; BUILD[id]($('#p-' + id + ' .body')); }
}
function rebuild(id){ const old = $('#p-' + id + ' .body'), nb = document.createElement('div'); nb.className = 'body'; old.replaceWith(nb); BUILD[id](nb); }
function win(id){
  if (DEMO) return false;
  const tb = G[id]; if (tb.won) return false; tb.won = true; IL.mark(tb.l, 'sim');
  const g = $('#g-' + id); g.classList.add('ok'); g.innerHTML = `<b class="k">✓ أُنجز</b>${ar(WINMSG[id])}`;
  $(`#tabs .btn[data-id="${id}"]`).classList.add('done');
  return true;
}
function demo(host, id, run){
  const b = $('.demo-b', host), pane = $('#p-' + id);
  b.addEventListener('click', async () => {
    if (DEMO) return;
    const snap = clone(S);
    DEMO++; b.disabled = true; pane.classList.add('demoing');
    const dm = $('.demo-m', host); if (dm){ dm.className = 'msg demo-m'; dm.textContent = 'العرض يعمل: راقب الخطوات تُنفَّذ واحدة بعد الأخرى…'; }
    try { await run(); await sleep(1500); }
    catch (e){ console.warn(e); }
    finally {
      S = snap; DEMO--; rebuild(id); pane.classList.remove('demoing');
      const m = $('#p-' + id + ' .demo-m'); if (m){ m.textContent = 'انتهى العرض وأُعيد التمرين إلى حالته: نفّذه الآن بنفسك ليُحتسب.'; m.className = 'msg demo-m'; }
    }
  });
}
const sp = ms => DEMO ? ms * 0.35 : ms;
async function hl(el, ms){ if (!el) return; el.classList.add('dhl'); if (el.scrollIntoView) el.scrollIntoView({block:'nearest', behavior:'smooth'}); await sleep(ms || 520); el.classList.remove('dhl'); }
async function dClick(el, ms){ if (!el) return; await hl(el, ms); if (el.click) el.click(); else el.dispatchEvent(new MouseEvent('click', {bubbles:true})); await sleep(260); }
async function dSet(el, v, ms){ if (!el) return; el.classList.add('dhl'); if (el.scrollIntoView) el.scrollIntoView({block:'nearest', behavior:'smooth'}); await sleep(ms || 380);
  if (el.tagName === 'INPUT'){ const t = String(v); el.value = ''; for (let i = 1; i <= t.length; i++){ const part = t.slice(0, i); if (!/\.$/.test(part)){ el.value = part; await sleep(35); } } } else el.value = v;
  el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); await sleep(200); el.classList.remove('dhl'); }
const FOOT = '<div class="row keep"><button type="button" class="btn demo-b keep">▶ شاهد الحل</button><button type="button" class="btn new-b keep">محاولة جديدة بقراءات جديدة</button></div><p class="msg demo-m keep" aria-live="polite"></p>';
function bindNew(host, id, fn){ $('.new-b', host).addEventListener('click', () => { if (DEMO) return; fn(); save(); rebuild(id); }); }
const opts = (arr, cur, ph) => (ph ? `<option value="">${esc(ph)}</option>` : '') + arr.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(iso(t))}</option>`; }).join('');
const msg = (el, cls, txt) => { if (!el) return; el.className = 'msg' + (cls ? ' ' + cls : ''); el.innerHTML = txt ? ar(txt) : ''; };
const TYP = '<p class="note">قيم نموذجية للتعلّم؛ ارجع إلى المعيار المعتمد وكتيّب المصنّع.</p>';
function warn(box, txt){ if (!box) return; box.hidden = false; box.innerHTML = `<b>قف!</b> ${ar(txt)}`; clearTimeout(box._t); box._t = setTimeout(() => { box.hidden = true; }, 7000); }

/* =====================================================================
   5. SVG parts
   ===================================================================== */
function bush(x, yT, yB, w, lab, hv){
  let s = `<g><rect x="${x - w / 2}" y="${yT + 10}" width="${w}" height="${yB - yT - 10}" fill="var(--porc)"/>`;
  for (let y = yT + 15; y < yB - 4; y += hv ? 8 : 9) s += `<ellipse cx="${x}" cy="${y}" rx="${w * 0.95}" ry="3.2" fill="var(--porc-l)" stroke="var(--porc)" stroke-width="1"/>`;
  s += `<rect x="${x - w / 2 - 2}" y="${yT + 3}" width="${w + 4}" height="8" rx="2" fill="#a7adb1" stroke="#6f777c"/><rect x="${x - 2.5}" y="${yT - 6}" width="5" height="10" fill="var(--cu)"/>`;
  s += `<rect x="${x - w / 2 - 4}" y="${yB - 3}" width="${w + 8}" height="5" fill="var(--tank-d)"/>`;
  if (lab) s += `<text x="${x}" y="${yT - 10}" text-anchor="middle" font-size="12" class="tx" font-weight="600">${lab}</text>`;
  return s + '</g>';
}
function dialSvg(cx, cy, r, o){
  /* o: {min,max,v,m,al,tr,lab,unit}; 270° scale */
  const a0 = 225, span = 270, ang = v => (a0 - (IL.clamp(v, o.min, o.max) - o.min) / (o.max - o.min) * span) * Math.PI / 180;
  const P = (v, rr) => [cx + rr * Math.cos(ang(v)), cy - rr * Math.sin(ang(v))];
  let s = `<circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="#2b3237"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#f7f7f2" stroke="#9aa0a4"/>`;
  const arc = (v1, v2, col, w) => { const [x1, y1] = P(v1, r - 5), [x2, y2] = P(v2, r - 5); const lg = (v2 - v1) / (o.max - o.min) * span > 180 ? 1 : 0; return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r - 5} ${r - 5} 0 ${lg} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${w}"/>`; };
  if (o.al) s += arc(o.al, o.tr, '#f0a03c', r * 0.09) + arc(o.tr, o.max, '#d9534f', r * 0.09);
  for (let v = o.min; v <= o.max + 1e-9; v += o.step || 10){
    const big = Math.round((v - o.min) / (o.step || 10)) % (o.lbl || 2) === 0; const [x1, y1] = P(v, r - 2), [x2, y2] = P(v, r - (big ? 11 : 7));
    s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#222" stroke-width="${big ? 1.6 : 0.8}"/>`;
    if (big && o.fs){ const [tx, ty] = P(v, r - 11 - o.fs); s += `<text x="${tx.toFixed(1)}" y="${(ty + o.fs * 0.35).toFixed(1)}" font-size="${o.fs}" text-anchor="middle" fill="#222" font-family="var(--font-mono)">${v}</text>`; }
  }
  if (o.lab) s += `<text x="${cx}" y="${cy + r * 0.42}" text-anchor="middle" font-size="${Math.max(7, r * 0.2)}" fill="#222" font-weight="700" font-family="var(--font-mono)">${o.lab}</text>`;
  if (o.al){ [[o.al, '#f0a03c'], [o.tr, '#d9534f']].forEach(([v, c]) => { const [x, y] = P(v, r - 1); const [x2, y2] = P(v, r - 9); s += `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="3"/>`; }); }
  if (o.m != null){ const [x, y] = P(o.m, r * 0.82); s += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#d32f2f" stroke-width="${Math.max(1.4, r * 0.05)}" stroke-linecap="round"/>`; }
  const [x, y] = P(o.v, r * 0.86);
  s += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#111" stroke-width="${Math.max(1.8, r * 0.07)}" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="${Math.max(2.5, r * 0.09)}" fill="#111"/>`;
  return s;
}

/* =====================================================================
   TAB 1 · inspection walk-around
   ===================================================================== */
const HS = {mog:[200, 28], brt:[28, 318], leak:[548, 400], oti:[214, 326], wti:[270, 326], buch:[478, 128], bush:[150, 140], earth:[96, 446]};
function txScene(sc){
  const st = sc.st;
  let s = `<svg viewBox="0 0 600 500" role="img" aria-label="المحول T1 وملحقاته">`;
  s += `<defs><linearGradient id="tkG" x1="0" x2="1"><stop offset="0" stop-color="var(--tank-d)"/><stop offset=".25" stop-color="var(--tank-l)"/><stop offset="1" stop-color="var(--tank)"/></linearGradient>
  <linearGradient id="cnG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--tank-l)"/><stop offset="1" stop-color="var(--tank-d)"/></linearGradient></defs>`;
  s += `<rect x="0" y="470" width="600" height="30" fill="var(--line)"/><rect x="110" y="448" width="380" height="22" fill="#b8b2a6" stroke="#8f897d"/>`;
  /* radiators */
  [[96, 158], [442, 504]].forEach(([a, b]) => {
    s += `<rect x="${a}" y="226" width="${b - a}" height="8" fill="var(--tank-d)"/><rect x="${a}" y="414" width="${b - a}" height="8" fill="var(--tank-d)"/>`;
    for (let x = a + 3; x < b - 4; x += 8) s += `<rect x="${x}" y="232" width="6" height="184" fill="url(#tkG)" stroke="var(--tank-d)" stroke-width=".6"/>`;
  });
  s += `<rect x="160" y="200" width="280" height="248" fill="url(#tkG)" stroke="var(--tank-d)"/>`;
  [230, 370].forEach(x => s += `<rect x="${x}" y="204" width="6" height="240" fill="var(--tank-d)" opacity=".35"/>`);
  s += `<rect x="150" y="190" width="300" height="12" rx="2" fill="var(--tank-d)"/>`;
  /* conservator + supports + pipe + Buchholz */
  s += `<line x1="182" y1="98" x2="176" y2="190" stroke="var(--tank-d)" stroke-width="5"/><line x1="440" y1="98" x2="446" y2="190" stroke="var(--tank-d)" stroke-width="5"/>`;
  s += `<rect x="168" y="50" width="284" height="50" rx="25" fill="url(#cnG)" stroke="var(--tank-d)"/>`;
  s += `<path d="M425 100 V190" stroke="var(--tank-d)" stroke-width="8"/><rect x="410" y="124" width="30" height="30" rx="3" fill="#59646b" stroke="#3b4247"/><circle cx="425" cy="139" r="8" fill="var(--oil)" stroke="#222"/>`;
  if (st.buch === 'gas') s += `<path d="M417 139 A8 8 0 0 1 433 139 Z" fill="#e9edf0"/>`;
  /* MOG */
  s += dialSvg(200, 75, 16, {min:0, max:10, v:st.mog === 'low' ? 0.4 : 5.2, step:5, lbl:1});
  /* breather */
  s += `<path d="M178 96 H70 V292" fill="none" stroke="var(--tank-d)" stroke-width="5"/><rect x="54" y="292" width="32" height="76" rx="4" fill="#e9eef0" stroke="#6f777c"/>`;
  const wf = sc.brt; for (let y = 296; y < 364; y += 6) for (let x = 59; x < 82; x += 6){ const wet = (364 - y) / 68 < wf; s += `<circle cx="${x + 2}" cy="${y + 2}" r="2.6" fill="${wet ? 'var(--gel-w)' : 'var(--gel)'}"/>`; }
  s += `<rect x="58" y="370" width="24" height="20" rx="3" fill="#dfe6ea" stroke="#6f777c"/>${st.brt === 'cup' ? '' : '<rect x="60" y="378" width="20" height="10" fill="var(--oil)" opacity=".85"/>'}`;
  /* bushings */
  [200, 245, 290].forEach((x, i) => s += bush(x, 118, 190, 13, '', true));
  [320, 345, 370, 395].forEach(x => s += bush(x, 152, 190, 9, '', false));
  if (st.bush === 'dirty') [200, 245, 290].forEach(x => s += `<rect x="${x - 12}" y="130" width="24" height="56" fill="#555" opacity=".35"/>`);
  if (st.bush === 'crack') s += `<path d="M240 150 l6 6 l-4 5 l7 6" stroke="#111" stroke-width="1.6" fill="none"/><path d="M236 160 q4 10 0 22" stroke="#222" stroke-width="2.2" fill="none" opacity=".7"/>`;
  /* marshalling box with OTI/WTI */
  s += `<rect x="186" y="244" width="114" height="62" rx="4" fill="#d5dade" stroke="#6f777c"/>`;
  s += dialSvg(214, 274, 20, {min:0, max:150, v:sc.oti.v, m:sc.oti.m, al:OTI.al, tr:OTI.tr, step:10, lbl:5});
  s += dialSvg(270, 274, 20, {min:0, max:150, v:sc.wti.v, m:sc.wti.m, al:WTI.al, tr:WTI.tr, step:10, lbl:5});
  s += `<text x="214" y="302" font-size="8" text-anchor="middle" fill="#222" font-weight="700" font-family="var(--font-mono)">OTI</text><text x="270" y="302" font-size="8" text-anchor="middle" fill="#222" font-weight="700" font-family="var(--font-mono)">WTI</text>`;
  /* nameplate + valve */
  s += `<rect x="320" y="252" width="66" height="40" rx="3" fill="#dfe3e5" stroke="#6f777c"/>`;
  for (let i = 0; i < 4; i++) s += `<line x1="326" y1="${262 + i * 8}" x2="${376 - i * 6}" y2="${262 + i * 8}" stroke="#8a9398" stroke-width="2"/>`;
  s += `<rect x="296" y="430" width="16" height="12" fill="#59646b"/><circle cx="304" cy="436" r="9" fill="none" stroke="#c62828" stroke-width="3"/>`;
  /* leak */
  s += `<rect x="492" y="410" width="16" height="16" rx="2" fill="#59646b"/>`;
  if (st.leak !== 'ok') s += `<path d="M500 426 q-6 14 -2 22 q6 -8 2 -22z" fill="#5a3d12" opacity=".75"/><ellipse cx="503" cy="452" rx="${st.leak === 'drip' ? 20 : 9}" ry="${st.leak === 'drip' ? 5 : 3}" fill="#3e2a0c" opacity=".7"/>`;
  if (st.leak === 'drip') s += `<path d="M502 432 q-3 6 0 8 q3 -2 0 -8z" fill="#7a5418"><animateTransform attributeName="transform" type="translate" values="0 0;0 12;0 12" dur="1.4s" repeatCount="indefinite"/></path>`;
  /* earth */
  s += `<rect x="164" y="432" width="14" height="10" fill="#8a9398"/><path d="M171 442 V462 H146 V478" fill="none" stroke="#3f9b3f" stroke-width="5"/><path d="M171 442 V462 H146 V478" fill="none" stroke="#e8d23a" stroke-width="5" stroke-dasharray="7 7"/>`;
  s += `<rect x="128" y="476" width="36" height="4" fill="#59646b"/><rect x="134" y="482" width="24" height="3" fill="#59646b"/>`;
  if (st.earth === 'loose') s += `<circle cx="171" cy="437" r="7" fill="#4caf86" opacity=".7"/>`;
  /* hotspots */
  INSP.forEach((it, i) => {
    const [x, y] = HS[it.id], r = S.insp.rec[it.id], cls = r ? (r.ok ? 'ok' : 'bad') : '';
    s += `<g class="hs tgt-hs ${cls}${S.insp.cur === it.id ? ' cur' : ''}" data-pt="${it.id}" tabindex="0" role="button" aria-label="${esc(it.n)}">${r ? '' : `<circle class="pulse" cx="${x}" cy="${y}" r="15"/>`}<circle class="ring" cx="${x}" cy="${y}" r="20"/><circle class="num" cx="${x}" cy="${y}" r="13"/><text x="${x}" y="${y + 5}" text-anchor="middle">${i + 1}</text></g>`;
  });
  return s + '</svg>';
}
function closeup(id, sc){
  const st = sc.st[id];
  let s = `<svg viewBox="0 0 320 200" role="img" aria-label="${esc(INSPM[id].n)}">`;
  if (id === 'mog'){
    const lvl = st === 'low' ? 0.5 : (sc.oti.v - 20) / 60 * 10;
    s += `<rect x="30" y="14" width="260" height="172" rx="86" fill="url(#cnG2)" stroke="var(--tank-d)"/><defs><linearGradient id="cnG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--tank-l)"/><stop offset="1" stop-color="var(--tank-d)"/></linearGradient></defs>`;
    s += dialSvg(160, 100, 70, {min:0, max:10, v:lvl, step:1, lbl:5});
    s += `<text x="110" y="160" font-size="13" fill="#c62828" font-weight="700" font-family="var(--font-mono)">MIN</text><text x="180" y="160" font-size="13" fill="#c62828" font-weight="700" font-family="var(--font-mono)">MAX</text><text x="160" y="72" font-size="11" text-anchor="middle" fill="#222" font-family="var(--font-mono)">+25 °C</text>`;
    s += `<text x="160" y="196" font-size="11" text-anchor="middle" class="tm">oil (OTI) ${sc.oti.v} °C</text>`;
  } else if (id === 'brt'){
    s += `<rect x="150" y="0" width="20" height="18" fill="var(--tank-d)"/><rect x="110" y="18" width="100" height="16" rx="3" fill="#59646b"/><rect x="116" y="34" width="88" height="118" rx="6" fill="#eef3f5" stroke="#6f777c" stroke-width="2"/>`;
    const wf = sc.brt; for (let y = 38; y < 146; y += 8) for (let x = 121; x < 200; x += 8){ const wet = (148 - y) / 110 < wf; s += `<circle cx="${x + 3}" cy="${y + 3}" r="3.5" fill="${wet ? 'var(--gel-w)' : 'var(--gel)'}" stroke="rgba(0,0,0,.15)"/>`; }
    s += `<line x1="212" y1="${152 - 110 * 2 / 3}" x2="232" y2="${152 - 110 * 2 / 3}" stroke="var(--ink)" stroke-dasharray="3 2"/><text x="236" y="${156 - 110 * 2 / 3}" font-size="11" class="tx">2/3</text>`;
    s += `<rect x="110" y="152" width="100" height="10" fill="#59646b"/><rect x="122" y="162" width="76" height="34" rx="5" fill="#e3eaee" stroke="#6f777c" stroke-width="2"/>`;
    if (st !== 'cup') s += `<rect x="125" y="172" width="70" height="21" rx="3" fill="var(--oil)" opacity=".85"/>`;
    s += `<line x1="200" y1="174" x2="214" y2="174" stroke="var(--ink)"/><text x="218" y="178" font-size="10" class="tx">oil level</text>`;
    s += `<g font-family="var(--font-mono)" font-size="10"><circle cx="30" cy="40" r="6" fill="var(--gel)"/><text x="40" y="44" class="tx">dry</text><circle cx="30" cy="60" r="6" fill="var(--gel-w)" stroke="#999"/><text x="40" y="64" class="tx">saturated</text></g>`;
  } else if (id === 'leak'){
    s += `<rect x="0" y="170" width="320" height="30" fill="#b8b2a6"/>`;
    for (let x = 40; x < 280; x += 20) s += `<rect x="${x}" y="0" width="14" height="110" fill="var(--tank)" stroke="var(--tank-d)"/>`;
    s += `<rect x="30" y="104" width="260" height="16" fill="var(--tank-d)"/><rect x="140" y="118" width="40" height="30" fill="#59646b"/><rect x="130" y="126" width="60" height="10" fill="#3b4247"/>`;
    [136, 184].forEach(x => s += `<circle cx="${x}" cy="131" r="3" fill="#ccc"/>`);
    if (st !== 'ok') s += `<path d="M160 136 q-14 20 -6 34 q18 -10 6 -34z" fill="#5a3d12" opacity=".8"/><ellipse cx="160" cy="176" rx="${st === 'drip' ? 60 : 18}" ry="${st === 'drip' ? 9 : 4}" fill="#3e2a0c" opacity=".7"/>`;
    if (st === 'drip') s += `<path d="M162 146 q-5 9 0 12 q5 -3 0 -12z" fill="#7a5418"><animateTransform attributeName="transform" type="translate" values="0 0;0 20;0 20" dur="1.2s" repeatCount="indefinite"/></path>`;
  } else if (id === 'oti' || id === 'wti'){
    const o = id === 'oti' ? sc.oti : sc.wti, L = id === 'oti' ? OTI : WTI;
    s += dialSvg(160, 102, 86, {min:0, max:150, v:o.v, m:o.m, al:L.al, tr:L.tr, step:10, lbl:3, fs:11, lab:(id === 'oti' ? 'OIL' : 'WINDING') + ' °C'});
    s += `<g font-family="var(--font-mono)" font-size="10"><line x1="4" y1="14" x2="20" y2="14" stroke="#111" stroke-width="3"/><text x="24" y="18" class="tx">now</text><line x1="4" y1="30" x2="20" y2="30" stroke="#d32f2f" stroke-width="3"/><text x="24" y="34" class="tx">max</text></g>`;
  } else if (id === 'buch'){
    s += `<rect x="0" y="86" width="320" height="28" fill="var(--tank-d)"/><rect x="80" y="40" width="160" height="120" rx="8" fill="#59646b" stroke="#2b3237" stroke-width="2"/>`;
    s += `<circle cx="160" cy="100" r="40" fill="#222"/><circle cx="160" cy="100" r="34" fill="var(--oil)"/>`;
    if (st === 'gas') s += `<path d="M126 100 A34 34 0 0 1 194 100 Z" fill="#eef3f5"/><line x1="126" y1="100" x2="194" y2="100" stroke="#7a5418" stroke-width="2"/>`;
    for (let i = 0; i < 5; i++) s += `<line x1="196" y1="${74 + i * 10}" x2="204" y2="${74 + i * 10}" stroke="#fff"/>`;
    s += `<rect x="150" y="20" width="20" height="22" fill="#3b4247"/><text x="160" y="186" font-size="11" text-anchor="middle" class="tm">Buchholz · gas window</text>`;
  } else if (id === 'bush'){
    s += `<rect x="0" y="180" width="320" height="20" fill="var(--tank-d)"/>`;
    [80, 160, 240].forEach(x => {
      s += `<rect x="${x - 12}" y="40" width="24" height="140" fill="var(--porc)"/>`;
      for (let y = 50; y < 176; y += 12) s += `<ellipse cx="${x}" cy="${y}" rx="24" ry="5" fill="var(--porc-l)" stroke="var(--porc)"/>`;
      s += `<rect x="${x - 15}" y="30" width="30" height="12" rx="2" fill="#a7adb1"/><rect x="${x - 4}" y="10" width="8" height="22" fill="var(--cu)"/>`;
      if (st === 'dirty') s += `<rect x="${x - 25}" y="44" width="50" height="134" fill="#3a3a3a" opacity=".38"/>`;
    });
    if (st === 'crack') s += `<path d="M150 98 l8 4 l-3 5 l10 4 l-4 6" stroke="#111" stroke-width="2.2" fill="none"/><path d="M168 112 q6 18 -2 40 q8 10 2 24" stroke="#111" stroke-width="3" fill="none" opacity=".65"/>`;
  } else if (id === 'earth'){
    s += `<rect x="0" y="0" width="200" height="150" fill="var(--tank)" stroke="var(--tank-d)"/><rect x="0" y="150" width="320" height="50" fill="#b8b2a6"/>`;
    s += `<rect x="60" y="96" width="44" height="26" rx="2" fill="#8a9398"/>${[70, 94].map(x => `<circle cx="${x}" cy="109" r="5" fill="#ddd" stroke="#555"/>`).join('')}`;
    s += `<path d="M82 122 V170 H30" fill="none" stroke="#3f9b3f" stroke-width="10"/><path d="M82 122 V170 H30" fill="none" stroke="#e8d23a" stroke-width="10" stroke-dasharray="12 12"/>`;
    s += `<rect x="216" y="40" width="90" height="60" rx="4" fill="#d5dade" stroke="#6f777c"/><text x="261" y="56" font-size="10" text-anchor="middle" fill="#222" font-family="var(--font-mono)">N – E link</text>`;
    const loose = st === 'loose';
    s += `<rect x="230" y="66" width="62" height="12" rx="2" fill="${loose ? '#5b8f6a' : 'var(--cu)'}"/>${[240, 282].map((x, i) => `<circle cx="${x}" cy="${loose && i ? 66 : 72}" r="5" fill="#ccc" stroke="#555"/>`).join('')}`;
    if (loose) s += `<circle cx="282" cy="72" r="10" fill="#4caf86" opacity=".6"/><text x="282" y="118" font-size="10" text-anchor="middle" class="tm">gap</text>`;
    s += `<path d="M261 100 V170" stroke="#3f9b3f" stroke-width="8"/><path d="M261 100 V170" stroke="#e8d23a" stroke-width="8" stroke-dasharray="10 10"/>`;
    s += `<text x="100" y="196" font-size="11" text-anchor="middle" class="tm">tank earth</text><text x="261" y="196" font-size="11" text-anchor="middle" class="tm">neutral earth</text>`;
  }
  return s + '</svg>';
}
BUILD.inspect = host => {
  const sc = S.insp.sc;
  host.innerHTML = `
  <div class="dev keep" id="in-ppe"><label class="inl" style="flex-direction:row;justify-content:flex-start"><input type="checkbox" id="in-ppe-c" style="width:22px;height:22px"${S.insp.ppe ? ' checked' : ''}> <span>${ar('قبل الجولة: ارتديت مهمات الوقاية، وسأبقى خارج مسافة الأمان من الأطراف الحية، ولن أصعد على المحول وهو في الخدمة.')}</span></label></div>
  <div class="warnbox" id="in-w" hidden></div>
  <div class="grid2">
    <div class="svgw" id="in-svg"></div>
    <div class="dev" id="in-card"></div>
  </div>
  <div class="ptlist" id="in-list"></div>
  <div class="dev"><h3>سجل الجولة</h3><div class="tblw rt" style="direction:rtl"><table class="tbl hm" style="direction:rtl"><thead><tr><th class="ar">#</th><th class="ar">النقطة</th><th class="ar">الملاحظة</th><th class="ar">الإجراء</th></tr></thead><tbody id="in-log"></tbody></table></div>
  ${TYP.replace('</p>', ' ' + ar('حدود OTI 85/95 °C و WTI 105/115 °C قيم ضبط نموذجية.') + '</p>')}</div>
  ${FOOT}`;
  const W = $('#in-w', host);
  function draw(){
    $('#in-svg', host).innerHTML = txScene(sc);
    $('#in-list', host).innerHTML = INSP.map((it, i) => { const r = S.insp.rec[it.id]; return `<button type="button" class="btn ${r ? (r.ok ? 'ok' : 'bad') : ''}" data-pt="${it.id}"${S.insp.cur === it.id ? ' aria-pressed="true"' : ''}><i>${i + 1}</i>${esc(it.n)}</button>`; }).join('');
    $('#in-log', host).innerHTML = INSP.map((it, i) => { const r = S.insp.rec[it.id]; return `<tr><td class="ar">${i + 1}</td><td class="ar">${esc(it.n)}</td><td class="ar ${r ? (r.fok ? 'ok' : 'bad') : ''}" style="white-space:normal;min-width:150px">${r ? esc(it.F[r.f]) : '—'}</td><td class="ar ${r ? (r.aok ? 'ok' : 'bad') : ''}" style="white-space:normal;min-width:180px">${r ? esc(it.A[r.a]) : '—'}</td></tr>`; }).join('');
    card();
  }
  function card(){
    const c = $('#in-card', host), id = S.insp.cur;
    if (!id){ c.innerHTML = `<h3>اختر نقطة تفتيش</h3><p class="note">${ar('اضغط رقمًا على المحول أو من القائمة أسفله لترى النقطة عن قرب. سجّل لكل نقطة ما تراه والإجراء المناسب.')}</p><div class="rd"><div><span>النقاط المسجّلة</span><b>${Object.values(S.insp.rec).filter(r => r.ok).length} / 8</b></div><div><span>حرارة الهواء</span><b>32 °C</b></div><div><span>الحمل الآن</span><b>≈ 68 %</b></div></div>`; c.className = 'dev'; return; }
    const it = INSPM[id], r = S.insp.rec[id] || {};
    c.className = 'dev' + (r.ok ? ' ok' : r.f != null ? ' bad' : '');
    c.innerHTML = `<h3><span class="tag">${INSP.indexOf(it) + 1}</span>${esc(it.n)}</h3><div class="svgw">${closeup(id, sc)}</div><p class="note">${ar(it.hint)}</p>
      <label>الملاحظة<select data-k="f">${opts(it.F.map((t, i) => [i, t]), r.f != null ? r.f : '', 'اختر ما تراه…')}</select></label>
      <label>الإجراء<select data-k="a">${opts(it.A.map((t, i) => [i, t]), r.a != null ? r.a : '', 'اختر الإجراء…')}</select></label>
      <div class="row"><button type="button" class="btn pri" id="in-rec">سجّل في السجل</button></div><p class="msg" id="in-m" aria-live="polite"></p>`;
    if (r.f != null) feedback(id);
    $('#in-rec', c).addEventListener('click', () => {
      const f = $('[data-k="f"]', c).value, a = $('[data-k="a"]', c).value, m = $('#in-m', c);
      if (f === '' || a === ''){ msg(m, 'bad', 'اختر الملاحظة والإجراء أولًا.'); return; }
      const [cf, ca] = it.st[sc.st[id]];
      S.insp.rec[id] = {f:+f, a:+a, fok:+f === cf, aok:+a === ca, ok:+f === cf && +a === ca};
      save(); draw(); check();
    });
  }
  function feedback(id){
    const it = INSPM[id], r = S.insp.rec[id], m = $('#in-m', host), stt = sc.st[id];
    if (r.ok) msg(m, 'ok', stt === 'ok' ? 'صحيح: النقطة سليمة وسُجّلت.' : 'صحيح. ' + it.why[stt]);
    else if (!r.fok) msg(m, 'bad', 'الملاحظة غير صحيحة: ' + it.hint);
    else msg(m, 'bad', 'الملاحظة صحيحة لكن الإجراء غير مناسب: ' + (stt === 'ok' ? 'النقطة سليمة فلا تحتاج إلا التسجيل.' : it.why[stt]));
  }
  function open(id){
    if (!S.insp.ppe){ warn(W, 'قبل الجولة ارتدِ مهمات الوقاية وحدّد مسافة الأمان؛ المحول في الخدمة وأطرافه حية. أكّد البند أعلى الصفحة.'); hl($('#in-ppe', host)); return; }
    S.insp.cur = id; save(); draw();
    if (matchMedia('(max-width:700px)').matches) $('#in-card', host).scrollIntoView({block:'start', behavior:DEMO ? 'smooth' : 'auto'});
  }
  function check(){ if (INSP.every(it => S.insp.rec[it.id] && S.insp.rec[it.id].ok)) win('inspect'); }
  IL.onAct(host, '[data-pt]', t => open(t.dataset.pt));
  $('#in-ppe-c', host).addEventListener('change', e => { S.insp.ppe = e.target.checked; save(); if (S.insp.ppe) W.hidden = true; });
  draw();
  bindNew(host, 'inspect', () => { S.insp = {sc:newInsp(), ppe:S.insp.ppe, cur:'', rec:{}}; });
  demo(host, 'inspect', async () => {
    S.insp.rec = {}; S.insp.cur = ''; S.insp.ppe = false; $('#in-ppe-c', host).checked = false; draw();
    await dClick($('#in-ppe-c', host));
    for (const it of INSP){
      await dClick($(`#in-svg [data-pt="${it.id}"]`, host), 420);
      const [cf, ca] = it.st[sc.st[it.id]];
      await dSet($('#in-card [data-k="f"]', host), cf); await dSet($('#in-card [data-k="a"]', host), ca);
      await dClick($('#in-rec', host)); await sleep(700);
    }
  });
};

/* =====================================================================
   TAB 2 · electrical tests (isolation · TTR · winding R · IR/PI · vector group)
   ===================================================================== */
const SAFE = [
  {t:'افصل قاطع الجهد المنخفض ACB لإزالة الحمل', w:'ابدأ بفصل قاطع LV لإزالة الحمل قبل أي شيء؛ لا تفصل مفتاح HV والمحول محمّل.'},
  {t:'افصل مفتاح الجهد المتوسط HV في وحدة RMU', w:'المحول ما زال مغذّى من جهة HV؛ افصل مفتاح RMU الآن.'},
  {t:'اقفل المفتاحين وعلّق بطاقات التحذير (LOTO)', w:'اقفل المفاتيح وعلّق البطاقات قبل الاقتراب، حتى لا يعيد أحد التغذية دون علمك.'},
  {t:'تحقّق من انعدام الجهد على أطراف HV و LV بكاشف مناسب', w:'لا تلمس الأطراف ولا تؤرّضها قبل التحقق من انعدام الجهد.'},
  {t:'أرّض أطراف HV و LV بأسلاك تأريض مؤقتة', w:'أرّض الأطراف قبل فك الكابلات؛ الشحنة المتبقية والجهد المستحث خطران.'},
  {t:'افصل كابلات HV وقضبان LV عن عوازل المحول', w:'افصل الكابلات والقضبان حتى لا تدخل في القياس ولا تُغذّى منه.'}
];
const SUBS = [['safe', 'العزل والإقفال'], ['ttr', 'TTR'], ['wr', 'مقاومة الملفات'], ['ir', 'العزل و PI'], ['vg', 'مجموعة التوصيل']];
const TG = {'1U':[80, 46], '1V':[140, 46], '1W':[200, 46], '2N':[255, 98], '2U':[290, 98], '2V':[325, 98], '2W':[360, 98], 'PE':[372, 226]};
const HVT = ['1U', '1V', '1W'], LVT = ['2N', '2U', '2V', '2W'];
const INST = {
  ttr:{n:'TTR 3-phase', body:'#5d6870', leads:[['H1', '#c62828', 52], ['H2', '#c62828', 100], ['H3', '#c62828', 148], ['X0', '#222', 210], ['X1', '#222', 258], ['X2', '#222', 306], ['X3', '#222', 354]]},
  wr:{n:'WINDING RESISTANCE METER 10 A', body:'#3b4a55', leads:[['P', '#c62828', 120, 'I+ V+'], ['N', '#222', 300, 'I− V−']]},
  ir:{n:'INSULATION TESTER 5 kV', body:'#f2c230', leads:[['LINE', '#c62828', 80], ['GUARD', '#2e7d32', 200], ['EARTH', '#222', 330]]},
  vg:{n:'3~ 400 V TEST SUPPLY  ·  VOLTMETER', body:'#4a5560', leads:[['L1', '#8a5a2b', 50], ['L2', '#222', 95], ['L3', '#8d969b', 140], ['V+', '#c62828', 290], ['COM', '#222', 350]]}
};
BUILD.tests = host => {
  const T = S.tests, sc = T.sc;
  const isSafe = () => T.safe.length === SAFE.length;
  host.innerHTML = `<div class="sub" role="tablist" id="ts-sub">${SUBS.map(([k, t]) => `<button type="button" class="btn${T.done[k] ? ' done' : ''}" data-sub="${k}">${esc(t)}</button>`).join('')}</div>
    <div class="warnbox" id="ts-w" hidden></div><div id="ts-body"></div>${FOOT}`;
  const W = $('#ts-w', host);
  let L = {}, armed = '', busy = '', charged = false, lcd = {}, vgOn = false;
  function setSub(k){ T.sub = k; save(); armed = ''; L = {}; vgOn = false; charged = false; $$('#ts-sub .btn', host).forEach(b => b.setAttribute('aria-selected', b.dataset.sub === k ? 'true' : 'false')); renderSub(); }
  function markDone(k){ if (DEMO && false) return; T.done[k] = true; save(); $(`#ts-sub [data-sub="${k}"]`, host).classList.add('done'); if (SUBS.every(([s]) => T.done[s])) win('tests'); }

  /* ---------- the bench scene ---------- */
  function scene(kind){
    const I = INST[kind];
    let s = `<svg viewBox="0 0 420 570" role="img" aria-label="المحول T1 وجهاز الاختبار" id="ts-scene" class="${armed ? 'arming' : ''}">`;
    s += `<rect x="20" y="150" width="380" height="12" rx="2" fill="var(--tank-d)"/><rect x="30" y="162" width="360" height="98" fill="var(--tank)" stroke="var(--tank-d)"/>`;
    for (let x = 40; x < 380; x += 12) s += `<rect x="${x}" y="200" width="7" height="60" fill="var(--tank-d)" opacity=".25"/>`;
    if (!isSafe()){
      HVT.forEach(t => s += `<path d="M${TG[t][0]} ${TG[t][1] - 4} V0" stroke="#111" stroke-width="9"/>`);
      LVT.forEach(t => s += `<path d="M${TG[t][0]} ${TG[t][1] - 4} V0" stroke="var(--cu)" stroke-width="7"/>`);
    }
    HVT.forEach(t => s += bush(TG[t][0], 50, 150, 16, t, true));
    LVT.forEach(t => s += bush(TG[t][0], 102, 150, 11, t, false));
    if (T.links.hvs) s += `<path d="M80 44 H200" stroke="var(--cu)" stroke-width="3"/>`;
    if (T.links.lvs) s += `<path d="M255 96 H360" stroke="var(--cu)" stroke-width="3"/>`;
    const gy = (d) => `<path d="${d}" fill="none" stroke="#3f9b3f" stroke-width="3"/><path d="${d}" fill="none" stroke="#e8d23a" stroke-width="3" stroke-dasharray="5 5"/>`;
    if (T.links.hve) s += gy('M200 44 Q232 120 232 175 T372 226');
    if (T.links.lve) s += gy('M360 96 Q400 120 395 180 T372 226');
    if (T.links.jmp) s += `<path d="M80 44 Q170 -6 290 96" fill="none" stroke="#7b4fc9" stroke-width="3"/>`;
    /* tap changer */
    const tp = T.tap; s += `<g class="btnS" id="ts-tapw"><circle cx="150" cy="215" r="24" fill="#59646b" stroke="#2b3237" stroke-width="2"/>`;
    TAPS.forEach((t, i) => { const a = (150 - i * 30) * Math.PI / 180; s += `<text x="${150 + 33 * Math.cos(a)}" y="${215 - 33 * Math.sin(a) + 4}" font-size="11" text-anchor="middle" class="tx" font-weight="${t === tp ? 700 : 400}">${t}</text>`; });
    const aa = (150 - (tp - 1) * 30) * Math.PI / 180; s += `<line x1="150" y1="215" x2="${150 + 20 * Math.cos(aa)}" y2="${215 - 20 * Math.sin(aa)}" stroke="#ffd27a" stroke-width="5" stroke-linecap="round"/><text x="150" y="254" font-size="10" text-anchor="middle" class="tx">TAP</text></g>`;
    s += `<g><circle cx="372" cy="226" r="9" fill="#8a9398" stroke="#2b3237"/><path d="M366 240 h12 M368 244 h8 M370 248 h4" stroke="var(--ink)" stroke-width="1.5"/><text x="350" y="230" font-size="11" text-anchor="end" class="tx" font-weight="600">PE</text></g>`;
    if (!isSafe()) s += `<g><rect x="250" y="168" width="130" height="24" rx="4" fill="#d32f2f"/><text x="315" y="185" font-size="12" text-anchor="middle" fill="#fff" font-weight="700" font-family="var(--font-mono)">⚠ LIVE 11 kV</text></g>`;
    /* instrument */
    s += `<rect x="16" y="330" width="388" height="232" rx="14" fill="${I.body}" stroke="rgba(0,0,0,.4)" stroke-width="2"/><rect x="26" y="340" width="368" height="212" rx="8" fill="#2b3237"/>`;
    s += `<text x="210" y="546" font-size="11" text-anchor="middle" class="wt" letter-spacing="1">${I.n}</text>`;
    s += instFace(kind);
    I.leads.forEach(([id, col, x, lb]) => s += `<circle cx="${x}" cy="356" r="9" fill="#111" stroke="#888"/><circle cx="${x}" cy="356" r="4" fill="${col === '#222' ? '#555' : col}"/><text x="${x}" y="380" font-size="10" text-anchor="middle" class="wt">${lb || id}</text>`);
    /* targets */
    Object.keys(TG).forEach(t => s += `<g class="tgt" data-tgt="${t}"><circle class="hit" cx="${TG[t][0]}" cy="${TG[t][1]}" r="17"/></g>`);
    s += `<g id="ts-leads">${leadsSvg(kind)}</g>`;
    return s + '</svg>';
  }
  function plugPos(kind, id){
    const I = INST[kind], ld = I.leads.find(l => l[0] === id), t = L[id];
    if (!t) return [ld[2], 306];
    const same = I.leads.filter(l => L[l[0]] === t).map(l => l[0]), k = same.indexOf(id);
    return [TG[t][0] + (k - (same.length - 1) / 2) * 16, TG[t][1] + 16];
  }
  const cab = (sx, px, py) => `M${sx} 356 C${sx} 280 ${px} ${py + 90} ${px} ${py}`;
  function leadsSvg(kind){
    return INST[kind].leads.map(([id, col, x]) => {
      const [px, py] = plugPos(kind, id);
      return `<path class="cable" data-cab="${id}" d="${cab(x, px, py)}" stroke="${col}" opacity=".92"/><g class="plug${armed === id ? ' arm' : ''}" data-plug="${id}" transform="translate(${px} ${py})" tabindex="0" role="button" aria-label="${id}"><circle class="pb" r="11" fill="${col}" stroke="#fff" stroke-width="2"/><rect x="-4" y="-17" width="8" height="8" fill="#9aa0a4"/><text y="4" text-anchor="middle" font-size="${id.length > 3 ? 6.5 : 8}" fill="#fff" font-weight="700" font-family="var(--font-mono)">${id}</text></g>`;
    }).join('');
  }
  function instFace(kind){
    let s = `<rect x="40" y="392" width="230" height="96" rx="6" fill="var(--lcd)" stroke="#111" stroke-width="2"/>`;
    s += [0, 1, 2, 3].map(i => `<text class="lc" id="lcd${i}" x="50" y="${416 + i * 21}" font-size="${i ? 13 : 15}">${esc(lcd[i] || '')}</text>`).join('');
    if (kind === 'ir'){
      s += `<path d="M290 470 A62 62 0 0 1 394 470" fill="none" stroke="#eee" stroke-width="2"/>`;
      ['1M', '10M', '100M', '1G', '10G', '100G'].forEach((t, i) => { const a = Math.PI - i / 5 * Math.PI * 0.62 - Math.PI * 0.19; s += `<text x="${342 + 70 * Math.cos(a)}" y="${478 - 70 * Math.sin(a)}" font-size="8.5" text-anchor="middle" class="wt">${t}</text>`; });
      s += `<g id="ir-ndl" transform="rotate(${lcd.ang || -55} 342 478)"><line x1="342" y1="478" x2="342" y2="410" stroke="#ff5a3c" stroke-width="2.5"/></g><circle cx="342" cy="478" r="5" fill="#eee"/>`;
      s += `<circle cx="342" cy="512" r="9" fill="${charged ? '#ff3b30' : '#444'}" stroke="#111"/><text x="358" y="516" font-size="9" class="wt">HV</text>`;
    } else if (kind === 'ttr' || kind === 'wr'){
      s += `<circle cx="340" cy="440" r="26" fill="#1f2529" stroke="#777"/><text x="340" y="444" font-size="11" text-anchor="middle" class="wt">${kind === 'wr' ? '10 A' : '80 V'}</text>`;
      s += `<circle cx="300" cy="505" r="6" fill="${busy ? '#4cd964' : '#444'}"/><text x="312" y="509" font-size="9" class="wt">${kind === 'wr' && busy === 'dis' ? 'DISCHARGING' : 'TEST'}</text>`;
    } else if (kind === 'vg'){
      s += `<rect x="290" y="396" width="94" height="58" rx="6" fill="#f2c230" stroke="#111"/><rect x="298" y="404" width="78" height="26" rx="3" fill="var(--lcd)"/><text class="lc" id="vm" x="372" y="423" font-size="15" text-anchor="end">${esc(lcd.vm || '---')}</text><text x="337" y="447" font-size="9" text-anchor="middle" fill="#111" font-family="var(--font-mono)">V AC</text>`;
      s += `<circle cx="70" cy="505" r="7" fill="${vgOn ? '#4cd964' : '#444'}"/><text x="84" y="509" font-size="9" class="wt">${vgOn ? 'ON 400 V' : 'OFF'}</text>`;
    }
    return s;
  }
  function setLcd(lines){ lines.forEach((t, i) => { lcd[i] = t; const e = $('#lcd' + i, host); if (e) e.textContent = t; }); }
  function drawScene(){ const k = T.sub; const w = $('#ts-sv', host); if (w) w.innerHTML = scene(k); }
  function bindScene(kind){
    const w = $('#ts-sv', host);
    let drag = null, skip = 0;
    const pt = e => { const svg = $('svg', w), p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const r = p.matrixTransform(svg.getScreenCTM().inverse()); return [r.x, r.y]; };
    w.addEventListener('pointerdown', e => {
      const g = e.target.closest('[data-plug]'); if (!g){ skip = 0; return; }
      e.preventDefault(); drag = {id:g.dataset.plug, p0:pt(e), moved:false, g};
      try { w.setPointerCapture(e.pointerId); } catch (er){}
    });
    w.addEventListener('pointermove', e => {
      if (!drag) return; const p = pt(e);
      if (!drag.moved && Math.hypot(p[0] - drag.p0[0], p[1] - drag.p0[1]) < 6) return;
      if (!drag.moved){ if (!canMove(drag.id)){ drag = null; return; } drag.moved = true; }
      drag.g.setAttribute('transform', `translate(${p[0]} ${p[1]})`);
      const ld = INST[kind].leads.find(l => l[0] === drag.id); $(`[data-cab="${drag.id}"]`, w).setAttribute('d', cab(ld[2], p[0], p[1]));
    });
    w.addEventListener('pointerup', e => {
      if (!drag) return; const d = drag; drag = null; skip = Date.now();
      if (!d.moved){ if (armed && armed !== d.id && L[d.id]){ connect(armed, L[d.id]); return; } if (armed !== d.id && !canMove(d.id)) return; armed = armed === d.id ? '' : d.id; drawScene(); return; }
      const p = pt(e); let best = '', bd = 30;
      Object.keys(TG).forEach(t => { const dd = Math.hypot(TG[t][0] - p[0], TG[t][1] + 10 - p[1]); if (dd < bd){ bd = dd; best = t; } });
      if (best) connect(d.id, best); else { L[d.id] = ''; drawScene(); }
    });
    w.addEventListener('click', e => {
      if (Date.now() - skip < 350) return;
      const t = e.target.closest('[data-tgt]');
      if (t && armed){ connect(armed, t.dataset.tgt); return; }
      if (e.target.closest('#ts-tapw')){ setTap(T.tap % 5 + 1); return; }
      if (armed && !e.target.closest('[data-plug]') && e.target.closest('svg')){ const a = armed; armed = ''; if (L[a] && canMove(a)) L[a] = ''; drawScene(); }
    });
    w.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-plug]')){ e.preventDefault(); const id = e.target.closest('[data-plug]').dataset.plug; armed = armed === id ? '' : id; drawScene(); } });
  }
  function canMove(id){
    if (!isSafe()){ warn(W, 'المحول ما زال في الخدمة؛ لا توصل أي طرف قبل إكمال خطوات العزل والإقفال في التبويب «العزل والإقفال».'); return false; }
    if (busy){ warn(W, busy === 'dis' ? 'الجهاز يفرّغ طاقة الملف الآن؛ انتظر حتى تنتهي قبل فك أي طرف.' : 'الاختبار يعمل؛ لا تحرّك الأطراف أثناءه.'); return false; }
    if (charged){ warn(W, 'الملف ما زال مشحونًا من اختبار العزل؛ اضغط «فرّغ الشحنة» قبل فك أي طرف.'); return false; }
    if (vgOn && ['L1', 'L2', 'L3'].includes(id)){ warn(W, 'مصدر الاختبار يعمل؛ افصله قبل تحريك أطرافه.'); return false; }
    return true;
  }
  function connect(id, t){ if (!canMove(id)){ armed = ''; drawScene(); return; } L[id] = t; armed = ''; drawScene(); if (G.tests.onConn) G.tests.onConn(); }
  async function demoConn(id, t){ const p = $(`[data-plug="${id}"]`, host); await hl(p, 300); armed = id; drawScene(); await hl($(`[data-tgt="${t}"] .hit`, host), 300); connect(id, t); await sleep(180); }
  function setTap(t){
    if (!isSafe()){ warn(W, 'لا تحرّك مبدّل الجهد والمحول في الخدمة؛ هو مبدّل «دون حمل» يُشغَّل والمحول معزول فقط.'); return; }
    if (busy){ warn(W, 'انتظر انتهاء الاختبار قبل تغيير الوضع.'); return; }
    T.tap = t; save(); drawScene(); if (G.tests.onTap) G.tests.onTap();
  }
  function needLeads(map){ for (const [id, t] of Object.entries(map)){ if (L[id] !== t){ return `الطرف ${id} ${L[id] ? 'موصول على ' + L[id] : 'غير موصول'}؛ صِله إلى ${t}.`; } } return ''; }
  function linksOff(){ if (T.links.hvs || T.links.lvs || T.links.hve || T.links.lve || T.links.jmp) return 'أزل وصلات القصر والتأريض والجسر من الأطراف قبل هذا الاختبار؛ فهي تقصر الملفات.'; return ''; }
  const ALLINK = [['hvs', 'قصر أطراف HV'], ['lvs', 'قصر أطراف LV'], ['hve', 'ربط HV بالأرضي PE'], ['lve', 'ربط LV بالأرضي PE'], ['jmp', 'جسر 1U–2U']];
  const linkBtns = keys => `<p class="note" style="margin-top:4px">الوصلات على الأطراف:</p>`+`<div class="row">${keys.map(([k, t]) => `<button type="button" class="btn" data-link="${k}" aria-pressed="${T.links[k] ? 'true' : 'false'}">${ar(t)}</button>`).join('')}</div>`;
  const tapBtns = () => `<div class="row"><span class="note">وضع مبدّل الجهد:</span><div class="row" role="group">${TAPS.map(t => `<button type="button" class="btn" data-tap="${t}" aria-pressed="${T.tap === t ? 'true' : 'false'}" style="min-width:44px">${t}</button>`).join('')}</div></div>`;
  function wrap(kind, side){ return `<div class="grid2"><div class="svgw scene" id="ts-sv"></div><div class="dev" id="ts-side">${side}</div></div>`; }
  function common(){
    const b = $('#ts-body', host);
    IL.onAct(b, '[data-tap]', t => { setTap(+t.dataset.tap); $$('[data-tap]', b).forEach(x => x.setAttribute('aria-pressed', +x.dataset.tap === T.tap ? 'true' : 'false')); });
    IL.onAct(b, '[data-link]', t => {
      if (!isSafe()){ warn(W, 'لا تركّب وصلات على أطراف محول في الخدمة؛ أكمل العزل أولًا.'); return; }
      if (busy || charged){ warn(W, charged ? 'فرّغ الشحنة أولًا قبل تغيير الوصلات.' : 'انتظر انتهاء الاختبار.'); return; }
      if (vgOn){ warn(W, 'افصل مصدر الاختبار قبل تغيير الوصلات.'); return; }
      T.links[t.dataset.link] = !T.links[t.dataset.link]; save(); t.setAttribute('aria-pressed', T.links[t.dataset.link] ? 'true' : 'false'); drawScene();
    });
  }
  const T_ = () => sc.T;
  const tempLine = () => `<div class="rd"><div><span>حرارة الزيت (OTI)</span><b>${sc.T} °C</b></div><div><span>مفصول منذ</span><b>12 h</b></div></div><p class="note">${ar('بعد فصل طويل تكون حرارة الملفات مساوية تقريبًا لحرارة الزيت، فاستخدمها في التصحيح.')}</p>`;

  /* ---------- sub: safety ---------- */
  function subSafe(){
    const b = $('#ts-body', host);
    const pool = G.tests.pool || (G.tests.pool = shuffle(SAFE.map((_, i) => i)));
    b.innerHTML = `<div class="grid2"><div class="dev"><h3>اختر الخطوة التالية</h3><div class="pick" id="sf-pick"></div></div>
      <div class="dev ${isSafe() ? 'ok' : ''}"><h3>الخطوات المنفّذة</h3><ol class="steps" id="sf-done"></ol><p class="msg" id="sf-m" aria-live="polite"></p></div></div>`;
    function draw(){
      $('#sf-pick', b).innerHTML = pool.filter(i => !T.safe.includes(i)).map(i => `<button type="button" class="btn" data-sf="${i}">${ar(SAFE[i].t)}</button>`).join('') || `<p class="note">${ar('كل الخطوات نُفّذت. المحول معزول ومؤرّض، وكابلاته مفصولة. ارفع التأريض المؤقت عن الأطراف التي تختبرها فقط، وأعده بعد الاختبار.')}</p>`;
      $('#sf-done', b).innerHTML = T.safe.map((i, k) => `<li><b>${k + 1}</b><span>${ar(SAFE[i].t)}</span></li>`).join('');
    }
    IL.onAct(b, '[data-sf]', t => {
      const i = +t.dataset.sf, exp = T.safe.length;
      if (i !== exp){ warn(W, SAFE[exp].w); msg($('#sf-m', b), 'bad', 'ترتيب غير صحيح: ' + SAFE[exp].w); return; }
      T.safe.push(i); save(); draw(); msg($('#sf-m', b), 'ok', isSafe() ? 'المحول معزول بأمان. انتقل إلى الاختبارات.' : 'صحيح.');
      if (isSafe()) markDone('safe');
    });
    draw();
  }

  /* ---------- sub: TTR ---------- */
  function ttrRead(tap, ph){
    const t = sc.ttr; let e = t.noise[tap - 1][ph];
    if (t.type === 'turn' && ph === t.ph) e += t.mag;
    if (t.type === 'tapc' && tap === t.tap) e += t.mag * [1, 0.9, 1.1][ph];
    const iex = t.iex[ph] * (t.type === 'turn' && ph === t.ph ? 7.5 : 1) * (1 + (3 - tap) * 0.05);
    const pd = (t.type === 'turn' && ph === t.ph ? 0.18 : 0.02) * (1 + Math.abs(t.noise[tap - 1][ph]) * 3);
    return {r:ttrNom(tap) * (1 + e / 100), i:iex, d:pd};
  }
  const TTR_V = [['ok', 'كل القراءات ضمن ±0.5 %: النسبة سليمة']].concat([0, 1, 2].map(p => ['turn' + p, `الطور ${'ABC'[p]} خارج الحد في كل الأوضاع: قصر لفات محتمل`])).concat(TAPS.map(t => ['tapc' + t, `كل الأطوار خارج الحد في الوضع ${t} فقط: عيب في مبدّل الجهد`]));
  const ttrAns = () => sc.ttr.type === 'ok' ? 'ok' : sc.ttr.type === 'turn' ? 'turn' + sc.ttr.ph : 'tapc' + sc.ttr.tap;
  function subTTR(){
    const b = $('#ts-body', host), R = T.ttr;
    b.innerHTML = wrap('ttr', `<h3>نسبة التحويل TTR</h3><p class="note">${ar('صِل H1 H2 H3 إلى 1U 1V 1W و X0 X1 X2 X3 إلى 2N 2U 2V 2W، ثم اختبر كل وضع. يقيس الجهاز الأطوار الثلاثة: 1U-1V/2U-2N و 1V-1W/2V-2N و 1W-1U/2W-2N.')}</p>
      ${linkBtns(ALLINK)}${tapBtns()}<div class="row"><button type="button" class="btn pri" id="ttr-go">TEST</button></div>
      <div class="fx">n<sub>nom</sub> = U<sub>HV,LL</sub> / (400/√3)<br>e% = (n<sub>meas</sub> − n<sub>nom</sub>) / n<sub>nom</sub> × 100 · limit ±0.5 %</div>
      <div class="tblw"><table class="tbl hm"><thead><tr><th>Tap</th><th>U HV (V)</th><th>n nom (أدخل)</th><th>A</th><th>B</th><th>C</th></tr></thead><tbody id="ttr-tb"></tbody></table></div>
      <div class="note" id="ttr-iex"></div>
      <label>الحكم<select id="ttr-v">${opts(TTR_V, R.verdict, 'اختر الحكم…')}</select></label><p class="msg" id="ttr-m" aria-live="polite"></p>${TYP}`);
    $('#ts-sv', b).innerHTML = scene('ttr'); bindScene('ttr'); common();
    function table(){
      $('#ttr-tb', b).innerHTML = TAPS.map(t => {
        const m = R.meas[t], nv = num(R.nom[t] || ''), nok = near(nv, ttrNom(t), 0.0006);
        const cell = p => { if (!m) return '<td>—</td>'; const r = m[p].r; if (!nok) return `<td>${f3(r)}</td>`; const e = ttrErr(r, nv); return `<td class="${Math.abs(e) > 0.5 ? 'bad' : 'ok'}">${f3(r)}<br><small>${e >= 0 ? '+' : ''}${f2(e)} %</small></td>`; };
        return `<tr class="${t === T.tap ? 'hl' : ''}"><td>${t}</td><td>${f0(tapV(t))}</td><td><input type="number" step="0.01" inputmode="decimal" data-nom="${t}" value="${esc(R.nom[t] || '')}" style="width:6.5em;min-height:36px" aria-label="n nom tap ${t}">${R.nom[t] ? (nok ? ' <span class="ok">✓</span>' : ' <span class="bad">✗</span>') : ''}</td>${cell(0)}${cell(1)}${cell(2)}</tr>`;
      }).join('');
      const m = R.meas[T.tap];
      $('#ttr-iex', b).innerHTML = m ? `${ar(`تيار المغنطة Iex عند الوضع ${T.tap} (الطور الأوسط B أقل عادة):`)}<span class="rd" style="margin-top:4px">${[0, 1, 2].map(p => `<div><span>${'ABC'[p]}</span><b>${f1(m[p].i)} mA</b></div>`).join('')}</span>` : '';
    }
    b.addEventListener('change', e => {
      const n = e.target.closest('[data-nom]'); if (n){ R.nom[n.dataset.nom] = n.value; save(); table(); const t = +n.dataset.nom; if (n.value && !near(num(n.value), ttrNom(t), 0.0006)) msg($('#ttr-m', b), 'bad', `n للوضع ${t} = ${f0(tapV(t))} / (400/√3) = ${f0(tapV(t))} / 230.94؛ راجع الحساب.`); else msg($('#ttr-m', b)); judge(); }
      if (e.target.id === 'ttr-v'){ R.verdict = e.target.value; save(); judge(true); }
    });
    G.tests.onTap = () => table();
    $('#ttr-go', b).addEventListener('click', async () => {
      if (busy) return;
      if (!isSafe()){ warn(W, 'المحول ما زال في الخدمة؛ نفّذ خطوات العزل والإقفال أولًا.'); return; }
      const lk = linksOff(); if (lk){ warn(W, lk); return; }
      const nl = needLeads({H1:'1U', H2:'1V', H3:'1W', X0:'2N', X1:'2U', X2:'2V', X3:'2W'}); if (nl){ warn(W, nl); return; }
      busy = 'run'; drawScene(); const tap = T.tap, res = [];
      for (let p = 0; p < 3; p++){
        const rd = ttrRead(tap, p);
        for (let k = 0; k < 8; k++){ setLcd([`TAP ${tap}  PHASE ${'ABC'[p]}`, `n = ${f3(rd.r * (1 + (Math.random() - 0.5) * 0.02 * (8 - k) / 8))}`, `Iex = ${f1(rd.i * (0.8 + k * 0.025))} mA`, 'measuring…']); await sleep(sp(110)); }
        setLcd([`TAP ${tap}  PHASE ${'ABC'[p]}`, `n = ${f3(rd.r)}`, `Iex = ${f1(rd.i)} mA`, `δ = ${f2(rd.d)}°`]); res.push(rd); await sleep(sp(380));
      }
      busy = ''; R.meas[tap] = res; save(); drawScene(); table(); judge();
      msg($('#ttr-m', b), '', Object.keys(R.meas).length < 5 ? `سُجّلت قراءات الوضع ${tap}. غيّر الوضع واختبر البقية.` : 'اكتملت القراءات للأوضاع الخمسة؛ أكمل النسب الاسمية واحكم.');
    });
    function judge(say){
      const m = $('#ttr-m', b); if (!R.verdict) return;
      const allM = TAPS.every(t => R.meas[t]), allN = TAPS.every(t => near(num(R.nom[t] || ''), ttrNom(t), 0.0006));
      if (!allM){ if (say) msg(m, 'bad', 'اختبر الأوضاع الخمسة كلها قبل الحكم.'); return; }
      if (!allN){ if (say) msg(m, 'bad', 'أدخل النسبة الاسمية الصحيحة لكل وضع حتى تحسب الخطأ e%.'); return; }
      if (R.verdict === ttrAns()){ msg(m, 'ok', sc.ttr.type === 'ok' ? 'صحيح: أكبر خطأ أقل من 0.5 %؛ النسبة سليمة في كل الأوضاع.' : sc.ttr.type === 'turn' ? `صحيح: الطور ${'ABC'[sc.ttr.ph]} منخفض النسبة في كل الأوضاع وتيار مغنطته مرتفع: قصر لفات؛ لا يُعاد تشغيل المحول.` : `صحيح: الخطأ يظهر في الوضع ${sc.ttr.tap} وحده؛ افحص تلامسات مبدّل الجهد عند هذا الوضع.`); markDone('ttr'); }
      else msg(m, 'bad', 'الحكم لا يطابق الجدول: ابحث عن الخلايا الحمراء (|e| > 0.5 %)، هل هي في طور واحد عبر كل الأوضاع أم في وضع واحد عبر كل الأطوار؟');
    }
    table(); judge();
    return async () => {
      for (const [id, t] of [['H1', '1U'], ['H2', '1V'], ['H3', '1W'], ['X0', '2N'], ['X1', '2U'], ['X2', '2V'], ['X3', '2W']]) await demoConn(id, t);
      for (const t of TAPS){ await dClick($(`[data-tap="${t}"]`, b), 260); await dClick($('#ttr-go', b), 260); while (busy) await sleep(100); await dSet($(`[data-nom="${t}"]`, b), f2(ttrNom(t))); }
      await dSet($('#ttr-v', b), ttrAns());
    };
  }

  /* ---------- sub: winding resistance ---------- */
  const WR_PAIRS = {'1U-1V':0, '1V-1W':1, '1W-1U':2, '2U-2N':3, '2V-2N':4, '2W-2N':5};
  function wrRead(key, tap){
    const w = sc.wr, i = WR_PAIRS[key], kT = (235 + sc.T) / 255;
    if (i < 3){
      const Rp = [0, 1, 2].map(p => R_HV_PH20 * (1 + (3 - tap) * 0.025) * kT * (1 + w.n[p]) * (w.type === 'hv' && w.ph === p ? 1 + w.mag : 1));
      return deltaLL(Rp[i], Rp[(i + 1) % 3], Rp[(i + 2) % 3]);
    }
    const p = i - 3; return R_LV_PH20 * kT * (1 + w.n[i]) * (w.type === 'lv' && w.ph === p ? 1 + w.mag : 1);
  }
  const WR_V = [['ok', 'سليم: عدم الاتزان ≤ 2 % في الجهتين'], ['hv', 'عيب في جهة HV: تلامس مبدّل الجهد أو وصلة في ملف أحد الأطوار'], ['lv', 'عيب في جهة LV: وصلة مرتخية عند أحد الأطراف']];
  const wrFmt = (k, v) => WR_PAIRS[k] < 3 ? f3(v) + ' Ω' : f1(v * 1e6) + ' µΩ';
  function subWR(){
    const b = $('#ts-body', host), R = T.wr;
    b.innerHTML = wrap('wr', `<h3>مقاومة الملفات</h3><p class="note">${ar('ضع المشبكين على طرفين: في HV بين الأطراف (1U-1V، 1V-1W، 1W-1U)، وفي LV بين الطرف والتعادل (2U-2N …). اضغط TEST وانتظر استقرار القراءة، ثم انتظر التفريغ قبل نقل المشبكين.')}</p>
      ${tempLine()}${linkBtns(ALLINK)}${tapBtns()}<div class="row"><button type="button" class="btn pri" id="wr-go">TEST</button></div>
      <div class="tblw"><table class="tbl hm"><thead><tr><th>Pair</th><th>R @ ${sc.T} °C</th><th>Tap</th></tr></thead><tbody id="wr-tb"></tbody></table></div>
      <div class="fx">R75 = R<sub>T</sub> × (235 + 75) / (235 + T)<br>ΔR% = (max − min) / avg × 100 · ≤ 2 % OK, 2–5 % investigate</div>
      <label>R75 للزوج 1U-1V (Ω)<input type="number" step="0.001" inputmode="decimal" id="wr-r75" value="${esc(R.r75)}"></label>
      <label>ΔR% لجهة HV<input type="number" step="0.01" inputmode="decimal" id="wr-ubh" value="${esc(R.ubh)}"></label>
      <label>ΔR% لجهة LV<input type="number" step="0.01" inputmode="decimal" id="wr-ubl" value="${esc(R.ubl)}"></label>
      <label>الحكم<select id="wr-v">${opts(WR_V, R.verdict, 'اختر الحكم…')}</select></label>
      <button type="button" class="btn" id="wr-chk">تحقّق</button><div class="fx" id="wr-fx" hidden></div><p class="msg" id="wr-m" aria-live="polite"></p>${TYP}`);
    $('#ts-sv', b).innerHTML = scene('wr'); bindScene('wr'); common();
    G.tests.onTap = null;
    function table(){ $('#wr-tb', b).innerHTML = Object.keys(WR_PAIRS).map(k => `<tr><td>${k}</td><td>${R.meas[k] ? wrFmt(k, R.meas[k].v) : '—'}</td><td>${R.meas[k] ? R.meas[k].tap : ''}</td></tr>`).join(''); }
    $('#wr-go', b).addEventListener('click', async () => {
      if (busy) return;
      if (!isSafe()){ warn(W, 'المحول ما زال في الخدمة؛ نفّذ خطوات العزل والإقفال أولًا.'); return; }
      const lk = linksOff(); if (lk){ warn(W, lk); return; }
      if (!L.P || !L.N){ warn(W, 'صِل المشبكين P و N على طرفي الملف المراد قياسه.'); return; }
      const a = L.P, c = L.N, key = Object.keys(WR_PAIRS).find(k => k === a + '-' + c || k === c + '-' + a);
      if (!key){ warn(W, a === 'PE' || c === 'PE' ? 'لا تقس مقاومة الملف إلى الخزان؛ ضع المشبكين على طرفي ملف.' : `الزوج ${a}–${c} ليس ملفًا واحدًا: في HV قِس بين طرفين من 1U 1V 1W، وفي LV بين الطرف و 2N.`); return; }
      busy = 'run'; drawScene(); const v = wrRead(key, T.tap), hv = WR_PAIRS[key] < 3, steps = hv ? 22 : 12;
      for (let k = 0; k <= steps; k++){ const I = 10 * (1 - Math.exp(-k / (steps / 4))); const rr = v * (1 + 0.6 * Math.exp(-k / (steps / 5))); setLcd([`${key}`, `I = ${f2(I)} A`, k < 4 ? 'R = ------' : `R = ${wrFmt(key, rr)}`, k === steps ? 'STABLE' : 'stabilising…']); await sleep(sp(110)); }
      R.meas[key] = {v, tap:T.tap}; save(); table();
      busy = 'dis'; drawScene(); for (let k = 5; k >= 0; k--){ setLcd([`${key}`, `R = ${wrFmt(key, v)}`, 'DISCHARGING', `${k} s`]); await sleep(sp(260)); }
      busy = ''; drawScene(); setLcd([`${key}`, `R = ${wrFmt(key, v)}`, 'READY', '']);
    });
    $('#wr-chk', b).addEventListener('click', () => check(true));
    b.addEventListener('change', e => { if (e.target.id === 'wr-v') R.verdict = e.target.value; ['r75', 'ubh', 'ubl'].forEach(k => { if (e.target.id === 'wr-' + k) R[k] = e.target.value; }); save(); });
    function check(say){
      const m = $('#wr-m', b), keys = Object.keys(WR_PAIRS);
      if (!keys.every(k => R.meas[k])){ if (say) msg(m, 'bad', 'قِس الأزواج الستة كلها أولًا (3 في HV و 3 في LV).'); return; }
      const hvT = [0, 1, 2].map(i => R.meas[keys[i]].tap); if (new Set(hvT).size > 1){ if (say) msg(m, 'bad', 'قيست أزواج HV على أوضاع مختلفة لمبدّل الجهد؛ أعد قياسها كلها على الوضع نفسه.'); return; }
      const hv = keys.slice(0, 3).map(k => R.meas[k].v), lv = keys.slice(3).map(k => R.meas[k].v);
      const r75 = rCorr(R.meas['1U-1V'].v, sc.T, 75), uh = unbal(hv), ul = unbal(lv), ans = uh > 2 ? 'hv' : ul > 2 ? 'lv' : 'ok';
      const fx = $('#wr-fx', b);
      const e1 = !near(num(R.r75), r75, 0.005), e2 = !near(num(R.ubh), uh, 0.06, true), e3 = !near(num(R.ubl), ul, 0.06, true);
      if (say || !(e1 || e2 || e3)){ fx.hidden = false; fx.innerHTML = `R75 = ${f3(R.meas['1U-1V'].v)} × 310 / (235 + ${sc.T}) = <b>${f3(r75)} Ω</b><br>ΔR<sub>HV</sub> = (${f3(Math.max(...hv))} − ${f3(Math.min(...hv))}) / ${f3(hv.reduce((a, c) => a + c) / 3)} × 100 = <b class="${uh > 2 ? 'bad' : 'ok'}">${f2(uh)} %</b><br>ΔR<sub>LV</sub> = (${f1(Math.max(...lv) * 1e6)} − ${f1(Math.min(...lv) * 1e6)}) / ${f1(lv.reduce((a, c) => a + c) / 3 * 1e6)} × 100 = <b class="${ul > 2 ? 'bad' : 'ok'}">${f2(ul)} %</b>`; }
      if (e1){ msg(m, 'bad', `R75 غير صحيح: اضرب ${f3(R.meas['1U-1V'].v)} Ω في (235 + 75) / (235 + ${sc.T}).`); return; }
      if (e2 || e3){ msg(m, 'bad', 'عدم الاتزان غير صحيح: (أكبر قيمة − أصغر قيمة) ÷ المتوسط × 100 لكل جهة على حدة.'); return; }
      if (R.verdict !== ans){ msg(m, 'bad', ans === 'ok' ? `ΔR = ${f2(uh)} % و ${f2(ul)} % كلاهما ≤ 2 %: الملفات متزنة.` : `ΔR في جهة ${ans === 'hv' ? 'HV' : 'LV'} = ${f2(ans === 'hv' ? uh : ul)} % أكبر من 2 %: العيب في هذه الجهة.`); return; }
      msg(m, 'ok', ans === 'ok' ? 'صحيح: الملفات متزنة.' : ans === 'hv' ? 'صحيح: عيب في جهة HV؛ افحص تلامسات مبدّل الجهد ووصلات الملف، وحرّك المبدّل عدة مرات ثم أعد القياس.' : 'صحيح: عيب في جهة LV؛ افحص وصلة العازل المرتفعة وأحكمها ثم أعد القياس.');
      markDone('wr');
    }
    table(); if (T.done.wr) check(false);
    return async () => {
      await dClick($('[data-tap="3"]', b), 250);
      for (const k of Object.keys(WR_PAIRS)){ const [a, c] = k.split('-'); await demoConn('P', a); await demoConn('N', c); await dClick($('#wr-go', b), 200); while (busy) await sleep(100); }
      const keys = Object.keys(WR_PAIRS), hv = keys.slice(0, 3).map(k => R.meas[k].v), lv = keys.slice(3).map(k => R.meas[k].v);
      await dSet($('#wr-r75', b), f3(rCorr(R.meas['1U-1V'].v, sc.T, 75))); await dSet($('#wr-ubh', b), f2(unbal(hv))); await dSet($('#wr-ubl', b), f2(unbal(lv)));
      await dSet($('#wr-v', b), unbal(hv) > 2 ? 'hv' : unbal(lv) > 2 ? 'lv' : 'ok'); await dClick($('#wr-chk', b));
    };
  }

  /* ---------- sub: insulation resistance / PI ---------- */
  const IRCFG = {hve:{n:'HV → (LV + E)', V:[5000], line:HVT, earth:['PE'], guard:null, links:{hvs:true, lvs:true, lve:true, hve:false}},
    lve:{n:'LV → (HV + E)', V:[1000, 500], line:LVT, earth:['PE'], guard:null, links:{hvs:true, lvs:true, hve:true, lve:false}},
    hvlv:{n:'HV → LV (guard E)', V:[5000], line:HVT, earth:LVT, guard:['PE'], links:{hvs:true, lvs:true, hve:false, lve:false}}};
  const IR_V = [['ok', 'مقبول: كل القيم فوق الحد الأدنى و PI ≥ 1.25'], ['bad', 'مرفوض: العزل رطب أو متسخ؛ جفّف المحول ثم أعد الاختبار']];
  const irAng = r => -55 + IL.clamp(Math.log10(Math.max(r, 1)) / 5, 0, 1) * 110;
  const mo = v => v >= 1000 ? f2(v / 1000) + ' GΩ' : f0(v) + ' MΩ';
  function subIR(){
    const b = $('#ts-body', host), R = T.ir;
    b.innerHTML = wrap('ir', `<h3>مقاومة العزل و PI</h3><p class="note">${ar('اقصر أطراف كل ملف معًا، واختر التوصيلة والجهد، ثم شغّل 10 min. يحفظ الجهاز القراءة عند 30 s و 1 min و 10 min. بعد كل اختبار فرّغ الشحنة.')}</p>
      ${tempLine()}
      <label>التوصيلة<select id="ir-cfg">${opts(Object.keys(IRCFG).map(k => [k, IRCFG[k].n]), R.cfg)}</select></label>
      ${linkBtns(ALLINK)}
      <div class="row"><span class="note">جهد الاختبار:</span><div class="row">${[500, 1000, 2500, 5000].map(v => `<button type="button" class="btn" data-irv="${v}" aria-pressed="${R.V === v ? 'true' : 'false'}">${v} V</button>`).join('')}</div></div>
      <div class="row"><button type="button" class="btn pri" id="ir-go">TEST 10 min</button><button type="button" class="btn" id="ir-dis">فرّغ الشحنة</button></div>
      <div class="tblw"><table class="tbl hm"><thead><tr><th>Test</th><th>V</th><th>R30s</th><th>R1min</th><th>R10min</th></tr></thead><tbody id="ir-tb"></tbody></table></div>
      <div class="fx">IR20 = IR<sub>T</sub> × 2<sup>(T − 20)/10</sup><br>PI = R10min / R1min · DAR = R1min / R30s</div>
      <p class="note">${ar('الحدود عند 20 °C: HV → (LV+E) ≥ 1000 MΩ، LV → (HV+E) ≥ 500 MΩ، HV → LV ≥ 1000 MΩ؛ PI ≥ 2 جيد، 1.25–2 مقبول، أقل من 1.25 مشكوك فيه.')}</p>
      <label>IR1min لـ HV → (LV+E) بعد التصحيح إلى 20 °C (MΩ)<input type="number" step="1" inputmode="decimal" id="ir-20" value="${esc(R.ir20)}"></label>
      <label>PI لـ HV → (LV+E)<input type="number" step="0.01" inputmode="decimal" id="ir-pi" value="${esc(R.pi)}"></label>
      <label>DAR لـ HV → (LV+E)<input type="number" step="0.01" inputmode="decimal" id="ir-dar" value="${esc(R.dar)}"></label>
      <label>الحكم<select id="ir-v">${opts(IR_V, R.verdict, 'اختر الحكم…')}</select></label>
      <button type="button" class="btn" id="ir-chk">تحقّق</button><div class="fx" id="ir-fx" hidden></div><p class="msg" id="ir-m" aria-live="polite"></p>${TYP}`);
    $('#ts-sv', b).innerHTML = scene('ir'); bindScene('ir'); common(); G.tests.onTap = null;
    lcd.ang = -55; setLcd(['READY', `V = ${R.V || '---'} V`, '', '']);
    function table(){ $('#ir-tb', b).innerHTML = Object.keys(IRCFG).map(k => { const r = R.runs[k]; return `<tr><td>${IRCFG[k].n}</td><td>${r ? r.V : '—'}</td><td>${r ? mo(r.r30) : '—'}</td><td>${r ? mo(r.r60) : '—'}</td><td>${r ? mo(r.r600) : '—'}</td></tr>`; }).join(''); }
    IL.onAct(b, '[data-irv]', t => { if (busy || charged) return; R.V = +t.dataset.irv; save(); $$('[data-irv]', b).forEach(x => x.setAttribute('aria-pressed', +x.dataset.irv === R.V ? 'true' : 'false')); setLcd(['READY', `V = ${R.V} V`, '', '']); });
    b.addEventListener('change', e => {
      if (e.target.id === 'ir-cfg'){ if (busy || charged){ e.target.value = R.cfg; warn(W, charged ? 'فرّغ الشحنة قبل تغيير التوصيلة.' : 'انتظر انتهاء الاختبار.'); return; } R.cfg = e.target.value; }
      if (e.target.id === 'ir-v') R.verdict = e.target.value;
      [['ir-20', 'ir20'], ['ir-pi', 'pi'], ['ir-dar', 'dar']].forEach(([i, k]) => { if (e.target.id === i) R[k] = e.target.value; });
      save();
    });
    function validate(){
      const c = IRCFG[R.cfg];
      if (!isSafe()) return 'المحول ما زال في الخدمة؛ نفّذ خطوات العزل والإقفال أولًا.';
      if (T.links.jmp) return 'أزل جسر 1U–2U؛ فهو يقصر العزل بين HV و LV.';
      for (const k of ['hvs', 'lvs']) if (!T.links[k]) return `اقصر أطراف ${k === 'hvs' ? 'HV' : 'LV'} معًا؛ فالاختبار للعزل لا للملف، ودون القصر يتعرّض الملف لجهد غير منتظم.`;
      if (c.links.lve !== T.links.lve) return c.links.lve ? 'في HV → (LV+E) اربط LV المقصورة بالأرضي PE.' : 'افصل ربط LV بالأرضي؛ في هذه التوصيلة LV ليست أرضيًا.';
      if (c.links.hve !== T.links.hve) return c.links.hve ? 'في LV → (HV+E) اربط HV المقصورة بالأرضي PE.' : 'افصل ربط HV بالأرضي في هذه التوصيلة.';
      if (!c.line.includes(L.LINE)) return `صِل LINE إلى ${c.line === HVT ? 'أحد أطراف HV' : 'أحد أطراف LV'}.`;
      if (!c.earth.includes(L.EARTH)) return `صِل EARTH إلى ${c.earth[0] === 'PE' ? 'الأرضي PE' : 'أحد أطراف LV'}.`;
      if (c.guard && !c.guard.includes(L.GUARD)) return 'في HV → LV صِل GUARD إلى الخزان PE حتى لا يدخل تسرّب الخزان في القراءة.';
      if (!c.guard && L.GUARD) return 'لا حاجة إلى GUARD في هذه التوصيلة؛ افصله.';
      if (!R.V) return 'اختر جهد الاختبار.';
      if (!c.V.includes(R.V)) return R.cfg === 'lve' ? `ملف 400 V يُختبر بـ 1000 V (أو 500 V)، لا ${R.V} V.` : `ملف 11 kV يُختبر بـ 5000 V DC، لا ${R.V} V.`;
      return '';
    }
    $('#ir-go', b).addEventListener('click', async () => {
      if (busy) return; if (charged){ warn(W, 'فرّغ الشحنة من الاختبار السابق أولًا.'); return; }
      const e = validate(); if (e){ warn(W, e); return; }
      busy = 'run'; drawScene();
      const k = R.cfg, v = sc.ir.v[k], kt = kt20(sc.T), r1T = v.r1 / kt, rec = {V:R.V};
      for (let s = 1; s <= 600; s += s < 60 ? 3 : 12){
        const rr = irAt(r1T, v.pi, s) * (1 + (Math.random() - 0.5) * 0.01);
        lcd.ang = irAng(rr); const nd = $('#ir-ndl', host); if (nd) nd.setAttribute('transform', `rotate(${lcd.ang} 342 478)`);
        setLcd([`${IRCFG[k].n}`, `${R.V} V   t = ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, `R = ${mo(rr)}`, s < 60 ? 'charging…' : 'absorption…']);
        await sleep(sp(s < 60 ? 70 : 30));
      }
      rec.r30 = irAt(r1T, v.pi, 30); rec.r60 = r1T; rec.r600 = irAt(r1T, v.pi, 600);
      ['r30', 'r60', 'r600'].forEach(x => rec[x] = Math.round(rec[x]));
      R.runs[k] = rec; save(); table();
      busy = ''; charged = true; drawScene(); setLcd([`${IRCFG[k].n}  DONE`, `R10 = ${mo(rec.r600)}`, `⚠ ${f1(R.V / 1000)} kV ON WINDING`, 'press DISCHARGE']);
      msg($('#ir-m', b), 'bad', 'انتهى الاختبار، والملف ما زال مشحونًا: فرّغ الشحنة قبل لمس أي طرف.');
    });
    $('#ir-dis', b).addEventListener('click', async () => {
      if (!charged || busy) return; busy = 'dis';
      for (let u = R.V; u > 20; u *= 0.55){ setLcd(['DISCHARGING', `U = ${f0(u)} V`, '', '']); await sleep(sp(160)); }
      busy = ''; charged = false; lcd.ang = -55; drawScene(); setLcd(['READY', 'U < 25 V', '', '']); msg($('#ir-m', b), 'ok', 'فُرّغت الشحنة؛ يمكنك الآن تغيير الأطراف والوصلات.');
    });
    $('#ir-chk', b).addEventListener('click', () => check(true));
    function check(say){
      const m = $('#ir-m', b), fx = $('#ir-fx', b);
      if (!Object.keys(IRCFG).every(k => R.runs[k])){ if (say) msg(m, 'bad', 'أجرِ التوصيلات الثلاث: HV → (LV+E) و LV → (HV+E) و HV → LV.'); return; }
      if (charged){ if (say) msg(m, 'bad', 'فرّغ الشحنة أولًا.'); return; }
      const h = R.runs.hve, kt = kt20(sc.T), ir20 = h.r60 * kt, pi = h.r600 / h.r60, dar = h.r60 / h.r30;
      const c20 = k => R.runs[k].r60 * kt, ok = Object.keys(IRCFG).every(k => c20(k) >= IRMIN[k] && R.runs[k].r600 / R.runs[k].r60 >= PI_MIN);
      fx.hidden = false; fx.innerHTML = `IR20 = ${f0(h.r60)} × 2^((${sc.T} − 20)/10) = ${f0(h.r60)} × ${f3(kt)} = <b>${f0(ir20)} MΩ</b><br>PI = ${f0(h.r600)} / ${f0(h.r60)} = <b class="${pi >= PI_MIN ? 'ok' : 'bad'}">${f2(pi)}</b> · DAR = ${f0(h.r60)} / ${f0(h.r30)} = <b>${f2(dar)}</b><br>` + Object.keys(IRCFG).map(k => `${IRCFG[k].n}: IR20 = ${f0(c20(k))} MΩ ${c20(k) >= IRMIN[k] ? '<span class="ok">≥</span>' : '<span class="bad"><</span>'} ${IRMIN[k]} · PI = ${f2(R.runs[k].r600 / R.runs[k].r60)}`).join('<br>');
      if (!near(num(R.ir20), ir20, 0.02)){ msg(m, 'bad', `IR20 غير صحيح: القراءة عند ${sc.T} °C أقل من قيمتها عند 20 °C، فاضربها في 2^((${sc.T} − 20)/10) = ${f3(kt)}.`); return; }
      if (!near(num(R.pi), pi, 0.02, true)){ msg(m, 'bad', 'PI = R10min ÷ R1min (قراءتان عند الحرارة نفسها فلا تصحيح).'); return; }
      if (!near(num(R.dar), dar, 0.02, true)){ msg(m, 'bad', 'DAR = R1min ÷ R30s.'); return; }
      const ans = ok ? 'ok' : 'bad';
      if (R.verdict !== ans){ msg(m, 'bad', ok ? `القيم فوق الحدود و PI = ${f2(pi)} ≥ 1.25: العزل مقبول.` : `PI = ${f2(pi)} أقل من 1.25 و IR20 منخفض: العزل رطب؛ جفّف المحول ثم أعد الاختبار.`); return; }
      msg(m, 'ok', ok ? 'صحيح: العزل مقبول في التوصيلات الثلاث.' : 'صحيح: العزل رطب. جفّف المحول (ترشيح وتسخين تحت التفريغ) ثم أعد الاختبار.');
      markDone('ir');
    }
    table(); if (T.done.ir) check(false);
    return async () => {
      const run = async (cfg, lk, line, earth, guard, V) => {
        await dSet($('#ir-cfg', b), cfg);
        for (const [k, on] of Object.entries(lk)) if (T.links[k] !== on) await dClick($(`[data-link="${k}"]`, b), 220);
        L.GUARD = ''; await demoConn('LINE', line); await demoConn('EARTH', earth); if (guard) await demoConn('GUARD', guard); else drawScene();
        await dClick($(`[data-irv="${V}"]`, b), 220); await dClick($('#ir-go', b), 220); while (busy) await sleep(100); await dClick($('#ir-dis', b), 300); while (busy) await sleep(100);
      };
      await run('hve', {hvs:true, lvs:true, lve:true, hve:false, jmp:false}, '1U', 'PE', '', 5000);
      await run('lve', {lve:false, hve:true}, '2U', 'PE', '', 1000);
      await run('hvlv', {hve:false}, '1U', '2U', 'PE', 5000);
      const h = R.runs.hve, kt = kt20(sc.T);
      await dSet($('#ir-20', b), f0(h.r60 * kt)); await dSet($('#ir-pi', b), f2(h.r600 / h.r60)); await dSet($('#ir-dar', b), f2(h.r60 / h.r30));
      const ok = Object.keys(IRCFG).every(k => R.runs[k].r60 * kt >= IRMIN[k] && R.runs[k].r600 / R.runs[k].r60 >= PI_MIN);
      await dSet($('#ir-v', b), ok ? 'ok' : 'bad'); await dClick($('#ir-chk', b));
    };
  }

  /* ---------- sub: vector group ---------- */
  function subVG(){
    const b = $('#ts-body', host), R = T.vg;
    b.innerHTML = wrap('vg', `<h3>التحقق من مجموعة التوصيل</h3><p class="note">${ar('غذِّ HV بمصدر 400 V ثلاثي الأطوار (L1→1U، L2→1V، L3→1W)، واربط 1U بـ 2U بجسر، ثم قِس الجهد بين الأزواج وقارنه بالقيم المحسوبة.')}</p>
      ${linkBtns(ALLINK)}${tapBtns()}
      <div class="row"><button type="button" class="btn pri" id="vg-on">تشغيل المصدر</button><button type="button" class="btn" id="vg-rec">سجّل القراءة</button></div>
      <div class="tblw"><table class="tbl hm"><thead><tr><th>Pair</th><th>Measured</th>${Object.keys(VG).map(g => `<th>${g}</th>`).join('')}</tr></thead><tbody id="vg-tb"></tbody></table></div>
      <p class="note">${ar('القيم المحسوبة بالمتجهات: K = U_HV / 400، و U_LV,ph = 400 / K / √3؛ ثم |V(1x) − V(2y)| مع ربط 1U بـ 2U.')}</p>
      <label>مجموعة التوصيل حسب القياس<select id="vg-pick">${opts(Object.keys(VG), R.pick, 'اختر…')}</select></label><p class="msg" id="vg-m" aria-live="polite"></p>${TYP}`);
    $('#ts-sv', b).innerHTML = scene('vg'); bindScene('vg'); common();
    const keyOf = () => { const a = L['V+'], c = L.COM; return a && c ? a + '-' + c : ''; };
    function reading(){
      if (!vgOn) return null; const a = L['V+'], c = L.COM; if (!a || !c) return null;
      if (a === 'PE' || c === 'PE') return 'PE';
      const cross = (HVT.includes(a) && !HVT.includes(c)) || (HVT.includes(c) && !HVT.includes(a));
      if (cross && !T.links.jmp) return 'float';
      const P = vgPot('Dyn11', T.tap), idx = Object.keys(TG).indexOf(a) * 8 + Object.keys(TG).indexOf(c);
      return cabs(csub(P[a], P[c])) * (1 + sc.vgn[idx % 8] / 400);
    }
    function upd(){
      const r = reading(); lcd.vm = r == null ? '---' : r === 'float' ? '?? ' + f0(40 + Math.random() * 90) : r === 'PE' ? '0.0' : (r < 100 ? f2(r) : f1(r));
      const e = $('#vm', host); if (e) e.textContent = lcd.vm;
      $('#vg-tb', b).innerHTML = VG_PAIRS.map(([x, y]) => { const k = x + '-' + y, m = R.meas[k]; return `<tr class="${keyOf() === k ? 'hl' : ''}"><td>${x} – ${y}</td><td>${m != null ? f1(m) + ' V' : '—'}</td>${Object.keys(VG).map(g => `<td>${f1(vgV(g, R.tap || T.tap, x, y))}</td>`).join('')}</tr>`; }).join('');
      $('#vg-on', b).textContent = vgOn ? 'إيقاف المصدر' : 'تشغيل المصدر';
    }
    G.tests.onConn = () => upd(); G.tests.onTap = () => { R.meas = {}; R.tap = T.tap; save(); upd(); };
    $('#vg-on', b).addEventListener('click', () => {
      if (!vgOn){
        if (!isSafe()){ warn(W, 'المحول ما زال في الخدمة؛ نفّذ خطوات العزل والإقفال أولًا.'); return; }
        if (T.links.hvs || T.links.lvs || T.links.hve || T.links.lve){ warn(W, 'أزل وصلات القصر والتأريض من الأطراف؛ ستقصر مصدر الاختبار.'); return; }
        const nl = needLeads({L1:'1U', L2:'1V', L3:'1W'}); if (nl){ warn(W, nl); return; }
        if (!T.links.jmp) msg($('#vg-m', b), 'bad', 'تنبيه: دون جسر 1U–2U تكون جهة LV عائمة فلا معنى لقراءات HV–LV.');
      }
      vgOn = !vgOn; drawScene(); upd();
    });
    $('#vg-rec', b).addEventListener('click', () => {
      const m = $('#vg-m', b), r = reading();
      if (!vgOn){ msg(m, 'bad', 'شغّل المصدر أولًا.'); return; }
      if (r == null){ msg(m, 'bad', 'ضع المسبارين V+ و COM على طرفين.'); return; }
      if (r === 'float'){ msg(m, 'bad', 'القراءة عائمة: اربط 1U بـ 2U بالجسر أولًا (أوقف المصدر، ركّب الجسر، ثم شغّله).'); return; }
      const a = L['V+'], c = L.COM, k = VG_PAIRS.find(([x, y]) => (x === a && y === c) || (x === c && y === a));
      if (!k){ msg(m, 'bad', `الزوج ${a}–${c} ليس من الأزواج المطلوبة: 1V–2V، 1W–2W، 1V–2W، 1W–2V.`); return; }
      R.meas[k[0] + '-' + k[1]] = +r.toFixed(1); R.tap = T.tap; save(); upd(); judge();
    });
    $('#vg-pick', b).addEventListener('change', e => { R.pick = e.target.value; save(); judge(true); });
    function judge(say){
      const m = $('#vg-m', b); if (!R.pick) return;
      if (!VG_PAIRS.every(([x, y]) => R.meas[x + '-' + y] != null)){ if (say) msg(m, 'bad', 'سجّل الأزواج الأربعة أولًا.'); return; }
      if (R.pick !== 'Dyn11'){ const g = R.pick; msg(m, 'bad', `القراءات لا تطابق ${g}: قارن 1V–2W (${f1(R.meas['1V-2W'])} V) مع 1W–2V (${f1(R.meas['1W-2V'])} V) بالأعمدة المحسوبة.`); return; }
      msg(m, 'ok', `صحيح: 1V–2V = 1W–2W = 1V–2W ≈ ${f1(vgV('Dyn11', R.tap, '1V', '2V'))} V و 1W–2V ≈ ${f1(vgV('Dyn11', R.tap, '1W', '2V'))} V: المجموعة Dyn11 كما في لوحة البيانات.`);
      markDone('vg');
    }
    upd(); judge();
    return async () => {
      for (const [k, on] of Object.entries({hvs:false, lvs:false, hve:false, lve:false})) if (T.links[k] !== on) await dClick($(`[data-link="${k}"]`, b), 200);
      if (!T.links.jmp) await dClick($('[data-link="jmp"]', b), 260);
      await demoConn('L1', '1U'); await demoConn('L2', '1V'); await demoConn('L3', '1W');
      await dClick($('#vg-on', b));
      for (const [x, y] of VG_PAIRS){ await demoConn('V+', x); await demoConn('COM', y); await sleep(250); await dClick($('#vg-rec', b), 250); }
      await dSet($('#vg-pick', b), 'Dyn11');
    };
  }

  const SUBF = {safe:subSafe, ttr:subTTR, wr:subWR, ir:subIR, vg:subVG};
  function renderSub(){ const ob = $('#ts-body', host), nb = document.createElement('div'); nb.id = 'ts-body'; ob.replaceWith(nb); G.tests.onConn = null; G.tests.onTap = null; lcd = {}; G.tests.sdemo = SUBF[T.sub]() || null; }
  $('#ts-sub', host).addEventListener('click', e => { const t = e.target.closest('[data-sub]'); if (!t) return; if (busy || charged){ warn(W, charged ? 'فرّغ الشحنة قبل مغادرة الاختبار.' : 'انتظر انتهاء الاختبار.'); return; } setSub(t.dataset.sub); });
  setSub(T.sub || 'safe');
  bindNew(host, 'tests', () => { const d = DEF().tests; d.sc = newTests(); S.tests = d; G.tests.pool = null; });
  demo(host, 'tests', async () => {
    T.safe = []; setSub('safe');
    for (let k = 0; k < SAFE.length; k++) await dClick($(`[data-sf="${k}"]`, host), 380);
    for (const k of ['ttr', 'wr', 'ir', 'vg']){ await dClick($(`#ts-sub [data-sub="${k}"]`, host), 300); L = {}; drawScene(); if (G.tests.sdemo) await G.tests.sdemo(); await sleep(600); }
  });
};

/* =====================================================================
   TAB 3 · oil: sampling · BDV · water/acidity · DGA (Duval) · action
   ===================================================================== */
const SAMP = [
  {t:'اختر يومًا جافًا، وجهّز زجاجة نظيفة جافة ومحقنة DGA', w:'ابدأ بالتحضير: الرطوبة الجوية أو زجاجة غير جافة تفسد قراءة BDV والرطوبة.'},
  {t:'نظّف فوهة صمام أخذ العينات السفلي وركّب الأنبوب', w:'نظّف الصمام وركّب الأنبوب قبل فتحه؛ الغبار والماء على الفوهة يدخلان العينة.'},
  {t:'اصرف نحو 1–2 L في وعاء النفايات لغسل الصمام', w:'اصرف الزيت الراكد في الصمام أولًا؛ فهو لا يمثّل زيت المحول.'},
  {t:'اشطف الزجاجة مرة بالزيت نفسه', w:'اشطف الزجاجة بالزيت قبل الملء.'},
  {t:'املأ الزجاجة ببطء من القاع دون فقاعات، والمحقنة دون هواء', w:'املأ ببطء دون فقاعات بعد الشطف؛ الهواء يغيّر الغازات الذائبة.'},
  {t:'أغلق واكتب البطاقة: المحول، التاريخ، حرارة الزيت، نقطة السحب', w:'أغلق الزجاجة فورًا واكتب البطاقة.'}
];
const BDV_CLS = [['good', 'جيد > 40 kV'], ['fair', 'مقبول 30–40 kV'], ['poor', 'ضعيف < 30 kV']];
const W_CLS = [['good', 'جيد < 20 ppm'], ['fair', 'مقبول 20–30 ppm'], ['poor', 'ضعيف > 30 ppm']];
const A_CLS = [['good', 'جيد < 0.10 mgKOH/g'], ['fair', 'مقبول 0.10–0.20'], ['poor', 'ضعيف > 0.20 mgKOH/g']];
const OIL_ACT = [['ok', 'استمر في الخدمة؛ كرّر الاختبار في موعده السنوي'], ['dry', 'رشّح الزيت وجفّفه تحت التفريغ (إزالة الرطوبة والغازات) ثم أعد الاختبار'], ['regen', 'جدّد الزيت (Regeneration بتربة فولر) أو استبدله؛ الحموضة مرتفعة'], ['plan', 'خطّط لإيقاف قريب للفحص، وكرّر DGA بفاصل قصير لمتابعة معدل تولّد الغاز'], ['trip', 'أخرج المحول من الخدمة فورًا للفحص الداخلي؛ لا تُعِد تشغيله قبل التشخيص']];
const TYPG = {H2:'50–150', CH4:'30–130', C2H6:'20–90', C2H4:'60–280', C2H2:'2–20', CO:'400–600', CO2:'3800–14000'};
const TRI = {top:[180, 18], left:[18, 298], right:[342, 298]};
const triPt = (ch4, c2h4, c2h2) => { const s = ch4 + c2h4 + c2h2; return [(TRI.top[0] * ch4 + TRI.right[0] * c2h4 + TRI.left[0] * c2h2) / s, (TRI.top[1] * ch4 + TRI.right[1] * c2h4 + TRI.left[1] * c2h2) / s]; };
function triInv(x, y){
  const [x1, y1] = TRI.top, [x2, y2] = TRI.right, [x3, y3] = TRI.left, d = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
  const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / d, b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / d;
  return {ch4:a * 100, c2h4:b * 100, c2h2:(1 - a - b) * 100};
}
function duvalSvg(pt, truePt){
  let s = `<svg viewBox="0 0 360 330" role="img" aria-label="مثلث دوفال 1" id="dv-svg" style="cursor:crosshair">`;
  Object.keys(DZ).forEach(z => { const p = DZ[z].map(([e, a]) => triPt(100 - e - a, e, a).map(v => v.toFixed(1)).join(',')).join(' '); s += `<polygon points="${p}" fill="${ZCOL[z]}" fill-opacity=".55" stroke="#333" stroke-width=".8"/>`; });
  const lab = {PD:[99, 0.5, 0.5], T1:[88, 9, 2], T2:[63, 35, 2], T3:[30, 68, 2], D1:[45, 10, 45], D2:[30, 40, 30], DT:[58, 33, 9]};
  Object.keys(lab).forEach(z => { const [x, y] = triPt(...lab[z]); s += `<text x="${x}" y="${z === 'PD' ? y - 6 : y + 4}" font-size="12" text-anchor="middle" font-weight="700" fill="#111" font-family="var(--font-mono)">${z}</text>`; });
  s += `<polygon points="${[TRI.top, TRI.right, TRI.left].map(p => p.join(',')).join(' ')}" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`;
  for (let k = 20; k < 100; k += 20){
    const a = triPt(100 - k, k, 0), c = triPt(k, 0, 100 - k), e = triPt(0, 100 - k, k);
    s += `<text x="${a[0] + 8}" y="${a[1]}" font-size="9" class="tm">${k}</text><text x="${c[0] - 8}" y="${c[1] + 3}" font-size="9" class="tm" text-anchor="end">${k}</text><text x="${e[0]}" y="${e[1] + 13}" font-size="9" class="tm" text-anchor="middle">${k}</text>`;
  }
  s += `<text x="270" y="140" font-size="11" class="tx" font-weight="600">% C2H4 →</text><text x="20" y="140" font-size="11" class="tx" font-weight="600">← % CH4</text><text x="180" y="325" font-size="11" class="tx" text-anchor="middle" font-weight="600">← % C2H2</text>`;
  if (truePt){ const [x, y] = triPt(truePt.ch4, truePt.c2h4, truePt.c2h2); s += `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="var(--good)" stroke-width="2.5"/>`; }
  if (pt){ const [x, y] = triPt(pt.ch4, pt.c2h4, pt.c2h2); s += `<g><line x1="${x - 8}" y1="${y}" x2="${x + 8}" y2="${y}" stroke="#d32f2f" stroke-width="2.5"/><line x1="${x}" y1="${y - 8}" x2="${x}" y2="${y + 8}" stroke="#d32f2f" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="3.5" fill="#d32f2f"/></g>`; }
  return s + '</svg>';
}
function bdvSvg(st){
  const fill = st.fill, gap = st.gap || '?';
  let s = `<svg viewBox="0 0 360 250" role="img" aria-label="جهاز اختبار الجهد الانهياري BDV">`;
  s += `<rect x="6" y="6" width="348" height="238" rx="14" fill="#d8dde0" stroke="#7d868b" stroke-width="2"/><rect x="18" y="18" width="190" height="196" rx="8" fill="#2b3237"/>`;
  s += `<rect x="40" y="34" width="146" height="160" rx="10" fill="#cfe3ea" fill-opacity=".35" stroke="#aac" stroke-width="2"/>`;
  if (fill) s += `<rect x="42" y="62" width="142" height="130" rx="8" fill="var(--oil)" opacity=".75"/>`;
  s += `<rect x="20" y="104" width="44" height="12" fill="#9aa0a4"/><rect x="162" y="104" width="44" height="12" fill="#9aa0a4"/><circle cx="96" cy="110" r="18" fill="#c0c6c9" stroke="#555"/><circle cx="130" cy="110" r="18" fill="#c0c6c9" stroke="#555"/>`;
  s += `<text x="113" y="150" font-size="11" text-anchor="middle" class="wt">gap ${gap} mm</text>`;
  s += `<g id="bdv-spark" opacity="0"><path d="M113 98 l-5 8 l7 2 l-5 10" stroke="#fff6a0" stroke-width="3" fill="none"/><circle cx="113" cy="110" r="10" fill="#fff6a0" opacity=".5"/></g>`;
  s += `<g id="bdv-stir" opacity="${fill ? 1 : 0}"><rect x="104" y="176" width="18" height="5" rx="2" fill="#eee"><animateTransform attributeName="transform" type="rotate" values="0 113 178;180 113 178;360 113 178" dur="0.8s" repeatCount="indefinite"/></rect></g>`;
  s += `<rect x="222" y="22" width="122" height="70" rx="6" fill="var(--lcd)" stroke="#111" stroke-width="2"/><text class="lc" id="bdv-l0" x="234" y="48" font-size="22">${esc(st.l0 || '0.0')}</text><text class="lc" x="334" y="48" font-size="11" text-anchor="end">kV</text><text class="lc" id="bdv-l1" x="234" y="78" font-size="11">${esc(st.l1 || 'IEC 60156')}</text>`;
  s += `<text x="283" y="118" font-size="10" text-anchor="middle" fill="#333" font-family="var(--font-mono)">OIL BDV TESTER 0–80 kV</text>`;
  const res = st.res || []; for (let i = 0; i < 6; i++) s += `<rect x="${222 + (i % 3) * 41}" y="${130 + Math.floor(i / 3) * 34}" width="37" height="28" rx="4" fill="${res[i] != null ? '#fff' : '#eef1f2'}" stroke="#999"/><text x="${240 + (i % 3) * 41}" y="${149 + Math.floor(i / 3) * 34}" font-size="11" text-anchor="middle" fill="#111" font-family="var(--font-mono)">${res[i] != null ? f1(res[i]) : i + 1}</text>`;
  return s + '</svg>';
}
BUILD.oil = host => {
  const O = S.oil, sc = O.sc, g = sc.g;
  const pct = duvalPct(g), zone = duvalZone(pct), avgT = sc.bdv.reduce((a, c) => a + c, 0) / 6;
  host.innerHTML = `<div class="warnbox" id="ol-w" hidden></div>
  <div class="grid2">
    <div class="dev" id="ol-s1"><h3><span class="tag">1</span>أخذ العينة</h3><p class="note">${ar('العينة من صمام القاع والمحول في الخدمة: ابقَ بعيدًا عن الأطراف الحية. اختر الخطوات بالترتيب.')}</p><div class="pick" id="sp-pick"></div><ol class="steps" id="sp-done"></ol><p class="msg" id="sp-m"></p></div>
    <div class="dev" id="ol-s2"><h3><span class="tag">2</span>الجهد الانهياري BDV (IEC 60156)</h3><div class="svgw" id="bdv-sv"></div>
      <div class="row"><button type="button" class="btn" id="bd-rinse">اشطف الكأس بالعينة</button><button type="button" class="btn" id="bd-fill">املأ الكأس ببطء</button><button type="button" class="btn" id="bd-wait">انتظر 5 min لخروج الفقاعات</button></div>
      <label>المسافة بين القطبين<select id="bd-gap" class="sm">${opts([['2.0', '2.0 mm'], ['2.5', '2.5 mm'], ['3.0', '3.0 mm']], O.bdv.gap, 'اختر…')}</select></label>
      <div class="row"><button type="button" class="btn pri" id="bd-go">ابدأ التسلسل (6 انهيارات)</button></div>
      <div class="fx">BDV<sub>avg</sub> = (U1 + U2 + … + U6) / 6<br>gap 2.5 mm · rise 2 kV/s · 2 min stir between</div>
      <label>متوسط BDV (kV)<input type="number" step="0.1" inputmode="decimal" id="bd-avg" value="${esc(O.avg)}"></label>
      <label>التصنيف<select id="bd-cls">${opts(BDV_CLS, O.cls, 'اختر…')}</select></label><p class="msg" id="bd-m" aria-live="polite"></p></div>
  </div>
  <div class="grid2">
    <div class="dev" id="ol-s3"><h3><span class="tag">3</span>تقرير المختبر</h3>
      <div class="rd"><div><span>الرطوبة (IEC 60814)</span><b>${sc.water} ppm</b></div><div><span>الحموضة (IEC 62021)</span><b>${f2(sc.acid)} mgKOH/g</b></div><div><span>حرارة الزيت عند السحب</span><b>${sc.Ts} °C</b></div></div>
      <label>تصنيف الرطوبة<select id="lb-w">${opts(W_CLS, O.wcls, 'اختر…')}</select></label>
      <label>تصنيف الحموضة<select id="lb-a">${opts(A_CLS, O.acls, 'اختر…')}</select></label>
      <div class="tblw"><table class="tbl hm"><thead><tr><th>Gas</th><th>ppm</th><th>typical 90 % (IEC 60599, indicative)</th></tr></thead><tbody>${Object.keys(g).map(k => `<tr class="${['CH4', 'C2H4', 'C2H2'].includes(k) ? 'hl' : ''}"><td>${k}</td><td>${g[k]}</td><td>${TYPG[k]}</td></tr>`).join('')}</tbody></table></div>
      <p class="msg" id="lb-m" aria-live="polite"></p>${TYP}</div>
    <div class="dev" id="ol-s4"><h3><span class="tag">4</span>مثلث دوفال 1</h3>
      <div class="fx">%X = X / (CH4 + C2H4 + C2H2) × 100</div>
      <label>% CH4<input type="number" step="0.1" inputmode="decimal" data-pc="ch4" value="${esc(O.pct.ch4)}"></label>
      <label>% C2H4<input type="number" step="0.1" inputmode="decimal" data-pc="c2h4" value="${esc(O.pct.c2h4)}"></label>
      <label>% C2H2<input type="number" step="0.1" inputmode="decimal" data-pc="c2h2" value="${esc(O.pct.c2h2)}"></label>
      <p class="note">${ar('ثم اضغط على المثلث في موضع النقطة.')}</p><div class="svgw" id="dv-w"></div>
      <label>المنطقة<select id="dv-z">${opts(Object.keys(ZN).map(z => [z, ZN[z]]), O.zone, 'اختر…')}</select></label><p class="msg" id="dv-m" aria-live="polite"></p></div>
  </div>
  <div class="dev" id="ol-s5"><h3><span class="tag">5</span>القرار</h3><label>الإجراء<select id="ol-act">${opts(OIL_ACT, O.act, 'اختر الإجراء…')}</select></label><p class="msg" id="ac-m" aria-live="polite"></p></div>
  ${FOOT}`;
  const W = $('#ol-w', host); let busy = false;
  const pool = shuffle(SAMP.map((_, i) => i));
  function done(k){ O.done[k] = true; save(); const ids = {samp:'#ol-s1', bdv:'#ol-s2', lab:'#ol-s3', dga:'#ol-s4', act:'#ol-s5'}; $(ids[k], host).classList.add('ok'); if (['samp', 'bdv', 'lab', 'dga', 'act'].every(x => O.done[x])) win('oil'); }
  /* 1 sampling */
  function drawSamp(){
    $('#sp-pick', host).innerHTML = pool.filter(i => !O.samp.includes(i)).map(i => `<button type="button" class="btn" data-sp="${i}">${ar(SAMP[i].t)}</button>`).join('');
    $('#sp-done', host).innerHTML = O.samp.map((i, k) => `<li><b>${k + 1}</b><span>${ar(SAMP[i].t)}</span></li>`).join('');
  }
  IL.onAct(host, '[data-sp]', t => {
    const i = +t.dataset.sp, exp = O.samp.length;
    if (i !== exp){ msg($('#sp-m', host), 'bad', 'ترتيب غير صحيح: ' + SAMP[exp].w); return; }
    O.samp.push(i); save(); drawSamp();
    if (O.samp.length === SAMP.length){ msg($('#sp-m', host), 'ok', 'العينة صالحة ومعلَّمة. انتقل إلى اختبار BDV.'); done('samp'); } else msg($('#sp-m', host));
  });
  /* 2 BDV */
  const bs = {l0:'0.0', l1:'IEC 60156'};
  function drawBdv(){ $('#bdv-sv', host).innerHTML = bdvSvg(Object.assign({}, bs, {fill:O.bdv.fill, gap:O.bdv.gap, res:O.bdv.res})); }
  const bm = $('#bd-m', host);
  function needSample(){ if (!O.done.samp){ warn(W, 'خذ العينة أولًا بالترتيب الصحيح (الخطوة 1).'); return false; } return true; }
  $('#bd-rinse', host).addEventListener('click', () => { if (!needSample() || busy) return; O.bdv.rinse = true; O.bdv.fill = false; O.bdv.wait = false; O.bdv.res = []; save(); drawBdv(); msg(bm, '', 'شُطف الكأس والقطبان بالعينة نفسها.'); });
  $('#bd-fill', host).addEventListener('click', () => { if (!needSample() || busy) return; if (!O.bdv.rinse){ warn(W, 'اشطف الكأس بالعينة أولًا؛ بقايا زيت سابق أو رطوبة تخفض BDV.'); return; } O.bdv.fill = true; O.bdv.wait = false; save(); drawBdv(); msg(bm, '', 'مُلئ الكأس ببطء على جداره دون فقاعات.'); });
  $('#bd-wait', host).addEventListener('click', async () => {
    if (busy) return; if (!O.bdv.fill){ warn(W, 'املأ الكأس أولًا.'); return; }
    busy = true; for (let s = 5; s >= 0; s--){ bs.l1 = `standing ${s}:00 min`; drawBdv(); await sleep(sp(260)); } busy = false; O.bdv.wait = true; save(); msg(bm, '', 'خرجت الفقاعات. اضبط المسافة وابدأ.');
  });
  $('#bd-gap', host).addEventListener('change', e => { O.bdv.gap = e.target.value; save(); drawBdv(); });
  $('#bd-go', host).addEventListener('click', async () => {
    if (busy) return;
    if (!O.bdv.fill){ warn(W, 'الكأس فارغ: اشطفه ثم املأه بالعينة.'); return; }
    if (!O.bdv.wait){ warn(W, 'انتظر 5 min بعد الملء؛ الفقاعات الهوائية تسبب انهيارًا مبكرًا وقراءة منخفضة خاطئة.'); return; }
    if (O.bdv.gap !== '2.5'){ warn(W, O.bdv.gap ? `المسافة ${O.bdv.gap} mm خاطئة؛ IEC 60156 يحدد 2.5 mm بمقياس الفجوة.` : 'اضبط المسافة بين القطبين أولًا.'); return; }
    busy = true; O.bdv.res = []; drawBdv();
    for (let i = 0; i < 6; i++){
      const tgt = sc.bdv[i];
      for (let u = 0; u < tgt; u += 2 * (DEMO ? 2.4 : 1.3)){ bs.l0 = f1(u); bs.l1 = `run ${i + 1}/6 · 2 kV/s`; $('#bdv-l0', host).textContent = bs.l0; $('#bdv-l1', host).textContent = bs.l1; await sleep(40); }
      bs.l0 = f1(tgt); O.bdv.res.push(tgt); drawBdv(); const sp_ = $('#bdv-spark', host); if (sp_) sp_.setAttribute('opacity', '1'); await sleep(sp(260)); if (sp_) sp_.setAttribute('opacity', '0');
      if (i < 5){ for (let s = 2; s > 0; s--){ bs.l1 = `stir ${s}:00 min`; $('#bdv-l1', host).textContent = bs.l1; await sleep(sp(280)); } }
    }
    bs.l1 = 'DONE'; busy = false; save(); drawBdv(); msg(bm, '', 'انتهت الانهيارات الستة. احسب المتوسط وصنّفه.');
  });
  function chkBdv(){
    if (O.bdv.res.length < 6 || O.avg === '' || !O.cls) return;
    const a = O.bdv.res.reduce((x, y) => x + y, 0) / 6;
    if (!near(num(O.avg), a, 0.11, true)){ msg(bm, 'bad', `المتوسط = (${O.bdv.res.map(f1).join(' + ')}) / 6؛ أعد الجمع.`); return; }
    if (O.cls !== bdvClass(a)){ msg(bm, 'bad', `BDV = ${f1(a)} kV: ${a > 40 ? 'أعلى من 40 kV فهو جيد' : a >= 30 ? 'بين 30 و 40 kV فهو مقبول' : 'أقل من 30 kV فهو ضعيف'}.`); return; }
    msg(bm, 'ok', `صحيح: BDV = ${f1(a)} kV، والتصنيف ${({good:'جيد', fair:'مقبول', poor:'ضعيف'})[O.cls]}.`); done('bdv');
  }
  $('#bd-avg', host).addEventListener('change', e => { O.avg = e.target.value; save(); chkBdv(); });
  $('#bd-cls', host).addEventListener('change', e => { O.cls = e.target.value; save(); chkBdv(); });
  /* 3 lab */
  function chkLab(){
    const m = $('#lb-m', host); if (!O.wcls || !O.acls) return;
    if (O.wcls !== waterClass(sc.water)){ msg(m, 'bad', `الرطوبة ${sc.water} ppm: الحدود جيد < 20، ضعيف > 30 ppm.`); return; }
    if (O.acls !== acidClass(sc.acid)){ msg(m, 'bad', `الحموضة ${f2(sc.acid)} mgKOH/g: الحدود جيد < 0.10، ضعيف > 0.20.`); return; }
    msg(m, 'ok', 'صحيح: الرطوبة والحموضة مصنّفتان.'); done('lab');
  }
  $('#lb-w', host).addEventListener('change', e => { O.wcls = e.target.value; save(); chkLab(); });
  $('#lb-a', host).addEventListener('change', e => { O.acls = e.target.value; save(); chkLab(); });
  /* 4 Duval */
  const pctOk = () => ['ch4', 'c2h4', 'c2h2'].every(k => near(num(O.pct[k]), pct[k], 0.6, true));
  function drawDv(){ $('#dv-w', host).innerHTML = duvalSvg(O.pt, O.done.dga ? pct : null); }
  function chkDv(say){
    const m = $('#dv-m', host);
    if (!pctOk()){ if (say || ['ch4', 'c2h4', 'c2h2'].every(k => O.pct[k] !== '')) msg(m, 'bad', `المجموع = ${g.CH4} + ${g.C2H4} + ${g.C2H2} = ${g.CH4 + g.C2H4 + g.C2H2} ppm؛ قسّم كل غاز على المجموع واضرب في 100.`); return; }
    if (!O.pt){ msg(m, '', `النسب صحيحة. اضغط على المثلث عند CH4 ${f1(pct.ch4)} % و C2H4 ${f1(pct.c2h4)} % و C2H2 ${f1(pct.c2h2)} %.`); return; }
    const d = Math.hypot(O.pt.c2h4 - pct.c2h4, O.pt.c2h2 - pct.c2h2);
    if (d > 4){ msg(m, 'bad', `النقطة بعيدة (${f1(d)} %): خطوط C2H4 موازية للضلع الأيسر، وخطوط C2H2 أفقية تقريبًا من القاعدة.`); return; }
    if (!O.zone){ msg(m, '', 'النقطة في مكانها. اختر المنطقة.'); return; }
    if (O.zone !== zone){ msg(m, 'bad', `النقطة (C2H4 ${f1(pct.c2h4)} %، C2H2 ${f1(pct.c2h2)} %) ليست في ${O.zone}؛ انظر إلى المنطقة الملونة تحتها.`); return; }
    msg(m, 'ok', `صحيح: ${ZN[zone]}.` + (sc.type === 'healthy' ? ' لكن تركيزات الغازات أقل من القيم النموذجية، فلا دلالة على عطل.' : '')); done('dga'); drawDv();
  }
  host.addEventListener('change', e => { const p = e.target.closest('[data-pc]'); if (p){ O.pct[p.dataset.pc] = p.value; save(); chkDv(false); } });
  $('#dv-w', host).addEventListener('click', e => {
    const svg = $('svg', $('#dv-w', host)); const P = svg.createSVGPoint(); P.x = e.clientX; P.y = e.clientY; const r = P.matrixTransform(svg.getScreenCTM().inverse());
    const b = triInv(r.x, r.y); if (b.ch4 < -2 || b.c2h4 < -2 || b.c2h2 < -2) return;
    if (!pctOk()){ chkDv(true); return; }
    O.pt = {ch4:Math.max(0, b.ch4), c2h4:Math.max(0, b.c2h4), c2h2:Math.max(0, b.c2h2)}; save(); drawDv(); chkDv(true);
  });
  $('#dv-z', host).addEventListener('change', e => { O.zone = e.target.value; save(); chkDv(true); });
  /* 5 action */
  const WHY = {healthy:'كل النتائج جيدة والغازات قليلة: لا داعي لأي معالجة.', wet:'BDV ضعيف والرطوبة عالية والحموضة جيدة: المشكلة ماء؛ الترشيح والتجفيف يعالجانها.', aged:'الحموضة فوق 0.20: الزيت متأكسد؛ الترشيح لا يزيل الأحماض، فالحل التجديد أو الاستبدال.', T3:'C2H4 مرتفع جدًا في المنطقة T3: نقطة ساخنة > 700 °C؛ تابع المعدل وخطّط للفحص، والترشيح يخفي الدليل.', D2:'C2H2 مرتفع في المنطقة D2: قوس عالي الطاقة داخل المحول؛ أخرجه من الخدمة فورًا.'};
  $('#ol-act', host).addEventListener('change', e => {
    O.act = e.target.value; save(); const m = $('#ac-m', host);
    if (!['samp', 'bdv', 'lab', 'dga'].every(k => O.done[k])){ msg(m, 'bad', 'أكمل الخطوات 1 إلى 4 أولًا، فالقرار يُبنى على كل النتائج.'); return; }
    if (OILSC[sc.type].act.includes(O.act)){ msg(m, 'ok', 'صحيح. ' + WHY[sc.type]); done('act'); } else msg(m, 'bad', 'ليس الإجراء المناسب: ' + WHY[sc.type]);
  });
  drawSamp(); drawBdv(); drawDv();
  Object.keys(O.done).forEach(k => { const ids = {samp:'#ol-s1', bdv:'#ol-s2', lab:'#ol-s3', dga:'#ol-s4', act:'#ol-s5'}; if (O.done[k] && ids[k]) $(ids[k], host).classList.add('ok'); });
  bindNew(host, 'oil', () => { const d = DEF().oil; d.sc = newOil(); S.oil = d; });
  demo(host, 'oil', async () => {
    O.samp = []; O.done = {}; O.bdv = {rinse:false, gap:'', fill:false, wait:false, res:[]}; O.pt = null; drawSamp(); drawBdv(); drawDv();
    for (let k = 0; k < SAMP.length; k++) await dClick($(`[data-sp="${k}"]`, host), 320);
    await dClick($('#bd-rinse', host)); await dClick($('#bd-fill', host)); await dClick($('#bd-wait', host)); while (busy) await sleep(100);
    await dSet($('#bd-gap', host), '2.5'); await dClick($('#bd-go', host)); while (busy) await sleep(100);
    await dSet($('#bd-avg', host), f1(O.bdv.res.reduce((a, c) => a + c, 0) / 6)); await dSet($('#bd-cls', host), bdvClass(avgT));
    await dSet($('#lb-w', host), waterClass(sc.water)); await dSet($('#lb-a', host), acidClass(sc.acid));
    for (const k of ['ch4', 'c2h4', 'c2h2']) await dSet($(`[data-pc="${k}"]`, host), f1(pct[k]));
    await hl($('#dv-w', host)); O.pt = Object.assign({}, pct); drawDv(); chkDv(true); await sleep(500);
    await dSet($('#dv-z', host), zone); await dSet($('#ol-act', host), OILSC[sc.type].act[0]);
  });
};

/* =====================================================================
   TAB 4 · factory maintenance plan
   ===================================================================== */
function trendSvg(t, vals){
  const W = 300, H = 110, pad = 30, mx = Math.max(...vals, t.zones ? 4.6 : 0, t.lim || 0) * 1.12 || 1;
  const X = i => pad + 4 + i * (W - pad - 30) / (vals.length - 1), Y = v => H - 18 - v / mx * (H - 30);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t.n)}">`;
  if (t.zones){ const cols = ['#5cc06f', '#f6d55c', '#f0a03c', '#d9534f']; let lo = 0; [...t.zones, mx].forEach((z, i) => { s += `<rect x="${pad}" y="${Y(Math.min(z, mx))}" width="${W - pad - 10}" height="${Y(lo) - Y(Math.min(z, mx))}" fill="${cols[i]}" opacity=".22"/>`; lo = z; }); ['A', 'B', 'C', 'D'].forEach((z, i) => { const a = i ? t.zones[i - 1] : 0, b = t.zones[i] || mx; s += `<text x="${W - 8}" y="${(Y(a) + Y(Math.min(b, mx))) / 2 + 4}" font-size="9" text-anchor="end" class="tm">${z}</text>`; }); }
  if (t.lim) s += `<line x1="${pad}" x2="${W - 10}" y1="${Y(t.lim)}" y2="${Y(t.lim)}" stroke="var(--bad)" stroke-dasharray="4 3"/><text x="${pad + 2}" y="${Y(t.lim) - 3}" font-size="9" fill="var(--bad)" font-family="var(--font-mono)">${t.lim}</text>`;
  s += `<line x1="${pad}" y1="${H - 18}" x2="${W - 10}" y2="${H - 18}" stroke="var(--line)"/><line x1="${pad}" y1="8" x2="${pad}" y2="${H - 18}" stroke="var(--line)"/>`;
  s += `<polyline points="${vals.map((v, i) => X(i) + ',' + Y(v)).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2.4"/>`;
  vals.forEach((v, i) => s += `<circle cx="${X(i)}" cy="${Y(v)}" r="3.4" fill="var(--accent)"/><text x="${X(i)}" y="${Y(v) - 7}" font-size="9" text-anchor="middle" class="tx">${v}</text><text x="${X(i)}" y="${H - 5}" font-size="8" text-anchor="middle" class="tm">${TRLAB[i].slice(2)}</text>`);
  return s + '</svg>';
}
BUILD.plan = host => {
  const P = S.plan, sc = P.sc;
  const fkey = (g, t) => g + '.' + t;
  const rows = g => g === 'T' ? TTASK.map(t => ({t, ok:t.ok})) : MTASK.map(t => ({t, ok:t.ok[g]}));
  host.innerHTML = `<div class="dev"><h3><span class="tag">1</span>المهام والتكرار</h3><p class="note">${ar('اختر لكل مهمة تكرارًا مناسبًا لكل مجموعة. المحركات IE3 4-pole، والمعدات الحرجة هي الضواغط والمبرّد والمحول.')}</p>
    <div class="grid2" id="pl-g">${GRP.map(gp => `<div class="dev" id="pl-${gp.id}"><h3><span class="tag">${gp.tag}</span>${esc(gp.n)}</h3><p class="note">${ar(gp.note)}</p>
      ${rows(gp.id).map(({t}) => `<label>${ar(t.n)}<select data-f="${fkey(gp.id, t.id)}">${opts(FQ.map(f => [f, FQN[f]]), P.f[fkey(gp.id, t.id)] || '', 'اختر…')}</select></label><p class="msg" data-fm="${fkey(gp.id, t.id)}" style="min-height:0"></p>`).join('')}</div>`).join('')}</div>${TYP}</div>
  <div class="dev"><h3><span class="tag">2</span>اتجاهات القراءات</h3><p class="note">${ar('آخر خمس قراءات من سجل الصيانة. اختر الإجراء لكل منها.')}</p>
    <div class="grid2">${TREND.map(t => `<div class="dev trend" id="tr-${t.id}"><h3><span class="tag">${t.tag}</span><span>${ar(t.n)}</span></h3><div class="svgw">${trendSvg(t, sc.v[t.id])}</div><select data-tr="${t.id}">${opts(t.A.map((a, i) => [i, a]), P.tr[t.id] != null ? P.tr[t.id] : '', 'اختر الإجراء…')}</select><p class="msg" data-trm="${t.id}"></p></div>`).join('')}</div>
    <div class="fx">ISO 20816-3 · group 2 · rigid (typical): A/B 1.4 · B/C 2.8 · C/D 4.5 mm/s RMS</div></div>
  <div class="dev"><h3><span class="tag">3</span>الخطة في صفحة واحدة</h3><div class="row"><button type="button" class="btn pri" id="pl-make">أنشئ الخطة</button><button type="button" class="btn" id="pl-print" hidden>اطبع / احفظ PDF</button><span class="cnt" id="pl-cnt"></span></div><p class="msg" id="pl-m" aria-live="polite"></p><div id="pl-out"></div></div>
  ${FOOT}`;
  function fState(g, t, ok){ const v = P.f[fkey(g, t.id)]; return !v ? '' : ok.includes(v) ? 'ok' : 'bad'; }
  function upd(){
    let good = 0, tot = 0;
    GRP.forEach(gp => { let all = true; rows(gp.id).forEach(({t, ok}) => { tot++; const st = fState(gp.id, t, ok), m = $(`[data-fm="${fkey(gp.id, t.id)}"]`, host); if (st === 'ok') good++; else all = false;
      if (st === 'bad') msg(m, 'bad', t.why || `التكرار النموذجي لهذه المهمة: ${ok.map(f => FQN[f]).join(' أو ')}.`); else msg(m); m.style.minHeight = '0'; });
      $('#pl-' + gp.id, host).className = 'dev' + (all ? ' ok' : ''); });
    TREND.forEach(t => { tot++; const v = P.tr[t.id], m = $(`[data-trm="${t.id}"]`, host), box = $('#tr-' + t.id, host);
      if (v == null || v === ''){ msg(m); box.className = 'dev trend'; return; }
      if (+v === t.ok){ good++; msg(m, 'ok', 'صحيح. ' + t.why); box.className = 'dev trend ok'; } else { msg(m, 'bad', t.why); box.className = 'dev trend bad'; } });
    $('#pl-cnt', host).textContent = `${good} / ${tot}`;
    return good === tot;
  }
  host.addEventListener('change', e => {
    const f = e.target.closest('[data-f]'), tr = e.target.closest('[data-tr]');
    if (f) P.f[f.dataset.f] = f.value; if (tr) P.tr[tr.dataset.tr] = tr.value === '' ? null : +tr.value;
    if (f || tr){ P.made = false; save(); upd(); $('#pl-out', host).innerHTML = ''; $('#pl-print', host).hidden = true; }
  });
  function make(){
    const m = $('#pl-m', host);
    if (!upd()){ msg(m, 'bad', 'بعض الاختيارات ناقصة أو غير مناسبة (المعلَّمة بالأحمر)؛ صحّحها ثم أنشئ الخطة.'); return; }
    const today = new Date().toISOString().slice(0, 10);
    const motorRows = MTASK.map(t => `<tr><td class="ar">${esc(t.n)}</td>${['P', 'C', 'CH'].map(g => `<td class="ar">${esc(FQN[P.f[fkey(g, t.id)]])}</td>`).join('')}</tr>`).join('');
    const tRows = TTASK.map(t => `<tr><td class="ar">${esc(t.n)}</td><td class="ar">${esc(FQN[P.f[fkey('T', t.id)]])}</td></tr>`).join('');
    const acts = TREND.map(t => `<tr><td>${t.tag}</td><td class="ar">${esc(t.n)}</td><td>${sc.v[t.id][4]} ${t.unit === 'PI' ? '' : t.unit}</td><td class="ar" style="white-space:normal">${esc(t.A[t.ok])}</td></tr>`).join('');
    $('#pl-out', host).innerHTML = `<div class="plan-sheet" id="plan-sheet"><h3>خطة الصيانة الوقائية والتنبؤية: المصنع (400 V، T1 1000 kVA)</h3><p class="note">LearnElectricals · ${today} · ${ar('P-101…P-104، C-201، C-202، CH-301، T1')}</p>
      <div class="tblw" style="direction:rtl"><table class="tbl hm" style="direction:rtl"><thead><tr><th class="ar">مهمة المحركات</th><th class="ar">P-101…P-104</th><th class="ar">C-201, C-202</th><th class="ar">CH-301</th></tr></thead><tbody>${motorRows}</tbody></table></div>
      <div class="tblw" style="direction:rtl"><table class="tbl hm" style="direction:rtl"><thead><tr><th class="ar">مهمة المحول T1</th><th class="ar">التكرار</th></tr></thead><tbody>${tRows}</tbody></table></div>
      <div class="tblw" style="direction:rtl"><table class="tbl hm" style="direction:rtl"><thead><tr><th class="ar">المعدة</th><th class="ar">القراءة</th><th class="ar">آخر قيمة</th><th class="ar">الإجراء</th></tr></thead><tbody>${acts}</tbody></table></div>
      <p class="note">${ar('حدود القبول: IR ≥ 5 MΩ و PI ≥ 2.0 للمحركات (IEEE 43)؛ الاهتزاز A/B 1.4، B/C 2.8، C/D 4.5 mm/s؛ BDV > 40 kV، الرطوبة < 20 ppm، الحموضة < 0.10 mgKOH/g؛ TTR ±0.5 %. قيم نموذجية للتعلّم؛ ارجع إلى المعيار المعتمد وكتيّب المصنّع.')}</p></div>`;
    $('#pl-print', host).hidden = false; P.made = true; save(); msg(m, 'ok', 'أُنشئت الخطة. يمكنك طباعتها أو حفظها PDF.'); win('plan');
  }
  $('#pl-make', host).addEventListener('click', make);
  $('#pl-print', host).addEventListener('click', () => window.print());
  upd(); if (P.made) make();
  bindNew(host, 'plan', () => { S.plan = {sc:newPlan(), f:{}, tr:{}, made:false}; });
  demo(host, 'plan', async () => {
    P.f = {}; P.tr = {}; P.made = false; $$('[data-f],[data-tr]', host).forEach(s => s.value = ''); $('#pl-out', host).innerHTML = ''; upd();
    for (const gp of GRP) for (const {t, ok} of rows(gp.id)) await dSet($(`[data-f="${fkey(gp.id, t.id)}"]`, host), ok[0], 150);
    for (const t of TREND) await dSet($(`[data-tr="${t.id}"]`, host), t.ok, 300);
    await dClick($('#pl-make', host));
  });
};

/* =====================================================================
   start
   ===================================================================== */
TABS.forEach(tb => { if (IL.has(tb.l, 'sim')) G[tb.id].won = true; });
const first = location.hash.slice(1);
show(G[first] ? first : 'inspect');
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (G[h]) show(h); });
})();
