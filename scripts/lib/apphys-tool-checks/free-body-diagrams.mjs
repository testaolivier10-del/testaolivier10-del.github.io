/* Validator for physics/data/tools/free-body-diagrams.json (Free-body diagrams), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. For every context and every scene it lists,
   300 seeded problems are generated with the code students run
   (ApPhysMath.freeBodyDiagrams.generate) and checked against physics worked
   out again here, independently of the model:
     - the key's forces: the right set of (type, agent), each size and
       direction from first principles, and ΣF = ma on the object;
     - the number asked for, recomputed from the problem's parameters;
     - the law step: four distinct options, the right one first, one reason each;
     - the grader: the key drawn to scale is graded right, and each planted
       miss is caught and named (net, centripetal and "motion" forces, a force
       with no agent, a missing force, a reversed direction, a third-law
       partner, a tail off the object, a length that contradicts the motion). */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const RHO_W = 1000;
const rad = d => d * Math.PI / 180;
const norm = a => ((a % 360) + 360) % 360;
const adiff = (a, b) => { const d = Math.abs(norm(a) - norm(b)); return d > 180 ? 360 - d : d; };

/* The forces on the object and its acceleration, from the problem's
   parameters, written out per scene (y up, angles from +x). */
export function physics(scene, p, g) {
  const F = (type, agent, mag, ang) => ({ type, agent, mag, ang: norm(ang) });
  const out = [], a = { x: 0, y: 0 };
  if (scene === 'table') { const W = p.m * g; out.push(F('grav', 'Earth', W, 270), F('normal', 'table', W + (p.push || 0), 90)); if (p.push) out.push(F('applied', 'hand', p.push, 270)); }
  else if (scene === 'hang1') { out.push(F('grav', 'Earth', p.m * g, 270), F('tension', 'rope', p.m * g + p.m * p.a, 90)); a.y = p.a; }
  else if (scene === 'hang2') {
    // Solve the 2×2 system T1(−cos α, sin α) + T2(cos β, sin β) = (0, mg) by Cramer's rule.
    const W = p.m * g, a11 = -Math.cos(rad(p.al)), a12 = Math.cos(rad(p.be)), a21 = Math.sin(rad(p.al)), a22 = Math.sin(rad(p.be)), det = a11 * a22 - a12 * a21;
    out.push(F('grav', 'Earth', W, 270), F('tension', 'left rope', (0 * a22 - a12 * W) / det, 180 - p.al), F('tension', 'right rope', (a11 * W - a21 * 0) / det, p.be));
  } else if (scene === 'incline') {
    const W = p.m * g; out.push(F('grav', 'Earth', W, 270), F('normal', 'ramp', W * Math.cos(rad(p.th)), 90 - p.th));
    a.x = g * Math.sin(rad(p.th)) * Math.cos(rad(p.th)); a.y = -g * Math.sin(rad(p.th)) * Math.sin(rad(p.th));
  } else if (scene === 'rough') {
    const W = p.m * g, Nn = W * Math.cos(rad(p.th)), down = W * Math.sin(rad(p.th));
    out.push(F('grav', 'Earth', W, 270), F('normal', 'ramp', Nn, 90 - p.th));
    let along; // acceleration down the ramp
    if (p.start === 'up') { out.push(F('fk', 'ramp', p.muk * Nn, -p.th)); along = (down + p.muk * Nn) / p.m; }
    else if (down <= p.mus * Nn) { out.push(F('fs', 'ramp', down, 180 - p.th)); along = 0; }
    else { out.push(F('fk', 'ramp', p.muk * Nn, 180 - p.th)); along = (down - p.muk * Nn) / p.m; }
    a.x = along * Math.cos(rad(p.th)); a.y = -along * Math.sin(rad(p.th));
  } else if (scene === 'crate') {
    const W = p.m * g, pull = p.mode === 'pull', s = Math.sin(rad(p.phi)), c = Math.cos(rad(p.phi));
    const Nn = pull ? W - p.F * s : W + p.F * s;
    out.push(F('grav', 'Earth', W, 270), F('normal', 'floor', Nn, 90), pull ? F('tension', 'rope', p.F, p.phi) : F('applied', 'person', p.F, -p.phi));
    if (p.F * c <= p.mus * Nn) out.push(F('fs', 'floor', p.F * c, 180));
    else { out.push(F('fk', 'floor', p.muk * Nn, 180)); a.x = (p.F * c - p.muk * Nn) / p.m; }
  } else if (scene === 'elevator') { out.push(F('grav', 'Earth', p.m * g, 270), F('normal', 'floor', p.m * (g + p.a), 90)); a.y = p.a; }
  else if (scene === 'atwood') {
    const m1 = p.m1, m2 = p.m2, aa = (m2 - m1) * g / (m1 + m2), T = m1 * (g + aa), me = p.which === 2 ? m2 : m1;
    out.push(F('grav', 'Earth', me * g, 270), F('tension', 'rope', T, 90)); a.y = p.which === 2 ? -aa : aa;
  } else if (scene === 'car') {
    const W = p.m * g, need = p.m * p.v * p.v / p.r;
    out.push(F('grav', 'Earth', W, 270), F('normal', 'road', W, 90), F('fs', 'road', Math.min(need, p.mus * W), 180)); a.x = -Math.min(need, p.mus * W) / p.m;
  } else if (scene === 'spring') {
    out.push(F('grav', 'Earth', p.m * g, 270), F('normal', 'track', p.m * g, 90), F('spring', 'spring', p.k * Math.abs(p.x), p.x > 0 ? 180 : 0)); a.x = -p.k * p.x / p.m;
  } else if (scene === 'water') {
    const m = p.rho * p.V, W = m * g, sub = Math.min(1, p.rho / RHO_W), Fb = RHO_W * sub * p.V * g;
    out.push(F('grav', 'Earth', W, 270), F('buoy', 'water', Fb, 90));
    if (p.rho > RHO_W) { if (p.held) out.push(F('tension', 'string', W - Fb, 90)); else a.y = -(W - Fb) / m; }
  }
  const m = scene === 'water' ? p.rho * p.V : scene === 'atwood' ? (p.which === 2 ? p.m2 : p.m1) : p.m;
  return { forces: out, a, m };
}

/* The number the problem asks for, from the parameters. */
export function answer(pr) {
  const p = pr.params, g = pr.g, s = pr.scene, ask = pr.ask, f = physics(s, p, g), by = t => f.forces.find(x => x.type === t);
  const amag = Math.hypot(f.a.x, f.a.y);
  if (s === 'table') return by('normal').mag;
  if (s === 'hang1') return by('tension').mag;
  if (s === 'hang2') return f.forces.find(x => x.agent === 'left rope').mag;
  if (s === 'incline') return ask === 'a' ? amag : by('normal').mag;
  if (s === 'rough') return ask === 'fs' ? by('fs').mag : amag;
  if (s === 'crate') return ask === 'fs' ? by('fs').mag : ask === 'N' ? by('normal').mag : amag;
  if (s === 'elevator') return by('normal').mag;
  if (s === 'atwood') return ask === 'a' ? amag : by('tension').mag;
  if (s === 'car') return ask === 'fs' ? by('fs').mag : Math.sqrt(p.mus * g * p.r);
  if (s === 'spring') return ask === 'a' ? amag : by('spring').mag;
  if (s === 'water') return ask === 'Fb' ? by('buoy').mag : ask === 'T' ? by('tension').mag : amag;
  return NaN;
}

/* Planted diagrams: [name, arrows, test(result) -> true when the miss is caught]. */
function plants(step, key) {
  const dot = f => ({ type: f.type, agent: f.agent, rev: false, ang: f.ang, len: 0, onObj: true });
  const max = Math.max(...key.map(f => f.mag));
  const good = () => key.map(f => ({ ...dot(f), len: 30 + 100 * f.mag / max }));
  const has = (r, code) => r.arrows.some(a => a.code === code || (a.codes || []).includes(code));
  const out = [
    ['correct', good(), r => r.ok],
    ['net force drawn', [...good(), { type: 'net', agent: '', rev: false, ang: 90, len: 50, onObj: true }], r => !r.ok && has(r, 'fake-net')],
    ['centripetal force drawn', [...good(), { type: 'centripetal', agent: '', rev: false, ang: 180, len: 50, onObj: true }], r => !r.ok && has(r, 'fake-centripetal')],
    ['force of motion drawn', [...good(), { type: 'motion', agent: '', rev: false, ang: 0, len: 50, onObj: true }], r => !r.ok && has(r, 'fake-motion')],
    ['tail off the object', good().map((a, i) => i === 0 ? { ...a, onObj: false } : a), r => !r.ok && has(r, 'tail')],
    ['unlabeled force', good().map((a, i) => i === 0 ? { ...a, agent: '' } : a), r => !r.ok && has(r, 'unlabeled')]
  ];
  // Every missing force is named.
  key.forEach((f, k) => out.push([`missing ${f.type}`, good().filter((a, i) => i !== k), r => !r.ok && r.missing.some(m => m.key === k)]));
  // Every force reversed is a direction miss.
  key.forEach((f, k) => out.push([`${f.type} reversed`, good().map((a, i) => i === k ? { ...a, ang: norm(a.ang + 180) } : a), r => !r.ok && r.arrows[k].code === 'dir']));
  // The third-law partner instead of the force.
  key.forEach((f, k) => out.push([`${f.type} as its partner`, good().map((a, i) => i === k ? { ...a, rev: true } : a), r => !r.ok && r.arrows[k].code === 'partner']));
  // A force with no agent in this scene.
  const fams = new Set(key.map(f => ({ fs: 'friction', fk: 'friction' })[f.type] || f.type));
  const absent = ['normal', 'tension', 'fk', 'spring', 'applied', 'buoy'].find(t => !fams.has(({ fk: 'friction' })[t] || t));
  if (absent) out.push([`extra ${absent}`, [...good(), { type: absent, agent: step.labels[0].agent, rev: false, ang: 45, len: 40, onObj: true }], r => !r.ok && r.arrows.some(a => a.st === 'extra')]);
  // Lengths that contradict the motion: every pair of opposite forces (and
  // gravity with the normal force) drawn equal when their sizes differ by
  // 20% or more, or unequal when they are equal.
  for (let i = 0; i < key.length; i++) for (let j = i + 1; j < key.length; j++) {
    const A = key[i], B = key[j], gn = new Set([A.type, B.type]).size === 2 && [A.type, B.type].every(t => t === 'grav' || t === 'normal');
    if (adiff(A.ang, B.ang) < 170 && !gn) continue;
    const r = Math.max(A.mag, B.mag) / Math.min(A.mag, B.mag);
    if (r >= 1.2) out.push([`${A.type} and ${B.type} drawn equal`, good().map((a, k) => k === i || k === j ? { ...a, len: 80 } : a), res => !res.ok && res.notes.some(n => n.arrows.includes(i) && n.arrows.includes(j))]);
    if (r <= 1.0001) out.push([`${A.type} and ${B.type} drawn unequal`, good().map((a, k) => k === i ? { ...a, len: 60 } : k === j ? { ...a, len: 100 } : a), res => !res.ok && res.notes.some(n => n.arrows.includes(i) && n.arrows.includes(j))]);
  }
  return out;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'free-body-diagrams', 'simulator', map, errs);
  const { M, model } = runtime('free-body-diagrams');
  if (!model || typeof model.generate !== 'function') { errs.push('physics/assets/tools/math/free-body-diagrams.js does not register ApPhysMath.freeBodyDiagrams with a generate()'); return errs; }
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.scenes) || !c.scenes.length) errs.push(`context ${c.id}: "scenes" must list at least one scene`);
    for (const s of c.scenes || []) if (!model.SCENES[s]) errs.push(`context ${c.id}: unknown scene "${s}"`);
  }
  if (errs.length) return errs;
  const recheck = (p, ctx, w) => {
    const g = M.g(ctx), phys = physics(p.scene, p.params, g), fbd = p.steps.find(s => s.key === 'fbd');
    if (!fbd || fbd.kind !== 'fbd') { errs.push(`${w}: the first step must be the diagram`); return; }
    // The key's forces, force by force.
    const key = fbd.forces.filter(f => f.mag > 1e-9), want = phys.forces.filter(f => f.mag > 1e-9);
    const tag = f => `${f.type}/${f.agent}`;
    if (key.map(tag).sort().join() !== want.map(tag).sort().join()) { errs.push(`${w}: forces ${key.map(tag).join(', ')}; expected ${want.map(tag).join(', ')}`); return; }
    for (const f of want) {
      const k = key.find(x => tag(x) === tag(f));
      if (!close(k.mag, f.mag, 1e-9, 1e-9)) errs.push(`${w}: ${tag(f)} is ${k.mag} N, expected ${f.mag} N`);
      if (adiff(k.ang, f.ang) > 1e-6) errs.push(`${w}: ${tag(f)} points at ${k.ang}°, expected ${f.ang}°`);
      if (!fbd.labels.some(l => l.agent === f.agent && !l.rev)) errs.push(`${w}: no label "${f.agent} on ${fbd.obj}" to choose`);
    }
    // Newton's second law holds for the key.
    const sx = key.reduce((s, f) => s + f.mag * Math.cos(rad(f.ang)), 0), sy = key.reduce((s, f) => s + f.mag * Math.sin(rad(f.ang)), 0);
    if (Math.abs(sx - phys.m * phys.a.x) > 1e-6 * (1 + phys.m * g) || Math.abs(sy - phys.m * phys.a.y) > 1e-6 * (1 + phys.m * g)) errs.push(`${w}: ΣF ≠ ma (ΣF = ${sx.toFixed(4)}, ${sy.toFixed(4)})`);
    if (!close(p.res.amag, Math.hypot(phys.a.x, phys.a.y), 1e-9, 1e-9)) errs.push(`${w}: acceleration ${p.res.amag}, expected ${Math.hypot(phys.a.x, phys.a.y)}`);
    if (key.some(f => f.type === 'normal' && f.mag < 0) || key.some(f => f.type === 'tension' && f.mag < 0)) errs.push(`${w}: a negative normal force or tension`);
    // The number.
    const num = p.steps.find(s => s.key === 'solve'), x = answer(p);
    if (!num || !close(num.cell.answer, x, 1e-9, 1e-9)) errs.push(`${w}: the answer is ${num && num.cell.answer}, expected ${x}`);
    if (!(x > 0)) errs.push(`${w}: the asked quantity is not positive (${x})`);
    // The law step.
    const law = p.steps.find(s => s.key === 'law');
    if (!law || law.kind !== 'choice' || law.options.length !== 4 || law.correct !== 0) errs.push(`${w}: the law step needs four options with the right one first`);
    // The grader, with planted misses.
    for (const [name, arrows, ok] of plants(fbd, key)) {
      const r = model.grade(arrows, fbd);
      if (!ok(r)) { errs.push(`${w}: grading "${name}" went wrong: ${JSON.stringify({ ok: r.ok, arrows: r.arrows.map(a => a.code || a.st), missing: r.missing.map(m => m.code), notes: r.notes.length })}`); break; }
      if (!r.ok && ![...r.arrows.filter(a => a.st !== 'ok').map(a => a.why), ...r.missing.map(m => m.why), ...r.notes.map(n => n.why)].every(s => s && !/undefined|NaN/.test(s))) errs.push(`${w}: "${name}" has an empty or broken explanation`);
    }
  };
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), recheck, c => c.scenes || [undefined]);
  return errs;
}
