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
    {lab:'مصدر 230V (L / N)', ic:'🔌', pre:'Q', spec:{type:'supplyAC', name:'القاطع'}},
    {lab:'مصدر 3 فاز 400V', ic:'⚡', pre:'G', spec:{type:'supply3P', name:'المصدر'}},
    {lab:'باور سبلاي 24V DC', ic:'🔋', pre:'G', spec:{type:'supplyDC', name:'باور سبلاي 24V'}},
    {lab:'قاطع 3 فاز', ic:'🟫', pre:'Q', spec:{type:'mcb', cfg:{poles:3, label:'C10'}, name:'قاطع القوى'}},
    {lab:'قاطع تحكم 1 فاز', ic:'▫️', pre:'F', spec:{type:'mcb', cfg:{poles:1, label:'C2'}, name:'قاطع التحكم'}},
    {lab:'فيوز', ic:'🧯', pre:'F', spec:{type:'fuse', cfg:{poles:1, label:'2A', kind:'gG'}, name:'فيوز'}},
    {lab:'أوفرلود', ic:'🌡️', pre:'F', spec:{type:'ol', cfg:{Ir:5, model:'LRD10', range:'4–6.5 A', lo:4, hi:6.5}, name:'أوفرلود حراري'}},
    {lab:'MPCB', ic:'🛡️', pre:'Q', spec:{type:'mpcb', cfg:{Ir:5, label:'GV2ME10', lo:4, hi:6.3, aux:true}, name:'MPCB'}},
    {lab:'محوّل تحكم 230/24V', ic:'🔁', pre:'TC', spec:{type:'xfmr', cfg:{v:230, vs:24}, name:'محوّل تحكم'}}
  ]},
  {g:'زراير ومفاتيح', items:[
    {lab:'زرار START أخضر', ic:'🟢', pre:'S', spec:{type:'pb', cfg:{color:'green', label:'START', blocks:['NO', 'NC']}}},
    {lab:'زرار STOP أحمر', ic:'🔴', pre:'S', spec:{type:'pb', cfg:{color:'red', label:'STOP', blocks:['NO', 'NC']}}},
    {lab:'زرار طوارئ', ic:'🍄', pre:'S', spec:{type:'estop', cfg:{blocks:['NC', 'NO']}}},
    {lab:'سلكتور 0 / I', ic:'🎛️', pre:'S', spec:{type:'sel', cfg:{pos:['0', 'I'], label:'0 / I', blocks:[{k:'NO', on:[1]}, {k:'NC', on:[1]}]}}},
    {lab:'سلكتور HAND-0-AUTO', ic:'🎚️', pre:'S', spec:{type:'sel', cfg:{pos:['HAND', '0', 'AUTO'], start:1, label:'HAND-0-AUTO', blocks:[{k:'NO', on:[0]}, {k:'NO', on:[2]}]}}},
    {lab:'ليمت سويتش', ic:'🔘', pre:'LS', spec:{type:'ls', cfg:{label:'ليمت سويتش', blocks:['NO', 'NC']}, name:'ليمت سويتش'}}
  ]},
  {g:'لمبات', items:[
    {lab:'لمبة خضرا', ic:'🟩', pre:'H', spec:{type:'lamp', cfg:{color:'green', v:230}, name:'شغال'}},
    {lab:'لمبة حمرا', ic:'🟥', pre:'H', spec:{type:'lamp', cfg:{color:'red', v:230}, name:'واقف'}},
    {lab:'لمبة صفرا', ic:'🟨', pre:'H', spec:{type:'lamp', cfg:{color:'amber', v:230}, name:'عطل'}},
    {lab:'لمبة 24V', ic:'💡', pre:'H', spec:{type:'lamp', cfg:{color:'green', v:24}, name:'24V'}}
  ]},
  {g:'كونتاكتورات وريليهات وتايمرات', items:[
    {lab:'كونتاكتور', ic:'🧲', pre:'KM', spec:{type:'contactor', cfg:{v:230, aux:['NO', 'NC']}, name:'كونتاكتور'}},
    {lab:'ريلاي 230V', ic:'🔲', pre:'K', spec:{type:'relay', cfg:{v:230, blocks:['CO', 'CO']}, name:'ريلاي'}},
    {lab:'ريلاي 24V', ic:'🔳', pre:'K', spec:{type:'relay', cfg:{v:24, blocks:['CO', 'CO']}, name:'ريلاي 24V'}},
    {lab:'تايمر On-delay', ic:'⏱️', pre:'KT', spec:{type:'timer', cfg:{v:230, mode:'on', t:5}, name:'تايمر On-delay'}},
    {lab:'تايمر Off-delay', ic:'⏲️', pre:'KT', spec:{type:'timer', cfg:{v:230, mode:'off', t:5}, name:'تايمر Off-delay'}}
  ]},
  {g:'موتور وخزان', items:[
    {lab:'موتور 3 فاز', ic:'⚙️', pre:'M', spec:{type:'motor', cfg:{term:3, kW:2.2, In:5, load:0.8}, name:'موتور'}},
    {lab:'خزان وطلمبة', ic:'🛢️', pre:'T', need:'motor', spec:{type:'tank', cfg:{fill:0.25, drain:0.04, lvl0:0.3}, name:'خزان'}},
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
  $('#fwDevs').innerHTML = S.devs.map(d => `<span class="fw-dev"><b>${esc(d.tag || d.id)}</b>${d.name ? ' ' + esc(d.name) : ''}<button type="button" data-rm="${esc(d.id)}" aria-label="شيل ${esc(d.id)}">✕</button></span>`).join('') || '<span class="fw-empty">اللوحة فاضية. ضيف أجهزة من تحت.</span>';
  try {
    api = CL.bench(host, {id:'free', title:S.title, devices:S.devs, cases:[{label:'', set:{}, expect:{}}]}, {key:BK, netColors:true, onChange:schem});
    schem();
  } catch (e){
    console.error(e); host.innerHTML = '<p class="fw-msg bad">في جهاز مش راضي يتحط. امسحه وجرّب تاني.</p>';
  }
}

// رسمة الدايرة (سلّم القوى والتحكم) مرسومة من التوصيل اللي على اللوحة دلوقتي
function schem(){
  const box = $('#fwSchem'); if (!box) return;
  const W = CL.store.bench(BK) || [];
  if (!W.length){ box.innerHTML = '<p class="fw-empty">لسه مفيش أسلاك. أول ما توصّل، الرسمة هتظهر هنا.</p>'; return; }
  try { box.innerHTML = CL.art.schematic({title:S.title, devices:S.devs, solution:W}).html; }
  catch (e){ box.innerHTML = '<p class="fw-empty">الرسمة مش جاهزة للتوصيل ده.</p>'; }
}

function add(it){
  if (it.spec.type === 'supply3P' && S.devs.some(d => d.type === 'supply3P')) return say('فيه مصدر 3 فاز على اللوحة خلاص.', 'bad');
  const spec = clone(it.spec);
  if (it.need === 'motor'){
    const m = S.devs.filter(d => d.type === 'motor').pop();
    if (!m) return say('ضيف <b>موتور</b> الأول، هو اللي هيبقى طلمبة الخزان.', 'bad');
    spec.cfg.pump = m.id;
  }
  if (it.need === 'tank'){
    const t = S.devs.filter(d => d.type === 'tank').pop();
    if (!t) return say('ضيف <b>خزان وطلمبة</b> الأول، العوامة بتتركب عليه.', 'bad');
    spec.cfg.tank = t.id;
    if (S.devs.some(d => d.id === it.pre)) spec.id = nid(it.pre); else spec.id = it.pre;
  }
  if (!spec.id) spec.id = it.spec.type === 'supply3P' ? 'G' : nid(it.pre);
  S.devs.push(spec); save(); build();
  say(`✓ ضفت <b>${esc(spec.id)}</b> (${esc(it.lab)}). وصّله على اللوحة.`, 'ok');
  const b = $('#fwBench'); if (b) b.scrollIntoView({block:'start', behavior:'smooth'});
}

function remove(id){
  const gone = new Set([id]);
  S.devs.forEach(d => { if (d.cfg && (gone.has(d.cfg.pump) || gone.has(d.cfg.tank))) gone.add(d.id); });
  S.devs = S.devs.filter(d => !gone.has(d.id));
  save(); build();
  say(`شلت ${[...gone].map(esc).join(' و ')} من اللوحة، والأسلاك اللي عليه اتشالت.`);
}

function openEx(id){
  let e = null; EX.forEach(g => g.items.forEach(x => { if (x.id === id) e = x; }));
  if (!e) return;
  S = {title:e.title, devs:clone(e.devices)};
  CL.store.bench(BK, clone(e.solution));
  save(); build();
  $('#fwLib').open = false;
  say(`✓ فتحت «${esc(e.title)}» موصّلة. دوس <b>⚡ شغّل الكهربا</b> وجرّب الزراير، أو عدّل فيها براحتك.`, 'ok');
  $('#fwBench').scrollIntoView({block:'start', behavior:'smooth'});
}

function init(){
  $('#fwLibList').innerHTML = EX.map(g => `<div class="fw-g"><h3>${esc(g.g)}</h3><div class="fw-ex">${g.items.map(x => `<button type="button" class="btn" data-ex="${esc(x.id)}">${esc(x.title)}</button>`).join('')}</div></div>`).join('');
  $('#fwPal').innerHTML = PAL.map((g, gi) => `<div class="fw-g"><h3>${esc(g.g)}</h3><div class="fw-pal">${g.items.map(x => `<button type="button" class="btn" data-add="${ALL.indexOf(x)}"><span class="ic">${x.ic}</span>${esc(x.lab)}</button>`).join('')}</div></div>`).join('');
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-add]'); if (a) return add(ALL[+a.dataset.add]);
    const r = e.target.closest('[data-rm]'); if (r) return remove(r.dataset.rm);
    const x = e.target.closest('[data-ex]'); if (x) return openEx(x.dataset.ex);
    const z = e.target.closest('#fwZoom'); if (z){ const on = document.body.classList.toggle('fw-zoomed'); z.setAttribute('aria-pressed', on); z.textContent = on ? '🔍 صغّر اللوحة' : '🔍 كبّر اللوحة'; try { localStorage.setItem(SK + '-zoom', on ? '1' : ''); } catch (er){} if (on) $('#fwBench .bn-board').scrollIntoView({block:'start'}); return; }
    if (e.target.closest('#fwNew')){ S = BLANK(); CL.store.bench(BK, null); save(); build(); say('✓ لوحة جديدة فيها مصدر بس. ضيف الأجهزة اللي محتاجها.', 'ok'); }
  });
  try { if (localStorage.getItem(SK + '-zoom')){ document.body.classList.add('fw-zoomed'); const z = $('#fwZoom'); z.setAttribute('aria-pressed', 'true'); z.textContent = '🔍 صغّر اللوحة'; } } catch (er){}
  build();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
