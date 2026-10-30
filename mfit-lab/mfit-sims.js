/* كورس ميكانيكا المكن العملية: the workshop games. Each one is a small game in rounds on a real machine drawing;
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

})();
