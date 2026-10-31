/* The AP® Calculus BC course map (docs/apcalcbc-phase0.md): docs/apcalcbc-dependency-map.json
   is an overlay that mergeBcMap (scripts/lib/apcalc-build.mjs) merges onto AB's map. The merged
   map passes AB's ordering rules with BC's topic list; it has 111 CED topics (AB's 81 plus 30 BC)
   and the "Math you need" chapter (AB's 7 skills plus BC's 3); BC topics sit where the CED places
   them; the generator's loader and the check's order agree; the overlay copies nothing of AB's. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
process.env.APCALC_COURSE = 'bc';
const { readMapRaw, loadMap, mergeBcMap } = await import('../lib/apcalc-build.mjs');
const { validateMap, courseOrder, BC_TOPICS, AB_TOPICS } = await import('../lib/apcalc-map.mjs');

const overlay = JSON.parse(readFileSync('docs/apcalcbc-dependency-map.json', 'utf8'));
const ab = JSON.parse(readFileSync('docs/apcalc-dependency-map.json', 'utf8'));
const map = readMapRaw('docs/apcalcbc-dependency-map.json');

test('the merged BC map passes the ordering rules with BC\'s topic list', () => {
  const { errors } = validateMap(map, { course: 'bc' });
  assert.deepEqual(errors, []);
  // AB's own check refuses it (BC-only numbers), so the course option matters.
  assert.ok(validateMap(map).errors.some(e => /BC only|expected/.test(e)));
});

test('111 CED topics, 30 of them BC, and ten math skills', () => {
  const ced = map.topics.filter(t => t.kind === 'concept');
  assert.equal(BC_TOPICS.length, 111);
  assert.deepEqual(ced.map(t => t.ced).sort(), [...BC_TOPICS].sort());
  assert.equal(ced.filter(t => t.source === 'bc').length, 30);
  assert.equal(map.topics.filter(t => t.kind !== 'concept').length, 10);
  assert.equal(map.chapters.filter(c => c.part === 'course').length, 10);
});

test('BC topics sit where the CED places them, in both loaders', () => {
  const order = courseOrder(map).map(t => t.ced || t.id);
  const at = x => order.indexOf(x);
  assert.ok(at('6.10') < at('6.11') && at('6.11') < at('6.12') && at('6.12') < at('6.13') && at('6.13') < at('6.14'));
  assert.ok(at('7.4') < at('7.5') && at('7.5') < at('7.6') && at('7.8') < at('7.9'));
  assert.ok(at('8.12') < at('8.13') && at('8.13') < at('9.1'));
  assert.ok(at('9.9') < at('10.1') && at('10.15') === order.length - 1);
  assert.ok(at('math-parametric-vectors') === at('9.1') - 1 && at('math-polar') === at('9.7') - 1 && at('math-sequences') === at('10.1') - 1);
  const built = loadMap('docs/apcalcbc-dependency-map.json');
  assert.deepEqual(built.topics.map(t => t.id), courseOrder(map).map(t => t.id));
});

test('BC weights: Units 1-4, 7 and 8 at 5-10%, 5 and 9 at 10-15%, 6 and 10 at 15-20%', () => {
  const w = Object.fromEntries(map.chapters.filter(c => c.part === 'course').map(c => [c.n, c.weight.join('-')]));
  assert.deepEqual(w, { 1: '5-10', 2: '5-10', 3: '5-10', 4: '5-10', 5: '10-15', 6: '15-20', 7: '5-10', 8: '5-10', 9: '10-15', 10: '15-20' });
});

test('the overlay copies nothing of AB\'s map', () => {
  assert.equal(overlay.overlay, true);
  const abIds = new Set([...ab.topics.map(t => t.id), ...ab.concepts.map(c => c.id)]);
  for (const x of [...overlay.topics, ...overlay.concepts]) assert.ok(!abIds.has(x.id), x.id);
  assert.ok(overlay.topics.every(t => !AB_TOPICS.includes(t.ced)));
  // Merging is pure: AB's map is unchanged by it.
  const before = JSON.stringify(ab); mergeBcMap(ab, overlay); assert.equal(JSON.stringify(ab), before);
});

test('every BC notation pattern is valid and matches what it names', () => {
  const pat = id => map.concepts.find(c => c.id === id).notation.map(p => new RegExp(p));
  const hit = (id, tex) => pat(id).some(r => r.test(tex));
  assert.ok(hit('improper-integral', '\\int_1^\\infty \\frac{1}{x^2}\\,dx'));
  assert.ok(!hit('improper-integral', '\\int_0^1 x\\,dx'));
  assert.ok(hit('infinite-series', '\\sum_{n=1}^{\\infty} a_n'));
  assert.ok(!hit('infinite-series', '\\sum_{i=1}^{n} f(x_i)'));
  assert.ok(hit('factorial', '\\frac{x^n}{n!}') && !hit('factorial', 'x\\!'));
  assert.ok(hit('vector', '\\left\\langle 3, 4 \\right\\rangle'));
});
