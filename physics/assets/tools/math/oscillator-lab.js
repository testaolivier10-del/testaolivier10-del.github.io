/* Oscillator lab model: ApPhysMath.oscillatorLab (docs/apphys-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apphys-tool-checks/oscillator-lab.mjs) and the test
   (scripts/test/apphys-tool-oscillator-lab.test.mjs) run exactly this code.
   SI units throughout.

   The Explore scene integrates the real equations of motion (velocity
   Verlet; RK4 for the pendulum), so what the student sees is measured, not
   painted from a formula:
     spring  m x'' = −k x  (horizontal; vertical is the same about the
             stretched equilibrium, which sits m g / k below the unstretched end)
     pendulum ℓ θ'' = −g sin θ   (the full equation: at small angles the period
             is 2π√(ℓ/g); at large ones it is longer, and the page says so)
   sys = { type: 'spring' | 'vspring' | 'pendulum', m, k, L, g, A }
     A: amplitude in m (springs) or the release angle in degrees (pendulum).
     init(sys)              { t: 0, x, v } released from rest at +A
     step(sys, s, dt)       one step; x is m (springs) or rad (pendulum)
     accel(sys, x)          a (m/s², or rad/s² for the pendulum)
     energy(sys, s)         { K, Us, Ug, E }: K + Us + Ug is constant
                             (vertical spring: Ug zero at the lowest point;
                             pendulum: Ug zero at the bottom)
     period(sys)            the formula: 2π√(m/k) or 2π√(ℓ/g)
     measure(sys, n)        the period measured from the simulation (time
                            between successive same-direction zero crossings)
     largeAngle(thetaDeg)   the true period ÷ the small-angle one (series)

   generate(r, ctx, type): types period, change, points, energy, graph. */
(function(){
  'use strict';
  var M = window.ApPhysMath;
  if(!M) return;
  var f = M.fmt;
  var TAU = 2 * Math.PI;

  function isPend(sys){ return sys.type === 'pendulum'; }
  function accel(sys, x){ return isPend(sys) ? -sys.g / sys.L * Math.sin(x) : -sys.k / sys.m * x; }
  function init(sys){ return { t: 0, x: isPend(sys) ? M.rad(sys.A) : sys.A, v: 0 }; }
  function step(sys, s, dt){
    if(isPend(sys)){
      // RK4 on (θ, ω)
      var a = function(x){ return accel(sys, x); };
      var k1x = s.v, k1v = a(s.x);
      var k2x = s.v + 0.5 * dt * k1v, k2v = a(s.x + 0.5 * dt * k1x);
      var k3x = s.v + 0.5 * dt * k2v, k3v = a(s.x + 0.5 * dt * k2x);
      var k4x = s.v + dt * k3v, k4v = a(s.x + dt * k3x);
      return { t: s.t + dt, x: s.x + dt / 6 * (k1x + 2 * k2x + 2 * k3x + k4x), v: s.v + dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v) };
    }
    var a0 = accel(sys, s.x), x = s.x + s.v * dt + 0.5 * a0 * dt * dt, a1 = accel(sys, x);
    return { t: s.t + dt, x: x, v: s.v + 0.5 * (a0 + a1) * dt };
  }
  /* Advance by a frame's dt in small substeps (stable at any frame rate). */
  function advance(sys, s, dt, h){
    h = h || 0.002;
    var n = Math.max(1, Math.ceil(dt / h)), d = dt / n;
    for(var i = 0; i < n; i++) s = step(sys, s, d);
    return s;
  }
  function energy(sys, s){
    if(isPend(sys)){
      var vv = sys.L * s.v;
      return { K: 0.5 * sys.m * vv * vv, Us: 0, Ug: sys.m * sys.g * sys.L * (1 - Math.cos(s.x)), E: 0.5 * sys.m * vv * vv + sys.m * sys.g * sys.L * (1 - Math.cos(s.x)) };
    }
    var K = 0.5 * sys.m * s.v * s.v;
    if(sys.type === 'vspring'){
      // x measured downward from equilibrium (x = +A is the lowest point);
      // the spring's stretch there is m g / k + x.
      var x0 = sys.m * sys.g / sys.k, st = x0 + s.x, Us = 0.5 * sys.k * st * st, Ug = sys.m * sys.g * (sys.A - s.x);
      return { K: K, Us: Us, Ug: Ug, E: K + Us + Ug };
    }
    var U = 0.5 * sys.k * s.x * s.x;
    return { K: K, Us: U, Ug: 0, E: K + U };
  }
  function period(sys){ return isPend(sys) ? TAU * Math.sqrt(sys.L / sys.g) : TAU * Math.sqrt(sys.m / sys.k); }
  function measure(sys, n){
    n = n || 3;
    var s = init(sys), T0 = period(sys), h = T0 / 4000, cross = [];
    for(var i = 0; i < 4000 * (n + 2) && cross.length < n + 1; i++){
      var s2 = step(sys, s, h);
      if(s.x > 0 && s2.x <= 0) cross.push(s.t + h * s.x / (s.x - s2.x));
      s = s2;
    }
    return cross.length > 1 ? (cross[cross.length - 1] - cross[0]) / (cross.length - 1) : NaN;
  }
  function largeAngle(deg){
    var t = M.rad(deg), k = Math.sin(t / 2), k2 = k * k;
    // T/T0 = 1 + (1/4)k² + (9/64)k⁴ + (25/256)k⁶ + (1225/16384)k⁸ (k = sin(θ₀/2))
    return 1 + k2 / 4 + 9 * k2 * k2 / 64 + 25 * k2 * k2 * k2 / 256 + 1225 * k2 * k2 * k2 * k2 / 16384;
  }
  var PLANETS = [{ name: 'Earth', g: 9.8 }, { name: 'the Moon', g: 1.62 }, { name: 'Mars', g: 3.71 }, { name: 'Jupiter', g: 24.8 }];

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

  function genPeriod(r, ctx, g){
    if(r() < 0.5){
      var m = r.pick([0.20, 0.25, 0.40, 0.50, 0.80, 1.2, 2.0]), k = r.pick([20, 25, 40, 50, 80, 100, 150, 200]);
      var T = TAU * Math.sqrt(m / k), A = r.pick([0.030, 0.050, 0.080, 0.10]);
      var text = '<p>A ' + f(m, 2) + ' kg cart is attached to a spring of spring constant ' + f(k, 2) + ' N/m on a level, frictionless track. It is pulled ' + f(A, 2) + ' m from equilibrium and released.</p>';
      return { type: 'period', text: text, values: { sys: 'spring', m: m, k: k, A: A }, fig: { kind: 'spring', A: A },
        steps: [
          num('T', 'The period of the oscillation', T, 's', { practice: '2.B', mistakes: [
            { value: TAU * Math.sqrt(k / m), why: 'Upside down: T = 2π√(m/k). A heavier cart is slower, so m goes on top.' },
            { value: Math.sqrt(m / k), why: 'Include the 2π: T = 2π√(m/k).' },
            { value: TAU * m / k, why: 'Take the square root: T = 2π√(m/k).' }] }),
          num('f', 'The frequency', 1 / T, 'Hz', { practice: '2.B', mistakes: [
            { value: TAU / T, why: 'That is the angular frequency ω = 2π/T (in rad/s). The frequency is f = 1/T.' }] }),
          choice('amp', 'If the cart were pulled twice as far before release, the period would', ['stay the same', 'double', 'halve', 'grow by √2'], 0,
            ['Right. In SHM the period does not depend on the amplitude: twice as far, but the force is twice as big, so it moves twice as fast.', 'The restoring force also doubles, so the cart covers the longer path faster. T = 2π√(m/k) has no A in it.', 'T = 2π√(m/k) has no amplitude in it.', 'T = 2π√(m/k) has no amplitude in it.'], '2.D', true)
        ],
        solution: ['T = 2π√(m/k) = 2π√(' + f(m, 2) + ' / ' + f(k, 2) + ') = ' + f(T, 3) + ' s.', 'f = 1/T = ' + f(1 / T, 3) + ' Hz.', 'The amplitude (' + f(A, 2) + ' m) does not enter: the period of SHM is independent of amplitude.'] };
    }
    var P = r.pick(ctx.planets ? PLANETS.filter(function(p){ return ctx.planets.indexOf(p.name) > -1; }) : PLANETS);
    var gg = P.name === 'Earth' ? g : P.g;
    var L = r.pick([0.25, 0.40, 0.50, 0.60, 0.80, 1.0, 1.5, 2.0]), mm = r.pick([0.10, 0.20, 0.50, 1.0]);
    var T2 = TAU * Math.sqrt(L / gg), ang = r.pick([4, 5, 6, 8, 10]);
    var text2 = '<p>A ' + f(mm, 2) + ' kg bob hangs from a light string ' + f(L, 2) + ' m long on ' + P.name + ' (g = ' + gg + ' m/s²). It is pulled ' + ang + '° to the side and released.</p>';
    return { type: 'period', text: text2, values: { sys: 'pendulum', m: mm, L: L, g: gg, planet: P.name }, fig: { kind: 'pendulum', ang: ang },
      steps: [
        num('T', 'The period of the swing', T2, 's', { practice: '2.B', mistakes: [
          { value: TAU * Math.sqrt(gg / L), why: 'Upside down: T = 2π√(ℓ/g). A longer string swings more slowly.' },
          { value: Math.sqrt(L / gg), why: 'Include the 2π: T = 2π√(ℓ/g).' },
          { value: TAU * Math.sqrt(mm / gg), why: 'The bob\'s mass does not enter a pendulum\'s period: T = 2π√(ℓ/g).' },
          { value: TAU * Math.sqrt(L / 9.8), why: 'That uses Earth\'s g. This pendulum is on ' + P.name + ': g = ' + gg + ' m/s².' }] }),
        num('f', 'The frequency', 1 / T2, 'Hz', { practice: '2.B', mistakes: [
          { value: TAU / T2, why: 'That is ω = 2π/T. The frequency is f = 1/T.' }] }),
        choice('mass', 'A bob with twice the mass on the same string would have a period that is', ['the same', 'twice as long', '√2 times as long', 'half as long'], 0,
          ['Right. Gravity\'s pull and the bob\'s inertia both grow with m, so m cancels: T = 2π√(ℓ/g).', 'Mass cancels for a pendulum (it is the spring\'s period that grows with m).', 'That is how a spring responds to mass. For a pendulum, m cancels.', 'Mass cancels for a pendulum.'], '2.D', true)
      ],
      solution: ['T = 2π√(ℓ/g) = 2π√(' + f(L, 2) + ' / ' + gg + ') = ' + f(T2, 3) + ' s (small angle, so the pendulum is close to SHM).', 'f = 1/T = ' + f(1 / T2, 3) + ' Hz.', 'The mass cancels: twice the mass, twice the gravitational force, twice the inertia.'] };
  }

  /* change: functional dependence. */
  var FACTORS = [4, 9, 16, 0.25];
  function ftxt(k){ return k === 0.25 ? 'one quarter' : k + ' times'; }
  function genChange(r, ctx){
    var which = r.pick(['m', 'k', 'L', 'g', 'A', 'mp']), k = r.pick(FACTORS);
    var sys = which === 'L' || which === 'g' || which === 'mp' ? 'pendulum' : 'spring';
    var thing = { m: 'the mass on the spring', k: 'the spring constant', L: 'the pendulum\'s length', g: 'the gravitational field (another planet)', A: 'the spring\'s amplitude', mp: 'the pendulum bob\'s mass' }[which];
    var ratio = which === 'm' || which === 'L' ? Math.sqrt(k) : which === 'k' || which === 'g' ? 1 / Math.sqrt(k) : 1;
    var T0 = r.pick([0.80, 1.2, 1.5, 2.0, 2.4]);
    var text = '<p>A ' + (sys === 'spring' ? 'mass on a spring' : 'simple pendulum (small swings)') + ' has a period of ' + f(T0, 2) + ' s. Then ' + thing + ' is made ' + ftxt(k) + ' as ' + (k < 1 ? 'large as before' : 'large') + ', and nothing else changes.</p>';
    // Options: ×√k, ×1/√k, ×k, ×1 (written as fractions for k = 1/4).
    var sk = Math.sqrt(k), opts = k < 1 ? ['×1/2', '×2', '×1/4', '×1 (no change)'] : ['×' + sk, '×1/' + sk, '×' + k, '×1 (no change)'];
    var right = ratio === 1 ? 3 : Math.abs(ratio - sk) < 1e-9 ? 0 : 1;
    var rule = sys === 'spring' ? 'T = 2π√(m/k)' : 'T = 2π√(ℓ/g)';
    var why = [
      ratio !== 1 && right === 0 ? 'Right. ' + rule + ': the period goes as the square root of the change.' : ratio === 1 ? 'The period does not depend on ' + thing + '.' : 'Check which side of the fraction it is on: ' + rule + '.',
      ratio !== 1 && right === 1 ? 'Right. ' + rule + ': it sits under the square root in the denominator.' : ratio === 1 ? 'The period does not depend on ' + thing + '.' : 'Check which side of the fraction it is on: ' + rule + '.',
      ratio === 1 ? 'The period does not depend on ' + thing + '.' : 'The period goes as a square root: it changes by × ' + (ratio > 1 ? Math.round(ratio) : '1/' + Math.round(1 / ratio)) + ', not by the same factor as ' + thing + '.',
      ratio === 1 ? 'Right. ' + rule + ' has no ' + (which === 'A' ? 'amplitude' : 'mass') + ' in it.' : 'It does change: ' + thing + ' is in ' + rule + '.'
    ];
    var T1 = T0 * ratio;
    return { type: 'change', text: text, values: { which: which, k: k, T0: T0, sys: sys }, fig: { kind: sys === 'spring' ? 'spring' : 'pendulum', A: 0.05, ang: 6 },
      steps: [
        choice('factor', 'By what factor does the period change?', opts, right, why, '2.D', true),
        num('T', 'The new period', T1, 's', { practice: '2.D', mistakes: ratio === 1 ? [{ value: T0 * k, why: 'The period does not depend on ' + thing + '.' }, { value: T0 * Math.sqrt(k), why: 'The period does not depend on ' + thing + '.' }] : [
          { value: T0 * k, why: 'The period changes with the square root: × ' + f(ratio, 2) + ', not × ' + ftxt(k) + '.' },
          { value: T0 / ratio, why: 'The other way round: ' + rule + '.' }] }),
        num('f', 'The new frequency', 1 / T1, 'Hz', { practice: '2.B', mistakes: [{ value: T1, why: 'That is the period. f = 1/T.' }] })
      ],
      solution: [rule + '. ' + (ratio === 1 ? 'There is no ' + (which === 'A' ? 'amplitude' : 'bob mass') + ' in it, so the period is unchanged.' : 'Making ' + thing + ' ' + ftxt(k) + ' as large multiplies T by ' + (ratio > 1 ? '√' : '1/√') + (k < 1 ? '(' + (ratio > 1 ? '1/4' : '4') + ')' : k) + ' = ' + f(ratio, 2) + '.'),
        'New period ' + f(T0, 2) + ' × ' + f(ratio, 2) + ' = ' + f(T1, 3) + ' s; frequency 1/T = ' + f(1 / T1, 3) + ' Hz.'] };
  }

  /* points: where speed and acceleration are largest, with values. */
  function genPoints(r, ctx){
    var m = r.pick([0.25, 0.40, 0.50, 1.0, 2.0]), k = r.pick([16, 25, 36, 50, 64, 100]), A = r.pick([0.040, 0.050, 0.080, 0.10, 0.12]);
    var w = Math.sqrt(k / m), vmax = A * w, amax = A * w * w;
    var text = '<p>A ' + f(m, 2) + ' kg block on a frictionless table is attached to a spring (k = ' + f(k, 2) + ' N/m) and oscillates with an amplitude of ' + f(A, 2) + ' m.</p>';
    var PTS = ['At equilibrium (x = 0)', 'At either end (x = ±A)', 'Halfway between, at x = ±A/2', 'It is the same everywhere'];
    return { type: 'points', text: text, values: { m: m, k: k, A: A }, fig: { kind: 'spring', A: A },
      steps: [
        choice('vmaxAt', 'Where is the block\'s speed largest?', PTS, 0, ['Right. All the energy is kinetic there: the spring is relaxed and U = 0.', 'At the ends the block stops for an instant to turn around: v = 0.', 'Speed is still rising there; it peaks at x = 0.', 'Speed changes all the time in SHM.'], '3.B', true),
        choice('amaxAt', 'Where is its acceleration largest?', PTS, 1, ['At x = 0 the spring exerts no force, so a = 0 (even though the speed is largest).', 'Right. The spring force kx is largest at the largest stretch, so a = kx/m is too.', 'a = −kx/m: largest where |x| is largest, at the ends.', 'a is proportional to x, so it changes.'], '3.B', true),
        num('vmax', 'The block\'s greatest speed', vmax, 'm/s', { practice: '2.A', hint: '½ k A² = ½ m v_max².', mistakes: [
          { value: A * k / m, why: 'v_max = A√(k/m): take the square root of k/m.' },
          { value: amax, why: 'That is the greatest acceleration, k A / m.' }] }),
        num('amax', 'The block\'s greatest acceleration', amax, 'm/s²', { practice: '2.B', mistakes: [
          { value: k * A, why: 'That is the force k A. Divide by the mass: a = k A / m.' },
          { value: vmax, why: 'That is the greatest speed.' }] })
      ],
      solution: ['Speed is greatest at x = 0, where U = 0 and all the energy is kinetic; acceleration is greatest at x = ±A, where the spring force is largest.', 'Energy: ½ k A² = ½ m v_max², so v_max = A√(k/m) = ' + f(A, 2) + ' × √(' + f(k, 2) + ' / ' + f(m, 2) + ') = ' + f(vmax, 3) + ' m/s.', 'Force: a_max = k A / m = ' + f(k, 2) + ' × ' + f(A, 2) + ' / ' + f(m, 2) + ' = ' + f(amax, 3) + ' m/s².'] };
  }

  /* energy: E = ½kA², K and speed at a given x. */
  function genEnergy(r, ctx){
    var m = r.pick([0.20, 0.50, 0.80, 1.0, 1.5]), k = r.pick([20, 40, 50, 80, 120, 200]), A = r.pick([0.050, 0.080, 0.10, 0.15, 0.20]);
    var frac = r.pick([0.25, 0.4, 0.5, 0.6, 0.75]), x = M.sig(A * frac, 2);
    var E = 0.5 * k * A * A, U = 0.5 * k * x * x, K = E - U, v = Math.sqrt(2 * K / m);
    var text = '<p>A ' + f(m, 2) + ' kg glider on an air track is attached to a spring (k = ' + f(k, 2) + ' N/m). It oscillates with an amplitude of ' + f(A, 2) + ' m. Consider the moment it passes x = ' + f(x, 2) + ' m from equilibrium.</p>';
    return { type: 'energy', text: text, values: { m: m, k: k, A: A, x: x }, fig: { kind: 'spring', A: A, x: x },
      steps: [
        num('E', 'The total mechanical energy of the glider-spring system', E, 'J', { practice: '2.B', mistakes: [
          { value: k * A * A, why: 'Spring energy is ½ k A²: check the ½.' },
          { value: 0.5 * k * A, why: 'Square the amplitude: ½ k A².' }] }),
        num('U', 'The spring\'s potential energy at x = ' + f(x, 2) + ' m', U, 'J', { practice: '2.B', mistakes: [
          { value: 0.5 * k * Math.pow(A - x, 2), why: 'x is measured from equilibrium, so U = ½ k x² with x = ' + f(x, 2) + ' m.' }] }),
        num('K', 'The glider\'s kinetic energy there', K, 'J', { practice: '2.B', mistakes: [
          { value: U, why: 'That is U. K is what is left of the total: K = E − U.' },
          { value: E, why: 'That is all of the energy; part of it is in the spring at this point.' }] }),
        num('v', 'The glider\'s speed there', v, 'm/s', { practice: '2.A', mistakes: [
          { value: Math.sqrt(K / m), why: 'K = ½ m v², so v = √(2K/m).' },
          { value: A * Math.sqrt(k / m), why: 'That is the greatest speed, at x = 0. Here part of the energy is still in the spring.' }] })
      ],
      solution: ['E = ½ k A² = ½ × ' + f(k, 2) + ' × ' + f(A, 2) + '² = ' + f(E, 3) + ' J; it stays the same all through the motion.', 'U = ½ k x² = ' + f(U, 3) + ' J at x = ' + f(x, 2) + ' m.', 'K = E − U = ' + f(K, 3) + ' J, so v = √(2K/m) = ' + f(v, 3) + ' m/s.'] };
  }

  /* graph: read an x-t graph. */
  function genGraph(r, ctx){
    var A = r.pick([0.020, 0.030, 0.040, 0.050, 0.060, 0.080]), T = r.pick([0.40, 0.50, 0.80, 1.0, 1.2, 1.6, 2.0]);
    var start = r.pick(['top', 'zero-up', 'bottom']), m = r.pick([0.20, 0.50, 1.0]);
    var k = m * Math.pow(TAU / T, 2), vmax = A * TAU / T;
    var phase = start === 'top' ? 0 : start === 'bottom' ? Math.PI : -Math.PI / 2;
    // A moment to ask about: a quarter, half or three quarters of a period.
    var q = r.pick([1, 2, 3]), tq = q * T / 4, xq = A * Math.cos(TAU * tq / T + phase);
    var where = Math.abs(xq) < A * 0.01 ? 0 : xq > 0 ? 1 : 2;
    var text = '<p>The graph shows the position of a ' + f(m, 2) + ' kg object on a spring as a function of time (positive is to the right).</p>';
    var opts = ['At equilibrium, moving at its greatest speed', 'At the right end, momentarily at rest', 'At the left end, momentarily at rest'];
    return { type: 'graph', text: text, values: { A: A, T: T, start: start, m: m, q: q }, fig: { kind: 'xt', A: A, T: T, phase: phase, mark: tq },
      steps: [
        num('A', 'Read the amplitude', A, 'm', { practice: '2.B', rel: 0.02, mistakes: [{ value: 2 * A, why: 'That is the peak-to-peak distance. The amplitude is from equilibrium (x = 0) to one peak.' }] }),
        num('T', 'Read the period', T, 's', { practice: '2.B', rel: 0.02, mistakes: [{ value: T / 2, why: 'That is half a cycle. A period is peak to the next peak (or one full repeat).' }] }),
        num('k', 'The spring constant', k, 'N/m', { practice: '2.A', rel: 0.025, hint: 'T = 2π√(m/k), solved for k.', mistakes: [
          { value: m * TAU / T, why: 'Square it: k = 4π² m / T².' },
          { value: m * T * T / (4 * Math.PI * Math.PI), why: 'Upside down: k = 4π² m / T².' }] }),
        choice('at', 'At t = ' + f(tq, 3) + ' s (the marked time), where is the object?', opts, where,
          [where === 0 ? 'Right. The graph crosses x = 0 there, and its slope (the velocity) is steepest.' : 'At that time x is at a peak or trough, not at 0.',
           where === 1 ? 'Right. x is at its largest positive value, and the graph is flat there: v = 0.' : 'Read the value of x at the mark.',
           where === 2 ? 'Right. x is at its most negative value, and the graph is flat there: v = 0.' : 'Read the value of x at the mark.'], '1.C', true),
        num('vmax', 'The object\'s greatest speed', vmax, 'm/s', { practice: '2.A', rel: 0.025, hint: 'v_max = A ω with ω = 2π/T, or from energy.', mistakes: [
          { value: A / T, why: 'v_max = A ω = 2π A / T: include the 2π.' },
          { value: A * TAU / T * TAU / T, why: 'That is the greatest acceleration, A ω².' }] })
      ],
      solution: ['Amplitude: the height of a peak above x = 0, ' + f(A, 2) + ' m. Period: one full repeat, ' + f(T, 2) + ' s.', 'k = 4π² m / T² = 4π² × ' + f(m, 2) + ' / ' + f(T, 2) + '² = ' + f(k, 3) + ' N/m.', 'At t = ' + f(tq, 3) + ' s the object is ' + ['at x = 0, where the slope of x-t (its velocity) is steepest', 'at x = +A, where the slope is zero', 'at x = −A, where the slope is zero'][where] + '.', 'v_max = 2π A / T = ' + f(vmax, 3) + ' m/s.'] };
  }

  var GEN = { period: genPeriod, change: genChange, points: genPoints, energy: genEnergy, graph: genGraph };
  M.register('oscillatorLab', {
    init: init, step: step, advance: advance, accel: accel, energy: energy, period: period, measure: measure, largeAngle: largeAngle,
    PLANETS: PLANETS, TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var types = ctx.types || ['period'];
      var t = type && types.indexOf(type) > -1 ? type : r.pick(types);
      var p = GEN[t](r, ctx, M.g(ctx));
      p.ctx = ctx.id; p.topic = ctx.topic; p.type = t;
      return p;
    }
  });
})();
