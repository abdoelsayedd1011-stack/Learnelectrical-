/* الورشة الحرة: لوحة فاضية، الطالب يختار الأجهزة بنفسه ويوصّل ويشغّل، أو يفتح دايرة جاهزة من الكورس.
   بتستخدم نفس محرّك التوصيل CL.bench من غير تصحيح (مفيش حل مطلوب). */
(function(){
'use strict';
const EX = window.CL_FREE_EX || [];
const SK = 'classic-free-v1', BK = 'free/board';
const esc = CL.esc || (s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])));
const $ = s => document.querySelector(s);
const clone = o => JSON.parse(JSON.stringify(o));
function load(){ try { const s = JSON.parse(localStorage.getItem(SK)); return s && Array.isArray(s.devs) ? s : null; } catch (e){ return null; } }
function save(){ try { localStorage.setItem(SK, JSON.stringify(S)); } catch (e){} }
const BLANK = () => ({title:'لوحتي', devs:[{id:'Q1', type:'supplyAC', name:'القاطع'}]});
let S = load() || BLANK();

// مفيش «صح / غلط» هنا: الكهربا بتشتغل على طول على أي توصيل
CL.on('precheck', e => { e.skip = true; });

const PAL = [
  {g:'المصدر والحماية', items:[
    {lab:'مصدر 230V (L / N)', ic:'🏠', pre:'Q', spec:{type:'supplyAC', name:'القاطع'}},
    {lab:'مصدر ثلاثي الفاز 400V', ic:'⚡', pre:'G', spec:{type:'supply3P', name:'المصدر'}},
    {lab:'مصدر تغذية 24V DC', ic:'🔋', pre:'G', spec:{type:'supplyDC', name:'مصدر تغذية 24V'}},
    {lab:'قاطع ثلاثي الفاز', ic:'🟫', pre:'Q', spec:{type:'mcb', cfg:{poles:3, label:'C10'}, name:'قاطع القوى'}},
    {lab:'قاطع تحكم أحادي الفاز', ic:'🔌', pre:'F', spec:{type:'mcb', cfg:{poles:1, label:'C2'}, name:'قاطع التحكم'}},
    {lab:'فيوز', ic:'🧯', pre:'F', spec:{type:'fuse', cfg:{poles:1, label:'2A', kind:'gG'}, name:'فيوز'}},
    {lab:'أوفرلود', ic:'🌡️', pre:'F', spec:{type:'ol', cfg:{Ir:5, model:'LRD10', range:'4–6.5 A', lo:4, hi:6.5}, name:'أوفرلود حراري'}},
    {lab:'MPCB', ic:'🛡️', pre:'Q', spec:{type:'mpcb', cfg:{Ir:5, label:'GV2ME10', lo:4, hi:6.3, aux:true}, name:'MPCB'}},
    {lab:'محوّل تحكم 230/24V', ic:'🔁', pre:'TC', spec:{type:'xfmr', cfg:{v:230, vs:24}, name:'محوّل تحكم'}}
  ]},
  {g:'أزرار ومفاتيح', items:[
    {lab:'زر START أخضر', ic:'🟢', pre:'S', spec:{type:'pb', cfg:{color:'green', label:'START', blocks:['NO', 'NC']}}},
    {lab:'زر STOP أحمر', ic:'🔴', pre:'S', spec:{type:'pb', cfg:{color:'red', label:'STOP', blocks:['NO', 'NC']}}},
    {lab:'زر طوارئ', ic:'🍄', pre:'S', spec:{type:'estop', cfg:{blocks:['NC', 'NO']}}},
    {lab:'سلكتور 0 / I', ic:'🎛️', pre:'S', spec:{type:'sel', cfg:{pos:['0', 'I'], label:'0 / I', blocks:[{k:'NO', on:[1]}, {k:'NC', on:[1]}]}}},
    {lab:'سلكتور HAND-0-AUTO', ic:'🎚️', pre:'S', spec:{type:'sel', cfg:{pos:['HAND', '0', 'AUTO'], start:1, label:'HAND-0-AUTO', blocks:[{k:'NO', on:[0]}, {k:'NO', on:[2]}]}}},
    {lab:'ليمت سويتش', ic:'🔘', pre:'LS', spec:{type:'ls', cfg:{label:'ليمت سويتش', blocks:['NO', 'NC']}, name:'ليمت سويتش'}}
  ]},
  {g:'مصابيح', items:[
    {lab:'مصباح أخضر', ic:'🟩', pre:'H', spec:{type:'lamp', cfg:{color:'green', v:230}, name:'يعمل'}},
    {lab:'مصباح أحمر', ic:'🟥', pre:'H', spec:{type:'lamp', cfg:{color:'red', v:230}, name:'متوقف'}},
    {lab:'مصباح أصفر', ic:'🟨', pre:'H', spec:{type:'lamp', cfg:{color:'amber', v:230}, name:'عطل'}},
    {lab:'مصباح 24V', ic:'💡', pre:'H', spec:{type:'lamp', cfg:{color:'green', v:24}, name:'24V'}}
  ]},
  {g:'كونتاكتورات وريلايات وتايمرات', items:[
    {lab:'كونتاكتور', ic:'🧲', pre:'KM', spec:{type:'contactor', cfg:{v:230, aux:['NO', 'NC']}, name:'كونتاكتور'}},
    {lab:'ريلاي 230V', ic:'🔲', pre:'K', spec:{type:'relay', cfg:{v:230, blocks:['CO', 'CO']}, name:'ريلاي'}},
    {lab:'ريلاي 24V', ic:'🔳', pre:'K', spec:{type:'relay', cfg:{v:24, blocks:['CO', 'CO']}, name:'ريلاي 24V'}},
    {lab:'تايمر On-delay', ic:'⏱️', pre:'KT', spec:{type:'timer', cfg:{v:230, mode:'on', t:5}, name:'تايمر On-delay'}},
    {lab:'تايمر Off-delay', ic:'⏲️', pre:'KT', spec:{type:'timer', cfg:{v:230, mode:'off', t:5}, name:'تايمر Off-delay'}}
  ]},
  {g:'محرك وخزان', items:[
    {lab:'محرك ثلاثي الفاز', ic:'⚙️', pre:'M', spec:{type:'motor', cfg:{term:3, kW:2.2, In:5, load:0.8}, name:'محرك'}},
    {lab:'خزان ومضخة', ic:'🛢️', pre:'T', need:'motor', spec:{type:'tank', cfg:{fill:0.25, drain:0.04, lvl0:0.3}, name:'خزان'}},
    {lab:'عوامة عليا', ic:'⬆️', pre:'LSH', need:'tank', spec:{type:'level', cfg:{look:'float', at:0.85, hyst:0.1, blocks:['NO', 'NC'], label:'عوامة عليا'}, name:'عوامة عليا'}},
    {lab:'عوامة سفلى', ic:'⬇️', pre:'LSL', need:'tank', spec:{type:'level', cfg:{look:'float', at:0.25, hyst:0.05, blocks:['NO', 'NC'], label:'عوامة سفلى'}, name:'عوامة سفلى'}},
    {lab:'ترمنال بلوك', ic:'🧱', pre:'X', spec:{type:'tb', cfg:{n:6, bridges:[[1, 2, 3], [4, 5, 6]], labels:{1:'L', 2:'L', 3:'L', 4:'N', 5:'N', 6:'N'}}, name:'ترمنال بلوك'}}
  ]}
];
const ALL = [].concat(...PAL.map(g => g.items));

function nid(pre){ let n = 1; while (S.devs.some(d => d.id === pre + n)) n++; return pre + n; }
function say(t, cls){ const m = $('#fwMsg'); m.innerHTML = t; m.className = 'fw-msg' + (cls ? ' ' + cls : ''); }

let api = null;
function build(){
  const host = $('#fwBench');
  if (api && api.destroy) try { api.destroy(); } catch (e){}
  host.innerHTML = '';
  $('#fwTitle').textContent = S.title;
  $('#fwDevs').innerHTML = S.devs.map(d => `<span class="fw-dev"><b>${esc(d.tag || d.id)}</b>${d.name ? ' ' + esc(d.name) : ''}<button type="button" data-rm="${esc(d.id)}" aria-label="أزِل ${esc(d.id)}">✕</button></span>`).join('') || '<span class="fw-empty">اللوحة فارغة. أضف أجهزة من الأسفل.</span>';
  try {
    api = CL.bench(host, {id:'free', title:S.title, devices:S.devs, cases:[{label:'', set:{}, expect:{}}]}, {key:BK, netColors:true, onChange:schem, open:true, pos:S.pos || (S.pos = {}), onMove:p => { S.pos = p; save(); }});
    schem();
  } catch (e){
    console.error(e); host.innerHTML = '<p class="fw-msg bad">يوجد جهاز لا يمكن وضعه. امسحه وجرّب مرة أخرى.</p>';
  }
}

// رسمة الدايرة (سلّم القوى والتحكم) مرسومة من التوصيل اللي على اللوحة دلوقتي
function schem(){
  const box = $('#fwSchem'); if (!box) return;
  const W = CL.store.bench(BK) || [];
  if (!W.length){ box.innerHTML = '<p class="fw-empty">لا توجد أسلاك بعد. بمجرد أن توصّل سيظهر الرسم هنا.</p>'; return; }
  try { box.innerHTML = CL.art.schematic({title:S.title, devices:S.devs, solution:W}).html; }
  catch (e){ box.innerHTML = '<p class="fw-empty">الرسم غير جاهز لهذا التوصيل.</p>'; }
}

function add(it){
  if (it.spec.type === 'supply3P' && S.devs.some(d => d.type === 'supply3P')) return say('يوجد مصدر ثلاثي الفاز على اللوحة بالفعل.', 'bad');
  const spec = clone(it.spec);
  if (it.need === 'motor'){
    const m = S.devs.filter(d => d.type === 'motor').pop();
    if (!m) return say('أضف <b>محركًا</b> أولًا، فهو الذي سيكون مضخة الخزان.', 'bad');
    spec.cfg.pump = m.id;
  }
  if (it.need === 'tank'){
    const t = S.devs.filter(d => d.type === 'tank').pop();
    if (!t) return say('أضف <b>خزانًا ومضخة</b> أولًا، فالعوامة تُركّب عليه.', 'bad');
    spec.cfg.tank = t.id;
    if (S.devs.some(d => d.id === it.pre)) spec.id = nid(it.pre); else spec.id = it.pre;
  }
  if (!spec.id) spec.id = it.spec.type === 'supply3P' ? 'G' : nid(it.pre);
  S.devs.push(spec); save(); build();
  say(`✓ أضفت <b>${esc(spec.id)}</b> (${esc(it.lab)}). وصّله على اللوحة.`, 'ok');
  const b = $('#fwBench'); if (b) b.scrollIntoView({block:'start', behavior:'smooth'});
}

function remove(id){
  const gone = new Set([id]);
  S.devs.forEach(d => { if (d.cfg && (gone.has(d.cfg.pump) || gone.has(d.cfg.tank))) gone.add(d.id); });
  S.devs = S.devs.filter(d => !gone.has(d.id));
  save(); build();
  say(`أزلت ${[...gone].map(esc).join(' و ')} من اللوحة، وأُزيلت الأسلاك التي عليه.`);
}

function openEx(id){
  let e = null; EX.forEach(g => g.items.forEach(x => { if (x.id === id) e = x; }));
  if (!e) return;
  S = {title:e.title, devs:clone(e.devices), pos:{}};
  CL.store.bench(BK, clone(e.solution));
  save(); build();
  $('#fwLib').open = false; $('#fwAdd').open = false;
  say(`✓ فتحت «${esc(e.title)}» موصولة. اضغط <b>⚡ شغّل الكهرباء</b> وجرّب الأزرار، أو عدّل فيها بحرية.`, 'ok');
  $('#fwSchH').scrollIntoView({block:'start', behavior:'smooth'});
}

function init(){
  const GI = ['🔘', '🔁', '🧲', '🛡️', '⏱️', '⚙️', '💧', '↔️', '⭐'];
  $('#fwLibList').innerHTML = EX.map((g, gi) => `<div class="fw-g"><h3>${GI[gi] || '•'} ${esc(g.g)}</h3><div class="fw-ex">${g.items.map(x => `<button type="button" data-ex="${esc(x.id)}"><span class="ic">${GI[gi] || '•'}</span><span>${esc(x.title)}</span></button>`).join('')}</div></div>`).join('');
  $('#fwPal').innerHTML = PAL.map((g, gi) => `<div class="fw-g"><h3>${esc(g.g)}</h3><div class="fw-pal">${g.items.map(x => `<button type="button" data-add="${ALL.indexOf(x)}"><span class="ic">${x.ic}</span><span>${esc(x.lab)}</span></button>`).join('')}</div></div>`).join('');
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-add]'); if (a) return add(ALL[+a.dataset.add]);
    const r = e.target.closest('[data-rm]'); if (r) return remove(r.dataset.rm);
    const x = e.target.closest('[data-ex]'); if (x) return openEx(x.dataset.ex);
    const j = e.target.closest('[data-jump]'); if (j){ const d = document.getElementById(j.dataset.jump); d.open = true; d.scrollIntoView({block:'start', behavior:'smooth'}); return; }
    const z = e.target.closest('#fwZoom'); if (z){ const on = document.body.classList.toggle('fw-zoomed'); z.setAttribute('aria-pressed', on); z.textContent = on ? '🔍 صغّر اللوحة' : '🔍 كبّر اللوحة'; try { localStorage.setItem(SK + '-zoom', on ? '1' : ''); } catch (er){} if (on) $('#fwBench .bn-board').scrollIntoView({block:'start'}); return; }
    if (e.target.closest('#fwNew')){ S = BLANK(); CL.store.bench(BK, null); save(); build(); say('✓ لوحة جديدة فيها مصدر فقط. أضف الأجهزة التي تحتاجها.', 'ok'); }
  });
  try { if (localStorage.getItem(SK + '-zoom')){ document.body.classList.add('fw-zoomed'); const z = $('#fwZoom'); z.setAttribute('aria-pressed', 'true'); z.textContent = '🔍 صغّر اللوحة'; } } catch (er){}
  build();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
