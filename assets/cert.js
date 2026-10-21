/* صفحة الشهادة العامة: cert.html?c=LE-XXXX-XXXX → بتجيب الشهادة من /api/cert/CODE وبترسمها مع QR للتحقق */
(function(){
  "use strict";
  var S = window.SITE || {};
  // English page (/en/cert.html): English course title, dates, texts, and the QR / link point to the English verify page
  var I18N = window.LE_I18N || {}, EN = I18N.isEn && I18N.en ? I18N.en : null, PAGE = EN ? "/en/cert.html" : "/cert.html";
  var domain = String(S.domain || "www.learnelectricals.com").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  var $ = function(id){ return document.getElementById(id); };
  var state = $("cert-state"), bad = $("cert-bad"), ok = $("cert-ok");
  var code = (new URLSearchParams(location.search).get("c") || "").trim().toUpperCase();

  function showBad(){ state.hidden = true; ok.hidden = true; bad.hidden = false; var i = $("cert-find").elements.c; if (code) i.value = code; }
  function fmtDate(t){ try { return new Date(t).toLocaleDateString(EN ? "en-GB" : "ar-EG-u-nu-latn", { year: "numeric", month: "long", day: "numeric" }); } catch (e){ return new Date(t).toISOString().slice(0, 10); } }

  $("cert-find").addEventListener("submit", function(e){
    e.preventDefault();
    var v = this.elements.c.value.trim().toUpperCase();
    if (v) location.search = "?c=" + encodeURIComponent(v);
  });

  if (!/^LE-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(code)){ showBad(); return; }
  var link = "https://" + domain + PAGE + "?c=" + code;

  fetch("/api/cert/" + encodeURIComponent(code), { cache: "no-store" })
    .then(function(r){ return r.json(); })
    .then(function(r){
      if (!r || !r.ok || !r.cert){ showBad(); return; }
      var c = r.cert;
      $("c-name").textContent = c.name;
      var title = EN ? EN.courses[c.course] || c.course_title : c.course_title;
      $("c-course").textContent = title;
      $("c-date").textContent = fmtDate(c.issued_at);
      $("c-code").textContent = c.code;
      $("c-url").textContent = domain + PAGE;
      try { $("c-qr").innerHTML = QR.svg(link, { label: EN ? EN.certQr(c.code) : "QR للتأكد من الشهادة " + c.code }); } catch (e){}
      document.title = (EN ? EN.certTitle(c.name, title) : "شهادة " + c.name + " · " + title) + " | " + (S.name || "LearnElectricals");
      state.hidden = true; bad.hidden = true; ok.hidden = false;
    })
    .catch(function(){ state.textContent = EN ? EN.certOffline : "مقدرناش نوصل للسيرفر دلوقتي. جرّب تاني بعد شوية."; });

  $("cert-print").addEventListener("click", function(){ window.print(); });
  $("cert-copy").addEventListener("click", function(){
    var done = function(){ $("copy-ok").textContent = EN ? EN.copied : "اتنسخ ✓"; setTimeout(function(){ $("copy-ok").textContent = ""; }, 2500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, function(){ prompt(EN ? EN.copyLink : "انسخ اللينك:", link); });
    else prompt(EN ? EN.copyLink : "انسخ اللينك:", link);
  });
})();
