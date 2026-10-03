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

test('signal model: amplification at enzyme steps, termination, blocks', () => {
  const d = data('signal-transduction-amplification'), p = d.model, S = M.signal;
  const at = (c, t) => S.at(S.simulate(p, { L: 10, tOff: 120, gprotein: 'normal', ...c }), t);
  const a = at({}, 60);
  near(a.R, 500, 1);                                   // half the receptors bound at L = Kd
  assert.ok(a.G / a.R > 10 && a.AC < a.G && a.cAMP / a.AC > 100, 'receptor and cyclase amplify, G to cyclase does not');
  assert.ok(at({}, 240).rate < 0.01 * a.rate, 'the signal ends after washout');
  assert.ok(at({ pde: true }, 240).rate > 0.5 * a.rate, 'a PDE inhibitor prolongs it');
  assert.ok(at({ gprotein: 'on', L: 0 }, 120).G > 10 * at({ L: 0 }, 120).G, 'a locked-on G protein needs no ligand');
  assert.equal(at({ pka: true }, 60).cAMP, a.cAMP);
  assert.equal(S.fmt(2079824), '2,080,000'); assert.equal(S.fmt(0.2), '0');
});

test('cell cycle model: growth factor, Rb, p53 and the spindle checkpoint', () => {
  const p = data('cell-cycle-checkpoints').model, C = M.cellCycle, N = { gf: 1, damage: 0, p53: true };
  const at = (c, t = 48) => C.at(C.simulate(p, { ...N, ...c }), t);
  near(at({}, 0).N, 1000, 1e-6);
  near(at({}, 24).N / 1000, 2, 0.1);
  assert.equal(at({ gf: 0 }).divRate, 0);
  near(at({ gf: 0, rb: true }).divRate, at({}).divRate, 1e-9);
  assert.ok(at({ damage: 0.02, p53: false }).pctDivDam > 10 * at({ damage: 0.02 }).pctDivDam);
  const sp = at({ spindle: true }, 24); assert.ok(sp.hist[5] / sp.N > 0.95 && sp.div === 0);
  assert.equal(JSON.stringify(C.simulate(p, N)), JSON.stringify(C.simulate(p, N)), 'deterministic');
});

test('meiosis model: n, nondisjunction in meiosis I and II, 2^n, crossing over, mitosis', () => {
  const Me = M.meiosis, labels = c => Me.simulate(c).gametes.map(g => g.label).join(',');
  assert.equal(labels({ pairs: 3 }), 'n,n,n,n');
  assert.equal(labels({ pairs: 3, nd: 'I', ndPair: 1 }), 'n+1,n+1,n−1,n−1');
  assert.equal(labels({ pairs: 3, nd: 'II', ndPair: 1, ndCell: 1 }), 'n,n,n+1,n−1');
  assert.deepEqual(Array.from(Me.simulate({ pairs: 2, nd: 'I' }).gametes, g => g.zygote), [5, 5, 3, 3]);
  assert.equal(Me.series({ pairs: 3 }).kinds, 8);
  assert.equal(Me.series({ pairs: 3, cross: true }).kinds, 64);
  assert.equal(Me.simulate({ pairs: 3, cross: true }).kinds, 4);
  assert.deepEqual(Array.from(Me.simulate({ pairs: 3, nd: 'I' }).stages.find(s => s.id === 'gametes').dna).map(x => +x.toFixed(2)), [1.33, 1.33, 0.67, 0.67]);
  const mi = Me.mitosis({ pairs: 3 }); assert.ok(mi.identical); assert.deepEqual(Array.from(mi.counts), [6, 6]);
});

test('operon model: inducible lac with CAP, repressible trp, mutations, cis and trans, the mRNA–enzyme lag', () => {
  const p = data('operons').model, O = M.operon, W = { I: '+', O: '+', Z: '+' };
  const lac = (k, glucose, lactose) => O.state(p, { mode: 'lac', glucose, lactose, copies: k });
  const levels = k => [[true, false], [true, true], [false, false], [false, true]].map(([g, l]) => lac(k, g, l).m);
  assert.deepEqual(levels([W]), [1, 10, 1, 100]);
  assert.deepEqual(levels([{ ...W, I: '-' }]), [10, 10, 100, 100]);
  assert.deepEqual(levels([{ ...W, O: 'c' }]), [10, 10, 100, 100]);
  assert.deepEqual(levels([{ ...W, I: 's' }]), [1, 1, 1, 1]);
  const z = lac([{ ...W, Z: '-' }], false, true); assert.equal(z.m, 100); assert.equal(z.e, 0);
  assert.equal(lac([{ ...W, I: '-' }, W], false, false).m, 2, 'lacI⁺ on F′ acts in trans');
  assert.equal(lac([{ ...W, I: 's' }, W], false, true).m, 2, 'lacIˢ is dominant');
  const cis = lac([{ ...W, O: 'c', Z: '-' }, W], false, false); assert.equal(cis.m, 101); assert.equal(cis.e, 1, 'Oᶜ acts in cis');
  const trp = (k, t) => O.state(p, { mode: 'trp', trp: t, copies: [{ R: '+', O: '+', ...k }] }).m;
  assert.deepEqual([trp({}, false), trp({}, true), trp({ R: '-' }, true), trp({ O: 'c' }, true)], [100, 1, 100, 100]);
  const co = O.course(p, { mode: 'lac', glucose: true, lactose: false, copies: [W] }, { mode: 'lac', glucose: false, lactose: true, copies: [W] });
  assert.equal(O.at(co, -5).m, 1);
  assert.ok(O.at(co, 10).m > 95 && O.at(co, 10).e < 15 && O.at(co, 90).e > 75 && O.at(co, 90).e < 100);
  assert.equal(JSON.stringify(co), JSON.stringify(O.course(p, { mode: 'lac', glucose: true, lactose: false, copies: [W] }, { mode: 'lac', glucose: false, lactose: true, copies: [W] })), 'deterministic');
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

test('popgen model: Hardy-Weinberg, selection, drift from a seed, bottleneck, chi-square', () => {
  const G = M.popgen, c = { ...data('hardy-weinberg-drift').defaults, N: 0, reps: 1, gens: 20 };
  const hw = G.simulate({ ...c, p0: 0.3 }).reps[0];
  near(hw.p[20], 0.3); near(hw.g[20][1], 0.42);
  const sel = G.simulate({ ...c, w: [1, 1, 0] }).reps[0];
  near(1 - sel.p[10], 0.5 / 6);
  near(G.simulate({ ...c, F: 0.5 }).reps[0].g[5][1], 0.25);
  const d = { ...c, N: 20, gens: 100, reps: 10, seed: 2026 };
  assert.deepEqual(G.simulate(d).fates, G.simulate(d).fates);
  assert.deepEqual({ ...G.simulate(d).fates }, { fixed: 5, lost: 4, poly: 1, extinct: 0 }, 'the documented seeded run');
  const b = G.simulate({ ...d, N: 1000, reps: 1, event: { gen: 10, size: 5, len: 2 } }).reps[0];
  assert.deepEqual([b.n[9], b.n[10], b.n[11], b.n[12]], [1000, 5, 5, 1000]);
  const x = G.chi([0.425, 0.345, 0.23], 200);
  assert.deepEqual(Array.from(x.obs), [85, 69, 46]); near(x.chi2, 15.987, 1e-3); assert.equal(x.reject2, true);
  assert.equal(G.chi([1, 0, 0], 50).chi2, null, 'nothing to test when an allele is fixed');
});

test('phylo model: parse, rotation, MRCA, clades, sisters, distances, trees from characters', () => {
  const Ph = M.phylo, t = Ph.parse('(alga,(moss,(fern,(pine,(rose,grass)))))');
  const key = Ph.key(t);
  Ph.internal(t).forEach(n => Ph.rotate(n));
  assert.equal(Ph.key(t), key, 'rotation keeps the tree');
  assert.deepEqual([...Ph.leaves(t)].map(n => n.name), ['grass', 'rose', 'pine', 'fern', 'moss', 'alga']);
  assert.equal(Ph.mrca(t, ['rose', 'pine']).id, 4);
  assert.equal(Ph.classify(t, ['pine', 'rose', 'grass']).kind, 'clade');
  assert.equal(Ph.classify(t, ['moss', 'fern']).kind, 'paraphyletic');
  assert.equal(Ph.classify(t, ['moss', 'pine']).kind, 'polyphyletic');
  assert.deepEqual([...Ph.sisters(Ph.find(t, ['pine']))].map(n => n.tips.join()), ['grass,rose']);
  near(Ph.distance(Ph.parse('((a:1,b:2):0.5,c:3)'), 'a', 'c'), 4.5);
  const built = Ph.fromCharacters(['P', 'Q', 'R', 'S'], [{ id: 1, has: ['Q', 'R', 'S'] }, { id: 2, has: ['R', 'S'] }]);
  assert.equal(Ph.key(Ph.parse(built.tree)), '(((R,S),Q),P)'); assert.equal(built.conflicts.length, 0);
  assert.equal(Ph.fromCharacters(['P', 'Q', 'R', 'S'], [{ id: 1, has: ['Q', 'R'] }, { id: 2, has: ['R', 'S'] }]).conflicts.length, 1);
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
  const sg = data('signal-transduction-amplification'); sg.stimuli['sig-s1'].tables[1].rows[2][1] = '3.99';
  assert.ok((await import('../lib/apbio-tool-checks/signal-transduction-amplification.mjs')).check(sg, null).some(e => /the model gives/.test(e)));
  const sg2 = data('signal-transduction-amplification'); sg2.stages[2].amplifies = true;
  assert.ok((await import('../lib/apbio-tool-checks/signal-transduction-amplification.mjs')).check(sg2, null).some(e => /marked as amplifying/.test(e)));
  const cc = data('cell-cycle-checkpoints'); cc.stimuli['cc-s1'].tables[0].rows[2][5] = '20.0';
  assert.ok((await import('../lib/apbio-tool-checks/cell-cycle-checkpoints.mjs')).check(cc, null).some(e => /the model gives/.test(e)));
  const cc2 = data('cell-cycle-checkpoints'); cc2.model.repair = 0;
  assert.ok((await import('../lib/apbio-tool-checks/cell-cycle-checkpoints.mjs')).check(cc2, null).length > 0, 'a changed model parameter breaks the tables');
  const me = data('meiosis-nondisjunction'); me.stimuli['mei-s1'].tables[0].rows[1][3] = '3 (n)';
  assert.ok((await import('../lib/apbio-tool-checks/meiosis-nondisjunction.mjs')).check(me, null).some(e => /the model gives/.test(e)));
  const me2 = data('meiosis-nondisjunction'); me2.questions[1].numeric.answer = 8;
  assert.ok((await import('../lib/apbio-tool-checks/meiosis-nondisjunction.mjs')).check(me2, null).some(e => /cells:2/.test(e)));
  const op = data('operons'); op.stimuli['op-s1'].tables[0].rows[1][4] = '10';
  assert.ok((await import('../lib/apbio-tool-checks/operons.mjs')).check(op, null).some(e => /the model gives/.test(e)));
  const op2 = data('operons'); op2.questions[2].numeric.answer = 2.2;
  assert.ok((await import('../lib/apbio-tool-checks/operons.mjs')).check(op2, null).some(e => /lac:3/.test(e)));
  const op3 = data('operons'); op3.model.noCap = 100;
  assert.ok((await import('../lib/apbio-tool-checks/operons.mjs')).check(op3, null).length > 0, 'CAP must matter');
  const hw = data('hardy-weinberg-drift'); hw.stimuli['hw-s1'].tables[0].rows[1][2] = '6';
  assert.ok((await import('../lib/apbio-tool-checks/hardy-weinberg-drift.mjs')).check(hw, null).some(e => /the model gives/.test(e)));
  const hw2 = data('hardy-weinberg-drift'); hw2.questions[3].numeric.answer = 15.0;
  assert.ok((await import('../lib/apbio-tool-checks/hardy-weinberg-drift.mjs')).check(hw2, null).some(e => /hwe:4/.test(e)));
  const tr = data('tree-reading'); tr.trees[1].characters[2].has = ['fern', 'pine'];
  assert.ok((await import('../lib/apbio-tool-checks/tree-reading.mjs')).check(tr, null).some(e => /plants/.test(e)));
  const tr2 = data('tree-reading'); tr2.stimuli['tr-s1'].tables[1].rows[0][2] = '1.4';
  assert.ok((await import('../lib/apbio-tool-checks/tree-reading.mjs')).check(tr2, null).some(e => /the trees give/.test(e)));
  const tr3 = data('tree-reading'); tr3.stimuli['tr-s1'].drawings.order2 = ['alga', 'moss', 'grass', 'fern', 'rose', 'pine'];
  assert.ok((await import('../lib/apbio-tool-checks/tree-reading.mjs')).check(tr3, null).some(e => /drawings/.test(e)));
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
