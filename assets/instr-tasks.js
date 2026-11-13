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
      {id:'loop', task:'loop', goal:T('اجعل الكنترولر يوصل الماء إلى حرارة جديدة وحده.', 'Let the controller bring the water to a new temperature by itself.'),
        steps:[
          [T('حرّك منزلق «الـ SP المطلوب» 10 درجات أو أكثر (مثلًا إلى 70).', 'Move the «SP» slider by 10 degrees or more (e.g. to 70).'), function(){ var s = S('LOOP'); return Math.abs(s.sp - s.sp0) >= 10; }],
          [T('اترك الكنترولر على AUTO (إذا حوّلته إلى Manual فأعده).', 'Keep the controller on AUTO (switch back if you chose Manual).'), function(){ var s = S('LOOP'); return Math.abs(s.sp - s.sp0) >= 10 && s.auto; }],
          [T('انتظر وراقب الرسم: يرتفع الـ PV حتى يستقر عند الـ SP.', 'Wait and watch the chart: PV climbs until it settles on SP.'), null]],
        end:T('يفتح الكنترولر صمّام البخار وحده، ويغلقه عندما تصل الحرارة.', 'The controller opens the steam valve by itself and closes it as the temperature arrives.')},
      {id:'tags', task:'tags', goal:T('اعرف معنى كل تاج.', 'Say what each tag means.'),
        how:T('الحرف الأول = ماذا يقيس: T حرارة، P ضغط، F تدفق، L مستوى. والحروف التالية = ماذا يفعل: T ترانسميتر، I يعرض، C كنترولر، V صمّام.', 'First letter = what it measures: T temperature, P pressure, F flow, L level. Next letters = what it does: T transmitter, I indicator, C controller, V valve.')}
    ],
    l2: [
      {id:'drill', task:'scale', goal:T('حوّل بين الـ mA والقيمة الحقيقية.', 'Convert between mA and the real value.'),
        how:T('القيمة = بداية المدى + (الـ mA − 4) ÷ 16 × المدى كله. والعكس: mA = 4 + 16 × (القيمة − بداية المدى) ÷ المدى.', 'Value = range start + (mA − 4) ÷ 16 × span. Back: mA = 4 + 16 × (value − range start) ÷ span.')},
      {id:'sim', task:'sim', goal:T('أحدث 3 أعطال في اللوب، ولاحظ ماذا يقول التيار والـ PLC في كلٍّ منها.', 'Make 3 faults in the loop and see what the current and the PLC say each time.'),
        steps:[
          [T('اضغط «اقطع سلكًا» وراقب الـ mA والـ PLC، ثم اضغطه مرة أخرى لتعيده.', 'Press «Cut a wire», read the mA and the PLC, then press it again to undo.'), function(){ return seen('SIM', 'cut'); }],
          [T('اضغط «قصر في الكابل» وراقب القراءة، ثم أعده.', 'Press «Short in the cable», read it, undo.'), function(){ return seen('SIM', 'short'); }],
          [T('اضغط «اعكس القطبية» وراقب القراءة، ثم أعده.', 'Press «Reverse polarity», read it, undo.'), function(){ return seen('SIM', 'rev'); }]],
        end:T('كل عطل يعطي قراءة مختلفة على الأفوميتر وكارت الـ PLC، فتعرف العطل من القراءة.', 'Each fault gives a different reading on the meter and the PLC card, so the reading tells you the fault.')}
    ],
    l3: [
      {id:'bench', task:function(){ var s = S('DI'); return s.ex === 1 ? 'npn' : 'pnp'; }, dyn:function(){
        var npn = S('DI').ex === 1, com = npn ? '+24V' : '0V';
        var w = function(a, b){ return function(){ return (S('DI').wires || []).some(function(x){ return (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a); }); }; };
        return {goal:T('وصّل حساس ' + (npn ? 'NPN' : 'PNP') + ' بكارت دخل الـ PLC.', 'Wire the ' + (npn ? 'NPN' : 'PNP') + ' sensor to the PLC input card.'),
          steps:[
            [T('اضغط على BN (البني) ثم على +24V.', 'Tap BN (brown), then +24V.'), w('BN', 'P')],
            [T('اضغط على BU (الأزرق) ثم على 0V.', 'Tap BU (blue), then 0V.'), w('BU', 'N')],
            [T('اضغط على BK (الأسود) ثم على I0.0.', 'Tap BK (black), then I0.0.'), w('BK', 'I0')],
            [T('اضغط على COM الكارت ثم على ' + com + '.', 'Tap the card COM, then ' + com + '.'), w('COM', npn ? 'P' : 'N')],
            [T('اضغط «اختبر التوصيل».', 'Press «Check wiring».'), null],
            [T('قرّب القطعة المعدنية بمنزلق المسافة ولاحظ إضاءة مصباح I0.0.', 'Bring the metal close with the distance slider and watch the I0.0 LED light.'), null]],
          end:T('عندما يستشعر الحساس، يضيء الدخل I0.0 في الكارت.', 'When the sensor detects, input I0.0 lights on the card.')}; }}
    ],
    l4: [
      {id:'enc', task:'enc', goal:T('أدِر الإنكودر في الاتجاهين، ولاحظ العدّاد في x1 وx4.', 'Turn the encoder both ways and watch the counter in x1 and x4.'),
        steps:[
          [T('اضغط «↻ مع عقارب الساعة CW» واتركه يدور قليلًا.', 'Press «↻ CW» and let it turn a bit.'), function(){ return seen('ENC', 'cw'); }],
          [T('اضغط «↺ عكس عقارب الساعة CCW»: العدّاد ينقص.', 'Press «↺ CCW»: the counter goes down.'), function(){ return seen('ENC', 'ccw'); }],
          [T('اختر x1 ولاحظ كم يعدّ العدّاد.', 'Pick x1 and see how fast it counts.'), function(){ return seen('ENC', 'x1'); }],
          [T('اختر x4: اللفة نفسها، والعدّاد يعدّ 4 أضعاف.', 'Pick x4: same turn, 4 times the counts.'), function(){ return seen('ENC', 'x4'); }]],
        end:T('A تسبق B = CW، وB تسبق A = CCW.', 'A leads B = CW, B leads A = CCW.')},
      {id:'drill', task:'edrill', goal:T('أجب عن أسئلة الاتجاه والتردد والعدّ.', 'Answer the direction, frequency and count questions.'),
        how:T('التردد (Hz) = PPR × rpm ÷ 60. عدد اللفات = العدّ ÷ (PPR × x1 أو x2 أو x4). A تسبق B = CW.', 'Frequency (Hz) = PPR × rpm ÷ 60. Turns = counts ÷ (PPR × x1, x2 or x4). A leads B = CW.')}
    ],
    l5: [
      {id:'gray', task:'gray', goal:T('اعرف لماذا الـ Gray code أكثر أمانًا من الـ Binary.', 'See why Gray code is safer than Binary.'),
        steps:[
          [T('اضغط «خطوة للأمام ▶» 16 مرة (لفة كاملة للقرص).', 'Press «Step forward ▶» 16 times (one full turn).'), function(){ return (S('GRAY').steps || 0) >= 16; }],
          [T('اختر «Binary عادي» واضغط «اعرض لحظة الانتقال».', 'Pick «Plain binary» and press «Show the transition».'), function(){ var s = S('GRAY'); return s.sawTr || (s.code === 'bin' && s.tr); }],
          [T('تقدّم خطوة خطوة حتى خطوة يتغيّر فيها أكثر من بت (مثل 7 ← 8).', 'Step until more than one bit changes (like 7 → 8).'), function(){ return !!S('GRAY').sawTr; }]],
        end:T('في Binary قد تُقرأ أرقام خطأ لحظة الانتقال. وفي Gray يتغيّر بت واحد فقط.', 'In binary, wrong numbers can be read at the transition. In Gray only one bit changes.')},
      {id:'game', task:'efault', goal:T('اعرف سبب عطل الإنكودر في كل حالة.', 'Find the encoder fault in each case.'),
        how:T('اقرأ الحالة، واضغط «افحص» لترى القراءات، ثم اختر السبب.', 'Read the case, press «Check» to see the readings, then pick the cause.')}
    ],
    l6: [
      {id:'bench', task:'tc', goal:T('أحدث 3 أخطاء مشهورة في الثيرموكبل، ولاحظ كم درجة يخطئ الجهاز.', 'Make 3 classic thermocouple mistakes and see how many degrees the indicator is off.'),
        steps:[
          [T('اضغط «أوقف الـ CJC» وراقب خانة «الخطأ». ثم اضغطه مرة أخرى لتعيده.', 'Press «CJC off» and look at «Error». Press again to undo.'), function(){ return seen('TC', 'cjc'); }],
          [T('اضغط «كابل نحاس عادي بدل كابل التعويض» وراقب «الخطأ»، ثم أعده.', 'Press «Plain copper cable» and look at «Error», then undo.'), function(){ return seen('TC', 'cu'); }],
          [T('اضغط «اعكس القطبية» وسخّن الفرن من المنزلق: تنخفض القراءة بدل أن ترتفع.', 'Press «Reverse polarity» and heat the furnace: the reading goes down instead of up.'), function(){ return seen('TC', 'rev'); }]],
        end:T('عندما يكون كل شيء دقيقًا، يكون «الخطأ» 0.0 °C.', 'When all is right, «Error» is 0.0 °C.')},
      {id:'drill', task:'tcdrill', goal:T('احسب حرارة الفرن من الـ mV.', 'Work out the furnace temperature from the mV.'),
        how:T('خذ mV الطرف البارد من الجدول (حرارة الأطراف)، وأضفه إلى الـ mV المقروء، ثم ابحث عن المجموع في الجدول.', 'Take the cold-junction mV from the table (terminal temperature), add it to the reading, then look the sum up in the table.')}
    ],
    l7: [
      {id:'bench', task:'rtd', goal:T('لاحظ كم يُخطئ طول الكابل قراءة الـ PT100 في 2 و3 و4 أسلاك.', 'See how much the cable throws off a PT100 in 2, 3 and 4 wire.'),
        steps:[
          [T('اختر «2 سلك» وراقب الخطأ.', 'Pick «2 wire» and look at the error.'), function(){ return seen('RTD', '2'); }],
          [T('اختر «3 سلك»: يقلّ الخطأ.', 'Pick «3 wire»: the error drops.'), function(){ return seen('RTD', '3'); }],
          [T('وأنت على 3 سلك اضغط «ترمنال مرتخٍ»: يعود الخطأ.', 'On 3 wire, press «Loose terminal»: the error comes back.'), function(){ return seen('RTD', '3L'); }],
          [T('اختر «4 سلك»: لا خطأ تقريبًا.', 'Pick «4 wire»: almost no error.'), function(){ return seen('RTD', '4'); }]],
        end:T('كلما طال السلك، قرأ توصيل السلكين أعلى من الحقيقة.', 'The longer the cable, the higher 2 wire reads.')},
      {id:'drill', task:'ptdrill', goal:T('حوّل بين الأوم والحرارة في الـ PT100.', 'Convert between ohms and temperature for a PT100.'),
        how:T('PT100 = 100 Ω عند 0 °C، وكل درجة تزيد نحو 0.38 Ω. أي إن الحرارة ≈ (المقاومة − 100) ÷ 0.38. والـ PT1000 = عشرة أضعاف.', 'PT100 = 100 Ω at 0 °C, about +0.38 Ω per degree. So temperature ≈ (R − 100) ÷ 0.38. PT1000 = ten times that.')}
    ],
    l8: [
      {id:'bench', task:'lc', goal:T('حمّل اللود سيل ولاحظ الـ mV، وقارن كابل 4 أسلاك بكابل 6 أسلاك.', 'Load the cell, read the mV, and compare 4-wire with 6-wire cable.'),
        steps:[
          [T('اضغط أزرار الأوزان حتى يصبح الحمل بين 400 و500 kg، وراقب الـ mV.', 'Add weights until the load is 400–500 kg and read the mV.'), function(){ return seen('LC', 'full'); }],
          [T('اختر «كابل 4 أسلاك» وحرّك «حرارة الكابل» إلى 50 °C: يخطئ الوزن.', 'Pick «4-wire cable» and set «Cable temperature» to 50 °C: the weight drifts.'), function(){ return seen('LC', 'w4'); }],
          [T('اختر «كابل 6 أسلاك (Sense)» واترك حرارة الكابل 50 °C: يعود الوزن صحيحًا.', 'Pick «6-wire (Sense)» at 50 °C: the weight is right again.'), function(){ return seen('LC', 'w6'); }]],
        end:T('الـ 6 أسلاك يقيس الجهد عند الخلية نفسها، فلا تؤثر حرارة الكابل.', 'Six-wire senses the voltage at the cell, so cable temperature does not matter.')},
      {id:'cal', task:'cal', goal:T('عاير الميزان الجديد ليقرأ صحيحًا.', 'Calibrate the new scale so it reads right.'),
        steps:[[T('اتبع الخطوات بجانب الرسمة بالترتيب. كل خطوة تضيء عند اكتمالها.', 'Follow the steps next to the drawing in order. Each one lights when done.'), null]],
        end:T('تقرأ الشاشة الوزن الذي وضعته تمامًا.', 'The display reads exactly the weight you put on.')},
      {id:'diag', task:'lcdiag', goal:T('اعرف ما في كل خلية من الخمس بالأفوميتر.', 'Find what is wrong with each of the five cells using the meter.'),
        steps:[
          [T('اختر خلية (خلية 1 … 5).', 'Pick a cell (cell 1 … 5).'), null],
          [T('اضغط على طرف للمجس الأحمر وطرف للأسود، وقارن القراءة بالقيم المفترضة في الصندوق.', 'Tap a terminal for the red probe and one for the black, and compare with the expected values in the box.'), null],
          [T('اختر العطل من الأزرار. شخّص 4 خلايا صحيحًا.', 'Pick the fault from the buttons. Diagnose 4 cells right.'), function(){ return (S('LD') && window.LD && window.LD.cells || []).filter(function(c){ return c.solved; }).length >= 4; }]]}
    ],
    l9: [
      {id:'tank', task:'lvl', goal:T('اعرف متى يخطئ ترانسميتر المستوى بالضغط، وكيف تصلحه.', 'See when a pressure level transmitter goes wrong, and how to fix it.'),
        steps:[
          [T('من «السائل في الخزان» اختر سولار أو حمض، واجعل المستوى عاليًا: تخطئ القراءة.', 'From «Liquid in the tank» pick diesel or acid and keep the level high: the reading goes wrong.'), function(){ return seen('LVL', 'rho'); }],
          [T('اضغط «خزان مغلق عليه ضغط 0.2 bar»: يقرأ الترانسميتر العادي زيادة.', 'Press «Closed tank at 0.2 bar»: the plain transmitter reads high.'), function(){ return seen('LVL', 'cg'); }],
          [T('اضغط «استخدم ترانسميتر DP»: تعود القراءة صحيحة.', 'Press «Use a DP transmitter»: the reading is right again.'), function(){ return seen('LVL', 'cdp'); }]],
        end:T('الترانسميتر يقيس الضغط، لذا يجب أن تكون كثافة السائل مضبوطة، والخزان المغلق يحتاج DP.', 'It measures pressure, so the density must be set right, and a closed tank needs DP.')},
      {id:'pick', task:'pick', goal:T('اختر الجهاز الصحيح لكل مكان.', 'Pick the right instrument for each job.'),
        how:T('انظر إلى السائل (ماء، زيت، بخار، مادة أكّالة) وإلى المكان، واختر الجهاز المناسب لهما.', 'Look at the fluid (water, oil, steam, corrosive) and the place, and pick the instrument that fits both.')}
    ],
    l10: [
      {id:'cal', task:'caltab', goal:T('عاير ترانسميتر ضغط على 5 نقاط كما يُفعل في الموقع.', 'Calibrate a pressure transmitter at 5 points, as on site.'),
        steps:[
          [T('اضغط النقاط الخمس (0 و25 و50 و75 و100 %) لتسجّل القراءة قبل أي ضبط (As-found).', 'Press all five points (0, 25, 50, 75, 100 %) to record the readings before any adjustment (As-found).'), function(){ return ['found'].indexOf(S('CAL').phase) < 0; }],
          [T('انظر إلى عمود الخطأ واحكم: Pass أم Fail.', 'Look at the error column and judge: Pass or Fail.'), function(){ return ['found', 'judge'].indexOf(S('CAL').phase) < 0; }],
          [T('اضغط 0 % ثم «Zero trim»، واضغط 100 % ثم «Span trim».', 'Press 0 % then «Zero trim», press 100 % then «Span trim».'), function(){ return ['found', 'judge', 'adjust'].indexOf(S('CAL').phase) < 0; }],
          [T('اضغط النقاط الخمس مرة أخرى: يجب أن تخرج كلها Pass (As-left).', 'Press the five points again: all must Pass (As-left).'), function(){ return S('CAL').phase === 'done'; }]],
        end:T('جدول As-found وAs-left كامل، مثل تقرير المعايرة الحقيقي.', 'A full As-found / As-left table, like a real calibration report.')},
      {id:'game', task:'fgame', goal:T('اعرف سبب العطل في كل حالة من الموقع.', 'Find the cause of each field fault.'),
        how:T('اقرأ الحالة، واضغط «افحص» لترى القراءات، ثم اختر السبب.', 'Read the case, press «Check» to see the readings, then pick the cause.')}
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
          (sp.how ? '<p class="tk-h">💡 <b>' + T('كيف تحلّها:', 'How to solve it:') + '</b> ' + sp.how + '</p>' : '') +
          (d.end ? '<p class="tk-e">👀 <b>' + T('ستلاحظ:', 'You will see:') + '</b> ' + d.end + '</p>' : '') +
          '<p class="tk-d" hidden>✓ ' + T('أنهيت هذا التمرين', 'Exercise done') + '</p>';
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
