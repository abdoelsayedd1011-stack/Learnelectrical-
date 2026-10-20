/* Shared behaviour: nav, theme, config fill, lab catalog. No libraries. */
(function(){
  "use strict";

  /* ======================================================================
     كتالوج الكورسات — عشان تضيف كورس أو محاكي جديد: ضيف عنصر واحد هنا وحط فولدره جنب index.html
     group: "classic" | "ab" | "drives" | "servo"     brandKey: للفلتر
     disp: النص اللي على الشاشة الصغيرة   dispClass: "" | "lcd" | "red" | "grn" | "wht"
     ====================================================================== */
  var LABS = [
    { id:"basics", path:"basics-lab/index.html", group:"basics", brand:"كورس", brandKey:"beginner",
      name:"أساسيات الكهربا", kind:"للمبتدئين", disp:"220V~", dispClass:"lcd", rtlName:true,
      line:"ابدأ بيه لو جديد على الكهربا خالص.",
      guided:13, exercises:0, params:0, faults:0,
      inside:["جهد وتيار ومقاومة وقدرة", "التوالي والتوازي والمواد الموصلة", "الأفوميتر وقياس الأجهزة في البيت", "توصيل اللمبة والبريزة وأعطال البيت"],
      tags:"basics أساسيات مبتدئين beginner electricity كهربا voltage جهد current تيار resistance مقاومة ohm أوم ac dc multimeter أفوميتر افو avo tester مفك اختبار heater سخان motor موتور transformer محول ترانس power supply باور سبلاي lamp لمبة socket بريزة switch مفتاح wiring توصيل breaker قاطع wire سلك ابدأ من الصفر: يعني إيه جهد وتيار، المواد الموصلة والعازلة، التوصيل على التوالي والتوازي، القدرة وفاتورة الكهربا، أنواع الكهربا AC و DC وسنجل وتلاتة فاز، السلامة ومفك الاختبار، الأفوميتر التفاعلي، قياس السخان والموتور والفيوز والكلامب ميتر، المحوّل والباور سبلاي 24V، قانون أوم واختيار السلك والقاطع، توصيل اللمبة والبريزة ومفتاح السلم، وأعطال البيت.  أفوميتر تفاعلي: لف الأوكرة وحط المجسات وشوف القراية (وتحذير لو غلطت غلطة خطر)   قياس عملي: سخان، غلاية، لمبة، فيوز، موتور 3 فاز وسنجل فاز، ترانس وباور سبلاي، مع عطل مخفي تكتشفه   لوحة توصيل بيت: لمبة ومفتاح، بريزة بالأرضي، مفتاح سلم، لمبتين توازي   لعبة أعطال البيت وامتحان نهائي وشهادة إتمام " },
    { id:"classic", path:"classic-control-lab/index.html", group:"classic", brand:"كورس", brandKey:"basics",
      name:"كورس الكلاسيك كنترول", kind:"كلاسيك كنترول", disp:"START", dispClass:"grn", rtlName:true,
      line:"توصّل دواير الكونتاكتور والموتور بإيدك سلك سلك، والكورس يصحّحلك.",
      guided:89, exercises:0, params:0, faults:0,
      inside:["الريلاي والكونتاكتور والحماية", "التايمرات وتشغيل الموتور 3 فاز", "ستار/دلتا والفرملة وعكس الاتجاه", "24 تمرين عملي وشهادة إتمام"],
      tags:"sounds أصوات story قصة points نقط leaderboard لوحة شرف badges شارات classic control كلاسيك كنترول protection حماية fuse فيوز mcb قاطع overload أوفرلود mpcb contactor كونتاكتور relay ريلاي push button بوش بوتن limit switch ليمت سويتش selector سلكتور lamp لمبة wiring توصيل timer تايمر on-delay off-delay flasher sequence تتابع braking فرملة dc injection plugging soft starter سوفت ستارتر bypass بايباس hvac تكييف compressor كباس hp lp thermostat ثرموستات certificate شهادة motor موتور induction إندكشن nameplate يافطة star delta ستار دلتا pressure switch بريشر سويتش float عوامة level مستوى sensor حساس pnp npn photocell خلية ضوئية jog interlock إنترلوك reversing عكس الاتجاه hoist ونش lathe مخرطة schematic رسمة دايرة مفاتيح وبوش بوتن وليمت سويتش، وبعدها الريلاي والتثبيت الذاتي والكونتاكتور وموتور 3 فاز DOL، والحماية: الفيوز والقاطع والأوفرلود الحراري والـ MPCB، والتايمرات (On-delay و Off-delay والدوري)، والموتور الإندكشن 3 فاز (اليافطة وعلبة الأطراف ستار/دلتا وعكس الاتجاه)، ومفاتيح الضغط والمستوى والحساسات PNP/NPN والخلية الضوئية، وتمارين التتابع والـ Jog وعكس الحركة، وفي الآخر المواضيع المتقدمة: ستار/دلتا (يدوي وأوتوماتيك)، طرق فرملة الموتور (DC و Plugging وفرامل الونش)، دايرة كباس التكييف المركزي على 24V، والسوفت ستارتر بالبايباس وريلاي العطل. تعرف كل عنصر وتوصّل الدايرة بإيدك سلك سلك، والمحاكي يصحّح لوحده ويرسم دايرة كل تمرين ويسخّن الأوفرلود ويفصل والتايمر يعدّ زي الحقيقي.  جديد: ماكينة متحركة تحت اللوحة بتشتغل لما دايرتك تشتغل (سير تعبئة، ونش، طلمبة وخزان، مروحة، كمبروسر، مخرطة، عداد سرعة) + قصة من المصنع لكل تمرين بالعربي وسطر «المطلوب منك»، وأصوات حقيقية (تكة السلك وانت بتوصّل، طقة الكونتاكتور، زنّة الموتور، شرارة القصر، جرس النجاح) مع زرار كتم الصوت، ونقط وساعة لكل تمرين وشارات ولوحة شرف على صفحة المحاكي   تعريف بالعربي وشكل حقيقي ورمز IEC و NEMA لكل عنصر، ورسمة دايرة (قوى + تحكم) مرسومة أوتوماتيك لكل تمرين   9 دروس: العناصر البسيطة، الريلاي والتثبيت الذاتي والإنترلوك، الكونتاكتور ودايرة القوى والتحكم، الحماية (فيوز وقاطع وأوفرلود و MPCB)، التايمرات (TON و TOF والدوري ومتعدد الوظائف)، الموتور الإندكشن 3 فاز (اليافطة، علبة الأطراف، ستار/دلتا، عكس الاتجاه)، مفاتيح الضغط والمستوى والحساسات (بريشر سويتش، عوامة، PNP/NPN، خلية ضوئية)، وتمارين التتابع والـ Jog وعكس الحركة (إنترلوك كهربي وميكانيكي، ونش بليمت سويتش، ماكينة خرط بـ4 كونتاكتورات)، والمواضيع المتقدمة: ستار/دلتا، الفرملة، كباس التكييف المركزي، والسوفت ستارتر   كل التمارين العملية الـ24 من كراسة المدرّب مفتوحة (كل تمرين دايرة قوى + تحكم + لمبات إشارة) + 89 تمرين موجّه على لوحة توصيل مقسومة دايرة قوى ودايرة تحكم، مع غلطات مقصودة تكتشفها (قصر، Jog بيثبّت، NPN متوصّل كأنه PNP، كباري الستار غلط، إنترلوك Y/Δ ناقص، LP على NO، بايباس من START)، وشهادة إتمام بتتطبع لما تخلّص الكورس " },
    { id:"instr", path:"instrumentation-lab/index.html", group:"instr", brand:"كورس", brandKey:"instr",
      name:"كورس الإنسترومنتيشن", kind:"إنسترومنتيشن", disp:"12.0mA", dispClass:"lcd", rtlName:true,
      line:"الحساسات والإشارات اللي بتقابلها في أي مصنع.",
      guided:10, exercises:0, params:0, faults:0,
      inside:["إشارة ⁦4⁠–⁠20mA⁩ وأعطالها", "الإنكودر: إنكريمنتال وأبسليوت", "حساسات الحرارة: ثيرموكبل و PT100", "اللود سيل ومعايرة الميزان"],
      tags:"instrumentation إنسترومنتيشن انسترومنتيشن sensor حساس transmitter ترانسميتر 4-20ma 4-20 analog أنالوج 0-10v loop لوب plc pid encoder إنكودر انكودر incremental absolute ppr gray quadrature temperature حرارة thermocouple ثيرموكبل ثرموكبل pt100 rtd ntc load cell لود سيل ميزان strain gauge wheatstone قنطرة indicator إنديكيتور calibration معايرة pressure ضغط level مستوى flow فلو pnp npn proximity الدايرة المقفولة و Tag الأجهزة، إشارة ⁦4⁠–⁠20mA⁩ و ⁦0⁠–⁠10V⁩ وأعطال اللوب، حساسات PNP و NPN، الإنكودر الإنكريمنتال (A/B/Z و PPR و x4) والأبسليوت و Gray code، الثيرموكبل K و J والتعويض البارد، PT100 بـ 2 و 3 و 4 سلك و NTC، اللود سيل والقنطرة و mV/V ومعايرة الإنديكيتور، الضغط والمستوى والفلو، والمعايرة والأعطال.  لوب ⁦4⁠–⁠20mA⁩ حي: اقطع السلك، اعكس القطبية، اعمل قصر، وشوف الأفوميتر والـ PLC بيقروا إيه   إنكودر بتلفّه بإيدك وتشوف نبضات A و B و Z على السكوب وتعدّها x1 و x2 و x4، وقرص Gray code   بنش ثيرموكبل بجداول NIST وبنش PT100 بـ 2 و 3 و 4 سلك يوريك غلطة طول الكابل بالدرجة   لود سيل: حط أوزان وشوف الـ mV، وعاير الإنديكيتور خطوة بخطوة، وطلّع الخلية البايظة بالأفوميتر   لعبة أعطال الموقع وامتحان نهائي وشهادة إتمام " },
    { id:"ab1336", path:"ab1336-simulator/index.html", group:"ab", brand:"Allen-Bradley", brandKey:"ab",
      name:"1336 PLUS II", kind:"انفرتر", disp:"Stopped +0.00 Hz", dispClass:"lcd",
      line:"انفرتر Allen-Bradley القديم اللي لسه شغال في مصانع كتير.",
      guided:6, exercises:10, params:82, faults:14,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"rockwell 1336 plus him sensorless Sensorless Vector، كيباد HIM بشاشة سطرين، أطراف TB3 وكروت L4 و L5 و L6.  كيباد HIM بشاشة سطرين وتنقّل بين الجروبات   أطراف TB3 وكروت الكنترول L4 / L5 / L6   وضع موجّه: توصيل، باراميترات، تشغيل، عطل " },
    { id:"pf525", path:"pf525-lab/index.html", group:"ab", brand:"Allen-Bradley", brandKey:"ab",
      name:"PowerFlex 525", kind:"انفرتر", disp:"0.00 Hz", dispClass:"",
      line:"أشهر انفرتر Allen-Bradley، وأحسن بداية لو أول مرة.",
      guided:6, exercises:10, params:137, faults:21,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"rockwell pf525 525 sto powerflex كيباد LED بالبوتنشيوميتر، جروبات b و P و t و A، و Safe Torque Off.  كيباد LED بالبوتنشيوميتر زي الحقيقي   جروبات b و P و t و A وأطراف الكنترول   Safe Torque Off وأعطال F-codes " },
    { id:"pf40", path:"pf40-lab/index.html", group:"ab", brand:"Allen-Bradley", brandKey:"ab",
      name:"PowerFlex 40", kind:"انفرتر", disp:"0.0", dispClass:"",
      line:"انفرتر Allen-Bradley صغير ومنتشر مع المواتير الصغيرة.",
      guided:6, exercises:10, params:85, faults:15,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"rockwell pf40 40 powerflex كيباد مدمج 4 خانات، باراميترات P031 لحد P043 وأطراف 01 لحد 19.  كيباد مدمج 4 خانات   باراميترات P031 لحد P043 والجروبات المتقدمة   أطراف الكنترول من 01 لحد 19 " },
    { id:"v20", path:"v20-lab/index.html", group:"drives", brand:"Siemens", brandKey:"siemens",
      name:"SINAMICS V20", kind:"انفرتر", disp:"50.00 Hz", dispClass:"lcd",
      line:"انفرتر Siemens الاقتصادي، منتشر في الطلمبات والمراوح.",
      guided:6, exercises:10, params:115, faults:14,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"siemens sinamics v20 bop macro BOP بشاشة LCD، ماكروهات Cn و AP، وتشغيل Hand و Auto.  BOP بشاشة LCD وزراير M و OK و Fn   ماكروهات التوصيل Cn والتطبيقات AP   تشغيل Hand و Auto وأعطال F و A " },
    { id:"atv320", path:"atv320-lab/index.html", group:"drives", brand:"Schneider Electric", brandKey:"schneider",
      name:"Altivar ATV320", kind:"انفرتر", disp:"rdY", dispClass:"red",
      line:"انفرتر Schneider للماكينات والسيور.",
      guided:6, exercises:10, params:89, faults:16,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"schneider altivar atv320 320 شاشة 4 خانات بقوائم SIM و drC و I_O و CtL و FLt.  شاشة 7-segment بأربع خانات وعجلة جوج   قوائم SIM و drC و I_O و CtL و FLt   أعطال OCF و OLF و SLF وغيرها " },
    { id:"atv630", path:"atv630-lab/index.html", group:"drives", brand:"Schneider Electric", brandKey:"schneider",
      name:"Altivar Process ATV630", kind:"انفرتر", disp:"ATV630 · RDY", dispClass:"wht",
      line:"انفرتر Schneider للطلمبات والمراوح الكبيرة.",
      guided:6, exercises:10, params:97, faults:16,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"schneider altivar process atv630 630 pump تيرمينال جرافيك بمفاتيح F1 لحد F4، وطلمبة بضغط وتدفق.  تيرمينال جرافيك بمفاتيح F1 لحد F4   تطبيق طلمبة بقراءات ضغط وتدفق   قوائم الإعداد الكامل والأعطال " },
    { id:"ms300", path:"ms300-lab/index.html", group:"drives", brand:"Delta", brandKey:"delta",
      name:"VFD-MS300", kind:"انفرتر", disp:"F 0.00", dispClass:"red",
      line:"انفرتر Delta الصغير، من أكتر الأنواع انتشارًا.",
      guided:6, exercises:10, params:111, faults:25,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"delta ms300 vfd كيباد LED بشاشات F و H و U و A، جروبات 00 لحد 14 وأطراف MI.  كيباد LED بشاشات F و H و U و A   جروبات الباراميترات 00 لحد 14   أطراف MI الرقمية والأنالوج " },
    { id:"fc51", path:"fc51-lab/index.html", group:"drives", brand:"Danfoss", brandKey:"danfoss",
      name:"VLT Micro Drive FC 51", kind:"انفرتر", disp:"0.0 Hz", dispClass:"lcd",
      line:"انفرتر Danfoss الصغير للأحمال البسيطة.",
      guided:6, exercises:10, params:157, faults:23,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"danfoss vlt micro fc51 fc 51 lcp LCP 12 بالبوتنشيوميتر، Hand و Off و Auto، والإنذارات AL و WR.  لوحة LCP 12 بالبوتنشيوميتر   تشغيل Hand و Off و Auto   إنذارات AL وتحذيرات WR " },
    { id:"vfd", path:"vfd-simulator/index.html", group:"drives", brand:"مقارنة", brandKey:"multi",
      name:"محاكي الانفرترات الشامل", kind:"مقارنة", disp:"7 درايفات", dispClass:"grn", rtlName:true,
      line:"7 انفرترات جنب بعض، عشان تقارن نفس الوظيفة بين الماركات.",
      guided:0, exercises:0, params:0, faults:0,
      inside:["نفس التمرين على كل الماركات", "مقارنة الباراميترات والأطراف", "لوحة توصيل وتمارين بتتصحح"],
      tags:"compare all drives vfd مقارنة شامل كل الانفرترات في صفحة واحدة، ولوحة التوصيل العملي، ومقارنة نفس الوظيفة بين الماركات.  7 انفرترات في صفحة واحدة   لوحة توصيل عملي مشتركة   مقارنة نفس الوظيفة بين الماركات " },
    { id:"servo", path:"servo-simulator/index.html", group:"servo", brand:"Delta", brandKey:"delta",
      name:"ASDA-B2 Servo", kind:"سيرفو", disp:"00000", dispClass:"red",
      line:"سيرفو Delta: سرعة وموضع وضبط الجين.",
      guided:6, exercises:12, params:100, faults:12,
      inside:["توصيل الدرايف والموتور والإنكودر", "وضع السرعة ووضع الموضع", "ضبط الجين وشكل الحركة", "الإنذارات وإزاي تحلّها"],
      tags:"delta asda b2 servo سيرفو plc pulse درايف وموتور سيرفو، أوضاع PT و PR و S و T، ونبضات من PLC.  درايف وموتور سيرفو ASDA-B2   أوضاع التحكم PT و PR و S و T   6 تمارين محلولة خطوة بخطوة ونبضات من PLC " },
    { id:"e5cc", path:"e5cc-lab/index.html", group:"temp", brand:"Omron", brandKey:"omron",
      name:"E5CC", kind:"كنترول حرارة", disp:"25 <span class=\"sv\">150</span>", dispClass:"red", html:true,
      line:"كنترولر حرارة Omron: توصيل الحساس وضبط الحرارة.",
      guided:6, exercises:10, params:76, faults:12,
      inside:["توصيل الثيرموكبل و PT100", "ضبط درجة الحرارة المطلوبة", "PID والـ Auto-tuning", "الإنذارات والخرج"],
      tags:"omron e5cc temperature pid حرارة كنترولر حرارة على فرن، ON/OFF و PID و Autotuning وإنذارات.  كنترولر حرارة متوصل على فرن   ON/OFF و PID و Autotuning   إنذارات الحرارة وأخطاء الحساس " }
  ];
  var GROUPS = [
    { key:"basics", title:"أساسيات الكهربا", sub:"للمبتدئين خالص · قبل الكلاسيك" },
    { key:"classic", title:"كلاسيك كنترول", sub:"مفاتيح · بوش بوتن · كونتاكتورات · موتور" },
    { key:"instr", title:"إنسترومنتيشن", sub:"إنكودر · حساسات حرارة · لود سيل · ⁦4⁠–⁠20mA⁩" },
    { key:"ab", title:"انفرترات Allen-Bradley", sub:"Rockwell Automation" },
    { key:"drives", title:"انفرترات تانية", sub:"Siemens · Schneider · Delta · Danfoss" },
    { key:"servo", title:"سيرفو", sub:"درايفات وموتورات سيرفو" },
    { key:"temp", title:"كنترول حرارة", sub:"Omron" }
  ];
  var BRANDS = [
    { key:"all", label:"الكل" }, { key:"beginner", label:"للمبتدئين" }, { key:"basics", label:"كلاسيك كنترول" }, { key:"instr", label:"إنسترومنتيشن" }, { key:"ab", label:"Allen-Bradley" }, { key:"siemens", label:"Siemens" },
    { key:"schneider", label:"Schneider" }, { key:"delta", label:"Delta" }, { key:"danfoss", label:"Danfoss" },
    { key:"omron", label:"Omron" }, { key:"multi", label:"مقارنة" }
  ];
  window.LABS = LABS;

  var root = document.documentElement;
  function store(k, v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){ return null; } }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

  /* ---------- theme ---------- */
  function isDark(){
    var t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  }
  document.querySelectorAll(".theme-btn").forEach(function(b){
    function label(){ b.setAttribute("aria-label", isDark() ? "الوضع الفاتح" : "الوضع الغامق"); b.title = b.getAttribute("aria-label"); }
    label();
    b.addEventListener("click", function(){
      var next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next); store("site-theme", next); label();
    });
  });

  /* ---------- mobile nav ---------- */
  var menuBtn = document.querySelector(".menu-btn"), nav = document.getElementById("site-nav");
  if (menuBtn && nav){
    function setOpen(o){ nav.classList.toggle("open", o); menuBtn.setAttribute("aria-expanded", o ? "true" : "false"); menuBtn.setAttribute("aria-label", o ? "اقفل القايمة" : "افتح القايمة"); }
    menuBtn.addEventListener("click", function(){ setOpen(!nav.classList.contains("open")); });
    nav.addEventListener("click", function(e){ if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape" && nav.classList.contains("open")){ setOpen(false); menuBtn.focus(); } });
    document.addEventListener("click", function(e){ if (nav.classList.contains("open") && !e.target.closest(".site-header")) setOpen(false); });
  }

  /* ---------- account link (membership) ---------- */
  if (nav){
    var authA = document.createElement("a");
    authA.className = "nav-auth"; authA.href = "login.html"; authA.textContent = "دخول";
    if (/\/(login|account)\.html$/.test(location.pathname)) authA.setAttribute("aria-current", "page");
    nav.appendChild(authA);
    var setUser = function(u){ root.classList.toggle("is-member", !!(u && u.name)); if (u && u.name){ authA.href = "account.html"; authA.textContent = u.name.split(" ")[0]; } else { authA.href = "login.html"; authA.textContent = "دخول"; } };
    try{ setUser(JSON.parse(sessionStorage.getItem("le-user") || "null")); }catch(e){}
    if (window.fetch && /^https?:$/.test(location.protocol)){
      fetch("/api/auth/me", { credentials: "same-origin" }).then(function(r){ return r.ok ? r.json() : null; }).then(function(r){
        if (!r || !r.ok) return;
        setUser(r.user);
        try{ if (r.user) sessionStorage.setItem("le-user", JSON.stringify(r.user)); else sessionStorage.removeItem("le-user"); }catch(e){}
      }, function(){});
    }
  }

  /* ---------- config fill ---------- */
  var S = window.SITE || {};
  var name = S.name || "LearnElectricals";
  var domain = String(S.domain || "www.learnelectricals.com").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!/^www\./.test(domain)) domain = "www." + domain;
  document.querySelectorAll("[data-site='name']").forEach(function(el){ el.textContent = name; });
  // Wordmark: "LearnElectricals" -> Learn<b>Electricals</b> (second word in the accent colour)
  var m = /^([A-Z]?[a-z]+)([A-Z].*)$/.exec(name);
  document.querySelectorAll("[data-site='wordmark']").forEach(function(el){
    el.textContent = m ? m[1] : name;
    if (m){ var bEl = document.createElement("b"); bEl.textContent = m[2]; el.appendChild(bEl); }
  });
  document.querySelectorAll("[data-site='domain']").forEach(function(el){ el.textContent = domain; });
  document.querySelectorAll("[data-site='year']").forEach(function(el){ el.textContent = new Date().getFullYear(); });
  if (name !== "LearnElectricals" && document.title.indexOf("LearnElectricals") > -1) document.title = document.title.replace("LearnElectricals", name);
  var wa = String(S.whatsapp || "").replace(/[^\d]/g, "");
  var links = {
    whatsapp: wa ? "https://wa.me/" + wa + "?text=" + encodeURIComponent("السلام عليكم، جاي من موقع " + name) : "",
    email: S.email ? "mailto:" + S.email : "",
    facebook: S.facebook || "",
    youtube: S.youtube || ""
  };
  var shown = 0;
  document.querySelectorAll("[data-link]").forEach(function(el){
    var k = el.getAttribute("data-link"), href = links[k];
    if (href){ el.setAttribute("href", href); el.hidden = false; if (el.classList.contains("contact-card")) shown++;
      if (k !== "email" && k !== "whatsapp"){ el.target = "_blank"; el.rel = "noopener"; } }
    else { el.hidden = true; el.removeAttribute("href"); }
  });
  document.querySelectorAll("[data-show='whatsapp']").forEach(function(el){ el.textContent = wa ? "+" + wa : ""; });
  document.querySelectorAll("[data-show='email']").forEach(function(el){ el.textContent = S.email || ""; });
  // لو مفيش ولا وسيلة تواصل في site-config.js: نخبي كل لينكات وأزرار التواصل ونظهر ملاحظة «هتتضاف قريب»
  var hasContact = Object.keys(links).some(function(k){ return !!links[k]; });
  document.querySelectorAll("[data-needs-contact]").forEach(function(el){ el.hidden = !hasContact; });
  document.querySelectorAll("[data-no-contact]").forEach(function(el){ el.hidden = hasContact; });
  document.querySelectorAll(".socials").forEach(function(el){ el.hidden = !el.querySelector("a:not([hidden])"); });

  /* ---------- catalog ---------- */
  var cat = document.querySelector("[data-catalog]");
  if (!cat) return;
  var detail = cat.getAttribute("data-catalog") === "detail";
  var chipsEl = document.querySelector("[data-chips]"), searchEl = document.querySelector("[data-search]");
  var emptyEl = document.querySelector("[data-empty]"), countEl = document.querySelector("[data-count]");
  var state = { brand:"all", q:"" };

  function facts(l){
    var f = [];
    if (l.guided) f.push(l.guided + " تمارين محلولة");
    if (l.exercises) f.push(l.exercises + " تمارين بتتصحح");
    if (l.params) f.push((l.id === "servo" ? "حوالي " : "") + l.params + " باراميتر");
    if (l.faults) f.push(l.faults + " عطل");
    return f;
  }
  function goText(l){ return l.brand === "كورس" ? "ابدأ الكورس ←" : "افتح المحاكي ←"; }
  function card(l){
    var disp = '<div class="disp ' + esc(l.dispClass) + '" aria-hidden="true">' + (l.html ? l.disp : esc(l.disp)) + "</div>";
    var acc = l.id === "pf525" ? "من غير حساب" : (l.id === "classic" || l.id === "basics" || l.id === "instr") ? "أول درسين من غير حساب" : "بحساب مجاني";
    var head = '<div class="meta"><span class="brand">' + esc(l.brand) + '</span><span class="kind">' + esc(l.kind) + '</span><span class="access' + (l.id === "pf525" ? " open" : "") + '">' + acc + "</span></div>" +
               '<h4' + (l.rtlName ? ' style="direction:rtl"' : "") + ">" + esc(l.name) + "</h4>";
    if (!detail){
      return '<a class="card" href="' + esc(l.path) + '" data-id="' + l.id + '">' + disp + head + "<p>" + esc(l.line) + '</p><span class="go">' + goText(l) + '</span></a>';
    }
    var fl = facts(l).map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("");
    var ins = l.inside.map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("");
    return '<article class="card detail" data-id="' + l.id + '">' + disp + head + "<p>" + esc(l.line) + "</p>" +
      (fl ? '<ul class="facts">' + fl + "</ul>" : "") + '<ul class="inside">' + ins + "</ul>" +
      '<a class="go" href="' + esc(l.path) + '">' + goText(l) + '<span class="sr-only"> ' + esc(l.name) + "</span></a></article>";
  }
  function match(l){
    if (state.brand !== "all" && l.brandKey !== state.brand) return false;
    if (!state.q) return true;
    var hay = (l.name + " " + l.brand + " " + l.line + " " + l.kind + " " + l.tags + " " + l.inside.join(" ")).toLowerCase();
    return state.q.toLowerCase().split(/\s+/).every(function(w){ return hay.indexOf(w) > -1; });
  }
  function render(){
    var html = "", n = 0;
    GROUPS.forEach(function(g){
      var items = LABS.filter(function(l){ return l.group === g.key && match(l); });
      if (!items.length) return;
      n += items.length;
      html += '<section class="group" aria-label="' + esc(g.title) + '"><h3 class="gtitle">' + esc(g.title) + ' <small class="ltr">' + esc(g.sub) + '</small></h3><div class="grid">' + items.map(card).join("") + "</div></section>";
    });
    cat.innerHTML = html;
    if (emptyEl) emptyEl.classList.toggle("show", n === 0);
    if (countEl) countEl.textContent = n === LABS.length ? "الكل (" + n + ")" : "ظاهر " + n + " من " + LABS.length;
  }
  if (chipsEl){
    chipsEl.innerHTML = BRANDS.map(function(b){ return '<button type="button" class="chip" data-brand="' + b.key + '" aria-pressed="' + (b.key === "all") + '">' + esc(b.label) + "</button>"; }).join("");
    chipsEl.addEventListener("click", function(e){
      var b = e.target.closest(".chip"); if (!b) return;
      state.brand = b.getAttribute("data-brand");
      chipsEl.querySelectorAll(".chip").forEach(function(c){ c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
      render();
    });
  }
  if (searchEl) searchEl.addEventListener("input", function(){ state.q = searchEl.value.trim(); render(); });
  var reset = document.querySelector("[data-reset]");
  if (reset) reset.addEventListener("click", function(){ state = { brand:"all", q:"" }; if (searchEl) searchEl.value = ""; if (chipsEl) chipsEl.querySelectorAll(".chip").forEach(function(c){ c.setAttribute("aria-pressed", c.getAttribute("data-brand") === "all" ? "true" : "false"); }); render(); });
  render();
})();
