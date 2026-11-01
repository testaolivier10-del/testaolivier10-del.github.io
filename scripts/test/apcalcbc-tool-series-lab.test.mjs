/* Series lab: its model (calculus-bc/assets/tools/math/series-lab.js), page script and validator
   (scripts/lib/apcalcbc-tool-checks/series-lab.mjs). OWNED BY THIS TOOL ONLY (builder T1).
   Partial sums against closed forms and known sums, the alternating series bound, power series
   against the functions they sum to, the interval grader on generated keys, same seed same
   problem, planted slips caught by the validator, and the shipped data passing it. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
process.env.APCALC_COURSE = 'bc';
const { loadMap, ROOT } = await import('../lib/apcalc-build.mjs');
const { runtime } = await import('../lib/apcalcbc-tool-checks/_shared.mjs');
const { check, intervalGrader } = await import('../lib/apcalcbc-tool-checks/series-lab.mjs');

const { M, model: S } = runtime('series-lab');
const data = JSON.parse(readFileSync(join(ROOT, 'calculus-bc', 'data', 'tools', 'series-lab.json'), 'utf8'));
const near = (a, b, tol) => Math.abs(a - b) <= tol;

test('series-lab: the model registers, the page script parses, and the validator checks the frame', () => {
  assert.ok(S && typeof S.generate === 'function' && !S.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'calculus-bc', 'assets', 'tools', 'series-lab.js'), 'utf8')));
  const map = loadMap();
  const ok = { slug: 'series-lab', kind: 'simulator', topic: 'series-convergence', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', kind: 'sum', topic: 'geometric-series' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', kind: 'taylor', topic: 'geometric-series' }] }, map).some(e => /kind/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', kind: 'test', fams: ['root'], topic: 'geometric-series' }] }, map).some(e => /family/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'calculus-bc', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'series-lab').topic, 'series-convergence');
});

test('series-lab: partial sums match the geometric closed form, and the gallery sums are right', () => {
  for (const [first, r] of [[1, 0.5], [3, -2 / 3], [2, 0.9], [5, 1.5]]) {
    const ps = S.partial(n => first * r ** n, 0, 40);
    for (const N of [1, 2, 7, 40]) assert.ok(near(ps[N - 1], S.geoSum(first, r, N), 1e-9 * Math.max(1, Math.abs(ps[N - 1]))), `S_${N} for r = ${r}`);
  }
  const g = id => S.galleryById(id);
  assert.ok(near(S.partial(g('fact').a, 0, 25).pop(), Math.E, 1e-14));
  assert.ok(near(S.partial(g('ratio3').a, 0, 60).pop(), Math.exp(3), 1e-10));
  assert.ok(near(S.partial(g('geo').a, 1, 60).pop(), 1, 1e-15));
  assert.ok(near(S.partial(g('p2').a, 1, 200000).pop(), Math.PI ** 2 / 6, 1e-5));
  // every gallery entry: a verdict, a best test that settles it, all six tests on its board
  for (const e of S.GALLERY) {
    assert.deepEqual(Object.keys(e.board).sort(), ['alt', 'direct', 'integral', 'limit', 'nth', 'ratio']);
    assert.equal(e.board[e.best][0], 'works', e.id);
    if (e.verdict === 'div') assert.equal(e.sum, null, e.id);
  }
});

test('series-lab: the alternating series bound holds at every N (|S - S_N| <= |a_(N+1)|)', () => {
  for (const id of ['altharm', 'leib']) {
    const e = S.galleryById(id), ps = S.partial(e.a, e.n0, 400);
    for (let N = 1; N <= 400; N++) {
      const err = Math.abs(e.sum - ps[N - 1]), next = Math.abs(e.a(e.n0 + N));
      assert.ok(err <= next + 1e-15, `${id}: N = ${N}, error ${err} > bound ${next}`);
      assert.ok(err >= next / 4, `${id}: the bound is not far from the error`);
    }
  }
});

test('series-lab: power series sum to their functions inside the interval and are flagged at the endpoints', () => {
  const at = (id, x, N) => S.powerAt(S.powerById(id), x, N);
  for (const [id, xs] of [['p1', [1.5, 3, 4.2]], ['p2', [-0.6, 0.3, 0.8]], ['p4', [-0.5, 0.4, 0.9]], ['p5', [-1.5, 0, 1.2]], ['p6', [-3, 1, 3.5]]]) {
    const P = S.powerById(id);
    for (const x of xs) { const r = at(id, x, 400); assert.ok(near(r.sums.at(-1), P.f(x), 1e-6), `${id} at ${x}: ${r.sums.at(-1)} vs ${P.f(x)}`); assert.ok(r.L < 1); }
  }
  assert.equal(at('p1', 1, 5).where, 'lo'); assert.equal(at('p1', 5, 5).where, 'hi');
  assert.equal(at('p5', 2, 5).where, 'hi'); assert.equal(at('p1', 6, 5).where, 'out');
  assert.equal(at('p7', 0, 5).where, 'center'); assert.equal(at('p7', 0.1, 5).L, Infinity);
  // the endpoints the gallery claims: the ln(1 + x) series converges at 1 to ln 2
  assert.ok(near(at('p4', 1, 100000).sums.at(-1), Math.LN2, 1e-4));
});

test('series-lab: same seed, same problem; every context generates its kind', () => {
  for (const c of data.contexts) {
    const a = S.generate(M.rng(4242), c), b = S.generate(M.rng(4242), c);
    assert.equal(JSON.stringify(a), JSON.stringify(b), c.id);
    assert.equal(a.type, c.kind);
    for (const s of a.steps) if (s.kind === 'choice') assert.equal(a.codes[s.key].length, s.options.length);
  }
});

test('series-lab: the interval grader takes the generated key and names the slips', () => {
  const IV = intervalGrader(), c = data.contexts.find(x => x.kind === 'interval');
  let seen = 0;
  for (let i = 1; i <= 200; i++) {
    const p = S.generate(M.rng(i * 31 + 7), c), I = p.steps.find(s => s.key === 'int').interval, K = IV.key(I);
    if (K.point || !isFinite(K.lo)) continue;
    seen++;
    assert.ok(IV.grade({ interval: I }, IV.text(K, 'x')).correct);
    if (K.loIn !== K.hiIn) {
      const g = IV.grade({ interval: I }, '(' + K.lo + ', ' + K.hi + ')');
      assert.ok(!g.correct && g.notes.length && g.right === 3, 'one bracket wrong is 3 of 4 with a note');
    }
    const rad = IV.grade({ interval: I }, String((K.hi - K.lo) / 2));
    assert.ok(!rad.correct && /radius/i.test(rad.notes.join(' ')), 'the radius alone is named');
  }
  assert.ok(seen > 100);
});

test('series-lab: the validator catches planted mistakes', () => {
  const map = loadMap(), gen = S.generate;
  const one = id => ({ ...data, contexts: data.contexts.filter(c => c.id === id) });
  const plant = (id, f, re) => {
    S.generate = (r, c, t) => f(gen(r, c, t));
    try { const errs = check(one(id), map); assert.ok(errs.some(e => re.test(e)), `${id}: ${errs.slice(0, 3).join(' | ') || 'no error'}`); }
    finally { S.generate = gen; }
  };
  const step = (p, k) => p.steps.find(s => s.key === k);
  plant('geometric', p => { const s = step(p, 'r'); s.cell.answer *= 2; return p; }, /step r keyed/);
  plant('geometric', p => { const s = step(p, 'conv'); s.correct = (s.correct + 1) % s.options.length; return p; }, /convergence keyed wrong/);
  plant('nth', p => { const s = step(p, 'test'); s.correct = (s.correct + 1) % s.options.length; return p; }, /keyed test/);
  plant('ratio', p => { const s = step(p, 'L'); s.cell.answer += 0.2; return p; }, /step L keyed/);
  plant('integral', p => { p.chk.wrong = []; const s = step(p, 'concl'); s.correct = (s.correct + 1) % s.options.length; return p; }, /conclusion keyed/);
  plant('comparison', p => { p.codes.test[p.codes.test.findIndex(c => c !== p.chk.best)] = p.chk.best === 'direct' ? 'limit' : 'direct'; return p; }, /distractor|keyed test/);
  plant('absolute', p => { const s = step(p, 'cls'); s.correct = (s.correct + 1) % s.options.length; return p; }, /classification keyed|option/);
  plant('interval', p => { const I = step(p, 'int').interval; if (I.point == null && I.lo !== '-inf') I.loIn = !I.loIn; else I.mistakes = [{ answer: I.point != null ? 'x = ' + I.point : 'all real numbers', why: 'x' }]; return p; }, /brackets|mistake/);
  plant('interval', p => { const s = step(p, 'R'); if (s) s.cell.answer = s.cell.answer ** 2 + 1; else step(p, 'int').interval.mistakes = [{ answer: 'all real numbers', why: 'x' }, { answer: 'x = ' + p.fig.center, why: 'x' }]; return p; }, /step R keyed|mistake/);
  plant('partial', p => { step(p, 'a3').cell.answer += 1; return p; }, /step a3 keyed/);
});

test('series-lab: the shipped data passes its validator', () => {
  assert.deepEqual(check(data, loadMap()), []);
});
