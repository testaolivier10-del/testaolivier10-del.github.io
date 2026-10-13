/* Lab design model: ApPhysMath.labDesign (docs/apphys-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY. Pure functions, no DOM, SI units throughout, so the
   validator (scripts/lib/apphys-tool-checks/lab-design.mjs) and the test
   (scripts/test/apphys-tool-lab-design.test.mjs) run exactly this code.

   The Experimental Design and Analysis trainer. Six bench experiments (EXPS),
   each with what is varied and what is measured, the instruments, the
   seeded noise of each instrument, the graphs a student might make (PLOTS),
   which one is a straight line, what its slope means, the quantity derived
   from the slope, and error scenarios with their effect on that quantity.

     EXPS[id]                  the experiment (see the table below)
     INSTRUMENTS               names of the bench instruments
     params(r, exp)            the hidden true values for a run
     measure(exp, P, x, r, iv) one noisy reading at setting x (rounded to the
                               instrument's resolution); iv: an alternative
                               variable to vary (the pendulum's bob mass or
                               release angle), else the main one
     settings(exp, n)          n evenly spread settings of the main variable
     fit(points)               least squares { m, b, r2, n } for [[x, y]...]
     linearize(exp, plotId, rows)  [[X, Y]...] for that plot
     derive(exp, P, m, b)      the target quantity from the fit's slope
     generate(r, ctx)          a seeded "Test yourself" problem

   Noise (one standard deviation): meterstick 2 mm; stopwatch on 10 swings
   0.14 s (two reaction times); motion detector 2 mm in position and 1.5% +
   0.01 m/s² in acceleration; spring scale 0.02 N. g = 9.8 m/s². */
(function(){
  'use strict';
  var M = window.ApPhysMath;
  if(!M) return;
  var G = M.C.g, PI = Math.PI;

  /* Box-Muller on the seeded source: a normal deviate. */
  function gauss(r){ var u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); }
  function q(x, res){ var d = Math.max(0, Math.round(-Math.log10(res))); return M.round(Math.round(x / res) * res, d); }
  function fit(pts){
    var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
    pts.forEach(function(p){ sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; sxy += p[0] * p[1]; syy += p[1] * p[1]; });
    var d = n * sxx - sx * sx;
    if(n < 2 || Math.abs(d) < 1e-300) return { m: NaN, b: NaN, r2: NaN, n: n };
    var m = (n * sxy - sx * sy) / d, b = (sy - m * sx) / n;
    var mean = sy / n, ssT = 0, ssR = 0;
    pts.forEach(function(p){ ssT += (p[1] - mean) * (p[1] - mean); ssR += Math.pow(p[1] - (m * p[0] + b), 2); });
    return { m: m, b: b, r2: ssT > 0 ? 1 - ssR / ssT : 1, n: n };
  }

  var INSTRUMENTS = { meterstick: 'meterstick', stopwatch: 'stopwatch', detector: 'motion detector', scale: 'spring scale', balance: 'electronic balance', photogate: 'photogate', protractor: 'protractor' };

  /* Small-angle period with the next two terms of the series, so a large
     release angle makes the period measurably longer. */
  function pendT(L, th){ var t = th * PI / 180; return 2 * PI * Math.sqrt(L / G) * (1 + t * t / 16 + 11 * Math.pow(t, 4) / 3072); }

  var EXPS = {
    ramp: {
      id: 'ramp', name: 'Cart on a ramp', topic: 'motion-representations',
      wrongInst: [['scale','detector'],['balance','detector'],['meterstick','stopwatch']], control: 'angle of the ramp',
      setup: 'A cart is released from rest on a ramp. A motion detector at the top records its distance from the detector at each moment.',
      iv: { sym: 't', name: 'time since release', unit: 's', min: 0.2, max: 1.4, step: 0.1, inst: 'detector', d: 2 },
      dv: { sym: 'x', name: 'distance from the detector', unit: 'm', inst: 'detector', res: 0.001, d: 3 },
      params: function(r){ var th = r.pick([3, 4, 5, 6, 7, 8]); return { theta: th, a: G * Math.sin(th * PI / 180) * (0.96 + 0.03 * r()), x0: r.pick([0.15, 0.20, 0.25]) }; },
      truth: function(P, x){ return P.x0 + 0.5 * P.a * x * x; },
      noise: function(r){ return 0.002 * gauss(r); },
      plots: [
        { id: 'x-t', y: 'x', x: 't', X: function(x){ return x; }, Y: function(y){ return y; }, xl: 't', xu: 's', yl: 'x', yu: 'm', linear: false },
        { id: 'x-t2', y: 'x', x: 't²', X: function(x){ return x * x; }, Y: function(y){ return y; }, xl: 't²', xu: 's²', yl: 'x', yu: 'm', linear: true },
        { id: 'x-sqrt', y: 'x', x: '√t', X: function(x){ return Math.sqrt(x); }, Y: function(y){ return y; }, xl: '√t', xu: 's^½', yl: 'x', yu: 'm', linear: false },
        { id: 'x-inv', y: 'x', x: '1/t', X: function(x){ return 1 / x; }, Y: function(y){ return y; }, xl: '1/t', xu: '1/s', yl: 'x', yu: 'm', linear: false }
      ],
      slopeUnit: 'm/s²',
      best: 'x-t2',
      law: 'x = x₀ + ½at² (from rest, constant acceleration)',
      slopeMeans: 'The slope of x against t² is ½a, so a = 2 × slope. The intercept is x₀, where the cart started.',
      target: { sym: 'a', name: 'acceleration of the cart', unit: 'm/s²', from: function(m){ return 2 * m; }, true: function(P){ return P.a; },
        how: 'a = 2 × slope', mistakes: function(m){ return [{ value: m, why: 'The slope is ½a, not a: double it.' }, { value: m / 2, why: 'Divide? The slope is ½a, so a = 2 × slope.' }]; } },
      errors: [
        { id: 'zero', text: 'The motion detector\'s zero was set wrong, so every distance reads 5 cm too large.', effect: 2, why: 'Adding 5 cm to every x moves the whole line up: the intercept changes, the slope does not, so a is unchanged.' },
        { id: 'cal', text: 'The detector was calibrated wrong and reads every distance 3% too large.', effect: 0, why: 'Every x is 3% too large, so every Δx and the slope are 3% too large, and a = 2 × slope comes out too large.' },
        { id: 'angle', text: 'The ramp was steeper than the student wrote down.', effect: 2, why: 'The angle is not used to get a from the graph. The measured motion is the real one, so the a from the slope is still right.' }
      ]
    },
    pendulum: {
      id: 'pendulum', name: 'Pendulum', topic: 'shm-period',
      wrongInst: [['scale','stopwatch'],['meterstick','balance'],['stopwatch','meterstick']], control: 'mass of the bob',
      setup: 'A small bob hangs on a light string from a clamp. The student sets the length, releases the bob from 10° and times 10 full swings with a stopwatch.',
      iv: { sym: 'L', name: 'length of the string (to the bob\'s center)', unit: 'm', min: 0.20, max: 1.20, step: 0.05, inst: 'meterstick', d: 2 },
      dv: { sym: 'T', name: 'period (from 10 swings)', unit: 's', inst: 'stopwatch', res: 0.001, d: 3 },
      alt: [
        { id: 'mass', sym: 'm', name: 'mass of the bob', unit: 'kg', min: 0.05, max: 0.50, step: 0.05, inst: 'balance', d: 2 },
        { id: 'angle', sym: 'θ₀', name: 'release angle', unit: '°', min: 5, max: 60, step: 5, inst: 'protractor', d: 0 }
      ],
      params: function(r){ return { g: G, theta: 10, Lfix: 0.60 }; },
      truth: function(P, x, iv){ if(iv === 'mass') return pendT(P.Lfix, P.theta); if(iv === 'angle') return pendT(P.Lfix, x); return pendT(x, P.theta); },
      // 10 swings timed: start and stop each off by a reaction time (σ 0.1 s), read to 0.01 s.
      noise: function(r){ return 0.1 * Math.SQRT2 * gauss(r) / 10; },
      read: function(y){ return Math.round(y * 10 * 100) / 100 / 10; },
      plots: [
        { id: 'T-L', y: 'T', x: 'L', X: function(x){ return x; }, Y: function(y){ return y; }, xl: 'L', xu: 'm', yl: 'T', yu: 's', linear: false },
        { id: 'T2-L', y: 'T²', x: 'L', X: function(x){ return x; }, Y: function(y){ return y * y; }, xl: 'L', xu: 'm', yl: 'T²', yu: 's²', linear: true },
        { id: 'T-L2', y: 'T', x: 'L²', X: function(x){ return x * x; }, Y: function(y){ return y; }, xl: 'L²', xu: 'm²', yl: 'T', yu: 's', linear: false },
        { id: 'T-inv', y: 'T', x: '1/L', X: function(x){ return 1 / x; }, Y: function(y){ return y; }, xl: '1/L', xu: '1/m', yl: 'T', yu: 's', linear: false }
      ],
      slopeUnit: 's²/m',
      best: 'T2-L',
      law: 'T = 2π√(L/g), so T² = (4π²/g)·L',
      slopeMeans: 'The slope of T² against L is 4π²/g, so g = 4π² / slope. The line should pass close to the origin.',
      target: { sym: 'g', name: 'acceleration due to gravity', unit: 'm/s²', from: function(m){ return 4 * PI * PI / m; }, true: function(P){ return P.g; },
        how: 'g = 4π² / slope', mistakes: function(m){ return [{ value: 2 * PI / m, why: 'Squaring T squares the 2π too: T² = 4π²L/g, so g = 4π² / slope.' }, { value: m / (4 * PI * PI), why: 'Upside down: the slope is 4π²/g, so g = 4π² / slope.' }, { value: 4 * PI * PI * m, why: 'The slope is 4π²/g; solve for g: g = 4π² / slope.' }]; } },
      errors: [
        { id: 'top', text: 'Every length was measured to the top of the bob instead of its center, so each L is short by the bob\'s radius.', effect: 2, why: 'The same amount is missing from every L: the line shifts sideways, its slope does not change, so g is unchanged.' },
        { id: 'big', text: 'The bob was released from 45° instead of a small angle.', effect: 1, why: 'At a large angle each period is about 4% longer, so every T² is about 8% larger: the slope is larger and g = 4π²/slope comes out smaller.' },
        { id: 'nine', text: 'The student counted only 9 swings each time but still divided the time by 10.', effect: 0, why: 'Every T is 10% too small, so every T² is 19% too small: the slope is smaller and g = 4π²/slope comes out larger.' }
      ]
    },
    spring: {
      id: 'spring', name: 'Spring with masses', topic: 'spring-forces',
      wrongInst: [['meterstick','balance'],['balance','stopwatch'],['stopwatch','meterstick']], control: 'spring used (the same one throughout)',
      setup: 'A spring hangs from a clamp. The student hangs slotted masses on it and measures how far it stretches with a meterstick.',
      iv: { sym: 'm', name: 'hanging mass', unit: 'kg', min: 0.050, max: 0.300, step: 0.025, inst: 'balance', d: 3 },
      dv: { sym: 'x', name: 'stretch of the spring', unit: 'm', inst: 'meterstick', res: 0.001, d: 3 },
      params: function(r){ return { k: r.pick([10, 12, 15, 20, 25, 30, 40]) }; },
      truth: function(P, x){ return x * G / P.k; },
      noise: function(r){ return 0.002 * gauss(r); },
      plots: [
        { id: 'x-m', y: 'x', x: 'm', X: function(x){ return x; }, Y: function(y){ return y; }, xl: 'm', xu: 'kg', yl: 'x', yu: 'm', linear: true },
        { id: 'x-inv', y: 'x', x: '1/m', X: function(x){ return 1 / x; }, Y: function(y){ return y; }, xl: '1/m', xu: '1/kg', yl: 'x', yu: 'm', linear: false },
        { id: 'x2-m', y: 'x²', x: 'm', X: function(x){ return x; }, Y: function(y){ return y * y; }, xl: 'm', xu: 'kg', yl: 'x²', yu: 'm²', linear: false },
        { id: 'x-m2', y: 'x', x: 'm²', X: function(x){ return x * x; }, Y: function(y){ return y; }, xl: 'm²', xu: 'kg²', yl: 'x', yu: 'm', linear: false }
      ],
      slopeUnit: 'm/kg',
      best: 'x-m',
      law: 'At rest kx = mg, so x = (g/k)·m',
      slopeMeans: 'The slope of x against m is g/k, so k = g / slope.',
      target: { sym: 'k', name: 'spring constant', unit: 'N/m', from: function(m){ return G / m; }, true: function(P){ return P.k; },
        how: 'k = g / slope', mistakes: function(m){ return [{ value: 1 / m, why: 'The slope is g/k, not 1/k: k = g / slope.' }, { value: m * G, why: 'Upside down: k = g / slope.' }, { value: m, why: 'The slope is g/k, not k: k = g / slope.' }]; } },
      errors: [
        { id: 'mark', text: 'Each stretch was measured from a mark 2 cm below the spring\'s unstretched end, so every x is 2 cm too small.', effect: 2, why: 'Taking the same 2 cm off every x moves the line down: the slope is the same, so k is unchanged.' },
        { id: 'limit', text: 'The largest masses stretched the spring past its elastic limit, so it stretched more than it should have.', effect: 1, why: 'Those stretches are too large, which pulls the slope up: g/slope gives a smaller k.' },
        { id: 'read', text: 'The meterstick was read at an angle, and every stretch read 5% too large.', effect: 1, why: 'Every x is 5% too large, so the slope (g/k) is 5% too large and k = g/slope is too small.' }
      ]
    },
    atwood: {
      id: 'atwood', name: 'Cart and hanging mass', topic: 'second-law',
      wrongInst: [['balance','scale'],['detector','balance'],['stopwatch','detector']], control: 'total mass of the cart and the hanging mass',
      setup: 'A low-friction cart on a level track is pulled by a string over a pulley to a hanging mass. To keep the total mass of the system the same, the student moves slotted masses from the cart to the hanger, and reads the acceleration from a motion detector.',
      iv: { sym: 'm', name: 'hanging mass', unit: 'kg', min: 0.010, max: 0.080, step: 0.010, inst: 'balance', d: 3 },
      dv: { sym: 'a', name: 'acceleration of the cart', unit: 'm/s²', inst: 'detector', res: 0.001, d: 3 },
      params: function(r){ return { Mt: r.pick([0.50, 0.60, 0.75, 0.80, 1.0, 1.2]) }; },
      truth: function(P, x){ return x * G / P.Mt; },
      noise: function(r, y){ return (0.01 + 0.015 * y) * gauss(r); },
      plots: [
        { id: 'a-m', y: 'a', x: 'm', X: function(x){ return x; }, Y: function(y){ return y; }, xl: 'm', xu: 'kg', yl: 'a', yu: 'm/s²', linear: true },
        { id: 'a-inv', y: 'a', x: '1/m', X: function(x){ return 1 / x; }, Y: function(y){ return y; }, xl: '1/m', xu: '1/kg', yl: 'a', yu: 'm/s²', linear: false },
        { id: 'inva-m', y: '1/a', x: 'm', X: function(x){ return x; }, Y: function(y){ return 1 / y; }, xl: 'm', xu: 'kg', yl: '1/a', yu: 's²/m', linear: false },
        { id: 'a2-m', y: 'a²', x: 'm', X: function(x){ return x; }, Y: function(y){ return y * y; }, xl: 'm', xu: 'kg', yl: 'a²', yu: 'm²/s⁴', linear: false }
      ],
      slopeUnit: 'm/(s²·kg)',
      best: 'a-m',
      law: 'For the cart, string and hanging mass together: mg = M_total·a, so a = (g/M_total)·m',
      slopeMeans: 'The slope of a against m is g/M_total, so M_total = g / slope. Moving masses (not adding them) keeps M_total fixed, which is what makes the graph a line.',
      target: { sym: 'M_total', name: 'total mass of the system', unit: 'kg', from: function(m){ return G / m; }, true: function(P){ return P.Mt; },
        how: 'M_total = g / slope', mistakes: function(m){ return [{ value: 1 / m, why: 'The slope is g/M_total, not 1/M_total: M_total = g / slope.' }, { value: m / G, why: 'Upside down: M_total = g / slope.' }]; } },
      errors: [
        { id: 'fric', text: 'There was a small, constant friction force on the cart.', effect: 2, why: 'Friction subtracts the same force at every m: mg − f = M_total·a. The line moves down (a negative intercept), the slope g/M_total does not change, so M_total is unchanged.' },
        { id: 'det', text: 'The motion detector read every acceleration 3% too small.', effect: 0, why: 'Every a is 3% too small, so the slope g/M_total is too small and M_total = g/slope comes out too large.' },
        { id: 'hanger', text: 'The student forgot to include the hanger\'s own mass in each value of m.', effect: 2, why: 'The same hanger mass is missing from every m: the line shifts sideways and its slope is unchanged, so M_total is unchanged.' }
      ]
    },
    pulley: {
      id: 'pulley', name: 'Falling mass and pulley', topic: 'rotational-second-law',
      wrongInst: [['balance','scale'],['detector','balance'],['stopwatch','detector']], control: 'radius of the spool',
      setup: 'A string is wound around a spool of radius r on a pulley wheel that turns on a low-friction axle. A hanging mass unwinds it as it falls; a motion detector below reads the mass\'s acceleration.',
      iv: { sym: 'm', name: 'hanging mass', unit: 'kg', min: 0.050, max: 0.300, step: 0.025, inst: 'balance', d: 3 },
      dv: { sym: 'a', name: 'acceleration of the falling mass', unit: 'm/s²', inst: 'detector', res: 0.001, d: 3 },
      params: function(r){ var R = r.pick([0.020, 0.025, 0.030, 0.040]); return { r: R, I: M.sig(R * R * r.pick([0.20, 0.30, 0.40, 0.50, 0.60]), 2) }; },
      truth: function(P, x){ return x * G / (x + P.I / (P.r * P.r)); },
      noise: function(r, y){ return 0.015 * y * gauss(r); },
      plots: [
        { id: 'a-m', y: 'a', x: 'm', X: function(x){ return x; }, Y: function(y){ return y; }, xl: 'm', xu: 'kg', yl: 'a', yu: 'm/s²', linear: false },
        { id: 'inva-invm', y: '1/a', x: '1/m', X: function(x){ return 1 / x; }, Y: function(y){ return 1 / y; }, xl: '1/m', xu: '1/kg', yl: '1/a', yu: 's²/m', linear: true },
        { id: 'a-invm', y: 'a', x: '1/m', X: function(x){ return 1 / x; }, Y: function(y){ return y; }, xl: '1/m', xu: '1/kg', yl: 'a', yu: 'm/s²', linear: false },
        { id: 'inva-m', y: '1/a', x: 'm', X: function(x){ return x; }, Y: function(y){ return 1 / y; }, xl: 'm', xu: 'kg', yl: '1/a', yu: 's²/m', linear: false }
      ],
      slopeUnit: 'kg·s²/m',
      best: 'inva-invm',
      law: 'mg − F_T = ma and F_T·r = Iα = I·a/r give a = mg/(m + I/r²), so 1/a = 1/g + (I/(gr²))·(1/m)',
      slopeMeans: 'The slope of 1/a against 1/m is I/(gr²), so I = slope × g × r². The intercept is 1/g.',
      target: { sym: 'I', name: 'rotational inertia of the pulley', unit: 'kg·m²', from: function(m, b, P){ return m * G * P.r * P.r; }, true: function(P){ return P.I; },
        how: 'I = slope × g × r²', mistakes: function(m, P){ return [{ value: m * G * P.r, why: 'The radius enters squared: I = slope × g × r².' }, { value: m * P.r * P.r, why: 'The slope is I/(gr²): multiply by g as well as r².' }, { value: m * P.r * P.r / G, why: 'The slope is I/(gr²): multiply by g, do not divide.' }]; } },
      errors: [
        { id: 'rim', text: 'The student used the radius of the wheel\'s rim instead of the smaller spool the string is wound on.', effect: 0, why: 'I = slope × g × r² uses r squared, so a radius that is too large makes I too large (the slope itself is fine).' },
        { id: 'det', text: 'The motion detector read every acceleration 2% too large.', effect: 1, why: 'Every 1/a is 2% too small, so the slope is too small and I = slope × g × r² comes out too small.' },
        { id: 'axle', text: 'The axle had a little friction, which the student ignored.', effect: 0, why: 'Friction makes every a smaller, and most so for the light masses (large 1/m), so 1/a climbs faster with 1/m: the slope is too large, and so is I.' }
      ]
    },
    buoyancy: {
      id: 'buoyancy', name: 'Buoyancy with a spring scale', topic: 'buoyancy',
      wrongInst: [['meterstick','balance'],['scale','meterstick'],['stopwatch','scale']], control: 'mass of the cylinder',
      setup: 'A metal cylinder 10 cm tall hangs from a spring scale. The student lowers it into a wide container of liquid in steps, measuring with a meterstick how deep its bottom is below the liquid\'s surface, and reads the scale.',
      iv: { sym: 'd', name: 'depth of the cylinder\'s bottom', unit: 'm', min: 0.010, max: 0.090, step: 0.010, inst: 'meterstick', d: 3 },
      dv: { sym: 'F', name: 'spring scale reading', unit: 'N', inst: 'scale', res: 0.01, d: 2 },
      params: function(r){ var D = r.pick([4.0, 4.5, 5.0, 5.5, 6.0]); return { D: D, m: r.pick([0.60, 0.70, 0.80, 0.90]), rho: r.pick([800, 1000, 1025, 1200]) }; },
      truth: function(P, x){ var A = PI * Math.pow(P.D / 200, 2); return P.m * G - P.rho * G * A * x; },
      noise: function(r){ return 0.02 * gauss(r); },
      plots: [
        { id: 'F-d', y: 'F', x: 'd', X: function(x){ return x; }, Y: function(y){ return y; }, xl: 'd', xu: 'm', yl: 'F', yu: 'N', linear: true },
        { id: 'F-d2', y: 'F', x: 'd²', X: function(x){ return x * x; }, Y: function(y){ return y; }, xl: 'd²', xu: 'm²', yl: 'F', yu: 'N', linear: false },
        { id: 'F-sqrt', y: 'F', x: '√d', X: function(x){ return Math.sqrt(x); }, Y: function(y){ return y; }, xl: '√d', xu: 'm^½', yl: 'F', yu: 'N', linear: false },
        { id: 'F-inv', y: 'F', x: '1/d', X: function(x){ return 1 / x; }, Y: function(y){ return y; }, xl: '1/d', xu: '1/m', yl: 'F', yu: 'N', linear: false }
      ],
      slopeUnit: 'N/m',
      best: 'F-d',
      law: 'At rest F + F_b = mg with F_b = ρ_liquid·A·d·g, so F = mg − (ρ_liquid·g·A)·d',
      slopeMeans: 'The slope of F against d is −ρ_liquid·g·A, so ρ_liquid = −slope / (gA), with A = πD²/4. The intercept is the cylinder\'s weight.',
      target: { sym: 'ρ', name: 'density of the liquid', unit: 'kg/m³', from: function(m, b, P){ return -m / (G * PI * Math.pow(P.D / 200, 2)); }, true: function(P){ return P.rho; },
        how: 'ρ = −slope / (g·πD²/4)', mistakes: function(m, P){ var A = PI * Math.pow(P.D / 200, 2); return [{ value: -m / (G * PI * Math.pow(P.D / 100, 2)), why: 'You used the diameter as the radius. A = π(D/2)².' }, { value: -m / A, why: 'The slope is −ρgA: divide by g as well.' }, { value: -m / (G * PI * Math.pow(P.D, 2) / 4), why: 'The diameter is in cm: convert it to meters before finding A.' }]; } },
      errors: [
        { id: 'zero', text: 'The spring scale was not zeroed and reads every force 0.20 N too high.', effect: 2, why: 'Adding 0.20 N to every reading moves the line up; the slope does not change, so ρ is unchanged.' },
        { id: 'diam', text: 'The cylinder\'s diameter was measured too small.', effect: 0, why: 'ρ = −slope/(gA): an area that is too small makes ρ too large.' },
        { id: 'rise', text: 'The liquid level rose as the cylinder went in, but d was measured from where the surface was before.', effect: 0, why: 'The real depth under the surface is a little more than each recorded d, so F drops faster per recorded meter: the slope is steeper and ρ comes out too large.' }
      ]
    }
  };
  function settings(exp, n, iv){
    var v = iv ? exp.alt.filter(function(a){ return a.id === iv; })[0] : exp.iv;
    var out = [], span = v.max - v.min;
    for(var i = 0; i < n; i++) out.push(M.round(v.min + span * (n === 1 ? 0.5 : i / (n - 1)), 6));
    return out.map(function(x){ return M.round(Math.round(x / v.step) * v.step, 6); });
  }
  function measure(exp, P, x, r, iv){
    var y = exp.truth(P, x, iv), noisy = y + exp.noise(r, y);
    return M.round(exp.read ? exp.read(noisy) : q(noisy, exp.dv.res), 4);
  }
  function plotOf(exp, id){ return exp.plots.filter(function(p){ return p.id === id; })[0]; }
  function linearize(exp, plotId, rows){ var p = plotOf(exp, plotId); return rows.map(function(rw){ return [p.X(rw[0]), p.Y(rw[1])]; }); }
  function derive(exp, P, m, b){ return exp.target.from(m, b, P); }
  function dataset(r, exp, n){
    var P = exp.params(r), xs = settings(exp, n);
    return { P: P, rows: xs.map(function(x){ return [x, measure(exp, P, x, r)]; }) };
  }

  /* ------------------------------------------------------- the drill */
  var LAB = {};
  function fmt(x, n){ return M.fmt(x, n || 3); }
  function sym(s){ return String(s).replace(/(<sub>[^<]*<\/sub>)|_([A-Za-z]+)/g, function(m, done, w){ return done || '<sub>' + w + '</sub>'; }); }
  var MEASURES = { meterstick: 'a length', stopwatch: 'a time interval', detector: 'the position of a moving object over time (and from it velocity and acceleration)', scale: 'a force', balance: 'a mass', photogate: 'when an object passes one point' };
  function an(i){ return (/^[aeiou]/.test(INSTRUMENTS[i]) ? 'an ' : 'a ') + INSTRUMENTS[i]; }
  function instPair(exp){
    var a = exp.iv.inst, b = exp.dv.inst, say = function(i, d){ return sym(exp.iv.sym) + ' with ' + an(i) + ', ' + sym(exp.dv.sym) + ' with ' + an(d); };
    var opts = [say(a, b)], why = ['Right: ' + an(a) + ' measures ' + MEASURES[a] + ', which gives the ' + exp.iv.name + '; ' + an(b) + ' measures ' + MEASURES[b] + ', which gives the ' + exp.dv.name + '.'];
    exp.wrongInst.forEach(function(w){
      opts.push(say(w[0], w[1]));
      var bad = w[0] !== a ? [w[0], exp.iv] : [w[1], exp.dv];
      why.push(an(bad[0]).replace(/^a/, 'A') + ' measures ' + MEASURES[bad[0]] + ', not the ' + bad[1].name + '.');
    });
    return { options: opts, why: why };
  }
  function plotLabel(p){ return sym(p.y) + ' against ' + sym(p.x); }

  function generate(r, ctx){
    var exp = EXPS[ctx.exp], n = r.pick([6, 7, 8]), ds = dataset(r, exp, n), P = ds.P, rows = ds.rows;
    var best = plotOf(exp, exp.best), lin = linearize(exp, exp.best, rows), F = fit(lin);
    var target = derive(exp, P, F.m, F.b);
    var others = exp.plots.filter(function(p){ return !p.linear; });
    var plotOpts = [best].concat(others).map(plotLabel);
    var law = sym(exp.law);
    var plotWhy = [best].concat(others).map(function(p, i){ return i === 0 ? 'Right. The model: ' + law + '. Plotted as ' + plotLabel(best) + ' it reads y = (slope)·x + (intercept), a straight line.' : 'The model is ' + law + '. Plotted as ' + plotLabel(p) + ' it is a curve, not a line, so its slope does not stand for one quantity.'; });
    var ivWrong = [exp.dv.name, exp.target.name, exp.control];
    var ivOpts = [exp.iv.name].concat(ivWrong);
    var ivWhy = ['Right: the student sets the ' + exp.iv.name + ' and then measures the ' + exp.dv.name + ', which responds.', 'The ' + exp.dv.name + ' is what responds: it is the dependent variable, measured after the setting is chosen.', 'The ' + exp.target.name + ' is not set or measured directly: it comes out of the slope.', 'That is held constant (a control), not changed from trial to trial.'];
    var ip = instPair(exp), err = r.pick(exp.errors);
    var slopeUnit = exp.slopeUnit;
    var tm = exp.target.mistakes(F.m, P);
    var head = '<p>' + exp.setup + '</p>' + (exp.id === 'pulley' ? '<p>The spool radius is r = ' + fmt(P.r * 100, 2) + ' cm.</p>' : exp.id === 'buoyancy' ? '<p>The cylinder\'s diameter is D = ' + fmt(P.D, 2) + ' cm.</p>' : '') +
      '<p>The data are in the table. Use g = 9.8 m/s². Plan the analysis: what is the ' + exp.target.name + '?</p>';
    var p = {
      ctx: ctx.id, topic: ctx.topic, type: exp.id, exp: exp.id, text: head,
      values: { P: P, rows: rows, lin: lin, fit: F, target: target, plot: exp.best, err: exp.errors.indexOf(err) },
      steps: [
        { key: 'iv', kind: 'choice', label: 'Which quantity is the independent variable (the one the student sets)?', options: ivOpts, correct: 0, why: ivWhy, practice: '3.A', fixed: false },
        { key: 'inst', kind: 'choice', label: 'Which instruments measure the two quantities?', options: ip.options, correct: 0, why: ip.why, practice: '3.A', fixed: false },
        { key: 'plot', kind: 'choice', label: 'What should be graphed to get a straight line?', options: plotOpts, correct: 0, why: plotWhy, practice: '3.A', fixed: false },
        { key: 'slope', kind: 'num', label: 'Slope of the best-fit line of ' + plotLabel(best), unit: slopeUnit, hint: 'Pick two points far apart ON the line (not data points), then slope = rise / run.', practice: '2.B', d: null,
          cell: M.cell(F.m, 0.06, [{ value: 1 / F.m, why: 'That is run / rise: the axes are swapped. Slope = Δ(vertical) / Δ(horizontal).' }]) },
        { key: 'target', kind: 'num', label: 'The ' + exp.target.name + ', ' + sym(exp.target.sym) + ', from the best-fit slope', unit: exp.target.unit, hint: sym(exp.slopeMeans), practice: '2.B',
          cell: M.cell(target, 0.06, tm) },
        { key: 'error', kind: 'choice', label: err.text + ' What does this do to the value of ' + sym(exp.target.sym) + ' found from the graph?', options: ['It comes out too large', 'It comes out too small', 'It is unchanged'], correct: err.effect, fixed: true, practice: '3.C',
          why: [0, 1, 2].map(function(k){ return (k === err.effect ? 'Right. ' : 'Not this one. ') + err.why; }) }
      ],
      solution: [
        'The student sets the ' + exp.iv.name + ' (independent) and measures the ' + exp.dv.name + ' (dependent): ' + sym(exp.iv.sym) + ' with ' + an(exp.iv.inst) + ', ' + sym(exp.dv.sym) + ' with ' + an(exp.dv.inst) + '.',
        'Model: ' + law + '. So graph ' + plotLabel(best) + ': it is a straight line.',
        'Best-fit (least squares) line: slope = ' + fmt(F.m) + ' ' + slopeUnit + ', intercept = ' + fmt(F.b) + ' ' + best.yu + '. A slope read from two points on a hand-drawn line within about 6% is fine.',
        sym(exp.slopeMeans) + ' ' + sym(exp.target.how) + ' = ' + fmt(target) + ' ' + exp.target.unit + '.',
        err.why
      ]
    };
    p.text = sym(p.text); p.solution = p.solution.map(sym);
    p.steps.forEach(function(s){ s.label = sym(s.label); if(s.hint) s.hint = sym(s.hint); if(s.options) s.options = s.options.map(sym); if(s.why) s.why = s.why.map(sym); if(s.cell) s.cell.mistakes.forEach(function(m){ m.why = sym(m.why); }); });
    return p;
  }

  M.register('labDesign', {
    EXPS: EXPS, INSTRUMENTS: INSTRUMENTS, gauss: gauss, fit: fit, settings: settings, measure: measure, plotOf: plotOf,
    linearize: linearize, derive: derive, dataset: dataset, pendT: pendT, plotLabel: plotLabel, sym: sym, generate: generate, an: an, MEASURES: MEASURES
  });
})();
