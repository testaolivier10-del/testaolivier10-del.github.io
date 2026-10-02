#!/usr/bin/env node
/* Records, per NREMT question, a hash of its options and a hash of its explanation in
   scripts/lib/nremt-explain-snapshot.json. The check-site rule nremt-stale-explanations
   fails when an item's options changed since the snapshot but its explanation did not,
   which is how explanations ended up describing distractors that no longer exist.

   After changing options, update the explanation to match the current options, then run
     node scripts/snapshot-nremt-explanations.mjs
   If the explanation truly needs no change (a typo fix in an option, say), run it with
     --ack <id> [<id> ...]   to accept just those items. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SNAPSHOT = join(ROOT, 'scripts/lib/nremt-explain-snapshot.json');
const h = (s) => createHash('sha1').update(s).digest('hex').slice(0, 10);
export const fingerprint = (q) => ({ o: h(JSON.stringify(q.options)), e: h(q.explain || '') });

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const bank = JSON.parse(readFileSync(join(ROOT, 'nremt/assets/questions.json'), 'utf8'));
  const ackAt = process.argv.indexOf('--ack');
  const ack = ackAt === -1 ? null : new Set(process.argv.slice(ackAt + 1).map(Number));
  const old = ack && existsSync(SNAPSHOT) ? JSON.parse(readFileSync(SNAPSHOT, 'utf8')) : {};
  const out = {};
  for (const q of bank) {
    const f = fingerprint(q);
    out[q.id] = ack && old[q.id] && !ack.has(q.id) ? old[q.id] : `${f.o}:${f.e}`;
  }
  writeFileSync(SNAPSHOT, JSON.stringify(out, null, 0).replace(/,"/g, ',\n"') + '\n');
  console.log(`snapshot: ${bank.length} items${ack ? `, acknowledged ${[...ack].join(', ')}` : ''}`);
}
