/* Validator for physics/data/tools/energy-bar-charts.json (Energy bar charts), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. 300 seeded problems per context and type
   from the page's own generator (ApPhysMath.energyBarCharts.generate), each
   recomputed here from first principles, without the model:
     bars      the energy of each store in joules from m, g, h, k, x, v,
               divided by the unit; a store is a bar when its agent is in
               the system, else its change is work (W = −ΔU of outside
               stores, + the cable's mgh); before + W = after, and W = 0
               for the system the student must choose
     speed     ΔU = mgΔh, v = √(2gΔh)
     height    K = ½mv², h = v²/2g, d = h / sin θ
     spring    U = ½kx², v = x√(k/m); or K, x = v√(m/k)
     friction  W_f = ½mv² − mgh; or W_f = −½mv², d = v²/(2μg)
     work      W = Fd cos θ, v = √(2W/m)
     power     W = mgh, P = W/t, v = h/t
     ke        K = ½mv², ΔK = ½m(v₂² − v₁²)
   It also runs the Explore model and checks that energy is conserved. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const TYPES = ['bars', 'speed', 'height', 'spring', 'friction', 'work', 'power', 'ke'];
const KINDS = ['ramp', 'rough', 'launch', 'launchUp', 'lift', 'skater', 'skaterRough'];

/* Energies in joules for a bar-chart situation, from its numbers. */
function joules(v) {
  const { m, g, kind } = v;
  const st = {}; let Ki = 0, Kf = 0, cable = 0;
  if (kind === 'ramp' || kind === 'rough') { st.earth = [m * g * v.h, 0]; Kf = kind === 'ramp' ? m * g * v.h : 0; if (kind === 'rough') st.surface = [0, m * g * v.h]; }
  else if (kind === 'launch' || kind === 'launchUp') { const U = 0.5 * v.k * v.x * v.x; st.spring = [U, 0]; Kf = kind === 'launch' ? U : 0; if (kind === 'launchUp') st.earth = [0, U]; }
  else if (kind === 'lift') { st.earth = [0, m * g * v.h]; cable = m * g * v.h; }
  else {
    st.earth = [m * g * v.h1, m * g * v.h2];
    if (kind === 'skater') Kf = m * g * (v.h1 - v.h2);
    else { Kf = 0.5 * m * v.v * v.v; st.surface = [0, m * g * (v.h1 - v.h2) - Kf]; }
  }
  return { st, Ki, Kf, cable };
}

export function check(data, map) {
  const errs = [];
  frame(data, 'energy-bar-charts', 'simulator', map, errs);
  const { M, model } = runtime('energy-bar-charts');
  if (!model || typeof model.generate !== 'function') { errs.push('physics/assets/tools/math/energy-bar-charts.js does not register ApPhysMath.energyBarCharts with a generate()'); return errs; }
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types must come from ${TYPES.join(', ')}`);
    if (c.situation && !KINDS.includes(c.situation)) errs.push(`context ${c.id}: situation must be one of ${KINDS.join(', ')}`);
  }
  // Explore: energy bookkeeping adds up in every scene.
  for (const [scene, o] of [['skater', { track: 'valley', s0: 0.3 }], ['skater', { track: 'hill', s0: 0.2, mu: 0.08 }], ['skater', { track: 'drop', s0: 0.1 }], ['launcher', { k: 400, x: 0.35 }], ['ramp', { h: 2, mu: 0.3 }], ['lift', { H: 6, v: 1.2 }]]) {
    const S = model.sim(scene, o), s0 = S.state(); let s = s0;
    for (let i = 0; i < 1800 && !S.settled(); i++) {
      s = S.step(1 / 60);
      const tot = s.K + s.Ug + s.Us + s.Eth, ref = s.E0 + s.Wc;
      if (!close(tot, ref, 1e-9, 1e-9)) { errs.push(`explore ${scene} ${o.track || ''}: K + Ug + Us + Eth = ${tot}, expected ${ref} at t = ${s.t}`); break; }
    }
    for (const sys of [{}, { earth: true }, { spring: true }, { surface: true }, { earth: true, spring: true, surface: true }])
      if (!model.ledger(s0, s, sys).balanced) errs.push(`explore ${scene}: start + W ≠ now for system ${JSON.stringify(sys)}`);
  }
  const shows = (p, w, ...xs) => { for (const [x, n] of xs) if (!p.text.includes(M.fmt(x, n))) errs.push(`${w}: the text does not show ${M.fmt(x, n)}`); };
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const step = k => p.steps.find(x => x.key === k), v = p.values, g = M.g(c);
    const is = (k, x, rel = 1e-9) => { const s = step(k); if (!s) errs.push(`${w}: no step ${k}`); else if (!close(s.cell.answer, x, rel, 1e-9)) errs.push(`${w}: step ${k} is ${s.cell.answer}, recomputed ${x}`); };
    if (p.type === 'bars') {
      const { st, Ki, Kf, cable } = joules(v), u = v.u, sys = v.sys;
      const want = { Ki: Ki / u, Kf: Kf / u, W: cable / u };
      for (const [a, [pre, post]] of Object.entries(st)) {
        const keys = a === 'earth' ? ['Ugi', 'Ugf'] : a === 'spring' ? ['Usi', 'Usf'] : [null, 'Ethf'];
        if (sys[a]) { if (keys[0]) want[keys[0]] = pre / u; want[keys[1]] = post / u; }
        else { if (keys[0]) want[keys[0]] = 0; want[keys[1]] = 0; want.W -= (post - pre) / u; }
      }
      const row = step('bars'), cells = p.figure.cells;
      if (!row || row.cells.length !== cells.length) { errs.push(`${w}: the bar row and the chart's cells differ`); return; }
      cells.forEach((cl, i) => {
        const x = want[cl.key] ?? 0;
        if (Math.abs(x - Math.round(x)) > 1e-6) errs.push(`${w}: ${cl.key} is ${x} units, not a whole number`);
        if (!close(row.cells[i].answer, x, 1e-6, 1e-6)) errs.push(`${w}: bar ${cl.key} is ${row.cells[i].answer}, recomputed ${x}`);
        if (Math.abs(x) > 8) errs.push(`${w}: bar ${cl.key} (${x}) is off the chart`);
      });
      const sum = grp => cells.reduce((s, cl, i) => s + (cl.grp === grp ? row.cells[i].answer : 0), 0);
      if (!close(sum('i') + sum('w'), sum('f'), 1e-9, 1e-9)) errs.push(`${w}: before + W ≠ after`);
      if (!cells.some((cl, i) => cl.key !== 'W' && row.cells[i].answer !== 0)) errs.push(`${w}: a chart with no bars`);
      const ch = step('system');
      if (ch) {
        const ags = Object.keys(st);
        if (!ags.every(a => sys[a])) errs.push(`${w}: the chosen system leaves an agent outside`);
        if (want.W !== 0) errs.push(`${w}: the chosen system has work crossing its boundary`);
      }
      const ag = step('agent');
      if (ag) {
        const m = /<b>(.*?)<\/b>/.exec(ag.label)[1];
        const a = /Earth/.test(m) ? 'earth' : /spring/.test(m) ? 'spring' : /cable/.test(m) ? 'cable' : 'surface';
        const exp = a === 'cable' ? 1 : sys[a] ? (a === 'surface' ? 2 : 0) : 1;
        if (ag.correct !== exp) errs.push(`${w}: how ${a} shows is keyed ${ag.correct}, expected ${exp}`);
      }
      if (!p.text.includes(M.fmt(u, 3) + ' J')) errs.push(`${w}: the text does not give the unit`);
    }
    if (p.type === 'speed') { const dh = v.h1 - v.h2; is('dU', v.m * g * dh); is('v', Math.sqrt(2 * g * dh)); if (step('mass').correct !== 0) errs.push(`${w}: mass does not cancel`); shows(p, w, [v.m, 2]); }
    if (p.type === 'height') { const h = v.v * v.v / (2 * g); is('K', 0.5 * v.m * v.v * v.v); is('h', h); is('d', h / Math.sin(v.ang * Math.PI / 180)); shows(p, w, [v.m, 2], [v.v, 2]); }
    if (p.type === 'spring') {
      if (v.out) { is('K', 0.5 * v.m * v.v * v.v); is('x', v.v * Math.sqrt(v.m / v.k)); shows(p, w, [v.v, 2]); }
      else { is('U', 0.5 * v.k * v.x * v.x); is('v', v.x * Math.sqrt(v.k / v.m)); }
      shows(p, w, [v.m, 2]);
    }
    if (p.type === 'friction') {
      if (v.mode === 'ramp') { const U = v.m * g * v.h, K = 0.5 * v.m * v.v * v.v; is('U', U); is('K', K); is('W', K - U); if (!(K < U && K > 0)) errs.push(`${w}: friction must take some but not all the energy`); }
      else { is('W', -0.5 * v.m * v.v * v.v); is('d', v.v * v.v / (2 * v.mu * g)); }
    }
    if (p.type === 'work') { const W = v.F * v.d * Math.cos(v.ang * Math.PI / 180); is('W', W); is('v', Math.sqrt(2 * W / v.m)); shows(p, w, [v.F, 2], [v.d, 2]); }
    if (p.type === 'power') { const W = v.m * g * v.h; is('W', W); is('P', W / v.t); is('P2', v.h / v.t); shows(p, w, [v.h, 2], [v.t, 2]); }
    if (p.type === 'ke') { is('K1', 0.5 * v.m * v.v1 * v.v1); is('dK', 0.5 * v.m * (v.v2 * v.v2 - v.v1 * v.v1)); is('W', 0.5 * v.m * (v.v2 * v.v2 - v.v1 * v.v1)); }
  }, c => c.types || TYPES);
  return errs;
}
