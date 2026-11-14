/* NREMT question meta for the readiness estimate (docs/progress-profile.md).

   The Progress page does not load the 1.2 MB bank, but the readiness model needs each answered question's exam
   domain, topic area and written difficulty. This writes them, keyed by question id, to nremt/assets/qmeta.json
   (about 30 KB), from nremt/assets/questions-core.json.

     node scripts/build-nremt-qmeta.mjs           write it
     node scripts/build-nremt-qmeta.mjs --check   fail if it is stale (CI) */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const check = process.argv.includes('--check');
const SRC = 'nremt/assets/questions-core.json', OUT = 'nremt/assets/qmeta.json';
const bank = JSON.parse(readFileSync(SRC, 'utf8'));
const dom = [], sys = [], diff = [];
function idx(list, v){ let i = list.indexOf(v); if(i < 0){ list.push(v); i = list.length - 1; } return i; }
const q = {};
for(const x of bank) q[x.id] = idx(dom, x.domain) * 100 + idx(sys, x.system) * 10 + idx(diff, x.diff || 'medium');
const out = JSON.stringify({ v: 1, dom, sys, diff, q }) + '\n';
if(check){
  if(!existsSync(OUT) || readFileSync(OUT, 'utf8') !== out){ console.error(OUT + ' is stale: run node scripts/build-nremt-qmeta.mjs'); process.exit(1); }
  console.log('nremt qmeta ok');
} else { writeFileSync(OUT, out); console.log('wrote ' + OUT + ' (' + bank.length + ' questions, ' + out.length + ' bytes)'); }
