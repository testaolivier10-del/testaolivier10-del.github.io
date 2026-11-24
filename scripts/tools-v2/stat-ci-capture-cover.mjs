import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const R='statistics/assets/';
const ctx = { console, Math }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['stat-dist.js','tools/stat-tool-math.js','tools/math/ci-capture.js']) vm.runInContext(readFileSync(R+f,'utf8'), ctx);
const M=ctx.ApStatMath, C=M.ciCapture, D=ctx.ApStatDist;
const NM=[3,4,5,6,8,10,15,20,30,50,100], LV=[]; for(let l=80;l<=99;l++) LV.push(l/100);
const out={t:{},z:{}}; const reps=+process.argv[2]||100000;
for (const n of NM){ const s={kind:'mean',mu:30,sigma:20,shape:'skewed',n}; const r=M.rng(20261123+n);
  const tt=[],tz=[]; for(let i=0;i<reps;i++){ const m=C.sample(r,s); const se=m.s/Math.sqrt(n); tt.push(Math.abs(m.est-30)/se); }
  tt.sort((a,b)=>a-b);
  const cnt=c=>{let lo=0,hi=tt.length;while(lo<hi){const mid=(lo+hi)>>1; if(tt[mid]<=c) lo=mid+1; else hi=mid;} return lo;};
  out.t[n]=LV.map(L=>+(cnt(D.invT(1-(1-L)/2,n-1))/reps*100).toFixed(1));
  out.z[n]=LV.map(L=>+(cnt(D.invNorm(1-(1-L)/2))/reps*100).toFixed(1));
  console.error(n, out.t[n][15], out.z[n][15]);
}
console.log(JSON.stringify(out));
