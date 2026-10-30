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

})();
