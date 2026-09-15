import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
const axePath = createRequire(import.meta.url).resolve('axe-core');
const ROOT='/home/user/testaolivier10-del.github.io';
const T={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const server=createServer((q,r)=>{let p=join(ROOT,decodeURIComponent(q.url.split('?')[0]));
  if(existsSync(p)&&statSync(p).isDirectory())p=join(p,'index.html');
  if(!existsSync(p)){r.writeHead(404);return r.end('x');}
  r.writeHead(200,{'Content-Type':T[extname(p)]||'application/octet-stream'});r.end(readFileSync(p));});
await new Promise(r=>server.listen(8789,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const TOPICS=['retrosynthesis','carbon-carbon-bonds','functional-group-interconversion','protecting-groups','multistep-synthesis'];
let bad=0;
for(const t of TOPICS){
  const page=await b.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  await page.goto(`http://localhost:8789/ochem/lessons/${t}.html`);
  for(let i=0;i<60;i++){ if(await page.$('#card .step-title')) break; await page.waitForTimeout(100); }
  let axeRun=false;
  for(let g=0;g<60;g++){
    if((await page.$$('.radical-sort')).length && !axeRun){
      await page.addScriptTag({path:axePath});
      const r=await page.evaluate(async()=>await window.axe.run(document,{rules:{region:{enabled:false}}}));
      const v=r.violations.filter(x=>['serious','critical'].includes(x.impact));
      if(v.length){ bad++; console.log(`  ${t} axe: ${v.map(x=>x.id).join(', ')}`); }
      axeRun=true;
    }
    for(let pass=0;pass<8;pass++){
      const btns=await page.$$('.radical-sort .choice-btn:not([disabled])');
      if(!btns.length) break;
      for(const btn of btns){ await btn.click().catch(()=>{}); await page.waitForTimeout(20);
        if(await page.$('#nextBtn:not([disabled])')) break; }
      if(await page.$('#nextBtn:not([disabled])')) break;
    }
    const ch=await page.$$('#card .choice-row .choice-btn');
    if(ch.length){ for(const c of ch){ await c.click().catch(()=>{}); await page.waitForTimeout(20);
      if(await page.$('#card .feedback.good')) break; } }
    const n=await page.$('#nextBtn:not([disabled])');
    if(n){ await n.click(); await page.waitForTimeout(40); continue; }
    if(await page.$('#doneBox .btn-press')) break;
    await page.waitForTimeout(40);
  }
  const st=await page.evaluate(k=>({
    prog:JSON.parse(localStorage.getItem('ochem_progress')||'{}')[k],
    concepts:Object.keys(JSON.parse(localStorage.getItem('ochem_mastery_v1')||'{}').concepts||{}),
  }), t);
  const ok = st.prog && st.prog.completed && !errs.length;
  if(!ok) bad++;
  console.log(`${ok?'OK  ':'FAIL'} ${t.padEnd(34)} completed=${!!(st.prog&&st.prog.completed)} concepts=[${st.concepts}] errors=${errs.length||'none'}`);
  await page.close();
}
console.log(bad? `\n${bad} PROBLEM(S)` : '\nall five synthesis lessons complete cleanly, axe clean');
await b.close(); server.close();
