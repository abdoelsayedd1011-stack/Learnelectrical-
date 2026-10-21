/* أسئلة الإنترفيو: shared engine for the index and the topic pages.
   Modules: store (localStorage key iv-v1) · theme · text search · topic page (filters, marks, self-test, print) · index (cards, global search).
   The questions themselves are plain HTML in each topic page; the index search reads those pages. */
(function(){
'use strict';
const IV = window.IV = {};
const KEY = 'iv-v1';
const LV = {1:'مبتدئ', 2:'متوسط', 3:'خبير'};

/* ---------------- store ---------------- */
function load(){ try { const s = JSON.parse(localStorage.getItem(KEY)); return s && typeof s === 'object' ? s : {}; } catch (e){ return {}; } }
let S = load(); if (!S.k || typeof S.k !== 'object') S.k = {};
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e){} }
function reload(){ S = load(); if (!S.k || typeof S.k !== 'object') S.k = {}; }
IV.mark = (id, v) => { reload(); if (v === 'y' || v === 'n') S.k[id] = v; else delete S.k[id]; save(); };
IV.state = id => S.k[id] || '';
IV.reload = reload;

/* ---------------- theme (applied before first paint: iv.js loads in <head>) ---------------- */
function applyTheme(){ const t = S.theme; if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
applyTheme();
function isDark(){ const t = document.documentElement.getAttribute('data-theme'); if (t) return t === 'dark'; return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
function themeBtn(){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn theme-b';
  const upd = () => { const d = isDark(); b.textContent = d ? '☀' : '☾'; b.setAttribute('aria-label', d ? 'الوضع الفاتح' : 'الوضع الغامق'); b.title = b.getAttribute('aria-label'); };
  b.addEventListener('click', () => { reload(); S.theme = isDark() ? 'light' : 'dark'; save(); applyTheme(); upd(); });
  upd(); return b;
}
function addTheme(){ const ch = document.querySelector('header.top .chips'); if (ch) ch.appendChild(themeBtn()); }

/* ---------------- helpers ---------------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const LRI = '⁦', PDI = '⁩';
const iso = s => LRI + s + PDI;
// Arabic-aware normalisation for search: drop isolates/diacritics/tatweel, unify alef/yeh/teh marbuta, lowercase Latin.
function norm(s){
  return String(s || '').replace(/[⁦-⁩‎‏]/g, '').replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[–—−]/g, '-').toLowerCase().replace(/\s+/g, ' ').trim();
}
function terms(q){ const n = norm(q); return n ? n.split(' ').filter(Boolean) : []; }
const matchAll = (hay, ts) => ts.every(t => hay.indexOf(t) !== -1);
function shuffle(a){ for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function setBar(bar, pct){ if (!bar) return; const i = bar.querySelector('i'); if (i) i.style.width = pct + '%'; bar.setAttribute('aria-valuenow', String(pct)); }
// highlight literal occurrences of the raw query words in already-plain text
function hl(text, q){
  let h = esc(text);
  const ws = String(q || '').trim().split(/\s+/).filter(w => w.length >= 2).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!ws.length) return h;
  try { const re = new RegExp('(' + ws.map(w => esc(w)).join('|') + ')', 'gi'); h = h.replace(re, '<mark>$1</mark>'); } catch (e){}
  return h;
}

/* ================= topic page ================= */
IV.topic = function(){
  addTheme();
  const list = $('#list'), arts = $$('article.q', list), N = arts.length;
  const qIn = $('#q'), cnt = $('#cnt'), known = $('#known'), bar = $('.tools .bar'), empty = $('#empty');
  const tools = $('#tools'), test = $('#test'), nav = $('.tnav');
  const F = {lv:'', st:'', q:''};
  arts.forEach(a => {
    a._hayHead = norm($('.qt', a).textContent + ' ' + $('.qa', a).textContent);
    a._hay = norm(a.textContent);
  });

  function paintMarks(){
    arts.forEach(a => {
      const s = IV.state(a.id);
      a.classList.toggle('known', s === 'y'); a.classList.toggle('unk', s === 'n');
      $$('.mk .btn', a).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === s ? 'true' : 'false'));
    });
    const k = arts.filter(a => IV.state(a.id) === 'y').length, u = arts.filter(a => IV.state(a.id) === 'n').length;
    const pct = N ? Math.round(k / N * 100) : 0;
    setBar(bar, pct);
    known.textContent = 'عارف ' + iso(String(k)) + ' من ' + iso(String(N)) + (u ? ' · محتاج تراجع ' + iso(String(u)) : '');
  }
  function apply(){
    const ts = terms(F.q); let shown = 0;
    arts.forEach(a => {
      const s = IV.state(a.id);
      let ok = (!F.lv || a.dataset.lv === F.lv) && (!ts.length || matchAll(a._hay, ts));
      if (ok && F.st) ok = F.st === 'u' ? !s : s === F.st;
      a.hidden = !ok; if (ok) shown++;
      const d = $('details.more', a);
      // open the explanation automatically when the search hit is only inside it
      if (ok && ts.length && !matchAll(a._hayHead, ts)){ if (!d.open){ d.open = true; d.dataset.auto = '1'; } }
      else if (d.dataset.auto){ d.open = false; delete d.dataset.auto; }
    });
    empty.hidden = shown > 0;
    cnt.textContent = shown === N ? 'كل الأسئلة ظاهرة: ' + iso(String(N)) + ' سؤال' : 'ظاهر ' + iso(String(shown)) + ' من ' + iso(String(N)) + ' سؤال';
    $('#testBtn').disabled = shown === 0;
  }
  let tmr;
  qIn.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => { F.q = qIn.value; apply(); }, 120); });
  $$('.tools [data-lv]').forEach(b => b.addEventListener('click', () => { F.lv = b.dataset.lv; $$('.tools [data-lv]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); apply(); }));
  $$('.tools [data-st]').forEach(b => b.addEventListener('click', () => { F.st = b.dataset.st; $$('.tools [data-st]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); apply(); }));
  list.addEventListener('click', e => {
    const b = e.target.closest('.mk .btn'); if (!b) return;
    const a = b.closest('article.q'), v = b.dataset.v;
    IV.mark(a.id, IV.state(a.id) === v ? '' : v); paintMarks();
    if (F.st) apply();
  });
  const openAll = $('#openAll');
  openAll.addEventListener('click', () => {
    const on = openAll.getAttribute('aria-pressed') !== 'true';
    $$('details.more', list).forEach(d => { d.open = on; delete d.dataset.auto; });
    openAll.setAttribute('aria-pressed', on ? 'true' : 'false'); openAll.textContent = on ? 'اقفل كل الشرح' : 'افتح كل الشرح';
  });
  // print: every explanation opens for the printout, then goes back the way it was
  let prevOpen = null;
  window.addEventListener('beforeprint', () => { const ds = $$('details.more', list); prevOpen = ds.map(d => d.open); ds.forEach(d => { d.open = true; }); });
  window.addEventListener('afterprint', () => { if (!prevOpen) return; $$('details.more', list).forEach((d, i) => { d.open = prevOpen[i]; }); prevOpen = null; });
  $('#printBtn').addEventListener('click', () => window.print());

  /* ---------- self-test ---------- */
  const T = {ids:[], i:0, res:{}, revealed:false};
  function scope(){ return arts.filter(a => !a.hidden); }
  function showTest(on){
    test.hidden = !on; list.hidden = on; tools.hidden = on; if (nav) nav.hidden = on;
    if (on) test.scrollIntoView({block:'start'});
  }
  function startScreen(){
    const sc = scope(), notKnown = sc.filter(a => IV.state(a.id) !== 'y').length;
    const filt = sc.length !== N ? ' (على حسب البحث والفلتر اللي اخترته)' : '';
    test.innerHTML = `<div class="th"><h2>اختبر نفسك</h2><button type="button" class="btn sm" data-t="exit">‹ ارجع للأسئلة</button></div>
      <p>هيظهرلك السؤال لوحده. فكّر في الإجابة أو قولها بصوت عالي، وبعدين اكشفها وقول بصراحة: عارفها ولا لأ. اختياراتك بتتحفظ على الجهاز ده.</p>
      <p class="pos">الأسئلة المتاحة: ${iso(String(sc.length))}${esc(filt)}</p>
      <div class="opts"><label><input type="checkbox" id="tShuf" checked> رتّبهم عشوائي</label><label><input type="checkbox" id="tSkipK"${notKnown && notKnown < sc.length ? ' checked' : ''}> سيب اللي معلّم عليه «عارفها» (يفضل ${iso(String(notKnown))})</label></div>
      <div class="tbtns"><button type="button" class="btn pri big" data-t="go">ابدأ</button></div>`;
    showTest(true);
    const go = $('[data-t="go"]', test); go.focus({preventScroll:true});
  }
  function begin(ids){
    T.ids = ids; T.i = 0; T.res = {}; T.revealed = false;
    if (!ids.length){ test.innerHTML = `<div class="th"><h2>اختبر نفسك</h2><button type="button" class="btn sm" data-t="exit">‹ ارجع للأسئلة</button></div><p>مفيش أسئلة باقية بالاختيار ده. شيل علامة «سيب اللي عارفها» أو غيّر الفلتر.</p><div class="tbtns"><button type="button" class="btn" data-t="start">ارجع للإعدادات</button></div>`; return; }
    card();
  }
  function card(){
    const a = document.getElementById(T.ids[T.i]); if (!a) return end();
    const n = T.ids.length, pct = Math.round(T.i / n * 100), lv = a.dataset.lv;
    test.innerHTML = `<div class="th"><h2>اختبر نفسك</h2><span class="pos">سؤال ${iso(String(T.i + 1)) + ' من ' + iso(String(n))}</span><button type="button" class="btn sm" data-t="end">خلّص الاختبار</button></div>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="التقدّم في الاختبار"><i style="width:${pct}%"></i></div>
      <div class="qh"><span class="qn">${esc(a.querySelector('.qn').textContent)}</span><span class="lv lv${lv}">${LV[lv]}</span></div>
      <p class="tq" tabindex="-1">${a.querySelector('.qt').innerHTML}</p>
      <div class="tbtns" id="tPre"><button type="button" class="btn pri big" data-t="reveal">اكشف الإجابة</button><button type="button" class="btn" data-t="skip">فوّت السؤال</button></div>
      <div class="tans" id="tAns" hidden></div>
      <div class="tbtns" id="tPost" hidden><button type="button" class="btn big ok" data-t="y">عارفها ✓</button><button type="button" class="btn big no" data-t="n">مش عارفها ✗</button></div>`;
    T.revealed = false;
    $('[data-t="reveal"]', test).focus({preventScroll:true});
  }
  function reveal(){
    const a = document.getElementById(T.ids[T.i]); const box = $('#tAns', test);
    const qa = a.querySelector('.qa').cloneNode(true), d = a.querySelector('details.more').cloneNode(true);
    d.open = false; d.removeAttribute('data-auto');
    box.innerHTML = ''; box.appendChild(qa); box.appendChild(d); box.hidden = false;
    $('#tPre', test).hidden = true; $('#tPost', test).hidden = false; T.revealed = true;
    $('[data-t="y"]', test).focus({preventScroll:true});
  }
  function answer(v){
    const id = T.ids[T.i]; T.res[id] = v; IV.mark(id, v); paintMarks();
    next();
  }
  function next(){ T.i++; if (T.i >= T.ids.length) end(); else { card(); test.scrollIntoView({block:'start'}); } }
  function end(){
    const ids = T.ids, y = ids.filter(id => T.res[id] === 'y'), no = ids.filter(id => T.res[id] === 'n'), sk = ids.length - y.length - no.length;
    const items = no.map(id => { const a = document.getElementById(id); return `<li><a href="#${id}" data-t="goto">${a.querySelector('.qt').innerHTML}</a></li>`; }).join('');
    test.innerHTML = `<div class="th"><h2>نتيجة الاختبار</h2><button type="button" class="btn sm" data-t="exit">‹ ارجع للأسئلة</button></div>
      <div class="sum"><b>عارف ${iso(String(y.length)) + ' من ' + iso(String(ids.length))}</b><span>مش عارف: ${iso(String(no.length))}${sk ? ' · فوّت: ' + iso(String(sk)) : ''}</span>
      ${no.length ? `<p>راجع دول:</p><ul>${items}</ul>` : (y.length === ids.length ? '<p>ممتاز! جاوبت كل الأسئلة. جرّب قسم تاني أو مستوى أعلى.</p>' : '')}</div>
      <div class="tbtns">${no.length ? '<button type="button" class="btn pri" data-t="redo">عيد اللي مش عارفها</button>' : ''}<button type="button" class="btn" data-t="start">اختبار جديد</button></div>`;
    T.last = no;
    const f = $('.btn', test); if (f) f.focus({preventScroll:true});
  }
  function exit(){ showTest(false); paintMarks(); apply(); if (location.hash === '#test') history.replaceState(null, '', location.pathname + location.search); $('#testBtn').focus({preventScroll:true}); }
  test.addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    const t = b.dataset.t;
    if (t === 'go'){ let ids = scope().filter(a => !($('#tSkipK').checked && IV.state(a.id) === 'y')).map(a => a.id); if ($('#tShuf').checked) shuffle(ids); begin(ids); }
    else if (t === 'reveal') reveal();
    else if (t === 'skip') next();
    else if (t === 'y' || t === 'n') answer(t);
    else if (t === 'end') end();
    else if (t === 'redo') begin(shuffle(T.last.slice()));
    else if (t === 'start') startScreen();
    else if (t === 'exit') exit();
    else if (t === 'goto'){ e.preventDefault(); const id = b.getAttribute('href').slice(1); exit(); focusQ(id); }
  });
  document.addEventListener('keydown', e => {
    if (test.hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (!T.ids.length || !$('#tPre', test)) return;
    if (!T.revealed && (e.key === ' ' || e.key === 'Enter') && e.target === document.body){ e.preventDefault(); reveal(); }
    else if (T.revealed && (e.key === '1' || e.key === 'y')) answer('y');
    else if (T.revealed && (e.key === '2' || e.key === 'n')) answer('n');
  });
  $('#testBtn').addEventListener('click', startScreen);

  function focusQ(id){
    const a = document.getElementById(id); if (!a || !list.contains(a)) return;
    if (a.hidden){ F.lv = ''; F.st = ''; F.q = ''; qIn.value = ''; $$('.tools [data-lv],.tools [data-st]').forEach(x => x.setAttribute('aria-pressed', x.dataset.lv === '' || x.dataset.st === '' ? 'true' : 'false')); apply(); }
    const d = $('details.more', a); d.open = true;
    a.scrollIntoView({block:'start'}); a.classList.remove('hit'); void a.offsetWidth; a.classList.add('hit');
  }
  function onHash(){ const h = decodeURIComponent(location.hash.slice(1)); if (h === 'test') startScreen(); else if (h) focusQ(h); }
  window.addEventListener('hashchange', onHash);
  window.addEventListener('storage', e => { if (e.key === KEY){ reload(); paintMarks(); if (F.st) apply(); } });
  window.addEventListener('pageshow', e => { if (e.persisted){ reload(); paintMarks(); apply(); } });
  paintMarks(); apply(); onHash();
};

/* ================= index ================= */
IV.index = function(topics){
  addTheme();
  const total = topics.reduce((s, t) => s + t.n, 0);
  function paint(){
    let allK = 0;
    $$('#topics .tc').forEach(li => {
      const slug = li.dataset.slug, n = +li.dataset.total;
      let k = 0, u = 0; Object.keys(S.k).forEach(id => { if (id.indexOf(slug + '-') === 0){ if (S.k[id] === 'y') k++; else if (S.k[id] === 'n') u++; } });
      k = Math.min(k, n); allK += k;
      const pct = n ? Math.round(k / n * 100) : 0;
      setBar($('.bar', li), pct);
      li.classList.toggle('full', k === n);
      $('.st', li).textContent = k === n ? 'خلّصته ✓ عارف كل الأسئلة' : (k || u ? 'عارف ' + iso(String(k)) + ' من ' + iso(String(n)) + (u ? ' · تراجع ' + iso(String(u)) : '') : 'لسه مبدأتش');
    });
    const pct = total ? Math.round(allK / total * 100) : 0;
    setBar($('.allp .bar'), pct);
    $('#allKnown').innerHTML = `<b>تقدّمك:</b> عارف ${iso(String(allK)) + ' من ' + iso(String(total))} سؤال (${iso(pct + '%')})`;
  }
  paint();
  window.addEventListener('storage', e => { if (e.key === KEY){ reload(); paint(); } });
  window.addEventListener('pageshow', e => { if (e.persisted){ reload(); paint(); } });

  /* ---------- global search: reads every topic page once ---------- */
  const gq = $('#gq'), gres = $('#gres'), gcnt = $('#gcnt');
  let DB = null, loading = null, lv = '';
  function loadAll(){
    if (DB) return Promise.resolve(DB);
    if (loading) return loading;
    gcnt.textContent = 'بيحمّل الأسئلة…';
    const dp = new DOMParser();
    loading = Promise.all(topics.map(t => fetch(t.slug + '.html').then(r => { if (!r.ok) throw new Error(r.status); return r.text(); }).then(h => {
      const doc = dp.parseFromString(h, 'text/html');
      return $$('article.q', doc).map(a => ({id:a.id, slug:t.slug, topic:t.title, lv:a.dataset.lv, q:$('.qt', a).textContent.trim(), a:$('.qa p', a).textContent.trim(), head:norm($('.qt', a).textContent + ' ' + $('.qa', a).textContent), hay:norm(a.textContent)}));
    }))).then(rs => { DB = [].concat.apply([], rs); return DB; }).catch(() => { loading = null; gcnt.textContent = 'مقدرناش نحمّل الأسئلة دلوقتي. افتح القسم من تحت ودوّر جواه.'; return null; });
    return loading;
  }
  function run(){
    const q = gq.value, ts = terms(q);
    if (!ts.length){ gres.innerHTML = ''; gcnt.textContent = ''; return; }
    loadAll().then(db => {
      if (!db || gq.value !== q) return;
      let hits = db.filter(x => (!lv || x.lv === lv) && matchAll(x.hay, ts));
      hits.sort((a, b) => (matchAll(b.head, ts) ? 1 : 0) - (matchAll(a.head, ts) ? 1 : 0));
      const MAX = 40;
      gcnt.textContent = hits.length ? (hits.length > MAX ? 'لقينا ' + iso(String(hits.length)) + ' سؤال، أول ' + iso(String(MAX)) + ' تحت. زوّد كلمة عشان تضيّق البحث.' : 'لقينا ' + iso(String(hits.length)) + ' سؤال') : 'مفيش أسئلة فيها الكلام ده. جرّب كلمة تانية أو بالإنجليزي.';
      gres.innerHTML = hits.slice(0, MAX).map(x => `<li><a href="${x.slug}.html#${x.id}"><span class="rt"><span class="lv lv${x.lv}">${LV[x.lv]}</span>${esc(x.topic)}</span><span class="rq">${hl(x.q, q)}</span><span class="ra">${hl(x.a, q)}</span></a></li>`).join('');
    });
  }
  let tmr;
  gq.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(run, 150); });
  gq.addEventListener('focus', () => { loadAll(); }, {once:true});
  $$('.gsearch [data-lv]').forEach(b => b.addEventListener('click', () => { lv = b.dataset.lv; $$('.gsearch [data-lv]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); run(); }));
};
})();
