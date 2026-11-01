/* AP® Calculus BC exam config (docs/apcalcbc-architecture.md, "Exams"): the May 2027 split
   AB uses (29/62 + 13/38 MCQ, 2/30 + 4/60 FRQ, 9 points), and Section II's slots: Q2
   parametric, Q5 techniques, Q6 series, Q1, Q3 and Q4 AB types. checkForms with the BC slots. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.APCALC_COURSE = 'bc';
const { MCQ_PARTS, FRQ_PARTS, FRQ_POINTS, BC_FRQ_SLOTS, checkForms } = await import('../lib/apcalc-exams.mjs');
const { loadMap } = await import('../lib/apcalc-build.mjs');

test('the 2027 format', () => {
  assert.deepEqual(MCQ_PARTS.map(p => [p.n, p.minutes, p.calc]), [[29, 62, false], [13, 38, true]]);
  assert.deepEqual(FRQ_PARTS.map(p => [p.n, p.minutes, p.calc]), [[2, 30, true], [4, 60, false]]);
  assert.equal(FRQ_POINTS, 9);
  assert.deepEqual(BC_FRQ_SLOTS, [null, 'parametric', null, null, 'techniques', 'series']);
});

test('Section II slots: Q2, Q5 and Q6 BC types, the shared ones AB types', () => {
  const map = loadMap();
  const f = (id, type, calc) => [id, { id, type, calc, points: 9, units: ['unit-1'] }];
  const good = Object.fromEntries([f('a', 'table', true), f('b', 'parametric', true), f('c', 'de', false), f('d', 'graph', false), f('e', 'techniques', false), f('g', 'series', false)]);
  const form = frq => ({ id: 'form-1', title: 'x', mcq: [], frq });
  const run = (frqs, ids) => checkForms([form(ids)], { map, bank: new Map(), examItems: new Map(), frqs, orderOf: () => 0, slots: BC_FRQ_SLOTS }).filter(e => /Section II question/.test(e));
  assert.deepEqual(run(good, ['a', 'b', 'c', 'd', 'e', 'g']), []);
  const bad = { ...good, b: { ...good.b, type: 'motion' }, c: { ...good.c, type: 'series' } };
  const errs = run(bad, ['a', 'b', 'c', 'd', 'e', 'g']);
  assert.ok(errs.some(e => /question 2 is the parametric slot/.test(e)));
  assert.ok(errs.some(e => /question 3 is shared with AB/.test(e)));
  // AB's forms are unaffected: without slots, no slot rule.
  assert.deepEqual(checkForms([form(['a', 'b', 'c', 'd', 'e', 'g'])], { map, bank: new Map(), examItems: new Map(), frqs: good, orderOf: () => 0 }).filter(e => /slot|shared with AB/.test(e)), []);
});
