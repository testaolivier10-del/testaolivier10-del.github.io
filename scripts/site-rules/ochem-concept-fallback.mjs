/* Ochem concept tagging: how much of the practice bank falls back to its
   topic's default concept.

   Audit finding (site audit 2026-10, "Concept tagging"): 1,946 of 3,606
   non-recall bank questions (54%) matched no rule and fell back to the topic
   default, so the "This question turns on ..." line was wrong about half the
   time (an isotope question "turned on valence electrons"), while a code
   comment claimed the rules covered 95%. Rules for every topic that had none
   brought the fallback share to 6.0% (201 questions), with 282 questions
   (7.8% of the bank) marked as recall, which records no concept and names
   none.

   This rule recomputes both numbers the way the pages do (legacy rules first,
   then keyword inference) and fails if either climbs past its ceiling:
   fallback above 7% of non-recall questions means new questions were added
   without rules; recall above 9% of the bank means questions are being waved
   through as "vocabulary" instead of tagged. Questions whose concept is a
   fallback no longer show the concept line at all (diagnostic-engine.js). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

export const FALLBACK_CEILING = 0.07;
export const RECALL_CEILING = 0.09;

export function measure(ROOT){
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  for(const f of ['curriculum.js', 'concepts.js', 'legacy-diagnosis.js', 'legacy-rules.js']){
    const p = join(ROOT, 'ochem/assets', f);
    vm.runInContext(readFileSync(p, 'utf8'), ctx, { filename: p });
  }
  const C = ctx.OchemConcepts, L = ctx.OchemLegacyDiagnosis;
  const bank = JSON.parse(readFileSync(join(ROOT, 'ochem/assets/practice-bank.json'), 'utf8'));
  let total = 0, recall = 0, fallback = 0;
  const byTopic = {};
  for(const topic of Object.keys(bank)){
    for(const q of bank[topic]){
      total++;
      if(L.isRecall(topic, q.q)){ recall++; continue; }
      if(!(L.conceptFor(topic, q.q) || C.inferConcept(q.q, topic))){
        fallback++;
        byTopic[topic] = (byTopic[topic] || 0) + 1;
      }
    }
  }
  return { total, recall, fallback, nonRecall: total - recall, byTopic };
}

export default function({ ROOT, fail }){
  const m = measure(ROOT);
  const fShare = m.fallback / m.nonRecall, rShare = m.recall / m.total;
  console.log(`ochem concept tagging: ${m.fallback}/${m.nonRecall} non-recall questions fall back ` +
              `(${(fShare * 100).toFixed(1)}%), ${m.recall}/${m.total} recall (${(rShare * 100).toFixed(1)}%)`);
  if(fShare > FALLBACK_CEILING){
    const worst = Object.entries(m.byTopic).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, n]) => t + ' ' + n).join(', ');
    fail(`ochem concept fallback ${(fShare * 100).toFixed(1)}% is above the ${FALLBACK_CEILING * 100}% ceiling; ` +
         `add rules in ochem/assets/legacy-rules.js (worst: ${worst})`);
  }
  if(rShare > RECALL_CEILING){
    fail(`ochem recall share ${(rShare * 100).toFixed(1)}% is above the ${RECALL_CEILING * 100}% ceiling; ` +
         'tag questions with a concept instead of marking them recall');
  }
}
