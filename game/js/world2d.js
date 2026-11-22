/* عالم «رحلة القواعد»: مغامرة بكسل ثنائية الأبعاد بمحرك Phaser 4 */
(function(){
'use strict';
const App=window.App,C=App.C,P=window.PIX,T=P.T;
if(!window.Phaser){App.noGL();return;}
const $=s=>document.querySelector(s);
const RW=24,RH=18,MW=RW*4,MH=RH*2;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<700;

/* ---------- تخطيط الخريطة ---------- */
const REG=C.chapters.map((c,k)=>{const row=k<4?0:1,col=row===0?3-k:k-4;return{k,c,row,col,x0:col*RW,y0:row*RH};});
const SHEIKHS=['الشيخ عبد الله','الشيخ صالح','الشيخ إبراهيم','الشيخ عبد الرحمن','الشيخ محمد','الشيخ أحمد','الشيخ سليمان','الشيخ يوسف','الشيخ خالد'];
const BOSS=[['حارس المكتبة المظلمة','#3b3a6e'],['عابد الألفاظ','#2a6a4f'],['سيّد الحرج','#a06a2f'],['مُلحِق الضرر','#9c3d3d'],['زعيم الوساوس','#5b4a9e'],['مبتدع الأعراف','#8a6a1a'],['المُرابي الماكر','#2f5f7f'],['حارس المصالح الموهومة','#1d1a2b']];
const FOES=['شبهة صغيرة','وَهْم شارد','غلطة متسرّعة','لَبْس عابر'];
const K=P.KIND;
function rnd(seed){let s=seed>>>0;return()=>((s=Math.imul(s^s>>>15,1|s)+0x6D2B79F5|0,((s^s>>>14)>>>0)/4294967296));}
function buildMap(){
  const data=[...Array(MH)].map(()=>Array(MW).fill(0));
  const objs={npcs:[],bosses:[],gates:[],spawn:null,regionStart:[]};
  REG.forEach(R=>{const r=rnd(R.k*7919+11),base=R.k*16;const set=(x,y,kind)=>{data[R.y0+y][R.x0+x]=base+kind;};const get=(x,y)=>data[R.y0+y][R.x0+x]-base;
    for(let y=0;y<RH;y++)for(let x=0;x<RW;x++){const edge=x===0||y===0||x===RW-1||y===RH-1;if(edge){set(x,y,R.k===7&&x===RW-1?K.wall:K.tree);continue;}
      const v=r();set(x,y,v<.55?K.grass:v<.82?K.grass2:v<.9?K.tall:K.flowers);}
    // طريق أفقي في الوسط
    for(let x=1;x<RW-1;x++){set(x,8,K.path);set(x,9,K.path);}
    // ممر رأسي بين الأرض 4 و5
    if(R.k===3)for(let y=8;y<RH-1;y++){set(21,y,K.path);set(22,y,K.path);}
    if(R.k===4)for(let y=1;y<10;y++){set(21,y,K.path);set(22,y,K.path);}
    // البيوت: درس لكل بيت
    const spots=[];[2,5,11,14].forEach(y=>[3,9,15].forEach(x=>spots.push({x,y})));
    const fromRight=R.k<=4;spots.sort((a,b)=>fromRight?(b.x-a.x)||(a.y-b.y):(a.x-b.x)||(a.y-b.y));
    // رتّب: الأقرب إلى الطريق أولًا ضمن العمود
    const cols={};spots.forEach(s=>(cols[s.x]=cols[s.x]||[]).push(s));const order=[];Object.keys(cols).map(Number).sort((a,b)=>fromRight?b-a:a-b).forEach(x=>{cols[x].sort((a,b)=>Math.abs(a.y+2-8.5)-Math.abs(b.y+2-8.5)).forEach(s=>order.push(s));});
    R.c.lessons.forEach((l,i)=>{const s=order[i];for(let dx=0;dx<3;dx++){set(s.x+dx,s.y,K.roof);set(s.x+dx,s.y+1,dx===1?K.door:K.window);}
      if(s.y+2<RH-1&&get(s.x+1,s.y+2)!==K.path)set(s.x+1,s.y+2,K.path);
      objs.npcs.push({lesson:l.id,k:R.k,i,tx:R.x0+s.x+1,ty:R.y0+s.y+2,name:SHEIKHS[i%SHEIKHS.length]});
      if(r()<.6&&get(s.x+3,s.y+1)!==K.path&&s.x+3<RW-1)set(s.x+3,s.y+1,K.lamp);});
    // زخارف: أشجار وصخور وشجيرات متفرقة في الفراغ
    for(let n=0;n<14;n++){const x=1+(r()*(RW-2)|0),y=1+(r()*(RH-2)|0);const g=get(x,y);if([K.grass,K.grass2,K.tall,K.flowers].includes(g)&&!objs.npcs.some(o=>Math.abs(o.tx-R.x0-x)<=1&&Math.abs(o.ty-R.y0-y)<=1)&&y!==7&&y!==10)set(x,y,[K.tree,K.rock,K.bush][n%3]);}
    // بركة صغيرة
    const px0=R.k%2?18:4,py0=R.k%2?15:15;if(get(px0,py0)!==K.path&&get(px0+1,py0)!==K.path){set(px0,py0,K.water);set(px0+1,py0,K.water);}
    // نقطة البداية في الأرض
    objs.regionStart[R.k]=R.k<=3?{x:R.x0+RW-3,y:R.y0+8}:(R.k===4?{x:R.x0+21,y:R.y0+2}:{x:R.x0+2,y:R.y0+8});
  });
  // البوابات بين الأراضي
  for(let k=0;k<7;k++){const A=REG[k],B=REG[k+1];let tiles=[],boss;
    if(k<3){tiles=[[A.x0,A.y0+8],[A.x0,A.y0+9],[B.x0+RW-1,B.y0+8],[B.x0+RW-1,B.y0+9]];boss={x:A.x0+2,y:A.y0+8.5};}
    else if(k===3){tiles=[[A.x0+21,A.y0+RH-1],[A.x0+22,A.y0+RH-1],[B.x0+21,B.y0],[B.x0+22,B.y0]];boss={x:A.x0+21.5,y:A.y0+RH-3};}
    else{tiles=[[A.x0+RW-1,A.y0+8],[A.x0+RW-1,A.y0+9],[B.x0,B.y0+8],[B.x0,B.y0+9]];boss={x:A.x0+RW-3,y:A.y0+8.5};}
    tiles.forEach(([x,y])=>data[y][x]=k*16+K.planks);objs.gates.push({k,tiles});objs.bosses.push({k,...boss});}
  const L=REG[7];objs.bosses.push({k:7,x:L.x0+RW-4,y:L.y0+8.5});
  for(let y=6;y<12;y++)data[L.y0+y][L.x0+RW-3]=7*16+K.planks;
  objs.spawn=objs.regionStart[0];
  return{data,objs};}

/* ---------- المشهد ---------- */
class Main extends Phaser.Scene{
  constructor(){super('main');}
  create(){
    const S=App.S();if(S.hearts==null)S.hearts=5;
    // الرسوم
    this.textures.addCanvas('tiles',P.tileset());
    const hero={robe:'#f4f1ea',head:'#ffffff',pat:'#c8323c',book:1};
    ['down','up','side'].forEach(d=>[0,1].forEach(f=>this.textures.addCanvas(`p_${d}${f}`,P.person(hero,d,f))));
    const bishts=['#6b4428','#3b5a3a','#7a3a2a','#3a3a6a','#5a4a2a','#2f4f5f','#6a2f4a','#4a3a20','#2a4a6a'];
    bishts.forEach((b,i)=>this.textures.addCanvas(`sh${i}`,P.person({robe:'#f4f1ea',bisht:b,trim:'#d4a443',head:'#ffffff',cap:i%2===0,noAgal:i%2===0,beard:i%3?'#e8e8e8':'#9a9a9a'},'down',0)));
    REG.forEach(R=>{[0,1].forEach(f=>this.textures.addCanvas(`m${R.k}_${f}`,P.slime(P.shade(R.c.color,1.25),f)));[0,1].forEach(f=>this.textures.addCanvas(`b${R.k}_${f}`,P.boss(BOSS[R.k][1],f)));});
    this.textures.addCanvas('bang',P.bang('#f5d33d'));this.textures.addCanvas('chk',P.check());
    App.heroImg=P.big(P.person(hero,'down',0),8);App.heroBack=P.big(P.person(hero,'up',0),8);
    $('#startHero').src=App.heroImg;
    // الخريطة
    const {data,objs}=buildMap();this.objs=objs;
    const map=this.make.tilemap({data,tileWidth:T,tileHeight:T});const ts=map.addTilesetImage('tiles','tiles',T,T,0,0);
    const layer=map.createLayer(0,ts,0,0);const coll=[];for(let r=0;r<8;r++)P.COLLIDE.forEach(k=>coll.push(r*16+k));layer.setCollision(coll);this.layer=layer;
    this.physics.world.setBounds(0,0,MW*T,MH*T);
    // اللاعب
    const st=S.pos||objs.spawn;this.player=this.physics.add.sprite(st.x*T+8,st.y*T+8,'p_down0').setDepth(10);
    this.player.body.setSize(10,6).setOffset(3,10);this.player.setCollideWorldBounds(true);this.physics.add.collider(this.player,layer);
    this.dir='down';this.anim=0;this.animT=0;
    // الشيوخ
    this.npcs=this.physics.add.staticGroup();this.npcList=[];
    objs.npcs.forEach(n=>{const s=this.npcs.create(n.tx*T+8,n.ty*T+8,'sh'+(n.i%9)).setDepth(9);s.body.setSize(12,8).setOffset(2,8);s.refreshBody();
      const mark=this.add.image(s.x,s.y-14,'bang').setDepth(20);this.tweens.add({targets:mark,y:mark.y-3,duration:500,yoyo:true,repeat:-1});n.sprite=s;n.mark=mark;this.npcList.push(n);});
    this.physics.add.collider(this.player,this.npcs);
    // الزعماء والحواجز
    this.bossList=[];this.barriers=this.physics.add.staticGroup();
    objs.bosses.forEach(b=>{const s=this.physics.add.staticSprite(b.x*T,b.y*T+2,`b${b.k}_0`).setDepth(9);s.body.setSize(26,20).setOffset(3,10);s.refreshBody();
      const aura=this.add.ellipse(s.x,s.y+14,40,10,0x000000,.25).setDepth(8);b.sprite=s;b.aura=aura;this.bossList.push(b);this.physics.add.collider(this.player,s);});
    objs.gates.forEach(g=>{g.bars=g.tiles.map(([x,y])=>{const z=this.add.zone(x*T+8,y*T+8,T,T);this.physics.add.existing(z,true);this.physics.add.collider(this.player,z);return z;});});
    // الشبهات (أعداء)
    this.foes=this.physics.add.group();REG.forEach(R=>{for(let i=0;i<3;i++)this.spawnFoe(R.k,i);});
    this.physics.add.collider(this.foes,layer);this.physics.add.collider(this.foes,this.npcs);
    this.physics.add.overlap(this.player,this.foes,(p,f)=>this.touchFoe(f));
    // الكاميرا
    const cam=this.cameras.main;cam.setBounds(0,0,MW*T,MH*T);cam.startFollow(this.player,true,.15,.15);cam.setBackgroundColor('#1d1a2b');this.fitZoom();
    this.scale.on('resize',()=>this.fitZoom());
    // المدخلات
    this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ENTER,M,SHIFT',false);
    this.input.keyboard.on('keydown',e=>{if(!this.active())return;if(['Space','Enter','KeyE'].includes(e.code)){e.preventDefault();this.interact();}if(e.code==='KeyM'){App.showMap();}});
    this.input.on('pointerdown',ptr=>{if(!this.active()||mobile)return;const wx=ptr.worldX,wy=ptr.worldY;const n=this.nearest(wx,wy,14);if(n){this.autoTo={x:n.x,y:n.y+12,then:n};}else this.autoTo={x:wx,y:wy};});
    this.region=-1;this.frozen=true;this.lastBattle=0;
    this.time.addEvent({delay:30000,loop:true,callback:()=>{S.pos={x:this.player.x/T-.5,y:this.player.y/T-.5};App.save();}});
    this.refresh();W.ready(this);
  }
  fitZoom(){const w=this.scale.width,h=this.scale.height;const z=Math.max(2,Math.min(4,Math.round(Math.min(w/300,h/230))));this.cameras.main.setZoom(z);}
  active(){return !this.frozen&&!App.isOpen()&&$('#dialog').hidden&&$('#battle').hidden;}
  spawnFoe(k,i){const R=REG[k];const r=rnd(k*131+i*17+Date.now()%1000);let x,y,guard=0;
    do{x=R.x0+2+(r()*(RW-4)|0);y=R.y0+2+(r()*(RH-4)|0);guard++;}while(guard<50&&(this.layer.getTileAt(x,y).collides||this.objs.npcs.some(n=>Math.abs(n.tx-x)<2&&Math.abs(n.ty-y)<2)));
    const f=this.foes.create(x*T+8,y*T+8,`m${k}_0`).setDepth(9);f.k=k;f.body.setSize(12,8).setOffset(2,7);f.setBounce(1);f.wander=0;f.name=FOES[(k+i)%FOES.length];return f;}
  touchFoe(f){if(!this.active()||this.time.now-this.lastBattle<1500||f.fighting)return;f.fighting=true;f.body.setVelocity(0,0);this.player.body.setVelocity(0,0);W.foeBattle(f);}
  nearest(x,y,max){let best=null,bd=max;this.npcList.forEach(n=>{const d=Phaser.Math.Distance.Between(x,y,n.sprite.x,n.sprite.y);if(d<bd){bd=d;best={type:'npc',n,x:n.sprite.x,y:n.sprite.y};}});
    this.bossList.forEach(b=>{if(!b.sprite.active)return;const d=Phaser.Math.Distance.Between(x,y,b.sprite.x,b.sprite.y);if(d<bd+10){bd=d;best={type:'boss',b,x:b.sprite.x,y:b.sprite.y};}});return best;}
  interact(){const t=this.nearest(this.player.x,this.player.y,24);if(!t)return;this.autoTo=null;this.player.body.setVelocity(0,0);
    if(t.type==='npc')W.talkNpc(t.n);else W.talkBoss(t.b.k);}
  refresh(){const S=App.S();
    this.npcList.forEach(n=>{const done=!!S.done[n.lesson];n.mark.setTexture(done?'chk':'bang');const u=App.unlocked(n.lesson.split('l')[0]);n.mark.setVisible(u);});
    this.bossList.forEach(b=>{const done=App.chDone(C.chapters[b.k].id);if(done&&b.sprite.active&&b.k<7){b.sprite.disableBody(true,true);b.aura.setVisible(false);}
      if(b.k===7&&done){b.sprite.setAlpha(.35);}});
    this.objs.gates.forEach(g=>{const open=App.chDone(C.chapters[g.k].id);g.bars.forEach(z=>{z.body.enable=!open;});});}
  update(t,dt){
    // حركة الأعداء
    this.foes.getChildren().forEach(f=>{if(!f||!f.active)return;f.wander-=dt;if(f.wander<=0&&!f.fighting){f.wander=1200+Math.random()*1800;const a=Math.random()*Math.PI*2,sp=Math.random()<.3?0:22;f.body.setVelocity(Math.cos(a)*sp,Math.sin(a)*sp);}
      const R=REG[f.k];const minx=(R.x0+1.5)*T,maxx=(R.x0+RW-1.5)*T,miny=(R.y0+1.5)*T,maxy=(R.y0+RH-1.5)*T;if(f.x<minx||f.x>maxx)f.body.velocity.x*=-1,f.x=Phaser.Math.Clamp(f.x,minx,maxx);if(f.y<miny||f.y>maxy)f.body.velocity.y*=-1,f.y=Phaser.Math.Clamp(f.y,miny,maxy);
      if(((t/300)|0)%2!==f.fr){f.fr=((t/300)|0)%2;f.setTexture(`m${f.k}_${f.fr}`);}});
    this.bossList.forEach(b=>{if(b.sprite.active){const fr=((t/450)|0)%2;if(fr!==b.fr){b.fr=fr;b.sprite.setTexture(`b${b.k}_${fr}`);}}});
    const p=this.player;
    if(!this.active()){p.body.setVelocity(0,0);this.setPrompt(null);return;}
    const k=this.keys;let vx=0,vy=0;
    if(k.LEFT.isDown||k.A.isDown)vx-=1;if(k.RIGHT.isDown||k.D.isDown)vx+=1;if(k.UP.isDown||k.W.isDown)vy-=1;if(k.DOWN.isDown||k.S.isDown)vy+=1;
    vx+=W.joy.x;vy+=W.joy.y;
    if(Math.hypot(vx,vy)>.15)this.autoTo=null;
    else if(this.autoTo){const dx=this.autoTo.x-p.x,dy=this.autoTo.y-p.y,d=Math.hypot(dx,dy);if(d<6||(this.autoTo.stuck>40)){const th=this.autoTo.then;this.autoTo=null;if(th){if(th.type==='npc')W.talkNpc(th.n);else W.talkBoss(th.b.k);}}else{vx=dx/d;vy=dy/d;
      if(p.body.speed<5)this.autoTo.stuck=(this.autoTo.stuck||0)+1;else this.autoTo.stuck=0;}}
    const sp=(k.SHIFT.isDown?110:78);const L=Math.hypot(vx,vy);
    if(L>.15){p.body.setVelocity(vx/L*sp*Math.min(1,L),vy/L*sp*Math.min(1,L));
      this.dir=Math.abs(vx)>Math.abs(vy)?'side':(vy<0?'up':'down');p.setFlipX(this.dir==='side'&&vx<0);
      this.animT+=dt;if(this.animT>160){this.animT=0;this.anim^=1;}p.setTexture(`p_${this.dir}${this.anim}`);}
    else{p.body.setVelocity(0,0);p.setTexture(`p_${this.dir}0`);}
    p.setDepth(10+p.y/1000);
    // تلميح التفاعل
    const n=this.nearest(p.x,p.y,24);this.setPrompt(n);
    // المنطقة الحالية
    const rk=REG.findIndex(R=>p.x>=R.x0*T&&p.x<(R.x0+RW)*T&&p.y>=R.y0*T&&p.y<(R.y0+RH)*T);if(rk>=0&&rk!==this.region){this.region=rk;W.enterRegion(rk);}
  }
  setPrompt(n){const key=n?(n.type==='npc'?n.n.lesson:'boss'+n.b.k):null;if(key===this._pk)return;this._pk=key;const el=$('#prompt');
    if(!n){el.hidden=true;return;}el.hidden=false;$('#promptText').textContent=n.type==='npc'?`${n.n.name}: «${App.LES[n.n.lesson].title}»`:`👑 ${BOSS[n.b.k][0]}`;$('#promptBtn').textContent=n.type==='npc'?'تحدّث ⏎':'واجه ⚔️';}
}

/* ---------- الواجهة: الحوار والمعارك ---------- */
const W={joy:{x:0,y:0},scene:null,
  ready(sc){this.scene=sc;window.World.ok=true;},
  freeze(b){if(this.scene)this.scene.frozen=b;},
  enterRegion(k){const c=C.chapters[k];const b=$('#banner');b.innerHTML=`<small>الأرض ${k+1}</small>${App.esc(c.title)}`;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');App.SFX.open();
    if(!App.unlocked(c.id))App.toast('🔒 هذه الأرض مقفلة');},
  dialog(face,name,text,btns){const d=$('#dialog');$('#dlgFace').src=face;$('#dlgName').textContent=name;const p=$('#dlgText');d.hidden=false;
    const bb=$('#dlgBtns');bb.innerHTML='';const show=()=>{bb.innerHTML='';btns.forEach(([lab,fn,cls])=>{const b=document.createElement('button');b.className=cls||'sec';b.textContent=lab;b.onclick=()=>{d.hidden=true;fn&&fn();};bb.appendChild(b);});bb.querySelector('button').focus();};
    if(reduce){p.textContent=text;show();return;}let i=0;p.textContent='';clearInterval(this._tw);this._tw=setInterval(()=>{i+=2;p.textContent=text.slice(0,i);if(i>=text.length){clearInterval(this._tw);show();}},18);
    d.onclick=e=>{if(e.target.tagName!=='BUTTON'&&p.textContent.length<text.length){clearInterval(this._tw);p.textContent=text;show();}};},
  talkNpc(n){const l=App.LES[n.lesson],S=App.S();const ch=l.ch;if(!App.unlocked(ch)){App.toast('🔒 اهزم زعيم الأرض السابقة أولًا');return;}
    S.hearts=5;W.hearts();App.SFX.click();const face=P.big(P.person({robe:'#f4f1ea',bisht:['#6b4428','#3b5a3a','#7a3a2a','#3a3a6a','#5a4a2a','#2f4f5f','#6a2f4a','#4a3a20','#2a4a6a'][n.i%9],trim:'#d4a443',head:'#ffffff',cap:n.i%2===0,noAgal:n.i%2===0,beard:n.i%3?'#e8e8e8':'#9a9a9a'},'down',0),6);
    const done=S.done[n.lesson];
    const txt=done?`أهلًا بك مجددًا يا ${S.name||'طالب العلم'}. أتقنتَ درس «${l.title}». أتريد مراجعته؟ (عادت قلوبك كاملة ❤️)`:`السلام عليكم يا ${S.name||'طالب العلم'}. عندي لك درس «${l.title}» (المذكرة ص ${l.page}). اقرأه وأجب عن سؤالي لتنال الخبرة، فالشبهات في هذه الأرض لا تُهزم إلا بالعلم. (عادت قلوبك كاملة ❤️)`;
    this.dialog(face,n.name,txt,[[done?'راجع الدرس 📖':'ابدأ الدرس 📖',()=>App.openLesson(n.lesson),'pri'],['لاحقًا',null,'sec']]);},
  talkBoss(k){const c=C.chapters[k],S=App.S();if(!App.unlocked(c.id))return;const learned=c.lessons.filter(l=>S.done[l.id]).length;const nm=BOSS[k][0];
    const done=App.chDone(c.id);const face=P.big(P.boss(BOSS[k][1],0),4);
    const txt=done?`لقد هزمتني من قبل... أتريد نزالًا آخر للمراجعة؟`:`أنا ${nm}، حارس ${k<7?'بوابة':'قلعة'} «${c.title}». لن ${k<7?'تعبر':'تنتصر'} حتى تصيبني بـ80% من أسئلتي (${c.quiz.length} أسئلة). ${learned<c.lessons.length?`⚠️ تعلّمت ${learned} من ${c.lessons.length} دروس فقط من شيوخ هذه الأرض!`:'أراك تعلّمت دروس الأرض كلها... لنرَ!'}`;
    this.dialog(face,'👑 '+nm,txt,[['قاتِل! ⚔️',()=>this.bossBattle(c.id),'pri'],['ليس الآن',null,'sec']]);},
  hearts(){const S=App.S();const h=$('#hearts');h.innerHTML='';for(let i=0;i<5;i++){const im=document.createElement('img');im.src=i<S.hearts?W._hf:W._he;im.className='pix';h.appendChild(im);}},
  foeBattle(f){const S=App.S(),c=C.chapters[f.k];
    let pool=c.lessons.filter(l=>S.done[l.id]).map(l=>App.QBYKEY[l.id+':q']);
    const due=App.dueReview().map(k=>App.QBYKEY[k]).filter(Boolean);pool=pool.concat(due);if(!pool.length)pool=c.lessons.map(l=>App.QBYKEY[l.id+':q']);
    pool=pool.sort(()=>Math.random()-.5);const hp=f.k<3?2:3;
    this.battle({name:f.name,img:P.big(P.slime(P.shade(c.color,1.25),0),8),hp,hearts:S.hearts,qs:pool,loop:true,intro:`ظهرت ${f.name}! أجب صحيحًا لتهزمها.`,
      onEnd:(win,hl)=>{S.hearts=hl;W.hearts();const sc=this.scene;sc.lastBattle=sc.time.now;
        if(win){App.addXP(15);App.toast('✨ هزمت '+f.name+'! +15 خبرة');f.disableBody(true,true);sc.time.delayedCall(45000,()=>{f.enableBody(true,f.x,f.y,true,true);f.fighting=false;});}
        else{f.fighting=false;f.setPosition(f.x+20,f.y);if(hl<=0)this.faint(f.k);}}});},
  bossBattle(chId){const c=App.CH[chId];if(!App.unlocked(chId)){App.toast('🔒 هذه الأرض مقفلة');return;}const n=c.quiz.length,need=Math.ceil(n*App.PASS);const k=c.idx;
    this.battle({name:BOSS[k][0],img:P.big(P.boss(BOSS[k][1],0),5),hp:need,hearts:n-need+1,maxHearts:n-need+1,qs:c.quiz.map((q,i)=>Object.assign({},q,{_key:c.id+':'+i})).sort(()=>Math.random()-.5),boss:true,
      intro:`${BOSS[k][0]} يعترض طريقك! تحتاج ${need} إصابات من ${n} أسئلة، ولك ${n-need+1} ${n-need+1>2?'قلوب':'قلبان'} فقط.`,
      onEnd:(win,hl,good,bad)=>{const sc=Math.min(win?1:.79,good/Math.max(1,good+bad));const first=App.recordBoss(chId,win?Math.max(sc,App.PASS):sc);
        if(win){App.SFX.win();App.confetti(90);const nx=C.chapters[k+1];W.scene.refresh();
          if(this.scene){const b=this.scene.bossList[k];if(b&&k<7){this.scene.cameras.main.shake(300,.006);}}
          this.dialog(P.big(P.boss(BOSS[k][1],1),4),'👑 '+BOSS[k][0],nx?`آه... هزمتني! انفتحت البوابة إلى أرض «${nx.title}».`:`هُزمت آخر الشبهات! أتممت رحلة القواعد كلها يا ${App.S().name||'بطل'}.`,nx?[['تابع الرحلة ▶',null,'pri']]:[['🎓 استلم الشهادة',()=>App.showCert(),'pri']]);}
        else{this.dialog(P.big(P.boss(BOSS[k][1],0),4),'👑 '+BOSS[k][0],'هاها! لم تبلغ 80%. ارجع إلى الشيوخ وراجع، ثم عُد إليّ.',[['حسنًا',null,'sec']]);}}});},
  faint(k){const S=App.S();S.hearts=5;W.hearts();const st=this.scene.objs.regionStart[k];this.scene.player.setPosition(st.x*T+8,st.y*T+8);App.toast('😵 نفدت قلوبك! عدتَ إلى مدخل الأرض، وعادت قلوبك.');},
  battle(o){this.freeze(true);const B=$('#battle');B.hidden=false;B.classList.toggle('boss',!!o.boss);$('#foeName').textContent=o.name;$('#foeImg').src=o.img;$('#meImg').src=App.heroBack;$('#meName').textContent=App.S().name||'أنت';
    let hp=o.hp,hearts=o.hearts,qi=0,good=0,bad=0;const maxH=o.maxHearts||5;
    const draw=()=>{$('#foeHp').style.width=(hp/o.hp*100)+'%';$('#foeHpT').textContent=`${hp} / ${o.hp}`;const mh=$('#meHearts');mh.innerHTML='';for(let i=0;i<maxH;i++){const im=document.createElement('img');im.src=i<hearts?W._hf:W._he;im.className='pix';mh.appendChild(im);}};
    const msg=t=>{$('#battleMsg').textContent=t;};
    const end=win=>{setTimeout(()=>{B.hidden=true;this.freeze(false);o.onEnd(win,hearts,good,bad);},win?300:200);};
    const anim=(el,cls)=>{if(reduce)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);};
    const ask=()=>{const host=$('#battleQ');host.innerHTML='';if(hp<=0){msg('🏆 انتصار!');App.SFX.win();host.innerHTML='<div class="row-btns"><button class="pri" id="bEnd">رائع ▶</button></div>';$('#bEnd').onclick=()=>end(true);$('#bEnd').focus();return;}
      if(hearts<=0||(!o.loop&&qi>=o.qs.length)){msg('💥 هُزمت هذه المرة...');host.innerHTML='<div class="row-btns"><button class="sec" id="bEnd">انسحب</button></div>';$('#bEnd').onclick=()=>end(false);$('#bEnd').focus();return;}
      const q=o.qs[qi%o.qs.length];qi++;
      App.renderQ(host,q,{label:o.boss?`سؤال ${qi} من ${o.qs.length}`:'سؤال المعركة',xp:o.boss?12:8,next:()=>ask(),nextLabel:'التالي ▶',
        cb:ok=>{if(ok){good++;hp--;anim($('#foeImg'),'hit');anim($('#meImg'),'atk');msg(hp>0?`💥 إصابة! بقي ${hp}`:'💥 ضربة قاضية!');}else{bad++;hearts--;anim($('#meImg'),'hurt');anim($('#battle'),'quake');msg(hearts>0?`😖 أصابتك الشبهة! بقي ${hearts} ❤️`:'😵 نفدت قلوبك!');}draw();}});
      host.querySelector('.opt').focus();};
    draw();msg(o.intro);App.SFX.open();setTimeout(ask,reduce?0:500);},
  walkTo(lessonId){const sc=this.scene;if(!sc)return App.openLessonDirect(lessonId);const n=sc.npcList.find(n=>n.lesson===lessonId);if(!n)return;
    const d=Phaser.Math.Distance.Between(sc.player.x,sc.player.y,n.sprite.x,n.sprite.y);if(d>T*30){sc.player.setPosition(n.sprite.x,n.sprite.y+18);this.talkNpc(n);}else sc.autoTo={x:n.sprite.x,y:n.sprite.y+14,then:{type:'npc',n}};}
};

/* ---------- واجهة عامة يستعملها app.js ---------- */
window.World={ok:false,
  start(){W.freeze(false);W.hearts();$('#objective').hidden=false;if(mobile)$('#touch').hidden=false;},
  pause(b){W.freeze(b);},refresh(){if(W.scene)W.scene.refresh();W.hearts&&W._hf&&W.hearts();},celebrate(){},unlockFx(){},
  goTo(chId){const sc=W.scene;if(!sc)return;const k=App.CH[chId].idx,st=sc.objs.regionStart[k];sc.player.setPosition(st.x*T+8,st.y*T+8);},
  bossBattle:id=>W.bossBattle(id),walkTo:id=>W.walkTo(id)};
window.__W=W;W._hf=P.big(P.heart(true),3);W._he=P.big(P.heart(false),3);

// عصا اللمس وزر A
const stick=$('#stick'),knob=$('#knob');let jid=null;
stick.addEventListener('pointerdown',e=>{jid=e.pointerId;stick.setPointerCapture(e.pointerId);jm(e);});
stick.addEventListener('pointermove',e=>{if(e.pointerId===jid)jm(e);});
const je=()=>{jid=null;W.joy={x:0,y:0};knob.style.transform='';};stick.addEventListener('pointerup',je);stick.addEventListener('pointercancel',je);
function jm(e){const r=stick.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/(r.width/2),y=(e.clientY-r.top-r.height/2)/(r.height/2);const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}W.joy={x,y};knob.style.transform=`translate(${x*36}px,${y*36}px)`;}
$('#actBtn').onclick=()=>{if(W.scene&&W.scene.active())W.scene.interact();};
$('#promptBtn').onclick=()=>{if(W.scene)W.scene.interact();};

try{
  new Phaser.Game({type:/[?&]canvas/.test(location.search)?Phaser.CANVAS:Phaser.WEBGL,parent:'game',pixelArt:true,preserveDrawingBuffer:/[?new Phaser.Game({type:Phaser.WEBGL,parent:'game',pixelArt:true,]shot/.test(location.search),backgroundColor:'#1d1a2b',
    scale:{mode:Phaser.Scale.RESIZE,width:innerWidth,height:innerHeight},
    physics:{default:'arcade',arcade:{gravity:{x:0,y:0},debug:false}},
    input:{keyboard:{capture:[]}},audio:{noAudio:true},scene:[Main],banner:false});
}catch(e){console.error(e);App.noGL();}
})();
