/* عالم «رحلة القواعد»: عالم افتراضي بكسلي حيّ بمحرك Phaser 4 */
(function(){
'use strict';
const App=window.App,C=App.C,P=window.PIX,T=P.T,NK=P.NK;
if(!window.Phaser){App.noGL();return;}
const $=s=>document.querySelector(s);
const RW=30,RH=20,MW=RW*4,MH=RH*2;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<700;
const DAY=240000;// طول اليوم بالمللي ثانية

/* ---------- تخطيط العالم ---------- */
const REG=C.chapters.map((c,k)=>{const row=k<4?0:1,col=row===0?3-k:k-4;return{k,c,row,col,x0:col*RW,y0:row*RH};});
const SHEIKHS=['الشيخ عبد الله','الشيخ صالح','الشيخ إبراهيم','الشيخ عبد الرحمن','الشيخ محمد','الشيخ أحمد','الشيخ سليمان','الشيخ يوسف','الشيخ خالد','الشيخ عمر'];
const BOSS=[['حارس المكتبة المظلمة','#3b3a6e'],['عابد الألفاظ','#2a6a4f'],['سيّد الحرج','#a06a2f'],['مُلحِق الضرر','#9c3d3d'],['زعيم الوساوس','#5b4a9e'],['مبتدع الأعراف','#8a6a1a'],['المُرابي الماكر','#2f5f7f'],['حارس المصالح الموهومة','#1d1a2b']];
const FOES=['شبهة صغيرة','وَهْم شارد','غلطة متسرّعة','لَبْس عابر'];
const TREEKIND=['oak','blossom','palm','autumn','blossom','palm','oak','night'];
const LANDNAME=['مكتبة القواعد','نُصب الميزان','واحة التيسير','قلعة الضمان','برج اليقين','سوق العُرف','خزانة الضمان','منارة المقاصد'];
const K=P.KIND;
const VILLAGERS=[{robe:'#e8e4da',head:'#ffffff',pat:'#c8323c'},{robe:'#d9cfb8',head:'#ffffff'},{robe:'#2a2438',head:'#2a2438',noAgal:1},{robe:'#c9b48a',head:'#f4f1ea',cap:1,noAgal:1},{robe:'#3a3448',head:'#3a3448',noAgal:1}];
function rnd(seed){let s=seed>>>0;return()=>((s=Math.imul(s^s>>>15,1|s)+0x6D2B79F5|0,((s^s>>>14)>>>0)/4294967296));}
function buildMap(){
  const data=[...Array(MH)].map(()=>Array(MW).fill(0));
  const O={npcs:[],bosses:[],gates:[],regionStart:[],trees:[],landmarks:[],lamps:[],windows:[],water:[],villagerSpots:[]};
  REG.forEach(R=>{const r=rnd(R.k*7919+11),base=R.k*NK;const inR=(x,y)=>x>=0&&y>=0&&x<RW&&y<RH;
    const set=(x,y,kind)=>{if(inR(x,y))data[R.y0+y][R.x0+x]=base+kind;};const get=(x,y)=>inR(x,y)?data[R.y0+y][R.x0+x]-base:-1;
    const used=[...Array(RH)].map(()=>Array(RW).fill(false));const mark=(x,y,w,h)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(inR(x+i,y+j))used[y+j][x+i]=true;};
    for(let y=0;y<RH;y++)for(let x=0;x<RW;x++){const edge=x===0||y===0||x===RW-1||y===RH-1;
      if(edge){const v=r();set(x,y,R.k===7&&x===RW-1?K.wall:(v<.62?K.tree:v<.85?K.bush:K.rock));used[y][x]=true;continue;}
      const v=r();set(x,y,v<.5?K.grass:v<.78?K.grass2:v<.9?K.tall:K.flowers);}
    // الطريق الرئيس
    for(let x=1;x<RW-1;x++){set(x,9,K.path);set(x,10,K.path);mark(x,9,1,2);}
    const passDown=R.k===3,passUp=R.k===4;
    if(passDown)for(let y=10;y<RH-1;y++){set(14,y,K.path);set(15,y,K.path);mark(14,y,2,1);}
    if(passUp)for(let y=1;y<10;y++){set(14,y,K.path);set(15,y,K.path);mark(14,y,2,1);}
    // المعلم والساحة
    const ly=passUp?12:2;// صف أعلى المعلم
    for(let y=ly;y<ly+7;y++)for(let x=10;x<20;x++){set(x,y,(x+y)%5===0?K.plaza2:K.plaza);used[y][x]=true;}
    O.landmarks.push({k:R.k,x:(R.x0+15)*T,y:(R.y0+ly+6)*T+8,foot:{x:R.x0+11,y:R.y0+ly+3,w:8,h:3}});
    set(10,ly+3,K.lamp);set(19,ly+3,K.lamp);O.lamps.push([R.x0+10,R.y0+ly+3],[R.x0+19,R.y0+ly+3]);
    set(11,ly+6,K.bench);set(18,ly+6,K.bench);
    // حديقة وبركة في الجهة الأخرى من الطريق
    if(!passDown){const gy=passUp?3:13;for(let y=gy;y<gy+4;y++)for(let x=11;x<19;x++){used[y][x]=true;const edgeG=y===gy||y===gy+3||x===11||x===18;set(x,y,edgeG?(r()<.5?K.flowers:K.grass):K.water);if(!edgeG)O.water.push([R.x0+x,R.y0+y]);}}
    // البيوت والشيوخ
    let spots=[{x:2,y:3},{x:7,y:3},{x:20,y:3},{x:25,y:3},{x:2,y:13},{x:7,y:13},{x:20,y:13},{x:25,y:13},{x:2,y:6},{x:25,y:6}];
    if(passUp)spots=spots.map(s=>s.y===3||s.y===6?{x:s.x,y:s.y}:s);
    const fromRight=R.k<=4;spots.sort((a,b)=>{const ka=(fromRight?-a.x:a.x)+(a.y===6?40:0),kb=(fromRight?-b.x:b.x)+(b.y===6?40:0);return ka-kb||a.y-b.y;});
    R.c.lessons.forEach((l,i)=>{const s=spots[i];for(let dx=0;dx<3;dx++){set(s.x+dx,s.y,K.roof);set(s.x+dx,s.y+1,dx===1?K.door:K.window);}mark(s.x-1,s.y-1,5,4);
      O.windows.push([R.x0+s.x,R.y0+s.y+1],[R.x0+s.x+2,R.y0+s.y+1]);
      const ny=s.y===13?s.y+2:s.y+2;set(s.x+1,ny,K.path);
      // ممر صغير إلى الطريق
      const dir=ny<9?1:-1;for(let y=ny;y!==(dir>0?9:10);y+=dir){if(get(s.x+1,y)!==K.roof&&get(s.x+1,y)!==K.door)set(s.x+1,y,K.path);used[y][s.x+1]=true;}
      O.npcs.push({lesson:l.id,k:R.k,i,tx:R.x0+s.x+1,ty:R.y0+ny,name:SHEIKHS[i%SHEIKHS.length]});
      if(s.x+3<RW-1&&!used[s.y+1][s.x+3]){set(s.x+3,s.y+1,K.lamp);O.lamps.push([R.x0+s.x+3,R.y0+s.y+1]);used[s.y+1][s.x+3]=true;}});
    // أشجار كبيرة في الفراغات
    let n=0,guard=0;while(n<12&&guard++<400){const x=2+(r()*(RW-4)|0),y=2+(r()*(RH-3)|0);let ok=true;for(let j=-2;j<=0;j++)for(let i=-1;i<=1;i++)if(!inR(x+i,y+j)||used[y+j][x+i])ok=false;if(!ok)continue;
      mark(x-1,y-2,3,3);O.trees.push({x:(R.x0+x)*T+8,y:(R.y0+y)*T+14,kind:TREEKIND[R.k],seed:R.k*100+n});n++;}
    // صخور وشجيرات قليلة
    for(let m=0;m<8;m++){const x=1+(r()*(RW-2)|0),y=1+(r()*(RH-2)|0);if(!used[y][x]){set(x,y,[K.rock,K.bush,K.stump][m%3]);used[y][x]=true;}}
    // أماكن الأهالي
    for(let m=0;m<3;m++)O.villagerSpots.push({k:R.k,x:R.x0+4+m*9,y:R.y0+(m%2?9:10)});
    O.regionStart[R.k]=R.k<=3?{x:R.x0+RW-3,y:R.y0+9}:(R.k===4?{x:R.x0+14,y:R.y0+2}:{x:R.x0+2,y:R.y0+9});
  });
  for(let k=0;k<7;k++){const A=REG[k],B=REG[k+1];let tiles=[],boss;
    if(k<3){tiles=[[A.x0,A.y0+9],[A.x0,A.y0+10],[B.x0+RW-1,B.y0+9],[B.x0+RW-1,B.y0+10]];boss={x:A.x0+2.5,y:A.y0+9.5};}
    else if(k===3){tiles=[[A.x0+14,A.y0+RH-1],[A.x0+15,A.y0+RH-1],[B.x0+14,B.y0],[B.x0+15,B.y0]];boss={x:A.x0+15,y:A.y0+RH-2.5};}
    else{tiles=[[A.x0+RW-1,A.y0+9],[A.x0+RW-1,A.y0+10],[B.x0,B.y0+9],[B.x0,B.y0+10]];boss={x:A.x0+RW-2.5,y:A.y0+9.5};}
    tiles.forEach(([x,y])=>data[y][x]=k*NK+K.planks);O.gates.push({k,tiles});O.bosses.push({k,...boss});}
  const L=REG[7];O.bosses.push({k:7,x:L.x0+RW-3.5,y:L.y0+9.5});
  O.spawn=O.regionStart[0];
  return{data,O};}

/* ---------- الموسيقى المولّدة ---------- */
const Music={ac:null,on:false,start(){if(this.on||reduce&&false)return;try{this.ac=this.ac||new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}this.on=true;
  const ac=this.ac,out=ac.createGain();out.gain.value=.05;const dl=ac.createDelay();dl.delayTime.value=.33;const fb=ac.createGain();fb.gain.value=.32;dl.connect(fb).connect(dl);out.connect(ac.destination);dl.connect(out);this.out=out;this.dl=dl;
  const drone=ac.createOscillator(),dg=ac.createGain();drone.type='sine';drone.frequency.value=73.4;dg.gain.value=.25;drone.connect(dg).connect(out);drone.start();
  const scale=[293.7,311.1,370,392,440,466.2,523.3,587.3];let step=0;
  const tick=()=>{if(!this.on)return;const muted=App.S().mute||!$('#battle').hidden;out.gain.setTargetAtTime(muted?0:.05,ac.currentTime,.3);
    if(!muted){const phrase=[0,2,3,4,3,2,1,0,4,5,4,3,2,3,1,0];const f=scale[phrase[step%16]]*(Math.random()<.2?.5:1);step++;
      const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=f;const t=ac.currentTime;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.5,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+1.1);o.connect(g);g.connect(out);g.connect(dl);o.start(t);o.stop(t+1.2);}
    setTimeout(tick,step%4===3?900:450);};tick();}};

/* ---------- المشهد ---------- */
class Main extends Phaser.Scene{
  constructor(){super('main');}
  create(){
    const S=App.S();if(S.hearts==null)S.hearts=5;
    // الرسوم
    this.textures.addCanvas('tiles',P.tileset());
    const hero={robe:'#f4f1ea',head:'#ffffff',pat:'#c8323c',book:1};
    ['down','up','side'].forEach(d=>[0,1].forEach(f=>this.textures.addCanvas(`p_${d}${f}`,P.person(hero,d,f))));
    this.SH=i=>({robe:'#f4f1ea',bisht:['#6b4428','#3b5a3a','#7a3a2a','#3a3a6a','#5a4a2a','#2f4f5f','#6a2f4a','#4a3a20','#2a4a6a','#5a2a2a'][i%10],trim:'#d4a443',head:'#ffffff',cap:i%2===0,noAgal:i%2===0,beard:i%3?'#e8e8e8':'#9a9a9a'});
    for(let i=0;i<10;i++)this.textures.addCanvas(`sh${i}`,P.person(this.SH(i),'down',0));
    VILLAGERS.forEach((v,i)=>['down','up','side'].forEach(d=>[0,1].forEach(f=>this.textures.addCanvas(`v${i}_${d}${f}`,P.person(v,d,f)))));
    REG.forEach(R=>{[0,1].forEach(f=>this.textures.addCanvas(`m${R.k}_${f}`,P.slime(P.shade(R.c.color,1.25),f)));[0,1].forEach(f=>this.textures.addCanvas(`b${R.k}_${f}`,P.boss(BOSS[R.k][1],f)));
      this.textures.addCanvas(`lm${R.k}`,P.landmark(R.k,P.REGIONS[R.k]));});
    [...new Set(TREEKIND)].forEach((kd,i)=>[0,1,2].forEach(v=>this.textures.addCanvas(`tr_${kd}${v}`,P.bigTree(P.REGIONS[TREEKIND.indexOf(kd)],kd,i*10+v+3))));
    this.textures.addCanvas('bang',P.bang('#f5d33d'));this.textures.addCanvas('chk',P.check());this.textures.addCanvas('glow',P.glow());this.textures.addCanvas('cloud',P.cloud());
    [['petal','#f5a3c0'],['dust','#e8d3a0'],['spark','#e8dcff'],['fly','#fff2a0'],['mist','#ffffff'],['gold','#ffd86a']].forEach(([k,c])=>this.textures.addCanvas(k,P.dot(c)));
    this.textures.addCanvas('leaf',P.leaf('#d9662f'));[0,1].forEach(f=>{this.textures.addCanvas('bird'+f,P.bird(f));this.textures.addCanvas('bf'+f,P.butterfly('#f5d33d',f));this.textures.addCanvas('bfb'+f,P.butterfly('#7ac7f0',f));});
    App.heroImg=P.big(P.person(hero,'down',0),8);App.heroBack=P.big(P.person(hero,'up',0),8);$('#startHero').src=App.heroImg;
    // الخريطة
    const {data,O}=buildMap();this.objs=O;this.mapData=data;
    const map=this.make.tilemap({data,tileWidth:T,tileHeight:T});const ts=map.addTilesetImage('tiles','tiles',T,T,0,0);
    const layer=map.createLayer(0,ts,0,0).setDepth(0);const coll=[];for(let r=0;r<8;r++)P.COLLIDE.forEach(k=>coll.push(r*NK+k));layer.setCollision(coll);this.layer=layer;
    this.physics.world.setBounds(0,0,MW*T,MH*T);
    this.solids=this.physics.add.staticGroup();
    const solid=(x,y,w,h)=>{const z=this.add.zone(x,y,w,h);this.physics.add.existing(z,true);this.solids.add(z);return z;};
    // المعالم
    O.landmarks.forEach(l=>{this.add.image(l.x,l.y,`lm${l.k}`).setOrigin(.5,1).setDepth(l.y);const f=l.foot;solid((f.x+f.w/2)*T,(f.y+f.h/2)*T+8,f.w*T,f.h*T-8);});
    // الأشجار الكبيرة
    O.trees.forEach((t,i)=>{this.add.image(t.x,t.y,`tr_${t.kind}${i%3}`).setOrigin(.5,1).setDepth(t.y);solid(t.x,t.y-4,8,6);});
    // اللاعب
    const st=S.pos||O.spawn;this.player=this.physics.add.sprite(st.x*T+8,st.y*T+8,'p_down0');
    this.player.body.setSize(10,6).setOffset(3,10);this.player.setCollideWorldBounds(true);this.physics.add.collider(this.player,layer);this.physics.add.collider(this.player,this.solids);
    this.dir='down';this.anim=0;this.animT=0;
    // الشيوخ
    this.npcs=this.physics.add.staticGroup();this.npcList=[];
    O.npcs.forEach(n=>{const s=this.npcs.create(n.tx*T+8,n.ty*T+8,'sh'+(n.i%10)).setDepth(n.ty*T+8);s.body.setSize(12,8).setOffset(2,8);s.refreshBody();
      const mark=this.add.image(s.x,s.y-15,'bang').setDepth(5000);this.tweens.add({targets:mark,y:mark.y-3,duration:500,yoyo:true,repeat:-1});n.sprite=s;n.mark=mark;this.npcList.push(n);});
    this.physics.add.collider(this.player,this.npcs);
    // الأهالي
    this.vill=this.physics.add.group();O.villagerSpots.forEach((v,i)=>{const s=this.vill.create(v.x*T+8,v.y*T+8,`v${i%5}_down0`);s.vk=i%5;s.k=v.k;s.dir='down';s.t=0;s.body.setSize(10,6).setOffset(3,10);s.setCollideWorldBounds(true);});
    this.physics.add.collider(this.vill,layer);this.physics.add.collider(this.vill,this.solids);this.physics.add.collider(this.vill,this.npcs);this.physics.add.collider(this.player,this.vill);
    // الزعماء والبوابات
    this.bossList=[];O.bosses.forEach(b=>{const s=this.physics.add.staticSprite(b.x*T,b.y*T,`b${b.k}_0`).setDepth(b.y*T+14);s.body.setSize(26,18).setOffset(3,12);s.refreshBody();
      const aura=this.add.image(s.x,s.y+6,'glow').setTint(0xff4a4a).setAlpha(.5).setScale(1.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(s.depth-1);this.tweens.add({targets:aura,alpha:.2,duration:900,yoyo:true,repeat:-1});
      b.sprite=s;b.aura=aura;this.bossList.push(b);this.physics.add.collider(this.player,s);});
    O.gates.forEach(g=>{g.bars=g.tiles.map(([x,y])=>{const z=this.add.zone(x*T+8,y*T+8,T,T);this.physics.add.existing(z,true);this.physics.add.collider(this.player,z);return z;});});
    // الشبهات
    this.foes=this.physics.add.group();REG.forEach(R=>{for(let i=0;i<3;i++)this.spawnFoe(R.k,i);});
    this.physics.add.collider(this.foes,layer);this.physics.add.collider(this.foes,this.solids);this.physics.add.collider(this.foes,this.npcs);
    this.physics.add.overlap(this.player,this.foes,(p,f)=>this.touchFoe(f));
    // الإضاءة والليل
    this.lights=[];O.lamps.forEach(([x,y])=>this.lights.push(this.add.image(x*T+8,y*T+3,'glow').setScale(1.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(4000).setAlpha(0)));
    O.windows.forEach(([x,y])=>this.lights.push(this.add.image(x*T+8,y*T+8,'glow').setScale(.55).setTint(0xffc86a).setBlendMode(Phaser.BlendModes.ADD).setDepth(4000).setAlpha(0)));
    this.night=this.add.rectangle(0,0,4000,4000,0x1a1446,1).setOrigin(0).setScrollFactor(0).setDepth(3900).setAlpha(0);
    // الغيوم والطيور
    this.clouds=[];for(let i=0;i<7;i++)this.clouds.push(this.add.image(Math.random()*MW*T,Math.random()*MH*T,'cloud').setScale(2+Math.random()).setAlpha(.16).setDepth(4500));
    this.birds=[];this.nextBirds=4000;
    // الجسيمات حسب الأرض
    this.makeAmbient();
    this.dust=this.add.particles(0,0,'dust',{lifespan:400,speed:{min:5,max:15},scale:{start:1,end:0},alpha:{start:.8,end:0},emitting:false}).setDepth(1);
    // الماء المتحرك
    this.time.addEvent({delay:650,loop:true,callback:()=>{this.wf^=1;O.water.forEach(([x,y])=>{const k=Math.floor(x/RW)+ (y>=RH?4:0);const R=REG.find(R=>x>=R.x0&&x<R.x0+RW&&y>=R.y0&&y<R.y0+RH);this.layer.putTileAt(R.k*NK+(this.wf?K.water2:K.water),x,y);});}});
    // الكاميرا
    const cam=this.cameras.main;cam.setBounds(0,0,MW*T,MH*T);cam.startFollow(this.player,true,.12,.12);cam.setBackgroundColor('#1d1a2b');this.fitZoom();this.scale.on('resize',()=>this.fitZoom());
    // المدخلات
    this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ENTER,M,SHIFT',false);
    this.input.keyboard.on('keydown',e=>{if(!this.active())return;if(['Space','Enter','KeyE'].includes(e.code)){e.preventDefault();this.interact();}if(e.code==='KeyM')App.showMap();});
    this.input.on('pointerdown',ptr=>{if(!this.active()||mobile)return;const n=this.nearest(ptr.worldX,ptr.worldY,14);this.autoTo=n?{x:n.x,y:n.y+12,then:n}:{x:ptr.worldX,y:ptr.worldY};});
    this.region=-1;this.frozen=true;this.lastBattle=0;this.t0=Date.now()-DAY*0.18;
    this.time.addEvent({delay:20000,loop:true,callback:()=>{S.pos={x:this.player.x/T-.5,y:this.player.y/T-.5};App.save();}});
    Mini.init(data,O);
    this.refresh();W.ready(this);
  }
  makeAmbient(){const em=[];const zone=R=>({type:'random',source:new Phaser.Geom.Rectangle((R.x0+1)*T,(R.y0+1)*T,(RW-2)*T,(RH-2)*T)});
    REG.forEach(R=>{let cfg=null;const k=R.k;
      if(k===0||k===1||k===4)cfg={tex:'petal',c:{lifespan:6000,speedX:{min:-8,max:8},speedY:{min:4,max:12},alpha:{start:.9,end:0},rotate:{min:0,max:360},frequency:350,quantity:1}};
      if(k===2||k===5)cfg={tex:'dust',c:{lifespan:3500,speedX:{min:30,max:70},speedY:{min:-4,max:4},alpha:{start:.7,end:0},frequency:120,quantity:1}};
      if(k===3)cfg={tex:'leaf',c:{lifespan:7000,speedX:{min:-12,max:12},speedY:{min:8,max:18},rotate:{start:0,end:360},alpha:{start:1,end:.2},frequency:260,quantity:1}};
      if(k===6)cfg={tex:'mist',c:{lifespan:4000,speedY:{min:-10,max:-4},scale:{start:1,end:0},alpha:{start:.6,end:0},frequency:300,quantity:1}};
      if(k===7)cfg={tex:'fly',c:{lifespan:5000,speed:{min:3,max:10},scale:{start:1.5,end:.5},alpha:{start:0,end:1,ease:'Sine.easeInOut'},frequency:150,quantity:1,blendMode:'ADD'}};
      if(cfg){const e=this.add.particles(0,0,cfg.tex,Object.assign({emitZone:zone(R)},cfg.c)).setDepth(4600);em.push(e);}
      // فراشات حقيقية
      if(k===0||k===1||k===4||k===6)for(let i=0;i<4;i++){const b=this.add.image((R.x0+3+Math.random()*(RW-6))*T,(R.y0+3+Math.random()*(RH-6))*T,(i%2?'bf':'bfb')+'0').setDepth(4600);b.R=R;b.ph=Math.random()*10;b.bf=i%2?'bf':'bfb';(this.bfs=this.bfs||[]).push(b);}});
    this.ambient=em;}
  fitZoom(){const w=this.scale.width,h=this.scale.height;const z=Math.max(2,Math.min(4,Math.round(Math.min(w/320,h/240))));this.cameras.main.setZoom(z);}
  active(){return !this.frozen&&!App.isOpen()&&$('#dialog').hidden&&$('#battle').hidden;}
  spawnFoe(k,i){const R=REG[k];const r=rnd(k*131+i*17+Date.now()%1000);let x,y,guard=0;
    do{x=R.x0+2+(r()*(RW-4)|0);y=R.y0+2+(r()*(RH-4)|0);guard++;}while(guard<60&&(this.layer.getTileAt(x,y).collides||this.objs.npcs.some(n=>Math.abs(n.tx-x)<2&&Math.abs(n.ty-y)<2)||(Math.abs(x-R.x0-15)<5&&Math.abs(y-R.y0-9.5)<6)||Math.abs(y-R.y0-9.5)<2.5||Math.hypot(x-this.objs.regionStart[k].x,y-this.objs.regionStart[k].y)<7));
    const f=this.foes.create(x*T+8,y*T+8,`m${k}_0`);f.k=k;f.body.setSize(12,8).setOffset(2,7);f.setBounce(1);f.wander=0;f.name=FOES[(k+i)%FOES.length];return f;}
  touchFoe(f){if(!this.active()||this.time.now-this.lastBattle<1500||f.fighting||this.time.now-(this.startT||0)<6000)return;f.fighting=true;f.body.setVelocity(0,0);this.player.body.setVelocity(0,0);this.cameras.main.flash(250,255,255,255);W.foeBattle(f);}
  nearest(x,y,max){let best=null,bd=max;const chk=(type,o,s)=>{const d=Phaser.Math.Distance.Between(x,y,s.x,s.y);if(d<bd){bd=d;best={type,x:s.x,y:s.y,[type==='npc'?'n':type==='boss'?'b':'v']:o};}};
    this.npcList.forEach(n=>chk('npc',n,n.sprite));this.bossList.forEach(b=>{if(b.sprite.active)chk('boss',b,{x:b.sprite.x,y:b.sprite.y-8});});this.vill.getChildren().forEach(v=>chk('vill',v,v));return best;}
  interact(){const t=this.nearest(this.player.x,this.player.y,24);if(!t)return;this.autoTo=null;this.player.body.setVelocity(0,0);
    if(t.type==='npc')W.talkNpc(t.n);else if(t.type==='boss')W.talkBoss(t.b.k);else W.talkVillager(t.v);}
  refresh(){const S=App.S();
    this.npcList.forEach(n=>{const done=!!S.done[n.lesson];n.mark.setTexture(done?'chk':'bang');n.mark.setVisible(App.unlocked(n.lesson.split('l')[0]));});
    this.bossList.forEach(b=>{const done=App.chDone(C.chapters[b.k].id);if(done&&b.sprite.active&&b.k<7){b.sprite.disableBody(true,true);b.aura.setVisible(false);}if(b.k===7&&done)b.sprite.setAlpha(.35);});
    this.objs.gates.forEach(g=>{const open=App.chDone(C.chapters[g.k].id);g.bars.forEach(z=>{z.body.enable=!open;});});Mini.draw();}
  update(t,dt){
    const cam=this.cameras.main;
    // الليل والنهار
    const ph=((Date.now()-this.t0)%DAY)/DAY;let nf=Math.max(0,Math.cos(ph*Math.PI*2)*-1);nf=Math.min(1,nf*1.25);// 0 نهار، 1 ليل
    const extra=this.region===7?.35:0;const na=Math.min(.62,nf*.55+extra);this.night.setAlpha(na);this.lights.forEach(l=>l.setAlpha(Math.min(1,na*1.6)));Mini.setTime(nf);
    // الغيوم
    this.clouds.forEach(c=>{c.x+=dt*.008;if(c.x>MW*T+200)c.x=-200;});
    // الطيور
    this.nextBirds-=dt;if(this.nextBirds<=0&&!reduce){this.nextBirds=14000+Math.random()*12000;const y0=cam.worldView.y+20+Math.random()*cam.worldView.height*.5;const x0=cam.worldView.right+30;for(let i=0;i<4+(Math.random()*3|0);i++)this.birds.push(this.add.image(x0+i*12,y0+(i%2)*8+Math.random()*6,'bird0').setDepth(4700).setData('v',38+Math.random()*8));}
    this.birds=this.birds.filter(b=>{b.x-=b.getData('v')*dt/1000;b.y+=Math.sin(t/300+b.x)*.08;b.setTexture('bird'+(((t/180)|0)%2));if(b.x<cam.worldView.x-60){b.destroy();return false;}return true;});
    // الفراشات
    (this.bfs||[]).forEach(b=>{b.ph+=dt/1000;b.x+=Math.sin(b.ph*1.3)*.5;b.y+=Math.cos(b.ph*.9)*.35;b.setTexture(b.bf+(((t/120)|0)%2));});
    // الأعداء
    this.foes.getChildren().forEach(f=>{if(!f.active)return;f.wander-=dt;if(f.wander<=0&&!f.fighting){f.wander=1200+Math.random()*1800;const a=Math.random()*Math.PI*2,sp=Math.random()<.3?0:22;f.body.setVelocity(Math.cos(a)*sp,Math.sin(a)*sp);}
      const R=REG[f.k];const minx=(R.x0+1.5)*T,maxx=(R.x0+RW-1.5)*T,miny=(R.y0+1.5)*T,maxy=(R.y0+RH-1.5)*T;if(f.x<minx||f.x>maxx){f.body.velocity.x*=-1;f.x=Phaser.Math.Clamp(f.x,minx,maxx);}if(f.y<miny||f.y>maxy){f.body.velocity.y*=-1;f.y=Phaser.Math.Clamp(f.y,miny,maxy);}
      const fr=((t/300)|0)%2;if(fr!==f.fr){f.fr=fr;f.setTexture(`m${f.k}_${fr}`);}f.setDepth(f.y);});
    // الأهالي
    this.vill.getChildren().forEach(v=>{v.t-=dt;if(v.t<=0){v.t=1500+Math.random()*3000;if(Math.random()<.4){v.body.setVelocity(0,0);v.moving=false;}else{const a=[[1,0],[-1,0],[0,1],[0,-1]][Math.random()*4|0];v.body.setVelocity(a[0]*24,a[1]*24);v.moving=true;v.dir=a[0]?'side':(a[1]<0?'up':'down');v.setFlipX(a[0]<0);}}
      const R=REG[v.k];if(v.x<(R.x0+1.5)*T||v.x>(R.x0+RW-1.5)*T||v.y<(R.y0+1.5)*T||v.y>(R.y0+RH-1.5)*T){v.body.velocity.x*=-1;v.body.velocity.y*=-1;}
      const fr=v.moving?((t/200)|0)%2:0;v.setTexture(`v${v.vk}_${v.dir}${fr}`);v.setDepth(v.y);});
    this.bossList.forEach(b=>{if(b.sprite.active){const fr=((t/450)|0)%2;if(fr!==b.fr){b.fr=fr;b.sprite.setTexture(`b${b.k}_${fr}`);}}});
    const p=this.player;p.setDepth(p.y);
    if(!this.active()){p.body.setVelocity(0,0);this.setPrompt(null);return;}
    const k=this.keys;let vx=0,vy=0;
    if(k.LEFT.isDown||k.A.isDown)vx-=1;if(k.RIGHT.isDown||k.D.isDown)vx+=1;if(k.UP.isDown||k.W.isDown)vy-=1;if(k.DOWN.isDown||k.S.isDown)vy+=1;
    vx+=W.joy.x;vy+=W.joy.y;
    if(Math.hypot(vx,vy)>.15)this.autoTo=null;
    else if(this.autoTo){const dx=this.autoTo.x-p.x,dy=this.autoTo.y-p.y,d=Math.hypot(dx,dy);if(d<6||(this.autoTo.stuck>40)){const th=this.autoTo.then;this.autoTo=null;if(th){if(th.type==='npc')W.talkNpc(th.n);else if(th.type==='boss')W.talkBoss(th.b.k);else W.talkVillager(th.v);}}else{vx=dx/d;vy=dy/d;
      if(p.body.speed<5)this.autoTo.stuck=(this.autoTo.stuck||0)+1;else this.autoTo.stuck=0;}}
    const run=k.SHIFT.isDown;const sp=run?115:80;const L=Math.hypot(vx,vy);
    if(L>.15){p.body.setVelocity(vx/L*sp*Math.min(1,L),vy/L*sp*Math.min(1,L));
      this.dir=Math.abs(vx)>Math.abs(vy)?'side':(vy<0?'up':'down');p.setFlipX(this.dir==='side'&&vx<0);
      this.animT+=dt;if(this.animT>(run?110:160)){this.animT=0;this.anim^=1;if(this.anim===0&&!reduce)this.dust.emitParticleAt(p.x,p.y+7,run?3:1);}p.setTexture(`p_${this.dir}${this.anim}`);}
    else{p.body.setVelocity(0,0);p.setTexture(`p_${this.dir}0`);}
    this.setPrompt(this.nearest(p.x,p.y,24));
    const rk=REG.findIndex(R=>p.x>=R.x0*T&&p.x<(R.x0+RW)*T&&p.y>=R.y0*T&&p.y<(R.y0+RH)*T);if(rk>=0&&rk!==this.region){this.region=rk;W.enterRegion(rk);}
    Mini.player(p.x/T,p.y/T,this.region);
  }
  setPrompt(n){const key=n?n.type+(n.n?n.n.lesson:n.b?n.b.k:''):null;if(key===this._pk)return;this._pk=key;const el=$('#prompt');
    if(!n){el.hidden=true;return;}el.hidden=false;
    $('#promptText').textContent=n.type==='npc'?`${n.n.name}: «${App.LES[n.n.lesson].title}»`:n.type==='boss'?`👑 ${BOSS[n.b.k][0]}`:'👋 أحد أهل الأرض';$('#promptBtn').textContent=n.type==='boss'?'واجه ⚔️':'تحدّث ⏎';}
}

/* ---------- الخريطة الصغيرة ---------- */
const Mini={init(data,O){let el=$('#minimap');if(!el){el=document.createElement('div');el.id='minimap';el.innerHTML='<canvas></canvas><i id="mmDot"></i><span id="mmTime">☀️</span>';document.body.appendChild(el);el.onclick=()=>App.showMap();el.title='خريطة المنهج';}
    this.el=el;this.cv=el.querySelector('canvas');this.cv.width=MW;this.cv.height=MH;this.data=data;this.O=O;this.draw();},
  draw(){if(!this.cv)return;const c=this.cv.getContext('2d');const img=c.createImageData(MW,MH);
    for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const v=this.data[y][x],r=Math.floor(v/NK),k=v%NK,R=P.REGIONS[r];const ch=C.chapters[r];const locked=!App.unlocked(ch.id);
      let col=[K.path,K.planks,K.plaza,K.plaza2].includes(k)?R.path:[K.water,K.water2].includes(k)?R.water:[K.roof,K.door,K.window].includes(k)?R.roof:[K.tree,K.bush].includes(k)?P.shade(R.g,.55):R.g;
      let [rr,gg,bb]=[1,3,5].map(i=>parseInt(col.startsWith('#')?col.slice(i,i+2):'80',16));if(col.startsWith('rgb')){[rr,gg,bb]=col.match(/\d+/g).map(Number);}
      if(locked){const g=(rr+gg+bb)/3*.55;rr=gg=bb=g;}const i=(y*MW+x)*4;img.data[i]=rr;img.data[i+1]=gg;img.data[i+2]=bb;img.data[i+3]=255;}
    c.putImageData(img,0,0);
    this.O.bosses.forEach(b=>{if(!App.chDone(C.chapters[b.k].id)&&App.unlocked(C.chapters[b.k].id)){c.fillStyle='#e0475a';c.fillRect(b.x-1,b.y-1,3,3);}});},
  player(x,y,r){if(!this.el)return;const d=$('#mmDot');d.style.left=(x/MW*100)+'%';d.style.top=(y/MH*100)+'%';},
  setTime(nf){if(!this.el)return;const s=nf>.5?'🌙':nf>.15?'🌇':'☀️';if(this._s!==s){this._s=s;$('#mmTime').textContent=s;}}};

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
  talkVillager(v){const c=C.chapters[v.k];const rules=[];c.lessons.forEach(l=>l.blocks.forEach(b=>{if(b.type==='rule')rules.push(b.text);}));
    const tip=rules[Math.floor(Math.random()*rules.length)]||c.lessons[0].title;const short=tip.length>170?tip.slice(0,tip.lastIndexOf(' ',168))+'…':tip;
    const greet=['سمعتُ الشيخ يقول:','فائدة حفظتُها من دروس هذه الأرض:','تذكّر قبل أن تواجه الزعيم:','يتداول أهل الأرض هذه القاعدة:'][Math.floor(Math.random()*4)];
    v.body.setVelocity(0,0);App.SFX.click();this.dialog(P.big(P.person(VILLAGERS[v.vk],'down',0),6),'👋 من أهل أرض '+c.title,greet+' «'+short+'»',[['جزاك الله خيرًا',null,'sec']]);},
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
  start(){W.freeze(false);W.hearts();Music.start();if(W.scene)W.scene.startT=W.scene.time.now;$('#objective').hidden=false;if(mobile)$('#touch').hidden=false;},
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
