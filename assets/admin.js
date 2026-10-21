/* لوحة الإدارة: أرقام الأعضاء، رسم الاشتراكات اليومية، طلبات الاشتراك، اللي اشتراكهم هيخلص، قايمة الأعضاء (بحث وفلاتر وتنزيل Excel)،
   نافذة العضو (الاشتراك، كورساته، الأجهزة، التقدّم، الشهادات، الملاحظات، الإيقاف، لينك باسورد، المسح)، الأسعار، إعلان فوق الموقع، وسجل العمليات.
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
      var on = r.online || 0;
      $("online-now").innerHTML = '<i class="dot' + (on ? " on" : "") + '" aria-hidden="true"></i>' + (on ? "متصلين دلوقتي: <b>" + on + "</b>" : "مفيش حد متصل دلوقتي");
      $("active-week").textContent = "دخلوا الموقع آخر 7 أيام: " + r.active_week + " من " + r.total;
      showExpiring(r.expiring || []);
    });
  }

  /* ---------- طلبات الاشتراك (subscribe.html → «أنا حوّلت») ---------- */
  var PLAN_AR = { monthly: "شهري", yearly: "سنوي" }, PLAN_DAYS = { monthly: 30, yearly: 365 };
  var METHOD_AR = { instapay: "InstaPay", vodafone: "فودافون كاش", intl: "من خارج مصر" };
  var prList = $("pr-list"), prDone = $("pr-done"), prCount = $("pr-count");
  function prodName(r){ return r.plan === "course" ? "كورس " + ((PRODUCT_NAMES[r.product]) || r.product) : "كل الكورسات " + (PLAN_AR[r.plan] || r.plan); }
  var PRODUCT_NAMES = { basics: "أساسيات الكهربا", classic: "الكلاسيك كنترول", drw: "قراية الرسومات الكهربية", instr: "الإنسترومنتيشن", plc: "الـ PLC", vfd: "الانفرتر VFD", srv: "السيرفو موتور والدرايف" };
  function money(r){ return "⁦" + r.amount + "⁩ " + (r.currency === "USD" ? "دولار" : ((window.SITE || {}).pay || {}).currency || "جنيه"); }
  function reqRow(r){
    var done = r.status !== "pending";
    var cur = isPro({ plan: r.user_plan, pro_until: r.pro_until }) ? "Pro لحد " + fmtDate(r.pro_until) : "مجاني";
    var tag = r.status === "approved" ? '<span class="mem-plan paid">اتفعّل' + (r.granted_until ? " لحد " + esc(fmtDate(r.granted_until)) : "") + "</span>" : r.status === "rejected" ? '<span class="mem-plan">اترفض</span>' : '<span class="pr-amount">' + esc(money(r)) + "</span>";
    return '<li class="mem" data-rid="' + r.id + '" data-name="' + esc(r.name || "") + '"><div class="mem-top"><div class="mem-who"><b>' + esc(r.name || "عضو اتمسح") + '</b><span class="ltr mem-email">' + esc(r.email || "") + "</span></div>" + tag + "</div>" +
      '<dl class="mem-facts"><div><dt>اشترى</dt><dd>' + esc(prodName(r)) + (r.plan === "course" ? " (سنة كاملة)" : " (" + (PLAN_DAYS[r.plan] || 30) + " يوم)") + "</dd></div><div><dt>عن طريق</dt><dd>" + esc(METHOD_AR[r.method] || r.method) + "</dd></div>" +
      (r.sender ? '<div><dt>حوّل من</dt><dd class="ltr">' + esc(r.sender) + "</dd></div>" : "") +
      "<div><dt>اتبعت</dt><dd>" + esc(ago(r.created_at)) + "</dd></div>" + (done ? "<div><dt>المبلغ</dt><dd>" + esc(money(r)) + "</dd></div>" : "<div><dt>دلوقتي</dt><dd>" + esc(cur) + "</dd></div>") + "</dl>" +
      (r.note ? '<p class="pr-note">' + esc(r.note) + "</p>" : "") +
      (done ? "" : '<div class="mem-act"><button class="btn btn-primary" type="button" data-pr="approve">فعّل ' + (r.plan === "course" ? "الكورس" : r.plan === "yearly" ? "سنة" : "شهر") + '</button><button class="btn btn-ghost danger" type="button" data-pr="ask-reject">ارفض</button></div>') +
      '<div class="mem-panel" hidden></div></li>';
  }
  function loadReqs(){
    return get("/api/admin/pay").then(function(r){
      if (!r.ok){ prCount.textContent = r.message || OFFLINE; return; }
      prList.innerHTML = r.requests.map(reqRow).join("");
      prBadge(r.requests.length);
      prCount.textContent = r.requests.length ? "مستنيين مراجعة: " + r.requests.length + ". اتأكد إن التحويل وصلك بنفس المبلغ قبل ما تفعّل." : "مفيش طلبات مستنية دلوقتي.";
    });
  }
  function loadDone(){
    return get("/api/admin/pay?status=recent").then(function(r){
      if (!r.ok) return;
      prDone.innerHTML = r.requests.length ? r.requests.map(reqRow).join("") : '<li class="adm-empty">لسه مفيش.</li>';
    });
  }
  $("pr-recent").addEventListener("click", function(){
    var open = prDone.hidden; prDone.hidden = !open; this.setAttribute("aria-expanded", open ? "true" : "false"); if (open) loadDone();
  });
  prList.addEventListener("click", function(e){
    var b = e.target.closest("button[data-pr]"); if (!b) return;
    var li = b.closest(".mem"), id = +li.getAttribute("data-rid"), name = li.getAttribute("data-name"), act = b.getAttribute("data-pr");
    var pnl = li.querySelector(".mem-panel"), show = function(h){ pnl.innerHTML = h; pnl.hidden = !h; };
    if (act === "ask-reject"){
      show('<div class="mem-confirm"><p>ترفض طلب <b>' + esc(name) + '</b>؟ اشتراكه مش هيتغيّر، وهيشوف إن الطلب اترفض.</p><div class="mem-act"><button class="btn danger-solid" type="button" data-pr="reject">أيوه، ارفض</button><button class="btn btn-ghost" type="button" data-pr="close">لأ</button></div></div>');
      pnl.querySelector("[data-pr=close]").focus(); return;
    }
    if (act === "close"){ show(""); return; }
    b.disabled = true;
    post("/api/admin/pay", { id: id, action: act }).then(function(r){
      if (!r.ok){ b.disabled = false; show('<p class="auth-msg" role="alert">' + esc(r.message || OFFLINE) + "</p>"); if (r.error === "already_done") loadReqs(); return; }
      li.querySelector(".mem-act").remove();
      show('<p class="mem-pl" role="status">' + (r.status === "approved" ? (r.course ? "اتفعّل كورس " + esc(PRODUCT_NAMES[r.course] || r.course) + " لـ " + esc(name) + " ✓" : "اتفعّل اشتراك Pro لـ " + esc(name) + " لحد " + esc(fmtDate(r.pro_until)) + " ✓") : "اترفض الطلب.") + "</p>");
      var n = prList.querySelectorAll(".mem-act").length;
      prCount.textContent = n ? "مستنيين مراجعة: " + n + "." : "خلّصت كل الطلبات ✓"; prBadge(n);
      if (r.status === "approved"){
        if (!r.course) refreshRow(r.user_id, { plan: "pro", pro_until: r.pro_until });
        if (mdId === r.user_id) openMember(mdId);
      }
      if (!prDone.hidden) loadDone();
      loadLog(0);
    });
  });

  /* ---------- الأعضاء: صف صغير لكل عضو، والتفاصيل والأزرار في نافذة العضو ---------- */
  var list = $("mem-list"), more = $("mem-more"), count = $("mem-count"), q = "", filter = "", offset = 0, seq = 0, meEmail = "", paywall = false, pagedMore = false;
  var ONLINE_MS = 4 * 60 * 1000, rows = {};
  var FILTER_AR = { pro: "المشتركين", free: "المجانيين", suspended: "الموقوفين", idle: "اللي مدخلوش من 30 يوم" };
  function isOnline(m){ return m.last_seen && Date.now() - m.last_seen < ONLINE_MS; }
  function isPro(m){ return m.plan === "pro" && m.pro_until > Date.now(); }
  function planTag(m){
    if (isPro(m)) return '<span class="mem-plan paid">Pro لحد ' + esc(fmtDate(m.pro_until)) + "</span>";
    return '<span class="mem-plan">' + (m.plan === "pro" && m.pro_until ? "مجاني · Pro خلص" : "مجاني") + "</span>";
  }
  function isoDay(t){ var d = new Date(t + 2 * 3600 * 1000); return d.toISOString().slice(0, 10); } // بتوقيت القاهرة
  function memberRow(m){
    rows[m.id] = m;
    return '<li class="mem mem-row' + (m.suspended ? " is-off" : "") + '" data-id="' + m.id + '"><button type="button" class="mem-open" data-open="' + m.id + '" aria-haspopup="dialog">' +
      '<span class="mem-top"><span class="mem-who"><b>' + (isOnline(m) ? '<i class="dot on" title="متصل دلوقتي" aria-label="متصل دلوقتي"></i>' : "") + esc(m.name) + (m.admin ? ' <span class="mem-tag">إدارة</span>' : "") + (m.suspended ? ' <span class="mem-tag off">موقوف</span>' : "") + '</b><span class="ltr mem-email">' + esc(m.email) + "</span></span>" +
      planTag(m) + "</span>" +
      '<span class="mem-line">' + (isOnline(m) ? '<span class="on-txt">متصل دلوقتي</span>' : m.last_seen ? "آخر دخول " + esc(ago(m.last_seen)) : "لسه مدخلش") + " · اشترك " + esc(fmtDate(m.created_at)) + (m.certs ? " · " + m.certs + " شهادة" : "") + '<span class="mem-go" aria-hidden="true">التفاصيل ←</span></span>' +
      "</button></li>";
  }
  function xlsHref(){ return "/api/admin/export?q=" + encodeURIComponent(q) + "&f=" + encodeURIComponent(filter); }
  function loadMembers(reset){
    var my = ++seq;
    if (reset){ offset = 0; pagedMore = false; }
    $("mem-xls").href = xlsHref();
    get("/api/admin/members?q=" + encodeURIComponent(q) + "&f=" + encodeURIComponent(filter) + "&offset=" + offset).then(function(r){
      if (my !== seq) return;
      if (!r.ok){ count.textContent = r.message || OFFLINE; return; }
      var html = r.members.map(memberRow).join("");
      if (reset) list.innerHTML = html; else list.insertAdjacentHTML("beforeend", html);
      offset = r.offset + r.members.length; paywall = !!r.paywall;
      var narrowed = q || filter;
      count.textContent = r.total ? (narrowed ? "لقينا " + r.total + " عضو" + (filter ? " من " + FILTER_AR[filter] : "") : "كل الأعضاء: " + r.total) + (offset < r.total ? " (معروض " + offset + ")" : "") : (narrowed ? "مفيش أعضاء بالبحث أو الفلتر ده." : "لسه مفيش أعضاء.");
      more.hidden = offset >= r.total;
    });
  }
  var timer = null;
  $("mem-q").addEventListener("input", function(){ clearTimeout(timer); var v = this.value.trim(); timer = setTimeout(function(){ q = v; loadMembers(true); }, 250); });
  $("mem-search").addEventListener("submit", function(e){ e.preventDefault(); clearTimeout(timer); q = $("mem-q").value.trim(); loadMembers(true); });
  more.addEventListener("click", function(){ pagedMore = true; loadMembers(false); });
  $("mem-chips").addEventListener("click", function(e){
    var c = e.target.closest(".chip"); if (!c) return;
    filter = c.getAttribute("data-f") || "";
    this.querySelectorAll(".chip").forEach(function(x){ x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
    loadMembers(true);
  });
  function refreshRow(id, patch){
    var m = rows[id], li = list.querySelector('.mem[data-id="' + id + '"]');
    if (!m || !li) return;
    Object.keys(patch).forEach(function(k){ m[k] = patch[k]; });
    li.outerHTML = memberRow(m);
  }
  list.addEventListener("click", function(e){ var b = e.target.closest("[data-open]"); if (b) openMember(+b.getAttribute("data-open")); });

  /* ---------- نافذة العضو ---------- */
  var md = $("md"), mdBody = $("md-body"), mdId = 0, mdData = null, mdOpener = null;
  var ACTION_AR = { suspend: "وقّف الحساب", unsuspend: "رجّع الحساب", kick: "خرّجه من جهاز", plan: "غيّر الاشتراك", plan_cancel: "لغى الاشتراك",
    pay_approve: "وافق على طلب اشتراك", pay_reject: "رفض طلب اشتراك", note: "عدّل الملاحظات", banner: "غيّر الإعلان", "delete": "مسح عضو",
    reset_link: "عمل لينك باسورد جديد", "export": "نزّل Excel", course_grant: "إدّاله كورس", course_extend: "مدّ كورس سنة", course_remove: "شال كورس", prices: "غيّر الأسعار" };
  var STATUS_AR = { pending: "مستني مراجعة", approved: "اتفعّل", rejected: "اترفض" };
  function fmtWhen(t){ try { return new Date(t).toLocaleString("ar-EG-u-nu-latn", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }); } catch (e){ return fmtDate(t); } }
  function country(c){ if (!c) return ""; try { return new Intl.DisplayNames(["ar"], { type: "region" }).of(c) || c; } catch (e){ return c; } }
  function box(key, title, inner){ return '<section class="md-box" data-box="' + key + '"><h3>' + title + "</h3>" + inner + '<p class="auth-msg md-msg" role="status" hidden></p></section>'; }
  function flash(key, text){ var b = mdBody.querySelector('[data-box="' + key + '"] .md-msg'); if (b){ b.textContent = text || ""; b.hidden = !text; } }
  function renderMd(d){
    var m = d.member, pro = isPro(m), on = isOnline(m);
    $("md-who").innerHTML = '<b id="md-name">' + (on ? '<i class="dot on" aria-label="متصل دلوقتي"></i>' : '<i class="dot" aria-hidden="true"></i>') + esc(m.name) +
      (m.admin ? ' <span class="mem-tag">إدارة</span>' : "") + (m.suspended ? ' <span class="mem-tag off">موقوف</span>' : "") + '</b><span class="ltr mem-email">' + esc(m.email) + "</span>";
    var h = '<dl class="mem-facts"><div><dt>اشترك</dt><dd>' + esc(fmtDate(m.created_at)) + "</dd></div><div><dt>آخر دخول</dt><dd>" + (on ? '<span class="on-txt">متصل دلوقتي</span>' : esc(ago(m.last_seen))) + "</dd></div>" +
      "<div><dt>الخطة</dt><dd>" + (pro ? "Pro" : (m.plan === "pro" && m.pro_until ? "مجاني · Pro خلص" : "مجاني")) + "</dd></div><div><dt>الاشتراك لحد</dt><dd>" + (pro ? esc(fmtDate(m.pro_until)) : "—") + "</dd></div></dl>";
    if (m.suspended) h += '<p class="md-off" role="note"><b>الحساب ده موقوف</b> من ' + esc(fmtWhen(m.suspended_at)) + (m.suspend_reason ? ": " + esc(m.suspend_reason) : "") + "</p>";

    // الاشتراك
    var min = isoDay(Date.now() + 864e5), def = isoDay(pro ? m.pro_until : Date.now() + 30 * 864e5);
    h += box("plan", "الاشتراك", '<p class="mem-pl">' + (pro ? "مشترك Pro لحد <b>" + esc(fmtDate(m.pro_until)) + "</b>. المدة بتتزوّد على اللي فاضل." : "مش مشترك دلوقتي. المدة بتبدأ من النهارده.") + "</p>" +
      '<div class="mem-act"><button class="btn btn-ghost" type="button" data-md="add" data-days="30">+ 30 يوم</button><button class="btn btn-ghost" type="button" data-md="add" data-days="365">+ سنة</button></div>' +
      '<div class="md-row"><label class="field mem-date" for="md-until">لحد يوم معيّن<input type="date" id="md-until" class="ltr" min="' + min + '" value="' + def + '"></label><button class="btn btn-ghost" type="button" data-md="until">ثبّت التاريخ</button></div>' +
      (pro ? '<div class="mem-act"><button class="btn btn-ghost danger" type="button" data-md="ask-cancel">ألغِ الاشتراك ورجّعه مجاني</button></div>' : "") +
      '<div class="md-confirm" data-c="cancel" hidden><p>تلغي اشتراك <b>' + esc(m.name) + '</b> وترجّعه مجاني دلوقتي؟</p><div class="mem-act"><button class="btn danger-solid" type="button" data-md="cancel-plan">أيوه، ألغيه</button><button class="btn btn-ghost" type="button" data-md="no">لأ</button></div></div>' +
      (d.paywall ? "" : '<p class="adm-note">الاشتراك المدفوع لسه مش مقفول على الموقع، فالأعضاء كلهم شايفين كل حاجة. اللي هتعمله هنا بيتسجّل ويشتغل أول ما الاشتراك يتفعّل.</p>'));

    // كورساته (اشتراها أو الإدارة إدّتهاله) — كل كورس مفتوح سنة، و«مدّ سنة» بتزوّد سنة على آخر يوم (أو من النهارده لو خلص)
    var own = d.owned || [], ownIds = own.map(function(c){ return c.course; });
    var left = (d.products || []).filter(function(p){ return ownIds.indexOf(p.id) < 0; });
    var SRC_AR = { pay: "اشتراه", admin: "من الإدارة" };
    h += box("own", "كورساته", (own.length ? '<ul class="md-list">' + own.map(function(c){
      return '<li><div class="md-li-main"><b>' + esc(c.title) + "</b><span>" + esc(SRC_AR[c.source] || c.source) + " · " + esc(fmtDate(c.granted_at)) + " · " + (c.active === false ? "<b>خلص " + esc(fmtDate(c.until)) + "</b>" : "لحد " + esc(fmtDate(c.until))) + (c.note ? " · " + esc(c.note) : "") + "</span></div>" +
        '<span class="mem-act"><button class="btn btn-ghost md-sm" type="button" data-md="extend" data-course="' + esc(c.course) + '">مدّ سنة</button><button class="btn btn-ghost danger md-sm" type="button" data-md="ask-uncourse" data-course="' + esc(c.course) + '">شيله</button></span></li>' +
        '<li class="md-confirm" data-c="uncourse-' + esc(c.course) + '" hidden><p>تشيل كورس <b>' + esc(c.title) + "</b> من " + esc(m.name) + '؟</p><div class="mem-act"><button class="btn danger-solid" type="button" data-md="uncourse" data-course="' + esc(c.course) + '">أيوه، شيله</button><button class="btn btn-ghost" type="button" data-md="no">لأ</button></div></li>';
    }).join("") + "</ul>" : '<p class="adm-empty">مفيش كورسات متسجّلة عليه.' + (pro ? " (مشترك Pro، فكل الكورسات مفتوحة له)" : "") + "</p>") +
      (left.length ? '<div class="md-own"><label class="sr-only" for="md-course">الكورس</label><select id="md-course">' + left.map(function(p){ return '<option value="' + esc(p.id) + '">' + esc(p.title) + "</option>"; }).join("") +
        '</select><button class="btn btn-ghost" type="button" data-md="give">إدّيله كورس</button></div>' : ""));

    // الأجهزة
    var dv = d.devices;
    h += box("dev", "الأجهزة <small>(" + dv.length + " من " + d.max_devices + ")</small>", (dv.length ? '<ul class="md-list">' + dv.map(function(x){
      return '<li><div class="md-li-main"><b>' + esc(x.device) + (x.current ? ' <span class="mem-tag">الجهاز ده</span>' : "") + "</b><span>" + (x.country ? esc(country(x.country)) + " · " : "") +
        (x.created_at ? "دخل " + esc(fmtDate(x.created_at)) : "") + (x.last_seen ? " · آخر نشاط " + esc(ago(x.last_seen)) : "") + "</span></div>" +
        (x.current ? "" : '<button class="btn btn-ghost danger md-sm" type="button" data-md="kick" data-sid="' + esc(x.sid) + '">خرّجه</button>') + "</li>";
    }).join("") + "</ul>" : '<p class="adm-empty">مش داخل من أي جهاز دلوقتي.</p>') +
      (dv.some(function(x){ return !x.current; }) ? '<div class="mem-act"><button class="btn btn-ghost danger" type="button" data-md="kick-all">خرّجه من كل الأجهزة</button></div>' : "") +
      '<p class="adm-note">بالكتير ' + d.max_devices + " أجهزة في نفس الوقت. لو دخل من جهاز زيادة، أقدم جهاز بيخرج لوحده.</p>");

    // التقدّم
    h += box("prog", "التقدّم في الكورسات", '<ul class="adm-bars">' + d.courses.map(function(c){
      var pct = c.total ? Math.round(c.done / c.total * 100) : 0;
      return '<li><span class="b-l">' + esc(c.title) + '</span><span class="b-n">' + (c.started ? (c.total ? pct + "%" : "؟") : "—") + '</span><span class="b-t" aria-hidden="true"><i style="width:' + pct + '%"></i></span></li>';
    }).join("") + "</ul>");

    // الشهادات
    h += box("cert", "الشهادات", d.certs.length ? '<ul class="md-list">' + d.certs.map(function(c){
      return '<li><div class="md-li-main"><b>' + esc(c.course_title) + "</b><span>" + esc(c.name) + " · " + esc(fmtDate(c.issued_at)) + '</span></div><a class="ltr md-code" href="cert.html?c=' + encodeURIComponent(c.code) + '" target="_blank" rel="noopener">' + esc(c.code) + "</a></li>";
    }).join("") + "</ul>" : '<p class="adm-empty">لسه مخدش شهادات.</p>');

    // طلبات الدفع
    h += box("pay", "طلبات الاشتراك", d.pays.length ? '<ul class="md-list">' + d.pays.map(function(r){
      return '<li><div class="md-li-main"><b>' + esc(prodName(r)) + " · " + esc(money(r)) + "</b><span>" + esc(METHOD_AR[r.method] || r.method) + (r.sender ? ' · <span class="ltr">' + esc(r.sender) + "</span>" : "") + " · " + esc(fmtDate(r.created_at)) + "</span></div>" +
        '<span class="mem-plan' + (r.status === "approved" ? " paid" : "") + '">' + esc(STATUS_AR[r.status] || r.status) + "</span></li>";
    }).join("") + "</ul>" : '<p class="adm-empty">مبعتش طلبات اشتراك.</p>');

    // ملاحظات
    h += box("note", "ملاحظات الإدارة <small>(محدش بيشوفها غير الإدارة)</small>", '<label class="sr-only" for="md-note">ملاحظات</label><textarea id="md-note" class="md-note" rows="3" maxlength="2000" placeholder="أي حاجة عايز تفتكرها عن العضو ده">' + esc(m.admin_note || "") + "</textarea>" +
      '<div class="mem-act"><button class="btn btn-primary" type="button" data-md="note">احفظ الملاحظات</button>' + (m.admin_note_at ? '<span class="md-when">آخر تعديل ' + esc(ago(m.admin_note_at)) + "</span>" : "") + "</div>");

    // الحساب: إيقاف، باسورد، مسح
    var acc = "";
    if (!m.self){
      acc += m.suspended
        ? '<div class="mem-act"><button class="btn btn-primary" type="button" data-md="unsuspend">رجّع الحساب</button></div>'
        : '<div class="mem-act"><button class="btn btn-ghost danger" type="button" data-md="ask-suspend">وقّف الحساب</button></div>' +
          '<div class="md-confirm" data-c="suspend" hidden><p>لو وقّفت حساب <b>' + esc(m.name) + "</b> هيخرج من كل الأجهزة دلوقتي، ومش هيقدر يدخل لحد ما ترجّعه.</p>" +
          '<label class="field" for="md-reason">السبب (اختياري، للإدارة بس)<input id="md-reason" type="text" maxlength="200"></label>' +
          '<div class="mem-act"><button class="btn danger-solid" type="button" data-md="suspend">أيوه، وقّفه</button><button class="btn btn-ghost" type="button" data-md="no">لأ</button></div></div>';
    }
    acc += '<div class="mem-act"><button class="btn btn-ghost" type="button" data-md="reset">لينك باسورد جديد</button>' + (m.self ? "" : '<button class="btn btn-ghost danger" type="button" data-md="ask-delete">امسح العضو</button>') + "</div>" +
      '<div class="md-reset" hidden></div>' +
      '<div class="md-confirm" data-c="delete" hidden><p>متأكد إنك عايز تمسح حساب <b>' + esc(m.name) + "</b>؟ هيتمسح معاه تقدّمه وشهاداته، ومفيش رجوع.</p>" +
      '<div class="mem-act"><button class="btn danger-solid" type="button" data-md="delete">أيوه، امسحه</button><button class="btn btn-ghost" type="button" data-md="no">لأ، سيبه</button></div></div>';
    h += box("acc", "الحساب", acc);

    if (d.log.length) h += box("log", "آخر العمليات على العضو ده", '<ul class="md-list md-log">' + d.log.map(function(l){
      return '<li><div class="md-li-main"><b>' + esc(ACTION_AR[l.action] || l.action) + "</b>" + (l.details ? '<span class="md-det">' + esc(l.details) + "</span>" : "") + "<span>" + esc(fmtWhen(l.at)) + "</span></div></li>";
    }).join("") + "</ul>");
    mdBody.innerHTML = h;
  }
  function openMember(id, after){
    mdId = id;
    if (!md.open){
      mdOpener = document.activeElement;
      $("md-who").innerHTML = '<b id="md-name">بنحمّل…</b>'; mdBody.innerHTML = "";
      if (md.showModal) md.showModal(); else md.setAttribute("open", "");
      document.documentElement.classList.add("md-lock");
    }
    return get("/api/admin/member?id=" + id).then(function(r){
      if (id !== mdId) return;
      if (!r.ok){ mdBody.innerHTML = '<p class="auth-msg" role="alert">' + esc(r.message || OFFLINE) + "</p>"; return; }
      var y = mdBody.scrollTop;
      mdData = r; renderMd(r); mdBody.scrollTop = y;
      var m = r.member; refreshRow(id, { plan: m.plan, pro_until: m.pro_until, suspended: m.suspended, last_seen: m.last_seen, name: m.name });
      if (after) after();
    });
  }
  function closeMd(){ if (md.close) md.close(); else md.removeAttribute("open"); }
  md.addEventListener("close", function(){ mdId = 0; document.documentElement.classList.remove("md-lock"); if (mdOpener && mdOpener.focus && document.body.contains(mdOpener)) mdOpener.focus(); });
  $("md-x").addEventListener("click", closeMd);
  md.addEventListener("click", function(e){ if (e.target === md) closeMd(); }); // الضغط على الخلفية بيقفل
  function confirmBox(key, show){ var c = mdBody.querySelector('[data-c="' + key + '"]'); if (c){ c.hidden = !show; if (show){ var f = c.querySelector("input,button"); if (f) f.focus(); } } }
  // POST then reload the details; text = what to say in that box when it worked
  function act(b, boxKey, path, body, text){
    b.disabled = true; flash(boxKey, "");
    return post(path, body).then(function(r){
      b.disabled = false;
      if (!r.ok){ flash(boxKey, r.error === "bad_request" && boxKey === "plan" ? "اختار يوم في المستقبل." : (r.message || OFFLINE)); return r; }
      var msg = typeof text === "function" ? text(r) : text;
      openMember(mdId, function(){ flash(boxKey, msg); });
      loadLog(0);
      return r;
    });
  }
  mdBody.addEventListener("click", function(e){
    var b = e.target.closest("button[data-md]"); if (!b || !mdData) return;
    var a = b.getAttribute("data-md"), m = mdData.member, id = m.id, name = m.name;
    if (a === "no"){ var c = b.closest(".md-confirm"); if (c) c.hidden = true; return; }
    if (a === "add") act(b, "plan", "/api/admin/plan", { id: id, add_days: +b.getAttribute("data-days") }, function(r){ return "اتمدّ الاشتراك لحد " + fmtDate(r.pro_until) + " ✓"; });
    else if (a === "until"){
      var day = $("md-until").value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "")){ flash("plan", "اختار يوم في المستقبل."); return; }
      act(b, "plan", "/api/admin/plan", { id: id, until: day }, function(r){ return "Pro لحد " + fmtDate(r.pro_until) + " ✓"; });
    }
    else if (a === "ask-cancel") confirmBox("cancel", true);
    else if (a === "cancel-plan") act(b, "plan", "/api/admin/plan", { id: id, until: null }, "اتلغى الاشتراك، ورجع مجاني.");
    else if (a === "give"){ var cid = $("md-course").value; act(b, "own", "/api/admin/course", { id: id, course: cid, action: "grant" }, function(r){ return "اتفعّل كورس " + (PRODUCT_NAMES[cid] || cid) + " لحد " + fmtDate(r.until) + " ✓"; }); }
    else if (a === "extend"){ var ec = b.getAttribute("data-course"); act(b, "own", "/api/admin/course", { id: id, course: ec, action: "extend" }, function(r){ return "كورس " + (PRODUCT_NAMES[ec] || ec) + " بقى لحد " + fmtDate(r.until) + " ✓"; }); }
    else if (a === "ask-uncourse") confirmBox("uncourse-" + b.getAttribute("data-course"), true);
    else if (a === "uncourse") act(b, "own", "/api/admin/course", { id: id, course: b.getAttribute("data-course"), action: "remove" }, "اتشال الكورس.");
    else if (a === "kick") act(b, "dev", "/api/admin/kick", { id: id, sid: b.getAttribute("data-sid") }, "خرج من الجهاز ده. أول ما يفتح الموقع عليه هيلاقي صفحة الدخول.");
    else if (a === "kick-all") act(b, "dev", "/api/admin/kick", { id: id, all: true }, "خرج من كل الأجهزة ✓");
    else if (a === "note") act(b, "note", "/api/admin/note", { id: id, note: $("md-note").value }, "اتحفظت الملاحظات ✓");
    else if (a === "ask-suspend") confirmBox("suspend", true);
    else if (a === "suspend") act(b, "acc", "/api/admin/suspend", { id: id, suspend: true, reason: $("md-reason").value }, "اتوقف الحساب وخرج من كل الأجهزة.");
    else if (a === "unsuspend") act(b, "acc", "/api/admin/suspend", { id: id, suspend: false }, "رجع الحساب، ويقدر يدخل تاني ✓");
    else if (a === "ask-delete") confirmBox("delete", true);
    else if (a === "delete"){
      b.disabled = true;
      post("/api/admin/delete", { id: id }).then(function(r){
        if (!r.ok){ b.disabled = false; flash("acc", r.message || OFFLINE); return; }
        var li = list.querySelector('.mem[data-id="' + id + '"]'); if (li) li.remove();
        mdOpener = null; closeMd(); count.textContent = "اتمسح حساب " + name + "."; loadStats(); loadLog(0);
      });
    }
    else if (a === "reset"){
      b.disabled = true;
      post("/api/admin/reset-link", { id: id }).then(function(r){
        b.disabled = false;
        var box = mdBody.querySelector(".md-reset");
        if (!r.ok){ flash("acc", r.message || OFFLINE); return; }
        var msg = "أهلاً " + name.split(" ")[0] + "، ده لينك تعمل بيه باسورد جديد لحسابك على " + SITE_NAME + " (شغال مرة واحدة لمدة 24 ساعة):\n" + r.link;
        box.innerHTML = '<p class="mem-pl">لينك باسورد جديد، شغال مرة واحدة لحد ' + esc(new Date(r.expires_at).toLocaleString("ar-EG-u-nu-latn", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })) + ":</p>" +
          '<label class="sr-only" for="md-lnk">اللينك</label><input class="mem-link ltr" id="md-lnk" readonly value="' + esc(r.link) + '">' +
          '<div class="mem-act"><button class="btn btn-primary" type="button" data-md="copy">انسخ اللينك</button><a class="btn btn-wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">ابعته واتساب</a><span class="copy-ok" role="status"></span></div>';
        box.hidden = false; box.querySelector("input").focus(); box.querySelector("input").select();
        loadLog(0);
      });
    }
    else if (a === "copy"){
      var inp = $("md-lnk"), ok = mdBody.querySelector(".copy-ok");
      var done = function(){ ok.textContent = "اتنسخ ✓"; setTimeout(function(){ ok.textContent = ""; }, 2500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(inp.value).then(done, function(){ inp.select(); });
      else { inp.select(); try { document.execCommand("copy"); done(); } catch (x){} }
    }
  });

  /* ---------- هتخلص خلال 7 أيام ---------- */
  function showExpiring(rows){
    $("ex-sec").hidden = !rows.length;
    $("ex-list").innerHTML = rows.map(function(m){
      var d = Math.max(0, Math.ceil((m.pro_until - Date.now()) / 864e5));
      return '<li><button type="button" class="ex-item" data-open="' + m.id + '" aria-haspopup="dialog"><span class="mem-who"><b>' + esc(m.name) + (m.suspended ? ' <span class="mem-tag off">موقوف</span>' : "") + '</b><span class="ltr mem-email">' + esc(m.email) + '</span></span><span class="ex-left">' +
        (d <= 1 ? "بكرة" : "بعد " + d + " أيام") + "<small>" + esc(fmtDate(m.pro_until)) + "</small></span></button></li>";
    }).join("");
  }
  $("ex-list").addEventListener("click", function(e){ var b = e.target.closest("[data-open]"); if (b) openMember(+b.getAttribute("data-open")); });

  /* ---------- الأسعار ---------- */
  var pxForm = $("px-form"), pxMsg = $("px-msg"), pxProducts = [];
  function pxSay(t){ pxMsg.textContent = t; pxMsg.hidden = !t; }
  function pxVal(v){ return v ? String(v) : ""; }
  function fillPrices(r){
    pxProducts = r.products; var p = r.prices, D = r.defaults || {};
    var num = function(f, lab, c, d, x, opt){
      return '<label class="field">' + lab + '<input type="number" min="0" step="1" inputmode="decimal" class="ltr" data-f="' + f + '" value="' + esc(pxVal(c[f])) + '" placeholder="' + esc(d[f] ? String(d[f]) : opt ? "اختياري" : "") + '" aria-label="' + esc(lab) + " · " + esc(x.title) + '"></label>';
    };
    $("px-list").innerHTML = r.products.map(function(x){
      var c = p.courses[x.id] || {}, d = D[x.id] || {};
      return '<li class="px-row" data-id="' + esc(x.id) + '"><b>' + esc(x.title) + "</b>" +
        num("price", "السعر (جنيه)", c, d, x) + num("was", "قبل الخصم", c, d, x, true) +
        num("usd", "من برّه مصر ($)", c, d, x) + num("usd_was", "قبل الخصم ($)", c, d, x, true) +
        '<label class="field px-link">لينك الدفع بالكارت <small>(اختياري: Lemon Squeezy أو Gumroad أو Paymob)</small><input type="url" class="ltr" data-f="link" maxlength="500" value="' + esc(c.link || "") + '" placeholder="https://…" aria-label="لينك الدفع بالكارت · ' + esc(x.title) + '"></label>' +
        '<label class="bn-on"><input type="checkbox" data-f="on"' + (c.on ? " checked" : "") + "> للبيع</label></li>";
    }).join("");
    $("px-instapay").value = p.instapay || ""; $("px-vodafone").value = p.vodafone || ""; $("px-whatsapp").value = p.whatsapp || "";
    $("px-note").textContent = "سعر كل كورس بالجنيه، بيفتح للطالب سنة كاملة. السعر بالدولار للي بيشتري من برّه مصر. الخانة الفاضية بترجع للسعر الافتراضي، وشيل علامة «للبيع» عشان الكورس يظهر «قريب» من غير زرار شرا. لو مفيش لينك دفع، اللي برّه مصر بيكلّمك على واتساب." +
      (r.paywall ? "" : " الدروس لسه مفتوحة لكل الأعضاء (القفل مش متفعّل)، فالأسعار بتظهر بس، ومحدش بيتقفل عليه حاجة.");
  }
  function loadPrices(){ return get("/api/admin/prices").then(function(r){ if (r.ok) fillPrices(r); }); }
  pxForm.addEventListener("submit", function(e){
    e.preventDefault();
    var courses = {}, btn = pxForm.querySelector("button[type=submit]");
    pxForm.querySelectorAll(".px-row").forEach(function(li){
      var v = function(f){ return li.querySelector("[data-f=" + f + "]").value.trim(); };
      courses[li.getAttribute("data-id")] = { price: v("price"), was: v("was"), usd: v("usd"), usd_was: v("usd_was"), link: v("link"), on: li.querySelector("[data-f=on]").checked };
    });
    btn.disabled = true; pxSay("");
    post("/api/admin/prices", { courses: courses, monthly: "", yearly: "",
      instapay: $("px-instapay").value.trim(), vodafone: $("px-vodafone").value.trim(), whatsapp: $("px-whatsapp").value.trim() }).then(function(r){
      btn.disabled = false;
      if (!r.ok){ pxSay(r.error === "bad_request" ? "فيه سعر مكتوب غلط. اكتب أرقام بس." : (r.message || OFFLINE)); return; }
      fillPrices(r);
      var off = r.products.filter(function(x){ var c = r.prices.courses[x.id]; return !c.on; }).length;
      pxSay("اتحفظ ✓ الأسعار هتظهر على الموقع في خلال دقيقة." + (off ? " (" + off + " كورس مش للبيع هيظهر «قريب»)" : ""));
      loadLog(0);
    });
  });

  /* ---------- إعلان فوق الموقع ---------- */
  var bnForm = $("bn-form"), bnMsg = $("bn-msg");
  function loadBanner(){
    return get("/api/admin/banner").then(function(r){
      if (!r.ok) return;
      $("bn-text").value = r.banner.text || ""; $("bn-link").value = r.banner.link || ""; $("bn-on").checked = !!r.banner.on;
    });
  }
  bnForm.addEventListener("submit", function(e){
    e.preventDefault();
    var btn = bnForm.querySelector("button[type=submit]"), text = $("bn-text").value.trim(), on = $("bn-on").checked;
    var say = function(t){ bnMsg.textContent = t; bnMsg.hidden = !t; };
    if (on && !text){ say("اكتب نص الإعلان الأول."); return; }
    btn.disabled = true; say("");
    post("/api/admin/banner", { text: text, link: $("bn-link").value.trim(), on: on }).then(function(r){
      btn.disabled = false;
      if (!r.ok){ say(r.error === "bad_request" ? "اللينك لازم يبدأ بـ / (صفحة في الموقع) أو https://" : (r.message || OFFLINE)); return; }
      say(r.banner.on ? "اتحفظ ✓ الإعلان هيظهر للزوار في خلال دقيقة." : "اتحفظ ✓ الإعلان مقفول دلوقتي.");
      loadLog(0);
    });
  });

  /* ---------- سجل العمليات ---------- */
  var lgOffset = 0, lgPage = 20;
  function loadLog(off){
    return get("/api/admin/log?offset=" + off).then(function(r){
      if (!r.ok){ $("lg-count").textContent = r.message || OFFLINE; return; }
      lgOffset = r.offset; lgPage = r.page;
      $("lg-list").innerHTML = r.rows.length ? r.rows.map(function(l){
        var who = l.target_id ? (l.target_name || l.target_email || "عضو اتمسح") : "";
        return '<li><div class="lg-what"><b>' + esc(ACTION_AR[l.action] || l.action) + "</b>" +
          (who ? (l.target_name ? ' <button type="button" class="link-btn" data-open="' + l.target_id + '">' + esc(who) + "</button>" : " " + esc(who)) : "") + "</div>" +
          (l.details ? '<p class="lg-det">' + esc(l.details) + "</p>" : "") +
          '<span class="lg-meta">' + esc(fmtWhen(l.at)) + '</span><span class="lg-meta ltr">' + esc(l.admin_email) + "</span></li>";
      }).join("") : '<li class="adm-empty">لسه مفيش عمليات.</li>';
      $("lg-count").textContent = r.total ? "كل العمليات: " + r.total + (r.total > r.page ? " · صفحة " + (Math.floor(r.offset / r.page) + 1) + " من " + Math.ceil(r.total / r.page) : "") : "";
      $("lg-newer").disabled = r.offset <= 0;
      $("lg-older").disabled = r.offset + r.rows.length >= r.total;
    });
  }
  $("lg-newer").addEventListener("click", function(){ loadLog(Math.max(0, lgOffset - lgPage)); });
  $("lg-older").addEventListener("click", function(){ loadLog(lgOffset + lgPage); });
  $("lg-list").addEventListener("click", function(e){ var b = e.target.closest("[data-open]"); if (b) openMember(+b.getAttribute("data-open")); });

  /* ---------- أقسام اللوحة (شريط فوق ثابت تحت الهيدر) ---------- */
  function prBadge(n){ var b = $("tab-pr"); b.textContent = n || ""; b.hidden = !n; b.setAttribute("aria-label", n + " طلب مستني"); }
  var tabs = $("adm-tabs"), header = document.querySelector(".site-header");
  function tabsTop(){ var h = header ? header.offsetHeight : 0; tabs.style.top = h + "px"; document.documentElement.style.setProperty("--adm-sticky", (h + tabs.offsetHeight + 8) + "px"); }
  window.addEventListener("resize", tabsTop);
  var tabLinks = [].slice.call(tabs.querySelectorAll("a"));
  if ("IntersectionObserver" in window){
    var seen = {};
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ seen[e.target.id] = e.isIntersecting; });
      var cur = tabLinks.filter(function(a){ return seen[a.getAttribute("href").slice(1)]; })[0];
      if (!cur) return;
      tabLinks.forEach(function(a){ if (a === cur) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
      var box = cur.parentNode; if (box.scrollWidth > box.clientWidth) box.scrollTo({ left: cur.offsetLeft - (box.clientWidth - cur.offsetWidth) / 2, behavior: "smooth" });
    }, { rootMargin: "-30% 0px -60% 0px" });
    tabLinks.forEach(function(a){ var s = $(a.getAttribute("href").slice(1)); if (s) io.observe(s); });
  }

  /* ---------- البداية ---------- */
  function gate(msg, login){ $("adm-sub").textContent = ""; $("adm-gate-msg").textContent = msg; $("adm-login").hidden = !login; $("adm-gate").hidden = false; }
  get("/api/auth/me").then(function(r){
    if (!r.ok){ gate(r.message || OFFLINE, false); return; }
    if (!r.user){ gate("ادخل بحساب الإدارة الأول.", true); return; }
    if (!r.user.admin){ gate("الصفحة دي للإدارة بس. الحساب اللي انت داخل بيه مش من حسابات الإدارة.", false); return; }
    meEmail = r.user.email;
    $("adm-sub").textContent = "أهلاً يا " + r.user.name.split(" ")[0] + ". كل الأرقام من قاعدة البيانات مباشرة.";
    $("adm").hidden = false; tabsTop();
    loadStats(); loadReqs(); loadMembers(true); loadPrices(); loadBanner(); loadLog(0);
    // keep «متصل دلوقتي» fresh while the dashboard is open (skip the list while a member is open, after «more», or while searching/filtering)
    setInterval(function(){
      if (document.visibilityState !== "visible") return;
      loadStats();
      if (!md.open && !pagedMore && !q && !filter) loadMembers(true);
    }, 60000);
  });
})();
