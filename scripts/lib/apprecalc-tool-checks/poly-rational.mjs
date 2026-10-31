/* Validator for precalculus/data/tools/poly-rational.json (Polynomials and rationals), run by
   scripts/check-apprecalc-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems.

   The frame (slug, kind, topic, intro, howItWorks, contexts, trademark), the
   Explore presets (each known, each with a topic of the map), then every
   problem the drill can generate (300 seeds per context,
   scripts/lib/apprecalc-tool-checks/_drills.mjs) recomputed here WITHOUT the
   model's algebra: the function is evaluated from its own factor list, the
   degree and multiplicities are summed from it, a one-sided limit is read
   from values just beside the asymptote, a hole's height from values just
   beside it, end behavior and horizontal asymptotes from values at
   x = ±10^4, a sign from a test value; every string is strict TeX. The
   presets are analyzed the same way. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

// The function from a spec's factor list, written out here (not the model's fn).
function evalSpec(spec, x) {
  let v = spec.a;
  for (const f of spec.factors) {
    const t = x - f.r;
    if (f.where === 'num') v *= t ** f.m;
    else if (f.where === 'den') v /= t ** f.m;
    else v *= t / t;
  }
  return v;
}
const near = (spec, x, h) => evalSpec(spec, x + h);
function texOk(Tex, s, w, errs) { try { Tex.html(String(s), { strict: true }); } catch (e) { errs.push(`${w}: TeX: ${e.message}`); } }
// The value a choice option claims (lim ... = v): +Inf, -Inf, a number, or null.
function limOf(opt) {
  const m = /\\lim_\{x \\to [^}]*\}[^=]*= (-?\\infty|-?\\frac\{\d+\}\{\d+\}|-?[\d.]+)\$/.exec(opt);
  if (!m) return null;
  const v = m[1];
  if (v === '\\infty') return Infinity;
  if (v === '-\\infty') return -Infinity;
  const f = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(v);
  return f ? (f[1] ? -1 : 1) * Number(f[2]) / Number(f[3]) : Number(v);
}
function yOpt(opt) {
  const m = /^\$y = (-?)(?:\\frac\{(\d+)\}\{(\d+)\}|([\d.]+))\$$/.exec(opt);
  if (!m) return null;
  return (m[1] ? -1 : 1) * (m[2] ? Number(m[2]) / Number(m[3]) : Number(m[4]));
}

/* Each preset: its zeros, holes and asymptotes against values of the function. */
export function presetProblems(model) {
  const errs = [];
  for (const [id, P] of Object.entries(model.PRESETS)) {
    const s = P.spec, R = model.analyze(s);
    for (const z of R.zeros) if (Math.abs(evalSpec(s, z.x)) > 1e-9) errs.push(`preset ${id}: f(${z.x}) is not 0`);
    for (const h of R.holes) {
      if (Number.isFinite(model.fn(s)(h.x))) errs.push(`preset ${id}: the model's f is defined at the hole ${h.x}`);
      if (!close((near(s, h.x, 1e-6) + near(s, h.x, -1e-6)) / 2, h.y, 1e-4, 1e-5)) errs.push(`preset ${id}: hole height ${h.y} is not the limit`);
    }
    for (const v of R.vas) {
      const L = near(s, v.x, -1e-6), Rv = near(s, v.x, 1e-6);
      if (!(Math.abs(L) > 1e4 && Math.sign(L) === v.left && Math.abs(Rv) > 1e4 && Math.sign(Rv) === v.right)) errs.push(`preset ${id}: one-sided limits at ${v.x} are wrong`);
    }
    const big = evalSpec(s, 1e4), neg = evalSpec(s, -1e4);
    if (R.end.kind === 'ha') { if (!close(big, R.end.ha, 1e-2, 1e-2) || !close(neg, R.end.ha, 1e-2, 1e-2)) errs.push(`preset ${id}: horizontal asymptote ${R.end.ha} is wrong`); }
    else if (Math.sign(big) !== Math.sign(R.end.right) || Math.sign(neg) !== Math.sign(R.end.left) || Math.abs(big) < 100) errs.push(`preset ${id}: end behavior is wrong`);
    if (R.slant && !close(evalSpec(s, 1e4) - (R.slant.m * 1e4 + R.slant.b), 0, 0, 1e-2)) errs.push(`preset ${id}: slant asymptote is wrong`);
    for (const g of R.signs) if (Math.sign(evalSpec(s, g.at)) !== g.s) errs.push(`preset ${id}: the sign on (${g.a}, ${g.b}) is wrong`);
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'poly-rational', 'simulator', map, errs);
  const { model, Tex } = runtime('poly-rational');
  if (!model) { errs.push('the model ApPrecalcMath.polyRational is not registered (precalculus/assets/tools/math/poly-rational.js)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub: build it before adding data (docs/apprecalc-briefs/t2.md)'); return errs; }
  for (const p of data.presets || []) {
    if (!model.PRESETS[p.id]) errs.push(`preset ${p.id}: unknown preset`);
    if (!topicOk(p.topic, map)) errs.push(`preset ${p.id}: unknown topic "${p.topic}"`);
  }
  if (!(data.presets || []).length) errs.push('no presets for Explore');
  for (const c of data.contexts || []) if (!model.KINDS.includes(c.kind)) errs.push(`context ${c.id}: unknown kind "${c.kind}"`);
  errs.push(...presetProblems(model));

  const recheck = (p, c, w) => {
    const before = errs.length;
    for (const s of [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || []), ...((s.cell && s.cell.mistakes) || []).map(m => m.why)])]) texOk(Tex, s, w, errs);
    if (errs.length > before) return;
    const S = Object.fromEntries(p.steps.map(s => [s.key, s]));
    const pick = s => s.options[s.correct];
    const spec = p.fig;
    if (p.type === 'zeros') {
      const ms = spec.factors.map(f => f.m), even = spec.factors.filter(f => f.m % 2 === 0);
      if (S.deg.cell.answer !== ms.reduce((a, b) => a + b, 0)) errs.push(`${w}: the degree is wrong`);
      if (even.length !== 1 || S.touch.cell.answer !== even[0].r) errs.push(`${w}: the touching zero is wrong`);
      const x = Number(/x = (-?[\d.]+)/.exec(S.pass.label)[1]), f = spec.factors.find(g => g.r === x);
      // the sign really changes across an odd zero (and a multiplicity-3 zero is flat: small values beside it)
      const sl = evalSpec(spec, x - 1e-3), sr = evalSpec(spec, x + 1e-3);
      if (!f || f.m % 2 === 0 || Math.sign(sl) === Math.sign(sr)) errs.push(`${w}: the zero asked about does not cross`);
      if (!/crosses/.test(pick(S.pass)) || (f.m === 3) !== /flattening/.test(pick(S.pass))) errs.push(`${w}: the crossing answer is wrong`);
    } else if (p.type === 'end') {
      const deg = spec.factors.reduce((a, f) => a + f.m, 0);
      if (S.deg.cell.answer !== deg) errs.push(`${w}: the degree is wrong`);
      // the leading coefficient from the text's own factors: expand at a large x
      const fx = evalSpec(spec, 1e5) / 1e5 ** deg;
      if (!close(S.lead.cell.answer, fx, 1e-2)) errs.push(`${w}: the leading coefficient is wrong`);
      if (limOf(pick(S.right)) !== Math.sign(evalSpec(spec, 1e4)) * Infinity) errs.push(`${w}: the limit at ∞ is wrong`);
      if (limOf(pick(S.left)) !== Math.sign(evalSpec(spec, -1e4)) * Infinity) errs.push(`${w}: the limit at -∞ is wrong`);
      // the text's formula, read back, is the function the key describes
      const body = /\$f\(x\) = (.*)\$\.$/.exec(p.text)[1];
      const { Expr } = runtime('poly-rational');
      const g = Expr.fn(body);
      for (const x of [-2.3, 0.7, 1.9]) if (!close(g(x), evalSpec(spec, x), 1e-9, 1e-9)) { errs.push(`${w}: the text's formula is not the function graded`); break; }
    } else if (p.type === 'ha') {
      const { num, den } = p.poly, ev = (c, x) => c.reduce((a, k, i) => a + k * x ** i, 0), r = x => ev(num, x) / ev(den, x);
      const big = r(1e5), nd = num.length - 1, k = den.length - 1;
      const relOk = { less: nd < k, equal: nd === k, greater: nd > k }[p.values.rel];
      if (!relOk) errs.push(`${w}: the degree comparison is wrong`);
      const opt = pick(S.ha), y = yOpt(opt);
      if (nd > k) { if (!/no horizontal/.test(opt) || Math.abs(big) < 1e3) errs.push(`${w}: there is no horizontal asymptote here`); }
      else if (y === null || !close(big, y, 1e-3, 1e-3)) errs.push(`${w}: the horizontal asymptote is wrong`);
      const L = limOf(pick(S.lim));
      if (nd > k ? L !== Math.sign(big) * Infinity : !close(L, big, 1e-3, 1e-3)) errs.push(`${w}: the limit at ∞ is wrong`);
    } else if (p.type === 'rzeros') {
      const zeros = [-4, -3, -2, -1, 0, 1, 2, 3, 4].filter(x => Number.isFinite(evalSpec(spec, x)) && evalSpec(spec, x) === 0);
      if (zeros.length !== 1 || S.zero.cell.answer !== zeros[0]) errs.push(`${w}: the zero is wrong`);
      const iv = /^\$\((-?[\d.]+|-\\infty), (-?[\d.]+|\\infty)\)\$$/.exec(pick(S.sign));
      const lo = iv[1] === '-\\infty' ? -1e3 : Number(iv[1]), hi = iv[2] === '\\infty' ? 1e3 : Number(iv[2]);
      const want = /positive/.test(S.sign.label) ? 1 : -1;
      for (let i = 1; i < 20; i++) { const x = lo + (hi - lo) * i / 20, v = evalSpec(spec, x); if (Number.isFinite(v) && Math.sign(v) !== want) { errs.push(`${w}: the sign on the chosen interval is wrong`); break; } }
      const h = p.values.h;
      if (!/hole/.test(pick(S.at)) || Number.isFinite(evalSpec(spec, h)) || !Number.isFinite(near(spec, h, 1e-6))) errs.push(`${w}: the canceled factor is not a hole`);
    } else if (p.type === 'va') {
      const x0 = S.x.cell.answer, L = near(spec, x0, -1e-6), Rv = near(spec, x0, 1e-6);
      if (!(Math.abs(L) > 1e4 && Math.abs(Rv) > 1e4)) errs.push(`${w}: x = ${x0} is not a vertical asymptote`);
      if (limOf(pick(S.left)) !== Math.sign(L) * Infinity) errs.push(`${w}: the left limit is wrong`);
      if (limOf(pick(S.right)) !== Math.sign(Rv) * Infinity) errs.push(`${w}: the right limit is wrong`);
    } else if (p.type === 'hole') {
      const h = S.hx.cell.answer;
      if (Number.isFinite(evalSpec(spec, h)) || !Number.isFinite(near(spec, h, 1e-6))) errs.push(`${w}: x = ${h} is not a hole`);
      const y = (near(spec, h, 1e-7) + near(spec, h, -1e-7)) / 2;
      if (!close(S.hy.cell.answer, y, 1e-5, 1e-6)) errs.push(`${w}: the hole's height is wrong`);
      const v = S.va.cell.answer;
      if (Math.abs(near(spec, v, 1e-6)) < 1e4) errs.push(`${w}: x = ${v} is not a vertical asymptote`);
    } else errs.push(`${w}: unknown kind ${p.type}`);
  };
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), recheck);
  return errs;
}
