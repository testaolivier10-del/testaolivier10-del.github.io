/* ApHugModel (human-geography/assets/hug-model.js), the `model` item: a model
   is checked before it ships (slots, pieces, one key per slot, at most three
   distractors, pieces short enough for a phone), graded piece by piece and
   position by position with the first slip named (an authored slip first,
   then a swap, one ring off, a distractor, an empty place), and drawn as
   static markup whose every piece and place is a button; the question
   engine grades it through ApHugQuestions.grade. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
for (const f of ['hug-math.js', 'hug-calc.js', 'hug-grade.js', 'hug-model.js']) B.load(`human-geography/assets/${f}`);
const M = B.window.ApHugModel;
const Q = B.load('human-geography/assets/hug-questions.js').ApHugQuestions;

const rings = () => ({
  layout: 'rings', title: 'Rings around one market', center: 'Market',
  slots: [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }, { id: 'r4' }],
  pieces: [{ id: 'garden', text: 'Market gardening' }, { id: 'wood', text: 'Forest' }, { id: 'grain', text: 'Grain' }, { id: 'ranch', text: 'Ranching' }, { id: 'mine', text: 'Coal mining' }],
  key: { r1: 'garden', r2: 'wood', r3: 'grain', r4: 'ranch' },
  slips: [{ piece: 'grain', slot: 'r1', why: 'Grain keeps well, so it can travel from farther out.' }],
});

test('a sound model passes the check; each way to break one is named', () => {
  assert.deepEqual([...M.check(rings())], []);
  const bad = (edit, re) => { const m = rings(); edit(m); assert.ok(M.check(m).some(p => re.test(p)), `${re}: ${M.check(m).join(' | ')}`); };
  bad(m => { m.layout = 'spiral'; }, /layout must be one of/);
  bad(m => { m.slots = [{ id: 'r1' }]; m.key = { r1: 'garden' }; }, /at least two slots/);
  bad(m => { m.slots = Array.from({ length: 9 }, (_, i) => ({ id: 's' + i })); }, /at most eight slots/);
  bad(m => { m.key.r2 = 'garden'; }, /key of two slots/);
  bad(m => { m.key.r4 = 'unicorn'; }, /unknown piece/);
  bad(m => { delete m.key.r3; }, /has no key/);
  bad(m => { m.pieces.push({ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }); }, /at most three distractor pieces/);
  bad(m => { m.pieces[0].text = 'A very long piece of text that will never fit a phone screen'; }, /longer than 40 characters/);
  bad(m => { m.slips.push({ piece: 'garden', slot: 'r1', why: 'x' }); }, /is the right answer/);
  bad(m => { m.layout = 'free'; }, /a free slot needs box/);
  bad(m => { m.center = 'The central business district'; }, /center label/);
});

test('graded piece by piece and position by position, with the first slip named', () => {
  const m = rings();
  const full = M.grade(m, m.key);
  assert.equal(full.correct, true); assert.equal(full.right, 4); assert.equal(full.score, 1); assert.equal(full.slip, null);
  const authored = M.grade(m, { r1: 'grain', r2: 'wood', r3: 'garden', r4: 'ranch' });
  assert.equal(authored.right, 2);
  assert.equal(authored.slip, 'Grain keeps well, so it can travel from farther out.', 'the authored slip first');
  const swap = M.grade(m, { r1: 'garden', r2: 'grain', r3: 'wood', r4: 'ranch' });
  assert.equal(swap.slip, 'Grain and Forest are swapped.');
  const off = M.grade(m, { r1: 'garden', r2: 'ranch', r3: 'wood', r4: 'grain' });
  assert.match(off.slip, /Ranching belongs in Ring 4 \(outermost\), not Ring 2/);
  const one = M.grade({ ...m, slips: [] }, { r1: 'wood', r2: 'grain', r3: 'garden', r4: 'ranch' });
  assert.match(one.slip, /Forest is one ring off: it belongs in Ring 2/);
  const dis = M.grade(m, { r1: 'garden', r2: 'wood', r3: 'mine', r4: 'ranch' });
  assert.equal(dis.slip, 'Coal mining is not part of this model.');
  const empty = M.grade(m, { r1: 'garden' });
  assert.equal(empty.valid, false);
  assert.deepEqual([...empty.results.map(r => r.ok)], [true, false, false, false]);
  assert.match(empty.results[1].why, /Nothing is placed in Ring 2/);
});

test('every layout draws numbers only (the words are in the list), and every piece and place is a button', () => {
  for (const layout of ['rings', 'sectors', 'stages', 'tiers']) {
    const m = { ...rings(), layout, slips: [] };
    const h = M.html(m, 'mdl-t');
    assert.match(h, /<svg class="hug-model-svg"[^>]*role="img" aria-label="[^"]{20,}"/, layout);
    const svgText = (h.match(/<svg[\s\S]*?<\/svg>/) || [''])[0];
    assert.doesNotMatch(svgText.replace(/<text[^>]*>\d+<\/text>/g, ''), /<text/, `${layout}: only numbers in the drawing`);
    assert.equal((h.match(/<button type="button" class="hug-model-slot"/g) || []).length, 4);
    assert.equal((h.match(/<button type="button" class="hug-model-piece"[^>]*aria-pressed="false"/g) || []).length, 5);
    assert.match(h, /Pick a piece, then the place it belongs/);
  }
  assert.equal(M.slotName({ layout: 'stages', slots: [{ id: 'a' }, { id: 'b' }] }, 1), 'Stage 2');
  assert.equal(M.slotName({ layout: 'tiers', slots: [{ id: 'a', name: 'Core' }] }, 0), 'Core');
});

test('the question engine grades a model item through the same grader', () => {
  const q = { type: 'model', model: rings() };
  const g = Q.grade(q, { r1: 'garden', r2: 'wood', r3: 'ranch', r4: 'grain' });
  assert.equal(g.correct, false); assert.equal(g.right, 2); assert.equal(g.total, 4); assert.equal(g.score, 0.5);
  assert.equal(g.slip, 'Ranching and Grain are swapped.');
  assert.equal(Q.grade(q, rings().key).correct, true);
});

test('a free layout: numbered badges on the figure and the places listed under it (nothing laid over the drawing)', () => {
  const m = { layout: 'free', title: 'Multiple nuclei', slots: [{ id: 'a', box: [10, 10, 20, 10] }, { id: 'b', name: 'Spot by the airport', box: [60, 70, 20, 10] }],
    pieces: [{ id: 'cbd', text: 'Central business district' }, { id: 'ind', text: 'Heavy industry' }], key: { a: 'cbd', b: 'ind' } };
  assert.deepEqual([...M.check(m)], []);
  const fig = '<div class="hug-figimg"><img src="figures/x.svg" alt="A drawn city"></div>';
  const h = M.html(m, 'mdl-f', fig);
  assert.ok(h.includes(fig), 'the figure is drawn');
  assert.equal((h.match(/class="hug-model-spot" aria-hidden="true" style="left:20%;top:15%">1</g) || []).length, 1, 'badge 1 centered in its box');
  assert.match(h, /class="hug-model-spot" aria-hidden="true" style="left:70%;top:75%">2</);
  assert.doesNotMatch(h, /<li[^>]*style=/, 'no place is positioned over the figure');
  assert.match(h, /<ol class="hug-model-slots">[\s\S]*hug-model-badge[^>]*>1<[\s\S]*Spot 1[\s\S]*Spot by the airport/, 'the list carries the same numbers and the names');
  assert.equal((h.match(/class="hug-model-slot"/g) || []).length, 2);
  // A trainer that draws the figure on its own stage passes none: only the list shows.
  const bare = M.html(m, 'mdl-g');
  assert.doesNotMatch(bare, /hug-model-fig|hug-model-spot/);
  assert.match(bare, /hug-model-slots/);
});

test('interchangeable slots: a group accepts its pieces in any order, and a piece in the wrong group is named', () => {
  const m = { layout: 'tiers', unit: 'column', slots: [{ id: 'p1', name: 'Centripetal 1' }, { id: 'p2', name: 'Centripetal 2' }, { id: 'f1', name: 'Centrifugal 1' }, { id: 'f2', name: 'Centrifugal 2' }],
    pieces: [{ id: 'lang', text: 'A shared language' }, { id: 'flag', text: 'A national holiday' }, { id: 'sep', text: 'A separatist movement' }, { id: 'reg', text: 'Uneven regional wealth' }],
    key: { p1: 'lang', p2: 'flag', f1: 'sep', f2: 'reg' }, groups: [['p1', 'p2'], ['f1', 'f2']] };
  assert.deepEqual([...M.check(m)], []);
  assert.equal(M.grade(m, { p1: 'flag', p2: 'lang', f1: 'reg', f2: 'sep' }).correct, true, 'any order inside a group');
  const g = M.grade(m, { p1: 'sep', p2: 'lang', f1: 'flag', f2: 'reg' });
  assert.equal(g.right, 2);
  assert.match(g.slip, /A separatist movement belongs with Centrifugal 1 or Centrifugal 2, not Centripetal 1/);
  const bad = edit => { const x = JSON.parse(JSON.stringify(m)); edit(x); return M.check(x); };
  assert.ok(bad(x => { x.groups = [['p1']]; }).some(p => /at least two slots/.test(p)));
  assert.ok(bad(x => { x.groups = [['p1', 'zz']]; }).some(p => /unknown slot "zz"/.test(p)));
  assert.ok(bad(x => { x.groups = [['p1', 'p2'], ['p2', 'f1']]; }).some(p => /in two groups/.test(p)));
  assert.ok(bad(x => { x.slips = [{ piece: 'flag', slot: 'p1', why: 'x' }]; }).some(p => /is the right answer/.test(p)), 'a slip that a group accepts is refused');
});
