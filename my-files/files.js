/* /my-files/: the owner's private uploads. Parts go straight to /api/files/part (R2 multipart), 3 at a time, with retries. */
(function(){
  "use strict";
  function $(id){ return document.getElementById(id); }
  function el(t, c, x){ var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var PART = 20 * 1024 * 1024, PAR = 3;
  function size(n){ if (n < 1024) return n + " بايت"; var u = ["ك.ب", "م.ب", "ج.ب", "ت.ب"], i = -1; do { n /= 1024; i++; } while (n >= 1024 && i < 3); return n.toFixed(n < 10 ? 1 : 0) + " " + u[i]; }
  function link(id){ return location.origin + "/f/" + id; }
  async function api(path, body){
    var r = await fetch("/api/files/" + path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" } : { credentials: "same-origin" });
    var j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok || !j.ok){ var err = new Error(j.message || ("HTTP " + r.status)); err.code = j.error; err.status = r.status; throw err; }
    return j;
  }
  function say(m, bad){ var s = $("mf-status"); s.textContent = m || ""; s.className = "mf-status" + (bad ? " err" : ""); }

  /* ---- list ---- */
  async function load(){
    try {
      var j = await api("list");
      PART = j.partSize || PART;
      $("mf-setup").hidden = true; $("mf-app").hidden = false;
      $("mf-total").textContent = j.files.length + " ملف · " + size(j.total);
      var list = $("mf-list"); list.replaceChildren();
      if (!j.files.length) list.append(el("p", "mf-empty", "لسه مفيش ملفات. ارفع أول ملف من فوق."));
      j.files.forEach(function(f){ list.append(row(f)); });
    } catch (e){
      if (e.code === "storage_not_setup"){ $("mf-setup").hidden = false; $("mf-app").hidden = true; }
      else say("مش قادر أجيب الملفات: " + e.message, true);
    }
  }
  function row(f){
    var r = el("div", "mf-row");
    var info = el("div", "mf-info");
    info.append(el("b", "mf-name", f.name), el("small", null, size(f.size) + " · " + new Date(f.uploaded).toLocaleString("ar-EG")));
    var btns = el("div", "mf-btns");
    var copy = el("button", "btn btn-primary", "انسخ اللينك"); copy.type = "button";
    copy.addEventListener("click", function(){ copyText(link(f.id), copy); });
    var open = el("a", "btn btn-ghost", "افتح"); open.href = "/f/" + f.id + "?view=1"; open.target = "_blank"; open.rel = "noopener";
    var ren = el("button", "btn btn-ghost", "غيّر الاسم"); ren.type = "button";
    ren.addEventListener("click", async function(){
      var n = prompt("الاسم الجديد:", f.name); if (!n || n === f.name) return;
      try { await api("rename", { id: f.id, name: n }); load(); } catch (e){ say("ماقدرتش أغير الاسم: " + e.message, true); }
    });
    var del = el("button", "btn btn-danger", "امسح"); del.type = "button";
    del.addEventListener("click", async function(){
      if (!confirm("تمسح «" + f.name + "»؟ اللينك بتاعه هيبطل يشتغل.")) return;
      try { await api("delete", { id: f.id }); load(); } catch (e){ say("ماقدرتش أمسح: " + e.message, true); }
    });
    btns.append(copy, open, ren, del);
    r.append(info, btns);
    return r;
  }
  function copyText(t, btn){
    function ok(){ var o = btn.textContent; btn.textContent = "اتنسخ ✓"; setTimeout(function(){ btn.textContent = o; }, 1500); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function(){ prompt("انسخ اللينك:", t); });
    else prompt("انسخ اللينك:", t);
  }

  /* ---- upload ---- */
  function putPart(q, id, uploadId, n, blob){
    return new Promise(function(res, rej){
      var x = new XMLHttpRequest();
      x.open("PUT", "/api/files/part?id=" + encodeURIComponent(id) + "&uploadId=" + encodeURIComponent(uploadId) + "&n=" + n);
      x.withCredentials = true;
      x.upload.onprogress = function(ev){ q.cur[n] = ev.loaded; q.tick(); };
      x.onload = function(){ var j = {}; try { j = JSON.parse(x.responseText); } catch (e) {} if (x.status === 200 && j.ok) res(j); else rej(new Error(j.message || ("HTTP " + x.status))); };
      x.onerror = function(){ rej(new Error("network")); };
      x.send(blob);
    });
  }
  async function upload(file){
    var item = el("div", "mf-up"), name = el("b", null, file.name), bar = el("div", "mf-bar"), fill = el("span"), txt = el("small", null, "بيبدأ…");
    bar.append(fill); item.append(name, bar, txt); $("mf-queue").prepend(item);
    var q = { done: 0, cur: {}, t0: Date.now(), tick: function(){
      var sent = q.done; for (var k in q.cur) sent += q.cur[k];
      var p = file.size ? Math.min(100, sent / file.size * 100) : 100, sp = sent / Math.max(1, (Date.now() - q.t0) / 1000);
      fill.style.width = p.toFixed(1) + "%"; txt.textContent = p.toFixed(0) + "% · " + size(sent) + " من " + size(file.size) + " · " + size(sp) + "/ث";
    } };
    var st;
    try {
      st = await api("start", { name: file.name, type: file.type });
      var parts = Math.max(1, Math.ceil(file.size / PART)), next = 1, out = [];
      async function worker(){
        while (next <= parts){
          var n = next++, blob = file.slice((n - 1) * PART, Math.min(file.size, n * PART)), tries = 0;
          for (;;){
            try { var r = await putPart(q, st.id, st.uploadId, n, blob); out.push({ partNumber: r.partNumber, etag: r.etag }); break; }
            catch (e){ q.cur[n] = 0; if (++tries >= 4) throw e; await new Promise(function(z){ setTimeout(z, 1500 * tries); }); }
          }
          delete q.cur[n]; q.done += blob.size; q.tick();
        }
      }
      var ws = []; for (var i = 0; i < Math.min(PAR, parts); i++) ws.push(worker());
      await Promise.all(ws);
      await api("complete", { id: st.id, uploadId: st.uploadId, parts: out });
      item.classList.add("ok"); fill.style.width = "100%";
      txt.textContent = "اترفع ✓ " + size(file.size);
      var c = el("button", "btn btn-primary", "انسخ اللينك"); c.type = "button";
      c.addEventListener("click", function(){ copyText(link(st.id), c); }); item.append(c);
      load();
    } catch (e){
      item.classList.add("bad"); txt.textContent = "الرفع وقف: " + e.message + ". جرب ترفعه تاني.";
      if (st) api("abort", { id: st.id, uploadId: st.uploadId }).catch(function(){});
    }
  }
  var busy = Promise.resolve();
  function addFiles(list){ Array.prototype.forEach.call(list, function(f){ busy = busy.then(function(){ return upload(f); }); }); }

  var input = $("mf-file");
  $("mf-pick").addEventListener("click", function(){ input.click(); });
  input.addEventListener("change", function(){ addFiles(input.files); input.value = ""; });
  var drop = $("mf-drop");
  ["dragenter", "dragover"].forEach(function(t){ drop.addEventListener(t, function(e){ e.preventDefault(); drop.classList.add("hot"); }); });
  ["dragleave", "drop"].forEach(function(t){ drop.addEventListener(t, function(){ drop.classList.remove("hot"); }); });
  drop.addEventListener("drop", function(e){ e.preventDefault(); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
  window.addEventListener("beforeunload", function(e){ if (document.querySelector(".mf-up:not(.ok):not(.bad)")){ e.preventDefault(); e.returnValue = ""; } });
  $("mf-refresh").addEventListener("click", load);
  load();
})();
