/* كورس أساسيات الميكانيكا: every lesson section is a short animated film (scene by scene, one short line each).
   Each film is a list of scenes {d: seconds, draw(t)} where t runs 0→1; draw returns SVG for viewBox "10 10 420 222".
   Needs /mfit-lab/mfit-sims.js (MF.film engine + MF.K basic parts). Generated parts kit is shared with mfit-films.js. */
(function(){
'use strict';
const F = MF.FILMS, T = IL.T;
const {mark, arrowV, label, seg, ease, cl, C} = MF.K;
const {ST, DK, P1, P2, AC, BL, RD, GD} = C;
const OR = '#f59e0b', MO = '#3b6ea5', GB = '#5f7f5a', DR = '#8a96a6', PU = '#8b5cf6';
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

const K2 = MF.K2;
/* ---------- physics parts ---------- */
const L = (x, y, s, c, a, fs) => `<text x="${r1(x)}" y="${r1(y)}" font-size="${fs || 17}" font-weight="700" fill="${c || DK}" text-anchor="${a || 'middle'}">${s}</text>`;
const op = (a, s) => a <= 0 ? '' : a >= 1 ? s : `<g opacity="${r1(a)}">${s}</g>`;
function vec(x0, y0, x1, y1, c, w){                                   // arrow in any direction
  const dx = x1 - x0, dy = y1 - y0, n = Math.hypot(dx, dy);
  if (n < 4) return '';
  const ux = dx / n, uy = dy / n, h = Math.min(10, n * .6), bx = x1 - ux * h, by = y1 - uy * h, ww = w || 3.4;
  return `<path d="M${r1(x0)} ${r1(y0)} L${r1(x1 - ux * h * .6)} ${r1(y1 - uy * h * .6)}" stroke="${c}" stroke-width="${ww}" stroke-linecap="round"/>` +
    `<path d="M${r1(bx - uy * 7)} ${r1(by + ux * 7)} L${r1(x1)} ${r1(y1)} L${r1(bx + uy * 7)} ${r1(by - ux * 7)}Z" fill="${c}"/>`;
}
const ground = (y, x0, x1) => `<rect x="${x0 || 10}" y="${y}" width="${(x1 || 430) - (x0 || 10)}" height="${232 - y}" fill="#d6dee8"/><line x1="${x0 || 10}" y1="${y}" x2="${x1 || 430}" y2="${y}" stroke="${DK}" stroke-width="2"/>`;
function car(x, yG, ang, col, flip){                                   // side view, 100 wide, front to the right
  const wh = cx => { let o = `<circle cx="${r1(cx)}" cy="${yG - 12}" r="12" fill="#1f2937"/><circle cx="${r1(cx)}" cy="${yG - 12}" r="6" fill="#cbd5e1"/>`;
    for (let k = 0; k < 3; k++){ const a = ang + k * TAU / 3; o += `<line x1="${r1(cx)}" y1="${yG - 12}" x2="${r1(cx + Math.cos(a) * 6)}" y2="${r1(yG - 12 + Math.sin(a) * 6)}" stroke="#1f2937" stroke-width="2"/>`; }
    return o; };
  const g = `<path d="M${x} ${yG - 14} v-18 q0 -6 6 -6 h18 l14 -16 h36 l16 16 h4 q6 0 6 6 v18 Z" fill="${col || BL}" stroke="${DK}" stroke-width="1.5"/>
    <path d="M${x + 28} ${yG - 39} l11 -12 h14 v12 Z M${x + 58} ${yG - 39} v-12 h13 l11 12 Z" fill="#dbeafe"/>
    <rect x="${x + 94}" y="${yG - 30}" width="6" height="5" fill="#fde68a"/>` + wh(x + 24) + wh(x + 78);
  return flip ? `<g transform="translate(${2 * x + 100} 0) scale(-1 1)">${g}</g>` : g;
}
function box(x, yG, w, h, col, txt, tc){
  return `<rect x="${r1(x)}" y="${r1(yG - h)}" width="${w}" height="${h}" rx="3" fill="${col || '#d6a86a'}" stroke="${DK}" stroke-width="1.5"/>` +
    (txt ? L(x + w / 2, yG - h / 2 + 6, txt, tc || '#3b2a14', 'middle', h < 30 ? 13 : 16) : '');
}
const ball = (cx, cy, r, c) => `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="${c || OR}" stroke="${DK}" stroke-width="1.4"/><circle cx="${r1(cx - r * .35)}" cy="${r1(cy - r * .35)}" r="${r1(r * .28)}" fill="#fff" opacity=".55"/>`;
function stick(x, yG, o){                                             // person; o = {lean deg, arm:[x,y] or 'up'|'down', c}
  const p = o || {}, c = p.c || '#334155', hy = yG - 82;
  const arm = p.arm === 'up' ? [x + 4, hy - 16] : Array.isArray(p.arm) ? p.arm : [x + 10, yG - 36];
  const s = `<circle cx="${x}" cy="${hy}" r="10" fill="#f1c6a0" stroke="${c}" stroke-width="2"/>
    <path d="M${x} ${hy + 10} V${yG - 34} M${x} ${yG - 34} L${x - 10} ${yG} M${x} ${yG - 34} L${x + 10} ${yG}" stroke="${c}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M${x} ${hy + 22} L${r1(arm[0])} ${r1(arm[1])}" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
  return p.lean ? `<g transform="rotate(${r1(p.lean)} ${x} ${yG})">${s}</g>` : s;
}
function watch(cx, cy, r, frac, txt){                                 // stopwatch
  const a = frac * TAU - Math.PI / 2;
  return `<rect x="${cx - 5}" y="${cy - r - 9}" width="10" height="8" rx="2" fill="${DK}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${DK}" stroke-width="2.5"/>
    <path d="M${cx} ${cy} L${r1(cx + Math.cos(a) * r * .8)} ${r1(cy + Math.sin(a) * r * .8)}" stroke="${RD}" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="3" fill="${DK}"/>` +
    (txt ? L(cx, cy + r + 20, txt, DK, 'middle', 15) : '');
}
function axes(x, y, w, h, xl, yl){                                     // graph frame; origin at (x, y+h)
  return `<path d="M${x} ${y + h} H${x + w}" stroke="${DK}" stroke-width="2"/><path d="M${x + w - 8} ${y + h - 5} L${x + w} ${y + h} L${x + w - 8} ${y + h + 5}" fill="none" stroke="${DK}" stroke-width="2"/>
    <path d="M${x} ${y + h} V${y}" stroke="${DK}" stroke-width="2"/><path d="M${x - 5} ${y + 8} L${x} ${y} L${x + 5} ${y + 8}" fill="none" stroke="${DK}" stroke-width="2"/>` +
    (xl ? L(x + w - 4, y + h + 20, xl, DK, 'end', 14) : '') + (yl ? L(x + 8, y + 2, yl, DK, 'start', 14) : '');
}
const poly = (pts, c, w, dash) => pts.length < 2 ? '' : `<path d="M${pts.map(p => r1(p[0]) + ' ' + r1(p[1])).join(' L')}" fill="none" stroke="${c}" stroke-width="${w || 3}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const card = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#fff" stroke="${c || DK}" stroke-width="2"/>`;
function big(x, y, s, c, fs){ return L(x, y, s, c || DK, 'middle', fs || 26); }
function hammer(cx, cy, ang){ return `<g transform="rotate(${r1(ang || 0)} ${r1(cx)} ${r1(cy)})"><rect x="${r1(cx - 3)}" y="${r1(cy - 4)}" width="6" height="38" rx="2" fill="#a16207" stroke="${DK}"/><rect x="${r1(cx - 15)}" y="${r1(cy - 14)}" width="30" height="12" rx="2" fill="#64748b" stroke="${DK}" stroke-width="1.4"/></g>`; }
function feather(cx, cy, ang){ return `<g transform="rotate(${r1(ang || 0)} ${r1(cx)} ${r1(cy)})"><path d="M${r1(cx)} ${r1(cy - 22)} C${r1(cx + 12)} ${r1(cy - 10)} ${r1(cx + 10)} ${r1(cy + 10)} ${r1(cx)} ${r1(cy + 20)} C${r1(cx - 10)} ${r1(cy + 10)} ${r1(cx - 12)} ${r1(cy - 10)} ${r1(cx)} ${r1(cy - 22)}Z" fill="#e2e8f0" stroke="${DK}" stroke-width="1.2"/><path d="M${r1(cx)} ${r1(cy - 20)} V${r1(cy + 28)}" stroke="${DK}" stroke-width="1.4"/></g>`; }
function kg(cx, yG, txt, s){                                           // weight block (trapezoid with handle)
  const k = s || 1;
  return `<path d="M${r1(cx - 22 * k)} ${yG} L${r1(cx - 15 * k)} ${r1(yG - 34 * k)} H${r1(cx + 15 * k)} L${r1(cx + 22 * k)} ${yG} Z" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M${r1(cx - 8 * k)} ${r1(yG - 34 * k)} v${r1(-8 * k)} h${r1(16 * k)} v${r1(8 * k)}" fill="none" stroke="#1e293b" stroke-width="${r1(3 * k)}"/>` + (txt ? L(cx, yG - 11 * k, txt, '#fff', 'middle', r1(13 * k)) : '');
}
const spark = (x, y, a) => a > 0 ? `<g stroke="${OR}" stroke-width="3" stroke-linecap="round" opacity="${r1(a)}"><path d="M${x - 14} ${y} h-8 M${x + 14} ${y} h8 M${x} ${y - 14} v-8 M${x - 10} ${y - 10} l-6 -6 M${x + 10} ${y - 10} l6 -6"/></g>` : '';
function stars(){ let o = ''; [[40, 40], [90, 70], [150, 30], [300, 50], [380, 80], [410, 30], [250, 90], [60, 160], [400, 170]].forEach(([x, y]) => { o += `<circle cx="${x}" cy="${y}" r="1.8" fill="#fde68a"/>`; }); return o; }

/* ================= lesson 1 · units, mass vs weight, vectors ================= */
F.ph_intro = [
  {d: 4, draw(t){ const p = ease(seg(t, .05, .95)), x = 20 + p * 250;
    return ground(196) + `<g opacity=".35">${[0, 1, 2].map(k => `<path d="M${r1(x - 12 - k * 4)} ${158 + k * 12} h-${22 + k * 6}" stroke="${DK}" stroke-width="2.5" stroke-linecap="round"/>`).join('')}</g>` +
      car(x, 196, p * 30, BL) + vec(x + 104, 120, x + 150, 120, AC) + L(x + 128, 108, 'v', AC); }},
  {d: 4, draw(t){ const p = ease(seg(t, .25, .95)), bx = 190 + p * 110;
    return ground(196) + box(bx, 196, 70, 60, '#d6a86a') + stick(bx - 26, 196, {lean: 14, arm: [bx + 4, 152]}) + op(seg(t, .1, .25), vec(bx + 74, 166, bx + 120, 166, RD) + L(bx + 97, 154, 'F', RD)); }},
  {d: 4, draw(t){ const p = seg(t, .05, .8), y = 40 + p * p * 138;
    return ground(196, 10, 290) + `<line x1="110" y1="40" x2="110" y2="196" stroke="${DK}" stroke-dasharray="3 5"/>` + ball(140, y, 16) +
      K2.bar(320, 60, 34, 120, 1 - p * p, GD, 'PE') + K2.bar(378, 60, 34, 120, p * p, OR, 'KE'); }},
  {d: 5, draw(t){ const p = ease(seg(t, .1, .7)), d2 = 60 + p * 60, a = -12 * (1 - p);
    const g = `<g transform="rotate(${r1(a)} 220 156)"><rect x="70" y="150" width="300" height="8" rx="3" fill="#a16207" stroke="${DK}"/>` +
      box(220 - 60 - 24, 150, 48, 48, '#94a3b8', '2m', '#1e293b') + box(220 + d2 - 17, 150, 34, 34, OR, 'm', '#1e293b') + '</g>';
    return ground(196) + `<path d="M220 158 L196 196 H244 Z" fill="${DK}"/>` + g + (p > .99 ? mark(true, 380, 70) : ''); }}
];
F.ph_units = [
  {d: 6, draw(t){
    const a = seg(t, 0, .12), b = seg(t, .3, .42), c = seg(t, .6, .72);
    let ru = `<rect x="30" y="104" width="120" height="24" rx="3" fill="#fde68a" stroke="${DK}" stroke-width="1.5"/>`;
    for (let k = 0; k <= 10; k++) ru += `<line x1="${36 + k * 10.8}" y1="104" x2="${36 + k * 10.8}" y2="${k % 5 ? 112 : 118}" stroke="${DK}" stroke-width="1.4"/>`;
    return op(a, ru + big(90, 84, '1 m', BL) + L(90, 160, T('الطول', 'Length'), DK)) +
      op(b, kg(220, 140, 'kg', 1.1) + big(220, 74, '1 kg', BL) + L(220, 160, T('الكتلة', 'Mass'), DK)) +
      op(c, watch(350, 108, 26, t * 3) + big(350, 64, '1 s', BL) + L(350, 160, T('الزمن', 'Time'), DK)) +
      op(seg(t, .85, .95), L(220, 210, 'm · kg · s', AC, 'middle', 20)); }},
  {d: 6, draw(t){
    const u = ['km', 'm', 'cm', 'mm'], k = ['×1000', '×100', '×10'], xs = [60, 170, 280, 390];
    let o = '';
    u.forEach((s, i) => { const on = seg(t, i * .22, i * .22 + .1); o += `<rect x="${xs[i] - 40}" y="90" width="80" height="54" rx="12" fill="${on > .5 ? '#ccfbf1' : '#fff'}" stroke="${on > .5 ? AC : DK}" stroke-width="2.5"/>` + big(xs[i], 127, s, DK); });
    k.forEach((s, i) => { const a = seg(t, i * .22 + .1, i * .22 + .2); o += op(a, vec(xs[i] + 42, 117, xs[i + 1] - 42, 117, AC, 3) + L((xs[i] + xs[i + 1]) / 2, 82, s, AC, 'middle', 15)); });
    return o + op(seg(t, .75, .9), L(220, 196, '1 km = 1000 m = 100000 cm', BL, 'middle', 18)); }},
  {d: 7, draw(t){ const p = ease(seg(t, 0, 1)), x = 10 + p * 320, b = seg(t, .4, .55);
    return ground(206) + car(x, 206, p * 40, BL) + card(26, 40, 120, 60, BL) + big(86, 80, '20 m/s', BL, 22) +
      op(b, vec(156, 70, 262, 70, AC, 3.4) + L(209, 58, '× 3.6', AC, 'middle', 19) + card(270, 40, 140, 60, GD) + big(340, 80, '72 km/h', GD, 22)) +
      op(seg(t, .7, .85), L(209, 144, '÷ 3.6', RD, 'middle', 17) + vec(262, 120, 156, 120, RD, 2.4)); }}
];
function place(cx, kind){                                            // one of three panels: earth / moon / space
  let o = `<rect x="${cx - 66}" y="22" width="132" height="200" rx="12" fill="${kind === 'space' ? '#0f172a' : '#e0f2fe'}" stroke="${DK}" stroke-width="1.4"/>`;
  if (kind === 'earth') o += `<rect x="${cx - 66}" y="168" width="132" height="54" rx="0" fill="#65a30d"/><circle cx="${cx + 42}" cy="46" r="13" fill="#38bdf8" stroke="#0369a1"/>`;
  if (kind === 'moon') o += `<rect x="${cx - 66}" y="168" width="132" height="54" fill="#9ca3af"/><circle cx="${cx - 30}" cy="190" r="6" fill="#6b7280"/><circle cx="${cx + 28}" cy="200" r="4" fill="#6b7280"/>`;
  if (kind === 'space') [[-40, 40], [30, 60], [44, 150], [-48, 170], [10, 200], [-10, 34]].forEach(([dx, dy]) => { o += `<circle cx="${cx + dx}" cy="${dy}" r="1.8" fill="#fde68a"/>`; });
  return o;
}
const PL = [[80, 'earth', 'الأرض', 'Earth', 686], [220, 'moon', 'القمر', 'Moon', 113], [360, 'space', 'الفضاء', 'Space', 0]];
F.ph_mass = [
  {d: 6, draw(t){ let o = '';
    PL.forEach(([cx, k, ar, en], i) => { const a = seg(t, i * .25, i * .25 + .12), fl = k === 'space' ? Math.sin(t * 9) * 5 - 40 : 0;
      o += op(a, place(cx, k) + kg(cx, 168 + fl, '70 kg', 1.3) + L(cx, 44, T(ar, en), k === 'space' ? '#fff' : DK, 'middle', 15)); });
    return o + op(seg(t, .8, .92), big(150, 130, '=', GD, 30) + big(290, 130, '=', GD, 30)); }},
  {d: 7, draw(t){ let o = ''; const g = ease(seg(t, .2, .6));
    PL.forEach(([cx, k, ar, en, w]) => { const fl = k === 'space' ? Math.sin(t * 9) * 5 - 40 : 0, len = w / 686 * 60 * g;
      o += place(cx, k) + (k !== 'space' ? `<rect x="${cx - 30}" y="160" width="60" height="8" rx="2" fill="#475569"/>` : '') + kg(cx, 160 + fl, '70 kg', 1.1) +
        (len > 4 ? vec(cx + 40, 120, cx + 40, 120 + len, RD) : '') + op(seg(t, .55, .7), L(cx, 76, w + ' N', k === 'space' ? '#fca5a5' : RD, 'middle', 19)); });
    return o; }},
  {d: 6, draw(t){
    return kg(90, 170, '70 kg', 1.6) + vec(90, 176, 90, 222, RD) + L(112, 214, 'W', RD, 'start') +
      op(seg(t, 0, .2), big(290, 80, 'W = m · g', BL, 30)) + op(seg(t, .35, .55), L(290, 130, '70 × 9.8', DK, 'middle', 22)) + op(seg(t, .6, .78), big(290, 176, '= 686 N', RD, 30)); }}
];
F.ph_vector = [
  {d: 7, draw(t){ const a = seg(t, .05, .4), b = ease(seg(t, .5, .85));
    let o = `<line x1="220" y1="20" x2="220" y2="220" stroke="${P1}" stroke-width="2"/>`;
    o += `<circle cx="110" cy="130" r="6" fill="${DK}"/>` + op(a, `<circle cx="110" cy="130" r="${r1(64 * a)}" fill="none" stroke="${OR}" stroke-width="3" stroke-dasharray="6 6"/>` + L(110, 40, '5 km', OR, 'middle', 22) + L(110, 220, '?', OR, 'middle', 22));
    o += `<circle cx="330" cy="190" r="6" fill="${DK}"/>` + (b > 0 ? vec(330, 190, 330, 190 - 130 * b, AC, 4) : '') + op(seg(t, .8, .95), L(330, 40, '5 km ↑', AC, 'middle', 22) + mark(true, 390, 120));
    return o; }},
  {d: 5, draw(t){ const m = ease(seg(t, .45, .7)), mv = ease(seg(t, .7, 1)) * 40;
    let o = ground(196) + box(250 + mv, 196, 60, 50, '#d6a86a');
    if (m < 1) o += op(1 - m, vec(110 + mv, 150, 170 + mv, 150, BL) + L(140 + mv, 140, '3 N', BL, 'middle', 15) + vec(170 + mv, 150, 245 + mv, 150, OR) + L(207 + mv, 140, '4 N', OR, 'middle', 15));
    if (m > 0) o += op(m, vec(110 + mv, 176, 245 + mv, 176, GD, 5) + L(178 + mv, 210 - 46, '7 N', GD, 'middle', 19));
    return o + op(seg(t, .6, .75), L(220, 60, '3 + 4 = 7 N', GD, 'middle', 22)); }},
  {d: 5, draw(t){ const m = ease(seg(t, .45, .7)), mv = ease(seg(t, .7, 1)) * 14;
    let o = ground(196) + box(190 + mv, 196, 60, 50, '#d6a86a');
    o += op(1 - m * .7, vec(110 + mv, 160, 186 + mv, 160, OR) + L(148 + mv, 150, '4 N', OR, 'middle', 15) + vec(330 + mv, 160, 254 + mv, 160, BL) + L(292 + mv, 150, '3 N', BL, 'middle', 15));
    if (m > 0) o += op(m, vec(254 + mv, 128, 274 + mv, 128, GD, 5) + L(264 + mv, 118, '1 N', GD, 'middle', 17));
    return o + op(seg(t, .6, .75), L(220, 60, '4 − 3 = 1 N', GD, 'middle', 22)); }},
  {d: 7, draw(t){ const a = ease(seg(t, 0, .25)), b = ease(seg(t, .25, .5)), c = ease(seg(t, .55, .8));
    const O = [90, 190], X = [90 + 160 * a, 190], Y = [250, 190 - 120 * b];
    let o = `<g stroke="${P1}" stroke-width="1">${[0, 1, 2, 3, 4].map(k => `<line x1="90" y1="${190 - k * 30}" x2="250" y2="${190 - k * 30}"/><line x1="${90 + k * 40}" y1="70" x2="${90 + k * 40}" y2="190"/>`).join('')}</g>`;
    o += vec(O[0], O[1], X[0], X[1], OR, 4) + op(a, L(170, 214, '4 N', OR, 'middle', 16));
    if (a >= 1) o += vec(250, 190, Y[0], Y[1], BL, 4) + op(b, L(272, 134, '3 N', BL, 'start', 16));
    if (c > 0) o += vec(90, 190, 90 + 160 * c, 190 - 120 * c, GD, 5) + op(seg(t, .78, .9), L(150, 116, '5 N', GD, 'middle', 19));
    return o + op(seg(t, .82, .95), L(340, 60, '√(3² + 4²)', DK, 'middle', 20) + L(340, 92, '= 5 N', GD, 'middle', 22)); }}
];

/* ================= lesson 2 · speed and acceleration ================= */
function track(){ return `<ellipse cx="220" cy="138" rx="160" ry="62" fill="#fecaca" stroke="${DK}" stroke-width="1.5"/><ellipse cx="220" cy="138" rx="132" ry="38" fill="#bbf7d0" stroke="${DK}" stroke-width="1.5"/>`; }
F.ph_disp = [
  {d: 8, draw(t){ const p = seg(t, .05, .9), th = p * TAU, R = [146, 50], S = [220, 188];
    const P = [220 - Math.sin(th) * R[0], 138 + Math.cos(th) * R[1]];
    let o = track();
    const pts = []; for (let k = 0; k <= 40; k++){ const a = th * k / 40; pts.push([220 - Math.sin(a) * R[0], 138 + Math.cos(a) * R[1]]); }
    o += poly(pts, BL, 4) + vec(S[0], S[1], P[0], P[1], RD, 3) + `<circle cx="${S[0]}" cy="${S[1]}" r="5" fill="${DK}"/>` + ball(P[0], P[1], 9, OR);
    const disp = Math.round(Math.hypot(P[0] - S[0], P[1] - S[1]) * .56);
    return o + L(110, 28, T('المسافة', 'Distance'), BL, 'middle', 15) + L(110, 54, Math.round(400 * p) + ' m', BL, 'middle', 20) +
      L(330, 28, T('الإزاحة', 'Displacement'), RD, 'middle', 15) + L(330, 54, (p >= 1 ? 0 : disp) + ' m', RD, 'middle', 20); }},
  {d: 6, draw(t){ const p = ease(seg(t, .05, .6));
    const pts = []; for (let k = 0; k <= 40 * p; k++){ const u = k / 40; pts.push([60 + u * 300, 150 - Math.sin(u * Math.PI) * 90 + Math.sin(u * 18) * 8]); }
    const e = pts[pts.length - 1] || [60, 150];
    return `<circle cx="60" cy="150" r="7" fill="${DK}"/><circle cx="360" cy="150" r="7" fill="${DK}"/>` + L(60, 180, 'A', DK) + L(360, 180, 'B', DK) + poly(pts, BL, 4) + ball(e[0], e[1], 8, OR) +
      op(seg(t, .55, .7), L(210, 40, T('المسافة = الطريق كله', 'Distance = the whole path'), BL, 'middle', 16)) +
      op(seg(t, .7, .85), vec(60, 150, 360, 150, RD, 4) + L(210, 200, T('الإزاحة = خط مستقيم', 'Displacement = straight line'), RD, 'middle', 16)); }}
];
F.ph_speed = [
  {d: 7, draw(t){ const p = seg(t, .05, .85), x = 40 + p * 300;
    let o = ground(196); for (let k = 0; k <= 4; k++) o += `<line x1="${40 + k * 75 + 50}" y1="196" x2="${40 + k * 75 + 50}" y2="206" stroke="${DK}" stroke-width="2"/>` + L(90 + k * 75, 224, k * 25 + '', DK, 'middle', 12);
    o += car(x, 196, p * 40, BL) + watch(380, 60, 24, p * 5) + L(380, 112, (p * 5).toFixed(1) + ' s', DK, 'middle', 16) + L(210, 60, Math.round(p * 100) + ' m', BL, 'middle', 22);
    return o + op(seg(t, .88, .98), card(110, 90, 200, 40, GD) + L(210, 117, '100 ÷ 5 = 20 m/s', GD, 'middle', 18)); }},
  {d: 7, draw(t){ const rows = [['🚶', 1.4], ['🚲', 5], ['🚗', 14], ['🚆', 50], ['✈️', 250]];
    let o = '';
    rows.forEach(([ic, v], i) => { const y = 40 + i * 42, x = 70 + Math.min(1, t * Math.sqrt(v) / Math.sqrt(250)) * 290;
      o += `<line x1="70" y1="${y + 6}" x2="400" y2="${y + 6}" stroke="${P1}" stroke-width="2" stroke-dasharray="4 4"/>` + `<text x="${r1(x)}" y="${y + 12}" font-size="24" text-anchor="middle">${ic}</text>` + L(16, y + 12, v + '', BL, 'start', 15); });
    return o + L(16, 26, 'm/s', DK, 'start', 13); }},
  {d: 8, draw(t){ const p = seg(t, 0, .9), q = p < .4 ? p / .4 * .5 : p < .6 ? .5 : .5 + (p - .6) / .4 * .5, x = 20 + q * 300;
    return ground(176) + `<line x1="70" y1="176" x2="70" y2="186" stroke="${DK}"/><line x1="370" y1="176" x2="370" y2="186" stroke="${DK}"/>` + L(70, 204, '0', DK, 'middle', 13) + L(370, 204, '120 km', DK, 'middle', 13) +
      car(x, 176, q * 50, BL) + (p > .4 && p < .6 ? L(x + 50, 108, '☕', DK, 'middle', 22) : '') + watch(390, 56, 22, p * 2) + L(330, 62, (p * 2).toFixed(1) + ' h', DK, 'middle', 18) +
      op(seg(t, .9, 1), card(90, 30, 200, 44, GD) + L(190, 59, '120 ÷ 2 = 60 km/h', GD, 'middle', 18)); }}
];
F.ph_acc = [
  {d: 8, draw(t){ const p = seg(t, 0, .9), tt = p * 10, x = 20 + Math.pow(p, 2) * 290;
    let o = ground(196);
    for (let k = 1; k <= Math.floor(tt); k++){ const xx = 20 + Math.pow(k / 10, 2) * 290; o += `<line x1="${r1(xx + 50)}" y1="196" x2="${r1(xx + 50)}" y2="186" stroke="${AC}" stroke-width="2.5"/>`; }
    o += car(x, 196, p * p * 80, RD) + card(20, 24, 180, 56, BL) + L(110, 60, Math.round(tt * 10) + ' km/h', BL, 'middle', 22) + watch(380, 54, 22, p * 10) + L(380, 102, Math.round(tt) + ' s', DK, 'middle', 15);
    return o + op(seg(t, .92, 1), L(230, 130, 'a = 27.8 ÷ 10 = 2.8 m/s²', GD, 'middle', 19)); }},
  {d: 7, draw(t){ const rows = [[GD, x => x * x, T('بنزين', 'Gas'), 'a > 0'], [DR, x => x, T('سرعة ثابتة', 'Steady'), 'a = 0'], [RD, x => 1 - (1 - x) * (1 - x), T('فرامل', 'Brake'), 'a < 0']];
    let o = '';
    rows.forEach(([c, f, nm, s], i) => { const y = 70 + i * 66, p = seg(t, .05, .95);
      for (let k = 0; k <= 8; k++) if (k / 8 <= p) o += `<circle cx="${r1(40 + f(k / 8) * 230)}" cy="${y}" r="6" fill="${c}"/>`;
      o += L(300, y - 8, nm, c, 'start', 15) + L(300, y + 14, s, c, 'start', 15); });
    return o; }}
];
F.ph_eq = [
  {d: 6, draw(t){ const p = seg(t, .05, .8);
    return axes(40, 40, 230, 160, 't', 'v') + `<line x1="40" y1="170" x2="${r1(40 + 220 * p)}" y2="${r1(170 - 120 * p)}" stroke="${BL}" stroke-width="4"/>` + L(28, 176, 'u', BL, 'end', 15) +
      op(seg(t, .75, .85), L(266, 46, 'v', BL, 'start', 15)) + card(290, 80, 130, 56, BL) + L(355, 116, 'v = u + a·t', BL, 'middle', 17); }},
  {d: 6, draw(t){ const p = seg(t, .05, .8);
    return axes(40, 40, 230, 160, 't', 'v') + `<path d="M40 200 L40 170 L${r1(40 + 220 * p)} ${r1(170 - 120 * p)} L${r1(40 + 220 * p)} 200Z" fill="${OR}" opacity=".45"/>` +
      `<line x1="40" y1="170" x2="${r1(40 + 220 * p)}" y2="${r1(170 - 120 * p)}" stroke="${BL}" stroke-width="4"/>` + op(seg(t, .5, .65), L(150, 186, 'd', '#9a3412', 'middle', 22)) +
      card(282, 80, 146, 56, OR) + L(355, 116, 'd = u·t + ½·a·t²', '#9a3412', 'middle', 15); }},
  {d: 6, draw(t){ const p = ease(seg(t, .05, .8)), x = 20 + p * 220;
    return ground(196) + car(x, 196, p * 30, BL) + vec(40, 120, 70, 120, BL) + L(55, 108, 'u', BL) + op(seg(t, .8, .9), vec(x + 60, 120, x + 104, 120, GD) + L(x + 82, 108, 'v', GD)) +
      `<path d="M70 150 H${r1(x + 70)}" stroke="${OR}" stroke-width="2.5"/>` + L(150, 168, 'd', OR) + card(300, 24, 124, 70, GD) + L(362, 52, 'v² = u² + 2·a·d', GD, 'middle', 15) +
      op(seg(t, .5, .65), L(362, 80, T('من غير زمن', 'No time'), RD, 'middle', 14)); }}
];
F.ph_brake = [
  {d: 9, draw(t){ const rows = [[50, 14], [80, 36], [100, 56]];
    let o = '';
    rows.forEach(([v, d], i) => { const y = 72 + i * 64, p = seg(t, i * .28, i * .28 + .26), q = 1 - (1 - p) * (1 - p), x = 58 + q * d * 4;
      o += `<line x1="10" y1="${y}" x2="430" y2="${y}" stroke="${DK}" stroke-width="2"/>` + `<line x1="120" y1="${y - 46}" x2="120" y2="${y}" stroke="${RD}" stroke-width="2" stroke-dasharray="4 3"/>` +
        `<g transform="translate(${r1(x)} ${y}) scale(.62) translate(0 ${-y})">${car(0, y, q * 20, i === 2 ? RD : BL)}</g>` + L(16, y - 34, v + ' km/h', DK, 'start', 13) +
        (p > 0 ? `<path d="M120 ${y + 8} H${r1(120 + q * d * 4)}" stroke="${OR}" stroke-width="5"/>` : '') + op(seg(p, .9, 1), L(r1(128 + d * 4), y + 14, d + ' m', OR, 'start', 16)); });
    return o; }},
  {d: 6, draw(t){
    return card(30, 50, 170, 130, BL) + big(115, 100, '×2', BL, 34) + L(115, 150, T('السرعة', 'Speed'), BL, 'middle', 18) + op(seg(t, .3, .45), vec(206, 115, 238, 115, DK) +
      card(244, 50, 170, 130, RD) + big(329, 100, '×4', RD, 34) + L(329, 150, T('مسافة الفرامل', 'Braking distance'), RD, 'middle', 16)) + op(seg(t, .6, .75), L(220, 214, 'd = v² ÷ 2a', DK, 'middle', 19)); }}
];

/* ================= lesson 3 · free fall and projectiles ================= */
F.ph_g = [
  {d: 8, draw(t){ const tt = seg(t, .02, .9) * 3, y = 30 + 4.9 * tt * tt * 3.8;
    let o = `<rect x="10" y="206" width="420" height="26" fill="#d6dee8"/><line x1="160" y1="30" x2="160" y2="206" stroke="${P1}" stroke-width="2"/>`;
    [1, 2, 3].forEach(k => { if (tt >= k){ const yy = 30 + 4.9 * k * k * 3.8; o += `<circle cx="160" cy="${r1(yy)}" r="10" fill="${OR}" opacity=".35"/><line x1="174" y1="${r1(yy)}" x2="230" y2="${r1(yy)}" stroke="${DK}" stroke-dasharray="3 3"/>` +
      L(238, r1(yy + 6), k + ' s', DK, 'start', 15) + L(278, r1(yy + 6), (9.8 * k).toFixed(1) + ' m/s', BL, 'start', 15); } });
    return o + ball(160, Math.min(y, 196), 10) + (tt > .2 ? vec(140, Math.min(y, 196) - 4, 140, Math.min(y, 196) + 6 + tt * 10, RD, 3) : ''); }},
  {d: 6, draw(t){ const p = seg(t, .05, .9);
    let o = axes(60, 30, 260, 170, 't', 'v');
    for (let k = 0; k < 3; k++){ const a = seg(p, k / 3, (k + 1) / 3); if (a > 0){ const x = 60 + k * 80, h = 50 * (k + 1);
      o += `<rect x="${x + 4}" y="${200 - h}" width="72" height="${h}" fill="${BL}" opacity="${r1(.25 + .6 * a)}"/>` + L(x + 40, 192 - h, '+9.8', BL, 'middle', 14); } }
    return o + card(320, 70, 104, 60, GD) + L(372, 106, 'g = 9.8', GD, 'middle', 18) + L(372, 150, 'm/s²', GD, 'middle', 14); }}
];
F.ph_feather = [
  {d: 6, draw(t){ const p = seg(t, .05, .95), yh = 40 + Math.min(1, p * 1.6) ** 2 * 150, yf = 40 + p * 70;
    return `<rect x="10" y="10" width="420" height="222" fill="#e0f2fe"/>` + ground(206) + hammer(140, yh - 10, 0) + feather(290 + Math.sin(t * 12) * 18, yf, Math.sin(t * 12) * 25) +
      `<g stroke="#7dd3fc" stroke-width="2.5" stroke-linecap="round">${[0, 1, 2].map(k => `<path d="M${330 + k * 20} ${r1(100 + ((t * 120 + k * 40) % 90))} v-16"/>`).join('')}</g>` + L(390, 40, T('هوا', 'Air'), BL, 'middle', 16); }},
  {d: 6, draw(t){ const p = seg(t, .05, .9), y = 40 + p * p * 150;
    return `<rect x="10" y="10" width="420" height="222" fill="#0f172a"/>` + stars() + `<rect x="10" y="206" width="420" height="26" fill="#9ca3af"/>` + hammer(150, y - 6, 0) + feather(290, y, 0) +
      `<line x1="120" y1="${r1(y + 26)}" x2="320" y2="${r1(y + 26)}" stroke="#fde68a" stroke-width="1.5" stroke-dasharray="5 4"/>` + L(390, 40, T('القمر', 'Moon'), '#fde68a', 'middle', 16) +
      op(seg(t, .92, 1), mark(true, 390, 160)); }}
];
F.ph_height = [
  {d: 8, draw(t){ const tt = seg(t, .05, .9) * 2.47, y = 34 + 4.9 * tt * tt * 5.6;
    let o = `<rect x="40" y="34" width="110" height="172" fill="#cbd5e1" stroke="${DK}" stroke-width="1.5"/>`;
    for (let k = 0; k < 10; k++) o += `<rect x="52" y="${40 + k * 16.6}" width="20" height="10" fill="#e0f2fe"/><rect x="88" y="${40 + k * 16.6}" width="20" height="10" fill="#e0f2fe"/><rect x="122" y="${40 + k * 16.6}" width="20" height="10" fill="#e0f2fe"/>`;
    o += ground(206) + `<path d="M178 34 V206" stroke="${OR}" stroke-width="2"/>` + L(186, 124, '30 m', OR, 'start', 15) + ball(166, Math.min(y, 198), 8, RD);
    return o + watch(330, 60, 24, tt / 3) + L(330, 112, tt.toFixed(1) + ' s', DK, 'middle', 18) + op(seg(t, .9, 1), L(330, 154, '24 m/s', RD, 'middle', 20) + L(330, 182, '≈ 88 km/h', RD, 'middle', 18)); }},
  {d: 6, draw(t){ const p = seg(t, .2, .6), y = 72 + p * p * 44, hit = t > .6, b = seg(t, .6, .8);
    const helmet = `<path d="M250 120 a16 14 0 0 1 32 0 h4 v4 h-40 v-4 Z" fill="${OR}" stroke="${DK}" stroke-width="1.4"/>`;
    return ground(206) + `<rect x="40" y="76" width="200" height="8" fill="#a16207"/><path d="M50 84 V206 M230 84 V206" stroke="#a16207" stroke-width="4"/>` +
      `<g transform="translate(180 76) scale(.68) translate(-180 -76)">${stick(180, 76, {arm: [212, 58]})}</g>` + stick(266, 206, {}) + helmet +
      (hit ? hammer(276 + b * 50, 96 - Math.sin(b * Math.PI) * 30, b * 200) + spark(266, 112, 1 - b) + op(seg(t, .8, .9), mark(true, 380, 70)) : hammer(266, y - 14, p * 200)); }}
];
F.ph_proj = [
  {d: 8, draw(t){ const p = seg(t, .05, .9), tt = p * 1, Y = s => 70 + s * s * 136;
    let o = ground(206) + `<rect x="20" y="70" width="70" height="10" fill="#a16207"/><path d="M30 80 V206 M80 80 V206" stroke="#a16207" stroke-width="4"/>`;
    for (let k = 1; k <= 4; k++){ const s = k / 4; if (tt >= s){ o += `<circle cx="${r1(90 + s * 290)}" cy="${r1(Y(s))}" r="9" fill="${OR}" opacity=".3"/><circle cx="100" cy="${r1(Y(s))}" r="9" fill="${BL}" opacity=".3"/><line x1="100" y1="${r1(Y(s))}" x2="${r1(90 + s * 290)}" y2="${r1(Y(s))}" stroke="${DK}" stroke-dasharray="3 4"/>`; } }
    o += ball(100, Y(tt) - 2, 9, BL) + ball(90 + tt * 290, Y(tt) - 2, 9, OR);
    return o + op(seg(t, .9, 1), mark(true, 240, 40)); }},
  {d: 7, draw(t){ const p = seg(t, .05, .85), x = 60 + p * 300, y = 50 + p * p * 140;
    const pts = []; for (let k = 0; k <= 30 * p; k++){ const s = k / 30; pts.push([60 + s * 300, 50 + s * s * 140]); }
    return ground(206) + poly(pts, OR, 2.5, '5 5') + ball(x, y, 10, OR) + vec(x, y, x + 50, y, BL, 3.4) + L(x + 58, y + 6, 'vx', BL, 'start', 15) +
      vec(x, y, x, y + 10 + p * 36, RD, 3.4) + L(x - 10, y + 24 + p * 18, 'vy', RD, 'end', 15) +
      L(300, 40, T('أفقي: ثابت', 'Across: constant'), BL, 'start', 15) + L(300, 64, T('رأسي: بيزيد', 'Down: grows'), RD, 'start', 15); }}
];
F.ph_angle = [
  {d: 10, draw(t){ const rows = [[30, 277, 40, BL], [60, 277, 120, RD], [45, 320, 80, GD]];
    let o = ground(206) + `<circle cx="50" cy="206" r="6" fill="${DK}"/>`;
    rows.forEach(([a, R, H, c], i) => { const p = seg(t, i * .3, i * .3 + .26); if (p <= 0) return;
      const pts = []; for (let k = 0; k <= 40 * p; k++){ const s = k / 40; pts.push([50 + s * R, 206 - 4 * H * s * (1 - s)]); }
      const e = pts[pts.length - 1]; o += poly(pts, c, 3) + (p < 1 ? ball(e[0], e[1], 7, c) : `<circle cx="${50 + R}" cy="206" r="5" fill="${c}"/>`);
      o += op(seg(p, .1, .3), L(50 + R * .5, 196 - H - 4 + (i === 1 ? 0 : 0), a + '°', c, 'middle', 17)); });
    return o + op(seg(t, .92, 1), vec(370, 160, 370, 200, GD) + L(370, 150, T('أبعد', 'Farthest'), GD, 'middle', 15)); }},
  {d: 5, draw(t){
    return card(70, 60, 300, 70, DK) + big(220, 106, 'R = v² · sin(2θ) ÷ g', BL, 22) + op(seg(t, .3, .5), L(220, 170, 'sin(90°) = 1', GD, 'middle', 20)) + op(seg(t, .55, .7), L(220, 204, '→ 45°', GD, 'middle', 20)); }}
];

/* ================= lesson 4 · force and Newton's laws ================= */
F.ph_force = [
  {d: 4, draw(t){ const p = ease(seg(t, .3, 1)), x = 170 + p * 120;
    return ground(196) + box(x, 196, 60, 50) + op(seg(t, .05, .25), vec(x - 50, 170, x - 4, 170, RD)) + op(seg(t, .5, .7), mark(true, 380, 60)); }},
  {d: 4, draw(t){ const p = seg(t, 0, .6), x = 30 + (1 - (1 - p) * (1 - p)) * 230;
    return ground(196) + ball(x, 180, 16) + `<rect x="300" y="110" width="20" height="86" fill="#94a3b8" stroke="${DK}"/>` + op(seg(t, .4, .55), vec(298, 170, 270, 170, RD)) + op(seg(t, .7, .85), mark(true, 380, 60)); }},
  {d: 4, draw(t){ const p = seg(t, 0, 1), turn = p > .45;
    const x = turn ? 220 + (p - .45) * 100 : 40 + p / .45 * 180, y = turn ? 150 - (p - .45) * 220 : 150;
    return poly([[40, 150], [220, 150]], P1, 3, '6 6') + (turn ? poly([[220, 150], [x, y]], P1, 3, '6 6') : '') + ball(x, y, 14) + op(seg(t, .35, .5) - seg(t, .55, .7), vec(220, 210, 220, 168, RD)); }},
  {d: 6, draw(t){ const rows = [['🍎', '≈ 1 N', 6], ['🎒', '98 N', 30], ['🚗', '≈ 5000 N', 100]];
    let o = '';
    rows.forEach(([ic, v, len], i) => { const x = 80 + i * 130, a = seg(t, i * .25, i * .25 + .2);
      o += op(a, `<text x="${x}" y="80" font-size="40" text-anchor="middle">${ic}</text>` + vec(x, 100, x, 100 + len * ease(a) + 4, RD, 2 + i * 2) + L(x, 230 - 8, v, RD, 'middle', 17)); });
    return o; }}
];
function bus(x, yG, ang){
  return `<rect x="${r1(x)}" y="${yG - 92}" width="230" height="78" rx="10" fill="#fbbf24" stroke="${DK}" stroke-width="1.5"/>` +
    [0, 1, 2, 3].map(k => `<rect x="${r1(x + 14 + k * 52)}" y="${yG - 82}" width="40" height="28" rx="4" fill="#e0f2fe" stroke="${DK}"/>`).join('') +
    [x + 44, x + 186].map(cx => `<circle cx="${r1(cx)}" cy="${yG - 14}" r="14" fill="#1f2937"/><circle cx="${r1(cx)}" cy="${yG - 14}" r="6" fill="#cbd5e1"/>` +
      `<line x1="${r1(cx)}" y1="${yG - 14}" x2="${r1(cx + Math.cos(ang) * 6)}" y2="${r1(yG - 14 + Math.sin(ang) * 6)}" stroke="#1f2937" stroke-width="2"/>`).join('');
}
F.ph_newton1 = [
  {d: 6, draw(t){ const p = seg(t, 0, .55), q = 1 - (1 - p) * (1 - p), x = 10 + q * 110, lean = t < .5 ? 0 : 26 * Math.sin(seg(t, .5, .8) * Math.PI) ;
    return ground(206) + bus(x, 206, q * 30) + `<g transform="translate(${r1(x + 120)} 192) scale(.7) translate(${r1(-x - 120)} -192)">${stick(x + 120, 192, {lean: lean, arm: [x + 140, 150]})}</g>` +
      op(seg(t, .45, .6), vec(x + 236, 120, x + 210, 120, RD) + L(x + 250, 110, T('فرامل', 'Brake'), RD, 'start', 14)) + op(seg(t, .55, .7), vec(x + 140, 50, x + 190, 50, OR) + L(x + 140, 36, T('جسمك يكمّل', 'You keep going'), OR, 'start', 14)); }},
  {d: 6, draw(t){ const p = seg(t, .25, 1), x = 30 + p * p * 140, lean = -24 * Math.sin(seg(t, .25, .6) * Math.PI);
    return ground(206) + bus(x, 206, p * p * 30) + `<g transform="translate(${r1(x + 120)} 192) scale(.7) translate(${r1(-x - 120)} -192)">${stick(x + 120, 192, {lean: lean, arm: [x + 140, 150]})}</g>` +
      op(seg(t, .3, .45), vec(x + 140, 50, x + 90, 50, OR) + L(x + 140, 36, T('جسمك يرجع', 'You fall back'), OR, 'end', 14)); }}
];
F.ph_newton2 = [
  {d: 7, draw(t){ const p = seg(t, .15, .95), rows = [[30, 30, 1, T('خفيف', 'Light')], [52, 52, .35, T('تقيل', 'Heavy')]];
    let o = '';
    rows.forEach(([w, h, k, nm], i) => { const yG = 100 + i * 100, x = 60 + p * p * 300 * k;
      o += `<line x1="10" y1="${yG}" x2="430" y2="${yG}" stroke="${DK}" stroke-width="2"/>` + box(x, yG, w, h, i ? '#94a3b8' : '#d6a86a') + vec(x - 44, yG - h / 2, x - 4, yG - h / 2, RD) + L(16, yG - 56 + (i ? -10 : 20), nm, DK, 'start', 14); });
    return o; }},
  {d: 7, draw(t){ const p = seg(t, .15, .95), rows = [[1, 30, T('قوة صغيرة', 'Small push')], [2.6, 60, T('قوة كبيرة', 'Big push')]];
    let o = '';
    rows.forEach(([k, len, nm], i) => { const yG = 100 + i * 100, x = 70 + p * p * 120 * k;
      o += `<line x1="10" y1="${yG}" x2="430" y2="${yG}" stroke="${DK}" stroke-width="2"/>` + box(x, yG, 40, 40) + vec(x - len - 4, yG - 20, x - 4, yG - 20, RD, 2.4 + i * 2) + L(16, yG - 52, nm, DK, 'start', 14); });
    return o; }},
  {d: 6, draw(t){
    return big(220, 70, 'F = m · a', BL, 34) + op(seg(t, .3, .5), kg(110, 180, '1 kg', 1.5) + vec(150, 160, 200, 160, RD) + L(176, 148, '1 N', RD, 'middle', 16)) +
      op(seg(t, .55, .75), vec(230, 160, 300, 160, GD, 4) + L(340, 166, '1 m/s²', GD, 'middle', 18)); }}
];
F.ph_newton3 = [
  {d: 7, draw(t){ const p = seg(t, .2, 1), y = 150 - p * p * 70;
    const rk = `<path d="M210 ${r1(y - 40)} q10 -14 20 0 v60 h-20 Z" fill="#e2e8f0" stroke="${DK}" stroke-width="1.5"/><path d="M210 ${r1(y + 6)} l-10 14 h10 Z M230 ${r1(y + 6)} l10 14 h-10 Z" fill="${RD}"/>`;
    let fl = ''; for (let k = 0; k < 6; k++){ const q = (t * 3 + k / 6) % 1; fl += `<circle cx="${r1(220 + Math.sin(k * 3) * 10 * q)}" cy="${r1(y + 26 + q * 60)}" r="${r1(4 + q * 10)}" fill="${q < .4 ? OR : '#94a3b8'}" opacity="${r1(1 - q)}"/>`; }
    return ground(206) + fl + rk + op(seg(t, .1, .25), vec(270, 160, 270, 200, OR) + L(282, 190, T('الغاز لتحت', 'Gas down'), OR, 'start', 15) + vec(170, 110, 170, 70, BL) + L(160, 94, T('الصاروخ لفوق', 'Rocket up'), BL, 'end', 15)); }},
  {d: 6, draw(t){ const p = ease(seg(t, .3, 1)), d = p * 80;
    return ground(206) + stick(200 - d, 206, {lean: -6, arm: [218 - d, 140]}) + stick(240 + d, 206, {lean: 6, arm: [222 + d, 140]}) +
      op(seg(t, .15, .3) - seg(t, .6, .75), vec(214, 160, 250, 160, RD) + vec(226, 176, 190, 176, BL)) + op(seg(t, .4, .55), vec(150 - d, 120, 110 - d, 120, BL) + vec(290 + d, 120, 330 + d, 120, RD)); }}
];
F.ph_net = [
  {d: 6, draw(t){ const w = Math.sin(t * 30) * 2;
    return ground(196) + box(190 + w, 196, 60, 50) + `<path d="M120 ${170} H190 M250 170 H320" stroke="#a16207" stroke-width="3"/>` + stick(110, 196, {lean: -16, arm: [120, 170]}) + stick(330, 196, {lean: 16, arm: [320, 170]}) +
      op(seg(t, .1, .25), vec(190, 140, 130, 140, BL) + L(160, 128, '100 N', BL, 'middle', 14) + vec(250, 140, 310, 140, RD) + L(280, 128, '100 N', RD, 'middle', 14)) + op(seg(t, .5, .65), big(220, 60, '= 0', GD, 28)); }},
  {d: 6, draw(t){ const p = seg(t, .3, 1), m = p * p * 80;
    return ground(196) + box(190 + m, 196, 60, 50) + `<path d="M120 170 H${190 + m} M${250 + m} 170 H${320 + m}" stroke="#a16207" stroke-width="3"/>` + stick(110 + m, 196, {lean: 16, arm: [120 + m, 170]}) + stick(330 + m, 196, {lean: 22, arm: [320 + m, 170]}) +
      op(seg(t, .05, .2), vec(190 + m, 140, 160 + m, 140, BL) + L(150 + m, 118, '60', BL, 'middle', 14) + vec(250 + m, 140, 320 + m, 140, RD) + L(300 + m, 118, '140', RD, 'middle', 14)) +
      op(seg(t, .3, .45), vec(200, 70, 260, 70, GD, 5) + L(230, 56, '80 N', GD, 'middle', 18)); }},
  {d: 6, draw(t){ const p = seg(t, .4, 1), m = p * p * 60;
    return ground(196) + box(170 + m, 196, 60, 50) + `<g opacity=".7">${[0, 1, 2, 3].map(k => `<path d="M${180 + m + k * 12} 199 l6 6" stroke="${DK}"/>`).join('')}</g>` +
      op(seg(t, 0, .15), vec(110 + m, 170, 166 + m, 170, RD) + L(130 + m, 158, 'F', RD)) + op(seg(t, .15, .3), vec(234 + m, 192, 200 + m, 192, OR) + L(250 + m, 186, 'f', OR, 'start')) +
      op(seg(t, .3, .45), vec(176 + m, 120, 226 + m, 120, GD, 5) + L(202 + m, 108, 'm·a', GD)) + op(seg(t, .55, .7), L(220, 54, 'F − f = m · a', DK, 'middle', 22)); }}
];

/* ================= lesson 5 · weight, friction, incline ================= */
F.ph_normal = [
  {d: 5, draw(t){ const p = ease(seg(t, 0, .4)), y = 196 - (1 - p) * 90;
    return ground(196) + box(180, y, 80, 64, '#d6a86a', '50 kg') + op(seg(t, .45, .65), vec(286, y - 60, 286, y - 4, RD, 4) + L(298, y - 26, '490 N', RD, 'start', 16)); }},
  {d: 6, draw(t){
    return ground(196) + box(180, 196, 80, 64, '#d6a86a', '50 kg') + vec(286, 136, 286, 192, RD, 4) + L(298, 170, 'W', RD, 'start') +
      op(seg(t, .1, .35), vec(156, 196, 156, 196 - 70 * ease(seg(t, .1, .35)), BL, 4) + L(144, 140, 'N', BL, 'end')) + op(seg(t, .5, .65), L(330, 90, '490 N ↑', BL, 'middle', 18) + L(330, 120, '490 N ↓', RD, 'middle', 18) + mark(true, 330, 160)); }}
];
F.ph_fric = [
  {d: 8, draw(t){ const P = Math.min(1, t / .55) * 120, slip = t > .55, m = slip ? Math.pow(seg(t, .55, 1), 2) * 120 : 0, f = slip ? 70 : P * .75;
    return ground(196) + box(170 + m, 196, 70, 56) + stick(144 + m, 196, {lean: 14, arm: [172 + m, 160]}) + `<g opacity=".7">${[0, 1, 2, 3, 4].map(k => `<path d="M${176 + m + k * 13} 199 l6 6" stroke="${DK}"/>`).join('')}</g>` +
      vec(180 + m, 120, 180 + m + P * .6, 120, RD) + L(180 + m, 108, T('زقّك', 'Push'), RD, 'start', 14) + vec(240 + m, 186, 240 + m - f * .8, 186, OR) + L(250 + m, 182, 'f', OR, 'start') +
      op(seg(t, .55, .65), L(330, 60, slip ? T('اتحرك!', 'It moves!') : '', GD, 'middle', 18)); }},
  {d: 7, draw(t){ const p = seg(t, .05, .9), pts = [];
    for (let k = 0; k <= 60 * p; k++){ const u = k / 60; pts.push([60 + u * 300, 196 - (u < .5 ? u / .5 * 120 : u < .55 ? 120 - (u - .5) / .05 * 36 : 84)]); }
    return axes(60, 40, 330, 160, T('الزق', 'Push'), 'f') + poly(pts, OR, 4) +
      op(seg(t, .5, .6), `<line x1="60" y1="76" x2="210" y2="76" stroke="${RD}" stroke-dasharray="4 4"/>` + L(214, 70, 'μs', RD, 'start', 18)) +
      op(seg(t, .7, .8), L(380, 104, 'μk', BL, 'end', 18)); }}
];
F.ph_mu = [
  {d: 7, draw(t){ const rows = [['🧊', 0.1, BL], ['🪵', 0.5, '#a16207'], ['🛞', 0.8, GD], ['🌧️', 0.45, '#0ea5e9']];
    let o = '';
    rows.forEach(([ic, v, c], i) => { const y = 34 + i * 48, a = ease(seg(t, i * .18, i * .18 + .25));
      o += `<text x="40" y="${y + 26}" font-size="28" text-anchor="middle">${ic}</text><rect x="70" y="${y + 6}" width="${r1(v * 300 * a)}" height="26" rx="6" fill="${c}"/>` + op(a, L(r1(80 + v * 300 * a), y + 26, v + '', c, 'start', 18)); });
    return o; }},
  {d: 8, draw(t){ const rows = [[GD, 28, '☀️'], ['#0ea5e9', 56, '🌧️']];
    let o = '';
    rows.forEach(([c, d, ic], i) => { const y = 100 + i * 90, p = seg(t, .1, .9), q = 1 - Math.pow(1 - Math.min(1, p * 56 / d), 2), x = 30 + q * d * 4.4;
      o += `<line x1="10" y1="${y}" x2="430" y2="${y}" stroke="${DK}" stroke-width="2"/>` + `<g transform="translate(${r1(x)} ${y}) scale(.62) translate(0 ${-y})">${car(0, y, q * 20, BL)}</g>` +
        `<text x="400" y="${y - 30}" font-size="26" text-anchor="middle">${ic}</text>` + `<path d="M92 ${y + 8} H${r1(92 + q * d * 4.4)}" stroke="${c}" stroke-width="5"/>`; });
    return o + op(seg(t, .9, 1), L(340, 220, '× 2', '#0ea5e9', 'middle', 22)); }}
];
F.ph_fricgood = [
  {d: 5, draw(t){ const x = 80 + t * 220;
    return ground(196) + stick(x, 196, {arm: [x + 14, 150]}) + `<path d="M${r1(x - 10)} 196 l-8 0" stroke="${DK}" stroke-width="5" stroke-linecap="round"/>` +
      vec(x - 10, 210, x + 26, 210, OR) + L(x + 34, 216, 'f', OR, 'start'); }},
  {d: 5, draw(t){ const a = t * 6;
    let o = `<rect x="208" y="30" width="24" height="180" fill="${ST}" stroke="${DK}"/>`;
    for (let y = 34; y < 206; y += 8) o += `<line x1="208" y1="${y}" x2="232" y2="${y + 5}" stroke="${DK}"/>`;
    o += `<rect x="176" y="110" width="88" height="36" rx="3" fill="${ST}" stroke="${DK}" stroke-width="1.5"/>`;
    for (let k = 0; k < 6; k++){ const aa = a * 0 + k * Math.PI / 3; if (Math.cos(aa) > .05) o += `<line x1="${r1(220 + Math.sin(aa) * 44)}" y1="111" x2="${r1(220 + Math.sin(aa) * 44)}" y2="145" stroke="${DK}"/>`; }
    return o + `<g opacity="${r1(.5 + .5 * Math.sin(t * 20))}">` + vec(176, 128, 150, 128, OR) + vec(264, 128, 290, 128, OR) + '</g>' + K2.pad(340, 110, true); }},
  {d: 5, draw(t){ const a = t * 14;
    return K2.loop(130, 120, 40, 320, 120, 60, a * 40, '#1f2937', OR, 6) + K2.wheel(130, 120, 40, a) + K2.wheel(320, 120, 60, a * 40 / 60); }},
  {d: 5, draw(t){ const w = (1 - seg(t, .2, .9)) * 20, h = seg(t, .2, .9);
    return `<circle cx="220" cy="120" r="80" fill="${h > .2 ? `rgb(${r1(150 + 100 * h)},${r1(160 - 80 * h)},${r1(170 - 120 * h)})` : '#cbd5e1'}" stroke="${DK}" stroke-width="2"/><circle cx="220" cy="120" r="24" fill="#e2e8f0" stroke="${DK}"/>` +
      [0, 1, 2, 3, 4].map(k => { const a = t * w + k * TAU / 5; return `<circle cx="${r1(220 + Math.cos(a) * 52)}" cy="${r1(120 + Math.sin(a) * 52)}" r="6" fill="#64748b"/>`; }).join('') +
      `<rect x="280" y="60" width="40" height="70" rx="6" fill="${RD}" stroke="${DK}" stroke-width="1.5"/>` + op(h, K2.smoke(320, 50, t) + L(380, 200, '🔥', RD, 'middle', 26)); }}
];
function slope(th, s, col, txt){                                       // incline from (40,206) up to the right; box at distance s along it
  const tn = Math.tan(th), x0 = 40, y0 = 206, X = 380, top = y0 - (X - x0) * tn;
  const bx = x0 + Math.cos(th) * s, by = y0 - Math.sin(th) * s, deg = -th * 180 / Math.PI;
  return {g: `<path d="M${x0} ${y0} L${X} ${y0} L${X} ${r1(top)} Z" fill="#cbd5e1" stroke="${DK}" stroke-width="2"/>` +
    `<g transform="translate(${r1(bx)} ${r1(by)}) rotate(${r1(deg)})"><rect x="-28" y="-44" width="56" height="44" rx="3" fill="${col || '#d6a86a'}" stroke="${DK}" stroke-width="1.5"/>${txt || ''}</g>`, bx, by};
}
F.ph_incline = [
  {d: 9, draw(t){ const th = .5, S = slope(th, 200), cx = S.bx - Math.sin(th) * 22, cy = S.by - Math.cos(th) * 22, W = 80;
    const a = ease(seg(t, .3, .55)), b = ease(seg(t, .55, .8));
    let o = S.g + vec(cx, cy, cx, cy + W, RD, 4) + L(cx + 8, cy + W + 4, 'W', RD, 'start');
    if (a > 0) o += vec(cx, cy, cx - Math.cos(th) * W * Math.sin(th) * a, cy + Math.sin(th) * W * Math.sin(th) * a, OR, 4) + op(a, L(cx - 70, cy + 30, 'W·sinθ', OR, 'end', 16));
    if (b > 0) o += vec(cx, cy, cx + Math.sin(th) * W * Math.cos(th) * b, cy + Math.cos(th) * W * Math.cos(th) * b, BL, 4) + op(b, L(cx + 52, cy + 64, 'W·cosθ', BL, 'start', 16));
    return o + L(96, 198, 'θ', DK, 'middle', 16); }},
  {d: 8, draw(t){ const th = .15 + ease(seg(t, .05, .55)) * .4, sl = t > .6 ? Math.pow(seg(t, .6, 1), 2) * 160 : 0, S = slope(th, 220 - sl);
    return S.g + L(96, 198, Math.round(th * 180 / Math.PI) + '°', DK, 'middle', 16) + op(seg(t, .6, .7), L(120, 50, 'tan θ = μs', GD, 'middle', 22)); }}
];

/* ================= lesson 6 · work, energy, power ================= */
function bag(x, y){ return `<rect x="${r1(x - 18)}" y="${r1(y)}" width="36" height="30" rx="5" fill="${RD}" stroke="${DK}" stroke-width="1.5"/><path d="M${r1(x - 8)} ${r1(y)} v-8 h16 v8" fill="none" stroke="${DK}" stroke-width="2.5"/>`; }
F.ph_work = [
  {d: 6, draw(t){ const p = ease(seg(t, .1, .7)), y = 166 - p * 90;
    return ground(196) + stick(150, 196, {arm: [184, y + 8 - (p > .5 ? 0 : 0)]}) + bag(190, y) + vec(240, 170, 240, 170 - 90 * p - 4, BL) + L(250, 130, 'd', BL, 'start') +
      op(seg(t, .05, .2), vec(190, y + 50, 190, y + 30, RD) ) + op(seg(t, .75, .9), L(330, 80, 'W = F · d', GD, 'middle', 20) + mark(true, 330, 130)); }},
  {d: 6, draw(t){
    return ground(196) + stick(150, 196, {arm: [184, 102]}) + bag(190, 94) + watch(330, 70, 26, t * 2) +
      [0, 1].map(k => { const q = (t * 2 + k / 2) % 1; return `<path transform="translate(${130 + k * 34} ${r1(96 + q * 30)})" d="M0 -6 c-3 4 -4 6 -4 8 a4 4 0 0 0 8 0 c0 -2 -1 -4 -4 -8z" fill="#38bdf8" opacity="${r1(1 - q)}"/>`; }).join('') +
      op(seg(t, .4, .55), L(330, 140, 'd = 0', RD, 'middle', 20) + L(330, 170, 'W = 0', RD, 'middle', 22)); }}
];
F.ph_energy = [
  {d: 6, draw(t){ const p = ease(seg(t, .05, .6)), y = 196 - p * 110;
    return ground(196) + `<rect x="120" y="${r1(y)}" width="60" height="8" fill="#a16207"/><path d="M128 ${r1(y + 8)} V196 M172 ${r1(y + 8)} V196" stroke="#a16207" stroke-width="3"/>` + kg(150, y, 'm', 1.1) +
      `<path d="M210 196 V${r1(y)}" stroke="${OR}" stroke-width="2.5"/>` + L(220, 150, 'h', OR, 'start') + K2.bar(330, 50, 40, 140, p, GD, 'PE') + op(seg(t, .65, .8), L(220, 30, 'PE = m · g · h', GD, 'middle', 18)); }},
  {d: 7, draw(t){ const p = seg(t, .05, .9);
    return `<line x1="10" y1="100" x2="300" y2="100" stroke="${DK}" stroke-width="2"/><line x1="10" y1="200" x2="300" y2="200" stroke="${DK}" stroke-width="2"/>` +
      `<g transform="translate(${r1(-80 + p * 260)} 100) scale(.6) translate(0 -100)">${car(0, 100, p * 20, BL)}</g>` + `<g transform="translate(${r1(-80 + Math.min(1, p * 2) * 260)} 200) scale(.6) translate(0 -200)">${car(0, 200, p * 40, RD)}</g>` +
      L(20, 80, 'v', BL, 'start') + L(20, 180, '2v', RD, 'start') + K2.bar(330, 60, 30, 140, .25 * ease(seg(t, .3, .7)), BL, 'KE') + K2.bar(380, 60, 30, 140, ease(seg(t, .3, .7)), RD, '×4'); }}
];
function coaster(){ const pts = []; for (let k = 0; k <= 60; k++){ const u = k / 60; pts.push([30 + u * 380, 60 + (1 - Math.cos(u * TAU)) / 2 * 0 + 140 * Math.sin(u * Math.PI)]); } return pts; }
F.ph_cons = [
  {d: 9, draw(t){ const pts = coaster(), u = (1 - Math.cos(seg(t, .05, .95) * Math.PI)) / 2, x = 30 + u * 380, y = 60 + 140 * Math.sin(u * Math.PI), h = (y - 60) / 140;
    return poly(pts, DK, 4) + ball(x, y - 12, 12) + K2.bar(20, 120, 26, 90, 1 - h, GD, 'PE') + K2.bar(394, 120, 26, 90, h, OR, 'KE') + L(220, 40, 'PE + KE = ' + T('ثابت', 'const'), DK, 'middle', 17); }},
  {d: 7, draw(t){ const p = seg(t, .1, .7), y = 50 + p * p * 140;
    return ground(196) + `<path d="M120 50 V196" stroke="${OR}" stroke-width="2.5"/>` + L(110, 126, '5 m', OR, 'end', 16) + ball(150, Math.min(y, 184), 12) +
      op(seg(t, .7, .85), card(200, 60, 220, 90, GD) + L(310, 94, 'v = √(2 · g · h)', GD, 'middle', 17) + L(310, 130, '≈ 10 m/s', GD, 'middle', 22)); }}
];
function crane(x, yG, hook){ return `<rect x="${x}" y="40" width="10" height="${yG - 40}" fill="${OR}" stroke="${DK}"/><rect x="${x}" y="34" width="90" height="10" fill="${OR}" stroke="${DK}"/><path d="M${x + 80} 44 V${r1(hook)}" stroke="${DK}" stroke-width="2"/>`; }
F.ph_power = [
  {d: 8, draw(t){ const a = ease(seg(t, .05, .45)), b = ease(seg(t, .05, .85)), H = 100;
    return ground(206) + crane(40, 206, 176 - a * H) + kg(120, 206 - a * H, '1 t', 1) + crane(240, 206, 176 - b * H) + kg(320, 206 - b * H, '1 t', 1) +
      L(120, 26, '10 s', GD, 'middle', 16) + L(320, 26, '20 s', RD, 'middle', 16) + op(seg(t, .88, .98), L(180, 120, T('ضعف القدرة', 'Double power'), GD, 'end', 16)); }},
  {d: 6, draw(t){
    return op(seg(t, 0, .2), card(30, 50, 170, 120, BL) + big(115, 100, '1 kW', BL, 30) + L(115, 140, '= 1000 W', DK, 'middle', 18)) +
      op(seg(t, .35, .55), card(240, 50, 170, 120, OR) + `<text x="325" y="96" font-size="34" text-anchor="middle">🐎</text>` + L(325, 130, '1 hp = 746 W', '#9a3412', 'middle', 17) + L(325, 156, '≈ 0.75 kW', '#9a3412', 'middle', 15)); }},
  {d: 8, draw(t){ const a = ease(seg(t, .05, .6));
    return ground(206) + crane(40, 206, 176 - a * 110) + kg(120, 206 - a * 110, '', 1) + L(78, 206 - a * 110 - 10, '1000 kg', DK, 'end', 13) + `<path d="M150 206 V96" stroke="${BL}" stroke-dasharray="4 4"/>` + L(156, 156, '10 m', BL, 'start', 14) +
      watch(380, 50, 20, a * 2) + L(380, 92, '20 s', DK, 'middle', 14) + op(seg(t, .65, .85), card(196, 112, 228, 80, GD) + L(310, 142, '1000 × 9.8 × 10 ÷ 20', DK, 'middle', 15) + L(310, 176, '= 4.9 kW', GD, 'middle', 22)); }}
];
F.ph_eff = [
  {d: 8, draw(t){ const p = ease(seg(t, .05, .6)), q = ease(seg(t, .5, .9));
    return `<path d="M30 80 H${r1(30 + p * 200)}" stroke="${BL}" stroke-width="60"/>` + L(70, 86, T('داخل', 'In'), '#fff', 'middle', 16) +
      (q > 0 ? `<path d="M230 62 H${r1(230 + q * 170)}" stroke="${GD}" stroke-width="24"/><path d="M230 98 Q260 98 262 ${r1(98 + q * 90)}" fill="none" stroke="${RD}" stroke-width="36"/>` : '') +
      op(q, L(400, 40, T('مفيد', 'Useful'), GD, 'end', 15) + L(300, 200, T('حرارة وصوت', 'Heat and noise'), RD, 'start', 15) + K2.smoke(262, 190, t)) + op(seg(t, .85, 1), L(120, 190, 'η = ' + T('الخارج ÷ الداخل', 'out ÷ in'), DK, 'middle', 18)); }},
  {d: 7, draw(t){ const rows = [['💡', 5], ['⛽', 30], ['⚙️', 90], ['🔌', 92]];
    let o = '';
    rows.forEach(([ic, v], i) => { const y = 34 + i * 48, a = ease(seg(t, i * .18, i * .18 + .25)), c = v > 50 ? GD : v > 20 ? OR : RD;
      o += `<text x="40" y="${y + 26}" font-size="28" text-anchor="middle">${ic}</text><rect x="70" y="${y + 6}" width="300" height="26" rx="6" fill="#e2e8f0"/><rect x="70" y="${y + 6}" width="${r1(v * 3 * a)}" height="26" rx="6" fill="${c}"/>` + op(a, L(r1(Math.min(330, 78 + v * 3 * a)), y + 26, v + '%', v > 80 ? '#fff' : c, v > 80 ? 'end' : 'start', 17)); });
    return o; }}
];

/* ================= lesson 7 · momentum and collisions ================= */
function truck(x, yG, ang){
  return `<rect x="${r1(x)}" y="${yG - 80}" width="130" height="62" rx="3" fill="#94a3b8" stroke="${DK}" stroke-width="1.5"/><path d="M${r1(x + 132)} ${yG - 18} v-44 h24 l18 22 v22 Z" fill="${RD}" stroke="${DK}" stroke-width="1.5"/>` +
    [x + 24, x + 104, x + 150].map(cx => `<circle cx="${r1(cx)}" cy="${yG - 12}" r="12" fill="#1f2937"/><circle cx="${r1(cx)}" cy="${yG - 12}" r="5" fill="#cbd5e1"/><line x1="${r1(cx)}" y1="${yG - 12}" x2="${r1(cx + Math.cos(ang) * 5)}" y2="${r1(yG - 12 + Math.sin(ang) * 5)}" stroke="#1f2937" stroke-width="2"/>`).join('');
}
F.ph_mom = [
  {d: 8, draw(t){ const p = seg(t, 0, 1);
    return `<line x1="10" y1="104" x2="430" y2="104" stroke="${DK}" stroke-width="2"/><line x1="10" y1="206" x2="430" y2="206" stroke="${DK}" stroke-width="2"/>` +
      `<g transform="translate(${r1(10 + p * 60)} 104) scale(.7) translate(0 -104)">${truck(0, 104, p * 10)}</g>` + L(310, 50, '20 t · 4 m/s', DK, 'middle', 15) +
      `<text x="${r1(30 + p * 150)}" y="200" font-size="30">🚲</text>` + L(310, 152, '100 kg · 10 m/s', DK, 'middle', 15) +
      op(seg(t, .4, .55), L(310, 78, 'p = 80000', RD, 'middle', 20) + L(310, 180, 'p = 1000', BL, 'middle', 20)); }}
];
function balls(xa, xb, ca, cb, ta, tb){ return ball(xa, 160, 22, ca) + ball(xb, 160, 22, cb) + (ta ? L(xa, 166, ta, '#fff', 'middle', 14) : '') + (tb ? L(xb, 166, tb, '#fff', 'middle', 14) : ''); }
F.ph_cons2 = [
  {d: 7, draw(t){ const hit = .45, p = t < hit ? t / hit : 1, q = t > hit ? (t - hit) / (1 - hit) : 0;
    const xa = 40 + p * 160, xb = 244 + q * 100;
    return `<line x1="10" y1="182" x2="430" y2="182" stroke="${DK}" stroke-width="2"/>` + balls(xa, xb, BL, OR, 'A', 'B') + (t < hit ? vec(xa + 26, 120, xa + 70, 120, BL) : vec(xb + 26, 120, xb + 70, 120, OR)) + spark(222, 160, 1 - seg(t, hit, hit + .12)) +
      card(110, 26, 220, 40, GD) + L(220, 53, T('المجموع ثابت', 'Total stays the same'), GD, 'middle', 16); }},
  {d: 6, draw(t){
    return `<line x1="40" y1="120" x2="400" y2="120" stroke="${DK}" stroke-width="2"/><circle cx="220" cy="120" r="5" fill="${DK}"/>` + op(seg(t, .1, .3), vec(230, 120, 380, 120, GD, 4) + L(330, 100, '+', GD, 'middle', 30)) +
      op(seg(t, .4, .6), vec(210, 120, 60, 120, RD, 4) + L(110, 104, '−', RD, 'middle', 34)) + op(seg(t, .7, .85), L(220, 190, 'm1·v1 + m2·v2 = m1·v1′ + m2·v2′', DK, 'middle', 15)); }}
];
F.ph_elastic = [
  {d: 7, draw(t){ const hit = .45, p = Math.min(1, t / hit), q = Math.max(0, (t - hit) / (1 - hit)), xa = t < hit ? 40 + p * 136 : 176 - q * 130, xb = t < hit ? 404 - p * 136 : 268 + q * 130;
    return `<line x1="10" y1="182" x2="430" y2="182" stroke="${DK}" stroke-width="2"/>` + balls(xa, xb, BL, OR) + spark(222, 160, 1 - seg(t, hit, hit + .12)) + K2.bar(196, 40, 50, 70, 1, GD, '') + L(221, 130, 'KE', GD, 'middle', 14); }},
  {d: 7, draw(t){ const hit = .45, p = Math.min(1, t / hit), q = Math.max(0, (t - hit) / (1 - hit)), xa = t < hit ? 40 + p * 156 : 196 + q * 60;
    const k = t < hit ? 1 : 1 - .5 * seg(t, hit, hit + .2);
    return `<line x1="10" y1="182" x2="430" y2="182" stroke="${DK}" stroke-width="2"/>` + ball(xa, 160, 22, BL) + ball(t < hit ? 300 : xa + 42, 160, 22, OR) + (t > hit ? `<rect x="${r1(xa + 14)}" y="146" width="14" height="28" fill="#a3e635" stroke="${DK}"/>` : '') +
      K2.bar(196, 40, 50, 70, k, GD, '') + L(221, 130, 'KE', GD, 'middle', 14) + op(seg(t, hit + .05, hit + .2), K2.smoke(xa + 20, 132, t) + L(330, 60, '🔥', RD, 'middle', 22)); }}
];
F.ph_impulse = [
  {d: 7, draw(t){ const p = seg(t, .05, .9), pts = [];
    for (let k = 0; k <= 80 * p; k++){ const u = k / 80; pts.push([60 + u * 320, 200 - (Math.abs(u - .3) < .04 ? (1 - Math.abs(u - .3) / .04) * 160 : 0)]); }
    return axes(60, 30, 340, 170, 't', 'F') + poly(pts, RD, 4) + op(seg(t, .4, .55), L(200, 60, T('خبطة في الحيطة', 'Hit a wall'), RD, 'start', 16) + L(200, 84, T('زمن قصير = قوة ضخمة', 'Short time = huge force'), RD, 'start', 14)); }},
  {d: 7, draw(t){ const p = seg(t, .05, .9), pts = [];
    for (let k = 0; k <= 80 * p; k++){ const u = k / 80; pts.push([60 + u * 320, 200 - (u > .15 && u < .7 ? Math.sin((u - .15) / .55 * Math.PI) * 40 : 0)]); }
    let ghost = []; for (let k = 0; k <= 80; k++){ const u = k / 80; ghost.push([60 + u * 320, 200 - (Math.abs(u - .3) < .04 ? (1 - Math.abs(u - .3) / .04) * 160 : 0)]); }
    return axes(60, 30, 340, 170, 't', 'F') + poly(ghost, RD, 2, '4 4') + poly(pts, GD, 4) + op(seg(t, .6, .75), L(300, 70, T('إيرباج: زمن أطول = قوة أقل', 'Airbag: longer time = less force'), GD, 'middle', 15)); }},
  {d: 5, draw(t){
    return big(220, 100, 'F · t = Δp', BL, 34) + op(seg(t, .3, .5), L(220, 160, T('نفس Δp', 'Same Δp'), DK, 'middle', 18)) + op(seg(t, .5, .7), L(220, 196, 't ↑ → F ↓', GD, 'middle', 22)); }}
];

/* ================= lesson 8 · torque, levers, balance ================= */
function spanner(cx, cy, len, ang){                                    // nut at cx,cy; handle length len, angle in rad
  const ex = cx + Math.cos(ang) * len, ey = cy + Math.sin(ang) * len;
  return `<path d="M${r1(cx)} ${r1(cy)} L${r1(ex)} ${r1(ey)}" stroke="#64748b" stroke-width="12" stroke-linecap="round"/><circle cx="${r1(cx)}" cy="${r1(cy)}" r="16" fill="#64748b" stroke="${DK}" stroke-width="1.5"/>` +
    `<path d="M${r1(cx - 8)} ${r1(cy - 5)} l8 -5 l8 5 v10 l-8 5 l-8 -5Z" fill="${ST}" stroke="${DK}" transform="rotate(${r1(ang * 180 / Math.PI)} ${r1(cx)} ${r1(cy)})"/>`;
}
F.ph_torque = [
  {d: 7, draw(t){ const a = -.1 - ease(seg(t, .3, .9)) * .5;
    const one = (cx, len, F, txt, c) => { const ex = cx + Math.cos(a) * len, ey = 120 + Math.sin(a) * len;
      return spanner(cx, 120, len, a) + vec(ex - Math.sin(a) * -4, ey + 8 + F, ex, ey + 6, c, 2.5 + F / 20) + L(cx + len / 2, 200, txt, c, 'middle', 15); };
    return one(30, 80, 50, '20 cm · 200 N', RD) + one(210, 170, 26, '40 cm · 100 N', GD) + op(seg(t, .85, 1), L(220, 36, '= 40 N·m', BL, 'middle', 22)); }},
  {d: 5, draw(t){
    return big(220, 90, 'τ = F · r', BL, 34) + op(seg(t, .3, .5), L(220, 150, 'r × 2 → F ÷ 2', GD, 'middle', 22)); }}
];
F.ph_hold = [
  {d: 8, draw(t){ const a = ease(seg(t, .5, .9)) * .7, aa = ease(seg(t, .1, .4)) * .15;
    const door = (hx, ang, px, c) => `<line x1="${hx}" y1="120" x2="${r1(hx + Math.cos(ang) * 150)}" y2="${r1(120 + Math.sin(ang) * 150)}" stroke="#a16207" stroke-width="10" stroke-linecap="round"/><circle cx="${hx}" cy="120" r="6" fill="${DK}"/>` +
      vec(hx + Math.cos(ang) * px - Math.sin(ang) * -40, 120 + Math.sin(ang) * px - 40 * Math.cos(ang), hx + Math.cos(ang) * px, 120 + Math.sin(ang) * px - 6, c);
    return `<line x1="215" y1="20" x2="215" y2="220" stroke="${P1}" stroke-width="2"/>` + door(30, -aa, 30, RD) + L(110, 210, T('جنب المفصّلة', 'Near the hinge'), RD, 'middle', 14) +
      door(250, -a, 140, GD) + L(330, 210, T('بعيد عنها', 'Far from it'), GD, 'middle', 14); }},
  {d: 7, draw(t){ const a = ease(seg(t, .4, .9)) * .6;
    return `<line x1="215" y1="20" x2="215" y2="220" stroke="${P1}" stroke-width="2"/>` + spanner(50, 130, 140, 0) + vec(210, 130, 186, 130, RD) + L(110, 200, 'τ = 0', RD, 'middle', 20) +
      spanner(250, 130, 140, -a) + vec(250 + Math.cos(-a) * 130 + Math.sin(-a) * 0, 130 + Math.sin(-a) * 130 + 50, 250 + Math.cos(-a) * 130, 130 + Math.sin(-a) * 130 + 6, GD) + op(seg(t, .5, .7), mark(true, 400, 60)); }}
];
F.ph_lever = [
  {d: 8, draw(t){ const a = -ease(seg(t, .2, .8)) * .2, P = [150, 186];
    const ex = (d) => [P[0] + Math.cos(a) * d, P[1] + Math.sin(a) * d];
    const L1 = ex(-80), L2 = ex(220);
    return ground(200) + `<path d="M${P[0]} ${P[1]} l-14 14 h28 Z" fill="${DK}"/>` + `<line x1="${r1(L1[0])}" y1="${r1(L1[1])}" x2="${r1(L2[0])}" y2="${r1(L2[1])}" stroke="#a16207" stroke-width="8" stroke-linecap="round"/>` +
      `<ellipse cx="${r1(L1[0] + 10)}" cy="${r1(L1[1] - 30)}" rx="40" ry="30" fill="#78716c" stroke="${DK}" stroke-width="1.5"/>` + vec(L2[0], L2[1] - 60, L2[0], L2[1] - 8, RD, 3) +
      L(r1(L2[0] + 10), r1(L2[1] - 64), T('قوة صغيرة', 'Small force'), RD, 'end', 14) + L(110, 230 - 6, 'd2', DK, 'middle', 14) + L(260, 230 - 6, 'd1', DK, 'middle', 14) + op(seg(t, .8, .95), L(220, 40, 'F1 · d1 = F2 · d2', BL, 'middle', 20)); }},
  {d: 7, draw(t){ const p = ease(seg(t, .1, .7)), d2 = 60 + p * 60, a = -10 * (1 - p);
    const g = `<g transform="rotate(${r1(a)} 220 156)"><rect x="60" y="150" width="320" height="8" rx="3" fill="#a16207" stroke="${DK}"/>` +
      box(220 - 120 - 24, 150, 48, 48, '#94a3b8', '200 N', '#1e293b') + box(220 + d2 - 22, 150, 44, 34, OR, '100 N', '#1e293b') + '</g>';
    return ground(196) + `<path d="M220 158 L196 196 H244 Z" fill="${DK}"/>` + g + op(seg(t, .75, .9), L(220, 50, '200 × 1 m = 100 × 2 m', BL, 'middle', 18) + mark(true, 400, 90)); }}
];
F.ph_balance = [
  {d: 8, draw(t){ const a = ease(seg(t, .05, .45)) * 30, fall = t > .5 ? ease(seg(t, .5, .8)) * 60 : 0, ang = a + fall;
    const cg = [Math.sin(ang * Math.PI / 180) * 60, -Math.cos(ang * Math.PI / 180) * 60];
    const pivot = [250, 196];
    return ground(196) + `<g transform="rotate(${r1(ang)} ${pivot[0]} ${pivot[1]})"><rect x="170" y="56" width="80" height="140" rx="3" fill="#d6a86a" stroke="${DK}" stroke-width="1.5"/><circle cx="210" cy="126" r="6" fill="${RD}"/></g>` +
      `<line x1="${r1(pivot[0] + Math.cos((ang - 90) * Math.PI / 180) * 0 + (210 - 250) * Math.cos(ang * Math.PI / 180) - (126 - 196) * Math.sin(ang * Math.PI / 180))}" y1="${r1(196 + (210 - 250) * Math.sin(ang * Math.PI / 180) + (126 - 196) * Math.cos(ang * Math.PI / 180))}" x2="${r1(pivot[0] + (210 - 250) * Math.cos(ang * Math.PI / 180) - (126 - 196) * Math.sin(ang * Math.PI / 180))}" y2="214" stroke="${RD}" stroke-dasharray="4 3" stroke-width="2"/>` +
      `<path d="M170 210 H250" stroke="${GD}" stroke-width="5"/>` + op(seg(t, .5, .6), L(110, 60, T('مركز الثقل برّه القاعدة', 'Centre of gravity outside the base'), RD, 'middle', 14)); }},
  {d: 8, draw(t){ const p = ease(seg(t, .1, .6)), cw = seg(t, .5, .7);
    const tip = (1 - cw) * p * 6;
    return ground(206) + `<g transform="rotate(${r1(tip)} 200 206)"><rect x="190" y="40" width="20" height="166" fill="${OR}" stroke="${DK}"/><rect x="${r1(120)}" y="34" width="260" height="12" fill="${OR}" stroke="${DK}"/>` +
      `<path d="M360 46 V${r1(110 + p * 40)}" stroke="${DK}" stroke-width="2"/>` + kg(360, 140 + p * 40, '', 1) + op(cw, `<rect x="124" y="46" width="40" height="40" fill="#475569" stroke="${DK}"/>` + L(144, 72, T('ثقل', 'Weight'), '#fff', 'middle', 12)) + '</g>' +
      op(seg(t, .75, .9), mark(true, 70, 100)); }}
];
F.ph_tmotor = [
  {d: 8, draw(t){ const A = t * TAU * 8, dr = A / 30, y = 200 - seg(t, .05, .95) * 90;
    return `<rect x="20" y="186" width="200" height="10" fill="#64748b"/>` + K2.motor(30, 116, A, .9) + K2.hshaft(117, 200, 145, 10, A) + K2.wheel(250, 145, 36, dr, P1) +
      `<path d="M286 145 V${r1(y - 30)}" stroke="${DK}" stroke-width="2"/>` + kg(286, y, '', 1) + vec(300, 145, 300, 180, RD) + L(306, 170, 'F', RD, 'start') + `<path d="M250 145 H286" stroke="${BL}" stroke-width="2.5"/>` + L(268, 136, 'r', BL) +
      card(140, 20, 120, 70, DK) + L(200, 48, 'N·m', BL, 'middle', 18) + L(200, 76, 'rpm', GD, 'middle', 18); }},
  {d: 5, draw(t){
    return big(220, 100, 'T = F · r', BL, 34) + op(seg(t, .3, .5), L(220, 160, T('الموتور بيدّي عزم', 'A motor gives torque'), DK, 'middle', 18)); }}
];

/* ================= lesson 9 · circular motion, gears ================= */
function disc(cx, cy, r, ang, c){ return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c || P1}" stroke="${DK}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="6" fill="${DK}"/><line x1="${cx}" y1="${cy}" x2="${r1(cx + Math.cos(ang) * r)}" y2="${r1(cy + Math.sin(ang) * r)}" stroke="${DK}" stroke-width="2"/>`; }
F.ph_rpm = [
  {d: 7, draw(t){ const ang = t * TAU * 6, n = Math.floor(t * 6);
    return disc(150, 120, 80, ang) + `<circle cx="${r1(150 + Math.cos(ang) * 80)}" cy="${r1(120 + Math.sin(ang) * 80)}" r="8" fill="${OR}" stroke="${DK}"/>` + K2.rotArrow(150, 120, 96, false, AC) +
      card(270, 50, 140, 50, BL) + L(340, 84, n + ' ' + T('لفّة', 'turns'), BL, 'middle', 20) + op(seg(t, .5, .7), card(270, 120, 140, 50, GD) + L(340, 154, '1450 rpm', GD, 'middle', 20)); }},
  {d: 6, draw(t){
    return big(220, 80, 'ω = 2π · n ÷ 60', BL, 28) + op(seg(t, .3, .5), L(220, 136, '1450 × 2π ÷ 60', DK, 'middle', 20)) + op(seg(t, .55, .75), big(220, 186, '≈ 152 rad/s', GD, 26)); }}
];
F.ph_tip = [
  {d: 7, draw(t){ const ang = t * TAU * 1.5, tr = (r, c) => { const pts = []; for (let k = 0; k <= 20; k++){ const a = ang - k * .06; pts.push([150 + Math.cos(a) * r, 120 + Math.sin(a) * r]); } return poly(pts, c, 5); };
    return disc(150, 120, 90, ang) + tr(40, BL) + tr(90, RD) + `<circle cx="${r1(150 + Math.cos(ang) * 40)}" cy="${r1(120 + Math.sin(ang) * 40)}" r="7" fill="${BL}"/><circle cx="${r1(150 + Math.cos(ang) * 90)}" cy="${r1(120 + Math.sin(ang) * 90)}" r="8" fill="${RD}"/>` +
      L(330, 80, T('قريب = أبطأ', 'Near = slower'), BL, 'middle', 16) + L(330, 120, T('بعيد = أسرع', 'Far = faster'), RD, 'middle', 16) + op(seg(t, .5, .7), L(330, 170, 'v = ω · r', GD, 'middle', 22)); }},
  {d: 7, draw(t){ const a = t * 30;
    return K2.loop(110, 120, 40, 330, 120, 40, a * 40, '#1f2937', OR, 6) + K2.wheel(110, 120, 40, a) + K2.wheel(330, 120, 40, a) + `<path d="M110 172 H150" stroke="${BL}" stroke-width="2"/>` + L(130, 192, 'D = 0.2 m', BL, 'middle', 14) +
      L(110, 50, '1450 rpm', DK, 'middle', 15) + op(seg(t, .4, .6), vec(200, 70, 260, 70, GD) + L(230, 58, '≈ 15 m/s', GD, 'middle', 18)); }}
];
F.ph_centri = [
  {d: 8, draw(t){ const cut = .6, ang = Math.min(t, cut) * TAU * 3, x0 = 160 + Math.cos(ang) * 90, y0 = 120 + Math.sin(ang) * 90;
    let o = `<circle cx="160" cy="120" r="90" fill="none" stroke="${P1}" stroke-dasharray="5 5" stroke-width="2"/><circle cx="160" cy="120" r="6" fill="${DK}"/>`;
    if (t < cut) return o + `<line x1="160" y1="120" x2="${r1(x0)}" y2="${r1(y0)}" stroke="${DK}" stroke-width="2"/>` + ball(x0, y0, 12) + vec(x0, y0, x0 + (160 - x0) * .45, y0 + (120 - y0) * .45, RD) + L(330, 60, T('شدّ للمركز', 'Pull to centre'), RD, 'middle', 16);
    const q = (t - cut) / (1 - cut) * 220, tx = -Math.sin(ang), ty = Math.cos(ang);
    return o + ball(x0 + tx * q, y0 + ty * q, 12) + `<line x1="160" y1="120" x2="${r1(160 + Math.cos(ang) * 30)}" y2="${r1(120 + Math.sin(ang) * 30)}" stroke="${DK}" stroke-width="2"/>` + L(330, 60, T('الحبل اتقطع', 'String cut'), DK, 'middle', 16) +
      poly([[x0, y0], [x0 + tx * q, y0 + ty * q]], OR, 2, '4 4'); }},
  {d: 6, draw(t){ const ang = t * TAU * 5;
    let o = `<rect x="110" y="30" width="220" height="190" rx="14" fill="#e2e8f0" stroke="${DK}" stroke-width="2"/><circle cx="220" cy="125" r="70" fill="#fff" stroke="${DK}" stroke-width="3"/>`;
    for (let k = 0; k < 10; k++){ const a = ang + k * TAU / 10; o += `<circle cx="${r1(220 + Math.cos(a) * 56)}" cy="${r1(125 + Math.sin(a) * 56)}" r="3" fill="${DK}"/>`; }
    for (let k = 0; k < 6; k++){ const q = (t * 3 + k / 6) % 1, a = k * 1.1; o += `<path transform="translate(${r1(220 + Math.cos(a) * (60 + q * 60))} ${r1(125 + Math.sin(a) * (60 + q * 60))})" d="M0 -5 c-3 4 -4 5 -4 7 a4 4 0 0 0 8 0 c0 -2 -1 -3 -4 -7z" fill="#38bdf8" opacity="${r1(1 - q)}"/>`; }
    return o; }},
  {d: 6, draw(t){ const A = t * TAU * 10, sh = Math.sin(A) * 4;
    return `<g transform="translate(0 ${r1(sh)})">${K2.motor(40, 100, A, 1)}${disc(250, 132, 50, A, P1)}<circle cx="${r1(250 + Math.cos(A) * 40)}" cy="${r1(132 + Math.sin(A) * 40)}" r="8" fill="${RD}" stroke="${DK}"/></g>` +
      `<rect x="30" y="196" width="280" height="8" fill="#64748b"/>` + op(seg(t, .2, .3), L(380, 80, '〰', RD, 'middle', 30) + L(380, 120, T('اهتزاز', 'Vibration'), RD, 'middle', 16)); }}
];
F.ph_gears = [
  {d: 8, draw(t){ const a = t * TAU * 3;
    return K2.gear(110, 120, 30, 10, a, '#9aa5b1') + K2.gear(224, 120, 90, 30, -a / 3 + .1, '#cbd5e1') + L(110, 70, 'z1 = 10', BL, 'middle', 15) + L(326, 50, 'z2 = 30', OR, 'start', 15) +
      op(seg(t, .3, .5), L(326, 180, 'n ÷ 3', OR, 'start', 17) + L(326, 208, 'T × 3', GD, 'start', 17)); }},
  {d: 7, draw(t){ const a = t * TAU * 2;
    return `<line x1="220" y1="20" x2="220" y2="220" stroke="${P1}" stroke-width="2"/>` + K2.gear(60, 120, 22, 9, a, '#9aa5b1') + K2.gear(60 + 22 + 60 - 4, 120, 60, 24, -a * 22 / 60, '#cbd5e1') + L(110, 210, T('تخفيض', 'Reduction'), GD, 'middle', 16) + L(110, 40, 'rpm ↓ · T ↑', GD, 'middle', 15) +
      K2.gear(290, 120, 60, 24, a * .5, '#cbd5e1') + K2.gear(290 + 60 + 22 - 4, 120, 22, 9, -a * .5 * 60 / 22, '#9aa5b1') + L(330, 210, T('تزويد', 'Step-up'), OR, 'middle', 16) + L(330, 40, 'rpm ↑ · T ↓', OR, 'middle', 15); }}
];
F.ph_prot = [
  {d: 7, draw(t){ const A = t * TAU * 8;
    return K2.motor(30, 100, A, 1) + K2.hshaft(126, 200, 132, 12, A) + card(220, 40, 200, 150, DK) + L(320, 74, 'T = 10 N·m', BL, 'middle', 17) + L(320, 102, 'ω = 152 rad/s', BL, 'middle', 17) +
      op(seg(t, .4, .6), L(320, 140, 'P = T · ω', DK, 'middle', 18) + L(320, 172, '≈ 1.5 kW', GD, 'middle', 22)); }},
  {d: 7, draw(t){ const g = ease(seg(t, .2, .6));
    const col = (x, nm, T_, n, P) => card(x, 30, 170, 170, DK) + L(x + 85, 58, nm, DK, 'middle', 15) + L(x + 85, 98, T_, BL, 'middle', 17) + L(x + 85, 132, n, OR, 'middle', 17) + L(x + 85, 172, P, GD, 'middle', 20);
    return col(30, T('الموتور', 'Motor'), '10 N·m', '1450 rpm', '1.5 kW') + vec(204, 115, 236, 115, DK) + op(g, col(240, T('بعد التروس', 'After gears'), '50 N·m', '290 rpm', '1.5 kW')); }}
];

/* ================= lesson 10 · pressure and hydraulics ================= */
F.ph_press = [
  {d: 8, draw(t){ const s = ease(seg(t, .2, .8));
    return `<rect x="10" y="150" width="420" height="82" fill="#fde68a"/>` + `<line x1="220" y1="20" x2="220" y2="230" stroke="${P1}" stroke-width="2"/>` +
      `<g transform="translate(0 ${r1(s * 40)})">${kg(110, 120, '60 kg', 1.2)}<rect x="106" y="120" width="8" height="30" fill="${DK}"/></g>` + L(110, 220, T('رفيع = بيغرز', 'Thin = sinks'), RD, 'middle', 15) +
      `<g transform="translate(0 ${r1(s * 4)})">${kg(330, 120, '60 kg', 1.2)}<rect x="290" y="120" width="80" height="30" fill="${DK}"/></g>` + L(330, 220, T('عريض = واقف', 'Wide = stays up'), GD, 'middle', 15); }},
  {d: 5, draw(t){
    return big(220, 90, 'p = F ÷ A', BL, 34) + op(seg(t, .3, .5), L(130, 160, 'A ↓ → p ↑', RD, 'middle', 22)) + op(seg(t, .55, .75), L(310, 160, 'A ↑ → p ↓', GD, 'middle', 22)); }}
];
function gauge(cx, cy, r, frac, c){ const a = Math.PI * (1 + frac);
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${DK}" stroke-width="3"/><path d="M${cx - r * .8} ${cy} A${r * .8} ${r * .8} 0 0 1 ${cx + r * .8} ${cy}" fill="none" stroke="${P1}" stroke-width="6"/>` +
    `<line x1="${cx}" y1="${cy}" x2="${r1(cx + Math.cos(a) * r * .75)}" y2="${r1(cy + Math.sin(a) * r * .75)}" stroke="${c || RD}" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="4" fill="${DK}"/>`; }
F.ph_units2 = [
  {d: 5, draw(t){
    return card(40, 50, 160, 130, BL) + big(120, 100, '1 Pa', BL, 28) + L(120, 140, '1 N/m²', DK, 'middle', 17) + op(seg(t, .35, .55), card(240, 50, 160, 130, GD) + big(320, 100, '1 bar', GD, 28) + L(320, 140, '100000 Pa', DK, 'middle', 17)); }},
  {d: 8, draw(t){ const rows = [['🌍', 1], ['🛞', 2.2], ['🚿', 3], ['🏗️', 200]];
    let o = '';
    rows.forEach(([ic, v], i) => { const cx = 66 + i * 103, a = ease(seg(t, i * .2, i * .2 + .2)), f = v > 10 ? .95 : v / 4;
      o += `<text x="${cx}" y="56" font-size="30" text-anchor="middle">${ic}</text>` + gauge(cx, 130, 40, f * a, v > 10 ? RD : BL) + op(a, L(cx, 200, v + ' bar', v > 10 ? RD : BL, 'middle', 17)); });
    return o; }}
];
F.ph_fluid = [
  {d: 8, draw(t){ const p = ease(seg(t, .05, .9)), y = 40 + p * 150, bar = (1 + p * 3).toFixed(1);
    let o = `<rect x="10" y="30" width="420" height="202" fill="#7dd3fc"/><rect x="10" y="30" width="420" height="202" fill="url(#)" opacity="0"/>`;
    for (let k = 0; k <= 3; k++) o += `<line x1="10" y1="${40 + k * 50}" x2="40" y2="${40 + k * 50}" stroke="#fff" stroke-width="2"/>` + L(46, 46 + k * 50, k * 10 + ' m', '#0c4a6e', 'start', 13);
    o += `<g transform="translate(${r1(180)} ${r1(y)})"><ellipse cx="0" cy="0" rx="26" ry="11" fill="${OR}" stroke="${DK}"/><circle cx="-30" cy="-2" r="9" fill="#f1c6a0" stroke="${DK}"/><rect x="-6" y="-17" width="22" height="8" rx="3" fill="#475569"/></g>`;
    return o + card(300, 40, 120, 56, DK) + L(360, 76, bar + ' bar', RD, 'middle', 20) + L(360, 120, 'p = ρ · g · h', '#0c4a6e', 'middle', 15); }},
  {d: 7, draw(t){ const a = seg(t, .1, .4);
    let o = `<rect x="60" y="40" width="120" height="170" fill="#7dd3fc" stroke="${DK}" stroke-width="3"/>` + ground(210);
    [[80, 30], [130, 70], [180, 110]].forEach(([y, L_], i) => { const len = L_ * a;
      const pts = []; for (let k = 0; k <= 12; k++){ const u = k / 12, x = 180 + u * len; pts.push([x, y + Math.pow(u * len / 60, 2) * 30]); }
      o += poly(pts, '#0ea5e9', 6 - i * 0 + 2); });
    return o + op(seg(t, .5, .7), L(330, 60, T('تحت = ضغط أعلى', 'Deeper = more pressure'), '#0c4a6e', 'middle', 16)); }}
];
F.ph_pascal = [
  {d: 9, draw(t){ const p = ease(seg(t, .1, .8)), s = p * 90, b = p * 18;
    let o = `<path d="M40 80 V200 H400 V60" fill="none" stroke="${DK}" stroke-width="3"/><rect x="42" y="${r1(90 + s)}" width="36" height="${r1(108 - s)}" fill="#fca5a5"/><rect x="42" y="198" width="356" height="0" fill="#fca5a5"/>`;
    o += `<rect x="78" y="160" width="220" height="38" fill="#fca5a5"/><rect x="298" y="${r1(110 - b)}" width="100" height="${r1(88 + b)}" fill="#fca5a5"/>`;
    o += `<rect x="40" y="${r1(80 + s)}" width="40" height="10" fill="${DK}"/><rect x="296" y="${r1(100 - b)}" width="104" height="10" fill="${DK}"/>` + vec(60, 40 + s, 60, 76 + s, BL) + L(70, 54 + s, 'F1', BL, 'start', 15);
    o += `<g transform="translate(${298} ${r1(100 - b)}) scale(.9) translate(0 -0)">${car(2, 0, 0, RD)}</g>`;
    return o + L(220, 228 - 6, T('مشوار طويل ← مشوار قصير', 'Long stroke → short stroke'), DK, 'middle', 14); }},
  {d: 6, draw(t){
    return big(220, 80, 'F1 ÷ A1 = F2 ÷ A2', BL, 26) + op(seg(t, .3, .5), L(220, 136, T('القوة تكبر', 'Force grows'), GD, 'middle', 19)) + op(seg(t, .55, .75), L(220, 176, T('والمشوار يقل', 'Stroke shrinks'), RD, 'middle', 19)); }}
];
F.ph_uses = [
  {d: 5, draw(t){ const p = Math.sin(seg(t, .1, .9) * Math.PI);
    return `<path d="M60 60 L${r1(90 + p * 30)} 170" stroke="${DK}" stroke-width="6" stroke-linecap="round"/><rect x="${r1(76 + p * 30)}" y="160" width="36" height="14" rx="3" fill="${DK}"/>` +
      `<path d="M120 120 H270 V120" fill="none" stroke="${RD}" stroke-width="5"/><circle cx="330" cy="120" r="60" fill="${P1}" stroke="${DK}" stroke-width="2"/>` + `<rect x="${r1(266 + p * 6)}" y="96" width="20" height="48" rx="4" fill="${RD}" stroke="${DK}"/>` + op(p, spark(330, 120, p)); }},
  {d: 5, draw(t){ const p = Math.sin(seg(t, .1, .9) * Math.PI), a = -10 - p * 30;
    return ground(206) + `<rect x="40" y="160" width="120" height="40" rx="6" fill="${OR}" stroke="${DK}"/>` + `<g transform="rotate(${r1(a)} 140 160)"><rect x="140" y="152" width="200" height="16" fill="${OR}" stroke="${DK}"/></g>` +
      `<g transform="rotate(${r1(a / 2 - 20)} 110 170)"><rect x="110" y="166" width="${r1(70 + p * 40)}" height="8" fill="${ST}" stroke="${DK}"/><rect x="110" y="163" width="60" height="14" fill="#475569"/></g>`; }},
  {d: 5, draw(t){ const p = ease(seg(t, .1, .7));
    return `<rect x="120" y="20" width="200" height="20" fill="#475569"/><rect x="${200}" y="40" width="40" height="${r1(30 + p * 70)}" fill="${ST}" stroke="${DK}"/><rect x="160" y="${r1(70 + p * 70)}" width="120" height="16" fill="#475569"/>` +
      ground(206) + `<rect x="170" y="${r1(156 + p * 24)}" width="100" height="${r1(50 - p * 24)}" fill="${RD}" stroke="${DK}"/>`; }},
  {d: 5, draw(t){ const p = ease(seg(t, .1, .8)), pump = Math.abs(Math.sin(t * 20)) * 12 * (t < .8 ? 1 : 0);
    return ground(206) + `<rect x="200" y="${r1(150 - p * 30)}" width="16" height="${r1(56 + p * 30)}" fill="${ST}" stroke="${DK}"/><rect x="160" y="${r1(120 - p * 30)}" width="96" height="30" rx="8" fill="${RD}" stroke="${DK}"/><rect x="236" y="${r1(70 - p * 30)}" width="20" height="56" rx="6" fill="${RD}" stroke="${DK}"/>` +
      `<path d="M216 190 L${r1(280)} ${r1(190 - pump)}" stroke="${DK}" stroke-width="5" stroke-linecap="round"/>`; }}
];

/* ================= lesson 11 · project: choose a winch motor ================= */
function winch(t, H){ const A = t * TAU * 8, y = 196 - H;
  return ground(206) + K2.motor(20, 150, A, .55) + K2.gearbox(84, 140, 52, 50, A, 3) + K2.wheel(170, 160, 20, A / 30, P1) + `<path d="M190 160 V40 H300 V${r1(y - 34)}" fill="none" stroke="${DK}" stroke-width="2"/>` +
    `<rect x="296" y="30" width="10" height="176" fill="${OR}" opacity=".0"/>` + kg(300, y, '500 kg', 1.3); }
F.ph_task = [
  {d: 8, draw(t){ const p = ease(seg(t, .05, .9)), H = p * 100;
    return winch(t, H) + `<path d="M350 196 V86" stroke="${BL}" stroke-dasharray="4 4" stroke-width="2"/>` + L(360, 146, '12 m', BL, 'start', 16) + watch(400, 196, 18, p) + L(374, 202, '20 s', DK, 'end', 15); }},
  {d: 7, draw(t){ const rows = [['🛢️', 'D = 0.3 m'], ['⚙️', 'η = 80%'], ['🔌', '1450 rpm']];
    let o = '';
    rows.forEach(([ic, v], i) => { const x = 30 + i * 132, a = seg(t, i * .25, i * .25 + .15);
      o += op(a, card(x, 60, 118, 120, DK) + `<text x="${x + 59}" y="110" font-size="34" text-anchor="middle">${ic}</text>` + L(x + 59, 154, v, BL, 'middle', 16)); });
    return o; }}
];
function step(n, a, b, c){ return {d: 6, draw(t){
  return `<circle cx="50" cy="50" r="24" fill="${AC}"/>` + L(50, 57, n, '#fff', 'middle', 20) + op(seg(t, 0, .2), L(220, 60, a, DK, 'middle', 22)) + op(seg(t, .3, .5), L(220, 120, b, BL, 'middle', 22)) + op(seg(t, .6, .8), big(220, 186, c, GD, 28)); }}; }
F.ph_plan = [
  step('1', 'F = m · g', '500 × 9.8', '= 4900 N'),
  step('2', 'v = h ÷ t', '12 ÷ 20', '= 0.6 m/s'),
  step('3', 'P = F · v ÷ η', '4900 × 0.6 ÷ 0.8', '≈ 3.7 kW → 4 kW'),
  step('4', 'n = v ÷ (π · D) × 60', 'T = F · r = 4900 × 0.15', '≈ 38 rpm · 735 N·m'),
  step('5', 'i = n1 ÷ n2', '1450 ÷ 38', '≈ 38')
];
F.ph_recap = [
  {d: 10, draw(t){ const rows = [['📏', 'm · kg · s'], ['🚗', 'v · a'], ['💪', 'F = m·a'], ['🔋', 'P = F·v'], ['🔧', 'T = F·r'], ['⚙️', 'n1 ÷ n2'], ['🛢️', 'p = F ÷ A']];
    let o = '';
    rows.forEach(([ic, v], i) => { const x = 22 + (i % 4) * 100, y = 26 + Math.floor(i / 4) * 102 + (i >= 4 ? 0 : 0), xx = i >= 4 ? x + 50 : x, a = seg(t, i * .12, i * .12 + .1);
      o += op(a, card(xx, y, 92, 92, AC) + `<text x="${xx + 46}" y="${y + 44}" font-size="30" text-anchor="middle">${ic}</text>` + L(xx + 46, y + 76, v, DK, 'middle', 13)); });
    return o; }}
];

})();
