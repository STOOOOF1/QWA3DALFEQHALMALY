/* طبقة العالم: مدينة ثلاثية الأبعاد بـ three.js — كل حيّ فصل، وكل مبنى درس */
import * as THREE from 'three';

const App=window.App, C=App.C;
const canvas=document.getElementById('scene');
let renderer;
try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  if(!renderer.getContext())throw new Error('no ctx');
}catch(e){App.noGL();throw e;}

const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<700;
const LOW=mobile||(navigator.hardwareConcurrency||8)<=4;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
renderer.setPixelRatio(Math.min(devicePixelRatio,LOW?1.5:2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=!LOW;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;

const scene=new THREE.Scene();
const SKY_TOP=new THREE.Color('#5b8fb0'),SKY_BOT=new THREE.Color('#f6cf92');
scene.fog=new THREE.Fog('#f0d3a4',70,190);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,0.5,400);

/* ---- السماء ---- */
{const g=new THREE.SphereGeometry(300,24,16);const cols=[];const p=g.attributes.position;
 for(let i=0;i<p.count;i++){const t=Math.max(0,Math.min(1,(p.getY(i)+20)/180));const c=SKY_BOT.clone().lerp(SKY_TOP,t);cols.push(c.r,c.g,c.b);}
 g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
 scene.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false})));
 const sun=new THREE.Mesh(new THREE.SphereGeometry(9,20,12),new THREE.MeshBasicMaterial({color:'#ffe2a8',fog:false}));sun.position.set(-160,55,-170);scene.add(sun);}

/* ---- الإضاءة ---- */
scene.add(new THREE.HemisphereLight('#fff1d6','#8a6a45',1.5));
const sunL=new THREE.DirectionalLight('#ffe0b0',2.6);sunL.position.set(-60,80,-50);
if(!LOW){sunL.castShadow=true;sunL.shadow.mapSize.set(2048,2048);const s=sunL.shadow.camera;s.left=-45;s.right=45;s.top=45;s.bottom=-45;s.far=250;sunL.shadow.bias=-0.0004;}
scene.add(sunL);scene.add(sunL.target);

/* ---- مواد ---- */
const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85,metalness:0},o));
const mSand=M('#dcc59b'),mPath=M('#c9ab7c'),mStone=M('#efe3cc'),mStone2=M('#e2d2b3'),mDark=M('#4b3a2a'),mGold=M('#d4a443',{metalness:.5,roughness:.35}),
      mWater=M('#3fa3b5',{roughness:.15,metalness:.2}),mLeaf=M('#5f8a3c'),mTrunk=M('#8a6440'),mGlass=M('#9fd6e0',{emissive:'#3b8796',emissiveIntensity:.3});
function sh(m,cast=true,rec=true){m.castShadow=cast&&!LOW;m.receiveShadow=rec;return m;}

/* ---- الأرض والطرق ---- */
const ground=sh(new THREE.Mesh(new THREE.CircleGeometry(170,64),mSand),false,true);ground.rotation.x=-Math.PI/2;scene.add(ground);
const RING=34,DR=58;
{const ring=sh(new THREE.Mesh(new THREE.RingGeometry(RING-2.5,RING+2.5,72),mPath),false);ring.rotation.x=-Math.PI/2;ring.position.y=.02;scene.add(ring);
 const plaza=sh(new THREE.Mesh(new THREE.CircleGeometry(14,48),mStone2),false);plaza.rotation.x=-Math.PI/2;plaza.position.y=.03;scene.add(plaza);}

/* ---- الساحة المركزية: النافورة ولوحة المنهج ---- */
const targets=[];// {pos,r,type,id,label}
const clickables=[];// meshes -> target
{const base=sh(new THREE.Mesh(new THREE.CylinderGeometry(6,6.4,1,40),mStone));base.position.y=.5;scene.add(base);
 const water=new THREE.Mesh(new THREE.CylinderGeometry(5.3,5.3,.2,40),mWater);water.position.y=1;scene.add(water);
 const ob=sh(new THREE.Mesh(new THREE.CylinderGeometry(.7,1.2,9,8),mStone));ob.position.y=5;scene.add(ob);
 const top=new THREE.Mesh(new THREE.OctahedronGeometry(1.2),mGold);top.position.y=10.3;scene.add(top);top.userData.spin=true;spinners_push(top);
 const t={pos:new THREE.Vector3(0,0,0),r:9,type:'map',label:'📜 لوحة المنهج: خريطة الأحياء والدروس'};targets.push(t);[base,ob,top].forEach(m=>{m.userData.target=t;clickables.push(m);});}
function spinners_push(m){(window.__sp=window.__sp||[]).push(m);}

/* ---- أشجار ومصابيح (Instanced) ---- */
function scatter(n,minR,maxR,avoid){const pts=[];let guard=0;while(pts.length<n&&guard++<n*30){const a=Math.random()*Math.PI*2,r=minR+Math.random()*(maxR-minR);const p=new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r);if(avoid(p))continue;pts.push(p);}return pts;}
const districtCenters=C.chapters.map((c,i)=>{const a=-Math.PI/2+i*Math.PI*2/C.chapters.length;return new THREE.Vector3(Math.cos(a)*DR,0,Math.sin(a)*DR);});
const nearDistrict=p=>districtCenters.some(d=>d.distanceTo(p)<21)||p.length()<RING+6||districtCenters.some(d=>{const t=p.dot(d)/d.lengthSq();return t>0&&t<1&&p.clone().sub(d.clone().multiplyScalar(t)).length()<5;});
{const pts=scatter(LOW?70:140,18,150,nearDistrict);const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.25,.4,4,6),mTrunk,pts.length);const leaf=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.8,0),mLeaf,pts.length);
 const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3();pts.forEach((p,i)=>{const k=.8+Math.random()*.6;s.set(k,k,k);m4.compose(new THREE.Vector3(p.x,2*k,p.z),q,s);trunk.setMatrixAt(i,m4);m4.compose(new THREE.Vector3(p.x,4.6*k,p.z),q,s);leaf.setMatrixAt(i,m4);});
 sh(trunk);sh(leaf);scene.add(trunk,leaf);}
{const n=24;const post=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.15,4,6),mDark,n);const bulb=new THREE.InstancedMesh(new THREE.SphereGeometry(.38,10,8),M('#ffd98a',{emissive:'#ffb43a',emissiveIntensity:1.4}),n);
 const m4=new THREE.Matrix4();for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=RING+3.6;m4.makeTranslation(Math.cos(a)*r,2,Math.sin(a)*r);post.setMatrixAt(i,m4);m4.makeTranslation(Math.cos(a)*r,4.1,Math.sin(a)*r);bulb.setMatrixAt(i,m4);}scene.add(post,bulb);}

/* ---- المعالم الرمزية لكل حيّ ---- */
function emblem(kind,color){const g=new THREE.Group();const mc=M(color);
 const add=(geo,mat,x,y,z,ry=0)=>{const m=sh(new THREE.Mesh(geo,mat));m.position.set(x,y,z);m.rotation.y=ry;g.add(m);return m;};
 switch(kind){
 case 'المكتبة':add(new THREE.BoxGeometry(9,6,6),mStone,0,3,0);for(let i=-3;i<=3;i+=2)add(new THREE.CylinderGeometry(.4,.4,6,10),mStone2,i*1.3,3,3.3);add(new THREE.ConeGeometry(6.5,2.6,4),mc,0,7.3,0,Math.PI/4);break;
 case 'الميزان':add(new THREE.CylinderGeometry(.5,.8,9,10),mGold,0,4.5,0);add(new THREE.BoxGeometry(9,.4,.4),mGold,0,9,0);[-4.3,4.3].forEach(x=>{add(new THREE.CylinderGeometry(.04,.04,3,4),mDark,x,7.5,0);add(new THREE.CylinderGeometry(1.6,1,.4,16),mc,x,6,0);});add(new THREE.CylinderGeometry(2,2.4,1,16),mStone,0,.5,0);break;
 case 'الجسر':{const arch=add(new THREE.TorusGeometry(5,.9,10,24,Math.PI),mStone,0,0,0);arch.rotation.z=0;add(new THREE.BoxGeometry(12,.6,3),mc,0,5.4,0);break;}
 case 'الحصن':add(new THREE.CylinderGeometry(2.6,3,10,12),mStone,0,5,0);add(new THREE.ConeGeometry(3.2,3,12),mc,0,11.5,0);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;add(new THREE.BoxGeometry(.8,.9,.8),mStone2,Math.cos(a)*2.8,10.3,Math.sin(a)*2.8);}break;
 case 'البرج':add(new THREE.CylinderGeometry(1.6,2.2,14,10),mStone,0,7,0);add(new THREE.SphereGeometry(2.2,16,10,0,Math.PI*2,0,Math.PI/2),mc,0,14,0);add(new THREE.CylinderGeometry(.1,.1,2.5,4),mGold,0,17,0);break;
 case 'السوق':[[-3,0],[3,0],[0,-3.5]].forEach(([x,z],i)=>{add(new THREE.CylinderGeometry(.12,.12,3.2,5),mDark,x,1.6,z);add(new THREE.ConeGeometry(2.6,2.2,6),i%2?mc:M('#f2e6cf'),x,4.2,z);});add(new THREE.BoxGeometry(2,1,1.2),mTrunk,0,.5,1.6);break;
 case 'الخزانة':add(new THREE.BoxGeometry(8,5,8),mStone,0,2.5,0);add(new THREE.SphereGeometry(3.6,20,12,0,Math.PI*2,0,Math.PI/2),mc,0,5,0);add(new THREE.BoxGeometry(2,3,.3),mGold,0,1.5,4.05);break;
 case 'المنارة':add(new THREE.CylinderGeometry(1.4,2.4,16,12),mStone,0,8,0);add(new THREE.CylinderGeometry(2.2,2.2,.6,12),mc,0,13.5,0);add(new THREE.CylinderGeometry(1,1.2,2.4,12),mGlass,0,17.4,0);add(new THREE.ConeGeometry(1.5,2,12),mc,0,19.6,0);break;
 default:add(new THREE.BoxGeometry(6,6,6),mc,0,3,0);}
 return g;}

/* ---- الأحياء والمباني ---- */
const districts=[];
const colliders=[];// {x,z,r}
const labelsLayer=document.createElement('div');labelsLayer.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:3';document.body.appendChild(labelsLayer);
const beaconGeo=new THREE.OctahedronGeometry(.7);
C.chapters.forEach((c,ci)=>{
  const center=districtCenters[ci];const toCenter=center.clone().negate().normalize();const ang=Math.atan2(center.x,center.z);
  const col=new THREE.Color(c.color);const light=col.clone().lerp(new THREE.Color('#f5ead4'),.72);
  const disc=sh(new THREE.Mesh(new THREE.CircleGeometry(19,48),M(light)),false);disc.rotation.x=-Math.PI/2;disc.position.set(center.x,.04,center.z);scene.add(disc);
  // طريق من الحلقة إلى الحيّ
  const road=sh(new THREE.Mesh(new THREE.PlaneGeometry(5,DR-RING-12),mPath),false);road.rotation.x=-Math.PI/2;road.rotation.z=-ang;const mid=center.clone().multiplyScalar((RING+DR-19)/2/DR);road.position.set(mid.x,.035,mid.z);scene.add(road);
  // المعلم في عمق الحيّ
  const em=emblem(c.emblem,c.color);const ep=center.clone().add(toCenter.clone().multiplyScalar(-9));em.position.copy(ep);em.rotation.y=ang+Math.PI;scene.add(em);colliders.push({x:ep.x,z:ep.z,r:5.2});
  // مباني الدروس على قوس يواجه الساحة
  const n=c.lessons.length;const lessonsObj=[];
  c.lessons.forEach((l,li)=>{const spread=Math.min(2.4,0.42*(n-1));const a=ang+Math.PI+(n===1?0:(-spread/2+spread*li/(n-1)));
    const r=12.5;const p=new THREE.Vector3(center.x+Math.sin(a)*r,0,center.z+Math.cos(a)*r);
    const g=new THREE.Group();g.position.copy(p);g.lookAt(center.x,0,center.z);g.rotateY(Math.PI);
    const h=3.2+(li%3)*.7;const body=sh(new THREE.Mesh(new THREE.BoxGeometry(3.6,h,3.6),mStone));body.position.y=h/2;g.add(body);
    const roofMat=M(c.color);const roof=sh(new THREE.Mesh(li%2?new THREE.SphereGeometry(1.9,14,8,0,Math.PI*2,0,Math.PI/2):new THREE.ConeGeometry(2.8,2,4),roofMat));roof.position.y=h+(li%2?0:1);if(!(li%2))roof.rotation.y=Math.PI/4;g.add(roof);
    const door=new THREE.Mesh(new THREE.PlaneGeometry(1.2,2),mDark);door.position.set(0,1,1.81);g.add(door);
    const arch=new THREE.Mesh(new THREE.CircleGeometry(.6,12,0,Math.PI),mDark);arch.position.set(0,2,1.81);g.add(arch);
    const beacon=new THREE.Mesh(beaconGeo,M('#ffffff',{emissive:'#ffffff',emissiveIntensity:.6}));beacon.position.y=h+3.3;g.add(beacon);spinners_push(beacon);
    scene.add(g);colliders.push({x:p.x,z:p.z,r:2.6});
    const doorPos=p.clone().add(new THREE.Vector3(center.x-p.x,0,center.z-p.z).normalize().multiplyScalar(3.2));
    const t={pos:doorPos,r:3.4,type:'lesson',id:l.id,label:`🏛️ درس: ${l.title}`};targets.push(t);[body,roof,door].forEach(m=>{m.userData.target=t;clickables.push(m);});
    lessonsObj.push({l,beacon,roofMat,body,group:g});});
  // منصة التحدي عند مدخل الحيّ
  const qp=center.clone().add(toCenter.clone().multiplyScalar(6));const ped=sh(new THREE.Mesh(new THREE.CylinderGeometry(2.6,3,1,8),mStone2));ped.position.set(qp.x,.5,qp.z);scene.add(ped);
  const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(1.1,1),M(c.color,{emissive:c.color,emissiveIntensity:.8,roughness:.3}));orb.position.set(qp.x,2.6,qp.z);scene.add(orb);spinners_push(orb);
  colliders.push({x:qp.x,z:qp.z,r:2.4});
  const qt={pos:qp.clone(),r:4.4,type:'quiz',id:c.id,label:`⚔️ تحدي حيّ ${c.title} (80% لفتح التالي)`};targets.push(qt);[ped,orb].forEach(m=>{m.userData.target=qt;clickables.push(m);});
  // حاجز القفل
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(20,20,7,48,1,true),new THREE.MeshBasicMaterial({color:'#9c3d3d',transparent:true,opacity:.15,side:THREE.DoubleSide,depthWrite:false}));wall.position.set(center.x,3.5,center.z);scene.add(wall);
  // اسم الحيّ (DOM)
  const lab=document.createElement('div');lab.className='lbl3d';lab.innerHTML=`<i style="background:${c.color}"></i>${ci+1}. ${c.title}`;labelsLayer.appendChild(lab);
  districts.push({c,center,lessonsObj,wall,orb,lab,entry:center.clone().add(toCenter.clone().multiplyScalar(13))});
});
{const st=document.createElement('style');st.textContent=`.lbl3d{position:absolute;transform:translate(-50%,-100%);background:rgba(255,253,248,.92);color:#14302f;font-weight:800;font-size:13.5px;padding:4px 10px;border-radius:10px;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,.18);display:flex;gap:6px;align-items:center;font-family:Tajawal,'Segoe UI',Tahoma,sans-serif}.lbl3d i{width:10px;height:10px;border-radius:50%}.lbl3d.lock{opacity:.7}.lbl3d.lock::before{content:"🔒"}`;document.head.appendChild(st);}

colliders.push({x:0,z:0,r:6.5});
/* ---- اللاعب ---- */
const player=new THREE.Group();
{const robe=sh(new THREE.Mesh(new THREE.CapsuleGeometry(.55,1.3,6,12),M('#0f5c5a')));robe.position.y=1.2;player.add(robe);
 const head=sh(new THREE.Mesh(new THREE.SphereGeometry(.42,16,12),M('#e7c39b')));head.position.y=2.35;player.add(head);
 const sh_=sh(new THREE.Mesh(new THREE.SphereGeometry(.46,16,10,0,Math.PI*2,0,Math.PI/2),M('#ffffff')));sh_.position.y=2.45;player.add(sh_);
 const band=new THREE.Mesh(new THREE.TorusGeometry(.42,.07,6,16),M('#c9972f'));band.rotation.x=Math.PI/2;band.position.y=2.5;player.add(band);
 const book=sh(new THREE.Mesh(new THREE.BoxGeometry(.5,.65,.15),M('#7a5a16')));book.position.set(.55,1.4,.25);player.add(book);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.1,24),new THREE.MeshBasicMaterial({color:'#c9972f',transparent:true,opacity:.7}));ring.rotation.x=-Math.PI/2;ring.position.y=.05;player.add(ring);}
player.position.set(0,0,20);scene.add(player);

/* ---- التحكم ---- */
const keys={};let paused=true,started=false,yaw=0,pitch=.42,dist=16,autoTarget=null;
addEventListener('keydown',e=>{if(App.isOpen()||document.activeElement.tagName==='INPUT')return;keys[e.key.toLowerCase()]=true;
  if((e.key==='e'||e.key==='E'||e.key==='Enter'||e.key==='ث')&&near){e.preventDefault();activate(near);}});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
// سحب لتدوير الكاميرا + نقر لاختيار مبنى
let drag=null;
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,moved:0};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved+=Math.abs(dx)+Math.abs(dy);yaw-=dx*.006;pitch=Math.max(.15,Math.min(1.1,pitch+dy*.004));drag.x=e.clientX;drag.y=e.clientY;});
canvas.addEventListener('pointerup',e=>{if(drag&&drag.moved<8)pick(e);drag=null;});
canvas.addEventListener('wheel',e=>{dist=Math.max(8,Math.min(34,dist+e.deltaY*.02));},{passive:true});
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
function pick(e){if(paused)return;ndc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(ndc,camera);const hit=ray.intersectObjects(clickables,false)[0];
  if(hit){const t=hit.object.userData.target;if(t.pos.distanceTo(player.position)<t.r+1)activate(t);else{autoTarget=t;App.toast('🚶 في الطريق إلى: '+t.label.replace(/^\S+\s/,''));}}
  else{const g=ray.intersectObject(ground)[0];if(g){autoTarget={pos:g.point.clone(),r:.8,type:'walk'};}}}
// عصا اللمس
const stick=document.getElementById('stick'),knob=document.getElementById('knob');let joy={x:0,y:0},joyId=null;
if(mobile){document.getElementById('touch').hidden=false;}
stick.addEventListener('pointerdown',e=>{joyId=e.pointerId;stick.setPointerCapture(e.pointerId);joyMove(e);});
stick.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e);});
const joyEnd=()=>{joyId=null;joy={x:0,y:0};knob.style.transform='';};stick.addEventListener('pointerup',joyEnd);stick.addEventListener('pointercancel',joyEnd);
function joyMove(e){const r=stick.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/(r.width/2),y=(e.clientY-r.top-r.height/2)/(r.height/2);const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}joy={x,y};knob.style.transform=`translate(${x*36}px,${y*36}px)`;autoTarget=null;}
document.getElementById('actBtn').onclick=()=>{if(near)activate(near);else App.showMap();};
document.getElementById('promptBtn').onclick=()=>{if(near)activate(near);};

function activate(t){autoTarget=null;for(const k in keys)keys[k]=false;
  if(t.type==='map')App.showMap();
  else if(t.type==='lesson'){const ch=t.id.split('l')[0];if(!App.unlocked(ch)){App.toast('🔒 اجتز تحدي الحيّ السابق أولًا');return;}App.openLesson(t.id);}
  else if(t.type==='quiz'){if(!App.unlocked(t.id)){App.toast('🔒 هذا الحيّ مقفل');return;}App.openQuiz(t.id);}}

/* ---- التحديث حسب التقدم ---- */
const cWhite=new THREE.Color('#ffffff'),cGold=new THREE.Color('#ffc94a'),cNext=new THREE.Color('#7fe0d0');
function refresh(){const S=App.S();
  districts.forEach(d=>{const u=App.unlocked(d.c.id);d.wall.visible=!u&&!d.wall.userData.fading;d.lab.classList.toggle('lock',!u);
    const nextL=d.c.lessons.find(l=>!S.done[l.id]);
    d.lessonsObj.forEach(o=>{const done=!!S.done[o.l.id];const m=o.beacon.material;const c=done?cGold:(u&&nextL&&nextL.id===o.l.id?cNext:cWhite);m.color.copy(c);m.emissive.copy(c);m.emissiveIntensity=done?1.2:(u?.7:.1);o.beacon.visible=u;
      o.roofMat.color.set(u?d.c.color:'#9a9a9a');});
    d.orb.material.emissiveIntensity=App.chDone(d.c.id)?2:(u?.8:.05);d.orb.visible=true;});}

/* ---- مؤثرات ---- */
const parts=[];const pGeo=new THREE.SphereGeometry(.18,6,4);
function burst(pos,color,n=40){if(reduce)return;const mat=new THREE.MeshBasicMaterial({color});for(let i=0;i<n;i++){const m=new THREE.Mesh(pGeo,mat);m.position.copy(pos);m.userData.v=new THREE.Vector3((Math.random()-.5)*10,6+Math.random()*8,(Math.random()-.5)*10);m.userData.t=0;scene.add(m);parts.push(m);}}
function celebrate(id){districts.forEach(d=>d.lessonsObj.forEach(o=>{if(o.l.id===id){const p=new THREE.Vector3();o.beacon.getWorldPosition(p);burst(p,'#ffc94a');}}));}
function unlockFx(chId){const i=C.chapters.findIndex(c=>c.id===chId);const nx=districts[i+1];if(!nx)return;nx.wall.userData.fading=1;burst(nx.center.clone().setY(4),'#7fe0d0',80);}

/* ---- الحلقة ---- */
let near=null;const promptEl=document.getElementById('prompt'),promptText=document.getElementById('promptText');
const clock=new THREE.Clock();const tmp=new THREE.Vector3();let walkPhase=0;
function step(){const dt=Math.min(.05,clock.getDelta());const t=clock.elapsedTime;
  if(!paused&&started){
    let fx=0,fz=0;if(keys['w']||keys['arrowup']||keys['ص'])fz-=1;if(keys['s']||keys['arrowdown']||keys['س'])fz+=1;if(keys['a']||keys['arrowleft']||keys['ش'])fx-=1;if(keys['d']||keys['arrowright']||keys['ي'])fx+=1;
    fx+=joy.x;fz+=joy.y;
    let mv=new THREE.Vector3();
    if(Math.hypot(fx,fz)>.1){autoTarget=null;const f=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),r=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));mv.addScaledVector(f,-fz).addScaledVector(r,fx);}
    else if(autoTarget){tmp.subVectors(autoTarget.pos,player.position);tmp.y=0;if(tmp.length()<Math.max(.6,autoTarget.r-.6)){const at=autoTarget;autoTarget=null;if(at.type!=='walk')activate(at);}else mv.copy(tmp);}
    if(mv.lengthSq()>0){mv.normalize().multiplyScalar(dt*(keys['shift']?16:11));player.position.add(mv);player.rotation.y=Math.atan2(mv.x,mv.z);walkPhase+=dt*12;
      // تصادم بسيط
      for(const c of colliders){const dx=player.position.x-c.x,dz=player.position.z-c.z,d=Math.hypot(dx,dz);if(d<c.r+.6){const k=(c.r+.6)/d;player.position.x=c.x+dx*k;player.position.z=c.z+dz*k;}}
      // جدران الأحياء المقفلة
      districts.forEach(d=>{if(d.wall.visible){const dx=player.position.x-d.center.x,dz=player.position.z-d.center.z,dd=Math.hypot(dx,dz);if(dd<20.8){const k=20.8/dd;player.position.x=d.center.x+dx*k;player.position.z=d.center.z+dz*k;if(!step.warned||t-step.warned>3){step.warned=t;App.toast('🔒 حيّ «'+d.c.title+'» مقفل: اجتز تحدي الحيّ السابق');}}}});
      const L=player.position.length();if(L>150)player.position.multiplyScalar(150/L);
      // دوران تلقائي خفيف للكاميرا خلف اللاعب
      if(!drag&&Math.hypot(fx,fz)<=.1){}
    }
    player.position.y=mv.lengthSq()>0?Math.abs(Math.sin(walkPhase))*.12:0;
    // أقرب هدف
    let best=null,bd=1e9;for(const tg of targets){const d=tg.pos.distanceTo(tmp.set(player.position.x,0,player.position.z));if(d<tg.r&&d<bd){bd=d;best=tg;}}
    if(best!==near){near=best;if(near){promptText.textContent=near.label;promptEl.hidden=false;document.body.classList.toggle('has-prompt',mobile);}else{promptEl.hidden=true;document.body.classList.remove('has-prompt');}}
  }
  // الكاميرا
  const cp=new THREE.Vector3(player.position.x+Math.sin(yaw)*Math.cos(pitch)*dist,player.position.y+Math.sin(pitch)*dist+2,player.position.z+Math.cos(yaw)*Math.cos(pitch)*dist);
  camera.position.lerp(cp,started?.12:1);camera.lookAt(player.position.x,player.position.y+2.2,player.position.z);
  if(!LOW){sunL.position.set(player.position.x-60,80,player.position.z-50);sunL.target.position.copy(player.position);}
  // دوران المنارات
  (window.__sp||[]).forEach((m,i)=>{m.rotation.y+=dt*1.2;if(!reduce)m.position.y+=Math.sin(t*2+i)*.004;});
  // الجسيمات
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.userData.t+=dt;p.userData.v.y-=18*dt;p.position.addScaledVector(p.userData.v,dt);if(p.userData.t>1.6){scene.remove(p);parts.splice(i,1);}}
  // تلاشي الحواجز
  districts.forEach(d=>{if(d.wall.userData.fading){d.wall.material.opacity-=dt*.15;d.wall.scale.y+=dt*.6;if(d.wall.material.opacity<=0){d.wall.visible=false;d.wall.userData.fading=0;d.wall.material.opacity=.15;d.wall.scale.y=1;refresh();}}});
  // أسماء الأحياء
  districts.forEach(d=>{tmp.copy(d.center).setY(10);const v=tmp.project(camera);const dd=camera.position.distanceTo(d.center);
    if(v.z<1&&dd<150&&Math.abs(v.x)<1.05&&v.y<1.05){d.lab.style.display='flex';d.lab.style.left=(v.x*.5+.5)*innerWidth+'px';d.lab.style.top=(-v.y*.5+.5)*innerHeight+'px';}else d.lab.style.display='none';});
  renderer.render(scene,camera);requestAnimationFrame(step);}
// إعادة الحجم
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});

window.World={ok:true,
  start(){started=true;paused=false;yaw=0;refresh();document.getElementById('objective').hidden=false;},
  pause(b){paused=b;if(b){for(const k in keys)keys[k]=false;autoTarget=null;}},
  refresh,celebrate,unlockFx,
  goTo(chId){const d=districts.find(d=>d.c.id===chId);if(!d)return;player.position.copy(d.entry);yaw=Math.atan2(d.entry.x-d.center.x,d.entry.z-d.center.z);refresh();}
};
refresh();
// لقطة افتتاحية: كاميرا تدور فوق المدينة حتى يبدأ اللاعب
(function intro(){if(started)return;const t=performance.now()/1000;yaw=t*.08;requestAnimationFrame(intro);})();
step();
