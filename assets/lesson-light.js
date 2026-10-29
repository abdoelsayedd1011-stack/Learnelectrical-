/* صفحات الدروس الخفيفة: بيطوي الأجزاء الثانوية (الجداول والملاحظات الجانبية وكلمات الملخص) ورا زرار صغير.
   العنصر نفسه بيفضل مكانه وظاهر (الزرار جوّاه)، واللي بيتطوي هو اللي جوّاه بس،
   عشان قفل القراية في الـ PLC (PL.gate) اللي بيراقب عناصر الشرح يفضل شغال زي ما هو. */
(function(){
  "use strict";
  var EN = (document.documentElement.lang || "").indexOf("en") === 0;
  var T = EN ? { tbl: "Show the table", note: "Extra note", terms: "Key words", hide: "Hide" }
             : { tbl: "اعرض الجدول", note: "معلومة زيادة", terms: "كلمات مهمة", hide: "اخفي" };

  function fold(el, label){
    if (!el || el.classList.contains("ll-fold")) return;
    var body = document.createElement("div"); body.className = "ll-body";
    while (el.firstChild) body.appendChild(el.firstChild);
    var b = document.createElement("button");
    b.type = "button"; b.className = "ll-tog"; b.setAttribute("aria-expanded", "false");
    b.innerHTML = '<span class="ll-l"></span><span class="ll-i" aria-hidden="true">+</span>';
    b.firstChild.textContent = label;
    b.addEventListener("click", function(){
      var open = el.classList.toggle("ll-open");
      b.setAttribute("aria-expanded", open ? "true" : "false");
      b.lastChild.textContent = open ? "−" : "+";
    });
    el.classList.add("ll-fold"); el.appendChild(b); el.appendChild(body);
  }
  function noteLabel(box){
    var first = box.firstElementChild, txt = (box.textContent || "").trim();
    if (first && first.tagName === "B" && txt.indexOf(first.textContent.trim()) === 0) return first.textContent.trim().replace(/[:：]\s*$/, "");
    return T.note;
  }

  function run(){
    document.querySelectorAll(".lsec .tblw").forEach(function(t){
      if (t.closest(".wd") || !t.querySelector("table")) return;
      fold(t, T.tbl);
    });
    document.querySelectorAll(".lsec .box").forEach(function(x){
      if (x.closest(".wd") || x.matches(".key,.safe,.mono") || x.id) return;
      fold(x, noteLabel(x));
    });
  }
  function terms(){
    var ul = document.querySelector("#lesson-intro .li-t"); if (!ul || ul.closest(".ll-fold")) return;
    var h = ul.previousElementSibling; if (h && h.classList.contains("li-h2")) h.hidden = true;
    var w = document.createElement("div"); ul.parentNode.insertBefore(w, ul); w.appendChild(ul);
    fold(w, T.terms + " (" + ul.children.length + ")");
    w.classList.add("ll-terms");
  }

  function start(){
    run(); terms();
    var li = document.getElementById("lesson-intro");
    if (li && window.MutationObserver) new MutationObserver(terms).observe(li, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
