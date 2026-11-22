/* طبقة التعلّم: الدروس والمحاكيات والاختبارات والحفظ والتقرير — تعمل مع العالم ثلاثي الأبعاد أو بدونه */
(function(){
'use strict';
const C=window.CONTENT, KEY='madinat-alqawaid-v1', TEACHER_CODE='0000', PASS=0.8;
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LES={},CH={};C.chapters.forEach((c,ci)=>{c.idx=ci;CH[c.id]=c;c.lessons.forEach(l=>{l.ch=c.id;LES[l.id]=l;});});
const today=()=>new Date().toISOString().slice(0,10);

/* ---------- الحالة ---------- */
const def={name:'',xp:0,streak:0,best:0,done:{},mastered:{},pre:{},quiz:{},attempts:{},wrong:{},leit:{},time:{},font:0,mute:false,started:false,teacher:false};
let S=Object.assign({},def);
try{const raw=localStorage.getItem(KEY);if(raw)S=Object.assign({},def,JSON.parse(raw));}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function unlocked(chId){if(S.teacher)return true;const c=CH[chId];if(c.idx===0)return true;const prev=C.chapters[c.idx-1];return (S.quiz[prev.id]||0)>=PASS;}
function chDone(chId){return (S.quiz[chId]||0)>=PASS;}
function allDone(){return C.chapters.every(c=>chDone(c.id));}
function rankIdx(){return Math.min(C.ranks.length-1,Math.floor(S.xp/220));}

/* ---------- الصوت ---------- */
let AC=null;
function tone(freqs,dur=0.09,type='sine',vol=0.08){if(S.mute)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const t0=AC.currentTime;
 freqs.forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t0+i*dur);g.gain.linearRampToValueAtTime(vol,t0+i*dur+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t0+i*dur+dur*1.6);o.connect(g).connect(AC.destination);o.start(t0+i*dur);o.stop(t0+i*dur+dur*1.8);});}catch(e){}}
const SFX={ok:()=>tone([660,880],.08,'triangle'),no:()=>tone([220,180],.12,'sawtooth',.05),open:()=>tone([440,550,660],.06),win:()=>tone([523,659,784,1046],.12,'triangle'),click:()=>tone([500],.04)};

/* ---------- مؤثرات ---------- */
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),1900);}
function confetti(n=60){if(reduce)return;const fx=$('#fx');const cols=['#c9972f','#1b7f7a','#9c3d3d','#2a7a4f','#f8efd9'];for(let i=0;i<n;i++){const d=document.createElement('i');d.className='conf';d.style.left=Math.random()*100+'vw';d.style.background=cols[i%5];d.style.animationDelay=Math.random()*.4+'s';fx.appendChild(d);setTimeout(()=>d.remove(),2000);}}
function xpFly(n,el){if(reduce)return;const r=el?el.getBoundingClientRect():{left:innerWidth/2,top:innerHeight/2};const d=document.createElement('div');d.className='xpfly';d.textContent='+'+n;d.style.left=r.left+20+'px';d.style.top=r.top+'px';$('#fx').appendChild(d);setTimeout(()=>d.remove(),1000);}
function addXP(n,el){const r0=rankIdx();S.xp+=n;save();hud();xpFly(n,el);if(rankIdx()>r0){SFX.win();toast('🎖️ رتبة جديدة: '+C.ranks[rankIdx()]);confetti(40);}}

/* ---------- HUD ---------- */
function hud(){const r=rankIdx();$('#rankName').textContent=C.ranks[r];const base=r*220;const pct=r===C.ranks.length-1?100:((S.xp-base)/220*100);
 $('#xpFill').style.width=Math.max(3,pct)+'%';$('#xpText').textContent=S.xp+' خبرة · '+Object.keys(S.done).length+'/'+Object.keys(LES).length+' درسًا';
 const st=$('#streak');st.textContent='🔥 '+S.streak;st.classList.toggle('hot',S.streak>=3);
 const due=dueReview().length;const rc=$('#reviewCount');rc.hidden=!due;rc.textContent=due;
 $('#btnMute').textContent=S.mute?'🔇':'🔊';document.documentElement.style.setProperty('--fs',(16.5+S.font*1.5)+'px');
 objective();if(window.World&&World.refresh)World.refresh();}
function objective(){const o=$('#objective');if(!S.started){o.hidden=true;return;}
 const c=C.chapters.find(c=>unlocked(c.id)&&!chDone(c.id));if(!c){o.hidden=false;o.textContent='🏆 أتممت الأحياء كلها! افتح التقرير لاستلام الشهادة.';return;}
 const l=c.lessons.find(l=>!S.done[l.id]);o.hidden=false;o.innerHTML=l?`🎯 الهدف: حيّ <b>${esc(c.title)}</b> · ادخل مبنى «${esc(l.title)}»`:`🎯 الهدف: اجتز <b>تحدي حيّ ${esc(c.title)}</b> (80%)`;}

/* ---------- اللوح ---------- */
let panelOnClose=null,panelT0=0,panelCh=null;
function openPanel(title,html,opts={}){trackTime();$('#panelTitle').textContent=title;const b=$('#panelBody');b.innerHTML=html;b.scrollTop=0;$('#panel').classList.add('show');panelOnClose=opts.onClose||null;panelCh=opts.ch||null;panelT0=Date.now();
 if(window.World)World.pause(true);setTimeout(()=>{const f=b.querySelector('button,input,select');($('#panelClose')).focus();},50);return b;}
function trackTime(){if(panelCh&&panelT0){S.time[panelCh]=(S.time[panelCh]||0)+Math.round((Date.now()-panelT0)/1000);save();}panelT0=0;}
function closePanel(){trackTime();$('#panel').classList.remove('show');panelCh=null;if(window.World)World.pause(false);const f=panelOnClose;panelOnClose=null;if(f)f();hud();}
$('#panelClose').onclick=closePanel;
$('#panel').addEventListener('click',e=>{if(e.target.id==='panel')closePanel();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#panel').classList.contains('show'))closePanel();
 if((e.key==='m'||e.key==='M'||e.key==='ة')&&S.started&&!$('#panel').classList.contains('show')&&document.activeElement.tagName!=='INPUT')showMap();});

/* ---------- عرض الكتل ---------- */
function blocksHTML(bl){return bl.map(b=>{switch(b.type){
 case 'p':return `<p class="blk-p">${esc(b.text)}</p>`;
 case 'rule':return `<div class="blk-rule"><span class="lbl">${esc(b.label)}</span>${esc(b.text)}</div>`;
 case 'note':return `<div class="blk-note"><span class="lbl">💡 إضافة توضيحية (ليست من نص المذكرة):</span> ${esc(b.text)}</div>`;
 case 'example':return `<div class="blk-ex"><b>مثال:</b> ${esc(b.text)}<div class="sol">← ${esc(b.solution)}</div></div>`;
 case 'list':return `<ul class="blk-list">${b.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`;
 case 'table':return `<div class="tbl-wrap"><table class="blk"><thead><tr>${b.head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 default:return '';}}).join('');}

/* ---------- سؤال واحد ---------- */
function shuffleIdx(n){const a=[...Array(n).keys()];for(let i=n-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function qKey(q){return q._key;}
C.chapters.forEach(c=>{c.lessons.forEach(l=>l.quick._key=l.id+':q');c.quiz.forEach((q,i)=>{q._key=c.id+':'+i;});});
const QBYKEY={};C.chapters.forEach(c=>{c.lessons.forEach(l=>{QBYKEY[l.quick._key]=Object.assign({lesson:l.id},l.quick);});c.quiz.forEach(q=>QBYKEY[q._key]=q);});
// يرسم سؤالًا في الحاوية؛ cb(correct)
function renderQ(host,q,opt={}){const ord=shuffleIdx(q.options.length);const box=document.createElement('div');box.className='qbox';
 box.innerHTML=`<div class="qhead"><span>${esc(opt.label||'سؤال')}</span><span>${q.bloom?esc(q.bloom)+' · ':''}ص ${q.page}</span></div><h3>${esc(q.q)}</h3><div class="opts">${ord.map((oi,k)=>`<button class="opt" data-i="${oi}">${'أبجد'[k]||''}) ${esc(q.options[oi])}</button>`).join('')}</div><div class="fbh"></div>`;
 host.appendChild(box);
 box.querySelectorAll('.opt').forEach(btn=>btn.onclick=()=>{const i=+btn.dataset.i,ok=i===q.answer;box.querySelectorAll('.opt').forEach(b=>{b.disabled=true;if(+b.dataset.i===q.answer)b.classList.add('right');});
  if(!ok)btn.classList.add('wrong');(ok?SFX.ok:SFX.no)();
  if(ok){S.streak++;S.best=Math.max(S.best,S.streak);}else{S.streak=0;S.wrong[q.lesson||opt.lesson]=(S.wrong[q.lesson||opt.lesson]||0)+1;}
  leitner(q._key,ok);save();
  const lesson=q.lesson||opt.lesson;const fb=document.createElement('div');fb.className='fb '+(ok?'ok':'no');
  fb.innerHTML=(ok?'<b>✓ صحيح.</b> ':'<b>✗ ليست هذه.</b> '+(q.why&&q.why[i]?`<span class="why">سبب الخطأ: ${esc(q.why[i])}.</span> `:''))+esc(q.explain||'')+` <span class="page-ref">(المذكرة ص ${q.page})</span>`+
   `<div class="acts">${!ok&&lesson&&!opt.inLesson?`<button class="sec" data-back="${lesson}">↩ ارجع إلى الدرس</button>`:''}${opt.next?`<button class="pri nx">${esc(opt.nextLabel||'التالي')}</button>`:''}</div>`;
  box.querySelector('.fbh').appendChild(fb);
  const bb=fb.querySelector('[data-back]');if(bb)bb.onclick=()=>openLesson(bb.dataset.back);
  const nx=fb.querySelector('.nx');if(nx){nx.onclick=()=>opt.next(ok);nx.focus();}
  if(ok){const mult=1+Math.min(4,Math.floor(S.streak/3));addXP((opt.xp||10)*mult,btn);if(mult>1)toast('🔥 سلسلة '+S.streak+'! الخبرة ×'+mult);}
  hud();if(opt.cb)opt.cb(ok);});
 return box;}

/* ---------- لايتنر ---------- */
function leitner(key,ok){const L=S.leit[key];const d=today();
 if(!ok){S.leit[key]={box:1,days:[],last:d};return;}
 if(L){if(!L.days.includes(d))L.days.push(d);L.box=Math.min(3,L.box+1);L.last=d;if(L.days.length>=2)delete S.leit[key];}}
function dueReview(){const d=today();return Object.entries(S.leit).filter(([k,L])=>QBYKEY[k]&&(L.box===1||L.last!==d)).map(([k])=>k);}

/* ---------- الدرس ---------- */
function openLesson(id){const l=LES[id],c=CH[l.ch];if(!unlocked(c.id)){toast('🔒 اجتز تحدي الحيّ السابق أولًا');return;}
 SFX.open();
 const b=openPanel(l.title,`<div class="meta"><span class="chip t">حيّ ${esc(c.title)}</span><span class="chip">المذكرة ص ${l.page}</span>${S.mastered[id]?'<span class="chip">★ متقن مبدئيًا</span>':''}</div>${blocksHTML(l.blocks)}<div id="wHost"></div><div id="qHost"></div>`,{ch:c.id});
 if(l.widget)renderWidget(b.querySelector('#wHost'),l.widget);
 const qh=b.querySelector('#qHost');
 renderQ(qh,Object.assign({lesson:id},l.quick),{label:'سؤال الدرس السريع',inLesson:true,xp:15,cb:ok=>{if(!S.done[id]){S.done[id]=true;save();addXP(20);if(window.World)World.celebrate(id);}
   const nxt=nextAfter(id);const d=document.createElement('div');d.className='row-btns';
   d.innerHTML=nxt?`<button class="pri" id="goNext">${nxt.type==='lesson'?'الدرس التالي: '+esc(LES[nxt.id].title):'⚔️ تحدي حيّ '+esc(CH[nxt.id].title)}</button><button class="sec" id="goCity">العودة إلى المدينة</button>`:`<button class="sec" id="goCity">العودة إلى المدينة</button>`;
   qh.appendChild(d);const gn=d.querySelector('#goNext');if(gn)gn.onclick=()=>nxt.type==='lesson'?openLesson(nxt.id):openQuiz(nxt.id);d.querySelector('#goCity').onclick=closePanel;}});}
function nextAfter(id){const l=LES[id],c=CH[l.ch];const i=c.lessons.indexOf(l);const n=c.lessons.slice(i+1).find(x=>!S.done[x.id])||c.lessons.find(x=>!S.done[x.id]);if(n)return{type:'lesson',id:n.id};if(!chDone(c.id))return{type:'quiz',id:c.id};return null;}

/* ---------- التشخيص ---------- */
function maybePretest(chId,then){const c=CH[chId];if(S.pre[chId]||c.lessons.every(l=>S.done[l.id])){then();return;}
 const b=openPanel('بوابة حيّ '+c.title,`<p class="blk-p">مرحبًا بك في حيّ <b>${esc(c.title)}</b>. فيه ${c.lessons.length} مبانٍ (دروس) وتحدٍّ في آخره.</p><div class="blk-note"><span class="lbl">اختبار تشخيصي اختياري:</span> ${Math.min(3,c.lessons.length)} أسئلة قصيرة. الدرس الذي تجيب عن سؤاله صحيحًا يُوسم «متقن مبدئيًا ★» ويمكنك تجاوزه، ويبقى مفتوحًا.</div><div class="row-btns"><button class="pri" id="preGo">ابدأ التشخيص</button><button class="sec" id="preSkip">تخطَّ وادخل الحيّ</button></div>`,{ch:chId});
 b.querySelector('#preSkip').onclick=()=>{S.pre[chId]=true;save();closePanel();then();};
 b.querySelector('#preGo').onclick=()=>{const ls=c.lessons.slice().sort(()=>Math.random()-.5).slice(0,3);let k=0,good=0;
  const step=()=>{b.innerHTML='';if(k>=ls.length){S.pre[chId]=true;save();b.innerHTML=`<p class="score">${good} / ${ls.length}</p><p class="center">${good?'وُسمت الدروس التي أتقنتها بنجمة ★ في الخريطة.':'ابدأ بالدروس بالترتيب.'}</p><div class="row-btns"><button class="pri" id="preDone">ادخل الحيّ</button></div>`;b.querySelector('#preDone').onclick=()=>{closePanel();then();};return;}
   const l=ls[k];b.insertAdjacentHTML('beforeend',`<div class="progress-dots">${ls.map((_,j)=>`<i class="${j<k?'ok':j===k?'cur':''}"></i>`).join('')}</div>`);
   renderQ(b,Object.assign({lesson:l.id},l.quick),{label:'تشخيص · '+l.title,inLesson:true,xp:5,next:()=>{k++;step();},nextLabel:'التالي',cb:ok=>{if(ok){good++;S.mastered[l.id]=true;save();}}});};
  step();};}

/* ---------- تحدي الحيّ ---------- */
function openQuiz(chId){const c=CH[chId];if(!unlocked(chId)){toast('🔒 هذا الحيّ مقفل');return;}
 const qs=c.quiz.map(q=>Object.assign({},q,{_key:q._key})).sort(()=>Math.random()-.5);let k=0,good=0,res=[];
 const b=openPanel('⚔️ تحدي حيّ '+c.title,'',{ch:chId});
 const step=()=>{b.innerHTML='';if(k>=qs.length){finish();return;}
  b.insertAdjacentHTML('beforeend',`<div class="progress-dots">${qs.map((_,j)=>`<i class="${j<k?(res[j]?'ok':'no'):j===k?'cur':''}"></i>`).join('')}</div>`);
  renderQ(b,qs[k],{label:`سؤال ${k+1} من ${qs.length}`,xp:12,next:()=>{k++;step();},nextLabel:k===qs.length-1?'النتيجة':'التالي',cb:ok=>{res[k]=ok;if(ok)good++;}});};
 const finish=()=>{const sc=good/qs.length,pct=Math.round(sc*100);S.attempts[chId]=(S.attempts[chId]||0)+1;const prevPass=chDone(chId);S.quiz[chId]=Math.max(S.quiz[chId]||0,sc);save();
  const pass=sc>=PASS;if(pass){SFX.win();confetti();if(!prevPass){addXP(80);if(window.World)World.unlockFx(chId);}}else SFX.no();
  const weak=[...new Set(qs.filter((q,j)=>!res[j]).map(q=>q.lesson))];const nx=C.chapters[c.idx+1];
  b.innerHTML=`<p class="score">${pct}%</p><p class="center"><b>${pass?(nx?'🎉 نجحت! فُتح حيّ «'+esc(nx.title)+'».':'🏆 أتممت التحدي الأخير!'):'تحتاج 80% لفتح الحيّ التالي. أعد المحاولة بأسئلة مخلوطة.'}</b></p>`+
   (weak.length?`<p class="blk-p">راجع هذه الدروس:</p><div class="row-btns">${weak.map(id=>`<button class="sec" data-l="${id}">${esc(LES[id].title)}</button>`).join('')}</div>`:'')+
   `<div class="row-btns">${pass?'':'<button class="pri" id="again">أعد التحدي</button>'}${pass&&allDone()?'<button class="pri" id="cert">🎓 استلم الشهادة</button>':''}<button class="sec" id="back">العودة إلى المدينة</button></div>`;
  b.querySelectorAll('[data-l]').forEach(x=>x.onclick=()=>openLesson(x.dataset.l));
  const a=b.querySelector('#again');if(a)a.onclick=()=>openQuiz(chId);const ce=b.querySelector('#cert');if(ce)ce.onclick=showCert;b.querySelector('#back').onclick=closePanel;hud();};
 step();}

/* ---------- المراجعة الذكية ---------- */
function openReview(){const keys=dueReview();if(!keys.length){openPanel('🔁 مراجعة اليوم','<p class="center blk-p">لا أسئلة مستحقة الآن. كل سؤال تخطئ فيه يدخل صندوق المراجعة، ويخرج منه بعد إجابتين صحيحتين في يومين مختلفين.</p>');return;}
 let k=0;const b=openPanel('🔁 مراجعة اليوم','');const step=()=>{b.innerHTML='';if(k>=keys.length){b.innerHTML='<p class="score">✓</p><p class="center">انتهت مراجعة اليوم. عد غدًا لتثبيتها.</p>';hud();return;}
  const q=QBYKEY[keys[k]];b.insertAdjacentHTML('beforeend',`<p class="page-ref">صندوق ${S.leit[keys[k]]?S.leit[keys[k]].box:1} من 3 · ${k+1} من ${keys.length}</p>`);
  renderQ(b,q,{label:'مراجعة · '+(LES[q.lesson]?LES[q.lesson].title:''),xp:8,next:()=>{k++;step();}});};step();}

/* ---------- الخريطة ---------- */
function showMap(){SFX.click();const html=`<p class="blk-p">كل الدروس متاحة من هنا دون مشي. ✓ = منجز، ★ = متقن في التشخيص.</p><div class="map-grid">${C.chapters.map(c=>{const u=unlocked(c.id),best=S.quiz[c.id];
  return `<div class="dist ${u?'':'locked'}"><h3><i style="background:${c.color}"></i>${u?'':'🔒 '}${c.idx+1}. ${esc(c.title)}</h3>${c.lessons.map(l=>`<button class="les ${S.done[l.id]?'done':''} ${S.mastered[l.id]?'mast':''}" data-l="${l.id}" ${u?'':'disabled'}>${esc(l.title)}</button>`).join('')}
  <button class="${chDone(c.id)?'sec':'pri'} qz" data-q="${c.id}" ${u?'':'disabled'}>⚔️ تحدي الحيّ</button><div class="best">${best!=null?'أفضل نتيجة: '+Math.round(best*100)+'%':'لم يُجتز بعد'}${u&&window.World&&World.ok?` · <button class="ghost" data-go="${c.id}">انتقل إليه في المدينة</button>`:''}</div></div>`;}).join('')}</div>
  <div class="row-btns"><button class="sec" id="mapSum">📜 الخلاصة الختامية</button>${allDone()?'<button class="pri" id="mapCert">🎓 الشهادة</button>':''}</div>`;
 const b=openPanel('🗺️ خريطة المنهج',html);
 b.querySelectorAll('[data-l]').forEach(x=>x.onclick=()=>{const l=LES[x.dataset.l];maybePretest(l.ch,()=>openLesson(l.id));});
 b.querySelectorAll('[data-q]').forEach(x=>x.onclick=()=>openQuiz(x.dataset.q));
 b.querySelectorAll('[data-go]').forEach(x=>x.onclick=()=>{closePanel();World.goTo(x.dataset.go);});
 b.querySelector('#mapSum').onclick=showSummary;const mc=b.querySelector('#mapCert');if(mc)mc.onclick=showCert;}
function showSummary(){openPanel('📜 الخلاصة الختامية',`<ol class="blk-list">${C.summary.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`);}

/* ---------- التقرير والشهادة ---------- */
function hash(s){let h=2166136261;for(const ch of s){h^=ch.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36).toUpperCase().slice(0,6);}
function avgScore(){const v=C.chapters.map(c=>S.quiz[c.id]||0);return Math.round(v.reduce((a,b)=>a+b,0)/v.length*100);}
function certCode(name,score,date){return hash(name+'|'+score+'|'+date);}
function weakest(){return Object.entries(S.wrong).filter(([k])=>LES[k]).sort((a,b)=>b[1]-a[1]).slice(0,3);}
function fmtT(s){s=s||0;return s<60?s+' ث':Math.round(s/60)+' د';}
function reportText(){return `تقرير «مدينة القواعد» - ${S.name||'طالب'}\nالدروس المنجزة: ${Object.keys(S.done).length}/${Object.keys(LES).length}\nالخبرة: ${S.xp} (${C.ranks[rankIdx()]})\n`+C.chapters.map(c=>`${c.idx+1}. ${c.title}: ${S.quiz[c.id]!=null?Math.round(S.quiz[c.id]*100)+'%':'—'} · الوقت ${fmtT(S.time[c.id])}`).join('\n')+`\nأضعف الدروس: ${weakest().map(([k,n])=>LES[k].title+' ('+n+' أخطاء)').join('، ')||'لا يوجد'}`;}
function showReport(){const w=weakest();const b=openPanel('📊 تقريري',`<div class="stat"><div><b>${Object.keys(S.done).length}/${Object.keys(LES).length}</b>درسًا</div><div><b>${S.xp}</b>خبرة</div><div><b>${C.chapters.filter(c=>chDone(c.id)).length}/8</b>أحياء مجتازة</div><div><b>${S.best}</b>أطول سلسلة</div></div>
 <div class="tbl-wrap"><table class="blk"><thead><tr><th>الحيّ</th><th>أفضل نتيجة</th><th>المحاولات</th><th>الوقت</th></tr></thead><tbody>${C.chapters.map(c=>`<tr><td>${esc(c.title)}</td><td>${S.quiz[c.id]!=null?Math.round(S.quiz[c.id]*100)+'%':'—'}</td><td>${S.attempts[c.id]||0}</td><td>${fmtT(S.time[c.id])}</td></tr>`).join('')}</tbody></table></div>
 <p class="blk-p"><b>أضعف ثلاثة دروس:</b> ${w.length?w.map(([k,n])=>`<button class="ghost" data-l="${k}">${esc(LES[k].title)} (${n})</button>`).join(' · '):'لا أخطاء مسجّلة بعد.'}</p>
 <div class="row-btns"><button class="sec" id="rpCopy">📋 انسخ التقرير نصًا</button><button class="sec" id="rpPrint">🖨️ اطبع</button>${allDone()?'<button class="pri" id="rpCert">🎓 الشهادة</button>':''}<button class="danger" id="rpReset">مسح التقدم</button></div><div id="rpConf"></div>`);
 b.querySelectorAll('[data-l]').forEach(x=>x.onclick=()=>openLesson(x.dataset.l));
 b.querySelector('#rpCopy').onclick=async()=>{try{await navigator.clipboard.writeText(reportText());toast('نُسخ التقرير، أرسله لمعلمك');}catch(e){b.querySelector('#rpConf').innerHTML=`<textarea style="width:100%;height:140px;font-family:inherit" readonly>${esc(reportText())}</textarea>`;}};
 b.querySelector('#rpPrint').onclick=()=>printHTML(`<h1>تقرير مدينة القواعد</h1><pre style="font-family:inherit;white-space:pre-wrap;font-size:14pt">${esc(reportText())}</pre>`);
 const rc=b.querySelector('#rpCert');if(rc)rc.onclick=showCert;
 b.querySelector('#rpReset').onclick=()=>{b.querySelector('#rpConf').innerHTML='<div class="blk-note">سيُمسح تقدمك كله. متأكد؟ <button class="danger" id="rsY">نعم امسح</button> <button class="sec" id="rsN">إلغاء</button></div>';
  b.querySelector('#rsY').onclick=()=>{const n=S.name;S=Object.assign({},def,{name:n,started:true});save();closePanel();toast('بدأت من جديد');hud();};b.querySelector('#rsN').onclick=()=>b.querySelector('#rpConf').innerHTML='';};}
function printHTML(h){$('#printArea').innerHTML=h;try{window.print();}catch(e){toast('الطباعة غير متاحة هنا، استعمل النسخ');}}
function showCert(){if(!allDone()&&!S.teacher){toast('اجتز الأحياء الثمانية أولًا');return;}const sc=avgScore(),d=today(),code=certCode(S.name||'طالب',sc,d);
 const certH=`<div class="cert"><p>شهادة إتمام</p><h3>مدينة القواعد</h3><p>قواعد الفقه المالي ومقاصده</p><p>تشهد بأن</p><div class="nm">${esc(S.name||'طالب العلم')}</div><p>أتمّ أحياء المدينة الثمانية بمتوسط <b>${sc}%</b> ورتبة <b>${esc(C.ranks[rankIdx()])}</b></p><p>التاريخ: ${d}</p><p>رمز التحقق: <span class="code">${code}</span></p></div>`;
 const b=openPanel('🎓 الشهادة',certH+`<div class="row-btns"><button class="pri" id="cPrint">🖨️ اطبع الشهادة</button><button class="sec" id="cRep">📊 التقرير</button><button class="sec" id="cSum">📜 الخلاصة</button></div>`);
 SFX.win();confetti(90);b.querySelector('#cPrint').onclick=()=>printHTML(certH);b.querySelector('#cRep').onclick=showReport;b.querySelector('#cSum').onclick=showSummary;}

/* ---------- وضع المعلم ---------- */
function teacherGate(){const b=openPanel('👩‍🏫 وضع المعلم',`<p class="blk-p">أدخل رمز المعلم.</p><input id="tCode" type="password" inputmode="numeric" style="font-size:20px;padding:10px;width:160px;border-radius:10px;border:1.5px solid var(--line)"> <button class="pri" id="tGo">دخول</button><p id="tMsg" class="tiny"></p>`);
 const go=()=>{if(b.querySelector('#tCode').value===TEACHER_CODE){S.teacher=true;save();teacherView();}else b.querySelector('#tMsg').textContent='رمز غير صحيح';};b.querySelector('#tGo').onclick=go;b.querySelector('#tCode').onkeydown=e=>{if(e.key==='Enter')go();};}
function teacherView(){const b=openPanel('👩‍🏫 وضع المعلم: مفتاح الإجابات',`<p class="blk-p">كل الأحياء مفتوحة الآن. <button class="sec" id="tOff">إنهاء وضع المعلم</button></p>
 <div class="blk-rule"><span class="lbl">تحقق من شهادة</span><input id="vName" placeholder="الاسم" style="padding:7px;border-radius:8px;border:1px solid var(--line)"> <input id="vScore" placeholder="المتوسط %" style="width:90px;padding:7px;border-radius:8px;border:1px solid var(--line)"> <input id="vDate" placeholder="YYYY-MM-DD" style="width:130px;padding:7px;border-radius:8px;border:1px solid var(--line)" dir="ltr"> <input id="vCode" placeholder="الرمز" style="width:100px;padding:7px;border-radius:8px;border:1px solid var(--line)" dir="ltr"> <button class="pri" id="vGo" style="padding:7px 12px;min-height:0">تحقق</button> <b id="vRes"></b></div>
 ${C.chapters.map(c=>`<h3 style="color:var(--teal);margin-top:12px">${c.idx+1}. ${esc(c.title)}</h3><ol class="blk-list">${c.lessons.map(l=>`<li><b>${esc(l.title)}</b> (ص ${l.page}): ${esc(l.quick.q)} ← <span style="color:var(--ok)">${esc(l.quick.options[l.quick.answer])}</span></li>`).join('')}${c.quiz.map(q=>`<li>⚔️ ${esc(q.q)} ← <span style="color:var(--ok)">${esc(q.options[q.answer])}</span> (ص ${q.page})</li>`).join('')}</ol>`).join('')}`);
 b.querySelector('#tOff').onclick=()=>{S.teacher=false;save();closePanel();if(location.hash==='#teacher')history.replaceState(null,'',location.pathname);};
 b.querySelector('#vGo').onclick=()=>{const ok=certCode(b.querySelector('#vName').value.trim(),+b.querySelector('#vScore').value,b.querySelector('#vDate').value.trim())===b.querySelector('#vCode').value.trim().toUpperCase();b.querySelector('#vRes').textContent=ok?'✓ شهادة صحيحة':'✗ لا تطابق';};hud();}

/* ---------- المحاكيات ---------- */
function renderWidget(host,id){const w=C.widgets[id];if(!w)return;const box=document.createElement('div');box.className='widget';host.appendChild(box);
 const foot=()=>`<div class="wfoot"><span>المصدر: المذكرة ص ${w.page}</span><button class="wreset">↺ أعد للأصل</button></div>`;
 const build=()=>{box.innerHTML=`<h3>${esc(w.title)}</h3>${w.intro?`<p class="wi">${esc(w.intro)}</p>`:''}<div class="wb"></div>${foot()}`;box.querySelector('.wreset').onclick=build;W[w.type](box.querySelector('.wb'),w);};build();}
const W={
 sort(el,w){let sel=null,solved=0;const cards=w.cards.map((c,i)=>Object.assign({i},c)).sort(()=>Math.random()-.5);
  el.innerHTML=`<div class="pool">${cards.map(c=>`<button class="card-s" data-i="${c.i}">${esc(c.text)}</button>`).join('')}</div><div class="bins">${w.bins.map((b,j)=>`<div class="bin" data-b="${j}" tabindex="0" role="button" aria-label="${esc(b)}"><h4>${esc(b)}</h4></div>`).join('')}</div><div class="wmsg"></div>`;
  const msg=el.querySelector('.wmsg');
  const drop=(card,bin)=>{const c=w.cards[+card.dataset.i];if(c.bin===bin){card.classList.remove('sel','no');card.classList.add('ok');card.disabled=true;el.querySelector(`.bin[data-b="${bin}"]`).appendChild(card);SFX.ok();solved++;msg.textContent='✓ صحيح: «'+c.text+'» من «'+w.bins[bin]+'».';
    if(solved===w.cards.length){msg.textContent='🎉 أتممت التصنيف كله!';addXP(25,el);confetti(30);}}else{card.classList.add('no');SFX.no();msg.textContent='✗ «'+c.text+'» ليست من «'+w.bins[bin]+'». حاول مرة أخرى.';setTimeout(()=>card.classList.remove('no'),600);}sel=null;el.querySelectorAll('.card-s').forEach(x=>x.classList.remove('sel'));};
  el.querySelectorAll('.card-s').forEach(card=>{card.onclick=()=>{if(card.disabled)return;el.querySelectorAll('.card-s').forEach(x=>x.classList.remove('sel'));sel=card;card.classList.add('sel');msg.textContent='اختر الكفة المناسبة لـ«'+card.textContent+'».';};
   card.draggable=true;card.ondragstart=e=>{e.dataTransfer.setData('text','x');sel=card;};});
  el.querySelectorAll('.bin').forEach(bin=>{const b=+bin.dataset.b;bin.onclick=()=>{if(sel)drop(sel,b);};bin.onkeydown=e=>{if(e.key==='Enter'&&sel)drop(sel,b);};
   bin.ondragover=e=>{e.preventDefault();bin.classList.add('over');};bin.ondragleave=()=>bin.classList.remove('over');bin.ondrop=e=>{e.preventDefault();bin.classList.remove('over');if(sel)drop(sel,b);};});},
 stepper(el,w){let trail=[];const show=(nid)=>{const n=w.nodes[nid];
   el.innerHTML=`<div class="step-trail">${trail.map(t=>esc(t)).join(' ← ')}</div>`+(n.q?`<div class="step-q">${esc(n.q)}</div><div class="row-btns"><button class="pri" data-a="yes">نعم</button><button class="sec" data-a="no">لا</button></div>`:`<div class="step-res">الحكم: ${esc(n.r)}</div><div class="row-btns"><button class="sec" data-r>جرّب حالة أخرى</button></div>`);
   el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{SFX.click();trail.push(n.q.replace('؟','')+': '+(b.dataset.a==='yes'?'نعم':'لا'));show(n[b.dataset.a]);});
   const r=el.querySelector('[data-r]');if(r){SFX.ok();r.onclick=()=>{trail=[];show(w.start);};}};show(w.start);},
 compare(el,w){el.innerHTML=`<div class="cmp">${[w.a,w.b].map((s,i)=>`<div tabindex="0" data-s="${i}"><h4>${esc(s.title)}</h4><ul>${s.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div><div class="blk-note" style="margin-top:10px"><span class="lbl">الخلاصة:</span> ${esc(w.note)}</div>`;
  el.querySelectorAll('[data-s]').forEach(d=>d.onclick=()=>{el.querySelectorAll('[data-s]').forEach(x=>x.classList.remove('on'));d.classList.add('on');SFX.click();});},
 formula(el,w){const P=w.params;el.innerHTML=`<div class="frm">${Object.entries(P).map(([k,p])=>`<label>${esc(p.label)}: <b id="v_${k}">${p.value.toLocaleString('ar-SA')}</b></label><input type="range" id="r_${k}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}">`).join('')}<div class="out"><div class="good"><small>يرد شرعًا (المثل)</small><b id="oGood"></b></div><div class="bad"><small>الربط بالأسعار (ممنوع)</small><b id="oBad"></b></div></div><p class="wmsg" id="oMsg"></p></div>`;
  const upd=()=>{const a=+el.querySelector('#r_amount').value,i=+el.querySelector('#r_infl').value;el.querySelector('#v_amount').textContent=a.toLocaleString('ar-SA');el.querySelector('#v_infl').textContent=i+'%';
   el.querySelector('#oGood').textContent=a.toLocaleString('ar-SA')+' ريال';el.querySelector('#oBad').textContent=Math.round(a*(1+i/100)).toLocaleString('ar-SA')+' ريال';
   el.querySelector('#oMsg').textContent=i?`الزيادة ${Math.round(a*i/100).toLocaleString('ar-SA')} ريال لو اشتُرطت لكانت ربا. والتحوّط المشروع: عقد الدين ابتداءً بالذهب أو الفضة أو سلعة مثلية أو سلة سلع أو عملة أثبت أو سلة عملات.`:'بلا تضخم: المثل يساوي القيمة.';};
  el.querySelectorAll('input').forEach(x=>x.oninput=upd);upd();},
 balance(el,w){const M=[['ضرورية',3],['حاجية',2],['تحسينية',1]];
  el.innerHTML=`<div class="bal-sel"><label>المصلحة (جلب):<select id="bM">${M.map(m=>`<option value="${m[1]}">${m[0]}</option>`).join('')}</select></label><label>المفسدة (درء):<select id="bF">${M.map(m=>`<option value="${m[1]}">${m[0]}</option>`).join('')}</select></label>
   <label>عموم المفسدة:<select id="bA"><option value="0">خاصة</option><option value="1">عامة</option></select></label><label>عموم المصلحة:<select id="bB"><option value="0">خاصة</option><option value="1">عامة</option></select></label>
   <label>تحقق المصلحة:<select id="bT"><option value="1">محققة</option><option value="0">موهومة</option></select></label><label>زمن المفسدة:<select id="bZ"><option value="0">مؤقتة</option><option value="1">دائمة</option></select></label></div>
   <div class="bal-scene"><div class="bal-beam" id="beam"></div><div class="bal-pans"><div id="pM">المصلحة</div><div id="pF">المفسدة</div></div></div><div class="blk-rule" id="bRes"></div>`;
  const upd=()=>{const m=+el.querySelector('#bM').value,f=+el.querySelector('#bF').value,A=+el.querySelector('#bA').value,B=+el.querySelector('#bB').value,T=+el.querySelector('#bT').value,Z=+el.querySelector('#bZ').value;let win,why;
   if(!T){win='F';why='المصلحة الموهومة غير معتد بها، فدرء المفسدة المحققة أولى (الترجيح بالتحقق).';}
   else if(f!==m){win=f>m?'F':'M';why=f>m?'الترجيح بالرتبة: دفع مفسدة الرتبة الأعلى مقدّم على جلب مصلحة الرتبة الأدنى.':'الترجيح بالرتبة: المصلحة في رتبة أعلى من المفسدة.';}
   else if(A!==B){win=A?'F':'M';why=A?'الترجيح بالعموم: المفسدة العامة تُرجَّح على المصلحة الخاصة.':'المصلحة عامة والمفسدة خاصة مع تساوي الرتبة، فيُنظر في القدر.';}
   else if(Z){win='F';why='الترجيح بالزمن: المفسدة الدائمة تُقدَّم على المصلحة المؤقتة.';}
   else{win='F';why='عند التساوي يُقدَّم دفع المفسدة.';}
   el.querySelector('#beam').style.transform=`rotate(${win==='F'?-12:12}deg)`;el.querySelector('#bRes').innerHTML=`<span class="lbl">${win==='F'?'يُقدَّم درء المفسدة':'تُقدَّم المصلحة'}</span>${esc(why)}`;};
  el.querySelectorAll('select').forEach(s=>s.onchange=()=>{SFX.click();upd();});upd();},
 sequence(el,w){let items=w.items.map((t,i)=>({t,i})).sort(()=>Math.random()-.5);if(items.every((x,j)=>x.i===j))items.reverse();
  const draw=(checked)=>{el.innerHTML=`<ol class="seq">${items.map((x,j)=>`<li class="${checked?(x.i===j?'ok':'no'):''}"><b>${j+1}</b><span>${esc(x.t)}</span><button data-u="${j}" aria-label="أعلى">▲</button><button data-d="${j}" aria-label="أسفل">▼</button></li>`).join('')}</ol><div class="row-btns"><button class="pri" id="sqCheck">تحقق من الترتيب</button></div><div class="wmsg"></div>`;
   el.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{const j=+b.dataset.u;if(j>0){[items[j-1],items[j]]=[items[j],items[j-1]];SFX.click();draw();el.querySelector(`[data-u="${j-1}"]`).focus();}});
   el.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const j=+b.dataset.d;if(j<items.length-1){[items[j+1],items[j]]=[items[j],items[j+1]];SFX.click();draw();el.querySelector(`[data-d="${j+1}"]`).focus();}});
   el.querySelector('#sqCheck').onclick=()=>{const ok=items.every((x,j)=>x.i===j);draw(true);el.querySelector('.wmsg').textContent=ok?'🎉 ترتيب صحيح!':'بعض العناصر في غير موضعها (الأحمر). عدّلها وتحقق مجددًا.';(ok?SFX.win:SFX.no)();if(ok){addXP(20,el);confetti(25);}};};draw();}
};

/* ---------- أزرار عامة ---------- */
$('#btnMap').onclick=showMap;$('#btnReview').onclick=openReview;$('#btnReport').onclick=showReport;
$('#btnFontUp').onclick=()=>{S.font=Math.min(4,S.font+1);save();hud();};$('#btnFontDown').onclick=()=>{S.font=Math.max(-2,S.font-1);save();hud();};
$('#btnMute').onclick=()=>{S.mute=!S.mute;save();hud();};
$('#nameIn').value=S.name;if(S.started&&Object.keys(S.done).length){$('#btnStart').textContent='تابع رحلتك ('+Object.keys(S.done).length+' درسًا منجزًا)';}
function begin(toMap){S.name=$('#nameIn').value.trim()||S.name;S.started=true;save();$('#start').classList.remove('show');$('#hud').hidden=false;SFX.open();hud();
 if(window.World&&World.ok){World.start();if(toMap)showMap();else if(!Object.keys(S.done).length)toast('اتجه إلى حيّ «'+C.chapters[0].title+'» المضيء');}else showMap();}
$('#btnStart').onclick=()=>begin(false);$('#btnStartMap').onclick=()=>begin(true);
$('#nameIn').onkeydown=e=>{if(e.key==='Enter')begin(false);};

/* ---------- واجهة للعالم ---------- */
window.App={C,S:()=>S,unlocked,chDone,openLesson:id=>maybePretest(LES[id].ch,()=>openLesson(id)),openQuiz:id=>maybePretest(id,()=>openQuiz(id)),showMap,toast,hud,
 noGL(){document.body.classList.add('nogl');$('#webglNote').hidden=false;$('#btnStart').textContent='ابدأ من خريطة المنهج';$('#btnStartMap').hidden=true;$('#btnStart').onclick=()=>begin(true);},
 isOpen:()=>$('#panel').classList.contains('show')||$('#start').classList.contains('show')};
if(location.hash==='#teacher')setTimeout(()=>{$('#start').classList.remove('show');$('#hud').hidden=false;S.started=true;teacherGate();},300);
if(S.teacher)S.teacher=location.hash==='#teacher'&&S.teacher;
hud();
// إن لم يُحمَّل العالم خلال 8 ثوانٍ (لا إنترنت أو لا WebGL) فالخريطة بديل كامل
setTimeout(()=>{if(!window.World||!World.ok)App.noGL();},8000);
})();
