/* Industrial network simulator – LearnElectricals (English UI) */
(function(){
'use strict';
const $ = IL.$, $$ = IL.$$, esc = IL.esc;
IL.hubTheme();

const TABS = [
  {id:'ip', t:'IP', l:'l2', h:'PLC, HMI and your laptop: setting IP addresses', goal:'Manually set the laptop address in the same subnet as the PLC and HMI, then get a successful ping and Go online from TIA Portal.'},
  {id:'modbus', t:'Modbus RTU', l:'l3', h:'Modbus RTU over RS-485', goal:'Set the termination and port settings, then complete three successful reads from at least two different devices.'},
  {id:'mbtcp', t:'Modbus TCP', l:'l4', h:'Modbus TCP client', goal:'Read the temperature register (address 0) from the PLC, then write a new setpoint to register 4 with FC6 and read it back to verify.'},
  {id:'profibus', t:'PROFIBUS', l:'l5', h:'PROFIBUS DP: addresses, termination and GSD', goal:'Get all four stations exchanging data (all LEDs green): the dial address matches the configuration, the GSD file is installed, and termination is at both bus ends only.'},
  {id:'profinet', t:'PROFINET', l:'l6', h:'PROFINET: device name and DCP', goal:'Give each device its correct name so the controller assigns it an IP address and connects (three green devices).'},
  {id:'can', t:'CAN', l:'l7', h:'CAN bus: arbitration and termination', goal:'Unify the bit rate, fix the termination until you measure 60 Ω, then run arbitration once and watch the winning order.'},
  {id:'opcua', t:'OPC UA', l:'l9', h:'OPC UA client', goal:'Connect to the server with an encrypted security policy (after trusting the certificate), read OvenTemp, then subscribe to it.'},
  {id:'mqtt', t:'MQTT', l:'l10', h:'MQTT: publish and subscribe', goal:'Subscribe with a filter that uses + to catch the ovens of both lines, receive at least two messages, then publish a retained status message (Retain).'},
  {id:'gateway', t:'Gateway', l:'l11', h:'Node-RED gateway', goal:'Wire the three nodes in order, set the temperature divisor to 10, then Deploy and watch valid JSON go out to the broker.'},
  {id:'dash', t:'Dashboard', l:'l12', h:'Dashboard, alarms, OEE and trends', goal:'Tune the alarm so the false alarms disappear and the real one remains, calculate OEE, then predict the week the vibration crosses the ISO limit.'},
  {id:'faults', t:'Faults', l:'l14', h:'Filling line project: three hidden faults', goal:'Find all three faults with the right tool and fix each one with the right action until every unit is green again.'}
];
const tabsEl = $('#tabs'), panes = $('#panes');
const G = {};
TABS.forEach(tb => {
  const b = document.createElement('button'); b.className = 'btn' + (IL.has(tb.l, 'sim') ? ' done' : ''); b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = tb.t; b.dataset.id = tb.id;
  b.addEventListener('click', () => show(tb.id)); tabsEl.appendChild(b);
  const p = document.createElement('section'); p.className = 'pane'; p.id = 'p-' + tb.id;
  p.innerHTML = `<h2 style="margin:0 0 8px">${esc(tb.h)}</h2><div class="goal${IL.has(tb.l, 'sim') ? ' ok' : ''}" id="g-${tb.id}"><b class="k">${IL.has(tb.l, 'sim') ? '✓ Done' : 'Task'}</b>${esc(tb.goal)}</div><div class="body"></div>`;
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
  const g = $('#g-' + id); g.classList.add('ok'); g.innerHTML = `<b class="k">✓ Done</b>${esc(msg || tb.goal)}`;
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
  /* PLC + HMI + laptop on one switch; the laptop starts on DHCP (no server → 169.254.x.x) and must be given a manual IP in the PLC's subnet */
  const dev = { plc:{ip:'192.168.0.1', m:'255.255.255.0'}, hmi:{ip:'192.168.0.10', m:'255.255.255.0'}, lap:{auto:true, ip:'', m:'', gw:''} };
  const APIPA = '169.254.23.7';
  host.innerHTML = `<div class="panel"><p>An HMI and a PLC are connected to a switch and working together. You want to reach the PLC from your <b>laptop</b> to download the program. The laptop is set to “Obtain an IP address automatically” and there is no DHCP server in the panel, so it assigns itself a random 169.254.x.x address and sees no one. Set it manually in the <b>same subnet</b> with an unused address.</p>
  <div class="bus"><svg viewBox="0 0 720 250" id="ipsvg">
    <rect x="285" y="180" width="150" height="46" rx="8" fill="var(--panel)" stroke="var(--accent)" stroke-width="2"/><text x="360" y="200" text-anchor="middle" font-weight="700">Switch</text><text x="360" y="217" text-anchor="middle" font-size="10">Unmanaged · 5 ports</text>
    ${[['plc',90,'PLC S7-1200'],['hmi',360,'HMI KTP700'],['lap',630,'Laptop']].map(([k,x,n]) => `<line id="ipw-${k}" x1="${x}" y1="105" x2="${k==='hmi'?360:(k==='plc'?330:390)}" y2="180" stroke="var(--line)" stroke-width="4"/><circle id="ipd-${k}" cx="${k==='hmi'?360:(k==='plc'?330:390)}" cy="180" r="5" fill="#777"/>
    <rect x="${x-70}" y="30" width="140" height="75" rx="8" fill="var(--panel)" stroke="currentColor"/><circle id="ipl-${k}" cx="${x-55}" cy="45" r="6" fill="#777"/><text x="${x}" y="52" text-anchor="middle" font-weight="700" font-size="12">${n}</text><text id="ipt-${k}" x="${x}" y="74" text-anchor="middle" font-size="12" font-family="IBM Plex Mono,monospace">—</text><text id="ipm-${k}" x="${x}" y="92" text-anchor="middle" font-size="10" font-family="IBM Plex Mono,monospace">—</text>`).join('')}
  </svg></div>
  <div class="grid2" style="margin-top:10px">
   <div class="dev"><h3>PLC (from TIA Portal · PROFINET interface)</h3><label>IP <input id="ip-plc" value="${dev.plc.ip}"></label><label>Subnet mask <input id="ip-plcm" value="${dev.plc.m}"></label><small class="muted">The address is also printed on a label inside the panel.</small></div>
   <div class="dev"><h3>HMI (Control Panel › Network)</h3><label>IP <input id="ip-hmi" value="${dev.hmi.ip}"></label><label>Subnet mask <input id="ip-hmim" value="${dev.hmi.m}"></label></div>
   <div class="dev" style="grid-column:1/-1"><h3>Laptop: Ethernet › Properties › Internet Protocol Version 4 (TCP/IPv4)</h3>
    <label><span>Obtain an IP address automatically (DHCP)</span><input type="radio" name="ipmode" id="ip-auto" checked></label>
    <label><span>Use the following IP address</span><input type="radio" name="ipmode" id="ip-man"></label>
    <div class="frm" id="ip-manf" style="opacity:.45"><label>IP address<input id="ip-lap" placeholder="192.168.0.?" disabled></label><label>Subnet mask<input id="ip-lapm" placeholder="255.255.255.0" disabled></label><label>Default gateway<input id="ip-lapg" placeholder="(leave blank)" disabled></label></div>
    <div class="row"><button class="btn pri" id="ip-ok">OK (apply)</button><button class="btn" id="ip-ping">ping the PLC and HMI</button><button class="btn" id="ip-online">TIA Portal: Go online</button><button class="btn" id="ip-demo">▶ Watch the solution step by step</button></div></div>
  </div><div class="log" id="iplog"><span class="dim">C:\\&gt; _</span></div></div>`;
  const log = $('#iplog', host), $i = id => $('#' + id, host);
  const lapIp = () => dev.lap.auto ? APIPA : dev.lap.ip, lapM = () => dev.lap.auto ? '255.255.0.0' : dev.lap.m;
  function paint(){
    const cfg = {plc:[$i('ip-plc').value, $i('ip-plcm').value], hmi:[$i('ip-hmi').value, $i('ip-hmim').value], lap:[lapIp(), lapM()]};
    for (const k in cfg){ $i('ipt-' + k).textContent = cfg[k][0] || '—'; $i('ipm-' + k).textContent = cfg[k][1] || '—'; $i('ipw-' + k).setAttribute('stroke', 'var(--good)'); $i('ipd-' + k).setAttribute('fill', '#2ecc40'); }
    $i('ipl-lap').setAttribute('fill', dev.lap.auto ? '#ffc42d' : '#777');
    return cfg;
  }
  $i('ip-auto').addEventListener('change', () => { $i('ip-manf').style.opacity = .45; ['ip-lap', 'ip-lapm', 'ip-lapg'].forEach(x => $i(x).disabled = true); });
  $i('ip-man').addEventListener('change', () => { $i('ip-manf').style.opacity = 1; ['ip-lap', 'ip-lapm', 'ip-lapg'].forEach(x => $i(x).disabled = false); });
  $i('ip-ok').addEventListener('click', () => { dev.lap.auto = $i('ip-auto').checked; dev.lap.ip = $i('ip-lap').value.trim(); dev.lap.m = $i('ip-lapm').value.trim(); dev.lap.gw = $i('ip-lapg').value.trim(); if (!dev.lap.auto && (ip2n(dev.lap.ip) === null || ip2n(dev.lap.m) === null)){ logTo(log, 'Windows: invalid address or mask.', 'bad'); return; } paint(); logTo(log, dev.lap.auto ? `ipconfig: Autoconfiguration IPv4 Address ${APIPA} (no DHCP; an APIPA address is useless)` : `ipconfig: IPv4 Address ${dev.lap.ip}  Subnet Mask ${dev.lap.m}`, dev.lap.auto ? 'bad' : 'ok'); });
  let pingOk = false, online = false;
  function reach(a, b){ const A = ip2n(a[0]), B = ip2n(b[0]), MA = ip2n(a[1]), MB = ip2n(b[1]); if ([A, B, MA, MB].some(x => x === null)) return 'bad'; if (A === B) return 'dup'; if ((A & MA) !== (B & MA) || (A & MB) !== (B & MB)) return 'subnet'; return 'ok'; }
  $i('ip-ping').addEventListener('click', () => {
    const cfg = paint(); let ok = 0;
    for (const k of ['plc', 'hmi']){
      logTo(log, `C:\\> ping ${cfg[k][0]}`, 'dim'); const r = reach(cfg.lap, cfg[k]);
      if (r === 'ok'){ logTo(log, `Reply from ${cfg[k][0]}: bytes=32 time<1ms TTL=${k === 'plc' ? 30 : 64}`, 'ok'); $i('ipl-' + k).setAttribute('fill', '#2ecc40'); ok++; }
      else if (r === 'dup'){ logTo(log, `Windows: IP address conflict with ${cfg[k][0]} (duplicate address: choose another address in the same subnet)`, 'bad'); $i('ipl-' + k).setAttribute('fill', '#ff3b26'); }
      else { logTo(log, `Request timed out. (${cfg.lap[0]}/${cfg.lap[1]} is not in the subnet of ${cfg[k][0]}/${cfg[k][1]})`, 'bad'); $i('ipl-' + k).setAttribute('fill', '#ff3b26'); }
    }
    pingOk = ok === 2; if (pingOk) logTo(log, 'The laptop sees the PLC and HMI ✓ Now Go online.', 'ok'); check();
  });
  $i('ip-online').addEventListener('click', () => { const cfg = paint(); const r = reach(cfg.lap, cfg.plc); logTo(log, 'TIA Portal › Go online › Accessible devices (PN/IE, Realtek PCIe GbE):', 'dim'); if (r !== 'ok'){ logTo(log, dev.lap.auto ? '  No devices. The laptop is on DHCP with a 169.254 address: set a manual address first.' : '  No devices in this subnet. Check the laptop address and mask.', 'bad'); return; } logTo(log, `  plc_1  S7-1200  ${cfg.plc[0]}  MAC 28:63:36:xx  → Go online ✓ (RUN)`, 'ok'); online = true; check(); });
  function check(){ if (pingOk && online) win('ip', 'The laptop is in the PLC/HMI subnet, ping succeeded and Go online ✓'); }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function type(id, v){ const el = $i(id); el.value = ''; for (const ch of v){ el.value += ch; await sleep(55); } }
  let demo = false;
  $i('ip-demo').addEventListener('click', async () => {
    if (demo) return; demo = true; log.innerHTML = '';
    logTo(log, '1) Read the PLC address from TIA or from the label: 192.168.0.1 / 255.255.255.0', 'dim'); await sleep(1400);
    logTo(log, '2) On the laptop: Ethernet › Properties › IPv4 › Use the following IP address', 'dim'); $i('ip-man').checked = true; $i('ip-man').dispatchEvent(new Event('change')); await sleep(900);
    logTo(log, '3) An unused address in the same subnet: 192.168.0.100, the same mask, and no gateway', 'dim');
    await type('ip-lap', '192.168.0.100'); await sleep(300); await type('ip-lapm', '255.255.255.0'); await sleep(500); $i('ip-ok').click(); await sleep(1200);
    logTo(log, '4) ping to verify', 'dim'); await sleep(500); $i('ip-ping').click(); await sleep(1500);
    logTo(log, '5) Go online from TIA Portal', 'dim'); await sleep(500); $i('ip-online').click(); demo = false;
  });
  paint();
};

/* ---------------- 2. Modbus RTU ---------------- */
BUILD.modbus = host => {
  const slaves = [
    {n:'ATV320 drive', id:1, baud:19200, par:'E', regs:{0:5000, 1:4980, 2:124, 3:3, 4:2300}, names:{0:'Reference frequency ×0.01 Hz', 1:'Actual frequency', 2:'Current ×0.1 A', 3:'Status word', 4:'DC bus voltage'}},
    {n:'Power meter', id:2, baud:19200, par:'E', regs:{0:2301, 1:155, 2:3567, 3:98}, names:{0:'Voltage ×0.1 V', 1:'Current ×0.1 A', 2:'Power W', 3:'Power factor %'}},
    {n:'E5CC temperature controller', id:3, baud:9600, par:'N', regs:{0:1825, 1:1800, 2:0}, names:{0:'PV ×0.1 °C', 1:'SV ×0.1 °C', 2:'Output status'}}
  ];
  host.innerHTML = `<div class="panel"><p>A master (the gateway) and three slaves share a single RS-485 pair. The third slave came from the factory with different settings, and the termination is missing at the far end. All devices must use the same baud rate and parity, with 120 Ω at <b>both ends only</b>.</p>
  <div class="grid2">
   <div class="dev"><h3><i class="led g"></i>Master (gateway)</h3><label>Baud <select id="mb-b"><option>9600</option><option selected>19200</option><option>38400</option></select></label><label>Parity <select id="mb-p"><option value="E" selected>Even</option><option value="N">None</option><option value="O">Odd</option></select></label><label>120 Ω termination <input type="checkbox" id="mb-t0" checked></label></div>
   ${slaves.map((s, i) => `<div class="dev"><h3><i class="led" id="mbl${i}"></i>${esc(s.n)}</h3><label>Slave ID <input id="mbid${i}" type="number" min="1" max="247" value="${s.id}"></label><label>Baud <select id="mbb${i}"><option${s.baud == 9600 ? ' selected' : ''}>9600</option><option${s.baud == 19200 ? ' selected' : ''}>19200</option><option>38400</option></select></label><label>Parity <select id="mbp${i}"><option value="E"${s.par == 'E' ? ' selected' : ''}>Even</option><option value="N"${s.par == 'N' ? ' selected' : ''}>None</option><option value="O">Odd</option></select></label><label>120 Ω termination <input type="checkbox" id="mb-t${i + 1}"${i === 0 ? ' checked' : ''}></label><small class="muted">${i === 2 ? 'Last device on the bus' : i === 0 ? 'Mid-bus' : 'Mid-bus'}</small></div>`).join('')}
  </div></div>
  <div class="panel"><h3 style="margin:0 0 8px">Modbus request</h3><div class="frm">
   <label>Slave ID<input id="mq-id" type="number" value="1" min="1" max="247"></label>
   <label>Function<select id="mq-fc"><option value="3">03 Read Holding</option><option value="4">04 Read Input</option><option value="6">06 Write Single</option></select></label>
   <label>Start (0-based)<input id="mq-a" type="number" value="0" min="0"></label>
   <label>Count / Value<input id="mq-n" type="number" value="2" min="1"></label>
   <button class="btn pri" id="mq-go">Send</button></div>
   <div id="mq-out"></div><div class="log" id="mq-log"></div><p class="muted" style="margin:8px 0 0">Successful reads: <b id="mq-cnt">0</b> from devices: <b id="mq-dev">—</b></p></div>`;
  const log = $('#mq-log', host), out = $('#mq-out', host); const okSet = new Set(); let okN = 0;
  $('#mq-go', host).addEventListener('click', () => {
    const id = +$('#mq-id', host).value, fc = +$('#mq-fc', host).value, a = +$('#mq-a', host).value, n = +$('#mq-n', host).value;
    const req = [id, fc, a >> 8, a & 255, n >> 8, n & 255]; const c = crc16(req); req.push(c & 255, c >> 8);
    out.innerHTML = '<div><b>Request:</b></div>' + bytesHtml(req, i => i === 0 ? 'h' : i >= 6 ? 'c' : '');
    const mb = +$('#mb-b', host).value, mp = $('#mb-p', host).value;
    const term = [0, 1, 2, 3].map(i => $('#mb-t' + i, host).checked);
    const termOk = term[0] && term[3] && !term[1] && !term[2];
    const si = slaves.findIndex((s, i) => +$('#mbid' + i, host).value === id);
    slaves.forEach((s, i) => $('#mbl' + i, host).className = 'led');
    if (si < 0){ logTo(log, `TX ${req.map(hex).join(' ')}\nRX: timeout (no slave with ID ${id})`, 'bad'); return; }
    const s = slaves[si];
    if (+$('#mbb' + si, host).value !== mb || $('#mbp' + si, host).value !== mp){ logTo(log, `TX ${req.map(hex).join(' ')}\nRX: timeout / framing error (slave ${id} settings do not match the master: ${$('#mbb' + si, host).value} ${$('#mbp' + si, host).value} vs ${mb} ${mp})`, 'bad'); $('#mbl' + si, host).className = 'led r'; return; }
    if (!termOk && Math.random() < 0.6){ logTo(log, `TX ${req.map(hex).join(' ')}\nRX: CRC error (reflections on the bus: check the termination, at both ends only)`, 'bad'); $('#mbl' + si, host).className = 'led y'; return; }
    const ids = [0, 1, 2].map(i => +$('#mbid' + i, host).value);
    if (new Set(ids).size < 3 && ids.filter(x => x === id).length > 1){ logTo(log, 'RX: collision / CRC error (two identical IDs answering at once)', 'bad'); return; }
    const max = Object.keys(s.regs).length;
    if (fc === 6){
      if (!(a in s.regs)){ const r = [id, fc | 0x80, 2]; const cc = crc16(r); r.push(cc & 255, cc >> 8); logTo(log, `RX ${r.map(hex).join(' ')}  → Exception 02 Illegal data address`, 'bad'); return; }
      s.regs[a] = n; logTo(log, `RX ${req.map(hex).join(' ')}  → wrote value ${n} to register ${a} (${s.names[a]})`, 'ok'); $('#mbl' + si, host).className = 'led g'; return;
    }
    if (a + n > max || n < 1){ const r = [id, fc | 0x80, 2]; const cc = crc16(r); r.push(cc & 255, cc >> 8); logTo(log, `RX ${r.map(hex).join(' ')}  → Exception 02 Illegal data address (the device has ${max} registers: 0..${max - 1})`, 'bad'); $('#mbl' + si, host).className = 'led y'; return; }
    const r = [id, fc, n * 2]; for (let i = 0; i < n; i++){ const v = s.regs[a + i]; r.push(v >> 8, v & 255); } const cc = crc16(r); r.push(cc & 255, cc >> 8);
    out.innerHTML += '<div><b>Response:</b></div>' + bytesHtml(r, i => i === 0 ? 'h' : i >= r.length - 2 ? 'c' : '');
    logTo(log, `RX ${r.map(hex).join(' ')}\n` + Array.from({length:n}, (_, i) => `  reg ${a + i} = ${s.regs[a + i]}  (${s.names[a + i]})`).join('\n'), 'ok');
    $('#mbl' + si, host).className = 'led g'; okN++; okSet.add(id); $('#mq-cnt', host).textContent = okN; $('#mq-dev', host).textContent = [...okSet].join(', ');
    if (okN >= 3 && okSet.size >= 2 && termOk) win('modbus');
  });
};

/* ---------------- 3. Modbus TCP ---------------- */
BUILD.mbtcp = host => {
  const plc = {ip:'192.168.1.10', port:502, unit:1, regs:[1825, 3000, 1, 2450, 1800, 0, 0, 0, 0, 0], names:['Oven temperature ×0.1 °C', 'Part counter', 'Running', 'Current ×0.01 A', 'Setpoint ×0.1 °C', 'Spare', 'Spare', 'Spare', 'Spare', 'Spare']};
  let tid = 0, didRead = false, didWrite = false, didVerify = false;
  host.innerHTML = `<div class="panel"><div class="grid2"><div class="dev"><h3><i class="led g"></i>Server: PLC</h3><div class="mono">192.168.1.10 : 502 · Unit 1</div><div class="tblw"><table class="tbl"><thead><tr><th>Address</th><th>Meaning</th><th>Value</th></tr></thead><tbody id="mt-map"></tbody></table></div></div>
  <div class="dev"><h3>Client (laptop / gateway)</h3><div class="frm">
   <label>IP<input id="mt-ip" value="192.168.1.11"></label><label>Port<input id="mt-port" type="number" value="502"></label><label>Unit ID<input id="mt-u" type="number" value="1"></label>
   <label>Function<select id="mt-fc"><option value="3">03 Read Holding</option><option value="6">06 Write Single</option><option value="16">16 Write Multiple</option></select></label>
   <label>Address<input id="mt-a" type="number" value="0" min="0"></label><label>Count / Value<input id="mt-n" type="number" value="1" min="1"></label>
   <button class="btn pri" id="mt-go">Send</button></div></div></div>
  <div id="mt-out" style="margin-top:8px"></div><div class="log" id="mt-log"></div></div>`;
  const map = $('#mt-map', host), log = $('#mt-log', host), out = $('#mt-out', host);
  const render = () => map.innerHTML = plc.regs.map((v, i) => `<tr><td class="mono">${i}</td><td>${plc.names[i]}</td><td class="mono">${v}</td></tr>`).join('');
  render();
  $('#mt-go', host).addEventListener('click', () => {
    const ip = $('#mt-ip', host).value.trim(), port = +$('#mt-port', host).value, u = +$('#mt-u', host).value, fc = +$('#mt-fc', host).value, a = +$('#mt-a', host).value, n = +$('#mt-n', host).value;
    tid = (tid + 1) & 0xFFFF;
    const pdu = [fc, a >> 8, a & 255, n >> 8, n & 255]; const mbap = [tid >> 8, tid & 255, 0, 0, 0, pdu.length + 1, u];
    out.innerHTML = '<div><b>Request:</b> MBAP (TID, PID, LEN, UID) then PDU</div>' + bytesHtml(mbap.concat(pdu), i => i < 7 ? 'h' : '');
    logTo(log, `> connect ${ip}:${port}`, 'dim');
    if (ip2n(ip) === null || (ip2n(ip) & 0xFFFFFF00) !== (ip2n(plc.ip) & 0xFFFFFF00)){ logTo(log, 'connect: timeout (no route to this address)', 'bad'); return; }
    if (ip !== plc.ip){ logTo(log, 'connect: timeout (no device at this address; ping fails)', 'bad'); return; }
    if (port !== plc.port){ logTo(log, `connect: ECONNREFUSED (ping succeeds but port ${port} is closed; Modbus TCP uses 502)`, 'bad'); return; }
    if (u !== plc.unit){ logTo(log, 'RX: Exception 0B Gateway target device failed to respond (wrong Unit ID)', 'bad'); return; }
    if (![3, 6, 16].includes(fc)){ logTo(log, 'RX: Exception 01 Illegal function', 'bad'); return; }
    if (fc === 3){
      if (a + n > plc.regs.length){ logTo(log, 'RX: Exception 02 Illegal data address (registers 0..9 only)', 'bad'); return; }
      const r = [tid >> 8, tid & 255, 0, 0, 0, 3 + n * 2, u, 3, n * 2]; for (let i = 0; i < n; i++) r.push(plc.regs[a + i] >> 8, plc.regs[a + i] & 255);
      out.innerHTML += '<div><b>Response:</b></div>' + bytesHtml(r, i => i < 7 ? 'h' : '');
      logTo(log, Array.from({length:n}, (_, i) => `reg ${a + i} = ${plc.regs[a + i]}${a + i === 0 ? '  → ' + (plc.regs[0] / 10).toFixed(1) + ' °C' : ''}`).join('\n'), 'ok');
      if (a === 0) didRead = true; if (a <= 4 && a + n > 4 && didWrite) didVerify = true;
    } else {
      if (a >= plc.regs.length){ logTo(log, 'RX: Exception 02 Illegal data address', 'bad'); return; }
      if (a === 0 || a === 1 || a === 3){ logTo(log, 'RX: Exception 04 Server device failure (read-only register: measured value)', 'bad'); return; }
      plc.regs[a] = n & 0xFFFF; render(); logTo(log, `Wrote ${n} to register ${a} (${plc.names[a]})${a === 4 ? ' → setpoint is now ' + (n / 10).toFixed(1) + ' °C' : ''}`, 'ok'); if (a === 4) didWrite = true;
    }
    if (didRead && didWrite && didVerify) win('mbtcp');
  });
};

/* ---------------- 4. PROFIBUS ---------------- */
BUILD.profibus = host => {
  const st = [
    {n:'ET 200S (remote I/O)', sh:'ET 200S', cfg:3, dial:3, gsd:true},
    {n:'SINAMICS G120 drive', sh:'G120', cfg:4, dial:4, gsd:true},
    {n:'Festo valve terminal', sh:'Festo', cfg:5, dial:7, gsd:true},
    {n:'WAGO remote I/O', sh:'WAGO I/O', cfg:6, dial:6, gsd:false}
  ];
  host.innerHTML = `<div class="panel"><p>Master CPU 315-2DP at address 2, running at 1.5 Mbit/s. In the configuration (HW Config) each station has an address and a GSD file. Each device has a rotary dial/DIP switches that set its actual address. The termination switches are on the D-Sub connectors.</p>
  <div class="bus"><svg viewBox="0 0 720 90"><line x1="20" y1="45" x2="700" y2="45" stroke="currentColor" stroke-width="4"/><rect x="20" y="20" width="90" height="50" rx="6" fill="var(--panel)" stroke="var(--accent)" stroke-width="2"/><text x="65" y="41" text-anchor="middle" font-weight="700">Master</text><text x="65" y="60" text-anchor="middle">addr 2</text>
  ${st.map((s, i) => `<g><rect x="${160 + i * 140}" y="20" width="110" height="50" rx="6" fill="var(--panel)" stroke="currentColor"/><circle id="pbs${i}" cx="${175 + i * 140}" cy="35" r="6" fill="#777"/><text x="${215 + i * 140}" y="41" text-anchor="middle" font-size="10">${esc(s.sh)}</text><text x="${215 + i * 140}" y="60" text-anchor="middle">cfg ${s.cfg}</text></g>`).join('')}
  <text x="20" y="85" font-size="10">A</text><text x="700" y="85" font-size="10" text-anchor="end">B (far end)</text></svg></div>
  <div class="grid2" style="margin-top:10px">
   <div class="dev"><h3><i class="led g"></i>Master (HW Config)</h3><label>Termination on master connector <input type="checkbox" id="pb-t0" checked></label><label>Baud <select id="pb-b"><option>500 kbit/s</option><option selected>1.5 Mbit/s</option><option>12 Mbit/s</option></select></label></div>
   ${st.map((s, i) => `<div class="dev"><h3><i class="led" id="pbl${i}"></i>${esc(s.n)}</h3><label>Configured address <b class="mono">${s.cfg}</b></label><label>Dial on device <input id="pbd${i}" type="number" min="0" max="126" value="${s.dial}"></label><label>GSD installed in HW Config <input type="checkbox" id="pbg${i}"${s.gsd ? ' checked' : ''}></label><label>Connector termination <input type="checkbox" id="pbt${i}"${i === 1 ? ' checked' : ''}></label></div>`).join('')}
  </div><div class="row"><button class="btn pri" id="pb-go">Download configuration and connect</button></div><div class="log" id="pb-log"></div></div>`;
  const log = $('#pb-log', host);
  $('#pb-go', host).addEventListener('click', () => {
    log.innerHTML = ''; let ok = 0;
    const t = [$('#pb-t0', host).checked].concat(st.map((_, i) => $('#pbt' + i, host).checked));
    const termOk = t[0] && t[4] && !t[1] && !t[2] && !t[3];
    const dials = st.map((_, i) => +$('#pbd' + i, host).value);
    if (!termOk) logTo(log, t[0] && t[4] ? 'Warning: termination mid-bus splits the bus and randomly drops the stations behind it.' : 'Warning: termination missing at one end (reflections: stations drop out and come back).', 'bad');
    st.forEach((s, i) => {
      const d = dials[i], gsd = $('#pbg' + i, host).checked; let r = 'g', m = `Station ${s.cfg}: data exchange ✓`;
      if (!gsd){ r = 'r'; m = `Station ${s.cfg}: SF: no GSD file in the configuration; the station is unknown to the master.`; }
      else if (dials.filter(x => x === d).length > 1){ r = 'r'; m = `Station ${s.cfg}: BF: address ${d} is duplicated on the bus.`; }
      else if (d !== s.cfg){ r = 'r'; m = `Station ${s.cfg}: BF: the device is set to address ${d} but the configuration expects ${s.cfg}.`; }
      else if (!termOk && (i >= 2 || Math.random() < 0.4)){ r = 'y'; m = `Station ${s.cfg}: BF flashing: drops out and comes back (physical-layer problem).`; }
      else ok++;
      $('#pbl' + i, host).className = 'led ' + r + (r === 'y' ? ' bl' : ''); $('#pbs' + i, host).setAttribute('fill', r === 'g' ? '#2ecc40' : r === 'r' ? '#ff3b26' : '#ffc42d');
      logTo(log, m, r === 'g' ? 'ok' : 'bad');
    });
    if (ok === 4 && termOk){ logTo(log, 'CPU: RUN, BF LED off. The network is healthy ✓', 'ok'); win('profibus'); }
  });
};

/* ---------------- 5. PROFINET ---------------- */
BUILD.profinet = host => {
  const want = ['et200sp-1', 'g120-1', 'iol-master-1'];
  const dv = [
    {n:'ET 200SP', mac:'28:63:36:A1:04:11', name:'et200sp-1'},
    {n:'SINAMICS G120 (replaced today)', mac:'28:63:36:B2:77:0C', name:''},
    {n:'IO-Link master', mac:'00:0E:8C:5D:12:F0', name:'iol-master1'}
  ];
  const ips = ['192.168.0.11', '192.168.0.12', '192.168.0.13'];
  host.innerHTML = `<div class="panel"><p>The S7-1500 controller holds a configuration of three named devices. It does not know MAC addresses; it searches for the <b>name</b> using DCP, then assigns the device the IP from the configuration. The drive was replaced today, so its name is empty, and the IO-Link master name was misspelled.</p>
  <div class="dev"><h3>Controller configuration (TIA Portal)</h3><div class="tblw"><table class="tbl"><thead><tr><th>Device name</th><th>Planned IP</th></tr></thead><tbody>${want.map((w, i) => `<tr><td class="mono">${w}</td><td class="mono">${ips[i]}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="grid2" style="margin-top:10px">${dv.map((d, i) => `<div class="dev"><h3><i class="led" id="pnl${i}"></i>${esc(d.n)}</h3><label>MAC <b class="mono">${d.mac}</b></label><label>Current name <b class="mono" id="pnn${i}">${d.name || '(empty)'}</b></label><label>IP <b class="mono" id="pni${i}">0.0.0.0</b></label><label>New name <input id="pnx${i}" placeholder="device-name"></label><div class="row"><button class="btn" data-assign="${i}">DCP: assign name</button><button class="btn" data-swap="${i}">Replace with a spare unit</button></div></div>`).join('')}</div>
  <div class="row"><button class="btn pri" id="pn-scan">PRONETA: scan network</button><button class="btn" id="pn-go">Controller: connect to devices</button></div><div class="log" id="pn-log"></div></div>`;
  const log = $('#pn-log', host);
  host.addEventListener('click', e => {
    const a = e.target.closest('[data-assign]'), s = e.target.closest('[data-swap]');
    if (a){ const i = +a.dataset.assign, v = $('#pnx' + i, host).value.trim().toLowerCase(); if (!/^[a-z0-9][a-z0-9-]*$/.test(v)){ logTo(log, 'Invalid name: lowercase Latin letters, digits and hyphens only, no spaces.', 'bad'); return; } dv[i].name = v; $('#pnn' + i, host).textContent = v; $('#pnl' + i, host).className = 'led'; logTo(log, `DCP Set Name → ${dv[i].mac}: "${v}" (stored in the device)`, 'ok'); }
    if (s){ const i = +s.dataset.swap; dv[i].name = ''; dv[i].mac = dv[i].mac.slice(0, 12) + hex(Math.floor(Math.random() * 256)) + ':' + hex(Math.floor(Math.random() * 256)); $('#pnn' + i, host).textContent = '(empty)'; $('#pni' + i, host).textContent = '0.0.0.0'; $('#pnl' + i, host).className = 'led r'; logTo(log, `New device with MAC ${dv[i].mac} and no name. The controller cannot find it.`, 'bad'); }
  });
  $('#pn-scan', host).addEventListener('click', () => { logTo(log, 'PRONETA scan (DCP Identify All):', 'dim'); dv.forEach(d => logTo(log, `  ${d.mac}  name="${d.name}"  ip=${$('#pni' + dv.indexOf(d), host).textContent}  ${want.includes(d.name) ? '' : '→ matches no name in the configuration'}`, want.includes(d.name) ? 'ok' : 'bad')); });
  $('#pn-go', host).addEventListener('click', () => {
    let ok = 0; const names = dv.map(d => d.name);
    want.forEach((w, i) => { const j = names.indexOf(w); const dup = names.filter(x => x === w).length > 1; if (j < 0){ logTo(log, `"${w}": no device with this name on the network (BF).`, 'bad'); return; } if (dup){ logTo(log, `"${w}": name duplicated on two devices.`, 'bad'); return; } $('#pni' + j, host).textContent = ips[i]; $('#pnl' + j, host).className = 'led g'; logTo(log, `"${w}" → ${dv[j].mac}: assigned ${ips[i]}, data exchange ✓`, 'ok'); ok++; });
    dv.forEach((d, i) => { if (!want.includes(d.name)){ $('#pnl' + i, host).className = 'led r'; } });
    if (ok === 3) win('profinet');
  });
};

/* ---------------- 6. CAN ---------------- */
BUILD.can = host => {
  const nd = [{n:'PLC (NMT master)', id:'0x000', br:'500'}, {n:'Servo 1 (PDO)', id:'0x181', br:'500'}, {n:'Servo 2 (PDO)', id:'0x182', br:'250'}];
  host.innerHTML = `<div class="panel"><p>Three CANopen nodes on one bus at 500 kbit/s. CAN arbitration: the dominant bit (0) wins, so the frame with the <b>lowest ID</b> goes first. A node at a different bit rate produces error frames until it goes Bus-off. 120 Ω termination at both ends only.</p>
  <div class="grid2">${nd.map((d, i) => `<div class="dev"><h3><i class="led" id="cl${i}"></i>${esc(d.n)}</h3><label>COB-ID (hex)<input id="ci${i}" value="${d.id}"></label><label>Bit rate <select id="cb${i}"><option${d.br == '125' ? ' selected' : ''}>125</option><option${d.br == '250' ? ' selected' : ''}>250</option><option${d.br == '500' ? ' selected' : ''}>500</option><option>1000</option></select></label><label>120 Ω termination <input type="checkbox" id="ct${i}"${i === 0 ? ' checked' : ''}></label><small class="muted">${i === 0 ? 'First node' : i === 2 ? 'Last node' : 'Middle'}</small></div>`).join('')}</div>
  <div class="row"><button class="btn" id="c-ohm">Measure resistance between CAN_H and CAN_L (bus unpowered)</button><button class="btn pri" id="c-go">All three transmit at the same instant</button></div><div class="log" id="c-log"></div></div>`;
  const log = $('#c-log', host); let ohmOk = false;
  $('#c-ohm', host).addEventListener('click', () => { const t = [0, 1, 2].map(i => $('#ct' + i, host).checked); const n = t.filter(Boolean).length; const r = n === 0 ? 'open (∞)' : n === 1 ? '120 Ω' : n === 2 ? '60 Ω' : '40 Ω'; ohmOk = t[0] && t[2] && !t[1]; logTo(log, `Ω-meter: ${r}  ${ohmOk ? '→ correct: two resistors, one at each end' : n === 2 ? '→ 60 Ω, but one resistor is in the middle: both must be at the ends' : '→ incorrect'}`, ohmOk ? 'ok' : 'bad'); });
  $('#c-go', host).addEventListener('click', () => {
    const brs = [0, 1, 2].map(i => $('#cb' + i, host).value); const ids = [0, 1, 2].map(i => parseInt($('#ci' + i, host).value, 16));
    if (ids.some(x => isNaN(x) || x < 0 || x > 0x7FF)){ logTo(log, 'Invalid ID (11-bit: 0x000–0x7FF).', 'bad'); return; }
    const maj = brs.sort()[1]; let bad = false;
    [0, 1, 2].forEach(i => { const b = $('#cb' + i, host).value; if (b !== maj){ bad = true; $('#cl' + i, host).className = 'led r'; logTo(log, `${nd[i].n}: ${b} kbit/s vs ${maj} on the bus → repeated error frames → Bus-off (red LED)`, 'bad'); } });
    if (bad){ logTo(log, 'The bus is disturbed; unify the bit rate first.', 'bad'); return; }
    if (new Set(ids).size < 3){ logTo(log, 'Two identical IDs: both frames win arbitration together, then collide in the payload → error. Each ID must be unique.', 'bad'); return; }
    const order = [0, 1, 2].sort((a, b) => ids[a] - ids[b]);
    logTo(log, 't=0: all three start transmitting. Bit-by-bit arbitration:', 'dim');
    order.forEach((i, k) => { $('#cl' + i, host).className = 'led g'; logTo(log, `  ${k + 1}. ${nd[i].n} (0x${ids[i].toString(16).toUpperCase().padStart(3, '0')} = ${ids[i].toString(2).padStart(11, '0')}) ${k === 0 ? '→ wins: first 0 bit against a 1 from the others' : 'waits for the previous frame to end, then retries'}`, k === 0 ? 'ok' : ''); });
    if (!ohmOk && Math.random() < 0.5) logTo(log, 'Note: sporadic CRC errors appeared; measure the termination.', 'bad');
    if (ohmOk) win('can');
  });
};

/* ---------------- 7. OPC UA ---------------- */
BUILD.opcua = host => {
  let trusted = false, connected = null, didRead = false, sub = null;
  const tree = {Objects:{Server:{ServerStatus:1}, PLC_1:{DataBlocks:{Line3:{OvenTemp:['Double', () => 182.5 + (Math.random() - .5)], PartsCount:['Int32', () => 3000 + Math.floor(Date.now() / 1000) % 60], Running:['Boolean', () => true], Setpoint:['Double', () => 180]}}}}};
  host.innerHTML = `<div class="panel"><div class="grid2">
   <div class="dev"><h3>Client (UaExpert)</h3><label>Endpoint <input id="ua-ep" value="opc.tcp://192.168.1.10:4840"></label><label>Security <select id="ua-sec"><option value="none">None</option><option value="b256" selected>Basic256Sha256 · Sign&amp;Encrypt</option></select></label><label>Auth <select id="ua-auth"><option>Anonymous</option><option>user/password</option></select></label><div class="row"><button class="btn pri" id="ua-conn">Connect</button><button class="btn" id="ua-disc">Disconnect</button></div></div>
   <div class="dev"><h3><i class="led g"></i>Server: S7-1500 OPC UA</h3><div class="mono">opc.tcp://192.168.1.10:4840</div><label>Client certificate “UaExpert@laptop” <b id="ua-tr">Rejected</b></label><div class="row"><button class="btn" id="ua-trust">Trust the certificate on the server (TIA → Trusted)</button></div></div>
  </div><div class="grid2" style="margin-top:10px"><div class="dev"><h3>Address space</h3><ul class="tree" id="ua-tree"><li class="dim">(not connected)</li></ul></div><div class="dev"><h3>Attributes</h3><div id="ua-attr" class="mono muted">Select a node</div><div class="row"><button class="btn" id="ua-read" disabled>Read</button><button class="btn" id="ua-sub" disabled>Subscribe 500 ms</button></div><div class="log" id="ua-log"></div></div></div></div>`;
  const log = $('#ua-log', host), tr = $('#ua-tree', host), attr = $('#ua-attr', host); let selPath = null;
  $('#ua-trust', host).addEventListener('click', () => { trusted = true; $('#ua-tr', host).textContent = 'Trusted ✓'; logTo(log, 'Server: the UaExpert@laptop certificate was moved to Trusted.', 'ok'); });
  const renderTree = () => { const walk = (o, p) => Object.keys(o).map(k => { const v = o[k], path = p.concat(k); if (Array.isArray(v) || typeof v === 'number') return `<li class="leaf" data-p="${path.join('/')}">${k}</li>`; return `<li class="fold">${k}<ul class="tree">${walk(v, path).join('')}</ul></li>`; }); tr.innerHTML = walk(tree, []).join(''); };
  $('#ua-conn', host).addEventListener('click', () => {
    const ep = $('#ua-ep', host).value.trim(), sec = $('#ua-sec', host).value;
    if (ep !== 'opc.tcp://192.168.1.10:4840'){ logTo(log, 'BadTcpEndpointUrlInvalid / timeout: check the address and port 4840.', 'bad'); return; }
    if (sec !== 'none' && !trusted){ logTo(log, 'BadCertificateUntrusted: the server does not trust the client certificate. Trust it on the server, then reconnect.', 'bad'); return; }
    connected = sec; logTo(log, `Connected (${sec === 'none' ? 'no security: acceptable for testing only' : 'Basic256Sha256 Sign&Encrypt ✓'}). Session created.`, 'ok'); renderTree();
  });
  $('#ua-disc', host).addEventListener('click', () => { connected = null; clearInterval(sub); sub = null; tr.innerHTML = '<li class="dim">(not connected)</li>'; attr.textContent = 'Select a node'; $('#ua-read', host).disabled = $('#ua-sub', host).disabled = true; logTo(log, 'Disconnected.', 'dim'); });
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
  host.innerHTML = `<div class="panel"><p>Mosquitto broker at <span class="mono">mqtts://broker.local:8883</span>. The publisher does not know the subscriber; the broker distributes by topic. <b>+</b> matches one level and <b>#</b> matches everything below it.</p>
  <div class="grid2"><div class="dev"><h3>Subscribe (dashboard)</h3><div class="frm"><label>Topic filter<input id="mq-f" value="plant/line3/oven"></label><label>QoS<select id="mq-fq"><option>0</option><option selected>1</option><option>2</option></select></label><button class="btn pri" id="mq-sub">Subscribe</button></div><div id="mq-subs" class="muted" style="margin-top:6px">No subscriptions.</div></div>
  <div class="dev"><h3>Publish (gateway)</h3><div class="frm"><label>Topic<input id="mq-t" value="plant/line3/status"></label><label>Payload<input id="mq-p" value="online"></label><label>QoS<select id="mq-q"><option>0</option><option selected>1</option><option>2</option></select></label><label>Retain<input type="checkbox" id="mq-r"></label><button class="btn pri" id="mq-pub">Publish</button></div><div class="row"><button class="btn" id="mq-sens">Start line 3 and 4 sensors</button><button class="btn" id="mq-lwt">Gateway drops suddenly (Last Will)</button></div></div></div>
  <div class="log" id="mqlog" style="margin-top:10px"></div></div>`;
  const log = $('#mqlog', host);
  const match = (f, t) => { const a = f.split('/'), b = t.split('/'); for (let i = 0; i < a.length; i++){ if (a[i] === '#') return true; if (i >= b.length) return false; if (a[i] !== '+' && a[i] !== b[i]) return false; } return a.length === b.length; };
  function publish(topic, payload, qos, retain, who){
    logTo(log, `PUBLISH ${topic} "${payload}" q${qos}${retain ? ' retain' : ''}  (${who})`, 'dim');
    if (retain) retained[topic] = payload;
    const hit = subs.filter(s => match(s.f, topic));
    if (!hit.length){ logTo(log, '  No matching subscriber; the broker discards the message' + (retain ? ' but retains it for new subscribers' : '') + '.', 'bad'); }
    hit.forEach(s => { logTo(log, `  → subscriber "${s.f}" received: ${topic} = ${payload}`, 'ok'); if (topic.endsWith('/oven') && s.f.includes('+')) got++; });
    check();
  }
  $('#mq-sub', host).addEventListener('click', () => { const f = $('#mq-f', host).value.trim(); if (!f || /#./.test(f)){ logTo(log, 'Invalid filter: # may only be the last level.', 'bad'); return; } subs.push({f, q:$('#mq-fq', host).value}); $('#mq-subs', host).innerHTML = subs.map(s => `<span class="term">${esc(s.f)}</span>`).join(' '); logTo(log, `SUBACK ${f}`, 'ok'); Object.keys(retained).forEach(t => { if (match(f, t)) logTo(log, `  → retained message delivered immediately: ${t} = ${retained[t]}`, 'ok'); }); });
  $('#mq-pub', host).addEventListener('click', () => { const t = $('#mq-t', host).value.trim(), p = $('#mq-p', host).value, r = $('#mq-r', host).checked; if (!t || /[+#]/.test(t)){ logTo(log, 'A publish topic cannot contain + or #.', 'bad'); return; } publish(t, p, $('#mq-q', host).value, r, 'manual'); if (r && /status$/.test(t)) retainedStatus = true; check(); });
  $('#mq-sens', host).addEventListener('click', () => { if (timer){ clearInterval(timer); timer = null; return; } let k = 0; timer = setInterval(() => { publish('plant/line3/oven', JSON.stringify({t:+(182 + Math.random()).toFixed(1)}), 1, false, 'line 3 gateway'); publish('plant/line4/oven', JSON.stringify({t:+(176 + Math.random()).toFixed(1)}), 1, false, 'line 4 gateway'); if (++k >= 5){ clearInterval(timer); timer = null; } }, 1500); });
  $('#mq-lwt', host).addEventListener('click', () => { logTo(log, 'The line 3 gateway TCP connection dropped without DISCONNECT. After Keep-alive × 1.5 the broker publishes its Last Will:', 'bad'); publish('plant/line3/status', 'offline', 1, true, 'broker on behalf of the gateway'); });
  function check(){ if (got >= 2 && retainedStatus) win('mqtt'); }
};

/* ---------------- 9. Gateway (Node-RED) ---------------- */
BUILD.gateway = host => {
  const wires = [false, false]; let sel = -1, deployed = false;
  host.innerHTML = `<div class="panel"><p>Node-RED editor. Click a node, then the next node, to connect them with a wire. The function node divides the raw reading; the PLC sends the temperature ×10.</p>
  <div class="nodes"><div class="node" data-n="0"><b>Modbus Read</b><small>192.168.1.10:502 · FC3 · 0..3</small><label>Every <input id="gw-ms" type="number" value="1000" style="width:5em"> ms</label></div><div class="node" data-n="1"><b>Function</b><small>oven_temp = r[0] / <input id="gw-div" type="number" value="1" style="width:4em"></small><small>parts = r[1], running = r[2]</small></div><div class="node" data-n="2"><b>MQTT Out</b><small>mqtts://broker:8883</small><small>plant/line3/oven · QoS 1</small></div></div>
  <div class="row"><button class="btn pri" id="gw-dep">Deploy</button><button class="btn" id="gw-clr">Clear wires</button></div><div class="log" id="gw-log"></div></div>`;
  const log = $('#gw-log', host), nodes = $$('.node', host);
  const paint = () => nodes.forEach((n, i) => { n.classList.toggle('sel', i === sel); n.classList.toggle('wired', (i === 0 && wires[0]) || (i === 1 && wires[0] && wires[1]) || (i === 2 && wires[1])); });
  nodes.forEach((n, i) => n.addEventListener('click', e => { if (e.target.tagName === 'INPUT') return; if (sel < 0){ sel = i; } else if (sel === i){ sel = -1; } else { const a = Math.min(sel, i), b = Math.max(sel, i); if (b - a === 1){ wires[a] = true; logTo(log, `Wire: ${['Modbus Read', 'Function', 'MQTT Out'][a]} → ${['Modbus Read', 'Function', 'MQTT Out'][b]}`, 'ok'); } else logTo(log, 'Do not wire Modbus straight to MQTT; the raw values would have no scaling and no names.', 'bad'); sel = -1; } paint(); }));
  $('#gw-clr', host).addEventListener('click', () => { wires[0] = wires[1] = false; sel = -1; paint(); });
  $('#gw-dep', host).addEventListener('click', () => {
    if (!wires[0] || !wires[1]){ logTo(log, 'Deploy: incomplete flow; a node has no input or output.', 'bad'); return; }
    const div = +$('#gw-div', host).value || 1, ms = +$('#gw-ms', host).value;
    logTo(log, `Deployed. Modbus poll every ${ms} ms`, 'dim');
    const raw = [1825, 3012, 1, 2450];
    const obj = {ts:Date.now(), oven_temp:raw[0] / div, parts_count:raw[1], running:raw[2] === 1, current_a:raw[3] / 100};
    logTo(log, `Modbus → [${raw.join(', ')}]`); logTo(log, `MQTT plant/line3/oven ← ${JSON.stringify(obj)}`, div === 10 ? 'ok' : '');
    if (div !== 10) logTo(log, `oven_temp = ${obj.oven_temp}: the oven is not that hot. The PLC sends ×10, so divide by 10.`, 'bad');
    else { logTo(log, 'Values are correct, named and in the right units ✓', 'ok'); if (ms < 200) logTo(log, 'Warning: polling faster than 200 ms loads the PLC for no benefit.', 'bad'); else win('gateway'); }
  });
};

/* ---------------- 10. Dashboard / alarms / OEE / trend ---------------- */
BUILD.dash = host => {
  const N = 240; const temp = []; for (let i = 0; i < N; i++){ let v = 185 + Math.sin(i / 9) * 6 + (Math.random() - .5) * 4; if (i === 60 || i === 61 || i === 130) v = 203 + Math.random() * 3; if (i >= 170 && i < 215) v = 198 + (i - 170) * 0.5 + (Math.random() - .5) * 2; temp.push(+v.toFixed(1)); }
  const vib = [1.9, 2.0, 2.1, 2.3, 2.6, 2.9, 3.3, 3.7];
  let a1 = IL.has('l12', 'sim'), a2 = IL.has('l12', 'sim'), a3 = IL.has('l13', 'sim');
  host.innerHTML = `<div class="panel"><h3 style="margin:0 0 6px">A) Oven temperature: an alarm that does not cry wolf</h3><p class="muted">One sample per second for four minutes. There are two short spikes (sensor noise) and one real rise lasting 45 seconds. Set the limit, delay and hysteresis so that exactly one alarm fires.</p>
  <svg class="chart" id="d-ch" viewBox="0 0 720 220"></svg>
  <div class="sl"><span>High limit</span><input type="range" id="d-lim" min="190" max="215" value="195"><b id="d-limv">195 °C</b></div>
  <div class="sl"><span>Delay</span><input type="range" id="d-del" min="0" max="60" value="0"><b id="d-delv">0 s</b></div>
  <div class="sl"><span>Hysteresis</span><input type="range" id="d-hys" min="0" max="10" value="0"><b id="d-hysv">0 °C</b></div>
  <div class="statline" id="d-st"></div></div>
  <div class="panel"><h3 style="margin:0 0 6px">B) OEE for today’s shift</h3><div class="oee"><label>Planned time (min)<input value="480" readonly></label><label>Actual run time (min)<input value="420" readonly></label><label>Parts produced<input value="3000" readonly></label><label>Ideal cycle time per part (s)<input value="7" readonly></label><label>Good parts<input value="2900" readonly></label><label>OEE % (calculate it)<input id="d-oee" type="number" step="0.1" placeholder="?"></label></div><div class="row"><button class="btn pri" id="d-oeego">Check</button><span class="msg" id="d-oeem"></span></div></div>
  <div class="panel"><h3 style="margin:0 0 6px">C) Vibration trend: when will it cross the ISO limit?</h3><p class="muted">Weekly RMS mm/s on the cooling pump bearing. The baseline is 1.9, and the “unacceptable” limit for this machine class is 7.1 mm/s. Over the last four weeks the slope has risen steadily. Continuing on the latest slope, in which week is the crossing expected?</p>
  <svg class="chart" id="d-vb" viewBox="0 0 720 220"></svg><div class="row"><label>Expected week <select id="d-wk">${Array.from({length:14}, (_, i) => `<option>${i + 9}</option>`).join('')}</select></label><button class="btn pri" id="d-wkgo">Check</button><span class="msg" id="d-wkm"></span></div></div>`;
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
    st.innerHTML = `Alarms: <b>${ev.length}</b> · false: <b>${falseN}</b> · real one ${trueHit ? 'caught ✓' : 'missed ✗'}${chatter ? ' · chattering around the limit: raise the hysteresis' : ''}`;
    if (trueHit && ev.length === 1){ a1 = true; check12(); }
  }
  ['d-lim', 'd-del', 'd-hys'].forEach(id => $('#' + id, host).addEventListener('input', draw)); draw();
  $('#d-oeego', host).addEventListener('click', () => { const v = +$('#d-oee', host).value; const A = 420 / 480, P = 3000 * 7 / (420 * 60), Q = 2900 / 3000, oee = A * P * Q * 100; const m = $('#d-oeem', host); if (Math.abs(v - oee) <= 0.6){ m.className = 'msg ok'; m.textContent = `Correct: ${A.toFixed(3)} × ${P.toFixed(3)} × ${Q.toFixed(3)} = ${oee.toFixed(1)}%`; a2 = true; check12(); } else { m.className = 'msg bad'; m.textContent = 'Not quite. Availability = 420÷480, Performance = (3000×7)÷(420×60), Quality = 2900÷3000; then multiply all three.'; } });
  function check12(){ if (a1 && a2) win('dash', 'One correct alarm and OEE calculated ✓ (lesson 12). The vibration trend for lesson 13 remains.'); if (a1 && a2 && a3) full(); }
  const vb = $('#d-vb', host); { const x = i => 60 + i * 44, y = v => 200 - v / 8 * 185; const slope = (vib[7] - vib[4]) / 3; const cross = 8 + Math.ceil((7.1 - vib[7]) / slope); vb.innerHTML = `<line x1="60" y1="10" x2="60" y2="200" stroke="currentColor" opacity=".4"/><line x1="60" y1="200" x2="700" y2="200" stroke="currentColor" opacity=".4"/>${[0, 2, 4, 6, 8].map(v => `<text x="30" y="${y(v) + 4}">${v}</text>`).join('')}<line class="lim" x1="60" x2="700" y1="${y(7.1)}" y2="${y(7.1)}"/><text x="700" y="${y(7.1) - 4}" text-anchor="end">ISO 7.1</text><line class="base" x1="60" x2="700" y1="${y(1.9)}" y2="${y(1.9)}" stroke="var(--good)"/><text x="700" y="${y(1.9) - 4}" text-anchor="end">baseline 1.9</text><polyline class="line" points="${vib.map((v, i) => x(i) + ',' + y(v)).join(' ')}"/>${vib.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="var(--accent)"/><text x="${x(i)}" y="214" text-anchor="middle">w${i + 1}</text><text x="${x(i)}" y="${y(v) - 8}" text-anchor="middle">${v}</text>`).join('')}<line x1="${x(7)}" y1="${y(vib[7])}" x2="${x(13)}" y2="${y(vib[7] + slope * 6)}" stroke="var(--cur)" stroke-dasharray="4 4"/>`; vb.dataset.cross = cross; }
  $('#d-wkgo', host).addEventListener('click', () => { const w = +$('#d-wk', host).value, c = +vb.dataset.cross, m = $('#d-wkm', host); if (w === c){ m.className = 'msg ok'; m.textContent = `Correct: the slope ≈ 0.4 mm/s per week, and (7.1 − 3.7) ÷ 0.4 ≈ ${Math.ceil((7.1 - 3.7) / 0.4)} weeks after week 8 → week ${c}. Order the bearing now and plan the shutdown before then.`; a3 = true; IL.mark('l13', 'sim'); if (a1 && a2) full(); } else { m.className = 'msg bad'; m.textContent = `Not quite. Compute the slope over weeks 5–8 (difference ÷ 3), then divide the remaining distance to 7.1 by the slope.`; } });
  function full(){ win('dash', 'All three parts done: alarm, OEE and trend ✓ (lessons 12 and 13).'); }
};

/* ---------------- 11. Faults project ---------------- */
BUILD.faults = host => {
  const COMP = [['plc', 'PLC S7-1200'], ['pn', 'ET 200SP · PROFINET'], ['vfd', 'Bus · Modbus RTU drive'], ['iol', 'IO-Link pressure sensor'], ['servo', 'CANopen servo'], ['gw', 'Node-RED gateway'], ['cloud', 'Broker & dashboard']];
  const TOOLS = [['led', 'LEDs and cables'], ['ping', 'ping / arp'], ['ohm', 'Ohmmeter on the bus'], ['proneta', 'PRONETA'], ['mbc', 'Modbus client'], ['ws', 'Wireshark / CAN analyzer'], ['mqx', 'MQTT Explorer'], ['logs', 'Device log (Diagnostics)']];
  const FIX = [['dcp', 'Assign the device name via DCP'], ['term', 'Fit 120 Ω at the bus end'], ['uid', 'Set the Unit ID in the PLC program'], ['ip', 'Change the duplicate IP address'], ['bitrate', 'Set the servo bit rate to 500 kbit/s'], ['fw', 'Open outbound port 8883 in the firewall'], ['ntp', 'Configure NTP on the gateway'], ['cable', 'Reconnect the cable to its port'], ['reboot', 'Restart the PLC'], ['replace', 'Replace the drive']];
  const POOL = [
    {id:'pnname', c:'pn', tool:'proneta', fix:'dcp', sym:'ET 200SP: BF LED red, no inputs', rev:'PRONETA: device MAC 28:63:36:B2:xx has no name (name=""). The configuration expects "et200sp-1".', logs:'CPU: Diagnostics buffer: "IO device et200sp-1 not found".', ping:'ping 192.168.0.11: timeout.'},
    {id:'term', c:'vfd', tool:'ohm', fix:'term', sym:'Drive readings drop out with CRC errors', rev:'Ohmmeter between A and B: only 120 Ω (one resistor; the far end is unterminated).', mbc:'FC3 → sometimes a valid reply, sometimes a CRC error.', ws:'Sporadic corrupted frames on RS-485.'},
    {id:'uid', c:'vfd', tool:'mbc', fix:'uid', sym:'The PLC cannot read the drive at all', rev:'Modbus client: ID 1 → timeout. Scan 1–10: the device answers on ID 2. The program polls ID 1.', logs:'PLC: MB_MASTER status 80C8 (timeout).', ohm:'60 Ω: termination OK.'},
    {id:'dupip', c:'gw', tool:'ping', fix:'ip', sym:'The gateway connects and drops every minute', rev:'ping 192.168.1.5 → replies with two different times; arp -a shows a changing MAC: duplicate address between the gateway and the maintenance laptop.', logs:'Gateway: "IP conflict detected".', mqx:'Intermittent connection.'},
    {id:'bitrate', c:'servo', tool:'ws', fix:'bitrate', sym:'The servo does not respond and its LED is red', rev:'CAN analyzer: repeated error frames, then Bus-off for node 0x02; the node runs at 250 kbit/s and the bus at 500.', ohm:'60 Ω: termination OK.', logs:'Servo: AL.0x8120 CAN bus off.'},
    {id:'fw', c:'cloud', tool:'mqx', fix:'fw', sym:'The dashboard is empty although the gateway is running', rev:'MQTT Explorer from the gateway: connect broker:8883 → timeout. ping broker succeeds: the port is blocked in the firewall.', ping:'ping broker.local: succeeds.', logs:'Node-RED: mqtt "Connection refused / timeout".'},
    {id:'ntp', c:'cloud', tool:'mqx', fix:'ntp', sym:'Dashboard charts show the date 1970', rev:'MQTT Explorer: messages arrive but ts=0000000 (the gateway clock is not set). ', logs:'Gateway: "NTP sync failed".'},
    {id:'cable', c:'iol', tool:'led', fix:'cable', sym:'Line pressure always reads 0', rev:'Port 3 LED on the IO-Link master is off; the M12 cable is loose.', logs:'IO-Link master: port 3 "no device".', ping:'Not related to IP.'}
  ];
  let active = [], fixed = new Set(), revealed = new Set();
  function pickFaults(){ const pool = IL.shuffle(POOL); active = []; for (const f of pool){ if (active.length === 3) break; if (active.some(a => a.c === f.c)) continue; active.push(f); } fixed = new Set(); revealed = new Set(); }
  host.innerHTML = `<div class="panel"><p>The filling line stopped this morning. It has three faults in different layers, and each unit shows its own symptom. Choose the right tool to reveal the cause, then the right action. A wrong action does no harm but wastes time.</p>
  <div class="line-sim" id="f-line"></div>
  <h3 style="margin:14px 0 6px">Tools</h3><div class="tools" id="f-tools">${TOOLS.map(t => `<button class="btn" data-tool="${t[0]}">${t[1]}</button>`).join('')}</div>
  <div class="log" id="f-log" style="margin-top:8px"></div>
  <div class="row"><label>Action <select id="f-fix">${FIX.map(f => `<option value="${f[0]}">${f[1]}</option>`).join('')}</select></label><button class="btn pri" id="f-apply">Apply</button><button class="btn" id="f-new">New faults</button></div></div>`;
  const line = $('#f-line', host), log = $('#f-log', host);
  function render(){ line.innerHTML = COMP.map(c => { const fs = active.filter(f => f.c === c[0] && !fixed.has(f.id)); return `<div class="ls ${fs.length ? 'bad' : 'ok'}"><h4>${c[1]}<i class="led ${fs.length ? 'r' : 'g'}"></i></h4>${fs.map(f => `<div>⚠ ${f.sym}</div>`).join('') || '<div class="muted">Running</div>'}</div>`; }).join(''); }
  function start(){ pickFaults(); log.innerHTML = ''; render(); logTo(log, 'Active faults: 3. Start from the symptoms and the lowest layer.', 'dim'); }
  $('#f-tools', host).addEventListener('click', e => { const b = e.target.closest('[data-tool]'); if (!b) return; const t = b.dataset.tool; logTo(log, `▶ ${TOOLS.find(x => x[0] === t)[1]}`, 'dim'); let any = false; active.forEach(f => { if (fixed.has(f.id)) return; if (f.tool === t){ logTo(log, '  ' + f.rev, 'ok'); revealed.add(f.id); any = true; } else if (f[t]){ logTo(log, '  ' + f[t]); any = true; } }); if (!any) logTo(log, '  Nothing abnormal with this tool.'); });
  $('#f-apply', host).addEventListener('click', () => { const v = $('#f-fix', host).value; const f = active.find(x => x.fix === v && !fixed.has(x.id)); if (!f){ logTo(log, `✗ “${FIX.find(x => x[0] === v)[1]}”: nothing changed. (${v === 'reboot' ? 'a restart hides the symptoms but does not fix the cause' : 'this is not the cause of any active fault'})`, 'bad'); return; } fixed.add(f.id); logTo(log, `✓ “${FIX.find(x => x[0] === v)[1]}”: ${COMP.find(c => c[0] === f.c)[1]} is running again.`, 'ok'); render(); if (fixed.size === active.length){ logTo(log, 'All units green, the line is running and the dashboard is updating ✓', 'ok'); win('faults'); } });
  $('#f-new', host).addEventListener('click', start);
  start();
};

const first = location.hash.slice(1);
show(G[first] ? first : 'ip');
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (G[h]) show(h); });
})();
