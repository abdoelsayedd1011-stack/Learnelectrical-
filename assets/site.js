/* Shared behaviour: nav, theme, config fill, lab catalog. No libraries. */
(function(){
  "use strict";

  /* ======================================================================
     كتالوج الكورسات — عشان تضيف كورس أو محاكي جديد: ضيف عنصر واحد هنا وحط فولدره جنب index.html
     group: "basics" | "classic" | "drawings" | "instr" | "plc" | "drives" | "servo" | "temp"     brandKey: للفلتر
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
    { id:"plc", path:"plc-lab/index.html", group:"plc", brand:"كورس", brandKey:"plc",
      name:"كورس الـ PLC", kind:"PLC", disp:"Q0.0 ON", dispClass:"grn", rtlName:true,
      line:"تكتب برامج Ladder بإيدك وتشغّلها على محاكي.",
      guided:10, exercises:0, params:0, faults:0,
      inside:["توصيل الدخل والخرج PNP و NPN", "Ladder: تثبيت ذاتي و Set/Reset", "تايمرات وعدادات ومشاريع بتتحرك", "تمارين على Siemens و Delta و Allen-Bradley"],
      tags:"plc بي ال سي بى ال سى بلc programmable logic controller كنترولر مبرمج برمجة programming ladder لادر ladder logic lad iec 61131 siemens سيمنز s7 s7-1200 tia portal allen bradley rslogix studio 5000 delta دلتا ispsoft wplsoft dvp compactlogix controllogix xic xio ote ons rto mitsubishi gx works scan cycle دورة السكان input output دخل خرج di do sinking sourcing pnp npn relay ريلاي transistor ترانزستور contact كونتاكت coil كويل no nc and or seal in latch تثبيت ذاتي set reset إنترلوك interlock timer تايمر ton tof tp counter عداد ctu ctd compare مقارنة flag memory ذاكرة m bit edge rising falling analog أنالوج 4-20ma scaling raw counts star delta ستار دلتا traffic light إشارة مرور tank تانك conveyor سير troubleshooting تربل شوتنج force فورس online monitor أوتوميشن automation" },
    { id:"drw", path:"drawings-lab/index.html", group:"drawings", brand:"كورس", brandKey:"drawings",
      name:"كورس قراية الرسومات الكهربية", kind:"رسومات كهربية", disp:"-K1 /3.4", dispClass:"wht", rtlName:true,
      line:"تقرا أي رسمة لوحة وتتتبّع منها العطل.",
      guided:7, exercises:0, params:0, faults:0,
      inside:["أنواع الرسومات والرموز IEC و NEMA", "أرقام الأطراف والكروس ريفرنس", "دايرة التحكم والـ Single line", "تتبّع العطل من الرسمة وشهادة"],
      tags:"drawings رسومات رسمة الرسومات الكهربية قراية قراءة electrical drawing schematic diagram مخطط مخططات wiring diagram رسمة توصيل circuit دايرة control circuit دايرة التحكم power circuit دايرة القوى single line diagram sld سينجل لاين ون لاين one line symbols رموز iec ansi nema terminal ترمنال terminal strip x1 x2 cross reference كروس ريفرنس device tag -k1 -q1 -f1 a1 a2 13-14 21-22 95-96 panel layout رسمة اللوحة din rail دين ريل ferrule فيرول cable schedule جدول الكابلات p&id mdb mcc لوحة توزيع breaker قاطع contactor كونتاكتور overload أوفرلود dol عكس الحركة reversing troubleshooting تتبّع الأعطال أفوميتر eplan autocad electrical أوتوكاد" },
    { id:"vfdc", path:"vfd-course/index.html", group:"drives", brand:"كورس", brandKey:"vfdc",
      name:"كورس الانفرتر (VFD)", kind:"ابدأ بالشرح", disp:"50.00 Hz", dispClass:"lcd", rtlName:true,
      line:"افهم الانفرتر من جوه قبل ما تمسك أي جهاز.",
      guided:12, exercises:0, params:0, faults:0,
      inside:["جوه الانفرتر والـ PWM والـ V/f", "التوصيل والباراميترات الأساسية", "الفرملة والـ PID والأعطال"],
      tags:"vfd course كورس الانفرتر انفرتر إنفرتر inverter drive درايف شرح نظري theory dc bus igbt pwm v/f vector sensorless autotune braking resistor فرملة ov oc uv pid sleep 2-wire 3-wire 4-20ma 0-10v باراميترات parameters nameplate يافطة الموتور أعطال faults commissioning تشغيل سلامة emc derating harmonics هارمونيكس" },
    { id:"ab1336", path:"ab1336-simulator/index.html", group:"drives", brand:"Allen-Bradley", brandKey:"ab",
      name:"1336 PLUS II", kind:"انفرتر", disp:"Stopped +0.00 Hz", dispClass:"lcd",
      line:"انفرتر Allen-Bradley القديم اللي لسه شغال في مصانع كتير.",
      guided:6, exercises:10, params:82, faults:14,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"rockwell 1336 plus him sensorless Sensorless Vector، كيباد HIM بشاشة سطرين، أطراف TB3 وكروت L4 و L5 و L6.  كيباد HIM بشاشة سطرين وتنقّل بين الجروبات   أطراف TB3 وكروت الكنترول L4 / L5 / L6   وضع موجّه: توصيل، باراميترات، تشغيل، عطل " },
    { id:"pf525", path:"pf525-lab/index.html", group:"drives", brand:"Allen-Bradley", brandKey:"ab",
      name:"PowerFlex 525", kind:"انفرتر", disp:"0.00 Hz", dispClass:"",
      line:"أشهر انفرتر Allen-Bradley، وأحسن بداية لو أول مرة.",
      guided:6, exercises:10, params:137, faults:21,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"rockwell pf525 525 sto powerflex كيباد LED بالبوتنشيوميتر، جروبات b و P و t و A، و Safe Torque Off.  كيباد LED بالبوتنشيوميتر زي الحقيقي   جروبات b و P و t و A وأطراف الكنترول   Safe Torque Off وأعطال F-codes " },
    { id:"pf40", path:"pf40-lab/index.html", group:"drives", brand:"Allen-Bradley", brandKey:"ab",
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
    { id:"vlt2800", path:"vlt2800-lab/index.html", group:"drives", brand:"Danfoss", brandKey:"danfoss",
      name:"VLT 2800", kind:"انفرتر", disp:"Fr 0.0", dispClass:"lcd",
      line:"انفرتر Danfoss القديم المشهور في المصانع، بكيبادّه الحقيقي.",
      guided:6, exercises:9, params:101, faults:23,
      inside:["كيباد حقيقي: QUICK MENU و CHANGE DATA و + و -", "Local من الكيباد و Remote من الأطراف", "باراميترات بأرقام VLT 2800 (102 و 207 و 302)", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"danfoss vlt 2800 vlt2800 2822 دانفوس quick menu change data local remote الشاشة الخضرا AL WA" },
    { id:"acs580", path:"acs580-lab/index.html", group:"drives", brand:"ABB", brandKey:"abb",
      name:"ACS580", kind:"انفرتر", disp:"0.0 Hz", dispClass:"lcd",
      line:"انفرتر ABB العام، بلوحة Assistant بالقوايم.",
      guided:6, exercises:0, params:0, faults:0,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"abb acs580 ايه بي بي assistant panel vfd inverter انفرتر" },
    { id:"g120", path:"g120-lab/index.html", group:"drives", brand:"Siemens", brandKey:"siemens",
      name:"SINAMICS G120", kind:"انفرتر", disp:"50.00", dispClass:"lcd",
      line:"انفرتر Siemens للمصانع، بالـ BOP-2.",
      guided:6, exercises:0, params:0, faults:0,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"siemens سيمنز g120 cu240e pm240 bop-2 sinamics vfd inverter انفرتر" },
    { id:"fre800", path:"fre800-lab/index.html", group:"drives", brand:"Mitsubishi", brandKey:"mitsubishi",
      name:"FR-E800", kind:"انفرتر", disp:"0.00", dispClass:"red",
      line:"انفرتر Mitsubishi الصغير بالعجلة، ومعاه الفرق مع D700.",
      guided:6, exercises:0, params:0, faults:0,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"mitsubishi ميتسوبيشي fr-e800 fr-d700 e700 pr.79 freqrol vfd inverter انفرتر" },
    { id:"ga500", path:"ga500-lab/index.html", group:"drives", brand:"Yaskawa", brandKey:"yaskawa",
      name:"GA500", kind:"انفرتر", disp:"F 0.00", dispClass:"red",
      line:"انفرتر Yaskawa الجديد، ومعاه الفرق مع V1000.",
      guided:6, exercises:0, params:0, faults:0,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"yaskawa ياسكاوا ga500 v1000 a1000 j1000 vfd inverter انفرتر" },
    { id:"ig5a", path:"ig5a-lab/index.html", group:"drives", brand:"LS", brandKey:"ls",
      name:"iG5A", kind:"انفرتر", disp:"0.00", dispClass:"red",
      line:"انفرتر LS المنتشر جدًا في الورش، ومعاه S100.",
      guided:6, exercises:0, params:0, faults:0,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"ls lsis ال اس ig5a s100 starvert vfd inverter انفرتر" },
    { id:"gd20", path:"gd20-lab/index.html", group:"drives", brand:"INVT", brandKey:"invt",
      name:"GD20", kind:"انفرتر", disp:"0.00", dispClass:"red",
      line:"انفرتر INVT الاقتصادي المنتشر في السوق.",
      guided:6, exercises:0, params:0, faults:0,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"invt انفت gd20 goodrive vfd inverter انفرتر" },
    { id:"c2000", path:"c2000-lab/index.html", group:"drives", brand:"Delta", brandKey:"delta",
      name:"VFD-C2000", kind:"انفرتر", disp:"F 0.00", dispClass:"lcd",
      line:"انفرتر Delta الكبير بكيباد KPC-CC01.",
      guided:6, exercises:0, params:0, faults:0,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"delta دلتا c2000 vfd-c kpc-cc01 vfd inverter انفرتر" },
    { id:"frenic", path:"frenic-lab/index.html", group:"drives", brand:"Fuji", brandKey:"fuji",
      name:"FRENIC-Mini C2", kind:"انفرتر", disp:"0.00", dispClass:"red",
      line:"انفرتر Fuji الصغير بالبوتنشيوميتر اللي فيه.",
      guided:6, exercises:0, params:0, faults:0,
      inside:["توصيل الباور والموتور وأطراف الكنترول", "الباراميترات من الكيباد زي الحقيقي", "تشغيل وإيقاف وتغيير السرعة", "أعطال تعملها بإيدك وتصلّحها"],
      tags:"fuji فوجي frenic mini c2 frn vfd inverter انفرتر" },
    { id:"vfd", path:"vfd-simulator/index.html", group:"drives", brand:"مقارنة", brandKey:"multi",
      name:"محاكي الانفرترات الشامل", kind:"مقارنة", disp:"7 درايفات", dispClass:"grn", rtlName:true,
      line:"7 انفرترات جنب بعض، عشان تقارن نفس الوظيفة بين الماركات.",
      guided:0, exercises:0, params:0, faults:0,
      inside:["نفس التمرين على كل الماركات", "مقارنة الباراميترات والأطراف", "لوحة توصيل وتمارين بتتصحح"],
      tags:"compare all drives vfd مقارنة شامل كل الانفرترات في صفحة واحدة، ولوحة التوصيل العملي، ومقارنة نفس الوظيفة بين الماركات.  7 انفرترات في صفحة واحدة   لوحة توصيل عملي مشتركة   مقارنة نفس الوظيفة بين الماركات " },
    { id:"iiot", path:"iiot-lab/index.html", group:"iiot", brand:"كورس", brandKey:"iiot",
      name:"كورس إنترنت الأشياء الصناعي والشبكات الصناعية", kind:"ابدأ بالشرح", disp:"MQTT", dispClass:"red", rtlName:true,
      line:"كل الشبكات الصناعية من الكابل للسحابة، ومحاكي شبكات من 11 تمرين، وتشخيص الأعطال.",
      guided:14, exercises:11, params:0, faults:8,
      inside:["IP و Modbus RTU/TCP و PROFIBUS و PROFINET و CAN", "DeviceNet و EtherNet/IP و IO-Link و HART و OPC UA و MQTT", "البوابة ولوحة المتابعة والصيانة التنبؤية وتشخيص الأعطال"],
      tags:"iiot iot industrial internet of things انترنت الاشياء الصناعي شبكات صناعية industrial networks modbus rtu tcp rs485 profibus profinet can canopen devicenet ethernet/ip ethercat as-i io-link hart opc ua mqtt node-red gateway بوابة dashboard لوحة oee predictive maintenance صيانة تنبؤية troubleshooting تشخيص اعطال ترابل شوتينج wireshark proneta ip subnet تشخيص الشبكات" },
    { id:"scada", path:"scada-lab/index.html", group:"scada", brand:"كورس", brandKey:"scada",
      name:"كورس SCADA و HMI", kind:"ابدأ بالشرح", disp:"HMI", dispClass:"wht", rtlName:true,
      line:"صمّم شاشات تشغيل حديثة واربطها بالـ PLC، وأدِر الإنذارات والترندات والصلاحيات والوصفات على محطة SCADA حيّة.",
      guided:12, exercises:11, params:0, faults:4,
      inside:["WinCC Unified و TIA Portal والوسوم والاتصال بالـ PLC", "شاشات ISA-101 والوجوه الجاهزة والإنذارات ISA-18.2", "الترندات والصلاحيات والوصفات والتكرار وتشخيص الأعطال"],
      tags:"scada hmi سكادا اسكادا شاشات تشغيل شاشة لمس operator panel wincc unified wincc tia portal comfort panel mtp ignition factorytalk optix view aveva tags وسوم alarm إنذارات انذارات isa-18.2 isa-101 high performance hmi trend ترند historian أرشفة faceplate وجوه جاهزة recipe وصفات users صلاحيات iec 62443 redundancy تكرار خادم احتياطي opc ua javascript plcsim filling line خط تعبئة تشخيص اعطال troubleshooting designer مصمم شاشات" },
    { id:"panel", path:"panel-lab/index.html", group:"panel", brand:"كورس", brandKey:"panel",
      name:"كورس تصميم اللوحات الكهربية", kind:"ابدأ بالشرح", disp:"400A", dispClass:"grn", rtlName:true,
      line:"احسب الأحمال واختر القاطع والكابل والبار، وافحص هبوط الجهد وتيار القصر والانتقائية، ثم صمّم لوحة توزيع رئيسية كاملة.",
      guided:12, exercises:11, params:0, faults:0,
      inside:["حساب الأحمال واختيار القواطع والكابلات والبارات النحاسية", "هبوط الجهد وتيار القصر والانتقائية والتأريض", "تحسين معامل القدرة وترتيب اللوحة وحرارتها ولوحات MCC"],
      tags:"panel design تصميم اللوحات لوحة كهربية لوح كهرباء لوحات توزيع mdb smdb db main distribution board لوحة توزيع رئيسية فرعية switchboard switchgear mcc motor control center لوحة محركات load calculation حساب الأحمال demand factor معامل الطلب diversity breaker قاطع قواطع mcb mccb acb cable sizing مقطع الكابل كابلات iz voltage drop هبوط الجهد short circuit تيار القصر icu ics busbar بارات نحاس selectivity انتقائية discrimination cascading earthing تأريض أرضي tn-s tt it rcd elcb power factor معامل القدرة مكثفات capacitor bank kvar heat rise حرارة اللوحة forms of separation ip54 iec 61439 iec 60364 iec 60947 iec 60909 الكود المصري dol star delta ستار دلتا soft starter type 2 megger اختبار العزل calc designer حاسبة مصمم" },
    { id:"maint", path:"maint-lab/index.html", group:"maint", brand:"كورس", brandKey:"maint",
      name:"كورس صيانة المحركات والمحولات", kind:"ابدأ بالشرح", disp:"PI 2.4", dispClass:"lcd", rtlName:true,
      line:"اختبر المحرك والمحول بالأجهزة الحقيقية: الميجر والملفات والمحامل والاهتزاز والمحاذاة، ثم نسبة التحويل وزيت المحول وتحليل غازاته، وابنِ خطة صيانة لمصنع كامل.",
      guided:12, exercises:11, params:0, faults:0,
      inside:["اختبار العزل بالميجر و PI ومقاومة الملفات وقراءة لوحة البيانات", "المحامل والتشحيم والاهتزاز والمحاذاة بالليزر والحرارة وتشخيص الأعطال", "تفتيش المحول واختبار TTR والجهد الانهياري للزيت وتحليل الغازات DGA وخطة الصيانة"],
      tags:"maint maintenance motor maintenance transformer maintenance صيانة صيانة كهربية صيانة المحركات صيانة المحولات محرك محركات موتور مواتير ماتور induction motor محرك حثي nameplate لوحة البيانات يافطة الموتور star delta نجمة دلتا ستار دلتا أطراف الملفات ميجر ميجا megger insulation resistance عزل مقاومة العزل اختبار العزل pi dar polarization index ieee 43 winding resistance مقاومة الملفات micro-ohm ميكرو أوم قصر لفات شورت أرضي ارضي bearing bearings محامل محمل رولمان رولمانات بلي grease greasing lubrication تشحيم شحم جريس تزييت vibration اهتزاز اهتزازات iso 20816 unbalance عدم اتزان soft foot alignment محاذاة laser alignment ليزر ضبط استقامة كوبلنج coupling thermography ثرموجرافي ثيرموجرافي كاميرا حرارية thermal camera سخونة حرارة voltage unbalance عدم اتزان الجهد derating mcsa تحليل التيار troubleshooting تشخيص أعطال اعطال rewinding rewind إعادة لف اعادة لف لف الموتور transformer transformers محول محولات ترانس ترانسات distribution transformer iec 60076 vector group dyn11 مجموعة التوصيل tap changer مغير الجهد buchholz بوخهولز silica gel سيليكا جل مجفف breather transformer oil زيت المحول زيت bdv الجهد الانهياري iec 60156 رطوبة حموضة dga تحليل الغازات dissolved gas duval مثلث دوفال iec 60599 ttr نسبة التحويل turns ratio excitation current تيار المغنطة inspection تفتيش loto إقفال lockout tagout preventive صيانة وقائية predictive صيانة تنبؤية condition monitoring maintenance plan خطة صيانة clamp meter كلامب ورشة محطة" },
    { id:"srvm", path:"servo-maint-lab/index.html", group:"srvm", brand:"كورس", brandKey:"srvm",
      name:"كورس صيانة محركات السيرفو", kind:"ابدأ بالشرح", disp:"AL.16", dispClass:"red", rtlName:true,
      line:"افحص محرك السيرفو وإنكودره وفراملِه ودرايفه بالأجهزة الحقيقية، وشخّص الإنذار حتى تصل إلى سببه، ثم أصلح واضبط وأعد محور ماكينة CNC إلى الإنتاج.",
      guided:13, exercises:12, params:0, faults:0,
      inside:["اختبار الملفات والعزل و Back-EMF ولوحة البيانات والفرامل والمحامل", "كل أنواع الإنكودر وفحصها بالأوسيلوسكوب واستبدالها وضبط الإزاحة", "اختبار الدرايف و IGBT والمكثفات وتشخيص الإنذارات والضبط بمرشّح Notch"],
      tags:"srvm servo maintenance servo repair سيرفو سرفو سيرفو موتور صيانة سيرفو صيانة السيرفو صيانة محركات السيرفو تصليح سيرفو اصلاح سيرفو إصلاح السيرفو pmsm محرك متزامن مغانط دائمة لوحة البيانات nameplate ملفات مقاومة الملفات winding resistance ميجر ميجا megger عزل ieee 43 back-emf باك emf ke ثابت الجهد انكودر إنكودر اينكودر encoder ريزولفر resolver sin cos sincos endat biss ssi hiperface dsl absolute مطلق incremental تزايدي ttl htl hall هول multi-turn متعدد اللفات بطارية الانكودر battery اوسيلوسكوب أوسيلوسكوب راسم الإشارة scope a/b/z استبدال الانكودر commutation offset زاوية الإزاحة ضبط الإزاحة فرامل فرامل السيرفو brake holding brake محامل بلي رولمان bearing سدادة seal فقدان المغنطة demagnetization كابلات كابل الإنكودر تأريض أرضي shield حجب 360 تشويش noise emc درايف دريفر درايف السيرفو drive servo drive amplifier igbt مقوم rectifier مكثفات capacitor dc bus الناقل المستمر تفريغ المكثفات regen مقاومة فرملة مقاومة الكبح braking resistor مروحة انذارات إنذارات الإنذارات alarms alarm overcurrent overvoltage encoder error following error خطأ التتبع overload tuning تيونينج ضبط الجين gain inertia القصور الذاتي notch filter مرشح notch رنين resonance cnc ماكينة cnc محور axis منضدة محطة" },
    { id:"srv", path:"servo-course/index.html", group:"servo", brand:"كورس", brandKey:"srvc",
      name:"كورس السيرفو موتور والدرايف", kind:"ابدأ بالشرح", disp:"S-ON", dispClass:"red", rtlName:true,
      line:"افهم السيرفو من جوه قبل ما تمسك أي درايف.",
      guided:12, exercises:0, params:0, faults:0,
      inside:["الموتور والإنكودر والتلات لوبات", "التوصيل والأوضاع والجير الإلكتروني", "التيونينج والهومينج والإنذارات"],
      tags:"servo course كورس السيرفو سيرفو موتور درايف servo motor servo drive شرح نظري theory closed loop لوب مقفول stepper ستيبر pmsm encoder إنكودر انكودر incremental absolute 17-bit brake فرامل regen مقاومة فرملة u v w sto cn1 cn2 pulse direction نبضات position speed torque electronic gear جير إلكتروني tuning تيونينج gain جين inertia autotune homing هومينج limit switch software limit ethercat profinet modbus alarms إنذارات overload position deviation overvoltage overspeed" },
    { id:"servo", path:"servo-simulator/index.html", group:"servo", brand:"Delta", brandKey:"delta",
      name:"ASDA-B2 Servo", kind:"سيرفو", disp:"00000", dispClass:"red",
      line:"سيرفو Delta: سرعة وموضع وضبط الجين.",
      guided:6, exercises:12, params:100, faults:12,
      inside:["توصيل الدرايف والموتور والإنكودر", "وضع السرعة ووضع الموضع", "ضبط الجين وشكل الحركة", "الإنذارات وإزاي تحلّها"],
      tags:"delta asda b2 servo سيرفو plc pulse درايف وموتور سيرفو، أوضاع PT و PR و S و T، ونبضات من PLC.  درايف وموتور سيرفو ASDA-B2   أوضاع التحكم PT و PR و S و T   6 تمارين محلولة خطوة بخطوة ونبضات من PLC " },
    { id:"mrje", path:"mrje-servo/index.html", group:"servo", brand:"Mitsubishi", brandKey:"mitsubishi",
      name:"MELSERVO MR-JE", kind:"سيرفو", disp:"AL.52", dispClass:"red",
      line:"سيرفو Mitsubishi بأزرار MODE و UP و DOWN و SET.",
      guided:6, exercises:0, params:0, faults:0,
      inside:["توصيل الدرايف والموتور والإنكودر", "تشغيل من الكيباد زي الحقيقي", "وضع الموضع بالبلس وحساب الجير", "4 ماكينات بتتحرك وإنذارات تحلّها"],
      tags:"mitsubishi ميتسوبيشي melservo mr-je mr-j4 servo سيرفو pa05 pa06 pa07 cmx cdv gear جير" },
    { id:"sigma7", path:"sigma7-servo/index.html", group:"servo", brand:"Yaskawa", brandKey:"yaskawa",
      name:"Sigma-7 SGD7S", kind:"سيرفو", disp:"bb", dispClass:"red",
      line:"سيرفو Yaskawa المنتشر في المصانع، بالكيباد والـ Fn.",
      guided:6, exercises:0, params:0, faults:0,
      inside:["توصيل الدرايف والموتور والإنكودر", "تشغيل من الكيباد زي الحقيقي", "وضع الموضع بالبلس وحساب الجير", "4 ماكينات بتتحرك وإنذارات تحلّها"],
      tags:"yaskawa ياسكاوا sigma 7 sgd7s servo سيرفو pn20e pn210 fn002 jog gear جير" },
    { id:"kinetix300", path:"kinetix300-servo/index.html", group:"servo", brand:"Allen-Bradley", brandKey:"ab",
      name:"Kinetix 300", kind:"سيرفو", disp:"diS", dispClass:"red",
      line:"سيرفو Allen-Bradley بشاشته وزراره، وMotionView.",
      guided:6, exercises:0, params:0, faults:0,
      inside:["توصيل الدرايف والموتور والإنكودر", "تشغيل من الكيباد زي الحقيقي", "وضع الموضع بالبلس وحساب الجير", "4 ماكينات بتتحرك وإنذارات تحلّها"],
      tags:"allen bradley آلن برادلي kinetix 300 2097 servo سيرفو motionview indexing gear" },
    { id:"e5cc", path:"e5cc-lab/index.html", group:"temp", brand:"Omron", brandKey:"omron",
      name:"E5CC", kind:"كنترول حرارة", disp:"25 <span class=\"sv\">150</span>", dispClass:"red", html:true,
      line:"كنترولر حرارة Omron: توصيل الحساس وضبط الحرارة.",
      guided:6, exercises:10, params:76, faults:12,
      inside:["توصيل الثيرموكبل و PT100", "ضبط درجة الحرارة المطلوبة", "PID والـ Auto-tuning", "الإنذارات والخرج"],
      tags:"omron e5cc temperature pid حرارة كنترولر حرارة على فرن، ON/OFF و PID و Autotuning وإنذارات.  كنترولر حرارة متوصل على فرن   ON/OFF و PID و Autotuning   إنذارات الحرارة وأخطاء الحساس " }
  ];
  var GROUPS = [
    { key:"basics", title:"أساسيات الكهربا", sub:"للمبتدئين خالص · قبل الكلاسيك", land:"courses/basics.html" },
    { id:"clm223", path:"clm223-lab/index.html", group:"temp", brand:"Endress+Hauser", brandKey:"eh",
      name:"Liquisys M", kind:"قياس Conductivity", disp:"1.238 <span class=\"sv\">mS</span>", dispClass:"lcd", html:true,
      line:"محوّل قياس توصيلية المياه من Endress+Hauser، بدرس كامل ومحاكي على برج تبريد.",
      guided:0, exercises:9, params:23, faults:4,
      inside:["درس: الـ Conductivity وثابت الخلية وتعويض الحرارة", "معايرة بمحلول 1.413 mS/cm", "ريليه الـ Blowdown والخرج 4-20mA", "أعطال الحساس والإنذارات"],
      tags:"endress hauser liquisys m clm223 clm253 conductivity توصيلية tds برج تبريد blowdown معايرة cell constant ATC" },
    { key:"classic", title:"كلاسيك كنترول", sub:"مفاتيح · بوش بوتن · كونتاكتورات · موتور", land:"courses/classic.html" },
    { key:"drawings", title:"قراية الرسومات الكهربية", sub:"رموز IEC و NEMA · كروس ريفرنس · Single line · ترمنالات", land:"courses/drawings.html" },
    { key:"instr", title:"إنسترومنتيشن", sub:"إنكودر · حساسات حرارة · لود سيل · ⁦4⁠–⁠20mA⁩", land:"courses/instrumentation.html" },
    { key:"plc", title:"PLC", sub:"Ladder · تايمرات · عدادات · أنالوج · مشاريع", land:"courses/plc.html" },
    { key:"drives", title:"الانفرترات", sub:"Allen-Bradley · ABB · Siemens · Schneider · Mitsubishi · Yaskawa · Delta · LS · INVT · Danfoss · Fuji", land:"courses/inverters.html" },
    { key:"servo", title:"سيرفو", sub:"درايفات وموتورات سيرفو", land:"courses/servo.html" },
    { key:"iiot", title:"IIoT والشبكات الصناعية", sub:"Modbus · PROFIBUS · PROFINET · CAN · OPC UA · MQTT · تشخيص الأعطال", land:"courses/iiot.html" },
    { key:"scada", title:"SCADA و HMI", sub:"WinCC Unified · ISA-101 · الإنذارات · الترندات · الوصفات · الصلاحيات", land:"courses/scada.html" },
    { key:"panel", title:"تصميم اللوحات الكهربية", sub:"الأحمال · القواطع · الكابلات · البارات · الانتقائية · MCC", land:"courses/panel.html" },
    { key:"maint", title:"صيانة المحركات والمحولات", sub:"الميجر و PI · الملفات · المحامل · الاهتزاز والمحاذاة · TTR · زيت المحول و DGA", land:"courses/maint.html" },
    { key:"srvm", title:"صيانة محركات السيرفو", sub:"الملفات و Back-EMF · الإنكودر · الفرامل · الدرايف و IGBT · الإنذارات · Notch", land:"courses/srvm.html" },
    { key:"temp", title:"كنترول حرارة وقياس", sub:"Omron · Endress+Hauser" }
  ];
  /* محتوى كل كورس بالترتيب (عناوين الدروس) — بيظهر على كارت الكورس في الكتالوج وعلى الغلاف (assets/courses/covers/).
     لو غيّرت عنوان درس أو زوّدت درس: عدّله هنا وفي toc في assets/i18n-en.js */
  var TOC = {
    basics: { n:"13 درس", x:["أفوميتر تفاعلي", "امتحان وشهادة"],
      l:["يعني إيه كهربا؟", "الجهد والتيار", "الموصلات والعوازل", "التوالي والتوازي", "القدرة والطاقة", "أنواع الكهربا", "السلامة والعدّة", "الأفوميتر (AVO)", "قياس الأجهزة عمليًا", "المحوّل والباور سبلاي", "قانون أوم واختيار السلك والقاطع", "توصيل اللمبة والبريزة", "أعطال البيت الشائعة"] },
    safety: { n:"9 دروس", x:["محاكي بصور الأجهزة", "امتحان نهائي"],
      l:["يعني إيه سيفتي PLC؟", "عناصر الأمان والتوصيل بقناتين", "ريلاي الأمان RT9", "ريلاي الأمان Pilz PNOZ X3P", "Vital 1 والإشارة الديناميكية", "Pluto B20: الأطراف والشاشة", "الإشارات الديناميكية A و B و C", "البرمجة في Pluto Manager", "الأعطال وأكواد Er"] },
    classic: { n:"9 دروس", x:["89 تمرين موجّه", "24 تمرين عملي", "شهادة إتمام"],
      l:["عناصر التحكم البسيطة", "الريلاي المساعد والتثبيت الذاتي", "الكونتاكتور", "الحماية: الفيوز والقاطع والأوفرلود", "التايمرات: On-delay و Off-delay والدوري", "الموتور الإندكشن 3 فاز", "مفاتيح الضغط والمستوى والحساسات", "التتابع والـ Jog وعكس الحركة", "ستار/دلتا والفرملة والسوفت ستارتر"] },
    instr: { n:"10 دروس", x:["امتحان نهائي وشهادة"],
      l:["يعني إيه إنسترومنتيشن؟", "إشارة ⁦4–20mA⁩ و ⁦0–10V⁩", "الحساسات الديجيتال", "الإنكودر الإنكريمنتال", "الإنكودر الأبسليوت والأعطال", "الثيرموكبل (Thermocouple)", "PT100 و RTD و NTC", "اللود سيل والميزان", "الضغط والمستوى والفلو", "المعايرة والتربل شوتنج"] },
    plc: { n:"10 دروس", x:["تمارين Siemens · Delta · AB", "امتحان وشهادة"],
      l:["يعني إيه PLC؟", "توصيل الـ PLC", "أول برنامج Ladder", "التثبيت الذاتي والـ Set/Reset", "التايمرات", "العدادات والمقارنة", "الذاكرة والـ Flags والـ Edge", "الإشارات الأنالوج في الـ PLC", "مشاريع عملية", "التربل شوتنج والامتحان النهائي"] },
    drw: { n:"7 دروس", x:["امتحان نهائي وشهادة"],
      l:["أنواع الرسومات الكهربية", "الرموز: IEC و ANSI/NEMA", "ترقيم الأجهزة والأطراف والكروس ريفرنس", "قراية دايرة التحكم", "الـ Single line ودايرة القوى", "رسمة اللوحة والـ Terminal strip", "تتبّع العطل من الرسمة + الامتحان"] },
    vfdc: { n:"12 درس", x:["16 محاكي انفرتر"],
      l:["ليه الانفرتر؟", "جوه الانفرتر", "الـ PWM والـ V/f", "توصيل الباور", "أطراف الكنترول", "الباراميترات الأساسية", "أوضاع التحكم والـ Autotune", "الفرملة والوقوف", "الـ PID والتطبيقات", "الأعطال الشائعة وحلّها", "السلامة والتركيب", "التشغيل لأول مرة + الامتحان"] },
    iiot: { n:"14 درس", x:["محاكي شبكات من 11 تمرين", "امتحان نهائي"],
      l:["ما هو IIoT والشبكات الصناعية؟", "أساسيات الإيثرنت: IP و Subnet و Switch", "RS-485 و Modbus RTU", "Modbus TCP", "PROFIBUS DP", "PROFINET", "CAN bus و CANopen و DeviceNet", "EtherNet/IP و AS-i و IO-Link و HART", "OPC UA", "MQTT", "البوابة: من الـ PLC إلى السحابة", "لوحة المتابعة والاتجاهات والإنذارات", "الصيانة التنبؤية", "تشخيص أعطال الشبكات + مشروع خط إنتاج + الامتحان"] },
    scada: { n:"12 درس", x:["محطة SCADA حيّة", "مصمّم شاشات HMI", "امتحان نهائي"],
      l:["ما SCADA وما HMI؟", "المتغيرات والاتصال بالـ PLC", "تصميم الشاشات عالية الأداء (ISA-101)", "الأزرار وحقول الإدخال والمؤشرات", "الحركة والديناميكية والوجوه الجاهزة", "الإنذارات وإدارتها (ISA-18.2)", "الترندات والأرشفة", "المستخدمون والصلاحيات وأمن المنظومة", "الوصفات والسكربتات", "معمارية SCADA: الخوادم والعملاء والتكرار", "التشغيل والاختبار وتشخيص الأعطال", "مشروع خط التعبئة + الامتحان"] },
    panel: { n:"12 درس", x:["حاسبة مصمّم اللوحات", "مصمّم اللوحات الكهربية", "امتحان نهائي"],
      l:["ما اللوحة الكهربية؟ الأنواع والمعايير", "حساب الأحمال وتيار التصميم", "اختيار القواطع", "اختيار مقطع الكابل", "هبوط الجهد وتيار القصر", "البارات النحاسية", "التنسيق والانتقائية بين الحمايات", "التأريض والحماية من الصعق", "تحسين معامل القدرة", "ترتيب اللوحة والحرارة داخلها", "لوحات المحركات MCC", "مشروع لوحة توزيع رئيسية + الامتحان"] },
    maint: { n:"12 درس", x:["ورشة صيانة المحركات", "محطة صيانة المحولات", "امتحان نهائي"],
      l:["أنواع الصيانة والسلامة وأدوات القياس", "المحرك الحثي: البناء ولوحة البيانات والأطراف", "اختبار مقاومة العزل: الميجر و PI و DAR", "اختبار الملفات: المقاومة والاتزان والقصر", "المحامل والتزييت", "الاهتزاز والمحاذاة", "الحرارة والتيار وعدم اتزان الجهد", "تشخيص أعطال المحرك خطوة بخطوة", "المحول: البناء والملحقات والتفتيش", "اختبارات المحول الكهربية", "زيت المحول: الجهد الانهياري وتحليل الغازات", "خطة صيانة لمصنع + الامتحان"] },
    srvm: { n:"13 درس", x:["منضدة صيانة محرك السيرفو", "محطة صيانة درايف السيرفو", "امتحان نهائي"],
      l:["السلامة في صيانة أنظمة السيرفو", "محرك السيرفو من الداخل ولوحة بياناته", "اختبار ملفات محرك السيرفو", "أنواع الإنكودر كلها", "فحص الإنكودر وأعطاله", "استبدال الإنكودر وضبط الإزاحة", "فرامل محرك السيرفو", "المحامل والسدادات والمغانط", "الكابلات والتأريض والتشويش", "صيانة الدرايف: الدائرة ومكوّناتها", "الإنذارات وتشخيصها", "الضبط بعد الإصلاح Tuning", "صيانة محور CNC + الامتحان"] },
    srv: { n:"12 درس", x:["4 محاكيات سيرفو"],
      l:["يعني إيه سيرفو؟", "جوه السيرفو موتور", "الإنكودر: عين السيرفو", "الدرايف من جوه", "توصيل السيرفو", "أوضاع التشغيل", "الجير الإلكتروني", "التيونينج وضبط الجين", "الهومينج والحدود", "التحكم من الـ PLC", "الأعطال الشائعة", "التشغيل لأول مرة + الامتحان"] }
  };
  var BRANDS = [
    { key:"all", label:"الكل" }, { key:"beginner", label:"للمبتدئين" }, { key:"basics", label:"كلاسيك كنترول" }, { key:"drawings", label:"رسومات كهربية" }, { key:"instr", label:"إنسترومنتيشن" }, { key:"plc", label:"PLC" }, { key:"vfdc", label:"شرح الانفرتر" }, { key:"srvc", label:"شرح السيرفو" }, { key:"ab", label:"Allen-Bradley" }, { key:"siemens", label:"Siemens" },
    { key:"schneider", label:"Schneider" }, { key:"delta", label:"Delta" }, { key:"danfoss", label:"Danfoss" },
    { key:"omron", label:"Omron" }, { key:"eh", label:"Endress+Hauser" }, { key:"abb", label:"ABB" }, { key:"mitsubishi", label:"Mitsubishi" }, { key:"yaskawa", label:"Yaskawa" }, { key:"ls", label:"LS" }, { key:"invt", label:"INVT" }, { key:"fuji", label:"Fuji" }, { key:"multi", label:"مقارنة" }
  ];
  /* ---------- English (/en/ pages): strings from assets/i18n-en.js, links via assets/i18n.js ---------- */
  var I18N = window.LE_I18N || {}, EN = I18N.isEn && I18N.en ? I18N.en : null;
  var L = function(p){ return I18N.href ? I18N.href(p) : p; }; // a link for this page's language
  LABS.forEach(function(l){ l.course = l.brand === "كورس"; l.ar = !!EN && !(I18N.hasEn && I18N.hasEn(l.path)); });
  if (EN){
    LABS.forEach(function(l){
      var t = EN.labs[l.id] || {};
      if (l.course) l.brand = "Course"; else if (l.brandKey === "multi") l.brand = "Compare";
      ["name", "kind", "line", "disp"].forEach(function(k){ if (t[k]) l[k] = t[k]; });
      l.inside = t.inside || (l.group === "drives" ? EN.driveInside : l.group === "servo" ? EN.servoInside : l.inside);
      l.tags = l.tags + " " + (t.tags || "") + " " + l.inside.join(" ");
      l.rtlName = false;
    });
    GROUPS.forEach(function(g){ var t = EN.groups[g.key]; if (t){ g.title = t.title; g.sub = t.sub; } });
    BRANDS.forEach(function(b){ if (EN.brands[b.key]) b.label = EN.brands[b.key]; });
  }
  LABS.forEach(function(l){ l.href = L(l.path); });
  GROUPS.forEach(function(g){ if (g.land) g.land = L(g.land); });
  window.LABS = LABS; window.LAB_GROUPS = GROUPS;

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
    function label(){ b.setAttribute("aria-label", isDark() ? (EN ? EN.themeLight : "الوضع الفاتح") : (EN ? EN.themeDark : "الوضع الغامق")); b.title = b.getAttribute("aria-label"); }
    label();
    b.addEventListener("click", function(){
      var next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next); store("site-theme", next); label();
    });
  });

  /* ---------- mobile nav ---------- */
  var menuBtn = document.querySelector(".menu-btn"), nav = document.getElementById("site-nav");
  if (menuBtn && nav){
    function setOpen(o){ nav.classList.toggle("open", o); menuBtn.setAttribute("aria-expanded", o ? "true" : "false"); menuBtn.setAttribute("aria-label", o ? (EN ? EN.menuClose : "اقفل القايمة") : (EN ? EN.menuOpen : "افتح القايمة")); }
    menuBtn.addEventListener("click", function(){ setOpen(!nav.classList.contains("open")); });
    nav.addEventListener("click", function(e){ if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape" && nav.classList.contains("open")){ setOpen(false); menuBtn.focus(); } });
    document.addEventListener("click", function(e){ if (nav.classList.contains("open") && !e.target.closest(".site-header")) setOpen(false); });
  }

  /* ---------- أسعار الكورسات (من «الأسعار» في لوحة الإدارة، /api/prices) ----------
     كارت كل كورس في الكتالوج وصفحة كل كورس في courses/ بتظهر السعر لو متحدد، وزرار «اشتري الكورس».
     اللي اشترى الكورس بيشوف «اشتريته ✓». */
  var PRODUCT_OF = { basics:"basics", classic:"classic", safety:"safety", instr:"instr", plc:"plc", drw:"drw", vfdc:"vfd", srv:"srv", iiot:"iiot", scada:"scada", panel:"panel", maint:"maint", srvm:"srvm" };
  var PR = null, ME, priceHooks = [];
  function curName(){ return EN ? EN.currency : ((window.SITE || {}).pay || {}).currency || "جنيه"; }
  function fmtN(n){ return String(Math.round(n * 100) / 100); }
  // Arabic: EGP. English: USD first (buyers outside Egypt), EGP second.
  function priceHtml(c){
    if (EN && c.usd) return "<b>$" + fmtN(c.usd) + "</b>" + (c.usd_was ? " <s>$" + fmtN(c.usd_was) + "</s>" : "") + ' <small class="p-alt">· ' + esc(curName()) + " " + fmtN(c.price) + " " + esc(EN.egpNote) + "</small>";
    if (EN) return "<b>" + esc(curName()) + " " + fmtN(c.price) + "</b>" + (c.was ? " <s>" + esc(curName()) + " " + fmtN(c.was) + "</s>" : "");
    return "<b><bdi>" + fmtN(c.price) + "</bdi> " + esc(curName()) + "</b>" + (c.was ? ' <s><bdi>' + fmtN(c.was) + "</bdi> " + esc(curName()) + "</s>" : "");
  }
  function owns(id){ return !!(ME && ME.courses && ME.courses.indexOf(id) > -1); }
  // «اشتريته ✓» → «معاك لحد <date> ✓» when /api/auth/me says until when (a course opens for one year)
  function ownText(id){
    var u = ME && ME.course_until && ME.course_until[id];
    if (!u) return EN ? EN.own : "اشتريته ✓";
    var d; try { d = new Date(u).toLocaleDateString(EN ? "en-GB" : "ar-EG-u-nu-latn", { year: "numeric", month: "short", day: "numeric" }); } catch (e){ d = new Date(u).toISOString().slice(0, 10); }
    return EN ? EN.ownUntil(d) : "معاك لحد " + d + " ✓";
  }
  function proNow(){ return !!(ME && ME.plan === "pro" && ME.pro_until > Date.now()); }
  // {kind:"own"|"pro"|"price", c} or null when there's nothing to show
  function priceState(id){
    if (!id) return null;
    if (owns(id)) return { kind: "own" };
    var c = PR && PR.courses && PR.courses[id];
    if (proNow() && PR && PR.paywall) return { kind: "pro" };
    return c && c.price ? { kind: "price", c: c } : null;
  }
  function fillLanding(){
    document.querySelectorAll("[data-price]").forEach(function(el){
      var id = el.getAttribute("data-price"), st = priceState(id);
      if (!st){ el.hidden = true; return; }
      el.innerHTML = st.kind === "own" ? '<p class="lp-own">' + esc(ownText(id)) + "</p>" : st.kind === "pro" ? '<p class="lp-own">' + (EN ? EN.pro : "معاك في الاشتراك ✓") + "</p>"
        : '<p class="lp-price">' + priceHtml(st.c) + '</p><a class="btn btn-ghost" href="' + (EN ? "/en" : "") + "/subscribe.html?course=" + encodeURIComponent(id) + '">' + (EN ? EN.buyArrow : "اشتري الكورس ←") + "</a>";
      el.hidden = false;
    });
  }
  function pricesReady(){ fillLanding(); priceHooks.forEach(function(f){ f(); }); }
  var meWait = true;
  function gotMe(u){ if (!meWait && ME === u) return; meWait = false; ME = u; if (PR) pricesReady(); }
  var needPrices = document.querySelector("[data-price],[data-catalog]");
  if (needPrices && window.fetch && /^https?:$/.test(location.protocol)){
    fetch("/api/prices").then(function(r){ return r.ok ? r.json() : null; }).then(function(r){
      if (!r || !r.ok) return;
      PR = r; if (!meWait) pricesReady();
    }).catch(function(){});
  }

  /* ---------- account link (membership) ---------- */
  if (nav){
    var authA = document.createElement("a");
    var LOGIN = EN ? "/en/login.html" : "/login.html", ACCOUNT = EN ? "/en/account.html" : "/account.html", LOGIN_T = EN ? EN.login : "دخول";
    authA.className = "nav-auth"; authA.href = LOGIN; authA.textContent = LOGIN_T;
    if (/\/(login|account)\.html$/.test(location.pathname)) authA.setAttribute("aria-current", "page");
    nav.appendChild(authA);
    // «لوحة الإدارة» next to the account link, only when /api/auth/me says this account is an admin
    var admA = document.createElement("a");
    admA.className = "nav-admin"; admA.href = "/admin.html"; admA.textContent = EN ? EN.admin : "لوحة الإدارة"; admA.hidden = true;
    if (/\/admin\.html$/.test(location.pathname)) admA.setAttribute("aria-current", "page");
    nav.insertBefore(admA, authA);
    var setUser = function(u){ root.classList.toggle("is-member", !!(u && u.name)); admA.hidden = !(u && u.admin); if (u && u.name){ authA.href = ACCOUNT; authA.textContent = u.name.split(" ")[0]; } else { authA.href = LOGIN; authA.textContent = LOGIN_T; } };
    try{ setUser(JSON.parse(sessionStorage.getItem("le-user") || "null")); }catch(e){}
    if (window.fetch && /^https?:$/.test(location.protocol)){
      fetch("/api/auth/me", { credentials: "same-origin" }).then(function(r){ return r.ok ? r.json() : null; }).then(function(r){
        if (!r || !r.ok){ gotMe(null); return; }
        setUser(r.user); gotMe(r.user);
        if (r.ended && !document.getElementById("out-note")) try{ sessionStorage.setItem("le-ended", "1"); }catch(e){} // this device was signed out (login.html says so)
        try{ if (r.user) sessionStorage.setItem("le-user", JSON.stringify(r.user)); else sessionStorage.removeItem("le-user"); }catch(e){}
        // "online now" in the admin list: ping while the page is open and visible
        if (r.user) setInterval(function(){ if (document.visibilityState === "visible") fetch("/api/auth/me", { credentials: "same-origin" }).catch(function(){}); }, 120000);
      }, function(){ gotMe(null); });
    } else gotMe(null);
  } else gotMe(null);

  /* ---------- إعلان فوق الموقع (من لوحة الإدارة، /api/banner) ---------- */
  // الزائر لو قفله ميظهرش تاني لنفس الكلام؛ لو الإدارة غيّرت النص يظهر من جديد.
  if (window.fetch && /^https?:$/.test(location.protocol) && document.body){
    var bannerKey = function(t){ var h = 5381; for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return "b" + (h >>> 0).toString(36); };
    fetch("/api/banner").then(function(r){ return r.ok ? r.json() : null; }).then(function(r){
      var b = r && r.banner;
      if (!b || !b.text) return;
      var key = bannerKey(b.text + "|" + (b.link || ""));
      if (store("le-banner-x") === key) return;
      var link = b.link && /^(?:\/(?!\/)|https:\/\/)/.test(b.link) ? b.link : "";
      var bar = document.createElement("div");
      bar.className = "site-banner"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", EN ? EN.banner : "إعلان");
      bar.innerHTML = '<div class="wrap sb-in"><p class="sb-text" dir="auto">' + (link ? '<a href="' + esc(link) + '"' + (/^https:/.test(link) ? ' target="_blank" rel="noopener"' : "") + ">" + esc(b.text) + (EN ? " →" : " ←") + "</a>" : esc(b.text)) + "</p>" +
        '<button type="button" class="sb-x" aria-label="' + (EN ? EN.bannerClose : "اقفل الإعلان") + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
      bar.querySelector(".sb-x").addEventListener("click", function(){ store("le-banner-x", key); bar.remove(); });
      var skip = document.querySelector(".skip");
      if (skip && skip.parentNode === document.body) skip.insertAdjacentElement("afterend", bar); else document.body.insertBefore(bar, document.body.firstChild);
    }).catch(function(){});
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
    whatsapp: wa ? "https://wa.me/" + wa + "?text=" + encodeURIComponent(EN ? EN.waHello(name) : "السلام عليكم، جاي من موقع " + name) : "",
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

  // الكتالوج بيعرض الكورسات بس (brand "كورس")؛ المحاكيات بتتفتح من جوه كورساتها (صفحة الكورس وصفحة الهبوط)
  var COURSES = [];
  GROUPS.forEach(function(g){ LABS.forEach(function(l){ if (l.course && l.group === g.key){ l.land = g.land || ""; COURSES.push(l); } }); });
  function goText(l){ return EN ? EN.goCourse + (l.ar ? AR_BADGE : "") : "ابدأ الكورس ←"; }
  var AR_BADGE = EN ? '<span class="ar-badge" title="' + esc(EN.arBadgeTitle) + '">' + esc(EN.arBadge) + "</span>" : "";
  // غلاف كل كورس زي البروشور: الاسم وكل الدروس بالترتيب (assets/courses/covers/<id>-ar|en.webp، 960×1200)
  function tocOf(l){ return (EN && EN.toc && EN.toc[l.id]) || TOC[l.id] || null; }
  // الغلاف: فيديو قصير للتمرين نفسه وهو شغّال في الخلفية، والكلام فوقه HTML حقيقي (عربي/إنجليزي بنفس الفيديو)
  var CV = {
    basics:{ ac:"#f5b83d", ar:"أساسيات الكهربا", en:"Electrical Basics" },
    classic:{ ac:"#4fd17f", ar:"الكلاسيك كنترول", en:"Classic Control" },
    safety:{ ac:"#ffd23a", ar:"السيفتي PLC", en:"Safety PLC" },
    instr:{ ac:"#36c9e0", ar:"الإنسترومنتيشن", en:"Instrumentation" },
    plc:{ ac:"#a48bff", ar:"الـ PLC", en:"PLC Programming" },
    drw:{ ac:"#5aa2ff", ar:"قراية الرسومات الكهربية", en:"Reading Electrical Drawings" },
    vfdc:{ ac:"#ff8a4c", ar:"الانفرتر VFD", en:"VFD (Inverter)" },
    srv:{ ac:"#ff5c7a", ar:"السيرفو موتور والدرايف", en:"Servo Motor & Drive" },
    iiot:{ ac:"#4cc0cf", ar:"IIoT والشبكات الصناعية", en:"IIoT & Industrial Networks" },
    scada:{ ac:"#e879d4", ar:"SCADA و HMI", en:"SCADA & HMI" },
    panel:{ ac:"#e0955c", ar:"تصميم اللوحات الكهربية", en:"Electrical Panel Design" },
    maint:{ ac:"#b4d65a", ar:"صيانة المحركات والمحولات", en:"Motor & Transformer Maintenance" },
    srvm:{ ac:"#8b8fff", ar:"صيانة محركات السيرفو", en:"Servo Motor & Drive Maintenance" }
  };
  var CVV = "p16";
  function coverHtml(l, toc){
    var c = CV[l.id], src = "/assets/courses/covers/" + l.id;
    if (!c || !toc) return '<div class="cover"><img src="' + src + (EN ? "-en" : "-ar") + '.webp?v=b3" width="960" height="1200" alt="" decoding="async"></div><h4 class="sr-only">' + esc(l.name) + "</h4>";
    var pad = function(i){ return (i < 9 ? "0" : "") + (i + 1); };
    return '<div class="cover vc" style="--ac:' + c.ac + '">' +
      '<div class="vc-body">' +
        '<p class="vc-kick"><i aria-hidden="true"></i>' + (EN ? "COURSE · " : "كورس · ") + esc(toc.n) + "</p>" +
        '<h4 class="vc-title"><span class="sr-only">' + esc(l.name) + '</span><span aria-hidden="true">' + esc(EN ? c.en : c.ar) + "</span></h4>" +
        (toc.x && toc.x.length ? '<p class="vc-chips">' + toc.x.map(function(x){ return "<span>" + esc(x) + "</span>"; }).join("") + "</p>" : "") +
        '<p class="vc-h">' + (EN ? EN.contents : "محتوى الكورس بالترتيب") + "</p>" +
        // الدروس على جنب، والتمرين شغّال جنبها بطول القايمة كلها
        '<div class="vc-cols">' +
          '<ol class="vc-list">' + toc.l.map(function(x, i){ return '<li><b aria-hidden="true">' + pad(i) + "</b><span>" + esc(x) + "</span></li>"; }).join("") + "</ol>" +
          '<div class="vc-side"><div class="vc-frame">' +
            // كورس لسه من غير فيديو للغلاف (still): صورة ثابتة مكان الفيديو، وvcWire بيتجاهلها لأنها مش <video>
            (c.still ? '<img class="vc-vid" src="' + c.still + '" alt="" loading="lazy" decoding="async" aria-hidden="true" style="object-position:24% 0;transform:scale(1.2);transform-origin:24% 0">' :
            '<video class="vc-vid" muted loop playsinline preload="none" disablepictureinpicture aria-hidden="true" tabindex="-1" poster="' + src + "-poster.webp?v=" + CVV + '">' +
              '<source src="' + src + "-loop.webm?v=" + CVV + '" type="video/webm"><source src="' + src + "-loop.mp4?v=" + CVV + '" type="video/mp4"></video>') +
          '</div><p class="vc-live"><i aria-hidden="true"></i>' + (EN ? "Exercise from the course" : "تمرين من جوّه الكورس") + "</p></div>" +
        "</div>" +
      "</div>" +
      '<p class="vc-foot"><span>' + (EN ? "1 free lesson, free account" : "درس مجاني بحساب مجاني") + '</span><span class="vc-wm" dir="ltr" aria-hidden="true">Learn<b>Electricals</b></span></p>' +
      "</div>";
  }
  // الفيديو بيشتغل بس وهو قدّام العين، ويقف لما يخرج من الشاشة. ومع تقليل الحركة أو توفير البيانات بيفضل صورة ثابتة
  var vcIO = null;
  function vcStill(){
    try { if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return true; } catch(e) {}
    var cn = navigator.connection; return !!(cn && cn.saveData);
  }
  function vcPlay(v){ var pr; try { pr = v.play(); } catch(e) {} if (pr && pr.catch) pr.catch(function(){}); }
  function vcWire(root){
    var vids = root.querySelectorAll("video.vc-vid"); if (!vids.length || vcStill()) return;
    if (!("IntersectionObserver" in window)){ return; }
    if (!vcIO) vcIO = new IntersectionObserver(function(es){
      es.forEach(function(e){ var v = e.target; if (e.isIntersecting){ if (v.preload !== "auto") v.preload = "auto"; vcPlay(v); } else if (!v.paused) v.pause(); });
    }, { rootMargin: "120px 0px", threshold: 0.15 });
    vids.forEach(function(v){ vcIO.observe(v); });
  }
  function card(l){
    var toc = tocOf(l);
    var cover = coverHtml(l, toc);
    var st = priceState(PRODUCT_OF[l.id]);
    var pl = !st ? "" : '<p class="price-line' + (st.kind === "price" ? "" : " own") + '">' + (st.kind === "own" ? esc(ownText(PRODUCT_OF[l.id])) : st.kind === "pro" ? (EN ? EN.pro : "معاك في الاشتراك ✓") : priceHtml(st.c)) + "</p>";
    var buy = st && st.kind === "price" ? '<a class="buy" href="subscribe.html?course=' + PRODUCT_OF[l.id] + '">' + (EN ? EN.buy : "اشتري الكورس") + '<span class="sr-only"> ' + esc(l.name) + "</span></a>" : "";
    // تحت الغلاف: السعر والزراير بس — الاسم والدروس مكتوبين على الغلاف نفسه كنص حقيقي
    if (!detail){
      return '<a class="card course" href="' + esc(l.href) + '"' + (l.ar ? ' hreflang="ar"' : "") + ' data-id="' + l.id + '">' + cover + pl + '<span class="go">' + goText(l) + '</span></a>';
    }
    var land = l.land ? '<a class="more" href="' + esc(l.land) + '">' + (EN ? EN.details : "تفاصيل الكورس ←") + '<span class="sr-only"> ' + esc(l.name) + "</span></a>" : "";
    return '<article class="card detail course" data-id="' + l.id + '">' + cover + pl +
      '<div class="go-row"><a class="go" href="' + esc(l.href) + '"' + (l.ar ? ' hreflang="ar"' : "") + ">" + goText(l) + '<span class="sr-only"> ' + esc(l.name) + "</span></a>" + buy + land + "</div></article>";
  }
  // لو سطر طويل على عرض الكارت، نصغّره شوية بدل ما يتقص
  function vcFit(root){
    root.querySelectorAll(".vc-title > span[aria-hidden]").forEach(function(el){
      el.style.fontSize = ""; var i = 0;
      while (el.scrollWidth > el.clientWidth + 1 && i++ < 8){ el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * 0.94) + "px"; }
    });
  }
  function match(l){
    if (state.brand !== "all" && l.brandKey !== state.brand) return false;
    if (!state.q) return true;
    var toc = tocOf(l);
    var hay = (l.name + " " + l.brand + " " + l.line + " " + l.kind + " " + l.tags + " " + l.inside.join(" ") + (toc ? " " + toc.l.join(" ") : "")).toLowerCase();
    return state.q.toLowerCase().split(/\s+/).every(function(w){ return hay.indexOf(w) > -1; });
  }
  // بنك أسئلة الإنترفيو مش كورس ومش في LABS، بس لو حد دوّر عليه بنظهرله كارت يوديه هناك
  var IV_Q = /interview|question|انترفيو|إنترفيو|مقابل|أسئل|اسئل|سؤال/i;
  var IV_CARD = EN ? EN.ivCard : '<div class="iv-band iv-hit"><div><span class="eyebrow">بنك الأسئلة</span><h2>أسئلة الإنترفيو</h2><p>أسئلة إنترفيو الكهربا والصيانة والأوتوميشن بإجابات مختصرة، مفتوحة للكل.</p></div><a class="btn btn-ghost" href="interview/index.html">ذاكر الأسئلة ←</a></div>';
  function render(){
    var iv = !!state.q && IV_Q.test(state.q);
    var items = COURSES.filter(match), n = items.length;
    cat.innerHTML = (iv ? IV_CARD : "") + (n ? '<div class="grid course-grid">' + items.map(card).join("") + "</div>" : "");
    vcWire(cat); vcFit(cat);
    if (emptyEl) emptyEl.classList.toggle("show", n === 0 && !iv);
    if (countEl) countEl.textContent = n === COURSES.length ? (EN ? EN.all(n) : "الكل (" + n + ")") : EN ? EN.shown(n, COURSES.length) : "ظاهر " + n + " من " + COURSES.length;
  }
  BRANDS = BRANDS.filter(function(b){ return b.key === "all" || COURSES.some(function(l){ return l.brandKey === b.key; }); });
  if (chipsEl){
    chipsEl.innerHTML = BRANDS.map(function(b){ return '<button type="button" class="chip" data-brand="' + b.key + '" aria-pressed="' + (b.key === "all") + '">' + esc(b.label) + "</button>"; }).join("");
    chipsEl.addEventListener("click", function(e){
      var b = e.target.closest(".chip"); if (!b) return;
      state.brand = b.getAttribute("data-brand");
      chipsEl.querySelectorAll(".chip").forEach(function(c){ c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
      render();
    });
  }
  priceHooks.push(render);
  if (searchEl) searchEl.addEventListener("input", function(){ state.q = searchEl.value.trim(); render(); });
  var reset = document.querySelector("[data-reset]");
  if (reset) reset.addEventListener("click", function(){ state = { brand:"all", q:"" }; if (searchEl) searchEl.value = ""; if (chipsEl) chipsEl.querySelectorAll(".chip").forEach(function(c){ c.setAttribute("aria-pressed", c.getAttribute("data-brand") === "all" ? "true" : "false"); }); render(); });
  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ vcFit(cat); });
  var vcT; window.addEventListener("resize", function(){ clearTimeout(vcT); vcT = setTimeout(function(){ vcFit(cat); }, 150); });
})();
