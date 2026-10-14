/* Curve analyzer: its model (calculus/assets/tools/math/curve-analyzer.js)
   and its validator (scripts/lib/apcalc-tool-checks/curve-analyzer.mjs).
   OWNED BY THIS TOOL ONLY. Same seed same problem; the curves' critical
   points, kinds, inflection points and absolute extrema; the sentences a
   reader accepts; the optimization answers; the named misses (f′ = 0 is not
   enough, a local argument for an absolute extremum, f″ = 0 without a sign
   change); planted mistakes caught; the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check, curveProblems } from '../lib/apcalc-tool-checks/curve-analyzer.mjs';
import { loadMap, ROOT } from '../lib/apcalc-build.mjs';

const { M, model } = runtime('curve-analyzer');
const data = () => JSON.parse(readFileSync(`${ROOT}/calculus/data/tools/curve-analyzer.json`, 'utf8'));
const plain = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<[^>]+>/g, '');

test('curve-analyzer: the shipped data passes its validator (300 problems per context, keys recomputed)', () => {
  assert.deepEqual(check(data(), loadMap()), []);
});

test('curve-analyzer: the frame and the lists are checked', () => {
  const map = loadMap(), d = { ...data(), contexts: [] };
  assert.ok(check({ ...d, slug: 'x' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...d, curves: ['nope'] }, map).some(e => /unknown curve/.test(e)));
  assert.ok(check({ ...d, optimize: [{ id: 'kite', topic: 'optimization-intro' }] }, map).some(e => /unknown scene/.test(e)));
});

test('curve-analyzer: the curves are analyzed right', () => {
  assert.deepEqual(curveProblems(model), []);
  const k = id => model.analyze(model.CURVES[id]);
  const cubic = k('cubic');
  assert.deepEqual([...cubic.crit.map(c => [c.x, c.kind].join(':'))], ['-1:max', '3:min']);
  assert.deepEqual([...cubic.infl], [1]);
  assert.equal(cubic.absMax.y, 10); assert.equal(cubic.absMax.x, -1);
  assert.equal(cubic.absMin.y, -22); assert.equal(cubic.absMin.x, 3);
  const q = k('quartic');                                  // f′ = 4x²(x − 3): no extremum at 0
  assert.equal(q.crit[0].kind, 'none'); assert.equal(q.crit[1].kind, 'min');
  assert.equal(q.absMax.role, 'endpoint');                 // f(−1) = 5 beats every critical point
  const cusp = k('cusp');                                  // f′ undefined at 0: a relative maximum
  assert.ok(cusp.crit[0].undef && cusp.crit[0].kind === 'max');
  assert.deepEqual([...cusp.infl], [-1]);
  const fs = model.features(model.CURVES.quartic).map(f => plain(f.text));
  assert.ok(fs.some(t => /neither a maximum nor a minimum/.test(t) && /does not change sign/.test(t)));
  assert.ok(fs.some(t => /relative minimum/.test(t) && /changes from negative to positive/.test(t)));
  // optimization
  assert.equal(model.SCENES.box.obj(model.SCENES.box.best), 128);
  assert.equal(model.SCENES.fence.obj(model.SCENES.fence.best), 7200);
  assert.ok(Math.abs(model.SCENES.can.best - 3.837215) < 1e-6 && Math.abs(model.SCENES.can.dobj(model.SCENES.can.best)) < 1e-9);
});

test('curve-analyzer: same seed, same problem; the misses are named', () => {
  for (const kind of model.KINDS) {
    const ctx = { id: kind, topic: 't', kind };
    assert.equal(model.generate(M.rng(11), ctx).text, model.generate(M.rng(11), ctx).text, kind);
  }
  let trap = false;
  for (let i = 1; i < 120; i++) {
    const e = model.generate(M.rng(i), { id: 'extrema', topic: 't', kind: 'extrema' }), why = e.steps.find(s => s.key === 'why');
    assert.match(plain(why.why[1]), /not enough/);                       // f′ = 0 alone
    const c = model.generate(M.rng(i), { id: 'candidates', topic: 't', kind: 'candidates' }), cw = c.steps.find(s => s.key === 'why');
    assert.match(plain(cw.why[1]), /local argument/);                     // a sign change for an absolute extremum
    const mx = c.steps.find(s => s.key === 'max');
    assert.ok(M.diagnose(mx.cell, mx.cell.answer).ok);
    const k = model.generate(M.rng(i), { id: 'concavity', topic: 't', kind: 'concavity' });
    if (k.values.trap) { trap = true; assert.match(plain(k.steps.find(s => s.key === 'where').why[1]), /not enough/); }
  }
  assert.ok(trap, 'no x⁴-type concavity problem in 120 seeds');
});

test('curve-analyzer: a planted wrong key is caught', () => {
  const real = model.generate;
  model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'candidates') { const s = p.steps.find(x => x.key === 'max'); s.cell.answer = p.values.xMax; s.cell.mistakes = []; } return p; };
  try { const d = data(); assert.ok(check({ ...d, contexts: d.contexts.filter(c => c.kind === 'candidates') }, loadMap()).some(e => /extrema/.test(e))); }
  finally { model.generate = real; }
});
