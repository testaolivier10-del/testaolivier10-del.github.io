/* Validator for calculus/data/tools/tangent-tracer.json (Tangent tracer), run by
   scripts/check-apcalc-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. The problems come from the model the page
   runs (runtime('tangent-tracer').model, ApCalcMath.tangentTracer); every key
   is recomputed here another way:
     - derivatives by ApCalcMath.deriv (central differences) on the function
       the problem draws, compiled from its own expression string,
     - one-sided slopes and continuity by this file's own difference
       quotients (not the model's classify),
     - table quotients from the table, tangent lines by evaluating
       f(a) + f'(a)(x - a) against the typed key at many points.
   It also checks the explore shelf (each special point's kind and one-sided
   slopes, each exact derivative against a numerical one), the h slider
   scale, every text's TeX (strict) and every figure's plot spec.
   recheck(p, ctx) is exported so the test can plant mistakes. */
import { frame, sweep } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const near = (a, b, rel = 1e-6, abs = 1e-9) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(a), Math.abs(b)) + abs;

/* One-sided behavior of f at a, independently of the model. */
export function sides(f, a) {
  const fa = f(a), q = h => (f(a + h) - fa) / h, out = {};
  for (const [k, s] of [['L', -1], ['R', 1]]) {
    const v4 = q(s * 1e-4), v6 = q(s * 1e-6), gap = Math.abs(f(a + s * 1e-12) - fa);
    if (!Number.isFinite(v4) || !Number.isFinite(v6)) { out[k] = { none: true }; continue; }
    out[k] = { jump: gap > 1e-3 * Math.max(1, Math.abs(fa)), inf: Math.abs(v6) > 50 && Math.abs(v6) > 3 * Math.abs(v4), v: v6, sign: Math.sign(v6) };
  }
  const L = out.L, R = out.R;
  out.continuous = !(L.jump || R.jump);
  out.diff = out.continuous && !L.none && !R.none && !L.inf && !R.inf && near(L.v, R.v, 1e-3, 1e-3);
  return out;
}

function texOk(Tex, s, w, errs) {
  for (const p of Tex.check(String(s))) errs.push(`${w}: TeX: ${p}`);
}

// Drawing every figure is slow in the sandbox: every fifth problem's figures
// are drawn (60 per context and type), every key is still recomputed.
let figN = 0;
export function recheck(p, ctx, opts = {}) {
  const { M, Plot, Tex, model: TT } = runtime('tangent-tracer');
  const errs = [], w = `${ctx.id} ${p.type}`;
  const texts = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || [])])];
  for (const t of texts) texOk(Tex, t, w, errs);
  const fig = p.fig, specOf = f => ({ ...f, width: 400, height: 300 });
  if (opts.figures || figN++ % 5 === 0) try {
    if (fig.kind === 'graph') Plot.svg(specOf(fig));
    if (fig.plot) Plot.svg(specOf(fig.plot));
    if (fig.kind === 'sketch') Plot.svg(specOf(fig.top));
    for (const s of p.steps) for (const g of s.pics || []) Plot.svg(specOf(g));
  } catch (e) { errs.push(`${w}: a figure does not draw: ${e.message}`); }
  const step = k => p.steps.find(s => s.key === k);
  const choice = (s, i) => s.options[s.correct] === s.options[i];

  if (p.type === 'estimate') {
    const f = M.fn(p.fn), [p1, p2] = fig.points.map(q => q.at), m = (p2[1] - p1[1]) / (p2[0] - p1[0]);
    if (!near(f(p1[0]), p1[1], 1e-9, 1e-9)) errs.push(`${w}: the tangent point is not on f`);
    if (!near(M.deriv(f, p1[0]), m, 1e-6, 1e-6)) errs.push(`${w}: the drawn line is not tangent: f'(a) = ${M.deriv(f, p1[0])}, line slope ${m}`);
    if (!near(step('slope').cell.answer, m)) errs.push(`${w}: slope key ${step('slope').cell.answer} is not rise/run = ${m}`);
    if (![p1, p2].every(q => Number.isInteger(q[0]) && Number.isInteger(q[1]))) errs.push(`${w}: the marked points are not grid points`);
    const B = fig.points[2].at, mb = M.deriv(f, B[0]), c = step('compare');
    if (!near(f(B[0]), B[1], 1e-9, 1e-9)) errs.push(`${w}: point B is not on f`);
    const want = mb > m + 1e-9 ? 0 : mb < m - 1e-9 ? 1 : 2;
    if (c.correct !== want) errs.push(`${w}: compare key ${c.correct}, slopes say ${want}`);
  } else if (p.type === 'table') {
    const { ts, vs, c, i } = fig, s1 = step('interval'), s2 = step('value'), s3 = step('units');
    if (!(ts[i] < c && c < ts[i + 1])) errs.push(`${w}: t = ${c} is not inside the chosen interval`);
    const want = `$${fig.t} = ${ts[i]}$ and $${fig.t} = ${ts[i + 1]}$`;
    if (s1.options[s1.correct] !== want) errs.push(`${w}: the interval key is "${s1.options[s1.correct]}", not ${want}`);
    for (let j = 0; j + 1 < ts.length; j++) if (j !== i && ts[j] < c && c < ts[j + 1]) errs.push(`${w}: another interval also brackets c`);
    if (!near(s2.cell.answer, (vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]))) errs.push(`${w}: the difference quotient key is wrong`);
    if (!/ per /.test(s3.options[s3.correct]) || / per .* per /.test(s3.options[s3.correct]) || !s3.options[s3.correct].startsWith(fig.unit)) errs.push(`${w}: the units key "${s3.options[s3.correct]}" is not ${fig.unit} per ${fig.tu}`);
    if (new Set(ts).size !== ts.length || ts.some((t, j) => j && t <= ts[j - 1])) errs.push(`${w}: times not increasing`);
  } else if (p.type === 'whichgraph') {
    const f = M.fn(p.fn), s1 = step('graph'), xs = Array.from({ length: 33 }, (_, j) => -4 + j * 0.25);
    s1.pics.forEach((g, j) => {
      const gf = M.fn(g.curves[0].fn), maxd = Math.max(...xs.map(x => Math.abs(gf(x) - M.deriv(f, x))));
      if (j === s1.correct && maxd > 1e-5) errs.push(`${w}: the keyed graph is not f' (off by ${maxd})`);
      if (j !== s1.correct && maxd < 0.3) errs.push(`${w}: distractor ${j} is too close to f'`);
    });
    for (const x of [p.p, p.q]) if (Math.abs(M.deriv(f, x)) > 1e-6) errs.push(`${w}: f'(${x}) is not 0`);
    const z = step('zeros');
    if (z.options[z.correct] !== `$x = ${p.p}$ and $x = ${p.q}$`) errs.push(`${w}: zeros key is wrong`);
  } else if (p.type === 'sketch') {
    const s = p.steps[0], pieces = fig.top.curves.map(c => ({ f: M.fn(c.fn), d: c.domain || [-Infinity, Infinity] }));
    const f = x => { const pc = pieces.find(q => x >= q.d[0] && x <= q.d[1]); return pc ? pc.f(x) : NaN; };
    s.xs.forEach((x, k) => {
      if (!near(s.fvals[k], f(x), 1e-9, 1e-9)) errs.push(`${w}: f(${x}) shown ${s.fvals[k]}, curve says ${f(x)}`);
      const sd = sides(f, x);
      if (!sd.diff) errs.push(`${w}: f is not differentiable at the marked x = ${x}`);
      else if (!near(s.answers[k], sd.L.v, 1e-4, 1e-4)) errs.push(`${w}: f'(${x}) key ${s.answers[k]}, slope ${sd.L.v}`);
      if (Math.abs(s.answers[k]) > s.Y) errs.push(`${w}: f'(${x}) is off the grid`);
      if (s.answers[k] !== 0 && Math.abs(s.answers[k]) < 1.3 * s.zeroTol) errs.push(`${w}: f'(${x}) = ${s.answers[k]} is too close to 0 to grade`);
      if (s.answers[k] === 0 && !s.turn[x] && !s.flat) errs.push(`${w}: a zero of f' at ${x} has no named reason`);
    });
    if (!TT.gradeSketch(s, s.answers).ok) errs.push(`${w}: the key sketch grades wrong`);
    const neg = s.answers.map(v => -v);
    if (s.answers.some(v => v !== 0) && TT.gradeSketch(s, neg).ok) errs.push(`${w}: a sketch with every sign flipped grades right`);
    if (TT.gradeSketch(s, s.answers.map(() => null)).ok) errs.push(`${w}: an empty sketch grades right`);
    if (fig.d) { const d = M.fn(fig.d); s.xs.forEach((x, k) => { if (!near(d(x), s.answers[k], 1e-9, 1e-9)) errs.push(`${w}: the drawn f' disagrees at ${x}`); }); }
  } else if (p.type === 'tanline') {
    const L = p.steps.find(s => s.kind === 'expr'), E = L.cell.expr;
    let fa, m;
    if (p.source === 'given') {
      const j = fig.xs.indexOf(p.a); fa = fig.f[j]; m = fig.d[j];
      const s1 = step('slope'); if (!s1 || Number(String(s1.options[s1.correct]).replace(/\$/g, '')) !== m) errs.push(`${w}: slope choice key is not f'(a) from the table`);
    } else {
      const f = M.fn(p.fn); fa = f(p.a); m = M.deriv(f, p.a);
      if (!near(step('value').cell.answer, fa, 1e-9, 1e-9)) errs.push(`${w}: f(a) key is wrong`);
      if (!near(step('slope').cell.answer, m, 1e-6, 1e-6)) errs.push(`${w}: f'(a) key ${step('slope').cell.answer}, numeric ${m}`);
    }
    const key = M.fn(E.answer);
    for (const x of [-2.5, -1, -0.3, 0.4, 1.7, 3.1].map(t => p.a + t)) if (!near(key(x), fa + m * (x - p.a), 1e-6, 1e-6)) { errs.push(`${w}: the line key "${E.answer}" is not y = f(a) + f'(a)(x - a)`); break; }
  } else if (p.type === 'notdiff') {
    const f = p.f, marks = p.marks, bad = marks.filter(x => !sides(f, x).diff);
    if (bad.length !== 1 || bad[0] !== p.c) errs.push(`${w}: not differentiable at [${bad}], expected exactly [${p.c}]`);
    const s1 = step('where'); if (s1.options[s1.correct] !== `$x = ${p.c}$`) errs.push(`${w}: where key is wrong`);
    const sd = sides(f, p.c), s3 = step('continuous');
    if ((s3.correct === 0) !== sd.continuous) errs.push(`${w}: continuity key disagrees with the graph`);
    const r = step('why'), t = r.options[r.correct];
    const kind = !sd.continuous ? 'gap' : sd.L.inf && sd.R.inf ? (sd.L.sign === sd.R.sign ? 'vertical' : 'cusp') : 'corner';
    const want = { gap: /not continuous/, vertical: /vertical/, cusp: /cusp/, corner: /corner/ }[kind];
    if (!want.test(t)) errs.push(`${w}: reason key "${t}" but the graph shows ${kind}`);
    if (p.turn != null && Math.abs(M.deriv(f, p.turn)) > 1e-6) errs.push(`${w}: the flat-tangent mark is not flat`);
    if (kind === 'corner' && (!near(sd.L.v, p.LS, 1e-3, 1e-3) || !near(sd.R.v, p.RS, 1e-3, 1e-3))) errs.push(`${w}: one-sided slopes in the text are wrong`);
  } else errs.push(`${w}: unknown type`);
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'tangent-tracer', 'simulator', map, errs);
  const { M, Tex, model: TT } = runtime('tangent-tracer');
  if (!TT || typeof TT.generate !== 'function') { errs.push('calculus/assets/tools/math/tangent-tracer.js does not register ApCalcMath.tangentTracer with a generate()'); return errs; }
  const types = new Set(TT.TYPES.map(t => t.value));
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !types.has(t))) errs.push(`context ${c.id}: types must be some of ${[...types].join(', ')}`);
    if ((c.types || []).includes('tanline') && !['given', 'power', 'trans'].includes(c.source)) errs.push(`context ${c.id}: a tanline context needs source given | power | trans`);
  }
  // The explore shelf.
  for (const k of TT.ORDER) {
    const F = TT.FUNCS[k], w = `shelf ${k}`;
    if (!F || F.id !== k) { errs.push(`${w}: missing`); continue; }
    texOk(Tex, '$' + F.tex + '$', w, errs); if (F.dTex) texOk(Tex, '$' + F.dTex + '$', w, errs);
    if (!Number.isFinite(F.f(F.a))) errs.push(`${w}: f is not defined at the start point`);
    for (const sp of F.special) {
      const c = TT.classify(F.f, sp.x);
      if (c.kind !== sp.kind) errs.push(`${w}: x = ${sp.x} classifies as ${c.kind}, listed ${sp.kind}`);
      for (const s of ['L', 'R']) if (Number.isFinite(sp[s]) ? !near(c[s], sp[s], 1e-4, 1e-4) : (Number.isNaN(sp[s]) ? Number.isFinite(c[s]) : c[s] !== sp[s])) errs.push(`${w}: ${s} slope ${c[s]}, listed ${sp[s]}`);
      if (Number.isFinite(F.d(sp.x))) errs.push(`${w}: the derivative is given a value at its special point ${sp.x}`);
    }
    for (let i = 1; i < 40; i++) {
      const x = F.x[0] + (F.x[1] - F.x[0]) * i / 40;
      if (F.special.some(sp => Math.abs(sp.x - x) < 0.02) || !Number.isFinite(F.f(x - 1e-3)) || !Number.isFinite(F.f(x + 1e-3))) continue;
      if (F.join != null && Math.abs(F.join - x) < 0.02) continue;
      const d = F.d(x), nd = M.deriv(F.f, x);
      if (!near(d, nd, 1e-5, 1e-5)) { errs.push(`${w}: f'(${x.toFixed(3)}) = ${d}, numeric ${nd}`); break; }
      if (TT.classify(F.f, x).kind !== 'smooth') { errs.push(`${w}: x = ${x.toFixed(3)} classifies as not smooth`); break; }
    }
    if (F.join != null && TT.classify(F.f, F.join).kind !== 'smooth') errs.push(`${w}: the smooth join classifies as not smooth`);
  }
  // The h slider: monotone, both sides, reaches 0.001 and its maximum.
  let last = -Infinity;
  for (let s = -1000; s <= 1000; s += 10) { if (!s) continue; const h = TT.hOf(s); if (h < last || (s > 0) !== (h > 0)) { errs.push(`h slider is not increasing at ${s}`); break; } last = h; }
  if (TT.hOf(1) !== TT.HMIN || TT.hOf(-1) !== -TT.HMIN || TT.hOf(1000) !== TT.HMAX) errs.push('h slider ends are wrong');
  for (const h of [0.001, 0.01, 0.1, 0.5, 1, -0.01, -1]) if (!near(TT.hOf(TT.sOf(h)), h, 0.03)) errs.push(`h slider does not round-trip ${h}`);
  // Every problem, regenerated.
  sweep(data, errs, (r, c, t) => TT.generate(r, c, t), (p, c, w) => { for (const e of recheck(p, c)) errs.push(`${w}: ${e}`); }, c => c.types);
  return errs;
}
