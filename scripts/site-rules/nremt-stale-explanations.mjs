/* Site audit 2026-10 follow-up (W1 review): after distractors were rewritten and select-N
   items gained options, dozens of explanations still described options that no longer
   existed (#2056 "a kitchen cut", #1652 "insurers") or ignored the new ones. This fails
   when an item's options changed since scripts/lib/nremt-explain-snapshot.json but its
   explanation did not. Fix the explanation, then run
   node scripts/snapshot-nremt-explanations.mjs (or --ack <id> if no change is needed). */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fingerprint, SNAPSHOT } from '../snapshot-nremt-explanations.mjs';

export default function ({ ROOT, fail }) {
  if (!existsSync(SNAPSHOT)) return fail('scripts/lib/nremt-explain-snapshot.json is missing; run node scripts/snapshot-nremt-explanations.mjs');
  const snap = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
  const bank = JSON.parse(readFileSync(join(ROOT, 'nremt/assets/questions.json'), 'utf8'));
  const stale = [], unsnapped = [];
  for (const q of bank) {
    const f = fingerprint(q);
    if (!snap[q.id]) { unsnapped.push(q.id); continue; }
    const [o, e] = snap[q.id].split(':');
    if (o !== f.o && e === f.e) stale.push(q.id);
  }
  if (stale.length) fail(`nremt/assets/questions.json: options changed but the explanation did not for #${stale.join(', #')}; make the explanation match the current options, then run node scripts/snapshot-nremt-explanations.mjs (--ack <id> if it already does)`);
  if (unsnapped.length) fail(`nremt/assets/questions.json: #${unsnapped.join(', #')} not in the explanation snapshot; run node scripts/snapshot-nremt-explanations.mjs after checking the explanation`);
}
