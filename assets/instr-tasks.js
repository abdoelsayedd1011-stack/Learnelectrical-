/* «المطلوب» على كل تمرين في كورس الإنسترومنتيشن (عربي + إنجليزي).
   فوق كل تمرين: سطر المطلوب، وخطوات بالترتيب كل واحدة بتتعلّم ✓ لوحدها لما الطالب يعملها، والخطوة الحالية منوّرة،
   وسطر «هتشوف إيه». الخطوات بتقرا حالة التمرين من الأوبجكت اللي الصفحة بتحطه في window (LOOP و TC و RTD …).
   بيتحمّل من آخر instr.js. صاحب التمرين الحقيقي (IL.mark) زي ما هو: الصندوق ده شرح بس. */
(function(){
  'use strict';
  if (window.ILTasks || !window.IL) return;
  var EN = /^\/en\//.test(location.pathname);
  var T = function(ar, en){ return EN ? en : ar; };
  var m = /lesson-(\d+)\.html/.exec(location.pathname); if (!m) return;
  var L = 'l' + (+m[1]);
  var has = function(task){ return IL.has(L, task); };
  var S = function(name){ var o = window[name]; return (o && o.S) || {}; };
  var seen = function(name, k){ var s = S(name).seen; return !!(s && (s.has ? s.has(k) : s[k])); };

  /* each: host id, task id, goal, steps [[text, check()]], end (what you will see), how (how to solve: for question drills) */
  var SPEC = {
    l1: [
      {id:'loop', task:'loop', goal:T('خلّي الكنترولر يوصّل الميّة لحرارة جديدة لوحده.', 'Let the controller bring the water to a new temperature by itself.'),
        steps:[
          [T('حرّك سلايدر «SP المطلوب» 10 درجات أو أكتر (مثلًا لـ 70).', 'Move the «SP» slider by 10 degrees or more (e.g. to 70).'), function(){ var s = S('LOOP'); return Math.abs(s.sp - s.sp0) >= 10; }],
          [T('سيب الكنترولر على AUTO (لو حوّلته Manual رجّعه).', 'Keep the controller on AUTO (switch back if you chose Manual).'), function(){ var s = S('LOOP'); return Math.abs(s.sp - s.sp0) >= 10 && s.auto; }],
          [T('استنى وبص على الرسم: الـ PV بيطلع لحد ما يقف على الـ SP.', 'Wait and watch the chart: PV climbs until it settles on SP.'), null]],
        end:T('الكنترولر بيفتح صمّام البخار لوحده، ويقفّله لما الحرارة توصل.', 'The controller opens the steam valve by itself and closes it as the temperature arrives.')},
      {id:'tags', task:'tags', goal:T('اعرف كل تاج معناه إيه.', 'Say what each tag means.'),
        how:T('الحرف الأول = بيقيس إيه: T حرارة، P ضغط، F فلو، L مستوى. الحروف اللي بعده = بيعمل إيه: T ترانسميتر، I بيعرض، C كنترولر، V صمّام.', 'First letter = what it measures: T temperature, P pressure, F flow, L level. Next letters = what it does: T transmitter, I indicator, C controller, V valve.')}
    ],
    l2: [
      {id:'drill', task:'scale', goal:T('حوّل بين الـ mA والقيمة الحقيقية.', 'Convert between mA and the real value.'),
        how:T('القيمة = أول الرينج + (الـ mA − 4) ÷ 16 × الرينج كله. والعكس: mA = 4 + 16 × (القيمة − أول الرينج) ÷ الرينج.', 'Value = range start + (mA − 4) ÷ 16 × span. Back: mA = 4 + 16 × (value − range start) ÷ span.')},
      {id:'sim', task:'sim', goal:T('اعمل 3 أعطال في اللوب، وشوف التيار والـ PLC بيقولوا إيه في كل واحد.', 'Make 3 faults in the loop and see what the current and the PLC say each time.'),
        steps:[
          [T('دوس «اقطع سلك» وبص على الـ mA والـ PLC، وبعدين دوس عليه تاني عشان ترجّعه.', 'Press «Cut a wire», read the mA and the PLC, then press it again to undo.'), function(){ return seen('SIM', 'cut'); }],
          [T('دوس «قصر في الكابل» وبص على القراية، ورجّعه.', 'Press «Short in the cable», read it, undo.'), function(){ return seen('SIM', 'short'); }],
          [T('دوس «اعكس القطبية» وبص على القراية، ورجّعه.', 'Press «Reverse polarity», read it, undo.'), function(){ return seen('SIM', 'rev'); }]],
        end:T('كل عطل بيدّي قراية مختلفة على الأفوميتر وكارت الـ PLC، فتعرف العطل من القراية.', 'Each fault gives a different reading on the meter and the PLC card, so the reading tells you the fault.')}
    ],
    l3: [
      {id:'bench', task:function(){ var s = S('DI'); return s.ex === 1 ? 'npn' : 'pnp'; }, dyn:function(){
        var npn = S('DI').ex === 1, com = npn ? '+24V' : '0V';
        var w = function(a, b){ return function(){ return (S('DI').wires || []).some(function(x){ return (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a); }); }; };
        return {goal:T('وصّل حساس ' + (npn ? 'NPN' : 'PNP') + ' بكارت دخل الـ PLC.', 'Wire the ' + (npn ? 'NPN' : 'PNP') + ' sensor to the PLC input card.'),
          steps:[
            [T('دوس على BN (البني) وبعدين على +24V.', 'Tap BN (brown), then +24V.'), w('BN', 'P')],
            [T('دوس على BU (الأزرق) وبعدين على 0V.', 'Tap BU (blue), then 0V.'), w('BU', 'N')],
            [T('دوس على BK (الأسود) وبعدين على I0.0.', 'Tap BK (black), then I0.0.'), w('BK', 'I0')],
            [T('دوس على COM بتاع الكارت وبعدين على ' + com + '.', 'Tap the card COM, then ' + com + '.'), w('COM', npn ? 'P' : 'N')],
            [T('دوس «اختبر التوصيل».', 'Press «Check wiring».'), null],
            [T('قرّب الحديدة بسلايدر المسافة وشوف لمبة I0.0 بتنوّر.', 'Bring the metal close with the distance slider and watch the I0.0 LED light.'), null]],
          end:T('لما الحساس يحس، الدخل I0.0 بينوّر في الكارت.', 'When the sensor detects, input I0.0 lights on the card.')}; }}
    ],
    l4: [
      {id:'enc', task:'enc', goal:T('لِف الإنكودر في الاتجاهين، وشوف العدّاد في x1 و x4.', 'Turn the encoder both ways and watch the counter in x1 and x4.'),
        steps:[
          [T('دوس «↻ مع عقارب الساعة CW» وسيبه يلف شوية.', 'Press «↻ CW» and let it turn a bit.'), function(){ return seen('ENC', 'cw'); }],
          [T('دوس «↺ عكس عقارب الساعة CCW»: العدّاد بينقص.', 'Press «↺ CCW»: the counter goes down.'), function(){ return seen('ENC', 'ccw'); }],
          [T('اختار x1 وبص العدّاد بيعدّ قد إيه.', 'Pick x1 and see how fast it counts.'), function(){ return seen('ENC', 'x1'); }],
          [T('اختار x4: نفس اللفة، العدّاد بيعدّ 4 أضعاف.', 'Pick x4: same turn, 4 times the counts.'), function(){ return seen('ENC', 'x4'); }]],
        end:T('A سابقة B = CW، و B سابقة A = CCW.', 'A leads B = CW, B leads A = CCW.')},
      {id:'drill', task:'edrill', goal:T('جاوب أسئلة الاتجاه والتردد والعدّ.', 'Answer the direction, frequency and count questions.'),
        how:T('التردد (Hz) = PPR × rpm ÷ 60. عدد اللفات = العدّ ÷ (PPR × x1 أو x2 أو x4). A سابقة B = CW.', 'Frequency (Hz) = PPR × rpm ÷ 60. Turns = counts ÷ (PPR × x1, x2 or x4). A leads B = CW.')}
    ],
    l5: [
      {id:'gray', task:'gray', goal:T('اعرف ليه الـ Gray code أأمن من الـ Binary.', 'See why Gray code is safer than Binary.'),
        steps:[
          [T('دوس «خطوة لقدّام ▶» 16 مرة (لفة كاملة للقرص).', 'Press «Step forward ▶» 16 times (one full turn).'), function(){ return (S('GRAY').steps || 0) >= 16; }],
          [T('اختار «Binary عادي» ودوس «شوف لحظة الانتقال».', 'Pick «Plain binary» and press «Show the transition».'), function(){ var s = S('GRAY'); return s.sawTr || (s.code === 'bin' && s.tr); }],
          [T('امشي خطوة خطوة لحد خطوة بيتغيّر فيها أكتر من بت (زي 7 ← 8).', 'Step until more than one bit changes (like 7 → 8).'), function(){ return !!S('GRAY').sawTr; }]],
        end:T('في Binary ممكن تتقري أرقام غلط لحظة الانتقال. في Gray بيتغيّر بت واحد بس.', 'In binary, wrong numbers can be read at the transition. In Gray only one bit changes.')},
      {id:'game', task:'efault', goal:T('اعرف سبب عطل الإنكودر في كل حالة.', 'Find the encoder fault in each case.'),
        how:T('اقرا الحالة، ودوس «افحص» عشان تشوف القرايات، وبعدين اختار السبب.', 'Read the case, press «Check» to see the readings, then pick the cause.')}
    ],
    l6: [
      {id:'bench', task:'tc', goal:T('اعمل 3 غلطات مشهورة في الثيرموكبل، وشوف الجهاز بيغلط كام درجة.', 'Make 3 classic thermocouple mistakes and see how many degrees the indicator is off.'),
        steps:[
          [T('دوس «اقفل الـ CJC» وبص على خانة «الغلط». وبعدين دوس تاني عشان ترجّعه.', 'Press «CJC off» and look at «Error». Press again to undo.'), function(){ return seen('TC', 'cjc'); }],
          [T('دوس «كابل نحاس عادي بدل كابل التعويض» وبص على «الغلط»، ورجّعه.', 'Press «Plain copper cable» and look at «Error», then undo.'), function(){ return seen('TC', 'cu'); }],
          [T('دوس «اعكس القطبية» وسخّن الفرن من السلايدر: القراية بتنزل بدل ما تطلع.', 'Press «Reverse polarity» and heat the furnace: the reading goes down instead of up.'), function(){ return seen('TC', 'rev'); }]],
        end:T('لما كله مظبوط، «الغلط» بيبقى 0.0 °C.', 'When all is right, «Error» is 0.0 °C.')},
      {id:'drill', task:'tcdrill', goal:T('احسب حرارة الفرن من الـ mV.', 'Work out the furnace temperature from the mV.'),
        how:T('خد mV الطرف البارد من الجدول (حرارة الأطراف)، وضيفه على الـ mV المقروء، وبعدين دوّر على المجموع في الجدول.', 'Take the cold-junction mV from the table (terminal temperature), add it to the reading, then look the sum up in the table.')}
    ],
    l7: [
      {id:'bench', task:'rtd', goal:T('شوف طول الكابل بيغلّط الـ PT100 قد إيه في 2 و 3 و 4 سلك.', 'See how much the cable throws off a PT100 in 2, 3 and 4 wire.'),
        steps:[
          [T('اختار «2 سلك» وبص على الغلط.', 'Pick «2 wire» and look at the error.'), function(){ return seen('RTD', '2'); }],
          [T('اختار «3 سلك»: الغلط بيقل.', 'Pick «3 wire»: the error drops.'), function(){ return seen('RTD', '3'); }],
          [T('وانت على 3 سلك دوس «ترمنال مرتخي»: الغلط بيرجع.', 'On 3 wire, press «Loose terminal»: the error comes back.'), function(){ return seen('RTD', '3L'); }],
          [T('اختار «4 سلك»: مفيش غلط تقريبًا.', 'Pick «4 wire»: almost no error.'), function(){ return seen('RTD', '4'); }]],
        end:T('كل ما السلك يطول، 2 سلك بيقرا أعلى من الحقيقة.', 'The longer the cable, the higher 2 wire reads.')},
      {id:'drill', task:'ptdrill', goal:T('حوّل بين الأوم والحرارة في الـ PT100.', 'Convert between ohms and temperature for a PT100.'),
        how:T('PT100 = 100 Ω على 0 °C، وكل درجة بتزوّد حوالي 0.38 Ω. يعني الحرارة ≈ (المقاومة − 100) ÷ 0.38. الـ PT1000 = عشرة أضعاف.', 'PT100 = 100 Ω at 0 °C, about +0.38 Ω per degree. So temperature ≈ (R − 100) ÷ 0.38. PT1000 = ten times that.')}
    ],
    l8: [
      {id:'bench', task:'lc', goal:T('حمّل اللود سيل وشوف الـ mV، وقارن كابل 4 سلك بـ 6 سلك.', 'Load the cell, read the mV, and compare 4-wire with 6-wire cable.'),
        steps:[
          [T('دوس أزرار الأوزان لحد ما الحمل يبقى بين 400 و 500 kg، وبص على الـ mV.', 'Add weights until the load is 400–500 kg and read the mV.'), function(){ return seen('LC', 'full'); }],
          [T('اختار «كابل 4 سلك» وحرّك «حرارة الكابل» لـ 50 °C: الوزن بيغلط.', 'Pick «4-wire cable» and set «Cable temperature» to 50 °C: the weight drifts.'), function(){ return seen('LC', 'w4'); }],
          [T('اختار «كابل 6 سلك (Sense)» وخلّي حرارة الكابل 50 °C: الوزن بيرجع صح.', 'Pick «6-wire (Sense)» at 50 °C: the weight is right again.'), function(){ return seen('LC', 'w6'); }]],
        end:T('الـ 6 سلك بيقيس الجهد عند الخلية نفسها، فحرارة الكابل مابتأثرش.', 'Six-wire senses the voltage at the cell, so cable temperature does not matter.')},
      {id:'cal', task:'cal', goal:T('اعمل معايرة للميزان الجديد عشان يقرا صح.', 'Calibrate the new scale so it reads right.'),
        steps:[[T('اتبع الخطوات اللي جنب الرسمة بالترتيب. كل خطوة بتنوّر لما تخلص.', 'Follow the steps next to the drawing in order. Each one lights when done.'), null]],
        end:T('الشاشة بتقرا الوزن اللي حطّيته بالظبط.', 'The display reads exactly the weight you put on.')},
      {id:'diag', task:'lcdiag', goal:T('اعرف كل خلية من الخمسة فيها إيه بالأفوميتر.', 'Find what is wrong with each of the five cells using the meter.'),
        steps:[
          [T('اختار خلية (خلية 1 … 5).', 'Pick a cell (cell 1 … 5).'), null],
          [T('دوس على طرف للمجس الأحمر وطرف للأسود، وقارن القراية بالقيم المفروضة اللي في الصندوق.', 'Tap a terminal for the red probe and one for the black, and compare with the expected values in the box.'), null],
          [T('اختار العطل من الزراير. شخّص 4 خلايا صح.', 'Pick the fault from the buttons. Diagnose 4 cells right.'), function(){ return (S('LD') && window.LD && window.LD.cells || []).filter(function(c){ return c.solved; }).length >= 4; }]]}
    ],
    l9: [
      {id:'tank', task:'lvl', goal:T('شوف إمتى ترانسميتر المستوى بالضغط بيغلط، وإزاي تصلّحه.', 'See when a pressure level transmitter goes wrong, and how to fix it.'),
        steps:[
          [T('من «السايل في التانك» اختار سولار أو حمض، وخلّي المستوى عالي: القراية بتغلط.', 'From «Liquid in the tank» pick diesel or acid and keep the level high: the reading goes wrong.'), function(){ return seen('LVL', 'rho'); }],
          [T('دوس «تانك مقفول عليه ضغط 0.2 bar»: الترانسميتر العادي بيقرا زيادة.', 'Press «Closed tank at 0.2 bar»: the plain transmitter reads high.'), function(){ return seen('LVL', 'cg'); }],
          [T('دوس «استخدم ترانسميتر DP»: القراية بترجع صح.', 'Press «Use a DP transmitter»: the reading is right again.'), function(){ return seen('LVL', 'cdp'); }]],
        end:T('الترانسميتر بيقيس ضغط، فلازم كثافة السايل تبقى مظبوطة، والتانك المقفول محتاج DP.', 'It measures pressure, so the density must be set right, and a closed tank needs DP.')},
      {id:'pick', task:'pick', goal:T('اختار الجهاز الصح لكل مكان.', 'Pick the right instrument for each job.'),
        how:T('بص على السايل (ميّة، زيت، بخار، حاجة بتآكل) وعلى المكان، واختار الجهاز اللي يناسبهم.', 'Look at the fluid (water, oil, steam, corrosive) and the place, and pick the instrument that fits both.')}
    ],
    l10: [
      {id:'cal', task:'caltab', goal:T('عاير ترانسميتر ضغط على 5 نقط زي ما بيتعمل في الموقع.', 'Calibrate a pressure transmitter at 5 points, as on site.'),
        steps:[
          [T('دوس على النقط الخمسة (0 و 25 و 50 و 75 و 100 %) عشان تسجّل القراية قبل أي ظبط (As-found).', 'Press all five points (0, 25, 50, 75, 100 %) to record the readings before any adjustment (As-found).'), function(){ return ['found'].indexOf(S('CAL').phase) < 0; }],
          [T('بص على عمود الغلط واحكم: Pass ولا Fail.', 'Look at the error column and judge: Pass or Fail.'), function(){ return ['found', 'judge'].indexOf(S('CAL').phase) < 0; }],
          [T('دوس 0 % وبعدين «Zero trim»، ودوس 100 % وبعدين «Span trim».', 'Press 0 % then «Zero trim», press 100 % then «Span trim».'), function(){ return ['found', 'judge', 'adjust'].indexOf(S('CAL').phase) < 0; }],
          [T('دوس النقط الخمسة تاني: كلها لازم تطلع Pass (As-left).', 'Press the five points again: all must Pass (As-left).'), function(){ return S('CAL').phase === 'done'; }]],
        end:T('جدول As-found و As-left كامل، زي تقرير المعايرة الحقيقي.', 'A full As-found / As-left table, like a real calibration report.')},
      {id:'game', task:'fgame', goal:T('اعرف سبب العطل في كل حالة من الموقع.', 'Find the cause of each field fault.'),
        how:T('اقرا الحالة، ودوس «افحص» عشان تشوف القرايات، وبعدين اختار السبب.', 'Read the case, press «Check» to see the readings, then pick the cause.')}
    ]
  };

  var css = document.createElement('style');
  css.textContent = '.tk{border:1.5px solid var(--accent,#1f6feb);border-radius:12px;padding:10px 14px;margin:0 0 12px;background:var(--panel,#fff);line-height:1.8}' +
    '.tk.ok{border-color:var(--good,#2e9b3c)}.tk-g{margin:0 0 4px;font-weight:600}.tk-h{margin:4px 0 0}.tk-e{margin:6px 0 0;color:var(--muted,#55606a);font-size:.95rem}' +
    '.tk-s{margin:4px 0 0;padding-inline-start:0;list-style:none;counter-reset:tk}.tk-s li{counter-increment:tk;position:relative;padding-inline-start:30px;margin:4px 0}' +
    '.tk-s li::before{content:counter(tk);position:absolute;inset-inline-start:0;top:3px;width:22px;height:22px;border-radius:50%;background:var(--line,#d5dbe1);color:var(--ink,#17202a);font:700 .8rem/22px system-ui;text-align:center}' +
    '.tk-s li.cur{font-weight:700}.tk-s li.cur::before{background:var(--accent,#1f6feb);color:#fff}' +
    '.tk-s li.ok{color:var(--muted,#55606a)}.tk-s li.ok::before{content:"✓";background:var(--good,#2e9b3c);color:#fff}' +
    '.tk-d{margin:6px 0 0;color:var(--good,#2e9b3c);font-weight:700}' +
    '.has-tk .chal,.has-tk .di-task{display:none}';
  document.head.appendChild(css);

  function mount(sp){
    var host = document.getElementById(sp.id); if (!host || host.querySelector('.tk')) return;
    var box = document.createElement('div'); box.className = 'tk';
    host.insertBefore(box, host.firstChild); host.classList.add('has-tk');
    var sig = '';
    function upd(){
      var task = typeof sp.task === 'function' ? sp.task() : sp.task, d = sp.dyn ? sp.dyn() : sp, all = has(task);
      var key = task + '|' + d.goal;
      if (key !== sig){
        sig = key;
        box.innerHTML = '<p class="tk-g">🎯 <b>' + T('المطلوب:', 'Goal:') + '</b> ' + d.goal + '</p>' +
          (d.steps ? '<ol class="tk-s">' + d.steps.map(function(s){ return '<li>' + s[0] + '</li>'; }).join('') + '</ol>' : '') +
          (sp.how ? '<p class="tk-h">💡 <b>' + T('إزاي تحلّها:', 'How to solve it:') + '</b> ' + sp.how + '</p>' : '') +
          (d.end ? '<p class="tk-e">👀 <b>' + T('هتشوف:', 'You will see:') + '</b> ' + d.end + '</p>' : '') +
          '<p class="tk-d" hidden>✓ ' + T('خلصت التمرين ده', 'Exercise done') + '</p>';
      }
      var li = box.querySelectorAll('.tk-s li'), cur = -1;
      (d.steps || []).forEach(function(s, i){
        var ok = all; if (!ok && s[1]){ try { ok = !!s[1](); } catch (e){ ok = false; } }
        li[i].classList.toggle('ok', ok); li[i].classList.remove('cur'); if (!ok && cur < 0) cur = i;
      });
      if (cur > -1) li[cur].classList.add('cur');
      box.classList.toggle('ok', all); box.querySelector('.tk-d').hidden = !all;
    }
    upd(); setInterval(upd, 500);
  }
  function start(){ (SPEC[L] || []).forEach(mount); }
  window.ILTasks = {SPEC: SPEC};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
