/* Validator for precalculus/data/tools/symbolic-steps.json (Symbolic steps), run by
   scripts/check-apprecalc-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems.

   The frame, then every problem the drill can generate (300 seeds per
   context, scripts/lib/apprecalc-tool-checks/_drills.mjs: every key graded
   right, every authored slip graded wrong) and each key rebuilt here from
   the problem's parameters WITHOUT the model's algebra: the original
   expression is evaluated directly and compared, at many points of the
   problem's domain, with the single power, log, sine or tangent the key
   describes; equations are checked by substituting the key back into the
   original equation, and the count of solutions by scanning the interval
   (or the domain) for sign changes; inverse trig values by Math.asin, acos,
   atan. Every string is strict TeX. The Explore checker is tested on fixed
   pairs. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

function texOk(Tex, s, w, errs) { try { Tex.html(String(s), { strict: true }); } catch (e) { errs.push(`${w}: TeX: ${e.message}`); } }
const pts = (a, b, n = 23) => Array.from({ length: n }, (_, i) => a + (b - a) * (i + 0.5) / n);

export function exploreProblems(model) {
  const errs = [], kinds = p => p.pieces.map(q => q.s).join(',');
  const a = model.compareForms('ln(x^2)', '2ln(x)', [-4, 4]);
  if (kinds(a) !== 'a,same') errs.push(`compareForms ln(x^2) vs 2ln(x): ${kinds(a)}`);
  const b = model.compareForms('ln(x + 2)', 'ln(x) + ln(2)', [-4, 4]);
  if (!/diff/.test(kinds(b))) errs.push('compareForms: ln(x + 2) and ln x + ln 2 should differ');
  const c = model.compareForms('sin(2x)', '2sin(x)cos(x)', [-4, 4]);
  if (kinds(c) !== 'same') errs.push('compareForms: sin(2x) = 2 sin x cos x everywhere');
  if (!model.compareForms('sin(', 'x').error) errs.push('compareForms: an unreadable expression is not reported');
  for (const [p, q] of model.EXAMPLES) { const r = model.compareForms(p, q); if (!r.ok) errs.push(`example ${p} | ${q}: ${r.error}`); }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'symbolic-steps', 'drill', map, errs);
  const { model, Tex, Expr } = runtime('symbolic-steps');
  if (!model) { errs.push('the model ApPrecalcMath.symbolicSteps is not registered (precalculus/assets/tools/math/symbolic-steps.js)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub: build it before adding data (docs/apprecalc-briefs/t2.md)'); return errs; }
  for (const c of data.contexts || []) if (!model.KINDS.includes(c.kind)) errs.push(`context ${c.id}: unknown kind "${c.kind}"`);
  errs.push(...exploreProblems(model));

  const recheck = (p, c, w) => {
    const before = errs.length;
    for (const s of [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', s.lhs ? '$' + s.lhs + '$' : '', ...(s.options || []), ...(s.why || []), ...((s.cell && s.cell.mistakes) || []).map(m => m.why), ...((s.cell && s.cell.expr && s.cell.expr.mistakes) || []).map(m => m.why)])]) texOk(Tex, s, w, errs);
    if (errs.length > before) return;
    const S = Object.fromEntries(p.steps.map(s => [s.key, s])), V = p.values;
    const key = k => S[k].cell.expr ? Expr.fn(S[k].cell.expr.answer, S[k].cell.expr.vars) : null, A = k => S[k].cell.answer;
    const same = (f, g, xs, what) => { for (const x of xs) { const a = f(x), b = g(x); if (Number.isFinite(a) && !close(a, b, 1e-9, 1e-9)) { errs.push(`${w}: ${what} is wrong at x = ${x}`); return; } } };
    if (p.type === 'single-power') {
      const { p: b, m, a1, b1, a2, b2, op } = V, big = b ** m;
      const orig = x => op === 'mul' ? big ** (a1 * x + b1) * b ** (a2 * x + b2) : big ** (a1 * x + b1) / b ** (a2 * x + b2);
      same(x => b ** key('A')(x), x => big ** (a1 * x + b1), pts(-2, 2), 'the first power');
      same(x => b ** key('B')(x), orig, pts(-2, 2), 'the single power');
      if (!new RegExp(`^Write \\$${big}\\^`).test(p.text)) errs.push(`${w}: the text does not show ${big}`);
    } else if (p.type === 'single-log') {
      const { L, c: cc, d, k, sign } = V, lg = L === 'ln' ? Math.log : L === 'log_2' ? Math.log2 : Math.log10, co = cc === 'h' ? 0.5 : cc;
      const orig = x => co * lg(x) + lg(x + d) + sign * -1 * lg(k);
      const xs = pts(Math.max(0.15, -d + 0.15), 4.5);
      same(x => lg(key('A')(x)), x => co * lg(x), xs, 'the power rule');
      same(x => lg(key('B')(x)), orig, xs, 'the single log');
      const want = Math.max(0, -d), right = S.dom.options[S.dom.correct];
      if (right !== `$x > ${want}$`) errs.push(`${w}: the domain answer is wrong`);
    } else if (p.type === 'exp-eq') {
      const { a, k, c: cc, d, b } = V, base = b === 'e' ? Math.E : b;
      if (!close(a * base ** (k * A('x')) + cc, d, 1e-9, 1e-9)) errs.push(`${w}: x does not solve the equation`);
      if (!close(A('iso'), base ** (k * A('x')), 1e-9)) errs.push(`${w}: the isolated power is wrong`);
    } else if (p.type === 'log-eq') {
      const { b, c: cc, d } = V, lg = x => Math.log(x) / Math.log(b), f = x => lg(x) + lg(x + d) - cc;
      if (!close(f(A('x')), 0, 0, 1e-9)) errs.push(`${w}: x does not solve the equation`);
      if (A('N') !== b ** cc) errs.push(`${w}: the exponential form is wrong`);
      // count: solutions of the original on its domain
      let n = 0; const lo = Math.max(0, -d); for (const x of pts(lo + 1e-6, 200, 20000)) { const y0 = f(x), y1 = f(x + 199.99 / 20000); if (y0 === 0 || y0 * y1 < 0) n++; }
      if (A('count') !== n) errs.push(`${w}: ${n} solutions, not ${A('count')}`);
    } else if (p.type === 'quad-ex') {
      const { p: pp, c: cc } = V, f = x => Math.exp(2 * x) + pp * Math.exp(x) + cc;
      same(u => key('u')(u), u => u * u + pp * u + cc, pts(-3, 3), 'the quadratic in u');
      let n = 0; const sols = []; const xs = pts(-12, 6, 36000);
      for (let i = 0; i + 1 < xs.length; i++) if (f(xs[i]) * f(xs[i + 1]) < 0) { n++; sols.push((xs[i] + xs[i + 1]) / 2); }
      if (A('count') !== n) errs.push(`${w}: ${n} real solutions, not ${A('count')}`);
      if (!close(A('x1'), sols[0], 0, 1e-3) || (S.x2 && !close(A('x2'), sols[1], 0, 1e-3))) errs.push(`${w}: the solutions are wrong`);
      if (!close(f(A('x1')), 0, 0, 1e-9)) errs.push(`${w}: x1 does not solve the equation`);
    } else if (p.type === 'inv-trig') {
      const F = { arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan }[V.fn];
      const arg = { arcsin: Math.sin, arccos: Math.cos, arctan: Math.tan }[V.fn](A('v'));
      if (!close(F(arg), A('v'), 0, 1e-9)) errs.push(`${w}: the angle is not in the principal range`);
      if (!close(F(arg), V.ang, 0, 1e-9)) errs.push(`${w}: the inverse value is wrong`);
      const th = { arcsin: Math.asin, arccos: Math.acos }[V.inner](V.x), out = { sin: Math.sin, cos: Math.cos, tan: Math.tan }[V.outer](th);
      if (!close(A('comp'), out, 1e-9, 1e-12)) errs.push(`${w}: the composition is wrong`);
    } else if (p.type === 'trig-eq') {
      const f = { sin: Math.sin, cos: Math.cos, tan: Math.tan }[V.f];
      // the equation from its TeX: k·f(x) + c = 0 read off the text
      const m = /^(\\sqrt\{(\d)\}|(\d*))\\(sin|cos|tan) x ([+-]) (\\sqrt\{(\d)\}|(\d+)) = 0$/.exec(V.eq);
      const kk = m[2] ? Math.sqrt(+m[2]) : m[3] ? +m[3] : 1, cc = (m[5] === '-' ? -1 : 1) * (m[7] ? Math.sqrt(+m[7]) : +m[8]);
      if (m[4] !== V.f) errs.push(`${w}: the equation's function is not ${V.f}`);
      if (!close(A('iso'), -cc / kk, 1e-9, 1e-12)) errs.push(`${w}: the isolated value is wrong`);
      const g = x => kk * f(x) + cc, roots = [], xs = pts(0, 2 * Math.PI, 72000);
      for (let i = 0; i + 1 < xs.length; i++) { const y0 = g(xs[i]), y1 = g(xs[i + 1]); if (Number.isFinite(y0) && Number.isFinite(y1) && y0 * y1 < 0 && Math.abs(y0 - y1) < 1) roots.push((xs[i] + xs[i + 1]) / 2); }
      if (A('count') !== roots.length) errs.push(`${w}: ${roots.length} solutions in [0, 2π), not ${A('count')}`);
      if (!close(A('x1'), roots[0], 0, 1e-3) || !close(A('x2'), roots[1], 0, 1e-3)) errs.push(`${w}: the solutions are wrong`);
    } else if (p.type === 'trig-id') {
      const { id, K, C } = V, s = Math.sin, co = Math.cos, t = Math.PI / K, xs = pts(-1.2, 1.2);
      const orig = { 'sum-sin': x => s(x) * co(t) + co(x) * s(t), 'dif-sin': x => s(x) * co(t) - co(x) * s(t), 'sum-cos': x => co(x) * co(t) - s(x) * s(t),
        'dbl-sin': x => C * s(x) * co(x), 'tan-dbl': x => s(2 * x) / (1 + co(2 * x)), 'tan-pyth': x => (1 - co(x) ** 2) / (s(x) * co(x)) }[id];
      if (id === 'dbl-sin') same(x => A('k') * s(key('A')(x)), orig, xs, 'k sin(A)');
      else if (id.startsWith('tan')) {
        same(x => Math.tan(key('A')(x)), orig, xs, 'the single tangent');
        if (S.n && id === 'tan-dbl') same(key('n'), x => s(2 * x), xs, 'sin(2x)');
        if (S.d) same(key('d'), x => 1 + co(2 * x), xs, '1 + cos(2x)');
        if (S.n && id === 'tan-pyth') same(key('n'), x => 1 - co(x) ** 2, xs, '1 - cos²x');
      } else same(x => (id === 'sum-cos' ? co : s)(key('A')(x)), orig, xs, 'the single ' + (id === 'sum-cos' ? 'cosine' : 'sine'));
    } else errs.push(`${w}: unknown kind ${p.type}`);
  };
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), recheck);
  return errs;
}
