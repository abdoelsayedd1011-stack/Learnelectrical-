/* مصمّم شاشات HMI – LearnElectricals (MSA UI).
   A simplified WinCC Unified-style screen editor (toolbox, tags, events, dynamization, faceplates)
   with a Runtime mode against a small simulated filling-line plant. */
(function(){
'use strict';
const $ = IL.$, $$ = IL.$$, esc = IL.esc, clamp = IL.clamp;
IL.hubTheme();

const W = 800, H = 450, SN = 10, SKEY = 'scada-designer-v1';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const snap = v => Math.round(v / SN) * SN;
const clone = o => JSON.parse(JSON.stringify(o));
const r1 = v => Math.round(v * 10) / 10;

/* ---------------- PLC tags ---------------- */
const TAGS = [
  ['Pump1_Start', 'Bool', '', 'أمر تشغيل المضخة (لحظي)'],
  ['Pump1_Stop', 'Bool', '', 'أمر إيقاف المضخة (لحظي)'],
  ['Pump1_Running', 'Bool', '', 'المضخة تعمل'],
  ['Pump1_Fault', 'Bool', '', 'عطل المضخة'],
  ['Pump1_Manual', 'Bool', '', 'وضع يدوي'],
  ['Pump1_Speed_SP', 'Real', 'Hz', 'نقطة ضبط السرعة'],
  ['Pump1_Speed', 'Real', 'Hz', 'السرعة الفعلية'],
  ['Pump1_Current', 'Real', 'A', 'تيار المحرك'],
  ['Tank1_Level', 'Real', '%', 'مستوى الخزان'],
  ['Inlet_Open', 'Bool', '', 'صمام التغذية مفتوح'],
  ['Valve1_Cmd', 'Bool', '', 'أمر فتح الصمام'],
  ['Valve1_Open', 'Bool', '', 'الصمام مفتوح'],
  ['Valve1_Closed', 'Bool', '', 'الصمام مغلق'],
  ['Valve1_Fault', 'Bool', '', 'عطل الصمام'],
  ['Mixer1_Running', 'Bool', '', 'الخلاط يعمل'],
  ['Line_Start', 'Bool', '', 'تشغيل الخط (لحظي)'],
  ['Line_Stop', 'Bool', '', 'إيقاف الخط (لحظي)'],
  ['Line_Running', 'Bool', '', 'الخط يعمل'],
  ['Filler_Running', 'Bool', '', 'رأس التعبئة يعمل'],
  ['Conveyor_Running', 'Bool', '', 'السير يعمل'],
  ['Capper_Running', 'Bool', '', 'آلة الأغطية تعمل'],
  ['Bottle_Count', 'Int', '', 'عدد العبوات'],
  ['Air_Pressure', 'Real', 'bar', 'ضغط الهواء'],
  ['Compressor_Running', 'Bool', '', 'الضاغط يعمل'],
  ['Alarm_Active', 'Bool', '', 'إنذار نشط أو غير مؤكد']
];
const TT = {}; TAGS.forEach(t => { TT[t[0]] = {t:t[1], u:t[2], d:t[3]}; });
const SCALE = {Tank1_Level:[0, 100], Pump1_Current:[0, 30], Pump1_Speed_SP:[0, 50], Pump1_Speed:[0, 50], Air_Pressure:[0, 10], Bottle_Count:[0, 1000]};
const PREV = {Pump1_Running:1, Pump1_Speed_SP:35, Pump1_Speed:35, Pump1_Current:18.4, Tank1_Level:62, Valve1_Cmd:1, Valve1_Open:1, Mixer1_Running:1, Line_Running:1, Filler_Running:1, Conveyor_Running:1, Capper_Running:1, Bottle_Count:128, Air_Pressure:6.4};

/* ---------------- object types ---------------- */
const TYPES = {
  button:{n:'Button', a:'زر', w:120, h:40},
  io:{n:'IOField', a:'حقل I/O', w:120, h:40},
  text:{n:'Text', a:'نص', w:160, h:30},
  ind:{n:'Indicator', a:'مؤشر', w:40, h:40},
  bar:{n:'Bar', a:'شريط', w:40, h:140},
  gauge:{n:'Gauge', a:'عدّاد دائري', w:120, h:120},
  tank:{n:'Tank', a:'خزان', w:110, h:150},
  pump:{n:'Pump', a:'مضخة', w:70, h:86},
  valve:{n:'Valve', a:'صمام', w:60, h:60},
  pipe:{n:'Pipe', a:'أنبوب', w:120, h:10},
  motor:{n:'Motor', a:'محرك', w:70, h:50},
  alarm:{n:'AlarmIcon', a:'أيقونة إنذار', w:36, h:36},
  trend:{n:'Trend', a:'ترند', w:240, h:120},
  scr:{n:'ScreenButton', a:'تغيير شاشة', w:150, h:40},
  face:{n:'Faceplate', a:'وجه جاهز', w:160, h:152},
  filler:{n:'Filler', a:'رأس تعبئة', w:80, h:100},
  conv:{n:'Conveyor', a:'سير ناقل', w:280, h:50},
  capper:{n:'Capper', a:'آلة أغطية', w:70, h:100},
  alview:{n:'AlarmView', a:'عرض الإنذارات', w:560, h:200},
  pie:{n:'PieChart', a:'رسم دائري', w:150, h:150},
  deco:{n:'Deco', a:'زخرفة', w:120, h:56}
};
const PAL = ['button', 'io', 'text', 'ind', 'bar', 'gauge', 'tank', 'pump', 'valve', 'pipe', 'motor', 'alarm', 'trend', 'scr', 'face', 'filler', 'conv', 'capper', 'alview'];
const EQUIP = ['pump', 'valve', 'motor', 'filler', 'conv', 'capper'];
const ALTYPES = EQUIP.concat(['tank', 'ind', 'io', 'bar']);
const EVTYPES = ['button', 'pump', 'valve', 'motor', 'ind', 'alarm'];
const ICON = {
  button:'<rect x="5" y="8" width="30" height="13" rx="3"/>',
  io:'<rect x="3" y="7" width="34" height="15" rx="2"/><path d="M19 11v7m4-7v7m6-7v7" stroke-width="1.6"/>',
  text:'<path d="M11 6h18M20 6v17"/>',
  ind:'<circle cx="20" cy="14" r="9"/><circle cx="20" cy="14" r="4.5" fill="currentColor"/>',
  bar:'<rect x="15" y="2" width="10" height="24"/><rect x="15" y="13" width="10" height="13" fill="currentColor"/>',
  gauge:'<path d="M8 22a12 12 0 1 1 24 0"/><path d="M20 22l6-8"/>',
  tank:'<path d="M11 6q0-3 3-3h12q3 0 3 3v20H11z"/><path d="M11 15h18v11H11z" fill="currentColor" opacity=".35"/>',
  pump:'<path d="M18 6h11v5"/><circle cx="18" cy="15" r="9"/><path d="M12 26h12l-2-3"/>',
  valve:'<path d="M7 14l26 11V14L7 25z"/><path d="M20 19.5V8M13 8a7 4 0 0 1 14 0z"/>',
  pipe:'<path d="M3 14h34" stroke-width="5"/>',
  motor:'<rect x="4" y="7" width="25" height="15" rx="2"/><path d="M29 12.5h7v4h-7"/><path d="M12 18v-7l4.5 4 4.5-4v7" stroke-width="1.6"/>',
  alarm:'<path d="M20 3l14 22H6z"/><path d="M20 10v8m0 3v1"/>',
  trend:'<rect x="3" y="3" width="34" height="22"/><path d="M6 20l7-7 6 4 7-9 8 5"/>',
  scr:'<rect x="3" y="7" width="34" height="15" rx="3"/><path d="M17 11l5 3.5-5 3.5"/>',
  face:'<rect x="7" y="2" width="26" height="24" rx="2"/><path d="M7 8h26"/><rect x="10" y="18" width="8" height="5"/><rect x="22" y="18" width="8" height="5"/>',
  filler:'<rect x="9" y="2" width="22" height="9"/><path d="M17 11h6v6h-6z"/><path d="M20 19v5"/>',
  conv:'<rect x="3" y="17" width="34" height="7" rx="3.5"/><rect x="7" y="7" width="5" height="10"/><rect x="18" y="7" width="5" height="10"/><rect x="29" y="7" width="5" height="10"/>',
  capper:'<rect x="12" y="2" width="16" height="8"/><path d="M20 10v6M14 16h12v4H14z"/><path d="M5 25h30"/>',
  alview:'<rect x="3" y="3" width="34" height="22"/><path d="M3 9h34M7 14h26M7 19h26"/>'
};
const icon = t => `<svg viewBox="0 0 40 28" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${ICON[t] || ''}</svg>`;
const STY = {
  pump:[['flat', 'مسطح 2D · ISA-101'], ['3d', 'ثلاثي الأبعاد بتدرّج']],
  ind:[['isa', 'ISA: ممتلئ = 1، إطار = 0'], ['rg', 'أخضر = 1، أحمر = 0']],
  io:[['num', 'رقم فقط'], ['rangebar', 'رقم + شريط النطاق الطبيعي']],
  pie:[['pie', 'رسم دائري ملوّن'], ['bars', 'أشرطة أفقية رمادية']],
  deco:[['blink', 'نجمة وامضة للزينة'], ['static', 'ثابتة رمادية بلا وميض']]
};
STY.valve = STY.tank = STY.motor = STY.pump;
const FMTS = ['9', '99', '999', '9999', '9.9', '99.9', '999.9', '9.99'];
const FNS = [['', '—'], ['SetBit', 'SetBit'], ['ResetBit', 'ResetBit'], ['InvertBit', 'InvertBit'], ['SetValue', 'SetValue'], ['ChangeScreen', 'ChangeScreen'], ['OpenFaceplate', 'OpenFaceplate (نافذة منبثقة)']];
const EVN = [['press', 'Press', 'عند الضغط'], ['release', 'Release', 'عند الإفلات'], ['click', 'Click', 'عند النقر']];
const BGS = [['grey', 'رمادي فاتح محايد · ISA-101'], ['rainbow', 'تدرّج ألوان قوس قزح'], ['black', 'أسود'], ['blue', 'أزرق داكن']];

/* ---------------- document helpers ---------------- */
const allItems = doc => Object.keys(doc.screens).reduce((a, k) => a.concat(doc.screens[k].items), []);
function newItem(doc, type, x, y){
  const T = TYPES[type];
  const n = allItems(doc).filter(i => i.type === type).length + 1;
  const it = {id:'e' + (doc.next++), type, name:T.n + n, x, y, w:T.w, h:T.h, style:'flat', ev:{}, dyn:{}};
  switch (type){
    case 'button': it.text = 'Button'; break;
    case 'text': it.text = 'نص'; it.fs = 18; break;
    case 'io': Object.assign(it, {tag:'', mode:'out', f:'999.9', unit:'', min:'', max:'', lo:'', hi:'', fs:18, style:'num'}); break;
    case 'bar': case 'gauge': Object.assign(it, {tag:'', min:0, max:100, unit:'', lo:'', hi:''}); break;
    case 'trend': Object.assign(it, {tag:'', min:0, max:100}); break;
    case 'ind': Object.assign(it, {tag:'', style:'isa'}); break;
    case 'alarm': it.prio = 1; break;
    case 'scr': { const ks = Object.keys(doc.screens); it.target = ks.find(k => k !== 'main') || 'main'; it.text = (doc.screens[it.target].a || '') + ' ›'; break; }
    case 'pump': Object.assign(it, {stateText:true, showName:true, dyn:{color:{tag:'Pump1_Running', sc:'isa'}}}); break;
    case 'valve': Object.assign(it, {stateText:false, showName:true}); break;
    case 'motor': case 'tank': it.showName = true; break;
    case 'filler': Object.assign(it, {showName:true, dyn:{color:{tag:'Filler_Running', sc:'isa'}}}); break;
    case 'conv': Object.assign(it, {showName:true, dyn:{color:{tag:'Conveyor_Running', sc:'isa'}}}); break;
    case 'capper': Object.assign(it, {showName:true, dyn:{color:{tag:'Capper_Running', sc:'isa'}}}); break;
    case 'pipe': Object.assign(it, {from:'', to:''}); break;
    case 'pie': it.style = 'pie'; break;
    case 'deco': it.style = 'blink'; break;
  }
  return it;
}
function mkDoc(screens){
  const d = {v:1, next:1, screens:{}};
  for (const k in screens){
    const s = screens[k]; d.screens[k] = {t:s.t, a:s.a, bg:s.bg || 'grey', items:[]};
    s.items.forEach(([type, p]) => { const it = newItem(d, type, 0, 0); const dyn = p.dyn; Object.assign(it, p); if (dyn) it.dyn = clone(dyn); d.screens[k].items.push(it); });
  }
  return d;
}
function getP(o, k){ return k.split('.').reduce((a, p) => a == null ? undefined : a[p], o); }
function setP(o, k, v){ const ps = k.split('.'); let a = o; for (let i = 0; i < ps.length - 1; i++){ if (!a[ps[i]] || typeof a[ps[i]] !== 'object') a[ps[i]] = {}; a = a[ps[i]]; } a[ps[ps.length - 1]] = v; }
function loadAll(){ try { const s = JSON.parse(localStorage.getItem(SKEY)); return s && typeof s === 'object' ? s : {}; } catch (e){ return {}; } }
function saveDoc(id, doc){ try { const s = loadAll(); s[id] = doc; localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e){} }
function validDoc(d){ return d && d.v === 1 && d.screens && d.screens.main && Object.keys(d.screens).every(k => Array.isArray(d.screens[k].items)); }

function fmtF(f, v){
  f = String(f || '999.9'); const p = f.split('.'), d = p[1] ? p[1].length : 0;
  v = +v; if (!isFinite(v) || Math.abs(v) >= Math.pow(10, p[0].length)) return '#'.repeat(f.length);
  return IL.fmt(v, d);
}
const scaleOf = it => { const s = SCALE[it.tag] || [0, 100]; const mn = it.min !== '' && it.min != null && isFinite(+it.min) ? +it.min : s[0]; const mx = it.max !== '' && it.max != null && isFinite(+it.max) && +it.max > mn ? +it.max : (s[1] > mn ? s[1] : mn + 100); return [mn, mx]; };
const hasRange = it => it.lo !== '' && it.hi !== '' && it.lo != null && it.hi != null && isFinite(+it.lo) && isFinite(+it.hi) && +it.lo < +it.hi;

/* ---------------- simulated plant ---------------- */
function plantNew(){
  return {t:0, Pump1_Start:0, Pump1_Stop:0, Pump1_Running:0, Pump1_Fault:0, Pump1_Manual:0, Pump1_Speed_SP:35, Pump1_Speed:0, Pump1_Current:0,
    Tank1_Level:55, Inlet_Open:0, Valve1_Cmd:1, Valve1_Open:1, Valve1_Closed:0, Valve1_Fault:0, Mixer1_Running:0,
    Line_Start:0, Line_Stop:0, Line_Running:0, Filler_Running:0, Conveyor_Running:0, Capper_Running:0, Bottle_Count:0,
    Air_Pressure:6.4, Compressor_Running:0, Alarm_Active:0, _latch:0, _vpos:1, _runT:0, _flow:0, _conv:0, _cnt:0, _leak:0, _pls:0, _cap:0};
}
function plantStep(P, dt){
  P.t += dt;
  const faults = P.Pump1_Fault || P.Valve1_Fault;
  if (P.Line_Start && !P._pls && !faults) P.Line_Running = 1;
  P._pls = P.Line_Start ? 1 : 0;
  if (P.Line_Stop || faults) P.Line_Running = 0;
  if (P.Pump1_Start && !P.Pump1_Stop && !P.Pump1_Fault) P._latch = 1;
  if (P.Pump1_Stop || P.Pump1_Fault || P.Line_Stop) P._latch = 0;
  const run = (P._latch || P.Line_Running) && !P.Pump1_Fault ? 1 : 0;
  if (run && !P.Pump1_Running) P._runT = 0;
  P.Pump1_Running = run; P._runT += dt;
  const sp = clamp(+P.Pump1_Speed_SP || 0, 0, 50);
  P.Pump1_Speed += clamp((run ? sp : 0) - P.Pump1_Speed, -20 * dt, 12 * dt);
  if (P.Line_Running) P.Valve1_Cmd = 1;
  if (!P.Valve1_Fault) P._vpos += clamp((P.Valve1_Cmd ? 1 : 0) - P._vpos, -0.8 * dt, 0.8 * dt);
  P.Valve1_Open = P._vpos > 0.98 ? 1 : 0; P.Valve1_Closed = P._vpos < 0.02 ? 1 : 0;
  const s = P.Pump1_Speed / 50;
  const q = P.Tank1_Level > 0.5 ? s * 2.6 * P._vpos : 0;
  P._flow = q;
  if (P.Tank1_Level < 35) P.Inlet_Open = 1; else if (P.Tank1_Level > 75) P.Inlet_Open = 0;
  P.Tank1_Level = clamp(P.Tank1_Level + ((P.Inlet_Open ? 2.0 : 0) - q) * dt, 0, 100);
  const load = 2.5 + 19 * s * s * (0.55 + 0.45 * P._vpos);
  const inrush = run ? 14 * Math.exp(-P._runT / 0.45) : 0;
  P.Pump1_Current += ((run ? load + inrush : 0) - P.Pump1_Current) * Math.min(1, dt * 6);
  if (P.Pump1_Current < 0.05) P.Pump1_Current = 0;
  P.Mixer1_Running = run;
  P.Conveyor_Running = P.Filler_Running = P.Capper_Running = P.Line_Running;
  P.Air_Pressure -= ((P.Capper_Running ? 0.08 : 0.01) + P._leak) * dt;
  if (P.Air_Pressure < 6.0) P.Compressor_Running = 1; else if (P.Air_Pressure > 7.2) P.Compressor_Running = 0;
  if (P.Compressor_Running) P.Air_Pressure += 0.35 * dt;
  P.Air_Pressure = clamp(P.Air_Pressure, 0, 10);
  if (P.Conveyor_Running && q > 0.2){ P._conv += dt * 0.6 * (0.5 + s); const c = Math.floor(P._conv); if (c > P._cnt){ P.Bottle_Count += c - P._cnt; P._cnt = c; } }
  if (P.Capper_Running) P._cap += dt;
}
const ALDEF = [
  {id:'pf', p:1, t:'عطل المضخة Pump1: فصل الحماية الحرارية', c:P => P.Pump1_Fault},
  {id:'vf', p:1, t:'عطل الصمام Valve1: لم يصل إلى الوضع المطلوب', c:P => P.Valve1_Fault},
  {id:'lh', p:2, t:'مستوى مرتفع في Tank1 (أكثر من 90 %)', c:P => P.Tank1_Level > 90},
  {id:'ll', p:2, t:'مستوى منخفض في Tank1 (أقل من 10 %)', c:P => P.Tank1_Level < 10},
  {id:'ap', p:3, t:'ضغط الهواء منخفض (أقل من 4.5 bar)', c:P => P.Air_Pressure < 4.5}
];
const ALC = {1:'#e0201b', 2:'#f08c00', 3:'#f2c500'};
function prioShape(p, x, y, s, fill, stroke){
  const c = fill || ALC[p] || ALC[1], k = stroke || '#1a1a1a', tc = p === 1 && !fill ? '#fff' : '#111';
  let sh;
  if (p === 1) sh = `<path d="M${x + s / 2} ${y + 1}L${x + s - 1} ${y + s - 2}H${x + 1}Z" fill="${c}" stroke="${k}" stroke-width="1.2" stroke-linejoin="round"/>`;
  else if (p === 2) sh = `<path d="M${x + s / 2} ${y}L${x + s} ${y + s / 2}L${x + s / 2} ${y + s}L${x} ${y + s / 2}Z" fill="${c}" stroke="${k}" stroke-width="1.2"/>`;
  else sh = `<rect x="${x + 1}" y="${y + s * .18}" width="${s - 2}" height="${s * .64}" rx="2" fill="${c}" stroke="${k}" stroke-width="1.2"/>`;
  return sh + `<text x="${x + s / 2}" y="${y + s * (p === 1 ? .78 : .66)}" font-size="${s * .48}" text-anchor="middle" font-weight="700" fill="${fill && fill.indexOf('var') === 0 ? '#e0201b' : tc}">${p}</text>`;
}

/* ---------------- symbols ---------------- */
const LOOK = {off:['var(--hm-bg)', 'var(--hm-eqd)'], on:['var(--hm-run)', 'var(--hm-eqd)'], g:['#2bb33d', '#156b21'], r:['#e2332a', '#7d1610'], al:['#e0201b', '#7d1610'], alo:['var(--hm-bg)', '#e0201b']};
function stateOf(E, it){
  const d = it.dyn || {};
  const ct = it.type === 'ind' ? {tag:it.tag, sc:it.style === 'rg' ? 'rg' : 'isa'} : d.color;
  let st = 'off', run = false;
  if (ct && ct.tag){ run = !!E.v(ct.tag); st = ct.sc === 'rg' ? (run ? 'g' : 'r') : (run ? 'on' : 'off'); }
  let fault = false;
  if (d.al && d.al.tag && E.v(d.al.tag)){ fault = true; st = d.al.st === 'flash' ? (E.ph ? 'al' : 'alo') : 'al'; }
  return {st, run, fault};
}
function paint(E, it, st){
  const p = LOOK[st] || LOOK.off;
  if (it.style === '3d') return [`url(#${E.k}-g-${st})`, p[1]];
  return p;
}
const nameLbl = it => it.showName ? `<text x="${it.w / 2}" y="-6" text-anchor="middle" class="hm-nm">${esc(it.name)}</text>` : '';
const stTxt = (it, y, s, words) => it.stateText ? `<text x="${it.w / 2}" y="${y}" text-anchor="middle" font-size="13" class="ar" fill="${s.fault ? '#e0201b' : 'var(--hm-ink)'}" font-weight="${s.fault ? 700 : 500}">${s.fault ? 'عطل' : s.run ? words[0] : words[1]}</text>` : '';
function pumpG(it){ const th = it.stateText ? 18 : 0; const r = Math.max(8, Math.min(it.w / 2.2, (it.h - th) / 2) - 3); return {cx:Math.min(it.w / 2, it.w - r * 1.1 - 2), cy:(it.h - th) / 2, r}; }
function valveG(it){ const hh = it.h - (it.stateText ? 18 : 0); const by = hh * .45, bh = hh * .55; return {by, bh, my:by + bh / 2}; }
const SYM = {};
SYM.pump = (E, it) => {
  const g = pumpG(it), s = stateOf(E, it), [f, k] = paint(E, it, s.st), {cx, cy, r} = g;
  let o = '';
  if (it.style === '3d') o += `<ellipse cx="${cx}" cy="${cy + r + 5}" rx="${r * 1.15}" ry="${r * .2}" fill="#000" opacity=".28"/>`;
  o += `<path d="M${cx - r * .78} ${cy + r * 1.02}H${cx + r * .78}L${cx + r * .48} ${cy + r * .62}H${cx - r * .48}Z" fill="${f}" stroke="${k}" stroke-width="2" stroke-linejoin="round"/>`;
  o += `<rect x="${cx}" y="${cy - r}" width="${r * 1.1}" height="${r * .45}" fill="${f}" stroke="${k}" stroke-width="2"/>`;
  o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" stroke="${k}" stroke-width="2.4"/>`;
  const a = E.rt ? (E.P.t * (E.P.Pump1_Speed || 0) * 14) % 360 : 20;
  const bc = s.st === 'on' ? 'var(--hm-bg)' : s.st === 'off' || s.st === 'alo' ? k : 'rgba(255,255,255,.85)';
  o += `<g transform="rotate(${r1(a)} ${cx} ${cy})" stroke="${bc}" stroke-width="2.4" stroke-linecap="round"><path d="M${cx} ${cy}v${-r * .62}M${cx} ${cy}l${r * .54} ${r * .31}M${cx} ${cy}l${-r * .54} ${r * .31}"/></g>`;
  if (it.style === '3d') o += `<ellipse cx="${cx - r * .35}" cy="${cy - r * .45}" rx="${r * .32}" ry="${r * .18}" fill="#fff" opacity=".55"/>`;
  return o + stTxt(it, it.h - 3, s, ['يعمل', 'متوقف']) + nameLbl(it);
};
SYM.valve = (E, it) => {
  const s = stateOf(E, it), [f, k] = paint(E, it, s.st), w = it.w, {by, bh, my} = valveG(it);
  let o = `<line x1="${w / 2}" y1="${my}" x2="${w / 2}" y2="${by * .55}" stroke="${k}" stroke-width="2"/>`;
  o += `<path d="M${w * .2} ${by * .55}A${w * .4} ${w * .4} 0 0 1 ${w * .8} ${by * .55}Z" fill="${f}" stroke="${k}" stroke-width="2"/>`;
  o += `<path d="M1.5 ${by}L${w - 1.5} ${by + bh}V${by}L1.5 ${by + bh}Z" fill="${f}" stroke="${k}" stroke-width="2.2" stroke-linejoin="round"/>`;
  return o + stTxt(it, it.h - 3, s, ['مفتوح', 'مغلق']) + nameLbl(it);
};
SYM.tank = (E, it) => {
  const s = stateOf(E, it), w = it.w, h = it.h, rr = Math.min(16, w / 4), d = it.dyn || {};
  const k = s.fault ? '#e0201b' : 'var(--hm-eqd)', d3 = it.style === '3d';
  let o = `<path d="M1.5 ${rr}Q1.5 1.5 ${rr} 1.5H${w - rr}Q${w - 1.5} 1.5 ${w - 1.5} ${rr}V${h - 1.5}H1.5Z" fill="${d3 ? `url(#${E.k}-tk3)` : 'var(--hm-bg)'}" stroke="${k}" stroke-width="${s.fault && E.ph ? 4 : 2.4}"/>`;
  if (d.fill && d.fill.tag){ const lv = clamp(+E.v(d.fill.tag) || 0, 0, 100), lh = (h - 7) * lv / 100; o += `<rect x="4" y="${r1(h - 4 - lh)}" width="${w - 8}" height="${r1(lh)}" fill="${d3 ? `url(#${E.k}-lq3)` : 'var(--hm-liq)'}" opacity="${d3 ? 1 : .85}"/>`; }
  [.25, .5, .75].forEach(q => { o += `<line x1="${w - 11}" x2="${w - 3}" y1="${r1(h - 4 - (h - 7) * q)}" y2="${r1(h - 4 - (h - 7) * q)}" stroke="var(--hm-mu)" stroke-width="1.2"/>`; });
  if (d3) o += `<rect x="${w * .12}" y="${rr}" width="${w * .1}" height="${h - rr * 2}" fill="#fff" opacity=".35" rx="3"/>`;
  return o + nameLbl(it);
};
SYM.motor = (E, it) => {
  const s = stateOf(E, it), [f, k] = paint(E, it, s.st), w = it.w, h = it.h;
  let o = `<rect x="${w * .8}" y="${h * .42}" width="${w * .19}" height="${h * .16}" fill="var(--hm-eq)" stroke="${k}" stroke-width="1.5"/>`;
  o += `<rect x="1.5" y="${h * .12}" width="${w * .8}" height="${h * .76}" rx="5" fill="${f}" stroke="${k}" stroke-width="2.2"/>`;
  o += `<text x="${w * .41}" y="${h * .5 + 7}" text-anchor="middle" font-size="${Math.min(20, h * .45)}" font-weight="700" fill="${s.st === 'on' ? 'var(--hm-bg)' : s.st === 'off' || s.st === 'alo' ? 'var(--hm-ink)' : '#fff'}">M</text>`;
  if (it.style === '3d') o += `<rect x="6" y="${h * .17}" width="${w * .7}" height="${h * .14}" rx="4" fill="#fff" opacity=".45"/>`;
  return o + stTxt(it, it.h + 15, s, ['يعمل', 'متوقف']) + nameLbl(it);
};
SYM.ind = (E, it) => { const s = stateOf(E, it), [f, k] = paint(E, it, s.st), r = Math.min(it.w, it.h) / 2 - 2; return `<circle cx="${it.w / 2}" cy="${it.h / 2}" r="${r}" fill="${f}" stroke="${k}" stroke-width="2.4"/>`; };
SYM.bar = (E, it) => {
  const [mn, mx] = scaleOf(it), v = it.tag ? +E.v(it.tag) || 0 : (mn + mx) / 2, fr = clamp((v - mn) / (mx - mn), 0, 1), w = it.w, h = it.h;
  const out = hasRange(it) && (v < +it.lo || v > +it.hi), s = stateOf(E, it);
  let o = `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="var(--hm-field)" stroke="${s.fault ? '#e0201b' : 'var(--hm-eqd)'}" stroke-width="1.5"/>`;
  if (hasRange(it)){ const y1 = h - 2 - (h - 4) * clamp((+it.hi - mn) / (mx - mn), 0, 1), y2 = h - 2 - (h - 4) * clamp((+it.lo - mn) / (mx - mn), 0, 1); o += `<rect x="2" y="${r1(y1)}" width="5" height="${r1(y2 - y1)}" fill="var(--hm-band)"/>`; }
  o += `<rect x="9" y="${r1(h - 2 - (h - 4) * fr)}" width="${w - 11}" height="${r1((h - 4) * fr)}" fill="${out ? '#f08c00' : 'var(--hm-run)'}"/>`;
  o += `<text x="${w + 4}" y="11" font-size="11" class="hm-m">${esc(mx)}</text><text x="${w + 4}" y="${h}" font-size="11" class="hm-m">${esc(mn)}</text>`;
  if (it.unit) o += `<text x="${w + 4}" y="${h / 2 + 4}" font-size="11" class="hm-m">${esc(it.unit)}</text>`;
  return o;
};
SYM.gauge = (E, it) => {
  const [mn, mx] = scaleOf(it), v = it.tag ? +E.v(it.tag) || 0 : (mn + mx) / 2, fr = clamp((v - mn) / (mx - mn), 0, 1);
  const cx = it.w / 2, cy = it.h * .56, R = Math.min(it.w, it.h) * .42;
  const pp = (deg, rr) => [r1(cx + rr * Math.sin(deg * Math.PI / 180)), r1(cy - rr * Math.cos(deg * Math.PI / 180))];
  const a0 = pp(-120, R), a1 = pp(120, R);
  let o = `<path d="M${a0}A${R} ${R} 0 1 1 ${a1}" fill="none" stroke="var(--hm-eq)" stroke-width="6"/>`;
  if (hasRange(it)){ const d1 = -120 + 240 * clamp((+it.lo - mn) / (mx - mn), 0, 1), d2 = -120 + 240 * clamp((+it.hi - mn) / (mx - mn), 0, 1); o += `<path d="M${pp(d1, R)}A${R} ${R} 0 ${d2 - d1 > 180 ? 1 : 0} 1 ${pp(d2, R)}" fill="none" stroke="var(--hm-band)" stroke-width="6"/>`; }
  const n = pp(-120 + 240 * fr, R * .86);
  o += `<line x1="${cx}" y1="${cy}" x2="${n[0]}" y2="${n[1]}" stroke="var(--hm-ink)" stroke-width="2.4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="4" fill="var(--hm-ink)"/>`;
  o += `<text x="${cx}" y="${cy + R * .62}" text-anchor="middle" font-size="${Math.max(11, R * .3)}" font-weight="600" class="hm-t">${IL.fmt(v, 1)}${it.unit ? ' ' + esc(it.unit) : ''}</text>`;
  return o;
};
SYM.io = (E, it) => {
  const fs = +it.fs || 18, rb = it.style === 'rangebar', bh = rb ? it.h - 14 : it.h, w = it.w, tg = it.tag, tt = TT[tg];
  const inp = it.mode && it.mode !== 'out', s = stateOf(E, it);
  const val = tg ? E.v(tg) : 0;
  let o = `<rect x="1" y="1" width="${w - 2}" height="${bh - 2}" rx="2" fill="${inp ? 'var(--hm-field)' : 'var(--hm-bg)'}" stroke="${s.fault ? '#e0201b' : 'var(--hm-eqd)'}" stroke-width="${inp ? 1.8 : 1}"/>`;
  const unit = String(it.unit || ''), ufs = fs * .78, uw = unit ? unit.length * ufs * .62 + 5 : 0;
  const txt = !tg ? fmtF(it.f, 0) : tt && tt.t === 'Bool' ? String(+!!val) : fmtF(it.f, val);
  const ty = bh / 2 + fs * .36;
  o += `<text x="${r1(w - 6 - uw)}" y="${r1(ty)}" font-size="${fs}" text-anchor="end" class="hm-t" font-weight="600">${esc(txt)}</text>`;
  if (unit) o += `<text x="${w - 6}" y="${r1(ty)}" font-size="${r1(ufs)}" text-anchor="end" class="hm-m">${esc(unit)}</text>`;
  if (rb){
    const [mn, mx] = scaleOf(it), pos = v => r1(4 + (w - 8) * clamp((v - mn) / (mx - mn), 0, 1));
    o += `<rect x="4" y="${bh + 4}" width="${w - 8}" height="6" fill="var(--hm-eq)"/>`;
    if (hasRange(it)) o += `<rect x="${pos(+it.lo)}" y="${bh + 4}" width="${r1(pos(+it.hi) - pos(+it.lo))}" height="6" fill="var(--hm-band)"/>`;
    const out = hasRange(it) && (+val < +it.lo || +val > +it.hi), px = pos(+val || 0);
    o += `<path d="M${px} ${bh + 10}l-5 4h10z" fill="${out ? '#f08c00' : 'var(--hm-ink)'}"/><line x1="${px}" x2="${px}" y1="${bh + 2}" y2="${bh + 11}" stroke="${out ? '#f08c00' : 'var(--hm-ink)'}" stroke-width="2"/>`;
  }
  return o;
};
function btnSvg(E, it, extra){
  const pr = E.rt && E.pressed && E.pressed.id === it.id, fs = Math.min(17, it.h * .42);
  return `<rect x="1" y="1" width="${it.w - 2}" height="${it.h - 2}" rx="5" fill="${pr ? 'var(--hm-btnp)' : 'var(--hm-btn)'}" stroke="var(--hm-eqd)" stroke-width="1.4"/>` +
    (pr ? '' : `<path d="M3 ${it.h - 3}H${it.w - 3}" stroke="var(--hm-eqd)" stroke-width="2" opacity=".5"/>`) +
    `<text x="${it.w / 2}" y="${it.h / 2 + fs * .36}" text-anchor="middle" font-size="${r1(fs)}" font-weight="600" class="hm-t ar">${esc(it.text || '')}${extra || ''}</text>`;
}
SYM.button = (E, it) => btnSvg(E, it);
SYM.scr = (E, it) => btnSvg(E, it) + `<rect x="5" y="5" width="6" height="${it.h - 10}" rx="2" fill="var(--hm-eqd)" opacity=".55"/>`;
SYM.text = (E, it) => { const fs = +it.fs || 18; return `<text x="${it.w / 2}" y="${r1(it.h / 2 + fs * .36)}" text-anchor="middle" font-size="${fs}" font-weight="600" class="hm-t ar">${esc(it.text || '')}</text>`; };
SYM.alarm = (E, it) => {
  const p = +it.prio || 1, s = Math.min(it.w, it.h);
  const unack = E.rt && E.al.some(a => !a.acked);
  return unack && !E.ph ? prioShape(p, 0, 0, s, 'var(--hm-bg)', ALC[p]) : prioShape(p, 0, 0, s);
};
SYM.trend = (E, it) => {
  const w = it.w, h = it.h, [mn, mx] = scaleOf(it), pw = w - 34, ph = h - 22;
  let o = `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="var(--hm-field)" stroke="var(--hm-eqd)" stroke-width="1.2"/>`;
  for (let i = 0; i <= 4; i++){ const y = r1(6 + ph * i / 4); o += `<line x1="30" x2="${w - 4}" y1="${y}" y2="${y}" stroke="var(--hm-eq)" stroke-width="1"/>`; }
  o += `<text x="27" y="12" font-size="10" text-anchor="end" class="hm-m">${esc(mx)}</text><text x="27" y="${6 + ph}" font-size="10" text-anchor="end" class="hm-m">${esc(mn)}</text>`;
  o += `<text x="32" y="${h - 4}" font-size="10" class="hm-m">${esc(it.tag || '(بلا وسم)')}</text>`;
  let pts = [];
  if (it.tag && E.rt){ const hs = E.hist[it.tag] || []; const n = 120; pts = hs.slice(-n).map((v, i, a) => [30 + pw * (i + n - a.length) / (n - 1), 6 + ph * (1 - clamp((v - mn) / (mx - mn), 0, 1))]); }
  else if (it.tag){ for (let i = 0; i < 40; i++){ const v = mn + (mx - mn) * (.55 + .2 * Math.sin(i / 5) + .05 * Math.sin(i * 1.7)); pts.push([30 + pw * i / 39, 6 + ph * (1 - (v - mn) / (mx - mn))]); } }
  if (pts.length > 1) o += `<polyline points="${pts.map(p => r1(p[0]) + ',' + r1(p[1])).join(' ')}" fill="none" stroke="${it.tag === 'Tank1_Level' ? 'var(--hm-liq)' : 'var(--hm-ink)'}" stroke-width="2"/>`;
  return o;
};
function faceSvg(E, popup){
  const v = E.v, run = !!v('Pump1_Running'), flt = !!v('Pump1_Fault'), man = !!v('Pump1_Manual');
  const st = flt ? (E.ph ? 'al' : 'alo') : run ? 'on' : 'off', [f, k] = LOOK[st];
  const btn = (x, y, w, h, t, act, on) => `<g data-fp="${act}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${on ? 'var(--hm-btnp)' : 'var(--hm-btn)'}" stroke="var(--hm-eqd)" stroke-width="1.2"/><text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" font-size="13" font-weight="600" class="hm-t">${t}</text></g>`;
  let o = `<rect x="0" y="0" width="200" height="190" rx="6" fill="var(--hm-pop)" stroke="var(--hm-eqd)" stroke-width="1.5"/>`;
  o += `<path d="M0 6Q0 0 6 0H194Q200 0 200 6V26H0Z" fill="var(--hm-eq)"/><text x="10" y="18" font-size="13" font-weight="600" class="hm-t">Pump1 · Faceplate</text>`;
  if (popup) o += `<g data-fp="close"><rect x="170" y="2" width="28" height="22" fill="transparent"/><path d="M178 7l12 12M190 7l-12 12" stroke="var(--hm-ink)" stroke-width="2"/></g>`;
  o += `<circle cx="22" cy="44" r="10" fill="${f}" stroke="${k}" stroke-width="2"/><text x="40" y="49" font-size="14" class="ar" font-weight="600" fill="${flt ? '#e0201b' : 'var(--hm-ink)'}">${flt ? 'عطل' : run ? 'يعمل' : 'متوقف'}</text>`;
  o += btn(128, 33, 64, 22, man ? 'MAN' : 'AUTO', 'mode', man);
  const row = (y, l, val, u) => `<text x="10" y="${y}" font-size="12" class="hm-m">${l}</text><text x="${u ? 166 : 190}" y="${y}" font-size="14" text-anchor="end" font-weight="600" class="hm-t">${val}</text>${u ? `<text x="190" y="${y}" font-size="11" text-anchor="end" class="hm-m">${u}</text>` : ''}`;
  o += `<text x="10" y="82" font-size="12" class="hm-m">Speed SP</text>` + btn(80, 67, 26, 22, '−', 'spm') + `<text x="137" y="83" font-size="14" text-anchor="middle" font-weight="600" class="hm-t">${IL.fmt(+v('Pump1_Speed_SP') || 0, 1)}</text>` + btn(166, 67, 26, 22, '+', 'spp');
  o += row(108, 'Speed', IL.fmt(+v('Pump1_Speed') || 0, 1), 'Hz') + row(130, 'Current', IL.fmt(+v('Pump1_Current') || 0, 1), 'A');
  const cf = clamp((+v('Pump1_Current') || 0) / 30, 0, 1);
  o += `<rect x="10" y="136" width="180" height="5" fill="var(--hm-eq)"/><rect x="10" y="136" width="${r1(180 * cf)}" height="5" fill="var(--hm-run)"/>`;
  const pr = E.fpDown;
  o += btn(10, 152, 85, 30, 'Start', 'start', pr === 'start') + btn(105, 152, 85, 30, 'Stop', 'stop', pr === 'stop');
  return o;
}
SYM.face = (E, it) => `<g transform="scale(${r1(it.w / 200 * 1000) / 1000} ${r1(it.h / 190 * 1000) / 1000})">${faceSvg(E, false)}</g>`;
SYM.filler = (E, it) => {
  const s = stateOf(E, it), [f, k] = paint(E, it, s.st), w = it.w, h = it.h;
  let o = `<rect x="1.5" y="1.5" width="${w - 3}" height="${h * .42}" rx="3" fill="${f}" stroke="${k}" stroke-width="2"/>`;
  o += `<rect x="${w * .38}" y="${h * .42}" width="${w * .24}" height="${h * .26}" fill="var(--hm-eq)" stroke="${k}" stroke-width="1.6"/>`;
  o += `<path d="M${w * .42} ${h * .68}h${w * .16}l-${w * .04} ${h * .08}h-${w * .08}z" fill="var(--hm-eqd)"/>`;
  if (E.rt && s.run && E.P._flow > .2 && (E.P._conv % 1) > .25 && (E.P._conv % 1) < .75) o += `<rect x="${w * .48}" y="${h * .76}" width="${w * .04}" height="${h * .24}" fill="var(--hm-liq)"/>`;
  return o + nameLbl(it);
};
SYM.capper = (E, it) => {
  const s = stateOf(E, it), [f, k] = paint(E, it, s.st), w = it.w, h = it.h;
  const dz = E.rt && s.run ? Math.max(0, Math.sin(E.P._cap * 5)) * h * .1 : 0;
  let o = `<rect x="1.5" y="1.5" width="${w - 3}" height="${h * .36}" rx="3" fill="${f}" stroke="${k}" stroke-width="2"/>`;
  o += `<rect x="${w * .44}" y="${h * .36}" width="${w * .12}" height="${r1(h * .2 + dz)}" fill="var(--hm-eq)" stroke="${k}" stroke-width="1.4"/>`;
  o += `<rect x="${w * .3}" y="${r1(h * .56 + dz)}" width="${w * .4}" height="${h * .1}" rx="2" fill="var(--hm-eqd)"/>`;
  return o + nameLbl(it);
};
SYM.conv = (E, it) => {
  const s = stateOf(E, it), [f, k] = paint(E, it, s.st), w = it.w, h = it.h, by = h * .62, bth = h * .3;
  let o = `<rect x="1.5" y="${by}" width="${w - 3}" height="${bth}" rx="${bth / 2}" fill="${f}" stroke="${k}" stroke-width="2"/>`;
  for (let x = bth / 2 + 2; x < w - bth / 2; x += 26) o += `<circle cx="${r1(x)}" cy="${r1(by + bth / 2)}" r="${r1(bth * .28)}" fill="var(--hm-bg)" stroke="${k}" stroke-width="1.2"/>`;
  const sp = 40, ph = E.rt ? (E.P._conv % 1) * sp : 12, bw = 14, bh = h * .52;
  for (let x = -sp + ph; x < w - bw; x += sp){
    if (x < 2) continue;
    const full = x > w * .3, cap = x > w * .68;
    o += `<rect x="${r1(x)}" y="${r1(by - bh)}" width="${bw}" height="${r1(bh)}" rx="3" fill="var(--hm-bg)" stroke="var(--hm-eqd)" stroke-width="1.3"/>`;
    if (full) o += `<rect x="${r1(x + 2)}" y="${r1(by - bh * .7)}" width="${bw - 4}" height="${r1(bh * .68)}" fill="var(--hm-liq)" opacity=".8"/>`;
    o += `<rect x="${r1(x + 4)}" y="${r1(by - bh - 4)}" width="${bw - 8}" height="5" fill="${cap ? 'var(--hm-eqd)' : 'none'}" stroke="var(--hm-eqd)" stroke-width="1"/>`;
  }
  return o + nameLbl(it);
};
SYM.alview = (E, it) => {
  const w = it.w, h = it.h, rh = 26, rows = Math.max(1, Math.floor((h - 66) / rh));
  let o = `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="var(--hm-field)" stroke="var(--hm-eqd)" stroke-width="1.2"/>`;
  o += `<rect x="1" y="1" width="${w - 2}" height="24" fill="var(--hm-eq)"/>`;
  o += `<text x="10" y="18" font-size="12" font-weight="600" class="hm-t">Time</text><text x="92" y="18" font-size="12" font-weight="600" class="hm-t">P</text><text x="122" y="18" font-size="12" font-weight="600" class="hm-t">State</text><text x="${w - 10}" y="18" font-size="12" font-weight="600" class="hm-t ar" text-anchor="end">الرسالة</text>`;
  const list = E.rt ? E.al : [];
  list.slice(0, rows).forEach((a, i) => {
    const y = 26 + i * rh, un = !a.acked;
    if (un && E.ph) o += `<rect x="2" y="${y}" width="${w - 4}" height="${rh}" fill="${ALC[a.p]}" opacity=".22"/>`;
    o += `<line x1="2" x2="${w - 2}" y1="${y + rh}" y2="${y + rh}" stroke="var(--hm-eq)"/>`;
    o += `<text x="10" y="${y + 17}" font-size="12" class="hm-t">${E.clock(a.tin)}</text>` + prioShape(a.p, 86, y + 4, 18);
    o += `<text x="122" y="${y + 17}" font-size="12" class="hm-t ar">${a.active ? (un ? 'قادم' : 'قادم · مؤكد') : 'زال · غير مؤكد'}</text>`;
    o += `<text x="${w - 10}" y="${y + 17}" font-size="13" class="hm-t ar" text-anchor="end" font-weight="${un ? 700 : 400}">${esc(a.t)}</text>`;
  });
  if (!list.length) o += `<text x="${w / 2}" y="${26 + rh * .7}" font-size="12" class="hm-m ar" text-anchor="middle">${E.rt ? 'لا توجد إنذارات' : 'Alarm view: تظهر الإنذارات هنا في Runtime'}</text>`;
  const un = list.filter(a => !a.acked).length;
  o += `<text x="10" y="${h - 14}" font-size="12" class="hm-m ar">${E.rt ? 'غير مؤكد: ' + un : ''}</text>`;
  o += `<g data-act="ack"><rect x="${w - 150}" y="${h - 36}" width="142" height="30" rx="4" fill="var(--hm-btn)" stroke="var(--hm-eqd)" stroke-width="1.3"/><text x="${w - 79}" y="${h - 16}" font-size="13" text-anchor="middle" font-weight="600" class="hm-t">Acknowledge</text></g>`;
  return o;
};
SYM.pie = (E, it) => {
  const w = it.w, h = it.h;
  if (it.style === 'bars'){ const vals = [62, 18, 34, 12], l = ['Tank1', 'Pump1', 'Valve1', 'Mixer1']; let o = ''; const bh = (h - 10) / 4; vals.forEach((v, i) => { const y = 5 + i * bh; o += `<text x="0" y="${r1(y + bh * .62)}" font-size="11" class="hm-m">${l[i]}</text><rect x="48" y="${r1(y + bh * .2)}" width="${r1((w - 52) * v / 100)}" height="${r1(bh * .55)}" fill="var(--hm-run)"/>`; }); return o; }
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 3, cols = ['#ff2d55', '#00c853', '#2979ff', '#ffd600', '#aa00ff'], vals = [.3, .22, .2, .16, .12];
  let a = -Math.PI / 2, o = '';
  vals.forEach((v, i) => { const b = a + v * Math.PI * 2; const p1 = [cx + R * Math.cos(a), cy + R * Math.sin(a)], p2 = [cx + R * Math.cos(b), cy + R * Math.sin(b)]; o += `<path d="M${cx} ${cy}L${r1(p1[0])} ${r1(p1[1])}A${R} ${R} 0 ${v > .5 ? 1 : 0} 1 ${r1(p2[0])} ${r1(p2[1])}Z" fill="${cols[i]}" stroke="#fff" stroke-width="1.5"/><text x="${r1(cx + R * .62 * Math.cos((a + b) / 2))}" y="${r1(cy + R * .62 * Math.sin((a + b) / 2) + 3)}" font-size="7" text-anchor="middle" fill="#000">${Math.round(v * 100)}%</text>`; a = b; });
  return o;
};
SYM.deco = (E, it) => {
  const w = it.w, h = it.h, cx = w / 2, cy = h / 2, st = it.style === 'static';
  let pts = []; for (let i = 0; i < 20; i++){ const rr = i % 2 ? Math.min(w, h) * .3 : Math.min(w / 2, h / 2 + 8); const a = i * Math.PI / 10; pts.push(r1(cx + rr * 1.6 * Math.cos(a) * .6) + ',' + r1(cy + rr * Math.sin(a))); }
  const on = st || E.ph;
  return `<polygon points="${pts.join(' ')}" fill="${st ? 'var(--hm-eq)' : on ? '#ffeb00' : '#ff00c8'}" stroke="${st ? 'var(--hm-eqd)' : '#ff3d00'}" stroke-width="2"/><text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="17" font-weight="700" fill="${st ? 'var(--hm-ink)' : on ? '#d50000' : '#fff'}">LIVE!</text>`;
};

/* pipes: auto-routed between two objects (from → to), or a free straight segment */
function port(it, out, rightward){
  const side = out === rightward ? it.x + it.w : it.x;
  if (it.type === 'tank') return [side, it.y + it.h * .85];
  if (it.type === 'pump'){ const g = pumpG(it); return out ? [it.x + g.cx + g.r * 1.1, it.y + g.cy - g.r * .775] : [it.x + g.cx - g.r, it.y + g.cy]; }
  if (it.type === 'valve') return [side, it.y + valveG(it).my];
  if (it.type === 'filler') return [side, it.y + it.h * .2];
  return [side, it.y + it.h / 2];
}
function route(it, items){
  const A = items.find(i => i.id === it.from), B = items.find(i => i.id === it.to);
  if (!A || !B || A === B) return null;
  const rw = B.x + B.w / 2 >= A.x + A.w / 2;
  const s = port(A, true, rw), e = port(B, false, rw);
  const mx = r1((s[0] + e[0]) / 2);
  if (Math.abs(s[1] - e[1]) < 1) return [s, e];
  return [s, [mx, s[1]], [mx, e[1]], e];
}

/* ---------------- tabs ---------------- */
const TABS = [
  {id:'isa', t:'ISA-101', l:'l3', h:'شاشة عالية الأداء ISA-101', goal:'أصلح الشاشة سيئة التصميم: خلفية رمادية، رموز مسطحة، حالة التشغيل بالرمادي الداكن مع نص، اللون للإنذارات فقط، أرقام مقروءة بوحداتها، وشريط النطاق الطبيعي للقيم التناظرية.'},
  {id:'objects', t:'عناصر التشغيل', l:'l4', h:'عناصر التشغيل: أزرار وحقل إدخال ومؤشرات', goal:'ابنِ شاشة تشغيل المضخة: زرّا Start و Stop لحظيان، حقل سرعة بحدود 0–50 Hz وتنسيق 99.9، مؤشر للتشغيل، وشريط للتيار. ثم شغّلها في Runtime وجرّب سرعة مقبولة و 60 المرفوضة.'},
  {id:'dyn', t:'الديناميكية', l:'l5', h:'الحركة والديناميكية والوجوه الجاهزة', goal:'اربط امتلاء الخزان، ولوّن الصمام حسب حالته على نمط ISA، وأظهر أيقونة الإنذار عند عطل المضخة فقط، واجعل النقر على المضخة يفتح الوجه الجاهز. ثم تحقّق في Runtime بحقن عطل.'},
  {id:'project', t:'مشروع خط التعبئة', l:'l12', h:'مشروع: محطة خط التعبئة', goal:'ابنِ شاشة نظرة عامة لخط التعبئة مع الأنابيب والأزرار والعدّاد والترند، وشاشة إنذارات، ثم شغّل الخط في Runtime: أنتج عبوات، وأكّد إنذار عطل، واستمر العدّ.'}
];
const tabsEl = $('#tabs'), panes = $('#panes'), G = {};
TABS.forEach(tb => {
  const b = document.createElement('button'); b.className = 'btn' + (IL.has(tb.l, 'sim') ? ' done' : ''); b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = tb.t; b.dataset.id = tb.id;
  b.addEventListener('click', () => show(tb.id)); tabsEl.appendChild(b);
  const p = document.createElement('section'); p.className = 'pane'; p.id = 'p-' + tb.id;
  p.innerHTML = `<h2 style="margin:0 0 8px">${esc(tb.h)}</h2><div class="goal${IL.has(tb.l, 'sim') ? ' ok' : ''}" id="g-${tb.id}"><b class="k">${IL.has(tb.l, 'sim') ? '✓ أُنجز' : 'المطلوب'}</b>${esc(tb.goal)}</div><div class="body"></div>`;
  panes.appendChild(p); G[tb.id] = tb;
});
function show(id){
  if (!G[id]) id = 'isa';
  $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + id));
  $$('#tabs .btn').forEach(b => b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false'));
  if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  if (!G[id].built){ G[id].built = true; G[id].ed = Editor($('#p-' + id + ' .body'), CFG[id]); }
  else if (G[id].ed) G[id].ed.render();
}
function win(id, msg){
  const tb = G[id]; IL.mark(tb.l, 'sim');
  const g = $('#g-' + id); if (g.classList.contains('ok') && g.dataset.won) return;
  g.dataset.won = '1'; g.classList.add('ok'); g.innerHTML = `<b class="k">✓ أُنجز</b>${esc(msg || tb.goal)}`;
  $(`#tabs .btn[data-id="${id}"]`).classList.add('done');
}

/* ---------------- editor ---------------- */
let EK = 0;
function Editor(host, cfg){
  const E = {cfg, k:'d' + (++EK), rt:false, sel:null, cur:'main', arm:null, zoom:1, demoing:false, f:{}, al:[], hist:{}, popup:null, pressed:null, ph:0, P:null, rtScr:'main', setAt:{}};
  const stored = loadAll()[cfg.id];
  E.doc = validDoc(stored) ? stored : cfg.init();
  E.v = tag => { if (!tag) return 0; if (E.rt) return E.P[tag] == null ? 0 : E.P[tag]; return PREV[tag] || 0; };
  E.clock = tin => { const d = new Date(E.t0 + tin * 1000); return [d.getHours(), d.getMinutes(), d.getSeconds()].map(x => String(x).padStart(2, '0')).join(':'); };
  const multi = Object.keys(E.doc.screens).length > 1;
  host.innerHTML = `<div class="ed">
    <div class="ed-tool">
      <button type="button" class="btn rtb" data-a="rt">▶ تشغيل Runtime</button>
      <button type="button" class="btn" data-a="dup" disabled>⧉ نسخ</button>
      <button type="button" class="btn" data-a="del" disabled>✕ حذف</button>
      <button type="button" class="btn" data-a="zoom" aria-pressed="false">⤢ تكبير ×2</button>
      <span class="sp"></span>
      <button type="button" class="btn" data-a="reset">↺ ابدأ من جديد</button>
      <button type="button" class="btn" data-a="demo">▶ شاهد الحل</button>
    </div>
    <div class="ed-pal"><h3>صندوق الأدوات</h3><div class="pal-g">${PAL.map(t => `<button type="button" class="pal-i" data-type="${t}" title="${TYPES[t].n}" aria-pressed="false">${icon(t)}<span>${TYPES[t].a}</span></button>`).join('')}</div></div>
    <div class="ed-cv">
      <div class="ed-scr"${multi ? '' : ' hidden'}></div>
      <div class="ed-wrap"><svg viewBox="0 0 ${W} ${H}" tabindex="0" role="application" aria-label="لوحة تصميم الشاشة"></svg>
        <div class="kp" hidden><div class="kp-b"><b class="kp-t"></b><input class="kp-i" inputmode="decimal" autocomplete="off" dir="ltr"><div class="kp-r"><button type="button" class="btn pri kp-ok">OK</button><button type="button" class="btn kp-x">إلغاء</button></div><p class="kp-m" aria-live="polite"></p></div></div>
      </div>
      <p class="ed-msg" aria-live="polite"></p>
      <div class="ed-test" hidden><h3>لوحة الاختبار: محاكاة المصنع والـ PLC</h3><div class="row">${cfg.test.map(t => `<button type="button" class="btn" data-t="${t}">${TEST[t]}</button>`).join('')}</div><div class="watch-w"><table class="watch"></table></div></div>
    </div>
    <div class="ed-side"><div class="panel ed-props"></div><div class="panel ed-chk"><h3>قائمة التحقق <span></span></h3><ul></ul><p class="chk-h" hidden></p></div></div>
  </div>`;
  const root = $('.ed', host), svg = $('.ed-wrap svg', root), wrap = $('.ed-wrap', root), props = $('.ed-props', root), msg = $('.ed-msg', root), pal = $('.ed-pal', root);
  const kp = $('.kp', root), kpi = $('.kp-i', root), kpm = $('.kp-m', root);
  const scr = () => E.doc.screens[E.rt ? E.rtScr : E.cur];
  const items = () => scr().items;
  const find = id => items().find(i => i.id === id);
  const selItem = () => E.sel ? find(E.sel) : null;
  E.say = (m, c) => { msg.textContent = m || ''; msg.className = 'ed-msg' + (c ? ' ' + c : ''); };
  let saveT = 0;
  E.save = () => { if (E.demoing) return; clearTimeout(saveT); saveT = setTimeout(() => saveDoc(cfg.id, E.doc), 250); };

  /* ---- render ---- */
  const defs = () => {
    const rg = (id, a, b, c) => `<radialGradient id="${E.k}-g-${id}" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
    return `<defs>${rg('off', '#ffffff', '#b9c1c7', '#59626a')}${rg('alo', '#ffffff', '#b9c1c7', '#59626a')}${rg('on', '#dfe4e7', '#6c757c', '#262d32')}${rg('g', '#d3ffd3', '#2fd04a', '#0b5f18')}${rg('r', '#ffd6cf', '#f0392b', '#6e0d07')}${rg('al', '#ffd6cf', '#f0392b', '#6e0d07')}
      <linearGradient id="${E.k}-rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff1744"/><stop offset=".2" stop-color="#ff9100"/><stop offset=".4" stop-color="#ffea00"/><stop offset=".6" stop-color="#00e676"/><stop offset=".8" stop-color="#2979ff"/><stop offset="1" stop-color="#d500f9"/></linearGradient>
      <linearGradient id="${E.k}-tk3" x1="0" x2="1"><stop offset="0" stop-color="#5d666d"/><stop offset=".3" stop-color="#f4f6f7"/><stop offset=".7" stop-color="#8f989e"/><stop offset="1" stop-color="#3f464c"/></linearGradient>
      <linearGradient id="${E.k}-lq3" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7fe3ff"/><stop offset="1" stop-color="#0047c8"/></linearGradient>
      <pattern id="${E.k}-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="var(--hm-grid)" stroke-width="1"/></pattern></defs>`;
  };
  const BGF = {grey:'var(--hm-bg)', rainbow:null, black:'#050505', blue:'#0b1f5c'};
  function visOf(it){ const vd = it.dyn && it.dyn.vis; if (!vd || !vd.tag) return true; return (!!E.v(vd.tag)) === (vd.c !== '0'); }
  function drawItem(it, list){
    const vis = visOf(it);
    if (E.rt && !vis) return '';
    const dim = !E.rt && !vis ? ' opacity=".4"' : '';
    if (it.type === 'pipe'){
      const pts = route(it, list);
      let d;
      if (pts){ d = 'M' + pts.map(p => p.map(r1).join(' ')).join('L'); const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); it.x = Math.min(...xs); it.y = Math.min(...ys) - 5; it.w = Math.max(10, Math.max(...xs) - it.x); it.h = Math.max(10, Math.max(...ys) - Math.min(...ys) + 10); }
      else d = it.w >= it.h ? `M${it.x} ${it.y + it.h / 2}H${it.x + it.w}` : `M${it.x + it.w / 2} ${it.y}V${it.y + it.h}`;
      const flow = E.rt && E.P._flow > .1;
      return `<g data-id="${it.id}"${dim}><path d="${d}" fill="none" stroke="transparent" stroke-width="18"/><path d="${d}" fill="none" stroke="var(--hm-line)" stroke-width="6" stroke-linejoin="round"/>${flow ? `<path d="${d}" fill="none" stroke="var(--hm-liq)" stroke-width="2.4" stroke-dasharray="7 9" stroke-dashoffset="${r1(-(E.P.t * 30) % 16)}"/>` : ''}</g>`;
    }
    const f = SYM[it.type];
    return `<g data-id="${it.id}" transform="translate(${it.x} ${it.y})"${dim}><rect width="${it.w}" height="${it.h}" fill="transparent"/>${f ? f(E, it) : ''}${!E.rt && !vis ? `<rect width="${it.w}" height="${it.h}" fill="none" stroke="var(--hm-mu)" stroke-dasharray="4 3"/>` : ''}</g>`;
  }
  E.render = () => {
    const s = scr(), list = s.items;
    let o = defs();
    o += s.bg === 'rainbow' ? `<rect width="${W}" height="${H}" fill="url(#${E.k}-rb)"/>` : `<rect width="${W}" height="${H}" fill="${BGF[s.bg] || BGF.grey}"/>`;
    if (!E.rt) o += `<rect width="${W}" height="${H}" fill="url(#${E.k}-grid)"/>`;
    list.filter(i => i.type === 'pipe').forEach(it => { o += drawItem(it, list); });
    list.filter(i => i.type !== 'pipe').forEach(it => { o += drawItem(it, list); });
    if (E.rt && E.popup){ o += `<rect width="${W}" height="${H}" fill="#000" opacity=".25" data-fp="close"/><g transform="translate(250 55) scale(1.5)">${faceSvg(E, true)}</g>`; }
    if (E.rt) o += `<text x="${W - 8}" y="${H - 8}" text-anchor="end" font-size="11" class="hm-m">Runtime · ${esc(s.t)}</text>`;
    const it = !E.rt && selItem();
    if (it){
      const u = W / Math.max(100, svg.getBoundingClientRect().width || W), hs = clamp(13 * u, 8, 30);
      o += `<rect x="${it.x - 2}" y="${it.y - 2}" width="${it.w + 4}" height="${it.h + 4}" fill="none" stroke="var(--hm-sel)" stroke-width="${r1(1.6 * u)}" stroke-dasharray="${r1(5 * u)} ${r1(3 * u)}" pointer-events="none"/>`;
      if (!(it.type === 'pipe' && it.from && it.to)) [['nw', it.x, it.y], ['ne', it.x + it.w, it.y], ['sw', it.x, it.y + it.h], ['se', it.x + it.w, it.y + it.h]].forEach(([h, x, y]) => { o += `<rect data-h="${h}" x="${r1(x - hs / 2)}" y="${r1(y - hs / 2)}" width="${r1(hs)}" height="${r1(hs)}" fill="var(--panel)" stroke="var(--hm-sel)" stroke-width="${r1(1.6 * u)}"/>`; });
    }
    svg.innerHTML = o;
    E.blinky = list.some(i => (i.type === 'deco' && i.style !== 'static'));
  };

  /* ---- screens strip ---- */
  const scrEl = $('.ed-scr', root);
  function renderScr(){
    if (!multi) return;
    if (E.rt){ scrEl.innerHTML = `<span class="muted">الشاشة الحالية:</span> <b class="mono">${esc(scr().t)}</b>`; return; }
    scrEl.innerHTML = '<span class="muted">الشاشات:</span>' + Object.keys(E.doc.screens).map(k => `<button type="button" class="btn" data-scr="${k}" aria-pressed="${k === E.cur}"><bdi>${esc(E.doc.screens[k].t)}</bdi> · ${esc(E.doc.screens[k].a)}</button>`).join('');
  }
  scrEl.addEventListener('click', e => { const b = e.target.closest('[data-scr]'); if (!b || E.rt) return; E.cur = b.dataset.scr; E.sel = null; renderScr(); E.render(); E.panel(); E.tool(); });

  /* ---- properties panel ---- */
  const F = {
    txt:(l, k, v, ltr) => `<label><span>${l}</span><input data-k="${k}" value="${esc(v == null ? '' : v)}"${ltr ? ' dir="ltr"' : ''}></label>`,
    num:(l, k, v) => `<label><span>${l}</span><input data-k="${k}" data-n="1" type="number" inputmode="decimal" step="any" value="${esc(v == null ? '' : v)}" dir="ltr"></label>`,
    sel:(l, k, v, opts, ltr) => `<label><span>${l}</span><select data-k="${k}"${ltr ? ' dir="ltr"' : ''}>${opts.map(o => `<option value="${esc(o[0])}"${String(o[0]) === String(v == null ? '' : v) ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`,
    chk:(l, k, v) => `<label class="ck"><input type="checkbox" data-k="${k}"${v ? ' checked' : ''}><span>${l}</span></label>`
  };
  const tagOpts = filt => [['', '— بلا وسم —']].concat(TAGS.filter(t => !filt || filt(t)).map(t => [t[0], `${t[0]} (${t[1]}${t[2] ? ', ' + t[2] : ''})`]));
  const boolT = t => t[1] === 'Bool', anaT = t => t[1] !== 'Bool';
  E.panel = () => {
    if (E.rt){ props.innerHTML = `<h3>Runtime</h3><p class="tip">الشاشة تعمل الآن على المصنع المحاكى. التحرير متوقف؛ اضغط «■ رجوع للتصميم» للتعديل.</p><p class="tip">الأزرار تستجيب للضغط والإفلات، وحقول الإدخال تفتح لوحة أرقام عند النقر.</p>`; return; }
    const it = selItem();
    if (!it){
      const s = scr();
      props.innerHTML = `<h3>خصائص الشاشة <small>${esc(s.t)}</small></h3><fieldset><legend>عام</legend>${F.sel('الخلفية Background', 'bg', s.bg, BGS)}</fieldset><p class="tip">اختر عنصرًا على الشاشة لعرض خصائصه، أو اسحب عنصرًا من صندوق الأدوات (أو انقره ثم انقر مكانًا على الشاشة).</p>`;
      return;
    }
    const T = TYPES[it.type], d = it.dyn || {}, ev = it.ev || {};
    let h = `<h3>${esc(T.a)} <small>${esc(T.n)}</small><span class="acts"><button type="button" class="btn" data-a="dup">⧉ نسخ</button><button type="button" class="btn" data-a="del">✕ حذف</button></span></h3>`;
    h += `<fieldset><legend>عام</legend>${F.txt('الاسم Name', 'name', it.name, true)}`;
    if (it.type === 'pipe'){
      const others = items().filter(i => i.type !== 'pipe' && i.type !== 'text');
      const op = [['', '— حرّ —']].concat(others.map(i => [i.id, i.name]));
      h += F.sel('يصل من From', 'from', it.from, op, true) + F.sel('إلى To', 'to', it.to, op, true);
      h += `<p class="tip">اختر الجهازين، فيُرسم الأنبوب تلقائيًا بينهما ويتبعهما عند التحريك.</p>`;
    }
    if (!(it.type === 'pipe' && it.from && it.to)) h += `<div class="g4">${F.num('X', 'x', it.x)}${F.num('Y', 'y', it.y)}${F.num('W', 'w', it.w)}${F.num('H', 'h', it.h)}</div>`;
    if (STY[it.type]) h += F.sel('النمط Style', 'style', it.style, STY[it.type]);
    if (['button', 'text', 'scr'].includes(it.type)) h += F.txt('النص Text', 'text', it.text);
    if (it.type === 'text') h += F.num('حجم الخط', 'fs', it.fs);
    if (['pump', 'valve', 'motor', 'tank', 'filler', 'conv', 'capper'].includes(it.type)) h += F.chk('إظهار الاسم', 'showName', it.showName);
    if (['pump', 'valve', 'motor'].includes(it.type)) h += F.chk('نص الحالة (يعمل/متوقف)', 'stateText', it.stateText);
    if (it.type === 'alarm') h += F.sel('الأولوية Priority', 'prio', it.prio, [[1, '1 · عالية (مثلث أحمر)'], [2, '2 · متوسطة (معيّن برتقالي)'], [3, '3 · منخفضة (مستطيل أصفر)']]);
    if (it.type === 'scr') h += F.sel('الشاشة الهدف', 'target', it.target, Object.keys(E.doc.screens).map(k => [k, E.doc.screens[k].t + ' · ' + E.doc.screens[k].a]));
    if (it.type === 'face') h += `<p class="tip">مثيل من النوع المعرّف <b class="mono">PumpFaceplate</b> مربوط بالمضخة <b class="mono">Pump1</b>.</p>`;
    h += '</fieldset>';
    if (it.type === 'io'){
      h += `<fieldset><legend>العملية Process</legend>${F.sel('الوسم Tag', 'tag', it.tag, tagOpts(), true)}${F.sel('النوع Mode', 'mode', it.mode, [['out', 'Output (عرض فقط)'], ['in', 'Input (إدخال)'], ['io', 'Input/Output']], true)}${F.sel('التنسيق Format', 'f', it.f, FMTS.map(x => [x, x]), true)}${F.txt('الوحدة Unit', 'unit', it.unit, true)}${F.num('حجم الخط', 'fs', it.fs)}</fieldset>`;
      h += `<fieldset><legend>الحدود Limits</legend><div class="g4" style="grid-template-columns:1fr 1fr">${F.num('Min', 'min', it.min)}${F.num('Max', 'max', it.max)}</div>${it.style === 'rangebar' ? `<div class="g4" style="grid-template-columns:1fr 1fr">${F.num('نطاق ↓', 'lo', it.lo)}${F.num('نطاق ↑', 'hi', it.hi)}</div>` : ''}<p class="tip">Min/Max: الحقل يرفض أي إدخال خارجهما.${it.style === 'rangebar' ? ' النطاق الطبيعي يُرسم شريطًا رماديًا تحت الرقم.' : ''}</p></fieldset>`;
    }
    if (it.type === 'bar' || it.type === 'gauge' || it.type === 'trend'){
      h += `<fieldset><legend>العملية Process</legend>${F.sel('الوسم Tag', 'tag', it.tag, tagOpts(anaT), true)}<div class="g4" style="grid-template-columns:1fr 1fr">${F.num('Min', 'min', it.min)}${F.num('Max', 'max', it.max)}</div>${it.type !== 'trend' ? F.txt('الوحدة Unit', 'unit', it.unit, true) + `<div class="g4" style="grid-template-columns:1fr 1fr">${F.num('نطاق ↓', 'lo', it.lo)}${F.num('نطاق ↑', 'hi', it.hi)}</div>` : ''}</fieldset>`;
    }
    if (it.type === 'ind') h += `<fieldset><legend>العملية Process</legend>${F.sel('الوسم Tag', 'tag', it.tag, tagOpts(boolT), true)}</fieldset>`;
    if (EVTYPES.includes(it.type)){
      h += `<fieldset><legend>الأحداث Events</legend>`;
      EVN.forEach(([k, en, ar]) => {
        const e = ev[k] || {}, fn = e.fn || '';
        h += `<div class="evr"><b>${en}</b> <span class="muted" style="font-size:.78rem">${ar}</span>${F.sel('الدالة', 'ev.' + k + '.fn', fn, FNS, true)}`;
        if (['SetBit', 'ResetBit', 'InvertBit'].includes(fn)) h += F.sel('الوسم', 'ev.' + k + '.tag', e.tag, tagOpts(boolT), true);
        if (fn === 'SetValue') h += F.sel('الوسم', 'ev.' + k + '.tag', e.tag, tagOpts(anaT), true) + F.num('القيمة', 'ev.' + k + '.val', e.val);
        if (fn === 'ChangeScreen') h += F.sel('الشاشة', 'ev.' + k + '.tag', e.tag, Object.keys(E.doc.screens).map(s => [s, E.doc.screens[s].t]), true);
        if (fn === 'OpenFaceplate') h += F.sel('الوجه', 'ev.' + k + '.tag', e.tag || 'Pump1', [['Pump1', 'PumpFaceplate: Pump1']], true);
        h += '</div>';
      });
      h += '</fieldset>';
    }
    h += `<fieldset><legend>الديناميكية Dynamization</legend>`;
    if (EQUIP.includes(it.type)) h += F.sel('اللون حسب البت', 'dyn.color.tag', d.color && d.color.tag, tagOpts(boolT), true) + (d.color && d.color.tag ? F.sel('مخطط الألوان', 'dyn.color.sc', d.color.sc || 'isa', [['isa', 'ISA: 1 = رمادي داكن ممتلئ، 0 = إطار'], ['rg', 'أخضر = 1، أحمر = 0']]) : '');
    if (ALTYPES.includes(it.type)) h += F.sel('لون الإنذار (عطل)', 'dyn.al.tag', d.al && d.al.tag, tagOpts(boolT), true) + (d.al && d.al.tag ? F.sel('مظهر الإنذار', 'dyn.al.st', d.al.st || 'red', [['red', 'أحمر ثابت'], ['flash', 'أحمر وامض (غير مؤكد)']]) : '');
    if (it.type === 'tank') h += F.sel('الامتلاء من وسم Fill', 'dyn.fill.tag', d.fill && d.fill.tag, tagOpts(anaT), true);
    h += F.sel('الظهور Visibility', 'dyn.vis.tag', d.vis && d.vis.tag, [['', '— ظاهر دائمًا —']].concat(tagOpts(boolT).slice(1)), true) + (d.vis && d.vis.tag ? F.sel('يظهر عندما', 'dyn.vis.c', d.vis.c || '1', [['1', 'الوسم = 1'], ['0', 'الوسم = 0']]) : '');
    h += '</fieldset>';
    props.innerHTML = h;
  };
  function applyField(el, rebuild){
    const k = el.dataset.k; let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.n){ v = el.value === '' ? '' : IL.num(el.value); if (v !== '' && !isFinite(v)) return; }
    if (k === 'bg'){ scr().bg = v; }
    else {
      const it = selItem(); if (!it) return;
      if (k === 'prio') v = +v;
      setP(it, k, v);
      if (['x', 'y', 'w', 'h'].includes(k)){
        if (v === '') return;
        it.w = clamp(Math.round(+it.w) || 10, 10, W); it.h = clamp(Math.round(+it.h) || 10, 10, H);
        it.x = clamp(Math.round(+it.x) || 0, 0, W - it.w); it.y = clamp(Math.round(+it.y) || 0, 0, H - it.h);
      }
      if (it.type === 'io' && (k === 'fs' || k === 'style')){ const need = (+it.fs || 18) + 14 + (it.style === 'rangebar' ? 14 : 0); if (it.h < need) it.h = Math.min(H - it.y, snap(need + 4)); }
      if (k === 'fs' && v !== '') setP(it, 'fs', clamp(+v, 6, 60));
      if (k === 'from' || k === 'to'){ if (it.from && it.to && it.from === it.to) setP(it, k, ''); }
      if (/^ev\.\w+\.fn$/.test(k)){ const ek = k.split('.')[1]; const e = it.ev[ek]; if (!v) delete it.ev[ek]; else { if (v === 'OpenFaceplate') e.tag = 'Pump1'; else if (v === 'ChangeScreen') e.tag = Object.keys(E.doc.screens).find(s => s !== E.cur) || 'main'; else if (e.tag && TT[e.tag] && ((TT[e.tag].t === 'Bool') !== (v !== 'SetValue'))) e.tag = ''; else if (!TT[e.tag]) e.tag = ''; } }
      if (/^dyn\.(color|al|vis|fill)\.tag$/.test(k) && !v) delete it.dyn[k.split('.')[1]];
      if (k === 'dyn.color.tag' && v && !it.dyn.color.sc) it.dyn.color.sc = 'isa';
      if (k === 'dyn.al.tag' && v && !it.dyn.al.st) it.dyn.al.st = 'red';
      if (k === 'dyn.vis.tag' && v && !it.dyn.vis.c) it.dyn.vis.c = '1';
      if (k === 'target' && it.type === 'scr'){ const sc = E.doc.screens[v]; if (sc && /›$/.test(it.text || '')) it.text = sc.a + ' ›'; }
    }
    E.render(); E.save(); E.check();
    if (rebuild) E.panel();
  }
  props.addEventListener('input', e => { const el = e.target; if (!el.dataset || !el.dataset.k || el.tagName === 'SELECT' || el.type === 'checkbox') return; applyField(el, false); });
  props.addEventListener('change', e => { const el = e.target; if (!el.dataset || !el.dataset.k) return; applyField(el, el.tagName === 'SELECT' || el.type === 'checkbox'); });
  props.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) act(b.dataset.a); });
  function syncGeom(it){ ['x', 'y', 'w', 'h'].forEach(k => { const el = $(`[data-k="${k}"]`, props); if (el && document.activeElement !== el) el.value = it[k]; }); }

  /* ---- selection / placing ---- */
  E.select = id => { E.sel = id; E.render(); E.panel(); E.tool(); };
  E.place = (type, p, quiet) => {
    const T = TYPES[type], it = newItem(E.doc, type, 0, 0);
    it.x = clamp(snap(p.x - T.w / 2), 0, W - T.w); it.y = clamp(snap(p.y - T.h / 2), 0, H - T.h);
    if (type === 'pipe'){ const eq = items().filter(i => ['tank', 'pump', 'valve', 'filler', 'motor', 'capper', 'conv'].includes(i.type)); if (eq.length >= 2 && !quiet){ /* leave free; learner chooses from/to */ } }
    items().push(it); E.select(it.id); E.save(); E.check();
    if (!quiet) E.say(type === 'pipe' ? 'وُضع الأنبوب. اختر «يصل من» و«إلى» في الخصائص ليتصل بالأجهزة.' : `وُضع «${T.a}». اضبط خصائصه من اللوحة.`, '');
    return it;
  };
  function disarm(){ E.arm = null; $$('.pal-i', pal).forEach(b => b.setAttribute('aria-pressed', 'false')); }
  const pt = e => { const m = svg.getScreenCTM(); if (!m) return {x:0, y:0}; const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); return {x:p.x, y:p.y}; };

  /* palette: drag (pointer) or tap-then-tap */
  let pd = null, ghost = null, justDragged = false;
  pal.addEventListener('pointerdown', e => {
    const b = e.target.closest('[data-type]'); if (!b || E.rt || E.demoing || e.button > 0) return;
    pd = {type:b.dataset.type, x:e.clientX, y:e.clientY, drag:false, id:e.pointerId};
    try { b.setPointerCapture(e.pointerId); } catch (er){}
  });
  pal.addEventListener('pointermove', e => {
    if (!pd || e.pointerId !== pd.id) return;
    if (!pd.drag && Math.hypot(e.clientX - pd.x, e.clientY - pd.y) > 8){
      pd.drag = true; disarm();
      ghost = document.createElement('div'); ghost.className = 'ghost'; ghost.innerHTML = icon(pd.type) + `<span>${TYPES[pd.type].a}</span>`; document.body.appendChild(ghost);
    }
    if (pd.drag){ ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; e.preventDefault(); }
  });
  const endPal = (e, cancel) => {
    if (!pd || e.pointerId !== pd.id) return;
    const st = pd; pd = null;
    if (ghost){ ghost.remove(); ghost = null; }
    if (!st.drag) return;
    justDragged = true; setTimeout(() => { justDragged = false; }, 400);
    if (cancel) return;
    const r = wrap.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) E.place(st.type, pt(e));
    else E.say('أفلت العنصر فوق الشاشة لوضعه.', '');
  };
  pal.addEventListener('pointerup', e => endPal(e, false));
  pal.addEventListener('pointercancel', e => endPal(e, true));
  pal.addEventListener('click', e => {
    const b = e.target.closest('[data-type]'); if (!b || E.rt || E.demoing) return;
    if (justDragged){ justDragged = false; return; }
    if (e.detail === 0){ E.place(b.dataset.type, {x:W / 2, y:H / 2}); return; }
    if (E.arm === b.dataset.type){ disarm(); E.say('', ''); return; }
    disarm(); E.arm = b.dataset.type; b.setAttribute('aria-pressed', 'true');
    E.say(`انقر مكانًا على الشاشة لوضع «${TYPES[E.arm].a}».`, '');
  });

  /* canvas pointer handling */
  let drag = null;
  svg.addEventListener('pointerdown', e => {
    if (E.demoing || e.button > 0) return;
    if (E.rt){ rtDown(e); return; }
    const p = pt(e);
    if (E.arm){ const t = E.arm; disarm(); E.place(t, p); return; }
    const hd = e.target.closest('[data-h]'), it = selItem();
    if (hd && it){ drag = {m:'rs', h:hd.dataset.h, p0:p, o:{x:it.x, y:it.y, w:it.w, h:it.h}, moved:false}; }
    else {
      const g = e.target.closest('[data-id]');
      if (g){
        if (E.sel !== g.dataset.id) E.select(g.dataset.id);
        const t = selItem();
        if (t && !(t.type === 'pipe' && t.from && t.to)) drag = {m:'mv', p0:p, o:{x:t.x, y:t.y}, moved:false};
      } else {
        if (E.sel) E.select(null);
        if (E.zoom > 1) drag = {m:'pan', cx:e.clientX, cy:e.clientY, sl:wrap.scrollLeft, st:wrap.scrollTop};
      }
    }
    if (drag){ try { svg.setPointerCapture(e.pointerId); } catch (er){} e.preventDefault(); }
    svg.focus({preventScroll:true});
  });
  svg.addEventListener('pointermove', e => {
    if (E.rt || !drag) return;
    if (drag.m === 'pan'){ wrap.scrollLeft = drag.sl - (e.clientX - drag.cx); wrap.scrollTop = drag.st - (e.clientY - drag.cy); return; }
    const it = selItem(); if (!it) return;
    const p = pt(e), dx = p.x - drag.p0.x, dy = p.y - drag.p0.y, o = drag.o;
    if (!drag.moved && Math.hypot(dx, dy) < 3) return;
    drag.moved = true;
    if (drag.m === 'mv'){ it.x = clamp(snap(o.x + dx), 0, W - it.w); it.y = clamp(snap(o.y + dy), 0, H - it.h); }
    else {
      const h = drag.h; let x1 = o.x, y1 = o.y, x2 = o.x + o.w, y2 = o.y + o.h;
      if (h.includes('w')) x1 = clamp(snap(o.x + dx), 0, x2 - 10); else x2 = clamp(snap(x2 + dx), x1 + 10, W);
      if (h.includes('n')) y1 = clamp(snap(o.y + dy), 0, y2 - 10); else y2 = clamp(snap(y2 + dy), y1 + 10, H);
      it.x = x1; it.y = y1; it.w = x2 - x1; it.h = y2 - y1;
    }
    E.render(); syncGeom(it);
  });
  const endDrag = e => { if (E.rt){ rtUp(e); return; } if (!drag) return; const mv = drag.moved; drag = null; if (mv){ E.save(); E.check(); } };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', e => { if (E.rt){ rtUp(e, true); return; } drag = null; });
  svg.addEventListener('keydown', e => {
    if (E.rt || E.demoing) return;
    const it = selItem(); if (!it) return;
    if (e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); act('del'); return; }
    const mv = {ArrowLeft:[-SN, 0], ArrowRight:[SN, 0], ArrowUp:[0, -SN], ArrowDown:[0, SN]}[e.key];
    if (mv && !(it.type === 'pipe' && it.from && it.to)){ e.preventDefault(); it.x = clamp(it.x + mv[0], 0, W - it.w); it.y = clamp(it.y + mv[1], 0, H - it.h); E.render(); syncGeom(it); E.save(); }
  });

  /* ---- toolbar ---- */
  E.tool = () => {
    const b = k => $(`.ed-tool [data-a="${k}"]`, root);
    b('dup').disabled = b('del').disabled = E.rt || !E.sel || E.demoing;
    b('rt').textContent = E.rt ? '■ رجوع للتصميم' : '▶ تشغيل Runtime';
    b('rt').disabled = b('reset').disabled = E.demoing;
    b('demo').disabled = E.demoing; b('demo').textContent = E.demoing ? '… العرض جارٍ' : '▶ شاهد الحل';
    b('zoom').setAttribute('aria-pressed', E.zoom > 1 ? 'true' : 'false'); b('zoom').textContent = E.zoom > 1 ? '⤢ ملاءمة' : '⤢ تكبير ×2';
  };
  let resetArm = 0;
  function act(a, force){
    if (E.demoing && !force && a !== 'zoom') return;
    const it = selItem();
    if (a === 'del' && it && !E.rt){
      const i = items().indexOf(it); items().splice(i, 1);
      items().forEach(p => { if (p.type === 'pipe'){ if (p.from === it.id) p.from = ''; if (p.to === it.id) p.to = ''; } });
      E.say(`حُذف «${it.name}».`, ''); E.select(null); E.save(); E.check();
    } else if (a === 'dup' && it && !E.rt){
      const c = clone(it); c.id = 'e' + (E.doc.next++); c.name = TYPES[c.type].n + (allItems(E.doc).filter(i => i.type === c.type).length + 1);
      if (c.type === 'pipe'){ c.from = c.to = ''; }
      c.x = clamp(c.x + 20, 0, W - c.w); c.y = clamp(c.y + 20, 0, H - c.h);
      items().push(c); E.say(`نُسخ إلى «${c.name}».`, ''); E.select(c.id); E.save(); E.check();
    } else if (a === 'zoom'){
      E.zoom = E.zoom > 1 ? 1 : 2; wrap.classList.toggle('z2', E.zoom > 1); E.tool(); E.render();
      if (E.zoom > 1) E.say(E.rt ? 'مُكبَّر: مرّر داخل الإطار للتنقل.' : 'مُكبَّر: اسحب مكانًا فارغًا لتحريك العرض.', '');
    } else if (a === 'rt'){ E.setRt(!E.rt); }
    else if (a === 'reset'){
      const b = $('.ed-tool [data-a="reset"]', root);
      if (!resetArm){ resetArm = setTimeout(() => { resetArm = 0; b.textContent = '↺ ابدأ من جديد'; }, 3000); b.textContent = 'اضغط مرة أخرى للتأكيد'; return; }
      clearTimeout(resetArm); resetArm = 0; b.textContent = '↺ ابدأ من جديد';
      if (E.rt) E.setRt(false);
      E.doc = cfg.init(); E.f = {}; E.cur = 'main'; E.sel = null; saveDoc(cfg.id, E.doc); renderScr(); E.render(); E.panel(); E.tool(); E.check(); E.say('بدأت من جديد.', '');
    } else if (a === 'demo'){ runDemo(); }
  }
  $('.ed-tool', root).addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && !b.disabled) act(b.dataset.a); });

  /* ---- runtime ---- */
  const test = $('.ed-test', root), watch = $('.watch', root);
  E.setRt = on => {
    if (on === E.rt) return;
    disarm(); kp.hidden = true;
    if (on){
      const res = cfg.items.map(c => c.rt ? true : !!tryF(() => c.f(E)));
      E.rtOK = res.every(Boolean);
      const unb = allItems(E.doc).filter(i => ['io', 'bar', 'gauge', 'ind', 'trend'].includes(i.type) && !i.tag).length;
      E.P = plantNew(); if (cfg.rtInit) cfg.rtInit(E.P);
      E.al = []; E.hist = {}; E.rtScr = 'main'; E.popup = null; E.pressed = null; E.fpDown = null; E.t0 = Date.now(); E.ackAt = null;
      E.rt = true; E.sel = null;
      E.say(`Compile: 0 أخطاء · ${unb} تحذير${unb ? ' (عناصر بلا وسم)' : ''}. Download ✓ — Runtime يعمل.${E.rtOK ? '' : ' (أكمل بنود التصميم أولًا ليُحتسب اختبار Runtime)'}`, E.rtOK ? 'ok' : '');
    } else { E.rt = false; E.popup = null; E.pressed = null; E.say('عدت إلى وضع التصميم.', ''); }
    root.classList.toggle('rt', E.rt); test.hidden = !E.rt;
    renderScr(); E.render(); E.panel(); E.tool(); E.check(); watchUpd();
  };
  function setTag(tag, val){ if (!tag || !(tag in E.P)) return; const t = TT[tag]; E.P[tag] = t && t.t === 'Bool' ? (val ? 1 : 0) : t && t.t === 'Int' ? Math.round(val) : val; }
  function runFn(ev, it){
    if (!ev || !ev.fn) return;
    switch (ev.fn){
      case 'SetBit': setTag(ev.tag, 1); E.setAt[ev.tag] = performance.now(); break;
      case 'ResetBit': { /* a quick tap must still last at least one PLC scan */ const P0 = E.P, dl = 220 - (performance.now() - (E.setAt[ev.tag] || 0)); if (dl > 0) setTimeout(() => { if (E.P === P0) setTag(ev.tag, 0); }, dl); else setTag(ev.tag, 0); break; }
      case 'InvertBit': if (ev.tag) setTag(ev.tag, E.P[ev.tag] ? 0 : 1); break;
      case 'SetValue': if (ev.tag && isFinite(+ev.val)) setTag(ev.tag, +ev.val); break;
      case 'ChangeScreen': if (E.doc.screens[ev.tag]){ E.rtScr = ev.tag; E.pressed = null; renderScr(); } break;
      case 'OpenFaceplate': E.popup = 'Pump1'; if (E.rtOK) E.f.fp = 1; if (cfg.onFp) cfg.onFp(E, it); break;
    }
  }
  function rtDown(e){
    const a = e.target.closest('[data-fp],[data-act]');
    try { svg.setPointerCapture(e.pointerId); } catch (er){}
    if (a){
      if (a.dataset.act === 'ack'){ ack(); return; }
      fpAct(a.dataset.fp, true); return;
    }
    if (E.popup) return;
    const g = e.target.closest('[data-id]'); if (!g) return;
    const it = find(g.dataset.id); if (!it) return;
    E.pressed = it; runFn(it.ev && it.ev.press, it);
  }
  function rtUp(e, cancel){
    if (E.fpDown){ fpAct(E.fpDown, false); }
    const it = E.pressed; if (!it) return; E.pressed = null;
    runFn(it.ev && it.ev.release, it);
    if (cancel) return;
    runFn(it.ev && it.ev.click, it);
    if (it.type === 'scr' && E.doc.screens[it.target]){ E.rtScr = it.target; renderScr(); }
    if (it.type === 'io'){ if (!it.tag) E.say('الحقل غير مربوط بوسم.', 'bad'); else if (it.mode === 'out' || !it.mode) E.say('هذا الحقل Output للعرض فقط: اجعل نوعه Input أو Input/Output.', 'bad'); else openKp(it); }
  }
  function fpAct(k, down){
    const P = E.P;
    if (k === 'start' || k === 'stop'){ const t = k === 'start' ? 'Pump1_Start' : 'Pump1_Stop'; E.fpDown = down ? k : null; if (down){ P[t] = 1; if (k === 'start' && E.rtOK) E.f.fpStart = 1; } else setTimeout(() => { P[t] = 0; }, 220); }
    else if (!down) return;
    else if (k === 'spm' || k === 'spp') P.Pump1_Speed_SP = clamp(Math.round(P.Pump1_Speed_SP + (k === 'spp' ? 5 : -5)), 0, 50);
    else if (k === 'mode') P.Pump1_Manual = P.Pump1_Manual ? 0 : 1;
    else if (k === 'close') E.popup = null;
  }
  function ack(){
    const un = E.al.filter(a => !a.acked);
    if (!un.length){ E.say('لا توجد إنذارات غير مؤكدة.', ''); return; }
    un.forEach(a => { a.acked = true; });
    E.al = E.al.filter(a => a.active);
    if (E.rtOK){ E.f.ack = 1; E.ackAt = E.P.Bottle_Count; }
    E.say(`Acknowledge ✓ أُكّد ${un.length} إنذار. ${E.al.some(a => a.active) ? 'السبب ما زال قائمًا: أزل العطل ثم أعد التشغيل.' : ''}`, 'ok');
  }
  /* keypad for input fields */
  let kpItem = null;
  function openKp(it){ kpItem = it; $('.kp-t', root).textContent = `${it.tag}${it.unit ? ' (' + it.unit + ')' : ''}`; kpi.value = ''; kpm.textContent = it.min !== '' || it.max !== '' ? `الحدود: ${it.min === '' ? '—' : it.min} … ${it.max === '' ? '—' : it.max}` : ''; kpm.style.color = 'var(--muted)'; kp.hidden = false; setTimeout(() => { try { kpi.focus({preventScroll:true}); } catch (er){} }, 30); }
  E.kpOk = () => {
    const it = kpItem; if (!it) return;
    const v = IL.num(kpi.value);
    if (!isFinite(v)){ kpm.style.color = ''; kpm.textContent = 'أدخل رقمًا صحيحًا.'; return; }
    const lo = it.min === '' ? -Infinity : +it.min, hi = it.max === '' ? Infinity : +it.max;
    if (v < lo || v > hi){
      kp.hidden = true; kpItem = null;
      E.say(`القيمة ${v} خارج الحدود ${it.min}–${it.max}: رُفضت ولم تُرسل إلى الـ PLC.`, 'bad');
      if (E.rtOK && it.tag === 'Pump1_Speed_SP' && v > 50) E.f.rej = 1;
      return;
    }
    const d = (String(it.f).split('.')[1] || '').length, vv = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
    setTag(it.tag, vv); kp.hidden = true; kpItem = null;
    if (it.tag === 'Pump1_Speed_SP' && v > 50) E.say(`قُبلت ${v} لأن الحقل بلا حد أعلى صحيح: اضبط Max = 50.`, 'bad');
    else { E.say(`كُتبت ${fmtF(it.f, vv)} في ${it.tag} ✓${d < 1 && v % 1 ? ' (التنسيق قطع الكسر)' : ''}`, 'ok'); if (E.rtOK && it.tag === 'Pump1_Speed_SP' && v >= 0 && v <= 50) E.f.okSp = 1; }
  };
  $('.kp-ok', root).addEventListener('click', () => E.kpOk());
  $('.kp-x', root).addEventListener('click', () => { kp.hidden = true; kpItem = null; });
  kpi.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); E.kpOk(); } if (e.key === 'Escape'){ kp.hidden = true; } });
  /* test panel */
  test.addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b || !E.rt) return;
    const P = E.P, t = b.dataset.t;
    if (t === 'pf'){ P.Pump1_Fault = 1; E.say('حُقن عطل في المضخة: فصلت الحماية الحرارية.', 'bad'); }
    else if (t === 'vf'){ P.Valve1_Fault = 1; E.say('حُقن عطل في الصمام: علق ولم يصل إلى وضعه.', 'bad'); }
    else if (t === 'vc'){ P.Valve1_Cmd = P.Valve1_Cmd ? 0 : 1; E.say(P.Valve1_Cmd ? 'أمر الـ PLC: افتح Valve1.' : 'أمر الـ PLC: أغلق Valve1.', ''); }
    else if (t === 'air'){ P._leak = 0.55; E.say('تسريب هواء: سيهبط ضغط الهواء.', 'bad'); }
    else if (t === 'prun'){ P._latch = P._latch ? 0 : 1; E.say(P._latch ? 'الـ PLC شغّل Pump1.' : 'الـ PLC أوقف Pump1.', ''); }
    else if (t === 'rst'){ P.Pump1_Fault = 0; P.Valve1_Fault = 0; P._leak = 0; E.say('أُزيلت الأعطال (Reset). أعد التشغيل إن لزم.', 'ok'); }
  });
  function watchUpd(){
    if (!E.rt) return;
    watch.innerHTML = cfg.watch.map(t => { const v = E.P[t], tt = TT[t]; return `<tr><td>${t}</td><td>${tt.t === 'Bool' ? (v ? 'TRUE' : 'FALSE') : tt.t === 'Int' ? v : IL.fmt(v, 1) + (tt.u ? ' ' + tt.u : '')}</td></tr>`; }).join('');
  }
  function alStep(){
    const P = E.P;
    ALDEF.forEach(d => {
      const on = !!d.c(P); const a = E.al.find(x => x.id === d.id);
      if (on && !a){ E.al.unshift({id:d.id, p:d.p, t:d.t, tin:P.t, acked:false, active:true}); if (cfg.onAlarm) cfg.onAlarm(E, d); }
      else if (a){ a.active = on; if (!on && a.acked) E.al.splice(E.al.indexOf(a), 1); }
    });
    P.Alarm_Active = E.al.length ? 1 : 0;
  }
  let acc = 0, chk = 0, hs = 0;
  IL.animate(wrap, dt => {
    const ph = Math.floor(performance.now() / 420) % 2;
    if (E.rt){
      E.ph = ph;
      plantStep(E.P, dt); alStep();
      hs += dt; if (hs > .25){ hs = 0; ['Tank1_Level', 'Pump1_Current', 'Pump1_Speed', 'Air_Pressure', 'Pump1_Speed_SP'].forEach(t => { const a = E.hist[t] = E.hist[t] || []; a.push(E.P[t]); if (a.length > 200) a.shift(); }); }
      if (E.rtOK && cfg.rtTick) cfg.rtTick(E);
      acc += dt; if (acc > .033){ acc = 0; E.render(); }
      chk += dt; if (chk > .3){ chk = 0; E.check(); watchUpd(); }
    } else if (E.blinky && ph !== E.ph){ E.ph = ph; E.render(); }
    else E.ph = ph;
  });

  /* ---- checklist ---- */
  const chkBox = $('.ed-chk', root);
  E.check = () => {
    const res = cfg.items.map(c => !!tryF(() => c.f(E)));
    const n = res.filter(Boolean).length;
    $('h3 span', chkBox).textContent = n + '/' + res.length;
    $('ul', chkBox).innerHTML = cfg.items.map((c, i) => `<li class="${res[i] ? 'ok' : ''}${c.rt ? ' rt' : ''}"><span>${bidi(c.t)}</span></li>`).join('');
    const hint = n === res.length ? '' : (tryF(() => cfg.hint(E, res)) || '');
    const hp = $('.chk-h', chkBox); hp.hidden = !hint; hp.innerHTML = bidi(hint);
    if (n === res.length && !E.demoing) win(cfg.id, cfg.winMsg);
  };

  /* ---- demo (plays the solution, then restores the learner's own design; never marks done) ---- */
  const D = {
    say:(m) => E.say('العرض: ' + m, ''),
    async add(type, x, y, p){ const it = E.place(type, {x:x + TYPES[type].w / 2, y:y + TYPES[type].h / 2}, true); if (p) Object.assign(it, clone(p)); E.render(); E.panel(); E.check(); await sleep(650); return it; },
    async sel(it){ E.select(it ? it.id : null); await sleep(450); },
    async set(it, k, v){
      if (it && E.sel !== it.id) E.select(it.id);
      if (k === 'bg') scr().bg = v; else setP(it, k, v);
      if (it && it.type === 'io' && (k === 'fs' || k === 'style')){ const need = (+it.fs || 18) + 14 + (it.style === 'rangebar' ? 14 : 0); if (it.h < need) it.h = snap(need + 4); }
      if (/^ev\.\w+\.fn$/.test(k) && v === 'OpenFaceplate') setP(it, k.replace('.fn', '.tag'), 'Pump1');
      E.render(); E.panel(); E.check();
      const el = $(`[data-k="${k}"]`, props); if (el){ el.classList.add('hl'); if (props.scrollHeight > props.clientHeight + 4) el.scrollIntoView({block:'nearest'}); }
      await sleep(600);
    },
    async del(it){ E.select(it.id); await sleep(400); act('del', true); await sleep(500); },
    async run(){ E.setRt(true); await sleep(900); },
    async press(it, ms){ E.pressed = it; runFn(it.ev && it.ev.press, it); await sleep(ms || 350); E.pressed = null; runFn(it.ev && it.ev.release, it); runFn(it.ev && it.ev.click, it); if (it.type === 'scr'){ E.rtScr = it.target; renderScr(); } await sleep(400); },
    async key(it, val){ openKp(it); await sleep(500); for (const ch of String(val)){ kpi.value += ch; await sleep(160); } await sleep(400); E.kpOk(); await sleep(1300); },
    async fp(k){ fpAct(k, true); await sleep(350); fpAct(k, false); await sleep(400); },
    async test(t){ const b = $(`.ed-test [data-t="${t}"]`, root); if (b) b.click(); await sleep(400); },
    async until(fn, max){ const t0 = Date.now(); while (!fn() && Date.now() - t0 < (max || 15000)) await sleep(150); },
    async ack(){ ack(); await sleep(900); },
    find:name => allItems(E.doc).find(i => i.name === name),
    sleep
  };
  async function runDemo(){
    if (E.demoing) return;
    const snapDoc = clone(E.doc), snapF = clone(E.f), snapCur = E.cur;
    if (E.rt) E.setRt(false);
    E.demoing = true; root.classList.add('busy'); disarm(); E.tool();
    try { await cfg.demo(E, D); } catch (er){ /* keep going: always restore */ }
    await sleep(2600);
    if (E.rt) E.setRt(false);
    E.doc = snapDoc; E.f = snapF; E.cur = snapCur; E.sel = null;
    E.demoing = false; root.classList.remove('busy');
    renderScr(); E.render(); E.panel(); E.tool(); E.check();
    E.say('انتهى العرض، وأُعيد تصميمك كما كان. نفّذ الخطوات بنفسك الآن.', '');
  }

  renderScr(); E.render(); E.panel(); E.tool(); E.check();
  if (cfg.intro) E.say(cfg.intro, '');
  window.addEventListener('resize', () => { if (!E.rt) E.render(); });
  return E;
}
const LTRX = /[A-Za-z0-9][A-Za-z0-9_./\-–]*(?:\s*(?:→|=|–)\s*[A-Za-z0-9_.\-]+)*/g;
const bidi = t => esc(t).replace(LTRX, m => `<bdi dir="ltr">${m}</bdi>`);
function tryF(fn){ try { return fn(); } catch (e){ return false; } }

const TEST = {pf:'حقن عطل Pump1_Fault', vf:'حقن عطل Valve1_Fault', vc:'فتح/غلق Valve1 (أمر PLC)', air:'تسريب هواء', prun:'تشغيل/إيقاف Pump1 من الـ PLC', rst:'إزالة الأعطال Reset'};

/* ---------------- tab configs ---------------- */
const on = (E, s) => (E.doc.screens[s || 'main'] || {items:[]}).items;
const byT = (E, t, s) => on(E, s).filter(i => i.type === t);
const evIs = (it, k, fn, tag) => !!(it.ev && it.ev[k] && it.ev[k].fn === fn && (tag == null || it.ev[k].tag === tag));
const momentary = (b, tag) => evIs(b, 'press', 'SetBit', tag) && evIs(b, 'release', 'ResetBit', tag) && !(b.ev.click && b.ev.click.fn && b.ev.click.tag === tag);
const firstMiss = (res, list) => { const i = res.findIndex(x => !x); return i > -1 ? list[i] : ''; };
const CFG = {};

/* ---- 1. ISA-101 ---- */
CFG.isa = {
  id:'isa', test:['prun', 'pf', 'vc', 'rst'], watch:['Pump1_Running', 'Pump1_Current', 'Tank1_Level', 'Valve1_Open', 'Pump1_Fault'],
  intro:'هذه شاشة سيئة التصميم. انقر كل عنصر وأصلحه من «النمط» أو من خصائصه؛ وللخلفية انقر مكانًا فارغًا.',
  winMsg:'الشاشة الآن عالية الأداء على نمط ISA-101: رمادية هادئة، والانتباه محجوز للإنذارات ✓',
  init:() => mkDoc({main:{t:'Overview', a:'نظرة عامة', bg:'rainbow', items:[
    ['text', {id:'t1', x:20, y:12, w:300, h:36, text:'محطة المواد الخام', fs:24}],
    ['deco', {id:'dc', x:650, y:14, w:120, h:56, style:'blink'}],
    ['motor', {id:'mx', name:'Mixer1', x:95, y:62, w:60, h:40, style:'3d', dyn:{color:{tag:'Mixer1_Running', sc:'rg'}}}],
    ['tank', {id:'tk', name:'Tank1', x:70, y:130, w:110, h:160, style:'3d', dyn:{fill:{tag:'Tank1_Level'}}}],
    ['pump', {id:'pu', name:'Pump1', x:260, y:206, w:70, h:70, style:'3d', stateText:false, dyn:{color:{tag:'Pump1_Running', sc:'rg'}}}],
    ['valve', {id:'va', name:'Valve1', x:420, y:180, w:60, h:60, style:'3d', stateText:false, dyn:{color:{tag:'Valve1_Open', sc:'rg'}}}],
    ['pipe', {id:'p1', from:'tk', to:'pu'}], ['pipe', {id:'p2', from:'pu', to:'va'}],
    ['io', {id:'io1', name:'Level', x:70, y:310, w:110, h:20, tag:'Tank1_Level', fs:9, unit:'', f:'999.9', lo:20, hi:80}],
    ['io', {id:'io2', name:'Current', x:250, y:310, w:110, h:20, tag:'Pump1_Current', fs:9, unit:'', f:'99.9', lo:5, hi:25}],
    ['pie', {id:'pi', x:570, y:180, w:160, h:160}]
  ]}}),
  items:[
    {t:'خلفية رمادية محايدة بدل قوس قزح', f:E => E.doc.screens.main.bg === 'grey'},
    {t:'رموز مسطحة ثنائية الأبعاد: لا تدرّج ولا 3D', f:E => !on(E).some(i => i.style === '3d')},
    {t:'المضخة: الحالة بشكل رمادي داكن ممتلئ مع نص الحالة', f:E => byT(E, 'pump').length > 0 && byT(E, 'pump').every(i => i.dyn.color && i.dyn.color.tag && i.dyn.color.sc !== 'rg' && i.stateText)},
    {t:'اللون للإنذارات فقط: لا أحمر/أخضر للحالة، ولا وميض أو رسم دائري للزينة', f:E => !on(E).some(i => (i.dyn && i.dyn.color && i.dyn.color.tag && i.dyn.color.sc === 'rg') || (i.type === 'ind' && i.style === 'rg') || (i.type === 'deco' && i.style !== 'static') || (i.type === 'pie' && i.style !== 'bars'))},
    {t:'أرقام مقروءة (حجم الخط 16 فأكثر) مع وحداتها', f:E => { const a = byT(E, 'io'); return a.length >= 2 && a.every(i => +i.fs >= 16 && String(i.unit || '').trim()); }},
    {t:'القيم التناظرية مع شريط النطاق الطبيعي', f:E => { const a = byT(E, 'io').filter(i => TT[i.tag] && TT[i.tag].t === 'Real'); return a.length >= 2 && a.every(i => i.style === 'rangebar' && hasRange(i)); }}
  ],
  hint:(E, res) => {
    const io = byT(E, 'io');
    if (io.some(i => i.unit && /^\s*$/.test(i.unit))) return 'أضف الوحدة نصًا مثل % أو A.';
    return firstMiss(res, [
      'انقر مكانًا فارغًا على الشاشة واختر الخلفية «رمادي فاتح محايد».',
      'انقر كل رمز ثلاثي الأبعاد (الخزان، المضخة، الصمام، المحرك) واختر النمط «مسطح 2D».',
      'انقر المضخة: اجعل مخطط الألوان «ISA» وفعّل «نص الحالة».',
      'الأخضر والأحمر للحالة يخالفان ISA-101: اختر مخطط ISA للصمام والمحرك، وأوقف وميض الزخرفة، واحذف الرسم الدائري أو حوّله إلى أشرطة.',
      'الأرقام بحجم 9 لا تُقرأ من بعيد: اجعل حجم الخط 18 وأضف الوحدة (% للمستوى، A للتيار).',
      'اختر لنمط كل حقل تناظري «رقم + شريط النطاق الطبيعي».'
    ]);
  },
  async demo(E, D){
    D.say('الخلفية أولًا: رمادي محايد.'); await D.sel(null); await D.set(null, 'bg', 'grey');
    for (const n of ['Tank1', 'Pump1', 'Valve1', 'Mixer1']){ const it = D.find(n); if (it){ D.say(`${n}: نمط مسطح 2D.`); await D.set(it, 'style', 'flat'); } }
    const pu = D.find('Pump1'); D.say('حالة المضخة: رمادي داكن ممتلئ + نص.'); await D.set(pu, 'dyn.color.sc', 'isa'); await D.set(pu, 'stateText', true);
    D.say('الصمام والخلاط: لا أحمر/أخضر للحالة.'); await D.set(D.find('Valve1'), 'dyn.color.sc', 'isa'); await D.set(D.find('Mixer1'), 'dyn.color.sc', 'isa');
    const dc = byT(E, 'deco')[0]; if (dc){ D.say('الزخرفة الوامضة تسرق الانتباه من الإنذارات: احذفها.'); await D.del(dc); }
    const pi = byT(E, 'pie')[0]; if (pi){ D.say('الرسم الدائري الملوّن: احذفه.'); await D.del(pi); }
    for (const [n, u] of [['Level', '%'], ['Current', 'A']]){ const it = D.find(n); D.say(`${n}: خط 18 ووحدة ${u} وشريط النطاق.`); await D.set(it, 'fs', 18); await D.set(it, 'unit', u); await D.set(it, 'style', 'rangebar'); }
    D.say('كل البنود مكتملة. شاهد الشاشة في Runtime.'); await D.run(); await D.test('prun'); await sleep(3500); await D.test('pf'); await sleep(2500);
  }
};

/* ---- 2. operating objects ---- */
CFG.objects = {
  id:'objects', test:['pf', 'rst'], watch:['Pump1_Start', 'Pump1_Stop', 'Pump1_Running', 'Pump1_Speed_SP', 'Pump1_Speed', 'Pump1_Current'],
  intro:'ابدأ بسحب زر من صندوق الأدوات إلى الشاشة (أو انقره ثم انقر مكانًا على الشاشة).',
  winMsg:'شاشة تشغيل المضخة تعمل: أزرار لحظية، حقل سرعة محمي بالحدود، مؤشر وشريط تيار ✓',
  init:() => mkDoc({main:{t:'Pump1', a:'تشغيل المضخة', items:[
    ['text', {x:20, y:12, w:320, h:36, text:'تشغيل المضخة Pump1', fs:22}],
    ['pump', {name:'Pump1', x:620, y:170, w:90, h:100}],
    ['tank', {name:'Tank1', x:470, y:150, w:100, h:140, dyn:{fill:{tag:'Tank1_Level'}}}]
  ]}}),
  rtInit:P => { P.Valve1_Cmd = 1; },
  rtTick:E => { if (E.P.Pump1_Running) E.f.ran = 1; },
  items:[
    {t:'زر Start لحظي: Press → SetBit و Release → ResetBit على Pump1_Start', f:E => byT(E, 'button').some(b => momentary(b, 'Pump1_Start'))},
    {t:'زر Stop لحظي على Pump1_Stop', f:E => byT(E, 'button').some(b => momentary(b, 'Pump1_Stop'))},
    {t:'حقل I/O للسرعة Pump1_Speed_SP: إدخال، حدود 0–50، تنسيق 99.9', f:E => byT(E, 'io').some(i => i.tag === 'Pump1_Speed_SP' && i.mode !== 'out' && i.min !== '' && +i.min === 0 && i.max !== '' && +i.max === 50 && i.f === '99.9')},
    {t:'مؤشر مربوط بـ Pump1_Running', f:E => byT(E, 'ind').some(i => i.tag === 'Pump1_Running')},
    {t:'شريط لتيار المحرك Pump1_Current من 0 إلى 30 A', f:E => byT(E, 'bar').some(i => i.tag === 'Pump1_Current' && +i.min === 0 && +i.max === 30)},
    {t:'Runtime: شغّل المضخة من زر Start', rt:1, f:E => !!E.f.ran},
    {t:'Runtime: سرعة ضمن الحدود قُبلت، وقيمة 60 رُفضت', rt:1, f:E => !!(E.f.okSp && E.f.rej)}
  ],
  hint:(E, res) => {
    const bs = byT(E, 'button'), io = byT(E, 'io').filter(i => i.tag === 'Pump1_Speed_SP'), bar = byT(E, 'bar').filter(i => i.tag === 'Pump1_Current');
    for (const tag of ['Pump1_Start', 'Pump1_Stop']){
      if (bs.some(b => b.ev.click && b.ev.click.fn === 'InvertBit' && b.ev.click.tag === tag)) return 'InvertBit يجعل الزر مبدّلًا Toggle: استخدم Press → SetBit و Release → ResetBit.';
      if (bs.some(b => evIs(b, 'press', 'SetBit', tag) && !evIs(b, 'release', 'ResetBit', tag))) return 'بلا Release → ResetBit يبقى البت 1 بعد رفع الإصبع: أضف ResetBit عند الإفلات.';
    }
    if (io.some(i => !/\./.test(i.f))) return 'التنسيق بلا خانة عشرية يقطع الكسور: اختر 99.9.';
    if (io.some(i => i.f !== '99.9')) return 'اختر التنسيق 99.9: خانتان للعدد الصحيح وخانة للكسر تكفي حتى 50.0 Hz.';
    if (io.some(i => i.mode === 'out')) return 'الحقل Output للعرض فقط: اجعل نوعه Input أو Input/Output.';
    if (io.some(i => i.max !== '' && +i.max > 50)) return 'الحد الأعلى للسرعة 50 Hz.';
    if (io.some(i => i.min === '' || i.max === '')) return 'بلا حدود سيقبل الحقل أي قيمة: اضبط Min = 0 و Max = 50.';
    if (bar.some(i => +i.max !== 30 || +i.min !== 0)) return 'مدى الشريط يجب أن يطابق مدى التيار: من 0 إلى 30 A.';
    if (byT(E, 'io').some(i => i.tag === 'Pump1_Current') && !bar.length) return 'المطلوب للتيار شريط Bar، لا حقل رقمي.';
    if (res.slice(0, 5).every(Boolean) && !E.rt) return 'التصميم مكتمل: اضغط «▶ تشغيل Runtime» ثم Start، وأدخل سرعة ضمن الحدود ثم 60.';
    if (E.rt && !E.rtOK) return 'أكمل بنود التصميم ثم أعد تشغيل Runtime.';
    if (E.rt && !E.f.ran) return 'اضغط زر Start على الشاشة.';
    if (E.rt) return E.f.okSp ? 'انقر حقل السرعة وأدخل 60 لترى الرفض.' : 'انقر حقل السرعة وأدخل قيمة بين 0 و 50، مثل 42.5.';
    return firstMiss(res, ['اسحب زرًا، وسمّ نصه Start، ثم اضبط أحداثه: Press → SetBit و Release → ResetBit على Pump1_Start.', 'أضف زرًا ثانيًا لـ Stop بالطريقة نفسها على Pump1_Stop.', 'أضف حقل I/O: الوسم Pump1_Speed_SP، النوع Input/Output، التنسيق 99.9، Min 0، Max 50.', 'أضف مؤشرًا واربطه بالوسم Pump1_Running.', 'أضف شريطًا: الوسم Pump1_Current، Min 0، Max 30.']);
  },
  async demo(E, D){
    D.say('زر Start لحظي.');
    const st = await D.add('button', 30, 80); await D.set(st, 'text', 'Start'); await D.set(st, 'ev.press.fn', 'SetBit'); await D.set(st, 'ev.press.tag', 'Pump1_Start'); await D.set(st, 'ev.release.fn', 'ResetBit'); await D.set(st, 'ev.release.tag', 'Pump1_Start');
    D.say('زر Stop لحظي.');
    const sp = await D.add('button', 170, 80); await D.set(sp, 'text', 'Stop'); await D.set(sp, 'ev.press.fn', 'SetBit'); await D.set(sp, 'ev.press.tag', 'Pump1_Stop'); await D.set(sp, 'ev.release.fn', 'ResetBit'); await D.set(sp, 'ev.release.tag', 'Pump1_Stop');
    D.say('حقل السرعة بحدود وتنسيق.');
    const io = await D.add('io', 30, 160); await D.set(io, 'tag', 'Pump1_Speed_SP'); await D.set(io, 'mode', 'io'); await D.set(io, 'f', '99.9'); await D.set(io, 'unit', 'Hz'); await D.set(io, 'min', 0); await D.set(io, 'max', 50);
    D.say('مؤشر التشغيل.'); const ind = await D.add('ind', 180, 160); await D.set(ind, 'tag', 'Pump1_Running');
    D.say('شريط التيار 0–30 A.'); const bar = await D.add('bar', 330, 90); await D.set(bar, 'tag', 'Pump1_Current'); await D.set(bar, 'min', 0); await D.set(bar, 'max', 30); await D.set(bar, 'unit', 'A');
    D.say('Runtime: Start ثم إدخال السرعة.'); await D.run();
    await D.press(st, 400); await sleep(2500);
    await D.key(io, '42.5'); await sleep(1500); await D.key(io, '60'); await sleep(1500);
    await D.press(sp, 400); await sleep(1500);
  }
};

/* ---- 3. dynamization & faceplate ---- */
CFG.dyn = {
  id:'dyn', test:['pf', 'vf', 'vc', 'rst'], watch:['Pump1_Running', 'Pump1_Fault', 'Valve1_Open', 'Valve1_Closed', 'Valve1_Fault', 'Tank1_Level'],
  intro:'الشاشة جاهزة لكن ساكنة. انقر كل عنصر واضبط قسم «الديناميكية» أو «الأحداث» في خصائصه.',
  winMsg:'الشاشة حيّة: الخزان يمتلئ، الصمام يتلوّن حسب حالته، الإنذار يظهر عند العطل، والمضخة تفتح وجهها الجاهز ✓',
  init:() => mkDoc({main:{t:'PumpStation', a:'محطة الضخ', items:[
    ['text', {x:20, y:12, w:300, h:36, text:'محطة الضخ Pump Station', fs:22}],
    ['tank', {id:'tk', name:'Tank1', x:60, y:90, w:120, h:180}],
    ['io', {name:'Level', x:60, y:300, w:120, h:50, tag:'Tank1_Level', unit:'%', fs:18, style:'rangebar', lo:20, hi:80, f:'999.9'}],
    ['pump', {id:'pu', name:'Pump1', x:280, y:180, w:80, h:88}],
    ['alarm', {id:'al', name:'AlarmPump1', x:230, y:150, w:36, h:36, prio:1}],
    ['valve', {id:'va', name:'Valve1', x:460, y:149, w:64, h:82, stateText:true}],
    ['pipe', {from:'tk', to:'pu'}], ['pipe', {from:'pu', to:'va'}],
    ['pipe', {x:524, y:185, w:236, h:10}],
    ['text', {x:560, y:200, w:200, h:30, text:'إلى رأس التعبئة ›', fs:15}],
    ['io', {name:'Current', x:270, y:300, w:120, h:50, tag:'Pump1_Current', unit:'A', fs:18, style:'rangebar', lo:5, hi:25, f:'99.9'}]
  ]}}),
  rtInit:P => { P.Valve1_Cmd = 1; },
  onFp:() => {},
  rtTick:E => {
    const P = E.P, al = byT(E, 'alarm')[0];
    if (E.f.fp && E.f.fpStart && P.Pump1_Running) E.f.fpRun = 1;
    if (P.Pump1_Fault && al && al.dyn.vis && al.dyn.vis.tag === 'Pump1_Fault' && al.dyn.vis.c !== '0') E.f.pf = 1;
    const va = byT(E, 'valve')[0];
    if (P.Valve1_Fault && va && va.dyn.al && va.dyn.al.tag === 'Valve1_Fault') E.f.vf = 1;
  },
  items:[
    {t:'الخزان: الامتلاء Fill من Tank1_Level', f:E => byT(E, 'tank').some(i => i.dyn.fill && i.dyn.fill.tag === 'Tank1_Level')},
    {t:'الصمام: اللون حسب Valve1_Open بمخطط ISA (مغلق = إطار، مفتوح = ممتلئ)', f:E => byT(E, 'valve').some(i => i.dyn.color && i.dyn.color.tag === 'Valve1_Open' && i.dyn.color.sc === 'isa')},
    {t:'الصمام: العطل Valve1_Fault بالأحمر الوامض', f:E => byT(E, 'valve').some(i => i.dyn.al && i.dyn.al.tag === 'Valve1_Fault' && i.dyn.al.st === 'flash')},
    {t:'أيقونة الإنذار: تظهر فقط عندما Pump1_Fault = 1', f:E => byT(E, 'alarm').some(i => i.dyn.vis && i.dyn.vis.tag === 'Pump1_Fault' && i.dyn.vis.c !== '0')},
    {t:'المضخة: Click → OpenFaceplate للوجه الجاهز Pump1', f:E => byT(E, 'pump').some(i => evIs(i, 'click', 'OpenFaceplate') || evIs(i, 'release', 'OpenFaceplate'))},
    {t:'Runtime: انقر المضخة لفتح الوجه الجاهز، وشغّلها منه', rt:1, f:E => !!(E.f.fp && E.f.fpRun)},
    {t:'Runtime: احقن عطلًا في المضخة ثم في الصمام وشاهد الإنذار', rt:1, f:E => !!(E.f.pf && E.f.vf)}
  ],
  hint:(E, res) => {
    const va = byT(E, 'valve')[0], al = byT(E, 'alarm')[0];
    if (va && va.dyn.color && va.dyn.color.sc === 'rg') return 'الأخضر والأحمر للحالة يخالفان ISA-101: اختر مخطط ISA.';
    if (va && va.dyn.color && va.dyn.color.tag && va.dyn.color.tag !== 'Valve1_Open') return 'لون الصمام يتبع تغذيته الراجعة Valve1_Open، لا أمر الفتح.';
    if (va && va.dyn.al && va.dyn.al.tag === 'Valve1_Fault' && va.dyn.al.st !== 'flash') return 'الإنذار غير المؤكد يومض: اختر «أحمر وامض».';
    if (al && al.dyn.vis && al.dyn.vis.tag === 'Pump1_Fault' && al.dyn.vis.c === '0') return 'بهذا الشرط تظهر الأيقونة والمضخة سليمة: اختر «الوسم = 1».';
    if (al && al.dyn.vis && al.dyn.vis.tag && al.dyn.vis.tag !== 'Pump1_Fault') return 'أيقونة الإنذار تتبع عطل المضخة Pump1_Fault.';
    if (res.slice(0, 5).every(Boolean) && !E.rt) return 'التصميم مكتمل: شغّل Runtime، انقر المضخة وشغّلها من الوجه الجاهز، ثم احقن العطلين.';
    if (E.rt && !E.rtOK) return 'أكمل بنود التصميم ثم أعد تشغيل Runtime.';
    if (E.rt && !E.f.fp) return 'انقر رمز المضخة على الشاشة لفتح الوجه الجاهز.';
    if (E.rt && !E.f.fpRun) return 'اضغط Start في الوجه الجاهز.';
    if (E.rt) return !E.f.pf ? 'من لوحة الاختبار: «حقن عطل Pump1_Fault».' : 'أزل العطل ثم احقن «Valve1_Fault» وشاهد وميض الصمام.';
    return firstMiss(res, ['انقر الخزان، وفي «الامتلاء من وسم» اختر Tank1_Level.', 'انقر الصمام: «اللون حسب البت» = Valve1_Open، والمخطط ISA.', 'في الصمام نفسه: «لون الإنذار» = Valve1_Fault، والمظهر «أحمر وامض».', 'انقر أيقونة الإنذار: «الظهور» = Pump1_Fault، يظهر عندما = 1.', 'انقر المضخة، وفي الأحداث اجعل Click = OpenFaceplate.']);
  },
  async demo(E, D){
    const tk = D.find('Tank1'), va = D.find('Valve1'), al = D.find('AlarmPump1'), pu = D.find('Pump1');
    D.say('امتلاء الخزان من Tank1_Level.'); await D.set(tk, 'dyn.fill.tag', 'Tank1_Level');
    D.say('لون الصمام حسب حالته على نمط ISA.'); await D.set(va, 'dyn.color.tag', 'Valve1_Open'); await D.set(va, 'dyn.color.sc', 'isa');
    D.say('عطل الصمام: أحمر وامض.'); await D.set(va, 'dyn.al.tag', 'Valve1_Fault'); await D.set(va, 'dyn.al.st', 'flash');
    D.say('أيقونة الإنذار تظهر عند العطل فقط.'); await D.set(al, 'dyn.vis.tag', 'Pump1_Fault'); await D.set(al, 'dyn.vis.c', '1');
    D.say('النقر على المضخة يفتح الوجه الجاهز.'); await D.set(pu, 'ev.click.fn', 'OpenFaceplate');
    D.say('Runtime: افتح الوجه وشغّل المضخة.'); await D.run();
    await D.press(pu, 200); await sleep(900); await D.fp('start'); await sleep(2600); await D.fp('spp'); await D.fp('spp'); await sleep(1600); await D.fp('close');
    D.say('احقن عطل المضخة: تظهر الأيقونة.'); await D.test('pf'); await sleep(2600); await D.test('rst'); await sleep(800);
    D.say('احقن عطل الصمام: يومض بالأحمر.'); await D.test('vf'); await sleep(2800); await D.test('vc'); await sleep(1500);
  }
};

/* ---- 4. filling-line project ---- */
const PROJ_TEMPLATE = () => mkDoc({
  main:{t:'Overview', a:'نظرة عامة', items:[
    ['text', {x:20, y:10, w:300, h:34, text:'خط التعبئة: نظرة عامة', fs:20}],
    ['motor', {name:'Mixer1', x:50, y:70, w:60, h:36, dyn:{color:{tag:'Mixer1_Running', sc:'isa'}}}],
    ['tank', {id:'tk', name:'Tank1', x:30, y:120, w:100, h:150, dyn:{fill:{tag:'Tank1_Level'}}}],
    ['pump', {id:'pu', name:'Pump1', x:170, y:170, w:70, h:86}],
    ['valve', {id:'va', name:'Valve1', x:290, y:120, w:60, h:78, stateText:true, dyn:{color:{tag:'Valve1_Open', sc:'isa'}, al:{tag:'Valve1_Fault', st:'flash'}}}],
    ['filler', {id:'fi', name:'Filler1', x:420, y:96, w:80, h:110}],
    ['capper', {name:'Capper1', x:600, y:96, w:70, h:110}],
    ['conv', {name:'Conveyor1', x:390, y:206, w:380, h:56}],
    ['pipe', {from:'tk', to:'pu'}], ['pipe', {from:'pu', to:'va'}], ['pipe', {from:'va', to:'fi'}],
    ['button', {name:'BtnStart', x:30, y:300, w:110, h:40, text:'Start', ev:{press:{fn:'SetBit', tag:'Line_Start'}, release:{fn:'ResetBit', tag:'Line_Start'}}}],
    ['button', {name:'BtnStop', x:150, y:300, w:110, h:40, text:'Stop', ev:{press:{fn:'SetBit', tag:'Line_Stop'}, release:{fn:'ResetBit', tag:'Line_Stop'}}}],
    ['io', {name:'Count', x:280, y:300, w:130, h:40, tag:'Bottle_Count', f:'9999', unit:'pcs', fs:18}],
    ['trend', {name:'LevelTrend', x:440, y:290, w:330, h:140, tag:'Tank1_Level', min:0, max:100}],
    ['scr', {name:'ToAlarms', x:630, y:16, w:150, h:40, target:'al', text:'إنذارات ›'}],
    ['alarm', {name:'AlarmIcon1', x:590, y:18, w:34, h:34, dyn:{vis:{tag:'Alarm_Active', c:'1'}}}]
  ]},
  al:{t:'Alarms', a:'إنذارات', items:[
    ['text', {x:20, y:10, w:200, h:34, text:'الإنذارات', fs:20}],
    ['alview', {name:'AlarmView1', x:20, y:60, w:760, h:260}],
    ['scr', {name:'ToOverview', x:20, y:340, w:180, h:40, target:'main', text:'‹ نظرة عامة'}]
  ]}
});
const linked = (E, a, b) => { return byT(E, 'pipe').some(p => { const f = on(E).find(i => i.id === p.from), t = on(E).find(i => i.id === p.to); return f && t && ((f.type === a && t.type === b) || (f.type === b && t.type === a)); }); };
CFG.project = {
  id:'project', test:['pf', 'vf', 'air', 'rst'], watch:['Line_Running', 'Pump1_Running', 'Tank1_Level', 'Pump1_Current', 'Bottle_Count', 'Air_Pressure', 'Alarm_Active'],
  intro:'ابنِ شاشة النظرة العامة من صندوق الأدوات، ثم انتقل إلى شاشة Alarms من شريط الشاشات وأضف عرض الإنذارات.',
  winMsg:'محطة خط التعبئة تعمل: تنتج العبوات، تُظهر الإنذارات وتؤكَّد، ويستمر الإنتاج ✓',
  init:() => mkDoc({main:{t:'Overview', a:'نظرة عامة', items:[['text', {x:20, y:10, w:300, h:34, text:'خط التعبئة: نظرة عامة', fs:20}]]}, al:{t:'Alarms', a:'إنذارات', items:[['text', {x:20, y:10, w:200, h:34, text:'الإنذارات', fs:20}]]}}),
  rtInit:P => { P.Valve1_Cmd = 1; P.Tank1_Level = 60; },
  rtTick:E => { const P = E.P; if (P.Bottle_Count >= 5) E.f.c5 = 1; if (E.f.ack && E.ackAt != null && P.Bottle_Count >= E.ackAt + 3) E.f.cont = 1; },
  onAlarm:(E, d) => { if (d.p === 1) E.say('إنذار: ' + d.t + '. الخط توقف؛ أكّد الإنذار، ثم أزل العطل وأعد التشغيل.', 'bad'); },
  items:[
    {t:'الخزان على الشاشة وامتلاؤه من Tank1_Level', f:E => byT(E, 'tank').some(i => i.dyn.fill && i.dyn.fill.tag === 'Tank1_Level')},
    {t:'المعدّات: مضخة، صمام، رأس تعبئة، سير ناقل، آلة أغطية', f:E => ['pump', 'valve', 'filler', 'conv', 'capper'].every(t => byT(E, t).length)},
    {t:'أنابيب تصل: الخزان ← المضخة ← الصمام ← رأس التعبئة', f:E => linked(E, 'tank', 'pump') && linked(E, 'pump', 'valve') && linked(E, 'valve', 'filler')},
    {t:'زرّا Start و Stop لحظيان على Line_Start و Line_Stop', f:E => byT(E, 'button').some(b => momentary(b, 'Line_Start')) && byT(E, 'button').some(b => momentary(b, 'Line_Stop'))},
    {t:'عدّاد العبوات: حقل I/O مربوط بـ Bottle_Count', f:E => byT(E, 'io').some(i => i.tag === 'Bottle_Count')},
    {t:'ترند لمستوى الخزان Tank1_Level', f:E => byT(E, 'trend').some(i => i.tag === 'Tank1_Level')},
    {t:'زر تغيير شاشة إلى Alarms، وفيها عرض إنذارات وزر عودة', f:E => byT(E, 'scr').some(i => i.target === 'al') && byT(E, 'alview', 'al').length > 0 && byT(E, 'scr', 'al').some(i => i.target === 'main')},
    {t:'Runtime: الخط أنتج 5 عبوات على الأقل', rt:1, f:E => !!E.f.c5},
    {t:'Runtime: إنذار عطل ظهر وأُكّد Acknowledge، واستمر العدّ بعده', rt:1, f:E => !!(E.f.ack && E.f.cont)}
  ],
  hint:(E, res) => {
    const bs = byT(E, 'button');
    if (bs.some(b => evIs(b, 'press', 'SetBit', 'Pump1_Start'))) return 'للخط كله استخدم Line_Start و Line_Stop، لا أوامر المضخة.';
    if (bs.some(b => b.ev.click && b.ev.click.fn === 'InvertBit')) return 'InvertBit يجعل الزر مبدّلًا Toggle: استخدم Press → SetBit و Release → ResetBit.';
    const cnt = byT(E, 'io').find(i => i.tag === 'Bottle_Count');
    if (cnt && /\./.test(cnt.f)) return 'العدّاد Int بلا كسور: اختر التنسيق 9999.';
    if (byT(E, 'pipe').some(p => !p.from || !p.to) && !res[2]) return 'اختر لكل أنبوب «يصل من» و«إلى» في خصائصه.';
    if (res.slice(0, 7).every(Boolean) && !E.rt) return 'التصميم مكتمل: شغّل Runtime واضغط Start.';
    if (E.rt && !E.rtOK) return 'أكمل بنود التصميم ثم أعد تشغيل Runtime.';
    if (E.rt && !E.f.c5) return E.P.Line_Running ? 'الخط يعمل؛ انتظر 5 عبوات.' : 'اضغط Start لتشغيل الخط.';
    if (E.rt && !E.f.ack) return 'احقن عطلًا من لوحة الاختبار، ثم انتقل إلى شاشة Alarms واضغط Acknowledge.';
    if (E.rt) return E.P.Pump1_Fault || E.P.Valve1_Fault ? 'أزل العطل (Reset) ثم عد واضغط Start.' : E.P.Line_Running ? 'الخط يعمل؛ انتظر ثلاث عبوات أخرى.' : 'عد إلى Overview واضغط Start.';
    return firstMiss(res, ['اسحب خزانًا، وفي الديناميكية اجعل الامتلاء من Tank1_Level.', 'أضف مضخة وصمامًا ورأس تعبئة وسيرًا ناقلًا وآلة أغطية.', 'أضف ثلاثة أنابيب واختر لكل منها «يصل من» و«إلى».', 'أضف زرّي Start و Stop: Press → SetBit و Release → ResetBit على Line_Start و Line_Stop.', 'أضف حقل I/O للعدّ بالوسم Bottle_Count.', 'أضف ترندًا بالوسم Tank1_Level.', 'أضف زر تغيير شاشة إلى Alarms، ثم في شاشة Alarms أضف عرض الإنذارات وزر عودة إلى Overview.']);
  },
  async demo(E, D){
    D.say('حمّل قالبًا جاهزًا (متاح في العرض فقط).');
    await sleep(900);
    const t = PROJ_TEMPLATE(); E.doc.screens = t.screens; E.doc.next = Math.max(E.doc.next, t.next + 50);
    E.select(null); E.check(); await sleep(1800);
    D.say('Runtime: Start وإنتاج العبوات.'); await D.run();
    const start = D.find('BtnStart'), toAl = D.find('ToAlarms');
    await D.press(start, 350);
    await D.until(() => E.P.Bottle_Count >= 5, 16000); await sleep(500);
    D.say('عطل في المضخة: الخط يتوقف ويظهر الإنذار.'); await D.test('pf'); await sleep(1800);
    D.say('انتقل إلى شاشة Alarms واضغط Acknowledge.'); await D.press(toAl, 300); await sleep(1500); await D.ack(); await sleep(800);
    D.say('أزل العطل وعد وأعد التشغيل.'); await D.test('rst'); await D.press(D.find('ToOverview'), 300); await sleep(700);
    await D.press(D.find('BtnStart'), 350);
    await D.until(() => E.f.cont, 12000); await sleep(1500);
  }
};

const first = location.hash.slice(1);
show(G[first] ? first : 'isa');
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (G[h]) show(h); });
})();
