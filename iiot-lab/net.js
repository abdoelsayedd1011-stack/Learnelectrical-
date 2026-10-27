/* محاكي الشبكات الصناعية – LearnElectricals (MSA UI) */
(function(){
'use strict';
const $ = IL.$, $$ = IL.$$, esc = IL.esc;
IL.hubTheme();

const TABS = [
  {id:'ip', t:'IP', l:'l2', h:'عناوين IP والشبكة الفرعية', goal:'اجعل الأجهزة الأربعة في شبكة فرعية واحدة بلا عنوان مكرر، ثم نفّذ ping من الحاسوب المحمول إلى الثلاثة الأخرى بنجاح.'},
  {id:'modbus', t:'Modbus RTU', l:'l3', h:'Modbus RTU على RS-485', goal:'اضبط الإنهاء وإعدادات المنفذ، ثم اقرأ بنجاح ثلاث مرات من جهازين مختلفين على الأقل.'},
  {id:'mbtcp', t:'Modbus TCP', l:'l4', h:'عميل Modbus TCP', goal:'اقرأ سجل الحرارة (العنوان 0) من الـ PLC، ثم اكتب نقطة ضبط جديدة في السجل 4 بالدالة FC6 واقرأها للتأكد.'},
  {id:'profibus', t:'PROFIBUS', l:'l5', h:'PROFIBUS DP: العناوين والإنهاء و GSD', goal:'اجعل المحطات الأربع تتبادل البيانات (كل المصابيح خضراء): العنوان على القرص يطابق التهيئة، ملف GSD مثبّت، والإنهاء في طرفي الناقل فقط.'},
  {id:'profinet', t:'PROFINET', l:'l6', h:'PROFINET: اسم الجهاز و DCP', goal:'أعطِ كل جهاز اسمه الصحيح حتى يمنحه المتحكم عنوان IP ويتصل (ثلاثة أجهزة خضراء).'},
  {id:'can', t:'CAN', l:'l7', h:'CAN bus: التحكيم والإنهاء', goal:'وحّد معدل البت، صحّح الإنهاء حتى تقيس 60 Ω، ثم شغّل التحكيم مرة واحدة وشاهد ترتيب الفوز.'},
  {id:'opcua', t:'OPC UA', l:'l9', h:'عميل OPC UA', goal:'اتصل بالخادم بسياسة أمان مشفّرة (بعد توثيق الشهادة)، اقرأ OvenTemp، ثم اشترك فيه.'},
  {id:'mqtt', t:'MQTT', l:'l10', h:'MQTT: نشر واشتراك', goal:'اشترك بفلتر يستخدم + ليلتقط أفران الخطين معًا، واستقبل رسالتين على الأقل، ثم انشر رسالة حالة محتفظًا بها (Retain).'},
  {id:'gateway', t:'البوابة', l:'l11', h:'بوابة Node-RED', goal:'اربط العُقد الثلاث بالترتيب، اضبط قاسم الحرارة على 10، ثم انشر (Deploy) وشاهد JSON صحيحًا يخرج إلى الوسيط.'},
  {id:'dash', t:'اللوحة', l:'l12', h:'لوحة المتابعة والإنذارات و OEE والاتجاهات', goal:'اضبط الإنذار حتى يختفي الكاذب ويبقى الحقيقي، واحسب OEE، ثم توقّع أسبوع عبور الاهتزاز لحد ISO.'},
  {id:'faults', t:'الأعطال', l:'l14', h:'مشروع خط التعبئة: ثلاثة أعطال مخفية', goal:'اعثر على الأعطال الثلاثة بالأداة الصحيحة وأصلح كل واحد بالإجراء الصحيح حتى تعود كل الوحدات خضراء.'}
];
const tabsEl = $('#tabs'), panes = $('#panes');
const G = {};
TABS.forEach(tb => {
  const b = document.createElement('button'); b.className = 'btn' + (IL.has(tb.l, 'sim') ? ' done' : ''); b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = tb.t; b.dataset.id = tb.id;
  b.addEventListener('click', () => show(tb.id)); tabsEl.appendChild(b);
  const p = document.createElement('section'); p.className = 'pane'; p.id = 'p-' + tb.id;
  p.innerHTML = `<h2 style="margin:0 0 8px">${esc(tb.h)}</h2><div class="goal${IL.has(tb.l, 'sim') ? ' ok' : ''}" id="g-${tb.id}"><b class="k">${IL.has(tb.l, 'sim') ? '✓ أُنجز' : 'المطلوب'}</b>${esc(tb.goal)}</div><div class="body"></div>`;
  panes.appendChild(p); G[tb.id] = tb;
});
function show(id){
  if (!G[id]) id = 'ip';
  $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + id));
  $$('#tabs .btn').forEach(b => b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false'));
  if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  if (!G[id].built){ G[id].built = true; BUILD[id]($('#p-' + id + ' .body')); }
}
function win(id, msg){
  const tb = G[id]; IL.mark(tb.l, 'sim');
  const g = $('#g-' + id); g.classList.add('ok'); g.innerHTML = `<b class="k">✓ أُنجز</b>${esc(msg || tb.goal)}`;
  $(`#tabs .btn[data-id="${id}"]`).classList.add('done');
}
function logTo(el, html, cls){ const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = html; el.appendChild(d); el.scrollTop = el.scrollHeight; }
const hex = n => n.toString(16).toUpperCase().padStart(2, '0');
const bytesHtml = (arr, hl) => '<div class="bytes">' + arr.map((b, i) => `<span class="${hl && hl(i) || ''}">${hex(b)}</span>`).join('') + '</div>';
function crc16(buf){ let c = 0xFFFF; for (const b of buf){ c ^= b; for (let i = 0; i < 8; i++) c = (c & 1) ? (c >>> 1) ^ 0xA001 : c >>> 1; } return c; }
const ip2n = s => { const p = String(s).trim().split('.'); if (p.length !== 4) return null; let n = 0; for (const x of p){ if (!/^\d{1,3}$/.test(x) || +x > 255) return null; n = n * 256 + +x; } return n; };
const BUILD = {};

/* ---------------- 1. IP ---------------- */
BUILD.ip = host => {
  const devs = [
    {n:'PLC S7-1200', ip:'192.168.1.10', m:'255.255.255.0'},
    {n:'شاشة HMI', ip:'192.168.1.20', m:'255.255.255.0'},
    {n:'البوابة (Gateway)', ip:'192.168.2.5', m:'255.255.255.0'},
    {n:'الحاسوب المحمول', ip:'192.168.1.10', m:'255.255.255.0'}
  ];
  host.innerHTML = `<div class="panel"><p>أربعة أجهزة على مفتاح واحد بلا راوتر. حاليًا يوجد <b>عنوان مكرر</b> وجهاز في <b>شبكة فرعية أخرى</b>. عدّل العناوين ثم اختبر.</p>
  <div class="grid2">${devs.map((d, i) => `<div class="dev"><h3><i class="led" id="ipl${i}"></i>${esc(d.n)}</h3><label>IP <input id="ipa${i}" value="${d.ip}"></label><label>Mask <input id="ipm${i}" value="${d.m}"></label></div>`).join('')}</div>
  <div class="row"><button class="btn pri" id="ipping">ping من الحاسوب المحمول إلى الجميع</button></div><div class="log" id="iplog"><span class="dim">C:\\&gt; _</span></div></div>`;
  const log = $('#iplog', host);
  $('#ipping', host).addEventListener('click', () => {
    log.innerHTML = '';
    const cfg = devs.map((d, i) => ({n:d.n, ip:ip2n($('#ipa' + i, host).value), m:ip2n($('#ipm' + i, host).value), s:$('#ipa' + i, host).value.trim()}));
    let ok = 0;
    if (cfg.some(c => c.ip === null || c.m === null)){ logTo(log, 'عنوان أو قناع غير صالح.', 'bad'); return; }
    const me = cfg[3];
    const dup = s => cfg.filter(c => c.s === s).length > 1;
    for (let i = 0; i < 3; i++){
      const t = cfg[i];
      logTo(log, `C:\\> ping ${t.s}`, 'dim');
      $('#ipl' + i, host).className = 'led';
      if (dup(t.s) || dup(me.s)){ logTo(log, `Reply from ${t.s}: TTL=64 ... Reply from ${t.s}: TTL=128  (ردّان من جهازين بعنوان واحد: <b>عنوان مكرر</b>)`, 'bad'); $('#ipl' + i, host).className = 'led r'; continue; }
      if ((t.ip & me.m) !== (me.ip & me.m) || (t.ip & t.m) !== (me.ip & t.m)){ logTo(log, `Request timed out. (الجهاز في شبكة فرعية مختلفة عن ${me.s}: لا يوجد راوتر بينهما)`, 'bad'); $('#ipl' + i, host).className = 'led r'; continue; }
      logTo(log, `Reply from ${t.s}: bytes=32 time<1ms TTL=64`, 'ok'); $('#ipl' + i, host).className = 'led g'; ok++;
    }
    $('#ipl3', host).className = dup(me.s) ? 'led r' : 'led g';
    if (ok === 3){ logTo(log, 'الأجهزة الأربعة في شبكة واحدة بلا تكرار ✓', 'ok'); win('ip'); }
  });
};

/* ---------------- 2. Modbus RTU ---------------- */
BUILD.modbus = host => {
  const slaves = [
    {n:'محوّل تردد ATV320', id:1, baud:19200, par:'E', regs:{0:5000, 1:4980, 2:124, 3:3, 4:2300}, names:{0:'تردد مرجعي ×0.01 Hz', 1:'التردد الفعلي', 2:'التيار ×0.1 A', 3:'كلمة الحالة', 4:'جهد الناقل'}},
    {n:'عداد طاقة', id:2, baud:19200, par:'E', regs:{0:2301, 1:155, 2:3567, 3:98}, names:{0:'الجهد ×0.1 V', 1:'التيار ×0.1 A', 2:'القدرة W', 3:'معامل القدرة %'}},
    {n:'متحكم حرارة E5CC', id:3, baud:9600, par:'N', regs:{0:1825, 1:1800, 2:0}, names:{0:'PV ×0.1 °C', 1:'SV ×0.1 °C', 2:'حالة الخرج'}}
  ];
  host.innerHTML = `<div class="panel"><p>سيد (البوابة) وثلاثة توابع على زوج RS-485 واحد. التابع الثالث جاء من المصنع بإعدادات مختلفة، والإنهاء مفقود في الطرف البعيد. كل الأجهزة يجب أن تعمل بنفس السرعة والتماثل، وبمقاومة 120 Ω في <b>الطرفين فقط</b>.</p>
  <div class="grid2">
   <div class="dev"><h3><i class="led g"></i>السيد (البوابة)</h3><label>Baud <select id="mb-b"><option>9600</option><option selected>19200</option><option>38400</option></select></label><label>Parity <select id="mb-p"><option value="E" selected>Even</option><option value="N">None</option><option value="O">Odd</option></select></label><label>إنهاء 120 Ω <input type="checkbox" id="mb-t0" checked></label></div>
   ${slaves.map((s, i) => `<div class="dev"><h3><i class="led" id="mbl${i}"></i>${esc(s.n)}</h3><label>Slave ID <input id="mbid${i}" type="number" min="1" max="247" value="${s.id}"></label><label>Baud <select id="mbb${i}"><option${s.baud == 9600 ? ' selected' : ''}>9600</option><option${s.baud == 19200 ? ' selected' : ''}>19200</option><option>38400</option></select></label><label>Parity <select id="mbp${i}"><option value="E"${s.par == 'E' ? ' selected' : ''}>Even</option><option value="N"${s.par == 'N' ? ' selected' : ''}>None</option><option value="O">Odd</option></select></label><label>إنهاء 120 Ω <input type="checkbox" id="mb-t${i + 1}"${i === 0 ? ' checked' : ''}></label><small class="muted">${i === 2 ? 'آخر جهاز على الناقل' : i === 0 ? 'في منتصف الناقل' : 'في منتصف الناقل'}</small></div>`).join('')}
  </div></div>
  <div class="panel"><h3 style="margin:0 0 8px">طلب Modbus</h3><div class="frm">
   <label>Slave ID<input id="mq-id" type="number" value="1" min="1" max="247"></label>
   <label>Function<select id="mq-fc"><option value="3">03 Read Holding</option><option value="4">04 Read Input</option><option value="6">06 Write Single</option></select></label>
   <label>Start (0-based)<input id="mq-a" type="number" value="0" min="0"></label>
   <label>Count / Value<input id="mq-n" type="number" value="2" min="1"></label>
   <button class="btn pri" id="mq-go">إرسال</button></div>
   <div id="mq-out"></div><div class="log" id="mq-log"></div><p class="muted" style="margin:8px 0 0">قراءات ناجحة: <b id="mq-cnt">0</b> من أجهزة: <b id="mq-dev">—</b></p></div>`;
  const log = $('#mq-log', host), out = $('#mq-out', host); const okSet = new Set(); let okN = 0;
  $('#mq-go', host).addEventListener('click', () => {
    const id = +$('#mq-id', host).value, fc = +$('#mq-fc', host).value, a = +$('#mq-a', host).value, n = +$('#mq-n', host).value;
    const req = [id, fc, a >> 8, a & 255, n >> 8, n & 255]; const c = crc16(req); req.push(c & 255, c >> 8);
    out.innerHTML = '<div><b>الطلب:</b></div>' + bytesHtml(req, i => i === 0 ? 'h' : i >= 6 ? 'c' : '');
    const mb = +$('#mb-b', host).value, mp = $('#mb-p', host).value;
    const term = [0, 1, 2, 3].map(i => $('#mb-t' + i, host).checked);
    const termOk = term[0] && term[3] && !term[1] && !term[2];
    const si = slaves.findIndex((s, i) => +$('#mbid' + i, host).value === id);
    slaves.forEach((s, i) => $('#mbl' + i, host).className = 'led');
    if (si < 0){ logTo(log, `TX ${req.map(hex).join(' ')}\nRX: timeout (لا يوجد تابع بالمعرّف ${id})`, 'bad'); return; }
    const s = slaves[si];
    if (+$('#mbb' + si, host).value !== mb || $('#mbp' + si, host).value !== mp){ logTo(log, `TX ${req.map(hex).join(' ')}\nRX: timeout / framing error (إعدادات التابع ${id} لا تطابق السيد: ${$('#mbb' + si, host).value} ${$('#mbp' + si, host).value} مقابل ${mb} ${mp})`, 'bad'); $('#mbl' + si, host).className = 'led r'; return; }
    if (!termOk && Math.random() < 0.6){ logTo(log, `TX ${req.map(hex).join(' ')}\nRX: CRC error (انعكاسات على الناقل: راجع الإنهاء في الطرفين فقط)`, 'bad'); $('#mbl' + si, host).className = 'led y'; return; }
    const ids = [0, 1, 2, 3].map(i => +$('#mbid' + i, host).value);
    if (new Set(ids.slice(0, 3)).size < 3 && ids.slice(0, 3).filter(x => x === id).length > 1){ logTo(log, 'RX: collision / CRC error (معرّفان متطابقان يجيبان معًا)', 'bad'); return; }
    const max = Object.keys(s.regs).length;
    if (fc === 6){
      if (!(a in s.regs)){ const r = [id, fc | 0x80, 2]; const cc = crc16(r); r.push(cc & 255, cc >> 8); logTo(log, `RX ${r.map(hex).join(' ')}  → Exception 02 Illegal data address`, 'bad'); return; }
      s.regs[a] = n; logTo(log, `RX ${req.map(hex).join(' ')}  → كُتبت القيمة ${n} في السجل ${a} (${s.names[a]})`, 'ok'); $('#mbl' + si, host).className = 'led g'; return;
    }
    if (a + n > max || n < 1){ const r = [id, fc | 0x80, 2]; const cc = crc16(r); r.push(cc & 255, cc >> 8); logTo(log, `RX ${r.map(hex).join(' ')}  → Exception 02 Illegal data address (الجهاز يملك ${max} سجلات: 0..${max - 1})`, 'bad'); $('#mbl' + si, host).className = 'led y'; return; }
    const r = [id, fc, n * 2]; for (let i = 0; i < n; i++){ const v = s.regs[a + i]; r.push(v >> 8, v & 255); } const cc = crc16(r); r.push(cc & 255, cc >> 8);
    out.innerHTML += '<div><b>الرد:</b></div>' + bytesHtml(r, i => i === 0 ? 'h' : i >= r.length - 2 ? 'c' : '');
    logTo(log, `RX ${r.map(hex).join(' ')}\n` + Array.from({length:n}, (_, i) => `  reg ${a + i} = ${s.regs[a + i]}  (${s.names[a + i]})`).join('\n'), 'ok');
    $('#mbl' + si, host).className = 'led g'; okN++; okSet.add(id); $('#mq-cnt', host).textContent = okN; $('#mq-dev', host).textContent = [...okSet].join('، ');
    if (okN >= 3 && okSet.size >= 2 && termOk) win('modbus');
  });
};

/* ---------------- 3. Modbus TCP ---------------- */
BUILD.mbtcp = host => {
  const plc = {ip:'192.168.1.10', port:502, unit:1, regs:[1825, 3000, 1, 2450, 1800, 0, 0, 0, 0, 0], names:['حرارة الفرن ×0.1 °C', 'عدّاد القطع', 'Running', 'التيار ×0.01 A', 'نقطة الضبط ×0.1 °C', 'احتياطي', 'احتياطي', 'احتياطي', 'احتياطي', 'احتياطي']};
  let tid = 0, didRead = false, didWrite = false, didVerify = false;
  host.innerHTML = `<div class="panel"><div class="grid2"><div class="dev"><h3><i class="led g"></i>الخادم: PLC</h3><div class="mono">192.168.1.10 : 502 · Unit 1</div><div class="tblw"><table class="tbl"><thead><tr><th>العنوان</th><th>المعنى</th><th>القيمة</th></tr></thead><tbody id="mt-map"></tbody></table></div></div>
  <div class="dev"><h3>العميل (الحاسوب / البوابة)</h3><div class="frm">
   <label>IP<input id="mt-ip" value="192.168.1.11"></label><label>Port<input id="mt-port" type="number" value="502"></label><label>Unit ID<input id="mt-u" type="number" value="1"></label>
   <label>Function<select id="mt-fc"><option value="3">03 Read Holding</option><option value="6">06 Write Single</option><option value="16">16 Write Multiple</option></select></label>
   <label>Address<input id="mt-a" type="number" value="0" min="0"></label><label>Count / Value<input id="mt-n" type="number" value="1" min="1"></label>
   <button class="btn pri" id="mt-go">إرسال</button></div></div></div>
  <div id="mt-out" style="margin-top:8px"></div><div class="log" id="mt-log"></div></div>`;
  const map = $('#mt-map', host), log = $('#mt-log', host), out = $('#mt-out', host);
  const render = () => map.innerHTML = plc.regs.map((v, i) => `<tr><td class="mono">${i}</td><td>${plc.names[i]}</td><td class="mono">${v}</td></tr>`).join('');
  render();
  $('#mt-go', host).addEventListener('click', () => {
    const ip = $('#mt-ip', host).value.trim(), port = +$('#mt-port', host).value, u = +$('#mt-u', host).value, fc = +$('#mt-fc', host).value, a = +$('#mt-a', host).value, n = +$('#mt-n', host).value;
    tid = (tid + 1) & 0xFFFF;
    const pdu = [fc, a >> 8, a & 255, n >> 8, n & 255]; const mbap = [tid >> 8, tid & 255, 0, 0, 0, pdu.length + 1, u];
    out.innerHTML = '<div><b>الطلب:</b> MBAP (TID, PID, LEN, UID) ثم PDU</div>' + bytesHtml(mbap.concat(pdu), i => i < 7 ? 'h' : '');
    logTo(log, `> connect ${ip}:${port}`, 'dim');
    if (ip2n(ip) === null || (ip2n(ip) & 0xFFFFFF00) !== (ip2n(plc.ip) & 0xFFFFFF00)){ logTo(log, 'connect: timeout (لا طريق إلى هذا العنوان)', 'bad'); return; }
    if (ip !== plc.ip){ logTo(log, 'connect: timeout (لا يوجد جهاز على هذا العنوان؛ ping يفشل)', 'bad'); return; }
    if (port !== plc.port){ logTo(log, `connect: ECONNREFUSED (ping ينجح لكن المنفذ ${port} مغلق؛ Modbus TCP على 502)`, 'bad'); return; }
    if (u !== plc.unit){ logTo(log, 'RX: Exception 0B Gateway target device failed to respond (معرّف الوحدة خاطئ)', 'bad'); return; }
    if (![3, 6, 16].includes(fc)){ logTo(log, 'RX: Exception 01 Illegal function', 'bad'); return; }
    if (fc === 3){
      if (a + n > plc.regs.length){ logTo(log, 'RX: Exception 02 Illegal data address (السجلات 0..9 فقط)', 'bad'); return; }
      const r = [tid >> 8, tid & 255, 0, 0, 0, 3 + n * 2, u, 3, n * 2]; for (let i = 0; i < n; i++) r.push(plc.regs[a + i] >> 8, plc.regs[a + i] & 255);
      out.innerHTML += '<div><b>الرد:</b></div>' + bytesHtml(r, i => i < 7 ? 'h' : '');
      logTo(log, Array.from({length:n}, (_, i) => `reg ${a + i} = ${plc.regs[a + i]}${a + i === 0 ? '  → ' + (plc.regs[0] / 10).toFixed(1) + ' °C' : ''}`).join('\n'), 'ok');
      if (a === 0) didRead = true; if (a <= 4 && a + n > 4 && didWrite) didVerify = true;
    } else {
      if (a >= plc.regs.length){ logTo(log, 'RX: Exception 02 Illegal data address', 'bad'); return; }
      if (a === 0 || a === 1 || a === 3){ logTo(log, 'RX: Exception 04 Server device failure (سجل للقراءة فقط: قيمة مقاسة)', 'bad'); return; }
      plc.regs[a] = n & 0xFFFF; render(); logTo(log, `كُتبت ${n} في السجل ${a} (${plc.names[a]})${a === 4 ? ' → نقطة الضبط الآن ' + (n / 10).toFixed(1) + ' °C' : ''}`, 'ok'); if (a === 4) didWrite = true;
    }
    if (didRead && didWrite && didVerify) win('mbtcp');
  });
};

/* ---------------- 4. PROFIBUS ---------------- */
BUILD.profibus = host => {
  const st = [
    {n:'ET 200S (I/O بعيدة)', cfg:3, dial:3, gsd:true},
    {n:'محوّل تردد SINAMICS G120', cfg:4, dial:4, gsd:true},
    {n:'جزيرة صمامات Festo', cfg:5, dial:7, gsd:true},
    {n:'I/O بعيدة WAGO', cfg:6, dial:6, gsd:false}
  ];
  host.innerHTML = `<div class="panel"><p>السيد CPU 315-2DP بالعنوان 2 وسرعة 1.5 Mbit/s. في التهيئة (HW Config) لكل محطة عنوان وملف GSD. على كل جهاز قرص/مفاتيح DIP تحدد عنوانه الفعلي. مفاتيح الإنهاء على موصّلات D-Sub.</p>
  <div class="bus"><svg viewBox="0 0 720 90"><line x1="20" y1="45" x2="700" y2="45" stroke="currentColor" stroke-width="4"/><rect x="20" y="20" width="90" height="50" rx="6" fill="var(--panel)" stroke="var(--accent)" stroke-width="2"/><text x="65" y="41" text-anchor="middle" font-weight="700">السيد</text><text x="65" y="60" text-anchor="middle">addr 2</text>
  ${st.map((s, i) => `<g><rect x="${160 + i * 140}" y="20" width="110" height="50" rx="6" fill="var(--panel)" stroke="currentColor"/><circle id="pbs${i}" cx="${175 + i * 140}" cy="35" r="6" fill="#777"/><text x="${215 + i * 140}" y="41" text-anchor="middle" font-size="10">${esc(s.n.split(' (')[0])}</text><text x="${215 + i * 140}" y="60" text-anchor="middle">cfg ${s.cfg}</text></g>`).join('')}
  <text x="20" y="85" font-size="10">A</text><text x="700" y="85" font-size="10" text-anchor="end">B (الطرف البعيد)</text></svg></div>
  <div class="grid2" style="margin-top:10px">
   <div class="dev"><h3><i class="led g"></i>السيد (HW Config)</h3><label>إنهاء على موصّل السيد <input type="checkbox" id="pb-t0" checked></label><label>Baud <select id="pb-b"><option>500 kbit/s</option><option selected>1.5 Mbit/s</option><option>12 Mbit/s</option></select></label></div>
   ${st.map((s, i) => `<div class="dev"><h3><i class="led" id="pbl${i}"></i>${esc(s.n)}</h3><label>العنوان في التهيئة <b class="mono">${s.cfg}</b></label><label>القرص على الجهاز <input id="pbd${i}" type="number" min="0" max="126" value="${s.dial}"></label><label>GSD مثبّت في HW Config <input type="checkbox" id="pbg${i}"${s.gsd ? ' checked' : ''}></label><label>إنهاء على الموصّل <input type="checkbox" id="pbt${i}"${i === 1 ? ' checked' : ''}></label></div>`).join('')}
  </div><div class="row"><button class="btn pri" id="pb-go">تنزيل التهيئة والاتصال</button></div><div class="log" id="pb-log"></div></div>`;
  const log = $('#pb-log', host);
  $('#pb-go', host).addEventListener('click', () => {
    log.innerHTML = ''; let ok = 0;
    const t = [$('#pb-t0', host).checked].concat(st.map((_, i) => $('#pbt' + i, host).checked));
    const termOk = t[0] && t[4] && !t[1] && !t[2] && !t[3];
    const dials = st.map((_, i) => +$('#pbd' + i, host).value);
    if (!termOk) logTo(log, t[0] && t[4] ? 'تحذير: إنهاء في منتصف الناقل يقسّمه ويُسقط المحطات خلفه عشوائيًا.' : 'تحذير: الإنهاء ناقص في طرف من الطرفين (انعكاسات: محطات تسقط وتعود).', 'bad');
    st.forEach((s, i) => {
      const d = dials[i], gsd = $('#pbg' + i, host).checked; let r = 'g', m = `محطة ${s.cfg}: تبادل بيانات ✓`;
      if (!gsd){ r = 'r'; m = `محطة ${s.cfg}: SF: لا يوجد ملف GSD في التهيئة، المحطة غير معروفة للسيد.`; }
      else if (dials.filter(x => x === d).length > 1){ r = 'r'; m = `محطة ${s.cfg}: BF: عنوان ${d} مكرر على الناقل.`; }
      else if (d !== s.cfg){ r = 'r'; m = `محطة ${s.cfg}: BF: الجهاز يحمل العنوان ${d} والتهيئة تنتظر ${s.cfg}.`; }
      else if (!termOk && (i >= 2 || Math.random() < 0.4)){ r = 'y'; m = `محطة ${s.cfg}: BF يومض: تسقط وتعود (مشكلة فيزيائية).`; }
      else ok++;
      $('#pbl' + i, host).className = 'led ' + r + (r === 'y' ? ' bl' : ''); $('#pbs' + i, host).setAttribute('fill', r === 'g' ? '#2ecc40' : r === 'r' ? '#ff3b26' : '#ffc42d');
      logTo(log, m, r === 'g' ? 'ok' : 'bad');
    });
    if (ok === 4 && termOk){ logTo(log, 'CPU: RUN، مصباح BF مطفأ. الشبكة سليمة ✓', 'ok'); win('profibus'); }
  });
};

/* ---------------- 5. PROFINET ---------------- */
BUILD.profinet = host => {
  const want = ['et200sp-1', 'g120-1', 'iol-master-1'];
  const dv = [
    {n:'ET 200SP', mac:'28:63:36:A1:04:11', name:'et200sp-1'},
    {n:'SINAMICS G120 (استُبدل اليوم)', mac:'28:63:36:B2:77:0C', name:''},
    {n:'سيد IO-Link', mac:'00:0E:8C:5D:12:F0', name:'iol-master1'}
  ];
  const ips = ['192.168.0.11', '192.168.0.12', '192.168.0.13'];
  host.innerHTML = `<div class="panel"><p>المتحكم S7-1500 يحمل تهيئة بثلاثة أجهزة بأسمائها. هو لا يعرف عناوين MAC؛ يبحث بـ DCP عن <b>الاسم</b> ثم يعطي الجهاز IP من التهيئة. محوّل التردد استُبدل اليوم فاسمه فارغ، واسم سيد IO-Link كُتب بخطأ إملائي.</p>
  <div class="dev"><h3>تهيئة المتحكم (TIA Portal)</h3><div class="tblw"><table class="tbl"><thead><tr><th>اسم الجهاز</th><th>IP المخطط</th></tr></thead><tbody>${want.map((w, i) => `<tr><td class="mono">${w}</td><td class="mono">${ips[i]}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="grid2" style="margin-top:10px">${dv.map((d, i) => `<div class="dev"><h3><i class="led" id="pnl${i}"></i>${esc(d.n)}</h3><label>MAC <b class="mono">${d.mac}</b></label><label>الاسم الحالي <b class="mono" id="pnn${i}">${d.name || '(فارغ)'}</b></label><label>IP <b class="mono" id="pni${i}">0.0.0.0</b></label><label>اسم جديد <input id="pnx${i}" placeholder="device-name"></label><div class="row"><button class="btn" data-assign="${i}">DCP: تعيين الاسم</button><button class="btn" data-swap="${i}">استبدال الجهاز بقطعة غيار</button></div></div>`).join('')}</div>
  <div class="row"><button class="btn pri" id="pn-scan">PRONETA: فحص الشبكة</button><button class="btn" id="pn-go">المتحكم: الاتصال بالأجهزة</button></div><div class="log" id="pn-log"></div></div>`;
  const log = $('#pn-log', host);
  host.addEventListener('click', e => {
    const a = e.target.closest('[data-assign]'), s = e.target.closest('[data-swap]');
    if (a){ const i = +a.dataset.assign, v = $('#pnx' + i, host).value.trim().toLowerCase(); if (!/^[a-z0-9][a-z0-9-]*$/.test(v)){ logTo(log, 'اسم غير صالح: أحرف لاتينية صغيرة وأرقام وشرطة فقط، بلا مسافات.', 'bad'); return; } dv[i].name = v; $('#pnn' + i, host).textContent = v; $('#pnl' + i, host).className = 'led'; logTo(log, `DCP Set Name → ${dv[i].mac}: "${v}" (محفوظ في الجهاز)`, 'ok'); }
    if (s){ const i = +s.dataset.swap; dv[i].name = ''; dv[i].mac = dv[i].mac.slice(0, 12) + hex(Math.floor(Math.random() * 256)) + ':' + hex(Math.floor(Math.random() * 256)); $('#pnn' + i, host).textContent = '(فارغ)'; $('#pni' + i, host).textContent = '0.0.0.0'; $('#pnl' + i, host).className = 'led r'; logTo(log, `جهاز جديد بـ MAC ${dv[i].mac} بلا اسم. المتحكم لا يجده.`, 'bad'); }
  });
  $('#pn-scan', host).addEventListener('click', () => { logTo(log, 'PRONETA scan (DCP Identify All):', 'dim'); dv.forEach(d => logTo(log, `  ${d.mac}  name="${d.name}"  ip=${$('#pni' + dv.indexOf(d), host).textContent}  ${want.includes(d.name) ? '' : '← لا يطابق أي اسم في التهيئة'}`, want.includes(d.name) ? 'ok' : 'bad')); });
  $('#pn-go', host).addEventListener('click', () => {
    let ok = 0; const names = dv.map(d => d.name);
    want.forEach((w, i) => { const j = names.indexOf(w); const dup = names.filter(x => x === w).length > 1; if (j < 0){ logTo(log, `"${w}": لا يوجد جهاز بهذا الاسم على الشبكة (BF).`, 'bad'); return; } if (dup){ logTo(log, `"${w}": اسم مكرر على جهازين.`, 'bad'); return; } $('#pni' + j, host).textContent = ips[i]; $('#pnl' + j, host).className = 'led g'; logTo(log, `"${w}" ← ${dv[j].mac}: أُعطي ${ips[i]}، تبادل بيانات ✓`, 'ok'); ok++; });
    dv.forEach((d, i) => { if (!want.includes(d.name)){ $('#pnl' + i, host).className = 'led r'; } });
    if (ok === 3) win('profinet');
  });
};

/* ---------------- 6. CAN ---------------- */
BUILD.can = host => {
  const nd = [{n:'الـ PLC (NMT master)', id:'0x000', br:'500'}, {n:'سيرفو 1 (PDO)', id:'0x181', br:'500'}, {n:'سيرفو 2 (PDO)', id:'0x182', br:'250'}];
  host.innerHTML = `<div class="panel"><p>ثلاث عقد CANopen على ناقل واحد بسرعة 500 kbit/s. تحكيم CAN: البت السائد (0) يفوز، فالإطار ذو <b>المعرّف الأصغر</b> يمر أولًا. عقدة بمعدل بت مختلف تُنتج إطارات خطأ حتى تدخل Bus-off. الإنهاء 120 Ω في الطرفين فقط.</p>
  <div class="grid2">${nd.map((d, i) => `<div class="dev"><h3><i class="led" id="cl${i}"></i>${esc(d.n)}</h3><label>COB-ID (hex)<input id="ci${i}" value="${d.id}"></label><label>Bit rate <select id="cb${i}"><option${d.br == '125' ? ' selected' : ''}>125</option><option${d.br == '250' ? ' selected' : ''}>250</option><option${d.br == '500' ? ' selected' : ''}>500</option><option>1000</option></select></label><label>إنهاء 120 Ω <input type="checkbox" id="ct${i}"${i === 0 ? ' checked' : ''}></label><small class="muted">${i === 0 ? 'أول عقدة' : i === 2 ? 'آخر عقدة' : 'في المنتصف'}</small></div>`).join('')}</div>
  <div class="row"><button class="btn" id="c-ohm">قياس المقاومة بين CAN_H و CAN_L (الناقل غير مغذّى)</button><button class="btn pri" id="c-go">الثلاثة يرسلون في اللحظة نفسها</button></div><div class="log" id="c-log"></div></div>`;
  const log = $('#c-log', host); let ohmOk = false;
  $('#c-ohm', host).addEventListener('click', () => { const t = [0, 1, 2].map(i => $('#ct' + i, host).checked); const n = t.filter(Boolean).length; const r = n === 0 ? 'مفتوح (∞)' : n === 1 ? '120 Ω' : n === 2 ? '60 Ω' : '40 Ω'; ohmOk = t[0] && t[2] && !t[1]; logTo(log, `Ω-meter: ${r}  ${ohmOk ? '← صحيح: مقاومتان في الطرفين' : n === 2 ? '← 60 Ω لكن إحداهما في المنتصف: يجب أن تكونا في الطرفين' : '← غير صحيح'}`, ohmOk ? 'ok' : 'bad'); });
  $('#c-go', host).addEventListener('click', () => {
    const brs = [0, 1, 2].map(i => $('#cb' + i, host).value); const ids = [0, 1, 2].map(i => parseInt($('#ci' + i, host).value, 16));
    if (ids.some(x => isNaN(x) || x < 0 || x > 0x7FF)){ logTo(log, 'معرّف غير صالح (11 بت: 0x000–0x7FF).', 'bad'); return; }
    const maj = brs.sort()[1]; let bad = false;
    [0, 1, 2].forEach(i => { const b = $('#cb' + i, host).value; if (b !== maj){ bad = true; $('#cl' + i, host).className = 'led r'; logTo(log, `${nd[i].n}: ${b} kbit/s مقابل ${maj} على الناقل → إطارات خطأ متتالية → Bus-off (مصباح أحمر)`, 'bad'); } });
    if (bad){ logTo(log, 'الناقل مضطرب؛ وحّد معدل البت أولًا.', 'bad'); return; }
    if (new Set(ids).size < 3){ logTo(log, 'معرّفان متطابقان: الإطاران يفوزان معًا بالتحكيم ثم يتصادمان في الحمولة → خطأ. المعرّف يجب أن يكون فريدًا.', 'bad'); return; }
    const order = [0, 1, 2].sort((a, b) => ids[a] - ids[b]);
    logTo(log, 't=0: الثلاثة يبدأون الإرسال. التحكيم بتًا بتًا:', 'dim');
    order.forEach((i, k) => { $('#cl' + i, host).className = 'led g'; logTo(log, `  ${k + 1}. ${nd[i].n} (0x${ids[i].toString(16).toUpperCase().padStart(3, '0')} = ${ids[i].toString(2).padStart(11, '0')}) ${k === 0 ? '← فاز: أول بت 0 مقابل 1 عند الآخرين' : 'ينتظر نهاية الإطار السابق ثم يعيد المحاولة'}`, k === 0 ? 'ok' : ''); });
    if (!ohmOk && Math.random() < 0.5) logTo(log, 'ملاحظة: ظهرت أخطاء CRC متفرقة؛ قِس الإنهاء.', 'bad');
    if (ohmOk) win('can');
  });
};

/* ---------------- 7. OPC UA ---------------- */
BUILD.opcua = host => {
  let trusted = false, connected = null, didRead = false, sub = null;
  const tree = {Objects:{Server:{ServerStatus:1}, PLC_1:{DataBlocks:{Line3:{OvenTemp:['Double', () => 182.5 + (Math.random() - .5)], PartsCount:['Int32', () => 3000 + Math.floor(Date.now() / 1000) % 60], Running:['Boolean', () => true], Setpoint:['Double', () => 180]}}}}};
  host.innerHTML = `<div class="panel"><div class="grid2">
   <div class="dev"><h3>العميل (UaExpert)</h3><label>Endpoint <input id="ua-ep" value="opc.tcp://192.168.1.10:4840"></label><label>Security <select id="ua-sec"><option value="none">None</option><option value="b256" selected>Basic256Sha256 · Sign&amp;Encrypt</option></select></label><label>Auth <select id="ua-auth"><option>Anonymous</option><option>user/password</option></select></label><div class="row"><button class="btn pri" id="ua-conn">اتصال</button><button class="btn" id="ua-disc">قطع</button></div></div>
   <div class="dev"><h3><i class="led g"></i>الخادم: S7-1500 OPC UA</h3><div class="mono">opc.tcp://192.168.1.10:4840</div><label>شهادة العميل «UaExpert@laptop» <b id="ua-tr">مرفوضة</b></label><div class="row"><button class="btn" id="ua-trust">توثيق الشهادة على الخادم (TIA → Trusted)</button></div></div>
  </div><div class="grid2" style="margin-top:10px"><div class="dev"><h3>Address space</h3><ul class="tree" id="ua-tree"><li class="dim">(غير متصل)</li></ul></div><div class="dev"><h3>Attributes</h3><div id="ua-attr" class="mono muted">اختر عقدة</div><div class="row"><button class="btn" id="ua-read" disabled>Read</button><button class="btn" id="ua-sub" disabled>Subscribe 500 ms</button></div><div class="log" id="ua-log"></div></div></div></div>`;
  const log = $('#ua-log', host), tr = $('#ua-tree', host), attr = $('#ua-attr', host); let selPath = null;
  $('#ua-trust', host).addEventListener('click', () => { trusted = true; $('#ua-tr', host).textContent = 'موثوقة ✓'; logTo(log, 'الخادم: شهادة UaExpert@laptop نُقلت إلى Trusted.', 'ok'); });
  const renderTree = () => { const walk = (o, p) => Object.keys(o).map(k => { const v = o[k], path = p.concat(k); if (Array.isArray(v) || typeof v === 'number') return `<li class="leaf" data-p="${path.join('/')}">${k}</li>`; return `<li class="fold">${k}<ul class="tree">${walk(v, path).join('')}</ul></li>`; }); tr.innerHTML = walk(tree, []).join(''); };
  $('#ua-conn', host).addEventListener('click', () => {
    const ep = $('#ua-ep', host).value.trim(), sec = $('#ua-sec', host).value;
    if (ep !== 'opc.tcp://192.168.1.10:4840'){ logTo(log, 'BadTcpEndpointUrlInvalid / timeout: راجع العنوان والمنفذ 4840.', 'bad'); return; }
    if (sec !== 'none' && !trusted){ logTo(log, 'BadCertificateUntrusted: الخادم لا يثق بشهادة العميل. وثّقها على الخادم ثم أعد الاتصال.', 'bad'); return; }
    connected = sec; logTo(log, `Connected (${sec === 'none' ? 'بلا أمان: مقبول للتجربة فقط' : 'Basic256Sha256 Sign&Encrypt ✓'}). Session created.`, 'ok'); renderTree();
  });
  $('#ua-disc', host).addEventListener('click', () => { connected = null; clearInterval(sub); sub = null; tr.innerHTML = '<li class="dim">(غير متصل)</li>'; attr.textContent = 'اختر عقدة'; $('#ua-read', host).disabled = $('#ua-sub', host).disabled = true; logTo(log, 'Disconnected.', 'dim'); });
  tr.addEventListener('click', e => { const li = e.target.closest('li.leaf'); if (!li) return; $$('li', tr).forEach(x => x.classList.remove('sel')); li.classList.add('sel'); selPath = li.dataset.p; const name = selPath.split('/').pop(); const node = selPath.split('/').reduce((o, k) => o[k], tree); attr.innerHTML = `NodeId: ns=3;s="${selPath.split('/').slice(-2, -1)[0]}".${name}<br>DataType: ${Array.isArray(node) ? node[0] : 'Int32'}<br>AccessLevel: ${name === 'Setpoint' ? 'Read/Write' : 'Read'}`; $('#ua-read', host).disabled = false; $('#ua-sub', host).disabled = !Array.isArray(node); });
  const readVal = () => { const node = selPath.split('/').reduce((o, k) => o[k], tree); const v = Array.isArray(node) ? node[1]() : node; const name = selPath.split('/').pop(); return `${name} = ${typeof v === 'number' ? +v.toFixed(2) : v}  StatusCode: Good  SourceTimestamp: ${new Date().toISOString().slice(11, 23)}`; };
  $('#ua-read', host).addEventListener('click', () => { if (!connected) return; logTo(log, 'Read → ' + readVal(), 'ok'); if (selPath.endsWith('OvenTemp')) didRead = true; check(); });
  $('#ua-sub', host).addEventListener('click', () => { if (!connected) return; clearInterval(sub); logTo(log, `CreateSubscription(500 ms) + MonitoredItem ${selPath.split('/').pop()} (deadband 0.1)`, 'dim'); let n = 0; const p = selPath; sub = setInterval(() => { if (!connected || n++ > 8){ clearInterval(sub); return; } logTo(log, 'DataChange → ' + readVal()); }, 500); if (p.endsWith('OvenTemp')) { didSub = true; } check(); });
  let didSub = false;
  function check(){ if (connected === 'b256' && didRead && didSub) win('opcua'); }
};

/* ---------------- 8. MQTT ---------------- */
BUILD.mqtt = host => {
  const subs = []; const retained = {}; let got = 0, retainedStatus = false, timer = null;
  host.innerHTML = `<div class="panel"><p>وسيط Mosquitto على <span class="mono">mqtts://broker.local:8883</span>. الناشر لا يعرف المشترك؛ الوسيط يوزّع بحسب الموضوع. <b>+</b> يطابق مستوى واحدًا و <b>#</b> كل ما بعده.</p>
  <div class="grid2"><div class="dev"><h3>الاشتراك (لوحة المتابعة)</h3><div class="frm"><label>Topic filter<input id="mq-f" value="plant/line3/oven"></label><label>QoS<select id="mq-fq"><option>0</option><option selected>1</option><option>2</option></select></label><button class="btn pri" id="mq-sub">Subscribe</button></div><div id="mq-subs" class="muted" style="margin-top:6px">لا اشتراكات.</div></div>
  <div class="dev"><h3>النشر (البوابة)</h3><div class="frm"><label>Topic<input id="mq-t" value="plant/line3/status"></label><label>Payload<input id="mq-p" value="online"></label><label>QoS<select id="mq-q"><option>0</option><option selected>1</option><option>2</option></select></label><label>Retain<input type="checkbox" id="mq-r"></label><button class="btn pri" id="mq-pub">Publish</button></div><div class="row"><button class="btn" id="mq-sens">تشغيل حساسات الخطين 3 و 4</button><button class="btn" id="mq-lwt">سقوط البوابة فجأة (Last Will)</button></div></div></div>
  <div class="log" id="mqlog" style="margin-top:10px"></div></div>`;
  const log = $('#mqlog', host);
  const match = (f, t) => { const a = f.split('/'), b = t.split('/'); for (let i = 0; i < a.length; i++){ if (a[i] === '#') return true; if (i >= b.length) return false; if (a[i] !== '+' && a[i] !== b[i]) return false; } return a.length === b.length; };
  function publish(topic, payload, qos, retain, who){
    logTo(log, `PUBLISH ${topic} "${payload}" q${qos}${retain ? ' retain' : ''}  (${who})`, 'dim');
    if (retain) retained[topic] = payload;
    const hit = subs.filter(s => match(s.f, topic));
    if (!hit.length){ logTo(log, '  لا مشترك يطابق؛ الوسيط يهمل الرسالة' + (retain ? ' لكنه يحتفظ بها للمشتركين الجدد' : '') + '.', 'bad'); }
    hit.forEach(s => { logTo(log, `  → المشترك "${s.f}" استقبل: ${topic} = ${payload}`, 'ok'); if (topic.endsWith('/oven') && s.f.includes('+')) got++; });
    check();
  }
  $('#mq-sub', host).addEventListener('click', () => { const f = $('#mq-f', host).value.trim(); if (!f || /#./.test(f)){ logTo(log, 'فلتر غير صالح: # يكون آخر مستوى فقط.', 'bad'); return; } subs.push({f, q:$('#mq-fq', host).value}); $('#mq-subs', host).innerHTML = subs.map(s => `<span class="term">${esc(s.f)}</span>`).join(' '); logTo(log, `SUBACK ${f}`, 'ok'); Object.keys(retained).forEach(t => { if (match(f, t)) logTo(log, `  ← رسالة محتفظ بها فورًا: ${t} = ${retained[t]}`, 'ok'); }); });
  $('#mq-pub', host).addEventListener('click', () => { const t = $('#mq-t', host).value.trim(), p = $('#mq-p', host).value, r = $('#mq-r', host).checked; if (!t || /[+#]/.test(t)){ logTo(log, 'موضوع النشر لا يحتوي + أو #.', 'bad'); return; } publish(t, p, $('#mq-q', host).value, r, 'يدوي'); if (r && /status$/.test(t)) retainedStatus = true; check(); });
  $('#mq-sens', host).addEventListener('click', () => { if (timer){ clearInterval(timer); timer = null; return; } let k = 0; timer = setInterval(() => { publish('plant/line3/oven', JSON.stringify({t:+(182 + Math.random()).toFixed(1)}), 1, false, 'بوابة الخط 3'); publish('plant/line4/oven', JSON.stringify({t:+(176 + Math.random()).toFixed(1)}), 1, false, 'بوابة الخط 4'); if (++k >= 5){ clearInterval(timer); timer = null; } }, 1500); });
  $('#mq-lwt', host).addEventListener('click', () => { logTo(log, 'انقطع TCP من بوابة الخط 3 دون DISCONNECT. بعد Keep-alive × 1.5 الوسيط ينشر وصيتها:', 'bad'); publish('plant/line3/status', 'offline', 1, true, 'الوسيط نيابة عن البوابة'); });
  function check(){ if (got >= 2 && retainedStatus) win('mqtt'); }
};

/* ---------------- 9. Gateway (Node-RED) ---------------- */
BUILD.gateway = host => {
  const wires = [false, false]; let sel = -1, deployed = false;
  host.innerHTML = `<div class="panel"><p>محرر Node-RED. انقر عقدة ثم العقدة التالية لتوصيلهما بسلك. عقدة التحويل تقسم القراءة الخام؛ الـ PLC يرسل الحرارة ×10.</p>
  <div class="nodes"><div class="node" data-n="0"><b>Modbus Read</b><small>192.168.1.10:502 · FC3 · 0..3</small><label>كل <input id="gw-ms" type="number" value="1000" style="width:5em"> ms</label></div><div class="node" data-n="1"><b>Function</b><small>oven_temp = r[0] / <input id="gw-div" type="number" value="1" style="width:4em"></small><small>parts = r[1], running = r[2]</small></div><div class="node" data-n="2"><b>MQTT Out</b><small>mqtts://broker:8883</small><small>plant/line3/oven · QoS 1</small></div></div>
  <div class="row"><button class="btn pri" id="gw-dep">Deploy</button><button class="btn" id="gw-clr">فكّ الأسلاك</button></div><div class="log" id="gw-log"></div></div>`;
  const log = $('#gw-log', host), nodes = $$('.node', host);
  const paint = () => nodes.forEach((n, i) => { n.classList.toggle('sel', i === sel); n.classList.toggle('wired', (i === 0 && wires[0]) || (i === 1 && wires[0] && wires[1]) || (i === 2 && wires[1])); });
  nodes.forEach((n, i) => n.addEventListener('click', e => { if (e.target.tagName === 'INPUT') return; if (sel < 0){ sel = i; } else if (sel === i){ sel = -1; } else { const a = Math.min(sel, i), b = Math.max(sel, i); if (b - a === 1){ wires[a] = true; logTo(log, `سلك: ${['Modbus Read', 'Function', 'MQTT Out'][a]} → ${['Modbus Read', 'Function', 'MQTT Out'][b]}`, 'ok'); } else logTo(log, 'لا توصّل Modbus بـ MQTT مباشرة؛ القيم الخام بلا تحويل ولا أسماء.', 'bad'); sel = -1; } paint(); }));
  $('#gw-clr', host).addEventListener('click', () => { wires[0] = wires[1] = false; sel = -1; paint(); });
  $('#gw-dep', host).addEventListener('click', () => {
    if (!wires[0] || !wires[1]){ logTo(log, 'Deploy: التدفق غير مكتمل؛ عقدة بلا مدخل أو مخرج.', 'bad'); return; }
    const div = +$('#gw-div', host).value || 1, ms = +$('#gw-ms', host).value;
    logTo(log, `Deployed. Modbus poll every ${ms} ms`, 'dim');
    const raw = [1825, 3012, 1, 2450];
    const obj = {ts:Date.now(), oven_temp:raw[0] / div, parts_count:raw[1], running:raw[2] === 1, current_a:raw[3] / 100};
    logTo(log, `Modbus → [${raw.join(', ')}]`); logTo(log, `MQTT plant/line3/oven ← ${JSON.stringify(obj)}`, div === 10 ? 'ok' : '');
    if (div !== 10) logTo(log, `oven_temp = ${obj.oven_temp}: الفرن ليس بهذه الحرارة. الـ PLC يرسل ×10، فاقسم على 10.`, 'bad');
    else { logTo(log, 'القيم صحيحة ومسماة ووحداتها سليمة ✓', 'ok'); if (ms < 200) logTo(log, 'تحذير: استطلاع أسرع من 200 ms يُثقل الـ PLC بلا فائدة.', 'bad'); else win('gateway'); }
  });
};

/* ---------------- 10. Dashboard / alarms / OEE / trend ---------------- */
BUILD.dash = host => {
  const N = 240; const temp = []; for (let i = 0; i < N; i++){ let v = 185 + Math.sin(i / 9) * 6 + (Math.random() - .5) * 4; if (i === 60 || i === 61 || i === 130) v = 203 + Math.random() * 3; if (i >= 170 && i < 215) v = 198 + (i - 170) * 0.5 + (Math.random() - .5) * 2; temp.push(+v.toFixed(1)); }
  const vib = [1.9, 2.0, 2.1, 2.3, 2.6, 2.9, 3.3, 3.7];
  let a1 = IL.has('l12', 'sim'), a2 = IL.has('l12', 'sim'), a3 = IL.has('l13', 'sim');
  host.innerHTML = `<div class="panel"><h3 style="margin:0 0 6px">أ) حرارة الفرن: إنذار بلا كذب</h3><p class="muted">القياس كل ثانية لأربع دقائق. هناك ومضتان قصيرتان (ضجيج حساس) وارتفاع حقيقي واحد يدوم 45 ثانية. اضبط الحد والتأخير والتباطؤ بحيث يُطلق إنذار واحد فقط.</p>
  <svg class="chart" id="d-ch" viewBox="0 0 720 220"></svg>
  <div class="sl"><span>الحد الأعلى</span><input type="range" id="d-lim" min="190" max="215" value="195"><b id="d-limv">195 °C</b></div>
  <div class="sl"><span>التأخير</span><input type="range" id="d-del" min="0" max="60" value="0"><b id="d-delv">0 s</b></div>
  <div class="sl"><span>التباطؤ</span><input type="range" id="d-hys" min="0" max="10" value="0"><b id="d-hysv">0 °C</b></div>
  <div class="statline" id="d-st"></div></div>
  <div class="panel"><h3 style="margin:0 0 6px">ب) OEE لوردية اليوم</h3><div class="oee"><label>الوقت المخطط (دقيقة)<input value="480" readonly></label><label>وقت التشغيل الفعلي (دقيقة)<input value="420" readonly></label><label>القطع المنتجة<input value="3000" readonly></label><label>الزمن القياسي للقطعة (ثانية)<input value="7" readonly></label><label>القطع السليمة<input value="2900" readonly></label><label>OEE % (احسبه)<input id="d-oee" type="number" step="0.1" placeholder="؟"></label></div><div class="row"><button class="btn pri" id="d-oeego">تحقق</button><span class="msg" id="d-oeem"></span></div></div>
  <div class="panel"><h3 style="margin:0 0 6px">ج) اتجاه الاهتزاز: متى يعبر حد ISO؟</h3><p class="muted">RMS mm/s على كرسي مضخة التبريد، أسبوعيًا. خط الأساس 1.9، وحد «غير مقبول» لهذه الفئة 7.1 mm/s. في الأسابيع الأربعة الأخيرة يرتفع الميل بثبات. بالاستمرار على الميل الأخير، في أي أسبوع يُتوقع العبور؟</p>
  <svg class="chart" id="d-vb" viewBox="0 0 720 220"></svg><div class="row"><label>الأسبوع المتوقع <select id="d-wk">${Array.from({length:14}, (_, i) => `<option>${i + 9}</option>`).join('')}</select></label><button class="btn pri" id="d-wkgo">تحقق</button><span class="msg" id="d-wkm"></span></div></div>`;
  const ch = $('#d-ch', host), st = $('#d-st', host);
  function evalAlarm(lim, del, hys){ let on = false, cnt = 0, over = 0, ev = []; let start = -1; for (let i = 0; i < N; i++){ const v = temp[i]; if (!on){ if (v > lim){ cnt++; if (cnt >= del + 1){ on = true; start = i - del; } } else cnt = 0; } else { if (v < lim - hys){ on = false; ev.push([start, i]); } } } if (on) ev.push([start, N]); return ev; }
  function draw(){
    const lim = +$('#d-lim', host).value, del = +$('#d-del', host).value, hys = +$('#d-hys', host).value;
    $('#d-limv', host).textContent = lim + ' °C'; $('#d-delv', host).textContent = del + ' s'; $('#d-hysv', host).textContent = hys + ' °C';
    const x = i => 40 + i / (N - 1) * 660, y = v => 200 - (v - 170) / 45 * 180;
    const ev = evalAlarm(lim, del, hys);
    ch.innerHTML = `<line x1="40" y1="10" x2="40" y2="200" stroke="currentColor" opacity=".4"/><line x1="40" y1="200" x2="700" y2="200" stroke="currentColor" opacity=".4"/>${[170, 185, 200, 215].map(v => `<text x="2" y="${y(v) + 4}">${v}</text>`).join('')}
    ${ev.map(e => `<rect class="alarm" x="${x(e[0])}" y="10" width="${Math.max(2, x(e[1]) - x(e[0]))}" height="190"/>`).join('')}
    <line class="lim" x1="40" x2="700" y1="${y(lim)}" y2="${y(lim)}"/>${hys ? `<line class="lim" x1="40" x2="700" y1="${y(lim - hys)}" y2="${y(lim - hys)}" opacity=".5"/>` : ''}
    <polyline class="line" points="${temp.map((v, i) => x(i) + ',' + y(v)).join(' ')}"/><text x="700" y="215" text-anchor="end">240 s</text>`;
    const trueHit = ev.some(e => e[0] >= 165 && e[0] <= 200), falseN = ev.filter(e => !(e[0] >= 165 && e[0] <= 200)).length, chatter = ev.length > 1 && ev.some(e => e[0] >= 165 && e[0] <= 215) && ev.filter(e => e[0] >= 165 && e[0] <= 215).length > 1;
    st.className = 'statline ' + (trueHit && ev.length === 1 ? 'ok' : 'bad');
    st.innerHTML = `إنذارات: <b>${ev.length}</b> · كاذبة: <b>${falseN}</b> · الحقيقي ${trueHit ? 'التُقط ✓' : 'فات ✗'}${chatter ? ' · يرنّ مرارًا حول الحد: ارفع التباطؤ' : ''}`;
    if (trueHit && ev.length === 1){ a1 = true; check12(); }
  }
  ['d-lim', 'd-del', 'd-hys'].forEach(id => $('#' + id, host).addEventListener('input', draw)); draw();
  $('#d-oeego', host).addEventListener('click', () => { const v = +$('#d-oee', host).value; const A = 420 / 480, P = 3000 * 7 / (420 * 60), Q = 2900 / 3000, oee = A * P * Q * 100; const m = $('#d-oeem', host); if (Math.abs(v - oee) <= 0.6){ m.className = 'msg ok'; m.textContent = `صحيح: ${A.toFixed(3)} × ${P.toFixed(3)} × ${Q.toFixed(3)} = ${oee.toFixed(1)}%`; a2 = true; check12(); } else { m.className = 'msg bad'; m.textContent = 'ليست هذه. الإتاحة = 420÷480، الأداء = (3000×7)÷(420×60)، الجودة = 2900÷3000، ثم اضرب الثلاثة.'; } });
  function check12(){ if (a1 && a2) win('dash', 'إنذار واحد صحيح و OEE محسوب ✓ (الدرس 12). تبقّى اتجاه الاهتزاز للدرس 13.'); if (a1 && a2 && a3) full(); }
  const vb = $('#d-vb', host); { const x = i => 60 + i * 44, y = v => 200 - v / 8 * 185; const slope = (vib[7] - vib[4]) / 3; const cross = 8 + Math.ceil((7.1 - vib[7]) / slope); vb.innerHTML = `<line x1="60" y1="10" x2="60" y2="200" stroke="currentColor" opacity=".4"/><line x1="60" y1="200" x2="700" y2="200" stroke="currentColor" opacity=".4"/>${[0, 2, 4, 6, 8].map(v => `<text x="30" y="${y(v) + 4}">${v}</text>`).join('')}<line class="lim" x1="60" x2="700" y1="${y(7.1)}" y2="${y(7.1)}"/><text x="700" y="${y(7.1) - 4}" text-anchor="end">ISO 7.1</text><line class="base" x1="60" x2="700" y1="${y(1.9)}" y2="${y(1.9)}" stroke="var(--good)"/><text x="700" y="${y(1.9) - 4}" text-anchor="end">baseline 1.9</text><polyline class="line" points="${vib.map((v, i) => x(i) + ',' + y(v)).join(' ')}"/>${vib.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="var(--accent)"/><text x="${x(i)}" y="214" text-anchor="middle">w${i + 1}</text><text x="${x(i)}" y="${y(v) - 8}" text-anchor="middle">${v}</text>`).join('')}<line x1="${x(7)}" y1="${y(vib[7])}" x2="${x(13)}" y2="${y(vib[7] + slope * 6)}" stroke="var(--cur)" stroke-dasharray="4 4"/>`; vb.dataset.cross = cross; }
  $('#d-wkgo', host).addEventListener('click', () => { const w = +$('#d-wk', host).value, c = +vb.dataset.cross, m = $('#d-wkm', host); if (w === c){ m.className = 'msg ok'; m.textContent = `صحيح: الميل ≈ 0.4 mm/s أسبوعيًا، و (7.1 − 3.7) ÷ 0.4 ≈ ${Math.ceil((7.1 - 3.7) / 0.4)} أسابيع بعد الأسبوع 8 → الأسبوع ${c}. اطلب الكرسي الآن وخطط التوقف قبله.`; a3 = true; IL.mark('l13', 'sim'); if (a1 && a2) full(); } else { m.className = 'msg bad'; m.textContent = `ليست هذه. احسب ميل الأسابيع 5–8 (الفرق ÷ 3)، ثم المسافة المتبقية حتى 7.1 ÷ الميل.`; } });
  function full(){ win('dash', 'أُنجزت الأجزاء الثلاثة: الإنذار و OEE والاتجاه ✓ (الدرسان 12 و 13).'); }
};

/* ---------------- 11. Faults project ---------------- */
BUILD.faults = host => {
  const COMP = [['plc', 'PLC S7-1200'], ['pn', 'ET 200SP · PROFINET'], ['vfd', 'ناقل · محوّل تردد Modbus RTU'], ['iol', 'حساس ضغط IO-Link'], ['servo', 'سيرفو CANopen'], ['gw', 'بوابة Node-RED'], ['cloud', 'الوسيط واللوحة']];
  const TOOLS = [['led', 'المصابيح والكابلات'], ['ping', 'ping / arp'], ['ohm', 'الأوميتر على الناقل'], ['proneta', 'PRONETA'], ['mbc', 'عميل Modbus'], ['ws', 'Wireshark / محلل CAN'], ['mqx', 'MQTT Explorer'], ['logs', 'سجل الجهاز (Diagnostics)']];
  const FIX = [['dcp', 'إعطاء اسم الجهاز بـ DCP'], ['term', 'تركيب 120 Ω في طرف الناقل'], ['uid', 'ضبط معرّف الوحدة في برنامج الـ PLC'], ['ip', 'تغيير عنوان IP المكرر'], ['bitrate', 'ضبط معدل بت السيرفو على 500 kbit/s'], ['fw', 'فتح المنفذ 8883 الصادر في الجدار الناري'], ['ntp', 'ضبط NTP على البوابة'], ['cable', 'إعادة توصيل الكابل في المنفذ'], ['reboot', 'إعادة تشغيل الـ PLC'], ['replace', 'استبدال محوّل التردد']];
  const POOL = [
    {id:'pnname', c:'pn', tool:'proneta', fix:'dcp', sym:'ET 200SP: مصباح BF أحمر، لا مدخلات', rev:'PRONETA: جهاز MAC 28:63:36:B2:xx بلا اسم (name=""). التهيئة تنتظر "et200sp-1".', logs:'CPU: Diagnostics buffer: "IO device et200sp-1 not found".', ping:'ping 192.168.0.11: timeout.'},
    {id:'term', c:'vfd', tool:'ohm', fix:'term', sym:'قراءات محوّل التردد تتقطع بأخطاء CRC', rev:'الأوميتر بين A و B: 120 Ω فقط (مقاومة واحدة؛ الطرف البعيد بلا إنهاء).', mbc:'FC3 → أحيانًا رد صحيح وأحيانًا CRC error.', ws:'إطارات تالفة متفرقة على RS-485.'},
    {id:'uid', c:'vfd', tool:'mbc', fix:'uid', sym:'الـ PLC لا يقرأ محوّل التردد إطلاقًا', rev:'عميل Modbus: ID 1 → timeout. مسح 1–10: الجهاز يجيب على ID 2. البرنامج يسأل ID 1.', logs:'PLC: MB_MASTER status 80C8 (timeout).', ohm:'60 Ω: الإنهاء سليم.'},
    {id:'dupip', c:'gw', tool:'ping', fix:'ip', sym:'البوابة تتصل وتنقطع كل دقيقة', rev:'ping 192.168.1.5 → ردود بزمنين مختلفين؛ arp -a يظهر MAC يتغير: عنوان مكرر بين البوابة وحاسوب الصيانة.', logs:'Gateway: "IP conflict detected".', mqx:'اتصال متقطع.'},
    {id:'bitrate', c:'servo', tool:'ws', fix:'bitrate', sym:'السيرفو لا يستجيب ومصباحه أحمر', rev:'محلل CAN: إطارات خطأ متتالية ثم Bus-off للعقدة 0x02؛ العقدة تعمل على 250 kbit/s والناقل 500.', ohm:'60 Ω: الإنهاء سليم.', logs:'Servo: AL.0x8120 CAN bus off.'},
    {id:'fw', c:'cloud', tool:'mqx', fix:'fw', sym:'اللوحة فارغة رغم أن البوابة تعمل', rev:'MQTT Explorer من البوابة: connect broker:8883 → timeout. ping broker ينجح: المنفذ محجوب في الجدار الناري.', ping:'ping broker.local: ينجح.', logs:'Node-RED: mqtt "Connection refused / timeout".'},
    {id:'ntp', c:'cloud', tool:'mqx', fix:'ntp', sym:'الرسوم على اللوحة تظهر في تاريخ 1970', rev:'MQTT Explorer: الرسائل تصل لكن ts=0000000 (ساعة البوابة لم تُضبط). ', logs:'Gateway: "NTP sync failed".'},
    {id:'cable', c:'iol', tool:'led', fix:'cable', sym:'ضغط الخط يقرأ 0 دائمًا', rev:'مصباح المنفذ 3 على سيد IO-Link مطفأ؛ الكابل M12 مفكوك.', logs:'IO-Link master: port 3 "no device".', ping:'لا علاقة له بـ IP.'}
  ];
  let active = [], fixed = new Set(), revealed = new Set();
  function pickFaults(){ const pool = IL.shuffle(POOL); active = []; for (const f of pool){ if (active.length === 3) break; if (active.some(a => a.c === f.c)) continue; active.push(f); } fixed = new Set(); revealed = new Set(); }
  host.innerHTML = `<div class="panel"><p>خط التعبئة توقف صباحًا. في الخط ثلاثة أعطال في طبقات مختلفة. لكل وحدة عرضها. اختر الأداة المناسبة لتكشف السبب، ثم الإجراء الصحيح. إجراء خاطئ لا يضر لكنه يضيّع وقتًا.</p>
  <div class="line-sim" id="f-line"></div>
  <h3 style="margin:14px 0 6px">الأدوات</h3><div class="tools" id="f-tools">${TOOLS.map(t => `<button class="btn" data-tool="${t[0]}">${t[1]}</button>`).join('')}</div>
  <div class="log" id="f-log" style="margin-top:8px"></div>
  <div class="row"><label>الإجراء <select id="f-fix">${FIX.map(f => `<option value="${f[0]}">${f[1]}</option>`).join('')}</select></label><button class="btn pri" id="f-apply">تطبيق</button><button class="btn" id="f-new">أعطال جديدة</button></div></div>`;
  const line = $('#f-line', host), log = $('#f-log', host);
  function render(){ line.innerHTML = COMP.map(c => { const fs = active.filter(f => f.c === c[0] && !fixed.has(f.id)); return `<div class="ls ${fs.length ? 'bad' : 'ok'}"><h4>${c[1]}<i class="led ${fs.length ? 'r' : 'g'}"></i></h4>${fs.map(f => `<div>⚠ ${f.sym}</div>`).join('') || '<div class="muted">يعمل</div>'}</div>`; }).join(''); }
  function start(){ pickFaults(); log.innerHTML = ''; render(); logTo(log, 'الأعطال النشطة: 3. ابدأ من الأعراض والطبقة الأدنى.', 'dim'); }
  $('#f-tools', host).addEventListener('click', e => { const b = e.target.closest('[data-tool]'); if (!b) return; const t = b.dataset.tool; logTo(log, `▶ ${TOOLS.find(x => x[0] === t)[1]}`, 'dim'); let any = false; active.forEach(f => { if (fixed.has(f.id)) return; if (f.tool === t){ logTo(log, '  ' + f.rev, 'ok'); revealed.add(f.id); any = true; } else if (f[t]){ logTo(log, '  ' + f[t]); any = true; } }); if (!any) logTo(log, '  لا شيء غير طبيعي بهذه الأداة.'); });
  $('#f-apply', host).addEventListener('click', () => { const v = $('#f-fix', host).value; const f = active.find(x => x.fix === v && !fixed.has(x.id)); if (!f){ logTo(log, `✗ «${FIX.find(x => x[0] === v)[1]}»: لم يتغير شيء. (${v === 'reboot' ? 'إعادة التشغيل تخفي الأعراض ولا تصلح السبب' : 'ليس هذا سبب أي عطل نشط'})`, 'bad'); return; } fixed.add(f.id); logTo(log, `✓ «${FIX.find(x => x[0] === v)[1]}»: ${COMP.find(c => c[0] === f.c)[1]} عاد للعمل.`, 'ok'); render(); if (fixed.size === active.length){ logTo(log, 'كل الوحدات خضراء، الخط يعمل واللوحة تحدّث ✓', 'ok'); win('faults'); } });
  $('#f-new', host).addEventListener('click', start);
  start();
};

const first = location.hash.slice(1);
show(G[first] ? first : 'ip');
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (G[h]) show(h); });
})();
