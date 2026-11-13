/* مثال حيّ داخل الدرس: طوارئ وبابان على قنوات جهاز الأمان، والتيار يظهر على الرسم.
   الاستخدام: <div class="live-ex" data-dev="rt9|pnoz|vital|pluto"></div> + <script src="live.js"></script>
   كل جهاز له CFG: الحلقات (القنوات) تحت الجهاز، وسلاسل الريست/المراقبة فوقه، وأسماء الأطراف. */
(function(){
  'use strict';
  var G = '#2f9e44', OFF = '#9aa3a9', RED = '#c62828', BLUE = '#2f6fb5', TEAL = '#0b8f8a';

  /* عناصر الماكينة: es = الطوارئ، d1/d2 = البابان */
  var NAMES = { es:'الطوارئ', d1:'الباب 1', d2:'الباب 2', L:'اليد اليسرى', R:'اليد اليمنى' };

  var CFG = {
    rt9: {
      terms:{ t:{e:['S34','X1','X4'], i:['+A1','S13','13','23'], s:0}, b:{i:['-A2','S14','14','24'], e:['S24','S44','Y14'], s:-1} }, br:[['-A2','S24']],
      name:'RT9', sup:['+A1', '-A2'], dyn:false,
      loops:[
        { from:'S13', to:'S14', items:[['es','11-12'], ['d1','11-12'], ['d2','11-12']] },
        { from:'S13', to:'S34', items:[['es','21-22'], ['d1','21-22'], ['d2','21-22']] }
      ],
      top:[ { from:'+A1', to:'X1', items:['k1','k2','reset'] } ],
      outs:[['13','14'], ['23','24']], k:['K1', 'K2'],
      leds:[['On','pow'], ['In1','c0'], ['In2','c1'], ['1','out'], ['2','out']],
      note:'القناة 1: <span class="lx-ch">S13 → E-Stop 11-12 → Door 1 → Door 2 → S14</span> والقناة 2: <span class="lx-ch">S13 → E-Stop 21-22 → Door 1 → Door 2 → S34</span> كل باب عليه مفتاح أمان بتلامسين NC، فإذا فُتح الباب فتح القناتين معًا. والريست: <span class="lx-ch">A1(+) → K1 NC → K2 NC → RESET → X1</span> والبريدج البرتقالي بين A2 وS24 يطلبه الكتالوج عندما لا يُستخدم S24 (توصيل قناتين من +24V).'
    },
    pnoz: {
      terms:{ t:{e:['A1','⏚','S31','S32','13','23','33','41'], i:['S11','S12','S13','S14','S21','S22','S33','S34'], s:-1}, b:{e:['A2','Y30','Y31','Y32','14','24','34','42']} },
      name:'PNOZ X3P', sup:['A1', 'A2'], dyn:false,
      loops:[
        { from:'S11', to:'S12', items:[['es','11-12'], ['d1','11-12'], ['d2','11-12']] },
        { from:'S21', to:'S22', items:[['es','21-22'], ['d1','21-22'], ['d2','21-22']] }
      ],
      top:[ { from:'S33', to:'S34', items:['k1','k2','reset'] } ],
      outs:[['13','14'], ['23','24']], k:['K5', 'K6'],
      leds:[['POWER','pow'], ['CH.1','out'], ['CH.2','out']],
      note:'القناة 1: <span class="lx-ch">S11 → E-Stop 11-12 → Door 1 → Door 2 → S12</span> والقناة 2: <span class="lx-ch">S21 → E-Stop 21-22 → Door 1 → Door 2 → S22</span> والريست المراقَب: <span class="lx-ch">S33 → K5 NC → K6 NC → RESET → S34</span>'
    },
    vital: {
      terms:{ t:{e:['S1','X1','X4'], i:['+A1','B1','13','23'], s:0}, b:{i:['-A2','B2','14','24'], e:['T1','R1','Y14'], s:-1} },
      name:'Vital 1', sup:['+A1', '-A2'], dyn:true,
      loops:[
        { from:'T1', to:'R1', items:[['d1','Adam 1'], ['d2','Adam 2'], ['es','Smile']] }
      ],
      top:[ { from:'B1', to:'X1', items:['k1','k2','reset'] } ],
      outs:[['13','14'], ['23','24']], k:['K1', 'K2'],
      leds:[['On','pow'], ['In','c0'], ['1','out'], ['2','out']],
      note:'قناة واحدة ديناميكية: <span class="lx-ch">T1 → Adam 1 → Adam 2 → Smile → R1</span> على كل باب Adam في الإطار وEva في الباب. كل عنصر يقلب الإشارة، والعدد 3 فردي، لذلك S1 غير موصّل. إذا فُتح باب ابتعدت الـ Eva عن الـ Adam فتوقفت الإشارة.'
    },
    pluto: {
      terms:{ t:{e:['I0','I1','I2','I3','I4','I5','I6','I7'], i:['+24V','0V','ID','CH','CL'], s:-1}, b:{i:['IQ10','IQ11','IQ12','IQ13','IQ14','IQ15','IQ16','IQ17'], e:['Q0','Q1','Q2','Q3'], s:3} },
      name:'Pluto B20', sup:['+24V', '0V'], dyn:true,
      loops:[
        { from:'IQ10', to:'I0', sig:'A', items:[['es','11-12']] },
        { from:'IQ11', to:'I1', sig:'B', items:[['es','21-22']] },
        { from:'IQ10', to:'I2', sig:'A', items:[['d1','Adam 1'], ['d2','Adam 2']] }
      ],
      top:[ { from:'rail', to:'I4', items:['k1','k2'] }, { from:'rail', to:'I5', items:['reset'] } ],
      outs:[[null,'Q0'], [null,'Q1']], k:['K1', 'K2'],
      leds:[['I0','c0'], ['I1','c1'], ['I2','c2'], ['Q0','out'], ['Q1','out']],
      note:'الطوارئ بقناتين: <span class="lx-ch">IQ10 (A) → NC 11-12 → I0</span> <span class="lx-ch">IQ11 (B) → NC 21-22 → I1</span> والبابان على حلقة واحدة: <span class="lx-ch">IQ10 (A) → Adam 1 → Adam 2 → I2</span> كل Adam يقلب الإشارة، فبعد اثنين ترجع A كما هي، ولذلك يُعرَّف I2 في البرنامج على أنه ينتظر A غير معكوسة.'
    },
    rt6: {
      terms:{ t:{e:['S53','X1','X4'], i:['+A1','S13','S14','S34','13','23','33','41'], s:0}, b:{i:['-A2','S23','S24','S44','14','24','34','42'], e:['Y13','Y14','Y24'], s:4} }, br:[['S23','S24']],
      name:'RT6', sup:['+A1', '-A2'], dyn:false,
      loops:[
        { from:'S13', to:'S14', items:[['es','11-12'], ['d1','11-12'], ['d2','11-12']] },
        { from:'S13', to:'S34', items:[['es','21-22'], ['d1','21-22'], ['d2','21-22']] }
      ],
      top:[ { from:'S53', to:'X1', items:['k1','k2','reset'] } ],
      outs:[['13','14'], ['23','24']], k:['K1', 'K2'],
      leds:[['On','pow'], ['In1','c0'], ['In2','c1'], ['1','out'], ['2','out']],
      note:'نفس توصيل RT9، والفرق أن الريست يأخذ 24V من S53: <span class="lx-ch">S53 → K1 NC → K2 NC → RESET → X1</span> القناة 1: <span class="lx-ch">S13 → E-Stop 11-12 → Door 1 → Door 2 → S14</span> والقناة 2: <span class="lx-ch">S13 → E-Stop 21-22 → Door 1 → Door 2 → S34</span> والـ RT6 فيه 3 مخارج أمان (13-14 و23-24 و33-34) وخرج NC للمعلومات 41-42. والبريدج البرتقالي بين S23 وS24: يطلبه الكتالوج عندما لا يُستخدم S24.'
    },
    rt7: {
      terms:{ t:{e:['S53','X1','X4','T0','T1','T2'], i:['+A1','S13','S14','S34','13','23','43','53'], s:0}, b:{i:['-A2','S23','S24','S44','14','24','44','54'], e:['Y13','Y14','Y24','Y34','31','32'], s:1} }, br:[['S23','S24'],['T0','T1'],['T1','T2']],
      name:'RT7A', sup:['+A1', '-A2'], dyn:false, delay:1500, delayCol:1,
      loops:[
        { from:'S13', to:'S14', items:[['es','11-12'], ['d1','11-12'], ['d2','11-12']] },
        { from:'S13', to:'S34', items:[['es','21-22'], ['d1','21-22'], ['d2','21-22']] }
      ],
      top:[ { from:'S53', to:'X1', items:['k2','reset'] } ],
      use:['53','54'], outs:[['13','14'], ['43','44']], k:['VFD', 'K1'], mtxt:'K1 + K2 (53-54)',
      leds:[['On','pow'], ['In1','c0'], ['In2','c1'], ['1','out'], ['2','out'], ['t','outd']],
      note:'الخرج المباشر 13-14 يعطي أمر إيقاف للانفرتر فيفرمل المحرك بهدوء، والخرجان المتأخران 43-44 و53-54 يفصلان K1 وK2 بعد زمن التأخير (هنا 1.5 ثانية: بريدج T0-T1 وبريدج T1-T2. و1 ثانية = T0-T2 فقط، و0.5 ثانية = T0-T1 فقط، وبدون بريدج = 0). هذا اسمه Stop Category 1. وبريدج S23-S24 زي RT6. القنوات مثل RT6: <span class="lx-ch">S13 → E-Stop → Door 1 → Door 2 → S14 / S34</span> والريست: <span class="lx-ch">S53 → K1 NC → K2 NC → RESET → X1</span>'
    },
    bt50: {
      terms:{ t:{e:['Y14','13','33'], i:['+A1','X4','23','41'], s:0}, b:{i:['-A2','T2','24','42'], e:['T1','14','34'], s:0} },
      name:'BT50', sup:[null, '-A2'], dyn:false, supLoop:true, onPress:true, cutTxt:'التغذية عن A1', rstLabel:'START',
      loops:[
        { from:'+24V', src:true, to:'+A1', items:[['es','11-12'], ['d1','11-12'], ['d2','11-12']] }
      ],
      top:[ { from:'+A1', to:'X4', items:['k1','k2','reset'] } ],
      outs:[['13','14'], ['23','24']], k:['K1', 'K2'],
      leds:[['On','c0'], ['Out','out'], ['X4','rst']],
      note:'الـ BT50 ليس له قنوات دخل: الطوارئ والأبواب توضع على التوالي في تغذيته نفسها. <span class="lx-ch">+24V → E-Stop 11-12 → Door 1 → Door 2 → A1</span> ويعمل الخرج عندما يُغلق دخل الاختبار X4: <span class="lx-ch">A1 → K1 NC → K2 NC → START → X4</span> هذا توصيل بقناة واحدة، ولذلك يُستخدم الـ BT50 غالبًا ريلاي توسعة لزيادة المخارج بعد RT9 أو Pluto.'
    },
    jsbt5: {
      name:'JSBT5', sup:[null, 'A2'], dyn:false, supLoop:true, cutTxt:'التغذية عن A1', rstLabel:'START',
      terms:{ t:{e:['X1','13','23'], i:['X2','33','41'], s:0}, b:{i:['A2','34','42'], e:['A1','14','24'], s:0} },
      loops:[
        { from:'+24V', src:true, to:'A1', items:[['es','11-12'], ['d1','11-12'], ['d2','11-12']] }
      ],
      top:[ { from:'X1', to:'X2', items:['k1','k2','reset'] } ],
      outs:[['13','14'], ['23','24']], k:['K1', 'K2'],
      leds:[['Supply','all'], ['(K1·K2)','out']],
      note:'الـ JSBT5 عرضه 22.5 مم فقط، وله 3 مخارج أمان NO (13-14 و23-24 و33-34) وخرج NC للمعلومات 41-42. الطوارئ والأبواب في تغذيته: <span class="lx-ch">+24V → E-Stop 11-12 → Door 1 → Door 2 → A1</span> ودخل الاختبار X1-X2 يجب أن يُغلق مرة لتعمل المخارج، ولذلك نضع فيه START وتلامسات NC للكونتاكتورات: <span class="lx-ch">X1 → K1 NC → K2 NC → START → X2</span> لاحظ أن A1 وA2 كليهما في الأسفل: A2 في الصف الأمامي وA1 في الخلفي، كما في الجهاز الحقيقي.'
    },
    jsbr4: {
      name:'JSBR4', sup:['A1', 'A2'], dyn:false, th:true,
      terms:{ t:{e:['A1','S13','S24','X2','41','13','23','33']}, b:{e:['A2','S14','S23','X3','42','14','24','34']} },
      loops:[
        { from:'S13', to:'S14', items:[['L','NO']] },
        { from:'S24', to:'S23', items:[['R','NO']] }
      ],
      top:[ { from:'X3', to:'X2', items:['k1','k2'] } ],
      br:[['S14','X3']],
      outs:[['13','14'], ['23','24']], k:['K1', 'K2'], mtxt:'K1 + K2',
      leds:[['On','pow'], ['In','all'], ['Out','out']],
      note:'ريلاي التشغيل باليدين: القناة A <span class="lx-ch">S13 → Left hand NO → S14</span> والقناة B <span class="lx-ch">S24 → Right hand NO → S23</span> يجب أن يُغلق الزران خلال أقل من 0.5 ثانية، وإذا رفعت يدًا واحدة فصل الخرج، ولا يعمل مرة أخرى إلا بعد رفع اليدين كلتيهما. والبريدج بين S14 وX3 يجعل دائرة الاختبار تبدأ من القناة A: <span class="lx-ch">X3 → K1 NC → K2 NC → X2</span> (في الكتالوج لكل زر أيضًا تلامس NC موصّل بالعكس، والرسم هنا مبسّط على تلامس NO.)'
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

  /* ---------- the device itself: every terminal in its real row ---------- */
  var GX1 = 40, GX2 = 340, GY1 = 140, GY2 = 290, ORG = '#e8590c';
  function layout(C){
    var P = {};
    [['t', C.terms.t], ['b', C.terms.b]].forEach(function(r){
      var side = r[0], d = r[1] || {}, E = d.e || [], I = d.i || [], st = d.s || 0, idx = [];
      if (I.length){ I.forEach(function(n, i){ idx.push([n, i, false]); }); E.forEach(function(n, j){ idx.push([n, j + st + .5, true]); }); }
      else E.forEach(function(n, j){ idx.push([n, j, true]); });
      if (!idx.length) return;
      var mn = Infinity, mx = -Infinity; idx.forEach(function(a){ mn = Math.min(mn, a[1]); mx = Math.max(mx, a[1]); });
      var sp = Math.min(36, (GX2 - GX1 - 26) / Math.max(1, mx - mn)), cx = (GX1 + GX2) / 2 - (mn + mx) / 2 * sp;
      idx.forEach(function(a){ P[a[0]] = { x:+(cx + a[1] * sp).toFixed(1), y: side === 't' ? (a[2] ? GY1 : GY1 + 24) : (a[2] ? GY2 : GY2 - 24), side:side, edge:a[2] }; });
    });
    return P;
  }
  function usedSet(C){
    var u = {}; function a(n){ if (n) u[n] = 1; }
    a(C.sup[0]); a(C.sup[1]);
    C.loops.forEach(function(L){ if (!L.src) a(L.from); a(L.to); });
    C.top.forEach(function(T){ if (T.from !== 'rail') a(T.from); a(T.to); });
    C.outs.forEach(function(o){ a(o[0]); a(o[1]); });
    (C.br || []).forEach(function(b){ a(b[0]); a(b[1]); });
    (C.use || []).forEach(a);
    return u;
  }
  function boxSvg(C, P, U, st, dev){
    var s = '<rect x="' + GX1 + '" y="' + GY1 + '" width="' + (GX2 - GX1) + '" height="' + (GY2 - GY1) + '" rx="10" fill="color-mix(in srgb,var(--panel,#fff) 80%,#f3c613)" stroke="#8a7400" stroke-width="2"/>';
    s += '<text x="' + ((GX1 + GX2) / 2) + '" y="' + (GY1 + 66) + '" text-anchor="middle" font-size="17" font-weight="700">' + C.name + '</text>';
    var gap = (GX2 - GX1 - 60) / C.leds.length;
    C.leds.forEach(function(l, i){ var x = GX1 + 30 + gap * (i + .5), on = st ? st[l[1]] : false;
      s += '<circle cx="' + x + '" cy="' + (GY1 + 83) + '" r="5.5" fill="' + (on ? (l[1] === 'out' && dev === 'pluto' ? '#e8590c' : '#37d058') : '#56606a') + '" stroke="#222"/><text x="' + x + '" y="' + (GY1 + 100) + '" text-anchor="middle" font-size="9.5">' + l[0] + '</text>'; });
    return s;
  }
  function termsSvg(C, P, U){
    var s = '';
    Object.keys(P).forEach(function(n){ var T = P[n], used = !!U[n], ly = T.side === 't' ? T.y + 15 : T.y - 9;
      s += '<circle cx="' + T.x + '" cy="' + T.y + '" r="4.6" fill="' + (used ? '#fff' : '#c3c9ce') + '" stroke="' + (used ? '#222' : '#8a949a') + '" stroke-width="1.5"/>'
        + '<text x="' + T.x + '" y="' + ly + '" text-anchor="middle" font-size="9.5"' + (used ? ' font-weight="700"' : ' fill-opacity=".55"') + '>' + n + '</text>';
    });
    return s;
  }
  /* بريدج بين طرفين: داخل الجهاز لو الاتنين في الصف الداخلي، وإلا سلك قصير برا الحافة */
  function bridgesSvg(C, P){
    var s = '';
    (C.br || []).forEach(function(b, i){ var A = P[b[0]], B = P[b[1]]; if (!A || !B) return;
      var top = A.side === 't', d, ty;
      if (!A.edge && !B.edge){ var yy = top ? A.y + 22 : A.y - 22; d = 'M' + A.x + ' ' + A.y + 'C' + A.x + ' ' + yy + ' ' + B.x + ' ' + yy + ' ' + B.x + ' ' + B.y; ty = null; }
      else { var ly = top ? GY1 - 7 : GY2 + 7; d = 'M' + A.x + ' ' + A.y + 'V' + ly + 'H' + B.x + 'V' + B.y; ty = top ? ly - 4 : ly + 11; }
      s += '<path d="' + d + '" fill="none" stroke="' + ORG + '" stroke-width="3.2" stroke-linecap="round"/>';
      if (ty != null) s += '<text x="' + ((A.x + B.x) / 2) + '" y="' + ty + '" text-anchor="middle" font-size="9" font-weight="700" fill="' + ORG + '" font-family="IBM Plex Sans Arabic,Noto Sans Arabic,sans-serif" direction="rtl" unicode-bidi="embed">بريدج</text>';
    });
    return s;
  }

  function el(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function Live(host){
    var dev = host.getAttribute('data-dev'), C = CFG[dev]; if (!C) return;
    var S = { es:false, d1:false, d2:false, L:false, R:false, tL:0, tR:0, armed:true, reset:false, out:false, outD:false, tk:0, msg:'', tone:'' };
    var demo = null, speed = 1;

    /* ---------- logic ---------- */
    function closed(id){ return (id === 'L' || id === 'R') ? !!S[id] : !S[id]; }                         // كل عنصر مغلق إلا لو اتضغط/اتفتح
    function loopOk(L){ for (var i = 0; i < L.items.length; i++) if (!closed(L.items[i][0])) return false; return true; }
    function inputsOk(){ for (var i = 0; i < C.loops.length; i++) if (!loopOk(C.loops[i])) return false; return true; }
    function fbOk(){ return !S.out && !S.outD; }                              // NC الكونتاكتورات مغلقة لما الكونتاكتورات واقفة
    function open(){ var a = []; ['es','d1','d2'].forEach(function(k){ if (S[k]) a.push(k); }); return a; }
    function eval_(){
      if (!inputsOk() && S.out){
        S.out = false; var o = open(), why = (o[0] === 'es' ? 'اتضغطت الطوارئ' : 'اتفتح ' + NAMES[o[0]]) + '، فانقطعت ' + (C.cutTxt || (C.dyn ? 'الإشارة' : 'القناتان'));
        S.tone = 'bad';
        if (C.delay){
          S.msg = why + '. فصل ' + C.name + ' الخرج المباشر 13-14 فورًا، فأخذ الانفرتر أمر الإيقاف وبدأ المحرك يفرمل. وبعد ' + (C.delay / 1000) + ' ثانية يفصل الخرج المتأخر 43-44 فيقف ' + C.k[1] + '.';
          var tk = ++S.tk; setTimeout(function(){ if (tk !== S.tk || S.out) return; S.outD = false; S.msg = 'انتهى التأخير: فصل الخرج المتأخر 43-44، فوقف ' + C.k[1] + ' وانفصلت الكهرباء عن المحرك بعد أن توقف بهدوء.'; draw(); }, C.delay / speed);
        } else { S.outD = false; S.msg = why + '، وفصل ' + C.name + ' الخرجين، فوقف ' + C.k[0] + ' و' + C.k[1] + ' ووقف المحرك.'; }
      }
    }
    function actTH(k){                                             // ريلاي اليدين
      var now = Date.now(), was = S.out;
      if (k === 'both'){ var on = !(S.L && S.R); S.L = S.R = on; S.tL = S.tR = now; }
      else { S[k] = !S[k]; if (S[k]) S[k === 'L' ? 'tL' : 'tR'] = now; }
      if (S.L && S.R){
        var dt = Math.abs(S.tL - S.tR) * speed;
        if (!S.armed){ S.msg = 'الريلاي لا يقبل: يجب أن ترفع اليدين كلتيهما أولًا، ثم تضغط الزرين معًا.'; S.tone = 'bad'; }
        else if (dt > 500){ S.armed = false; S.msg = 'الفرق بين الزرين ' + (dt / 1000).toFixed(1) + ' ثانية، أي أكثر من 0.5 ثانية، فرفض الـ JSBR4 التشغيل. ارفع اليدين وابدأ من جديد.'; S.tone = 'bad'; }
        else if (!fbOk()){ S.msg = 'الكونتاكتور لم يرجع، فدائرة الاختبار X3-X2 مفتوحة.'; S.tone = 'bad'; }
        else { S.out = S.outD = true; S.armed = false; S.msg = 'ضغطت الزرين خلال أقل من 0.5 ثانية، فأُغلقت القناتان A وB، وأغلق الـ JSBR4 الخرجين واشتغل المكبس. ويداك الآن بعيدتان عن منطقة الخطر.'; S.tone = 'ok'; }
      } else {
        if (was){ S.out = S.outD = false; S.msg = 'رفعت يدًا، فانفتحت قناة، وفصل الـ JSBR4 الخرجين فورًا ووقف المكبس.'; S.tone = 'bad'; }
        else if (S.L || S.R){ S.msg = 'ضغطت ' + NAMES[S.L ? 'L' : 'R'] + '. اضغط الزر الآخر خلال 0.5 ثانية.'; S.tone = ''; }
        else { S.msg = 'اليدان مرفوعتان، والريلاي جاهز لضغطة جديدة بالزرين معًا.'; S.tone = ''; }
        if (!S.L && !S.R) S.armed = true;
      }
      draw();
    }
    function act(k){
      if (C.th) return actTH(k);
      if (k === 'reset'){
        S.reset = true; draw();
        setTimeout(function(){
          S.reset = false;
          if (S.out){ S.msg = 'المحرك شغال بالفعل.'; S.tone = 'ok'; }
          else if (S.outD){ S.msg = 'انتظر: التأخير لم ينتهِ بعد، و' + C.k[1] + ' ما زال مغلقًا (تلامسه NC مفتوح في دائرة الريست).'; S.tone = 'bad'; }
          else if (!inputsOk()){ var o = open(); S.msg = 'الريست لا يعمل: ' + o.map(function(x){ return x === 'es' ? 'الطوارئ مضغوطة' : NAMES[x] + ' مفتوح'; }).join(' و') + '. ' + (o[0] === 'es' ? 'أدر زر الطوارئ أولًا' : 'أغلق الباب أولًا') + '، ثم اضغط ' + (C.rstLabel || 'RESET') + '.'; S.tone = 'bad'; }
          else { S.out = true; S.outD = true; S.msg = (C.supLoop ? 'الطوارئ والأبواب مغلقة فوصلت التغذية إلى A1، وتلامسا NC في K1 وK2 مغلقان، فلما ضغطت START أُغلق X4 فأغلق ' + C.name + ' الخرجين واشتغل المحرك.' : 'كل ' + (C.dyn ? 'الحلقات' : 'القنوات') + ' مغلقة، والكونتاكتورات واقفة (تلامسات NC مغلقة)، فلما تركت RESET أغلق ' + C.name + ' الخرجين واشتغل المحرك.'); S.tone = 'ok'; }
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
    /* الجهاز مرسوم بكل أطرافه زي الحقيقي: صف خارجي على الحافة (الخلفي) وصف داخلي (الأمامي)، فوق وتحت.
       الطرف المستخدم أبيض، وغير المستخدم رمادي، والبريدج برتقالي. */
    var W = 440, BX1 = 40, BX2 = 340, BY1 = 140, BY2 = 290, RAIL = 26, YC = 58;
    var maxItems = 0; C.loops.forEach(function(L){ maxItems = Math.max(maxItems, L.items.length); });
    var STEP = 66, Y0 = BY2 + 84, YB = Y0 + STEP * maxItems - 10, GND = Math.max(YB + 22 + 8 * C.loops.length, Y0 + 186), H = GND + 26;
    var P = layout(C), USED = usedSet(C);

    function wire(d, on, dyn, col){ return '<path d="' + d + '" fill="none" stroke="' + (on ? (col || G) : OFF) + '" stroke-width="' + (on ? 3.6 : 2.2) + '" stroke-linejoin="round" stroke-linecap="round"' + (on && dyn ? ' class="dyn"' : '') + '/>'; }
    function dot(x, y, on, col){ return '<circle cx="' + x + '" cy="' + y + '" r="3.6" fill="' + (on ? (col || G) : OFF) + '"/>'; }
    /* تلامس رأسي بين y1 وy2 على x */
    function contV(x, y1, y2, isClosed, nc, lab, onTop, dyn, col){
      var m = (y1 + y2) / 2, s = '';
      s += wire('M' + x + ' ' + y1 + 'V' + (m - 11), onTop, dyn, col);
      s += wire('M' + x + ' ' + (m + 11) + 'V' + y2, onTop && isClosed, dyn, col);
      s += isClosed ? '<path d="M' + x + ' ' + (m - 11) + 'L' + (x + 2) + ' ' + (m + 11) + '" stroke="' + (onTop ? (col || G) : 'currentColor') + '" stroke-width="3"/>' : '<path d="M' + x + ' ' + (m + 11) + 'L' + (x - 13) + ' ' + (m - 8) + '" stroke="' + (nc ? '#c62828' : 'currentColor') + '" stroke-width="2.6"/>';
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

    /* ---- routing: every wire leaves its real terminal and runs in its own lane ---- */
    var tl, bl, ll, memo;
    function lt(){ return BY1 - 14 - 9 * (tl++); }
    function lb(){ return BY2 + 14 + 9 * (bl++); }
    function lL(){ return BX1 - 10 - 8 * (ll++); }
    /* من الطرف إلى نقطة (px,py) خارج الجهاز. نفس الطرف لنفس الاتجاه يعيد نفس المسار (تفرّع) */
    function route(term, px, py, extra){
      var T = P[term], up = py < BY1, k = term + (up ? 'u' : 'd'), m = memo[k], first = !m, s = '';
      if (!m) m = memo[k] = {};
      if (T.side === 't' && up){ if (m.a == null) m.a = lt(); s = 'M' + T.x + ' ' + T.y + 'V' + m.a + 'H' + px + 'V' + py; }
      else if (T.side === 'b' && !up){ if (m.a == null) m.a = lb(); s = 'M' + T.x + ' ' + T.y + 'V' + m.a + 'H' + px + 'V' + py; }
      else if (T.side === 't'){ if (m.a == null){ m.a = lt(); m.x = lL(); m.b = lb(); } s = 'M' + T.x + ' ' + T.y + 'V' + m.a + 'H' + m.x + 'V' + m.b + 'H' + px + 'V' + py; }
      else { if (m.a == null){ m.a = lb(); m.x = lL(); m.b = lt(); } s = 'M' + T.x + ' ' + T.y + 'V' + m.a + 'H' + m.x + 'V' + m.b + 'H' + px + 'V' + py; }
      if (extra) extra.j = first ? null : [m.px, m.b != null ? m.b : m.a];
      if (first) m.px = px;
      return s;
    }
    /* رجوع الحلقة من أسفل العمود إلى طرفها */
    function routeBack(term, px, py, ly){
      var T = P[term];
      if (T.side === 'b') return 'M' + px + ' ' + py + 'V' + ly + 'H' + T.x + 'V' + T.y;
      return 'M' + px + ' ' + py + 'V' + ly + 'H' + lL() + 'V' + lt() + 'H' + T.x + 'V' + T.y;
    }

    function svg(){
      tl = 0; bl = 0; ll = 0; memo = {};
      var s = '', w = '', ok = inputsOk(), dyn = C.dyn;
      /* rails */
      s += '<path d="M8 ' + RAIL + 'H' + (W - 8) + '" stroke="' + RED + '" stroke-width="3"/><text x="10" y="' + (RAIL - 8) + '" font-weight="700" font-size="12" fill="' + RED + '">+24V</text>';
      s += '<path d="M8 ' + GND + 'H' + (W - 8) + '" stroke="' + BLUE + '" stroke-width="3"/><text x="10" y="' + (GND + 18) + '" font-weight="700" font-size="12" fill="' + BLUE + '">0V</text>';
      /* device box (wires are drawn over it, terminals last) */
      var st = { pow:true, out:S.out, outd:S.outD && !!C.delay, rst:S.reset && inputsOk() && fbOk(), all:ok, c0:C.loops[0] && loopOk(C.loops[0]), c1:C.loops[1] && loopOk(C.loops[1]), c2:C.loops[2] && loopOk(C.loops[2]) };
      s += boxSvg(C, P, USED, st, dev);

      /* supply */
      if (C.sup[0]) w += wire('M' + P[C.sup[0]].x + ' ' + RAIL + 'V' + P[C.sup[0]].y, true, false, RED);
      var mi = P[C.sup[1]];
      if (mi.side === 'b') w += wire('M' + mi.x + ' ' + mi.y + 'V' + GND, C.supLoop ? ok : true, false, BLUE);
      else w += wire('M' + mi.x + ' ' + mi.y + 'V' + lt() + 'H' + (BX2 + 7) + 'V' + GND, true, false, BLUE);

      /* top chains (reset / feedback / test) */
      var cx1 = BX1 + 52, cx2 = BX2 - 14, tw = (cx2 - cx1) / C.top.length;
      C.top.forEach(function(T, ti){
        var xa = cx1 + tw * ti, xb = cx1 + tw * (ti + 1) - 18, live = C.th ? loopOk(C.loops[0]) : C.supLoop ? ok : true;
        if (T.from === 'rail') w += wire('M' + xa + ' ' + RAIL + 'V' + YC, true);
        else w += wire(route(T.from, xa, YC), live);
        var n = T.items.length, seg = (xb - xa) / n;
        T.items.forEach(function(it, i){ var a = xa + seg * i, b = a + seg;
          var c = it === 'reset' ? S.reset : !(C.delay && it === 'k2' ? S.outD : S.out), lab = it === 'reset' ? (C.rstLabel || 'RESET') : (it === 'k1' ? C.k[0] : C.k[1]) + ' NC';
          w += contH(a, b, YC, c, it !== 'reset', lab, live); live = live && c;
        });
        w += wire(route(T.to, xb, YC), live);
      });

      /* outputs: 13 from +24V, 14 to the coil */
      var ks = [372, 418], CY = Y0 + 6;
      C.outs.forEach(function(o, i){ var on = C.delayCol === i ? S.outD : S.out, kx = ks[i], f = P[o[0]], q = P[o[1]];
        if (f && f.side === 't') w += wire('M' + f.x + ' ' + RAIL + 'V' + f.y, true, false, RED);
        w += wire('M' + q.x + ' ' + q.y + 'V' + (q.side === 'b' ? lb() : lt()) + 'H' + kx + 'V' + CY, on);
        s += coil(kx, CY, C.k[i], on) + wire('M' + kx + ' ' + (CY + 26) + 'V' + GND, on, false, BLUE);
      });
      /* motor */
      var my = Y0 + 110, run = C.delay ? S.outD : S.out, slow = C.delay && S.outD && !S.out;
      s += '<g transform="translate(395 ' + my + ')"><circle r="25" fill="' + (run ? 'rgba(47,158,68,.18)' : 'transparent') + '" stroke="' + (run ? G : 'currentColor') + '" stroke-width="2.4"/>'
        + '<g class="' + (run ? 'spin' : '') + '"' + (slow ? ' style="animation-duration:2.6s"' : '') + '><path d="M0 -17V17M-17 0H17" stroke="currentColor" stroke-width="2.4"/><circle r="4" fill="currentColor"/></g>'
        + '<text y="42" text-anchor="middle" font-size="11" font-weight="700">M</text></g>'
        + '<text x="395" y="' + (my + 56) + '" text-anchor="middle" font-size="9.5">' + (C.mtxt || C.k[0] + ' + ' + C.k[1]) + '</text>'
        + (slow ? '<text x="395" y="' + (my - 34) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#e8590c" font-family="IBM Plex Sans Arabic,sans-serif">يفرمل…</text>' : '');

      /* channel loops under the device */
      var nL = C.loops.length, x0 = nL > 2 ? 84 : 104, span = nL > 2 ? 83 : 112;
      var pos = {};
      C.loops.forEach(function(L, li){
        var xo = x0 + span * li, col = !dyn ? G : (L.sig === 'B' ? TEAL : G), inv = false, live = true, segs = '', ex = {};
        if (L.src){ segs += '<circle cx="' + xo + '" cy="' + (Y0 - 30) + '" r="5" fill="' + RED + '"/><text x="' + (xo + 9) + '" y="' + (Y0 - 26) + '" font-weight="700" font-size="11" fill="' + RED + '">' + L.from + '</text>' + wire('M' + xo + ' ' + (Y0 - 30) + 'V' + (Y0 - 12), true, false, RED); }
        else { segs += wire(route(L.from, xo, Y0 - 12, ex), true, dyn, col); if (ex.j) segs += dot(ex.j[0], ex.j[1], true, col); }
        var y = Y0 - 12;
        L.items.forEach(function(it, i){
          var id = it[0], c = closed(id), yy = Y0 + STEP * i + 10, sub = it[1];
          segs += wire('M' + xo + ' ' + y + 'V' + (yy - 33), live, dyn, inv ? '#7048e8' : col);
          if (sub.indexOf('Adam') === 0){ segs += adam(xo, yy, c, sub, live, inv ? '#7048e8' : col, NAMES[id]); live = live && c; inv = !inv; }
          else if (sub === 'Smile'){ segs += smile(xo, yy, c, live, inv ? '#7048e8' : col); live = live && c; inv = !inv; }
          else { segs += contV(xo, yy - 33, yy + 16, c, !C.th, sub, live, dyn, col); (pos[id] = pos[id] || []).push([xo, yy]); live = live && c; }
          y = yy + 16;
          if (sub.indexOf('Adam') === 0 || sub === 'Smile'){ if (dyn && live) segs += '<text x="' + (xo + 8) + '" y="' + (y + 13) + '" font-size="9.5" font-weight="700" fill="' + (inv ? '#7048e8' : col) + '">' + (L.sig || 'T') + (inv ? '̅' : '') + '</text>'; }
        });
        segs += wire(routeBack(L.to, xo, y, YB + 8 + li * 8), live, dyn, inv ? '#7048e8' : col);
        w += segs;
      });
      /* mechanical links: same device, two contacts (dashed) + its name */
      Object.keys(pos).forEach(function(id){ var p = pos[id]; if (p.length < 2) { if (p.length === 1) w += '<text x="' + (p[0][0] - 20) + '" y="' + (p[0][1] - 4) + '" text-anchor="end" font-size="10" font-weight="700" font-family="IBM Plex Sans Arabic,sans-serif" fill="' + (C.th ? (S[id] ? G : 'currentColor') : (S[id] ? '#c62828' : 'currentColor')) + '">' + NAMES[id] + '</text>'; return; }
        var y = p[0][1] - 2; w += '<path d="M' + (p[0][0] - 6) + ' ' + y + 'H' + (p[p.length - 1][0] - 6) + '" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4 3"/>';
        w += '<text x="' + (p[0][0] - 20) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" font-weight="700" font-family="IBM Plex Sans Arabic,sans-serif" fill="' + (S[id] ? '#c62828' : 'currentColor') + '">' + NAMES[id] + '</text>'; });

      s += w + bridgesSvg(C, P) + termsSvg(C, P, USED);
      return '<svg class="lx-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="رسم توصيل حيّ: ' + C.name + ' بكل أطرافه"><g font-family="IBM Plex Mono,monospace" fill="currentColor">' + s + '</g></svg>';
    }

    /* ---------- UI ---------- */
    var box = el('div'), ctl = el('div', 'lx-ctl'), stat = el('p', 'lx-st'), note = el('p', 'lx-note', C.note);
    var B = {};
    function btn(k, cls){ var b = el('button', 'lx-b ' + (cls || '')); b.type = 'button'; b.addEventListener('click', function(){ stopDemo(); act(k); }); ctl.appendChild(b); B[k] = b; return b; }
    if (C.th){ btn('L'); btn('R'); btn('both', 'rs').style.gridColumn = '1/-1'; } else { btn('es', 'es'); btn('reset', 'rs'); btn('d1'); btn('d2'); }
    var dB = el('button', 'lx-b demo', '▶ شاهد المثال وهو يعمل'); dB.type = 'button'; ctl.appendChild(dB);
    var sp = el('div', 'lx-sp', 'السرعة: <button type="button" data-s="1" aria-pressed="true">عادية</button><button type="button" data-s="2" aria-pressed="false">2×</button>'); ctl.appendChild(sp);
    sp.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; speed = +b.getAttribute('data-s'); sp.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); });
    host.innerHTML = ''; host.appendChild(box); host.appendChild(ctl); host.appendChild(stat); host.appendChild(note);

    function draw(){
      box.innerHTML = svg();
      if (C.th){
        B.L.innerHTML = S.L ? '✋ اليسرى مضغوطة (ارفعها)' : '✋ اضغط باليسرى'; B.L.setAttribute('aria-pressed', S.L);
        B.R.innerHTML = S.R ? '✋ اليمنى مضغوطة (ارفعها)' : '✋ اضغط باليمنى'; B.R.setAttribute('aria-pressed', S.R);
        B.both.innerHTML = (S.L && S.R) ? '🙌 ارفع اليدين' : '🙌 اضغط الزرين معًا'; B.both.setAttribute('aria-pressed', S.L && S.R);
      } else {
      B.es.innerHTML = S.es ? '🔴 الطوارئ مضغوطة (أدرها)' : '🔴 اضغط الطوارئ'; B.es.setAttribute('aria-pressed', S.es);
      B.d1.innerHTML = S.d1 ? '🚪 الباب 1 مفتوح (أغلقه)' : '🚪 افتح الباب 1'; B.d1.setAttribute('aria-pressed', S.d1);
      B.d2.innerHTML = S.d2 ? '🚪 الباب 2 مفتوح (أغلقه)' : '🚪 افتح الباب 2'; B.d2.setAttribute('aria-pressed', S.d2);
      B.reset.innerHTML = '🔵 ' + (C.rstLabel || 'RESET'); B.reset.setAttribute('aria-pressed', S.reset);
      }
      stat.textContent = S.msg || (C.th ? 'المكبس واقف. اضغط الزرين معًا (خلال 0.5 ثانية) ليشتغل.' : 'المحرك واقف. كل شيء مغلق، فاضغط ' + (C.rstLabel || 'RESET') + ' ليشتغل.');
      stat.className = 'lx-st ' + (S.msg ? S.tone : '');
      dB.textContent = demo ? '■ أوقف العرض' : '▶ شاهد المثال وهو يعمل';
    }

    /* ---------- auto demo (slow by default) ---------- */
    var STEPS = ['reset', 'es', 'reset', 'es', 'reset', 'd1', 'd1', 'reset', 'd2', 'reset', 'd2', 'reset'];
    var TH_STEPS = [['both', 3600], ['both', 3000], ['L', 1000], ['R', 3800], ['L', 1200], ['R', 2600], ['L', 300], ['R', 3600], ['R', 3000], ['L', 2600]];
    function stopDemo(){ if (demo){ clearTimeout(demo); demo = null; draw(); } }
    function runDemo(i){
      var L = C.th ? TH_STEPS : STEPS;
      if (i >= L.length){ demo = null; draw(); return; }
      if (C.th){ act(L[i][0]); demo = setTimeout(function(){ runDemo(i + 1); }, L[i][1] / speed); return; }
      act(L[i]); demo = setTimeout(function(){ runDemo(i + 1); }, 3400 / speed);
    }
    dB.addEventListener('click', function(){
      if (demo){ stopDemo(); return; }
      S.es = S.d1 = S.d2 = S.L = S.R = S.out = S.outD = false; S.armed = true; S.tk++; S.msg = ''; demo = setTimeout(function(){ runDemo(0); }, 600 / speed); draw();
    });
    draw();
  }

  function css(){ if (!document.getElementById('lx-css')){ var st = document.createElement('style'); st.id = 'lx-css'; st.textContent = CSS; document.head.appendChild(st); } }
  function boot(){ css(); document.querySelectorAll('.live-ex[data-dev]').forEach(Live); }
  window.LiveEx = function(host){ css(); Live(host); };
  /* أطراف الجهاز كاملة (للمحاكي): الصفوف الحقيقية + البريدجات */
  window.LiveTerms = function(dev, o){ var C = CFG[dev]; if (!C) return ''; if (o && o.br) C = Object.assign({}, C, { br:o.br });
    var P = layout(C), U = usedSet(C), y0 = GY1 - 22, h = GY2 - GY1 + 44;
    return '<svg viewBox="20 ' + y0 + ' 340 ' + h + '" role="img" aria-label="أطراف ' + C.name + ' كاملة" style="display:block;width:100%;max-width:520px;margin:0 auto;direction:ltr;color:var(--ink,#1c2329)"><g font-family="IBM Plex Mono,monospace" fill="currentColor">' + boxSvg(C, P, U, null, dev) + bridgesSvg(C, P) + termsSvg(C, P, U) + '</g></svg>'; };   // المحاكي بيعيد الرسم لما تغيّر الجهاز
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
