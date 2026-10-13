/* Rotation lab model: ApPhysMath.rotationLab (docs/apphys-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apphys-tool-checks/rotation-lab.mjs) and the test
   (scripts/test/apphys-tool-rotation-lab.test.mjs) run exactly this code.
   SI units throughout.

   Rolling race (6.5): each shape has I = β m r² (given, as the CED asks;
   never memorized). Rolling without slipping links v = r ω, so
     m g h = ½ m v² + ½ β m r² (v/r)²  ->  v = √(2 g h / (1 + β))
     a = g sin θ / (1 + β) along the ramp; translational share 1/(1+β).
   A block sliding without friction is β = 0. Static friction does no work.
     roll.SHAPES          hoop, disk, sphere, block with β and a word
     roll.at(shape, t, o) { s, v, om, K, Krot, U, done } on a ramp
                          o = { theta (deg), len (m), m, r, g }
     roll.step(sh, st, dt, o)  one velocity-Verlet step of the same motion
                          (the test checks it against energy conservation)

   Spinning stool (6.4): a student on a stool holds two dumbbells at d;
     I = I0 + 2 m d², L = I ω conserved when the net external torque is zero;
     pulling in raises ω and K (the student's arms do positive work).
     stool.I(o, d), stool.omega(o, d) for o = { I0, m, d0, w0 }

   Orbit (6.6): a small satellite around a planet of mass Mp. Velocity
   Verlet in 2D (symplectic, so E and L stay put to a tiny wobble);
   U = −G Mp m / r (zero at infinity), K = ½ m v², L = m |r × v|.
     orbit.start(o)       { x, y, vx, vy } at r0 on +x moving +y at
                          o.k × the circular speed
     orbit.step(s, dt, GM) one Verlet step
     orbit.energy(s, GM, m) { K, U, E, L, r, v }
     orbit.vc(GM, r)      √(GM / r);  orbit.vesc(GM, r)  √(2 GM / r)

   generate(r, ctx, type): types race, speed, stool, orbit, ellipse. */
(function(){
  'use strict';
  var M = window.ApPhysMath;
  if(!M) return;
  var f = M.fmt;

  var SHAPES = {
    hoop: { key: 'hoop', name: 'Hoop', beta: 1, I: 'm r²', word: 'all its mass at the rim' },
    disk: { key: 'disk', name: 'Solid disk', beta: 0.5, I: '½ m r²', word: 'mass spread from center to rim' },
    sphere: { key: 'sphere', name: 'Solid sphere', beta: 0.4, I: '⅖ m r²', word: 'most of its mass near the center' },
    block: { key: 'block', name: 'Sliding block (no friction)', beta: 0, I: 'none (it does not turn)', word: 'no rotation at all' }
  };
  var roll = {
    SHAPES: SHAPES,
    accel: function(beta, theta, g){ return (g || M.C.g) * Math.sin(M.rad(theta)) / (1 + beta); },
    vBottom: function(beta, h, g){ return Math.sqrt(2 * (g || M.C.g) * h / (1 + beta)); },
    at: function(sh, t, o){
      var g = o.g || M.C.g, b = SHAPES[sh].beta, a = roll.accel(b, o.theta, g), tEnd = Math.sqrt(2 * o.len / a);
      var tt = Math.min(Math.max(t, 0), tEnd), s = 0.5 * a * tt * tt, v = a * tt, m = o.m || 1, r = o.r || 0.1;
      var h = (o.len - s) * Math.sin(M.rad(o.theta));
      return { s: s, v: v, om: b ? v / r : 0, a: a, tEnd: tEnd, done: t >= tEnd, K: 0.5 * m * v * v, Krot: 0.5 * b * m * v * v, U: m * g * h, angle: b ? s / r : 0 };
    },
    step: function(sh, st, dt, o){
      var a = roll.accel(SHAPES[sh].beta, o.theta, o.g);
      return { s: st.s + st.v * dt + 0.5 * a * dt * dt, v: st.v + a * dt };
    }
  };

  var stool = {
    I: function(o, d){ return o.I0 + 2 * o.m * d * d; },
    omega: function(o, d){ return stool.I(o, o.d0) * o.w0 / stool.I(o, d); },
    K: function(o, d){ var w = stool.omega(o, d); return 0.5 * stool.I(o, d) * w * w; }
  };

  var orbit = {
    vc: function(GM, r){ return Math.sqrt(GM / r); },
    vesc: function(GM, r){ return Math.sqrt(2 * GM / r); },
    start: function(o){ return { x: o.r0, y: 0, vx: 0, vy: o.k * Math.sqrt(o.GM / o.r0) }; },
    acc: function(x, y, GM){ var r2 = x * x + y * y, r = Math.sqrt(r2), k = -GM / (r2 * r); return { ax: k * x, ay: k * y }; },
    step: function(s, dt, GM){
      var a0 = orbit.acc(s.x, s.y, GM);
      var x = s.x + s.vx * dt + 0.5 * a0.ax * dt * dt, y = s.y + s.vy * dt + 0.5 * a0.ay * dt * dt;
      var a1 = orbit.acc(x, y, GM);
      return { x: x, y: y, vx: s.vx + 0.5 * (a0.ax + a1.ax) * dt, vy: s.vy + 0.5 * (a0.ay + a1.ay) * dt };
    },
    energy: function(s, GM, m){
      var r = Math.sqrt(s.x * s.x + s.y * s.y), v2 = s.vx * s.vx + s.vy * s.vy;
      var K = 0.5 * m * v2, U = -GM * m / r;
      return { K: K, U: U, E: K + U, L: m * Math.abs(s.x * s.vy - s.y * s.vx), r: r, v: Math.sqrt(v2) };
    },
    /* For an orbit launched sideways at r0 with k × the circular speed:
       the other turning point (from E and L), or Infinity if it escapes. */
    farPoint: function(r0, k){ return k * k >= 2 ? Infinity : r0 * k * k / (2 - k * k); }
  };

  /* ----------------------------------------------------- drills */
  function num(key, label, answer, unit, o){
    o = o || {};
    var s = { key: key, kind: 'num', label: label, cell: M.cell(answer, o.rel || 0.02, o.mistakes || [], o.abs), unit: unit, practice: o.practice || '2.B' };
    if(o.hint) s.hint = o.hint;
    return s;
  }
  function choice(key, label, options, correct, why, practice, fixed){
    return { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: practice || '3.B', fixed: !!fixed };
  }
  var gTxt = function(g){ return 'Use g = ' + g + ' m/s².'; };

  function genRace(r, ctx, g){
    var all = ['hoop', 'disk', 'sphere'];
    if(ctx.block) all.push('block');
    // Three racers, at least two of them rolling.
    var pick = all.slice(); for(var i = pick.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)), t = pick[i]; pick[i] = pick[j]; pick[j] = t; }
    pick = pick.slice(0, 3);
    if(pick.filter(function(k){ return k !== 'block'; }).length < 2) pick = ['hoop', 'disk', 'sphere'];
    var h = r.pick([0.40, 0.50, 0.60, 0.80, 1.0, 1.2]), m = r.pick([0.50, 1.0, 1.5, 2.0]);
    var byB = pick.slice().sort(function(a, b){ return SHAPES[a].beta - SHAPES[b].beta; });
    var first = byB[0], last = byB[byB.length - 1];
    var ask = r.pick(pick.filter(function(k){ return k !== 'block'; }));
    var b = SHAPES[ask].beta, v = roll.vBottom(b, h, g), frac = b / (1 + b);
    var list = pick.map(function(k){ var S = SHAPES[k]; return k === 'block' ? 'a block that slides without friction' : 'a ' + S.name.toLowerCase() + ' (I = ' + S.I + ')'; });
    var text = '<p>Three objects of the same mass (' + f(m, 2) + ' kg) and, for the round ones, the same radius are released from rest together at the top of a ramp ' + f(h, 2) + ' m high: ' + list.join(', ') + '. The round ones roll without slipping. ' + gTxt(g) + '</p>';
    var names = pick.map(function(k){ return SHAPES[k].name.replace(' (no friction)', ''); });
    var opts = names.concat(['They all tie']), why = pick.map(function(k){
      return k === first ? 'Right. ' + (k === 'block' ? 'The block puts all of its energy into moving down the ramp; none goes into spinning.' : 'It has the smallest β, so the smallest share of its energy goes into spinning and the most into speed.')
        : 'Not this one. ' + (k === 'hoop' ? 'The hoop has all its mass at the rim (largest β), so half its kinetic energy goes into spinning.' : 'Another racer puts a larger share of its energy into moving down the ramp.');
    }).concat(['Mass and radius cancel, but the shape does not: the share of energy that goes into rotation, β/(1 + β), differs.']);
    var steps = [
      choice('first', 'Which one reaches the bottom first?', opts, pick.indexOf(first), why, '3.B'),
      choice('last', 'Which one reaches the bottom last?', names, pick.indexOf(last), pick.map(function(k){ return k === last ? 'Right. The largest β: the biggest share of its kinetic energy is rotational, so it is slowest.' : 'Not this one. Look for the shape with the most mass far from its axis (the largest β).'; }), '3.B'),
      num('v', 'The ' + SHAPES[ask].name.toLowerCase() + '\'s speed at the bottom', v, 'm/s', { practice: '2.A', hint: 'm g h = ½ m v² + ½ I ω², with ω = v / r.', mistakes: [
        { value: Math.sqrt(2 * g * h), why: 'That is the speed with no rotation (a frictionless slide). A rolling object also stores ½ I ω², so it is slower: v = √(2 g h / (1 + β)).' },
        { value: Math.sqrt(g * h / (1 + b)), why: 'Check the 2 in m g h = ½ (1 + β) m v².' },
        { value: Math.sqrt(2 * g * h * (1 + b)), why: 'The factor (1 + β) divides: more rotational inertia means a slower roll.' }] }),
      num('frac', 'What fraction of its kinetic energy at the bottom is rotational?', frac, '', { practice: '2.C', rel: 0.02, abs: 0.004, mistakes: [
        { value: b, why: 'That is β itself. The rotational share is ½ β m v² out of ½ (1 + β) m v², so β / (1 + β).' },
        { value: 1 / (1 + b), why: 'That is the translational share. The rotational share is β / (1 + β).' }] })
    ];
    return { type: 'race', text: text, steps: steps, values: { pick: pick, h: h, m: m, ask: ask, g: g }, fig: { kind: 'race', pick: pick, h: h },
      solution: [
        'Energy: m g h = ½ m v² + ½ β m r² ω², and rolling gives ω = v / r, so m g h = ½ (1 + β) m v². Mass and radius cancel.',
        'v = √(2 g h / (1 + β)): the smaller β, the faster. Order: ' + byB.map(function(k){ return SHAPES[k].name + ' (β = ' + SHAPES[k].beta + ')'; }).join(', then ') + '.',
        SHAPES[ask].name + ': v = √(2 × ' + g + ' × ' + f(h, 2) + ' / (1 + ' + b + ')) = ' + f(v, 3) + ' m/s.',
        'Rotational share: β / (1 + β) = ' + b + ' / ' + f(1 + b, 2) + ' = ' + f(frac, 3) + '. Static friction makes it roll but does no work on a rolling object.'
      ] };
  }

  function genSpeed(r, ctx, g){
    var sh = r.pick(['hoop', 'disk', 'sphere']), S = SHAPES[sh];
    var m = r.pick([0.50, 1.2, 2.0, 2.5, 3.0]), rad = r.pick([0.050, 0.080, 0.10, 0.15, 0.20]);
    var len = r.pick([1.5, 2.0, 2.5, 3.0]), th = r.pick([15, 20, 25, 30]);
    var h = len * Math.sin(M.rad(th)), v = roll.vBottom(S.beta, h, g), om = v / rad, Kr = 0.5 * S.beta * m * v * v;
    var text = '<p>A ' + S.name.toLowerCase() + ' (mass ' + f(m, 2) + ' kg, radius ' + f(rad, 2) + ' m, I = ' + S.I + ') starts from rest and rolls without slipping ' + f(len, 2) + ' m down a ramp tilted ' + th + '° above the horizontal. ' + gTxt(g) + '</p>';
    var steps = [
      num('h', 'The height it drops', h, 'm', { practice: '2.B', mistakes: [
        { value: len, why: 'That is the distance along the ramp. The drop is d sin θ.' },
        { value: len * Math.cos(M.rad(th)), why: 'That uses cos θ (the horizontal distance). The drop is d sin θ.' }] }),
      num('v', 'Its speed at the bottom', v, 'm/s', { practice: '2.A', mistakes: [
        { value: Math.sqrt(2 * g * h), why: 'That ignores the rotational energy. Use m g h = ½ (1 + β) m v² with β = ' + S.beta + '.' },
        { value: Math.sqrt(2 * g * len / (1 + S.beta)), why: 'That uses the ramp length as the height. The drop is d sin θ.' }] }),
      num('om', 'Its angular speed at the bottom', om, 'rad/s', { practice: '2.B', mistakes: [
        { value: v * rad, why: 'ω = v / r: divide by the radius.' }] }),
      num('Kr', 'Its rotational kinetic energy at the bottom', Kr, 'J', { practice: '2.B', mistakes: [
        { value: 0.5 * m * v * v, why: 'That is the translational energy ½ m v². The rotational part is ½ I ω² = ½ β m v².' },
        { value: m * g * h, why: 'That is all of the energy. Only the share β / (1 + β) is rotational.' }] })
    ];
    return { type: 'speed', text: text, steps: steps, values: { sh: sh, m: m, rad: rad, len: len, th: th, g: g }, fig: { kind: 'ramp', sh: sh, th: th },
      solution: [
        'Drop: h = d sin θ = ' + f(len, 2) + ' × sin ' + th + '° = ' + f(h, 3) + ' m.',
        'm g h = ½ m v² + ½ I ω² with ω = v / r and I = ' + S.beta + ' m r²: v = √(2 g h / (1 + ' + S.beta + ')) = ' + f(v, 3) + ' m/s.',
        'ω = v / r = ' + f(v, 3) + ' / ' + f(rad, 2) + ' = ' + f(om, 3) + ' rad/s.',
        'K_rot = ½ I ω² = ½ × ' + S.beta + ' × ' + f(m, 2) + ' × ' + f(v, 3) + '² = ' + f(Kr, 3) + ' J, the share ' + f(S.beta / (1 + S.beta), 3) + ' of the total ' + f(m * g * h, 3) + ' J.'
      ] };
  }

  function genStool(r, ctx){
    var I0 = r.pick([1.2, 1.5, 1.8, 2.0, 2.4]), m = r.pick([2.0, 2.5, 3.0, 4.0, 5.0]);
    var d0 = r.pick([0.70, 0.75, 0.80, 0.90]), d1 = r.pick([0.15, 0.20, 0.25, 0.30]), w0 = r.pick([1.5, 2.0, 2.5, 3.0, 4.0]);
    var o = { I0: I0, m: m, d0: d0, w0: w0 }, Ii = stool.I(o, d0), If = stool.I(o, d1), wf = Ii * w0 / If;
    var Ki = 0.5 * Ii * w0 * w0, Kf = 0.5 * If * wf * wf;
    var text = '<p>A student sits on a stool that turns freely. The student and stool have rotational inertia ' + f(I0, 2) + ' kg·m² about the axis, not counting two ' + f(m, 2) + ' kg dumbbells, one in each hand. Spinning at ' + f(w0, 2) + ' rad/s with arms out (each dumbbell ' + f(d0, 2) + ' m from the axis), the student pulls the dumbbells in to ' + f(d1, 2) + ' m. Treat the dumbbells as points.</p>';
    var steps = [
      num('Ii', 'The rotational inertia with arms out', Ii, 'kg·m²', { practice: '2.B', mistakes: [
        { value: I0 + m * d0 * d0, why: 'There are two dumbbells: add 2 m d².' },
        { value: I0 + 2 * m * d0, why: 'Each dumbbell contributes m d²: square the distance.' }] }),
      num('If', 'The rotational inertia with arms in', If, 'kg·m²', { practice: '2.B', mistakes: [
        { value: I0 + m * d1 * d1, why: 'There are two dumbbells: add 2 m d².' }] }),
      num('wf', 'The angular speed with arms in', wf, 'rad/s', { practice: '2.A', mistakes: [
        { value: If * w0 / Ii, why: 'That has the ratio upside down. L = I ω is the same, so a smaller I means a larger ω: ω_f = I_i ω_i / I_f.' },
        { value: w0 * Math.sqrt(Ii / If), why: 'That conserves kinetic energy. With no external torque it is angular momentum that is conserved.' }] }),
      num('dK', 'The change in rotational kinetic energy', Kf - Ki, 'J', { practice: '2.B', mistakes: [
        { value: 0, why: 'Kinetic energy is not conserved here: the student\'s arms do work pulling the dumbbells in.' },
        { value: Ki - Kf, why: 'The sign: K goes up, because ω rises more than I falls (K = L² / 2I).' }] }),
      choice('src', 'Where does the extra kinetic energy come from?', ['Work done by the student\'s muscles pulling the dumbbells in', 'Angular momentum turned into energy', 'Nowhere: the energy was already there and is conserved', 'A torque from the floor on the stool'], 0,
        ['Right. The student pulls inward on the dumbbells, which move inward: positive work, from chemical energy in the muscles.',
         'Angular momentum and energy are different quantities; one does not turn into the other. L stays the same here.',
         'The kinetic energy does change (you just computed it). Something did work.',
         'The stool turns freely: no external torque acts, which is exactly why L is conserved.'], '3.C')
    ];
    return { type: 'stool', text: text, steps: steps, values: o, fig: { kind: 'stool', d0: d0, d1: d1 },
      solution: [
        'I = I₀ + 2 m d². Arms out: ' + f(I0, 2) + ' + 2 × ' + f(m, 2) + ' × ' + f(d0, 2) + '² = ' + f(Ii, 3) + ' kg·m². Arms in: ' + f(If, 3) + ' kg·m².',
        'No external torque about the axis, so L = I ω is conserved: ω_f = ' + f(Ii, 3) + ' × ' + f(w0, 2) + ' / ' + f(If, 3) + ' = ' + f(wf, 3) + ' rad/s.',
        'K = ½ I ω²: ' + f(Ki, 3) + ' J before, ' + f(Kf, 3) + ' J after, a change of ' + f(Kf - Ki, 3) + ' J (K = L² / 2I, so a smaller I with the same L means more K).',
        'The student\'s arms supply that energy by doing work on the dumbbells.'
      ] };
  }

  var PLANETS = [
    { name: 'Earth', GM: 3.986e14, R: 6.37e6 },
    { name: 'Mars', GM: 4.283e13, R: 3.39e6 },
    { name: 'the Moon', GM: 4.905e12, R: 1.74e6 }
  ];
  function genOrbit(r, ctx){
    var P = r.pick(ctx.planets ? PLANETS.filter(function(p){ return ctx.planets.indexOf(p.name) > -1; }) : PLANETS);
    var alt = r.pick([300, 400, 500, 800, 1000, 2000]) * 1000, R1 = P.R + alt, m = r.pick([500, 800, 1200, 2000, 3500]);
    var k = r.pick([4, 9, 16]);
    var v = orbit.vc(P.GM, R1), E = -P.GM * m / (2 * R1);
    var text = '<p>A ' + f(m, 2) + ' kg satellite moves in a circular orbit ' + f(alt / 1000, 3) + ' km above the surface of ' + P.name + ' (radius ' + f(P.R, 3) + ' m). G M for ' + P.name + ' is ' + f(P.GM, 4) + ' m³/s².</p>';
    var steps = [
      num('r', 'The orbit\'s radius, measured from the center of ' + P.name, R1, 'm', { practice: '2.B', rel: 0.005, mistakes: [
        { value: alt, why: 'That is the height above the surface. Gravity\'s distance is from the center: R + h.' }] }),
      num('v', 'The satellite\'s speed', v, 'm/s', { practice: '2.A', hint: 'Gravity supplies the centripetal force: G M m / r² = m v² / r.', mistakes: [
        { value: orbit.vc(P.GM, alt), why: 'Use the radius from the center (R + h), not the altitude.' },
        { value: orbit.vesc(P.GM, R1), why: 'That is the escape speed √(2 G M / r). A circular orbit needs √(G M / r).' },
        { value: P.GM / R1, why: 'Take the square root: v² = G M / r.' }] }),
      num('E', 'The satellite-planet system\'s total mechanical energy', E, 'J', { practice: '2.B', mistakes: [
        { value: -E, why: 'A bound orbit has negative total energy (U = 0 at infinity, and |U| = 2K here).' },
        { value: -P.GM * m / R1, why: 'That is U alone. Add K = ½ m v² = G M m / 2r: E = −G M m / 2r.' }] }),
      choice('scale', 'Another satellite circles ' + P.name + ' at ' + k + ' times this orbit\'s radius. Its speed is', ['1/' + k + ' as much', '1/' + Math.round(Math.sqrt(k)) + ' as much', Math.round(Math.sqrt(k)) + ' times as much', 'the same: speed does not depend on the radius'], 1,
        ['v ∝ 1/√r, not 1/r. The square root matters.', 'Right. v = √(G M / r): ' + k + ' times the radius gives 1/√' + k + ' = 1/' + Math.round(Math.sqrt(k)) + ' the speed.', 'A higher orbit is slower: gravity there is weaker, so less speed is needed to stay in a circle.', 'v = √(G M / r) depends on r (and not on the satellite\'s mass).'], '2.D', true)
    ];
    return { type: 'orbit', text: text, steps: steps, values: { planet: P.name, GM: P.GM, R: P.R, alt: alt, m: m, k: k }, fig: { kind: 'orbit', e: 0 },
      solution: [
        'r = R + h = ' + f(P.R, 3) + ' + ' + f(alt, 3) + ' = ' + f(R1, 4) + ' m.',
        'Gravity is the centripetal force: G M m / r² = m v² / r, so v = √(G M / r) = ' + f(v, 4) + ' m/s.',
        'U = −G M m / r, K = ½ m v² = G M m / 2r, so E = K + U = −G M m / 2r = ' + f(E, 4) + ' J.',
        'v ∝ 1/√r: ' + k + ' times the radius gives 1/' + Math.round(Math.sqrt(k)) + ' of the speed. The satellite\'s mass cancels.'
      ] };
  }

  function genEllipse(r, ctx){
    var rp = r.pick([7.0, 7.5, 8.0, 9.0]) * 1e6, ratio = r.pick([1.5, 2.0, 2.5, 3.0]), ra = rp * ratio;
    var GM = 3.986e14, m = r.pick([400, 600, 1000, 1500]);
    // From E and L conservation: v_p = √(2 GM ra / (rp (rp + ra))). The
    // problem prints v_p to 4 figures; r_a follows from that printed value
    // (also printed to 4 figures), so what the student reads is consistent.
    var vp = M.sig(Math.sqrt(2 * GM * ra / (rp * (rp + ra))), 4);
    ra = M.sig(rp * vp * vp / (2 * GM / rp - vp * vp), 4);
    var va = vp * rp / ra;
    var dK = 0.5 * m * (vp * vp - va * va);
    var text = '<p>A ' + f(m, 2) + ' kg satellite moves on an elliptical orbit around Earth (G M = ' + f(GM, 4) + ' m³/s²). At its closest point it is ' + f(rp, 3) + ' m from Earth\'s center and moving at ' + f(vp, 4) + ' m/s; at its farthest point it is ' + f(ra, 4) + ' m away. At both points its velocity is perpendicular to the line to Earth\'s center.</p>';
    var steps = [
      num('va', 'Its speed at the farthest point', va, 'm/s', { practice: '2.A', hint: 'No torque about Earth\'s center: L = r m v (velocity perpendicular to r) is the same at both points.', mistakes: [
        { value: vp * ra / rp, why: 'Upside down: farther out means slower. r_p v_p = r_a v_a, so v_a = v_p r_p / r_a.' },
        { value: vp * Math.sqrt(rp / ra), why: 'That is the circular-orbit scaling √(r₁/r₂). On one ellipse use angular momentum: v_a = v_p r_p / r_a.' },
        { value: vp, why: 'The speed changes along an ellipse; only E and L stay the same.' }] }),
      num('dK', 'How much kinetic energy it loses going from the closest to the farthest point', dK, 'J', { practice: '2.B', rel: 0.03, mistakes: [
        { value: 0.5 * m * (vp - va) * (vp - va), why: 'ΔK is ½ m v_p² − ½ m v_a², not ½ m (v_p − v_a)².' }] }),
      choice('E', 'Over the same trip, what happens to the system\'s gravitational potential energy and total energy?', ['U rises by the same amount K falls; E stays the same', 'U falls and K falls; E falls', 'U and K both stay the same, as on a circle', 'U rises and E rises'], 0,
        ['Right. Only gravity, an internal conservative force, does work: E = K + U is constant, so ΔU = −ΔK = +' + f(dK, 3) + ' J.',
         'Moving farther out, U = −G M m / r gets less negative: it rises.',
         'Only on a circle are U and K constant. On an ellipse r changes, so U and K trade off.',
         'Nothing outside the satellite-Earth system does work, so E is constant.'], '3.B')
    ];
    return { type: 'ellipse', text: text, steps: steps, values: { rp: rp, ra: ra, vp: vp, GM: GM, m: m }, fig: { kind: 'orbit', e: (ra - rp) / (ra + rp) },
      solution: [
        'Gravity points at Earth\'s center, so it exerts no torque about it: L is conserved. With v ⊥ r at both points, r_p m v_p = r_a m v_a.',
        'v_a = v_p r_p / r_a = ' + f(vp, 4) + ' × ' + f(rp, 3) + ' / ' + f(ra, 4) + ' = ' + f(va, 4) + ' m/s.',
        'ΔK = ½ m (v_p² − v_a²) = ' + f(dK, 3) + ' J lost.',
        'E = K + U is constant (no outside work), so U = −G M m / r rises by the same ' + f(dK, 3) + ' J.'
      ] };
  }

  var GEN = { race: function(r, c, g){ return genRace(r, c, g); }, speed: genSpeed, stool: genStool, orbit: genOrbit, ellipse: genEllipse };
  M.register('rotationLab', {
    roll: roll, stool: stool, orbit: orbit, PLANETS: PLANETS, TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var types = ctx.types || ['race'];
      var t = type && types.indexOf(type) > -1 ? type : r.pick(types);
      var p = GEN[t](r, ctx, M.g(ctx));
      p.ctx = ctx.id; p.topic = ctx.topic; p.type = t;
      return p;
    }
  });
})();
