/* =====================================================================================
   Classic Control Lab — engine.js
   Shared by the hub (index.html) and every lesson-XX.html. No libraries, no build step.
   Load order in a lesson page:
       <link rel="stylesheet" href="engine.css">
       <script src="engine.js"></script>
       <div id="lesson"></div>
       <script> CL.lesson({...lesson data...}); </script>

   A NEW LESSON ONLY DECLARES DATA. Everything below is reusable.

   -------------------------------------------------------------------------------------
   1. LESSON DATA  —  CL.lesson(L)
   -------------------------------------------------------------------------------------
   L = {
     id:'l2', n:2, title:'The control relay', intro:'<p>…</p>',
     elements:[                                   // one card on the start screen each
       { id:'coil', title:'…', goal:'one line', icon:'pb'|'sel'|'ls'|'lamp'|'relay'|'k'|'timer'|'motor',
         steps:[                                  // one step per page, prev/next, progress bar
           {kind:'text',  title:'Definition', html:'<p>…</p>'},
           {kind:'art',   title:'Look and symbol', items:[{title, dev:DEVSPEC, nema:'pbNO', cap:'…'}]},
           {kind:'sim',   title:'Try it', sims:[{title, dev:DEVSPEC, note:'…'}]},
           {kind:'bench', title:'Wire it', ex:['a','b']},          // ids in L.exercises
           {kind:'quiz',  title:'Questions', qs:[{q:'…', a:['…','…','…'], c:1, why:'…', w:['why option 0 is wrong',…]}]}
         ]}
     ],
     exercises:{ a:EXERCISE, … }
   }
   Progress keys (localStorage 'classic-lab-v1', every access in try/catch):
     `${L.id}/v/${el}/${step}` step seen/used · `${L.id}/ex/${ex}` exercise passed · `${L.id}/q/${el}/${i}` quiz correct.
   CL.lesson() also writes {done,total} per lesson into the store so the hub can show progress.

   -------------------------------------------------------------------------------------
   2. DEVSPEC  —  {id:'S1', type:'pb', cfg:{…}, name:'Start button'}
   -------------------------------------------------------------------------------------
   Terminal ids everywhere are 'DEVID:TERM' (e.g. 'S1:13', 'Q1:L', 'K1:A1', 'M1:U1').
   Contact blocks: cfg.blocks = ['NO','NC', {k:'CO'} …]. Block i (1-based) is numbered like
   real devices: NO → i3-i4, NC → i1-i2, CO (changeover) → i1 common, i2 NC, i4 NO.
   Give {k:'NO', t:['53','54']} to force other numbers.

   type        terminals                                  state (st)                cfg
   supplyAC    L, N            (1-phase 230V + MCB)       on, trip                  v:230
   supplyDC    P24 (+24V), 0V  (PSU + fuse)               on, trip                  v:24
   supply3P    L1 L2 L3 N      (400V + main breaker)      on, trip
   mcb         1-2 (3-4, 5-6)  protective                  on, trip                  poles:1..3, label
   fuse        1-2 (3-4, 5-6)  protective                  trip (blown)              poles
   pb          blocks          momentary push              p (0/1), pin              color, label, blocks
   estop       blocks          latching mushroom           p                         blocks
   sel         blocks          maintained selector         pos (index)               pos:['0','I'], blocks:[{k,on:[posIdx…]}]
   ls          13-14 NO, 21-22 NC  roller lever            a (0/1), x (0..1 drawing) blocks, cart:'CART', at:0|1
   lamp        X1, X2          load                        burnt                     color, v (230|24)
   relay       A1, A2 + blocks coil load (default 2×CO)    coil                      v, blocks
   contactor   A1 A2, 1-2 3-4 5-6 (main), aux blocks      coil, closed              v, aux:['NO'], mech:'K2' (mech. interlock)
   timer       A1 A2 + 15-16-18 (on/off/cyc) | 17-18,17-28 (sd)   coil, el, out      mode:'on'|'off'|'cyc'|'sd', t, ton, toff, v
   ol          1-2 3-4 5-6, 95-96 NC, 97-98 NO            trip, heat                Ir (A)
   mpcb        1-2 3-4 5-6 (protective + thermal)         on, trip, heat            Ir (A)
   motor       U V W  or  U1 V1 W1 U2 V2 W2               run(±1/0), mode, fault    term:3|6, In (A), load (p.u.), look:'motor'|'pump', nameplate: kW vD vY cosf rpm ip cls duty
               (6 terminals: winding voltage vs vD → over (burns) / weak)
   cart        (no terminals) travel driven by a motor    x (0..1)                  motor:'M1', len (s end to end), sign
   tank        (no terminals) level driven by a pump      lvl (0..1)                pump:'M2', fill, drain
   level       13-14 NO, 21-22 NC  float/pressure switch  a, lvl (sim)             tank:'T1', at, hyst, look:'float'|'press', max (bar)
   prox        BN (+), BK (out), BU (−)  3-wire sensor      a (object), x           kind:'ind'|'cap'|'photo', pnp, nc, sn, cart, at
   Add your own with CL.defineType(name, def) — see TYPE CONTRACT below.

   -------------------------------------------------------------------------------------
   3. EXERCISE  (bench + checker)
   -------------------------------------------------------------------------------------
   {
     title:'…', task:'HTML of what to wire', tip:'…',
     devices:[DEVSPEC…],                       // laid out in this order on the bench
     solution:[['Q:L','S1:13'], …],            // “Show solution”
     seq:false,                                // true: cases run in order without reset (latching, timers)
     cases:[ {label:'Button pressed', set:{S1:{p:1}}, wait:0, expect:{H1:1, M1:'F'}} ],
        expect values: lamps/coils 1|0 ; motors 1 (runs) 0 (stopped) 'F' 'R' (direction) 'Y' 'D' (star/delta)
        wait: seconds of simulated time after `set` (timers, carts, overloads)
     patterns:[{sig:{H1:'0111'}, msg:'…'}],    // optional extra diagnoses, sig = expected-order 0/1 per case
     noWarnNeutral:false
   }
   CL.check(ex, wires) → {ok, msgs:[{lv:'bad'|'warn', t}], rows, lamps}
   Built-in diagnoses: no wires, short L–N (or L1–L2, +24V–0V) with the case where it happens,
   open circuit (which lamp terminal / which side is missing), NC used instead of NO and back,
   bypassed contact (always on), swapped lamps, loads in series, wrong voltage (burnt lamp/coil),
   switching the neutral (warning), motor direction / star–delta / single-phasing.

   -------------------------------------------------------------------------------------
   4. RUNTIME API
   -------------------------------------------------------------------------------------
   CL.makeDevice(spec)                    → device instance {id,type,tag,name,cfg,blocks,st}
   CL.solve(devs, wires, {trip, force})   → {energ:{id:bool}, volt:{id:V}, mot:{id:{run,dir,mode,fault,I}},
                                               short, tripped:[{dev,path}], find(node), poles(root), active:Set, stable}
        Iterates: coils energise → their contacts change → re-solve, until stable (relays, self-holding,
        interlocks). trip:true opens the first protective device on the short path (or the supply's breaker).
   CL.tick(devs, wires, dt)               → advances timers, overload heating, carts, tanks by dt seconds.
   CL.bench(host, ex, {key, onPass, onChange}) → wiring bench UI (click terminal → terminal, undo, clear,
        show solution, power, live operation, auto-check). Returns {devs, wires(), wire(a,b), power(on), act(id,act), destroy}.
   CL.sim(host, DEVSPEC, {onAct})         → interactive device: realistic drawing + IEC symbol + continuity + truth table.
   CL.quiz(host, qs, keyPrefix, onChange) → select-then-check quiz (marks show after «check»), correct answers saved.
   CL.sym.iec(dev|{act,blocks,tag}), CL.sym.nema(kind), CL.art.<name>(dev)   → SVG strings.
   CL.store.get/set/has/bench/summary/last/resetLesson
   CL.CURRICULUM                          → hub list (fundamentals, practical exercises, advanced).

   TYPE CONTRACT for CL.defineType(name, def) (all optional):
     terms(d)→[{n,lab}] · init(cfg)→st · blocks:true (uses cfg.blocks) · op(d,b)→bool (block operated)
     links(d)→[[t1,t2]] closed internal paths (defaults to the blocks) · loads(d)→[{a,b,k,v}] lamps/coils
     coil:true (load drives st.coil) · src(d,force)→[{t,p}] poles 'L1','L2','L3','N','P','M'
     protect:true (trippable) · motor:true (windings) · tick(d,dt,ctx)→changed · apply(d,set)
     bench(d,ctx)→{svg,hit,terms:{n:{x,y,dir,lab}}} in a 170·span × h cell · span(d) · h(d)
     art(d) · iec(d) · nema · states(d)→[{label,st}] · ctl:'hold'|'latch'|'sel'|'slider'|'toggle'
   ===================================================================================== */
(function(){
'use strict';
const CL = window.CL = {};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
CL.esc = esc;
/* fx-patch v1 */
const EV = {};
CL.on = (e, f) => { (EV[e] = EV[e] || []).push(f); return () => CL.off(e, f); };
CL.off = (e, f) => { EV[e] = (EV[e] || []).filter(x => x !== f); };
CL.emit = (e, d) => { (EV[e] || []).slice().forEach(f => { try { f(d); } catch (err) { if (typeof console !== 'undefined') console.error('CL.on(' + e + ')', err); } }); return d; };
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const r1 = v => Math.round(v*10)/10;
const r3 = v => Math.round(v*1000)/1000;

/* =========================== storage =========================== */
const KEY = 'classic-lab-v1';
let MEM = null;
function sload(){
  if (MEM) return MEM;
  let o = null;
  try { o = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(_) { o = null; }
  if (!o || typeof o !== 'object' || o.v !== 1) o = {v:1};
  ['p','bench','sum','last'].forEach(k => { if (!o[k] || typeof o[k] !== 'object') o[k] = {}; });
  MEM = o; return o;
}
function ssave(){ try { localStorage.setItem(KEY, JSON.stringify(sload())); } catch(_) {} }
CL.store = {
  KEY,
  get(k){ return sload().p[k]; },
  set(k, v){ const o = sload(); if (v === undefined || v === null || v === false) delete o.p[k]; else o.p[k] = v; ssave(); },
  has(k){ return !!sload().p[k]; },
  bench(k, w){ const o = sload(); if (w === undefined) return o.bench[k] || null; if (w === null) delete o.bench[k]; else o.bench[k] = w; ssave(); },
  summary(lid, done, total){ const o = sload(); if (done === undefined) return o.sum[lid] || null; o.sum[lid] = {done, total, t:Date.now()}; ssave(); },
  last(lid, v){ const o = sload(); if (v === undefined) return o.last[lid]; o.last[lid] = v; ssave(); },
  resetLesson(lid){ const o = sload(); Object.keys(o.p).forEach(k => { if (k.indexOf(lid+'/') === 0) delete o.p[k]; }); Object.keys(o.bench).forEach(k => { if (k.indexOf(lid+'/') === 0) delete o.bench[k]; }); delete o.sum[lid]; delete o.last[lid]; ssave(); }
};

/* =========================== curriculum (hub) =========================== */
CL.CURRICULUM = {
  fundamentals: [
    {n:1, id:'l1', file:'lesson-01.html', open:true, title:'Simple control devices', sub:'Switch, selector, push button, E-stop, limit switch, lamp, supply'},
    {n:2, id:'l2', file:'lesson-02.html', open:true, title:'Auxiliary relays and seal-in', sub:'The coil and CO contacts, 8/11/14-pin relays and sockets, seal-in (latching), and interlocks'},
    {n:3, id:'l3', file:'lesson-03.html', open:true, title:'The contactor', sub:'Power and auxiliary contacts, AC-1/AC-3, power and control circuits, and DOL with seal-in'},
    {n:4, id:'l4', file:'lesson-04.html', open:true, title:'Protection: fuses, breakers, overloads', sub:'Fuse types, MCB curves B/C/D, the thermal overload (Ir, class 10, 95-96 and 97-98, phase loss), MPCBs, and protecting a DOL circuit'},
    {n:5, id:'l5', file:'lesson-05.html', open:true, title:'Timers', sub:'On-delay, off-delay, cyclic and multi-function timers, and timer circuits: sequences, loops, the cart and the pump (practicals 14–24)'},
    {n:6, id:'l6', file:'lesson-06.html', open:true, title:'The 3-phase induction motor', sub:'Construction and the rotating field, the nameplate, star and delta terminal boxes, direction, power and current tables, cable size'},
    {n:7, id:'l7', file:'lesson-07.html', open:true, title:'Pressure, level switches and sensors', sub:'Pressure switches, float switches, PNP/NPN proximity sensors and photocells, in pump, compressor and conveyor circuits'},
    {n:8, id:'l8', file:'lesson-08.html', open:true, title:'Sequences, jogging and reversing (5–13)', sub:'Conditional starts, sequences, jogging, reversing with interlocks, a hoist with limit switches, and a lathe (practicals 5–13)'},
    {n:9, id:'l9', file:'lesson-09.html', open:true, title:'Advanced: star/delta, braking, HVAC, soft starters', sub:'Automatic and manual star/delta with a Y-Δ timer, DC and plugging braking and mechanical brakes, a central A/C compressor circuit on 24 V, and soft starters with bypass'}
  ],
  // exercise ids per lesson (the hub's completion certificate counts `${id}/ex/${x}` passes)
  exercises: {l1:['a','e','b','c','g','f1','f2','d1','d2','p'], l2:['r1','r2','r3','h1','h2','h3','h4','w','il'], l3:['c1','c2','c3','pf1','pf2','x1','x2','x3','x4'], l4:['p1','p2','o1','o2','o3','m1','w1','w2','w3'],
    l5:['e14','e15','e16','w1','w2','f1','c1','e21','e17','e18','e19','e20','e22','e23','e24'], l6:['m1','m7','m6','m2','m3','m4','m5'], l7:['s3','s1','s2','s5','s6','s4'], l8:['e5','e6','e7','e8','e9','w2','e10','w1','e11','e12','e13'],
    l9:['sd1','sd2','sd3','sd4','br1','br2','br3','ac1','ac2','ac3','ss1','ss2','ss3']},
  // practical exercises already covered: number → lesson deep link (element/step/exercise)
  practicalLinks: {1:'lesson-03.html#dol/4/x1', 2:'lesson-03.html#dol/4/x2', 3:'lesson-03.html#dol/4/x3', 4:'lesson-03.html#dol/4/x4',
    5:'lesson-08.html#cond/4/e5', 6:'lesson-08.html#cond/4/e6', 7:'lesson-08.html#cond/4/e7', 8:'lesson-08.html#cond/4/e8', 9:'lesson-08.html#jog/4/e9', 10:'lesson-08.html#rev/4/e10', 11:'lesson-08.html#rev/4/e11', 12:'lesson-08.html#rev/4/e12', 13:'lesson-08.html#lathe/4/e13',
    14:'lesson-05.html#ton/4/e14', 15:'lesson-05.html#ton/4/e15', 16:'lesson-05.html#ton/4/e16', 17:'lesson-05.html#cir/4/e17', 18:'lesson-05.html#cir/4/e18', 19:'lesson-05.html#cir/4/e19', 20:'lesson-05.html#cir/4/e20',
    21:'lesson-05.html#cyc/4/e21', 22:'lesson-05.html#cir/4/e22', 23:'lesson-05.html#cir/4/e23', 24:'lesson-05.html#cir/4/e24'},
  practicalGroups: [
    {title:'Start and stop from more than one place', from:1, to:4},
    {title:'Conditional and sequential starting', from:5, to:8},
    {title:'Jogging and reversing', from:9, to:13},
    {title:'Timer circuits', from:14, to:24}
  ],
  practical: [
    'One motor, start and stop from one place + pilot lamps',
    'One motor, start and stop from two places + pilot lamps',
    'One motor, start from 3 places and stop from one place + pilot lamps',
    'Two motors, each started and stopped on its own + pilot lamps',
    'Two motors: the first at any time, the second only while the first is running + lamps',
    '3 motors: the first at any time, the second only if the first runs, the third only if the second runs + lamps',
    'Two motors: the first at any time, the second only while the first is stopped + lamps',
    '3 motors: the first at any time, the second only if the first is stopped, the third only if the first runs',
    'One motor with start and stop + a double push button for short jogs + lamps',
    'One motor in two directions, stopped from one place + lamps',
    'One motor in two directions + end-of-travel limit switches (simple hoist) + lamps',
    'One motor in two directions, reversing directly without pressing Stop + lamps',
    'Lathe: a forward/reverse motor for turning and a forward/reverse motor to set the work height',
    'Two motors: the second starts automatically a set time after the first',
    'Like 14, but the first stops when the second starts',
    '3 motors: the second a set time after the first, the third a set time after the second',
    '3 motors: the first, then the second and the first stops, then the third and the second stops, then the first and the third stops… and so on, on a timer',
    '3 motors: press and the first and second start, after a time the first stops and the third starts, after another time everything stops automatically',
    '3 motors: the first starts, after a time the second and third, after another time the second and third stop',
    '3 motors: all start together, after a time the second and third stop, after a time the third comes back, after a time everything stops automatically',
    'Two motors: the first, after a time the second and the first stops, after a time the first and the second stops… and so on, for a limited time',
    'One motor forward and reverse in turn, with a set pause between directions',
    'Two motors: a cart on a conveyor stops at point B, the pump runs 3 seconds to fill the liquid, stops, and the cart returns to point A',
    'Two motors: the first from a switch, the second 5 s later, it stops after 5 s, restarts after 5 s, and after 5 s both stop'
  ],
  advanced: [ // trainer's decision (2026-10-20): 4 topics only, all in lesson 9
    {title:'Star / delta', sub:'Manual and automatic with a star/delta timer, and two faults: wrong links and a missing interlock', href:'lesson-09.html#sd/1', el:'sd'},
    {title:'Motor braking methods', sub:'DC braking with a rectifier, plugging with a timer, and a mechanical brake for a hoist', href:'lesson-09.html#br/1', el:'br'},
    {title:'Central A/C compressor control circuit', sub:'24 V transformer, thermostat, HP/LP, anti-short-cycle timer, and an HP alarm with reset', href:'lesson-09.html#ac/1', el:'ac'},
    {title:'The soft starter', sub:'Soft starter: the ramp, the bypass and the fault relay, and the bypass-from-START fault', href:'lesson-09.html#ss/1', el:'ss'}
  ]
};

/* =========================== small helpers =========================== */
const COL = {
  green:{b:'#1f9a4a',d:'#0f5f2c',l:'#7ee0a0',lens:'#36e070',off:'#2f5b3c'},
  red:{b:'#d22b2b',d:'#7d1414',l:'#ff9a90',lens:'#ff4a3d',off:'#6a2a28'},
  black:{b:'#2a2d30',d:'#0b0c0d',l:'#6d7378',lens:'#ddd',off:'#3a3c3e'},
  yellow:{b:'#f2c200',d:'#987800',l:'#ffe680',lens:'#ffc21a',off:'#6b5a1f'},
  amber:{b:'#f08a00',d:'#8a4f00',l:'#ffc266',lens:'#ff9f1a',off:'#6b4a1f'},
  blue:{b:'#1f6fd1',d:'#0f3e7a',l:'#8cbcf5',lens:'#4ea0ff',off:'#24405f'},
  white:{b:'#f1f1ec',d:'#8f8f88',l:'#ffffff',lens:'#fffbe6',off:'#77776f'}
};
const colOf = c => COL[c] || COL.green;
const GOOD = '#2b9a4a';

function normBlocks(list){
  return (list || []).map((b, i) => {
    if (typeof b === 'string') b = {k:b};
    const seq = b.seq || (i + 1), k = b.k;
    const t = b.t || (k === 'NO' ? [seq+'3', seq+'4'] : k === 'NC' ? [seq+'1', seq+'2'] : [seq+'1', seq+'2', seq+'4']);
    return Object.assign({}, b, {k, seq, t});
  });
}
function blockLinks(blocks, opFn, force){
  const out = [];
  blocks.forEach(b => {
    if (force){ if (b.k === 'CO'){ out.push([b.t[0],b.t[1]]); out.push([b.t[0],b.t[2]]); } else out.push([b.t[0], b.t[1]]); return; }
    const o = !!opFn(b);
    if (b.k === 'NO'){ if (o) out.push([b.t[0], b.t[1]]); }
    else if (b.k === 'NC'){ if (!o) out.push([b.t[0], b.t[1]]); }
    else if (b.k === 'CO'){ out.push(o ? [b.t[0], b.t[2]] : [b.t[0], b.t[1]]); }
  });
  return out;
}
CL.isJog = d => d.type === 'pb' && d.blocks.length > 1 && d.blocks.some(b => b.k === 'NO') && d.blocks.some(b => b.k === 'NC');
const blockTermList = blocks => { const s = []; blocks.forEach(b => b.t.forEach(t => s.push({n:t}))); return s; };
function blockClosed(b, op){ return b.k === 'NO' ? !!op : b.k === 'NC' ? !op : null; }
CL.blockClosed = blockClosed;

/* =========================== device types =========================== */
const TYPES = CL.TYPES = {};
CL.defineType = function(name, def){
  TYPES[name] = Object.assign({
    terms(d){ return this.blocks ? blockTermList(d.blocks) : []; },
    init(){ return {}; },
    apply(d, s){ Object.assign(d.st, s); },
    op(){ return false; },
    links(d, force){ return this.blocks ? blockLinks(d.blocks, b => this.op(d, b), force) : []; },
    span(){ return 1; }, h(){ return 208; }
  }, def);
};
CL.makeDevice = function(spec){
  const T = TYPES[spec.type];
  if (!T) throw new Error('unknown device type ' + spec.type);
  const cfg = Object.assign({}, T.def || {}, spec.cfg || {});
  const d = {id:spec.id, type:spec.type, tag:spec.tag || spec.id, name:spec.name || '', cfg, blocks:[], st:null};
  if (T.blocks) d.blocks = normBlocks(cfg.blocks);
  d.st = T.init(cfg, d);
  return d;
};
function resetDev(d){ d.st = TYPES[d.type].init(d.cfg, d); }

/* ---- supplies & protection ---- */
CL.defineType('supplyAC', {
  def:{v:230, label:'MCB C6'},
  terms(){ return [{n:'L', lab:'L'}, {n:'N', lab:'N'}]; },
  init(){ return {on:0, trip:0}; },
  src(d, force){ return (force || (d.st.on && !d.st.trip)) ? [{t:'L', p:'L1'}, {t:'N', p:'N'}] : []; },
  isSupply:true, h(){ return 150; }
});
CL.defineType('supplyDC', {
  def:{v:24, label:'24V DC'},
  terms(){ return [{n:'P24', lab:'+24V'}, {n:'0V', lab:'0V'}]; },
  init(){ return {on:0, trip:0}; },
  src(d, force){ return (force || (d.st.on && !d.st.trip)) ? [{t:'P24', p:'P'}, {t:'0V', p:'M'}] : []; },
  isSupply:true, h(){ return 150; }
});
CL.defineType('supply3P', {
  def:{v:400},
  terms(){ return [{n:'L1'}, {n:'L2'}, {n:'L3'}, {n:'N'}]; },
  init(){ return {on:0, trip:0}; },
  src(d, force){ return (force || (d.st.on && !d.st.trip)) ? [{t:'L1',p:'L1'},{t:'L2',p:'L2'},{t:'L3',p:'L3'},{t:'N',p:'N'}] : []; },
  isSupply:true, zone:'P', span(){ return 2; }, h(){ return 200; }
});
const poleTerms = n => { const a = []; for (let i = 0; i < n; i++) a.push({n:String(2*i+1)}, {n:String(2*i+2)}); return a; };
// rating (A) and curve of a breaker / fuse from cfg or its label ('C10', 'B6', '2A', 'gG 10A')
const ratingOf = d => d.cfg.In || parseFloat(String(d.cfg.label || '').replace(/[^\d.]/g, '')) || 10;
const curveOf = d => d.cfg.curve || ((/^[BCD]/.exec(String(d.cfg.label || '')) || ['C'])[0]);
const MAG = {B:4, C:8, D:15}; // instantaneous (magnetic) trip multiple used by the model (IEC 60898: B 3–5×, C 5–10×, D 10–20×)
CL.ratingOf = ratingOf; CL.curveOf = curveOf; CL.MAG = MAG;
// current through a protective device: open all its poles and see which running motor terminals lose their phase →
// those motors are fed through it (works for series chains Q1 → KM → F2 → M and parallel branches). sp = that motor is single-phasing.
function devCurrent(d, ctx){
  if (ctx.forceI != null) return {I:ctx.forceI, sp:!!ctx.forceSp};
  const res = ctx.res; let I = 0, sp = false, n = 0;
  if (!res || !res.edges) return {I, sp};
  const par = new Map();
  const find = x => { if (!par.has(x)) par.set(x, x); let r = x; while (par.get(r) !== r) r = par.get(r); let y = x; while (par.get(y) !== r){ const nx = par.get(y); par.set(y, r); y = nx; } return r; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) par.set(ra, rb); };
  res.edges.forEach(e => { if (e.own === 'd' && e.id === d.id) return; union(e.a, e.b); });
  const phased = new Set();
  ctx.devs.forEach(sd => { const T = TYPES[sd.type]; if (T.src) T.src(sd, false).forEach(x => { if (x.p in PHASES) phased.add(find(sd.id + ':' + x.t)); }); });
  ctx.devs.forEach(m => { const mm = res.mot[m.id]; if (!mm || !mm.I) return; let k = 0;
    TYPES[m.type].terms(m).forEach(x => { if (!mm.live || !mm.live.has(x.n)) return; if (phased.has(find(m.id + ':' + x.n))) return; k++; });
    if (!k) return; n += k; if (mm.fault === '1ph') sp = true;
    const ph = (m.cfg.term === 6 && mm.mode === 'D' && k <= 3) ? 1 / Math.sqrt(3) : 1; // a device on one side of the windings carries the phase current
    I = Math.max(I, mm.I * (m.cfg.In || 5) * ph); });
  return {I, sp: sp && n >= 1};
}
function protTick(d, dt, ctx){
  const T = d.type, was = d.st.trip;
  if (!ctx.res && ctx.forceI == null) return false;
  const c = devCurrent(d, ctx); d.st.I = c.I;
  const In = ratingOf(d), k = c.I / In;
  if (d.st.trip || (T === 'mcb' && !d.st.on)){ d.st.heat = Math.max(0, (d.st.heat || 0) - dt / 60); return false; }
  const tau = d.cfg.tau || (T === 'fuse' ? 60 : 100);
  if (T === 'mcb' && k >= MAG[curveOf(d)]){ d.st.trip = 1; d.st.on = 0; d.st.why = 'mag'; }
  else if (T === 'fuse' && d.cfg.kind === 'aM' ? k >= 6.3 : k > (T === 'fuse' ? 1.3 : 1.13)){ d.st.heat = Math.min(1, (d.st.heat || 0) + dt * (k*k - 1) / tau); if (d.st.heat >= 1){ d.st.trip = 1; if ('on' in d.st) d.st.on = 0; d.st.why = 'th'; } }
  else d.st.heat = Math.max(0, (d.st.heat || 0) - dt / 60);
  return was !== d.st.trip;
}
CL.defineType('mcb', {
  def:{poles:1, label:'C10'},
  terms(d){ return poleTerms(d.cfg.poles); },
  init(){ return {on:1, trip:0, heat:0, I:0, why:''}; },
  links(d, force){ if (!force && (!d.st.on || d.st.trip)) return []; const a = []; for (let i = 0; i < d.cfg.poles; i++) a.push([String(2*i+1), String(2*i+2)]); return a; },
  tick: protTick, protect:true, span(d){ return d.cfg.poles > 2 ? 2 : 1; }, h(){ return 170; },
  states(){ return [{label:'ON', st:{on:1, trip:0}}, {label:'OFF or TRIP', st:{on:0, trip:0}}]; }, ctl:'prot', art(d){ return CL.art.mcbArt(d); }
});
CL.defineType('fuse', {
  def:{poles:1, label:'2A', kind:'gG'},
  terms(d){ return poleTerms(d.cfg.poles); },
  init(){ return {on:1, trip:0, heat:0, I:0, why:''}; },
  links(d, force){ if (!force && d.st.trip) return []; const a = []; for (let i = 0; i < d.cfg.poles; i++) a.push([String(2*i+1), String(2*i+2)]); return a; },
  apply(d, s){ if (s.replace){ d.st.trip = 0; d.st.heat = 0; d.st.why = ''; } else Object.assign(d.st, s); },
  tick: protTick, protect:true, span(d){ return d.cfg.poles > 2 ? 2 : 1; }, h(){ return 170; },
  states(){ return [{label:'OK', st:{trip:0}}, {label:'Blown (melted)', st:{trip:1}}]; }, ctl:'prot', art(d){ return CL.art.fuseArt(d); }
});

/* ---- manual control devices ---- */
CL.defineType('pb', {
  def:{color:'green', label:'START', blocks:['NO']}, blocks:true,
  init(){ return {p:0, pin:0, mid:0}; },
  op(d, b){ if (d.st.mid) return !!(b && b.k === 'NC'); return !!(d.st.p || d.st.pin); }, // mid: released double-contact button, NO already open and NC not yet closed
  apply(d, s){ const was = TYPES.pb.op(d); Object.assign(d.st, s); if ('p' in s) d.st.pin = 0; if (was && !TYPES.pb.op(d) && CL.isJog(d)) d.st.mid = 1; },
  states(){ return [{label:'Released (not pressed)', st:{p:0}}, {label:'Pressed', st:{p:1}}]; },
  ctl:'hold', art(d){ return CL.art.pbSide(d); }, iecAct:'push', h(){ return 224; }
});
CL.defineType('estop', {
  def:{color:'red', label:'EMERGENCY', blocks:['NC']}, blocks:true,
  init(){ return {p:0}; },
  op(d){ return !!d.st.p; },
  states(){ return [{label:'Not pressed (ready)', st:{p:0}}, {label:'Pressed and latched', st:{p:1}}]; },
  ctl:'latch', art(d){ return CL.art.pbSide(d, true); }, iecAct:'mush', h(){ return 224; }
});
CL.defineType('sel', {
  def:{pos:['0','I'], blocks:[{k:'NO', on:[1]}]}, blocks:true,
  init(cfg){ return {pos:cfg.start || 0}; },
  op(d, b){ return (b.on || []).indexOf(d.st.pos) > -1; },
  states(d){ return d.cfg.pos.map((p, i) => ({label:'Position ' + p, st:{pos:i}})); },
  ctl:'sel', art(d){ return CL.art.selFront(d); }, iecAct:'turn', h(){ return 224; }
});
CL.defineType('ls', {
  def:{blocks:['NO','NC']}, blocks:true,
  init(){ return {a:0, x:0}; },
  op(d){ return !!d.st.a; },
  apply(d, s){ Object.assign(d.st, s); if ('a' in s && !('x' in s)) d.st.x = s.a ? 1 : 0; },
  states(){ return [{label:'Cart away', st:{a:0, x:0}}, {label:'Cart pressing the roller', st:{a:1, x:1}}]; },
  tick(d, dt, ctx){
    if (!d.cfg.cart) return false;
    const c = ctx.byId[d.cfg.cart]; if (!c) return false;
    const at = d.cfg.at == null ? 1 : d.cfg.at, x = c.st.x;
    const a = at >= 0.5 ? (x >= at - 0.025 ? 1 : 0) : (x <= at + 0.025 ? 1 : 0);
    const lx = at >= 0.5 ? clamp((x - (at - 0.08)) / 0.08, 0, 1) : clamp(((at + 0.08) - x) / 0.08, 0, 1);
    const ch = a !== d.st.a; d.st.a = a; d.st.x = lx; return ch;
  },
  ctl:'slider', art(d){ return CL.art.lsScene(d); }, iecAct:'roll'
});
CL.defineType('level', {
  def:{blocks:['NO','NC'], at:0.8, hyst:0.05, look:'float', max:10}, blocks:true,
  init(cfg){ return {a:cfg.a0 ? 1 : 0, lvl:cfg.lvl0 == null ? 0.5 : cfg.lvl0}; }, // a0: starts operated (the linked tank starts above the set point)
  op(d){ return !!d.st.a; },
  states(){ return [{label:'Below the set point', st:{a:0}}, {label:'Reached the set point', st:{a:1}}]; },
  tick(d, dt, ctx){ const t = ctx.byId[d.cfg.tank]; if (!t) return false; const a = TYPES.level.aOf(d, t.st.lvl); const ch = a !== d.st.a; d.st.a = a; d.st.lvl = t.st.lvl; return ch; },
  aOf(d, v){ const h = d.cfg.hyst || 0.05; if (d.cfg.below) return v <= d.cfg.at ? 1 : (v > d.cfg.at + h ? 0 : d.st.a); return v >= d.cfg.at ? 1 : (v < d.cfg.at - h ? 0 : d.st.a); },
  setLevel(d, v){ d.st.lvl = v; d.st.a = TYPES.level.aOf(d, v); },
  ctl:'level', iecAct(d){ return d.cfg.look === 'press' ? 'press' : d.cfg.look === 'thermo' ? 'thermo' : 'float'; }, art(d){ return CL.art.levelArt(d); }, h(){ return 224; }
});

/* ---- loads ---- */
CL.defineType('lamp', {
  def:{color:'green', v:230},
  terms(){ return [{n:'X1'}, {n:'X2'}]; },
  init(){ return {burnt:0}; },
  loads(d){ return [{a:'X1', b:'X2', k:'lamp', v:d.cfg.v}]; },
  states(){ return [{label:'No voltage', st:{v:0}}, {label:'Energised', st:{v:1}}]; },
  ctl:'toggle', art(d){ return CL.art.lampArt(d); }
});
CL.defineType('relay', {
  def:{v:230, blocks:['CO','CO']}, blocks:true, coil:true,
  terms(d){ return [{n:'A1'}, {n:'A2'}].concat(blockTermList(d.blocks)); },
  init(){ return {coil:0, burnt:0}; },
  op(d){ return !!d.st.coil; },
  loads(d){ return [{a:'A1', b:'A2', k:'coil', v:d.cfg.v}]; },
  states(){ return [{label:'Coil not energised', st:{coil:0}}, {label:'Coil energised (A1-A2)', st:{coil:1}}]; },
  ctl:'hold', holdLabel:'Press and hold: energise coil A1-A2', art(d){ return CL.art.relayArt(d); }, iecAct:'coil',
  span(){ return 2; }
});
CL.defineType('contactor', {
  def:{v:230, aux:['NO'], model:'MC-9b', ac3:'9A · 4kW'}, coil:true,
  terms(d){ return [{n:'A1'},{n:'A2'},{n:'1',lab:'1/L1'},{n:'2',lab:'2/T1'},{n:'3',lab:'3/L2'},{n:'4',lab:'4/T2'},{n:'5',lab:'5/L3'},{n:'6',lab:'6/T3'}].concat(blockTermList(d.blocks)); },
  init(){ return {coil:0, closed:0, burnt:0}; },
  op(d){ return !!d.st.closed; },
  links(d, force){
    const a = (force || d.st.closed) ? [['1','2'],['3','4'],['5','6']] : [];
    return a.concat(blockLinks(d.blocks, () => !!d.st.closed, force));
  },
  loads(d){ return [{a:'A1', b:'A2', k:'coil', v:d.cfg.v}]; },
  states(){ return [{label:'Coil not energised', st:{coil:0, closed:0}}, {label:'Coil energised (A1-A2)', st:{coil:1, closed:1}}]; },
  mains:[{k:'NO', t:['1','2'], main:true}, {k:'NO', t:['3','4'], main:true}, {k:'NO', t:['5','6'], main:true}], zone:'P',
  ctl:'hold', holdLabel:'Press and hold: energise coil A1-A2', art(d){ return CL.art.contactorArt(d); }, iecAct:'coil',
  span(){ return 2; }, h(d){ return d.blocks.length > 2 ? 258 : 208; }
});
TYPES.contactor.init = function(cfg, d){ if (d) d.blocks = normBlocks(cfg.aux); return {coil:0, closed:0, burnt:0}; };
CL.TIMER_MODES = {on:'ON-DELAY', off:'OFF-DELAY', cyc:'FLASHER', sd:'STAR-DELTA'};
CL.TIMER_MODES_AR = {on:'On-delay', off:'Off-delay', cyc:'Cyclic (flasher)', sd:'Star / delta'};
CL.defineType('timer', {
  // mode on|off|cyc|sd · t (s) · ton/toff (cyc) · inst: extra instantaneous CO 21-22-24 · multi: mode knob on the bench/sim
  def:{v:230, mode:'on', t:5, ton:1, toff:1, inst:false, multi:false, model:'RE22R', range:'1–60 s'}, coil:true,
  terms(d){ const a = d.cfg.mode === 'sd' ? [{n:'A1'},{n:'A2'},{n:'17'},{n:'18'},{n:'28'}] : [{n:'A1'},{n:'A2'},{n:'15'},{n:'16'},{n:'18'}]; return d.cfg.inst ? a.concat([{n:'21'},{n:'22'},{n:'24'}]) : a; },
  init(){ return {coil:0, el:0, out:0, burnt:0}; },
  op(d){ return !!d.st.out; },
  links(d, force){
    const inst = d.cfg.inst ? (force ? [['21','22'],['21','24']] : [d.st.coil ? ['21','24'] : ['21','22']]) : [];
    if (d.cfg.mode === 'sd'){
      if (force) return [['17','18'],['17','28']].concat(inst);
      const a = [];
      if (d.st.coil && d.st.el < d.cfg.t) a.push(['17','18']);
      if (d.st.coil && d.st.el >= d.cfg.t + 0.05) a.push(['17','28']);
      return a.concat(inst);
    }
    if (force) return [['15','16'],['15','18']].concat(inst);
    return (d.st.out ? [['15','18']] : [['15','16']]).concat(inst);
  },
  loads(d){ return [{a:'A1', b:'A2', k:'coil', v:d.cfg.v}]; },
  apply(d, s){ s = s || {}; if ('t' in s) d.cfg.t = s.t; if ('mode' in s) d.cfg.mode = s.mode; Object.keys(s).forEach(k => { if (k !== 't' && k !== 'mode') d.st[k] = s[k]; }); },
  states(d){
    const m = d.cfg.mode;
    if (m === 'off') return [{label:'Coil not energised (not started yet)', st:{coil:0, out:0, el:0}}, {label:'Coil energised', st:{coil:1, out:1, el:0}}, {label:'Supply removed, time counting', st:{coil:0, out:1, el:0}}, {label:'Time elapsed (t)', st:{coil:0, out:0, el:0}}];
    if (m === 'cyc') return [{label:'Coil not energised', st:{coil:0, out:0, el:0}}, {label:'ON period (ton)', st:{coil:1, out:1, el:0}}, {label:'OFF period (toff)', st:{coil:1, out:0, el:0}}];
    return [{label:'Coil not energised', st:{coil:0, out:0, el:0}}, {label:'Coil energised, time counting', st:{coil:1, out:0, el:0}}, {label:'Time elapsed (t)', st:{coil:1, out:1, el:0}}];
  },
  ctl:'timer', art(d, o){ return CL.art.timerArt(d, o); },
  onCoil(d, on){
    const m = d.cfg.mode;
    if (m === 'off'){ if (on){ d.st.out = 1; d.st.el = 0; } }
    else if (on){ d.st.el = 0; if (m === 'cyc') d.st.out = 1; }
    else { d.st.el = 0; d.st.out = 0; }
  },
  tick(d, dt){
    dt = Math.round(dt * 1000) / 1000;
    const m = d.cfg.mode, s = d.st, o = s.out, sd0 = m === 'sd' ? (s.el < d.cfg.t) + 2*(s.el >= d.cfg.t + 0.05) : 0;
    if (m === 'on'){ if (s.coil){ s.el = r3(s.el + dt); s.out = s.el >= d.cfg.t ? 1 : 0; } }
    else if (m === 'off'){ if (!s.coil && s.out){ s.el = r3(s.el + dt); if (s.el >= d.cfg.t){ s.out = 0; s.el = 0; } } }
    else if (m === 'cyc'){ if (s.coil){ s.el = r3(s.el + dt); const per = d.cfg.ton + d.cfg.toff; s.out = (s.el % per) < d.cfg.ton ? 1 : 0; } }
    else if (m === 'sd'){ if (s.coil) s.el = r3(s.el + dt); const sd1 = (s.el < d.cfg.t) + 2*(s.el >= d.cfg.t + 0.05); return sd1 !== sd0; }
    return s.out !== o;
  },
  span(){ return 1; }
});
CL.OL_TAU = 250; // thermal time constant (s): trip time ≈ tau / (k² − 1), k = I / Ir
CL.olTripTime = (k, sp) => k <= 1.05 ? Infinity : CL.OL_TAU / (k*k - 1) / (sp ? 3 : 1);
function heatTick(d, dt, ctx){
  if (!ctx.res && ctx.forceI == null) return false;
  const c = devCurrent(d, ctx); d.st.I = c.I; d.st.sp = c.sp ? 1 : 0;
  const k = c.I / (d.cfg.Ir || 5), was = d.st.trip, tau = d.cfg.tau || CL.OL_TAU;
  if (d.type === 'mpcb' && !d.st.trip && d.st.on && k >= 12){ d.st.trip = 1; d.st.on = 0; d.st.why = 'mag'; return true; }
  if (k > 1.05 && !(d.type === 'mpcb' && (!d.st.on || d.st.trip))) d.st.heat = Math.min(1, d.st.heat + dt * (k*k - 1) * (c.sp ? 3 : 1) / tau);
  else d.st.heat = Math.max(0, d.st.heat - dt / 60); // cools in about a minute
  if (d.st.heat >= 1 && !d.st.trip){ d.st.trip = 1; d.st.why = c.sp ? 'sp' : 'th'; if (d.type === 'mpcb') d.st.on = 0; }
  if (d.st.trip && d.cfg.reset === 'auto' && d.st.heat < 0.5){ d.st.trip = 0; d.st.why = ''; }
  return was !== d.st.trip;
}
function olApply(d, s){
  if (s.reset){ if (d.st.heat < 0.6){ d.st.trip = 0; d.st.why = ''; if ('on' in d.st) d.st.on = 1; } }
  else if (s.test){ d.st.trip = 1; d.st.why = 'test'; if ('on' in d.st) d.st.on = 0; }
  else Object.assign(d.st, s);
}
CL.defineType('ol', {
  def:{Ir:5, cls:10, reset:'man'},
  terms(){ return [{n:'1'},{n:'2'},{n:'3'},{n:'4'},{n:'5'},{n:'6'},{n:'95'},{n:'96'},{n:'97'},{n:'98'}]; },
  init(){ return {trip:0, heat:0, I:0, sp:0, why:''}; },
  links(d, force){ const a = [['1','2'],['3','4'],['5','6']]; if (force) return a.concat([['95','96'],['97','98']]); a.push(d.st.trip ? ['97','98'] : ['95','96']); return a; },
  apply: olApply, tick: heatTick, zone:'P', span(){ return 2; },
  states(){ return [{label:'Normal (cold)', st:{trip:0}}, {label:'Tripped (TRIP)', st:{trip:1}}]; },
  ctl:'ol', art(d){ return CL.art.olArt(d); }
});
CL.defineType('mpcb', {
  def:{Ir:5, label:'GV2ME', aux:true},
  terms(d){ return poleTerms(3).concat(d.cfg.aux ? [{n:'13'},{n:'14'},{n:'21'},{n:'22'}] : []); },
  init(){ return {on:1, trip:0, heat:0, I:0, sp:0, why:''}; },
  links(d, force){ const on = d.st.on && !d.st.trip; const a = (force || on) ? [['1','2'],['3','4'],['5','6']] : []; if (d.cfg.aux){ if (force || on) a.push(['13','14']); if (force || !on) a.push(['21','22']); } return a; },
  apply: olApply, protect:true, tick: heatTick, zone:'P', span(){ return 2; }, h(){ return 180; },
  states(){ return [{label:'ON (running)', st:{on:1, trip:0}}, {label:'Tripped or OFF', st:{on:0, trip:0}}]; },
  ctl:'ol', art(d){ return CL.art.mpcbArt(d); }
});

/* ---- motors and processes ---- */
CL.defineType('motor', {
  def:{term:3, In:5, load:0.8, look:'motor', kW:2.2, tStart:1, inrush:6, vD:400, vY:690, cosf:0.82, rpm:1430, ip:'IP55', cls:'F', duty:'S1', model:'1LE1', poles:4},
  terms(d){ return d.cfg.term === 6 ? [{n:'U1'},{n:'V1'},{n:'W1'},{n:'U2'},{n:'V2'},{n:'W2'}] : [{n:'U'},{n:'V'},{n:'W'}]; },
  init(cfg){ return {run:0, mode:'', fault:'', ang:0, tr:0, load:cfg.load, hot:0, burnt:0, spd:0, stall:0, brake:0, vfrac:1}; },
  motor:true, zone:'P',
  // speed model (p.u.): accelerates in tStart (slower in star, follows a soft starter's ramp), coasts down in cfg.coast s, DC braking in cfg.tBrake s,
  // plugging (reverse while turning) decelerates at 1/tStart, a spring brake on cfg-linked `brake` device locks the shaft (locked rotor if powered)
  tick(d, dt, ctx){
    const was = d.st.tr, sp0 = d.st.spd || 0, m = ctx && ctx.res && ctx.res.mot && ctx.res.mot[d.id], tS = d.cfg.tStart || 1;
    const brk = ctx && ctx.devs && ctx.devs.find(x => x.type === 'brake' && x.cfg.motor === d.id), locked = !!(brk && !brk.st.coil);
    let spd = sp0;
    if (d.st.run){
      d.st.tr = r3(d.st.tr + dt);
      if (locked){ spd = 0; d.st.stall = 1; }
      else { d.st.stall = 0; const vf = d.st.vfrac == null ? 1 : d.st.vfrac, target = d.st.run * Math.min(1, vf), rate = dt / tS / (d.st.mode === 'Y' ? 2 : 1); spd += clamp(target - spd, -rate, rate); }
      if (m && m.over){ d.st.hot = r3((d.st.hot || 0) + dt); if (d.st.hot >= CL.MOTOR_BURN_S && !d.st.burnt){ d.st.burnt = 1; d.st.fault = 'burn'; } }
    } else {
      d.st.tr = 0; d.st.stall = 0;
      if (locked) spd = 0;
      else if (d.st.brake) spd = Math.sign(spd) * Math.max(0, Math.abs(spd) - dt / (d.cfg.tBrake || 0.8));
      else spd = Math.sign(spd) * Math.max(0, Math.abs(spd) - dt / (d.cfg.coast || 6));
    }
    d.st.spd = r3(spd);
    if (spd) d.st.ang = (d.st.ang + spd * dt * (d.st.mode === 'Y' ? 400 : 720) + 360) % 360;
    return !!d.st.run || spd !== sp0 || was !== 0;
  },
  span(d){ return d.cfg.term === 6 ? 2 : 1; }
});
CL.MOTOR_BURN_S = 30; // seconds of over-voltage on the windings before the motor burns
CL.defineType('cart', {
  def:{motor:'M1', len:6, sign:1, labA:'A', labB:'B'},
  init(cfg){ return {x:cfg.x0 || 0, crash:0}; },
  tick(d, dt, ctx){
    const m = ctx.res && ctx.res.mot[d.cfg.motor]; if (!m || !m.run) return false;
    const x0 = d.st.x; d.st.x = clamp(d.st.x + m.dir * d.cfg.sign * dt / d.cfg.len, -0.04, 1.04);
    d.st.crash = (d.st.x <= -0.04 || d.st.x >= 1.04) ? 1 : 0;
    return d.st.x !== x0;
  },
  zone:'P', span(){ return 2; }, h(){ return 150; }
});
CL.defineType('tank', {
  def:{pump:'M2', fill:0.25, drain:0},
  init(cfg){ return {lvl:cfg.lvl0 || 0}; },
  tick(d, dt, ctx){
    const m = ctx.res && ctx.res.mot[d.cfg.pump]; const l0 = d.st.lvl;
    d.st.lvl = clamp(d.st.lvl + ((m && m.run) ? d.cfg.fill : 0) * dt - d.cfg.drain * dt, 0, 1);
    return d.st.lvl !== l0;
  },
  zone:'P', h(){ return 208; }
});
/* ---- terminal strip X1: n numbered pass-through terminals (top screw ia, bottom screw ib) with optional bridges ---- */
CL.defineType('tb', {
  def:{n:6, bridges:[], labels:{}, zone:'C'},
  terms(d){ const a = []; for (let i = 1; i <= d.cfg.n; i++){ const lab = d.cfg.labels[i] || String(i); a.push({n:i + 'a', lab}, {n:i + 'b', lab}); } return a; },
  init(){ return {}; },
  links(d){ const a = []; for (let i = 1; i <= d.cfg.n; i++) a.push([i + 'a', i + 'b']); (d.cfg.bridges || []).forEach(b => { for (let i = 0; i < b.length - 1; i++) a.push([b[i] + 'a', b[i+1] + 'a']); }); return a; },
  span(d){ return d.cfg.n > 6 ? 2 : 1; }, h(){ return 132; },
  bench(d, ctx){
    const w = ctx.w || CW * this.span(d), n = d.cfg.n, sp = Math.min(26, (w - 30) / n), x0 = w / 2 - (n - 1) / 2 * sp, terms = {};
    let s = cellHead(d, 'Terminal block', w) + `<rect x="${x0 - 14}" y="30" width="${(n - 1) * sp + 28}" height="86" rx="3" fill="#8f979c" stroke="#4b5257"/>`;
    for (let i = 1; i <= n; i++){ const x = x0 + (i - 1) * sp, lab = d.cfg.labels[i] || String(i);
      s += `<rect x="${x - sp/2 + 1}" y="32" width="${sp - 2}" height="82" rx="2" fill="#d9dcde" stroke="#6d7479"/><text x="${x}" y="77" font-size="${lab.length > 2 ? 8 : 10}" font-weight="700" text-anchor="middle" fill="#1d2226">${esc(lab)}</text>`;
      terms[i + 'a'] = {x, y:46, dir:-1}; terms[i + 'b'] = {x, y:100, dir:1}; }
    (d.cfg.bridges || []).forEach(b => { const xa = x0 + (b[0] - 1) * sp, xb = x0 + (b[b.length - 1] - 1) * sp; s += `<rect x="${xa - 5}" y="60" width="${xb - xa + 10}" height="6" rx="2" fill="#b87333" stroke="#5a3410"/>`; });
    return {svg:s, hit:'', terms};
  }
});

/* =========================== solver =========================== */
const PHASES = {L1:0, L2:1, L3:2};
function voltBetween(p, q){
  if (p === q) return 0;
  const a = p in PHASES, b = q in PHASES;
  if (a && b) return 400;
  if ((a && q === 'N') || (b && p === 'N')) return 230;
  if ((p === 'P' && q === 'M') || (p === 'M' && q === 'P')) return 24;
  if ((p === 'S' && q === 'T') || (p === 'T' && q === 'S')) return 24;
  return 0;
}
CL.voltBetween = voltBetween;
function maxVolt(pa, pb){ let v = 0; if (!pa || !pb) return 0; pa.forEach(p => pb.forEach(q => { v = Math.max(v, voltBetween(p, q)); })); return v; }

function solveOnce(devs, wires, force){
  const par = new Map();
  const find = x => { if (!par.has(x)) return x; let r = x; while (par.get(r) !== r) r = par.get(r); let y = x; while (par.get(y) !== r){ const n = par.get(y); par.set(y, r); y = n; } return r; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) par.set(ra, rb); };
  devs.forEach(d => TYPES[d.type].terms(d).forEach(t => { const n = d.id + ':' + t.n; par.set(n, n); }));
  const edges = [];
  wires.forEach(w => { if (par.has(w.a) && par.has(w.b)){ edges.push({a:w.a, b:w.b, own:'w', id:w.id}); } });
  devs.forEach(d => { (TYPES[d.type].links(d, !!force) || []).forEach(([x, y]) => { const a = d.id+':'+x, b = d.id+':'+y; if (par.has(a) && par.has(b)) edges.push({a, b, own:'d', id:d.id}); }); });
  edges.forEach(e => union(e.a, e.b));
  const poles = new Map(), srcN = [];
  devs.forEach(d => { const T = TYPES[d.type]; if (T.src) T.src(d, !!force).forEach(s => { const n = d.id+':'+s.t; srcN.push({n, p:s.p, dev:d.id}); const r = find(n); if (!poles.has(r)) poles.set(r, new Set()); poles.get(r).add(s.p); }); });
  // short circuit: one node with two different poles
  let short = null;
  for (const [r, s] of poles) if (s.size > 1){ short = {root:r, poles:[...s]}; break; }
  if (short){
    // shortest path between two sources of different poles → which wires / device carried it
    const adj = new Map(); edges.forEach((e, i) => { [e.a, e.b].forEach(n => { if (!adj.has(n)) adj.set(n, []); }); adj.get(e.a).push([e.b, i]); adj.get(e.b).push([e.a, i]); });
    const starts = srcN.filter(s => find(s.n) === short.root);
    const p0 = starts[0];
    const targets = new Set(starts.filter(s => s.p !== p0.p).map(s => s.n));
    const prev = new Map([[p0.n, null]]), q = [p0.n]; let hit = null;
    while (q.length){ const n = q.shift(); if (targets.has(n)){ hit = n; break; } (adj.get(n) || []).forEach(([m, ei]) => { if (!prev.has(m)){ prev.set(m, [n, ei]); q.push(m); } }); }
    const path = [];
    for (let n = hit; n && prev.get(n); n = prev.get(n)[0]) path.unshift(edges[prev.get(n)[1]]);
    short.path = path; short.from = p0;
    let prot = null, pr = 1e9;
    path.forEach(e => { if (e.own !== 'd') return; const d = devs.find(x => x.id === e.id); if (!TYPES[d.type].protect) return; const r = d.type === 'mpcb' ? (d.cfg.Ir || 5) * 12 : ratingOf(d); if (r <= pr){ pr = r; prot = e; } });
    short.trip = prot ? prot.id : p0.dev;
    short.wires = path.filter(e => e.own === 'w').map(e => e.id);
  }
  // loads
  const energ = {}, volt = {}, active = new Set(), over = [], energT = {};
  devs.forEach(d => { const T = TYPES[d.type]; if (!T.loads) return; T.loads(d).forEach(L => {
    const ra = find(d.id+':'+L.a), rb = find(d.id+':'+L.b);
    const V = ra === rb ? 0 : maxVolt(poles.get(ra), poles.get(rb));
    volt[d.id] = V;
    let on = V >= 0.75 * (L.v || 230) && !d.st.burnt;
    if (V > 1.3 * (L.v || 230)){ over.push({dev:d.id, V}); on = false; }
    energ[d.id] = on; energT[d.id + ':' + L.a] = on;
    if (on){ active.add(ra); active.add(rb); }
  }); });
  // motors
  const mot = {};
  devs.forEach(d => { if (!TYPES[d.type].motor) return;
    const ph = n => { const s = poles.get(find(d.id+':'+n)); if (!s) return null; for (const p of s) if (p in PHASES) return p; return null; };
    let r = {run:0, dir:0, mode:'', fault:'', I:0, spd:d.st.spd || 0};
    if (d.st.burnt){ r.fault = 'burn'; r.live = new Set(); mot[d.id] = r; return; }
    if (d.cfg.term === 6){
      const a = [ph('U1'), ph('V1'), ph('W1')], b = [ph('U2'), ph('V2'), ph('W2')];
      const rs = ['U2','V2','W2'].map(n => find(d.id+':'+n));
      const starPt = rs[0] === rs[1] && rs[1] === rs[2] && !poles.get(rs[0]);
      const wv = [0,1,2].map(i => a[i] && b[i] && a[i] !== b[i]);
      if (a.every(Boolean) && new Set(a).size === 3 && starPt) r.mode = 'Y';
      else if (wv.every(Boolean) && new Set(a).size === 3) r.mode = 'D';
      if (r.mode){ r.run = 1; r.dir = seqDir(a); }
      else if (a.filter(Boolean).length + wv.filter(Boolean).length >= 2 && (wv.some(Boolean) || new Set(a.filter(Boolean)).size >= 2)) r.fault = '1ph';
    } else {
      const a = [ph('U'), ph('V'), ph('W')];
      const k = new Set(a.filter(Boolean)).size;
      if (a.every(Boolean) && k === 3){ r.run = 1; r.dir = seqDir(a); r.mode = 'D'; }
      else if (k === 2) r.fault = '1ph';
      else if (!k){ const dc = ['U','V','W'].map(n => { const s = poles.get(find(d.id+':'+n)); return s ? [...s] : []; }); if (dc.some(x => x.indexOf('P') > -1) && dc.some(x => x.indexOf('M') > -1)) r.brake = 1; } // DC injection on two windings
    }
    const pu = d.st.load != null ? d.st.load : (d.cfg.load || 0);
    if (r.run && d.cfg.term === 6){ const vw = r.mode === 'Y' ? 230 : 400, vD = d.cfg.vD || 400; r.vw = vw; r.kv = r3(vw / vD); if (r.kv > 1.4) r.over = 1; else if (r.kv < 0.7) r.weak = 1; }
    const starting = d.st.tr < (d.cfg.tStart || 1) || !!d.st.stall;
    r.I = r.run ? (starting ? (d.cfg.inrush || 6) * (r.mode === 'Y' && r.weak ? 1 / 3 : 1) : pu * (r.over ? 4 : 1) * (r.weak ? 0.6 : 1)) : r.fault === '1ph' ? 2.2 : r.brake ? 0.6 : 0;
    r.start = r.run && starting;
    if (r.run){ const mr = new Set(TYPES[d.type].terms(d).map(t => find(d.id+':'+t.n))); devs.forEach(x => { if (x.type === 'softstarter' && x.st.v > 0 && x.st.v < 1 && ['T1','T2','T3'].some(t => mr.has(find(x.id+':'+t)))){ r.vfrac = x.st.v; r.I = Math.min(r.I, x.cfg.ilim || 3.5); r.start = true; } }); }
    r.live = new Set(TYPES[d.type].terms(d).map(t => t.n).filter(n => ph(n)));
    if (r.run || r.fault || r.brake) TYPES[d.type].terms(d).forEach(t => active.add(find(d.id+':'+t.n)));
    mot[d.id] = r;
  });
  return {find, poles:r => poles.get(r), polesMap:poles, short, energ, energT, volt, active, mot, over, edges};
}
function seqDir(a){ const i = a.map(p => PHASES[p]); return ((i[1]-i[0]+3)%3 === 1 && (i[2]-i[1]+3)%3 === 1) ? 1 : -1; }

CL.solve = function(devs, wires, opt){
  opt = opt || {};
  let res = null; const tripped = [], burnt = [];
  let stable = false;
  for (let it = 0; it < 60; it++){
    res = solveOnce(devs, wires, opt.force);
    if (res.short && opt.trip){
      const d = devs.find(x => x.id === res.short.trip);
      if (d && !d.st.trip){ d.st.trip = 1; d.st.why = 'short'; if ('on' in d.st) d.st.on = 0; tripped.push({dev:d.id, path:res.short.path, wires:res.short.wires, poles:res.short.poles}); continue; }
    }
    if (opt.trip && res.over.length){
      res.over.forEach(o => { const d = devs.find(x => x.id === o.dev); if (d && !d.st.burnt){ d.st.burnt = 1; burnt.push(o); } });
    }
    if (opt.force) { stable = true; break; }
    let ch = false;
    devs.forEach(d => { const T = TYPES[d.type]; if (!T.coil) return;
      const e = !!res.energ[d.id];
      if (!!d.st.coil !== e){ d.st.coil = e ? 1 : 0; if (T.onCoil) T.onCoil(d, e); ch = true; }
      if (d.type === 'contactor'){
        const partner = d.cfg.mech && devs.find(x => x.id === d.cfg.mech);
        const cl = d.st.coil && !(partner && partner.st.closed) ? 1 : 0;
        if (cl !== d.st.closed){ d.st.closed = cl; ch = true; }
      }
      if (T.onSolve && T.onSolve(d, res)) ch = true;
    });
    devs.forEach(d => { if (TYPES[d.type].motor){ const m = res.mot[d.id]; d.st.run = m.run ? m.dir : 0; if (d.st.mode === 'Y' && m.mode === 'D') d.st.tr = Math.max(0, (d.cfg.tStart || 1) - 0.3); d.st.mode = m.mode; d.st.fault = m.fault; d.st.brake = m.brake ? 1 : 0; d.st.vfrac = m.vfrac == null ? 1 : m.vfrac; } });
    if (!ch){ stable = true; break; }
  }
  res.tripped = tripped; res.burnt = burnt; res.stable = stable;
  return res;
};
// advance simulated time; call CL.solve afterwards (CL.run does both)
CL.tick = function(devs, wires, dt, res){
  const byId = {}; devs.forEach(d => byId[d.id] = d);
  const ctx = {byId, devs, res: res || CL.solve(devs, wires, {})};
  let ch = false;
  ['motor','cart','tank'].forEach(ty => devs.forEach(d => { if (d.type === ty && TYPES[ty].tick(d, dt, ctx)) ch = true; }));
  devs.forEach(d => { const T = TYPES[d.type]; if (T.tick && ['motor','cart','tank'].indexOf(d.type) < 0 && T.tick(d, dt, ctx)) ch = true; });
  return ch;
};
CL.run = function(devs, wires, seconds, opt){
  let res = CL.solve(devs, wires, opt || {trip:true});
  const dt = 0.05; let t = 0;
  while (t < seconds - 1e-9){ CL.tick(devs, wires, dt, res); res = CL.solve(devs, wires, opt || {trip:true}); t += dt; }
  return res;
};

/* =========================== trip explanations =========================== */
CL.tripText = function(d){
  const w = d.st.why, I = r1(d.st.I || d.st.Ipk || 0), tag = d.tag;
  if (d.type === 'ol' || d.type === 'mpcb'){
    const Ir = d.cfg.Ir || 5, nm = d.type === 'ol' ? 'The overload' : 'The MPCB';
    if (w === 'sp') return `${nm} <b>${tag}</b> tripped: <b>missing phase</b> (single-phasing).`;
    if (w === 'mag') return `${nm} <b>${tag}</b> tripped (magnetic): short circuit (${I}A).`;
    if (w === 'test') return `${nm} <b>${tag}</b> tripped with the TEST button.`;
    return `${nm} <b>${tag}</b> tripped: ${I}A above Ir=${Ir}A. ${d.type === 'ol' ? 'Wait, then Reset.' : 'Wait, then switch it on again.'}`;
  }
  if (d.type === 'mcb'){
    const In = ratingOf(d), cv = curveOf(d);
    if (w === 'short') return `Breaker <b>${tag}</b> tripped on a short circuit.`;
    if (w === 'mag') return `Breaker <b>${tag}</b> (${esc(d.cfg.label)}) tripped (magnetic): ${I}A > ${MAG[cv]}×In. ${cv === 'B' ? 'For a motor use curve <b>C</b>.' : 'Use a bigger breaker or curve D.'}`;
    return `Breaker <b>${tag}</b> tripped (thermal): ${I}A above In=${In}A.`;
  }
  if (d.type === 'fuse'){
    const In = ratingOf(d);
    if (w === 'th') return `Fuse <b>${tag}</b> blew: ${I}A above ${In}A. Replace it (tap it).`;
    return `Fuse <b>${tag}</b> blew on a short. Fix it, then replace it (tap it).`;
  }
  return `${tag} tripped.`;
};

/* =========================== exercise checker =========================== */
const isSupply = d => !!TYPES[d.type].isSupply;
function supplyNames(devs){
  const s = devs.find(isSupply);
  if (!s) return {L:'L', N:'N', brk:'the breaker'};
  if (s.type === 'supplyDC') return {L:'+24V', N:'0V', brk:'the fuse'};
  if (s.type === 'supply3P') return {L:'L1', N:'N', brk:'the breaker'};
  return {L:'L', N:'N', brk:'the breaker'};
}
function devLabel(d){ return d.name ? `${d.tag} (${d.name})` : d.tag; }
function fmtExp(v, coil){ if (v === 'F') return 'forward'; if (v === 'R') return 'reverse'; if (v === 'Y') return 'star'; if (v === 'D') return 'delta'; if (v === 'S') return 'fully stopped'; if (v === 'C') return 'coasting'; if (v === 'B') return 'DC braking'; return coil ? (v ? 'running' : 'stopped') : (v ? 'on' : 'off'); }
function actualOf(d, r){
  if (TYPES[d.type].motor){ const m = r.mot[d.id] || {}; return m; }
  return !!r.energ[d.id];
}
function matchExp(d, exp, r){
  if (TYPES[d.type].motor){
    const m = r.mot[d.id] || {};
    if (exp === 'F') return m.run && m.dir === 1; if (exp === 'R') return m.run && m.dir === -1;
    if (exp === 'Y') return m.run && m.mode === 'Y'; if (exp === 'D') return m.run && m.mode === 'D';
    if (exp === 'S') return !m.run && Math.abs(m.spd || 0) < 0.1; if (exp === 'C') return !m.run && !m.brake && Math.abs(m.spd || 0) >= 0.1; if (exp === 'B') return !m.run && !!m.brake;
    return !!m.run === !!exp;
  }
  return !!r.energ[d.id] === !!exp;
}
CL.check = function(ex, wires, opt){
  opt = opt || {};
  const devs = ex.devices.map(sp => CL.makeDevice(opt.cfg && opt.cfg[sp.id] ? Object.assign({}, sp, {cfg:Object.assign({}, sp.cfg || {}, opt.cfg[sp.id])}) : sp)), byId = {}; devs.forEach(d => byId[d.id] = d);
  const W = (wires || []).map((w, i) => Array.isArray(w) ? {id:i+1, a:w[0], b:w[1]} : w);
  const nm = supplyNames(devs);
  const outs = Object.keys(ex.cases[0].expect);
  const msgs = [], rows = [];
  if (!W.length) return {ok:false, msgs:[{lv:'bad', t:`No wires yet. Start from terminal ${nm.L} on the supply.`}], rows, outs, empty:true};
  const powerUp = () => devs.forEach(d => { if (isSupply(d)){ d.st.on = 1; d.st.trip = 0; } });
  powerUp();
  ex.cases.forEach((c, i) => {
    if (!ex.seq || i === 0){ devs.forEach(resetDev); powerUp(); }
    Object.keys(c.set || {}).forEach(id => { const d = byId[id]; if (d) TYPES[d.type].apply(d, c.set[id]); });
    if (devs.some(d => d.st.mid)){ CL.solve(devs, W, {trip:false}); devs.forEach(d => { d.st.mid = 0; }); } // the instant between the NO opening and the NC closing
    let r = CL.solve(devs, W, {trip:false});
    if (c.wait) r = CL.run(devs, W, c.wait, {trip:false});
    const act = outs.map(o => byId[o] ? actualOf(byId[o], r) : false);
    const ok = outs.map(o => byId[o] ? matchExp(byId[o], c.expect[o], r) : false);
    rows.push({c, act, ok, exp:outs.map(o => c.expect[o]), short:r.short, over:r.over, res:r, lit:outs.map(o => byId[o] && !TYPES[byId[o].type].motor ? !!r.energ[o] : null), trips:devs.filter(d => !isSupply(d) && d.st.trip && d.st.why && d.st.why !== 'short').map(d => d.id)});
  });
  // 1) short circuit
  const sr = rows.findIndex(x => x.short);
  if (sr > -1){
    const p = rows[sr].short.poles;
    const pair = p.map(x => x === 'L1' && nm.L === 'L' ? 'L' : x === 'P' ? '+24V' : x === 'M' ? '0V' : x).join(' and ');
    const when = ex.cases.length > 1 ? ` when “${rows[sr].c.label}”` : '';
    msgs.push({lv:'bad', t:ex.shortMsg ? `⚡ Short between ${pair}${when}: ` + ex.shortMsg : `⚡ ${pair} are connected together${when}: short circuit.`, hl:{w:rows[sr].short.wires || []}});
    return {ok:false, msgs, rows, outs, short:sr};
  }
  // 2) wrong voltage
  const ov = rows.find(x => x.over && x.over.length);
  if (ov){ const o = ov.over[0], d = byId[o.dev]; msgs.push({lv:'bad', t:`🔥 ${devLabel(d)} is ${d.cfg.v} V but gets ${o.V} V: other end to ${nm.N}.`, hl:{t:TYPES[d.type].loads ? [d.id + ':' + TYPES[d.type].loads(d)[0].b] : []}}); return {ok:false, msgs, rows, outs}; }
  const allOk = rows.every(x => x.ok.every(Boolean));
  if (!allOk && ex.diagnose){ const dm = ex.diagnose(byId, W, rows); if (dm){ msgs.push({lv:'bad', t:dm}); return {ok:false, msgs, rows, outs}; } }
  if (allOk && ex.verify){ const vm = ex.verify(byId, W, rows); if (vm){ msgs.push({lv:'bad', t:vm}); return {ok:false, msgs, rows, outs}; } }
  if (allOk){
    (ex.conventions || []).forEach(cv => { try { if (cv.test(W, byId)) msgs.push({lv:'warn', t:cv.msg}); } catch(_) {} });
    // warnings: the neutral is switched instead of the line
    if (!ex.noWarnNeutral){
      rows.forEach(rw => outs.forEach((o, j) => {
        const d = byId[o]; if (!d || TYPES[d.type].motor || rw.exp[j]) return;
        const L = TYPES[d.type].loads(d)[0];
        const live = [L.a, L.b].some(t => { const s = rw.res.poles(rw.res.find(d.id+':'+t)); return s && [...s].some(p => p in PHASES || p === 'P' || p === 'S'); });
        if (live && !msgs.length) msgs.push({lv:'warn', t:`Works ✓, but ${nm.L} still reaches ${devLabel(d)} when off: switch the ${nm.L} side.`});
      }));
    }
    return {ok:true, msgs, rows, outs};
  }
  // 3) diagnose each wrong output
  outs.forEach((o, j) => {
    const d = byId[o]; if (!d) return;
    const exp = rows.map(x => x.exp[j]), okv = rows.map(x => x.ok[j]);
    if (okv.every(Boolean)) return;
    const tr = rows.find(x => !x.ok[j] && x.trips.length && x.exp[j] && (TYPES[d.type].motor || byId[x.trips[0]].type !== 'ol'));
    if (tr){ const td = byId[tr.trips[0]]; msgs.push({lv:'bad', t:ex.tripHint ? `<b>${td.tag}</b> tripped: ${ex.tripHint}` : `In “${esc(tr.c.label)}”: ` + CL.tripText(td), hl:{t:[td.id + ':95', td.id + ':96']}}); return; }
    const act = rows.map(x => (TYPES[d.type].motor ? x.act[j].run : x.act[j]) ? 1 : 0), e = exp.map(v => v ? 1 : 0);
    const sig = act.join('');
    const pat = (ex.patterns || []).find(p => p.sig && p.sig[o] != null && (p.sig[o] === sig || (/[?\[]/.test(p.sig[o]) && new RegExp('^' + p.sig[o].replace(/\?/g, '.') + '$').test(sig)))); // '?' = any, [01] allowed
    { const wm = wireHint(ex, W, byId, 'miss'); if (wm){ msgs.push(wm); return; } } // an unwired terminal of the reference wiring is the most concrete first problem
    if (pat){ msgs.push({lv:'bad', t:pat.msg}); return; }
    if (TYPES[d.type].motor){ const md = motorDiag(d, rows, j, nm), mf = (rows.find(x => !x.ok[j]).res.mot[d.id] || {}).fault; const wh = (!md || mf === '1ph') ? wireHint(ex, W, byId) : null; msgs.push(wh || (md ? {lv:'bad', t:md} : null) || ({lv:'bad', t:`${devLabel(d)} doesn't turn: check power and the coil circuit.`})); return; }
    if (act.every(v => !v)){ const od = openDiag(d, devs, W, nm, ex); msgs.push(typeof od === 'string' ? {lv:'bad', t:od} : Object.assign({lv:'bad'}, od)); return; }
    if (ex.seq){ // drops out as soon as a START button is released → no seal-in contact
      const i = okv.findIndex(v => !v), st = ex.cases[i] && ex.cases[i].set || {};
      const rel = Object.keys(st).filter(id => st[id] && st[id].p === 0 && byId[id] && byId[id].type === 'pb');
      const coils = devs.filter(x => TYPES[x.type].coil);
      if (i > 0 && e[i] && !act[i] && act[i-1] && rel.length && coils.length){ msgs.push({lv:'bad', t:`${devLabel(d)} drops out when you release ${rel.map(id => byId[id].tag).join(' and ')}: seal-in wire 13–14 missing.`, hl:{t:[coils[0].id + ':13', coils[0].id + ':14']}}); return; }
    }
    if (act.every(v => v) && e.some(v => !v)){ msgs.push({lv:'bad', t:`${devLabel(d)} is always on: ${nm.L} bypasses the contact.`}); return; }
    if (act.every((v, i) => v !== e[i])){
      msgs.push({lv:'bad', t: e[0] === 0
        ? `${devLabel(d)} works backwards: you used <b>NC</b> instead of <b>NO</b> (13-14).`
        : `${devLabel(d)} works backwards: you used <b>NO</b> instead of <b>NC</b> (21-22).`});
      return;
    }
    // swapped with another output?
    const other = outs.findIndex((o2, k) => k !== j && rows.every(x => !!x.act[j] === !!x.exp[k]));
    if (other > -1){ msgs.push({lv:'bad', t:`${devLabel(d)} and ${devLabel(byId[outs[other]])} are swapped.`}); return; }
    msgs.push(wireHint(ex, W, byId) || {lv:'bad', t:`${devLabel(d)} isn't right in “${esc(rows[okv.findIndex(v => !v)].c.label)}”.`});
  });
  return {ok:false, msgs: dedupe(msgs), rows, outs};
};
function dedupe(m){ const s = new Set(); return m.filter(x => !s.has(x.t) && s.add(x.t)); }
function wireHint(ex, W, byId, only){ // the first concrete wiring problem, measured against ex.solution: {lv, t, hl:{t:[terms], w:[wire ids]}}
  const sol = ex.solution || []; if (!sol.length) return null;
  const uf = () => { const P = {}; const f = x => { if (!(x in P)) P[x] = x; while (P[x] !== x) x = P[x] = P[P[x]]; return x; }; return {f, u:(a, b) => { P[f(a)] = f(b); }, P}; };
  const S = uf(); sol.forEach(p => S.u(p[0], p[1]));
  const inSol = t => t in S.P, dv = t => t.split(':')[0], tn = t => t.split(':').slice(1).join(':'), tg = t => byId[dv(t)] ? byId[dv(t)].tag : dv(t);
  const has = t => W.some(w => w.a === t || w.b === t);
  for (const w of only ? [] : W){
    if (!inSol(w.a) || !inSol(w.b) || S.f(w.a) === S.f(w.b)) continue;
    for (const [k, o] of [[w.a, w.b], [w.b, w.a]]){ // k is right, o should be another terminal of the same device
      const want = Object.keys(S.P).find(t => S.f(t) === S.f(k) && t !== k && dv(t) === dv(o) && !has(t));
      if (want) return {lv:'bad', t:`The wire from ${tg(k)}:${tn(k)} goes to ${tn(o)}; it should be ${tn(want)}.`, hl:{w:[w.id], t:[o, want]}};
    }
    return {lv:'bad', t:`Wire ${tg(w.a)}:${tn(w.a)} – ${tg(w.b)}:${tn(w.b)} is in the wrong place.`, hl:{w:[w.id], t:[w.a, w.b]}};
  }
  for (const p of sol) for (const t of p) if (!has(t)){
    for (const w of W) for (const [k, o] of [[w.a, w.b], [w.b, w.a]]) if (k !== t && inSol(k) && S.f(k) === S.f(t) && dv(o) === dv(t) && (!inSol(o) || S.f(o) !== S.f(t))) return {lv:'bad', t:`The wire from ${tg(k)}:${tn(k)} goes to ${tn(o)}; it should be ${tn(t)}.`, hl:{w:[w.id], t:[o, t]}};
    return {lv:'bad', t:`Terminal ${tn(t)} on ${tg(t)} isn't connected.`, hl:{t:[t]}}; }
  if (only) return null;
  const U = uf(); W.forEach(w => U.u(w.a, w.b));
  for (const p of sol) if (U.f(p[0]) !== U.f(p[1])) return {lv:'bad', t:`Missing wire between ${tg(p[0])}:${tn(p[0])} and ${tg(p[1])}:${tn(p[1])}.`, hl:{t:[p[0], p[1]]}};
  return null;
}
function openDiag(d, devs, W, nm, ex0){
  const L = TYPES[d.type].loads(d)[0];
  const at = t => W.filter(w => w.a === d.id+':'+t || w.b === d.id+':'+t).length;
  const miss = [L.a, L.b].filter(t => !at(t));
  if (miss.length === 2) return {t:`${devLabel(d)} isn't connected: ${L.a} and ${L.b} have no wire.`, hl:{t:[d.id+':'+L.a, d.id+':'+L.b]}};
  if (miss.length) return {t:`Terminal ${miss[0]} on ${devLabel(d)} isn't connected.`, hl:{t:[d.id+':'+miss[0]]}};
  { const wm = ex0 && wireHint(ex0, W, Object.fromEntries(devs.map(x => [x.id, x])), 'miss'); if (wm) return wm; }
  devs.forEach(x => { if (isSupply(x)){ x.st.on = 1; x.st.trip = 0; } });
  const r = CL.solve(devs, W, {force:true});
  const pa = r.poles(r.find(d.id+':'+L.a)), pb = r.poles(r.find(d.id+':'+L.b));
  const hasL = s => s && [...s].some(p => p in PHASES || p === 'P' || p === 'S'), hasN = s => s && [...s].some(p => p === 'N' || p === 'M' || p === 'T');
  if (r.energ[d.id]){
    const who = TYPES[d.type].coil ? devLabel(d) : devLabel(d);
    // try every combination of pressed buttons, first with the coils as they are, then with every coil forced on
    const pbs = devs.filter(x => x.type === 'pb' || x.type === 'estop').slice(0, 4), coils = devs.filter(x => TYPES[x.type].coil);
    const want = (ex0 && ex0.cases.find(c => c.expect[d.id])) || null, wantSet = want ? Object.keys(want.set || {}).filter(id => want.set[id].p) : [];
    const tryIt = (combo, forceCoil) => { devs.forEach(resetDev); devs.forEach(x => { if (isSupply(x)){ x.st.on = 1; x.st.trip = 0; } }); combo.forEach(x => { x.st.p = 1; }); if (forceCoil) coils.forEach(c => { c.st.coil = 1; c.st.closed = 1; }); const rr = forceCoil ? solveOnce(devs, W, false) : CL.solve(devs, W, {trip:false}); return !!rr.energ[d.id]; };
    const combos = []; for (let m = 0; m < (1 << pbs.length); m++){ const c = pbs.filter((_, i) => m & (1 << i)); combos.push(c); } combos.sort((a, b) => a.length - b.length);
    for (const fc of [false, true]) for (const c of combos){ if (!tryIt(c, fc)) continue;
      const extra = c.filter(x => wantSet.indexOf(x.id) < 0), names = extra.map(devLabel).join(' and ');
      if (fc) return {t:`${coils.map(x => x.tag).join('/')} seal-in is in series with START: make it parallel (13–13, 14–14).`, hl:{t:[coils[0].id + ':13', coils[0].id + ':14']}};
      if (extra.length) return `${who} needs ${names} pressed: wire it on <b>NC</b> (21-22), not NO.`;
      break;
    }
    return wireHint(ex0, W, Object.fromEntries(devs.map(x => [x.id, x]))) || `${who} never works: series contacts that never close together.`;
  }
  const loadsIn = side => { const rt = r.find(d.id+':'+side); return devs.some(o => o !== d && TYPES[o.type].loads && TYPES[o.type].loads(o).some(l => r.find(o.id+':'+l.a) === rt || r.find(o.id+':'+l.b) === rt)); };
  if ((hasL(pa) && !pb && loadsIn(L.b)) || (hasL(pb) && !pa && loadsIn(L.a))) return {t:`Lamps in series: wire each lamp between its contact and ${nm.N}.`, hl:{t:[d.id+':'+(hasL(pa) ? L.b : L.a)]}};
  if ((hasL(pa) && hasL(pb)) ) return {t:`Both ends of ${devLabel(d)} are on ${nm.L}: one must go to ${nm.N}.`, hl:{t:[d.id+':'+L.b]}};
  if ((hasN(pa) && hasN(pb))) return {t:`Both ends of ${devLabel(d)} are on ${nm.N}: one must come from the contact.`, hl:{t:[d.id+':'+L.a]}};
  if ((hasL(pa) || hasL(pb)) && !(hasN(pa) || hasN(pb))) return {t:`${devLabel(d)} doesn't return to ${nm.N}.`, hl:{t:[d.id+':'+(hasL(pa) ? L.b : L.a)]}};
  if ((hasN(pa) || hasN(pb)) && !(hasL(pa) || hasL(pb))) return wireHint(ex0, W, Object.fromEntries(devs.map(x => [x.id, x]))) || {t:`No ${nm.L} reaches ${devLabel(d)}: check the contact.`, hl:{t:[d.id+':'+(hasN(pa) ? L.b : L.a)]}};
  return wireHint(ex0, W, Object.fromEntries(devs.map(x => [x.id, x]))) || `${devLabel(d)} gets neither ${nm.L} nor ${nm.N}.`;
}
function motorDiag(d, rows, j, nm){
  const bad = rows.find(x => !x.ok[j]); const m = bad.res.mot[d.id] || {}; const e = bad.exp[j];
  const when = rows.length > 1 ? ` in “${bad.c.label}”` : '';
  if (m.fault === '1ph') return `${devLabel(d)} gets only two phases: connect L1, L2 and L3.`;
  if (m.fault === 'burn') return `${devLabel(d)} burned out${when}: delta on ${d.cfg.vD || 230} V. Connect it in star.`;
  if (e === 'Y' && m.run && m.over) return `${devLabel(d)} is in delta on 400 V${when}: needs star (W2-U2-V2).`;
  if (e === 'D' && m.run && m.weak) return `${devLabel(d)} is in star, should be delta${when}: U1-W2, V1-U2, W1-V2.`;
  if ((e === 'F' || e === 'R') && m.run) return `${devLabel(d)} turns the wrong way${when}: swap just two phases.`;
  if (e === 'Y' && m.run) return `${devLabel(d)} runs delta, not star${when}: join U2, V2 and W2.`;
  if (e === 'D' && m.run) return `${devLabel(d)} runs star, not delta${when}: U1-W2, V1-U2, W1-V2.`;
  if (!e && m.run) return `${devLabel(d)} runs when it should be stopped${when}.`;
  return null;
}

/* =========================== SVG symbols =========================== */
CL.sym = {};
// IEC 60617 contact (vertical, terminals top/bottom). Returns svg fragment; x = column centre.
function iecContact(x, b, closed, opt){
  opt = opt || {};
  const on = closed ? ' sy-on' : '';
  let s = `<g class="${on}">`;
  const tip = b.k === 'NC' ? (closed ? [x+16, 57] : [x-22, 62]) : (closed ? [x-3, 60] : [x-22, 62]);
  if (b.k === 'CO'){
    // common at bottom (i1), NC top-right (i2), NO top-left (i4)
    s += `<path class="sy" d="M${x} 138V100M${x-14} 22V60M${x+14} 22V58H${x+2}"/>`;
    const tp = closed ? [x-14, 60] : [x+4, 56];
    s += `<path class="sy" d="M${x} 100L${tp[0]} ${tp[1]}"/>`;
    s += `<circle class="sy-t" cx="${x}" cy="138" r="4"/><circle class="sy-t" cx="${x-14}" cy="22" r="4"/><circle class="sy-t" cx="${x+14}" cy="22" r="4"/>`;
    s += `<text class="sy-n" x="${x+8}" y="150">${esc(b.t[0])}</text><text class="sy-n" x="${x+20}" y="18">${esc(b.t[1])}</text><text class="sy-n" x="${x-20}" y="18" text-anchor="end">${esc(b.t[2])}</text>`;
    return s + '</g>';
  }
  s += `<path class="sy" d="M${x} 22V60${b.k === 'NC' ? 'H'+(x+13) : ''}M${x} 138V100"/>`;
  s += `<path class="sy" d="M${x} 100L${tip[0]} ${tip[1]}"/>`;
  if (opt.wedge){ const mx = (x + tip[0]) / 2; s += `<path class="sy-f" d="M${mx-1} 80l-9 -6v12z"/>`; }
  if (opt.main) s += `<path class="sy" d="M${x-7} 60A7 7 0 0 1 ${x+7} 60" style="stroke-width:2"/>`; // IEC 60617 contactor main contact mark
  s += `<circle class="sy-t" cx="${x}" cy="22" r="4"/><circle class="sy-t" cx="${x}" cy="138" r="4"/>`;
  s += `<text class="sy-n" x="${x+9}" y="27">${esc(b.t[0])}</text><text class="sy-n" x="${x+9}" y="143">${esc(b.t[1])}</text>`;
  if (!opt.main && (b.k === 'NO' || b.k === 'NC')) s += `<text class="blk-cap" x="${x}" y="158" font-size="8" font-weight="700" text-anchor="middle" fill="${closed ? GOOD : CAPRED}">${CL.capState(b.k, closed, closed !== (b.k === 'NC'), opt.who)}</text>`;
  return s + '</g>';
}
// IEC 60617 time relay: coil + delayed changeover 15-16-18 (+ instantaneous 21-22-24). The half-circle on the blade is
// the delay mark: open upwards = delayed when energised (on-delay), open downwards = delayed when de-energised (off-delay).
function timerIec(dev, opt){
  opt = opt || {};
  const m = dev.cfg.mode, on = !!(opt.on != null ? opt.on : dev.st.coil), out = opt.out != null ? !!opt.out : (opt.on === false ? false : !!dev.st.out);
  const inst = !!dev.cfg.inst, W = inst ? 300 : 220;
  let s = `<svg viewBox="0 0 ${W} 160" role="img" aria-label="IEC symbol of a timer" data-on="${out ? 1 : 0}"><text class="sy-tag" x="6" y="18">${esc(dev.tag)}</text>`;
  s += `<g class="${on ? 'sy-on' : ''}"><path class="sy" d="M40 22V62M40 98V138"/><rect class="sy" x="22" y="62" width="36" height="36"/>`;
  if (m === 'cyc') s += `<path class="sy" d="M28 80h6v-8h6v16h6v-8h6" style="stroke-width:1.6"/>`;
  else s += `<path class="sy" d="M24 ${m === 'off' ? 92 : 68}H56" style="stroke-width:3"/>`;
  s += `<circle class="sy-t" cx="40" cy="22" r="4"/><circle class="sy-t" cx="40" cy="138" r="4"/><text class="sy-n" x="48" y="27">A1</text><text class="sy-n" x="48" y="143">A2</text></g>`;
  const x = 120;
  s += iecContact(x, {k:'CO', t:['15','16','18']}, out);
  // delay mark on the blade
  const mx = x - 4, my = 82;
  if (m === 'cyc') s += `<path class="sy-d" d="M${mx-10} ${my}H${mx+10}" style="stroke-width:1.6"/>`;
  else if (m === 'off') s += `<path class="sy" d="M${mx-9} ${my-4}A9 9 0 0 1 ${mx+9} ${my-4}" style="stroke-width:1.8"/>`;
  else s += `<path class="sy" d="M${mx-9} ${my+4}A9 9 0 0 0 ${mx+9} ${my+4}" style="stroke-width:1.8"/>`;
  s += `<text class="sy-s" x="${x+22}" y="86">${m === 'cyc' ? 'ton/toff' : 't=' + dev.cfg.t + 's'}</text>`;
  s += `<path class="sy-d" d="M58 80H${x - 10}"/>`;
  if (inst) s += iecContact(200, {k:'CO', t:['21','22','24']}, on) + `<path class="sy-d" d="M${x+12} 80H190"/>` + `<text class="sy-s" x="214" y="86">inst.</text>`;
  return s + '</svg>';
}
// IEC 60617 proximity switch: rhombus (sensing) with the function mark, 3-wire output stage
function proxIec(dev, opt){
  const k = dev.cfg.kind, out = TYPES.prox.op(dev), nc = !!dev.cfg.nc, pnp = !!dev.cfg.pnp;
  let s = `<svg viewBox="0 0 230 160" role="img" aria-label="IEC symbol of a proximity sensor" data-on="${out ? 1 : 0}"><text class="sy-tag" x="6" y="18">${esc(dev.tag)}</text>`;
  s += `<g class="${out ? 'sy-on' : ''}"><path class="sy" d="M60 44L96 80L60 116L24 80Z"/>`;
  if (k === 'photo') s += `<path class="sy" d="M44 70L76 70M44 90L76 90" style="stroke-width:1.6"/><path class="sy-f" d="M76 66l8 4l-8 4z"/><path class="sy-f" d="M44 94l-8 -4l8 -4z"/>`;
  else if (k === 'cap') s += `<path class="sy" d="M50 68V92M70 68V92" style="stroke-width:2"/><path class="sy" d="M38 80H50M70 80H82"/>`;
  else s += `<path class="sy" d="M44 72H76M44 72V88M76 72V88" style="stroke-width:2"/><text class="sy-n" x="60" y="100" text-anchor="middle" style="font-size:9px">Fe</text>`;
  s += `</g><path class="sy-d" d="M96 80H126"/>`;
  s += iecContact(150, {k:nc ? 'NC' : 'NO', t:['', '']}, out, {who:'object present'});
  s += `<text class="sy-n" x="130" y="30" style="font-size:10px">BN +</text><text class="sy-n" x="130" y="150" style="font-size:10px">BK ${pnp ? 'PNP' : 'NPN'}</text><text class="sy-n" x="190" y="30" style="font-size:10px">BU −</text><path class="sy" d="M150 22H190V60" style="stroke-width:1.2;stroke-dasharray:3 3"/>`;
  s += `<text class="sy-s ar" x="222" y="150" text-anchor="end">${k === 'photo' ? 'optical' : k === 'cap' ? 'capacitive' : 'inductive'}</text>`;
  return s + '</svg>';
}
function bladeMid(x, b, closed){
  if (b.k === 'CO') return closed ? x-7 : x+2;
  const tip = b.k === 'NC' ? (closed ? x+16 : x-22) : (closed ? x-3 : x-22);
  return (x + tip) / 2;
}
const ACTS = {
  push:'<path class="sy" d="M34 68H26V92H34"/>',
  turn:'<path class="sy" d="M34 68H26V92H18"/>',
  mush:'<path class="sy" d="M32 64A16 16 0 0 0 32 96Z"/>',
  roll:'',
  float:'<circle class="sy" cx="22" cy="80" r="7"/><path class="sy" d="M12 92H32"/>',
  press:'<path class="sy" d="M14 72A10 10 0 0 1 34 72"/><path class="sy" d="M14 72H34"/><text class="sy-n" x="24" y="66" text-anchor="middle" style="font-size:10px">p</text>',
  thermo:'<path class="sy" d="M14 72A10 10 0 0 1 34 72"/><path class="sy" d="M14 72H34"/><text class="sy-n" x="24" y="66" text-anchor="middle" style="font-size:10px">θ</text>',
  prox:'',
  coil:''
};
// dev: device instance (uses its blocks/state) or {act, blocks, tag, closed:[bool]}
CL.sym.iec = function(dev, opt){
  opt = opt || {};
  const T = TYPES[dev.type] || {};
  const blocks = dev.blocks || [];
  const act = opt.act || (typeof T.iecAct === 'function' ? T.iecAct(dev) : T.iecAct) || dev.act || 'push';
  if (dev.type === 'prox') return proxIec(dev, opt);
  if (dev.type === 'lamp'){
    const on = opt.on;
    return `<svg viewBox="0 0 150 160" role="img" aria-label="IEC symbol of a lamp"><text class="sy-tag" x="8" y="18">${esc(dev.tag)}</text>
      <g class="${on ? 'sy-on' : ''}"><path class="sy" d="M75 22V58M75 102V138"/><circle class="sy ${on ? 'sy-lamp-on' : ''}" cx="75" cy="80" r="22"/><path class="sy" d="M59.4 64.4L90.6 95.6M90.6 64.4L59.4 95.6"/>
      <circle class="sy-t" cx="75" cy="22" r="4"/><circle class="sy-t" cx="75" cy="138" r="4"/><text class="sy-n" x="84" y="27">X1</text><text class="sy-n" x="84" y="143">X2</text></g></svg>`;
  }
  if (dev.type === 'fuse' || dev.type === 'mcb' || dev.type === 'ol' || dev.type === 'mpcb') return CL.sym.iecProt(dev, opt);
  if (dev.type === 'timer') return timerIec(dev, opt);
  if (act === 'coil'){
    // coil (A1 top, A2 bottom) + main poles (contactor) + auxiliary contacts, all driven by the dashed line
    const mains = T.mains || [], all = mains.concat(blocks), on = !!(opt.on != null ? opt.on : (dev.st && (dev.st.closed || dev.st.coil)));
    const x0c = 84, colW = all.some(b => b.k === 'CO') ? 80 : 66, W = x0c + all.length * colW + 6;
    let s = `<svg viewBox="0 0 ${W} 160" role="img" aria-label="IEC symbol of a coil and contacts" data-on="${on ? 1 : 0}"><text class="sy-tag" x="6" y="18">${esc(dev.tag)}</text>`;
    s += `<g class="${on ? 'sy-on' : ''}"><path class="sy" d="M40 22V62M40 98V138"/><rect class="sy" x="22" y="62" width="36" height="36"/><circle class="sy-t" cx="40" cy="22" r="4"/><circle class="sy-t" cx="40" cy="138" r="4"/><text class="sy-n" x="48" y="27">A1</text><text class="sy-n" x="48" y="143">A2</text></g>`;
    let lastMid = 0;
    all.forEach((b, i) => { const x = x0c + i * colW + 12, c = opt.closed ? opt.closed[i] : (b.k === 'CO' ? on : blockClosed(b, on)); s += iecContact(x, b, c, {main:b.main, who:'running'}); lastMid = bladeMid(x, b, c); });
    if (all.length) s += `<path class="sy-d" d="M58 80H${lastMid}"/>`;
    return s + '</svg>';
  }
  const n = blocks.length, colW = 78, x0 = 70;
  const W = x0 + n * colW, closedOf = (b, i) => { if (opt.closed) return opt.closed[i]; const op = T.op ? T.op(dev, b) : false; return b.k === 'CO' ? !!op : blockClosed(b, op); };
  let s = `<svg viewBox="0 0 ${W} 160" role="img" aria-label="IEC symbol" data-on="${blocks.some((b, i) => closedOf(b, i) !== blockClosed(b, false) && (b.k !== 'CO' || closedOf(b, i))) ? 1 : 0}"><text class="sy-tag" x="6" y="18">${esc(dev.tag)}</text>`;
  let lastMid = 0;
  blocks.forEach((b, i) => { const x = x0 + i * colW + 20, c = closedOf(b, i); s += iecContact(x, b, c, {wedge: act === 'roll' && i === 0, who: WHO(dev)}); lastMid = bladeMid(x, b, c); });
  const sx = act === 'roll' ? x0 + 6 : act === 'mush' ? 32 : 26;
  if (act !== 'roll' || n > 1) s += `<path class="sy-d" d="M${sx} 80H${lastMid}"/>`;
  s += ACTS[act] || '';
  return s + '</svg>';
};
// IEC 60617 symbols of the protection devices (fuse, circuit breaker, thermal overload relay, MPCB)
CL.sym.iecProt = function(dev, opt){
  opt = opt || {};
  const T = dev.type, st = dev.st || {}, on = T === 'fuse' ? !st.trip : T === 'ol' ? !st.trip : (st.on && !st.trip);
  const n = T === 'fuse' || T === 'mcb' ? (dev.cfg.poles || 1) : 3, colW = 52, x0 = 36;
  const tn = (x, y, t, anc) => `<text class="sy-n" x="${x}" y="${y}" text-anchor="${anc || 'start'}">${esc(t)}</text>`;
  const lab = T === 'fuse' ? 'IEC symbol of a fuse' : T === 'mcb' ? 'IEC symbol of a circuit breaker' : T === 'ol' ? 'IEC symbol of a thermal overload' : 'IEC symbol of a motor protection circuit breaker';
  const aux = T === 'ol' ? [{k:'NC', t:['95','96'], th:true}, {k:'NO', t:['97','98'], th:true}] : (T === 'mpcb' && dev.cfg.aux ? [{k:'NO', t:['13','14']}, {k:'NC', t:['21','22']}] : []);
  const W = x0 + n * colW + (aux.length ? 24 + aux.length * 60 : 0) + 10;
  let s = `<svg viewBox="0 0 ${W} 160" role="img" aria-label="${lab}" data-on="${on ? 1 : 0}"><text class="sy-tag" x="6" y="18">${esc(dev.tag)}</text>`;
  s += `<g class="${on ? 'sy-on' : ''}">`;
  for (let i = 0; i < n; i++){
    const x = x0 + i * colW + 10, t1 = String(2*i+1), t2 = String(2*i+2);
    if (T === 'fuse'){
      s += `<path class="sy" d="M${x} 22V138"/><rect class="sy" x="${x-9}" y="58" width="18" height="44" style="fill:var(--panel)"/><path class="sy" d="M${x} 58V102"/>`;
      if (st.trip) s += `<path class="sy" d="M${x-7} 72L${x+7} 88M${x+7} 72L${x-7} 88" style="stroke:var(--bad)"/>`;
    } else {
      // contact with the x mark (automatic circuit breaker); closed when on
      s += `<path class="sy" d="M${x} 22V58M${x} 138V98"/>`;
      s += `<path class="sy" d="M${x} 98L${on ? x - 2 : x - 20} ${on ? 58 : 62}"/><path class="sy" d="M${x-6} 52l12 12M${x+6} 52l-12 12" style="stroke-width:2"/>`;
      if (T === 'mcb' || T === 'mpcb'){ // releases: thermal (bimetal) + magnetic (I>)
        if (i === 0) s += `<path class="sy-d" d="M${x - 9} 80H${x0 + (n - 1) * colW + 10 - 9}"/>`;
      }
    }
    if (T === 'ol'){
      s += `<rect class="sy" x="${x-9}" y="66" width="18" height="28" style="fill:var(--panel)"/><path class="sy" d="M${x-9} 80H${x-3}A6 6 0 0 1 ${x+3} 80H${x+9}" style="stroke-width:2"/>`;
      if (i === 0) s += `<path class="sy-d" d="M${x} 94V112H${x0 + (n - 1) * colW + 10}V94"/>`;
    }
    s += `<circle class="sy-t" cx="${x}" cy="22" r="4"/><circle class="sy-t" cx="${x}" cy="138" r="4"/>` + tn(x + 8, 27, t1) + tn(x + 8, 143, t2);
  }
  if (T === 'mcb' || T === 'mpcb'){ const xr = x0 + n * colW + 2; s += `<rect class="sy" x="${xr - 12}" y="36" width="24" height="18" style="stroke-width:1.6"/><path class="sy" d="M${xr - 12} 45H${xr - 5}A5 5 0 0 1 ${xr + 5} 45H${xr + 12}" style="stroke-width:1.6"/><text class="sy-s" x="${xr}" y="33" text-anchor="middle">θ</text>`;
    s += `<rect class="sy" x="${xr - 12}" y="60" width="24" height="18" style="stroke-width:1.6"/><text class="sy-n" x="${xr}" y="74" text-anchor="middle" style="font-size:11px">I&gt;</text>`; }
  s += '</g>';
  // auxiliary contacts (thermal actuator for the overload)
  aux.forEach((b, i) => { const x = x0 + n * colW + 44 + i * 60, op = T === 'ol' ? !!st.trip : !on; const c = blockClosed(b, op);
    s += iecContact(x, b, c); if (b.th) s += `<path class="sy" d="M${x-26} 78A8 8 0 0 0 ${x-26} 94" style="stroke-width:2"/><path class="sy-d" d="M${x-22} 86H${x-10}"/>`; });
  if (T === 'ol') s += `<text class="sy-s ar" x="${W - 6}" y="156" text-anchor="end">95-96 opens, 97-98 closes when hot</text>`;
  return s + '</svg>';
};
// NEMA / ANSI (ICS 19) symbols, horizontal, normal (un-operated) state.
CL.sym.nema = function(kind, opt){
  opt = opt || {};
  const t = (x, y) => `<circle class="sy-t" cx="${x}" cy="${y}" r="5"/>`;
  const leads = y => `<path class="sy" d="M8 ${y}H45M125 ${y}H162"/>`;
  const nums = (y, a, b) => a ? `<text class="sy-n" x="50" y="${y+20}" text-anchor="middle">${a}</text><text class="sy-n" x="120" y="${y+20}" text-anchor="middle">${b}</text>` : '';
  let s = '';
  switch (kind){
    case 'pbNO': s = leads(56) + t(50,56) + t(120,56) + '<path class="sy" d="M42 40H128M85 40V16M74 16H96"/>' + nums(56, opt.a || '13', opt.b || '14'); break;
    case 'pbNC': s = leads(56) + t(50,56) + t(120,56) + '<path class="sy" d="M42 63H128M85 63V16M74 16H96"/>' + nums(60, opt.a || '11', opt.b || '12'); break;
    case 'estop': s = leads(56) + t(50,56) + t(120,56) + '<path class="sy" d="M42 63H128M85 63V22"/><path class="sy" d="M66 22A19 13 0 0 1 104 22Z"/>' + nums(60, opt.a || '11', opt.b || '12'); break;
    case 'sel2':
      s = leads(56) + t(50,56) + t(120,56) + '<path class="sy" d="M42 40H128"/>' + nums(56, '13', '14') +
        '<g transform="translate(176 14)"><rect class="sy" x="0" y="0" width="64" height="52" rx="3" style="stroke-width:1.4"/><path class="sy" d="M0 18H64M32 0V52" style="stroke-width:1.2"/><text class="sy-n" x="16" y="13" text-anchor="middle">0</text><text class="sy-n" x="48" y="13" text-anchor="middle">I</text><text class="sy-n" x="48" y="40" text-anchor="middle">X</text></g>';
      return `<svg viewBox="0 0 250 84" role="img" aria-label="NEMA symbol of a selector switch">${s}</svg>`;
    case 'sel3':
      s = '<path class="sy" d="M8 30H45M125 30H162M8 76H45M125 76H162"/>' + t(50,30) + t(120,30) + t(50,76) + t(120,76) + '<path class="sy" d="M42 16H128M42 62H128"/><text class="sy-n" x="85" y="10" text-anchor="middle">A</text><text class="sy-n" x="85" y="56" text-anchor="middle">B</text>' +
        '<g transform="translate(176 8)"><rect class="sy" x="0" y="0" width="84" height="78" rx="3" style="stroke-width:1.4"/><path class="sy" d="M0 22H84M28 0V78M56 0V78M0 50H84" style="stroke-width:1.2"/><text class="sy-n" x="14" y="16" text-anchor="middle">H</text><text class="sy-n" x="42" y="16" text-anchor="middle">0</text><text class="sy-n" x="70" y="16" text-anchor="middle">A</text><text class="sy-n" x="14" y="42" text-anchor="middle">X</text><text class="sy-n" x="70" y="70" text-anchor="middle">X</text></g>';
      return `<svg viewBox="0 0 270 96" role="img" aria-label="NEMA symbol of a 3-position selector">${s}</svg>`;
    case 'lsNO': s = leads(50) + t(50,50) + t(120,50) + '<path class="sy" d="M55 50L118 66"/><path class="sy-f" d="M84 59l9 12h-18z"/>' + nums(50, '13', '14'); break;
    case 'lsNC': s = leads(50) + t(50,50) + t(120,50) + '<path class="sy" d="M55 50L128 58"/><path class="sy-f" d="M84 52l9 -12h-18z"/>' + nums(56, '21', '22'); break;
    // NEMA ICS 19 float switch (lever + ball), pressure switch (diaphragm half-circle), proximity switch (diamond)
    case 'floatNO': s = leads(50) + t(50,50) + t(120,50) + '<path class="sy" d="M55 50L118 66"/><path class="sy" d="M84 60V74"/><circle class="sy" cx="84" cy="80" r="6"/>' + nums(50, '13', '14'); break;
    case 'floatNC': s = leads(50) + t(50,50) + t(120,50) + '<path class="sy" d="M55 50L128 58"/><path class="sy" d="M84 54V74"/><circle class="sy" cx="84" cy="80" r="6"/>' + nums(56, '21', '22'); break;
    case 'pressNO': s = leads(50) + t(50,50) + t(120,50) + '<path class="sy" d="M55 50L118 66"/><path class="sy" d="M84 60V72"/><path class="sy" d="M70 84A14 14 0 0 1 98 84Z"/>' + nums(50, '13', '14'); break;
    case 'pressNC': s = leads(50) + t(50,50) + t(120,50) + '<path class="sy" d="M55 50L128 58"/><path class="sy" d="M84 54V72"/><path class="sy" d="M70 84A14 14 0 0 1 98 84Z"/>' + nums(56, '21', '22'); break;
    case 'proxNO': s = leads(50) + t(50,50) + t(120,50) + '<path class="sy" d="M55 50L118 66"/><path class="sy" d="M84 60V70"/><path class="sy" d="M84 70L94 80L84 90L74 80Z"/>' + nums(50, '13', '14'); break;
    case 'proxNC': s = leads(50) + t(50,50) + t(120,50) + '<path class="sy" d="M55 50L128 58"/><path class="sy" d="M84 54V70"/><path class="sy" d="M84 70L94 80L84 90L74 80Z"/>' + nums(56, '21', '22'); break;
    case 'lamp': {
      const L = opt.letter || 'G';
      s = '<path class="sy" d="M8 50H67M103 50H162"/><circle class="sy" cx="85" cy="50" r="18"/>';
      for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4 + Math.PI/8, c = Math.cos(a), si = Math.sin(a); s += `<path class="sy" style="stroke-width:1.8" d="M${85+23*c} ${50+23*si}L${85+30*c} ${50+30*si}"/>`; }
      s += `<text class="sy-n" x="85" y="55" text-anchor="middle" style="font-size:15px">${esc(L)}</text>`; break;
    }
    case 'fuse': s = `<path class="sy" d="M8 50H40M130 50H162"/><path class="sy" d="M40 50C60 20 80 80 100 50S120 30 130 50"/>` + (opt.lab ? `<text class="sy-n" x="85" y="22" text-anchor="middle">${esc(opt.lab)}</text>` : ''); break;
    case 'cb': s = leads(56) + t(50,56) + t(120,56) + '<path class="sy" d="M55 56L118 30"/><path class="sy" d="M44 56A10 10 0 0 1 56 46" style="stroke-width:1.8"/><path class="sy" d="M126 56A10 10 0 0 0 114 46" style="stroke-width:1.8"/>' + `<text class="sy-n" x="85" y="80" text-anchor="middle">${esc(opt.lab || 'CB')}</text>`; break;
    case 'cb3': { s = ''; [['L1','T1'],['L2','T2'],['L3','T3']].forEach((p, i) => { const y = 22 + i * 30; s += `<path class="sy" d="M8 ${y}H45M125 ${y}H162"/>` + t(50, y) + t(120, y) + `<path class="sy" d="M55 ${y}L118 ${y-22}"/><path class="sy" d="M44 ${y}A9 9 0 0 1 55 ${y-9}" style="stroke-width:1.6"/>`; }); s += '<path class="sy-d" d="M86 11V71"/><text class="sy-n" x="85" y="100" text-anchor="middle">CB</text>'; return `<svg viewBox="0 0 170 106" role="img" aria-label="NEMA symbol of a 3-pole breaker">${s}</svg>`; }
    case 'olh': s = `<path class="sy" d="M8 50H60M110 50H162"/><path class="sy" d="M60 50V36H110V50M60 50V64H110V50" style="stroke-width:1.6"/><path class="sy" d="M68 50C72 38 78 38 82 50S92 62 96 50S104 40 106 50" style="stroke-width:1.8"/><text class="sy-n" x="85" y="22" text-anchor="middle">OL</text>` + (opt.three ? `<text class="sy-s ar" x="85" y="80" text-anchor="middle">one in each phase</text>` : ''); break;
    case 'olNC': s = leads(56) + t(50,56) + t(120,56) + '<path class="sy" d="M42 63H128"/><path class="sy" d="M72 44C80 34 90 34 98 44" style="stroke-width:1.8"/><path class="sy" d="M64 44H106" style="stroke-width:1.2"/>' + nums(60, opt.a || '95', opt.b || '96') + '<text class="sy-n" x="85" y="22" text-anchor="middle">OL</text>'; break;
    case 'olNO': s = leads(56) + t(50,56) + t(120,56) + '<path class="sy" d="M42 40H128"/><path class="sy" d="M72 28C80 18 90 18 98 28" style="stroke-width:1.8"/>' + nums(56, opt.a || '97', opt.b || '98') + '<text class="sy-n" x="85" y="14" text-anchor="middle">OL</text>'; break;
    case 'coil': s = `<path class="sy" d="M8 50H67M103 50H162"/><circle class="sy" cx="85" cy="50" r="18"/><text class="sy-n" x="85" y="55" text-anchor="middle">${esc(opt.letter || 'CR')}</text>` + nums(50, opt.a || 'A1', opt.b || 'A2'); break;
    // NEMA timer: TR coil, timed contacts (arrow on the half circle = direction of the delayed movement)
    case 'tr': s = `<path class="sy" d="M8 50H67M103 50H162"/><circle class="sy" cx="85" cy="50" r="18"/><text class="sy-n" x="85" y="55" text-anchor="middle">${esc(opt.letter || 'TR')}</text>` + nums(50, opt.a || 'A1', opt.b || 'A2'); break;
    case 'notc': case 'ncto': case 'noto': case 'nctc': {
      const nc = kind[1] === 'c', down = kind.slice(2) === 'tc' ? kind === 'notc' : kind === 'ncto';
      s = leads(50) + t(50,50) + t(120,50) + (nc ? '<path class="sy" d="M55 50L128 60"/>' : '<path class="sy" d="M55 50L118 28"/>');
      s += down ? '<path class="sy" d="M72 74A13 13 0 0 1 98 74" style="stroke-width:1.8"/><path class="sy-f" d="M85 84l-5 -8h10z"/>' : '<path class="sy" d="M72 20A13 13 0 0 0 98 20" style="stroke-width:1.8"/><path class="sy-f" d="M85 8l-5 8h10z"/>';
      s += `<text class="sy-n" x="85" y="${nc ? 44 : 46}" text-anchor="middle" style="font-size:10px">${kind.toUpperCase()}</text><text class="sy-n" x="140" y="${nc ? 76 : 20}">${esc(opt.letter || 'TR')}</text>`;
      return `<svg viewBox="0 0 170 92" role="img" aria-label="NEMA symbol of a timer contact ${kind.toUpperCase()}">${s}</svg>`;
    }
    // relay / contactor auxiliary contacts (two parallel plates; NC has a slash)
    case 'crNO': s = leads(50) + t(50,50) + t(120,50) + '<path class="sy" d="M78 30V70M92 30V70"/>' + nums(50, opt.a || '13', opt.b || '14') + `<text class="sy-n" x="85" y="20" text-anchor="middle">${esc(opt.letter || 'CR')}</text>`; break;
    case 'crNC': s = leads(50) + t(50,50) + t(120,50) + '<path class="sy" d="M78 30V70M92 30V70M70 72L100 28"/>' + nums(50, opt.a || '21', opt.b || '22') + `<text class="sy-n" x="85" y="20" text-anchor="middle">${esc(opt.letter || 'CR')}</text>`; break;
    case 'mNO3': {
      s = '';
      [['L1','T1'],['L2','T2'],['L3','T3']].forEach((p, i) => { const y = 22 + i * 30; s += `<path class="sy" d="M8 ${y}H45M125 ${y}H162"/>` + t(50, y) + t(120, y) + `<path class="sy" d="M78 ${y-12}V${y+12}M92 ${y-12}V${y+12}"/><text class="sy-n" x="26" y="${y-6}" text-anchor="middle">${p[0]}</text><text class="sy-n" x="144" y="${y-6}" text-anchor="middle">${p[1]}</text>`; });
      s += '<path class="sy-d" d="M85 22V82"/><text class="sy-n" x="85" y="100" text-anchor="middle">M</text>';
      return `<svg viewBox="0 0 170 106" role="img" aria-label="NEMA symbol of power contacts">${s}</svg>`;
    }
  }
  return `<svg viewBox="0 0 170 ${/^(float|press|prox)/.test(kind) ? 100 : kind === 'lamp' || kind.indexOf('ls') === 0 ? 86 : 84}" role="img" aria-label="NEMA symbol">${s}</svg>`;
};

/* =========================== realistic drawings (lesson figures) =========================== */
CL.art = {};
const DEFS = (id, c) => `<defs><linearGradient id="chr${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#eef0f1"/><stop offset=".5" stop-color="#b9bec2"/><stop offset="1" stop-color="#868c91"/></linearGradient>
  <radialGradient id="cap${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${c.l}"/><stop offset=".55" stop-color="${c.b}"/><stop offset="1" stop-color="${c.d}"/></radialGradient>
  <linearGradient id="stl${id}" x1="0" x2="1"><stop offset="0" stop-color="#8d969c"/><stop offset=".5" stop-color="#c9cfd3"/><stop offset="1" stop-color="#8d969c"/></linearGradient></defs>`;
let UID = 0;
// side cut of one contact block (horizontal plunger). x0 = left edge of block, top, h = height.
function blockCut(x0, top, h, b, pressed, closed, numsRight){
  const bot = top + h, off = pressed ? 10 : 0, c = closed ? GOOD : '#8a9096', cw = closed ? 3 : 2;
  const no = b.k === 'NO', tab = no ? '#2f9e44' : '#d6332a';
  const pad = no ? x0 + 72 : x0 + 58, bx = (no ? x0 + 54 : x0 + 64) + off;
  let s = `<rect x="${x0}" y="${top}" width="140" height="${h}" rx="5" fill="#efeee9" stroke="#8c8f8a"/>
   <rect x="${x0+128}" y="${top}" width="12" height="${h}" rx="3" fill="${tab}"/>
   <rect x="${x0+16}" y="${top+8}" width="96" height="${h-16}" rx="3" fill="#fbfbf8" stroke="#cfcfc8"/>
   <text x="${x0+22}" y="${top+20}" font-size="11" font-weight="700" fill="${tab}">${b.k}</text>`;
  s += `<path d="M${pad+3} ${top+16}V${top+12}H${x0+118}M${pad+3} ${bot-16}V${bot-12}H${x0+118}" fill="none" stroke="${c}" stroke-width="${cw}"/>`;
  s += `<rect x="${pad}" y="${top+16}" width="7" height="12" fill="${closed ? GOOD : '#b7bcc0'}" stroke="#666" stroke-width=".6"/><rect x="${pad}" y="${bot-28}" width="7" height="12" fill="${closed ? GOOD : '#b7bcc0'}" stroke="#666" stroke-width=".6"/>`;
  s += `<line x1="${x0}" y1="${(top+bot)/2}" x2="${bx}" y2="${(top+bot)/2}" stroke="#55595c" stroke-width="5"/>`;
  s += `<rect x="${bx}" y="${top+14}" width="7" height="${h-28}" rx="2" fill="${closed ? '#46c06a' : '#c7893b'}" stroke="#7a4f1c" stroke-width=".8"/>`;
  const sx = bx + 8, ex = x0 + 110; let z = `M${sx} ${(top+bot)/2}`; const nz = 6; for (let i = 1; i <= nz; i++) z += `L${sx + (ex - sx) * i / nz} ${(top+bot)/2 + (i % 2 ? -6 : 6)}`;
  s += `<path d="${z}" fill="none" stroke="#9aa0a5" stroke-width="1.4"/>`;
  [top + 16, bot - 16].forEach((y, i) => { s += `<circle cx="${x0+118}" cy="${y}" r="7" fill="#d8dbdd" stroke="${closed ? GOOD : '#6d7479'}" stroke-width="${closed ? 2.5 : 1.4}"/><path d="M${x0+114} ${y-4}L${x0+122} ${y+4}" stroke="#4a5157" stroke-width="2"/>`;
    if (numsRight !== false) s += `<text x="${x0+150}" y="${y+5}" font-size="14" font-weight="700" fill="${closed ? GOOD : 'currentColor'}">${esc(b.t[i])}</text>`; });
  return s;
}
CL.art.pbSide = function(d, mush){
  const id = ++UID, c = colOf(d.cfg.color), p = TYPES[d.type].op(d), off = p ? 9 : 0, bl = d.blocks;
  const n = bl.length, gap = 10, h = Math.min(80, (190 - (n - 1) * gap) / n), t0 = 115 - (n * h + (n - 1) * gap) / 2;
  let s = `<svg viewBox="0 0 420 240" role="img" aria-label="Side view of the button and contact blocks">${DEFS(id, c)}<g style="color:var(--ink)">`;
  s += `<text class="ar" x="70" y="24" font-size="12" text-anchor="middle" fill="currentColor">front of door</text><text class="ar" x="${mush ? 300 : 300}" y="${Math.max(14, t0 - 8)}" font-size="12" text-anchor="middle" fill="currentColor">behind the door: contact blocks</text>`;
  s += `<rect x="${112+off}" y="108" width="62" height="14" fill="#6b7075"/>`; // plunger
  if (mush){
    s += `<rect x="118" y="34" width="10" height="162" rx="2" fill="#f3c613" stroke="#a88500"/>`;
    s += `<path d="M${100+off} 50C${36+off} 50 ${36+off} 180 ${100+off} 180Z" fill="url(#cap${id})" stroke="${c.d}"/><rect x="${98+off}" y="96" width="22" height="38" fill="#2c2f31"/>`;
  } else {
    s += `<rect x="94" y="72" width="34" height="86" rx="8" fill="url(#chr${id})" stroke="#7d8388"/>`;
    s += `<rect x="${70+off}" y="82" width="36" height="66" rx="12" fill="url(#cap${id})" stroke="${c.d}"/>`;
    s += `<text x="${88+off}" y="119" font-size="10" font-weight="700" fill="#fff" text-anchor="middle" transform="rotate(-90 ${88+off} 115)">${esc(d.cfg.label || '')}</text>`;
  }
  s += `<rect x="128" y="10" width="10" height="220" fill="url(#stl${id})" stroke="#6d757b" stroke-width=".8"/><text class="ar" x="133" y="236" font-size="11" text-anchor="middle" fill="currentColor">panel</text>`;
  s += `<rect x="138" y="80" width="10" height="70" fill="#4e5357"/><rect x="148" y="${t0 - 4}" width="30" height="${n*h + (n-1)*gap + 8}" rx="3" fill="#2c2f31"/>`;
  bl.forEach((b, i) => { const top = t0 + i * (h + gap); s += blockCut(178, top, h, b, p, blockClosed(b, p)); });
  if (mush && p) s += `<text class="ar" x="70" y="214" font-size="12" text-anchor="middle" fill="#d6332a" font-weight="700">latched: twist to release ↻</text>`;
  if (!mush && p) s += `<text class="ar" x="70" y="200" font-size="12" text-anchor="middle" fill="currentColor">← pressed</text>`;
  return s + '</g></svg>';
};
CL.art.selFront = function(d){
  const id = ++UID, c = COL.black, P = d.cfg.pos, n = P.length, angs = n === 3 ? [-45, 0, 45] : [-45, 45], a = angs[d.st.pos] || 0;
  const bl = d.blocks, h = Math.min(70, (190 - (bl.length - 1) * 10) / bl.length), t0 = 120 - (bl.length * h + (bl.length - 1) * 10) / 2;
  let s = `<svg viewBox="0 0 440 240" role="img" aria-label="Selector switch from the front, and its contact blocks">${DEFS(id, c)}<g style="color:var(--ink)">`;
  s += `<circle cx="100" cy="132" r="60" fill="url(#chr${id})" stroke="#7d8388"/><circle cx="100" cy="132" r="50" fill="#1c1e20"/>`;
  angs.forEach((g, i) => { const rad = (g - 90) * Math.PI / 180; s += `<text x="${100 + 76*Math.cos(rad)}" y="${132 + 76*Math.sin(rad) + 5}" font-size="15" font-weight="700" text-anchor="middle" fill="${i === d.st.pos ? 'var(--accent)' : 'currentColor'}">${esc(P[i])}</text>`; });
  s += `<g transform="rotate(${a} 100 132)"><rect x="88" y="90" width="24" height="84" rx="11" fill="url(#cap${id})" stroke="#000"/><rect x="98" y="94" width="4" height="30" rx="2" fill="#f2f2f2"/></g>`;
  s += `<text class="ar" x="100" y="22" font-size="12" text-anchor="middle" fill="currentColor">front of the door</text><text class="ar" x="320" y="${Math.max(14, t0 - 8)}" font-size="12" text-anchor="middle" fill="currentColor">blocks behind the switch</text>`;
  bl.forEach((b, i) => { const op = TYPES.sel.op(d, b); s += blockCut(250, t0 + i * (h + 10), h, b, op, blockClosed(b, op)); s += `<text class="ar" x="244" y="${t0 + i*(h+10) + h/2 + 4}" font-size="10" text-anchor="end" fill="currentColor">${(b.on || []).map(k => P[k]).join('/')}</text>`; });
  return s + '</g></svg>';
};
function lsGeom(x){ // x: 0..1 cart travel in the scene
  const cr = 180 + x * 184, th = Math.asin(clamp((cr + 11 - 350) / 50, 0, 0.5));
  return {cr, th, rx: 350 + 50 * Math.sin(th), ry: 100 - 50 * Math.cos(th), op: th >= 0.2};
}
CL.lsOperatedAt = x => lsGeom(x).op;
CL.art.lsScene = function(d){
  const g = lsGeom(d.st.x || 0), cr = g.cr;
  let s = `<svg viewBox="0 0 400 236" role="img" aria-label="A cart hitting the limit switch roller"><g style="color:var(--ink)">`;
  s += `<rect x="10" y="196" width="320" height="8" rx="2" fill="#7b8389"/><path d="M8 212H392" stroke="currentColor" stroke-width="1.5" opacity=".4"/>`;
  // cart
  s += `<rect x="${cr-122}" y="146" width="66" height="42" rx="5" fill="#2f6fb5" stroke="#173b63"/><circle cx="${cr-108}" cy="194" r="9" fill="#2a2d30"/><circle cx="${cr-70}" cy="194" r="9" fill="#2a2d30"/>`;
  s += `<rect x="${cr-72}" y="44" width="10" height="104" fill="#59636b"/><rect x="${cr-72}" y="44" width="72" height="14" rx="3" fill="#e0a21b" stroke="#8a6200"/>`;
  s += `<text class="ar" x="${cr-89}" y="172" font-size="12" fill="#fff" text-anchor="middle">cart</text>`;
  // limit switch on a stand
  s += `<rect x="326" y="200" width="66" height="8" fill="#59636b"/><rect x="330" y="110" width="52" height="90" rx="6" fill="#c3c7ca" stroke="#6d7479"/><rect x="336" y="118" width="40" height="34" rx="3" fill="#d7dadc" stroke="#9aa1a6"/>`;
  [[340,122],[372,122],[340,148],[372,148]].forEach(p => s += `<circle cx="${p[0]}" cy="${p[1]}" r="2" fill="#6d7479"/>`);
  s += `<text x="356" y="140" font-size="11" font-weight="700" fill="#333" text-anchor="middle">LS</text><rect x="346" y="200" width="20" height="8" fill="#2a2d30"/>`;
  s += `<rect x="336" y="90" width="28" height="22" rx="4" fill="#3a3e41"/>`;
  s += `<line x1="350" y1="100" x2="${g.rx}" y2="${g.ry}" stroke="#4b5257" stroke-width="7" stroke-linecap="round"/><circle cx="350" cy="100" r="5" fill="#9aa1a6"/>`;
  s += `<circle cx="${g.rx}" cy="${g.ry}" r="11" fill="#ecebe6" stroke="#4b5257" stroke-width="2"/><circle cx="${g.rx}" cy="${g.ry}" r="3" fill="#4b5257"/>`;
  s += `<text class="ar" x="356" y="232" font-size="12" text-anchor="middle" fill="${g.op ? GOOD : 'currentColor'}" font-weight="700">${g.op ? 'operated ✓' : 'limit switch'}</text>`;
  s += `<text class="ar" x="${cr-89}" y="138" font-size="13" text-anchor="middle" fill="currentColor">→</text>`;
  return s + '</g></svg>';
};
CL.art.lampArt = function(d, on){
  const id = ++UID, c = colOf(d.cfg.color);
  on = on == null ? !!d.st.v : on;
  const lens = on ? c.lens : c.off;
  let s = `<svg viewBox="0 0 420 200" role="img" aria-label="Pilot lamp from the front and the side">${DEFS(id, c)}<g style="color:var(--ink)">`;
  s += `<circle cx="96" cy="100" r="58" fill="url(#chr${id})" stroke="#7d8388"/><circle cx="96" cy="100" r="58" fill="none" stroke="#5f666b" stroke-width="3" stroke-dasharray="2 4"/>`;
  s += `<g class="${on ? 'lit' : ''}" style="--glow:${c.lens}"><circle cx="96" cy="100" r="44" fill="${lens}" stroke="#333"/></g>`;
  s += `<circle cx="96" cy="100" r="44" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-dasharray="1 5"/><ellipse cx="82" cy="84" rx="14" ry="8" fill="rgba(255,255,255,${on ? .55 : .25})"/>`;
  // side view
  s += `<path d="M206 66C186 66 186 134 206 134Z" fill="${lens}" stroke="#333"/><rect x="206" y="60" width="16" height="80" rx="4" fill="url(#chr${id})" stroke="#7d8388"/>`;
  s += `<rect x="222" y="10" width="10" height="180" fill="url(#stl${id})" stroke="#6d757b" stroke-width=".8"/><rect x="232" y="72" width="10" height="56" fill="#4e5357"/>`;
  s += `<rect x="242" y="64" width="100" height="72" rx="5" fill="#efeee9" stroke="#8c8f8a"/><rect x="250" y="88" width="28" height="24" rx="3" fill="${on ? c.lens : '#cfd2d4'}" stroke="#777"/><text x="264" y="104" font-size="9" text-anchor="middle" fill="#333">LED</text>`;
  [80, 120].forEach((y, i) => { s += `<circle cx="326" cy="${y}" r="7" fill="#d8dbdd" stroke="${on ? GOOD : '#6d7479'}" stroke-width="${on ? 2.5 : 1.4}"/><path d="M322 ${y-4}L330 ${y+4}" stroke="#4a5157" stroke-width="2"/><text x="350" y="${y+5}" font-size="14" font-weight="700" fill="currentColor">X${i+1}</text>`; });
  s += `<text x="292" y="156" font-size="11" text-anchor="middle" fill="currentColor">${d.cfg.v}V ${d.cfg.v === 24 ? 'DC' : 'AC'}</text>`;
  return s + '</g></svg>';
};
CL.art.supplyArt = function(){
  const id = ++UID;
  let s = `<svg viewBox="0 0 420 230" role="img" aria-label="MCB breaker and 24 V power supply">${DEFS(id, COL.black)}<g style="color:var(--ink)">`;
  s += `<rect x="40" y="26" width="88" height="170" rx="6" fill="#f4f4f1" stroke="#8c8f8a"/><path d="M84 26V196" stroke="#cfcfc8"/>`;
  [[62,'1'],[106,'N']].forEach(([x,l]) => { s += `<circle cx="${x}" cy="44" r="7" fill="#d8dbdd" stroke="#6d7479"/><text x="${x}" y="64" font-size="11" text-anchor="middle" fill="#333">${l}</text><circle cx="${x}" cy="178" r="7" fill="#d8dbdd" stroke="#6d7479"/><text x="${x}" y="164" font-size="11" text-anchor="middle" fill="#333">${l === '1' ? '2' : 'N'}</text>`; });
  s += `<rect x="58" y="88" width="52" height="46" rx="4" fill="#3a3e41"/><rect x="64" y="92" width="40" height="20" rx="3" fill="#1f6fd1"/><text x="84" y="106" font-size="10" fill="#fff" text-anchor="middle">I ON</text><text x="84" y="128" font-size="9" fill="#ccc" text-anchor="middle">O OFF</text>`;
  s += `<text x="84" y="80" font-size="12" font-weight="700" fill="#333" text-anchor="middle">C6</text><text x="84" y="150" font-size="9" fill="#555" text-anchor="middle">230V~ 6000</text>`;
  s += `<text class="ar" x="84" y="216" font-size="12" text-anchor="middle" fill="currentColor">1P+N breaker</text>`;
  s += `<rect x="216" y="26" width="160" height="170" rx="6" fill="#cfd3d6" stroke="#7d8388"/><rect x="230" y="70" width="132" height="60" rx="4" fill="#e7e9ea" stroke="#9aa1a6"/><text x="296" y="98" font-size="15" font-weight="700" fill="#333" text-anchor="middle">24V DC</text><text x="296" y="116" font-size="10" fill="#555" text-anchor="middle">2.5 A · PSU</text>`;
  s += `<circle cx="346" cy="146" r="5" fill="#36e070"/><text x="336" y="150" font-size="9" fill="#333" text-anchor="end">DC OK</text>`;
  ['L','N','⏚'].forEach((l, i) => { const x = 246 + i * 34; s += `<circle cx="${x}" cy="44" r="7" fill="#d8dbdd" stroke="#6d7479"/><text x="${x}" y="64" font-size="11" text-anchor="middle" fill="#333">${l}</text>`; });
  ['+V','+V','−V','−V'].forEach((l, i) => { const x = 240 + i * 36; s += `<circle cx="${x}" cy="178" r="7" fill="#d8dbdd" stroke="#6d7479"/><text x="${x}" y="164" font-size="11" text-anchor="middle" fill="#333">${l}</text>`; });
  s += `<text class="ar" x="296" y="216" font-size="12" text-anchor="middle" fill="currentColor">24V DC power supply</text>`;
  return s + '</g></svg>';
};

// moving-part helper: a group whose transform animates from the previous state to the current one (SMIL, started by CL.animStart)
function mover(dyOff, dyOn, on, anim, inner, rot){
  const cur = on ? dyOn : dyOff, prev = on ? dyOff : dyOn;
  const tr = v => rot ? `rotate(${v} ${rot[0]} ${rot[1]})` : `translate(0 ${v})`;
  return `<g class="mv" transform="${tr(cur)}">${anim ? `<animateTransform attributeName="transform" type="${rot ? 'rotate' : 'translate'}" from="${rot ? prev + ' ' + rot[0] + ' ' + rot[1] : '0 ' + prev}" to="${rot ? cur + ' ' + rot[0] + ' ' + rot[1] : '0 ' + cur}" dur="0.14s" begin="indefinite" fill="freeze"/>` : ''}${inner}</g>`;
}
CL.animStart = function(host){ try { host.querySelectorAll('animateTransform[begin="indefinite"],animate[begin="indefinite"]').forEach(a => a.beginElement()); } catch(_) {} };
const copper = id => `<linearGradient id="cu${id}" x1="0" x2="1"><stop offset="0" stop-color="#8a4f1d"/><stop offset=".5" stop-color="#d9924f"/><stop offset="1" stop-color="#8a4f1d"/></linearGradient>`;
// plug-in relay in its DIN socket + pin numbering
CL.art.relayArt = function(d, o){
  o = o || {}; const id = ++UID, on = !!(d.st.coil || d.st.pin), dc = d.cfg.v <= 48, bl = d.blocks, n = bl.length, pins = n >= 4 ? 14 : n === 3 ? 11 : 8;
  let s = `<svg viewBox="0 0 440 284" role="img" aria-label="A relay plugged into a socket on a DIN rail"><defs>${copper(id)}<linearGradient id="gl${id}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="rgba(225,240,255,.85)"/><stop offset="1" stop-color="rgba(170,200,230,.55)"/></linearGradient></defs><g style="color:var(--ink)">`;
  // DIN rail + socket
  s += `<rect x="16" y="228" width="232" height="16" fill="#aab1b6" stroke="#6d757b"/><path d="M16 236H248" stroke="#7d8388" stroke-dasharray="6 6"/>`;
  s += `<rect x="40" y="152" width="184" height="78" rx="4" fill="#2c2f31" stroke="#111"/>`;
  const topT = []; bl.forEach(b => b.t.forEach(t => topT.push(t)));
  const sp = Math.min(27, 150 / Math.max(1, topT.length));
  topT.forEach((t, i) => { const x = 132 + (i - (topT.length - 1) / 2) * sp; s += `<circle cx="${x}" cy="172" r="6" fill="#d8dbdd" stroke="#555"/><path d="M${x-3} ${172-3}L${x+3} ${172+3}" stroke="#444" stroke-width="1.5"/><text x="${x}" y="194" font-size="9" fill="#eee" text-anchor="middle">${esc(t)}</text>`; });
  [['A1', 70], ['A2', 194]].forEach(([t, x]) => { s += `<circle cx="${x}" cy="212" r="6" fill="#d8dbdd" stroke="#555"/><path d="M${x-3} 209L${x+3} 215" stroke="#444" stroke-width="1.5"/><text x="${x}" y="226" font-size="9" fill="#eee" text-anchor="middle">${t}</text>`; });
  s += `<text class="ar" x="132" y="226" font-size="10" fill="#ddd" text-anchor="middle">socket ${pins} pin</text>`;
  // relay housing (clear)
  s += `<rect x="62" y="36" width="140" height="118" rx="5" fill="url(#gl${id})" stroke="#4f6f8f" stroke-width="1.5"/>`;
  s += `<text x="132" y="50" font-size="9" font-weight="700" fill="#243b52" text-anchor="middle">RELAY ${n}CO 10A · ${d.cfg.v}V ${dc ? 'DC' : 'AC'}</text>`;
  // LED + test button
  s += `<circle cx="78" cy="64" r="5" fill="${on ? '#36e070' : '#1f4a2a'}" stroke="#123"/>${on ? `<circle cx="78" cy="64" r="8" fill="#36e070" opacity=".35"/>` : ''}<text x="78" y="78" font-size="7" fill="#243b52" text-anchor="middle">LED</text>`;
  s += `<rect x="92" y="58" width="22" height="11" rx="2" fill="#f08a00" stroke="#8a4f00"/><text x="103" y="78" font-size="7" fill="#243b52" text-anchor="middle">TEST</text>`;
  // coil + core
  s += `<rect x="84" y="104" width="44" height="44" rx="3" fill="url(#cu${id})" stroke="#5a3410"/>${[0,1,2,3,4].map(i => `<path d="M${88+i*8} 106V146" stroke="#6b3d14" stroke-width=".8"/>`).join('')}<rect x="101" y="92" width="10" height="12" fill="#55595c"/><text x="106" y="128" font-size="8" fill="#fff" text-anchor="middle" font-weight="700">COIL</text>`;
  // armature pivot at (140,92): off = tilted up, on = flat on the core
  s += `<rect x="136" y="88" width="8" height="60" fill="#55595c"/>`;
  s += mover(-14, 0, on, o.anim, `<rect x="96" y="88" width="46" height="7" rx="2" fill="#8a9096" stroke="#444"/>`, [140, 92]);
  // contact sets: moving spring (common) between NC (top) and NO (bottom)
  bl.forEach((b, i) => { const x = 156 + i * 22; const co = b.k === 'CO';
    s += `<path d="M${x} 96V${co || b.k === 'NC' ? 106 : 120}" stroke="#7a4f1c" stroke-width="2"/>`;
    if (co || b.k === 'NC') s += `<path d="M${x-9} 106H${x+9}" stroke="#7a4f1c" stroke-width="3"/>`; // NC fixed
    if (co || b.k === 'NO') s += `<path d="M${x-9} 134H${x+9}" stroke="#7a4f1c" stroke-width="3"/>`; // NO fixed
    s += mover(0, 20, on, o.anim, `<path d="M${x-9} 112H${x+9}" stroke="${(on && (co || b.k === 'NO')) || (!on && (co || b.k === 'NC')) ? GOOD : '#c7893b'}" stroke-width="3"/><path d="M${x} 112V148" stroke="#c7893b" stroke-width="2"/>`);
    s += `<text x="${x}" y="153" font-size="7" fill="#243b52" text-anchor="middle">${esc(b.t[0])}</text>`;
  });
  s += `<text class="ar" x="132" y="26" font-size="12" text-anchor="middle" fill="currentColor">relay in its socket</text>`;
  s += `<text class="ar" x="132" y="262" font-size="11" text-anchor="middle" fill="${on ? GOOD : 'currentColor'}" font-weight="${on ? 700 : 400}">${on ? 'coil energised: armature pulled in, contacts changed over' : 'coil de-energised: the spring holds the armature out'}</text>`;
  // pin diagram (bottom view)
  const cx = 346, cy = 112, R = 54;
  s += `<text class="ar" x="${cx}" y="26" font-size="12" text-anchor="middle" fill="currentColor">pins from below (${pins} pin)</text><circle cx="${cx}" cy="${cy}" r="${R + 14}" fill="#1f2224" stroke="#000"/>`;
  const N = pins === 8 ? 8 : pins, lab8 = {1:'11',2:'A1',3:'14',4:'12',5:'22',6:'24',7:'A2',8:'21'};
  for (let i = 0; i < N; i++){ const a = Math.PI / 2 + (i + 0.5) * 2 * Math.PI / N, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a); const k = i + 1;
    s += `<rect x="${x-4}" y="${y-7}" width="8" height="14" rx="1" fill="#d8dbdd" stroke="#555" transform="rotate(${a * 180 / Math.PI - 90} ${x} ${y})"/><text x="${cx + (R - 18) * Math.cos(a)}" y="${cy + (R - 18) * Math.sin(a) + 4}" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">${k}</text>`;
    if (pins === 8) s += `<text x="${cx + (R + 24) * Math.cos(a)}" y="${cy + (R + 24) * Math.sin(a) + 4}" font-size="9" fill="currentColor" text-anchor="middle">${lab8[k]}</text>`; }
  s += `<circle cx="${cx}" cy="${cy}" r="7" fill="#444"/><path d="M${cx} ${cy-7}V${cy-R-14}" stroke="#777" stroke-width="3"/>`;
  if (pins === 8) s += `<text class="ar" x="${cx}" y="206" font-size="10" text-anchor="middle" fill="currentColor">2 and 7 = coil A1 / A2</text><text x="${cx}" y="222" font-size="10" text-anchor="middle" fill="currentColor">1-3-4 = 11-14-12 · 8-6-5 = 21-24-22</text>`;
  else s += `<text class="ar" x="${cx}" y="206" font-size="10" text-anchor="middle" fill="currentColor">${pins === 11 ? '11 pin = 3 CO contacts' : '14 pin = 4 CO contacts'}</text>`;
  s += `<text class="ar" x="220" y="280" font-size="10" text-anchor="middle" fill="var(--muted)">Numbers vary by maker: check the diagram printed on the relay or socket</text>`;
  return s + '</g></svg>';
};
// TeSys-D style contactor: front view + side cut
CL.art.contactorArt = function(d, o){
  o = o || {}; const id = ++UID, on = !!(d.st.closed || d.st.coil), aux = d.blocks;
  let s = `<svg viewBox="0 0 440 262" role="img" aria-label="Contactor from the front and in side section"><defs>${copper(id)}</defs><g style="color:var(--ink)">`;
  // ---- front
  s += `<text class="ar" x="120" y="22" font-size="12" text-anchor="middle" fill="currentColor">front view</text>`;
  s += `<rect x="30" y="30" width="180" height="200" rx="7" fill="#3b3f43" stroke="#1d2022"/>`;
  const scr = (x, y, lab, side) => `<circle cx="${x}" cy="${y}" r="8" fill="#d8dbdd" stroke="#555"/><path d="M${x-4} ${y-4}L${x+4} ${y+4}" stroke="#444" stroke-width="2"/><text x="${x}" y="${side < 0 ? y - 13 : y + 20}" font-size="8" fill="#eee" text-anchor="middle">${lab}</text>`;
  s += scr(48, 52, 'A1', -1) + scr(84, 52, '1/L1', -1) + scr(120, 52, '3/L2', -1) + scr(156, 52, '5/L3', -1) + scr(192, 52, aux[0] ? aux[0].t[0] : '13', -1);
  s += scr(48, 208, 'A2', 1) + scr(84, 208, '2/T1', 1) + scr(120, 208, '4/T2', 1) + scr(156, 208, '6/T3', 1) + scr(192, 208, aux[0] ? aux[0].t[1] : '14', 1);
  // moving carrier window
  s += `<rect x="66" y="78" width="108" height="30" rx="3" fill="#1b1d1f"/>`;
  s += mover(0, 8, on, o.anim, `<rect x="70" y="80" width="100" height="16" rx="2" fill="#cfd2d4"/><text x="120" y="92" font-size="10" fill="#222" text-anchor="middle" font-weight="700">${on ? '▼ I' : '0'}</text>`);
  s += `<rect x="60" y="118" width="120" height="70" rx="3" fill="#e9eaec" stroke="#9aa1a6"/><text x="120" y="134" font-size="10" fill="#222" text-anchor="middle" font-weight="700">${esc(d.cfg.model)}</text><text x="120" y="148" font-size="8" fill="#333" text-anchor="middle">AC-3: ${esc(d.cfg.ac3)}</text><text x="120" y="160" font-size="8" fill="#333" text-anchor="middle">AC-1: 25A · Ui 690V</text><text x="120" y="178" font-size="9" fill="#222" text-anchor="middle" font-weight="700">COIL ${d.cfg.v}V ${d.cfg.v <= 48 ? 'DC' : '50/60Hz'}</text>`;
  if (aux.length > 1) s += `<rect x="178" y="88" width="40" height="88" rx="3" fill="#565c61" stroke="#2a2d30"/><text x="198" y="104" font-size="7" fill="#eee" text-anchor="middle">LADN</text>${aux.slice(1).map((b, i) => `<text x="198" y="${122 + i * 14}" font-size="8" fill="#eee" text-anchor="middle">${esc(b.t[0])}-${esc(b.t[1])} ${b.k}</text>`).join('')}<text class="ar" x="198" y="168" font-size="7" fill="#ddd" text-anchor="middle">add-on block</text>`;
  s += `<text class="ar" x="120" y="250" font-size="11" text-anchor="middle" fill="${on ? GOOD : 'currentColor'}" font-weight="${on ? 700 : 400}">${on ? 'coil energised: all contacts closed' : 'coil de-energised: contacts open'}</text>`;
  // ---- side cut
  const X = 262, armY = on ? 118 : 102;
  s += `<text class="ar" x="${X+82}" y="22" font-size="12" text-anchor="middle" fill="currentColor">side section</text>`;
  s += `<rect x="${X}" y="30" width="164" height="200" rx="7" fill="none" stroke="#6d757b" stroke-dasharray="4 3"/>`;
  // fixed contacts + terminals
  s += `<path d="M${X+18} 40V84H${X+34}M${X+146} 40V84H${X+130}" stroke="#7a4f1c" stroke-width="3" fill="none"/>`;
  s += `<circle cx="${X+18}" cy="40" r="7" fill="#d8dbdd" stroke="#555"/><circle cx="${X+146}" cy="40" r="7" fill="#d8dbdd" stroke="#555"/><text x="${X+18}" y="26" font-size="8" text-anchor="middle" fill="currentColor">1/L1</text><text x="${X+146}" y="26" font-size="8" text-anchor="middle" fill="currentColor">2/T1</text>`;
  s += `<rect x="${X+22}" y="80" width="14" height="6" fill="#b87333"/><rect x="${X+128}" y="80" width="14" height="6" fill="#b87333"/>`;
  // fixed E core + coil
  const lam = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#8a9096" stroke="#444"/>${[1,2,3].map(i => `<path d="M${x} ${y + h * i / 4}H${x + w}" stroke="#5d656b" stroke-width=".7"/>`).join('')}`;
  s += lam(X+36, 180, 92, 18) + lam(X+36, 142, 16, 38) + lam(X+74, 142, 16, 38) + lam(X+112, 142, 16, 38);
  s += `<rect x="${X+58}" y="146" width="48" height="32" rx="3" fill="url(#cu${id})" stroke="#5a3410"/><text x="${X+82}" y="166" font-size="8" fill="#fff" text-anchor="middle" font-weight="700">COIL</text>`;
  s += `<text class="ar" x="${X+82}" y="214" font-size="9" text-anchor="middle" fill="currentColor">fixed core (laminations) and coil</text>`;
  // moving part
  s += mover(0, 16, on, o.anim, `${lam(X+36, 102, 92, 14)}${lam(X+36, 116, 16, 10)}${lam(X+74, 116, 16, 10)}${lam(X+112, 116, 16, 10)}<rect x="${X+76}" y="70" width="12" height="32" fill="#55595c"/><rect x="${X+22}" y="60" width="120" height="8" rx="2" fill="#6d757b"/><rect x="${X+22}" y="64" width="14" height="6" fill="${on ? GOOD : '#b87333'}"/><rect x="${X+128}" y="64" width="14" height="6" fill="${on ? GOOD : '#b87333'}"/>`);
  // return spring
  let z = `M${X+150} 104`; for (let i = 1; i <= 6; i++) z += `L${X + 150 + (i % 2 ? 6 : -6)} ${104 + i * 12}`; z += `L${X+150} 180`;
  s += `<path d="${z}" fill="none" stroke="#9aa0a5" stroke-width="1.6"/>`;
  s += `<text class="ar" x="${X+82}" y="52" font-size="9" text-anchor="middle" fill="currentColor">moving contact bridge</text><text class="ar" x="${X+92}" y="${armY - 3}" font-size="9" text-anchor="start" fill="currentColor">moving core</text>`;
  s += `<text class="ar" x="${X+82}" y="250" font-size="10" text-anchor="middle" fill="var(--muted)">${on ? 'gap closed (slight hum with an AC coil)' : 'return spring holds the gap open'}</text>`;
  return s + '</g></svg>';
};
// DIN-rail electronic timer (22.5 mm module): dial, range knob, function knob, LEDs, terminals, live countdown + timing diagram
CL.art.timerArt = function(d, o){
  o = o || {}; const id = ++UID, m = d.cfg.mode, on = !!d.st.coil, out = !!d.st.out, T = d.cfg.t, inst = !!d.cfg.inst, multi = !!d.cfg.multi;
  const el = d.st.el || 0, rem = m === 'cyc' ? (d.cfg.ton + d.cfg.toff) - (el % (d.cfg.ton + d.cfg.toff)) : Math.max(0, T - el);
  const timing = (m === 'on' && on) || (m === 'off' && !on && out) || (m === 'cyc' && on);
  let s = `<svg viewBox="0 0 440 262" role="img" aria-label="DIN-rail timer from the front, and its timing chart"><g style="color:var(--ink)">`;
  // ---- front
  s += `<text class="ar" x="110" y="20" font-size="12" text-anchor="middle" fill="currentColor">front view</text>`;
  s += `<rect x="40" y="26" width="140" height="210" rx="7" fill="#4b5560" stroke="#242a30"/><rect x="48" y="60" width="124" height="138" rx="5" fill="#e9eaec" stroke="#9aa1a6"/>`;
  const scr = (x, y, lab, side) => `<circle cx="${x}" cy="${y}" r="7" fill="#d8dbdd" stroke="#555"/><path d="M${x-3.5} ${y-3.5}L${x+3.5} ${y+3.5}" stroke="#444" stroke-width="1.8"/><text x="${x}" y="${side < 0 ? y - 11 : y + 17}" font-size="8" fill="#eee" text-anchor="middle">${lab}</text>`;
  const top = inst ? [['A1', 58], ['A2', 82], ['21', 118], ['22', 142], ['24', 166]] : [['A1', 70], ['A2', 110]];
  top.forEach(([l, x]) => { s += scr(x, 44, l, -1); });
  [['15', 70], ['16', 110], ['18', 150]].forEach(([l, x]) => s += scr(x, 218, l, 1));
  s += `<text x="110" y="74" font-size="8" font-weight="700" fill="#222" text-anchor="middle">${esc(d.cfg.model)} · TIMER</text><text x="110" y="84" font-size="6.5" fill="#333" text-anchor="middle">24–240V AC/DC · 8A · ${esc(d.cfg.range)}</text>`;
  // dial 0..10 with the pointer at the set time (scale = range top)
  const cx = 88, cy = 128, R = 26, ang = -135 + 270 * clamp(T / 10, 0, 1);
  s += `<circle cx="${cx}" cy="${cy}" r="${R + 4}" fill="#cfd3d6" stroke="#8a9096"/>`;
  for (let i = 0; i <= 10; i++){ const a = (-135 + 27 * i) * Math.PI / 180, r1_ = R + 1, r2_ = R + (i % 5 ? 3 : 5); s += `<path d="M${cx + r1_ * Math.sin(a)} ${cy - r1_ * Math.cos(a)}L${cx + r2_ * Math.sin(a)} ${cy - r2_ * Math.cos(a)}" stroke="#222" stroke-width="${i % 5 ? .8 : 1.4}"/>`; if (!(i % 5)) s += `<text x="${cx + (R + 11) * Math.sin(a)}" y="${cy - (R + 11) * Math.cos(a) + 3}" font-size="7" fill="#222" text-anchor="middle">${i}</text>`; }
  s += `<circle cx="${cx}" cy="${cy}" r="${R - 4}" fill="#1d1f21"/><g transform="rotate(${ang} ${cx} ${cy})"><rect x="${cx-3}" y="${cy-R+6}" width="6" height="${R+4}" rx="3" fill="#e9eaec"/><rect x="${cx-1}" y="${cy-R+8}" width="2" height="10" fill="#d32f2f"/></g>`;
  s += `<text x="${cx}" y="${cy + R + 20}" font-size="7.5" fill="#222" text-anchor="middle">t = ${T} s</text>`;
  // range + function knobs
  const knob = (x, y, lab, pos, opts) => { let k = `<circle cx="${x}" cy="${y}" r="9" fill="#2a2d30" stroke="#000"/><rect x="${x-1.5}" y="${y-8}" width="3" height="8" fill="#eee" transform="rotate(${pos} ${x} ${y})"/><text x="${x}" y="${y+19}" font-size="6.5" fill="#222" text-anchor="middle">${lab}</text>`; opts.forEach((t_, i) => { const a = (-60 + 40 * i) * Math.PI / 180; k += `<text x="${x + 14 * Math.sin(a)}" y="${y - 14 * Math.cos(a) + 2}" font-size="5" fill="#333" text-anchor="middle">${t_}</text>`; }); return k; };
  s += knob(144, 110, 'RANGE', -60 + 40 * 1, ['1s','10s','1m','10m']);
  if (multi) s += knob(144, 152, 'FUNC', -60 + 40 * ({on:0, off:1, cyc:2, sd:3})[m], ['A','B','C','D']);
  else s += `<text x="144" y="150" font-size="7" fill="#222" text-anchor="middle" font-weight="700">${CL.TIMER_MODES[m]}</text>`;
  // LEDs: U (supply) and R (relay)
  s += `<circle cx="60" cy="182" r="4" fill="${on ? '#36e070' : '#1f4a2a'}"/>${on ? '<circle cx="60" cy="182" r="7" fill="#36e070" opacity=".35"/>' : ''}<text x="60" y="194" font-size="6" fill="#222" text-anchor="middle">U</text>`;
  s += `<circle cx="78" cy="182" r="4" fill="${out ? '#ffd24d' : '#4a3d10'}"/>${out ? '<circle cx="78" cy="182" r="7" fill="#ffd24d" opacity=".4"/>' : ''}<text x="78" y="194" font-size="6" fill="#222" text-anchor="middle">R</text>`;
  // countdown badge (simulation overlay)
  s += `<rect x="92" y="172" width="74" height="20" rx="4" fill="#26313a"/><text x="129" y="186" font-size="11" font-weight="700" text-anchor="middle" fill="${timing ? '#5cff7a' : '#8aa0ad'}">${timing ? r1(rem).toFixed(1) + ' s' : (out ? 'OUT ✓' : '--.- s')}</text>`;
  s += `<text class="ar" x="110" y="252" font-size="11" text-anchor="middle" fill="${out ? GOOD : 'currentColor'}" font-weight="${out ? 700 : 400}">${out ? '15-18 closed (relay pulled in)' : on ? 'coil energised: 15-16 closed' : 'no supply: 15-16 closed'}</text>`;
  // ---- timing diagram
  const X = 206, W = 220, y1 = 70, y2 = 140, per = m === 'cyc' ? d.cfg.ton + d.cfg.toff : T;
  const span = m === 'cyc' ? per * 2.5 : T * 2.4, px = v => X + 10 + (W - 20) * clamp(v / span, 0, 1);
  s += `<text class="ar" x="${X + W/2}" y="20" font-size="12" text-anchor="middle" fill="currentColor">timing chart: ${CL.TIMER_MODES_AR[m]}</text>`;
  s += `<text x="${X}" y="${y1 - 24}" font-size="9" fill="currentColor">A1-A2</text><text x="${X}" y="${y2 - 24}" font-size="9" fill="currentColor">15-18</text>`;
  s += `<path d="M${X + 8} ${y1}H${X + W - 4}M${X + 8} ${y2}H${X + W - 4}" stroke="currentColor" stroke-width=".8" opacity=".4"/>`;
  const H = 18, step = (y, pts) => `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + px(p[0]) + ' ' + (y - H * p[1])).join('')}" fill="none" stroke="${y === y1 ? '#1f6fd1' : GOOD}" stroke-width="2.2"/>`;
  let coilPts, outPts, t0 = span * 0.12;
  if (m === 'on'){ const tEnd = span * 0.82; coilPts = [[0,0],[t0,0],[t0,1],[tEnd,1],[tEnd,0],[span,0]]; outPts = [[0,0],[t0+T,0],[t0+T,1],[tEnd,1],[tEnd,0],[span,0]]; }
  else if (m === 'off'){ const t1 = span * 0.4; coilPts = [[0,0],[t0,0],[t0,1],[t1,1],[t1,0],[span,0]]; outPts = [[0,0],[t0,0],[t0,1],[t1+T,1],[t1+T,0],[span,0]]; }
  else { coilPts = [[0,0],[t0,0],[t0,1],[span,1]]; outPts = [[0,0],[t0,0]]; let tt = t0, v = 1; while (tt < span){ outPts.push([tt, v]); const nxt = Math.min(span, tt + (v ? d.cfg.ton : d.cfg.toff)); outPts.push([nxt, v]); tt = nxt; v = v ? 0 : 1; } }
  s += step(y1, coilPts) + step(y2, outPts);
  if (m === 'on') s += `<path d="M${px(t0)} ${y2 + 10}H${px(t0 + T)}" stroke="currentColor" stroke-width="1" marker-end="none"/><text x="${(px(t0) + px(t0 + T)) / 2}" y="${y2 + 22}" font-size="9" text-anchor="middle" fill="currentColor">t = ${T}s</text>`;
  else if (m === 'off'){ const t1 = span * 0.4; s += `<path d="M${px(t1)} ${y2 + 10}H${px(t1 + T)}" stroke="currentColor" stroke-width="1"/><text x="${(px(t1) + px(t1 + T)) / 2}" y="${y2 + 22}" font-size="9" text-anchor="middle" fill="currentColor">t = ${T}s</text>`; }
  else s += `<text x="${px(t0 + d.cfg.ton / 2)}" y="${y2 + 22}" font-size="9" text-anchor="middle" fill="currentColor">ton ${d.cfg.ton}s</text><text x="${px(t0 + d.cfg.ton + d.cfg.toff / 2)}" y="${y2 + 22}" font-size="9" text-anchor="middle" fill="currentColor">toff ${d.cfg.toff}s</text>`;
  // live cursor
  if (timing || (on && m !== 'cyc')){ const cur = m === 'on' ? t0 + Math.min(el, span * 0.82 - t0) : m === 'off' ? (on ? t0 : span * 0.4 + el) : t0 + (el % (span - t0)); s += `<path d="M${px(cur)} ${y1 - H - 6}V${y2 + 6}" stroke="var(--bad)" stroke-width="1.6" stroke-dasharray="3 3"/>`; }
  s += `<text class="ar" x="${X + W/2}" y="${y2 + 44}" font-size="10" text-anchor="middle" fill="var(--muted)">${m === 'on' ? 'coil energised → after t, 15-18 closes · supply off → resets at once' : m === 'off' ? 'coil energised → 15-18 closes at once · supply off → stays closed for t, then opens' : 'while the coil is energised: 15-18 closes for ton and opens for toff, in turn'}</text>`;
  if (o.sim) s += `<text class="ar" x="${X + W/2}" y="${y2 + 60}" font-size="10" text-anchor="middle" fill="var(--muted)">dashed red line = now</text>`;
  return s + '</g></svg>';
};
CL.art.motorArt = function(d){ return `<svg viewBox="0 0 170 208" style="max-width:280px" role="img" aria-label="3-phase motor with its terminal box">${benchMotor(d, {}).svg}</svg>`; };
// two-relay electrical interlock (control circuit only)
CL.art.interlockLayout = function(){
  const T = (x, y, t, anc) => `<text class="sy-n" x="${x}" y="${y}" text-anchor="${anc || 'start'}" style="font-size:11px">${t}</text>`;
  const cNO = (x, y) => `<path class="sy" d="M${x} ${y}V${y+10}M${x} ${y+40}V${y+30}L${x-9} ${y+12}"/>`;
  const cNC = (x, y) => `<path class="sy" d="M${x} ${y}V${y+10}H${x+7}M${x} ${y+40}V${y+30}L${x-9} ${y+12}"/>`;
  const coil = (x, y, t) => `<rect class="sy" x="${x-14}" y="${y}" width="28" height="28"/>` + T(x + 18, y + 18, t) + T(x - 18, y + 6, 'A1', 'end') + T(x - 18, y + 34, 'A2', 'end');
  let s = `<svg viewBox="0 0 420 330" role="img" aria-label="Electrical interlock between two relays"><g style="color:var(--sym)">`;
  s += `<path class="sy" d="M20 40H400M20 300H400"/>` + T(16, 44, 'L', 'end') + T(16, 304, 'N', 'end');
  s += `<path class="sy" d="M60 40V60"/>` + cNC(60, 60) + T(68, 84, 'S0') + `<path class="sy" d="M60 100V112H340"/>`;
  [[120, 'S1', 'K1', 'K2'], [280, 'S2', 'K2', 'K1']].forEach(([x, sb, k, other]) => {
    s += `<path class="sy" d="M${x} 112V124"/>` + cNO(x, 124) + T(x + 8, 148, sb) + `<path class="sy" d="M${x} 116H${x+50}V124M${x+50} 164V172H${x}"/>` + cNO(x + 50, 124) + T(x + 58, 148, k) + T(x + 62, 132, '13') + T(x + 62, 164, '14');
    s += `<path class="sy" d="M${x} 164V186"/>` + cNC(x, 186) + T(x + 8, 210, other) + T(x - 12, 194, '21', 'end') + T(x - 12, 226, '22', 'end');
    s += `<path class="sy" d="M${x} 226V244M${x} 272V300"/>` + coil(x, 244, k);
    s += `<circle class="sy-f" cx="${x}" cy="116" r="3"/><circle class="sy-f" cx="${x}" cy="172" r="3"/>`;
  });
  s += `<circle class="sy-f" cx="60" cy="112" r="0"/><text class="ar" x="120" y="326" font-size="11" text-anchor="middle" fill="currentColor">K1 runs only if K2 is off</text><text class="ar" x="280" y="326" font-size="11" text-anchor="middle" fill="currentColor">K2 runs only if K1 is off</text>`;
  return s + '</g></svg>';
};
// standard DOL drawing: power circuit (left) + control circuit (right)
CL.art.dolLayout = function(opt){
  opt = Object.assign({tag:'KM1', power:true, h1:true, h2:true}, opt || {});
  const power = opt.power, ox = power ? 0 : -226, W = (opt.h2 ? 560 : 480) + ox;
  let s = `<svg viewBox="0 0 ${W} 372" role="img" aria-label="Power circuit and control circuit diagram"><g style="color:var(--sym)" transform="translate(${ox} 0)">`;
  const tag = opt.tag;
  const T = (x, y, t, anc) => `<text class="sy-n" x="${x}" y="${y}" text-anchor="${anc || 'start'}" style="font-size:11px">${t}</text>`;
  const AR = (x, y, t, cls) => `<text class="ar ${cls || ''}" x="${x}" y="${y}" font-size="12" text-anchor="middle" fill="currentColor" font-weight="700">${t}</text>`;
  const cNO = (x, y) => `<path class="sy" d="M${x} ${y}V${y+10}M${x} ${y+40}V${y+30}L${x-9} ${y+12}"/>`;
  const cNC = (x, y) => `<path class="sy" d="M${x} ${y}V${y+10}H${x+7}M${x} ${y+40}V${y+30}L${x-9} ${y+12}"/>`;
  const cMain = (x, y) => cNO(x, y) + `<path class="sy" d="M${x-4} ${y+10}A4 4 0 0 1 ${x+4} ${y+10}" style="stroke-width:1.6"/>`;
  // ---- power (3 phases)
  const px = [60, 92, 124];
  s += AR(400, 22, opt.ctlTitle || 'Control circuit');
  if (power){
  s += AR(92, 22, 'Power circuit');
  ['L1','L2','L3'].forEach((l, i) => { s += `<path class="sy" d="M${px[i]} 34V86"/>` + T(px[i] + 4, 46, l); });
  px.forEach(x => s += cMain(x, 86) + `<path class="sy" d="M${x} 126V166"/>`);
  s += `<path class="sy-d" d="M${px[0]-9} 102H${px[2]-9}"/><path class="sy" d="M${px[2]-9} 96l6 6l-6 6" style="stroke-width:1.5"/>` + T(px[2] + 10, 110, 'Q1');
  px.forEach(x => s += cMain(x, 166) + `<path class="sy" d="M${x} 206V250"/>`);
  s += `<path class="sy-d" d="M${px[0]-9} 182H${px[2]-9}"/>` + T(px[2] + 10, 190, 'KM1') + T(px[0] - 4, 236, '1', 'end') + T(px[1] - 4, 236, '3', 'end') + T(px[2] - 4, 236, '5', 'end');
  s += `<path class="sy" d="M${px[0]} 250L${92-22} 282M${px[1]} 250V274M${px[2]} 250L${92+22} 282"/>`;
  s += `<circle class="sy" cx="92" cy="306" r="30"/><text class="sy-n" x="92" y="302" text-anchor="middle" style="font-size:14px">M</text><text class="sy-n" x="92" y="318" text-anchor="middle">3~</text>` + T(70, 276, 'U', 'end') + T(96, 270, 'V') + T(118, 276, 'W') + T(128, 312, 'M1');
  if (opt.ol) s += AR(92, 356, 'Overload F2 goes here in the protection lesson', '');
  }
  // ---- control
  const L1y = 40, Ny = 340;
  s += `<path class="sy" d="M250 ${L1y}H540M250 ${Ny}H540"/>` + T(246, L1y + 4, 'L1', 'end') + T(246, Ny + 4, 'N', 'end');
  // F1 → S0 → (S1 || KM1 13-14) → KM1 coil → N
  const cx = 300;
  s += `<path class="sy" d="M${cx} ${L1y}V56"/>` + cNO(cx, 56) + `<path class="sy" d="M${cx-11} 72l6 6l-6 6" style="stroke-width:1.5"/>` + T(cx + 8, 80, 'F1');
  s += `<path class="sy" d="M${cx} 96V110"/>` + cNC(cx, 110) + T(cx + 10, 134, 'S0') + T(cx - 12, 118, '21', 'end') + T(cx - 12, 150, '22', 'end');
  s += `<path class="sy" d="M${cx} 150V172"/>` + cNO(cx, 172) + T(cx + 8, 196, 'S1') + T(cx - 12, 180, '13', 'end') + T(cx - 12, 212, '14', 'end');
  s += `<path class="sy" d="M${cx} 164H${cx+50}V172M${cx+50} 212V222H${cx}M${cx} 212V236"/>` + cNO(cx + 50, 172) + T(cx + 58, 196, tag) + T(cx + 62, 180, opt.holdT ? opt.holdT[0] : '13') + T(cx + 62, 212, opt.holdT ? opt.holdT[1] : '14');
  s += `<rect class="sy" x="${cx-14}" y="256" width="28" height="28"/><path class="sy" d="M${cx} 236V256M${cx} 284V${Ny}"/>` + T(cx + 18, 274, tag) + T(cx - 18, 262, 'A1', 'end') + T(cx - 18, 290, 'A2', 'end');
  s += `<circle class="sy-f" cx="${cx}" cy="164" r="3"/><circle class="sy-f" cx="${cx}" cy="222" r="3"/>`;
  s += AR(cx + 62, 158, 'seal-in contact', 'sy-s');
  // H1 RUN via KM1 14 (same node as A1): branch from the node under S1
  const hx = 430;
  if (opt.h1) s += `<path class="sy" d="M${cx} 236H${hx}V270"/><circle class="sy-f" cx="${cx}" cy="236" r="3"/><circle class="sy" cx="${hx}" cy="292" r="20"/><path class="sy" d="M${hx-14} 278L${hx+14} 306M${hx+14} 278L${hx-14} 306M${hx} 312V${Ny}"/>` + T(hx + 24, 296, 'H1') + AR(hx, 330, 'running (green)', 'sy-s');
  if (!opt.h2) return s + '</g></svg>';
  // H2 STOP via KM1 21-22, fed after F1 (before S0) so it stays lit while STOP is pressed
  const kx = 500;
  s += `<path class="sy" d="M${cx} 103H${kx}V180"/><circle class="sy-f" cx="${cx}" cy="103" r="3"/>` + cNC(kx, 180) + T(kx + 8, 204, tag) + T(kx - 12, 188, '21', 'end') + T(kx - 12, 220, '22', 'end');
  s += `<path class="sy" d="M${kx} 220V270"/><circle class="sy" cx="${kx}" cy="292" r="20"/><path class="sy" d="M${kx-14} 278L${kx+14} 306M${kx+14} 278L${kx-14} 306M${kx} 312V${Ny}"/>` + T(kx + 24, 296, 'H2') + AR(kx, 330, 'stopped (red)', '');
  return s + '</g></svg>';
};


/* ---------- protection devices: realistic drawings ---------- */
const scrw = (x, y, r, on) => `<circle cx="${x}" cy="${y}" r="${r || 7}" fill="#d8dbdd" stroke="${on ? GOOD : '#555'}" stroke-width="${on ? 2.2 : 1.2}"/><path d="M${x - r * .55} ${y - r * .55}L${x + r * .55} ${y + r * .55}" stroke="#444" stroke-width="1.6"/>`;
// three fuse types side by side
CL.art.fuseArt = function(d){
  const id = ++UID, blown = !!(d.st && d.st.trip);
  let s = `<svg viewBox="0 0 440 236" role="img" aria-label="Fuse types: glass, cartridge in a holder, and NH blade"><defs>${copper(id)}<linearGradient id="gl${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,.9)"/><stop offset=".5" stop-color="rgba(200,225,245,.45)"/><stop offset="1" stop-color="rgba(120,150,180,.5)"/></linearGradient><linearGradient id="cer${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fbf6e4"/><stop offset="1" stop-color="#d9cfae"/></linearGradient></defs><g style="color:var(--ink)">`;
  // 1) glass fuse 5x20
  s += `<text class="ar" x="72" y="20" font-size="12" text-anchor="middle" fill="currentColor" font-weight="700">5×20 glass fuse</text>`;
  s += `<rect x="16" y="60" width="18" height="34" rx="2" fill="url(#chr${id})" stroke="#666"/><rect x="110" y="60" width="18" height="34" rx="2" fill="url(#chr${id})" stroke="#666"/><rect x="34" y="62" width="76" height="30" rx="4" fill="url(#gl${id})" stroke="#6f8aa6"/>`;
  s += blown ? `<path d="M34 77H58M86 77H110" stroke="#8a4f1d" stroke-width="1.6"/><circle cx="72" cy="77" r="4" fill="#333" opacity=".6"/><text class="ar" x="72" y="112" font-size="11" text-anchor="middle" fill="var(--bad)" font-weight="700">wire broken (blown)</text>` : `<path d="M34 77H110" stroke="#8a4f1d" stroke-width="1.6"/><text class="ar" x="72" y="112" font-size="11" text-anchor="middle" fill="currentColor">thin wire inside the glass</text>`;
  s += `<text x="72" y="130" font-size="10" text-anchor="middle" fill="var(--muted)">F 2A 250V</text><text class="ar" x="72" y="146" font-size="10" text-anchor="middle" fill="var(--muted)">for electronics and small control panels</text>`;
  // 2) cartridge 10x38 gG in a DIN holder, lever open
  s += `<text class="ar" x="220" y="20" font-size="12" text-anchor="middle" fill="currentColor" font-weight="700">10×38 cartridge in a DIN holder</text>`;
  s += `<rect x="178" y="30" width="84" height="150" rx="5" fill="#8f979c" stroke="#4b5257"/><rect x="186" y="40" width="68" height="20" rx="3" fill="#6d7479"/><rect x="186" y="150" width="68" height="20" rx="3" fill="#6d7479"/>`;
  s += `<g transform="rotate(-28 220 150)"><rect x="196" y="60" width="48" height="96" rx="5" fill="#b9bfc4" stroke="#4b5257"/><rect x="208" y="68" width="24" height="80" rx="3" fill="url(#cer${id})" stroke="#8a7a52"/><rect x="208" y="68" width="24" height="12" fill="url(#chr${id})" stroke="#666"/><rect x="208" y="136" width="24" height="12" fill="url(#chr${id})" stroke="#666"/><text x="220" y="112" font-size="7" text-anchor="middle" fill="#5a4a22" font-weight="700">gG 10A</text><circle cx="220" cy="90" r="3" fill="${blown ? '#d32f2f' : '#eee'}"/></g>`;
  s += `<text class="ar" x="220" y="200" font-size="10" text-anchor="middle" fill="currentColor">the lever opens so you can take out and replace the cartridge</text><text class="ar" x="220" y="216" font-size="10" text-anchor="middle" fill="var(--muted)">gG for normal loads · aM for motors (takes the starting current)</text>`;
  // 3) NH blade fuse
  s += `<text class="ar" x="366" y="20" font-size="12" text-anchor="middle" fill="currentColor" font-weight="700">NH00 blade fuse</text>`;
  s += `<rect x="358" y="36" width="16" height="28" fill="url(#chr${id})" stroke="#666"/><rect x="358" y="150" width="16" height="28" fill="url(#chr${id})" stroke="#666"/><rect x="334" y="60" width="64" height="94" rx="6" fill="url(#cer${id})" stroke="#8a7a52"/><rect x="344" y="70" width="44" height="34" rx="3" fill="#f4f4f1" stroke="#999"/><text x="366" y="84" font-size="8" text-anchor="middle" fill="#333" font-weight="700">NH00 gG</text><text x="366" y="97" font-size="8" text-anchor="middle" fill="#333">100A 500V</text><circle cx="366" cy="128" r="6" fill="#ddd" stroke="#777"/><rect x="363" y="120" width="6" height="8" fill="${blown ? '#d32f2f' : '#1f9d55'}"/>`;
  s += `<text class="ar" x="366" y="200" font-size="10" text-anchor="middle" fill="currentColor">for high currents (6A to 1250A)</text><text class="ar" x="366" y="216" font-size="10" text-anchor="middle" fill="var(--muted)">removed with a special insulated puller · indicator turns red when blown</text>`;
  return s + '</g></svg>';
};
// MCB: 1P and 3P fronts + cut-away showing the thermal (bimetal) and magnetic (solenoid) releases
CL.art.mcbArt = function(d){
  const id = ++UID, on = !!(d.st && d.st.on && !d.st.trip), trip = !!(d.st && d.st.trip), lab = d.cfg.label || 'C16', n = d.cfg.poles || 1;
  let s = `<svg viewBox="0 0 440 262" role="img" aria-label="Single-pole and 3-pole MCB, and an inside view"><defs>${copper(id)}</defs><g style="color:var(--ink)">`;
  const pole = (x, w, label, first) => {
    let q = `<rect x="${x}" y="30" width="${w}" height="190" rx="4" fill="#f4f4f1" stroke="#8c8f8a"/>`;
    q += scrw(x + w/2, 48, 7) + scrw(x + w/2, 202, 7) + `<text x="${x + w/2}" y="68" font-size="9" text-anchor="middle" fill="#333">${first ? '1' : ''}</text>`;
    q += `<rect x="${x + 6}" y="96" width="${w - 12}" height="56" rx="4" fill="#3a3e41"/>`;
    q += `<rect x="${x + 9}" y="${on ? 100 : 124}" width="${w - 18}" height="24" rx="3" fill="${on ? '#1f6fd1' : '#55595c'}"/><text x="${x + w/2}" y="${on ? 116 : 140}" font-size="9" fill="#fff" text-anchor="middle" font-weight="700">${on ? 'I ON' : 'O OFF'}</text>`;
    if (trip) q += `<rect x="${x + 6}" y="156" width="${w - 12}" height="12" rx="2" fill="#d32f2f"/><text x="${x + w/2}" y="165" font-size="8" fill="#fff" text-anchor="middle" font-weight="700">TRIP</text>`;
    q += `<text x="${x + w/2}" y="86" font-size="11" font-weight="700" fill="#333" text-anchor="middle">${esc(label)}</text><text x="${x + w/2}" y="184" font-size="7" fill="#555" text-anchor="middle">${n > 1 ? '400V~' : '230V~'} 6000</text>`;
    return q;
  };
  s += `<text class="ar" x="56" y="20" font-size="12" text-anchor="middle" fill="currentColor">single pole (1P)</text>` + pole(36, 40, lab, true) + `<text class="ar" x="56" y="240" font-size="10" text-anchor="middle" fill="var(--muted)">for control and lamps</text>`;
  s += `<text class="ar" x="166" y="20" font-size="12" text-anchor="middle" fill="currentColor">3-pole (3P) for a motor</text>`;
  [0, 1, 2].forEach(i => { s += pole(108 + i * 40, 40, i === 1 ? lab : '', false); });
  s += `<rect x="112" y="124" width="112" height="4" fill="#1f6fd1" opacity=".7"/><text class="ar" x="166" y="240" font-size="10" text-anchor="middle" fill="var(--muted)">common handle: all 3 trip together</text>`;
  // cut-away
  const X = 252;
  s += `<text class="ar" x="${X + 90}" y="20" font-size="12" text-anchor="middle" fill="currentColor">inside the breaker</text><rect x="${X}" y="30" width="180" height="190" rx="6" fill="none" stroke="#6d757b" stroke-dasharray="4 3"/>`;
  s += scrw(X + 24, 46, 7) + `<path d="M${X + 24} 54V84" stroke="#b87333" stroke-width="3"/>`;
  s += `<path d="M${X + 24} 84L${on ? X + 24 : X + 44} ${on ? 118 : 108}" stroke="${on ? GOOD : '#8a9096'}" stroke-width="3"/><circle cx="${X + 24}" cy="118" r="4" fill="#b87333"/><text class="ar" x="${X + 56}" y="86" font-size="8" fill="currentColor">contact</text>`;
  s += `<path d="M${X + 24} 122V140" stroke="#b87333" stroke-width="3"/>`;
  // bimetal strip (thermal) + heater
  s += `<rect x="${X + 20}" y="140" width="8" height="40" fill="#d9924f" stroke="#8a4f1d"/><rect x="${X + 16}" y="140" width="4" height="40" fill="#8a9096"/><text class="ar" x="${X + 60}" y="150" font-size="8" fill="currentColor">bimetal (thermal)</text><text class="ar" x="${X + 60}" y="162" font-size="7.5" fill="var(--muted)">heats up with overload</text><text class="ar" x="${X + 60}" y="173" font-size="7.5" fill="var(--muted)">bends slowly → trips in seconds/minutes</text>`;
  // solenoid (magnetic)
  s += `<rect x="${X + 110}" y="60" width="40" height="46" rx="3" fill="url(#cu${id})" stroke="#5a3410"/><rect x="${X + 126}" y="50" width="8" height="66" fill="#55595c"/><text class="ar" x="${X + 130}" y="128" font-size="8" fill="currentColor" text-anchor="middle">magnetic coil</text><text class="ar" x="${X + 130}" y="140" font-size="7.5" fill="var(--muted)" text-anchor="middle">short = huge current</text><text class="ar" x="${X + 130}" y="151" font-size="7.5" fill="var(--muted)" text-anchor="middle">pulls the plunger, trips instantly</text>`;
  // arc chute
  s += `${[0,1,2,3,4,5].map(i => `<rect x="${X + 100 + i * 7}" y="168" width="4" height="34" fill="#6d7479"/>`).join('')}<text class="ar" x="${X + 120}" y="214" font-size="8" fill="currentColor" text-anchor="middle">arc chute</text>`;
  s += scrw(X + 24, 204, 7) + `<path d="M${X + 24} 180V196" stroke="#b87333" stroke-width="3"/>`;
  s += `<text class="ar" x="${X + 90}" y="240" font-size="10" text-anchor="middle" fill="var(--muted)">thermal for overload + magnetic for short circuit</text>`;
  return s + '</g></svg>';
};
// I-t trip curves B / C / D (log-log) with the motor start marker
CL.art.tripCurve = function(d){
  const In = d ? ratingOf(d) : 10;
  const X0 = 56, X1 = 420, Y0 = 20, Y1 = 196;
  const lx = k => X0 + (Math.log10(k) - Math.log10(1)) / (Math.log10(30) - 0) * (X1 - X0);
  const ly = t => Y1 - (Math.log10(t) - Math.log10(0.01)) / (Math.log10(3600) - Math.log10(0.01)) * (Y1 - Y0);
  let s = `<svg viewBox="0 0 440 236" role="img" aria-label="Trip curves B, C and D"><g style="color:var(--ink)">`;
  [1, 2, 3, 5, 10, 20, 30].forEach(k => { s += `<path d="M${lx(k)} ${Y0}V${Y1}" stroke="var(--line)" stroke-width="1"/><text x="${lx(k)}" y="${Y1 + 14}" font-size="9" text-anchor="middle" fill="currentColor">${k}×In</text>`; });
  [0.01, 0.1, 1, 10, 60, 600, 3600].forEach(t => { s += `<path d="M${X0} ${ly(t)}H${X1}" stroke="var(--line)" stroke-width="1"/><text x="${X0 - 4}" y="${ly(t) + 3}" font-size="9" text-anchor="end" fill="currentColor">${t >= 3600 ? '1h' : t >= 60 ? t/60 + 'min' : t + 's'}</text>`; });
  // thermal part (shared): t = 100/(k²-1) from 1.13 to the magnetic multiple, then vertical drop to 0.01 s
  const curve = (mag, col, name) => { let p = ''; for (let k = 1.15; k <= mag; k *= 1.06){ const t = Math.min(3600, 100 / (k*k - 1)); p += (p ? 'L' : 'M') + lx(k).toFixed(1) + ' ' + ly(t).toFixed(1); } p += `L${lx(mag)} ${ly(0.01)}`; return `<path d="${p}" fill="none" stroke="${col}" stroke-width="2.4"/><text x="${lx(mag) + 3}" y="${ly(0.04)}" font-size="11" font-weight="700" fill="${col}">${name}</text>`; };
  s += curve(4, '#1f6fd1', 'B') + curve(8, '#1f9d55', 'C') + curve(15, '#d32f2f', 'D');
  // motor inrush 6×In for 1 s
  s += `<rect x="${lx(5.5)}" y="${ly(1.2)}" width="${lx(7.5) - lx(5.5)}" height="${ly(0.6) - ly(1.2)}" fill="#f0a03c" opacity=".55"/><text class="ar" x="${lx(6.5)}" y="${ly(1.2) - 6}" font-size="9" text-anchor="middle" fill="currentColor" font-weight="700">motor starting current (6–7×In for a second)</text>`;
  s += `<text class="ar" x="${(X0 + X1) / 2}" y="${Y1 + 30}" font-size="10" text-anchor="middle" fill="var(--muted)">Right of / above the line trips. B trips on motor start, C and D don't.</text>`;
  return s + '</g></svg>';
};
// thermal overload relay (LRD style): front + bimetal cut-away
CL.art.olArt = function(d, o){
  o = o || {}; const id = ++UID, st = d.st || {}, trip = !!st.trip, heat = st.heat || 0, Ir = d.cfg.Ir || 5;
  let s = `<svg viewBox="0 0 440 292" role="img" aria-label="Thermal overload from the front, and a section of the bimetal"><defs>${copper(id)}</defs><g style="color:var(--ink)">`;
  s += `<text class="ar" x="110" y="18" font-size="12" text-anchor="middle" fill="currentColor">front view (LRD / TeSys)</text>`;
  // pins into the contactor
  [60, 100, 140].forEach((x, i) => { s += `<rect x="${x - 5}" y="26" width="10" height="22" fill="#b87333" stroke="#5a3410"/><text x="${x}" y="22" font-size="8" text-anchor="middle" fill="currentColor">${['1/L1','3/L2','5/L3'][i]}</text>`; });
  s += `<rect x="30" y="48" width="160" height="200" rx="7" fill="#3b3f43" stroke="#1d2022"/>`;
  s += `<rect x="40" y="56" width="140" height="44" rx="3" fill="#e9eaec" stroke="#9aa1a6"/><text x="110" y="72" font-size="10" fill="#222" text-anchor="middle" font-weight="700">${esc(d.cfg.model || 'LRD10')}</text><text x="110" y="86" font-size="8" fill="#333" text-anchor="middle">${esc(d.cfg.range || '4-6 A')} · Class ${d.cfg.cls || 10} · 690V</text>`;
  // Ir dial
  const a0 = -120, a1 = 120, lo = d.cfg.lo || 4, hi = d.cfg.hi || 6.5, ang = a0 + (clamp((Ir - lo) / (hi - lo), 0, 1)) * (a1 - a0);
  s += `<circle cx="80" cy="140" r="26" fill="#1f6fd1" stroke="#0f3e7a"/><circle cx="80" cy="140" r="20" fill="#2a7fe0"/>`;
  for (let i = 0; i <= 5; i++){ const a = (a0 + i * (a1 - a0) / 5 - 90) * Math.PI / 180; s += `<text x="${80 + 32 * Math.cos(a)}" y="${140 + 32 * Math.sin(a) + 3}" font-size="7" text-anchor="middle" fill="#eee">${(lo + i * (hi - lo) / 5).toFixed(1)}</text>`; }
  s += `<g transform="rotate(${ang} 80 140)"><rect x="77" y="122" width="6" height="22" rx="2" fill="#fff"/></g><text class="ar" x="80" y="182" font-size="8" fill="#eee" text-anchor="middle">set Ir = ${Ir}A</text>`;
  // reset / test / auto-man / trip indicator
  s += `<rect x="124" y="112" width="40" height="18" rx="3" fill="#1f6fd1" stroke="#0f3e7a"/><text x="144" y="125" font-size="8" fill="#fff" text-anchor="middle" font-weight="700">RESET</text>`;
  s += `<rect x="124" y="138" width="40" height="18" rx="3" fill="#d32f2f" stroke="#7d1414"/><text x="144" y="151" font-size="8" fill="#fff" text-anchor="middle" font-weight="700">TEST</text>`;
  s += `<rect x="124" y="164" width="40" height="14" rx="2" fill="#e9eaec"/><rect x="${d.cfg.reset === 'auto' ? 145 : 126}" y="166" width="17" height="10" rx="2" fill="#555"/><text x="134" y="174" font-size="7" fill="${d.cfg.reset === 'auto' ? '#333' : '#fff'}" text-anchor="middle">H</text><text x="154" y="174" font-size="7" fill="${d.cfg.reset === 'auto' ? '#fff' : '#333'}" text-anchor="middle">A</text><text class="ar" x="144" y="190" font-size="7" fill="#eee" text-anchor="middle">manual / auto</text>`;
  s += `<rect x="124" y="60" width="0" height="0"/><rect x="42" y="194" width="30" height="14" rx="2" fill="${trip ? '#d32f2f' : '#1f9d55'}"/><text x="57" y="204" font-size="7" fill="#fff" text-anchor="middle" font-weight="700">${trip ? 'TRIP' : 'OK'}</text>`;
  // heat bar
  s += `<rect x="42" y="214" width="136" height="8" rx="3" fill="#1b1d1f"/><rect x="42" y="214" width="${136 * heat}" height="8" rx="3" fill="${trip ? '#d32f2f' : heat > .7 ? '#e8590c' : '#e0a21b'}"/><text class="ar" x="110" y="236" font-size="8" fill="#eee" text-anchor="middle">bimetal heat ${Math.round(heat * 100)}% · I = ${r1(st.I || 0)}A</text>`;
  // terminals at the bottom
  [60, 100, 140].forEach((x, i) => { s += scrw(x, 262, 7) + `<text x="${x}" y="282" font-size="8" text-anchor="middle" fill="currentColor">${['2/T1','4/T2','6/T3'][i]}</text>`; });
  [[172, 118, '95'], [172, 142, '96'], [172, 170, '97'], [172, 194, '98']].forEach(([x, y, t]) => { s += scrw(x + 4, y, 5, (t === '95' || t === '96') ? !trip : trip) + `<text x="${x + 14}" y="${y + 3}" font-size="7" fill="currentColor">${t}</text>`; });
  // ---- cut-away
  const X = 236;
  s += `<text class="ar" x="${X + 100}" y="18" font-size="12" text-anchor="middle" fill="currentColor">section: bimetal and trip latch</text><rect x="${X}" y="26" width="200" height="222" rx="6" fill="none" stroke="#6d757b" stroke-dasharray="4 3"/>`;
  const bend = trip ? 16 : heat * 12;
  [0, 1, 2].forEach(i => { const x = X + 30 + i * 36;
    s += `<path d="M${x} 36V60" stroke="#b87333" stroke-width="3"/>`;
    // heater winding around the bimetal
    s += `<path d="M${x} 60 C${x + bend * 0.3} 90 ${x + bend * 0.8} 120 ${x + bend} 150" stroke="#8a9096" stroke-width="8" fill="none"/><path d="M${x} 60 C${x + bend * 0.3} 90 ${x + bend * 0.8} 120 ${x + bend} 150" stroke="#d9924f" stroke-width="4" fill="none"/>`;
    for (let j = 0; j < 6; j++){ const y = 68 + j * 14; s += `<path d="M${x - 7 + bend * (j / 6) * 0.6} ${y}L${x + 7 + bend * (j / 6) * 0.6} ${y + 5}" stroke="#8a4f1d" stroke-width="1.4"/>`; }
    s += `<path d="M${x + bend} 150V176" stroke="#b87333" stroke-width="3"/>`;
  });
  // trip bar (slide) pushed right when bent
  s += `<rect x="${X + 20 + bend}" y="152" width="110" height="8" rx="2" fill="${trip ? '#d32f2f' : '#6d757b'}"/><text class="ar" x="${X + 75}" y="172" font-size="8" fill="currentColor" text-anchor="middle">${trip ? 'trip bar moved and tripped' : 'trip bar'}</text>`;
  // contacts 95-96 (NC) and 97-98 (NO) driven by the bar
  const cx = X + 160;
  s += `<path d="M${cx - 10} 60V84" stroke="#7a4f1c" stroke-width="2"/><path d="M${cx - 18} 84H${cx - 2}" stroke="${trip ? '#7a4f1c' : GOOD}" stroke-width="3"/><text x="${cx - 28}" y="66" font-size="7" fill="currentColor">95</text><text x="${cx - 28}" y="100" font-size="7" fill="currentColor">96</text>`;
  s += `<path d="M${cx - 10} ${trip ? 96 : 90}L${cx - 10 + 16} ${trip ? 112 : 90}" stroke="${trip ? '#c7893b' : GOOD}" stroke-width="3"/>`;
  s += `<path d="M${cx + 20} 60V84" stroke="#7a4f1c" stroke-width="2"/><path d="M${cx + 12} 112H${cx + 28}" stroke="${trip ? GOOD : '#7a4f1c'}" stroke-width="3"/><text x="${cx + 30}" y="66" font-size="7" fill="currentColor">97</text><text x="${cx + 30}" y="124" font-size="7" fill="currentColor">98</text>`;
  s += `<path d="M${cx + 20} 84L${cx + 20} ${trip ? 112 : 100}" stroke="${trip ? GOOD : '#c7893b'}" stroke-width="3"/>`;
  s += `<path class="sy-d" d="M${X + 130 + bend} 156V130H${cx + 4}"/>`;
  s += `<text class="ar" x="${X + 100}" y="196" font-size="9" fill="currentColor" text-anchor="middle">current flows through a heater around a strip of two metals</text><text class="ar" x="${X + 100}" y="210" font-size="9" fill="currentColor" text-anchor="middle">(bimetal). It heats and bends → pushes the trip bar →</text><text class="ar" x="${X + 100}" y="224" font-size="9" fill="currentColor" text-anchor="middle">95-96 opens (drops the contactor), 97-98 closes (fault lamp)</text>`;
  s += `<text class="ar" x="${X + 100}" y="242" font-size="9" fill="${trip ? 'var(--bad)' : 'var(--muted)'}" text-anchor="middle" font-weight="${trip ? 700 : 400}">${trip ? 'Tripped! Let it cool, then press RESET' : heat > 0.5 ? 'heating…' : 'cold, in its normal state'}</text>`;
  return s + '</g></svg>';
};
// motor protection circuit breaker (GV2-ME style)
CL.art.mpcbArt = function(d){
  const id = ++UID, st = d.st || {}, on = !!(st.on && !st.trip), trip = !!st.trip, Ir = d.cfg.Ir || 5, lo = d.cfg.lo || 4, hi = d.cfg.hi || 6.3;
  let s = `<svg viewBox="0 0 440 262" role="img" aria-label="Motor protection circuit breaker (MPCB) from the front"><defs>${copper(id)}</defs><g style="color:var(--ink)">`;
  s += `<text class="ar" x="120" y="18" font-size="12" text-anchor="middle" fill="currentColor">MPCB (GV2-ME) front view</text>`;
  [70, 120, 170].forEach((x, i) => { s += scrw(x, 40, 7) + `<text x="${x}" y="26" font-size="8" text-anchor="middle" fill="currentColor">${['1/L1','3/L2','5/L3'][i]}</text>`; s += scrw(x, 226, 7) + `<text x="${x}" y="246" font-size="8" text-anchor="middle" fill="currentColor">${['2/T1','4/T2','6/T3'][i]}</text>`; });
  s += `<rect x="40" y="52" width="160" height="166" rx="7" fill="#3b3f43" stroke="#1d2022"/>`;
  // rotary knob
  s += `<circle cx="120" cy="104" r="34" fill="#1b1d1f"/><circle cx="120" cy="104" r="28" fill="${trip ? '#d32f2f' : '#2a2d30'}" stroke="#555"/>`;
  s += `<g transform="rotate(${on ? 0 : trip ? -45 : -90} 120 104)"><rect x="112" y="78" width="16" height="52" rx="6" fill="#e9eaec" stroke="#555"/><rect x="118" y="82" width="4" height="18" rx="2" fill="#333"/></g>`;
  s += `<text x="120" y="64" font-size="9" fill="#eee" text-anchor="middle" font-weight="700">I ON</text><text x="76" y="108" font-size="9" fill="#eee" text-anchor="middle" font-weight="700">O OFF</text><text x="86" y="78" font-size="8" fill="#ff8a80" text-anchor="middle" font-weight="700">TRIP</text>`;
  // Ir dial
  const a0 = -120, a1 = 120, ang = a0 + clamp((Ir - lo) / (hi - lo), 0, 1) * (a1 - a0);
  s += `<circle cx="80" cy="172" r="18" fill="#1f6fd1" stroke="#0f3e7a"/><g transform="rotate(${ang} 80 172)"><rect x="78" y="158" width="4" height="16" rx="2" fill="#fff"/></g><text x="80" y="200" font-size="7" fill="#eee" text-anchor="middle">Ir ${lo}–${hi}A → ${Ir}A</text>`;
  s += `<rect x="112" y="152" width="76" height="40" rx="3" fill="#e9eaec" stroke="#9aa1a6"/><text x="150" y="166" font-size="9" fill="#222" text-anchor="middle" font-weight="700">${esc(d.cfg.label || 'GV2ME10')}</text><text x="150" y="178" font-size="7" fill="#333" text-anchor="middle">Class 10 · Icu 100kA</text><text x="150" y="188" font-size="7" fill="#333" text-anchor="middle">${lo}–${hi} A · 690V</text>`;
  s += `<rect x="112" y="200" width="36" height="12" rx="2" fill="#d32f2f"/><text x="130" y="209" font-size="7" fill="#fff" text-anchor="middle">TEST</text>`;
  // aux block on the side
  s += `<rect x="204" y="64" width="40" height="140" rx="4" fill="#565c61" stroke="#2a2d30"/><text x="224" y="78" font-size="7" fill="#eee" text-anchor="middle">GVAN11</text>`;
  [['13', 96, on], ['14', 120, on], ['21', 154, !on], ['22', 178, !on]].forEach(([t, y, c]) => { s += scrw(224, y, 5, c) + `<text x="238" y="${y + 3}" font-size="7" fill="#eee">${t}</text>`; });
  s += `<text class="ar" x="224" y="200" font-size="6.5" fill="#ddd" text-anchor="middle">aux. contact</text>`;
  // explanation
  const X = 262;
  s += `<text class="ar" x="${X + 85}" y="18" font-size="12" text-anchor="middle" fill="currentColor">What's inside?</text><rect x="${X}" y="28" width="170" height="214" rx="6" fill="none" stroke="#6d757b" stroke-dasharray="4 3"/>`;
  s += `<text class="ar" x="${X + 85}" y="52" font-size="10" fill="currentColor" text-anchor="middle" font-weight="700">1. Magnetic: short circuit</text><text class="ar" x="${X + 85}" y="66" font-size="8.5" fill="var(--muted)" text-anchor="middle">trips instantly (≈ 12×Ir)</text>`;
  s += `<text class="ar" x="${X + 85}" y="92" font-size="10" fill="currentColor" text-anchor="middle" font-weight="700">2. Thermal: overload</text><text class="ar" x="${X + 85}" y="106" font-size="8.5" fill="var(--muted)" text-anchor="middle">bimetal set to Ir, like an overload</text><text class="ar" x="${X + 85}" y="118" font-size="8.5" fill="var(--muted)" text-anchor="middle">Class 10 and phase-loss protection</text>`;
  s += `<text class="ar" x="${X + 85}" y="144" font-size="10" fill="currentColor" text-anchor="middle" font-weight="700">3. Manual isolator</text><text class="ar" x="${X + 85}" y="158" font-size="8.5" fill="var(--muted)" text-anchor="middle">switch the motor off and padlock it (lockout)</text>`;
  s += `<text class="ar" x="${X + 85}" y="184" font-size="10" fill="currentColor" text-anchor="middle" font-weight="700">= fuse + overload in one unit</text><text class="ar" x="${X + 85}" y="198" font-size="8.5" fill="var(--muted)" text-anchor="middle">with a contactor it makes a full starter</text>`;
  s += `<text class="ar" x="${X + 85}" y="226" font-size="9" fill="${trip ? 'var(--bad)' : on ? GOOD : 'var(--muted)'}" text-anchor="middle" font-weight="700">${trip ? 'TRIP: turn the handle to OFF, then ON' : on ? 'on: 13-14 closed' : 'off: 21-22 closed'}</text>`;
  return s + '</g></svg>';
};
// DOL with full protection: Q1 → KM1 → F2 → M in the power circuit; F1 → 95-96 → S0 → S1||KM1 → coil; H1 run, H2 stop, H3 fault on 97-98
CL.art.dolProt = function(opt){
  opt = Object.assign({tag:'KM1'}, opt || {});
  const T = (x, y, t, anc) => `<text class="sy-n" x="${x}" y="${y}" text-anchor="${anc || 'start'}" style="font-size:11px">${t}</text>`;
  const AR = (x, y, t) => `<text class="ar" x="${x}" y="${y}" font-size="12" text-anchor="middle" fill="currentColor" font-weight="700">${t}</text>`;
  const cNO = (x, y) => `<path class="sy" d="M${x} ${y}V${y+10}M${x} ${y+40}V${y+30}L${x-9} ${y+12}"/>`;
  const cNC = (x, y) => `<path class="sy" d="M${x} ${y}V${y+10}H${x+7}M${x} ${y+40}V${y+30}L${x-9} ${y+12}"/>`;
  const cMain = (x, y) => cNO(x, y) + `<path class="sy" d="M${x-4} ${y+10}A4 4 0 0 1 ${x+4} ${y+10}" style="stroke-width:1.6"/>`;
  const lamp = (x, y, t, sub) => `<circle class="sy" cx="${x}" cy="${y}" r="18"/><path class="sy" d="M${x-12.7} ${y-12.7}L${x+12.7} ${y+12.7}M${x+12.7} ${y-12.7}L${x-12.7} ${y+12.7}"/>` + T(x + 22, y + 4, t) + `<text class="ar sy-s" x="${x}" y="${y + 34}" font-size="10" text-anchor="middle">${sub}</text>`;
  const W = 600, H = 440;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="DOL with full protection: power and control"><g style="color:var(--sym)">`;
  // ---- power
  const px = [60, 92, 124];
  s += AR(92, 22, 'Power circuit');
  ['L1','L2','L3'].forEach((l, i) => { s += `<path class="sy" d="M${px[i]} 34V70"/>` + T(px[i] + 4, 46, l); });
  px.forEach(x => s += cMain(x, 70) + `<path class="sy" d="M${x} 110V140"/>`);
  s += `<path class="sy-d" d="M${px[0]-9} 86H${px[2]-9}"/>` + T(px[2] + 10, 92, 'Q1');
  px.forEach(x => s += cMain(x, 140) + `<path class="sy" d="M${x} 180V210"/>`);
  s += `<path class="sy-d" d="M${px[0]-9} 156H${px[2]-9}"/>` + T(px[2] + 10, 162, opt.tag);
  // F2 thermal elements
  px.forEach(x => s += `<rect class="sy" x="${x-8}" y="210" width="16" height="30" style="fill:var(--panel)"/><path class="sy" d="M${x-8} 225H${x-3}A3 3 0 0 1 ${x+3} 225H${x+8}" style="stroke-width:1.8"/><path class="sy" d="M${x} 240V280"/>`);
  s += `<path class="sy-d" d="M${px[0]} 240V250H${px[2]}V240"/>` + T(px[2] + 12, 230, 'F2') + T(px[0] - 4, 266, '2', 'end') + T(px[1] - 4, 266, '4', 'end') + T(px[2] - 4, 266, '6', 'end');
  s += `<path class="sy" d="M${px[0]} 280L${92-22} 312M${px[1]} 280V304M${px[2]} 280L${92+22} 312"/>`;
  s += `<circle class="sy" cx="92" cy="336" r="30"/><text class="sy-n" x="92" y="332" text-anchor="middle" style="font-size:14px">M</text><text class="sy-n" x="92" y="348" text-anchor="middle">3~</text>` + T(70, 306, 'U', 'end') + T(96, 300, 'V') + T(118, 306, 'W') + T(128, 342, 'M1');
  s += `<text class="ar sy-s" x="92" y="392" font-size="10" text-anchor="middle">Q1 for short circuit · F2 for overload</text>`;
  // ---- control
  const L1y = 40, Ny = 410, cx = 290;
  s += AR(420, 22, 'Control circuit');
  s += `<path class="sy" d="M230 ${L1y}H590M230 ${Ny}H590"/>` + T(226, L1y + 4, 'L1', 'end') + T(226, Ny + 4, 'N', 'end');
  s += `<path class="sy" d="M${cx} ${L1y}V52"/>` + cNO(cx, 52) + `<path class="sy" d="M${cx-11} 68l6 6l-6 6" style="stroke-width:1.5"/>` + T(cx + 8, 76, 'F1');
  // F2 95-96 with thermal actuator
  s += `<path class="sy" d="M${cx} 92V104"/>` + cNC(cx, 104) + `<path class="sy" d="M${cx-30} 118A8 8 0 0 0 ${cx-30} 134" style="stroke-width:2"/><path class="sy-d" d="M${cx-26} 126H${cx-12}"/>` + T(cx + 10, 128, 'F2') + T(cx - 12, 110, '95', 'end') + T(cx - 12, 148, '96', 'end');
  s += `<path class="sy" d="M${cx} 144V156"/>` + cNC(cx, 156) + T(cx + 10, 180, 'S0') + T(cx - 12, 164, '21', 'end') + T(cx - 12, 196, '22', 'end');
  s += `<path class="sy" d="M${cx} 196V216"/>` + cNO(cx, 216) + T(cx + 8, 240, 'S1') + T(cx - 12, 224, '13', 'end') + T(cx - 12, 256, '14', 'end');
  s += `<path class="sy" d="M${cx} 208H${cx+50}V216M${cx+50} 256V266H${cx}M${cx} 256V282"/>` + cNO(cx + 50, 216) + T(cx + 58, 240, opt.tag) + T(cx + 62, 224, '13') + T(cx + 62, 256, '14');
  s += `<rect class="sy" x="${cx-14}" y="300" width="28" height="28"/><path class="sy" d="M${cx} 282V300M${cx} 328V${Ny}"/>` + T(cx + 18, 318, opt.tag) + T(cx - 18, 306, 'A1', 'end') + T(cx - 18, 334, 'A2', 'end');
  s += `<circle class="sy-f" cx="${cx}" cy="208" r="3"/><circle class="sy-f" cx="${cx}" cy="266" r="3"/>`;
  // H1 run (parallel to the coil)
  const hx = 410;
  s += `<path class="sy" d="M${cx} 282H${hx}V318"/><circle class="sy-f" cx="${cx}" cy="282" r="3"/>` + lamp(hx, 336, 'H1', 'running') + `<path class="sy" d="M${hx} 354V${Ny}"/>`;
  // H3 fault on 97-98 (fed after F1)
  const fx = 500;
  s += `<path class="sy" d="M${cx} 98H${fx}V104"/><circle class="sy-f" cx="${cx}" cy="98" r="3"/>` + cNO(fx, 104) + `<path class="sy" d="M${fx-30} 118A8 8 0 0 0 ${fx-30} 134" style="stroke-width:2"/><path class="sy-d" d="M${fx-26} 126H${fx-12}"/>` + T(fx + 10, 128, 'F2') + T(fx - 12, 110, '97', 'end') + T(fx - 12, 148, '98', 'end');
  s += `<path class="sy" d="M${fx} 144V318"/>` + lamp(fx, 336, 'H3', 'fault (yellow)') + `<path class="sy" d="M${fx} 354V${Ny}"/>`;
  s += `<text class="ar sy-s" x="420" y="${Ny + 24}" font-size="10" text-anchor="middle">When F2 trips: 95-96 opens so the contactor drops out, and 97-98 closes so H3 lights</text>`;
  return s + '</g></svg>';
};

/* =========================== bench drawings (170 × h cells) =========================== */
const CW = 170;
/* photo skin: a galvanised DIN rail behind every device, at the device's mounting height */
function railSvg(w, h){ const y = Math.round(h * 0.55) - 9; return `<g class="bd-rail" aria-hidden="true"><rect x="-6" y="${y}" width="${w + 12}" height="18" fill="#8e9398"/><rect x="-6" y="${y + 2}" width="${w + 12}" height="5" fill="#e2e5e7"/><rect x="-6" y="${y + 11}" width="${w + 12}" height="4" fill="#70757a"/>${Array.from({length:Math.max(1, Math.floor((w + 12) / 34))}, (_, i) => `<rect x="${i * 34 + 4}" y="${y + 7}" width="18" height="5" rx="2.5" fill="#55595d"/>`).join('')}</g>`; }
function cellHead(d, sub, w){ return `<text class="bd-id" x="${w/2}" y="15">${esc(d.tag)}${sub ? ' · ' : ''}<tspan class="bd-sub">${esc(sub || '')}</tspan></text>`; }
// caption of a contact block: the type never changes, the state word and colour follow the live state
CL.capState = function(k, closed, op, who){ return `${k} · ${closed ? 'closed' : 'open'}${op ? ' (' + (who || 'Pressed') + ')' : ''}`; };
const WHO = d => d.type === 'level' ? 'reached' : ['pb','estop','sel','ls'].indexOf(d.type) > -1 ? 'Pressed' : d.type === 'ol' || d.type === 'mpcb' || d.type === 'mcb' ? 'off' : 'running';
const CAPRED = '#d6332a', CAPRED_D = '#ff8a80', CAPGRN_D = '#4ee07a';
// a row of contact blocks with screws top/bottom; returns {svg, terms}
function benchBlocks(d, cx0, opFn, live, y0){
  y0 = y0 || 106;
  const bl = d.blocks, n = bl.length, sp = 60, terms = {};
  let s = '';
  bl.forEach((b, i) => {
    const x = cx0 + (i - (n - 1) / 2) * sp, op = opFn(b), cl = blockClosed(b, op), tab = b.k === 'NO' ? '#2f9e44' : b.k === 'NC' ? '#d6332a' : '#777';
    if (b.k === 'CO'){
      s += `<rect x="${x-26}" y="${y0}" width="52" height="84" rx="4" fill="#efeee9" stroke="#8c8f8a"/>`;
      terms[b.t[0]] = {x, y:y0+12, dir:-1}; terms[b.t[1]] = {x:x-14, y:y0+72, dir:1}; terms[b.t[2]] = {x:x+14, y:y0+72, dir:1};
      s += `<text x="${x}" y="${y0-4}" font-size="11" text-anchor="middle" font-weight="700" fill="var(--ink)">${b.t[0]}</text><text x="${x-14}" y="${y0+98}" font-size="11" text-anchor="middle" font-weight="700" fill="var(--ink)">${b.t[1]}</text><text x="${x+14}" y="${y0+98}" font-size="11" text-anchor="middle" font-weight="700" fill="var(--ink)">${b.t[2]}</text>`;
      s += `<path d="M${x} ${y0+52}L${op ? x+12 : x-12} ${y0+36}" stroke="${GOOD}" stroke-width="2.4"/>`;
      s += `<text class="blk-cap" x="${x}" y="${y0+114}" font-size="8.5" text-anchor="middle" font-weight="700" fill="${GOOD}">CO · ${b.t[0]}-${op ? b.t[2] : b.t[1]} closed${op ? ' (' + WHO(d) + ')' : ''}</text>`;
      return;
    }
    s += `<rect x="${x-22}" y="${y0}" width="44" height="84" rx="4" fill="#efeee9" stroke="#8c8f8a"/><rect x="${x-22}" y="${y0}" width="44" height="7" rx="3" fill="${tab}"/>`;
    s += `<text x="${x}" y="${y0-4}" font-size="12" text-anchor="middle" font-weight="700" fill="var(--ink)">${esc(b.t[0])}</text><text x="${x}" y="${y0+100}" font-size="12" text-anchor="middle" font-weight="700" fill="var(--ink)">${esc(b.t[1])}</text>`;
    s += `<text class="blk-cap" data-blk="${esc(b.t[0])}-${esc(b.t[1])}" x="${x}" y="${y0+114}" font-size="8.5" text-anchor="middle" font-weight="700" fill="${cl ? GOOD : CAPRED}">${CL.capState(b.k, cl, op, WHO(d))}</text>`;
    // mini IEC glyph
    const yy = y0 + 28, gc = cl ? GOOD : '#5d656b';
    s += `<path d="M${x} ${yy}V${yy+8}${b.k === 'NC' ? 'H'+(x+7) : ''}M${x} ${yy+28}V${yy+20}" stroke="${gc}" stroke-width="2" fill="none"/>`;
    const tip = b.k === 'NC' ? (cl ? [x+8, yy+7] : [x-9, yy+9]) : (cl ? [x-1, yy+8] : [x-9, yy+9]);
    s += `<path d="M${x} ${yy+20}L${tip[0]} ${tip[1]}" stroke="${gc}" stroke-width="2.4" fill="none"/>`;
    terms[b.t[0]] = {x, y:y0+14, dir:-1}; terms[b.t[1]] = {x, y:y0+70, dir:1};
  });
  return {svg:s, terms};
}
function benchPb(d, ctx){
  const c = colOf(d.cfg.color), p = TYPES[d.type].op(d), mush = d.type === 'estop', id = ++UID;
  let s = cellHead(d, d.cfg.label, CW) + '<!--dh-->' + `<defs><radialGradient id="bc${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${c.l}"/><stop offset=".6" stop-color="${c.b}"/><stop offset="1" stop-color="${c.d}"/></radialGradient></defs>`;
  if (mush){
    s += `<circle cx="85" cy="58" r="36" fill="#f3c613" stroke="#a88500"/><circle cx="85" cy="58" r="${p ? 24 : 27}" fill="url(#bc${id})" stroke="${c.d}" stroke-width="1.5"/>`;
    if (p) s += `<text x="85" y="63" font-size="15" text-anchor="middle" fill="#fff">↻</text>`;
  } else {
    s += `<circle cx="85" cy="58" r="33" fill="#c9cdd0" stroke="#7d8388"/><circle cx="85" cy="58" r="28" fill="${p ? '#0b0c0d' : '#1d1f21'}"/><circle cx="85" cy="58" r="${p ? 20 : 23}" fill="url(#bc${id})" stroke="${p ? '#111' : c.d}" stroke-width="${p ? 3 : 1}"/>`;
    if (!p) s += `<ellipse cx="78" cy="50" rx="8" ry="5" fill="rgba(255,255,255,.35)"/>`;
    else s += `<circle cx="85" cy="58" r="${p ? 20 : 23}" fill="rgba(0,0,0,.28)"/>`;
    if (d.st.pin) s += `<rect class="bpin-badge" x="126" y="74" width="40" height="14" rx="7" fill="#d6332a"/><text x="146" y="84" font-size="8.5" font-weight="700" fill="#fff" text-anchor="middle">pressed</text>`;
  }
  s += '<!--/dh-->';
  const B = benchBlocks(d, 85, b => TYPES[d.type].op(d, b), ctx.live);
  s += B.svg;
  let hit = `<circle class="ba${mush ? '' : ' hold'}" data-dev="${d.id}" data-act="${mush ? 'latch' : 'press'}" cx="85" cy="58" r="36" tabindex="0" role="button" aria-label="${mush ? 'E-stop: tap to press, tap again to twist it out' : 'Press and hold ' + esc(d.tag)}"/>`;
  if (!mush && (d.blocks.some(b => b.k !== 'NC') || ctx.allowPinStop)){ // no pin on a STOP / NC-only button unless the exercise allows it
    const on = d.st.pin;
    hit += `<g class="bpin${on ? ' on' : ''}" data-dev="${d.id}" data-act="pin" tabindex="0" role="button" aria-pressed="${on ? 'true' : 'false'}" aria-label="Keeps the button pressed without holding it"><title>Keeps the button pressed without holding it</title><rect x="126" y="24" width="40" height="44" rx="8"/><text x="146" y="42" font-size="9">${on ? 'release' : 'hold'}</text><text x="146" y="53" font-size="9">${on ? '' : 'Pressed'}</text><text x="146" y="64">📌</text></g>`;
  }
  return {svg:s, hit, terms:B.terms};
}
function benchSel(d, ctx){
  const P = d.cfg.pos, n = P.length, angs = n === 3 ? [-45, 0, 45] : [-45, 45], a = angs[d.st.pos] || 0;
  let s = '<!--dh-->' + cellHead(d, d.cfg.label || (n === 3 ? '3-position selector' : 'ON/OFF switch'), CW);
  s += `<circle cx="85" cy="62" r="31" fill="#c9cdd0" stroke="#7d8388"/><circle cx="85" cy="62" r="26" fill="#1d1f21"/>`;
  angs.forEach((g, i) => { const rad = (g - 90) * Math.PI / 180; s += `<text x="${85 + 41*Math.cos(rad)}" y="${62 + 41*Math.sin(rad) + 4}" font-size="11" font-weight="700" text-anchor="middle" fill="${i === d.st.pos ? 'var(--accent)' : 'var(--ink)'}">${esc(P[i].length > 2 ? P[i][0] : P[i])}</text>`; });
  s += `<g transform="rotate(${a} 85 62)"><rect x="78" y="38" width="14" height="48" rx="6" fill="#2a2d30" stroke="#000"/><rect x="83.5" y="41" width="3" height="16" rx="1.5" fill="#eee"/></g>`;
  s += `<text x="20" y="66" font-size="16" text-anchor="middle" fill="var(--muted)">⟲</text><text x="150" y="66" font-size="16" text-anchor="middle" fill="var(--muted)">⟳</text>`;
  s += '<!--/dh-->';
  const B = benchBlocks(d, 85, b => TYPES.sel.op(d, b), ctx.live);
  s += B.svg;
  const hit = `<rect class="ba" data-dev="${d.id}" data-act="selL" x="4" y="22" width="81" height="76" tabindex="0" role="button" aria-label="Turn ${esc(d.tag)} left"/><rect class="ba" data-dev="${d.id}" data-act="selR" x="85" y="22" width="81" height="76" tabindex="0" role="button" aria-label="Turn ${esc(d.tag)} right"/>`;
  return {svg:s, hit, terms:B.terms};
}
function benchLs(d, ctx){
  const x = d.st.x || 0, linked = !!d.cfg.cart;
  let s = cellHead(d, d.cfg.label || 'limit switch', CW) + '<!--dh-->';
  const cr = 50 + x * 86, th = Math.asin(clamp((cr + 6 - 136) / 16, 0, 0.45)), rx = 136 + 16 * Math.sin(th), ry = 86 - 16 * Math.cos(th) + 16 - 16 + 0;
  s += `<rect x="114" y="22" width="44" height="34" rx="4" fill="#c3c7ca" stroke="#6d7479"/><text x="136" y="44" font-size="10" font-weight="700" text-anchor="middle" fill="#333">LS</text><rect x="126" y="56" width="20" height="10" rx="2" fill="#3a3e41"/>`;
  s += `<line x1="136" y1="64" x2="${136 + 18*Math.sin(th)}" y2="${64 + 18*Math.cos(th)}" stroke="#4b5257" stroke-width="4" stroke-linecap="round"/><circle cx="${136 + 18*Math.sin(th)}" cy="${64 + 18*Math.cos(th)}" r="6" fill="#ecebe6" stroke="#4b5257" stroke-width="1.5"/>`;
  void rx; void ry;
  if (!linked){
    s += `<rect x="6" y="94" width="150" height="4" fill="#7b8389"/><rect x="${cr-44}" y="72" width="36" height="18" rx="3" fill="#2f6fb5"/><rect x="${cr-10}" y="72" width="10" height="20" fill="#e0a21b"/><circle cx="${cr-36}" cy="92" r="4" fill="#2a2d30"/><circle cx="${cr-16}" cy="92" r="4" fill="#2a2d30"/>`;
    s += `<text x="${cr-26}" y="68" font-size="12" text-anchor="middle" fill="var(--muted)">${x > 0.5 ? '←' : '→'}</text>`;
  } else s += `<text class="ar" x="56" y="70" font-size="11" text-anchor="middle" fill="var(--muted)">moves with ${esc(d.cfg.cart)}</text>`;
  s += '<!--/dh-->';
  const B = benchBlocks(d, 85, () => !!d.st.a, ctx.live);
  s += B.svg;
  const hit = linked ? '' : `<rect class="ba" data-dev="${d.id}" data-act="cart" x="4" y="58" width="108" height="42" tabindex="0" role="button" aria-label="Move the cart to the limit switch or back"/>`;
  return {svg:s, hit, terms:B.terms};
}
function benchLamp(d, ctx){
  const c = colOf(d.cfg.color), on = !!ctx.en, burnt = d.st.burnt, id = ++UID;
  let s = cellHead(d, d.name || (d.cfg.v + 'V'), CW) + '<!--dh-->';
  s += `<defs><radialGradient id="ll${id}" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${c.lens}"/><stop offset="1" stop-color="${c.b}"/></radialGradient></defs>`;
  s += `<circle cx="85" cy="58" r="33" fill="#c9cdd0" stroke="#7d8388"/><circle cx="85" cy="58" r="33" fill="none" stroke="#5f666b" stroke-width="2" stroke-dasharray="2 3"/>`;
  s += `<g class="${on ? 'lit' : ''}" style="--glow:${c.lens}"><circle cx="85" cy="58" r="24" fill="${on ? `url(#ll${id})` : c.off}" stroke="#333"/></g>`;
  if (!on) s += `<ellipse cx="78" cy="50" rx="8" ry="5" fill="rgba(255,255,255,.22)"/>`;
  if (burnt) s += `<path d="M70 43L100 73M100 43L70 73" stroke="#111" stroke-width="3"/><text class="ar" x="85" y="102" font-size="10" text-anchor="middle" fill="var(--bad)">burned out</text>`;
  s += '<!--/dh-->';
  const x = 85, y0 = 106;
  s += `<rect x="${x-22}" y="${y0}" width="44" height="84" rx="4" fill="#efeee9" stroke="#8c8f8a"/><text x="${x}" y="${y0-4}" font-size="12" text-anchor="middle" font-weight="700" fill="var(--ink)">X1</text><text x="${x}" y="${y0+100}" font-size="12" text-anchor="middle" font-weight="700" fill="var(--ink)">X2</text>`;
  s += `<circle cx="${x}" cy="${y0+42}" r="9" fill="none" stroke="${on ? GOOD : '#5d656b'}" stroke-width="1.8"/><path d="M${x-6.4} ${y0+35.6}l12.8 12.8M${x+6.4} ${y0+35.6}l-12.8 12.8" stroke="${on ? GOOD : '#5d656b'}" stroke-width="1.8"/>`;
  return {svg:s, hit:'', terms:{X1:{x, y:y0+14, dir:-1}, X2:{x, y:y0+70, dir:1}}};
}
function benchSupply(d, ctx){
  const T = d.type, on = d.st.on && !d.st.trip, trip = d.st.trip;
  if (T === 'supply3P'){
    const w = ctx.w || 340, c = w < 300, sp = c ? 36 : 60, x0 = w / 2 - 1.5 * sp;
    let s = cellHead(d, '400V 3~ + N', w);
    ['#7b4a21','#1f1f1f','#8a8f94','#3a9be0'].forEach((cl, i) => { s += `<path d="M${x0 + i * sp} 22V40" stroke="${cl}" stroke-width="3"/>`; });
    s += `<rect x="${w/2 - (c ? 72 : 116)}" y="40" width="${c ? 144 : 232}" height="56" rx="5" fill="#f4f4f1" stroke="#8c8f8a"/><rect x="${w/2 - 30}" y="${on ? 46 : 70}" width="60" height="20" rx="3" fill="${on ? '#1f9d55' : '#3a3e41'}"/><text x="${w/2}" y="${on ? 60 : 84}" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">${on ? 'I ON' : 'O OFF'}</text>`;
    if (trip) s += `<rect x="${w/2 + 36}" y="48" width="${c ? 34 : 56}" height="18" rx="3" fill="#d32f2f"/><text x="${w/2 + (c ? 53 : 64)}" y="61" font-size="${c ? 8 : 10}" font-weight="700" fill="#fff" text-anchor="middle">TRIP</text>`;
    const terms = {};
    ['L1','L2','L3','N'].forEach((n, i) => { const x = x0 + i * sp; terms[n] = {x, y:118, dir:1}; s += `<text x="${x}" y="108" font-size="12" font-weight="700" text-anchor="middle" fill="var(--ink)">${n}</text>`; });
    return {svg:s, hit:`<rect class="ba" data-dev="${d.id}" data-act="mcb" x="${w/2 - 40}" y="40" width="80" height="86" tabindex="0" role="button" aria-label="Main breaker"/>`, terms};
  }
  const dc = T === 'supplyDC';
  let s = cellHead(d, dc ? '24V DC' : '230V AC', CW);
  if (dc){
    s += `<rect x="32" y="24" width="106" height="72" rx="5" fill="#cfd3d6" stroke="#7d8388"/><text x="85" y="44" font-size="12" font-weight="700" text-anchor="middle" fill="#333">PSU 24V</text>`;
    s += `<circle cx="50" cy="60" r="5" fill="${on ? '#36e070' : '#55605a'}"/><text x="60" y="64" font-size="9" fill="#333">DC OK</text>`;
    s += `<rect x="88" y="52" width="40" height="16" rx="3" fill="${trip ? '#d32f2f' : '#f4f4f1'}" stroke="#777"/><text x="108" y="64" font-size="9" text-anchor="middle" fill="${trip ? '#fff' : '#333'}">${trip ? 'FUSE ✗' : 'F 2A'}</text>`;
    s += `<rect x="46" y="74" width="78" height="16" rx="3" fill="${on ? '#1f9d55' : '#3a3e41'}"/><text x="85" y="86" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">${on ? 'ON' : 'OFF'}</text>`;
  } else {
    s += `<path d="M64 22V30" stroke="#7b4a21" stroke-width="3"/><path d="M106 22V30" stroke="#3a9be0" stroke-width="3"/>`;
    s += `<rect x="42" y="28" width="86" height="68" rx="5" fill="#f4f4f1" stroke="#8c8f8a"/><path d="M85 28V96" stroke="#d5d5ce"/><text x="85" y="42" font-size="10" font-weight="700" text-anchor="middle" fill="#333">${esc(d.cfg.label)}</text>`;
    s += `<rect x="58" y="${on ? 48 : 68}" width="54" height="20" rx="3" fill="${on ? '#1f9d55' : '#3a3e41'}"/><text x="85" y="${on ? 62 : 82}" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">${on ? 'I ON' : 'O OFF'}</text>`;
    if (trip) s += `<rect x="96" y="30" width="30" height="13" rx="2" fill="#d32f2f"/><text x="111" y="40" font-size="8" font-weight="700" fill="#fff" text-anchor="middle">TRIP</text>`;
  }
  const a = dc ? ['P24','0V'] : ['L','N'], lab = dc ? ['+24V','0V'] : ['L','N'];
  const terms = {};
  a.forEach((n, i) => { const x = 60 + i * 50; terms[n] = {x, y:118, dir:1}; s += `<text x="${x}" y="108" font-size="12" font-weight="700" text-anchor="middle" fill="var(--ink)">${lab[i]}</text>`; });
  return {svg:s, hit:`<rect class="ba" data-dev="${d.id}" data-act="mcb" x="32" y="24" width="106" height="72" tabindex="0" role="button" aria-label="${dc ? 'Power supply switch' : 'the breaker'}: switch on or off"/>`, terms};
}
// generic DIN-style box for relays, contactors, timers, overloads, breakers, motors…
function benchBox(d, o){
  const w = o.w || CW * TYPES[d.type].span(d), terms = {};
  let s = cellHead(d, o.sub, w);
  const y1 = o.y1 || 40, y2 = o.y2 || 150;
  s += `<rect x="10" y="${y1 - 14}" width="${w - 20}" height="${y2 - y1 + 28}" rx="6" fill="${o.fill || '#e9eaec'}" stroke="#7d8388"/>`;
  const place = (list, y, dir) => { const n = list.length, sp = Math.min(54, (w - 40) / Math.max(1, n)); list.forEach((t, i) => { if (!t) return; const x = w/2 + (i - (n - 1) / 2) * sp; terms[t.n] = {x, y, dir}; s += `<text x="${x}" y="${y + dir * -18 + (dir < 0 ? 0 : 4)}" font-size="11" font-weight="700" text-anchor="middle" fill="#222">${esc(t.lab || t.n)}</text>`; }); };
  place(o.top || [], y1, -1); place(o.bot || [], y2, 1);
  s += o.body || '';
  return {svg:s, hit:o.hit || '', terms};
}
const tl = a => a.map(n => n ? (typeof n === 'string' ? {n} : n) : null);
function benchGeneric(d, ctx){
  const T = d.type, w = ctx.w || CW * TYPES[T].span(d), mid = 95;
  if (T === 'contactor'){
    const aux = d.blocks, cl = d.st.closed;
    const body = `<rect x="${w/2-44}" y="${mid-16}" width="88" height="30" rx="4" fill="#cfd2d4" stroke="#8a9096"/><rect x="${w/2-10}" y="${mid - (cl ? 6 : 12)}" width="20" height="12" fill="${cl ? '#1f9d55' : '#3a3e41'}"/><text x="${w/2}" y="${mid+10}" font-size="9" text-anchor="middle" fill="#333">${cl ? 'closed' : 'open'}</text>`;
    return benchBox(d, {w, sub:'contactor', top:tl(['A1',{n:'1',lab:'1/L1'},{n:'3',lab:'3/L2'},{n:'5',lab:'5/L3'}].concat(aux.map(b => b.t[0]))), bot:tl(['A2',{n:'2',lab:'2/T1'},{n:'4',lab:'4/T2'},{n:'6',lab:'6/T3'}].concat(aux.map(b => b.t[1]))), body});
  }
  if (T === 'relay'){
    const top = ['A1'], bot = ['A2']; d.blocks.forEach(b => { top.push(b.t[0]); if (b.k === 'CO'){ bot.push(b.t[1], b.t[2]); } else bot.push(b.t[1]); });
    const body = `<rect x="${w/2-30}" y="${mid-14}" width="60" height="26" rx="4" fill="${d.st.coil ? '#ffd24d' : '#cfd2d4'}" stroke="#8a9096"/><text x="${w/2}" y="${mid+3}" font-size="10" text-anchor="middle" fill="#333">${d.st.coil ? 'COIL ON' : 'COIL'}</text>`;
    return benchBox(d, {w, sub:'relay', top:tl(top), bot:tl(bot), body});
  }
  if (T === 'timer') return benchTimer(d, ctx);
  if (T === 'ol'){
    const h = d.st.heat || 0, c = w < 300;
    const body = `<rect x="24" y="${mid-16}" width="${w-48}" height="10" rx="4" fill="#cfd2d4"/><rect x="24" y="${mid-16}" width="${(w-48) * h}" height="10" rx="4" fill="${d.st.trip ? '#d32f2f' : h > 0.7 ? '#e8590c' : '#e0a21b'}"/><text x="${w/2}" y="${mid+6}" font-size="${c ? 8.5 : 10}" text-anchor="middle" fill="${d.st.trip ? '#d32f2f' : '#333'}" font-weight="${d.st.trip ? 700 : 400}">Ir=${d.cfg.Ir}A · I=${r1(d.st.I || 0)}A${d.st.trip ? ' · TRIP ✗' : d.st.sp ? ' · phase missing!' : ''}</text>` + (d.st.trip ? `<rect x="${w/2-14}" y="${mid-40}" width="28" height="14" rx="2" fill="#d32f2f"/><text x="${w/2}" y="${mid-29}" font-size="9" font-weight="700" fill="#fff" text-anchor="middle">TRIP</text>` : '');
    const hit = `<g class="bpin" data-dev="${d.id}" data-act="olReset" tabindex="0" role="button" aria-label="Reset the overload"><rect x="${w/2-60}" y="${mid+12}" width="56" height="22" rx="5"/><text x="${w/2-32}" y="${mid+27}">Reset</text></g><g class="bpin" data-dev="${d.id}" data-act="olTest" tabindex="0" role="button" aria-label="Test-trip the overload"><rect x="${w/2+4}" y="${mid+12}" width="56" height="22" rx="5"/><text x="${w/2+32}" y="${mid+27}">Test</text></g>` +
      (d.cfg.fixed ? '' : `<g class="bpin" data-dev="${d.id}" data-act="irDn" tabindex="0" role="button" aria-label="Lower Ir"><rect x="${w/2-60}" y="${mid-44}" width="40" height="20" rx="5"/><text x="${w/2-40}" y="${mid-30}">Ir −</text></g><g class="bpin" data-dev="${d.id}" data-act="irUp" tabindex="0" role="button" aria-label="Raise Ir"><rect x="${w/2+20}" y="${mid-44}" width="40" height="20" rx="5"/><text x="${w/2+40}" y="${mid-30}">Ir +</text></g>`);
    return benchBox(d, {w, sub:'overload ' + (d.cfg.model || 'LRD'), top:tl(['1','3','5','95','97']), bot:tl(['2','4','6','96','98']), body, hit});
  }
  if (T === 'mcb' || T === 'fuse' || T === 'mpcb'){
    const n = d.cfg.poles || 3, top = [], bot = []; for (let i = 0; i < n; i++){ top.push(String(2*i+1)); bot.push(String(2*i+2)); }
    const on = d.st.on && !d.st.trip;
    const body = T === 'fuse' ? (() => { let b = ''; for (let i = 0; i < n; i++){ const x = w/2 + (i - (n-1)/2) * Math.min(54, (w-40)/n); b += `<rect x="${x-9}" y="${mid-26}" width="18" height="52" rx="4" fill="#e9eaec" stroke="#7d8388"/><rect x="${x-5}" y="${mid-18}" width="10" height="36" rx="2" fill="${d.st.trip ? '#555' : '#f1dca6'}" stroke="#8a6d3b"/>${d.st.trip ? `<path d="M${x-5} ${mid-12}L${x+5} ${mid+12}M${x+5} ${mid-12}L${x-5} ${mid+12}" stroke="#d32f2f" stroke-width="2"/>` : `<path d="M${x} ${mid-16}V${mid+16}" stroke="#b87333" stroke-width="1.5"/>`}`; } return b + `<text class="ar" x="${w/2}" y="${mid+40}" font-size="9" text-anchor="middle" fill="${d.st.trip ? '#d32f2f' : '#333'}" font-weight="700">${d.st.trip ? 'blown ✗ (tap to replace)' : 'fuse ' + esc(d.cfg.kind || 'gG') + ' ' + esc(d.cfg.label)}</text>`; })()
      : `<rect x="${w/2-26}" y="${on ? mid-22 : mid-4}" width="52" height="18" rx="3" fill="${on ? '#1f9d55' : '#3a3e41'}"/><text x="${w/2}" y="${on ? mid-9 : mid+9}" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">${on ? 'I ON' : 'O OFF'}</text>${d.st.trip ? `<rect x="${w/2+30}" y="${mid-24}" width="34" height="14" rx="2" fill="#d32f2f"/><text x="${w/2+47}" y="${mid-13}" font-size="9" font-weight="700" fill="#fff" text-anchor="middle">TRIP</text>` : ''}${T === 'mcb' && d.cfg.poles >= 3 ? `<text x="${w/2}" y="${mid+34}" font-size="8" text-anchor="middle" fill="#555">In=${ratingOf(d)}A · curve ${curveOf(d)} · I=${r1(d.st.I || 0)}A</text>` : T === 'mpcb' ? `<text x="${w/2}" y="${mid+34}" font-size="8" text-anchor="middle" fill="${d.st.trip ? '#d32f2f' : '#555'}">Ir=${d.cfg.Ir}A · I=${r1(d.st.I || 0)}A${d.st.sp ? ' · phase missing!' : ''}</text><rect x="${w/2-40}" y="${mid+40}" width="80" height="5" rx="2" fill="#cfd2d4"/><rect x="${w/2-40}" y="${mid+40}" width="${80 * (d.st.heat || 0)}" height="5" rx="2" fill="#e0a21b"/>` : ''}`;
    const hit = T === 'fuse' ? `<rect class="ba" data-dev="${d.id}" data-act="fuse" x="20" y="${mid-24}" width="${w-40}" height="40" tabindex="0" role="button" aria-label="Replace the fuse"/>` : `<rect class="ba" data-dev="${d.id}" data-act="brk" x="${w/2-40}" y="${mid-26}" width="80" height="44" tabindex="0" role="button" aria-label="Switch on or off ${esc(d.tag)}"/>`;
    if (T === 'mpcb' && d.cfg.aux){ top.push('13', '21'); bot.push('14', '22'); }
    return benchBox(d, {w, sub:T === 'mpcb' ? 'MPCB Ir=' + d.cfg.Ir + 'A' : T === 'fuse' ? 'fuse' : 'MCB ' + d.cfg.label, top:tl(top), bot:tl(bot), body, hit, y2:150});
  }
  if (T === 'motor'){
    if (d.cfg.term !== 6) return benchMotor(d, ctx);
    const run = d.st.run, ang = d.st.ang || 0, six = d.cfg.term === 6, cx = six ? 90 : w/2, cy = 150;
    let body = `<circle cx="${cx}" cy="${cy}" r="30" fill="${d.cfg.look === 'pump' ? '#2f6fb5' : '#5d7f96'}" stroke="#2d4352"/><g transform="rotate(${ang} ${cx} ${cy})"><path d="M${cx} ${cy-22}V${cy+22}M${cx-22} ${cy}H${cx+22}" stroke="#e5e8ea" stroke-width="5" stroke-linecap="round"/></g><circle cx="${cx}" cy="${cy}" r="5" fill="#d32f2f"/>`;
    const mm6 = ctx.res && ctx.res.mot && ctx.res.mot[d.id];
    body += `<text class="ar" x="${cx}" y="${cy+46}" font-size="11" text-anchor="middle" fill="${d.st.fault ? 'var(--bad)' : run ? GOOD : 'var(--ink)'}" font-weight="700">${run ? (run > 0 ? 'fwd ↻' : 'rev ↺') + (d.st.mode === 'Y' ? ' · star Y' : d.st.mode === 'D' && six ? ' · delta Δ' : '') : d.st.fault === 'burn' ? 'burned out 🔥' : d.st.fault ? 'humming (2 phases)' : 'stopped'}</text>`;
    if (mm6 && mm6.run) body += `<text class="ar" x="${cx}" y="${cy+60}" font-size="9" text-anchor="middle" fill="${mm6.over ? 'var(--bad)' : mm6.weak ? 'var(--warn)' : 'var(--muted)'}" font-weight="${mm6.over || mm6.weak ? 700 : 400}">${mm6.over ? '⚠ ' + mm6.vw + 'V on a winding of ' + d.cfg.vD + 'V: will burn' : mm6.weak ? mm6.vw + 'V on a winding of ' + d.cfg.vD + 'V: weak torque' : 'each winding ' + mm6.vw + 'V ✓'} · I=${r1(mm6.I * (d.cfg.In || 5))}A</text>`;
    else body += `<text x="${cx}" y="${cy+60}" font-size="8" text-anchor="middle" fill="var(--muted)">${d.cfg.vD} Δ / ${d.cfg.vY} Y · ${d.cfg.In}A</text>`;
    if (six){
      const terms = {}; let s = cellHead(d, (d.cfg.look === 'pump' ? 'pump' : '3~ motor') + ' ' + d.cfg.kW + 'kW · 6 terminals', w) + body;
      s += `<rect x="176" y="34" width="150" height="110" rx="6" fill="#d9dcde" stroke="#7d8388"/>`;
      [['W2','U2','V2'],['U1','V1','W1']].forEach((row, r) => row.forEach((n, i) => { const x = 206 + i * 46, y = r ? 118 : 60; terms[n] = {x, y, dir:r ? 1 : -1}; s += `<text x="${x}" y="${r ? y - 14 : y + 24}" font-size="11" font-weight="700" text-anchor="middle" fill="#222">${n}</text>`; }));
      s += `<text x="251" y="92" font-size="7.5" text-anchor="middle" fill="#555">TERMINAL BOX</text>`;
      return {svg:s, hit:'', terms};
    }
    return benchBox(d, {w, sub:d.cfg.look === 'pump' ? 'pump' : '3~ motor', top:tl(['U','V','W']), bot:[], body, y1:40, y2:80});
  }
  if (T === 'cart'){
    const x = d.st.x, x0 = 40, x1 = w - 40, X = x0 + clamp(x, -0.04, 1.04) * (x1 - x0), m = ctx.res && ctx.res.mot && ctx.res.mot[d.cfg.motor], mv = m && m.run ? m.dir * d.cfg.sign : 0;
    let s = cellHead(d, d.cfg.title || (d.cfg.box ? 'conveyor and box' : d.cfg.hoist ? 'hoist' : 'cart on a track'), w);
    s += `<rect x="${x0 - 20}" y="96" width="${x1 - x0 + 40}" height="8" rx="2" fill="#7b8389"/><path d="M${x0 - 20} 108H${x1 + 20}" stroke="var(--muted)" stroke-width="1" opacity=".5"/>`;
    if (d.cfg.box || d.cfg.hoist) s += `<circle cx="${x0 - 14}" cy="100" r="7" fill="#3a3e41"/><circle cx="${x1 + 14}" cy="100" r="7" fill="#3a3e41"/>`;
    s += `<rect x="${x0 - 4}" y="72" width="8" height="24" fill="#e0a21b" stroke="#8a6200"/><rect x="${x1 - 4}" y="72" width="8" height="24" fill="#e0a21b" stroke="#8a6200"/>`;
    s += `<text x="${x0}" y="126" font-size="12" font-weight="700" text-anchor="middle" fill="var(--ink)">${esc(d.cfg.labA)}</text><text x="${x1}" y="126" font-size="12" font-weight="700" text-anchor="middle" fill="var(--ink)">${esc(d.cfg.labB)}</text>`;
    if (d.cfg.box) s += `<rect x="${X-20}" y="62" width="40" height="34" rx="3" fill="#c99a5b" stroke="#6b4a1f"/><path d="M${X-20} 72H${X+20}" stroke="#6b4a1f" stroke-width="1"/>`;
    else if (d.cfg.hoist) s += `<rect x="${X-14}" y="40" width="28" height="10" fill="#e0a21b" stroke="#8a6200"/><path d="M${X} 50V62" stroke="#333" stroke-width="2"/><rect x="${X-22}" y="62" width="44" height="34" rx="3" fill="#8a9096" stroke="#333"/><text class="ar" x="${X}" y="84" font-size="9" fill="#fff" text-anchor="middle">load</text>`;
    else s += `<rect x="${X-22}" y="60" width="44" height="30" rx="5" fill="#2f6fb5" stroke="#173b63"/><circle cx="${X-12}" cy="94" r="6" fill="#2a2d30"/><circle cx="${X+12}" cy="94" r="6" fill="#2a2d30"/>`;
    if (mv) s += `<text x="${X}" y="52" font-size="14" text-anchor="middle" fill="${GOOD}" font-weight="700">${mv > 0 ? '→' : '←'}</text>`;
    s += `<text class="ar" x="${w/2}" y="146" font-size="10" text-anchor="middle" fill="${d.st.crash ? 'var(--bad)' : 'var(--muted)'}" font-weight="${d.st.crash ? 700 : 400}">${d.st.crash ? (d.cfg.hoist ? 'The hoist passed the end of travel! (danger)' : 'The cart ran past the end of the track!') : mv > 0 ? (d.cfg.hoist ? 'going up toward ' : 'moving toward ') + esc(d.cfg.labB) : mv < 0 ? (d.cfg.hoist ? 'going down toward ' : 'returning toward ') + esc(d.cfg.labA) : (d.cfg.box ? 'conveyor stopped' : 'stopped')}</text>`;
    return {svg:s, hit:'', terms:{}};
  }
  if (T === 'tank'){
    let s = cellHead(d, 'tank', CW);
    s += `<rect x="45" y="30" width="80" height="140" rx="6" fill="none" stroke="var(--ink)" stroke-width="2"/><rect x="47" y="${32 + 136 * (1 - d.st.lvl)}" width="76" height="${136 * d.st.lvl}" fill="#4ea0ff" opacity=".8"/><text x="85" y="190" font-size="11" text-anchor="middle" fill="var(--ink)">${Math.round(d.st.lvl*100)}%</text>`;
    return {svg:s, hit:'', terms:{}};
  }
  if (T === 'level'){
    let s = cellHead(d, d.cfg.look === 'press' ? 'pressure switch' : 'float switch', CW);
    s += `<circle cx="85" cy="58" r="20" fill="#e0a21b" stroke="#8a6200"/><text x="85" y="62" font-size="10" text-anchor="middle" fill="#222">${d.st.a ? 'ON' : 'OFF'}</text>`;
    const B = benchBlocks(d, 85, () => !!d.st.a, ctx.live); s += B.svg;
    return {svg:s, hit:d.cfg.tank ? '' : `<rect class="ba" data-dev="${d.id}" data-act="latchA" x="55" y="30" width="60" height="56" tabindex="0" role="button" aria-label="Change the level"/>`, terms:B.terms};
  }
  return {svg:cellHead(d, T, w), hit:'', terms:{}};
}
// DIN timer on the bench: dial with the set time, LEDs, countdown, ± time buttons (and a FUNC button for a multi-function timer)
function benchTimer(d, ctx){
  const w = ctx.w || CW, sd = d.cfg.mode === 'sd', m = d.cfg.mode, on = !!d.st.coil, out = !!d.st.out, T = d.cfg.t, el = d.st.el || 0;
  const per = d.cfg.ton + d.cfg.toff, rem = m === 'cyc' ? per - (el % per) : Math.max(0, T - el);
  const timing = (m === 'on' && on) || (m === 'off' && !on && out) || (m === 'cyc' && on) || (sd && on && el < T);
  let s = cellHead(d, 'timer ' + (sd ? 'Y-Δ' : CL.TIMER_MODES[m]), w);
  const terms = {};
  const place = (list, y, dir) => { const n = list.length, sp = Math.min(54, (w - 40) / n); list.forEach((t, i) => { const x = w/2 + (i - (n - 1) / 2) * sp; terms[t] = {x, y, dir}; s += `<text x="${x}" y="${y + (dir < 0 ? -16 : 20)}" font-size="11" font-weight="700" text-anchor="middle" fill="var(--ink)">${t}</text>`; }); };
  s += `<rect x="10" y="54" width="${w - 20}" height="74" rx="6" fill="#4b5560" stroke="#242a30"/><rect x="16" y="58" width="${w - 32}" height="66" rx="4" fill="#e9eaec" stroke="#9aa1a6"/>`;
  // dial
  const cx = 42, cy = 90, R = 17, ang = -135 + 270 * clamp(T / 10, 0, 1);
  s += `<circle cx="${cx}" cy="${cy}" r="${R + 3}" fill="#cfd3d6" stroke="#8a9096"/>`;
  for (let i = 0; i <= 10; i += 5){ const a = (-135 + 27 * i) * Math.PI / 180; s += `<text x="${cx + (R + 9) * Math.sin(a)}" y="${cy - (R + 9) * Math.cos(a) + 3}" font-size="6" fill="#222" text-anchor="middle">${i}</text>`; }
  s += `<circle cx="${cx}" cy="${cy}" r="${R - 3}" fill="#1d1f21"/><g transform="rotate(${ang} ${cx} ${cy})"><rect x="${cx-2.5}" y="${cy-R+4}" width="5" height="${R+2}" rx="2.5" fill="#e9eaec"/><rect x="${cx-1}" y="${cy-R+5}" width="2" height="7" fill="#d32f2f"/></g>`;
  s += `<text x="${cx}" y="${cy + R + 13}" font-size="7.5" fill="#222" text-anchor="middle" font-weight="700">t = ${T} s</text>`;
  // LEDs + countdown + mode
  s += `<circle cx="78" cy="68" r="3.5" fill="${on ? '#36e070' : '#1f4a2a'}"/><text x="78" y="79" font-size="6" fill="#222" text-anchor="middle">U</text>`;
  s += `<circle cx="92" cy="68" r="3.5" fill="${out ? '#ffd24d' : '#4a3d10'}"/>${out ? '<circle cx="92" cy="68" r="6.5" fill="#ffd24d" opacity=".4"/>' : ''}<text x="92" y="79" font-size="6" fill="#222" text-anchor="middle">R</text>`;
  s += `<text x="${w - 20}" y="70" font-size="6.5" fill="#333" text-anchor="end">${esc(d.cfg.model)}</text>`;
  s += `<rect x="70" y="82" width="${w - 86}" height="20" rx="4" fill="#26313a"/><text x="${70 + (w - 86) / 2}" y="96" font-size="12" font-weight="700" text-anchor="middle" fill="${timing ? '#5cff7a' : '#8aa0ad'}">${timing ? r1(rem).toFixed(1) + ' s' : out ? 'OUT ✓' : '--.- s'}</text>`;
  s += `<text x="${70 + (w - 86) / 2}" y="111" font-size="7" fill="#222" text-anchor="middle" font-weight="700">${sd ? 'STAR-DELTA' : CL.TIMER_MODES[m]}${m === 'cyc' ? ' ' + d.cfg.ton + '/' + d.cfg.toff + 's' : ''}</text>`;
  s += `<text class="ar" x="${70 + (w - 86) / 2}" y="121" font-size="7.5" text-anchor="middle" fill="${out ? GOOD : '#555'}" font-weight="${out ? 700 : 400}">${sd ? (on && el >= T ? '17-28 closed' : on ? '17-18 closed' : 'open') : out ? '15-18 closed' : '15-16 closed'}</text>`;
  const bw = d.cfg.multi ? 44 : 50;
  let hit = `<g class="bpin" data-dev="${d.id}" data-act="tDn" tabindex="0" role="button" aria-label="Less time"><rect x="12" y="132" width="${bw}" height="20" rx="5"/><text x="${12 + bw/2}" y="146">− time</text></g><g class="bpin" data-dev="${d.id}" data-act="tUp" tabindex="0" role="button" aria-label="More time"><rect x="${w - 12 - bw}" y="132" width="${bw}" height="20" rx="5"/><text x="${w - 12 - bw/2}" y="146">+ time</text></g>`;
  if (d.cfg.multi) hit += `<g class="bpin" data-dev="${d.id}" data-act="tMode" tabindex="0" role="button" aria-label="Change the timer function"><rect x="${w/2 - 24}" y="132" width="48" height="20" rx="5"/><text x="${w/2}" y="146">FUNC</text></g>`;
  place(sd ? ['A1','17'] : ['A1','15'], 44, -1); place(sd ? ['A2','18','28'] : ['A2','16','18'], 172, 1);
  return {svg:s, hit, terms};
}
const screwLab = (x, y, lab, dir) => `<text x="${x}" y="${dir < 0 ? y - 16 : y + 20}" font-size="${lab.length > 3 ? 9 : 11}" font-weight="700" text-anchor="middle" fill="var(--ink)">${esc(lab)}</text>`;
// plug-in relay in a DIN socket (2 cells wide)
function benchRelay(d, ctx){
  if (ctx.w && ctx.w < 300) return benchGeneric(d, ctx);
  const w = CW * 2, on = !!ctx.en, id = ++UID, bl = d.blocks, dc = d.cfg.v <= 48;
  let s = cellHead(d, d.cfg.v + 'V ' + (dc ? 'DC' : 'AC'), w) + `<defs>${copper(id)}</defs>`;
  const terms = {};
  const top = []; bl.slice(0, 2).forEach(b => b.t.forEach(t => top.push(t)));
  const bot = ['A1'].concat(bl.slice(2).reduce((a, b) => a.concat(b.t), [])).concat(['A2']);
  const place = (list, y, dir) => { const sp = Math.min(48, (w - 60) / Math.max(1, list.length)); list.forEach((t, i) => { const x = w / 2 + (i - (list.length - 1) / 2) * sp; terms[t] = {x, y, dir}; s += screwLab(x, y, t, dir); }); };
  // socket
  s += `<rect x="18" y="56" width="${w - 36}" height="120" rx="5" fill="#2c2f31" stroke="#101213"/><rect x="18" y="168" width="${w - 36}" height="8" fill="#1a1c1d"/>`;
  s += `<text x="${w/2}" y="172" font-size="7" fill="#aaa" text-anchor="middle">SOCKET · DIN RAIL</text>`;
  // relay housing
  s += `<rect x="62" y="62" width="${w - 124}" height="92" rx="4" fill="rgba(215,232,250,.8)" stroke="#4f6f8f"/>`;
  s += `<text x="${w/2}" y="76" font-size="8" font-weight="700" fill="#243b52" text-anchor="middle">RELAY ${bl.length}${bl.every(b => b.k === 'CO') ? 'CO' : 'C'} 10A · ${d.cfg.v}V ${dc ? 'DC' : 'AC'}</text>`;
  s += `<circle cx="76" cy="90" r="4.5" fill="${on ? '#36e070' : '#1f4a2a'}" stroke="#123"/>${on ? '<circle cx="76" cy="90" r="8" fill="#36e070" opacity=".35"/>' : ''}<text x="76" y="103" font-size="6" fill="${on ? GOOD : '#243b52'}" text-anchor="middle" font-weight="700">${on ? 'ON' : 'LED'}</text>`;
  s += `<rect x="86" y="86" width="16" height="8" rx="2" fill="#f08a00" stroke="#8a4f00"/>`;
  s += `<rect x="78" y="112" width="30" height="30" rx="2" fill="url(#cu${id})" stroke="#5a3410"/><text x="93" y="130" font-size="7" fill="#fff" text-anchor="middle" font-weight="700">COIL</text>`;
  s += `<rect x="112" y="${on ? 112 : 106}" width="34" height="5" rx="1" fill="#8a9096" stroke="#444"/>`;
  // mini contact schematic per block
  bl.forEach((b, i) => { const x = 160 + i * 34, co = b.k === 'CO';
    s += `<rect x="${x-14}" y="106" width="28" height="40" rx="2" fill="#fff" fill-opacity=".5" stroke="#9fb4c8"/>`;
    s += `<text x="${x}" y="116" font-size="7" fill="#243b52" text-anchor="middle">${esc(b.t[0])}</text>`;
    const nc = co || b.k === 'NC', no = co || b.k === 'NO';
    if (nc) s += `<path d="M${x-8} 122H${x-2}" stroke="${!on ? GOOD : '#7a4f1c'}" stroke-width="2.4"/>`;
    if (no) s += `<path d="M${x-8} 138H${x-2}" stroke="${on ? GOOD : '#7a4f1c'}" stroke-width="2.4"/>`;
    s += `<path d="M${x+8} 130L${x-2} ${on ? (no ? 138 : 126) : (nc ? 122 : 134)}" stroke="${GOOD}" stroke-width="2"/>`;
    s += `<text x="${x-10}" y="${nc ? 125 : 141}" font-size="6" fill="#243b52" text-anchor="end">${esc(nc ? b.t[1] : b.t[1])}</text>${co ? `<text x="${x-10}" y="141" font-size="6" fill="#243b52" text-anchor="end">${esc(b.t[2])}</text>` : ''}`;
    const rcl = co ? true : blockClosed(b, on), rcap = co ? `${b.t[0]}-${on ? b.t[2] : b.t[1]} closed` : `${b.k} · ${rcl ? 'closed' : 'open'}`;
    s += `<text class="blk-cap" data-blk="${b.t[0]}-${b.t[1]}" x="${x}" y="161" font-size="6" font-weight="700" fill="${rcl ? CAPGRN_D : CAPRED_D}" text-anchor="middle">${rcap}${on ? ' (on)' : ''}</text>`;
  });
  place(top, 44, -1); place(bot, 162, 1);
  return {svg:s, hit:'', terms};
}
// contactor (2 cells wide), TeSys-D look
function benchContactor(d, ctx){
  const w = ctx.w || CW * 2, cl = !!d.st.closed, en = !!ctx.en, aux = d.blocks.slice(0, 3), terms = {}, c = w < 300, side = ctx.ctlSide || (c && ctx.grid ? 'l' : ''), H = TYPES.contactor.h(d), ex3 = aux.length > 2 ? 56 : 0;
  let s = cellHead(d, c ? d.cfg.model : d.cfg.model + ' · ' + d.cfg.v + 'V', w);
  if (side){
    // control terminals (coil + aux) on the side facing the control zone; main poles top/bottom
    const xm = i => (c ? 70 : 160) + i * (c ? 36 : 60), bx = c ? 40 : 60;
    [[1,'1/L1'],[3,'3/L2'],[5,'5/L3']].forEach(([n, lab], i) => { terms[n] = {x:xm(i), y:44, dir:-1}; s += screwLab(xm(i), 44, lab, -1); });
    [[2,'2/T1'],[4,'4/T2'],[6,'6/T3']].forEach(([n, lab], i) => { terms[n] = {x:xm(i), y:162 + ex3, dir:1}; s += screwLab(xm(i), 162 + ex3, lab, 1); });
    const sl = [['A1', 50], ['A2', 76]]; aux.forEach((b, i) => { sl.push([b.t[0], 106 + i * 50], [b.t[1], 130 + i * 50]); });
    s += `<rect x="${bx - 4}" y="36" width="${w - bx - 12}" height="${140 + ex3}" rx="6" fill="#3b3f43" stroke="#1d2022"/>`;
    sl.forEach(([n, y]) => { terms[n] = {x:16, y, dir:0, side:'l'}; s += `<text x="34" y="${y + 4}" font-size="10" font-weight="700" fill="#eee">${esc(n)}</text>`; });
    if (aux.length) s += aux.map((b, i) => { const acl = blockClosed(b, cl); return `<rect x="${bx + 2}" y="${100 + i * 50}" width="30" height="36" rx="3" fill="#565c61" stroke="#2a2d30"/><text x="${bx + 17}" y="${110 + i * 50}" font-size="8" fill="#eee" text-anchor="middle">${b.k}</text><text class="blk-cap" data-blk="${b.t[0]}-${b.t[1]}" x="${bx + 17}" y="${121 + i * 50}" font-size="7" font-weight="700" fill="${acl ? CAPGRN_D : CAPRED_D}" text-anchor="middle">${acl ? 'closed' : 'open'}</text>${cl ? `<text x="${bx + 17}" y="${131 + i * 50}" font-size="6.5" fill="${acl ? CAPGRN_D : CAPRED_D}" text-anchor="middle">(on)</text>` : ''}`; }).join('');
    const px = c ? 76 : 100, pw = c ? 84 : 128;
    s += `<rect x="${px}" y="64" width="${pw}" height="22" rx="3" fill="#1b1d1f"/><rect x="${px + 4}" y="${cl ? 72 : 66}" width="${pw - 8}" height="12" rx="2" fill="#cfd2d4"/><text x="${px + pw/2}" y="${cl ? 81 : 75}" font-size="8" fill="#222" text-anchor="middle" font-weight="700">${cl ? '▼ I' : '0'}</text>`;
    s += `<rect x="${px}" y="92" width="${pw}" height="56" rx="3" fill="#e9eaec" stroke="#9aa1a6"/><text x="${px + pw/2}" y="106" font-size="9" fill="#222" text-anchor="middle" font-weight="700">${esc(d.cfg.model)}</text><text x="${px + pw/2}" y="118" font-size="7" fill="#333" text-anchor="middle">AC-3 ${esc(d.cfg.ac3)}</text><text x="${px + pw/2}" y="130" font-size="8" fill="#222" text-anchor="middle" font-weight="700">COIL ${d.cfg.v}V${d.cfg.v <= 48 ? 'DC' : '~'}</text><text x="${px + pw/2}" y="142" font-size="7" fill="${en ? GOOD : '#777'}" text-anchor="middle" font-weight="700">${en ? 'A1-A2 ON' : 'A1-A2 OFF'}</text>`;
    s += `<text class="ar" x="${w/2}" y="${H - 5}" font-size="10" text-anchor="middle" fill="${cl ? GOOD : 'var(--bad)'}" font-weight="700">${cl ? 'on ✓' : (en ? 'mechanically locked' : '')}</text>`;
    return {svg:s, hit:'', terms};
  }
  if (c) return benchGeneric(d, ctx);
  const top = [{n:'A1'}, {n:'1', lab:'1/L1'}, {n:'3', lab:'3/L2'}, {n:'5', lab:'5/L3'}].concat(aux.map(b => ({n:b.t[0]})));
  const bot = [{n:'A2'}, {n:'2', lab:'2/T1'}, {n:'4', lab:'4/T2'}, {n:'6', lab:'6/T3'}].concat(aux.map(b => ({n:b.t[1]})));
  const xs = i => 40 + i * (aux.length === 3 ? 46 : aux.length === 2 ? 52 : 60);
  s += `<rect x="16" y="56" width="${w - 32}" height="120" rx="6" fill="#3b3f43" stroke="#1d2022"/>`;
  top.forEach((t, i) => { terms[t.n] = {x:xs(i), y:44, dir:-1}; s += screwLab(xs(i), 44, t.lab || t.n, -1); });
  bot.forEach((t, i) => { terms[t.n] = {x:xs(i), y:162, dir:1}; s += screwLab(xs(i), 162, t.lab || t.n, 1); });
  // aux block face
  if (aux.length) s += `<rect x="${xs(4) - 22}" y="64" width="${aux.length === 3 ? 136 : aux.length * 52 - 8}" height="86" rx="3" fill="#565c61" stroke="#2a2d30"/>${aux.map((b, i) => { const acl = blockClosed(b, cl); return `<text x="${xs(4 + i)}" y="98" font-size="8" fill="#eee" text-anchor="middle">${b.k}</text><text class="blk-cap" data-blk="${b.t[0]}-${b.t[1]}" x="${xs(4 + i)}" y="113" font-size="7.5" font-weight="700" fill="${acl ? CAPGRN_D : CAPRED_D}" text-anchor="middle">${acl ? 'closed' : 'open'}</text>${cl ? `<text x="${xs(4 + i)}" y="125" font-size="7" fill="${acl ? CAPGRN_D : CAPRED_D}" text-anchor="middle">(on)</text>` : ''}`; }).join('')}`;
  // carrier window + label plate
  s += `<rect x="60" y="64" width="128" height="22" rx="3" fill="#1b1d1f"/><rect x="64" y="${cl ? 72 : 66}" width="120" height="12" rx="2" fill="#cfd2d4"/><text x="124" y="${cl ? 81 : 75}" font-size="8" fill="#222" text-anchor="middle" font-weight="700">${cl ? '▼ I' : '0'}</text>`;
  s += `<rect x="60" y="92" width="128" height="56" rx="3" fill="#e9eaec" stroke="#9aa1a6"/><text x="124" y="106" font-size="9" fill="#222" text-anchor="middle" font-weight="700">${esc(d.cfg.model)}</text><text x="124" y="118" font-size="7" fill="#333" text-anchor="middle">AC-3 ${esc(d.cfg.ac3)}</text><text x="124" y="130" font-size="8" fill="#222" text-anchor="middle" font-weight="700">COIL ${d.cfg.v}V${d.cfg.v <= 48 ? 'DC' : '~'}</text><text x="124" y="142" font-size="7" fill="${en ? GOOD : '#777'}" text-anchor="middle" font-weight="700">${en ? 'A1-A2 ON' : 'A1-A2 OFF'}</text>`;
  s += `<text class="ar" x="${w/2}" y="203" font-size="10" text-anchor="middle" fill="${cl ? GOOD : 'var(--bad)'}" font-weight="700">${cl ? 'on ✓' : (en ? 'mechanically locked' : '')}</text>`;
  return {svg:s, hit:'', terms};
}
// 3-phase motor with terminal box (1 cell)
function benchMotor(d, ctx){
  const w = CW, run = d.st.run, fault = d.st.fault, pump = d.cfg.look === 'pump', id = ++UID, terms = {};
  let s = cellHead(d, (pump ? 'PUMP ' : '3~ ') + d.cfg.kW + 'kW', w);
  s += `<defs><linearGradient id="mb${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7f9fb4"/><stop offset=".5" stop-color="#4f6f86"/><stop offset="1" stop-color="#2f4659"/></linearGradient></defs>`;
  ['U','V','W'].forEach((t, i) => { const x = 51 + i * 34; terms[t] = {x, y:44, dir:-1}; s += screwLab(x, 44, t, -1); });
  s += `<rect x="30" y="56" width="110" height="28" rx="3" fill="#8f979c" stroke="#4b5257"/><text x="85" y="74" font-size="7" fill="#222" text-anchor="middle">TERMINAL BOX</text>`;
  s += `<g class="${fault ? 'hum' : ''}">`;
  s += `<rect x="24" y="84" width="118" height="62" rx="10" fill="url(#mb${id})" stroke="#243745"/>${[0,1,2,3,4,5,6].map(i => `<path d="M${40 + i * 14} 86V144" stroke="#2f4659" stroke-width="1.2" opacity=".7"/>`).join('')}`;
  s += `<rect x="8" y="92" width="18" height="46" rx="4" fill="#3d5466" stroke="#243745"/>${[0,1,2].map(i => `<path d="M11 ${100 + i * 14}H23" stroke="#1d2b36" stroke-width="2"/>`).join('')}`;
  s += `<rect x="142" y="108" width="20" height="12" rx="2" fill="#aab1b6" stroke="#555"/>`;
  s += `<rect x="30" y="146" width="106" height="8" fill="#2a3a46"/><rect x="24" y="152" width="28" height="6" fill="#1d2b36"/><rect x="114" y="152" width="28" height="6" fill="#1d2b36"/>`;
  s += `<text x="83" y="120" font-size="8" fill="#e3e9ec" text-anchor="middle" font-weight="700">${pump ? 'PUMP' : 'IE3'} 3~ ${d.cfg.kW}kW</text>`;
  s += '</g>';
  // shaft end view with rotating marker
  const cx = 85, cy = 180;
  s += `<circle cx="${cx}" cy="${cy}" r="18" fill="#243745" stroke="#111"/>`;
  s += `<g>${run ? `<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="${run > 0 ? 360 : -360} ${cx} ${cy}" dur="1.2s" repeatCount="indefinite"/>` : ''}<path d="M${cx} ${cy-14}V${cy+14}M${cx-14} ${cy}H${cx+14}" stroke="#e5e8ea" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy-10}" r="3.5" fill="#f3c613"/></g>`;
  s += `<circle cx="${cx}" cy="${cy}" r="4" fill="#d32f2f"/>`;
  s += `<text class="ar" x="${cx + 38}" y="${cy + 4}" font-size="11" text-anchor="middle" fill="${fault ? 'var(--bad)' : run ? GOOD : 'var(--muted)'}" font-weight="700">${run ? (run > 0 ? 'fwd ↻' : 'rev ↺') : fault === 'burn' ? 'burned out 🔥' : fault ? 'humming!' : 'stopped'}</text>`;
  const mm = ctx.res && ctx.res.mot && ctx.res.mot[d.id];
  if (mm && (mm.run || mm.fault)) s += `<text x="${cx + 38}" y="${cy + 17}" font-size="9" text-anchor="middle" fill="${mm.start || mm.fault ? 'var(--bad)' : 'var(--muted)'}" font-weight="700">I=${r1(mm.I * (d.cfg.In || 5))}A${mm.start ? ' ⚡start' : ''}</text>`;
  else s += `<text x="${cx + 38}" y="${cy + 17}" font-size="8" text-anchor="middle" fill="var(--muted)">In=${d.cfg.In || 5}A</text>`;
  if (fault === '1ph') s += `<text class="ar" x="${cx - 36}" y="${cy + 4}" font-size="9" text-anchor="middle" fill="var(--bad)" font-weight="700">2 phases only</text>`;
  return {svg:s, hit:'', terms};
}


/* =========================== lesson 6–8 additions: motor nameplate / terminal box, level & pressure switches, proximity sensors =========================== */
CL.MOTORS = [ // 400 V, 50 Hz, 4-pole IE3 (typical catalogue values)
  {kW:0.37, In:1.1, cosf:0.72, rpm:1380, frame:'71', vD:230, vY:400},
  {kW:0.55, In:1.5, cosf:0.75, rpm:1400, frame:'80', vD:230, vY:400},
  {kW:0.75, In:1.9, cosf:0.77, rpm:1400, frame:'80', vD:230, vY:400},
  {kW:1.1, In:2.6, cosf:0.79, rpm:1410, frame:'90S', vD:230, vY:400},
  {kW:1.5, In:3.4, cosf:0.80, rpm:1420, frame:'90L', vD:230, vY:400},
  {kW:2.2, In:4.9, cosf:0.81, rpm:1430, frame:'100L', vD:230, vY:400},
  {kW:3, In:6.4, cosf:0.82, rpm:1440, frame:'100L', vD:230, vY:400},
  {kW:4, In:8.4, cosf:0.83, rpm:1450, frame:'112M', vD:400, vY:690},
  {kW:5.5, In:11.2, cosf:0.84, rpm:1455, frame:'132S', vD:400, vY:690},
  {kW:7.5, In:15, cosf:0.85, rpm:1460, frame:'132M', vD:400, vY:690},
  {kW:11, In:21.5, cosf:0.86, rpm:1465, frame:'160M', vD:400, vY:690},
  {kW:15, In:29, cosf:0.86, rpm:1470, frame:'160L', vD:400, vY:690},
  {kW:18.5, In:35, cosf:0.87, rpm:1470, frame:'180M', vD:400, vY:690},
  {kW:22, In:41, cosf:0.87, rpm:1475, frame:'180L', vD:400, vY:690},
  {kW:30, In:55, cosf:0.88, rpm:1475, frame:'200L', vD:400, vY:690},
  {kW:37, In:68, cosf:0.88, rpm:1480, frame:'225S', vD:400, vY:690},
  {kW:45, In:81, cosf:0.89, rpm:1480, frame:'225M', vD:400, vY:690}
];
// cable size rule of thumb (PVC copper, 30 °C, in conduit): current → mm²
CL.CABLE = [[13.5, 1.5], [18, 2.5], [24, 4], [31, 6], [42, 10], [56, 16], [73, 25], [89, 35], [108, 50]];
CL.cableFor = I => { const r = CL.CABLE.find(x => I * 1.25 <= x[0]); return r ? r[1] : 70; };

/* ---------- proximity sensors / photocells: 3-wire PNP or NPN, NO or NC ---------- */
CL.defineType('prox', {
  def:{kind:'ind', pnp:true, nc:false, v:24, sn:8, at:1, label:''},
  terms(){ return [{n:'BN', lab:'BN +'}, {n:'BK', lab:'BK'}, {n:'BU', lab:'BU −'}]; },
  init(cfg){ return {a:cfg.a0 ? 1 : 0, x:cfg.a0 ? 1 : 0, burnt:0}; }, // a0: starts with the object in range (figures)
  op(d){ return !!d.st.a !== !!d.cfg.nc; }, // output transistor on
  links(d, force){ if (force) return [['BN','BK'], ['BU','BK']]; return TYPES.prox.op(d) ? [[d.cfg.pnp ? 'BN' : 'BU', 'BK']] : []; },
  loads(d){ return [{a:'BN', b:'BU', k:'coil', v:d.cfg.v}]; },
  apply(d, s){ Object.assign(d.st, s); if ('a' in s && !('x' in s)) d.st.x = s.a ? 1 : 0; },
  states(d){ return [{label:d.cfg.kind === 'photo' ? 'beam clear (nothing there)' : 'no object in front', st:{a:0}}, {label:d.cfg.kind === 'photo' ? 'object breaking the beam' : 'object within range', st:{a:1}}]; },
  simRows(d){ const on = !!d.st.a !== !!d.cfg.nc; return [{lab:'BK', k:(d.cfg.pnp ? 'PNP' : 'NPN') + ' ' + (d.cfg.nc ? 'NC' : 'NO'), c:on, txt:on ? (d.cfg.pnp ? 'output +24V' : 'output 0V') : 'no output'}]; },
  tick(d, dt, ctx){
    if (!d.cfg.cart) return false;
    const c = ctx.byId[d.cfg.cart]; if (!c) return false;
    const at = d.cfg.at == null ? 1 : d.cfg.at, x = c.st.x;
    const a = Math.abs(x - at) <= 0.06 ? 1 : 0;
    const ch = a !== d.st.a; d.st.a = a; d.st.x = a ? 1 : 0; return ch;
  },
  ctl:'prox', art(d){ return CL.art.proxArt(d); }, iecAct:'prox', zone:'C', h(){ return 224; }
});
CL.PROX_AR = {ind:'Inductive proximity sensor', cap:'Capacitive proximity sensor', photo:'Photocell'};

/* ---------- animated cutaway of a squirrel-cage induction motor ---------- */
CL.art.motorCut = function(d, o){
  o = o || {}; const id = ++UID, run = o.run != null ? o.run : (d.st && d.st.run), dir = run > 0 || run === true ? 1 : run < 0 ? -1 : 0;
  const rpm = o.rpm || (d.cfg && d.cfg.rpm) || 1430, T = 60 / Math.max(60, rpm) * 8; // animation period (slowed ×8 so the eye can follow)
  let s = `<svg viewBox="0 0 440 262" role="img" aria-label="Section through a 3-phase induction motor"><defs>${copper(id)}<linearGradient id="fr${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8aa6b8"/><stop offset=".5" stop-color="#4f6f86"/><stop offset="1" stop-color="#2f4659"/></linearGradient><linearGradient id="sh${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e6e9eb"/><stop offset=".5" stop-color="#9aa4ab"/><stop offset="1" stop-color="#5d6871"/></linearGradient></defs><g style="color:var(--ink)">`;
  s += `<text class="ar" x="150" y="18" font-size="12" text-anchor="middle" fill="currentColor">lengthwise section</text>`;
  // frame with fins (upper half cut away)
  s += `<rect x="60" y="120" width="190" height="60" rx="8" fill="url(#fr${id})" stroke="#243745"/>${[0,1,2,3,4,5,6,7,8,9,10].map(i => `<path d="M${72 + i * 16} 122V178" stroke="#2f4659" stroke-width="1.4" opacity=".7"/>`).join('')}`;
  s += `<rect x="60" y="60" width="190" height="62" fill="none" stroke="#243745" stroke-dasharray="4 3"/>`;
  // stator core + winding ends (cut)
  s += `<rect x="84" y="64" width="142" height="40" fill="#8a9096" stroke="#444"/>${[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(i => `<path d="M${88 + i * 10} 64V104" stroke="#5d656b" stroke-width=".8"/>`).join('')}`;
  s += `<ellipse cx="84" cy="84" rx="12" ry="22" fill="url(#cu${id})" stroke="#5a3410"/><ellipse cx="226" cy="84" rx="12" ry="22" fill="url(#cu${id})" stroke="#5a3410"/>`;
  s += `<rect x="84" y="104" width="142" height="4" fill="#1b2a35"/>`; // air gap
  // rotor (squirrel cage): bars move sideways when running = rotation seen from the side
  s += `<clipPath id="rc${id}"><rect x="86" y="108" width="138" height="34"/></clipPath><rect x="86" y="108" width="138" height="34" fill="#6d7479" stroke="#333"/>`;
  s += `<g clip-path="url(#rc${id})"><g>${dir ? `<animateTransform attributeName="transform" type="translate" from="${dir > 0 ? 0 : 28} 0" to="${dir > 0 ? 28 : 0} 0" dur="${(T / 6).toFixed(2)}s" repeatCount="indefinite"/>` : ''}${[-2,-1,0,1,2,3,4,5,6].map(i => `<path d="M${90 + i * 28} 110L${100 + i * 28} 140" stroke="#d9924f" stroke-width="5"/>`).join('')}</g></g>`;
  s += `<rect x="86" y="108" width="6" height="34" fill="#b87333"/><rect x="218" y="108" width="6" height="34" fill="#b87333"/>`; // end rings
  // shaft + bearings
  s += `<rect x="30" y="118" width="250" height="14" rx="3" fill="url(#sh${id})" stroke="#555"/><rect x="252" y="112" width="60" height="26" rx="3" fill="url(#sh${id})" stroke="#555"/><path d="M296 112V138" stroke="#333" stroke-width="2"/>`;
  [[70, 'bearing'], [238, '']].forEach(([x]) => { s += `<rect x="${x - 8}" y="108" width="16" height="34" rx="3" fill="#cfd3d6" stroke="#555"/>${[114, 125, 136].map(y => `<circle cx="${x}" cy="${y}" r="3.5" fill="#8a9096" stroke="#444"/>`).join('')}`; });
  // fan + cover (left)
  s += `<path d="M34 100H60V180H34Z" fill="none" stroke="#243745" stroke-width="1.5" stroke-dasharray="3 3"/><g>${dir ? `<animateTransform attributeName="transform" type="rotate" from="0 47 125" to="${dir * 360} 47 125" dur="${T.toFixed(2)}s" repeatCount="indefinite"/>` : ''}${[0,60,120,180,240,300].map(a => `<path d="M47 125L${47 + 24 * Math.cos(a * Math.PI / 180)} ${125 + 24 * Math.sin(a * Math.PI / 180)}" stroke="#2a3a46" stroke-width="5" stroke-linecap="round"/>`).join('')}</g><circle cx="47" cy="125" r="6" fill="#1d2b36"/>`;
  // terminal box
  s += `<rect x="120" y="36" width="70" height="26" rx="3" fill="#8f979c" stroke="#4b5257"/><text x="155" y="52" font-size="7" fill="#222" text-anchor="middle">TERMINAL BOX</text><path d="M135 62V64M155 62V64M175 62V64" stroke="#b87333" stroke-width="3"/>`;
  // labels
  const lab = (x1, y1, x2, y2, t, anc) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="currentColor" stroke-width=".9" opacity=".7"/><text class="ar" x="${x2 + (anc === 'end' ? -3 : 3)}" y="${y2 + 4}" font-size="10" fill="currentColor" text-anchor="${anc || 'start'}">${t}</text>`;
  s += lab(155, 40, 220, 28, 'terminal box (U1 V1 W1 / W2 U2 V2)') + lab(150, 70, 262, 70, 'stator: steel laminations and 3-phase windings') + lab(150, 124, 262, 96, 'rotor: squirrel cage (aluminium bars + two rings)') + lab(238, 112, 300, 160, 'bearing') + lab(47, 100, 40, 200, 'fan (self-cooling)') + lab(296, 125, 330, 190, 'shaft (load)') + lab(155, 180, 200, 212, 'frame with cooling fins');
  // end view with rotating field (right)
  const cx = 372, cy = 92, R = 44;
  s += `<text class="ar" x="${cx}" y="18" font-size="12" text-anchor="middle" fill="currentColor">end view (rotating field)</text><circle cx="${cx}" cy="${cy}" r="${R + 10}" fill="#8a9096" stroke="#444"/>`;
  for (let i = 0; i < 12; i++){ const a = i * 30 * Math.PI / 180; s += `<path d="M${cx + (R + 1) * Math.cos(a)} ${cy + (R + 1) * Math.sin(a)}L${cx + (R + 9) * Math.cos(a)} ${cy + (R + 9) * Math.sin(a)}" stroke="#d9924f" stroke-width="4"/>`; }
  s += `<circle cx="${cx}" cy="${cy}" r="${R - 2}" fill="#6d7479" stroke="#333"/>`;
  s += `<g>${dir ? `<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="${dir * 360} ${cx} ${cy}" dur="${(T * 0.95).toFixed(2)}s" repeatCount="indefinite"/>` : ''}${[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(i => { const a = i * 360 / 14 * Math.PI / 180; return `<circle cx="${cx + (R - 9) * Math.cos(a)}" cy="${cy + (R - 9) * Math.sin(a)}" r="3" fill="#d9924f"/>`; }).join('')}<circle cx="${cx}" cy="${cy}" r="7" fill="url(#sh${id})" stroke="#555"/><rect x="${cx - 2}" y="${cy - 7}" width="4" height="5" fill="#333"/></g>`;
  // the stator field: a rotating arrow (slightly faster than the rotor = slip)
  s += `<g>${dir ? `<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="${dir * 360} ${cx} ${cy}" dur="${(T * 0.95 * 0.96).toFixed(2)}s" repeatCount="indefinite"/>` : ''}<path d="M${cx} ${cy - R + 2}L${cx - 6} ${cy - R + 14}L${cx + 6} ${cy - R + 14}Z" fill="${dir ? '#36e070' : '#aaa'}"/><text x="${cx}" y="${cy - R + 24}" font-size="7" fill="#fff" text-anchor="middle">N</text></g>`;
  s += `<text class="ar" x="${cx}" y="${cy + R + 26}" font-size="10" text-anchor="middle" fill="currentColor">${dir ? (dir > 0 ? 'field turns clockwise ↻ and the rotor follows it' : 'field turns anticlockwise ↺ and the rotor follows it') : 'field stopped: no phases'}</text>`;
  s += `<text class="ar" x="${cx}" y="${cy + R + 40}" font-size="9" text-anchor="middle" fill="var(--muted)">${dir ? 'rotor slightly slower than the field = slip' : 'apply 3 phases to U V W and it starts turning'}</text>`;
  return s + '</g></svg>';
};
/* ---------- nameplate ---------- */
CL.art.nameplate = function(d){
  const id = ++UID, c = d.cfg || {}, kW = c.kW || 2.2, In = c.In || 4.9, vD = c.vD || 230, vY = c.vY || 400, cosf = c.cosf || 0.81, rpm = c.rpm || 1430, poles = c.poles || Math.round(6000 / Math.ceil(rpm / 100) / 10) * 2;
  // In is the nameplate current at 400 V: in star for a 230Δ/400Y motor, in delta for a 400Δ/690Y motor
  const ID = vD === 230 ? r1(In * Math.sqrt(3)) : In, IY = vD === 230 ? In : r1(In / Math.sqrt(3)), nsync = Math.round(6000 / (poles / 2)) , iec = c.frame || '100L';
  let s = `<svg viewBox="0 0 440 236" role="img" aria-label="Nameplate of a 3-phase motor"><defs><linearGradient id="al${id}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f1f2f0"/><stop offset=".5" stop-color="#cfd3d6"/><stop offset="1" stop-color="#aab1b6"/></linearGradient></defs><g style="color:var(--ink)">`;
  s += `<rect x="14" y="14" width="412" height="208" rx="8" fill="url(#al${id})" stroke="#6d757b" stroke-width="1.5"/>`;
  [[28, 28], [412, 28], [28, 208], [412, 208]].forEach(([x, y]) => s += `<circle cx="${x}" cy="${y}" r="5" fill="#9aa4ab" stroke="#555"/><path d="M${x - 2.5} ${y - 2.5}L${x + 2.5} ${y + 2.5}" stroke="#444" stroke-width="1.2"/>`);
  s += `<text x="44" y="38" font-size="13" font-weight="700" fill="#1d2226">LEARN MOTORS</text><text x="398" y="38" font-size="11" fill="#1d2226" text-anchor="end">3~ Mot. ${esc(c.model || '1LE1')} · IEC ${iec} · IE3</text>`;
  s += `<path d="M44 46H398" stroke="#555"/>`;
  s += `<text x="44" y="60" font-size="9" fill="#333">No. ${esc(c.serial || 'UC 2026/0421')}  ·  IMB3  ·  Th.Cl. ${esc(c.cls || 'F')}  ·  IP${String(c.ip || 'IP55').replace(/\D/g, '')}  ·  ${c.duty || 'S1'}  ·  ${Math.round(kW * (kW < 4 ? 9 : 7))} kg</text>`;
  // main table: V | Hz | kW | A | cos φ | r/min
  const cols = [['V', `${vD} Δ / ${vY} Y`, 'voltage: delta / star'], ['Hz', '50', 'frequency'], ['kW', String(kW), 'shaft power'], ['A', `${ID} Δ / ${IY} Y`, 'rated current'], ['cos φ', String(cosf), 'power factor'], ['r/min', String(rpm), 'full-load speed']];
  const x0 = 44, W = 354, cw = W / cols.length;
  s += `<rect x="${x0}" y="70" width="${W}" height="62" fill="#f8f8f6" stroke="#555"/>`;
  cols.forEach(([h, v, ar], i) => { const x = x0 + i * cw; s += `<path d="M${x} 70V132" stroke="#555"/><text x="${x + cw / 2}" y="86" font-size="10" font-weight="700" fill="#1d2226" text-anchor="middle">${h}</text><text x="${x + cw / 2}" y="110" font-size="${v.length > 9 ? 8.5 : 12}" font-weight="700" fill="#1d2226" text-anchor="middle">${v}</text><text class="ar" x="${x + cw / 2}" y="126" font-size="7.5" fill="#555" text-anchor="middle">${ar}</text>`; });
  s += `<path d="M${x0} 92H${x0 + W}" stroke="#555"/>`;
  s += `<text x="44" y="147" font-size="9" fill="#333">${poles} poles · n<tspan font-size="7">s</tspan> = ${nsync} r/min · slip ${((nsync - rpm) / nsync * 100).toFixed(1)}%</text>`;
  s += `<text x="44" y="160" font-size="9" fill="#333">Bearings DE 6206-2Z · NDE 6205-2Z · Grease ${Math.round(kW) < 15 ? 'lifetime' : '4000 h'}</text>`;
  s += `<text x="44" y="173" font-size="9" fill="#333">Amb 40 °C · Alt ≤ 1000 m · Ins. Cl. F (ΔT B)</text>`;
  // star / delta icons
  s += `<g transform="translate(300 174)"><text x="0" y="0" font-size="8" fill="#333">${vY} V</text><path d="M26 -10L34 4L18 4Z" fill="none" stroke="#1d2226" stroke-width="1.6"/><text x="26" y="20" font-size="10" fill="#1d2226" text-anchor="middle">Y</text><text x="60" y="0" font-size="8" fill="#333">${vD} V</text><path d="M86 -8V8M80 -8L92 8M92 -8L80 8" fill="none" stroke="#1d2226" stroke-width="1.6"/><text x="86" y="20" font-size="10" fill="#1d2226" text-anchor="middle">Δ</text></g>`;
  s += `<text class="ar" x="44" y="192" font-size="9" fill="#333">On a 400 V supply: ${vD === 230 ? 'connect in star (Y)' : 'connect in delta (Δ)'}, and set the overload to ${In} A</text>`;
  s += `<text x="220" y="214" font-size="8" fill="#555" text-anchor="middle">CE · IEC 60034-1 · ${esc(c.model || '1LE1')} ${iec}-4AA · Made in EG</text>`;
  return s + '</g></svg>';
};
/* ---------- terminal box with bridges + winding diagram ---------- */
CL.art.tbox = function(o){
  o = o || {}; const id = ++UID, mode = o.mode || 'none', vD = o.vD || 230, vY = o.vY || 400, sup = o.sup || 400;
  const vw = mode === 'Y' ? Math.round(sup / Math.sqrt(3)) : mode === 'D' ? sup : 0, k = vw / vD;
  const verdict = mode === 'none' ? 'No links: the motor won\'t turn (windings open)' : k > 1.4 ? `Danger: each winding gets ${vw} V but is rated for ${vD} V → high current and the motor burns out` : k < 0.7 ? `Weak: each winding gets ${vw} V instead of ${vD} V → a third of the torque` : `Correct: each winding gets ${vw} V = the rated winding voltage ${vD} V`;
  const col = mode === 'none' ? 'var(--muted)' : k > 1.4 ? 'var(--bad)' : k < 0.7 ? 'var(--warn)' : 'var(--good)';
  let s = `<svg viewBox="0 0 440 262" role="img" aria-label="Motor terminal box and links"><defs>${copper(id)}</defs><g style="color:var(--ink)">`;
  s += `<text class="ar" x="110" y="18" font-size="12" text-anchor="middle" fill="currentColor">terminal box from above</text>`;
  s += `<rect x="20" y="28" width="180" height="150" rx="8" fill="#8f979c" stroke="#4b5257"/><rect x="30" y="38" width="160" height="130" rx="5" fill="#d9dcde" stroke="#7d8388"/>`;
  const px = [60, 110, 160], top = 74, bot = 134, T = {W2:[px[0], top], U2:[px[1], top], V2:[px[2], top], U1:[px[0], bot], V1:[px[1], bot], W1:[px[2], bot]};
  // bridges
  if (mode === 'Y') s += `<rect x="${px[0] - 10}" y="${top - 5}" width="${px[2] - px[0] + 20}" height="10" rx="3" fill="#b87333" stroke="#5a3410"/>`;
  if (mode === 'D') [[px[0]], [px[1]], [px[2]]].forEach(([x]) => s += `<rect x="${x - 5}" y="${top}" width="10" height="${bot - top}" rx="3" fill="#b87333" stroke="#5a3410"/>`);
  Object.keys(T).forEach(n => { const [x, y] = T[n]; s += `<circle cx="${x}" cy="${y}" r="9" fill="#d8dbdd" stroke="#555" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="4" fill="#b87333"/><text x="${x}" y="${y + (y === top ? -14 : 24)}" font-size="11" font-weight="700" fill="#1d2226" text-anchor="middle">${n}</text>`; });
  // supply cables
  if (o.supply !== false) [['L1', px[0], '#7b4a21'], ['L2', px[1], '#1f1f1f'], ['L3', px[2], '#8a8f94']].forEach(([l, x, c]) => s += `<path d="M${x} ${bot + 9}V176" stroke="${c}" stroke-width="5"/><text x="${x}" y="190" font-size="9" fill="currentColor" text-anchor="middle">${l}</text>`);
  s += `<text class="ar" x="110" y="208" font-size="10" text-anchor="middle" fill="currentColor">${mode === 'Y' ? 'star links: W2-U2-V2 joined together' : mode === 'D' ? 'delta links: U1-W2 · V1-U2 · W1-V2' : 'no links'}</text>`;
  // winding diagram
  const X = 240;
  s += `<text class="ar" x="${X + 90}" y="18" font-size="12" text-anchor="middle" fill="currentColor">windings inside the motor</text>`;
  const coilV = (x, y1, y2) => { let z = `M${x} ${y1}`; const n = 5, h = (y2 - y1) / n; for (let i = 0; i < n; i++) z += `A6 6 0 0 1 ${x} ${y1 + (i + 1) * h}`; return `<path d="${z}" fill="none" stroke="#b87333" stroke-width="2.4"/>`; };
  if (mode === 'Y'){
    const cx = X + 90, cy = 110;
    [[-90, 'U1', 'U2'], [30, 'V1', 'V2'], [150, 'W1', 'W2']].forEach(([a, t1]) => { const r = a * Math.PI / 180, x1 = cx + 62 * Math.cos(r), y1 = cy + 62 * Math.sin(r); s += `<g transform="rotate(${a + 90} ${cx} ${cy})">${coilV(cx, cy - 58, cy - 12)}</g><path d="M${cx + 12 * Math.cos(r)} ${cy + 12 * Math.sin(r)}L${cx} ${cy}" stroke="#b87333" stroke-width="2.4"/><text x="${cx + 76 * Math.cos(r)}" y="${cy + 76 * Math.sin(r) + 4}" font-size="10" font-weight="700" fill="currentColor" text-anchor="middle">${t1}</text>`; });
    s += `<circle cx="${cx}" cy="${cy}" r="4" fill="#b87333"/><text class="ar" x="${cx}" y="${cy + 100}" font-size="10" text-anchor="middle" fill="currentColor">star point = W2 U2 V2</text>`;
  } else if (mode === 'D'){
    const cx = X + 90, cy = 112, R = 58, P = [[cx, cy - R], [cx + R * 0.866, cy + R / 2], [cx - R * 0.866, cy + R / 2]], names = ['U1', 'V1', 'W1'];
    P.forEach((p, i) => { const q = P[(i + 1) % 3], ang = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI; const L = Math.hypot(q[0] - p[0], q[1] - p[1]); s += `<g transform="translate(${p[0]} ${p[1]}) rotate(${ang - 90})">${coilV(0, 6, L - 6)}</g><text x="${p[0] + (p[0] - cx) * 0.3}" y="${p[1] + (p[1] - cy) * 0.3 + 4}" font-size="10" font-weight="700" fill="currentColor" text-anchor="middle">${names[i]}</text>`; });
    s += `<text class="ar" x="${cx}" y="${cy + 100}" font-size="10" text-anchor="middle" fill="currentColor">each winding across two phases</text>`;
  } else {
    [0, 1, 2].forEach(i => { const x = X + 40 + i * 50; s += coilV(x, 60, 150) + `<text x="${x}" y="52" font-size="10" font-weight="700" fill="currentColor" text-anchor="middle">${['U1','V1','W1'][i]}</text><text x="${x}" y="166" font-size="10" font-weight="700" fill="currentColor" text-anchor="middle">${['U2','V2','W2'][i]}</text>`; });
    s += `<text class="ar" x="${X + 90}" y="212" font-size="10" text-anchor="middle" fill="currentColor">3 separate windings, 6 terminals</text>`;
  }
  s += `<text class="ar" x="${X + 90}" y="236" font-size="10" text-anchor="middle" fill="${col}" font-weight="700">${verdict}</text>`;
  s += `<text class="ar" x="220" y="256" font-size="9" text-anchor="middle" fill="var(--muted)">supply ${sup} V · nameplate ${vD} Δ / ${vY} Y</text>`;
  return s + '</g></svg>';
};
/* ---------- float switch (cable float) ---------- */
CL.art.floatArt = function(d){
  const id = ++UID, lvl = d.st.lvl == null ? 0.5 : d.st.lvl, at = d.cfg.at == null ? 0.8 : d.cfg.at, on = !!d.st.a;
  let s = `<svg viewBox="0 0 440 262" role="img" aria-label="Float switch in a tank"><defs>${copper(id)}</defs><g style="color:var(--ink)">`;
  // tank
  const tx = 40, ty = 30, tw = 170, th = 200, wy = ty + th - th * lvl;
  s += `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="6" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="${tx + 2}" y="${wy}" width="${tw - 4}" height="${ty + th - wy - 2}" fill="#4ea0ff" opacity=".75"/>`;
  s += `<path d="M${tx - 6} ${ty + th - th * at}H${tx + tw + 6}" stroke="var(--bad)" stroke-width="1.5" stroke-dasharray="4 3"/><text class="ar" x="${tx + tw + 10}" y="${ty + th - th * at + 4}" font-size="9" fill="var(--bad)">set point</text>`;
  // cable from the top, float tilts with the level
  const fx = tx + tw / 2, cy0 = ty - 8, fy = Math.max(ty + 40, Math.min(ty + th - 30, wy + (on ? -6 : 26)));
  s += `<rect x="${fx - 14}" y="${cy0 - 10}" width="28" height="10" fill="#555"/><path d="M${fx} ${cy0}V${fy - 26}" stroke="#222" stroke-width="2.4"/>`;
  s += `<g transform="rotate(${on ? -60 : 55} ${fx} ${fy - 26})"><ellipse cx="${fx}" cy="${fy}" rx="16" ry="28" fill="#1f6fd1" stroke="#0f3e7a" stroke-width="1.5"/><rect x="${fx - 6}" y="${fy - 10}" width="12" height="20" rx="3" fill="#fff" opacity=".35"/><circle cx="${fx}" cy="${fy + (on ? 16 : -16)}" r="5" fill="#8a9096" stroke="#444"/></g>`;
  s += `<text class="ar" x="${fx}" y="${ty + th + 20}" font-size="11" text-anchor="middle" fill="${on ? GOOD : 'currentColor'}" font-weight="700">${on ? 'float up: the ball rolled and changed over the contact' : 'float hanging: contact in its normal state'}</text>`;
  s += `<text x="${tx + 8}" y="${wy - 4}" font-size="9" fill="currentColor">${Math.round(lvl * 100)}%</text>`;
  // inside the float: a ball on a ramp with two contact sets
  const X = 250;
  s += `<text class="ar" x="${X + 90}" y="22" font-size="12" text-anchor="middle" fill="currentColor">inside the float</text><rect x="${X}" y="30" width="180" height="110" rx="8" fill="none" stroke="#6d757b" stroke-dasharray="4 3"/>`;
  s += `<g transform="rotate(${on ? -14 : 14} ${X + 90} 90)"><rect x="${X + 20}" y="70" width="140" height="40" rx="18" fill="#cfe3f7" stroke="#4f6f8f"/><path d="M${X + 30} 90H${X + 150}" stroke="#7a4f1c" stroke-width="2"/><circle cx="${X + (on ? 140 : 40)}" cy="88" r="9" fill="#8a9096" stroke="#333"/><text x="${X + 30}" y="66" font-size="8" fill="currentColor">NC</text><text x="${X + 150}" y="66" font-size="8" fill="currentColor" text-anchor="end">NO</text></g>`;
  s += `<text class="ar" x="${X + 90}" y="158" font-size="10" text-anchor="middle" fill="currentColor">a metal ball rolls with the tilt and closes one side or the other</text>`;
  // 3-wire cable legend
  s += `<text class="ar" x="${X + 90}" y="186" font-size="11" text-anchor="middle" fill="currentColor" font-weight="700">3-core cable: common + NO + NC</text>`;
  [['blue', 'common', '#3a9be0'], ['black', 'NO (closes when it floats)', '#1f1f1f'], ['brown', 'NC (opens when it floats)', '#7b4a21']].forEach(([c, t, col], i) => { s += `<path d="M${X + 10} ${202 + i * 16}H${X + 40}" stroke="${col}" stroke-width="4"/><text class="ar" x="${X + 48}" y="${206 + i * 16}" font-size="9.5" fill="currentColor">${c}: ${t}</text>`; });
  s += `<text class="ar" x="${X + 90}" y="256" font-size="9" text-anchor="middle" fill="var(--muted)">Turn the float over (hang it upside down) and NO and NC swap: that's its “direction”</text>`;
  return s + '</g></svg>';
};
/* ---------- pressure switch (bourdon / diaphragm with range and differential) ---------- */
CL.art.pressArt = function(d){
  const id = ++UID, lvl = d.st.lvl == null ? 0.5 : d.st.lvl, at = d.cfg.at == null ? 0.8 : d.cfg.at, hy = d.cfg.hyst == null ? 0.2 : d.cfg.hyst, on = !!d.st.a, max = d.cfg.max || 10;
  const bar = v => r1(v * max);
  let s = `<svg viewBox="0 0 440 262" role="img" aria-label="Pressure switch and pressure gauge"><defs>${copper(id)}</defs><g style="color:var(--ink)">`;
  // gauge
  const cx = 90, cy = 110, R = 62;
  s += `<text class="ar" x="${cx}" y="22" font-size="12" text-anchor="middle" fill="currentColor">pressure gauge (bar)</text><circle cx="${cx}" cy="${cy}" r="${R + 8}" fill="#2a2d30" stroke="#111"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="#f4f4f1" stroke="#555"/>`;
  for (let i = 0; i <= max; i++){ const a = (-135 + 270 * i / max) * Math.PI / 180; s += `<path d="M${cx + (R - 2) * Math.sin(a)} ${cy - (R - 2) * Math.cos(a)}L${cx + (R - (i % 2 ? 7 : 11)) * Math.sin(a)} ${cy - (R - (i % 2 ? 7 : 11)) * Math.cos(a)}" stroke="#222" stroke-width="${i % 2 ? 1 : 1.6}"/>` + (i % 2 ? '' : `<text x="${cx + (R - 20) * Math.sin(a)}" y="${cy - (R - 20) * Math.cos(a) + 4}" font-size="9" fill="#222" text-anchor="middle">${i}</text>`); }
  // cut-in / cut-out band
  const arc = (v0, v1, col) => { const a0 = (-135 + 270 * v0) * Math.PI / 180, a1 = (-135 + 270 * v1) * Math.PI / 180, r = R - 4; return `<path d="M${cx + r * Math.sin(a0)} ${cy - r * Math.cos(a0)}A${r} ${r} 0 ${v1 - v0 > 0.5 ? 1 : 0} 1 ${cx + r * Math.sin(a1)} ${cy - r * Math.cos(a1)}" fill="none" stroke="${col}" stroke-width="5" opacity=".7"/>`; };
  s += arc(at - hy, at, '#2b9a4a');
  const an = -135 + 270 * clamp(lvl, 0, 1);
  s += `<g transform="rotate(${an} ${cx} ${cy})"><path d="M${cx} ${cy + 10}L${cx - 3} ${cy}L${cx} ${cy - R + 10}L${cx + 3} ${cy}Z" fill="#d32f2f"/></g><circle cx="${cx}" cy="${cy}" r="5" fill="#333"/>`;
  s += `<text x="${cx}" y="${cy + 36}" font-size="12" font-weight="700" fill="#222" text-anchor="middle">${bar(lvl)} bar</text>`;
  s += `<text class="ar" x="${cx}" y="${cy + R + 28}" font-size="10" text-anchor="middle" fill="currentColor">green: between cut-in ${bar(at - hy)} and cut-out ${bar(at)} bar</text>`;
  // switch body: diaphragm, spring, set screws, contacts
  const X = 220;
  s += `<text class="ar" x="${X + 100}" y="22" font-size="12" text-anchor="middle" fill="currentColor">inside the pressure switch</text><rect x="${X}" y="30" width="200" height="190" rx="8" fill="#e9eaec" stroke="#7d8388"/>`;
  s += `<rect x="${X + 20}" y="170" width="70" height="30" rx="4" fill="#8f979c" stroke="#4b5257"/><path d="M${X + 55} 200V222" stroke="#8f979c" stroke-width="10"/><text class="ar" x="${X + 55}" y="236" font-size="9" text-anchor="middle" fill="currentColor">¼" pressure inlet</text>`;
  const dia = 170 - 30 * clamp(lvl, 0, 1);
  s += `<path d="M${X + 20} 170Q${X + 55} ${dia} ${X + 90} 170" fill="#f0a03c" stroke="#8a4f00" stroke-width="2"/><rect x="${X + 51}" y="${dia - 60}" width="8" height="${60 + (170 - dia) * 0.4}" fill="#55595c"/>`;
  // main spring (range) and differential spring
  let z = `M${X + 55} ${dia - 60}`; for (let i = 1; i <= 6; i++) z += `L${X + 55 + (i % 2 ? 8 : -8)} ${dia - 60 - i * 9}`; z += `L${X + 55} ${dia - 120}`;
  s += `<path d="${z}" fill="none" stroke="#9aa0a5" stroke-width="2"/><rect x="${X + 40}" y="${dia - 134}" width="30" height="10" fill="#1f6fd1"/><text class="ar" x="${X + 55}" y="${dia - 140}" font-size="8" text-anchor="middle" fill="currentColor">set screw (Range)</text>`;
  s += `<rect x="${X + 110}" y="60" width="24" height="10" fill="#d32f2f"/><text class="ar" x="${X + 122}" y="54" font-size="8" text-anchor="middle" fill="currentColor">differential (Diff.)</text><text class="ar" x="${X + 122}" y="82" font-size="7.5" text-anchor="middle" fill="var(--muted)">sets the cut-in point</text>`;
  // contact lever
  s += `<path d="M${X + 59} ${dia - 40}L${X + 150} ${on ? dia - 60 : dia - 30}" stroke="#7a4f1c" stroke-width="3"/><path d="M${X + 150} 100V118" stroke="#7a4f1c" stroke-width="2"/><path d="M${X + 140} 118H${X + 160}" stroke="${on ? '#7a4f1c' : GOOD}" stroke-width="3"/><text x="${X + 165}" y="112" font-size="8" fill="currentColor">NC</text><path d="M${X + 140} 142H${X + 160}" stroke="${on ? GOOD : '#7a4f1c'}" stroke-width="3"/><text x="${X + 165}" y="152" font-size="8" fill="currentColor">NO</text>`;
  s += `<text class="ar" x="${X + 100}" y="${dia - 10 < 100 ? 96 : 96}" font-size="0"> </text>`;
  s += `<text class="ar" x="${X + 100}" y="212" font-size="10" text-anchor="middle" fill="${on ? GOOD : 'currentColor'}" font-weight="700">${on ? 'pressure reached cut-out: contact changed over' : 'pressure below setting: contact normal'}</text>`;
  s += `<text class="ar" x="220" y="256" font-size="9" text-anchor="middle" fill="var(--muted)">Pressure pushes the diaphragm against the spring; when it wins the contact changes over, and only returns when the pressure drops by the differential</text>`;
  return s + '</g></svg>';
};
/* ---------- proximity sensor / photocell with the object and the PNP/NPN wiring inset ---------- */
CL.art.proxArt = function(d){
  const id = ++UID, k = d.cfg.kind, pnp = !!d.cfg.pnp, nc = !!d.cfg.nc, x = d.st.x == null ? (d.st.a ? 1 : 0) : d.st.x, a = !!d.st.a, out = TYPES.prox.op(d), thru = d.cfg.sub === 'thru';
  let s = `<svg viewBox="0 0 440 262" role="img" aria-label="${esc(CL.PROX_AR[k] || 'sensor')}"><defs>${copper(id)}<linearGradient id="ss${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e6e9eb"/><stop offset=".5" stop-color="#9aa4ab"/><stop offset="1" stop-color="#5d6871"/></linearGradient></defs><g style="color:var(--ink)">`;
  s += `<text class="ar" x="120" y="20" font-size="12" text-anchor="middle" fill="currentColor">${esc(CL.PROX_AR[k] || '')}${k === 'photo' ? (thru ? ' · through-beam' : ' · reflective') : ''}</text>`;
  if (k !== 'photo'){
    // M18 threaded barrel on a bracket, sensing face to the right, object (metal plate / box) moving in from the right
    s += `<rect x="20" y="92" width="12" height="60" fill="#6d757b"/><rect x="32" y="110" width="130" height="24" rx="4" fill="url(#ss${id})" stroke="#444"/>${[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(i => `<path d="M${40 + i * 6} 110V134" stroke="#7d8388" stroke-width=".8"/>`).join('')}`;
    s += `<rect x="44" y="104" width="12" height="36" fill="#8f979c" stroke="#444"/><rect x="78" y="104" width="12" height="36" fill="#8f979c" stroke="#444"/>`; // nuts
    s += `<rect x="160" y="108" width="14" height="28" rx="3" fill="${k === 'cap' ? '#1f6fd1' : '#e0a21b'}" stroke="#555"/>`; // sensing face
    s += `<circle cx="120" cy="100" r="4" fill="${out ? '#ffd24d' : '#4a3d10'}"/>${out ? '<circle cx="120" cy="100" r="7" fill="#ffd24d" opacity=".4"/>' : ''}<text x="120" y="94" font-size="7" fill="currentColor" text-anchor="middle">LED</text>`;
    // field
    const far = 230;
    s += `<path d="M176 122Q${176 + 34} 100 ${176 + 54} 122Q${176 + 34} 144 176 122Z" fill="${a ? '#ffd24d' : '#36e070'}" opacity=".25"/><text x="${176 + 27}" y="156" font-size="8" fill="currentColor" text-anchor="middle">Sn = ${d.cfg.sn} mm</text>`;
    const ox = far + (1 - x) * 90;
    s += `<rect x="${ox}" y="96" width="${k === 'cap' ? 48 : 14}" height="52" rx="3" fill="${k === 'cap' ? '#c99a5b' : '#8a9096'}" stroke="#333"/><text class="ar" x="${ox + (k === 'cap' ? 24 : 7)}" y="${k === 'cap' ? 126 : 90}" font-size="8" fill="${k === 'cap' ? '#fff' : 'currentColor'}" text-anchor="middle">${k === 'cap' ? 'box / liquid' : 'steel'}</text>`;
    s += `<text class="ar" x="${ox + 20}" y="166" font-size="9" fill="currentColor" text-anchor="middle">${a ? '← in range' : 'away →'}</text>`;
    // cable
    s += `<path d="M32 122H20V200" stroke="#2a2d30" stroke-width="6"/>`;
  } else {
    // photocell: emitter box, beam, receiver (thru) or reflector (retro); a box breaks the beam
    s += `<rect x="24" y="96" width="44" height="52" rx="5" fill="#2a2d30" stroke="#111"/><rect x="60" y="106" width="8" height="32" rx="2" fill="#d32f2f" opacity=".9"/><text x="46" y="92" font-size="8" fill="currentColor" text-anchor="middle">${thru ? 'emitter' : 'emitter + receiver'}</text>`;
    s += `<circle cx="40" cy="104" r="3.5" fill="${out ? '#ffd24d' : '#4a3d10'}"/>`;
    if (thru) s += `<rect x="296" y="96" width="44" height="52" rx="5" fill="#2a2d30" stroke="#111"/><rect x="296" y="106" width="8" height="32" rx="2" fill="#2a7fe0" opacity=".9"/><text x="318" y="92" font-size="8" fill="currentColor" text-anchor="middle">receiver</text>`;
    else s += `<rect x="320" y="92" width="14" height="60" rx="2" fill="#fff" stroke="#555"/>${[0,1,2,3,4].map(i => `<path d="M322 ${98 + i * 12}l10 6l-10 6" fill="none" stroke="#999" stroke-width="1"/>`).join('')}<text x="327" y="86" font-size="8" fill="currentColor" text-anchor="middle">reflector</text>`;
    const bx = 120 + (1 - x) * 160;
    s += `<path d="M68 122H${a ? bx : (thru ? 296 : 320)}" stroke="#ff4a3d" stroke-width="2" stroke-dasharray="6 4"/>` + (!a && !thru ? `<path d="M320 118H68" stroke="#ff8a80" stroke-width="1.2" stroke-dasharray="3 5"/>` : '');
    s += `<rect x="${bx}" y="88" width="52" height="66" rx="3" fill="#c99a5b" stroke="#6b4a1f"/><text class="ar" x="${bx + 26}" y="124" font-size="9" fill="#fff" text-anchor="middle">box</text><text class="ar" x="${bx + 26}" y="170" font-size="9" fill="currentColor" text-anchor="middle">${a ? 'breaking the beam' : 'clear of the beam'}</text>`;
    s += `<path d="M46 148V200" stroke="#2a2d30" stroke-width="6"/>`;
  }
  // 3 wires
  [['BN', '#7b4a21', '+24V'], ['BK', '#1f1f1f', 'output'], ['BU', '#3a9be0', '0V']].forEach(([n, c, t], i) => { const y = 206 + i * 16; s += `<path d="M${k === 'photo' ? 46 : 20} ${y}H90" stroke="${c}" stroke-width="4"/><text x="96" y="${y + 4}" font-size="9" fill="currentColor">${n} ${t}</text>`; });
  // wiring inset: load position for PNP vs NPN
  const X = 250, Y = 190;
  s += `<rect x="${X}" y="${Y - 10}" width="180" height="76" rx="6" fill="none" stroke="#6d757b" stroke-dasharray="4 3"/><text class="ar" x="${X + 90}" y="${Y + 4}" font-size="10" text-anchor="middle" fill="currentColor" font-weight="700">${pnp ? 'PNP: load between BK and 0V' : 'NPN: load between +24V and BK'}</text>`;
  s += `<path d="M${X + 20} ${Y + 20}H${X + 160}" stroke="#7b4a21" stroke-width="2.5"/><text x="${X + 10}" y="${Y + 24}" font-size="8" fill="currentColor">+</text><path d="M${X + 20} ${Y + 56}H${X + 160}" stroke="#3a9be0" stroke-width="2.5"/><text x="${X + 10}" y="${Y + 60}" font-size="8" fill="currentColor">−</text>`;
  s += `<rect x="${X + 60}" y="${Y + 26}" width="40" height="24" rx="3" fill="#e9eaec" stroke="#555"/><text x="${X + 80}" y="${Y + 41}" font-size="7" fill="#222" text-anchor="middle">SENSOR</text>`;
  s += pnp ? `<path d="M${X + 100} ${Y + 38}H${X + 126}V${Y + 44}" stroke="#1f1f1f" stroke-width="2"/><rect class="sy" x="${X + 118}" y="${Y + 44}" width="16" height="10" style="stroke-width:1.4"/><text x="${X + 142}" y="${Y + 52}" font-size="7" fill="currentColor">K1</text>` : `<path d="M${X + 100} ${Y + 38}H${X + 126}V${Y + 32}" stroke="#1f1f1f" stroke-width="2"/><rect class="sy" x="${X + 118}" y="${Y + 22}" width="16" height="10" style="stroke-width:1.4"/><text x="${X + 142}" y="${Y + 30}" font-size="7" fill="currentColor">K1</text>`;
  s += `<text class="ar" x="${X + 90}" y="${Y + 76}" font-size="8.5" text-anchor="middle" fill="${out ? GOOD : 'var(--muted)'}" font-weight="700">${out ? (pnp ? 'output BK = +24V (on)' : 'output BK = 0V (on)') : 'output off'}</text>`;
  s += `<text class="ar" x="120" y="256" font-size="9" text-anchor="middle" fill="var(--muted)">${nc ? 'NC: output on when there\'s no object' : 'NO: output on when there\'s an object'}</text>`;
  return s + '</g></svg>';
};
CL.art.levelArt = function(d){ return d.cfg.look === 'press' ? CL.art.pressArt(d) : d.cfg.look === 'thermo' ? CL.art.thermoArt(d) : CL.art.floatArt(d); };
/* ---------- mechanical interlock between two contactors (reversing) ---------- */
CL.art.mechInterlock = function(o){
  o = o || {}; const id = ++UID, on = o.on || 0; // 0 none, 1 left closed, 2 right closed
  let s = `<svg viewBox="0 0 440 236" role="img" aria-label="Mechanical interlock between two contactors"><defs>${copper(id)}</defs><g style="color:var(--ink)">`;
  [[40, 'KM1', on === 1], [250, 'KM2', on === 2]].forEach(([x, tag, cl]) => {
    s += `<rect x="${x}" y="40" width="150" height="150" rx="7" fill="#3b3f43" stroke="#1d2022"/><text x="${x + 75}" y="32" font-size="12" font-weight="700" fill="currentColor" text-anchor="middle">${tag}</text>`;
    s += `<rect x="${x + 30}" y="70" width="90" height="26" rx="3" fill="#1b1d1f"/><rect x="${x + 34}" y="${cl ? 80 : 72}" width="82" height="12" rx="2" fill="#cfd2d4"/><text x="${x + 75}" y="${cl ? 89 : 81}" font-size="8" fill="#222" text-anchor="middle" font-weight="700">${cl ? '▼ I' : '0'}</text>`;
    s += `<rect x="${x + 30}" y="106" width="90" height="60" rx="3" fill="#e9eaec" stroke="#9aa1a6"/><text x="${x + 75}" y="130" font-size="9" fill="#222" text-anchor="middle" font-weight="700">LC1D09</text><text x="${x + 75}" y="146" font-size="8" fill="${cl ? GOOD : '#777'}" text-anchor="middle" font-weight="700">${cl ? 'running' : 'stopped'}</text>`;
  });
  // the interlock block in between: a rocker lever that the moving carrier of one contactor pushes to block the other
  s += `<rect x="190" y="60" width="60" height="110" rx="4" fill="#565c61" stroke="#2a2d30"/><text x="220" y="76" font-size="7" fill="#eee" text-anchor="middle">LAD4CM</text>`;
  const tilt = on === 1 ? -22 : on === 2 ? 22 : 0;
  s += `<g transform="rotate(${tilt} 220 118)"><rect x="196" y="112" width="48" height="12" rx="3" fill="#d6332a" stroke="#7d1414"/></g><circle cx="220" cy="118" r="5" fill="#222"/>`;
  s += `<path d="M190 ${on === 1 ? 108 : 118}L${on === 1 ? 182 : 186} ${on === 1 ? 86 : 118}" stroke="#cfd2d4" stroke-width="4"/><path d="M250 ${on === 2 ? 108 : 118}L${on === 2 ? 258 : 254} ${on === 2 ? 86 : 118}" stroke="#cfd2d4" stroke-width="4"/>`;
  s += `<text class="ar" x="220" y="150" font-size="7.5" fill="#eee" text-anchor="middle">lever</text>`;
  s += `<text class="ar" x="220" y="214" font-size="11" text-anchor="middle" fill="${on ? 'var(--bad)' : 'currentColor'}" font-weight="700">${on === 1 ? 'KM1 pulled in, so the lever tilted and locks KM2: it can\'t pull in even if its coil is energised' : on === 2 ? 'KM2 pulled in, so the lever tilted and locks KM1' : 'both off: lever in the middle, either one can pull in'}</text>`;
  s += `<text class="ar" x="220" y="230" font-size="9" text-anchor="middle" fill="var(--muted)">Fitted between two contactors side by side on the rail. The electrical interlock (21-22) protects the coil; the mechanical one protects if a contact welds</text>`;
  return s + '</g></svg>';
};

/* ---------- bench cells ---------- */
function benchProx(d, ctx){
  const k = d.cfg.kind, out = TYPES.prox.op(d), a = !!d.st.a, linked = !!d.cfg.cart, pnp = !!d.cfg.pnp, w = CW, terms = {};
  let s = cellHead(d, d.cfg.label || (k === 'photo' ? 'photocell' : k === 'cap' ? 'capacitive sensor' : 'inductive sensor'), w);
  if (k !== 'photo'){
    s += `<rect x="18" y="56" width="70" height="18" rx="3" fill="#aab1b6" stroke="#444"/>${[0,1,2,3,4,5,6,7,8].map(i => `<path d="M${24 + i * 7} 56V74" stroke="#7d8388" stroke-width=".8"/>`).join('')}<rect x="88" y="54" width="8" height="22" rx="2" fill="${k === 'cap' ? '#1f6fd1' : '#e0a21b'}" stroke="#555"/>`;
    s += `<circle cx="60" cy="48" r="3.5" fill="${out ? '#ffd24d' : '#4a3d10'}"/>${out ? '<circle cx="60" cy="48" r="6.5" fill="#ffd24d" opacity=".45"/>' : ''}`;
    const ox = a ? 104 : 136;
    s += `<rect x="${ox}" y="48" width="${k === 'cap' ? 26 : 10}" height="34" rx="2" fill="${k === 'cap' ? '#c99a5b' : '#8a9096'}" stroke="#333"/>`;
  } else {
    s += `<rect x="18" y="50" width="26" height="30" rx="3" fill="#2a2d30"/><rect x="40" y="56" width="5" height="18" fill="#d32f2f"/><circle cx="26" cy="46" r="3" fill="${out ? '#ffd24d' : '#4a3d10'}"/>`;
    s += `<rect x="146" y="50" width="8" height="30" fill="#fff" stroke="#555"/>`;
    const bx = a ? 86 : 110;
    s += `<path d="M45 65H${a ? bx : 146}" stroke="#ff4a3d" stroke-width="1.6" stroke-dasharray="4 3"/><rect x="${bx}" y="46" width="30" height="38" rx="2" fill="#c99a5b" stroke="#6b4a1f"/>`;
  }
  s += `<text class="ar" x="85" y="98" font-size="9.5" text-anchor="middle" fill="${out ? GOOD : 'var(--muted)'}" font-weight="700">${a ? (k === 'photo' ? 'object breaking the beam' : 'object in range') : (k === 'photo' ? 'beam clear' : 'no object')} · ${out ? 'output ' + (pnp ? '+24V' : '0V') : 'no output'}</text>`;
  if (linked) s += `<text class="ar" x="85" y="112" font-size="9" text-anchor="middle" fill="var(--muted)">detects ${esc(d.cfg.cart)}</text>`;
  // 3-wire terminal strip
  const y0 = 126;
  s += `<rect x="20" y="${y0}" width="130" height="58" rx="4" fill="#efeee9" stroke="#8c8f8a"/>`;
  [['BN', 46, '#7b4a21', '+24V'], ['BK', 85, '#1f1f1f', (pnp ? 'PNP' : 'NPN') + ' ' + (d.cfg.nc ? 'NC' : 'NO')], ['BU', 124, '#3a9be0', '0V']].forEach(([n, x, c, t]) => { terms[n] = {x, y:y0 + 46, dir:1}; s += `<path d="M${x} ${y0 + 6}V${y0 + 36}" stroke="${c}" stroke-width="4"/><text x="${x}" y="${y0 + 74}" font-size="11" font-weight="700" text-anchor="middle" fill="var(--ink)">${n}</text><text x="${x}" y="${y0 + 86}" font-size="7.5" text-anchor="middle" fill="var(--muted)">${t}</text>`; });
  const hit = linked ? '' : `<rect class="ba" data-dev="${d.id}" data-act="latchA" x="4" y="30" width="162" height="76" tabindex="0" role="button" aria-label="${k === 'photo' ? 'Put a box in the beam or take it out' : 'Move an object toward or away from the sensor'}"/>`;
  return {svg:s, hit, terms};
}
function benchTank(d, ctx){
  const air = d.cfg.look === 'air', lvl = d.st.lvl, max = d.cfg.max || 10, w = CW;
  let s = cellHead(d, d.cfg.label || (air ? 'air receiver (compressor)' : 'tank'), w);
  if (!air){
    s += `<rect x="45" y="30" width="80" height="140" rx="6" fill="none" stroke="var(--ink)" stroke-width="2"/><rect x="47" y="${32 + 136 * (1 - lvl)}" width="76" height="${136 * lvl}" fill="#4ea0ff" opacity=".8"/><text x="85" y="190" font-size="11" text-anchor="middle" fill="var(--ink)">${Math.round(lvl * 100)}%</text>`;
    if (d.cfg.drain) s += `<path d="M125 160H150" stroke="#4ea0ff" stroke-width="3"/><text class="ar" x="150" y="150" font-size="8" text-anchor="end" fill="var(--muted)">${d.cfg.drain < 0 ? 'water in' : 'usage'}</text>`;
    if (d.cfg.fill < 0) s += `<text class="ar" x="85" y="202" font-size="8.5" text-anchor="middle" fill="var(--muted)">${d.cfg.pump} draws from this tank</text>`;
    return {svg:s, hit:'', terms:{}};
  }
  // air receiver: horizontal cylinder + gauge
  s += `<rect x="20" y="120" width="130" height="50" rx="22" fill="#cfd3d6" stroke="#555" stroke-width="1.5"/><rect x="40" y="170" width="8" height="14" fill="#6d757b"/><rect x="122" y="170" width="8" height="14" fill="#6d757b"/>`;
  s += `<path d="M85 120V100" stroke="#8f979c" stroke-width="6"/>`;
  const cx = 85, cy = 66, R = 30, an = -135 + 270 * clamp(lvl, 0, 1);
  s += `<circle cx="${cx}" cy="${cy}" r="${R + 4}" fill="#2a2d30"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="#f4f4f1" stroke="#555"/>`;
  for (let i = 0; i <= max; i += 2){ const a = (-135 + 270 * i / max) * Math.PI / 180; s += `<text x="${cx + (R - 9) * Math.sin(a)}" y="${cy - (R - 9) * Math.cos(a) + 3}" font-size="7" fill="#222" text-anchor="middle">${i}</text>`; }
  s += `<g transform="rotate(${an} ${cx} ${cy})"><path d="M${cx} ${cy + 5}L${cx - 2} ${cy}L${cx} ${cy - R + 6}L${cx + 2} ${cy}Z" fill="#d32f2f"/></g><circle cx="${cx}" cy="${cy}" r="3" fill="#333"/>`;
  s += `<text x="85" y="150" font-size="12" font-weight="700" text-anchor="middle" fill="#222">${r1(lvl * max)} bar</text>`;
  if (d.cfg.drain) s += `<path d="M150 145H164" stroke="#8f979c" stroke-width="3"/><text class="ar" x="164" y="138" font-size="8" text-anchor="end" fill="var(--muted)">usage</text>`;
  s += `<text class="ar" x="85" y="200" font-size="9" text-anchor="middle" fill="var(--muted)">${d.cfg.pump} pumps air into the tank</text>`;
  return {svg:s, hit:'', terms:{}};
}
function benchLevel(d, ctx){
  const press = d.cfg.look === 'press', thermo = d.cfg.look === 'thermo', linked = !!d.cfg.tank, w = CW, max = d.cfg.max || 10;
  const tank = linked && ctx.byId ? ctx.byId[d.cfg.tank] : null;
  const lvl = tank ? tank.st.lvl : (d.st.a ? 1 : 0);
  let s = cellHead(d, d.cfg.label || (press ? 'pressure switch' : thermo ? 'thermostat' : 'float switch'), w);
  if (thermo){
    s += `<rect x="40" y="26" width="90" height="62" rx="6" fill="#f1f1ec" stroke="#8f8f88"/><circle cx="85" cy="52" r="18" fill="#fff" stroke="#8f8f88"/><g transform="rotate(${-135 + 270 * (d.cfg.at == null ? 0.6 : d.cfg.at)} 85 52)"><path d="M85 52V38" stroke="#d32f2f" stroke-width="2.5" stroke-linecap="round"/></g><circle cx="85" cy="52" r="3" fill="#333"/>`;
    s += `<text x="85" y="82" font-size="7.5" fill="${d.st.a ? GOOD : '#555'}" text-anchor="middle" font-weight="700">${d.st.a ? 'calling for cooling ✓' : 'temperature satisfied'}</text><text x="50" y="36" font-size="7" fill="#222">${Math.round((d.cfg.at == null ? 0.6 : d.cfg.at) * max)}°C</text>`;
  } else if (press){
    s += `<rect x="40" y="26" width="90" height="56" rx="5" fill="#e9eaec" stroke="#7d8388"/><rect x="48" y="32" width="36" height="18" rx="3" fill="#1f6fd1"/><text x="66" y="44" font-size="7" fill="#fff" text-anchor="middle">RANGE</text><rect x="92" y="32" width="30" height="18" rx="3" fill="#d32f2f"/><text x="107" y="44" font-size="7" fill="#fff" text-anchor="middle">DIFF</text>`;
    s += `<text x="85" y="66" font-size="8" fill="#222" text-anchor="middle">${d.cfg.below ? r1(d.cfg.at * max) + ' → ' + r1((d.cfg.at + (d.cfg.hyst || 0)) * max) : r1((d.cfg.at - (d.cfg.hyst || 0)) * max) + ' ← ' + r1(d.cfg.at * max)} bar</text><text x="85" y="77" font-size="7.5" fill="${d.st.a ? (d.cfg.below ? CAPRED : GOOD) : '#555'}" text-anchor="middle" font-weight="700">${d.st.a ? (d.cfg.below ? 'low pressure: reached ✗' : 'reached cut-out ✓') : (d.cfg.below ? 'pressure OK' : 'below setting')}</text>`;
    s += `<rect x="80" y="82" width="10" height="12" fill="#8f979c"/>`;
  } else {
    const wy = 82 - 48 * clamp(lvl, 0, 1);
    s += `<rect x="50" y="30" width="70" height="56" rx="4" fill="none" stroke="var(--ink)" stroke-width="1.5"/><rect x="52" y="${wy}" width="66" height="${84 - wy}" fill="#4ea0ff" opacity=".7"/>`;
    s += `<path d="M85 22V${d.st.a ? 44 : 56}" stroke="#222" stroke-width="1.8"/><g transform="rotate(${d.st.a ? -55 : 50} 85 ${d.st.a ? 44 : 56})"><ellipse cx="85" cy="${d.st.a ? 58 : 70}" rx="7" ry="13" fill="#1f6fd1" stroke="#0f3e7a"/></g>`;
    s += `<path d="M46 ${82 - 48 * d.cfg.at}H124" stroke="var(--bad)" stroke-width="1.2" stroke-dasharray="3 2"/><text x="128" y="${86 - 48 * d.cfg.at}" font-size="7" fill="var(--bad)">${Math.round(d.cfg.at * 100)}%</text>`;
    s += `<text class="ar" x="85" y="98" font-size="8.5" text-anchor="middle" fill="${d.st.a ? GOOD : 'var(--muted)'}" font-weight="700">${d.st.a ? 'floating (reached)' : 'hanging'}</text>`;
  }
  const B = benchBlocks(d, 85, () => !!d.st.a, ctx.live); s += B.svg;
  return {svg:s, hit:linked ? '' : `<rect class="ba" data-dev="${d.id}" data-act="latchA" x="30" y="22" width="110" height="80" tabindex="0" role="button" aria-label="${press ? 'Pressure up / down' : thermo ? 'Temperature up / down' : 'Level up / down'}"/>`, terms:B.terms};
}

// ---------- automatic schematic: control ladder + power circuit derived from ex.solution and ex.devices ----------
// CL.art.schematic(ex) → SVG string(s). The control circuit is series-parallel reduced from the wire graph between the
// supply rails (L/N, L1/N or +24V/0V); the power circuit is drawn per motor from the supply through Q1 / contactors / overload.
(function(){
  const SW = 78, SH = 56, PAD = 10; // element cell width / rung height
  const ELX = ['sy'];
  const ar = (x, y, t, o) => `<text class="sc-l${o && o.c ? ' ' + o.c : ''}" x="${x}" y="${y}" text-anchor="${o && o.anc || 'middle'}" font-size="${o && o.sz || 10}">${esc(t)}</text>`;
  // --- element graph ---------------------------------------------------------------------------------------------
  function elementsOf(d){ // 2-terminal control elements of a device: contacts, loads, protective poles
    const T = TYPES[d.type], out = [], tag = d.tag;
    const c = (a, b, k, lab, opt) => out.push(Object.assign({dev:d, a:d.id + ':' + a, b:d.id + ':' + b, k, lab, tag}, opt || {}));
    if (d.type === 'mcb' || d.type === 'fuse'){ if (d.cfg.poles === 1) c('1', '2', d.type === 'fuse' ? 'fuse' : 'cb', '1-2'); return out; }
    if (d.type === 'timer'){
      const sd = d.cfg.mode === 'sd', dl = d.cfg.mode === 'off' ? 'tof' : d.cfg.mode === 'cyc' ? 'cyc' : 'ton';
      c('A1', 'A2', 'coil', 'A1-A2', {kind:'timer'});
      if (sd){ c('17', '18', 'NC', '17-18', {timed:dl}); c('17', '28', 'NO', '17-28', {timed:dl}); } else { c('15', '16', 'NC', '15-16', {timed:dl}); c('15', '18', 'NO', '15-18', {timed:dl}); }
      if (d.cfg.inst){ c('21', '22', 'NC', '21-22'); c('21', '24', 'NO', '21-24'); }
      return out;
    }
    if (d.type === 'ol'){ c('95', '96', 'NC', '95-96', {th:1}); c('97', '98', 'NO', '97-98', {th:1}); return out; }
    if (d.type === 'mpcb'){ if (d.cfg.aux){ c('13', '14', 'NO', '13-14'); c('21', '22', 'NC', '21-22'); } return out; }
    if (d.type === 'prox'){ c('BN', 'BU', 'sensor', 'BN-BU'); c(d.cfg.pnp ? 'BN' : 'BU', 'BK', d.cfg.nc ? 'NC' : 'NO', 'BK', {px:(d.cfg.pnp ? 'PNP' : 'NPN')}); return out; }
    if (d.type === 'lamp'){ c('X1', 'X2', 'lamp', 'X1-X2', {color:d.cfg.color}); return out; }
    if (d.type === 'xfmr'){ c('H1', 'H2', 'coil', 'H1-H2 (230V)', {kind:'xfmr'}); return out; }
    if (d.type === 'rectifier'){ c('AC1', 'AC2', 'coil', 'AC1-AC2', {kind:'rect'}); return out; }
    if (d.type === 'brake'){ c('A1', 'A2', 'coil', 'A1-A2 brake', {kind:'brake'}); return out; }
    if (d.type === 'softstarter'){ c('A1', 'A2', 'coil', 'A1-A2 supply', {kind:'ss'}); c('IN1', 'A2', 'coil', 'IN1 RUN', {kind:'in'}); c('IN2', 'A2', 'coil', 'IN2 STOP', {kind:'in'}); c('13', '14', 'NO', '13-14 bypass'); c('23', '24', 'NO', '23-24 run'); c('95', '96', 'NC', '95-96 fault'); c('97', '98', 'NO', '97-98 fault'); return out; }
    if (T.loads && (d.type === 'relay' || d.type === 'contactor')) c('A1', 'A2', 'coil', 'A1-A2', {kind:d.type});
    (d.blocks || []).forEach(b => {
      const who = d.type === 'sel' ? (b.on || []).map(i => d.cfg.pos[i]).join('/') : '';
      if (b.k === 'CO'){ c(b.t[0], b.t[1], 'NC', b.t[0] + '-' + b.t[1], {who}); c(b.t[0], b.t[2], 'NO', b.t[0] + '-' + b.t[2], {who}); }
      else c(b.t[0], b.t[1], b.k, b.t[0] + '-' + b.t[1], {who, act:d.type});
    });
    return out;
  }
  function graph(devs, wires, powerOnly){
    const byId = {}; devs.forEach(d => { byId[d.id] = d; });
    const par = new Map(); const find = x => { if (!par.has(x)) par.set(x, x); let r = x; while (par.get(r) !== r) r = par.get(r); let y = x; while (par.get(y) !== r){ const n = par.get(y); par.set(y, r); y = n; } return r; };
    const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) par.set(ra, rb); };
    const deg = {}; const bump = n => { deg[n] = (deg[n] || 0) + 1; };
    wires.forEach(w => { const pw = CL.isPowerWire(w, byId); if (powerOnly ? pw : !pw){ union(w[0], w[1]); bump(w[0]); bump(w[1]); } });
    devs.forEach(d => { if (d.type === 'tb') TYPES.tb.links(d).forEach(([x, y]) => union(d.id + ':' + x, d.id + ':' + y)); });
    return {byId, find, union, deg};
  }
  // --- series-parallel reduction ----------------------------------------------------------------------------------
  function reduce(edges, src, snk){
    let E = edges.map(e => ({a:e.a, b:e.b, el:e.el}));
    const ser = (x, y) => ({t:'ser', items:[].concat(x.t === 'ser' ? x.items : [x], y.t === 'ser' ? y.items : [y])});
    const flip = x => x.t === 'ser' ? {t:'ser', items:x.items.slice().reverse().map(flip)} : x.t === 'par' ? {t:'par', items:x.items.map(flip)} : x;
    for (let guard = 0; guard < 400; guard++){
      let ch = false;
      // dangling: a non-rail node of degree 1 → drop its edge (incomplete wiring)
      const deg = {}; E.forEach(e => { deg[e.a] = (deg[e.a] || 0) + 1; deg[e.b] = (deg[e.b] || 0) + 1; });
      const dang = E.findIndex(e => (e.a !== src && e.a !== snk && deg[e.a] === 1) || (e.b !== src && e.b !== snk && deg[e.b] === 1));
      if (dang > -1){ E.splice(dang, 1); ch = true; continue; }
      // parallel
      const key = e => e.a < e.b ? e.a + '|' + e.b : e.b + '|' + e.a; const groups = {};
      E.forEach(e => { (groups[key(e)] = groups[key(e)] || []).push(e); });
      for (const k of Object.keys(groups)){ const g = groups[k]; if (g.length > 1){ const a = g[0].a, b = g[0].b; const items = g.map(e => e.a === a ? e.el : flip(e.el)); E = E.filter(e => g.indexOf(e) < 0); E.push({a, b, el:{t:'par', items}}); ch = true; } }
      if (ch) continue;
      // series through a degree-2 non-rail node
      const d2 = Object.keys(deg).find(n => n !== src && n !== snk && deg[n] === 2);
      if (d2){ const [e1, e2] = E.filter(e => e.a === d2 || e.b === d2); if (e1 && e2 && e1 !== e2){ const x = e1.a === d2 ? e1.b : e1.a, y = e2.a === d2 ? e2.b : e2.a; const i1 = e1.a === x ? e1.el : flip(e1.el), i2 = e2.a === d2 ? e2.el : flip(e2.el); E = E.filter(e => e !== e1 && e !== e2); E.push({a:x, b:y, el:ser(i1, i2)}); ch = true; } }
      if (!ch) break;
    }
    return E.map(e => e.a === src || e.b === snk || (e.a !== snk && e.b !== src) ? e : {a:e.b, b:e.a, el:flip(e.el)});
  }
  // --- measuring & drawing composites ------------------------------------------------------------------------------
  const size = x => { if (x.t === 'ser'){ const s = x.items.map(size); return {w:s.reduce((a, b) => a + b.w, 0), h:Math.max(...s.map(b => b.h)), top:Math.max(...s.map(b => b.top))}; }
    if (x.t === 'par'){ const s = x.items.map(size); return {w:Math.max(...s.map(b => b.w)) + 24, h:s.reduce((a, b) => a + b.h, 0), top:s[0].top}; }
    return {w:SW, h:SH, top:SH / 2}; };
  function leaf(e, x, y){ // element centred at (x + SW/2, y); wire from x to x + SW
    const cx = x + SW / 2, el = e, k = el.k; let s = '';
    const line = (x1, x2) => `<path class="sc" d="M${x1} ${y}H${x2}"/>`;
    const tagT = ar(cx, y - 17, el.tag + (el.who ? ' (' + el.who + ')' : ''), {c:'sc-tag', sz:11});
    if (k === 'NO' || k === 'NC'){
      s += line(x, cx - 16) + line(cx + 16, x + SW);
      if (k === 'NO') s += `<path class="sc" d="M${cx - 16} ${y}L${cx + 14} ${y - 13}"/>`;
      else s += `<path class="sc" d="M${cx - 16} ${y}L${cx + 14} ${y - 13}M${cx + 16} ${y - 14}V${y + 2}"/>`;
      if (el.timed){ const up = el.timed === 'ton'; s += `<path class="sc" d="M${cx - 7} ${y + (up ? 8 : 14)}A7 7 0 0 ${up ? 0 : 1} ${cx + 7} ${y + (up ? 8 : 14)}" style="stroke-width:1.6"/>`; }
      if (el.th) s += `<path class="sc" d="M${cx - 2} ${y + 6}h6v5h-6" style="stroke-width:1.6"/>`;
      if (el.act === 'ls' || el.act === 'level' || el.act === 'prox') s += `<path class="sc-f" d="M${cx - 24} ${y - 10}l-7 5l7 5z"/>`;
      if (el.act === 'pb' || el.act === 'estop') s += `<path class="sc" d="M${cx - 2} ${y - 22}V${y - 30}M${cx - 10} ${y - 30}H${cx + 6}" style="stroke-width:1.6"/>`;
      if (el.act === 'sel') s += `<path class="sc" d="M${cx - 2} ${y - 22}V${y - 30}M${cx - 10} ${y - 30}H${cx + 6}M${cx - 2} ${y - 34}V${y - 30}" style="stroke-width:1.6"/>`;
      s += tagT + ar(cx, y + 24, el.lab + ' ' + (el.px ? el.px + ' ' : '') + k + (el.timed ? ' ⏱' : ''), {sz:9.5});
    } else if (k === 'coil'){
      s += line(x, cx - 14) + line(cx + 14, x + SW) + `<rect class="sc" x="${cx - 14}" y="${y - 10}" width="28" height="20"/>` + (el.kind === 'timer' ? `<path class="sc" d="M${cx - 6} ${y - 4}h12M${cx - 6} ${y + 4}h12" style="stroke-width:1.4"/>` : el.kind === 'xfmr' ? `<circle class="sc" cx="${cx - 4}" cy="${y}" r="5" style="stroke-width:1.4"/><circle class="sc" cx="${cx + 4}" cy="${y}" r="5" style="stroke-width:1.4"/>` : el.kind === 'rect' ? `<path class="sc" d="M${cx - 14} ${y + 10}L${cx + 14} ${y - 10}" style="stroke-width:1.4"/>` : el.kind === 'brake' ? `<path class="sc" d="M${cx - 8} ${y - 5}v10M${cx + 8} ${y - 5}v10" style="stroke-width:1.4"/>` : el.kind === 'ss' || el.kind === 'in' ? `<path class="sc" d="M${cx - 10} ${y + 6}L${cx + 10} ${y - 6}" style="stroke-width:1.4"/>` : '') + tagT + ar(cx, y + 24, el.lab + (el.kind === 'timer' ? ' ⏱' : ''), {sz:9.5});
    } else if (k === 'lamp'){
      s += line(x, cx - 11) + line(cx + 11, x + SW) + `<circle class="sc" cx="${cx}" cy="${y}" r="11"/><path class="sc" d="M${cx - 7} ${y - 7}L${cx + 7} ${y + 7}M${cx + 7} ${y - 7}L${cx - 7} ${y + 7}" style="stroke-width:1.6"/>` + tagT + ar(cx, y + 24, el.lab, {sz:9.5});
    } else if (k === 'sensor'){
      s += line(x, cx - 16) + line(cx + 16, x + SW) + `<path class="sc" d="M${cx - 16} ${y - 10}h32v20h-32zM${cx - 16} ${y - 10}l10 20M${cx + 6} ${y - 10}l10 20"/>` + tagT + ar(cx, y + 24, 'BN-BU supply', {sz:9.5});
    } else if (k === 'fuse' || k === 'cb'){
      s += line(x, cx - 14) + line(cx + 14, x + SW);
      if (k === 'fuse') s += `<rect class="sc" x="${cx - 14}" y="${y - 7}" width="28" height="14"/>`; else s += `<path class="sc" d="M${cx - 14} ${y}L${cx + 10} ${y - 13}M${cx + 14} ${y - 6}l-5 -5l5 -5"/>`;
      s += tagT + ar(cx, y + 24, el.lab, {sz:9.5});
    } else s += line(x, x + SW);
    return s;
  }
  function draw(x, X, Y, W){ // draw composite x with its centre line at Y, from X to X + W (pads with wire)
    const sz = size(x); let s = '';
    if (x.t === 'ser'){ const sizes = x.items.map(size), extra = (W - sz.w) / x.items.length; let cx = X; x.items.forEach((it, i) => { const w = sizes[i].w + extra; s += draw(it, cx, Y, w); cx += w; }); return s; }
    if (x.t === 'par'){
      const sizes = x.items.map(size), inner = W - 24; let y = Y - sizes[0].top, lastY = Y; const x1 = X + 12, x2 = X + W - 12;
      x.items.forEach((it, i) => { const cy = y + sizes[i].top; s += draw(it, x1, cy, inner); lastY = cy; y += sizes[i].h; });
      s += `<path class="sc" d="M${X} ${Y}H${x1}M${x2} ${Y}H${X + W}M${x1} ${Y}V${lastY}M${x2} ${Y}V${lastY}"/>`;
      x.items.forEach((_, i) => { if (i){ } });
      return s;
    }
    const pad = (W - SW) / 2; return `<path class="sc" d="M${X} ${Y}H${X + pad}M${X + pad + SW} ${Y}H${X + W}"/>` + leaf(x, X + pad, Y);
  }
  // --- control ladder(s) -------------------------------------------------------------------------------------------
  function controlSvgs(devs, wires){
    const g = graph(devs, wires, false), out = [];
    const els = []; devs.forEach(d => elementsOf(d).forEach(e => { const da = g.deg[e.a] || 0, db = g.deg[e.b] || 0; if (da && db) els.push(e); }));
    const rails = []; devs.forEach(d => { if (d.type === 'xfmr') rails.push({d, L:'X1', N:'X2', lL:d.tag + ' X1 (' + d.cfg.vs + 'V)', lN:d.tag + ' X2 (0V)'}); if (d.type === 'supply3P') rails.push({d, L:'L1', N:'N', lL:d.tag + ' L1', lN:d.tag + ' N'}); if (d.type === 'supplyAC') rails.push({d, L:'L', N:'N', lL:d.tag + ' L', lN:d.tag + ' N'}); if (d.type === 'supplyDC') rails.push({d, L:'P24', N:'0V', lL:d.tag + ' +24V', lN:d.tag + ' 0V'}); });
    const tbs = devs.filter(d => d.type === 'tb').map(d => d.tag);
    rails.forEach(r => {
      const src = g.find(r.d.id + ':' + r.L), snk = g.find(r.d.id + ':' + r.N); if (src === snk) return;
      const edges = els.map(e => ({a:g.find(e.a), b:g.find(e.b), el:e})).filter(e => e.a !== e.b);
      if (!edges.length || !edges.some(e => e.a === src || e.b === src)) return;
      let E = reduce(edges, src, snk); if (!E.length) return;
      if (E.length > 1){ const sc = e => (e.a === src || e.b === src) ? 0 : (e.a === snk || e.b === snk) ? 2 : 1; E = E.map((e, i) => ({e, i})).sort((x, y) => sc(x.e) - sc(y.e) || x.i - y.i).map(x => x.e); }
      let s = '', y = 36, maxW = 0, nodeLab = {}, nl = 0;
      const lab = n => n === src ? r.lL : n === snk ? r.lN : (nodeLab[n] = nodeLab[n] || String.fromCharCode(0x2460 + (nl++)));
      const rows = E.map(e => { const sz = size(e.el); return {e, sz}; });
      const W = Math.max(...rows.map(x => x.sz.w)) + 40; maxW = W + 140;
      rows.forEach(({e, sz}) => { const Y = y + sz.top; s += draw(e.el, 70, Y, W); s += `<path class="sc sc-rail" d="M70 ${Y - 10}V${Y + 10}M${70 + W} ${Y - 10}V${Y + 10}"/>`; s += ar(62, Y + 4, lab(e.a), {anc:'end', c:'sc-tag', sz:11}) + ar(78 + W, Y + 4, lab(e.b), {anc:'start', c:'sc-tag', sz:11}); y += sz.h + 12; });
      const H = y + 8, single = E.length === 1;
      let head = `<svg class="schem" viewBox="0 0 ${maxW} ${H}" role="img" aria-label="Control circuit diagram"><g style="color:var(--sym)">`;
      if (single){ head += `<path class="sc sc-rail" d="M70 20V${H - 8}M${70 + W} 20V${H - 8}"/>`; }
      s = head + s + (tbs.length ? ar(maxW / 2, H - 2, 'Branches spread over ' + tbs.join(', ') + ' (L bar and N bar)', {sz:9, c:'sc-note'}) : '') + '</g></svg>';
      out.push({svg:s, nonSP:!single, w:maxW, h:H});
    });
    return out;
  }
  // --- power circuit per motor ----------------------------------------------------------------------------------------
  function powerSvg(devs, wires){
    const g = graph(devs, wires, true), byId = g.byId;
    const motors = devs.filter(d => TYPES[d.type].motor); if (!motors.length) return '';
    const sup = devs.find(d => d.type === 'supply3P' || d.type === 'supplyAC'); if (!sup) return '';
    const ph = sup.type === 'supply3P' ? ['L1','L2','L3'] : ['L','N'];
    const phaseOf = {}; ph.forEach(p => { phaseOf[g.find(sup.id + ':' + p)] = p; });
    const poleDevs = devs.filter(d => (d.type === 'mcb' || d.type === 'fuse') && d.cfg.poles >= 3 || d.type === 'contactor' || d.type === 'ol' || d.type === 'mpcb' || d.type === 'softstarter');
    const polesOf = d => d.type === 'softstarter' ? [['L1','T1'],['L2','T2'],['L3','T3']] : d.type === 'contactor' || d.type === 'ol' || d.type === 'mpcb' ? [['1','2'],['3','4'],['5','6']] : Array.from({length:d.cfg.poles}, (_, i) => [String(2*i+1), String(2*i+2)]);
    // adjacency through poles: node(top) → node(bottom)
    const down = {}; poleDevs.forEach(d => polesOf(d).forEach(([t, b]) => { const nt = g.find(d.id + ':' + t), nb = g.find(d.id + ':' + b); if (g.deg[d.id + ':' + t] && g.deg[d.id + ':' + b]){ (down[nt] = down[nt] || []).push({d, t, b, nb}); } }));
    const depth = {}; Object.keys(phaseOf).forEach(n => { depth[n] = 0; });
    const q = Object.keys(phaseOf); while (q.length){ const n = q.shift(); (down[n] || []).forEach(p => { const dd = depth[n] + 1; if (depth[p.nb] == null || depth[p.nb] < dd){ depth[p.nb] = dd; q.push(p.nb); } }); }
    const devDepth = {}; poleDevs.forEach(d => { polesOf(d).forEach(([t]) => { const n = g.find(d.id + ':' + t); if (depth[n] != null) devDepth[d.id] = Math.max(devDepth[d.id] || 0, depth[n] + 1); }); });
    // which devices reach which motor (upstream walk from motor terminals)
    const up = {}; poleDevs.forEach(d => polesOf(d).forEach(([t, b]) => { const nb = g.find(d.id + ':' + b); (up[nb] = up[nb] || []).push({d, t}); }));
    const svgs = [];
    motors.forEach(m => {
      const terms = TYPES.motor.terms(m).map(t => t.n), reach = new Set(), seen = new Set();
      const walk = n => { if (seen.has(n)) return; seen.add(n); (up[n] || []).forEach(({d, t}) => { reach.add(d.id); walk(g.find(d.id + ':' + t)); }); };
      terms.forEach(t => walk(g.find(m.id + ':' + t)));
      const stages = {}; reach.forEach(id => { const k = devDepth[id] || 1; (stages[k] = stages[k] || []).push(byId[id]); });
      const ks = Object.keys(stages).map(Number).sort((a, b) => a - b);
      const PW = 26, DW = d => polesOf(d).length * PW + 12, GAP = 14, ROW = 78;
      const stageW = ks.map(k => stages[k].reduce((a, d) => a + DW(d) + GAP, 0) - GAP);
      const W = Math.max(ph.length * PW + 12, ...stageW, 150) + 40, H = 60 + ks.length * ROW + 96;
      let s = `<svg class="schem" viewBox="0 0 ${W} ${H}" role="img" aria-label="Power circuit diagram ${esc(m.tag)}"><g style="color:var(--sym)">`;
      // supply bar
      const pos = {}; // node → x of a terminal already drawn (for lines)
      const sx = (W - (ph.length * PW)) / 2 + PW / 2;
      ph.forEach((p, i) => { const x = sx + i * PW; s += `<path class="sc" d="M${x} 18V40"/>` + ar(x, 14, p, {c:'sc-tag', sz:10}); pos[g.find(sup.id + ':' + p)] = x; });
      s += ar(W - 4, 14, sup.tag, {anc:'end', sz:9});
      let y = 40;
      ks.forEach((k, si) => {
        const list = stages[k]; let x = (W - stageW[si]) / 2; const npos = {};
        list.forEach(d => { const P = polesOf(d), w = DW(d);
          s += `<rect class="sc" x="${x}" y="${y + 18}" width="${w}" height="34" rx="3" style="stroke-width:1.4"/>` + ar(x + w + 4, y + 30, d.tag, {anc:'start', c:'sc-tag', sz:10.5});
          P.forEach(([t, b], i) => { const px = x + 6 + PW / 2 + i * PW, nt = g.find(d.id + ':' + t), nb = g.find(d.id + ':' + b);
            if (!g.deg[d.id + ':' + t] && !g.deg[d.id + ':' + b]) return;
            // line from the upstream terminal
            if (pos[nt] != null) s += `<path class="sc" d="M${pos[nt]} ${y}L${px} ${y + 18}"/>`;
            if (d.type === 'contactor') s += `<path class="sc" d="M${px} ${y + 18}V${y + 28}L${px + 8} ${y + 42}M${px} ${y + 52}V${y + 44}"/><path class="sc" d="M${px - 5} ${y + 30}A5 5 0 0 1 ${px + 5} ${y + 30}" style="stroke-width:1.4"/>`;
            else if (d.type === 'ol') s += `<path class="sc" d="M${px} ${y + 18}V${y + 28}M${px - 4} ${y + 28}h8v14h-8zM${px} ${y + 42}V${y + 52}" style="stroke-width:1.6"/>`;
            else if (d.type === 'fuse') s += `<path class="sc" d="M${px} ${y + 18}V${y + 52}M${px - 4} ${y + 26}h8v18h-8z" style="stroke-width:1.6"/>`;
            else if (d.type === 'softstarter') s += `<path class="sc" d="M${px} ${y + 18}V${y + 26}M${px} ${y + 44}V${y + 52}M${px - 6} ${y + 26}h12v18h-12zM${px - 6} ${y + 44}L${px + 6} ${y + 26}" style="stroke-width:1.4"/>`;
            else s += `<path class="sc" d="M${px} ${y + 18}V${y + 28}L${px + 8} ${y + 42}M${px} ${y + 52}V${y + 44}M${px + 4} ${y + 24}l-5 -5l5 -5" style="stroke-width:1.6"/>`;
            s += ar(px, y + 62, t + '/' + b, {sz:7.5});
            npos[nb] = px; });
          x += w + GAP; });
        Object.assign(pos, npos); y += ROW;
      });
      // motor
      const six = m.cfg.term === 6, mw = six ? 3 * PW + 12 : terms.length * PW + 12, mx = (W - mw) / 2;
      const tpos = {}; const rowA = six ? ['U1','V1','W1'] : terms, rowB = six ? ['W2','U2','V2'] : [];
      rowA.forEach((t, i) => { const px = mx + 6 + PW / 2 + i * PW, n = g.find(m.id + ':' + t); tpos[t] = px; if (pos[n] != null) s += `<path class="sc" d="M${pos[n]} ${y}L${px} ${y + 16}"/>`; s += `<circle class="sc-t" cx="${px}" cy="${y + 18}" r="3"/>` + ar(px, y + 30, t, {sz:8}); });
      rowB.forEach((t, i) => { const px = mx + 6 + PW / 2 + i * PW; tpos[t] = px; s += `<circle class="sc-t" cx="${px}" cy="${y + 44}" r="3"/>` + ar(px, y + 56, t, {sz:8}); });
      if (six){ // bridges = wires between motor terminals
        const ty = t => rowA.indexOf(t) > -1 ? y + 18 : y + 44;
        wires.forEach(w => { const [a, ta] = w[0].split(':'), [b, tb] = w[1].split(':'); if (a === m.id && b === m.id) s += `<path class="sc sc-br" d="M${tpos[ta]} ${ty(ta)}L${tpos[tb]} ${ty(tb)}"/>`; });
      }
      s += `<circle class="sc" cx="${W / 2}" cy="${y + (six ? 78 : 56)}" r="16"/>` + ar(W / 2, y + (six ? 83 : 61), 'M 3~', {sz:9}) + ar(W / 2 + 22, y + (six ? 83 : 61), m.tag, {anc:'start', c:'sc-tag', sz:10.5});
      s += `<path class="sc" d="M${W / 2} ${y + (six ? 44 : 18) + 6}V${y + (six ? 62 : 40)}"/>`;
      svgs.push(s + '</g></svg>');
    });
    return svgs.join('');
  }
  CL.art.schematic = function(ex, devsIn){
    const devs = devsIn || ex.devices.map(CL.makeDevice), wires = ex.solution || [];
    const ttl = esc((ex.id ? ex.id + ' · ' : '') + (ex.title || '')), tag = `<title>${ttl}</title>`;
    const stamp = svg => svg.replace(/<svg([^>]*)>/g, (m, a) => { const vb = /viewBox="0 0 (\S+) (\S+)"/.exec(a); const k = vb && vb[1] > 560 ? 1.2 : 1.45, wide = vb && vb[1] * k > 600; return `<svg${a.replace('class="schem"', 'class="schem' + (wide ? ' sc-wide' : '') + '"')}${vb ? ` width="${Math.round(vb[1] * k)}" height="${Math.round(vb[2] * k)}"` : ''} data-schem="${esc(ex.id || '')}">${tag}`; });
    const ctl = controlSvgs(devs, wires).map(c => ({...c, svg:stamp(c.svg)})), pw = stamp(powerSvg(devs, wires));
    return {control:ctl.map(c => c.svg).join(''), power:pw, nonSP:ctl.some(c => c.nonSP), html:`<div class="schem-wrap"><div class="schem-title">${ttl}</div>${pw ? `<div class="schem-pw"><b>Power circuit</b>${pw}</div>` : ''}<div class="schem-ctl"><b>Control circuit</b>${ctl.map(c => c.svg).join('') || '<p class="muted">This exercise has no control circuit.</p>'}</div></div>`};
  };
})();

// ---------- task card: title / goal / idea / steps / collapsible wire table (from ex.solution) ----------
// ex.goal (1 line), ex.idea (1–2 lines), ex.steps = {power:[…], control:[…]} or […] (plain sentences, no terminal pairs).
// ex.task stays as a fallback for exercises that have no structured text yet.
const POWER_TERM = /^([1-6]|L[123]|N|PE|T[123]|[UVW][12]?)$/;
CL.isPowerWire = (w, byId) => w.every(t => { const [id, n] = t.split(':'); const d = byId[id]; if (!d) return false; const T = TYPES[d.type]; const z = T.zone || ((d.type === 'mcb' || d.type === 'fuse') && d.cfg.poles >= 3 ? 'P' : 'C'); return z === 'P' && POWER_TERM.test(n); });
CL.wireTable = (ex, devs) => {
  const sol = ex.solution || []; if (!sol.length) return '';
  const byId = {}; devs.forEach(d => { byId[d.id] = d; });
  const name = id => { const d = byId[id]; return d && d.name ? ` <span class="muted">${esc(d.name)}</span>` : ''; };
  const row = w => `<tr><td><span class="mono">${esc(w[0])}</span>${name(w[0].split(':')[0])}</td><td><span class="mono">${esc(w[1])}</span>${name(w[1].split(':')[0])}</td></tr>`;
  const pw = sol.filter(w => CL.isPowerWire(w, byId)), cw = sol.filter(w => !CL.isPowerWire(w, byId));
  const tbl = (cap, ws) => ws.length ? `<table class="bn-wt"><caption>${cap} <span class="muted">(${ws.length} wires)</span></caption><thead><tr><th>From</th><th>To</th></tr></thead><tbody>${ws.map(row).join('')}</tbody></table>` : '';
  const strip = devs.some(d => d.type === 'tb');
  return `<details class="bn-wires"><summary>Full wiring list ▾</summary>${pw.length && cw.length ? tbl('Power circuit', pw) + tbl('Control circuit', cw) : tbl('Connections', sol)}<p class="note">Each terminal (screw) takes only two wires${strip ? '; spread them over the terminal block screws' : ''}. ${ex.tip && (ex.tip.match(/→/g) || []).length > 2 ? '<br>' + ex.tip : ''}</p></details>`;
};
CL.taskCard = (ex, devs) => {
  let s = `<div class="bn-task"><h3>${esc(ex.title)}</h3>${ex.preset ? '<span class="bn-badge">This board is already wired: find the mistake</span>' : ''}${CL.storyCard ? CL.storyCard(ex) : ''}`;
  if (ex.solution && ex.solution.length){ let sc = ''; try { sc = CL.art.schematic(ex, devs).html; } catch (e) { sc = ''; } if (sc) s += `<details class="bn-schem"${typeof matchMedia === 'function' && matchMedia('(min-width: 760px)').matches ? ' open' : ''}><summary>Circuit diagram ▾ <span class="muted">(drawn from this exercise's solution)</span></summary>${sc}</details>`; }
  if (ex.goal || ex.steps){
    if (ex.goal) s += `<p class="bn-goal"><b>Goal:</b> ${ex.goal}</p>`;
    if (ex.idea) s += `<p class="bn-idea"><b>The idea:</b> ${ex.idea}</p>`;
    const ol = a => `<ol>${a.map(x => `<li>${x}</li>`).join('')}</ol>`;
    if (ex.tip && (ex.tip.match(/→/g) || []).length <= 2) s += `<p class="tip">${ex.tip}</p>`;
  } else { s += `<p>${ex.task || ''}</p>${ex.tip ? `<p class="tip">${ex.tip}</p>` : ''}`; }
  s += CL.wireTable(ex, devs) + `</div>`; return s;
};

const BENCH = {pb:benchPb, estop:benchPb, sel:benchSel, ls:benchLs, lamp:benchLamp, supplyAC:benchSupply, supplyDC:benchSupply, supply3P:benchSupply, relay:benchRelay, contactor:benchContactor, timer:benchTimer, prox:benchProx, tank:benchTank, level:benchLevel};
function benchDraw(d, ctx){ const T = TYPES[d.type]; const r = T.bench ? T.bench(d, ctx) : (BENCH[d.type] || benchGeneric)(d, ctx); return SKIN.apply(d, ctx, r); }
/* @skin-photo: photo-real bench devices (img/<key>.webp rendered in 3D). The drawn SVG stays as the “drawing” skin and as the fallback.
   The engine's own texts (terminal numbers, NO/NC captions, live readouts) and its hit targets are kept on top of the photo; the
   terminal points come from the render (devices.json, 1x cell px) so the screw you click is the screw you see. */
const SKIN = CL.skin = (function(){
  // English copy: the photo skin images are shared with the Arabic course
  const BASE = '/classic-control-lab/';
  const IT = {"brake-off":[170,208,{"A1":[55.0,60.8],"A2":[115.0,60.8]}],"brake-on":[170,208,{"A1":[55.0,60.8],"A2":[115.0,60.8]}],"contactor-n1-off":[170,208,{"1":[58.7,66.6],"3":[84.9,66.4],"5":[112.4,66.0],"2":[61.4,175.1],"4":[91.0,174.9],"6":[119.9,175.1],"A1":[16,62],"A2":[16,86],"13":[16,122],"14":[16,146]}],"contactor-n1-on":[170,208,{"1":[58.7,66.6],"3":[84.9,66.4],"5":[112.4,66.0],"2":[61.4,175.1],"4":[91.0,174.9],"6":[119.9,175.1],"A1":[16,62],"A2":[16,86],"13":[16,122],"14":[16,146]}],"contactor-n2-off":[170,208,{"1":[58.7,66.6],"3":[84.9,66.4],"5":[112.4,66.0],"2":[61.4,175.1],"4":[91.0,174.9],"6":[119.9,175.1],"A1":[16,58],"A2":[16,82],"13":[16,112],"14":[16,136],"21":[16,164],"22":[16,188]}],"contactor-n2-on":[170,208,{"1":[58.7,66.6],"3":[84.9,66.4],"5":[112.4,66.0],"2":[61.4,175.1],"4":[91.0,174.9],"6":[119.9,175.1],"A1":[16,58],"A2":[16,82],"13":[16,112],"14":[16,136],"21":[16,164],"22":[16,188]}],"contactor-n3-off":[170,258,{"1":[56.4,108.0],"3":[84.3,107.9],"5":[113.5,107.4],"2":[59.3,223.3],"4":[90.7,223.1],"6":[121.4,223.3],"A1":[16,56],"A2":[16,80],"13":[16,110],"14":[16,134],"21":[16,162],"22":[16,186],"33":[16,214],"34":[16,238]}],"contactor-n3-on":[170,258,{"1":[56.4,108.0],"3":[84.3,107.9],"5":[113.5,107.4],"2":[59.3,223.3],"4":[90.7,223.1],"6":[121.4,223.3],"A1":[16,56],"A2":[16,80],"13":[16,110],"14":[16,134],"21":[16,162],"22":[16,186],"33":[16,214],"34":[16,238]}],"contactor-s1-off":[340,208,{"1":[85.4,58.0],"3":[113.3,57.9],"5":[142.5,57.4],"2":[88.3,173.3],"4":[119.7,173.1],"6":[150.4,173.3],"A1":[36,62],"A2":[36,86],"13":[36,122],"14":[36,146]}],"contactor-s1-on":[340,208,{"1":[85.4,58.0],"3":[113.3,57.9],"5":[142.5,57.4],"2":[88.3,173.3],"4":[119.7,173.1],"6":[150.4,173.3],"A1":[36,62],"A2":[36,86],"13":[36,122],"14":[36,146]}],"contactor-s2-off":[340,208,{"1":[85.4,58.0],"3":[113.3,57.9],"5":[142.5,57.4],"2":[88.3,173.3],"4":[119.7,173.1],"6":[150.4,173.3],"A1":[36,58],"A2":[36,82],"13":[36,112],"14":[36,136],"21":[36,164],"22":[36,188]}],"contactor-s2-on":[340,208,{"1":[85.4,58.0],"3":[113.3,57.9],"5":[142.5,57.4],"2":[88.3,173.3],"4":[119.7,173.1],"6":[150.4,173.3],"A1":[36,58],"A2":[36,82],"13":[36,112],"14":[36,136],"21":[36,164],"22":[36,188]}],"contactor-s3-off":[340,258,{"1":[89.0,79.8],"3":[122.2,79.7],"5":[157.1,79.1],"2":[92.4,217.2],"4":[129.9,216.9],"6":[166.5,217.2],"A1":[36,56],"A2":[36,80],"13":[36,110],"14":[36,134],"21":[36,162],"22":[36,186],"33":[36,214],"34":[36,238]}],"contactor-s3-on":[340,258,{"1":[89.0,79.8],"3":[122.2,79.7],"5":[157.1,79.1],"2":[92.4,217.2],"4":[129.9,216.9],"6":[166.5,217.2],"A1":[36,56],"A2":[36,80],"13":[36,110],"14":[36,134],"21":[36,162],"22":[36,186],"33":[36,214],"34":[36,238]}],"contactor-w1-off":[340,208,{"1":[106.4,58.0],"3":[134.3,57.9],"5":[163.5,57.4],"2":[109.3,173.3],"4":[140.7,173.1],"6":[171.4,173.3],"A1":[36,58.01367890568754],"A2":[36,173.29949604031677],"13":[284,78.01367890568754],"14":[284,159.29949604031677]}],"contactor-w1-on":[340,208,{"1":[106.4,58.0],"3":[134.3,57.9],"5":[163.5,57.4],"2":[109.3,173.3],"4":[140.7,173.1],"6":[171.4,173.3],"A1":[36,58.01367890568754],"A2":[36,173.29949604031677],"13":[284,78.01367890568754],"14":[284,159.29949604031677]}],"contactor-w2-off":[340,208,{"1":[97.4,58.0],"3":[125.3,57.9],"5":[154.5,57.4],"2":[100.3,173.3],"4":[131.7,173.1],"6":[162.4,173.3],"A1":[36,58.01367890568754],"A2":[36,173.29949604031677],"13":[262,78.01367890568754],"14":[262,159.29949604031677],"21":[306,78.01367890568754],"22":[306,159.29949604031677]}],"contactor-w2-on":[340,208,{"1":[97.4,58.0],"3":[125.3,57.9],"5":[154.5,57.4],"2":[100.3,173.3],"4":[131.7,173.1],"6":[162.4,173.3],"A1":[36,58.01367890568754],"A2":[36,173.29949604031677],"13":[262,78.01367890568754],"14":[262,159.29949604031677],"21":[306,78.01367890568754],"22":[306,159.29949604031677]}],"contactor-w3-off":[340,258,{"1":[85.4,92.6],"3":[116.2,92.5],"5":[148.4,91.9],"2":[88.5,220.0],"4":[123.3,219.7],"6":[157.2,220.0],"A1":[36,92.6313894888409],"A2":[36,219.9820014398848],"13":[244,112.6313894888409],"14":[244,205.9820014398848],"21":[280,112.6313894888409],"22":[280,205.9820014398848],"33":[316,112.6313894888409],"34":[316,205.9820014398848]}],"contactor-w3-on":[340,258,{"1":[85.4,92.6],"3":[116.2,92.5],"5":[148.4,91.9],"2":[88.5,220.0],"4":[123.3,219.7],"6":[157.2,220.0],"A1":[36,92.6313894888409],"A2":[36,219.9820014398848],"13":[244,112.6313894888409],"14":[244,205.9820014398848],"21":[280,112.6313894888409],"22":[280,205.9820014398848],"33":[316,112.6313894888409],"34":[316,205.9820014398848]}],"estop-1-p":[170,224,{"11":[85.0,133.2],"12":[85.0,187.6]}],"estop-1-r":[170,224,{"11":[85.0,133.2],"12":[85.0,187.6]}],"estop-2-p":[170,224,{"11":[55.0,133.2],"12":[55.0,187.6],"23":[115.0,133.2],"24":[115.0,187.6]}],"estop-2-r":[170,224,{"11":[55.0,133.2],"12":[55.0,187.6],"23":[115.0,133.2],"24":[115.0,187.6]}],"fuse-1p-blown":[170,170,{"1":[85.0,43.5],"2":[85.0,134.8]}],"fuse-1p-ok":[170,170,{"1":[85.0,43.5],"2":[85.0,134.8]}],"fuse-3p-blown":[340,170,{"1":[116.0,43.5],"2":[116.0,134.8],"3":[170.0,43.5],"4":[170.0,134.8],"5":[224.0,43.5],"6":[224.0,134.8]}],"fuse-3p-ok":[340,170,{"1":[116.0,43.5],"2":[116.0,134.8],"3":[170.0,43.5],"4":[170.0,134.8],"5":[224.0,43.5],"6":[224.0,134.8]}],"lamp-amber-off":[170,208,{"X1":[85.0,117.7],"X2":[85.0,172.1]}],"lamp-amber-on":[170,208,{"X1":[85.0,117.7],"X2":[85.0,172.1]}],"lamp-black-off":[170,208,{"X1":[85.0,117.7],"X2":[85.0,172.1]}],"lamp-black-on":[170,208,{"X1":[85.0,117.7],"X2":[85.0,172.1]}],"lamp-blue-off":[170,208,{"X1":[85.0,117.7],"X2":[85.0,172.1]}],"lamp-blue-on":[170,208,{"X1":[85.0,117.7],"X2":[85.0,172.1]}],"lamp-green-off":[170,208,{"X1":[85.0,117.7],"X2":[85.0,172.1]}],"lamp-green-on":[170,208,{"X1":[85.0,117.7],"X2":[85.0,172.1]}],"lamp-red-off":[170,208,{"X1":[85.0,117.7],"X2":[85.0,172.1]}],"lamp-red-on":[170,208,{"X1":[85.0,117.7],"X2":[85.0,172.1]}],"lamp-white-off":[170,208,{"X1":[85.0,117.7],"X2":[85.0,172.1]}],"lamp-white-on":[170,208,{"X1":[85.0,117.7],"X2":[85.0,172.1]}],"lamp-yellow-off":[170,208,{"X1":[85.0,117.7],"X2":[85.0,172.1]}],"lamp-yellow-on":[170,208,{"X1":[85.0,117.7],"X2":[85.0,172.1]}],"level-float-0":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"level-float-1":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"level-press-0":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"level-press-1":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"level-thermo-0":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"level-thermo-1":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"ls-1-0":[170,208,{"13":[85.0,117.7],"14":[85.0,172.1]}],"ls-1-1":[170,208,{"13":[85.0,117.7],"14":[85.0,172.1]}],"ls-1l-0":[170,208,{"13":[85.0,117.7],"14":[85.0,172.1]}],"ls-1l-1":[170,208,{"13":[85.0,117.7],"14":[85.0,172.1]}],"ls-2-0":[170,208,{"13":[55.0,117.7],"14":[55.0,172.1],"21":[115.0,117.7],"22":[115.0,172.1]}],"ls-2-1":[170,208,{"13":[55.0,117.7],"14":[55.0,172.1],"21":[115.0,117.7],"22":[115.0,172.1]}],"ls-2l-0":[170,208,{"13":[55.0,117.7],"14":[55.0,172.1],"21":[115.0,117.7],"22":[115.0,172.1]}],"ls-2l-1":[170,208,{"13":[55.0,117.7],"14":[55.0,172.1],"21":[115.0,117.7],"22":[115.0,172.1]}],"mcb-1p-off":[170,170,{"1":[85.0,43.5],"2":[85.0,134.8]}],"mcb-1p-on":[170,170,{"1":[85.0,43.5],"2":[85.0,134.8]}],"mcb-2p-off":[170,170,{"1":[58.0,43.5],"2":[58.0,134.8],"3":[112.0,43.5],"4":[112.0,134.8]}],"mcb-2p-on":[170,170,{"1":[58.0,43.5],"2":[58.0,134.8],"3":[112.0,43.5],"4":[112.0,134.8]}],"mcb-3p-off":[340,170,{"1":[137.8,46.0],"3":[169.1,46.5],"5":[199.0,45.9],"2":[138.7,158.0],"4":[168.6,158.4],"6":[199.0,158.3]}],"mcb-3p-on":[340,170,{"1":[137.8,46.0],"3":[169.1,46.5],"5":[199.0,45.9],"2":[138.7,158.0],"4":[168.6,158.4],"6":[199.0,158.3]}],"motor-3":[170,208,{"U":[51.0,88.0],"V":[85.0,88.0],"W":[119.0,88.0]}],"motor-3pump":[170,208,{"U":[51.0,88.0],"V":[85.0,88.0],"W":[119.0,88.0]}],"motor-6":[340,208,{"W2":[206.0,81.2],"U2":[252.0,81.2],"V2":[298.0,81.2],"U1":[206.0,137.4],"V1":[252.0,137.4],"W1":[298.0,137.4]}],"motor-6pump":[340,208,{"W2":[206.0,81.2],"U2":[252.0,81.2],"V2":[298.0,81.2],"U1":[206.0,137.4],"V1":[252.0,137.4],"W1":[298.0,137.4]}],"mpcb-n-off":[170,180,{"1":[41.6,47.5],"2":[41.6,154.2],"3":[85.0,47.5],"4":[85.0,154.2],"5":[128.3,47.5],"6":[128.3,154.2]}],"mpcb-n-on":[170,180,{"1":[41.6,47.5],"2":[41.6,154.2],"3":[85.0,47.5],"4":[85.0,154.2],"5":[128.3,47.5],"6":[128.3,154.2]}],"mpcb-na-off":[170,180,{"1":[33.0,47.5],"2":[33.0,154.2],"3":[59.0,47.5],"4":[59.0,154.2],"5":[85.0,47.5],"6":[85.0,154.2],"13":[111.0,47.5],"14":[111.0,154.2],"21":[137.0,47.5],"22":[137.0,154.2]}],"mpcb-na-on":[170,180,{"1":[33.0,47.5],"2":[33.0,154.2],"3":[59.0,47.5],"4":[59.0,154.2],"5":[85.0,47.5],"6":[85.0,154.2],"13":[111.0,47.5],"14":[111.0,154.2],"21":[137.0,47.5],"22":[137.0,154.2]}],"mpcb-w-off":[340,180,{"1":[116.0,47.5],"2":[116.0,154.2],"3":[170.0,47.5],"4":[170.0,154.2],"5":[224.0,47.5],"6":[224.0,154.2]}],"mpcb-w-on":[340,180,{"1":[116.0,47.5],"2":[116.0,154.2],"3":[170.0,47.5],"4":[170.0,154.2],"5":[224.0,47.5],"6":[224.0,154.2]}],"mpcb-wa-off":[340,180,{"1":[62.0,47.5],"2":[62.0,154.2],"3":[116.0,47.5],"4":[116.0,154.2],"5":[170.0,47.5],"6":[170.0,154.2],"13":[224.0,47.5],"14":[224.0,154.2],"21":[278.0,47.5],"22":[278.0,154.2]}],"mpcb-wa-on":[340,180,{"1":[62.0,47.5],"2":[62.0,154.2],"3":[116.0,47.5],"4":[116.0,154.2],"5":[170.0,47.5],"6":[170.0,154.2],"13":[224.0,47.5],"14":[224.0,154.2],"21":[278.0,47.5],"22":[278.0,154.2]}],"ol-n-ok":[170,208,{"1":[33.0,66.1],"2":[33.0,172.8],"3":[59.0,66.1],"4":[59.0,172.8],"5":[85.0,66.1],"6":[85.0,172.8],"95":[111.0,65.7],"96":[111.0,172.3],"97":[137.0,65.7],"98":[137.0,172.3]}],"ol-n-trip":[170,208,{"1":[33.0,66.1],"2":[33.0,172.8],"3":[59.0,66.1],"4":[59.0,172.8],"5":[85.0,66.1],"6":[85.0,172.8],"95":[111.0,65.7],"96":[111.0,172.3],"97":[137.0,65.7],"98":[137.0,172.3]}],"ol-w-ok":[340,208,{"1":[62.0,66.1],"2":[62.0,172.8],"3":[116.0,66.1],"4":[116.0,172.8],"5":[170.0,66.1],"6":[170.0,172.8],"95":[224.0,65.7],"96":[224.0,172.3],"97":[278.0,65.7],"98":[278.0,172.3]}],"ol-w-trip":[340,208,{"1":[62.0,66.1],"2":[62.0,172.8],"3":[116.0,66.1],"4":[116.0,172.8],"5":[170.0,66.1],"6":[170.0,172.8],"95":[224.0,65.7],"96":[224.0,172.3],"97":[278.0,65.7],"98":[278.0,172.3]}],"pb-black1-p":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"pb-black1-r":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"pb-black2-p":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"pb-black2-r":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"pb-blue1-p":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"pb-blue1-r":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"pb-blue2-p":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"pb-blue2-r":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"pb-green1-p":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"pb-green1-r":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"pb-green2-p":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"pb-green2-r":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"pb-red1-p":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"pb-red1-r":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"pb-red2-p":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"pb-red2-r":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"pb-white1-p":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"pb-white1-r":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"pb-white2-p":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"pb-white2-r":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"pb-yellow1-p":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"pb-yellow1-r":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"pb-yellow2-p":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"pb-yellow2-r":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"21":[115.0,133.2],"22":[115.0,187.6]}],"prox-cap-0":[170,224,{"BN":[46.0,183.8],"BK":[85.0,183.8],"BU":[124.0,183.8]}],"prox-cap-1":[170,224,{"BN":[46.0,183.8],"BK":[85.0,183.8],"BU":[124.0,183.8]}],"prox-ind-0":[170,224,{"BN":[46.0,183.8],"BK":[85.0,183.8],"BU":[124.0,183.8]}],"prox-ind-1":[170,224,{"BN":[46.0,183.8],"BK":[85.0,183.8],"BU":[124.0,183.8]}],"prox-photo-0":[170,224,{"BN":[46.0,183.8],"BK":[85.0,183.8],"BU":[124.0,183.8]}],"prox-photo-1":[170,224,{"BN":[46.0,183.8],"BK":[85.0,183.8],"BU":[124.0,183.8]}],"rectifier":[170,208,{"AC1":[55.0,59.1],"AC2":[115.0,59.1],"DC+":[55.0,183.3],"DC-":[115.0,183.3]}],"relay-2co-off":[340,208,{"11":[53.4,65.7],"12":[100.0,65.7],"14":[146.7,65.7],"21":[193.3,65.7],"22":[240.0,65.7],"24":[286.6,65.7],"A1":[146.0,180.2],"A2":[194.0,180.2]}],"relay-2co-on":[340,208,{"11":[53.4,65.7],"12":[100.0,65.7],"14":[146.7,65.7],"21":[193.3,65.7],"22":[240.0,65.7],"24":[286.6,65.7],"A1":[146.0,180.2],"A2":[194.0,180.2]}],"relay-4co-off":[340,208,{"11":[53.4,65.7],"12":[100.0,65.7],"14":[146.7,65.7],"21":[193.3,65.7],"22":[240.0,65.7],"24":[286.6,65.7],"31":[82.5,180.2],"32":[117.5,180.2],"34":[152.5,180.2],"41":[187.5,180.2],"42":[222.5,180.2],"44":[257.5,180.2],"A1":[47.5,180.2],"A2":[292.5,180.2]}],"relay-4co-on":[340,208,{"11":[53.4,65.7],"12":[100.0,65.7],"14":[146.7,65.7],"21":[193.3,65.7],"22":[240.0,65.7],"24":[286.6,65.7],"31":[82.5,180.2],"32":[117.5,180.2],"34":[152.5,180.2],"41":[187.5,180.2],"42":[222.5,180.2],"44":[257.5,180.2],"A1":[47.5,180.2],"A2":[292.5,180.2]}],"relay-n2co-off":[170,208,{"11":[85.0,59.4],"12":[59.0,166.1],"14":[85.0,166.1],"21":[128.3,59.4],"22":[111.0,166.1],"24":[137.0,166.1],"A1":[41.6,59.4],"A2":[33.0,166.1]}],"relay-n2co-on":[170,208,{"11":[85.0,59.4],"12":[59.0,166.1],"14":[85.0,166.1],"21":[128.3,59.4],"22":[111.0,166.1],"24":[137.0,166.1],"A1":[41.6,59.4],"A2":[33.0,166.1]}],"relay-n4co-off":[170,208,{"11":[59.0,59.4],"12":[41.6,166.1],"14":[56.1,166.1],"21":[85.0,59.4],"22":[70.5,166.1],"24":[85.0,166.1],"31":[111.0,59.4],"32":[99.5,166.1],"34":[113.9,166.1],"41":[137.0,59.4],"42":[128.3,166.1],"44":[142.8,166.1],"A1":[33.0,59.4],"A2":[27.2,166.1]}],"relay-n4co-on":[170,208,{"11":[59.0,59.4],"12":[41.6,166.1],"14":[56.1,166.1],"21":[85.0,59.4],"22":[70.5,166.1],"24":[85.0,166.1],"31":[111.0,59.4],"32":[99.5,166.1],"34":[113.9,166.1],"41":[137.0,59.4],"42":[128.3,166.1],"44":[142.8,166.1],"A1":[33.0,59.4],"A2":[27.2,166.1]}],"sel-2p1-0":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"sel-2p1-1":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"sel-2p2-0":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"23":[115.0,133.2],"24":[115.0,187.6]}],"sel-2p2-1":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"23":[115.0,133.2],"24":[115.0,187.6]}],"sel-3p1-0":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"sel-3p1-1":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"sel-3p1-2":[170,224,{"13":[85.0,133.2],"14":[85.0,187.6]}],"sel-3p2-0":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"23":[115.0,133.2],"24":[115.0,187.6]}],"sel-3p2-1":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"23":[115.0,133.2],"24":[115.0,187.6]}],"sel-3p2-2":[170,224,{"13":[55.0,133.2],"14":[55.0,187.6],"23":[115.0,133.2],"24":[115.0,187.6]}],"softstarter-n":[170,236,{"13":[16.0,156.3],"14":[16.0,179.7],"23":[154.0,63.2],"24":[154.0,86.5],"95":[154.0,109.8],"96":[154.0,133.1],"97":[154.0,156.3],"98":[154.0,179.7],"L1":[50.0,55.0],"L2":[86.0,55.0],"L3":[122.0,55.0],"T1":[50.0,212.1],"T2":[86.0,212.1],"T3":[122.0,212.1],"A1":[16.0,63.2],"A2":[16.0,86.5],"IN1":[16.0,109.8],"IN2":[16.0,133.1]}],"softstarter-w":[340,236,{"13":[40.0,156.3],"14":[40.0,179.7],"23":[300.0,63.2],"24":[300.0,86.5],"95":[300.0,109.8],"96":[300.0,133.1],"97":[300.0,156.3],"98":[300.0,179.7],"L1":[110.0,55.0],"L2":[170.0,55.0],"L3":[230.0,55.0],"T1":[110.0,212.1],"T2":[170.0,212.1],"T3":[230.0,212.1],"A1":[40.0,63.2],"A2":[40.0,86.5],"IN1":[40.0,109.8],"IN2":[40.0,133.1]}],"supply3P-n-off":[170,200,{"L1":[33.5,185.3],"L2":[67.5,185.3],"L3":[101.4,185.3],"N":[135.3,185.3]}],"supply3P-n-on":[170,200,{"L1":[33.5,185.3],"L2":[67.5,185.3],"L3":[101.4,185.3],"N":[135.3,185.3]}],"supply3P-w-off":[340,200,{"L1":[118.5,185.3],"L2":[152.5,185.3],"L3":[186.4,185.3],"N":[220.3,185.3]}],"supply3P-w-on":[340,200,{"L1":[118.5,185.3],"L2":[152.5,185.3],"L3":[186.4,185.3],"N":[220.3,185.3]}],"supplyAC-off":[170,150,{"L":[60.0,119.6],"N":[110.0,119.6]}],"supplyAC-on":[170,150,{"L":[60.0,119.6],"N":[110.0,119.6]}],"supplyDC-off":[170,150,{"P24":[60.0,119.6],"0V":[110.0,119.6]}],"supplyDC-on":[170,150,{"P24":[60.0,119.6],"0V":[110.0,119.6]}],"supplyDC-trip":[170,150,{"P24":[60.0,119.6],"0V":[110.0,119.6]}],"tb-10":[340,132,{"1a":[53.0,64.0],"1b":[53.0,116.5],"2a":[79.0,64.0],"2b":[79.0,116.5],"3a":[105.0,64.0],"3b":[105.0,116.5],"4a":[131.0,64.0],"4b":[131.0,116.5],"5a":[157.0,64.0],"5b":[157.0,116.5],"6a":[183.0,64.0],"6b":[183.0,116.5],"7a":[209.0,64.0],"7b":[209.0,116.5],"8a":[235.0,64.0],"8b":[235.0,116.5],"9a":[261.0,64.0],"9b":[261.0,116.5],"10a":[287.0,64.0],"10b":[287.0,116.5]}],"tb-12":[340,132,{"1a":[27.9,64.0],"1b":[27.9,116.5],"2a":[53.8,64.0],"2b":[53.8,116.5],"3a":[79.6,64.0],"3b":[79.6,116.5],"4a":[105.4,64.0],"4b":[105.4,116.5],"5a":[131.2,64.0],"5b":[131.2,116.5],"6a":[157.1,64.0],"6b":[157.1,116.5],"7a":[182.9,64.0],"7b":[182.9,116.5],"8a":[208.8,64.0],"8b":[208.8,116.5],"9a":[234.6,64.0],"9b":[234.6,116.5],"10a":[260.4,64.0],"10b":[260.4,116.5],"11a":[286.2,64.0],"11b":[286.2,116.5],"12a":[312.1,64.0],"12b":[312.1,116.5]}],"tb-4":[170,132,{"1a":[46.0,64.0],"1b":[46.0,116.5],"2a":[72.0,64.0],"2b":[72.0,116.5],"3a":[98.0,64.0],"3b":[98.0,116.5],"4a":[124.0,64.0],"4b":[124.0,116.5]}],"tb-6":[170,132,{"1a":[26.6,64.0],"1b":[26.6,116.5],"2a":[50.0,64.0],"2b":[50.0,116.5],"3a":[73.3,64.0],"3b":[73.3,116.5],"4a":[96.7,64.0],"4b":[96.7,116.5],"5a":[120.0,64.0],"5b":[120.0,116.5],"6a":[143.3,64.0],"6b":[143.3,116.5]}],"tb-8":[340,132,{"1a":[79.0,64.0],"1b":[79.0,116.5],"2a":[105.0,64.0],"2b":[105.0,116.5],"3a":[131.0,64.0],"3b":[131.0,116.5],"4a":[157.0,64.0],"4b":[157.0,116.5],"5a":[183.0,64.0],"5b":[183.0,116.5],"6a":[209.0,64.0],"6b":[209.0,116.5],"7a":[235.0,64.0],"7b":[235.0,116.5],"8a":[261.0,64.0],"8b":[261.0,116.5]}],"timer-sd":[170,208,{"17":[112.0,59.2],"18":[85.0,183.4],"28":[128.3,183.4],"A1":[58.0,59.2],"A2":[41.6,183.4]}],"timer-std":[170,208,{"15":[112.0,59.2],"16":[85.0,183.4],"18":[128.3,183.4],"A1":[58.0,59.2],"A2":[41.6,183.4]}],"xfmr":[170,208,{"H1":[55.0,59.0],"H2":[115.0,59.0],"X1":[55.0,183.2],"X2":[115.0,183.2]}],"mcb-3pn-off":[170,170,{"1":[52.8,46.0],"3":[84.1,46.5],"5":[114.0,45.9],"2":[53.7,158.0],"4":[83.6,158.4],"6":[114.0,158.3]}],"mcb-3pn-on":[170,170,{"1":[52.8,46.0],"3":[84.1,46.5],"5":[114.0,45.9],"2":[53.7,158.0],"4":[83.6,158.4],"6":[114.0,158.3]}]};   // key: [cellW, cellH, {term:[x, y]}]
  const subs = new Set();
  const mode = () => { const m = sload().skin; return m === 'draw' ? 'draw' : 'photo'; };
  const setBody = () => { try { document.body && (document.body.dataset.skin = mode()); } catch(_) {} };
  const IMGK = {pb1:['NO'], pb2:['NO','NC'], es1:['NC'], es2:['NC','NO'], sel1:['NO'], sel2:['NO','NO'], ls1:['NO'], ls2:['NO','NC'], lv2:['NO','NC'], ct1:['NO'], ct2:['NO','NC'], ct3:['NO','NC','NO']};
  const bname = (k, i) => k === 'NO' ? [(i + 1) + '3', (i + 1) + '4'] : k === 'NC' ? [(i + 1) + '1', (i + 1) + '2'] : [(i + 1) + '1', (i + 1) + '2', (i + 1) + '4'];
  // engine block terminals -> image terminal names (by block index and position)
  function bmap(bl, ik){ if (!ik || bl.length !== ik.length) return null; const m = {}; for (let i = 0; i < bl.length; i++){ const nm = bname(ik[i], i), t = bl[i].t || []; if (t.length !== nm.length) return null; t.forEach((x, j) => m[x] = nm[j]); } return m; }
  function pick(d, ctx){
    const T = d.type, st = d.st || {}, c = d.cfg || {}, w = ctx.w || CW * TYPES[T].span(d), bl = d.blocks || [], wide = w >= 300 ? 'w' : 'n';
    const on = x => x ? 'on' : 'off';
    switch (T){
      case 'pb': { const n = bl.length; return {key:`pb-${c.color}${n}-${TYPES.pb.op(d) ? 'p' : 'r'}`, map:bmap(bl, IMGK['pb' + n])}; }
      case 'estop': { const n = bl.length; return {key:`estop-${n}-${TYPES.estop.op(d) ? 'p' : 'r'}`, map:bmap(bl, IMGK['es' + n])}; }
      case 'sel': { const n = bl.length, p = (c.pos || []).length; return {key:`sel-${p}p${n}-${st.pos || 0}`, map:bmap(bl, IMGK['sel' + n])}; }
      case 'ls': { const n = bl.length; return {key:`ls-${n}${c.cart ? 'l' : ''}-${st.a ? 1 : 0}`, map:bmap(bl, IMGK['ls' + n])}; }
      case 'level': return {key:`level-${c.look || 'float'}-${st.a ? 1 : 0}`, map:bmap(bl, IMGK.lv2)};
      case 'lamp': return {key:`lamp-${c.color || 'green'}-${on(ctx.en && !st.burnt)}`};
      case 'supplyAC': return {key:`supplyAC-${on(st.on && !st.trip)}`};
      case 'supplyDC': return {key:st.trip ? 'supplyDC-trip' : `supplyDC-${on(st.on)}`};
      case 'supply3P': return {key:`supply3P-${wide}-${on(st.on && !st.trip)}`};
      case 'mcb': return {key:`mcb-${c.poles || 1}p${(c.poles || 1) === 3 && wide === 'n' ? 'n' : ''}-${on(st.on && !st.trip)}`};
      case 'fuse': return {key:`fuse-${c.poles || 1}p-${st.trip ? 'blown' : 'ok'}`};
      case 'mpcb': return {key:`mpcb-${wide}${c.aux ? 'a' : ''}-${on(st.on && !st.trip)}`};
      case 'ol': return {key:`ol-${wide}-${st.trip ? 'trip' : 'ok'}`};
      case 'contactor': {
        const aux = bl.slice(0, 3), side = ctx.ctlSide || (wide === 'n' && ctx.grid ? 'l' : '');
        if (!side && wide === 'n') return null;
        if (!aux.length) return null;
        return {key:`contactor-${side ? (wide === 'n' ? 'n' : 's') : 'w'}${aux.length}-${on(st.closed)}`, map:bmap(aux, IMGK['ct' + aux.length])};
      }
      case 'relay': { if (!bl.length || bl.some(b => b.k !== 'CO')) return null; const m = {}; bl.forEach((b, i) => b.t.forEach((x, j) => m[x] = bname('CO', i)[j]));
        return {key:`relay-${wide === 'n' ? 'n' : ''}${bl.length}co-${on(wide === 'n' ? st.coil : (ctx.en || st.coil))}`, map:m}; }
      case 'timer': return c.inst ? null : {key:c.mode === 'sd' ? 'timer-sd' : 'timer-std'};
      case 'motor': return {key:`motor-${c.term === 6 ? 6 : 3}${c.look === 'pump' ? 'pump' : ''}`};
      case 'prox': return {key:`prox-${c.kind || 'ind'}-${st.a ? 1 : 0}`};
      case 'tb': return {key:`tb-${c.n}`};
      case 'xfmr': return {key:'xfmr'};
      case 'rectifier': return {key:'rectifier'};
      case 'brake': return {key:`brake-${on(st.coil || ctx.en)}`};
      case 'softstarter': return {key:`softstarter-${wide}`};
    }
    return null;
  }
  // texts the photo itself already shows (nameplates); everything else the engine prints is kept
  const DROP = {
    contactor: /^(LC1D|MC-|AC-3|COIL |▼ I$|0$)|^[A-Z0-9-]*D\d\d/,
    relay: /^(RELAY |SOCKET|COIL$|LED$|ON$)/,
    motor: /^(TERMINAL BOX|IE3 |PUMP 3~)/,
    timer: /^(RE22|U$|R$)/,
    supplyDC: /^(PSU 24V|DC OK|F 2A)$/,
    supplyAC: /^(MCB|C\d|I ON|O OFF)$/,
    supply3P: /^(I ON|O OFF)$/,
    mcb: /^(I ON|O OFF)$/,
    mpcb: /^(I ON|O OFF)$/,
    xfmr: /^(ABL|PRI )/,
    rectifier: /^(BRIDGE|AC IN|AC ~)/,
    brake: /^COIL$/,
    softstarter: /^(PWR|RUN|FLT)$/
  };
  const DROPSZ = {relay:7, timer:6};   // small unclassed print (mini schematic letters, dial numbers) the photo replaces
  const KEEP = {   // extra non-text drawing kept per type (live state that the photo cannot show)
    tb: /<rect [^>]*fill="#b87333"[^>]*\/>/g,
    motor: /<circle cx="(\d+)" cy="(\d+)" r="18"[\s\S]*?r="4" fill="#d32f2f"\/>/g
  };
  const lum = h => { const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(h || ''); if (!m) return -1; let x = m[1]; if (x.length === 3) x = x.replace(/./g, '$&$&'); const v = parseInt(x, 16); return (0.299 * (v >> 16) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255; };
  // terminal number texts follow their terminal from the drawn position to the photo position
  function follow(t, txt, moves){
    const m = /^<text\b[^>]*>/.exec(t); if (!m) return t;
    const tag = m[0], x = +(/\sx="([-\d.]+)"/.exec(tag) || [])[1], y = +(/\sy="([-\d.]+)"/.exec(tag) || [])[1];
    if (isNaN(x) || isNaN(y)) return t;
    let best = null, bd = 1e9;
    moves.forEach(mv => { if (mv.names.indexOf(txt) < 0) return; const dy = Math.abs(y - mv.ey), dx = Math.abs(x - mv.ex); const d = mv.side ? (dy < 8 ? dy : 1e9) : (dx < 1.5 && dy < 34 ? dy : 1e9); if (d < bd){ bd = d; best = mv; } });
    if (!best) return t;
    const nx = x + best.dx, ny = y + best.dy;
    return tag.replace(/\sx="[-\d.]+"/, ` x="${Math.round(nx * 10) / 10}"`).replace(/\sy="[-\d.]+"/, ` y="${Math.round(ny * 10) / 10}"`) + t.slice(tag.length);
  }
  function overlay(svg, T, moves){
    let out = '';
    const defs = svg.match(/<defs>[\s\S]*?<\/defs>/g); if (defs) out += defs.join('');
    if (KEEP[T]) (svg.match(KEEP[T]) || []).forEach(s => out += s);
    (svg.match(/<rect class="bpin-badge"[^>]*\/>/g) || []).forEach(s => out += s);
    const drop = DROP[T];
    (svg.match(/<text\b[\s\S]*?<\/text>/g) || []).forEach(t => {
      const txt = t.replace(/<[^>]+>/g, '').trim();
      const cls = /class="(blk-cap|ar|bd-id)/.test(t), fs = +((/font-size="([\d.]+)"/.exec(t) || [])[1] || 99);
      if (!cls && ((drop && drop.test(txt)) || (DROPSZ[T] && fs <= DROPSZ[T]))) return;
      if (moves && moves.length) t = follow(t, txt, moves);
      const f = (/fill="([^"]+)"/.exec(t) || [])[1] || '', L = lum(f);
      out += `<g class="${f.indexOf('var(') === 0 || /class="bd-id/.test(t) ? 'oh-v' : L > 0.55 ? 'oh-d' : 'oh-l'}">${t}</g>`;
    });
    return out;
  }
  const HYB = {pb:100, estop:100, sel:100, ls:100, lamp:100}; let HCID = 0;
  function apply(d, ctx, r){
    if (mode() !== 'photo' || !r || !r.terms) return r;
    if (HYB[d.type] && r.svg.indexOf('<!--dh-->') > -1){
      let hv; try { hv = pick(d, ctx); } catch(_) { hv = null; }
      const hit2 = hv && IT[hv.key], hw = ctx.w || CW * TYPES[d.type].span(d);
      if (!hit2 || hit2[0] !== hw) return r;
      const cid = 'hc' + (++HCID), keepS = /<!--dh-->([\s\S]*?)<!--\/dh-->/.exec(r.svg);
      const badges = keepS ? (keepS[1].match(/<rect class="bpin-badge"[^>]*\/>(<text[^>]*>[^<]*<\/text>)?/g) || []).join('') : '';
      const heads = keepS ? (keepS[1].match(/<text class="(bd-id|ar)"[\s\S]*?<\/text>/g) || []).join('') : '';
      const head = `<clipPath id="${cid}"><rect x="0" y="20" width="${hit2[0]}" height="${HYB[d.type] - 20}"/></clipPath><g clip-path="url(#${cid})"><g class="bd-phw" data-ph="${esc(d.id)}" data-key="${hv.key}" data-w="${hit2[0]}" data-h="${hit2[1]}"></g></g>`;
      return {svg:r.svg.replace(/<!--dh-->[\s\S]*?<!--\/dh-->/, heads + head + badges), hit:r.hit, terms:r.terms, photo:hv.key};
    }
    let v; try { v = pick(d, ctx); } catch(_) { v = null; }
    if (!v) return r;
    const it = IT[v.key], w = ctx.w || CW * TYPES[d.type].span(d);
    if (!it || it[0] !== w) return r;
    const terms = {}, moves = [], labs = {};
    try { (TYPES[d.type].terms(d) || []).forEach(x => { if (x.lab) labs[x.n] = x.lab; }); } catch(_) {}
    for (const n of Object.keys(r.terms)){ const nm = v.map && v.map[n] ? v.map[n] : n, p = it[2][nm], e = r.terms[n]; if (!p) return r; terms[n] = Object.assign({}, e, {x:p[0], y:p[1]});
      moves.push({names:[n, labs[n] || n, e.lab || n], ex:e.x, ey:e.y, dx:p[0] - e.x, dy:p[1] - e.y, side:!!e.side}); }
    // placeholder: attach() puts a persistent <image> per device in it, so the 10 Hz live re-render never re-creates (re-decodes) the photos
    const img = `<g class="bd-phw" data-ph="${esc(d.id)}" data-key="${v.key}" data-w="${it[0]}" data-h="${it[1]}"></g>`;
    const hum = /class="hum"/.test(r.svg);
    return {svg:(hum ? `<g class="hum">${img}</g>` : img) + `<g class="bd-ov">${overlay(r.svg, d.type, moves)}</g>`, hit:r.hit, terms, photo:v.key};
  }
  const NS = 'http://www.w3.org/2000/svg';
  function attach(board){
    const ph = board.querySelectorAll('g[data-ph]'); if (!ph.length) return;
    const cache = board.__skin || (board.__skin = new Map());
    ph.forEach(g => { const id = g.getAttribute('data-ph'), key = g.getAttribute('data-key'); let im = cache.get(id);
      if (!im){ im = document.createElementNS(NS, 'image'); im.setAttribute('class', 'bd-ph'); im.setAttribute('preserveAspectRatio', 'none'); im.setAttribute('x', '0'); im.setAttribute('y', '0'); cache.set(id, im); }
      if (im.getAttribute('data-key') !== key){ im.setAttribute('href', BASE + 'img/' + key + '.webp' + (/^(contactor|supply3P|mcb-3p)/.test(key) ? '?v=ls2' : '')); im.setAttribute('data-key', key); }
      im.setAttribute('width', g.getAttribute('data-w')); im.setAttribute('height', g.getAttribute('data-h'));
      g.appendChild(im); });
  }
  // preload: every image the devices of this exercise can show (all states), the current one first
  const seen = new Set();
  function preload(devs){
    if (mode() !== 'photo') return;
    const keys = [];
    devs.forEach(d => { const T = d.type; Object.keys(IT).forEach(k => { if (k === T || k.indexOf(T + '-') === 0 || (T === 'estop' && k.indexOf('estop-') === 0)) keys.push(k); }); });
    const want = new Set();
    devs.forEach(d => { let v = null; try { v = pick(d, {w:CW * TYPES[d.type].span(d), grid:true}); } catch(_) {} if (v) want.add(v.key); });
    // only the variants that share the current key's prefix (same device, other states)
    const pre = [...want].map(k => k.replace(/-[^-]+$/, '-'));
    keys.filter(k => want.has(k) || pre.some(p => k.indexOf(p) === 0)).forEach(k => { if (seen.has(k)) return; seen.add(k); const im = new Image(); im.decoding = 'async'; im.src = BASE + 'img/' + k + '.webp' + (/^(contactor|supply3P|mcb-3p)/.test(k) ? '?v=ls2' : ''); });
  }
  function set(m){ const o = sload(); if (m === 'draw') o.skin = 'draw'; else delete o.skin; ssave(); setBody(); subs.forEach(f => { try { f(); } catch(_) {} }); syncTg(); }
  function syncTg(){ document.querySelectorAll('.skin-tg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.skin === mode() ? 'true' : 'false')); }
  function toggle(host){
    if (!host || host.querySelector('.skin-tg')) return;
    const g = document.createElement('div'); g.className = 'skin-tg'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Device look on the wiring board');
    g.innerHTML = '<button type="button" data-skin="photo">Realistic</button><button type="button" data-skin="draw">Drawing</button>';
    g.addEventListener('click', e => { const b = e.target.closest('button'); if (b) set(b.dataset.skin); });
    host.insertBefore(g, host.firstChild); syncTg();
  }
  setBody(); if (!document.body) document.addEventListener('DOMContentLoaded', setBody);
  return {mode, set, apply, attach, pick, preload, toggle, sub(f){ subs.add(f); return () => subs.delete(f); }, items:IT, base:() => BASE};
})();
/* @skin-photo-end */

/* =========================== wiring bench UI =========================== */
CL.bench = function(host, ex, opt){
  opt = opt || {};
  const devs = ex.devices.map(CL.makeDevice), byId = {}; devs.forEach(d => byId[d.id] = d);
  const allT = new Set(); devs.forEach(d => TYPES[d.type].terms(d).forEach(t => allT.add(d.id + ':' + t.n)));
  const dc = devs.some(d => d.type === 'supplyDC'), has3P = devs.some(d => d.type === 'supply3P'), nm = supplyNames(devs);
  let wires = [], wid = 0, hist = [], pend = null, flash = null, errHl = null, lastRes = null, held = new Map(), anim = null, timer = null, lastAct = '', passed = false, destroyed = false, api = null; const prevSt = {}, prevTrip = {}; const EVB = o => Object.assign({ex, key:opt.key, host, api}, o);
  const addW = (a, b) => { wires.push({id:++wid, a, b}); return wires[wires.length - 1]; };
  let saved = opt.key ? CL.store.bench(opt.key) : null, ghost = 0; // عدد توصيلات الحل الظاهرة (0 = الحل مخفي)
  const keyOf = p => p[0] < p[1] ? p[0] + '>' + p[1] : p[1] + '>' + p[0], sameSet = (a, b) => a.length === b.length && new Set(a.map(keyOf)).size === new Set(a.concat(b).map(keyOf)).size;
  // a board that is exactly the solution but was never passed by the trainee's own check came from the old “Show solution”: drop it, start empty
  if (Array.isArray(saved) && ex.solution && !(opt.passKey && CL.store.has(opt.passKey)) && sameSet(saved, ex.solution)){ saved = null; if (opt.key) CL.store.bench(opt.key, null); }
  if (Array.isArray(saved)) saved.forEach(p => { if (Array.isArray(p) && allT.has(p[0]) && allT.has(p[1])) addW(p[0], p[1]); });
  else if (ex.preset) ex.preset.forEach(p => addW(p[0], p[1])); // an exercise that starts pre-wired (e.g. a deliberate mistake to find)
  const persist = () => { if (opt.key) CL.store.bench(opt.key, wires.map(w => [w.a, w.b])); if (opt.onChange) opt.onChange(); };

  host.innerHTML = `<div class="bn">
    ${CL.taskCard(ex.id || !opt.key ? ex : Object.assign({}, ex, {id:String(opt.key).split('/').pop()}), devs)}
    <div class="bn-bar"><div class="bn-tools">
      <button type="button" class="btn big pri pwr" data-b="pwr">⚡ Power on</button>
      <button type="button" class="btn" data-b="undo">↶ Undo</button>
      <button type="button" class="btn" data-b="clear">Clear all</button>
      <button type="button" class="btn" data-b="sol" aria-pressed="false">Show solution</button>
      ${devs.some(d => d.type === 'ol' || d.type === 'mpcb' || d.type === 'timer' || TYPES[d.type].motor) ? '<button type="button" class="btn spd" data-b="spd" aria-label="Time speed">⏩ ×1</button>' : ''}
    </div>${devs.filter(d => TYPES[d.type].motor).map(d => `<label class="bn-load">Load ${esc(d.tag)}: <b data-load="${d.id}">${Math.round((d.st.load || 0) * 100)}%</b><input type="range" dir="ltr" min="0" max="300" step="5" value="${Math.round((d.st.load || 0) * 100)}" data-motor="${d.id}" aria-label="Load ${esc(d.tag)}"></label>`).join('')}<div class="bn-msg" role="status" aria-live="polite"></div></div>
    <div class="bn-res" aria-live="polite"></div>
    <div class="bn-fx"></div>
    <div class="bn-board"></div>
    <div class="bn-machine" hidden></div>
    <div class="bn-legend">${has3P ? '<span><i class="pw" style="background:#7b4a21"></i>L1 brown</span><span><i class="pw" style="background:#1f1f1f"></i>L2 black</span><span><i class="pw" style="background:#8a8f94"></i>L3 grey</span><span class="lg-note">(power wires are thick)</span>' : ''}<span><i style="background:${dc ? '#1f3f9a' : '#c62828'}"></i>${dc ? '+24V wire (dark blue)' : 'L control wire (red' + (has3P ? ', thin' : '') + ')'}</span><span><i style="background:#3a9be0"></i>${dc ? '0V wire' : 'N wire (light blue)'}</span><span><i style="background:repeating-linear-gradient(90deg,#fff6b0 0 4px,#c62828 4px 13px)"></i>current flowing</span></div>
  </div>`;
  const board = host.querySelector('.bn-board'), msgEl = host.querySelector('.bn-msg'), resEl = host.querySelector('.bn-res'), pwrBtn = host.querySelector('[data-b=pwr]');
  const msg = (t, cls) => { msgEl.innerHTML = t || ''; msgEl.className = 'bn-msg' + (cls ? ' ' + cls : ''); };
  let speed = 1; const spdBtn = host.querySelector('[data-b=spd]');
  const curSpeed = () => CL.sim.speed || speed;
  host.querySelectorAll('[data-motor]').forEach(inp => inp.addEventListener('input', () => { const d = byId[inp.dataset.motor]; d.st.load = inp.value / 100; const b = host.querySelector(`[data-load="${d.id}"]`); if (b) b.textContent = inp.value + '%'; render(); }));
  msg(wires.length ? 'Your earlier wiring is saved. Carry on or press “Power on”.' : `Tap a terminal (for example ${nm.L} on the supply), then tap the other terminal to connect a wire.`);
  const powered = () => devs.some(d => isSupply(d) && d.st.on && !d.st.trip);
  const termLab = id => { const [dv, t] = id.split(':'); const d = byId[dv]; const tt = TYPES[d.type].terms(d).find(x => x.n === t); return `${d.tag}:${tt && tt.lab ? tt.lab : t}`; };

  let L = null; // layout cache
  const zoned = ex.zones !== false && devs.some(d => d.type === 'supply3P' || TYPES[d.type].motor);
  const GW = 40, GH = 48, HH = 26; // grid gutters (wire channels) and zone heading height
  function layout(){
    const Wd = board.clientWidth || host.clientWidth || 340;
    if (!zoned){
      const cols = Wd < 520 ? 2 : Wd < 820 ? 3 : 4;
      let col = 0, y = 6, rowH = 0; const P = {};
      devs.forEach(d => { const T = TYPES[d.type]; const span = Math.min(cols, T.span(d)); if (col + span > cols){ col = 0; y += rowH + 16; rowH = 0; } P[d.id] = {x:col * CW + 8, y, w:span * CW}; rowH = Math.max(rowH, T.h(d)); col += span; });
      return {cols, VW:cols * CW + 16, VH:y + rowH + 10, P, grid:false};
    }
    // zoned: “Power circuit” and “Control circuit” as two grids. Desktop: side by side (power first); phone: power on top.
    const mode = Wd >= 820 ? 'side22' : Wd >= 600 ? 'side12' : 'stack';
    const cols = mode === 'stack' ? 2 : mode === 'side12' ? 3 : 4;
    const Z = {P:{cols:mode === 'side22' ? [2, 3] : mode === 'side12' ? [2] : [0, 1], cap:mode === 'side22' ? 2 : 1}, C:{cols:[0, 1], cap:2}};
    const zoneOf = d => (ex.zone && ex.zone[d.id]) || (TYPES[d.type].zone || ((d.type === 'mcb' || d.type === 'fuse') && d.cfg.poles >= 3 ? 'P' : 'C'));
    const rows = [], P = {}; // rows[r] = {h, kind:'head'|'cells', zone}
    const flow = (zone, list, r0) => { const zc = Z[zone].cols, cap = Z[zone].cap; let col = 0, r = r0; list.forEach(d => { const T = TYPES[d.type], span = Math.min(cap, T.span(d)); if (col + span > zc.length){ col = 0; r++; } if (!rows[r]) rows[r] = {h:0, zone}; rows[r].h = Math.max(rows[r].h, T.h(d)); P[d.id] = {col:zc[0] + col, span, row:r, w:span * CW, zone}; col += span; }); return r + 1; };
    const Pd = devs.filter(d => zoneOf(d) === 'P'), Cd = devs.filter(d => zoneOf(d) !== 'P');
    if (mode === 'stack'){ rows[0] = {h:HH, head:'P'}; const r1 = flow('P', Pd, 1); rows[r1] = {h:HH, head:'C'}; flow('C', Cd, r1 + 1); }
    else { rows[0] = {h:HH, head:'PC'}; flow('P', Pd, 1); flow('C', Cd, 1); }
    let y = GH; const top = [];
    rows.forEach((rw, r) => { top[r] = y; y += rw.h + GH; });
    // vertical gutters: the one on the control side of a contactor (coil + aux terminals) is wider so the control bundle has room
    const gw = []; for (let k = 0; k <= cols; k++) gw[k] = GW;
    Object.keys(P).forEach(id => { const d = byId[id]; if (d.type === 'contactor' && (mode !== 'stack' || P[id].span === 1)) gw[P[id].col] = Math.max(gw[P[id].col], d.blocks.length > 2 ? 76 : 64); });
    const gx0 = []; let acc = 0; for (let k = 0; k <= cols; k++){ gx0[k] = acc; acc += gw[k] + (k < cols ? CW : 0); }
    const colX = c => gx0[c] + gw[c], gxc = k => gx0[k] + gw[k] / 2;
    Object.keys(P).forEach(id => { const p = P[id]; p.x = colX(p.col); p.y = top[p.row]; p.h = rows[p.row].h; });
    const VW = acc, VH = y;
    // zone backgrounds + headings
    const zr = {};
    ['P','C'].forEach(z => { const zc = Z[z].cols, rs = Object.keys(P).map(k => P[k]).filter(p => p.zone === z).map(p => p.row);
      const r0 = Math.min.apply(null, rs.length ? rs : [1]), r1 = Math.max.apply(null, rs.length ? rs : [1]);
      const zl = zc[0], zrc = zc[zc.length - 1], x0 = colX(zl) - gw[zl] / 2 + 3, x1 = colX(zrc) + CW + gw[zrc + 1] / 2 - 3;
      zr[z] = mode === 'stack' ? {x:6, y:top[z === 'P' ? 0 : r0 - 1] - 4, w:VW - 12, h:top[r1] + rows[r1].h - top[z === 'P' ? 0 : r0 - 1] + GH / 2 + 2, hx:VW / 2, hy:top[z === 'P' ? 0 : r0 - 1] + 17}
        : {x:x0, y:top[0] - 4, w:x1 - x0, h:VH - top[0] - GH / 2 + 2, hx:(x0 + x1) / 2, hy:top[0] + 17}; });
    return {cols, VW, VH, P, grid:true, rows, top, colX, gxc, gw, mode, zr, ctlSide: mode === 'stack' ? '' : 'l'};
  }
  // ---- orthogonal wire routing on the grid gutters (horizontal gutters between rows, vertical gutters between columns)
  function router(){
    const R = L.rows.length, gy = g => g === 0 ? GH / 2 : g >= R ? L.VH - GH / 2 : L.top[g] - GH / 2, gx = k => L.gxc(k);
    const used = {h:{}, v:{}};
    const OFF = [0, -7, 7, -14, 14]; // lanes stay inside the gutter; a 6th wire shares a lane
    const offs = (kind, g) => { if (kind !== 'v') return OFF; const n = Math.max(5, Math.floor((L.gw[g] - 12) / 7) | 1), o = [0]; for (let i = 1; o.length < n; i++) o.push(-7 * i, 7 * i); return o; };
    const lane = (kind, g, a, b) => { const u = used[kind][g] || (used[kind][g] = []); const lo = Math.min(a, b) - 4, hi = Math.max(a, b) + 4; let i = 0; for (; i < u.length; i++){ if (!u[i].some(iv => iv[0] < hi && iv[1] > lo)) break; } if (!u[i]) u[i] = []; u[i].push([lo, hi]); const O = offs(kind, g); return O[i % O.length]; };
    const blocked = (k, y1, y2) => { const lo = Math.min(y1, y2), hi = Math.max(y1, y2); return Object.keys(L.P).some(id => { const p = L.P[id]; return p.span > 1 && k > p.col && k < p.col + p.span && p.y < hi && p.y + p.h > lo; }); };
    const pickK = (xa, xb, y1, y2, pref) => { let best = null, bs = 1e9; for (let k = 0; k <= L.cols; k++){ if (blocked(k, y1, y2)) continue; const x = gx(k), sc = Math.abs(x - xa) + Math.abs(x - xb) + (pref != null && k !== pref ? 40 : 0); if (sc < bs){ bs = sc; best = k; } } return best == null ? 0 : best; };
    const gOf = T => T.side ? null : (T.dir < 0 ? T.row : T.row + 1);
    const kOf = T => T.side ? (T.side === 'l' ? T.col : T.col + T.span) : null;
    return (A, B) => {
      const pts = [[A.x, A.y]];
      const gA = gOf(A), gB = gOf(B), kA = kOf(A), kB = kOf(B);
      if (gA != null && gB != null){
        if (gA === gB){ const y = gy(gA) + lane('h', gA, A.x, B.x); pts.push([A.x, y], [B.x, y]); }
        else {
          const yA0 = gy(gA), yB0 = gy(gB), k = pickK(A.x, B.x, yA0, yB0), x = gx(k) + lane('v', k, yA0, yB0);
          const yA = yA0 + lane('h', gA, A.x, x), yB = yB0 + lane('h', gB, x, B.x);
          pts.push([A.x, yA], [x, yA], [x, yB], [B.x, yB]);
        }
      } else if (kA != null && gB != null){
        const yB0 = gy(gB), x = gx(kA) + lane('v', kA, A.y, yB0), yB = yB0 + lane('h', gB, x, B.x);
        pts.push([x, A.y], [x, yB], [B.x, yB]);
      } else if (gA != null && kB != null){
        const yA0 = gy(gA), x = gx(kB) + lane('v', kB, yA0, B.y), yA = yA0 + lane('h', gA, A.x, x);
        pts.push([A.x, yA], [x, yA], [x, B.y]);
      } else { // both side terminals
        if (kA === kB){ const x = gx(kA) + lane('v', kA, A.y, B.y); pts.push([x, A.y], [x, B.y]); }
        else { const g = A.row < B.row ? A.row + 1 : B.row + 1, y0 = gy(g), xa = gx(kA) + lane('v', kA, A.y, y0), xb = gx(kB) + lane('v', kB, y0, B.y), y = y0 + lane('h', g, xa, xb); pts.push([xa, A.y], [xa, y], [xb, y], [xb, B.y]); }
      }
      pts.push([B.x, B.y]);
      // drop zero-length steps, round the corners
      const q = pts.filter((p, i) => !i || p[0] !== pts[i-1][0] || p[1] !== pts[i-1][1]);
      let d = `M${q[0][0]} ${q[0][1]}`;
      for (let i = 1; i < q.length - 1; i++){ const p0 = q[i-1], p1 = q[i], p2 = q[i+1]; const r = Math.min(7, Math.hypot(p1[0]-p0[0], p1[1]-p0[1]) / 2, Math.hypot(p2[0]-p1[0], p2[1]-p1[1]) / 2); const u = [Math.sign(p1[0]-p0[0]), Math.sign(p1[1]-p0[1])], v = [Math.sign(p2[0]-p1[0]), Math.sign(p2[1]-p1[1])]; d += `L${p1[0]-u[0]*r} ${p1[1]-u[1]*r}Q${p1[0]} ${p1[1]} ${p1[0]+v[0]*r} ${p1[1]+v[1]*r}`; }
      d += `L${q[q.length-1][0]} ${q[q.length-1][1]}`;
      return d;
    };
  }
  // IEC 60204-1 style: N light blue, AC control red, DC control dark blue, power phases brown/black/grey
  const powerTerm = id => { const [dv, t] = id.split(':'), d = byId[dv]; if (!d) return false; const ty = d.type;
    return ty === 'supply3P' || ty === 'motor' || ty === 'mpcb' || ((ty === 'contactor' || ty === 'ol') && /^[1-6]$/.test(t)) || (ty === 'softstarter' && /^[LT][123]$/.test(t)) || ((ty === 'mcb' || ty === 'fuse') && d.cfg.poles >= 3); };
  /* «💡 الخطوة الجاية» (window.NH, /assets/next-hint.js): the next wire, measured against ex.solution. Power first, then control in
     the reference order; an alternative contact block (23-24 for 13-14), swapped contact/coil ends or another pole are mapped onto the
     reference before comparing, so a correct alternative is never sent back. Off in a challenge or a hidden-fault round. */
  let nhCtl = null;
  const nhPw = t => powerTerm(t) && !(byId[t.split(':')[0]].type === 'supply3P' && /:N$/.test(t)), nhPP = p => nhPw(p[0]) && nhPw(p[1]);
  const nhSol = (() => { const s = (ex.solution || []).filter(p => byId[p[0].split(':')[0]] && byId[p[1].split(':')[0]]); return s.filter(nhPP).concat(s.filter(p => !nhPP(p))); })();
  function nhUnits(d){
    const T = TYPES[d.type], u = [], id = t => d.id + ':' + t;
    (d.blocks || []).forEach(bl => { if ((bl.k === 'NO' || bl.k === 'NC') && bl.t.length === 2) u.push({k:bl.k, t:bl.t.map(id), sw:true}); else if (bl.k === 'CO' && bl.t.length === 3) u.push({k:'CO', t:bl.t.map(id), sw:false}); });
    if (T.coil) u.push({k:'coil', t:['A1', 'A2'].map(id), sw:true, solo:true});
    if (d.type === 'lamp') u.push({k:'lamp', t:['X1', 'X2'].map(id), sw:true, solo:true});
    if (d.type === 'contactor' || d.type === 'ol' || d.type === 'mpcb' || ((d.type === 'mcb' || d.type === 'fuse') && d.cfg.poles >= 2)){ const n = d.type === 'mcb' || d.type === 'fuse' ? d.cfg.poles : 3; for (let i = 0; i < n; i++) u.push({k:'pole', t:[id(2 * i + 1), id(2 * i + 2)], sw:true}); }
    return u;
  }
  function nhCanon(W){
    const groups = []; devs.forEach(d => { if (d.type === 'tb') TYPES.tb.links(d).forEach(l => groups.push([d.id + ':' + l[0], d.id + ':' + l[1]])); });
    const units = []; devs.forEach(d => nhUnits(d).forEach(u => { u.dev = d.id; units.push(u); }));
    return Object.assign({groups}, NH.canon({sol:nhSol, wires:W, groups, units}));
  }
  function nhIdea(p, R){
    const I = NH.S.idea, rank = [];
    const isNC = (d, t) => (d.blocks || []).some(bl => bl.k === 'NC' && bl.t.includes(t)), isNO = (d, t) => (d.blocks || []).some(bl => bl.k === 'NO' && bl.t.includes(t));
    const netHas = (t, fn) => nhSol.some(q => q.some(x => R.f(x) === R.f(t) && fn(x)));
    for (const x of p){
      const [dv, t] = x.split(':'), d = byId[dv]; if (!d) continue; const T = TYPES[d.type];
      if (nhPP(p)) rank.push([9, I.power]);
      else if (nhPw(x)) rank.push([2, I.feed]);
      else if ((d.type === 'ol' && /^9[5-8]$/.test(t)) || (d.type === 'mpcb')) rank.push([7, I.ol]);
      else if (d.type === 'timer') rank.push([7, I.timer]);
      else if (T.coil && isNC(d, t) && netHas(x, y => { const e = byId[y.split(':')[0]]; return e && e !== d && TYPES[e.type].coil && /^A[12]$/.test(y.split(':')[1]); })) rank.push([8.5, I.interlock]);
      else if (T.coil && isNO(d, t)){ const bl = d.blocks.find(k => k.t.includes(t)); const ends = bl.t.map(y => R.f(d.id + ':' + y)).sort().join('|');
        if (devs.some(e => e.type === 'pb' && (e.blocks || []).some(k => k.k === 'NO' && k.t.map(y => R.f(e.id + ':' + y)).sort().join('|') === ends))) rank.push([8, I.latch]); }
      else if (/^A[12]$/.test(t) && T.coil) rank.push([4, I.coil]);
      else if (d.type === 'pb' || d.type === 'estop'){ if (isNC(d, t)) rank.push([5, I.stop]); else if (isNO(d, t)) rank.push([5, CL.isJog(d) ? I.jog : I.start]); }
      else if (d.type === 'ls') rank.push([5, I.limit]);
      else if (d.type === 'lamp') rank.push([4.5, I.lamp]);
    }
    rank.sort((a, c) => c[0] - a[0]);
    return rank.length ? rank[0][1] : null;
  }
  function nhOff(){ const F = CL.fx; return !!(F && ((F.challenge && F.challenge.active && F.challenge.active.key === opt.key) || (F.faults && F.faults.cur))); }
  function nhUpdate(){
    if (!window.NH || !nhSol.length) return;
    if (!nhCtl){ const ref = host.querySelector('.bn-board'); if (!ref) return; nhCtl = NH.mount(ref, {course:'classic', onTap(s){ pulse(s.kind === 'fix' && s.wid != null ? {w:[s.wid], t:s.hl} : {t:s.hl}); }}); }
    if (nhOff()){ nhCtl.set(null); return; }
    const W = wires.map(w => [w.a, w.b]), C = nhCanon(W);
    const s = NH.net({sol:nhSol, wires:W, cap:2, groups:C.groups, canon:C.canon, raw:C.raw, lab:termLab, idea:p => nhIdea(p, C.R), btn:pwrBtn.textContent.replace(/⚡/g, '').trim()});
    if (s.kind === 'fix') s.wid = wires[s.w].id;
    nhCtl.set(s);
  }
  function wireColor(w, fr){
    const pa = fr.poles(fr.find(w.a)) || fr.poles(fr.find(w.b));
    if (pa && [...pa].some(p => p === 'N' || p === 'M' || p === 'T') && ![...pa].some(p => p in PHASES || p === 'P' || p === 'S')) return '#3a9be0';
    if (pa && pa.has('P') && !dc && !powerTerm(w.a) && !powerTerm(w.b)) return '#1f3f9a';
    if (powerTerm(w.a) || powerTerm(w.b)){ if (pa && pa.has('L2')) return '#1f1f1f'; if (pa && pa.has('L3')) return '#8a8f94'; return '#7b4a21'; }
    return dc ? '#1f3f9a' : '#c62828';
  }
  // crimped ferrule + coloured sleeve where a wire enters a terminal (the wire leaves the screw along the terminal's direction)
  function ferrule(T, col){
    const v = T.side === 'l' ? [-1, 0] : T.side === 'r' ? [1, 0] : [0, T.dir || -1], at = s => `${T.x + v[0] * s} ${T.y + v[1] * s}`;
    return `<path class="bw-fe" d="M${at(3)}L${at(14)}"/><path class="bw-fe-in" d="M${at(4)}L${at(13)}"/><path class="bw-sl" d="M${at(13)}L${at(20)}" stroke="${col}"/>`;
  }
  function wpath(A, B){
    const dy = Math.abs(B.y - A.y), dx = Math.abs(B.x - A.x), k = clamp(30 + dy * 0.35 + dx * 0.12, 30, 120);
    // a wire that leaves against its terminal's direction swings out sideways instead of crossing the device
    const back = T => (T === A ? (B.y - A.y) * A.dir : (A.y - B.y) * B.dir) < -20;
    const side = (T, O) => (T.x <= O.x ? -1 : 1) * Math.min(70, 30 + dy * 0.25);
    const ax = A.x + (back(A) ? side(A, B) : 0), bx = B.x + (back(B) ? side(B, A) : 0);
    return `M${A.x} ${A.y}C${ax} ${A.y + A.dir * k} ${bx} ${B.y + B.dir * k} ${B.x} ${B.y}`;
  }
  function render(){
    if (destroyed) return;
    L = layout();
    const live = powered();
    let res = null;
    if (live){
      res = CL.solve(devs, wires, {trip:true});
      lastRes = res;
      if (res.tripped.length){
        const tr = res.tripped[0], p = tr.poles.map(x => x === 'L1' && nm.L === 'L' ? 'L' : x === 'P' ? '+24V' : x === 'M' ? '0V' : x).join(' and ');
        flash = {wires:new Set(tr.wires), until:Date.now() + 4000};
        msg(`⚡ Short between ${p}${lastAct ? ' ' + lastAct : ''}: ${byId[tr.dev].tag} tripped. Switch off and fix.`, 'bad');
        CL.emit('short', EVB({dev:byId[tr.dev], wires:tr.wires, poles:tr.poles}));
        setTimeout(() => { if (!destroyed) render(); }, 4100);
        res = CL.solve(devs, wires, {trip:true}); lastRes = res;
      }
      if (res.burnt && res.burnt.length){ const b = byId[res.burnt[0].dev]; msg(`🔥 ${b.tag} burned out: it got ${res.burnt[0].V} V and it is rated ${b.cfg.v} V.`, 'bad'); CL.emit('burnt', EVB({dev:b, V:res.burnt[0].V})); }
      devs.forEach(d => { if (isSupply(d)) return; if (d.st.trip && d.st.why && d.st.why !== 'short'){ if (!d.st.noted){ d.st.noted = 1; msg('⚠ ' + CL.tripText(d), 'bad'); } } else d.st.noted = 0; });
    } else lastRes = null;
    { const lv = powered(); devs.forEach(d => { const T = TYPES[d.type], k = d.id; const cur = T.coil ? (lv && d.st.coil ? 1 : 0) : T.motor ? (lv && d.st.run ? d.st.run + (d.st.mode || '') : 0) : null;
        if (cur !== null){ if (prevSt[k] !== undefined && prevSt[k] !== cur) CL.emit(T.coil ? 'coil' : 'motor', EVB({dev:d, on:!!cur, run:lv ? d.st.run : 0, mode:d.st.mode})); prevSt[k] = cur; }
        const tr = d.st.trip ? 1 : 0; if (prevTrip[k] !== undefined && tr && !prevTrip[k]) CL.emit('trip', EVB({dev:d, why:d.st.why})); prevTrip[k] = tr; }); }
    pwrBtn.textContent = powered() ? '⏻ Power off' : '⚡ Power on';
    pwrBtn.classList.toggle('on', powered());
    pwrBtn.setAttribute('aria-pressed', powered() ? 'true' : 'false');
    const TT = {}; let devSvg = '', hitSvg = '';
    if (L.grid){
      const ZN = {P:'Power circuit', C:'Control circuit'};
      ['P','C'].forEach(z => { const r = L.zr[z]; if (!r) return; devSvg += `<rect class="bd-zone bd-zone-${z}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="12"/><text class="bd-zh ar" x="${r.hx}" y="${r.hy}">${ZN[z]}</text>`; });
    }
    devs.forEach(d => {
      const p = L.P[d.id], w = p.w;
      const g = benchDraw(d, {live, en: res ? !!res.energ[d.id] : false, res, w, grid:L.grid, ctlSide: L.ctlSide || '', allowPinStop: !!ex.allowPinStop, byId});
      devSvg += `<g transform="translate(${p.x} ${p.y})" data-cell="${d.id}" data-on="${res && (res.energ[d.id] || (res.mot[d.id] && res.mot[d.id].run)) ? 1 : 0}" data-trip="${d.st.trip ? 1 : 0}"><rect class="bd-cell" x="2" y="0" width="${w - 4}" height="${TYPES[d.type].h(d)}" rx="10"/>${railSvg(w, TYPES[d.type].h(d))}${g.svg}</g>`;
      hitSvg += `<g transform="translate(${p.x} ${p.y})">${g.hit || ''}</g>`;
      Object.keys(g.terms).forEach(n => { const t = g.terms[n]; TT[d.id + ':' + n] = {x:p.x + t.x, y:p.y + t.y, dir:t.dir, side:t.side || '', col:p.col, span:p.span, row:p.row}; });
    });
    const route = L.grid ? router() : wpath;
    const fr = (() => { const cl = devs.map(d => Object.assign({}, d, {st:Object.assign({}, d.st)})); return solveOnce(cl, wires, true); })();
    if (flash && flash.until < Date.now()) flash = null;
    if (errHl && errHl.until < Date.now()) errHl = null;
    let wSvg = '';
    if (ghost && ex.solution){ // the solution as a dashed ghost under the trainee's own wires (never added to the board)
      const groute = L.grid ? router() : wpath, gW = nhSol.slice(0, ghost).map((p, i) => ({id:'g' + i, a:p[0], b:p[1]}));
      const gfr = (() => { const cl = devs.map(d => Object.assign({}, d, {st:Object.assign({}, d.st)})); return solveOnce(cl, gW, true); })();
      gW.forEach(w => { const A = TT[w.a], B = TT[w.b]; if (!A || !B) return; const col = wireColor(w, gfr), pw = col !== '#3a9be0' && (powerTerm(w.a) || powerTerm(w.b)); wSvg += `<path class="bw-ghost${pw ? ' pw' : ''}${w.id === 'g' + (ghost - 1) ? ' cur' : ''}" d="${groute(A, B)}" stroke="${col}"/>`; });
    }
    wires.forEach(w => {
      const A = TT[w.a], B = TT[w.b]; if (!A || !B) return;
      const d = route(A, B), col = wireColor(w, fr), act = res && res.active.has(res.find(w.a));
      const bad = (flash && flash.wires.has(w.id)) || (errHl && errHl.w.has(w.id)), pw = col !== '#3a9be0' && (powerTerm(w.a) || powerTerm(w.b));
      wSvg += `<g class="bw${bad ? ' bad' : ''}${pw ? ' pw' : ''}"><path class="bw-sh" d="${d}" transform="translate(1.5 2.5)"/><path class="bw-o" d="${d}"/><path class="bw-c" d="${d}" stroke="${col}"/><path class="bw-hl" d="${d}"/>${act ? `<path class="bw-flow" d="${d}"/>` : ''}${ferrule(A, col)}${ferrule(B, col)}<path class="bw-hit" d="${d}" data-w="${w.id}" tabindex="0" role="button" aria-label="Wire from ${esc(termLab(w.a))} to ${esc(termLab(w.b))}: tap to remove it"/></g>`;
    });
    let tSvg = '', tHit = '';
    Object.keys(TT).forEach(id => {
      const t = TT[id], hot = res && (() => { const s = res.poles(res.find(id)); return s && [...s].some(p => p !== 'N' && p !== 'M'); })();
      tSvg += `<g class="bt${pend === id ? ' pend' : ''}${hot ? ' hot' : ''}" transform="translate(${t.x} ${t.y})"><circle class="bt-s" r="8.5"/><path class="bt-slot" d="M-4.5 -4.5L4.5 4.5"/></g>`;
      tHit += `<circle class="bt-hit" cx="${t.x}" cy="${t.y}" r="22" data-t="${id}" tabindex="0" role="button" aria-label="Terminal ${esc(termLab(id))}"/><circle class="bt-ring${errHl && errHl.t.has(id) ? ' err' : ''}" cx="${t.x}" cy="${t.y}" r="13"/>`;
    });
    const fsel = document.activeElement && host.contains(document.activeElement) ? ['data-t','data-w','data-act'].map(a => document.activeElement.getAttribute(a) ? `[${a}="${document.activeElement.getAttribute(a)}"]` + (a === 'data-act' ? `[data-dev="${document.activeElement.getAttribute('data-dev')}"]` : '') : '').join('') : '';
    board.innerHTML = `<svg viewBox="0 0 ${L.VW} ${L.VH}" role="group" aria-label="Wiring board">${devSvg}${tSvg}${wSvg}${hitSvg}${tHit}</svg>`; SKIN.attach(board);
    if (fsel){ const el = board.querySelector(fsel); if (el) el.focus({preventScroll:true}); }
    // keep the clock running while something is timing or moving
    const needClock = live && devs.some(d => (d.type === 'timer' && (d.st.coil || d.st.out)) || (d.type === 'cart' || d.type === 'tank') || (['ol','mpcb','mcb','fuse'].indexOf(d.type) > -1 && (d.st.heat > 0 || d.st.I > 0)) || (TYPES[d.type].motor && (d.st.run || d.st.fault || d.st.spd)) || (d.type === 'softstarter' && d.st.v > 0 && (d.st.v < 1 || !d.st.cmd)));
    if (needClock && !timer) timer = setInterval(stepClock, 100);
    if (!needClock && timer){ clearInterval(timer); timer = null; }
    CL.emit('render', EVB({devs, res, live}));
  }
  function stepClock(){
    if (destroyed || !powered()){ clearInterval(timer); timer = null; return; }
    const sp = curSpeed(); let rem = 0.1 * sp; const step = sp > 10 ? 0.5 : 0.1;
    CL.sim.clock = (CL.sim.clock || 0) + rem; // simulated seconds elapsed on powered benches (test hook)
    while (rem > 1e-9){ const dt = Math.min(step, rem); CL.tick(devs, wires, dt, lastRes || CL.solve(devs, wires, {trip:true})); lastRes = CL.solve(devs, wires, {trip:true}); rem -= dt; }
    CL.emit('tick', EVB({devs, speed:sp}));
    render();
  }
  function pulse(hl){ errHl = hl && ((hl.t && hl.t.length) || (hl.w && hl.w.length)) ? {t:new Set(hl.t || []), w:new Set(hl.w || []), until:Date.now() + 3000} : null; if (errHl){ setTimeout(() => { if (!destroyed) render(); }, 0); setTimeout(() => { if (!destroyed) render(); }, 3100); } }
  function showCheck(){
    const pc = EVB({skip:false}); CL.emit('precheck', pc); if (pc.skip) return null;
    const cfg = {}; devs.forEach(d => { if (d.type === 'ol' || d.type === 'mpcb') cfg[d.id] = {Ir:d.cfg.Ir}; if (d.type === 'timer') cfg[d.id] = {t:d.cfg.t, mode:d.cfg.mode}; });
    const r = CL.check(ex, wires, {cfg});
    if (r.ok){
      let h = `<div class="bn-ok"><b>✓ Correct!</b> The wiring is right. ${ex.okMsg || 'Operate the device by hand on the board and watch what the lamp does.'}</div>`;
      r.msgs.forEach(m => { h += `<div class="bn-warn">${m.t}</div>`; });
      resEl.innerHTML = h;
      if (!passed){ passed = true; CL.emit('pass', EVB({first: !(opt.passKey && CL.store.has(opt.passKey)), msgs:r.msgs})); if (opt.onPass) opt.onPass(); }
      return r;
    }
    CL.emit('fail', EVB({msgs:r.msgs}));
    const m0 = r.msgs.find(m => m.lv === 'bad') || r.msgs[0] || {t:''};
    pulse(m0.hl);
    let h = `<div class="bn-bad"><b>✗</b> ${m0.t}</div>`;
    if (r.rows.length && !r.empty){
      h += `<details class="bn-cmp"><summary>Expected vs result ▾</summary><div class="tblw"><table class="tbl"><thead><tr><th class="r">State</th>${r.outs.map(o => `<th>${esc(byId[o].tag)} expected</th><th>result</th>`).join('')}</tr></thead><tbody>`;
      r.rows.forEach(rw => { h += `<tr><td class="r">${esc(rw.c.label)}</td>${r.outs.map((o, j) => { const d = byId[o], mot = TYPES[d.type].motor; const coil = !!TYPES[d.type].coil; const a = mot ? (rw.act[j].run ? (rw.act[j].dir > 0 ? 'forward' : 'reverse') + (rw.act[j].mode === 'Y' ? ' star' : '') : rw.act[j].fault ? 'humming' : rw.act[j].brake ? 'DC braking' : Math.abs(rw.act[j].spd || 0) >= 0.1 ? 'coasting' : 'stopped') : rw.short ? 'short ⚡' : fmtExp(rw.act[j] ? 1 : 0, coil); const e = mot ? (rw.exp[j] ? (rw.exp[j] === 'R' ? 'reverse' : rw.exp[j] === 'F' ? 'forward' : rw.exp[j] === 'Y' ? 'star' : rw.exp[j] === 'D' ? 'delta' : rw.exp[j] === 'S' ? 'fully stopped' : rw.exp[j] === 'C' ? 'coasting' : rw.exp[j] === 'B' ? 'DC braking' : 'turns') : 'stopped') : fmtExp(rw.exp[j], coil); return `<td>${e}</td><td class="${rw.ok[j] ? 'ok' : 'x'}">${a}</td>`; }).join('')}</tr>`; });
      h += '</tbody></table></div></details>';
    }
    resEl.innerHTML = h;
    return r;
  }
  // «وريني الحل» بيظهر توصيلة واحدة مع كل ضغطة بنفس ترتيب «الخطوة الجاية» (القوى الأول)، ولما الحل يكمل الضغطة اللي بعدها تخبّيه
  function setGhost(v){ const N = nhSol.length; ghost = v === true ? N : !v ? 0 : Math.min(+v, N); const sb = host.querySelector('[data-b=sol]'); if (sb){ sb.textContent = ghost === 0 ? 'Show solution' : ghost < N ? `Show wire ${ghost + 1} of ${N}` : 'Hide solution'; sb.setAttribute('aria-pressed', ghost ? 'true' : 'false'); } }
  function setPower(on){ setPower0(on); nhUpdate(); }
  function setPower0(on){
    lastAct = '';
    if (on){
      if (ghost){ setGhost(false); }
      devs.forEach(d => { if (isSupply(d)){ d.st.on = 1; d.st.trip = 0; } if (TYPES[d.type].src && !isSupply(d)) d.st.trip = 0; if (d.type === 'lamp' || d.type === 'prox') d.st.burnt = 0; if (TYPES[d.type].motor){ d.st.burnt = 0; d.st.hot = 0; d.st.fault = ''; } });
      msg('Power is on. Switch off to change a wire.', 'ok');
      CL.emit('power', EVB({on:true}));
      render();
      showCheck();
      render();
    } else {
      devs.forEach(d => { if (isSupply(d)) d.st.on = 0; if (d.st.pin) d.st.pin = 0; });
      msg('Power is off. You can change the wiring.');
      CL.emit('power', EVB({on:false}));
      render();
    }
  }
  function changed(){ passed = false; resEl.innerHTML = ''; persist(); render(); nhUpdate(); }
  function termClick(id){
    if (powered()){ msg('⚡ Switch the power off before you touch terminals or wires.', 'bad'); return; }
    if (!pend){ if (wires.filter(w => w.a === id || w.b === id).length >= 2){ msg(`Terminal ${termLab(id)} already has two wires. You can't put more than two wires under one screw.`, 'bad'); return; } pend = id; msg(`Wire end at <b class="term">${esc(termLab(id))}</b>. Now tap the other terminal.`); render(); return; }
    if (pend === id){ pend = null; msg('Wire cancelled.'); render(); return; }
    if (wires.filter(w => w.a === id || w.b === id).length >= 2){ msg(`Terminal ${termLab(id)} already has two wires. You can't put more than two wires under one screw.`, 'bad'); return; }
    if (wires.some(w => (w.a === pend && w.b === id) || (w.a === id && w.b === pend))){ msg('That wire already exists.'); pend = null; render(); return; }
    const w = addW(pend, id); hist.push({op:'add', w});
    CL.emit('wire', EVB({a:pend, b:id, n:wires.length}));
    msg(`✓ Wire connected from <b class="term">${esc(termLab(pend))}</b> to <b class="term">${esc(termLab(id))}</b>. Tap it to remove it.`);
    pend = null; changed();
  }
  function cut(id){
    if (powered()){ msg('⚡ Switch the power off before you remove a wire.', 'bad'); return; }
    const w = wires.find(x => x.id === id); if (!w) return;
    wires = wires.filter(x => x !== w); hist.push({op:'del', w});
    CL.emit('unwire', EVB({a:w.a, b:w.b, n:wires.length}));
    msg(`Wire removed (${esc(termLab(w.a))} ↔ ${esc(termLab(w.b))}). “↶ Undo” brings it back.`); changed();
  }
  function undo(){
    if (powered()){ msg('⚡ Switch the power off first.', 'bad'); return; }
    pend = null; const h = hist.pop();
    if (!h){ msg('Nothing to undo.'); render(); return; }
    if (h.op === 'add') wires = wires.filter(x => x.id !== h.w.id);
    else if (h.op === 'del') wires.push(h.w);
    else wires = h.prev;
    CL.emit(h.op === 'del' ? 'wire' : 'unwire', EVB({undo:true, n:wires.length}));
    msg('↶ Went back one step.'); changed();
  }
  function setAll(list, why){
    if (powered()) setPower(false);
    hist.push({op:'set', prev:wires.slice()}); pend = null; wires = []; list.forEach(p => addW(p[0], p[1])); CL.emit(list.length ? 'wire' : 'unwire', EVB({set:true, n:wires.length})); msg(why); changed();
  }
  const ANIM_MS = 700;
  function moveCart(d){
    const from = d.st.x, to = from > 0.5 ? 0 : 1, t0 = performance.now();
    if (anim) cancelAnimationFrame(anim);
    lastAct = to ? 'when the cart arrived' : 'when the cart returned';
    const step = now => { const k = Math.min(1, (now - t0) / ANIM_MS); d.st.x = from + (to - from) * (k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2) / 2); d.st.a = CL.lsOperatedAt(d.st.x) || d.st.x > 0.9 ? 1 : 0; if (k >= 1){ d.st.x = to; d.st.a = to; } render(); if (k < 1) anim = requestAnimationFrame(step); else anim = null; };
    anim = requestAnimationFrame(step);
  }
  function act(id, a, down){
    const d = byId[id]; if (!d) return;
    const T = d.type;
    const relJog = () => { if (!CL.isJog(d)) return; d.st.mid = 1; if (powered()){ lastRes = CL.solve(devs, wires, {trip:true}); } d.st.mid = 0; }; // break-before-make: the NO opens before the NC closes again
    if (a === 'press'){ d.st.p = down ? 1 : 0; lastAct = down ? `when you pressed ${d.tag}` : ''; if (!down) relJog(); }
    else if (a === 'pin'){ d.st.pin = d.st.pin ? 0 : 1; if (!d.st.pin) relJog(); lastAct = d.st.pin ? `when you held ${d.tag} pressed` : ''; msg(d.st.pin ? `${d.tag} is now held pressed without you holding it. Press “release” to let it go.` : `Released ${d.tag}.`); }
    else if (a === 'latch'){ d.st.p = d.st.p ? 0 : 1; lastAct = d.st.p ? `when you pressed ${d.tag}` : ''; msg(d.st.p ? `${d.tag} is pressed and latched. Tap it again to “twist” it out.` : `Twisted ${d.tag} so it returned.`); }
    else if (a === 'selL' || a === 'selR'){ d.st.pos = clamp(d.st.pos + (a === 'selR' ? 1 : -1), 0, d.cfg.pos.length - 1); lastAct = `when you turned ${d.tag} to ${d.cfg.pos[d.st.pos]}`; }
    else if (a === 'cart'){ moveCart(d); return; }
    else if (a === 'latchA'){ d.st.a = d.st.a ? 0 : 1; d.st.x = d.st.a ? 1 : 0; if (d.type === 'level') d.st.lvl = d.cfg.below ? (d.st.a ? Math.max(0, d.cfg.at - 0.1) : Math.min(1, d.cfg.at + (d.cfg.hyst || 0.05) + 0.1)) : (d.st.a ? Math.min(1, d.cfg.at + 0.1) : Math.max(0, d.cfg.at - (d.cfg.hyst || 0.05) - 0.1)); lastAct = d.st.a ? (d.type === 'prox' ? `when the object reached ${d.tag}` : `when ${d.tag} reached its setting`) : ''; }
    else if (a === 'mcb'){ setPower(!powered()); return; }
    else if (a === 'brk'){ if (d.st.trip){ if (d.type === 'mpcb' && d.st.heat >= 0.6){ msg('The MPCB is still hot. Wait a little for it to cool, then switch it on.', 'bad'); return; } d.st.trip = 0; d.st.why = ''; d.st.heat = 0; d.st.on = 1; msg(`Reset ${d.tag} (ON).`); } else d.st.on = d.st.on ? 0 : 1; }
    else if (a === 'fuse'){ if (!d.st.trip){ msg('The fuse is fine.'); return; } d.st.trip = 0; d.st.heat = 0; d.st.why = ''; msg('✓ Replaced the fuse with a new one.'); }
    else if (a === 'tUp' || a === 'tDn'){ d.cfg.t = clamp(r1(d.cfg.t + (a === 'tUp' ? (d.cfg.t >= 10 ? 5 : 1) : (d.cfg.t > 10 ? -5 : -1))), 1, 60); msg(`Set ${d.tag} to ${d.cfg.t} seconds.`); if (!powered()){ passed = false; resEl.innerHTML = ''; } }
    else if (a === 'tMode'){ if (powered()){ msg('⚡ Switch the power off before you change the timer function.', 'bad'); return; } const ms = ['on','off','cyc']; d.cfg.mode = ms[(ms.indexOf(d.cfg.mode) + 1) % ms.length]; resetDev(d); msg(`${d.tag} is now in mode ${CL.TIMER_MODES_AR[d.cfg.mode]}.`); passed = false; resEl.innerHTML = ''; }
    else if (a === 'olReset'){ if (!d.st.trip){ msg('The overload isn\'t tripped.'); return; } if (d.st.heat >= 0.6 && d.st.why !== 'test'){ msg(`The overload is still hot (${Math.round(d.st.heat * 100)}%). Wait a little for it to cool, then press Reset.`, 'bad'); return; } d.st.trip = 0; d.st.why = ''; msg('✓ Reset: 95-96 closed again and 97-98 opened.'); }
    else if (a === 'olTest'){ d.st.trip = 1; d.st.why = 'test'; }
    else if (a === 'ssFault'){ TYPES.softstarter.apply(d, {fault:1}); msg(`⚠ ${d.tag} fault (FAULT): the thyristors switched off, 95-96 opened and 97-98 closed. Press RESET after you fix the cause.`, 'bad'); }
    else if (a === 'ssReset'){ if (!d.st.fault){ msg(`${d.tag} has no fault.`); return; } TYPES.softstarter.apply(d, {reset:1}); msg(`✓ RESET: ${d.tag} is ready again.`); }
    else if (a === 'irUp' || a === 'irDn'){ d.cfg.Ir = clamp(r1(d.cfg.Ir + (a === 'irUp' ? 0.5 : -0.5)), 1, 12); msg(`Set Ir to ${d.cfg.Ir}A.`); if (!powered()){ passed = false; resEl.innerHTML = ''; } }
    void T;
    render();
  }
  // events
  const onDown = e => {
    const a = e.target.closest('[data-act]'); if (!a || !board.contains(a)) return;
    e.preventDefault();
    const k = a.dataset.act, id = a.dataset.dev;
    if (k === 'press'){ held.set(e.pointerId, id); act(id, 'press', true); }
    else act(id, k);
  };
  const onUp = e => { if (held.has(e.pointerId)){ const id = held.get(e.pointerId); held.delete(e.pointerId); act(id, 'press', false); } };
  board.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
  board.addEventListener('click', e => {
    const t = e.target.closest('[data-t]'); if (t){ termClick(t.dataset.t); return; }
    const w = e.target.closest('[data-w]'); if (w){ if (pend){ msg('Pick a terminal, not a wire. Or tap the same terminal to cancel.'); return; } cut(+w.dataset.w); }
  });
  board.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Delete' && e.key !== 'Backspace') return;
    const a = e.target.closest('[data-act]');
    if (a){ e.preventDefault(); if (e.repeat) return; if (a.dataset.act === 'press') act(a.dataset.dev, 'press', true); else act(a.dataset.dev, a.dataset.act); return; }
    const t = e.target.closest('[data-t]'); if (t && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); termClick(t.dataset.t); return; }
    const w = e.target.closest('[data-w]'); if (w){ e.preventDefault(); cut(+w.dataset.w); }
  });
  board.addEventListener('keyup', e => { const a = e.target.closest('[data-act="press"]'); if (a && (e.key === 'Enter' || e.key === ' ')) act(a.dataset.dev, 'press', false); });
  host.querySelector('.bn-tools').addEventListener('click', e => {
    const b = e.target.closest('[data-b]'); if (!b) return;
    if (b.dataset.b === 'pwr') setPower(!powered());
    else if (b.dataset.b === 'undo') undo();
    else if (b.dataset.b === 'clear'){ if (powered()) setPower(false); devs.forEach(d => { if (d.st.pin) d.st.pin = 0; }); setGhost(false); if (opt.key) CL.store.bench(opt.key, null); if (opt.onReset) opt.onReset(); passed = false; CL.emit('clear', EVB({})); if (!wires.length){ resEl.innerHTML = ''; msg('The board is empty; starting fresh.'); render(); return; } setAll([], 'Cleared all wires and started fresh. “↶ Undo” brings them back.'); }
    else if (b.dataset.b === 'sol'){ if (powered()){ msg('⚡ Switch the power off first.', 'bad'); return; } const N = nhSol.length; setGhost(ghost >= N ? 0 : ghost + 1); if (ghost) CL.emit('hint', EVB({})); const p = nhSol[ghost - 1]; msg(!ghost ? 'Solution hidden.' : `Wire ${ghost} of ${N}: from ${termLab(p[0])} to ${termLab(p[1])} (the bold dashed line). Wire it yourself, then press again for the next one.` + (ghost === N ? ' That was the last wire.' : '')); render(); }
    else if (b.dataset.b === 'spd'){ speed = speed === 1 ? 10 : speed === 10 ? 60 : 1; spdBtn.textContent = '⏩ ×' + speed; msg(speed === 1 ? 'Time at normal speed.' : `Time runs ${speed} times faster: timers, overloads and the cart move faster so you don't have to wait.`); }
  });
  let lastCols = 0;
  const layoutKey = () => { const W = board.clientWidth || 340; return zoned ? (W >= 820 ? 4 : W >= 600 ? 3 : 2) : (W < 520 ? 2 : W < 820 ? 3 : 4); };
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { const c = layoutKey(); if (c !== lastCols){ lastCols = c; render(); } }) : null;
  if (ro) ro.observe(board);
  api = {
    devs, byId, wires: () => wires.map(w => [w.a, w.b]),
    wire(a, b){ pend = null; termClick(a); termClick(b); }, ghost: setGhost, solution(){ return (ex.solution || []).slice(); },
    power: setPower, act, check: showCheck,
    destroy(){ CL.emit('destroy', EVB({})); destroyed = true; skinUnsub(); if (timer) clearInterval(timer); if (anim) cancelAnimationFrame(anim); if (ro) ro.disconnect(); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); }
  };
  const skinUnsub = SKIN.sub(() => { if (!destroyed) render(); }); SKIN.preload(devs);
  CL.test.bench = api;
  render();
  nhUpdate();
  CL.emit('exercise', EVB({devs, passed: !!(opt.passKey && CL.store.has(opt.passKey))}));
  return api;
};
// test hook (not reachable from the UI): wire a list of [a, b] pairs on the bench that was created last
CL.test = {bench:null, wire(list){ const b = CL.test.bench; if (!b) return 0; let n = 0; (list || b.solution()).forEach(p => { b.wire(p[0], p[1]); n++; }); return n; }};

/* =========================== lesson 9 additions: control transformer, rectifier (DC injection), mechanical brake, soft starter =========================== */
// 230 → 24 V control transformer: primary H1-H2 is a 230 V load, the secondary X1-X2 becomes a 24 V~ source (poles S/T) once the primary is live
CL.defineType('xfmr', {
  def:{v:230, vs:24, va:'100 VA', model:'ABL6'}, coil:true,
  terms(){ return [{n:'H1', lab:'H1 (230V)'}, {n:'H2', lab:'H2'}, {n:'X1', lab:'X1 (24V)'}, {n:'X2', lab:'X2 (0V)'}]; },
  init(){ return {coil:0, burnt:0, trip:0}; },
  loads(d){ return [{a:'H1', b:'H2', k:'coil', v:d.cfg.v}]; },
  src(d, force){ return (force || (d.st.coil && !d.st.trip)) ? [{t:'X1', p:'S'}, {t:'X2', p:'T'}] : []; },
  states(){ return [{label:'Primary winding not energised', st:{coil:0}}, {label:'230V on H1-H2: 24V on X1-X2', st:{coil:1}}]; },
  ctl:'hold', holdLabel:'Press and hold: apply 230V to the primary H1-H2', art(d){ return CL.art.xfmrArt(d); }, h(){ return 208; },
  bench(d, ctx){
    const w = ctx.w || CW, on = !!ctx.en, terms = {};
    let s = cellHead(d, 'Control transformer 230/' + d.cfg.vs + 'V', w);
    const place = (list, y, dir) => list.forEach((t, i) => { const x = w / 2 + (i - (list.length - 1) / 2) * 60; terms[t] = {x, y, dir}; s += screwLab(x, y, t, dir); });
    place(['H1', 'H2'], 44, -1); place(['X1', 'X2'], 172, 1);
    s += `<rect x="30" y="58" width="${w - 60}" height="100" rx="6" fill="#4b5560" stroke="#242a30"/><rect x="42" y="70" width="${w - 84}" height="76" rx="4" fill="#2b3238" stroke="#1a1f23"/>`;
    s += `<rect x="60" y="80" width="${w - 120}" height="30" rx="3" fill="#7a5230" stroke="#3d2814"/>${[0,1,2,3,4,5].map(i => `<path d="M${64 + i * 8} 82V108" stroke="#b87333" stroke-width="2"/>`).join('')}`;
    s += `<text x="${w / 2}" y="124" font-size="8" fill="#e3e9ec" text-anchor="middle" font-weight="700">${esc(d.cfg.model)} · ${esc(d.cfg.va)}</text><text x="${w / 2}" y="136" font-size="7.5" fill="${on ? '#5cff7a' : '#8aa0ad'}" text-anchor="middle" font-weight="700">${on ? d.cfg.vs + 'V~ on X1-X2 ✓' : 'PRI 230V → SEC ' + d.cfg.vs + 'V'}</text>`;
    return {svg:s, hit:'', terms};
  }
});
CL.art.xfmrArt = function(d){
  const on = !!(d.st && d.st.coil);
  return `<svg viewBox="0 0 440 230" role="img" aria-label="230/24 V control transformer"><g style="color:var(--ink)">
    <rect x="30" y="30" width="190" height="170" rx="8" fill="#4b5560" stroke="#242a30"/><rect x="44" y="44" width="162" height="142" rx="5" fill="#2b3238"/>
    <rect x="70" y="70" width="110" height="60" rx="4" fill="#7a5230" stroke="#3d2814"/>${[0,1,2,3,4,5,6,7,8].map(i => `<path d="M${76 + i * 12} 72V128" stroke="#b87333" stroke-width="3"/>`).join('')}
    <rect x="60" y="60" width="130" height="12" fill="#6b7279"/><rect x="60" y="128" width="130" height="12" fill="#6b7279"/>
    <text x="125" y="156" font-size="10" fill="#e3e9ec" text-anchor="middle" font-weight="700">ABL6 · 100 VA</text><text x="125" y="170" font-size="9" fill="#9fb0ba" text-anchor="middle">PRI 230 V · SEC 24 V</text>
    ${['H1','H2'].map((t, i) => `<circle cx="${80 + i * 90}" cy="38" r="6" fill="#d8dbdd" stroke="#555"/><text x="${80 + i * 90}" y="24" font-size="10" text-anchor="middle" fill="currentColor" font-weight="700">${t}</text>`).join('')}
    ${['X1','X2'].map((t, i) => `<circle cx="${80 + i * 90}" cy="192" r="6" fill="#d8dbdd" stroke="#555"/><text x="${80 + i * 90}" y="214" font-size="10" text-anchor="middle" fill="currentColor" font-weight="700">${t}</text>`).join('')}
    <g class="${on ? 'sy-on' : ''}"><text class="sy-tag" x="262" y="26">${esc(d.tag)} · IEC symbol</text>
    <path class="sy" d="M300 44V74M300 160V190M380 44V74M380 160V190"/><circle class="sy" cx="300" cy="102" r="26"/><circle class="sy" cx="300" cy="132" r="26"/>
    <text class="sy-n" x="268" y="106">230V</text><text class="sy-n" x="268" y="150">24V</text>
    <circle class="sy-t" cx="300" cy="44" r="4"/><circle class="sy-t" cx="300" cy="190" r="4"/><text class="sy-n" x="308" y="48">H1</text><text class="sy-n" x="308" y="196">X1</text>
    <circle class="sy-t" cx="380" cy="44" r="4"/><circle class="sy-t" cx="380" cy="190" r="4"/><text class="sy-n" x="388" y="48">H2</text><text class="sy-n" x="388" y="196">X2</text>
    <path class="sy" d="M380 74V88M380 160V146" style="stroke-dasharray:4 3"/><text class="sy-s" x="340" y="226" text-anchor="middle">${on ? 'secondary at 24V~' : 'secondary not energised'}</text></g></g></svg>`;
};
// rectifier for DC injection braking: AC1-AC2 is a 230 V load, DC+/DC- become a DC source (poles P/M) while it is fed
CL.defineType('rectifier', {
  def:{v:230, vdc:24, model:'BR', idc:'20 A'}, coil:true,
  terms(){ return [{n:'AC1', lab:'AC1 (~)'}, {n:'AC2', lab:'AC2 (~)'}, {n:'DC+', lab:'DC +'}, {n:'DC-', lab:'DC −'}]; },
  init(){ return {coil:0, burnt:0, trip:0}; },
  loads(d){ return [{a:'AC1', b:'AC2', k:'coil', v:d.cfg.v}]; },
  src(d, force){ return (force || (d.st.coil && !d.st.trip)) ? [{t:'DC+', p:'P'}, {t:'DC-', p:'M'}] : []; },
  states(){ return [{label:'No AC voltage on AC1-AC2', st:{coil:0}}, {label:'230V~ on AC1-AC2: DC voltage on DC+ / DC−', st:{coil:1}}];},
  ctl:'hold', holdLabel:'Press and hold: apply AC to AC1-AC2', art(d){ return CL.art.rectArt(d); }, h(){ return 208; },
  bench(d, ctx){
    const w = ctx.w || CW, on = !!ctx.en, terms = {};
    let s = cellHead(d, 'DC braking rectifier', w);
    const place = (list, y, dir) => list.forEach((t, i) => { const x = w / 2 + (i - (list.length - 1) / 2) * 60; terms[t] = {x, y, dir}; s += screwLab(x, y, t, dir); });
    place(['AC1', 'AC2'], 44, -1); place(['DC+', 'DC-'], 172, 1);
    s += `<rect x="30" y="58" width="${w - 60}" height="100" rx="6" fill="#2b3238" stroke="#1a1f23"/><rect x="${w / 2 - 34}" y="70" width="68" height="40" rx="3" fill="#d9dcde" stroke="#7d8388"/>`;
    s += `<path d="M${w / 2 - 20} 90h12l8 -8v16l-8 -8M${w / 2 + 8} 90h12M${w / 2 + 2} 82v16" stroke="#222" stroke-width="2" fill="none"/>`;
    s += `<text x="${w / 2}" y="124" font-size="8" fill="#e3e9ec" text-anchor="middle" font-weight="700">BRIDGE ${esc(d.cfg.idc)} · ${d.cfg.vdc} V DC</text><text x="${w / 2}" y="138" font-size="7.5" fill="${on ? '#5cff7a' : '#8aa0ad'}" text-anchor="middle" font-weight="700">${on ? 'DC ready on + / − ✓' : 'AC IN → DC OUT'}</text>`;
    s += `<circle cx="${w / 2 - 50}" cy="130" r="4" fill="${on ? '#36e070' : '#1f4a2a'}"/>`;
    return {svg:s, hit:'', terms};
  }
});
CL.art.rectArt = function(d){
  const on = !!(d.st && d.st.coil);
  return `<svg viewBox="0 0 440 230" role="img" aria-label="DC braking rectifier"><g style="color:var(--ink)">
    <rect x="30" y="40" width="190" height="150" rx="8" fill="#2b3238" stroke="#1a1f23"/><rect x="60" y="70" width="130" height="70" rx="4" fill="#d9dcde" stroke="#7d8388"/>
    <path d="M80 105h22l12 -12v24l-12 -12M136 105h22M126 93v24M146 93v24" stroke="#222" stroke-width="2.5" fill="none"/>
    <text x="125" y="162" font-size="10" fill="#e3e9ec" text-anchor="middle" font-weight="700">BRIDGE 20 A · DC 24 V</text><text x="125" y="176" font-size="8.5" fill="#9fb0ba" text-anchor="middle">a resistor limits the braking current</text>
    ${['AC1','AC2'].map((t, i) => `<circle cx="${80 + i * 90}" cy="46" r="6" fill="#d8dbdd" stroke="#555"/><text x="${80 + i * 90}" y="30" font-size="10" text-anchor="middle" fill="currentColor" font-weight="700">${t}</text>`).join('')}
    ${['DC+','DC−'].map((t, i) => `<circle cx="${80 + i * 90}" cy="184" r="6" fill="#d8dbdd" stroke="#555"/><text x="${80 + i * 90}" y="208" font-size="10" text-anchor="middle" fill="currentColor" font-weight="700">${t}</text>`).join('')}
    <g class="${on ? 'sy-on' : ''}"><text class="sy-tag" x="262" y="26">${esc(d.tag)} · IEC symbol</text>
    <rect class="sy" x="290" y="70" width="100" height="70"/><path class="sy" d="M290 140L390 70"/><path class="sy" d="M300 86q6 -8 12 0t12 0" style="stroke-width:2"/><path class="sy" d="M356 120h22M356 128h22" style="stroke-width:2"/>
    <path class="sy" d="M310 44V70M370 44V70M310 140V166M370 140V166"/>
    <circle class="sy-t" cx="310" cy="44" r="4"/><circle class="sy-t" cx="370" cy="44" r="4"/><circle class="sy-t" cx="310" cy="166" r="4"/><circle class="sy-t" cx="370" cy="166" r="4"/>
    <text class="sy-n" x="318" y="48">AC1</text><text class="sy-n" x="378" y="48">AC2</text><text class="sy-n" x="318" y="172">DC+</text><text class="sy-n" x="378" y="172">DC−</text>
    <text class="sy-s" x="340" y="198" text-anchor="middle">${on ? 'DC out' : 'stopped'}</text></g></g></svg>`;
};
// electromagnetic (spring-applied) brake: the coil A1-A2 releases the brake; no voltage = brake applied, the linked motor stops at once
CL.defineType('brake', {
  def:{v:230, motor:'M1', model:'BFK458'}, coil:true,
  terms(){ return [{n:'A1'}, {n:'A2'}]; },
  init(){ return {coil:0, burnt:0}; },
  loads(d){ return [{a:'A1', b:'A2', k:'coil', v:d.cfg.v}]; },
  states(){ return [{label:'Coil de-energised: brake applied (springs)', st:{coil:0}}, {label:'Coil energised: brake released', st:{coil:1}}]; },
  ctl:'hold', holdLabel:'Press and hold: energise brake coil A1-A2', art(d){ return CL.art.brakeArt(d); }, h(){ return 208; },
  bench(d, ctx){
    const w = ctx.w || CW, on = !!ctx.en, terms = {};
    let s = cellHead(d, 'Electromagnetic brake ' + esc(d.cfg.motor), w);
    [['A1', 55], ['A2', 115]].forEach(([t, x]) => { terms[t] = {x, y:44, dir:-1}; s += screwLab(x, 44, t, -1); });
    s += CL.art.brakeDisc(w / 2, 118, on, 0.9) + `<text class="ar" x="${w / 2}" y="190" font-size="10" text-anchor="middle" fill="${on ? GOOD : 'var(--bad)'}" font-weight="700">${on ? 'brake released: motor free' : 'brake applied on ' + esc(d.cfg.motor)}</text>`;
    return {svg:s, hit:'', terms};
  }
});
CL.art.brakeDisc = function(cx, cy, released, k){
  k = k || 1; const R = 34 * k, g = released ? 9 : 0;
  return `<g><circle cx="${cx}" cy="${cy}" r="${R}" fill="#8a9096" stroke="#3a3e41" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${R * 0.4}" fill="#cfd2d4" stroke="#3a3e41"/>${[0,1,2,3].map(i => `<circle cx="${cx + R * 0.68 * Math.cos(i * Math.PI / 2 + 0.4)}" cy="${cy + R * 0.68 * Math.sin(i * Math.PI / 2 + 0.4)}" r="${3 * k}" fill="#3a3e41"/>`).join('')}
    <rect x="${cx - R - 16 * k - g}" y="${cy - 14 * k}" width="${12 * k}" height="${28 * k}" rx="2" fill="${released ? '#5d7f96' : '#c0352b'}" stroke="#222"/><rect x="${cx + R + 4 * k + g}" y="${cy - 14 * k}" width="${12 * k}" height="${28 * k}" rx="2" fill="${released ? '#5d7f96' : '#c0352b'}" stroke="#222"/>
    <path d="M${cx - R - 22 * k - g} ${cy}h-${10 * k}M${cx + R + 16 * k + g} ${cy}h${10 * k}" stroke="#555" stroke-width="${3 * k}"/>
    <rect x="${cx - 16 * k}" y="${cy + R + 6 * k}" width="${32 * k}" height="${14 * k}" rx="2" fill="${released ? '#ffd24d' : '#cfd2d4'}" stroke="#8a9096"/><text x="${cx}" y="${cy + R + 16 * k}" font-size="${8 * k}" text-anchor="middle" fill="#222" font-weight="700">COIL</text></g>`;
};
CL.art.brakeArt = function(d){
  const on = !!(d.st && d.st.coil);
  return `<svg viewBox="0 0 440 230" role="img" aria-label="Electromagnetic brake on a hoist motor"><g style="color:var(--ink)">
    <rect x="20" y="70" width="110" height="60" rx="10" fill="#5d7f96" stroke="#2d4352"/><text x="75" y="104" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">M 3~</text>
    <rect x="130" y="94" width="40" height="12" fill="#aab1b6" stroke="#555"/>${CL.art.brakeDisc(205, 100, on, 1)}
    <text class="ar" x="110" y="180" font-size="11" text-anchor="middle" fill="${on ? GOOD : 'var(--bad)'}" font-weight="700">${on ? 'coil energised: brake released, shaft free' : 'no voltage: the springs apply the brake to the shaft'}</text>
    <g class="${on ? 'sy-on' : ''}"><text class="sy-tag" x="282" y="26">${esc(d.tag)} · IEC symbol</text>
    <path class="sy" d="M330 44V74M330 110V140"/><rect class="sy" x="312" y="74" width="36" height="36"/><path class="sy" d="M348 92h18M366 80v24M372 80v24" style="stroke-width:2"/>
    <circle class="sy-t" cx="330" cy="44" r="4"/><circle class="sy-t" cx="330" cy="140" r="4"/><text class="sy-n" x="338" y="48">A1</text><text class="sy-n" x="338" y="146">A2</text>
    <text class="sy-s" x="340" y="170" text-anchor="middle">brake coil: energised = released</text></g></g></svg>`;
};
// soft starter: thyristors ramp the voltage L1-3 → T1-3 (vInit → 100 % over tRamp), relays 13-14 (top of ramp / bypass), 23-24 (run), 95-96 / 97-98 (fault)
CL.SS_PHASE_AR = {off:'stopped', ramp:'ramping up (Ramp)', run:'running 100%', down:'ramping down', fault:'fault'};
CL.defineType('softstarter', {
  def:{v:230, model:'ATS01', In:9, ctl:'2w', vInit:0.3, tRamp:3, tDown:0, ilim:3.5}, coil:true, zone:'P',
  terms(){ return [{n:'L1', lab:'1/L1'}, {n:'L2', lab:'3/L2'}, {n:'L3', lab:'5/L3'}, {n:'T1', lab:'2/T1'}, {n:'T2', lab:'4/T2'}, {n:'T3', lab:'6/T3'}, {n:'A1'}, {n:'A2'}, {n:'IN1', lab:'IN1 RUN'}, {n:'IN2', lab:'IN2 STOP'}, {n:'13'}, {n:'14'}, {n:'23'}, {n:'24'}, {n:'95'}, {n:'96'}, {n:'97'}, {n:'98'}]; },
  init(){ return {coil:0, in1:0, in2:0, cmd:0, run:0, v:0, top:0, fault:0, phase:'off', burnt:0}; },
  loads(d){ return [{a:'IN1', b:'A2', k:'in', v:d.cfg.v}, {a:'IN2', b:'A2', k:'in', v:d.cfg.v}, {a:'A1', b:'A2', k:'coil', v:d.cfg.v}]; },
  links(d, force){
    const s = d.st, a = [];
    if (force || s.v > 0) a.push(['L1','T1'], ['L2','T2'], ['L3','T3']);
    if (force || s.top) a.push(['13','14']);
    if (force || s.run) a.push(['23','24']);
    if (force || !s.fault) a.push(['95','96']);
    if (force || s.fault) a.push(['97','98']);
    return a;
  },
  onSolve(d, res){
    const s = d.st, e = res.energT || {}; let ch = false;
    const in1 = e[d.id + ':IN1'] ? 1 : 0, in2 = e[d.id + ':IN2'] ? 1 : 0;
    if (in1 !== s.in1 || in2 !== s.in2){ s.in1 = in1; s.in2 = in2; ch = true; }
    let cmd = d.cfg.ctl === '3w' ? (s.in2 && (s.in1 || s.cmd) ? 1 : 0) : (s.in1 ? 1 : 0);
    if (!s.coil || s.fault) cmd = 0;
    if (cmd !== s.cmd){ s.cmd = cmd; ch = true; }
    if (!cmd && !(d.cfg.tDown > 0) && (s.v > 0 || s.top)){ s.v = 0; s.top = 0; s.phase = s.fault ? 'fault' : 'off'; ch = true; }
    if (cmd && s.v === 0){ s.v = d.cfg.vInit; s.phase = 'ramp'; ch = true; }
    const run = cmd ? 1 : 0; if (run !== s.run){ s.run = run; ch = true; }
    return ch;
  },
  onCoil(d, on){ if (!on){ Object.assign(d.st, {cmd:0, run:0, v:0, top:0, phase:d.st.fault ? 'fault' : 'off'}); } },
  tick(d, dt){
    const s = d.st, v0 = s.v, t0 = s.top;
    if (s.cmd){ if (s.v < 1){ s.v = r3(Math.min(1, Math.max(s.v, d.cfg.vInit) + dt * (1 - d.cfg.vInit) / Math.max(0.1, d.cfg.tRamp))); } s.phase = s.v >= 1 ? 'run' : 'ramp'; if (s.v >= 1) s.top = 1; }
    else if (s.v > 0){ s.v = d.cfg.tDown > 0 ? r3(Math.max(0, s.v - dt / d.cfg.tDown)) : 0; s.phase = s.v > 0 ? 'down' : (s.fault ? 'fault' : 'off'); s.top = 0; }
    return s.v !== v0 || s.top !== t0;
  },
  apply(d, s){ s = s || {}; if (s.fault){ Object.assign(d.st, {fault:1, cmd:0, run:0, v:0, top:0, phase:'fault'}); } else if (s.reset){ d.st.fault = 0; d.st.phase = 'off'; } else { ['vInit','tRamp','ilim','ctl','tDown'].forEach(k => { if (k in s) d.cfg[k] = s[k]; }); Object.keys(s).forEach(k => { if (['vInit','tRamp','ilim','ctl','tDown'].indexOf(k) < 0) d.st[k] = s[k]; }); } },
  states(){ return [{label:'No run command', st:{cmd:0, v:0, run:0, top:0}}, {label:'ramping up (Ramp)', st:{cmd:1, v:0.5, run:1, top:0}}, {label:'At 100% (top of ramp)', st:{cmd:1, v:1, run:1, top:1}}, {label:'fault', st:{cmd:0, v:0, run:0, top:0, fault:1}}]; },
  span(){ return 2; }, h(){ return 236; }, art(d){ return CL.art.ssArt(d); },
  bench(d, ctx){
    const w = ctx.w || CW * 2, s0 = d.st, terms = {}, en = !!ctx.en, H = 236, c = w < 300;
    let s = '';
    const xm = i => (c ? 50 : 110) + i * (c ? 36 : 60);
    [['L1','1/L1'],['L2','3/L2'],['L3','5/L3']].forEach(([n, lab], i) => { terms[n] = {x:xm(i), y:44, dir:-1}; s += screwLab(xm(i), 44, lab, -1); });
    [['T1','2/T1'],['T2','4/T2'],['T3','6/T3']].forEach(([n, lab], i) => { terms[n] = {x:xm(i), y:H - 30, dir:1}; s += screwLab(xm(i), H - 30, lab, 1); });
    const left = ['A1','A2','IN1','IN2','13','14'], right = ['23','24','95','96','97','98'];
    left.forEach((n, i) => { const y = 60 + i * 24; terms[n] = {x:16, y, dir:0, side:'l'}; s += `<text x="30" y="${y + 4}" font-size="9" font-weight="700" fill="#eee">${n}</text>`; });
    right.forEach((n, i) => { const y = 60 + i * 24; terms[n] = {x:w - 16, y, dir:0, side:'r'}; s += `<text x="${w - 30}" y="${y + 4}" font-size="9" font-weight="700" fill="#eee" text-anchor="end">${n}</text>`; });
    const bx = c ? 26 : 50, bw = w - 2 * bx;
    const body = `<rect x="${bx}" y="54" width="${bw}" height="${H - 90}" rx="6" fill="#3b3f43" stroke="#1d2022"/>` +
      `${[0,1,2,3,4,5,6].map(i => `<path d="M${bx + 6 + i * (bw - 12) / 6} ${H - 48}V${H - 38}" stroke="#8a9096" stroke-width="3"/>`).join('')}` +
      `<rect x="${bx + 8}" y="66" width="${bw - 16}" height="38" rx="3" fill="#26313a"/><text x="${w / 2}" y="82" font-size="11" font-weight="700" text-anchor="middle" fill="${s0.fault ? '#ff6b5e' : s0.v > 0 ? '#5cff7a' : '#8aa0ad'}">${s0.fault ? 'FAULT' : s0.v > 0 ? Math.round(s0.v * 100) + ' %' : 'READY'}</text>` +
      `<text class="ar" x="${w / 2}" y="97" font-size="7.5" text-anchor="middle" fill="#cfd8dc">${CL.SS_PHASE_AR[s0.phase] || ''}${s0.top ? ' · BYPASS' : ''}</text>` +
      `<rect x="${bx + 8}" y="110" width="${bw - 16}" height="8" rx="3" fill="#1d2226"/><rect x="${bx + 8}" y="110" width="${(bw - 16) * clamp(s0.v, 0, 1)}" height="8" rx="3" fill="${s0.v >= 1 ? '#36e070' : '#ffd24d'}"/>` +
      `<circle cx="${bx + 14}" cy="130" r="3.5" fill="${en ? '#36e070' : '#1f4a2a'}"/><text x="${bx + 22}" y="133" font-size="6.5" fill="#eee">PWR</text>` +
      `<circle cx="${bx + 50}" cy="130" r="3.5" fill="${s0.run ? '#ffd24d' : '#4a3d10'}"/><text x="${bx + 58}" y="133" font-size="6.5" fill="#eee">RUN</text>` +
      `<circle cx="${bx + 86}" cy="130" r="3.5" fill="${s0.fault ? '#ff4a3d' : '#5a1f1b'}"/><text x="${bx + 94}" y="133" font-size="6.5" fill="#eee">FLT</text>` +
      `<text x="${w / 2}" y="150" font-size="6.5" fill="#cfd8dc" text-anchor="middle">Uini ${Math.round(d.cfg.vInit * 100)}% · t ${d.cfg.tRamp}s · Ilim ${d.cfg.ilim}×In · ${d.cfg.ctl === '3w' ? '3-wire' : '2-wire'}</text>`;
    const hit = `<g class="bpin" data-dev="${d.id}" data-act="ssFault" tabindex="0" role="button" aria-label="Create a soft starter fault"><rect x="${bx + 8}" y="156" width="${(bw - 24) / 2}" height="20" rx="5"/><text x="${bx + 8 + (bw - 24) / 4}" y="170">FAULT</text></g><g class="bpin" data-dev="${d.id}" data-act="ssReset" tabindex="0" role="button" aria-label="Reset the soft starter"><rect x="${w / 2 + 4}" y="156" width="${(bw - 24) / 2}" height="20" rx="5"/><text x="${w / 2 + 4 + (bw - 24) / 4}" y="170">RESET</text></g>`;
    s = cellHead(d, (c ? '' : 'soft starter ') + d.cfg.model, w) + body + s;
    return {svg:s, hit, terms};
  }
});
CL.art.ssArt = function(d){
  const s0 = d.st || {}, v = s0.v || 0;
  return `<svg viewBox="0 0 440 250" role="img" aria-label="Soft starter"><g style="color:var(--ink)">
    <rect x="22" y="22" width="200" height="206" rx="8" fill="#3b3f43" stroke="#1d2022"/>
    ${['1/L1','3/L2','5/L3'].map((t, i) => `<circle cx="${62 + i * 60}" cy="34" r="6" fill="#d8dbdd" stroke="#555"/><text x="${62 + i * 60}" y="18" font-size="9" text-anchor="middle" fill="currentColor" font-weight="700">${t}</text>`).join('')}
    ${['2/T1','4/T2','6/T3'].map((t, i) => `<circle cx="${62 + i * 60}" cy="216" r="6" fill="#d8dbdd" stroke="#555"/><text x="${62 + i * 60}" y="242" font-size="9" text-anchor="middle" fill="currentColor" font-weight="700">${t}</text>`).join('')}
    ${[0,1,2,3,4,5,6,7].map(i => `<path d="M${40 + i * 24} 186V206" stroke="#8a9096" stroke-width="5"/>`).join('')}
    <rect x="40" y="56" width="164" height="54" rx="4" fill="#26313a"/><text x="122" y="80" font-size="14" font-weight="700" text-anchor="middle" fill="${s0.fault ? '#ff6b5e' : v > 0 ? '#5cff7a' : '#8aa0ad'}">${s0.fault ? 'FAULT' : v > 0 ? Math.round(v * 100) + ' %' : 'READY'}</text><text class="ar" x="122" y="100" font-size="9" text-anchor="middle" fill="#cfd8dc">${CL.SS_PHASE_AR[s0.phase || 'off']}</text>
    <text x="122" y="128" font-size="9" fill="#eee" text-anchor="middle" font-weight="700">${esc(d.cfg.model)} · ${d.cfg.In} A</text>
    <g>${[['Uini', 44], ['t ramp', 92], ['I lim', 140]].map(([l, x], i) => `<circle cx="${x + 18}" cy="156" r="12" fill="#1b1d1f" stroke="#777"/><path d="M${x + 18} 146V156" stroke="#ddd" stroke-width="2" transform="rotate(${[-60, 0, 50][i]} ${x + 18} 156)"/><text x="${x + 18}" y="180" font-size="7" fill="#eee" text-anchor="middle">${l}</text>`).join('')}</g>
    <text x="44" y="46" font-size="7" fill="#eee">A1 A2 IN1 IN2</text><text x="200" y="46" font-size="7" fill="#eee" text-anchor="end">13-14 23-24 95-96</text>
    <g class="${v > 0 ? 'sy-on' : ''}"><text class="sy-tag" x="246" y="26">${esc(d.tag)} · IEC symbol</text>
    <path class="sy" d="M300 44V70M330 44V70M360 44V70M300 150V176M330 150V176M360 150V176"/>
    <rect class="sy" x="280" y="70" width="100" height="80"/><path class="sy" d="M292 136L340 90H370" style="stroke-width:2"/><path class="sy" d="M296 92q6 -8 12 0t12 0" style="stroke-width:2"/><text class="sy-n" x="352" y="134" style="font-size:11px">U↗</text>
    ${['L1','L2','L3'].map((t, i) => `<circle class="sy-t" cx="${300 + i * 30}" cy="44" r="4"/><text class="sy-n" x="${292 + i * 30}" y="38" style="font-size:9px">${t}</text>`).join('')}
    ${['T1','T2','T3'].map((t, i) => `<circle class="sy-t" cx="${300 + i * 30}" cy="176" r="4"/><text class="sy-n" x="${292 + i * 30}" y="194" style="font-size:9px">${t}</text>`).join('')}
    <path class="sy-d" d="M380 110H410"/><text class="sy-s" x="412" y="106">A1/A2</text><text class="sy-s" x="412" y="118">IN1</text>
    <text class="sy-s" x="340" y="226" text-anchor="middle">box with a diagonal = soft starter (voltage control)</text></g></g></svg>`;
};
// thermostat (room temperature switch): the `level` type with look:'thermo' (operates when the temperature is ABOVE the set point = a call for cooling)
CL.art.thermoArt = function(d){
  const lvl = d.st.lvl == null ? 0.5 : d.st.lvl, at = d.cfg.at == null ? 0.6 : d.cfg.at, on = !!d.st.a, max = d.cfg.max || 40;
  const deg = v => Math.round(v * max);
  return `<svg viewBox="0 0 440 230" role="img" aria-label="Room thermostat"><g style="color:var(--ink)">
    <rect x="30" y="30" width="180" height="150" rx="10" fill="#f1f1ec" stroke="#8f8f88"/><circle cx="120" cy="100" r="52" fill="#fff" stroke="#8f8f88" stroke-width="2"/>
    ${[0,1,2,3,4,5,6,7,8].map(i => { const a = (-135 + i * 33.75) * Math.PI / 180; return `<path d="M${120 + 44 * Math.sin(a)} ${100 - 44 * Math.cos(a)}L${120 + 50 * Math.sin(a)} ${100 - 50 * Math.cos(a)}" stroke="#333" stroke-width="2"/>`; }).join('')}
    <g transform="rotate(${-135 + 270 * at} 120 100)"><path d="M120 100V58" stroke="#d32f2f" stroke-width="3" stroke-linecap="round"/></g><circle cx="120" cy="100" r="6" fill="#333"/>
    <text x="120" y="166" font-size="10" text-anchor="middle" fill="#222" font-weight="700">set${deg(at)}°C · room ${deg(lvl)}°C</text>
    <rect x="52" y="40" width="26" height="12" rx="2" fill="${on ? '#36e070' : '#cfd2d4'}"/><text x="65" y="49" font-size="7" text-anchor="middle" fill="#222">COOL</text>
    <text class="ar" x="120" y="200" font-size="11" text-anchor="middle" fill="${on ? GOOD : 'var(--muted)'}" font-weight="700">${on ? 'temperature above setting: thermostat calls for cooling (contact closed)' : 'temperature below setting: no demand'}</text>
    <g class="${on ? 'sy-on' : ''}"><text class="sy-tag" x="262" y="26">${esc(d.tag)} · IEC symbol</text>
    <path class="sy" d="M330 44V74M330 110V140"/><path class="sy" d="M330 110L${on ? 332 : 346} 76"/><path class="sy" d="M300 92A10 10 0 0 1 320 92M300 92H320" /><text class="sy-n" x="310" y="84" text-anchor="middle" style="font-size:10px">θ</text>
    <circle class="sy-t" cx="330" cy="44" r="4"/><circle class="sy-t" cx="330" cy="140" r="4"/><text class="sy-n" x="338" y="48">13</text><text class="sy-n" x="338" y="146">14</text>
    <text class="sy-s" x="340" y="170" text-anchor="middle">NO closes when θ exceeds the setting</text></g></g></svg>`;
};

/* =========================== interactive device simulation =========================== */
CL.sim = function(host, spec, opt){
  opt = opt || {};
  const d = CL.makeDevice(spec), T = TYPES[d.type];
  if (d.type === 'lamp') d.st.v = 0;
  const states = T.states ? T.states(d) : [];
  host.innerHTML = `<div class="sim">${spec.title ? `<h3>${esc(spec.title)}</h3>` : ''}
    <div class="sim-grid"><figure class="sim-art"></figure><figure class="sim-sym"><div class="sim-iec"></div><ul class="sim-cont"></ul></figure></div>
    <div class="sim-ctl"></div>
    <div class="tblw"><table class="tbl sim-tt"></table></div>${spec.note ? `<p class="sim-note">${spec.note}</p>` : ''}</div>`;
  const art = host.querySelector('.sim-art'), iec = host.querySelector('.sim-iec'), cont = host.querySelector('.sim-cont'), ctl = host.querySelector('.sim-ctl'), tt = host.querySelector('.sim-tt');
  const used = () => { if (opt.onAct) opt.onAct(); };
  const isLamp = d.type === 'lamp';
  let first = true;
  // contact rows for the continuity list / truth table: CO is split into its NC and NO pairs; contactor mains come first
  const rows = dev => T.simRows ? T.simRows(dev) : (T.mains || []).map(b => ({lab:b.t[0] + '-' + b.t[1], k:'NO', main:true, c:!!dev.st.closed}))
    .concat(dev.blocks.reduce((a, b) => { const op = T.op(dev, b); if (b.k === 'CO') a.push({lab:b.t[0] + '-' + b.t[1], k:'NC', c:!op}, {lab:b.t[0] + '-' + b.t[2], k:'NO', c:!!op}); else a.push({lab:b.t[0] + '-' + b.t[1], k:b.k, c:!!blockClosed(b, op)}); return a; }, []));
  function stateIdx(){
    if (isLamp) return d.st.v ? 1 : 0;
    if (d.type === 'sel') return d.st.pos;
    if (d.type === 'ls' || d.type === 'prox' || d.type === 'level') return d.st.a ? 1 : 0;
    return T.op(d) ? 1 : 0;
  }
  function render(){
    art.innerHTML = T.art ? T.art(d, {anim:!first}) : '';
    if (!first) CL.animStart(art);
    first = false;
    if (isLamp){
      iec.innerHTML = CL.sym.iec(d, {on:!!d.st.v});
      cont.innerHTML = `<li class="${d.st.v ? 'on' : ''}"><span>between X1 and X2</span><span class="om">${d.st.v ? d.cfg.v + ' V' : '0 V'}</span><span class="st">${d.st.v ? 'on' : 'off'}</span></li>`;
    } else {
      iec.innerHTML = CL.sym.iec(d);
      cont.innerHTML = rows(d).map(r => `<li class="${r.c ? 'on' : ''}"><span><b class="term">${r.lab}</b> ${r.main ? 'main' : r.k}</span><span class="st">${r.txt ? r.txt : r.main ? (r.c ? 'closed ✓' : 'open') : CL.capState(r.k, r.c, r.c !== (r.k === 'NC'), WHO(d))}</span><span class="om">${r.txt ? (r.c ? (d.cfg.pnp ? '+24 V' : '0 V') : '—') : r.c ? '0.0 Ω' : 'OL'}</span></li>`).join('');
    }
    const cur = stateIdx();
    if (isLamp) tt.innerHTML = `<thead><tr><th class="r">State</th><th>Lamp</th></tr></thead><tbody>${['Breaker off (no voltage)', 'Breaker on (' + d.cfg.v + 'V between X1 and X2)'].map((l, i) => `<tr class="${i === cur ? 'cur' : ''}"><td class="r">${l}</td><td class="${i ? 'c1' : 'c0'}">${i ? 'on' : 'off'}</td></tr>`).join('')}</tbody>`;
    else tt.innerHTML = `<thead><tr><th class="r">State</th>${rows(d).map(r => `<th><span class="term">${r.lab}</span> ${r.main ? '' : r.k}</th>`).join('')}</tr></thead><tbody>${states.map((s, i) => { const tmp = {st:Object.assign({}, d.st, s.st), cfg:d.cfg, blocks:d.blocks, type:d.type}; return `<tr class="${i === cur ? 'cur' : ''}"><td class="r">${esc(s.label)}${i === cur ? ' ◀' : ''}</td>${rows(tmp).map(r => `<td class="${r.c ? 'c1' : 'c0'}">${r.txt ? r.txt : r.c ? 'closed' : 'open'}</td>`).join('')}</tr>`; }).join('')}</tbody>`;
    ctl.querySelectorAll('[data-pos]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.pos === d.st.pos ? 'true' : 'false'));
    const lt = ctl.querySelector('[data-k=latch]'); if (lt) lt.textContent = d.st.p ? '↻ Twist to release' : 'Press the E-stop';
    const tg = ctl.querySelector('[data-k=toggle]'); if (tg) tg.textContent = d.st.v ? 'Switch the breaker off' : 'Switch the breaker on (power up)';
    const rg = ctl.querySelector('input[type=range]'); if (rg && document.activeElement !== rg && kind !== 'level') rg.value = Math.round((d.st.x || 0) * 100);
  }
  const kind = T.ctl;
  if (kind === 'level' && d.st.lvl == null) d.st.lvl = 0.5;
  if (kind === 'timer') return simTimer(d, T, {art, iec, cont, ctl, tt, used});
  if (kind === 'ol' || kind === 'prot'){ const c = simProt(d, T, {art, iec, cont, ctl, tt, used, first:() => first, setFirst:v => { first = v; }}); return c; }
  if (kind === 'hold'){
    const coilDev = !!T.coil;
    ctl.innerHTML = `<button type="button" class="btn big hold" data-k="hold">${esc(T.holdLabel || 'Press and hold (push the button)')}</button>${coilDev ? '<button type="button" class="btn big" data-k="pin" aria-pressed="false">📌 Keep the coil energised</button>' : ''}`;
    const hb = ctl.querySelector('.hold');
    let pinned = 0;
    const setOn = v => { if (coilDev){ d.st.coil = v ? 1 : 0; d.st.closed = v ? 1 : 0; } else d.st.p = v ? 1 : 0; };
    const isOn = () => coilDev ? !!d.st.coil : !!d.st.p;
    const press = v => { setOn(v || pinned); hb.classList.toggle('down', !!v); render(); if (v) used(); };
    [hb, art].forEach(el => { el.addEventListener('pointerdown', e => { if (e.target.closest('[data-k=pin]')) return; e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch(_) {} press(1); }); ['pointerup','pointercancel','lostpointercapture'].forEach(ev => el.addEventListener(ev, () => { if (isOn() && !pinned) press(0); else if (pinned) hb.classList.remove('down'); })); });
    const pinB = ctl.querySelector('[data-k=pin]');
    if (pinB) pinB.addEventListener('click', () => { pinned = pinned ? 0 : 1; pinB.setAttribute('aria-pressed', pinned ? 'true' : 'false'); setOn(pinned); render(); used(); });
    hb.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat){ e.preventDefault(); press(1); } });
    hb.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') press(0); });
    art.classList.add('pressable');
  } else if (kind === 'latch'){
    ctl.innerHTML = `<button type="button" class="btn big" data-k="latch"></button>`;
    const f = () => { d.st.p = d.st.p ? 0 : 1; render(); used(); };
    ctl.querySelector('button').addEventListener('click', f);
    art.addEventListener('click', f); art.classList.add('pressable'); art.style.touchAction = 'manipulation';
  } else if (kind === 'sel'){
    ctl.innerHTML = d.cfg.pos.map((p, i) => `<button type="button" class="btn big" data-pos="${i}" aria-pressed="false">${esc(p)}</button>`).join('');
    ctl.addEventListener('click', e => { const b = e.target.closest('[data-pos]'); if (!b) return; d.st.pos = +b.dataset.pos; render(); used(); });
    art.addEventListener('click', e => { const r = art.getBoundingClientRect(), rel = (e.clientX - r.left) / r.width; if (rel > 0.42) return; const left = rel < 0.227; d.st.pos = clamp(d.st.pos + (left ? -1 : 1), 0, d.cfg.pos.length - 1); render(); used(); });
  } else if (kind === 'slider'){
    ctl.innerHTML = `<label>Move the cart toward the limit switch<input type="range" dir="ltr" min="0" max="100" value="0" aria-label="Cart position"></label><button type="button" class="btn big" data-k="end">Send it to the end</button><button type="button" class="btn big" data-k="back">Bring it back</button>`;
    const set = v => { d.st.x = v; d.st.a = CL.lsOperatedAt(v) ? 1 : 0; render(); used(); };
    ctl.querySelector('input').addEventListener('input', e => set(e.target.value / 100));
    ctl.querySelector('[data-k=end]').addEventListener('click', () => set(1));
    ctl.querySelector('[data-k=back]').addEventListener('click', () => set(0));
  } else if (kind === 'prox'){
    const photo = d.cfg.kind === 'photo';
    ctl.innerHTML = `<label>${photo ? 'Move the box toward the beam' : 'Move the object toward the sensor'}<input type="range" dir="ltr" min="0" max="100" value="0" aria-label="Object position"></label><button type="button" class="btn big" data-k="near">${photo ? 'Put it in the beam' : 'Put it in front of the sensor'}</button><button type="button" class="btn big" data-k="far">${photo ? 'Take it out' : 'Move it away'}</button>`;
    const set = v => { d.st.x = v; d.st.a = v >= 0.72 ? 1 : 0; render(); used(); };
    ctl.querySelector('input').addEventListener('input', e => set(e.target.value / 100));
    ctl.querySelector('[data-k=near]').addEventListener('click', () => set(1));
    ctl.querySelector('[data-k=far]').addEventListener('click', () => set(0));
  } else if (kind === 'level'){
    const press = d.cfg.look === 'press', thermo = d.cfg.look === 'thermo', max = d.cfg.max || 10;
    ctl.innerHTML = `<label>${press ? 'Tank pressure: ' : thermo ? 'Room temperature: ' : 'Liquid level: '}<b class="mono" data-lv></b><input type="range" dir="ltr" min="0" max="100" value="${Math.round((d.st.lvl || 0) * 100)}" aria-label="${press ? 'Pressure' : thermo ? 'Temperature' : 'Level'}"></label><button type="button" class="btn big" data-k="up">${press ? 'Compressor pumps ↑' : thermo ? 'Room warms up ↑' : 'Pump fills ↑'}</button><button type="button" class="btn big" data-k="dn">${press ? 'Air used ↓' : thermo ? 'A/C cools ↓' : 'Usage ↓'}</button>`;
    const lab = () => { const b = ctl.querySelector('[data-lv]'); if (b) b.textContent = press ? r1(d.st.lvl * max) + ' bar' : thermo ? Math.round(d.st.lvl * max) + '°C' : Math.round(d.st.lvl * 100) + '%'; };
    const set = v => { T.setLevel(d, clamp(v, 0, 1)); render(); lab(); used(); };
    ctl.querySelector('input').addEventListener('input', e => set(e.target.value / 100));
    ctl.querySelector('[data-k=up]').addEventListener('click', () => { set(d.st.lvl + 0.1); ctl.querySelector('input').value = Math.round(d.st.lvl * 100); });
    ctl.querySelector('[data-k=dn]').addEventListener('click', () => { set(d.st.lvl - 0.1); ctl.querySelector('input').value = Math.round(d.st.lvl * 100); });
    lab();
  } else if (kind === 'toggle'){
    ctl.innerHTML = `<button type="button" class="btn big" data-k="toggle"></button>`;
    ctl.querySelector('button').addEventListener('click', () => { d.st.v = d.st.v ? 0 : 1; render(); used(); });
  }
  render();
  return {dev:d, render};
};

// timer sim: give the coil voltage (toggle), set t, run the clock; the figure shows the countdown and the timing diagram
function simTimer(d, T, ui){
  let run = 0, speed = 1, timer = null, t = 0, ev = [];
  const multi = !!d.cfg.multi;
  ui.ctl.innerHTML = `<button type="button" class="btn big pri" data-k="coil" aria-pressed="false">⚡ Energise coil A1-A2</button>
    ${multi ? '<select data-k="mode" aria-label="Timer function"><option value="on">A: On-delay</option><option value="off">B: Off-delay</option><option value="cyc">C: Flasher (cyclic)</option></select>' : ''}
    <label>Set time t: <b class="mono" data-t></b><input type="range" dir="ltr" min="1" max="10" step="1" value="${d.cfg.t}" aria-label="Time"></label>
    <select data-k="spd" aria-label="Time speed"><option value="1">Real time ×1</option><option value="5">Faster ×5</option></select>
    <div class="sim-clock" role="status" aria-live="polite"></div>`;
  if (multi) ui.ctl.querySelector('[data-k=mode]').value = d.cfg.mode;
  const rows = () => { const L = T.links(d, false), has = (a, b) => L.some(l => l[0] === a && l[1] === b); const r = [{lab:'15-16', k:'NC', c:has('15','16')}, {lab:'15-18', k:'NO', c:has('15','18')}]; if (d.cfg.inst) r.push({lab:'21-22', k:'NC inst.', c:has('21','22')}, {lab:'21-24', k:'NO inst.', c:has('21','24')}); return r; };
  const stIdx = () => { const m = d.cfg.mode; if (m === 'off') return !d.st.coil && !d.st.out ? 0 : d.st.coil ? 1 : 2; if (m === 'cyc') return !d.st.coil ? 0 : d.st.out ? 1 : 2; return !d.st.coil ? 0 : d.st.out ? 2 : 1; };
  function render(){
    const states = T.states(d);
    ui.art.innerHTML = T.art(d, {sim:true}); ui.iec.innerHTML = CL.sym.iec(d);
    ui.cont.innerHTML = rows().map(r => `<li class="${r.c ? 'on' : ''}"><span><b class="term">${r.lab}</b> ${r.k}</span><span class="st">${CL.capState(r.k, r.c, r.c !== (r.k.indexOf('NC') === 0), 'running')}</span><span class="om">${r.c ? '0.0 Ω' : 'OL'}</span></li>`).join('');
    const cur = stIdx();
    ui.tt.innerHTML = `<thead><tr><th class="r">State</th><th><span class="term">15-16</span> NC</th><th><span class="term">15-18</span> NO</th></tr></thead><tbody>${states.map((s, i) => `<tr class="${i === cur ? 'cur' : ''}"><td class="r">${esc(s.label)}${i === cur ? ' ◀' : ''}</td><td class="${s.st.out ? 'c0' : 'c1'}">${s.st.out ? 'open' : 'closed'}</td><td class="${s.st.out ? 'c1' : 'c0'}">${s.st.out ? 'closed' : 'open'}</td></tr>`).join('')}</tbody>`;
    const b = ui.ctl.querySelector('[data-t]'); if (b) b.textContent = d.cfg.t + ' s';
    const cb = ui.ctl.querySelector('[data-k=coil]'); cb.setAttribute('aria-pressed', d.st.coil ? 'true' : 'false'); cb.textContent = d.st.coil ? '⏻ De-energise the coil' : '⚡ Energise coil A1-A2';
    const m = d.cfg.mode, el = d.st.el || 0;
    const what = m === 'on' ? (d.st.coil ? (d.st.out ? `Time elapsed after ${d.cfg.t} s: 15-18 closed` : `Counting: ${r1(Math.max(0, d.cfg.t - el)).toFixed(1)} s left`) : 'Waiting for voltage on the coil') : m === 'off' ? (d.st.coil ? '15-18 closed at once with the voltage' : d.st.out ? `Supply removed: 15-18 still closed, left ${r1(Math.max(0, d.cfg.t - el)).toFixed(1)} s left` : 'open') : (d.st.coil ? (d.st.out ? 'ON period' : 'OFF period') : 'stopped');
    ui.ctl.querySelector('.sim-clock').innerHTML = `Time: <b class="mono">${r1(t)} s</b> · ${what}${ev.length ? ' · last event: ' + ev[ev.length - 1] : ''}`;
  }
  function step(){ const total = 0.1 * speed; let rem = total; while (rem > 1e-9){ const dt = Math.min(0.1, rem); const o = d.st.out; T.tick(d, dt, {devs:[]}); t = r1(t + dt); if (o !== d.st.out) ev.push(`${d.st.out ? '15-18 closed' : '15-18 opened'} at ${r1(t)} s left`); rem -= dt; } render(); const m = d.cfg.mode; const need = (m === 'on' && d.st.coil && !d.st.out) || (m === 'off' && !d.st.coil && d.st.out) || (m === 'cyc' && d.st.coil); if (!need) setRun(0); }
  const setRun = v => { run = v ? 1 : 0; if (run && !timer) timer = setInterval(step, 100); if (!run && timer){ clearInterval(timer); timer = null; } };
  ui.ctl.querySelector('input').addEventListener('input', e => { d.cfg.t = +e.target.value; render(); ui.used(); });
  ui.ctl.querySelector('[data-k=spd]').addEventListener('change', e => { speed = +e.target.value; });
  if (multi) ui.ctl.querySelector('[data-k=mode]').addEventListener('change', e => { d.cfg.mode = e.target.value; resetDev(d); t = 0; ev = []; setRun(0); render(); ui.used(); });
  ui.ctl.querySelector('[data-k=coil]').addEventListener('click', () => { const on = !d.st.coil; d.st.coil = on ? 1 : 0; T.onCoil(d, on); t = 0; ev = []; ev.push(on ? 'coil energised' : 'supply removed'); if (d.cfg.mode === 'off' && !on && !d.st.out){ } setRun(1); render(); ui.used(); });
  render();
  return {dev:d, render, destroy(){ if (timer) clearInterval(timer); }};
}
// protection sims: a current you set flows through the device; the clock heats it up per its I-t model
function simProt(d, T, ui){
  const isOL = d.type === 'ol' || d.type === 'mpcb', isFuse = d.type === 'fuse', isMcb = d.type === 'mcb';
  const In = isOL ? (d.cfg.Ir || 5) : ratingOf(d), unit = isOL ? 'Ir' : 'In';
  let pct = 80, sp = 0, run = 0, speed = 1, t = 0, timer = null, startT = -1, trips = [], note = '';
  const motorIn = d.cfg.motorIn || In;
  const I = () => { let k = pct / 100; if (startT >= 0 && t - startT < 1) k = Math.max(k, 6 * motorIn / In); return k * In; };
  ui.ctl.innerHTML = `<label>${isOL ? 'Motor load (% of In)' : 'Current through the device (% of ' + unit + ')'}: <b class="mono" data-i></b><input type="range" dir="ltr" min="0" max="${isOL ? 300 : 1500}" step="5" value="${pct}" aria-label="Current"></label>
    ${isOL ? '<button type="button" class="btn" data-k="start">▶ Start the motor (6×In for a second)</button><button type="button" class="btn" data-k="sp" aria-pressed="false">Phase missing</button>' : '<button type="button" class="btn" data-k="start">▶ Motor starting current (6× for a second)</button>'}
    <button type="button" class="btn pri" data-k="run" aria-pressed="false">⏱ Run time</button>
    <select data-k="spd" aria-label="Time speed"><option value="1">Real time ×1</option><option value="10">Faster ×10</option><option value="60">Faster ×60</option></select>
    ${isOL ? '<button type="button" class="btn" data-k="reset">Reset</button><button type="button" class="btn" data-k="test">Test</button>' : isFuse ? '<button type="button" class="btn" data-k="replace">Replace the fuse</button>' : '<button type="button" class="btn" data-k="on">Switch the breaker on / reset it</button>'}
    <div class="sim-clock" role="status" aria-live="polite"></div>`;
  const rows = () => { const L = T.links(d, false), has = (a, b) => L.some(l => (l[0] === a && l[1] === b)); const r = [['1','2'],['3','4'],['5','6']].slice(0, isFuse || isMcb ? (d.cfg.poles || 1) : 3).map(p => ({lab:p.join('-'), k:'pole', c:has(p[0], p[1])}));
    if (d.type === 'ol') r.push({lab:'95-96', k:'NC', c:has('95','96')}, {lab:'97-98', k:'NO', c:has('97','98')}); if (d.type === 'mpcb' && d.cfg.aux) r.push({lab:'13-14', k:'NO', c:has('13','14')}, {lab:'21-22', k:'NC', c:has('21','22')}); return r; };
  const ks = isOL ? [1, 1.2, 1.5, 2, 3, 6, 7.2] : isFuse ? [1, 1.6, 2, 4, 6.3, 10] : [1, 1.45, 2.55, 4, 8, 15];
  const tripAt = k => { if (isOL) return CL.olTripTime(k, false); if (isMcb){ if (k >= MAG[curveOf(d)]) return 0.01; return k > 1.13 ? 100 / (k*k - 1) : Infinity; } if (d.cfg.kind === 'aM') return k >= 6.3 ? 60 / (k*k - 1) : Infinity; return k > 1.3 ? 60 / (k*k - 1) : Infinity; };
  const fmtT = v => v === Infinity ? 'no trip' : v < 0.05 ? 'instant' : v < 60 ? r1(v) + ' s left' : v < 3600 ? Math.round(v / 60) + ' min' : '> 1 hour';
  function render(){
    ui.art.innerHTML = T.art(d, {}); ui.iec.innerHTML = CL.sym.iec(d);
    ui.cont.innerHTML = rows().map(r => `<li class="${r.c ? 'on' : ''}"><span><b class="term">${r.lab}</b> ${r.k}</span><span class="st">${r.k === 'NC' || r.k === 'NO' ? CL.capState(r.k, r.c, r.c !== (r.k === 'NC'), 'off') : (r.c ? 'closed ✓ conducting' : 'open, not conducting')}</span><span class="om">${r.c ? '0.0 Ω' : 'OL'}</span></li>`).join('');
    const kNow = I() / In;
    ui.tt.innerHTML = `<thead><tr><th class="r">Current</th><th>Approx. trip time</th></tr></thead><tbody>${ks.map(k => { const cur = Math.abs(kNow - k) < (k < 2 ? 0.15 : 0.8) && ks.every(o => Math.abs(kNow - o) >= Math.abs(kNow - k)); return `<tr class="${cur ? 'cur' : ''}"><td class="r">${k}×${unit} = ${r1(k * In)}A${cur ? ' ◀' : ''}</td><td class="${tripAt(k) === Infinity ? 'c0' : 'c1'}">${fmtT(tripAt(k))}</td></tr>`; }).join('')}</tbody>`;
    const b = ui.ctl.querySelector('[data-i]'); if (b) b.textContent = `I = ${r1(I())}A (${r1(kNow)}×${unit})`;
    ui.ctl.querySelector('.sim-clock').innerHTML = `Time: <b class="mono">${r1(t)} s</b> · heat: <b class="mono">${Math.round((d.st.heat || 0) * 100)}%</b>${startT >= 0 && t - startT < 1 ? ' · <b>starting current</b>' : ''}${d.st.trip ? ` · <b style="color:var(--bad)">tripped after ${r1(trips[trips.length-1] || t)} s</b>` : ''}${isMcb && !d.st.on && !d.st.trip ? ' · breaker off' : ''}${note ? ` · <span style="color:var(--bad)">${note}</span>` : ''}`; note = '';
    const rb = ui.ctl.querySelector('[data-k=run]'); rb.setAttribute('aria-pressed', run ? 'true' : 'false'); rb.textContent = run ? '⏸ Pause time' : '⏱ Run time';
    const spb = ui.ctl.querySelector('[data-k=sp]'); if (spb) spb.setAttribute('aria-pressed', sp ? 'true' : 'false');
  }
  function step(){ const total = 0.1 * speed, sub = speed > 10 ? 0.5 : 0.1; let rem = total; while (rem > 1e-9){ const dt = Math.min(sub, rem); const was = d.st.trip; T.tick(d, dt, {forceI:I(), forceSp:sp && isOL, devs:[]}); t = r1(t + dt); if (!was && d.st.trip) trips.push(t); rem -= dt; } render(); }
  const setRun = v => { run = v ? 1 : 0; if (run && !timer) timer = setInterval(step, 100); if (!run && timer){ clearInterval(timer); timer = null; } render(); };
  ui.ctl.querySelector('input').addEventListener('input', e => { pct = +e.target.value; render(); ui.used(); });
  ui.ctl.querySelector('[data-k=spd]').addEventListener('change', e => { speed = +e.target.value; });
  ui.ctl.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
    if (k === 'run'){ setRun(!run); }
    else if (k === 'start'){ startT = t; if (!run) setRun(1); }
    else if (k === 'sp'){ sp = sp ? 0 : 1; if (!run) setRun(1); }
    else if (k === 'reset'){ T.apply(d, {reset:1}); if (d.st.trip) note = 'Still hot, let it cool'; else { t = 0; trips = []; } }
    else if (k === 'test'){ T.apply(d, {test:1}); }
    else if (k === 'replace'){ T.apply(d, {replace:1}); t = 0; trips = []; }
    else if (k === 'on'){ if (d.st.trip){ if ((d.st.heat || 0) >= 0.6) note = 'Still hot, let it cool'; else { d.st.trip = 0; d.st.why = ''; d.st.on = 1; t = 0; trips = []; } } else d.st.on = d.st.on ? 0 : 1; }
    render(); ui.used(); });
  render();
  return {dev:d, render, destroy(){ if (timer) clearInterval(timer); }};
}

/* =========================== quiz =========================== */
CL.quiz = function(host, qs, pref, onChange){
  // options are shuffled on every visit (data-j keeps the original index); catch-all choices («الاتنين», "Both", "None"…) always stay last
  const PIN = /^(الاتنين|الاثنين|كلهم|ولا واحد|ولا حاجة|مفيش فرق|مش فارقة|زي بعض|كلهم زي بعض|both|neither|none|all of them|all the same|no difference|it makes no difference)$/i;
  const pinned = a => PIN.test(String(a).replace(/<[^>]*>/g, '').replace(/[\u2066-\u2069\u2060.!]/g, '').trim());
  // Latin / number runs inside RTL options ("+24V", "6–8", "DC−") would flip: isolate them as LTR
  const LTR = /[+\-−±]?[0-9A-Za-zΩµ°][0-9A-Za-zΩµ°%.,:/·×_\-–−+ ]*[0-9A-Za-zΩµ°%+\-−]|[+\-−±]?[0-9A-Za-zΩµ°]/g;
  const ltr = s => document.documentElement.dir !== 'rtl' ? String(s) : String(s).split(/(<[^>]+>|&[#\w]+;)/).map((p, i) => i % 2 ? p : p.replace(LTR, m => '<bdi dir="ltr">' + m + '</bdi>')).join('');
  const order = q => { const idx = q.a.map((_, j) => j); if (q.keep) return idx; const r = idx.filter(j => !pinned(q.a[j])); for (let k = r.length - 1; k > 0; k--){ const x = Math.floor(Math.random() * (k + 1)); [r[k], r[x]] = [r[x], r[k]]; } return r.concat(idx.filter(j => pinned(q.a[j]))); };
  host.innerHTML = `<div class="qz-list">${qs.map((q, i) => `<div class="qz" data-i="${i}"><p class="qz-q">${i + 1}. ${q.q}</p><div class="qz-a">${order(q).map(j => `<button type="button" class="btn qz-o" data-j="${j}">${ltr(q.a[j])}</button>`).join('')}</div><p class="qz-f" aria-live="polite"></p></div>`).join('')}</div><div class="qz-chk"><button type="button" class="btn pri" data-qz="check" aria-disabled="true">Check my answers</button><span class="qz-cnt" aria-live="polite"></span></div>`;
  // tapping an option only selects it; right/wrong shows after «check». Correct → saved + locked, wrong → marked and cleared
  const sel = qs.map(() => null), done = qs.map(() => false), boxes = [...host.querySelectorAll('.qz')];
  const T = {need:'Answer every question first', cnt:(n, t) => `Answered ${n} of ${t}`};
  const mark = (box, q, j, restore) => {
    const i = +box.dataset.i, btns = box.querySelectorAll('.qz-o'), f = box.querySelector('.qz-f');
    btns.forEach(b => { b.classList.remove('sel'); b.removeAttribute('aria-pressed'); });
    if (j === q.c){
      done[i] = true;
      btns.forEach(b => { b.classList.remove('no'); b.disabled = true; }); box.querySelector(`.qz-o[data-j="${j}"]`).classList.add('ok'); box.classList.add('ok');
      f.className = 'qz-f ok'; f.innerHTML = '✓ Correct. ' + (q.why || '');
      if (!restore) CL.store.set(pref + '/' + i, 1);
    } else {
      box.querySelector(`.qz-o[data-j="${j}"]`).classList.add('no'); f.className = 'qz-f no'; f.innerHTML = '✗ Not that one. ' + ((q.w && q.w[j]) || 'Think again and try another answer.');
    }
  };
  const cnt = warn => {
    const c = host.querySelector('.qz-cnt'), btn = host.querySelector('[data-qz=check]'), wrap = host.querySelector('.qz-chk');
    const left = qs.map((_, i) => i).filter(i => !done[i]);
    if (!left.length){ wrap.hidden = true; return; }
    wrap.hidden = false;
    const n = qs.length - left.length + left.filter(i => sel[i] != null).length, all = left.every(i => sel[i] != null);
    btn.setAttribute('aria-disabled', all ? 'false' : 'true');
    c.className = 'qz-cnt' + (warn && !all ? ' warn' : '');
    c.textContent = T.cnt(n, qs.length) + (warn && !all ? ' · ' + T.need : '');
  };
  const check = () => {
    const left = qs.map((_, i) => i).filter(i => !done[i]);
    const miss = left.find(i => sel[i] == null);
    if (miss != null){ cnt(true); if (boxes[miss].scrollIntoView) boxes[miss].scrollIntoView({block:'center', behavior:'smooth'}); return; }
    left.forEach(i => { mark(boxes[i], qs[i], sel[i]); sel[i] = null; });
    cnt();
    if (onChange) onChange();
  };
  boxes.forEach(box => { const i = +box.dataset.i, q = qs[i]; if (CL.store.has(pref + '/' + i)) mark(box, q, q.c, true); });
  cnt();
  host.addEventListener('click', e => {
    const b = e.target.closest('.qz-o');
    if (b){
      const box = b.closest('.qz'), i = +box.dataset.i; if (done[i] || b.disabled) return;
      sel[i] = +b.dataset.j;
      box.querySelectorAll('.qz-o').forEach(x => { const on = x === b; x.classList.toggle('sel', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); if (on) x.classList.remove('no'); });
      cnt(); return;
    }
    if (e.target.closest('[data-qz=check]')) check();
  });
};

/* =========================== lesson runner (guided, one element at a time) =========================== */
const ICONS = {
  pb:'<svg viewBox="0 0 84 40" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="#c9cdd0"/><circle cx="20" cy="20" r="11" fill="#1f9a4a"/><circle cx="58" cy="20" r="16" fill="#f3c613"/><circle cx="58" cy="20" r="11" fill="#d22b2b"/></svg>',
  sel:'<svg viewBox="0 0 84 40" aria-hidden="true"><circle cx="42" cy="20" r="17" fill="#c9cdd0"/><circle cx="42" cy="20" r="13" fill="#1d1f21"/><rect x="38" y="6" width="8" height="28" rx="4" fill="#3a3d40" transform="rotate(45 42 20)"/></svg>',
  ls:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="52" y="14" width="26" height="24" rx="3" fill="#c3c7ca"/><line x1="64" y1="14" x2="60" y2="2" stroke="#4b5257" stroke-width="3"/><circle cx="60" cy="4" r="4" fill="#ecebe6" stroke="#4b5257"/><rect x="6" y="20" width="34" height="14" rx="3" fill="#2f6fb5"/><rect x="36" y="2" width="6" height="20" fill="#e0a21b"/></svg>',
  lamp:'<svg viewBox="0 0 84 40" aria-hidden="true"><circle cx="20" cy="20" r="15" fill="#c9cdd0"/><circle cx="20" cy="20" r="10" fill="#36e070"/><rect x="44" y="6" width="34" height="28" rx="4" fill="#cfd3d6"/><circle cx="52" cy="28" r="3" fill="#36e070"/></svg>',
  relay:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="12" y="30" width="60" height="8" fill="#2c2f31"/><rect x="22" y="4" width="40" height="28" rx="3" fill="#cfe3f7" stroke="#4f6f8f"/><rect x="30" y="16" width="12" height="12" fill="#c7893b"/><circle cx="52" cy="12" r="3" fill="#36e070"/></svg>',
  hold:'<svg viewBox="0 0 84 40" aria-hidden="true"><circle cx="18" cy="20" r="13" fill="#c9cdd0"/><circle cx="18" cy="20" r="9" fill="#1f9a4a"/><path d="M31 20H46M46 8V32M58 8V32M46 20H40" stroke="#56656f" stroke-width="3" fill="none"/><rect x="62" y="12" width="16" height="16" fill="#c7893b"/></svg>',
  lock:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="6" y="6" width="30" height="28" rx="3" fill="#cfe3f7" stroke="#4f6f8f"/><rect x="48" y="6" width="30" height="28" rx="3" fill="#cfe3f7" stroke="#4f6f8f"/><path d="M36 14H48M36 26H48" stroke="#d6332a" stroke-width="3"/></svg>',
  k:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="16" y="2" width="52" height="36" rx="4" fill="#3b3f43"/><rect x="24" y="16" width="36" height="14" rx="2" fill="#e9eaec"/><circle cx="26" cy="8" r="3" fill="#d8dbdd"/><circle cx="42" cy="8" r="3" fill="#d8dbdd"/><circle cx="58" cy="8" r="3" fill="#d8dbdd"/></svg>',
  pwr:'<svg viewBox="0 0 84 40" aria-hidden="true"><path d="M10 6V34M24 6V34M38 6V34" stroke="#7b4a21" stroke-width="4"/><path d="M24 6V34" stroke="#1f1f1f" stroke-width="4"/><path d="M38 6V34" stroke="#8a8f94" stroke-width="4"/><circle cx="64" cy="20" r="14" fill="#5d7f96"/><text x="64" y="25" font-size="12" fill="#fff" text-anchor="middle" font-weight="700">M</text></svg>',
  fuse:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="6" y="14" width="34" height="12" rx="3" fill="#cfe3f7" stroke="#4f6f8f"/><path d="M6 20H40" stroke="#8a4f1d" stroke-width="1.5"/><rect x="50" y="4" width="26" height="32" rx="3" fill="#f4f4f1" stroke="#8c8f8a"/><rect x="56" y="12" width="14" height="10" rx="2" fill="#1f6fd1"/></svg>',
  ol:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="14" y="4" width="56" height="34" rx="4" fill="#3b3f43"/><circle cx="32" cy="22" r="9" fill="#1f6fd1"/><rect x="48" y="12" width="16" height="7" rx="2" fill="#1f6fd1"/><rect x="48" y="22" width="16" height="7" rx="2" fill="#d32f2f"/><rect x="18" y="33" width="48" height="3" fill="#e0a21b"/></svg>',
  mpcb:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="22" y="2" width="40" height="36" rx="4" fill="#3b3f43"/><circle cx="42" cy="18" r="11" fill="#1b1d1f"/><rect x="39" y="8" width="6" height="20" rx="3" fill="#e9eaec"/><circle cx="32" cy="33" r="4" fill="#1f6fd1"/></svg>',
  shield:'<svg viewBox="0 0 84 40" aria-hidden="true"><path d="M42 3L62 10V22C62 30 52 36 42 38C32 36 22 30 22 22V10Z" fill="#f0a03c" stroke="#8a4f00"/><path d="M34 20l6 6 10-12" stroke="#fff" stroke-width="3.5" fill="none"/></svg>',
  timer:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="22" y="2" width="40" height="36" rx="4" fill="#4b5560"/><circle cx="42" cy="18" r="10" fill="#e9eaec" stroke="#8a9096"/><path d="M42 18V11M42 18l5 3" stroke="#d32f2f" stroke-width="2" stroke-linecap="round"/><circle cx="30" cy="32" r="3" fill="#36e070"/><circle cx="54" cy="32" r="3" fill="#ffd24d"/></svg>',
  ring:'<svg viewBox="0 0 84 40" aria-hidden="true"><circle cx="20" cy="20" r="9" fill="#5d7f96"/><circle cx="42" cy="20" r="9" fill="#5d7f96"/><circle cx="64" cy="20" r="9" fill="#5d7f96"/><path d="M29 14h4M51 14h4M70 8c8 8 8 16 0 24" stroke="#d32f2f" stroke-width="2.5" fill="none"/><path d="M14 32c-8-8-8-16 0-24" stroke="#d32f2f" stroke-width="2.5" fill="none"/></svg>',
  cycle:'<svg viewBox="0 0 84 40" aria-hidden="true"><path d="M8 30h10V10h10v20h10V10h10v20h10V10h10" stroke="#2b9a4a" stroke-width="3" fill="none"/><circle cx="76" cy="10" r="4" fill="#ffd24d"/></svg>',
  motor:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="10" y="10" width="50" height="24" rx="8" fill="#5d7f96"/><rect x="24" y="2" width="22" height="10" rx="2" fill="#8f979c"/><rect x="60" y="18" width="14" height="8" fill="#aab1b6"/><circle cx="26" cy="20" r="3" fill="#36e070"/><circle cx="44" cy="20" r="3" fill="#ff4a3d"/></svg>',
  plate:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="8" y="6" width="68" height="28" rx="3" fill="#cfd3d6" stroke="#6d757b"/><path d="M14 14H70M14 20H50M14 26H60" stroke="#1d2226" stroke-width="2"/><circle cx="12" cy="10" r="1.5" fill="#555"/><circle cx="72" cy="10" r="1.5" fill="#555"/><circle cx="12" cy="30" r="1.5" fill="#555"/><circle cx="72" cy="30" r="1.5" fill="#555"/></svg>',
  tbox:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="10" y="4" width="64" height="32" rx="3" fill="#d9dcde" stroke="#7d8388"/><rect x="18" y="12" width="48" height="5" rx="2" fill="#b87333"/><circle cx="22" cy="14" r="4" fill="#d8dbdd" stroke="#555"/><circle cx="42" cy="14" r="4" fill="#d8dbdd" stroke="#555"/><circle cx="62" cy="14" r="4" fill="#d8dbdd" stroke="#555"/><circle cx="22" cy="28" r="4" fill="#d8dbdd" stroke="#555"/><circle cx="42" cy="28" r="4" fill="#d8dbdd" stroke="#555"/><circle cx="62" cy="28" r="4" fill="#d8dbdd" stroke="#555"/></svg>',
  dir:'<svg viewBox="0 0 84 40" aria-hidden="true"><circle cx="42" cy="20" r="16" fill="#5d7f96"/><path d="M42 8A12 12 0 1 1 30 20" fill="none" stroke="#fff" stroke-width="3"/><path d="M26 14l4 8l6-6z" fill="#fff"/><path d="M4 12H20M4 20H20M4 28H20" stroke="#7b4a21" stroke-width="3"/><path d="M4 20H20" stroke="#1f1f1f" stroke-width="3"/><path d="M4 28H20" stroke="#8a8f94" stroke-width="3"/></svg>',
  press:'<svg viewBox="0 0 84 40" aria-hidden="true"><circle cx="30" cy="20" r="16" fill="#f4f4f1" stroke="#555"/><path d="M30 20L38 10" stroke="#d32f2f" stroke-width="2.5"/><rect x="54" y="8" width="24" height="24" rx="3" fill="#e9eaec" stroke="#7d8388"/><rect x="58" y="12" width="8" height="6" fill="#1f6fd1"/><rect x="68" y="12" width="6" height="6" fill="#d32f2f"/></svg>',
  float:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="8" y="4" width="50" height="32" rx="3" fill="none" stroke="#56656f" stroke-width="2"/><rect x="10" y="20" width="46" height="14" fill="#4ea0ff" opacity=".7"/><path d="M33 4V14" stroke="#222" stroke-width="2"/><ellipse cx="38" cy="19" rx="6" ry="9" fill="#1f6fd1" transform="rotate(-50 33 14)"/><path d="M62 10H78M62 30H78" stroke="#1f1f1f" stroke-width="3"/></svg>',
  sensor:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="8" y="14" width="40" height="12" rx="2" fill="#aab1b6" stroke="#444"/><rect x="48" y="12" width="6" height="16" fill="#e0a21b"/><path d="M56 20Q66 10 76 20Q66 30 56 20Z" fill="#36e070" opacity=".4"/><rect x="70" y="8" width="8" height="24" fill="#8a9096"/></svg>',
  photo:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="6" y="10" width="18" height="20" rx="3" fill="#2a2d30"/><rect x="20" y="14" width="4" height="12" fill="#d32f2f"/><path d="M24 20H60" stroke="#ff4a3d" stroke-width="2" stroke-dasharray="4 3"/><rect x="60" y="8" width="18" height="24" rx="2" fill="#c99a5b" stroke="#6b4a1f"/></svg>',
  cond:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="6" y="6" width="30" height="28" rx="3" fill="#3b3f43"/><rect x="48" y="6" width="30" height="28" rx="3" fill="#3b3f43"/><path d="M36 20H48" stroke="#2b9a4a" stroke-width="3"/><path d="M40 14l8 6l-8 6" fill="none" stroke="#2b9a4a" stroke-width="2"/><rect x="12" y="16" width="18" height="8" fill="#e9eaec"/><rect x="54" y="16" width="18" height="8" fill="#e9eaec"/></svg>',
  jog:'<svg viewBox="0 0 84 40" aria-hidden="true"><circle cx="24" cy="20" r="15" fill="#c9cdd0"/><circle cx="24" cy="20" r="10" fill="#1f6fd1"/><rect x="48" y="8" width="12" height="24" rx="2" fill="#efeee9" stroke="#8c8f8a"/><rect x="48" y="8" width="12" height="4" fill="#2f9e44"/><rect x="64" y="8" width="12" height="24" rx="2" fill="#efeee9" stroke="#8c8f8a"/><rect x="64" y="8" width="12" height="4" fill="#d6332a"/></svg>',
  rev:'<svg viewBox="0 0 84 40" aria-hidden="true"><circle cx="42" cy="20" r="14" fill="#5d7f96"/><path d="M14 20H26M58 20H70" stroke="#56656f" stroke-width="3"/><path d="M18 12l-8 8l8 8" fill="none" stroke="#2b9a4a" stroke-width="3"/><path d="M66 12l8 8l-8 8" fill="none" stroke="#e0a21b" stroke-width="3"/><text x="42" y="25" font-size="12" fill="#fff" text-anchor="middle" font-weight="700">M</text></svg>',
  hoist:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="10" y="4" width="64" height="8" fill="#e0a21b" stroke="#8a6200"/><path d="M42 12V22" stroke="#333" stroke-width="2"/><rect x="30" y="22" width="24" height="14" rx="2" fill="#8a9096" stroke="#333"/><rect x="16" y="14" width="10" height="6" fill="#c3c7ca" stroke="#6d7479"/><rect x="58" y="14" width="10" height="6" fill="#c3c7ca" stroke="#6d7479"/></svg>',
  lathe:'<svg viewBox="0 0 84 40" aria-hidden="true"><rect x="6" y="26" width="72" height="10" fill="#56656f"/><rect x="10" y="10" width="20" height="18" fill="#3b3f43"/><rect x="30" y="16" width="30" height="6" fill="#aab1b6"/><rect x="62" y="12" width="12" height="16" fill="#3b3f43"/><circle cx="45" cy="19" r="6" fill="#d9924f"/></svg>'
};
CL.ICONS = ICONS;
CL.lesson = function(Ld){
  SKIN.toggle(document.querySelector('header.top .chips'));
  const root = document.getElementById('lesson');
  const LID = Ld.id;
  const stepKeys = (el, si) => { const s = el.steps[si]; if (s.kind === 'bench') return s.ex.map(x => `${LID}/ex/${x}`); if (s.kind === 'quiz') return s.qs.map((_, i) => `${LID}/q/${el.id}/${i}`); return [`${LID}/v/${el.id}/${si}`]; };
  const elKeys = el => el.steps.reduce((a, _, si) => a.concat(stepKeys(el, si)), []);
  const cnt = keys => keys.filter(k => CL.store.has(k)).length;
  const stepDone = (el, si) => { const k = stepKeys(el, si); return cnt(k) === k.length; };
  const allKeys = () => Ld.elements.reduce((a, el) => a.concat(elKeys(el)), []);
  const summary = () => { const k = allKeys(); CL.store.summary(LID, cnt(k), k.length); };
  let cur = {el:-1, si:0, ex:{}}, live = [], startEx = null;
  CL.test.lesson = Ld;
  root.innerHTML = `<section class="panel guide" aria-label="${esc(Ld.title)}">
    <div id="gStart"><div class="g-head"><h2>${esc(Ld.pick || 'Pick an item to start')}</h2><div class="g-sub">${Ld.intro || ''}</div></div>
      <div class="g-total"><span id="gTotT"></span><div class="bar"><i id="gTotB" style="width:0"></i></div></div>
      <div class="g-cards" id="gCards"></div></div>
    <div id="gRun" hidden>
      <div class="g-bar"><button class="btn" id="gBack" type="button">‹ Back to items</button><div class="g-prog" id="gProg" aria-label="Steps"></div></div>
      <div class="g-steps" id="gSteps"></div>
      <h2 class="g-title" id="gTitle"></h2>
      <div class="g-body" id="gBody"></div>
      <div class="g-nav"><button class="btn big" id="gPrev" type="button">Previous</button><button class="btn big pri" id="gNext" type="button">Next</button></div>
    </div></section>`;
  const $ = s => root.querySelector(s);
  function cards(){
    const k = allKeys(), done = cnt(k);
    $('#gTotT').textContent = `Progress: ${done} of ${k.length}`;
    $('#gTotB').style.width = (k.length ? done / k.length * 100 : 0) + '%';
    $('#gCards').innerHTML = Ld.elements.map((el, i) => { const ks = elKeys(el), dn = cnt(ks), full = dn === ks.length; const nEx = el.steps.filter(s => s.kind === 'bench').reduce((a, s) => a + s.ex.length, 0);
      return `<button type="button" class="g-card${full ? ' done' : ''}" data-el="${i}"><span class="n">${full ? '✓' : i + 1}</span><span class="t">${esc(el.title)}</span><span class="g">${el.goal}</span><span class="ico">${ICONS[el.icon] || ''}<span class="bar" aria-hidden="true"><i style="width:${dn / ks.length * 100}%"></i></span><span>${dn}/${ks.length} · ${nEx} exercises</span></span></button>`; }).join('');
  }
  function cleanup(){ live.forEach(x => x && x.destroy && x.destroy()); live = []; }
  function go(el, si, push){
    cleanup();
    cur.el = el; cur.si = si;
    try { history.replaceState(null, '', el < 0 ? location.pathname + location.search : `#${Ld.elements[el].id}/${si + 1}`); } catch(_) {}
    CL.store.last(LID, el < 0 ? '' : `${Ld.elements[el].id}/${si}`);
    render(push);
  }
  function mark(k){ if (!CL.store.has(k)){ CL.store.set(k, 1); summary(); progress(); } }
  function progress(){
    if (cur.el < 0) return;
    const el = Ld.elements[cur.el];
    $('#gProg').innerHTML = el.steps.map((s, i) => `<button type="button" data-si="${i}" class="${i === cur.si ? 'on' : stepDone(el, i) ? 'ok' : ''}" aria-label="Step ${i + 1}: ${esc(s.title)}"${i === cur.si ? ' aria-current="step"' : ''}></button>`).join('') + `<b>${cur.si + 1}/${el.steps.length}</b>`;
    $('#gSteps').innerHTML = el.steps.map((s, i) => `<span class="${i === cur.si ? 'on' : ''}${stepDone(el, i) ? ' ok' : ''}">${i + 1} ${esc(s.title)}</span>`).join('');
  }
  function render(scroll){
    const run = cur.el >= 0;
    $('#gStart').hidden = run; $('#gRun').hidden = !run;
    if (!run){ cards(); if (scroll) root.scrollIntoView({block:'start'}); return; }
    const el = Ld.elements[cur.el], s = el.steps[cur.si], body = $('#gBody');
    $('#gTitle').textContent = `${cur.el + 1}. ${el.title}: ${s.title}`;
    body.innerHTML = '';
    if (s.kind === 'text'){ body.innerHTML = `<div class="g-lead">${s.html}</div>`; mark(stepKeys(el, cur.si)[0]); }
    else if (s.kind === 'art'){
      body.innerHTML = (s.lead ? `<p class="g-lead">${s.lead}</p>` : '') + `<div class="figs">${s.items.map(it => { const d = CL.makeDevice(it.dev); const T = TYPES[d.type]; const artSvg = it.art ? (typeof it.art === 'function' ? it.art(d) : (CL.art[it.art] || CL.art[it.art + 'Art'])(d)) : T.art ? T.art(d) : '';
        return `<figure class="fig"><h3>${esc(it.title)}</h3><div class="fig-art">${artSvg}</div>${it.noSym ? '' : `<div class="fig-syms"><div class="fig-sym"><b>IEC 60617 symbol (European)</b>${CL.sym.iec(d, {on:false})}</div><div class="fig-sym"><b>NEMA / ANSI symbol (American)</b>${[].concat(it.nema).map(k => typeof k === 'object' ? CL.sym.nema(k.k, k.opt) : CL.sym.nema(k, it.nemaOpt)).join('')}</div></div>`}${it.cap ? `<figcaption>${it.cap}</figcaption>` : ''}</figure>`; }).join('')}</div>`;
      mark(stepKeys(el, cur.si)[0]);
    }
    else if (s.kind === 'sim'){
      body.innerHTML = (s.lead ? `<p class="g-lead">${s.lead}</p>` : '') + s.sims.map((_, i) => `<div data-sim="${i}"></div>`).join('');
      const k = stepKeys(el, cur.si)[0];
      s.sims.forEach((sm, i) => { const h = body.querySelector(`[data-sim="${i}"]`); live.push(sm.custom ? sm.custom(h, {onAct: () => mark(k), title:sm.title, note:sm.note}) : CL.sim(h, Object.assign({title:sm.title, note:sm.note}, sm.dev), {onAct: () => mark(k)})); });
    }
    else if (s.kind === 'bench'){
      const exs = s.ex, sel = (startEx && exs.indexOf(startEx) > -1 ? startEx : null) || cur.ex[s.ex.join()] || exs.find(x => !CL.store.has(`${LID}/ex/${x}`)) || exs[0];
      startEx = null;
      cur.ex[s.ex.join()] = sel;
      body.innerHTML = (exs.length > 1 ? `<div class="ex-tabs" role="group" aria-label="Exercises">${exs.map((x, i) => `<button type="button" class="btn${CL.store.has(`${LID}/ex/${x}`) ? ' done' : ''}" data-ex="${x}" aria-pressed="${x === sel}"><span class="k">${CL.store.has(`${LID}/ex/${x}`) ? '✓' : i + 1}</span>${esc(Ld.exercises[x].short || Ld.exercises[x].title)}</button>`).join('')}</div>` : '') + '<div class="bn-host"></div>';
      const tabs = body.querySelector('.ex-tabs');
      if (tabs) tabs.addEventListener('click', e => { const b = e.target.closest('[data-ex]'); if (!b) return; cur.ex[s.ex.join()] = b.dataset.ex; cleanup(); render(); });
      live.push(CL.bench(body.querySelector('.bn-host'), Ld.exercises[sel], {key:`${LID}/${sel}`, passKey:`${LID}/ex/${sel}`, onPass: () => { mark(`${LID}/ex/${sel}`); const b = tabs && tabs.querySelector(`[data-ex="${sel}"]`); if (b){ b.classList.add('done'); b.querySelector('.k').textContent = '✓'; } },
        onReset: () => { CL.store.set(`${LID}/ex/${sel}`, null); summary(); progress(); const b = tabs && tabs.querySelector(`[data-ex="${sel}"]`); if (b){ b.classList.remove('done'); b.querySelector('.k').textContent = String(exs.indexOf(sel) + 1); } }}));
    }
    else if (s.kind === 'quiz'){
      body.innerHTML = '<div class="qz-host"></div>';
      CL.quiz(body.querySelector('.qz-host'), s.qs, `${LID}/q/${el.id}`, () => { summary(); progress(); });
    }
    progress();
    const last = cur.si === el.steps.length - 1;
    $('#gPrev').textContent = cur.si === 0 ? '‹ Items' : 'Previous';
    $('#gNext').textContent = last ? (cur.el < Ld.elements.length - 1 ? 'Next item ›' : 'Done ✓ back to items') : 'Next';
    if (scroll) $('#gRun').scrollIntoView({block:'start'});
  }
  $('#gCards').addEventListener('click', e => { const b = e.target.closest('[data-el]'); if (b) go(+b.dataset.el, 0, true); });
  $('#gBack').addEventListener('click', () => go(-1, 0, true));
  $('#gProg').addEventListener('click', e => { const b = e.target.closest('[data-si]'); if (b) go(cur.el, +b.dataset.si, false); });
  $('#gPrev').addEventListener('click', () => { if (cur.si === 0) go(-1, 0, true); else go(cur.el, cur.si - 1, true); });
  $('#gNext').addEventListener('click', () => { const el = Ld.elements[cur.el]; if (cur.si < el.steps.length - 1) go(cur.el, cur.si + 1, true); else if (cur.el < Ld.elements.length - 1) go(cur.el + 1, 0, true); else go(-1, 0, true); });
  // start: deep link (#sw/2) or the start screen
  const m = /^#([\w-]+)\/(\d+)(?:\/([\w-]+))?$/.exec(location.hash || '');
  if (m){ const ei = Ld.elements.findIndex(e => e.id === m[1]); if (ei > -1){ cur.el = ei; cur.si = clamp(+m[2] - 1, 0, Ld.elements[ei].steps.length - 1); startEx = m[3] || null; } }
  summary();
  render(false);
  return {go};
};
})();

/* قفل الدروس بالترتيب: assets/lesson-gate.js */
;(function(){ if (typeof document === "undefined" || window.LEGate) return; var s = document.createElement("script"); s.src = "/assets/lesson-gate.js?v=20261029g1"; document.head.appendChild(s); })();
