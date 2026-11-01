/* Validator for calculus-bc/data/tools/integration-methods.json (Integration methods), run by
   scripts/check-apcalcbc-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems. It regenerates 300 problems per context and
   kind with the model the page runs (ApCalcMath.integrationMethods) and
   recomputes every key from the givens, never through the model: each
   antiderivative is differentiated numerically and compared with the
   integrand parsed from the problem; v and the tabular I column by
   differentiating back to the factor in dv; definite and improper values by
   adaptive Simpson and by the limit taken numerically; A and B by the limit
   of (x - a)f(x) at the pole; the method by the integrand's own structure. */
import { frame, sweep, close } from '../apcalc-tool-checks/_drills.mjs';
import { runtime } from './_shared.mjs';

const KINDS = ['parts', 'tabular', 'partial', 'improper', 'choose'];
const strip = s => String(s).replace(/&#x2061;/g, '').replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<[^>]+>/g, '').replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
const METHOD = { sub: 'u-substitution', parts: 'Integration by parts', pf: 'Partial fractions (linear factors)', alg: 'Rewrite with algebra, then basic rules' };

export function check(data, map) {
  const errs = [];
  frame(data, 'integration-methods', 'skill', map, errs);
  const { M, model } = runtime('integration-methods');
  if (!model) { errs.push('no model registered (ApCalcMath.integrationMethods)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub (calculus-bc/assets/tools/math/integration-methods.js)'); return errs; }
  for (const c of data.contexts || []) if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind "${c.kind}" is not one of ${KINDS.join(', ')}`);
  const fx = s => M.fn(s, ['x']);
  const d1 = (F, x) => { const h = 1e-5 * Math.max(1, Math.abs(x)); return (F(x + h) - F(x - h)) / (2 * h); };
  /* F' = f at points of [lo, hi] away from poles. */
  const antiOk = (F, f, lo, hi) => {
    let n = 0;
    for (let i = 1; i <= 23; i++) {
      const x = lo + (hi - lo) * i / 24, a = f(x), b = d1(F, x);
      if (!Number.isFinite(a) || Math.abs(a) > 1e4) continue;
      n++; if (!close(b, a, 1e-5, 1e-5)) return `at x = ${x.toFixed(3)}: F' = ${b}, f = ${a}`;
    }
    return n >= 8 ? '' : 'too few points';
  };
  const recheck = (p, ctx, w) => {
    const bad = m => errs.push(`${w}: ${m}`);
    const step = k => p.steps.find(s => s.key === k);
    const F = p.fig;
    if (p.type !== ctx.kind) bad(`asked for ${ctx.kind}, got ${p.type}`);
    if (p.type === 'parts') {
      const f = fx(F.integrand), dom = step('pr').cell.expr.domain;
      const e = antiOk(fx(step('pr').cell.expr.answer), f, dom[0], dom[1]); if (e) bad(`the antiderivative is wrong ${e}`);
      // u is x or ln x (never the exponential or trig factor); v' = f / u
      const lnU = /ln/.test(F.integrand), u = lnU ? Math.log : (x => x);
      const opt = strip(step('pu').options[step('pu').correct]).replace(/\s/g, '');
      if (!(lnU ? /^u=lnx,/ : /^u=x,/).test(opt)) bad(`u keyed "${opt}"`);
      const v = fx(step('pv').cell.expr.answer);
      for (const x of [dom[0] + 0.31, (dom[0] + dom[1]) / 2 + 0.17, dom[1] - 0.23]) if (!close(d1(v, x), f(x) / u(x), 1e-5, 1e-5)) bad(`v' is not dv at x = ${x}`);
      if (F.A != null) { const want = M.integral(f, F.A, F.B, 1e-10); if (!close(step('pd').cell.answer, want, 1e-6, 1e-6)) bad(`definite value keyed ${step('pd').cell.answer}, Simpson gives ${want}`); }
      else if (step('pd')) bad('a definite step without bounds');
    }
    if (p.type === 'tabular') {
      const f = fx(F.integrand), e = antiOk(fx(step('tr').cell.expr.answer), f, -2, 2); if (e) bad(`the antiderivative is wrong ${e}`);
      const I = F.Is.map(fx), g = x => f(x) / (x * x);
      for (const x of [-1.3, 0.4, 1.7]) {
        if (!close(I[0](x), g(x), 1e-9, 1e-9)) bad('the I column does not start with the factor of x^2');
        for (let k = 1; k <= 3; k++) if (!close(d1(I[k], x), I[k - 1](x), 1e-5, 1e-5)) bad(`I${k}' is not I${k - 1} at x = ${x}`);
      }
      const ti = fx(step('ti').cell.expr.answer);
      for (const x of [-1.1, 0.6]) if (!close(ti(x), I[3](x), 1e-9, 1e-9)) bad('the I3 key is not the third antiderivative');
      const sg = strip(step('ts').options[step('ts').correct]).replace(/\s/g, '');
      if (sg !== '+,-,+') bad(`signs keyed "${sg}"`);
    }
    if (p.type === 'partial') {
      const f = x => (F.c * x + F.d) / ((x - F.p) * (x - F.q)), h = 1e-7;
      const A = (F.p + h - F.p) * f(F.p + h), B = (F.q + h - F.q) * f(F.q + h);
      if (!close(step('fa').cell.answer, A, 1e-5, 1e-5)) bad(`A keyed ${step('fa').cell.answer}, the limit gives ${A}`);
      if (!close(step('fb').cell.answer, B, 1e-5, 1e-5)) bad(`B keyed ${step('fb').cell.answer}, the limit gives ${B}`);
      if (Math.abs(A - B) < 1e-6) bad('A = B: the numerator is a multiple of the denominator\'s derivative (a substitution)');
      if (F.p === F.q) bad('a repeated factor (outside BC scope)');
      const dom = step('fr').cell.expr.domain, e = antiOk(fx(step('fr').cell.expr.answer), f, dom[0], dom[1]); if (e) bad(`the antiderivative is wrong ${e}`);
    }
    if (p.type === 'improper') {
      const f = fx(F.f), Fb = M.fn(step('ia').cell.expr.answer, ['b']);
      // the partial integral: its value at b = a is 0 and its derivative is +f(b) (to infinity) or -f(b) (down to 0)
      if (!close(Fb(F.a), 0, 1e-9, 1e-9)) bad(`the partial integral is ${Fb(F.a)} at b = a, not 0`);
      for (const b of F.inf ? [F.a + 0.7, F.a + 3.1] : [F.a * 0.2, F.a * 0.7]) {
        if (!close(d1(Fb, b), (F.inf ? 1 : -1) * f(b), 1e-5, 1e-5)) bad(`d/db of the partial integral at ${b}`);
        const sim = F.inf ? M.integral(f, F.a, b, 1e-10) : M.integral(f, b, F.a, 1e-10);
        if (!close(Fb(b), sim, 1e-5, 1e-6)) bad(`partial integral at b = ${b}: keyed ${Fb(b)}, Simpson ${sim}`);
      }
      const far = F.inf ? [1e8, 1e10] : [1e-8, 1e-10], v1 = Fb(far[0]), v2 = Fb(far[1]);
      const conv = Number.isFinite(v2) && Math.abs(v2 - v1) < 1e-2 && Math.abs(v2) < 1e6;
      if (conv !== F.conv) bad(`convergence keyed ${F.conv}, the limit gives ${conv} (${v1}, ${v2})`);
      const ic = strip(step('ic').options[step('ic').correct]);
      if (!(conv ? /^Converges:/ : /^Diverges:/).test(ic)) bad(`keyed "${ic}"`);
      if (conv && !close(step('iv').cell.answer, v2, 1e-3, 1e-3)) bad(`value keyed ${step('iv').cell.answer}, the limit gives ${v2}`);
      if (!conv && step('iv')) bad('a value step for a divergent integral');
      const is = strip(step('is').options[step('is').correct]);
      if (!(F.inf ? /limb→∞/ : /limb→0\+/).test(is.replace(/\s/g, ''))) bad(`setup keyed "${is}"`);
    }
    if (p.type === 'choose') {
      const f = fx(F.f), e = antiOk(fx(step('cr').cell.expr.answer), f, F.dom[0], F.dom[1]); if (e) bad(`the antiderivative is wrong ${e}`);
      const cm = strip(step('cm').options[step('cm').correct]);
      if (cm !== METHOD[F.m]) bad(`method keyed "${cm}", the problem is ${F.m}`);
      const xs = [-2.3, -0.7, 0.45, 1.3, 2.7].map(x => F.dom[0] + (F.dom[1] - F.dom[0]) * (x + 3) / 6);
      if (F.m === 'pf') {
        // f is A/(x - p) + B/(x - q) with distinct linear factors, and A, B are its residues
        for (const x of xs) { const g = F.A / (x - F.p) + F.B / (x - F.q); if (Number.isFinite(f(x)) && !close(f(x), g, 1e-9, 1e-9)) bad(`not A/(x - p) + B/(x - q) at ${x}`); }
        if (F.p === F.q || Math.abs(F.A - F.B) < 1e-9) bad('a repeated factor, or a numerator that is the derivative of the denominator');
      }
      if (F.m === 'alg') for (const x of xs) { const g = F.terms.reduce((s, [c, e]) => s + c * Math.pow(x, e), 0); if (Number.isFinite(f(x)) && !close(f(x), g, 1e-9, 1e-9)) bad(`not the sum of powers at ${x}`); }
      if (F.m === 'sub') {
        // f(x) = h(u(x)) u'(x): F is a function of the inner u, so F(x) - F(y) = 0 where u(x) = u(y) (even inner),
        // and in general dF/du = F'(x)/u'(x) is the same at two points with one u
        const u = fx(F.inner), ok = xs.some(x => { const du = d1(u, x); return Number.isFinite(du) && Math.abs(du) > 1e-6; });
        if (!ok) bad('the inner function has no usable derivative');
      }
      if (F.m === 'parts' && !/(e\^|sin|cos|ln)/.test(F.f)) bad('a parts integrand without an exponential, trig or log factor');
    }
  };
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), recheck, c => [c.kind]);
  return errs;
}
