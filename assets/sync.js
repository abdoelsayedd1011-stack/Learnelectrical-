/* مزامنة التقدّم مع الحساب: الكورسات والمحاكيات بتحفظ تقدّمها في localStorage على الجهاز،
   والملف ده بيرفعه للحساب وبينزّله على أي جهاز تاني تدخل منه. للأعضاء بس (الضيف مش بيتحمّل له الملف أصلاً).
   الدمج: الجهاز اللي محدش غيّر عليه من آخر مزامنة بياخد نسخة السيرفر، ولو الاتنين اتغيّروا بنجمع
   التمارين المتحلولة من الاتنين (اتحاد، true يكسب، والأرقام بناخد الأكبر). */
(function(){
  "use strict";
  if (window.LESync) return;
  var DEV = ["ab1336", "pf525", "pf40", "v20", "atv320", "atv630", "ms300", "fc51", "e5cc", "acs580", "g120", "fre800", "ga500", "ig5a", "gd20", "c2000", "frenic"];
  // progress: دمج كامل · state: حالة الجهاز (باراميترات وإعدادات) — الجهاز الحالي يكسب، والتمارين (exs) بتتجمع
  var KEYS = { "basics-lab-v1": "progress", "instr-lab-v1": "progress", "classic-lab-v1": "progress",
    "vfd-wbx": "progress", "vfd-tc": "progress", "vfd-ex": "progress", "servo-lab-v1-ui": "progress",
    "mrje-sim-v1-ui": "progress", "sigma7-sim-v1-ui": "progress", "kinetix300-sim-v1-ui": "progress" };
  DEV.forEach(function(d){ KEYS[d + "-lab-v1"] = "state"; KEYS[d + "-lab-v1-ui"] = "progress"; });
  // last: آخر كورس/محاكي اتفتح {p: المسار، title، t: الوقت} — الأحدث يكسب. الصفحة الرئيسية بتقراه في كارت «كمّل من حيث وقفت»
  var LAST = "le-last-v1"; KEYS[LAST] = "last";
  var META = "le-sync-meta", RELOADED = "le-sync-reloaded", PUSH_EVERY = 15000, BATCH = 60000;
  var script = document.currentScript;
  var noReload = !!(script && script.hasAttribute("data-no-reload"));

  function lsGet(k){ try { return localStorage.getItem(k); } catch (e){ return null; } }
  function lsSet(k, v){ try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; } catch (e){ return false; } }
  function hash(s){
    if (s === null || s === undefined) return "-";
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(36) + "." + s.length;
  }
  function readMeta(){ try { var m = JSON.parse(lsGet(META) || "null"); return m && typeof m === "object" && m.h ? m : { h: {} }; } catch (e){ return { h: {} }; } }
  var meta = readMeta();
  function saveMeta(){ lsSet(META, JSON.stringify(meta)); }

  function isObj(x){ return x && typeof x === "object" && !Array.isArray(x); }
  function empty(x){ return x === null || x === undefined || x === "" || (isObj(x) && !Object.keys(x).length) || (Array.isArray(x) && !x.length); }
  // a = نسخة الجهاز، b = نسخة السيرفر
  function deep(a, b){
    if (empty(a)) return b === undefined ? a : b;
    if (empty(b)) return a;
    if (Array.isArray(a) && Array.isArray(b)){
      var seen = {}, out = [];
      a.concat(b).forEach(function(x){ var k = typeof x + ":" + JSON.stringify(x); if (!seen[k]){ seen[k] = 1; out.push(x); } });
      return out;
    }
    if (isObj(a) && isObj(b)){
      var o = {};
      Object.keys(a).forEach(function(k){ o[k] = k in b ? deep(a[k], b[k]) : a[k]; });
      Object.keys(b).forEach(function(k){ if (!(k in a)) o[k] = b[k]; });
      return o;
    }
    if (typeof a === "boolean" && typeof b === "boolean") return a || b;
    if (typeof a === "number" && typeof b === "number") return Math.max(a, b);
    if (a === false || a === 0) return b; // "مش متحلول" قدام قيمة حقيقية من جهاز تاني
    return a;
  }
  function merge(k, L, S){
    if (L === null) return S;
    if (S === null) return L;
    var a, b;
    try { a = JSON.parse(L); b = JSON.parse(S); } catch (e){ return L; }
    var m;
    if (KEYS[k] === "last"){
      var ta = isObj(a) ? +a.t || 0 : 0, tb = isObj(b) ? +b.t || 0 : 0;
      return tb > ta ? S : L;
    }
    if (KEYS[k] === "state"){
      if (!isObj(a)) return isObj(b) ? S : L;
      if (!isObj(b)) return L;
      m = Object.assign({}, a); m.exs = deep(a.exs, b.exs);
      if (m.exs === undefined) delete m.exs;
    } else m = deep(a, b);
    var out = JSON.stringify(m);
    return out === JSON.stringify(a) ? L : out;
  }

  var signed = false, busy = false, timer = null, offline = false;
  function post(items, keepalive){
    return fetch("/api/progress", { method: "POST", credentials: "same-origin", keepalive: !!keepalive,
      headers: { "content-type": "application/json" }, body: JSON.stringify({ items: items }) })
      .then(function(r){ return r.ok; }, function(){ return false; });
  }
  // يرفع المفاتيح اللي اتغيّرت من آخر مزامنة
  function push(leaving){
    if (!signed || (busy && !leaving)) return Promise.resolve();
    var batches = [], cur = {}, size = 0, sent = {};
    Object.keys(KEYS).forEach(function(k){
      var v = lsGet(k), h = hash(v);
      if (meta.h[k] === h) return;
      if (meta.h[k] === undefined && v === null) return;
      var n = (v ? v.length : 4) + k.length + 8;
      if (size + n > BATCH && size){ batches.push(cur); cur = {}; size = 0; }
      cur[k] = v; size += n; sent[k] = h;
    });
    if (size) batches.push(cur);
    if (!batches.length) return Promise.resolve();
    busy = true;
    return Promise.all(batches.map(function(b){
      var bodyLen = JSON.stringify(b).length;
      return post(b, leaving && bodyLen < BATCH).then(function(ok){ if (ok) Object.keys(b).forEach(function(k){ meta.h[k] = sent[k]; }); });
    })).then(function(){ saveMeta(); busy = false; }, function(){ busy = false; });
  }

  function pull(){
    return fetch("/api/progress", { credentials: "same-origin", cache: "no-store" })
      .then(function(r){ return r.json(); })
      .then(function(r){
        if (!r || !r.ok || !r.signed) return false;
        signed = true;
        var items = r.items || {}, changed = false;
        Object.keys(KEYS).forEach(function(k){
          var L = lsGet(k), S = items[k] ? items[k].v : null, hL = hash(L), hS = hash(S), m = meta.h[k];
          if (hL === hS){ meta.h[k] = hS; return; }
          if (m === hL){ if (lsSet(k, S)){ meta.h[k] = hS; changed = true; } return; } // الجهاز ده متغيّرش: خد نسخة السيرفر
          if (m === hS) return; // السيرفر متغيّرش: push هيرفع نسخة الجهاز
          var M = merge(k, L, S);
          if (M !== L){ if (lsSet(k, M)) changed = true; }
          meta.h[k] = hS;
        });
        saveMeta();
        return changed;
      })
      .catch(function(){ offline = true; return false; });
  }

  function reloadOnce(){
    var tag = location.pathname, now = Date.now(), last = null;
    try { last = JSON.parse(sessionStorage.getItem(RELOADED) || "null"); } catch (e){}
    if (last && last.p === tag && now - last.t < 20000) return false; // اتعمل reload من شوية: مفيش لف
    try { sessionStorage.setItem(RELOADED, JSON.stringify({ p: tag, t: now })); } catch (e){ return false; }
    location.reload();
    return true;
  }

  // صفحة كورس أو محاكي (جوه فولدر): نسجّلها «آخر حاجة فتحتها» قبل المزامنة
  if (/^\/[^/]+\/[^/]*$/.test(location.pathname)){
    var title = String(document.title || "").replace(/\s*[|·–—-]\s*LearnElectricals\s*$/i, "").trim().slice(0, 120);
    lsSet(LAST, JSON.stringify({ p: location.pathname, title: title, t: Date.now() }));
  }

  var ready = pull().then(function(changed){
    if (!signed) return { signed: false, offline: offline };
    return push().then(function(){
      if (changed && !noReload && reloadOnce()) return { signed: true, reloading: true };
      timer = setInterval(function(){ push(); }, PUSH_EVERY);
      var leave = function(){ push(true); };
      document.addEventListener("visibilitychange", function(){ if (document.visibilityState === "hidden") leave(); });
      window.addEventListener("pagehide", leave);
      return { signed: true, changed: changed };
    });
  });
  window.LESync = { ready: ready, push: function(){ return push(); }, keys: Object.keys(KEYS) };
})();
