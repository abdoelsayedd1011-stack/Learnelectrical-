/* =====================================================================================
   Classic Control Lab — fx.js  (engagement layer, loads after engine.js, before the lesson data)
       <script src="engine.js"></script><script src="fx.js"></script>
   Everything here plugs into the engine's event bus (CL.on / CL.emit, added by patch_engine.py):
       exercise · wire · unwire · power · coil · motor · trip · short · burnt · tick · render ·
       precheck · pass · fail · hint · clear · destroy
   Without the bus (unpatched engine) fx.js is harmless: it only renders the story strip and
   the mute toggle. All sounds are synthesised with the Web Audio API — no audio files.
   Public: CL.fx.{sound, machines, machineFor, score, faults, meter, challenge, hub, summary}
   ===================================================================================== */
(function(){
'use strict';
const CL = window.CL; if (!CL) return;
const FX = CL.fx = {version:1};
// features shipped later stay in the code but hidden until their flag is turned on
FX.flags = Object.assign({machines:true, faults:false, challenge:false}, (window.CL_FX_FLAGS || {}));
const esc = CL.esc || (s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TYPES = CL.TYPES || {};
const st = { get: k => CL.store.get('fx/' + k), set: (k, v) => CL.store.set('fx/' + k, v) };
const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const hasBus = typeof CL.on === 'function';
const on = (e, f) => { if (hasBus) CL.on(e, f); };

/* =========================== 1. sounds (Web Audio, synthesised) =========================== */
const S = {ctx:null, master:null, voices:0, MAXV:3, muted:!!st.get('mute'), hum:null, noiseBuf:null, lastTick:0, gestured:false, created:0};
function actx(){
  if (S.ctx) return S.ctx;
  if (!S.gestured) return null;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  try { S.ctx = new AC(); S.created++; S.master = S.ctx.createGain(); S.master.gain.value = S.muted ? 0 : 0.25; S.master.connect(S.ctx.destination); } catch (_) { S.ctx = null; }
  return S.ctx;
}
function gesture(){ S.gestured = true; const c = actx(); if (c && c.state === 'suspended' && c.resume) { try { c.resume(); } catch (_) {} } }
['pointerdown', 'keydown', 'touchstart'].forEach(e => window.addEventListener(e, gesture, {passive:true, capture:true}));
function noiseBuf(c){ if (S.noiseBuf) return S.noiseBuf; const n = Math.floor(c.sampleRate * 0.5), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; S.noiseBuf = b; return b; }
function voice(dur, fn, force){ // force: important cues (short, trip, pass, fail) still play when the 3-voice cap is reached
  const c = actx(); if (!c || S.muted || (S.voices >= S.MAXV && !force)) return false;
  S.voices++; setTimeout(() => { S.voices = Math.max(0, S.voices - 1); }, dur * 1000 + 30);
  try { fn(c, c.currentTime); } catch (_) {}
  return true;
}
const env = (c, g, t0, a, peak, t1) => { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t1); };
function osc(c, type, f0, f1, t0, t1, peak, a, dest){ const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t1); env(c, g, t0, a || 0.005, peak, t1); o.connect(g); g.connect(dest || S.master); o.start(t0); o.stop(t1 + 0.03); return o; }
function burst(c, t0, dur, peak, filt, f, q){ const s = c.createBufferSource(); s.buffer = noiseBuf(c); const g = c.createGain(); env(c, g, t0, 0.003, peak, t0 + dur); let n = s; if (filt){ const F = c.createBiquadFilter(); F.type = filt; F.frequency.value = f; if (q) F.Q.value = q; s.connect(F); n = F; } n.connect(g); g.connect(S.master); s.start(t0); s.stop(t0 + dur + 0.02); }
const SND = FX.sound = {
  click(){ voice(0.08, (c, t) => { burst(c, t, 0.03, 0.5, 'bandpass', 2600, 1.2); osc(c, 'sine', 1400, 320, t, t + 0.05, 0.35); }); },
  unclick(){ voice(0.08, (c, t) => { burst(c, t, 0.025, 0.25, 'bandpass', 1400, 1.2); osc(c, 'sine', 700, 180, t, t + 0.06, 0.22); }); },
  powerOn(){ voice(1.2, (c, t) => { const o = osc(c, 'sawtooth', 50, 50, t, t + 1.2, 0.14, 0.35); void o; osc(c, 'sine', 100, 100, t, t + 1.0, 0.08, 0.3); burst(c, t, 0.04, 0.3, 'lowpass', 900); }); },
  powerOff(){ voice(0.5, (c, t) => { osc(c, 'sawtooth', 50, 28, t, t + 0.45, 0.1, 0.01); burst(c, t, 0.03, 0.2, 'lowpass', 700); }); },
  clack(on){ voice(0.09, (c, t) => { burst(c, t, on ? 0.04 : 0.03, on ? 0.7 : 0.4, 'lowpass', on ? 700 : 500); osc(c, 'sine', on ? 95 : 70, 40, t, t + (on ? 0.07 : 0.05), on ? 0.5 : 0.25); }); },
  relay(on){ voice(0.06, (c, t) => { burst(c, t, 0.02, on ? 0.35 : 0.22, 'bandpass', 3200, 2); }); },
  thunk(){ voice(0.25, (c, t) => { osc(c, 'sine', 150, 42, t, t + 0.2, 0.8, 0.004); burst(c, t, 0.06, 0.4, 'lowpass', 260); }, true); },
  crackle(){ voice(0.4, (c, t) => { for (let i = 0; i < 7; i++){ const o = t + Math.random() * 0.3; burst(c, o, 0.012 + Math.random() * 0.02, 0.6, 'highpass', 1800); } osc(c, 'sawtooth', 60, 40, t, t + 0.25, 0.3, 0.004); }, true); try { document.body.classList.remove('fx-flash'); void document.body.offsetWidth; document.body.classList.add('fx-flash'); setTimeout(() => document.body.classList.remove('fx-flash'), 600); } catch (_) {} },
  buzz(){ voice(0.5, (c, t) => { const F = c.createBiquadFilter(); F.type = 'bandpass'; F.frequency.value = 320; F.Q.value = 1.5; F.connect(S.master); osc(c, 'square', 55, 55, t, t + 0.45, 0.4, 0.01, F); osc(c, 'sawtooth', 110, 110, t, t + 0.45, 0.3, 0.01, F); }, true); },
  tick(){ voice(0.03, (c, t) => { osc(c, 'sine', 2100, 2100, t, t + 0.018, 0.22, 0.002); }); },
  chime(){ voice(0.9, (c, t) => { [523.25, 659.25, 783.99].forEach((f, i) => osc(c, 'sine', f, f, t + i * 0.12, t + i * 0.12 + 0.55, 0.3, 0.01)); osc(c, 'triangle', 1046.5, 1046.5, t + 0.36, t + 0.9, 0.12, 0.01); }, true); },
  error(){ voice(0.35, (c, t) => { osc(c, 'triangle', 330, 330, t, t + 0.15, 0.22, 0.01); osc(c, 'triangle', 220, 220, t + 0.16, t + 0.34, 0.22, 0.01); }, true); },
  beep(){ voice(0.12, (c, t) => { osc(c, 'square', 2500, 2500, t, t + 0.1, 0.12, 0.005); }); },
  hum(level, mode){ // continuous motor hum, level 0..1; mode 'Y' → lower pitch
    const c = actx(); if (!c) return;
    const t = c.currentTime, f = mode === 'Y' ? 72 : 100;
    if (level > 0 && !S.hum){ const o1 = c.createOscillator(), o2 = c.createOscillator(), F = c.createBiquadFilter(), g = c.createGain(); o1.type = 'sawtooth'; o1.frequency.value = f; o2.type = 'sine'; o2.frequency.value = 50; F.type = 'lowpass'; F.frequency.value = 420; g.gain.setValueAtTime(0.0001, t); o1.connect(F); o2.connect(F); F.connect(g); g.connect(S.master); o1.start(t); o2.start(t); S.hum = {o1, o2, g}; }
    if (!S.hum) return;
    S.hum.o1.frequency.setTargetAtTime(f, t, 0.3);
    if (level > 0){ S.hum.g.gain.cancelScheduledValues(t); S.hum.g.gain.setTargetAtTime(0.07 * clamp(level, 0.3, 1), t, 0.25); }
    else { const h = S.hum; S.hum = null; h.g.gain.cancelScheduledValues(t); h.g.gain.setTargetAtTime(0.0001, t, 0.15); try { h.o1.stop(t + 0.8); h.o2.stop(t + 0.8); } catch (_) {} }
  },
  mute(v){ S.muted = !!v; st.set('mute', S.muted ? 1 : null); if (S.master) S.master.gain.setTargetAtTime(S.muted ? 0 : 0.25, S.ctx.currentTime, 0.05); if (S.muted) SND.hum(0); document.querySelectorAll('.fx-mute').forEach(b => { b.textContent = S.muted ? '🔇' : '🔊'; b.setAttribute('aria-pressed', S.muted ? 'true' : 'false'); b.title = S.muted ? 'Sound off: tap to turn it on' : 'Sound on: tap to turn it off'; }); },
  get muted(){ return S.muted; }, get ctx(){ return S.ctx; }, get voices(){ return S.voices; }, get created(){ return S.created; }
};
function mountMute(){
  if (document.querySelector('.fx-mute')) return;
  const host = document.querySelector('header.top .chips') || document.querySelector('header.top') || document.body;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn fx-mute'; b.setAttribute('aria-label', 'Sound');
  b.addEventListener('click', () => { S.gestured = true; SND.mute(!S.muted); if (!S.muted) SND.click(); });
  host.appendChild(b); SND.mute(S.muted);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountMute); else mountMute();

/* =========================== 2. story strip in the task card =========================== */
CL.storyCard = function(ex){
  const s = ex && ex.story; if (!s) return '';
  const o = typeof s === 'string' ? {text:s} : s;
  return `<div class="bn-story"><span class="bn-story-ico" aria-hidden="true">${esc(o.icon || '🏭')}</span><div class="bn-story-b"><p class="bn-story-t">${o.text || ''}</p>${o.ask ? `<p class="bn-story-a"><b>Your task:</b> ${o.ask}</p>` : ''}</div></div>`;
};
if (typeof CL.taskCard === 'function' && !/storyCard/.test(String(CL.taskCard))){ // unpatched engine: wrap the card renderer
  const orig = CL.taskCard;
  CL.taskCard = (ex, devs) => { const h = orig(ex, devs), sc = CL.storyCard(ex); if (!sc) return h; const m = /<\/h3>(?:<span class="bn-badge">[^<]*<\/span>)?/.exec(h); if (!m) return h; const i = m.index + m[0].length; return h.slice(0, i) + sc + h.slice(i); };
}

/* =========================== 3. live machines =========================== */
const M = FX.machines = {};
const MOTOR_AR = {line:'machine', conveyor:'conveyor', hoist:'hoist', pump:'pump', fan:'fan', compressor:'compressor', lathe:'lathe', door:'door', gauge:'motor', mixer:'mixer'};
const lampDot = (x, y, id) => `<circle class="lamp" data-lamp="${id}" cx="${x}" cy="${y}" r="4"/>`;
const motorIcon = (x, y, id, lab) => `<g data-motor="${id}"><rect x="${x}" y="${y}" width="34" height="20" rx="6" fill="#5d7f96"/><rect x="${x + 9}" y="${y - 5}" width="16" height="6" rx="1.5" fill="#8f979c"/><text x="${x + 17}" y="${y + 14}" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">${esc(id)}</text>${lampDot(x + 40, y + 10, id)}<text x="${x + 17}" y="${y + 33}" text-anchor="middle" font-size="9.5">${esc(lab || '')}</text></g>`;
const spin = (x, y, r, id) => `<g class="spin" data-spin="${id}">${[0, 90, 180, 270].map(a => `<path d="M${x} ${y}L${x + r * Math.cos(a * Math.PI / 180)} ${y + r * Math.sin(a * Math.PI / 180)}" stroke="#2a2d30" stroke-width="2.4"/>`).join('')}<circle cx="${x}" cy="${y}" r="${r * .3}" fill="#2a2d30"/></g>`;
// ---- conveyor(s): one belt per motor, boxes move in the direction of rotation
M.conveyor = {
  title: n => n > 1 ? 'Filling conveyor line' : 'Filling conveyor',
  draw(c){ const n = c.motors.length, W = 320, H = 56 * n + 20; let s = ''; c.motors.forEach((id, i) => { const y = 16 + i * 56; const lab = c.labels[id] || (n > 1 ? 'Conveyor ' + (i + 1) : 'conveyor');
      s += `<g data-belt="${id}"><rect x="56" y="${y + 18}" width="200" height="14" rx="7" fill="#3b3f43"/><path class="belt" data-beltline="${id}" d="M63 ${y + 25}H249"/>${[0, 1, 2].map(k => `<circle cx="${63 + k * 93}" cy="${y + 25}" r="5" fill="#8f979c" stroke="#2a2d30"/>`).join('')}<g data-boxes="${id}">${[0, 1, 2].map(k => `<g data-box="${k}" transform="translate(${70 + k * 66} ${y})"><rect width="26" height="18" rx="2" fill="#c99a5b" stroke="#6b4a1f"/><path d="M3 9h20" stroke="#6b4a1f" stroke-width="1"/></g>`).join('')}</g><path class="arrow" data-arrow="${id}" d="M270 ${y + 25}h22m-6-6l6 6l-6 6" fill="none" stroke="var(--accent)" stroke-width="2.5"/>${motorIcon(8, y + 6, id, lab)}</g>`; });
    return {svg:s, W, H}; },
  update(root, S, dt){ root.querySelectorAll('[data-belt]').forEach(g => { const id = g.dataset.belt, m = S.mot[id] || {}, run = m.run ? 1 : 0, dir = m.dir || 1, sp = (m.mode === 'Y' ? 36 : 60) * run;
      const off = ((+g.dataset.off || 0) + sp * dir * dt) ; g.dataset.off = off;
      g.querySelectorAll('[data-box]').forEach((b, k) => { const x = 60 + (((70 + k * 66 - 60 + off) % 190) + 190) % 190; b.setAttribute('transform', `translate(${x.toFixed(1)} ${+b.getAttribute('transform').split(' ')[1].replace(')', '')})`); b.style.opacity = x > 232 ? Math.max(0, (250 - x) / 18) : x < 70 ? Math.max(0, (x - 52) / 18) : 1; });
      const bl = g.querySelector('[data-beltline]'); if (bl) bl.setAttribute('stroke-dashoffset', (-off % 12).toFixed(1));
      const ar = g.querySelector('[data-arrow]'); if (ar){ ar.classList.toggle('on', !!run); ar.setAttribute('transform', dir < 0 ? `translate(562 0) scale(-1 1)` : ''); }
      setLamp(root, id, run, m.fault); }); }
};
// ---- hoist: cage between two limit switches, driven by the cart position
M.hoist = {
  title: () => 'hoist',
  draw(c){ const id = c.motors[0]; return {W:320, H:150, svg:`<rect x="140" y="8" width="60" height="6" fill="#e0a21b" stroke="#8a6200"/><rect x="40" y="14" width="6" height="128" fill="#8f979c"/><rect x="254" y="14" width="6" height="128" fill="#8f979c"/><path d="M46 20L254 20M46 142L254 142" stroke="#8f979c" stroke-width="3"/><rect x="48" y="24" width="30" height="8" fill="#c3c7ca" stroke="#6d7479"/><text x="86" y="31" font-size="9">LS up</text><rect x="48" y="122" width="30" height="8" fill="#c3c7ca" stroke="#6d7479"/><text x="86" y="129" font-size="9">LS down</text><path data-rope="1" d="M170 14V96" stroke="#333" stroke-width="2"/><g data-cage="1" transform="translate(120 96)"><rect width="100" height="42" rx="3" fill="#8a9096" stroke="#333"/><path d="M0 14h100M0 28h100M25 0v42M50 0v42M75 0v42" stroke="#5a6065"/><rect x="8" y="14" width="18" height="14" fill="#c99a5b" stroke="#6b4a1f"/></g><path class="arrow" data-arrow="1" d="M290 90V50m-7 8l7-8l7 8" fill="none" stroke="var(--accent)" stroke-width="2.5"/>${motorIcon(268, 110, id, 'hoist')}`}; },
  update(root, S){ const id = root.dataset.m0, m = S.mot[id] || {}, x = S.cart ? S.cart.x : 0.5, y = 32 + (1 - clamp(x, 0, 1)) * 64; const cg = root.querySelector('[data-cage]'); if (cg) cg.setAttribute('transform', `translate(120 ${y.toFixed(1)})`); const rp = root.querySelector('[data-rope]'); if (rp) rp.setAttribute('d', `M170 14V${y.toFixed(1)}`); const ar = root.querySelector('[data-arrow]'); if (ar){ ar.classList.toggle('on', !!m.run); ar.setAttribute('transform', (m.dir || 1) * (S.cartSign || 1) < 0 ? 'translate(0 140) scale(1 -1)' : ''); } setLamp(root, id, m.run, m.fault); }
};
// ---- pump: fills a tank, float switches marked
M.pump = {
  title: () => 'Pump and tank',
  draw(c){ const id = c.motors[0]; const fl = c.levels.map(l => `<g><path d="M${86} ${118 - l.at * 90}h148" stroke="#1f6fd1" stroke-dasharray="3 3"/><text x="238" y="${121 - l.at * 90}" font-size="9">${esc(l.id)}</text></g>`).join('');
    return {W:320, H:150, svg:`<rect x="84" y="24" width="150" height="96" rx="4" fill="none" stroke="#56656f" stroke-width="3"/><rect class="water" data-water="1" x="86" y="118" width="146" height="0"/>${fl}<g data-rip="1" transform="translate(159 0)"><circle class="ripple" data-ripy="1" cx="0" cy="118" r="14"/><circle class="ripple r2" data-ripy="2" cx="0" cy="118" r="14"/></g><path d="M60 120V132H84M60 120V96H84" fill="none" stroke="#8f979c" stroke-width="5"/><path d="M234 60h30" stroke="#8f979c" stroke-width="5"/><circle cx="48" cy="120" r="16" fill="#5d7f96" stroke="#2a2d30"/>${spin(48, 120, 11, id)}${motorIcon(12, 20, id, 'pump')}<text data-lvl="1" x="160" y="18" text-anchor="middle" class="mono" font-size="11">0 %</text>`}; },
  update(root, S, dt){ const id = root.dataset.m0, m = S.mot[id] || {}, lvl = S.tank ? S.tank.lvl : 0, h = 94 * clamp(lvl, 0, 1); const w = root.querySelector('[data-water]'); if (w){ w.setAttribute('y', (118 - h).toFixed(1)); w.setAttribute('height', h.toFixed(1)); } root.querySelectorAll('[data-ripy]').forEach(r => r.setAttribute('cy', (118 - h).toFixed(1))); const t = root.querySelector('[data-lvl]'); if (t) t.textContent = Math.round(lvl * 100) + ' %'; rot(root, id, m.run ? (m.dir || 1) * 540 * dt : 0); setLamp(root, id, m.run, m.fault); }
};
// ---- fan
M.fan = {
  title: () => 'Cooling fan',
  draw(c){ const id = c.motors[c.motors.length - 1], ids = c.motors; return {W:320, H:140, svg:`<circle cx="200" cy="70" r="52" fill="#3b3f43"/><circle cx="200" cy="70" r="46" fill="#1d1f21"/><circle class="blur" cx="200" cy="70" r="40" fill="#cfd3d6"/><g class="spin" data-spin="${id}">${[0, 72, 144, 216, 288].map(a => `<path d="M200 70Q${200 + 30 * Math.cos((a - 20) * Math.PI / 180)} ${70 + 30 * Math.sin((a - 20) * Math.PI / 180)} ${200 + 40 * Math.cos(a * Math.PI / 180)} ${70 + 40 * Math.sin(a * Math.PI / 180)}Q${200 + 30 * Math.cos((a + 25) * Math.PI / 180)} ${70 + 30 * Math.sin((a + 25) * Math.PI / 180)} 200 70Z" fill="#cfd3d6" stroke="#8a9096"/>`).join('')}<circle cx="200" cy="70" r="7" fill="#8f979c"/></g>${ids.length > 1 ? `<rect x="20" y="30" width="80" height="60" rx="6" fill="#56656f"/><text x="60" y="64" text-anchor="middle" fill="#fff" font-size="11">machine</text>${lampDot(60, 80, ids[0])}` : ''}${motorIcon(ids.length > 1 ? 24 : 40, 104, id, 'fan')}`}; },
  update(root, S, dt){ const ids = (root.dataset.ms || '').split(','), id = ids[ids.length - 1], m = S.mot[id] || {}; rot(root, id, m.run ? (m.dir || 1) * 720 * dt : 0); ids.forEach(i => setLamp(root, i, (S.mot[i] || {}).run, (S.mot[i] || {}).fault)); root.dataset.run = m.run ? 1 : 0; }
};
// ---- compressor: air tank + pressure gauge needle + piston
M.compressor = {
  title: () => 'Air compressor',
  draw(c){ const id = c.motors[0], max = c.max || 10; return {W:320, H:150, svg:`<rect x="110" y="70" width="150" height="56" rx="26" fill="#8f979c" stroke="#4b5257" stroke-width="2"/><path d="M120 98h130" stroke="#6d7479"/><circle cx="230" cy="40" r="28" fill="#f4f4f1" stroke="#555" stroke-width="2"/>${[0, 1, 2, 3, 4].map(k => { const a = (-210 + k * 60) * Math.PI / 180; return `<path d="M${230 + 22 * Math.cos(a)} ${40 + 22 * Math.sin(a)}L${230 + 26 * Math.cos(a)} ${40 + 26 * Math.sin(a)}" stroke="#333" stroke-width="1.5"/>`; }).join('')}<text x="230" y="60" text-anchor="middle" font-size="8">bar · max ${max}</text><path class="needle" data-needle="1" d="M230 40L230 18" stroke="#d32f2f" stroke-width="2.5" stroke-linecap="round" transform="rotate(-120)"/><circle cx="230" cy="40" r="3" fill="#333"/><rect x="40" y="80" width="56" height="40" rx="6" fill="#3b3f43"/><rect x="60" y="56" width="16" height="30" fill="#aab1b6" stroke="#4b5257"/><rect data-piston="1" x="62" y="60" width="12" height="10" fill="#d9924f"/><path d="M96 100h14" stroke="#6d7479" stroke-width="5"/><text data-bar="1" x="230" y="44" text-anchor="middle" class="mono" font-size="0"></text><text data-bart="1" x="185" y="118" text-anchor="middle" class="mono" font-size="11">0.0 bar</text>${motorIcon(8, 20, id, 'compressor')}`}; },
  update(root, S, dt){ const id = root.dataset.m0, m = S.mot[id] || {}, max = +root.dataset.max || 10, bar = (S.tank ? S.tank.lvl : 0) * max, a = -120 + clamp(bar / max, 0, 1) * 240; const n = root.querySelector('[data-needle]'); if (n) n.setAttribute('transform', `rotate(${a.toFixed(1)})`); const t = root.querySelector('[data-bart]'); if (t) t.textContent = bar.toFixed(1) + ' bar'; const ph = (+root.dataset.ph || 0) + (m.run ? dt * 9 : 0); root.dataset.ph = ph; const p = root.querySelector('[data-piston]'); if (p) p.setAttribute('y', (60 + 14 * (0.5 + 0.5 * Math.sin(ph))).toFixed(1)); setLamp(root, id, m.run, m.fault); }
};
// ---- lathe: chuck (M1 direction) + tool carriage (M2 up/down)
M.lathe = {
  title: () => 'Lathe',
  draw(c){ const [a, b] = c.motors; return {W:320, H:150, svg:`<rect x="20" y="112" width="280" height="14" fill="#56656f"/><rect x="30" y="52" width="60" height="60" fill="#3b3f43"/><g class="spin" data-spin="${a}"><circle cx="100" cy="82" r="20" fill="#8f979c" stroke="#2a2d30" stroke-width="2"/>${[0, 120, 240].map(g => `<rect x="97" y="62" width="6" height="12" fill="#2a2d30" transform="rotate(${g} 100 82)"/>`).join('')}</g><rect x="120" y="76" width="110" height="12" fill="#d9924f" stroke="#8a4f1d"/><rect x="230" y="62" width="30" height="40" fill="#3b3f43"/><g data-carriage="1" transform="translate(160 40)"><rect width="36" height="26" fill="#aab1b6" stroke="#4b5257"/><path d="M18 26v10" stroke="#2a2d30" stroke-width="4"/><text x="18" y="17" text-anchor="middle" font-size="8">tool</text></g><path class="arrow" data-arrow="${a}" d="M100 40c14 0 22 8 22 20m-6-5l6 6l6-6" fill="none" stroke="var(--accent)" stroke-width="2.2"/>${motorIcon(8, 14, a, 'turning')}${motorIcon(262, 14, b, 'height')}`}; },
  update(root, S, dt){ const ids = (root.dataset.ms || '').split(','), ma = S.mot[ids[0]] || {}, mb = S.mot[ids[1]] || {}; rot(root, ids[0], ma.run ? (ma.dir || 1) * 500 * dt : 0); let y = +root.dataset.cy; if (isNaN(y)) y = 40; if (mb.run) y = clamp(y - (mb.dir || 1) * 18 * dt, 16, 56); root.dataset.cy = y; const cg = root.querySelector('[data-carriage]'); if (cg) cg.setAttribute('transform', `translate(160 ${y.toFixed(1)})`); const ar = root.querySelector('[data-arrow]'); if (ar){ ar.classList.toggle('on', !!ma.run); ar.setAttribute('transform', (ma.dir || 1) < 0 ? 'translate(200 0) scale(-1 1)' : ''); } setLamp(root, ids[0], ma.run, ma.fault); setLamp(root, ids[1], mb.run, mb.fault); }
};
// ---- garage / factory door: panel goes up or down between limits
M.door = {
  title: () => 'Garage door',
  draw(c){ const id = c.motors[0]; return {W:320, H:150, svg:`<rect x="90" y="14" width="150" height="124" fill="#e9eaec" stroke="#6d7479" stroke-width="3"/><rect x="96" y="20" width="138" height="112" fill="#1d1f21"/><g data-door="1"><rect data-panel="1" x="96" y="20" width="138" height="112" fill="#c3c7ca"/><g data-lines="1">${[0, 1, 2, 3].map(k => `<path d="M96 ${48 + k * 28}h138" stroke="#8a9096" stroke-width="2"/>`).join('')}</g></g><rect x="78" y="22" width="10" height="8" fill="#c3c7ca" stroke="#6d7479"/><rect x="78" y="122" width="10" height="8" fill="#c3c7ca" stroke="#6d7479"/><text x="60" y="30" font-size="9">LS up</text><text x="60" y="130" font-size="9">LS down</text><path class="arrow" data-arrow="1" d="M270 100V50m-7 8l7-8l7 8" fill="none" stroke="var(--accent)" stroke-width="2.5"/>${motorIcon(250, 112, id, 'door')}`}; },
  update(root, S, dt){ const id = root.dataset.m0, m = S.mot[id] || {}; let h = S.cart ? 1 - clamp(S.cart.x, 0, 1) : +root.dataset.h; if (isNaN(h)) h = 1; if (!S.cart && m.run) h = clamp(h - (m.dir || 1) * dt / 6, 0, 1); root.dataset.h = h; const p = root.querySelector('[data-panel]'); if (p) p.setAttribute('height', (112 * h).toFixed(1)); const ln = root.querySelector('[data-lines]'); if (ln) ln.setAttribute('transform', `translate(0 ${(-112 * (1 - h)).toFixed(1)})`); const ar = root.querySelector('[data-arrow]'); if (ar){ ar.classList.toggle('on', !!m.run); ar.setAttribute('transform', (m.dir || 1) < 0 ? 'translate(0 150) scale(1 -1)' : ''); } setLamp(root, id, m.run, m.fault); }
};
// ---- gauge: motor with speed gauge, direction arrow and star/delta mode
M.gauge = {
  title: () => 'Motor and speed gauge',
  draw(c){ const id = c.motors[0]; return {W:320, H:150, svg:`<rect x="40" y="56" width="110" height="60" rx="14" fill="#5d7f96"/><rect x="70" y="40" width="50" height="18" rx="3" fill="#8f979c"/><rect x="150" y="78" width="24" height="16" fill="#aab1b6"/><g class="spin" data-spin="${id}" transform="translate(186 86)"><circle r="12" fill="#cfd3d6" stroke="#4b5257"/><path d="M-12 0H12M0 -12V12" stroke="#4b5257" stroke-width="3"/></g><path class="arrow" data-arrow="1" d="M186 60a26 26 0 1 1 -26 26m2 -10l-2 10l-10 -3" fill="none" stroke="var(--accent)" stroke-width="2.5"/><circle cx="262" cy="70" r="34" fill="#f4f4f1" stroke="#555" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6].map(k => { const a = (-210 + k * 40) * Math.PI / 180; return `<path d="M${262 + 27 * Math.cos(a)} ${70 + 27 * Math.sin(a)}L${262 + 31 * Math.cos(a)} ${70 + 31 * Math.sin(a)}" stroke="#333" stroke-width="1.5"/>`; }).join('')}<text x="262" y="92" text-anchor="middle" font-size="8">rpm</text><path class="needle" data-needle="1" d="M262 70L262 44" stroke="#d32f2f" stroke-width="2.5" stroke-linecap="round" transform="rotate(-120)"/><circle cx="262" cy="70" r="3" fill="#333"/><text data-rpm="1" x="262" y="118" text-anchor="middle" class="mono" font-size="11">0 rpm</text><text class="mode" data-mode="1" x="95" y="92" text-anchor="middle" fill="#fff"></text>${lampDot(60, 70, id)}<text x="95" y="134" text-anchor="middle" font-size="10">${esc(c.labels[id] || 'motor')}</text>`}; },
  update(root, S, dt){ const id = root.dataset.m0, m = S.mot[id] || {}, rpm = +root.dataset.rpm || 0, tgt = m.run ? (m.mode === 'Y' ? 1000 : 1440) : 0, nr = rpm + (tgt - rpm) * clamp(dt * 2.5, 0, 1); root.dataset.rpm = nr; const n = root.querySelector('[data-needle]'); if (n) n.setAttribute('transform', `rotate(${(-120 + 240 * clamp(nr / 1800, 0, 1)).toFixed(1)})`); const t = root.querySelector('[data-rpm]'); if (t) t.textContent = Math.round(nr) + ' rpm'; const md = root.querySelector('[data-mode]'); if (md) md.textContent = m.run ? (m.mode === 'Y' ? 'Y star' : 'Δ delta') + (m.dir < 0 ? ' ↺' : ' ↻') : (m.fault === '1ph' ? '⚠ phase missing' : m.fault === 'burn' ? '🔥' : ''); rot(root, id, nr > 10 ? (m.dir || 1) * nr * 0.5 * dt : 0); const ar = root.querySelector('[data-arrow]'); if (ar){ ar.classList.toggle('on', !!m.run); ar.setAttribute('transform', (m.dir || 1) < 0 ? 'translate(372 0) scale(-1 1)' : ''); } setLamp(root, id, m.run, m.fault); }
};
// ---- line: one mini-machine per motor, chosen per exercise from the story (LINE_MAP below)
const UT = {
  belt: id => `<rect x="18" y="66" width="128" height="14" rx="7" fill="#3b3f43"/><path class="belt" data-ub="${id}" d="M25 73H139"/>${[25, 82, 139].map(x => `<circle cx="${x}" cy="73" r="5" fill="#8f979c" stroke="#2a2d30"/>`).join('')}${[0, 1, 2].map(k => `<g data-ubox="${k}" transform="translate(${26 + k * 40} 48)"><rect width="24" height="18" rx="2" fill="#c99a5b" stroke="#6b4a1f"/><path d="M3 9h18" stroke="#6b4a1f"/></g>`).join('')}`,
  pump: id => `<path d="M8 92h30" stroke="#8f979c" stroke-width="7"/><path class="flow" data-uf="${id}" d="M8 92h30" stroke="#4ea0ff" stroke-width="3" stroke-dasharray="5 5"/><circle cx="56" cy="74" r="22" fill="#2f6fb5" stroke="#1d3f6b" stroke-width="2"/><g class="spin" data-spin="${id}" transform="translate(56 74)">${[0, 60, 120, 180, 240, 300].map(a => `<path d="M0 0L${(15 * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(15 * Math.sin(a * Math.PI / 180)).toFixed(1)}" stroke="#cfe3ff" stroke-width="3" stroke-linecap="round"/>`).join('')}<circle r="4" fill="#cfe3ff"/></g><path d="M56 52V30H146V44" fill="none" stroke="#8f979c" stroke-width="7"/><path class="flow" data-uf2="${id}" d="M56 52V30H146V44" fill="none" stroke="#4ea0ff" stroke-width="3" stroke-dasharray="5 5"/><rect x="118" y="44" width="38" height="46" rx="3" fill="none" stroke="#56656f" stroke-width="2.5"/><rect data-ulvl="${id}" x="120" y="70" width="34" height="18" fill="#4ea0ff" opacity=".75"/>`,
  mixer: id => `<path d="M30 30h100l-8 60H38Z" fill="#c3c7ca" stroke="#56656f" stroke-width="2.5"/><path d="M36 50h88l-5 38H41Z" fill="#d9a45b" opacity=".85"/><rect x="66" y="10" width="28" height="16" rx="3" fill="#56656f"/><path d="M80 26V80" stroke="#2a2d30" stroke-width="4"/><g data-upad="${id}" transform="translate(80 70)"><rect x="-28" y="-4" width="56" height="8" rx="3" fill="#8a9096" stroke="#2a2d30"/></g><g data-upad2="${id}" transform="translate(80 52)"><rect x="-20" y="-3" width="40" height="6" rx="3" fill="#8a9096" stroke="#2a2d30"/></g>`,
  grinder: id => `<path d="M48 8h64l-18 26H66Z" fill="#9aa0a5" stroke="#4b5257" stroke-width="2"/><g data-ugrain="${id}">${[0, 1, 2, 3].map(k => `<circle cx="${74 + (k % 2) * 10}" cy="${36 + k * 5}" r="2" fill="#d9a45b"/>`).join('')}</g><g class="spin" data-spin="${id}" transform="translate(64 62)"><circle r="20" fill="#7d858b" stroke="#2a2d30" stroke-width="2"/>${[0, 45, 90, 135].map(a => `<path d="M-20 0H20" stroke="#4b5257" stroke-width="2" transform="rotate(${a})"/>`).join('')}<circle r="5" fill="#2a2d30"/></g><g class="spin" data-spin="${id}~2" transform="translate(104 62)"><circle r="20" fill="#7d858b" stroke="#2a2d30" stroke-width="2"/>${[0, 45, 90, 135].map(a => `<path d="M-20 0H20" stroke="#4b5257" stroke-width="2" transform="rotate(${a})"/>`).join('')}<circle r="5" fill="#2a2d30"/></g><rect x="40" y="86" width="90" height="6" fill="#56656f"/>`,
  saw: id => `<rect x="10" y="74" width="140" height="14" fill="#c99a5b" stroke="#6b4a1f"/><path d="M10 81h140" stroke="#a7783f" stroke-dasharray="14 6"/><g class="spin" data-spin="${id}" transform="translate(84 52)"><circle r="30" fill="#d9dde0" stroke="#6d7479" stroke-width="1.5"/>${Array.from({length: 18}, (_, k) => `<path d="M0 -30L5 -36L8 -29Z" fill="#9aa0a5" transform="rotate(${k * 20})"/>`).join('')}<circle r="8" fill="#6d7479"/><path d="M-30 0H30" stroke="#b4b9be"/></g><path d="M50 18h68v16H50Z" fill="#e0a21b" stroke="#8a6200" opacity=".9"/>`,
  drum: id => `<rect x="34" y="12" width="96" height="84" rx="10" fill="#e9eaec" stroke="#6d7479" stroke-width="2"/><circle cx="82" cy="54" r="32" fill="#2a2d30"/><g class="spin" data-spin="${id}" transform="translate(82 54)"><circle r="28" fill="#aab1b6"/>${Array.from({length: 12}, (_, k) => `<circle cx="${(18 * Math.cos(k * Math.PI / 6)).toFixed(1)}" cy="${(18 * Math.sin(k * Math.PI / 6)).toFixed(1)}" r="3" fill="#6d7479"/>`).join('')}<path d="M0 -28V-14M0 28V14" stroke="#4b5257" stroke-width="5"/><rect x="-10" y="-6" width="14" height="10" rx="2" fill="#4ea0ff"/></g>`,
  winder: id => `<path data-uthr="${id}" d="M10 30L60 46" stroke="#d32f2f" stroke-width="2" stroke-dasharray="4 3"/><rect x="40" y="86" width="100" height="8" fill="#56656f"/><path d="M90 86V60" stroke="#56656f" stroke-width="6"/><g class="spin" data-spin="${id}" transform="translate(90 54)"><circle r="30" fill="#c99a5b" stroke="#6b4a1f" stroke-width="2"/><circle r="22" fill="#d32f2f" opacity=".85"/>${[0, 60, 120].map(a => `<path d="M-22 0H22" stroke="#9b1f1f" stroke-width="2" transform="rotate(${a})"/>`).join('')}<circle r="6" fill="#4b5257"/></g>`,
  press: id => `<rect x="34" y="6" width="96" height="12" fill="#56656f"/><rect x="34" y="6" width="10" height="88" fill="#56656f"/><rect x="120" y="6" width="10" height="88" fill="#56656f"/><rect x="34" y="84" width="96" height="10" fill="#3b3f43"/><g data-uram="${id}" transform="translate(0 0)"><rect x="76" y="18" width="12" height="24" fill="#b4b9be"/><rect x="56" y="42" width="52" height="12" rx="2" fill="#8a9096" stroke="#2a2d30"/></g><rect x="62" y="74" width="40" height="10" rx="2" fill="#d9a45b" stroke="#8a5a1f"/>`,
  comp: id => `<rect x="24" y="56" width="70" height="38" rx="6" fill="#3b3f43"/><rect x="44" y="20" width="22" height="40" fill="#aab1b6" stroke="#4b5257"/><rect data-upis="${id}" x="47" y="24" width="16" height="12" fill="#d9924f"/><g class="spin" data-spin="${id}" transform="translate(55 76)"><circle r="12" fill="#6d7479"/><path d="M0 0L0 -10" stroke="#e0e3e5" stroke-width="3"/></g><path d="M94 70h20" stroke="#6d7479" stroke-width="5"/><rect x="112" y="40" width="38" height="54" rx="14" fill="#8f979c" stroke="#4b5257" stroke-width="2"/><circle cx="131" cy="30" r="10" fill="#f4f4f1" stroke="#555"/><path data-uneedle="${id}" d="M131 30L131 22" stroke="#d32f2f" stroke-width="2" transform="rotate(-100 131 30)"/>`,
  welder: id => `<rect x="18" y="40" width="56" height="52" rx="4" fill="#2f6fb5" stroke="#1d3f6b" stroke-width="2"/><circle cx="34" cy="56" r="6" fill="#cfd3d6"/><rect x="46" y="52" width="20" height="8" fill="#1d2226"/><path d="M74 70C100 70 96 40 118 44" fill="none" stroke="#2a2d30" stroke-width="3"/><path d="M112 40l12 10" stroke="#4b5257" stroke-width="6" stroke-linecap="round"/><rect x="96" y="80" width="56" height="10" fill="#9aa0a5"/><g data-uspark="${id}" opacity="0">${[[-10, -6], [8, -10], [12, 4], [-6, 8], [2, -14]].map(([dx, dy]) => `<path d="M126 74l${dx} ${dy}" stroke="#ffd24d" stroke-width="2"/>`).join('')}<circle cx="126" cy="76" r="5" fill="#fff6c2"/></g>`,
  cart: id => `<path d="M10 84H150" stroke="#56656f" stroke-width="4"/><text x="14" y="100" font-size="10" font-weight="700">A</text><text x="140" y="100" font-size="10" font-weight="700">B</text><g data-ucart="${id}" transform="translate(14 0)"><rect y="58" width="40" height="20" rx="3" fill="#e0a21b" stroke="#8a6200"/><circle cx="9" cy="80" r="5" fill="#2a2d30"/><circle cx="31" cy="80" r="5" fill="#2a2d30"/><rect x="8" y="46" width="24" height="12" fill="#c3c7ca" stroke="#6d7479"/></g>`,
  hoist: id => `<rect x="60" y="6" width="44" height="8" fill="#e0a21b" stroke="#8a6200"/><path d="M40 12V96M124 12V96" stroke="#8f979c" stroke-width="4"/><path data-urope="${id}" d="M82 14V50" stroke="#333" stroke-width="2"/><g data-ucage="${id}" transform="translate(0 50)"><rect x="56" width="52" height="30" rx="3" fill="#8a9096" stroke="#333"/><rect x="64" y="10" width="14" height="12" fill="#c99a5b" stroke="#6b4a1f"/></g>`,
  fan: id => `<circle cx="84" cy="52" r="40" fill="#3b3f43"/><circle cx="84" cy="52" r="35" fill="#1d1f21"/><g class="spin" data-spin="${id}" transform="translate(84 52)">${[0, 72, 144, 216, 288].map(a => `<path d="M0 0Q${(22 * Math.cos((a - 20) * Math.PI / 180)).toFixed(1)} ${(22 * Math.sin((a - 20) * Math.PI / 180)).toFixed(1)} ${(31 * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(31 * Math.sin(a * Math.PI / 180)).toFixed(1)}Q${(22 * Math.cos((a + 25) * Math.PI / 180)).toFixed(1)} ${(22 * Math.sin((a + 25) * Math.PI / 180)).toFixed(1)} 0 0Z" fill="#cfd3d6" stroke="#8a9096"/>`).join('')}<circle r="6" fill="#8f979c"/></g>`,
  motor: id => `<rect x="36" y="40" width="70" height="42" rx="10" fill="#2f5f8f"/>${[0, 1, 2, 3, 4].map(k => `<path d="M46 ${46 + k * 7}H100" stroke="#244b72" stroke-width="2"/>`).join('')}<rect x="56" y="30" width="30" height="12" rx="2" fill="#3a6d9e"/><rect x="106" y="56" width="18" height="10" fill="#aab1b6"/><g class="spin" data-spin="${id}" transform="translate(132 61)"><circle r="12" fill="#cfd3d6" stroke="#4b5257"/><path d="M-12 0H12M0 -12V12" stroke="#4b5257" stroke-width="2.4"/></g>`
};
M.line = {
  title: (n, c) => (c && c.lineTitle) || 'machine',
  draw(c){ const n = c.motors.length, W = 164 * n, H = 146; let s = '';
    c.motors.forEach((id, i) => { const t = c.units[id] || ['motor', ''], ox = i * 164;
      s += `<g data-unit="${id}" data-ut="${t[0]}" transform="translate(${ox} 0)">${i ? `<path d="M0 6V140" stroke="var(--line)" stroke-dasharray="3 4"/>` : ''}${(UT[t[0]] || UT.motor)(id)}${motorIcon(6, 106, id, t[1] || '')}<text data-udir="${id}" x="62" y="120" font-size="13" fill="var(--accent)"></text></g>`; });
    return {svg:s, W, H}; },
  update(root, S, dt){ root.querySelectorAll('[data-unit]').forEach(g => {
      const id = g.dataset.unit, t = g.dataset.ut, m = S.mot[id] || {}, run = m.run ? 1 : 0, dir = m.dir || 1, k = run * (m.mode === 'Y' ? .55 : 1), q = s => g.querySelector(s);
      const ph = (+g.dataset.ph || 0) + k * dt * dir; g.dataset.ph = ph;
      const d = q('[data-udir]'); if (d) d.textContent = run ? (dir < 0 ? '↺' : '↻') + (m.mode === 'Y' ? ' Y' : m.mode === 'D' ? ' Δ' : '') : '';
      if (t === 'belt'){ const off = ph * 45; g.querySelectorAll('[data-ubox]').forEach((b, j) => { const x = 18 + ((((j * 40 + off) % 120) + 120) % 120); b.setAttribute('transform', `translate(${x.toFixed(1)} 48)`); b.style.opacity = x > 122 ? Math.max(0, (138 - x) / 16) : x < 26 ? Math.max(0, (x - 18) / 8) : 1; }); const bl = q('[data-ub]'); if (bl) bl.setAttribute('stroke-dashoffset', (-off % 12).toFixed(1)); }
      else if (t === 'pump'){ rot(root, id, k * dir * 620 * dt); [q('[data-uf]'), q('[data-uf2]')].forEach(f => { if (f){ f.setAttribute('stroke-dashoffset', (-ph * 40 % 10).toFixed(1)); f.style.opacity = run ? 1 : .15; } }); const lv = q('[data-ulvl]'); if (lv){ let h = +g.dataset.lv || 8; h = run ? Math.min(42, h + dt * 5) : h; g.dataset.lv = h; lv.setAttribute('y', (88 - h).toFixed(1)); lv.setAttribute('height', h.toFixed(1)); } }
      else if (t === 'mixer'){ const p1 = q('[data-upad]'), p2 = q('[data-upad2]'); if (p1) p1.setAttribute('transform', `translate(80 70) scale(${Math.cos(ph * 7).toFixed(3)} 1)`); if (p2) p2.setAttribute('transform', `translate(80 52) scale(${Math.cos(ph * 7 + 1.57).toFixed(3)} 1)`); }
      else if (t === 'grinder'){ rot(root, id, k * dir * 260 * dt); rot(root, id + '~2', -k * dir * 260 * dt); const gr = q('[data-ugrain]'); if (gr) gr.setAttribute('transform', run ? `translate(0 ${((ph * 30) % 10).toFixed(1)})` : ''); }
      else if (t === 'saw') rot(root, id, k * dir * 1100 * dt);
      else if (t === 'drum') rot(root, id, k * dir * 300 * dt);
      else if (t === 'winder'){ rot(root, id, k * dir * 320 * dt); const th = q('[data-uthr]'); if (th) th.setAttribute('stroke-dashoffset', (-ph * 30 % 7).toFixed(1)); }
      else if (t === 'press'){ const r = q('[data-uram]'); if (r) r.setAttribute('transform', `translate(0 ${(10 * (1 - Math.cos(Math.abs(ph) * 4))).toFixed(1)})`); }
      else if (t === 'comp'){ rot(root, id, k * 700 * dt); const pi = q('[data-upis]'); if (pi) pi.setAttribute('y', (24 + 10 * (0.5 + 0.5 * Math.sin(Math.abs(ph) * 12))).toFixed(1)); const nd = q('[data-uneedle]'); if (nd){ let pr = +g.dataset.pr || 0; pr = clamp(pr + (run ? dt * .25 : -dt * .05), 0, 1); g.dataset.pr = pr; nd.setAttribute('transform', `rotate(${(-100 + 200 * pr).toFixed(1)} 131 30)`); } }
      else if (t === 'welder'){ const sp = q('[data-uspark]'); if (sp) sp.setAttribute('opacity', run && Math.random() > .3 ? (0.5 + Math.random() * .5).toFixed(2) : 0); }
      else if (t === 'cart'){ let x = S.cart ? clamp(S.cart.x, 0, 1) : clamp((+g.dataset.cx || 0) + k * dir * dt / 5, 0, 1); g.dataset.cx = x; const c2 = q('[data-ucart]'); if (c2) c2.setAttribute('transform', `translate(${(14 + x * 92).toFixed(1)} 0)`); }
      else if (t === 'hoist'){ let x = S.cart ? clamp(S.cart.x, 0, 1) : clamp((g.dataset.cx == null ? .3 : +g.dataset.cx) + k * dir * dt / 6, 0, 1); g.dataset.cx = x; const y = 16 + (1 - x) * 62; const cg = q('[data-ucage]'); if (cg) cg.setAttribute('transform', `translate(0 ${y.toFixed(1)})`); const rp = q('[data-urope]'); if (rp) rp.setAttribute('d', `M82 14V${y.toFixed(1)}`); }
      else rot(root, id, k * dir * (t === 'fan' ? 760 : 640) * dt);
      setLamp(root, id, run, m.fault); });
    root.dataset.run = S.mot && Object.values(S.mot).some(x => x.run) ? 1 : 0; }
};
// per exercise (lesson/exercise key): [machine title, {motor: [unit type, label]}]
const LINE_MAP = {
  'l3/c1': ['Grinder motor', {M1: ['grinder', 'grinder']}],
  'l3/x4': ['Mill: grinder and conveyor', {M1: ['grinder', 'grinder'], M2: ['belt', 'conveyor']}],
  'l4/p2': ['Air compressor', {M1: ['comp', 'compressor']}],
  'l4/o1': ['Drainage pump', {M1: ['pump', 'Drainage pump']}],
  'l5/e14': ['Filling line', {M1: ['belt', 'Filling conveyor'], M2: ['belt', 'Packing conveyor']}],
  'l5/w1': ['Filling line', {M1: ['belt', 'Filling conveyor'], M2: ['belt', 'Packing conveyor']}],
  'l5/w2': ['Filling line', {M1: ['belt', 'Filling conveyor'], M2: ['belt', 'Packing conveyor']}],
  'l5/e15': ['Mill', {M1: ['motor', 'small motor'], M2: ['grinder', 'grinder (large)']}],
  'l5/e16': ['3 conveyors in a row', {M1: ['belt', 'Conveyor 1'], M2: ['belt', 'Conveyor 2'], M3: ['belt', 'Conveyor 3']}],
  'l5/e21': ['Two water pumps in turn', {M1: ['pump', 'Pump 1'], M2: ['pump', 'Pump 2']}],
  'l5/e17': ['3 paint mixers', {M1: ['mixer', 'Mixer 1'], M2: ['mixer', 'Mixer 2'], M3: ['mixer', 'Mixer 3']}],
  'l5/e18': ['Dough line', {M1: ['mixer', 'mixer'], M2: ['belt', 'conveyor'], M3: ['press', 'press']}],
  'l5/e19': ['Filling machine', {M1: ['belt', 'main (conveyor)'], M2: ['pump', 'Aux 1'], M3: ['pump', 'Aux 2']}],
  'l5/e20': ['Tank wash cycle', {M1: ['mixer', 'tank mixer'], M2: ['pump', 'wash pump'], M3: ['pump', 'rinse pump']}],
  'l5/e22': ['Industrial washing machine', {M1: ['drum', 'washer drum']}],
  'l5/e23': ['Liquid filling station', {M1: ['cart', 'cart'], M2: ['pump', 'pump']}],
  'l5/e24': ['Cutting machine', {M1: ['belt', 'feed conveyor'], M2: ['saw', 'cutting blade']}],
  'l6/m1': ['Wood saw', {M1: ['saw', 'saw']}],
  'l6/m7': ['Wood saw', {M1: ['saw', 'saw']}],
  'l8/e5': ['Juice factory', {M1: ['belt', 'Filling conveyor'], M2: ['belt', 'Packing conveyor']}],
  'l8/e7': ['Workshop: compressor and welder', {M1: ['comp', 'compressor'], M2: ['welder', 'welder']}],
  'l8/e8': ['Mill', {M1: ['grinder', 'grinder'], M2: ['drum', 'sorter'], M3: ['belt', 'conveyor']}],
  'l8/e9': ['Printing machine', {M1: ['belt', 'paper conveyor']}],
  'l8/e12': ['Winding machine', {M1: ['winder', 'winding reel']}],
  'l9/sd1': ['Brick factory mixer', {M1: ['mixer', 'mixer 7.5 kW']}],
  'l9/sd2': ['Irrigation pump', {M1: ['pump', 'Irrigation pump']}],
  'l9/br1': ['Circular saw', {M1: ['saw', 'saw']}],
  'l9/br2': ['Packing machine', {M1: ['belt', 'Packing conveyor']}],
  'l9/br3': ['hoist', {M1: ['hoist', 'hoist']}],
  'l9/ac1': ['Central A/C', {M1: ['comp', 'compressor'], M2: ['fan', 'condenser fan']}],
  'l9/ac2': ['Central A/C', {M1: ['comp', 'compressor'], M2: ['fan', 'condenser fan']}],
  'l9/ac3': ['Central A/C', {M1: ['comp', 'compressor'], M2: ['fan', 'condenser fan']}],
  'l9/ss1': ['Water pump', {M1: ['pump', 'pump 45 kW']}],
  'l9/ss3': ['Water pump', {M1: ['pump', 'pump']}]
};
FX.LINE_MAP = LINE_MAP;
function setLamp(root, id, run, fault){ const l = root.querySelector(`[data-lamp="${id}"]`); if (!l) return; l.classList.toggle('on', !!run && !fault); l.classList.toggle('f', !!fault); }
function rot(root, id, deg){ const g = root.querySelector(`[data-spin="${id}"]`); if (!g) return; const a = ((+g.dataset.a || 0) + deg) % 360; g.dataset.a = a; const base = g.dataset.base || (g.dataset.base = (g.getAttribute('transform') || '').replace(/rotate\([^)]*\)/, '').trim()); g.setAttribute('transform', `${base} rotate(${a.toFixed(1)})`.trim()); }
function machineCtx(ex, devs){
  const motors = devs.filter(d => TYPES[d.type] && TYPES[d.type].motor).map(d => d.id);
  const labels = {}; devs.forEach(d => { if (d.name) labels[d.id] = d.name; });
  const tank = devs.find(d => d.type === 'tank'), cart = devs.find(d => d.type === 'cart');
  const levels = devs.filter(d => d.type === 'level').map(d => ({id:d.tag || d.id, at:d.cfg.at != null ? d.cfg.at : 0.5}));
  const press = devs.find(d => d.type === 'level' && d.cfg.look === 'press');
  return {motors, labels, tank, cart, levels, max: press && press.cfg.max || (tank && tank.cfg.max) || 10};
}
FX.machineFor = function(ex, devs, key){
  const c = machineCtx(ex, devs); if (!c.motors.length) return null;
  const lm = key && LINE_MAP[key];
  if (lm){ const ms = Object.keys(lm[1]).filter(m => c.motors.indexOf(m) > -1); if (ms.length){ c.motors = ms; c.units = lm[1]; c.lineTitle = lm[0]; ms.forEach(m => { c.labels[m] = lm[1][m][1]; }); return Object.assign(c, {kind:'line', m:M.line}); } }
  let kind = typeof ex.machine === 'string' ? ex.machine : ex.machine && ex.machine.kind;
  if (!kind || !M[kind]){
    if (c.tank && (c.tank.cfg.look === 'air' || c.levels.some(l => /press/.test(l.id)) || devs.some(d => d.type === 'level' && d.cfg.look === 'press'))) kind = 'compressor';
    else if (c.tank) kind = 'pump';
    else if (c.cart && devs.some(d => d.type === 'ls')) kind = 'hoist';
    else if (c.motors.length === 2 && devs.filter(d => d.type === 'contactor').length >= 4) kind = 'lathe';
    else kind = 'conveyor';
  }
  if (ex.machine && typeof ex.machine === 'object'){ if (ex.machine.motors) c.motors = ex.machine.motors.filter(m => c.motors.indexOf(m) > -1); Object.assign(c.labels, ex.machine.labels || {}); }
  if (kind === 'lathe' && c.motors.length < 2) kind = 'gauge';
  return Object.assign(c, {kind, m:M[kind]});
};
function mountMachine(e){
  const host = e.host, ex = e.ex, api = e.api; let slot = host.querySelector('.bn-machine');
  const mc = FX.machineFor(ex, api.devs, e.key);
  if (!mc){ if (slot) slot.hidden = true; return null; }
  if (!slot){ slot = document.createElement('div'); slot.className = 'bn-machine'; const b = host.querySelector('.bn-board'); if (b && b.parentNode) b.parentNode.insertBefore(slot, b.nextSibling); else host.appendChild(slot); }
  const d = mc.m.draw(mc), hide = !!st.get('machine/hide');
  slot.hidden = false; slot.classList.toggle('off', hide);
  slot.innerHTML = `<div class="fx-mh"><h4>🏭 Machine: ${esc(mc.m.title(mc.motors.length, mc))}</h4><span class="fx-mst">stopped</span><button type="button" class="btn" data-fx="mtoggle" aria-pressed="${hide ? 'false' : 'true'}">${hide ? 'Show the machine' : 'Hide'}</button></div><svg class="fx-m" data-kind="${mc.kind}" data-m0="${esc(mc.motors[0])}" data-ms="${esc(mc.motors.join(','))}" data-max="${mc.max}" data-run="0" data-dir="1" viewBox="0 0 ${d.W} ${d.H}" role="img" aria-label="Animated drawing of the machine">${d.svg}</svg>`;
  const svg = slot.querySelector('svg'), stEl = slot.querySelector('.fx-mst');
  slot.querySelector('[data-fx=mtoggle]').addEventListener('click', ev => { const h = !slot.classList.contains('off'); slot.classList.toggle('off', h); st.set('machine/hide', h ? 1 : null); ev.target.textContent = h ? 'Show the machine' : 'Hide'; ev.target.setAttribute('aria-pressed', h ? 'false' : 'true'); });
  const mach = {slot, svg, mc, S:{mot:{}, live:false}, raf:null, last:0,
    state(res, live){ const o = {mot:{}, live:!!live}; mc.motors.forEach(id => { const m = live && res && res.mot && res.mot[id]; o.mot[id] = m ? {run:m.run ? 1 : 0, dir:m.dir || 1, mode:m.mode, fault:m.fault} : {run:0, dir:1, mode:'', fault: live && res && res.mot && res.mot[id] ? res.mot[id].fault : ''}; }); if (mc.cart){ o.cart = {x:mc.cart.st.x}; o.cartSign = mc.cart.cfg.sign || 1; } if (mc.tank) o.tank = {lvl:mc.tank.st.lvl}; return o; },
    apply(res, live){ this.S = this.state(res, live); const any = mc.motors.some(id => this.S.mot[id].run); const first = mc.motors.find(id => this.S.mot[id].run); svg.dataset.run = any ? '1' : '0'; svg.dataset.dir = first ? String(this.S.mot[first].dir) : svg.dataset.dir; svg.dataset.mode = first ? (this.S.mot[first].mode || '') : ''; stEl.textContent = any ? 'running ' + (this.S.mot[first].dir < 0 ? '↺ rev' : '↻ fwd') + (this.S.mot[first].mode === 'Y' ? ' (star)' : '') : mc.motors.some(id => this.S.mot[id].fault) ? '⚠ fault' : 'stopped'; stEl.classList.toggle('on', any); this.step(true); if (any && !this.raf) this.loop(); },
    step(force){ const t = now(), dt = this.last ? Math.min(0.1, (t - this.last) / 1000) : 0.016; this.last = t; if (slot.classList.contains('off') && !force) return; mc.m.update(svg, this.S, dt); },
    loop(){ const run = () => { if (this.dead) return; this.step(); const any = mc.motors.some(id => this.S.mot[id].run); if (any) this.raf = requestAnimationFrame(run); else { this.raf = null; this.last = 0; } }; this.raf = requestAnimationFrame(run); },
    destroy(){ this.dead = true; if (this.raf) cancelAnimationFrame(this.raf); }
  };
  mach.step(true);
  return mach;
}

/* =========================== 4. points, timer, leaderboard, badges =========================== */
const BADGES_ALL = [
  {id:'first', ico:'🔌', t:'First circuit', d:'First exercise passed'},
  {id:'interlock', ico:'🔒', t:'Interlock king', d:'3 interlock circuits (reversing or two relays)'},
  {id:'hunter', ico:'🔍', t:'Fault hunter', d:'5 hidden faults found and fixed'},
  {id:'fast', ico:'⚡', t:'Beat the clock', d:'5 exercises under the target time'},
  {id:'clean', ico:'✨', t:'Flawless', d:'10 exercises with no mistakes and no solution'},
  {id:'timers', ico:'⏱', t:'Timer master', d:'5 exercises from the timers lesson'},
  {id:'marathon', ico:'🏃', t:'Marathon', d:'25 exercises'},
  {id:'champ', ico:'🏆', t:'Challenge champ', d:'Won a challenge against a friend'}
];
const BADGES = FX.BADGES = BADGES_ALL.filter(b => (b.id !== 'hunter' || FX.flags.faults) && (b.id !== 'champ' || FX.flags.challenge));
const bOf = id => BADGES_ALL.find(x => x.id === id);
const INTERLOCK = ['l2/il', 'l8/e10', 'l8/e11', 'l8/e12', 'l8/e13', 'l9/sd1', 'l9/sd2', 'l9/sd4', 'l9/br2'];
const SC = FX.score = {
  cur:null, // {key, ex, t0, hints, wrong, shown, timerId, target, base}
  me(){ return st.get('me') || ''; },
  setName(n){ n = String(n || '').trim().slice(0, 24); const old = SC.me(); if (!n || n === old) return; const P = SC.players(); if (P[old || '__me']){ P[n] = Object.assign(P[n] || {}, P[old || '__me']); delete P[old || '__me']; } st.set('players', P); st.set('me', n); if (!CL.store.get('cert/name')) CL.store.set('cert/name', n); },
  players(){ const P = st.get('players'); return P && typeof P === 'object' ? P : {}; },
  mine(){ return SC.players()[SC.me() || '__me'] || {}; },
  target(ex){ if (ex.target) return ex.target; const n = (ex.solution || []).length; return Math.max(45, 15 + n * 7); },
  base(ex){ return 40 + 4 * (ex.solution || []).length; },
  points(ex, t, hints, wrong){ const tg = SC.target(ex), base = SC.base(ex), bonus = t <= tg ? 50 : Math.max(0, 50 - Math.round((t - tg) / tg * 50)); return {pts:Math.max(10, base + bonus - 15 * hints - 8 * wrong), base, bonus, tg}; },
  record(name, key, rec){ const P = SC.players(); name = name || '__me'; P[name] = P[name] || {}; const old = P[name][key]; if (!old || rec.pts > old.pts) P[name][key] = Object.assign({at:Date.now()}, rec); st.set('players', P); return !old || rec.pts > old.pts; },
  total(rec){ return Object.keys(rec || {}).reduce((a, k) => a + ((rec[k] && rec[k].pts) || 0), 0); },
  lesson(lid, rec){ rec = rec || SC.mine(); return Object.keys(rec).filter(k => k.indexOf(lid + '/') === 0 && !/^fault\//.test(k)).reduce((a, k) => a + rec[k].pts, 0); },
  board(){ const P = SC.players(), me = SC.me() || '__me'; return Object.keys(P).map(n => ({name:n === '__me' ? 'Trainee' : n, me:n === me, pts:SC.total(P[n]), n:Object.keys(P[n]).filter(k => !/^fault\//.test(k)).length, faults:Object.keys(P[n]).filter(k => /^fault\//.test(k)).length})).sort((a, b) => b.pts - a.pts).slice(0, 10); },
  badges(){ const b = st.get('badges'); return b && typeof b === 'object' ? b : {}; },
  award(){ // returns newly earned badge ids
    const have = SC.badges(), mine = SC.mine(), keys = Object.keys(mine).filter(k => !/^fault\//.test(k)), got = [];
    const give = id => { if (!have[id]){ have[id] = Date.now(); got.push(id); } };
    if (keys.length >= 1) give('first');
    if (keys.filter(k => INTERLOCK.indexOf(k) > -1).length >= 3) give('interlock');
    if ((st.get('faultsFixed') || 0) >= 5) give('hunter');
    if (keys.filter(k => mine[k].fast).length >= 5) give('fast');
    if (keys.filter(k => mine[k].clean).length >= 10) give('clean');
    if (keys.filter(k => k.indexOf('l5/') === 0).length >= 5) give('timers');
    if (keys.length >= 25) give('marathon');
    if (st.get('champ')) give('champ');
    if (got.length) st.set('badges', have);
    return got;
  },
  start(e){ SC.stop(); const ex = e.ex; SC.cur = {key:e.key, ex, t0:null, hints:0, wrong:0, target:SC.target(ex), passed:false}; SC.render(e.host); },
  stop(){ if (SC.cur && SC.cur.timerId) clearInterval(SC.cur.timerId); SC.cur = null; },
  tick(){ const c = SC.cur; if (!c || !c.t0) return; const t = (now() - c.t0) / 1000, el = c.bar && c.bar.querySelector('.fx-clock'); if (el){ el.textContent = mmss(t); el.classList.toggle('over', t > c.target); } },
  firstWire(){ const c = SC.cur; if (!c || c.t0 || c.passed) return; c.t0 = now(); c.timerId = setInterval(SC.tick, 1000); SC.tick(); },
  elapsed(){ const c = SC.cur; return c && c.t0 ? (now() - c.t0) / 1000 : 0; },
  render(host){ const c = SC.cur; if (!c) return; let slot = host.querySelector('.bn-fx'); if (!slot){ slot = document.createElement('div'); slot.className = 'bn-fx'; const r = host.querySelector('.bn-res'); if (r && r.parentNode) r.parentNode.insertBefore(slot, r.nextSibling); else host.appendChild(slot); }
    const best = SC.mine()[c.key];
    slot.innerHTML = `<div class="fx-bar" data-fx="bar"><span>⏱ <span class="fx-clock">0:00</span></span><span class="fx-tgt">target ${mmss(c.target)}</span><span class="fx-best">${best ? `⭐ best ${best.pts} pts (${mmss(best.t)})` : '⭐ no points yet'}</span><span class="fx-btns">${FX.flags.challenge ? '<button type="button" class="btn" data-fx="challenge">⚔️ Challenge a friend</button>' : ''}${FX.flags.faults ? '<button type="button" class="btn" data-fx="fault" hidden>🔍 Add a hidden fault</button>' : ''}</span></div><div data-fx="pass"></div><div data-fx="fault-panel"></div>`;
    c.bar = slot.querySelector('[data-fx=bar]'); c.slot = slot;
    const chb = slot.querySelector('[data-fx=challenge]'), fb = slot.querySelector('[data-fx=fault]');
    if (chb) chb.addEventListener('click', () => CH.open(c));
    if (fb){ fb.addEventListener('click', () => FA.inject(c)); if (c.passedBefore) fb.hidden = false; }
  },
  pass(e){ const c = SC.cur; if (!c || c.key !== e.key) return; if (CH.active && CH.active.key === c.key){ CH.pass(c); return; }
    if (c.passed) return; c.passed = true; if (c.timerId) clearInterval(c.timerId);
    const t = c.t0 ? (now() - c.t0) / 1000 : 0, P = SC.points(c.ex, t, c.hints, c.wrong), fast = t <= c.target && c.t0, clean = !c.hints && !c.wrong;
    const better = SC.record(SC.me(), c.key, {pts:P.pts, t:Math.round(t), hints:c.hints, wrong:c.wrong, fast:!!fast, clean});
    const got = SC.award();
    const el = c.slot && c.slot.querySelector('[data-fx=pass]'); if (el){
      el.innerHTML = `<div class="fx-pass" role="status"><div class="fx-pts">+${P.pts} pts${better ? '' : ' <small class="muted">(your earlier best is higher)</small>'}</div><div class="fx-detail">time ${mmss(t)} of ${mmss(P.tg)} · base ${P.base} + speed ${P.bonus}${c.hints ? ` − solution ${15 * c.hints}` : ''}${c.wrong ? ` − mistakes ${8 * c.wrong}` : ''}</div>${got.length ? `<div>${got.map(id => { const b = bOf(id); return `<span class="fx-badge-new">${b.ico} ${esc(b.t)}</span>`; }).join('')} new badge!</div>` : ''}${SC.me() ? '' : `<form class="fx-name" data-fx="nameform"><label>Your name for the leaderboard: <input name="n" maxlength="24" placeholder="Your name" required></label><button type="submit" class="btn">Save</button></form>`}</div>`;
      const f = el.querySelector('[data-fx=nameform]'); if (f) f.addEventListener('submit', ev => { ev.preventDefault(); SC.setName(f.n.value); f.outerHTML = `<div class="fx-detail">Saved as <b>${esc(SC.me())}</b> ✓</div>`; });
    }
    const fb = c.slot && c.slot.querySelector('[data-fx=fault]'); if (fb) fb.hidden = false;
    c.passedBefore = true;
  }
};

// one name for the leaderboard and the hub certificate: adopt the certificate name (moves the anonymous scores to it)
try { if (!SC.me() && CL.store.get('cert/name')) SC.setName(CL.store.get('cert/name')); } catch (_) {}

/* =========================== 5. hidden faults + multimeter =========================== */
const COIL_R = d => d.type === 'timer' ? 8200 : (d.cfg.v || 230) <= 24 ? 310 : 1350;
const LAMP_R = d => (d.cfg.v || 230) <= 24 ? 95 : 11800;
const KINDS = {
  wire:{t:'Broken wire', sym:'The circuit doesn\'t complete: the device after this wire gets no voltage.', fix:'replace', how:'On ohms (power off): put the probes on both ends of the wire. A good wire reads 0 Ω and beeps; a broken one reads OL. Or on volts with power on: voltage at the start of the wire and none at its end.'},
  loose:{t:'Loose terminal (screw not tightened)', sym:'The wires on this screw act as if they\'re not connected: the circuit stops there.', fix:'fix', how:'Tug the wires one by one, or measure ohms from the screw to the far end of the wire: OL means the screw is loose. Tightening the screw fixes the fault.'},
  coil:{t:'Burned-out coil', sym:'The coil has voltage but doesn\'t pull in: no sound, no movement.', fix:'replace', how:'On volts: 230 V (or 24 V) on A1-A2 and the coil doesn\'t pull in → the coil is burned out. Confirm on ohms with power off: a good coil ≈ 1 kΩ, a burned one OL.'},
  weld:{t:'Welded contact', sym:'This contact stays closed even with the coil de-energised: the load runs by itself or won\'t stop.', fix:'replace', how:'On ohms with power off and the coil de-energised: a good NO contact reads OL; a welded one reads 0 Ω. Replace the contactor (or the auxiliary block).'},
  open:{t:'Open contact (dirty or broken)', sym:'This contact never closes: the circuit stops there.', fix:'fix', how:'On ohms: a good NC reads 0 Ω without pressing; a good NO reads 0 Ω while pressed. If it reads OL in both cases → the contact is faulty. Clean it or replace the block.'},
  fuse:{t:'Control breaker open inside (or a blown fuse)', sym:'No voltage on the whole control circuit.', fix:'replace', how:'On volts: voltage at the breaker input and 0 V at its output (or 230 V between the input and output of the same breaker) → the breaker/fuse is open. Replace it.'},
  ol:{t:'Overload set wrong (Ir below the motor current)', sym:'The motor starts, then after a while the overload trips and the fault lamp lights.', fix:'fix', how:'Look at the Ir dial and compare with the nameplate current. If Ir is below In, the motor trips on its normal load. Set Ir to In.'}
};
const FA = FX.faults = {
  cur:null, // {kind, dev, pair, wire, term, meas, wrong, ex, key, api, host, origIr}
  list(ex, api){
    const devs = api.devs, wires = api.wires(), byId = api.byId, out = [];
    const control = w => !(CL.isPowerWire && CL.isPowerWire(w, byId));
    const cw = wires.filter(control); if (cw.length >= 2 || wires.length >= 3) out.push('wire', 'loose');
    if (devs.some(d => TYPES[d.type].coil && wires.some(w => w.some(t => t.indexOf(d.id + ':A') === 0)))) out.push('coil');
    const blk = FA.blocks(api); if (blk.some(b => b.k === 'NO' && (b.dev.type === 'contactor' || b.dev.type === 'relay'))) out.push('weld');
    if (blk.length) out.push('open');
    if (devs.some(d => (d.type === 'mcb' && d.cfg.poles < 3) || d.type === 'fuse')) out.push('fuse');
    if (devs.some(d => d.type === 'ol') && devs.some(d => TYPES[d.type].motor)) out.push('ol');
    const allow = ex.faults; return allow ? out.filter(k => allow.indexOf(k) > -1) : out;
  },
  blocks(api){ // wired contact blocks (both terminals have a wire)
    const used = new Set(); api.wires().forEach(w => w.forEach(t => used.add(t))); const out = [];
    api.devs.forEach(d => (d.blocks || []).forEach(b => { if ((b.k === 'NO' || b.k === 'NC') && b.t.every(t => used.has(d.id + ':' + t))) out.push({dev:d, k:b.k, pair:b.t.slice()}); }));
    api.devs.forEach(d => { if (d.type === 'ol' && used.has(d.id + ':95') && used.has(d.id + ':96')) out.push({dev:d, k:'NC', pair:['95', '96']}); });
    return out;
  },
  pick(ex, api, kind){
    const devs = api.devs, wires = api.wires(), byId = api.byId, r = a => a[Math.floor(Math.random() * a.length)];
    const kinds = FA.list(ex, api); if (!kinds.length) return null; kind = kind && kinds.indexOf(kind) > -1 ? kind : r(kinds);
    const f = {kind};
    const control = wires.filter(w => !(CL.isPowerWire && CL.isPowerWire(w, byId)));
    if (kind === 'wire'){ f.wire = r(control.length ? control : wires); }
    else if (kind === 'loose'){ const ts = []; (control.length ? control : wires).forEach(w => w.forEach(t => { const d = byId[t.split(':')[0]]; if (d && !TYPES[d.type].isSupply && d.type !== 'tb') ts.push(t); })); f.term = r(ts); }
    else if (kind === 'coil'){ f.dev = r(devs.filter(d => TYPES[d.type].coil && wires.some(w => w.some(t => t.indexOf(d.id + ':A') === 0)))).id; }
    else if (kind === 'weld'){ const b = r(FA.blocks(api).filter(b => b.k === 'NO' && (b.dev.type === 'contactor' || b.dev.type === 'relay'))); f.dev = b.dev.id; f.pair = b.pair; }
    else if (kind === 'open'){ const b = r(FA.blocks(api)); f.dev = b.dev.id; f.pair = b.pair; f.k = b.k; }
    else if (kind === 'fuse'){ f.dev = r(devs.filter(d => (d.type === 'mcb' && d.cfg.poles < 3) || d.type === 'fuse')).id; }
    else if (kind === 'ol'){ const o = devs.find(d => d.type === 'ol'); f.dev = o.id; f.origIr = o.cfg.Ir; }
    return f;
  },
  // ---- solver hooks: wires filtered + device links/loads overridden while a fault is active
  wiresOf(wires){ const f = FA.cur; if (!f) return wires; const same = (w, p) => (w.a === p[0] && w.b === p[1]) || (w.a === p[1] && w.b === p[0]);
    if (f.kind === 'wire') return wires.filter(w => !same(w, f.wire));
    if (f.kind === 'loose') return wires.filter(w => w.a !== f.term && w.b !== f.term);
    return wires; },
  hook(){ if (FA.hooked) return; FA.hooked = true;
    const solve = CL.solve; CL.solve = function(devs, wires, opt){ return solve.call(this, devs, FA.wiresOf(wires), opt); };
    Object.keys(TYPES).forEach(ty => { const T = TYPES[ty], L = T.links, LD = T.loads;
      T.links = function(d, force){ let a = L.call(this, d, force); const f = FA.cur; if (!f || f.dev !== d.id) return a; const same = p => (p[0] === f.pair[0] && p[1] === f.pair[1]) || (p[0] === f.pair[1] && p[1] === f.pair[0]);
        if (f.kind === 'weld' && !a.some(same)) a = a.concat([f.pair.slice()]);
        else if (f.kind === 'open') a = a.filter(p => !same(p));
        else if (f.kind === 'fuse') a = force ? a : a.filter(p => !(p[0] === '1' && p[1] === '2'));
        return a; };
      if (LD) T.loads = function(d){ const f = FA.cur; if (f && f.kind === 'coil' && f.dev === d.id) return []; return LD.call(this, d); }; });
  },
  inject(c, kind){
    const api = c.api, host = c.host, ex = c.ex; if (!api) return;
    FA.hook(); FA.clear();
    const f = FA.pick(ex, api, kind); if (!f){ FA.note(host, 'This exercise is too small for hidden faults. Try an exercise with a contactor.', 'bad'); return; }
    Object.assign(f, {ex, key:c.key, api, host, meas:0, wrong:0, t0:now(), found:false});
    if (f.kind === 'ol'){ const o = api.byId[f.dev]; o.cfg.Ir = Math.max(1, Math.round((api.devs.find(d => TYPES[d.type].motor).cfg.In || 5) * 0.4 * 2) / 2); }
    FA.cur = f;
    try { api.power(false); } catch (_) {}
    const re = host.querySelector('.bn-res'); if (re) re.innerHTML = '';
    FA.panel(f);
    SND.unclick();
  },
  clear(){ const f = FA.cur; if (!f) return; if (f.kind === 'ol' && f.origIr != null){ const o = f.api.byId[f.dev]; if (o) o.cfg.Ir = f.origIr; } FA.cur = null; FA.meterOff(f); FA.pickOff(f); },
  note(host, t, cls){ const p = host.querySelector('[data-fx=fnote]'); if (p){ p.textContent = t; p.className = 'fx-fnote' + (cls ? ' ' + cls : ''); } },
  symptom(f){ const K = KINDS[f.kind]; const d = f.dev && f.api.byId[f.dev]; let s = K.sym; if (f.kind === 'ol') s = `The motor starts, then after a while ${d.tag} trips (run time at ×10 so you don't wait).`; return s; },
  panel(f){
    const host = f.host, slot = host.querySelector('[data-fx=fault-panel]'); if (!slot) return;
    slot.innerHTML = `<div class="fx-fault" data-fx="fault-ui"><h4>🔍 Find the fault</h4><p class="fx-sym">I've put <b>one hidden fault</b> on the board. Switch on, try the circuit, and look at the symptom: <i data-fx="sym">—</i></p><p class="fx-sym muted">Take the multimeter and measure between terminals until you find the faulty part, then press “Found the fault”.</p><div class="fx-fbtns"><button type="button" class="btn" data-fx="meter" aria-pressed="false">📟 Multimeter</button><button type="button" class="btn pri" data-fx="found">🎯 Found the fault</button><button type="button" class="btn" data-fx="giveup">I give up, show me</button></div><div data-fx="meter-ui"></div><div data-fx="pick-ui"></div><p class="fx-fnote" data-fx="fnote"></p><div data-fx="explain"></div></div>`;
    slot.querySelector('[data-fx=sym]').textContent = FA.symptom(f);
    slot.querySelector('[data-fx=meter]').addEventListener('click', ev => { FA.pickOff(f); if (f.meter) FA.meterOff(f); else FA.meterOn(f); ev.currentTarget.setAttribute('aria-pressed', f.meter ? 'true' : 'false'); });
    slot.querySelector('[data-fx=found]').addEventListener('click', () => { FA.meterOff(f); FA.pickOn(f); });
    slot.querySelector('[data-fx=giveup]').addEventListener('click', () => FA.resolve(f, true));
  },
  // ---- multimeter
  meterOn(f){ f.meter = true; f.mode = f.mode || 'V'; f.probes = []; const host = f.host, ui = host.querySelector('[data-fx=meter-ui]'); host.querySelector('.bn').classList.add('fx-metering');
    ui.innerHTML = `<div class="fx-meter" role="group" aria-label="Multimeter"><div class="lcd" data-fx="lcd">----<small>V</small></div><div class="modes"><button type="button" data-mode="V" aria-pressed="true">V volts</button><button type="button" data-mode="R" aria-pressed="false">Ω ohms / beep</button></div><div class="probes"><b>Red</b> probe: <span class="mono" data-fx="pa">—</span> · <b class="blk">Black</b>: <span class="mono" data-fx="pb">—</span> <span class="muted">(tap two terminals on the board)</span></div></div>`;
    ui.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { f.mode = b.dataset.mode; ui.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); f.probes = []; FA.lcd(f, '----', f.mode === 'V' ? 'V' : 'Ω'); FA.probesTxt(f); }));
    f.onTerm = ev => { const t = ev.target.closest && ev.target.closest('[data-t]'); if (!t) return; ev.stopPropagation(); ev.preventDefault(); FA.probe(f, t.dataset.t); };
    host.querySelector('.bn-board').addEventListener('click', f.onTerm, true);
    FA.note(host, 'Multimeter on: tap one terminal, then another.');
  },
  meterOff(f){ if (!f.meter) return; f.meter = false; const host = f.host; host.querySelector('.bn').classList.remove('fx-metering'); if (f.onTerm) host.querySelector('.bn-board').removeEventListener('click', f.onTerm, true); const ui = host.querySelector('[data-fx=meter-ui]'); if (ui) ui.innerHTML = ''; const b = host.querySelector('[data-fx=meter]'); if (b) b.setAttribute('aria-pressed', 'false'); },
  lcd(f, v, u){ const l = f.host.querySelector('[data-fx=lcd]'); if (l) l.innerHTML = `${esc(v)}<small>${esc(u || '')}</small>`; },
  probesTxt(f){ const a = f.host.querySelector('[data-fx=pa]'), b = f.host.querySelector('[data-fx=pb]'); if (a) a.textContent = f.probes[0] || '—'; if (b) b.textContent = f.probes[1] || '—'; },
  probe(f, t){ if (f.probes.length >= 2) f.probes = []; f.probes.push(t); FA.probesTxt(f); if (f.probes.length < 2){ FA.lcd(f, '----', f.mode === 'V' ? 'V' : 'Ω'); return; } const r = FA.measure(f, f.probes[0], f.probes[1]); f.meas++; f.last = r;
    if (r.err){ FA.lcd(f, 'Err', ''); FA.note(f.host, r.err, 'bad'); SND.error(); return; }
    FA.lcd(f, r.txt, r.unit); FA.note(f.host, r.note || `Reading no. ${f.meas}: ${f.probes[0]} ↔ ${f.probes[1]} = ${r.txt} ${r.unit}`); if (r.beep) SND.beep(); else SND.click(); },
  measure(f, A, B){
    const api = f.api, live = api.devs.some(d => TYPES[d.type].isSupply && d.st.on && !d.st.trip), dc = api.devs.some(d => d.type === 'supplyDC');
    if (A === B) return {txt:'0.0', unit:f.mode === 'V' ? 'V' : 'Ω', beep:f.mode !== 'V'};
    const wires = api.wires().map((w, i) => ({id:i + 1, a:w[0], b:w[1]}));
    if (f.mode === 'V'){
      if (!live) return {txt:'0.0', unit:'V', note:'Power is off: there\'s no voltage to measure. Switch on to measure volts, or switch to ohms.'};
      const cl = api.devs.map(d => Object.assign({}, d, {st:Object.assign({}, d.st), cfg:d.cfg}));
      const res = CL.solve(cl, wires, {}); const pa = res.poles(res.find(A)), pb = res.poles(res.find(B));
      let v = 0; if (pa && pb) pa.forEach(p => pb.forEach(q => { v = Math.max(v, CL.voltBetween(p, q)); }));
      return {txt:v ? v.toFixed(0) : '0.0', unit:dc && v <= 24 ? 'V⎓' : 'V~', beep:false};
    }
    if (live) return {err:'⚠ Switch the power off first! Measuring ohms on a live circuit burns out the meter.'};
    // resistance: wires + closed links (fault hooks apply) → same node = continuity; a single load between = its resistance
    const par = new Map(); const find = x => { while (par.has(x) && par.get(x) !== x) x = par.get(x); return x; }; const uni = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) par.set(ra, rb); };
    api.devs.forEach(d => TYPES[d.type].terms(d).forEach(t => par.set(d.id + ':' + t.n, d.id + ':' + t.n)));
    FA.wiresOf(wires).forEach(w => { if (par.has(w.a) && par.has(w.b)) uni(w.a, w.b); });
    api.devs.forEach(d => (TYPES[d.type].links(d, false) || []).forEach(([x, y]) => { const a = d.id + ':' + x, b = d.id + ':' + y; if (par.has(a) && par.has(b)) uni(a, b); }));
    const ra = find(A), rb = find(B); if (ra === rb) return {txt:'0.2', unit:'Ω', beep:true, note:`Beep: ${A} and ${B} are connected (resistance ≈ 0).`};
    let R = null; api.devs.forEach(d => { const T = TYPES[d.type]; if (!T.loads) return; T.loads(d).forEach(L => { const x = find(d.id + ':' + L.a), y = find(d.id + ':' + L.b); if ((x === ra && y === rb) || (x === rb && y === ra)){ const r = L.k === 'coil' ? COIL_R(d) : L.k === 'lamp' ? LAMP_R(d) : 5000; R = R == null ? r : (R * r) / (R + r); } }); });
    if (R != null) return {txt:R >= 1000 ? (R / 1000).toFixed(2) : String(Math.round(R)), unit:R >= 1000 ? 'kΩ' : 'Ω', beep:false, note:`Resistance ${R >= 1000 ? (R / 1000).toFixed(2) + ' kΩ' : Math.round(R) + ' Ω'}: that's a load (coil or lamp) between the terminals.`};
    return {txt:'OL', unit:'Ω', beep:false, note:'OL: no connection between the terminals (open circuit).'};
  },
  // ---- pick the faulty element
  pickOn(f){ if (f.pick) return; f.pick = true; const host = f.host; host.querySelector('.bn').classList.add('fx-picking');
    const ui = host.querySelector('[data-fx=pick-ui]'); ui.innerHTML = `<div class="fx-pick"><b>Tap the part, wire or screw that has the fault</b><button type="button" class="btn" data-fx="pickcancel">Back</button></div>`;
    ui.querySelector('[data-fx=pickcancel]').addEventListener('click', () => FA.pickOff(f));
    f.onPick = ev => { const w = ev.target.closest && ev.target.closest('[data-w]'); const t = ev.target.closest && ev.target.closest('[data-t]'); const c = ev.target.closest && ev.target.closest('[data-cell],[data-dev]'); if (!w && !t && !c) return; ev.stopPropagation(); ev.preventDefault();
      if (w){ const lab = w.getAttribute('aria-label') || ''; FA.chooser(f, {kind:'wire', id:+w.dataset.w, lab:lab.replace(/: tap.*$/, '')}); }
      else if (t) FA.chooser(f, {kind:'term', id:t.dataset.t, lab:'screw ' + t.dataset.t});
      else { const id = c.dataset.cell || c.dataset.dev; FA.chooser(f, {kind:'dev', id, lab:(f.api.byId[id] || {}).tag || id}); } };
    host.querySelector('.bn-board').addEventListener('click', f.onPick, true);
    host.querySelector('.bn-board').addEventListener('pointerdown', FA.swallow, true);
  },
  swallow(ev){ if (ev.target.closest && ev.target.closest('[data-act]')){ ev.stopPropagation(); ev.preventDefault(); } },
  pickOff(f){ if (!f.pick) return; f.pick = false; const host = f.host; host.querySelector('.bn').classList.remove('fx-picking'); const b = host.querySelector('.bn-board'); if (f.onPick) b.removeEventListener('click', f.onPick, true); b.removeEventListener('pointerdown', FA.swallow, true); const ui = host.querySelector('[data-fx=pick-ui]'); if (ui) ui.innerHTML = ''; },
  chooser(f, sel){ const ui = f.host.querySelector('[data-fx=pick-ui]'); ui.innerHTML = `<div class="fx-pick"><b>${esc(sel.lab)}</b>: <button type="button" class="btn pri" data-fx="act" data-a="replace">🔁 Replace</button><button type="button" class="btn pri" data-fx="act" data-a="fix">🔧 Repair</button><button type="button" class="btn" data-fx="act" data-a="no">No, back</button></div>`;
    ui.querySelectorAll('[data-fx=act]').forEach(b => b.addEventListener('click', () => { if (b.dataset.a === 'no'){ ui.innerHTML = `<div class="fx-pick"><b>Tap the part, wire or screw that has the fault</b><button type="button" class="btn" data-fx="pickcancel">Back</button></div>`; ui.querySelector('[data-fx=pickcancel]').addEventListener('click', () => FA.pickOff(f)); return; } FA.guess(f, sel, b.dataset.a); })); },
  isTarget(f, sel){ if (f.kind === 'wire'){ if (sel.kind !== 'wire') return false; const ws = f.api.wires(); const w = ws[sel.id - 1]; const same = (a, p) => a && ((a[0] === p[0] && a[1] === p[1]) || (a[0] === p[1] && a[1] === p[0])); if (same(w, f.wire)) return true; return /\b/.test(sel.lab) && f.wire.every(t => sel.lab.indexOf(t) > -1); }
    if (f.kind === 'loose') return sel.kind === 'term' && sel.id === f.term;
    return sel.kind === 'dev' && sel.id === f.dev; },
  guess(f, sel, action){
    const K = KINDS[f.kind], hit = FA.isTarget(f, sel);
    if (hit && action === K.fix){ FA.resolve(f, false); return; }
    f.wrong++; SND.error();
    const ui = f.host.querySelector('[data-fx=pick-ui]'); if (ui) ui.innerHTML = '';
    f.pick = false; FA.pickOn(f);
    if (hit) FA.note(f.host, `Right part, wrong action: this needs “${K.fix === 'fix' ? 'Repair' : 'Replace'}”. Try again.`, 'bad');
    else FA.note(f.host, `Not here. (${f.wrong} wrong)` + (f.wrong >= 3 ? ' ' + FA.hint(f) : ' Measure more with the multimeter before you guess.'), 'bad');
  },
  hint(f){ const d = f.dev && f.api.byId[f.dev]; if (f.kind === 'wire') return `💡 Hint: the fault is in a wire between ${f.wire[0]} and ${f.wire[1]}... look at the wire between those two.`; if (f.kind === 'loose') return `💡 Hint: the fault is at a screw on ${f.term.split(':')[0]}.`; return `💡 Hint: the fault is in ${d ? d.tag : '?'}${f.pair ? ' (contact ' + f.pair.join('-') + ')' : ''}.`; },
  resolve(f, gaveUp){
    FA.meterOff(f); FA.pickOff(f);
    const K = KINDS[f.kind], d = f.dev && f.api.byId[f.dev], where = f.kind === 'wire' ? `wire ${f.wire[0]} ↔ ${f.wire[1]}` : f.kind === 'loose' ? `screw ${f.term}` : `${d.tag}${f.pair ? ' (' + f.pair.join('-') + ')' : ''}`;
    const t = Math.round((now() - f.t0) / 1000), pts = gaveUp ? 0 : Math.max(10, 60 - 10 * f.wrong - 3 * Math.max(0, f.meas - 4)) + (f.meas ? 10 : 0);
    FA.cur = null; if (f.kind === 'ol' && f.origIr != null && d) d.cfg.Ir = f.origIr;
    if (!gaveUp){ st.set('faultsFixed', (st.get('faultsFixed') || 0) + 1); SC.record(SC.me(), 'fault/' + f.key + '/' + Date.now(), {pts, t, kind:f.kind}); SND.chime(); }
    const got = SC.award();
    const ex = f.host.querySelector('[data-fx=explain]'); if (ex) ex.innerHTML = `<div class="fx-explain"><p>${gaveUp ? '😅 The fault was:' : '✅ Correct! The fault:'} <b>${esc(K.t)}</b> at <b>${esc(where)}</b>.${gaveUp ? '' : ` <b>+${pts} pts</b> (${f.meas} readings · ${f.wrong} wrong · ${mmss(t)})`}</p><p><b>How an electrician finds it:</b> ${K.how}</p><p class="muted">${gaveUp ? 'I fixed it for you.' : 'Fixed.'} Switch on and check that the board works again. ${got.length ? got.map(id => { const b = bOf(id); return `<span class="fx-badge-new">${b.ico} ${esc(b.t)}</span>`; }).join('') + ' new badge!' : ''}</p><p><button type="button" class="btn" data-fx="again">🔍 Another fault</button></p></div>`;
    const ag = ex && ex.querySelector('[data-fx=again]'); if (ag) ag.addEventListener('click', () => { const c = SC.cur; if (c) FA.inject(c); });
    FA.note(f.host, '');
    try { f.api.power(false); } catch (_) {}
  }
};
on('precheck', pc => { if (FA.cur && FA.cur.key === pc.key) pc.skip = true; });

/* =========================== 6. challenge a friend (hot-seat) =========================== */
const CH = FX.challenge = {
  active:null, // {key, ex, names:[a,b], cur:0, res:[{t,mistakes}], c}
  modal(html){ CH.close(); const m = document.createElement('div'); m.className = 'fx-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.innerHTML = `<div class="box">${html}</div>`; document.body.appendChild(m); CH.m = m; return m; },
  close(){ if (CH.m){ CH.m.remove(); CH.m = null; } },
  open(c){ const m = CH.modal(`<h3>⚔️ Challenge a friend</h3><p class="muted">Same exercise, each of you in turn on an empty board. The clock starts with the first wire, and mistakes count (each time you switch on with a wrong circuit = one mistake). Fastest with the fewest mistakes wins.</p><label>Player 1 <input name="a" maxlength="24" value="${esc(SC.me() || 'Me')}"></label><label>Player 2 <input name="b" maxlength="24" placeholder="Your friend's name"></label><div class="row"><button type="button" class="btn" data-fx="cancel">Cancel</button><button type="button" class="btn pri" data-fx="go">Start the challenge</button></div>`);
    m.querySelector('[data-fx=cancel]').addEventListener('click', CH.close);
    m.querySelector('[data-fx=go]').addEventListener('click', () => { const a = m.querySelector('[name=a]').value.trim() || 'Player 1', b = m.querySelector('[name=b]').value.trim() || 'Player 2'; CH.close(); CH.start(c, [a, b]); });
  },
  start(c, names){ CH.active = {key:c.key, ex:c.ex, names, cur:0, res:[], c, host:c.host, api:c.api}; CH.turn(); },
  turn(){ const A = CH.active, c = A.c; FA.clear(); try { c.api.power(false); } catch (_) {} const clr = c.host.querySelector('[data-b=clear]'); if (clr) clr.click();
    c.t0 = null; c.hints = 0; c.wrong = 0; c.passed = false; if (c.timerId) clearInterval(c.timerId); c.timerId = null; SC.tick();
    const el = c.slot.querySelector('[data-fx=pass]'); el.innerHTML = `<div class="fx-turn" data-fx="turn"><span>⚔️</span><b>Turn: ${esc(A.names[A.cur])}</b><span class="muted">Wire the circuit from scratch. The clock starts with the first wire.</span><span class="fx-tm" data-fx="tm">0:00</span></div>`;
    const tm = el.querySelector('[data-fx=tm]'); A.tmId = setInterval(() => { tm.textContent = mmss(SC.elapsed()); }, 500);
  },
  pass(c){ const A = CH.active; if (!A || c.passed) return; c.passed = true; if (c.timerId) clearInterval(c.timerId); if (A.tmId) clearInterval(A.tmId);
    const t = c.t0 ? (now() - c.t0) / 1000 : 0; A.res[A.cur] = {t:Math.round(t), mistakes:c.wrong + c.hints};
    const P = SC.points(c.ex, t, c.hints, c.wrong); SC.record(A.names[A.cur], c.key, {pts:P.pts, t:Math.round(t), hints:c.hints, wrong:c.wrong, fast:t <= c.target, clean:!c.hints && !c.wrong});
    if (A.cur === 0){ A.cur = 1; const m = CH.modal(`<h3>✓ ${esc(A.names[0])} finished in ${mmss(t)} with ${A.res[0].mistakes} mistakes</h3><p>Now it's <b>${esc(A.names[1])}</b>'s turn. The board will be cleared and start over. Ready?</p><div class="row"><button type="button" class="btn pri" data-fx="go">Start</button></div>`); m.querySelector('[data-fx=go]').addEventListener('click', () => { CH.close(); CH.turn(); }); return; }
    CH.finish();
  },
  score(r){ return r.t + r.mistakes * 10; },
  finish(){ const A = CH.active; CH.active = null; const [a, b] = A.res, sa = CH.score(a), sb = CH.score(b), win = sa === sb ? -1 : sa < sb ? 0 : 1;
    if (win === 0 && A.names[0] === (SC.me() || 'Me')){ st.set('champ', 1); }
    const got = SC.award();
    const link = location.href.split('#')[0] + '#' + (location.hash || '').slice(1);
    const share = win < 0 ? `It's a tie between me and${A.names[1]} on the circuit “${A.ex.short || A.ex.title}”: ${mmss(a.t)} vs ${mmss(b.t)}. Your turn: ${link}` : `${A.names[win]} won the challenge: wired the circuit “${A.ex.short || A.ex.title}” in ${mmss(A.res[win].t)} with ${A.res[win].mistakes} mistakes (vs ${mmss(A.res[1 - win].t)} with ${A.res[1 - win].mistakes}). Your turn: ${link}`;
    const pl = i => `<div class="pl${win === i ? ' win' : ''}"><span>${win === i ? '🏆' : win < 0 ? '🤝' : '🥈'}</span><span class="n">${esc(A.names[i])}<br><small class="muted">${A.res[i].mistakes} mistakes</small></span><span class="t">${mmss(A.res[i].t)}</span></div>`;
    const m = CH.modal(`<h3>${win < 0 ? '🤝 It\'s a tie!' : '🏆 ' + esc(A.names[win]) + ' wins!'}</h3><div class="res">${pl(0)}${pl(1)}</div><p class="muted">Score: time + 10 seconds per mistake.${got.length ? ' New badge: ' + got.map(id => bOf(id).t).join(', ') : ''}</p><textarea readonly data-fx="share">${esc(share)}</textarea><div class="row"><button type="button" class="btn" data-fx="cancel">Close</button><button type="button" class="btn pri" data-fx="share-btn">${navigator.share ? '📤 Share' : '📋 Copy the text'}</button></div>`);
    m.querySelector('[data-fx=cancel]').addEventListener('click', () => { CH.close(); const el = A.c.slot && A.c.slot.querySelector('[data-fx=pass]'); if (el) el.innerHTML = ''; });
    m.querySelector('[data-fx=share-btn]').addEventListener('click', async () => { const b = m.querySelector('[data-fx=share-btn]'); try { if (navigator.share) await navigator.share({text:share}); else if (navigator.clipboard) await navigator.clipboard.writeText(share); else { m.querySelector('[data-fx=share]').select(); document.execCommand('copy'); } b.textContent = '✓ Done'; } catch (_) { b.textContent = 'Copy the text above'; } });
    FX.lastShare = share; SND.chime();
  }
};

/* =========================== 7. wiring everything to the bus =========================== */
let MACH = null, CUR = null, humOn = false;
on('exercise', e => { CUR = e; FA.clear(); if (MACH) MACH.destroy(); MACH = FX.flags.machines ? mountMachine(e) : null; SC.start(e); SC.cur.api = e.api; SC.cur.host = e.host; SC.cur.passedBefore = !!e.passed; if (e.passed){ const fb = e.host.querySelector('[data-fx=fault]'); if (fb) fb.hidden = false; } });
on('destroy', () => { if (MACH) MACH.destroy(); MACH = null; FA.clear(); SC.stop(); SND.hum(0); if (CH.active && CH.active.tmId) clearInterval(CH.active.tmId); CH.active = null; CUR = null; });
on('wire', e => { SND.click(); if (!e.undo) SC.firstWire(); });
on('unwire', () => SND.unclick());
on('power', e => { if (e.on) SND.powerOn(); else { SND.powerOff(); SND.hum(0); } });
on('coil', e => { const ty = e.dev.type; if (ty === 'contactor') SND.clack(e.on); else if (ty === 'relay') SND.relay(e.on); else if (ty === 'timer' && e.on) SND.relay(true); });
on('trip', e => { const ty = e.dev.type; if ((ty === 'ol' || ty === 'mpcb') && e.why !== 'short' && e.why !== 'mag') SND.buzz(); else if (e.why !== 'short') SND.thunk(); });
on('short', () => { SND.crackle(); setTimeout(SND.thunk, 120); });
on('burnt', () => SND.buzz());
on('render', e => {
  const live = e.live, res = e.res;
  const running = live && res ? e.devs.filter(d => TYPES[d.type].motor && res.mot[d.id] && res.mot[d.id].run) : [];
  const lvl = running.length ? Math.min(1, 0.5 + 0.25 * running.length) : 0;
  if (lvl || humOn) SND.hum(lvl, running[0] && res.mot[running[0].id].mode); humOn = lvl > 0;
  if (MACH) MACH.apply(res, live);
});
on('tick', e => { const timing = e.devs.some(d => d.type === 'timer' && ((d.cfg.mode === 'off' ? (!d.st.coil && d.st.out) : d.st.coil) && (d.cfg.mode === 'cyc' || d.st.el < d.cfg.t))); if (!timing) return; const t = now(); if (t - S.lastTick >= 950){ S.lastTick = t; SND.tick(); } });
on('pass', e => { SND.chime(); SC.pass(e); });
on('fail', () => { SND.error(); if (SC.cur && !SC.cur.passed) SC.cur.wrong++; });
on('hint', () => { if (SC.cur && !SC.cur.passed) SC.cur.hints++; });

/* =========================== 8. hub: leaderboard, badges, points on cards =========================== */
FX.summary = function(){ const mine = SC.mine(); return {name:SC.me() || 'Trainee', total:SC.total(mine), exercises:Object.keys(mine).filter(k => !/^fault\//.test(k)).length, faults:st.get('faultsFixed') || 0, badges:Object.keys(SC.badges()).map(id => bOf(id)).filter(Boolean)}; };
FX.hub = function(){
  const sec = document.getElementById('fxBoard');
  if (sec){ const sm = FX.summary(), have = SC.badges(), board = SC.board();
    sec.innerHTML = `<div class="fx-hub"><h2>🏆 Leaderboard</h2><div class="fx-top"><div class="fx-total">${sm.total} pts<small>${sm.exercises} exercises${FX.flags.faults ? ` · ${sm.faults} faults fixed` : ''}</small></div><form class="fx-name" data-fx="hubname"><label>Your name: <input name="n" maxlength="24" value="${esc(SC.me())}" placeholder="Type your name"></label><button type="submit" class="btn">Save</button></form></div><ul class="fx-badges" aria-label="Badges">${BADGES.map(b => `<li class="${have[b.id] ? 'on' : ''}" title="${esc(b.d)}">${b.ico} ${esc(b.t)}</li>`).join('')}</ul>${board.length ? `<table class="fx-lb"><thead><tr><th>#</th><th>Name</th><th>Points</th><th>Exercises</th>${FX.flags.faults ? '<th>Faults</th>' : ''}</tr></thead><tbody>${board.map((r, i) => `<tr class="${r.me ? 'me' : ''}"><td>${i + 1}</td><td>${esc(r.name)}</td><td class="mono">${r.pts}</td><td class="mono">${r.n}</td>${FX.flags.faults ? `<td class="mono">${r.faults}</td>` : ''}</tr>`).join('')}</tbody></table>` : '<p class="muted">No results yet. Finish your first exercise and you\'ll see your name here.</p>'}<p class="muted" style="margin:0;font-size:.84rem">Points: a base score by circuit size + a speed bonus − “Show solution” − mistakes. The leaderboard is saved on this device only.</p></div>`;
    sec.querySelector('[data-fx=hubname]').addEventListener('submit', ev => { ev.preventDefault(); SC.setName(sec.querySelector('[name=n]').value); FX.hub(); });
  }
  const mine = SC.mine();
  document.querySelectorAll('a.les[href]').forEach(a => { const L = (CL.CURRICULUM.fundamentals || []).find(l => l.file === a.getAttribute('href')); if (!L) return; const p = SC.lesson(L.id, mine); if (!p || a.querySelector('.fx-pts')) return; const stEl = a.querySelector('.t') || a; const s = document.createElement('span'); s.className = 'fx-pts'; s.textContent = '⭐ ' + p; stEl.appendChild(s); });
};
function certPts(){ const c = document.getElementById('certCard'); if (!c || c.querySelector('.fx-cert')) return; const sm = FX.summary(); if (!sm.total) return; const d = document.createElement('div'); d.className = 'd fx-cert'; d.innerHTML = `With a total of <b>${sm.total}</b> points${sm.badges.length ? ' and badges: ' + sm.badges.map(b => b.ico + ' ' + esc(b.t)).join(', ') : ''}`; const sig = c.querySelector('.sig'); c.insertBefore(d, sig || null); }
function hubInit(){ const cb = document.getElementById('certBody'); if (cb && typeof MutationObserver !== 'undefined'){ new MutationObserver(certPts).observe(cb, {childList:true}); certPts(); } if (document.getElementById('fxBoard') || document.querySelector('a.les')) FX.hub(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hubInit); else setTimeout(hubInit, 0);
// lesson start screen: points per element card
function cardPts(){ const Ld = CL.test && CL.test.lesson; if (!Ld) return; const mine = SC.mine(); document.querySelectorAll('.g-card').forEach(b => { const el = Ld.elements[+b.dataset.el]; if (!el || b.querySelector('.fx-pts')) return; const keys = []; el.steps.forEach(s => { if (s.kind === 'bench') s.ex.forEach(x => keys.push(Ld.id + '/' + x)); }); const p = keys.reduce((a, k) => a + ((mine[k] && mine[k].pts) || 0), 0); if (!p) return; const t = b.querySelector('.t'); if (t){ const s = document.createElement('span'); s.className = 'fx-pts'; s.textContent = '⭐ ' + p; t.appendChild(s); } }); }
if (typeof MutationObserver !== 'undefined') document.addEventListener('DOMContentLoaded', () => { const g = document.getElementById('gCards'); if (g) new MutationObserver(cardPts).observe(g, {childList:true}); cardPts(); });

FX._S = S; FX._st = st; FX.KINDS = KINDS;
})();
