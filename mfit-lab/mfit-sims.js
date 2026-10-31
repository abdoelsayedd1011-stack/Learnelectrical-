/* كورس ميكانيكا الماكينات: the workshop games. Each one is a small game in rounds on a real machine drawing;
   the lesson's «sim» task is marked when the last round is won.
   Needs mfit.js (IL) loaded first. The shell helpers are the same as mech-lab/mech-sims.js (copied). */
(function(){
'use strict';
const MF = window.MF = {};
const T = IL.T, EN = IL.EN, esc = IL.esc, fmt = IL.fmt;
const NS = 'http://www.w3.org/2000/svg';
const n = (v, d) => fmt(v, d == null ? 1 : d);
const bd = s => `<bdi dir="ltr">${s}</bdi>`;

/* ---------------- shell: title · goal · drawing · readouts · controls · message ---------------- */
function frame(host, title, vb){
  host.classList.add('wd', 'ms');
  host.innerHTML = `<h3>${title}</h3><p class="ms-goal"><span class="ms-r"></span><span class="ms-g"></span></p>
    <div class="wd-art"><svg viewBox="${vb}" role="img" aria-label="${esc(title)}"></svg></div>
    <div class="ms-read"></div><div class="wd-ctl"></div><p class="ms-msg" aria-live="polite"></p>`;
  const q = s => host.querySelector(s);
  return {host, svg:q('svg'), read:q('.ms-read'), ctl:q('.wd-ctl'), goal:q('.ms-g'), rno:q('.ms-r'), msg:q('.ms-msg')};
}
/* slider: {label, min, max, step, value, unit, dec} → {get, set, lock} */
function slider(g, o, onIn){
  const lab = document.createElement('label');
  lab.innerHTML = `<span>${o.label}</span> <b></b><input type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${o.value}">`;
  const inp = lab.querySelector('input'), out = lab.querySelector('b');
  const show = () => { out.textContent = n(+inp.value, o.dec == null ? 0 : o.dec) + (o.unit ? (o.unit === '°' ? '' : ' ') + o.unit : ''); };
  inp.addEventListener('input', () => { show(); onIn && onIn(+inp.value, false); });
  inp.addEventListener('change', () => { onIn && onIn(+inp.value, true); });
  g.ctl.appendChild(lab); show();
  return {get: () => +inp.value, set(v){ inp.value = v; show(); }, lock(on){ inp.disabled = !!on; lab.classList.toggle('lock', !!on); }, el:lab};
}
function button(g, text, fn, pri){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (pri ? ' pri' : ''); b.innerHTML = text;
  b.addEventListener('click', fn); g.ctl.appendChild(b); return b;
}
/* readouts: [[key, label]] → set(key, html) */
function readouts(g, list){
  g.read.innerHTML = list.map(([k, l]) => `<span class="ms-chip" data-k="${k}"><span>${l}</span> <b>–</b></span>`).join('');
  return (k, v) => { const b = g.read.querySelector(`[data-k="${k}"] b`); if (b) b.innerHTML = v; };
}
/* rounds: list of {goal, ...}. start(i) is called for each round; win() moves on; the last win marks the task. */
function rounds(g, list, lesson, start){
  let i = 0, won = false;
  const nextB = document.createElement('button'); nextB.type = 'button'; nextB.className = 'btn pri ms-next'; nextB.hidden = true;
  g.host.appendChild(nextB);
  function go(k){
    i = k; won = false; nextB.hidden = true;
    g.rno.textContent = T(`الجولة ${i + 1} من ${list.length}`, `Round ${i + 1} of ${list.length}`);
    g.goal.innerHTML = '🎯 ' + list[i].goal;
    say('', '');
    g.host.classList.remove('won');
    start(list[i], i);
  }
  function say(t, cls){ g.msg.className = 'ms-msg' + (cls ? ' ' + cls : ''); g.msg.innerHTML = t; }
  nextB.addEventListener('click', () => go(i + 1 < list.length ? i + 1 : 0));
  const api = {
    get i(){ return i; }, get won(){ return won; }, say,
    win(t){
      if (won) return; won = true;
      const last = i === list.length - 1;
      say('✓ ' + t + (last ? ' ' + T('خلصت التمرين كله 🎉', 'You finished the whole exercise 🎉') : ''), 'ok');
      g.host.classList.add('won');
      nextB.textContent = last ? T('العب من الأول', 'Play again') : T('الجولة الجاية ←', 'Next round →');
      nextB.hidden = false;
      if (last) IL.mark(lesson, 'sim');
    },
    miss(t){ if (!won) say(t, 'no'); }
  };
  if (IL.has(lesson, 'sim')) g.host.classList.add('done');
  setTimeout(() => go(0));
  return api;
}
function el(svg, tag, attrs){ const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); svg.appendChild(e); return e; }
function set(e, attrs){ for (const k in attrs) e.setAttribute(k, attrs[k]); }
/* arrow from (x1,y1) to (x2,y2), head size h */
function arrowPath(x1, y1, x2, y2, h){
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  if (L < 1) return '';
  h = Math.min(h || 10, L * 0.6);
  const ux = dx / L, uy = dy / L, bx = x2 - ux * h, by = y2 - uy * h;
  return `M${x1},${y1}L${bx},${by}M${x2},${y2}L${bx - uy * h * 0.55},${by + ux * h * 0.55}L${bx + uy * h * 0.55},${by - ux * h * 0.55}Z`;
}
/* run fn(dt) every frame until it returns false */
function run(fn){
  let last = 0, id = 0, stopped = false;
  function step(ts){ if (stopped) return; const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts; if (fn(dt) === false) return; id = requestAnimationFrame(step); }
  id = requestAnimationFrame(step);
  return () => { stopped = true; cancelAnimationFrame(id); };
}
MF._ = {frame, slider, button, readouts, rounds, el, set, arrowPath, run, n, bd};

/* ============ 1 · drive train: find the parts of a conveyor drive ============
   side view: motor → coupling → gearbox → output shaft (key) → chain up to the drum shaft (two pillow-block bearings). */
MF.drive = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('السير الناقل: اعرف كل جزء', 'The conveyor drive: know every part'), '0 0 480 300');
  host.classList.add('mf-drive');
  const s = g.svg;
  const STEEL = '#8d9499', DARK = '#5c636a', BODY = '#3d6e8f', GB = '#4f6b4a';
  el(s, 'rect', {x:0, y:0, width:480, height:300, fill:'var(--panel)'});
  el(s, 'rect', {x:4, y:263, width:472, height:10, rx:2, fill:'var(--line)'});            // base frame
  el(s, 'rect', {x:250, y:110, width:226, height:8, rx:2, fill:'var(--line)'});           // top frame
  el(s, 'rect', {x:452, y:118, width:10, height:145, fill:'var(--line)'});
  const P = {};
  const part = (id, hit) => { const p = el(s, 'g', {class:'pt', 'data-p':id, tabindex:0, role:'button'}); el(p, 'rect', Object.assign({class:'hit', rx:8}, hit)); P[id] = (P[id] || []).concat(p); return p; };
  /* moving stripes: a thick dashed line whose dash offset scrolls = a turning surface seen from the side */
  const spin = (p, x, y1, y2, w, op) => el(p, 'line', {x1:x, y1:y1, x2:x, y2:y2, stroke:'#000', 'stroke-width':w, 'stroke-dasharray':'3 7', opacity:op || .22});
  // motor
  let p = part('motor', {x:4, y:166, width:146, height:100});
  el(p, 'rect', {x:8, y:192, width:14, height:56, rx:4, fill:DARK});
  el(p, 'rect', {x:20, y:185, width:110, height:70, rx:9, fill:BODY});
  for (let x = 30; x < 126; x += 9) el(p, 'line', {x1:x, y1:188, x2:x, y2:252, stroke:'#2c536d', 'stroke-width':2});
  el(p, 'rect', {x:62, y:171, width:32, height:15, rx:3, fill:'#2c536d'});
  el(p, 'rect', {x:30, y:254, width:90, height:9, rx:2, fill:DARK});
  el(p, 'rect', {x:130, y:215, width:20, height:10, fill:STEEL});
  const sMotor = spin(p, 140, 215, 225, 20, .3);
  // coupling
  p = part('coupling', {x:148, y:196, width:42, height:48});
  el(p, 'rect', {x:150, y:202, width:16, height:36, rx:3, fill:STEEL, stroke:DARK});
  el(p, 'rect', {x:166, y:204, width:4, height:32, fill:'#e07a1f'});
  el(p, 'rect', {x:170, y:202, width:16, height:36, rx:3, fill:STEEL, stroke:DARK});
  const sCoup = spin(p, 168, 202, 238, 36, .25);
  // gearbox
  p = part('gearbox', {x:186, y:160, width:110, height:102});
  el(p, 'rect', {x:186, y:215, width:12, height:10, fill:STEEL});
  el(p, 'rect', {x:196, y:176, width:96, height:80, rx:7, fill:GB});
  el(p, 'rect', {x:204, y:254, width:80, height:9, rx:2, fill:DARK});
  el(p, 'rect', {x:226, y:166, width:8, height:11, rx:2, fill:DARK});                   // breather
  el(p, 'circle', {cx:276, cy:236, r:6, fill:'#d8e7f0', stroke:DARK, 'stroke-width':1.5}); // oil sight glass
  el(p, 'line', {x1:271, y1:237, x2:281, y2:237, stroke:'#c99a1c', 'stroke-width':2});
  for (let y = 186; y < 250; y += 12) el(p, 'line', {x1:206, y1:y, x2:282, y2:y, stroke:'#425b3e', 'stroke-width':1.5});
  // output shaft + key
  p = part('key', {x:292, y:200, width:36, height:34});
  el(p, 'rect', {x:292, y:215, width:42, height:10, fill:STEEL});
  el(p, 'rect', {x:302, y:211, width:16, height:5, rx:1, fill:'#c99a1c', stroke:'#8a6a12', 'stroke-width':1});
  const sOut = spin(p, 312, 215, 225, 40, .2);
  // chain (small sprocket below, big sprocket above, strand between them)
  p = part('chain', {x:320, y:48, width:28, height:198});
  el(p, 'rect', {x:330, y:203, width:8, height:34, rx:2, fill:DARK});
  el(p, 'rect', {x:330, y:54, width:8, height:52, rx:2, fill:DARK});
  const sChain = el(p, 'line', {x1:334, y1:58, x2:334, y2:233, stroke:'#2a2f33', 'stroke-width':9, 'stroke-dasharray':'5 3'});
  // drum shaft + bearings + drum
  el(s, 'rect', {x:256, y:76, width:216, height:8, fill:STEEL});
  [[262, 'bearing'], [442, 'bearing']].forEach(([x, id]) => {
    const q = part(id, {x:x - 8, y:52, width:46, height:60});
    el(q, 'rect', {x:x, y:94, width:30, height:9, rx:2, fill:DARK});
    el(q, 'path', {d:`M${x + 4},103 L${x + 4},80 A11,11 0 0 1 ${x + 26},80 L${x + 26},103 Z`, fill:'#7a5a3a'});
    el(q, 'circle', {cx:x + 15, cy:80, r:6, fill:STEEL});
    el(q, 'rect', {x:x + 13, y:59, width:4, height:8, fill:'#c99a1c'});                 // grease nipple
    el(q, 'circle', {cx:x + 15, cy:58, r:3, fill:'#c99a1c'});
  });
  p = part('drum', {x:352, y:30, width:90, height:100});
  el(p, 'rect', {x:360, y:40, width:76, height:80, rx:10, fill:'#6f7880'});
  const sDrum = spin(p, 398, 42, 118, 74, .18);
  el(p, 'rect', {x:356, y:34, width:84, height:7, rx:3, fill:'#2a2f33'});
  el(p, 'rect', {x:356, y:119, width:84, height:7, rx:3, fill:'#2a2f33'});
  // speed labels (always shown: they are part of the lesson)
  const lab = (x, y, t) => { const e = el(s, 'text', {x, y, class:'rpm', 'text-anchor':'middle'}); e.textContent = t; return e; };
  lab(75, 282, '1450 rpm'); lab(244, 282, '72 rpm'); lab(398, 22, '48 rpm');
  const tags = {};
  const TAGPOS = {motor:[75, 162], coupling:[168, 192], gearbox:[244, 156], key:[310, 196], chain:[372, 176], bearing:[277, 46], drum:[398, 146]};
  Object.keys(TAGPOS).forEach(k => { const e = el(s, 'text', {x:TAGPOS[k][0], y:TAGPOS[k][1], class:'tag', 'text-anchor':'middle'}); e.style.display = 'none'; tags[k] = e; });

  const NAME = {
    motor:[T('الموتور', 'Motor'), T('بيدّي الحركة: <bdi dir="ltr">1450 rpm</bdi>', 'it makes the motion: 1450 rpm')],
    coupling:[T('الكوبلنج', 'Coupling'), T('بيوصل عمود الموتور بعمود الجيربوكس', 'it joins the motor shaft to the gearbox shaft')],
    gearbox:[T('الجيربوكس', 'Gearbox'), T('بيقلل السرعة ويكبّر العزم', 'it cuts the speed and multiplies the torque')],
    key:[T('الخابور', 'Key'), T('بيمسك السبروكت في العمود عشان ما يلفّش عليه', 'it locks the sprocket to the shaft so it cannot slip')],
    chain:[T('الجنزير', 'Chain'), T('بينقل الحركة لعمود تاني بعيد', 'it carries the motion to another shaft')],
    bearing:[T('كرسي الرولمان', 'Bearing housing'), T('بيشيل العمود ويخلّيه يلف ناعم', 'it carries the shaft and lets it turn smoothly')],
    drum:[T('الدرام (الحمل)', 'Drum (the load)'), T('ده الحمل اللي بيسحب سير الكونفاير', 'this is the load that pulls the conveyor belt')]
  };
  const rd = readouts(g, [['q', T('دوّر على', 'Find')], ['k', T('لقيت', 'Found')]]);
  let cur = null, step = 0, misses = 0, lock = false;
  function ask(){
    const a = cur.asks[step];
    rd('q', a.q); rd('k', `${step} / ${cur.asks.length}`); misses = 0;
  }
  function setup(r){
    cur = r; step = 0; lock = false;
    Object.values(P).flat().forEach(e => e.classList.remove('ok', 'no'));
    Object.values(tags).forEach(e => { e.style.display = 'none'; });
    ask();
  }
  function tap(id){
    if (!cur || lock || game.won) return;
    const a = cur.asks[step];
    if (a.want.includes(id)){
      a.want.forEach(w => (P[w] || []).forEach(e => e.classList.add('ok')));
      tags[id].textContent = NAME[id][0]; tags[id].style.display = '';
      step++;
      if (step === cur.asks.length){ rd('k', `${step} / ${step}`); game.win(cur.ok); return; }
      game.say('✓ ' + (a.ok || NAME[id][0] + ': ' + NAME[id][1]), 'ok');
      ask(); return;
    }
    misses++;
    (P[id] || []).forEach(e => e.classList.add('no'));
    lock = true; setTimeout(() => { (P[id] || []).forEach(e => e.classList.remove('no')); lock = false; }, 700);
    game.miss(T(`ده ${NAME[id][0]}: ${NAME[id][1]}.`, `That is the ${NAME[id][0].toLowerCase()}: ${NAME[id][1]}.`) + (misses >= 2 && a.hint ? ' 💡 ' + a.hint : ' ' + T('جرّب تاني.', 'Try again.')));
  }
  IL.onAct(host, '.pt', t => tap(t.dataset.p));
  // turning: motor fast, gearbox output slow, drum slower; the chain moves at the sprocket rim speed
  let off = 0;
  IL.animate(host, dt => {
    off += dt;
    set(sMotor, {'stroke-dashoffset':(off * 140).toFixed(1)}); set(sCoup, {'stroke-dashoffset':(off * 140).toFixed(1)});
    set(sOut, {'stroke-dashoffset':(off * 9).toFixed(1)}); set(sDrum, {'stroke-dashoffset':(off * 8).toFixed(1)});
    set(sChain, {'stroke-dashoffset':(-off * 12).toFixed(1)});
  });
  const q = (ar, en) => T(ar, en);
  const game = rounds(g, [
    {goal:q('دوس على كل جزء نطلبه منك في المكنة.', 'Tap each part we ask for.'), ok:q('عرفت الأجزاء الأساسية في أي خط نقل حركة.', 'You know the main parts of any drive train.'), asks:[
      {q:q('الكوبلنج', 'the coupling'), want:['coupling'], hint:q('هو الوصلة الصغيرة اللي بين الموتور والجيربوكس.', 'It is the small joint between the motor and the gearbox.')},
      {q:q('الجيربوكس', 'the gearbox'), want:['gearbox'], hint:q('الصندوق الأخضر اللي فيه عين الزيت.', 'The green box with the oil sight glass.')},
      {q:q('الجنزير', 'the chain'), want:['chain'], hint:q('اللي طالع لفوق ورابط العمودين.', 'The strand going up between the two shafts.')},
      {q:q('كرسي الرولمان', 'a bearing housing'), want:['bearing'], hint:q('اللي شايل عمود الدرام من تحت وفوقه بز الشحم.', 'It carries the drum shaft and has a grease nipple on top.')}]},
    {goal:q('السرعة والعزم: دوس على الإجابة.', 'Speed and torque: tap the answer.'), ok:q('السرعة بتقل من الموتور للحمل، والعزم بيزيد بنفس النسبة تقريبًا.', 'Speed falls from motor to load, and torque rises by about the same ratio.'), asks:[
      {q:q('أسرع جزء بيلف', 'the fastest turning part'), want:['motor', 'coupling'], ok:q('الموتور والكوبلنج بيلفّوا <bdi dir="ltr">1450 rpm</bdi>.', 'Motor and coupling turn at 1450 rpm.'), hint:q('بص على أرقام الـ rpm.', 'Look at the rpm numbers.')},
      {q:q('اللي بيقلل السرعة 20 مرة', 'the part that cuts speed 20 times'), want:['gearbox'], ok:q('<bdi dir="ltr">1450 ÷ 20 ≈ 72 rpm</bdi>.', '1450 ÷ 20 ≈ 72 rpm.'), hint:q('<bdi dir="ltr">1450</bdi> بقت <bdi dir="ltr">72</bdi> بعد أنهي جزء؟', 'After which part does 1450 become 72?')},
      {q:q('أعلى عزم في المكنة', 'the highest torque in the machine'), want:['drum'], ok:q('أبطأ عمود = أعلى عزم. الدرام حوالي <bdi dir="ltr">275 N·m</bdi>.', 'The slowest shaft has the highest torque: about 275 N·m on the drum.'), hint:q('أبطأ حاجة بتلف هي اللي عزمها أعلى.', 'The slowest part has the highest torque.')},
      {q:q('اللي بيمنع السبروكت يلف على العمود', 'what stops the sprocket slipping on its shaft'), want:['key'], hint:q('قطعة صغيرة صفرا على عمود خرج الجيربوكس.', 'A small yellow piece on the gearbox output shaft.')}]},
    {goal:q('الصيانة: فين بتعمل كل حاجة؟', 'Maintenance: where do you do each job?'), ok:q('دي أهم 4 شغلانات صيانة، وكل واحدة ليها درس في الكورس.', 'These are the 4 key maintenance jobs, and each has its own lesson in this course.'), asks:[
      {q:q('فين بتحط الشحم؟', 'where does the grease go?'), want:['bearing'], ok:q('بز الشحم فوق كرسي الرولمان.', 'Through the grease nipple on the bearing housing.'), hint:q('دوّر على البز الأصفر الصغير.', 'Look for the small yellow nipple.')},
      {q:q('فين بتعمل المحاذاة (Alignment)؟', 'where do you check alignment?'), want:['coupling'], ok:q('بين عمود الموتور وعمود الجيربوكس، عند الكوبلنج.', 'Between the motor and gearbox shafts, at the coupling.'), hint:q('المكان اللي فيه عمودين بيتقابلوا وش لوش.', 'Where two shafts meet end to end.')},
      {q:q('فين بتبص على مستوى الزيت؟', 'where do you check the oil level?'), want:['gearbox'], ok:q('عين الزيت في جنب الجيربوكس.', 'The sight glass on the gearbox side.'), hint:q('الجزء اللي جواه تروس شغالة في زيت.', 'The part with gears running in oil.')},
      {q:q('فين بتظبط الشد والرخاوة؟', 'where do you set the slack?'), want:['chain'], ok:q('الجنزير لازم يبقى فيه رخاوة صغيرة، مش مشدود على الآخر.', 'The chain needs a little slack, never fully tight.'), hint:q('اللي ممكن يرتخي مع الوقت ويطلع صوت.', 'The one that stretches with time and starts to rattle.')}]}
  ], L, setup);
};

/* ============ pick: look at the drawing, choose the answer, confirm ============
   rounds: [{goal, art (SVG markup for a 420×220 box), o:[...], a (index), ok, why}] */
MF.pick = function(host, opt){
  const g = frame(host, opt.title, opt.vb || '0 0 420 220');
  host.classList.add('mf-pick');
  const box = document.createElement('div'); box.className = 'mf-opts'; g.ctl.appendChild(box);
  const cf = document.createElement('button'); cf.type = 'button'; cf.className = 'btn pri'; cf.textContent = T('تأكيد', 'Confirm'); cf.disabled = true; g.ctl.appendChild(cf);
  let cur = null, sel = null, tries = 0;
  function setup(r){
    cur = r; sel = null; tries = 0; cf.disabled = true; cf.hidden = false;
    g.svg.innerHTML = `<rect x="0" y="0" width="420" height="220" fill="var(--panel)"/>` + (r.art || '');
    const idx = IL.shuffle(r.o.map((_, i) => i));
    box.innerHTML = idx.map(i => `<button type="button" class="btn qz-o" data-i="${i}">${r.o[i]}</button>`).join('');
  }
  box.addEventListener('click', e => {
    const b = e.target.closest('.qz-o'); if (!b || game.won) return;
    sel = +b.dataset.i; box.querySelectorAll('.qz-o').forEach(x => x.classList.toggle('sel', x === b)); cf.disabled = false;
  });
  cf.addEventListener('click', () => {
    if (sel == null || game.won) return;
    const b = box.querySelector(`.qz-o[data-i="${sel}"]`);
    if (sel === cur.a){ b.classList.remove('sel'); b.classList.add('ok'); box.querySelectorAll('.qz-o').forEach(x => { x.disabled = true; }); cf.hidden = true; game.win(cur.ok); return; }
    tries++; b.classList.remove('sel'); b.classList.add('no'); b.disabled = true; sel = null; cf.disabled = true;
    game.miss(T('مش دي. ', 'Not this one. ') + (cur.why || ''));
  });
  const game = rounds(g, opt.rounds, opt.lesson, setup);
};

/* ============ 3 · flange: star-pattern sequence, then the torque wrench ============ */
MF.flange = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('فلانشة 8 مسامير', 'An 8-bolt flange'), '0 0 420 260');
  host.classList.add('mf-flange');
  const s = g.svg, CX = 150, CY = 130, RB = 82;
  el(s, 'rect', {x:0, y:0, width:420, height:260, fill:'var(--panel)'});
  el(s, 'circle', {cx:CX, cy:CY, r:112, fill:'#8d9499', stroke:'#5c636a', 'stroke-width':2});
  el(s, 'circle', {cx:CX, cy:CY, r:52, fill:'var(--panel)', stroke:'#5c636a', 'stroke-width':2});
  el(s, 'circle', {cx:CX, cy:CY, r:44, fill:'none', stroke:'#2a2f33', 'stroke-width':3, 'stroke-dasharray':'2 4'});
  const B = [];
  for (let i = 0; i < 8; i++){
    const a = -Math.PI / 2 + i * Math.PI / 4, x = CX + RB * Math.cos(a), y = CY + RB * Math.sin(a);
    const gg = el(s, 'g', {class:'pt bolt', 'data-b':i, tabindex:0, role:'button', 'aria-label':T('مسمار ', 'Bolt ') + (i + 1)});
    el(gg, 'circle', {cx:x, cy:y, r:20, class:'hit'});
    const hx = el(gg, 'path', {d:Array.from({length:6}, (_, k) => { const t = k * Math.PI / 3 + Math.PI / 6; return (k ? 'L' : 'M') + (x + 13 * Math.cos(t)).toFixed(1) + ',' + (y + 13 * Math.sin(t)).toFixed(1); }).join('') + 'Z', fill:'#c4cacf', stroke:'#2a2f33', 'stroke-width':1.5});
    const tx = el(gg, 'text', {x, y:y + 5, 'text-anchor':'middle', 'font-size':13, 'font-weight':700, fill:'#2a2f33'});
    B.push({gg, hx, tx, x, y});
  }
  // torque wrench dial
  const wr = el(s, 'g', {});
  el(wr, 'rect', {x:290, y:40, width:116, height:180, rx:12, fill:'var(--bg)', stroke:'var(--line)'});
  const wt = el(wr, 'text', {x:348, y:70, 'text-anchor':'middle', 'font-size':12, fill:'var(--muted)'}); wt.textContent = T('مفتاح العزم', 'Torque wrench');
  const wv = el(wr, 'text', {x:348, y:130, 'text-anchor':'middle', 'font-size':30, 'font-weight':700, fill:'var(--accent)', 'font-family':'var(--font-mono)'});
  el(wr, 'text', {x:348, y:156, 'text-anchor':'middle', 'font-size':13, fill:'var(--muted)', 'font-family':'var(--font-mono)'}).textContent = 'N·m';
  const wb = el(wr, 'rect', {x:306, y:180, width:84, height:10, rx:5, fill:'var(--line)'});
  const wf = el(wr, 'rect', {x:306, y:180, width:0, height:10, rx:5, fill:'var(--accent)'});
  const rd = readouts(g, [['k', T('المطلوب', 'Target')]]);
  const tq = slider(g, {label:T('ظبّط مفتاح العزم', 'Set the torque wrench'), min:0, max:250, step:5, value:20, unit:'N·m'}, v => showW(v));
  const go = button(g, T('اربط', 'Tighten'), () => fire(), true);
  const ORDER = [0, 4, 2, 6, 1, 5, 3, 7];
  let cur = null, step = 0;
  function showW(v){ wv.textContent = v; set(wf, {width:(84 * v / 250).toFixed(1)}); }
  function paint(){ B.forEach((b, i) => { const k = cur && cur.k === 'seq' ? ORDER.indexOf(i) : -1; const done = k > -1 && k < step; set(b.hx, {fill:done ? '#3fae5a' : '#c4cacf'}); b.tx.textContent = i + 1; b.gg.classList.remove('no'); }); }
  function setup(r){
    cur = r; step = 0; paint();
    const seq = r.k === 'seq';
    tq.el.hidden = seq; go.hidden = seq; wr.style.display = seq ? 'none' : '';
    tq.set(20); showW(20);
    rd('k', r.show);
  }
  IL.onAct(host, '.bolt', t => {
    if (!cur || cur.k !== 'seq' || game.won) return;
    const i = +t.dataset.b;
    if (i === ORDER[step]){ step++; paint(); if (step === 8) game.win(cur.ok); else game.say(T(`تمام. فاضل ${8 - step}`, `Good. ${8 - step} to go`), ''); return; }
    B[i].gg.classList.add('no'); setTimeout(() => B[i].gg.classList.remove('no'), 600);
    game.miss(step === 0 ? T('ابدأ بالمسمار اللي فوق خالص (رقم 1).', 'Start with the top bolt (number 1).') : T('روح للمسمار اللي <b>قصاد</b> آخر واحد ربطته، أو لنص المسافة الفاضية.', 'Go to the bolt <b>opposite</b> the last one, or halfway round the gap.'));
  });
  function fire(){
    if (!cur || cur.k === 'seq' || game.won) return;
    const v = tq.get();
    if (Math.abs(v - cur.want) <= cur.tol){ B.forEach(b => set(b.hx, {fill:'#3fae5a'})); game.win(cur.ok); }
    else game.miss(v < cur.want ? T(`<bdi dir="ltr">${v} N·m</bdi> قليل: المسمار هيفك مع الاهتزاز.`, `${v} N·m is too low: the bolt will shake loose.`) : T(`<bdi dir="ltr">${v} N·m</bdi> كتير: ممكن يتمط أو يتقطع.`, `${v} N·m is too much: it can stretch or snap.`));
  }
  const game = rounds(g, [
    {k:'seq', goal:T('اربط المسامير بترتيب النجمة: ابدأ برقم 1 فوق.', 'Tighten in a star pattern: start with bolt 1 at the top.'), show:T('ترتيب النجمة', 'Star pattern'), ok:T('<bdi dir="ltr">1-5-3-7-2-6-4-8</bdi>: الضغط بيتوزّع والجوان ما بيتزقّش لناحية.', '1-5-3-7-2-6-4-8: the load spreads evenly and the gasket is not pushed to one side.')},
    {k:'tq', want:85, tol:0, goal:T('مسمار <bdi dir="ltr">M12</bdi> درجة <bdi dir="ltr">8.8</bdi>. ظبّط المفتاح على العزم من الجدول.', 'An M12 grade 8.8 bolt. Set the wrench to the table torque.'), show:'<bdi dir="ltr">M10 = 49 · M12 = 85 · M16 = 210 N·m</bdi>', ok:T('<bdi dir="ltr">85 N·m</bdi> بالظبط. اسحب ببطء لحد ما المفتاح يطقطق.', 'Exactly 85 N·m. Pull slowly until the wrench clicks.')},
    {k:'tq', want:65, tol:5, goal:T('فلانشة مسامير <bdi dir="ltr">M16 8.8</bdi>. المرحلة الأولى = <bdi dir="ltr">30%</bdi> من العزم.', 'M16 8.8 flange bolts. Stage one is 30% of the torque.'), show:'<bdi dir="ltr">M16 = 210 N·m</bdi>', ok:T('<bdi dir="ltr">30%</bdi> ثم <bdi dir="ltr">70%</bdi> ثم <bdi dir="ltr">100%</bdi>، وكل مرحلة بترتيب النجمة.', '30%, then 70%, then 100%, each stage in the star pattern.')}
  ], L, setup);
};

/* ============ 6 · alignment: shim the motor feet ============
   the gearbox shaft is fixed. Motor front feet are 200 mm and rear feet 500 mm behind the coupling face. */
MF.align = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('محاذاة موتور على جيربوكس', 'Aligning a motor to a gearbox'), '0 0 440 240');
  host.classList.add('mf-align');
  const s = g.svg, AX = 110, K = 90; // exaggeration: 1 mm → 90 px
  el(s, 'rect', {x:0, y:0, width:440, height:240, fill:'var(--panel)'});
  el(s, 'rect', {x:0, y:206, width:440, height:12, fill:'var(--line)'});
  el(s, 'rect', {x:300, y:70, width:120, height:120, rx:8, fill:'#4f6b4a'});
  el(s, 'rect', {x:270, y:AX - 5, width:30, height:10, fill:'#8d9499'});
  el(s, 'line', {x1:0, y1:AX, x2:440, y2:AX, stroke:'var(--accent)', 'stroke-dasharray':'6 5', 'stroke-width':1.2});
  const mot = el(s, 'g', {});
  el(mot, 'rect', {x:40, y:AX - 42, width:180, height:84, rx:10, fill:'#3d6e8f'});
  el(mot, 'rect', {x:220, y:AX - 5, width:40, height:10, fill:'#8d9499'});
  const cpl = el(s, 'rect', {x:258, y:AX - 18, width:14, height:36, rx:3, fill:'#e07a1f'});
  const shR = el(s, 'rect', {x:56, width:28, fill:'#c99a1c'}), shF = el(s, 'rect', {x:176, width:28, fill:'#c99a1c'});
  const ftR = el(s, 'rect', {x:52, width:36, height:14, rx:2, fill:'#5c636a'}), ftF = el(s, 'rect', {x:172, width:36, height:14, rx:2, fill:'#5c636a'});
  const lab = el(s, 'text', {x:220, y:232, 'text-anchor':'middle', 'font-size':11, fill:'var(--muted)', 'font-family':'var(--font-body)'}); lab.textContent = T('الرسمة مكبّرة 90 مرة عشان تبان', 'Drawing exaggerated ×90 so you can see it');
  const rd = readouts(g, [['o', T('الإزاحة عند الكوبلنج', 'Offset at coupling')], ['a', T('الزاوية', 'Angle')]]);
  const F = slider(g, {label:T('شيمز تحت الرجل القدّامية', 'Shims under the front feet'), min:0, max:1, step:.05, value:0, unit:'mm', dec:2}, () => upd(true));
  const R = slider(g, {label:T('شيمز تحت الرجل الورّانية', 'Shims under the rear feet'), min:0, max:1, step:.05, value:0, unit:'mm', dec:2}, () => upd(true));
  let cur = null, tmr = 0;
  function upd(chk){
    if (!cur) return;
    const eF = cur.f - F.get(), eR = cur.r - R.get(); // how low each foot still is (mm)
    const slope = (eR - eF) / 300, off = eF - slope * 200; // at the coupling face
    const yF = AX + eF * K, yR = AX + eR * K; // shaft height at front/rear feet in the drawing
    const ang = Math.asin(Math.max(-1, Math.min(1, (yF - yR) / 120))) * 180 / Math.PI;
    set(mot, {transform:`translate(0 ${(yF - AX).toFixed(1)}) rotate(${ang.toFixed(2)} 190 ${AX})`});
    set(cpl, {transform:`translate(0 ${(off * K / 2).toFixed(1)})`});
    set(shR, {y:(206 - Math.max(1, R.get() * 30)).toFixed(1), height:Math.max(1, R.get() * 30).toFixed(1)});
    set(shF, {y:(206 - Math.max(1, F.get() * 30)).toFixed(1), height:Math.max(1, F.get() * 30).toFixed(1)});
    set(ftR, {y:(192 - R.get() * 30).toFixed(1)}); set(ftF, {y:(192 - F.get() * 30).toFixed(1)});
    rd('o', bd(n(Math.abs(off), 2) + ' mm') + ' ' + (off > 0.004 ? T('واطي', 'low') : off < -0.004 ? T('عالي', 'high') : '✓'));
    rd('a', bd(n(Math.abs(slope * 100), 2) + ' mm/100mm'));
    if (!chk) return;
    clearTimeout(tmr); tmr = setTimeout(() => {
      if (Math.abs(eF) < .026 && Math.abs(eR) < .026) game.win(cur.ok);
      else game.miss(T(`لسه: القدّامية ${eF > 0 ? 'واطية' : 'عالية'} <bdi dir="ltr">${n(Math.abs(eF), 2)} mm</bdi> والورّانية ${eR > 0 ? 'واطية' : 'عالية'} <bdi dir="ltr">${n(Math.abs(eR), 2)} mm</bdi>.`, `Not yet: front is ${n(Math.abs(eF), 2)} mm ${eF > 0 ? 'low' : 'high'}, rear ${n(Math.abs(eR), 2)} mm ${eR > 0 ? 'low' : 'high'}.`));
    }, 700);
  }
  function setup(r){ cur = r; F.set(0); R.set(0); upd(false); }
  const game = rounds(g, [
    {f:.30, r:.50, goal:T('الموتور واطي ومايل. الحسبة بتقول: <bdi dir="ltr">0.30 mm</bdi> قدّام و<bdi dir="ltr">0.50 mm</bdi> ورا.', 'The motor sits low and tilted. The calculation says 0.30 mm front and 0.50 mm rear.'), ok:T('الإزاحة والزاوية بقوا صفر. اربط الرجول وقيس تاني.', 'Offset and angle are zero. Tighten the feet and measure again.')},
    {f:.15, r:.60, goal:T('دلوقتي من غير أرقام جاهزة: خلّي الإزاحة والزاوية صفر.', 'Now without the numbers: bring offset and angle to zero.'), ok:T('ظبّطت الزاوية الأول بالفرق بين الرجلين، وبعدين رفعت الاتنين.', 'You fixed the angle with the difference between the feet, then raised both.')},
    {f:.70, r:.40, goal:T('المرة دي الموتور مايل للناحية التانية.', 'This time the motor tilts the other way.'), ok:T('القدّامية محتاجة شيمز أكتر من الورّانية: الموتور كان مايل لقدّام.', 'The front needed more shims than the rear: the motor was nose-down.')}
  ], L, setup);
};

/* ============ order: tap the steps in the right order ============
   rounds: [{goal, steps:[...in order], ok, hint}] */
MF.order = function(host, opt){
  const g = frame(host, opt.title, '0 0 420 60');
  host.classList.add('mf-order');
  host.querySelector('.wd-art').hidden = true;
  const done = document.createElement('ol'); done.className = 'mf-done'; g.ctl.before(done);
  const box = document.createElement('div'); box.className = 'mf-opts'; g.ctl.appendChild(box);
  let cur = null, step = 0;
  function setup(r){
    cur = r; step = 0; done.innerHTML = '';
    box.innerHTML = IL.shuffle(r.steps.map((_, i) => i)).map(i => `<button type="button" class="btn qz-o" data-i="${i}">${r.steps[i]}</button>`).join('');
  }
  box.addEventListener('click', e => {
    const b = e.target.closest('.qz-o'); if (!b || !cur || game.won || b.disabled) return;
    const i = +b.dataset.i;
    if (i === step){ step++; b.remove(); const li = document.createElement('li'); li.innerHTML = cur.steps[i]; done.appendChild(li); if (step === cur.steps.length) game.win(cur.ok); else game.say('✓', 'ok'); return; }
    b.classList.add('no'); setTimeout(() => b.classList.remove('no'), 600);
    game.miss(T('مش دي الخطوة الجاية. ', 'That is not the next step. ') + (cur.hint ? cur.hint[step] || '' : ''));
  });
  const game = rounds(g, opt.rounds, opt.lesson, setup);
};

/* ============ 10 · gears: pick tooth counts (same model as mech-lab's gearbox game) ============ */
MF.gears = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('ترسين على عمودين', 'Two gears on two shafts'), '0 0 600 300');
  const s = g.svg, CY = 152, N1 = 1450, T1 = 10;
  el(s, 'rect', {x:0, y:0, width:600, height:300, fill:'var(--panel)'});
  const g1 = el(s, 'path', {fill:'#8d9499', stroke:'#5c636a', 'stroke-width':1.5});
  const g2 = el(s, 'path', {fill:'color-mix(in srgb, var(--accent) 45%, #8d9499)', stroke:'#5c636a', 'stroke-width':1.5});
  const d1 = el(s, 'circle', {r:6, fill:'#22272b'}), d2 = el(s, 'circle', {r:6, fill:'#22272b'});
  const l1 = el(s, 'text', {'font-size':12, 'font-weight':700, fill:'var(--ink)', 'text-anchor':'middle'}), l2 = el(s, 'text', {'font-size':12, 'font-weight':700, fill:'var(--ink)', 'text-anchor':'middle'});
  const rd = readouts(g, [['i', T('النسبة', 'Ratio')], ['n', T('سرعة الخرج', 'Output speed')], ['t', T('عزم الخرج', 'Output torque')]]);
  const Z1 = slider(g, {label:T('أسنان الترس الصغير (على الموتور)', 'Pinion teeth (on the motor)'), min:10, max:40, step:1, value:20}, () => upd());
  const Z2 = slider(g, {label:T('أسنان الترس الكبير', 'Wheel teeth'), min:10, max:120, step:1, value:20}, () => upd());
  let cur, a1 = 0, c1, c2, r1, r2, tmr = 0;
  const gearD = (z, r) => { let d = ''; const ro = r + 5, ri = r - 4; for (let i = 0; i < z; i++){ const a = i / z * 2 * Math.PI, w = Math.PI / z; [[ri, a - w * .5], [ro, a - w * .25], [ro, a + w * .25], [ri, a + w * .5], [ri, a + w * 1.5]].forEach(([rr, aa], j) => { d += (i || j ? 'L' : 'M') + (rr * Math.cos(aa)).toFixed(1) + ',' + (rr * Math.sin(aa)).toFixed(1); }); } return d + 'Z'; };
  function upd(){
    const z1 = Z1.get(), z2 = Z2.get(); r1 = 14 + z1 * 1.05; r2 = 14 + z2 * 1.05;
    c1 = 300 - (r1 + r2 + 2) / 2; c2 = c1 + r1 + r2 + 2;
    set(g1, {d:gearD(z1, r1)}); set(g2, {d:gearD(z2, r2)});
    set(d1, {cx:c1, cy:CY}); set(d2, {cx:c2, cy:CY});
    const n2 = N1 * z1 / z2, t2 = T1 * z2 / z1;
    set(l1, {x:c1, y:CY - r1 - 14}); l1.textContent = `z1 = ${z1}`; set(l2, {x:c2, y:Math.min(296, CY + r2 + 22)}); l2.textContent = `z2 = ${z2}`;
    rd('i', bd(n(z2 / z1, 2) + ' : 1')); rd('n', bd(n(n2, 0) + ' rpm')); rd('t', bd(n(t2, 1) + ' N·m'));
    if (!cur) return;
    clearTimeout(tmr); tmr = setTimeout(() => { const v = cur.k === 'n' ? n2 : cur.k === 'i' ? z2 / z1 : t2; if (Math.abs(v - cur.want) <= cur.tol && (!cur.z1 || z1 === cur.z1)) game.win(cur.ok); else game.miss(cur.z1 && z1 !== cur.z1 ? T(`الترس الصغير لازم يفضل <bdi dir="ltr">${cur.z1}</bdi> سنة.`, `Keep the pinion at ${cur.z1} teeth.`) : T('لسه. بص على الأرقام تحت الرسمة.', 'Not yet. Check the numbers under the drawing.')); }, 600);
  }
  upd();
  IL.animate(host, dt => { a1 += dt * 1.6; const z1 = Z1.get(), z2 = Z2.get(), a2 = -a1 * z1 / z2 + Math.PI / z2; set(g1, {transform:`translate(${c1},${CY}) rotate(${(a1 * 180 / Math.PI).toFixed(1)})`}); set(g2, {transform:`translate(${c2},${CY}) rotate(${(a2 * 180 / Math.PI).toFixed(1)})`}); });
  function setup(r){ cur = r; Z1.set(20); Z2.set(20); upd(); }
  const game = rounds(g, [
    {k:'n', want:290, tol:3, goal:T('الموتور <bdi dir="ltr">1450 rpm</bdi> والكونفاير محتاج <bdi dir="ltr">290 rpm</bdi>.', 'The motor runs at 1450 rpm and the conveyor needs 290 rpm.'), ok:T('نسبة <bdi dir="ltr">5 : 1</bdi>. السرعة = سرعة الموتور × z1 ÷ z2.', 'A 5 : 1 ratio. Speed = motor speed × z1 ÷ z2.')},
    {k:'i', want:3, tol:.001, z1:15, goal:T('ترس الموتور <bdi dir="ltr">15</bdi> سنة واتكسر الكبير. محتاج نسبة <bdi dir="ltr">3 : 1</bdi>. الكبير كام سنة؟', 'The pinion has 15 teeth and the wheel broke. You need 3 : 1. How many teeth on the new wheel?'), ok:T('<bdi dir="ltr">15 × 3 = 45</bdi> سنة. ولازم نفس الموديول عشان يعشّقوا.', '15 × 3 = 45 teeth, and the same module so they mesh.')},
    {k:'t', want:40, tol:.4, goal:T('الموتور بيدّي <bdi dir="ltr">10 N·m</bdi> والخلاط محتاج <bdi dir="ltr">40 N·m</bdi>.', 'The motor gives 10 N·m and the mixer needs 40 N·m.'), ok:T('نسبة <bdi dir="ltr">4 : 1</bdi>: العزم ×4 والسرعة ÷4.', 'A 4 : 1 ratio: torque ×4 and speed ÷4.')}
  ], L, setup);
};

/* ============ 12 · belt: tension by deflection (16 mm per 1 m of span) ============ */
MF.belt = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('شد السير بالترخيم', 'Belt tension by deflection'), '0 0 440 220');
  const s = g.svg;
  el(s, 'rect', {x:0, y:0, width:440, height:220, fill:'var(--panel)'});
  const p1 = el(s, 'circle', {cy:110, r:34, fill:'#8d9499', stroke:'#5c636a', 'stroke-width':2});
  const p2 = el(s, 'circle', {cx:360, cy:110, r:52, fill:'#8d9499', stroke:'#5c636a', 'stroke-width':2});
  const hub1 = el(s, 'circle', {cy:110, r:7, fill:'#2a2f33'}); el(s, 'circle', {cx:360, cy:110, r:9, fill:'#2a2f33'});
  const top = el(s, 'path', {fill:'none', stroke:'#2a2f33', 'stroke-width':7, 'stroke-linecap':'round'});
  const bot = el(s, 'path', {fill:'none', stroke:'#2a2f33', 'stroke-width':7, 'stroke-linecap':'round'});
  const arr = el(s, 'path', {fill:'#d2552d', stroke:'#d2552d', 'stroke-width':3});
  const ruler = el(s, 'line', {stroke:'var(--accent)', 'stroke-width':2, 'stroke-dasharray':'3 3'});
  const dt = el(s, 'text', {'font-size':13, 'font-weight':700, fill:'var(--accent)', 'font-family':'var(--font-mono)', 'text-anchor':'middle'});
  const sp = el(s, 'text', {y:206, 'font-size':12, fill:'var(--muted)', 'text-anchor':'middle', 'font-family':'mono'});
  const rd = readouts(g, [['span', T('طول البحر', 'Span')], ['d', T('الترخيم المطلوب', 'Target deflection')], ['m', T('الترخيم دلوقتي', 'Deflection now')]]);
  const X = slider(g, {label:T('مسمار الشد (حرّك الموتور)', 'Tensioning screw (move the motor)'), min:0, max:12, step:.25, value:0, unit:'mm', dec:2}, () => upd(true));
  let cur = null, tmr = 0;
  function upd(chk){
    if (!cur) return;
    const x = X.get(), d = cur.span / 1000 * cur.k / (x + 1), want = cur.span * 16 / 1000;
    const cx1 = 80 - x * 2, mid = (cx1 + 360) / 2, sag = Math.min(70, d * 2.2);
    set(p1, {cx:cx1}); set(hub1, {cx:cx1});
    set(top, {d:`M${cx1},${110 - 34} Q${mid},${110 - 43 + sag * 2} 360,${110 - 52}`});
    set(bot, {d:`M${cx1},${110 + 34} L360,${110 + 52}`});
    const ym = 110 - 43 + sag; // curve midpoint
    set(arr, {d:arrowPath(mid, ym - 46, mid, ym - 6, 10)});
    set(ruler, {x1:mid + 22, y1:110 - 43, x2:mid + 22, y2:ym});
    set(dt, {x:mid + 56, y:46}); dt.textContent = n(d, 1) + ' mm';
    set(sp, {x:(cx1 + 360) / 2}); sp.textContent = (cur.span) + ' mm';
    rd('span', bd(cur.span + ' mm')); rd('d', bd(n(want, 0) + ' mm')); rd('m', bd(n(d, 1) + ' mm'));
    if (!chk) return;
    clearTimeout(tmr); tmr = setTimeout(() => {
      if (Math.abs(d - want) <= 1) game.win(cur.ok);
      else game.miss(d > want ? T('السير لسه مرخي: هيزحلق ويصفّر ويسخن.', 'Still loose: it will slip, squeal and heat up.') : T('مشدود زيادة: رولمان الموتور هيسخن ويبوظ بدري.', 'Too tight: the motor bearing will run hot and fail early.'));
    }, 700);
  }
  function setup(r){ cur = r; X.set(0); upd(false); }
  const game = rounds(g, [
    {span:1000, k:64, goal:T('البحر <bdi dir="ltr">1000 mm</bdi>. القاعدة: <bdi dir="ltr">16 mm</bdi> ترخيم لكل متر.', 'Span 1000 mm. The rule: 16 mm of deflection per metre.'), ok:T('<bdi dir="ltr">16 mm</bdi> بالظبط تحت قوة الاختبار.', 'Exactly 16 mm under the test force.')},
    {span:750, k:72, goal:T('البحر <bdi dir="ltr">750 mm</bdi>. احسب الترخيم واشد.', 'Span 750 mm. Work out the deflection and tension.'), ok:T('<bdi dir="ltr">0.75 × 16 = 12 mm</bdi>.', '0.75 × 16 = 12 mm.')},
    {span:500, k:40, goal:T('سير جديد على بحر <bdi dir="ltr">500 mm</bdi>.', 'A new belt on a 500 mm span.'), ok:T('<bdi dir="ltr">8 mm</bdi>. والسير الجديد شيّك على شده تاني بعد يوم شغل.', '8 mm. Check a new belt again after a day of running.')}
  ], L, setup);
};

/* ============ 14 · grease: the right amount, G = 0.005 × D × B ============ */
MF.grease = function(host, opt){
  const L = opt.lesson, SHOT = 1.5;
  const g = frame(host, T('مسدس الشحم', 'The grease gun'), '0 0 440 230');
  const s = g.svg;
  el(s, 'rect', {x:0, y:0, width:440, height:230, fill:'var(--panel)'});
  el(s, 'rect', {x:120, y:40, width:200, height:150, rx:16, fill:'#7a5a3a'});
  el(s, 'circle', {cx:220, cy:115, r:62, fill:'#a9b0b5', stroke:'#5c636a', 'stroke-width':2});
  el(s, 'circle', {cx:220, cy:115, r:36, fill:'var(--panel)', stroke:'#5c636a', 'stroke-width':2});
  const fill = el(s, 'path', {fill:'#e1b12c', opacity:.9});
  for (let i = 0; i < 10; i++){ const a = i / 10 * 2 * Math.PI; el(s, 'circle', {cx:220 + 49 * Math.cos(a), cy:115 + 49 * Math.sin(a), r:9, fill:'#d7dde1', stroke:'#5c636a'}); }
  el(s, 'circle', {cx:220, cy:115, r:20, fill:'#8d9499'});
  el(s, 'rect', {x:214, y:22, width:12, height:20, fill:'#c99a1c'});
  el(s, 'path', {d:'M226,20 L330,20 L330,8 L410,8 L410,34 L330,34 L330,26 L226,26 Z', fill:'#c0352b'});
  const th = el(s, 'text', {x:60, y:115, 'text-anchor':'middle', 'font-size':22, 'font-weight':700, 'font-family':'var(--font-mono)'});
  el(s, 'text', {x:60, y:140, 'text-anchor':'middle', 'font-size':11, fill:'var(--muted)'}).textContent = T('حرارة الرولمان', 'Bearing temp');
  const nm = el(s, 'text', {x:380, y:200, 'text-anchor':'middle', 'font-size':16, 'font-weight':700, fill:'var(--ink)', 'font-family':'var(--font-mono)'});
  const rd = readouts(g, [['b', T('الرولمان', 'Bearing')], ['G', T('الكمية المطلوبة', 'Amount needed')], ['now', T('اللي حطّيته', 'You put in')]]);
  const S = slider(g, {label:T('عدد ضربات المسدس (الضربة ≈ 1.5 جم)', 'Grease-gun strokes (≈ 1.5 g each)'), min:0, max:40, step:1, value:0}, () => upd(false));
  button(g, T('شغّل المكنة وشوف', 'Run the machine and check'), () => upd(true), true);
  let cur = null;
  function upd(chk){
    if (!cur) return;
    const G = 0.005 * cur.D * cur.B, gr = S.get() * SHOT, r = gr / G;
    const f = Math.min(1, r / 2.2), y = 177 - f * 124;
    set(fill, {d:`M120,${Math.max(53, y)} L320,${Math.max(53, y)} L320,177 Q320,190 304,190 L136,190 Q120,190 120,177 Z`, opacity:.55});
    const tC = r < .6 ? 78 : r > 1.3 ? 70 + Math.min(30, (r - 1.3) * 40) : 55;
    rd('b', bd(`${cur.name} · D ${cur.D} · B ${cur.B}`)); rd('G', bd(n(G, 1) + ' g')); rd('now', bd(n(gr, 1) + ' g'));
    nm.textContent = cur.name;
    if (!chk){ th.textContent = '–'; set(th, {fill:'var(--muted)'}); return; }
    th.textContent = Math.round(tC) + '°C'; set(th, {fill:tC > 65 ? 'var(--bad)' : 'var(--good)'});
    if (r >= .75 && r <= 1.3) game.win(cur.ok);
    else game.miss(r < .75 ? T('قليل: الرولمان ناشف وبيزيّق وسخن.', 'Too little: the bearing runs dry, noisy and hot.') : T('كتير: الشحم بيتخض ويسخّن الرولمان، وممكن يطرد السيل.', 'Too much: the grease churns, heats the bearing and can push out the seal.'));
  }
  function setup(r){ cur = r; S.set(0); upd(false); }
  const game = rounds(g, [
    {name:'6310', D:110, B:27, goal:T('رولمان <bdi dir="ltr">6310</bdi>: القطر الخارجي <bdi dir="ltr">D = 110</bdi> والعرض <bdi dir="ltr">B = 27 mm</bdi>.', 'Bearing 6310: outside diameter D = 110, width B = 27 mm.'), ok:T('<bdi dir="ltr">0.005 × 110 × 27 ≈ 15 g</bdi> = <bdi dir="ltr">10</bdi> ضربات.', '0.005 × 110 × 27 ≈ 15 g = 10 strokes.')},
    {name:'6205', D:52, B:15, goal:T('رولمان صغير <bdi dir="ltr">6205</bdi>: <bdi dir="ltr">D = 52</bdi> و<bdi dir="ltr">B = 15</bdi>.', 'A small 6205: D = 52 and B = 15.'), ok:T('حوالي <bdi dir="ltr">4 g</bdi> بس، يعني <bdi dir="ltr">3</bdi> ضربات. الصغير بيتملي بسرعة!', 'Only about 4 g, so 3 strokes. Small bearings fill fast!')},
    {name:'22220', D:180, B:46, goal:T('رولمان كبير <bdi dir="ltr">22220</bdi>: <bdi dir="ltr">D = 180</bdi> و<bdi dir="ltr">B = 46</bdi>.', 'A big 22220: D = 180 and B = 46.'), ok:T('حوالي <bdi dir="ltr">41 g</bdi> = <bdi dir="ltr">28</bdi> ضربة. احسب دايمًا، ما تعدّش على الإحساس.', 'About 41 g = 28 strokes. Always calculate, never guess.')}
  ], L, setup);
};

/* ============ 7 · micrometer: read the sleeve (0.5 mm) + thimble (0.01 mm) ============
   close-up view: the sleeve's datum line runs left to right; the thimble edge sits at x = EDGE.
   rounds: {k:'read', v, o:[...], a} → pick the reading · {k:'set', want} → turn the thimble to the reading */
MF.micro = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('الميكرومتر من قريب', 'The micrometer, close up'), '0 0 440 230');
  host.classList.add('mf-micro');
  const s = g.svg, EDGE = 300, MM = 40, Y = 112, DIV = 9; // 1 mm = 40 px on the sleeve, 1 thimble division = 9 px
  el(s, 'rect', {x:0, y:0, width:440, height:230, fill:'var(--panel)'});
  el(s, 'rect', {x:0, y:Y - 34, width:EDGE, height:68, fill:'#c4cacf'});                     // sleeve
  const sl = el(s, 'g', {});
  el(s, 'line', {x1:0, y1:Y, x2:EDGE + 6, y2:Y, stroke:'#1d2228', 'stroke-width':1.6});        // datum line
  const th = el(s, 'g', {});
  const thBody = el(s, 'rect', {x:EDGE, y:14, width:120, height:202, rx:10, fill:'#a9b0b5', stroke:'#5c636a', 'stroke-width':2});
  s.appendChild(th);
  const thl = el(s, 'g', {}); // thimble lines
  el(s, 'path', {d:`M${EDGE - 2},${Y} l-10,-6 v12 Z`, fill:'#d2552d'});
  const lab1 = el(s, 'text', {x:150, y:20, 'text-anchor':'middle', 'font-size':12, fill:'var(--muted)'}); lab1.textContent = T('الجلبة (التدريج الطولي)', 'Sleeve (linear scale)');
  const lab2 = el(s, 'text', {x:360, y:228, 'text-anchor':'middle', 'font-size':12, fill:'var(--muted)'}); lab2.textContent = T('الطنبورة (التدريج الدائري)', 'Thimble (circular scale)');
  const rd = readouts(g, [['m', T('الجلبة', 'Sleeve')], ['t', T('الطنبورة', 'Thimble')], ['r', T('القراية', 'Reading')]]);
  const box = document.createElement('div'); box.className = 'mf-opts'; g.ctl.appendChild(box);
  const cf = document.createElement('button'); cf.type = 'button'; cf.className = 'btn pri'; cf.textContent = T('تأكيد', 'Confirm'); g.ctl.appendChild(cf);
  const S1 = slider(g, {label:T('لفّات كاملة (كل لفّة = ⁦0.5 mm⁩)', 'Full turns (each = 0.5 mm)'), min:0, max:49, step:1, value:10}, () => { draw(val()); check(); });
  const S2 = slider(g, {label:T('شَرط الطنبورة (كل شَرطة = ⁦0.01 mm⁩)', 'Thimble divisions (each = 0.01 mm)'), min:0, max:49, step:1, value:0}, () => { draw(val()); check(); });
  const val = () => S1.get() * 0.5 + S2.get() * 0.01;
  let cur = null, sel = null, tmr = 0;
  const f2 = v => (Math.round(v * 100) / 100).toFixed(2);
  function draw(v){
    sl.innerHTML = ''; thl.innerHTML = '';
    for (let h = 0; h <= 50; h++){ // half-millimetres
      const x = EDGE - (v - h / 2) * MM; if (x > EDGE + 0.5 || x < -4) continue;
      const whole = h % 2 === 0;
      el(sl, 'line', {x1:x, y1:Y, x2:x, y2:whole ? Y - 18 : Y + 14, stroke:'#1d2228', 'stroke-width':whole ? 1.8 : 1.4});
      if (whole && (h / 2) % 5 === 0){ const t = el(sl, 'text', {x, y:Y - 24, 'text-anchor':'middle', 'font-size':14, 'font-weight':700, fill:'#1d2228', 'font-family':'mono'}); t.textContent = h / 2; }
    }
    const d = (v * 100) % 50; // division on the datum line
    for (let j = Math.floor(d) - 12; j <= Math.ceil(d) + 12; j++){
      const y = Y + (d - j) * DIV; if (y < 18 || y > 212) continue;
      const k = ((j % 50) + 50) % 50, five = k % 5 === 0;
      el(thl, 'line', {x1:EDGE, y1:y, x2:EDGE + (five ? 26 : 16), y2:y, stroke:'#1d2228', 'stroke-width':five ? 1.8 : 1.2});
      if (five){ const t = el(thl, 'text', {x:EDGE + 46, y:y + 5, 'text-anchor':'middle', 'font-size':13, 'font-weight':700, fill:'#1d2228', 'font-family':'mono'}); t.textContent = k; }
    }
    const mm = Math.floor(v * 2 + 1e-9) / 2;
    if (cur && cur.k === 'set'){ rd('m', bd(f2(mm) + ' mm')); rd('t', bd(f2(v - mm) + ' mm')); rd('r', bd(f2(v) + ' mm')); }
    else { rd('m', '?'); rd('t', '?'); rd('r', '?'); }
  }
  function check(){
    if (!cur || cur.k !== 'set' || game.won) return;
    clearTimeout(tmr); tmr = setTimeout(() => { const v = val(); if (Math.abs(v - cur.want) < 0.005) game.win(cur.ok); else game.miss(T(`لسه: <bdi dir="ltr">${f2(v)} mm</bdi>`, `Not yet: ${f2(v)} mm`)); }, 700);
  }
  function setup(r){
    cur = r; sel = null;
    const read = r.k === 'read';
    S1.el.hidden = read; S2.el.hidden = read; box.hidden = !read; cf.hidden = !read; cf.disabled = true;
    if (read){ draw(r.v); box.innerHTML = IL.shuffle(r.o.map((_, i) => i)).map(i => `<button type="button" class="btn qz-o" data-i="${i}">${bd(r.o[i])}</button>`).join(''); }
    else { S1.set(10); S2.set(0); draw(val()); }
  }
  box.addEventListener('click', e => { const b = e.target.closest('.qz-o'); if (!b || game.won || b.disabled) return; sel = +b.dataset.i; box.querySelectorAll('.qz-o').forEach(x => x.classList.toggle('sel', x === b)); cf.disabled = false; });
  cf.addEventListener('click', () => {
    if (sel == null || game.won) return;
    const b = box.querySelector(`.qz-o[data-i="${sel}"]`);
    if (sel === cur.a){ b.classList.remove('sel'); b.classList.add('ok'); box.querySelectorAll('.qz-o').forEach(x => { x.disabled = true; }); cf.hidden = true; rd('r', bd(f2(cur.v) + ' mm')); game.win(cur.ok); return; }
    b.classList.remove('sel'); b.classList.add('no'); b.disabled = true; sel = null; cf.disabled = true;
    game.miss(cur.why);
  });
  const game = rounds(g, opt.rounds || [], L, setup);
};

})();
