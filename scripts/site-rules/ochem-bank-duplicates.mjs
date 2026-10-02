/* No question appears twice in the ochem practice bank.

   Audit finding (site audit 2026-10): alcohol-reactions#7 and carbocations#26
   were the same question on the same drawing (3,3-dimethylbutan-2-ol with
   HBr), with the same four options differing only in capitalization, so mixed
   practice could serve it twice. carbocations#26 was replaced. This rule flags
   two items that share a drawing and the same option set, or the same stem
   and the same option set, compared case-insensitively. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();

export default function({ ROOT, fail }){
  const bank = JSON.parse(readFileSync(join(ROOT, 'ochem/assets/practice-bank.json'), 'utf8'));
  const seen = new Map();
  for(const topic of Object.keys(bank)){
    bank[topic].forEach((q, i) => {
      if(q.type === 'tf') return;
      const opts = q.options.map(norm).sort().join('|');
      const keys = [norm(q.q) + '#' + opts];
      if(q.molecule) keys.push('mol:' + q.molecule + '#' + opts);
      for(const k of keys){
        if(seen.has(k)) fail(`ochem bank: ${topic}#${i} repeats ${seen.get(k)} (same ${k.startsWith('mol:') ? 'drawing' : 'stem'} and options)`);
        else seen.set(k, `${topic}#${i}`);
      }
    });
  }
}
