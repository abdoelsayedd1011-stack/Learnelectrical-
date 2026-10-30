/* قفل الدروس بالترتيب: الدرس رقم N بيتفتح بس لما تمارين الدرس N-1 كلها تخلص.
   بيتحمّل من آخر ملف المحرك بتاع كل كورس (basics.js و engine.js و instr.js …).
   «خلص» = نفس شرط الشهادة و«كمّل من حيث وقفت»: كل مهام الدرس في state.done (والكلاسيك: كل تمارين الدرس في state.p).
   الأدمن مش بيتقفل عليه حاجة، والدرس اللي الطالب بدأه قبل القفل بيفضل مفتوح. */
(function(){
  "use strict";
  if (window.LEGate) return;
  var DIRS = {
    "basics-lab": ["basics-lab-v1", "BL"], "classic-control-lab": ["classic-lab-v1", "CL"], "instrumentation-lab": ["instr-lab-v1", "IL"],
    "plc-lab": ["plc-lab-v1", "PL"], "drawings-lab": ["drw-lab-v1", "DR"], "vfd-course": ["vfdc-lab-v1", "VF"], "servo-course": ["srvc-lab-v1", "SV"],
    "iiot-lab": ["iiot-lab-v1", "IL"], "scada-lab": ["scada-lab-v1", "IL"], "panel-lab": ["panel-lab-v1", "IL"], "maint-lab": ["maint-lab-v1", "IL"],
    "servo-maint-lab": ["srvm-lab-v1", "IL"], "safety-lab": ["safety-lab-v1", "IL"], "mech-lab": ["mech-lab-v1", "IL"]
  };
  var m = /^\/(en\/)?([^/]+)\/(?:lesson-(\d+)\.html|index\.html)?$/.exec(location.pathname);
  if (!m || !DIRS[m[2]]) return;
  var EN = !!m[1], DIR = m[2], KEY = DIRS[DIR][0], G = window[DIRS[DIR][1]], CUR = m[3] ? +m[3] : 0;
  var T = EN ? {
    lock: "This lesson is locked", need: function(n, t){ return "Finish lesson " + n + (t ? " «" + t + "»" : "") + " first, then this one opens."; },
    left: function(a, b){ return "You have done " + a + " of its " + b + " exercises."; }, back: function(n){ return "← Back to lesson " + n; }, hub: "Course page",
    badge: "Locked", tip: function(n){ return "Finish lesson " + n + " first"; }
  } : {
    lock: "الدرس ده لسه مقفول", need: function(n, t){ return "خلّص الدرس " + n + (t ? " «" + t + "»" : "") + " الأول، وبعدها الدرس ده هيتفتح لوحده."; },
    left: function(a, b){ return "خلّصت " + a + " من " + b + " تمرين فيه."; }, back: function(n){ return "ارجع للدرس " + n + " ←"; }, hub: "صفحة الكورس",
    badge: "مقفول", tip: function(n){ return "خلّص الدرس " + n + " الأول"; }
  };

  function state(){ try { return JSON.parse(localStorage.getItem(KEY) || "null") || {}; } catch (e){ return {}; } }
  function lessons(){
    if (!G) return [];
    if (G.COURSE) return G.COURSE.map(function(c){ return { id: c.id, title: c.title, req: (c.tasks || []).map(function(t){ return c.id + "/" + t[0]; }) }; });
    var C = G.CURRICULUM; if (!C || !C.exercises) return [];
    return [].concat(C.fundamentals || [], C.advanced || []).filter(function(c){ return /^l\d+$/.test(c.id); })
      .map(function(c){ return { id: c.id, title: c.title, req: (C.exercises[c.id] || []).map(function(x){ return c.id + "/ex/" + x; }) }; });
  }
  function find(n){ var L = lessons(); for (var i = 0; i < L.length; i++) if (L[i].id === "l" + n) return L[i]; return null; }
  function progress(n){
    var l = find(n), s = state(), map = (DIR === "classic-control-lab" ? s.p : s.done) || {};
    if (!l) return null;
    return { title: l.title, total: l.req.length, done: l.req.filter(function(k){ return !!map[k]; }).length,
      touched: Object.keys(map).some(function(k){ return k.indexOf(l.id + "/") === 0 && map[k]; }) };
  }
  function admin(){ try { var u = JSON.parse(sessionStorage.getItem("le-user") || "null"); return !!(u && u.admin); } catch (e){ return false; } }
  // الدرس n مقفول لو اللي قبله مخلصش، إلا لو الطالب كان بدأ فيه قبل كده
  function lockedBy(n){
    if (n <= 1 || admin()) return null;
    var prev = progress(n - 1), cur = progress(n);
    if (!prev || prev.done >= prev.total || (cur && cur.touched)) return null;
    return prev;
  }

  var css = document.createElement("style");
  css.textContent = "#leGate{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:16px;background:var(--bg,#f4f6f8);direction:" + (EN ? "ltr" : "rtl") + "}" +
    "#leGate .g{max-width:440px;width:100%;background:var(--card,#fff);color:var(--ink,#17202a);border:1px solid var(--line,#d5dbe1);border-radius:16px;padding:24px 20px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.12);font:16px/1.8 system-ui,sans-serif}" +
    "#leGate .i{font-size:44px;line-height:1}#leGate h2{margin:8px 0 6px;font-size:1.3rem}#leGate p{margin:4px 0}#leGate .s{opacity:.75;font-size:.95rem}" +
    "#leGate .b{display:flex;flex-direction:column;gap:8px;margin-top:16px}#leGate a{display:block;padding:12px;border-radius:10px;text-decoration:none;font-weight:700}" +
    "#leGate a.p{background:var(--accent,#1f6feb);color:#fff}#leGate a.h{border:1px solid var(--line,#d5dbe1);color:inherit}" +
    "a.le-locked{position:relative;opacity:.55}a.le-locked::after{content:'🔒 " + T.badge + "';position:absolute;top:8px;inset-inline-end:8px;font-size:.75rem;font-weight:700;background:#2b2f36;color:#fff;border-radius:8px;padding:2px 8px}";
  document.head.appendChild(css);

  function pad(n){ return (n < 10 ? "0" : "") + n; }
  function showLock(prev){
    var el = document.getElementById("leGate");
    if (!prev){ if (el){ el.remove(); document.documentElement.style.overflow = ""; } return; }
    if (!el){ el = document.createElement("div"); el.id = "leGate"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); document.body.appendChild(el); }
    var n = CUR - 1;
    el.innerHTML = '<div class="g"><div class="i">🔒</div><h2></h2><p class="n"></p><p class="s"></p><div class="b"><a class="p"></a><a class="h" href="index.html"></a></div></div>';
    el.querySelector("h2").textContent = T.lock;
    el.querySelector(".n").textContent = T.need(n, prev.title);
    el.querySelector(".s").textContent = prev.total ? T.left(prev.done, prev.total) : "";
    var a = el.querySelector("a.p"); a.textContent = T.back(n); a.href = "lesson-" + pad(n) + ".html";
    el.querySelector("a.h").textContent = T.hub;
    document.documentElement.style.overflow = "hidden";
  }
  // صفحة الكورس: علامة 🔒 على الدروس المقفولة، والضغطة عليها ماتفتحهاش
  function markHub(){
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++){
      var a = links[i], h = /(?:^|\/)lesson-(\d+)\.html(?:[?#].*)?$/.exec(a.getAttribute("href") || "");
      if (!h || a.closest("#leGate")) continue;
      var prev = lockedBy(+h[1]);
      a.classList.toggle("le-locked", !!prev);
      if (prev) a.title = T.tip(+h[1] - 1); else if (a.title && a.classList) a.removeAttribute("title");
    }
  }
  document.addEventListener("click", function(e){
    var a = e.target.closest && e.target.closest("a.le-locked");
    if (a){ e.preventDefault(); var h = /lesson-(\d+)\.html/.exec(a.getAttribute("href")); if (h) alertLock(+h[1]); }
  }, true);
  function alertLock(n){ var prev = lockedBy(n); if (!prev) return; var keep = CUR; CUR = n; showLock(prev); CUR = keep;
    var el = document.getElementById("leGate"); if (el && !CUR){ var x = document.createElement("a"); x.className = "h"; x.href = "#"; x.textContent = EN ? "Close" : "اقفل";
      x.addEventListener("click", function(ev){ ev.preventDefault(); showLock(null); }); el.querySelector(".b").appendChild(x); el.querySelector("a.h[href='index.html']").remove(); } }

  function run(){ if (CUR) showLock(lockedBy(CUR)); else markHub(); }
  function start(){
    run();
    if (!CUR){ var t = null; new MutationObserver(function(){ clearTimeout(t); t = setTimeout(markHub, 150); }).observe(document.body, { childList: true, subtree: true }); }
    // التقدّم ممكن يتغيّر من تبويب تاني أو بعد المزامنة مع الحساب
    window.addEventListener("storage", function(e){ if (!e.key || e.key === KEY || e.key === "le-user") run(); });
    window.addEventListener("pageshow", run);
    if (window.LESync && window.LESync.ready) window.LESync.ready.then(run, function(){});
    else document.addEventListener("DOMContentLoaded", function(){ if (window.LESync && window.LESync.ready) window.LESync.ready.then(run, function(){}); });
    // الأدمن: لو لسه مش متسجّل في الجلسة نسأل السيرفر مرة واحدة
    if (CUR && document.getElementById("leGate") && !sessionStorage.getItem("le-user") && window.fetch){
      fetch("/api/auth/me", { credentials: "same-origin" }).then(function(r){ return r.json(); }).then(function(r){
        if (r && r.user){ try { sessionStorage.setItem("le-user", JSON.stringify(r.user)); } catch (e){} run(); }
      }, function(){});
    }
  }
  window.LEGate = { locked: lockedBy, progress: progress, refresh: run };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
