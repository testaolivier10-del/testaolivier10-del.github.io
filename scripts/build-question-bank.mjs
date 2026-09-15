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

   Both are positionally aligned with questions.json and with each other, so
   explanations.json can stay a bare array of strings rather than repeating a
   key 2,084 times. Nothing here reorders anything, and the check below fails
   if it ever does.

   IDS
   ---
   What a learner's browser stores is a different question from how these two
   files are laid out, and the two used to be the same answer: every saved
   exam, flagged question, missed question and shuffled option order was a
   bare POSITION in this bank, which made the bank append-only forever. A
   deleted question shifted every position after it and silently re-pointed
   every stored record at something else.

   So every question carries an `id`. This script assigns one to any question
   that lacks it — max(existing) + 1, so an id is never reused even after a
   deletion — and writes them back into questions.json. Ids were introduced by
   numbering the bank in its existing order, which made `id === index` on the
   day of the change and is why no device needed its records rewritten; see
   nremt/assets/question-ids.js.

   Never renumber. Never hand-edit an id. Deleting a question is now safe and
   leaves a hole, which is the entire point.

   questions.json stays the file you edit. The other two are generated from it
   and should never be hand-edited:

     node scripts/build-question-bank.mjs            assign ids + rebuild
     node scripts/build-question-bank.mjs --check    fail if stale (CI)
*/
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'nremt/assets/questions.json';
const CORE = 'nremt/assets/questions-core.json';
const EXPLAIN = 'nremt/assets/explanations.json';
const check = process.argv.includes('--check');

const srcText = readFileSync(SRC, 'utf8');
const questions = JSON.parse(srcText);
if (!Array.isArray(questions) || !questions.length) {
  console.error(`${SRC}: not a non-empty array`);
  process.exit(1);
}

// ---- Ids -------------------------------------------------------------------
// An id is permanent. This only ever hands one out to a question that has
// none, and only ever from above the high-water mark, so a hole left by a
// deleted question stays a hole rather than being handed to a new question
// that would then inherit the deleted one's place in everybody's records.
const seen = new Map();
for (const [at, q] of questions.entries()) {
  if (!('id' in q)) continue;
  if (typeof q.id !== 'number' || !Number.isInteger(q.id) || q.id < 0) {
    console.error(`${SRC}: question ${at} has a non-integer id (${JSON.stringify(q.id)})`);
    process.exit(1);
  }
  if (seen.has(q.id)) {
    console.error(`${SRC}: id ${q.id} is used by both question ${seen.get(q.id)} and question ${at}`);
    process.exit(1);
  }
  seen.set(q.id, at);
}

const missing = questions.filter((q) => !('id' in q)).length;
let next = questions.length ? Math.max(-1, ...seen.keys()) + 1 : 0;
const assigned = [];
for (const q of questions) {
  if ('id' in q) continue;
  q.id = next++;
  assigned.push(q.id);
}

// id first in the object, so the file reads as a keyed record rather than a
// prose blob with a number buried at the end.
const ordered = questions.map(({ id, ...rest }) => ({ id, ...rest }));
// One question per line, which is the format this file has always had and
// what keeps its diffs readable when a single answer key changes.
const srcWanted = '[\n' + ordered.map((q) => JSON.stringify(q)).join(',\n') + '\n]\n';

const core = ordered.map(({ explain, ...rest }) => rest);
// Kept as a positional array rather than an object keyed by index: the keys
// would be the indices, written out as strings, for 2,084 entries — the same
// information at a cost, and one more thing that could disagree with the
// order it is supposed to mirror.
const explanations = ordered.map((q) => (typeof q.explain === 'string' ? q.explain : ''));

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
  if (missing) {
    // In --check this is a failure rather than something to fix silently: CI
    // has no business writing to the file it is checking, and a question with
    // no id is a question nobody's records can refer to.
    console.error(`${SRC}: ${missing} question(s) have no id`);
    stale = true;
  }
  for (const [path, want] of [[SRC, srcWanted], [CORE, coreText], [EXPLAIN, explainText]]) {
    let have = '';
    try { have = readFileSync(path, 'utf8'); } catch { /* missing counts as stale */ }
    if (have !== want) {
      console.error(path === SRC ? `${SRC} is not in its canonical shape` : `${path} does not match ${SRC}`);
      stale = true;
    }
  }
  if (stale) {
    console.error('Run: node scripts/build-question-bank.mjs');
    process.exit(1);
  }
  console.log(`${CORE} and ${EXPLAIN} are in step with ${SRC} (${questions.length} questions, ids 0-${next - 1}).`);
} else {
  if (srcText !== srcWanted) writeFileSync(SRC, srcWanted);
  writeFileSync(CORE, coreText);
  writeFileSync(EXPLAIN, explainText);
  const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0);
  console.log(`${questions.length} questions`);
  if (assigned.length) {
    const span = assigned.length === 1 ? `id ${assigned[0]}` : `ids ${assigned[0]}-${assigned[assigned.length - 1]}`;
    console.log(`  assigned ${assigned.length} new ${span}`);
  }
  console.log(`  ${CORE}      ${kb(coreText)} KB`);
  console.log(`  ${EXPLAIN}   ${kb(explainText)} KB`);
}
