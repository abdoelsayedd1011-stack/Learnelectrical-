/* الاشتراك: صفحة subscribe.html (الأسعار وطريقة التحويل وطلب «أنا حوّلت») + «طلبات الاشتراك» في account.html.
   الأرقام والأسعار من SITE.pay في site-config.js. لو فاضية، الصفحة بتقول «الاشتراك هيفتح قريب». */
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

  var CUR = str(P.currency) || "جنيه";
  var EG = { instapay: str(P.instapay), vodafone: str(P.vodafoneCash), monthly: num(P.monthly), yearly: num(P.yearly) };
  var INTL = { link: /^https:\/\/[^\s"<>]+$/i.test(str(P.intlLink)) ? str(P.intlLink) : "", note: str(P.intlNote), monthly: num(P.usdMonthly), yearly: num(P.usdYearly) };
  var egReady = !!((EG.instapay || EG.vodafone) && (EG.monthly || EG.yearly));
  var intlReady = !!((INTL.link || INTL.note) && (INTL.monthly || INTL.yearly));
  var WA = str(S.whatsapp).replace(/[^\d]/g, "");
  var PLAN_NAME = { monthly: "شهري", yearly: "سنوي" };
  var METHOD_NAME = { instapay: "InstaPay", vodafone: "فودافون كاش", intl: "دفع من خارج مصر" };
  function money(n, cur){ return cur === "USD" ? iso(fmtNum(n)) + " دولار" : iso(fmtNum(n)) + " " + CUR; }

  function get(){ return fetch("/api/pay/request", { credentials: "same-origin", cache: "no-store" }).then(function(r){ return r.json(); }).catch(function(){ return { ok: false }; }); }

  /* ---------- قايمة الطلبات (subscribe + account) ---------- */
  function reqItem(r){
    var tag = r.status === "approved" ? '<span class="req-tag ok">اتفعّل ✓</span>' : r.status === "rejected" ? '<span class="req-tag no">اترفض</span>' : '<span class="req-tag wait">بنراجعه</span>';
    var sub = r.status === "approved" && r.pro_until ? iso("Pro") + " لحد " + fmtDate(r.pro_until)
      : r.status === "rejected" ? "مقدرناش نلاقي التحويل ده. كلّمنا لو في مشكلة."
      : "اتبعت " + fmtDate(r.created_at) + (WA ? ". ابعت صورة التحويل على واتساب عشان نفعّله أسرع." : "");
    return '<li class="req"><div class="req-top"><b>' + iso("Pro") + " " + PLAN_NAME[r.plan] + " · " + money(r.amount, r.currency) + "</b>" + tag + "</div>" +
      '<p class="req-sub">' + esc(METHOD_NAME[r.method] ? (r.method === "intl" ? METHOD_NAME.intl : "عن طريق " + (r.method === "instapay" ? iso("InstaPay") : METHOD_NAME[r.method])) : "") + " · " + esc(sub) + "</p></li>";
  }
  function showReqs(box, list, reqs){
    if (!box || !reqs || !reqs.length){ if (box) box.hidden = true; return; }
    list.innerHTML = reqs.map(reqItem).join("");
    box.hidden = false;
  }

  /* ---------- account.html ---------- */
  if (!$("pay-form") && $("pay-reqs")){
    get().then(function(r){ if (r.ok && r.signed) showReqs($("pay-reqs"), $("req-list"), r.requests); });
    return;
  }
  if (!$("pay-form")) return;

  /* ---------- subscribe.html ---------- */
  var region = egReady ? "eg" : "intl", plan = null, me = null;
  var form = $("pay-form"), msg = form.querySelector(".auth-msg"), plansEl = $("plans");

  function prices(){ return region === "eg" ? EG : INTL; }
  function cur(){ return region === "eg" ? "EGP" : "USD"; }
  function renderPlans(){
    var p = prices(), list = ["monthly", "yearly"].filter(function(k){ return p[k]; });
    if (list.indexOf(plan) < 0) plan = p.yearly && p.monthly && p.monthly * 12 > p.yearly ? "yearly" : list[0];
    plansEl.innerHTML = list.map(function(k){
      var save = k === "yearly" && p.monthly ? p.monthly * 12 - p.yearly : 0, per = k === "yearly" ? "في السنة" : "في الشهر";
      var extra = k === "yearly" && p.monthly && save > 0
        ? '<span class="pl-save">وفّر ' + money(save, cur()) + " (" + iso(Math.round(save / (p.monthly * 12) * 100) + "%") + ")</span>"
        : k === "yearly" ? '<span class="pl-sub">' + iso("365") + " يوم</span>" : '<span class="pl-sub">' + iso("30") + " يوم</span>";
      return '<button type="button" class="plan" role="radio" data-plan="' + k + '" aria-checked="' + (k === plan) + '"' + (k === plan ? "" : ' tabindex="-1"') + ">" +
        '<span class="pl-name">' + PLAN_NAME[k] + '</span><span class="pl-price"><b>' + esc(money(p[k], cur())) + "</b> " + per + "</span>" + extra + "</button>";
    }).join("");
    update();
  }
  function amount(){ return prices()[plan]; }
  function method(){ if (region === "intl") return "intl"; var c = form.querySelector("input[name=method]:checked"); return c ? c.value : ""; }
  function update(){
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
      var t = "السلام عليكم، حوّلت اشتراك Pro " + PLAN_NAME[plan] + " (" + fmtNum(amount()) + " " + (region === "eg" ? CUR : "USD") + ")" +
        (method() ? " عن طريق " + METHOD_NAME[method()] : "") + ".\nإيميل حسابي: " + me.email + "\nدي صورة التحويل:";
      wa.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(t); wa.hidden = false;
    } else wa.hidden = true;
  }
  plansEl.addEventListener("click", function(e){
    var b = e.target.closest(".plan"); if (!b) return;
    plan = b.getAttribute("data-plan"); renderPlans(); plansEl.querySelector('[data-plan="' + plan + '"]').focus();
  });
  plansEl.addEventListener("keydown", function(e){
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(e.key) < 0) return;
    var bs = plansEl.querySelectorAll(".plan"); if (bs.length < 2) return;
    e.preventDefault(); plan = plan === "monthly" ? "yearly" : "monthly"; renderPlans(); plansEl.querySelector('[data-plan="' + plan + '"]').focus();
  });

  // طرق الدفع جوه مصر: الرقم + زرار نسخ
  var ways = [["instapay", "InstaPay", EG.instapay], ["vodafone", "فودافون كاش", EG.vodafone]].filter(function(w){ return w[2]; });
  $("pay-ways").innerHTML = ways.map(function(w){
    return '<div class="pay-way"><span class="pw-l">' + (w[0] === "instapay" ? '<span class="ltr">InstaPay</span>' : esc(w[1])) + '</span><span class="pw-n ltr">' + esc(w[2]) + "</span>" +
      '<button class="btn btn-ghost pw-copy" type="button" data-copy="' + esc(w[2]) + '" aria-label="انسخ رقم ' + esc(w[1]) + '">انسخ</button></div>';
  }).join("");
  $("pm-opts").innerHTML = ways.map(function(w, i){
    return '<label class="pm-opt"><input type="radio" name="method" value="' + w[0] + '"' + (i === 0 ? " checked" : "") + "><span>" + (w[0] === "instapay" ? '<span class="ltr">InstaPay</span>' : esc(w[1])) + "</span></label>";
  }).join("");
  form.addEventListener("change", update);
  $("pay-ways").addEventListener("click", function(e){
    var b = e.target.closest("[data-copy]"); if (!b) return;
    var v = b.getAttribute("data-copy"), done = function(){ b.textContent = "اتنسخ ✓"; setTimeout(function(){ b.textContent = "انسخ"; }, 2200); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, function(){});
    else { var t = document.createElement("textarea"); t.value = v; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (x){} t.remove(); }
  });
  if (INTL.link){ $("intl-link").href = INTL.link; $("intl-link").hidden = false; }
  if (INTL.note){ $("intl-note").textContent = INTL.note; $("intl-note").hidden = false; }

  // التابات: من مصر / من خارج مصر (بتظهر لما الاتنين متاحين بس)
  var tabs = $("sub-tabs");
  function setRegion(r){
    region = r;
    tabs.querySelectorAll("[role=tab]").forEach(function(t){ var on = t.getAttribute("data-region") === r; t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1; });
    $("pay-ok").hidden = true; renderPlans();
  }
  if (egReady && intlReady){
    tabs.hidden = false;
    tabs.addEventListener("click", function(e){ var t = e.target.closest("[role=tab]"); if (t) setRegion(t.getAttribute("data-region")); });
    tabs.addEventListener("keydown", function(e){
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault(); setRegion(region === "eg" ? "intl" : "eg"); tabs.querySelector('[aria-selected="true"]').focus();
    });
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    var btn = form.querySelector("button[type=submit]");
    msg.hidden = true; btn.disabled = true;
    fetch("/api/pay/request", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: plan, amount: amount(), currency: cur(), method: method(), sender: form.elements.sender.value, note: form.elements.note.value }) })
      .then(function(r){ return r.json(); }).catch(function(){ return { ok: false, message: OFFLINE }; })
      .then(function(r){
        btn.disabled = false;
        if (!r.ok){ msg.textContent = r.message || OFFLINE; msg.hidden = false; return; }
        form.elements.sender.value = ""; form.elements.note.value = "";
        var ok = $("pay-ok");
        ok.textContent = "وصلنا طلبك ✓ " + (WA ? "ابعت صورة التحويل على واتساب من الزرار اللي فوق عشان نفعّله أسرع." : "هنراجع التحويل ونفعّل اشتراكك.");
        ok.hidden = false;
        get().then(function(x){ if (x.ok && x.signed) showReqs($("pay-reqs"), $("req-list"), x.requests); });
      });
  });

  if (!egReady && !intlReady){
    $("sub-soon").hidden = false;
    get().then(function(r){
      if (r.ok && r.paywall === false) $("soon-free").hidden = false;
      if (r.ok && !r.signed && r.paywall === false){ $("soon-go").href = "login.html#signup"; $("soon-go").textContent = "اعمل حساب ←"; }
    });
    return;
  }
  $("sub-buy").hidden = false;
  renderPlans();
  get().then(function(r){
    if (!r.ok || !r.signed){ $("s2-guest").hidden = false; return; }
    me = r.user; form.hidden = false; update();
    if (r.paywall === false) $("sub-open-note").hidden = false;
    if (me.pro){ var n = $("sub-pro-note"); n.textContent = "انت مشترك " + iso("Pro") + " لحد " + fmtDate(me.pro_until) + ". لو جدّدت، المدة الجديدة بتتضاف على اللي فاضل."; n.hidden = false; }
    showReqs($("pay-reqs"), $("req-list"), r.requests);
  });
})();
