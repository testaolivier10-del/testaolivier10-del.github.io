/* AP® Chemistry trainers and drills: the seeded generators in
   chem/assets/tools/chem-tool-math.js (same seed, same problem; answers
   recomputed here from first principles), the validators on the shipped
   data, the validators catching planted mistakes, and the generator's rule
   that tool content is served only for published units. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runtime } from '../lib/apchem-tool-checks/_shared.mjs';
import { ROOT, loadMap } from '../lib/apchem-build.mjs';

const { M } = runtime();
const map = loadMap();
const data = slug => JSON.parse(readFileSync(join(ROOT, 'chem', 'data', 'tools', `${slug}.json`), 'utf8'));
const ctx = (slug, id) => data(slug).contexts.find(c => c.id === id);
const near = (a, b, rel = 1e-9) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b) + 1e-12, `${a} vs ${b}`);
const SLUGS = ['ice-table-drills', 'q-vs-k', 'buffer-drills', 'titration-curve-reader', 'particle-diagrams', 'units-sig-figs'];
const GEN = {
  'ice-table-drills': (r, c, t) => M.ice.generate(r, c, t), 'q-vs-k': (r, c) => M.qk.generate(r, c), 'buffer-drills': (r, c, t) => M.buffer.generate(r, c, t),
  'titration-curve-reader': (r, c) => M.titration.generate(r, c), 'particle-diagrams': (r, c) => M.particles.generate(r, c), 'units-sig-figs': (r, c) => M.units.generate(r, c),
};

test('every generator is deterministic for a seed and varies across seeds', () => {
  for (const slug of SLUGS) for (const c of data(slug).contexts) for (const t of c.types || [undefined]) {
    const a = JSON.stringify(GEN[slug](M.rng(1234), c, t)), b = JSON.stringify(GEN[slug](M.rng(1234), c, t));
    assert.equal(a, b, `${slug} ${c.id} ${t}: same seed, same problem`);
    const seen = new Set([1, 2, 3, 4, 5, 6].map(s => JSON.stringify(GEN[slug](M.rng(s * 101), c, t))));
    assert.ok(seen.size >= 3, `${slug} ${c.id} ${t}: seeds give different problems`);
  }
});

test('ICE tables: find K, small x with the 5% check, perfect square', () => {
  const hi = ctx('ice-table-drills', 'hydrogen-iodide'), n2o4 = ctx('ice-table-drills', 'dinitrogen-tetroxide');
  for (let s = 1; s <= 40; s++) {
    const p = M.ice.generate(M.rng(s), hi, 'square');
    const [h2, i2, hiE] = p.E;
    near(hiE ** 2 / (h2 * i2), p.K, 1e-6);                       // Q = K exactly
    near(Math.sqrt(p.K), 2 * p.x / (p.c0[0] - p.x), 1e-6);       // √K = 2x / (c − x)
    const k = M.ice.generate(M.rng(s), n2o4, 'findK');
    near(k.E[1] ** 2 / k.E[0], k.K, 1e-9);
    const x = M.ice.generate(M.rng(s), n2o4, 'smallx');
    near((2 * x.xApprox) ** 2 / x.c0[0], x.K, 1e-6);             // (2x)² / c = K
    near(x.pct, 100 * x.xApprox / x.c0[0], 1e-9);
    assert.equal(x.ok, x.pct <= 5);
    if (!x.ok) near(x.E[1] ** 2 / x.E[0], x.K, 1e-6);             // exact when the check fails
  }
  // Both outcomes of the 5% check occur.
  const oks = new Set(Array.from({ length: 80 }, (_, s) => M.ice.generate(M.rng(s + 1), n2o4, 'smallx').ok));
  assert.deepEqual([...oks].sort(), [false, true]);
});

test('ICE feedback names the slip', () => {
  const p = M.ice.generate(M.rng(77), ctx('ice-table-drills', 'dinitrogen-tetroxide'), 'smallx');
  const C = p.steps.find(s => s.key === 'C');
  assert.match(M.diagnose(C.cells[1], 1).why, /coefficients/);       // +x for +2x
  assert.match(M.diagnose(C.cells[0], 1).why, /sign/i);              // + for a reactant
  assert.equal(M.diagnose(C.cells[1], 2).ok, true);
  assert.equal(M.parseCoef('−2x'), -2); assert.equal(M.parseCoef('+x'), 1); assert.equal(M.parseCoef('0'), 0); assert.equal(M.parseCoef('- 3 x'), -3); assert.ok(Number.isNaN(M.parseCoef('2')));
  const xa = p.steps.find(s => s.key === 'xa');
  assert.match(M.diagnose(xa.cell, M.smallX(p.species, p.c0, p.K, true)).why, /\(2x\)²/);
});

test('Q vs K: Q from numbers and from particle counts, direction and justification', () => {
  for (let s = 1; s <= 60; s++) {
    const p = M.qk.generate(M.rng(s), ctx('q-vs-k', 'calcium-carbonate'));
    near(p.Q, p.c[2]);                                            // solids left out
    const d = M.qk.generate(M.rng(s), ctx('q-vs-k', 'particles-ab'));
    near(d.Q, (d.counts[2] * 0.1) ** 2 / (d.counts[0] * 0.1 * d.counts[1] * 0.1));
    const want = d.Q < d.K * 0.975 ? 'f' : d.Q > d.K * 1.025 ? 'r' : 'eq';
    assert.equal(d.dir, want);
    const just = d.steps.find(x => x.key === 'just');
    assert.match(just.options[just.correct], d.dir === 'f' ? /less than K.*forward/ : d.dir === 'r' ? /greater than K.*reverse/ : /equals K.*no net change/);
  }
  const dm = M.qk.generate(M.rng(9), ctx('q-vs-k', 'particles-dimer'));
  const Qstep = dm.steps[0];
  assert.match(M.diagnose(Qstep.cell, dm.counts[1] ** 2 / dm.counts[0]).why, /particle counts/);
});

test('buffers: Henderson-Hasselbalch, ln vs log, inverted ratio, pKb, added acid', () => {
  const ac = ctx('buffer-drills', 'acetic-acid'), nh3 = ctx('buffer-drills', 'ammonia');
  const p = M.buffer.generate(M.rng(5), ac, 'ph'), v = p.values, pH = p.steps.find(s => s.key === 'pH').cell;
  near(v.pH, 4.7447 + Math.log10(v.cA / v.cH), 1e-4);
  assert.match(M.diagnose(pH, v.pKa + Math.log(v.cA / v.cH)).why, /not ln/);
  assert.match(M.diagnose(pH, v.pKa - Math.log10(v.cA / v.cH)).why, /upside down/);
  const b = M.buffer.generate(M.rng(5), nh3, 'ph');
  near(b.values.pKa, 14 + Math.log10(1.8e-5), 1e-12);
  assert.match(M.diagnose(b.steps.find(s => s.key === 'pKa').cell, -Math.log10(1.8e-5)).why, /pK<sub>b<\/sub>/);
  for (let s = 1; s <= 40; s++) {
    const a = M.buffer.generate(M.rng(s), ac, 'add'), w = a.values;
    const A = w.cA * w.L + (w.acidAdded ? -w.added : w.added), H = w.cH * w.L + (w.acidAdded ? w.added : -w.added);
    near(w.pH, w.pKa + Math.log10(A / H), 1e-9);
    assert.ok(w.acidAdded ? w.pH < w.pH0 : w.pH > w.pH0, 'added acid lowers pH, base raises it');
    const r = M.buffer.generate(M.rng(s), ac, 'ratio');
    near(r.values.ratio, 10 ** (r.values.target - r.values.pKa), 1e-9);
  }
});

test('titration curves follow the equilibrium math', () => {
  const T = M.titration;
  // 25.00 mL of 0.100 M acetic acid with 0.100 M NaOH: textbook values.
  const s = { kind: 'wa', Ca: 0.1, Va: 25, Ct: 0.1, Ka: [1.8e-5] };
  assert.ok(Math.abs(T.pH(s, 0) - 2.87) < 0.01, `initial ${T.pH(s, 0)}`);
  assert.ok(Math.abs(T.pH(s, 12.5) - 4.74) < 0.01, 'half-equivalence pH = pKa');
  assert.ok(Math.abs(T.pH(s, 25) - 8.72) < 0.01, `equivalence ${T.pH(s, 25)}`);
  assert.ok(Math.abs(T.pH(s, 30) - (14 + Math.log10(0.1 * 5 / 55))) < 0.01, 'excess OH⁻');
  const sa = { kind: 'sa', Ca: 0.1, Va: 25, Ct: 0.1 };
  assert.ok(Math.abs(T.pH(sa, 25) - 7) < 1e-6 && Math.abs(T.pH(sa, 0) - 1) < 1e-6);
  const wb = { kind: 'wb', Ca: 0.1, Va: 25, Ct: 0.1, Kb: 1.8e-5 };
  assert.ok(Math.abs(T.pH(wb, 12.5) - 9.26) < 0.01 && T.pH(wb, 25) < 6);
  const di = { kind: 'di', Ca: 0.1, Va: 25, Ct: 0.1, Ka: [1e-3, 1e-8] };
  assert.ok(Math.abs(T.pH(di, 37.5) - 8) < 0.02, 'second half-equivalence = pKa2');
  for (const c of data('titration-curve-reader').contexts) for (let k = 1; k <= 10; k++) {
    const p = T.generate(M.rng(k), c);
    near(p.eqs[0], p.sys.Ca * p.sys.Va / p.sys.Ct, 1e-12);
    const ind = T.INDICATORS[p.indicator];
    assert.ok(ind.lo <= p.phEq && p.phEq <= ind.hi);
  }
});

test('particle pictures: hydration orientation, conservation, Q = K, acid strength', () => {
  const pd = data('particle-diagrams');
  for (let s = 1; s <= 30; s++) {
    const h = M.particles.generate(M.rng(s), pd.contexts[0]);
    assert.match(h.options[h.correct].svg, h.extra.cation ? /oxygen end pointing toward the ion/ : /hydrogen ends pointing toward the ion/);
    const e = M.particles.generate(M.rng(s), pd.contexts[2]);
    near(e.extra.eq.AB ** 2 / (e.extra.eq.A2 * e.extra.eq.B2), e.extra.K);
    const l = M.particles.generate(M.rng(s), pd.contexts[1]);
    assert.equal(Object.values(l.extra.after).filter(v => v === 0).length >= 1, true);
  }
  assert.ok(M.weakAcid(0.1, 1.8e-5).percent < 2, 'acetic acid is about 1.3% ionized at 0.10 M');
});

test('units and significant figures: the grader marks the key right and each slip wrong', () => {
  const Q = (() => { const c = { document: { querySelector: () => null } }; c.window = c; return c; })();
  const src = readFileSync(join(ROOT, 'chem', 'assets', 'chem-questions.js'), 'utf8');
  new Function('window', 'document', src)(Q, Q.document);
  const G = Q.ApChemQuestions;
  const gas = M.units.generate(M.rng(3), ctx('units-sig-figs', 'gas-pressure')).item, N = gas.numeric;
  const key = G.formatKey({ answer: N.answer, sigfigs: N.sigfigs }).replace(' × 10^', 'e');
  assert.equal(G.grade(gas, { value: key, unit: 'atm' }).correct, true);
  const celsius = N.mistakes.find(m => /kelvin/.test(m.why));
  assert.ok(celsius, 'a °C slip is anticipated');
  assert.match(G.grade(gas, { value: String(celsius.value), unit: 'atm' }).notes[0], /kelvin/);
  const cal = M.units.generate(M.rng(4), ctx('units-sig-figs', 'dissolving-heat')).item;
  const inJ = cal.numeric.mistakes.find(m => /J\/mol/.test(m.why));
  assert.match(G.grade(cal, { value: String(inJ.value), unit: 'kJ/mol' }).notes[0], /J\/mol|1000/);
  const add = M.units.generate(M.rng(5), ctx('units-sig-figs', 'mass-by-difference')).item;
  assert.ok(/decimal places/.test(add.why.correct));
});

test('every tool data file passes its validator', async () => {
  for (const slug of SLUGS) {
    const { check } = await import(`../lib/apchem-tool-checks/${slug}.mjs`);
    assert.deepEqual(check(data(slug), map), [], slug);
  }
});

test('validators catch planted mistakes', async () => {
  const v = async s => (await import(`../lib/apchem-tool-checks/${s}.mjs`)).check;
  const ice = data('ice-table-drills'); ice.contexts[1].species[1].nu = 3;   // N₂O₄ ⇌ 3 NO₂ but Kfail promises a quadratic
  assert.ok((await v('ice-table-drills'))(ice, map).some(e => /quadratic/.test(e)));
  const ice2 = data('ice-table-drills'); ice2.contexts.forEach(c => delete c.Kfail);
  assert.ok((await v('ice-table-drills'))(ice2, map).some(e => /failed 5% check/.test(e)));
  const qk = data('q-vs-k'); qk.contexts[0].topic = 'no-such-topic';
  assert.ok((await v('q-vs-k'))(qk, map).some(e => /unknown topic/.test(e)));
  const tc = data('titration-curve-reader'); tc.contexts = tc.contexts.filter(c => c.kind !== 'di');
  assert.ok((await v('titration-curve-reader'))(tc, map).some(e => /no di curve/.test(e)));
  const pd = data('particle-diagrams'); pd.contexts[3].acids.push({ name: 'chlorous acid', formula: 'HClO₂', anion: 'ClO₂⁻', Ka: 1.1e-2, c: 0.05 });
  pd.contexts[3].acids = pd.contexts[3].acids.filter(a => a.formula === 'HClO₂');
  assert.ok((await v('particle-diagrams'))(pd, map).some(e => /mostly un-ionized/.test(e)), 'a weak acid that is far from "mostly un-ionized" is caught');
  const bf = data('buffer-drills'); bf.contexts[0].base = bf.contexts[4].base;
  assert.ok((await v('buffer-drills'))(bf, map).some(e => /not both/.test(e)));
  const us = data('units-sig-figs'); us.contexts.push({ id: 'ap-note', topic: 'math-sig-figs', kind: 'muldiv', note: 'AP Chemistry' });
  assert.ok((await v('units-sig-figs'))(us, map).some(e => /AP/.test(e)), 'trademark wording is checked');
});

test('tool content is served only for published units', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'apchem-tools-')), 'chem');
  execFileSync(process.execPath, ['scripts/build-apchem.mjs', '--out', out], { env: { ...process.env, APCHEM_PUBLISHED: 'unit-1,unit-2,unit-3,skills-math' } });
  const tool = s => JSON.parse(readFileSync(join(out, 'assets', 'tool-data', `${s}.json`), 'utf8'));
  assert.deepEqual(Object.keys(tool('ice-table-drills')).sort(), ['arrives', 'live', 'slug'], 'Unit 7 drill waits for Unit 7');
  assert.equal(tool('ice-table-drills').arrives, 'Unit 7');
  const pd = tool('particle-diagrams');
  assert.equal(pd.live, true);
  assert.deepEqual(pd.contexts.map(c => c.id), ['ions-in-water'], 'only the Unit 3 pictures are served');
  assert.deepEqual(tool('units-sig-figs').contexts.map(c => c.id).sort(), ['density', 'gas-constant', 'gas-pressure', 'mass-by-difference']);
  const page = readFileSync(join(out, 'tools', 'q-vs-k.html'), 'utf8');
  assert.match(page, /data-premium="tools"/);
  assert.match(page, /noindex/);
  assert.doesNotMatch(readFileSync(join(out, 'tools', 'particle-diagrams.html'), 'utf8'), /data-premium/);
});
