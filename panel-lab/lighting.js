/* مصمّم الإضاءة: lighting-design exercises for the panel course (lessons 13–18).
   LT.mount(host, id, {lesson}) puts one exercise on the page: a display-only copy on top plays the solution on a loop
   («شاهد»), and the learner's own copy sits below («جرّب بنفسك»). Only the learner's copy marks progress.
   Needs panel.js (IL) loaded first. */
(function(){
'use strict';
const LT = window.LT = {};
const $ = IL.$, $$ = IL.$$, esc = IL.esc, fmt = IL.fmt;
const num = IL.num;

/* ================= data (typical teaching values; check the maker's photometric file before a real design) ================= */
const KP = [0.6, 0.8, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5];
const UF_PANEL = {bright:[.37, .45, .51, .57, .61, .67, .71, .74, .77, .79], mid:[.31, .39, .45, .51, .55, .62, .66, .69, .73, .75]};
const UF_HB = {bright:[.46, .53, .59, .64, .68, .74, .77, .80, .83, .85], mid:[.42, .49, .55, .60, .64, .70, .74, .77, .80, .82]};
const LUM = {
  panel:{name:'لوحة LED مربعة 60×60 سم', tag:'LED panel 36 W · 3600 lm', w:36, lm:3600, m:1, shr:1.5, uf:UF_PANEL, kind:'panel', size:0.6},
  hb100:{name:'كشاف هاي باي LED 100 W', tag:'High-bay 100 W · 14000 lm', w:100, lm:14000, m:2, shr:1.0, uf:UF_HB, kind:'hb', size:0.34},
  hb150:{name:'كشاف هاي باي LED 150 W', tag:'High-bay 150 W · 21000 lm', w:150, lm:21000, m:2, shr:1.0, uf:UF_HB, kind:'hb', size:0.4},
  hb200:{name:'كشاف هاي باي LED 200 W', tag:'High-bay 200 W · 28000 lm', w:200, lm:28000, m:2, shr:1.0, uf:UF_HB, kind:'hb', size:0.46}
};
/* fi: share of the light that reaches the work plane after reflections (evens out the point-by-point map) */
const ROOMS = {
  office:{name:'المكتب', L:12, W:8, H:3, wp:0.8, susp:0, E:500, U0:0.6, refl:'bright', MF:0.8, fi:0.35, cell:0.4, lpd:10, lum:'panel'},
  hall:{name:'عنبر الإنتاج', L:48, W:24, H:8, wp:0.8, susp:0.5, E:300, U0:0.6, refl:'mid', MF:0.7, fi:0.25, cell:1, lpd:6, lum:'hb150'}
};
LT.LUM = LUM; LT.ROOMS = ROOMS; LT.KP = KP;
const hm = r => r.H - r.susp - r.wp;
const roomK = r => r.L * r.W / (hm(r) * (r.L + r.W));
function ufOf(t, k){
  if (k <= KP[0]) return t[0];
  for (let i = 1; i < KP.length; i++) if (k <= KP[i]) return t[i - 1] + (t[i] - t[i - 1]) * (k - KP[i - 1]) / (KP[i] - KP[i - 1]);
  return t[t.length - 1];
}
LT.uf = ufOf;
/* edge: 'half' = S/2 from the wall (standard), 'full' = S from the wall (crowded in the middle) */
function rowPos(n, L, edge){
  if (n === 1) return {S:L, e:L / 2, p:[L / 2]};
  const S = edge === 'full' ? L / (n + 1) : L / n, o = edge === 'full' ? S : S / 2;
  return {S, e:o, p:Array.from({length:n}, (_, i) => o + S * i)};
}
function design(r, lumKey, cols, rows, edge){
  const lum = LUM[lumKey], X = rowPos(cols, r.L, edge), Y = rowPos(rows, r.W, edge), fx = [];
  Y.p.forEach(y => X.p.forEach(x => fx.push([x, y])));
  const h = hm(r), K = roomK(r), U = ufOf(lum.uf[r.refl], K), N = fx.length, A = r.L * r.W;
  const E = N * lum.lm * U * r.MF / A;
  const I0 = lum.lm * (lum.m + 1) / (2 * Math.PI), m = lum.m, st = r.cell;
  const nx = Math.round(r.L / st), ny = Math.round(r.W / st), D = [];
  let sum = 0;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++){
    const x = (i + 0.5) * st, y = (j + 0.5) * st; let e = 0;
    for (const f of fx){ const d2 = (x - f[0]) ** 2 + (y - f[1]) ** 2 + h * h; e += I0 * Math.pow(h, m + 1) / Math.pow(d2, (m + 3) / 2); }
    D.push([x, y, e]); sum += e;
  }
  const dm = sum / D.length || 1;
  let mn = Infinity, s = 0, n = 0;
  D.forEach(d => {
    d[2] = E * ((1 - r.fi) * d[2] / dm + r.fi);
    if (d[0] > 0.5 && d[0] < r.L - 0.5 && d[1] > 0.5 && d[1] < r.W - 0.5){ mn = Math.min(mn, d[2]); s += d[2]; n++; }
  });
  return {fx, map:D, N, E, U, K, h, Sx:X.S, Sy:Y.S, ex:X.e, ey:Y.e, shr:Math.max(X.S, Y.S) / h, Emin:mn, U0:mn / (s / n), P:N * lum.w, lpd:N * lum.w / A, lum, r, cols, rows, edge};
}
LT.design = design;

/* ================= shared drawing ================= */
function defs(){
  if (document.getElementById('lt-defs')) return;
  const d = document.createElement('div');
  d.innerHTML = `<svg id="lt-defs" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>
<linearGradient id="lt-frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6f7"/><stop offset=".5" stop-color="#c9cfd3"/><stop offset="1" stop-color="#9aa3a9"/></linearGradient>
<radialGradient id="lt-diff" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#fdf8e8"/><stop offset="1" stop-color="#ece6d2"/></radialGradient>
<radialGradient id="lt-fins" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#4b5359"/><stop offset=".85" stop-color="#2a3035"/><stop offset="1" stop-color="#1b1f22"/></radialGradient>
<radialGradient id="lt-lens" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#fff4c8"/><stop offset="1" stop-color="#f0d98a"/></radialGradient>
<linearGradient id="lt-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9ecee"/><stop offset=".45" stop-color="#b8bfc4"/><stop offset="1" stop-color="#7d868c"/></linearGradient>
<linearGradient id="lt-body" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd24a"/><stop offset=".5" stop-color="#ffc21a"/><stop offset="1" stop-color="#d99a00"/></linearGradient>
<linearGradient id="lt-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5359"/><stop offset="1" stop-color="#1f2428"/></linearGradient>
<linearGradient id="lt-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0" stop-opacity=".85"/><stop offset="1" stop-color="#fff3b0" stop-opacity=".05"/></linearGradient>
<linearGradient id="lt-lcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d8b4"/><stop offset="1" stop-color="#a9bd8f"/></linearGradient>
<pattern id="lt-tile" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#ece6da"/><path d="M24 0H0V24" fill="none" stroke="#d6cdbb" stroke-width="1"/></pattern>
<pattern id="lt-epoxy" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#c9cecf"/><circle cx="4" cy="6" r=".8" fill="#b5bbbd"/><circle cx="13" cy="12" r=".7" fill="#d8dcdd"/></pattern>
<pattern id="lt-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#e4e8ea"/><path d="M0 0V8" stroke="#c9d0d4" stroke-width="3"/></pattern>
</defs></svg>`;
  document.body.appendChild(d.firstChild);
}
LT.defs = defs;

/* false-colour scale relative to the target illuminance */
const CS = [[0, [31, 46, 120]], [0.5, [47, 110, 220]], [0.8, [39, 174, 96]], [1, [242, 201, 76]], [1.3, [242, 153, 74]], [1.7, [214, 69, 65]]];
function heat(ratio){
  let a = CS[0], b = CS[CS.length - 1];
  if (ratio <= a[0]) return `rgb(${a[1]})`;
  for (let i = 1; i < CS.length; i++) if (ratio <= CS[i][0]){ a = CS[i - 1]; b = CS[i]; break; }
  if (ratio >= b[0]) return `rgb(${b[1]})`;
  const t = (ratio - a[0]) / (b[0] - a[0]);
  return `rgb(${a[1].map((v, i) => Math.round(v + (b[1][i] - v) * t)).join(',')})`;
}
LT.heat = heat;
function legend(E){
  const st = [0.5, 0.8, 1, 1.3];
  return `<div class="lt-leg" dir="ltr"><span style="background:${heat(0.3)}">&lt; ${Math.round(E * 0.5)}</span>${st.map(s => `<span style="background:${heat(s)}">${Math.round(E * s)}</span>`).join('')}<span style="background:${heat(1.6)}">lx</span></div>`;
}

function fixtureSVG(lum, x, y, R, extra){
  if (lum.kind === 'panel'){
    const s = R;
    return `<g transform="translate(${x} ${y})" ${extra || ''}><rect x="${-s / 2 - 1}" y="${-s / 2 - 1}" width="${s + 2}" height="${s + 2}" rx="2" fill="url(#lt-frame)" stroke="#7d868c" stroke-width=".8"/><rect x="${-s / 2 + 2}" y="${-s / 2 + 2}" width="${s - 4}" height="${s - 4}" fill="url(#lt-diff)"/><path d="M${-s / 2 + 2} 0H${s / 2 - 2}M0 ${-s / 2 + 2}V${s / 2 - 2}" stroke="#e6dfc8" stroke-width=".6"/></g>`;
  }
  const r = R / 2, fins = Array.from({length:16}, (_, i) => { const a = i * Math.PI / 8; return `M${fmt(Math.cos(a) * r * 0.62, 2)} ${fmt(Math.sin(a) * r * 0.62, 2)}L${fmt(Math.cos(a) * r * 0.97, 2)} ${fmt(Math.sin(a) * r * 0.97, 2)}`; }).join('');
  return `<g transform="translate(${x} ${y})" ${extra || ''}><circle r="${r}" fill="url(#lt-fins)" stroke="#15191c" stroke-width=".8"/><path d="${fins}" stroke="#7b858b" stroke-width=".9"/><circle r="${fmt(r * 0.55, 2)}" fill="url(#lt-lens)" stroke="#c9b25a" stroke-width=".6"/><circle r="${fmt(r * 0.18, 2)}" fill="#fff" opacity=".9"/></g>`;
}

/* top-view plan of a room with furniture, an illuminance map and the luminaires */
function planSVG(D, o){
  o = o || {};
  const r = D.r, k = (o.w || 640) / r.L, Wp = r.L * k, Hp = r.W * k, lum = D.lum;
  const R = lum.kind === 'panel' ? Math.max(lum.size * k, 12) : Math.max(lum.size * k * 1.4, 22);
  let s = `<svg class="lt-plan" viewBox="-36 -58 ${fmt(Wp + 76, 1)} ${fmt(Hp + 98, 1)}" role="img" aria-label="${esc(o.label || 'مسقط أفقي للمكان وتوزيع الكشافات وخريطة الإضاءة')}">`;
  s += `<rect x="-10" y="-10" width="${fmt(Wp + 20, 1)}" height="${fmt(Hp + 20, 1)}" rx="3" fill="url(#lt-metal)" stroke="#6b7479"/>`;
  s += `<rect x="0" y="0" width="${fmt(Wp, 1)}" height="${fmt(Hp, 1)}" fill="url(#${r === ROOMS.office ? 'lt-tile' : 'lt-epoxy'})"/>`;
  s += furniture(r, k);
  if (o.map !== false){
    const c = r.cell * k;
    s += `<g opacity="${o.mapOp || 0.62}">` + D.map.map(d => `<rect x="${fmt((d[0] - r.cell / 2) * k, 1)}" y="${fmt((d[1] - r.cell / 2) * k, 1)}" width="${fmt(c + 0.4, 1)}" height="${fmt(c + 0.4, 1)}" fill="${heat(d[2] / r.E)}"/>`).join('') + `</g>`;
  }
  /* windows and door */
  s += `<path d="M${fmt(Wp * 0.15, 1)} -10H${fmt(Wp * 0.35, 1)}M${fmt(Wp * 0.55, 1)} -10H${fmt(Wp * 0.75, 1)}" stroke="#8fc3e6" stroke-width="6"/><path d="M${fmt(Wp - 10, 1)} ${fmt(Hp + 10, 1)}h-${fmt(Math.max(1 * k, 22), 1)}" stroke="#a0714a" stroke-width="7"/>`;
  if (o.extra) s += o.extra;
  D.fx.forEach((f, i) => { s += fixtureSVG(lum, fmt(f[0] * k, 1), fmt(f[1] * k, 1), R, o.fxAttr ? o.fxAttr(i) : ''); });
  if (o.after) s += o.after(k);
  /* dimensions */
  const t = 'font-family="IBM Plex Mono,monospace" font-size="13" fill="currentColor"';
  s += `<g ${t} text-anchor="middle"><text x="${fmt(Wp / 2, 1)}" y="${fmt(Hp + 34, 1)}">${r.L} m</text>${o.after ? '' : `<text transform="translate(${fmt(Wp + 26, 1)} ${fmt(Hp / 2, 1)}) rotate(90)">${r.W} m</text>`}</g>`;
  if (o.dims !== false && D.fx.length > 1 && D.cols > 1){
    const f0 = D.fx[0], f1 = D.fx[1], y = fmt(f0[1] * k - R / 2 - 7, 1);
    s += `<g stroke="var(--cur)" stroke-width="1.4" fill="none"><path d="M0 ${y}H${fmt(f0[0] * k, 1)}"/><path d="M${fmt(f0[0] * k, 1)} ${y}H${fmt(f1[0] * k, 1)}"/></g><g ${t} font-size="12" text-anchor="middle" style="fill:var(--cur)" font-weight="700"><text x="${fmt(f0[0] * k / 2, 1)}" y="${fmt(y - 4, 1)}">${fmt(D.ex, 2)}</text><text x="${fmt((f0[0] + f1[0]) * k / 2, 1)}" y="${fmt(y - 4, 1)}">S=${fmt(D.Sx, 2)}</text></g>`;
  }
  return s + `</svg>`;
}
function furniture(r, k){
  let s = '';
  if (r === ROOMS.office){
    for (let row = 0; row < 2; row++) for (let c = 0; c < 3; c++){
      const x = (1.6 + c * 3.6) * k, y = (1.7 + row * 3.4) * k;
      s += `<g transform="translate(${fmt(x, 1)} ${fmt(y, 1)})"><rect width="${fmt(2.8 * k, 1)}" height="${fmt(1.4 * k, 1)}" rx="3" fill="#cdb38e" stroke="#9b7f58"/><path d="M${fmt(1.4 * k, 1)} 0V${fmt(1.4 * k, 1)}" stroke="#9b7f58"/>` +
        [0.7, 2.1].map(cx => `<rect x="${fmt(cx * k - 0.25 * k, 1)}" y="${fmt(0.2 * k, 1)}" width="${fmt(0.5 * k, 1)}" height="${fmt(0.12 * k, 1)}" fill="#2a3035"/><circle cx="${fmt(cx * k, 1)}" cy="${fmt(1.75 * k, 1)}" r="${fmt(0.28 * k, 1)}" fill="#3f4a52"/>`).join('') + `</g>`;
    }
  } else {
    s += `<path d="M0 ${fmt(11.2 * k, 1)}H${fmt(r.L * k, 1)}M0 ${fmt(12.8 * k, 1)}H${fmt(r.L * k, 1)}" stroke="#f2c230" stroke-width="3" stroke-dasharray="10 6"/>`;
    for (let c = 0; c < 5; c++) for (let row = 0; row < 2; row++){
      const x = (3 + c * 9) * k, y = (row ? 15.5 : 3) * k;
      s += `<g transform="translate(${fmt(x, 1)} ${fmt(y, 1)})"><rect width="${fmt(6 * k, 1)}" height="${fmt(5.5 * k, 1)}" rx="3" fill="url(#lt-dark)" stroke="#15191c"/><rect x="${fmt(0.6 * k, 1)}" y="${fmt(0.6 * k, 1)}" width="${fmt(2 * k, 1)}" height="${fmt(1.2 * k, 1)}" fill="#e48a1e"/><rect x="${fmt(3.4 * k, 1)}" y="${fmt(2.5 * k, 1)}" width="${fmt(2 * k, 1)}" height="${fmt(2.2 * k, 1)}" fill="#59636a"/></g>`;
    }
  }
  return s;
}

/* ================= small UI helpers ================= */
function stepper(key, label, val, min, max){
  return `<div class="lt-f"><span>${label}</span><span class="lt-step" data-k="${key}"><button type="button" class="btn" data-d="-1" aria-label="أقل"${val <= min ? ' disabled' : ''}>−</button><b class="mono">${val}</b><button type="button" class="btn" data-d="1" aria-label="أكثر"${val >= max ? ' disabled' : ''}>+</button></span></div>`;
}
function seg(key, opts, cur){
  return `<span class="sgm lt-seg" data-k="${key}" role="group">${opts.map(o => `<button type="button" data-v="${o[0]}" aria-pressed="${o[0] === cur}">${o[1]}</button>`).join('')}</span>`;
}
function setVal(el, v){ el.value = v; el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); }
function li(ok, txt){ return `<li class="${ok ? 'ok' : 'bad'}">${txt}</li>`; }
const bd = s => `<bdi dir="ltr">${s}</bdi>`;
function doneMsg(ctx, ok, txt){ if (ok && !ctx.demo && ctx.lesson) IL.mark(ctx.lesson, 'sim'); return `<p class="msg ${ok ? 'ok' : ''} lt-res">${txt}</p>`; }

/* ================= exercises ================= */
const EX = {};

/* ---- 1. lux meter under a high-bay: inverse-square and cosine law ---- */
EX.meter = {
  title:'جهاز قياس الإضاءة تحت كشاف', lesson:'l13',
  goal:'ضع جهاز القياس تحت الكشاف مباشرة، ثم غيّر ارتفاع الكشاف حتى يقرأ الجهاز 300 lx تقريبًا (285 إلى 315).',
  build(host, ctx){
    const lum = LUM.hb150, I0 = lum.lm * (lum.m + 1) / (2 * Math.PI);
    const S = {h:3, x:2};
    host.innerHTML = `<div class="lt-ex"><p class="goal"><b class="k">المطلوب</b>${this.goal}</p><div class="lt-art lt-side"></div>
<div class="lt-ctl"><label class="lt-rng">ارتفاع الكشاف فوق الجهاز h <b class="mono lt-hv"></b><input type="range" class="lt-h" min="2" max="9" step="0.1" value="${S.h}"></label>
<label class="lt-rng">بُعد الجهاز أفقيًا عن الكشاف x <b class="mono lt-xv"></b><input type="range" class="lt-x" min="0" max="8" step="0.1" value="${S.x}"></label></div>
<div class="lt-read"></div><div class="lt-out"></div></div>`;
    const draw = () => {
      const h = S.h, x = S.x, d = Math.hypot(h, x), cs = h / d, th = Math.acos(cs) * 180 / Math.PI, I = I0 * Math.pow(cs, lum.m), E = I * cs / (d * d);
      const k = 34, fy = 330 - h * k, mx = 120 + x * k;
      const cone = `<path d="M108 ${fmt(fy + 8, 1)}L132 ${fmt(fy + 8, 1)}L${fmt(120 + h * k * 1.05, 1)} 330L${fmt(120 - h * k * 1.05, 1)} 330Z" fill="url(#lt-cone)"/>`;
      $('.lt-side', host).innerHTML = `<svg viewBox="0 0 620 360" role="img" aria-label="منظر جانبي: كشاف هاي باي على ارتفاع ${fmt(h, 1)} متر، وجهاز قياس الإضاءة على بعد ${fmt(x, 1)} متر، والقراءة ${Math.round(E)} لوكس" style="direction:ltr">
<rect width="620" height="10" fill="url(#lt-metal)"/><rect y="330" width="620" height="30" fill="url(#lt-epoxy)"/><path d="M0 330H620" stroke="#8d969b" stroke-width="2"/>
${cone}<path d="M120 10V${fmt(fy - 14, 1)}" stroke="#59636a" stroke-width="2.5"/>
<g transform="translate(120 ${fmt(fy, 1)})"><rect x="-10" y="-18" width="20" height="10" rx="2" fill="url(#lt-dark)"/><path d="M-26 -8H26L20 6H-20Z" fill="url(#lt-dark)" stroke="#15191c"/>${Array.from({length:9}, (_, i) => `<path d="M${-22 + i * 5.5} -7V3" stroke="#7b858b" stroke-width="1.2"/>`).join('')}<ellipse cx="0" cy="7" rx="20" ry="3.5" fill="url(#lt-lens)"/></g>
<path d="M120 ${fmt(fy + 8, 1)}L${fmt(mx, 1)} 268" stroke="var(--cur)" stroke-width="1.6" stroke-dasharray="5 4"/>
<g stroke="currentColor" stroke-width="1.2" fill="none"><path d="M70 ${fmt(fy + 8, 1)}V318M64 ${fmt(fy + 8, 1)}H76M64 318H76"/>${x > 0.3 ? `<path d="M120 348H${fmt(mx, 1)}M120 342V354M${fmt(mx, 1)} 342V354"/>` : ''}</g>
<g font-family="IBM Plex Mono,monospace" font-size="13" fill="currentColor"><text x="34" y="${fmt((fy + 330) / 2, 1)}">h=${fmt(h, 1)} m</text>${x > 0.3 ? `<text x="${fmt((120 + mx) / 2, 1)}" y="345" text-anchor="middle" font-size="12">x=${fmt(x, 1)} m</text>` : ''}<text x="600" y="40" text-anchor="end" style="fill:var(--cur)" font-weight="700">d=${fmt(d, 2)} m · θ=${fmt(th, 0)}°</text></g>
<g transform="translate(${fmt(mx, 1)} 330) scale(.62)"><rect x="-34" y="-96" width="68" height="96" rx="9" fill="url(#lt-body)" stroke="#9a6b00"/><rect x="-26" y="-84" width="52" height="30" rx="3" fill="url(#lt-lcd)" stroke="#5d6b4c"/><text x="22" y="-62" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="17" font-weight="600" fill="#1d2a12">${Math.round(E)}</text><text x="-22" y="-77" font-family="IBM Plex Mono,monospace" font-size="7" fill="#1d2a12">LUX</text><circle cx="-12" cy="-38" r="6" fill="#2a3035"/><circle cx="12" cy="-38" r="6" fill="#2a3035"/><rect x="-20" y="-22" width="40" height="8" rx="3" fill="#2a3035"/><ellipse cx="0" cy="-100" rx="16" ry="6" fill="#f7f7f2" stroke="#b5b5aa"/></g>
</svg>`;
      $('.lt-hv', host).textContent = fmt(h, 1) + ' m'; $('.lt-xv', host).textContent = fmt(x, 1) + ' m';
      $('.lt-read', host).innerHTML = `<div class="fx">I(θ) = I₀·cos²θ = ${Math.round(I0)} × ${fmt(cs * cs, 3)} = <b>${Math.round(I)} cd</b></div><div class="fx">E = I(θ)·cosθ / d² = ${Math.round(I)} × ${fmt(cs, 3)} / ${fmt(d * d, 2)} = <b>${Math.round(E)} lx</b></div>`;
      const ok = x <= 0.2 && Math.abs(E - 300) <= 15;
      $('.lt-out', host).innerHTML = `<ul class="chk">${li(x <= 0.2, 'الجهاز تحت الكشاف مباشرة (x = 0)')}${li(Math.abs(E - 300) <= 15, `القراءة 300 lx تقريبًا: الآن ${bd(Math.round(E) + ' lx')}`)}</ul>` +
        doneMsg(ctx, ok, ok ? `أحسنت: عند ${bd('h = ' + fmt(h, 1) + ' m')} يقرأ الجهاز ${bd(Math.round(E) + ' lx')}. لاحظ أن رفع الكشاف من 3 m إلى 6 m يقسم الإضاءة تحته على 4 تقريبًا.` : 'حرّك المؤشرين وراقب القراءة.');
    };
    host.addEventListener('input', e => { if (e.target.matches('.lt-h')) S.h = +e.target.value; else if (e.target.matches('.lt-x')) S.x = +e.target.value; else return; draw(); });
    draw();
    return {host, S, draw};
  },
  script(a){
    const H = $('.lt-h', a.host), X = $('.lt-x', a.host), out = [];
    out.push({say:'الكشاف على 3 m والجهاز بعيد عنه 2 m: الضوء يصل مائلًا فتقل القراءة.', ms:2200});
    [1.4, 0.8, 0.3, 0].forEach((v, i) => out.push({say:i ? '' : 'نقرّب الجهاز حتى يصبح تحت الكشاف مباشرة.', el:() => X, act:() => setVal(X, v), ms:600}));
    out.push({say:'تحت الكشاف على 3 m القراءة أكثر من 1100 lx، وهي أعلى بكثير من 300.', ms:2200});
    [3.6, 4.2, 4.8, 5.3, 5.8].forEach((v, i) => out.push({say:i ? '' : 'نرفع الكشاف: كل مضاعفة للارتفاع تقسم الإضاءة على 4.', el:() => H, act:() => setVal(H, v), ms:650}));
    out.push({say:'عند 5.8 m تقريبًا يقرأ الجهاز 300 lx. هذا قانون التربيع العكسي.', ms:3200});
    return out;
  }
};

/* ---- 2. required illuminance for every space in the factory ---- */
const SPACES = [
  {id:'hall', n:'عنبر الإنتاج', d:'تجميع متوسط الدقة', E:300, b:[0, 0, 36, 24]},
  {id:'insp', n:'طاولة الفحص', d:'فحص دقيق للقطع', E:750, b:[24, 15, 11, 8]},
  {id:'store', n:'المخزن', d:'تخزين بضائع', E:100, b:[36, 0, 24, 16]},
  {id:'elec', n:'غرفة اللوحات', d:'لوحات وقواطع', E:200, b:[36, 16, 12, 8]},
  {id:'wc', n:'دورات المياه', d:'', E:200, b:[48, 16, 12, 8]},
  {id:'park', n:'موقف السيارات المغطى', d:'', E:75, b:[36, 28, 24, 12]},
  {id:'corr', n:'الممر', d:'حركة الأشخاص', E:100, b:[0, 24, 60, 4]},
  {id:'office', n:'المكتب', d:'كتابة وكمبيوتر', E:500, b:[0, 28, 22, 12]},
  {id:'meet', n:'قاعة الاجتماعات', d:'', E:500, b:[22, 28, 14, 12]}
];
const LUXV = [75, 100, 200, 300, 500, 750];
EX.lux = {
  title:'مستوى الإضاءة المطلوب لكل مكان', lesson:'l14',
  goal:'اضغط كل مكان في مسقط المصنع، واختر له مستوى الإضاءة المتوسط المطلوب Em من جدول الدرس، ثم صحّح.',
  build(host, ctx){
    const S = {sel:'hall', ch:{}, checked:false};
    host.innerHTML = `<div class="lt-ex"><p class="goal"><b class="k">المطلوب</b>${this.goal}</p><div class="lt-art lt-bld"></div><div class="lt-pick"></div><div class="row lt-chkrow"><button type="button" class="btn pri lt-chk">صحّح إجاباتي</button><span class="note lt-cnt"></span></div><div class="lt-out"></div></div>`;
    const draw = () => {
      const k = 10.6;
      const rooms = SPACES.map(sp => {
        const [x, y, w, h] = sp.b, v = S.ch[sp.id], a = v ? Math.min(0.85, 0.12 + 0.55 * Math.log(v / 60) / Math.log(13)) : 0;
        const st = S.checked ? (v === sp.E ? 'var(--good)' : 'var(--bad)') : (S.sel === sp.id ? 'var(--cur)' : '#6b7479');
        const sw = S.checked || S.sel === sp.id ? 3.5 : 1.2;
        return `<g class="lt-room" data-r="${sp.id}" role="button" tabindex="0" aria-label="${esc(sp.n)}${v ? '، ' + v + ' لوكس' : ''}"><rect x="${fmt(x * k, 1)}" y="${fmt(y * k, 1)}" width="${fmt(w * k, 1)}" height="${fmt(h * k, 1)}" fill="${sp.id === 'insp' ? '#d9dcdd' : 'url(#lt-hatch)'}" stroke="${st}" stroke-width="${sw}"/>${v ? `<rect x="${fmt(x * k, 1)}" y="${fmt(y * k, 1)}" width="${fmt(w * k, 1)}" height="${fmt(h * k, 1)}" fill="#ffd54a" opacity="${fmt(a, 2)}" pointer-events="none"/>` : ''}<text class="ar" x="${fmt((x + w / 2) * k, 1)}" y="${fmt((y + h / 2) * k - (h > 5 ? 4 : -6), 1)}" text-anchor="middle" font-size="${w < 13 ? 15 : 20}" font-weight="700" fill="#152027">${esc(sp.n)}</text>${h > 5 ? `<text x="${fmt((x + w / 2) * k, 1)}" y="${fmt((y + h / 2) * k + 20, 1)}" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="18" font-weight="600" fill="${v ? '#7a4b00' : '#56656f'}">${v ? v + ' lx' : '؟'}</text>` : ''}</g>`;
      }).join('');
      $('.lt-bld', host).innerHTML = `<svg viewBox="-8 -8 652 440" role="img" aria-label="مسقط المصنع" style="direction:ltr"><rect x="-6" y="-6" width="648" height="436" fill="url(#lt-metal)"/>${rooms}</svg>`;
      const sp = SPACES.find(s => s.id === S.sel);
      $('.lt-pick', host).innerHTML = `<p class="lt-q"><b>${esc(sp.n)}</b>${sp.d ? ' · ' + esc(sp.d) : ''}: كم Em؟</p><div class="row lt-vals">${LUXV.map(v => `<button type="button" class="btn lt-v" data-v="${v}" aria-pressed="${S.ch[sp.id] === v}"${S.checked ? ' disabled' : ''}><bdi dir="ltr">${v} lx</bdi></button>`).join('')}</div>`;
      const n = Object.keys(S.ch).length;
      $('.lt-cnt', host).textContent = `اخترت لـ ${n} من ${SPACES.length} أماكن`;
      $('.lt-chkrow', host).hidden = S.checked;
      if (S.checked){
        const bad = SPACES.filter(s => S.ch[s.id] !== s.E), ok = !bad.length;
        $('.lt-out', host).innerHTML = `<ul class="chk">${SPACES.map(s => li(S.ch[s.id] === s.E, `${esc(s.n)}: ${S.ch[s.id] === s.E ? bd(s.E + ' lx') : `اخترت ${bd(S.ch[s.id] + ' lx')}، والمطلوب ${bd(s.E + ' lx')}`}`)).join('')}</ul>` +
          doneMsg(ctx, ok, ok ? 'ممتاز: كل الأماكن صحيحة. هذه هي أرقام البداية لكل حساب إضاءة.' : `أخطأت في ${bad.length}. راجع الجدول ثم حاول مرة أخرى.`) + (ok ? '' : '<button type="button" class="btn lt-again">حاول مرة أخرى</button>');
      } else $('.lt-out', host).innerHTML = '';
    };
    IL.onAct(host, '.lt-room', t => { if (S.checked) return; S.sel = t.dataset.r; draw(); });
    host.addEventListener('click', e => {
      const v = e.target.closest('.lt-v');
      if (v && !S.checked){ S.ch[S.sel] = +v.dataset.v; const nx = SPACES.find(s => !S.ch[s.id]); if (nx) S.sel = nx.id; draw(); return; }
      if (e.target.closest('.lt-chk')){ if (Object.keys(S.ch).length < SPACES.length){ $('.lt-cnt', host).textContent = 'اختر لكل الأماكن أولًا · ' + $('.lt-cnt', host).textContent; return; } S.checked = true; draw(); return; }
      if (e.target.closest('.lt-again')){ S.checked = false; S.ch = {}; S.sel = 'hall'; draw(); }
    });
    draw();
    return {host, S};
  },
  script(a){
    const out = [{say:'لكل مكان رقم إضاءة متوسطة مطلوب حسب طبيعة العمل فيه.', ms:1800}];
    SPACES.forEach(sp => {
      out.push({say:`${sp.n}${sp.d ? ' (' + sp.d + ')' : ''}: ${sp.E} lx.`, el:() => $(`.lt-room[data-r="${sp.id}"] rect`, a.host), act:() => { a.S.sel = sp.id; $(`.lt-room[data-r="${sp.id}"]`, a.host).dispatchEvent(new MouseEvent('click', {bubbles:true})); }, ms:600});
      out.push({el:() => $(`.lt-v[data-v="${sp.E}"]`, a.host), act:() => $(`.lt-v[data-v="${sp.E}"]`, a.host).click(), ms:900});
    });
    out.push({say:'ثم نضغط «صحّح إجاباتي».', el:() => $('.lt-chk', a.host), act:() => $('.lt-chk', a.host).click(), ms:3200});
    return out;
  }
};

/* ---- 3. lumen method for the office ---- */
EX.lumen = {
  title:'طريقة اللومن: عدد كشافات المكتب', lesson:'l15',
  goal:'المكتب 12 × 8 m وارتفاعه 3 m، والمطلوب 500 lx على سطح المكتب (0.8 m). الكشاف لوحة LED 3600 lm مركّبة في السقف. احسب Hm ثم K ثم اقرأ UF، واختر MF، ثم احسب عدد الكشافات N.',
  build(host, ctx){
    const r = ROOMS.office, lum = LUM.panel;
    const ans = {hm:hm(r), K:roomK(r), uf:ufOf(lum.uf.bright, roomK(r)), mf:0.8};
    ans.N = Math.ceil(r.E * r.L * r.W / (lum.lm * Math.round(ans.uf * 100) / 100 * ans.mf));
    const S = {checked:false};
    const row = (key, lab, unit, w) => `<label class="lt-in"><span>${lab}</span><span class="ltr"><input type="text" inputmode="decimal" class="inp lt-i" data-k="${key}" autocomplete="off" style="width:${w || 6}em"> ${unit}</span><i class="lt-ok"></i></label>`;
    host.innerHTML = `<div class="lt-ex"><p class="goal"><b class="k">المطلوب</b>${this.goal}</p>
<div class="grid2"><div class="lt-art">${sectionSVG()}</div><div class="tblw"><table class="tbl hm"><thead><tr><th>K</th>${KP.map(k => `<th>${k}</th>`).join('')}</tr></thead><tbody><tr><td>UF</td>${lum.uf.bright.map(u => `<td>${u.toFixed(2)}</td>`).join('')}</tr></tbody></table><p class="note" style="padding:4px 8px;margin:0;direction:rtl;text-align:right">جدول معامل الاستفادة UF لهذا الكشاف، والانعكاسات: سقف 0.7، جدران 0.5، أرضية 0.2. القيم بين عمودين تؤخذ بالتناسب.</p></div></div>
<div class="lt-form">${row('hm', 'ارتفاع الكشاف فوق سطح العمل Hm', 'm')}${row('K', 'دليل الغرفة K = L·W / (Hm·(L+W))', '')}${row('uf', 'معامل الاستفادة UF من الجدول', '')}
<label class="lt-in"><span>معامل الصيانة MF</span><select class="inp lt-i" data-k="mf"><option value="">اختر</option><option value="0.8">0.8 · مكان نظيف، تنظيف سنوي</option><option value="0.7">0.7 · مكان عادي</option><option value="0.6">0.6 · مكان متّسخ أو مغبّر</option></select><i class="lt-ok"></i></label>
${row('N', 'عدد الكشافات N (قرّب لأعلى)', 'كشاف', 5)}</div>
<div class="fx lt-live"></div><div class="row lt-chkrow"><button type="button" class="btn pri lt-chk">صحّح إجاباتي</button></div><div class="lt-out"></div></div>`;
    const get = k => { const el = $(`.lt-i[data-k="${k}"]`, host); return num(el.value); };
    const okOf = {hm:v => Math.abs(v - ans.hm) < 0.011, K:v => Math.abs(v - ans.K) <= 0.03, uf:v => Math.abs(v - ans.uf) <= 0.011, mf:v => v === 0.8, N:v => v === ans.N};
    const hint = {hm:'Hm = ارتفاع السقف − ارتفاع سطح العمل = 3 − 0.8', K:'K = (12 × 8) / (2.2 × (12 + 8))', uf:'K بين 2 و 2.5: خذ UF بين 0.67 و 0.71 بالتناسب', mf:'المكتب مكان نظيف بكشافات LED', N:'N = E·A / (Φ·UF·MF) ثم قرّب لأعلى'};
    const live = () => {
      const v = k => { const x = get(k); return isFinite(x) ? x : null; };
      const uf = v('uf'), mf = v('mf'), N = uf && mf ? 500 * 96 / (3600 * uf * mf) : null;
      $('.lt-live', host).innerHTML = `N = E·A / (Φ·UF·MF) = 500 × 96 / (3600 × ${uf != null ? uf : '<b>UF</b>'} × ${mf != null ? mf : '<b>MF</b>'})${N ? ' = <b>' + fmt(N, 2) + '</b>' : ''}`;
    };
    const check = () => {
      const res = Object.keys(okOf).map(k => [k, okOf[k](get(k))]);
      res.forEach(([k, ok]) => { const el = $(`.lt-i[data-k="${k}"]`, host).closest('.lt-in'); el.classList.toggle('ok', ok); el.classList.toggle('bad', !ok); $('.lt-ok', el).textContent = ok ? '✓' : hint[k]; });
      const all = res.every(x => x[1]);
      S.checked = all;
      $('.lt-out', host).innerHTML = doneMsg(ctx, all, all ? `صحيح: ${bd('N = ' + fmt(500 * 96 / (3600 * get('uf') * 0.8), 2))} فنحتاج ${bd(String(ans.N))} كشافًا. في الدرس القادم نوزّعها على السقف.` : 'بعض القيم تحتاج مراجعة: اقرأ التلميح تحت كل خانة، ثم صحّح مرة أخرى.');
    };
    host.addEventListener('input', e => { if (e.target.matches('.lt-i')) live(); });
    host.addEventListener('click', e => { if (e.target.closest('.lt-chk')) check(); });
    live();
    return {host, ans};
  },
  script(a){
    const I = k => $(`.lt-i[data-k="${k}"]`, a.host);
    return [
      {say:'الكشاف في السقف على 3 m، وسطح المكتب على 0.8 m، فالارتفاع الفعّال Hm = 2.2 m.', el:() => I('hm'), act:() => setVal(I('hm'), '2.2'), ms:2600},
      {say:'دليل الغرفة: K = 96 / (2.2 × 20) = 2.18.', el:() => I('K'), act:() => setVal(I('K'), '2.18'), ms:2600},
      {say:'K = 2.18 بين 2 و 2.5 في الجدول، فيكون UF ≈ 0.68.', el:() => I('uf'), act:() => setVal(I('uf'), '0.68'), ms:2600},
      {say:'المكتب نظيف وكشافاته LED، فمعامل الصيانة 0.8.', el:() => I('mf'), act:() => setVal(I('mf'), '0.8'), ms:2400},
      {say:'N = 48000 / 1958 = 24.5، ونقرّب لأعلى: 25 كشافًا.', el:() => I('N'), act:() => setVal(I('N'), '25'), ms:2600},
      {say:'ثم نضغط «صحّح إجاباتي».', el:() => $('.lt-chk', a.host), act:() => $('.lt-chk', a.host).click(), ms:3400}
    ];
  }
};
function sectionSVG(){
  const t = 'font-family="IBM Plex Mono,monospace" font-size="13" fill="currentColor"';
  return `<svg viewBox="0 0 420 250" role="img" aria-label="مقطع في المكتب: السقف على 3 متر، وسطح المكتب على 0.8 متر، والارتفاع الفعال 2.2 متر" style="direction:ltr">
<rect x="10" y="20" width="400" height="10" fill="url(#lt-metal)"/><rect x="10" y="220" width="400" height="14" fill="url(#lt-tile)"/>
${[90, 210, 330].map(x => `<rect x="${x - 22}" y="30" width="44" height="5" fill="url(#lt-frame)" stroke="#7d868c" stroke-width=".6"/><rect x="${x - 20}" y="34" width="40" height="3" fill="#fffbe6"/><path d="M${x - 20} 37L${x - 70} 162H${x + 70}L${x + 20} 37Z" fill="url(#lt-cone)" opacity=".7"/>`).join('')}
<rect x="150" y="162" width="130" height="7" fill="#cdb38e" stroke="#9b7f58"/><path d="M160 169V220M270 169V220" stroke="#9b7f58" stroke-width="4"/><rect x="190" y="146" width="44" height="16" rx="2" fill="#2a3035"/>
<path d="M10 162H410" stroke="var(--cur)" stroke-width="1.4" stroke-dasharray="6 4"/>
<g stroke="currentColor" stroke-width="1.2"><path d="M370 37V162M364 37H376M364 162H376"/><path d="M395 30V220M389 30H401M389 220H401"/><path d="M40 162V220M34 162H46M34 220H46"/></g>
<g ${t}><text x="362" y="104" text-anchor="end" style="fill:var(--cur)" font-weight="700">Hm = ?</text><text x="402" y="246" text-anchor="end">H = 3.0 m</text><text x="50" y="196">0.8 m</text><text x="14" y="156" font-size="11" style="fill:var(--cur)">سطح العمل</text></g></svg>`;
}

/* ---- 4 & 6. layout on the plan with a live illuminance map ---- */
function layoutEx(roomKey, cfg){
  return {
    title:cfg.title, lesson:cfg.lesson, goal:cfg.goal,
    build(host, ctx){
      const r = ROOMS[roomKey];
      const S = Object.assign({lum:r.lum, cols:3, rows:2, edge:'half'}, cfg.start || {});
      host.innerHTML = `<div class="lt-ex"><p class="goal"><b class="k">المطلوب</b>${cfg.goal}</p><div class="lt-ctl lt-lay"></div><div class="lt-art lt-pl"></div><div class="lt-legw"></div><div class="lt-read lt-nums"></div><div class="lt-out"></div></div>`;
      const draw = () => {
        const D = design(r, S.lum, S.cols, S.rows, S.edge), lum = D.lum;
        $('.lt-lay', host).innerHTML = (cfg.lums ? `<div class="lt-f"><span>الكشاف</span>${seg('lum', cfg.lums.map(k => [k, LUM[k].w + ' W']), S.lum)}</div>` : `<div class="lt-f"><span>الكشاف</span><b class="mono ltr">${esc(lum.tag)}</b></div>`) +
          stepper('cols', `عدد الكشافات في الطول (${r.L} m)`, S.cols, 1, cfg.max[0]) + stepper('rows', `عدد الصفوف في العرض (${r.W} m)`, S.rows, 1, cfg.max[1]) +
          `<div class="lt-f"><span>المسافة من الحائط</span>${seg('edge', [['half', 'نصف S'], ['full', 'S كاملة']], S.edge)}</div>`;
        $('.lt-pl', host).innerHTML = planSVG(D, {label:`مسقط ${r.name}: ${D.N} كشافًا، ${D.cols} في الطول و ${D.rows} في العرض`});
        $('.lt-legw', host).innerHTML = legend(r.E);
        const g = {E:D.E >= r.E, U0:D.U0 >= r.U0, shr:D.shr <= lum.shr + 1e-9, edge:S.edge === 'half', lpd:D.lpd <= r.lpd, N:!cfg.maxN || D.N <= cfg.maxN};
        $('.lt-nums', host).innerHTML = `<div class="fx">N = ${D.cols} × ${D.rows} = <b>${D.N}</b> · E<sub>avg</sub> = N·Φ·UF·MF / A = ${D.N} × ${lum.lm} × ${fmt(D.U, 2)} × ${r.MF} / ${r.L * r.W} = <b class="${g.E ? 'ok' : 'bad'}">${Math.round(D.E)} lx</b></div>
<div class="fx">S<sub>x</sub> = ${fmt(D.Sx, 2)} m · S<sub>y</sub> = ${fmt(D.Sy, 2)} m · S<sub>max</sub>/Hm = ${fmt(Math.max(D.Sx, D.Sy), 2)} / ${fmt(D.h, 1)} = <b class="${g.shr ? 'ok' : 'bad'}">${fmt(D.shr, 2)}</b> (≤ ${lum.shr})</div>
<div class="fx">E<sub>min</sub> = ${Math.round(D.Emin)} lx · U<sub>0</sub> = E<sub>min</sub>/E<sub>avg</sub> = <b class="${g.U0 ? 'ok' : 'bad'}">${fmt(D.U0, 2)}</b> · ${D.P} W / ${r.L * r.W} m² = <b class="${g.lpd ? 'ok' : 'bad'}">${fmt(D.lpd, 1)} W/m²</b></div>`;
        const all = Object.values(g).every(Boolean);
        $('.lt-out', host).innerHTML = `<ul class="chk">${li(g.E, `الإضاءة المتوسطة ${bd('≥ ' + r.E + ' lx')}`)}${li(g.U0, `التوحّد ${bd('U₀ ≥ ' + r.U0)}`)}${li(g.shr, `المسافة بين الكشافات ${bd('S ≤ ' + lum.shr + ' × Hm')}`)}${li(g.edge, 'المسافة من الحائط نصف المسافة بين الكشافات')}${li(g.lpd, `كثافة القدرة ${bd('≤ ' + r.lpd + ' W/m²')}`)}${cfg.maxN ? li(g.N, `لا تزد كثيرًا عن العدد المحسوب: ${bd('N ≤ ' + cfg.maxN)}`) : ''}</ul>` +
          doneMsg(ctx, all, all ? cfg.okText(D) : 'غيّر العدد والتوزيع حتى تتحقق كل الشروط. لاحظ الخريطة: الأزرق إضاءة ناقصة.');
      };
      host.addEventListener('click', e => {
        const b = e.target.closest('.lt-step button');
        if (b && !b.disabled){ const k = b.closest('.lt-step').dataset.k; S[k] += +b.dataset.d; draw(); return; }
        const s = e.target.closest('.lt-seg button');
        if (s){ S[s.closest('.lt-seg').dataset.k] = s.dataset.v; draw(); }
      });
      draw();
      return {host, S};
    },
    script:cfg.script
  };
}
const tapStep = (a, k, d) => ({el:() => $(`.lt-step[data-k="${k}"] button[data-d="${d}"]`, a.host), act:() => $(`.lt-step[data-k="${k}"] button[data-d="${d}"]`, a.host).click(), ms:700});
const tapSeg = (a, k, v, say, ms) => ({say, el:() => $(`.lt-seg[data-k="${k}"] button[data-v="${v}"]`, a.host), act:() => $(`.lt-seg[data-k="${k}"] button[data-v="${v}"]`, a.host).click(), ms:ms || 2400});
EX.layout = layoutEx('office', {
  title:'توزيع كشافات المكتب', lesson:'l16', maxN:28, max:[10, 8],
  goal:'وزّع كشافات المكتب على السقف: غيّر عددها في الطول والعرض حتى تتحقق كل الشروط. المحسوب في الدرس السابق 25 كشافًا.',
  okText:D => `ممتاز: ${D.cols} × ${D.rows} = ${D.N} كشافًا تعطي ${bd(Math.round(D.E) + ' lx')} بتوحّد ${bd(fmt(D.U0, 2))}. هذا توزيع صالح للتنفيذ.`,
  script(a){
    return [
      {say:'نبدأ بستة كشافات فقط: الخريطة زرقاء والإضاءة نحو 120 lx.', ms:2400},
      Object.assign(tapStep(a, 'cols', 1), {say:'نزيد الكشافات في الطول إلى 5.'}), tapStep(a, 'cols', 1),
      Object.assign(tapStep(a, 'rows', 1), {say:'ونزيد الصفوف في العرض إلى 5.'}), tapStep(a, 'rows', 1), Object.assign(tapStep(a, 'rows', 1), {ms:2400}),
      tapSeg(a, 'edge', 'full', 'لو تركنا مسافة S كاملة من الحائط تتجمع الكشافات في الوسط وتظلم الأطراف، فيسقط التوحّد.', 3200),
      tapSeg(a, 'edge', 'half', 'نعيدها إلى نصف S: 25 كشافًا تعطي أكثر من 500 lx بتوحّد جيد.', 3600)
    ];
  }
});
EX.project = layoutEx('hall', {
  title:'المشروع: إنارة عنبر الإنتاج', lesson:'l18', max:[16, 8], lums:['hb100', 'hb150', 'hb200'], start:{lum:'hb100', cols:6, rows:3},
  goal:'العنبر 48 × 24 m وارتفاعه 8 m، والكشافات معلّقة 0.5 m تحت السقف، والمطلوب 300 lx. اختر قدرة الكشاف وعدده وتوزيعه حتى تتحقق كل الشروط.',
  okText:D => `ممتاز: ${D.N} كشاف ${D.lum.w} W بقدرة ${bd(fmt(D.P / 1000, 2) + ' kW')} على لوحة الإنارة LTG DB، و ${bd(Math.round(D.E) + ' lx')} بتوحّد ${bd(fmt(D.U0, 2))}.`,
  script(a){
    return [
      {say:'18 كشافًا بقدرة 100 W لا تكفي: الإضاءة أقل من 120 lx، والمسافات أكبر من الارتفاع.', ms:2600},
      tapSeg(a, 'lum', 'hb150', 'نختار كشاف 150 W (21000 lm).', 1800),
      Object.assign(tapStep(a, 'cols', 1), {say:'نزيد الكشافات في الطول.'}), tapStep(a, 'cols', 1), Object.assign(tapStep(a, 'rows', 1), {say:'ونجعلها 4 صفوف، فتصبح المسافة بين الصفوف 6 m.', ms:2000}),
      {say:'8 × 4 = 32 كشافًا تعطي 298 lx: أقل قليلًا من المطلوب.', ms:2800},
      Object.assign(tapStep(a, 'cols', 1), {say:'9 × 4 = 36 كشافًا تعطي 336 lx، وكل الشروط متحققة.', ms:3800})
    ];
  }
});

/* ---- 5. lighting circuits for the production hall ---- */
const CC = ['#e4572e', '#2f80ed', '#27ae60', '#9b51e0', '#f2994a', '#00a3a3', '#d6336c', '#8d6e63', '#5c7cfa'];
const MCB = {B10:{In:10, max:5}, B16:{In:16, max:8}, C10:{In:10, max:8}, C16:{In:16, max:13}};
const CAB = {'1.5':10, '2.5':16, '4':25, '6':32};
const RHO = 0.0225, U0V = 230, PFD = 0.95, RISE = 6, DB = [0, 12];
LT.MCB = MCB; LT.CAB = CAB;
function cirCalc(pts, mcb, cab, w){
  const n = pts.length, I1 = w / (U0V * PFD), Ib = n * I1;
  if (!n) return {n, Ib:0, P:0, du:0, path:[]};
  /* daisy chain: DB → nearest luminaire → nearest remaining …, cable along x then y (+6 m rise at the board) */
  const rem = pts.slice(), path = [DB]; let cur = DB, sumLI = 0, left = n;
  while (rem.length){
    let bi = 0, bd2 = Infinity;
    rem.forEach((p, i) => { const d = Math.abs(p[0] - cur[0]) + Math.abs(p[1] - cur[1]); if (d < bd2){ bd2 = d; bi = i; } });
    const p = rem.splice(bi, 1)[0], len = bd2 + (cur === DB ? RISE : 0);
    sumLI += len * left * I1; left--; path.push(p); cur = p;
  }
  const du = 2 * RHO * sumLI / +cab / U0V * 100;
  return {n, Ib, P:n * w, du, path};
}
EX.circuit = {
  title:'دوائر إنارة العنبر', lesson:'l17',
  goal:'وزّع الـ 36 كشافًا (150 W) على دوائر من لوحة الإنارة LTG DB: اختر الدائرة ثم اضغط عمودًا أو صفًا أو كشافًا. اختر القاطع والكابل حتى تتحقق كل الشروط.',
  build(host, ctx){
    const r = ROOMS.hall, D = design(r, 'hb150', 9, 4, 'half'), w = LUM.hb150.w;
    const S = {as:Array(36).fill(0), brush:1, c:Array.from({length:9}, (_, i) => ({ph:'L' + (i % 3 + 1), mcb:'C16', cab:'1.5'}))};
    host.innerHTML = `<div class="lt-ex"><p class="goal"><b class="k">المطلوب</b>${this.goal}</p>
<div class="lt-ctl"><div class="lt-f"><span>الدائرة التي ترسم بها</span><span class="lt-br"></span></div><div class="lt-f"><span>لكل الدوائر</span><span class="row"><select class="inp lt-all" data-k="mcb" aria-label="القاطع لكل الدوائر"><option value="">القاطع…</option>${Object.keys(MCB).map(m => `<option>${m}</option>`).join('')}</select><select class="inp lt-all" data-k="cab" aria-label="الكابل لكل الدوائر"><option value="">الكابل…</option>${Object.keys(CAB).map(c => `<option value="${c}">${c} mm²</option>`).join('')}</select></span></div></div>
<div class="lt-art lt-pl"></div><div class="lt-cards"></div><div class="lt-out"></div></div>`;
    const res = () => S.c.map((c, i) => Object.assign(cirCalc(D.fx.filter((_, j) => S.as[j] === i + 1), c.mcb, c.cab, w), c));
    const draw = () => {
      const R = res(), k = 640 / r.L;
      $('.lt-br', host).innerHTML = S.c.map((_, i) => `<button type="button" class="lt-bb" data-b="${i + 1}" aria-pressed="${S.brush === i + 1}" style="--c:${CC[i]}">C${i + 1}</button>`).join('');
      const colHead = Array.from({length:9}, (_, i) => `<g class="lt-col" data-col="${i}" role="button" tabindex="0" aria-label="العمود ${i + 1}"><rect x="${fmt(D.fx[i][0] * k - 22, 1)}" y="-56" width="44" height="36" rx="7" fill="var(--panel)" stroke="var(--accent)" stroke-width="1.5"/><text x="${fmt(D.fx[i][0] * k, 1)}" y="-31" text-anchor="middle" font-size="19" font-weight="700" font-family="IBM Plex Mono,monospace" fill="currentColor">↓${i + 1}</text></g>`).join('');
      const rowHead = Array.from({length:4}, (_, j) => `<g class="lt-row" data-row="${j}" role="button" tabindex="0" aria-label="الصف ${j + 1}"><rect x="${fmt(r.L * k + 8, 1)}" y="${fmt(D.fx[j * 9][1] * k - 16, 1)}" width="32" height="32" rx="7" fill="var(--panel)" stroke="var(--accent)" stroke-width="1.5"/><text x="${fmt(r.L * k + 24, 1)}" y="${fmt(D.fx[j * 9][1] * k + 6, 1)}" text-anchor="middle" font-size="17" font-weight="700" font-family="IBM Plex Mono,monospace" fill="currentColor">←</text></g>`).join('');
      const routes = R.map((c, i) => c.path.length > 1 ? `<path d="${c.path.map((p, j) => j ? `H${fmt(p[0] * k, 1)}V${fmt(p[1] * k, 1)}` : `M${fmt(p[0] * k, 1)} ${fmt(p[1] * k, 1)}`).join('')}" fill="none" stroke="${CC[i]}" stroke-width="2.2" opacity=".85"/>` : '').join('');
      const db = `<g transform="translate(-30 ${fmt(DB[1] * k - 22, 1)})"><rect width="24" height="44" rx="2" fill="url(#lt-metal)" stroke="#59636a"/><rect x="4" y="6" width="16" height="10" fill="#2a3035"/><text x="12" y="34" text-anchor="middle" font-size="7" font-family="IBM Plex Mono,monospace" fill="#152027">LTG</text></g>`;
      $('.lt-pl', host).innerHTML = planSVG(D, {map:false, dims:false, label:'مسقط العنبر: 36 كشافًا ودوائرها',
        extra:routes,
        fxAttr:i => `class="lt-fx" data-i="${i}" role="button" tabindex="0" aria-label="كشاف ${i + 1}${S.as[i] ? '، الدائرة ' + S.as[i] : ''}"`,
        after:k2 => D.fx.map((f, i) => S.as[i] ? `<circle cx="${fmt(f[0] * k2, 1)}" cy="${fmt(f[1] * k2, 1)}" r="15" fill="none" stroke="${CC[S.as[i] - 1]}" stroke-width="4" pointer-events="none"/><text x="${fmt(f[0] * k2 + 12, 1)}" y="${fmt(f[1] * k2 - 10, 1)}" font-size="14" font-weight="700" font-family="IBM Plex Mono,monospace" fill="${CC[S.as[i] - 1]}" pointer-events="none">${S.as[i]}</text>` : '').join('') + colHead + rowHead + db});
      /* checks */
      const ph = {L1:0, L2:0, L3:0};
      R.forEach(c => { if (c.n) ph[c.ph] += c.P; });
      const used = R.map((c, i) => [c, i]).filter(x => x[0].n);
      const iss = c => { const m = MCB[c.mcb], o = []; if (c.n > m.max) o.push(`تيار البدء: ${c.mcb} يتحمل ${m.max} كشافات فقط`); if (c.Ib > 0.8 * m.In) o.push(`Ib أكبر من ${bd('0.8 × In')}`); if (m.In > CAB[c.cab]) o.push(`كابل ${bd(c.cab + ' mm²')} يحميه قاطع ${bd(CAB[c.cab] + ' A')} كحد أقصى`); if (c.du > 3) o.push(`هبوط الجهد أكبر من ${bd('3 %')}`); return o; };
      $('.lt-cards', host).innerHTML = used.length ? used.map(([c, i]) => { const o = iss(c); return `<div class="lt-card ${o.length ? 'bad' : 'ok'}" style="--c:${CC[i]}"><b class="lt-cn">C${i + 1}</b><span class="mono ltr">${c.n} × ${w} W = ${c.P} W · Ib = ${fmt(c.Ib, 2)} A</span>
<span class="row"><select class="inp lt-cs" data-i="${i}" data-k="ph" aria-label="الطور">${['L1', 'L2', 'L3'].map(p => `<option${p === c.ph ? ' selected' : ''}>${p}</option>`).join('')}</select><select class="inp lt-cs" data-i="${i}" data-k="mcb" aria-label="القاطع">${Object.keys(MCB).map(p => `<option${p === c.mcb ? ' selected' : ''}>${p}</option>`).join('')}</select><select class="inp lt-cs" data-i="${i}" data-k="cab" aria-label="الكابل">${Object.keys(CAB).map(p => `<option value="${p}"${p === c.cab ? ' selected' : ''}>${p} mm²</option>`).join('')}</select></span>
<span class="mono ltr">ΔU = ${fmt(c.du, 2)} %</span>${o.length ? `<span class="lt-iss">${o.join('<br>')}</span>` : '<span class="lt-iss ok">✓ الدائرة سليمة</span>'}</div>`; }).join('') : '<p class="note">لم توزّع أي كشاف بعد.</p>';
      const n0 = S.as.filter(x => !x).length, pv = Object.values(ph), mx = Math.max(...pv), mn = Math.min(...pv);
      const g = {all:!n0, cir:used.length && used.every(([c]) => !iss(c).length), bal:mx > 0 && (mx - mn) / mx <= 0.15};
      const ok = g.all && g.cir && g.bal;
      $('.lt-out', host).innerHTML = `<div class="fx">L1 = ${ph.L1} W · L2 = ${ph.L2} W · L3 = ${ph.L3} W</div><ul class="chk">${li(g.all, `كل الكشافات موزّعة${n0 ? ': باقي ' + n0 : ''}`)}${li(g.cir, 'كل دائرة: عدد الكشافات ضمن تيار بدء القاطع، و Ib ≤ 0.8 In، والقاطع يحمي الكابل، و ΔU ≤ 3 %')}${li(g.bal, `الأطوار الثلاثة متوازنة (الفرق ${bd('≤ 15 %')})`)}</ul>` +
        doneMsg(ctx, ok, ok ? `ممتاز: ${used.length} دوائر متوازنة على الأطوار الثلاثة، وكل دائرة سليمة.` : 'أكمل التوزيع وأصلح الدوائر المعلّمة بالأحمر.');
    };
    const assign = idx => { const all = idx.every(i => S.as[i] === S.brush); idx.forEach(i => { S.as[i] = all ? 0 : S.brush; }); };
    const nextBrush = () => { for (let b = 1; b <= 9; b++) if (!S.as.includes(b)){ S.brush = b; return; } };
    IL.onAct(host, '.lt-fx', t => { assign([+t.dataset.i]); draw(); });
    IL.onAct(host, '.lt-col', t => { const c = +t.dataset.col; assign([0, 1, 2, 3].map(j => j * 9 + c)); nextBrush(); draw(); });
    IL.onAct(host, '.lt-row', t => { const j = +t.dataset.row; assign(Array.from({length:9}, (_, c) => j * 9 + c)); nextBrush(); draw(); });
    host.addEventListener('click', e => { const b = e.target.closest('.lt-bb'); if (b){ S.brush = +b.dataset.b; draw(); } });
    host.addEventListener('change', e => {
      const s = e.target.closest('.lt-cs'); if (s){ S.c[+s.dataset.i][s.dataset.k] = s.value; draw(); return; }
      const a = e.target.closest('.lt-all'); if (a && a.value){ S.c.forEach(c => { c[a.dataset.k] = a.value; }); draw(); }
    });
    draw();
    return {host, S};
  },
  script(a){
    const all = k => $(`.lt-all[data-k="${k}"]`, a.host);
    const out = [{say:'كل دائرة تُرسم بلون. نضغط رأس كل عمود فتأخذ كشافاته الأربعة دائرة، وتنتقل الفرشاة للدائرة التالية.', ms:2600}];
    for (let c = 0; c < 9; c++) out.push({say:c === 3 ? 'الأطوار تتوزع L1 ثم L2 ثم L3، فيتوازن الحمل.' : '', el:() => $(`.lt-col[data-col="${c}"] rect`, a.host), act:() => $(`.lt-col[data-col="${c}"]`, a.host).dispatchEvent(new MouseEvent('click', {bubbles:true})), ms:700});
    out.push({say:'القاطع C16 مع كابل 1.5 mm² خطأ: الكابل لا يحميه إلا قاطع 10 A.', ms:2800});
    out.push({say:'نختار B10 لكل الدوائر: 4 كشافات تيارها 2.7 A.', el:() => all('mcb'), act:() => setVal(all('mcb'), 'B10'), ms:2400});
    out.push({say:'ونختار كابل 2.5 mm² ليبقى هبوط الجهد صغيرًا حتى آخر العنبر.', el:() => all('cab'), act:() => setVal(all('cab'), '2.5'), ms:3800});
    return out;
  }
};
LT.EX = EX;

/* ================= stage: watch on top, practise below ================= */
LT.mount = function(host, id, opt){
  opt = opt || {}; defs();
  const X = EX[id]; if (!X) return;
  host.classList.add('lt');
  host.innerHTML = `<div class="lt-watch"><p class="lt-h lt-hw">▶ شاهد الحل يعمل</p><div class="lt-dm"></div><p class="lt-say" aria-live="off"></p><div class="row lt-dbar"><button type="button" class="btn lt-pause">⏸ إيقاف مؤقت</button><button type="button" class="btn lt-rep">↺ من البداية</button></div><span class="lt-fing" aria-hidden="true"></span></div><p class="lt-h lt-hy">✋ الآن جرّب بنفسك</p><div class="lt-you"></div>`;
  const W = $('.lt-watch', host), dm = $('.lt-dm', host), say = $('.lt-say', host), fing = $('.lt-fing', host);
  dm.inert = true; dm.setAttribute('aria-hidden', 'true');
  X.build($('.lt-you', host), {lesson:opt.lesson || X.lesson});
  let run = 0, paused = false, vis = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(W);
  const active = () => vis && !paused && !document.hidden;
  const sleep = ms => new Promise(res => { let t = 0; const tick = () => { if (active()) t += 100; if (t >= ms) res(); else setTimeout(tick, 100); }; setTimeout(tick, 100); });
  async function point(el){
    if (!el || IL.reduced()){ fing.style.opacity = 0; return; }
    const a = W.getBoundingClientRect(), b = el.getBoundingClientRect();
    fing.style.left = (b.left - a.left + b.width / 2) + 'px'; fing.style.top = (b.top - a.top + b.height / 2) + 'px'; fing.style.opacity = 1;
    await sleep(600); fing.classList.add('tap'); await sleep(200); fing.classList.remove('tap');
  }
  async function play(){
    const my = ++run;
    const api = X.build(dm, {demo:true}), steps = X.script(api);
    say.textContent = ''; fing.style.opacity = 0;
    for (const s of steps){
      if (my !== run) return;
      if (s.say) say.textContent = s.say;
      if (s.el) await point(s.el());
      if (my !== run) return;
      if (s.act) s.act();
      await sleep(s.ms || 1200);
    }
    fing.style.opacity = 0;
    await sleep(3500);
    if (my === run) play();
  }
  $('.lt-pause', host).addEventListener('click', e => { paused = !paused; e.currentTarget.textContent = paused ? '▶ تشغيل' : '⏸ إيقاف مؤقت'; });
  $('.lt-rep', host).addEventListener('click', () => { paused = false; $('.lt-pause', host).textContent = '⏸ إيقاف مؤقت'; play(); });
  play();
};
})();
