/* Validator for precalculus/data/tools/sinusoid-builder.json (Sinusoid builder),
   run by scripts/check-apprecalc-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems.

   1. The frame; each context's kind is a model kind on the topic that teaches it.
   2. The Explore scenes: each scene's data points lie on its own situation
      (rebuilt here as D + A cos(2pi(t - tPeak)/T) from max, min, T and the
      start), the scene's right answer is on its slider grid in both forms,
      and the model's fit() accepts it and refuses a model off by one step.
   3. 300 seeded problems per context (_drills.mjs sweep): every key against
      that independent function, sampled maxima and minima, periods measured
      from sampled peaks, two-halves secant slopes for the rate questions, the
      shift options tested by shifting the parent graph, and no calculus words. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const KINDS = { transform: 'sinusoidal-transformations', context: 'sinusoidal-modeling', points: 'sinusoidal-modeling', rate: 'sinusoidal-modeling', table: 'sinusoidal-modeling' };
const PI = Math.PI, TAU = 2 * PI;
const CALC = /derivative|instantaneous|at an? (in|de)creasing rate|\bf['′]/i;

export function optText(html) {
  const sr = /<span class="sr-only">([\s\S]*?)<\/span>/.exec(html);
  return (sr ? sr[1] : String(html).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<[^>]+>/g, '')).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/−/g, '-').replace(/\s+/g, ' ').trim();
}
/* The situation as a function, built here (not by the model): the peak time from the start. */
export function situation(s) {
  const A = (s.max - s.min) / 2, D = (s.max + s.min) / 2;
  const tPk = s.t0 + { max: 0, min: s.T / 2, up: s.T / 4, down: -s.T / 4 }[s.start];
  return { A, D, f: t => D + A * Math.cos(TAU * (t - tPk) / s.T) };
}
function sampled(f, a, b, n = 20000) {
  let mx = -Infinity, mn = Infinity; const peaks = [];
  let prev2 = f(a), prev = f(a + (b - a) / n);
  for (let i = 0; i <= n; i++) { const v = f(a + (b - a) * i / n); if (v > mx) mx = v; if (v < mn) mn = v; }
  for (let i = 2; i <= n; i++) { const x = a + (b - a) * i / n, v = f(x); if (prev > prev2 && prev >= v) peaks.push(x - (b - a) / n); prev2 = prev; prev = v; }
  return { max: mx, min: mn, period: peaks.length > 1 ? peaks[1] - peaks[0] : NaN };
}

export function sceneProblems(model) {
  const errs = [];
  for (const id of model.SORDER) {
    const sc = model.SCENES[id], g = situation(sc.s), tr = model.truth(sc.s);
    for (const q of model.sceneData(sc)) if (Math.abs(g.f(q.t) - q.y) > (sc.table ? 0.051 : 1e-9)) errs.push(`scene ${id}: data point (${q.t}, ${q.y}) is off the situation (${g.f(q.t)})`);
    if (!close(tr.A, g.A, 1e-12, 1e-12) || !close(tr.D, g.D, 1e-12, 1e-12)) errs.push(`scene ${id}: amplitude or midline is off`);
    for (const form of ['sin', 'cos']) {
      const c = form === 'sin' ? tr.sinC : tr.cosC, p = { a: tr.A, d: tr.D, T: sc.s.T, c, form };
      for (let i = 0; i <= 50; i++) { const t = 2 * sc.s.T * i / 50; if (Math.abs(model.model(p)(t) - g.f(t)) > 1e-9) { errs.push(`scene ${id}: the ${form} answer is not the situation at t = ${t}`); break; } }
      const onGrid = (k, v) => { const [lo, hi, st] = sc.sl[k]; return v >= lo - 1e-9 && v <= hi + 1e-9 && Math.abs((v - lo) / st - Math.round((v - lo) / st)) < 1e-9; };
      for (const [k, v] of [['a', p.a], ['d', p.d], ['T', p.T], ['c', p.c]]) if (!onGrid(k, v)) errs.push(`scene ${id}: the ${form} answer's ${k} = ${v} is not on its slider`);
      const tol = 0.03 * (sc.s.max - sc.s.min) + (sc.table ? 0.06 : 0);
      if (!model.fit(p, model.sceneData(sc), tol).every(Boolean)) errs.push(`scene ${id}: fit() refuses the right ${form} model`);
      if (model.fit({ ...p, d: p.d + sc.sl.d[2] * 2 }, model.sceneData(sc), tol).every(Boolean)) errs.push(`scene ${id}: fit() accepts a midline two steps off`);
    }
  }
  return errs;
}

export function recheck(model, p, ctx, w, errs, Expr) {
  const st = Object.fromEntries(p.steps.map(s => [s.key, s]));
  const num = (k, v, what, tol = 1e-9) => { const s = st[k]; if (!s) errs.push(`${w}: no step ${k}`); else if (!close(s.cell.answer, v, tol, tol)) errs.push(`${w}: ${what} is ${s.cell.answer}, expected ${v}`); };
  const right = k => optText(st[k].options[st[k].correct]);
  const allText = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || []), ...((s.cell && s.cell.mistakes) || []).map(m => m.why)])].join(' ');
  if (CALC.test(allText.replace(/<annotation[\s\S]*?<\/annotation>/g, ''))) errs.push(`${w}: calculus wording`);
  const exprSame = (k, f, a, b) => {
    const E = st[k] && st[k].cell.expr; if (!E) { errs.push(`${w}: no expression step ${k}`); return; }
    const g = Expr.fn(E.answer, E.vars);
    for (let i = 0; i <= 40; i++) { const t = a + (b - a) * i / 40; if (Math.abs(g(t) - f(t)) > 1e-9) { errs.push(`${w}: the model key ${E.answer} is not the situation at t = ${t}`); return; } }
  };
  const g = p.given;
  if (p.type === 'transform') {
    const tr = g.trig === 'sin' ? Math.sin : Math.cos, f = x => g.a * tr(g.b * (x + g.c)) + g.d, par = x => g.a * tr(g.b * x) + g.d;
    const S = sampled(f, 0, 6 * TAU / Math.abs(g.b) + 1);
    num('amp', (S.max - S.min) / 2, 'amplitude', 1e-6); num('mid', (S.max + S.min) / 2, 'midline', 1e-6); num('max', S.max, 'maximum', 1e-6);
    if (!close(st.per.cell.answer, S.period, 1e-3, 1e-3)) errs.push(`${w}: period ${st.per.cell.answer}, the peaks are ${S.period} apart`);
    st.shift.options.forEach((o, i) => {
      const t = optText(o), m = /^(.*) to the (left|right)$/.exec(t);
      if (!m) { errs.push(`${w}: shift option "${t}" does not read`); return; }
      const amt = Expr.number(m[1]), sh = m[2] === 'left' ? amt : -amt;
      let same = true; for (let k = 0; k <= 60; k++) { const x = -3 + k * 0.17; if (Math.abs(f(x) - par(x + sh)) > 1e-9) { same = false; break; } }
      if ((i === st.shift.correct) !== same) errs.push(`${w}: shift option "${t}" is marked ${i === st.shift.correct ? 'right' : 'wrong'}`);
    });
  } else if (p.type === 'context' || p.type === 'points' || p.type === 'rate') {
    const s = g.s, sit = situation(s);
    if (p.type === 'context') {
      num('a', sit.A, 'amplitude'); num('d', sit.D, 'midline'); num('b', TAU / s.T, 'b');
      if (st.T) num('T', s.T, 'period');
      exprSame('model', sit.f, 0, 2 * s.T);
      const S = sampled(sit.f, 0, 3 * s.T); if (!close(S.period, s.T, 1e-3, 1e-3)) errs.push(`${w}: the situation's period is off`);
    } else if (p.type === 'points') {
      for (const k of [g.i, g.j]) { const t = s.t0 + k * s.T / 4; num(`p${k}t`, t, `P${k} t`); num(`p${k}y`, sit.f(t), `P${k} value`); }
    } else {
      const a = s.t0 + g.k * s.T / 4, b = a + s.T / 4, m = (a + b) / 2;
      const inc = sit.f(b) > sit.f(a), r1 = (sit.f(m) - sit.f(a)) / (m - a), r2 = (sit.f(b) - sit.f(m)) / (b - m), up = r2 > r1;
      if (right('dir') !== `${g.y} is ${inc ? 'increasing' : 'decreasing'}`) errs.push(`${w}: direction option "${right('dir')}"`);
      if (right('rate') !== (up ? 'increasing' : 'decreasing')) errs.push(`${w}: rate option "${right('rate')}"`);
      if (!right('why').includes(`concave ${up ? 'up' : 'down'}`)) errs.push(`${w}: reason option "${right('why')}"`);
    }
  } else if (p.type === 'table') {
    const sit = situation(g.s);
    for (const [t, v] of g.rows) if (Math.abs(sit.f(t) - v) > 1e-6) errs.push(`${w}: table value at t = ${t} is off`);
    const vals = g.rows.map(r => r[1]), mx = Math.max(...vals), mn = Math.min(...vals);
    num('a', (mx - mn) / 2, 'amplitude'); num('d', (mx + mn) / 2, 'midline');
    const iMx = g.rows.findIndex(r => r[1] === mx), iMx2 = g.rows.findIndex((r, i) => i > iMx && r[1] === mx), iMn = g.rows.findIndex(r => r[1] === mn), iMn2 = g.rows.findIndex((r, i) => i > iMn && r[1] === mn);
    const per = iMx2 > -1 ? g.rows[iMx2][0] - g.rows[iMx][0] : iMn2 > -1 ? g.rows[iMn2][0] - g.rows[iMn][0] : 2 * Math.abs(g.rows[iMx][0] - g.rows[iMn][0]);
    num('T', per, 'period'); num('b', TAU / per, 'b');
    exprSame('model', sit.f, 0, 2 * g.s.T);
  }
}

export function check(data, map) {
  const errs = [];
  frame(data, 'sinusoid-builder', 'simulator', map, errs);
  const { model, Expr } = runtime('sinusoid-builder');
  if (!model) { errs.push('the model ApPrecalcMath.sinusoidBuilder is not registered (precalculus/assets/tools/math/sinusoid-builder.js)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub: build it before adding data (docs/apprecalc-briefs/t3.md)'); return errs; }
  for (const c of data.contexts || []) {
    if (!KINDS[c.kind]) errs.push(`context ${c.id}: kind "${c.kind}" is not one of ${Object.keys(KINDS).join(', ')}`);
    else if (c.topic !== KINDS[c.kind]) errs.push(`context ${c.id}: kind ${c.kind} belongs to topic ${KINDS[c.kind]} (got ${c.topic})`);
  }
  for (const k of Object.keys(KINDS)) if (!(data.contexts || []).some(c => c.kind === k)) errs.push(`no context for the kind ${k}`);
  for (const k of model.KINDS) if (!KINDS[k]) errs.push(`the model has a kind ${k} this validator does not check`);
  errs.push(...sceneProblems(model));
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(model, p, c, w, errs, Expr));
  return errs;
}
