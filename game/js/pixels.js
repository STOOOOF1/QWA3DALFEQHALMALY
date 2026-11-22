/* مولّد رسوم البكسل: كل الرسوم مرسومة برمجيًا، بلا صور خارجية */
(function(){
'use strict';
const T=16;
function rng(seed){let s=seed>>>0||1;return()=>((s=Math.imul(s^s>>>15,1|s)+0x6D2B79F5|0,((s^s>>>14)>>>0)/4294967296));}
function hex(c){const n=parseInt(c.slice(1),16);return[n>>16&255,n>>8&255,n&255];}
function shade(c,f){const [r,g,b]=hex(c);const k=v=>Math.max(0,Math.min(255,Math.round(f>1?v+(255-v)*(f-1):v*f)));return 'rgb('+k(r)+','+k(g)+','+k(b)+')';}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
const px=(ctx,x,y,c,w=1,h=1)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
// حدّ خارجي تلقائي حول الشكل
function outline(cv,col='#1d1a2b'){const ctx=cv.getContext('2d',{willReadFrequently:true});const {width:w,height:h}=cv;const d=ctx.getImageData(0,0,w,h).data;const A=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&d[(y*w+x)*4+3]>40;
 ctx.fillStyle=col;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(!A(x,y)&&(A(x+1,y)||A(x-1,y)||A(x,y+1)||A(x,y-1)))ctx.fillRect(x,y,1,1);}

/* ===== البلاطات ===== */
const REGIONS=[
 {g:'#6fbf5a',g2:'#5aa64a',path:'#d8b77a',roof:'#2f8f8a',water:'#3d8fd6',wall:'#7d8a96'},   // 1 مرج أخضر
 {g:'#8fb25a',g2:'#7a9c48',path:'#d6bf86',roof:'#3b8a52',water:'#3d8fd6',wall:'#8a8f7a'},   // 2 زيتوني
 {g:'#e2c27e',g2:'#d4b06a',path:'#c99a5a',roof:'#3f6fa8',water:'#3aa0c8',wall:'#b08a5a'},   // 3 صحراء
 {g:'#b8794e',g2:'#a46a42',path:'#e0c08a',roof:'#9c3d3d',water:'#4a82c0',wall:'#6e5a50'},   // 4 خريفي
 {g:'#9f93c9',g2:'#8a7fb8',path:'#d9cfe8',roof:'#5b4a9e',water:'#4b6fd0',wall:'#6e6a88'},   // 5 بنفسجي
 {g:'#d9b35a',g2:'#c9a04a',path:'#f0dca0',roof:'#b8892f',water:'#3d8fd6',wall:'#8a6a3a'},   // 6 ذهبي (السوق)
 {g:'#5fa79a',g2:'#4f9488',path:'#cfe3dd',roof:'#2f6f8f',water:'#2f7fb8',wall:'#56707a'},   // 7 فيروزي
 {g:'#4f6b8f',g2:'#45607f',path:'#c8b98a',roof:'#c9972f',water:'#2b5a9a',wall:'#3a4660'}    // 8 ليلي (المنارة)
];
const KIND={grass:0,grass2:1,flowers:2,path:3,tree:4,rock:5,water:6,wall:7,roof:8,hwall:9,door:10,window:11,planks:12,tall:13,bush:14,lamp:15,water2:16,plaza:17,plaza2:18,shore:19,fence:20,bench:21,crop:22,stump:23};
const NK=24;
const COLLIDE=[4,5,6,7,8,9,10,11,14,15,16,20,21,23];
function grassTile(ctx,ox,oy,R,r,alt){px(ctx,ox,oy,alt?R.g2:R.g,T,T);for(let i=0;i<22;i++){const x=r()*T|0,y=r()*T|0;px(ctx,ox+x,oy+y,shade(R.g,r()<.5?.82:1.14));}
 for(let i=0;i<4;i++){const x=1+r()*13|0,y=2+r()*12|0;px(ctx,ox+x,oy+y,shade(R.g,.72));px(ctx,ox+x+1,oy+y-1,shade(R.g,.72));}}
function drawTile(ctx,ox,oy,k,R,seed){const r=rng(seed);
 switch(k){
 case 0:grassTile(ctx,ox,oy,R,r,0);break;
 case 1:grassTile(ctx,ox,oy,R,r,1);break;
 case 2:grassTile(ctx,ox,oy,R,r,0);[['#ffffff','#f5d33d'],['#ff7aa8','#ffe08a'],['#ffd84a','#c9572f']].forEach((c,i)=>{const x=2+i*5+(r()*2|0),y=3+(r()*9|0);px(ctx,ox+x,oy+y-1,c[0]);px(ctx,ox+x-1,oy+y,c[0]);px(ctx,ox+x+1,oy+y,c[0]);px(ctx,ox+x,oy+y+1,c[0]);px(ctx,ox+x,oy+y,c[1]);});break;
 case 3:px(ctx,ox,oy,R.path,T,T);for(let i=0;i<26;i++)px(ctx,ox+(r()*T|0),oy+(r()*T|0),shade(R.path,r()<.5?.86:1.1));for(let i=0;i<3;i++){const x=r()*14|0,y=r()*14|0;px(ctx,ox+x,oy+y,shade(R.path,.7),2,1);}break;
 case 4:{grassTile(ctx,ox,oy,R,r,0);px(ctx,ox+7,oy+11,'#6b4428',3,5);px(ctx,ox+7,oy+11,'#7d5232',1,5);const leaf=shade(R.g,.62),leafL=shade(R.g,.8),leafH=shade(R.g,1.05);
  for(let y=0;y<12;y++)for(let x=0;x<16;x++){const dx=x-7.5,dy=y-6;if(dx*dx/56+dy*dy/34<1){px(ctx,ox+x,oy+y,dx+dy<-3?leafH:(dx+dy>4?leaf:leafL));}}
  for(let i=0;i<6;i++)px(ctx,ox+3+(r()*10|0),oy+2+(r()*8|0),leafH);px(ctx,ox+1,oy+12,'rgba(0,0,0,.18)',14,2);break;}
 case 5:grassTile(ctx,ox,oy,R,r,1);for(let y=5;y<15;y++)for(let x=2;x<14;x++){const dx=x-7.5,dy=y-10;if(dx*dx/34+dy*dy/22<1)px(ctx,ox+x,oy+y,dx+dy<-2?'#b9b2a8':(dy>2?'#7c756c':'#9a938a'));}px(ctx,ox+5,oy+8,'#d4cec4',2,1);break;
 case 6:px(ctx,ox,oy,R.water,T,T);for(let i=0;i<4;i++){const y=2+i*4+(r()*2|0),x=r()*10|0;px(ctx,ox+x,oy+y,shade(R.water,1.35),4,1);px(ctx,ox+x+4,oy+y+1,shade(R.water,1.2),2,1);}for(let i=0;i<10;i++)px(ctx,ox+(r()*T|0),oy+(r()*T|0),shade(R.water,.85));break;
 case 7:px(ctx,ox,oy,R.wall,T,T);for(let row=0;row<4;row++){const y=row*4;px(ctx,ox,oy+y,shade(R.wall,.65),T,1);const off=row%2?0:4;for(let x=off;x<T;x+=8)px(ctx,ox+x,oy+y,shade(R.wall,.65),1,4);px(ctx,ox,oy+y+1,shade(R.wall,1.18),T,1);}break;
 case 8:px(ctx,ox,oy,R.roof,T,T);for(let y=0;y<T;y+=4){px(ctx,ox,oy+y+3,shade(R.roof,.7),T,1);for(let x=(y/4%2)*3;x<T;x+=6)px(ctx,ox+x,oy+y,shade(R.roof,.8),1,3);px(ctx,ox,oy+y,shade(R.roof,1.2),T,1);}break;
 case 9:case 10:case 11:{px(ctx,ox,oy,'#efe1c4',T,T);for(let y=3;y<T;y+=5)px(ctx,ox,oy+y,'#d8c6a2',T,1);px(ctx,ox,oy,'#c4ad86',T,2);
  if(k===10){px(ctx,ox+4,oy+5,'#6b4428',8,11);px(ctx,ox+5,oy+4,'#6b4428',6,1);px(ctx,ox+5,oy+6,'#7d5232',6,10);px(ctx,ox+10,oy+10,'#f5d33d');}
  if(k===11){px(ctx,ox+4,oy+5,'#6b4428',8,7);px(ctx,ox+5,oy+6,'#8fd3e8',6,5);px(ctx,ox+7,oy+6,'#6b4428',1,5);px(ctx,ox+5,oy+8,'#6b4428',6,1);}break;}
 case 12:px(ctx,ox,oy,'#a5703e',T,T);for(let x=0;x<T;x+=4){px(ctx,ox+x,oy,'#7d5232',1,T);px(ctx,ox+x+1,oy,'#b9844e',1,T);}px(ctx,ox+2,oy+5,'#5a3a20');px(ctx,ox+10,oy+11,'#5a3a20');break;
 case 13:grassTile(ctx,ox,oy,R,r,0);for(let i=0;i<7;i++){const x=1+i*2+(r()*2|0);px(ctx,ox+x,oy+8,shade(R.g,.65),1,7);px(ctx,ox+x,oy+6+(r()*3|0),shade(R.g,1.15),1,2);}break;
 case 14:grassTile(ctx,ox,oy,R,r,0);for(let y=4;y<15;y++)for(let x=1;x<15;x++){const dx=x-7.5,dy=y-9.5;if(dx*dx/45+dy*dy/26<1)px(ctx,ox+x,oy+y,dy<-1?shade(R.g,.9):shade(R.g,.66));}for(let i=0;i<4;i++)px(ctx,ox+3+(r()*10|0),oy+6+(r()*6|0),'#e0475a');break;
 case 15:grassTile(ctx,ox,oy,R,r,0);px(ctx,ox+7,oy+5,'#3a3040',2,11);px(ctx,ox+5,oy+1,'#3a3040',6,5);px(ctx,ox+6,oy+2,'#ffd86a',4,3);px(ctx,ox+4,oy+14,'#3a3040',8,2);break;
 case 16:px(ctx,ox,oy,shade(R.water,.95),T,T);for(let i=0;i<4;i++){const y=1+i*4+(r()*2|0),x=2+(r()*10|0);px(ctx,ox+x,oy+y,shade(R.water,1.4),3,1);px(ctx,ox+x-3,oy+y+1,shade(R.water,1.15),2,1);}for(let i=0;i<10;i++)px(ctx,ox+(r()*T|0),oy+(r()*T|0),shade(R.water,.85));break;
 case 17:case 18:{const b=k===17?'#e9dcc0':'#ddcda9';px(ctx,ox,oy,b,T,T);for(let y=0;y<T;y+=8){px(ctx,ox,oy+y,shade(b,.8),T,1);const off=(y/8)%2?4:0;for(let x=off;x<T;x+=8)px(ctx,ox+x,oy+y,shade(b,.8),1,8);}for(let i=0;i<8;i++)px(ctx,ox+(r()*T|0),oy+(r()*T|0),shade(b,1.08));break;}
 case 19:grassTile(ctx,ox,oy,R,r,0);px(ctx,ox,oy+10,R.path,T,6);for(let x=0;x<T;x+=2)px(ctx,ox+x,oy+9+(r()*2|0),shade(R.path,.85));break;
 case 20:grassTile(ctx,ox,oy,R,r,0);px(ctx,ox,oy+6,'#8a5a32',T,2);px(ctx,ox,oy+11,'#8a5a32',T,2);[1,7,13].forEach(x=>{px(ctx,ox+x,oy+3,'#6b4428',2,12);px(ctx,ox+x,oy+3,'#a5703e',1,12);});break;
 case 21:{px(ctx,ox,oy,'#e9dcc0',T,T);px(ctx,ox+1,oy+7,'#8a5a32',14,3);px(ctx,ox+1,oy+7,'#b9844e',14,1);px(ctx,ox+2,oy+10,'#5a3a20',2,4);px(ctx,ox+12,oy+10,'#5a3a20',2,4);break;}
 case 22:px(ctx,ox,oy,'#8a6a3a',T,T);for(let y=1;y<T;y+=4){px(ctx,ox,oy+y,'#6b4f2a',T,1);for(let x=1;x<T;x+=3){px(ctx,ox+x,oy+y-1,shade(R.g,.9),1,2);px(ctx,ox+x,oy+y-2,shade(R.g,1.2));}}break;
 case 23:grassTile(ctx,ox,oy,R,r,1);px(ctx,ox+4,oy+8,'#7d5232',8,6);px(ctx,ox+4,oy+7,'#c99a5a',8,2);px(ctx,ox+6,oy+7,'#a5703e',4,1);break;}
}
function tileset(){const cv=canvas(NK*T,8*T);const ctx=cv.getContext('2d');REGIONS.forEach((R,ri)=>{for(let k=0;k<NK;k++)drawTile(ctx,k*T,ri*T,k,R,ri*97+k*13+5);});return cv;}
// بلاطة الماء المتحركة: إطاران
function waterFrame(R,f){const cv=canvas(T,T);drawTile(cv.getContext('2d'),0,0,6,R,f*31+7);return cv;}

/* ===== الشخصيات ===== */
// dir: down|up|side ، frame: 0|1
function person(o,dir,frame){const cv=canvas(T,T);const c=cv.getContext('2d');
 const robe=o.robe||'#f4f1ea',robeS=shade(robe,.82),skin=o.skin||'#e2b48c',cloth=o.head||'#ffffff',pat=o.pat||null,agal='#262230';
 // ظل
 px(c,4,15,'rgba(0,0,0,.25)',8,1);
 // القدمان
 const l=frame?1:0;px(c,5,14-l,'#3a2a22',2,1+l);px(c,9,14-(1-l),'#3a2a22',2,2-l);
 // الثوب
 for(let y=8;y<14;y++){const w=y<10?6:7;const x0=8-Math.ceil(w/2);px(c,x0,y,robe,w+ (y>=10?1:0),1);}
 px(c,5,8,robeS,1,6);px(c,10,9,robeS,1,5);
 if(o.bisht){px(c,4,8,o.bisht,2,6);px(c,10,8,o.bisht,2,6);px(c,6,8,o.trim||'#d4a443',1,6);px(c,9,8,o.trim||'#d4a443',1,6);}
 // الذراعان
 const a=frame?1:0;px(c,4,9+a,skin,1,2);px(c,11,10-a,skin,1,2);
 // الرأس
 if(dir!=='up'){px(c,5,4,skin,6,4);}
 // غطاء الرأس
 const cw=(x,y,w,h)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)px(c,x+i,y+j,pat&&((x+i+y+j)%2)?pat:cloth);};
 if(o.cap){px(c,5,2,cloth,6,2);px(c,5,4,shade(cloth,.85),6,1);}
 else{cw(4,1,8,3);if(dir==='down'){cw(4,4,1,5);cw(11,4,1,5);}if(dir==='side'){cw(4,4,2,5);}if(dir==='up'){cw(4,4,8,5);}if(!o.noAgal)px(c,4,2,agal,8,1);}
 // الوجه
 if(dir==='down'){px(c,6,5,'#1d1a2b');px(c,9,5,'#1d1a2b');if(o.beard){px(c,5,7,o.beard,6,2);px(c,6,9,o.beard,4,1);}else px(c,7,7,shade(skin,.8),2,1);}
 if(dir==='side'){px(c,9,5,'#1d1a2b');if(o.beard){px(c,7,7,o.beard,4,2);}px(c,11,6,skin);}
 if(o.book&&dir!=='up'){px(c,dir==='side'?10:11,10,'#7a5a16',2,3);px(c,dir==='side'?10:11,10,'#d4a443',2,1);}
 outline(cv);return cv;}
function slime(col,frame){const cv=canvas(T,T);const c=cv.getContext('2d');const h=frame?7:8,top=15-h-(frame?0:1);
 px(c,3,15,'rgba(0,0,0,.25)',10,1);
 for(let y=0;y<h+2;y++)for(let x=0;x<16;x++){const dx=x-7.5,dy=y-(h+1);const rx=frame?7:6.2,ry=h+1;if(dx*dx/(rx*rx)+dy*dy/(ry*ry)<1&&y<=h+1)px(c,x,top+y,y<3?shade(col,1.25):(y>h-1?shade(col,.75):col));}
 px(c,5,top+3,'#fff',2,2);px(c,9,top+3,'#fff',2,2);px(c,6,top+4,'#1d1a2b');px(c,9,top+4,'#1d1a2b');px(c,5,top+2,'#1d1a2b',2,1);px(c,9,top+2,'#1d1a2b',2,1);
 px(c,7,top+6,'#1d1a2b',2,1);px(c,4,top+1,'rgba(255,255,255,.6)',2,1);outline(cv);return cv;}
function boss(col,frame){const S=32;const cv=canvas(S,S);const c=cv.getContext('2d');
 px(c,6,31,'rgba(0,0,0,.3)',20,1);
 // العباءة
 for(let y=8;y<31;y++){const w=10+Math.floor((y-8)*0.55)+(frame&&y>26?1:0);px(c,16-w,y,shade(col,.55),w*2,1);px(c,16-w,y,shade(col,.4),2,1);px(c,16+w-2,y,shade(col,.4),2,1);}
 for(let y=12;y<31;y++)px(c,15,y,shade(col,.8),2,1);
 // القلنسوة
 for(let y=2;y<14;y++)for(let x=6;x<26;x++){const dx=x-15.5,dy=y-9;if(dx*dx/70+dy*dy/50<1)px(c,x,y,shade(col,.5));}
 px(c,11,8,'#120f1c',10,6);
 // عيون متوهجة
 const e=frame?'#ff5a5a':'#ffb03a';px(c,12,10,e,3,2);px(c,18,10,e,3,2);
 // التاج
 px(c,10,1,'#d4a443',12,3);[10,14,18,21].forEach(x=>px(c,x,0,'#d4a443',1,1));px(c,15,2,'#e0475a',2,1);
 // يدان مع لفافة
 px(c,5,18-frame,'#d9c2a0',3,3);px(c,24,18+frame,'#d9c2a0',3,3);px(c,25,14+frame,'#f1e3c2',4,6);px(c,25,14+frame,'#b9a37a',4,1);
 outline(cv);return cv;}
function heart(full){const cv=canvas(9,8);const c=cv.getContext('2d');const col=full?'#e0475a':'#5a5466';const m=['.xx...xx.','xxxx.xxxx','xxxxxxxxx','xxxxxxxxx','.xxxxxxx.','..xxxxx..','...xxx...','....x....'];
 m.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='x')px(c,x,y,col);}));if(full)px(c,2,1,'#ff9aa8');return cv;}
function bang(col){const cv=canvas(8,10);const c=cv.getContext('2d');px(c,1,0,col,6,10);px(c,0,1,col,8,8);px(c,3,2,'#1d1a2b',2,4);px(c,3,7,'#1d1a2b',2,1);return cv;}
function check(){const cv=canvas(8,10);const c=cv.getContext('2d');px(c,1,0,'#2a7a4f',6,10);px(c,0,1,'#2a7a4f',8,8);[[2,5],[3,6],[4,5],[5,4],[6,3]].forEach(([x,y])=>px(c,x,y,'#fff'));return cv;}

/* ===== أشجار كبيرة ومعالم وأهالٍ وتأثيرات ===== */
function bigTree(R,kind,seed){const r=rng(seed);const W=32,H=40;const cv=canvas(W,H);const c=cv.getContext('2d');
 px(c,8,37,'rgba(0,0,0,.22)',16,3);
 if(kind==='palm'){px(c,15,14,'#8a6440',3,24);for(let y=14;y<38;y+=3)px(c,15,y,'#6b4428',3,1);const fr=['#4f8a2a','#6fae3a','#3f7020'];
  for(let a=0;a<7;a++){const ang=a/7*Math.PI*2;for(let t=0;t<12;t++){const x=16+Math.cos(ang)*t,y=13+Math.sin(ang)*t*0.55+t*t*0.04;px(c,x|0,y|0,fr[t%3],2,1);}}px(c,14,12,'#8a5a2a',4,3);}
 else{const leaf=kind==='autumn'?['#c9572f','#e08a3a','#a8402a']:kind==='night'?['#2f4a6a','#3f5f85','#24395a']:kind==='blossom'?['#e8a0c0','#f5c4d8','#c97aa0']:[shade(R.g,.55),shade(R.g,.75),shade(R.g,.95)];
  px(c,13,24,'#6b4428',6,14);px(c,13,24,'#8a5a32',2,14);px(c,11,35,'#6b4428',10,2);
  const blob=(cx,cy,rx,ry,col)=>{for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++)if(x*x/(rx*rx)+y*y/(ry*ry)<=1)px(c,cx+x,cy+y,col);};
  blob(16,15,13,11,leaf[0]);blob(13,12,9,7,leaf[1]);blob(19,11,7,6,leaf[1]);blob(12,9,4,3,leaf[2]);for(let i=0;i<30;i++)px(c,4+(r()*24|0),5+(r()*18|0),leaf[r()*3|0]);}
 outline(cv,'rgba(29,26,43,.85)');return cv;}
function landmark(k,R){const cv=canvas(128,96);const c=cv.getContext('2d');const st='#efe3cc',st2='#d8c6a2',dk='#4b3a2a',gold='#d4a443',rf=R.roof;
 const box=(x,y,w,h,col,edge)=>{px(c,x,y,col,w,h);if(edge)px(c,x,y,edge,w,1);};
 const dome=(cx,cy,rad,col)=>{for(let y=-rad;y<=0;y++)for(let x=-rad;x<=rad;x++)if(x*x+y*y<=rad*rad)px(c,cx+x,cy+y,x<-rad/3?shade(col,1.2):(x>rad/3?shade(col,.8):col));};
 const arch=(x,y,w,h)=>{px(c,x,y+2,dk,w,h-2);px(c,x+1,y,dk,w-2,2);};
 px(c,6,90,'rgba(0,0,0,.22)',116,6);
 switch(k){
 case 0:box(14,40,100,52,st,st2);for(let i=0;i<6;i++){box(20+i*16,48,6,44,st2);px(c,20+i*16,48,'#fff',2,44);}box(10,34,108,8,rf);dome(64,34,22,rf);px(c,63,6,gold,2,8);arch(56,68,16,24);box(30,22,8,12,st);box(90,22,8,12,st);break; // مكتبة
 case 1:box(48,70,32,22,st,st2);box(61,20,6,52,gold);box(28,18,72,5,gold);[34,94].forEach(x=>{px(c,x-1,23,dk,1,22);px(c,x+1,23,dk,1,22);dome(x,52,14,rf);box(x-14,48,28,4,shade(rf,.8));});px(c,58,12,gold,12,8);break; // ميزان
 case 2:for(let y=60;y<92;y++)for(let x=8;x<120;x++){const dx=(x-64)/56,dy=(y-76)/16;if(dx*dx+dy*dy<1)px(c,x,y,dy<-.3?'#7cc8e8':'#3aa0c8');}[[20,30],[100,28],[40,18],[84,16]].forEach(([x,y])=>{const t=bigTree(R,'palm',x);c.drawImage(t,x-16,y);});break; // واحة
 case 3:box(20,30,88,62,'#b8a68a','#d0c0a0');for(let x=20;x<108;x+=8)box(x,22,5,8,'#b8a68a');box(46,10,36,82,'#a8967a');for(let x=46;x<82;x+=7)box(x,4,4,6,'#a8967a');arch(56,62,16,30);px(c,62,22,dk,4,8);px(c,30,50,dk,4,6);px(c,94,50,dk,4,6);px(c,63,0,rf,10,6);px(c,62,0,dk,1,14);break; // قلعة
 case 4:box(48,14,32,78,st,st2);for(let y=20;y<88;y+=12){px(c,48,y,st2,32,1);px(c,61,y+3,dk,6,6);}dome(64,14,16,rf);px(c,63,-2,gold,2,6);box(40,86,48,6,st2);break; // برج
 case 5:[[10,40,rf],[48,30,'#e0475a'],[86,40,shade(rf,1.3)]].forEach(([x,y,col])=>{px(c,x+2,y+20,dk,2,34);px(c,x+30,y+20,dk,2,34);for(let i=0;i<20;i++)px(c,x+16-i*0.8-14+i*0.8,y+i,col,Math.max(2,i*1.7),1);for(let i=0;i<34;i+=6)px(c,x+i,y+18,shade(col,.75),3,4);box(x+4,y+40,26,10,'#a5703e','#c99a5a');[['#e0475a',8],['#f5d33d',16],['#6fbf5a',22]].forEach(([fc,fx])=>px(c,x+fx,y+37,fc,4,3));});break; // سوق
 case 6:box(24,40,80,52,st,st2);dome(64,40,26,rf);box(40,40,48,4,gold);arch(54,62,20,30);px(c,62,74,gold,4,4);for(let x=30;x<100;x+=60)box(x,52,8,12,dk);px(c,63,10,gold,2,6);break; // خزانة
 case 7:for(let y=8;y<92;y++){const w=10+(y-8)*0.18;px(c,64-w,y,(y/10|0)%2?st:'#e0475a',w*2,1);}box(48,2,32,10,'#3a3040');px(c,52,4,'#ffe08a',24,6);dome(64,2,10,rf);box(44,86,40,6,st2);break; // منارة
 }
 outline(cv,'rgba(29,26,43,.9)');return cv;}
function glow(col='255,214,120'){const s=64;const cv=canvas(s,s);const c=cv.getContext('2d');const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,`rgba(${col},.9)`);g.addColorStop(.35,`rgba(${col},.35)`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.fillRect(0,0,s,s);return cv;}
function cloud(){const cv=canvas(160,80);const c=cv.getContext('2d');[[50,40,40],[90,36,46],[120,44,30]].forEach(([x,y,r])=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(10,10,30,.55)');g.addColorStop(1,'rgba(10,10,30,0)');c.fillStyle=g;c.fillRect(0,0,160,80);});return cv;}
function dot(col,w=2,h=2){const cv=canvas(w,h);px(cv.getContext('2d'),0,0,col,w,h);return cv;}
function leaf(col){const cv=canvas(4,3);const c=cv.getContext('2d');px(c,1,0,col,2,1);px(c,0,1,col,4,1);px(c,1,2,shade(col,.7),2,1);return cv;}
function butterfly(col,f){const cv=canvas(5,4);const c=cv.getContext('2d');if(f){px(c,0,0,col,2,2);px(c,3,0,col,2,2);px(c,0,2,shade(col,.8),2,1);px(c,3,2,shade(col,.8),2,1);}else{px(c,1,0,col,1,3);px(c,3,0,col,1,3);}px(c,2,0,'#1d1a2b',1,4);return cv;}
function bird(f){const cv=canvas(7,4);const c=cv.getContext('2d');const k='#2a2438';if(f){px(c,0,0,k);px(c,1,1,k);px(c,2,2,k);px(c,3,2,k);px(c,4,1,k);px(c,5,0,k);px(c,6,0,k);}else{px(c,0,2,k);px(c,1,1,k);px(c,2,1,k);px(c,3,2,k);px(c,4,1,k);px(c,5,1,k);px(c,6,2,k);}return cv;}

// صورة مكبّرة لاستعمالها في DOM
function big(cv,scale=6){const o=canvas(cv.width*scale,cv.height*scale);const c=o.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(cv,0,0,o.width,o.height);return o.toDataURL();}
window.PIX={T,NK,REGIONS,KIND,COLLIDE,tileset,bigTree,landmark,glow,cloud,dot,leaf,butterfly,bird,waterFrame,person,slime,boss,heart,bang,check,big,shade};
})();
