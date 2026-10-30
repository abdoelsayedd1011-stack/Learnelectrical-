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
<radialGradient id="ra-screw" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#d3d7da"/><stop offset=".75" stop-color="#8e9398"/><stop offset="1" stop-color="#4f5459"/></radialGradient>
<radialGradient id="ra-dome" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".35" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></radialGradient>
<linearGradient id="ra-card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ddb276"/><stop offset=".6" stop-color="#c3904f"/><stop offset="1" stop-color="#9c6d35"/></linearGradient>
<linearGradient id="ra-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f9cc6"/><stop offset=".35" stop-color="#2f6fb3"/><stop offset="1" stop-color="#1b4675"/></linearGradient>
<linearGradient id="ra-steelD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c8389"/><stop offset=".3" stop-color="#5a6268"/><stop offset="1" stop-color="#3a4045"/></linearGradient>
<linearGradient id="ra-orange" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2c04a"/><stop offset=".5" stop-color="#e0a21b"/><stop offset="1" stop-color="#a87400"/></linearGradient>
<linearGradient id="ra-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2b880"/><stop offset="1" stop-color="#a7783f"/></linearGradient>
<radialGradient id="ra-glass" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#eef1ee"/><stop offset="1" stop-color="#c9cfcc"/></radialGradient>
<radialGradient id="ra-bulbOn" cx=".45" cy=".45" r=".7"><stop offset="0" stop-color="#fffbe6"/><stop offset=".5" stop-color="#ffe680"/><stop offset="1" stop-color="#ffb52e"/></radialGradient>
<linearGradient id="ra-cylD" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#15181a"/><stop offset=".3" stop-color="#5a6268"/><stop offset=".55" stop-color="#2f3539"/><stop offset="1" stop-color="#101214"/></linearGradient>
<linearGradient id="ra-cylO" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9c6a00"/><stop offset=".3" stop-color="#ffd25e"/><stop offset=".55" stop-color="#e2a31a"/><stop offset="1" stop-color="#8a5c00"/></linearGradient>
<pattern id="ra-thr" width="4.2" height="10" patternUnits="userSpaceOnUse"><rect width="1.5" height="10" x="2.4" fill="#000" opacity=".3"/><rect width=".8" height="10" x="1.2" fill="#fff" opacity=".35"/></pattern>
<pattern id="ra-vent" width="6" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.6" fill="#000" opacity=".28"/></pattern>
<filter id="ra-sh" x="-15%" y="-15%" width="140%" height="150%"><feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#000" flood-opacity=".3"/></filter>
<filter id="ra-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="ra-nm" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.6 0.04" numOctaves="3" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 -.35"/></filter>
<filter id="ra-nf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="2" seed="2"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 -.18"/></filter>
<linearGradient id="ra-tb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9d3a"/><stop offset=".4" stop-color="#ec7a12"/><stop offset="1" stop-color="#b25500"/></linearGradient>
<linearGradient id="ra-tbV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b25500"/><stop offset=".45" stop-color="#ff9d3a"/><stop offset="1" stop-color="#c76200"/></linearGradient>
<linearGradient id="ra-flap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a6268"/><stop offset=".1" stop-color="#3b4247"/><stop offset="1" stop-color="#22272a"/></linearGradient>
<linearGradient id="ra-plcB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2c3236"/><stop offset=".05" stop-color="#4b5359"/><stop offset=".5" stop-color="#3a4146"/><stop offset=".96" stop-color="#2a2f33"/><stop offset="1" stop-color="#1a1e21"/></linearGradient>
<linearGradient id="ra-plcF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eceeef"/><stop offset=".5" stop-color="#d8dbdd"/><stop offset="1" stop-color="#c3c7ca"/></linearGradient>
<linearGradient id="ra-psuB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8f969b"/><stop offset=".06" stop-color="#e3e6e8"/><stop offset=".5" stop-color="#cdd1d4"/><stop offset=".94" stop-color="#b4b9bd"/><stop offset="1" stop-color="#7e8489"/></linearGradient>
<linearGradient id="ra-label" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6e9e6"/></linearGradient>
<radialGradient id="ra-ledG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#eaffea"/><stop offset=".4" stop-color="#5dff7c"/><stop offset="1" stop-color="#14b83a"/></radialGradient>
<radialGradient id="ra-ledY" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe0"/><stop offset=".4" stop-color="#ffcc33"/><stop offset="1" stop-color="#e08a00"/></radialGradient>
<radialGradient id="ra-bezel" cx=".5" cy=".5" r=".5"><stop offset=".7" stop-color="#4c5156"/><stop offset=".79" stop-color="#f7f8f9"/><stop offset=".9" stop-color="#9aa0a5"/><stop offset="1" stop-color="#3c4044"/></radialGradient>
<linearGradient id="ra-thread" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#53585d"/><stop offset=".18" stop-color="#b9bec2"/><stop offset=".34" stop-color="#ffffff"/><stop offset=".5" stop-color="#c3c7cb"/><stop offset=".78" stop-color="#7d8287"/><stop offset="1" stop-color="#3d4145"/></linearGradient>
<pattern id="ra-thrF" width="2.6" height="40" patternUnits="userSpaceOnUse" patternTransform="skewX(-12)"><rect width="1.1" height="40" x="1.5" fill="#000" opacity=".38"/><rect width=".55" height="40" x=".6" fill="#fff" opacity=".55"/></pattern>
<linearGradient id="ra-nut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e7378"/><stop offset=".2" stop-color="#e6e9eb"/><stop offset=".33" stop-color="#9ea3a8"/><stop offset=".66" stop-color="#c9cdd0"/><stop offset=".8" stop-color="#7a7f84"/><stop offset="1" stop-color="#4c5156"/></linearGradient>
<linearGradient id="ra-cap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3c4246"/><stop offset=".3" stop-color="#6c7378"/><stop offset=".5" stop-color="#4a5055"/><stop offset="1" stop-color="#1d2124"/></linearGradient>
<linearGradient id="ra-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6a00"/><stop offset=".3" stop-color="#ffcf3f"/><stop offset=".55" stop-color="#e3a910"/><stop offset="1" stop-color="#7c5500"/></linearGradient>
<linearGradient id="ra-duct" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ea3a7"/><stop offset=".15" stop-color="#cfd3d6"/><stop offset=".85" stop-color="#b9bec2"/><stop offset="1" stop-color="#868b90"/></linearGradient>
<radialGradient id="ra-light" cx=".3" cy=".15" r=".95"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient>
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
/* one screw terminal: black pocket + cross-slotted screw with a highlight */
RA.screw = (x, y, r) => { r = r || 6; return `<g transform="translate(${x} ${y})"><circle r="${r + 1.8}" fill="#0d0f10"/><circle r="${r + .6}" fill="#2a2e31"/><circle r="${r}" fill="url(#ra-screw)"/><g transform="rotate(20)"><rect x="${-r * .78}" y="${-r * .14}" width="${r * 1.56}" height="${r * .28}" rx="${r * .1}" fill="#3b4044"/><rect x="${-r * .14}" y="${-r * .78}" width="${r * .28}" height="${r * 1.56}" rx="${r * .1}" fill="#3b4044"/></g><ellipse cx="${-r * .35}" cy="${-r * .42}" rx="${r * .28}" ry="${r * .16}" fill="#fff" opacity=".8"/></g>`; };
RA.led = (x, y, on, col, w, h) => { w = w || 10; h = h || 6; const g = !on ? '#4f5655' : col === '#36d36a' ? 'url(#ra-ledG)' : (col === '#ffb300' || col === '#ffc21a') ? 'url(#ra-ledY)' : col;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${g}"${on ? ' filter="url(#ra-glow)"' : ''}/><rect x="${x}" y="${y}" width="${w}" height="${h * .3}" rx="1" fill="#fff" opacity=".3"/>`; };
/* perforated aluminium DIN rail, 16 high */
RA.rail = (x, y, w) => `<g transform="translate(${x} ${y})"><rect width="${w}" height="16" fill="url(#ra-rail)"/><rect width="${w}" height="16" filter="url(#ra-nm)" opacity=".25"/>${Array.from({length:Math.floor(w / 26)}, (_, i) => `<rect x="${8 + i * 26}" y="5" width="14" height="6" rx="3" fill="#3d4246"/><rect x="${9 + i * 26}" y="5.5" width="12" height="1.6" rx=".8" fill="#000" opacity=".35"/>`).join('')}</g>`;
/* galvanised mounting plate filling w×h (backdrop for a bench) */
RA.plate = (w, h) => `<rect width="${w}" height="${h}" fill="url(#ra-alu)"/><rect width="${w}" height="${h}" fill="#b9bec2" opacity=".55"/><rect width="${w}" height="${h}" filter="url(#ra-nm)" opacity=".3"/><rect width="${w}" height="${h}" fill="url(#ra-light)"/>`;
/* slotted grey wiring duct, horizontal */
RA.duct = (x, y, w, h) => { let s = `<g filter="url(#ra-sh)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="url(#ra-duct)"/>`;
  for (let i = x + 6; i < x + w - 6; i += 12) s += `<rect x="${i}" y="${y}" width="5" height="${h * .42}" fill="#6e7378"/><rect x="${i}" y="${y + h * .58}" width="5" height="${h * .42}" fill="#6e7378"/>`;
  return s + `<rect x="${x}" y="${y + h * .42}" width="${w}" height="${h * .16}" fill="#dcdfe1"/></g>`; };
/* glossy insulated wire along path d (shadow, colour, highlight) */
RA.wire = (d, col, w) => { w = w || 4.5; return `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="${w + 1.6}" stroke-linecap="round" transform="translate(1 2)"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="${w * .28}" stroke-linecap="round" transform="translate(-.6 -.9)"/>`; };

/* DIN-rail 24 V power supply, box w×h, terminals along the bottom edge (their labels sit just above it) */
RA.psu = (x, y, w, h, live) => { w = w || 110; h = h || 58; const ok = !(live && live.off); let v = '';
  for (let i = 0; i < 3; i++) v += `<rect x="${w * .56}" y="${5 + i * 4.4}" width="${w * .4}" height="2.4" rx="1.2" fill="#2c3135" opacity=".85"/><rect x="${w * .56}" y="${7.4 + i * 4.4}" width="${w * .4}" height=".7" fill="#fff" opacity=".6"/>`;
  return `<g transform="translate(${x} ${y})" filter="url(#ra-sh)">
  <rect width="${w}" height="${h}" rx="4" fill="url(#ra-psuB)"/><rect width="${w}" height="${h}" rx="4" filter="url(#ra-nm)" opacity=".2"/><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="3.5" fill="none" stroke="#fff" stroke-opacity=".5"/>
  <rect x="5" y="4" width="${w * .48}" height="15" rx="2" fill="url(#ra-label)" stroke="#c4c8cb" stroke-width=".6"/>${T(5 + w * .24, 11, 'PSU 24V DC', Math.min(7.5, w * .066), '#14181b', 'middle', 700)}${T(5 + w * .24, 17, '5A · 120W', 4.8, '#555', 'middle')}${v}
  <circle cx="${w - 9}" cy="22.5" r="2.4" fill="${ok ? 'url(#ra-ledG)' : '#33403a'}"${ok ? ' filter="url(#ra-glow)"' : ''}/>${T(w - 14, 24.3, 'DC OK', 4.6, '#2b3034', 'end', 700)}
${h > 70 ? `  <circle cx="10" cy="${h - 30}" r="3.4" fill="#202326"/><circle cx="10" cy="${h - 30}" r="2.3" fill="url(#ra-screw)"/><rect x="8" y="${h - 30.5}" width="4" height="1" fill="#333"/>${T(15, h - 28.2, 'ADJ', 4.6, '#333', '', 700)}
` : ''}  <rect x="0" y="${h - 22}" width="${w}" height="22" rx="3" fill="url(#ra-flap)"/><rect x="2" y="${h - 21.5}" width="${w - 4}" height="1.2" fill="#fff" opacity=".18"/></g>`; };

/* compact PLC CPU (top part with power terminals), box w×h */
RA.cpu = (x, y, w, h, live) => { w = w || 130; h = h || 58; const run = !live || live.pwr !== false; return `<g transform="translate(${x} ${y})" filter="url(#ra-sh)">
  <rect width="${w}" height="${h}" rx="5" fill="url(#ra-plcB)"/>
  <rect x="${w * .16}" y="3" width="${w * .84 - 4}" height="${h - 27}" rx="2.5" fill="url(#ra-plcF)"/><rect x="${w * .16}" y="3" width="${w * .84 - 4}" height="${h - 27}" rx="2.5" filter="url(#ra-nf)" opacity=".45"/>
  <rect x="4" y="6" width="${w * .16 - 8}" height="9" rx="1.5" fill="#0d0f10"/><rect x="5.5" y="8" width="${w * .16 - 11}" height="5" fill="#2b3035"/><rect x="7" y="13" width="${w * .16 - 14}" height="1.6" fill="#c9a24a"/>
  ${T(w * .58, 13, 'CPU · DC/DC/DC', 7.5, '#1d2a33', 'middle', 700)}
  ${RA.led(w * .2, 18, run, '#36d36a', 8, 5)}${T(w * .2 + 11, 22.5, 'RUN', 5.5, '#444', '', 700)}${RA.led(w * .2 + 34, 18, false, '#ff4a3d', 8, 5)}${T(w * .2 + 45, 22.5, 'ERR', 5.5, '#444', '', 700)}
  <rect x="${w * .16 + 4}" y="${h - 22}" width="${w * .84 - 8}" height="22" rx="3" fill="url(#ra-tb)"/><rect x="${w * .16 + 4}" y="${h - 22}" width="${w * .84 - 8}" height="1.5" fill="#fff" opacity=".4"/>
  <rect x="3" y="${h - 22}" width="${w * .16 - 6}" height="22" rx="2" fill="url(#ra-flap)"/></g>`; };

/* I/O module, box w×h; leds: [{y (absolute), k, c}] — terminals column sits on the left edge */
RA.card = (x, y, w, h, title, leds, live) => `<g transform="translate(${x} ${y})"><g filter="url(#ra-sh)">
  <rect width="${w}" height="${h}" rx="5" fill="url(#ra-plcB)"/><rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="3" fill="url(#ra-plcF)"/><rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="3" filter="url(#ra-nf)" opacity=".45"/>
  <rect x="5" y="24" width="22" height="${h - 30}" rx="3" fill="url(#ra-tbV)"/><rect x="5" y="24" width="1.5" height="${h - 30}" fill="#fff" opacity=".35"/>
  <rect x="${w - 36}" y="24" width="24" height="${h - 30}" rx="3" fill="#2b3034"/><rect x="${w - 34}" y="26" width="20" height="10" fill="#fff" opacity=".07"/></g>
  ${T(w / 2, 15, title, 9.5, '#1d2a33', 'middle', 700)}
  ${leds.map(l => RA.led(w - 30, l.y - y - 4, live[l.k], l.c || '#36d36a', 12, 8)).join('')}</g>`;

/* M18 proximity sensor lying horizontally (face on the left), box 100×22 + cable going right/down */
RA.prox = (x, y, kind, live) => `<g transform="translate(${x} ${y})">
  ${live.target ? '<g filter="url(#ra-sh)"><rect x="-26" y="-4" width="16" height="30" rx="2" fill="url(#ra-nut)"/><rect x="-26" y="-4" width="16" height="30" rx="2" filter="url(#ra-nm)" opacity=".35"/></g>' : ''}
  <g filter="url(#ra-sh)"><rect x="0" y="2" width="8" height="18" rx="2.5" fill="url(#ra-face)"/><rect x="1" y="4" width="1.6" height="14" rx=".8" fill="#fff" opacity=".45"/>
  <rect x="8" y="1" width="54" height="20" fill="url(#ra-thread)"/><rect x="8" y="1" width="54" height="20" fill="url(#ra-thrF)"/>
  ${[18, 44].map(n => `<rect x="${n}" y="-2.5" width="9" height="27" rx="1.5" fill="url(#ra-nut)"/><rect x="${n}" y="-2.5" width="9" height="9" fill="#fff" opacity=".18"/><rect x="${n}" y="15.5" width="9" height="9" fill="#000" opacity=".14"/><rect x="${n + 3}" y="-2.5" width="3" height="27" fill="#000" opacity=".1"/>`).join('')}
  <rect x="62" y="1" width="22" height="20" rx="2" fill="url(#ra-cap)"/><rect x="63" y="3" width="15" height="9" rx="1" fill="url(#ra-label)"/>${T(70.5, 9.6, kind, 5.6, '#111', 'middle', 700)}${T(70.5, 18.4, 'NO', 5, '#ccc', 'middle', 700)}
  <circle cx="80" cy="7" r="2.4" fill="${live.target ? 'url(#ra-ledY)' : '#5c4a1d'}"${live.target ? ' filter="url(#ra-glow)"' : ''}/>
  <rect x="84" y="4" width="12" height="14" rx="2.5" fill="#1b1e21"/><rect x="84" y="4" width="12" height="3" rx="1.5" fill="#fff" opacity=".14"/>
  <rect x="96" y="6" width="6" height="10" fill="#1b1c1e"/></g>
  <path d="M102 11h6c4 0 4 4 4 8v16" fill="none" stroke="#1d2023" stroke-width="7" stroke-linecap="round"/><path d="M102 11h6c4 0 4 4 4 8v16" fill="none" stroke="#6b7176" stroke-width="4.6" stroke-linecap="round"/><path d="M102 10h6c3 0 3 3 3 6" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1"/></g>`;

/* row of terminal blocks (feed-through), n blocks, pitch g */
RA.terms = (x, y, n, g, cols) => `<g transform="translate(${x} ${y})" filter="url(#ra-sh)">${Array.from({length:n}, (_, i) => `<rect x="${i * g}" y="0" width="${g - 1}" height="18" rx="1.5" fill="${(cols && cols[i]) || '#b9bec2'}"/><rect x="${i * g}" y="0" width="${g - 1}" height="18" rx="1.5" fill="url(#ra-light)"/><rect x="${i * g}" y="0" width="${g - 1}" height="3" fill="#fff" opacity=".4"/><rect x="${i * g}" y="0" width="1" height="18" fill="#000" opacity=".25"/>`).join('')}</g>`;

/* 22 mm push button with contact block, box 70×34 */
RA.pb = (x, y, pressed, lbl, col) => { col = col || '#24b04b'; return `<g transform="translate(${x} ${y})">
  <g filter="url(#ra-sh)"><rect width="70" height="34" rx="5" fill="url(#ra-psuB)"/><rect width="70" height="34" rx="5" filter="url(#ra-nf)" opacity=".35"/><rect x=".5" y=".5" width="69" height="33" rx="4.5" fill="none" stroke="#fff" stroke-opacity=".6"/>
  <circle cx="5" cy="5" r="1.8" fill="#9ea2a0"/><circle cx="65" cy="29" r="1.8" fill="#9ea2a0"/>
  <circle cx="35" cy="17.6" r="15" fill="#000" opacity=".25"/><circle cx="35" cy="17" r="14.5" fill="url(#ra-bezel)"/><circle cx="35" cy="17" r="10.6" fill="#0d1a12"/>
  <circle cx="35" cy="${pressed ? 18 : 17}" r="${pressed ? 9 : 9.8}" fill="${col}"/><circle cx="35" cy="${pressed ? 18 : 17}" r="${pressed ? 9 : 9.8}" fill="url(#ra-dome)"/><ellipse cx="32" cy="${pressed ? 14 : 13}" rx="4" ry="2.2" fill="#fff" opacity=".55"/></g>
  ${lbl ? `<text x="78" y="21" class="ar" style="font-size:10px;fill:var(--ink,#222)">${lbl}</text>` : ''}</g>`; };

/* small contactor seen from the front, box 76×40 (coil A1/A2 terminals sit under it) */
RA.contactor = (x, y, lbl, on) => `<g transform="translate(${x} ${y})"><g filter="url(#ra-sh)">
  <rect width="76" height="40" rx="4" fill="url(#ra-plastic)" stroke="#a9aeb2"/><rect width="76" height="40" rx="4" filter="url(#ra-nf)" opacity=".4"/>
  <rect x="3" y="2" width="70" height="8" rx="2" fill="url(#ra-term)"/><rect x="3" y="30" width="70" height="8" rx="2" fill="url(#ra-term)"/>
  ${[12, 30, 46, 64].map(k => `<circle cx="${k}" cy="6" r="2.3" fill="url(#ra-screw)"/><circle cx="${k}" cy="34" r="2.3" fill="url(#ra-screw)"/>`).join('')}
  <rect x="24" y="12" width="28" height="16" rx="2" fill="#3b4146"/><rect x="27" y="14" width="22" height="12" rx="1" fill="#1b1e20"/>
  <rect x="31" y="${on ? 18 : 15}" width="14" height="6" rx="1" fill="url(#ra-orange)"/>
  ${T(12, 22, 'KM', 7, '#444', 'middle', 700)}${T(64, 22, '24V', 6, '#555', 'middle')}</g>
  <text x="84" y="18" class="ar" style="font-size:10px;fill:var(--ink,#222)">${lbl}</text><text x="84" y="32" style="font:600 9px var(--font-mono,monospace);fill:${on ? '#2b7a3d' : 'var(--muted,#777)'}">${on ? 'ON' : 'OFF'}</text></g>`;

/* 22 mm pilot lamp seen from the front, centre (x,y), radius r */
RA.lamp = (x, y, r, col, on) => `<g transform="translate(${x} ${y})" filter="url(#ra-sh)">
  <circle r="${r + 4}" fill="url(#ra-bezel)"/><circle r="${r}" fill="${on ? col : '#3a3f43'}"${on ? ' filter="url(#ra-glow)"' : ''}/>
  ${on ? `<circle r="${r * .55}" fill="#fff" opacity=".55"/>` : `<circle r="${r}" fill="${col}" opacity=".28"/>`}<circle r="${r}" fill="url(#ra-dome)"/>${Array.from({length:4}, (_, i) => `<path d="M${-r * .8} ${-r * .45 + i * r * .3}h${r * 1.6}" stroke="#fff" stroke-opacity=".12"/>`).join('')}</g>`;

/* 2-pole MCB feeding 230 V AC, box w×h with terminals along the bottom edge */
RA.mcb = (x, y, w, h) => `<g transform="translate(${x} ${y})" filter="url(#ra-sh)">
  <rect width="${w}" height="${h}" rx="4" fill="url(#ra-plastic)" stroke="#a9aeb2"/><rect width="${w}" height="${h}" rx="4" filter="url(#ra-nf)" opacity=".4"/><path d="M${w / 2} 2V${h - 22}" stroke="#a9aeb2"/>
  <rect x="${w / 2 - 13}" y="4" width="26" height="20" rx="3" fill="#2a2e31"/><rect x="${w / 2 - 9}" y="6" width="18" height="8" rx="2" fill="#e9eaea"/><rect x="${w / 2 - 9}" y="6" width="18" height="2.5" rx="1" fill="#fff"/>
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
