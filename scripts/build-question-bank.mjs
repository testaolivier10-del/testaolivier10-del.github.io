/* Splits the NREMT question bank into what a page needs to ASK a question and
   what it needs to EXPLAIN the answer.

   questions.json is 665 KB gzipped, and practice.html cannot show a single
   question until all of it has arrived — it is the site's busiest page and
   its slowest start. Most of that weight is not the questions. It is the
   explanations: 1.2 MB of prose, 409 KB of the 665 once compressed, none of
   which is read until after someone has already answered something.

   So it ships as two files. questions-core.json carries the stems, options
   and answer keys, and is what the page waits on. explanations.json is
   fetched straight afterwards without blocking anything, and lands many
   seconds before the earliest moment it could be wanted.

     first paint of a question:  665 KB gz  ->  287 KB gz

   Both are index-aligned with questions.json and with each other, which is
   what makes the split safe to do at all: every saved exam, flagged question,
   missed question and shuffled option order in a learner's browser is stored
   as a bare integer index into this bank. Re-ordering or re-keying it would
   silently re-point all of them at different questions. Nothing here reorders
   anything, and the check below fails if it ever does.

   questions.json stays the file you edit. These two are generated from it and
   should never be hand-edited:

     node scripts/build-question-bank.mjs            rebuild
     node scripts/build-question-bank.mjs --check    fail if stale (CI)
*/
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'nremt/assets/questions.json';
const CORE = 'nremt/assets/questions-core.json';
const EXPLAIN = 'nremt/assets/explanations.json';
const check = process.argv.includes('--check');

const questions = JSON.parse(readFileSync(SRC, 'utf8'));
if (!Array.isArray(questions) || !questions.length) {
  console.error(`${SRC}: not a non-empty array`);
  process.exit(1);
}

const core = questions.map(({ explain, ...rest }) => rest);
// Kept as a positional array rather than an object keyed by index: the keys
// would be the indices, written out as strings, for 2,084 entries — the same
// information at a cost, and one more thing that could disagree with the
// order it is supposed to mirror.
const explanations = questions.map((q) => (typeof q.explain === 'string' ? q.explain : ''));

if (core.some((q) => 'explain' in q)) {
  console.error('explain survived the split');
  process.exit(1);
}
if (core.length !== questions.length || explanations.length !== questions.length) {
  console.error('the split changed the number of questions');
  process.exit(1);
}

const coreText = JSON.stringify(core);
const explainText = JSON.stringify(explanations);

if (check) {
  let stale = false;
  for (const [path, want] of [[CORE, coreText], [EXPLAIN, explainText]]) {
    let have = '';
    try { have = readFileSync(path, 'utf8'); } catch { /* missing counts as stale */ }
    if (have !== want) { console.error(`${path} does not match ${SRC}`); stale = true; }
  }
  if (stale) {
    console.error('Run: node scripts/build-question-bank.mjs');
    process.exit(1);
  }
  console.log(`${CORE} and ${EXPLAIN} are in step with ${SRC} (${questions.length} questions).`);
} else {
  writeFileSync(CORE, coreText);
  writeFileSync(EXPLAIN, explainText);
  const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0);
  console.log(`${questions.length} questions`);
  console.log(`  ${CORE}      ${kb(coreText)} KB`);
  console.log(`  ${EXPLAIN}   ${kb(explainText)} KB`);
}
