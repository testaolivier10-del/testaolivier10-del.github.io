/* Torque balance model: ApPhysMath.torqueBalance (docs/apphys-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apphys-tool-checks/torque-balance.mjs) and the test
   (scripts/test/apphys-tool-torque-balance.test.mjs) run exactly this code.

   Loaded on physics/tools/torque-balance.html after phys-tool-math.js and
   before physics/assets/tools/torque-balance.js. SI units throughout;
   counterclockwise torque is positive (the CED: rotation is described as
   clockwise or counterclockwise only).

   The beam (Explore, scene 1)
     state = { L, mb, pivot, h, masses: [{ m, x }], force: null | { F, x, ang } }
       L beam length (m), mb its mass (kg, uniform, so its weight acts at L/2),
       pivot the fulcrum's position from the left end (m), h the fulcrum's
       height above the table (m), each mass hangs at x (m from the left end),
       force a pull of F newtons at x, at ang degrees from the beam's +x
       direction (counterclockwise), kept at that angle to the beam.
     torques(state, g) -> { items, ccw, cw, net, I, alpha, Fy, support }
       every torque about the pivot with its lever arm, the clockwise and
       counterclockwise totals, the net torque, the rotational inertia about
       the pivot (point masses m r², the beam (1/12) mb L² + mb d²: given, as
       the CED asks), alpha = net / I, and the support force from the fulcrum
       when the beam is held level (translational equilibrium).
     limits(state) -> { lo, hi }   the tilt (rad) at which the beam meets a stop
       (state.stop degrees, default 10) or an end touches the table
     tip(state, th, om, dt, g) -> { th, om }   one velocity-Verlet step of
       I d²θ/dt² = τ(θ); gravity's lever arms shrink as cos θ, the pull keeps
       its angle to the beam. The masses ride with the beam (short strings).
     energy(state, th, om, g)  ½Iω² + Σ m g y − (work of the pull): constant
       while the beam swings (the test holds it to 0.1%).

   The inertia race (Explore, scene 2)
     race.inertia(I0, ms, d)   hub + two sliders of mass ms at radius d
     race.accel(m, r, I, g)    the falling weight's acceleration m g / (m + I/r²)
     race.at(o, t)             { y, v, om, K, Krot, U } after t seconds

   generate(r, ctx, type) -> a seeded "Test yourself" problem
     types: torque, balance, support, alpha, inertia (see each below). */
(function(){
  'use strict';
  var M = window.ApPhysMath;
  if(!M) return;
  var f = M.fmt;

  /* ------------------------------------------------------------ beam */
  function beamI(s){
    var d = s.L / 2 - s.pivot, I = s.mb * s.L * s.L / 12 + s.mb * d * d;
    s.masses.forEach(function(q){ var r = q.x - s.pivot; I += q.m * r * r; });
    return I;
  }
  function torques(s, g){
    g = g || M.C.g;
    var items = [], ccw = 0, cw = 0;
    function add(o){ items.push(o); if(o.tau > 1e-12) ccw += o.tau; else if(o.tau < -1e-12) cw -= o.tau; }
    if(s.mb > 0){ var rb = s.L / 2 - s.pivot; add({ kind: 'beam', label: 'Beam\'s weight', F: s.mb * g, x: s.L / 2, r: rb, arm: Math.abs(rb), tau: -s.mb * g * rb }); }
    s.masses.forEach(function(q, i){ var r = q.x - s.pivot; add({ kind: 'mass', i: i, label: M.fmt(q.m, 2) + ' kg', F: q.m * g, x: q.x, r: r, arm: Math.abs(r), tau: -q.m * g * r }); });
    var Fy = 0;
    if(s.force && s.force.F > 0){
      var a = M.rad(s.force.ang), r2 = s.force.x - s.pivot, sn = Math.sin(a);
      Fy = s.force.F * sn;
      add({ kind: 'pull', label: 'Your pull', F: s.force.F, x: s.force.x, r: r2, arm: Math.abs(r2 * sn), tau: r2 * s.force.F * sn, ang: s.force.ang });
    }
    var W = (s.mb + s.masses.reduce(function(t, q){ return t + q.m; }, 0)) * g;
    var I = beamI(s), net = ccw - cw;
    // Held level: the fulcrum pushes up with W − (the pull's upward part) and
    // sideways against the pull's horizontal part.
    var Fx = s.force && s.force.F > 0 ? s.force.F * Math.cos(M.rad(s.force.ang)) : 0;
    return { items: items, ccw: ccw, cw: cw, net: net, I: I, alpha: net / I, W: W, Fy: Fy, support: { x: -Fx, y: W - Fy } };
  }
  function limits(s){
    var right = s.L - s.pivot, left = s.pivot, st = M.rad(s.stop || 10);
    return { lo: -Math.min(st, Math.asin(Math.min(1, s.h / right))), hi: Math.min(st, Math.asin(Math.min(1, s.h / left))) };
  }
  function tauAt(s, th, g){
    var c = Math.cos(th), t = 0;
    t += -s.mb * g * (s.L / 2 - s.pivot) * c;
    s.masses.forEach(function(q){ t += -q.m * g * (q.x - s.pivot) * c; });
    if(s.force && s.force.F > 0) t += (s.force.x - s.pivot) * s.force.F * Math.sin(M.rad(s.force.ang));
    return t;
  }
  function tip(s, th, om, dt, g){
    g = g || M.C.g;
    var I = beamI(s), a0 = tauAt(s, th, g) / I;
    var th2 = th + om * dt + 0.5 * a0 * dt * dt, a1 = tauAt(s, th2, g) / I;
    return { th: th2, om: om + 0.5 * (a0 + a1) * dt };
  }
  function energy(s, th, om, g){
    g = g || M.C.g;
    var sn = Math.sin(th), U = s.mb * g * (s.L / 2 - s.pivot) * sn;
    s.masses.forEach(function(q){ U += q.m * g * (q.x - s.pivot) * sn; });
    var Wp = s.force && s.force.F > 0 ? (s.force.x - s.pivot) * s.force.F * Math.sin(M.rad(s.force.ang)) * th : 0;
    return 0.5 * beamI(s) * om * om + U - Wp;
  }

  /* ------------------------------------------------------- race */
  var race = {
    inertia: function(I0, ms, d){ return I0 + 2 * ms * d * d; },
    accel: function(m, r, I, g){ return m * (g || M.C.g) / (m + I / (r * r)); },
    at: function(o, t){
      var a = race.accel(o.m, o.r, o.I, o.g), h = o.h, tEnd = Math.sqrt(2 * h / a), tt = Math.min(t, tEnd);
      var y = 0.5 * a * tt * tt, v = a * tt, om = v / o.r;
      return { y: y, v: v, om: om, theta: y / o.r, a: a, tEnd: tEnd, done: t >= tEnd, K: 0.5 * o.m * v * v, Krot: 0.5 * o.I * om * om, U: o.m * (o.g || M.C.g) * (h - y), T: o.m * ((o.g || M.C.g) - a) };
    }
  };

  /* ----------------------------------------------------- drills */
  function num(key, label, answer, unit, o){
    o = o || {};
    var s = { key: key, kind: 'num', label: label, cell: M.cell(answer, o.rel || 0.02, o.mistakes || [], o.abs), unit: unit, practice: o.practice || '2.B' };
    if(o.hint) s.hint = o.hint;
    if(o.d != null) s.d = o.d;
    return s;
  }
  function choice(key, label, options, correct, why, practice, fixed){
    return { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: practice || '3.B', fixed: !!fixed };
  }
  /* A given value as written in the problem: two significant figures, or
     three when the value needs them (0.20, 3.25, 40, 0.0015). */
  function m2(x){ return M.fmt(x, Number(Number(x).toPrecision(2)) === x ? 2 : 3); }
  var gTxt = function(g){ return 'Use g = ' + g + ' m/s².'; };

  /* torque: a force at an angle to a lever. τ = r F sin θ. */
  var LEVERS = {
    wrench: { what: 'a wrench', pivot: 'the bolt', who: 'A mechanic pulls on the handle of', along: 'the handle' },
    door: { what: 'a door seen from above', pivot: 'the hinge', who: 'A student pushes on', along: 'the door' },
    stick: { what: 'a meter stick pinned at one end', pivot: 'the pin', who: 'A spring scale pulls on', along: 'the stick' }
  };
  function genTorque(r, ctx, g){
    var kind = r.pick(ctx.levers || ['wrench', 'door', 'stick']), L = LEVERS[kind];
    var rr = kind === 'door' ? r.pick([0.60, 0.70, 0.75, 0.80, 0.85]) : kind === 'stick' ? r.pick([0.40, 0.50, 0.60, 0.70, 0.80]) : r.pick([0.20, 0.25, 0.30, 0.35, 0.40]);
    var F = kind === 'stick' ? r.pick([4.0, 5.0, 6.0, 7.5, 8.0]) : r.pick([20, 30, 40, 45, 50, 60, 80]);
    var th = r.pick([20, 30, 35, 40, 50, 55, 60, 70, 75]);
    var up = r() < 0.5, sn = Math.sin(M.rad(th)), cs = Math.cos(M.rad(th));
    var arm = rr * sn, tau = rr * F * sn;
    var dir = up ? 'up' : 'down';
    var text = '<p>' + L.who + ' ' + L.what + ' with a force of ' + m2(F) + ' N, applied ' + m2(rr) + ' m from ' + L.pivot + '. The force points ' + (kind === 'door' ? (up ? 'toward the top of the picture' : 'toward the bottom of the picture') : dir) + ' and away from ' + L.pivot + ', at ' + th + '° to ' + L.along + '.</p>';
    var steps = [
      num('arm', 'The lever arm: the perpendicular distance from ' + L.pivot + ' to the force\'s line of action', arm, 'm', { practice: '2.B', mistakes: [
        { value: rr * cs, why: 'That is r cos θ. The lever arm is the part of r perpendicular to the force: r sin θ when θ is the angle between the force and ' + L.along + '.' },
        { value: rr, why: 'That is the whole distance r. The force is not perpendicular to ' + L.along + ', so the lever arm is shorter: r sin θ.' }] }),
      num('tau', 'The size of the torque about ' + L.pivot, tau, 'N·m', { practice: '2.B', mistakes: [
        { value: rr * F * cs, why: 'That uses cos θ. Only the force\'s component perpendicular to ' + L.along + ' turns it: τ = r F sin θ.' },
        { value: rr * F, why: 'That is r F, which is right only for a force at 90° to ' + L.along + '. Multiply by sin θ.' },
        { value: F / rr, why: 'Torque is force times lever arm, not force divided by distance.' }] }),
      choice('dir', 'Seen as in the picture, which way does this torque turn ' + (kind === 'door' ? 'the door' : kind === 'wrench' ? 'the wrench' : 'the stick') + '?',
        ['Clockwise', 'Counterclockwise'], up ? 1 : 0,
        [up ? 'Not this way. The force pushes the end ' + (kind === 'door' ? 'toward the top' : 'up') + ' while ' + L.pivot + ' stays put, so the end swings counterclockwise.' : 'Right. The force pushes the end ' + (kind === 'door' ? 'toward the bottom' : 'down') + ' about ' + L.pivot + ': clockwise.',
         up ? 'Right. The force pushes the end ' + (kind === 'door' ? 'toward the top' : 'up') + ' about ' + L.pivot + ': counterclockwise.' : 'Not this way. The force pushes the end ' + (kind === 'door' ? 'toward the bottom' : 'down') + ' while ' + L.pivot + ' stays put, so the end swings clockwise.'], '3.B', true)
    ];
    return { type: 'torque', text: text, steps: steps, values: { kind: kind, r: rr, F: F, th: th, up: up },
      fig: { kind: 'lever', obj: kind, r: rr, F: F, ang: up ? th : -th, th: th, up: up },
      solution: [
        'Lever arm = r sin θ = ' + m2(rr) + ' m × sin ' + th + '° = ' + f(arm, 3) + ' m (the perpendicular distance from ' + L.pivot + ' to the line of the force).',
        'τ = r F sin θ = ' + m2(rr) + ' m × ' + f(F, 2) + ' N × sin ' + th + '° = ' + f(tau, 3) + ' N·m. Equivalently, force × lever arm.',
        'The force swings the free end ' + (up ? 'counterclockwise' : 'clockwise') + ' about ' + L.pivot + '.'
      ] };
  }

  /* balance: where to hang a mass so a meter stick balances. */
  function genBalance(r, ctx, g){
    for(var tries = 0; tries < 200; tries++){
      var mb = r.pick(ctx.beamMass || [0, 0.10, 0.12, 0.15, 0.20]);
      var p = r.pick([0.40, 0.45, 0.50, 0.55, 0.60]);
      var x1 = M.round(r.pick([0.05, 0.10, 0.15, 0.20, 0.25, 0.30]), 2);
      var m1 = r.pick([0.10, 0.20, 0.25, 0.30, 0.40, 0.50]);
      var m2v = r.pick([0.20, 0.25, 0.30, 0.40, 0.50, 0.60]);
      var t1 = m1 * g * (p - x1), tb = mb * g * (p - 0.5);
      var d2 = (t1 + tb) / (m2v * g), x2 = p + d2;
      if(x2 < p + 0.06 || x2 > 0.97 || d2 < 0.04 || Math.abs(m1 - m2v) < 1e-9) continue;
      var light = mb === 0;
      var text = '<p>A meter stick' + (light ? ' of negligible mass' : ' of mass ' + m2(mb) + ' kg (uniform, so its weight acts at the 0.50 m mark)') + ' rests on a fulcrum at the ' + m2(p) + ' m mark. A ' + m2(m1) + ' kg mass hangs at the ' + m2(x1) + ' m mark. Where must a ' + m2(m2v) + ' kg mass hang so the stick balances? ' + gTxt(g) + '</p>';
      var steps = [
        num('t1', 'The torque of the ' + m2(m1) + ' kg mass about the fulcrum', t1, 'N·m', { practice: '2.B', mistakes: [
          { value: m1 * g * x1, why: 'That uses ' + m2(x1) + ' m, the distance from the end of the stick. Lever arms are measured from the pivot: ' + m2(p) + ' − ' + m2(x1) + ' m.' },
          { value: m1 * (p - x1), why: 'That is mass times distance. Torque needs the force: the weight m g.' }] })
      ];
      if(!light && Math.abs(p - 0.5) > 1e-9) steps.push(num('tb', 'The torque of the stick\'s own weight about the fulcrum', Math.abs(tb), 'N·m', { practice: '2.B', mistakes: [
        { value: mb * g * 0.5, why: 'The stick\'s weight acts at its center, 0.50 m, so its lever arm is the distance from the fulcrum to the center: |' + m2(p) + ' − 0.50| m.' }] }));
      var noBeam = t1 / (m2v * g);
      var dm = [{ value: x2, why: 'That is the reading on the stick. The question here is the distance from the fulcrum.' }, { value: t1 / m2v, why: 'Divide the torque by the weight m g, not by the mass alone.' }];
      if(!light && Math.abs(tb) > 1e-9) dm.push({ value: noBeam, why: 'That leaves out the stick\'s own weight. Its center is ' + (p > 0.5 ? 'left' : 'right') + ' of the fulcrum, so it adds a ' + (p > 0.5 ? 'counterclockwise' : 'clockwise') + ' torque too.' });
      steps.push(num('d2', 'How far to the right of the fulcrum must the ' + m2(m2v) + ' kg mass hang?', d2, 'm', { practice: '2.A', mistakes: dm, abs: 0.004 }));
      steps.push(num('x2', 'So the ' + m2(m2v) + ' kg mass hangs at which mark on the stick?', x2, 'm', { practice: '2.B', abs: 0.004, rel: 0.01, mistakes: [{ value: d2, why: 'That is the distance from the fulcrum. Add the fulcrum\'s mark (' + m2(p) + ' m) to get the reading.' }] }));
      return { type: 'balance', text: text, steps: steps, values: { mb: mb, p: p, x1: x1, m1: m1, m2: m2v, g: g },
        fig: { kind: 'stick', L: 1, mb: mb, pivot: p, masses: [{ m: m1, x: x1 }], ghost: { m: m2v } },
        solution: [
          'Rotational equilibrium: the counterclockwise torques about the fulcrum equal the clockwise torques (Στ = 0).',
          'Left mass: τ = m g r = ' + m2(m1) + ' × ' + g + ' × (' + m2(p) + ' − ' + m2(x1) + ') = ' + f(t1, 3) + ' N·m, counterclockwise.',
          light ? 'The stick has negligible mass, so it adds no torque.' : Math.abs(tb) < 1e-9 ? 'The fulcrum is under the stick\'s center, so its weight has no lever arm.' : 'Stick: ' + m2(mb) + ' × ' + g + ' × |' + m2(p) + ' − 0.50| = ' + f(Math.abs(tb), 3) + ' N·m, ' + (tb > 0 ? 'counterclockwise' : 'clockwise') + '.',
          m2(m2v) + ' × ' + g + ' × d = ' + f(t1 + tb, 3) + ' N·m, so d = ' + f(d2, 3) + ' m right of the fulcrum, at the ' + f(x2, 3) + ' m mark.'
        ] };
    }
    throw new Error('torqueBalance: no balance problem for ' + ctx.id);
  }

  /* support: a plank on two supports with a load; both support forces. */
  function genSupport(r, ctx, g){
    var L = r.pick([3.0, 4.0, 5.0, 6.0]), mb = r.pick([10, 12, 15, 20, 25]), m = r.pick([30, 40, 45, 50, 60, 70]);
    var x = M.round(L * r.pick([0.2, 0.25, 0.3, 0.35, 0.65, 0.7, 0.75, 0.8]), 2);
    var who = r.pick(['A painter', 'A student', 'A crate']);
    var FR = (mb * g * L / 2 + m * g * x) / L, FL = (mb + m) * g - FR;
    var text = '<p>A uniform plank ' + m2(L) + ' m long with a mass of ' + m2(mb) + ' kg rests on two supports, one under each end. ' + who + ' of mass ' + m2(m) + ' kg ' + (who === 'A crate' ? 'sits' : 'stands') + ' ' + m2(x) + ' m from the left end. Find the force each support exerts on the plank. ' + gTxt(g) + '</p>';
    var closer = x < L / 2 ? 0 : 1;
    var steps = [
      num('FR', 'Take torques about the left support. The upward force from the right support', FR, 'N', { practice: '2.A', mistakes: [
        { value: m * g * x / L, why: 'That leaves out the plank\'s own weight, which acts at its center, ' + f(L / 2, 2) + ' m from the left support.' },
        { value: (mb * L / 2 + m * x) / L, why: 'That is in kilograms. Torques need forces: multiply each mass by g.' },
        { value: (mb + m) * g / 2, why: 'Half the total weight would be right only if the load stood at the middle.' }] }),
      num('FL', 'Now translational equilibrium: the upward force from the left support', FL, 'N', { practice: '2.B', mistakes: [
        { value: (mb + m) * g, why: 'That is the whole weight. The two supports share it: F_left + F_right = total weight.' },
        { value: FR, why: 'That is the right support\'s force. The supports share the weight equally only when the load is at the middle.' }] }),
      choice('which', 'Which support pushes up harder, and why?', ['The left support: the load is closer to it', 'The right support: the load is closer to it', 'Both push equally: the plank is uniform'], closer,
        [closer === 0 ? 'Right. Take torques about the right support: the load sits far from it, so its torque is large, and the left support (lever arm L) must balance it. The two forces still add up to the total weight.' : 'Not this one. The load is nearer the right end, so the right support carries more.',
         closer === 1 ? 'Right. Take torques about the left support: the load sits far from it, so its torque is large, and the right support (lever arm L) must balance it. The two forces still add up to the total weight.' : 'Not this one. The load is nearer the left end, so the left support carries more.',
         'The plank alone would split equally, but the load is off-center, so the support nearer to it carries more.'], '3.C')
    ];
    return { type: 'support', text: text, steps: steps, values: { L: L, mb: mb, m: m, x: x, g: g },
      fig: { kind: 'plank', L: L, mb: mb, m: m, x: x, who: who },
      solution: [
        'Torques about the left support (its own force has no lever arm there): F_right × ' + f(L, 2) + ' = ' + f(mb, 2) + ' × ' + g + ' × ' + f(L / 2, 2) + ' + ' + f(m, 2) + ' × ' + g + ' × ' + f(x, 2) + ', so F_right = ' + f(FR, 3) + ' N.',
        'Forces: F_left + F_right = (' + f(mb, 2) + ' + ' + f(m, 2) + ') × ' + g + ' = ' + f((mb + m) * g, 3) + ' N, so F_left = ' + f(FL, 3) + ' N.',
        'Two equations, two conditions: Στ = 0 about any point and ΣF = 0. Choosing the pivot at an unknown force removes it from the torque equation.'
      ] };
  }

  /* alpha: a light rod on a center pivot with two masses, released level. */
  function genAlpha(r, ctx, g){
    for(var k = 0; k < 200; k++){
      var m1 = r.pick([0.50, 1.0, 1.5, 2.0]), m2v = r.pick([0.50, 1.0, 1.5, 2.0, 2.5, 3.0]);
      var r1 = r.pick([0.20, 0.30, 0.40, 0.50]), r2 = r.pick([0.20, 0.30, 0.40, 0.50]);
      var tl = m1 * g * r1, tr = m2v * g * r2, net = tr - tl;
      if(Math.abs(net) < 0.8 || Math.abs(m1 - m2v) < 1e-9) continue;
      var I = m1 * r1 * r1 + m2v * r2 * r2, al = Math.abs(net) / I;
      var text = '<p>A light rod can turn freely about a pivot. A ' + m2(m1) + ' kg mass is fixed ' + m2(r1) + ' m to the left of the pivot and a ' + m2(m2v) + ' kg mass ' + m2(r2) + ' m to the right. The rod is held level and released. Treat the masses as points. ' + gTxt(g) + '</p>';
      var cwWins = net > 0;
      var steps = [
        num('net', 'The size of the net torque about the pivot just after release', Math.abs(net), 'N·m', { practice: '2.B', mistakes: [
          { value: tl + tr, why: 'The two torques turn the rod opposite ways (one clockwise, one counterclockwise), so subtract them.' },
          { value: Math.abs(m2v * r2 - m1 * r1), why: 'Torque needs forces: multiply each mass by g.' }] }),
        num('I', 'The rod\'s rotational inertia about the pivot', I, 'kg·m²', { practice: '2.B', mistakes: [
          { value: m1 * r1 + m2v * r2, why: 'Each point mass contributes m r²: square the distance.' },
          { value: (m1 + m2v) * Math.pow((r1 + r2) / 2, 2), why: 'Add m r² for each mass separately; do not use an average distance.' }] }),
        num('alpha', 'The angular acceleration just after release', al, 'rad/s²', { practice: '2.B', mistakes: [
          { value: Math.abs(net) / (m1 + m2v), why: 'That divides by mass. For rotation, α = τ_net / I, with I in kg·m².' },
          { value: (tl + tr) / I, why: 'Use the net torque (the difference), not the sum.' }] }),
        choice('dir', 'Which way does the rod start to turn?', ['Clockwise', 'Counterclockwise'], cwWins ? 0 : 1,
          [cwWins ? 'Right. The right side\'s torque, ' + f(tr, 3) + ' N·m, beats the left side\'s ' + f(tl, 3) + ' N·m.' : 'Not this way. The left side\'s torque, ' + f(tl, 3) + ' N·m, is larger, so it turns counterclockwise.',
           cwWins ? 'Not this way. The right side\'s torque, ' + f(tr, 3) + ' N·m, is larger, so it turns clockwise.' : 'Right. The left side\'s torque, ' + f(tl, 3) + ' N·m, beats the right side\'s ' + f(tr, 3) + ' N·m.'], '3.B', true)
      ];
      return { type: 'alpha', text: text, steps: steps, values: { m1: m1, m2: m2v, r1: r1, r2: r2, g: g },
        fig: { kind: 'rod', m1: m1, m2: m2v, r1: r1, r2: r2 },
        solution: [
          'Torques about the pivot: left ' + f(m1, 2) + ' × ' + g + ' × ' + m2(r1) + ' = ' + f(tl, 3) + ' N·m counterclockwise; right ' + f(m2v, 2) + ' × ' + g + ' × ' + m2(r2) + ' = ' + f(tr, 3) + ' N·m clockwise. Net ' + f(Math.abs(net), 3) + ' N·m ' + (cwWins ? 'clockwise' : 'counterclockwise') + '.',
          'I = Σ m r² = ' + f(m1, 2) + ' × ' + m2(r1) + '² + ' + f(m2v, 2) + ' × ' + m2(r2) + '² = ' + f(I, 3) + ' kg·m² (the light rod adds nothing).',
          'α = τ_net / I = ' + f(Math.abs(net), 3) + ' / ' + f(I, 3) + ' = ' + f(al, 3) + ' rad/s², ' + (cwWins ? 'clockwise' : 'counterclockwise') + '. The pivot pushes too, but through the axis, so it adds no torque.'
        ] };
    }
    throw new Error('torqueBalance: no alpha problem');
  }

  /* inertia: two race wheels, same mass, sliders at different radii. */
  function genInertia(r, ctx, g){
    var I0 = r.pick([0.0010, 0.0015, 0.0020]), ms = r.pick([0.20, 0.25, 0.40, 0.50]);
    var dA = r.pick([0.05, 0.08, 0.10, 0.12]), dB = r.pick([0.15, 0.18, 0.20, 0.25]);
    var swap = r() < 0.5;
    if(swap){ var t = dA; dA = dB; dB = t; }
    var IA = race.inertia(I0, ms, dA), IB = race.inertia(I0, ms, dB), m = 0.20, rad = 0.040;
    var aA = race.accel(m, rad, IA, g), aB = race.accel(m, rad, IB, g);
    var text = '<p>Two identical race wheels each have a hub of rotational inertia ' + m2(I0) + ' kg·m² and two ' + m2(ms) + ' kg sliders on a light cross-arm. On wheel A the sliders sit ' + m2(dA) + ' m from the axle; on wheel B, ' + m2(dB) + ' m. A ' + m2(m) + ' kg weight hangs from a string wound on each hub (radius ' + m2(rad) + ' m), and both are released together. Treat the sliders as points. ' + gTxt(g) + '</p>';
    var aWins = IA < IB;
    var steps = [
      num('IA', 'Rotational inertia of wheel A', IA, 'kg·m²', { practice: '2.B', mistakes: [
        { value: 2 * ms * dA * dA, why: 'Add the hub\'s ' + m2(I0) + ' kg·m²: I is the sum over every part.' },
        { value: I0 + 2 * ms * dA, why: 'Each slider contributes m r²: square the distance.' }] }),
      num('IB', 'Rotational inertia of wheel B', IB, 'kg·m²', { practice: '2.B', mistakes: [
        { value: 2 * ms * dB * dB, why: 'Add the hub\'s ' + m2(I0) + ' kg·m².' },
        { value: I0 + 2 * ms * dB, why: 'Each slider contributes m r²: square the distance.' }] }),
      num('a', 'The acceleration of the weight that hangs from wheel ' + (aWins ? 'A' : 'B'), aWins ? aA : aB, 'm/s²', { practice: '2.A', rel: 0.025, hint: 'Newton\'s second law for the weight and for the wheel, with a = r α: a = m g / (m + I / r²).', mistakes: [
        { value: g, why: 'The weight does not fall freely: the string pulls up on it with tension while it turns the wheel.' },
        { value: m * g / (m + (aWins ? IA : IB)), why: 'The wheel\'s inertia enters as I / r², not I, because a = r α and τ = T r.' }] }),
      choice('win', 'Which weight reaches the floor first?', ['The one on wheel A', 'The one on wheel B', 'They land together: same masses'], aWins ? 0 : 1,
        [aWins ? 'Right. Wheel A\'s mass is closer to the axle, so its I is smaller; the same torque gives it a larger α, and the weight falls faster.' : 'Not this one. Wheel A\'s sliders are farther out, so its I is larger and it spins up more slowly.',
         aWins ? 'Not this one. Wheel B\'s sliders are farther out, so its I is larger and it spins up more slowly.' : 'Right. Wheel B\'s mass is closer to the axle, so its I is smaller and the same torque gives a larger α.',
         'Same mass does not mean same rotational inertia: I depends on how far the mass is from the axis.'], '3.C')
    ];
    return { type: 'inertia', text: text, steps: steps, values: { I0: I0, ms: ms, dA: dA, dB: dB, m: m, rad: rad, g: g },
      fig: { kind: 'race', dA: dA, dB: dB },
      solution: [
        'I = I_hub + 2 m d²: A = ' + m2(I0) + ' + 2 × ' + m2(ms) + ' × ' + m2(dA) + '² = ' + f(IA, 3) + ' kg·m²; B = ' + m2(I0) + ' + 2 × ' + m2(ms) + ' × ' + m2(dB) + '² = ' + f(IB, 3) + ' kg·m².',
        'Weight: m g − T = m a. Wheel: T r = I α with a = r α. Together: a = m g / (m + I / r²) = ' + f(aWins ? aA : aB, 3) + ' m/s² for wheel ' + (aWins ? 'A' : 'B') + ' (' + f(aWins ? aB : aA, 3) + ' m/s² for wheel ' + (aWins ? 'B' : 'A') + ').',
        'Same mass, different distribution: the wheel with its mass nearer the axle has the smaller I, so it wins.'
      ] };
  }

  var GEN = { torque: genTorque, balance: genBalance, support: genSupport, alpha: genAlpha, inertia: genInertia };
  M.register('torqueBalance', {
    torques: torques, inertiaOf: beamI, limits: limits, tip: tip, tauAt: tauAt, energy: energy, race: race,
    TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var types = ctx.types || ['torque'];
      var t = type && types.indexOf(type) > -1 ? type : r.pick(types);
      var g = M.g(ctx), p = GEN[t](r, ctx, g);
      p.ctx = ctx.id; p.topic = ctx.topic; p.type = t;
      return p;
    }
  });
})();
