/* ApStatDist (statistics/assets/stat-dist.js) against reference values
   computed independently with SciPy 1.18 (scipy.stats; stored here, not
   fetched). Every function must agree to 1e-9, absolute or relative, and the
   table route must read Tables A, B and C the way a student does. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Dist as D } from '../lib/apstat-mathlib.mjs';

const REF = {"normCdf": [[-6, 9.865876450376946e-10], [-3.4, 0.00033692926567688086], [-1.96, 0.024997895148220435], [-1.2, 0.11506967022170822], [-0.5, 0.3085375387259869], [0, 0.5], [0.3, 0.6179114221889526], [1, 0.8413447460685429], [1.645, 0.9500150944608786], [2.33, 0.9900969244408357], [3.4, 0.9996630707343231], [5, 0.9999997133484281]], "invNorm": [[1e-06, -4.753424308822899], [0.001, -3.090232306167813], [0.01, -2.3263478740408408], [0.025, -1.9599639845400545], [0.05, -1.6448536269514729], [0.1, -1.2815515655446004], [0.5, 0.0], [0.8, 0.8416212335729143], [0.95, 1.6448536269514722], [0.975, 1.959963984540054], [0.995, 2.5758293035489004], [0.999999, 4.753424308817087]], "tCdf": [[-2.5, 3, 0.04385332350403278], [1.2, 1, 0.7788579383763045], [2.0, 5, 0.9490302605850708], [-0.7, 12, 0.24863707689535378], [2.262, 9, 0.9749935772487727], [3.5, 29, 0.9992377768426727], [1.96, 1000, 0.9748634075221256], [4.0, 2, 0.9714045207910317], [-1.1, 47.3, 0.13844957024534116]], "invT": [[0.975, 1, 12.706204736174694], [0.975, 9, 2.262157162798205], [0.995, 24, 2.796939504774456], [0.9, 4, 1.533206274058944], [0.025, 30, -2.042272456301238], [0.975, 47.3, 2.0114037532826705], [0.9995, 2, 31.599054576445365]], "chi2Cdf": [[0.5, 1, 0.5204998778130466], [3.84, 1, 0.9499564787512949], [5.99, 2, 0.9499633729134137], [7.2, 3, 0.934210947314929], [12.6, 6, 0.9501535068275503], [30, 20, 0.9301463393005901], [2, 4, 0.2642411176571153], [150, 100, 0.9990960679576459]], "invChi2": [[0.95, 1, 3.841458820694124], [0.95, 4, 9.487729036781154], [0.99, 6, 16.811893829770927], [0.5, 10, 9.34181776559197], [0.999, 30, 59.70306430442994]], "binomCdf": [[3, 10, 0.3, 0.6496107184000002], [0, 5, 0.2, 0.32768], [12, 20, 0.5, 0.8684120178222656], [45, 100, 0.5, 0.18410080866334808], [150, 400, 0.4, 0.16617628355920067], [7, 7, 0.9, 1.0]], "binomPmf": [[3, 10, 0.3, 0.2668279319999998], [4, 10, 0.3, 0.20012094899999988], [50, 100, 0.5, 0.07958923738717875], [170, 400, 0.4, 0.02403453064171344]], "lsrl": {"xs": [12, 15, 9, 22, 18, 30, 14, 11, 16, 20], "ys": [30, 35, 25, 50, 41, 62, 33, 27, 39, 44], "a": 8.09967845659164, "b": 1.8263665594855307, "r": 0.9959557591086405, "s": 1.0773911565351113}, "t2": {"args": [24.3, 5.1, 18, 21.0, 6.4, 25], "t": 1.8793125148077163, "two": 0.06740829027927189, "df": 40.513187450594394}, "chi2table": {"obs": [[30, 20, 10], [25, 35, 30]], "chi2": 8.901515151515152, "p": 0.011669722921616903, "df": 2}};
const close = (got, want, what) => {
  const e = got === want ? 0 : Math.min(Math.abs(got - want), Math.abs(got - want) / Math.abs(want));
  assert.ok(e <= 1e-9, `${what}: ${got} vs ${want}`);
};

test('normal, t and chi-square CDFs and inverses match the reference', () => {
  for (const [z, v] of REF.normCdf) close(D.normCdf(z), v, `normCdf(${z})`);
  for (const [p, v] of REF.invNorm) close(D.invNorm(p), v, `invNorm(${p})`);
  for (const [t, df, v] of REF.tCdf) close(D.tCdf(t, df), v, `tCdf(${t}, ${df})`);
  for (const [p, df, v] of REF.invT) close(D.invT(p, df), v, `invT(${p}, ${df})`);
  for (const [x, df, v] of REF.chi2Cdf) close(D.chi2Cdf(x, df), v, `chi2Cdf(${x}, ${df})`);
  for (const [p, df, v] of REF.invChi2) close(D.invChi2(p, df), v, `invChi2(${p}, ${df})`);
  close(D.normCdf(110, 100, 15), D.normCdf(10 / 15), 'normCdf with mean and SD');
});

test('binomial probabilities match the reference', () => {
  for (const [k, n, p, v] of REF.binomPmf) close(D.binomPmf(k, n, p), v, `binomPmf(${k}, ${n}, ${p})`);
  for (const [k, n, p, v] of REF.binomCdf) close(D.binomCdf(k, n, p), v, `binomCdf(${k}, ${n}, ${p})`);
  assert.equal(D.binomPmf(11, 10, 0.3), 0);
});

test('regression, two-sample t (Welch) and chi-square tables match the reference', () => {
  const L = D.lsrl(REF.lsrl.xs, REF.lsrl.ys);
  for (const k of ['a', 'b', 'r', 's']) close(L[k], REF.lsrl[k], `lsrl.${k}`);
  close(L.r2, REF.lsrl.r ** 2, 'lsrl.r2');
  const T = D.t2(...REF.t2.args);
  close(T.t, REF.t2.t, 't2.t'); close(T.p.two, REF.t2.two, 't2.p'); close(T.df, REF.t2.df, 't2.df');
  assert.equal(T.dfCons, 17);
  const C = D.chi2table(REF.chi2table.obs);
  close(C.chi2, REF.chi2table.chi2, 'chi2'); close(C.p, REF.chi2table.p, 'chi2 p'); assert.equal(C.df, REF.chi2table.df);
});

test('one-sample procedures follow the reference sheet formulas', () => {
  const z = D.z1prop(0.47, 0.5, 400);
  close(z.z, -1.2, 'z'); close(z.se, 0.025, 'se uses p0');
  close(z.p.less, D.normCdf(-1.2), 'lower tail'); close(z.p.two, 2 * D.normCdf(-1.2), 'two-sided');
  const ci = D.ci1prop(0.42, 200, 0.95);
  close(ci.se, Math.sqrt(0.42 * 0.58 / 200), 'CI se uses p-hat');
  close(ci.hi - ci.lo, 2 * D.invNorm(0.975) * ci.se, 'width');
  const t = D.t1(5.4, 5, 1.2, 16);
  close(t.t, 0.4 / 0.3, 't'); assert.equal(t.df, 15);
  const z2 = D.z2prop(60, 200, 45, 200);
  close(z2.pc, 105 / 400, 'pooled proportion');
});

test('summaries use the AP quartile convention and the 1.5 IQR fences', () => {
  const s = D.summary([1, 2, 3, 4, 5, 6, 7, 100]);
  assert.deepEqual([s.q1, s.med, s.q3, s.iqr], [2.5, 4.5, 6.5, 4]);
  assert.deepEqual([...s.outliers], [100]);
  const odd = D.summary([1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual([odd.q1, odd.med, odd.q3], [2, 4, 6], 'the median is left out of both halves');
});

test('the table route reads Tables A, B and C as a student would', () => {
  close(D.tableRoute('normal', -1.234), D.normCdf(-1.23), 'Table A rounds z to two places');
  assert.equal(D.tableRoute('tdf', 47.3), 40);
  assert.equal(D.tableRoute('tdf', 29), 29);
  assert.equal(D.tableRoute('tdf', 999), 100);
  close(D.tableRoute('tcrit', 0.95, 9), D.invT(0.975, 9), 't* from the df row');
  assert.deepEqual([...D.tableRoute('tbracket', 2.1, 9)], [0.025, 0.05]);
  assert.deepEqual([...D.tableRoute('chi2bracket', 7.2, 3)], [0.05, 0.1]);
});
