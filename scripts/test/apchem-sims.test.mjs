/* AP® Chemistry: the periodic trends and PES explorer and the equilibrium
   and kinetics simulator (chem/assets/tools/chem-tool-math.js,
   ApChemMath.trends and ApChemMath.eqk). Each model is checked against an
   independent calculation, against textbook facts, and the validators are
   shown to catch planted mistakes in the data. */
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
const close = (a, b, rel, msg) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${msg || ''} ${a} vs ${b}`);
const PT = data('periodic-trends-pes'), EK = data('equilibrium-kinetics');
const el = s => PT.elements.find(e => e.s === s);

test('trends: configurations, core electrons and the rough effective nuclear charge', () => {
  const T = M.trends;
  assert.equal(JSON.stringify(T.parseConf('[Ne] 3s2 3p')), JSON.stringify([['1s', 2], ['2s', 2], ['2p', 6], ['3s', 2], ['3p', 1]]));
  assert.equal(T.confHtml('[Ar] 3d10 4s2 4p5'), '[Ar] 3d¹⁰ 4s² 4p⁵');
  for (const e of PT.elements) assert.equal(T.electrons(e), e.z, e.s);
  assert.equal(T.coreCount(el('Na')), 10); assert.equal(T.zeffRough(el('Cl')), 7);
  assert.equal(T.coreCount(el('Ga')), 28);   // the 3d electrons are core for gallium
  assert.equal(T.outerShell(el('Fe')), 4);
});

test('trends: the data agree with the textbook trends and the famous exceptions', () => {
  // Period 3 values the course's notes use (decision: one source of truth).
  assert.deepEqual(['Na', 'Mg', 'Al', 'P', 'S', 'Cl'].map(s => el(s).r), [186, 160, 143, 111, 103, 99]);
  assert.deepEqual(['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl'].map(s => el(s).ie), [496, 738, 578, 787, 1012, 1000, 1251]);
  assert.ok(el('Be').ie > el('B').ie && el('N').ie > el('O').ie && el('Mg').ie > el('Al').ie && el('P').ie > el('S').ie, 'the four dips');
  assert.ok(el('Cl').ea > el('F').ea, 'chlorine releases more than fluorine');
  assert.equal(el('N').ea, undefined, 'nitrogen: no stable anion');
  assert.ok(el('Ga').r < el('Al').r, 'gallium is slightly smaller than aluminum');
  assert.equal(el('F').en, 3.98);
  // PES: every lowest peak is the first ionization energy; Ne as the notes.
  assert.deepEqual(el('Ne').pes, [['1s', 84, 2], ['2s', 4.68, 2], ['2p', 2.08, 6]]);
  assert.deepEqual(el('Na').pes.map(p => p[1]), [104, 6.84, 3.67, 0.496]);
  for (const e of PT.elements.filter(x => x.pes)) close(Math.min(...e.pes.map(p => p[1])), e.ie / 1000, 0.006, e.s);
  // 4s is below 3d in binding energy for Sc to Zn (4s electrons leave first).
  for (const s of ['Sc', 'Ti', 'Fe', 'Zn']) { const p = Object.fromEntries(el(s).pes.map(x => [x[0], x[1]])); assert.ok(p['3d'] > p['4s'], s); }
});

test('trends: the rule, the reasoning and the generated problems', () => {
  const T = M.trends;
  assert.equal(T.ruleSays(el('Na'), el('Cl'), 'r'), el('Na'));
  assert.equal(T.ruleSays(el('Na'), el('K'), 'ie'), el('Na'));
  assert.equal(T.ruleSays(el('Na'), el('S'), 'en'), el('S'));
  assert.equal(T.ruleSays(el('Na'), el('Br'), 'r'), null, 'not one period or group');
  const w = T.why(el('K'), el('Na'), 'ie');
  for (const s of ['K', 'Na', 'shell 3', 'shell 4', '10', '18']) assert.ok(w.includes(s), s);
  // No pair in a period whose cores differ (Ca and Ga): the reasoning says "the same core".
  for (const k of ['r', 'ie', 'en']) for (const [a, b] of T.pairPool(PT.elements, k)) if (a.p === b.p) assert.equal(T.coreCount(a), T.coreCount(b), `${a.s}/${b.s}`);
  for (const c of PT.contexts) {
    const a = JSON.stringify(T.generate(M.rng(99), c, PT.elements, PT.ions)), b = JSON.stringify(T.generate(M.rng(99), c, PT.elements, PT.ions));
    assert.equal(a, b, `${c.id}: same seed, same problem`);
    const seen = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(s => JSON.stringify(T.generate(M.rng(s * 31), c, PT.elements, PT.ions))));
    assert.ok(seen.size >= 3, `${c.id}: seeds vary`);
  }
});

test('trends: the spectrum drawing has one peak per subshell and hides subshells in a quiz', () => {
  const svg = M.trends.pesSvg(el('Cl'));
  assert.equal((svg.match(/class="pes-pk /g) || []).length, 5);
  for (const s of ['1s', '2s', '2p', '3s', '3p']) assert.match(svg, new RegExp(`>${s}<`));
  const q = M.trends.pesSvg(el('Cl'), { noSub: true, label: 'unknown' });
  assert.doesNotMatch(q, />[123][sp]</); assert.doesNotMatch(q, /data-sub/); assert.doesNotMatch(q, /Chlorine/);
});

test('equilibrium: K from real data, van \'t Hoff and Kc = Kp/(RT)^Δn', () => {
  const E = M.eqk, n2o4 = EK.reactions.find(r => r.id === 'n2o4'), hi = EK.reactions.find(r => r.id === 'hi');
  close(E.Kp(n2o4, 298.15), Math.exp(-4730 / (8.314 * 298.15)) / 1.01325, 0.005, 'N2O4 Kp from ΔG°');
  close(E.Kc(n2o4, 298.15), E.Kp(n2o4, 298.15) / (0.08206 * 298.15), 1e-12);
  assert.ok(E.Kc(n2o4, 350) > E.Kc(n2o4, 300), 'endothermic: K rises with T');
  assert.ok(E.Kc(hi, 750) < E.Kc(hi, 650), 'exothermic: K falls with T');
  close(E.Kc(hi, 703.15), 54.3, 1e-9, 'HI: Δn = 0');
});

test('equilibrium: rates balance exactly at Q = K, and a catalyst changes the time, not the position', () => {
  const E = M.eqk;
  for (const rx of EK.reactions) {
    const T = rx.T[2], c = E.equilibrium(rx, rx.start, T), r = E.rates(rx, c, T, false);
    close(r.f, r.r, 1e-6, `${rx.id} rates`);
    const run = cat => { let x = rx.start.slice(), t = 0; while (Math.abs(Math.log(E.Q(rx, x) / E.Kc(rx, T))) > 0.01 && t < 500) { x = E.step(rx, x, T, cat, 0.01).c; t += 0.01; } return { x, t }; };
    const a = run(false), b = run(true);
    assert.ok(b.t < a.t, `${rx.id}: catalyst is faster`);
    a.x.forEach((v, i) => close(v, b.x[i], 0.02, `${rx.id}: same equilibrium`));
    close(E.rates(rx, c, T, true).f / r.f, Math.exp(rx.catDrop * 1000 / (8.314 * T)), 1e-9, 'catalyst factor');
  }
});

test('equilibrium: Maxwell-Boltzmann is normalized and its tail grows with T', () => {
  const E = M.eqk;
  let area = 0; for (let e = 0.005; e < 300; e += 0.01) area += E.mb(e, 330) * 0.01;
  close(area, 1, 1e-3, 'area');
  assert.ok(E.mbAbove(57.2, 360) / E.mbAbove(57.2, 330) > 4, 'a 30 K rise multiplies the fraction above Ea several times');
  close(E.erfc(0.5), 0.4795001, 1e-6, 'erfc');
});

test('equilibrium: every stress gives the Le Chatelier shift by Q against K', () => {
  const E = M.eqk, n2o4 = EK.reactions.find(r => r.id === 'n2o4'), hi = EK.reactions.find(r => r.id === 'hi');
  const c = E.equilibrium(n2o4, n2o4.start, 330), d = s => E.apply(n2o4, s, c, 330, 1).dir;
  assert.deepEqual(['heat', 'cool', 'addR', 'addP', 'removeP', 'compress', 'expand', 'catalyst'].map(d), ['f', 'r', 'f', 'r', 'f', 'r', 'f', 'none']);
  const h = E.equilibrium(hi, hi.start, 700), dh = s => E.apply(hi, s, h, 700, 1).dir;
  assert.deepEqual(['heat', 'cool', 'compress', 'expand'].map(dh), ['r', 'f', 'none', 'none']);
});

test('the validators pass the shipped data and catch planted mistakes', async () => {
  const v = async s => (await import(`../lib/apchem-tool-checks/${s}.mjs`)).check;
  assert.deepEqual([...(await v('periodic-trends-pes'))(PT, map)], []);
  assert.deepEqual([...(await v('equilibrium-kinetics'))(EK, map)], []);
  const p1 = data('periodic-trends-pes'); p1.elements[10].pes[3][2] = 2;      // Na with 3s²
  assert.ok((await v('periodic-trends-pes'))(p1, map).some(e => /height|Na/.test(e)));
  const p2 = data('periodic-trends-pes'); p2.elements[12].pes[3][1] = 0.4;    // Al 3s below 3p
  assert.ok((await v('periodic-trends-pes'))(p2, map).some(e => /3s .* must be above 3p/.test(e)));
  const p3 = data('periodic-trends-pes'); p3.elements[16].r = 120;             // Cl larger than S
  assert.ok((await v('periodic-trends-pes'))(p3, map).some(e => /radius must fall/.test(e)));
  const e1 = data('equilibrium-kinetics'); e1.reactions[0].dH = -57.2;         // N2O4 made exothermic
  assert.ok((await v('equilibrium-kinetics'))(e1, map).some(e => /endothermic/.test(e)));
  const e2 = data('equilibrium-kinetics'); e2.reactions[1].Kp = 5.43;
  assert.ok((await v('equilibrium-kinetics'))(e2, map).some(e => /54.3/.test(e)));
});

test('free and Premium as the course rule, and the lessons link the tools', () => {
  const pages = JSON.parse(readFileSync(join(ROOT, 'chem', 'data', 'pages.json'), 'utf8')).tools;
  const t = s => pages.find(x => x.slug === s);
  assert.equal(t('periodic-trends-pes').premium, undefined, 'the first Unit 1 tool is free');
  assert.equal(t('equilibrium-kinetics').premium, 'tools', 'Unit 7 already has a free tool');
  const out = join(mkdtempSync(join(tmpdir(), 'apchem-sims-')), 'chem');
  execFileSync(process.execPath, ['scripts/build-apchem.mjs', '--out', out], { env: { ...process.env, APCHEM_PUBLISHED: 'unit-1,unit-2,skills-math' } });
  const page = s => readFileSync(join(out, ...s.split('/')), 'utf8');
  assert.match(page('lessons/periodic-trends.html'), /href="\.\.\/tools\/periodic-trends-pes\.html">Tool: Periodic trends and PES</);
  assert.doesNotMatch(page('tools/periodic-trends-pes.html'), /data-premium/);
  const ek = JSON.parse(page('assets/tool-data/equilibrium-kinetics.json'));
  assert.equal(ek.live, false, 'waits for Unit 7'); assert.equal(ek.arrives, 'Unit 7');
});
