/* كورس ميكانيكا الماكينات: the lesson explainers as short animated films (scene by scene, one short line each).
   Every film is a list of scenes {d: seconds, draw(t)} where t runs 0→1; draw returns SVG for viewBox "10 10 420 222".
   Needs mfit-sims.js (MF.film engine + MF.K basic parts). */
(function(){
'use strict';
const F = MF.FILMS, T = IL.T;
const {hexSide, shaft, plates, shake, waves, mark, arrowV, label, seg, ease, cl, C} = MF.K;
const {ST, DK, P1, P2, AC, BL, RD, GD} = C;
const OR = '#f59e0b', MO = '#3b6ea5', GB = '#5f7f5a', DR = '#8a96a6';
const r1 = v => Math.round(v * 10) / 10;
const TAU = Math.PI * 2;

/* ---------- parts kit ---------- */
function gear(cx, cy, r, n, ang, fill, stroke){
  const d = Math.max(3.5, r * .16), pts = [];
  for (let i = 0; i < n; i++){
    const a = ang + i * TAU / n, w = TAU / n;
    [[-.5, r - d], [-.28, r], [.06, r], [.28, r - d]].forEach(([k, rr]) => pts.push([cx + Math.cos(a + k * w) * rr, cy + Math.sin(a + k * w) * rr]));
  }
  return `<path d="M${pts.map(p => r1(p[0]) + ' ' + r1(p[1])).join(' L')}Z" fill="${fill || ST}" stroke="${stroke || DK}" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="${r1(r * .22)}" fill="#e2e8f0" stroke="${DK}" stroke-width="1.2"/>
    <line x1="${cx}" y1="${cy}" x2="${r1(cx + Math.cos(ang) * r * .6)}" y2="${r1(cy + Math.sin(ang) * r * .6)}" stroke="${DK}" stroke-width="2"/>`;
}
function wheel(cx, cy, r, ang, fill){                                   // pulley / drum seen from the end
  let o = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill || P1}" stroke="${DK}" stroke-width="1.6"/><circle cx="${cx}" cy="${cy}" r="${r1(r * .2)}" fill="#e2e8f0" stroke="${DK}"/>`;
  for (let k = 0; k < 3; k++){ const a = ang + k * TAU / 3; o += `<line x1="${r1(cx + Math.cos(a) * r * .22)}" y1="${r1(cy + Math.sin(a) * r * .22)}" x2="${r1(cx + Math.cos(a) * r * .9)}" y2="${r1(cy + Math.sin(a) * r * .9)}" stroke="${DK}" stroke-width="2.2"/>`; }
  return o;
}
function loop(x1, y1, r1_, x2, y2, r2, off, col, dash, w){              // belt / chain around two wheels (open loop, tangents approx.)
  const top = `M${x1} ${y1 - r1_} L${x2} ${y2 - r2} A${r2} ${r2} 0 0 1 ${x2} ${y2 + r2} L${x1} ${y1 + r1_} A${r1_} ${r1_} 0 0 1 ${x1} ${y1 - r1_}Z`;
  return `<path d="${top}" fill="none" stroke="${col || '#1f2937'}" stroke-width="${w || 5}" stroke-linejoin="round"/>` +
    (dash ? `<path d="${top}" fill="none" stroke="${dash}" stroke-width="${(w || 5) - 2.4}" stroke-dasharray="4 6" stroke-dashoffset="${r1(-off)}"/>` : '');
}
function motor(x, y, ang, sc){                                         // side view, shaft to the right; x,y = top-left
  const s = sc || 1, w = 96 * s, h = 64 * s;
  let o = `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${8 * s}" fill="${MO}" stroke="${DK}" stroke-width="1.5"/>`;
  for (let k = 1; k < 8; k++) o += `<line x1="${r1(x + k * w / 8)}" y1="${y + 5 * s}" x2="${r1(x + k * w / 8)}" y2="${y + h - 5 * s}" stroke="#2b4f78" stroke-width="2"/>`;
  o += `<rect x="${r1(x + w * .3)}" y="${r1(y - 12 * s)}" width="${r1(w * .3)}" height="${12 * s}" rx="2" fill="${MO}" stroke="${DK}"/>`;
  o += `<rect x="${r1(x - 10 * s)}" y="${r1(y + 6 * s)}" width="${10 * s}" height="${r1(h - 12 * s)}" rx="3" fill="#6b7a8c" stroke="${DK}"/>`;
  o += `<rect x="${r1(x + w)}" y="${r1(y + h / 2 - 6 * s)}" width="${22 * s}" height="${12 * s}" fill="${ST}" stroke="${DK}"/>`;
  o += spinBand(x + w, y + h / 2 - 6 * s, 22 * s, 12 * s, ang) + '</g>';
  return o;
}
function spinBand(x, y, w, h, ang){                                    // a stripe on a horizontal shaft that shows it turning
  const yy = y + h / 2 + Math.sin(ang) * h * .42, vis = Math.cos(ang) > -0.2;
  return vis ? `<line x1="${r1(x + 1)}" y1="${r1(yy)}" x2="${r1(x + w - 1)}" y2="${r1(yy)}" stroke="${OR}" stroke-width="2.4"/>` : '';
}
function hshaft(x0, x1, y, h, ang){ return `<rect x="${x0}" y="${y - h / 2}" width="${x1 - x0}" height="${h}" fill="${ST}" stroke="${DK}" stroke-width="1.3"/>` + spinBand(x0, y - h / 2, x1 - x0, h, ang); }
function coupling(x, y, ang, tilt){                                    // two hubs + spider, centre x,y
  const t = tilt || 0;
  return `<g transform="rotate(${t} ${x} ${y})"><rect x="${x - 26}" y="${y - 20}" width="24" height="40" rx="4" fill="${ST}" stroke="${DK}" stroke-width="1.4"/>
    <rect x="${x + 2}" y="${y - 20}" width="24" height="40" rx="4" fill="${ST}" stroke="${DK}" stroke-width="1.4"/><rect x="${x - 3}" y="${y - 16}" width="6" height="32" fill="${OR}" stroke="${DK}"/>` +
    spinBand(x - 26, y - 20, 24, 40, ang) + spinBand(x + 2, y - 20, 24, 40, ang) + '</g>';
}
function gearbox(x, y, w, h, angIn, ratio){                             // box with two meshing gears drawn inside
  const ri = h * .18, ro = h * .34;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${GB}" stroke="${DK}" stroke-width="1.5" opacity=".95"/>
    <g opacity=".9">${gear(x + w * .3, y + h * .55, ri, 9, angIn, '#cbd5c4')}${gear(x + w * .3 + ri + ro - 2, y + h * .55, ro, 17, -angIn / (ratio || 2) + .18, '#cbd5c4')}</g>`;
}
function bearing(cx, cy, r, ang, hot){
  let o = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${hot ? '#fca5a5' : P1}" stroke="${DK}" stroke-width="1.8"/><circle cx="${cx}" cy="${cy}" r="${r1(r * .8)}" fill="#f8fafc" stroke="${DK}"/>`;
  const n = 9, rb = r * .1;
  for (let i = 0; i < n; i++){ const a = ang * .4 + i * TAU / n; o += `<circle cx="${r1(cx + Math.cos(a) * r * .65)}" cy="${r1(cy + Math.sin(a) * r * .65)}" r="${r1(rb)}" fill="${ST}" stroke="${DK}"/>`; }
  o += `<circle cx="${cx}" cy="${cy}" r="${r1(r * .5)}" fill="${P1}" stroke="${DK}" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="${r1(r * .32)}" fill="#e2e8f0" stroke="${DK}"/>`;
  o += `<line x1="${cx}" y1="${cy}" x2="${r1(cx + Math.cos(ang) * r * .32)}" y2="${r1(cy + Math.sin(ang) * r * .32)}" stroke="${OR}" stroke-width="3"/>`;
  return o;
}
function rotArrow(cx, cy, r, ccw, c){
  const s = ccw ? -1 : 1, a0 = -2.2, a1 = -0.6;
  const p = (a) => [r1(cx + Math.cos(a * s) * r), r1(cy + Math.sin(a * s) * r)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1), [x2, y2] = p(a1 - .35);
  return `<path d="M${x0} ${y0} A${r} ${r} 0 0 ${ccw ? 0 : 1} ${x1} ${y1}" fill="none" stroke="${c || AC}" stroke-width="3"/><circle cx="${x1}" cy="${y1}" r="4.5" fill="${c || AC}"/>`;
}
function arrowH(x0, x1, y, c, w){ const d = x1 > x0 ? 1 : -1; return `<path d="M${x0} ${y} H${x1 - d * 7}" stroke="${c}" stroke-width="${w || 3.4}"/><path d="M${x1 - d * 9} ${y - 7} L${x1} ${y} L${x1 - d * 9} ${y + 7} Z" fill="${c}"/>`; }
function bar(x, y, w, h, frac, c, txt){
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#e2e8f0" stroke="${DK}" stroke-width="1"/><rect x="${x}" y="${r1(y + h * (1 - frac))}" width="${w}" height="${r1(h * frac)}" rx="4" fill="${c}"/>` + (txt ? label(x + w / 2, y - 8, txt, c) : '');
}
function glow(cx, cy, r, a){ return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${RD}" opacity="${r1(a * .35)}"/><circle cx="${cx}" cy="${cy}" r="${r1(r * .6)}" fill="${RD}" opacity="${r1(a * .35)}"/>`; }
function smoke(cx, cy, t){
  let o = '';
  for (let k = 0; k < 3; k++){ const p = (t * 1.5 + k / 3) % 1; o += `<circle cx="${r1(cx + Math.sin(p * 6 + k) * 6)}" cy="${r1(cy - p * 40)}" r="${r1(5 + p * 9)}" fill="#94a3b8" opacity="${r1((1 - p) * .55)}"/>`; }
  return o;
}
function pad(x, y, closed){                                             // padlock
  const sh = closed ? 0 : -8;
  return `<path d="M${x - 9} ${y + sh} v-8 a9 9 0 0 1 18 0 v${8 - sh}" fill="none" stroke="${DK}" stroke-width="4"/><rect x="${x - 14}" y="${y}" width="28" height="22" rx="4" fill="${OR}" stroke="${DK}" stroke-width="1.5"/><circle cx="${x}" cy="${y + 10}" r="3" fill="${DK}"/>`;
}
function hl(x, y, w, h, a){ return a > 0 ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${AC}" stroke-width="3.5" opacity="${r1(a)}"/>` : ''; }
function tag(x, y, txt, c, a){ return `<g opacity="${r1(a == null ? 1 : a)}">${label(x, y, txt, c || AC)}</g>`; }
const fade = (t, a, b) => r1(seg(t, a, b));
MF.K2 = {gear, wheel, loop, motor, spinBand, hshaft, coupling, gearbox, bearing, rotArrow, arrowH, bar, glow, smoke, pad, hl, tag, fade, OR, MO, GB, DR};

/* ---------- the whole drive train (used by several lesson-1 scenes) ---------- */
function train(t, opt){
  const o = opt || {}, A = t * TAU * 6;                                  // motor angle (fast)
  const aG = A / 20, aD = aG / 1.5;
  let s = '';
  s += `<rect x="20" y="186" width="400" height="10" rx="3" fill="#64748b"/>`;                // frame
  s += motor(30, 116, A, .9);
  s += hshaft(117, 150, 145, 10, A);
  s += coupling(152, 145, A);
  s += hshaft(178, 196, 145, 10, A);
  s += gearbox(196, 104, 92, 82, A, 3);
  s += hshaft(288, 312, 128, 12, aG);
  s += gear(318, 128, 12, 10, aG, '#9aa5b1') + gear(380, 72, 18, 15, aD, '#9aa5b1');
  s += loop(318, 128, 13, 380, 72, 19, aG * 60, '#334155', '#cbd5e1', 6);
  s += wheel(380, 72, 34, aD, '#d4dbe4') + gear(380, 72, 18, 15, aD, '#9aa5b1');
  s += `<rect x="372" y="108" width="16" height="78" fill="#94a3b8" stroke="${DK}"/>`;
  if (o.bearings) [[138, 160], [300, 145], [380, 112]].forEach(([x, y]) => { s += `<g opacity="${o.bearings}">${bearing(x, y + 12, 9, A)}</g>`; });
  if (o.bolts) [[40, 191], [90, 191], [215, 191], [268, 191]].forEach(([x, y]) => { s += `<g opacity="${o.bolts}"><circle cx="${x}" cy="${y}" r="6" fill="${OR}" stroke="${DK}"/></g>`; });
  return s;
}

F.drive_flow = [
  {d: 7, draw(t){
    const parts = [[22, 108, 116, 80, T('موتور', 'Motor')], [124, 118, 58, 54, T('كوبلنج', 'Coupling')], [192, 98, 102, 94, T('جيربوكس', 'Gearbox')], [300, 50, 50, 96, T('جنزير', 'Chain')], [340, 30, 84, 160, T('الحمل', 'Load')]];
    let s = train(t);
    parts.forEach((p, i) => { const a = seg(t, .08 + i * .15, .18 + i * .15) * (1 - seg(t, .23 + i * .15, .3 + i * .15)); s += hl(p[0], p[1], p[2], p[3], a) + tag(p[0] + p[2] / 2, p[1] - 8 < 22 ? p[1] + p[3] + 22 : p[1] - 8, p[4], AC, a); });
    if (t > .85) s += tag(80, 50, T('سريع وضعيف', 'Fast, weak'), RD, fade(t, .85, .92)) + tag(320, 222, T('بطيء وقوي', 'Slow, strong'), GD, fade(t, .85, .92));
    return s;
  }},
  {d: 6, draw(t){
    return train(t, {bearings: fade(t, .05, .2), bolts: fade(t, .45, .6)}) + tag(110, 40, T('رولمان تحت كل عمود', 'A bearing under every shaft'), AC, fade(t, .1, .25)) + tag(150, 222, T('وكله مربوط بمسامير', 'all bolted to the frame'), OR, fade(t, .5, .65));
  }}
];

/* each part on its own, doing its job */
F.drive_parts = [
  {d: 5, draw(t){ const A = t * TAU * 3; return hshaft(60, 196, 120, 18, A) + hshaft(244, 380, 120, 18, A) + `<g transform="translate(220 120) scale(1.6) translate(-220 -120)">${coupling(220, 120, A)}</g>` + tag(220, 200, T('الكوبلنج: يوصل عمودين وش لوش', 'Coupling: joins two shafts end to end'), AC); }},
  {d: 5, draw(t){ const A = t * TAU * 2; return gear(160, 115, 34, 11, A, '#cbd5e1') + gear(160 + 34 + 64 - 4, 115, 64, 21, -A * 11 / 21 + .14, '#cbd5e1') + tag(160, 40, T('سريع', 'fast'), RD) + tag(254, 40, T('بطيء وأقوى', 'slow, stronger'), GD) + tag(220, 210, T('الجيربوكس: يقلل السرعة ويكبّر العزم', 'Gearbox: less speed, more torque'), AC); }},
  {d: 5, draw(t){ const A = t * TAU * 2; return loop(110, 115, 34, 330, 115, 54, A * 34, '#374151', null, 8) + wheel(110, 115, 34, A) + wheel(330, 115, 54, A * 34 / 54) + tag(220, 210, T('السير: ينقل الحركة لعمود بعيد', 'Belt: carries motion to a far shaft'), AC); }},
  {d: 5, draw(t){ const A = t * TAU * 2; return loop(120, 115, 36, 320, 115, 48, A * 36, '#334155', '#cbd5e1', 9) + gear(120, 115, 36, 14, A, '#9aa5b1') + gear(320, 115, 48, 19, A * 36 / 48, '#9aa5b1') + tag(220, 210, T('الجنزير: زي السير بس ما بيزحلقش', 'Chain: a belt that cannot slip'), AC); }},
  {d: 5, draw(t){ return bearing(220, 112, 78, t * TAU * 3) + tag(220, 214, T('الرولمان: يشيل العمود ويلف ناعم', 'Bearing: carries the shaft, turns smoothly'), AC); }},
  {d: 7, draw(t){
    const A = t * TAU * 2, keyed = t > .5, hubA = keyed ? A : A * .15;
    const hub = (a) => `<circle cx="220" cy="110" r="70" fill="${P1}" stroke="${DK}" stroke-width="2"/><line x1="220" y1="110" x2="${r1(220 + Math.cos(a) * 66)}" y2="${r1(110 + Math.sin(a) * 66)}" stroke="${DK}" stroke-width="3"/>`;
    let s = `<g>${hub(hubA)}</g><circle cx="220" cy="110" r="30" fill="${ST}" stroke="${DK}" stroke-width="2"/><line x1="220" y1="110" x2="${r1(220 + Math.cos(A) * 28)}" y2="${r1(110 + Math.sin(A) * 28)}" stroke="${OR}" stroke-width="3"/>`;
    if (keyed) s += `<rect x="-6" y="-38" width="12" height="16" fill="${OR}" stroke="${DK}" transform="translate(220 110) rotate(${r1(A * 180 / Math.PI + 90)})"/>`;
    s += keyed ? mark(true, 340, 60) + tag(220, 214, T('بالخابور: الاتنين بيلفّوا مع بعض', 'With a key: they turn together'), GD) : mark(false, 340, 60) + tag(220, 214, T('من غير خابور: العمود بيلف لوحده', 'No key: the shaft spins inside'), RD);
    return s;
  }}
];

F.drive_torque = [
  {d: 8, draw(t){
    let s = train(t * .6);
    const g = seg(t, .1, .9);
    s += bar(40, 40, 26, 50, .06, RD, '10');
    s += `<g opacity="${fade(t, .3, .45)}">` + bar(230, 30, 26, 60, .69 * seg(t, .3, .55), OR, '190') + '</g>';
    s += `<g opacity="${fade(t, .55, .7)}">` + bar(300, 30, 26, 60, seg(t, .55, .8), GD, '275') + '</g>';
    s += tag(150, 70, 'N·m', DK);
    return s + tag(60, 222, '1450 rpm', RD, 1) + tag(380, 222, '48 rpm', GD, fade(t, .55, .7));
  }},
  {d: 6, draw(t){
    const A = t * TAU * .8, fl = Math.sin(t * 40) > 0 && t > .3;
    return `<circle cx="220" cy="110" r="72" fill="${P1}" stroke="${DK}" stroke-width="2"/><circle cx="220" cy="110" r="30" fill="${ST}" stroke="${DK}" stroke-width="2"/>` +
      `<rect x="-7" y="-40" width="14" height="18" fill="${fl ? RD : OR}" stroke="${DK}" transform="translate(220 110) rotate(${r1(A * 57.3)})"/>` + rotArrow(220, 110, 92, false, DK) +
      tag(220, 214, T('أبطأ عمود عليه أعلى عزم: خابوره أول حاجة تتقطع', 'The slowest shaft carries the most torque: its key shears first'), RD);
  }}
];

F.drive_faults = [
  {d: 5, draw(t){ const back = ease(seg(t, .15, .85)); return `<g transform="translate(${shake(t, t > .1)} 0)">` + shaft(60, 200) + plates() + hexSide(180, 62, 72, 24, 0) + hexSide(180, 134 + back * 18, 66, 22, back * 9) + '</g>' + waves(t, t > .1) + tag(220, 228, T('1. مسمار فكّ أو خابور لعب', '1. A loose bolt or a worn key'), RD); }},
  {d: 5, draw(t){ const A = t * TAU * 3, w = Math.sin(A) * 6; return hshaft(40, 190, 110, 16, A) + `<g transform="translate(0 ${r1(24 + w * .3)})">${hshaft(250, 400, 110, 16, A)}</g>` + coupling(220, 122 + r1(w * .3), A, r1(8 + w)) + arrowV(420, 96, 132, RD) + tag(220, 214, T('2. عمودين مش على خط واحد', '2. Two shafts out of line'), RD); }},
  {d: 5, draw(t){ return bearing(220, 108, 66, t * TAU * 3, true) + glow(220, 108, 90, .6 + .4 * Math.sin(t * 20)) + smoke(250, 40, t) + tag(220, 214, T('3. تشحيم قليل أو كتير أو غلط', '3. Too little, too much or the wrong grease'), RD); }},
  {d: 6, draw(t){
    const A = t * TAU * 2, sag = 16 + Math.sin(t * 50) * 12;
    const slack = `<path d="M110 ${115 - 34} L330 ${115 - 46} M110 ${115 + 34} Q220 ${r1(149 + sag)} 330 ${115 + 46}" fill="none" stroke="#334155" stroke-width="7"/>`;
    return slack + wheel(110, 115, 34, A) + wheel(330, 115, 46, A * .3) + tag(220, 218, T('4. سير أو جنزير مرخي أو مشدود', '4. A belt or chain too slack or too tight'), RD);
  }},
  {d: 6, draw(t){
    const c = t > .45;
    return `<rect x="150" y="40" width="140" height="150" rx="10" fill="#cbd5e1" stroke="${DK}" stroke-width="2"/><rect x="200" y="${c ? 120 : 80}" width="40" height="40" rx="4" fill="${c ? RD : GD}" stroke="${DK}"/>` +
      label(220, 70, c ? 'OFF' : 'ON', DK) + (t > .55 ? pad(270, 128, t > .7) : '') + tag(220, 220, T('قبل ما تلمس: افصل الكهربا واقفل عليها', 'Before you touch: isolate and lock off'), AC);
  }}
];

/* ---------------- lesson 2: bolts ---------------- */
function boltSide(x, y, len, sc){                                      // bolt lying horizontally: head at x, shaft to the right
  const s = sc || 1, h = 30 * s;
  let o = `<rect x="${x}" y="${y - h * .9}" width="${26 * s}" height="${h * 1.8}" rx="3" fill="${ST}" stroke="${DK}" stroke-width="1.5"/>`;
  o += `<rect x="${x + 26 * s}" y="${y - h / 2}" width="${len}" height="${h}" fill="${ST}" stroke="${DK}" stroke-width="1.5"/>`;
  for (let k = x + 26 * s + 8; k < x + 26 * s + len - 4; k += 9 * s) o += `<line x1="${r1(k)}" y1="${y - h / 2}" x2="${r1(k + 5 * s)}" y2="${y + h / 2}" stroke="${DK}" stroke-width="1.1"/>`;
  return o;
}
F.bolt_size = [
  {d: 5, draw(t){ const a = fade(t, .15, .35); return boltSide(70, 120, 260) + `<g opacity="${a}">` + arrowV(400, 100, 140, AC) + arrowV(400, 140, 100, AC) + label(400, 90, 'M12', AC) + '</g>' + tag(220, 212, T('M12 = القطر 12 mm', 'M12 = 12 mm across'), AC, a); }},
  {d: 5, draw(t){ const a = fade(t, .15, .35); return `<g transform="translate(-80 -40) scale(1.4)">` + boltSide(110, 115, 200) + '</g>' + `<g opacity="${a}">` + `<path d="M205 158 V178 M218 158 V178" stroke="${AC}" stroke-width="3"/>` + arrowH(150, 205, 172, AC, 2.6) + arrowH(273, 218, 172, AC, 2.6) + label(211, 200, '1.75', AC) + '</g>' + tag(220, 228, T('1.75 = المسافة بين سنّتين', '1.75 = the gap between two threads'), AC, a); }},
  {d: 5, draw(t){ const a = fade(t, .15, .35); return boltSide(70, 110, 260) + `<g opacity="${a}">` + `<path d="M96 150 V170 M356 150 V170" stroke="${AC}" stroke-width="3"/>` + arrowH(200, 98, 162, AC) + arrowH(250, 354, 162, AC) + label(226, 168, '50', AC) + '</g>' + tag(220, 212, T('الطول من تحت الراس', 'Length is measured under the head'), AC, a); }}
];
F.bolt_grade = [
  {d: 6, draw(t){
    const hx = (cx, txt, c) => `<polygon points="${[0, 1, 2, 3, 4, 5].map(k => r1(cx + Math.cos(k * Math.PI / 3) * 62) + ',' + r1(105 + Math.sin(k * Math.PI / 3) * 62)).join(' ')}" fill="#cbd5e1" stroke="${DK}" stroke-width="2"/><text x="${cx}" y="116" font-size="30" font-weight="700" text-anchor="middle" fill="${c}" font-family="monospace">${txt}</text>`;
    const a = fade(t, .3, .5);
    return hx(120, '8.8', DK) + hx(320, '10.9', DK) + `<g opacity="${a}">` + bar(105, 186, 30, 0, 0, OR) + label(120, 196, '800 MPa', OR) + label(320, 196, '1000 MPa', GD) + '</g>' + tag(220, 228, T('الرقم الأول × 100 = قوة الشد', 'First number × 100 = tensile strength'), AC, a);
  }},
  {d: 6, draw(t){
    const pull = ease(seg(t, .1, .6)), snap = t > .62;
    let s = `<rect x="20" y="80" width="40" height="80" fill="#64748b"/><rect x="380" y="80" width="40" height="80" fill="#64748b"/>`;
    s += snap ? boltSide(60, 120, 140) + `<g transform="translate(${r1(30 + pull * 10)} 0)">` + `<rect x="226" y="105" width="150" height="30" fill="${ST}" stroke="${DK}" stroke-width="1.5"/>` + '</g>' + mark(false, 220, 60) : boltSide(60, 120, 290 + pull * 26);
    return s + arrowH(330, 410, 200, RD) + arrowH(110, 30, 200, RD) + tag(220, 228, snap ? T('حطّيت 8.8 مكان 10.9؟ أول مسمار يتقطع', 'An 8.8 instead of a 10.9? It snaps first') : T('بنشد المسمار…', 'Pulling the bolt…'), snap ? RD : DK);
  }}
];
F.bolt_spanner = [
  {d: 7, draw(t){
    const ok = t > .5, A = ok ? -ease(seg(t, .58, .95)) * 1.1 : Math.sin(t * 34) * .12;
    const hexR = 40, F_ = hexR * Math.sqrt(3), g = ok ? F_ + 1 : F_ + 22, R = F_ / 2 + 26, cx = 200, cy = 112;
    const xl = r1(cx - Math.sqrt(R * R - g * g / 4)), dep = 6;
    const hexA = ok ? A : A * .8;
    const hx = `<polygon points="${[0, 1, 2, 3, 4, 5].map(k => r1(cx + Math.cos(k * Math.PI / 3 + hexA) * hexR) + ',' + r1(cy + Math.sin(k * Math.PI / 3 + hexA) * hexR)).join(' ')}" fill="#cbd5e1" stroke="${DK}" stroke-width="2"/>`;
    const sp = `<g transform="rotate(${r1(A * 57.3)} ${cx} ${cy})"><path d="M${xl} ${r1(cy - g / 2)} A${r1(R)} ${r1(R)} 0 1 1 ${xl} ${r1(cy + g / 2)} L${cx + dep} ${r1(cy + g / 2)} L${cx + dep} ${r1(cy - g / 2)} Z" fill="#64748b" stroke="${DK}" stroke-width="2" fill-rule="evenodd"/><rect x="${r1(cx + R - 8)}" y="${cy - 14}" width="170" height="28" rx="12" fill="#64748b" stroke="${DK}" stroke-width="2"/></g>`;
    const gapMark = ok ? '' : `<rect x="${r1(cx - 30)}" y="${r1(cy - g / 2)}" width="60" height="10" fill="${RD}" opacity=".55"/><rect x="${r1(cx - 30)}" y="${r1(cy + g / 2 - 10)}" width="60" height="10" fill="${RD}" opacity=".55"/>`;
    return sp + hx + gapMark + (ok ? mark(true, 70, 50) : mark(false, 70, 50)) + tag(220, 222, ok ? T('M12 = مفتاح 19: ماسك تمام', 'M12 = 19 mm spanner: a snug fit') : T('مفتاح واسع: بيلعب ويدوّر الراس', 'Too wide: it slips and rounds the head'), ok ? GD : RD);
  }}
];

/* ---------------- lesson 3: torque ---------------- */
function wrench(cx, cy, ang, len, click){
  return `<g transform="rotate(${r1(ang * 57.3)} ${cx} ${cy})"><circle cx="${cx}" cy="${cy}" r="36" fill="none" stroke="#64748b" stroke-width="9"/><rect x="${cx + 40}" y="${cy - 9}" width="${len}" height="18" rx="8" fill="#475569" stroke="${DK}"/><rect x="${cx + len - 50}" y="${cy - 12}" width="54" height="24" rx="10" fill="${RD}" stroke="${DK}"/>` +
    (click ? `<text x="${cx + len / 2}" y="${cy - 22}" font-size="18" font-weight="700" fill="${GD}" text-anchor="middle">${T('تِك!', 'click!')}</text>` : '') + '</g>';
}
F.torque_why = [
  {d: 6, draw(t){
    const st = ease(seg(t, .15, .6)), y0 = 70, L = 70 + st * 26;
    let z = `M300 ${y0}`; for (let k = 1; k <= 8; k++) z += ` L${k % 2 ? 318 : 282} ${r1(y0 + k * L / 8)}`;
    return `<g transform="translate(-40 0)">` + shaft(60, 200) + plates() + hexSide(180, 62, 72, 24, 0) + hexSide(180, 134, 66, 22, 0) + `<rect x="166" y="86" width="28" height="48" fill="${GD}" opacity="${r1(.15 + st * .45)}"/></g>` +
      `<path d="${z}" fill="none" stroke="${GD}" stroke-width="4" stroke-linejoin="round"/>` + `<g opacity="${fade(t, .15, .3)}">` + arrowV(360, 110, r1(70 - st * 6), GD) + arrowV(360, 120, r1(160 + st * 8), GD) + '</g>' +
      tag(300, 40, T('بيتمط زي السوستة', 'It stretches like a spring'), GD, fade(t, .2, .35)) + tag(220, 226, T('الشد ده هو اللي ماسك الوصلة', 'That stretch is what holds the joint'), AC, fade(t, .55, .7));
  }},
  {d: 7, draw(t){
    const p = t < .5 ? seg(t, 0, .45) : seg(t, .5, .95), low = t < .5;
    let s = `<g transform="translate(${low ? shake(t, true) : 0} 0)">` + shaft(60, 200) + plates() + hexSide(180, 62, 72, 24, 0) + hexSide(180, low ? 134 + ease(p) * 16 : 134, 66, 22, 0) + '</g>';
    if (!low){ s += `<path d="M166 ${r1(170 + p * 4)} h28" stroke="${RD}" stroke-width="3"/>` + (p > .6 ? mark(false, 290, 160) : ''); }
    else s += waves(t, true) + (p > .7 ? mark(false, 290, 160) : '');
    return s + tag(220, 228, low ? T('عزم قليل: الوصلة ترتخي وتفك', 'Too little: the joint works loose') : T('عزم زيادة: المسمار يتمط ويتقطع', 'Too much: the bolt stretches and snaps'), RD);
  }}
];
F.torque_table = [
  {d: 7, draw(t){
    const rows = [['M8', 25, 35], ['M10', 49, 69], ['M12', 85, 120], ['M16', 210, 295], ['M20', 410, 580]];
    let s = label(110, 36, T('المقاس', 'Size'), DK) + label(230, 36, '8.8', OR) + label(340, 36, '10.9', GD);
    rows.forEach((r, i) => { const a = fade(t, .05 + i * .14, .15 + i * .14), y = 62 + i * 30; s += `<g opacity="${a}">` + label(110, y + 6, r[0], DK) + `<rect x="170" y="${y - 10}" width="${r1(r[1] / 580 * 80 + 8)}" height="20" rx="4" fill="${OR}"/>` + `<rect x="290" y="${y - 10}" width="${r1(r[2] / 580 * 80 + 8)}" height="20" rx="4" fill="${GD}"/>` + `<text x="${r1(176 + r[1] / 580 * 80 + 10)}" y="${y + 6}" font-size="14" fill="${DK}">${r[1]}</text><text x="${r1(296 + r[2] / 580 * 80 + 10)}" y="${y + 6}" font-size="14" fill="${DK}">${r[2]}</text></g>`; });
    return s + tag(220, 222, T('N·m لمسمار ناشف، حديد', 'N·m, dry, in steel'), AC, fade(t, .8, .9));
  }}
];
F.torque_wrench = [
  {d: 8, draw(t){
    const A = -ease(seg(t, .1, .6)) * .9, click = t > .6 && t < .85, dial = Math.round(ease(seg(t, .1, .6)) * 85);
    return `<polygon points="${[0, 1, 2, 3, 4, 5].map(k => r1(120 + Math.cos(k * Math.PI / 3 + A) * 30) + ',' + r1(150 + Math.sin(k * Math.PI / 3 + A) * 30)).join(' ')}" fill="#cbd5e1" stroke="${DK}" stroke-width="2"/>` + wrench(120, 150, A, 240, click) + `<rect x="300" y="30" width="110" height="46" rx="10" fill="#0f172a"/><text x="355" y="62" font-size="24" font-weight="700" text-anchor="middle" fill="${dial >= 85 ? GD : '#e2e8f0'}" font-family="monospace">${dial} N·m</text>` + tag(220, 228, click || t > .85 ? T('أول ما يعمل «تِك» تقف: ما تكمّلش', 'Stop at the click: do not push on') : T('اضبطه على الرقم، واسحب بهدوء', 'Set the number, pull smoothly'), click || t > .85 ? GD : AC);
  }}
];
F.torque_star = [
  {d: 9, draw(t){
    const ord = [0, 4, 2, 6, 1, 5, 3, 7], k = Math.floor(seg(t, .05, .95) * 8.999);
    let s = `<circle cx="220" cy="112" r="92" fill="${P1}" stroke="${DK}" stroke-width="2"/><circle cx="220" cy="112" r="42" fill="#f1f5f9" stroke="${DK}" stroke-width="2"/>`;
    for (let i = 0; i < 8; i++){
      const a = -Math.PI / 2 + i * TAU / 8, x = r1(220 + Math.cos(a) * 68), y = r1(112 + Math.sin(a) * 68), at = ord.indexOf(i), done = at < k, now = at === k;
      s += `<circle cx="${x}" cy="${y}" r="${now ? 15 : 12}" fill="${done ? GD : now ? OR : '#e2e8f0'}" stroke="${DK}" stroke-width="1.6"/><text x="${x}" y="${r1(y + 5)}" font-size="13" font-weight="700" text-anchor="middle" fill="${DK}" font-family="monospace">${i + 1}</text>`;
    }
    if (k > 0){ const p = ord.slice(0, k + 1).map(i => { const a = -Math.PI / 2 + i * TAU / 8; return r1(220 + Math.cos(a) * 68) + ' ' + r1(112 + Math.sin(a) * 68); }); s += `<path d="M${p.join(' L')}" fill="none" stroke="${OR}" stroke-width="2" stroke-dasharray="5 4" opacity=".8"/>`; }
    return s + tag(220, 228, T('نجمة: كل مسمار والمقابل له', 'Star order: each bolt then the one opposite'), AC);
  }},
  {d: 7, draw(t){
    const st = Math.min(2, Math.floor(seg(t, .05, .95) * 3)), pct = [30, 70, 100][st];
    return [0, 1, 2].map(i => `<g opacity="${i <= st ? 1 : .3}">` + bar(70 + i * 120, 50, 60, 120, [.3, .7, 1][i], i <= st ? GD : '#94a3b8') + label(100 + i * 120, 196, ['30%', '70%', '100%'][i], DK) + '</g>').join('') + tag(220, 30, T('3 لفّات بالنجمة', 'Three rounds in star order'), AC) + tag(220, 228, T('وبعدين لفّة أخيرة على الدايرة', 'then one last pass round the circle'), AC, fade(t, .8, .9)) + label(330, 30, pct + '%', OR);
  }}
];

/* ---------------- lesson 4: keys, taper lock, axial locking ---------------- */
function hubEnd(cx, cy, R, r, ang, opt){
  const o = opt || {};
  let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${o.fill || P1}" stroke="${DK}" stroke-width="2"/>`;
  s += `<g transform="rotate(${r1(ang * 57.3)} ${cx} ${cy})"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${ST}" stroke="${DK}" stroke-width="2"/>` + (o.key ? `<rect x="${cx - r * .28}" y="${cy - r - r * .32}" width="${r1(r * .56)}" height="${r1(r * .62)}" fill="${o.key}" stroke="${DK}"/>` : '') + `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + r * .8}" stroke="${OR}" stroke-width="3"/></g>`;
  return s;
}
F.key_two = [
  {d: 5, draw(t){
    const A = t * TAU * 1.5;
    return hubEnd(220, 108, 80, 32, A, {key: OR}) + `<g transform="rotate(${r1(A * 57.3)} 220 108)"><line x1="220" y1="108" x2="220" y2="34" stroke="${DK}" stroke-width="3"/></g>` + rotArrow(220, 108, 100, false, AC) + tag(220, 224, T('1. يلف مع العمود: الخابور', '1. Turn with the shaft: the key'), AC);
  }},
  {d: 5, draw(t){
    const lock = t > .5, x = lock ? 0 : Math.sin(t * TAU * 3) * 40;
    return `<rect x="40" y="100" width="360" height="22" fill="${ST}" stroke="${DK}" stroke-width="1.5"/><g transform="translate(${r1(x)} 0)"><rect x="190" y="56" width="60" height="110" fill="${P1}" stroke="${DK}" stroke-width="2"/></g>` +
      (lock ? `<rect x="252" y="94" width="8" height="34" fill="${OR}" stroke="${DK}"/><rect x="180" y="94" width="8" height="34" fill="${OR}" stroke="${DK}"/>` + mark(true, 360, 50) : arrowH(150, 100, 40, RD) + arrowH(290, 340, 40, RD)) +
      tag(220, 224, T('2. ما يزحفش على العمود: التثبيت', '2. Stay in place: axial locking'), lock ? GD : RD);
  }}
];
F.key_size = [
  {d: 7, draw(t){
    const sz = [[20, 6], [30, 8], [40, 12], [50, 14]], k = Math.min(3, Math.floor(seg(t, 0, .99) * 4)), [d, b] = sz[k], r = d * 1.05, w = b * 1.4;
    return `<circle cx="220" cy="112" r="${r1(r)}" fill="${ST}" stroke="${DK}" stroke-width="2"/><rect x="${r1(220 - w / 2)}" y="${r1(112 - r - w * .3)}" width="${r1(w)}" height="${r1(w * .9)}" fill="${OR}" stroke="${DK}"/>` +
      `<text x="220" y="${r1(112 - r - w * .3 - 12)}" font-size="18" font-weight="700" text-anchor="middle" fill="${OR}" direction="ltr">${b} mm</text><text x="220" y="${r1(112 + r + 26)}" font-size="18" font-weight="700" text-anchor="middle" fill="${DK}" direction="ltr">⌀ ${d} mm</text>` + tag(220, 228, T('قطر العمود بيحدد عرض الخابور', 'Shaft diameter sets the key width'), AC);
  }}
];
F.key_taper = [
  {d: 8, draw(t){
    const inn = ease(seg(t, .05, .45)), tight = seg(t, .5, .9);
    let s = `<rect x="40" y="96" width="360" height="30" fill="${ST}" stroke="${DK}" stroke-width="1.5"/>`;
    s += `<path d="M${r1(150 + (1 - inn) * -120)} 70 L${r1(250 + (1 - inn) * -120)} 80 L${r1(250 + (1 - inn) * -120)} 142 L${r1(150 + (1 - inn) * -120)} 152 Z" fill="${OR}" stroke="${DK}" stroke-width="1.5"/>`;
    s += `<path d="M${r1(150 - tight * 6)} 44 L270 56 L270 166 L${r1(150 - tight * 6)} 178 Z" fill="${P1}" stroke="${DK}" stroke-width="2" opacity=".55"/>`;
    if (tight > 0) s += arrowV(200, 70, r1(70 + tight * 18), GD) + arrowV(200, 152, r1(152 - tight * 18), GD);
    return s + tag(220, 214, tight > 0 ? T('تربط المسامير: الجلبة تتزق وتقفش على العمود', 'Tighten the screws: the bush wedges onto the shaft') : T('جلبة مخروطة تدخل بين البكرة والعمود', 'A tapered bush slides between pulley and shaft'), AC);
  }}
];
F.key_axial = [
  {d: 6, draw(t){
    const c = fade(t, .1, .3), ss = fade(t, .5, .65), dn = ease(seg(t, .5, .75));
    return `<rect x="40" y="100" width="360" height="24" fill="${ST}" stroke="${DK}" stroke-width="1.5"/><rect x="170" y="60" width="60" height="104" fill="${P1}" stroke="${DK}" stroke-width="2"/>` +
      `<g opacity="${c}"><rect x="234" y="92" width="9" height="40" rx="2" fill="${OR}" stroke="${DK}"/><rect x="157" y="92" width="9" height="40" rx="2" fill="${OR}" stroke="${DK}"/></g>` + tag(300, 76, T('سيركلبس', 'Circlips'), OR, c) +
      `<g opacity="${ss}"><rect x="192" y="${r1(30 + dn * 28)}" width="16" height="32" fill="#64748b" stroke="${DK}"/></g>` + tag(110, 50, T('مسمار زنق', 'Set screw'), GD, ss) + tag(220, 222, T('يمنعوا البكرة تزحف على العمود', 'They stop the pulley sliding'), AC);
  }}
];

/* ---------------- lesson 5: couplings ---------------- */
function hubs(cx, cy, A, inner, w){                                    // two coupling hubs (side view) with something between them
  const W = w || 46;
  return `<rect x="${cx - W - 8}" y="${cy - 34}" width="${W}" height="68" rx="5" fill="${ST}" stroke="${DK}" stroke-width="1.5"/><rect x="${cx + 8}" y="${cy - 34}" width="${W}" height="68" rx="5" fill="${ST}" stroke="${DK}" stroke-width="1.5"/>` +
    spinBand(cx - W - 8, cy - 34, W, 68, A) + spinBand(cx + 8, cy - 34, W, 68, A) + (inner || '');
}
function cpl(A, inner, label_, w){ return hshaft(40, 160, 112, 22, A) + hshaft(280, 400, 112, 22, A) + hubs(220, 112, A, inner, w) + tag(220, 214, label_, AC); }
F.cpl_rigid = [
  {d: 6, draw(t){
    const A = t * TAU * 3, b = Math.sin(A) * 7;
    return `<path d="M40 112 Q120 ${r1(112 + b)} 190 112" stroke="${ST}" stroke-width="22" fill="none"/><path d="M250 ${r1(118)} Q330 ${r1(118 - b)} 400 118" stroke="${ST}" stroke-width="22" fill="none"/>` +
      `<rect x="180" y="72" width="80" height="84" rx="4" fill="#64748b" stroke="${DK}" stroke-width="2"/>` + glow(110, 112, 30, .5 + .5 * Math.sin(A)) + glow(330, 118, 30, .5 + .5 * Math.sin(A)) + mark(false, 380, 50) + tag(220, 214, T('جامد + عمودين مش على خط = العمود بيتلوي', 'Rigid + misaligned = bent shafts'), RD);
  }},
  {d: 6, draw(t){
    const A = t * TAU * 3;
    return hshaft(40, 160, 108, 22, A) + `<g transform="translate(0 8)">${hshaft(280, 400, 108, 22, A)}</g>` + `<rect x="166" y="70" width="46" height="76" rx="5" fill="${ST}" stroke="${DK}" stroke-width="1.5"/><rect x="228" y="78" width="46" height="76" rx="5" fill="${ST}" stroke="${DK}" stroke-width="1.5"/>` +
      `<path d="M212 80 Q220 ${r1(112 + Math.sin(A) * 4)} 228 150 L228 86 Q220 112 212 140Z" fill="${OR}" stroke="${DK}"/>` + mark(true, 380, 50) + tag(220, 214, T('مرن: بيستحمل الفرق الصغير ويمتص الخبط', 'Flexible: absorbs small errors and shock'), GD);
  }}
];
F.cpl_types = [
  {d: 5, draw(t){ const A = t * TAU * 3; let j = ''; for (let k = 0; k < 4; k++){ const y = 82 + k * 16; j += `<rect x="${k % 2 ? 196 : 210}" y="${y}" width="34" height="12" fill="${k % 2 ? ST : '#b0bac6'}" stroke="${DK}"/>`; } return cpl(A, j + `<rect x="212" y="80" width="16" height="64" rx="3" fill="${RD}" opacity=".85" stroke="${DK}"/>`, T('جو (عنكبوت): رخيص ومنتشر', 'Jaw (spider): cheap and common')); }},
  {d: 5, draw(t){ const A = t * TAU * 3; return cpl(A, `<path d="M212 74 C248 74 248 150 212 150 M228 74 C192 74 192 150 228 150" stroke="#1f2937" stroke-width="10" fill="none"/>`, T('كاوتش (تاير): بيستحمل ميل كبير', 'Tyre: takes large misalignment')); }},
  {d: 5, draw(t){ const A = t * TAU * 3; let g = `<rect x="176" y="70" width="88" height="84" rx="6" fill="#9aa5b1" stroke="${DK}" stroke-width="1.5"/>`; for (let x = 182; x < 262; x += 8) g += `<line x1="${x}" y1="74" x2="${x}" y2="150" stroke="${DK}" stroke-width="1"/>`; return cpl(A, g, T('تروس: عزم عالي جدًا، محتاج شحم', 'Gear: very high torque, needs grease')); }},
  {d: 5, draw(t){ const A = t * TAU * 3; let g = ''; for (let k = 0; k < 4; k++) g += `<rect x="${213 + k * 4}" y="66" width="2.4" height="92" fill="${OR}"/>`; return cpl(A, g, T('ديسك: دقيق ومن غير لعب', 'Disc: precise, no backlash')); }},
  {d: 5, draw(t){ const A = t * TAU * 3; let g = `<ellipse cx="220" cy="112" rx="50" ry="56" fill="#93c5fd" stroke="${DK}" stroke-width="1.5"/>`; for (let k = 0; k < 5; k++){ const a = A + k * TAU / 5; g += `<path d="M220 112 Q${r1(220 + Math.cos(a) * 40)} ${r1(112 + Math.sin(a) * 20)} ${r1(220 + Math.cos(a + .6) * 44)} ${r1(112 + Math.sin(a + .6) * 48)}" stroke="${BL}" stroke-width="3" fill="none"/>`; } return cpl(A, g, T('هيدروليك (زيت): بداية ناعمة', 'Fluid: soft start')); }},
  {d: 5, draw(t){ const A = t * TAU * 3; let g = ''; for (let y = 72; y < 152; y += 10) g += `<rect x="184" y="${y}" width="72" height="8" rx="4" fill="#475569"/>`; return cpl(A, g, T('جنزير: بسيط وسهل الفك', 'Chain: simple, quick to open')); }}
];
F.cpl_choose = [
  {d: 7, draw(t){
    const g = seg(t, .3, .7);
    return bar(80, 40, 40, 140, .35, OR, T('عزم الحمل', 'Load torque')) + label(160, 116, '×', DK) + `<g opacity="${fade(t, .15, .3)}">` + label(200, 116, '1.5 – 2', AC) + '</g>' + label(250, 116, '=', DK) +
      `<g opacity="${fade(t, .3, .45)}">` + bar(300, 40, 40, 140, .35 + .4 * g, GD, T('مقاس الكوبلنج', 'Coupling size')) + '</g>' + tag(220, 226, T('للحمل اللي بيخبط: معامل خدمة أكبر', 'Shock loads: bigger service factor'), AC);
  }},
  {d: 7, draw(t){
    const wear = seg(t, .1, .7), A = t * TAU * 2, sp = 16 * (1 - wear * .9);
    let s = hshaft(40, 170, 112, 22, A) + hshaft(270, 400, 112, 22, A) + `<rect x="${r1(220 - sp / 2 - 46)}" y="78" width="46" height="68" rx="5" fill="${ST}" stroke="${DK}" stroke-width="1.5"/><rect x="${r1(220 + sp / 2)}" y="78" width="46" height="68" rx="5" fill="${ST}" stroke="${DK}" stroke-width="1.5"/>` +
      `<rect x="${r1(220 - sp / 2)}" y="82" width="${r1(sp)}" height="60" fill="${RD}" opacity=".85"/>`;
    if (wear > .9) s += `<g stroke="${OR}" stroke-width="3">${[0, 1, 2, 3].map(k => `<line x1="220" y1="${70 + k * 4}" x2="${r1(206 + k * 9)}" y2="${50 - k * 3}"/>`).join('')}</g>` + mark(false, 380, 50);
    return s + tag(220, 214, wear > .9 ? T('الحديد خبط في الحديد: غيّره قبلها', 'Metal on metal: change it before this') : T('العنكبوت بيدّاب مع الوقت', 'The spider wears over time'), wear > .9 ? RD : AC);
  }}
];
F.cpl_signs = [
  {d: 5, draw(t){ const A = t * TAU * 3; return cpl(A, glow(220, 112, 60, .5 + .4 * Math.sin(t * 30)), T('سخن: غالبًا عدم محاذاة', 'Hot: usually misalignment')); }},
  {d: 5, draw(t){ const A = t * TAU * 3; let d = ''; for (let k = 0; k < 14; k++){ const p = (t * 1.2 + k / 14) % 1; d += `<circle cx="${r1(200 + (k * 37) % 40)}" cy="${r1(150 + p * 60)}" r="2.6" fill="#1f2937" opacity="${r1(1 - p)}"/>`; } return cpl(A, `<rect x="212" y="80" width="16" height="64" fill="${RD}" stroke="${DK}"/>` + d, T('بودرة كاوتش تحته: العنصر بيدّاب', 'Rubber dust below: the element is wearing')); }},
  {d: 5, draw(t){ const A = t < .3 ? 0 : (t - .3) * TAU * 4, hit = t > .3 && t < .45; return cpl(A, hit ? `<path d="M220 50 l8 18 l18 -6 l-10 16 l14 12 l-20 0 l-6 18 l-6 -18 l-20 0 l14 -12 l-10 -16 l18 6z" fill="${OR}" stroke="${RD}" stroke-width="2"/>` : '', T('خبطة عند البداية: لعب في الفكوك', 'A knock at start: play in the jaws')); }},
  {d: 5, draw(t){ const A = t * TAU * 3, x = Math.sin(t * 40) * 6; return `<g transform="translate(${r1(x)} 0)">` + cpl(A, '', '') + '</g>' + arrowH(150, 110, 60, RD) + arrowH(290, 330, 60, RD) + tag(220, 214, T('اهتزاز في اتجاه العمود: محاذاة زاوية', 'Axial vibration: angular misalignment'), AC); }},
  {d: 5, draw(t){ const A = t * TAU * 3, g = ease(seg(t, .2, .6)); return cpl(A, '', '') + `<path d="M150 ${r1(30 + (1 - g) * -80)} h140 v120 h-140z" fill="#fbbf24" opacity=".85" stroke="${DK}" stroke-width="2"/>` + `<g stroke="${DK}" stroke-width="2" opacity=".5">${[0, 1, 2, 3, 4].map(k => `<line x1="${160 + k * 30}" y1="${r1(36 + (1 - g) * -80)}" x2="${160 + k * 30}" y2="${r1(144 + (1 - g) * -80)}"/>`).join('')}</g>` + tag(220, 214, T('أي كوبلنج بيلف لازم عليه غطا', 'Every running coupling needs a guard'), AC); }}
];

/* ---------------- lesson 6: alignment ---------------- */
function twoShafts(A, dy, ang, x1){
  return `<g>${motor(30, 80, A, .9)}</g><g transform="rotate(${ang || 0} 240 112) translate(0 ${dy || 0})">${hshaft(240, 400, 112, 20, A)}<rect x="300" y="70" width="90" height="84" rx="6" fill="${GB}" stroke="${DK}" stroke-width="1.5"/></g>` + hshaft(116, 220, 109, 20, A);
}
F.align_kinds = [
  {d: 6, draw(t){ const A = t * TAU * 3, dy = ease(seg(t, .1, .5)) * 22; return twoShafts(A, dy, 0) + `<g opacity="${fade(t, .5, .65)}"><line x1="30" y1="109" x2="420" y2="109" stroke="${RD}" stroke-width="2" stroke-dasharray="6 4"/><line x1="230" y1="${r1(112 + dy)}" x2="420" y2="${r1(112 + dy)}" stroke="${RD}" stroke-width="2" stroke-dasharray="6 4"/>` + arrowV(235, 109, r1(112 + dy), RD) + '</g>' + tag(220, 214, T('موازي (أوفست): واحد أوطى من التاني', 'Parallel offset: one shaft lower'), RD); }},
  {d: 6, draw(t){ const A = t * TAU * 3, a = ease(seg(t, .1, .5)) * 7; return twoShafts(A, 0, a) + `<g opacity="${fade(t, .5, .65)}"><line x1="30" y1="109" x2="420" y2="109" stroke="${RD}" stroke-width="2" stroke-dasharray="6 4"/><path d="M300 109 A60 60 0 0 1 298 ${r1(109 + 60 * Math.sin(a / 57.3))}" stroke="${RD}" stroke-width="3" fill="none"/></g>` + tag(220, 214, T('زاوي: العمودين بيتقابلوا بزاوية', 'Angular: the shafts meet at an angle'), RD); }},
  {d: 6, draw(t){ const v = t < .5, k = seg(t, v ? 0 : .5, v ? .45 : .95); return `<rect x="60" y="150" width="320" height="30" fill="#64748b"/>` + `<g transform="translate(${v ? 0 : r1(Math.sin(k * TAU) * 20)} ${v ? r1(-Math.abs(Math.sin(k * Math.PI)) * 14) : 0})">` + motor(150, 82, 0, .9) + '</g>' + (v ? `<rect x="160" y="${r1(144 - k * 8)}" width="30" height="${r1(6 + k * 8)}" fill="${OR}"/><rect x="230" y="${r1(144 - k * 8)}" width="30" height="${r1(6 + k * 8)}" fill="${OR}"/>` : arrowH(120, 70, 120, AC) + arrowH(320, 370, 120, AC)) + tag(220, 214, v ? T('رأسي: بالشيمز تحت الرجول', 'Vertical: shims under the feet') : T('أفقي: تزق الموتور يمين وشمال', 'Horizontal: push the motor sideways'), AC); }}
];
F.align_tools = [
  {d: 6, draw(t){ const x = 160 + ease(seg(t, .1, .5)) * 0; return `<rect x="60" y="80" width="150" height="70" rx="5" fill="${ST}" stroke="${DK}" stroke-width="1.5"/><rect x="230" y="90" width="150" height="70" rx="5" fill="${ST}" stroke="${DK}" stroke-width="1.5"/>` + `<rect x="${r1(120)}" y="${r1(60 + ease(seg(t, .1, .4)) * 8)}" width="200" height="12" fill="#e2e8f0" stroke="${DK}" stroke-width="1.5"/>` + `<g opacity="${fade(t, .45, .6)}"><path d="M226 80 L232 90" stroke="${RD}" stroke-width="3"/>${label(250, 52, T('فتحة = فرق', 'gap = error'), RD)}</g>` + tag(220, 214, T('مسطرة وفيلر: للتظبيط المبدئي بس', 'Straight edge and feeler: rough setting only'), AC); }},
  {d: 7, draw(t){ const a = t * TAU, rd = Math.sin(a) * .18; return `<circle cx="220" cy="112" r="60" fill="${P1}" stroke="${DK}" stroke-width="2"/>` + `<g transform="rotate(${r1(a * 57.3)} 220 112)"><rect x="214" y="30" width="12" height="30" fill="#64748b"/><circle cx="220" cy="24" r="18" fill="#fff" stroke="${DK}" stroke-width="2"/><line x1="220" y1="24" x2="${r1(220 + Math.sin(rd * 10) * 14)}" y2="${r1(24 - Math.cos(rd * 10) * 14)}" stroke="${RD}" stroke-width="2"/></g>` + `<rect x="300" y="40" width="110" height="44" rx="8" fill="#0f172a"/><text x="355" y="70" font-size="20" font-weight="700" text-anchor="middle" fill="#e2e8f0" font-family="monospace" direction="ltr">${(rd >= 0 ? '+' : '') + rd.toFixed(2)}</text>` + tag(220, 214, T('الساعة بتلف حوالين العمود وتقرا الفرق', 'The dial goes round the shaft and reads the error'), AC); }},
  {d: 6, draw(t){ const ok = t > .6, dy = ok ? 0 : (1 - ease(seg(t, .1, .55))) * 20 + (t < .1 ? 20 : 0); return `<rect x="60" y="90" width="110" height="44" rx="6" fill="${ST}" stroke="${DK}"/><rect x="270" y="90" width="110" height="44" rx="6" fill="${ST}" stroke="${DK}"/><rect x="150" y="72" width="26" height="30" rx="4" fill="#ef4444"/><rect x="264" y="72" width="26" height="30" rx="4" fill="#475569"/>` + `<line x1="176" y1="86" x2="264" y2="${r1(86 + dy)}" stroke="${RD}" stroke-width="2.5"/><circle cx="264" cy="${r1(86 + dy)}" r="4" fill="${RD}"/>` + `<rect x="300" y="160" width="110" height="44" rx="8" fill="#0f172a"/><text x="355" y="190" font-size="18" font-weight="700" text-anchor="middle" fill="${ok ? GD : '#e2e8f0'}" font-family="monospace" direction="ltr">${(dy / 100).toFixed(3)} mm</text>` + tag(150, 214, T('الليزر: الأدق، ويحسب الشيمز', 'Laser: most precise, works out the shims'), AC); }}
];
F.align_softfoot = [
  {d: 6, draw(t){ const r = Math.sin(t * 14) * 3; return `<rect x="60" y="170" width="320" height="16" fill="#64748b"/><g transform="rotate(${r1(r)} 300 168)">` + motor(160, 92, 0, 1.1) + `<rect x="170" y="160" width="30" height="10" fill="${DK}"/><rect x="250" y="160" width="30" height="10" fill="${DK}"/></g>` + `<path d="M255 172 h20" stroke="${RD}" stroke-width="3"/>` + tag(220, 214, T('رجل طايرة: الموتور بيتهز على 3 رجول', 'Soft foot: the motor rocks on three feet'), RD); }},
  {d: 8, draw(t){ const loose = seg(t, .15, .35), sh = seg(t, .55, .75), up = loose * (1 - sh) * .12;
    return `<rect x="60" y="170" width="320" height="16" fill="#64748b"/>` + motor(160, 92 - up * 60, 0, 1.1) + `<rect x="250" y="${r1(160 - up * 60)}" width="30" height="10" fill="${DK}"/>` + `<rect x="258" y="${r1(130 - loose * 20)}" width="14" height="30" fill="#64748b" opacity="${r1(1 - loose * .6)}"/>` +
      (sh > 0 ? `<rect x="246" y="${r1(170 - sh * 4)}" width="38" height="${r1(sh * 4)}" fill="${OR}"/>` : '') + `<circle cx="330" cy="140" r="22" fill="#fff" stroke="${DK}" stroke-width="2"/><line x1="330" y1="140" x2="${r1(330 + Math.sin(up * 20) * 16)}" y2="${r1(140 - Math.cos(up * 20) * 16)}" stroke="${RD}" stroke-width="2.4"/><line x1="330" y1="162" x2="275" y2="${r1(160 - up * 60)}" stroke="${DK}" stroke-width="2"/>` +
      `<text x="330" y="106" font-size="15" font-weight="700" text-anchor="middle" fill="${up > .05 ? RD : GD}" font-family="monospace" direction="ltr">${up.toFixed(2)} mm</text>` + tag(200, 50, sh > 0 ? T('شيمز تحتها وخلاص', 'Shim it and done') : T('فك مسمارها: لو اتحركت > 0.05', 'Loosen it: moved more than 0.05?'), sh > 0 ? GD : RD); }}
];
F.align_limits = [
  {d: 7, draw(t){
    const g = (x, lab, lim) => `<rect x="${x}" y="60" width="150" height="20" rx="10" fill="#e2e8f0" stroke="${DK}"/><rect x="${x}" y="60" width="${r1(150 * lim)}" height="20" rx="10" fill="${GD}"/>` + label(x + 75, 46, lab, DK) + label(x + 75, 106, (lim * .2).toFixed(2) + ' mm', GD);
    return g(40, '1500 rpm', .5) + `<g opacity="${fade(t, .35, .5)}">` + g(240, '3000 rpm', .25) + '</g>' + tag(220, 160, T('كل ما السرعة تعلى، الحدود تضيق', 'The faster it runs, the tighter the limit'), AC, fade(t, .5, .65)) + tag(220, 214, T('صلّح الزاوية الأول، وبعدين الإزاحة', 'Fix the angle first, then the offset'), OR, fade(t, .7, .85));
  }}
];

/* ---------------- lesson 7: micrometer ---------------- */
function micro(x0, open, rot){                                          // micrometer from the side; open = gap between anvil and spindle (px)
  const gx = 96 + open, tx = 262 + open;
  let o = `<path d="M74 104 V150 Q74 174 98 174 H194 Q218 174 218 150 V112" fill="none" stroke="#475569" stroke-width="20" stroke-linecap="round"/>`;
  o += `<rect x="70" y="88" width="26" height="18" rx="2" fill="#cbd5e1" stroke="${DK}"/>`;
  o += `<rect x="${gx}" y="90" width="${r1(232 - gx)}" height="14" fill="#e2e8f0" stroke="${DK}"/>`;
  o += `<rect x="218" y="84" width="${r1(tx - 218 + 6)}" height="26" fill="#e2e8f0" stroke="${DK}" stroke-width="1.5"/><line x1="218" y1="97" x2="${tx}" y2="97" stroke="${DK}"/>`;
  for (let x = 224; x < tx; x += 6) o += `<line x1="${x}" y1="97" x2="${x}" y2="${(x - 224) % 12 ? 104 : 88}" stroke="${DK}" stroke-width="1"/>`;
  o += `<path d="M${tx} 82 L${tx + 10} 74 H${tx + 80} V120 H${tx + 10} L${tx} 112 Z" fill="#94a3b8" stroke="${DK}" stroke-width="1.5"/>`;
  for (let k = 0; k < 7; k++){ const a = rot + k * .45, y = 97 + Math.sin(a) * 20; if (Math.cos(a) > 0) o += `<line x1="${tx + 2}" y1="${r1(y)}" x2="${tx + 12}" y2="${r1(y)}" stroke="${DK}"/>`; }
  o += `<rect x="${tx + 80}" y="84" width="30" height="26" rx="4" fill="#64748b" stroke="${DK}"/>`;
  return o;
}
F.mic_parts = [
  {d: 9, draw(t){
    const op = 14 + Math.sin(t * TAU) * 10, tx = 262 + op;
    const parts = [[82, 66, T('السندان', 'Anvil'), 82, 86], [160, 66, T('العمود', 'Spindle'), 160, 89], [240, 146, T('الجلبة', 'Sleeve'), 240, 112], [r1(tx + 44), 56, T('الطنبورة', 'Thimble'), r1(tx + 44), 72], [r1(tx + 95), 146, T('السقّاطة', 'Ratchet'), r1(tx + 95), 112], [146, 210, T('الإطار', 'Frame'), 146, 186]];
    let s = micro(0, op, t * TAU * 2);
    parts.forEach((p, i) => { const a = seg(t, .05 + i * .14, .15 + i * .14); s += `<g opacity="${r1(a)}"><line x1="${p[0]}" y1="${p[1] + (p[1] < 100 ? 4 : -16)}" x2="${p[3]}" y2="${p[4]}" stroke="${i % 2 ? OR : AC}" stroke-width="2"/></g>` + tag(p[0], p[1], p[2], i % 2 ? OR : AC, a); });
    return s;
  }}
];
function sleeveZoom(edge, half){                                      // big sleeve scale: edge = thimble edge x
  let s = `<rect x="30" y="70" width="380" height="70" fill="#e2e8f0" stroke="${DK}" stroke-width="1.5"/><line x1="30" y1="105" x2="410" y2="105" stroke="${DK}" stroke-width="2"/>`;
  for (let k = 0; k <= 9; k++){ const x = 50 + k * 40; s += `<line x1="${x}" y1="105" x2="${x}" y2="${k % 5 ? 82 : 76}" stroke="${DK}" stroke-width="2"/>`; if (k % 5 === 0) s += `<text x="${x}" y="68" font-size="16" font-weight="700" text-anchor="middle" fill="${DK}" font-family="monospace">${k}</text>`; if (k < 9) s += `<line x1="${x + 20}" y1="105" x2="${x + 20}" y2="126" stroke="${half ? RD : DK}" stroke-width="2"/>`; }
  s += `<rect x="${r1(edge)}" y="52" width="${r1(430 - edge)}" height="106" rx="6" fill="#94a3b8" stroke="${DK}" stroke-width="2"/>`;
  return s;
}
F.mic_sleeve = [
  {d: 7, draw(t){ const e = 60 + ease(seg(t, .05, .6)) * 280 + 2; const n = Math.floor((e - 52) / 40); return sleeveZoom(e, false) + tag(220, 194, T('فوق الخط: كل شَرطة بملّي', 'Above the line: each mark is 1 mm'), AC) + `<text x="370" y="40" font-size="22" font-weight="700" text-anchor="middle" fill="${AC}" font-family="monospace" direction="ltr">${Math.max(0, n)} mm</text>`; }},
  {d: 7, draw(t){ const e = 50 + 7 * 40 + 8 + (t > .5 ? 22 : 0); return sleeveZoom(e, true) + tag(220, 194, T('تحت الخط: شَرطة النص، لو باينة زوّد نص ملّي', 'Below: the half mark, if showing add half a mm'), RD) + `<text x="370" y="40" font-size="22" font-weight="700" text-anchor="middle" fill="${t > .5 ? RD : AC}" font-family="monospace" direction="ltr">${t > .5 ? '7.5' : '7'} mm</text>`; }}
];
F.mic_thimble = [
  {d: 9, draw(t){
    const v = Math.floor(ease(seg(t, .05, .8)) * 37), rot = v / 50;
    let s = `<rect x="40" y="78" width="200" height="54" fill="#e2e8f0" stroke="${DK}" stroke-width="1.5"/><line x1="40" y1="105" x2="250" y2="105" stroke="${RD}" stroke-width="2.5"/>`;
    s += `<rect x="240" y="40" width="120" height="130" rx="8" fill="#94a3b8" stroke="${DK}" stroke-width="2"/>`;
    for (let k = -6; k <= 6; k++){ const val = ((v + k) % 50 + 50) % 50, y = 105 - k * 9; if (y < 44 || y > 166) continue; s += `<line x1="240" y1="${y}" x2="${val % 5 ? 256 : 264}" y2="${y}" stroke="${DK}" stroke-width="${val % 5 ? 1.4 : 2.2}"/>`; if (val % 5 === 0) s += `<text x="270" y="${y + 5}" font-size="14" font-weight="700" fill="${DK}" font-family="monospace">${val}</text>`; }
    s += `<text x="390" y="114" font-size="22" font-weight="700" text-anchor="middle" fill="${AC}" font-family="monospace" direction="ltr">${v}</text>`;
    return s + tag(220, 214, T('50 شَرطة · كل شَرطة = 0.01 mm', '50 marks · each = 0.01 mm'), AC) + tag(140, 60, T('اقرا اللي على الخط', 'Read the one on the line'), RD, fade(t, .8, .9));
  }}
];
F.mic_read = [
  {d: 10, draw(t){
    const a = fade(t, .05, .2), b = fade(t, .3, .45), c = fade(t, .55, .7), d = fade(t, .8, .9);
    const row = (y, txt, v, col, al) => `<g opacity="${al}"><text x="70" y="${y}" font-size="18" font-weight="700" fill="${col}">${txt}</text><text x="380" y="${y}" font-size="24" font-weight="700" text-anchor="end" fill="${col}" font-family="monospace" direction="ltr">${v}</text></g>`;
    return row(56, T('1. الملّي من فوق', '1. Whole mm above'), '7.00', AC, a) + row(96, T('2. نص الملّي باين؟', '2. Half mark showing?'), '+ 0.50', RD, b) + row(136, T('3. الطنبورة 23 × 0.01', '3. Thimble 23 × 0.01'), '+ 0.23', OR, c) +
      `<g opacity="${d}"><line x1="230" y1="152" x2="390" y2="152" stroke="${DK}" stroke-width="2"/><text x="380" y="190" font-size="30" font-weight="700" text-anchor="end" fill="${GD}" font-family="monospace" direction="ltr">7.73 mm</text></g>`;
  }},
  {d: 7, draw(t){
    const c = ease(seg(t, .05, .5)), op = (1 - c) * 24, click = t > .5 && t < .7;
    return micro(0, op, t * TAU * 3) + (click ? `<text x="${r1(262 + op + 95)}" y="70" font-size="18" font-weight="700" text-anchor="middle" fill="${GD}">${T('تِك تِك', 'click click')}</text>` : '') +
      `<rect x="300" y="150" width="110" height="44" rx="8" fill="#0f172a"/><text x="355" y="180" font-size="20" font-weight="700" text-anchor="middle" fill="${t > .55 ? GD : '#e2e8f0'}" font-family="monospace" direction="ltr">${(op / 100 * 2).toFixed(2)}</text>` +
      tag(150, 222, T('اقفله على الفاضي: لازم يقرا صفر', 'Close it empty: it must read zero'), AC);
  }}
];

/* ---------------- lesson 8: bearing types and numbers ---------------- */
function brgSec(cx, cy, kind, A){                                       // half cross-section of a bearing (above the shaft)
  let s = `<rect x="${cx - 46}" y="${cy - 60}" width="92" height="16" fill="${P2}" stroke="${DK}" stroke-width="1.5"/><rect x="${cx - 46}" y="${cy - 14}" width="92" height="16" fill="${P2}" stroke="${DK}" stroke-width="1.5"/>`;
  if (kind === 'ball') s += `<circle cx="${cx}" cy="${cy - 29}" r="15" fill="${ST}" stroke="${DK}" stroke-width="1.5"/>`;
  if (kind === 'roller') s += `<rect x="${cx - 22}" y="${cy - 44}" width="44" height="30" rx="4" fill="${ST}" stroke="${DK}" stroke-width="1.5"/>`;
  if (kind === 'taper') s += `<path d="M${cx - 22} ${cy - 46} L${cx + 22} ${cy - 38} L${cx + 22} ${cy - 18} L${cx - 22} ${cy - 12}Z" fill="${ST}" stroke="${DK}" stroke-width="1.5"/>`;
  if (kind === 'sph') s += `<ellipse cx="${cx - 18}" cy="${cy - 29}" rx="15" ry="13" fill="${ST}" stroke="${DK}" transform="rotate(-12 ${cx - 18} ${cy - 29})"/><ellipse cx="${cx + 18}" cy="${cy - 29}" rx="15" ry="13" fill="${ST}" stroke="${DK}" transform="rotate(12 ${cx + 18} ${cy - 29})"/>`;
  if (kind === 'ang') s += `<circle cx="${cx}" cy="${cy - 29}" r="15" fill="${ST}" stroke="${DK}" stroke-width="1.5"/><line x1="${cx - 18}" y1="${cy - 50}" x2="${cx + 18}" y2="${cy - 8}" stroke="${RD}" stroke-dasharray="4 3" stroke-width="2"/>`;
  return s + `<rect x="${cx - 70}" y="${cy + 2}" width="140" height="16" fill="${ST}" stroke="${DK}"/>`;
}
const brgScene = (kind, txt, rad, ax) => ({d: 5, draw(t){
  const p = .5 + .5 * Math.sin(t * TAU * 2);
  return `<g transform="translate(220 150) scale(1.7) translate(-220 -150)">` + brgSec(220, 150, kind, t) + '</g>' + (rad ? arrowV(220, 12, r1(40 + p * 4), RD) : '') + (ax ? arrowH(50, r1(132 + p * 4), 104, BL) : '') + tag(220, 220, txt, AC) + (rad ? tag(270, 30, T('قطري', 'radial'), RD) : '') + (ax ? tag(80, 90, T('محوري', 'axial'), BL) : '');
}});
F.brg_types = [
  brgScene('ball', T('بلي عادي 6xxx: الأشهر', 'Deep groove 6xxx: the most common'), 1, 1),
  brgScene('roller', T('رولر أسطواني NU: حمل قطري تقيل', 'Cylindrical roller NU: heavy radial load'), 1, 0),
  brgScene('taper', T('مخروطي 3xxxx: قطري + محوري', 'Taper roller 3xxxx: radial + axial'), 1, 1),
  brgScene('sph', T('كروي مزدوج 22xxx: بيستحمل ميل', 'Spherical 22xxx: takes misalignment'), 1, 0),
  brgScene('ang', T('زاوي 7xxx: حمل محوري عالي', 'Angular contact 7xxx: high axial load'), 0, 1)
];
F.brg_code = [
  {d: 10, draw(t){
    const st = Math.min(3, Math.floor(seg(t, .05, .95) * 4)), dig = ['6', '2', '0', '5'], col = [AC, OR, RD, RD];
    let s = '';
    dig.forEach((d, i) => { const on = i === st || (st === 3 && i >= 2) || (st === 2 && i >= 2); s += `<text x="${130 + i * 46}" y="84" font-size="56" font-weight="700" text-anchor="middle" fill="${on ? col[i] : '#94a3b8'}" font-family="monospace">${d}</text>`; });
    const msg = [T('6 = بلي عادي', '6 = deep groove ball'), T('2 = سلسلة خفيفة', '2 = light series'), T('05 × 5 = 25 mm', '05 × 5 = 25 mm'), T('القطر الداخلي 25 mm', 'Bore 25 mm')][st];
    s += tag(220, 130, msg, col[Math.min(st, 2)]);
    if (st >= 2){ const r = 34 * seg(t, .55, .75); s += `<circle cx="220" cy="180" r="44" fill="${P1}" stroke="${DK}" stroke-width="2"/><circle cx="220" cy="180" r="${r1(Math.max(8, r * .75))}" fill="#fff" stroke="${RD}" stroke-width="2"/>`; }
    return s;
  }}
];
F.brg_suffix = [
  {d: 5, draw(t){ return `<g transform="translate(220 150) scale(1.7) translate(-220 -160)">` + brgSec(220, 160, 'ball') + `<rect x="170" y="102" width="8" height="44" fill="${RD}"/><rect x="262" y="102" width="8" height="44" fill="${RD}"/></g>` + tag(370, 60, '2RS', RD) + tag(220, 222, T('جلدتين كاوتش: قافل من التراب والمية', 'Two rubber seals: shut against dust and water'), AC); }},
  {d: 5, draw(t){ return `<g transform="translate(220 150) scale(1.7) translate(-220 -160)">` + brgSec(220, 160, 'ball') + `<rect x="170" y="102" width="5" height="44" fill="#64748b"/><rect x="265" y="102" width="5" height="44" fill="#64748b"/></g>` + tag(370, 60, 'ZZ', DK) + tag(220, 222, T('غطاين حديد', 'Two metal shields'), AC); }},
  {d: 6, draw(t){ const g = ease(seg(t, .1, .6)) * 6; return `<g transform="translate(220 130) scale(1.7) translate(-220 -130)">` + `<rect x="174" y="${r1(100 - g)}" width="92" height="16" fill="${P2}" stroke="${DK}" stroke-width="1.5"/><circle cx="220" cy="131" r="15" fill="${ST}" stroke="${DK}"/><rect x="174" y="146" width="92" height="16" fill="${P2}" stroke="${DK}"/></g>` + `<g opacity="${fade(t, .5, .6)}">` + arrowV(330, 60, r1(60 - g * 1.7 - 4), RD) + '</g>' + tag(370, 60, 'C3', OR) + tag(220, 222, T('خلوص أكبر: للموتورات السخنة', 'More clearance: for hot motors'), AC); }}
];
})();
