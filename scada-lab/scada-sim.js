/* محطة SCADA لخط تعبئة – LearnElectricals (MSA UI)
   One shared process model (tank, pump, mixer, valves, conveyor, filler, capper, compressor) runs in real time.
   The operator runtime on top (overview + alarm banner + user + clock) reads it through an HMI layer
   (connection + tag table + field formats); every tab is an exercise that works on that same plant. */
(function(){
'use strict';
const $ = IL.$, $$ = IL.$$, esc = IL.esc, fmt = IL.fmt, clamp = IL.clamp;
IL.hubTheme();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pad = (n, w) => String(n).padStart(w || 2, '0');
const hms = ms => { const d = new Date(ms); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); };
const hmsm = ms => hms(ms) + '.' + pad(new Date(ms).getMilliseconds(), 3);
const L = s => `<bdi class="ltr mono">${esc(s)}</bdi>`;
const ip2n = s => { const p = String(s).trim().split('.'); if (p.length !== 4) return null; let n = 0; for (const x of p){ if (!/^\d{1,3}$/.test(x) || +x > 255) return null; n = n * 256 + +x; } return n; };
function logTo(el, html, cls){ const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = html; el.appendChild(d); while (el.children.length > 60) el.removeChild(el.firstChild); el.scrollTop = el.scrollHeight; }

const TABS = [
  {id:'tags', t:'الوسوم والاتصال', l:'l2', h:'جدول الوسوم والاتصال بالـ S7-1500', goal:'أصلح إعدادات الاتصال بالـ S7-1500 وأخطاء جدول الوسوم، ثم حمّل المشروع حتى تطابق القيم الحية في الشاشة جدولَ المراقبة في الـ PLC.'},
  {id:'alarms', t:'الإنذارات', l:'l6', h:'إدارة فيضان الإنذارات (ISA-18.2)', goal:'حدّد أول إنذار في الفيضان، وأكّد كل الإنذارات، ثم اكتم الإنذار المتذبذب مؤقتًا وعالج سببه بنطاق ميت لا يقل عن 2 % أو بتأخير ظهور لا يقل عن 5 ثوانٍ.'},
  {id:'trend', t:'الترند', l:'l7', h:'تحليل حادثة فيضان الخزان من الترند التاريخي', goal:'ضع أحد مؤشري الترند عند لحظة تجمّد مرسل المستوى، ثم اختر السبب الصحيح لفيضان الخزان.'},
  {id:'users', t:'المستخدمون', l:'l8', h:'المستخدمون والأدوار والصلاحيات', goal:'اضبط مصفوفة الصلاحيات ومدة الخروج التلقائي وفق السياسة المطلوبة، ثم سجّل الدخول وجرّب إجراءً واحدًا على الأقل يُرفض.'},
  {id:'recipe', t:'الوصفات', l:'l9', h:'وصفة «تعبئة العصير» وتحميلها إلى الـ PLC', goal:'عدّل سجلًا وجرّب قيمة خارج الحدود ثم احفظه، وحمّله إلى الـ PLC بالتسلسل الآمن، ثم شغّل الخط وشاهد العبوات تُملأ بالحجم الجديد.'},
  {id:'arch', t:'المعمارية', l:'l10', h:'المعمارية والتكرار: خادمان وثلاثة عملاء و MES', goal:'اضبط تكرار الخادمين ووجّه عميل الويب إلى العنوان الافتراضي، ثم افصل الخادم الرئيسي وتحقق من نجاح التحويل وعودة كل العملاء.'},
  {id:'faults', t:'الأعطال', l:'l11', h:'تشخيص أعطال محطة SCADA', goal:'اضغط «ابدأ» ثم اعثر على الأعطال الأربعة المخفية بالأدوات الصحيحة وأصلحها كلها.'}
];

/* =====================================================================
   1. process model
   ===================================================================== */
const FLA = 12.4;
const capOf = v => v <= 0.27 ? 0.25 : v <= 0.55 ? 0.5 : 1;
const M = {
  t:0, line:true, trip:'', tripT:0, pend:false,
  comp:{run:true, trip:false, tripT:0}, air:6.5,
  lvl:58, meas:58, inlet:true, lo:45, hi:70, noise:0,
  pump:{run:false, spd:0, cur:0, st:0}, press:0,
  mix:{run:true, a:0},
  rec:{name:'1.0 L', vol:1.0, spd:300, tq:2.2, mix:120},
  count:32790, conv:{ph:'dwell', t:0, p:0}, belt:0, btl:[], filling:false,
  opDown:false, srvA:true
};
const EV = {filled:[], counted:[]};
function newBottle(s){ return {s, cap:capOf(M.rec.vol), vol:0, fill:0, done:false, capped:false, capT:0}; }
for (let i = 0; i <= 10; i++){ const b = newBottle(i); if (i >= 4){ b.vol = M.rec.vol; b.fill = i === 4 ? 0.35 : b.vol; b.done = i > 4; } if (i > 7) b.capped = true; M.btl.push(b); }

function lineStart(){ if (M.comp.trip || M.air < 5.5) return 'air'; M.line = true; M.trip = ''; M.pend = false; return ''; }
function lineStop(){ M.line = false; M.trip = ''; M.pend = false; }
function compTrip(){ if (M.comp.trip) return; M.comp.trip = true; M.comp.tripT = M.t; }
function compReset(){ M.comp.trip = false; M.pend = true; }

function step(dt){
  M.t += dt;
  /* compressor and instrument air */
  M.comp.run = !M.comp.trip;
  if (M.comp.trip) M.air += -M.air / 8 * dt; else M.air += (6.5 - M.air) / 2.2 * dt;
  if (M.line && M.air < 4.0){ M.line = false; M.trip = 'air'; M.tripT = M.t; }
  if (M.pend && !M.comp.trip && M.air > 5.6){ M.pend = false; M.line = true; M.trip = ''; }
  /* tank level, transmitter (with mixer slosh), on/off level control of the inlet valve */
  M.noise += ((Math.random() - .5) * 0.2 - M.noise) * Math.min(1, dt * 5);
  M.mix.run = M.lvl > 12;
  if (M.mix.run) M.mix.a += dt * 7.5;
  const sl = M.mix.run ? 0.72 * Math.sin(M.t * 2.03) + 0.16 * Math.sin(M.t * 4.9) : 0;
  M.meas = clamp(M.lvl + sl + M.noise, 0, 100);
  if (M.meas < M.lo) M.inlet = true; else if (M.meas > M.hi) M.inlet = false;
  /* transfer pump P-101 */
  const p = M.pump, want = M.line && M.lvl > 5;
  if (want && !p.run){ p.run = true; p.st = 0; }
  if (!want) p.run = false;
  if (p.run){ p.st += dt; p.spd = Math.min(1450, p.spd + 1100 * dt); p.cur = FLA * (0.45 + 0.55 * p.spd / 1450) * (1 + 4.8 * Math.exp(-p.st / 0.35)) + M.noise * 0.6; }
  else { p.spd = Math.max(0, p.spd - 900 * dt); p.cur = 0; }
  M.press = p.spd > 0 ? Math.max(0, 2.35 * Math.pow(p.spd / 1450, 2) + M.noise * 0.04) : 0;
  M.lvl = clamp(M.lvl + ((M.inlet ? 1.0 : 0) - (p.run ? 0.5 * p.spd / 1450 : 0)) * dt, 0, 100);
  /* indexing conveyor: move one pitch, then dwell while the filler fills and the capper caps */
  const C = M.conv; M.filling = false;
  if (M.line){
    C.t += dt;
    if (C.ph === 'move'){
      C.p = Math.min(1, C.t / 0.8); M.belt += dt * 60;
      if (C.p >= 1){
        M.btl.forEach(b => { b.s += 1; if (b.s === 9 && b.done && b.capped){ M.count++; EV.counted.forEach(f => f(b)); } });
        M.btl = M.btl.filter(b => b.s <= 11);
        if (!M.btl.some(b => b.s === 0)) M.btl.unshift(newBottle(0));
        C.ph = 'dwell'; C.t = 0; C.p = 0;
      }
    } else {
      const f = M.btl.find(b => b.s === 4), c = M.btl.find(b => b.s === 7);
      if (f && !f.done){
        if (!f.vol) f.vol = M.rec.vol;
        if (p.run && p.spd > 1000){ f.fill = Math.min(f.vol, f.fill + M.rec.spd / 1000 * dt); M.filling = true; }
        if (f.fill >= f.vol - 1e-9){ f.done = true; EV.filled.forEach(fn => fn(f)); }
      }
      if (c && !c.capped){ c.capT += dt; if (c.capT > 0.35 + M.rec.tq * 0.12) c.capped = true; }
      if ((!f || f.done) && (!c || c.capped) && C.t > 0.35){ C.ph = 'move'; C.t = 0; }
    }
  }
}

/* =====================================================================
   2. alarm server (discrete + analog alarms evaluated from the model)
   ===================================================================== */
const tr = d => () => M.trip === 'air' && M.t - M.tripT >= d;
const LH = {lim:80, db:0, on:0};          /* Tank1_Level high: settings the learner tunes */
const AD = [];
function def(id, p, cls, txt, cond, o){ AD.push(Object.assign({id, p, cls, txt, cond, act:false, above:0}, o || {})); }
def('c1trip', 1, 'Alarm', 'C-001: فصل الضاغط بحماية الحمل الزائد (Q12)', () => M.comp.trip);
def('dryer', 3, 'Warning', 'AD-001: مجفف الهواء متوقف', () => M.comp.trip && M.t - M.comp.tripT > 1.2);
def('air_l', 2, 'Warning', 'PT-001: ضغط هواء التشغيل منخفض (أقل من 5.0 bar)', () => M.air < 5.0);
def('airknife', 3, 'Warning', 'RN-1: ضغط سكين الهواء منخفض', () => M.air < 4.9);
def('capchuck', 3, 'Warning', 'CP-1: ضغط هواء رأس الإغلاق منخفض', () => M.air < 4.75);
[4.6, 4.45, 4.35, 4.25, 4.15, 4.05].forEach((a, i) => def('fv' + (i + 1), 2, 'Alarm', `FV-10${i + 1}: تعارض وضع صمام التعبئة ${i + 1}`, () => M.air < a));
def('air_ll', 1, 'Alarm', 'PT-001: ضغط هواء التشغيل منخفض جدًا (أقل من 4.0 bar)', () => M.air < 4.0);
def('line_stop', 2, 'Alarm', 'L1: توقف الخط بسبب انخفاض ضغط الهواء', tr(0));
def('filler_stop', 2, 'Alarm', 'FL-1: توقف آلة التعبئة توقفًا غير متوقع', tr(0.15));
def('capper_stop', 2, 'Alarm', 'CP-1: توقف آلة الإغلاق', tr(0.4));
def('conv_stop', 3, 'Warning', 'CV-1: توقف السير الناقل', tr(0.7));
def('pump_nd', 4, 'Warning', 'P-101: المضخة متوقفة (لا طلب من آلة التعبئة)', () => tr(1)() && !M.pump.run);
def('v101', 2, 'Alarm', 'V-101: تعارض وضع صمام الدخول', () => M.air < 3.7);
def('v102', 2, 'Alarm', 'V-102: تعارض وضع صمام الخروج', () => M.air < 3.55);
def('rinser', 3, 'Warning', 'RN-1: آلة الشطف متوقفة', tr(1.5));
def('capfeed', 3, 'Warning', 'CF-1: مغذّي الأغطية متوقف (لا هواء)', () => M.air < 3.4);
def('coder', 3, 'Warning', 'DC-1: طابعة التاريخ متوقفة', tr(2.0));
def('jam', 3, 'Alarm', 'CV-1: تكدّس عبوات عند مدخل آلة التعبئة', tr(2.6));
def('reject', 3, 'Alarm', 'RG-1: عطل بوابة الرفض', () => M.air < 3.2);
def('labeler', 3, 'Warning', 'LB-1: آلة الملصقات بانتظار العبوات', tr(3.1));
def('vacuum', 3, 'Warning', 'CP-1: فقد التفريغ في ماسك الأغطية', () => M.air < 2.9);
def('accum', 3, 'Warning', 'AT-1: طاولة التجميع ممتلئة', tr(3.8));
def('fillerbowl', 3, 'Warning', 'FL-1: مستوى وعاء التعبئة مرتفع', tr(4.4));
def('palet', 3, 'Warning', 'PK-1: آلة التغليف بانتظار العبوات', tr(4.9));
def('lub', 4, 'Warning', 'CV-1: فشل دورة التشحيم', () => M.air < 2.6);
def('oee', 4, 'System', 'L1: كفاءة OEE أقل من الهدف', tr(5.2));
def('order', 4, 'System', 'MES: أمر الإنتاج متأخر عن الجدول', tr(5.8));
def('lvl_h', 2, 'Alarm', 'LT-101: مستوى الخزان T-101 مرتفع (H أكبر من 80 %)', null, {an:true});
def('conn', 1, 'System', 'HMI_Connection_1: انقطع الاتصال بالـ PLC (192.168.0.1)', () => hmiLost(), {sys:true});
def('srv', 1, 'System', 'SRV-A: الخادم الرئيسي غير متاح', () => !M.srvA, {sys:true});
def('door', 2, 'Warning', 'FL-1: باب الحماية في آلة التعبئة مفتوح', () => doorAlarm(), {sys:true});
const ADM = {}; AD.forEach(d => ADM[d.id] = d);
const AL = {list:[], log:[], came:{}, shelved:{}, seq:0, ver:0, flood:null, firstOk:false};
const PNAME = {1:'عاجل', 2:'مرتفع', 3:'متوسط', 4:'منخفض'};

function aCome(d, now){
  d.act = true;
  if (AL.shelved[d.id]){ AL.shelved[d.id].n++; return; }
  const cls = typeof d.clsF === 'function' ? d.clsF() : d.cls;
  AL.list.push({k:++AL.seq, id:d.id, p:d.p, cls, txt:d.txt, came:now, went:0, ack:0});
  AL.log.push(now); (AL.came[d.id] = AL.came[d.id] || []).push(now); AL.ver++;
}
function aGo(d, now){
  d.act = false;
  AL.list.forEach(a => { if (a.id === d.id && !a.went){ a.went = now; } });
  AL.list = AL.list.filter(a => !(a.went && a.ack)); AL.ver++;
}
function aAck(a, who){
  if (!a || a.ack) return; a.ack = Date.now(); a.by = who || USER.u;
  if (a.went) AL.list = AL.list.filter(x => x !== a); AL.ver++;
}
function alarmTick(dt){
  const now = Date.now(), lost = hmiLost();
  for (const d of AD){
    let c;
    if (d.sys) c = d.cond();
    else if (lost) continue;
    else if (d.an){
      const over = M.meas > LH.lim;
      if (!d.act){ d.above = over ? d.above + dt : 0; c = over && d.above >= LH.on - 1e-9; }
      else c = M.meas >= LH.lim - LH.db;
    } else c = d.cond();
    if (c && !d.act) aCome(d, now); else if (!c && d.act) aGo(d, now);
  }
  for (const id in AL.shelved) if (AL.shelved[id].until < now){ delete AL.shelved[id]; AL.ver++; }
  const cut = now - 600000; while (AL.log.length && AL.log[0] < cut) AL.log.shift();
}
const rate10 = () => AL.log.length;
const chatter = id => (AL.came[id] || []).filter(t => t > Date.now() - 60000).length;
/* alarm-priority shapes (ISA-101): 1 red square, 2 orange triangle, 3 yellow diamond, 4 purple circle */
function shp(p, blink){
  const g = {1:'<rect x="-7" y="-7" width="14" height="14" fill="var(--a1)"/>', 2:'<path d="M0,-8 L8.5,7 L-8.5,7 Z" fill="var(--a2)"/>', 3:'<path d="M0,-8.5 L8.5,0 L0,8.5 L-8.5,0 Z" fill="var(--a3)"/>', 4:'<circle r="7.5" fill="var(--a4)"/>'}[p];
  return `<g${blink ? ' class="blk"' : ''}>${g}<text class="ai-t" y="${p === 2 ? 5 : 3.6}" fill="${p === 1 || p === 4 ? '#fff' : '#000'}">${p}</text></g>`;
}
const shpSvg = (p, blink) => `<svg width="18" height="18" viewBox="-9 -9 18 18" aria-label="${PNAME[p]}" role="img">${shp(p, blink)}</svg>`;
const aState = a => a.went ? 'Came/Went' : a.ack ? 'Came/Ack' : 'Came';

/* =====================================================================
   3. HMI layer: connection + tag table + field formats → what the screen shows
   ===================================================================== */
const PLC = {
  Tank1_Level:{addr:'%IW64', type:'Int', fmt:'DEC', get:() => Math.round(clamp(M.meas, 0, 100) / 100 * 27648)},
  Line_Pressure:{addr:'"DB_Line".Line_Pressure', type:'Real', fmt:'Floating-point', get:() => M.press},
  Bottle_Count:{addr:'"DB_Line".Bottle_Count', type:'DInt', fmt:'DEC+/-', get:() => M.count},
  Pump1_Current:{addr:'"DB_Line".Pump1_Current', type:'Real', fmt:'Floating-point', get:() => M.pump.cur},
  Pump1_Speed:{addr:'"DB_Line".Pump1_Speed', type:'Int', fmt:'DEC', get:() => Math.round(M.pump.spd)},
  Air_Pressure:{addr:'"DB_Line".Air_Pressure', type:'Real', fmt:'Floating-point', get:() => M.air}
};
const TAGN = Object.keys(PLC);
const CYC = {'100 ms':0.1, '500 ms':0.5, '1 s':1, '10 s':10};
const refTags = () => ({
  Tank1_Level:{type:'Real', cyc:'500 ms', sc:true, plo:0, phi:27648, hlo:0, hhi:100},
  Line_Pressure:{type:'Real', cyc:'500 ms', sc:false, plo:0, phi:27648, hlo:0, hhi:100},
  Bottle_Count:{type:'DInt', cyc:'500 ms', sc:false, plo:0, phi:27648, hlo:0, hhi:100},
  Pump1_Current:{type:'Real', cyc:'500 ms', sc:false, plo:0, phi:27648, hlo:0, hhi:100},
  Pump1_Speed:{type:'Int', cyc:'500 ms', sc:false, plo:0, phi:27648, hlo:0, hhi:100},
  Air_Pressure:{type:'Real', cyc:'500 ms', sc:false, plo:0, phi:27648, hlo:0, hhi:100}});
const refFields = () => ({Tank1_Level:{dec:1, w:6}, Line_Pressure:{dec:2, w:6}, Bottle_Count:{dec:0, w:8}, Pump1_Current:{dec:1, w:6}, Pump1_Speed:{dec:0, w:6}, Air_Pressure:{dec:1, w:5}});
const REF = {conn:true, tags:refTags(), fields:refFields()};
const SCN = {};            /* scenario configs set by tabs: SCN.tags (tags tab), SCN.faults (faults tab) */
let CUR = null;
function cfgNow(){ if (CUR === 'tags' && SCN.tags) return SCN.tags; if (CUR === 'faults' && SCN.faults) return SCN.faults; return REF; }
function hmiLost(){ return !cfgNow().conn || M.opDown; }
function f32words(v){ const dv = new DataView(new ArrayBuffer(4)); dv.setFloat32(0, v); return [dv.getInt16(0), dv.getInt32(0)]; }
const wrap16 = v => ((v + 32768) % 65536 + 65536) % 65536 - 32768;
function conv(name, tc){
  const P = PLC[name]; let v = P.get(); const pt = P.type, ht = tc.type;
  if (ht === 'Bool') return v ? 1 : 0;
  if (pt === 'Real' && ht === 'Int') v = tc.abs ? f32words(v)[0] : clamp(Math.trunc(v), -32768, 32767);
  else if (pt === 'Real' && ht === 'DInt') v = tc.abs ? f32words(v)[1] : Math.trunc(v);
  else if (pt === 'DInt' && ht === 'Int') v = wrap16(v);
  if (tc.sc && tc.phi !== tc.plo){ v = tc.hlo + (v - tc.plo) * (tc.hhi - tc.hlo) / (tc.phi - tc.plo); if (ht !== 'Real') v = Math.trunc(v); }
  return v;
}
function hmiRead(name, cfg){
  const c = cfg || cfgNow();
  if (!c.conn || M.opDown) return {s:'####', ok:false, v:NaN};
  const tc = c.tags[name], f = c.fields[name];
  c._c = c._c || {}; let e = c._c[name];
  const cyc = CYC[tc.cyc] || 0.5;
  if (!e || M.t - e.t >= cyc || M.t < e.t || e.cfg !== tc.type + tc.sc + tc.abs + tc.plo + tc.phi + tc.hlo + tc.hhi) e = c._c[name] = {t:M.t, v:conv(name, tc), cfg:tc.type + tc.sc + tc.abs + tc.plo + tc.phi + tc.hlo + tc.hhi};
  const v = e.v; let s = tc.type === 'Real' ? fmt(v, f.dec) : String(Math.trunc(v));
  let ovf = false; if (s.length > f.w){ s = '#####'; ovf = true; }
  return {s, ok:true, v, ovf};
}

/* =====================================================================
   4. operator runtime (overview screen, alarm banner, user, clock)
   ===================================================================== */
const USER = {u:'op1', r:'Operator'};
const rt = $('#rt');
let ovMin = !!IL.store.get('scadaOvMin');
rt.innerHTML = `<div class="rt-bar"><span class="rt-scr">Line1_Overview</span><button type="button" class="rt-ban" id="rtBan" aria-label="آخر إنذار غير مؤكد: افتح إدارة الإنذارات"></button><span class="rt-user" id="rtUser" title="المستخدم الحالي"></span><span class="rt-clk" id="rtClk"></span><button type="button" class="btn rt-min" id="rtMin" aria-label="إخفاء الشاشة أو إظهارها">▾</button></div><div class="rt-svg" id="rtSvg"></div><div class="rt-st" id="rtSt"></div>`;
rt.classList.toggle('min', ovMin);
$('#rtMin').addEventListener('click', () => { ovMin = !ovMin; rt.classList.toggle('min', ovMin); $('#rtMin').textContent = ovMin ? '▸' : '▾'; IL.store.set('scadaOvMin', ovMin); });
$('#rtMin').textContent = ovMin ? '▸' : '▾';
$('#rtBan').addEventListener('click', () => show('alarms'));
const rtSvg = $('#rtSvg');
const TANK = 'M220,70 Q220,62 228,62 H302 Q310,62 310,70 V214 Q310,236 265,236 Q220,236 220,214 Z';
const vb = (k, x, y, w, unit, lab) => `<text class="t-l" x="${x}" y="${y - 5}">${lab}</text><g class="vb" id="ov-vb-${k}"><rect class="vbr" x="${x}" y="${y}" width="${w}" height="24" rx="3"/><text class="vbt" x="${x + w - (unit ? 32 : 7)}" y="${y + 17}" text-anchor="end">—</text>${unit ? `<text class="vbu" x="${x + w - 28}" y="${y + 16.5}">${unit}</text>` : ''}</g>`;
const ai = (k, x, y) => `<g id="ov-ai-${k}" transform="translate(${x},${y})"></g>`;
const valve = (id, x, y) => `<g id="ov-${id}"><path class="eq" d="M${x - 12},${y - 8} L${x},${y} L${x - 12},${y + 8} Z M${x + 12},${y - 8} L${x},${y} L${x + 12},${y + 8} Z"/><path class="sym" d="M${x},${y} V${y - 14}"/><path class="eq" d="M${x - 8},${y - 14} A8,8 0 0 1 ${x + 8},${y - 14} Z"/></g>`;
function grpA(){ return `
  ${vb('air', 6, 22, 84, 'bar', 'Air_Pressure')}${ai('air', 100, 34)}
  <path class="pipe" d="M50,190 V156" style="stroke-width:3"/>
  <rect class="eq" x="28" y="66" width="44" height="90" rx="20"/><text class="t-l" x="50" y="115" text-anchor="middle">R-001</text>
  <path class="air" d="M72,92 H118"/><text class="t-l" x="122" y="96">IA</text>
  <g id="ov-comp"><circle class="eq" cx="50" cy="212" r="22"/><path class="sym" d="M33,201 L67,207 M33,223 L67,217"/></g>
  <text class="t-e" x="50" y="254" text-anchor="middle">C-001</text>${ai('comp', 84, 196)}
  <text class="t-l" x="138" y="33">Supply</text>
  <path class="pipe" d="M138,44 H245 V62"/><path class="flowp" id="ov-fl1" d="M138,44 H245 V62"/>
  ${valve('v101', 195, 44)}<text class="t-e" x="195" y="70" text-anchor="middle">V-101</text>${ai('v101', 222, 28)}
  <path class="tkin" d="${TANK}"/>
  <rect class="liq" id="ov-liq" x="218" y="236" width="94" height="0" clip-path="url(#tkc)"/>
  <path class="sym" d="${TANK}" style="stroke-width:2"/>
  <path class="lim" d="M212,97 H226"/><text class="t-l" x="209" y="101" text-anchor="end">H</text>
  <path class="sym" d="M285,57 V200"/><path id="ov-blade" class="blade" d="M270,200 H300"/>
  <g id="ov-mix"><circle class="eq" cx="285" cy="46" r="11"/><text class="mt" x="285" y="50" text-anchor="middle">M</text></g><text class="t-e" x="301" y="36">M-101</text>
  <text class="t-e" x="214" y="232" text-anchor="end">T-101</text>
  <path class="sym" d="M310,76 H318"/><circle class="eq" cx="330" cy="76" r="12"/><text class="t-l" x="330" y="80" text-anchor="middle">LS</text><text class="t-e" id="ov-hh" x="348" y="80">OK</text>
  <path class="sym" d="M310,156 H317"/><circle class="eq" cx="330" cy="156" r="13"/><text class="t-l" x="330" y="160" text-anchor="middle">LT</text>
  ${vb('lvl', 322, 105, 80, '%', 'Tank1_Level')}${ai('tank', 411, 117)}
  <path class="pipe" d="M265,236 V250 H398"/><path class="flowp" id="ov-fl2" d="M265,236 V250 H398"/>
  ${valve('v102', 350, 250)}<text class="t-e" x="350" y="272" text-anchor="middle">V-102</text>${ai('v102', 326, 232)}
  <path class="pipe" d="M420,218 V40"/><path class="flowp" id="ov-fl4" d="M420,218 V40"/>
  <g id="ov-pump"><circle class="eq" cx="420" cy="240" r="22"/><path class="sym" d="M409,228 L435,240 L409,252 Z"/></g>
  <text class="t-e" x="448" y="266">P-101</text>${ai('pump', 393, 210)}
  ${vb('prs', 426, 75, 78, 'bar', 'Line_Pressure')}
  ${vb('cur', 426, 133, 78, 'A', 'Pump1_Current')}
  ${vb('spd', 426, 180, 78, 'rpm', 'Pump1_Speed')}`; }
function grpB(){ return `
  <g clip-path="url(#bclip)" id="ov-btl"></g>
  <path id="ov-stream" class="stream" d="M200,150 V170"/>
  <rect class="eq" id="ov-fil" x="172" y="88" width="56" height="48" rx="4"/><text class="t-e" x="200" y="117" text-anchor="middle">FL-1</text><path class="eq" d="M192,136 H208 L203,150 H197 Z"/>
  ${vb('fvol', 60, 101, 92, 'L', 'Fill_Volume')}${ai('fil', 242, 96)}
  <rect class="eq" id="ov-chuck" x="337" y="132" width="14" height="10"/>
  <rect class="eq" x="320" y="92" width="48" height="42" rx="4"/><text class="t-e" x="344" y="118" text-anchor="middle">CP-1</text>${ai('cap', 381, 99)}
  <rect class="eq" x="434" y="160" width="12" height="14" rx="2"/><path class="beam" d="M440,174 V204"/>
  ${vb('cnt', 400, 121, 112, '', 'Bottle_Count')}
  <rect class="eq" x="6" y="206" width="508" height="12" rx="6"/><path id="ov-belt" class="belt" d="M12,206 H508"/>
  <g id="ov-cv"><circle class="eq" cx="40" cy="244" r="12"/><text class="mt" x="40" y="248" text-anchor="middle">M</text></g><text class="t-e" x="58" y="248">CV-1</text>${ai('cv', 104, 244)}
  <text class="t-e" id="ov-line" x="512" y="248" text-anchor="end">L1 · RUN</text><text class="t-l" id="ov-rec" x="512" y="266" text-anchor="end"></text>`; }
const OV = {};
const BDIM = {1:[22, 54], 0.5:[18, 44], 0.25:[14, 34]};
function bpath(w, h){ const n = w * 0.42; return `M${-w / 2},0 V${-0.6 * h} Q${-w / 2},${-0.74 * h} ${-n / 2},${-0.8 * h} V${-h} H${n / 2} V${-0.8 * h} Q${w / 2},${-0.74 * h} ${w / 2},${-0.6 * h} V0 Z`; }
function ovBuild(force){
  const narrow = (rtSvg.clientWidth || rt.clientWidth || 360) < 640;
  if (!force && OV.svg && OV.narrow === narrow) return;
  OV.narrow = narrow;
  const W = narrow ? 520 : 1040, H = narrow ? 552 : 276, bx = narrow ? 0 : 520, by = narrow ? 278 : 0;
  const link = narrow ? `M420,40 H517 V${by + 20} H200 V${by + 88}` : `M420,40 H${bx + 200} V88`;
  rtSvg.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="شاشة نظرة عامة على خط التعبئة: الضاغط والخزان والمضخة والسير الناقل وآلتا التعبئة والإغلاق">
    <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--hmi-val)"/><path d="M0,0 V6" stroke="var(--hmi-eqs)" stroke-width="1.4"/></pattern>
    <clipPath id="tkc"><path d="${TANK}"/></clipPath><clipPath id="bclip"><rect x="0" y="0" width="520" height="276"/></clipPath></defs>
    <path class="pipe" d="${link}"/><path class="flowp" id="ov-fl3" d="${link}"/>
    <g>${grpA()}</g><g transform="translate(${bx},${by})">${grpB()}</g>
    <g id="ov-nc" style="display:none"><rect x="${W / 2 - 120}" y="${H / 2 - 22}" width="240" height="44" rx="6" fill="var(--hmi-val)" stroke="var(--bad)" stroke-width="2"/><text class="nc-lab" x="${W / 2}" y="${H / 2 + 6}" text-anchor="middle">لا اتصال بالـ PLC</text></g></svg>`;
  OV.svg = $('svg', rtSvg);
  const q = id => $('#ov-' + id, rtSvg);
  ['liq', 'blade', 'mix', 'comp', 'pump', 'v101', 'v102', 'fl1', 'fl2', 'fl3', 'fl4', 'hh', 'stream', 'chuck', 'belt', 'cv', 'line', 'rec', 'btl', 'nc', 'fil'].forEach(k => OV[k] = q(k));
  OV.vb = {}; ['air', 'lvl', 'prs', 'cur', 'spd', 'fvol', 'cnt'].forEach(k => { const g = q('vb-' + k); OV.vb[k] = {g, t:$('.vbt', g)}; });
  OV.ai = {}; ['air', 'comp', 'v101', 'tank', 'v102', 'pump', 'fil', 'cap', 'cv'].forEach(k => { OV.ai[k] = {g:q('ai-' + k), last:''}; });
  OV.bt = [];
  for (let i = 0; i < 13; i++){
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = '<path class="bt-f"/><rect class="liq"/><path class="bt-o"/><rect class="bt-c" height="5" rx="1"/>';
    OV.btl.appendChild(g); OV.bt.push({g, f:g.children[0], l:g.children[1], o:g.children[2], c:g.children[3], cap:0});
  }
}
const EQA = {air:['air_l', 'air_ll'], comp:['c1trip', 'dryer'], v101:['v101'], tank:['lvl_h'], v102:['v102'], pump:['pump_nd'], fil:['fv1', 'fv2', 'fv3', 'fv4', 'fv5', 'fv6', 'filler_stop', 'fillerbowl', 'door'], cap:['capper_stop', 'capchuck', 'capfeed', 'vacuum'], cv:['conv_stop', 'jam', 'lub', 'accum']};
const tog = (el, c, on) => { if (el) el.classList.toggle(c, !!on); };
function ovUpdate(){
  if (!OV.svg) return;
  const lost = hmiLost();
  const set = (k, r) => { const e = OV.vb[k]; if (e.t.textContent !== r.s) e.t.textContent = r.s; tog(e.g, 'nc', !r.ok); };
  const rl = hmiRead('Tank1_Level');
  set('air', hmiRead('Air_Pressure')); set('lvl', rl); set('prs', hmiRead('Line_Pressure')); set('cur', hmiRead('Pump1_Current')); set('spd', hmiRead('Pump1_Speed')); set('cnt', hmiRead('Bottle_Count'));
  set('fvol', lost ? {s:'####', ok:false} : {s:fmt(M.rec.vol, 3), ok:true});
  tog(OV.vb.lvl.g, 'al', ADM.lvl_h.act && !lost);
  const frac = rl.ok && isFinite(rl.v) ? clamp(rl.v / 100, 0, 1) : 0;
  OV.liq.setAttribute('y', 236 - frac * 174); OV.liq.setAttribute('height', frac * 174 + 2); OV.liq.style.opacity = rl.ok ? 1 : .25;
  ['mix', 'comp', 'pump', 'v101', 'v102', 'cv'].forEach(k => tog(OV[k], 'unk', lost));
  tog(OV.mix, 'on', !lost && M.mix.run); tog(OV.comp, 'on', !lost && M.comp.run); tog(OV.pump, 'on', !lost && M.pump.run);
  tog(OV.v101, 'on', !lost && M.inlet); tog(OV.v102, 'on', !lost && M.pump.run); tog(OV.cv, 'on', !lost && M.line);
  const ca = Math.cos(M.mix.a) * 15; OV.blade.setAttribute('d', `M${285 - ca},200 H${285 + ca}`);
  OV.fl1.style.display = !lost && M.inlet ? '' : 'none';
  const fl = !lost && M.pump.run && M.pump.spd > 300; OV.fl2.style.display = OV.fl3.style.display = OV.fl4.style.display = fl ? '' : 'none';
  const hh = M.lvl > 95; OV.hh.textContent = lost ? '—' : hh ? 'HH' : 'OK';
  OV.nc.style.display = lost ? '' : 'none';
  OV.line.textContent = lost ? 'L1 · ----' : M.line ? 'L1 · RUN' : M.trip ? 'L1 · TRIP' : 'L1 · STOP';
  OV.rec.textContent = 'Recipe: ' + M.rec.name;
  OV.belt.style.strokeDashoffset = -M.belt;
  /* bottles */
  if (!lost){
    const C = M.conv, e = C.ph === 'move' && M.line ? (1 - Math.cos(Math.PI * C.p)) / 2 : 0;
    OV.bt.forEach((o, i) => {
      const b = M.btl[i];
      if (!b){ o.g.style.display = 'none'; return; }
      o.g.style.display = '';
      const [w, h] = BDIM[b.cap];
      if (o.cap !== b.cap){ o.cap = b.cap; const d = bpath(w, h); o.f.setAttribute('d', d); o.o.setAttribute('d', d); o.l.setAttribute('x', -w / 2 + 1.5); o.l.setAttribute('width', w - 3); o.c.setAttribute('x', -w * 0.25); o.c.setAttribute('width', w * 0.5); o.c.setAttribute('y', -h - 4); }
      const x = 8 + (b.s + e) * 48, lh = clamp(b.fill / b.cap, 0, 1) * 0.58 * h;
      o.g.setAttribute('transform', `translate(${x.toFixed(1)},206)`);
      o.l.setAttribute('y', -lh - 1); o.l.setAttribute('height', lh);
      o.c.style.display = b.capped ? '' : 'none';
    });
    const f = M.btl.find(b => b.s === 4);
    if (M.filling && f && M.conv.ph === 'dwell'){ const h = BDIM[f.cap][1]; OV.stream.setAttribute('d', `M200,150 V${206 - clamp(f.fill / f.cap, 0, 1) * 0.58 * h - 1}`); OV.stream.style.display = ''; } else OV.stream.style.display = 'none';
    const c = M.btl.find(b => b.s === 7), capping = M.line && M.conv.ph === 'dwell' && c && !c.capped;
    OV.chuck.setAttribute('height', capping ? 10 + Math.min(8, c.capT * 30) : 10);
  } else OV.stream.style.display = 'none';
  /* alarm indicators next to the equipment */
  const vis = visibleAlarms();
  for (const k in OV.ai){
    let best = null; if (!lost) for (const a of vis) if (EQA[k].includes(a.id) && !a.went && (!best || a.p < best.p || (a.p === best.p && !a.ack && best.ack))) best = a;
    const key = best ? best.p + (best.ack ? 'a' : 'u') : '';
    if (OV.ai[k].last !== key){ OV.ai[k].last = key; OV.ai[k].g.innerHTML = best ? shp(best.p, !best.ack) : ''; }
  }
}
/* the alarm banner and the status line */
let banKey = '';
function visibleAlarms(){ const c = cfgNow(); return c.acFilter ? AL.list.filter(a => c.acFilter.includes(a.cls)) : AL.list; }
function rtUpdate(){
  $('#rtClk').textContent = hms(Date.now());
  $('#rtUser').textContent = USER.u + ' · ' + USER.r;
  const un = visibleAlarms().filter(a => !a.ack), last = un.reduce((m, a) => !m || a.came > m.came ? a : m, null);
  const key = un.length + '|' + (last ? last.k : '');
  if (key !== banKey){
    banKey = key;
    $('#rtBan').innerHTML = last ? `${shpSvg(last.p, true)}<time>${hms(last.came)}</time><span class="tx">${esc(last.txt)}</span><span class="n">${un.length}</span>` : `<span class="tx" style="opacity:.75">لا توجد إنذارات غير مؤكدة</span><span class="n z">0</span>`;
  }
  const lost = hmiLost();
  $('#rtSt').innerHTML = `<span>اتصال الـ PLC: <b class="${lost ? 'al' : ''}">${lost ? 'لا اتصال' : 'متصل ' + L('S7-1500 · 192.168.0.1')}</b></span><span>الخط: <b class="${M.trip ? 'al' : ''}">${M.line ? 'يعمل' : M.trip ? 'متوقف بسبب عطل' : 'متوقف'}</b></span><span>الوصفة في الـ PLC: <b>${L(M.rec.name + ' · ' + fmt(M.rec.vol, 3) + ' L')}</b></span><span>الخادم: <b class="${M.srvA ? '' : 'al'}">${M.srvA ? 'SRV-A' : (ARCH.ok ? 'SRV-B' : 'غير متاح')}</b></span>`;
}
const ARCH = {ok:false};

/* =====================================================================
   5. tabs
   ===================================================================== */
const tabsEl = $('#tabs'), panes = $('#panes'), G = {}, BUILD = {}, TICK = {};
let DEMO = 0;
TABS.forEach(tb => {
  const b = document.createElement('button'); b.className = 'btn' + (IL.has(tb.l, 'sim') ? ' done' : ''); b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = tb.t; b.dataset.id = tb.id;
  b.addEventListener('click', () => show(tb.id)); tabsEl.appendChild(b);
  const p = document.createElement('section'); p.className = 'pane'; p.id = 'p-' + tb.id; p.setAttribute('role', 'tabpanel');
  p.innerHTML = `<h2 style="margin:0 0 8px">${esc(tb.h)}</h2><div class="goal${IL.has(tb.l, 'sim') ? ' ok' : ''}" id="g-${tb.id}"><b class="k">${IL.has(tb.l, 'sim') ? '✓ أُنجز' : 'المطلوب'}</b>${esc(tb.goal)}</div><div class="body"></div>`;
  panes.appendChild(p); G[tb.id] = tb;
});
function show(id){
  if (!G[id]) id = 'tags';
  CUR = id;
  $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + id));
  $$('#tabs .btn').forEach(b => b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false'));
  if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  if (!G[id].built){ G[id].built = true; BUILD[id]($('#p-' + id + ' .body')); }
  if (G[id].onShow) G[id].onShow();
  banKey = '';
}
function win(id, msg){
  if (DEMO) return false;
  const tb = G[id]; if (tb.won) return false; tb.won = true; IL.mark(tb.l, 'sim');
  const g = $('#g-' + id); g.classList.add('ok'); g.innerHTML = `<b class="k">✓ أُنجز</b>${esc(msg || tb.goal)}`;
  $(`#tabs .btn[data-id="${id}"]`).classList.add('done');
  return true;
}
/* «▶ شاهد الحل»: plays the solution on the real controls, then puts the exercise back so the learner does it */
function demo(host, id, run, reset){
  const b = $('.demo-b', host), pane = $('#p-' + id);
  b.addEventListener('click', async () => {
    if (DEMO) return;
    DEMO++; b.disabled = true; pane.classList.add('demoing');
    try { await run(); await sleep(2200); }
    catch (e){ console.warn(e); }
    finally { if (reset) reset(); DEMO--; b.disabled = false; pane.classList.remove('demoing'); const m = $('.demo-m', host); if (m){ m.textContent = 'انتهى العرض وأُعيد التمرين إلى بدايته: نفّذه الآن بنفسك ليُحتسب.'; m.className = 'msg demo-m'; } }
  });
}
async function dClick(el, ms){ if (!el) return; el.classList.add('dhl'); if (el.scrollIntoView) el.scrollIntoView({block:'nearest', behavior:'smooth'}); await sleep(ms || 650); el.classList.remove('dhl'); el.click(); await sleep(350); }
async function dSet(el, v, ms){ if (!el) return; el.classList.add('dhl'); if (el.scrollIntoView) el.scrollIntoView({block:'nearest', behavior:'smooth'}); await sleep(ms || 450);
  if (el.type === 'checkbox') el.checked = v; else if (el.tagName === 'INPUT' && el.type !== 'number' && typeof v === 'string' && v.length > 1){ el.value = ''; for (const ch of v){ el.value += ch; await sleep(45); } } else el.value = v;
  el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); await sleep(250); el.classList.remove('dhl'); }
const DEMO_BTN = '<button type="button" class="btn demo-b keep">▶ شاهد الحل</button>';
const DEMO_MSG = '<p class="msg demo-m keep" aria-live="polite"></p>';

/* =====================================================================
   TAB 1 · tags: connection + tag table vs the PLC watch table
   ===================================================================== */
const tagErr = (n, tc) => {
  if (n === 'Tank1_Level'){
    if (!tc.sc) return 'Tank1_Level قيمة خام من 0 إلى 27648: فعّل التحويل الخطي إلى 0–100 %.';
    if (+tc.plo !== 0 || +tc.phi !== 27648 || +tc.hlo !== 0 || +tc.hhi !== 100) return 'حدود التحويل: الـ PLC من 0 إلى 27648، والـ HMI من 0 إلى 100.';
    if (tc.type !== 'Real') return `نوع البيانات ${tc.type} يقطع الكسور: اختر Real لـ Tank1_Level.`;
    return '';
  }
  const pt = PLC[n].type;
  if (tc.sc) return `${n} لا يحتاج تحويلًا خطيًا: ألغِ التحويل.`;
  if (pt === 'Real'){ if (tc.type === 'Bool') return `${n}: النوع Bool يعرض 0 أو 1 فقط، اختر Real.`; if (tc.type !== 'Real') return `${n}: نوع البيانات ${tc.type} يقطع الكسور، اختر Real.`; }
  if (pt === 'DInt'){ if (tc.type === 'Int') return `${n}: النوع Int يفيض بعد 32767، اختر DInt مثل الـ PLC.`; if (tc.type !== 'DInt') return `${n}: العدّاد عدد صحيح من النوع DInt في الـ PLC، اختر DInt.`; }
  if (pt === 'Int' && tc.type !== 'Int' && tc.type !== 'DInt') return `${n} من النوع Int في الـ PLC: اختر Int.`;
  return '';
};
function connErr(e){
  const plc = ip2n(e.plc), hm = ip2n(e.hmi), m = ip2n(e.mask);
  if (plc === null || e.plc.trim() !== '192.168.0.1') return 'عنوان الـ PLC هو 192.168.0.1 كما في TIA Portal وعلى ملصق اللوحة.';
  if (m === null || e.mask.trim() !== '255.255.255.0') return 'قناع الشبكة الفرعية في شبكة الآلات هو 255.255.255.0.';
  if (hm === null) return 'عنوان محطة الـ HMI غير صالح.';
  if ((hm & 0xFFFFFF00) !== (plc & 0xFFFFFF00)) return `العنوان ${e.hmi.trim()} في شبكة فرعية أخرى: اختر عنوانًا من 192.168.0.x.`;
  const h = hm & 255;
  if (h === 1) return 'العنوان 192.168.0.1 للـ PLC نفسه: اختر عنوانًا غير مستخدم.';
  if (h === 0 || h === 255) return 'هذا عنوان الشبكة أو عنوان البث: اختر عنوانًا لجهاز.';
  if (e.ap === 'plcsim') return 'نقطة الوصول PLCSIM تتصل بالمحاكي لا بالـ PLC الحقيقي: اختر بطاقة Ethernet الموصولة بشبكة الآلات.';
  if (e.ap === 'wifi') return 'بطاقة Wi‑Fi ليست على شبكة الآلات: اختر بطاقة Ethernet.';
  return '';
}
const clone = o => JSON.parse(JSON.stringify(o));
function tagTable(tags, id, opt){
  opt = opt || {};
  return `<div class="tblw"><table class="tbl hm" id="${id}"><thead><tr><th>Name</th><th>PLC tag</th><th>Data type</th><th>Acquisition cycle</th>${opt.noSc ? '' : '<th>Linear scaling</th>'}${opt.access ? '<th>Access</th>' : ''}</tr></thead><tbody>${TAGN.map(n => { const t = tags[n]; return `<tr data-n="${n}"><td><b>${n}</b></td><td>${esc(opt.access && t.abs ? t.absAddr : PLC[n].addr)}</td>
    <td><select data-f="type" aria-label="Data type ${n}">${['Bool', 'Int', 'DInt', 'Real'].map(x => `<option${x === t.type ? ' selected' : ''}>${x}</option>`).join('')}</select></td>
    <td><select data-f="cyc" aria-label="Acquisition cycle ${n}">${Object.keys(CYC).map(x => `<option${x === t.cyc ? ' selected' : ''}>${x}</option>`).join('')}</select></td>
    ${opt.noSc ? '' : `<td><div class="sc-r"><input type="checkbox" data-f="sc"${t.sc ? ' checked' : ''} aria-label="Linear scaling ${n}"><span class="scv"${t.sc ? '' : ' hidden'}><small>PLC</small> <input type="number" data-f="plo" value="${t.plo}"> <input type="number" data-f="phi" value="${t.phi}"> <small>→ HMI</small> <input type="number" data-f="hlo" value="${t.hlo}"> <input type="number" data-f="hhi" value="${t.hhi}"></span></div></td>`}
    ${opt.access ? `<td>${t.abs ? 'absolute' : 'symbolic'}</td>` : ''}</tr>`; }).join('')}</tbody></table></div>`;
}
function bindTagTable(tbl, getTags, onChange){
  tbl.addEventListener('change', e => {
    const el = e.target, tr = el.closest('tr[data-n]'); if (!tr) return;
    const t = getTags()[tr.dataset.n], f = el.dataset.f;
    if (f === 'sc'){ t.sc = el.checked; $('.scv', tr).hidden = !el.checked; }
    else if (f === 'type' || f === 'cyc') t[f] = el.value;
    else t[f] = IL.num(el.value);
    if (onChange) onChange(tr.dataset.n, f);
  });
}

BUILD.tags = host => {
  const T = {};
  const errTags = () => { const t = refTags(); t.Tank1_Level.type = 'Int'; t.Tank1_Level.sc = false; t.Line_Pressure.type = 'Int'; t.Bottle_Count.type = 'Int'; return t; };
  function init(){ T.ed = {plc:'192.168.0.1', hmi:'192.168.1.50', mask:'255.255.255.0', ap:'plcsim', tags:errTags()}; SCN.tags = {conn:false, tags:errTags(), fields:refFields()}; }
  init();
  const FP = ['Tank1_Level', 'Line_Pressure', 'Bottle_Count', 'Pump1_Speed'];
  host.innerHTML = `<div class="panel"><p>حُمِّل مشروع جديد إلى محطة التشغيل فصارت كل الحقول في الشاشة أعلاه <b>####</b> و«لا اتصال». أصلح الاتصال أولًا، ثم قارن قيم الشاشة بجدول المراقبة (Watch table) في TIA Portal وأصلح جدول الوسوم، ثم اضغط Download.</p></div>
  <div class="grid2">
    <div class="dev"><h3>Connections › HMI_Connection_1</h3>
      <label>Communication driver <span class="mono ltr">SIMATIC S7 1500</span></label>
      <label>PLC address <input id="tg-plc" class="inp" value="" inputmode="decimal"></label>
      <label>HMI station IP <input id="tg-hmi" class="inp" value="" inputmode="decimal"></label>
      <label>Subnet mask <input id="tg-mask" class="inp" value="" inputmode="decimal"></label>
      <label>Access point <select id="tg-ap"><option value="plcsim">S7ONLINE → PLCSIM</option><option value="eth">S7ONLINE → Intel(R) Ethernet I219 (TCP/IP)</option><option value="wifi">S7ONLINE → Wi‑Fi (TCP/IP.Auto)</option></select></label>
      <div class="row"><button type="button" class="btn" id="tg-test">اختبار الاتصال (ping)</button></div>
      <div class="log" id="tg-log" aria-live="polite"><span class="dim">جاهز.</span></div>
    </div>
    <div class="dev"><h3>TIA Portal › Watch table_1 (online)</h3>
      <div class="tblw"><table class="tbl hm"><thead><tr><th>Name</th><th>Address</th><th>Display format</th><th>Monitor value</th></tr></thead><tbody id="tg-watch"></tbody></table></div>
      <p class="note" id="tg-wn" style="margin-top:6px"></p>
    </div>
  </div>
  <div class="panel"><h3 style="margin:0 0 8px">HMI tags › Default tag table</h3>${tagTable(T.ed.tags, 'tg-tt')}
    <div class="row" style="margin-top:10px"><button type="button" class="btn pri" id="tg-dl">Download (تحميل إلى Runtime)</button>${DEMO_BTN}</div>
    <p class="msg" id="tg-msg" aria-live="polite"></p>${DEMO_MSG}
  </div>
  <div class="panel"><h3 style="margin:0 0 8px">Faceplate: قيم الشاشة مقابل الـ PLC</h3><div class="tblw"><table class="tbl hm"><thead><tr><th>Tag</th><th>HMI (الشاشة)</th><th>PLC (القيمة الهندسية)</th><th class="ar">الحالة</th></tr></thead><tbody id="tg-fp"></tbody></table></div></div>`;
  const $i = id => $('#' + id, host), log = $i('tg-log'), msg = $i('tg-msg');
  function fill(){ $i('tg-plc').value = T.ed.plc; $i('tg-hmi').value = T.ed.hmi; $i('tg-mask').value = T.ed.mask; $i('tg-ap').value = T.ed.ap; }
  fill();
  [['tg-plc', 'plc'], ['tg-hmi', 'hmi'], ['tg-mask', 'mask'], ['tg-ap', 'ap']].forEach(([id, k]) => { $i(id).addEventListener('input', e => T.ed[k] = e.target.value); $i(id).addEventListener('change', e => T.ed[k] = e.target.value); });
  bindTagTable($i('tg-tt'), () => T.ed.tags);
  $i('tg-test').addEventListener('click', () => {
    const e = T.ed, err = connErr(e), apn = $i('tg-ap').selectedOptions[0].textContent;
    logTo(log, `> ping ${esc(e.plc)}  (from ${esc(e.hmi)} via ${esc(apn)})`, 'dim');
    if (!err){ logTo(log, `Reply from ${esc(e.plc)}: bytes=32 time&lt;1ms TTL=30`, 'ok'); logTo(log, 'S7 connection: established ✓. اضغط Download لتطبيق الإعدادات على Runtime.', 'ok'); }
    else if (e.ap === 'plcsim') logTo(log, 'PLCSIM: لا توجد محاكاة قيد التشغيل. ' + esc(err), 'bad');
    else logTo(log, 'Request timed out. ' + esc(err), 'bad');
  });
  function check(){ const ok = SCN.tags.conn && TAGN.every(n => !tagErr(n, SCN.tags.tags[n])); return ok; }
  $i('tg-dl').addEventListener('click', () => {
    SCN.tags = {conn:!connErr(T.ed), tags:clone(T.ed.tags), fields:refFields()};
    const ce = connErr(T.ed), te = TAGN.map(n => tagErr(n, T.ed.tags[n])).find(Boolean);
    logTo(log, 'Download to device: Runtime updated.', 'dim');
    if (ce){ msg.className = 'msg bad'; msg.textContent = 'حُمِّل المشروع، لكن الاتصال ما زال مقطوعًا: ' + ce; return; }
    if (te){ msg.className = 'msg bad'; msg.textContent = 'الاتصال يعمل ✓ لكن: ' + te; return; }
    msg.className = 'msg ok'; msg.textContent = 'الاتصال يعمل وكل القيم في الشاشة تطابق جدول المراقبة ✓';
    if (check()) win('tags', 'الاتصال سليم، والمستوى محوّل خطيًا إلى %، والضغط Real، والعدّاد DInt: الشاشة تطابق الـ PLC ✓');
  });
  TICK.tags = () => {
    const w = $i('tg-watch'); const raw = PLC.Tank1_Level.get();
    w.innerHTML = `<tr><td>Tank1_Level_Raw</td><td>%IW64</td><td>DEC</td><td><b>${raw}</b></td></tr><tr><td>Line_Pressure</td><td>"DB_Line".Line_Pressure</td><td>Floating-point</td><td><b>${fmt(M.press, 3)}</b></td></tr><tr><td>Bottle_Count</td><td>"DB_Line".Bottle_Count</td><td>DEC+/-</td><td><b>${M.count}</b></td></tr><tr><td>Pump1_Speed</td><td>"DB_Line".Pump1_Speed</td><td>DEC</td><td><b>${Math.round(M.pump.spd)}</b></td></tr>`;
    $i('tg-wn').innerHTML = `القيمة الخام للمستوى: ${L(raw + ' ÷ 27648 × 100 = ' + fmt(raw / 276.48, 1) + ' %')}`;
    const eng = {Tank1_Level:fmt(raw / 276.48, 1) + ' %', Line_Pressure:fmt(M.press, 2) + ' bar', Bottle_Count:String(M.count), Pump1_Speed:Math.round(M.pump.spd) + ' rpm'};
    const u = {Tank1_Level:' %', Line_Pressure:' bar', Bottle_Count:'', Pump1_Speed:' rpm'};
    $i('tg-fp').innerHTML = FP.map(n => { const r = hmiRead(n, SCN.tags), ok = SCN.tags.conn && !tagErr(n, SCN.tags.tags[n]); return `<tr><td>${n}</td><td><b>${esc(r.s)}${r.ok ? u[n] : ''}</b></td><td>${eng[n]}</td><td class="ar ${ok ? 'ok' : 'bad'}">${ok ? '✓ مطابق' : SCN.tags.conn ? '✗ غير مطابق' : '✗ لا اتصال'}</td></tr>`; }).join('');
  };
  demo(host, 'tags', async () => {
    msg.textContent = ''; logTo(log, 'العرض: عنوان المحطة في شبكة الـ PLC، ونقطة الوصول بطاقة Ethernet.', 'dim');
    await dSet($i('tg-hmi'), '192.168.0.50'); await dSet($i('tg-ap'), 'eth'); await dClick($i('tg-test'));
    const row = n => $(`#tg-tt tr[data-n="${n}"]`, host);
    logTo(log, 'العرض: المستوى خام 0–27648 → تحويل خطي إلى 0–100 % ونوع Real.', 'dim');
    await dSet($('[data-f=type]', row('Tank1_Level')), 'Real'); await dSet($('[data-f=sc]', row('Tank1_Level')), true);
    logTo(log, 'العرض: الضغط Real في الـ PLC، والعدّاد DInt.', 'dim');
    await dSet($('[data-f=type]', row('Line_Pressure')), 'Real'); await dSet($('[data-f=type]', row('Bottle_Count')), 'DInt');
    await dClick($i('tg-dl')); await sleep(2500);
  }, () => {
    init(); fill(); $('#tg-tt', host).closest('.tblw').outerHTML = tagTable(T.ed.tags, 'tg-tt'); bindTagTable($i('tg-tt'), () => T.ed.tags);
    log.innerHTML = '<span class="dim">جاهز.</span>'; msg.textContent = '';
  });
};

/* =====================================================================
   TAB 2 · alarms: flood, first-out, ack, shelve, chattering alarm, ISA-18.2 rate
   ===================================================================== */
BUILD.alarms = host => {
  /* the batch tank is held at 80 % while the H alarm sits at 80 % with no deadband → it chatters */
  M.lo = 79.4; M.hi = 80.6; if (M.lvl < 79 || M.lvl > 81) M.lvl = 79.6;
  const S = {sort:'new', cls:'all', un:false, page:0, sel:null, ver:-1, key:''};
  const PS = 8;
  host.innerHTML = `<div class="panel"><p>الخزان T-101 يُحفظ عند نحو 80 % لدفعة الإنتاج، وإنذار المستوى المرتفع مضبوط على 80 % <b>بلا نطاق ميت</b>، فهو يظهر ويختفي كل بضع ثوانٍ. اضغط «افصل الضاغط» لتعيش فيضان إنذارات حقيقيًا ينتج عن انهيار ضغط الهواء.</p>
    <div class="row" style="margin-top:8px"><button type="button" class="btn pri" id="al-trip">⚡ افصل الضاغط C-001</button><button type="button" class="btn" id="al-reset">↺ أعد ضبط الضاغط وشغّل الخط</button>${DEMO_BTN}</div>${DEMO_MSG}</div>
  <div class="grid2">
    <div class="dev meter"><h3>معدل الإنذارات وفق ISA-18.2</h3><div><span class="big" id="al-rate">0</span> إنذار في آخر 10 دقائق</div>
      <div class="bar2" aria-hidden="true"><i class="z1"></i><i class="z2"></i><i class="z3"></i><span class="nd" id="al-nd" style="left:0"></span></div><div class="lg"><span>0</span><span>1</span><span>10</span><span>20+</span></div>
      <p class="note" id="al-rm"></p></div>
    <div class="dev"><h3>خطوات التمرين</h3><ul class="chk" id="al-chk"></ul></div>
  </div>
  <div class="panel"><h3 style="margin:0 0 8px">Alarm Control</h3>
    <div class="ac-tool"><label>الترتيب <select class="inp" id="al-sort"><option value="new">الأحدث أولًا</option><option value="old">الأقدم أولًا</option><option value="prio">حسب الأولوية</option></select></label>
      <label>الفئة <select class="inp" id="al-cls"><option value="all">كل الفئات</option><option>Alarm</option><option>Warning</option><option>System</option></select></label>
      <label class="pill"><input type="checkbox" id="al-un"> غير المؤكدة فقط</label></div>
    <div class="tblw" style="margin-top:8px"><table class="tbl hm ac"><thead><tr><th class="ar">أول إنذار</th><th>Time</th><th>P</th><th>Class</th><th>State</th><th class="ar">النص</th></tr></thead><tbody id="al-tb"></tbody></table></div>
    <div class="row" style="justify-content:space-between;margin-top:6px"><div class="pager"><button type="button" class="btn" id="al-prev" aria-label="الصفحة السابقة">›</button><span id="al-pg"></span><button type="button" class="btn" id="al-next" aria-label="الصفحة التالية">‹</button></div><span class="note" id="al-cnt"></span></div>
    <div class="ac-tool" style="margin-top:8px"><button type="button" class="btn" id="al-ack">Acknowledge (تأكيد المحدد)</button><button type="button" class="btn" id="al-ackp">Ack page (تأكيد الصفحة)</button><button type="button" class="btn" id="al-first">هذا أول إنذار</button><button type="button" class="btn" id="al-shelve">Shelve (كتم مؤقت)</button></div>
    <div class="dev" id="al-shf" hidden style="margin-top:8px"><h3>Shelve: <span id="al-shn"></span></h3><div class="form-in">
      <label>السبب<select class="inp" id="al-shr"><option value="">— اختر —</option><option>إنذار متذبذب بانتظار تعديل إعداداته</option><option>المعدّة تحت الصيانة</option><option>حسّاس معطّل بانتظار الاستبدال</option></select></label>
      <label>المدة<select class="inp" id="al-shd"><option value="10">10 min</option><option value="30">30 min</option><option value="60" selected>1 h</option><option value="480">8 h</option></select></label>
      <button type="button" class="btn pri" id="al-sho">تأكيد الكتم</button><button type="button" class="btn" id="al-shx">إلغاء</button></div></div>
    <p class="msg" id="al-msg" aria-live="polite"></p>
    <div id="al-shl"></div>
  </div>
  <div class="panel"><h3 style="margin:0 0 8px">إعدادات الإنذار التناظري: ${L('Tank1_Level_H')}</h3>
    <div class="form-in"><label>Limit (%)<input class="inp" type="number" value="80" disabled style="width:6em"></label><label>Deadband (%)<input class="inp" type="number" id="al-db" value="0" min="0" max="10" step="0.5" style="width:6em"></label><label>On-delay (s)<input class="inp" type="number" id="al-on" value="0" min="0" max="60" step="1" style="width:6em"></label><button type="button" class="btn pri" id="al-ap">تطبيق</button></div>
    <p class="statline" id="al-ch" style="margin-top:8px"></p><p class="msg" id="al-am" aria-live="polite"></p></div>`;
  const $i = id => $('#' + id, host), msg = $i('al-msg');
  const say = (t, ok) => { msg.textContent = t; msg.className = 'msg ' + (ok ? 'ok' : 'bad'); };
  function rows(){
    let r = AL.list.slice(); if (S.cls !== 'all') r = r.filter(a => a.cls === S.cls); if (S.un) r = r.filter(a => !a.ack);
    if (S.sort === 'new') r.sort((a, b) => b.came - a.came); else if (S.sort === 'old') r.sort((a, b) => a.came - b.came); else r.sort((a, b) => a.p - b.p || b.came - a.came);
    return r;
  }
  function pageRows(){ const r = rows(), n = Math.max(1, Math.ceil(r.length / PS)); S.page = clamp(S.page, 0, n - 1); return {r, n, v:r.slice(S.page * PS, S.page * PS + PS)}; }
  function render(force){
    const key = AL.ver + '|' + S.sort + S.cls + S.un + S.page + S.sel + '|' + AL.firstK + '|' + Object.keys(AL.shelved).join();
    if (!force && key === S.key) return; S.key = key;
    const {r, n, v} = pageRows();
    $i('al-tb').innerHTML = v.length ? v.map(a => `<tr class="row-a${a.k === S.sel ? ' sel' : ''}${a.ack ? '' : ' un'}${a.went ? ' gone' : ''}" data-k="${a.k}" tabindex="0" aria-selected="${a.k === S.sel}"><td class="ar">${a.k === AL.firstK ? '<span class="fo">أول إنذار</span>' : ''}</td><td>${hmsm(a.came)}</td><td>${shpSvg(a.p, !a.ack)}</td><td>${a.cls}</td><td class="st">${aState(a)}</td><td class="tx">${esc(a.txt)}</td></tr>`).join('') : `<tr><td colspan="6" class="ar" style="text-align:center;color:var(--muted)">لا توجد إنذارات</td></tr>`;
    $i('al-pg').textContent = `صفحة ${S.page + 1} من ${n}`;
    $i('al-cnt').textContent = `${r.length} إنذار معروض · ${AL.list.filter(a => !a.ack).length} غير مؤكد`;
    const sh = Object.keys(AL.shelved);
    $i('al-shl').innerHTML = sh.length ? `<h4 style="margin:6px 0">الإنذارات المكتومة مؤقتًا</h4>` + sh.map(id => { const s = AL.shelved[id]; return `<div class="statline warn" style="margin-top:6px"><span>${L(id === 'lvl_h' ? 'Tank1_Level_H' : id)} · ${esc(s.reason)} · حتى ${L(hms(s.until))} · ظهر أثناء الكتم ${L(String(s.n))} مرة</span><button type="button" class="btn" data-unsh="${id}" style="min-height:36px">إلغاء الكتم</button></div>`; }).join('') : '';
  }
  const selA = () => AL.list.find(a => a.k === S.sel);
  IL.onAct($i('al-tb'), 'tr[data-k]', tr => { S.sel = +tr.dataset.k; render(); });
  $i('al-sort').addEventListener('change', e => { S.sort = e.target.value; S.page = 0; render(); });
  $i('al-cls').addEventListener('change', e => { S.cls = e.target.value; S.page = 0; render(); });
  $i('al-un').addEventListener('change', e => { S.un = e.target.checked; S.page = 0; render(); });
  $i('al-prev').addEventListener('click', () => { S.page--; render(); });
  $i('al-next').addEventListener('click', () => { S.page++; render(); });
  $i('al-trip').addEventListener('click', () => { if (M.comp.trip){ say('الضاغط مفصول بالفعل.'); return; } compTrip(); AL.flood = {t:Date.now()}; AL.firstOk = false; AL.firstK = null; say('فُصل الضاغط: راقب الإنذارات تتدفق خلال الثواني القادمة.', true); });
  $i('al-reset').addEventListener('click', () => { if (!M.comp.trip){ say('الضاغط يعمل.'); return; } compReset(); say('أُعيد ضبط الضاغط: سيعود الخط عندما يتجاوز ضغط الهواء 5.6 bar.', true); });
  $i('al-ack').addEventListener('click', () => { const a = selA(); if (!a){ say('اختر إنذارًا من الجدول أولًا.'); return; } if (a.ack){ say('هذا الإنذار مؤكد بالفعل.'); return; } aAck(a); say('أُكّد الإنذار.', true); render(); });
  $i('al-ackp').addEventListener('click', () => { const {v} = pageRows(); const u = v.filter(a => !a.ack); if (!u.length){ say('لا إنذارات غير مؤكدة في هذه الصفحة.'); return; } u.forEach(a => aAck(a)); say(`أُكّد ${u.length} إنذارًا في هذه الصفحة.`, true); render(); });
  $i('al-first').addEventListener('click', () => {
    const a = selA();
    if (!AL.flood){ say('لا يوجد فيضان بعد: افصل الضاغط أولًا.'); return; }
    if (!a){ say('اختر الإنذار الذي تراه أول إنذار ثم اضغط الزر.'); return; }
    if (a.id === 'c1trip' && a.came >= AL.flood.t - 100){ AL.firstOk = true; AL.firstK = a.k; say('صحيح: فصل الضاغط هو أول إنذار، وكل ما بعده نتائج له.', true); render(true); return; }
    if (a.id === 'lvl_h') say('هذا إنذار متذبذب سبق الحادثة وليس جزءًا منها.');
    else say('هذا إنذار تابع: رتّب من الأقدم وابحث عن أول إنذار بعد بدء الفيضان.');
  });
  $i('al-shelve').addEventListener('click', () => { const a = selA(); if (!a){ say('اختر الإنذار الذي تريد كتمه أولًا.'); return; } $i('al-shf').hidden = false; $i('al-shn').innerHTML = L(a.id === 'lvl_h' ? 'Tank1_Level_H' : a.id) + ' — ' + esc(a.txt); $i('al-shf').dataset.id = a.id; });
  $i('al-shx').addEventListener('click', () => { $i('al-shf').hidden = true; });
  $i('al-sho').addEventListener('click', () => {
    const id = $i('al-shf').dataset.id, r = $i('al-shr').value, d = +$i('al-shd').value;
    if (!r){ say('اختر سببًا للكتم: الكتم دون سبب ممنوع في إدارة الإنذارات.'); return; }
    AL.shelved[id] = {until:Date.now() + d * 60000, reason:r, n:0, by:USER.u};
    AL.list = AL.list.filter(a => a.id !== id); AL.ver++; S.sel = null; $i('al-shf').hidden = true;
    say(id === 'lvl_h' ? 'كُتم الإنذار المتذبذب مؤقتًا. الكتم لا يصلح السبب: عدّل إعداداته الآن.' : 'كُتم الإنذار. الكتم للإنذارات المتذبذبة أو المعدّات تحت الصيانة فقط.', true); render();
  });
  $i('al-shl').addEventListener('click', e => { const b = e.target.closest('[data-unsh]'); if (!b) return; delete AL.shelved[b.dataset.unsh]; AL.ver++; render(); });
  $i('al-ap').addEventListener('click', () => {
    const db = IL.num($i('al-db').value), on = IL.num($i('al-on').value), am = $i('al-am');
    if (!(db >= 0 && db <= 10) || !(on >= 0 && on <= 60)){ am.className = 'msg bad'; am.textContent = 'النطاق الميت بين 0 و 10 %، والتأخير بين 0 و 60 s.'; return; }
    LH.db = db; LH.on = on;
    if (db >= 2 || on >= 5){ am.className = 'msg ok'; am.textContent = `طُبّق: ${db >= 2 ? `لا يزول الإنذار إلا تحت ${fmt(80 - db, 1)} %` : ''}${db >= 2 && on >= 5 ? '، و' : ''}${on >= 5 ? `لا يظهر إلا إذا بقي المستوى فوق 80 % مدة ${on} s` : ''}. لن يتذبذب بعد الآن.`; }
    else { am.className = 'msg bad'; am.textContent = 'طُبّق، لكنه لا يكفي: نطاق ميت أقل من 2 % أو تأخير أقل من 5 s لا يوقف التذبذب.'; }
  });
  const chk = () => [
    ['حدّد أول إنذار في الفيضان (First-out)', AL.firstOk],
    ['أكّد كل الإنذارات بعد الفيضان: لا يبقى إنذار غير مؤكد', !!AL.flood && !AL.list.some(a => !a.ack)],
    ['اكتم Tank1_Level_H مؤقتًا مع سبب ومدة', !!AL.shelved.lvl_h],
    ['عالج السبب: نطاق ميت ≥ 2 % أو تأخير ظهور ≥ 5 s', LH.db >= 2 || LH.on >= 5]];
  let tk = 0;
  TICK.alarms = dt => {
    render(); tk += dt; if (tk < 0.25) return; tk = 0;
    const r = rate10(); $i('al-rate').textContent = r; $i('al-nd').style.left = `calc(${Math.min(r, 20) / 20 * 100}% - 2px)`;
    $i('al-rm').textContent = r <= 1 ? 'ضمن هدف ISA-18.2: نحو إنذار واحد كل 10 دقائق.' : r <= 2 ? 'مقبول: الحد الأعلى الذي يستطيع المشغّل متابعته.' : r <= 10 ? 'أعلى من الهدف: عبء كبير على المشغّل.' : 'فيضان إنذارات: أكثر من 10 إنذارات في 10 دقائق.';
    const c = chatter('lvl_h'), ch = $i('al-ch'), sh = !!AL.shelved.lvl_h;
    ch.className = 'statline ' + (LH.db >= 2 || LH.on >= 5 ? 'ok' : c >= 3 ? 'bad' : '');
    ch.innerHTML = `ظهر ${L('Tank1_Level_H')} <b>${c}</b> مرة في آخر دقيقة${sh ? ' (منها ما ظهر أثناء الكتم: لا يُعرض)' : ''} · المستوى المقاس الآن ${L(fmt(M.meas, 1) + ' %')} · ${LH.db >= 2 || LH.on >= 5 ? 'مستقر ✓' : c >= 3 ? 'متذبذب (Chattering)' : 'مراقبة…'}`;
    const items = chk(); $i('al-chk').innerHTML = items.map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${esc(t)}</li>`).join('');
    if (items.every(x => x[1])) win('alarms', 'حُدّد أول إنذار، وأُكّدت كل الإنذارات، وكُتم الإنذار المتذبذب وعولج سببه ✓');
  };
  G.alarms.onShow = () => { S.key = ''; };
  demo(host, 'alarms', async () => {
    const dm = $('.demo-m', host); dm.className = 'msg demo-m'; dm.textContent = 'العرض: نفصل الضاغط وننتظر حتى يكتمل الفيضان…';
    if (!M.comp.trip) await dClick($i('al-trip'));
    await sleep(10500);
    dm.textContent = 'العرض: نرتّب من الأقدم ونختار أول إنذار.';
    await dSet($i('al-sort'), 'old'); S.page = 0; render(true);
    const f = AL.list.filter(a => a.id === 'c1trip').pop();
    if (f){ S.sel = f.k; render(true); const tr = $(`tr[data-k="${f.k}"]`, host); if (tr){ tr.classList.add('dhl'); await sleep(900); tr.classList.remove('dhl'); } await dClick($i('al-first')); }
    dm.textContent = 'العرض: ننتظر ظهور الإنذار المتذبذب ثم نكتمه مؤقتًا بسبب ومدة.';
    for (let i = 0; i < 40 && !AL.list.some(a => a.id === 'lvl_h'); i++) await sleep(250);
    const lh = AL.list.filter(a => a.id === 'lvl_h').pop();
    if (lh){ S.sel = lh.k; await dSet($i('al-sort'), 'new'); S.page = 0; render(true); await sleep(600); await dClick($i('al-shelve')); await dSet($i('al-shr'), 'إنذار متذبذب بانتظار تعديل إعداداته'); await dClick($i('al-sho')); }
    dm.textContent = 'العرض: نعالج السبب بنطاق ميت 2 %.';
    await dSet($i('al-db'), '2'); await dClick($i('al-ap'));
    dm.textContent = 'العرض: نعرض غير المؤكدة فقط ونؤكدها صفحة صفحة.';
    await dSet($i('al-un'), true);
    for (let i = 0; i < 12 && AL.list.some(a => !a.ack); i++){ S.page = 0; render(true); await dClick($i('al-ackp'), 400); }
    await sleep(1500);
  }, () => {
    AL.list = []; AL.ver++; AL.flood = null; AL.firstOk = false; AL.firstK = null; AL.shelved = {}; LH.db = 0; LH.on = 0;
    if (M.comp.trip) compReset();
    Object.assign(S, {sort:'new', cls:'all', un:false, page:0, sel:null, key:''});
    $i('al-sort').value = 'new'; $i('al-cls').value = 'all'; $i('al-un').checked = false; $i('al-db').value = 0; $i('al-on').value = 0; $i('al-shr').value = ''; $i('al-shf').hidden = true;
    msg.textContent = ''; $i('al-am').textContent = '';
  });
};

/* =====================================================================
   TAB 3 · trend: last night's 12 h of history, find when LT-101 froze
   ===================================================================== */
function genTrend(){
  const N = 721, lv = [], pump = [], inlet = [], hh = [];
  let real = 47, inl = false, frozen = null, F = -1, seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let m = 0; m < N; m++){
    const pr = !(m >= 240 && m < 280) && m < 680;          /* break 22:00–22:40; at 05:20 the operator stops everything */
    let ms = frozen !== null ? frozen : clamp(real + (rnd() - .5) * 0.7, 0, 100);
    if (m >= 680) inl = false; else if (ms < 40) inl = true; else if (ms > 70) inl = false;
    if (frozen === null && m >= 455 && inl && real > 58 && real < 66){ frozen = Math.round(ms * 10) / 10; F = m; ms = frozen; }
    lv.push(ms); pump.push(pr ? 1 : 0); inlet.push(inl ? 1 : 0); hh.push(real >= 95 ? 1 : 0);
    real = clamp(real + (inl ? 1.1 : 0) - (pr ? 0.6 : 0), 0, 100);
  }
  return {lv, pump, inlet, hh, F};
}
const tLab = m => { const t = 18 * 60 + Math.round(m); return pad(Math.floor(t / 60) % 24) + ':' + pad(t % 60); };
BUILD.trend = host => {
  const D = genTrend(), F = D.F;
  const PENS = [{k:'lv', n:'Tank1_Level', col:'var(--liq)', an:true, on:true}, {k:'pump', n:'Pump1_Running', col:'var(--pen2)', on:true}, {k:'inlet', n:'Inlet_Valve', col:'var(--pen3)', on:true}, {k:'hh', n:'Level_Switch_HH', col:'var(--pen4)', on:true}];
  const V = {a:0, b:720, A:600, B:690, auto:false, cause:null};
  const CAUSES = [
    ['lt', 'تجمّد مرسل المستوى LT-101 على قيمة ثابتة، فبقي صمام الدخول مفتوحًا والخزان يمتلئ فعليًا.', ''],
    ['pump', 'توقفت المضخة P-101 فلم يُسحب السائل من الخزان.', 'المضخة كانت تعمل (Pump1_Running = 1) طوال الوقت حتى الفيضان.'],
    ['hh', 'تعطّل مفتاح المستوى العالي جدًا LSHH ولم يعمل.', 'المفتاح عمل فعلًا: Level_Switch_HH صار 1 بعد التجمّد بنحو ساعة، لكنه إنذار فقط دون إيقاف.'],
    ['valve', 'علق صمام الدخول V-101 مفتوحًا ميكانيكيًا رغم أمر الإغلاق.', 'أمر الصمام نفسه كان «مفتوح»: المتحكم رأى مستوى ثابتًا أقل من 70 % فلم يطلب الإغلاق.']];
  host.innerHTML = `<div class="panel"><p>في الليلة الماضية فاض الخزان T-101 وانسكب العصير على الأرض. افتح الترند التاريخي لآخر 12 ساعة (من ${L('18:00')} إلى ${L('06:00')}). كبّر واسحب للتحريك، واسحب المؤشرين ${L('A')} و ${L('B')} لقراءة القيم. ضع مؤشرًا عند <b>اللحظة التي تجمّد فيها مرسل المستوى</b>، ثم اختر السبب.</p></div>
  <div class="panel">
    <div class="ac-tool" style="margin-bottom:6px"><button type="button" class="btn" id="tr-zi">＋ تكبير</button><button type="button" class="btn" id="tr-zo">－ تصغير</button><button type="button" class="btn" id="tr-pl" aria-label="تحريك إلى الأقدم">‹ الأقدم</button><button type="button" class="btn" id="tr-pr" aria-label="تحريك إلى الأحدث">الأحدث ›</button><button type="button" class="btn" id="tr-all">⟲ 12 ساعة</button><label class="pill"><input type="checkbox" id="tr-auto"> Autoscale</label></div>
    <div class="pens" id="tr-pens">${PENS.map((p, i) => `<label><input type="checkbox" data-i="${i}" checked><i style="background:${p.col}"></i>${p.n}</label>`).join('')}</div>
    <div class="trend-w" style="margin-top:8px"><svg id="tr-svg" role="img" aria-label="ترند تاريخي لمستوى الخزان والمضخة والصمام ومفتاح المستوى العالي جدًا"></svg></div>
    <p class="note">اسحب المؤشر ${L('A')} (خط متصل) أو ${L('B')} (خط متقطع) من مقبضه، واسحب أي مكان آخر للتحريك. عجلة الفأرة تكبّر أيضًا.</p>
    <div class="tblw" style="margin-top:6px"><table class="tbl hm"><thead><tr><th>Pen</th><th id="tr-ha">A</th><th id="tr-hb">B</th><th>B − A</th></tr></thead><tbody id="tr-ro"></tbody></table></div>
  </div>
  <div class="panel"><h3 style="margin:0 0 8px">ما سبب الفيضان؟</h3><div class="opts" id="tr-op">${CAUSES.map(c => `<button type="button" class="btn" data-c="${c[0]}" aria-pressed="false">${esc(c[1])}</button>`).join('')}</div>
    <div class="row" style="margin-top:10px"><button type="button" class="btn pri" id="tr-ck">تحقق</button>${DEMO_BTN}</div><p class="msg" id="tr-msg" aria-live="polite"></p>${DEMO_MSG}</div>`;
  const svg = $('#tr-svg', host), $i = id => $('#' + id, host), msg = $i('tr-msg');
  const G0 = {ml:36, mr:10, mt:24, ah:150, dg:22};
  let W = 600, H = 0;
  const X = m => G0.ml + (m - V.a) / (V.b - V.a) * (W - G0.ml - G0.mr);
  const IX = x => V.a + (x - G0.ml) / (W - G0.ml - G0.mr) * (V.b - V.a);
  function draw(){
    W = Math.max(300, Math.round(svg.parentNode.clientWidth - 8)); const d0 = G0.mt + G0.ah + 12; H = d0 + 3 * G0.dg + 26;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    const i0 = Math.max(0, Math.floor(V.a) - 1), i1 = Math.min(720, Math.ceil(V.b) + 1);
    let lo = 0, hi = 100;
    if (V.auto){ lo = 1e9; hi = -1e9; for (let i = i0; i <= i1; i++){ lo = Math.min(lo, D.lv[i]); hi = Math.max(hi, D.lv[i]); } const pd = Math.max(1, (hi - lo) * 0.12); lo = Math.max(0, lo - pd); hi = Math.min(100, hi + pd); if (hi - lo < 2){ hi = lo + 2; } }
    const Y = v => G0.mt + (1 - (v - lo) / (hi - lo)) * G0.ah;
    const span = V.b - V.a, steps = [2, 5, 10, 15, 30, 60, 120, 180];
    const st = steps.find(s => (W - G0.ml - G0.mr) / (span / s) >= 64) || 180;
    let g = '';
    for (let k = 0; k <= 4; k++){ const v = lo + (hi - lo) * k / 4, y = Y(v); g += `<line class="tr-grid" x1="${G0.ml}" x2="${W - G0.mr}" y1="${y}" y2="${y}"/><text x="${G0.ml - 4}" y="${y + 3.5}" text-anchor="end">${fmt(v, hi - lo < 10 ? 1 : 0)}</text>`; }
    for (let m = Math.ceil(V.a / st) * st; m <= V.b; m += st){ const x = X(m); g += `<line class="tr-grid" x1="${x}" x2="${x}" y1="${G0.mt}" y2="${d0 + 3 * G0.dg}"/><text x="${x}" y="${H - 8}" text-anchor="middle">${tLab(m)}</text>`; }
    g += `<text x="${G0.ml}" y="12">%</text>`;
    let lines = '';
    PENS.forEach((p, pi) => {
      if (!p.on) return;
      const arr = D[p.k]; let pts = '';
      if (p.an){ for (let i = i0; i <= i1; i++) pts += `${X(i).toFixed(1)},${Y(clamp(arr[i], lo, hi)).toFixed(1)} `; lines += `<polyline points="${pts}" fill="none" stroke="${p.col}" stroke-width="2" clip-path="url(#trc)"/>`; }
      else {
        const y0 = d0 + (pi - 1) * G0.dg, yy = v => v ? y0 + 4 : y0 + G0.dg - 5;
        for (let i = i0; i <= i1; i++){ const x = X(i).toFixed(1); pts += `${x},${yy(arr[i > i0 ? i - 1 : i])} ${x},${yy(arr[i])} `; }
        lines += `<rect x="${G0.ml}" y="${y0}" width="${W - G0.ml - G0.mr}" height="${G0.dg - 1}" fill="none" stroke="var(--line)"/><polyline points="${pts}" fill="none" stroke="${p.col}" stroke-width="2" clip-path="url(#trc)"/><text x="${G0.ml + 4}" y="${y0 + 14}" style="fill:${p.col};font-weight:600;paint-order:stroke;stroke:var(--panel);stroke-width:3px">${p.n}</text>`;
      }
    });
    const cur = (c, cls, lab) => { if (c < V.a || c > V.b) return ''; const x = X(c); return `<g class="tr-h" data-cur="${lab}"><line class="${cls}" x1="${x}" x2="${x}" y1="${G0.mt - 8}" y2="${d0 + 3 * G0.dg}"/><rect x="${x - 15}" y="0" width="30" height="${d0 + 3 * G0.dg}" fill="transparent"/><rect x="${x - 11}" y="2" width="22" height="16" rx="4" fill="${lab === 'A' ? 'var(--ink)' : 'var(--cur)'}"/><text x="${x}" y="14" text-anchor="middle" style="fill:var(--panel);font-weight:700">${lab}</text></g>`; };
    svg.innerHTML = `<defs><clipPath id="trc"><rect x="${G0.ml}" y="0" width="${W - G0.ml - G0.mr}" height="${H}"/></clipPath></defs><rect x="0" y="0" width="${W}" height="${H}" fill="transparent" data-bg="1"/>${g}${lines}${cur(V.A, 'tr-cur', 'A')}${cur(V.B, 'tr-curB', 'B')}`;
    readout();
  }
  function readout(){
    const a = Math.round(clamp(V.A, 0, 720)), b = Math.round(clamp(V.B, 0, 720));
    $i('tr-ha').textContent = 'A ' + tLab(a); $i('tr-hb').textContent = 'B ' + tLab(b);
    $i('tr-ro').innerHTML = PENS.map(p => { const va = D[p.k][a], vb = D[p.k][b]; return `<tr><td style="color:${p.col};font-weight:700">${p.n}</td><td>${p.an ? fmt(va, 1) + ' %' : va ? '1 (ON)' : '0 (OFF)'}</td><td>${p.an ? fmt(vb, 1) + ' %' : vb ? '1 (ON)' : '0 (OFF)'}</td><td>${p.an ? fmt(vb - va, 1) + ' %' : (b - a) + ' min'}</td></tr>`; }).join('');
  }
  function zoom(f, c){ const span = clamp((V.b - V.a) * f, 20, 720); c = c == null ? (V.a + V.b) / 2 : c; const r = (c - V.a) / (V.b - V.a); let a = c - span * r; a = clamp(a, 0, 720 - span); V.a = a; V.b = a + span; draw(); }
  function pan(dm){ const span = V.b - V.a; V.a = clamp(V.a + dm, 0, 720 - span); V.b = V.a + span; draw(); }
  $i('tr-zi').addEventListener('click', () => zoom(0.5)); $i('tr-zo').addEventListener('click', () => zoom(2));
  $i('tr-pl').addEventListener('click', () => pan(-(V.b - V.a) * 0.3)); $i('tr-pr').addEventListener('click', () => pan((V.b - V.a) * 0.3));
  $i('tr-all').addEventListener('click', () => { V.a = 0; V.b = 720; draw(); });
  $i('tr-auto').addEventListener('change', e => { V.auto = e.target.checked; draw(); });
  $i('tr-pens').addEventListener('change', e => { const i = e.target.dataset.i; if (i != null){ PENS[+i].on = e.target.checked; draw(); } });
  /* pointer: drag a cursor handle, or pan the chart */
  let drag = null;
  const sx = e => { const r = svg.getBoundingClientRect(); return (e.clientX - r.left) * W / r.width; };
  svg.addEventListener('pointerdown', e => {
    const x = sx(e); let best = null;
    [['A', V.A], ['B', V.B]].forEach(([k, c]) => { if (c >= V.a && c <= V.b && Math.abs(X(c) - x) <= 16 && (!best || Math.abs(X(c) - x) < best.d)) best = {k, d:Math.abs(X(c) - x)}; });
    drag = best ? {cur:best.k} : {pan:true, x0:x, a0:V.a};
    svg.setPointerCapture(e.pointerId); e.preventDefault();
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return; const x = sx(e);
    if (drag.cur){ V[drag.cur] = clamp(Math.round(IX(x)), Math.ceil(V.a), Math.floor(V.b)); draw(); }
    else { const span = V.b - V.a; V.a = clamp(drag.a0 - (x - drag.x0) / (W - G0.ml - G0.mr) * span, 0, 720 - span); V.b = V.a + span; draw(); }
  });
  const up = () => { drag = null; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.25 : 0.8, IX(sx(e))); }, {passive:false});
  IL.onAct($i('tr-op'), '[data-c]', b => { V.cause = b.dataset.c; $$('#tr-op .btn', host).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); });
  $i('tr-ck').addEventListener('click', () => {
    const near = [V.A, V.B].some(c => Math.abs(c - F) <= 6);
    if (!near){
      const inBreak = [V.A, V.B].some(c => c >= 238 && c <= 282);
      msg.className = 'msg bad'; msg.textContent = inBreak ? 'هذا وقت الاستراحة: المضخة متوقفة، والخط المستوي هنا طبيعي.' : 'المؤشر ليس عند لحظة التجمّد: ابحث عن بداية الخط المستوي تمامًا بينما المضخة تعمل والصمام مفتوح.'; return; }
    if (!V.cause){ msg.className = 'msg bad'; msg.textContent = 'الموضع صحيح ✓ اختر الآن سبب الفيضان.'; return; }
    const c = CAUSES.find(x => x[0] === V.cause);
    if (V.cause !== 'lt'){ msg.className = 'msg bad'; msg.textContent = 'الموضع صحيح ✓ لكن السبب لا: ' + c[2]; return; }
    msg.className = 'msg ok'; msg.textContent = `صحيح: تجمّد LT-101 عند ${tLab(F)} على ${fmt(D.lv[F], 1)} %، فبقي الصمام مفتوحًا، وعمل LSHH عند ${tLab(D.hh.indexOf(1))} دون إيقاف. الحل: مقارنة LT مع LSHH وتعشيق يغلق V-101.`;
    win('trend', `حُدّدت لحظة تجمّد المرسل (${tLab(F)}) والسبب الصحيح ✓`);
  });
  G.trend.onShow = () => requestAnimationFrame(draw);
  window.addEventListener('resize', () => { if (CUR === 'trend') draw(); });
  draw();
  demo(host, 'trend', async () => {
    msg.textContent = ''; const dm = $('.demo-m', host); dm.className = 'msg demo-m';
    dm.textContent = 'العرض: نكبّر حول منتصف الليل حيث يبدأ الخط المستوي.';
    await dClick($i('tr-zi')); for (let k = 0; k < 10; k++){ const span = V.b - V.a, ta = clamp(F - 70, 0, 720 - span); V.a += (ta - V.a) * 0.4; V.b = V.a + span; draw(); await sleep(80); }
    await dClick($i('tr-zi')); { const span = V.b - V.a; V.a = clamp(F - span * 0.4, 0, 720 - span); V.b = V.a + span; draw(); }
    dm.textContent = 'العرض: نسحب المؤشر A إلى أول نقطة يصبح فيها المستوى ثابتًا تمامًا والمضخة تعمل.';
    V.A = Math.round(V.a + 5); draw(); await sleep(400);
    while (V.A < F){ V.A = Math.min(F, V.A + 1); draw(); await sleep(60); }
    V.B = Math.min(720, F + 20); draw(); await sleep(900);
    await dClick($(`#tr-op [data-c="lt"]`, host)); await dClick($i('tr-ck')); await sleep(2500);
  }, () => { Object.assign(V, {a:0, b:720, A:600, B:690, cause:null}); $$('#tr-op .btn', host).forEach(x => x.setAttribute('aria-pressed', 'false')); msg.textContent = ''; draw(); });
};

/* =====================================================================
   TAB 4 · users: roles, permission matrix, policy, test logins, audit trail
   ===================================================================== */
const ROLES = ['Operator', 'Maintenance', 'Engineer', 'Admin'];
const PERMS = [['op', 'Operate (Start / Stop)', 'تشغيل الخط وإيقافه'], ['ack', 'Acknowledge alarms', 'تأكيد الإنذارات'], ['sp', 'Change setpoints (within limits)', 'تغيير نقاط الضبط ضمن الحدود'], ['ovr', 'Override setpoint limits', 'تجاوز حدود نقاط الضبط'], ['edit', 'Edit recipes', 'تعديل الوصفات'], ['dl', 'Download recipes', 'تحميل الوصفات إلى الـ PLC'], ['users', 'Manage users', 'إدارة المستخدمين'], ['exit', 'Exit runtime', 'الخروج من Runtime']];
const UACC = [['op1', 'Operator'], ['maint1', 'Maintenance'], ['eng1', 'Engineer'], ['admin', 'Admin']];
BUILD.users = host => {
  const U = {};
  const initM = () => ({Operator:{op:1, ack:0, sp:1, ovr:1, edit:1, dl:1, users:0, exit:0}, Maintenance:{op:1, ack:1, sp:1, ovr:0, edit:0, dl:0, users:0, exit:1}, Engineer:{op:1, ack:1, sp:1, ovr:1, edit:1, dl:1, users:1, exit:1}, Admin:{op:1, ack:1, sp:1, ovr:1, edit:1, dl:1, users:1, exit:1}});
  function init(){ U.m = initM(); U.logoff = 60; U.login = null; U.denied = 0; U.audit = []; U.sp = 90; U.last = Date.now(); }
  init();
  const ACTS = [['start', 'op', '▶ Start line (تشغيل الخط)'], ['stop', 'op', '■ Stop line (إيقاف الخط)'], ['ack', 'ack', 'Acknowledge (تأكيد أحدث إنذار)'], ['sp1', 'sp', 'Mixer_Speed_SP = 120 rpm (ضمن 60–180)'], ['sp2', 'ovr', 'Mixer_Speed_SP = 250 rpm (خارج الحدود)'], ['edit', 'edit', 'فتح محرر الوصفات للتعديل'], ['dl', 'dl', 'تحميل وصفة إلى الـ PLC'], ['users', 'users', 'فتح إدارة المستخدمين'], ['exit', 'exit', 'Exit runtime (الخروج من التشغيل)']];
  host.innerHTML = `<div class="panel"><p>المشروع فيه أربعة أدوار، لكن مصفوفة الصلاحيات ضُبطت على عجل. اضبطها حتى تتحقق السياسة كلها، ثم انتقل إلى «تجربة»: سجّل الدخول بمستخدم وجرّب الإجراءات؛ الإجراء غير المسموح يظهر عليه قفل ويُسجَّل في سجل التدقيق.</p></div>
  <div class="grid2">
    <div class="dev"><h3>Security › Roles › Function rights</h3><div class="tblw"><table class="tbl hm pm"><thead><tr><th>Function right</th>${ROLES.map(r => `<th title="${r}">${{Operator:'Oper.', Maintenance:'Maint.', Engineer:'Eng.', Admin:'Admin'}[r]}</th>`).join('')}</tr></thead><tbody id="us-m"></tbody></table></div>
      <label style="margin-top:10px">Automatic logoff (min) <input class="inp" type="number" id="us-lo" min="0" max="240" value="60" style="width:6em"></label></div>
    <div class="dev"><h3>السياسة المطلوبة</h3><ul class="chk" id="us-pol"></ul></div>
  </div>
  <div class="panel"><h3 style="margin:0 0 8px">تجربة: تسجيل الدخول والإجراءات</h3>
    <div class="form-in"><label>User<select class="inp" id="us-u">${UACC.map(([u, r]) => `<option value="${u}">${u} (${r})</option>`).join('')}</select></label><label>Password<input class="inp" type="password" id="us-pw" value="••••••••" autocomplete="off" style="width:9em"></label><button type="button" class="btn pri" id="us-in">Login</button><button type="button" class="btn" id="us-out">Logout</button></div>
    <p class="statline" id="us-st" style="margin-top:8px"></p>
    <div class="acts" id="us-acts" style="margin-top:8px">${ACTS.map(a => `<button type="button" class="btn" data-a="${a[0]}">${esc(a[2])}</button>`).join('')}</div>
    <p class="msg" id="us-msg" aria-live="polite"></p>
    <div class="row">${DEMO_BTN}</div>${DEMO_MSG}
    <h4 style="margin:10px 0 6px">Audit trail (سجل التدقيق)</h4><div class="tblw"><table class="tbl hm"><thead><tr><th>Time</th><th>User</th><th>Role</th><th class="ar">الإجراء</th><th>Result</th></tr></thead><tbody id="us-au"></tbody></table></div>
  </div>`;
  const $i = id => $('#' + id, host), msg = $i('us-msg');
  function renderM(){ $i('us-m').innerHTML = PERMS.map(([k, en, ar]) => `<tr><td title="${esc(ar)}">${en}<br><small class="muted" style="font-family:var(--font-body)">${esc(ar)}</small></td>${ROLES.map(r => `<td><input type="checkbox" data-r="${r}" data-k="${k}"${U.m[r][k] ? ' checked' : ''} aria-label="${en} · ${r}"></td>`).join('')}</tr>`).join(''); $i('us-lo').value = U.logoff; }
  const pol = () => { const o = U.m.Operator; return [
    ['المشغّل يشغّل الخط ويوقفه ويؤكد الإنذارات', !!(o.op && o.ack)],
    ['المشغّل لا يعدّل الوصفات ولا يتجاوز حدود نقاط الضبط', !o.edit && !o.ovr],
    ['إدارة المستخدمين للمدير (Admin) وحده', !!U.m.Admin.users && ROLES.every(r => r === 'Admin' || !U.m[r].users)],
    ['الخروج التلقائي بعد 10 دقائق أو أقل من عدم النشاط', U.logoff > 0 && U.logoff <= 10]]; };
  function renderP(){ const p = pol(); $i('us-pol').innerHTML = p.map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${esc(t)}</li>`).join('') + `<li class="${U.denied ? 'ok' : ''}">جرّب إجراءً واحدًا على الأقل يُرفض في وضع التجربة</li>`; return p.every(x => x[1]); }
  function renderSt(){ const s = $i('us-st'); s.className = 'statline ' + (U.login ? 'ok' : ''); s.innerHTML = U.login ? `مسجّل الدخول: ${L(U.login.u + ' · ' + U.login.r)} · الخروج التلقائي بعد ${L(U.logoff + ' min')} دون نشاط · Mixer_Speed_SP = ${L(U.sp + ' rpm')}` : 'لا يوجد مستخدم مسجّل في وضع التجربة.'; }
  function renderAu(){ $i('us-au').innerHTML = U.audit.slice(-40).reverse().map(a => `<tr><td>${hms(a.t)}</td><td>${a.u}</td><td>${a.r}</td><td class="ar">${esc(a.a)}</td><td class="${a.ok ? 'ok' : 'bad'}">${a.ok ? 'Allowed' : 'Denied'}</td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted)">—</td></tr>'; }
  const audit = (a, ok) => { U.audit.push({t:Date.now(), u:U.login ? U.login.u : '—', r:U.login ? U.login.r : '—', a, ok}); renderAu(); };
  function check(){ if (renderP() && U.denied) win('users', 'المصفوفة تطابق السياسة، والخروج التلقائي ≤ 10 دقائق، وجُرّب إجراء مرفوض وسُجّل في سجل التدقيق ✓'); }
  renderM(); renderP(); renderSt(); renderAu();
  $i('us-m').addEventListener('change', e => { const c = e.target; if (!c.dataset.r) return; U.m[c.dataset.r][c.dataset.k] = c.checked ? 1 : 0; check(); });
  $i('us-lo').addEventListener('change', e => { const v = IL.num(e.target.value); U.logoff = isFinite(v) ? clamp(Math.round(v), 0, 240) : 60; e.target.value = U.logoff; renderSt(); check(); });
  $i('us-in').addEventListener('click', () => { const u = $i('us-u').value, r = UACC.find(x => x[0] === u)[1]; U.login = {u, r}; USER.u = u; USER.r = r; U.last = Date.now(); audit('Login', true); renderSt(); msg.className = 'msg ok'; msg.textContent = `سُجّل الدخول باسم ${u} (${r}).`; $$('#us-acts .btn', host).forEach(b => b.classList.remove('lock', 'okd')); });
  $i('us-out').addEventListener('click', () => { if (!U.login) return; audit('Logout', true); U.login = null; USER.u = '—'; USER.r = 'Logged off'; renderSt(); msg.textContent = ''; });
  const DO = {
    start(){ const r = lineStart(); if (r){ compReset(); return 'الضاغط كان مفصولًا: أُعيد ضبطه وسيبدأ الخط عند عودة الضغط.'; } return 'بدأ الخط.'; },
    stop(){ lineStop(); return 'توقف الخط.'; },
    ack(){ const a = AL.list.filter(x => !x.ack).sort((x, y) => y.came - x.came)[0]; if (!a) return 'لا توجد إنذارات غير مؤكدة.'; aAck(a, U.login.u); return 'أُكّد: ' + a.txt; },
    sp1(){ U.sp = 120; return 'Mixer_Speed_SP = 120 rpm.'; },
    sp2(){ U.sp = 250; return 'Mixer_Speed_SP = 250 rpm (تجاوز للحدود مسموح لهذا الدور).'; },
    edit(){ return 'فُتح محرر الوصفات للتعديل.'; }, dl(){ return 'سُمح بالتحميل (لم يُحمَّل شيء في هذه التجربة).'; },
    users(){ return 'فُتحت إدارة المستخدمين.'; }, exit(){ return 'سُمح بالخروج (لم يُغلق Runtime في هذه المحاكاة).'; }
  };
  IL.onAct($i('us-acts'), '[data-a]', b => {
    const a = ACTS.find(x => x[0] === b.dataset.a);
    if (!U.login){ msg.className = 'msg bad'; msg.textContent = 'سجّل الدخول أولًا.'; return; }
    if (U.logoff > 0 && Date.now() - U.last > U.logoff * 60000){ audit('Automatic logoff', true); U.login = null; USER.u = '—'; USER.r = 'Logged off'; renderSt(); msg.className = 'msg bad'; msg.textContent = 'انتهت الجلسة بالخروج التلقائي: سجّل الدخول من جديد.'; return; }
    U.last = Date.now();
    const ok = !!U.m[U.login.r][a[1]], name = PERMS.find(p => p[0] === a[1])[1];
    b.classList.remove('lock', 'okd'); void b.offsetWidth; b.classList.add(ok ? 'okd' : 'lock');
    audit(a[2], ok);
    if (ok){ msg.className = 'msg ok'; msg.textContent = DO[a[0]](); }
    else { U.denied++; msg.className = 'msg bad'; msg.textContent = `مرفوض: الدور ${U.login.r} لا يملك صلاحية ${name}.`; }
    renderSt(); check();
  });
  demo(host, 'users', async () => {
    msg.textContent = ''; const dm = $('.demo-m', host); dm.className = 'msg demo-m';
    const cb = (r, k) => $(`#us-m input[data-r="${r}"][data-k="${k}"]`, host);
    dm.textContent = 'العرض: المشغّل يؤكد الإنذارات، ولا يعدّل الوصفات، ولا يتجاوز الحدود.';
    await dSet(cb('Operator', 'ack'), true); await dSet(cb('Operator', 'ovr'), false); await dSet(cb('Operator', 'edit'), false);
    dm.textContent = 'العرض: إدارة المستخدمين للمدير وحده.'; await dSet(cb('Engineer', 'users'), false);
    dm.textContent = 'العرض: الخروج التلقائي بعد 10 دقائق.'; await dSet($i('us-lo'), '10');
    dm.textContent = 'العرض: ندخل باسم op1 ونجرّب تعديل الوصفة: يُرفض.';
    await dSet($i('us-u'), 'op1'); await dClick($i('us-in'));
    await dClick($('[data-a="ack"]', host)); await dClick($('[data-a="edit"]', host)); await dClick($('[data-a="sp2"]', host)); await sleep(1800);
  }, () => { init(); renderM(); renderP(); renderSt(); renderAu(); USER.u = 'op1'; USER.r = 'Operator'; msg.textContent = ''; $$('#us-acts .btn', host).forEach(b => b.classList.remove('lock', 'okd')); });
};

/* =====================================================================
   TAB 5 · recipe: edit, limits, save, safe download, watch the bottles
   ===================================================================== */
const REL = [['vol', 'Fill_Volume', 'L', 0.20, 1.05, 3], ['spd', 'Fill_Speed', 'mL/s', 100, 400, 0], ['tq', 'Cap_Torque', 'N·m', 1.0, 3.5, 1], ['mix', 'Mixer_Time', 's', 30, 600, 0]];
const REC0 = () => ({'1.0 L':{vol:1.000, spd:300, tq:2.2, mix:120}, '0.5 L':{vol:0.500, spd:250, tq:1.8, mix:120}, '0.25 L':{vol:0.250, spd:180, tq:1.4, mix:90}});
BUILD.recipe = host => {
  const R = {};
  function init(){ R.recs = REC0(); R.cur = '1.0 L'; R.ed = Object.assign({}, R.recs[R.cur]); R.dirty = false; R.f = {edit:false, oor:false, save:false, dlRun:false, dl:false, start:false, n:0}; R.savedRec = null; R.dlVol = null; R.last = null; }
  init();
  host.innerHTML = `<div class="panel"><p>الوصفة «تعبئة العصير» لها ثلاثة سجلات. حقول السجل محمية بحدود دنيا وعليا، والتحميل إلى الـ PLC أثناء الإنتاج ممنوع لأنه يغيّر الحجم في منتصف التعبئة. اتبع الخطوات بالترتيب.</p></div>
  <div class="grid2">
    <div class="dev"><h3>Recipe view: تعبئة العصير</h3>
      <div class="recs" id="rc-recs">${Object.keys(REC0()).map(k => `<button type="button" class="btn" data-r="${k}" aria-pressed="false"><bdi>${k}</bdi></button>`).join('')}</div>
      <div class="tblw" style="margin-top:8px"><table class="tbl hm rc"><thead><tr><th>Element</th><th>Value</th><th>Unit</th><th>Min</th><th>Max</th></tr></thead><tbody id="rc-tb"></tbody></table></div>
      <div class="row" style="margin-top:8px"><button type="button" class="btn" id="rc-save">Save (حفظ السجل)</button><button type="button" class="btn pri" id="rc-dl">Write to PLC (تحميل إلى الـ PLC)</button></div>
      <div class="row" style="margin-top:6px"><button type="button" class="btn" id="rc-start">▶ تشغيل الخط</button><button type="button" class="btn" id="rc-stop">■ إيقاف الخط</button>${DEMO_BTN}</div>
      <p class="msg" id="rc-msg" aria-live="polite"></p>${DEMO_MSG}
    </div>
    <div class="dev"><h3>الخطوات</h3><ol class="steps-l" id="rc-steps"></ol>
      <h3 style="margin-top:10px">DB_Recipe في الـ PLC الآن</h3><div class="tblw" id="rc-plc"></div></div>
  </div>`;
  const $i = id => $('#' + id, host), msg = $i('rc-msg');
  const say = (t, ok) => { msg.textContent = t; msg.className = 'msg ' + (ok ? 'ok' : 'bad'); };
  function renderT(){
    $$('#rc-recs .btn', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.r === R.cur ? 'true' : 'false'));
    $i('rc-tb').innerHTML = REL.map(([k, n, u, mn, mx, d]) => `<tr><td>${n}</td><td><input type="number" inputmode="decimal" step="${d ? Math.pow(10, -d) : 1}" data-k="${k}" value="${fmt(R.ed[k], d)}" aria-label="${n}"></td><td>${u}</td><td>${fmt(mn, d)}</td><td>${fmt(mx, d)}</td></tr>`).join('');
  }
  function renderS(){
    const f = R.f, st = [['عدّل قيمة في أحد السجلات', f.edit], ['جرّب قيمة خارج الحدود: يجب أن تُرفض', f.oor], ['احفظ السجل المعدّل (Save)', f.save], ['جرّب التحميل والخط يعمل: يُرفض «أوقف الخط أولًا»', f.dlRun], ['أوقف الخط ثم حمّل السجل المحفوظ إلى الـ PLC', f.dl], [`شغّل الخط وشاهد 3 عبوات تُملأ بالحجم الجديد (${f.n} من 3)`, f.n >= 3]];
    const curI = st.findIndex(s => !s[1]);
    $i('rc-steps').innerHTML = st.map(([t, ok], i) => `<li class="${ok ? 'ok' : i === curI ? 'cur' : ''}">${esc(t)}</li>`).join('');
    const r = M.rec; $i('rc-plc').innerHTML = `<table class="tbl hm"><tbody><tr><td>Record</td><td><b>${r.name}</b></td></tr><tr><td>Fill_Volume</td><td><b>${fmt(r.vol, 3)} L</b></td></tr><tr><td>Fill_Speed</td><td>${r.spd} mL/s</td></tr><tr><td>Cap_Torque</td><td>${fmt(r.tq, 1)} N·m</td></tr><tr><td>Mixer_Time</td><td>${r.mix} s</td></tr><tr><td>Line</td><td class="${M.line ? 'ok' : 'bad'}">${M.line ? 'RUNNING' : 'STOPPED'}</td></tr><tr><td>Last bottle</td><td>${R.last ? fmt(R.last, 3) + ' L' : '—'}</td></tr></tbody></table>`;
  }
  renderT(); renderS();
  IL.onAct($i('rc-recs'), '[data-r]', b => { if (R.dirty) say('أُلغيت التعديلات غير المحفوظة على السجل السابق.'); else msg.textContent = ''; R.cur = b.dataset.r; R.ed = Object.assign({}, R.recs[R.cur]); R.dirty = false; renderT(); });
  $i('rc-tb').addEventListener('change', e => {
    const el = e.target, k = el.dataset.k; if (!k) return;
    const [, n, u, mn, mx, d] = REL.find(x => x[0] === k), v = IL.num(el.value);
    if (!isFinite(v) || v < mn - 1e-9 || v > mx + 1e-9){ el.value = fmt(R.ed[k], d); el.classList.add('err'); setTimeout(() => el.classList.remove('err'), 1500); R.f.oor = true; say(`القيمة ${isFinite(v) ? v : el.value} خارج حدود ${n} (${fmt(mn, d)} – ${fmt(mx, d)} ${u}): لم تُقبل.`); renderS(); return; }
    R.ed[k] = +fmt(v, d); el.value = fmt(R.ed[k], d);
    R.dirty = REL.some(([kk]) => R.ed[kk] !== R.recs[R.cur][kk]);
    if (R.dirty){ R.f.edit = true; say(`${n} = ${fmt(R.ed[k], d)} ${u} (غير محفوظ بعد).`, true); }
    renderS();
  });
  $i('rc-save').addEventListener('click', () => { if (!R.dirty){ say('لا توجد تعديلات لحفظها.'); return; } R.recs[R.cur] = Object.assign({}, R.ed); R.dirty = false; R.f.save = true; R.savedRec = R.cur; say(`حُفظ السجل ${R.cur} في قاعدة الوصفات.`, true); renderS(); });
  $i('rc-dl').addEventListener('click', () => {
    if (M.line){ R.f.dlRun = true; say('أوقف الخط أولًا: التحميل أثناء الإنتاج ممنوع.'); renderS(); return; }
    if (R.dirty){ say('احفظ السجل أولًا: التحميل يرسل القيم المحفوظة.'); return; }
    const r = R.recs[R.cur]; M.rec = Object.assign({name:R.cur}, r);
    M.btl.forEach(b => { if (!b.fill && !b.done){ b.cap = capOf(r.vol); b.vol = 0; } });
    if (R.f.save && R.savedRec === R.cur){ R.f.dl = true; R.f.start = false; R.f.n = 0; R.dlVol = r.vol; say(`حُمّل السجل ${R.cur} إلى DB_Recipe ✓ (تغيير المقاس تم على السير). شغّل الخط الآن.`, true); }
    else say(`حُمّل السجل ${R.cur} إلى الـ PLC. التمرين يطلب تحميل السجل الذي عدّلته وحفظته.`, true);
    renderS();
  });
  $i('rc-start').addEventListener('click', () => { if (M.line){ say('الخط يعمل بالفعل.'); return; } const r = lineStart(); if (r){ compReset(); say('الضاغط كان مفصولًا: أُعيد ضبطه وسيبدأ الخط عند عودة ضغط الهواء.', true); } else say('بدأ الخط.', true); if (R.f.dl) R.f.start = true; renderS(); });
  $i('rc-stop').addEventListener('click', () => { if (!M.line && !M.pend){ say('الخط متوقف بالفعل.'); return; } lineStop(); say('توقف الخط.', true); renderS(); });
  EV.filled.push(b => {
    R.last = b.vol;
    if (R.f.dl && (R.f.start || M.line) && R.dlVol != null && Math.abs(b.vol - R.dlVol) < 1e-6 && R.f.n < 3){ R.f.start = true; R.f.n++; renderS(); if (R.f.n >= 3 && R.f.edit && R.f.oor && R.f.save && R.f.dlRun) win('recipe', `عُدّل السجل وحُفظ وحُمّل بأمان، والعبوات تُملأ الآن بـ ${fmt(R.dlVol, 3)} L ✓`); }
  });
  let tk = 0; TICK.recipe = dt => { tk += dt; if (tk > 0.5){ tk = 0; renderS(); } };
  demo(host, 'recipe', async () => {
    msg.textContent = ''; const dm = $('.demo-m', host); dm.className = 'msg demo-m';
    dm.textContent = 'العرض: نختار سجل 0.5 L ونجرّب حجم 1.50 L: خارج الحدود فيُرفض.';
    await dClick($('[data-r="0.5 L"]', host));
    await dSet($('[data-k="vol"]', host), '1.50'); await sleep(900);
    dm.textContent = 'العرض: نضبط الحجم على 0.480 L ونحفظ.';
    await dSet($('[data-k="vol"]', host), '0.480'); await dClick($i('rc-save'));
    dm.textContent = 'العرض: التحميل والخط يعمل يُرفض.';
    if (!M.line){ await dClick($i('rc-start')); await sleep(800); }
    await dClick($i('rc-dl')); await sleep(900);
    dm.textContent = 'العرض: نوقف الخط، نحمّل، ثم نشغّل ونراقب العبوات.';
    await dClick($i('rc-stop')); await dClick($i('rc-dl')); await dClick($i('rc-start'));
    for (let i = 0; i < 120 && R.f.n < 3; i++) await sleep(250);
    await sleep(1000);
  }, () => {
    init(); M.rec = Object.assign({name:'1.0 L'}, REC0()['1.0 L']); M.btl.forEach(b => { if (!b.fill && !b.done){ b.cap = 1; b.vol = 0; } });
    if (!M.line) { if (lineStart()) compReset(); }
    renderT(); renderS(); msg.textContent = '';
  });
};

/* =====================================================================
   TAB 6 · arch: redundant servers, clients, MES over OPC UA, firewall/DMZ, switchover
   ===================================================================== */
BUILD.arch = host => {
  const A = {};
  function init(){ Object.assign(A, {ed:{pair:'', sync:false, vip:'', web:'10.0.1.11'}, cfg:{pair:'', sync:false, vip:'', web:'10.0.1.11'}, down:false, t:0, prim:'A', buf:[], bt:0, back:0}); ARCH.ok = false; M.srvA = true; M.opDown = false; }
  init();
  const redOk = c => c.pair === 'SRV-B' && c.sync && c.vip === '10.0.1.10';
  /* who is reachable right now: returns {op, panel, web, mes} → true/false */
  function clients(){
    const c = A.cfg, ok = redOk(c), vip = ok, t = A.t;
    if (!A.down){
      const back = A.back > 0 && !ok;   /* SRV-A just restarted without redundancy: clients still reconnecting */
      return {op:!back, panel:!back, web:!back && (c.web === '10.0.1.11' && A.prim === 'A' || c.web === '10.0.1.10' && vip || c.web === '10.0.1.12' && ok && A.prim === 'B'), mes:!back && vip};
    }
    if (!ok) return {op:false, panel:false, web:false, mes:false};
    return {op:t >= 3.2, panel:t >= 3.6, web:(c.web === '10.0.1.10' && t >= 4.0) || (c.web === '10.0.1.12' && t >= 4.0), mes:t >= 4.6};
  }
  host.innerHTML = `<div class="panel"><p>محطة SCADA هذه تعمل على خادم واحد SRV-A. الخادم SRV-B جاهز في الرف لكنه غير مقترن. ثلاثة عملاء يقرؤون من الخادم: حاسوب المشغّل، وعميل ويب على جهاز لوحي، ولوحة Unified Comfort Panel، ونظام MES في شبكة المكاتب يقرأ عبر OPC UA من خلف جدار الحماية.</p></div>
  <div class="arch-w"><svg id="ar-svg" viewBox="0 0 520 470" role="img" aria-label="مخطط معمارية SCADA بخادمين وثلاثة عملاء ونظام MES"></svg></div>
  <div class="grid2">
    <div class="dev"><h3>Runtime settings › Redundancy</h3>
      <label>Redundant partner <select id="ar-pair"><option value="">— None —</option><option value="SRV-B">SRV-B · 10.0.1.12</option></select></label>
      <label class="cb">Sync link (كابل مزامنة مباشر بين الخادمين) <input type="checkbox" id="ar-sync"></label>
      <label>Virtual address (العنوان الافتراضي) <input id="ar-vip" class="inp" placeholder="10.0.1.x" inputmode="decimal"></label>
      <h3 style="margin-top:10px">Web client (Tablet) › Server URL</h3>
      <label>https:// <select id="ar-web"><option value="10.0.1.11">10.0.1.11 (SRV-A)</option><option value="10.0.1.12">10.0.1.12 (SRV-B)</option><option value="10.0.1.10">10.0.1.10 (Virtual address)</option></select></label>
      <div class="row" style="margin-top:8px"><button type="button" class="btn pri" id="ar-ap">Download (تطبيق التهيئة)</button></div>
      <p class="msg" id="ar-msg" aria-live="polite"></p></div>
    <div class="dev"><h3>تجربة التعطل</h3>
      <div class="row"><button type="button" class="btn pri" id="ar-cut">⚡ افصل الخادم الرئيسي</button><button type="button" class="btn" id="ar-fix">↺ أعد تشغيل الخادم المفصول</button>${DEMO_BTN}</div>${DEMO_MSG}
      <div class="log" id="ar-log" style="margin-top:8px"><span class="dim">جاهز.</span></div>
      <h3 style="margin-top:10px">Tank1_Level في حاسوب المشغّل (آخر 60 s)</h3><svg class="mini-tr" id="ar-tr" viewBox="0 0 300 70"></svg><p class="note" id="ar-tn"></p></div>
  </div>`;
  const $i = id => $('#' + id, host), log = $i('ar-log'), msg = $i('ar-msg');
  [['ar-pair', 'pair'], ['ar-vip', 'vip'], ['ar-web', 'web']].forEach(([id, k]) => { const f = e => A.ed[k] = e.target.value.trim(); $i(id).addEventListener('input', f); $i(id).addEventListener('change', f); });
  $i('ar-sync').addEventListener('change', e => A.ed.sync = e.target.checked);
  const node = (x, y, w, h, t1, t2, cls, ok) => `<g class="nd-g${ok === false ? ' off' : ''}"><rect class="nd-b ${cls || ''}" x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="7"/><text x="${x}" y="${y - 3}" text-anchor="middle" font-size="14.5" font-weight="600">${t1}</text>${ok === false && t2 === 'nc' ? `<text class="ar" x="${x}" y="${y + 15}" text-anchor="middle" font-size="12" font-weight="700" style="fill:var(--bad)">لا اتصال</text>` : `<text x="${x}" y="${y + 14}" text-anchor="middle" font-size="11.5" style="fill:var(--muted)">${t2}</text>`}</g>`;
  function drawSvg(){
    const c = A.cfg, ok = redOk(c), cl = clients(), aUp = !A.down, bPrim = A.prim === 'B';
    const srvX = {A:130, B:390}, primX = srvX[A.prim];
    const tgt = k => { if (k === 'web'){ if (c.web === '10.0.1.11') return 130; if (c.web === '10.0.1.12') return 390; return 260; } return ok ? 260 : 130; };
    let s = `<rect x="6" y="6" width="508" height="88" rx="10" fill="var(--bg)" stroke="var(--line)"/><text class="ar" x="500" y="24" text-anchor="end" font-size="12" style="fill:var(--muted)">IT · شبكة المكاتب</text>
      <rect x="6" y="132" width="508" height="332" rx="10" fill="none" stroke="var(--line)"/><text class="ar" x="500" y="147" text-anchor="end" font-size="12" style="fill:var(--muted)">OT · شبكة التحكم</text>
      <rect x="6" y="102" width="508" height="22" rx="4" fill="var(--warn-soft)" stroke="var(--warn)"/><text x="506" y="117" text-anchor="end" font-size="11" font-weight="600">Firewall · DMZ — allow OPC UA 4840 → VIP only</text>`;
    const lk = (x1, y1, x2, y2, on) => `<path class="lk ${on ? 'on' : 'off'}" d="M${x1},${y1} V${(y1 + y2) / 2} H${x2} V${y2}"/>`;
    s += `<path class="lk" d="M130,382 V350 M390,382 V350 M260,382 V412" />`;
    s += `<path class="lk ${cl.mes ? 'on' : 'off'}" d="M175,72 V218 H${ok ? 255 : 130} V${ok ? 222 : 287}"/>`;
    const ey = x => x === 260 ? 222 : 287;
    s += lk(88, 203, tgt('op'), ey(tgt('op')), cl.op) + lk(260, 203, tgt('web'), ey(tgt('web')), cl.web) + lk(432, 203, tgt('panel'), ey(tgt('panel')), cl.panel);
    if (ok) s += `<path class="lk on" d="M260,242 V262 H${primX} V287" /><rect x="214" y="222" width="92" height="20" rx="10" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="260" y="236" text-anchor="middle" font-size="11" font-weight="700">VIP 10.0.1.10</text>`;
    else s += `<path class="lk" d="M130,230 V270" style="opacity:0"/>`;
    s += `<path class="lk ${c.sync ? 'sync' : ''}" d="M215,318 H305" style="${c.sync ? '' : 'stroke-dasharray:3 5;opacity:.5'}"/>${c.sync ? '<text x="260" y="312" text-anchor="middle" font-size="10.5" style="fill:var(--accent)">sync link</text>' : ''}`;
    s += node(260, 50, 250, 44, 'MES', cl.mes ? 'OPC UA client → 10.0.1.10:4840' : 'nc', '', cl.mes);
    const cn = (x, t1, t2, on) => node(x, 180, 150, 46, t1, on ? t2 : 'nc', '', on);
    s += cn(88, 'Operator PC', 'Unified PC client', cl.op) + cn(260, 'Web client', 'Tablet · ' + c.web, cl.web) + cn(432, 'Comfort Panel', 'MTP1200 Unified', cl.panel);
    const sv = (k, x, ip) => { const up = k === 'A' ? aUp : true, pr = A.prim === k; const role = !up ? 'OFFLINE' : !ok ? (k === 'A' ? 'Single server' : 'Not paired') : pr ? 'PRIMARY' : 'STANDBY'; return node(x, 318, 170, 62, 'SRV-' + k + ' · ' + ip, role, !up ? 'down' : pr && (ok || k === 'A') ? 'prim' : '', undefined); };
    s += sv('A', 130, '10.0.1.11') + sv('B', 390, '10.0.1.12');
    s += `<rect x="40" y="378" width="440" height="10" rx="5" fill="var(--bg)" stroke="var(--muted)"/><text x="470" y="402" text-anchor="end" font-size="11" style="fill:var(--muted)">PROFINET / Ethernet switch</text>`;
    s += node(260, 432, 170, 42, 'S7-1500', 'PLC · 192.168.0.1', '', true);
    $i('ar-svg').innerHTML = s;
    void bPrim;
  }
  function drawTr(){
    const b = A.buf, n = 120; let d = '', pen = false; const vs = b.filter(v => v != null), lo = vs.length ? Math.min(...vs) - 2 : 0, hi = vs.length ? Math.max(...vs) + 2 : 100;
    for (let i = 0; i < b.length; i++){ const v = b[i], x = (i + n - b.length) / (n - 1) * 300; if (v == null){ pen = false; continue; } const y = 64 - (v - lo) / (hi - lo) * 58; d += (pen ? 'L' : 'M') + x.toFixed(1) + ',' + clamp(y, 2, 68).toFixed(1); pen = true; }
    const gaps = b.some(v => v == null);
    $i('ar-tr').innerHTML = `<rect width="300" height="70" fill="var(--bg)" stroke="var(--line)"/><path d="${d}" fill="none" stroke="var(--liq)" stroke-width="2"/>`;
    $i('ar-tn').textContent = A.down && redOk(A.cfg) ? 'لا فجوة في هذا التحويل: SRV-B كان يسجّل ويزامن الإنذارات والترند طوال الوقت.' : gaps ? 'في البيانات فجوة: الخادم الوحيد كان متوقفًا ولم يُسجَّل شيء.' : 'البيانات متصلة.';
  }
  $i('ar-ap').addEventListener('click', () => {
    if (A.down){ msg.className = 'msg bad'; msg.textContent = 'أعد تشغيل الخادم المفصول أولًا ثم طبّق التهيئة.'; return; }
    const e = A.ed;
    if (e.vip && (ip2n(e.vip) === null || (ip2n(e.vip) & 0xFFFFFF00) !== (ip2n('10.0.1.0') & 0xFFFFFF00))) { msg.className = 'msg bad'; msg.textContent = 'العنوان الافتراضي يجب أن يكون في شبكة الخوادم 10.0.1.x.'; return; }
    if (e.vip === '10.0.1.11' || e.vip === '10.0.1.12'){ msg.className = 'msg bad'; msg.textContent = 'العنوان الافتراضي لا يكون عنوان أحد الخادمين: اختر عنوانًا ثالثًا مثل 10.0.1.10.'; return; }
    if (e.vip && e.vip !== '10.0.1.10'){ msg.className = 'msg bad'; msg.textContent = 'جدار الحماية و MES مضبوطان على العنوان الافتراضي 10.0.1.10: استخدمه.'; return; }
    A.cfg = Object.assign({}, e); A.prim = 'A'; ARCH.ok = redOk(A.cfg);
    const c = A.cfg;
    if (!c.pair) { msg.className = 'msg bad'; msg.textContent = 'طُبّق: لا يوجد شريك تكرار، فالخادم SRV-A نقطة فشل وحيدة.'; }
    else if (!c.sync){ msg.className = 'msg bad'; msg.textContent = 'التكرار يحتاج رابط مزامنة بين الخادمين لنقل الإنذارات والترند وحالة الخادم.'; }
    else if (!c.vip){ msg.className = 'msg bad'; msg.textContent = 'التكرار يحتاج عنوانًا افتراضيًا ينتقل إلى الخادم الرئيسي أيًّا كان.'; }
    else if (c.web !== '10.0.1.10'){ msg.className = 'msg bad'; msg.textContent = `التكرار مضبوط ✓ لكن عميل الويب يشير إلى ${c.web}: وجّهه إلى العنوان الافتراضي 10.0.1.10.`; }
    else { msg.className = 'msg ok'; msg.textContent = 'التكرار مضبوط ✓ والعملاء و MES على العنوان الافتراضي. جرّب الآن فصل الخادم الرئيسي.'; }
    logTo(log, `Download: redundancy=${c.pair ? 'SRV-A + SRV-B' : 'none'}, sync=${c.sync ? 'yes' : 'no'}, VIP=${c.vip || '—'}, web → ${c.web}`, 'dim'); drawSvg();
  });
  const T0 = {};
  $i('ar-cut').addEventListener('click', () => {
    if (A.down){ msg.className = 'msg bad'; msg.textContent = 'الخادم مفصول بالفعل.'; return; }
    if (A.prim === 'B'){ msg.className = 'msg bad'; msg.textContent = 'الخادم الرئيسي الآن SRV-B؛ أعد التمرين بإعادة تشغيل الصفحة أو أكمل.'; return; }
    A.down = true; A.t = 0; A.back = 0; Object.keys(T0).forEach(k => delete T0[k]); M.srvA = false;
    logTo(log, `${hms(Date.now())}  SRV-A: power lost (الخادم الرئيسي مفصول)`, 'bad'); msg.textContent = '';
  });
  $i('ar-fix').addEventListener('click', () => {
    if (!A.down){ msg.className = 'msg bad'; msg.textContent = 'لا يوجد خادم مفصول.'; return; }
    A.down = false; M.srvA = true; M.opDown = false;
    if (redOk(A.cfg)){ A.prim = 'B'; logTo(log, `${hms(Date.now())}  SRV-A: online → STANDBY (يزامن من SRV-B)`, 'ok'); }
    else { A.back = 2.5; logTo(log, `${hms(Date.now())}  SRV-A: online, clients reconnecting…`, 'dim'); }
    A.prim = redOk(A.cfg) ? 'B' : 'A'; ARCH.ok = redOk(A.cfg); drawSvg();
  });
  ARCH.step = dt => {
    if (A.down) A.t += dt;
    if (A.back > 0) A.back = Math.max(0, A.back - dt);
    const ok = redOk(A.cfg), cl = clients();
    M.opDown = !cl.op;
    if (A.down && ok){
      const ev = (k, t, s, c) => { if (A.t >= t && !T0[k]){ T0[k] = 1; logTo(log, `${hms(Date.now())}  ${s}`, c || 'ok'); } };
      ev('hb', 1.5, 'SRV-B: heartbeat lost on sync link (فقد نبض الخادم الرئيسي)', 'dim');
      ev('pr', 2.5, 'SRV-B: role → PRIMARY, takes VIP 10.0.1.10');
      ev('op', 3.2, 'Operator PC: reconnected ✓'); ev('pa', 3.6, 'Comfort Panel: reconnected ✓');
      if (A.cfg.web === '10.0.1.10' || A.cfg.web === '10.0.1.12') ev('we', 4.0, 'Web client: reconnected ✓'); else ev('wx', 4.0, 'Web client: لا يزال يشير إلى 10.0.1.11 المفصول ✗', 'bad');
      ev('me', 4.6, 'MES (OPC UA): session restored on VIP ✓');
      if (A.t >= 2.5) A.prim = 'B';
      if (A.t >= 5 && cl.op && cl.panel && cl.web && cl.mes && A.cfg.web === '10.0.1.10' && !T0.win){ T0.win = 1; logTo(log, 'التحويل ناجح: كل العملاء متصلون والإنذارات والترند بلا فجوة ✓', 'ok'); if (win('arch', 'تحوّل الخادم الاحتياطي إلى رئيسي خلال ثوانٍ، وعاد كل العملاء و MES عبر العنوان الافتراضي دون فجوة ✓')){ msg.className = 'msg ok'; msg.textContent = 'تحويل ناجح ✓'; } }
    } else if (A.down && !T0.nr && A.t > 1){ T0.nr = 1; logTo(log, `${hms(Date.now())}  كل العملاء رماديون: لا يوجد خادم احتياطي يستلم.`, 'bad'); }
    A.bt += dt; if (A.bt >= 0.5){ A.bt = 0; const live = A.down ? ok : !A.back; A.buf.push(live ? M.meas : null); if (A.buf.length > 120) A.buf.shift(); if (CUR === 'arch'){ drawTr(); drawSvg(); } }
  };
  drawSvg(); drawTr();
  demo(host, 'arch', async () => {
    msg.textContent = ''; const dm = $('.demo-m', host); dm.className = 'msg demo-m';
    if (A.down) await dClick($i('ar-fix'));
    dm.textContent = 'العرض: نقرن SRV-B، ونفعّل رابط المزامنة، ونعرّف العنوان الافتراضي، ونوجّه عميل الويب إليه.';
    await dSet($i('ar-pair'), 'SRV-B'); await dSet($i('ar-sync'), true); await dSet($i('ar-vip'), '10.0.1.10'); await dSet($i('ar-web'), '10.0.1.10'); await dClick($i('ar-ap'));
    await sleep(800); dm.textContent = 'العرض: نفصل الخادم الرئيسي ونراقب التحويل.';
    await dClick($i('ar-cut')); await sleep(6500);
  }, () => {
    init(); $i('ar-pair').value = ''; $i('ar-sync').checked = false; $i('ar-vip').value = ''; $i('ar-web').value = '10.0.1.11';
    Object.keys(T0).forEach(k => delete T0[k]); log.innerHTML = '<span class="dim">جاهز.</span>'; msg.textContent = ''; drawSvg();
  });
};

/* =====================================================================
   TAB 7 · faults: four hidden faults, real diagnosis tools, real fixes
   ===================================================================== */
const FS = {on:false};
function doorAlarm(){ return CUR === 'faults' && FS.on && FS.doorBit === 4 && SCN.faults && SCN.faults.conn; }
BUILD.faults = host => {
  ADM.door.clsF = () => FS.on ? FS.doorCls : 'Warning';
  const FIX = {conn:'الاتصال بالـ PLC', fmt:'الحقل #####', type:'القيمة الخاطئة (نوع البيانات)', alarm:'الإنذار الذي لا يظهر'};
  const FX = {
    conn:() => FS.v.conn === 'cable' ? FS.port3 : FS.prIp !== '192.168.0.1',
    fmt:() => SCN.faults.fields.Bottle_Count.w >= 5,
    type:() => SCN.faults.tags[FS.v.type].type === 'Real',
    alarm:() => FS.v.alarm === 'bit' ? FS.doorBit === 4 : SCN.faults.acFilter.includes('Warning')};
  function start(){
    FS.on = true; FS.v = {conn:IL.pick(['cable', 'dup']), type:IL.pick(['Pump1_Current', 'Line_Pressure']), alarm:IL.pick(['bit', 'class'])};
    FS.port3 = FS.v.conn !== 'cable'; FS.prIp = FS.v.conn === 'dup' ? '192.168.0.1' : '192.168.0.60';
    FS.doorBit = FS.v.alarm === 'bit' ? 3 : 4; FS.doorCls = FS.v.alarm === 'bit' ? 'Alarm' : 'Warning';
    const tags = refTags(); tags[FS.v.type].type = 'Int'; tags[FS.v.type].abs = true; tags[FS.v.type].absAddr = FS.v.type === 'Pump1_Current' ? 'DB1.DBW8 (absolute)' : 'DB1.DBW4 (absolute)';
    const fields = refFields(); fields.Bottle_Count.w = 4;
    SCN.faults = {conn:false, tags, fields, acFilter:FS.v.alarm === 'class' ? ['Alarm', 'System'] : ['Alarm', 'Warning', 'System']};
    SCN.faults.conn = FX.conn();
    FS.done = new Set(); FS.all = false; FS.tool = 'diag';
    log.innerHTML = ''; logTo(log, 'بدأ السيناريو: أربعة أعطال مخفية. ابدأ بالطبقة الأدنى: الاتصال.', 'dim');
    renderTool(); renderFx();
  }
  host.innerHTML = `<div class="panel"><p>بعد تعديل في المشروع وتغيير في لوحة الشبكة عادت المحطة بأربعة أعطال. شكاوى المشغّلين:</p>
    <ul style="margin:8px 0;padding-inline-start:22px;display:grid;gap:2px"><li>«الشاشة كلها #### ومكتوب: لا اتصال».</li><li>«أحد الحقول يعرض ##### فقط».</li><li>«قيمة في الشاشة غير منطقية إطلاقًا».</li><li>«باب الحماية في آلة التعبئة مفتوح ولا يظهر أي إنذار».</li></ul>
    <div class="row"><button type="button" class="btn pri" id="fx-go">▶ ابدأ</button>${DEMO_BTN}<span class="fx-n" id="fx-n"></span></div>${DEMO_MSG}</div>
  <div class="panel" id="fx-wb" hidden><div class="ftools" id="fx-tools">${[['diag', 'تشخيص الاتصال'], ['tags', 'جدول الوسوم'], ['watch', 'جدول المراقبة (PLC)'], ['alarm', 'إعدادات الإنذارات'], ['field', 'خصائص الحقول']].map(t => `<button type="button" class="btn" data-t="${t[0]}" aria-pressed="false">${t[1]}</button>`).join('')}</div>
    <div id="fx-tool" style="margin-top:10px"></div><p class="msg" id="fx-msg" aria-live="polite"></p>
    <div class="log" id="fx-log" style="margin-top:8px"></div><ul class="chk" id="fx-done" style="margin-top:8px"></ul></div>`;
  const $i = id => $('#' + id, host), log = $i('fx-log'), msg = $i('fx-msg'), tool = $i('fx-tool');
  const say = (t, ok) => { msg.textContent = t; msg.className = 'msg ' + (ok ? 'ok' : 'bad'); };
  function renderFx(){
    $i('fx-n').textContent = FS.on ? `أُصلح ${FS.done.size} من 4` : '';
    $i('fx-done').innerHTML = FS.on ? Object.keys(FIX).map(k => `<li class="${FS.done.has(k) ? 'ok' : ''}">${FS.done.has(k) ? esc(FIX[k]) : 'عطل مخفي'}</li>`).join('') : '';
    $i('fx-wb').hidden = !FS.on;
  }
  function renderTool(){
    $$('#fx-tools .btn', host).forEach(b => b.setAttribute('aria-pressed', b.dataset.t === FS.tool ? 'true' : 'false'));
    const C = SCN.faults, t = FS.tool;
    if (t === 'diag'){
      const ports = [['P1', 'S7-1500 (PLC_1)', true], ['P2', 'SCADA station', true], ['P3', 'Uplink → PLC switch', FS.port3], ['P4', 'Printer_PR1', true]];
      const arp = FS.v.conn === 'dup' && FS.prIp === '192.168.0.1' ? [['192.168.0.1', '28-63-36-A1-00-01', 'S7-1500'], ['192.168.0.1', '00-1B-1B-5E-22-9F', 'Printer_PR1 ⚠']] : [['192.168.0.1', '28-63-36-A1-00-01', 'S7-1500'], [FS.prIp, '00-1B-1B-5E-22-9F', 'Printer_PR1']];
      tool.innerHTML = `<div class="grid2"><div class="dev"><h3>HMI_Connection_1</h3><p>الحالة: <b class="${C.conn ? '' : 'bad'}" style="color:var(--${C.conn ? 'good' : 'bad'})">${C.conn ? 'Connected ✓' : 'Disconnected'}</b></p><div class="row"><button type="button" class="btn" id="fx-ping">ping 192.168.0.1</button><button type="button" class="btn" id="fx-rst">إعادة تشغيل Runtime</button></div></div>
        <div class="dev"><h3>Switch XC206 › Ports</h3><div class="tblw"><table class="tbl hm"><thead><tr><th>Port</th><th>Device</th><th>Link</th><th></th></tr></thead><tbody>${ports.map(p => `<tr><td>${p[0]}</td><td>${p[1]}</td><td class="${p[2] ? 'ok' : 'bad'}">${p[2] ? 'Up 100M' : 'Down'}</td><td>${p[2] ? '' : `<button type="button" class="btn" data-plug="${p[0]}" style="min-height:34px">وصّل الكابل</button>`}</td></tr>`).join('')}</tbody></table></div></div>
        <div class="dev"><h3>arp -a (192.168.0.x)</h3><div class="tblw"><table class="tbl hm"><thead><tr><th>IP</th><th>MAC</th><th>Vendor / device</th></tr></thead><tbody>${arp.map(a => `<tr><td>${a[0]}</td><td>${a[1]}</td><td>${a[2]}</td></tr>`).join('')}</tbody></table></div>
          <label style="margin-top:8px">Printer_PR1 IP <input class="inp" id="fx-prip" value="${FS.prIp}" inputmode="decimal" style="width:10em"></label><button type="button" class="btn" id="fx-prap">تطبيق على الطابعة</button></div></div>`;
      $i('fx-ping').addEventListener('click', () => { logTo(log, '> ping 192.168.0.1', 'dim'); if (C.conn) logTo(log, 'Reply from 192.168.0.1: time<1ms TTL=30', 'ok'); else if (FS.v.conn === 'cable') logTo(log, 'Request timed out. (لا رابط إلى شبكة الـ PLC: افحص منافذ المفتاح)', 'bad'); else logTo(log, 'Reply from 192.168.0.1 … Request timed out … Reply … (ردود متقطعة: جهازان بالعنوان نفسه؟ افحص جدول ARP)', 'bad'); });
      $i('fx-rst').addEventListener('click', () => say('إعادة التشغيل لا تصلح السبب: افحص منافذ المفتاح وجدول ARP.'));
      $i('fx-prap').addEventListener('click', () => {
        const v = $i('fx-prip').value.trim(), n = ip2n(v);
        if (n === null || (n & 0xFFFFFF00) !== (ip2n('192.168.0.0') & 0xFFFFFF00)){ say('اختر عنوانًا صالحًا للطابعة في الشبكة 192.168.0.x.'); return; }
        if ([1, 10, 20].includes(n & 255)){ say(`العنوان ${v} مستخدم في الشبكة: اختر عنوانًا حرًّا.`); return; }
        if ((n & 255) === 0 || (n & 255) === 255){ say('هذا عنوان الشبكة أو البث.'); return; }
        FS.prIp = v; logTo(log, `Printer_PR1 → ${v}`, 'ok'); upd(); renderTool();
      });
    } else if (t === 'tags'){
      tool.innerHTML = `<p class="note">جدول وسوم المشروع (بعض الوسوم أُضيفت يدويًا بعنوان مطلق):</p>` + tagTable(C.tags, 'fx-tt', {noSc:true, access:true});
      bindTagTable($i('fx-tt'), () => SCN.faults.tags, () => { SCN.faults._c = {}; upd(); });
    } else if (t === 'watch'){
      tool.innerHTML = `<div class="tblw"><table class="tbl hm"><thead><tr><th>Name</th><th>Address</th><th>Display format</th><th>Monitor value</th></tr></thead><tbody id="fx-wt"></tbody></table></div><p class="note" style="margin-top:6px">قارن كل قيمة هنا بما تعرضه الشاشة في الأعلى.</p>`;
      watch();
    } else if (t === 'alarm'){
      tool.innerHTML = `<div class="grid2"><div class="dev"><h3>HMI alarms › Discrete alarms › FL1_Door_Open</h3>
        <label>Trigger tag <span class="mono ltr">Alarm_Word_1</span></label>
        <label>Trigger bit <select id="fx-bit">${Array.from({length:16}, (_, i) => `<option${i === FS.doorBit ? ' selected' : ''}>${i}</option>`).join('')}</select></label>
        <label>Alarm class <select id="fx-cls">${['Alarm', 'Warning', 'System'].map(x => `<option${x === FS.doorCls ? ' selected' : ''}>${x}</option>`).join('')}</select></label></div>
        <div class="dev"><h3>Alarm Control (الشاشة) › Filter › Alarm classes</h3>${['Alarm', 'Warning', 'System'].map(x => `<label class="cb">${x} <input type="checkbox" data-acf="${x}"${C.acFilter.includes(x) ? ' checked' : ''}></label>`).join('')}
        <h3 style="margin-top:8px">آخر ما يعرضه Alarm Control</h3><div class="note" id="fx-mini"></div></div></div>`;
      mini();
      $i('fx-bit').addEventListener('change', e => { FS.doorBit = +e.target.value; logTo(log, `FL1_Door_Open: trigger bit → ${FS.doorBit}`, 'dim'); upd(); });
      $i('fx-cls').addEventListener('change', e => { FS.doorCls = e.target.value; AL.list.forEach(a => { if (a.id === 'door') a.cls = FS.doorCls; }); AL.ver++; logTo(log, `FL1_Door_Open: class → ${FS.doorCls}`, 'dim'); upd(); });
      $$('[data-acf]', tool).forEach(c => c.addEventListener('change', () => { SCN.faults.acFilter = $$('[data-acf]', tool).filter(x => x.checked).map(x => x.dataset.acf); logTo(log, `Alarm Control filter → ${SCN.faults.acFilter.join(', ') || '—'}`, 'dim'); banKey = ''; upd(); }));
    } else if (t === 'field'){
      const F = C.fields;
      tool.innerHTML = `<div class="tblw"><table class="tbl hm"><thead><tr><th>I/O field</th><th>Process value</th><th>Format pattern</th><th>Digits (width)</th><th>Decimals</th></tr></thead><tbody>${TAGN.map(n => `<tr data-n="${n}"><td>IO_${n}</td><td>${n}</td><td>${(F[n].dec ? 's' + '9'.repeat(F[n].w - F[n].dec - 1) + '.' + '9'.repeat(F[n].dec) : 's' + '9'.repeat(F[n].w))}</td><td><input type="number" min="1" max="12" data-f="w" value="${F[n].w}"></td><td><input type="number" min="0" max="4" data-f="dec" value="${F[n].dec}"></td></tr>`).join('')}</tbody></table></div><p class="note" style="margin-top:6px">إذا كانت القيمة أعرض من نمط الحقل يعرض الحقل ##### بدل الرقم.</p>`;
      tool.querySelector('tbody').addEventListener('change', e => { const tr = e.target.closest('tr'), f = e.target.dataset.f, v = Math.round(IL.num(e.target.value)); if (!isFinite(v)) return; SCN.faults.fields[tr.dataset.n][f] = clamp(v, f === 'w' ? 1 : 0, f === 'w' ? 12 : 4); renderTool(); upd(); });
    }
  }
  function mini(){ const el = $('#fx-mini', host); if (!el || !SCN.faults) return; const m = AL.list.filter(a => SCN.faults.acFilter.includes(a.cls)).slice(-6).reverse(); const h = m.length ? m.map(a => `${shpSvg(a.p)} ${L(a.cls)} ${esc(a.txt)}`).join('<br>') : 'لا شيء.'; if (el.innerHTML !== h) el.innerHTML = h; }
  function watch(){
    const w = $('#fx-wt', host); if (!w) return;
    w.innerHTML = `<tr><td>Pump1_Current</td><td>"DB_Line".Pump1_Current</td><td>Floating-point</td><td><b>${fmt(M.pump.cur, 2)}</b></td></tr><tr><td>Line_Pressure</td><td>"DB_Line".Line_Pressure</td><td>Floating-point</td><td><b>${fmt(M.press, 3)}</b></td></tr><tr><td>Bottle_Count</td><td>"DB_Line".Bottle_Count</td><td>DEC+/-</td><td><b>${M.count}</b></td></tr><tr><td>Air_Pressure</td><td>"DB_Line".Air_Pressure</td><td>Floating-point</td><td><b>${fmt(M.air, 2)}</b></td></tr><tr><td>FL1_Door_Open</td><td>%I8.4</td><td>Bool</td><td><b>TRUE</b></td></tr><tr><td>Alarm_Word_1</td><td>"DB_Alarms".Alarm_Word_1</td><td>Hex</td><td><b>16#0010</b> (bit 4)</td></tr>`;
  }
  function upd(){
    if (!FS.on) return;
    SCN.faults.conn = FX.conn();
    for (const k in FX) if (!FS.done.has(k) && FX[k]()){
      if (k !== 'conn' && !SCN.faults.conn) continue;
      FS.done.add(k);
      const t = {conn:FS.v.conn === 'cable' ? 'وُصل كابل المنفذ P3 فعاد الاتصال بالـ PLC.' : 'غُيّر عنوان الطابعة المكرر فعاد الاتصال بالـ PLC.', fmt:'وُسّع نمط حقل Bottle_Count فظهر الرقم بدل #####.', type:`صار ${FS.v.type} من النوع Real فصحّت القيمة.`, alarm:FS.v.alarm === 'bit' ? 'صار بت الإطلاق 4 كما في الـ PLC فظهر إنذار الباب.' : 'أُضيفت فئة Warning إلى فلتر Alarm Control فظهر إنذار الباب.'}[k];
      say('✓ ' + t, true); logTo(log, '✓ ' + t, 'ok');
    }
    renderFx();
    if (FS.done.size === 4 && !FS.all){ FS.all = true; logTo(log, 'كل الأعطال الأربعة أُصلحت ✓', 'ok'); win('faults', 'أُصلحت الأعطال الأربعة: الاتصال، والحقل #####، ونوع البيانات، والإنذار المختفي ✓'); }
  }
  tool.addEventListener('click', e => { const b = e.target.closest('[data-plug]'); if (!b) return; FS.port3 = true; logTo(log, 'X1 P3: link up 100 Mbit/s', 'ok'); upd(); renderTool(); });
  $i('fx-go').addEventListener('click', () => { start(); say('ابدأ بأداة «تشخيص الاتصال».', true); });
  IL.onAct($i('fx-tools'), '[data-t]', b => { FS.tool = b.dataset.t; renderTool(); });
  let tk = 0; TICK.faults = dt => { tk += dt; if (tk < 0.5 || !FS.on) return; tk = 0; if (FS.tool === 'watch') watch(); if (FS.tool === 'alarm') mini(); upd(); };
  renderFx();
  demo(host, 'faults', async () => {
    msg.textContent = ''; const dm = $('.demo-m', host); dm.className = 'msg demo-m';
    await dClick($i('fx-go'));
    dm.textContent = 'العرض: تشخيص الاتصال أولًا: ping ثم منافذ المفتاح وجدول ARP.';
    await dClick($('[data-t="diag"]', host)); await dClick($i('fx-ping'));
    if (FS.v.conn === 'cable') await dClick($('[data-plug]', host)); else { await dSet($i('fx-prip'), '192.168.0.60'); await dClick($i('fx-prap')); }
    dm.textContent = 'العرض: جدول المراقبة يكشف القيمة الخاطئة، ثم نصحح نوعها في جدول الوسوم.';
    await dClick($('[data-t="watch"]', host)); await sleep(1500);
    await dClick($('[data-t="tags"]', host)); await dSet($(`#fx-tt tr[data-n="${FS.v.type}"] [data-f=type]`, host), 'Real');
    dm.textContent = 'العرض: نمط حقل Bottle_Count أضيق من القيمة.';
    await dClick($('[data-t="field"]', host)); await dSet($('tr[data-n="Bottle_Count"] [data-f=w]', tool), '8');
    dm.textContent = 'العرض: إعدادات الإنذار وفلتر Alarm Control.';
    await dClick($('[data-t="alarm"]', host));
    if (FS.v.alarm === 'bit') await dSet($i('fx-bit'), '4'); else await dSet($('[data-acf="Warning"]', tool), true);
    await sleep(1500);
  }, () => { FS.on = false; SCN.faults = null; log.innerHTML = ''; msg.textContent = ''; tool.innerHTML = ''; renderFx(); });
};

/* =====================================================================
   main loop + start
   ===================================================================== */
let tAcc = 0, rAcc = 0;
IL.animate($('.app'), dt => {
  step(dt); alarmTick(dt); if (ARCH.step) ARCH.step(dt);
  ovBuild(); ovUpdate();
  rAcc += dt; if (rAcc >= 0.25){ rAcc = 0; rtUpdate(); }
  tAcc += dt; if (tAcc >= 0.2 && CUR && TICK[CUR]){ TICK[CUR](tAcc); tAcc = 0; }
});
window.addEventListener('resize', () => ovBuild());
ovBuild(); ovUpdate(); rtUpdate();
const first = location.hash.slice(1);
show(G[first] ? first : 'tags');
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (G[h]) show(h); });
})();
