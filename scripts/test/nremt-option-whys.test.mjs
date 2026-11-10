// The NREMT per-option lines (nremt/assets/option-whys.json): the file against the bank, and the one function
// that carries a line from its stored place to the place its option is shown (NremtQuestionIds.shownWhys in
// nremt/assets/question-ids.js). A line under the wrong option teaches the wrong thing and nothing throws, so
// the mapping is tested through real deals of real questions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../../nremt/assets/question-ids.js');
const shownWhys = globalThis.NremtQuestionIds.shownWhys;
const bank = JSON.parse(readFileSync('nremt/assets/questions-core.json', 'utf8'));
const whys = JSON.parse(readFileSync('nremt/assets/option-whys.json', 'utf8'));
const isChoice = (q) => !q.type || q.type === 'single' || q.type === 'multi';
const byId = new Map(bank.map((q) => [String(q.id), q]));

test('every key is a single or select-all question, with one labelled line per option', () => {
  for (const [id, lines] of Object.entries(whys)) {
    const q = byId.get(id);
    assert.ok(q, `${id}: a question with this id`);
    assert.ok(isChoice(q), `${id}: a choice item, not ${q.type}`);
    assert.equal(lines.length, q.options.length, `${id}: one line per option`);
    for (const line of lines) assert.match(line, /^(Correct|Not this): \S/, `${id}: labelled`);
  }
});

test('"Correct: " sits exactly on the keyed options', () => {
  for (const [id, lines] of Object.entries(whys)) {
    const key = new Set([].concat(byId.get(id).correct));
    lines.forEach((line, i) => assert.equal(line.startsWith('Correct: '), key.has(i), `${id}: option ${i}`));
  }
});

test('every choice question has lines; order, drag-and-drop and table items have none', () => {
  for (const q of bank) assert.equal(String(q.id) in whys, isChoice(q), `${q.id} (${q.type || 'single'})`);
});

// What practice-engine.js does to a question on load: deal the options, move the key with them.
function deal(q, order) {
  const d = { ...q, options: order.map((i) => q.options[i]) };
  d.correct = Array.isArray(q.correct) ? q.correct.map((i) => order.indexOf(i)) : order.indexOf(q.correct);
  return d;
}
const strip = (s) => s.replace(/^(Correct|Not this): /, '');

test('a line follows its option through the deal, with the label taken off', () => {
  const q = { id: 7, options: ['a', 'b', 'c', 'd'], correct: 3 };
  const map = { 7: ['Not this: A', 'Not this: B', 'Not this: C', 'Correct: D'] };
  const order = [3, 0, 2, 1];
  assert.deepEqual(shownWhys(map, deal(q, order), 7, { 7: order }), ['D', 'A', 'C', 'B']);
});

test('every question in the bank, under a reversed and a rotated deal', () => {
  for (const q of bank.filter(isChoice)) {
    const n = q.options.length, ident = q.options.map((_, i) => i);
    for (const order of [ident, ident.slice().reverse(), ident.map((i) => (i + 1) % n)]) {
      const d = deal(q, order);
      const shown = shownWhys(whys, d, q.id, { [q.id]: order });
      assert.ok(shown, `${q.id}: lines`);
      shown.forEach((line, p) => {
        const stored = q.options.indexOf(d.options[p]);
        // Options are distinct within a question, so the text finds the stored place.
        assert.equal(line, strip(whys[q.id][stored]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'), `${q.id}: shown ${p}`);
      });
    }
  }
});

test('select-all keeps each line with its option', () => {
  const q = { id: 9, type: 'multi', options: ['a', 'b', 'c', 'd', 'e'], correct: [0, 2] };
  const map = { 9: ['Correct: A', 'Not this: B', 'Correct: C', 'Not this: D', 'Not this: E'] };
  const order = [4, 2, 1, 0, 3];
  assert.deepEqual(shownWhys(map, deal(q, order), 9, { 9: order }), ['E', 'C', 'B', 'A', 'D']);
});

test('nothing is shown unless it is safe to', () => {
  const q = { id: 1, options: ['a', 'b'], correct: 0 };
  const good = { 1: ['Correct: A', 'Not this: B'] };
  const orders = { 1: [0, 1] };
  assert.deepEqual(shownWhys(good, q, 1, orders), ['A', 'B']);
  assert.equal(shownWhys(null, q, 1, orders), null, 'file not loaded');
  assert.equal(shownWhys({}, q, 1, orders), null, 'no lines for the id');
  assert.equal(shownWhys(good, q, 1, {}), null, 'no deal recorded');
  assert.equal(shownWhys({ 1: ['Correct: A'] }, q, 1, orders), null, 'wrong number of lines');
  assert.equal(shownWhys({ 1: ['Not this: A', 'Correct: B'] }, q, 1, orders), null, 'label on the wrong option');
  assert.equal(shownWhys(good, { ...q, type: 'order', correct: [0, 1] }, 1, orders), null, 'not a choice item');
  assert.equal(shownWhys(good, { ...q, type: 'dnd' }, 1, orders), null);
});

test('a line is escaped before it reaches the page', () => {
  const q = { id: 2, options: ['a', 'b'], correct: 1 };
  assert.deepEqual(shownWhys({ 2: ['Not this: SpO2 < 94% & falling', 'Correct: B'] }, q, 2, { 2: [0, 1] }),
    ['SpO2 &lt; 94% &amp; falling', 'B']);
});

test('the page loads the file without waiting on it, and the service worker keeps it for offline', () => {
  const engine = readFileSync('nremt/practice-engine.js', 'utf8');
  assert.match(engine, /fetch\('assets\/option-whys\.json'\)/);
  // Kicked off beside the explanations when a session starts; never awaited before the first question.
  assert.match(engine, /loadExplanations\(\);\s*loadOptionWhys\(\);/);
  assert.doesNotMatch(engine.slice(0, engine.indexOf('function loadOptionWhys')), /await loadOptionWhys/);
  const sw = readFileSync('sw.js', 'utf8');
  const deferred = sw.slice(sw.indexOf('const DEFERRED_URLS'), sw.indexOf('const DEFERRED_URLS') + 600);
  assert.match(deferred, /'nremt\/assets\/option-whys\.json'/);
  assert.ok(deferred.indexOf('questions-core.json') < deferred.indexOf('option-whys.json'), 'the core bank is warmed first');
});
