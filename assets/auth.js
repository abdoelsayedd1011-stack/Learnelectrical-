/* صفحات الحساب: دخول، حساب جديد، وصفحة «حسابي» */
(function(){
  "use strict";
  var OFFLINE = "العضوية لسه مش متفعّلة على النسخة دي من الموقع.";

  function api(path, body){
    var opt = body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" } : { credentials: "same-origin" };
    return fetch("/api/auth/" + path, opt).then(function(r){
      return r.json().catch(function(){ return { ok: false, message: OFFLINE }; });
    }, function(){ return { ok: false, message: OFFLINE }; });
  }
  function nextUrl(){
    var n = new URLSearchParams(location.search).get("next") || "";
    return /^\/(?!\/)[^\s\\]*$/.test(n) ? n : "account.html";
  }
  function showMsg(el, text){ if (!el) return; el.textContent = text || ""; el.hidden = !text; }

  /* ---------- login.html ---------- */
  var fLogin = document.getElementById("form-login"), fSignup = document.getElementById("form-signup");
  if (fLogin && fSignup){
    var tabs = { login: document.getElementById("tab-login"), signup: document.getElementById("tab-signup") };
    var forms = { login: fLogin, signup: fSignup };
    function setTab(k){
      Object.keys(forms).forEach(function(n){ forms[n].hidden = n !== k; tabs[n].setAttribute("aria-selected", n === k ? "true" : "false"); });
      var first = forms[k].querySelector("input"); if (first) first.focus();
    }
    tabs.login.addEventListener("click", function(){ setTab("login"); });
    tabs.signup.addEventListener("click", function(){ setTab("signup"); });
    document.querySelectorAll("[data-tab]").forEach(function(a){ a.addEventListener("click", function(e){ e.preventDefault(); setTab(a.getAttribute("data-tab")); }); });
    var gated = new URLSearchParams(location.search).get("next");
    var note = document.getElementById("gate-note");
    if (gated && note) note.hidden = false;
    if (location.hash === "#signup" || gated) setTab("signup");

    api("me").then(function(r){ if (r.ok && r.user) location.replace(nextUrl()); });

    /* نسيت الباسورد؟ → رسالة واتساب للإدارة فيها الإيميل */
    var fBtn = document.getElementById("forgot-btn"), fBox = document.getElementById("forgot"), fWa = document.getElementById("forgot-wa");
    if (fBtn && fBox){
      var waNum = String((window.SITE || {}).whatsapp || "").replace(/[^\d]/g, "");
      var setWa = function(){
        if (!fWa || !waNum) return;
        var em = (fLogin.elements.email.value || "").trim();
        fWa.href = "https://wa.me/" + waNum + "?text=" + encodeURIComponent("السلام عليكم، نسيت باسورد حسابي على " + ((window.SITE || {}).name || "LearnElectricals") + (em ? ". الإيميل: " + em : ". الإيميل: "));
        fWa.hidden = false;
      };
      fBtn.addEventListener("click", function(){
        var open = fBox.hidden; fBox.hidden = !open; fBtn.setAttribute("aria-expanded", open ? "true" : "false"); if (open) setWa();
      });
      fLogin.elements.email.addEventListener("input", setWa);
    }

    [["login", fLogin], ["signup", fSignup]].forEach(function(p){
      var form = p[1], msg = form.querySelector(".auth-msg"), btn = form.querySelector("button[type=submit]");
      form.addEventListener("submit", function(e){
        e.preventDefault();
        var data = {}; new FormData(form).forEach(function(v, k){ data[k] = v; });
        showMsg(msg, ""); btn.disabled = true;
        api(p[0], data).then(function(r){
          if (r.ok){ try{ sessionStorage.setItem("le-user", JSON.stringify(r.user)); }catch(x){} location.replace(nextUrl()); return; }
          btn.disabled = false; showMsg(msg, r.message || OFFLINE);
        });
      });
    });
  }

  /* ---------- reset.html ---------- */
  var fReset = document.getElementById("form-reset");
  if (fReset){
    var token = new URLSearchParams(location.search).get("t") || "";
    // نشيل التوكن من شريط العنوان عشان ميتسجلش في الهيستوري ولا يتبعت لأي لينك
    try { history.replaceState(null, "", location.pathname); } catch (e){}
    if (!/^[0-9a-f]{64}$/.test(token)){ fReset.hidden = true; document.getElementById("reset-bad").hidden = false; }
    var rMsg = fReset.querySelector(".auth-msg"), rBtn = fReset.querySelector("button[type=submit]");
    fReset.addEventListener("submit", function(e){
      e.preventDefault();
      var p1 = fReset.elements.password.value, p2 = fReset.elements.password2.value;
      if (p1.length < 8){ showMsg(rMsg, "الباسورد لازم يكون 8 حروف أو أرقام على الأقل."); return; }
      if (p1 !== p2){ showMsg(rMsg, "الباسوردين مش زي بعض. اكتبهم تاني."); return; }
      showMsg(rMsg, ""); rBtn.disabled = true;
      api("reset", { token: token, password: p1 }).then(function(r){
        if (r.ok){ try{ sessionStorage.setItem("le-user", JSON.stringify(r.user)); }catch(x){} location.replace("account.html"); return; }
        rBtn.disabled = false; showMsg(rMsg, r.message || OFFLINE);
      });
    });
  }

  /* ---------- account.html ---------- */
  var out = document.getElementById("logout");
  if (out){
    var msg = document.querySelector(".auth-msg");
    api("me").then(function(r){
      if (r.ok && !r.user){ location.replace("login.html?next=" + encodeURIComponent(location.pathname)); return; }
      if (!r.ok){ showMsg(msg, r.message || OFFLINE); return; }
      var u = r.user;
      document.getElementById("acc-hello").textContent = "أهلاً يا " + u.name.split(" ")[0];
      document.getElementById("acc-name").textContent = u.name;
      document.getElementById("acc-email").textContent = u.email;
      var pro = u.plan === "pro" && u.pro_until > Date.now(), dt = function(t){ return new Date(t).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }); };
      var planEl = document.getElementById("acc-plan");
      planEl.textContent = pro ? "\u2066Pro\u2069 لحد " + dt(u.pro_until) : u.plan === "pro" && u.pro_until ? "مجاني (الاشتراك خلص " + dt(u.pro_until) + ")" : "مجاني";
      // لينك «اشترك» بيظهر لما أرقام الدفع والأسعار تتكتب في site-config.js (SITE.pay)
      var P = (window.SITE || {}).pay || {};
      if (((P.instapay || P.vodafoneCash) && (+P.monthly > 0 || +P.yearly > 0)) || ((P.intlLink || P.intlNote) && (+P.usdMonthly > 0 || +P.usdYearly > 0))){
        var sa = document.createElement("a"); sa.href = "subscribe.html"; sa.className = "acc-sub"; sa.textContent = pro ? "جدّد ←" : "اشترك ←";
        planEl.appendChild(document.createTextNode(" · ")); planEl.appendChild(sa);
      }
      // جاي من صفحة محتاجة اشتراك (لما الاشتراك يتفعّل في functions/_lib/plan.js)
      if (new URLSearchParams(location.search).get("need") === "pro" && !pro){
        showMsg(msg, "الصفحة اللي كنت رايحلها محتاجة اشتراك \u2066Pro\u2069. ");
        var na = document.createElement("a"); na.href = "subscribe.html"; na.textContent = "اعرف إزاي تشترك ←"; msg.appendChild(na);
      }
      document.getElementById("acc-since").textContent = new Date(u.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
      var sync = window.LESync ? window.LESync.ready : Promise.resolve();
      sync.then(loadCerts, loadCerts);
    });
    /* ---- شهاداتي ---- */
    var certSec = document.getElementById("certs-sec"), certList = document.getElementById("cert-list");
    function esc(t){ return String(t == null ? "" : t).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    function fmtDate(t){ try { return new Date(t).toLocaleDateString("ar-EG-u-nu-latn", { year: "numeric", month: "long", day: "numeric" }); } catch (e){ return new Date(t).toISOString().slice(0, 10); } }
    function certCard(c){
      var pct = c.total ? Math.round(c.done / c.total * 100) : 0, h = '<article class="cert-item' + (c.cert ? " has" : "") + '"><div class="ci-head"><h3>' + esc(c.title) + "</h3>";
      if (c.cert) h += '<span class="ci-tag ok">✓ الشهادة طلعت</span></div>' +
        '<p class="ci-meta">باسم <b>' + esc(c.cert.name) + "</b> · " + esc(fmtDate(c.cert.issued_at)) + ' · كود <span class="ltr mono">' + esc(c.cert.code) + "</span></p>" +
        '<div class="btn-row"><a class="btn btn-primary" href="cert.html?c=' + encodeURIComponent(c.cert.code) + '">افتح الشهادة ←</a></div>';
      else if (c.complete) h += '<span class="ci-tag ok">خلّصته ✓</span></div>' +
        '<form class="ci-form" data-course="' + esc(c.id) + '" novalidate><label class="field"><span>الاسم اللي هيتكتب على الشهادة</span><input name="name" maxlength="60" autocomplete="name" required value="' + esc(c.name) + '"></label>' +
        '<p class="auth-msg" role="alert" hidden></p><button class="btn btn-primary" type="submit">اطلع شهادة</button></form>';
      else h += '<span class="ci-tag">' + (c.total ? pct + "%" : "") + "</span></div>" +
        (c.total ? '<div class="ci-bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="التقدّم ' + pct + '%"><i style="width:' + pct + '%"></i></div><p class="ci-meta">' + c.done + " من " + c.total + " خطوة. الشهادة بتفتح لما تخلّص الكورس كله.</p>" : "") +
        '<div class="btn-row"><a class="btn btn-ghost" href="' + esc(c.hub) + '">' + (c.done ? "كمّل الكورس ←" : "ابدأ الكورس ←") + "</a></div>";
      return h + "</article>";
    }
    function loadCerts(){
      fetch("/api/cert", { credentials: "same-origin", cache: "no-store" }).then(function(r){ return r.json(); }).then(function(r){
        if (!r.ok || !r.signed) return;
        certList.innerHTML = r.courses.map(certCard).join("");
        certSec.hidden = false;
      }).catch(function(){});
    }
    certList.addEventListener("submit", function(e){
      var f = e.target.closest(".ci-form"); if (!f) return;
      e.preventDefault();
      var m = f.querySelector(".auth-msg"), b = f.querySelector("button");
      showMsg(m, ""); b.disabled = true;
      fetch("/api/cert/issue", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" },
        body: JSON.stringify({ course: f.getAttribute("data-course"), name: f.elements.name.value }) })
        .then(function(r){ return r.json(); }, function(){ return { ok: false, message: OFFLINE }; })
        .then(function(r){
          if (r.ok && r.cert){ location.href = "cert.html?c=" + encodeURIComponent(r.cert.code); return; }
          b.disabled = false; showMsg(m, r.message || OFFLINE);
        });
    });

    out.addEventListener("click", function(){
      out.disabled = true;
      api("logout", {}).then(function(){ try{ sessionStorage.removeItem("le-user"); }catch(x){} location.replace("index.html"); });
    });
  }
})();
