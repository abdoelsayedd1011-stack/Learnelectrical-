/* لوحة الإدارة: أرقام الأعضاء، رسم الاشتراكات اليومية، قايمة الأعضاء، لينك باسورد جديد، تفعيل اشتراك Pro، ومسح عضو.
   الصفحة نفسها مفتوحة، بس كل /api/admin/* بيرجّع 403 لأي حد مش في ADMIN_EMAILS. */
(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  var OFFLINE = "مقدرناش نوصل للسيرفر. جرّب تاني بعد شوية.";
  var SITE_NAME = (window.SITE || {}).name || "LearnElectricals";
  var COURSE_NAMES = { basics: "أساسيات الكهربا", classic: "الكلاسيك كنترول", instr: "الإنسترومنتيشن" };
  var SIM_NAMES = { pf525: "PowerFlex 525", pf40: "PowerFlex 40", ab1336: "1336 PLUS II", v20: "SINAMICS V20", atv320: "Altivar ATV320",
    atv630: "Altivar ATV630", ms300: "Delta MS300", fc51: "Danfoss FC 51", e5cc: "Omron E5CC", servo: "Delta ASDA-B2", vfd: "محاكي الانفرتر الشامل" };

  function esc(t){ return String(t == null ? "" : t).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function get(path){
    return fetch(path, { credentials: "same-origin", cache: "no-store" }).then(function(r){ return r.json(); }).catch(function(){ return { ok: false, message: OFFLINE }; });
  }
  function post(path, body){
    return fetch(path, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then(function(r){ return r.json(); }).catch(function(){ return { ok: false, message: OFFLINE }; });
  }
  function fmtDate(t){ try { return new Date(t).toLocaleDateString("ar-EG-u-nu-latn", { year: "numeric", month: "short", day: "numeric" }); } catch (e){ return new Date(t).toISOString().slice(0, 10); } }
  function dayLabel(d){ var p = d.split("-"); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)).toLocaleDateString("ar-EG-u-nu-latn", { month: "short", day: "numeric", timeZone: "UTC" }); } catch (e){ return d; } }
  function ago(t){
    if (!t) return "لسه مدخلش";
    var m = Math.round((Date.now() - t) / 60000);
    if (m < 10) return "دلوقتي";
    if (m < 60) return "من " + m + " دقيقة";
    var h = Math.round(m / 60); if (h < 24) return "من " + h + " ساعة";
    var d = Math.round(h / 24); if (d < 31) return d === 1 ? "امبارح" : "من " + d + " يوم";
    return fmtDate(t);
  }
  function plural(n, one, many){ return n === 1 ? one : n + " " + many; }

  /* ---------- الأرقام والرسم ---------- */
  function drawChart(days){
    var box = $("chart"), read = $("chart-read");
    var W = Math.max(280, Math.round(box.clientWidth || 600)), H = 190, top = 14, bottom = 26, left = 8, right = 30, n = days.length;
    var max = Math.max(1, Math.max.apply(null, days.map(function(d){ return d.n; })));
    var step = max <= 4 ? 1 : Math.ceil(max / 4), ymax = step * Math.ceil(max / step);
    var plotH = H - top - bottom, slot = (W - left - right) / n, bw = Math.max(2, slot - 2); // فراغ 2px بين العواميد
    var y = function(v){ return top + plotH - v / ymax * plotH; };
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" class="chart-svg" role="img" aria-label="الحسابات الجديدة كل يوم آخر 30 يوم، أكبر يوم فيه ' + max + '">';
    for (var g = 0; g <= ymax; g += step){
      svg += '<line x1="' + left + '" x2="' + (W - right) + '" y1="' + y(g) + '" y2="' + y(g) + '" class="c-grid"/>' +
        '<text x="' + (W - right + 6) + '" y="' + (y(g) + 4) + '" class="c-ax" text-anchor="start">' + g + "</text>";
    }
    days.forEach(function(d, i){
      var x = left + i * slot + 1, h = d.n / ymax * plotH, yy = top + plotH - h, r = Math.min(4, bw / 2, h);
      if (d.n) svg += '<path class="c-bar" d="M' + x + " " + (top + plotH) + "V" + (yy + r) + "Q" + x + " " + yy + " " + (x + r) + " " + yy + "H" + (x + bw - r) + "Q" + (x + bw) + " " + yy + " " + (x + bw) + " " + (yy + r) + "V" + (top + plotH) + 'Z"/>';
      svg += '<rect class="c-hit" x="' + (x - 1) + '" y="' + top + '" width="' + slot + '" height="' + plotH + '" data-i="' + i + '"><title>' + esc(dayLabel(d.day)) + ": " + d.n + "</title></rect>";
      if ((i % 7 === 2 && i < n - 4) || i === n - 1) svg += '<text x="' + (x + bw / 2) + '" y="' + (H - 8) + '" class="c-ax" text-anchor="middle">' + esc(i === n - 1 ? "النهارده" : dayLabel(d.day)) + "</text>";
    });
    svg += '<line x1="' + left + '" x2="' + (W - right) + '" y1="' + (top + plotH) + '" y2="' + (top + plotH) + '" class="c-base"/></svg>';
    var table = '<table class="sr-only"><caption>حسابات جديدة كل يوم</caption><tr><th>اليوم</th><th>العدد</th></tr>' +
      days.map(function(d){ return "<tr><td>" + esc(d.day) + "</td><td>" + d.n + "</td></tr>"; }).join("") + "</table>";
    box.innerHTML = svg + table;
    var show = function(i){ var d = days[i]; read.textContent = dayLabel(d.day) + ": " + plural(d.n, "حساب واحد", d.n > 10 ? "حساب" : "حسابات").replace(/^0 .*/, "مفيش حسابات"); };
    box.querySelectorAll(".c-hit").forEach(function(h){
      h.addEventListener("mouseenter", function(){ h.classList.add("on"); show(+h.getAttribute("data-i")); });
      h.addEventListener("mouseleave", function(){ h.classList.remove("on"); read.textContent = ""; });
      h.addEventListener("click", function(){ show(+h.getAttribute("data-i")); });
    });
  }
  function bars(el, rows, total){
    if (!rows.length){ el.innerHTML = '<li class="adm-empty">لسه مفيش.</li>'; return; }
    var max = Math.max(1, total || Math.max.apply(null, rows.map(function(r){ return r.n; })));
    el.innerHTML = rows.map(function(r){
      return '<li><span class="b-l">' + esc(r.label) + '</span><span class="b-n">' + r.n + '</span><span class="b-t" aria-hidden="true"><i style="width:' + Math.round(r.n / max * 100) + '%"></i></span></li>';
    }).join("");
  }
  var lastDays = null;
  function loadStats(){
    return get("/api/admin/stats").then(function(r){
      if (!r.ok) return;
      $("st-total").textContent = r.total; $("st-today").textContent = r.today; $("st-week").textContent = r.week; $("st-month").textContent = r.month;
      drawChart(r.days);
      if (!lastDays){ var w = 0; window.addEventListener("resize", function(){ var cw = $("chart").clientWidth; if (Math.abs(cw - w) > 20){ w = cw; drawChart(lastDays); } }); }
      lastDays = r.days;
      var s = r.synced || {}, rows = [];
      Object.keys(COURSE_NAMES).forEach(function(k){ rows.push({ label: "كورس " + COURSE_NAMES[k], n: s[k] || 0 }); });
      Object.keys(SIM_NAMES).forEach(function(k){ if (s[k]) rows.push({ label: "محاكي " + SIM_NAMES[k], n: s[k] }); });
      bars($("synced"), rows, r.total);
      bars($("certs"), Object.keys(COURSE_NAMES).map(function(k){ return { label: COURSE_NAMES[k], n: (r.certs || {})[k] || 0 }; }), 0);
      $("active-week").textContent = "دخلوا الموقع آخر 7 أيام: " + r.active_week + " من " + r.total;
    });
  }

  /* ---------- الأعضاء ---------- */
  var list = $("mem-list"), more = $("mem-more"), count = $("mem-count"), q = "", offset = 0, seq = 0, meEmail = "", paywall = false;
  function isPro(m){ return m.plan === "pro" && m.pro_until > Date.now(); }
  function planTag(m){
    if (isPro(m)) return '<span class="mem-plan paid">Pro لحد ' + esc(fmtDate(m.pro_until)) + "</span>";
    return '<span class="mem-plan">' + (m.plan === "pro" && m.pro_until ? "مجاني · Pro خلص" : "مجاني") + "</span>";
  }
  function isoDay(t){ var d = new Date(t + 2 * 3600 * 1000); return d.toISOString().slice(0, 10); } // بتوقيت القاهرة
  function memberRow(m){
    var self = m.email === meEmail;
    return '<li class="mem" data-id="' + m.id + '" data-name="' + esc(m.name) + '" data-email="' + esc(m.email) + '" data-until="' + (isPro(m) ? m.pro_until : "") + '">' +
      '<div class="mem-top"><div class="mem-who"><b>' + esc(m.name) + (m.admin ? ' <span class="mem-tag">إدارة</span>' : "") + '</b><span class="ltr mem-email">' + esc(m.email) + "</span></div>" +
      planTag(m) + "</div>" +
      '<dl class="mem-facts"><div><dt>اشترك</dt><dd>' + esc(fmtDate(m.created_at)) + "</dd></div><div><dt>آخر دخول</dt><dd>" + esc(ago(m.last_seen)) + "</dd></div>" +
      "<div><dt>تقدّم متزامن</dt><dd>" + (m.synced ? m.synced + " حاجة" : "لأ") + "</dd></div><div><dt>شهادات</dt><dd>" + m.certs + "</dd></div></dl>" +
      '<div class="mem-act"><button class="btn btn-ghost" type="button" data-act="reset">لينك باسورد جديد</button><button class="btn btn-ghost" type="button" data-act="plan">تفعيل اشتراك</button>' +
      (self ? "" : '<button class="btn btn-ghost danger" type="button" data-act="ask-delete">امسح العضو</button>') + "</div>" +
      '<div class="mem-panel" hidden></div></li>';
  }
  function loadMembers(reset){
    var my = ++seq;
    if (reset){ offset = 0; }
    get("/api/admin/members?q=" + encodeURIComponent(q) + "&offset=" + offset).then(function(r){
      if (my !== seq) return;
      if (!r.ok){ count.textContent = r.message || OFFLINE; return; }
      var html = r.members.map(memberRow).join("");
      if (reset) list.innerHTML = html; else list.insertAdjacentHTML("beforeend", html);
      offset = r.offset + r.members.length; paywall = !!r.paywall;
      count.textContent = r.total ? (q ? "لقينا " + r.total + " عضو" : "كل الأعضاء: " + r.total) + (offset < r.total ? " (معروض " + offset + ")" : "") : (q ? "مفيش عضو بالاسم أو الإيميل ده." : "لسه مفيش أعضاء.");
      more.hidden = offset >= r.total;
    });
  }
  var timer = null;
  $("mem-q").addEventListener("input", function(){ clearTimeout(timer); var v = this.value.trim(); timer = setTimeout(function(){ q = v; loadMembers(true); }, 250); });
  $("mem-search").addEventListener("submit", function(e){ e.preventDefault(); clearTimeout(timer); q = $("mem-q").value.trim(); loadMembers(true); });
  more.addEventListener("click", function(){ loadMembers(false); });

  function panel(li, html){ var p = li.querySelector(".mem-panel"); p.innerHTML = html; p.hidden = !html; return p; }
  list.addEventListener("click", function(e){
    var b = e.target.closest("button[data-act]"); if (!b) return;
    var li = b.closest(".mem"), id = +li.getAttribute("data-id"), name = li.getAttribute("data-name"), act = b.getAttribute("data-act");
    if (act === "reset"){
      b.disabled = true;
      post("/api/admin/reset-link", { id: id }).then(function(r){
        b.disabled = false;
        if (!r.ok){ panel(li, '<p class="auth-msg" role="alert">' + esc(r.message || OFFLINE) + "</p>"); return; }
        var msg = "أهلاً " + name.split(" ")[0] + "، ده لينك تعمل بيه باسورد جديد لحسابك على " + SITE_NAME + " (شغال مرة واحدة لمدة 24 ساعة):\n" + r.link;
        var p = panel(li, '<p class="mem-pl">لينك باسورد جديد لـ <b>' + esc(name) + '</b>، شغال مرة واحدة لحد ' + esc(new Date(r.expires_at).toLocaleString("ar-EG-u-nu-latn", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })) + ":</p>" +
          '<label class="sr-only" for="lnk-' + id + '">اللينك</label><input class="mem-link ltr" id="lnk-' + id + '" readonly value="' + esc(r.link) + '">' +
          '<div class="mem-act"><button class="btn btn-primary" type="button" data-act="copy">انسخ اللينك</button><a class="btn btn-wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">ابعته واتساب</a><span class="copy-ok" role="status"></span></div>');
        p.querySelector("input").focus(); p.querySelector("input").select();
      });
    } else if (act === "copy"){
      var inp = li.querySelector(".mem-link"), ok = li.querySelector(".copy-ok");
      var done = function(){ ok.textContent = "اتنسخ ✓"; setTimeout(function(){ ok.textContent = ""; }, 2500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(inp.value).then(done, function(){ inp.select(); });
      else { inp.select(); try { document.execCommand("copy"); done(); } catch (x){} }
    } else if (act === "plan"){
      var until = +li.getAttribute("data-until") || 0, def = isoDay(until || Date.now() + 30 * 864e5), min = isoDay(Date.now() + 864e5);
      var pp = panel(li, '<div class="mem-pro" role="group" aria-labelledby="pl-' + id + '"><p id="pl-' + id + '" class="mem-pl">' + (until ? "<b>" + esc(name) + "</b> مشترك Pro لحد " + esc(fmtDate(until)) + ". تقدر تمدّ الاشتراك أو تلغيه." : "فعّل اشتراك Pro لـ <b>" + esc(name) + "</b> لحد اليوم اللي تختاره.") + "</p>" +
        '<label class="field mem-date" for="pu-' + id + '">Pro لحد يوم<input type="date" id="pu-' + id + '" class="ltr" min="' + min + '" value="' + def + '"></label>' +
        '<div class="mem-act"><button class="btn btn-primary" type="button" data-act="plan-save">' + (until ? "حدّث الاشتراك" : "فعّل الاشتراك") + "</button>" +
        (until ? '<button class="btn btn-ghost danger" type="button" data-act="plan-cancel">ألغِ الاشتراك</button>' : "") +
        '<button class="btn btn-ghost" type="button" data-act="cancel">اقفل</button></div>' +
        (paywall ? "" : '<p class="adm-note">الاشتراك المدفوع لسه مش مقفول على الموقع، فالأعضاء كلهم شايفين كل حاجة. اللي هتعمله هنا بيتسجّل ويشتغل أول ما الاشتراك يتفعّل.</p>') +
        '<p class="auth-msg" role="alert" hidden></p></div>');
      pp.querySelector("input").focus();
    } else if (act === "plan-save" || act === "plan-cancel"){
      var day = act === "plan-save" ? li.querySelector(".mem-date input").value : null, m2 = li.querySelector(".mem-pro .auth-msg");
      if (act === "plan-save" && !/^\d{4}-\d{2}-\d{2}$/.test(day || "")){ m2.textContent = "اختار يوم في المستقبل."; m2.hidden = false; return; }
      b.disabled = true;
      post("/api/admin/plan", { id: id, until: day }).then(function(r){
        b.disabled = false;
        if (!r.ok){ m2.textContent = r.error === "bad_request" ? "اختار يوم في المستقبل." : (r.message || OFFLINE); m2.hidden = false; return; }
        var mm = { plan: r.plan, pro_until: r.pro_until };
        li.setAttribute("data-until", isPro(mm) ? r.pro_until : "");
        li.querySelector(".mem-plan").outerHTML = planTag(mm);
        panel(li, '<p class="mem-pl" role="status">' + (r.plan === "pro" ? "اتفعّل اشتراك Pro لـ " + esc(name) + " لحد " + esc(fmtDate(r.pro_until)) + " ✓" : "اتلغى اشتراك " + esc(name) + "، ورجع مجاني.") + "</p>");
      });
    } else if (act === "ask-delete"){
      var p2 = panel(li, '<div class="mem-confirm" role="group" aria-labelledby="cf-' + id + '"><p id="cf-' + id + '">متأكد إنك عايز تمسح حساب <b>' + esc(name) + "</b>؟ هيتمسح معاه تقدّمه وشهاداته، ومفيش رجوع.</p>" +
        '<div class="mem-act"><button class="btn danger-solid" type="button" data-act="delete">أيوه، امسحه</button><button class="btn btn-ghost" type="button" data-act="cancel">لأ، سيبه</button></div></div>');
      p2.querySelector("[data-act=cancel]").focus();
    } else if (act === "cancel"){
      panel(li, ""); var ask = li.querySelector("[data-act=ask-delete]"); if (ask) ask.focus();
    } else if (act === "delete"){
      b.disabled = true;
      post("/api/admin/delete", { id: id }).then(function(r){
        if (!r.ok){ b.disabled = false; panel(li, '<p class="auth-msg" role="alert">' + esc(r.message || OFFLINE) + "</p>"); return; }
        li.remove(); count.textContent = "اتمسح حساب " + name + "."; loadStats();
      });
    }
  });

  /* ---------- البداية ---------- */
  function gate(msg, login){ $("adm-sub").textContent = ""; $("adm-gate-msg").textContent = msg; $("adm-login").hidden = !login; $("adm-gate").hidden = false; }
  get("/api/auth/me").then(function(r){
    if (!r.ok){ gate(r.message || OFFLINE, false); return; }
    if (!r.user){ gate("ادخل بحساب الإدارة الأول.", true); return; }
    if (!r.user.admin){ gate("الصفحة دي للإدارة بس. الحساب اللي انت داخل بيه مش من حسابات الإدارة.", false); return; }
    meEmail = r.user.email;
    $("adm-sub").textContent = "أهلاً يا " + r.user.name.split(" ")[0] + ". كل الأرقام من قاعدة البيانات مباشرة.";
    $("adm").hidden = false;
    loadStats(); loadMembers(true);
  });
})();
