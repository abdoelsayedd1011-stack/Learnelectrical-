"use strict";
"use strict";
/* ================= texts ================= */
const UI={
 title:{ar:'دوائر التحكم الكلاسيك',en:'Classic Control Circuits'},
 sub:{ar:'كورس تفاعلي: كل دائرة مرسومة بدائرة القوى بجانب دائرة التحكم. اضغط الأزرار وشاهد الجهد والتيار يتحركان، والكونتاكتات تفتح وتقفل، والموتور يدور. وفي وضع تتبع العطل قِس بالملتيميتر حتى تجد القطعة المعيبة.',en:'Interactive course: every circuit is drawn with the power circuit beside the control circuit. Press the buttons and watch voltage and current move, contacts open and close and the motor turn. In fault-finding mode, measure with the multimeter until you find the faulty part.'},
 power:{ar:'دائرة القوى',en:'Power circuit'}, control:{ar:'دائرة التحكم 230 فولت',en:'Control circuit 230 V'},
 lgLive:{ar:'عليه جهد',en:'Live'}, lgFlow:{ar:'يمر فيه تيار',en:'Current flowing'}, lgDead:{ar:'بدون جهد',en:'Dead'}, lgN:{ar:'النيوترال',en:'Neutral'}, lgTp:{ar:'الدوائر الصغيرة المرقمة = نقاط قياس',en:'Small numbered circles = test points'},
 mode:{ar:'الوضع',en:'Mode'}, free:{ar:'تشغيل حر',en:'Free run'}, trace:{ar:'تتبع عطل',en:'Fault finding'},
 station:{ar:'لوحة الأزرار',en:'Control station'}, holdHint:{ar:'اضغط مع الاستمرار',en:'press and hold'},
 latch:{ar:'تثبيت الضغط على الزر (مفيد أثناء القياس)',en:'Keep buttons pressed (handy while measuring)'},
 supplyBox:{ar:'التغذية والحماية',en:'Supply and protection'}, mains:{ar:'كهرباء الشبكة',en:'Mains supply'}, q1:{ar:'القاطع الرئيسي Q1',en:'Main breaker Q1'},
 on:{ar:'موصّل',en:'ON'}, off:{ar:'مفصول',en:'OFF'},
 load:{ar:'حمل الموتور',en:'Motor load'}, ir:{ar:'ضبط الأوفرلود F1',en:'Overload setting F1'}, irNote:{ar:'التيار المقنن للموتور 11 أمبير. اضبط الأوفرلود عليه.',en:'Motor rated current is 11 A. Set the overload to it.'},
 heat:{ar:'سخونة الأوفرلود',en:'Overload heat'}, olReset:{ar:'ريست الأوفرلود F1',en:'Reset overload F1'},
 cooling:{ar:'البايمتال لسه سخن، انتظر حتى يبرد ثم اضغط ريست.',en:'The bimetal is still hot. Wait for it to cool, then reset.'},
 faults:{ar:'أعطال للتجربة',en:'Faults to try'}, clear:{ar:'مسح الأعطال',en:'Clear faults'},
 traceTitle:{ar:'تتبع العطل',en:'Fault finding'},
 traceIntro:{ar:'في عطل مخفي في الدائرة. شغّل ولاحظ العَرَض، ثم قِس بالملتيميتر بين النقاط المرقمة. لما تعرف القطعة المعيبة اخترها واضغط تحقق.',en:'A hidden fault is in the circuit. Operate it and note the symptom, then measure between the numbered points. When you know the faulty part, pick it and press Check.'},
 suspect:{ar:'القطعة المعيبة في رأيك',en:'Your suspect part'}, check:{ar:'تحقق',en:'Check'}, newFault:{ar:'عطل جديد',en:'New fault'}, showAns:{ar:'اعرض الحل',en:'Show answer'},
 pick:{ar:'اختر قطعة…',en:'Pick a part…'},
 right:{ar:'صح! ',en:'Correct! '}, wrong:{ar:'ليست هي. قِس تاني: ابحث عن النقطة التي يختفي عندها الجهد.',en:'Not that one. Measure again: find the point where the voltage disappears.'},
 ansWas:{ar:'العطل كان: ',en:'The fault was: '},
 meter:{ar:'ملتيميتر  V~',en:'Multimeter  V~'}, meterClear:{ar:'شيل المجسات',en:'Remove probes'},
 meterHint:{ar:'اضغط نقطة قياس للمجس الأسود ثم نقطة للمجس الأحمر. القراءة 230 فولت بين نقطتين معناها أن بينهما شيئًا مفتوحًا (أو حِملًا).',en:'Click a test point for the black probe, then one for the red probe. Reading 230 V between two points means something open (or a load) is between them.'},
 tMotor:{ar:'الموتور M1',en:'Motor M1'}, tSpeed:{ar:'السرعة',en:'Speed'}, tCur:{ar:'التيار',en:'Current'}, tHeat:{ar:'سخونة F1',en:'F1 heat'}, tCtrl:{ar:'جهد التحكم',en:'Control voltage'},
 st_stop:{ar:'متوقف',en:'Stopped'}, st_start:{ar:'يقوم',en:'Starting'}, st_run:{ar:'يعمل',en:'Running'}, st_hum:{ar:'يزن، فاز ناقص',en:'Humming, phase lost'}, st_jam:{ar:'محشور ميكانيكيًا',en:'Mechanically jammed'}, st_trip:{ar:'فصل أوفرلود',en:'Overload tripped'}, st_coast:{ar:'يهدّي',en:'Coasting'},
 present:{ar:'موجود',en:'Present'}, absent:{ar:'مقطوع',en:'Absent'},
 steps:{ar:'تسلسل التشغيل (الخطوة الحالية مضيئة)',en:'Operating sequence (current step lit)'}, log:{ar:'سجل الأحداث',en:'Event log'}, devices:{ar:'حالة الأجهزة',en:'Device states'},
 thTag:{ar:'الرمز',en:'Tag'}, thDesc:{ar:'الجهاز',en:'Device'}, thState:{ar:'الحالة',en:'State'},
 explain:{ar:'فكرة الدائرة',en:'How the circuit works'}, challenges:{ar:'تحديات (تتعلّم تلقائيًا لما تنفذها)',en:'Challenges (ticked automatically)'}, quiz:{ar:'اختبر نفسك',en:'Test yourself'},
 soon:{ar:'قريبًا',en:'Coming soon'}, ready:{ar:'جاهزة',en:'Ready'},
 energized:{ar:'متغذي',en:'Energized'}, deenerg:{ar:'غير متغذي',en:'De-energized'}, pressed:{ar:'مضغوط',en:'Pressed'}, released:{ar:'غير مضغوط',en:'Released'},
 closed:{ar:'مقفول',en:'Closed'}, open:{ar:'مفتوح',en:'Open'}, ok:{ar:'سليم',en:'OK'}, tripped:{ar:'فاصل',en:'Tripped'}, lit:{ar:'منور',en:'Lit'}, unlit:{ar:'مطفي',en:'Off'}, faulty:{ar:'به عطل',en:'Faulty'},
 burnt:{ar:'ملف محروق',en:'Burnt coil'},
 ev_press:{ar:'ضغط ',en:'Pressed '}, ev_rel:{ar:'ترك ',en:'Released '}, ev_kon:{ar:' اتغذى وقفل كونتاكتاته',en:' energized, contacts changed'}, ev_koff:{ar:' فصل',en:' dropped out'},
 ev_trip:{ar:'الأوفرلود F1 فصل: الموتور سحب تيار أعلى من الضبط مدة طويلة',en:'Overload F1 tripped: motor drew more than the setting for too long'}, ev_reset:{ar:'ريست للأوفرلود F1',en:'Overload F1 reset'},
 ev_mOff:{ar:'الكهرباء قطعت',en:'Mains lost'}, ev_mOn:{ar:'الكهرباء رجعت',en:'Mains restored'}, ev_q1on:{ar:'Q1 اتقفل',en:'Q1 switched on'}, ev_q1off:{ar:'Q1 اتفصل',en:'Q1 switched off'},
 ev_run:{ar:'الموتور وصل للسرعة',en:'Motor up to speed'}, ev_stop:{ar:'الموتور وقف',en:'Motor stopped'}, ev_fault:{ar:'عطل مضاف: ',en:'Fault added: '}, ev_hum:{ar:'الموتور يزن ولا يدور: فاز ناقص',en:'Motor hums and will not turn: phase missing'},
 noAuto:{ar:'لاحظ: الكهرباء رجعت والموتور لم يرجع يدور وحده. ده أمان مقصود.',en:'Note: mains came back and the motor did not restart on its own. That is intended safety.'},
 rpm:{ar:'لفة/د',en:'rpm'}
};
let LANG=window.CC_LANG||'ar';
if(!window.CC_LANG) try{ if(localStorage.getItem('cc_lang')==='en') LANG='en' }catch(e){}
const t=k=>UI[k]?UI[k][LANG]:k;
const tx=o=>o==null?'':(typeof o==='string'?o:(o[LANG]??o.ar));


Object.assign(UI,{
 title:{ar:'كورس الكنترول الكلاسيك',en:'Classic Control Course'},
 sub:{ar:'نبدأ بالأجهزة نفسها: الأزرار والكونتاكتور والحماية والموتور، ثم الدوائر بالترتيب، ثم التايمر ودوائره، ثم الحساسات ودوائرها. كل درس فيه محاكي حي تتحكم فيه من العمود الجانبي، وكل دائرة مرسومة بدائرة القوى بجانب دائرة التحكم مع شكل اللوحة الحقيقي على الراك.',en:'We start with the devices themselves: buttons, contactor, protection and the motor, then the circuits in order, then the timer and its circuits, then sensors and their circuits. Every lesson has a live simulator you drive from the side column, and every circuit shows the power circuit beside the control circuit plus the real panel on its DIN rails.'},
 vDia:{ar:'المخطط',en:'Diagram'}, vPan:{ar:'اللوحة',en:'Panel'},
 panelCap:{ar:'شكل اللوحة: الأجهزة على الراك، وباب اللوحة بالأزرار واللمبات، والموتور',en:'The panel: devices on DIN rails, the door with buttons and lamps, and the motor'},
 timers:{ar:'ضبط التايمرات',en:'Timer settings'},
 prev:{ar:'→ الدرس السابق',en:'← Previous lesson'}, next:{ar:'الدرس التالي ←',en:'Next lesson →'},
 lessonW:{ar:'الدرس',en:'Lesson'}, circuitW:{ar:'الدائرة',en:'Circuit'},
 ev_q1trip:{ar:'Q1 فصل مغناطيسيًا: قصر بين فازتين!',en:'Q1 tripped magnetically: phase-to-phase short circuit!'},
 ev_tstart:{ar:' بدأ العد',en:' started timing'}, ev_tdone:{ar:' خلص العد وقلب كونتاكتاته',en:' timed out, contacts changed'},
 fwd:{ar:'أمامي',en:'forward'}, rev:{ar:'عكسي',en:'reverse'},
 olResetX:{ar:'ريست ',en:'Reset '},
 irNoteStd:{ar:'التيار المقنن لكل موتور 11 أمبير. اضبط الأوفرلود عليه.',en:'Each motor is rated 11 A. Set the overload to it.'},
});
const UNITS=[
 {n:1,ar:'الوحدة 1: الأجهزة',en:'Unit 1: The devices'},
 {n:2,ar:'الوحدة 2: الدوائر الأساسية',en:'Unit 2: Basic circuits'},
 {n:3,ar:'الوحدة 3: التايمر ودوائره',en:'Unit 3: The timer and its circuits'},
 {n:4,ar:'الوحدة 4: الليمت سويتش والعوامة',en:'Unit 4: Limit switches and floats'},
 {n:5,ar:'الوحدة 5: تايمرات وستار/دلتا ودوائر أكتر',en:'Unit 5: More timers, star-delta and circuits'},
];

/* ================= circuit building helpers ================= */
const E=(id,type,tag,x)=>Object.assign({id,type,tag},x||{});
const S_=(...a)=>({series:a});
const P_=(...b)=>({par:b.map(x=>x.series?x:S_(x))});
const SP=(...b)=>({split:b.map(x=>x.series?x:S_(x))});
const fuse0=()=>E('F0','fuse','F0',{t:['1','2']});
const olc=tag=>E(tag+'c','olNC',tag,{ol:tag,t:['95','96']});
const olt=tag=>E(tag+'t','olNO',tag,{ol:tag,t:['97','98']});
const pbno=(btn,id)=>E(id||btn,'pbNO',btn,{btn,t:['13','14']});
const pbnc=(btn,id,t1,t2)=>E(id||btn,'pbNC',btn,{btn,t:[t1||'21',t2||'22']});
const no=(ref,a,b,id)=>E(id,'no',ref,{ref,t:[a,b]});
const nc=(ref,a,b,id)=>E(id,'nc',ref,{ref,t:[a,b]});
const coil=ref=>E(ref+'c','coil',ref,{ref});
const lamp=(id,color)=>E(id,'lamp',id,{color});
const tcoil=(ref,pre)=>E(ref+'c','tcoil',ref,{ref,pre});
const tno=(ref,id)=>E(id,'tNO',ref,{ref,t:['17','18']});
const tnc=(ref,id)=>E(id,'tNC',ref,{ref,t:['15','16']});
const LP={
 H1g:{id:'H1',color:'green',l:{ar:'تشغيل',en:'Run'}}, H2w:{id:'H2',color:'white',l:{ar:'استعداد',en:'Ready'}}, H3a:{id:'H3',color:'amber',l:{ar:'فصل أوفرلود',en:'O/L trip'}},
};
const D={
 F0:{ar:'فيوز التحكم',en:'Control fuse'},
 H1:{ar:'لمبة تشغيل (أخضر)',en:'Run lamp (green)'}, H2:{ar:'لمبة استعداد (أبيض)',en:'Ready lamp (white)'}, H3:{ar:'لمبة فصل أوفرلود (برتقالي)',en:'Trip lamp (amber)'}
};
const PF={
 phL3:{id:'phL3',power:true,l:{ar:'فاز L3 مقطوع من المصدر',en:'Phase L3 lost at supply'}},
 K1p2:{id:'K1p2',power:true,l:{ar:'قطب K1 الأوسط (3-4) محروق',en:'K1 middle main pole (3-4) burnt'}},
 jam:{id:'jam',power:true,l:{ar:'حمل الموتور M1 محشور ميكانيكيًا',en:'Motor M1 load mechanically jammed'}},
};
const fF0={id:'F0',kind:'open',l:{ar:'فيوز التحكم F0 محروق',en:'Control fuse F0 blown'}};
const fCoil=r=>({id:r+'c',kind:'burnt',l:{ar:'ملف '+r+' محروق',en:r+' coil burnt'}});
const fHold=(r,id)=>({id:id||r+'h',kind:'open',l:{ar:'كونتاكت التثبيت '+r+' 13-14 تالف',en:r+' holding contact 13-14 worn'}});
const ready=()=>S_(nc('K1','21','22','K1n'),lamp('H2','white'));
const tripL=(...ols)=>ols.length===1?S_(olt(ols[0]),lamp('H3','amber')):S_(P_(...ols.map(o=>olt(o))),lamp('H3','amber'));
const runL=(ref,id,color)=>S_(no(ref,'43','44',ref+'r'),lamp(id||'H1',color||'green'));
const run=(s,m)=>s.mot[m||'M1']&&s.mot[m||'M1'].state==='run';

const LESSONS=[]; // filled with device lessons + circuits (order matters)

const CIRCUITS=[
{ key:'dol', unit:2, kind:'circuit', tpl:'dol',
  name:{ar:'تشغيل وإيقاف مباشر بكونتاكت تثبيت',en:'DOL start/stop with holding contact'},
  buttons:[{btn:'S1',color:'green',face:'I',l:{ar:'تشغيل',en:'Start'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف',en:'Stop'}}],
  lamps:[LP.H1g,LP.H2w,LP.H3a],
  tree:S_(fuse0(), SP( S_(olc('F1'), pbnc('S0'), SP( S_(P_(pbno('S1'), no('K1','13','14','K1h')), coil('K1')), runL('K1') )), ready(), tripL('F1') )),
  faults:[fF0,{id:'S0',kind:'open',l:{ar:'سلك فالت عند زر الإيقاف S0',en:'Loose wire at stop button S0'}},{id:'S1',kind:'open',l:{ar:'زر التشغيل S1 تالف لا يقفل',en:'Start button S1 worn, never closes'}},fHold('K1'),fCoil('K1'),{id:'F1c',kind:'open',l:{ar:'كونتاكت الأوفرلود 95-96 مفكوك',en:'Overload contact 95-96 loose'}},{id:'S1',kind:'stuck',l:{ar:'زر التشغيل S1 معلّق (لازق)',en:'Start button S1 stuck closed'}},PF.phL3,PF.K1p2,PF.jam],
  trace:['F0','S0','S1','K1h','K1c','F1c'],
  steps:[
    {l:{ar:'Q1 مقفول وجهد التحكم موجود. لمبة الاستعداد H2 منورة.',en:'Q1 on and control voltage present. Ready lamp H2 lit.'},on:s=>s.ctrl&&!s.k.K1},
    {l:{ar:'الضغط على S1 يوصل الجهد لملف K1.',en:'Pressing S1 feeds the K1 coil.'},on:s=>s.btn.S1===1&&s.k.K1},
    {l:{ar:'K1 يقفل كونتاكتات القوى فيدور الموتور، ويقفل 13-14.',en:'K1 closes the main contacts, the motor turns, and 13-14 closes.'},on:s=>s.k.K1&&Math.abs(s.mot.M1.speed)<1300},
    {l:{ar:'بعد ترك S1 الكونتاكت 13-14 يمسك الملف (التثبيت الذاتي).',en:'After S1 is released, 13-14 keeps the coil fed (self-holding).'},on:s=>s.k.K1&&s.btn.S1!==1},
    {l:{ar:'S0 أو فصل F1 يقطع الملف فيرجع كل شيء لوضعه.',en:'S0 or an F1 trip cuts the coil and everything resets.'},on:s=>!s.k.K1&&(s.btn.S0===1||s.ol.F1.trip)}
  ],
  challenges:[
    {l:{ar:'شغّل الموتور واتركه شغالًا بعد ترك زر S1.',en:'Start the motor and keep it running after releasing S1.'},f:'heldRun'},
    {l:{ar:'أوقف الموتور بزر S0.',en:'Stop the motor with S0.'},f:'stop:S0'},
    {l:{ar:'اجعل الأوفرلود يفصل (زوّد الحمل أو قلّل الضبط)، ثم اعمل ريست وشغّل من جديد.',en:'Make the overload trip (raise the load or lower the setting), then reset and restart.'},f:'restartAfterTrip'},
    {l:{ar:'اقطع الكهرباء والموتور شغال ثم رجّعها، ولاحظ أنه لا يدور وحده.',en:'Cut the mains while running, restore it, and see it does not restart.'},f:'noAuto'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا بالملتيميتر.',en:'In fault-finding mode, find one fault with the multimeter.'},f:'solved'}
  ],
  explain:{ar:[
    'الموتور يتغذى من ثلاث فازات عن طريق القاطع Q1 ثم كونتاكتات القوى في الكونتاكتور K1 ثم الأوفرلود F1. الكونتاكتور هو الذي يوصل ويفصل، والتحكم فيه يتم من دائرة صغيرة 230 فولت.',
    'زر التشغيل S1 مفتوح طبيعيًا (NO): يوصّل فقط وأنت ضاغط عليه. لكي يستمر الموتور بعد ترك الزر نضع كونتاكت مساعد من K1 نفسه (13-14) على التوازي مع S1. أول ما K1 يتغذى يقفل هذا الكونتاكت فيُمسك نفسه. هذا هو التثبيت الذاتي.',
    'زر الإيقاف S0 مقفول طبيعيًا (NC) وموصّل على التوالي. لو السلك اتقطع أو الزر اتكسر، الدائرة تفصل والموتور يقف. هذا تصميم آمن: أي عطل في سلك الإيقاف يؤدي للوقوف وليس للتشغيل.',
    'كونتاكت الأوفرلود 95-96 على التوالي أيضًا. لو الموتور سحب تيار أعلى من الضبط لفترة، يفتح 95-96 فيفصل K1، وكونتاكت 97-98 يقفل وينوّر لمبة الإنذار H3.',
    'ميزة مهمة: لو الكهرباء قطعت، K1 يفصل ويفتح كونتاكت التثبيت. عند رجوع الكهرباء لا يدور الموتور إلا بضغطة جديدة على S1. هذا يحمي العامل من تشغيل مفاجئ.'
  ],en:[
    'The motor is fed with three phases through breaker Q1, then the K1 main contacts, then overload F1. The contactor does the switching; it is controlled by a small 230 V circuit.',
    'Start button S1 is normally open (NO): it conducts only while pressed. To keep the motor running after release, an auxiliary contact of K1 itself (13-14) is wired in parallel with S1. As soon as K1 picks up, that contact closes and holds the coil. That is self-holding (latching).',
    'Stop button S0 is normally closed (NC) and wired in series. If the wire breaks or the button fails, the circuit opens and the motor stops. A fault in the stop wiring causes a stop, never a start.',
    'Overload contact 95-96 is also in series. If the motor draws more than the setting for a while, 95-96 opens and drops K1, while 97-98 closes and lights alarm lamp H3.',
    'Key feature: if the mains fails, K1 drops and opens the holding contact. When power returns the motor will not turn until S1 is pressed again. This protects people from a surprise start.'
  ]},
  quiz:[
    {q:{ar:'لماذا نوصل K1 13-14 على التوازي مع S1؟',en:'Why is K1 13-14 wired in parallel with S1?'},o:[{ar:'لكي يبقى الملف متغذيًا بعد ترك S1',en:'To keep the coil fed after S1 is released'},{ar:'لتقليل تيار البدء',en:'To reduce starting current'},{ar:'لحماية الموتور من الحمل الزائد',en:'To protect the motor from overload'}],a:0,w:{ar:'هو كونتاكت التثبيت: يمسك الدائرة مكان الزر.',en:'It is the holding contact: it takes over from the button.'}},
    {q:{ar:'زر الإيقاف NC وموصّل توالي. ماذا يحدث لو السلك اتقطع؟',en:'The stop button is NC in series. What if its wire breaks?'},o:[{ar:'الموتور لا يقف أبدًا',en:'The motor can never stop'},{ar:'الموتور يقف ولا يشتغل حتى يتصلح السلك',en:'The motor stops and will not start until fixed'},{ar:'لا يحدث شيء',en:'Nothing happens'}],a:1,w:{ar:'هذا هو التصميم الآمن: العطل يؤدي للوقوف.',en:'Fail-safe design: the fault leads to a stop.'}},
    {q:{ar:'قِست 230 فولت بين طرفي ملف K1 والكونتاكتور لا يجذب. أين العطل غالبًا؟',en:'You measure 230 V across the K1 coil but it does not pull in. Where is the fault most likely?'},o:[{ar:'في زر التشغيل',en:'In the start button'},{ar:'في الفيوز F0',en:'In fuse F0'},{ar:'في الملف نفسه (محروق)',en:'In the coil itself (burnt)'}],a:2,w:{ar:'الجهد وصل للملف، فالمشكلة في الملف.',en:'Voltage reaches the coil, so the coil is the problem.'}}
  ]
},
{ key:'two', unit:2, kind:'circuit', tpl:'dol',
  name:{ar:'التشغيل والإيقاف من مكانين',en:'Start/stop from two locations'},
  buttons:[{btn:'S1',color:'green',face:'I',l:{ar:'تشغيل (مكان 1)',en:'Start (place 1)'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف (مكان 1)',en:'Stop (place 1)'}},{btn:'S2',color:'green',face:'I',l:{ar:'تشغيل (مكان 2)',en:'Start (place 2)'}},{btn:'S3',color:'red',face:'O',l:{ar:'إيقاف (مكان 2)',en:'Stop (place 2)'}}],
  lamps:[LP.H1g,LP.H2w,LP.H3a],
  tree:S_(fuse0(), SP( S_(olc('F1'), pbnc('S0'), pbnc('S3'), SP( S_(P_(pbno('S1'), pbno('S2'), no('K1','13','14','K1h')), coil('K1')), runL('K1') )), ready(), tripL('F1') )),
  faults:[{id:'S3',kind:'open',l:{ar:'سلك مقطوع عند إيقاف المكان الثاني S3',en:'Broken wire at place-2 stop S3'}},{id:'S2',kind:'open',l:{ar:'زر تشغيل المكان الثاني S2 تالف',en:'Place-2 start S2 worn'}},fHold('K1'),{id:'S2',kind:'stuck',l:{ar:'زر S2 معلّق (لازق)',en:'S2 stuck closed'}},fF0,fCoil('K1'),PF.phL3,PF.K1p2,PF.jam],
  trace:['F0','S0','S3','S1','S2','K1h','K1c','F1c'],
  steps:[
    {l:{ar:'كل أزرار التشغيل على التوازي: أي واحد منها يشغّل.',en:'All start buttons are in parallel: any one starts.'},on:s=>(s.btn.S1===1||s.btn.S2===1)},
    {l:{ar:'كونتاكت التثبيت K1 13-14 يمسك بعد ترك الزر.',en:'Holding contact K1 13-14 keeps it on after release.'},on:s=>s.k.K1&&s.btn.S1!==1&&s.btn.S2!==1},
    {l:{ar:'كل أزرار الإيقاف على التوالي: أي واحد منها يوقف.',en:'All stop buttons are in series: any one stops.'},on:s=>!s.k.K1&&(s.btn.S0===1||s.btn.S3===1)}
  ],
  challenges:[
    {l:{ar:'شغّل من المكان الثاني (S2) وأوقف من المكان الأول (S0).',en:'Start from place 2 (S2) and stop from place 1 (S0).'},f:'start:S2&stop:S0'},
    {l:{ar:'شغّل من المكان الأول (S1) وأوقف من المكان الثاني (S3).',en:'Start from place 1 (S1) and stop from place 2 (S3).'},f:'start:S1&stop:S3'},
    {l:{ar:'فعّل تثبيت الضغط واضغط S1 وS3 معًا: الإيقاف له الأولوية.',en:'Use keep-pressed and hold S1 and S3 together: stop wins.'},f:'stopWins'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  hook:(dt,m)=>{ if(S.btn.S1===1&&S.btn.S3===1&&!S.k.K1) FLAGS.add('stopWins'); },
  explain:{ar:[
    'نفس دائرة التشغيل المباشر، لكن الموتور له لوحتا أزرار في مكانين (مثلًا عند الماكينة وفي غرفة التحكم).',
    'القاعدة الذهبية: أزرار التشغيل NO توصل على التوازي (أي زر يكفي للتشغيل)، وأزرار الإيقاف NC توصل على التوالي (أي زر يكفي للإيقاف).',
    'لو ضغطت تشغيل وإيقاف معًا، الإيقاف يفوز لأنه على التوالي قبل كل شيء. وهذا مطلوب للأمان.',
    'يمكن زيادة الأماكن لثلاثة أو أكثر بنفس القاعدة: كل تشغيل جديد على التوازي، وكل إيقاف جديد على التوالي.'
  ],en:[
    'Same as the DOL circuit, but the motor has two button stations (for example at the machine and in the control room).',
    'Golden rule: NO start buttons go in parallel (any one starts), NC stop buttons go in series (any one stops).',
    'If start and stop are pressed together, stop wins because it is in series ahead of everything. That is required for safety.',
    'You can add a third or fourth place with the same rule: each new start in parallel, each new stop in series.'
  ]},
  quiz:[
    {q:{ar:'كيف نوصل أزرار الإيقاف من أكثر من مكان؟',en:'How are stop buttons from several places connected?'},o:[{ar:'على التوازي',en:'In parallel'},{ar:'على التوالي',en:'In series'},{ar:'زر واحد فقط يعمل',en:'Only one may work'}],a:1,w:{ar:'التوالي: فتح أي واحد يقطع الدائرة.',en:'Series: opening any one breaks the circuit.'}},
    {q:{ar:'الموتور يشتغل من S1 ولا يشتغل من S2. ماذا تقيس أولًا؟',en:'The motor starts from S1 but not from S2. What do you measure first?'},o:[{ar:'فيوز التحكم',en:'The control fuse'},{ar:'طرفي S2 وهو مضغوط',en:'Across S2 while pressed'},{ar:'ملف K1',en:'The K1 coil'}],a:1,w:{ar:'باقي الدائرة سليم لأن S1 يشغّل، فالمشكلة في فرع S2.',en:'The rest works because S1 starts it, so the problem is in the S2 branch.'}}
  ]
},
{ key:'jog', unit:2, kind:'circuit', tpl:'dol',
  name:{ar:'تشغيل لحظي (Jog) وتشغيل مستمر',en:'Jog (inching) and continuous run'},
  buttons:[{btn:'S1',color:'green',face:'I',l:{ar:'تشغيل مستمر',en:'Run'}},{btn:'S3',color:'black',face:'JOG',l:{ar:'تشغيل لحظي',en:'Jog'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف',en:'Stop'}}],
  lamps:[LP.H1g,LP.H2w,LP.H3a],
  desc:{S3:{ar:'زر لحظي مزدوج، الجزء المفتوح',en:'Jog button, NO part'},S3n:{ar:'زر لحظي، الجزء المقفول',en:'Jog button, NC part'}},
  tree:S_(fuse0(), SP( S_(olc('F1'), pbnc('S0'), SP( S_(P_(pbno('S1'), pbno('S3'), S_(pbnc('S3','S3n'), no('K1','13','14','K1h'))), coil('K1')), runL('K1') )), ready(), tripL('F1') )),
  faults:[{id:'S3n',kind:'stuck',l:{ar:'الجزء المقفول في زر Jog لا يفتح',en:'Jog NC part never opens'}},{id:'S3n',kind:'open',l:{ar:'الجزء المقفول في زر Jog مفتوح دائمًا',en:'Jog NC part always open'}},{id:'S3',kind:'open',l:{ar:'الجزء المفتوح في زر Jog تالف',en:'Jog NO part worn'}},fHold('K1'),fCoil('K1'),PF.phL3,PF.K1p2,PF.jam],
  trace:['F0','S0','S1','S3','S3n','K1h','K1c','F1c'],
  steps:[
    {l:{ar:'الضغط على Jog: الجزء NO يغذي K1 والجزء NC يفتح فرع التثبيت.',en:'Pressing Jog: its NO feeds K1 while its NC opens the holding branch.'},on:s=>s.btn.S3===1&&s.k.K1},
    {l:{ar:'ترك Jog: الملف يفصل قبل أن يرجع الجزء NC، فالموتور يقف.',en:'Releasing Jog: the coil drops before the NC re-closes, so the motor stops.'},on:s=>s.btn.S3!==1&&!s.k.K1&&Math.abs(s.mot.M1.speed)>5},
    {l:{ar:'الضغط على S1: تشغيل عادي يثبت عن طريق K1 13-14 والجزء NC من Jog.',en:'Pressing S1: normal start, held through K1 13-14 and the Jog NC.'},on:s=>s.k.K1&&s.btn.S3!==1}
  ],
  challenges:[
    {l:{ar:'حرّك الموتور لحظيًا بزر Jog وتأكد أنه يقف مع ترك الزر.',en:'Inch the motor with Jog and check it stops on release.'},f:'jogged'},
    {l:{ar:'بعد الـ Jog شغّل تشغيلًا مستمرًا بـ S1 ثم أوقف بـ S0.',en:'After jogging, run continuously with S1 then stop with S0.'},f:'jogged&start:S1&stop:S0'},
    {l:{ar:'أضف عطل "الجزء المقفول في زر Jog لا يفتح" وجرّب Jog. ماذا حدث؟',en:'Add the fault "Jog NC never opens" and try Jog. What happens?'},f:'jogLatched'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  onRelease:(id)=>{ if(id==='S3'){ if(!S.k.K1&&Math.abs(S.mot.M1.speed)>2) FLAGS.add('jogged'); if(S.k.K1) FLAGS.add('jogLatched'); } },
  explain:{ar:[
    'التشغيل اللحظي (Jog أو Inching) يحرك الموتور طالما أنت ضاغط فقط، ويستخدم في ضبط السير أو تركيب الورق أو تحريك الماكينة خطوة صغيرة.',
    'زر Jog مزدوج: فيه كونتاكت NO وكونتاكت NC على نفس الذراع. الـ NO يغذي الملف، والـ NC موصّل على التوالي مع كونتاكت التثبيت فيقطعه أثناء الضغط.',
    'في الزر الحقيقي الـ NO يفتح أولًا ثم يقفل الـ NC (افصل قبل أن توصل). لذلك الملف يفصل ويفتح كونتاكت التثبيت قبل أن يرجع الـ NC، فلا يحدث تثبيت.',
    'لو الجزء NC تالف ولا يفتح، زر Jog يتصرف مثل زر تشغيل عادي ويثبت الموتور. هذا خطر لأن العامل يتوقع أن الموتور سيقف مع ترك الزر.'
  ],en:[
    'Jog (inching) moves the motor only while you hold the button. It is used to align a belt, thread material or move a machine a small step.',
    'The Jog button has an NO and an NC contact on one plunger. The NO feeds the coil, the NC is in series with the holding contact and cuts it while pressed.',
    'In a real button the NO opens first and then the NC closes (break before make). The coil drops and opens the holding contact before the NC returns, so nothing latches.',
    'If the NC part is faulty and never opens, Jog behaves like a normal start and latches. That is dangerous because the operator expects a stop on release.'
  ]},
  quiz:[
    {q:{ar:'لماذا نضع الجزء NC من زر Jog على التوالي مع كونتاكت التثبيت؟',en:'Why is the Jog NC in series with the holding contact?'},o:[{ar:'لكي لا يثبت الموتور أثناء الـ Jog',en:'So the motor does not latch during jog'},{ar:'لكي يقف الموتور أسرع',en:'So the motor stops faster'},{ar:'لتقليل التيار',en:'To lower the current'}],a:0,w:{ar:'يقطع طريق التثبيت طوال الضغط على Jog.',en:'It cuts the holding path while Jog is pressed.'}},
    {q:{ar:'زر Jog يثبت الموتور بدل أن يقف عند الترك. السبب المحتمل؟',en:'Jog latches the motor instead of stopping on release. Likely cause?'},o:[{ar:'S0 تالف',en:'S0 faulty'},{ar:'الجزء NC في زر Jog لا يفتح',en:'Jog NC part never opens'},{ar:'فيوز محروق',en:'Blown fuse'}],a:1,w:{ar:'لو NC لا يفتح يبقى طريق التثبيت موصولًا.',en:'If the NC never opens, the holding path stays connected.'}}
  ]
},
{ key:'rev', unit:2, kind:'circuit', tpl:'rev',
  name:{ar:'عكس الحركة بإنترلوك (عن طريق الإيقاف)',en:'Reversing with interlock (via stop)'},
  buttons:[{btn:'S1',color:'green',face:'▶',l:{ar:'أمامي',en:'Forward'}},{btn:'S2',color:'blue',face:'◀',l:{ar:'عكسي',en:'Reverse'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف',en:'Stop'}}],
  lamps:[{id:'H1',color:'green',l:{ar:'أمامي',en:'Forward'}},{id:'H4',color:'blue',l:{ar:'عكسي',en:'Reverse'}},LP.H3a],
  desc:{K2i:{ar:'إنترلوك: كونتاكت K2 المقفول في دائرة K1',en:'Interlock: K2 NC in the K1 rung'},K1i:{ar:'إنترلوك: كونتاكت K1 المقفول في دائرة K2',en:'Interlock: K1 NC in the K2 rung'}},
  tree:S_(fuse0(), SP( S_(olc('F1'), pbnc('S0'), SP(
      S_(P_(pbno('S1'), no('K1','13','14','K1h')), nc('K2','21','22','K2i'), coil('K1')),
      S_(P_(pbno('S2'), no('K2','13','14','K2h')), nc('K1','21','22','K1i'), coil('K2')) )),
    runL('K1','H1','green'), runL('K2','H4','blue'), tripL('F1') )),
  faults:[{id:'IL',ids:['K1i','K2i'],kind:'stuck',l:{ar:'الإنترلوك ملغي: كونتاكتات 21-22 مقصورة بسلك',en:'Interlock removed: both 21-22 contacts bridged'}},{id:'K1i',kind:'open',l:{ar:'كونتاكت الإنترلوك K1 21-22 مفتوح دائمًا',en:'Interlock K1 21-22 always open'}},fHold('K2'),fCoil('K2'),{id:'S2',kind:'open',l:{ar:'زر العكسي S2 تالف',en:'Reverse button S2 worn'}},fF0,PF.phL3,PF.jam],
  trace:['F0','F1c','S0','S1','K1h','K2i','K1c','S2','K2h','K1i','K2c'],
  steps:[
    {l:{ar:'S1 يشغّل K1 (أمامي). كونتاكت K1 21-22 يفتح ويمنع K2.',en:'S1 starts K1 (forward). K1 21-22 opens and blocks K2.'},on:s=>s.k.K1},
    {l:{ar:'الضغط على S2 أثناء الدوران الأمامي لا يفعل شيئًا: الإنترلوك يمنعه.',en:'Pressing S2 while running forward does nothing: the interlock blocks it.'},on:s=>s.k.K1&&s.btn.S2===1},
    {l:{ar:'S0 يوقف. بعدها S2 يشغّل K2، وK2 يبدّل فازتين فيعكس الاتجاه.',en:'S0 stops. Then S2 starts K2, which swaps two phases and reverses.'},on:s=>s.k.K2}
  ],
  challenges:[
    {l:{ar:'شغّل أمامي ثم أوقف ثم شغّل عكسي.',en:'Run forward, stop, then run reverse.'},f:'fwd&revAfterFwd'},
    {l:{ar:'جرّب الضغط على S2 والموتور شغال أمامي، ولاحظ أن الإنترلوك منعه.',en:'Press S2 while running forward and see the interlock block it.'},f:'blocked'},
    {l:{ar:'أضف عطل "الإنترلوك ملغي" ثم شغّل أمامي واضغط S2. ماذا حدث للقاطع Q1؟',en:'Add the "interlock removed" fault, run forward and press S2. What happened to Q1?'},f:'q1trip'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  hook:(dt,m)=>{ if(S.k.K1) m.f=1; if(S.k.K1&&run(S)) FLAGS.add('fwd'); if(S.k.K2&&m.f&&run(S)) FLAGS.add('revAfterFwd'); if(S.k.K1&&S.btn.S2===1&&!S.k.K2) FLAGS.add('blocked'); if(S.q1trip) FLAGS.add('q1trip'); },
  explain:{ar:[
    'لعكس اتجاه الموتور ثلاثي الفاز نبدّل أي فازتين. نستخدم كونتاكتورين: K1 يوصل L1-L2-L3 كما هي (أمامي)، وK2 يوصلها بعد تبديل L1 مع L3 (عكسي).',
    'لو K1 وK2 قفلوا مع بعض يحصل قصر بين فازتين ويفصل القاطع. لذلك نضع إنترلوك كهربي: كونتاكت مقفول من K2 في دائرة K1، وكونتاكت مقفول من K1 في دائرة K2. أي واحد شغال يمنع الثاني.',
    'في هذه الدائرة لكي تعكس لازم تضغط إيقاف الأول. هذا يحمي الموتور والماكينة من العكس المفاجئ وهو يدور.',
    'في اللوحات الحقيقية نضيف أيضًا إنترلوك ميكانيكي بين الكونتاكتورين (قطعة تُركب بينهما تمنع قفلهما معًا) كأمان إضافي.'
  ],en:[
    'To reverse a three-phase motor, swap any two phases. Two contactors are used: K1 connects L1-L2-L3 straight (forward), K2 connects them with L1 and L3 swapped (reverse).',
    'If K1 and K2 closed together there would be a phase-to-phase short and the breaker would trip. So an electrical interlock is added: a K2 NC contact in the K1 rung and a K1 NC contact in the K2 rung. Whichever is on blocks the other.',
    'In this circuit you must press stop before reversing. That protects the motor and machine from a sudden reversal while turning.',
    'Real panels also add a mechanical interlock between the two contactors (a part fitted between them that stops both closing) as extra safety.'
  ]},
  quiz:[
    {q:{ar:'كيف نعكس اتجاه موتور ثلاثي الفاز؟',en:'How do you reverse a three-phase motor?'},o:[{ar:'نبدّل أي فازتين',en:'Swap any two phases'},{ar:'نبدّل الفازات الثلاثة',en:'Swap all three phases'},{ar:'نعكس النيوترال',en:'Reverse the neutral'}],a:0,w:{ar:'تبديل فازتين يعكس اتجاه المجال الدوار.',en:'Swapping two phases reverses the rotating field.'}},
    {q:{ar:'ما فائدة كونتاكت K2 21-22 في دائرة K1؟',en:'What does K2 21-22 in the K1 rung do?'},o:[{ar:'تثبيت K1',en:'Hold K1'},{ar:'يمنع K1 من القفل وK2 شغال',en:'Stops K1 closing while K2 is on'},{ar:'يشغّل اللمبة',en:'Lights the lamp'}],a:1,w:{ar:'هذا هو الإنترلوك الكهربي.',en:'That is the electrical interlock.'}}
  ]
},
{ key:'drev', unit:2, kind:'circuit', tpl:'rev',
  name:{ar:'عكس الحركة المباشر بأزرار مزدوجة',en:'Direct reversing with double buttons'},
  buttons:[{btn:'S1',color:'green',face:'▶',l:{ar:'أمامي',en:'Forward'}},{btn:'S2',color:'blue',face:'◀',l:{ar:'عكسي',en:'Reverse'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف',en:'Stop'}}],
  lamps:[{id:'H1',color:'green',l:{ar:'أمامي',en:'Forward'}},{id:'H4',color:'blue',l:{ar:'عكسي',en:'Reverse'}},LP.H3a],
  desc:{S1n:{ar:'زر الأمامي، الجزء المقفول',en:'Forward button, NC part'},S2n:{ar:'زر العكسي، الجزء المقفول',en:'Reverse button, NC part'}},
  tree:S_(fuse0(), SP( S_(olc('F1'), pbnc('S0'), SP(
      S_(pbnc('S2','S2n'), P_(pbno('S1'), no('K1','13','14','K1h')), nc('K2','21','22','K2i'), coil('K1')),
      S_(pbnc('S1','S1n'), P_(pbno('S2'), no('K2','13','14','K2h')), nc('K1','21','22','K1i'), coil('K2')) )),
    runL('K1','H1','green'), runL('K2','H4','blue'), tripL('F1') )),
  faults:[{id:'S2n',kind:'stuck',l:{ar:'الجزء المقفول في زر S2 لا يفتح',en:'S2 NC part never opens'}},{id:'K1i',kind:'open',l:{ar:'كونتاكت الإنترلوك K1 21-22 مفتوح دائمًا',en:'Interlock K1 21-22 always open'}},fHold('K1'),fCoil('K2'),fF0,PF.phL3,PF.jam],
  trace:['F0','F1c','S0','S2n','S1','K1h','K2i','K1c','S1n','S2','K2h','K1i','K2c'],
  steps:[
    {l:{ar:'الضغط على S2 والموتور أمامي: الجزء NC من S2 يفصل K1 أولًا.',en:'Pressing S2 while forward: the S2 NC drops K1 first.'},on:s=>s.btn.S2===1&&!s.k.K1&&!s.k.K2},
    {l:{ar:'ثم الجزء NO من S2 يغذي K2 بعد أن رجع K1 21-22.',en:'Then the S2 NO feeds K2 once K1 21-22 has re-closed.'},on:s=>s.k.K2&&s.btn.S2===1},
    {l:{ar:'الموتور يفرمل ويعكس اتجاهه بدون ضغط إيقاف. التيار يرتفع جدًا أثناء العكس.',en:'The motor brakes and reverses without pressing stop. Current is very high during reversal.'},on:s=>(s.k.K2&&s.mot.M1.speed>50)||(s.k.K1&&s.mot.M1.speed<-50)}
  ],
  challenges:[
    {l:{ar:'شغّل أمامي ثم اضغط S2 مباشرة بدون إيقاف.',en:'Run forward, then press S2 directly without stop.'},f:'directRev'},
    {l:{ar:'لاحظ تيار الموتور لحظة العكس في خانة التيار.',en:'Watch the motor current at the moment of reversal.'},f:'plugI'},
    {l:{ar:'كرر العكس عدة مرات متتالية حتى يفصل الأوفرلود.',en:'Reverse several times in a row until the overload trips.'},f:'olTrip'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  hook:(dt,m)=>{ const sp=S.mot.M1.speed; if((S.k.K2&&sp>400)||(S.k.K1&&sp<-400)) FLAGS.add('directRev'); if(S.mot.M1.cur>60) FLAGS.add('plugI'); if(S.ol.F1.trip) FLAGS.add('olTrip'); },
  explain:{ar:[
    'هنا كل زر مزدوج: فيه NO للتشغيل وNC يقطع الاتجاه الآخر. زر S2 مثلًا: الجزء NC في دائرة K1 والجزء NO في دائرة K2.',
    'لما تضغط S2 والموتور أمامي، الجزء NC يفتح أولًا فيفصل K1، ثم الجزء NO يقفل فيشغّل K2. العكس يحصل بضغطة واحدة.',
    'الإنترلوك بكونتاكتات الكونتاكتورات (K1 21-22 وK2 21-22) يبقى موجودًا كأمان أساسي حتى مع الأزرار المزدوجة.',
    'العكس المباشر يجعل الموتور يفرمل بالعكس (Plugging): التيار يصل لأكثر من 6 أضعاف وكل عكس يسخّن الموتور والأوفرلود. يستخدم فقط مع الأحمال الخفيفة.'
  ],en:[
    'Here each button is double: an NO to start and an NC that cuts the other direction. For S2, the NC is in the K1 rung and the NO in the K2 rung.',
    'Pressing S2 while running forward opens the NC first, dropping K1, then the NO closes and starts K2. Reversal takes one press.',
    'The contactor interlock (K1 21-22 and K2 21-22) stays as the main safety even with double buttons.',
    'Direct reversing makes the motor brake against its rotation (plugging): current exceeds six times rated and each reversal heats the motor and overload. Use it only on light loads.'
  ]},
  quiz:[
    {q:{ar:'ما فائدة الجزء NC من زر S2 في دائرة K1؟',en:'What does the S2 NC part in the K1 rung do?'},o:[{ar:'يفصل K1 لحظة الضغط على العكسي',en:'Drops K1 when reverse is pressed'},{ar:'يثبت K2',en:'Holds K2'},{ar:'يحمي من الحمل الزائد',en:'Protects against overload'}],a:0,w:{ar:'لهذا لا تحتاج لضغط إيقاف قبل العكس.',en:'That is why no stop press is needed before reversing.'}},
    {q:{ar:'لماذا يرتفع التيار جدًا أثناء العكس المباشر؟',en:'Why is current so high during direct reversal?'},o:[{ar:'لأن الموتور يدور عكس اتجاه المجال',en:'The motor turns against the field'},{ar:'لأن الفيوز محروق',en:'The fuse is blown'},{ar:'لأن الجهد قل',en:'The voltage dropped'}],a:0,w:{ar:'الانزلاق يقترب من 2 فيكون التيار أعلى من تيار البدء.',en:'Slip approaches 2, so current exceeds starting current.'}}
  ]
},
{ key:'seq', unit:2, kind:'circuit', tpl:'two',
  name:{ar:'تشغيل متتابع لموتورين',en:'Sequential start of two motors'},
  buttons:[{btn:'S1',color:'green',face:'I',l:{ar:'تشغيل M1',en:'Start M1'}},{btn:'S2',color:'green',face:'II',l:{ar:'تشغيل M2',en:'Start M2'}},{btn:'S3',color:'red',face:'O2',l:{ar:'إيقاف M2',en:'Stop M2'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف الكل',en:'Stop all'}}],
  lamps:[{id:'H1',color:'green',l:{ar:'M1 يعمل',en:'M1 run'}},{id:'H4',color:'blue',l:{ar:'M2 يعمل',en:'M2 run'}},LP.H3a],
  desc:{K1s:{ar:'كونتاكت K1 يسمح بتشغيل M2',en:'K1 contact that permits M2'},S3:{ar:'زر إيقاف M2 فقط',en:'Stop button for M2 only'},S0:{ar:'زر إيقاف الكل',en:'Stop-all button'}},
  tree:S_(fuse0(), SP( S_(pbnc('S0'), SP(
      S_(olc('F1'), P_(pbno('S1'), no('K1','13','14','K1h')), coil('K1')),
      S_(olc('F2'), no('K1','53','54','K1s'), pbnc('S3'), P_(pbno('S2'), no('K2','13','14','K2h')), coil('K2')) )),
    runL('K1','H1','green'), runL('K2','H4','blue'), tripL('F1','F2') )),
  faults:[{id:'K1s',kind:'open',l:{ar:'كونتاكت السماح K1 53-54 تالف',en:'Permissive contact K1 53-54 worn'}},{id:'K1s',kind:'stuck',l:{ar:'كونتاكت السماح K1 53-54 مقصور',en:'Permissive contact K1 53-54 bridged'}},fHold('K2'),fCoil('K2'),{id:'jam2',power:true,l:{ar:'حمل الموتور M2 محشور',en:'Motor M2 load jammed'}},fF0,PF.phL3],
  trace:['F0','S0','F1c','S1','K1h','K1c','F2c','K1s','S3','S2','K2h','K2c'],
  steps:[
    {l:{ar:'S1 يشغّل M1. كونتاكت K1 53-54 يقفل ويسمح بتشغيل M2.',en:'S1 starts M1. K1 53-54 closes and permits M2.'},on:s=>s.k.K1&&!s.k.K2},
    {l:{ar:'S2 يشغّل M2، لكن فقط لو M1 شغال.',en:'S2 starts M2, but only if M1 is running.'},on:s=>s.k.K2},
    {l:{ar:'S3 يوقف M2 وحده. S0 أو فصل F1 يوقف الاثنين.',en:'S3 stops M2 alone. S0 or an F1 trip stops both.'},on:s=>s.btn.S3===1||s.btn.S0===1}
  ],
  challenges:[
    {l:{ar:'جرّب تشغيل M2 قبل M1 ولاحظ أنه لا يعمل.',en:'Try starting M2 before M1 and see it refuses.'},f:'m2blocked'},
    {l:{ar:'شغّل M1 ثم M2، ثم أوقف M2 وحده بـ S3.',en:'Start M1 then M2, then stop M2 alone with S3.'},f:'both&stop:S3'},
    {l:{ar:'والاثنان شغالان، افصل الأوفرلود F1 (أضف عطل الحشر أو زوّد الحمل) ولاحظ وقوف M2 أيضًا.',en:'With both running, trip F1 (jam or raise load) and see M2 stop too.'},f:'cascade'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  hook:(dt,m)=>{ if(S.btn.S2===1&&!S.k.K1&&!S.k.K2) FLAGS.add('m2blocked'); if(S.k.K1&&S.k.K2) {FLAGS.add('both'); m.b=1;} if(m.b&&S.ol.F1.trip&&!S.k.K2) FLAGS.add('cascade'); },
  explain:{ar:[
    'في خطوط الإنتاج لازم بعض المواتير تشتغل بترتيب. مثال: طلمبة الزيت قبل الماكينة، أو السير الأخير قبل السير الذي يغذيه حتى لا تتكدس الخامة.',
    'الفكرة بسيطة: كونتاكت مفتوح من K1 (53-54) موصّل على التوالي في دائرة K2. طالما K1 مفصول، K2 لا يمكن أن يتغذى.',
    'لو M1 وقف لأي سبب (إيقاف، أوفرلود، انقطاع)، كونتاكت السماح يفتح فيقف M2 تلقائيًا. هذا يحمي الخط من التشغيل الخاطئ.',
    'S3 يوقف M2 فقط، أما S0 فهو على التوالي قبل الدائرتين فيوقف الكل.'
  ],en:[
    'On production lines some motors must start in order. Example: the oil pump before the machine, or the last conveyor before the one feeding it so material does not pile up.',
    'The idea is simple: an NO contact of K1 (53-54) in series in the K2 rung. As long as K1 is off, K2 cannot be fed.',
    'If M1 stops for any reason (stop, overload, power loss), the permissive contact opens and M2 stops automatically. That protects the line from wrong operation.',
    'S3 stops only M2, while S0 is in series ahead of both rungs and stops everything.'
  ]},
  quiz:[
    {q:{ar:'ما الذي يمنع M2 من العمل قبل M1؟',en:'What stops M2 running before M1?'},o:[{ar:'كونتاكت K1 53-54 على التوالي مع K2',en:'K1 53-54 in series with K2'},{ar:'الأوفرلود F2',en:'Overload F2'},{ar:'زر S3',en:'Button S3'}],a:0,w:{ar:'كونتاكت السماح من K1.',en:'The K1 permissive contact.'}},
    {q:{ar:'الأوفرلود F1 فصل. ماذا يحدث لـ M2؟',en:'Overload F1 trips. What happens to M2?'},o:[{ar:'يستمر',en:'Keeps running'},{ar:'يقف لأن K1 فصل',en:'Stops because K1 dropped'},{ar:'يعكس اتجاهه',en:'Reverses'}],a:1,w:{ar:'K1 53-54 يفتح فيفصل K2.',en:'K1 53-54 opens and drops K2.'}}
  ]
},
];
const PLANNED=[];

/* ================= state ================= */
const S={btn:{},k:{},tim:{},ol:{},fault:{},pfault:{},mains:true,q1:true,q1trip:false,load:70,ir:11,mot:{},ctrl:true,lamps:{},time:0,sel:'0',ls:{},fl:{}};
let C=null,TPL=null,PW=null,ROOT=null,PTS=[],LPT=null,NPT=null,ELS=[];
const UPD={control:[],power:[],panel:[]};
let MODE='free',TRACE=null,SCORE={ok:0,n:0},PROBE={b:null,r:null};
const FLAGS=new Set(); let lastBtn={id:null,t:-9}; let wasRunningBeforeLoss=false,lossT=-1,trippedOnce=false; let HM={};
const LOG=[];
const IN=11;
const $=s=>document.querySelector(s);
const NS='http://www.w3.org/2000/svg';
function sv(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
function txt(parent,x,y,s,cls,anchor){const e=sv('text',{x,y,class:cls||'tag','text-anchor':anchor||'start'},parent);e.textContent=s;return e}
const cnt=a=>a.filter(Boolean).length;

/* ================= logic ================= */
const isLoad=e=>e.type==='coil'||e.type==='lamp'||e.type==='tcoil';
function closedOf(e){
  const f=S.fault[e.id]; if(f==='open') return false; if(f==='stuck') return true;
  switch(e.type){
    case 'fuse': return true;
    case 'pbNO': return S.btn[e.btn]===1;
    case 'pbNC': return !S.btn[e.btn];
    case 'no': return !!S.k[e.ref];
    case 'nc': return !S.k[e.ref];
    case 'olNC': return !S.ol[e.ol].trip;
    case 'olNO': return !!S.ol[e.ol].trip;
    case 'tNO': return !!(S.tim[e.ref]&&S.tim[e.ref].done);
    case 'tNC': return !(S.tim[e.ref]&&S.tim[e.ref].done);
    case 'lsNO': return !!S.ls[e.ls]; case 'lsNC': return !S.ls[e.ls];
    case 'snNO': return !!S.ls[e.ls];
    case 'flNO': return !!S.fl[e.fl]; case 'flNC': return !S.fl[e.fl];
    case 'selH': return S.sel==='H'; case 'selA': return S.sel==='A';
  } return false;
}
function evalSeries(items,live){
  for(const it of items){
    if(it.type){
      it.liveIn=live;
      if(isLoad(it)){ it.on=live&&S.fault[it.id]!=='burnt'; return false; }
      it.closed=closedOf(it); live=live&&it.closed; if(live) it.outPt.live=true;
    }else if(it.par){
      it.liveIn=live; let any=false;
      for(const b of it.par){ b.liveOut=evalSeries(b.series,live); any=any||b.liveOut; }
      live=any;
    }else if(it.split){ it.liveIn=live; for(const b of it.split) evalSeries(b.series,live); return false; }
  }
  return live;
}
function curSeries(items,down){
  let run=down;
  for(let i=items.length-1;i>=0;i--){const it=items[i];
    if(it.type){ if(isLoad(it)){ it.current=!!it.on; run=it.current; } else it.current=run&&it.liveIn&&it.closed; }
    else if(it.par){ let any=false; for(const b of it.par){ b.cur=run&&it.liveIn&&b.liveOut; curSeries(b.series,b.cur); any=any||b.cur; } it.current=any; }
    else if(it.split){ let any=false; for(const b of it.split){ b.cur=curSeries(b.series,false); any=any||b.cur; } it.current=any; run=any; }
  }
  return run;
}
function solve(){
  if(!ROOT) return;
  for(let i=0;i<14;i++){
    PTS.forEach(p=>p.live=false); LPT.live=S.ctrl;
    evalSeries(ROOT.series,LPT.live);
    const nk={}; let ch=false;
    ELS.forEach(e=>{
      if(e.type==='coil'){ nk[e.ref]=!!e.on; if(!!S.k[e.ref]!==nk[e.ref]) ch=true; }
      if(e.type==='lamp') S.lamps[e.id]=!!e.on;
      if(e.type==='tcoil'&&S.tim[e.ref].off){ const tm=S.tim[e.ref]; if(tm.on!==!!e.on){ tm.on=!!e.on; if(tm.on){ if(!tm.done) ch=true; tm.done=true; tm.t=0; } else if(tm.done) addLog(e.ref+t('ev_tstart')); } }
      else if(e.type==='tcoil'){ const tm=S.tim[e.ref]; if(tm.on!==!!e.on){ tm.on=!!e.on; if(tm.on) addLog(e.ref+t('ev_tstart')); else { if(tm.done) ch=true; tm.t=0; tm.done=false; } } }
    });
    for(const r in nk){ if(!!S.k[r]!==nk[r]) onK(r,nk[r]); }
    Object.assign(S.k,nk);
    if(!ch) break;
  }
  curSeries(ROOT.series,false);
  PW=TPL.state();
}
function anySpeed(){ return Object.values(S.mot).some(m=>Math.abs(m.speed)>200); }
function onK(r,on){
  const cause=(S.time-lastBtn.t<0.6)?lastBtn.id:null;
  addLog(r+(on?t('ev_kon'):t('ev_koff')));
  if(on&&cause) FLAGS.add('start:'+cause);
  if(!on&&cause&&anySpeed()) FLAGS.add('stop:'+cause);
}
function setBtn(id,pressed){
  const cur=S.btn[id]||0, tgt=pressed?1:0; if(cur===tgt) return;
  lastBtn={id,t:S.time};
  addLog((pressed?t('ev_press'):t('ev_rel'))+id);
  S.btn[id]=0.5; solve();
  S.btn[id]=tgt; solve();
  if(!pressed&&C.onRelease) C.onRelease(id);
  syncButtons(); refreshAll();
}

/* ================= power templates ================= */
const sup=()=>[S.mains,S.mains,S.mains&&!S.pfault.phL3];
const TPLS={
 dol:{ motors:['M1'], ols:{F1:'M1'}, olOf:{K1:'F1'}, w:250, h:560,
   state(){ const p0=sup(), p1=p0.map(v=>v&&S.q1), k=!!S.k.K1; const p2=p1.map((v,i)=>v&&k&&!(i===1&&S.pfault.K1p2));
     return {p0,p1,p2,short:false,motors:{M1:{v:p2,n:cnt(p2),tf:1,dir:1,sync:1500}},olCur:{F1:()=>S.mot.M1.cur}}; },
   draw(g){
     const xs=[70,110,150], M=()=>PW.motors.M1, c=i=>M().n>=2&&PW.p2[i]&&S.mot.M1.cur>0.1;
     ['L1','L2','L3'].forEach((l,i)=>txt(g,xs[i],22,l,'tag','middle'));
     xs.forEach((x,i)=>{ pw(g,[[x,30],[x,70]],()=>PW.p0[i],()=>c(i)); pw(g,[[x,122],[x,190]],()=>PW.p1[i],()=>c(i)); pw(g,[[x,242],[x,310]],()=>PW.p2[i],()=>c(i)); });
     breaker3(g,xs,70,i=>PW.p0[i],i=>PW.p1[i],c);
     contact3(g,xs,190,'K1',i=>!!S.k.K1&&!(i===1&&S.pfault.K1p2),i=>PW.p1[i],i=>PW.p2[i],c,1,'K1p2');
     thermal3(g,xs,310,'F1',i=>PW.p2[i],c);
     motorSym(g,110,456,'M1',xs,354,i=>PW.p2[i],c);
   }},
 rev:{ motors:['M1'], ols:{F1:'M1'}, olOf:{K1:'F1'}, w:270, h:580,
   state(){ const p0=sup(), p1=p0.map(v=>v&&S.q1), k1=!!S.k.K1, k2=!!S.k.K2;
     const a=p1.map(v=>v&&k1), b=p1.map(v=>v&&k2);
     const mt=[a[0]||b[2],a[1]||b[1],a[2]||b[0]];
     const dir=k1&&!k2?1:k2&&!k1?-1:0;
     return {p0,p1,a,b,mt,short:k1&&k2&&cnt(p1)>=2,motors:{M1:{v:mt,n:cnt(mt),tf:1,dir,sync:1500}},olCur:{F1:()=>S.mot.M1.cur}}; },
   draw(g){
     const xs=[60,90,120], xr=[165,195,225], M=()=>PW.motors.M1, run=()=>M().n>=2&&S.mot.M1.cur>0.1;
     const cA=i=>run()&&S.k.K1&&PW.a[i], cB=j=>run()&&S.k.K2&&PW.b[j], cT=i=>run()&&PW.mt[i];
     const cIn=i=>cA(i)||cB(i);
     ['L1','L2','L3'].forEach((l,i)=>txt(g,xs[i],22,l,'tag','middle'));
     xs.forEach((x,i)=>{ pw(g,[[x,30],[x,70]],()=>PW.p0[i],()=>cIn(i)); pw(g,[[x,122],[x,190]],()=>PW.p1[i],()=>cIn(i)); });
     breaker3(g,xs,70,i=>PW.p0[i],i=>PW.p1[i],cIn);
     xs.forEach((x,i)=>{ const y=140+i*10; pw(g,[[x,y],[xr[i],y],[xr[i],190]],()=>PW.p1[i],()=>cB(i)); sv('circle',{cx:x,cy:y,r:2.6,fill:'#b9c7c4'},g); });
     contact3(g,xs,190,'K1',()=>!!S.k.K1,i=>PW.p1[i],i=>PW.a[i],cA,1);
     contact3(g,xr,190,'K2',()=>!!S.k.K2,i=>PW.p1[i],i=>PW.b[i],cB,1);
     xs.forEach((x,i)=>{ const jy=262+i*10; pw(g,[[x,242],[x,jy]],()=>PW.a[i],()=>cA(i)); pw(g,[[x,jy],[x,320]],()=>PW.mt[i],()=>cT(i)); sv('circle',{cx:x,cy:jy,r:2.6,fill:'#b9c7c4'},g); });
     xr.forEach((x,j)=>{ const tI=2-j, jy=262+tI*10; pw(g,[[x,242],[x,jy],[xs[tI],jy]],()=>PW.b[j],()=>cB(j)); });
     txt(g,240,262,'L1↔L3','trm');
     thermal3(g,xs,320,'F1',i=>PW.mt[i],cT);
     motorSym(g,90,470,'M1',xs,364,i=>PW.mt[i],cT);
   }},
 two:{ motors:['M1','M2'], ols:{F1:'M1',F2:'M2'}, olOf:{K1:'F1',K2:'F2'}, w:410, h:560,
   state(){ const p0=sup(), p1=p0.map(v=>v&&S.q1);
     const f=(ref,j)=>p1.map((v,i)=>v&&!!S.k[ref]&&!(j===0&&i===1&&S.pfault.K1p2));
     const q1=f('K1',0), q2=f('K2',1);
     return {p0,p1,q:[q1,q2],short:false,motors:{M1:{v:q1,n:cnt(q1),tf:1,dir:1,sync:1500},M2:{v:q2,n:cnt(q2),tf:1,dir:1,sync:1500}},olCur:{F1:()=>S.mot.M1.cur,F2:()=>S.mot.M2.cur}}; },
   draw(g){
     const X=j=>[60+j*175,90+j*175,120+j*175];
     const cF=(j,i)=>{const m='M'+(j+1); return PW.motors[m].n>=2&&PW.q[j][i]&&S.mot[m].cur>0.1;};
     const xs=X(0);
     ['L1','L2','L3'].forEach((l,i)=>txt(g,xs[i],22,l,'tag','middle'));
     xs.forEach((x,i)=>{ pw(g,[[x,30],[x,70]],()=>PW.p0[i],()=>cF(0,i)||cF(1,i)); pw(g,[[x,122],[x,190]],()=>PW.p1[i],()=>cF(0,i)||cF(1,i)); });
     breaker3(g,xs,70,i=>PW.p0[i],i=>PW.p1[i],i=>cF(0,i)||cF(1,i));
     xs.forEach((x,i)=>{ const y=140+i*10; const x2=X(1)[i]; pw(g,[[x,y],[x2,y],[x2,190]],()=>PW.p1[i],()=>cF(1,i)); sv('circle',{cx:x,cy:y,r:2.6,fill:'#b9c7c4'},g); });
     [0,1].forEach(j=>{ const xj=X(j), K='K'+(j+1), F='F'+(j+1), m='M'+(j+1);
       contact3(g,xj,190,K,i=>!!S.k[K]&&!(j===0&&i===1&&S.pfault.K1p2),i=>PW.p1[i],i=>PW.q[j][i],i=>cF(j,i),1,j===0?'K1p2':null);
       xj.forEach((x,i)=>pw(g,[[x,242],[x,310]],()=>PW.q[j][i],()=>cF(j,i)));
       thermal3(g,xj,310,F,i=>PW.q[j][i],i=>cF(j,i));
       motorSym(g,xj[1],456,m,xj,354,i=>PW.q[j][i],i=>cF(j,i));
     });
   }},
};
/* power drawing helpers */
function pw(g,pts,liveFn,curFn){const d='M'+pts.map(p=>p.join(',')).join(' L');const b=sv('path',{d,class:'w dead'},g);const fl=sv('path',{d,class:'fl'},g);fl.style.display='none';UPD.power.push(()=>{b.setAttribute('class','w '+(liveFn()?'live':'dead'));fl.style.display=curFn()?'':'none';});}
function breaker3(g,xs,y,lin,lout,cur){
  const bl=[];
  xs.forEach((x,i)=>{ pw(g,[[x,y],[x,y+12]],()=>lin(i),()=>cur(i)); pw(g,[[x,y+40],[x,y+52]],()=>lout(i),()=>cur(i));
    sv('path',{d:`M${x-4} ${y+8} l8 8 M${x+4} ${y+8} l-8 8`,class:'sym'},g);
    bl.push(sv('line',{x1:x,y1:y+40,x2:x,y2:y+12,class:'sym'},g)); sv('rect',{x:x-3,y:y+44,width:6,height:5,class:'sym'},g); });
  const qd=sv('path',{d:'',class:'sym dash'},g);
  const qg=sv('g',{class:'clk',tabindex:'0',role:'button','aria-label':'Q1'},g);
  sv('rect',{x:xs[0]-50,y,width:xs[2]-xs[0]+70,height:52,fill:'transparent'},qg);
  const qh=sv('path',{d:'',class:'sym'},qg);
  txt(g,xs[0]-52,y+30,'Q1','tag'); txt(g,xs[2]+12,y+22,'I>','trm'); txt(g,xs[2]+12,y+36,'16A','trm');
  qg.addEventListener('click',()=>toggleQ1()); qg.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();toggleQ1()}});
  UPD.power.push(()=>{const c=S.q1; bl.forEach((b,i)=>{b.setAttribute('x2',c?xs[i]+1:xs[i]-12);b.setAttribute('y2',c?y+13:y+17)}); const my=y+27; qd.setAttribute('d',`M${xs[0]-26} ${my} H${xs[2]-(c?1:6)}`); qh.setAttribute('d',`M${xs[0]-26} ${my-8} v16`);});
}
function contact3(g,xs,y,tag,closed,lin,lout,cur,t0,pf){
  const bl=[];
  xs.forEach((x,i)=>{ pw(g,[[x,y],[x,y+12]],()=>lin(i),()=>cur(i)); pw(g,[[x,y+40],[x,y+52]],()=>lout(i),()=>cur(i));
    sv('path',{d:`M${x} ${y+12} a4 4 0 0 1 -6 4`,class:'sym'},g);
    bl.push(sv('line',{x1:x,y1:y+40,x2:x,y2:y+12,class:'sym'},g));
    txt(g,x+5,y+10,String(t0+2*i),'trm'); txt(g,x+5,y+52,String(t0+1+2*i),'trm'); });
  const kd=sv('path',{d:'',class:'sym dash'},g); txt(g,xs[0]-46,y+30,tag,'tag');
  const kx=txt(g,xs[1]+10,y+30,'','flt');
  UPD.power.push(()=>{ const any=xs.some((x,i)=>closed(i)); bl.forEach((b,i)=>{const cc=closed(i); b.setAttribute('x2',cc?xs[i]+1:xs[i]-12);b.setAttribute('y2',cc?y+13:y+17)}); kd.setAttribute('d',`M${xs[0]-22} ${y+27} H${xs[2]-(any?1:6)}`); kx.textContent=(pf&&MODE==='free'&&S.pfault[pf])?'!':''; });
}
function thermal3(g,xs,y,tag,live,cur){
  sv('rect',{x:xs[0]-16,y,width:xs[2]-xs[0]+32,height:44,rx:3,class:'sym dash'},g);
  xs.forEach((x,i)=>{ pw(g,[[x,y],[x,y+12],[x-7,y+12],[x-7,y+24],[x,y+24],[x,y+44]],()=>live(i),()=>cur(i)); });
  const w=xs[2]-xs[0]+32; const hb=sv('rect',{x:xs[0]-16,y:y+46,width:0,height:4,fill:'#5fd08b'},g);
  txt(g,xs[0]-46,y+26,tag,'tag'); const irT=txt(g,xs[2]+20,y+30,'','trm');
  UPD.power.push(()=>{const o=S.ol[tag]; const h=Math.min(1,o.heat); hb.setAttribute('width',w*h); hb.setAttribute('fill',o.trip?'#ff5d50':h>.6?'#ffc629':'#5fd08b'); irT.textContent=S.ir+'A';});
}
function motorSym(g,cx,cy,id,xs,y0,live,cur){
  const mx=[cx-24,cx,cx+24], my=[cy-32,cy-40,cy-32];
  xs.forEach((x,i)=>pw(g,[[x,y0],[x,cy-62],[mx[i],cy-62],[mx[i],my[i]]],()=>live(i),()=>cur(i)));
  const mc=sv('circle',{cx,cy,r:40,class:'sym'},g);
  txt(g,cx,cy-6,'M','tag','middle'); txt(g,cx,cy+12,'3~','tag','middle');
  const rot=sv('g',{},g);
  for(let k=0;k<3;k++) sv('path',{d:`M${cx} ${cy-33} a33 33 0 0 1 18 6`,stroke:'#e9a640','stroke-width':3,fill:'none','stroke-linecap':'round',transform:`rotate(${k*120} ${cx} ${cy})`},rot);
  ['U1','V1','W1'].forEach((u,i)=>txt(g,mx[i]+(i===1?7:0),cy-47,u,'trm','middle'));
  txt(g,cx,cy+56,id+'  5.5kW  11A','trm','middle');
  const dt=txt(g,cx,cy+70,'','trm','middle');
  UPD.power.push(()=>{const m=S.mot[id]; rot.setAttribute('transform',`rotate(${m.state==='hum'?Math.sin(S.time*60)*4:m.ang} ${cx} ${cy})`); rot.style.opacity=Math.abs(m.speed)>2||m.state==='hum'?1:.35; mc.setAttribute('stroke',m.state==='run'||m.state==='start'?'#5fd08b':['hum','jam'].includes(m.state)?'#ff5d50':'#b9c7c4'); dt.textContent=Math.abs(m.speed)>5?(Math.round(Math.abs(m.speed))+' rpm '+(m.speed>0?'↻':'↺')):''; });
}

/* ================= motor + overload ================= */
function motorStep(id,ms,dt){
  const m=S.mot[id], load=S.load/100;
  const jam=(id==='M1'&&S.pfault.jam)||(id==='M2'&&S.pfault.jam2)||m.endJam;
  let I=0;
  if(ms.n===3&&ms.dir!==0){
    const tgt=ms.dir*ms.sync*Math.max(0.86,1-0.035*load/ms.tf);
    if(jam){ m.speed+=(0-m.speed)*Math.min(1,dt*8); I=6.2*IN*ms.tf; }
    else{ m.speed+=(tgt-m.speed)*Math.min(1,dt*2.4*Math.min(1,ms.tf*1.6));
      const slip=Math.min(2,Math.abs(tgt-m.speed)/ms.sync);
      I=IN*(0.35+0.65*load)+5.6*IN*ms.tf*Math.min(1.15,slip); }
  }else if(ms.n===2||(ms.n===3&&ms.dir===0)){
    const sg=Math.sign(m.speed)||1;
    if(jam||Math.abs(m.speed)<300){ m.speed-=sg*Math.min(Math.abs(m.speed),dt*600); I=5.2*IN; }
    else { m.speed+=(sg*(1430-60*load)-m.speed)*dt*1.5; I=IN*(0.35+0.65*load)*1.75+3; }
  }else{ const sg=Math.sign(m.speed); m.speed-=sg*Math.min(Math.abs(m.speed),dt*(220+260*load)); I=0; }
  m.cur=I; m.ang=(m.ang+m.speed/60*360*dt*0.08)%360;
  const olt=Object.keys(TPL.ols).find(k=>TPL.ols[k]===id);
  let st='stop';
  if(olt&&S.ol[olt].trip&&Math.abs(m.speed)<5) st='trip';
  else if(jam&&ms.n>=2) st='jam';
  else if(ms.n>=2&&I>=5*IN&&Math.abs(m.speed)<300&&ms.n===2) st='hum';
  else if(ms.n===3&&ms.dir!==0&&Math.abs(m.speed)<1300*ms.sync/1500) st='start';
  else if(ms.n>=2) st='run';
  else if(Math.abs(m.speed)>5) st='coast';
  if(st!==m.state){
    const pre=TPL.motors.length>1?id+': ':'';
    if(st==='run') addLog(pre+t('ev_run')); if(st==='stop'&&m.state!=='trip') addLog(pre+t('ev_stop')); if(st==='hum') addLog(pre+t('ev_hum'),true);
    m.state=st;
  }
}
function olStep(dt){
  for(const tag in TPL.ols){
    const o=S.ol[tag]; const I=PW.olCur[tag](); const r=I/S.ir;
    if(r>1.05) o.heat+=dt*(r*r-1)/(r>3?80:25); else o.heat=Math.max(0,o.heat-dt*0.045);
    o.heat=Math.min(o.heat,1.25);
    if(!o.trip&&o.heat>=1){ o.trip=true; trippedOnce=true; addLog(tag+': '+t('ev_trip'),true); solve(); }
  }
}
function powerStep(dt){
  if(PW.short&&S.q1){ S.q1=false; S.q1trip=true; addLog(t('ev_q1trip'),true); solve(); }
  for(const id of TPL.motors) motorStep(id,PW.motors[id],dt);
  olStep(dt);
  const motors=Object.values(S.mot);
  if(motors.some(m=>m.state==='run')&&!Object.values(S.btn).some(v=>v)) FLAGS.add('heldRun');
  if(trippedOnce&&!Object.values(S.ol).some(o=>o.trip)&&motors.some(m=>m.state==='run')) FLAGS.add('restartAfterTrip');
  if(lossT>=0&&S.mains&&S.time-lossT>2.5){ if(!Object.values(S.k).some(Boolean)){ FLAGS.add('noAuto'); addLog(t('noAuto')); } lossT=-1; }
}
function timerStep(dt){
  let ch=false;
  for(const r in S.tim){ const tm=S.tim[r]; if(tm.off){ if(!tm.on&&tm.done){ tm.t+=dt; if(tm.t>=tm.pre){ tm.done=false; tm.t=0; ch=true; addLog(r+t('ev_tdone')); } } continue; } if(tm.on&&!tm.done){ tm.t+=dt; if(tm.t>=tm.pre){ tm.done=true; ch=true; addLog(r+t('ev_tdone')); } } }
  if(ch) solve();
}
/* ================= Unit 3: timer circuits (templates + circuits) ================= */
/* n motors in parallel, each with its own contactor + overload */
function mkMulti(n,step){
  const ms=[...Array(n)].map((_,j)=>'M'+(j+1)), ols={}, olOf={};
  ms.forEach((m,j)=>{ ols['F'+(j+1)]=m; olOf['K'+(j+1)]='F'+(j+1); });
  return { motors:ms, ols, olOf, w:150+(n-1)*step+30, h:560,
   state(){ const p0=sup(), p1=p0.map(v=>v&&S.q1);
     const q=ms.map((m,j)=>p1.map((v,i)=>v&&!!S.k['K'+(j+1)]&&!(j===0&&i===1&&S.pfault.K1p2)));
     const motors={}, olCur={}; ms.forEach((m,j)=>{ motors[m]={v:q[j],n:cnt(q[j]),tf:1,dir:1,sync:1500}; olCur['F'+(j+1)]=()=>S.mot[m].cur; });
     return {p0,p1,q,short:false,motors,olCur}; },
   draw(g){
     const X=j=>[60+j*step,90+j*step,120+j*step];
     const cF=(j,i)=>{const m='M'+(j+1); return PW.motors[m].n>=2&&PW.q[j][i]&&S.mot[m].cur>0.1;};
     const anyF=i=>ms.some((m,j)=>cF(j,i)), xs=X(0);
     ['L1','L2','L3'].forEach((l,i)=>txt(g,xs[i],22,l,'tag','middle'));
     xs.forEach((x,i)=>{ pw(g,[[x,30],[x,70]],()=>PW.p0[i],()=>anyF(i)); pw(g,[[x,122],[x,190]],()=>PW.p1[i],()=>anyF(i)); });
     breaker3(g,xs,70,i=>PW.p0[i],i=>PW.p1[i],anyF);
     for(let j=n-1;j>=1;j--) xs.forEach((x,i)=>{ const y=140+i*10, x2=X(j)[i], xp=X(j-1)[i];
       pw(g,[[xp,y],[x2,y],[x2,190]],()=>PW.p1[i],()=>ms.slice(j).some((m,jj)=>cF(j+jj,i))); sv('circle',{cx:xp,cy:y,r:2.6,fill:'#b9c7c4'},g); });
     ms.forEach((m,j)=>{ const xj=X(j), K='K'+(j+1), F='F'+(j+1);
       contact3(g,xj,190,K,i=>!!S.k[K]&&!(j===0&&i===1&&S.pfault.K1p2),i=>PW.p1[i],i=>PW.q[j][i],i=>cF(j,i),1,j===0?'K1p2':null);
       xj.forEach((x,i)=>pw(g,[[x,242],[x,310]],()=>PW.q[j][i],()=>cF(j,i)));
       thermal3(g,xj,310,F,i=>PW.q[j][i],i=>cF(j,i));
       motorSym(g,xj[1],456,m,xj,354,i=>PW.q[j][i],i=>cF(j,i));
     });
   }};
}
TPLS.three=mkMulti(3,150);

/* star-delta: KM main, KS star, KD delta, overload in the KM line (phase current) */
TPLS.sd={ motors:['M1'], ols:{F1:'M1'}, olOf:{KM:'F1'}, w:340, h:690,
  state(){ const p0=sup(), p1=p0.map(v=>v&&S.q1), M=!!S.k.KM, Dl=!!S.k.KD, St=!!S.k.KS;
    const m=p1.map(v=>v&&M), d=p1.map(v=>v&&Dl);
    const star=M&&St&&!Dl, delta=M&&Dl&&!St;
    const bt=[d[1],d[2],d[0]].map((v,i)=>v||m[i]);           // U2 V2 W2
    const n=star?cnt(m):delta?Math.min(cnt(m),cnt(d)):0;
    return {p0,p1,m,d,bt,star,delta,sp:St&&bt.some(Boolean),short:St&&Dl&&cnt(p1)>=2,
      motors:{M1:{v:m,n,tf:star?1/3:1,dir:n?1:0,sync:1500}},
      olCur:{F1:()=>star||!delta?S.mot.M1.cur:S.mot.M1.cur/1.732}}; },
  draw(g){
    const xs=[120,150,180], xd=[240,270,300], cy=420;
    const run=()=>PW.motors.M1.n>=2&&S.mot.M1.cur>0.1;
    const cM=i=>run()&&PW.m[i], cD=i=>run()&&PW.delta&&PW.d[i], cS=()=>run()&&PW.star;
    const cIn=i=>cM(i)||cD(i);
    ['L1','L2','L3'].forEach((l,i)=>txt(g,xs[i],22,l,'tag','middle'));
    xs.forEach((x,i)=>{ pw(g,[[x,30],[x,70]],()=>PW.p0[i],()=>cIn(i)); pw(g,[[x,122],[x,190]],()=>PW.p1[i],()=>cIn(i)); });
    breaker3(g,xs,70,i=>PW.p0[i],i=>PW.p1[i],cIn);
    xs.forEach((x,i)=>{ const y=140+i*10; pw(g,[[x,y],[xd[i],y],[xd[i],190]],()=>PW.p1[i],()=>cD(i)); sv('circle',{cx:x,cy:y,r:2.6,fill:'#b9c7c4'},g); });
    contact3(g,xs,190,'KM',()=>!!S.k.KM,i=>PW.p1[i],i=>PW.m[i],cM,1);
    contact3(g,xd,190,'',()=>!!S.k.KD,i=>PW.p1[i],i=>PW.d[i],cD,1); txt(g,xd[2]+12,220,'KD','tag'); txt(g,xd[2]+12,236,'Δ','tag');
    xs.forEach((x,i)=>pw(g,[[x,242],[x,262]],()=>PW.m[i],()=>cM(i)));
    thermal3(g,xs,262,'F1',i=>PW.m[i],cM);
    xs.forEach((x,i)=>pw(g,[[x,306],[x,cy-40]],()=>PW.m[i],()=>cM(i)));
    // motor with 6 terminals
    sv('rect',{x:xs[0]-16,y:cy-46,width:92,height:92,rx:8,class:'sym'},g);
    const mc=sv('circle',{cx:150,cy,r:28,class:'sym'},g);
    txt(g,150,cy-4,'M','tag','middle'); txt(g,150,cy+12,'3~','tag','middle');
    const rot=sv('g',{},g); for(let k=0;k<3;k++) sv('path',{d:`M150 ${cy-22} a22 22 0 0 1 12 4`,stroke:'#e9a640','stroke-width':3,fill:'none','stroke-linecap':'round',transform:`rotate(${k*120} 150 ${cy})`},rot);
    ['U1','V1','W1'].forEach((u,i)=>{ sv('circle',{cx:xs[i],cy:cy-40,r:3,class:'sym'},g); txt(g,xs[i]+4,cy-48,u,'trm'); });
    ['U2','V2','W2'].forEach((u,i)=>{ sv('circle',{cx:xs[i],cy:cy+40,r:3,class:'sym'},g); txt(g,xs[i]+4,cy+56,u,'trm'); });
    txt(g,xs[0]-58,cy+4,'M1','tag'); txt(g,xs[0]-58,cy+20,'5.5kW','trm');
    // bottom: U2 V2 W2 down to KS, KD taps
    const tapY=[530,550,510];               // U2<-L2, V2<-L3, W2<-L1
    const kdOf=[1,2,0];
    xs.forEach((x,i)=>{ pw(g,[[x,cy+40],[x,tapY[i]]],()=>PW.bt[i],()=>cS()||cD(kdOf[i])); pw(g,[[x,tapY[i]],[x,580]],()=>PW.bt[i],()=>cS());
      sv('circle',{cx:x,cy:tapY[i],r:2.6,fill:'#b9c7c4'},g);
      const j=kdOf[i]; pw(g,[[xd[j],242],[xd[j],tapY[i]],[x,tapY[i]]],()=>PW.d[j],()=>cD(j)); });
    contact3(g,xs,580,'KS',()=>!!S.k.KS,i=>PW.bt[i],()=>PW.sp,()=>cS(),1); txt(g,xs[0]-46,626,'Y','tag');
    pw(g,[[xs[0],632],[xs[0],648],[xs[2],648],[xs[2],632]],()=>PW.sp,()=>cS()); pw(g,[[xs[1],632],[xs[1],648]],()=>PW.sp,()=>cS());
    txt(g,xs[2]+12,652,LANG==='ar'?'نقطة النجمة':'star point','trm');
    const md=txt(g,250,cy-6,'','tag','middle'), dt=txt(g,250,cy+14,'','trm','middle');
    UPD.power.push(()=>{ const mm=S.mot.M1; rot.setAttribute('transform',`rotate(${mm.state==='hum'?Math.sin(S.time*60)*4:mm.ang} 150 ${cy})`); rot.style.opacity=Math.abs(mm.speed)>2||mm.state==='hum'?1:.35;
      mc.setAttribute('stroke',mm.state==='run'||mm.state==='start'?'#5fd08b':['hum','jam'].includes(mm.state)?'#ff5d50':'#b9c7c4');
      md.textContent=PW.star?(LANG==='ar'?'ستار Y':'STAR Y'):PW.delta?(LANG==='ar'?'دلتا Δ':'DELTA Δ'):''; md.style.fill=PW.star?'#ffc629':'#5fd08b';
      dt.textContent=Math.abs(mm.speed)>5?Math.round(Math.abs(mm.speed))+' rpm':''; });
  }};

CIRCUITS.push(
/* ---------- 3.1 timed sequence ---------- */
{ key:'tseq', unit:3, kind:'circuit', tpl:'two',
  name:{ar:'تشغيل متتابع أوتوماتيك بالتايمر',en:'Automatic timed sequence'},
  buttons:[{btn:'S1',color:'green',face:'I',l:{ar:'تشغيل',en:'Start'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف',en:'Stop'}}],
  lamps:[{id:'H1',color:'green',l:{ar:'M1 يعمل',en:'M1 run'}},{id:'H4',color:'blue',l:{ar:'M2 يعمل',en:'M2 run'}},LP.H3a],
  desc:{KTt:{ar:'كونتاكت K2 المقفول: يفصل التايمر بعد ما M2 يشتغل',en:'K2 NC contact: drops the timer once M2 runs'},KTd:{ar:'كونتاكت التايمر 17-18: يقفل بعد الزمن ويشغل K2',en:'Timer contact 17-18: closes after the time and starts K2'}},
  tree:S_(fuse0(), SP( S_(pbnc('S0'), olc('F1'), olc('F2'), P_(pbno('S1'), no('K1','13','14','K1h')), SP(
      S_(coil('K1')),
      S_(nc('K2','21','22','KTt'), tcoil('KT',5)),
      S_(P_(tno('KT','KTd'), no('K2','13','14','K2h')), coil('K2')) )),
    runL('K1','H1','green'), runL('K2','H4','blue'), tripL('F1','F2') )),
  faults:[{id:'KTc',kind:'burnt',l:{ar:'ملف التايمر KT محروق',en:'Timer KT coil burnt'}},{id:'KTd',kind:'open',l:{ar:'كونتاكت التايمر 17-18 تالف',en:'Timer contact 17-18 worn'}},fHold('K2'),fCoil('K2'),fHold('K1'),fF0,PF.phL3],
  trace:['F0','S0','F1c','F2c','S1','K1h','K1c','KTt','KTc','KTd','K2h','K2c'],
  steps:[
    {l:{ar:'S1 يشغّل K1 (الموتور الأول) ويغذي ملف التايمر KT في نفس اللحظة.',en:'S1 starts K1 (motor 1) and feeds timer coil KT at the same moment.'},on:s=>s.k.K1&&!s.k.K2},
    {l:{ar:'بعد الزمن المضبوط، كونتاكت التايمر 17-18 يقفل فيشغّل K2 (الموتور الثاني).',en:'After the preset time, timer contact 17-18 closes and starts K2 (motor 2).'},on:s=>s.k.K2},
    {l:{ar:'K2 يثبّت نفسه بكونتاكت 13-14، وكونتاكته المقفول 21-22 يفصل التايمر لأنه ما بقاش له لازمة.',en:'K2 holds itself through 13-14, and its NC 21-22 drops the timer, which is no longer needed.'},on:s=>s.k.K2&&!(s.tim.KT&&s.tim.KT.on)},
    {l:{ar:'S0 أو فصل أي أوفرلود يوقف الموتورين.',en:'S0 or any overload trip stops both motors.'},on:s=>s.btn.S0===1}
  ],
  challenges:[
    {l:{ar:'اضغط تشغيل مرة واحدة واستنى: M2 يشتغل لوحده بعد الزمن.',en:'Press start once and wait: M2 starts by itself after the time.'},f:'autoM2'},
    {l:{ar:'غيّر زمن التايمر من العمود الجانبي وكرر التجربة.',en:'Change the timer setting in the side column and repeat.'},f:'preCh&autoM2'},
    {l:{ar:'اضغط إيقاف قبل ما الزمن يخلص، وبعدين شغّل تاني: العد بيبدأ من الأول.',en:'Press stop before the time is up, then start again: the count restarts from zero.'},f:'restartCount'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  hook:(dt,m)=>{ if(S.k.K2&&!Object.values(S.btn).some(v=>v)) FLAGS.add('autoM2'); if(S.tim.KT&&S.tim.KT.pre!==5) FLAGS.add('preCh');
    if(S.tim.KT&&S.tim.KT.on&&S.tim.KT.t>0.5) m.cnt=1; if(m.cnt&&!S.k.K1&&!S.k.K2) m.stopped=1; if(m.stopped&&S.k.K1&&S.tim.KT&&S.tim.KT.on){ FLAGS.add('restartCount'); } },
  explain:{ar:[
    'في الدايرة دي إنت بتضغط زر واحد بس، والتايمر هو اللي يشغّل الموتور الثاني بعد زمن. ده بيقلل تيار البدء الكلي لأن الموتورين ما بيبدأوش مع بعض.',
    'ملف التايمر KT متوصل جنب ملف K1، فيتغذى معاه. بعد الزمن، الكونتاكت 17-18 يقفل ويغذي K2.',
    'K2 يثبت نفسه بالكونتاكت 13-14، فمش محتاج التايمر تاني. عشان كده كونتاكت K2 المقفول 21-22 بيفصل التايمر. ده بيريّح التايمر وبيخلي العد يرجع صفر للمرة الجاية.',
    'لو ملف التايمر اتحرق: M1 يشتغل عادي لكن M2 عمره ما هيشتغل. أول حاجة تبص عليها: لمبة U على وش التايمر.'
  ],en:[
    'Here you press one button only, and the timer starts the second motor after a delay. That lowers the total starting current because the two motors never start together.',
    'Timer coil KT sits beside K1 coil, so it is fed with it. After the time, contact 17-18 closes and feeds K2.',
    'K2 holds itself through 13-14 and no longer needs the timer. So the K2 NC contact 21-22 drops the timer. That rests the timer and resets the count for next time.',
    'If the timer coil burns: M1 runs normally but M2 never starts. First thing to look at: the U LED on the timer front.'
  ]},
  quiz:[
    {q:{ar:'M1 شغال، والتايمر عدّى زمنه، لكن M2 مش بيشتغل. ولمبة U على التايمر منورة. السبب الأقرب؟',en:'M1 runs, the timer time has passed, but M2 will not start. The timer U LED is lit. Most likely cause?'},o:[{ar:'ملف التايمر محروق',en:'Timer coil burnt'},{ar:'كونتاكت التايمر 17-18 أو ملف K2',en:'Timer contact 17-18 or the K2 coil'},{ar:'فيوز التحكم',en:'The control fuse'}],a:1,w:{ar:'التايمر متغذي (U منورة)، فالمشكلة بعده.',en:'The timer is fed (U lit), so the fault is after it.'}},
    {q:{ar:'ليه بنفصل التايمر بكونتاكت K2 21-22؟',en:'Why do we drop the timer with K2 21-22?'},o:[{ar:'عشان K2 يثبت نفسه ومش محتاج التايمر',en:'K2 holds itself and no longer needs the timer'},{ar:'عشان نعكس اتجاه M2',en:'To reverse M2'},{ar:'عشان نحمي من الشورت',en:'Short-circuit protection'}],a:0,w:{ar:'التايمر يرتاح وعده يرجع صفر.',en:'The timer rests and its count resets.'}}
  ]
},
/* ---------- 3.2 automatic star-delta ---------- */
{ key:'sd', unit:3, kind:'circuit', tpl:'sd', ir:6.4,
  irNote:{ar:'الأوفرلود في خط KM فبيشوف تيار الملف = تيار الخط ÷ 1.73. اضبطه على 6.4 أمبير.',en:'The overload sits in the KM line, so it sees winding current = line current ÷ 1.73. Set it to 6.4 A.'},
  name:{ar:'ستار/دلتا أوتوماتيك بالتايمر',en:'Automatic star-delta with a timer'},
  buttons:[{btn:'S1',color:'green',face:'I',l:{ar:'تشغيل',en:'Start'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف',en:'Stop'}}],
  lamps:[{id:'H4',color:'amber',l:{ar:'ستار',en:'Star'}},{id:'H1',color:'green',l:{ar:'دلتا (تشغيل)',en:'Delta (run)'}},{id:'H3',color:'red',l:{ar:'فصل أوفرلود',en:'O/L trip'}}],
  desc:{KDt:{ar:'كونتاكت KD المقفول 31-32: يفصل التايمر بعد الدلتا',en:'KD NC 31-32: drops the timer after delta'},KTs:{ar:'كونتاكت التايمر المقفول 15-16: يفصل الستار بعد الزمن',en:'Timer NC 15-16: drops star after the time'},KTd:{ar:'كونتاكت التايمر المفتوح 17-18: يشغل الدلتا',en:'Timer NO 17-18: starts delta'},KDi:{ar:'إنترلوك: KD يمنع KS',en:'Interlock: KD blocks KS'},KSi:{ar:'إنترلوك: KS يمنع KD',en:'Interlock: KS blocks KD'}},
  tree:S_(fuse0(), SP( S_(pbnc('S0'), olc('F1'), P_(pbno('S1'), no('KM','13','14','KMh')), SP(
      S_(coil('KM')),
      S_(nc('KD','31','32','KDt'), tcoil('KT',6)),
      S_(tnc('KT','KTs'), nc('KD','21','22','KDi'), coil('KS')),
      S_(P_(tno('KT','KTd'), no('KD','13','14','KDh')), nc('KS','21','22','KSi'), coil('KD')) )),
    runL('KS','H4','amber'), runL('KD','H1','green'), S_(olt('F1'),lamp('H3','red')) )),
  faults:[{id:'KTc',kind:'burnt',l:{ar:'ملف التايمر KT محروق',en:'Timer KT coil burnt'}},{id:'KTd',kind:'open',l:{ar:'كونتاكت التايمر 17-18 تالف',en:'Timer contact 17-18 worn'}},{id:'KDh',kind:'open',l:{ar:'كونتاكت تثبيت KD 13-14 تالف',en:'KD holding contact 13-14 worn'}},fCoil('KD'),fHold('KM','KMh'),fF0,PF.phL3,PF.jam],
  trace:['F0','S0','F1c','S1','KMh','KMc','KDt','KTc','KTs','KDi','KSc','KTd','KDh','KSi','KDc'],
  steps:[
    {l:{ar:'S1 يشغّل KM والستار KS والتايمر KT مع بعض: الموتور يبدأ ستار بتيار أقل.',en:'S1 starts KM, star KS and timer KT together: the motor starts in star with less current.'},on:s=>s.k.KM&&s.k.KS},
    {l:{ar:'بعد الزمن: كونتاكت التايمر 15-16 يفصل KS، وبعدها 17-18 يشغّل KD (دلتا).',en:'After the time: timer contact 15-16 drops KS, then 17-18 starts KD (delta).'},on:s=>s.k.KD},
    {l:{ar:'KD يثبّت نفسه ويفصل التايمر. KS و KD عمرهم ما يشتغلوا مع بعض بسبب الإنترلوك.',en:'KD holds itself and drops the timer. KS and KD can never run together because of the interlock.'},on:s=>s.k.KD&&!(s.tim.KT&&s.tim.KT.on)},
    {l:{ar:'S0 أو الأوفرلود F1 يفصل الكل.',en:'S0 or overload F1 drops everything.'},on:s=>s.btn.S0===1}
  ],
  challenges:[
    {l:{ar:'شغّل الموتور وراقب الأمبير في الستار وبعدين في الدلتا.',en:'Start the motor and watch the current in star, then in delta.'},f:'star&delta'},
    {l:{ar:'اضبط التايمر على زمن قصير جدًا (1 ثانية): لاحظ قفزة التيار لما الدلتا تيجي بدري.',en:'Set the timer very short (1 s): see the current jump when delta comes too early.'},f:'earlyDelta'},
    {l:{ar:'جرّب عطل تثبيت KD وشوف الموتور بيروح ويجي بين ستار ودلتا.',en:'Try the KD holding fault and watch the motor hunt between star and delta.'},f:'hunt'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  hook:(dt,m)=>{ const mm=S.mot.M1;
    if(S.k.KM&&S.k.KS&&mm.speed>800) FLAGS.add('star');
    if(S.k.KM&&S.k.KD&&mm.state==='run') FLAGS.add('delta');
    if(S.k.KD&&!m.kd){ if(mm.speed<1250) FLAGS.add('earlyDelta'); m.sw=(m.sw||0)+1; if(m.sw>=3) FLAGS.add('hunt'); }
    if(!S.k.KM) m.sw=0; m.kd=!!S.k.KD; },
  explain:{ar:[
    'الموتور الكبير لو اشتغل مباشر يسحب 6 أو 7 أضعاف تياره. توصيلة الستار بتخلي الجهد على كل ملف 230 بدل 400، فالتيار ينزل للتلت تقريبًا. وبعد ما الموتور يلف، نحوله دلتا عشان ياخد قوته الكاملة.',
    'ثلاث كونتاكتورات: KM الرئيسي يغذي أول الملفات (U1 V1 W1). KS يقصر آخر الملفات (U2 V2 W2) مع بعض فيعمل نقطة النجمة. KD يوصل آخر الملفات بالفازات فيعمل دلتا.',
    'التايمر يتغذى مع KM و KS. بعد الزمن، كونتاكته المقفول يفصل الستار والمفتوح يشغل الدلتا. KS و KD متربطين إنترلوك، لأن لو اشتغلوا مع بعض يبقى شورت بين الفازات.',
    'الأوفرلود في خط KM فبيشوف تيار الملف بس، عشان كده يتضبط على تيار الموتور ÷ 1.73 (هنا 11 ÷ 1.73 = 6.4 أمبير).',
    'ضبط التايمر: الوقت اللي الموتور يوصل فيه تقريبًا لسرعته. لو قصير، الدلتا تيجي والموتور لسه بطيء فيسحب تيار كبير. لو طويل جدًا والحمل تقيل، الموتور يفضل في الستار ويسخن.'
  ],en:[
    'A large motor started direct draws 6 to 7 times its current. In star each winding sees 230 V instead of 400 V, so the current drops to about one third. Once the motor is turning we switch to delta for full power.',
    'Three contactors: main KM feeds the winding starts (U1 V1 W1). KS shorts the winding ends (U2 V2 W2) together to make the star point. KD connects the winding ends to the phases to make delta.',
    'The timer is fed with KM and KS. After the time, its NC contact drops star and its NO starts delta. KS and KD are interlocked, because together they would short the phases.',
    'The overload sits in the KM line and sees winding current only, so it is set to motor current ÷ 1.73 (here 11 ÷ 1.73 = 6.4 A).',
    'Timer setting: about the time the motor needs to reach speed. Too short, delta comes while the motor is slow and draws a big current. Too long with a heavy load, the motor stays in star and heats up.'
  ]},
  quiz:[
    {q:{ar:'موتور تياره 20 أمبير، ستار/دلتا، والأوفرلود في خط KM. تضبطه على كام؟',en:'A 20 A motor in star-delta, overload in the KM line. Set it to?'},o:[{ar:'20 أمبير',en:'20 A'},{ar:'11.5 أمبير',en:'11.5 A'},{ar:'6.7 أمبير',en:'6.7 A'}],a:1,w:{ar:'20 ÷ 1.73 = 11.5 أمبير.',en:'20 ÷ 1.73 = 11.5 A.'}},
    {q:{ar:'لو KS و KD اشتغلوا مع بعض؟',en:'If KS and KD close together?'},o:[{ar:'الموتور يلف أسرع',en:'The motor runs faster'},{ar:'شورت بين الفازات وقاطع Q1 يفصل',en:'Phase-to-phase short, Q1 trips'},{ar:'مفيش مشكلة',en:'No problem'}],a:1,w:{ar:'عشان كده الإنترلوك ضروري.',en:'That is why the interlock is essential.'}},
    {q:{ar:'الموتور بيبدأ ستار وعمره ما بيحول دلتا، والأوفرلود بيفصل بعد شوية. أول حاجة تشك فيها؟',en:'The motor starts in star, never changes to delta, and the overload trips later. First suspect?'},o:[{ar:'التايمر (ملفه أو كونتاكته)',en:'The timer (its coil or contact)'},{ar:'الكونتاكتور KM',en:'Contactor KM'},{ar:'زر الإيقاف',en:'The stop button'}],a:0,w:{ar:'التايمر هو اللي بيعمل التحويل.',en:'The timer makes the changeover.'}}
  ]
},
/* ---------- 3.3 conveyor line, 3 motors, E-stop ---------- */
{ key:'conv', unit:3, kind:'circuit', tpl:'three',
  name:{ar:'خط سيور بثلاث مواتير وزر طوارئ',en:'Three-conveyor line with E-stop'},
  buttons:[{btn:'S1',color:'green',face:'I',l:{ar:'تشغيل الخط',en:'Start line'}},{btn:'S2',color:'red',face:'O',l:{ar:'إيقاف',en:'Stop'}},{btn:'S0',color:'red',kind:'estop',face:'',l:{ar:'طوارئ',en:'E-stop'}}],
  lamps:[{id:'H1',color:'green',l:{ar:'الخط كله شغال',en:'Line running'}},{id:'H5',color:'red',l:{ar:'طوارئ مضغوط',en:'E-stop pressed'}},LP.H3a],
  desc:{S0:{ar:'زر الطوارئ: كونتاكت مقفول على التوالي قبل كل حاجة',en:'E-stop: an NC contact in series ahead of everything'},S0n:{ar:'كونتاكت مفتوح في زر الطوارئ للمبة',en:'E-stop NO contact for the lamp'}},
  tree:S_(fuse0(), SP( S_(pbnc('S0','S0','11','12'), pbnc('S2'), olc('F3'), olc('F2'), olc('F1'), P_(pbno('S1'), no('K3','13','14','K3h')), SP(
      S_(coil('K3')),
      S_(nc('K2','21','22','K2t'), tcoil('KT1',4)),
      S_(P_(tno('KT1','KT1d'), no('K2','13','14','K2h')), coil('K2')),
      S_(no('K2','53','54','K2s'), nc('K1','21','22','K1t'), tcoil('KT2',4)),
      S_(P_(tno('KT2','KT2d'), no('K1','13','14','K1h')), coil('K1')) )),
    runL('K1','H1','green'), S_(pbno('S0','S0n'),lamp('H5','red')), tripL('F1','F2','F3') )),
  faults:[{id:'KT1c',kind:'burnt',l:{ar:'ملف التايمر KT1 محروق',en:'Timer KT1 coil burnt'}},{id:'K2s',kind:'open',l:{ar:'كونتاكت K2 53-54 تالف',en:'K2 contact 53-54 worn'}},fHold('K1'),fCoil('K3'),{id:'S0',kind:'open',l:{ar:'سلك فالت عند زر الطوارئ',en:'Loose wire at the E-stop'}},fF0,PF.phL3],
  trace:['F0','S0','S2','F3c','F2c','F1c','S1','K3h','K3c','K2t','KT1c','KT1d','K2h','K2c','K2s','K1t','KT2c','KT2d','K1h','K1c'],
  steps:[
    {l:{ar:'S1 يشغّل آخر سير (M3) أولًا، عشان أي خامة تيجي عليه تلاقيه ماشي.',en:'S1 starts the last conveyor (M3) first, so material always lands on a moving belt.'},on:s=>s.k.K3&&!s.k.K2},
    {l:{ar:'بعد زمن KT1 يشتغل السير الأوسط M2.',en:'After KT1, the middle conveyor M2 starts.'},on:s=>s.k.K2&&!s.k.K1},
    {l:{ar:'بعد زمن KT2 يشتغل أول سير M1 والخط كله يبقى شغال.',en:'After KT2, the first conveyor M1 starts and the whole line runs.'},on:s=>s.k.K1},
    {l:{ar:'زر الطوارئ يفصل كل حاجة في الحال، ويفضل مضغوط لحد ما تلفه. وبعد ما تلفه، الخط ما يشتغلش لوحده.',en:'The E-stop drops everything at once and stays latched until you twist it. After release, the line does not restart by itself.'},on:s=>s.btn.S0===1}
  ],
  challenges:[
    {l:{ar:'شغّل الخط ولاحظ ترتيب التشغيل: M3 ثم M2 ثم M1.',en:'Start the line and watch the order: M3, then M2, then M1.'},f:'seqOK'},
    {l:{ar:'والخط شغال اضغط الطوارئ: كل حاجة تقف.',en:'With the line running, press the E-stop: everything stops.'},f:'estop'},
    {l:{ar:'فك الطوارئ (اضغطه تاني) ولاحظ إن الخط ما بيرجعش لوحده.',en:'Release the E-stop (press it again) and see the line does not restart by itself.'},f:'noRestart'},
    {l:{ar:'افصل أوفرلود M2 (زوّد الحمل): ليه الخط كله بيقف؟',en:'Trip the M2 overload (raise the load): why does the whole line stop?'},f:'olAll'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  hook:(dt,m)=>{ if(S.k.K1&&S.k.K2&&S.k.K3&&m.order) FLAGS.add('seqOK'); if(S.k.K3&&!S.k.K2&&!S.k.K1) m.order=1; if(!S.k.K3) m.order=0;
    if(S.k.K1) m.full=1; if(m.full&&S.btn.S0===1&&!S.k.K3){ FLAGS.add('estop'); m.es=1; m.full=0; }
    if(m.es&&S.btn.S0!==1){ m.es=0; m.rel=S.time; } if(m.rel&&S.time-m.rel>1.5){ if(!S.k.K3) FLAGS.add('noRestart'); m.rel=0; }
    if(m.full&&S.ol.F2&&S.ol.F2.trip&&!S.k.K1&&!S.k.K3) FLAGS.add('olAll'); },
  explain:{ar:[
    'في خط سيور، السير الأخير لازم يشتغل الأول. لو بدأنا بالأول، الخامة هتتكوم على سير واقف. عشان كده الترتيب M3 ثم M2 ثم M1، بتايمرين.',
    'كل الأوفرلودات متوصلة على التوالي قبل الدايرة كلها، فلو أي موتور فصل، الخط كله يقف. ده بيمنع التكويم برضه.',
    'زر الطوارئ (رأس فطر أحمر على أرضية صفراء) كونتاكته مقفول ومتوصل أول حاجة بعد الفيوز. بيفضل مضغوط لحد ما تلفه، وبعد ما تلفه الخط لازم يتشغل من الأول بزر التشغيل.',
    'في الماكينات الحقيقية زر الطوارئ بيروح لريلاي أمان (Safety relay) مش لدايرة التحكم مباشرة، بس الفكرة هي هي: يفصل الكل ومايرجعش لوحده.'
  ],en:[
    'On a conveyor line the last belt must start first. If the first starts first, material piles up on a stopped belt. So the order is M3, M2, M1, using two timers.',
    'All the overloads are in series ahead of the whole circuit, so if any motor trips, the whole line stops. That also prevents pile-ups.',
    'The E-stop (red mushroom on a yellow base) has an NC contact wired first after the fuse. It stays latched until twisted, and after release the line must be started again with the start button.',
    'On real machines the E-stop goes to a safety relay rather than straight into the control circuit, but the idea is the same: drop everything and never restart by itself.'
  ]},
  quiz:[
    {q:{ar:'ليه السير الأخير بيشتغل الأول؟',en:'Why does the last conveyor start first?'},o:[{ar:'عشان الخامة ما تتكومش على سير واقف',en:'So material never piles onto a stopped belt'},{ar:'عشان تيار البدء',en:'Because of starting current'},{ar:'مفيش سبب',en:'No reason'}],a:0,w:{ar:'كل سير لازم يلاقي اللي بعده ماشي.',en:'Each belt must find the next one already moving.'}},
    {q:{ar:'بعد فك زر الطوارئ، الخط المفروض:',en:'After the E-stop is released, the line should:'},o:[{ar:'يرجع يشتغل لوحده',en:'Restart by itself'},{ar:'يفضل واقف لحد ما حد يضغط تشغيل',en:'Stay stopped until someone presses start'}],a:1,w:{ar:'رجوع الماكينة لوحدها خطر على اللي واقف جنبها.',en:'A machine restarting by itself endangers whoever stands near it.'}}
  ]
}
);
/* ================= Unit 4: limit switches and floats ================= */
const lsno=(ls,id,a,b)=>E(id,'lsNO',ls,{ls,t:[a||'13',b||'14']});
const lsnc=(ls,id,a,b)=>E(id,'lsNC',ls,{ls,t:[a||'21',b||'22']});
const flno=(fl,id,a,b)=>E(id,'flNO',fl,{fl,t:[a||'13',b||'14']});
const flnc=(fl,id,a,b)=>E(id,'flNC',fl,{fl,t:[a||'21',b||'22']});
const selh=id=>E(id||'S5h','selH','S5',{t:['13','14']});
const sela=id=>E(id||'S5a','selA','S5',{t:['23','24']});
const PR={x:0.5,lt:0.35,lw:0.8,use:0.02,feed:0.02,dry:false,over:false};

CIRCUITS.push(
/* ---------- 4.1 auto reverse with limit switches ---------- */
{ key:'auto', unit:4, kind:'circuit', tpl:'rev', machine:'carriage',
  name:{ar:'ذهاب وعودة أوتوماتيك بليمت سويتش',en:'Automatic back-and-forth with limit switches'},
  buttons:[{btn:'S1',color:'green',face:'→',l:{ar:'يمين',en:'Right'}},{btn:'S2',color:'green',face:'←',l:{ar:'شمال',en:'Left'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف',en:'Stop'}}],
  lamps:[{id:'H1',color:'green',l:{ar:'رايح يمين',en:'Moving right'}},{id:'H4',color:'blue',l:{ar:'راجع شمال',en:'Moving left'}},LP.H3a],
  desc:{S7c:{ar:'ليمت سويتش آخر اليمين: المقفول يوقف الذهاب',en:'Right end limit: NC stops travel right'},S7o:{ar:'ليمت سويتش آخر اليمين: المفتوح يبدأ الرجوع',en:'Right end limit: NO starts travel left'},S6c:{ar:'ليمت سويتش آخر الشمال: المقفول يوقف الرجوع',en:'Left end limit: NC stops travel left'},S6o:{ar:'ليمت سويتش آخر الشمال: المفتوح يبدأ الذهاب',en:'Left end limit: NO starts travel right'}},
  tree:S_(fuse0(), SP( S_(pbnc('S0'), olc('F1'), SP(
      S_(P_(pbno('S1'), lsno('S6','S6o'), no('K1','13','14','K1h')), lsnc('S7','S7c'), nc('K2','21','22','K2i'), coil('K1')),
      S_(P_(pbno('S2'), lsno('S7','S7o'), no('K2','13','14','K2h')), lsnc('S6','S6c'), nc('K1','21','22','K1i'), coil('K2')) )),
    runL('K1','H1','green'), runL('K2','H4','blue'), tripL('F1') )),
  faults:[{id:'S7c',kind:'stuck',l:{ar:'ليمت سويتش S7 اتكسر ومش بيفتح',en:'Limit switch S7 broken, never opens'}},{id:'S6o',kind:'open',l:{ar:'كونتاكت S6 المفتوح تالف',en:'S6 NO contact worn'}},fHold('K2'),fCoil('K2'),{id:'K1i',kind:'open',l:{ar:'كونتاكت الإنترلوك K1 21-22 تالف',en:'Interlock K1 21-22 worn'}},fF0,PF.phL3],
  trace:['F0','S0','F1c','S1','S6o','K1h','S7c','K2i','K1c','S2','S7o','K2h','S6c','K1i','K2c'],
  reset(){ S.ls={S6:false,S7:false}; PR.x=0.5; },
  process(dt){ const m=S.mot.M1, v=m.speed/1450*0.1; PR.x+=v*dt;
    if(PR.x>1.04){ PR.x=1.04; if(m.speed>=0) m.endJam=true; } if(PR.x<-0.04){ PR.x=-0.04; if(m.speed<=0) m.endJam=true; }
    const d=PW&&PW.motors.M1.dir; if(m.endJam&&((PR.x>=1.04&&d<0)||(PR.x<=-0.04&&d>0)||PW.motors.M1.n<2)) m.endJam=false;
    S.ls.S7=PR.x>=0.985; S.ls.S6=PR.x<=0.015; },
  tile:()=>({k:{ar:'مكان العربة',en:'Carriage position'},v:Math.round(Math.max(0,Math.min(1,PR.x))*100)+' %'}),
  procUI(pc){ pc.innerHTML=`<h2>${LANG==='ar'?'العربة':'The carriage'}</h2><div class="trk"><i id="cgT"></i></div><p class="note" id="cgN"></p>`; },
  procRefresh(){ const t=$('#cgT'); if(t) t.style.left=(Math.max(0,Math.min(1,PR.x))*88)+'%'; const n=$('#cgN'); if(n) n.textContent=(S.ls.S6?'S6 ✓  ':'')+(S.ls.S7?'S7 ✓  ':'')+(S.mot.M1.endJam?(LANG==='ar'?'العربة خبطت في آخر السكة!':'Carriage hit the end stop!'):''); },
  steps:[
    {l:{ar:'S1 يشغّل K1 والعربة تمشي يمين.',en:'S1 starts K1 and the carriage moves right.'},on:s=>s.k.K1},
    {l:{ar:'العربة توصل S7: المقفول يفصل K1، والمفتوح يشغّل K2 فترجع شمال لوحدها.',en:'At S7 the NC drops K1 and the NO starts K2, so it returns left by itself.'},on:s=>s.k.K2},
    {l:{ar:'عند S6 نفس الحكاية بالعكس، والعربة تفضل رايحة جاية لحد ما تضغط S0.',en:'At S6 the same in reverse, and the carriage keeps cycling until you press S0.'},on:s=>s.btn.S0===1}
  ],
  challenges:[
    {l:{ar:'شغّل العربة وسيبها تعمل لفة كاملة رايح جاي لوحدها.',en:'Start the carriage and let it do a full cycle by itself.'},f:'cycle'},
    {l:{ar:'جرّب عطل S7 المكسور: العربة تخبط في الآخر والأوفرلود يفصل.',en:'Try the broken S7 fault: the carriage hits the end and the overload trips.'},f:'endTrip'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  hook:(dt,m)=>{ if(S.k.K2&&m.r) m.l=1; if(S.k.K1&&!m.r) m.r=1; if(m.l&&S.k.K1&&S.ls.S6) FLAGS.add('cycle'); if(S.mot.M1.endJam) m.j=1; if(m.j&&S.ol.F1.trip) FLAGS.add('endTrip'); },
  explain:{ar:[
    'الليمت سويتش مفتاح بيتداس عليه بحاجة ماشية، زي عربة أو باب. هنا عندنا اتنين: S6 في آخر الشمال و S7 في آخر اليمين.',
    'كل ليمت سويتش فيه كونتاكتين: مقفول بيوقف الحركة اللي رايحة ناحيته، ومفتوح بيبدأ الحركة العكسية. فالعربة ترجع لوحدها من غير ما حد يلمس زرار.',
    'الإنترلوك بين K1 و K2 لسه موجود، لأن لحظة التحويل لازم K1 يفصل الأول قبل K2 ما يقفل.',
    'لو الليمت سويتش اتكسر، العربة تكمّل وتخبط في آخر السكة والموتور يتزنق. عشان كده في الماكينات الحقيقية بيحطوا ليمت سويتش تاني بعده للأمان (Over-travel).'
  ],en:[
    'A limit switch is pressed by something moving, like a carriage or a door. Here there are two: S6 at the left end and S7 at the right end.',
    'Each has two contacts: the NC stops the travel towards it and the NO starts the opposite travel. So the carriage returns by itself with nobody touching a button.',
    'The K1/K2 interlock is still there, because at changeover K1 must drop before K2 closes.',
    'If a limit switch breaks, the carriage carries on into the end stop and the motor stalls. That is why real machines add a second over-travel limit switch beyond it.'
  ]},
  quiz:[
    {q:{ar:'العربة وصلت S7 ووقفت لكن ما رجعتش. الأقرب؟',en:'The carriage reached S7 and stopped but did not return. Most likely?'},o:[{ar:'كونتاكت S7 المفتوح أو ملف K2',en:'S7 NO contact or the K2 coil'},{ar:'كونتاكت S7 المقفول',en:'S7 NC contact'},{ar:'زر S0',en:'Button S0'}],a:0,w:{ar:'المقفول اشتغل (وقفت)، فالمشكلة في بدء الرجوع.',en:'The NC worked (it stopped), so the fault is in starting the return.'}},
    {q:{ar:'ليه الليمت اللي بيوقف الحركة بيكون كونتاكت مقفول؟',en:'Why is the stopping limit an NC contact?'},o:[{ar:'لو السلك اتقطع الحركة تقف، فده أأمن',en:'A broken wire stops the travel, which is safer'},{ar:'أرخص',en:'It is cheaper'}],a:0,w:{ar:'المقفول يفشل ناحية الأمان.',en:'An NC fails safe.'}}
  ]
},
/* ---------- 4.2 float pump hand/auto with dry-run protection ---------- */
{ key:'pump', unit:4, kind:'circuit', tpl:'dol', machine:'pump', selector:true, sel0:'0',
  name:{ar:'طلمبة بالعوامة يدوي/أوتو وحماية من الناشف',en:'Float pump hand/auto with dry-run protection'},
  buttons:[],
  lamps:[{id:'H1',color:'green',l:{ar:'الطلمبة شغالة',en:'Pump running'}},{id:'H6',color:'blue',l:{ar:'الخزان مليان',en:'Tank full'}},{id:'H5',color:'red',l:{ar:'مفيش مية في البير',en:'Well dry'}},LP.H3a],
  desc:{B1c:{ar:'عوامة الخزان: مقفولة لما الخزان محتاج مية',en:'Tank float: closed while the tank needs water'},B2o:{ar:'عوامة البير: مقفولة طول ما فيه مية (حماية من الناشف)',en:'Well float: closed while there is water (dry-run protection)'},S5h:{ar:'مفتاح الاختيار على يدوي',en:'Selector on Hand'},S5a:{ar:'مفتاح الاختيار على أوتو',en:'Selector on Auto'}},
  tree:S_(fuse0(), SP( S_(olc('F1'), flno('B2','B2o'), P_( S_(selh()), S_(sela(), flnc('B1','B1c')) ), coil('K1')),
    runL('K1','H1','green'), S_(flno('B1','B1o','13','14'),lamp('H6','blue')), S_(flnc('B2','B2c','21','22'),lamp('H5','red')), tripL('F1') )),
  faults:[{id:'B2o',kind:'stuck',l:{ar:'عوامة البير متزنقة فوق (الحماية مش شغالة)',en:'Well float stuck up (protection lost)'}},{id:'B1c',kind:'stuck',l:{ar:'عوامة الخزان متزنقة تحت',en:'Tank float stuck down'}},{id:'S5a',kind:'open',l:{ar:'كونتاكت الأوتو في مفتاح الاختيار تالف',en:'Selector Auto contact worn'}},fCoil('K1'),fF0,PF.phL3],
  trace:['F0','F1c','B2o','S5h','S5a','B1c','K1c'],
  reset(){ S.fl={B1:false,B2:true}; PR.lt=0.35; PR.lw=0.8; PR.dry=false; PR.over=false; },
  process(dt){ const m=S.mot.M1, run=m.speed>300&&PR.lw>0.02;
    const q=run?0.05*m.speed/1450:0;
    PR.lt=Math.min(1,Math.max(0,PR.lt+(q-PR.use)*dt)); PR.lw=Math.min(1,Math.max(0,PR.lw+(PR.feed-q*0.8)*dt));
    if(PR.lt>=0.999&&q>0) PR.over=true; PR.dry=m.speed>300&&PR.lw<=0.02;
    if(PR.lt>=0.9) S.fl.B1=true; if(PR.lt<=0.3) S.fl.B1=false;
    if(PR.lw<=0.12) S.fl.B2=false; if(PR.lw>=0.3) S.fl.B2=true; },
  tile:()=>({k:{ar:'الخزان / البير',en:'Tank / well'},v:Math.round(PR.lt*100)+' / '+Math.round(PR.lw*100)+' %'}),
  procUI(pc){ pc.innerHTML=`<h2>${LANG==='ar'?'المية':'The water'}</h2>`;
    mkSlider(pc,'prU',{ar:'استهلاك البيت من الخزان',en:'House use from the tank'},0,0.05,0.005,PR.use,v=>Math.round(v*1000)/10+' %/s',v=>{PR.use=v;});
    mkSlider(pc,'prF',{ar:'المية الداخلة للبير',en:'Water flowing into the well'},0,0.05,0.005,PR.feed,v=>Math.round(v*1000)/10+' %/s',v=>{PR.feed=v;});
    const n=document.createElement('p'); n.className='note'; n.id='prN'; pc.appendChild(n); },
  procRefresh(){ const n=$('#prN'); if(n){ n.textContent=PR.dry?(LANG==='ar'?'الطلمبة شغالة على الناشف!':'The pump is running dry!'):PR.over?(LANG==='ar'?'الخزان فاض!':'The tank overflowed!'):''; n.style.color=(PR.dry||PR.over)?'var(--alarm)':''; } },
  steps:[
    {l:{ar:'حط مفتاح الاختيار S5 على أوتو.',en:'Put selector S5 on Auto.'},on:s=>s.sel==='A'},
    {l:{ar:'الخزان ناقص، فعوامة B1 مقفولة والطلمبة تشتغل.',en:'The tank is low, so float B1 is closed and the pump runs.'},on:s=>s.k.K1&&s.sel==='A'},
    {l:{ar:'الخزان يتملي، B1 تفتح والطلمبة تقف، وترجع تشتغل لما المية تنزل.',en:'The tank fills, B1 opens and the pump stops, then restarts when the level falls.'},on:s=>s.sel==='A'&&s.fl.B1},
    {l:{ar:'لو البير نشف، عوامة B2 تفصل الطلمبة في اليدوي والأوتو.',en:'If the well runs dry, float B2 stops the pump in Hand and Auto.'},on:s=>!s.fl.B2}
  ],
  challenges:[
    {l:{ar:'شغّل على أوتو واستنى الطلمبة تقف لوحدها لما الخزان يتملي.',en:'Run on Auto and wait for the pump to stop by itself when the tank fills.'},f:'autoStop'},
    {l:{ar:'قفّل المية الداخلة للبير، وشوف حماية الناشف بتفصل الطلمبة.',en:'Shut off the well inflow and watch the dry-run protection stop the pump.'},f:'dryStop'},
    {l:{ar:'جرّب عطل عوامة البير المتزنقة: الطلمبة تشتغل على الناشف.',en:'Try the stuck well float: the pump runs dry.'},f:'dryRun'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  hook:(dt,m)=>{ if(S.sel==='A'&&S.k.K1) m.a=1; if(m.a&&S.sel==='A'&&!S.k.K1&&S.fl.B1) FLAGS.add('autoStop'); if(S.k.K1) m.r=1; if(m.r&&!S.fl.B2&&!S.k.K1) FLAGS.add('dryStop'); if(PR.dry) FLAGS.add('dryRun'); },
  explain:{ar:[
    'العوامة مفتاح بيتحرك مع مستوى المية. عوامة الكابل بتتقلب لما المية تعلى، فالكونتاكت يتغير. وبين القلبة فوق والقلبة تحت فرق، وده بيمنع الطلمبة تفصل وتشتغل كل ثانية.',
    'B1 في الخزان اللي فوق: كونتاكتها المقفول بيشغل الطلمبة طول ما الخزان ناقص، ويفتح لما يتملي.',
    'B2 في البير: كونتاكتها المفتوح مقفول طول ما فيه مية. لو المية نزلت تحت، يفتح ويفصل الطلمبة حتى في اليدوي. الطلمبة لو اشتغلت على الناشف السيل بتاعها يتحرق.',
    'مفتاح الاختيار S5: يدوي يشغل الطلمبة على طول (والحماية من الناشف شغالة)، أوتو يخلي العوامة هي اللي تتحكم، وصفر يوقف.'
  ],en:[
    'A float switch follows the water level. A cable float tilts as the water rises and its contact changes. There is a gap between the up and down tilt points, which stops the pump from cycling every second.',
    'B1 is in the upper tank: its NC runs the pump while the tank is low and opens when it is full.',
    'B2 is in the well: its NO is closed while there is water. If the level drops, it opens and stops the pump even in Hand. A pump that runs dry burns its seal.',
    'Selector S5: Hand runs the pump continuously (dry-run protection still active), Auto lets the float control it, and 0 stops it.'
  ]},
  quiz:[
    {q:{ar:'الطلمبة مش بتشتغل في الأوتو ولا اليدوي، والخزان فاضي. أول حاجة تبص عليها؟',en:'The pump will not run in Auto or Hand, and the tank is empty. First check?'},o:[{ar:'عوامة البير B2 ومستوى المية في البير',en:'Well float B2 and the well level'},{ar:'عوامة الخزان B1',en:'Tank float B1'},{ar:'كونتاكت الأوتو',en:'The Auto contact'}],a:0,w:{ar:'B2 متوصلة قبل اليدوي والأوتو الاتنين.',en:'B2 sits ahead of both Hand and Auto.'}},
    {q:{ar:'ليه عوامة الخزان بتشتغل بكونتاكت مقفول (NC)؟',en:'Why does the tank float use an NC contact?'},o:[{ar:'عشان الطلمبة تشتغل لما المية ناقصة وتقف لما تتملي',en:'So the pump runs while low and stops when full'},{ar:'عشان تحمي من الناشف',en:'For dry-run protection'}],a:0,w:{ar:'المقفول بيفتح لما العوامة تتقلب فوق.',en:'The NC opens when the float tilts up.'}}
  ]
}
);
/* ================= Unit 5: more timers, star-delta and nice circuits ================= */
const tcoilOff=(ref,pre)=>E(ref+'c','tcoil',ref,{ref,pre,off:true});
const sn=(id)=>E(id||'BSo','snNO','BS',{ls:'BS',t:['13','14']});
function motor6(g,cx,cy,xs,live,cur){ // motor with 6 terminals, top at cy-40, bottom at cy+40
  sv('rect',{x:xs[0]-16,y:cy-46,width:xs[2]-xs[0]+32,height:92,rx:8,class:'sym'},g);
  const mc=sv('circle',{cx,cy,r:28,class:'sym'},g);
  txt(g,cx,cy-4,'M','tag','middle'); txt(g,cx,cy+12,'3~','tag','middle');
  const rot=sv('g',{},g); for(let k=0;k<3;k++) sv('path',{d:`M${cx} ${cy-22} a22 22 0 0 1 12 4`,stroke:'#e9a640','stroke-width':3,fill:'none','stroke-linecap':'round',transform:`rotate(${k*120} ${cx} ${cy})`},rot);
  ['U1','V1','W1'].forEach((u,i)=>{ sv('circle',{cx:xs[i],cy:cy-40,r:3,class:'sym'},g); txt(g,xs[i]+4,cy-48,u,'trm'); });
  ['U2','V2','W2'].forEach((u,i)=>{ sv('circle',{cx:xs[i],cy:cy+40,r:3,class:'sym'},g); txt(g,xs[i]+4,cy+56,u,'trm'); });
  txt(g,xs[0]-58,cy+4,'M1','tag');
  UPD.power.push(()=>{ const mm=S.mot.M1; rot.setAttribute('transform',`rotate(${mm.state==='hum'?Math.sin(S.time*60)*4:mm.ang} ${cx} ${cy})`); rot.style.opacity=Math.abs(mm.speed)>2||mm.state==='hum'?1:.35;
    mc.setAttribute('stroke',mm.state==='run'||mm.state==='start'?'#5fd08b':['hum','jam'].includes(mm.state)?'#ff5d50':'#b9c7c4'); });
}
/* star-delta with reversing: KM1 fwd, KM2 rev (L1<->L3), then KS / KD after the line contactors */
TPLS.sdr={ motors:['M1'], ols:{F1:'M1'}, olOf:{KM1:'F1'}, w:360, h:800,
  state(){ const p0=sup(), p1=p0.map(v=>v&&S.q1), A=!!S.k.KM1, B=!!S.k.KM2, Dl=!!S.k.KD, St=!!S.k.KS;
    const a=p1.map(v=>v&&A), b=p1.map(v=>v&&B), m=[a[0]||b[2],a[1]||b[1],a[2]||b[0]];
    const d=m.map(v=>v&&Dl), on=(A||B)&&!(A&&B);
    const star=on&&St&&!Dl, delta=on&&Dl&&!St;
    const bt=[d[1],d[2],d[0]].map((v,i)=>v||m[i]);
    const n=star?cnt(m):delta?cnt(m):0, dir=A&&!B?1:B&&!A?-1:0;
    return {p0,p1,a,b,m,d,bt,star,delta,sp:St&&bt.some(Boolean),short:((A&&B)||(St&&Dl&&on))&&cnt(p1)>=2,
      motors:{M1:{v:m,n:dir?n:0,tf:star?1/3:1,dir,sync:1500}},
      olCur:{F1:()=>star||!delta?S.mot.M1.cur:S.mot.M1.cur/1.732}}; },
  draw(g){
    const xs=[120,150,180], xr=[240,270,300], xd=[240,270,300], cy=560;
    const run=()=>PW.motors.M1.n>=2&&S.mot.M1.cur>0.1;
    const cA=i=>run()&&S.k.KM1&&PW.a[i], cB=j=>run()&&S.k.KM2&&PW.b[j], cM=i=>run()&&PW.m[i];
    const cD=i=>run()&&PW.delta&&PW.d[i], cS=()=>run()&&PW.star;
    ['L1','L2','L3'].forEach((l,i)=>txt(g,xs[i],22,l,'tag','middle'));
    xs.forEach((x,i)=>{ pw(g,[[x,30],[x,70]],()=>PW.p0[i],()=>cA(i)||cB(i)); pw(g,[[x,122],[x,190]],()=>PW.p1[i],()=>cA(i)||cB(i)); });
    breaker3(g,xs,70,i=>PW.p0[i],i=>PW.p1[i],i=>cA(i)||cB(i));
    xs.forEach((x,i)=>{ const y=140+i*10; pw(g,[[x,y],[xr[i],y],[xr[i],190]],()=>PW.p1[i],()=>cB(i)); sv('circle',{cx:x,cy:y,r:2.6,fill:'#b9c7c4'},g); });
    contact3(g,xs,190,'KM1',()=>!!S.k.KM1,i=>PW.p1[i],i=>PW.a[i],cA,1);
    contact3(g,xr,190,'',()=>!!S.k.KM2,i=>PW.p1[i],i=>PW.b[i],cB,1); txt(g,xr[2]+12,220,'KM2','tag');
    xs.forEach((x,i)=>{ const jy=262+i*10; pw(g,[[x,242],[x,jy]],()=>PW.a[i],()=>cA(i)); pw(g,[[x,jy],[x,300]],()=>PW.m[i],()=>cM(i)); sv('circle',{cx:x,cy:jy,r:2.6,fill:'#b9c7c4'},g); });
    xr.forEach((x,j)=>{ const tI=2-j, jy=262+tI*10; pw(g,[[x,242],[x,jy],[xs[tI],jy]],()=>PW.b[j],()=>cB(j)); });
    txt(g,xr[2]+10,272,'L1↔L3','trm');
    thermal3(g,xs,300,'F1',i=>PW.m[i],cM);
    xs.forEach((x,i)=>{ const ty=360+i*10; pw(g,[[x,344],[x,ty]],()=>PW.m[i],()=>cM(i)); pw(g,[[x,ty],[x,cy-40]],()=>PW.m[i],()=>cM(i)&&!cD(i)||cM(i));
      pw(g,[[x,ty],[xd[i],ty],[xd[i],400]],()=>PW.m[i],()=>cD(i)); sv('circle',{cx:x,cy:ty,r:2.6,fill:'#b9c7c4'},g); });
    contact3(g,xd,400,'',()=>!!S.k.KD,i=>PW.m[i],i=>PW.d[i],cD,1); txt(g,xd[2]+12,430,'KD Δ','tag');
    motor6(g,150,cy,xs,i=>PW.m[i],cM);
    const tapY=[650,670,630], kdOf=[1,2,0];
    xs.forEach((x,i)=>{ pw(g,[[x,cy+40],[x,tapY[i]]],()=>PW.bt[i],()=>cS()||cD(kdOf[i])); pw(g,[[x,tapY[i]],[x,690]],()=>PW.bt[i],()=>cS());
      sv('circle',{cx:x,cy:tapY[i],r:2.6,fill:'#b9c7c4'},g);
      const j=kdOf[i]; pw(g,[[xd[j],452],[xd[j],tapY[i]],[x,tapY[i]]],()=>PW.d[j],()=>cD(j)); });
    contact3(g,xs,690,'KS',()=>!!S.k.KS,i=>PW.bt[i],()=>PW.sp,()=>cS(),1); txt(g,xs[0]-46,736,'Y','tag');
    pw(g,[[xs[0],742],[xs[0],758],[xs[2],758],[xs[2],742]],()=>PW.sp,()=>cS()); pw(g,[[xs[1],742],[xs[1],758]],()=>PW.sp,()=>cS());
    const md=txt(g,270,cy-6,'','tag','middle'), dt=txt(g,270,cy+14,'','trm','middle');
    UPD.power.push(()=>{ const mm=S.mot.M1; md.textContent=PW.star?(LANG==='ar'?'ستار Y':'STAR Y'):PW.delta?(LANG==='ar'?'دلتا Δ':'DELTA Δ'):''; md.style.fill=PW.star?'#ffc629':'#5fd08b';
      dt.textContent=Math.abs(mm.speed)>5?Math.round(Math.abs(mm.speed))+' rpm '+(mm.speed>0?'↻':'↺'):''; });
  }};
/* Dahlander 2-speed: KL low (feeds U1V1W1, delta), KH high (feeds U2V2W2) + KY (shorts U1V1W1, YY) */
TPLS.dahl={ motors:['M1'], ols:{F1:'M1',F2:'M1'}, olOf:{KL:'F1',KH:'F2'}, w:400, h:640,
  state(){ const p0=sup(), p1=p0.map(v=>v&&S.q1), L=!!S.k.KL, H=!!S.k.KH, Y=!!S.k.KY;
    const l=p1.map(v=>v&&L), h=p1.map(v=>v&&H);
    const low=L&&!H&&!Y, high=H&&Y&&!L;
    const n=low?cnt(l):high?cnt(h):0;
    return {p0,p1,l,h,low,high,yp:Y&&(high||l.some(Boolean)),short:L&&(Y||H)&&cnt(p1)>=2,
      motors:{M1:{v:low?l:h,n,tf:1,dir:n?1:0,sync:high?3000:1500}},
      olCur:{F1:()=>low?S.mot.M1.cur:0,F2:()=>high?S.mot.M1.cur:0}}; },
  draw(g){
    const xs=[150,180,210], xh=[270,300,330], xk=[50,80,110], cy=470;
    const run=()=>PW.motors.M1.n>=2&&S.mot.M1.cur>0.1;
    const cL=i=>run()&&PW.low&&PW.l[i], cH=i=>run()&&PW.high&&PW.h[i], cY=()=>run()&&PW.high;
    ['L1','L2','L3'].forEach((l,i)=>txt(g,xs[i],22,l,'tag','middle'));
    xs.forEach((x,i)=>{ pw(g,[[x,30],[x,70]],()=>PW.p0[i],()=>cL(i)||cH(i)); pw(g,[[x,122],[x,190]],()=>PW.p1[i],()=>cL(i)||cH(i)); });
    breaker3(g,xs,70,i=>PW.p0[i],i=>PW.p1[i],i=>cL(i)||cH(i));
    xs.forEach((x,i)=>{ const y=140+i*10; pw(g,[[x,y],[xh[i],y],[xh[i],190]],()=>PW.p1[i],()=>cH(i)); sv('circle',{cx:x,cy:y,r:2.6,fill:'#b9c7c4'},g); });
    contact3(g,xs,190,'',()=>!!S.k.KL,i=>PW.p1[i],i=>PW.l[i],cL,1); txt(g,xs[0]-52,214,'KL','tag'); txt(g,xs[0]-52,230,LANG==='ar'?'بطيء':'low','trm');
    contact3(g,xh,190,'',()=>!!S.k.KH,i=>PW.p1[i],i=>PW.h[i],cH,1); txt(g,xh[2]+12,214,'KH','tag'); txt(g,xh[2]+12,230,LANG==='ar'?'سريع':'high','trm');
    xs.forEach((x,i)=>pw(g,[[x,242],[x,262]],()=>PW.l[i],()=>cL(i)));
    thermal3(g,xs,262,'F1',i=>PW.l[i],cL);
    xh.forEach((x,i)=>pw(g,[[x,242],[x,262]],()=>PW.h[i],()=>cH(i)));
    thermal3(g,xh,262,'F2',i=>PW.h[i],cH);
    // U1V1W1: from KL (via F1) and the KY taps
    const top=i=>PW.l[i]||PW.high;
    xs.forEach((x,i)=>{ const ty=330+i*10; pw(g,[[x,306],[x,ty]],()=>PW.l[i],()=>cL(i)); pw(g,[[x,ty],[x,cy-40]],()=>top(i),()=>cL(i)||cY());
      pw(g,[[x,ty],[xk[i],ty],[xk[i],360]],()=>top(i),()=>cY()); sv('circle',{cx:x,cy:ty,r:2.6,fill:'#b9c7c4'},g); });
    contact3(g,xk,360,'',()=>!!S.k.KY,i=>top(i),()=>PW.yp,()=>cY(),1); txt(g,xk[0]-6,354,'KY','tag','end');
    pw(g,[[xk[0],412],[xk[0],426],[xk[2],426],[xk[2],412]],()=>PW.yp,()=>cY()); pw(g,[[xk[1],412],[xk[1],426]],()=>PW.yp,()=>cY());
    motor6(g,180,cy,xs,i=>top(i),i=>cL(i)||cH(i));
    // U2V2W2 from KH via F2
    xh.forEach((x,i)=>{ const by=560+i*16; pw(g,[[x,306],[x,by],[xs[i],by],[xs[i],cy+40]],()=>PW.h[i]||PW.low,()=>cH(i)); });
    const md=txt(g,300,cy-6,'','tag','middle'), dt=txt(g,300,cy+14,'','trm','middle');
    UPD.power.push(()=>{ const mm=S.mot.M1; md.textContent=PW.low?(LANG==='ar'?'بطيء Δ':'LOW Δ'):PW.high?(LANG==='ar'?'سريع YY':'HIGH YY'):''; md.style.fill=PW.high?'#55b6ea':'#5fd08b';
      dt.textContent=Math.abs(mm.speed)>5?Math.round(Math.abs(mm.speed))+' rpm':''; });
  }};

CIRCUITS.push(
/* ---------- 5.1 timed run ---------- */
{ key:'trun', unit:5, kind:'circuit', tpl:'dol',
  name:{ar:'تشغيل لفترة محددة (يقف لوحده بالتايمر)',en:'Run for a set time (timer stops it)'},
  buttons:[{btn:'S1',color:'green',face:'I',l:{ar:'تشغيل',en:'Start'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف',en:'Stop'}}],
  lamps:[LP.H1g,LP.H3a],
  desc:{KTs:{ar:'كونتاكت التايمر المقفول 15-16: يفصل K1 بعد الزمن',en:'Timer NC 15-16: drops K1 after the time'}},
  tree:S_(fuse0(), SP( S_(pbnc('S0'), olc('F1'), P_(pbno('S1'), no('K1','13','14','K1h')), tnc('KT','KTs'), SP( S_(coil('K1')), S_(tcoil('KT',8)) )),
    runL('K1'), tripL('F1') )),
  faults:[{id:'KTs',kind:'stuck',l:{ar:'كونتاكت التايمر 15-16 ملحوم',en:'Timer contact 15-16 welded'}},{id:'KTc',kind:'burnt',l:{ar:'ملف التايمر محروق',en:'Timer coil burnt'}},fHold('K1'),fF0],
  trace:['F0','S0','F1c','S1','K1h','KTs','K1c','KTc'],
  steps:[
    {l:{ar:'S1 يشغّل K1 والتايمر مع بعض، وK1 يثبّت نفسه.',en:'S1 starts K1 and the timer together, and K1 holds itself.'},on:s=>s.k.K1},
    {l:{ar:'بعد الزمن، كونتاكت التايمر 15-16 يفتح فيفصل K1، والتايمر نفسه يفصل معاه ويرجع صفر.',en:'After the time, timer contact 15-16 opens and drops K1; the timer drops with it and resets.'},on:s=>!s.k.K1&&s.mot.M1.speed>50}
  ],
  challenges:[
    {l:{ar:'شغّل الموتور وسيبه يقف لوحده بعد الزمن.',en:'Start the motor and let it stop by itself after the time.'},f:'autoStop'},
    {l:{ar:'اضبط التايمر على 4 ثواني وكرر.',en:'Set the timer to 4 s and repeat.'},f:'pre4&autoStop'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  hook:(dt,m)=>{ if(S.k.K1) m.r=1; if(m.r&&!S.k.K1&&!Object.values(S.btn).some(v=>v)&&!S.ol.F1.trip) FLAGS.add('autoStop'); if(!S.k.K1&&S.btn.S0) m.r=0; if(S.tim.KT&&S.tim.KT.pre<=4) FLAGS.add('pre4'); },
  explain:{ar:['دايرة بسيطة ومفيدة: خلاط أو غسالة أو مضخة تشتغل زمن معين وتقف لوحدها.','التايمر متوصل جنب ملف K1، وكونتاكته المقفول 15-16 على التوالي في دايرة K1. لما الزمن يخلص الكونتاكت يفتح فيفصل K1 والتايمر مع بعض، فالدايرة ترجع جاهزة للمرة الجاية.','لو كونتاكت التايمر اتلحم، الموتور هيفضل شغال ومش هيقف لوحده أبدًا.'],
    en:['A simple, useful circuit: a mixer, washer or pump that runs for a set time and stops by itself.','The timer sits beside K1 coil, and its NC 15-16 is in series in the K1 rung. When the time is up the contact opens and drops K1 and the timer together, so the circuit is ready for next time.','If the timer contact welds, the motor keeps running and never stops by itself.']},
  quiz:[{q:{ar:'ليه التايمر بيرجع صفر بعد ما الموتور يقف؟',en:'Why does the timer reset after the motor stops?'},o:[{ar:'لأنه متوصل بعد كونتاكت التثبيت فبيفصل مع K1',en:'It is fed after the holding contact, so it drops with K1'},{ar:'لأنه تايمر تأخير فصل',en:'Because it is off-delay'}],a:0,w:{ar:'كونتاكت 15-16 فصل الاتنين.',en:'15-16 dropped both.'}}]
},
/* ---------- 5.2 off-delay cooling fan ---------- */
{ key:'fan', unit:5, kind:'circuit', tpl:'two',
  name:{ar:'مروحة تبريد تكمل بعد وقوف الموتور (تأخير فصل)',en:'Cooling fan that runs on after the motor (off-delay)'},
  buttons:[{btn:'S1',color:'green',face:'I',l:{ar:'تشغيل',en:'Start'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف',en:'Stop'}}],
  lamps:[{id:'H1',color:'green',l:{ar:'الموتور شغال',en:'Motor run'}},{id:'H4',color:'blue',l:{ar:'المروحة شغالة',en:'Fan run'}},LP.H3a],
  desc:{KTd:{ar:'كونتاكت التايمر (تأخير فصل): يقفل في الحال ويفتح بعد الزمن',en:'Off-delay contact: closes at once, opens after the time'}},
  tree:S_(fuse0(), SP( S_(olc('F1'), pbnc('S0'), P_(pbno('S1'), no('K1','13','14','K1h')), SP( S_(coil('K1')), S_(tcoilOff('KT',8)) )),
    S_(olc('F2'), tno('KT','KTd'), coil('K2')),
    runL('K1','H1','green'), runL('K2','H4','blue'), tripL('F1','F2') )),
  faults:[{id:'KTc',kind:'burnt',l:{ar:'ملف التايمر محروق',en:'Timer coil burnt'}},{id:'KTd',kind:'open',l:{ar:'كونتاكت التايمر تالف',en:'Timer contact worn'}},fCoil('K2'),fHold('K1'),fF0],
  trace:['F0','F1c','S0','S1','K1h','K1c','KTc','F2c','KTd','K2c'],
  steps:[
    {l:{ar:'S1 يشغّل الموتور، والتايمر يتغذى فكونتاكته يقفل في الحال وتشتغل المروحة.',en:'S1 starts the motor; the timer is fed, its contact closes at once and the fan runs.'},on:s=>s.k.K1&&s.k.K2},
    {l:{ar:'اضغط إيقاف: الموتور يقف، لكن المروحة تكمل لحد ما زمن التايمر يخلص.',en:'Press stop: the motor stops, but the fan carries on until the timer runs out.'},on:s=>!s.k.K1&&s.k.K2},
    {l:{ar:'بعد الزمن المروحة تقف.',en:'After the time the fan stops.'},on:s=>!s.k.K1&&!s.k.K2&&s.mot.M2.speed>50}
  ],
  challenges:[
    {l:{ar:'شغّل وبعدين وقّف: لاحظ المروحة بتكمل لوحدها وبعدين تقف.',en:'Start then stop: see the fan carry on and then stop by itself.'},f:'runOn'},
    {l:{ar:'افصل الأوفرلود F1 (زوّد الحمل): المروحة برضه تكمل تبرّد الموتور.',en:'Trip overload F1 (raise the load): the fan still runs on to cool the motor.'},f:'olFan'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  hook:(dt,m)=>{ if(S.k.K1&&S.k.K2) m.b=1; if(m.b&&!S.k.K1&&S.k.K2) m.on=1; if(m.on&&!S.k.K2){ FLAGS.add('runOn'); m.on=0; m.b=0; } if(S.ol.F1.trip&&S.k.K2&&!S.k.K1) FLAGS.add('olFan'); },
  explain:{ar:['موتور كبير بيسخن، فعايزين مروحة تكمل تبرّده شوية بعد ما يقف. ده شغل تايمر تأخير الفصل.','ملف التايمر جنب ملف K1. أول ما K1 يشتغل، كونتاكت التايمر يقفل في الحال فالمروحة K2 تشتغل. لما K1 يقف، التايمر يبدأ يعد، والمروحة تفضل شغالة لحد ما الزمن يخلص.','لاحظ إن المروحة ليها أوفرلود لوحدها F2، ومش متوصلة بعد زر الإيقاف، عشان تكمل حتى لو الموتور فصل من الأوفرلود.'],
    en:['A large motor gets hot, so we want a fan to keep cooling it for a while after it stops. That is a job for an off-delay timer.','The timer coil sits beside K1. As soon as K1 runs, the timer contact closes at once and fan K2 runs. When K1 stops, the timer starts counting and the fan keeps running until the time is up.','Note the fan has its own overload F2 and is not wired after the stop button, so it runs on even if the motor tripped on overload.']},
  quiz:[{q:{ar:'لو استخدمنا تايمر تأخير تشغيل بدل تأخير الفصل هنا؟',en:'If we used an on-delay timer here instead?'},o:[{ar:'المروحة تبدأ متأخرة وتقف مع الموتور',en:'The fan starts late and stops with the motor'},{ar:'نفس الشغل',en:'Same result'}],a:0,w:{ar:'تأخير التشغيل بيأخر البداية مش النهاية.',en:'On-delay delays the start, not the end.'}}]
},
/* ---------- 5.3 flashing alarm lamp ---------- */
{ key:'flash', unit:5, kind:'circuit', tpl:'dol',
  name:{ar:'لمبة إنذار بتفلش بتايمرين',en:'Flashing alarm lamp with two timers'},
  buttons:[{btn:'S1',color:'green',face:'I',l:{ar:'تشغيل',en:'Start'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف',en:'Stop'}}],
  lamps:[LP.H1g,{id:'H3',color:'amber',l:{ar:'أوفرلود (بتفلش)',en:'Overload (flashing)'}}],
  desc:{KT1o:{ar:'KT1 17-18: يقفل بعد زمن KT1 فيشغل KT2 واللمبة',en:'KT1 17-18: closes after KT1 time, starts KT2 and the lamp'},KT2s:{ar:'KT2 15-16: يفتح بعد زمن KT2 فيرجّع KT1 صفر',en:'KT2 15-16: opens after KT2 time and resets KT1'}},
  tree:S_(fuse0(), SP( S_(olc('F1'), pbnc('S0'), P_(pbno('S1'), no('K1','13','14','K1h')), coil('K1')),
    runL('K1'),
    S_(olt('F1'), SP( S_(tnc('KT2','KT2s'), tcoil('KT1',1)), S_(tno('KT1','KT1o'), SP( S_(tcoil('KT2',1)), S_(lamp('H3','amber')) )) )) )),
  faults:[{id:'KT2s',kind:'stuck',l:{ar:'كونتاكت KT2 15-16 ملحوم',en:'KT2 contact 15-16 welded'}},{id:'KT1c',kind:'burnt',l:{ar:'ملف KT1 محروق',en:'KT1 coil burnt'}},fHold('K1'),fF0],
  trace:['F0','F1c','S0','S1','K1h','K1c','F1t','KT2s','KT1c','KT1o','KT2c'],
  steps:[
    {l:{ar:'شغّل الموتور وزوّد الحمل لحد ما الأوفرلود يفصل.',en:'Run the motor and raise the load until the overload trips.'},on:s=>s.ol.F1&&s.ol.F1.trip},
    {l:{ar:'كونتاكت الأوفرلود 97-98 يغذي KT1. بعد زمنه، KT1 يشغّل KT2 واللمبة تنور.',en:'Overload contact 97-98 feeds KT1. After its time, KT1 starts KT2 and the lamp lights.'},on:s=>s.lamps.H3},
    {l:{ar:'بعد زمن KT2، كونتاكته 15-16 يفصل KT1، فالكل يرجع ويبدأ من الأول: اللمبة تفلش.',en:'After KT2 time, its 15-16 drops KT1, so everything resets and starts over: the lamp flashes.'},on:s=>s.ol.F1&&s.ol.F1.trip&&!s.lamps.H3}
  ],
  challenges:[
    {l:{ar:'افصل الأوفرلود ولاحظ اللمبة بتفلش.',en:'Trip the overload and watch the lamp flash.'},f:'flashing'},
    {l:{ar:'غيّر زمن KT1 و KT2 من العمود الجانبي: واحد بيحدد الإطفاء والتاني الإنارة.',en:'Change KT1 and KT2 in the side column: one sets off time, the other on time.'},f:'preF'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  hook:(dt,m)=>{ if(S.lamps.H3&&!m.on){ m.on=1; m.n=(m.n||0)+1; if(m.n>=3) FLAGS.add('flashing'); } if(!S.lamps.H3) m.on=0; if(S.tim.KT1&&S.tim.KT2&&(S.tim.KT1.pre!==1||S.tim.KT2.pre!==1)) FLAGS.add('preF'); },
  explain:{ar:['لمبة بتفلش بتلفت النظر أكتر من لمبة ثابتة. بنعملها بتايمرين تأخير تشغيل بيشغلوا بعض في دايرة مقفولة.','KT1 يتغذى، يعد زمنه، وبعدين يشغل KT2 واللمبة. KT2 يعد زمنه، وبعدين كونتاكته المقفول يفصل KT1. لما KT1 يفصل، KT2 واللمبة يفصلوا، و KT2 يرجع يقفل كونتاكته فـ KT1 يبدأ تاني.','زمن KT1 = وقت اللمبة مطفية، وزمن KT2 = وقت اللمبة منورة. في السوق فيه تايمر جاهز اسمه Flasher بيعمل نفس الشغل في جهاز واحد.'],
    en:['A flashing lamp catches the eye more than a steady one. We build it with two on-delay timers that drive each other in a loop.','KT1 is fed, counts its time, then starts KT2 and the lamp. KT2 counts its time, then its NC drops KT1. When KT1 drops, KT2 and the lamp drop, KT2 recloses its contact and KT1 starts again.','KT1 time = lamp off time, KT2 time = lamp on time. Ready-made "flasher" timers do the same in one device.']},
  quiz:[{q:{ar:'عايز اللمبة تنور ثانيتين وتطفي ثانية. تضبط إيه؟',en:'You want the lamp on 2 s and off 1 s. Set what?'},o:[{ar:'KT1 = 1 ثانية و KT2 = 2 ثانية',en:'KT1 = 1 s, KT2 = 2 s'},{ar:'KT1 = 2 ثانية و KT2 = 1 ثانية',en:'KT1 = 2 s, KT2 = 1 s'}],a:0,w:{ar:'KT2 بيحدد وقت الإنارة.',en:'KT2 sets the on time.'}}]
},
/* ---------- 5.4 star-delta with reversing ---------- */
{ key:'sdr', unit:5, kind:'circuit', tpl:'sdr', ir:6.4,
  irNote:{ar:'الأوفرلود بعد كونتاكتورات الاتجاه وقبل الستار/دلتا، فبيشوف تيار الملف: 11 ÷ 1.73 = 6.4 أمبير.',en:'The overload sits after the direction contactors, before star/delta, so it sees winding current: 11 ÷ 1.73 = 6.4 A.'},
  name:{ar:'ستار/دلتا مع عكس الحركة',en:'Star-delta with reversing'},
  buttons:[{btn:'S1',color:'green',face:'↻',l:{ar:'أمام',en:'Forward'}},{btn:'S2',color:'green',face:'↺',l:{ar:'خلف',en:'Reverse'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف',en:'Stop'}}],
  lamps:[{id:'H1',color:'green',l:{ar:'أمام',en:'Forward'}},{id:'H4',color:'blue',l:{ar:'خلف',en:'Reverse'}},{id:'H5',color:'amber',l:{ar:'ستار',en:'Star'}},{id:'H3',color:'red',l:{ar:'أوفرلود',en:'Overload'}}],
  tree:S_(fuse0(), SP( S_(pbnc('S0'), olc('F1'), SP(
      S_(P_(pbno('S1'), no('KM1','13','14','KM1h')), nc('KM2','21','22','KM2i'), coil('KM1')),
      S_(P_(pbno('S2'), no('KM2','13','14','KM2h')), nc('KM1','21','22','KM1i'), coil('KM2')),
      S_(P_(no('KM1','53','54','KM1s'), no('KM2','53','54','KM2s')), SP(
        S_(nc('KD','31','32','KDt'), tcoil('KT',5)),
        S_(tnc('KT','KTs'), nc('KD','21','22','KDi'), coil('KS')),
        S_(P_(tno('KT','KTd'), no('KD','13','14','KDh')), nc('KS','21','22','KSi'), coil('KD')) )) )),
    runL('KM1','H1','green'), runL('KM2','H4','blue'), runL('KS','H5','amber'), S_(olt('F1'),lamp('H3','red')) )),
  faults:[{id:'KM1i',kind:'stuck',l:{ar:'إنترلوك KM1 21-22 مقصور',en:'Interlock KM1 21-22 bridged'}},{id:'KTc',kind:'burnt',l:{ar:'ملف التايمر محروق',en:'Timer coil burnt'}},{id:'KDh',kind:'open',l:{ar:'كونتاكت تثبيت KD تالف',en:'KD holding contact worn'}},{id:'KM2s',kind:'open',l:{ar:'كونتاكت KM2 53-54 تالف',en:'KM2 contact 53-54 worn'}},fF0,PF.phL3],
  trace:['F0','S0','F1c','S1','KM1h','KM2i','KM1c','S2','KM2h','KM1i','KM2c','KM1s','KM2s','KDt','KTc','KTs','KDi','KSc','KTd','KDh','KSi','KDc'],
  steps:[
    {l:{ar:'S1 (أمام) أو S2 (خلف) يشغّل كونتاكتور الاتجاه. الاتنين متربطين إنترلوك.',en:'S1 (forward) or S2 (reverse) starts a direction contactor. The two are interlocked.'},on:s=>s.k.KM1||s.k.KM2},
    {l:{ar:'كونتاكت 53-54 من أي اتجاه يغذي جزء الستار/دلتا: الموتور يبدأ ستار.',en:'Contact 53-54 of either direction feeds the star-delta part: the motor starts in star.'},on:s=>s.k.KS},
    {l:{ar:'بعد التايمر يحول دلتا. عشان تعكس، لازم تضغط إيقاف الأول.',en:'After the timer it changes to delta. To reverse you must press stop first.'},on:s=>s.k.KD}
  ],
  challenges:[
    {l:{ar:'شغّل أمام لحد الدلتا، وقّف، وبعدين شغّل خلف لحد الدلتا.',en:'Run forward to delta, stop, then run reverse to delta.'},f:'fwdD&revD'},
    {l:{ar:'جرّب تضغط خلف والموتور شغال أمام: الإنترلوك يمنعه.',en:'Press reverse while running forward: the interlock blocks it.'},f:'blocked'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  hook:(dt,m)=>{ if(S.k.KD&&S.k.KM1) FLAGS.add('fwdD'); if(S.k.KD&&S.k.KM2) FLAGS.add('revD'); if(S.k.KM1&&S.btn.S2===1&&!S.k.KM2) FLAGS.add('blocked'); if(S.k.KM2&&S.btn.S1===1&&!S.k.KM1) FLAGS.add('blocked'); },
  explain:{ar:['ده مزيج من دايرتين اتعلمتهم: عكس الحركة والستار/دلتا. كونتاكتورين للاتجاه (KM1 أمام، KM2 خلف بتبديل L1 و L3)، وبعدهم KS و KD زي الستار/دلتا العادي.','الجزء بتاع الستار/دلتا والتايمر بيتغذى من كونتاكت 53-54 من KM1 أو KM2 على التوازي، فبيشتغل في الاتجاهين.','الإنترلوك هنا مرتين: بين KM1 و KM2 (عشان شورت بين الفازات)، وبين KS و KD.'],
    en:['This combines two circuits you learned: reversing and star-delta. Two direction contactors (KM1 forward, KM2 reverse by swapping L1 and L3), then KS and KD as in normal star-delta.','The star-delta part and the timer are fed through 53-54 of KM1 or KM2 in parallel, so it works in both directions.','There are two interlocks here: between KM1 and KM2 (phase short), and between KS and KD.']},
  quiz:[{q:{ar:'الموتور بيلف أمام بس، وخلف بيبدأ ستار وعمره ما بيحول دلتا. الأقرب؟',en:'Forward works fully, but reverse starts in star and never changes to delta. Most likely?'},o:[{ar:'التايمر',en:'The timer'},{ar:'مش ممكن يكون التايمر لأنه شغال في الأمام',en:'Not the timer, it works forward'}],a:1,w:{ar:'التايمر مشترك. دوّر في اللي خاص بالخلف بس.',en:'The timer is shared. Look at what is reverse-only.'}}]
},
/* ---------- 5.5 Dahlander two-speed ---------- */
{ key:'dahl', unit:5, kind:'circuit', tpl:'dahl',
  name:{ar:'موتور بسرعتين (دالاندر)',en:'Two-speed motor (Dahlander)'},
  buttons:[{btn:'S1',color:'green',face:'1',l:{ar:'بطيء',en:'Low'}},{btn:'S2',color:'green',face:'2',l:{ar:'سريع',en:'High'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف',en:'Stop'}}],
  lamps:[{id:'H1',color:'green',l:{ar:'بطيء',en:'Low'}},{id:'H4',color:'blue',l:{ar:'سريع',en:'High'}},LP.H3a],
  desc:{KYp:{ar:'كونتاكت KY: KH مايشتغلش غير بعد ما نقطة النجمة تتقفل',en:'KY contact: KH only runs once the star point is closed'}},
  tree:S_(fuse0(), SP( S_(pbnc('S0'), olc('F1'), olc('F2'), SP(
      S_(P_(pbno('S1'), no('KL','13','14','KLh')), pbnc('S2','S2b'), nc('KY','21','22','KYi'), nc('KH','21','22','KHi'), coil('KL')),
      S_(P_(pbno('S2'), no('KY','13','14','KYh')), pbnc('S1','S1b'), nc('KL','21','22','KLi'), SP( S_(coil('KY')), S_(no('KY','43','44','KYp'), coil('KH')) )) )),
    runL('KL','H1','green'), runL('KH','H4','blue'), tripL('F1','F2') )),
  faults:[{id:'KYp',kind:'open',l:{ar:'كونتاكت KY 43-44 تالف',en:'KY contact 43-44 worn'}},{id:'KLi',kind:'stuck',l:{ar:'إنترلوك KL مقصور',en:'KL interlock bridged'}},fCoil('KH'),fHold('KL'),fF0,PF.phL3],
  trace:['F0','S0','F1c','F2c','S1','KLh','S2b','KYi','KHi','KLc','S2','KYh','S1b','KLi','KYc','KYp','KHc'],
  steps:[
    {l:{ar:'S1: KL يغذي U1 V1 W1 والموتور يلف بطيء (دلتا، 4 أقطاب، حوالي 1450 لفة).',en:'S1: KL feeds U1 V1 W1 and the motor runs slow (delta, 4 poles, about 1450 rpm).'},on:s=>s.k.KL},
    {l:{ar:'S2: الزر المزدوج يفصل KL الأول، وبعدين KY يقفل نقطة النجمة و KH يغذي U2 V2 W2: سريع (نجمة مزدوجة YY، حوالي 2900 لفة).',en:'S2: the double button drops KL first, then KY closes the star point and KH feeds U2 V2 W2: fast (double star YY, about 2900 rpm).'},on:s=>s.k.KH},
    {l:{ar:'كل سرعة ليها أوفرلود مضبوط على تيارها.',en:'Each speed has an overload set to its own current.'},on:s=>s.btn.S0===1}
  ],
  challenges:[
    {l:{ar:'شغّل بطيء وبعدين حوّل سريع من غير ما توقف.',en:'Run low, then switch to high without stopping.'},f:'lowHigh'},
    {l:{ar:'جرّب عطل KY 43-44: KH مش هيشتغل، وده بيحمي الموتور.',en:'Try the KY 43-44 fault: KH will not run, which protects the motor.'},f:'kyFault'},
    {l:{ar:'في وضع تتبع العطل، اكتشف عطلًا واحدًا.',en:'In fault-finding mode, find one fault.'},f:'solved'}
  ],
  hook:(dt,m)=>{ if(S.k.KL&&S.mot.M1.speed>1300) m.l=1; if(m.l&&S.k.KH&&S.mot.M1.speed>2700) FLAGS.add('lowHigh'); if(S.fault.KYp==='open'&&S.k.KY&&!S.k.KH) FLAGS.add('kyFault'); },
  explain:{ar:['موتور الدالاندر ملفاته متقسمة نصين، وبتغيير طريقة التوصيل بنغير عدد الأقطاب: دلتا = 4 أقطاب = سرعة بطيئة، ونجمة مزدوجة YY = 2 قطب = ضعف السرعة.','بطيء: KL يغذي U1 V1 W1 وأطراف U2 V2 W2 مفتوحة. سريع: KY يقصّر U1 V1 W1 مع بعض (نقطة نجمة)، و KH يغذي U2 V2 W2.','KL لازم ميشتغلش أبدًا مع KY أو KH، وإلا يبقى شورت. عشان كده فيه إنترلوك بالكونتاكتات وبالأزرار المزدوجة.','الاستخدام: مراوح التهوية، الأوناش، والمخارط اللي محتاجة سرعتين.'],
    en:['A Dahlander motor has its windings split in halves; changing the connection changes the pole count: delta = 4 poles = low speed, double star YY = 2 poles = double speed.','Low: KL feeds U1 V1 W1 and U2 V2 W2 are open. High: KY shorts U1 V1 W1 together (star point) and KH feeds U2 V2 W2.','KL must never run with KY or KH, or there is a short. Hence the contact and double-button interlocks.','Used in ventilation fans, hoists and lathes that need two speeds.']},
  quiz:[{q:{ar:'في السرعة العالية، إيه اللي بيقصّر U1 V1 W1؟',en:'At high speed, what shorts U1 V1 W1?'},o:[{ar:'KY',en:'KY'},{ar:'KL',en:'KL'},{ar:'KH',en:'KH'}],a:0,w:{ar:'KY بيعمل نقطة النجمة.',en:'KY makes the star point.'}}]
},
/* ---------- 5.6 plugging brake with speed switch ---------- */
{ key:'plug', unit:5, kind:'circuit', tpl:'rev',
  name:{ar:'فرملة الموتور بالعكس ومفتاح السرعة',en:'Plugging brake with a speed switch'},
  buttons:[{btn:'S1',color:'green',face:'I',l:{ar:'تشغيل',en:'Start'}},{btn:'S0',color:'red',face:'O',l:{ar:'إيقاف بفرملة',en:'Stop with brake'}}],
  lamps:[LP.H1g,{id:'H4',color:'amber',l:{ar:'بيفرمل',en:'Braking'}},LP.H3a],
  desc:{BSo:{ar:'مفتاح السرعة: مقفول طول ما الموتور بيلف أمام، ويفتح قرب الصفر',en:'Speed switch: closed while running forward, opens near zero'},S0b:{ar:'كونتاكت S0 المفتوح: يبدأ الفرملة',en:'S0 NO contact: starts braking'}},
  tree:S_(fuse0(), SP( S_(olc('F1'), SP(
      S_(pbnc('S0'), P_(pbno('S1'), no('K1','13','14','K1h')), nc('K2','21','22','K2i'), coil('K1')),
      S_(P_(pbno('S0','S0b'), no('K2','13','14','K2h')), sn('BSo'), nc('K1','21','22','K1i'), coil('K2')) )),
    runL('K1'), runL('K2','H4','amber'), tripL('F1') )),
  faults:[{id:'BSo',kind:'stuck',l:{ar:'مفتاح السرعة متزنق مقفول',en:'Speed switch stuck closed'}},fCoil('K2'),{id:'K2h',kind:'open',l:{ar:'كونتاكت تثبيت K2 تالف',en:'K2 holding contact worn'}},fF0],
  trace:['F0','F1c','S0','S1','K1h','K2i','K1c','S0b','K2h','BSo','K1i','K2c'],
  reset(){ S.ls={BS:false}; },
  process(dt){ S.ls.BS=S.mot.M1.speed>80; },
  tile:()=>({k:{ar:'زمن الوقوف',en:'Stop time'},v:PR.stopT!=null?PR.stopT.toFixed(1)+' s':'—'}),
  steps:[
    {l:{ar:'S1 يشغّل K1. لما الموتور يلف، مفتاح السرعة BS يقفل.',en:'S1 starts K1. Once the motor turns, speed switch BS closes.'},on:s=>s.k.K1&&s.ls.BS},
    {l:{ar:'S0: يفصل K1 ويشغّل K2 (عكس) فالموتور يفرمل بقوة.',en:'S0 drops K1 and starts K2 (reverse), so the motor brakes hard.'},on:s=>s.k.K2},
    {l:{ar:'قرب الصفر BS يفتح ويفصل K2 قبل ما الموتور يلف عكس.',en:'Near zero BS opens and drops K2 before the motor reverses.'},on:s=>!s.k.K1&&!s.k.K2&&!s.ls.BS}
  ],
  challenges:[
    {l:{ar:'شغّل ووقّف بالفرملة، وبص على زمن الوقوف.',en:'Start and stop with the brake, and look at the stop time.'},f:'braked'},
    {l:{ar:'جرّب عطل ملف K2 المحروق وقارن: الموتور يقف بالدوران الحر وياخد وقت أطول.',en:'Try the burnt K2 coil and compare: the motor coasts and takes longer.'},f:'coasted'},
    {l:{ar:'جرّب مفتاح السرعة المتزنق: الموتور يقف ويلف عكس!',en:'Try the stuck speed switch: the motor stops and runs backwards!'},f:'reversed'}
  ],
  hook:(dt,m)=>{ const sp=S.mot.M1.speed;
    if(m.t0==null&&sp>1300&&!S.k.K1){ m.t0=S.time; m.brk=!!S.k.K2; }
    if(m.t0!=null&&Math.abs(sp)<20){ PR.stopT=S.time-m.t0; if(m.brk) FLAGS.add('braked'); else FLAGS.add('coasted'); m.t0=null; }
    if(S.k.K1) m.t0=null; if(sp<-200) FLAGS.add('reversed'); },
  explain:{ar:['الفرملة بالعكس (Plugging): بدل ما نسيب الموتور يقف لوحده، بنعكس فازتين وهو بيلف، فالمجال الدوار يشده عكس ويقف بسرعة.','المشكلة إن لو سبنا K2 شغال، الموتور هيقف ويلف عكس. عشان كده بنحط مفتاح سرعة BS على العمود: مقفول طول ما الموتور بيلف، ويفتح قرب الصفر فيفصل K2 في الوقت المظبوط.','الفرملة دي بتسحب تيار كبير وبتسخن الموتور، فبتنفع للوقوف السريع مش للتشغيل الكتير ورا بعض.'],
    en:['Plugging: instead of letting the motor coast, we swap two phases while it turns, so the rotating field pulls it backwards and it stops fast.','The catch: if K2 stays on, the motor stops and then runs backwards. So a speed switch BS on the shaft is closed while the motor turns and opens near zero, dropping K2 at the right moment.','Plugging draws a large current and heats the motor, so it suits quick stops, not frequent cycling.']},
  quiz:[{q:{ar:'وظيفة مفتاح السرعة في الدايرة دي؟',en:'What does the speed switch do here?'},o:[{ar:'يفصل الفرملة قرب الصفر عشان الموتور ما يلفش عكس',en:'Ends braking near zero so the motor does not reverse'},{ar:'يحمي من الأوفرلود',en:'Overload protection'}],a:0,w:{ar:'من غيره الموتور يلف عكس.',en:'Without it the motor would reverse.'}}]
}
);
/* ================= drawing: control ================= */
const CW=100, RH=66, BUS=20;
function measure(n){
  if(n.type){n.w=1;n.h=RH;return}
  if(n.series){n.series.forEach(measure);n.w=Math.max(...n.series.map(c=>c.w));n.h=n.series.reduce((a,c)=>a+c.h,0);return}
  if(n.par){n.par.forEach(measure);n.w=n.par.reduce((a,b)=>a+b.w,0);n.h=Math.max(...n.par.map(b=>b.h))+2*BUS;return}
  if(n.split){n.split.forEach(measure);n.w=n.split.reduce((a,b)=>a+b.w,0);n.h=BUS+Math.max(...n.split.map(b=>b.h));return}
}
let X0=72,Y0=56,LOADY=0,GW,GL;
const cx=col=>X0+col*CW;
function mkPt(x,y){const p={x,y,live:false,n:PTS.length+1};PTS.push(p);return p}
function wire(par,pts,liveFn,curFn,nrail){
  const d='M'+pts.map(p=>p.join(',')).join(' L');
  const base=sv('path',{d,class:'w dead'},par); const fl=sv('path',{d,class:'fl'},par); fl.style.display='none';
  UPD.control.push(()=>{const L=liveFn(); base.setAttribute('class','w '+(L?(nrail?'nr':'live'):'dead')); fl.style.display=curFn()?'':'none';});
}
function placeSeries(items,col,y,inPt,endPt){
  let cur=inPt,yy=y; const x=cx(col);
  items.forEach((it,i)=>{
    const last=i===items.length-1;
    if(it.type){
      ELS.push(it);
      if(isLoad(it)){
        const p=cur; if(yy<LOADY) wire(GW,[[x,yy],[x,LOADY]],()=>p.live,()=>it.current);
        it.inPt=cur; it.outPt=NPT; it.col=col; drawEl(it,x,LOADY); yy=LOADY+RH; cur=NPT;
      }else{
        it.inPt=cur; it.outPt=(last&&endPt)?endPt:mkPt(x,yy+RH); it.col=col; drawEl(it,x,yy); yy+=RH; cur=it.outPt;
      }
    }else if(it.par){
      it.inPt=cur; const out=(last&&endPt)?endPt:mkPt(x,yy+it.h); const top=yy+BUS/2, bot=yy+it.h-BUS/2;
      const pin=cur; let bc=col; const cols=[];
      it.par.forEach(b=>{cols.push(bc);bc+=b.w;});
      wire(GW,[[x,yy],[x,top]],()=>pin.live,()=>it.current);
      for(let k=1;k<cols.length;k++){const kk=k; wire(GW,[[cx(cols[k-1]),top],[cx(cols[k]),top]],()=>pin.live,()=>it.par.slice(kk).some(b=>b.cur));}
      it.par.forEach((b,k)=>{const bx=cx(cols[k]);
        wire(GW,[[bx,top],[bx,yy+BUS]],()=>pin.live,()=>b.cur);
        const r=placeSeries(b.series,cols[k],yy+BUS,it.inPt,out);
        if(r.y<bot) wire(GW,[[bx,r.y],[bx,bot]],()=>out.live,()=>b.cur);
      });
      for(let k=cols.length-1;k>=1;k--){const kk=k; wire(GW,[[cx(cols[k]),bot],[cx(cols[k-1]),bot]],()=>out.live,()=>it.par.slice(kk).some(b=>b.cur));}
      wire(GW,[[x,bot],[x,yy+it.h]],()=>out.live,()=>it.current);
      yy+=it.h; cur=out;
    }else if(it.split){
      it.inPt=cur; const pin=cur; const top=yy+BUS/2; let bc=col; const cols=[];
      it.split.forEach(b=>{cols.push(bc);bc+=b.w;});
      wire(GW,[[x,yy],[x,top]],()=>pin.live,()=>it.current);
      for(let k=1;k<cols.length;k++){const kk=k; wire(GW,[[cx(cols[k-1]),top],[cx(cols[k]),top]],()=>pin.live,()=>it.split.slice(kk).some(b=>b.cur));}
      it.split.forEach((b,k)=>{const bx=cx(cols[k]); wire(GW,[[bx,top],[bx,yy+BUS]],()=>pin.live,()=>b.cur); placeSeries(b.series,cols[k],yy+BUS,pin,null);});
    }
  });
  return {pt:cur,y:yy};
}
function lead(x,y1,y2,liveFn,curFn){wire(GW,[[x,y1],[x,y2]],liveFn,curFn)}
function descOf(e){
  const o=(C.desc&&C.desc[e.id])||D[e.id]; if(o) return tx(o);
  const bl=e.btn&&C.buttons.find(b=>b.btn===e.btn); const bn=bl?tx(bl.l):'';
  const G={fuse:{ar:'فيوز',en:'Fuse'},olNC:{ar:'كونتاكت الأوفرلود '+e.tag+' المقفول',en:'Overload '+e.tag+' NC contact'},olNO:{ar:'كونتاكت الأوفرلود '+e.tag+' المفتوح (إنذار)',en:'Overload '+e.tag+' NO contact (alarm)'},
    pbNO:{ar:'زر '+bn+' (مفتوح)',en:bn+' button (NO)'},pbNC:{ar:'زر '+bn+' (مقفول)',en:bn+' button (NC)'},
    no:{ar:'كونتاكت مفتوح من '+e.ref,en:e.ref+' NO contact'},nc:{ar:'كونتاكت مقفول من '+e.ref,en:e.ref+' NC contact'},
    coil:{ar:'ملف الكونتاكتور '+e.ref,en:'Contactor '+e.ref+' coil'},tcoil:{ar:'ملف التايمر '+e.ref,en:'Timer '+e.ref+' coil'},
    tNO:{ar:'كونتاكت تايمر '+e.ref+' يقفل بعد الزمن',en:'Timer '+e.ref+' contact, closes after delay'},tNC:{ar:'كونتاكت تايمر '+e.ref+' يفتح بعد الزمن',en:'Timer '+e.ref+' contact, opens after delay'},
    lamp:{ar:'لمبة '+e.id,en:'Lamp '+e.id},lsNO:{ar:'ليمت سويتش '+e.tag+' (مفتوح)',en:'Limit switch '+e.tag+' (NO)'},lsNC:{ar:'ليمت سويتش '+e.tag+' (مقفول)',en:'Limit switch '+e.tag+' (NC)'},snNO:{ar:'مفتاح سرعة '+e.tag+': مقفول طول ما الموتور بيلف',en:'Speed switch '+e.tag+': closed while the motor turns'},
    flNO:{ar:'عوامة '+e.tag+' (مفتوح)',en:'Float '+e.tag+' (NO)'},flNC:{ar:'عوامة '+e.tag+' (مقفول)',en:'Float '+e.tag+' (NC)'},selH:{ar:'مفتاح الاختيار وضع يدوي',en:'Selector, HAND'},selA:{ar:'مفتاح الاختيار وضع أوتوماتيك',en:'Selector, AUTO'}};
  return tx(G[e.type]||{ar:e.tag,en:e.tag});
}
function drawEl(e,x,y){
  const g=sv('g',{},GL); e.g=g;
  const lin=()=>e.inPt.live, lout=()=>e.type&&isLoad(e)?false:e.outPt.live, cur=()=>e.current;
  const T=e.t||[];
  const isC=['pbNO','pbNC','no','nc','olNC','olNO','tNO','tNC','lsNO','lsNC','snNO','flNO','flNC','selH','selA'].includes(e.type);
  if(isC){
    lead(x,y,y+18,lin,cur); lead(x,y+46,y+RH,lout,cur);
    const nc=['pbNC','nc','olNC','tNC','lsNC','flNC'].includes(e.type);
    if(nc) sv('path',{d:`M${x} ${y+18} h9`,class:'sym'},g);
    const blade=sv('line',{x1:x,y1:y+46,x2:x,y2:y+18,class:'sym'},g);
    const act=sv('g',{},g);
    if(e.type==='pbNO'||e.type==='pbNC'){
      sv('path',{d:`M${x-7} ${y+32} H${x-24}`,class:'sym dash'},act);
      sv('path',{d:`M${x-24} ${y+25} v14 M${x-24} ${y+25} h-5 M${x-24} ${y+39} h-5`,class:'sym'},act);
    }else if(e.type==='tNO'||e.type==='tNC'){
      sv('path',{d:`M${x-7} ${y+30} H${x-22} M${x-22} ${y+24} a7 7 0 0 0 0 14`,class:'sym'},act);
    }else if(e.type==='lsNO'||e.type==='lsNC'){
      sv('path',{d:`M${x-7} ${y+32} H${x-18} l-8 -7 v14 z`,class:'sym'},act);
    }else if(e.type==='snNO'){
      sv('path',{d:`M${x-7} ${y+32} H${x-16}`,class:'sym dash'},act); sv('rect',{x:x-30,y:y+25,width:14,height:14,class:'sym'},act); txt(act,x-23,y+36,'n','trm','middle');
    }else if(e.type==='flNO'||e.type==='flNC'){
      sv('path',{d:`M${x-7} ${y+32} H${x-18}`,class:'sym dash'},act); sv('circle',{cx:x-24,cy:y+32,r:6,class:'sym'},act);
    }else if(e.type==='selH'||e.type==='selA'){
      sv('path',{d:`M${x-7} ${y+32} H${x-20} M${x-20} ${y+26} h-6 v12 h-6`,class:'sym'},act);
    }else if(e.type==='olNC'||e.type==='olNO'){
      sv('path',{d:`M${x-7} ${y+32} H${x-20}`,class:'sym dash'},act);
      sv('path',{d:`M${x-20} ${y+26} h-6 v6 h6 v6 h-6`,class:'sym'},act);
    }
    txt(g,x+12,y+36,e.tag,'tag'); if(T[0]) txt(g,x+5,y+13,T[0],'trm'); if(T[1]) txt(g,x+5,y+60,T[1],'trm');
    if(e.btn){ g.classList.add('clk'); g.setAttribute('tabindex','0'); g.setAttribute('role','button'); g.setAttribute('aria-label',e.tag);
      sv('rect',{x:x-34,y:y+10,width:64,height:46,fill:'transparent'},g);
      bindPress(g,e.btn); }
    const fm=txt(g,x+12,y+52,'','flt');
    UPD.control.push(()=>{
      const c=e.closed; const pressed=e.btn?(S.btn[e.btn]===1):false;
      if(nc){ blade.setAttribute('x2',c?x+9:x-7); blade.setAttribute('y2',c?y+16:y+21); }
      else { blade.setAttribute('x2',c?x+1:x-12); blade.setAttribute('y2',c?y+17:y+21); }
      const olT=e.ol&&S.ol[e.ol].trip; const actd=(e.btn&&pressed)||olT||(e.ls&&S.ls[e.ls])||(e.fl&&S.fl[e.fl])||((e.type==='tNO'||e.type==='tNC')&&S.tim[e.ref]&&S.tim[e.ref].done); act.setAttribute('transform',`translate(${actd?5:0},0)`);
      
      fm.textContent=(MODE==='free'&&S.fault[e.id])?'!':'';
    });
  }else if(e.type==='fuse'){
    lead(x,y,y+16,lin,cur); lead(x,y+50,y+RH,lout,cur);
    sv('rect',{x:x-6,y:y+16,width:12,height:34,class:'sym'},g); sv('line',{x1:x,y1:y+16,x2:x,y2:y+50,class:'sym'},g);
    txt(g,x+14,y+37,e.tag,'tag'); txt(g,x+14,y+52,'2A','trm');
    const fm=txt(g,x+34,y+37,'','flt'); UPD.control.push(()=>{fm.textContent=(MODE==='free'&&S.fault[e.id])?'!':''});
  }else if(e.type==='coil'){
    lead(x,y,y+16,lin,cur); lead(x,y+50,y+RH,()=>false,cur);
    const r=sv('rect',{x:x-17,y:y+16,width:34,height:34,rx:3,class:'sym'},g);
    txt(g,x+22,y+37,e.tag,'tag'); txt(g,x+5,y+12,'A1','trm'); txt(g,x+5,y+62,'A2','trm');
    const fm=txt(g,x,y+38,'','flt','middle');
    UPD.control.push(()=>{ r.setAttribute('fill',S.k[e.ref]?'rgba(233,166,64,.55)':'none'); r.setAttribute('stroke',S.k[e.ref]?'#e9a640':'#b9c7c4'); fm.textContent=(MODE==='free'&&S.fault[e.id])?'X':''; });
  }else if(e.type==='tcoil'){
    lead(x,y,y+16,lin,cur); lead(x,y+50,y+RH,()=>false,cur);
    const r=sv('rect',{x:x-17,y:y+16,width:34,height:34,rx:3,class:'sym'},g);
    sv('rect',{x:x-28,y:y+22,width:11,height:22,class:'sym',fill:e.off?'#b9c7c4':'none'},g); if(!e.off) sv('path',{d:`M${x-28} ${y+22} l11 22`,class:'sym'},g);
    txt(g,x+22,y+33,e.tag,'tag'); const pt=txt(g,x+22,y+47,'','trm'); txt(g,x+5,y+12,'A1','trm'); txt(g,x+5,y+62,'A2','trm');
    const pr=sv('rect',{x:x-15,y:y+46,width:0,height:3,fill:'#ffd84d'},g);
    const fm=txt(g,x,y+38,'','flt','middle');
    UPD.control.push(()=>{ const tm=S.tim[e.ref]; r.setAttribute('fill',tm.on?'rgba(233,166,64,.35)':'none'); r.setAttribute('stroke',tm.on?'#e9a640':'#b9c7c4'); const cnt=tm.off?(!tm.on&&tm.done):tm.on; pt.textContent=(cnt?tm.t.toFixed(1)+'/':'')+tm.pre+'s'+(tm.off?' TOF':''); pr.setAttribute('width',cnt?30*Math.min(1,tm.t/tm.pre):0); fm.textContent=(MODE==='free'&&S.fault[e.id])?'X':''; });
  }else if(e.type==='lamp'){
    lead(x,y,y+19,lin,cur); lead(x,y+47,y+RH,()=>false,cur);
    const col={green:'#3dff8a',white:'#f4f8ff',amber:'#ffb22e',red:'#ff4b3e',blue:'#4aa3ff'}[e.color]||'#fff';
    const c=sv('circle',{cx:x,cy:y+33,r:14,class:'sym'},g);
    sv('path',{d:`M${x-10} ${y+23} L${x+10} ${y+43} M${x+10} ${y+23} L${x-10} ${y+43}`,class:'sym'},g);
    txt(g,x+20,y+37,e.tag,'tag');
    UPD.control.push(()=>{ const on=S.lamps[e.id]; c.setAttribute('fill',on?col:'none'); c.setAttribute('fill-opacity',on?.85:1); c.style.filter=on?`drop-shadow(0 0 6px ${col})`:''; });
  }
}
function buildControl(){
  const svg=$('#ct'); svg.innerHTML=''; PTS=[]; ELS=[]; UPD.control=[];
  ROOT=JSON.parse(JSON.stringify(C.tree)); measure(ROOT);
  const W=ROOT.w, H=ROOT.h;
  LOADY=Y0+H-RH;
  const vw=X0+W*CW+10, vh=Y0+H+40;
  svg.setAttribute('viewBox',`0 0 ${vw} ${vh}`);
  const dg=$('#diagrams'); dg.classList.toggle('stack',TPL.w+W*CW>1300); dg.style.setProperty('--pwf',TPL.w+'fr'); dg.style.setProperty('--ctf',Math.round(vw*0.85)+'fr');
  GW=sv('g',{},svg); GL=sv('g',{},svg); const GT=sv('g',{},svg);
  // column numbers
  for(let c=0;c<W;c++){ txt(svg,cx(c),14,String(c+1),'colno','middle'); sv('line',{x1:cx(c)-CW/2+4,y1:20,x2:cx(c)+CW/2-4,y2:20,stroke:'#1d2a30','stroke-width':1},svg); }
  LPT=mkPt(cx(0),Y0); NPT={x:cx(0),y:Y0+H,live:false,n:0,isN:true};
  txt(svg,cx(0)-14,Y0-14,'L1','tag','end'); wire(GW,[[cx(0),Y0-22],[cx(0),Y0]],()=>S.ctrl,()=>ROOT.series[0].current);
  placeSeries(ROOT.series,0,Y0,LPT,null);
  // N rail
  const lc=ELS.filter(isLoad).map(e=>e.col); const maxc=Math.max(...lc);
  const yN=Y0+H;
  for(let c=maxc;c>=1;c--){const cc=c; wire(GW,[[cx(c),yN],[cx(c-1),yN]],()=>S.ctrl,()=>ELS.some(e=>isLoad(e)&&e.col>=cc&&e.current),true);}
  wire(GW,[[cx(0),yN],[cx(0)-24,yN]],()=>S.ctrl,()=>ELS.some(e=>isLoad(e)&&e.current),true);
  txt(svg,cx(0)-30,yN+4,'N','tag','end');
  // cross references under coils
  ELS.filter(e=>e.type==='coil').forEach(e=>{
    const cs=ELS.filter(x=>x.ref===e.ref&&x.type!=='coil');
    const s=cs.map(x=>(x.t?x.t.join('-'):'')+'/'+(x.col+1)).join('  ');
    txt(GT,cx(e.col)+22,LOADY+RH+16,s,'xref');
  });
  // test points
  NPT.n=PTS.length+1; PTS.push(NPT);
  PTS.forEach(p=>{
    const g=sv('g',{class:'tp',tabindex:'0',role:'button','aria-label':'TP'+p.n},GT);
    const ox=p.isN?-46:-12;
    sv('circle',{cx:p.x+ox,cy:p.y,r:7.5},g); txt(g,p.x+ox,p.y+3,String(p.n),'','middle');
    if(!p.isN) sv('line',{x1:p.x+ox+7,y1:p.y,x2:p.x,y2:p.y,stroke:'#3f5450','stroke-width':1},g); else sv('line',{x1:p.x+ox+7,y1:p.y,x2:p.x-24,y2:p.y,stroke:'#3f5450','stroke-width':1},g);
    p.g=g;
    const fire=()=>probeClick(p);
    g.addEventListener('click',fire); g.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();fire()}});
  });
}


/* ================= panel view (devices on DIN rails + door + motors) ================= */
const PH=['#7a4a2a','#1e1e1e','#7d8487'];
function screw(g,x,y){ sv('circle',{cx:x,cy:y,r:3.6,fill:'#cfd5d7',stroke:'#6c7578'},g); sv('path',{d:`M${x-2.2} ${y} h4.4`,stroke:'#6c7578','stroke-width':1.2},g); }
function buildPanel(){
  const svg=$('#pn'); svg.innerHTML=''; UPD.panel=[]; const P=f=>UPD.panel.push(f);
  const H=C.machine?760:700;
  svg.setAttribute('viewBox',`0 0 1000 ${H}`);
  const g=sv('g',{},svg);
  sv('rect',{x:8,y:8,width:644,height:484,rx:10,fill:'#56636a',stroke:'#2a3236','stroke-width':3},g);
  sv('rect',{x:22,y:22,width:616,height:456,rx:4,fill:'#c7cdcf'},g);
  const duct=(x,y,w,h)=>{ sv('rect',{x,y,width:w,height:h,fill:'#e2e5e2',stroke:'#a5adab'},g); if(w>h){for(let xx=x+8;xx<x+w-4;xx+=14) sv('line',{x1:xx,y1:y+2,x2:xx,y2:y+h-2,stroke:'#c4cac8'},g);} else {for(let yy=y+8;yy<y+h-4;yy+=14) sv('line',{x1:x+2,y1:yy,x2:x+w-2,y2:yy,stroke:'#c4cac8'},g);} };
  duct(30,30,600,20); duct(30,176,600,20); duct(30,330,600,18); duct(30,450,600,20); duct(30,50,18,400); duct(612,50,18,400);
  const rail=y=>{ sv('rect',{x:56,y:y-5,width:548,height:10,fill:'#a9b1b4',stroke:'#7d8689'},g); for(let x=64;x<600;x+=26) sv('rect',{x,y:y-2,width:12,height:4,rx:2,fill:'#7d8689'},g); };
  rail(120); rail(236); rail(398);
  // ---- rail 1: Q1, F0, timers
  drawMPCB(g,66,74,P);
  drawFuseHolder(g,142,80,P);
  const timers=[...new Set(ELS.filter(e=>e.type==='tcoil').map(e=>e.ref))];
  timers.forEach((r,i)=>drawTimer(g,182+i*40,78,r,P));
  // ---- rail 2: contactors + overloads
  const coils=[...new Set(ELS.filter(e=>e.type==='coil').map(e=>e.ref))];
  coils.forEach((r,i)=>{ const x=66+i*84; drawContactor(g,x,200,r,P); const ol=TPL.olOf[r]; if(ol) drawOL(g,x,276,ol,P);
    [12,31,50].forEach((dx,k)=>{ sv('line',{x1:x+dx,y1:203,x2:x+dx,y2:196,stroke:PH[k],'stroke-width':2.2},g); sv('line',{x1:x+dx,y1:ol?322:272,x2:x+dx,y2:330,stroke:PH[k],'stroke-width':2.2},g); });
    sv('line',{x1:x+4,y1:228,x2:x+4,y2:196,stroke:'#d33','stroke-width':1.2},g);
  });
  [87,95,103].forEach((x,k)=>{ sv('line',{x1:x,y1:78,x2:x,y2:50,stroke:PH[k],'stroke-width':2.2},g); sv('line',{x1:x,y1:162,x2:x,y2:176,stroke:PH[k],'stroke-width':2.2},g); });
  // ---- rail 3: terminals
  const terms=[];
  ['L1','L2','L3'].forEach((l,i)=>terms.push({l,grp:'X0',kind:'p',live:()=>PW.p0[i]}));
  terms.push({l:'N',grp:'X0',kind:'n',live:()=>S.mains}); terms.push({l:'PE',grp:'X0',kind:'pe',live:()=>false});
  TPL.motors.forEach(m=>['U','V','W'].forEach((u,i)=>terms.push({l:u+m.slice(1),grp:'X1',kind:'p',live:()=>PW.motors[m].v[i]})));
  const nCtl=C.buttons.length*2+C.lamps.length+1;
  for(let i=1;i<=nCtl;i++) terms.push({l:String(i),grp:'X2',kind:'c',live:()=>false});
  let tx0=60, lastG='';
  terms.forEach((tm,i)=>{
    if(tm.grp!==lastG){ if(lastG) tx0+=8; txt(g,tx0,362,tm.grp,'pvm'); lastG=tm.grp; }
    const fill=tm.kind==='pe'?'#b8c84a':tm.kind==='n'?'#7aa7d6':'#e1dac4';
    sv('rect',{x:tx0,y:368,width:13,height:60,rx:2,fill,stroke:'#8d8778'},g);
    screw(g,tx0+6.5,376); screw(g,tx0+6.5,420);
    const lt=txt(g,0,0,tm.l,'pvm','middle'); lt.setAttribute('transform',`translate(${tx0+9.5},398) rotate(-90)`); lt.style.fontSize='8.5px';
    const dot=sv('circle',{cx:tx0+6.5,cy:388,r:2.4,fill:'none'},g);
    sv('line',{x1:tx0+6.5,y1:368,x2:tx0+6.5,y2:348,stroke:tm.kind==='c'?'#d33':tm.kind==='n'?'#3a7bd5':tm.kind==='pe'?'#9bb53a':'#555','stroke-width':1.4},g);
    P(()=>dot.setAttribute('fill',tm.live()?'#ff6b4a':'none'));
    tx0+=14;
  });
  // ---- door
  drawDoor(g,P);
  // ---- motors outside
  TPL.motors.forEach((m,j)=>drawMotorPic(g,40+j*240,m,P));
  if(C.machine==='carriage') drawCarriage(g,P); if(C.machine==='pump') drawPumpPlant(g,P); if(C.machine==='belts') drawBelts(g,P);
}
function drawMPCB(g,x,y,P){
  const q=sv('g',{class:'clk',tabindex:'0',role:'button','aria-label':'Q1'},g);
  sv('rect',{x,y,width:58,height:88,rx:4,fill:'#3f474b',stroke:'#23292c'},q);
  sv('rect',{x,y,width:58,height:14,rx:4,fill:'#2f3639'},q); txt(q,x+29,y+11,'Q1  16A','pvw','middle').style.fontSize='9px';
  sv('rect',{x:x+6,y:y+18,width:46,height:58,rx:3,fill:'#5a646a'},q);
  txt(q,x+29,y+28,'I','pvw','middle'); txt(q,x+11,y+50,'O','pvw','middle');
  sv('circle',{cx:x+29,cy:y+48,r:15,fill:'#15191b',stroke:'#000'},q);
  const kn=sv('rect',{x:x+26,y:y+34,width:6,height:16,rx:2,fill:'#e7ecea'},q);
  const st=txt(q,x+29,y+84,'','pvw','middle'); st.style.fontSize='8px';
  q.addEventListener('click',()=>toggleQ1()); q.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();toggleQ1()}});
  P(()=>{ const a=S.q1?0:S.q1trip?-45:-90; kn.setAttribute('transform',`rotate(${a} ${x+29} ${y+48})`); st.textContent=S.q1?'ON':S.q1trip?'TRIP':'OFF'; st.style.fill=S.q1?'#7dffb0':S.q1trip?'#ffb22e':'#ff8a80'; });
}
function drawFuseHolder(g,x,y,P){
  sv('rect',{x,y,width:22,height:80,rx:3,fill:'#4a5357',stroke:'#23292c'},g);
  sv('rect',{x:x+3,y:y+8,width:16,height:40,rx:2,fill:'#3a4245'},g);
  const led=sv('circle',{cx:x+11,cy:y+58,r:4,fill:'#222'},g);
  txt(g,x+11,y+74,'F0','pvw','middle').style.fontSize='9px';
  P(()=>{ const b=MODE==='free'&&S.fault.F0==='open'; led.setAttribute('fill',b?'#ff3b30':'#222'); });
}
function drawTimer(g,x,y,r,P){
  sv('rect',{x,y,width:32,height:84,rx:3,fill:'#3f474b',stroke:'#23292c'},g);
  const u=sv('circle',{cx:x+10,cy:y+12,r:3,fill:'#222'},g), rr=sv('circle',{cx:x+22,cy:y+12,r:3,fill:'#222'},g);
  txt(g,x+10,y+24,'U','pvw','middle').style.fontSize='7px'; txt(g,x+22,y+24,'R','pvw','middle').style.fontSize='7px';
  sv('circle',{cx:x+16,cy:y+46,r:11,fill:'#f2f2ee'},g);
  const arc=sv('path',{d:'',fill:'none',stroke:'#e9a640','stroke-width':3},g);
  const pt=txt(g,x+16,y+50,'','pvm','middle'); pt.style.fontSize='8px';
  txt(g,x+16,y+76,r,'pvw','middle').style.fontSize='9px';
  P(()=>{ const tm=S.tim[r]; u.setAttribute('fill',tm.on?'#3dff8a':'#222'); rr.setAttribute('fill',tm.done?'#ffd84d':'#222'); pt.textContent=tm.pre+'s';
    const f=tm.on?Math.min(1,tm.t/tm.pre):0; if(f<=0){arc.setAttribute('d','');return;} const a=f*2*Math.PI-1e-4, cx=x+16, cy=y+46, R=13;
    arc.setAttribute('d',`M${cx} ${cy-R} A${R} ${R} 0 ${a>Math.PI?1:0} 1 ${cx+R*Math.sin(a)} ${cy-R*Math.cos(a)}`); });
}
function drawContactor(g,x,y,ref,P){
  const b=sv('rect',{x,y,width:62,height:72,rx:4,fill:'#454e53',stroke:'#2a3236'},g);
  sv('rect',{x,y,width:62,height:14,rx:4,fill:'#363e42'},g); sv('rect',{x,y:y+58,width:62,height:14,rx:4,fill:'#363e42'},g);
  [12,31,50].forEach(dx=>{screw(g,x+dx,y+7); screw(g,x+dx,y+65);});
  screw(g,x+5,y+28);
  sv('rect',{x:x+11,y:y+18,width:42,height:12,rx:2,fill:'#f2f2ee'},g); txt(g,x+32,y+28,ref,'pvm','middle');
  sv('rect',{x:x+21,y:y+35,width:20,height:18,rx:2,fill:'#1b2226'},g);
  const ind=sv('rect',{x:x+23,y:y+37,width:16,height:6,fill:'#e8e8e4'},g);
  P(()=>{ const on=!!S.k[ref]; ind.setAttribute('y',on?y+45:y+37); ind.setAttribute('fill',on?'#3dd27a':'#e8e8e4'); b.setAttribute('stroke',on?'#e9a640':'#2a3236'); b.setAttribute('stroke-width',on?2.5:1); });
}
function drawOL(g,x,y,ol,P){
  sv('rect',{x,y,width:62,height:46,rx:3,fill:'#50595e',stroke:'#2a3236'},g);
  txt(g,x+4,y+11,ol,'pvw').style.fontSize='9px';
  sv('circle',{cx:x+17,cy:y+28,r:9,fill:'#f2f2ee',stroke:'#2a3236'},g);
  const dp=sv('line',{x1:x+17,y1:y+28,x2:x+17,y2:y+20,stroke:'#c0392b','stroke-width':2},g);
  const rb=sv('g',{class:'clk',tabindex:'0',role:'button','aria-label':'reset '+ol},g);
  sv('circle',{cx:x+46,cy:y+13,r:7,fill:'#2f7fd1',stroke:'#173f69'},rb);
  const fire=()=>resetOL(ol); rb.addEventListener('click',fire); rb.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();fire()}});
  const fl=sv('rect',{x:x+33,y:y+26,width:26,height:13,rx:2,fill:'#2a3236'},g);
  const ft=txt(g,x+46,y+36,'OK','pvw','middle'); ft.style.fontSize='8.5px';
  P(()=>{ const o=S.ol[ol]; fl.setAttribute('fill',o.trip?'#ff8a1f':'#2a3236'); ft.textContent=o.trip?'TRIP':'OK'; const a=-120+(S.ir-4)/12*240; dp.setAttribute('transform',`rotate(${a} ${x+17} ${y+28})`); });
}
function drawDoor(g,P){
  const X=668,W=322;
  sv('rect',{x:X,y:8,width:W,height:484,rx:10,fill:'#d9d7cd',stroke:'#a09d92','stroke-width':2},g);
  [70,410].forEach(y=>sv('rect',{x:X-4,y,width:8,height:40,rx:2,fill:'#8e8b80'},g));
  sv('rect',{x:X+W-16,y:220,width:8,height:60,rx:3,fill:'#55595b'},g);
  sv('rect',{x:X+30,y:24,width:W-60,height:26,rx:3,fill:'#1b2226'},g);
  txt(g,X+W/2,42,(LANG==='ar'?'لوحة التحكم':'Control panel')+'  ·  '+curLabel(),'pvw','middle').style.fontFamily='var(--f-body)';
  // ammeters
  const ms=TPL.motors.slice(0,3), aw=78, gap=(W-ms.length*aw)/(ms.length+1);
  ms.forEach((m,j)=>{ const x=X+gap+j*(aw+gap), y=62;
    sv('rect',{x,y,width:aw,height:aw,rx:4,fill:'#f4f4f0',stroke:'#55595b','stroke-width':2},g);
    const cx=x+aw/2, cy=y+52, R=30;
    sv('path',{d:`M${cx-R*0.866} ${cy+R*0.5} A${R} ${R} 0 1 1 ${cx+R*0.866} ${cy+R*0.5}`,fill:'none',stroke:'#333','stroke-width':1.2},g);
    [0,20,40,60].forEach(v=>{ const a=(-120+v/60*240)*Math.PI/180; sv('line',{x1:cx+Math.sin(a)*R,y1:cy-Math.cos(a)*R,x2:cx+Math.sin(a)*(R-5),y2:cy-Math.cos(a)*(R-5),stroke:'#333'},g); const tt=txt(g,cx+Math.sin(a)*(R-12),cy-Math.cos(a)*(R-12)+3,String(v),'pvm','middle'); tt.style.fontSize='7.5px'; });
    const ar=(-120+IN/60*240)*Math.PI/180; sv('line',{x1:cx+Math.sin(ar)*R,y1:cy-Math.cos(ar)*R,x2:cx+Math.sin(ar)*(R+4),y2:cy-Math.cos(ar)*(R+4),stroke:'#d33','stroke-width':2.5},g);
    const nd=sv('line',{x1:cx,y1:cy,x2:cx,y2:cy-R+3,stroke:'#c0392b','stroke-width':1.8},g); sv('circle',{cx,cy,r:3,fill:'#333'},g);
    txt(g,cx,y+aw-6,'A  '+m,'pvm','middle').style.fontSize='9px';
    P(()=>{ const v=Math.min(66,S.mot[m].cur); nd.setAttribute('transform',`rotate(${-120+v/60*240} ${cx} ${cy})`); });
  });
  // lamps
  const L=C.lamps, lg=W/(L.length+1);
  L.forEach((l,i)=>{ const cx=X+lg*(i+1), cy=190;
    sv('circle',{cx,cy,r:18,fill:'#8d9093',stroke:'#5d6063'},g);
    const col={green:'#3dff8a',white:'#f4f8ff',amber:'#ffb22e',red:'#ff4b3e',blue:'#4aa3ff'}[l.color];
    const dim={green:'#1f4a2f',white:'#5a5e62',amber:'#5a4310',red:'#4f1d19',blue:'#1d3550'}[l.color];
    const lens=sv('circle',{cx,cy,r:13,fill:dim},g);
    const tt=txt(g,cx,cy+33,tx(l.l),'pv','middle'); tt.style.fontSize='10px'; txt(g,cx,cy+46,l.id,'pvm','middle').style.fontSize='9px';
    P(()=>{ const on=!!S.lamps[l.id]; lens.setAttribute('fill',on?col:dim); lens.style.filter=on?`drop-shadow(0 0 8px ${col})`:''; });
  });
  // buttons
  const B=C.buttons, perRow=Math.min(4,B.length), rows=B.length?Math.ceil(B.length/perRow):0;
  B.forEach((b,i)=>{ const r=Math.floor(i/perRow), k=i%perRow, n=Math.min(perRow,B.length-r*perRow), bg=W/(n+1);
    const cx=X+bg*(k+1), cy=275+r*95;
    const grp=sv('g',{class:'clk',tabindex:'0',role:'button','aria-label':b.btn},g);
    if(b.kind==='estop'){ sv('circle',{cx,cy,r:30,fill:'#f2c200',stroke:'#8a6d00'},grp); }
    sv('circle',{cx,cy,r:21,fill:'#8d9093',stroke:'#5d6063'},grp);
    const col={green:'#20a352',red:'#d0342a',black:'#2b3134',blue:'#2a6fc9',yellow:'#e0b317'}[b.color]||'#555';
    const cap=sv('circle',{cx,cy,r:16,fill:col,stroke:'rgba(0,0,0,.35)'},grp);
    const ft=txt(grp,cx,cy+4,b.face,'pvw','middle'); if(b.face.length>2) ft.style.fontSize='8.5px';
    const tt=txt(g,cx,cy+(b.kind==='estop'?44:35),tx(b.l),'pv','middle'); tt.style.fontSize='10px'; txt(g,cx,cy+(b.kind==='estop'?57:48),b.btn,'pvm','middle').style.fontSize='9px';
    bindPress(grp,b.btn,b.kind);
    P(()=>{ const d=S.btn[b.btn]===1; cap.setAttribute('r',d?13.5:16); cap.setAttribute('opacity',d?.8:1); });
  });
  if(C.selector){ const cx=X+W/2, cy=275+rows*95;
    const grp=sv('g',{class:'clk',tabindex:'0',role:'button','aria-label':'S5'},g);
    sv('circle',{cx,cy,r:21,fill:'#8d9093',stroke:'#5d6063'},grp); const kn=sv('rect',{x:cx-4,y:cy-16,width:8,height:32,rx:3,fill:'#1b2226'},grp);
    [['H',-45],['0',0],['A',45]].forEach(([l,a])=>{ const r=a*Math.PI/180; txt(g,cx+Math.sin(r)*30,cy-Math.cos(r)*30+4,l,'pvm','middle'); });
    txt(g,cx,cy+36,'S5 '+(LANG==='ar'?'يدوي-0-أوتو':'Hand-0-Auto'),'pv','middle').style.fontSize='10px';
    grp.addEventListener('click',()=>{ const o=['H','0','A']; setSel(o[(o.indexOf(S.sel)+1)%3]); });
    P(()=>{ kn.setAttribute('transform',`rotate(${S.sel==='H'?-45:S.sel==='A'?45:0} ${cx} ${cy})`); });
  }
}
function drawMotorPic(g,x,m,P){
  const y=548;
  sv('path',{d:`M${x+80} ${y-12} V${y-40} H${x+80+0} V492`,fill:'none',stroke:'#2b3134','stroke-width':5},g);
  sv('rect',{x,y:y+8,width:24,height:72,rx:8,fill:'#34536f'},g);
  const body=sv('rect',{x:x+24,y,width:112,height:88,rx:6,fill:'#4f7aa0',stroke:'#2c4b66','stroke-width':2},g);
  for(let k=0;k<6;k++) sv('line',{x1:x+34,y1:y+12+k*13,x2:x+126,y2:y+12+k*13,stroke:'#3d6488','stroke-width':3},g);
  sv('rect',{x:x+58,y:y-14,width:44,height:16,rx:2,fill:'#3d6488'},g);
  sv('rect',{x:x+136,y:y+38,width:34,height:12,fill:'#a9b1b4'},g);
  const cx=x+194, cy=y+44;
  sv('circle',{cx,cy,r:26,fill:'#2a3236',stroke:'#a9b1b4','stroke-width':3},g);
  const rot=sv('g',{},g); for(let k=0;k<4;k++) sv('line',{x1:cx,y1:cy,x2:cx,y2:cy-22,stroke:'#e9a640','stroke-width':4,'stroke-linecap':'round',transform:`rotate(${k*90} ${cx} ${cy})`},rot);
  sv('circle',{cx,cy,r:5,fill:'#a9b1b4'},g);
  const lb=txt(g,x+80,y+108,'','dvm','middle');
  P(()=>{ const mm=S.mot[m]; rot.setAttribute('transform',`rotate(${mm.state==='hum'?Math.sin(S.time*60)*3:mm.ang*3} ${cx} ${cy})`); body.setAttribute('stroke',['hum','jam'].includes(mm.state)?'#ff5d50':mm.state==='run'||mm.state==='start'?'#5fd08b':'#2c4b66');
    lb.textContent=`${m}  ${Math.round(Math.abs(mm.speed))} rpm ${Math.abs(mm.speed)>5?(mm.speed>0?'↻':'↺'):''}  ${mm.cur.toFixed(1)} A`; });
}
function lsPic(g,x,y,id,P,flip){
  sv('rect',{x:x-13,y,width:26,height:38,rx:3,fill:'#c9a227',stroke:'#7a6212'},g); txt(g,x,y+52,id,'pvm','middle');
  const lv=sv('line',{x1:x,y1:y,x2:x,y2:y-22,stroke:'#cfd5d7','stroke-width':3},g), rl=sv('circle',{cx:x,cy:y-22,r:6,fill:'#2b3134',stroke:'#cfd5d7','stroke-width':2},g);
  P(()=>{ const on=S.ls[id]; const a=(on?28:0)*(flip?-1:1)*Math.PI/180; const ex=x+Math.sin(a)*22, ey=y-Math.cos(a)*22; lv.setAttribute('x2',ex); lv.setAttribute('y2',ey); rl.setAttribute('cx',ex); rl.setAttribute('cy',ey); rl.setAttribute('stroke',on?'#ffd84d':'#cfd5d7'); });
}
function drawCarriage(g,P){
  const X0=330,X1=950,Y=690;
  sv('rect',{x:300,y:Y+14,width:680,height:12,fill:'#59666b'},g);
  sv('line',{x1:258,y1:592,x2:300,y2:592,stroke:'#a9b1b4','stroke-width':6},g); sv('line',{x1:300,y1:592,x2:300,y2:650,stroke:'#a9b1b4','stroke-width':6},g);
  const scr=sv('line',{x1:300,y1:650,x2:975,y2:650,stroke:'#8d9093','stroke-width':6,'stroke-dasharray':'4 4'},g);
  sv('rect',{x:290,y:Y-80,width:10,height:104,fill:'#3f474b'},g); sv('rect',{x:975,y:Y-80,width:10,height:104,fill:'#3f474b'},g);
  lsPic(g,X0-6,Y-38,'S6',P,true); lsPic(g,X1+6,Y-38,'S7',P,false);
  const cg=sv('g',{},g);
  sv('rect',{x:-45,y:-58,width:90,height:46,rx:6,fill:'#e9a640',stroke:'#8a5d1a','stroke-width':2},cg);
  sv('rect',{x:-30,y:-12,width:60,height:6,fill:'#5d4520'},cg);
  [-28,28].forEach(dx=>sv('circle',{cx:dx,cy:4,r:9,fill:'#2b3134',stroke:'#cfd5d7','stroke-width':2},cg));
  const ct=txt(cg,0,-30,'','pvw','middle');
  P(()=>{ const x=Math.max(-0.04,Math.min(1.04,PR.x)); const px=X0+38+x*(X1-X0-76); cg.setAttribute('transform',`translate(${px},${Y})`); scr.setAttribute('stroke-dashoffset',(S.mot.M1.ang*0.4)%8);
    ct.textContent=S.mot.M1.endJam?'!!':S.mot.M1.speed>20?'→':S.mot.M1.speed<-20?'←':''; });
}
function drawPumpPlant(g,P){
  // well
  const WX=330,WY=600,WW=150,WH=140;
  sv('rect',{x:300,y:WY-8,width:200,height:8,fill:'#6b5a3a'},g);
  sv('rect',{x:WX,y:WY,width:WW,height:WH,fill:'#1d2a30',stroke:'#59666b','stroke-width':3},g);
  const ww=sv('rect',{x:WX+2,y:WY,width:WW-4,height:0,fill:'#2f7fc1',opacity:.85},g); txt(g,WX+WW/2,WY+WH+16,LANG==='ar'?'البير':'Well','pvm','middle');
  // tank
  const TX=760,TY=520,TW=170,TH=130;
  [TX+20,TX+TW-20].forEach(x=>sv('line',{x1:x,y1:TY+TH,x2:x,y2:745,stroke:'#59666b','stroke-width':5},g));
  sv('rect',{x:TX,y:TY,width:TW,height:TH,rx:6,fill:'#1d2a30',stroke:'#8d9093','stroke-width':3},g);
  const tw=sv('rect',{x:TX+3,y:TY,width:TW-6,height:0,fill:'#2f7fc1',opacity:.85},g); txt(g,TX+TW/2,TY-8,LANG==='ar'?'الخزان':'Tank','pvm','middle');
  // pipes
  const pipe=sv('path',{d:`M${WX+40} ${WY+WH-12} V560 H600 V505 H${TX+60} V${TY}`,fill:'none',stroke:'#8d9093','stroke-width':7},g);
  const flow=sv('path',{d:`M${WX+40} ${WY+WH-12} V560 H600 V505 H${TX+60} V${TY}`,fill:'none',stroke:'#7cc4ff','stroke-width':3,'stroke-dasharray':'8 8'},g);
  sv('circle',{cx:600,cy:540,r:18,fill:'#4f7aa0',stroke:'#2c4b66','stroke-width':2},g); txt(g,600,545,'P','pvw','middle');
  sv('path',{d:`M${TX+TW-30} ${TY+TH} V${TY+TH+30} H${TX+TW+30}`,fill:'none',stroke:'#8d9093','stroke-width':6},g);
  const drop=sv('circle',{cx:TX+TW+30,cy:TY+TH+44,r:4,fill:'#7cc4ff'},g);
  // floats
  const fl=(x,y0,id)=>{ const c=sv('line',{x1:x,y1:y0,x2:x,y2:y0+30,stroke:'#cfd5d7','stroke-width':1.5},g), b=sv('ellipse',{cx:x,cy:y0+38,rx:6,ry:10,fill:'#f2c200',stroke:'#8a6d00'},g), t=txt(g,x-14,y0+8,id,'pvm','end'); return {c,b}; };
  const f1=fl(TX+TW-40,TY+20,'B1'), f2=fl(WX+WW-40,WY+30,'B2');
  P(()=>{ const hw=Math.round(PR.lw*(WH-4)); ww.setAttribute('y',WY+WH-2-hw); ww.setAttribute('height',hw);
    const ht=Math.round(PR.lt*(TH-6)); tw.setAttribute('y',TY+TH-3-ht); tw.setAttribute('height',ht);
    const run=S.mot.M1.speed>300&&PR.lw>0.02; flow.style.display=run?'':'none'; flow.setAttribute('stroke-dashoffset',-(S.time*40)%16); pipe.setAttribute('stroke',PR.dry?'#ff5d50':'#8d9093');
    drop.style.display=PR.use>0&&PR.lt>0.01?'':'none'; drop.setAttribute('cy',TY+TH+38+((S.time*60)%20));
    const tilt=(o,id,x,y0)=>{ const up=S.fl[id]; const a=up?-60:0; o.b.setAttribute('transform',`rotate(${a} ${x} ${y0+30})`); o.c.setAttribute('stroke',up?'#ffd84d':'#cfd5d7'); };
    tilt(f1,'B1',TX+TW-40,TY+20); tilt(f2,'B2',WX+WW-40,WY+30); });
}
function drawBelts(g,P){}

/* ================= Unit 1: device lessons ================= */
const DU=[]; // device updaters
function mkCard(parent,title){ const c=document.createElement('div'); c.className='card'; c.style.display='grid'; c.style.gap='10px'; if(title){ const h=document.createElement('h2'); h.textContent=tx(title); c.appendChild(h);} parent.appendChild(c); return c; }
function mkBtn(parent,label,fn,cls){ const b=document.createElement('button'); b.type='button'; b.textContent=tx(label); if(cls) b.className=cls; b.addEventListener('click',fn); parent.appendChild(b); return b; }
function mkHold(parent,label,down,up){ const b=document.createElement('button'); b.type='button'; b.textContent=tx(label);
  b.addEventListener('pointerdown',e=>{e.preventDefault(); b.setPointerCapture&&b.setPointerCapture(e.pointerId); down(); b.classList.add('sel');});
  const u=()=>{up(); b.classList.remove('sel');}; b.addEventListener('pointerup',u); b.addEventListener('pointercancel',u); b.addEventListener('lostpointercapture',u);
  b.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();down();b.classList.add('sel');}}); b.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();u();}});
  parent.appendChild(b); return b; }
function mkSlider(parent,id,label,min,max,step,val,fmt,fn){ const d=document.createElement('div'); d.className='ctl';
  d.innerHTML=`<label for="${id}"><span>${tx(label)}</span><span class="mono" id="${id}_v"></span></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}">`;
  const i=d.querySelector('input'), v=d.querySelector('.mono'); const up=()=>{v.textContent=fmt(+i.value); fn(+i.value);}; i.addEventListener('input',up); parent.appendChild(d); up(); return i; }
function mkSeg(parent,opts,cur,fn){ const r=document.createElement('div'); r.className='seg'; r.style.gridTemplateColumns=`repeat(${opts.length},1fr)`; const bs=[];
  opts.forEach(([v,l])=>{ const b=mkBtn(r,l,()=>{ bs.forEach(x=>x.classList.toggle('sel',x===b)); fn(v); }); if(v===cur) b.classList.add('sel'); bs.push(b); }); parent.appendChild(r); return r; }
function mkTiles(parent,defs){ const w=document.createElement('div'); w.className='tiles'; w.style.gridTemplateColumns=`repeat(auto-fit,minmax(130px,1fr))`;
  const out={}; defs.forEach(([k,l])=>{ const d=document.createElement('div'); d.className='tile'; d.innerHTML=`<span class="k">${tx(l)}</span><span class="v txt"></span>`; w.appendChild(d); out[k]=d.querySelector('.v'); }); parent.appendChild(w); return out; }
function mkInfo(parent,cards){ const w=document.createElement('div'); w.className='infocards'; cards.forEach(c=>{ const d=document.createElement('div'); d.className='card'; d.innerHTML=`<h3>${tx(c.h)}</h3>`+tx(c.b); w.appendChild(d); }); parent.appendChild(w); }
const dvG=(svg,w,h)=>{ svg.setAttribute('viewBox',`0 0 ${w} ${h}`); DU.length=0; return sv('g',{},svg); };
function iecContact(g,x,y,kind,closedFn,act,tag,terms,liveFn){ // vertical symbol between y and y+66
  const ld1=sv('line',{x1:x,y1:y,x2:x,y2:y+18,class:'w dead'},g), ld2=sv('line',{x1:x,y1:y+46,x2:x,y2:y+66,class:'w dead'},g);
  const nc=kind==='nc'; if(nc) sv('path',{d:`M${x} ${y+18} h9`,class:'sym'},g);
  const bl=sv('line',{x1:x,y1:y+46,x2:x,y2:y+18,class:'sym'},g);
  if(act==='pb'){ sv('path',{d:`M${x-7} ${y+32} H${x-24} M${x-24} ${y+25} v14 M${x-24} ${y+25} h-5 M${x-24} ${y+39} h-5`,class:'sym'},g); }
  if(act==='sel'){ sv('path',{d:`M${x-7} ${y+32} H${x-20} M${x-20} ${y+26} h-6 v12 h-6`,class:'sym'},g); }
  if(act==='es'){ sv('path',{d:`M${x-7} ${y+32} H${x-22}`,class:'sym dash'},g); sv('path',{d:`M${x-22} ${y+22} a10 10 0 0 0 0 20 z`,class:'sym'},g); }
  if(act==='ol'){ sv('path',{d:`M${x-7} ${y+32} H${x-20} M${x-20} ${y+26} h-6 v6 h6 v6 h-6`,class:'sym'},g); }
  if(act==='coil'){ sv('path',{d:`M${x-7} ${y+32} H${x-22}`,class:'sym dash'},g); }
  if(tag) txt(g,x+12,y+36,tag,'tag'); if(terms){ txt(g,x+5,y+13,terms[0],'trm'); txt(g,x+5,y+60,terms[1],'trm'); }
  DU.push(()=>{ const c=closedFn(); if(nc){bl.setAttribute('x2',c?x+9:x-7);bl.setAttribute('y2',c?y+16:y+21);} else {bl.setAttribute('x2',c?x+1:x-12);bl.setAttribute('y2',c?y+17:y+21);}
    const L=liveFn?liveFn():true; ld1.setAttribute('class','w '+(L?'live':'dead')); ld2.setAttribute('class','w '+(L&&c?'live':'dead')); bl.style.stroke=c?'#5fd08b':''; });
}
function tester(g,x,y,closedFn){ const c=sv('circle',{cx:x,cy:y,r:9,fill:'#222',stroke:'#59666b','stroke-width':2},g); const tt=txt(g,x+16,y+4,'','dvs');
  DU.push(()=>{ const on=closedFn(); c.setAttribute('fill',on?'#3dff8a':'#222'); c.style.filter=on?'drop-shadow(0 0 6px #3dff8a)':''; tt.textContent=on?(LANG==='ar'?'موصّل':'closed'):(LANG==='ar'?'مفصول':'open'); }); }

/* ---------- D1: buttons, selector, E-stop, lamps ---------- */
const D1={ key:'pb', unit:1, kind:'device', name:{ar:'الأزرار والمفاتيح واللمبات',en:'Buttons, switches and lamps'},
  st:null,
  build(svg,side,below){
    const st=this.st={tr:{a:0,b:0,c:0},hold:{a:0,b:0,c:0},slow:false,sel:0,es:0};
    const g=dvG(svg,1000,470);
    const cols=[
      {k:'a',x:100,name:{ar:'زر تشغيل أخضر',en:'Green start button'},cap:'#20a352'},
      {k:'b',x:290,name:{ar:'زر إيقاف أحمر',en:'Red stop button'},cap:'#d0342a'},
      {k:'c',x:480,name:{ar:'زر مزدوج (NO + NC)',en:'Double button (NO + NC)'},cap:'#2b3134'},
      {k:'d',x:670,name:{ar:'مفتاح اختيار',en:'Selector switch 0-I'}},
      {k:'e',x:860,name:{ar:'زر طوارئ',en:'Emergency stop'}},
    ];
    const NOc=k=>st.tr[k]>=0.65, NCc=k=>st.tr[k]<0.35;
    cols.forEach(cdef=>{ const x=cdef.x, k=cdef.k;
      txt(g,x,26,tx(cdef.name),'dvt','middle');
      const hg=sv('g',{class:'clk',tabindex:'0',role:'button','aria-label':tx(cdef.name)},g);
      sv('rect',{x:x-80,y:36,width:160,height:120,fill:'transparent'},hg);
      if(k==='a'||k==='b'||k==='c'){
        sv('rect',{x:x-34,y:96,width:68,height:22,rx:4,fill:'#8d9093',stroke:'#5d6063'},hg);
        const cap=sv('rect',{x:x-24,y:70,width:48,height:30,rx:8,fill:cdef.cap,stroke:'rgba(0,0,0,.4)'},hg);
        const lbl=txt(hg,x,91,k==='a'?'I':k==='b'?'O':'JOG','pvw','middle');
        DU.push(()=>{ const d=st.tr[k]*12; cap.setAttribute('y',70+d); lbl.setAttribute('y',91+d); });
        hg.addEventListener('pointerdown',e=>{e.preventDefault(); hg.setPointerCapture&&hg.setPointerCapture(e.pointerId); st.hold[k]=1;});
        const u=()=>st.hold[k]=0; hg.addEventListener('pointerup',u); hg.addEventListener('pointercancel',u); hg.addEventListener('lostpointercapture',u);
        hg.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();st.hold[k]=1;}}); hg.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();u();}});
      }else if(k==='d'){
        sv('circle',{cx:x,cy:96,r:32,fill:'#8d9093',stroke:'#5d6063'},hg); const kn=sv('rect',{x:x-6,y:70,width:12,height:52,rx:4,fill:'#1b2226'},hg);
        txt(g,x-34,62,'0','dvm','middle'); txt(g,x+34,62,'I','dvm','middle');
        hg.addEventListener('click',()=>{st.sel=st.sel?0:1; if(st.sel) FLAGS.add('selOn');}); hg.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();st.sel=st.sel?0:1;}});
        DU.push(()=>kn.setAttribute('transform',`rotate(${st.sel?45:-45} ${x} 96)`));
      }else{
        sv('circle',{cx:x,cy:100,r:46,fill:'#f2c200',stroke:'#8a6d00'},hg); sv('rect',{x:x-20,y:104,width:40,height:20,fill:'#8d9093'},hg);
        const mush=sv('ellipse',{cx:x,cy:84,rx:34,ry:22,fill:'#d0342a',stroke:'#7d1c16'},hg);
        const et=txt(g,x,166,'','dvs','middle');
        hg.addEventListener('click',()=>{ if(st.es){st.es=0; FLAGS.add('esReset');} else {st.es=1; FLAGS.add('esPressed');} }); hg.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();st.es=st.es?0:1;}});
        DU.push(()=>{ mush.setAttribute('cy',84+st.es*12); et.textContent=st.es?(LANG==='ar'?'مثبّت: لفّه لترجعه':'Latched: twist to release'):''; });
      }
      // contact blocks
      const blocks=k==='c'?[[x-44,'no','13','14'],[x+44,'nc','21','22']]:k==='a'?[[x,'no','13','14']]:k==='b'||k==='e'?[[x,'nc','11','12']]:[[x,'no','13','14']];
      const cl=(type)=>k==='d'?()=>!!st.sel:k==='e'?()=>!st.es:(type==='no'?()=>NOc(k):()=>NCc(k));
      const trav=()=>k==='d'?st.sel:k==='e'?st.es:st.tr[k];
      blocks.forEach(([bx,type,t1,t2])=>{
        const y=172, w=k==='c'?70:96;
        sv('rect',{x:bx-w/2,y,width:w,height:84,rx:6,fill:'#1c262b',stroke:'#3a4a52'},g);
        txt(g,bx-w/2+8,y+16,t1,'dvm'); txt(g,bx+w/2-8,y+16,t2,'dvm','end');
        screw(g,bx-w/2+12,y+28); screw(g,bx+w/2-12,y+28);
        const py=type==='no'?y+60:y+40;
        sv('rect',{x:bx-w/2+12,y:py,width:12,height:6,fill:'#d4a017'},g); sv('rect',{x:bx+w/2-24,y:py,width:12,height:6,fill:'#d4a017'},g);
        sv('line',{x1:bx-w/2+12,y1:y+30,x2:bx-w/2+12,y2:py+3,stroke:'#d4a017','stroke-width':2},g); sv('line',{x1:bx+w/2-12,y1:y+30,x2:bx+w/2-12,y2:py+3,stroke:'#d4a017','stroke-width':2},g);
        const rod=sv('line',{x1:bx,y1:y,x2:bx,y2:y+40,stroke:'#9aa8ae','stroke-width':4},g);
        const br=sv('rect',{x:bx-w/2+14,y:y+30,width:w-28,height:5,rx:2,fill:'#e7c34a'},g);
        DU.push(()=>{ const tr=trav(); let by;
          if(type==='no') by=y+42+Math.min(tr,0.65)/0.65*12; else by=y+47+Math.max(0,tr-0.35)/0.65*18;
          br.setAttribute('y',by); rod.setAttribute('y2',by); const c=cl(type)(); br.setAttribute('fill',c?'#5fd08b':'#e7c34a'); });
        iecContact(g,bx,282,type,cl(type),k==='d'?'sel':k==='e'?'es':'pb',null,[t1,t2]);
        tester(g,bx-12,388,cl(type));
        txt(g,bx,420,type==='no'?'NO':'NC','dvm','middle');
      });
    });
    txt(g,500,456,LANG==='ar'?'اضغط على أي جهاز في الرسمة (مع الاستمرار للأزرار)، أو استخدم العمود الجانبي':'Press any device in the drawing (hold for buttons), or use the side column','dvs','middle');
    // side
    const c1=mkCard(side,{ar:'جرّب الأجهزة',en:'Try the devices'});
    const r=document.createElement('div'); r.className='row'; c1.appendChild(r);
    mkHold(r,{ar:'الأخضر',en:'Green'},()=>st.hold.a=1,()=>st.hold.a=0); mkHold(r,{ar:'الأحمر',en:'Red'},()=>st.hold.b=1,()=>st.hold.b=0); mkHold(r,{ar:'المزدوج',en:'Double'},()=>st.hold.c=1,()=>st.hold.c=0);
    const r2=document.createElement('div'); r2.className='row'; c1.appendChild(r2);
    mkBtn(r2,{ar:'لف مفتاح الاختيار',en:'Turn selector'},()=>{st.sel=st.sel?0:1; if(st.sel) FLAGS.add('selOn');});
    mkBtn(r2,{ar:'زر الطوارئ',en:'E-stop'},()=>{ if(st.es){st.es=0;FLAGS.add('esReset');} else {st.es=1;FLAGS.add('esPressed');} });
    const lb=document.createElement('label'); lb.className='chk'; lb.innerHTML=`<input type="checkbox" id="d1slow"><span>${LANG==='ar'?'حركة بطيئة (شوف ترتيب فتح وقفل الزر المزدوج)':'Slow motion (see the double button order)'}</span>`; c1.appendChild(lb);
    lb.querySelector('input').addEventListener('change',e=>st.slow=e.target.checked);
    const c2=mkCard(side,{ar:'ألوان اللمبات',en:'Lamp colours'});
    const lp=document.createElement('div'); lp.className='lamps'; c2.appendChild(lp);
    [['red',{ar:'خطر / عطل',en:'Danger / fault'}],['amber',{ar:'تحذير / غير طبيعي',en:'Warning / abnormal'}],['green',{ar:'تشغيل طبيعي',en:'Normal running'}],['white',{ar:'معلومة عامة',en:'General info'}],['blue',{ar:'مطلوب إجراء',en:'Action required'}]].forEach(([c,l])=>{
      const d=document.createElement('div'); d.className='lamp on '+c; d.innerHTML=`<i></i><span>${tx(l)}</span>`; lp.appendChild(d); });
    // below
    this.tl=mkTiles(below,[['a',{ar:'الأخضر 13-14',en:'Green 13-14'}],['b',{ar:'الأحمر 11-12',en:'Red 11-12'}],['c1',{ar:'المزدوج 13-14',en:'Double 13-14'}],['c2',{ar:'المزدوج 21-22',en:'Double 21-22'}],['e',{ar:'الطوارئ 11-12',en:'E-stop 11-12'}]]);
    mkInfo(below,[
      {h:{ar:'يعني إيه NO و NC؟',en:'What do NO and NC mean?'},b:{ar:'<p><b>NO</b> (مفتوح طبيعيًا): لا يوصل وهو مرتاح، ويقفل لما تضغطه. يستخدم للتشغيل.</p><p><b>NC</b> (مقفول طبيعيًا): يوصل وهو مرتاح، ويفتح لما تضغطه. يستخدم للإيقاف.</p><p>"طبيعيًا" يعني الجهاز غير مضغوط وغير متغذي، وهكذا يُرسم دائمًا في المخطط.</p>',en:'<p><b>NO</b> (normally open): does not conduct at rest, closes when pressed. Used to start.</p><p><b>NC</b> (normally closed): conducts at rest, opens when pressed. Used to stop.</p><p>"Normally" means not pressed and not energized, which is how every drawing shows it.</p>'}},
      {h:{ar:'ترقيم الأطراف',en:'Terminal numbering'},b:{ar:'<p>الرقم الثاني يحدد النوع: <b>1-2 مقفول</b>، <b>3-4 مفتوح</b>.</p><p>الرقم الأول هو ترتيب الكونتاكت في الجهاز: 13-14 أول كونتاكت مفتوح، 21-22 ثاني كونتاكت مقفول، 33-34 ثالث كونتاكت مفتوح.</p>',en:'<p>The second digit gives the type: <b>1-2 closed</b>, <b>3-4 open</b>.</p><p>The first digit is the position in the device: 13-14 first contact (NO), 21-22 second contact (NC), 33-34 third contact (NO).</p>'}},
      {h:{ar:'الزر المزدوج',en:'The double button'},b:{ar:'<p>فيه كونتاكت NO وكونتاكت NC على نفس الذراع. شغّل الحركة البطيئة واضغط: الـ NC يفتح أولًا ثم الـ NO يقفل. وعند الترك العكس. هذا يسمى "افصل قبل أن توصل" وهو مهم في دوائر Jog وعكس الحركة.</p>',en:'<p>It has an NO and an NC on one plunger. Turn on slow motion and press: the NC opens first, then the NO closes; the reverse on release. This break-before-make matters in jog and reversing circuits.</p>'}},
      {h:{ar:'زر الطوارئ',en:'Emergency stop'},b:{ar:'<p>رأس فطر أحمر على أرضية صفراء، كونتاكته NC. عند الضغط يثبت مكانه ولا يرجع إلا بلفّه أو بمفتاح. لا يكفي أن يرجع الزر لتعمل الماكينة: لازم ضغطة تشغيل جديدة.</p>',en:'<p>Red mushroom on a yellow background with an NC contact. It latches when pressed and is released only by twisting or a key. Releasing it must never restart the machine: a new start press is needed.</p>'}},
    ]);
  },
  tick(dt){ const st=this.st; ['a','b','c'].forEach(k=>{ const tgt=st.hold[k]?1:0, sp=st.slow?0.7:14; st.tr[k]+=Math.sign(tgt-st.tr[k])*Math.min(Math.abs(tgt-st.tr[k]),dt*sp);
      if(st.hold[k]&&st.tr[k]>=0.99) FLAGS.add('press_'+k); if(k==='c'&&st.slow&&st.tr.c>0.4&&st.tr.c<0.6) FLAGS.add('slowSeen'); }); },
  refresh(){ DU.forEach(f=>f()); const st=this.st, T=this.tl, f=(el,c)=>{el.textContent=c?(LANG==='ar'?'مقفول':'Closed'):(LANG==='ar'?'مفتوح':'Open'); el.style.color=c?'var(--ok)':'var(--muted)';};
    f(T.a,st.tr.a>=0.65); f(T.b,st.tr.b<0.35); f(T.c1,st.tr.c>=0.65); f(T.c2,st.tr.c<0.35); f(T.e,!st.es); },
  challenges:[
    {l:{ar:'اضغط الزر الأخضر ولاحظ كونتاكت 13-14 يقفل.',en:'Press the green button and watch 13-14 close.'},f:'press_a'},
    {l:{ar:'اضغط الزر الأحمر ولاحظ كونتاكت 11-12 يفتح.',en:'Press the red button and watch 11-12 open.'},f:'press_b'},
    {l:{ar:'شغّل الحركة البطيئة واضغط الزر المزدوج: أيهما يتغير أولًا؟',en:'Turn on slow motion and press the double button: which changes first?'},f:'slowSeen'},
    {l:{ar:'اضغط زر الطوارئ ثم رجّعه.',en:'Press the E-stop, then release it.'},f:'esPressed&esReset'},
  ],
  explain:{ar:[
    'كل دائرة تحكم تبدأ من أجهزة بسيطة: زر تضغطه، مفتاح تلفّه، ولمبة تبين الحالة. أهم شيء تفهمه هو الفرق بين الكونتاكت المفتوح طبيعيًا (NO) والمقفول طبيعيًا (NC).',
    'الزر نفسه مجرد ذراع؛ الكونتاكتات في "بلوك" يركب خلفه. يمكن تركيب أكثر من بلوك على نفس الزر، فيصبح زرًا مزدوجًا مثل زر Jog.',
    'مفتاح الاختيار يثبت في وضعه بعد اللف، بعكس الزر الذي يرجع بالسوستة. يستخدم لاختيار يدوي/أوتوماتيك أو تشغيل/إيقاف دائم.',
    'زر الإيقاف دائمًا NC: لو السلك اتقطع الدائرة تفصل والماكينة تقف. لو استخدمنا NO للإيقاف كان قطع السلك سيمنع الإيقاف وهذا خطر.'
  ],en:[
    'Every control circuit starts with simple devices: a button you press, a switch you turn and a lamp that shows the state. The key idea is the difference between a normally open (NO) and a normally closed (NC) contact.',
    'The button is only an actuator; the contacts sit in a block mounted behind it. Several blocks can be fitted on one button, making a double button like a jog button.',
    'A selector stays where you turn it, unlike a button that springs back. It is used for hand/auto or a maintained on/off.',
    'The stop button is always NC: if its wire breaks, the circuit opens and the machine stops. An NO stop would make a broken wire prevent stopping, which is dangerous.'
  ]},
  quiz:[
    {q:{ar:'كونتاكت رقمه 21-22. ما نوعه؟',en:'A contact is numbered 21-22. What type is it?'},o:[{ar:'مفتوح طبيعيًا (NO)',en:'Normally open (NO)'},{ar:'مقفول طبيعيًا (NC)',en:'Normally closed (NC)'},{ar:'كونتاكت قوى',en:'A power contact'}],a:1,w:{ar:'الرقم الثاني 1-2 يعني مقفول.',en:'Second digit 1-2 means closed.'}},
    {q:{ar:'لمبة حمراء على باب اللوحة تعني غالبًا:',en:'A red lamp on the panel door usually means:'},o:[{ar:'الماكينة تعمل طبيعي',en:'Machine running normally'},{ar:'خطر أو عطل',en:'Danger or fault'},{ar:'معلومة عامة',en:'General info'}],a:1,w:{ar:'الأحمر للخطر والعطل حسب IEC 60204-1.',en:'Red means danger or fault per IEC 60204-1.'}},
    {q:{ar:'لماذا زر الإيقاف NC وليس NO؟',en:'Why is the stop button NC, not NO?'},o:[{ar:'لأنه أرخص',en:'It is cheaper'},{ar:'لكي يؤدي قطع السلك إلى الوقوف',en:'So a broken wire causes a stop'},{ar:'لكي يثبت',en:'So it latches'}],a:1,w:{ar:'التصميم الآمن: العطل يوقف ولا يشغّل.',en:'Fail-safe: a fault stops, never starts.'}}
  ]
};

/* ---------- D2: contactor ---------- */
const D2={ key:'ct', unit:1, kind:'device', name:{ar:'الكونتاكتور',en:'The contactor'},
  build(svg,side,below){
    const st=this.st={V:0,closed:false,gap:1,burnt:false,weld:false,welded:false,aux:false,prevV:0};
    const g=dvG(svg,1000,500);
    const m=()=>(1-st.gap)*30;
    // housing
    sv('rect',{x:50,y:40,width:420,height:390,rx:12,fill:'#1a2328',stroke:'#3a4a52','stroke-width':2},g);
    txt(g,260,30,LANG==='ar'?'قطاع داخل الكونتاكتور':'Cut-away view','dvt','middle');
    // contact sets
    const sets=[[110,'no','1','2','L1'],[180,'no','3','4','L2'],[250,'no','5','6','L3'],[340,'no','13','14',''],[410,'nc','21','22','']];
    const brs=[];
    sets.forEach(([x,type,a,b,ph],i)=>{
      txt(g,x-20,66,a,'dvm','middle'); txt(g,x+20,66,b,'dvm','middle');
      const py=type==='no'?141:104;
      sv('rect',{x:x-26,y:py,width:12,height:6,fill:'#d4a017'},g); sv('rect',{x:x+14,y:py,width:12,height:6,fill:'#d4a017'},g);
      sv('line',{x1:x-20,y1:72,x2:x-20,y2:py,stroke:'#d4a017','stroke-width':2.5},g); sv('line',{x1:x+20,y1:72,x2:x+20,y2:py,stroke:'#d4a017','stroke-width':2.5},g);
      screw(g,x-20,76); screw(g,x+20,76);
      const rod=sv('line',{x1:x,y1:110,x2:x,y2:180,stroke:'#cfd5d7','stroke-width':3},g);
      const br=sv('rect',{x:x-24,y:110,width:48,height:5,rx:2,fill:'#e7c34a'},g);
      brs.push({x,type,br,rod,i});
    
    });
    const bar=sv('rect',{x:84,y:180,width:352,height:10,rx:3,fill:'#cfd5d7'},g);
    const rod=sv('rect',{x:252,y:190,width:16,height:30,fill:'#cfd5d7'},g);
    // armature
    const arm=sv('g',{},g);
    sv('rect',{x:140,y:215,width:240,height:24,rx:3,fill:'#8b979d'},arm);
    [[140,40],[240,40],[340,40]].forEach(([x,w])=>sv('rect',{x,y:239,width:w,height:51,fill:'#8b979d'},arm));
    // springs
    const sp1=sv('path',{d:'',fill:'none',stroke:'#cfd5d7','stroke-width':2},g), sp2=sv('path',{d:'',fill:'none',stroke:'#cfd5d7','stroke-width':2},g);
    // core + coil
    sv('rect',{x:140,y:370,width:240,height:30,fill:'#6f7b81'},g); [[140,40],[240,40],[340,40]].forEach(([x,w])=>sv('rect',{x,y:320,width:w,height:50,fill:'#6f7b81'},g));
    const coilR=[sv('rect',{x:186,y:326,width:48,height:40,rx:4,fill:'#a0642c'},g),sv('rect',{x:286,y:326,width:48,height:40,rx:4,fill:'#a0642c'},g)];
    for(let k=0;k<6;k++){ sv('line',{x1:190,y1:330+k*6,x2:230,y2:330+k*6,stroke:'#7a4a1e'},g); sv('line',{x1:290,y1:330+k*6,x2:330,y2:330+k*6,stroke:'#7a4a1e'},g); }
    txt(g,260,420,LANG==='ar'?'الملف والقلب الحديدي':'Coil and iron core','dvs','middle');
    screw(g,72,340); screw(g,72,380); txt(g,90,344,'A1','dvm'); txt(g,90,384,'A2','dvm');
    sv('path',{d:'M76 340 H186 M76 380 H140',stroke:'#d33','stroke-width':1.5,fill:'none'},g);
    const vT=txt(g,60,460,'','dvm'); const flux=sv('path',{d:'M200 300 q60 -30 120 0',fill:'none',stroke:'#4aa3ff','stroke-width':2,'stroke-dasharray':'4 6'},g);
    DU.push(()=>{ const mm=m(); arm.setAttribute('transform',`translate(0,${mm})`); bar.setAttribute('y',180+mm); rod.setAttribute('y',190+mm);
      brs.forEach(b=>{ const y=b.type==='no'?108+mm:110+mm; b.br.setAttribute('y',y); b.rod.setAttribute('y1',y+5); b.rod.setAttribute('y2',180+mm); b.br.setAttribute('fill',contactClosed(b.i)?'#5fd08b':'#e7c34a'); });
      const zz=(x)=>{ let d=`M${x} ${215+mm}`; const n=6, h=(105-mm)/n; for(let k=1;k<=n;k++) d+=` L${x+(k%2?8:-8)} ${215+mm+0-k*0}`; return ''; };
      const spring=(x)=>{ const y0=230+mm, y1=320, n=8, h=(y1-y0)/n; let d=`M${x} ${y0}`; for(let k=1;k<=n;k++) d+=` L${x+(k%2?7:-7)} ${y0+k*h}`; return d; };
      sp1.setAttribute('d',spring(110)); sp2.setAttribute('d',spring(410));
      const on=st.V>0&&!st.burnt; coilR.forEach(r=>{ r.setAttribute('fill',on?'#e08a3a':'#a0642c'); r.style.filter=on?'drop-shadow(0 0 6px #e08a3a)':''; });
      flux.style.display=on&&st.V>100?'':'none';
      vT.textContent=`A1-A2 = ${Math.round(st.V)} V~`; });
    function contactClosed(i){ if(i<3){ if(i===1&&st.welded) return true; return st.gap<0.06; } if(i===3) return st.gap<0.06&&!st.aux; return st.gap>0.85; }
    this.cc=contactClosed;
    // IEC side
    const X=560;
    txt(g,X+180,30,LANG==='ar'?'نفس الكونتاكتور في المخطط':'The same contactor in a drawing','dvt','middle');
    const crc=sv('rect',{x:X-17,y:96,width:34,height:34,rx:3,class:'sym'},g); txt(g,X+22,118,'K1','tag'); txt(g,X+5,90,'A1','trm'); txt(g,X+5,142,'A2','trm');
    const cl1=sv('line',{x1:X,y1:56,x2:X,y2:96,class:'w dead'},g), cl2=sv('line',{x1:X,y1:130,x2:X,y2:170,class:'w dead'},g);
    DU.push(()=>{ const on=st.closed; crc.setAttribute('fill',on?'rgba(233,166,64,.55)':'none'); crc.setAttribute('stroke',on?'#e9a640':'#b9c7c4'); const L=st.V>20; cl1.setAttribute('class','w '+(L?'live':'dead')); cl2.setAttribute('class','w '+(L?'nr':'dead')); });
    [0,1,2].forEach(i=>{ const x=X+90+i*50; iecContact(g,x,70,'no',()=>contactClosed(i),i===0?'coil':null,null,[String(1+2*i),String(2+2*i)],()=>true); lampAt(g,x,180,'amber',()=>contactClosed(i)); });
    iecContact(g,X+270,70,'no',()=>contactClosed(3),null,null,['13','14'],()=>true); lampAt(g,X+270,180,'green',()=>contactClosed(3));
    iecContact(g,X+340,70,'nc',()=>contactClosed(4),null,null,['21','22'],()=>true); lampAt(g,X+340,180,'white',()=>contactClosed(4));
    sv('path',{d:`M${X+80} 102 H${X+340}`,class:'sym dash'},g);
    txt(g,X+140,224,LANG==='ar'?'الحمل (3 فاز)':'Load (3-phase)','dvs','middle'); txt(g,X+270,224,'13-14','dvs','middle'); txt(g,X+340,224,'21-22','dvs','middle');
    function lampAt(g,x,y,color,fn){ const col={green:'#3dff8a',white:'#f4f8ff',amber:'#ffb22e'}[color]; const c=sv('circle',{cx:x,cy:y,r:11,class:'sym'},g); sv('path',{d:`M${x-8} ${y-8} L${x+8} ${y+8} M${x+8} ${y-8} L${x-8} ${y+8}`,class:'sym'},g); DU.push(()=>{const on=fn(); c.setAttribute('fill',on?col:'none'); c.style.filter=on?`drop-shadow(0 0 6px ${col})`:'';}); }
    // voltage scale
    const sx=v=>X-10+v/260*400, sy=300;
    txt(g,X+190,272,LANG==='ar'?'جهد الملف: متى يجذب ومتى يفصل':'Coil voltage: pick-up and drop-out','dvt','middle');
    sv('rect',{x:sx(0),y:sy,width:400,height:14,rx:3,fill:'#0f1619',stroke:'#26363e'},g);
    sv('rect',{x:sx(125),y:sy,width:sx(196)-sx(125),height:14,fill:'#2a2410'},g);
    [[125,{ar:'يفصل ≈ 125V',en:'drops ≈ 125 V'}],[196,{ar:'يجذب ≈ 196V',en:'picks ≈ 196 V'}],[230,{ar:'المقنن 230V',en:'rated 230 V'}]].forEach(([v,l],k)=>{ sv('line',{x1:sx(v),y1:sy-6,x2:sx(v),y2:sy+20,stroke:k===2?'#5fd08b':'#ffc629','stroke-width':2},g); txt(g,sx(v),sy+36+k%2*14,tx(l),'dvs','middle'); });
    const ptr=sv('path',{d:'',fill:'#e9a640'},g);
    DU.push(()=>{ const x=sx(Math.min(260,st.V)); ptr.setAttribute('d',`M${x} ${sy-2} l-7 -12 h14 z`); });
    // indicator window
    sv('rect',{x:X+60,y:390,width:260,height:70,rx:8,fill:'#454e53',stroke:'#2a3236'},g); txt(g,X+190,384,LANG==='ar'?'المؤشر الميكانيكي في واجهة الكونتاكتور':'Mechanical indicator on the front','dvs','middle');
    sv('rect',{x:X+170,y:405,width:40,height:40,rx:3,fill:'#1b2226'},g); const ind=sv('rect',{x:X+174,y:409,width:32,height:12,fill:'#e8e8e4'},g);
    const msg=txt(g,X+190,484,'','dvs','middle');
    DU.push(()=>{ const mm=(1-st.gap); ind.setAttribute('y',409+mm*20); ind.setAttribute('fill',st.gap<0.5?'#3dd27a':'#e8e8e4');
      msg.textContent=st.burnt?(LANG==='ar'?'الملف محروق: الجهد موجود لكنه لا يجذب':'Coil burnt: voltage present but no pull-in'):(st.closed&&st.V<175)?(LANG==='ar'?'جهد ضعيف: الكونتاكتور يزن والكونتاكتات تسخن':'Low voltage: contactor hums, contacts overheat'):st.welded&&!st.closed?(LANG==='ar'?'خطر: قطب L2 ملحوم ومازال موصلًا رغم فصل الملف':'Danger: L2 pole welded, still conducting with coil off'):''; msg.style.fill=(st.burnt||st.welded||(st.closed&&st.V<175))?'#ff8a80':'#8fa4a0'; });
    // side
    const c1=mkCard(side,{ar:'جهد الملف A1-A2',en:'Coil voltage A1-A2'});
    const sl=mkSlider(c1,'d2v',{ar:'الجهد',en:'Voltage'},0,260,1,0,v=>v+' V~',v=>{st.V=v;});
    const rr=document.createElement('div'); rr.className='row'; c1.appendChild(rr);
    mkBtn(rr,'0 V',()=>{sl.value=0;sl.dispatchEvent(new Event('input'));}); mkBtn(rr,'230 V',()=>{sl.value=230;sl.dispatchEvent(new Event('input'));}); mkBtn(rr,'150 V',()=>{sl.value=150;sl.dispatchEvent(new Event('input'));});
    const p=document.createElement('p'); p.className='note'; p.style.margin='0'; p.textContent=LANG==='ar'?'ارفع الجهد ببطء من الصفر لحد ما يجذب، وبعدين نزّله ببطء لحد ما يفصل. هتلاقي الرقمين مختلفين.':'Raise the voltage slowly from zero until it pulls in, then lower it slowly until it drops. The two values differ.'; c1.appendChild(p);
    const c2=mkCard(side,{ar:'أعطال للتجربة',en:'Faults to try'}); const fl=document.createElement('div'); fl.className='flist'; c2.appendChild(fl);
    [['burnt',{ar:'الملف محروق',en:'Burnt coil'}],['weld',{ar:'قطب L2 يلحم عند القفل',en:'L2 pole welds on closing'}],['aux',{ar:'الكونتاكت المساعد 13-14 تالف',en:'Aux contact 13-14 worn'}]].forEach(([k,l])=>{ const b=mkBtn(fl,l,()=>{ st[k]=!st[k]; if(k==='weld'&&!st.weld) st.welded=false; b.classList.toggle('on',st[k]); }); });
    // below
    this.tl=mkTiles(below,[['v',{ar:'جهد الملف',en:'Coil voltage'}],['i',{ar:'تيار الملف',en:'Coil current'}],['s',{ar:'الحالة',en:'State'}],['m',{ar:'كونتاكتات القوى',en:'Main contacts'}]]);
    mkInfo(below,[
      {h:{ar:'أجزاء الكونتاكتور',en:'Contactor parts'},b:{ar:'<p><b>الملف A1-A2</b>: يتغذى من دائرة التحكم (230V أو 24V).</p><p><b>القلب الحديدي والجزء المتحرك</b>: الملف يمغنط القلب فيجذب الجزء المتحرك.</p><p><b>السوستة</b>: ترجع الجزء المتحرك لما يفصل الجهد.</p><p><b>كونتاكتات القوى</b> 1-2، 3-4، 5-6 (أو L1-T1، L2-T2، L3-T3) للموتور. <b>كونتاكتات مساعدة</b> 13-14 (NO) و21-22 (NC) لدائرة التحكم.</p>',en:'<p><b>Coil A1-A2</b>: fed from the control circuit (230 V or 24 V).</p><p><b>Iron core and armature</b>: the coil magnetizes the core, which pulls the armature.</p><p><b>Spring</b>: returns the armature when the voltage is removed.</p><p><b>Main contacts</b> 1-2, 3-4, 5-6 (L1-T1, L2-T2, L3-T3) for the motor. <b>Auxiliary contacts</b> 13-14 (NO) and 21-22 (NC) for the control circuit.</p>'}},
      {h:{ar:'جهد الجذب والفصل',en:'Pick-up and drop-out'},b:{ar:'<p>الكونتاكتور يجذب عند حوالي 85% من جهد الملف المقنن، ويفصل عند حوالي 50-60%. بعد ما يقفل يحتاج جهدًا أقل ليبقى ماسكًا لأن الفجوة الهوائية اختفت.</p><p>لو الجهد ضعيف (مثلًا 150 فولت) ممكن يزن ويهتز، والكونتاكتات تشرر وتسخن. لذلك راجع جهد التحكم عند أي صوت زن.</p>',en:'<p>A contactor picks up at about 85% of rated coil voltage and drops out at about 50-60%. Once closed it needs less voltage to hold because the air gap is gone.</p><p>At low voltage (say 150 V) it may hum and chatter, and the contacts arc and heat. Check the control voltage whenever a contactor hums.</p>'}},
      {h:{ar:'تيار الملف',en:'Coil current'},b:{ar:'<p>ملف التيار المتردد يسحب تيارًا كبيرًا لحظة الجذب (والفجوة مفتوحة)، ثم ينزل لحوالي عُشر القيمة بعد القفل. لو الجزء المتحرك اتزنق ولم يقفل، يفضل التيار عاليًا فيحترق الملف.</p>',en:'<p>An AC coil draws a high current at pick-up while the gap is open, then about a tenth of that once closed. If the armature jams and never closes, the current stays high and the coil burns.</p>'}},
      {h:{ar:'اختيار الكونتاكتور (AC-3، 400V)',en:'Choosing a contactor (AC-3, 400 V)'},b:{ar:'<table><tr><th>تيار الكونتاكتور</th><th>أقصى موتور</th></tr><tr><td class="mono">9 A</td><td>4 kW</td></tr><tr><td class="mono">12 A</td><td>5.5 kW</td></tr><tr><td class="mono">18 A</td><td>7.5 kW</td></tr><tr><td class="mono">25 A</td><td>11 kW</td></tr><tr><td class="mono">32 A</td><td>15 kW</td></tr><tr><td class="mono">40 A</td><td>18.5 kW</td></tr><tr><td class="mono">65 A</td><td>30 kW</td></tr></table><p>AC-3 هي فئة تشغيل وإيقاف الموتور الحثي العادي. واختر جهد الملف مثل جهد دائرة التحكم.</p>',en:'<table><tr><th>Contactor current</th><th>Max motor</th></tr><tr><td class="mono">9 A</td><td>4 kW</td></tr><tr><td class="mono">12 A</td><td>5.5 kW</td></tr><tr><td class="mono">18 A</td><td>7.5 kW</td></tr><tr><td class="mono">25 A</td><td>11 kW</td></tr><tr><td class="mono">32 A</td><td>15 kW</td></tr><tr><td class="mono">40 A</td><td>18.5 kW</td></tr><tr><td class="mono">65 A</td><td>30 kW</td></tr></table><p>AC-3 is the duty for starting and stopping a normal induction motor. Choose the coil voltage to match the control circuit.</p>'}},
    ]);
  },
  tick(dt){ const st=this.st;
    if(!st.closed&&st.V>=196&&!st.burnt){ st.closed=true; if(st.V<=210&&st.prevV<196) FLAGS.add('pick'); FLAGS.add('closed230'); }
    if(st.closed&&(st.V<=125||st.burnt)){ st.closed=false; if(st.V>=110&&st.V<=125) FLAGS.add('drop'); }
    st.prevV=st.V;
    const tgt=st.closed?0:1; st.gap+=(tgt-st.gap)*Math.min(1,dt*22); if(Math.abs(tgt-st.gap)<0.002) st.gap=tgt;
    if(st.weld&&st.gap<0.06) st.welded=true; if(st.welded&&!st.closed&&st.gap>0.9) FLAGS.add('weldSeen');
    if(st.burnt&&st.V>=200) FLAGS.add('burntSeen');
  },
  refresh(){ DU.forEach(f=>f()); const st=this.st,T=this.tl; T.v.textContent=Math.round(st.V)+' V'; const I=st.V>0&&!st.burnt?st.V/230*(st.gap<0.1?0.035:0.32):0; T.i.textContent=(I*1000).toFixed(0)+' mA';
    T.s.textContent=st.closed?(LANG==='ar'?'جاذب':'Picked up'):(LANG==='ar'?'مفصول':'Released'); T.s.style.color=st.closed?'var(--ok)':'var(--muted)';
    const mc=[0,1,2].map(i=>this.cc(i)); T.m.textContent=mc.every(Boolean)?(LANG==='ar'?'مقفولة':'Closed'):mc.some(Boolean)?(LANG==='ar'?'قطب واحد مقفول!':'One pole closed!'):(LANG==='ar'?'مفتوحة':'Open'); T.m.style.color=mc.some(Boolean)&&!mc.every(Boolean)?'var(--alarm)':mc.every(Boolean)?'var(--ok)':'var(--muted)'; },
  challenges:[
    {l:{ar:'غذِّ الملف بـ 230 فولت ولاحظ كل الكونتاكتات تتغير مرة واحدة.',en:'Feed the coil with 230 V and watch every contact change at once.'},f:'closed230'},
    {l:{ar:'ارفع الجهد ببطء واكتشف جهد الجذب.',en:'Raise the voltage slowly and find the pick-up voltage.'},f:'pick'},
    {l:{ar:'نزّل الجهد ببطء واكتشف جهد الفصل.',en:'Lower the voltage slowly and find the drop-out voltage.'},f:'drop'},
    {l:{ar:'جرّب عطل الملف المحروق وعطل القطب الملحوم.',en:'Try the burnt-coil and welded-pole faults.'},f:'burntSeen&weldSeen'},
  ],
  explain:{ar:[
    'الكونتاكتور مفتاح كهربي كبير يقفل ويفتح بالمغناطيس. نغذي ملفه بتيار صغير من دائرة التحكم، فيقفل كونتاكتات القوى التي تحمل تيار الموتور الكبير.',
    'كل الكونتاكتات مركبة على نفس الحامل: لما الملف يجذب، المفتوح يقفل والمقفول يفتح في نفس اللحظة. هذا ما نستخدمه في دوائر التثبيت والإنترلوك.',
    'كونتاكتات القوى (1-2، 3-4، 5-6) كبيرة ومصممة لقطع تيار الموتور. الكونتاكتات المساعدة (13-14، 21-22) صغيرة ولدائرة التحكم فقط.',
    'عطلان خطيران: الملف المحروق (الجهد موجود ولا يجذب) والكونتاكت الملحوم (الملف فصل لكن القطب مازال يوصل). لذلك لا تثق في أن الموتور فاصل لمجرد أن الكونتاكتور فصل؛ افصل القاطع قبل الصيانة.'
  ],en:[
    'A contactor is a large switch closed and opened by a magnet. A small current from the control circuit feeds its coil, which closes the main contacts carrying the big motor current.',
    'All contacts sit on one carrier: when the coil picks up, every NO closes and every NC opens at the same moment. Holding and interlock circuits rely on that.',
    'The main contacts (1-2, 3-4, 5-6) are large and rated to break motor current. The auxiliary contacts (13-14, 21-22) are small and only for the control circuit.',
    'Two dangerous faults: a burnt coil (voltage present, no pull-in) and a welded contact (coil off, pole still conducting). So never assume the motor is isolated just because the contactor dropped; open the breaker before maintenance.'
  ]},
  quiz:[
    {q:{ar:'الكونتاكتور يزن وصوته عالٍ. أول شيء تقيسه؟',en:'The contactor hums loudly. What do you measure first?'},o:[{ar:'جهد الملف A1-A2',en:'Coil voltage A1-A2'},{ar:'تيار الموتور',en:'Motor current'},{ar:'مقاومة العزل',en:'Insulation resistance'}],a:0,w:{ar:'الجهد الضعيف أشهر سبب للزن.',en:'Low voltage is the most common cause.'}},
    {q:{ar:'أي كونتاكت يستخدم لتثبيت الدائرة؟',en:'Which contact is used to hold the circuit?'},o:[{ar:'1-2',en:'1-2'},{ar:'13-14',en:'13-14'},{ar:'21-22',en:'21-22'}],a:1,w:{ar:'13-14 مساعد مفتوح، يقفل مع الجذب.',en:'13-14 is an auxiliary NO that closes on pick-up.'}},
    {q:{ar:'موتور 5.5 ك.وات على 400 فولت. أصغر كونتاكتور مناسب (AC-3)؟',en:'5.5 kW motor at 400 V. Smallest suitable contactor (AC-3)?'},o:[{ar:'9 أمبير',en:'9 A'},{ar:'12 أمبير',en:'12 A'},{ar:'25 أمبير',en:'25 A'}],a:1,w:{ar:'12 أمبير AC-3 تكفي حتى 5.5 ك.وات.',en:'12 A AC-3 covers up to 5.5 kW.'}}
  ]
};

/* ---------- D3: protection: fuse, MPCB, overload ---------- */
const D3={ key:'prot', unit:1, kind:'device', name:{ar:'الحماية: الفيوز وقاطع الموتور والأوفرلود',en:'Protection: fuse, motor breaker, overload'},
  build(svg,side,below){
    const st=this.st={load:100,ir:11,heat:0,trip:false,mode:'H',fast:false,q1:true,q1trip:false,fuse:true,el:0,flash:0,running:true};
    const g=dvG(svg,1000,500);
    // overload drawing
    txt(g,230,28,LANG==='ar'?'الأوفرلود من الداخل':'Inside the overload relay','dvt','middle');
    sv('rect',{x:40,y:40,width:380,height:300,rx:12,fill:'#1a2328',stroke:'#3a4a52','stroke-width':2},g);
    const strips=[]; [100,180,260].forEach((x,i)=>{
      sv('rect',{x:x-8,y:56,width:16,height:14,fill:'#6f7b81'},g); txt(g,x,52,['L1','L2','L3'][i],'dvm','middle');
      const s=sv('path',{d:'',fill:'none',stroke:'#c9a34a','stroke-width':7,'stroke-linecap':'round'},g); const s2=sv('path',{d:'',fill:'none',stroke:'#9aa8ae','stroke-width':3},g);
      const h=sv('path',{d:'',fill:'none',stroke:'#d36a2a','stroke-width':2},g);
      strips.push({x,s,s2,h}); });
    const tbar=sv('rect',{x:80,y:206,width:230,height:8,rx:3,fill:'#cfd5d7'},g);
    const lever=sv('line',{x1:320,y1:210,x2:350,y2:150,stroke:'#cfd5d7','stroke-width':5,'stroke-linecap':'round'},g);
    txt(g,370,96,'95-96','dvm'); txt(g,370,276,'97-98','dvm');
    const c95=sv('line',{x1:360,y1:120,x2:400,y2:120,stroke:'#5fd08b','stroke-width':4},g), c97=sv('line',{x1:360,y1:250,x2:400,y2:250,stroke:'#59666b','stroke-width':4},g);
    // dial + buttons
    sv('circle',{cx:100,cy:286,r:24,fill:'#f2f2ee',stroke:'#2a3236'},g); const dp=sv('line',{x1:100,y1:286,x2:100,y2:266,stroke:'#c0392b','stroke-width':3},g); const dT=txt(g,100,326,'','dvm','middle');
    const rb=sv('g',{class:'clk',tabindex:'0',role:'button','aria-label':'reset'},g); sv('circle',{cx:190,cy:286,r:16,fill:'#2f7fd1',stroke:'#173f69'},rb); txt(rb,190,290,'R','pvw','middle'); txt(g,190,324,LANG==='ar'?'ريست':'Reset','dvs','middle');
    const tb=sv('g',{class:'clk',tabindex:'0',role:'button','aria-label':'test'},g); sv('rect',{x:244,y:274,width:30,height:24,rx:4,fill:'#d0342a'},tb); txt(tb,259,291,'T','pvw','middle'); txt(g,259,324,LANG==='ar'?'اختبار':'Test','dvs','middle');
    const mT=txt(g,330,300,'','dvm','middle');
    rb.addEventListener('click',()=>this.reset()); tb.addEventListener('click',()=>{ if(!st.trip){st.trip=true; FLAGS.add('test');} });
    DU.push(()=>{ const h=Math.min(1.1,st.heat);
      strips.forEach(({x,s,s2,h:hh})=>{ const b=h*26; s.setAttribute('d',`M${x} 70 Q${x+b*0.5} 140 ${x+b} 200`); s2.setAttribute('d',`M${x+4} 72 Q${x+4+b*0.5} 140 ${x+4+b} 198`);
        let d=`M${x-12} 90`; for(let k=0;k<7;k++) d+=` L${x+12+b*0.25*(k/7)} ${96+k*12} L${x-12+b*0.25*(k/7)} ${102+k*12}`; hh.setAttribute('d',d); hh.style.stroke=st.running&&this.I()>0?'#ff7a2a':'#6b4a33'; });
      tbar.setAttribute('x',80+Math.min(1,h)*26); const tr=st.trip; lever.setAttribute('x2',tr?385:350); lever.setAttribute('y2',tr?180:150);
      c95.setAttribute('y1',tr?110:120); c95.setAttribute('stroke',tr?'#59666b':'#5fd08b'); c95.setAttribute('x2',tr?396:400); c95.setAttribute('y2',120);
      c97.setAttribute('stroke',tr?'#ffb22e':'#59666b'); c97.setAttribute('y1',tr?250:240);
      const a=-130+(st.ir-6)/10*260; dp.setAttribute('transform',`rotate(${a} 100 286)`); dT.textContent='Ir '+st.ir+' A';
      mT.textContent=st.mode==='H'?'H (يدوي)':'A (أوتو)'; if(LANG!=='ar') mT.textContent=st.mode==='H'?'H (manual)':'A (auto)'; });
    // trip curve
    const GX=500,GY=50,GW=440,GH=250;
    txt(g,GX+GW/2,28,LANG==='ar'?'منحنى الفصل (Class 10): كل ما التيار يزيد يفصل أسرع':'Trip curve (Class 10): more current, faster trip','dvt','middle');
    const lx=r=>GX+Math.log10(r)/Math.log10(10)*GW, ly=tt=>GY+GH-(Math.log10(tt)/3)*GH;
    sv('rect',{x:GX,y:GY,width:GW,height:GH,fill:'#0f1619',stroke:'#26363e'},g);
    [1,2,3,5,7.2,10].forEach(r=>{ sv('line',{x1:lx(r),y1:GY,x2:lx(r),y2:GY+GH,stroke:'#1d2a30'},g); txt(g,lx(r),GY+GH+16,r+'×','dvs','middle'); });
    [1,10,100,1000].forEach(tt=>{ sv('line',{x1:GX,y1:ly(tt),x2:GX+GW,y2:ly(tt),stroke:'#1d2a30'},g); txt(g,GX-6,ly(tt)+4,tt+'s','dvs','end'); });
    txt(g,GX+GW/2,GY+GH+34,LANG==='ar'?'التيار ÷ ضبط الأوفرلود':'Current ÷ overload setting','dvs','middle');
    let d=''; for(let r=1.08;r<=10;r*=1.03){ const tt=360/(r*r-1); if(tt>1000) continue; d+=(d?' L':'M')+lx(r).toFixed(1)+' '+ly(Math.max(1,tt)).toFixed(1); }
    sv('path',{d,fill:'none',stroke:'#e9a640','stroke-width':2.5},g);
    const dot=sv('circle',{cx:0,cy:0,r:7,fill:'#55b6ea',stroke:'#fff','stroke-width':2},g); const dl=txt(g,0,0,'','dvm');
    DU.push(()=>{ const r=this.I()/st.ir; if(r>1.08&&st.running){ const tt=360/(r*r-1); dot.style.display=''; const x=lx(Math.min(10,r)), y=ly(Math.min(1000,Math.max(1,tt))); dot.setAttribute('cx',x); dot.setAttribute('cy',y); dl.setAttribute('x',x+10); dl.setAttribute('y',y-8); dl.textContent=(LANG==='ar'?'يفصل بعد ':'trips in ')+Math.max(0,tt*(1-Math.min(1,st.heat))).toFixed(0)+' s'; } else { dot.style.display='none'; dl.textContent=''; } });
    // MPCB + fuse strip
    txt(g,500,372,LANG==='ar'?'ضد القصر (الشورت): قاطع الموتور أو الفيوز يفصل في لحظة':'Against short circuit: the motor breaker or fuse opens instantly','dvt','middle');
    sv('rect',{x:120,y:388,width:120,height:96,rx:6,fill:'#3f474b',stroke:'#23292c'},g); txt(g,180,404,'Q1 MPCB','pvw','middle');
    sv('circle',{cx:180,cy:444,r:22,fill:'#15191b'},g); const qk=sv('rect',{x:176,y:424,width:8,height:22,rx:2,fill:'#e7ecea'},g); const qt=txt(g,180,480,'','pvw','middle');
    const fl=sv('circle',{cx:300,cy:436,r:30,fill:'none',stroke:'#ffd84d','stroke-width':3},g);
    sv('rect',{x:640,y:404,width:120,height:40,rx:20,fill:'#d9d0b0',stroke:'#8d8778'},g); const fw=sv('line',{x1:650,y1:424,x2:750,y2:424,stroke:'#7d6a2a','stroke-width':3},g); txt(g,700,466,LANG==='ar'?'فيوز (يُستبدل بعد الشورت)':'Fuse (replace after a short)','dvs','middle');
    const ft=txt(g,700,488,'','dvm','middle');
    txt(g,470,430,LANG==='ar'?'أو':'or','dvt','middle');
    DU.push(()=>{ qk.setAttribute('transform',`rotate(${st.q1?0:st.q1trip?-45:-90} 180 444)`); qt.textContent=st.q1?'ON':st.q1trip?'TRIP':'OFF'; qt.style.fill=st.q1?'#7dffb0':'#ffb22e'; fl.style.display=st.flash>0?'':'none';
      fw.setAttribute('stroke',st.fuse?'#7d6a2a':'none'); ft.textContent=st.fuse?'':'✕'; ft.style.fill='#ff5d50'; });
    // side
    const c1=mkCard(side,{ar:'الموتور والأوفرلود',en:'Motor and overload'});
    mkSlider(c1,'d3l',{ar:'حمل الموتور',en:'Motor load'},0,300,5,100,v=>v+'%  ('+(11*v/100).toFixed(1)+' A)',v=>{st.load=v;});
    mkSlider(c1,'d3i',{ar:'ضبط الأوفرلود Ir',en:'Overload setting Ir'},6,16,0.5,11,v=>v.toFixed(1)+' A',v=>{st.ir=v;});
    const p=document.createElement('p'); p.className='note'; p.style.margin='0'; p.textContent=LANG==='ar'?'الموتور مكتوب على لوحته 11 أمبير. اضبط Ir عليه.':'The motor nameplate says 11 A. Set Ir to it.'; c1.appendChild(p);
    mkSeg(c1,[['H',{ar:'ريست يدوي H',en:'Manual reset H'}],['A',{ar:'ريست أوتو A',en:'Auto reset A'}]],'H',v=>{st.mode=v; if(v==='A') FLAGS.add('autoMode');});
    const rr=document.createElement('div'); rr.className='row'; c1.appendChild(rr);
    mkBtn(rr,{ar:'ريست',en:'Reset'},()=>this.reset()); mkBtn(rr,{ar:'زر الاختبار',en:'Test'},()=>{ if(!st.trip){st.trip=true;FLAGS.add('test');} });
    this.note=document.createElement('p'); this.note.className='note'; this.note.style.margin='0'; c1.appendChild(this.note);
    const lb=document.createElement('label'); lb.className='chk'; lb.innerHTML=`<input type="checkbox"><span>${LANG==='ar'?'تسريع الوقت ×10':'Speed up time ×10'}</span>`; c1.appendChild(lb); lb.querySelector('input').addEventListener('change',e=>st.fast=e.target.checked);
    const c2=mkCard(side,{ar:'قصر (شورت)',en:'Short circuit'});
    const r2=document.createElement('div'); r2.className='row'; c2.appendChild(r2);
    mkBtn(r2,{ar:'اعمل شورت عند الموتور',en:'Short at the motor'},()=>{ st.flash=0.6; if(st.q1){st.q1=false;st.q1trip=true;} st.fuse=false; FLAGS.add('short'); },'on');
    mkBtn(r2,{ar:'رجّع Q1 وبدّل الفيوز',en:'Reset Q1, replace fuse'},()=>{ st.q1=true; st.q1trip=false; st.fuse=true; });
    // below
    this.tl=mkTiles(below,[['i',{ar:'تيار الموتور',en:'Motor current'}],['r',{ar:'التيار ÷ الضبط',en:'Current ÷ setting'}],['h',{ar:'سخونة البايمتال',en:'Bimetal heat'}],['s',{ar:'الحالة',en:'State'}]]);
    mkInfo(below,[
      {h:{ar:'مين يحمي من إيه؟',en:'What protects against what?'},b:{ar:'<table><tr><th>الجهاز</th><th>يحمي من</th><th>السرعة</th></tr><tr><td>الفيوز</td><td>القصر (الشورت)</td><td>لحظي، ويُستبدل</td></tr><tr><td>قاطع الموتور MPCB</td><td>القصر + حمل زائد</td><td>مغناطيسي لحظي + حراري</td></tr><tr><td>الأوفرلود</td><td>الحمل الزائد فقط</td><td>متأخر حسب التيار</td></tr></table><p>الأوفرلود لا يحمي من الشورت، لذلك يركب دائمًا مع فيوز أو قاطع.</p>',en:'<table><tr><th>Device</th><th>Protects against</th><th>Speed</th></tr><tr><td>Fuse</td><td>Short circuit</td><td>Instant, then replaced</td></tr><tr><td>Motor breaker MPCB</td><td>Short circuit + overload</td><td>Instant magnetic + thermal</td></tr><tr><td>Overload relay</td><td>Overload only</td><td>Delayed by current</td></tr></table><p>An overload relay does not protect against short circuits, so it always comes with a fuse or breaker.</p>'}},
      {h:{ar:'ضبط الأوفرلود',en:'Setting the overload'},b:{ar:'<p>اضبطه على التيار المكتوب على لوحة الموتور. لو ضبطته أقل سيفصل بدون سبب، ولو أعلى لن يحمي الموتور.</p><p>في دائرة ستار/دلتا لو الأوفرلود في خط الملفات يضبط على 0.58 من تيار الموتور.</p>',en:'<p>Set it to the motor nameplate current. Lower causes nuisance trips, higher leaves the motor unprotected.</p><p>In star-delta, if the overload is in the winding line, set it to 0.58 of motor current.</p>'}},
      {h:{ar:'95-96 و 97-98',en:'95-96 and 97-98'},b:{ar:'<p><b>95-96</b> مقفول، يركب على التوالي مع ملف الكونتاكتور فيفصله عند الفصل.</p><p><b>97-98</b> مفتوح، يقفل عند الفصل لتشغيل لمبة أو جرس إنذار.</p>',en:'<p><b>95-96</b> is NC, wired in series with the contactor coil to drop it on a trip.</p><p><b>97-98</b> is NO, closes on a trip to light an alarm lamp or bell.</p>'}},
      {h:{ar:'ريست يدوي أم أوتوماتيك؟',en:'Manual or auto reset?'},b:{ar:'<p>في الوضع A يرجع الأوفرلود وحده بعد ما يبرد. لو الدائرة بزر تثبيت لن يدور الموتور وحده، لكن في دوائر العوامة والضغط سيدور فجأة. الأفضل الوضع H.</p>',en:'<p>In mode A the relay resets by itself once cool. With a latching start the motor will not restart, but in float or pressure circuits it will start suddenly. Mode H is safer.</p>'}},
    ]);
  },
  I(){ const st=this.st; return st.running?11*st.load/100:0; },
  reset(){ const st=this.st; if(!st.trip) return; if(st.heat>0.7){ this.note.textContent=LANG==='ar'?'البايمتال لسه سخن، انتظر حتى يبرد.':'Bimetal still hot, wait for it to cool.'; return; } st.trip=false; this.note.textContent=''; if(FLAGS.has('olTrip')) FLAGS.add('resetOk'); },
  tick(dt){ const st=this.st; const k=st.fast?10:1; st.running=st.q1&&st.fuse&&!st.trip;
    const r=this.I()/st.ir; if(r>1.05) st.heat+=dt*k*(r*r-1)/360; else st.heat=Math.max(0,st.heat-dt*k/90);
    st.heat=Math.min(1.2,st.heat);
    if(!st.trip&&st.heat>=1){ st.trip=true; FLAGS.add('olTrip'); if(st.ir<9.5&&st.load<=100) FLAGS.add('nuisance'); }
    if(st.trip&&st.mode==='A'&&st.heat<0.6){ st.trip=false; FLAGS.add('autoReset'); }
    st.flash=Math.max(0,st.flash-dt); },
  refresh(){ DU.forEach(f=>f()); const st=this.st,T=this.tl; T.i.textContent=this.I().toFixed(1)+' A'; T.r.textContent=(this.I()/st.ir).toFixed(2)+' ×'; T.h.textContent=Math.round(Math.min(1,st.heat)*100)+' %';
    T.s.textContent=!st.q1||!st.fuse?(LANG==='ar'?'فصل من الشورت':'Short-circuit trip'):st.trip?(LANG==='ar'?'أوفرلود فاصل':'Overload tripped'):(LANG==='ar'?'الموتور يعمل':'Motor running'); T.s.style.color=st.trip||!st.q1||!st.fuse?'var(--alarm)':'var(--ok)';
    if(st.trip&&st.heat<=0.7&&this.note.textContent) this.note.textContent=''; },
  challenges:[
    {l:{ar:'زوّد الحمل لـ 150% أو أكثر حتى يفصل الأوفرلود.',en:'Raise the load to 150% or more until the overload trips.'},f:'olTrip'},
    {l:{ar:'انتظر حتى يبرد واعمل ريست.',en:'Wait for it to cool and reset.'},f:'resetOk'},
    {l:{ar:'اضبط Ir على 8 أمبير والموتور 100%: لاحظ الفصل بدون سبب حقيقي.',en:'Set Ir to 8 A with the motor at 100%: see a nuisance trip.'},f:'nuisance'},
    {l:{ar:'اعمل شورت ولاحظ أن Q1 والفيوز فصلوا في لحظة، بعكس الأوفرلود.',en:'Make a short and see Q1 and the fuse open instantly, unlike the overload.'},f:'short'},
  ],
  explain:{ar:[
    'الموتور محتاج نوعين من الحماية: حماية من القصر (شورت) يكون فيها التيار عشرات أضعاف المقنن ولازم يفصل فورًا، وحماية من الحمل الزائد يكون فيها التيار أعلى قليلًا لكن لفترة طويلة.',
    'الأوفرلود الحراري فيه ثلاث شرائح بايمتال (معدنين ملتصقين يتمددان بشكل مختلف). التيار يسخنها فتنحني، ولو انحنت كفاية تدفع ذراعًا يفتح 95-96 ويقفل 97-98.',
    'لأن الحرارة تحتاج وقتًا، الأوفرلود يسمح بتيار البدء العالي لثوانٍ قليلة ولا يفصل، لكنه يفصل لو الزيادة استمرت. منحنى الفصل يوضح العلاقة: كل ما التيار يزيد، الزمن يقل.',
    'لو فاز اتقطع، تيار الفازتين الباقيتين يزيد ويسخن البايمتال، والأوفرلود الحديث يكتشف عدم التوازن ويفصل أسرع.'
  ],en:[
    'A motor needs two kinds of protection: against short circuit, where current is tens of times rated and must be cleared instantly, and against overload, where current is a little high but for a long time.',
    'A thermal overload has three bimetal strips (two bonded metals that expand differently). Current heats them so they bend; when they bend far enough they push a lever that opens 95-96 and closes 97-98.',
    'Because heating takes time, the relay lets the high starting current pass for a few seconds without tripping, but trips if the excess lasts. The trip curve shows it: more current, shorter time.',
    'If a phase is lost, current in the other two rises and heats the bimetal, and modern relays detect the imbalance and trip faster.'
  ]},
  quiz:[
    {q:{ar:'أي جهاز لا يحمي من القصر؟',en:'Which device does not protect against short circuit?'},o:[{ar:'الفيوز',en:'Fuse'},{ar:'قاطع الموتور',en:'Motor breaker'},{ar:'الأوفرلود الحراري',en:'Thermal overload'}],a:2,w:{ar:'الأوفرلود متأخر بطبيعته.',en:'The overload is delayed by design.'}},
    {q:{ar:'موتور تياره 11 أمبير. على كم تضبط الأوفرلود؟',en:'A motor is rated 11 A. What do you set the overload to?'},o:[{ar:'8 أمبير',en:'8 A'},{ar:'11 أمبير',en:'11 A'},{ar:'16 أمبير',en:'16 A'}],a:1,w:{ar:'على تيار لوحة الموتور.',en:'To the nameplate current.'}},
    {q:{ar:'ليه الأوفرلود ما بيفصلش وقت بدء الموتور رغم أن التيار 6 أضعاف؟',en:'Why does the overload not trip at start although current is 6×?'},o:[{ar:'لأن البدء ثوانٍ قليلة والبايمتال يحتاج وقتًا ليسخن',en:'Start lasts seconds and the bimetal needs time to heat'},{ar:'لأنه مفصول وقت البدء',en:'It is bypassed at start'},{ar:'لأن التيار لا يمر فيه',en:'Current does not pass through it'}],a:0,w:{ar:'هذا هو الفرق بين الحمل الزائد والشورت.',en:'That is the difference between overload and short.'}}
  ]
};

/* ---------- D4: three-phase motor ---------- */
const D4={ key:'mot', unit:1, kind:'device', name:{ar:'الموتور ثلاثي الفاز: ستار ودلتا والاتجاه',en:'Three-phase motor: star, delta, direction'},
  build(svg,side,below){
    const st=this.st={plate:'400/690',conn:'D',swap:false,run:false,load:60,speed:0,ang:0,burnt:false,burnT:0};
    const g=dvG(svg,1000,480);
    // nameplate
    sv('rect',{x:30,y:40,width:290,height:240,rx:8,fill:'#c9cdcc',stroke:'#7d8689','stroke-width':2},g);
    txt(g,175,30,LANG==='ar'?'لوحة بيانات الموتور':'Motor nameplate','dvt','middle');
    const pl=[]; for(let k=0;k<9;k++){ const tt=txt(g,46,66+k*24,'','pvm'); tt.style.fontSize='13px'; pl.push(tt); }
    sv('rect',{x:30,y:40,width:290,height:240,rx:8,fill:'none',stroke:'#7d8689','stroke-width':2},g);
    DU.push(()=>{ const a=st.plate==='400/690'; const L=[`3~ Mot.   IEC 60034`,`5.5 kW    S1    50 Hz`,a?'400 / 690 V   Δ / Y':'230 / 400 V   Δ / Y',a?'11.0 / 6.4 A':'19.0 / 11.0 A','1450 min⁻¹   cos φ 0.84','IP55   Ins.Cl. F','IE3   η 89.6 %','Frame 132S   B3','No. 2026-11-0423']; pl.forEach((t,i)=>t.textContent=L[i]); });
    // terminal box
    const TX=360,TY=40;
    txt(g,TX+130,30,LANG==='ar'?'علبة الأطراف':'Terminal box','dvt','middle');
    sv('rect',{x:TX,y:TY,width:260,height:300,rx:10,fill:'#2f3b42',stroke:'#4a5a62','stroke-width':2},g);
    const pos={W2:[TX+50,TY+90],U2:[TX+130,TY+90],V2:[TX+210,TY+90],U1:[TX+50,TY+190],V1:[TX+130,TY+190],W1:[TX+210,TY+190]};
    const wind=[['U1','U2','#c08040'],['V1','V2','#c08040'],['W1','W2','#c08040']].map(([a,b,c])=>sv('line',{x1:pos[a][0],y1:pos[a][1],x2:pos[b][0],y2:pos[b][1],stroke:c,'stroke-width':3,'stroke-dasharray':'6 5',opacity:.55},g));
    const bridges=sv('g',{},g);
    Object.entries(pos).forEach(([k,[x,y]])=>{ sv('circle',{cx:x,cy:y,r:14,fill:'#b8860b',stroke:'#7a5a08','stroke-width':2},g); sv('circle',{cx:x,cy:y,r:5,fill:'#e8d28a'},g); txt(g,x,y+(k.endsWith('2')?-22:30),k,'dvm','middle'); });
    const cab=sv('g',{},g);
    const drawConn=()=>{ bridges.innerHTML=''; const br=(a,b)=>sv('line',{x1:pos[a][0],y1:pos[a][1],x2:pos[b][0],y2:pos[b][1],stroke:'#d9dde0','stroke-width':10,'stroke-linecap':'round',opacity:.9},bridges);
      if(st.conn==='Y'){ br('W2','U2'); br('U2','V2'); } else { br('W2','U1'); br('U2','V1'); br('V2','W1'); }
      cab.innerHTML=''; const tgt=st.swap?['W1','V1','U1']:['U1','V1','W1']; const cols=['#8a5a2b','#111','#888'];
      ['L1','L2','L3'].forEach((l,i)=>{ const [x,y]=pos[tgt[i]]; const sx=TX+50+i*80; sv('path',{d:`M${sx} ${TY+330} V${TY+280} L${x} ${y+16}`,stroke:cols[i],'stroke-width':6,fill:'none','stroke-linecap':'round'},cab); txt(cab,sx,TY+354,l,'dvm','middle'); }); };
    this.drawConn=drawConn; drawConn();
    // motor + winding schematic
    const MX=800, MY=150;
    txt(g,MX,30,LANG==='ar'?'الموتور':'Motor','dvt','middle');
    const mc=sv('circle',{cx:MX,cy:MY,r:80,fill:'#2b4a66',stroke:'#4f7aa0','stroke-width':4},g);
    const rot=sv('g',{},g); for(let k=0;k<6;k++) sv('line',{x1:MX,y1:MY,x2:MX,y2:MY-66,stroke:'#e9a640','stroke-width':5,'stroke-linecap':'round',transform:`rotate(${k*60} ${MX} ${MY})`},rot);
    sv('circle',{cx:MX,cy:MY,r:12,fill:'#a9b1b4'},g);
    const dirT=txt(g,MX,MY+110,'','dvt','middle'), spT=txt(g,MX,MY+132,'','dvm','middle');
    const sch=sv('g',{},g);
    const drawSch=()=>{ sch.innerHTML=''; const cx=MX, cy=390, r=50;
      if(st.conn==='Y'){ [[-90],[30],[150]].forEach(([a],i)=>{ const ra=a*Math.PI/180; const x=cx+Math.cos(ra)*r, y=cy+Math.sin(ra)*r; sv('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#c08040','stroke-width':3},sch); sv('circle',{cx:x,cy:y,r:4,fill:'#e9a640'},sch); txt(sch,x+(i===1?10:i===2?-10:0),y+(i===0?-8:16),['L1','L2','L3'][i],'dvm',i===1?'start':i===2?'end':'middle'); }); txt(sch,cx+70,cy+4,'Y','dvt'); }
      else { const pts=[-90,30,150].map(a=>[cx+Math.cos(a*Math.PI/180)*r,cy+Math.sin(a*Math.PI/180)*r]); sv('path',{d:`M${pts[0]} L${pts[1]} L${pts[2]} Z`,fill:'none',stroke:'#c08040','stroke-width':3},sch); pts.forEach((p,i)=>{ sv('circle',{cx:p[0],cy:p[1],r:4,fill:'#e9a640'},sch); txt(sch,p[0]+(i===1?10:i===2?-10:0),p[1]+(i===0?-8:16),['L1','L2','L3'][i],'dvm',i===1?'start':i===2?'end':'middle'); }); txt(sch,cx+70,cy+4,'Δ','dvt'); }
    };
    this.drawSch=drawSch; drawSch();
    const vw=txt(g,MX,470,'','dvm','middle');
    const msg=txt(g,TX+130,TY+400,'','dvt','middle');
    DU.push(()=>{ const r=this.ratio(); rot.setAttribute('transform',`rotate(${st.ang} ${MX} ${MY})`); mc.setAttribute('stroke',st.burnt?'#ff5d50':st.run?'#5fd08b':'#4f7aa0'); mc.setAttribute('fill',st.burnt?'#4a2320':'#2b4a66');
      dirT.textContent=Math.abs(st.speed)>5?(st.speed>0?(LANG==='ar'?'↻ مع عقارب الساعة':'↻ clockwise'):(LANG==='ar'?'↺ عكس عقارب الساعة':'↺ anticlockwise')):''; spT.textContent=Math.round(Math.abs(st.speed))+' rpm';
      const Vw=st.conn==='D'?400:231; vw.textContent=(LANG==='ar'?'الجهد على كل ملف = ':'Voltage per winding = ')+Vw+' V';
      wind.forEach(w=>{ w.setAttribute('stroke',!st.run?'#c08040':r>1.3?'#ff5d50':r<0.8?'#55b6ea':'#5fd08b'); w.setAttribute('opacity',st.run?1:.55); });
      let m=''; if(st.burnt) m=LANG==='ar'?'الملفات احترقت: جهد الملف كان 1.73 ضعف المقنن':'Windings burnt: winding voltage was 1.73× rated';
      else if(st.run&&r<0.8) m=LANG==='ar'?'ضعيف: كل ملف عليه 58% من جهده، العزم الثلث':'Weak: each winding gets 58% of its voltage, one third torque';
      else if(st.run&&r>1.3) m=LANG==='ar'?'خطر! جهد زائد على الملفات… سيحترق':'Danger! Overvoltage on windings… it will burn';
      else if(st.run) m=LANG==='ar'?'التوصيل صحيح':'Correct connection';
      msg.textContent=m; msg.style.fill=st.burnt||(st.run&&r>1.3)?'#ff8a80':st.run&&r<0.8?'#55b6ea':'#5fd08b'; });
    // side
    const c1=mkCard(side,{ar:'اختيار الموتور والتوصيل',en:'Motor and connection'});
    const l1=document.createElement('span'); l1.className='note'; l1.textContent=LANG==='ar'?'لوحة البيانات':'Nameplate'; c1.appendChild(l1);
    mkSeg(c1,[['400/690','400/690 V'],['230/400','230/400 V']],'400/690',v=>{st.plate=v; st.burnt=false;});
    const l2=document.createElement('span'); l2.className='note'; l2.textContent=LANG==='ar'?'الكباري في علبة الأطراف (الشبكة 400 فولت)':'Bridges in the terminal box (400 V network)'; c1.appendChild(l2);
    mkSeg(c1,[['Y',{ar:'ستار Y',en:'Star Y'}],['D',{ar:'دلتا Δ',en:'Delta Δ'}]],'D',v=>{ if(st.run){ return; } st.conn=v; drawConn(); drawSch(); });
    const n=document.createElement('p'); n.className='note'; n.style.margin='0'; n.textContent=LANG==='ar'?'غيّر الكباري والموتور واقف فقط.':'Change bridges only with the motor stopped.'; c1.appendChild(n);
    const r=document.createElement('div'); r.className='row'; c1.appendChild(r);
    mkBtn(r,{ar:'بدّل فازتين (L1↔L3)',en:'Swap two phases (L1↔L3)'},()=>{ st.swap=!st.swap; drawConn(); if(st.run) FLAGS.add('swapRun'); });
    const c2=mkCard(side,{ar:'تشغيل',en:'Run'}); const r2=document.createElement('div'); r2.className='row'; c2.appendChild(r2);
    mkBtn(r2,{ar:'تشغيل',en:'Start'},()=>{ if(!st.burnt) st.run=true; },'sel'); mkBtn(r2,{ar:'إيقاف',en:'Stop'},()=>{ st.run=false; }); mkBtn(r2,{ar:'إصلاح (لف جديد)',en:'Rewind (repair)'},()=>{ st.burnt=false; });
    mkSlider(c2,'d4l',{ar:'الحمل',en:'Load'},0,100,5,60,v=>v+'%',v=>{st.load=v;});
    // below
    this.tl=mkTiles(below,[['vw',{ar:'جهد الملف',en:'Winding voltage'}],['i',{ar:'تيار الخط',en:'Line current'}],['sp',{ar:'السرعة',en:'Speed'}],['s',{ar:'الحالة',en:'State'}]]);
    mkInfo(below,[
      {h:{ar:'قراءة لوحة البيانات',en:'Reading the nameplate'},b:{ar:'<p><b>400/690 V Δ/Y</b>: كل ملف مصمم على 400 فولت. على شبكة 400 فولت نوصله دلتا، وعلى شبكة 690 نوصله ستار.</p><p><b>230/400 V Δ/Y</b>: كل ملف 230 فولت. على شبكة 400 فولت نوصله ستار.</p><p>القاعدة: الرقم الأصغر هو جهد الملف الواحد.</p>',en:'<p><b>400/690 V Δ/Y</b>: each winding is rated 400 V. On a 400 V network connect delta, on 690 V connect star.</p><p><b>230/400 V Δ/Y</b>: each winding is 230 V. On a 400 V network connect star.</p><p>Rule: the smaller number is the voltage of one winding.</p>'}},
      {h:{ar:'الكباري في علبة الأطراف',en:'Bridges in the terminal box'},b:{ar:'<p>الأطراف مرصوصة بحيث الكباري تكون سهلة: <b>ستار</b> = كوبري أفقي يربط W2-U2-V2 (نقطة النجمة). <b>دلتا</b> = ثلاث كباري رأسية W2-U1، U2-V1، V2-W1.</p>',en:'<p>The terminals are arranged so bridges are easy: <b>star</b> = one horizontal bar joining W2-U2-V2 (star point). <b>Delta</b> = three vertical bars W2-U1, U2-V1, V2-W1.</p>'}},
      {h:{ar:'عكس الاتجاه',en:'Reversing'},b:{ar:'<p>بدّل أي فازتين من الثلاثة (مثلًا L1 مع L3) فيعكس المجال الدوار ويعكس الموتور اتجاهه. تبديل الثلاثة معًا لا يغير الاتجاه.</p>',en:'<p>Swap any two of the three phases (for example L1 and L3); the rotating field reverses and so does the motor. Swapping all three changes nothing.</p>'}},
      {h:{ar:'باقي اللوحة',en:'The rest of the plate'},b:{ar:'<p><b>kW</b> القدرة الميكانيكية على العمود. <b>1450 min⁻¹</b> يعني موتور 4 أقطاب على 50 هرتز. <b>IP55</b> حماية من التراب ورش المياه. <b>Ins.Cl. F</b> عزل يتحمل 155 درجة.</p>',en:'<p><b>kW</b> is mechanical power at the shaft. <b>1450 min⁻¹</b> means a 4-pole motor at 50 Hz. <b>IP55</b> protects against dust and water jets. <b>Ins.Cl. F</b> insulation withstands 155 °C.</p>'}},
    ]);
  },
  ratio(){ const st=this.st; const rated=st.plate==='400/690'?400:230; const Vw=st.conn==='D'?400:231; return Vw/rated; },
  tick(dt){ const st=this.st, r=this.ratio(), load=st.load/100;
    if(st.run&&!st.burnt){ const tf=r*r; let tgt=1450*(st.swap?-1:1); if(load>tf*2.2) tgt*=0.3; else tgt*=Math.max(0.85,1-0.035*load/Math.min(1,tf));
      st.speed+=(tgt-st.speed)*Math.min(1,dt*2*Math.min(1,tf*1.5));
      if(r>1.3){ st.burnT+=dt; if(st.burnT>3){ st.burnt=true; st.run=false; FLAGS.add('burn'); } } else st.burnT=0;
      if(Math.abs(st.speed)>1300&&r>0.9&&r<1.1){ FLAGS.add(st.plate==='400/690'?'ok690':'ok400'); if(st.speed<0) FLAGS.add('revRun'); }
    } else { st.speed-=Math.sign(st.speed)*Math.min(Math.abs(st.speed),dt*400); }
    st.ang=(st.ang+st.speed/60*360*dt*0.1)%360; },
  refresh(){ DU.forEach(f=>f()); const st=this.st,T=this.tl,r=this.ratio(); const Vw=st.conn==='D'?400:231; T.vw.textContent=Vw+' V'; T.vw.style.color=r>1.3?'var(--alarm)':r<0.8?'var(--info)':'var(--ok)';
    const In=st.plate==='400/690'?11:11; const slip=Math.abs(1450-Math.abs(st.speed))/1450; const I=st.run&&!st.burnt?(In*(0.35+0.65*st.load/100)*(r>1.3?2.5:1)+5.6*In*Math.min(1,slip)*r*r):0; T.i.textContent=I.toFixed(1)+' A';
    T.sp.textContent=Math.round(Math.abs(st.speed))+' rpm'; T.s.textContent=st.burnt?(LANG==='ar'?'محروق':'Burnt'):st.run?(LANG==='ar'?'يعمل':'Running'):(LANG==='ar'?'متوقف':'Stopped'); T.s.style.color=st.burnt?'var(--alarm)':st.run?'var(--ok)':'var(--muted)'; },
  challenges:[
    {l:{ar:'موتور 400/690 على شبكة 400 فولت: اختر التوصيل الصحيح وشغّله.',en:'A 400/690 motor on a 400 V network: pick the right connection and run it.'},f:'ok690'},
    {l:{ar:'موتور 230/400 على شبكة 400 فولت: اختر التوصيل الصحيح وشغّله.',en:'A 230/400 motor on a 400 V network: pick the right connection and run it.'},f:'ok400'},
    {l:{ar:'اعكس اتجاه الدوران وشغّله صحيحًا.',en:'Reverse the direction and run it correctly.'},f:'revRun'},
    {l:{ar:'شوف إيه اللي يحصل لو وصلت موتور 230/400 دلتا على 400 فولت.',en:'See what happens if a 230/400 motor is connected delta on 400 V.'},f:'burn'},
  ],
  explain:{ar:[
    'الموتور الحثي ثلاثي الفاز فيه ثلاث ملفات، كل ملف له طرفان: U1-U2، V1-V2، W1-W2. الأطراف الستة تطلع في علبة الأطراف.',
    'نوصل الملفات ستار (Y) أو دلتا (Δ) بالكباري. في الستار كل ملف عليه جهد الشبكة مقسومًا على 1.73، وفي الدلتا كل ملف عليه جهد الشبكة كاملًا.',
    'التوصيل الصحيح هو الذي يعطي كل ملف جهده المقنن. لو أعطيته أقل يضعف العزم جدًا، ولو أعطيته أكثر تسخن الملفات وتحترق.',
    'تشغيل ستار/دلتا يستفيد من هذه الفكرة: نبدأ ستار (جهد أقل وتيار أقل) ثم نحول دلتا. لذلك يحتاج موتورًا مكتوبًا عليه 400/690 على شبكة 400 فولت.'
  ],en:[
    'A three-phase induction motor has three windings, each with two ends: U1-U2, V1-V2, W1-W2. All six ends come out in the terminal box.',
    'The windings are connected star (Y) or delta (Δ) with bridges. In star each winding sees the network voltage divided by 1.73; in delta each winding sees the full network voltage.',
    'The right connection gives each winding its rated voltage. Less weakens torque badly; more overheats and burns the windings.',
    'Star-delta starting uses this idea: start in star (lower voltage and current), then switch to delta. So it needs a motor marked 400/690 on a 400 V network.'
  ]},
  quiz:[
    {q:{ar:'موتور 400/690 V على شبكة 400 فولت. التوصيل؟',en:'A 400/690 V motor on a 400 V network. Connection?'},o:[{ar:'ستار',en:'Star'},{ar:'دلتا',en:'Delta'},{ar:'أي واحد',en:'Either'}],a:1,w:{ar:'الملف 400 فولت، والدلتا تعطيه 400.',en:'The winding is 400 V and delta gives it 400.'}},
    {q:{ar:'كيف تعكس اتجاه موتور ثلاثي الفاز؟',en:'How do you reverse a three-phase motor?'},o:[{ar:'بدّل فازتين',en:'Swap two phases'},{ar:'غيّر ستار إلى دلتا',en:'Change star to delta'},{ar:'بدّل الثلاث فازات',en:'Swap all three'}],a:0,w:{ar:'تبديل فازتين يعكس المجال.',en:'Swapping two reverses the field.'}},
    {q:{ar:'كوبري واحد أفقي يربط W2-U2-V2 معناه:',en:'One horizontal bar joining W2-U2-V2 means:'},o:[{ar:'دلتا',en:'Delta'},{ar:'ستار',en:'Star'},{ar:'قصر',en:'Short circuit'}],a:1,w:{ar:'هذه نقطة النجمة.',en:'That is the star point.'}}
  ]
};
const DEVS=[D1,D2,D3,D4];
/* ---------- D5 (unit 3): the timer ---------- */
const D5={ key:'tim', unit:3, kind:'device', name:{ar:'التايمر: تأخير التشغيل وتأخير الفصل',en:'The timer: on-delay and off-delay'},
  st:null,
  build(svg,side,below){
    const st=this.st={mode:'on',pre:5,coil:false,t:0,out:false,hist:[],acc:0,pulseT:0,pulsed:false,startedOn:false};
    const g=dvG(svg,1000,470);
    const AR=LANG==='ar';
    const lamp=(x,y,col,fn)=>{ const c=sv('circle',{cx:x,cy:y,r:11,class:'sym'},g); sv('path',{d:`M${x-8} ${y-8} L${x+8} ${y+8} M${x+8} ${y-8} L${x-8} ${y+8}`,class:'sym'},g); DU.push(()=>{const on=fn(); c.setAttribute('fill',on?col:'none'); c.style.filter=on?`drop-shadow(0 0 6px ${col})`:'';}); };
    /* --- A: the module --- */
    txt(g,170,28,AR?'شكل التايمر في اللوحة':'The timer module','dvt','middle');
    sv('rect',{x:105,y:44,width:130,height:250,rx:6,fill:'#3f474b',stroke:'#23292c','stroke-width':2},g);
    sv('rect',{x:115,y:52,width:110,height:30,rx:3,fill:'#2a3134'},g);
    [[135,'A1'],[205,'A2']].forEach(([x,l])=>{ screw(g,x,64); txt(g,x,96,l,'pvw','middle'); });
    txt(g,170,118,'KT','pvw','middle').style.fontSize='15px';
    const ledU=sv('circle',{cx:140,cy:138,r:6,fill:'#222'},g), ledR=sv('circle',{cx:200,cy:138,r:6,fill:'#222'},g);
    txt(g,140,156,'U','pvm','middle'); txt(g,200,156,'R','pvm','middle');
    sv('circle',{cx:170,cy:205,r:34,fill:'#d9dedd',stroke:'#7d8689','stroke-width':2},g);
    for(let k=0;k<=10;k++){ const a=(-135+k*27)*Math.PI/180; sv('line',{x1:170+Math.sin(a)*28,y1:205-Math.cos(a)*28,x2:170+Math.sin(a)*33,y2:205-Math.cos(a)*33,stroke:'#333','stroke-width':k%5?1:2},g); }
    txt(g,138,250,'0','pvm','middle'); txt(g,202,250,'10s','pvm','middle');
    const ptr=sv('line',{x1:170,y1:205,x2:170,y2:178,stroke:'#c0392b','stroke-width':3,'stroke-linecap':'round'},g); sv('circle',{cx:170,cy:205,r:6,fill:'#333'},g);
    const fnT=txt(g,170,268,'','pvw','middle');
    sv('rect',{x:115,y:276,width:110,height:30,rx:3,fill:'#2a3134'},g);
    [[130,'15'],[170,'16'],[210,'18']].forEach(([x,l])=>{ screw(g,x,290); txt(g,x,322,l,'dvm','middle'); });
    DU.push(()=>{ ledU.setAttribute('fill',st.coil?'#3dff8a':'#222'); ledU.style.filter=st.coil?'drop-shadow(0 0 5px #3dff8a)':'';
      const blink=st.coil&&st.mode==='on'&&!st.out&&Math.floor(S.time*4)%2; ledR.setAttribute('fill',st.out?'#ffd84d':blink?'#7a6a20':'#222'); ledR.style.filter=st.out?'drop-shadow(0 0 5px #ffd84d)':'';
      ptr.setAttribute('transform',`rotate(${-135+st.pre/10*270} 170 205)`); fnT.textContent=st.mode==='on'?'TON':'TOF'; });
    const cap=txt(g,170,350,'','dvs','middle'), cap2=txt(g,170,368,'','dvs','middle');
    /* --- B: symbols --- */
    txt(g,440,28,AR?'نفس التايمر في المخطط':'The same timer on a drawing','dvt','middle');
    const X=360;
    sv('line',{x1:X,y1:48,x2:X,y2:76,class:'w dead'},g); const cb=sv('rect',{x:X-22,y:76,width:44,height:34,class:'sym'},g);
    const mk=sv('rect',{x:X-44,y:76,width:22,height:34,class:'sym'},g); const mx=sv('path',{d:`M${X-44} 76 l22 34 M${X-22} 76 l-22 34`,class:'sym'},g);
    sv('line',{x1:X,y1:110,x2:X,y2:138,class:'w dead'},g);
    txt(g,X+28,98,'KT','tag'); txt(g,X+5,64,'A1','trm'); txt(g,X+5,130,'A2','trm');
    const symT=txt(g,X,160,'','dvs','middle');
    DU.push(()=>{ cb.setAttribute('fill',st.coil?'rgba(233,166,64,.35)':'none'); const off=st.mode==='off'; mk.setAttribute('fill',off?'#b9c7c4':'none'); mx.style.display=off?'none':'';
      symT.textContent=off?(AR?'ملف تأخير فصل':'off-delay coil'):(AR?'ملف تأخير تشغيل':'on-delay coil'); });
    const C1=470, C2=540, CY=60;
    iecContact(g,C1,CY,'no',()=>st.out,null,null,['15','18'],()=>true);
    iecContact(g,C2,CY,'nc',()=>!st.out,null,null,['15','16'],()=>true);
    // time "parachute" marks
    [C1,C2].forEach(x=>{ const p=sv('path',{d:'',class:'sym'},g); sv('line',{x1:x-7,y1:CY+32,x2:x-18,y2:CY+32,class:'sym'},g);
      DU.push(()=>p.setAttribute('d',st.mode==='on'?`M${x-18} ${CY+22} a8 8 0 0 0 0 20`:`M${x-26} ${CY+22} a8 8 0 0 1 0 20`)); });
    txt(g,C1,CY+86,'NO','dvm','middle'); txt(g,C2,CY+86,'NC','dvm','middle');
    lamp(C1,CY+116,'#3dff8a',()=>st.out); lamp(C2,CY+116,'#f4f8ff',()=>!st.out);
    txt(g,505,CY+150,AR?'كل كونتاكت شايل لمبة للتجربة':'each contact drives a test lamp','dvs','middle');
    /* --- C: timing chart --- */
    const GX=600,GW=330,GY=48,RH=56,SPAN=20;
    txt(g,GX+GW/2,28,AR?'مخطط الزمن (آخر 20 ثانية)':'Timing chart (last 20 s)','dvt','middle');
    const rows=[['A1-A2','#e9a640',h=>h.c],['15-18','#3dff8a',h=>h.o],['15-16','#cfd8dc',h=>!h.o]];
    const paths=rows.map(([l,col],i)=>{ const y0=GY+i*(RH+18);
      sv('rect',{x:GX,y:y0,width:GW,height:RH,fill:'#0f1619',stroke:'#26363e'},g);
      txt(g,GX+GW+6,y0+RH/2+4,l,'dvm');
      return sv('path',{d:'',fill:'none',stroke:col,'stroke-width':2.5},g); });
    const ty=GY+3*(RH+18)-8;
    for(let s=0;s<=SPAN;s+=5){ const x=GX+GW-s/SPAN*GW; sv('line',{x1:x,y1:GY,x2:x,y2:ty-10,stroke:'#1d2a30'},g); txt(g,x,ty+6,s?('-'+s+'s'):(AR?'الآن':'now'),'dvs','middle'); }
    const tLbl=txt(g,GX+GW/2,ty+28,'','dvm','middle');
    DU.push(()=>{ const H=st.hist, n=H.length;
      rows.forEach(([l,col,f],i)=>{ const y0=GY+i*(RH+18), hi=y0+10, lo=y0+RH-10; let d='';
        for(let k=0;k<n;k++){ const x=GX+GW-(n-1-k)*0.05/SPAN*GW; const v=f(H[k]), y=v?hi:lo, xs=x.toFixed(1); if(!k) d='M'+xs+' '+y; else { const pv=f(H[k-1]); d+=(v!==pv?' L'+xs+' '+(pv?hi:lo):'')+' L'+xs+' '+y; } }
        paths[i].setAttribute('d',d); });
      tLbl.textContent=(AR?'زمن العد: ':'Elapsed: ')+st.t.toFixed(1)+' / '+st.pre+' s'; });
    /* --- side --- */
    const c1=mkCard(side,{ar:'نوع التايمر والضبط',en:'Timer type and setting'});
    mkSeg(c1,[['on',{ar:'تأخير تشغيل',en:'On-delay'}],['off',{ar:'تأخير فصل',en:'Off-delay'}]],'on',v=>{ st.mode=v; st.t=0; st.out=v==='off'?false:false; st.coil=false; cb2.textContent=tx(onL()); FLAGS.add(v==='off'?'modeOff':'modeOn'); });
    mkSlider(c1,'d5p',{ar:'زمن الضبط',en:'Preset time'},1,10,0.5,5,v=>v.toFixed(1)+' s',v=>{ if(st.pre!==v&&this.st) FLAGS.add('preCh'); st.pre=v; });
    const c2=mkCard(side,{ar:'تغذية ملف التايمر A1-A2',en:'Feed the timer coil A1-A2'});
    const onL=()=>st.coil?{ar:'افصل الملف',en:'Switch coil OFF'}:{ar:'غذِّ الملف',en:'Switch coil ON'};
    const cb2=mkBtn(c2,onL(),()=>{ st.coil=!st.coil; cb2.textContent=tx(onL()); cb2.classList.toggle('sel',st.coil); if(st.coil){ st.pulseT=0; } });
    mkBtn(c2,{ar:'نبضة قصيرة (1 ثانية)',en:'Short pulse (1 s)'},()=>{ st.coil=true; st.pulsed=true; st.pulseT=1; cb2.textContent=tx(onL()); cb2.classList.add('sel'); });
    const p=document.createElement('p'); p.className='note'; p.style.margin='0'; p.textContent=AR?'جرّب النبضة القصيرة في النوعين وقارن.':'Try the short pulse in both types and compare.'; c2.appendChild(p);
    this.cb2=cb2; this.onL=onL;
    /* --- below --- */
    this.tl=mkTiles(below,[['c',{ar:'الملف',en:'Coil'}],['t',{ar:'زمن العد',en:'Elapsed'}],['n',{ar:'الكونتاكت 15-18',en:'Contact 15-18'}],['f',{ar:'الكونتاكت 15-16',en:'Contact 15-16'}]]);
    this.cap=[cap,cap2];
    mkInfo(below,[
      {h:{ar:'تأخير التشغيل (TON)',en:'On-delay (TON)'},b:{ar:'<p>لما الملف يتغذى، التايمر يبدأ يعد. بعد الزمن المضبوط بس، كونتاكتاته تتغير.</p><p>لو الملف فصل قبل ما الزمن يخلص، العد يرجع صفر والكونتاكتات لا تتغير خالص.</p><p>ده الأكثر استخدامًا: ستار/دلتا، تشغيل متتابع، تأخير إنذار.</p>',en:'<p>When the coil is fed, the timer starts counting. Only after the preset time do its contacts change.</p><p>If the coil drops before the time is up, the count returns to zero and the contacts never change.</p><p>The most used type: star-delta, timed sequences, alarm delays.</p>'}},
      {h:{ar:'تأخير الفصل (TOF)',en:'Off-delay (TOF)'},b:{ar:'<p>لما الملف يتغذى، الكونتاكتات تتغير في الحال.</p><p>لما الملف يفصل، التايمر يبدأ يعد، وبعد الزمن المضبوط الكونتاكتات ترجع لوضعها.</p><p>مثال: مروحة تبريد تفضل شغالة دقيقتين بعد وقوف الموتور.</p>',en:'<p>When the coil is fed, the contacts change at once.</p><p>When the coil drops, the timer starts counting, and after the preset time the contacts return.</p><p>Example: a cooling fan that keeps running two minutes after the motor stops.</p>'}},
      {h:{ar:'ترقيم أطراف التايمر',en:'Timer terminal numbers'},b:{ar:'<p><b>A1-A2</b>: الملف (التغذية).</p><p><b>15</b>: الطرف المشترك. <b>15-16</b>: مقفول وبيفتح بعد الزمن. <b>15-18</b>: مفتوح وبيقفل بعد الزمن.</p><p>بعض التايمرات تكتب الكونتاكت المفتوح <b>17-18</b> والمقفول <b>15-16</b> كونتاكتين منفصلين. الرقم 5 أو 6 أو 7 أو 8 في الآخر معناه كونتاكت زمني.</p>',en:'<p><b>A1-A2</b>: the coil (supply).</p><p><b>15</b>: common. <b>15-16</b>: closed, opens after the time. <b>15-18</b>: open, closes after the time.</p><p>Some timers show a separate NO <b>17-18</b> and NC <b>15-16</b>. A last digit of 5, 6, 7 or 8 marks a timed contact.</p>'}},
      {h:{ar:'أنواع في السوق',en:'Types you will meet'},b:{ar:'<p><b>تايمر إلكتروني متعدد الوظائف</b>: على الرّاك، فيه مفتاح لاختيار النوع (TON، TOF، نبضات...) ومدى الزمن.</p><p><b>بلوك هوائي</b>: يتركب على وش الكونتاكتور.</p><p><b>تايمر ستار/دلتا</b>: فيه كونتاكت للستار وكونتاكت للدلتا وفاصل زمني صغير (حوالي 50 ملي ثانية) بينهم.</p>',en:'<p><b>Electronic multi-function timer</b>: DIN-rail mounted, with a switch for the function (TON, TOF, pulse...) and the time range.</p><p><b>Pneumatic block</b>: clips onto the front of a contactor.</p><p><b>Star-delta timer</b>: one contact for star, one for delta and a short gap (about 50 ms) between them.</p>'}},
    ]);
  },
  tick(dt){ const st=this.st;
    if(st.pulseT>0){ st.pulseT-=dt; if(st.pulseT<=0){ st.coil=false; this.cb2.textContent=tx(this.onL()); this.cb2.classList.remove('sel'); if(st.mode==='on'&&!st.out) FLAGS.add('pulseOn'); if(st.mode==='off') st.pulseOff=true; } }
    const was=st.out;
    if(st.mode==='on'){ if(st.coil){ st.t=Math.min(st.pre,st.t+dt); if(st.t>=st.pre) st.out=true; } else { st.t=0; st.out=false; } }
    else { if(st.coil){ st.out=true; st.t=0; } else if(st.out){ st.t+=dt; if(st.t>=st.pre){ st.out=false; st.t=0; } } }
    if(!was&&st.out&&st.mode==='on') FLAGS.add('onDone');
    if(was&&!st.out&&st.mode==='off'){ FLAGS.add('offDone'); if(st.pulseOff) FLAGS.add('pulseOff'); st.pulseOff=false; }
    st.acc+=dt; while(st.acc>=0.05){ st.acc-=0.05; st.hist.push({c:st.coil,o:st.out}); if(st.hist.length>400) st.hist.shift(); }
  },
  refresh(){ DU.forEach(f=>f()); const st=this.st,T=this.tl, AR=LANG==='ar';
    T.c.textContent=st.coil?(AR?'متغذي':'ON'):(AR?'مفصول':'OFF'); T.c.style.color=st.coil?'var(--ok)':'var(--muted)';
    T.t.textContent=st.t.toFixed(1)+' / '+st.pre+' s';
    T.n.textContent=st.out?(AR?'مقفول':'Closed'):(AR?'مفتوح':'Open'); T.n.style.color=st.out?'var(--ok)':'var(--muted)';
    T.f.textContent=!st.out?(AR?'مقفول':'Closed'):(AR?'مفتوح':'Open'); T.f.style.color=!st.out?'var(--ok)':'var(--muted)';
    let a='',b='';
    if(st.mode==='on'){ if(st.coil&&!st.out){a=AR?'بيعد...':'Counting...'; b=AR?'الكونتاكتات لسه ما اتغيرتش':'contacts not changed yet';} else if(st.out){a=AR?'الزمن خلص':'Time is up'; b=AR?'15-18 قفل و 15-16 فتح':'15-18 closed, 15-16 opened';} else {a=AR?'الملف مفصول':'Coil off'; b=AR?'العد صفر':'count at zero';} }
    else { if(st.coil){a=AR?'الملف متغذي':'Coil on'; b=AR?'الكونتاكتات اتغيرت في الحال':'contacts changed at once';} else if(st.out){a=AR?'بيعد بعد الفصل...':'Counting after release...'; b=AR?'الكونتاكتات لسه ماسكة':'contacts still held';} else {a=AR?'راجع لوضعه':'At rest'; b='';} }
    this.cap[0].textContent=a; this.cap[1].textContent=b; },
  challenges:[
    {l:{ar:'في تأخير التشغيل: غذِّ الملف واستنى لحد ما الكونتاكت 15-18 يقفل.',en:'On-delay: feed the coil and wait until 15-18 closes.'},f:'onDone'},
    {l:{ar:'في تأخير التشغيل: ابعت نبضة قصيرة ولاحظ إن الكونتاكت ما اتغيرش.',en:'On-delay: send a short pulse and see the contact never changes.'},f:'pulseOn'},
    {l:{ar:'غيّر لتأخير الفصل وابعت نبضة: الكونتاكت يتغير فورًا ويرجع بعد الزمن.',en:'Switch to off-delay and send a pulse: the contact changes at once and returns after the time.'},f:'pulseOff'},
    {l:{ar:'غيّر زمن الضبط وكرر، وشوف الفرق في مخطط الزمن.',en:'Change the preset and repeat; see the difference on the chart.'},f:'preCh&onDone'},
  ],
  explain:{ar:[
    'التايمر جهاز بيأخر تغيير كونتاكتاته زمن إنت بتضبطه. ليه ملف (A1-A2) زي الكونتاكتور، لكن كونتاكتاته مش بتتغير في لحظة التغذية.',
    'تأخير التشغيل: تغذي الملف، يعد الزمن، وبعدين الكونتاكتات تتغير. تفصل الملف، ترجع في الحال.',
    'تأخير الفصل: العكس. تغذي الملف، الكونتاكتات تتغير في الحال. تفصل الملف، يعد الزمن، وبعدين ترجع.',
    'في المخطط تعرف الكونتاكت الزمني من علامة نص الدايرة (زي البراشوت) على ذراعه، ومن أرقامه 15-16 و 15-18 (أو 17-18). اتجاه علامة البراشوت بيقولك هو تأخير تشغيل ولا فصل.'
  ],en:[
    'A timer delays the change of its contacts by a time you set. It has a coil (A1-A2) like a contactor, but its contacts do not change the moment it is fed.',
    'On-delay: feed the coil, the time runs, then the contacts change. Remove the supply and they return at once.',
    'Off-delay: the opposite. Feed the coil and the contacts change at once. Remove the supply, the time runs, then they return.',
    'On a drawing a timed contact carries a half-circle "parachute" mark on its actuator and the numbers 15-16 and 15-18 (or 17-18). The direction of the mark tells you on-delay or off-delay.'
  ]},
  quiz:[
    {q:{ar:'تايمر تأخير تشغيل مضبوط 10 ثواني. الملف اتغذى 6 ثواني وفصل. ماذا يحدث للكونتاكت 15-18؟',en:'On-delay timer set to 10 s. The coil is fed for 6 s then drops. What does 15-18 do?'},o:[{ar:'يقفل بعد 4 ثواني',en:'Closes after 4 s'},{ar:'لا يتغير أبدًا',en:'Never changes'},{ar:'يقفل في الحال',en:'Closes at once'}],a:1,w:{ar:'الزمن ما خلصش، فالعد رجع صفر.',en:'The time never ran out, so the count reset.'}},
    {q:{ar:'عايز مروحة تفضل شغالة بعد وقوف الموتور. تستخدم أي نوع؟',en:'You want a fan to keep running after the motor stops. Which type?'},o:[{ar:'تأخير تشغيل',en:'On-delay'},{ar:'تأخير فصل',en:'Off-delay'},{ar:'كونتاكتور عادي',en:'A plain contactor'}],a:1,w:{ar:'تأخير الفصل يمسك الكونتاكت بعد فصل الملف.',en:'Off-delay holds the contact after the coil drops.'}},
    {q:{ar:'الكونتاكت 15-16 في التايمر:',en:'Timer contact 15-16 is:'},o:[{ar:'مقفول ويفتح بعد الزمن',en:'Closed, opens after the time'},{ar:'مفتوح ويقفل بعد الزمن',en:'Open, closes after the time'},{ar:'طرف الملف',en:'A coil terminal'}],a:0,w:{ar:'16 مقفول، 18 مفتوح، 15 المشترك.',en:'16 is NC, 18 is NO, 15 is common.'}}
  ]
};
DEVS.push(D5);
/* ---------- D6 (unit 4): limit switch and float switch ---------- */
const D6={ key:'sens', unit:4, kind:'device', name:{ar:'الليمت سويتش والعوامة',en:'The limit switch and the float switch'},
  st:null,
  build(svg,side,below){
    const st=this.st={x:0.2,auto:false,dir:1,lvl:0.4,fill:0,ls:false,fl:false,lsWire:false};
    const g=dvG(svg,1000,470), AR=LANG==='ar';
    const lamp=(x,y,col,fn)=>{ const c=sv('circle',{cx:x,cy:y,r:11,class:'sym'},g); sv('path',{d:`M${x-8} ${y-8} L${x+8} ${y+8} M${x+8} ${y-8} L${x-8} ${y+8}`,class:'sym'},g); DU.push(()=>{const on=fn(); c.setAttribute('fill',on?col:'none'); c.style.filter=on?`drop-shadow(0 0 6px ${col})`:'';}); };
    /* limit switch */
    txt(g,250,28,AR?'الليمت سويتش: العربة تدوس على البكرة':'Limit switch: the carriage presses the roller','dvt','middle');
    sv('rect',{x:40,y:200,width:400,height:10,fill:'#59666b'},g);
    const cg=sv('g',{},g); sv('rect',{x:-40,y:-44,width:80,height:40,rx:6,fill:'#e9a640',stroke:'#8a5d1a','stroke-width':2},cg); sv('path',{d:'M40 -30 l18 14 v10 h-18 z',fill:'#8a5d1a'},cg);
    [-24,24].forEach(dx=>sv('circle',{cx:dx,cy:2,r:8,fill:'#2b3134',stroke:'#cfd5d7','stroke-width':2},cg));
    const LX=400;
    sv('rect',{x:LX,y:130,width:34,height:60,rx:4,fill:'#c9a227',stroke:'#7a6212','stroke-width':2},g); txt(g,LX+17,170,'S7','pvw','middle');
    const lv=sv('line',{x1:LX+17,y1:150,x2:LX-8,y2:150,stroke:'#cfd5d7','stroke-width':4},g), rl=sv('circle',{cx:LX-8,cy:150,r:8,fill:'#2b3134',stroke:'#cfd5d7','stroke-width':2},g);
    iecContact(g,120,250,'no',()=>st.ls,null,null,['13','14'],()=>true); iecContact(g,220,250,'nc',()=>!st.ls&&!st.lsWire,null,null,['21','22'],()=>true);
    [120,220].forEach(x=>sv('path',{d:`M${x-7} 282 H${x-18} l-8 -7 v14 z`,class:'sym'},g));
    txt(g,120,336,'NO','dvm','middle'); txt(g,220,336,'NC','dvm','middle');
    lamp(120,362,'#3dff8a',()=>st.ls); lamp(220,362,'#f4f8ff',()=>!st.ls&&!st.lsWire);
    const lt=txt(g,330,300,'','dvs','middle'), lt2=txt(g,330,318,'','dvs','middle');
    DU.push(()=>{ const px=60+st.x*360; cg.setAttribute('transform',`translate(${px},196)`); const a=st.ls?-35:0, r=a*Math.PI/180; const ex=LX+17-Math.cos(r)*25, ey=150+Math.sin(r)*25;
      lv.setAttribute('x2',ex); lv.setAttribute('y2',ey); rl.setAttribute('cx',ex); rl.setAttribute('cy',ey); rl.setAttribute('stroke',st.ls?'#ffd84d':'#cfd5d7');
      lt.textContent=st.ls?(AR?'البكرة متداس عليها':'Roller pressed'):(AR?'البكرة حرة':'Roller free'); lt2.textContent=st.lsWire?(AR?'السلك مقطوع: المقفول بقى مفتوح':'Wire broken: the NC reads open'):''; lt2.style.fill='#ff5d50'; });
    /* float */
    txt(g,760,28,AR?'العوامة: بتتقلب مع مستوى المية':'Float switch: tilts with the water level','dvt','middle');
    const TX=620,TY=60,TW=200,TH=260;
    sv('rect',{x:TX,y:TY,width:TW,height:TH,rx:6,fill:'#1d2a30',stroke:'#8d9093','stroke-width':3},g);
    const w=sv('rect',{x:TX+3,y:TY,width:TW-6,height:0,fill:'#2f7fc1',opacity:.85},g);
    const hy=TY+TH-0.8*TH, ly=TY+TH-0.3*TH;
    [[hy,AR?'تقلب فوق 80%':'tilts up 80%'],[ly,AR?'ترجع تحت 30%':'drops 30%']].forEach(([y,l])=>{ sv('line',{x1:TX,y1:y,x2:TX+TW,y2:y,stroke:'#ffd84d','stroke-dasharray':'5 5'},g); txt(g,TX+TW+8,y+4,l,'dvs'); });
    const AX=TX+60, AY=TY+110; sv('circle',{cx:AX,cy:AY,r:3,fill:'#cfd5d7'},g); sv('line',{x1:AX,y1:TY,x2:AX,y2:AY,stroke:'#cfd5d7','stroke-width':2},g);
    const cab=sv('line',{x1:AX,y1:AY,x2:AX,y2:AY+60,stroke:'#cfd5d7','stroke-width':2},g), fb=sv('ellipse',{cx:AX,cy:AY+72,rx:9,ry:15,fill:'#f2c200',stroke:'#8a6d00','stroke-width':2},g);
    txt(g,AX-14,TY+20,'B1','pvw','end');
    iecContact(g,880,90,'no',()=>st.fl,null,null,['13','14'],()=>true); iecContact(g,950,90,'nc',()=>!st.fl,null,null,['21','22'],()=>true);
    [880,950].forEach(x=>{ sv('path',{d:`M${x-7} 122 H${x-18}`,class:'sym dash'},g); sv('circle',{cx:x-24,cy:122,r:6,class:'sym'},g); });
    txt(g,880,176,'NO','dvm','middle'); txt(g,950,176,'NC','dvm','middle');
    lamp(880,204,'#3dff8a',()=>st.fl); lamp(950,204,'#f4f8ff',()=>!st.fl);
    const ft=txt(g,TX+TW/2,TY+TH+22,'','dvm','middle');
    DU.push(()=>{ const h=Math.round(st.lvl*(TH-6)); w.setAttribute('y',TY+TH-3-h); w.setAttribute('height',h);
      const a=st.fl?-100:0; cab.setAttribute('transform',`rotate(${a} ${AX} ${AY})`); fb.setAttribute('transform',`rotate(${a} ${AX} ${AY})`);
      ft.textContent=(AR?'المستوى ':'Level ')+Math.round(st.lvl*100)+' %'; });
    /* side */
    const c1=mkCard(side,{ar:'الليمت سويتش',en:'Limit switch'});
    this.xs=mkSlider(c1,'d6x',{ar:'مكان العربة',en:'Carriage position'},0,1,0.01,st.x,v=>Math.round(v*100)+' %',v=>{st.x=v;});
    const b1=mkBtn(c1,{ar:'خلي العربة تمشي لوحدها',en:'Let the carriage move by itself'},()=>{ st.auto=!st.auto; b1.classList.toggle('sel',st.auto); });
    const b2=mkBtn(c1,{ar:'اقطع سلك الليمت',en:'Break the limit switch wire'},()=>{ st.lsWire=!st.lsWire; b2.classList.toggle('sel',st.lsWire); if(st.lsWire) FLAGS.add('wire'); });
    const c2=mkCard(side,{ar:'العوامة',en:'Float switch'});
    this.ls_=mkSlider(c2,'d6l',{ar:'مستوى المية',en:'Water level'},0,1,0.01,st.lvl,v=>Math.round(v*100)+' %',v=>{st.lvl=v;});
    mkSeg(c2,[[-1,{ar:'تفريغ',en:'Drain'}],[0,{ar:'ثابت',en:'Hold'}],[1,{ar:'ملء',en:'Fill'}]],0,v=>{st.fill=v;});
    /* below */
    this.tl=mkTiles(below,[['a',{ar:'الليمت 13-14',en:'Limit 13-14'}],['b',{ar:'الليمت 21-22',en:'Limit 21-22'}],['c',{ar:'العوامة 13-14',en:'Float 13-14'}],['d',{ar:'العوامة 21-22',en:'Float 21-22'}]]);
    mkInfo(below,[
      {h:{ar:'الليمت سويتش',en:'The limit switch'},b:{ar:'<p>مفتاح بيتداس عليه بحاجة ماشية: عربة، باب، ذراع. فيه أنواع بالبكرة والذراع، وبالضاغط المباشر.</p><p>جواه كونتاكت مفتوح 13-14 ومقفول 21-22 زي الزرار بالظبط، بس اللي بيدوس عليه الماكينة مش إيدك.</p>',en:'<p>A switch pressed by something moving: a carriage, door or arm. Types include roller lever and direct plunger.</p><p>Inside are an NO 13-14 and an NC 21-22, just like a push button, except the machine presses it instead of your hand.</p>'}},
      {h:{ar:'ليه الإيقاف بالمقفول؟',en:'Why stop with the NC?'},b:{ar:'<p>لو سلك الليمت اتقطع، المقفول يبان كأنه اتفتح فالحركة تقف. يعني العطل بيخلي الماكينة تقف بدل ما تكمّل وتخبط.</p><p>جرّب زرار "اقطع سلك الليمت" وشوف.</p>',en:'<p>If the limit wire breaks, the NC reads as open and the travel stops. A fault makes the machine stop instead of carrying on into a crash.</p><p>Try the "break the wire" button.</p>'}},
      {h:{ar:'العوامة',en:'The float switch'},b:{ar:'<p>عوامة الكابل بتتعلق من سلكها وتتقلب لما المية تعلى، فالكونتاكت جواها يتغير.</p><p>بتتقلب فوق عند مستوى وترجع تحت عند مستوى أوطى. الفرق ده بيمنع الطلمبة تفصل وتشتغل كل شوية.</p>',en:'<p>A cable float hangs from its cable and tilts as the water rises, changing its contact.</p><p>It tilts up at one level and drops back at a lower one. That gap stops the pump from cycling constantly.</p>'}},
      {h:{ar:'ملء ولا تفريغ؟',en:'Fill or drain?'},b:{ar:'<p><b>ملء خزان</b>: الطلمبة تشتغل لما المية ناقصة، فنستخدم المقفول (21-22).</p><p><b>تفريغ بيارة</b>: الطلمبة تشتغل لما المية عالية، فنستخدم المفتوح (13-14).</p>',en:'<p><b>Filling a tank</b>: the pump runs while the level is low, so use the NC (21-22).</p><p><b>Emptying a sump</b>: the pump runs while the level is high, so use the NO (13-14).</p>'}},
    ]);
  },
  tick(dt){ const st=this.st;
    if(st.auto){ st.x+=st.dir*0.25*dt; if(st.x>=1){st.x=1;st.dir=-1;} if(st.x<=0){st.x=0;st.dir=1;} this.xs.value=st.x; const v=document.getElementById('d6x_v'); if(v) v.textContent=Math.round(st.x*100)+' %'; }
    if(st.fill){ st.lvl=Math.max(0,Math.min(1,st.lvl+st.fill*0.06*dt)); this.ls_.value=st.lvl; const v=document.getElementById('d6l_v'); if(v) v.textContent=Math.round(st.lvl*100)+' %'; }
    const was=st.ls; st.ls=st.x>=0.9; if(!was&&st.ls) FLAGS.add('lsHit');
    const wf=st.fl; if(st.lvl>=0.8) st.fl=true; if(st.lvl<=0.3) st.fl=false; if(!wf&&st.fl) FLAGS.add('flUp'); if(wf&&!st.fl) FLAGS.add('flDown');
    if(st.fl&&st.lvl<0.75&&st.lvl>0.35) FLAGS.add('hyst');
  },
  refresh(){ DU.forEach(f=>f()); const st=this.st,T=this.tl,AR=LANG==='ar'; const s=(c)=>c?(AR?'مقفول':'Closed'):(AR?'مفتوح':'Open');
    const set=(e,c)=>{e.textContent=s(c); e.style.color=c?'var(--ok)':'var(--muted)';};
    set(T.a,st.ls); set(T.b,!st.ls&&!st.lsWire); set(T.c,st.fl); set(T.d,!st.fl); },
  challenges:[
    {l:{ar:'حرّك العربة لحد ما تدوس على الليمت، ولاحظ الكونتاكتين اتغيروا.',en:'Move the carriage onto the limit switch and see both contacts change.'},f:'lsHit'},
    {l:{ar:'اقطع سلك الليمت وشوف المقفول بقى زي ما يكون متداس.',en:'Break the limit wire and see the NC act as if pressed.'},f:'wire'},
    {l:{ar:'املى الخزان لحد ما العوامة تتقلب، وبعدين فرّغه لحد ما ترجع.',en:'Fill the tank until the float tilts, then drain until it drops.'},f:'flUp&flDown'},
    {l:{ar:'لاحظ إن العوامة بتفضل مقلوبة وإنت بتفرّغ لحد 30% بس.',en:'Notice the float stays up while draining until 30%.'},f:'hyst'},
  ],
  explain:{ar:[
    'الليمت سويتش والعوامة الاتنين مفاتيح عادية فيها كونتاكت مفتوح ومقفول، بس اللي بيحركهم الماكينة نفسها: العربة بتدوس على الليمت، والمية بتقلب العوامة.',
    'بالحاجات دي الدايرة تقدر تشتغل لوحدها: العربة ترجع لما توصل الآخر، والطلمبة تقف لما الخزان يتملي.',
    'قاعدة الأمان: الكونتاكت اللي بيوقف حاجة خطر بيكون مقفول، عشان لو السلك اتقطع الحاجة تقف.'
  ],en:[
    'The limit switch and the float switch are ordinary switches with an NO and an NC, but the machine moves them: the carriage presses the limit switch and the water tilts the float.',
    'With them a circuit can run by itself: the carriage returns at the end, and the pump stops when the tank is full.',
    'Safety rule: a contact that stops something dangerous is an NC, so a broken wire stops it.'
  ]},
  quiz:[
    {q:{ar:'عايز طلمبة تفرّغ بيارة لما المية تعلى. تستخدم أي كونتاكت في العوامة؟',en:'A pump must empty a sump when the water rises. Which float contact?'},o:[{ar:'المفتوح 13-14',en:'NO 13-14'},{ar:'المقفول 21-22',en:'NC 21-22'}],a:0,w:{ar:'المفتوح يقفل لما العوامة تتقلب فوق.',en:'The NO closes when the float tilts up.'}},
    {q:{ar:'سلك ليمت الإيقاف اتقطع. لو متوصل صح (مقفول)، العربة:',en:'The stop limit wire breaks. Wired correctly (NC), the carriage:'},o:[{ar:'تقف',en:'Stops'},{ar:'تكمّل وتخبط',en:'Carries on and crashes'}],a:0,w:{ar:'المقفول المقطوع زي المفتوح.',en:'A broken NC is the same as open.'}}
  ]
};
DEVS.push(D6);

/* ================= interaction ================= */
let latchMode=false, CUR=null, DEV=null;
function bindPress(el,id,kind){
  const tog=kind==='estop'||latchMode;
  el.addEventListener('pointerdown',ev=>{ev.preventDefault(); if(kind==='estop'||latchMode){setBtn(id,!(S.btn[id]===1));return;} el.setPointerCapture&&el.setPointerCapture(ev.pointerId); setBtn(id,true);});
  const up=()=>{ if(!latchMode&&kind!=='estop') setBtn(id,false); };
  el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up); el.addEventListener('lostpointercapture',up);
  el.addEventListener('keydown',ev=>{ if((ev.key===' '||ev.key==='Enter')&&!ev.repeat){ev.preventDefault(); if(latchMode||kind==='estop') setBtn(id,!(S.btn[id]===1)); else setBtn(id,true);} });
  el.addEventListener('keyup',ev=>{ if((ev.key===' '||ev.key==='Enter')&&!latchMode&&kind!=='estop'){ev.preventDefault(); setBtn(id,false);} });
}
function buildStation(){
  const L=$('#lamps'); L.innerHTML='';
  C.lamps.forEach(l=>{const d=document.createElement('div');d.className='lamp '+l.color;d.id='lp_'+l.id;d.innerHTML=`<i></i><span>${l.id} ${tx(l.l)}</span>`;L.appendChild(d)});
  const B=$('#btns'); B.innerHTML='';
  C.buttons.forEach(b=>{const w=document.createElement('div');w.className='pbw';
    const bt=document.createElement('button');bt.type='button';bt.className='pb '+b.color;bt.textContent=b.face;bt.id='pb_'+b.btn;bt.setAttribute('aria-label',b.btn+' '+tx(b.l));
    if(b.kind==='estop'){bt.style.boxShadow='0 0 0 6px #f2c200,0 5px 0 #0c1114';}
    if(b.face.length>2) bt.style.fontSize='12px';
    w.appendChild(bt); const s=document.createElement('span'); s.textContent=tx(b.l); w.appendChild(s); const sm=document.createElement('small'); sm.textContent=b.btn; w.appendChild(sm);
    B.appendChild(w); bindPress(bt,b.btn,b.kind);});
  const SW=$('#selWrap'); SW.hidden=!C.selector; SW.innerHTML='';
  if(C.selector){ SW.innerHTML=`<span>S5</span>`; [['H',{ar:'يدوي',en:'Hand'}],['0',{ar:'إيقاف',en:'Off'}],['A',{ar:'أوتو',en:'Auto'}]].forEach(([v,l])=>{const b=document.createElement('button');b.type='button';b.textContent=tx(l);b.dataset.v=v;b.addEventListener('click',()=>setSel(v));SW.appendChild(b);}); }
}
function setSel(v){ S.sel=v; addLog('S5 → '+v); solve(); refreshAll(); }
function syncButtons(){ C.buttons.forEach(b=>{const e=$('#pb_'+b.btn); if(e) e.classList.toggle('down',S.btn[b.btn]===1);}); [...$('#selWrap').children].forEach(b=>b.dataset&&b.classList.toggle('sel',b.dataset.v===S.sel)); }
function toggleQ1(){ if(S.q1trip){S.q1trip=false;} S.q1=!S.q1; addLog(S.q1?t('ev_q1on'):t('ev_q1off')); solve(); refreshAll(); }
function toggleMains(){
  S.mains=!S.mains; S.ctrl=S.mains;
  if(!S.mains){ addLog(t('ev_mOff'),true); wasRunningBeforeLoss=Object.values(S.k).some(Boolean); }
  else { addLog(t('ev_mOn')); if(wasRunningBeforeLoss) lossT=S.time; }
  solve(); refreshAll();
}
function resetOL(ol){ const o=S.ol[ol]; if(!o.trip) return; if(o.heat>0.7){ $('#resetNote').textContent=t('cooling'); return; } o.trip=false; addLog(ol+': '+t('ev_reset')); solve(); refreshAll(); }
function probeClick(p){
  if(PROBE.b==null) PROBE.b=p; else if(PROBE.r==null&&p!==PROBE.b) PROBE.r=p; else {PROBE.b=p;PROBE.r=null;}
  refreshProbes();
}
function refreshProbes(){ PTS.forEach(p=>{ if(!p.g) return; p.g.classList.toggle('pb',PROBE.b===p); p.g.classList.toggle('pr',PROBE.r===p); }); $('#pB').textContent=PROBE.b?('TP'+PROBE.b.n):'—'; $('#pR').textContent=PROBE.r?('TP'+PROBE.r.n):'—'; }
const vOf=p=>p.isN?0:(p.live?230:0);

/* faults */
function buildFaults(){
  const F=$('#flist'); F.innerHTML='';
  C.faults.forEach(f=>{const b=document.createElement('button');b.type='button';b.textContent=tx(f.l);
    const ids=f.ids||[f.id];
    const isOn=()=>f.power?!!S.pfault[f.id]:ids.every(i=>S.fault[i]===f.kind);
    b.addEventListener('click',()=>{
      if(f.power){ S.pfault[f.id]=!S.pfault[f.id]; }
      else { const on=isOn(); ids.forEach(i=>{ if(on) delete S.fault[i]; else S.fault[i]=f.kind; }); }
      if(isOn()) addLog(t('ev_fault')+tx(f.l),true);
      solve(); refreshFaults(); refreshAll();
    });
    b._on=isOn; F.appendChild(b);});
  refreshFaults();
}
function refreshFaults(){ [...$('#flist').children].forEach(b=>b.classList.toggle('on',b._on())); }
function buildSuspects(){
  const s=$('#suspect'); s.innerHTML=`<option value="">${t('pick')}</option>`;
  const seen=new Set();
  ELS.forEach(e=>{ if(!C.trace.includes(e.id)||seen.has(e.id)) return; seen.add(e.id);
    const o=document.createElement('option'); o.value=e.id; o.textContent=`${e.tag} ${e.t?e.t.join('-'):''} · ${descOf(e)}`; s.appendChild(o); });
}
function newTrace(){
  S.fault={}; S.pfault={};
  const opts=C.faults.filter(f=>!f.power&&!f.ids&&C.trace.includes(f.id)&&f.kind!=='stuck');
  const pool=opts.length?opts:C.trace.map(id=>({id,kind:'open',l:{ar:id+' مفتوح',en:id+' open'}}));
  const extra=C.trace.filter(id=>!pool.some(f=>f.id===id)&&!/c$/.test(id)).map(id=>{const e=ELS.find(x=>x.id===id); return {id,kind:'open',l:{ar:'سلك مفكوك عند '+(e?e.tag+' '+(e.t||[]).join('-'):id),en:'Loose wire at '+(e?e.tag+' '+(e.t||[]).join('-'):id)}};});
  const all=pool.concat(extra);
  let f; do{ f=all[Math.floor(Math.random()*all.length)]; }while(all.length>1&&TRACE&&f.id===TRACE.f.id);
  TRACE={f,done:false}; S.fault[f.id]=f.kind;
  $('#traceMsg').innerHTML=''; $('#suspect').value='';
  resetRun(); solve(); refreshAll();
}
function setMode(m){
  MODE=m; $('#mFree').classList.toggle('sel',m==='free'); $('#mTrace').classList.toggle('sel',m==='trace');
  $('#faultCard').hidden=m!=='free'; $('#traceCard').hidden=m!=='trace';
  if(m==='trace'){ buildSuspects(); newTrace(); } else { S.fault={}; S.pfault={}; TRACE=null; refreshFaults(); solve(); }
  updScore(); refreshAll();
}
function updScore(){ $('#score').textContent=`${SCORE.ok} / ${SCORE.n}`; }

/* ================= log, tiles, tables ================= */
function addLog(s,al){ const m=Math.floor(S.time/60), sec=Math.floor(S.time%60); LOG.unshift({tm:`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`,s,al}); if(LOG.length>40) LOG.pop(); renderLog(); }
function renderLog(){ const L=$('#log'); if(L) L.innerHTML=LOG.map(l=>`<li class="${l.al?'al':''}"><span class="mono">${l.tm}</span><span>${l.s}</span></li>`).join(''); }
const pill=(c,s)=>`<span class="pill ${c}">${s}</span>`;
const stCls=st=>st==='run'?'ok':st==='start'?'wa':['trip','hum','jam'].includes(st)?'al':'off';
function renderDevices(){
  const rows=[]; const seen=new Set();
  rows.push(['Q1',tx({ar:'قاطع موتور رئيسي 3 فاز',en:'3-phase main motor breaker'}),S.q1?pill('ok',t('closed')):pill(S.q1trip?'al':'off',S.q1trip?t('tripped'):t('open'))]);
  ELS.forEach(e=>{ const key=(e.type==='coil'||e.type==='tcoil')?e.ref+'c':e.id; if(seen.has(key)) return; seen.add(key);
    let st; const flt=MODE==='free'&&S.fault[e.id];
    if(e.type==='coil') st=flt==='burnt'?pill('al',t('burnt')):(S.k[e.ref]?pill('wa',t('energized')):pill('off',t('deenerg')));
    else if(e.type==='tcoil'){ const tm=S.tim[e.ref]; st=tm.done?pill('wa',t('energized')+' ✓'):tm.on?pill('in',tm.t.toFixed(1)+' s'):pill('off',t('deenerg')); }
    else if(e.type==='lamp') st=S.lamps[e.id]?pill('ok',t('lit')):pill('off',t('unlit'));
    else if(e.type==='fuse') st=flt?pill('al',t('faulty')):pill('ok',t('ok'));
    else st=(flt?pill('al',t('faulty'))+' ':'')+(e.closed?pill('wa',t('closed')):pill('off',t('open')));
    rows.push([e.tag+(e.t?' '+e.t.join('-'):''),descOf(e),st]);
  });
  TPL.motors.forEach(m=>rows.push([m,tx({ar:'موتور حثي 5.5 ك.وات',en:'Induction motor 5.5 kW'}),pill(stCls(S.mot[m].state),t('st_'+S.mot[m].state))]));
  $('#devs').innerHTML=rows.map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('');
}
function renderSteps(){ $('#steps').innerHTML=(C.steps||[]).map((s,i)=>`<li id="st${i}">${tx(s.l)}</li>`).join(''); }
function renderChal(L){ $('#chal').innerHTML=(L.challenges||[]).map((c,i)=>`<li id="ch${i}"><i></i><span>${tx(c.l)}</span></li>`).join(''); }
function chalDone(f){ return f.split('&').every(x=>FLAGS.has(x)); }
function renderExplain(L){ $('#explain').innerHTML=tx(L.explain).map(p=>`<p>${p}</p>`).join(''); }
function renderQuiz(L){
  const Q=$('#quiz'); Q.innerHTML='';
  (L.quiz||[]).forEach((q,qi)=>{const d=document.createElement('div');d.className='q';
    d.innerHTML=`<div class="qq">${qi+1}. ${tx(q.q)}</div><div class="opts"></div><div class="why" hidden></div>`;
    const O=d.querySelector('.opts');
    q.o.forEach((o,oi)=>{const b=document.createElement('button');b.type='button';b.textContent=tx(o);
      b.addEventListener('click',()=>{ [...O.children].forEach(x=>x.classList.remove('right','wrong')); b.classList.add(oi===q.a?'right':'wrong'); const w=d.querySelector('.why'); w.hidden=false; w.textContent=(oi===q.a?t('right'):'')+tx(q.w); if(oi===q.a) FLAGS.add('quiz'+qi); });
      O.appendChild(b);});
    Q.appendChild(d);});
}
function curLabel(){ const i=LESSONS.indexOf(CUR); return (CUR.kind==='device'?t('lessonW'):t('circuitW'))+' '+CUR.num; }
function renderNav(){
  const N=$('#units'); N.innerHTML='';
  UNITS.forEach(u=>{
    const d=document.createElement('div'); d.className='unit';
    d.innerHTML=`<h3><b>${u.n}</b>${u[LANG]}</h3><div class="chips"></div>`;
    const ch=d.querySelector('.chips');
    LESSONS.filter(l=>l.unit===u.n).forEach(l=>{ const b=document.createElement('button'); b.type='button'; b.className='chip'+(l.kind==='device'?' dev':'')+(l===CUR?' sel':'');
      b.innerHTML=`<b>${l.kind==='device'?'i':l.num}</b><span>${tx(l.name)}</span>`; b.addEventListener('click',()=>go(l.key)); ch.appendChild(b); });
    PLANNED.filter(p=>p.unit===u.n).forEach(p=>{ const b=document.createElement('button'); b.type='button'; b.className='chip'+(p.dev?' dev':''); b.disabled=true;
      b.innerHTML=`<b>${p.dev?'i':'·'}</b><span>${p[LANG]}<br><small>${t('soon')}</small></span>`; ch.appendChild(b); });
    N.appendChild(d);
  });
  const i=LESSONS.indexOf(CUR), pg=$('#pager'); pg.innerHTML='';
  const mk=(l,k)=>{const b=document.createElement('button');b.type='button';b.textContent=t(k)+'  '+tx(l.name);b.addEventListener('click',()=>{go(l.key);window.scrollTo({top:0,behavior:'smooth'});});return b;};
  pg.appendChild(i>0?mk(LESSONS[i-1],'prev'):document.createElement('span'));
  if(i<LESSONS.length-1) pg.appendChild(mk(LESSONS[i+1],'next'));
}
function refreshAll(){
  if(!CUR||CUR.kind!=='circuit') return;
  UPD.control.forEach(f=>f()); UPD.power.forEach(f=>f()); if(VIEW.pan) UPD.panel.forEach(f=>f());
  C.lamps.forEach(l=>{const e=$('#lp_'+l.id); if(e) e.classList.toggle('on',!!S.lamps[l.id]);});
  $('#bMains').textContent=S.mains?t('on'):t('off'); $('#bMains').classList.toggle('on',!S.mains);
  $('#bQ1').textContent=S.q1?t('on'):(S.q1trip?t('tripped'):t('off')); $('#bQ1').classList.toggle('on',!S.q1);
  const ms=TPL.motors.map(m=>S.mot[m]);
  const worst=ms.find(m=>['trip','hum','jam'].includes(m.state))||ms.find(m=>m.state==='start')||ms.find(m=>m.state==='run')||ms[0];
  const sp=$('#cState'); sp.textContent=TPL.motors.map(m=>m+': '+t('st_'+S.mot[m].state)).join('  ·  '); sp.className='pill '+stCls(worst.state);
  const multi=TPL.motors.length>1;
  $('#tMotor').textContent=multi?TPL.motors.map(m=>m+' '+t('st_'+S.mot[m].state)).join(' · '):t('st_'+worst.state);
  $('#tMotor').style.color=multi?'var(--ink)':(worst.state==='run'?'var(--ok)':['trip','hum','jam'].includes(worst.state)?'var(--alarm)':worst.state==='start'?'var(--warn)':'var(--ink)');
  $('#tMotor').style.fontSize=multi?'13px':'';
  $('#tSpeed').innerHTML=ms.map(m=>Math.round(Math.abs(m.speed))).join(' / ')+`<small>${t('rpm')}</small>`;
  $('#tCur').innerHTML=ms.map(m=>m.cur.toFixed(1)).join(' / ')+'<small>A</small>'; $('#tCur').style.color=ms.some(m=>m.cur>S.ir*1.05)?'var(--warn)':'var(--ink)';
  const ols=Object.keys(TPL.ols); const hmax=Math.max(...ols.map(o=>S.ol[o].heat)); const anyTrip=ols.some(o=>S.ol[o].trip);
  const hp=Math.round(Math.min(1,hmax)*100);
  $('#tHeat').innerHTML=ols.map(o=>Math.round(Math.min(1,S.ol[o].heat)*100)).join(' / ')+'<small>%</small>'; $('#tHeat').style.color=anyTrip?'var(--alarm)':'var(--ink)';
  $('#tCtrl').textContent=S.ctrl?'230 V':t('absent'); $('#tCtrl').style.color=S.ctrl?'var(--ok)':'var(--alarm)';
  $('#vHeat').textContent=hp+'%'; $('#heatBar').style.width=hp+'%'; $('#heatBar').style.background=anyTrip?'var(--alarm)':hp>60?'var(--warn)':'var(--ok)';
  [...$('#resetBtns').children].forEach(b=>b.disabled=!S.ol[b.dataset.ol].trip);
  if(!anyTrip) $('#resetNote').textContent=''; else if(ols.some(o=>S.ol[o].trip&&S.ol[o].heat>0.7)) $('#resetNote').textContent=t('cooling'); else $('#resetNote').textContent='';
  if(C.tile){ const tl=C.tile(); $('#tProcK').textContent=tx(tl.k); $('#tProc').textContent=tl.v; }
  for(const r in S.tim){ const e=$('#tmv_'+r); if(e) e.textContent=(S.tim[r].on?S.tim[r].t.toFixed(1)+' / ':'')+S.tim[r].pre+' s'; }
  if(PROBE.b&&PROBE.r){ const v=Math.abs(vOf(PROBE.b)-vOf(PROBE.r)); const n=v>0?(v-0.6+Math.sin(S.time*3)*0.3):Math.abs(Math.sin(S.time*2))*0.2; $('#lcd').innerHTML=`${n.toFixed(1)} <small>V~</small>`; }
  else $('#lcd').innerHTML='-- <small>V~</small>';
  (C.steps||[]).forEach((s,i)=>{const e=$('#st'+i); if(e) e.classList.toggle('act',!!s.on(S));});
  refreshChal(C);
  if(++refreshTick%6===0) renderDevices();
  if(C.procRefresh) C.procRefresh();
}
function refreshChal(L){ (L.challenges||[]).forEach((c,i)=>{const e=$('#ch'+i); if(e){const d=chalDone(c.f); e.classList.toggle('done',d); e.querySelector('i').textContent=d?'✓':'';}}); }
let refreshTick=0;
function resetRun(){
  S.btn={}; S.k={}; S.lamps={}; S.q1=true; S.q1trip=false;
  S.ol={}; for(const o in TPL.ols) S.ol[o]={heat:0,trip:false};
  S.mot={}; TPL.motors.forEach(m=>S.mot[m]={speed:0,cur:0,ang:0,state:'stop',endJam:false});
  const pres={}; for(const r in S.tim) pres[r]=S.tim[r].pre; S.tim={};
  if(C) collectEls(C.tree).filter(e=>e.type==='tcoil').forEach(e=>S.tim[e.ref]={t:0,done:false,on:false,off:!!e.off,pre:pres[e.ref]||e.pre||5});
  if(C&&C.reset) C.reset();
  if(C) syncButtons();
}
function collectEls(n,out=[]){ if(n.type) out.push(n); else (n.series||n.par||n.split).forEach(c=>collectEls(c,out)); return out; }
function buildSideExtras(){
  const tmr=collectEls(C.tree).filter(e=>e.type==='tcoil');
  $('#timerCard').hidden=!tmr.length; const TL=$('#timerList'); TL.innerHTML='';
  tmr.forEach(e=>{ const d=document.createElement('div'); d.className='ctl';
    d.innerHTML=`<label for="tm_${e.ref}"><span>${e.ref}</span><span class="mono" id="tmv_${e.ref}"></span></label><input type="range" id="tm_${e.ref}" min="1" max="15" step="0.5" value="${S.tim[e.ref].pre}">`;
    d.querySelector('input').addEventListener('input',ev=>{ S.tim[e.ref].pre=+ev.target.value; });
    TL.appendChild(d); });
  const RB=$('#resetBtns'); RB.innerHTML='';
  Object.keys(TPL.ols).forEach(o=>{const b=document.createElement('button');b.type='button';b.dataset.ol=o;b.textContent=t('olResetX')+o;b.addEventListener('click',()=>resetOL(o));RB.appendChild(b);});
  $('#irNote').textContent=C.irNote?tx(C.irNote):t('irNoteStd');
  const pc=$('#procCard'); pc.hidden=!C.procUI; pc.innerHTML=''; if(C.procUI) C.procUI(pc);
  $('#tProcW').hidden=!C.tile;
}
const VIEW={dia:true,pan:true};
try{ const v=JSON.parse(localStorage.getItem('cc_view')||'null'); if(v&&(v.dia||v.pan)) Object.assign(VIEW,v); }catch(e){}
function applyView(){ $('#diaWrap').hidden=!VIEW.dia; $('#pnFig').hidden=!VIEW.pan; $('#vDia').classList.toggle('sel',VIEW.dia); $('#vPan').classList.toggle('sel',VIEW.pan); try{localStorage.setItem('cc_view',JSON.stringify(VIEW))}catch(e){} }

function loadLesson(key){
  CUR=LESSONS.find(l=>l.key===key)||LESSONS[0];
  try{localStorage.setItem('cc_lesson',CUR.key)}catch(e){}
  FLAGS.clear(); HM={}; LOG.length=0; renderLog();
  $('#cTitle').textContent=`${curLabel()}: ${tx(CUR.name)}`;
  const isC=CUR.kind==='circuit';
  $('#cScene').hidden=!isC; $('#dScene').hidden=isC; $('#sideC').hidden=!isC; $('#sideD').hidden=isC; $('#belowC').hidden=!isC; $('#belowD').hidden=isC;
  $('#viewTg').hidden=!isC; $('#cState').hidden=!isC;
  if(isC){
    DEV=null; C=CUR; TPL=TPLS[C.tpl]; S.ir=C.ir||11; $('#rIr').value=S.ir; $('#vIr').textContent=S.ir.toFixed(1)+' A';
    S.tim={}; resetRun(); S.fault={}; S.pfault={}; S.sel=C.sel0||'0'; PROBE={b:null,r:null}; trippedOnce=false; lossT=-1; S.mains=true; S.ctrl=true;
    buildControl(); PW=TPL.state(); const pg=$('#pw'); pg.innerHTML=''; pg.setAttribute('viewBox',`0 0 ${TPL.w} ${TPL.h}`); UPD.power=[]; TPL.draw(sv('g',{},pg));
    buildPanel(); buildStation(); buildFaults(); buildSideExtras(); renderSteps();
    if(MODE==='trace'){ buildSuspects(); newTrace(); }
    solve(); refreshProbes(); applyView(); refreshAll(); renderDevices(); updScore();
  }else{
    C=null; DEV=CUR; ROOT=null;
    const svg=$('#dv'); svg.innerHTML=''; $('#sideD').innerHTML=''; $('#belowD').innerHTML='';
    DEV.build(svg,$('#sideD'),$('#belowD'));
  }
  renderChal(CUR); renderExplain(CUR); renderQuiz(CUR); renderNav();
  if(window.CC_PAGES) document.title=tx(CUR.name)+' | '+t('title')+' | LearnElectricals';
}
function applyLang(){
  document.documentElement.lang=LANG; document.documentElement.dir=LANG==='ar'?'rtl':'ltr';
  document.querySelectorAll('[data-t]').forEach(e=>e.textContent=t(e.dataset.t));
  $('#langBtn').textContent=LANG==='ar'?'English':'عربي';
  document.title=t('title');
}

/* ================= wiring up ================= */
$('#langBtn').addEventListener('click',()=>{ if(window.CC_PAGES){ const f=location.pathname.split('/').pop()||'index.html'; location.href=(LANG==='ar'?'/en/classic-control-lab/':'/classic-control-lab/')+f; return; } LANG=LANG==='ar'?'en':'ar'; try{localStorage.setItem('cc_lang',LANG)}catch(e){} applyLang(); loadLesson(CUR.key); });
$('#mFree').addEventListener('click',()=>setMode('free'));
$('#mTrace').addEventListener('click',()=>setMode('trace'));
$('#vDia').addEventListener('click',()=>{ VIEW.dia=!VIEW.dia; if(!VIEW.dia&&!VIEW.pan) VIEW.pan=true; applyView(); });
$('#vPan').addEventListener('click',()=>{ VIEW.pan=!VIEW.pan; if(!VIEW.dia&&!VIEW.pan) VIEW.dia=true; applyView(); });
$('#latch').addEventListener('change',e=>{ latchMode=e.target.checked; if(!latchMode){ Object.keys(S.btn).forEach(k=>{ const b=C&&C.buttons.find(x=>x.btn===k); if(S.btn[k]&&!(b&&b.kind==='estop')) setBtn(k,false); }); } });
$('#bMains').addEventListener('click',toggleMains);
$('#bQ1').addEventListener('click',toggleQ1);
$('#rLoad').addEventListener('input',e=>{S.load=+e.target.value; $('#vLoad').textContent=S.load+'%';});
$('#rIr').addEventListener('input',e=>{S.ir=+e.target.value; $('#vIr').textContent=S.ir.toFixed(1)+' A';});
$('#bClear').addEventListener('click',()=>{ S.fault={}; S.pfault={}; refreshFaults(); solve(); refreshAll(); });
$('#bProbes').addEventListener('click',()=>{ PROBE={b:null,r:null}; refreshProbes(); refreshAll(); });
$('#bNew').addEventListener('click',newTrace);
$('#bShow').addEventListener('click',()=>{ if(!TRACE) return; $('#traceMsg').innerHTML=`<div class="msg in">${t('ansWas')}${tx(TRACE.f.l)}</div>`; if(!TRACE.done){TRACE.done=true;SCORE.n++;updScore();} });
$('#bCheck').addEventListener('click',()=>{
  if(!TRACE) return; const v=$('#suspect').value; if(!v) return;
  if(v===TRACE.f.id){ $('#traceMsg').innerHTML=`<div class="msg ok">${t('right')}${tx(TRACE.f.l)}</div>`; if(!TRACE.done){SCORE.ok++;SCORE.n++;TRACE.done=true;} FLAGS.add('solved'); }
  else { $('#traceMsg').innerHTML=`<div class="msg al">${t('wrong')}</div>`; }
  updScore(); refreshAll();
});
$('#vLoad').textContent=S.load+'%';

/* lesson list: unit 1 device lessons, then circuits */
[...DEVS,...CIRCUITS].sort((a,b)=>a.unit-b.unit||(a.kind==='device'?0:1)-(b.kind==='device'?0:1)).forEach(l=>LESSONS.push(l));
let dn=0,cn=0; LESSONS.forEach(l=>{ l.num=l.kind==='device'?++dn:++cn; });
applyLang();
function pageOf(key){ return 'lesson-'+String(LESSONS.findIndex(l=>l.key===key)+1).padStart(2,'0')+'.html'; }
function go(key){ if(window.CC_PAGES){ location.href=pageOf(key); return; } loadLesson(key); }
if(window.CC_PAGES){ const h=$('#homeA'), u=$('#hubA'); h.hidden=u.hidden=false; h.textContent=LANG==='ar'?'الرئيسية':'Home'; h.href=LANG==='ar'?'/':'/en/'; u.textContent=LANG==='ar'?'صفحة الكورس':'Course page'; }
let startKey=window.CC_LESSON||null; if(!startKey) try{ startKey=localStorage.getItem('cc_lesson') }catch(e){}
loadLesson(startKey||LESSONS[0].key);

let last=performance.now();
function frame(now){
  const dt=Math.min(0.1,(now-last)/1000); last=now; S.time+=dt;
  if(CUR.kind==='circuit'){
    timerStep(dt); if(C.process) C.process(dt); solve(); powerStep(dt); if(C.hook) C.hook(dt,HM); solve(); refreshAll();
  }else if(DEV){ DEV.tick(dt); DEV.refresh(); refreshChal(DEV); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
