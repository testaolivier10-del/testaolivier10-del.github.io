/* Validator for calculus-bc/data/tools/series-lab.json (Series lab), run by
   scripts/check-apcalcbc-content.mjs. OWNED BY THIS TOOL ONLY (builder T1).
   check(data, map) -> problems. It regenerates 300 problems per context with the model the
   page runs (ApCalcMath.seriesLab) and recomputes every key a second way, from the givens
   (problem.chk) with this file's own code, never through the model:
     - terms a_n written again here (logs for factorials), limits taken at n = 10^6 or more,
       ratio limits from consecutive terms, the integral by adaptive Simpson after u = ln x;
     - which tests settle a series decided here (signs, positivity, monotone f, the limit
       of the terms, of the ratio, of n^p a_n), so the keyed test settles it and no
       distractor does; every coded option of every choice step is judged true or false
       here, and exactly the keyed one must be true;
     - intervals: the radius, both endpoints' series and their verdicts, the key graded right
       and every authored slip graded wrong by ApCalcBCInterval (calculus-bc/assets/cbc-interval.js). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { frame, sweep, close } from '../apcalc-tool-checks/_drills.mjs';
import { runtime } from './_shared.mjs';
import { ROOT } from '../apcalc-build.mjs';

const KINDS = ['partial', 'sum', 'test', 'absolute', 'interval'];
const FAMS = ['nth', 'integral', 'direct', 'limit', 'alt', 'ratio'];

let IV = null;
export function intervalGrader() {
  if (IV) return IV;
  const { Questions } = runtime('series-lab');
  const ctx = { Math, Number, String, Array, Object, RegExp, isFinite, isNaN, Infinity, NaN };
  ctx.window = ctx; ctx.ApCalcQuestions = Questions;
  vm.createContext(ctx);
  const f = join(ROOT, 'calculus-bc', 'assets', 'cbc-interval.js');
  vm.runInContext(readFileSync(f, 'utf8'), ctx, { filename: 'calculus-bc/assets/cbc-interval.js' });
  IV = ctx.ApCalcBCInterval;
  return IV;
}

/* ln Γ(x) by the Stirling series after shifting x up (accurate to ~1e-13). */
function lgamma(x) {
  let s = 0;
  while (x < 12) { s -= Math.log(x); x += 1; }
  const x2 = 1 / (x * x);
  return s + (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + (1 / x) * (1 / 12 - x2 * (1 / 360 - x2 * (1 / 1260 - x2 / 1680)));
}
const lfact = n => lgamma(n + 1);

/* The terms, written again: { sign(n), log|a_n|(n), f(x) on the reals or null } */
function termOf(fam, P) {
  const one = () => 1, altp = n => (n % 2 ? 1 : -1), altm = n => (n % 2 ? -1 : 1);
  switch (fam) {
    case 'nth': return P.v ? { s: one, la: n => Math.log(n * n / (P.c * n * n + P.d)), f: x => x * x / (P.c * x * x + P.d) }
      : { s: one, la: n => Math.log((P.a * n + P.b) / (P.c * n + P.d)), f: x => (P.a * x + P.b) / (P.c * x + P.d) };
    case 'integral': return { s: one, la: n => -Math.log(n) - P.q * Math.log(Math.log(n)), f: x => 1 / (x * Math.pow(Math.log(x), P.q)) };
    case 'direct': {
      const tr = P.trig === 'sin' ? Math.sin : Math.cos;
      if (P.v === 2) return { s: one, la: n => 2 * Math.log(Math.abs(tr(n))) - n * Math.log(P.p), f: x => tr(x) ** 2 / P.p ** x };
      return { s: one, la: n => Math.log(P.k + tr(n)) - P.p * Math.log(n), f: x => (P.k + tr(x)) / x ** P.p };
    }
    case 'limit': return [
      { s: one, la: n => Math.log(P.a * n + P.b) - Math.log(P.c * n ** 3 + P.d), f: x => (P.a * x + P.b) / (P.c * x ** 3 + P.d) },
      { s: one, la: n => Math.log(P.a * n * n + P.b) - Math.log(P.c * n ** 3 + P.d), f: x => (P.a * x * x + P.b) / (P.c * x ** 3 + P.d) },
      { s: one, la: n => -0.5 * Math.log(P.c * n * n + P.d), f: x => 1 / Math.sqrt(P.c * x * x + P.d) },
      { s: one, la: n => Math.log(P.a * n) - 0.5 * Math.log(P.c * n ** 5 + P.d), f: x => P.a * x / Math.sqrt(P.c * x ** 5 + P.d) }][P.v];
    case 'alt': return [
      { s: altp, la: n => -P.p * Math.log(n), f: null },
      { s: altm, la: n => -Math.log(Math.log(n)), f: null },
      { s: altp, la: n => Math.log(n / (n * n + P.k)), f: null },
      { s: altm, la: n => -Math.log(P.a * n + P.b), f: null }][P.v];
    case 'ratio': return [
      { s: one, la: n => n * Math.log(P.c) - lfact(n), f: null },
      { s: one, la: n => P.k * Math.log(n) - n * Math.log(P.c), f: x => x ** P.k / P.c ** x },
      { s: one, la: n => 2 * lfact(n) - lfact(2 * n), f: null },
      { s: one, la: n => lfact(n) - n * Math.log(n), f: null },
      { s: one, la: n => n * Math.log(P.c / P.d) - 2 * Math.log(n), f: x => (P.c / P.d) ** x / (x * x) }][P.v];
  }
  return null;
}
/* What each test says about a series, decided here. */
function judge(fam, P, n0) {
  const T = termOf(fam, P), a = n => T.s(n) * Math.exp(T.la(n)), N = 1e6;
  let pos = true, alts = true;
  for (let n = n0; n < n0 + 400; n++) { const v = a(n); if (!(v > 0)) pos = false; if (n > n0 && Math.sign(v) === Math.sign(a(n - 1))) alts = false; }
  // the terms approach 0: small at n = 10^6 and still falling, or falling by a quarter from 10^6 to 10^12 (1/ln n)
  const limAbs = Math.exp(T.la(N)), lim0 = (limAbs < 1e-3 && T.la(2 * N) < T.la(N) + 0.01) || T.la(1e12) - T.la(N) < Math.log(0.75);
  const r1 = Math.exp(T.la(N + 1) - T.la(N)), r2 = Math.exp(T.la(N + 7) - T.la(N + 6)), ratioL = Math.abs(r1 - r2) < 1e-4 ? r1 : NaN;
  let dec = true;
  for (let n = Math.max(n0, 1); n < 3000; n++) if (T.la(n + 1) > T.la(n) + 1e-12) { dec = false; break; }
  let fdec = !!T.f && pos;
  if (fdec) for (let x = n0; x < 400; x += 0.05) if (!(T.f(x + 0.05) < T.f(x))) { fdec = false; break; }
  return { T, a, pos, alts, lim0, limAbs, ratioL, dec, fdec };
}
/* lim n^q a_n, taken at two large n (a finite positive limit or NaN) */
function powLim(T, q) { const v1 = Math.exp(T.la(1e7) + q * Math.log(1e7)), v2 = Math.exp(T.la(2e7) + q * Math.log(2e7)); return Math.abs(v1 - v2) < 1e-5 * Math.max(1, v1) ? v1 : NaN; }

export function check(data, map) {
  const errs = [];
  frame(data, 'series-lab', 'simulator', map, errs);
  const { M, model } = runtime('series-lab');
  if (!model) { errs.push('no model registered (ApCalcMath.seriesLab)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub (calculus-bc/assets/tools/math/series-lab.js)'); return errs; }
  for (const c of data.contexts || []) {
    if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind "${c.kind}" is not one of ${KINDS.join(', ')}`);
    if (c.kind === 'test') for (const f of c.fams || []) if (!FAMS.includes(f)) errs.push(`context ${c.id}: family "${f}" is not one of ${FAMS.join(', ')}`);
  }
  if (errs.length) return errs;
  const IVG = intervalGrader();
  const recheck = (p, ctx, w) => {
    const bad = m => errs.push(`${w}: ${m}`);
    const step = k => p.steps.find(s => s.key === k);
    const keyed = k => { const s = step(k); return s && p.codes && p.codes[k] ? p.codes[k][s.correct] : undefined; };
    const num = (k, want, rel = 1e-6, abs = 1e-9) => { const s = step(k); if (!s) return bad(`no step ${k}`); if (!close(s.cell.answer, want, rel, abs)) bad(`step ${k} keyed ${s.cell.answer}, recomputed ${want}`); };
    if (p.type !== ctx.kind) bad(`asked for ${ctx.kind}, got ${p.type}`);
    for (const s of p.steps) if (s.kind === 'choice' && !(p.codes && Array.isArray(p.codes[s.key]) && p.codes[s.key].length === s.options.length)) bad(`step ${s.key} has no option codes`);
    const C = p.chk, P = C.prm;
    if (p.type === 'partial') {
      const S = P.v === 0 ? n => P.a * n / (P.b * n + P.c) : n => P.k - P.m / (n + P.j);
      num('a1', S(1)); num('a3', S(3) - S(2)); num('sum', S(1e9), 1e-6);
      if (keyed('concl') !== 'conv') bad('the series converges (finite limit of S_n)');
    }
    if (p.type === 'sum') {
      const t = n => P.A * P.r ** n;
      num('r', t(P.n0 + 1) / t(P.n0)); num('first', t(P.n0)); num('s3', t(P.n0) + t(P.n0 + 1) + t(P.n0 + 2));
      const conv = Math.abs(P.r) < 1;
      if (keyed('conv') !== (conv ? 'yes' : 'no')) bad(`|r| = ${Math.abs(P.r)}: convergence keyed wrong`);
      if (conv) { let s = 0; for (let n = P.n0; n < P.n0 + 4000; n++) s += t(n); num('sum', s, 1e-9); }
      else if (step('sum')) bad('a divergent geometric series has a sum step');
    }
    if (p.type === 'test') {
      const J = judge(C.fam, P, C.n0);
      // the verdict, by the rules of each family, against the numbers
      const verdict = { nth: 'div', integral: P.q > 1 ? 'abs' : 'div', direct: P.v === 1 ? 'div' : 'abs', limit: P.v === 1 || P.v === 2 ? 'div' : 'abs', alt: 'cond', ratio: J.ratioL < 1 ? 'abs' : 'div' }[C.fam];
      if (verdict !== C.verdict) bad(`verdict ${C.verdict}, recomputed ${verdict}`);
      if (C.fam === 'nth' && J.lim0) bad('nth family with terms that approach 0');
      if (C.fam === 'alt' && !(J.alts && J.dec && J.lim0)) bad('alternating family fails the alternating series test');
      // which tests work, decided here
      const works = {
        nth: !J.lim0,
        ratio: isFinite(J.ratioL) && Math.abs(J.ratioL - 1) > 1e-3,
        alt: J.alts && J.dec && J.lim0,
        integral: J.fdec && C.fam === 'integral',
        direct: J.pos && C.fam === 'direct',
        limit: J.pos && C.fam === 'limit'
      };
      // a distractor must not settle it: why it fails, decided here
      const fails = {
        nth: J.lim0,
        ratio: !isFinite(J.ratioL) || Math.abs(J.ratioL - 1) < 1e-3,
        alt: !J.alts,
        integral: !J.pos || !J.T.f || (J.T.f && !J.fdec),
        direct: !J.pos,
        limit: !J.pos || (C.fam === 'direct' && !isFinite(powLim(J.T, P.v === 2 ? 0 : P.p)) ) || (C.fam === 'ratio' && (P.v === 0 || P.v === 2))
      };
      if (C.fam === 'direct' && P.v === 2) fails.limit = true; // sin^2 n / p^n against 1/p^n: the ratio sin^2 n has no limit
      if (C.fam === 'direct' && P.v === 2) { const T = J.T; const q1 = Math.exp(T.la(1e6) + 1e6 * Math.log(P.p)), q2 = Math.exp(T.la(1e6 + 1) + (1e6 + 1) * Math.log(P.p)); if (Math.abs(q1 - q2) < 1e-3) bad('sin^2 n ratio should oscillate'); }
      if (keyed('test') !== C.best) bad(`keyed test ${keyed('test')}, chk says ${C.best}`);
      if (!works[C.best]) bad(`the keyed test (${C.best}) does not settle the series`);
      for (const t of p.codes.test) if (t !== C.best && !fails[t]) bad(`distractor ${t} would also settle it`);
      const cWant = C.verdict === 'div' ? 'div' : 'conv';
      if (keyed('concl') !== cWant) bad(`conclusion keyed ${keyed('concl')}, want ${cWant}`);
      if (C.fam === 'nth') num('lim', Math.exp(J.T.la(1e9)), 1e-6);
      if (C.fam === 'integral') {
        if (keyed('cond') !== 'ok' || !J.fdec) bad('integral conditions');
        if (P.q > 1) { const B = 10; const I = M.integral(u => u ** -P.q, Math.LN2, B, 1e-12) + B ** (1 - P.q) / (P.q - 1); num('ival', I, 1e-7); }
        else if (keyed('intd') !== 'div') bad('the integral diverges for q <= 1');
      }
      if (C.fam === 'direct') {
        if (keyed('cmp') !== 'good') bad('comparison keyed');
        const T = J.T, tr = P.trig === 'sin' ? Math.sin : Math.cos;
        for (let n = 1; n < 5000; n++) {
          const an = Math.exp(T.la(n));
          if (P.v === 0 && !(an <= (P.k + 1) / n ** P.p + 1e-15 && an > 0)) { bad(`a_${n} above (k + 1)/n^p`); break; }
          if (P.v === 1 && !(an >= (P.k - 1) / n ** P.p - 1e-15)) { bad(`a_${n} below (k - 1)/n^p`); break; }
          if (P.v === 2 && !(an <= 1 / P.p ** n + 1e-15 && tr(n) !== 0)) { bad(`a_${n} above 1/p^n`); break; }
        }
      }
      if (C.fam === 'limit') { const q = [2, 1, 1, 1.5][P.v]; num('L', powLim(J.T, q), 1e-5); }
      if (C.fam === 'ratio') num('L', J.ratioL, 1e-4, 1e-5);
      if (C.fam === 'alt' && keyed('conds') !== 'both') bad('the alternating conditions both hold');
    }
    if (p.type === 'absolute') {
      const lb = { p: n => -P.p * Math.log(n), geo: n => -n * Math.log(P.k), fact: n => -lfact(n), lin: n => -Math.log(P.a * n + P.c), nth: n => Math.log(n / (n + P.k)) }[P.b], b = n => Math.exp(lb(n));
      const absConv = P.b === 'geo' || P.b === 'fact' || (P.b === 'p' && P.p > 1);
      const lim = b(1e7), lim0 = lim < 1e-3;
      let dec = true; for (let n = Math.max(1, C.n0); n < 3000; n++) if (b(n + 1) > b(n)) { dec = false; break; }
      const verdict = absConv ? 'abs' : lim0 && dec ? 'cond' : 'div';
      if (verdict !== C.verdict) bad(`verdict ${C.verdict}, recomputed ${verdict}`);
      const nb = b(1e7) * 1e7, linLim = Math.abs(nb - b(2e7) * 2e7) < 1e-4 * nb && nb > 0;
      const truth = {
        'conv-p': P.b === 'p' && P.p > 1, 'div-p': P.b === 'p' && P.p <= 1, 'conv-geo': P.b === 'geo',
        'conv-ratio': Math.exp(lb(100001) - lb(100000)) < 0.999,
        'div-lc': linLim, 'div-nth': !lim0
      };
      p.codes.absS.forEach((c, i) => { if (truth[c] !== (i === step('absS').correct)) bad(`option ${c} of the sum of |a_n| is ${truth[c] ? 'true' : 'false'} but keyed ${i === step('absS').correct ? 'right' : 'wrong'}`); });
      const s2 = verdict === 'abs' ? 'conv-abs' : verdict === 'cond' ? 'conv-ast' : 'div-nth';
      if (keyed('serS') !== s2) bad(`series itself keyed ${keyed('serS')}, want ${s2}`);
      if (keyed('cls') !== verdict) bad(`classification keyed ${keyed('cls')}, want ${verdict}`);
    }
    if (p.type === 'interval') {
      const a = P.a;
      const c = { np: (x, n) => (P.alt ? (-1) ** n : 1) * (P.p === -1 ? n : n ** -P.p) * ((P.inv ? P.k : 1 / P.k) * (x - a)) ** n,
        sq: (x, n) => (n ? n ** -P.p : 1) * ((x - a) ** 2 / P.k) ** n, fact: (x, n) => Math.exp(n * Math.log(Math.abs(x - a) / P.k || 1e-300) - lfact(n)), nfact: (x, n) => Math.exp(lfact(n) + n * Math.log(Math.abs(x - a) || 1e-300)) }[P.fam];
      const R = { np: P.inv ? 1 / P.k : P.k, sq: Math.sqrt(P.k), fact: Infinity, nfact: 0 }[P.fam];
      // the ratio of consecutive terms at a test point, against the radius
      const x1 = a + (isFinite(R) && R > 0 ? 0.5 * R : 0.5);
      // the factorial series in logs (n! overflows): |c_{n+1}/c_n| at n = 4000
      const rr = P.fam === 'fact' ? Math.exp(lfact(4000) - lfact(4001)) * 0.5 / P.k : P.fam === 'nfact' ? Math.exp(lfact(4001) - lfact(4000)) * 0.5 : Math.abs(c(x1, 401) / c(x1, 400));
      const want = P.fam === 'np' || P.fam === 'sq' ? (P.fam === 'np' ? 0.5 : 0.25) : P.fam === 'fact' ? 0 : Infinity;
      if (P.fam === 'np' || P.fam === 'sq') { if (!close(rr, want, 1e-2, 1e-9)) bad(`ratio at x = ${x1} is ${rr}, radius ${R} predicts ${want}`); }
      if (P.fam === 'fact' && !(rr < 1e-3)) bad('factorial series ratio does not go to 0');
      if (P.fam === 'nfact' && !(rr > 100)) bad('n! series ratio does not blow up');
      if (step('R')) num('R', R, 1e-9);
      // endpoints: the series sum (+-1)^n n^-p, judged here
      const endTruth = (alt, pp) => ({ 'conv-ast': alt && pp > 0, 'conv-p': pp > 1, 'div-harm': !alt && pp === 1, 'div-nth': pp <= 0, 'div-p': !alt && pp <= 1, ratio: false });
      const endConv = (alt, pp) => pp > 1 || (alt && pp > 0);
      const I = step('int').interval, K = IVG.key(I);
      if (isFinite(R) && R > 0) {
        const pp = P.p, loAlt = P.fam === 'np' ? !P.alt : false, hiAlt = P.fam === 'np' ? P.alt : false;
        // the endpoint series from the term itself: at x = a +- R
        const sgnAt = x => Math.sign(c(x, 3)) === Math.sign(c(x, 4)) ? false : true;
        if (sgnAt(a + R) !== hiAlt || sgnAt(a - R) !== loAlt) bad('the endpoint series alternate where the key says they do not (or the other way)');
        [['lo', loAlt], ['hi', hiAlt]].forEach(([k, alt]) => {
          const tr = endTruth(alt, pp), s = step(k);
          p.codes[k].forEach((cd, i) => { if (!!tr[cd] !== (i === s.correct)) bad(`endpoint ${k}: option ${cd} is ${tr[cd] ? 'true' : 'false'} but keyed ${i === s.correct ? 'right' : 'wrong'}`); });
        });
        if (!close(K.lo, a - R, 1e-12, 1e-12) || !close(K.hi, a + R, 1e-12, 1e-12)) bad(`interval key [${K.lo}, ${K.hi}] is not a -+ R = ${a - R}, ${a + R}`);
        if (K.loIn !== endConv(loAlt, pp) || K.hiIn !== endConv(hiAlt, pp)) bad('interval brackets do not match the endpoint verdicts');
      } else if (R === Infinity) { if (!(K.lo === -Infinity && K.hi === Infinity)) bad('all reals expected'); }
      else if (!(K.point && K.lo === a)) bad('a single point expected');
      // (ApCalcBCInterval.text writes a point as "x = 2 only", which its parser does not read back: type it as "x = 2")
      const kt = K.point ? 'x = ' + K.lo : IVG.text(K, 'x'), g = IVG.grade({ interval: I }, kt);
      if (!g.valid || !g.correct) bad(`the key "${kt}" is graded wrong`);
      for (const m of I.mistakes || []) { const gm = IVG.grade({ interval: I }, m.answer); if (!gm.valid || gm.correct) bad(`interval mistake "${m.answer}" is graded right`); if (!m.why) bad('an interval mistake has no explanation'); }
      if (isFinite(R) && R > 0) {
        const open = '(' + K.lo + ', ' + K.hi + ')', shut = '[' + K.lo + ', ' + K.hi + ']';
        if (K.loIn || K.hiIn) { if (IVG.grade({ interval: I }, open).correct) bad('both endpoints left out is graded right'); }
        if (!(K.loIn && K.hiIn)) { if (IVG.grade({ interval: I }, shut).correct) bad('both endpoints included is graded right'); }
        const gr = IVG.grade({ interval: I }, String(R));
        if (gr.correct) bad('the radius alone is graded right');
      }
    }
  };
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), recheck);
  return errs;
}
