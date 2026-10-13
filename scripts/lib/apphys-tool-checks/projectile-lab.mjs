/* Validator for physics/data/tools/projectile-lab.json (Projectile lab), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.

   The frame, the stated g, then 300 seeded problems per context from
   ApPhysMath.projectileLab.generate (_drills.mjs sweep). Every key is
   recomputed here from the givens without the model: components by cos and
   sin, the time of flight by stepping y(t) = h + v sinθ t − ½gt² until it
   reaches the ground (bisection, not the quadratic formula the model uses),
   ranges and heights from that time, "which lands first" by comparing the
   two stepped times, and the frames by adding the cart's velocity. */
import { runtime } from './_shared.mjs';
import { frame, sweep, close } from './_drills.mjs';

const KINDS = ['components', 'flight', 'range', 'maxh', 'first', 'vxconst', 'relative'];
const TOPIC = { components: 'motion-2d', flight: 'motion-2d', range: 'motion-2d', maxh: 'motion-2d', first: 'motion-2d', vxconst: 'motion-2d', relative: 'reference-frames' };
const rad = d => d * Math.PI / 180;

/* Time to reach y = 0, by bisection on the rising-then-falling y(t). */
function landTime(v, deg, h, g) {
  const vy = v * Math.sin(rad(deg)), y = t => h + vy * t - g * t * t / 2;
  let lo = Math.max(0, vy / g), hi = lo + 1;
  while (y(hi) > 0) hi *= 2;
  for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (y(m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
/* Highest y: sample finely, then refine around the best sample. */
function topY(v, deg, h, g) {
  const vy = v * Math.sin(rad(deg));
  if (vy <= 0) return h;
  let best = h; const T = landTime(v, deg, h, g);
  for (let k = 0; k <= 20000; k++) { const t = T * k / 20000; best = Math.max(best, h + vy * t - g * t * t / 2); }
  return best;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'projectile-lab', 'simulator', map, errs);
  const { model } = runtime('projectile-lab');
  if (!model || typeof model.generate !== 'function') { errs.push('physics/assets/tools/math/projectile-lab.js does not register ApPhysMath.projectileLab with a generate()'); return errs; }
  if (data.g !== 9.8 && data.g !== 10) errs.push('state the explorer\'s g (9.8 or 10)');
  for (const c of data.contexts || []) {
    if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind must be one of ${KINDS.join(', ')}`);
    else if (c.topic !== TOPIC[c.kind]) errs.push(`context ${c.id}: a ${c.kind} problem belongs to topic ${TOPIC[c.kind]}, not ${c.topic}`);
    if (c.g !== 9.8 && c.g !== 10) errs.push(`context ${c.id}: state g (9.8 or 10)`);
  }
  // The model against first principles on a few launches.
  for (const [v, a, h, g] of [[20, 30, 0, 9.8], [12, 0, 45, 9.8], [15, -20, 10, 10], [9, 75, 3, 9.8]]) {
    const L = model.launch({ v, angle: a, h, g }), T = landTime(v, a, h, g);
    if (!close(L.T, T, 1e-7)) errs.push(`model: time of flight ${L.T} for ${v} m/s at ${a}° from ${h} m, stepped ${T}`);
    if (!close(L.R, v * Math.cos(rad(a)) * T, 1e-7)) errs.push(`model: range disagrees for ${v} m/s at ${a}°`);
    if (!close(L.H, topY(v, a, h, g), 1e-6)) errs.push(`model: highest point disagrees for ${v} m/s at ${a}°`);
    const q = L.at(T / 3);
    if (!close(q.vx, L.vx, 1e-12)) errs.push('model: v_x changes during the flight');
  }

  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const step = k => p.steps.find(s => s.key === k);
    const v = p.values || {}, g = c.g;
    if (p.topic !== c.topic) errs.push(`${w}: topic ${p.topic}, context says ${c.topic}`);
    if (v.g !== g || !p.text.includes(`g = ${g} m/s²`)) errs.push(`${w}: the text must state g = ${g} m/s²`);
    if (!/air resistance/.test(p.text)) errs.push(`${w}: say there is no air resistance`);
    const show = x => { if (!p.text.includes(String(x))) errs.push(`${w}: the text does not show ${x}`); };
    if (p.type === 'components') {
      if (!close(step('vx').cell.answer, v.v * Math.cos(rad(v.angle)), 1e-9) || !close(step('vy').cell.answer, v.v * Math.sin(rad(v.angle)), 1e-9)) errs.push(`${w}: components disagree`);
      show(`${v.angle}°`);
    }
    if (p.type === 'flight') {
      const T = landTime(v.u, 0, v.h, g);
      if (!close(step('t').cell.answer, T, 1e-7)) errs.push(`${w}: fall time ${step('t').cell.answer}, stepped ${T}`);
      if (!close(step('x').cell.answer, v.u * T, 1e-7)) errs.push(`${w}: distance disagrees`);
      if (step('faster').correct !== 0) errs.push(`${w}: the fall time does not depend on the horizontal speed`);
    }
    if (p.type === 'range') {
      const T = landTime(v.v, v.angle, 0, g);
      if (!close(step('t').cell.answer, T, 1e-7)) errs.push(`${w}: time of flight disagrees`);
      if (!close(step('R').cell.answer, v.v * Math.cos(rad(v.angle)) * T, 1e-7)) errs.push(`${w}: range disagrees`);
      const s = step('same'), comp = 90 - v.angle, Rk = ang => v.v * Math.cos(rad(ang)) * landTime(v.v, ang, 0, g);
      if (s.options[s.correct] !== `${comp}°` || !close(Rk(comp), Rk(v.angle), 1e-6)) errs.push(`${w}: the complementary angle is not keyed or not equal in range`);
      for (const o of s.options) { const a = parseFloat(o); if (o !== `${comp}°` && /°$/.test(o) && a > 0 && a < 90 && close(Rk(a), Rk(v.angle), 1e-3)) errs.push(`${w}: a distractor angle gives the same range`); }
    }
    if (p.type === 'maxh') {
      const vy = v.v * Math.sin(rad(v.angle));
      if (!close(step('vy').cell.answer, vy, 1e-9)) errs.push(`${w}: v_y disagrees`);
      if (!close(step('ttop').cell.answer, vy / g, 1e-9)) errs.push(`${w}: time to the top disagrees`);
      if (!close(step('H').cell.answer, topY(v.v, v.angle, v.h, g), 1e-5)) errs.push(`${w}: highest point ${step('H').cell.answer}, sampled ${topY(v.v, v.angle, v.h, g)}`);
    }
    if (p.type === 'first') {
      const TA = landTime(v.A.v, v.A.angle, v.h, g), TB = landTime(v.B.v, v.B.angle, v.h, g);
      const key = Math.abs(TA - TB) < 1e-6 ? 2 : TA < TB ? 0 : 1;
      if (step('which').correct !== key) errs.push(`${w}: which lands first keyed ${step('which').correct}, stepped ${key}`);
      if (!close(step('t').cell.answer, TB, 1e-7)) errs.push(`${w}: B's time disagrees`);
    }
    if (p.type === 'vxconst') {
      if (!close(step('vx').cell.answer, v.v * Math.cos(rad(v.angle)), 1e-9)) errs.push(`${w}: v_x disagrees`);
      if (!close(step('vy').cell.answer, v.v * Math.sin(rad(v.angle)) - g * v.tq, 1e-9, 1e-9)) errs.push(`${w}: v_y disagrees`);
      if (!(v.tq > 0 && v.tq < landTime(v.v, v.angle, v.h, g))) errs.push(`${w}: the asked time is not during the flight`);
      if (!p.steps.some(s => s.label.includes(v.tq.toFixed(1) + ' s'))) errs.push(`${w}: the label does not show the time asked`);
    }
    if (p.type === 'relative') {
      const T = 2 * v.w / g;
      if (!close(step('vxg').cell.answer, v.u + 0, 1e-12)) errs.push(`${w}: ground-frame v_x is the cart's velocity plus 0`);
      if (!close(step('t').cell.answer, T, 1e-9)) errs.push(`${w}: time up and back disagrees`);
      if (!close(step('D').cell.answer, v.u * T, 1e-9)) errs.push(`${w}: ground distance disagrees`);
      if (step('land').correct !== 0) errs.push(`${w}: the ball lands back on the cart`);
    }
    for (const s of p.steps) if (s.kind === 'num' && !['m', 'm/s', 's'].includes(s.unit)) errs.push(`${w}: step ${s.key} unit "${s.unit}"`);
    if (p.fig && !p.fig.cart && !(p.fig.v >= 0 && Number.isFinite(p.fig.angle))) errs.push(`${w}: the figure has no launch`);
  }, c => [c.kind]);
  return errs;
}
