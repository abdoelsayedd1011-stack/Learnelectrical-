/* مولّد QR صغير (من غير مكتبات): Byte mode، تصحيح أخطاء M، إصدارات 1 لحد 10 (لحد 213 بايت).
   مكتوب للموقع على خطوات معيار ISO/IEC 18004 (نفس طريقة Project Nayuki، رخصة MIT).
   الاستخدام: QR.svg("https://…", {size: 160, label: "…"}) بيرجّع نص SVG. */
(function(){
  "use strict";
  // تصحيح M فقط: عدد بايتات التصحيح لكل بلوك، وعدد البلوكات، لكل إصدار
  var ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  var NUM_BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
  var FORMAT_M = 0; // بتات مستوى التصحيح M في معلومات الفورمات

  function rawModules(ver){
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2){ var n = Math.floor(ver / 7) + 2; r -= (25 * n - 10) * n - 55; if (ver >= 7) r -= 36; }
    return r;
  }
  function dataCodewords(ver){ return Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver]; }
  function alignPos(ver){
    if (ver === 1) return [];
    var n = Math.floor(ver / 7) + 2, step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2, out = [6];
    for (var i = 0, pos = ver * 4 + 10; i < n - 1; i++, pos -= step) out.splice(1, 0, pos);
    return out;
  }
  function gfMul(x, y){
    var z = 0;
    for (var i = 7; i >= 0; i--){ z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; }
    return z & 0xFF;
  }
  function rsDivisor(deg){
    var r = []; for (var i = 0; i < deg - 1; i++) r.push(0); r.push(1);
    var root = 1;
    for (i = 0; i < deg; i++){
      for (var j = 0; j < r.length; j++){ r[j] = gfMul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
      root = gfMul(root, 2);
    }
    return r;
  }
  function rsRemainder(data, div){
    var r = div.map(function(){ return 0; });
    data.forEach(function(b){
      var f = b ^ r.shift(); r.push(0);
      div.forEach(function(c, i){ r[i] ^= gfMul(c, f); });
    });
    return r;
  }
  function utf8(s){
    var e = unescape(encodeURIComponent(s)), out = [];
    for (var i = 0; i < e.length; i++) out.push(e.charCodeAt(i));
    return out;
  }

  function encode(text){
    var bytes = utf8(String(text)), ver;
    for (ver = 1; ver <= 10; ver++){
      var ccBits = ver < 10 ? 8 : 16;
      if (4 + ccBits + bytes.length * 8 <= dataCodewords(ver) * 8) break;
    }
    if (ver > 10) throw new Error("QR: النص طويل");
    // البتات: الوضع 0100 + عدد البايتات + البيانات + نهاية + حشو
    var bits = [];
    function put(v, n){ for (var i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); }
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16);
    bytes.forEach(function(b){ put(b, 8); });
    var cap = dataCodewords(ver) * 8;
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8){ var v = 0; for (var j = 0; j < 8; j++) v = (v << 1) | bits[i + j]; data.push(v); }

    // البلوكات وبايتات التصحيح، وبعدين التداخل
    var nb = NUM_BLOCKS[ver], el = ECC_PER_BLOCK[ver], raw = Math.floor(rawModules(ver) / 8);
    var nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), div = rsDivisor(el), blocks = [], k = 0;
    for (i = 0; i < nb; i++){
      var d = data.slice(k, k + shortLen - el + (i < nShort ? 0 : 1)); k += d.length;
      var ecc = rsRemainder(d, div);
      if (i < nShort) d.push(0);
      blocks.push(d.concat(ecc));
    }
    var all = [];
    for (i = 0; i < blocks[0].length; i++) for (j = 0; j < blocks.length; j++)
      if (i !== shortLen - el || j >= nShort) all.push(blocks[j][i]);

    var size = ver * 4 + 17, mod = [], fn = [];
    for (i = 0; i < size; i++){ mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function setF(x, y, dark){ mod[y][x] = dark; fn[y][x] = true; }
    // أنماط ثابتة: التوقيت، المربعات الكبيرة، المحاذاة
    for (i = 0; i < size; i++){ setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function(c){
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++){
        var x = c[0] + dx, y = c[1] + dy, dist = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && x < size && y >= 0 && y < size) setF(x, y, dist !== 2 && dist !== 4);
      }
    });
    var ap = alignPos(ver), last = ap.length - 1;
    ap.forEach(function(ay, a){ ap.forEach(function(ax, b){
      if ((a === 0 && b === 0) || (a === 0 && b === last) || (a === last && b === 0)) return;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) setF(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }); });
    function drawFormat(mask){
      var dat = (FORMAT_M << 3) | mask, rem = dat;
      for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var b = ((dat << 10) | rem) ^ 0x5412, bit = function(n){ return ((b >>> n) & 1) !== 0; };
      for (i = 0; i <= 5; i++) setF(8, i, bit(i));
      setF(8, 7, bit(6)); setF(8, 8, bit(7)); setF(7, 8, bit(8));
      for (i = 9; i < 15; i++) setF(14 - i, 8, bit(i));
      for (i = 0; i < 8; i++) setF(size - 1 - i, 8, bit(i));
      for (i = 8; i < 15; i++) setF(8, size - 15 + i, bit(i));
      setF(8, size - 8, true);
    }
    drawFormat(0);
    if (ver >= 7){
      var rem = ver;
      for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var vb = (ver << 12) | rem;
      for (i = 0; i < 18; i++){ var bt = ((vb >>> i) & 1) !== 0, a1 = size - 11 + i % 3, b1 = Math.floor(i / 3); setF(a1, b1, bt); setF(b1, a1, bt); }
    }
    // البيانات بالتعرّج من تحت لفوق
    var n = 0;
    for (var right = size - 1; right >= 1; right -= 2){
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (j = 0; j < 2; j++){
        var x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && n < all.length * 8){ mod[y][x] = ((all[n >>> 3] >>> (7 - (n & 7))) & 1) !== 0; n++; }
      }
    }
    // الماسك: نجرّب التمانية وناخد الأقل عقوبة
    function applyMask(m){
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++){
        if (fn[y][x]) continue;
        var inv;
        switch (m){
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = x * y % 2 + x * y % 3 === 0; break;
          case 6: inv = (x * y % 2 + x * y % 3) % 2 === 0; break;
          default: inv = ((x + y) % 2 + x * y % 3) % 2 === 0;
        }
        if (inv) mod[y][x] = !mod[y][x];
      }
    }
    function penalty(){
      var p = 0, dark = 0, x, y, run, line;
      var P1 = [true, false, true, true, true, false, true, false, false, false, false], P2 = P1.slice().reverse();
      for (var pass = 0; pass < 2; pass++){
        for (var a = 0; a < size; a++){
          line = [];
          for (var b = 0; b < size; b++) line.push(pass ? mod[b][a] : mod[a][b]);
          run = 1;
          for (b = 1; b <= size; b++){
            if (b < size && line[b] === line[b - 1]) run++;
            else { if (run >= 5) p += run - 2; run = 1; }
          }
          for (b = 0; b + 11 <= size; b++){
            var m1 = true, m2 = true;
            for (var c = 0; c < 11; c++){ if (line[b + c] !== P1[c]) m1 = false; if (line[b + c] !== P2[c]) m2 = false; }
            if (m1) p += 40; if (m2) p += 40;
          }
        }
      }
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++){
        var v = mod[y][x];
        if (v === mod[y][x + 1] && v === mod[y + 1][x] && v === mod[y + 1][x + 1]) p += 3;
      }
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (mod[y][x]) dark++;
      var total = size * size;
      p += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
      return p;
    }
    var best = 0, bestP = Infinity;
    for (var m = 0; m < 8; m++){
      applyMask(m); drawFormat(m);
      var pv = penalty();
      if (pv < bestP){ bestP = pv; best = m; }
      applyMask(m);
    }
    applyMask(best); drawFormat(best);
    return { size: size, version: ver, modules: mod };
  }

  function svg(text, opt){
    opt = opt || {};
    var q = encode(text), border = 4, dim = q.size + border * 2, path = "";
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++)
      if (q.modules[y][x]) path += "M" + (x + border) + " " + (y + border) + "h1v1h-1z";
    var px = opt.size ? ' width="' + opt.size + '" height="' + opt.size + '"' : "";
    var label = String(opt.label || "QR").replace(/[<>&"]/g, "");
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + " " + dim + '"' + px + ' role="img" aria-label="' + label + '" shape-rendering="crispEdges">' +
      '<rect width="100%" height="100%" fill="#fff"/><path d="' + path + '" fill="#000"/></svg>';
  }

  window.QR = { encode: encode, svg: svg };
})();
