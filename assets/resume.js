/* «كمّل من حيث وقفت» في الصفحة الرئيسية: للأعضاء بس.
   بيحمّل sync.js (من غير reload) عشان ينزّل تقدّم الحساب لـ localStorage، وبعدين يحسب نسبة كل كورس/محاكي.
   الحساب هنا نفس حساب الشهادة في functions/_lib/courses.js بالظبط: نفس المفاتيح، ونفس قوايم الدروس والتمارين
   اللي بتتقري من ملف كل كورس — لو غيّرت واحد غيّر التاني. لو مفيش نت: بنعرض اللي على الجهاز. */
(function(){
  "use strict";
  var box = document.getElementById("resume");
  if (!box || !window.fetch) return;
  var LABS = window.LABS || [];

  function lsGet(k){ try { return localStorage.getItem(k); } catch (e){ return null; } }
  function parse(v){ try { return JSON.parse(v || "null"); } catch (e){ return null; } }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---------- نفس COURSES في functions/_lib/courses.js ---------- */
  var COURSES = {
    basics:  { key: "basics-lab-v1",  src: "basics-lab/basics.js",          list: "BL.COURSE" },
    classic: { key: "classic-lab-v1", src: "classic-control-lab/engine.js", list: null },
    instr:   { key: "instr-lab-v1",   src: "instrumentation-lab/instr.js",  list: "IL.COURSE" },
    plc:     { key: "plc-lab-v1",     src: "plc-lab/plc.js",                list: "PL.COURSE" },
    drw:     { key: "drw-lab-v1",     src: "drawings-lab/drawings.js",      list: "DR.COURSE" },
    vfdc:    { key: "vfdc-lab-v1",    src: "vfd-course/vfd.js",             list: "VF.COURSE" }   // كارت الكتالوج id "vfdc" (الـ "vfd" للمحاكي الشامل)، والشهادة id "vfd"
  };
  // basics / instr / plc / drw: `{id:'l1', … tasks:[['ohm','…'],…]}` → "l1/ohm" في state.done
  function parseTasks(src, list){
    var start = src.indexOf(list + " = [");
    if (start < 0) return null;
    var end = src.indexOf("\n];", start);
    var body = src.slice(start, end < 0 ? undefined : end), out = [];
    body.split("{id:'").slice(1).forEach(function(chunk){
      var id = chunk.slice(0, chunk.indexOf("'")), t = chunk.indexOf("tasks:[");
      if (!/^l\d+$/.test(id) || t < 0) return;
      var tasks = chunk.slice(t + 7, chunk.indexOf("]]", t) + 1), re = /\[\s*'([^']+)'\s*,/g, m;
      while ((m = re.exec(tasks))) out.push(id + "/" + m[1]);
    });
    return out.length ? out : null;
  }
  // classic: `exercises: {l1:['a','e',…], …}` → "l1/ex/a" في state.p
  function parseExercises(src){
    var i = src.search(/exercises:\s*\{\s*l\d+:/);
    if (i < 0) return null;
    var block = src.slice(i, src.indexOf("]}", i) + 2), out = [], re = /(l\d+)\s*:\s*\[([^\]]*)\]/g, m, x;
    while ((m = re.exec(block))){ var r2 = /'([^']+)'/g; while ((x = r2.exec(m[2]))) out.push(m[1] + "/ex/" + x[1]); }
    return out.length ? out : null;
  }
  function requirements(id){
    var c = COURSES[id];
    return fetch(c.src).then(function(r){ return r.ok ? r.text() : null; })
      .then(function(src){ return src ? (c.list ? parseTasks(src, c.list) : parseExercises(src)) : null; }, function(){ return null; });
  }
  function courseStatus(id, s, req){
    var map = s && typeof s === "object" ? (id === "classic" ? s.p : s.done) : null;
    if (!req || !map || typeof map !== "object") return { done: 0, total: req ? req.length : 0 };
    return { done: req.filter(function(k){ return !!map[k]; }).length, total: req.length };
  }

  /* ---------- المحاكيات: التمارين الموجّهة (GUI.done) من مجموع guided في الكتالوج ---------- */
  var SIM_KEY = { servo: "servo-lab-v1-ui", mrje: "mrje-sim-v1-ui", sigma7: "sigma7-sim-v1-ui", kinetix300: "kinetix300-sim-v1-ui" };
  function simStatus(l){
    if (!l.guided) return null;
    var s = parse(lsGet(SIM_KEY[l.id] || l.id + "-lab-v1-ui")), d = s && s.done && typeof s.done === "object" ? s.done : null;
    if (!s) return null;
    var n = d ? Object.keys(d).filter(function(k){ return d[k] && +k < l.guided; }).length : 0;
    return { done: n, total: l.guided };
  }

  // كل الكورسات والمحاكيات اللي فيها تقدّم: [{lab, done, total, pct}]
  function collect(){
    var jobs = LABS.map(function(l){
      if (COURSES[l.id]){
        var s = parse(lsGet(COURSES[l.id].key));
        if (!s) return Promise.resolve(null);
        return requirements(l.id).then(function(req){ return { lab: l, st: courseStatus(l.id, s, req) }; });
      }
      var st = simStatus(l);
      return Promise.resolve(st ? { lab: l, st: st } : null);
    });
    return Promise.all(jobs).then(function(rows){
      return rows.filter(Boolean).map(function(r){
        var pct = r.st.total ? Math.round(r.st.done / r.st.total * 100) : 0;
        return { lab: r.lab, done: r.st.done, total: r.st.total, pct: Math.min(100, pct) };
      });
    });
  }

  function dirOf(path){ var m = /^\/?([^/]+)\//.exec(path || ""); return m ? m[1] : ""; }
  function labByDir(d){ for (var i = 0; i < LABS.length; i++) if (dirOf(LABS[i].path) === d) return LABS[i]; return null; }
  function ago(t){
    var m = Math.round((Date.now() - t) / 60000);
    if (!(m >= 0)) return "";
    if (m < 2) return "دلوقتي";
    if (m < 60) return "من " + m + (m <= 10 ? " دقايق" : " دقيقة");
    var h = Math.round(m / 60); if (h < 24) return h === 1 ? "من ساعة" : h === 2 ? "من ساعتين" : "من " + h + (h <= 10 ? " ساعات" : " ساعة");
    var d = Math.round(h / 24); return d === 1 ? "امبارح" : d === 2 ? "من يومين" : "من " + d + (d <= 10 ? " أيام" : " يوم");
  }
  function bar(pct, label){ return '<span class="rs-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="' + esc(label) + '"><i style="width:' + pct + '%"></i></span>'; }
  function href(p){ return String(p).replace(/^\//, ""); }

  function render(rows){
    var last = parse(lsGet("le-last-v1"));
    if (!(last && typeof last.p === "string" && /^\/[^/]+\//.test(last.p))) last = null;
    var byId = {}; rows.forEach(function(r){ byId[r.lab.id] = r; });
    var main = null, lab = last ? labByDir(dirOf(last.p)) : null;
    if (last) main = { lab: lab, row: lab ? byId[lab.id] : null, href: href(last.p), sub: last.title && (!lab || last.title.indexOf(lab.name) < 0) ? last.title : "", t: +last.t || 0 };
    var going = rows.filter(function(r){ return r.done > 0 && r.pct < 100; });
    if (!main && going.length) main = { lab: going[0].lab, row: going[0], href: going[0].lab.path, sub: "", t: 0 };
    if (!main) return;
    var name = main.lab ? main.lab.name : (main.sub || "آخر حاجة فتحتها");
    var kind = main.lab ? (main.lab.brand === "كورس" ? "" : "محاكي " + main.lab.brand) : "";
    var pct = main.row ? main.row.pct : null;
    var h = '<div class="rs-main"><div class="rs-txt"><span class="eyebrow">كمّل من حيث وقفت' + (main.t ? ' · <span class="rs-ago">' + esc(ago(main.t)) + "</span>" : "") + "</span>" +
      "<h2" + (main.lab && !main.lab.rtlName ? ' class="ltr-name"' : "") + ">" + esc(name) + "</h2>" +
      (main.sub && main.lab ? '<p class="rs-sub">' + esc(main.sub) + "</p>" : "") +
      (kind ? '<p class="rs-kind">' + esc(kind) + "</p>" : "") +
      (pct !== null ? '<div class="rs-prog">' + bar(pct, "التقدّم في " + name) + "<b>" + pct + "%</b><small>" + main.row.done + " من " + main.row.total + "</small></div>" : "") +
      '</div><a class="btn btn-primary rs-go" href="' + esc(main.href) + '">كمّل ←</a></div>';
    var others = going.filter(function(r){ return !main.lab || r.lab.id !== main.lab.id; }).sort(function(a, b){ return b.pct - a.pct; }).slice(0, 6);
    if (others.length){
      h += '<h3 class="rs-h">كورسات ومحاكيات لسه مخلّصتهاش</h3><ul class="rs-list">' + others.map(function(r){
        return '<li><a href="' + esc(r.lab.path) + '"><span class="rs-n"' + (r.lab.rtlName ? "" : ' dir="ltr"') + ">" + esc(r.lab.name) + "</span>" + bar(r.pct, "التقدّم في " + r.lab.name) + '<span class="rs-p">' + r.pct + "%</span></a></li>";
      }).join("") + "</ul>";
    }
    box.querySelector(".rs-card").innerHTML = h;
    box.hidden = false;
  }

  function leUser(){ try { return !!JSON.parse(sessionStorage.getItem("le-user") || "null"); } catch (e){ return false; } }
  function go(r){ if (r && (r.signed || (r.offline && leUser()))) collect().then(render); }

  if (window.LESync) { window.LESync.ready.then(go); return; }
  var s = document.createElement("script");
  s.src = "assets/sync.js?v=" + (box.getAttribute("data-v") || "1");
  s.setAttribute("data-no-reload", "");
  s.onload = function(){ if (window.LESync) window.LESync.ready.then(go); };
  s.onerror = function(){ go({ offline: true }); };
  document.head.appendChild(s);
})();
