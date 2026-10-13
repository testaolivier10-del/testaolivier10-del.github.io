/* Motion lab: its model (calculus/assets/tools/math/motion-lab.js) and its
   validator (scripts/lib/apcalc-tool-checks/motion-lab.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem; the motions' derivatives and
   accumulated positions; speeding up and slowing down from the signs; a
   double zero of v is not a turn; distance at least |displacement|; the
   named misses; planted mistakes caught; the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check, motionProblems } from '../lib/apcalc-tool-checks/motion-lab.mjs';
import { loadMap, ROOT } from '../lib/apcalc-build.mjs';

const { M, model } = runtime('motion-lab');
const data = () => JSON.parse(readFileSync(`${ROOT}/calculus/data/tools/motion-lab.json`, 'utf8'));

test('motion-lab: the shipped data passes its validator (300 problems per context, keys recomputed)', () => {
  assert.deepEqual(check(data(), loadMap()), []);
});

test('motion-lab: the frame and the motion list are checked', () => {
  const map = loadMap(), d = { ...data(), contexts: [] };
  assert.ok(check({ ...d, slug: 'x' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...d, motions: [{ id: 'nope', topic: 'straight-line-motion' }] }, map).some(e => /unknown motion/.test(e)));
  assert.ok(check({ ...d, motions: [{ id: 'vpoly', topic: 'straight-line-motion' }] }, map).some(e => /motion-with-integrals/.test(e)));
  assert.ok(check({ ...d, contexts: [{ id: 'd', topic: 'straight-line-motion', kind: 'dist' }] }, map).some(e => /belongs to topic/.test(e)));
});

test('motion-lab: the motions are consistent (derivatives, accumulation, distance, turns)', () => {
  assert.deepEqual(motionProblems(model), []);
  const c = model.MOTIONS.cubic, A = model.analyze(c);
  assert.equal(A.turns.length, 2); assert.ok(Math.abs(A.turns[0] - 1) < 1e-9 && Math.abs(A.turns[1] - 3) < 1e-9);
  assert.deepEqual([...A.intervals.map(i => i.kind)], ['down', 'up', 'down', 'up']);   // v·a: (+,−), (−,−), (−,+), (+,+)
  assert.ok(Math.abs(model.distTo(c, 4.2) - (4 + 4 + (c.x(4.2) - 1))) < 1e-9);
  const g = model.MOTIONS.vgraph;                                                   // areas: 6 + 2.25 − 0.25 − 2 − 0.5
  assert.ok(Math.abs(model.xAt(g, 7) - (-4 + 6 + 2.25 - 0.25 - 2 - 0.5)) < 1e-12);
  assert.ok(Math.abs(model.distTo(g, 7) - (6 + 2.25 + 0.25 + 2 + 0.5)) < 1e-12);
  const p = model.MOTIONS.vpoly;
  assert.ok(Math.abs(model.xAt(p, 5) - p.exact(5)) < 1e-9);
  // At rest for an instant is not "slowing down".
  assert.equal(model.describe(g, 7).state, 'rest');
  assert.equal(model.describe(c, 1).state, 'turn');
});

test('motion-lab: same seed, same problem; misses are named', () => {
  for (const kind of model.KINDS) {
    const ctx = { id: kind, topic: 't', kind };
    const a = model.generate(M.rng(7), ctx), b = model.generate(M.rng(7), ctx);
    assert.equal(a.text, b.text, kind);
  }
  for (let i = 1; i < 80; i++) {
    const d = model.generate(M.rng(i), { id: 'dist', topic: 't', kind: 'dist' }), S = k => d.steps.find(s => s.key === k);
    assert.ok(S('dist').cell.answer >= Math.abs(S('disp').cell.answer));
    assert.match(M.diagnose(S('dist').cell, S('disp').cell.answer).why, /displacement/);       // distance given as displacement
    assert.match(M.diagnose(S('xT').cell, S('disp').cell.answer).why, /starting position/);   // initial position dropped
    assert.ok(M.diagnose(S('disp').cell, +M.fixed(S('disp').cell.answer, 3)).ok);              // three decimals accepted
    const s = model.generate(M.rng(i), { id: 'speed', topic: 't', kind: 'speed' });
    const st = s.steps.find(x => x.key === 'state');
    assert.equal(st.correct, 0);
    assert.match(st.why[1], /alone never decides/);                                           // right conclusion, a-only reason
  }
  // A double zero of v: the particle does not turn there.
  for (let i = 1; i < 200; i++) {
    const t = model.generate(M.rng(i), { id: 'turn', topic: 't', kind: 'turn' });
    if (!t.values.dbl) continue;
    assert.match(t.steps.find(x => x.key === 'sign').options[0].replace(/<[^>]+>/g, ''), /^No/);
    assert.deepEqual([...t.values.turns], [t.values.q]);
    return;
  }
  assert.fail('no double-zero problem in 200 seeds');
});

test('motion-lab: a planted wrong key is caught', () => {
  const real = model.generate;
  model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'dist') { const s = p.steps.find(x => x.key === 'dist'); s.cell.answer = Math.abs(p.steps[0].cell.answer); s.cell.mistakes = []; } return p; };
  try { const d = data(); assert.ok(check({ ...d, contexts: d.contexts.filter(c => c.kind === 'dist') }, loadMap()).some(e => /distance/.test(e))); }
  finally { model.generate = real; }
});
