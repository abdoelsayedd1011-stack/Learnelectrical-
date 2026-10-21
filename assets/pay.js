/* الشرا والاشتراك: صفحة subscribe.html (كل كورس بسعره + «كل الكورسات» شهري/سنوي، وطريقة التحويل وطلب «أنا حوّلت»)
   + «كورساتي» و«طلبات الاشتراك» في account.html.
   الأسعار وأرقام الدفع من «الأسعار» في لوحة الإدارة (/api/prices). لو فاضية هناك بناخدها من SITE.pay في site-config.js.
   لو مفيش أرقام دفع أو مفيش ولا سعر، الصفحة بتقول «الاشتراك هيفتح قريب». */
(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  var S = window.SITE || {}, P = S.pay || {};
  var OFFLINE = "مقدرناش نوصل للسيرفر. جرّب تاني بعد شوية.";
  var iso = function(t){ return "⁦" + t + "⁩"; };
  function esc(t){ return String(t == null ? "" : t).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function num(v){ var n = Number(v); return isFinite(n) && n > 0 ? n : 0; }
  function fmtNum(n){ return String(Math.round(n * 100) / 100); }
  function fmtDate(t){ try { return new Date(t).toLocaleDateString("ar-EG-u-nu-latn", { year: "numeric", month: "long", day: "numeric" }); } catch (e){ return new Date(t).toISOString().slice(0, 10); } }
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
  var BY_ID = {}; COURSES.forEach(function(c){ BY_ID[c.id] = c; });
  var ALIAS = { drawings: "drw", servo: "srv", instrumentation: "instr", inverters: "vfd", vfdc: "vfd" };

  var CUR = str(P.currency) || "جنيه";
  var PLAN_NAME = { monthly: "شهري", yearly: "سنوي" };
  var METHOD_NAME = { instapay: "InstaPay", vodafone: "فودافون كاش", intl: "دفع من خارج مصر" };
  function money(n, cur){ return cur === "USD" ? iso(fmtNum(n)) + " دولار" : iso(fmtNum(n)) + " " + CUR; }
  function prodName(p){ return BY_ID[p] ? "كورس " + BY_ID[p].title : "كل الكورسات " + (PLAN_NAME[p] || ""); }

  function get(){ return fetch("/api/pay/request", { credentials: "same-origin", cache: "no-store" }).then(function(r){ return r.json(); }).catch(function(){ return { ok: false }; }); }
  function getPrices(){ return fetch("/api/prices").then(function(r){ return r.json(); }).catch(function(){ return { ok: false }; }); }

  /* ---------- قايمة الطلبات (subscribe + account) ---------- */
  function reqItem(r){
    var course = r.plan === "course";
    var tag = r.status === "approved" ? '<span class="req-tag ok">اتفعّل ✓</span>' : r.status === "rejected" ? '<span class="req-tag no">اترفض</span>' : '<span class="req-tag wait">بنراجعه</span>';
    var sub = r.status === "approved" ? (course ? "الكورس بقى معاك على طول." : r.pro_until ? "كل الكورسات لحد " + fmtDate(r.pro_until) : "")
      : r.status === "rejected" ? "مقدرناش نلاقي التحويل ده. كلّمنا لو في مشكلة."
      : "اتبعت " + fmtDate(r.created_at) + (WA ? ". ابعت صورة التحويل على واتساب عشان نفعّله أسرع." : "");
    return '<li class="req"><div class="req-top"><b>' + esc(prodName(course ? r.product : r.plan)) + " · " + money(r.amount, r.currency) + "</b>" + tag + "</div>" +
      '<p class="req-sub">' + esc(METHOD_NAME[r.method] ? (r.method === "intl" ? METHOD_NAME.intl : "عن طريق " + (r.method === "instapay" ? iso("InstaPay") : METHOD_NAME[r.method])) : "") + " · " + esc(sub) + "</p></li>";
  }
  function showReqs(box, list, reqs){
    if (!box || !reqs || !reqs.length){ if (box) box.hidden = true; return; }
    list.innerHTML = reqs.map(reqItem).join("");
    box.hidden = false;
  }
  var WA = str(S.whatsapp).replace(/[^\d]/g, "");

  /* ---------- account.html ---------- */
  if (!$("pay-form") && $("pay-reqs")){
    get().then(function(r){
      if (!r.ok || !r.signed) return;
      showReqs($("pay-reqs"), $("req-list"), r.requests);
      var mine = (r.courses || []).filter(function(id){ return BY_ID[id]; });
      if ($("my-courses") && mine.length){
        $("mc-list").innerHTML = mine.map(function(id){ var c = BY_ID[id];
          return '<li><span class="mc-t"><b>' + esc(c.title) + '</b><small>' + esc(c.inc) + '</small></span><a class="btn btn-ghost" href="' + esc(c.hub) + '">افتح ←</a></li>'; }).join("");
        $("my-courses").hidden = false;
      }
    });
    return;
  }
  if (!$("pay-form")) return;

  /* ---------- subscribe.html ---------- */
  var form = $("pay-form"), msg = form.querySelector(".auth-msg"), plansEl = $("plans"), prodsEl = $("prods");
  var qs = new URLSearchParams(location.search), want = str(qs.get("course")).toLowerCase(); want = ALIAS[want] || want;
  var nextPath = str(qs.get("next")); if (!/^\/(?!\/)[^\s<>"']*$/.test(nextPath)) nextPath = "";
  var EG, INTL, PRICES = {}, region = "eg", sel = null, me = null, owned = [], egReady, intlReady;

  function cur(){ return region === "eg" ? "EGP" : "USD"; }
  function isCourse(k){ return !!BY_ID[k]; }
  function amount(){ return !sel ? 0 : isCourse(sel) ? PRICES[sel].price : (region === "eg" ? EG : INTL)[sel]; }
  function selectable(k){ return isCourse(k) ? region === "eg" && !!(PRICES[k] && PRICES[k].price) && owned.indexOf(k) < 0 : !!(region === "eg" ? EG : INTL)[k]; }
  function choices(){ return COURSES.map(function(c){ return c.id; }).concat(["monthly", "yearly"]).filter(selectable); }

  function radio(k, inner, disabled){
    return '<button type="button" class="plan' + (isCourse(k) ? " prod" : "") + '" role="radio" data-k="' + k + '" aria-checked="' + (k === sel) + '"' +
      (disabled ? ' aria-disabled="true"' : "") + (k === sel ? "" : ' tabindex="-1"') + ">" + inner + "</button>";
  }
  function render(){
    var list = choices();
    if (list.indexOf(sel) < 0){
      var p = region === "eg" ? EG : INTL;
      sel = list.filter(isCourse)[0] || (p.yearly && p.monthly && p.monthly * 12 > p.yearly ? "yearly" : list[0]) || null;
    }
    // كورس واحد (من مصر بس)
    $("prods-box").hidden = region !== "eg";
    prodsEl.innerHTML = COURSES.map(function(c){
      var pr = PRICES[c.id] || {}, own = owned.indexOf(c.id) > -1;
      var price = own ? '<span class="pl-own">اشتريته ✓</span>' : pr.price
        ? '<span class="pl-price"><b>' + esc(money(pr.price, "EGP")) + "</b>" + (pr.was ? " <s>" + esc(money(pr.was, "EGP")) + "</s>" : "") + "</span>"
        : '<span class="pl-soon">قريب</span>';
      return radio(c.id, '<span class="pl-name">' + esc(c.title) + '</span><span class="pl-sub">' + esc(c.inc) + "</span>" + price, own || !pr.price);
    }).join("");
    // كل الكورسات
    var p2 = region === "eg" ? EG : INTL, plans = ["monthly", "yearly"].filter(function(k){ return p2[k]; });
    $("plans-box").hidden = !plans.length;
    plansEl.innerHTML = plans.map(function(k){
      var save = k === "yearly" && p2.monthly ? p2.monthly * 12 - p2.yearly : 0, per = k === "yearly" ? "في السنة" : "في الشهر";
      var extra = k === "yearly" && p2.monthly && save > 0
        ? '<span class="pl-save">وفّر ' + money(save, cur()) + " (" + iso(Math.round(save / (p2.monthly * 12) * 100) + "%") + ")</span>"
        : '<span class="pl-sub">' + iso(k === "yearly" ? "365" : "30") + " يوم</span>";
      return radio(k, '<span class="pl-name">' + PLAN_NAME[k] + '</span><span class="pl-price"><b>' + esc(money(p2[k], cur())) + "</b> " + per + "</span>" + extra, false);
    }).join("");
    $("how-h").hidden = $("steps").hidden = !sel;
    update();
  }
  function method(){ if (region === "intl") return "intl"; var c = form.querySelector("input[name=method]:checked"); return c ? c.value : ""; }
  function update(){
    if (!sel) return;
    $("s1-amount").textContent = money(amount(), "EGP");
    $("s1-usd").textContent = money(amount(), "USD");
    $("s1-eg").hidden = region !== "eg"; $("s1-intl").hidden = region !== "intl";
    $("pm-set").hidden = region !== "eg" || !(EG.instapay && EG.vodafone);
    $("sender-l").innerHTML = region === "eg"
      ? "رقم الموبايل أو عنوان " + iso("InstaPay") + " اللي حوّلت منه <small>(اختياري)</small>"
      : "رقم العملية أو الإيميل اللي دفعت بيه <small>(اختياري)</small>";
    form.elements.sender.setAttribute("autocomplete", region === "eg" ? "tel" : "off");
    var wa = $("wa-shot");
    if (WA && me){
      var t = "السلام عليكم، حوّلت تمن " + (isCourse(sel) ? "كورس " + BY_ID[sel].title : "كل الكورسات " + PLAN_NAME[sel]) + " (" + fmtNum(amount()) + " " + (region === "eg" ? CUR : "USD") + ")" +
        (method() ? " عن طريق " + METHOD_NAME[method()] : "") + ".\nإيميل حسابي: " + me.email + "\nدي صورة التحويل:";
      wa.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(t); wa.hidden = false;
    } else wa.hidden = true;
  }
  function pick(k){ if (!k || !selectable(k)) return; sel = k; $("pay-ok").hidden = true; render(); var b = $("pick").querySelector('[data-k="' + k + '"]'); if (b) b.focus(); }
  $("pick").addEventListener("click", function(e){ var b = e.target.closest(".plan"); if (b) pick(b.getAttribute("data-k")); });
  $("pick").addEventListener("keydown", function(e){
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(e.key) < 0) return;
    var list = choices(); if (list.length < 2) return;
    e.preventDefault();
    var i = list.indexOf(sel), d = e.key === "ArrowDown" || e.key === "ArrowLeft" ? 1 : -1; // RTL: يسار = اللي بعده
    pick(list[(i + d + list.length) % list.length]);
  });
  form.addEventListener("change", update);

  function setupWays(){
    var ways = [["instapay", "InstaPay", EG.instapay], ["vodafone", "فودافون كاش", EG.vodafone]].filter(function(w){ return w[2]; });
    $("pay-ways").innerHTML = ways.map(function(w){
      return '<div class="pay-way"><span class="pw-l">' + (w[0] === "instapay" ? '<span class="ltr">InstaPay</span>' : esc(w[1])) + '</span><span class="pw-n ltr">' + esc(w[2]) + "</span>" +
        '<button class="btn btn-ghost pw-copy" type="button" data-copy="' + esc(w[2]) + '" aria-label="انسخ رقم ' + esc(w[1]) + '">انسخ</button></div>';
    }).join("");
    $("pm-opts").innerHTML = ways.map(function(w, i){
      return '<label class="pm-opt"><input type="radio" name="method" value="' + w[0] + '"' + (i === 0 ? " checked" : "") + "><span>" + (w[0] === "instapay" ? '<span class="ltr">InstaPay</span>' : esc(w[1])) + "</span></label>";
    }).join("");
    if (INTL.link){ $("intl-link").href = INTL.link; $("intl-link").hidden = false; }
    if (INTL.note){ $("intl-note").textContent = INTL.note; $("intl-note").hidden = false; }
  }
  $("pay-ways").addEventListener("click", function(e){
    var b = e.target.closest("[data-copy]"); if (!b) return;
    var v = b.getAttribute("data-copy"), done = function(){ b.textContent = "اتنسخ ✓"; setTimeout(function(){ b.textContent = "انسخ"; }, 2200); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, function(){});
    else { var t = document.createElement("textarea"); t.value = v; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (x){} t.remove(); }
  });

  // التابات: من مصر / من خارج مصر (بتظهر لما الاتنين متاحين بس). من برّه مصر: «كل الكورسات» بس.
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
        if (!r.ok){ msg.textContent = r.message || OFFLINE; msg.hidden = false; return; }
        form.elements.sender.value = ""; form.elements.note.value = "";
        var ok = $("pay-ok");
        ok.textContent = "وصلنا طلبك ✓ " + (WA ? "ابعت صورة التحويل على واتساب من الزرار اللي فوق عشان نفعّله أسرع." : "هنراجع التحويل ونفعّله.");
        ok.hidden = false;
        get().then(function(x){ if (x.ok && x.signed) showReqs($("pay-reqs"), $("req-list"), x.requests); });
      });
  });

  Promise.all([getPrices(), get()]).then(function(res){
    var pr = res[0] && res[0].ok ? res[0] : {}, r = res[1];
    WA = (str(pr.whatsapp) || str(S.whatsapp)).replace(/[^\d]/g, "");
    EG = { instapay: str(pr.instapay) || str(P.instapay), vodafone: str(pr.vodafone) || str(P.vodafoneCash), monthly: num(pr.monthly) || num(P.monthly), yearly: num(pr.yearly) || num(P.yearly) };
    INTL = { link: /^https:\/\/[^\s"<>]+$/i.test(str(P.intlLink)) ? str(P.intlLink) : "", note: str(P.intlNote), monthly: num(P.usdMonthly), yearly: num(P.usdYearly) };
    COURSES.forEach(function(c){ var x = (pr.courses || {})[c.id] || {}; PRICES[c.id] = { price: num(x.price), was: num(x.was) }; });
    var anyCourse = COURSES.some(function(c){ return PRICES[c.id].price; });
    egReady = !!((EG.instapay || EG.vodafone) && (EG.monthly || EG.yearly || anyCourse));
    intlReady = !!((INTL.link || INTL.note) && (INTL.monthly || INTL.yearly));
    var paywall = (r && r.ok ? r.paywall : pr.paywall) === true;
    if (r && r.ok && r.signed){ me = r.user; owned = r.courses || []; }
    if (!egReady && !intlReady){
      $("sub-soon").hidden = false;
      if (r && r.ok && !paywall) $("soon-free").hidden = false;
      if (r && r.ok && !r.signed && !paywall){ $("soon-go").href = "login.html#signup"; $("soon-go").textContent = "اعمل حساب ←"; }
      return;
    }
    region = egReady ? "eg" : "intl";
    if (egReady && intlReady) tabs.hidden = false;
    setupWays();
    if (BY_ID[want] && selectable(want)) sel = want;
    // جاي من درس مقفول (functions/_middleware.js بيبعته هنا بـ ?course=)
    if (BY_ID[want]){
      var need = $("sub-need"), c = BY_ID[want];
      if (owned.indexOf(want) > -1){ need.innerHTML = "كورس " + esc(c.title) + " معاك ✓ " + '<a href="' + esc(nextPath || c.hub) + '">افتحه ←</a>'; need.hidden = false; }
      else if (nextPath){ need.textContent = "الدرس اللي كنت رايحله في كورس " + c.title + ". اشتري الكورس أو كل الكورسات عشان تفتحه."; need.hidden = false; }
    }
    $("sub-buy").hidden = false;
    render();
    if (!r || !r.ok || !r.signed){
      $("s2-guest").hidden = false;
      $("s2-login").href = "login.html?next=" + encodeURIComponent(location.pathname + location.search);
      return;
    }
    form.hidden = false; update();
    if (!paywall) $("sub-open-note").hidden = false;
    if (me.pro){ var n = $("sub-pro-note"); n.textContent = "انت مشترك في كل الكورسات لحد " + fmtDate(me.pro_until) + ". لو جدّدت، المدة الجديدة بتتضاف على اللي فاضل."; n.hidden = false; }
    showReqs($("pay-reqs"), $("req-list"), r.requests);
    if (BY_ID[want] && sel === want){ var b = prodsEl.querySelector('[data-k="' + want + '"]'); if (b && b.scrollIntoView) b.scrollIntoView({ block: "center" }); }
  });
})();
