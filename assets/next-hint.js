/* «💡 الخطوة الجاية» — one short line next to a wiring bench or ladder editor that names the next thing to do.
   Shared by every course (Arabic + English pages, picked from <html lang>). Never draws wires and never stores
   anything except the per-course show/hide choice ('nh/<course>' in localStorage, every access in try/catch).
   NH.mount(refEl, {course, pos:'before'|'after', onTap(state)}) → {set(state|null), el}
   NH.net({sol, wires, groups, canon, lab, idea, btn}) → state {kind:'next'|'fix'|'done', html, hl:[terms], w:index}
   state.kind: next = what to wire/place now, fix = the latest wrong wire/element (fix it before going on), done. */
(function(){
'use strict';
if (window.NH) return;
const EN = /^en/i.test(document.documentElement.lang || '');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const b = s => `<b><bdi>${esc(s)}</bdi></b>`;
const S = EN ? {
  lead:'Next step:', hide:'Hide hint', show:'💡 Show hint', tap:'Tap to flash the spot on the board',
  con:(a, c) => `Connect ${b(a)} to ${b(c)}`,
  fix:(a, c) => `Fix first: wire ${b(a)} – ${b(c)} is wrong, remove it`,
  fixEl:(el, r) => `Fix first: ${b(el)} in rung ${r} doesn't belong, remove it`,
  jumper:(a, c) => `Remove the jumper ${b(a)} – ${b(c)}`,
  done:btn => `Wiring done, press «${esc(btn)}»`,
  doneProg:btn => `Program done, press «${esc(btn)}»`,
  put:(el, r) => `put ${b(el)} in rung ${r}`,
  putAfter:(el, x, r) => `put ${b(el)} after ${b(x)}, rung ${r}`,
  putUnder:(el, x, r) => `put ${b(el)} under ${b(x)} (parallel), rung ${r}`,
  putEnd:(el, r) => `put ${b(el)} at the end of rung ${r}`,
  newRung:r => `add rung ${r}`,
  wire:c => `${c} wire`,
  wireCell:'a wire (—)',
  close:(x, r) => `close the parallel branch after ${b(x)}, rung ${r}`,
  idea:{power:'Power circuit', feed:'Supply', prot:'Protection', stop:'STOP', start:'START', coil:'Coil', latch:'Latch (seal-in)', interlock:'Interlock',
        timer:'Timer', ol:'Overload', lamp:'Lamp', pe:'Earth', motor:'Motor', input:'Input', output:'Output', com:'COM', sensor:'Sensor', supply:'Supply',
        jog:'Jog', limit:'Limit switch', counter:'Counter', reset:'Reset', set:'Set', compare:'Compare', edge:'Edge', scale:'Scale', brake:'Brake', analog:'Analog', relay:'Relay', encoder:'Encoder', safety:'STO', brres:'Braking resistor', pot:'Potentiometer', run:'Run', dir:'Direction', fault:'Fault lamp', switch:'Switch', plc:'PLC'}
} : {
  lead:'الخطوة الجاية:', hide:'اخفي التلميح', show:'💡 وريني التلميح', tap:'دوس عشان المكان ينوّر على اللوحة',
  con:(a, c) => `وصّل ${b(a)} بـ ${b(c)}`,
  fix:(a, c) => `صلّح الأول: السلك ${b(a)} – ${b(c)} غلط، شيله`,
  fixEl:(el, r) => `صلّح الأول: ${b(el)} في رانج ${r} مش مكانه، شيله`,
  jumper:(a, c) => `شيل الجمبر ${b(a)} – ${b(c)}`,
  done:btn => `كده خلصت التوصيل، دوس «${esc(btn)}»`,
  doneProg:btn => `كده خلصت البرنامج، دوس «${esc(btn)}»`,
  put:(el, r) => `حط ${b(el)} في رانج ${r}`,
  putAfter:(el, x, r) => `حط ${b(el)} بعد ${b(x)} في رانج ${r}`,
  putUnder:(el, x, r) => `حط ${b(el)} تحت ${b(x)} (بالتوازي) في رانج ${r}`,
  putEnd:(el, r) => `حط ${b(el)} في آخر رانج ${r}`,
  newRung:r => `اعمل رانج ${r} جديد`,
  wire:c => `سلك ${c}`,
  wireCell:'سلك (—)',
  close:(x, r) => `اقفل الفرع اللي تحت ${b(x)} في رانج ${r}`,
  idea:{power:'دايرة القوى', feed:'التغذية', prot:'الحماية', stop:'STOP', start:'START', coil:'الكويل', latch:'اللاتش (التثبيت الذاتي)', interlock:'الإنترلوك',
        timer:'التايمر', ol:'الأوفرلود', lamp:'اللمبة', pe:'الأرضي', motor:'الموتور', input:'الدخل', output:'الخرج', com:'الـ COM', sensor:'الحساس', supply:'الباور',
        jog:'الـ Jog', limit:'الليميت', counter:'العدّاد', reset:'الـ Reset', set:'الـ Set', compare:'المقارنة', edge:'الـ Edge', scale:'الـ Scale', brake:'الفرامل', analog:'الأنالوج', relay:'الريلاي', encoder:'الإنكودر', safety:'الـ STO', brres:'مقاومة الفرملة', pot:'البوتنشيوميتر', run:'التشغيل', dir:'الاتجاه', fault:'لمبة العطل', switch:'المفتاح', plc:'الـ PLC'}
};
const NH = window.NH = {EN, S, esc, b};
const lsGet = k => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (_) {} };

let css = false;
function addCss(){
  if (css) return; css = true;
  const st = document.createElement('style');
  st.textContent = `.nh{display:flex;align-items:flex-start;gap:6px;margin:8px 0;font-size:.92rem;line-height:1.45}
.nh[hidden]{display:none}
.nh-t{flex:1 1 auto;min-width:0;text-align:start;font:inherit;color:var(--ink);background:var(--accent-soft,rgba(31,111,209,.1));border:1px solid var(--line);border-inline-start:4px solid var(--accent);border-radius:8px;padding:7px 10px;cursor:pointer;overflow-wrap:anywhere}
.nh-t b{font-weight:700}
.nh-t .nh-l{font-weight:700;color:var(--accent);margin-inline-end:4px}
.nh.fix .nh-t{background:var(--bad-soft,rgba(192,53,43,.1));border-inline-start-color:var(--bad)}
.nh.fix .nh-t .nh-l{color:var(--bad)}
.nh.done .nh-t{background:var(--good-soft,rgba(43,122,61,.1));border-inline-start-color:var(--good)}
.nh.done .nh-t .nh-l{color:var(--good)}
.nh-g{flex:0 0 auto;font:inherit;font-size:.8rem;color:var(--muted);background:none;border:1px solid var(--line);border-radius:8px;padding:6px 8px;cursor:pointer;white-space:nowrap}
.nh.off .nh-t{display:none}
.nh.off{justify-content:flex-start}
.nh-t:focus-visible,.nh-g:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@keyframes nhP{50%{opacity:.35}}
rect.nh-pulse{stroke:var(--warn)!important;stroke-width:3.5px!important;fill:color-mix(in srgb,var(--warn) 22%,transparent)!important;animation:nhP .6s 5}
:not(rect).nh-pulse{outline:3px solid var(--warn);outline-offset:2px;animation:nhP .6s 5}
@media (prefers-reduced-motion:reduce){.nh-pulse{animation:none!important}}`;
  document.head.appendChild(st);
}

NH.mount = function(ref, opt){
  opt = opt || {};
  addCss();
  const key = 'nh/' + (opt.course || 'x');
  const el = document.createElement('div');
  el.className = 'nh'; el.hidden = true;
  el.innerHTML = `<button type="button" class="nh-t" aria-live="polite" title="${esc(S.tap)}"><span class="nh-l">💡 ${esc(S.lead)}</span><span class="nh-x"></span></button><button type="button" class="nh-g"></button>`;
  if (opt.pos === 'after') ref.after(el); else if (opt.pos === 'append') ref.appendChild(el); else ref.before(el);
  const tx = el.querySelector('.nh-x'), tg = el.querySelector('.nh-g');
  let cur = null;
  const off = () => lsGet(key) === '0';
  function paint(){
    const o = off();
    el.classList.toggle('off', o);
    tg.textContent = o ? S.show : S.hide;
    tg.setAttribute('aria-pressed', o ? 'false' : 'true');
    el.classList.toggle('fix', !!cur && cur.kind === 'fix');
    el.classList.toggle('done', !!cur && cur.kind === 'done');
    el.hidden = !cur;
    if (cur && !o) tx.innerHTML = cur.html;
  }
  tg.addEventListener('click', () => { lsSet(key, off() ? null : '0'); paint(); });
  el.querySelector('.nh-t').addEventListener('click', () => { const f = ctl.onTap || opt.onTap; if (cur && f) f(cur); });
  const ctl = el._nh = {el, onTap:null, set(s){ cur = s || null; paint(); }, get state(){ return cur; }, get hidden(){ return off(); }};
  return ctl;
};

/* flash one element for 3 s (a ladder cell, a button): flash(el) or flash(container, selector); re-applied when the
   container redraws during those 3 s, then removed. Nothing is changed or stored. */
NH.flash = function(box, sel, ms){
  ms = ms || 3000; addCss();
  const get = () => sel ? box.querySelector(sel) : box, on = () => { const e = get(); if (e && !e.classList.contains('nh-pulse')) e.classList.add('nh-pulse'); };
  on();
  const mo = sel && typeof MutationObserver !== 'undefined' ? new MutationObserver(on) : null; if (mo) mo.observe(box, {childList:true, subtree:true});
  setTimeout(() => { if (mo) mo.disconnect(); const e = get(); if (e) e.classList.remove('nh-pulse'); }, ms);
};

/* union-find over terminal ids */
NH.uf = function(){
  const P = new Map();
  const f = x => { if (!P.has(x)) P.set(x, x); let r = x; while (P.get(r) !== r) r = P.get(r); while (P.get(x) !== r){ const n = P.get(x); P.set(x, r); x = n; } return r; };
  return {f, u:(a, c) => { const ra = f(a), rc = f(c); if (ra !== rc) P.set(ra, rc); }, has:x => P.has(x)};
};

/* alternative wiring the checker accepts: units = [{dev, k, t:[terms], sw (ends may be swapped), solo (never moved to another unit)}].
   Every unit the trainee wired may sit on itself or on a same-kind unit of the same device that the reference uses, either way round.
   Steepest ascent from "as wired" to the mapping that makes most wires agree with the reference nets (strict gains only, so the
   wiring as placed wins ties). Returns {canon(t) → reference terminal, raw(t) → the terminal the trainee actually uses for it}. */
NH.canon = function(o){
  const W = o.wires, R = NH.uf(); (o.groups || []).forEach(g => { for (let i = 1; i < g.length; i++) R.u(g[0], g[i]); }); o.sol.forEach(p => R.u(p[0], p[1]));
  const solT = new Set(); o.sol.forEach(p => { solT.add(p[0]); solT.add(p[1]); });
  const roots = new Set([...solT].map(t => R.f(t))), usedT = new Set(); W.forEach(w => { usedT.add(w[0]); usedT.add(w[1]); });
  const opts = [], asg = new Map(), U = o.units || [];
  U.filter(u => u.t.some(t => usedT.has(t))).forEach(u => { const ref = U.filter(r => r !== u && r.dev === u.dev && r.k === u.k && r.t.some(t => solT.has(t))), op = [];
    (u.solo ? [u] : [u].concat(ref)).forEach(r => (u.sw ? [[0, 1], [1, 0]] : [u.t.map((_, i) => i)]).forEach(pm => op.push({r, pm}))); opts.push({u, o:op}); asg.set(u, op[0]); });
  const mapOf = () => { const m = {}; asg.forEach((a, u) => { if (a.r !== u || a.pm[0] !== 0) u.t.forEach((t, i) => { m[t] = a.r.t[a.pm[i]]; }); }); return m; };
  const agree = (m, w) => { const a = m[w[0]] || w[0], c = m[w[1]] || w[1]; return roots.has(R.f(a)) && R.f(a) === R.f(c); };
  const score = m => W.reduce((s, w) => s + (agree(m, w) ? 1 : -1), 0);
  const clash = (u, r) => { for (const [v, a] of asg) if (v !== u && a.r === r) return true; return false; };
  const uOf = t => opts.find(x => x.u.t.includes(t));
  let best = score(mapOf());
  for (let round = 0; round < 12 && opts.length; round++){ // one unit, or the two units at the ends of a disagreeing wire
    let mv = null, top = best;
    const tryMv = ch => { if (ch.some(([u, a]) => a.r !== u && clash(u, a.r)) || (ch.length === 2 && ch[0][1].r === ch[1][1].r)) return; const old = ch.map(([u]) => asg.get(u)); ch.forEach(([u, a]) => asg.set(u, a)); const sc = score(mapOf()); if (sc > top){ top = sc; mv = ch; } ch.forEach(([u], i) => asg.set(u, old[i])); };
    opts.forEach(({u, o:op}) => op.forEach(a => { if (a !== asg.get(u)) tryMv([[u, a]]); }));
    const m0 = mapOf();
    W.forEach(w => { if (agree(m0, w)) return; const A = uOf(w[0]), C = uOf(w[1]); if (!A || !C || A === C) return; A.o.forEach(a => C.o.forEach(c => tryMv([[A.u, a], [C.u, c]]))); });
    if (!mv) break;
    mv.forEach(([u, a]) => asg.set(u, a)); best = top;
  }
  const map = mapOf(), inv = {}; Object.keys(map).forEach(t => { inv[map[t]] = t; });
  return {canon:t => map[t] || t, raw:t => inv[t] || t, R};
};

/* the next step on a wiring bench, measured against a reference wiring (sol: ordered pairs, the electrician's order).
   wires: [[a, b], ...] in the order they were placed (the trainee's). groups: terminal sets that are joined inside a device.
   canon(t): maps an alternative terminal (e.g. 23 used instead of 13) onto the reference one. A trainee wire is wrong when it
   joins two different reference nets or lands on a terminal the reference never uses; the latest wrong wire is reported first.
   Otherwise the first reference pair still not joined is the next step. */
NH.net = function(o){
  const canon = o.canon || (t => t), lab = o.lab || (t => t), sol = o.sol || [], W = (o.wires || []).map(w => [canon(w[0]), canon(w[1])]);
  const R = NH.uf(); (o.groups || []).forEach(g => { for (let i = 1; i < g.length; i++) R.u(g[0], g[i]); }); sol.forEach(p => R.u(p[0], p[1]));
  const roots = new Set(); sol.forEach(p => { roots.add(R.f(p[0])); roots.add(R.f(p[1])); });
  const inSol = t => roots.has(R.f(t));
  for (let i = W.length - 1; i >= 0; i--){
    const [a, c] = W[i];
    if (o.skip && o.skip(i)) continue;
    if (!inSol(a) || !inSol(c) || R.f(a) !== R.f(c)) { const raw = o.wires[i]; return {kind:'fix', html:S.fix(lab(raw[0]), lab(raw[1])), hl:[raw[0], raw[1]], w:i}; }
  }
  const U = NH.uf(); (o.groups || []).forEach(g => { for (let i = 1; i < g.length; i++) U.u(g[0], g[i]); }); W.forEach(w => U.u(w[0], w[1]));
  const inv = {}, n = {}; (o.wires || []).forEach((w, i) => [0, 1].forEach(k => { inv[W[i][k]] = w[k]; n[w[k]] = (n[w[k]] || 0) + 1; }));
  const raw = t => (o.raw ? o.raw(t) : inv[t]) || t, free = t => !o.cap || (n[raw(t)] || 0) < o.cap;
  const solT = []; sol.forEach(p => p.slice(0, 2).forEach(t => { if (!solT.includes(t)) solT.push(t); }));
  // a terminal already full (o.cap wires) is swapped for another one of the same reference net that the trainee has already joined to it
  const pick = t => free(t) ? t : solT.find(x => x !== t && U.f(x) === U.f(t) && R.f(x) === R.f(t) && free(x)) || t;
  for (let i = 0; i < sol.length; i++){
    const p = sol[i];
    if (U.f(p[0]) === U.f(p[1])) continue;
    const a = raw(pick(p[0])), c = raw(pick(p[1]));
    const id = o.idea ? o.idea(p, i) : (p[2] || null), t = S.con(lab(a), lab(c));
    return {kind:'next', html:id ? `${esc(id)}: ${t}` : t, hl:[a, c], pair:p, i};
  }
  return {kind:'done', html:S.done(o.btn || ''), hl:[]};
};
})();
