/* Validator for calculus/data/tools/area-volume.json (Area and volume), run by
   scripts/check-apcalc-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It regenerates 300 problems per context and
   kind with the model the page runs (ApCalcMath.areaVolume) and recomputes
   every key a second way, from the region's two curves parsed by ApCalcExpr:
   limits as zeros of top minus bottom (or a boundary line the problem names),
   the integrand from the geometry (top minus bottom; radii as distances from
   the axis of rotation, larger one outer; the cross-section formula), and the
   area or volume by the shared adaptive Simpson rule, split at every crossing. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const KINDS = ['areaX', 'areaY', 'areaCross', 'crossSq', 'crossTri', 'discAxes', 'discOther', 'washerAxes', 'washerOther'];
const strip = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<[^>]+>/g, '');

export function check(data, map) {
  const errs = [];
  frame(data, 'area-volume', 'simulator', map, errs);
  const { M, model } = runtime('area-volume');
  if (!model || typeof model.generate !== 'function') { errs.push('calculus/assets/tools/math/area-volume.js does not register ApCalcMath.areaVolume with a generate()'); return errs; }
  for (const c of data.contexts || []) if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind "${c.kind}" is not one of ${KINDS.join(', ')}`);
  const recheck = (p, ctx, w) => {
    const bad = m => errs.push(`${w}: ${m}`);
    const step = k => p.steps.find(s => s.key === k);
    if (p.type !== ctx.kind) bad(`asked for ${ctx.kind}, got ${p.type}`);
    const R = p.reg, v = R.v, T = M.fn(R.top, [v]), B = M.fn(R.bot, [v]), a = R.a, b = R.b;
    if (!(a < b)) bad('limits out of order');
    // Limits: where the curves meet, or a boundary the problem names.
    const text = strip(p.text);
    for (const [k, x] of [['lo', a], ['hi', b]]) {
      const meet = Math.abs(T(x) - B(x)) < 1e-7, named = (new RegExp('(^|[^0-9.])' + String(x).replace('-', '[−-]') + '(?![0-9]|\\.[0-9])').test(text) && /line|axis/.test(text)) || (x === 0 && new RegExp((v === 'x' ? 'y' : 'x') + '-axis').test(text));
      if (!meet && !named) bad(`the ${k} limit ${x} is neither a crossing nor a named boundary`);
      const s = step(k);
      if (s && !close(s.cell.answer, x, 1e-9, 1e-9)) bad(`step ${k} keys ${s.cell.answer}, the region gives ${x}`);
    }
    // The curves must not cross strictly inside, except where the problem splits.
    const inner = M.roots(u => T(u) - B(u), a, b, 900).filter(u => u > a + 1e-6 && u < b - 1e-6);
    if (p.type !== 'areaCross' && inner.length) bad(`the curves cross inside the region at ${inner.map(u => u.toFixed(4))}`);
    if (p.type !== 'areaCross') { const m = (a + b) / 2; if (!(T(m) > B(m))) bad('the curve named top is not on top'); }
    const pts = [a, ...inner, b];
    const integ = g => pts.slice(1).reduce((s, q, i) => s + M.integral(g, pts[i], q, 1e-10), 0);
    const samples = [0.13, 0.37, 0.61, 0.89].map(t => a + (b - a) * t);
    const exprIs = (key, want, name) => {
      const s = step(key); if (!s) { bad(`no step ${key}`); return; }
      const K = M.fn(s.cell.expr.answer, [v]);
      for (const u of samples) if (!close(K(u), want(u), 1e-9, 1e-9)) { bad(`${name} key "${s.cell.expr.answer}" is ${K(u)} at ${v} = ${u}, the geometry gives ${want(u)}`); return; }
    };
    if (p.type === 'areaX' || p.type === 'areaY') {
      exprIs('ig', u => T(u) - B(u), 'integrand');
      const A = integ(u => Math.abs(T(u) - B(u)));
      if (!close(step('A').cell.answer, A, 1e-7, 1e-9)) bad(`area keyed ${step('A').cell.answer}, integration gives ${A}`);
    }
    if (p.type === 'areaCross') {
      if (inner.length !== 1) bad(`expected one crossing inside, found ${inner.length}`);
      const A = integ(u => Math.abs(T(u) - B(u))), net = M.integral(u => T(u) - B(u), a, b, 1e-10);
      if (!close(step('A').cell.answer, A, 1e-7, 1e-9)) bad(`total area keyed ${step('A').cell.answer}, integration gives ${A}`);
      if (close(A, Math.abs(net), 1e-6, 1e-9)) bad('the net integral equals the area: the crossing does not matter');
      const s = step('setup'), right = strip(s.options[s.correct]);
      if (!/\+/.test(right)) bad('the keyed setup is not split at the crossing');
    }
    if (p.type === 'crossSq' || p.type === 'crossTri') {
      const shape = p.fig.shape, k = shape === 'square' ? 1 : shape === 'tri' ? Math.sqrt(3) / 4 : Math.PI / 8;
      if (!/square|equilateral|semicircle/.test(text) || !new RegExp(shape === 'square' ? 'square' : shape === 'tri' ? 'equilateral' : 'semicircle').test(text)) bad('the text does not name the cross section that was keyed');
      exprIs('side', u => T(u) - B(u), 'side');
      exprIs('Ax', u => k * (T(u) - B(u)) ** 2, 'cross-section area');
      const V = integ(u => k * (T(u) - B(u)) ** 2);
      if (!close(step('V').cell.answer, V, 1e-7, 1e-9)) bad(`volume keyed ${step('V').cell.answer}, integration gives ${V}`);
    }
    if (/^disc|^washer/.test(p.type)) {
      const ax = p.axis, k = ax.at;
      if ((ax.dir === 'h') !== (v === 'x')) bad('discs and washers must slice across the axis');
      const dist = u => [Math.abs(T(u) - k), Math.abs(B(u) - k)];
      const Rr = u => Math.max(...dist(u)), rr = u => Math.min(...dist(u));
      // the axis does not cut the region
      for (const u of samples) if ((T(u) - k) * (B(u) - k) < -1e-12) bad('the axis of rotation cuts through the region');
      exprIs('R', Rr, 'outer radius');
      const washer = integ(rr) > 1e-9;
      if (washer !== !!p.washer) bad(`keyed as ${p.washer ? 'washers' : 'discs'}, the geometry says ${washer ? 'washers' : 'discs'}`);
      if (/^disc/.test(p.type) && washer) bad('a disc problem has a hole');
      if (/^washer/.test(p.type) && !washer) bad('a washer problem has no hole');
      exprIs('ig', u => Math.PI * (Rr(u) ** 2 - rr(u) ** 2), 'integrand');
      const V = Math.PI * integ(u => Rr(u) ** 2 - rr(u) ** 2);
      if (!close(step('V').cell.answer, V, 1e-7, 1e-9)) bad(`volume keyed ${step('V').cell.answer}, integration gives ${V}`);
      const line = ax.dir === 'h' ? (k === 0 ? /x-axis/ : new RegExp('y\\s*=\\s*' + String(k).replace('-', '[−-]'))) : (k === 0 ? /y-axis/ : new RegExp('x\\s*=\\s*' + String(k).replace('-', '[−-]')));
      if (!line.test(text)) bad(`the text does not name the axis ${ax.dir === 'h' ? 'y' : 'x'} = ${k}`);
      if (/Other$/.test(p.type) && k === 0) bad('an "other line" problem uses an axis');
      if (/Axes$/.test(p.type) && k !== 0) bad('an "axes" problem uses another line');
      // The named slips really are slips.
      const igm = step('ig').cell.expr.mistakes.map(m => m.why);
      if (!igm.some(t => /Missing π/.test(t))) bad('no "missing π" miss on the integrand');
      if (washer && !igm.some(t => /\(R − r\)²/.test(t))) bad('no "(R − r)²" miss on a washer');
      if (k !== 0 && !igm.some(t => /measured from the/.test(t))) bad('no "radius from the wrong axis" miss');
    }
  };
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), recheck);
  return errs;
}
