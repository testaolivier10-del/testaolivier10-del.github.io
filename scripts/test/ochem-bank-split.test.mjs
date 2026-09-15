/* The ochem practice bank ships as two files: the stems and options that
   practice.html waits on, and the explanations fetched afterwards
   (scripts/build-ochem-bank.mjs, ochem/assets/bank-loader.js).

   Worth testing because the failure is invisible and lands on the student. The
   pooled question object is built once, and can be built — and answered —
   before the explanations arrive. If `why` were copied in at that moment it
   would be frozen empty forever for anything normalized during the gap, and the
   only symptom would be a question that silently explains nothing. It is a
   getter instead, and these tests pin both halves of that: the alignment the
   getter indexes into, and the resolve-at-read-time behavior. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

const src = JSON.parse(readFileSync('ochem/assets/practice-bank.json', 'utf8'));
const core = JSON.parse(readFileSync('ochem/assets/practice-bank-core.json', 'utf8'));
const why = JSON.parse(readFileSync('ochem/assets/practice-bank-why.json', 'utf8'));

test('the split files cover exactly the topics of the source bank', () => {
  assert.deepEqual(Object.keys(core), Object.keys(src));
  assert.deepEqual(Object.keys(why), Object.keys(src));
});

test('every question keeps its own explanation, by position', () => {
  for (const topic of Object.keys(src)) {
    assert.equal(core[topic].length, src[topic].length, `${topic}: core length`);
    assert.equal(why[topic].length, src[topic].length, `${topic}: explanation length`);
    src[topic].forEach((q, i) => {
      // Position is the only thing tying the halves together, so drifting by
      // one would hand every question its neighbour's explanation.
      assert.equal(core[topic][i].q, q.q, `${topic}[${i}]: stem`);
      assert.equal(core[topic][i].correct, q.correct, `${topic}[${i}]: answer key`);
      assert.equal(why[topic][i], q.why || '', `${topic}[${i}]: explanation`);
    });
  }
});

test('the core carries no explanations — that is the whole point of it', () => {
  for (const topic of Object.keys(core)) {
    for (const q of core[topic]) {
      assert.equal('why' in q, false, `${topic}: an explanation leaked into the core`);
    }
  }
});

/* The behavior that matters: a question normalized BEFORE the explanations
   arrive must still show the right one afterwards. */
function engine() {
  const b = createBrowser();
  // Order matters: legacy-rules.js registers itself on the object
  // legacy-diagnosis.js creates, so the latter has to be in place first.
  b.load('ochem/assets/concepts.js');
  b.load('ochem/assets/curriculum.js');
  b.load('ochem/assets/legacy-diagnosis.js');
  b.load('ochem/assets/legacy-rules.js');
  b.load('ochem/assets/question-engine.js');
  return b;
}

test('a question built before the explanations land picks them up later', () => {
  const b = engine();
  const topic = Object.keys(src)[0];
  // The core has arrived; the explanations have not.
  b.window.OchemPracticeBank = { [topic]: core[topic] };
  b.window.OchemPracticeWhy = {};
  b.window.OchemQuestionEngine.invalidate();

  const q = b.window.OchemQuestionEngine.byId(`lb:${topic}:0`);
  assert.ok(q, 'the question should be askable from the core alone');
  assert.equal(q.prompt, src[topic][0].q);
  // Empty string, not undefined: a student in the gap sees nothing, not "undefined".
  assert.equal(q.why, '');

  // Now they arrive — on the SAME pooled object, with no rebuild.
  b.window.OchemPracticeWhy = { [topic]: why[topic] };
  assert.equal(q.why, src[topic][0].why);
});

test('a missing explanations file leaves questions askable', () => {
  const b = engine();
  const topic = Object.keys(src)[0];
  b.window.OchemPracticeBank = { [topic]: core[topic] };
  b.window.OchemPracticeWhy = {};       // the fetch failed
  b.window.OchemQuestionEngine.invalidate();
  const q = b.window.OchemQuestionEngine.byId(`lb:${topic}:0`);
  assert.equal(q.prompt, src[topic][0].q);
  assert.equal(q.options.length, src[topic][0].options.length);
  assert.equal(q.why, '');
});

test('why is non-enumerable, so a snapshot copy stays a snapshot', () => {
  const b = engine();
  const topic = Object.keys(src)[0];
  b.window.OchemPracticeBank = { [topic]: core[topic] };
  b.window.OchemPracticeWhy = { [topic]: why[topic] };
  b.window.OchemQuestionEngine.invalidate();
  const q = b.window.OchemQuestionEngine.byId(`lb:${topic}:0`);

  // Several places copy a question with for..in. A getter copied as a getter
  // would carry a live reference into an object meant to be frozen in time.
  const copy = {};
  for (const k in q) if (Object.prototype.hasOwnProperty.call(q, k)) copy[k] = q[k];
  assert.equal('why' in copy, false);
  // Read explicitly, as diagnostic-engine.js does, and it resolves.
  assert.equal(q.why, src[topic][0].why);
});
