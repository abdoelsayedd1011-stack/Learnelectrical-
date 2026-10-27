/* الشرا: صفحة subscribe.html (كل كورس بسعره، بيفتح سنة كاملة) + «كورساتي» و«طلبات الاشتراك» في account.html.
   الأسعار وأرقام الدفع من «الأسعار» في لوحة الإدارة (/api/prices): سعر بالجنيه لمصر، وسعر بالدولار ولينك دفع بالكارت
   (اختياري) لكل كورس للي برّه مصر. لو مفيش لينك، اللي برّه مصر بيكلّمنا على واتساب برسالة جاهزة فيها الكورس والسعر.
   «كل الكورسات» (شهري / سنوي) اتشال من الصفحة؛ اللي معاه Pro قديم لسه شغال.
   English pages (/en/): strings from assets/i18n-en.js; USD first, EGP second, and «from abroad» is the default tab. */
(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  var S = window.SITE || {}, P = S.pay || {};
  var I18N = window.LE_I18N || {}, EN = I18N.isEn && I18N.en ? I18N.en : null;
  var OFFLINE = EN ? EN.payOffline : "مقدرناش نوصل للسيرفر. جرّب تاني بعد شوية.";
  var M = function(r, fb){ return I18N.msg ? I18N.msg(r, fb) : (r && r.message) || fb; };
  var L = function(p){ return I18N.href ? I18N.href(p) : p; };
  var iso = function(t){ return EN ? String(t) : "⁦" + t + "⁩"; };
  function esc(t){ return String(t == null ? "" : t).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function num(v){ var n = Number(v); return isFinite(n) && n > 0 ? n : 0; }
  function fmtNum(n){ return String(Math.round(n * 100) / 100); }
  function fmtDate(t){ try { return new Date(t).toLocaleDateString(EN ? "en-GB" : "ar-EG-u-nu-latn", { year: "numeric", month: "long", day: "numeric" }); } catch (e){ return new Date(t).toISOString().slice(0, 10); } }
  var str = function(v){ return String(v == null ? "" : v).trim(); };

  // الكورسات بنفس ترتيب الكتالوج. الـ id نفسه اللي في functions/_lib/products.js
  var COURSES = [
    { id: "basics", title: "أساسيات الكهربا", hub: "basics-lab/index.html", inc: "كل الدروس والامتحان والشهادة" },
    { id: "classic", title: "الكلاسيك كنترول", hub: "classic-control-lab/index.html", inc: "كل الدروس والتمارين والشهادة" },
    { id: "drw", title: "قراية الرسومات الكهربية", hub: "drawings-lab/index.html", inc: "كل الدروس والامتحان والشهادة" },
    { id: "instr", title: "الإنسترومنتيشن", hub: "instrumentation-lab/index.html", inc: "كل الدروس + محاكي Omron E5CC" },
    { id: "plc", title: "الـ PLC", hub: "plc-lab/index.html", inc: "كل الدروس + محاكيات Siemens و Delta و AB" },
    { id: "vfd", title: "الانفرتر VFD", hub: "vfd-course/index.html", inc: "كل الدروس + كل محاكيات الانفرترات" },
    { id: "srv", title: "السيرفو موتور والدرايف", hub: "servo-course/index.html", inc: "كل الدروس + 4 محاكيات سيرفو" }
  ];
  if (EN) COURSES.forEach(function(c){ c.title = EN.courses[c.id] || c.title; c.inc = EN.payInc[c.id] || c.inc; });
  COURSES.forEach(function(c){ c.href = EN ? L(c.hub) : c.hub; c.ar = !!EN && !/^\/en\//.test(c.href); });
  var BY_ID = {}; COURSES.forEach(function(c){ BY_ID[c.id] = c; });
  var ALIAS = { "safety-plc": "safety", drawings: "drw", servo: "srv", instrumentation: "instr", inverters: "vfd", vfdc: "vfd" };
  var AR_BADGE = EN ? '<span class="ar-badge" title="' + esc(EN.arBadgeTitle) + '">' + esc(EN.arBadge) + "</span>" : "";

  var CUR = EN ? EN.currency : str(P.currency) || "جنيه";
  var PLAN_NAME = EN ? EN.planName : { monthly: "شهري", yearly: "سنوي" };
  var METHOD_NAME = EN ? EN.methods : { instapay: "InstaPay", vodafone: "فودافون كاش", intl: "دفع من خارج مصر" };
  function money(n, cur){
    if (EN) return cur === "USD" ? "$" + fmtNum(n) : CUR + " " + fmtNum(n);
    return cur === "USD" ? iso(fmtNum(n)) + " دولار" : iso(fmtNum(n)) + " " + CUR;
  }
  function prodName(p){
    if (EN) return BY_ID[p] ? EN.course(BY_ID[p].title) : EN.allCourses(PLAN_NAME[p] || p);
    return BY_ID[p] ? "كورس " + BY_ID[p].title : "كل الكورسات " + (PLAN_NAME[p] || "");
  }

  function get(){ return fetch("/api/pay/request", { credentials: "same-origin", cache: "no-store" }).then(function(r){ return r.json(); }).catch(function(){ return { ok: false }; }); }
  function getPrices(){ return fetch("/api/prices").then(function(r){ return r.json(); }).catch(function(){ return { ok: false }; }); }

  /* ---------- قايمة الطلبات (subscribe + account) ---------- */
  function reqItem(r){
    var course = r.plan === "course";
    var tag = r.status === "approved" ? '<span class="req-tag ok">' + (EN ? EN.reqOk : "اتفعّل ✓") + "</span>" : r.status === "rejected" ? '<span class="req-tag no">' + (EN ? EN.reqNo : "اترفض") + "</span>" : '<span class="req-tag wait">' + (EN ? EN.reqWait : "بنراجعه") + "</span>";
    var until = r.pro_until ? fmtDate(r.pro_until) : "";
    var sub = r.status === "approved" ? (course ? (EN ? EN.reqCourseOk(until) : until ? "الكورس معاك لحد " + until + "." : "الكورس معاك سنة كاملة.") : r.pro_until ? (EN ? EN.reqProOk(until) : "كل الكورسات لحد " + until) : "")
      : r.status === "rejected" ? (EN ? EN.reqRejected : "مقدرناش نلاقي التحويل ده. كلّمنا لو في مشكلة.")
      : EN ? EN.reqSent(fmtDate(r.created_at), !!WA) : "اتبعت " + fmtDate(r.created_at) + (WA ? ". ابعت صورة التحويل على واتساب عشان نفعّله أسرع." : "");
    var how = METHOD_NAME[r.method] ? (r.method === "intl" ? METHOD_NAME.intl : EN ? EN.via(METHOD_NAME[r.method]) : "عن طريق " + (r.method === "instapay" ? iso("InstaPay") : METHOD_NAME[r.method])) : "";
    return '<li class="req"><div class="req-top"><b>' + esc(prodName(course ? r.product : r.plan)) + " · " + money(r.amount, r.currency) + "</b>" + tag + "</div>" +
      '<p class="req-sub">' + esc(how) + " · " + esc(sub) + "</p></li>";
  }
  function showReqs(box, list, reqs){
    if (!box || !reqs || !reqs.length){ if (box) box.hidden = true; return; }
    list.innerHTML = reqs.map(reqItem).join("");
    box.hidden = false;
  }
  var WA = str(S.whatsapp).replace(/[^\d]/g, "");

  /* ---------- account.html: «كورساتي» (كل كورس لحد إمتى) ---------- */
  if (!$("pay-form") && $("pay-reqs")){
    get().then(function(r){
      if (!r.ok || !r.signed) return;
      showReqs($("pay-reqs"), $("req-list"), r.requests);
      var mine = (r.owned || (r.courses || []).map(function(id){ return { course: id, active: true }; })).filter(function(x){ return BY_ID[x.course]; });
      if ($("my-courses") && mine.length){
        $("mc-list").innerHTML = mine.map(function(x){
          var c = BY_ID[x.course], when = x.until ? fmtDate(x.until) : "";
          var line = x.active ? (when ? (EN ? EN.until(when) : "لحد " + when) : (EN ? EN.yearAccess : "سنة كاملة")) : (EN ? EN.expired(when) : "خلص " + when);
          var btn = x.active
            ? '<a class="btn btn-ghost" href="' + esc(c.href) + '"' + (c.ar ? ' hreflang="ar"' : "") + ">" + (EN ? EN.open : "افتح ←") + (c.ar ? AR_BADGE : "") + "</a>"
            : '<a class="btn btn-ghost" href="subscribe.html?course=' + esc(c.id) + '">' + (EN ? EN.renewCourse : "جدّده ←") + "</a>";
          return '<li' + (x.active ? "" : ' class="mc-off"') + '><span class="mc-t"><b>' + esc(c.title) + "</b><small>" + esc(c.inc) + '</small><small class="mc-until">' + esc(line) + "</small></span>" + btn + "</li>";
        }).join("");
        $("my-courses").hidden = false;
      }
    });
    return;
  }
  if (!$("pay-form")) return;

  /* ---------- subscribe.html ---------- */
  var form = $("pay-form"), msg = form.querySelector(".auth-msg"), prodsEl = $("prods");
  var qs = new URLSearchParams(location.search), want = str(qs.get("course")).toLowerCase(); want = ALIAS[want] || want;
  var nextPath = str(qs.get("next")); if (!/^\/(?!\/)[^\s<>"']*$/.test(nextPath)) nextPath = "";
  var EG, PRICES = {}, region = "eg", sel = null, me = null, owned = [], egReady, intlReady;

  function cur(){ return region === "eg" ? "EGP" : "USD"; }
  function amount(){ var p = sel && PRICES[sel]; return !p ? 0 : region === "eg" ? p.price : p.usd; }
  function selectable(k){ var p = PRICES[k] || {}; return !!(region === "eg" ? p.price : p.usd) && owned.indexOf(k) < 0; }
  function choices(){ return COURSES.map(function(c){ return c.id; }).filter(selectable); }

  function radio(k, inner, disabled){
    return '<button type="button" class="plan prod" role="radio" data-k="' + k + '" aria-checked="' + (k === sel) + '"' +
      (disabled ? ' aria-disabled="true"' : "") + (k === sel ? "" : ' tabindex="-1"') + ">" + inner + "</button>";
  }
  // Price on a card: this tab's currency first. English pages also show the other currency (USD first, EGP second);
  // Arabic shows the EGP price under the dollar one in «من خارج مصر».
  function priceBlock(pr){
    var main = region === "eg" ? [pr.price, pr.was, "EGP"] : [pr.usd, pr.usd_was, "USD"];
    var alt = region === "eg" ? (EN && pr.usd ? money(pr.usd, "USD") : "") : (pr.price ? money(pr.price, "EGP") + (EN ? " " + EN.egpNote : " في مصر") : "");
    return '<span class="pl-price"><b>' + esc(money(main[0], main[2])) + "</b>" + (main[1] ? " <s>" + esc(money(main[1], main[2])) + "</s>" : "") + "</span>" +
      (alt ? '<span class="pl-alt">' + esc(alt) + "</span>" : "");
  }
  function render(){
    var list = choices();
    if (list.indexOf(sel) < 0) sel = list[0] || null;
    prodsEl.innerHTML = COURSES.map(function(c){
      var pr = PRICES[c.id] || {}, own = owned.indexOf(c.id) > -1, has = region === "eg" ? pr.price : pr.usd;
      var price = own ? '<span class="pl-own">' + (EN ? EN.own : "اشتريته ✓") + "</span>" : has ? priceBlock(pr) : '<span class="pl-soon">' + (EN ? EN.soon : "قريب") + "</span>";
      return radio(c.id, '<span class="pl-name">' + esc(c.title) + '</span><span class="pl-sub">' + esc(c.inc) + " · " + (EN ? EN.year : "سنة كاملة") + "</span>" + price, own || !has);
    }).join("");
    $("how-h").hidden = $("steps").hidden = !sel;
    update();
  }
  function method(){ if (region === "intl") return "intl"; var c = form.querySelector("input[name=method]:checked"); return c ? c.value : ""; }
  function what(){ return sel ? prodName(sel) : ""; }
  function update(){
    if (!sel) return;
    var pr = PRICES[sel] || {}, amt = money(amount(), cur());
    $("s1-amount").textContent = money(pr.price, "EGP");
    $("s1-eg").hidden = region !== "eg"; $("s1-intl").hidden = region !== "intl";
    // من برّه مصر: لينك الكارت بتاع الكورس ده، أو واتساب برسالة جاهزة فيها الكورس والسعر بالدولار
    var link = /^https:\/\/[^\s"<>]+$/i.test(str(pr.link)) ? str(pr.link) : "";
    $("s1-usd-p").innerHTML = EN ? (link || WA ? EN.s1Intl(esc(amt), link) : EN.s1IntlNoWa(esc(amt)))
      : link ? "ادفع <b>" + esc(amt) + "</b> بالكارت من الزرار اللي تحت. السعر بالدولار الأمريكي."
      : WA ? "ابعتلنا على واتساب ونبعتلك طريقة تدفع بيها <b>" + esc(amt) + "</b> (كارت أو تحويل)." : "الدفع من برّه مصر هيفتح قريب.";
    var il = $("intl-link"), iw = $("intl-wa");
    if (link){ il.href = link; il.hidden = false; } else { il.hidden = true; il.removeAttribute("href"); }
    if (!link && WA){
      var t = EN ? EN.waIntl(what(), amt, me && me.email) : "السلام عليكم، أنا برّه مصر وعايز أشتري " + what() + " (" + amt + ")." + (me ? "\nإيميل حسابي: " + me.email : "") + "\nأدفع إزاي؟";
      iw.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(t); iw.hidden = false;
    } else iw.hidden = true;
    $("pm-set").hidden = region !== "eg" || !(EG.instapay && EG.vodafone);
    $("sender-l").innerHTML = region === "eg"
      ? (EN ? EN.senderEg : "رقم الموبايل أو عنوان " + iso("InstaPay") + " اللي حوّلت منه <small>(اختياري)</small>")
      : (EN ? EN.senderIntl : "رقم العملية أو الإيميل اللي دفعت بيه <small>(اختياري)</small>");
    form.elements.sender.setAttribute("autocomplete", region === "eg" ? "tel" : "off");
    var wa = $("wa-shot");
    if (WA && me && (region === "eg" || link)){ // abroad without a card link: the WhatsApp button above already covers it
      var mtd = method() ? METHOD_NAME[method()] : "";
      var t2 = EN ? EN.waEg(what(), amt, mtd, me.email)
        : "السلام عليكم، حوّلت تمن " + what() + " (" + fmtNum(amount()) + " " + (region === "eg" ? CUR : "USD") + ")" + (mtd ? " عن طريق " + mtd : "") + ".\nإيميل حسابي: " + me.email + "\nدي صورة التحويل:";
      wa.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(t2); wa.hidden = false;
    } else wa.hidden = true;
  }
  function pick(k){ if (!k || !selectable(k)) return; sel = k; $("pay-ok").hidden = true; render(); var b = $("pick").querySelector('[data-k="' + k + '"]'); if (b) b.focus(); }
  $("pick").addEventListener("click", function(e){ var b = e.target.closest(".plan"); if (b) pick(b.getAttribute("data-k")); });
  $("pick").addEventListener("keydown", function(e){
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(e.key) < 0) return;
    var list = choices(); if (list.length < 2) return;
    e.preventDefault();
    var fwd = EN ? "ArrowRight" : "ArrowLeft"; // RTL: يسار = اللي بعده
    var i = list.indexOf(sel), d = e.key === "ArrowDown" || e.key === fwd ? 1 : -1;
    pick(list[(i + d + list.length) % list.length]);
  });
  form.addEventListener("change", update);

  function setupWays(){
    var VC = EN ? "Vodafone Cash" : "فودافون كاش";
    var ways = [["instapay", "InstaPay", EG.instapay], ["vodafone", VC, EG.vodafone]].filter(function(w){ return w[2]; });
    $("pay-ways").innerHTML = ways.map(function(w){
      return '<div class="pay-way"><span class="pw-l">' + (w[0] === "instapay" ? '<span class="ltr">InstaPay</span>' : esc(w[1])) + '</span><span class="pw-n ltr">' + esc(w[2]) + "</span>" +
        '<button class="btn btn-ghost pw-copy" type="button" data-copy="' + esc(w[2]) + '" aria-label="' + esc(EN ? EN.copyNum(w[1]) : "انسخ رقم " + w[1]) + '">' + (EN ? EN.copy : "انسخ") + "</button></div>";
    }).join("");
    $("pm-opts").innerHTML = ways.map(function(w, i){
      return '<label class="pm-opt"><input type="radio" name="method" value="' + w[0] + '"' + (i === 0 ? " checked" : "") + "><span>" + (w[0] === "instapay" ? '<span class="ltr">InstaPay</span>' : esc(w[1])) + "</span></label>";
    }).join("");
  }
  $("pay-ways").addEventListener("click", function(e){
    var b = e.target.closest("[data-copy]"); if (!b) return;
    var v = b.getAttribute("data-copy"), done = function(){ b.textContent = EN ? EN.copied : "اتنسخ ✓"; setTimeout(function(){ b.textContent = EN ? EN.copy : "انسخ"; }, 2200); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, function(){});
    else { var t = document.createElement("textarea"); t.value = v; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (x){} t.remove(); }
  });

  // التابات: من مصر (جنيه) / من خارج مصر (دولار). بتظهر لما الاتنين متاحين بس. الإنجليزي بيبدأ بـ«من خارج مصر».
  var tabs = $("sub-tabs");
  function setRegion(r){
    region = r;
    tabs.querySelectorAll("[role=tab]").forEach(function(t){ var on = t.getAttribute("data-region") === r; t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1; });
    $("pay-ok").hidden = true; render();
  }
  tabs.addEventListener("click", function(e){ var t = e.target.closest("[role=tab]"); if (t) setRegion(t.getAttribute("data-region")); });
  tabs.addEventListener("keydown", function(e){
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault(); setRegion(region === "eg" ? "intl" : "eg"); tabs.querySelector('[aria-selected="true"]').focus();
  });

  form.addEventListener("submit", function(e){
    e.preventDefault();
    if (!sel) return;
    var btn = form.querySelector("button[type=submit]");
    msg.hidden = true; btn.disabled = true;
    fetch("/api/pay/request", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" },
      body: JSON.stringify({ product: sel, amount: amount(), currency: cur(), method: method(), sender: form.elements.sender.value, note: form.elements.note.value }) })
      .then(function(r){ return r.json(); }).catch(function(){ return { ok: false, message: OFFLINE }; })
      .then(function(r){
        btn.disabled = false;
        if (!r.ok){ msg.textContent = M(r, OFFLINE); msg.hidden = false; return; }
        form.elements.sender.value = ""; form.elements.note.value = "";
        var ok = $("pay-ok");
        ok.textContent = EN ? EN.payOk(!!WA) : "وصلنا طلبك ✓ " + (WA ? "ابعت صورة التحويل على واتساب من الزرار اللي فوق عشان نفعّله أسرع." : "هنراجع التحويل ونفعّله.");
        ok.hidden = false;
        get().then(function(x){ if (x.ok && x.signed) showReqs($("pay-reqs"), $("req-list"), x.requests); });
      });
  });

  Promise.all([getPrices(), get()]).then(function(res){
    var pr = res[0] && res[0].ok ? res[0] : {}, r = res[1];
    WA = (str(pr.whatsapp) || str(S.whatsapp)).replace(/[^\d]/g, "");
    EG = { instapay: str(pr.instapay) || str(P.instapay), vodafone: str(pr.vodafone) || str(P.vodafoneCash) };
    COURSES.forEach(function(c){ var x = (pr.courses || {})[c.id] || {}; PRICES[c.id] = { price: num(x.price), was: num(x.was), usd: num(x.usd), usd_was: num(x.usd_was), link: str(x.link) }; });
    egReady = !!((EG.instapay || EG.vodafone) && COURSES.some(function(c){ return PRICES[c.id].price; }));
    // من برّه مصر: كورس بسعر بالدولار، ويا إما لينك دفع بالكارت يا إما واتساب نتفق عليه
    intlReady = COURSES.some(function(c){ return PRICES[c.id].usd && (PRICES[c.id].link || WA); });
    var paywall = (r && r.ok ? r.paywall : pr.paywall) === true;
    if (r && r.ok && r.signed){ me = r.user; owned = r.courses || []; }
    if (!egReady && !intlReady){
      $("sub-soon").hidden = false;
      if (r && r.ok && !paywall) $("soon-free").hidden = false;
      if (r && r.ok && !r.signed && !paywall){ $("soon-go").href = "login.html#signup"; $("soon-go").textContent = EN ? EN.makeAccount : "اعمل حساب ←"; }
      return;
    }
    region = EN ? (intlReady ? "intl" : "eg") : (egReady ? "eg" : "intl");
    if (egReady && intlReady) tabs.hidden = false;
    setupWays();
    if (BY_ID[want] && selectable(want)) sel = want;
    // جاي من درس مقفول (functions/_middleware.js بيبعته هنا بـ ?course=)
    if (BY_ID[want]){
      var need = $("sub-need"), c = BY_ID[want];
      if (owned.indexOf(want) > -1){ var go = esc(nextPath || c.href); need.innerHTML = EN ? EN.ownNow(esc(c.title), go) : "كورس " + esc(c.title) + " معاك ✓ " + '<a href="' + go + '">افتحه ←</a>'; need.hidden = false; }
      else if (nextPath){ need.textContent = EN ? EN.needCourse(c.title) : "الدرس اللي كنت رايحله في كورس " + c.title + ". اشتري الكورس عشان تفتحه."; need.hidden = false; }
    }
    $("sub-buy").hidden = false;
    setRegion(region);
    if (!r || !r.ok || !r.signed){
      $("s2-guest").hidden = false;
      $("s2-login").href = "login.html?next=" + encodeURIComponent(location.pathname + location.search);
      return;
    }
    form.hidden = false; update();
    if (!paywall) $("sub-open-note").hidden = false;
    if (me.pro){ var n = $("sub-pro-note"); n.textContent = EN ? EN.proNote(fmtDate(me.pro_until)) : "انت مشترك في كل الكورسات لحد " + fmtDate(me.pro_until) + "."; n.hidden = false; }
    showReqs($("pay-reqs"), $("req-list"), r.requests);
    if (BY_ID[want] && sel === want){ var b = prodsEl.querySelector('[data-k="' + want + '"]'); if (b && b.scrollIntoView) b.scrollIntoView({ block: "center" }); }
  });
})();
