/* Splits the ochem practice bank into what a page needs to ASK a question and
   what it needs to EXPLAIN the answer. Same idea as build-question-bank.mjs
   does for the NREMT bank, pointed at the other course.

   WHY
   ---
   practice.html and review.html both WAIT on practice-bank.json before their
   first screen — deliberately, because the screen they open with reports counts
   ("N questions ready", the weakest-concept recommendation) and rendering those
   against a half-loaded bank would show a wrong number and then silently change
   it. See the comment in ochem/assets/bank-loader.js.

   That was a defensible trade at 62 topics. It stopped being one as the course
   grew: the bank went from 1,860 questions to 2,340 across three new chapters,
   and its page-weight budget had to be raised twice. Six more chapters were
   going to push it past 400 KB of blocking latency.

   Most of that weight is not the questions. It is the explanations, none of
   which is read until after somebody has already answered something:

     whole bank   282 KB gz
     core         168 KB gz   <- what the pages block on now
     explanations 121 KB gz   <- fetched straight afterwards, blocking nothing

   The two halves together are slightly larger than the single file, because
   splitting costs some cross-compression. That is the trade: about 7 KB more
   transferred in total, against 114 KB less before the page can show anything.

   ALIGNMENT
   ---------
   Both files are keyed by topic and positionally aligned within each topic, so
   the explanations file is a bare array of strings per topic rather than
   repeating question text. Nothing here reorders anything, and --check fails if
   the two ever fall out of step.

   practice-bank.json stays the file you edit. The other two are generated:

     node scripts/build-ochem-bank.mjs            rebuild
     node scripts/build-ochem-bank.mjs --check    fail if stale (CI)
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');

const SRC = join(ROOT, 'ochem', 'assets', 'practice-bank.json');
const CORE = join(ROOT, 'ochem', 'assets', 'practice-bank-core.json');
const WHY = join(ROOT, 'ochem', 'assets', 'practice-bank-why.json');

const bank = JSON.parse(readFileSync(SRC, 'utf8'));

const core = {};
const why = {};
let questions = 0;

for (const topic of Object.keys(bank)) {
  const list = Array.isArray(bank[topic]) ? bank[topic] : [];
  core[topic] = list.map((q) => {
    const copy = {};
    // Copy every field except the explanation, preserving key order so the
    // generated file diffs cleanly against the source.
    for (const k of Object.keys(q)) if (k !== 'why') copy[k] = q[k];
    return copy;
  });
  why[topic] = list.map((q) => q.why || '');
  questions += list.length;
}

const coreText = JSON.stringify(core, null, 1) + '\n';
const whyText = JSON.stringify(why, null, 1) + '\n';

if (check) {
  const stale = [];
  if (!existsSync(CORE) || readFileSync(CORE, 'utf8') !== coreText) stale.push('practice-bank-core.json');
  if (!existsSync(WHY) || readFileSync(WHY, 'utf8') !== whyText) stale.push('practice-bank-why.json');
  if (stale.length) {
    console.error(`FAIL: ${stale.join(' and ')} ${stale.length > 1 ? 'are' : 'is'} stale. ` +
                  'Run: node scripts/build-ochem-bank.mjs');
    process.exit(1);
  }
  // The alignment the loader depends on. A mismatch here would hand a question
  // somebody else's explanation, which is worse than having none.
  for (const topic of Object.keys(core)) {
    if (core[topic].length !== why[topic].length) {
      console.error(`FAIL: ${topic} has ${core[topic].length} questions but ${why[topic].length} explanations.`);
      process.exit(1);
    }
  }
  console.log(`OK — the split ochem bank matches practice-bank.json (${Object.keys(core).length} topics, ${questions} questions).`);
} else {
  writeFileSync(CORE, coreText);
  writeFileSync(WHY, whyText);
  console.log(`Wrote practice-bank-core.json and practice-bank-why.json (${Object.keys(core).length} topics, ${questions} questions).`);
}
