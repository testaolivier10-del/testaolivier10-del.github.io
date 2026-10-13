/* Validator for physics/data/tools/motion-graphs.json (Motion graphs), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.

   The frame (slug, kind, topics), the Match targets (inside the track and
   the 10 s window, a reachable speed), then 300 seeded problems per context
   from ApPhysMath.motionGraphs.generate (_drills.mjs sweep), each key
   recomputed here from the numbers the problem was built from, without the
   model's helpers: slopes by rise over run, areas by trapezoids split at
   v = 0, a-t steps from v-t slopes, the sign rules for speeding up and
   slowing down, the toss by v₀/g and v₀²/2g. */
import { runtime } from './_shared.mjs';
import { frame, sweep, close } from './_drills.mjs';

const KINDS = ['slope', 'area', 'pick', 'describe', 'turn', 'signs', 'dist'];
const TOPIC = { slope: 'motion-representations', area: 'motion-representations', pick: 'motion-representations', describe: 'motion-representations', turn: 'motion-representations', signs: 'motion-quantities', dist: 'scalars-vectors' };

/* Exact signed (or absolute) area under straight segments. */
function area(pts, t0, t1, abs) {
  let s = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ta, ya] = pts[i], [tb, yb] = pts[i + 1];
    const a = Math.max(t0, ta), b = Math.min(t1, tb);
    if (b <= a) continue;
    const f = t => ya + (yb - ya) * (t - ta) / (tb - ta);
    const n = 2000; // midpoint sums, independent of the model's closed form
    for (let k = 0; k < n; k++) { const y = f(a + (b - a) * (k + 0.5) / n); s += (abs ? Math.abs(y) : y) * (b - a) / n; }
  }
  return s;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'motion-graphs', 'simulator', map, errs);
  const { M, model } = runtime('motion-graphs');
  if (!model || typeof model.generate !== 'function') { errs.push('physics/assets/tools/math/motion-graphs.js does not register ApPhysMath.motionGraphs with a generate()'); return errs; }

  for (const c of data.contexts || []) {
    if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind must be one of ${KINDS.join(', ')}`);
    else if (c.topic !== TOPIC[c.kind]) errs.push(`context ${c.id}: a ${c.kind} problem belongs to topic ${TOPIC[c.kind]}, not ${c.topic}`);
    if (c.kind === 'turn' && c.g !== 9.8 && c.g !== 10) errs.push(`context ${c.id}: state g (9.8 or 10)`);
  }
  // Match targets: reachable on the 10 m track in the 10 s window.
  const ids = new Set();
  for (const t of data.targets || []) {
    const w = `target ${t.id}`;
    if (!t.id || ids.has(t.id)) errs.push(`${w}: missing or duplicate id`); ids.add(t.id);
    if (!['x', 'v'].includes(t.kind)) errs.push(`${w}: kind must be x or v`);
    if (!t.name) errs.push(`${w}: no name`);
    const p = t.pts || [];
    if (p.length < 2 || p[0][0] !== 0 || p[p.length - 1][0] !== 10) errs.push(`${w}: points must run from t = 0 to t = 10 s`);
    for (let i = 1; i < p.length; i++) if (!(p[i][0] > p[i - 1][0])) errs.push(`${w}: times must increase`);
    if (t.kind === 'x') {
      if (p.some(q => Math.abs(q[1]) > 5)) errs.push(`${w}: a position is off the track (−5 m to 5 m)`);
      for (let i = 1; i < p.length; i++) if (Math.abs((p[i][1] - p[i - 1][1]) / (p[i][0] - p[i - 1][0])) > 3) errs.push(`${w}: faster than 3 m/s is too fast to drive by hand`);
    }
    if (t.kind === 'v') {
      if (p.some(q => Math.abs(q[1]) > 3)) errs.push(`${w}: faster than 3 m/s is too fast to drive by hand`);
      const x0 = t.x0 ?? 0;
      for (let k = 0; k <= 100; k++) { const x = x0 + area(p, 0, k / 10); if (Math.abs(x) > 5 + 1e-6) { errs.push(`${w}: the cart would leave the track at t = ${k / 10} s (start it elsewhere with x0)`); break; } }
    }
  }
  if (!(data.targets || []).length) errs.push('no Match targets');

  // The model's own helpers, checked against first principles.
  const mo = model.motion(1, 2, [{ dur: 3, a: -1 }, { dur: 7, a: 0.5 }]);
  const s5 = mo.at(5), x3 = 1 + 2 * 3 - 0.5 * 9, v3 = 2 - 3;
  if (!close(s5.x, x3 + v3 * 2 + 0.25 * 4, 1e-9) || !close(s5.v, v3 + 1, 1e-9)) errs.push('model: motion() does not follow x = x₀ + v₀t + ½at² piece by piece');

  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const step = k => p.steps.find(s => s.key === k);
    const v = p.values || {};
    if (p.topic !== c.topic) errs.push(`${w}: topic ${p.topic}, context says ${c.topic}`);
    if (p.fig && p.fig.label.length < 20) errs.push(`${w}: the figure needs a text label`);
    if (p.type === 'slope') {
      const { ts, xs, k } = v, want = (xs[k + 1] - xs[k]) / (ts[k + 1] - ts[k]);
      if (!close(step('v').cell.answer, want, 1e-9)) errs.push(`${w}: slope ${step('v').cell.answer}, rise over run ${want}`);
      if (step('dir').correct !== (want > 0 ? 0 : want < 0 ? 1 : 2)) errs.push(`${w}: direction key disagrees with the slope's sign`);
      if (!p.text.includes(`t = ${ts[k]} s`) || !p.text.includes(`t = ${ts[k + 1]} s`)) errs.push(`${w}: the text does not name the segment`);
    }
    if (p.type === 'area') {
      const line = v.ts.map((t, j) => [t, v.vs[j]]);
      const d = area(line, v.t0, v.t1), dist = area(line, v.t0, v.t1, true);
      if (!close(step('dx').cell.answer, d, 1e-4, 1e-4)) errs.push(`${w}: displacement ${step('dx').cell.answer}, recomputed ${d}`);
      if (step('dist') && !close(step('dist').cell.answer, dist, 1e-4, 1e-4)) errs.push(`${w}: distance ${step('dist').cell.answer}, recomputed ${dist}`);
      if (!step('dist') && Math.abs(dist - Math.abs(d)) > 1e-3) errs.push(`${w}: the graph crosses zero but distance is not asked`);
      if (step('vav') && !close(step('vav').cell.answer, d / (v.t1 - v.t0), 1e-4, 1e-4)) errs.push(`${w}: average velocity disagrees`);
    }
    if (p.type === 'pick') {
      const a = [0, 1, 2].map(k => (v.vs[k + 1] - v.vs[k]) / 2);
      const s = step('at'), g = p.graphs[s.correct];
      if (!g || g.type !== 'steps' || g.a.some((x, k) => !close(x, a[k], 1e-12, 1e-12))) errs.push(`${w}: the keyed a-t graph is not the slopes of v-t`);
      p.graphs.forEach((gr, i) => { if (i !== s.correct && gr.type === 'steps' && gr.a.every((x, k) => close(x, a[k], 1e-12, 1e-12))) errs.push(`${w}: a distractor is also right`); });
      if (s.options.length !== p.graphs.length) errs.push(`${w}: one picture per option`);
    }
    if (p.type === 'describe') {
      const vt = v.v0 + v.a * v.tm, dir = vt > 0 ? 1 : -1, change = v.a === 0 ? 'const' : (v.a > 0) === (vt > 0) ? 'up' : 'down';
      const want = `Moving in the ${dir > 0 ? '+' : '−'} direction and ${{ up: 'speeding up', down: 'slowing down', const: 'at a steady speed' }[change]}`;
      if (step('motion').options[step('motion').correct] !== want) errs.push(`${w}: keyed "${step('motion').options[step('motion').correct]}", recomputed "${want}"`);
      if (step('motion').options.filter(o => o === want).length !== 1) errs.push(`${w}: the right description appears more than once`);
      if (step('asign').correct !== (v.a > 0 ? 0 : v.a < 0 ? 1 : 2)) errs.push(`${w}: acceleration sign key wrong`);
      if (Math.abs(vt) < 0.25) errs.push(`${w}: the marked moment is too near v = 0 to read a direction`);
    }
    if (p.type === 'signs') {
      const a = (v.vf - v.vi) / v.dt;
      if (!close(step('a').cell.answer, a, 1e-9)) errs.push(`${w}: a ${step('a').cell.answer}, recomputed ${a}`);
      if (step('dv') && !close(step('dv').cell.answer, v.vf - v.vi, 1e-9)) errs.push(`${w}: Δv disagrees`);
      if (step('vsign') && step('vsign').correct !== (v.vi > 0 ? 0 : 1)) errs.push(`${w}: velocity sign key wrong`);
      if (step('asign') && step('asign').correct !== (a > 0 ? 0 : 1)) errs.push(`${w}: acceleration sign key wrong`);
      // Speeding up iff |vf| > |vi| when there is no turn.
      if (p.variant === 'straight' && Math.sign(v.vi) === Math.sign(v.vf)) {
        const up = Math.abs(v.vf) > Math.abs(v.vi);
        if (up !== (Math.sign(a) === Math.sign(v.vi))) errs.push(`${w}: the sign rule for speeding up fails`);
        if (!p.text.includes(up ? 'speeds up' : 'slows down')) errs.push(`${w}: the text says the wrong change of speed`);
      }
    }
    if (p.type === 'turn') {
      if (p.variant === 'toss') {
        const g = c.g || 9.8;
        if (!close(step('ttop').cell.answer, v.u / g, 1e-9)) errs.push(`${w}: time to the top disagrees with v₀/g`);
        if (!close(step('h').cell.answer, v.u * v.u / (2 * g), 1e-9)) errs.push(`${w}: height disagrees with v₀²/2g`);
        if (!p.text.includes(`g = ${g}`)) errs.push(`${w}: the text must state g`);
      } else {
        const tt = -v.v0 / v.a;
        if (!close(step('tt').cell.answer, tt, 1e-9)) errs.push(`${w}: turning time disagrees`);
        if (!close(step('dx').cell.answer, area([[0, v.v0], [tt, 0]], 0, tt), 1e-4)) errs.push(`${w}: displacement to the turn disagrees`);
        if (step('aturn').correct !== 0) errs.push(`${w}: a at the turning point is the slope`);
      }
    }
    if (p.type === 'dist') {
      const disp = v.legs.reduce((s, l) => s + l.L * l.d, 0), dist = v.legs.reduce((s, l) => s + l.L, 0);
      if (!close(step('dx').cell.answer, disp, 1e-12) || !close(step('dist').cell.answer, dist, 1e-12)) errs.push(`${w}: distance or displacement disagrees`);
      for (const l of v.legs) if (!p.text.includes(`${l.L} m`)) errs.push(`${w}: the text does not show a leg`);
    }
    // Every numeric step: the unit is SI and stated.
    for (const s of p.steps) if (s.kind === 'num' && !['m', 'm/s', 'm/s²', 's'].includes(s.unit)) errs.push(`${w}: step ${s.key} unit "${s.unit}"`);
  }, c => [c.kind]);
  return errs;
}
