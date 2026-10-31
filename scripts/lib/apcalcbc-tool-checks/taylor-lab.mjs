/* Validator for calculus-bc/data/tools/taylor-lab.json (Taylor lab), run by
   scripts/check-apcalcbc-content.mjs. OWNED BY THIS TOOL ONLY (builder T1).
   check(data, map) -> problems. It regenerates 300 problems per context with the model the
   page runs (ApCalcMath.taylorLab) and recomputes every key a second way, from the givens
   (problem.chk), never through the model:
     - coefficients and P_3 from the table of derivatives by k!, the keyed polynomial evaluated
       at points against that sum; read-back derivatives as k! times the given coefficients;
     - a Maclaurin polynomial checked against the function itself (Math.exp, Math.sin, ...):
       f(x) - P_n(x) must shrink like x^(n+1) (a wrong coefficient of x^j, j <= n, would leave
       x^j), its coefficients recovered by interpolation, and f^(m)(0) = m! times the coefficient;
     - the Lagrange maximum by sampling this file's own derivative formulas, the bound from it,
       and the true error |f(x) - P_n(x)| no more than the bound;
     - the alternating bound as the first term left out (this file's own terms), the true error
       no more than it, and the least number of terms by search;
     - every coded option of every choice step judged true or false here: exactly the keyed one is true. */
import { frame, sweep, close } from '../apcalc-tool-checks/_drills.mjs';
import { runtime } from './_shared.mjs';

const KINDS = ['coef', 'maclaurin', 'lagrange', 'altbound'];
const fact = n => { let p = 1; for (let k = 2; k <= n; k++) p *= k; return p; };
/* f and its kth derivative, written here */
const FN = {
  exp: { f: Math.exp, d: (k, t) => Math.exp(t) },
  sin: { f: Math.sin, d: (k, t) => [Math.sin(t), Math.cos(t), -Math.sin(t), -Math.cos(t)][k % 4] },
  cos: { f: Math.cos, d: (k, t) => [Math.cos(t), -Math.sin(t), -Math.cos(t), Math.sin(t)][k % 4] },
  ln: { f: x => Math.log(1 + x), d: (k, t) => k === 0 ? Math.log(1 + t) : (-1) ** (k - 1) * fact(k - 1) * (1 + t) ** -k },
  expneg: { f: x => Math.exp(-x), d: (k, t) => (-1) ** k * Math.exp(-t) }
};
/* Coefficients of a polynomial of degree <= n from its values (Newton / Vandermonde solve). */
function coeffsOf(P, n) {
  const xs = Array.from({ length: n + 1 }, (_, i) => (i - n / 2) * 0.5), A = xs.map(x => Array.from({ length: n + 1 }, (_, j) => x ** j)), b = xs.map(P);
  for (let i = 0; i <= n; i++) {
    let p = i; for (let r = i + 1; r <= n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
    for (let r = 0; r <= n; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c]; b[r] -= f * b[i]; }
  }
  return b.map((v, i) => v / A[i][i]);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'taylor-lab', 'simulator', map, errs);
  const { M, model } = runtime('taylor-lab');
  if (!model) { errs.push('no model registered (ApCalcMath.taylorLab)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub (calculus-bc/assets/tools/math/taylor-lab.js)'); return errs; }
  for (const c of data.contexts || []) {
    if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind "${c.kind}" is not one of ${KINDS.join(', ')}`);
    if (c.kind === 'maclaurin' && !(c.fams || []).every(f => f === 'known' || f === 'built')) errs.push(`context ${c.id}: fams must be "known" or "built"`);
    if (c.kind === 'altbound' && !(c.fams || []).every(f => f === 'series' || f === 'taylor')) errs.push(`context ${c.id}: fams must be "series" or "taylor"`);
  }
  if (errs.length) return errs;
  const recheck = (p, ctx, w) => {
    const bad = m => errs.push(`${w}: ${m}`);
    const step = k => p.steps.find(s => s.key === k);
    const keyed = k => { const s = step(k); return s && p.codes && p.codes[k] ? p.codes[k][s.correct] : undefined; };
    const num = (k, want, rel = 1e-9, abs = 1e-9) => { const s = step(k); if (!s) return bad(`no step ${k}`); if (!close(s.cell.answer, want, rel, abs)) bad(`step ${k} keyed ${s.cell.answer}, recomputed ${want}`); };
    if (p.type !== ctx.kind) bad(`asked for ${ctx.kind}, got ${p.type}`);
    for (const s of p.steps) if (s.kind === 'choice' && !(p.codes && Array.isArray(p.codes[s.key]) && p.codes[s.key].length === s.options.length)) bad(`step ${s.key} has no option codes`);
    const C = p.chk;
    if (p.type === 'coef' && C.v === 'fwd') {
      const { c, d, h } = C, T = x => d.reduce((s, dk, k) => s + dk / fact(k) * (x - c) ** k, 0);
      num('c2', d[2] / 2); num('c3', d[3] / 6);
      const K = M.fn(step('P3').cell.expr.answer, ['x']);
      for (const x of [c - 0.8, c - 0.3, c + 0.45, c + 0.9]) if (!close(K(x), T(x), 1e-9, 1e-9)) bad(`P3 key at x = ${x} is ${K(x)}, the table gives ${T(x)}`);
      num('approx', T(c + h));
    }
    if (p.type === 'coef' && C.v === 'rev') {
      const { a } = C;
      num('d2', 2 * a[2]); num('d3', 6 * a[3]);
      if (a[1] !== 0) bad('the read-back polynomial needs no linear term');
      if (keyed('ext') !== (a[2] > 0 ? 'min' : 'max')) bad(`local behavior keyed ${keyed('ext')} for f''(c) = ${2 * a[2]}`);
    }
    if (p.type === 'maclaurin') {
      const f = M.fn(C.f, ['x']), n = C.n, m = C.m, K = M.fn(step('Pn').cell.expr.answer, ['x']);
      if (!close(K(0), f(0), 1e-12, 1e-12)) bad('P_n(0) is not f(0)');
      // f - P_n = O(x^(n+1)): halving x must shrink (f - P)/x^(n+1) or keep it about the same, never double it
      const q = x => (f(x) - K(x)) / x ** (n + 1);
      for (const h of n >= 6 ? [0.3, 0.15] : [0.08, 0.04]) for (const s of [1, -1]) { const a = q(s * h), b = q(2 * s * h); if (Math.abs(a) > 1.6 * Math.abs(b) + 1e-5) bad(`f - P_n is not of order x^${n + 1} near 0 (x = ${s * h}: ${a} vs ${b}): a coefficient is wrong`); }
      const cs = coeffsOf(K, n);
      num('co', cs[m], 1e-6, 1e-7); num('dm', cs[m] * fact(m), 1e-6, 1e-6);
      if (C.code) {
        const HOWF = { 'int-geo': 'ln(1 + x)', 'int-geo2': 'atan(x)', 'diff-geo': '1/(1 - x)^2', 'mul-exp': 'x^2*e^x', 'mul-sin': 'x*sin(x)', 'sub-cos': 'cos(x^2)', 'diff-sin': 'cos(x)' };
        const same = s => { const g = M.fn(s, ['x']); return [-0.3, 0.1, 0.25].every(x => close(g(x), f(x), 1e-12, 1e-12)); };
        p.codes.how.forEach((cd, i) => { const t = same(HOWF[cd]); if (t !== (i === step('how').correct)) bad(`"how" option ${cd} is ${t ? 'right' : 'wrong'} but keyed ${i === step('how').correct ? 'right' : 'wrong'}`); });
      }
    }
    if (p.type === 'lagrange') {
      const { c, n, x1 } = C, F = C.f ? FN[C.f] : null;
      let Mx = C.M;
      if (Mx == null) { Mx = 0; for (let i = 0; i <= 4000; i++) { const t = c + (x1 - c) * i / 4000; Mx = Math.max(Mx, Math.abs(F.d(n + 1, t))); } num('M', Mx, 1e-9); }
      else if (keyed('which') !== 'n1') bad('the Lagrange bound uses f^(n+1)');
      if (F && C.M != null) { let mm = 0; for (let i = 0; i <= 4000; i++) mm = Math.max(mm, Math.abs(F.d(n + 1, c + (x1 - c) * i / 4000))); if (mm > C.M + 1e-12) bad(`the given bound ${C.M} is below max |f^(n+1)| = ${mm}`); }
      const B = Mx * Math.abs(x1 - c) ** (n + 1) / fact(n + 1);
      num('B', B, 1e-9, 0);
      if (F) { let P = 0; for (let k = 0; k <= n; k++) P += F.d(k, c) / fact(k) * (x1 - c) ** k; const err = Math.abs(F.f(x1) - P); if (err > B * (1 + 1e-9)) bad(`true error ${err} exceeds the bound ${B}`); }
      const want = B < C.eps ? 'yes' : 'ng';
      if (keyed('tol') !== want) bad(`tolerance keyed ${keyed('tol')}, bound ${B} vs ${C.eps}`);
    }
    if (p.type === 'altbound' && C.v === 'series') {
      const b = { p2: n => n ** -2, p3: n => n ** -3, f: n => (n > 170 ? 0 : 1 / fact(n)), h2: n => 1 / (n * 2 ** n), lb: n => 1 / (2 * n + 1) }[C.id];
      const n0 = { p2: 1, p3: 1, f: 0, h2: 1, lb: 0 }[C.id], sg = { p2: n => (n % 2 ? 1 : -1), p3: n => (n % 2 ? 1 : -1), f: n => (n % 2 ? -1 : 1), h2: n => (n % 2 ? 1 : -1), lb: n => (n % 2 ? -1 : 1) }[C.id];
      for (let n = n0; n < n0 + 400; n++) if (!(b(n + 1) <= b(n)) || sg(n) === sg(n + 1) || (n > n0 + 3 && !(b(n + 1) < b(n)) && b(n) > 0)) { bad('the series fails the alternating series test'); break; }
      num('B', b(n0 + C.N), 1e-12, 0);
      // the sum by averaging two consecutive partial sums far out (an alternating series' sum lies between them)
      let s = 0, prev = 0; for (let n = n0; n < n0 + 20000; n++) { const t = b(n); prev = s; s += sg(n) * t; if (t < 1e-17) break; }
      const S = (s + prev) / 2; let SN = 0; for (let n = n0; n < n0 + C.N; n++) SN += sg(n) * b(n);
      if (Math.abs(S - SN) > b(n0 + C.N) * (1 + 1e-9)) bad('the error is larger than the bound');
      let N = 1; while (b(n0 + N) >= C.eps) N++;
      num('N', N, 0, 0);
      if (keyed('why') !== 'ok') bad('the conditions are alternating signs with sizes decreasing to 0');
    }
    if (p.type === 'altbound' && C.v === 'taylor') {
      const F = FN[C.f], { n, x1 } = C;
      const terms = []; for (let k = 0; k < n + 30; k++) terms.push(F.d(k, 0) / fact(k) * x1 ** k);
      let next = n + 1; while (Math.abs(terms[next]) < 1e-15) next++;
      const nz = terms.slice(next).filter(t => Math.abs(t) > 1e-15);
      for (let i = 1; i < nz.length; i++) if (Math.sign(nz[i]) === Math.sign(nz[i - 1]) || Math.abs(nz[i]) >= Math.abs(nz[i - 1])) { bad('the series at x does not alternate with decreasing terms'); break; }
      num('B', Math.abs(terms[next]), 1e-9, 0);
      const P = terms.slice(0, n + 1).reduce((a, b) => a + b, 0), err = Math.abs(F.f(x1) - P);
      if (err > Math.abs(terms[next]) * (1 + 1e-9)) bad(`true error ${err} exceeds the bound`);
      if (keyed('which') !== 'alt' || keyed('say') !== 'le') bad('the alternating bound applies, and the error is at most it');
    }
  };
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), recheck);
  return errs;
}
