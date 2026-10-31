/* Validator for precalculus/data/tools/polar-graphs.json (Polar graphs), run by
   scripts/check-apprecalc-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems.

   1. The frame, each context's kind, the Explore curve list.
   2. The Explore curves: on every piece the model reports, r keeps the
      sign it claims and |r| moves the way it claims (a fine grid of its
      own formula, written here); every sign change of r and every turn of
      r on a grid falls on a break.
   3. 300 seeded problems per context (_drills.mjs sweep), every key
      recomputed here with this file's own r(θ) and its own trig: the
      rectangular and polar coordinates, the quadrant, r at an angle, the
      greatest |r| on a grid, the petal count from the distinct petal tips,
      the loop from the sign of r, the average rate of change, and the
      direction of |r| on the interval. No calculus wording anywhere. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const KINDS = ['convert', 'graph', 'rates'];
const PI = Math.PI, TAU = 2 * PI;
const strip = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<span class="sr-only">[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/−/g, '-');
const CALC = [/\b(increasing|decreasing) at an? (increasing|decreasing) rate\b/i, /\bderivatives?\b/i, /\binstantaneous rate\b/i];
/* r(θ) from a spec, written independently of the model. */
export function rOf(spec) {
  const t = spec.trig || 'cos', T = t === 'sin' ? Math.sin : t === 'const' ? () => 1 : Math.cos;
  if (spec.fam === 'rose') return th => spec.a * T(spec.n * th);
  if (spec.fam === 'limacon') return th => spec.a + spec.b * T(th);
  return th => spec.a * T(th);
}
/* Petals as the number of distinct tips (local maxima of |r| > 0 at distinct points). */
function petals(f) {
  const N = 7200, tips = [];
  for (let i = 0; i < N; i++) {
    const th = TAU * i / N, a = Math.abs(f(th - TAU / N)), b = Math.abs(f(th)), c = Math.abs(f(th + TAU / N));
    if (b > 1e-6 && b >= a && b > c) {
      const p = [f(th) * Math.cos(th), f(th) * Math.sin(th)];
      if (!tips.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-3)) tips.push(p);
    }
  }
  return tips.length;
}
function wordProblems(p, w, errs) {
  const text = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || []), ...((s.cell && s.cell.mistakes) || []).map(m => m.why)])].map(strip).join(' ');
  for (const re of CALC) if (re.test(text)) errs.push(`${w}: calculus wording (${re})`);
}

export function curveProblems(model) {
  const errs = [];
  const specs = model.ORDER.map(id => model.PRESETS[id].spec).concat(model.RATE_SPECS, [{ fam: 'circle', a: 3, trig: 'sin' }, { fam: 'circle', a: 2, trig: 'const' }, { fam: 'rose', a: 2, n: 4, trig: 'sin' }, { fam: 'limacon', a: 4, b: -1, trig: 'sin' }]);
  for (const spec of specs) {
    const c = model.curve(spec), f = rOf(spec), w = `curve ${c.tex}`;
    for (let i = 0; i <= 40; i++) { const th = TAU * i / 40; if (!close(c.f(th), f(th), 1e-12, 1e-12)) { errs.push(`${w}: r(${th}) disagrees`); break; } }
    for (const pc of model.pieces(c)) {
      const n = 200;
      for (let i = 1; i < n; i++) {
        const t0 = pc.a + (pc.b - pc.a) * (i - 1) / n, t1 = pc.a + (pc.b - pc.a) * i / n;
        if (pc.rs && Math.sign(f(t1)) !== pc.rs && Math.abs(f(t1)) > 1e-9) { errs.push(`${w}: on [${pc.a}, ${pc.b}] r is said to have sign ${pc.rs}`); break; }
        const d = Math.abs(f(t1)) - Math.abs(f(t0));
        if (pc.dist === 'away' && d < -1e-9 || pc.dist === 'toward' && d > 1e-9 || pc.dist === 'steady' && Math.abs(d) > 1e-9) { errs.push(`${w}: on [${pc.a}, ${pc.b}] the distance is said to be ${pc.dist}`); break; }
      }
    }
    // every sign change of r and every turn of r is a break
    const nb = 4000;
    for (let i = 1; i < nb - 1; i++) {
      const a = f(TAU * (i - 1) / nb), b = f(TAU * i / nb), cc = f(TAU * (i + 1) / nb), th = TAU * i / nb;
      const turn = (b - a) * (cc - b) < 0 && Math.abs(cc - a) > 1e-9, cross = a * cc < 0;
      if ((turn || cross) && !c.breaks.some(x => Math.abs(x - th) < TAU / nb * 1.5)) { errs.push(`${w}: r ${turn ? 'turns' : 'changes sign'} near θ = ${th.toFixed(4)}, not a break`); break; }
    }
    let mx = 0; for (let i = 0; i <= 20000; i++) mx = Math.max(mx, Math.abs(f(TAU * i / 20000)));
    if (!close(c.maxR, mx, 1e-6, 1e-6)) errs.push(`${w}: greatest |r| ${c.maxR}, a grid finds ${mx}`);
  }
  // conversions both ways
  for (const [x, y] of [[1, 1], [-2, 3], [-1, -4], [3, -2], [0, 2], [-5, 0]]) {
    const [r, t] = model.polar(x, y), back = model.rect(r, t);
    if (!(r >= 0 && t >= 0 && t < TAU) || !close(back[0], x, 1e-9, 1e-9) || !close(back[1], y, 1e-9, 1e-9)) errs.push(`polar(${x}, ${y}) does not convert back`);
  }
  for (let k = 0; k < 24; k++) {
    const e = model.cosExact(k);
    if ((k % 2 === 0 || k % 3 === 0) && !(e && close(model.eVal(e), Math.cos(k * PI / 12), 1e-12, 1e-12))) errs.push(`cos(${k}π/12) exact value is wrong`);
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'polar-graphs', 'simulator', map, errs);
  const { M, model } = runtime('polar-graphs');
  if (!model) { errs.push('the model ApPrecalcMath.polarGraphs is not registered (precalculus/assets/tools/math/polar-graphs.js)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub: build it before adding data (docs/apprecalc-briefs/t4.md)'); return errs; }
  for (const c of data.contexts || []) if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind must be one of ${KINDS.join(', ')}`);
  for (const id of data.curves || []) if (!model.PRESETS[id]) errs.push(`curves: unknown curve "${id}"`);
  for (const k of ['intro', 'howItWorks']) for (const re of CALC) if (re.test(strip(data[k] || ''))) errs.push(`${k}: calculus wording (${re})`);
  errs.push(...curveProblems(model));

  const S = (p, k) => p.steps.find(s => s.key === k), ans = (p, k) => S(p, k).cell.answer, opt0 = (p, k) => strip(S(p, k).options[0]), tight = t => t.replace(/\s+/g, '');
  const QN = ['', 'Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'];
  const quad = (x, y) => Math.abs(x) < 1e-9 || Math.abs(y) < 1e-9 ? 0 : x > 0 ? (y > 0 ? 1 : 4) : (y > 0 ? 2 : 3);
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const v = p.values;
    if (p.topic !== c.topic) errs.push(`${w}: topic ${p.topic}, context says ${c.topic}`);
    for (const s of p.steps) if (s.kind === 'choice' && s.correct !== 0) errs.push(`${w}: step ${s.key} key is not the first option`);
    wordProblems(p, w, errs);
    if (p.type === 'convert') {
      const th = v.k * PI / 12;
      if (p.variant === 'toRect') {
        const x = v.r * Math.cos(th), y = v.r * Math.sin(th);
        if (!close(ans(p, 'x'), x, 1e-9, 1e-9) || !close(ans(p, 'y'), y, 1e-9, 1e-9)) errs.push(`${w}: (x, y) keyed (${ans(p, 'x')}, ${ans(p, 'y')}), recomputed (${x}, ${y})`);
        if (!opt0(p, 'quad').startsWith(QN[quad(x, y)]) || opt0(p, 'quad') !== QN[quad(x, y)]) errs.push(`${w}: quadrant key "${opt0(p, 'quad')}", the point is in ${QN[quad(x, y)]}`);
      } else {
        const r = Math.hypot(v.x, v.y); let t = Math.atan2(v.y, v.x); if (t < 0) t += TAU;
        if (!close(ans(p, 'r'), r, 1e-9, 1e-9) || !close(ans(p, 't'), t, 1e-9, 1e-9)) errs.push(`${w}: (r, θ) keyed (${ans(p, 'r')}, ${ans(p, 't')}), recomputed (${r}, ${t})`);
        if (!(ans(p, 't') >= 0 && ans(p, 't') < TAU)) errs.push(`${w}: θ outside [0, 2π)`);
      }
    }
    if (p.type === 'graph') {
      const f = rOf(v.spec), th = v.k * PI / 12;
      if (!close(ans(p, 'r'), f(th), 1e-9, 1e-9)) errs.push(`${w}: r(${th}) keyed ${ans(p, 'r')}, recomputed ${f(th)}`);
      let mx = 0, mn = Infinity, neg = false; for (let i = 0; i <= 20000; i++) { const y = f(TAU * i / 20000); mx = Math.max(mx, Math.abs(y)); mn = Math.min(mn, Math.abs(y)); if (y < -1e-9) neg = true; }
      if (!close(ans(p, 'max'), mx, 1e-6, 1e-6)) errs.push(`${w}: greatest distance keyed ${ans(p, 'max')}, a grid finds ${mx}`);
      const shape = opt0(p, 'shape');
      if (v.spec.fam === 'rose') { const P = petals(f); if (shape !== `A rose with ${P} petals`) errs.push(`${w}: shape key "${shape}", the curve has ${P} petal tips`); }
      else if (v.spec.fam === 'limacon') {
        const want = neg ? 'A limaçon with an inner loop' : mn < 1e-6 ? 'A cardioid' : 'A limaçon without an inner loop';
        if (shape !== want) errs.push(`${w}: shape key "${shape}", r says "${want}"`);
      } else {
        // a circle: every point is |a|/2 from the centre
        const cx = v.spec.trig === 'cos' ? v.spec.a / 2 : 0, cy = v.spec.trig === 'sin' ? v.spec.a / 2 : 0;
        for (let i = 0; i < 30; i++) { const t = TAU * i / 30, d = Math.hypot(f(t) * Math.cos(t) - cx, f(t) * Math.sin(t) - cy); if (!close(d, Math.abs(v.spec.a) / 2, 1e-9, 1e-9)) { errs.push(`${w}: not a circle about (${cx}, ${cy})`); break; } }
        if (!/^A circle of diameter/.test(shape) || !tight(shape).includes(`(${cx === 0 ? 0 : model.n(cx)},${cy === 0 ? 0 : model.n(cy)})`)) errs.push(`${w}: shape key "${shape}"`);
      }
    }
    if (p.type === 'rates') {
      const f = rOf(v.spec), t1 = v.k1 * PI / 12, t2 = v.k2 * PI / 12, avg = (f(t2) - f(t1)) / (t2 - t1);
      if (!close(ans(p, 'avg'), avg, 1e-9, 1e-9)) errs.push(`${w}: average rate keyed ${ans(p, 'avg')}, recomputed ${avg}`);
      let pos = true, negv = true, up = true, down = true, away = true, toward = true;
      for (let i = 0; i <= 200; i++) {
        const a = t1 + (t2 - t1) * i / 200, b = t1 + (t2 - t1) * (i + 1) / 200, ra = f(a), rb = f(b);
        if (i > 0 && i < 200) { if (ra <= 1e-12) pos = false; if (ra >= -1e-12) negv = false; }
        if (i < 200) { if (rb < ra - 1e-12) up = false; if (rb > ra + 1e-12) down = false; if (Math.abs(rb) < Math.abs(ra) - 1e-12) away = false; if (Math.abs(rb) > Math.abs(ra) + 1e-12) toward = false; }
      }
      if (!(pos || negv) || !(up || down) || !(away || toward)) errs.push(`${w}: on [${t1}, ${t2}] r changes sign or turns: the interval is not one piece`);
      const reason = opt0(p, 'reason');
      if (!tight(reason).includes(pos ? 'r>0' : 'r<0') || !reason.includes(up ? 'is increasing' : 'is decreasing')) errs.push(`${w}: reason key "${reason}", r is ${pos ? 'positive' : 'negative'} and ${up ? 'increasing' : 'decreasing'}`);
      if (opt0(p, 'dist') !== (away ? 'Increasing' : 'Decreasing')) errs.push(`${w}: distance key "${opt0(p, 'dist')}", |r| goes from ${Math.abs(f(t1))} to ${Math.abs(f(t2))}`);
      if (!close(p.fig.r1, f(t1), 1e-9, 1e-9) || !close(p.fig.r2, f(t2), 1e-9, 1e-9)) errs.push(`${w}: the figure's end points disagree with r`);
    }
  });
  return errs;
}
