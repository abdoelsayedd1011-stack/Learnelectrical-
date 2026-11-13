/* PDF tools page (Arabic /pdf-tools/ and English /en/pdf-tools/).
   Everything runs in the browser: pdf.js renders pages, pdf-lib writes the new file. Nothing is uploaded.
   Page edits (text, signature, image, white-out, highlight) are stored in PDF user space:
   centre (cx,cy), size (w,h) in points and A = the page's view rotation when the item was made.
   Text is drawn on a canvas (so Arabic is shaped by the browser) and embedded as a PNG. */
(function(){
  "use strict";
  var EN = /^en\b/i.test(document.documentElement.getAttribute("lang") || "");
  var S = EN ? {
    pages: function(n){ return n + (n === 1 ? " page" : " pages"); },
    selected: function(n){ return n + " selected"; },
    page: "Page", of: "of",
    loading: "Opening files…", saving: "Building the PDF…", rendering: "Making images…",
    badFile: "This file could not be opened: ", password: "This PDF is password protected. Remove the password first, then try again: ",
    encrypted: "Note: this file has restrictions (encryption). The result may not open correctly: ",
    notSupported: "Unsupported file type: ",
    noPages: "Add a PDF or an image first.", noSel: "Select one or more pages first (tick the box on the page).",
    badRange: "Write the pages like this: 1-3, 5, 8-10",
    done: "Done. The file was downloaded.", doneN: function(n){ return "Done. " + n + " files were downloaded."; },
    clearAsk: "Remove all pages and start again?",
    typeHere: "Type here",
    rotL: "Rotate left", rotR: "Rotate right", dup: "Duplicate page", del: "Delete page", edit: "Write / sign on this page",
    moveB: "Move earlier", moveF: "Move later", sel: "Select page",
    sigEmpty: "Draw your signature first.",
    outName: "edited"
  } : {
    pages: function(n){ return n === 1 ? "صفحة واحدة" : n === 2 ? "صفحتين" : n + (n <= 10 ? " صفحات" : " صفحة"); },
    selected: function(n){ return "محدد " + n; },
    page: "صفحة", of: "من",
    loading: "بفتح الملفات…", saving: "بجهز ملف الـ PDF…", rendering: "بعمل الصور…",
    badFile: "الملف ده مش راضي يفتح: ", password: "الملف ده عليه باسورد. شيل الباسورد الأول وبعدين جرب تاني: ",
    encrypted: "ملحوظة: الملف ده عليه حماية (تشفير)، والناتج ممكن ما يفتحش صح: ",
    notSupported: "نوع الملف ده مش مدعوم: ",
    noPages: "ضيف ملف PDF أو صورة الأول.", noSel: "حدد صفحة أو أكتر الأول (علّم المربع اللي على الصفحة).",
    badRange: "اكتب الصفحات بالشكل ده: 1-3, 5, 8-10",
    done: "تم. الملف نزل عندك.", doneN: function(n){ return "تم. نزل " + n + " ملفات."; },
    clearAsk: "تمسح كل الصفحات وتبدأ من الأول؟",
    typeHere: "اكتب هنا",
    rotL: "تدوير شمال", rotR: "تدوير يمين", dup: "تكرار الصفحة", del: "حذف الصفحة", edit: "اكتب أو وقّع على الصفحة دي",
    moveB: "قدّم الصفحة", moveF: "أخّر الصفحة", sel: "تحديد الصفحة",
    sigEmpty: "ارسم توقيعك الأول.",
    outName: "edited"
  };

  var scriptSrc = (document.currentScript && document.currentScript.src) || "";
  var BASE = scriptSrc.replace(/[^\/]*$/, "");
  if (!window.pdfjsLib || !window.PDFLib) { var e0 = document.getElementById("pt-status"); if (e0) e0.textContent = "PDF library failed to load."; return; }
  pdfjsLib.GlobalWorkerOptions.workerSrc = BASE + "lib/pdf.worker.min.js";
  var CMAPS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/";
  var FONT = '"IBM Plex Sans Arabic","IBM Plex Sans",system-ui,sans-serif';
  var DPR = Math.min(window.devicePixelRatio || 1, 2.5);

  function $(id){ return document.getElementById(id); }
  function el(tag, cls, txt){ var e = document.createElement(tag); if (tag === "canvas") e.dir = "ltr"; if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  var uid = 0; function nid(){ return ++uid; }
  function store(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- state ---------- */
  var sources = [];  // {name, bytes:Uint8Array, js:pdfjsDoc, lib:Promise<PDFDocument>}
  var pages = [];    // {id, src, idx, base, rot, annots:[], sel, thumb:canvas|null, dirty}

  function total(p){ return ((p.base + p.rot) % 360 + 360) % 360; }

  /* ---------- status ---------- */
  var statusEl = $("pt-status"), busyEl = $("pt-busy"), statusTimer = 0;
  function say(msg, kind){
    statusEl.textContent = msg || ""; statusEl.className = "pt-status" + (kind ? " " + kind : "");
    clearTimeout(statusTimer); if (msg && kind !== "err") statusTimer = setTimeout(function(){ statusEl.textContent = ""; }, 7000);
  }
  function busy(msg){ if (msg){ busyEl.querySelector(".pt-busy-t").textContent = msg; busyEl.hidden = false; } else busyEl.hidden = true; }

  /* ---------- loading files ---------- */
  function isPdf(f){ return /pdf/i.test(f.type) || /\.pdf$/i.test(f.name); }
  function isImg(f){ return /^image\//i.test(f.type) || /\.(png|jpe?g|webp|gif|bmp)$/i.test(f.name); }

  async function addFiles(list){
    list = Array.prototype.slice.call(list || []);
    if (!list.length) return;
    busy(S.loading);
    try {
      for (var i = 0; i < list.length; i++){
        var f = list[i];
        try {
          if (isPdf(f)) await addPdf(f.name, new Uint8Array(await f.arrayBuffer()));
          else if (isImg(f)) await addPdf(f.name, await imageToPdf(f));
          else say(S.notSupported + f.name, "err");
        } catch (err){
          console.error(err);
          say((err && err.name === "PasswordException" ? S.password : S.badFile) + f.name, "err");
        }
      }
    } finally { busy(); renderGrid(); }
  }

  async function addPdf(name, bytes){
    var doc = await pdfjsLib.getDocument({ data: bytes.slice(), cMapUrl: CMAPS, cMapPacked: true, isEvalSupported: false }).promise;
    var src = { name: name, bytes: bytes, js: doc, lib: null };
    sources.push(src);
    for (var i = 0; i < doc.numPages; i++){
      var pg = await doc.getPage(i + 1);
      pages.push({ id: nid(), src: src, idx: i, base: pg.rotate || 0, rot: 0, annots: [], sel: false, thumb: null, dirty: true });
    }
    try { var head = new TextDecoder("latin1").decode(bytes.subarray(Math.max(0, bytes.length - 4096))); if (/\/Encrypt\b/.test(head)) say(S.encrypted + name, "warn"); } catch (e) {}
  }

  function loadImage(url){ return new Promise(function(res, rej){ var im = new Image(); im.onload = function(){ res(im); }; im.onerror = rej; im.src = url; }); }
  function readAsDataURL(f){ return new Promise(function(res, rej){ var r = new FileReader(); r.onload = function(){ res(r.result); }; r.onerror = rej; r.readAsDataURL(f); }); }
  function dataUrlBytes(u){ var b = atob(u.split(",")[1]); var a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }

  // any image file -> PNG or JPEG data URL, longest side at most `max` px
  async function normImage(f, max){
    var url = await readAsDataURL(f);
    var im = await loadImage(url);
    var keep = /^data:image\/(png|jpeg)/.test(url) && Math.max(im.naturalWidth, im.naturalHeight) <= max;
    if (keep) return { url: url, im: im };
    var k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
    var c = el("canvas"); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
    var png = /^data:image\/(png|gif|webp)/.test(url);
    var out = c.toDataURL(png ? "image/png" : "image/jpeg", 0.9);
    return { url: out, im: await loadImage(out) };
  }

  // a photo becomes one A4 page (portrait or landscape to match the photo), 18 pt margin
  async function imageToPdf(f){
    var r = await normImage(f, 3000);
    var doc = await PDFLib.PDFDocument.create();
    var img = /^data:image\/png/.test(r.url) ? await doc.embedPng(dataUrlBytes(r.url)) : await doc.embedJpg(dataUrlBytes(r.url));
    var land = img.width > img.height;
    var W = land ? 841.89 : 595.28, H = land ? 595.28 : 841.89, m = 18;
    var k = Math.min((W - 2 * m) / img.width, (H - 2 * m) / img.height);
    var w = img.width * k, h = img.height * k;
    doc.addPage([W, H]).drawImage(img, { x: (W - w) / 2, y: (H - h) / 2, width: w, height: h });
    return await doc.save();
  }

  async function blankPage(){
    var doc = await PDFLib.PDFDocument.create(); doc.addPage([595.28, 841.89]);
    await addPdf(EN ? "blank" : "صفحة فاضية", await doc.save());
    renderGrid();
  }

  /* ---------- drawing page items ---------- */
  function hasRtl(s){ return /[֐-ࣿיִ-ﻼ]/.test(s); }
  function textFont(a, k){ return (a.bold ? "600 " : "400 ") + (a.size * k) + "px " + FONT; }
  var mctx = el("canvas").getContext("2d");
  function measureText(a){
    mctx.font = textFont(a, 1);
    var lines = String(a.text || " ").split("\n"), w = 0;
    lines.forEach(function(l){ w = Math.max(w, mctx.measureText(l || " ").width); });
    var pad = a.size * 0.25;
    return { w: w + 2 * pad, h: lines.length * a.size * 1.45 + pad };
  }
  function fitText(a){ var m = measureText(a); a.w = m.w; a.h = m.h; }

  // draws item `a` centred on the origin, k = canvas px per PDF point
  function drawItem(ctx, a, k){
    var w = a.w * k, h = a.h * k;
    ctx.save();
    if (a.type === "white"){ ctx.fillStyle = a.color || "#ffffff"; ctx.fillRect(-w / 2, -h / 2, w, h); }
    else if (a.type === "mark"){ ctx.globalAlpha = 0.38; ctx.fillStyle = a.color || "#ffe14d"; ctx.fillRect(-w / 2, -h / 2, w, h); }
    else if (a.type === "image" || a.type === "sign"){ if (a.im) ctx.drawImage(a.im, -w / 2, -h / 2, w, h); }
    else if (a.type === "text"){
      if (a.bg){ ctx.fillStyle = "#ffffff"; ctx.fillRect(-w / 2, -h / 2, w, h); }
      ctx.font = textFont(a, k); ctx.fillStyle = a.color || "#000000"; ctx.textBaseline = "middle";
      var pad = a.size * 0.25 * k, lh = a.size * 1.45 * k;
      String(a.text || "").split("\n").forEach(function(line, i){
        var rtl = hasRtl(line);
        try { ctx.direction = rtl ? "rtl" : "ltr"; } catch (e) {}
        var al = a.align || "auto", x;
        if (al === "auto") al = rtl ? "right" : "left";
        if (al === "right"){ ctx.textAlign = "right"; x = w / 2 - pad; }
        else if (al === "center"){ ctx.textAlign = "center"; x = 0; }
        else { ctx.textAlign = "left"; x = -w / 2 + pad; }
        ctx.fillText(line, x, -h / 2 + pad / 2 + (i + 0.5) * lh);
      });
    }
    ctx.restore();
  }
  // draws all items of page p on a canvas that shows viewport vp (in canvas px)
  function drawItemsOn(ctx, p, vp){
    p.annots.forEach(function(a){
      var c = vp.convertToViewportPoint(a.cx, a.cy);
      ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate((total(p) - a.A) * Math.PI / 180);
      drawItem(ctx, a, vp.scale); ctx.restore();
    });
  }

  /* ---------- thumbnails ---------- */
  var thumbQ = Promise.resolve();
  function queueThumb(p, holder){
    thumbQ = thumbQ.then(async function(){
      if (!p.dirty && p.thumb){ holder.replaceChildren(p.thumb); return; }
      try {
        var pg = await p.src.js.getPage(p.idx + 1);
        var v1 = pg.getViewport({ scale: 1, rotation: total(p) });
        var s = 170 * DPR / Math.max(v1.width, v1.height * 0.78);
        var vp = pg.getViewport({ scale: s, rotation: total(p) });
        var c = el("canvas"); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
        var ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        await pg.render({ canvasContext: ctx, viewport: vp }).promise;
        drawItemsOn(ctx, p, vp);
        p.thumb = c; p.dirty = false;
        if (holder.isConnected) holder.replaceChildren(c);
      } catch (err){ console.error(err); }
    });
  }

  /* ---------- page grid ---------- */
  var grid = $("pt-grid"), drop = $("pt-drop"), work = $("pt-work");
  var ICON = {
    rotL: '<path d="M4 4v6h6"/><path d="M4.5 10a8 8 0 1 1 1.9 8.3"/>',
    rotR: '<path d="M20 4v6h-6"/><path d="M19.5 10a8 8 0 1 0-1.9 8.3"/>',
    dup: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    del: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13 7l4 4"/>',
    left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>'
  };
  function iconBtn(name, label, fn){
    var b = el("button", "pt-ib"); b.type = "button"; b.title = label; b.setAttribute("aria-label", label);
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + "</svg>";
    b.addEventListener("click", function(ev){ ev.stopPropagation(); fn(); });
    return b;
  }
  var dragId = null;

  function renderGrid(){
    var has = pages.length > 0;
    drop.classList.toggle("pt-small", has); work.hidden = !has;
    grid.replaceChildren();
    pages.forEach(function(p, i){
      var card = el("div", "pt-card" + (p.sel ? " sel" : "")); card.draggable = true; card.dataset.id = p.id;
      var top = el("label", "pt-top");
      var cb = el("input"); cb.type = "checkbox"; cb.checked = p.sel; cb.setAttribute("aria-label", S.sel + " " + (i + 1));
      cb.addEventListener("change", function(){ p.sel = cb.checked; card.classList.toggle("sel", p.sel); updateCount(); });
      top.append(cb, el("b", null, String(i + 1)), el("small", "pt-src", p.src.name));
      var th = el("button", "pt-thumb"); th.type = "button"; th.title = S.edit; th.setAttribute("aria-label", S.edit + " " + (i + 1));
      th.addEventListener("click", function(){ openEditor(pages.indexOf(p)); });
      if (p.thumb && !p.dirty) th.append(p.thumb); else { th.append(el("span", "pt-spin")); queueThumb(p, th); }
      var bar = el("div", "pt-bar");
      var back = EN ? "left" : "right", fwd = EN ? "right" : "left";
      bar.append(
        iconBtn(back, S.moveB, function(){ move(p, -1); }),
        iconBtn("rotL", S.rotL, function(){ rotate([p], -90); }),
        iconBtn("rotR", S.rotR, function(){ rotate([p], 90); }),
        iconBtn("edit", S.edit, function(){ openEditor(pages.indexOf(p)); }),
        iconBtn("dup", S.dup, function(){ duplicate(p); }),
        iconBtn("del", S.del, function(){ remove([p]); }),
        iconBtn(fwd, S.moveF, function(){ move(p, 1); })
      );
      card.append(top, th, bar);
      card.addEventListener("dragstart", function(ev){ dragId = p.id; card.classList.add("drag"); try { ev.dataTransfer.setData("text/plain", String(p.id)); ev.dataTransfer.effectAllowed = "move"; } catch (e) {} });
      card.addEventListener("dragend", function(){ dragId = null; card.classList.remove("drag"); });
      card.addEventListener("dragover", function(ev){ if (dragId != null){ ev.preventDefault(); card.classList.add("over"); } });
      card.addEventListener("dragleave", function(){ card.classList.remove("over"); });
      card.addEventListener("drop", function(ev){
        card.classList.remove("over"); if (dragId == null) return; ev.preventDefault(); ev.stopPropagation();
        var from = pages.findIndex(function(x){ return x.id === dragId; }), to = pages.indexOf(p);
        if (from < 0 || from === to) return;
        var it = pages.splice(from, 1)[0]; pages.splice(to, 0, it); renderGrid();
      });
      grid.append(card);
    });
    updateCount();
  }
  function updateCount(){
    var n = pages.filter(function(p){ return p.sel; }).length;
    $("pt-count").textContent = S.pages(pages.length) + (n ? " · " + S.selected(n) : "");
  }
  function selected(){ return pages.filter(function(p){ return p.sel; }); }
  function move(p, d){ var i = pages.indexOf(p), j = i + d; if (j < 0 || j >= pages.length) return; pages.splice(i, 1); pages.splice(j, 0, p); renderGrid(); }
  function rotate(list, d){ list.forEach(function(p){ p.rot = (p.rot + d + 360) % 360; p.dirty = true; }); renderGrid(); }
  function remove(list){ pages = pages.filter(function(p){ return list.indexOf(p) < 0; }); renderGrid(); }
  function duplicate(p){
    var q = { id: nid(), src: p.src, idx: p.idx, base: p.base, rot: p.rot, sel: false, thumb: null, dirty: true,
      annots: p.annots.map(function(a){ var b = Object.assign({}, a); b.id = nid(); return b; }) };
    pages.splice(pages.indexOf(p) + 1, 0, q); renderGrid();
  }

  // "1-3, 5, 9-" -> [[0,1,2],[4],[8..end]]  (indices in the current order)
  function parseRanges(str){
    var groups = [], n = pages.length;
    var parts = String(str || "").replace(/[٠-٩]/g, function(d){ return String(d.charCodeAt(0) - 0x660); })
      .replace(/[،؛;]/g, ",").split(",").map(function(s){ return s.trim(); }).filter(Boolean);
    if (!parts.length) return null;
    for (var i = 0; i < parts.length; i++){
      var m = /^(\d*)\s*[-–_]\s*(\d*)$/.exec(parts[i]) || /^(\d+)$/.exec(parts[i]);
      if (!m) return null;
      var a, b;
      if (m.length === 2){ a = b = +m[1]; } else { a = m[1] ? +m[1] : 1; b = m[2] ? +m[2] : n; }
      if (a < 1 || b < 1 || a > n || b > n) return null;
      var g = []; if (a <= b) for (var k = a; k <= b; k++) g.push(k - 1); else for (var k2 = a; k2 >= b; k2--) g.push(k2 - 1);
      groups.push(g);
    }
    return groups;
  }

  /* ---------- building the output PDF ---------- */
  function libDoc(src){ return src.lib || (src.lib = PDFLib.PDFDocument.load(src.bytes, { ignoreEncryption: true, updateMetadata: false })); }
  function hexRgb(h){ h = (h || "#000000").replace("#", ""); return PDFLib.rgb(parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255); }
  // bottom-left corner of a w×h box rotated by A degrees (counter-clockwise) whose centre is (cx,cy)
  function corner(cx, cy, w, h, A){
    var r = A * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    return { x: cx - (c * w / 2 - s * h / 2), y: cy - (s * w / 2 + c * h / 2) };
  }
  function itemPng(a){
    var k = 4, c = el("canvas"); c.width = Math.max(1, Math.ceil(a.w * k)); c.height = Math.max(1, Math.ceil(a.h * k));
    var ctx = c.getContext("2d"); ctx.translate(c.width / 2, c.height / 2); drawItem(ctx, a, k);
    return dataUrlBytes(c.toDataURL("image/png"));
  }

  async function buildPdf(list){
    var out = await PDFLib.PDFDocument.create();
    var numbers = $("pt-num").checked;
    var font = numbers ? await out.embedFont(PDFLib.StandardFonts.Helvetica) : null;
    var cache = {};
    for (var i = 0; i < list.length; i++){
      var p = list[i];
      var src = await libDoc(p.src);
      var cp = (await out.copyPages(src, [p.idx]))[0];
      cp.setRotation(PDFLib.degrees(total(p)));
      out.addPage(cp);
      if (!p.annots.length && !numbers) continue;
      for (var j = 0; j < p.annots.length; j++){
        var a = p.annots[j], o = corner(a.cx, a.cy, a.w, a.h, a.A), rot = PDFLib.degrees(a.A);
        if (a.type === "white" || a.type === "mark"){
          cp.drawRectangle({ x: o.x, y: o.y, width: a.w, height: a.h, rotate: rot, color: hexRgb(a.color || (a.type === "mark" ? "#ffe14d" : "#ffffff")), opacity: a.type === "mark" ? 0.38 : 1, borderWidth: 0 });
          continue;
        }
        var img;
        if (a.type === "text") img = await out.embedPng(itemPng(a));
        else {
          img = cache[a.url];
          if (!img){ img = cache[a.url] = /^data:image\/png/.test(a.url) ? await out.embedPng(dataUrlBytes(a.url)) : await out.embedJpg(dataUrlBytes(a.url)); }
        }
        cp.drawImage(img, { x: o.x, y: o.y, width: a.w, height: a.h, rotate: rot });
      }
      if (numbers){
        var pg = await p.src.js.getPage(p.idx + 1), vp = pg.getViewport({ scale: 1, rotation: total(p) });
        var str = (i + 1) + " / " + list.length, size = 10, tw = font.widthOfTextAtSize(str, size);
        var c0 = vp.convertToPdfPoint(vp.width / 2, vp.height - 16);
        var A = total(p) * Math.PI / 180, cs = Math.cos(A), sn = Math.sin(A);
        var lx = -tw / 2, ly = -size * 0.35;
        cp.drawText(str, { x: c0[0] + cs * lx - sn * ly, y: c0[1] + sn * lx + cs * ly, size: size, font: font, color: PDFLib.rgb(0.25, 0.25, 0.25), rotate: PDFLib.degrees(total(p)) });
      }
    }
    return await out.save();
  }

  function outName(suffix, ext){
    var n = ($("pt-name").value || "").trim().replace(/[\\\/:*?"<>|]+/g, "_").replace(/\.pdf$/i, "");
    if (!n) n = (sources[0] ? sources[0].name.replace(/\.[^.]+$/, "") + "-" : "") + S.outName;
    return n + (suffix || "") + "." + (ext || "pdf");
  }
  function download(data, name, type){
    var blob = data instanceof Blob ? data : new Blob([data], { type: type || "application/pdf" });
    var url = URL.createObjectURL(blob), a = el("a"); a.href = url; a.download = name; a.rel = "noopener";
    document.body.append(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 8000);
  }
  function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

  async function run(label, fn){
    busy(label);
    try { await fn(); } catch (err){ console.error(err); say(S.badFile + (err && err.message || err), "err"); }
    finally { busy(); }
  }

  $("pt-save").addEventListener("click", function(){
    if (!pages.length) return say(S.noPages, "err");
    run(S.saving, async function(){ download(await buildPdf(pages), outName()); say(S.done, "ok"); });
  });
  $("pt-save-sel").addEventListener("click", function(){
    var list = selected(); if (!list.length) return say(S.noSel, "err");
    run(S.saving, async function(){ download(await buildPdf(list), outName(EN ? "-pages" : "-صفحات")); say(S.done, "ok"); });
  });
  $("pt-split").addEventListener("click", function(){
    if (!pages.length) return say(S.noPages, "err");
    var v = $("pt-ranges").value.trim(), groups;
    if (v === "*" || v === "") groups = pages.map(function(_, i){ return [i]; });
    else groups = parseRanges(v);
    if (!groups) return say(S.badRange, "err");
    run(S.saving, async function(){
      for (var g = 0; g < groups.length; g++){
        var list = groups[g].map(function(i){ return pages[i]; });
        var a = groups[g][0] + 1, b = groups[g][groups[g].length - 1] + 1;
        download(await buildPdf(list), outName("-" + (a === b ? a : a + "-" + b)));
        if (g < groups.length - 1) await wait(700);
      }
      say(groups.length === 1 ? S.done : S.doneN(groups.length), "ok");
    });
  });
  $("pt-pick").addEventListener("click", function(){
    var groups = parseRanges($("pt-ranges").value); if (!groups) return say(S.badRange, "err");
    var set = {}; groups.forEach(function(g){ g.forEach(function(i){ set[i] = 1; }); });
    pages.forEach(function(p, i){ p.sel = !!set[i]; }); renderGrid();
  });
  $("pt-img").addEventListener("click", function(){
    var list = selected(); if (!list.length) list = pages.slice();
    if (!list.length) return say(S.noPages, "err");
    run(S.rendering, async function(){
      for (var i = 0; i < list.length; i++){
        var p = list[i], pg = await p.src.js.getPage(p.idx + 1);
        var vp = pg.getViewport({ scale: 2, rotation: total(p) });
        var c = el("canvas"); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
        var ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        await pg.render({ canvasContext: ctx, viewport: vp }).promise;
        drawItemsOn(ctx, p, vp);
        var blob = await new Promise(function(r){ c.toBlob(r, "image/png"); });
        download(blob, outName("-" + (pages.indexOf(p) + 1), "png"), "image/png");
        if (i < list.length - 1) await wait(600);
      }
      say(list.length === 1 ? S.done : S.doneN(list.length), "ok");
    });
  });

  /* ---------- toolbar ---------- */
  var fileIn = $("pt-file");
  fileIn.addEventListener("change", function(){ addFiles(fileIn.files); fileIn.value = ""; });
  document.querySelectorAll("[data-pt-add]").forEach(function(b){ b.addEventListener("click", function(){ fileIn.click(); }); });
  $("pt-blank").addEventListener("click", blankPage);
  $("pt-all").addEventListener("click", function(){ var on = selected().length !== pages.length; pages.forEach(function(p){ p.sel = on; }); renderGrid(); });
  $("pt-rot-sel").addEventListener("click", function(){ var l = selected(); if (!l.length) return say(S.noSel, "err"); rotate(l, 90); });
  $("pt-del-sel").addEventListener("click", function(){ var l = selected(); if (!l.length) return say(S.noSel, "err"); remove(l); });
  $("pt-clear").addEventListener("click", function(){ if (!pages.length || !confirm(S.clearAsk)) return; pages = []; sources.forEach(function(s){ try { s.js.destroy(); } catch (e) {} }); sources = []; renderGrid(); });

  ["dragenter", "dragover"].forEach(function(t){ document.addEventListener(t, function(ev){ if (dragId == null && ev.dataTransfer && Array.prototype.indexOf.call(ev.dataTransfer.types || [], "Files") >= 0){ ev.preventDefault(); drop.classList.add("hot"); } }); });
  ["dragleave", "drop"].forEach(function(t){ document.addEventListener(t, function(){ drop.classList.remove("hot"); }); });
  document.addEventListener("drop", function(ev){ if (dragId == null && ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length){ ev.preventDefault(); addFiles(ev.dataTransfer.files); } });

  /* ---------- page editor ---------- */
  var ed = { el: $("pt-editor"), stage: $("pt-stage"), wrap: $("pt-pagewrap"), canvas: $("pt-pagecanvas"), layer: $("pt-layer"),
    i: 0, p: null, vp: null, zoom: 1, sel: null, task: null };

  function openEditor(i){
    if (i < 0 || i >= pages.length) return;
    ed.i = i; ed.p = pages[i]; ed.sel = null; ed.el.hidden = false; document.body.classList.add("pt-lock");
    $("pt-ed-page").textContent = S.page + " " + (i + 1) + " " + S.of + " " + pages.length;
    $("pt-ed-prev").disabled = i === 0; $("pt-ed-next").disabled = i === pages.length - 1;
    showProps(); renderPage();
  }
  function closeEditor(){
    if (ed.p) ed.p.dirty = true;
    ed.el.hidden = true; document.body.classList.remove("pt-lock"); ed.p = null; renderGrid();
  }
  async function renderPage(){
    var p = ed.p; if (!p) return;
    var pg = await p.src.js.getPage(p.idx + 1);
    var v1 = pg.getViewport({ scale: 1, rotation: total(p) });
    var avail = Math.min(920, Math.max(200, ed.stage.clientWidth - 24));
    var s = Math.min(avail / v1.width, 2.2) * ed.zoom;
    var vp = pg.getViewport({ scale: s, rotation: total(p) });
    ed.vp = vp;
    var c = ed.canvas;
    c.width = Math.ceil(vp.width * DPR); c.height = Math.ceil(vp.height * DPR);
    c.style.width = vp.width + "px"; c.style.height = vp.height + "px";
    ed.wrap.style.width = vp.width + "px"; ed.wrap.style.height = vp.height + "px";
    if (ed.task) try { ed.task.cancel(); } catch (e) {}
    var ctx = c.getContext("2d"); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ed.task = pg.render({ canvasContext: ctx, viewport: pg.getViewport({ scale: s * DPR, rotation: total(p) }) });
    layoutItems();
    try { await ed.task.promise; } catch (e) {}
  }

  function layoutItems(){
    ed.layer.replaceChildren();
    ed.p.annots.forEach(function(a){ ed.layer.append(itemEl(a)); });
  }
  function placeEl(e, a){
    var vp = ed.vp, c = vp.convertToViewportPoint(a.cx, a.cy), w = a.w * vp.scale, h = a.h * vp.scale;
    e.style.width = w + "px"; e.style.height = h + "px";
    e.style.left = (c[0] - w / 2) + "px"; e.style.top = (c[1] - h / 2) + "px";
    e.style.transform = "rotate(" + (total(ed.p) - a.A) + "deg)";
  }
  function paintEl(e, a){
    var cv = e.querySelector("canvas"), vp = ed.vp;
    var k = vp.scale * DPR;
    cv.width = Math.max(1, Math.ceil(a.w * k)); cv.height = Math.max(1, Math.ceil(a.h * k));
    var ctx = cv.getContext("2d"); ctx.translate(cv.width / 2, cv.height / 2); drawItem(ctx, a, k);
  }
  function itemEl(a){
    var e = el("div", "pt-item t-" + a.type + (ed.sel === a ? " on" : "")); e.dataset.id = a.id;
    e.append(el("canvas"));
    var hd = el("span", "pt-handle"); hd.setAttribute("aria-hidden", "true"); e.append(hd);
    placeEl(e, a); paintEl(e, a);
    e.addEventListener("pointerdown", function(ev){ startDrag(ev, a, e, ev.target === hd); });
    return e;
  }
  function refreshItem(a){
    var e = ed.layer.querySelector('[data-id="' + a.id + '"]'); if (!e) return;
    placeEl(e, a); paintEl(e, a);
  }
  function select(a){
    ed.sel = a;
    ed.layer.querySelectorAll(".pt-item").forEach(function(e){ e.classList.toggle("on", a && e.dataset.id == a.id); });
    showProps();
  }
  function startDrag(ev, a, e, resize){
    ev.preventDefault(); ev.stopPropagation(); select(a);
    try { e.setPointerCapture(ev.pointerId); } catch (x) {}
    var vp = ed.vp, rect = ed.wrap.getBoundingClientRect();
    var c0 = vp.convertToViewportPoint(a.cx, a.cy);
    var sx = ev.clientX, sy = ev.clientY, w0 = a.w, h0 = a.h, size0 = a.size;
    var ang = (total(ed.p) - a.A) * Math.PI / 180;
    function mv(m){
      if (resize){
        var dx = m.clientX - rect.left - c0[0], dy = m.clientY - rect.top - c0[1];
        var lx = Math.abs(dx * Math.cos(ang) + dy * Math.sin(ang)), ly = Math.abs(-dx * Math.sin(ang) + dy * Math.cos(ang));
        var nw = Math.max(8, 2 * lx / vp.scale), nh = Math.max(6, 2 * ly / vp.scale);
        if (a.type === "text"){ a.size = Math.max(5, Math.min(200, size0 * Math.max(nw / w0, nh / h0))); fitText(a); syncProps(); }
        else if (a.type === "image" || a.type === "sign"){ var f = Math.max(nw / w0, nh / h0); a.w = Math.max(8, w0 * f); a.h = Math.max(6, h0 * f); }
        else { a.w = nw; a.h = nh; }
      } else {
        var p = vp.convertToPdfPoint(c0[0] + m.clientX - sx, c0[1] + m.clientY - sy);
        a.cx = p[0]; a.cy = p[1];
      }
      placeEl(e, a); if (resize) paintEl(e, a);
    }
    function up(){ e.removeEventListener("pointermove", mv); e.removeEventListener("pointerup", up); e.removeEventListener("pointercancel", up); }
    e.addEventListener("pointermove", mv); e.addEventListener("pointerup", up); e.addEventListener("pointercancel", up);
  }
  ed.wrap.addEventListener("pointerdown", function(ev){ if (ev.target === ed.wrap || ev.target === ed.canvas || ev.target === ed.layer) select(null); });

  // centre of the part of the page that is visible now, in PDF points
  function visibleCentre(){
    var r = ed.wrap.getBoundingClientRect(), s = ed.stage.getBoundingClientRect();
    var x0 = Math.max(r.left, s.left), x1 = Math.min(r.right, s.right), y0 = Math.max(r.top, s.top), y1 = Math.min(r.bottom, s.bottom);
    var vx = (x0 < x1 ? (x0 + x1) / 2 : (r.left + r.right) / 2) - r.left, vy = (y0 < y1 ? (y0 + y1) / 2 : (r.top + r.bottom) / 2) - r.top;
    return ed.vp.convertToPdfPoint(vx, vy);
  }
  function addItem(a){
    var c = visibleCentre();
    a.id = nid(); a.cx = c[0]; a.cy = c[1]; a.A = total(ed.p);
    ed.p.annots.push(a); ed.layer.append(itemEl(a)); select(a);
  }
  function pageWidthPt(){ return ed.vp.width / ed.vp.scale; }

  var last = { size: 16, color: "#000000", bold: false };
  $("pt-add-text").addEventListener("click", function(){
    var a = { type: "text", text: S.typeHere, size: last.size, color: last.color, bold: last.bold, align: "auto", bg: false };
    fitText(a); addItem(a);
    var ta = $("pt-p-text"); ta.focus(); ta.select();
  });
  $("pt-add-white").addEventListener("click", function(){ addItem({ type: "white", w: 140, h: 28, color: "#ffffff" }); });
  $("pt-add-mark").addEventListener("click", function(){ addItem({ type: "mark", w: 160, h: 18, color: "#ffe14d" }); });
  var imgIn = $("pt-imgfile");
  $("pt-add-img").addEventListener("click", function(){ imgIn.click(); });
  imgIn.addEventListener("change", async function(){
    var f = imgIn.files[0]; imgIn.value = ""; if (!f) return;
    try {
      var r = await normImage(f, 2000);
      var w = Math.min(pageWidthPt() * 0.5, r.im.naturalWidth * 0.75), h = w * r.im.naturalHeight / r.im.naturalWidth;
      addItem({ type: "image", url: r.url, im: r.im, w: w, h: h });
    } catch (err){ say(S.notSupported + f.name, "err"); }
  });

  /* properties bar for the selected item */
  function showProps(){
    var a = ed.sel, bar = $("pt-props");
    bar.hidden = !a;
    if (!a) return;
    bar.dataset.type = a.type;
    syncProps();
  }
  function syncProps(){
    var a = ed.sel; if (!a) return;
    if (a.type === "text"){
      if (document.activeElement !== $("pt-p-text")) $("pt-p-text").value = a.text;
      $("pt-p-size").value = Math.round(a.size); $("pt-p-color").value = a.color; $("pt-p-bold").checked = !!a.bold;
      $("pt-p-align").value = a.align || "auto"; $("pt-p-bg").checked = !!a.bg;
    } else if (a.type === "white" || a.type === "mark"){ $("pt-p-fill").value = a.color; }
  }
  function onText(){
    var a = ed.sel; if (!a || a.type !== "text") return;
    var cx = a.cx, cy = a.cy;
    a.text = $("pt-p-text").value; a.size = Math.max(5, Math.min(200, +$("pt-p-size").value || 16));
    a.color = $("pt-p-color").value; a.bold = $("pt-p-bold").checked; a.align = $("pt-p-align").value; a.bg = $("pt-p-bg").checked;
    last = { size: a.size, color: a.color, bold: a.bold };
    fitText(a); a.cx = cx; a.cy = cy; refreshItem(a);
  }
  ["pt-p-text", "pt-p-size", "pt-p-color", "pt-p-bold", "pt-p-align", "pt-p-bg"].forEach(function(id){ $(id).addEventListener("input", onText); $(id).addEventListener("change", onText); });
  $("pt-p-fill").addEventListener("input", function(){ var a = ed.sel; if (a){ a.color = $("pt-p-fill").value; refreshItem(a); } });
  function delSel(){ var a = ed.sel; if (!a) return; ed.p.annots = ed.p.annots.filter(function(x){ return x !== a; }); select(null); layoutItems(); }
  $("pt-p-del").addEventListener("click", delSel);
  document.addEventListener("keydown", function(ev){
    if (ed.el.hidden) return;
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (ev.key === "Escape"){ if (!$("pt-sigbox").hidden) closeSig(); else if (ed.sel) select(null); else closeEditor(); }
    else if ((ev.key === "Delete" || ev.key === "Backspace") && ed.sel && !/INPUT|TEXTAREA|SELECT/.test(tag)){ ev.preventDefault(); delSel(); }
  });

  $("pt-ed-done").addEventListener("click", closeEditor);
  $("pt-ed-prev").addEventListener("click", function(){ ed.p.dirty = true; openEditor(ed.i - 1); });
  $("pt-ed-next").addEventListener("click", function(){ ed.p.dirty = true; openEditor(ed.i + 1); });
  $("pt-ed-rot").addEventListener("click", function(){ ed.p.rot = (ed.p.rot + 90) % 360; ed.p.dirty = true; renderPage(); });
  $("pt-zin").addEventListener("click", function(){ ed.zoom = Math.min(4, ed.zoom * 1.25); renderPage(); });
  $("pt-zout").addEventListener("click", function(){ ed.zoom = Math.max(0.4, ed.zoom / 1.25); renderPage(); });
  var rz = 0; window.addEventListener("resize", function(){ if (ed.el.hidden) return; clearTimeout(rz); rz = setTimeout(renderPage, 200); });

  /* ---------- signature pad ---------- */
  var sig = { box: $("pt-sigbox"), c: $("pt-sigpad"), color: "#0b1f6b", width: 2.6, strokes: 0 };
  function openSig(){
    sig.box.hidden = false;
    var r = sig.c.getBoundingClientRect();
    sig.c.width = Math.round(r.width * DPR); sig.c.height = Math.round(r.height * DPR);
    var ctx = sig.c.getContext("2d"); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
    sig.strokes = 0;
    $("pt-sig-saved").hidden = !store("pt-signature");
  }
  function closeSig(){ sig.box.hidden = true; }
  (function(){
    var drawing = false, lx = 0, ly = 0;
    function pos(ev){ var r = sig.c.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; }
    sig.c.addEventListener("pointerdown", function(ev){
      ev.preventDefault(); drawing = true; try { sig.c.setPointerCapture(ev.pointerId); } catch (e) {}
      var p = pos(ev); lx = p[0]; ly = p[1];
      var ctx = sig.c.getContext("2d"); ctx.fillStyle = sig.color; ctx.beginPath(); ctx.arc(lx, ly, sig.width / 2, 0, 7); ctx.fill(); sig.strokes++;
    });
    sig.c.addEventListener("pointermove", function(ev){
      if (!drawing) return;
      var p = pos(ev), ctx = sig.c.getContext("2d");
      ctx.strokeStyle = sig.color; ctx.lineWidth = sig.width; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(lx, ly);
      var mx = (lx + p[0]) / 2, my = (ly + p[1]) / 2; ctx.quadraticCurveTo(lx, ly, mx, my); ctx.lineTo(p[0], p[1]); ctx.stroke();
      lx = p[0]; ly = p[1];
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function(t){ sig.c.addEventListener(t, function(){ drawing = false; }); });
  })();
  // crop the drawing to its ink
  function trimmed(canvas){
    var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height, d = ctx.getImageData(0, 0, w, h).data;
    var x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null;
    var m = Math.round(4 * DPR); x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w - 1, x1 + m); y1 = Math.min(h - 1, y1 + m);
    var o = el("canvas"); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
    o.getContext("2d").drawImage(canvas, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
    return o.toDataURL("image/png");
  }
  async function placeSignature(url){
    var im = await loadImage(url);
    var w = Math.min(pageWidthPt() * 0.32, 170), h = w * im.naturalHeight / im.naturalWidth;
    addItem({ type: "sign", url: url, im: im, w: w, h: h });
  }
  $("pt-add-sign").addEventListener("click", openSig);
  $("pt-sig-cancel").addEventListener("click", closeSig);
  $("pt-sig-clear").addEventListener("click", openSig);
  document.querySelectorAll("[data-pen]").forEach(function(b){ b.addEventListener("click", function(){
    sig.color = b.getAttribute("data-pen");
    document.querySelectorAll("[data-pen]").forEach(function(x){ x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
  }); });
  $("pt-sig-ok").addEventListener("click", async function(){
    var url = sig.strokes ? trimmed(sig.c) : null;
    if (!url) return say(S.sigEmpty, "err");
    if ($("pt-sig-keep").checked) store("pt-signature", url);
    closeSig(); await placeSignature(url);
  });
  $("pt-sig-saved").addEventListener("click", async function(){ var u = store("pt-signature"); if (!u) return; closeSig(); await placeSignature(u); });
  var sigFile = $("pt-sigfile");
  $("pt-sig-upload").addEventListener("click", function(){ sigFile.click(); });
  sigFile.addEventListener("change", async function(){
    var f = sigFile.files[0]; sigFile.value = ""; if (!f) return;
    try { var r = await normImage(f, 1600); closeSig(); await placeSignature(r.url); } catch (e) { say(S.notSupported + f.name, "err"); }
  });

  // make sure the Arabic font is ready before any text is measured
  if (document.fonts && document.fonts.load){
    ["400", "600"].forEach(function(w){ document.fonts.load(w + ' 20px "IBM Plex Sans Arabic"', "نص").catch(function(){}); document.fonts.load(w + ' 20px "IBM Plex Sans"', "Text").catch(function(){}); });
  }
  renderGrid();
})();
