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
      document.getElementById("acc-plan").textContent = u.plan === "free" ? "مجاني" : "مدفوع";
      document.getElementById("acc-since").textContent = new Date(u.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    });
    out.addEventListener("click", function(){
      out.disabled = true;
      api("logout", {}).then(function(){ try{ sessionStorage.removeItem("le-user"); }catch(x){} location.replace("index.html"); });
    });
  }
})();
