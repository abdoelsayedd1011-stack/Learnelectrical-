/* مثال حيّ داخل الدرس: طوارئ وبابان على قنوات جهاز الأمان، والتيار يظهر على الرسم.
   الاستخدام: <div class="live-ex" data-dev="rt9|pnoz|vital|pluto"></div> + <script src="live.js"></script>
   كل جهاز له CFG: الحلقات (القنوات) تحت الجهاز، وسلاسل الريست/المراقبة فوقه، وأسماء الأطراف. */
(function(){
  'use strict';
  var G = '#2f9e44', OFF = '#9aa3a9', RED = '#c62828', BLUE = '#2f6fb5', TEAL = '#0b8f8a';

  /* عناصر الماكينة: es = الطوارئ، d1/d2 = البابان */
  var NAMES = { es:'الطوارئ', d1:'الباب 1', d2:'الباب 2' };

  var CFG = {
    rt9: {
      name:'RT9', sup:['+A1', '-A2'], dyn:false,
      loops:[
        { from:'S13', to:'S14', items:[['es','11-12'], ['d1','11-12'], ['d2','11-12']] },
        { from:'S13', to:'S34', items:[['es','21-22'], ['d1','21-22'], ['d2','21-22']] }
      ],
      top:[ { from:'rail', to:'X1', items:['k1','k2','reset'] } ],
      outs:['13-14', '23-24'], k:['K1', 'K2'],
      leds:[['On','pow'], ['In1','c0'], ['In2','c1'], ['1','out'], ['2','out']],
      note:'القناة 1: <span class="lx-ch">S13 → E-Stop 11-12 → Door 1 → Door 2 → S14</span> والقناة 2: <span class="lx-ch">S13 → E-Stop 21-22 → Door 1 → Door 2 → S34</span> كل باب عليه مفتاح أمان بتلامسين NC، فإذا فُتح الباب فتح القناتين معًا. والريست: <span class="lx-ch">+24V → K1 NC → K2 NC → RESET → X1</span>'
    },
    pnoz: {
      name:'PNOZ X3P', sup:['A1', 'A2'], dyn:false,
      loops:[
        { from:'S11', to:'S12', items:[['es','11-12'], ['d1','11-12'], ['d2','11-12']] },
        { from:'S21', to:'S22', items:[['es','21-22'], ['d1','21-22'], ['d2','21-22']] }
      ],
      top:[ { from:'S33', to:'S34', items:['k1','k2','reset'] } ],
      outs:['13-14', '23-24'], k:['K5', 'K6'],
      leds:[['POWER','pow'], ['CH.1','out'], ['CH.2','out']],
      note:'القناة 1: <span class="lx-ch">S11 → E-Stop 11-12 → Door 1 → Door 2 → S12</span> والقناة 2: <span class="lx-ch">S21 → E-Stop 21-22 → Door 1 → Door 2 → S22</span> والريست المراقَب: <span class="lx-ch">S33 → K5 NC → K6 NC → RESET → S34</span>'
    },
    vital: {
      name:'Vital 1', sup:['+A1', '-A2'], dyn:true,
      loops:[
        { from:'T1', to:'R1', items:[['d1','Adam 1'], ['d2','Adam 2'], ['es','Smile']] }
      ],
      top:[ { from:'B1', to:'X1', items:['k1','k2','reset'] } ],
      outs:['13-14', '23-24'], k:['K1', 'K2'],
      leds:[['On','pow'], ['In','c0'], ['1','out'], ['2','out']],
      note:'قناة واحدة ديناميكية: <span class="lx-ch">T1 → Adam 1 → Adam 2 → Smile → R1</span> على كل باب Adam في الإطار وEva في الباب. كل عنصر يقلب الإشارة، والعدد 3 فردي، لذلك S1 غير موصّل. إذا فُتح باب ابتعدت الـ Eva عن الـ Adam فتوقفت الإشارة.'
    },
    pluto: {
      name:'Pluto B20', sup:['+24V', '0V'], dyn:true,
      loops:[
        { from:'IQ10', to:'I0', sig:'A', items:[['es','11-12']] },
        { from:'IQ11', to:'I1', sig:'B', items:[['es','21-22']] },
        { from:'IQ10', to:'I2', sig:'A', items:[['d1','Adam 1'], ['d2','Adam 2']] }
      ],
      top:[ { from:'rail', to:'I4', items:['k1','k2'] }, { from:'rail', to:'I5', items:['reset'] } ],
      outs:['Q0', 'Q1'], k:['K1', 'K2'],
      leds:[['I0','c0'], ['I1','c1'], ['I2','c2'], ['Q0','out'], ['Q1','out']],
      note:'الطوارئ بقناتين: <span class="lx-ch">IQ10 (A) → NC 11-12 → I0</span> <span class="lx-ch">IQ11 (B) → NC 21-22 → I1</span> والبابان على حلقة واحدة: <span class="lx-ch">IQ10 (A) → Adam 1 → Adam 2 → I2</span> كل Adam يقلب الإشارة، فبعد اثنين ترجع A كما هي، ولذلك يُعرَّف I2 في البرنامج على أنه ينتظر A غير معكوسة.'
    }
  };

  var CSS = '.live-ex{margin:6px 0 2px}.live-ex .lx-svg{display:block;width:100%;max-width:560px;margin:0 auto;direction:ltr;color:var(--ink,#1c2329)}'
    + '.live-ex .lx-ctl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px auto 0;max-width:560px}'
    + '.live-ex .lx-b{font:inherit;font-weight:700;padding:11px 8px;border-radius:12px;border:1.5px solid var(--line,#d5dade);background:var(--panel,#fff);color:var(--ink,#1c2329);cursor:pointer;min-height:48px}'
    + '.live-ex .lx-b[aria-pressed=true]{background:#fde8e8;border-color:#c62828;color:#8e1b1b}'
    + '.live-ex .lx-b.es{border-color:#c62828}.live-ex .lx-b.rs{border-color:#2f6fb5;color:#1f4f8a}'
    + '.live-ex .lx-b.demo{grid-column:1/-1;background:var(--accent,#b85c00);border-color:transparent;color:#fff}'
    + '.live-ex .lx-st{max-width:560px;margin:10px auto 0;padding:10px 12px;border-radius:12px;background:var(--panel,#fff);border:1.5px solid var(--line,#d5dade);font-weight:600;line-height:1.7}'
    + '.live-ex .lx-st.ok{border-color:#2f9e44;background:rgba(47,158,68,.10)}.live-ex .lx-st.bad{border-color:#c62828;background:rgba(198,40,40,.08)}'
    + '.live-ex .lx-note{max-width:560px;margin:8px auto 0;font-size:.92em;color:var(--muted,#5b6773);line-height:1.8}'
    + '.live-ex .lx-ch{display:block;direction:ltr;text-align:left;font-family:var(--font-mono,monospace);font-size:.92em;background:var(--bg,#eef1f4);border-radius:8px;padding:4px 8px;margin:4px 0;color:var(--ink,#1c2329)}'
    + '.live-ex .lx-sp{grid-column:1/-1;display:flex;gap:8px;justify-content:center;align-items:center;font-size:.9em;color:var(--muted,#5b6773)}'
    + '.live-ex .lx-sp button{font:inherit;padding:4px 12px;border-radius:999px;border:1px solid var(--line,#d5dade);background:var(--panel,#fff);color:inherit;cursor:pointer}'
    + '.live-ex .lx-sp button[aria-pressed=true]{background:var(--ink,#1c2329);color:var(--panel,#fff)}'
    + '@keyframes lxdash{to{stroke-dashoffset:-20}}.live-ex .dyn{stroke-dasharray:7 3;animation:lxdash .6s linear infinite}'
    + '@keyframes lxspin{to{transform:rotate(360deg)}}.live-ex .spin{animation:lxspin .9s linear infinite;transform-box:fill-box;transform-origin:center}'
    + '@keyframes lxblink{50%{opacity:.2}}.live-ex .blink{animation:lxblink .8s steps(1) infinite}'
    + '@media (prefers-reduced-motion:reduce){.live-ex .dyn,.live-ex .spin,.live-ex .blink{animation:none}}';

  function el(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function Live(host){
    var dev = host.getAttribute('data-dev'), C = CFG[dev]; if (!C) return;
    var S = { es:false, d1:false, d2:false, reset:false, out:false, msg:'', tone:'' };
    var demo = null, speed = 1;

    /* ---------- logic ---------- */
    function closed(id){ return !S[id]; }                         // كل عنصر مغلق إلا لو اتضغط/اتفتح
    function loopOk(L){ for (var i = 0; i < L.items.length; i++) if (!closed(L.items[i][0])) return false; return true; }
    function inputsOk(){ for (var i = 0; i < C.loops.length; i++) if (!loopOk(C.loops[i])) return false; return true; }
    function fbOk(){ return !S.out; }                              // NC الكونتاكتورات مغلقة لما الكونتاكتورات واقفة
    function open(){ var a = []; ['es','d1','d2'].forEach(function(k){ if (S[k]) a.push(k); }); return a; }
    function eval_(){
      if (!inputsOk() && S.out){ S.out = false; var o = open(); S.msg = (o[0] === 'es' ? 'اتضغطت الطوارئ' : 'اتفتح ' + NAMES[o[0]]) + '، فانقطعت ' + (C.dyn ? 'الإشارة' : 'القناتان') + '، وفصل ' + C.name + ' الخرجين، فوقف ' + C.k[0] + ' و' + C.k[1] + ' ووقف المحرك.'; S.tone = 'bad'; }
    }
    function act(k){
      if (k === 'reset'){
        S.reset = true; draw();
        setTimeout(function(){
          S.reset = false;
          if (S.out){ S.msg = 'المحرك شغال بالفعل.'; S.tone = 'ok'; }
          else if (!inputsOk()){ var o = open(); S.msg = 'الريست لا يعمل: ' + o.map(function(x){ return x === 'es' ? 'الطوارئ مضغوطة' : NAMES[x] + ' مفتوح'; }).join(' و') + '. ' + (o[0] === 'es' ? 'أدر زر الطوارئ أولًا' : 'أغلق الباب أولًا') + '، ثم اضغط RESET.'; S.tone = 'bad'; }
          else { S.out = true; S.msg = 'كل ' + (C.dyn ? 'الحلقات' : 'القنوات') + ' مغلقة، و' + C.k[0] + ' و' + C.k[1] + ' واقفان (تلامسا NC مغلقان)، فلما تركت RESET أغلق ' + C.name + ' الخرجين واشتغل المحرك.'; S.tone = 'ok'; }
          draw();
        }, 350 / speed);
        return;
      }
      S[k] = !S[k];
      if (S[k]) eval_();
      else { S.msg = (k === 'es' ? 'رجّعت الطوارئ' : 'أغلقت ' + NAMES[k]) + '. المحرك لن يعمل وحده: لازم تضغط RESET.'; S.tone = ''; }
      if (S[k] && !S.msg) { S.msg = (k === 'es' ? 'الطوارئ مضغوطة' : NAMES[k] + ' مفتوح') + '، والمحرك واقف أصلًا.'; S.tone = 'bad'; }
      draw();
    }

    /* ---------- drawing ---------- */
    var W = 440, BX1 = 30, BX2 = 300, BY1 = 160, BY2 = 236, RAIL = 26;
    var maxItems = 0; C.loops.forEach(function(L){ maxItems = Math.max(maxItems, L.items.length); });
    var STEP = 66, Y0 = BY2 + 46, YB = Y0 + STEP * maxItems - 10, GND = YB + 34, H = GND + 26;

    function wire(d, on, dyn, col){ return '<path d="' + d + '" fill="none" stroke="' + (on ? (col || G) : OFF) + '" stroke-width="' + (on ? 3.6 : 2.2) + '" stroke-linejoin="round" stroke-linecap="round"' + (on && dyn ? ' class="dyn"' : '') + '/>'; }
    function term(x, y, lab, below){ return '<circle cx="' + x + '" cy="' + y + '" r="5" fill="#fff" stroke="#333" stroke-width="1.5"/><text x="' + x + '" y="' + (below ? y + 19 : y - 9) + '" text-anchor="middle" font-weight="700" font-size="11.5">' + lab + '</text>'; }
    /* تلامس رأسي بين y1 وy2 على x */
    function contV(x, y1, y2, isClosed, nc, lab, onTop, dyn, col){
      var m = (y1 + y2) / 2, s = '';
      s += wire('M' + x + ' ' + y1 + 'V' + (m - 11), onTop, dyn, col);
      s += wire('M' + x + ' ' + (m + 11) + 'V' + y2, onTop && isClosed, dyn, col);
      s += isClosed ? '<path d="M' + x + ' ' + (m - 11) + 'L' + (x + 2) + ' ' + (m + 11) + '" stroke="' + (onTop ? (col || G) : 'currentColor') + '" stroke-width="3"/>' : '<path d="M' + x + ' ' + (m + 11) + 'L' + (x - 13) + ' ' + (m - 8) + '" stroke="#c62828" stroke-width="2.6"/>';
      if (nc) s += '<path d="M' + x + ' ' + (m - 11) + 'H' + (x + 8) + '" stroke="currentColor" stroke-width="2"/>';
      if (lab) s += '<text x="' + (x + 11) + '" y="' + (m + 4) + '" font-size="10">' + lab + '</text>';
      return s;
    }
    function contH(x1, x2, y, isClosed, nc, lab, onL, col){
      var m = (x1 + x2) / 2, s = '';
      s += wire('M' + x1 + ' ' + y + 'H' + (m - 11), onL, false, col) + wire('M' + (m + 11) + ' ' + y + 'H' + x2, onL && isClosed, false, col);
      s += isClosed ? '<path d="M' + (m - 11) + ' ' + y + 'L' + (m + 11) + ' ' + (y + 2) + '" stroke="' + (onL ? G : 'currentColor') + '" stroke-width="3"/>' : '<path d="M' + (m + 11) + ' ' + y + 'L' + (m - 7) + ' ' + (y - 13) + '" stroke="currentColor" stroke-width="2.6"/>';
      if (nc) s += '<path d="M' + (m + 11) + ' ' + y + 'V' + (y - 8) + '" stroke="currentColor" stroke-width="2"/>';
      s += '<text x="' + m + '" y="' + (y + 17) + '" text-anchor="middle" font-size="10">' + lab + '</text>';
      return s;
    }
    function adam(x, y, ok, lab, onTop, col, door){   // Adam على الإطار (أصفر) وEva على الباب: تبتعد لما الباب يتفتح
      var ex = ok ? x + 17 : x + 31;
      return wire('M' + x + ' ' + (y - 33) + 'V' + (y - 16), onTop, true, col)
        + '<rect x="' + (x - 15) + '" y="' + (y - 16) + '" width="30" height="32" rx="6" fill="#ffd23a" stroke="#8a7400"/>'
        + '<circle cx="' + (x - 6) + '" cy="' + (y - 6) + '" r="4.5" fill="' + (onTop && ok ? G : ok ? '#cfd6da' : '#e03131') + '"/>'
        + '<rect x="' + ex + '" y="' + (y - 13) + '" width="11" height="26" rx="3" fill="#ffe680" stroke="#8a7400" opacity="' + (ok ? 1 : .55) + '" style="transition:x .4s"/>'
        + '<text x="' + (x + 47) + '" y="' + (y - 2) + '" font-size="10" font-weight="700" font-family="IBM Plex Sans Arabic,sans-serif" fill="' + (ok ? 'currentColor' : '#c62828') + '">' + door + '</text>'
        + '<text x="' + (x + 47) + '" y="' + (y + 11) + '" font-size="9">' + lab + '/Eva</text>';
    }
    function smile(x, y, ok, onTop, col){
      return wire('M' + x + ' ' + (y - 33) + 'V' + (y - 16), onTop, true, col)
        + '<rect x="' + (x - 18) + '" y="' + (y - 16) + '" width="36" height="32" rx="7" fill="#ffd23a" stroke="#8a7400"/>'
        + '<circle cx="' + x + '" cy="' + y + '" r="' + (ok ? 9 : 7) + '" fill="#d1261a" stroke="#7a1010"/>'
        + '<text x="' + (x + 24) + '" y="' + (y - 2) + '" font-size="10" font-weight="700" font-family="IBM Plex Sans Arabic,sans-serif" fill="' + (ok ? 'currentColor' : '#c62828') + '">الطوارئ</text><text x="' + (x + 24) + '" y="' + (y + 11) + '" font-size="9">Smile</text>';
    }
    function coil(x, y, lab, on){ return '<rect x="' + (x - 17) + '" y="' + y + '" width="34" height="26" rx="3" fill="' + (on ? 'rgba(47,158,68,.25)' : 'transparent') + '" stroke="' + (on ? G : 'currentColor') + '" stroke-width="2"/><text x="' + x + '" y="' + (y + 17) + '" text-anchor="middle" font-weight="700" font-size="11.5">' + lab + '</text>'; }

    function svg(){
      var s = '', ok = inputsOk(), dyn = C.dyn;
      /* rails */
      s += '<path d="M14 ' + RAIL + 'H' + (W - 8) + '" stroke="' + RED + '" stroke-width="3"/><text x="16" y="' + (RAIL - 8) + '" font-weight="700" font-size="12" fill="' + RED + '">+24V</text>';
      s += '<path d="M14 ' + GND + 'H' + (W - 8) + '" stroke="' + BLUE + '" stroke-width="3"/><text x="16" y="' + (GND + 18) + '" font-weight="700" font-size="12" fill="' + BLUE + '">0V</text>';
      /* device box + supply */
      s += '<rect x="' + BX1 + '" y="' + BY1 + '" width="' + (BX2 - BX1) + '" height="' + (BY2 - BY1) + '" rx="10" fill="color-mix(in srgb,var(--panel,#fff) 78%,#f3c613)" stroke="#8a7400" stroke-width="2"/>';
      s += '<text x="' + ((BX1 + BX2) / 2) + '" y="' + (BY1 + 30) + '" text-anchor="middle" font-size="17" font-weight="700">' + C.name + '</text>';
      var lx = BX1 + 18, st = { pow:true, out:S.out, c0:C.loops[0] && loopOk(C.loops[0]), c1:C.loops[1] && loopOk(C.loops[1]), c2:C.loops[2] && loopOk(C.loops[2]) };
      var gap = (BX2 - BX1 - 36) / C.leds.length;
      C.leds.forEach(function(l, i){ var x = lx + gap * (i + .5), on = st[l[1]];
        s += '<circle cx="' + x + '" cy="' + (BY1 + 48) + '" r="5.5" fill="' + (on ? (l[1] === 'out' && dev === 'pluto' ? '#e8590c' : '#37d058') : '#56606a') + '" stroke="#222"/><text x="' + x + '" y="' + (BY1 + 66) + '" text-anchor="middle" font-size="9.5">' + l[0] + '</text>'; });
      /* supply: plus from rail to top-left, minus from left edge to 0V */
      s += wire('M' + (BX1 + 14) + ' ' + RAIL + 'V' + BY1, true, false, RED) + term(BX1 + 14, BY1, C.sup[0]).replace('y="' + (BY1 - 9) + '"', 'y="' + (BY1 - 9) + '" dx="-2"');
      s += wire('M' + BX1 + ' ' + (BY2 - 12) + 'H12V' + GND, true, false, BLUE) + '<text x="' + (BX1 + 5) + '" y="' + (BY2 - 8) + '" font-size="10.5" font-weight="700">' + C.sup[1] + '</text>';

      /* top chains (reset / feedback) */
      var topX = BX1 + 60, tw = (BX2 - topX - 6) / C.top.length;
      C.top.forEach(function(T, ti){
        var x0 = topX + tw * ti, x1 = topX + tw * (ti + 1) - 14, y = 82, live = true, segs = '';
        if (T.from === 'rail'){ segs += wire('M' + x0 + ' ' + RAIL + 'V' + y, true); }
        else { segs += wire('M' + x0 + ' ' + BY1 + 'V' + y, true) + term(x0, BY1, T.from); }
        var n = T.items.length, seg = (x1 - x0) / n;
        T.items.forEach(function(it, i){ var a = x0 + seg * i, b = a + seg;
          var c = it === 'reset' ? S.reset : !S.out, lab = it === 'reset' ? 'RESET' : (it === 'k1' ? C.k[0] : C.k[1]) + ' NC';
          segs += contH(a, b, y, c, it !== 'reset', lab, live); live = live && c;
        });
        segs += wire('M' + x1 + ' ' + y + 'V' + BY1, live) + term(x1, BY1, T.to);
        s += segs;
      });

      /* output circuits on the right */
      var ox = BX2, ks = [362, 414];
      [0, 1].forEach(function(i){ var y1 = BY1 + 16 + i * 32, kx = ks[i], tl = C.outs[i];
        s += wire('M' + ox + ' ' + y1 + 'H' + kx + 'V' + (Y0 + 6), S.out) + '<text x="' + (ox + 6) + '" y="' + (y1 - 5) + '" font-size="10" font-weight="700">' + tl + '</text>';
        s += coil(kx, Y0 + 6, C.k[i], S.out) + wire('M' + kx + ' ' + (Y0 + 32) + 'V' + GND, S.out, false, BLUE);
      });
      /* motor */
      var my = Y0 + 110;
      s += '<g transform="translate(388 ' + my + ')"><circle r="25" fill="' + (S.out ? 'rgba(47,158,68,.18)' : 'transparent') + '" stroke="' + (S.out ? G : 'currentColor') + '" stroke-width="2.4"/>'
        + '<g class="' + (S.out ? 'spin' : '') + '"><path d="M0 -17V17M-17 0H17" stroke="currentColor" stroke-width="2.4"/><circle r="4" fill="currentColor"/></g>'
        + '<text y="42" text-anchor="middle" font-size="11" font-weight="700">M</text></g>'
        + '<text x="388" y="' + (my + 56) + '" text-anchor="middle" font-size="9.5">' + C.k[0] + ' + ' + C.k[1] + '</text>';

      /* channel loops under the device */
      var nL = C.loops.length, span = (BX2 - BX1 - 30) / nL;
      var pos = {}; // for mechanical links: id -> [[x,y],...]
      C.loops.forEach(function(L, li){
        var xo = BX1 + 26 + span * li + span * .22, xi = xo + Math.min(58, span * .5);
        var col = !dyn ? G : (L.sig === 'B' ? TEAL : G), inv = false, live = true, segs = '';
        segs += term(xo, BY2, L.from, true).replace(/y="(\d+)" text-anchor/, 'y="' + (BY2 + 18) + '" text-anchor');
        segs += term(xi, BY2, L.to, true).replace(/y="(\d+)" text-anchor/, 'y="' + (BY2 + 18) + '" text-anchor');
        segs += wire('M' + xo + ' ' + (BY2 + 22) + 'V' + (Y0 - 12), true, dyn, col);
        var y = Y0 - 12;
        L.items.forEach(function(it, i){
          var id = it[0], c = closed(id), yy = Y0 + STEP * i + 10, sub = it[1];
          segs += wire('M' + xo + ' ' + y + 'V' + (yy - 33), live, dyn, inv ? '#7048e8' : col);
          if (sub.indexOf('Adam') === 0){ segs += adam(xo, yy, c, sub, live, inv ? '#7048e8' : col, NAMES[id]); live = live && c; inv = !inv; }
          else if (sub === 'Smile'){ segs += smile(xo, yy, c, live, inv ? '#7048e8' : col); live = live && c; inv = !inv; }
          else { segs += contV(xo, yy - 33, yy + 16, c, true, sub, live, dyn, col); (pos[id] = pos[id] || []).push([xo, yy]); live = live && c; }
          segs += wire('M' + xo + ' ' + (yy + 16) + 'V' + (yy + 16), live, dyn, col);
          y = yy + 16;
          if (sub.indexOf('Adam') === 0 || sub === 'Smile'){ if (dyn && live) segs += '<text x="' + (xo + 8) + '" y="' + (y + 13) + '" font-size="9.5" font-weight="700" fill="' + (inv ? '#7048e8' : col) + '">' + (L.sig || 'T') + (inv ? '̅' : '') + '</text>'; }
        });
        segs += wire('M' + xo + ' ' + y + 'V' + YB + 'H' + xi + 'V' + (BY2 + 22), live, dyn, inv ? '#7048e8' : col);
        s += segs;
      });
      /* mechanical links: same device, two contacts (dashed) + its name */
      Object.keys(pos).forEach(function(id){ var p = pos[id]; if (p.length < 2) { if (p.length === 1) s += '<text x="' + (p[0][0] - 26) + '" y="' + (p[0][1] - 4) + '" text-anchor="end" font-size="10" font-weight="700">' + NAMES[id] + '</text>'; return; }
        var y = p[0][1] - 2; s += '<path d="M' + (p[0][0] - 6) + ' ' + y + 'H' + (p[p.length - 1][0] - 6) + '" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4 3"/>';
        s += '<text x="' + (p[0][0] - 26) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" font-weight="700" fill="' + (S[id] ? '#c62828' : 'currentColor') + '">' + NAMES[id] + '</text>'; });

      return '<svg class="lx-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="رسم توصيل حيّ: ' + C.name + ' مع طوارئ وبابين"><g font-family="IBM Plex Mono,monospace" fill="currentColor">' + s + '</g></svg>';
    }

    /* ---------- UI ---------- */
    var box = el('div'), ctl = el('div', 'lx-ctl'), stat = el('p', 'lx-st'), note = el('p', 'lx-note', C.note);
    var B = {};
    function btn(k, cls){ var b = el('button', 'lx-b ' + (cls || '')); b.type = 'button'; b.addEventListener('click', function(){ stopDemo(); act(k); }); ctl.appendChild(b); B[k] = b; return b; }
    btn('es', 'es'); btn('reset', 'rs'); btn('d1'); btn('d2');
    var dB = el('button', 'lx-b demo', '▶ شاهد المثال وهو يعمل'); dB.type = 'button'; ctl.appendChild(dB);
    var sp = el('div', 'lx-sp', 'السرعة: <button type="button" data-s="1" aria-pressed="true">عادية</button><button type="button" data-s="2" aria-pressed="false">2×</button>'); ctl.appendChild(sp);
    sp.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; speed = +b.getAttribute('data-s'); sp.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); });
    host.innerHTML = ''; host.appendChild(box); host.appendChild(ctl); host.appendChild(stat); host.appendChild(note);

    function draw(){
      box.innerHTML = svg();
      B.es.innerHTML = S.es ? '🔴 الطوارئ مضغوطة (أدرها)' : '🔴 اضغط الطوارئ'; B.es.setAttribute('aria-pressed', S.es);
      B.d1.innerHTML = S.d1 ? '🚪 الباب 1 مفتوح (أغلقه)' : '🚪 افتح الباب 1'; B.d1.setAttribute('aria-pressed', S.d1);
      B.d2.innerHTML = S.d2 ? '🚪 الباب 2 مفتوح (أغلقه)' : '🚪 افتح الباب 2'; B.d2.setAttribute('aria-pressed', S.d2);
      B.reset.innerHTML = '🔵 RESET'; B.reset.setAttribute('aria-pressed', S.reset);
      stat.textContent = S.msg || 'المحرك واقف. كل شيء مغلق، فاضغط RESET ليشتغل.';
      stat.className = 'lx-st ' + (S.msg ? S.tone : '');
      dB.textContent = demo ? '■ أوقف العرض' : '▶ شاهد المثال وهو يعمل';
    }

    /* ---------- auto demo (slow by default) ---------- */
    var STEPS = ['reset', 'es', 'reset', 'es', 'reset', 'd1', 'd1', 'reset', 'd2', 'reset', 'd2', 'reset'];
    function stopDemo(){ if (demo){ clearTimeout(demo); demo = null; draw(); } }
    function runDemo(i){
      if (i >= STEPS.length){ demo = null; draw(); return; }
      act(STEPS[i]); demo = setTimeout(function(){ runDemo(i + 1); }, 3400 / speed);
    }
    dB.addEventListener('click', function(){
      if (demo){ stopDemo(); return; }
      S.es = S.d1 = S.d2 = S.out = false; S.msg = ''; demo = setTimeout(function(){ runDemo(0); }, 600 / speed); draw();
    });
    draw();
  }

  function boot(){
    if (!document.getElementById('lx-css')){ var st = document.createElement('style'); st.id = 'lx-css'; st.textContent = CSS; document.head.appendChild(st); }
    document.querySelectorAll('.live-ex[data-dev]').forEach(Live);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
