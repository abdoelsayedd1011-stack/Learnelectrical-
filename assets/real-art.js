/* Realistic device drawings shared by all simulators.
   RA.defs() injects one hidden <svg> of gradients/filters; every drawing below is an SVG string
   positioned with translate(x y) and drawn inside a fixed box so it can replace a flat drawing 1:1. */
(function(){
const RA = window.RA = {};
const DEFS = `<svg id="ra-defs" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>
<linearGradient id="ra-plastic" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f5f5"/><stop offset="1" stop-color="#d2d6d8"/></linearGradient>
<linearGradient id="ra-plasticV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f7f7"/><stop offset="1" stop-color="#cdd1d4"/></linearGradient>
<linearGradient id="ra-grey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa1a6"/><stop offset=".08" stop-color="#c9ced1"/><stop offset="1" stop-color="#8d9499"/></linearGradient>
<linearGradient id="ra-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#454b50"/><stop offset="1" stop-color="#1c1f22"/></linearGradient>
<linearGradient id="ra-term" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3d40"/><stop offset="1" stop-color="#141618"/></linearGradient>
<linearGradient id="ra-termH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#141618"/><stop offset=".5" stop-color="#3a3d40"/><stop offset="1" stop-color="#141618"/></linearGradient>
<linearGradient id="ra-steelH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d7277"/><stop offset=".2" stop-color="#cdd2d6"/><stop offset=".4" stop-color="#f5f7f8"/><stop offset=".65" stop-color="#a7acb1"/><stop offset="1" stop-color="#55595d"/></linearGradient>
<linearGradient id="ra-steelV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d7277"/><stop offset=".2" stop-color="#cdd2d6"/><stop offset=".4" stop-color="#f5f7f8"/><stop offset=".65" stop-color="#a7acb1"/><stop offset="1" stop-color="#55595d"/></linearGradient>
<linearGradient id="ra-yelH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c7300"/><stop offset=".35" stop-color="#ffd23a"/><stop offset=".7" stop-color="#e8b100"/><stop offset="1" stop-color="#8a6500"/></linearGradient>
<linearGradient id="ra-chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#9ea4a9"/><stop offset=".55" stop-color="#d9dde0"/><stop offset="1" stop-color="#5f656a"/></linearGradient>
<linearGradient id="ra-alu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9da3a8"/><stop offset=".5" stop-color="#e3e6e8"/><stop offset="1" stop-color="#a3a9ad"/></linearGradient>
<linearGradient id="ra-rail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e9398"/><stop offset=".3" stop-color="#e2e5e7"/><stop offset=".55" stop-color="#9ea3a7"/><stop offset="1" stop-color="#70757a"/></linearGradient>
<radialGradient id="ra-screw" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#b7bcc0"/><stop offset="1" stop-color="#5d6166"/></radialGradient>
<radialGradient id="ra-dome" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".35" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></radialGradient>
<linearGradient id="ra-card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ddb276"/><stop offset=".6" stop-color="#c3904f"/><stop offset="1" stop-color="#9c6d35"/></linearGradient>
<linearGradient id="ra-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f9cc6"/><stop offset=".35" stop-color="#2f6fb3"/><stop offset="1" stop-color="#1b4675"/></linearGradient>
<linearGradient id="ra-steelD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c8389"/><stop offset=".3" stop-color="#5a6268"/><stop offset="1" stop-color="#3a4045"/></linearGradient>
<linearGradient id="ra-orange" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2c04a"/><stop offset=".5" stop-color="#e0a21b"/><stop offset="1" stop-color="#a87400"/></linearGradient>
<linearGradient id="ra-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2b880"/><stop offset="1" stop-color="#a7783f"/></linearGradient>
<pattern id="ra-thr" width="4.2" height="10" patternUnits="userSpaceOnUse"><rect width="1.5" height="10" x="2.4" fill="#000" opacity=".3"/><rect width=".8" height="10" x="1.2" fill="#fff" opacity=".35"/></pattern>
<pattern id="ra-vent" width="6" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.6" fill="#000" opacity=".28"/></pattern>
<filter id="ra-sh" x="-15%" y="-15%" width="140%" height="150%"><feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#000" flood-opacity=".3"/></filter>
<filter id="ra-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs></svg>`;
RA.defs = function(){
  if (document.getElementById('ra-defs')) return;
  const add = () => { if (!document.getElementById('ra-defs')) document.body.insertAdjacentHTML('afterbegin', DEFS); };
  document.body ? add() : document.addEventListener('DOMContentLoaded', add);
};
RA.defs();

const T = (x, y, s, sz, col, anc, wt, fam) => `<text x="${x}" y="${y}" font-family="${fam || 'Arial,Helvetica,sans-serif'}" font-size="${sz}" fill="${col}"${anc ? ` text-anchor="${anc}"` : ''}${wt ? ` font-weight="${wt}"` : ''}>${s}</text>`;
RA.T = T;
/* small 3-phase motor seen from the side, box 46×30 at (x,y): fins, terminal box, feet, shaft */
RA.minimotor = (x, y, w, h, col) => { w = w || 46; h = h || 30; return `<g transform="translate(${x} ${y})" filter="url(#ra-sh)"><rect x="${w * .1}" y="${h - 4}" width="${w * .7}" height="4" rx="1" fill="#3a3f43"/><rect x="0" y="${h * .16}" width="${w * .82}" height="${h * .72}" rx="${h * .22}" fill="${col || 'url(#ra-blue)'}"/>${[0, 1, 2, 3].map(k => `<path d="M${w * .1} ${h * (.3 + k * .14)}H${w * .74}" stroke="#000" stroke-opacity=".22" stroke-width="1.4"/>`).join('')}<rect x="${w * .26}" y="0" width="${w * .3}" height="${h * .22}" rx="1.5" fill="${col || 'url(#ra-blue)'}"/><rect x="${w * .82}" y="${h * .44}" width="${w * .18}" height="${h * .16}" fill="url(#ra-steelH)"/></g>`; };
/* one screw terminal: black pocket + slotted screw */
RA.screw = (x, y, r) => { r = r || 6; return `<g transform="translate(${x} ${y})"><circle r="${r + 1.6}" fill="#111"/><circle r="${r}" fill="url(#ra-screw)"/><path d="M${-r * .65} 0H${r * .65}M0 ${-r * .65}V${r * .65}" stroke="#4a4e52" stroke-width="${r * .24}" stroke-linecap="round"/></g>`; };
RA.led = (x, y, on, col, w, h) => `<rect x="${x}" y="${y}" width="${w || 10}" height="${h || 6}" rx="1.5" fill="${on ? col : '#26302a'}"${on ? ' filter="url(#ra-glow)"' : ''}/>`;
RA.rail = (x, y, w) => `<g transform="translate(${x} ${y})"><rect width="${w}" height="16" fill="url(#ra-rail)"/>${Array.from({length:Math.floor(w / 26)}, (_, i) => `<rect x="${8 + i * 26}" y="5" width="14" height="6" rx="3" fill="#5e6368"/>`).join('')}</g>`;

/* DIN-rail 24 V power supply, box w×h, terminals along the bottom edge (their labels sit just above it) */
RA.psu = (x, y, w, h, live) => { w = w || 110; h = h || 58; const ok = !(live && live.off); return `<g transform="translate(${x} ${y})" filter="url(#ra-sh)">
  <rect width="${w}" height="${h}" rx="4" fill="url(#ra-alu)" stroke="#7d8388"/>
  <rect x="5" y="4" width="${w * .52}" height="12" rx="2" fill="#24435f"/>${T(5 + w * .26, 13, 'PSU 24V DC', Math.min(8.5, w * .075), '#fff', 'middle', 700)}
  <rect x="${w * .52 + 10}" y="4" width="${w * .48 - 15}" height="12" fill="url(#ra-vent)"/>
  <circle cx="${w - 12}" cy="22" r="2.8" fill="${ok ? '#36d36a' : '#2b3a2e'}"${ok ? ' filter="url(#ra-glow)"' : ''}/>${T(w - 18, 24.5, 'DC OK', 5.5, '#3b4146', 'end', 700)}
  <rect x="0" y="${h - 22}" width="${w}" height="22" rx="3" fill="url(#ra-term)"/></g>`; };

/* compact PLC CPU (top part with power terminals), box w×h */
RA.cpu = (x, y, w, h, live) => { w = w || 130; h = h || 58; const run = !live || live.pwr !== false; return `<g transform="translate(${x} ${y})" filter="url(#ra-sh)">
  <rect width="${w}" height="${h}" rx="5" fill="url(#ra-plastic)" stroke="#a9aeb2"/><rect width="${w * .16}" height="${h}" rx="5" fill="#e3e5e6"/><path d="M${w * .16} 0V${h}" stroke="#bfc3c6"/>
  ${T(w * .58, 14, 'CPU · DC/DC/DC', 8, '#3b4146', 'middle', 700)}
  ${RA.led(w * .2, 20, run, '#36d36a', 8, 5)}${T(w * .2 + 11, 25, 'RUN', 6, '#555')}${RA.led(w * .2 + 34, 20, false, '#ff4a3d', 8, 5)}${T(w * .2 + 45, 25, 'ERR', 6, '#555')}
  <rect x="${w * .16 + 4}" y="${h - 22}" width="${w * .84 - 8}" height="22" rx="3" fill="url(#ra-term)"/></g>`; };

/* I/O module, box w×h; leds: [{y (absolute), k, c}] — terminals column sits on the left edge */
RA.card = (x, y, w, h, title, leds, live) => `<g transform="translate(${x} ${y})"><g filter="url(#ra-sh)">
  <rect width="${w}" height="${h}" rx="5" fill="url(#ra-plasticV)" stroke="#a9aeb2"/>
  <rect x="5" y="24" width="22" height="${h - 30}" rx="3" fill="url(#ra-termH)"/>
  <rect x="${w - 36}" y="24" width="24" height="${h - 30}" rx="3" fill="#2b3034"/><rect x="${w - 34}" y="26" width="20" height="10" fill="#fff" opacity=".07"/></g>
  ${T(w / 2, 15, title, 9.5, '#2a3035', 'middle', 700)}
  ${leds.map(l => RA.led(w - 30, l.y - y - 4, live[l.k], l.c || '#36d36a', 12, 8)).join('')}</g>`;

/* M18 proximity sensor lying horizontally (face on the left), box 100×22 + cable going right/down */
RA.prox = (x, y, kind, live) => `<g transform="translate(${x} ${y})">
  ${live.target ? '<g filter="url(#ra-sh)"><rect x="-26" y="-4" width="16" height="30" rx="2" fill="url(#ra-steelV)"/></g>' : ''}
  <g filter="url(#ra-sh)"><rect x="0" y="2" width="8" height="18" rx="2" fill="url(#ra-yelH)"/>
  <rect x="8" y="1" width="54" height="20" fill="url(#ra-steelH)"/><rect x="8" y="1" width="54" height="20" fill="url(#ra-thr)"/>
  <rect x="18" y="-2" width="9" height="26" rx="1.5" fill="url(#ra-alu)" stroke="#7d8388" stroke-width=".6"/><rect x="44" y="-2" width="9" height="26" rx="1.5" fill="url(#ra-alu)" stroke="#7d8388" stroke-width=".6"/>
  <rect x="62" y="1" width="20" height="20" fill="#f4f4f2"/>${T(72, 9, kind, 6.5, '#222', 'middle', 700)}${T(72, 17, 'NO', 5.5, '#555', 'middle')}
  <rect x="82" y="2" width="14" height="18" rx="2" fill="url(#ra-yelH)"/><circle cx="89" cy="7" r="2.6" fill="${live.target ? '#ff7a00' : '#6b4a00'}"${live.target ? ' filter="url(#ra-glow)"' : ''}/>
  <rect x="96" y="5" width="6" height="12" fill="#1b1c1e"/></g>
  <path d="M102 11h6c4 0 4 4 4 8v16" fill="none" stroke="#111" stroke-width="6" stroke-linecap="round"/></g>`;

/* row of terminal blocks (feed-through), n blocks, pitch g */
RA.terms = (x, y, n, g, cols) => `<g transform="translate(${x} ${y})" filter="url(#ra-sh)">${Array.from({length:n}, (_, i) => `<rect x="${i * g}" y="0" width="${g - 1}" height="18" rx="1.5" fill="${(cols && cols[i]) || '#8e9398'}"/><rect x="${i * g}" y="0" width="${g - 1}" height="3" fill="#fff" opacity=".35"/>`).join('')}</g>`;

/* 22 mm push button with contact block, box 70×34 */
RA.pb = (x, y, pressed, lbl, col) => { col = col || '#24b04b'; return `<g transform="translate(${x} ${y})">
  <g filter="url(#ra-sh)"><rect width="70" height="34" rx="5" fill="url(#ra-dark)"/><rect x="3" y="3" width="64" height="3" rx="1.5" fill="#fff" opacity=".12"/>
  <circle cx="35" cy="17" r="14" fill="url(#ra-chrome)"/><circle cx="35" cy="17" r="11.2" fill="#2a2d30"/>
  <circle cx="35" cy="${pressed ? 18 : 17}" r="${pressed ? 9.4 : 10.2}" fill="${col}"/><circle cx="35" cy="${pressed ? 18 : 17}" r="${pressed ? 9.4 : 10.2}" fill="url(#ra-dome)"/></g>
  ${lbl ? `<text x="78" y="21" class="ar" style="font-size:10px;fill:var(--ink,#222)">${lbl}</text>` : ''}</g>`; };

/* small contactor seen from the front, box 76×40 (coil A1/A2 terminals sit under it) */
RA.contactor = (x, y, lbl, on) => `<g transform="translate(${x} ${y})"><g filter="url(#ra-sh)">
  <rect width="76" height="40" rx="4" fill="url(#ra-plastic)" stroke="#a9aeb2"/>
  <rect x="3" y="2" width="70" height="8" rx="2" fill="url(#ra-term)"/><rect x="3" y="30" width="70" height="8" rx="2" fill="url(#ra-term)"/>
  <rect x="24" y="12" width="28" height="16" rx="2" fill="#3b4146"/><rect x="27" y="14" width="22" height="12" rx="1" fill="#1b1e20"/>
  <rect x="31" y="${on ? 18 : 15}" width="14" height="6" rx="1" fill="#ffc21a"/>
  ${T(12, 22, 'KM', 7, '#555', 'middle', 700)}${T(64, 22, '24V', 6, '#555', 'middle')}</g>
  <text x="84" y="18" class="ar" style="font-size:10px;fill:var(--ink,#222)">${lbl}</text><text x="84" y="32" style="font:600 9px var(--font-mono,monospace);fill:${on ? '#2b7a3d' : 'var(--muted,#777)'}">${on ? 'ON' : 'OFF'}</text></g>`;

/* 22 mm pilot lamp seen from the front, centre (x,y), radius r */
RA.lamp = (x, y, r, col, on) => `<g transform="translate(${x} ${y})" filter="url(#ra-sh)">
  <circle r="${r + 3}" fill="url(#ra-chrome)"/><circle r="${r}" fill="${on ? col : '#3a3f43'}"${on ? ' filter="url(#ra-glow)"' : ''}/>
  ${on ? '' : `<circle r="${r}" fill="${col}" opacity=".28"/>`}<circle r="${r}" fill="url(#ra-dome)"/></g>`;

/* 2-pole MCB feeding 230 V AC, box w×h with terminals along the bottom edge */
RA.mcb = (x, y, w, h) => `<g transform="translate(${x} ${y})" filter="url(#ra-sh)">
  <rect width="${w}" height="${h}" rx="4" fill="url(#ra-plastic)" stroke="#a9aeb2"/>
  <rect x="${w / 2 - 13}" y="4" width="26" height="20" rx="3" fill="#2a2e31"/><rect x="${w / 2 - 9}" y="6" width="18" height="8" rx="2" fill="#e9eaea"/>
  ${T(6, 13, 'C10', 7.5, '#3b4146', '', 700)}${T(w - 5, 13, '230V', 6.5, '#b3261e', 'end', 700)}${T(6, 23, 'MCB', 6, '#6a6e72')}${T(w - 5, 23, 'AC', 6, '#6a6e72', 'end')}
  <rect x="0" y="${h - 22}" width="${w}" height="22" rx="3" fill="url(#ra-term)"/></g>`;

/* ---- machine parts used by the PLC plant scenes ---- */
/* conveyor: aluminium frame, rubber belt with moving cleats (ph = belt phase 0..20), rollers at both ends */
RA.belt = (x, y, w, ph) => { let c = ''; for (let k = -20 + (ph || 0); k < w - 6; k += 20) if (k > 4) c += `<rect x="${k.toFixed(1)}" y="1.5" width="3" height="5" fill="#3a3f43"/>`;
  return `<g transform="translate(${x} ${y})"><g filter="url(#ra-sh)"><rect x="0" y="0" width="${w}" height="8" rx="4" fill="#1d2022"/>${c}<rect x="0" y="8" width="${w}" height="7" fill="url(#ra-alu)" stroke="#7d8388" stroke-width=".6"/>
  ${Array.from({length:Math.floor(w / 60)}, (_, i) => `<circle cx="${30 + i * 60}" cy="11.5" r="1.6" fill="#55595d"/>`).join('')}<circle cx="5" cy="5" r="6" fill="url(#ra-chrome)" stroke="#55595d"/><circle cx="${w - 5}" cy="5" r="6" fill="url(#ra-chrome)" stroke="#55595d"/>
  <rect x="14" y="15" width="6" height="${Math.max(6, 18)}" fill="url(#ra-grey)"/><rect x="${w - 20}" y="15" width="6" height="18" fill="url(#ra-grey)"/></g></g>`; };
/* cardboard box (or blue crate when col given), bottom-left at (x,y+h) */
RA.box = (x, y, w, h, col, op) => `<g transform="translate(${x} ${y})"${op != null ? ` opacity="${op}"` : ''}><rect width="${w}" height="${h}" rx="1.5" fill="${col || '#c98a3c'}" stroke="${col ? '#1d3f66' : '#7a4f17'}" stroke-width=".8"/><rect width="${w}" height="${h}" rx="1.5" fill="url(#ra-dome)" opacity=".45"/>${col ? `<path d="M3 ${h * .3}h${w - 6}M3 ${h * .6}h${w - 6}" stroke="#000" stroke-opacity=".25"/>` : `<rect x="${w / 2 - 2.5}" y="0" width="5" height="${h}" fill="#e4c08a" opacity=".8"/>`}</g>`;
/* photo-eye sensor housing (lens on the side the beam leaves) */
RA.eye = (x, y, w, h, on) => `<g transform="translate(${x} ${y})" filter="url(#ra-sh)"><rect width="${w}" height="${h}" rx="2" fill="url(#ra-dark)"/><rect x="1.5" y="1.5" width="${w - 3}" height="3" rx="1" fill="#fff" opacity=".18"/><circle cx="${w / 2}" cy="${h * .62}" r="${Math.min(w, h) * .26}" fill="#5b2a2a" stroke="#888" stroke-width=".6"/><circle cx="${w / 2}" cy="${h * .2}" r="1.4" fill="${on ? '#ffb300' : '#4a3a10'}"/></g>`;
/* stainless tank shell (content is drawn on top by the caller) */
RA.tank = (x, y, w, h) => `<g transform="translate(${x} ${y})"><g filter="url(#ra-sh)"><rect x="-3" y="-3" width="${w + 6}" height="${h + 6}" rx="8" fill="url(#ra-steelV)"/><rect width="${w}" height="${h}" rx="5" fill="#dfe8ee"/>
  <rect x="-5" y="-5" width="${w + 10}" height="6" rx="2" fill="url(#ra-grey)"/><rect x="10" y="${h + 3}" width="7" height="10" fill="url(#ra-grey)"/><rect x="${w - 17}" y="${h + 3}" width="7" height="10" fill="url(#ra-grey)"/></g>
  <rect x="${w * .08}" y="3" width="${w * .05}" height="${h - 6}" fill="#fff" opacity=".45"/></g>`;
/* pipe along path d: dark body + light highlight; col = flowing liquid colour when on */
RA.pipe = (d, col) => `<path d="${d}" fill="none" stroke="#6d7277" stroke-width="7" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col || '#c9ced2'}" stroke-width="3.6" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1" stroke-linejoin="round" transform="translate(-.8 -.8)"/>`;
/* 2/2 solenoid valve: brass body + black coil, centre (x,y) */
RA.valve = (x, y, on) => `<g transform="translate(${x} ${y})" filter="url(#ra-sh)"><rect x="-13" y="-6" width="26" height="14" rx="3" fill="#c9a43a"/><rect x="-13" y="-6" width="26" height="4" rx="2" fill="#fff" opacity=".35"/><rect x="-8" y="-22" width="16" height="17" rx="2" fill="url(#ra-dark)"/><circle cx="0" cy="-17" r="2" fill="${on ? '#36d36a' : '#2b3a2e'}"${on ? ' filter="url(#ra-glow)"' : ''}/></g>`;
/* small car seen from the side, centre (x,y) */
RA.car = (x, y, col, sc) => `<g transform="translate(${x} ${y}) scale(${sc || 1})" filter="url(#ra-sh)"><path d="M-27 6V-2q0-4 4-5l8-1 7-8q2-2 5-2h16q4 0 6 3l6 7h3q5 1 5 6V6Z" fill="${col}"/><path d="M-27 6V-2q0-4 4-5l8-1 7-8q2-2 5-2h16q4 0 6 3l6 7h3q5 1 5 6V6Z" fill="url(#ra-dome)" opacity=".6"/><path d="M-12 -8l6-7h9v7Z M6 -8v-7h8l5 7Z" fill="#bcd3e6"/><circle cx="-15" cy="7" r="6" fill="#111"/><circle cx="-15" cy="7" r="2.6" fill="url(#ra-chrome)"/><circle cx="16" cy="7" r="6" fill="#111"/><circle cx="16" cy="7" r="2.6" fill="url(#ra-chrome)"/><rect x="25" y="-4" width="4" height="3" rx="1" fill="#ffe7a0"/></g>`;
})();
