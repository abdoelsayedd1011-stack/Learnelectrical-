/* صفحات الحساب: دخول، حساب جديد، وصفحة «حسابي» */
(function(){
  "use strict";
  // English pages (/en/): strings from assets/i18n-en.js; API errors are mapped by their code (LE_I18N.msg)
  var I18N = window.LE_I18N || {}, EN = I18N.isEn && I18N.en ? I18N.en : null;
  var OFFLINE = EN ? EN.offline : "العضوية لسه مش متفعّلة على النسخة دي من الموقع.";
  var M = function(r, fb){ return I18N.msg ? I18N.msg(r, fb) : (r && r.message) || fb; };
  var DLOC = EN ? "en-GB" : "ar-EG";

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

    // signed out on this device (a newer device, the admin, or a suspended account): say so gently and open «دخول»
    var outNote = document.getElementById("out-note");
    var showOut = function(){
      if (!outNote || !outNote.hidden) return;
      outNote.hidden = false; if (note) note.hidden = true; setTab("login");
      try{ sessionStorage.removeItem("le-ended"); }catch(x){}
    };
    var ended = false; try{ ended = sessionStorage.getItem("le-ended") === "1"; }catch(x){}
    if (new URLSearchParams(location.search).get("out") === "1" || ended) showOut();

    api("me").then(function(r){
      if (r.ok && r.user){ location.replace(nextUrl()); return; }
      if (r.ok && r.ended) showOut();
      // «ادخل بجوجل»: only when GOOGLE_CLIENT_ID is set in Cloudflare (functions/api/auth/google.js)
      if (r.ok && r.google){
        var nx = nextUrl(); if (nx.charAt(0) !== "/") nx = location.pathname.replace(/[^\/]*$/, "") + nx;
        document.querySelectorAll("[data-google]").forEach(function(el){ el.hidden = false; if (el.tagName === "A") el.href = "/api/auth/google?next=" + encodeURIComponent(nx); });
      }
    });
    // back from Google (or a blocked account) with ?err=code
    var errCode = new URLSearchParams(location.search).get("err");
    if (errCode){
      var AR_ERR = { no_google: "الدخول بجوجل لسه مش متفعّل على الموقع. ادخل بالإيميل والباسورد.", google_failed: "معرفناش نكمّل الدخول بجوجل. جرّب تاني.",
        google_state: "المتصفح ده مش بيحفظ الكوكيز، فمعرفناش نكمّل الدخول بجوجل. افتح الموقع في Chrome أو Safari وجرّب تاني، أو ادخل بالإيميل والباسورد.",
        google_secret: "إعداد جوجل على الموقع فيه خطأ (كود 2). ادخل بالإيميل والباسورد مؤقتًا.",
        google_token: "إعداد جوجل على الموقع فيه خطأ (كود 3). ادخل بالإيميل والباسورد مؤقتًا.",
        suspended: "الحساب ده موقوف، كلّم الإدارة." };
      var t = EN ? (EN.err && EN.err[errCode]) : AR_ERR[errCode];
      if (t){ setTab("login"); showMsg(fLogin.querySelector(".auth-msg"), t); }
    }

    /* نسيت الباسورد؟ → رسالة واتساب للإدارة فيها الإيميل */
    var fBtn = document.getElementById("forgot-btn"), fBox = document.getElementById("forgot"), fWa = document.getElementById("forgot-wa");
    if (fBtn && fBox){
      var waNum = String((window.SITE || {}).whatsapp || "").replace(/[^\d]/g, "");
      var setWa = function(){
        if (!fWa || !waNum) return;
        var em = (fLogin.elements.email.value || "").trim();
        var site = (window.SITE || {}).name || "LearnElectricals";
        fWa.href = "https://wa.me/" + waNum + "?text=" + encodeURIComponent(EN ? EN.forgotWa(site, em) : "السلام عليكم، نسيت باسورد حسابي على " + site + (em ? ". الإيميل: " + em : ". الإيميل: "));
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
          if (r.ok){ try{ sessionStorage.setItem("le-user", JSON.stringify(r.user)); sessionStorage.removeItem("le-ended"); }catch(x){} location.replace(nextUrl()); return; }
          btn.disabled = false; showMsg(msg, M(r, OFFLINE));
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
      if (p1.length < 8){ showMsg(rMsg, EN ? EN.pwShort : "الباسورد لازم يكون 8 حروف أو أرقام على الأقل."); return; }
      if (p1 !== p2){ showMsg(rMsg, EN ? EN.pwMismatch : "الباسوردين مش زي بعض. اكتبهم تاني."); return; }
      showMsg(rMsg, ""); rBtn.disabled = true;
      api("reset", { token: token, password: p1 }).then(function(r){
        if (r.ok){ try{ sessionStorage.setItem("le-user", JSON.stringify(r.user)); }catch(x){} location.replace("account.html"); return; }
        rBtn.disabled = false; showMsg(rMsg, M(r, OFFLINE));
      });
    });
  }

  /* ---------- account.html ---------- */
  var out = document.getElementById("logout");
  if (out){
    var msg = document.querySelector(".auth-msg");
    api("me").then(function(r){
      if (r.ok && !r.user){ location.replace("login.html?next=" + encodeURIComponent(location.pathname)); return; }
      if (!r.ok){ showMsg(msg, M(r, OFFLINE)); return; }
      var u = r.user;
      document.getElementById("acc-hello").textContent = EN ? EN.hello(u.name.split(" ")[0]) : "أهلاً يا " + u.name.split(" ")[0];
      document.getElementById("acc-name").textContent = u.name;
      document.getElementById("acc-email").textContent = u.email;
      var adm = document.getElementById("acc-admin"); if (adm) adm.hidden = !u.admin; // /api/auth/me says admin only for ADMIN_EMAILS
      var pro = u.plan === "pro" && u.pro_until > Date.now(), dt = function(t){ return new Date(t).toLocaleDateString(DLOC, { year: "numeric", month: "long", day: "numeric" }); };
      var planEl = document.getElementById("acc-plan");
      planEl.textContent = EN ? (pro ? EN.planPro(dt(u.pro_until)) : u.plan === "pro" && u.pro_until ? EN.planEnded(dt(u.pro_until)) : EN.planFree)
        : pro ? "\u2066Pro\u2069 لحد " + dt(u.pro_until) : u.plan === "pro" && u.pro_until ? "مجاني (الاشتراك خلص " + dt(u.pro_until) + ")" : "مجاني";
      // لينك «اشتري كورس» بيظهر لما كورس واحد على الأقل يبقى للبيع، ومعاه طريقة دفع (أرقام الدفع، أو لينك كارت / واتساب لبرّه مصر)
      var P = (window.SITE || {}).pay || {};
      var addSub = function(x){
        x = x && x.ok ? x : {};
        var cs = x.courses || {}, ks = Object.keys(cs);
        var eg = (x.instapay || x.vodafone || P.instapay || P.vodafoneCash) && ks.some(function(k){ return cs[k] && cs[k].price > 0; });
        var intl = ks.some(function(k){ return cs[k] && cs[k].usd > 0 && (cs[k].link || x.whatsapp || (window.SITE || {}).whatsapp); });
        if (!eg && !intl) return;
        var sa = document.createElement("a"); sa.href = "subscribe.html"; sa.className = "acc-sub"; sa.textContent = EN ? EN.buyCourse : "اشتري كورس ←";
        planEl.appendChild(document.createTextNode(" · ")); planEl.appendChild(sa);
      };
      fetch("/api/prices").then(function(x){ return x.json(); }).then(addSub, function(){ addSub(null); });
      // جاي من صفحة محتاجة اشتراك (لما الاشتراك يتفعّل في functions/_lib/plan.js)
      if (new URLSearchParams(location.search).get("need") === "pro" && !pro){
        showMsg(msg, EN ? EN.needPro : "الصفحة اللي كنت رايحلها محتاجة تشتري الكورس بتاعها. ");
        var na = document.createElement("a"); na.href = "subscribe.html"; na.textContent = EN ? EN.howBuy : "اعرف إزاي تشتري ←"; msg.appendChild(na);
      }
      document.getElementById("acc-since").textContent = new Date(u.created_at).toLocaleDateString(DLOC, { year: "numeric", month: "long", day: "numeric" });
      var sync = window.LESync ? window.LESync.ready : Promise.resolve();
      sync.then(loadCerts, loadCerts);
      // «تغيير الباسورد»: a Google-made account has none yet, so no current password is asked
      var pwNone = document.getElementById("pw-none"), pwCur = document.getElementById("pw-cur-f");
      if (pwNone && pwCur && u.has_password === false){ pwNone.hidden = false; pwCur.hidden = true; }
    });
    /* ---- تغيير الباسورد من الحساب، من غير لينك ---- */
    var fPw = document.getElementById("form-password");
    if (fPw){
      var pMsg = fPw.querySelector(".auth-msg"), pBtn = fPw.querySelector("button[type=submit]");
      fPw.addEventListener("submit", function(e){
        e.preventDefault();
        var p1 = fPw.elements.password.value, p2 = fPw.elements.password2.value;
        if (p1.length < 8){ showMsg(pMsg, EN ? EN.pwShort : "الباسورد لازم يكون 8 حروف أو أرقام على الأقل."); return; }
        if (p1 !== p2){ showMsg(pMsg, EN ? EN.pwMismatch : "الباسوردين مش زي بعض. اكتبهم تاني."); return; }
        showMsg(pMsg, ""); pBtn.disabled = true;
        api("password", { current: fPw.elements.current.value, password: p1 }).then(function(r){
          pBtn.disabled = false;
          if (!r.ok){ showMsg(pMsg, M(r, OFFLINE)); return; }
          fPw.reset(); showMsg(pMsg, EN ? EN.pwSaved : "تم حفظ الباسورد الجديد، والأجهزة التانية خرجت من الحساب.");
          var pn = document.getElementById("pw-none"), pc = document.getElementById("pw-cur-f"); if (pn) pn.hidden = true; if (pc) pc.hidden = false;
        });
      });
    }
    /* ---- شهاداتي ---- */
    var certSec = document.getElementById("certs-sec"), certList = document.getElementById("cert-list");
    function esc(t){ return String(t == null ? "" : t).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    function fmtDate(t){ try { return new Date(t).toLocaleDateString(EN ? "en-GB" : "ar-EG-u-nu-latn", { year: "numeric", month: "long", day: "numeric" }); } catch (e){ return new Date(t).toISOString().slice(0, 10); } }
    function certCard(c){
      if (EN) return certCardEn(c);
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
    function certCardEn(c){
      var T = EN.cert, title = EN.courses[c.id] || c.title, hub = I18N.href ? I18N.href(c.hub) : c.hub;
      var pct = c.total ? Math.round(c.done / c.total * 100) : 0, h = '<article class="cert-item' + (c.cert ? " has" : "") + '"><div class="ci-head"><h3>' + esc(title) + "</h3>";
      if (c.cert) h += '<span class="ci-tag ok">' + T.done + "</span></div>" +
        '<p class="ci-meta">' + T.nameOn(esc(c.cert.name)) + " · " + esc(fmtDate(c.cert.issued_at)) + " · " + T.code + ' <span class="ltr mono">' + esc(c.cert.code) + "</span></p>" +
        '<div class="btn-row"><a class="btn btn-primary" href="cert.html?c=' + encodeURIComponent(c.cert.code) + '">' + T.open + "</a></div>";
      else if (c.complete) h += '<span class="ci-tag ok">' + T.finished + "</span></div>" +
        '<form class="ci-form" data-course="' + esc(c.id) + '" novalidate><label class="field"><span>' + T.nameLabel + '</span><input name="name" maxlength="60" autocomplete="name" required value="' + esc(c.name) + '"></label>' +
        '<p class="auth-msg" role="alert" hidden></p><button class="btn btn-primary" type="submit">' + T.issue + "</button></form>";
      else h += '<span class="ci-tag">' + (c.total ? pct + "%" : "") + "</span></div>" +
        (c.total ? '<div class="ci-bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + T.progress(pct) + '"><i style="width:' + pct + '%"></i></div><p class="ci-meta">' + T.steps(c.done, c.total) + "</p>" : "") +
        '<div class="btn-row"><a class="btn btn-ghost" href="' + esc(hub) + '"' + (/^\/en\//.test(hub) ? "" : ' hreflang="ar"') + ">" + (c.done ? T.cont : T.start) + (/^\/en\//.test(hub) ? "" : '<span class="ar-badge">' + EN.arBadge + "</span>") + "</a></div>";
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
          b.disabled = false; showMsg(m, M(r, OFFLINE));
        });
    });

    out.addEventListener("click", function(){
      out.disabled = true;
      api("logout", {}).then(function(){ try{ sessionStorage.removeItem("le-user"); }catch(x){} location.replace("index.html"); });
    });
  }
})();
