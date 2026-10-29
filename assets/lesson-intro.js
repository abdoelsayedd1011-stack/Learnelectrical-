/* «قبل ما تبدأ» / "Before you start": the short summary block at the top of every course lesson.
   Page: <div id="lesson-intro" data-course="basics-lab" data-lesson="01"></div> right under the lesson header, then
         <script src="/assets/lesson-intro-data/basics-lab.ar.js" defer></script> (or .en.js on /en/ pages)
         <script src="/assets/lesson-intro.js" defer></script>   (+ /assets/lesson-intro.css in <head>)
   Data: LE_INTRO["basics-lab.ar"]["01"] = {b:[3–4 bullets], t:[[term, meaning] ×≤4], go:"#selector"(optional)}.
         **text** in a bullet is shown bold; everything else is plain text (escaped).
   Video: hidden until /media/lessons/manifest.json lists the lesson:
         {"videos":["basics-lab/lesson-01", …]}  →  /media/lessons/basics-lab/lesson-01.mp4 (+ lesson-01.jpg poster).
         The manifest is fetched once per tab session (sessionStorage), and any failure just keeps the video hidden.
   «يلا طبّق ↓» is NOT in the summary (students skipped the explanation): it sits right before the first hands-on widget
   (L.go, else .wd), after the explanation, and scrolls into it. No widget after the explanation (classic stepper) → no button.
   «اخفي الملخص» collapses the block to a one-line bar; remembered per lesson in localStorage "le-intro-v1". */
(function(){
  "use strict";
  var MANIFEST = "/media/lessons/manifest.json", SKEY = "le-intro-manifest", LKEY = "le-intro-v1";
  var host = document.getElementById("lesson-intro");
  if (!host) return;
  var dir = host.getAttribute("data-course") || "", num = host.getAttribute("data-lesson") || "";
  var en = /^en/i.test(document.documentElement.lang || "");
  var all = window.LE_INTRO || {}, L = (all[dir + (en ? ".en" : ".ar")] || {})[num];
  if (!L) return;
  var T = en ? {
    aria: "Before you start", sum: "This lesson in a minute", terms: "Key words", go: "Now practice ↓",
    hide: "Hide summary", bar: "Lesson summary", open: "Show", cc: "Video captions are in Arabic", vid: "Lesson video"
  } : {
    aria: "قبل ما تبدأ", sum: "الدرس ده في دقيقة", terms: "كلمات مهمة", go: "يلا طبّق ↓",
    hide: "اخفي الملخص", bar: "ملخص الدرس", open: "اعرض", cc: "", vid: "فيديو الدرس"
  };
  var id = dir + "/" + num;

  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  // Arabic pages: keep Latin/number ranges like 4–20mA in reading order (the en dash is bidi-neutral), and show
  // bold runs without Arabic letters (formulas, codes) left-to-right.
  var AR = /[\u0600-\u06FF]/;
  function iso(h){
    return en ? h : h.replace(/[0-9A-Za-z.±°%Ω+\/-]+(?:[ –][0-9A-Za-z.±°%Ω+\/-]+)+/g, function(m){
      return /\d/.test(m) ? '<bdi dir="ltr">' + m + "</bdi>" : m;   // "4–20mA", "4 mA", "2 mV/V"
    });
  }
  function rich(s){
    return String(s).split("**").map(function(p, i){
      var h = iso(esc(p));
      return i % 2 ? "<b" + (!en && !AR.test(p) ? ' dir="ltr"' : "") + ">" + h + "</b>" : h;
    }).join("");
  }
  function readStore(){ try { return JSON.parse(localStorage.getItem(LKEY) || "{}") || {}; } catch (e) { return {}; } }
  function writeStore(on){
    try { var s = readStore(); if (on) s[id] = 1; else delete s[id]; localStorage.setItem(LKEY, JSON.stringify(s)); } catch (e) {}
  }

  var src = "/media/lessons/" + dir + "/lesson-" + num;
  host.className = "li-wrap";
  host.innerHTML =
    '<section class="li" aria-label="' + esc(T.aria) + '">' +
      '<div class="li-body">' +
        '<div class="li-top"><h2 class="li-h">' + esc(T.sum) + '</h2>' +
          '<button type="button" class="li-x" data-li="hide">' + esc(T.hide) + '</button></div>' +
        '<ul class="li-b">' + (L.b || []).map(function(b){ return "<li>" + rich(b) + "</li>"; }).join("") + "</ul>" +
        ((L.t && L.t.length) ? '<h3 class="li-h li-h2">' + esc(T.terms) + '</h3><ul class="li-t">' +
          L.t.map(function(t){ return '<li><b dir="auto">' + iso(esc(t[0])) + "</b><span>" + iso(esc(t[1])) + "</span></li>"; }).join("") + "</ul>" : "") +
        '<figure class="li-v" hidden><div class="li-vbox"></div>' +
          (T.cc ? '<figcaption class="li-cc" lang="en">' + esc(T.cc) + "</figcaption>" : "") + "</figure>" +
      "</div>" +
      '<button type="button" class="li-bar" data-li="show" aria-expanded="false" hidden><span>' + esc(T.bar) + '</span><span class="li-open">' + esc(T.open) + " ▾</span></button>" +
    "</section>";
  var box = host.querySelector(".li"), body = host.querySelector(".li-body"), bar = host.querySelector(".li-bar");

  function collapse(on, focus){
    body.hidden = on; bar.hidden = !on; box.classList.toggle("li-closed", on);
    bar.setAttribute("aria-expanded", on ? "false" : "true");
    if (focus) (on ? bar : host.querySelector(".li-x")).focus();
  }
  collapse(!!readStore()[id], false);

  function target(){
    var sel = [L.go, ".wd"], i, el;
    for (i = 0; i < sel.length; i++){
      if (!sel[i]) continue;
      try { el = document.querySelector(sel[i]); } catch (e) { el = null; }
      if (el && !host.contains(el)) return el;
    }
    return null;
  }
  // «يلا طبّق ↓» بعد الشرح، قبل أول تمرين على طول
  (function(){
    var t = target();
    if (!t || !t.parentNode) return;
    // لازم يكون فيه شرح بين الملخص وأول تمرين (الكلاسيك: الدرس كله تمارين وخطوات في نفس الصندوق → مفيش زرار)
    try { var r = document.createRange(); r.setStartAfter(host); r.setEndBefore(t); if (r.toString().replace(/\s+/g, "").length < 200) return; } catch (e) { return; }
    var act = document.createElement("div");
    act.className = "li-act li-after";
    act.innerHTML = '<button type="button" class="li-go">' + esc(T.go) + "</button>";
    t.parentNode.insertBefore(act, t);
    act.addEventListener("click", function(){
      var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      t.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "start"});
      t.classList.remove("li-flash"); void t.offsetWidth; t.classList.add("li-flash");
      setTimeout(function(){ t.classList.remove("li-flash"); }, 1800);
      if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1");
      try { t.focus({preventScroll: true}); } catch (e2) {}
    });
  })();
  host.addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest("[data-li]") : null;
    if (!b) return;
    var k = b.getAttribute("data-li");
    if (k === "hide"){ collapse(true, true); writeStore(true); }
    else if (k === "show"){ collapse(false, true); writeStore(false); }
  });

  // video: show only when the manifest lists this lesson
  function apply(m){
    var list = m && m.videos;
    if (en || !Array.isArray(list)) return; // the videos are narrated in Arabic: English lessons stay without one
    var want = dir + "/lesson-" + num;
    for (var i = 0; i < list.length; i++){
      var v = list[i], key = typeof v === "string" ? v : (v && v.id);
      if (key === want){
        // the <video> (and its poster request) only exists once the manifest lists this lesson
        var fig = host.querySelector(".li-v");
        fig.querySelector(".li-vbox").innerHTML = '<video controls playsinline preload="none" title="' + esc(T.vid) + '" src="' + src + '.mp4" poster="' + src + '.jpg"></video>';
        fig.hidden = false;
        return;
      }
    }
  }
  var cached = null;
  try { cached = sessionStorage.getItem(SKEY); } catch (e) {}
  if (cached){ try { apply(JSON.parse(cached)); } catch (e) {} return; }
  if (!window.fetch) return;
  fetch(MANIFEST, {cache: "no-cache"}).then(function(r){ return r.ok ? r.json() : {videos: []}; }).then(function(m){
    if (!m || typeof m !== "object") m = {videos: []};
    try { sessionStorage.setItem(SKEY, JSON.stringify(m)); } catch (e) {}
    apply(m);
  }).catch(function(){});
})();
