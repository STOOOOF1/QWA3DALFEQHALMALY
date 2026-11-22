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
const KIND={grass:0,grass2:1,flowers:2,path:3,tree:4,rock:5,water:6,wall:7,roof:8,hwall:9,door:10,window:11,planks:12,tall:13,bush:14,lamp:15};
const COLLIDE=[4,5,6,7,8,9,10,11,14,15];
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
 case 15:grassTile(ctx,ox,oy,R,r,0);px(ctx,ox+7,oy+5,'#3a3040',2,11);px(ctx,ox+5,oy+1,'#3a3040',6,5);px(ctx,ox+6,oy+2,'#ffd86a',4,3);px(ctx,ox+4,oy+14,'#3a3040',8,2);break;}
}
function tileset(){const cv=canvas(16*T,8*T);const ctx=cv.getContext('2d');REGIONS.forEach((R,ri)=>{for(let k=0;k<16;k++)drawTile(ctx,k*T,ri*T,k,R,ri*97+k*13+5);});return cv;}
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
// صورة مكبّرة لاستعمالها في DOM
function big(cv,scale=6){const o=canvas(cv.width*scale,cv.height*scale);const c=o.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(cv,0,0,o.width,o.height);return o.toDataURL();}
window.PIX={T,REGIONS,KIND,COLLIDE,tileset,waterFrame,person,slime,boss,heart,bang,check,big,shade};
})();
