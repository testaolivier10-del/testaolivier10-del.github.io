/* Writes assets/covers/thumb/<course>.svg: each course cover with its drawing centered and fitted to a square, for small
   thumbnails (the Premium page course list). Run: node scripts/make-cover-thumbs.cjs (needs playwright). */
const {chromium}=require('playwright');const fs=require('fs');const D=require('path').join(__dirname,'..','assets','covers')+'/';
(async()=>{const b=await chromium.launch();const p=await b.newPage();
for(const f of fs.readdirSync(D).filter(f=>f.endsWith('.svg'))){let s=fs.readFileSync(D+f,'utf8');
await p.setContent(s.replace('<svg ','<svg width="640" height="320" '));const bb=await p.evaluate(()=>{const svg=document.querySelector('svg');const kids=[...svg.children].filter(e=>e.tagName==='g');let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const g of kids){const r=g.getBBox();const m=g.getCTM();// map corners
for(const [x,y] of [[r.x,r.y],[r.x+r.width,r.y+r.height]]){const pt=new DOMPoint(x,y).matrixTransform(m);x0=Math.min(x0,pt.x);y0=Math.min(y0,pt.y);x1=Math.max(x1,pt.x);y1=Math.max(y1,pt.y);}}return {x0,y0,x1,y1};});
const cx=(bb.x0+bb.x1)/2, cy=(bb.y0+bb.y1)/2, sc=Math.min(1, 270/(bb.x1-bb.x0), 270/(bb.y1-bb.y0));
// wrap all top-level <g> in a shifting group; recentre the glow
const i=s.indexOf('<g');const j=s.lastIndexOf('</svg>');
let out=s.slice(0,i)+`<g transform="translate(320 160) scale(${sc.toFixed(3)}) translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})">`+s.slice(i,j)+'</g></svg>';
out=out.replace(/cx="\.7\d*"/,'cx=".5"');
fs.writeFileSync(D+'thumb/'+f,out);console.log(f,sc.toFixed(2));}
await b.close();})();
