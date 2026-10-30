/* SimCoach: one clear instruction at a time for the guided simulators.
   A fixed bar at the bottom says what to do now, a pulsing ring points at the
   control to touch, and the bar turns green when the step is done.
   Usage: SimCoach.init({get:()=>({k,say,tgt,ok,step})|null, scope:'.bench'})
     k    unique key of the current instruction (change = new instruction)
     say  short html line
     tgt  element or selector to point at (optional)
     ok   true when this is a "well done, go next" line
     step key of the current exercise step; a new step never auto-scrolls */
(function(){
 if(window.SimCoach)return;
 const AR=(document.documentElement.lang||'ar').slice(0,2)!=='en';
 const T=AR?{show:'وريني',nope:'مش ده. المطلوب اللي عليه الدايرة البرتقاني',done:'تمام ✓'}:{show:'Show me',nope:'Not that one. Use the control with the orange ring',done:'Done ✓'};
 const css=`
.sc-bar{cursor:pointer;position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:900;width:min(640px,calc(100% - 20px));display:flex;align-items:center;gap:10px;padding:10px 10px 10px 14px;border-radius:14px;background:#1c2430;color:#fff;box-shadow:0 8px 28px rgba(0,0,0,.35);font:600 15px/1.45 inherit;transition:background .25s,transform .25s}
.sc-bar[hidden]{display:none}
.sc-bar .sc-ico{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#f0a03c;color:#1c2430;font-size:16px}
.sc-bar .sc-say{flex:1;min-width:0}
.sc-bar .sc-say b{color:#ffd28a}
.sc-bar .sc-show{flex:none;min-height:40px;padding:0 14px;border-radius:10px;border:0;background:#f0a03c;color:#1c2430;font:700 14px inherit;cursor:pointer}
.sc-bar .sc-show[hidden]{display:none}
.sc-bar.ok{background:#17703f}
.sc-bar.ok .sc-ico{background:#fff;color:#17703f}
.sc-bar.ok .sc-say b{color:#c8ffd9}
.sc-bar.shake{animation:scShake .45s}
.sc-bar .sc-sub{display:block;font-weight:500;font-size:13px;opacity:.85}
@keyframes scShake{20%,60%{transform:translateX(calc(-50% - 7px))}40%,80%{transform:translateX(calc(-50% + 7px))}}
.sc-ring{position:fixed;z-index:899;pointer-events:none;border:3px solid #f0a03c;border-radius:14px;box-shadow:0 0 0 4px rgba(240,160,60,.25);animation:scPulse 1.2s ease-in-out infinite;transition:left .2s,top .2s,width .2s,height .2s}
.sc-ring[hidden]{display:none}
.sc-ring::after{content:"👆";position:absolute;left:50%;bottom:-34px;transform:translateX(-50%);font-size:26px;animation:scTap 1.2s ease-in-out infinite}
.sc-ring.up::after{content:"👇";bottom:auto;top:-36px}
@keyframes scPulse{50%{box-shadow:0 0 0 10px rgba(240,160,60,0)}}
@keyframes scTap{50%{transform:translate(-50%,-6px)}}
.sc-ring.up::after{animation-name:scTapUp}
@keyframes scTapUp{50%{transform:translate(-50%,6px)}}
body.sc-on{padding-bottom:110px}
body.sc-focus .station .dev:not(.sc-keep){opacity:.42;transition:opacity .2s}
@media (prefers-reduced-motion:reduce){.sc-ring,.sc-ring::after,.sc-bar.shake{animation:none}}`;
 const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
 const bar=document.createElement('div');bar.className='sc-bar';bar.hidden=true;bar.setAttribute('role','status');bar.setAttribute('aria-live','polite');
 bar.innerHTML='<span class="sc-ico">👉</span><span class="sc-say"></span><button type="button" class="sc-show">'+T.show+'</button>';
 const ring=document.createElement('div');ring.className='sc-ring';ring.hidden=true;
 document.body.append(ring,bar);
 const sayEl=bar.querySelector('.sc-say'),showBtn=bar.querySelector('.sc-show'),ico=bar.querySelector('.sc-ico');
 let cfg=null,cur=null,tgt=null,lastStep=null,userAt=0,keep=null;
 const el=t=>!t?null:typeof t==='string'?document.querySelector(t):t;
 const visible=e=>{if(!e||!e.isConnected)return false;const r=e.getBoundingClientRect();return r.width>0||r.height>0;};
 function inView(e){const r=e.getBoundingClientRect(),bh=bar.offsetHeight+24;return r.top>=60&&r.bottom<=innerHeight-bh;}
 function scrollTo(e){if(!e)return;const r=e.getBoundingClientRect(),bh=bar.offsetHeight+24,mid=(innerHeight-bh)/2;
  scrollBy({top:r.top+r.height/2-mid,behavior:'smooth'});}
 function place(){
  if(!tgt||!visible(tgt)){ring.hidden=true;return;}
  const r=tgt.getBoundingClientRect(),p=6;ring.hidden=false;
  ring.style.left=(r.left-p)+'px';ring.style.top=(r.top-p)+'px';ring.style.width=(r.width+2*p)+'px';ring.style.height=(r.height+2*p)+'px';
  ring.classList.toggle('up',r.bottom+44>innerHeight-bar.offsetHeight-16);
 }
 function loop(){if(cur)place();requestAnimationFrame(loop);}
 function setKeep(e){
  if(keep)keep.classList.remove('sc-keep');keep=null;
  const dev=e&&e.closest&&e.closest('.station .dev');
  if(dev){dev.classList.add('sc-keep');keep=dev;}
  document.body.classList.toggle('sc-focus',!!dev);
 }
 function tick(){
  if(!cfg)return;let c=null;try{c=cfg.get();}catch(err){console.error(err);}
  if(!c){if(cur){cur=null;tgt=null;bar.hidden=true;ring.hidden=true;setKeep(null);document.body.classList.remove('sc-on');}return;}
  const t=el(c.tgt);
  if(cur&&cur.k===c.k){if(t!==tgt){tgt=t;setKeep(t);}return;}
  const prev=cur;cur=c;tgt=t;
  bar.hidden=false;document.body.classList.add('sc-on');
  sayEl.innerHTML=c.say;bar.classList.toggle('ok',!!c.ok);ico.textContent=c.ok?'✓':'👉';
  showBtn.hidden=!t;setKeep(t);
  const sameStep=prev&&c.step!=null&&c.step===lastStep;lastStep=c.step;
  if(t&&sameStep&&Date.now()-userAt<2500&&!inView(t))setTimeout(()=>{if(tgt===t&&!inView(t))scrollTo(t);},c.ok?450:250);
 }
 bar.addEventListener('click',()=>{if(tgt){scrollTo(tgt);ring.style.animation='none';void ring.offsetWidth;ring.style.animation='';}});
 addEventListener('pointerdown',()=>{userAt=Date.now();},true);
 addEventListener('keydown',()=>{userAt=Date.now();},true);
 document.addEventListener('click',e=>{
  if(!cur||!tgt||cur.ok||!cfg||!cfg.scope)return;
  const sc=e.target.closest(cfg.scope);if(!sc||!sc.contains(tgt))return;
  const hit=e.target.closest('button,[data-k],.clk,[role=button]');if(!hit||hit.contains(tgt)||tgt.contains(hit))return;
  bar.classList.remove('shake');void bar.offsetWidth;bar.classList.add('shake');
  const k=cur.k;sayEl.innerHTML=cur.say+'<span class="sc-sub">'+T.nope+'</span>';
  setTimeout(()=>{if(cur&&cur.k===k)sayEl.innerHTML=cur.say;},2200);
 },true);
 window.SimCoach={init(o){cfg=o;setInterval(tick,200);tick();requestAnimationFrame(loop);},refresh(){if(cur)cur.k='';tick();},T};
})();
