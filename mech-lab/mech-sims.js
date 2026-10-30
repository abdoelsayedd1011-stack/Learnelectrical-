/* كورس أساسيات الميكانيكا: the lesson playgrounds. Each one is a small game in rounds: the learner moves sliders,
   watches the physics happen, and the lesson's «sim» task is marked when the last round is won.
   Needs mech.js (IL) loaded first. Every drawing is an SVG in a fixed viewBox, always left-to-right. */
(function(){
'use strict';
const MS = window.MS = {};
const T = IL.T, EN = IL.EN, esc = IL.esc, fmt = IL.fmt, clamp = IL.clamp;
const G = 9.8;
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
MS._ = {frame, slider, button, readouts, rounds, el, set, arrowPath, run, n, bd, G};

/* ============ 1 · vectors: add two forces ============ */
MS.vectors = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('ملعب المتجهات: اجمع قوتين', 'Vector playground: add two forces'), '0 0 420 270');
  const S = 13, ox = 120, oy = 190; // 13 px per newton
  const s = g.svg;
  el(s, 'rect', {x:0, y:0, width:420, height:270, fill:'var(--panel)'});
  for (let x = 16; x < 420; x += 26) el(s, 'line', {x1:x, y1:0, x2:x, y2:270, stroke:'var(--line)', 'stroke-width':.6});
  for (let y = 8; y < 270; y += 26) el(s, 'line', {x1:0, y1:y, x2:420, y2:y, stroke:'var(--line)', 'stroke-width':.6});
  const para1 = el(s, 'line', {stroke:'var(--muted)', 'stroke-dasharray':'4 4', 'stroke-width':1.5});
  const para2 = el(s, 'line', {stroke:'var(--muted)', 'stroke-dasharray':'4 4', 'stroke-width':1.5});
  const arc = el(s, 'path', {fill:'none', stroke:'var(--muted)', 'stroke-width':1.5});
  const aT = el(s, 'text', {'font-size':13, fill:'var(--muted)', 'font-family':'var(--font-mono)'});
  const a1 = el(s, 'path', {stroke:'#d2552d', fill:'#d2552d', 'stroke-width':5, 'stroke-linejoin':'round'});
  const a2 = el(s, 'path', {stroke:'#2f8f4e', fill:'#2f8f4e', 'stroke-width':5, 'stroke-linejoin':'round'});
  const aR = el(s, 'path', {stroke:'var(--accent)', fill:'var(--accent)', 'stroke-width':6, 'stroke-linejoin':'round'});
  const t1 = el(s, 'text', {'font-size':15, 'font-weight':700, fill:'#d2552d'}); t1.textContent = 'F1';
  const t2 = el(s, 'text', {'font-size':15, 'font-weight':700, fill:'#2f8f4e'}); t2.textContent = 'F2';
  const tR = el(s, 'text', {'font-size':15, 'font-weight':700, fill:'var(--accent)'}); tR.textContent = 'R';
  el(s, 'circle', {cx:ox, cy:oy, r:9, fill:'var(--sym)'});
  const rd = readouts(g, [['f1', 'F1'], ['f2', 'F2'], ['r', T('المحصّلة R', 'Resultant R')]]);
  const f1 = slider(g, {label:'F1', min:1, max:12, step:1, value:6, unit:'N'}, upd);
  const f2 = slider(g, {label:'F2', min:1, max:12, step:1, value:8, unit:'N'}, upd);
  const an = slider(g, {label:T('الزاوية بين القوتين', 'Angle between the forces'), min:0, max:180, step:5, value:30, unit:'°'}, upd);
  let R = null, cur = null, tmr = 0;
  function draw(){
    const F1 = f1.get(), F2 = f2.get(), th = an.get() * Math.PI / 180;
    const x1 = ox + F1 * S, y1 = oy;
    const x2 = ox + F2 * S * Math.cos(th), y2 = oy - F2 * S * Math.sin(th);
    const rx = F1 + F2 * Math.cos(th), ry = F2 * Math.sin(th), Rm = Math.hypot(rx, ry);
    const xr = ox + rx * S, yr = oy - ry * S;
    set(a1, {d:arrowPath(ox, oy, x1, y1, 14)}); set(a2, {d:arrowPath(ox, oy, x2, y2, 14)}); set(aR, {d:arrowPath(ox, oy, xr, yr, 16)});
    set(para1, {x1, y1, x2:xr, y2:yr}); set(para2, {x1:x2, y1:y2, x2:xr, y2:yr});
    set(t1, {x:x1 + 6, y:y1 + 20}); set(t2, {x:x2 + (Math.cos(th) < 0 ? -26 : 6), y:y2 - 6}); set(tR, {x:xr + 8, y:yr - 6, opacity:Rm < .3 ? 0 : 1});
    const r = 30, ex = ox + r * Math.cos(th), ey = oy - r * Math.sin(th);
    set(arc, {d:`M${ox + r},${oy}A${r},${r} 0 0 0 ${ex},${ey}`});
    set(aT, {x:ox + 36, y:oy - 8}); aT.textContent = an.get() + '°';
    rd('f1', bd(F1 + ' N')); rd('f2', bd(F2 + ' N')); rd('r', bd(n(Rm, 1) + ' N'));
    return Rm;
  }
  function upd(v, end){ R = draw(); clearTimeout(tmr); tmr = setTimeout(check, end ? 0 : 500); }
  function check(){
    if (!cur) return;
    if (Math.abs(R - cur.want) <= (cur.tol || 0.25)) game.win(cur.ok);
    else game.miss(T(`المحصّلة دلوقتي ${bd(n(R, 1) + ' N')}. ` , `The resultant is ${bd(n(R, 1) + ' N')} now. `) + cur.hint);
  }
  const game = rounds(g, opt.rounds || [
    {goal:T(`${bd('F1 = 6 N')} و ${bd('F2 = 8 N')}. غيّر الزاوية لحد ما المحصّلة تبقى ${bd('10 N')}.`, `F1 = 6 N and F2 = 8 N. Turn the angle until the resultant is 10 N.`),
      F1:6, F2:8, a:0, lock:[1, 1, 0], want:10, hint:T('قرّب الزاوية من القايمة.', 'Try nearer to a right angle.'), ok:T(`بالظبط! على زاوية 90° المحصّلة = ${bd('√(6² + 8²) = 10 N')}`, 'Exactly! At 90° the resultant = √(6² + 8²) = 10.')},
    {goal:T(`قوتين ${bd('5 N')} و ${bd('5 N')}. خلّي المحصّلة صفر (الحاجة متتحركش).`, `Two forces of ${bd('5 N')}. Make the resultant zero (nothing moves).`),
      F1:5, F2:5, a:30, lock:[1, 1, 0], want:0, tol:.05, hint:T('خلّيهم يشدّوا عكس بعض.', 'Make them pull against each other.'), ok:T('صح! قوتين متساويتين ومتعاكستين = اتزان، زي شد الحبل والفريقين قد بعض.', 'Right! Equal and opposite forces = balance, like an even tug-of-war.')},
    {goal:T(`${bd('F1 = 4 N')}. اختار F2 والزاوية عشان تطلّع محصّلة ${bd('12 N')}.`, `F1 = 4 N. Choose F2 and the angle to get a 12 N resultant.`),
      F1:4, F2:3, a:90, lock:[1, 0, 0], want:12, hint:T('أكبر محصّلة لما القوتين يبقوا في نفس الاتجاه.', 'The biggest resultant is when both point the same way.'), ok:T('برافو! لما القوتين في نفس الاتجاه بيتجمعوا جمع عادي.', 'Well done! Forces in the same direction simply add up.')}
  ], L, r => { cur = r; f1.set(r.F1); f2.set(r.F2); an.set(r.a); f1.lock(r.lock[0]); f2.lock(r.lock[1]); an.lock(r.lock[2]); R = draw(); });
  R = draw();
};

/* shared drawings */
const CAR = (c) => `<rect x="-64" y="-24" width="64" height="20" rx="6" fill="${c}"/><path d="M-52 -24L-44 -38H-20L-12 -24Z" fill="${c}"/><path d="M-46 -26L-41 -35H-33V-26ZM-30 -26V-35H-22L-17 -26Z" fill="#cfe8ff"/><circle cx="-50" cy="-4" r="7" fill="#22272b"/><circle cx="-14" cy="-4" r="7" fill="#22272b"/><circle cx="-50" cy="-4" r="2.5" fill="#aab"/><circle cx="-14" cy="-4" r="2.5" fill="#aab"/><rect x="-3" y="-21" width="4" height="5" rx="1" fill="#ffe680"/>`;
const CRATE = (w, c, t) => `<rect x="${-w / 2}" y="${-w}" width="${w}" height="${w}" rx="3" fill="${c || '#c98a45'}" stroke="#8a5a26" stroke-width="2"/><path d="M${-w / 2 + 4} ${-w + 4}L${w / 2 - 4} -4M${w / 2 - 4} ${-w + 4}L${-w / 2 + 4} -4" stroke="#8a5a26" stroke-width="2"/>${t ? `<text x="0" y="${-w / 2 + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" stroke="#6b4318" stroke-width="3" paint-order="stroke">${t}</text>` : ''}`;
const ARW = (c) => ({stroke:c, fill:c, 'stroke-width':4, 'stroke-linejoin':'round'});

/* ============ 2 · braking: stop the car on the line ============ */
MS.brake = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('فرمل العربية', 'Brake the car'), '0 0 600 190');
  const s = g.svg, X0 = 70, X1 = 580;
  el(s, 'rect', {x:0, y:0, width:600, height:190, fill:'var(--panel)'});
  el(s, 'rect', {x:0, y:112, width:600, height:52, fill:'#596068'});
  el(s, 'line', {x1:0, y1:138, x2:600, y2:138, stroke:'#fff', 'stroke-width':2, 'stroke-dasharray':'14 12', opacity:.7});
  const marks = el(s, 'g', {});
  const goal = el(s, 'g', {});
  const car = el(s, 'g', {}); car.innerHTML = CAR('#d2552d');
  const sp = el(s, 'text', {'font-size':13, 'font-weight':700, fill:'var(--ink)', 'text-anchor':'middle'});
  const rd = readouts(g, [['v', T('السرعة', 'Speed')], ['d', T('المسافة', 'Distance')], ['t', T('الزمن', 'Time')]]);
  const A = slider(g, {label:T('قوة الفرملة (العجلة السالبة)', 'Braking deceleration'), min:1, max:10, step:.5, value:3, unit:'m/s²', dec:1});
  const go = button(g, T('فرمل 🛑', 'Brake 🛑'), start, true);
  let cur, k = 1, stop = null;
  const px = d => X0 + d * k;
  function place(d, v){
    set(car, {transform:`translate(${px(d)},146)`});
    set(sp, {x:px(d) - 32, y:96}); sp.textContent = n(v * 3.6, 0) + ' km/h';
    rd('v', bd(n(v, 1) + ' m/s = ' + n(v * 3.6, 0) + ' km/h')); rd('d', bd(n(d, 1) + ' m'));
  }
  function setup(r){
    cur = r; if (stop) stop(); go.disabled = false;
    const max = Math.ceil(r.d * 1.35 / 10) * 10; k = (X1 - X0) / max;
    let h = '';
    for (let d = 0; d <= max; d += 5) h += `<line x1="${px(d)}" y1="164" x2="${px(d)}" y2="${d % 10 ? 170 : 174}" stroke="var(--muted)"/>` + (d % 10 ? '' : `<text x="${px(d)}" y="186" font-size="11" text-anchor="middle" fill="var(--muted)">${d}</text>`);
    marks.innerHTML = h;
    goal.innerHTML = `<line x1="${px(r.d)}" y1="108" x2="${px(r.d)}" y2="166" stroke="#e8b400" stroke-width="5"/><text x="${px(r.d)}" y="100" font-size="20" text-anchor="middle">🚧</text><text x="${px(r.d)}" y="70" font-size="12" font-weight="700" text-anchor="middle" fill="var(--ink)">${r.d} m</text>`;
    place(0, r.v); rd('t', bd('0 s'));
  }
  function start(){
    if (!cur) return; go.disabled = true;
    const a = A.get(), v0 = cur.v, ts = v0 / a, dStop = v0 * v0 / (2 * a); let t = 0;
    stop = run(dt => {
      t = Math.min(ts, t + dt);
      const v = v0 - a * t, d = v0 * t - a * t * t / 2;
      place(Math.min(d, cur.d * 1.35), v); rd('t', bd(n(t, 1) + ' s'));
      if (t >= ts){ go.disabled = false; judge(dStop); return false; }
    });
  }
  function judge(d){
    const e = d - cur.d;
    if (Math.abs(e) <= 1) game.win(T(`وقفت بعد ${bd(n(d, 1) + ' m')}. مسافة الفرامل = ${bd('v² ÷ 2a')}`, `Stopped after ${n(d, 1)} m. Braking distance = v² ÷ 2a`));
    else game.miss(e > 0 ? T(`خبطت! وقفت بعد ${bd(n(d, 1) + ' m')}. فرمل أجمد.`, `Crash! You stopped after ${n(d, 1)} m. Brake harder.`) : T(`وقفت بدري عند ${bd(n(d, 1) + ' m')}. خفّف الفرملة شوية.`, `Too early at ${n(d, 1)} m. Brake a little softer.`));
  }
  const game = rounds(g, [
    {goal:T(`العربية ماشية ${bd('72 km/h = 20 m/s')}. خليها تقف عند الحاجز على ${bd('40 m')}.`, 'The car is at 72 km/h = 20 m/s. Stop it at the barrier, 40 m away.'), v:20, d:40},
    {goal:T(`${bd('54 km/h = 15 m/s')}. الحاجز على ${bd('45 m')}.`, '54 km/h = 15 m/s. The barrier is 45 m away.'), v:15, d:45},
    {goal:T(`${bd('43 km/h = 12 m/s')} والحاجز قريب: ${bd('8 m')} بس!`, '43 km/h = 12 m/s and the barrier is close: only 8 m!'), v:12, d:8}
  ], L, setup);
};

/* ============ 3 · projectile: hit the target ============ */
MS.launch = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('ارمي الكورة', 'Launch the ball'), '0 0 600 300');
  const s = g.svg, GY = 270, X0 = 40, K = 5; // 5 px per metre
  el(s, 'rect', {x:0, y:0, width:600, height:300, fill:'var(--panel)'});
  el(s, 'rect', {x:0, y:GY, width:600, height:30, fill:'#7aa95c'});
  let h = ''; for (let d = 0; d <= 110; d += 10) h += `<line x1="${X0 + d * K}" y1="${GY}" x2="${X0 + d * K}" y2="${GY + 6}" stroke="#2c4a1c"/>` + (d % 20 ? '' : `<text x="${X0 + d * K}" y="${GY + 22}" font-size="11" text-anchor="middle" fill="#1d3311">${d}</text>`);
  el(s, 'g', {}).innerHTML = h;
  const tgt = el(s, 'g', {});
  const trail = el(s, 'polyline', {fill:'none', stroke:'var(--accent)', 'stroke-width':2, 'stroke-dasharray':'3 5'});
  const barrel = el(s, 'rect', {x:0, y:-6, width:38, height:12, rx:3, fill:'#3a4045'});
  el(s, 'circle', {cx:X0, cy:GY - 4, r:14, fill:'#5c636a'});
  const ball = el(s, 'circle', {r:7, fill:'#d2552d', stroke:'#fff', 'stroke-width':1.5});
  const rd = readouts(g, [['r', T('المدى', 'Range')], ['h', T('أقصى ارتفاع', 'Max height')], ['t', T('زمن الطيران', 'Flight time')]]);
  const AN = slider(g, {label:T('الزاوية', 'Angle'), min:10, max:80, step:1, value:30, unit:'°'}, aim);
  const V = slider(g, {label:T('السرعة', 'Speed'), min:10, max:35, step:.5, value:15, unit:'m/s', dec:1}, aim);
  const go = button(g, T('ارمي 🚀', 'Launch 🚀'), fire, true);
  let cur, stop = null;
  function aim(){ const a = AN.get(); set(barrel, {transform:`translate(${X0},${GY - 4}) rotate(${-a})`}); if (!stop) set(ball, {cx:X0, cy:GY - 4}); }
  function setup(r){
    cur = r; if (stop){ stop(); stop = null; } go.disabled = false;
    AN.set(r.a); V.set(r.v); AN.lock(r.lockA); V.lock(r.lockV);
    const x = X0 + r.D * K, w = r.tol * K;
    tgt.innerHTML = `<rect x="${x - w}" y="${GY - 6}" width="${2 * w}" height="8" fill="#e8b400"/><line x1="${x}" y1="${GY - 6}" x2="${x}" y2="${GY - 46}" stroke="#3a4045" stroke-width="2"/><path d="M${x} ${GY - 46}l22 7l-22 7z" fill="#d2552d"/><text x="${x}" y="${GY - 52}" font-size="12" font-weight="700" text-anchor="middle" fill="var(--ink)">${r.D} m</text>`;
    set(trail, {points:''}); aim(); ['r', 'h', 't'].forEach(k => rd(k, '–'));
  }
  function fire(){
    if (!cur) return; go.disabled = true; AN.lock(true); V.lock(true);
    const a = AN.get() * Math.PI / 180, v = V.get(), vx = v * Math.cos(a), vy = v * Math.sin(a);
    const tf = 2 * vy / G, R = vx * tf, H = vy * vy / (2 * G);
    let t = 0, pts = [];
    stop = run(dt => {
      t = Math.min(tf, t + dt * 1.6);
      const x = X0 + vx * t * K, y = GY - 4 - (vy * t - G * t * t / 2) * K;
      set(ball, {cx:x, cy:y}); pts.push(x.toFixed(1) + ',' + y.toFixed(1)); set(trail, {points:pts.join(' ')});
      if (t >= tf){
        stop = null; go.disabled = false; AN.lock(cur.lockA); V.lock(cur.lockV);
        rd('r', bd(n(R, 1) + ' m')); rd('h', bd(n(H, 1) + ' m')); rd('t', bd(n(tf, 1) + ' s'));
        if (Math.abs(R - cur.D) <= cur.tol) game.win(cur.ok);
        else game.miss(T(`وقعت على ${bd(n(R, 1) + ' m')}. ${R < cur.D ? 'محتاجة تروح أبعد.' : 'راحت أبعد من الهدف.'}`, `It landed at ${n(R, 1)} m. ${R < cur.D ? 'It needs to go further.' : 'It went past the target.'}`));
        return false;
      }
    });
  }
  const game = rounds(g, [
    {goal:T(`السرعة ثابتة ${bd('20 m/s')}. اختار الزاوية اللي توصّل الكورة للهدف على ${bd('40 m')}.`, 'Speed is fixed at 20 m/s. Pick the angle that lands the ball on the target 40 m away.'), D:40, tol:1.5, a:20, v:20, lockA:false, lockV:true,
      ok:T('صابت! أبعد مدى بيكون عند زاوية 45°.', 'Hit! The longest range is at 45°.')},
    {goal:T(`الزاوية ثابتة 45°. اختار السرعة اللي توصّلها ${bd('60 m')}.`, 'The angle is fixed at 45°. Pick the speed that reaches 60 m.'), D:60, tol:2, a:45, v:15, lockA:true, lockV:false,
      ok:T(`صابت! على 45°: المدى = ${bd('v² ÷ g')}`, 'Hit! At 45°: range = v² ÷ g')},
    {goal:T(`الهدف بعيد: ${bd('90 m')}. إنت حر في الزاوية والسرعة.`, 'A far target: 90 m. Angle and speed are up to you.'), D:90, tol:2, a:30, v:20, lockA:false, lockV:false,
      ok:T('برافو يا قنّاص! 🎯', 'Sharpshooter! 🎯')}
  ], L, setup);
};

/* ============ 4 · Newton: push the crate to the line in 4 s ============ */
MS.push = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('ازق الصندوق', 'Push the crate'), '0 0 600 190');
  const s = g.svg, X0 = 130, K = 24, D = 16, GY = 140;
  el(s, 'rect', {x:0, y:0, width:600, height:190, fill:'var(--panel)'});
  const floor = el(s, 'rect', {x:0, y:GY, width:600, height:50, fill:'#cfe7f5'});
  let h = ''; for (let d = 0; d <= 18; d += 2) h += `<line x1="${X0 + d * K}" y1="${GY}" x2="${X0 + d * K}" y2="${GY + 6}" stroke="var(--muted)"/><text x="${X0 + d * K}" y="${GY + 20}" font-size="11" text-anchor="middle" fill="#3a4a55">${d}</text>`;
  el(s, 'g', {}).innerHTML = h;
  el(s, 'line', {x1:X0 + D * K, y1:GY - 70, x2:X0 + D * K, y2:GY, stroke:'#e8b400', 'stroke-width':4, 'stroke-dasharray':'8 5'});
  el(s, 'text', {x:X0 + D * K, y:GY - 76, 'font-size':16, 'text-anchor':'middle'}).textContent = '🏁';
  const crate = el(s, 'g', {});
  const fA = el(s, 'path', ARW('#2f8f4e')), frA = el(s, 'path', ARW('#d2552d'));
  const fT = el(s, 'text', {'font-size':12, 'font-weight':700, fill:'#2f8f4e', 'text-anchor':'middle'});
  const frT = el(s, 'text', {'font-size':12, 'font-weight':700, fill:'#d2552d', 'text-anchor':'middle'});
  const rd = readouts(g, [['a', T('العجلة', 'Acceleration')], ['v', T('السرعة', 'Speed')], ['t', T('الزمن', 'Time')]]);
  const F = slider(g, {label:T('قوة الزق', 'Push force'), min:0, max:400, step:10, value:50, unit:'N'}, () => draw(0));
  const go = button(g, T('ازق 💪', 'Push 💪'), start, true);
  let cur, stop = null;
  function draw(x){
    const W = 46, cx = X0 + x * K;
    crate.innerHTML = CRATE(W, '', cur ? cur.m + ' kg' : ''); set(crate, {transform:`translate(${cx - W / 2},${GY})`});
    const f = F.get(), len = 12 + f / 6;
    set(fA, {d:arrowPath(cx - W - len - 4, GY - 23, cx - W - 4, GY - 23, 10)}); set(fT, {x:cx - W - len / 2 - 4, y:GY - 32}); fT.textContent = 'F ' + f + ' N';
    const fr = cur ? cur.fr : 0;
    set(frA, {d:fr ? arrowPath(cx + 4, GY - 6, cx + 4 + 12 + fr / 6, GY - 6, 8) : ''}); set(frT, {x:cx + 20 + fr / 12, y:GY - 14}); frT.textContent = fr ? T('احتكاك ', 'friction ') + fr + ' N' : '';
    if (cur && !stop) rd('a', bd(n(Math.max(0, f - fr) / cur.m, 2) + ' m/s²'));
  }
  function setup(r){ cur = r; if (stop){ stop(); stop = null; } go.disabled = false; set(floor, {fill:r.fr ? '#d9c6a5' : '#cfe7f5'}); draw(0); rd('v', bd('0 m/s')); rd('t', bd('0 s')); }
  function start(){
    const a = (F.get() - cur.fr) / cur.m;
    if (a <= 0){ game.miss(T('الصندوق مش راضي يتحرك: قوتك مش أكبر من الاحتكاك.', 'The crate will not move: your push is not bigger than friction.')); return; }
    go.disabled = true; F.lock(true); let t = 0, done = false;
    rd('a', bd(n(a, 2) + ' m/s²'));
    stop = run(dt => {
      t += dt; const x = a * t * t / 2;
      draw(Math.min(x, 18.5)); rd('v', bd(n(a * t, 1) + ' m/s')); rd('t', bd(n(t, 2) + ' s'));
      if (x >= D || t > 8){
        const tc = Math.sqrt(2 * D / a); rd('t', bd(n(tc, 2) + ' s'));
        stop = null; go.disabled = false; F.lock(false); done = true;
        if (Math.abs(tc - 4) <= 0.15) game.win(cur.ok);
        else game.miss(tc < 4 ? T(`وصل في ${bd(n(tc, 2) + ' s')}، أسرع من اللازم. زق أخف.`, `It arrived in ${n(tc, 2)} s, too fast. Push softer.`) : T(`وصل في ${bd(n(tc, 2) + ' s')}، أبطأ من اللازم. زق أجمد.`, `It arrived in ${n(tc, 2)} s, too slow. Push harder.`));
        return false;
      }
    });
  }
  const game = rounds(g, [
    {goal:T(`صندوق ${bd('50 kg')} على تلج (مفيش احتكاك). خليه يوصل الخط اللي على ${bd('16 m')} في ${bd('4 s')} بالظبط.`, 'A 50 kg crate on ice (no friction). Get it to the line 16 m away in exactly 4 s.'), m:50, fr:0, ok:T(`محتاج عجلة ${bd('2 m/s²')}، يعني ${bd('F = m·a = 50 × 2 = 100 N')}`, 'You need 2 m/s², so F = m·a = 50 × 2 = 100 N')},
    {goal:T(`نفس المهمة بس الصندوق ${bd('120 kg')}.`, 'Same job, but the crate is 120 kg.'), m:120, fr:0, ok:T(`كتلة أكبر = قوة أكبر لنفس العجلة: ${bd('120 × 2 = 240 N')}`, 'More mass needs more force for the same acceleration: 120 × 2 = 240 N')},
    {goal:T(`صندوق ${bd('75 kg')} على أرض فيها احتكاك ${bd('50 N')}. نفس الخط ونفس الـ 4 ثواني.`, 'A 75 kg crate on a floor with 50 N of friction. Same line, same 4 seconds.'), m:75, fr:50, ok:T(`القوة المحصّلة هي اللي بتعمل العجلة: ${bd('F − 50 = 75 × 2 → F = 200 N')}`, 'Net force makes the acceleration: F − 50 = 75 × 2 → F = 200 N')}
  ], L, setup);
};

/* ============ 5 · ramp: find the angle where it slides ============ */
MS.ramp = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('المنحدر', 'The ramp'), '0 0 600 320');
  const s = g.svg, PX = 70, PY = 296, LEN = 470, KM = LEN / 4; // ramp = 4 m
  el(s, 'rect', {x:0, y:0, width:600, height:320, fill:'var(--panel)'});
  el(s, 'rect', {x:0, y:PY, width:600, height:24, fill:'#b9c2c8'});
  const tri = el(s, 'polygon', {fill:'color-mix(in srgb, var(--accent) 18%, var(--panel))', stroke:'var(--accent)', 'stroke-width':2});
  const board = el(s, 'line', {x1:PX, y1:PY, 'stroke-width':10, 'stroke-linecap':'round'});
  const arc = el(s, 'path', {fill:'none', stroke:'var(--muted)', 'stroke-width':1.5});
  const aT = el(s, 'text', {'font-size':13, fill:'var(--ink)', 'font-weight':700});
  const crate = el(s, 'g', {});
  const rd = readouts(g, [['th', T('الزاوية', 'Angle')], ['tan', 'tan θ'], ['mu', T('معامل الاحتكاك μs', 'Friction coefficient μs')]]);
  const AN = slider(g, {label:T('ارفع المنحدر', 'Raise the ramp'), min:0, max:60, step:1, value:0, unit:'°'}, upd);
  button(g, T('رجّع الصندوق ↺', 'Reset the crate ↺'), () => setup(cur));
  let cur, pos = 3.4, sliding = false, startA = 0, stop = null;
  function draw(){
    const a = AN.get() * Math.PI / 180, ex = PX + LEN * Math.cos(a), ey = PY - LEN * Math.sin(a);
    set(tri, {points:`${PX},${PY} ${ex},${ey} ${ex},${PY}`}); set(board, {x2:ex, y2:ey, stroke:cur ? cur.c : '#8a5a26'});
    set(arc, {d:`M${PX + 60},${PY}A60,60 0 0 0 ${PX + 60 * Math.cos(a)},${PY - 60 * Math.sin(a)}`}); set(aT, {x:PX + 66, y:PY - 8}); aT.textContent = AN.get() + '°';
    const cx = PX + pos * KM * Math.cos(a), cy = PY - pos * KM * Math.sin(a) - 5;
    set(crate, {transform:`translate(${cx},${cy}) rotate(${-AN.get()})`});
    rd('th', bd(AN.get() + '°')); rd('tan', bd(n(Math.tan(a), 2))); rd('mu', bd(cur ? n(cur.mu, 2) : '–'));
  }
  function upd(){
    draw();
    if (!cur || sliding) return;
    const a = AN.get() * Math.PI / 180;
    if (Math.tan(a) > cur.mu){
      sliding = true; startA = AN.get(); AN.lock(true); let v = 0;
      stop = run(dt => {
        const acc = G * (Math.sin(a) - cur.mk * Math.cos(a)); v += acc * dt; pos = Math.max(0.25, pos - v * dt); draw();
        if (pos <= 0.25){ stop = null; return false; }
      });
      const crit = Math.atan(cur.mu) * 180 / Math.PI;
      if (startA <= Math.ceil(crit) + 1) game.win(T(`اتزحلق عند ${bd(startA + '°')}. الزاوية الحرجة: ${bd('tan θ = μs → θ = ' + n(crit, 1) + '°')}`, `It slid at ${startA}°. Critical angle: tan θ = μs → θ = ${n(crit, 1)}°`));
      else game.miss(T(`اتزحلق، بس على ${bd(startA + '°')} زوّدت أوي. رجّع الصندوق وارفع درجة درجة.`, `It slid, but ${startA}° is too far. Reset and raise one degree at a time.`));
    }
  }
  function setup(r){
    cur = r; if (stop){ stop(); stop = null; } sliding = false; pos = 3.4; AN.lock(false); AN.set(0);
    crate.innerHTML = CRATE(44, r.cc, ''); draw();
  }
  const game = rounds(g, [
    {goal:T('صندوق خشب على لوح خشب. ارفع المنحدر بالراحة ولاقي أول زاوية يبدأ يتزحلق عندها.', 'A wooden crate on a wooden board. Raise the ramp slowly and find the first angle where it slides.'), mu:.5, mk:.3, c:'#a0672e', cc:'#c98a45'},
    {goal:T('دلوقتي صندوق بنعل كاوتش على خرسانة. هيمسك أكتر؟', 'Now a rubber-soled crate on concrete. Will it grip more?'), mu:.8, mk:.6, c:'#8d9499', cc:'#3a4045'},
    {goal:T('صندوق حديد على تلج. خلي بالك، ده بيتزحلق بسرعة!', 'A steel crate on ice. Careful, this one slips early!'), mu:.1, mk:.05, c:'#9fd3ef', cc:'#8d9499'}
  ], L, setup);
};

/* ============ 6 · energy: make the loop ============ */
MS.loop = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('لعبة الملاهي: اللوب', 'Fun-fair loop'), '0 0 600 320');
  const s = g.svg, GY = 296, K = 16;
  el(s, 'rect', {x:0, y:0, width:600, height:320, fill:'var(--panel)'});
  el(s, 'rect', {x:0, y:GY, width:600, height:24, fill:'#b9c2c8'});
  const track = el(s, 'path', {fill:'none', stroke:'var(--accent)', 'stroke-width':6, 'stroke-linecap':'round', 'stroke-linejoin':'round'});
  const hT = el(s, 'text', {'font-size':12, 'font-weight':700, fill:'var(--ink)'});
  const ball = el(s, 'g', {}); ball.innerHTML = '<circle r="9" fill="#d2552d" stroke="#fff" stroke-width="2"/>';
  const bars = el(s, 'g', {transform:'translate(470,16)'});
  bars.innerHTML = `<rect width="120" height="64" rx="8" fill="var(--bg)"/><text x="10" y="20" font-size="11" fill="var(--ink)">PE</text><rect class="pe" x="36" y="10" height="12" rx="3" fill="var(--accent)"/><text x="10" y="40" font-size="11" fill="var(--ink)">KE</text><rect class="ke" x="36" y="30" height="12" rx="3" fill="#2f8f4e"/><text x="10" y="58" font-size="10" fill="var(--muted)">PE + KE = 100%</text>`;
  const peB = bars.querySelector('.pe'), keB = bars.querySelector('.ke');
  const rd = readouts(g, [['h', T('ارتفاع البداية', 'Start height')], ['R', T('نص قطر اللوب', 'Loop radius')], ['v', T('السرعة', 'Speed')]]);
  const H = slider(g, {label:T('ارتفاع البداية', 'Start height'), min:3, max:14, step:.5, value:6, unit:'m', dec:1}, () => build());
  const go = button(g, T('انطلق 🎢', 'Go 🎢'), start, true);
  let cur, P = [], stop = null;
  function build(){
    const h = H.get(), R = cur ? cur.R : 4, cx = 400, cy = GY - R * K;
    P = [];
    for (let i = 0; i <= 120; i++){ const u = i / 120; P.push({x:30 + 190 * u, y:GY - h * K * (1 + Math.cos(Math.PI * u)) / 2}); }
    for (let x = 222; x < cx; x += 3) P.push({x, y:GY});
    for (let i = 0; i <= 360; i++){ const f = i / 360 * 2 * Math.PI; P.push({x:cx + R * K * Math.sin(f), y:cy + R * K * Math.cos(f), f}); }
    for (let x = cx + 3; x <= 590; x += 3) P.push({x, y:GY});
    let c = 0; P.forEach((p, i) => { if (i) c += Math.hypot(p.x - P[i - 1].x, p.y - P[i - 1].y) / K; p.s = c; p.hm = (GY - p.y) / K; });
    set(track, {d:'M' + P.map(p => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join('L')});
    set(hT, {x:50, y:GY - h * K - 14}); hT.textContent = 'h = ' + n(h, 1) + ' m';
    if (!stop) put(P[0], h);
    rd('h', bd(n(h, 1) + ' m')); rd('R', bd(R + ' m'));
  }
  function put(p, h){
    set(ball, {transform:`translate(${p.x},${p.y - 9})`});
    const pe = clamp(p.hm / h, 0, 1); set(peB, {width:76 * pe}); set(keB, {width:76 * (1 - pe)});
    rd('v', bd(n(Math.sqrt(Math.max(0, 2 * G * (h - p.hm))), 1) + ' m/s'));
  }
  function at(sm){ let i = 1; while (i < P.length - 1 && P[i].s < sm) i++; const a = P[i - 1], b = P[i], u = b.s > a.s ? clamp((sm - a.s) / (b.s - a.s), 0, 1) : 0; return {x:a.x + (b.x - a.x) * u, y:a.y + (b.y - a.y) * u, hm:a.hm + (b.hm - a.hm) * u, f:a.f == null || b.f == null ? null : a.f + (b.f - a.f) * u}; }
  function start(){
    if (stop) return;
    const h = H.get(), R = cur.R, end = P[P.length - 1].s; let sm = 0.02, dir = 1, fly = null;
    go.disabled = true; H.lock(true);
    const fin = (ok, t) => { stop = null; go.disabled = false; H.lock(false); ok ? judge(h) : game.miss(t); };
    stop = run(dt => {
      dt *= 1.2;
      if (fly){
        fly.vy += G * dt; fly.x += fly.vx * dt * K; fly.y += fly.vy * dt * K;
        set(ball, {transform:`translate(${fly.x},${fly.y - 9})`});
        if (fly.y >= GY){ fin(false, T('وقعت من فوق! السرعة فوق مكانتش كفاية. زوّد الارتفاع.', 'It fell off! Not enough speed at the top. Start higher.')); return false; }
        return;
      }
      const p = at(sm), v2 = 2 * G * (h - p.hm);
      if (p.f != null && p.f > Math.PI / 2 && p.f < 1.5 * Math.PI && v2 / R + G * Math.cos(p.f) < 0){
        const v = Math.sqrt(Math.max(0, v2));
        fly = {x:p.x, y:p.y, vx:v * Math.cos(p.f), vy:-v * Math.sin(p.f)}; return;
      }
      if (v2 <= 0.01 && dir > 0 && sm > 0.5) dir = -1;
      sm += dir * Math.sqrt(Math.max(v2, 0.04)) * dt; put(at(sm), h);
      if (sm <= 0.02 && dir < 0){ fin(false, T('مطلعتش اللوب ورجعت لورا. ابدأ من ارتفاع أعلى.', 'It could not climb the loop and rolled back. Start higher.')); return false; }
      if (sm >= end){ fin(true); return false; }
    });
  }
  function judge(h){
    if (cur.max && h > cur.max) game.miss(T(`عدّت! بس على ${bd(n(h, 1) + ' m')}. فيه ارتفاع أقل يعدّي برضه، دوّر عليه.`, `It made it, at ${n(h, 1)} m. A lower start also works, find it.`));
    else game.win(cur.ok);
  }
  function setup(r){ cur = r; if (stop){ stop(); stop = null; } go.disabled = false; H.lock(false); H.set(r.h0); build(); }
  const game = rounds(g, [
    {goal:T(`اللوب نص قطره ${bd('R = 4 m')}. اختار ارتفاع يخلّي العربية تلف اللوب كله.`, 'The loop radius is R = 4 m. Pick a height that gets the cart all the way round.'), R:4, h0:6, ok:T('لفّت! طاقة الوضع اتحوّلت لطاقة حركة.', 'Round it goes! Potential energy turned into kinetic energy.')},
    {goal:T('نفس اللوب. لاقي أقل ارتفاع يعدّي بالعافية.', 'Same loop. Find the lowest height that just makes it.'), R:4, h0:12, max:10.5, ok:T(`أقل ارتفاع = ${bd('2.5 × R = 10 m')}. أقل من كده تقع من فوق.`, 'Lowest height = 2.5 × R = 10 m. Any lower and it falls at the top.')},
    {goal:T(`لوب أصغر ${bd('R = 3 m')}. أقل ارتفاع يعدّي؟`, 'A smaller loop, R = 3 m. Lowest height that works?'), R:3, h0:6, max:8, ok:T(`${bd('2.5 × 3 = 7.5 m')}. القاعدة شغالة! 🎢`, '2.5 × 3 = 7.5 m. The rule works! 🎢')}
  ], L, setup);
};

/* ============ 7 · momentum: crash two carts ============ */
MS.carts = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('تصادم العربيات', 'Cart crash'), '0 0 600 180');
  const s = g.svg, GY = 140, K = 50, W = 70;
  el(s, 'rect', {x:0, y:0, width:600, height:180, fill:'var(--panel)'});
  el(s, 'rect', {x:0, y:GY, width:600, height:6, fill:'#8d9499'});
  const cart = c => { const e = el(s, 'g', {}); e.innerHTML = `<rect x="0" y="-38" width="${W}" height="30" rx="5" fill="${c}"/><circle cx="16" cy="-6" r="6" fill="#22272b"/><circle cx="${W - 16}" cy="-6" r="6" fill="#22272b"/><text class="m" x="${W / 2}" y="-18" font-size="13" font-weight="700" text-anchor="middle" fill="#fff"></text>`; return e; };
  const A = cart('#d2552d'), B = cart('#3a6fd8');
  const vA = el(s, 'path', ARW('#d2552d')), vB = el(s, 'path', ARW('#3a6fd8'));
  const tA = el(s, 'text', {'font-size':12, 'font-weight':700, fill:'#d2552d', 'text-anchor':'middle'}), tB = el(s, 'text', {'font-size':12, 'font-weight':700, fill:'#3a6fd8', 'text-anchor':'middle'});
  const rd = readouts(g, [['p0', T('كمية الحركة قبل', 'Momentum before')], ['p1', T('كمية الحركة بعد', 'Momentum after')], ['v', T('السرعات بعد', 'Speeds after')]]);
  const mA = slider(g, {label:T('كتلة الحمرا', 'Red mass'), min:1, max:6, step:.5, value:2, unit:'kg', dec:1}, () => pose());
  const uA = slider(g, {label:T('سرعة الحمرا ←', 'Red speed →'), min:0, max:4, step:.5, value:2, unit:'m/s', dec:1}, () => pose());
  const mB = slider(g, {label:T('كتلة الزرقا', 'Blue mass'), min:1, max:6, step:.5, value:2, unit:'kg', dec:1}, () => pose());
  const uB = slider(g, {label:T('سرعة الزرقا →', 'Blue speed ←'), min:0, max:4, step:.5, value:0, unit:'m/s', dec:1}, () => pose());
  const go = button(g, T('يلا 💥', 'Go 💥'), start, true);
  let cur, stop = null, xa = 60, xb = 470;
  if (!EN){ uA.el.querySelector('span').textContent = 'سرعة الحمرا (يمين)'; uB.el.querySelector('span').textContent = 'سرعة الزرقا (شمال)'; }
  function show(va, vb){
    set(A, {transform:`translate(${xa},${GY})`}); set(B, {transform:`translate(${xb},${GY})`});
    A.querySelector('.m').textContent = mA.get() + ' kg'; B.querySelector('.m').textContent = mB.get() + ' kg';
    const ar = (e, t, x, v, c) => { set(e, {d:Math.abs(v) < .01 ? '' : arrowPath(x + W / 2, 70, x + W / 2 + v * 22, 70, 9)}); set(t, {x:x + W / 2, y:58}); t.textContent = n(Math.abs(v), 1) + ' m/s'; };
    ar(vA, tA, xa, va); ar(vB, tB, xb, vb);
  }
  function pose(){ if (stop) return; xa = 60; xb = 470; show(uA.get(), -uB.get()); const p = mA.get() * uA.get() - mB.get() * uB.get(); rd('p0', bd(n(p, 1) + ' kg·m/s')); rd('p1', '–'); rd('v', '–'); }
  function start(){
    if (stop) return;
    const m1 = mA.get(), m2 = mB.get(); let v1 = uA.get(), v2 = -uB.get();
    if (v1 - v2 <= 0){ game.miss(T('العربيتين مش هيقابلوا بعض. حرّك واحدة على الأقل.', 'The carts will never meet. Move at least one.')); return; }
    go.disabled = true; [mA, uA, mB, uB].forEach(x => x.lock(true));
    let hit = false, t = 0, a1, a2;
    stop = run(dt => {
      if (!hit){
        xa += v1 * K * dt; xb += v2 * K * dt;
        if (xa + W >= xb){
          hit = true; xa = xb - W;
          if (cur.stick){ a1 = a2 = (m1 * v1 + m2 * v2) / (m1 + m2); }
          else { a1 = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2); a2 = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2); }
          rd('p1', bd(n(m1 * a1 + m2 * a2, 1) + ' kg·m/s')); rd('v', bd(n(a1, 1) + ' / ' + n(a2, 1) + ' m/s'));
        }
        show(v1, v2); return;
      }
      t += dt; xa += a1 * K * dt; xb += a2 * K * dt; show(a1, a2);
      if (t > 2.2){ stop = null; go.disabled = false; lockR(); judge(a1, a2); return false; }
    });
  }
  function judge(a1, a2){
    const ok = cur.want === 'both' ? Math.abs(a1) < .05 && Math.abs(a2) < .05 : Math.abs(a1) < .05 && a2 > .05;
    if (ok) game.win(cur.ok); else game.miss(T(`بعد الخبطة: الحمرا ${bd(n(a1, 1) + ' m/s')} والزرقا ${bd(n(a2, 1) + ' m/s')}. جرّب تاني.`, `After the crash: red ${n(a1, 1)} m/s, blue ${n(a2, 1)} m/s. Try again.`));
  }
  function lockR(){ [mA, uA, mB, uB].forEach((x, i) => x.lock(cur.lock[i])); }
  function setup(r){ cur = r; if (stop){ stop(); stop = null; } go.disabled = false; mA.set(r.v[0]); uA.set(r.v[1]); mB.set(r.v[2]); uB.set(r.v[3]); lockR(); pose(); }
  const game = rounds(g, [
    {goal:T(`العربيتين هيلزقوا في بعض. الحمرا ${bd('2 kg')} بـ ${bd('3 m/s')} والزرقا ${bd('3 kg')}. اختار سرعة الزرقا عشان الاتنين يقفوا بعد الخبطة.`, 'The carts will stick together. Red is 2 kg at 3 m/s, blue is 3 kg. Pick blue’s speed so both stop after the crash.'),
      v:[2, 3, 3, 1], lock:[1, 1, 1, 0], stick:true, want:'both', ok:T(`${bd('2 × 3 = 3 × 2')}: كمية الحركة قبل = صفر، فبعد = صفر.`, '2 × 3 = 3 × 2: momentum before = zero, so after = zero.')},
    {goal:T(`لازقين برضه. الحمرا ${bd('4 kg')} بـ ${bd('1.5 m/s')}، الزرقا جاية بـ ${bd('2 m/s')}. اختار كتلة الزرقا.`, 'Sticky again. Red is 4 kg at 1.5 m/s, blue comes at 2 m/s. Pick blue’s mass.'),
      v:[4, 1.5, 1, 2], lock:[1, 1, 0, 1], stick:true, want:'both', ok:T(`${bd('4 × 1.5 = 3 × 2 = 6 kg·m/s')} من كل ناحية.`, '4 × 1.5 = 3 × 2 = 6 kg·m/s from each side.')},
    {goal:T(`تصادم مرن (زي البلي). الحمرا ${bd('2 kg')} بـ ${bd('2 m/s')} والزرقا واقفة. اختار كتلة الزرقا عشان الحمرا تقف مكانها والزرقا تكمّل.`, 'An elastic crash (like marbles). Red is 2 kg at 2 m/s, blue is still. Pick blue’s mass so red stops dead and blue carries on.'),
      v:[2, 2, 4, 0], lock:[1, 1, 0, 1], stick:false, want:'one', ok:T('كتلتين زي بعض في تصادم مرن = بيبدّلوا السرعات. ده سر كرات نيوتن 🎱', 'Equal masses in an elastic crash swap speeds. That is the trick of Newton’s cradle 🎱')}
  ], L, setup);
};

/* ============ 8 · torque: balance the seesaw ============ */
MS.seesaw = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('المرجيحة', 'The seesaw'), '0 0 600 260');
  const s = g.svg, CX = 300, CY = 196, K = 88;
  el(s, 'rect', {x:0, y:0, width:600, height:260, fill:'var(--panel)'});
  el(s, 'rect', {x:0, y:236, width:600, height:24, fill:'#7aa95c'});
  el(s, 'polygon', {points:`${CX},${CY} ${CX - 30},236 ${CX + 30},236`, fill:'#5c636a'});
  const plank = el(s, 'g', {});
  const rd = readouts(g, [['l', T('عزم الشمال', 'Left torque')], ['r', T('عزم اليمين', 'Right torque')]]);
  const D = slider(g, {label:T('مكان اللي على اليمين من المحور', 'Right rider’s distance from the pivot'), min:.25, max:3, step:.25, value:.5, unit:'m', dec:2}, () => upd());
  let cur, ang = 0, want = 0, tmr = 0;
  const kid = (m, c) => { const h = 22 + m * .45; return `<rect x="-16" y="${-h - 8}" width="32" height="${h}" rx="10" fill="${c}"/><circle cy="${-h - 20}" r="12" fill="${c}"/><text y="${-h / 2 - 4}" font-size="12" font-weight="700" text-anchor="middle" fill="#fff">${m}</text>`; };
  function draw(){
    let h = `<rect x="${CX - 3 * K}" y="${CY - 8}" width="${6 * K}" height="8" rx="3" fill="#a0672e"/>`;
    for (let d = -3; d <= 3; d += .5) h += `<line x1="${CX + d * K}" y1="${CY}" x2="${CX + d * K}" y2="${CY + (d % 1 ? 4 : 8)}" stroke="var(--muted)"/>` + (d % 1 || !d ? '' : `<text x="${CX + d * K}" y="${CY + 20}" font-size="10" text-anchor="middle" fill="var(--muted)">${Math.abs(d)}m</text>`);
    if (cur){ h += `<g transform="translate(${CX - cur.d1 * K},${CY - 8})">${kid(cur.m1, '#3a6fd8')}</g><g transform="translate(${CX + D.get() * K},${CY - 8})">${kid(cur.m2, '#d2552d')}</g>`; }
    plank.innerHTML = h;
  }
  function upd(){
    draw(); if (!cur) return;
    const tl = cur.m1 * G * cur.d1, tr = cur.m2 * G * D.get();
    rd('l', bd(n(tl, 0) + ' N·m')); rd('r', bd(n(tr, 0) + ' N·m'));
    want = clamp((tr - tl) / tl * 25, -11, 11);
    clearTimeout(tmr); tmr = setTimeout(() => {
      if (Math.abs(tr - tl) < 1e-6) game.win(cur.ok);
      else game.miss(tr > tl ? T('اليمين نزل: قرّبه من المحور.', 'The right side drops: move it closer to the pivot.') : T('الشمال نزل: بعّد اللي على اليمين.', 'The left side drops: move the right rider further out.'));
    }, 450);
  }
  IL.animate(host, dt => { ang += (want - ang) * Math.min(1, dt * 5); set(plank, {transform:`rotate(${ang.toFixed(2)},${CX},${CY})`}); });
  function setup(r){ cur = r; D.set(.5); upd(); }
  const game = rounds(g, [
    {goal:T(`على الشمال ${bd('60 kg')} على بعد ${bd('1 m')}. اللي على اليمين ${bd('30 kg')}: يقعد فين؟`, 'On the left: 60 kg at 1 m. The rider on the right weighs 30 kg: where should they sit?'), m1:60, d1:1, m2:30, ok:T(`اتزنت! ${bd('60 × 1 = 30 × 2')}: الخفيف يبعد عشان يعوّض.`, 'Balanced! 60 × 1 = 30 × 2: the lighter one sits further out.')},
    {goal:T(`${bd('50 kg')} على ${bd('1.2 m')} قصاد ${bd('40 kg')}.`, '50 kg at 1.2 m against 40 kg.'), m1:50, d1:1.2, m2:40, ok:T(`${bd('50 × 1.2 = 40 × 1.5 = 60')}`, '50 × 1.2 = 40 × 1.5 = 60')},
    {goal:T(`عربية نقل صغيرة! ${bd('80 kg')} على ${bd('0.75 m')} قصاد طفل ${bd('20 kg')}.`, 'A heavy one! 80 kg at 0.75 m against a 20 kg child.'), m1:80, d1:.75, m2:20, ok:T('الطفل الصغير شال الكبير بالذراع الطويلة. ده سر الرافعة 💪', 'A small child holds up a big rider with a long arm. That is the secret of the lever 💪')}
  ], L, setup);
};

/* ============ 9 · gears: get the output speed ============ */
MS.gears = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('علبة التروس', 'The gearbox'), '0 0 600 300');
  const s = g.svg, CY = 152, N1 = 1450, T1 = 10;
  el(s, 'rect', {x:0, y:0, width:600, height:300, fill:'var(--panel)'});
  const g1 = el(s, 'path', {fill:'#8d9499', stroke:'#5c636a', 'stroke-width':1.5});
  const g2 = el(s, 'path', {fill:'color-mix(in srgb, var(--accent) 45%, #8d9499)', stroke:'#5c636a', 'stroke-width':1.5});
  const d1 = el(s, 'circle', {r:6, fill:'#22272b'}), d2 = el(s, 'circle', {r:6, fill:'#22272b'});
  const l1 = el(s, 'text', {'font-size':12, 'font-weight':700, fill:'var(--ink)', 'text-anchor':'middle'}), l2 = el(s, 'text', {'font-size':12, 'font-weight':700, fill:'var(--ink)', 'text-anchor':'middle'});
  const rd = readouts(g, [['n', T('سرعة الخرج', 'Output speed')], ['t', T('عزم الخرج', 'Output torque')], ['p', T('القدرة داخل / خارج', 'Power in / out')]]);
  const Z1 = slider(g, {label:T('أسنان ترس الموتور', 'Motor gear teeth'), min:10, max:40, step:1, value:20}, () => upd());
  const Z2 = slider(g, {label:T('أسنان الترس التاني', 'Driven gear teeth'), min:10, max:120, step:1, value:20}, () => upd());
  let cur, a1 = 0, c1, c2, r1, r2, tmr = 0;
  const gearD = (z, r) => { let d = ''; const ro = r + 5, ri = r - 4; for (let i = 0; i < z; i++){ const a = i / z * 2 * Math.PI, w = Math.PI / z; [[ri, a - w * .5], [ro, a - w * .25], [ro, a + w * .25], [ri, a + w * .5], [ri, a + w * 1.5]].forEach(([rr, aa], j) => { d += (i || j ? 'L' : 'M') + (rr * Math.cos(aa)).toFixed(1) + ',' + (rr * Math.sin(aa)).toFixed(1); }); } return d + 'Z'; };
  function upd(){
    const z1 = Z1.get(), z2 = Z2.get(); r1 = 14 + z1 * 1.05; r2 = 14 + z2 * 1.05;
    c1 = 300 - (r1 + r2 + 2) / 2; c2 = c1 + r1 + r2 + 2;
    set(g1, {d:gearD(z1, r1)}); set(g2, {d:gearD(z2, r2)});
    set(d1, {cx:c1, cy:CY}); set(d2, {cx:c2, cy:CY});
    const n2 = N1 * z1 / z2, t2 = T1 * z2 / z1, P = T1 * N1 * 2 * Math.PI / 60 / 1000;
    set(l1, {x:c1, y:CY - r1 - 14}); l1.textContent = `M ${N1} rpm`; set(l2, {x:c2, y:Math.min(296, CY + r2 + 22)}); l2.textContent = n(n2, 0) + ' rpm';
    rd('n', bd(n(n2, 0) + ' rpm')); rd('t', bd(n(t2, 1) + ' N·m')); rd('p', bd(n(P, 2) + ' kW = ' + n(t2 * n2 * 2 * Math.PI / 60 / 1000, 2) + ' kW'));
    if (!cur) return;
    clearTimeout(tmr); tmr = setTimeout(() => { const v = cur.k === 'n' ? n2 : t2; if (Math.abs(v - cur.want) <= cur.tol) game.win(cur.ok); else game.miss(T(`لسه: ${cur.k === 'n' ? bd(n(n2, 0) + ' rpm') : bd(n(t2, 1) + ' N·m')}`, `Not yet: ${cur.k === 'n' ? n(n2, 0) + ' rpm' : n(t2, 1) + ' N·m'}`)); }, 500);
  }
  upd();
  IL.animate(host, dt => { a1 += dt * 1.6; const z1 = Z1.get(), z2 = Z2.get(), a2 = -a1 * z1 / z2 + Math.PI / z2; set(g1, {transform:`translate(${c1},${CY}) rotate(${(a1 * 180 / Math.PI).toFixed(1)})`}); set(g2, {transform:`translate(${c2},${CY}) rotate(${(a2 * 180 / Math.PI).toFixed(1)})`}); });
  function setup(r){ cur = r; Z1.set(20); Z2.set(20); upd(); }
  const game = rounds(g, [
    {goal:T(`الموتور ${bd('1450 rpm')} والسير محتاج ${bd('290 rpm')}. اختار الترسين.`, 'The motor runs at 1450 rpm and the conveyor needs 290 rpm. Choose the two gears.'), k:'n', want:290, tol:3, ok:T(`نسبة ${bd('5 : 1')}. ${bd('n2 = n1 × z1 ÷ z2')}`, 'A 5 : 1 ratio. n2 = n1 × z1 ÷ z2')},
    {goal:T(`عزم الموتور ${bd('10 N·m')}. الحمل محتاج ${bd('30 N·m')}.`, 'The motor gives 10 N·m. The load needs 30 N·m.'), k:'t', want:30, tol:.4, ok:T('التروس كبّرت العزم 3 مرات وقلّلت السرعة 3 مرات. القدرة زي ما هي!', 'The gears tripled the torque and cut the speed by three. Power stays the same!')},
    {goal:T(`عايز تسرّع: خلّي الخرج ${bd('2900 rpm')}.`, 'Speed it up: make the output 2900 rpm.'), k:'n', want:2900, tol:30, ok:T('سرعة أعلى = عزم أقل. مفيش حاجة ببلاش في الميكانيكا 😉', 'More speed means less torque. Mechanics gives nothing for free 😉')}
  ], L, setup);
};

/* ============ 10 · hydraulics: lift the car ============ */
MS.jack = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('الكريك الهيدروليك', 'The hydraulic jack'), '0 0 600 300');
  const s = g.svg, BY = 270, K = 5.5;
  el(s, 'rect', {x:0, y:0, width:600, height:300, fill:'var(--panel)'});
  const oil = el(s, 'path', {fill:'#e0a800', opacity:.85});
  const walls = el(s, 'path', {fill:'none', stroke:'#3a4045', 'stroke-width':4});
  const p1 = el(s, 'rect', {fill:'#5c636a'}), p2 = el(s, 'rect', {fill:'#5c636a'});
  const hand = el(s, 'path', ARW('#2f8f4e')); const hT = el(s, 'text', {'font-size':12, 'font-weight':700, fill:'#2f8f4e', 'text-anchor':'middle'});
  const load = el(s, 'g', {});
  const rd = readouts(g, [['p', T('ضغط الزيت', 'Oil pressure')], ['f', T('قوة الرفع', 'Lifting force')], ['w', T('وزن الحمل', 'Load weight')]]);
  const d1 = slider(g, {label:T('قطر المكبس الصغير', 'Small piston diameter'), min:1, max:5, step:.5, value:3, unit:'cm', dec:1}, () => draw());
  const D2 = slider(g, {label:T('قطر المكبس الكبير', 'Big piston diameter'), min:5, max:30, step:1, value:8, unit:'cm'}, () => draw());
  const F = slider(g, {label:T('قوة إيدك', 'Your hand force'), min:50, max:600, step:10, value:200, unit:'N'}, () => draw());
  const go = button(g, T('اضغط ⬇', 'Press ⬇'), press, true);
  let cur, lift = 0, stop = null;
  const area = d => Math.PI * Math.pow(d / 100, 2) / 4;
  function draw(){
    const a = d1.get() * K, b = D2.get() * K, x1 = 90, x2 = 330 - b / 2 + 60, top1 = 150, top2 = 170 - lift;
    set(walls, {d:`M${x1 - a / 2},${top1 - 40}V${BY}H${x2 + b}V${top2 - 30}M${x1 + a / 2},${top1 - 40}V${BY - 24}H${x2}V${top2 - 30}`});
    set(oil, {d:`M${x1 - a / 2},${top1}H${x1 + a / 2}V${BY - 24}H${x2}V${top2}H${x2 + b}V${BY}H${x1 - a / 2}Z`});
    set(p1, {x:x1 - a / 2, y:top1 - 10, width:a, height:10}); set(p2, {x:x2, y:top2 - 10, width:b, height:10});
    const f = F.get(); set(hand, {d:arrowPath(x1, top1 - 70 - f / 12, x1, top1 - 14, 10)}); set(hT, {x:x1, y:top1 - 76 - f / 12}); hT.textContent = f + ' N';
    if (cur){ load.innerHTML = cur.truck ? `<g transform="translate(${x2 + b / 2 + 50},${top2 - 10}) scale(1.5)">${CAR('#3a6fd8')}<rect x="-64" y="-50" width="40" height="28" rx="3" fill="#3a6fd8"/></g>` : `<g transform="translate(${x2 + b / 2 + 34},${top2 - 10}) scale(1.05)">${CAR('#d2552d')}</g>`; }
    const Wt = cur ? cur.m * G : 0, A1 = area(d1.get()), A2 = area(D2.get()), Fo = f * A2 / A1;
    const p = (Fo >= Wt ? Wt / A2 : f / A1) / 1e5;
    rd('p', bd(n(p, 1) + ' bar')); rd('f', bd(n(Fo, 0) + ' N')); rd('w', bd(n(Wt, 0) + ' N'));
    return {Fo, Wt, p, f};
  }
  function press(){
    if (stop) return;
    const r = draw();
    if (r.Fo < r.Wt){ game.miss(T(`قوة الرفع ${bd(n(r.Fo, 0) + ' N')} أقل من الوزن ${bd(n(r.Wt, 0) + ' N')}. كبّر الفرق بين المكبسين.`, `Lifting force ${n(r.Fo, 0)} N is less than the weight ${n(r.Wt, 0)} N. Make the pistons more different.`)); return; }
    go.disabled = true;
    stop = run(dt => { lift = Math.min(40, lift + dt * 30); draw(); if (lift >= 40){ stop = null; go.disabled = false; judge(r); return false; } });
  }
  function judge(r){
    if (cur.fMax && r.f > cur.fMax) game.miss(T(`اترفعت، بس بإيدك ${bd(r.f + ' N')}. المطلوب ${bd(cur.fMax + ' N')} أو أقل.`, `It lifted, but with ${r.f} N. The limit is ${cur.fMax} N.`));
    else if (cur.pMax && r.p > cur.pMax) game.miss(T(`اترفعت، بس الضغط ${bd(n(r.p, 1) + ' bar')}. لازم ${bd(cur.pMax + ' bar')} أو أقل.`, `It lifted, but the pressure is ${n(r.p, 1)} bar. Keep it at ${cur.pMax} bar or less.`));
    else game.win(cur.ok);
  }
  function setup(r){ cur = r; if (stop){ stop(); stop = null; } go.disabled = false; lift = 0; d1.set(3); D2.set(8); F.set(200); draw(); }
  [d1, D2, F].forEach(x => x.el.querySelector('input').addEventListener('input', () => { if (lift && !stop){ lift = 0; draw(); } }));
  const game = rounds(g, [
    {goal:T(`ارفع عربية ${bd('1500 kg')} بإيدك بقوة ${bd('300 N')} أو أقل.`, 'Lift a 1500 kg car pushing with 300 N or less.'), m:1500, fMax:300, ok:T(`الضغط واحد في كل الزيت، فالقوة بتكبر بنسبة المساحتين: ${bd('F2 = F1 × A2 ÷ A1')}`, 'Pressure is the same everywhere in the oil, so force grows with the area ratio: F2 = F1 × A2 ÷ A1')},
    {goal:T(`نفس العربية، بس الخراطيم تستحمل ${bd('20 bar')} بس.`, 'Same car, but the hoses only take 20 bar.'), m:1500, pMax:20, ok:T(`ضغط الرفع = ${bd('الوزن ÷ مساحة المكبس الكبير')}. كبّر المكبس يقل الضغط.`, 'Lifting pressure = weight ÷ big piston area. A bigger piston means lower pressure.')},
    {goal:T(`نقل ${bd('5000 kg')} بإيد واحدة: ${bd('250 N')} أو أقل!`, 'A 5000 kg truck with one hand: 250 N or less!'), m:5000, fMax:250, truck:true, ok:T('إنت رفعت 5 طن بإيد واحدة. ده سحر باسكال 🪄', 'You lifted 5 tonnes with one hand. That is Pascal’s magic 🪄')}
  ], L, setup);
};

/* ============ 11 · project: size the winch motor ============ */
MS.winch = function(host, opt){
  const L = opt.lesson;
  const g = frame(host, T('مشروع: موتور الونش', 'Project: the winch motor'), '0 0 600 260');
  const s = g.svg;
  el(s, 'rect', {x:0, y:0, width:600, height:260, fill:'var(--panel)'});
  el(s, 'rect', {x:60, y:20, width:480, height:12, fill:'#5c636a'});
  el(s, 'circle', {cx:300, cy:52, r:22, fill:'#8d9499', stroke:'#3a4045', 'stroke-width':3});
  el(s, 'rect', {x:200, y:36, width:60, height:32, rx:4, fill:'color-mix(in srgb, var(--accent) 50%, #5c636a)'});
  el(s, 'text', {x:230, y:57, 'font-size':13, 'font-weight':700, fill:'#fff', 'text-anchor':'middle'}).textContent = 'M';
  const rope = el(s, 'line', {x1:322, y1:52, x2:322, stroke:'#3a4045', 'stroke-width':2.5});
  const box = el(s, 'g', {}); box.innerHTML = CRATE(56, '', '500 kg');
  el(s, 'rect', {x:0, y:244, width:600, height:16, fill:'#b9c2c8'});
  g.ctl.remove();
  const D = {m:500, h:12, t:20, D:0.3, eta:0.8, n:1450};
  const steps = [
    {q:T('قوة الشد في الحبل (الوزن)', 'Rope pull (the weight)'), u:'N', a:4900, f:'F = m × g = 500 × 9.8'},
    {q:T('سرعة الرفع', 'Lifting speed'), u:'m/s', a:0.6, f:'v = h ÷ t = 12 ÷ 20'},
    {q:T('القدرة اللي الحمل محتاجها', 'Power the load needs'), u:'W', a:2940, f:'P = F × v'},
    {q:T('قدرة الموتور (الكفاءة 80%)', 'Motor power (80 % efficiency)'), u:'W', a:3675, f:'P ÷ 0.8'},
    {q:T('أنهي موتور قياسي تختار؟', 'Which standard motor do you pick?'), opts:['2.2 kW', '3 kW', '4 kW', '5.5 kW'], a:2, f:T('أقرب مقاس أكبر من 3.675 kW', 'The next size above 3.675 kW')},
    {q:T('سرعة الطنبورة (قطرها 0.3 m)', 'Drum speed (0.3 m diameter)'), u:'rpm', a:38.2, f:'n = v ÷ (π × D) × 60'},
    {q:T('نسبة علبة التروس (الموتور 1450 rpm)', 'Gearbox ratio (motor at 1450 rpm)'), u:': 1', a:38, f:'1450 ÷ 38.2'},
    {q:T('العزم على الطنبورة', 'Torque on the drum'), u:'N·m', a:735, f:'T = F × D ÷ 2 = 4900 × 0.15'}
  ];
  const box2 = document.createElement('div'); box2.className = 'ms-steps'; box2.style.cssText = 'display:grid;gap:8px';
  g.host.insertBefore(box2, g.msg);
  g.rno.textContent = T('بيانات الونش', 'Winch data');
  g.goal.innerHTML = T(`ارفع ${bd('500 kg')} لارتفاع ${bd('12 m')} في ${bd('20 s')}. قطر الطنبورة ${bd('0.3 m')}، الكفاءة ${bd('80%')}، الموتور ${bd('1450 rpm')}.`, 'Lift 500 kg by 12 m in 20 s. Drum diameter 0.3 m, efficiency 80 %, motor 1450 rpm.');
  let k = IL.has(L, 'sim') ? steps.length : 0;
  function pose(){ const y = 230 - (k / steps.length) * 150; set(box, {transform:`translate(322,${y + 14})`}); set(rope, {y2:y + 14 - 56}); }
  function render(){
    box2.innerHTML = steps.map((st, i) => {
      const done = i < k, on = i === k;
      if (!done && !on) return '';
      const ans = st.opts ? st.opts[st.a] : bd(n(st.a, st.a % 1 ? 1 : 0) + ' ' + st.u);
      return `<div class="ms-step${done ? ' ok' : ''}" data-i="${i}"><b>${i + 1}. ${st.q}</b>` + (done ? `<span>${bd(st.f)} = <b>${ans}</b></span>` :
        st.opts ? `<div class="row">${st.opts.map((o, j) => `<button type="button" class="btn" data-o="${j}">${bd(o)}</button>`).join('')}</div>` :
        `<div class="row"><input type="text" inputmode="decimal" aria-label="${esc(st.q)}" placeholder="${st.u}"><span class="mono">${st.u}</span><button type="button" class="btn pri" data-c>${T('تأكيد', 'Check')}</button></div>`) + '</div>';
    }).join('');
    pose();
    const inp = box2.querySelector('input'); if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(inp.value); });
  }
  let miss = 0;
  function check(v){
    const st = steps[k], x = IL.num(v);
    if (isFinite(x) && Math.abs(x - st.a) <= Math.abs(st.a) * 0.02){ ok(); }
    else { miss++; g.msg.className = 'ms-msg no'; g.msg.innerHTML = T('مش مظبوطة. ', 'Not quite. ') + (miss > 1 ? T('المعادلة: ', 'Formula: ') + bd(st.f) : T('جرّب تاني.', 'Try again.')); }
  }
  function ok(){
    miss = 0; k++; g.msg.className = 'ms-msg ok'; g.msg.textContent = '✓';
    if (k === steps.length){ g.msg.innerHTML = '✓ ' + T('حسبت الونش كله! موتور 4 kW وعلبة تروس 38 : 1 🎉', 'You sized the whole winch! A 4 kW motor and a 38 : 1 gearbox 🎉'); g.host.classList.add('won'); IL.mark(L, 'sim'); }
    render();
  }
  box2.addEventListener('click', e => {
    if (e.target.closest('[data-c]')){ check(box2.querySelector('input').value); return; }
    const o = e.target.closest('[data-o]'); if (o){ if (+o.dataset.o === steps[k].a) ok(); else { g.msg.className = 'ms-msg no'; g.msg.innerHTML = T('لأ. الموتور لازم يبقى أكبر من القدرة المطلوبة، وأقرب واحد ليها.', 'No. The motor must be above the power needed, and the closest size to it.'); } }
  });
  render();
};

})();
