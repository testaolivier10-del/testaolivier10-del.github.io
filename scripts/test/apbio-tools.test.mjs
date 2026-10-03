/* AP® Biology tools: the pure math every tool runs (bio/assets/tools/
   bio-tool-math.js, bio-skill-problems.js), the validators on the shipped
   data, the validators catching planted mistakes, and the generator's
   publishing rule for tool data. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runtime } from '../lib/apbio-tool-checks/_shared.mjs';
import { ROOT } from '../lib/apbio-build.mjs';

const { M, P } = runtime();
const near = (a, b, t = 1e-9) => assert.ok(Math.abs(a - b) <= t, `${a} vs ${b}`);
const data = slug => JSON.parse(readFileSync(join(ROOT, 'bio', 'data', 'tools', `${slug}.json`), 'utf8'));

test('statistics follow the formula sheet', () => {
  near(M.sd([2, 4, 4, 4, 5, 5, 7, 9]), Math.sqrt(32 / 7));      // n - 1, not n
  near(M.se([2, 4, 4, 4, 5, 5, 7, 9]), Math.sqrt(32 / 7) / Math.sqrt(8));
  near(M.median([5, 1, 3, 2]), 2.5);
  const c = M.ci95(10, 0.5); near(c.lo, 9); near(c.hi, 11);
  near(M.percentChange(4, 5), 25);
  assert.deepEqual(Array.from(M.CHI_CRIT['0.05'].slice(1)), [3.84, 5.99, 7.82, 9.49, 11.07, 12.59, 14.07, 15.51]);
  const x = M.chiSquare([32, 18, 14, 16], [20, 20, 20, 20]);
  near(x.chi2, 10); assert.equal(x.df, 3); assert.equal(x.reject, true);
  near(M.psiS(1, 0.3, 22), -0.3 * 0.0831 * 295);
  near(M.psiS(2, 0.1, 25), -2 * 0.1 * 0.0831 * 298);
  const h = M.hwCounts(196, 168, 36); near(h.p, 0.7); near(h.pq2, 0.42);
  near(M.hwRecessive(0.16).p, 0.6);
  near(M.simpson([40, 30, 20, 10]).D, 0.7);
});

test('enzyme model: competitive raises Km only, noncompetitive lowers Vmax only', () => {
  const A = data('enzyme-activity').profiles[0], c = { T: 37, pH: 7, inhibitor: 'none' };
  const k0 = M.enzyme.params(A, c), kc = M.enzyme.params(A, { ...c, inhibitor: 'competitive', I: 2 }), kn = M.enzyme.params(A, { ...c, inhibitor: 'noncompetitive', I: 2 });
  near(kc.vmax, k0.vmax); near(kc.km, 3 * k0.km);
  near(kn.km, k0.km); near(kn.vmax, k0.vmax / 3);
  near(M.enzyme.rate(A, c, k0.km), k0.vmax / 2);
  assert.ok(Math.abs(M.enzyme.optimumT(A) - 40.5) < 0.5 && Math.abs(M.enzyme.optimumPH(A) - 7) < 0.05);
});

test('osmosis model: direction, turgor, plasmolysis, lysis', () => {
  const s = Object.fromEntries(data('osmosis').systems.map(x => [x.id, x]));
  const run = (sys, c) => M.osmosis.simulate(sys, { outI: 1, inI: 1, T: sys.defaults.T, t: sys.time.value, ...c });
  assert.equal(run(s.potato, { outC: 0 }).state, 'turgid');
  assert.equal(run(s.potato, { outC: 1 }).state, 'plasmolyzed');
  assert.equal(run(s.rbc, { outC: 0 }).lysed, true);
  assert.ok(run(s.bag, { inC: 1, outC: 0 }).pct > 0 && run(s.bag, { inC: 0, outC: 1 }).pct < 0);
});

test('graph scale checks', () => {
  const ok = r => r.every(x => x.ok);
  assert.ok(ok(M.graph.checkScale({ min: 0, max: 8, interval: 1 }, [2.1, 7.5])));
  assert.ok(!ok(M.graph.checkScale({ min: 0, max: 7, interval: 3 }, [2.1, 6.5])), 'uneven interval');
  assert.ok(!ok(M.graph.checkScale({ min: 0, max: 100, interval: 10 }, [2.1, 7.5])), 'data use too little of the grid');
  assert.ok(!ok(M.graph.checkScale({ min: 2, max: 8, interval: 1 }, [2.1, 7.5])), 'should start at 0');
  assert.ok(!ok(M.graph.checkScale({ min: 0, max: 30, interval: 5 }, [-5, 20])), 'negative values off the axis');
  assert.ok(ok(M.graph.checkScale({ min: 6, max: 10, interval: 0.5 }, [6.1, 9.6])), 'far from zero may start above 0');
});

test('seeded problems repeat exactly', () => {
  const c = data('chi-square').contexts[0];
  assert.equal(JSON.stringify(P.generate.chi(M.rng(99), c)), JSON.stringify(P.generate.chi(M.rng(99), c)));
});

test('every tool data file passes its validator', async () => {
  for (const f of readdirSync(join(ROOT, 'bio', 'data', 'tools')).filter(f => f.endsWith('.json'))) {
    const { check } = await import(`../lib/apbio-tool-checks/${f.replace('.json', '.mjs')}`);
    assert.deepEqual(check(data(f.slice(0, -5)), null), [], f);
  }
});

test('validators catch planted mistakes', async () => {
  const chi = data('chi-square'); chi.problems[0].expect.chi2 = 9.99;
  assert.ok((await import('../lib/apbio-tool-checks/chi-square.mjs')).check(chi, null).some(e => /expect\.chi2/.test(e)));
  const en = data('enzyme-activity'); en.stimuli['enz-s1'].tables[0].rows[0][2] = '9.9';
  assert.ok((await import('../lib/apbio-tool-checks/enzyme-activity.mjs')).check(en, null).some(e => /the model gives/.test(e)));
  const os = data('osmosis'); os.questions[1].numeric.answer = -6;
  assert.ok((await import('../lib/apbio-tool-checks/osmosis.mjs')).check(os, null).some(e => /potato:2/.test(e)));
  const gb = data('graph-builder'); gb.datasets[0].scale.y.max = 50;
  assert.ok((await import('../lib/apbio-tool-checks/graph-builder.mjs')).check(gb, null).some(e => /reference scale/.test(e)));
  const dr = data('design-drills'); dr.scenarios[0].cer = dr.scenarios[0].cer.filter(c => c.tag !== 'reasoning');
  assert.ok((await import('../lib/apbio-tool-checks/design-drills.mjs')).check(dr, null).some(e => /reasoning/.test(e)));
  const ds = data('descriptive-stats'); ds.intro = 'Ready for AP tests';
  assert.ok((await import('../lib/apbio-tool-checks/descriptive-stats.mjs')).check(ds, null).some(e => /AP/.test(e)));
});

test('tool pages are generated; data is served only for published topics', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'apbio-tools-')), 'bio');
  execFileSync(process.execPath, ['scripts/build-apbio.mjs', '--out', out], { env: { ...process.env, APBIO_MAP_STUB: '1', APBIO_PUBLISHED: 'unit-1,skills-stats' } });
  const page = readFileSync(join(out, 'tools', 'chi-square.html'), 'utf8');
  assert.match(page, /data-src="\.\.\/assets\/tool-data\/chi-square\.json"/);
  assert.match(page, /noindex/, 'a tool whose topic is not published is noindex');
  // the stub map has none of the tool topics, so nothing is live
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(out, 'assets', 'tool-data', 'chi-square.json'), 'utf8'))).sort(), ['arrives', 'live', 'slug']);
  assert.match(readFileSync(join(out, 'assets', 'bio-curriculum.js'), 'utf8'), /window\.ApBioToolList = \[\{"slug":"osmosis"/);
});
