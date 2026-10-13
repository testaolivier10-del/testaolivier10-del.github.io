/* Collision lab model: ApPhysMath.collisionLab (docs/apphys-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apphys-tool-checks/collision-lab.mjs) and the test
   (scripts/test/apphys-tool-collision-lab.test.mjs) run exactly this code.

   Loaded on physics/tools/collision-lab.html after phys-tool-math.js and
   before physics/assets/tools/collision-lab.js. SI units, +x to the right.

   Explore model
     outcome(m1, m2, v1, v2, e)   final velocities for a coefficient of
                                  restitution e (1 elastic ... 0 sticky):
                                  v1' = (p + m2 e (v2 − v1)) / M, v2' = (p + m1 e (v1 − v2)) / M
     run(o) -> { at(t), T0, Tc, T1, ... }   a whole run, in closed form:
                                  the carts coast, touch at T0, the bumper
                                  squeezes for Tc (a spring of stiffness k
                                  loading; unloading at k/e², so it gives back
                                  e² of the stored energy: Velcro at e = 0),
                                  then coast. at(t) -> { x1, x2, v1, v2, F,
                                  xcm, vcm, contact }. Explosion mode: the
                                  carts start at rest, touching, with the
                                  bumper spring squeezed and released.
                                  The force-time pulse is F = k·x (a half sine
                                  in each phase), its area is the impulse
                                  μ(1 + e)u exactly, whatever k is.
   Test yourself
     generate(rng, ctx, type) -> { ctx, topic, type, text, figure, steps,
                                  solution, values } for ApPhysTools.drill.
                                  Types: sticky, onefinal, explode, ke,
                                  impulse, cm, choose, bars. */
(function(){
  'use strict';
  var M = window.ApPhysMath;
  if(!M) return;
  var F = function(x, d){ return M.minus(M.fixed(x, d)); };
  var fmt = function(x, n){ return M.fmt(x, n || 3); };
  var sgn = function(x){ return (x > 0 ? '+' : '') + fmt(x, 3); };

  function outcome(m1, m2, v1, v2, e){
    var Mt = m1 + m2, p = m1 * v1 + m2 * v2;
    return { v1: (p + m2 * e * (v2 - v1)) / Mt, v2: (p + m1 * e * (v1 - v2)) / Mt };
  }
  function energy(m1, m2, v1, v2){ return 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2; }

  /* A run. o: { m1, m2, v1, v2, e, k (N/m), mode: 'collide'|'explode',
     E (J, explode), x1, x2 (start centers, m), L (cart length, m) } */
  function run(o){
    var m1 = o.m1, m2 = o.m2, Mt = m1 + m2, mu = m1 * m2 / Mt, k = o.k || 2000, L = o.L || 0.5;
    var e = Math.max(0, Math.min(1, o.e == null ? 1 : o.e));
    var w = Math.sqrt(k / mu), Tend = o.T || 4;
    if(o.mode === 'explode'){
      // At rest, touching, the bumper squeezed by xm: it stores E = ½k xm².
      var E = o.E || 2, xm = Math.sqrt(2 * E / k), xc0 = o.xc == null ? 2 : o.xc;
      var t0 = o.t0 == null ? 0.3 : o.t0, Tc = Math.PI / (2 * w), u = Math.sqrt(2 * E / mu);
      var f1 = -m2 / Mt * u, f2 = m1 / Mt * u;  // final velocities: p stays 0
      var d0 = L - xm;                            // center gap while squeezed
      var at = function(t){
        var d, dd, Fc, ph;
        if(t < t0){ d = d0; dd = 0; Fc = 0; ph = 0; }
        else if(t < t0 + Tc){ var s = t - t0; d = d0 + xm * (1 - Math.cos(w * s)); dd = xm * w * Math.sin(w * s); Fc = k * xm * Math.cos(w * s); ph = 1; }
        else { d = L + u * (t - t0 - Tc); dd = u; Fc = 0; ph = 2; }
        return { x1: xc0 - m2 / Mt * d, x2: xc0 + m1 / Mt * d, v1: -m2 / Mt * dd, v2: m1 / Mt * dd, F: Fc, xcm: xc0, vcm: 0, contact: ph === 1, phase: ph, comp: ph === 2 ? 0 : L - d };
      };
      return { mode: 'explode', m1: m1, m2: m2, e: 1, k: k, L: L, T0: t0, Tc: Tc, T1: t0 + Tc, T: Tend, v1i: 0, v2i: 0, v1f: f1, v2f: f2, at: at,
        J: m2 * f2, Fmax: k * xm, xm: xm, E: E, vcm: 0, xcm0: xc0, pulse: function(s){ return s < 0 || s > Tc ? 0 : k * xm * Math.cos(w * s); } };
    }
    var v1 = o.v1, v2 = o.v2, x1 = o.x1 == null ? 1 : o.x1, x2 = o.x2 == null ? 4 : o.x2;
    var gap = x2 - x1 - L, close = v1 - v2, vcm = (m1 * v1 + m2 * v2) / Mt, xcm0 = (m1 * x1 + m2 * x2) / Mt;
    var T0 = close > 1e-9 && gap >= 0 ? gap / close : Infinity, u = close;
    var xm = u > 0 ? u * Math.sqrt(mu / k) : 0, Tl = Math.PI / (2 * w);
    var k2 = e > 0 ? k / (e * e) : Infinity, w2 = Math.sqrt(k2 / mu), Tu = e > 0 ? Math.PI / (2 * w2) : 0, x0 = e > 0 ? xm * (1 - e * e) : xm;
    var fin = outcome(m1, m2, v1, v2, e), Tc = Tl + Tu;
    function at(t){
      var xc = xcm0 + vcm * t, d, dd, Fc = 0, ph;
      if(t < T0){ d = L + gap - u * t; dd = -u; ph = 0; }
      else if(t < T0 + Tl){ var s = t - T0; d = L - (u / w) * Math.sin(w * s); dd = -u * Math.cos(w * s); Fc = k * (L - d); ph = 1; }
      else if(t < T0 + Tc){ var s2 = t - T0 - Tl; var c = x0 + (xm - x0) * Math.cos(w2 * s2); d = L - c; dd = (xm - x0) * w2 * Math.sin(w2 * s2); Fc = k2 * (c - x0); ph = 1; }
      else { var s3 = t - T0 - Tc; d = L - x0 + e * u * s3; dd = e * u; ph = 2; }
      // Sticky (e = 0): the Velcro holds them at the squeezed spacing.
      return { x1: xc - m2 / Mt * d, x2: xc + m1 / Mt * d, v1: vcm - m2 / Mt * dd, v2: vcm + m1 / Mt * dd, F: Fc, xcm: xc, vcm: vcm, contact: ph === 1, phase: ph, comp: Math.max(0, L - d) };
    }
    return { mode: 'collide', m1: m1, m2: m2, e: e, k: k, L: L, T0: T0, Tc: isFinite(T0) ? Tc : 0, T1: T0 + Tc, T: Tend, v1i: v1, v2i: v2, v1f: isFinite(T0) ? fin.v1 : v1, v2f: isFinite(T0) ? fin.v2 : v2,
      at: at, J: isFinite(T0) ? mu * (1 + e) * u : 0, Fmax: k * xm, xm: xm, vcm: vcm, xcm0: xcm0, hits: isFinite(T0),
      pulse: function(s){ if(s < 0 || s > Tc || !isFinite(T0)) return 0; if(s <= Tl) return k * (u / w) * Math.sin(w * s); return e > 0 ? k2 * ((xm - x0) * Math.cos(w2 * (s - Tl))) : 0; } };
  }
  /* Area under F(t) by Simpson's rule: the impulse read off the graph. */
  function area(f, a, b, n){
    n = n || 2000; if(n % 2) n++;
    var h = (b - a) / n, s = f(a) + f(b);
    for(var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
    return s * h / 3;
  }

  /* ---------------------------------------------------- Test yourself */
  var STEP = function(o){ o.level = o.level || 'apply'; return o; };
  function num(o){ return STEP({ kind: 'num', key: o.key, label: o.label, unit: o.unit, cell: M.cell(o.answer, o.rel || 0.02, o.mistakes || [], o.abs), practice: o.practice || '2.B', hint: o.hint }); }
  function mass(r){ return r.pick([0.25, 0.40, 0.50, 0.60, 0.75, 0.80, 1.0, 1.2, 1.5, 2.0]); }
  function speed(r, a, b){ return r.between(a || 0.4, b || 2.5, 2); }
  function cartText(m1, v1, m2, v2){
    var d = function(v){ return v === 0 ? 'at rest' : 'moving ' + (v > 0 ? 'right' : 'left') + ' at ' + fmt(Math.abs(v), 2) + ' m/s'; };
    return 'Cart A (' + fmt(m1, 2) + ' kg) is ' + d(v1) + ' and cart B (' + fmt(m2, 2) + ' kg) is ' + d(v2) + ' on a level, low-friction track.';
  }
  var DIR = '<p class="bt-small">Take right as positive: a velocity to the left is negative.</p>';

  function genSticky(r, ctx){
    var m1 = mass(r), m2 = mass(r), v1 = speed(r, 0.6, 2.5), v2 = r() < 0.5 ? 0 : -speed(r, 0.3, 1.5);
    var p = m1 * v1 + m2 * v2, vf = p / (m1 + m2), K0 = energy(m1, m2, v1, v2), K1 = 0.5 * (m1 + m2) * vf * vf;
    var text = '<p>' + cartText(m1, v1, m2, v2) + ' They collide and stick together with Velcro.</p>' + DIR;
    var steps = [
      num({ key: 'p', label: 'What is the total momentum of the two-cart system before the collision?', unit: 'kg·m/s', answer: p, abs: 0.005, mistakes: [
        v2 ? { value: m1 * v1 - m2 * v2, why: 'Cart B moves left, so its momentum is negative: p = m<sub>A</sub>v<sub>A</sub> + m<sub>B</sub>v<sub>B</sub> with v<sub>B</sub> < 0.' } : null,
        { value: (m1 + m2) * v1, why: 'Each cart has its own mass and velocity before the collision: p = m<sub>A</sub>v<sub>A</sub> + m<sub>B</sub>v<sub>B</sub>, not the combined mass.' }].filter(Boolean) }),
      num({ key: 'vf', label: 'What is the velocity of the carts just after they stick?', unit: 'm/s', answer: vf, abs: 0.005, mistakes: [
        { value: Math.sqrt(2 * K0 / (m1 + m2)), why: 'Energy conservation does not hold for a sticky collision: some kinetic energy turns into thermal energy. Start from momentum: v = p/(m<sub>A</sub> + m<sub>B</sub>).' },
        { value: p / m1, why: 'After sticking, both carts move together: divide by the combined mass.' },
        { value: (v1 + v2) / 2, why: 'Averaging the velocities ignores the masses: v = (m<sub>A</sub>v<sub>A</sub> + m<sub>B</sub>v<sub>B</sub>)/(m<sub>A</sub> + m<sub>B</sub>).' }] }),
      num({ key: 'dK', label: 'How much kinetic energy is transformed (lost from K) in the collision?', unit: 'J', answer: K0 - K1, abs: 0.0005, practice: '2.B', mistakes: [
        { value: 0.5 * (m1 + m2) * Math.pow(v1 - vf, 2), why: 'ΔK is not ½m(Δv)². Find K before (each cart) and K after (together), then subtract.' },
        { value: 0, why: 'In a sticky collision the total K always decreases: the carts squash the Velcro and warm it.' }] })
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'sticky', text: text, steps: steps,
      figure: { kind: 'carts', m1: m1, m2: m2, v1: v1, v2: v2, bumper: 'velcro' },
      solution: ['System: both carts. The track is level with low friction, so the net external force during the collision is (nearly) zero and the system\'s momentum is constant.',
        'p = m<sub>A</sub>v<sub>A</sub> + m<sub>B</sub>v<sub>B</sub> = ' + fmt(m1, 2) + '(' + F(v1, 2) + ') + ' + fmt(m2, 2) + '(' + F(v2, 2) + ') = ' + fmt(p, 3) + ' kg·m/s.',
        'Stuck together: v = p/(m<sub>A</sub> + m<sub>B</sub>) = ' + fmt(p, 3) + ' / ' + fmt(m1 + m2, 3) + ' = ' + fmt(vf, 3) + ' m/s.',
        'K before = ' + fmt(K0, 3) + ' J; K after = ½(m<sub>A</sub> + m<sub>B</sub>)v² = ' + fmt(K1, 3) + ' J. ' + fmt(K0 - K1, 3) + ' J became thermal energy and deformation of the Velcro.'],
      values: { m1: m1, m2: m2, v1: v1, v2: v2 } };
  }
  function genOneFinal(r, ctx){
    // Cart A's final velocity is given to 2 decimals; a setup where that
    // rounding would create kinetic energy (more than 0.5%) is drawn again.
    var m1, m2, v1, v2, e, v1f, v2f, K0, K1;
    for(var tries = 0; tries < 40; tries++){
      m1 = mass(r); m2 = mass(r); v1 = speed(r, 0.8, 2.5); v2 = r() < 0.5 ? 0 : -speed(r, 0.3, 1.2); e = r.pick([0.3, 0.5, 0.7, 1]);
      v1f = M.round(outcome(m1, m2, v1, v2, e).v1, 2); v2f = (m1 * v1 + m2 * v2 - m1 * v1f) / m2;
      K0 = energy(m1, m2, v1, v2); K1 = energy(m1, m2, v1f, v2f);
      if(K1 <= K0 * 1.005 && v2f >= v1f) break;
    }
    var el = Math.abs(K1 - K0) <= 0.03 * K0;
    var text = '<p>' + cartText(m1, v1, m2, v2) + ' They collide through a bumper. Just after, cart A moves at ' + (v1f === 0 ? '0 m/s' : F(v1f, 2) + ' m/s') + '.</p>' + DIR;
    var steps = [
      num({ key: 'v2f', label: 'What is cart B\'s velocity just after the collision?', unit: 'm/s', answer: v2f, abs: 0.005, mistakes: [
        { value: (m1 * v1 + m2 * v2 + m1 * v1f) / m2, why: 'Sign: cart A\'s final momentum is ' + (v1f < 0 ? 'negative (it moves left), so subtracting it adds' : 'part of the same total') + '. m<sub>A</sub>v<sub>A</sub> + m<sub>B</sub>v<sub>B</sub> = m<sub>A</sub>v<sub>A</sub>\' + m<sub>B</sub>v<sub>B</sub>\'.' },
        { value: (m1 * v1 - m1 * v1f) / m2, why: 'Cart B\'s momentum before the collision belongs in the total too.' },
        { value: m1 * (v1 - v1f) / m1 + v2, why: 'Momentum, not velocity, is shared: multiply each velocity by its own mass.' }].filter(function(x){ return v2 !== 0 || !/Cart B\'s momentum before/.test(x.why); }) }),
      STEP({ kind: 'choice', key: 'type', practice: '3.B', label: 'Kinetic energy before: ' + fmt(K0, 3) + ' J. After: ' + fmt(K1, 3) + ' J. What kind of collision is this?', fixed: true,
        options: ['Elastic: total kinetic energy is unchanged', 'Inelastic: total kinetic energy decreased', 'Perfectly inelastic: the carts stuck together', 'Impossible: kinetic energy increased'], correct: el ? 0 : 1,
        why: [el ? 'Right. Total K is the same before and after (within rounding), so no energy went into deformation or heating.' : 'Total K went down by ' + fmt(K0 - K1, 3) + ' J, so it is not elastic.',
          !el ? 'Right. Momentum is conserved, but some kinetic energy became thermal energy and deformation in the bumper.' : 'Total K is unchanged (within rounding): nothing was lost, so it is elastic.',
          'The carts move apart at different velocities, so they did not stick.',
          'Kinetic energy did not go up here; an increase would need stored energy released, as in an explosion.'] })
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'onefinal', text: text, steps: steps,
      figure: { kind: 'carts', m1: m1, m2: m2, v1: v1, v2: v2, bumper: 'spring' },
      solution: ['System: both carts; the net external force during the brief collision is about zero, so momentum is conserved.',
        'm<sub>A</sub>v<sub>A</sub> + m<sub>B</sub>v<sub>B</sub> = m<sub>A</sub>v<sub>A</sub>\' + m<sub>B</sub>v<sub>B</sub>\': ' + fmt(m1 * v1 + m2 * v2, 3) + ' = ' + fmt(m1, 2) + '(' + F(v1f, 2) + ') + ' + fmt(m2, 2) + 'v<sub>B</sub>\', so v<sub>B</sub>\' = ' + fmt(v2f, 3) + ' m/s.',
        'K before ' + fmt(K0, 3) + ' J, K after ' + fmt(K1, 3) + ' J: ' + (el ? 'the same, so elastic.' : 'less, so inelastic (but not perfectly: they separate).')],
      values: { m1: m1, m2: m2, v1: v1, v2: v2, v1f: v1f } };
  }
  function genExplode(r, ctx){
    var m1 = mass(r), m2 = mass(r), v2f = speed(r, 0.3, 2.0), v1f = -m2 * v2f / m1, E = energy(m1, m2, v1f, v2f);
    var text = '<p>Cart A (' + fmt(m1, 2) + ' kg) and cart B (' + fmt(m2, 2) + ' kg) sit at rest, touching, with a compressed spring between them. The spring is released, and cart B moves right at ' + fmt(v2f, 2) + ' m/s.</p>' + DIR;
    var steps = [
      num({ key: 'v1f', label: 'What is cart A\'s velocity after the push?', unit: 'm/s', answer: v1f, abs: 0.005, mistakes: [
        { value: -v2f, why: 'Equal and opposite momenta, not velocities: m<sub>A</sub>v<sub>A</sub> = −m<sub>B</sub>v<sub>B</sub>.' },
        { value: m1 * v2f / m2, why: 'Masses swapped and the sign lost: v<sub>A</sub> = −m<sub>B</sub>v<sub>B</sub>/m<sub>A</sub>.' }] }),
      num({ key: 'vcm', label: 'What is the velocity of the system\'s center of mass after the push?', unit: 'm/s', answer: 0, abs: 0.005, practice: '3.B', mistakes: [{ value: v2f, why: 'The spring is internal. With no external force, the center of mass stays at rest, as it was.' }] }),
      num({ key: 'E', label: 'How much energy did the spring release into kinetic energy?', unit: 'J', answer: E, abs: 0.0005, mistakes: [
        { value: 0.5 * m2 * v2f * v2f, why: 'Both carts move after the push: add cart A\'s kinetic energy too.' },
        { value: 0.5 * (m1 + m2) * Math.pow(v2f - v1f, 2), why: 'Find each cart\'s K and add: ½m<sub>A</sub>v<sub>A</sub>² + ½m<sub>B</sub>v<sub>B</sub>².' }] })
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'explode', text: text, steps: steps,
      figure: { kind: 'carts', m1: m1, m2: m2, v1: 0, v2: 0, bumper: 'loaded' },
      solution: ['System: both carts and the spring. The spring force is internal and the track is level, so the total momentum stays 0.',
        '0 = m<sub>A</sub>v<sub>A</sub> + m<sub>B</sub>v<sub>B</sub>, so v<sub>A</sub> = −m<sub>B</sub>v<sub>B</sub>/m<sub>A</sub> = −' + fmt(m2, 2) + ' × ' + fmt(v2f, 2) + ' / ' + fmt(m1, 2) + ' = ' + fmt(v1f, 3) + ' m/s.',
        'The center of mass started at rest and no external force acts, so v<sub>cm</sub> = 0.',
        'K = ½m<sub>A</sub>v<sub>A</sub>² + ½m<sub>B</sub>v<sub>B</sub>² = ' + fmt(E, 3) + ' J, all of it from the spring\'s elastic energy.'],
      values: { m1: m1, m2: m2, v2f: v2f } };
  }
  function genKE(r, ctx){
    var m1 = mass(r), m2 = mass(r), v1 = speed(r, 0.8, 2.5), v2 = r() < 0.5 ? 0 : -speed(r, 0.3, 1.2), e = r.pick([0, 0.4, 0.6, 1, 1]);
    var f = outcome(m1, m2, v1, v2, e), a1 = M.sig(f.v1, 3), a2 = M.sig(f.v2, 3);
    var K0 = energy(m1, m2, v1, v2), K1 = energy(m1, m2, a1, a2), cons = Math.abs(K1 - K0) <= 0.01 * K0;
    var text = '<p>' + cartText(m1, v1, m2, v2) + ' After they collide, cart A moves at ' + F(a1, 3) + ' m/s and cart B at ' + F(a2, 3) + ' m/s.</p>' + DIR;
    var steps = [
      num({ key: 'K0', label: 'What is the total kinetic energy before the collision?', unit: 'J', answer: K0, abs: 0.0005, mistakes: [
        { value: 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2 * (v2 ? 1 : 0) - (v2 ? m2 * v2 * v2 : 0), why: 'Kinetic energy is never negative, even for a cart moving left: v² is positive.' },
        { value: 0.5 * m1 * v1 + 0.5 * m2 * Math.abs(v2), why: 'KE not squared: K = ½mv².' }].filter(function(x){ return isFinite(x.value) && x.value > 0; }) }),
      num({ key: 'K1', label: 'What is the total kinetic energy after?', unit: 'J', answer: K1, abs: 0.0005 }),
      STEP({ kind: 'choice', key: 'cons', practice: '3.B', label: 'Is kinetic energy conserved in this collision?', fixed: true, options: ['Yes: elastic', 'No: inelastic'], correct: cons ? 0 : 1,
        why: [cons ? 'Right. K before and after agree, so the collision is elastic.' : 'K after (' + fmt(K1, 3) + ' J) is less than K before (' + fmt(K0, 3) + ' J): some kinetic energy became thermal energy.',
          !cons ? 'Right. Total K dropped by ' + fmt(K0 - K1, 3) + ' J. Momentum is still conserved; kinetic energy is not.' : 'K before and after agree (within rounding), so nothing was lost: elastic.'] }),
      STEP({ kind: 'choice', key: 'p', practice: '3.C', label: 'Is the total momentum the same before and after?', fixed: true, options: ['Yes, in every collision with no net external force', 'Only if the collision is elastic', 'No, momentum is lost when kinetic energy is lost'], correct: 0,
        why: ['Right. ' + fmt(m1 * v1 + m2 * v2, 3) + ' kg·m/s before and ' + fmt(m1 * a1 + m2 * a2, 3) + ' kg·m/s after: the carts push on each other with equal and opposite forces for the same time.', 'Momentum is conserved in elastic and inelastic collisions alike when the net external force is zero; only kinetic energy depends on the kind.', 'Kinetic energy and momentum are separate: K can turn into thermal energy, but the internal impulses still cancel.'] })
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'ke', text: text, steps: steps,
      figure: { kind: 'carts', m1: m1, m2: m2, v1: v1, v2: v2, bumper: e === 0 ? 'velcro' : 'spring' },
      solution: ['K before = ½m<sub>A</sub>v<sub>A</sub>² + ½m<sub>B</sub>v<sub>B</sub>² = ' + fmt(K0, 3) + ' J (a velocity to the left still gives positive K).',
        'K after = ' + fmt(K1, 3) + ' J.', cons ? 'They agree: elastic.' : 'K went down by ' + fmt(K0 - K1, 3) + ' J: inelastic.',
        'Momentum: ' + fmt(m1 * v1 + m2 * v2, 3) + ' kg·m/s before, ' + fmt(m1 * a1 + m2 * a2, 3) + ' kg·m/s after: conserved, because the net external force on the two-cart system is zero.'],
      values: { m1: m1, m2: m2, v1: v1, v2: v2, a1: a1, a2: a2 } };
  }
  /* A force-time pulse drawn as a triangle or a trapezoid, so its area is
     read with geometry. */
  function genImpulse(r, ctx){
    var shape = r.pick(['tri', 'trap', 'rect']), Fm = r.pick([20, 30, 40, 50, 60, 80, 100, 120, 150, 200]), dt = r.pick([0.02, 0.04, 0.05, 0.06, 0.08, 0.10, 0.12]);
    var ramp = shape === 'trap' ? dt / 4 : 0, J = shape === 'tri' ? 0.5 * Fm * dt : shape === 'rect' ? Fm * dt : Fm * (dt - ramp);
    var m = mass(r), v0 = r() < 0.5 ? 0 : speed(r, 0.3, 1.5), dir = r() < 0.5 ? 1 : -1, vf = v0 + dir * J / m;
    var text = '<p>A ' + fmt(m, 2) + ' kg cart ' + (v0 ? 'moving right at ' + fmt(v0, 2) + ' m/s' : 'at rest') + ' is pushed by a bumper. The graph shows the force on the cart, which points ' + (dir > 0 ? 'right' : 'left') + ', against time.</p>' + DIR;
    var steps = [
      num({ key: 'J', label: 'What impulse does the bumper give the cart? (Give the sign.)', unit: 'N·s', answer: dir * J, abs: 0.0005, mistakes: [
        shape !== 'rect' ? { value: dir * Fm * dt, why: 'The impulse is the area under the force-time graph, not peak force × time: the force is not ' + fmt(Fm, 3) + ' N the whole time.' } : null,
        { value: dir * Fm / dt, why: 'Impulse is force × time (the area), not force ÷ time.' }].filter(Boolean) }),
      num({ key: 'vf', label: 'What is the cart\'s velocity after the push?', unit: 'm/s', answer: vf, abs: 0.005, mistakes: [
        { value: dir * J / m, why: 'The impulse is the change in momentum: Δp = J, so v<sub>f</sub> = v<sub>i</sub> + J/m. Add the starting velocity.' },
        { value: v0 + dir * J * m, why: 'Δv = J/m: divide the impulse by the mass.' }].filter(function(x){ return v0 || !/Add the starting/.test(x.why); }) }),
      num({ key: 'Favg', label: 'What is the average force during the push?', unit: 'N', answer: J / dt, rel: 0.02, practice: '2.B', mistakes: shape === 'rect' ? [] : [{ value: Fm, why: 'That is the peak force. The average force gives the same area over the same time: F<sub>avg</sub> = J/Δt.' }] })
    ];
    if(shape === 'rect') steps.pop();
    return { ctx: ctx.id, topic: ctx.topic, type: 'impulse', text: text, steps: steps,
      figure: { kind: 'ft', shape: shape, Fm: Fm, dt: dt, ramp: ramp, dir: dir },
      solution: ['Impulse = area under the F-t graph = ' + (shape === 'tri' ? '½ × ' + fmt(Fm, 3) + ' N × ' + F(dt, 2) + ' s' : shape === 'rect' ? fmt(Fm, 3) + ' N × ' + F(dt, 2) + ' s' : 'a trapezoid: ' + fmt(Fm, 3) + ' N × (' + F(dt, 2) + ' + ' + F(dt - 2 * ramp, 3) + ')/2 s') + ' = ' + fmt(J, 3) + ' N·s, ' + (dir > 0 ? 'to the right (+).' : 'to the left (−).'),
        'Impulse-momentum theorem: J = Δp = mΔv, so v<sub>f</sub> = ' + F(v0, 2) + ' + (' + F(dir * J, 3) + ')/' + fmt(m, 2) + ' = ' + fmt(vf, 3) + ' m/s.',
        shape === 'rect' ? 'A constant force: its average is the force itself.' : 'F<sub>avg</sub> = J/Δt = ' + fmt(J / dt, 3) + ' N, less than the peak ' + fmt(Fm, 3) + ' N.'],
      values: { shape: shape, Fm: Fm, dt: dt, m: m, v0: v0, dir: dir } };
  }
  function genCM(r, ctx){
    var m1 = mass(r), m2 = mass(r), v1 = speed(r, 0.4, 2.5), v2 = r() < 0.5 ? 0 : -speed(r, 0.3, 1.5), vcm = (m1 * v1 + m2 * v2) / (m1 + m2);
    var text = '<p>' + cartText(m1, v1, m2, v2) + ' They are about to collide.</p>' + DIR;
    var steps = [
      num({ key: 'vcm', label: 'What is the velocity of the two-cart system\'s center of mass?', unit: 'm/s', answer: vcm, abs: 0.005, mistakes: [
        { value: (v1 + v2) / 2, why: 'The center of mass weights each velocity by its mass: v<sub>cm</sub> = (m<sub>A</sub>v<sub>A</sub> + m<sub>B</sub>v<sub>B</sub>)/(m<sub>A</sub> + m<sub>B</sub>).' },
        { value: m1 * v1 + m2 * v2, why: 'That is the total momentum. Divide it by the total mass to get v<sub>cm</sub>.' }] }),
      STEP({ kind: 'choice', key: 'after', practice: '3.B', label: 'After the collision, the center of mass moves', fixed: true,
        options: ['at the same velocity, whatever kind of collision it is', 'faster if the collision is elastic', 'slower, because energy is lost', 'at rest, because the carts stop each other'], correct: 0,
        why: ['Right. The forces between the carts are internal and the net external force is zero, so v<sub>cm</sub> = p/M does not change.', 'v<sub>cm</sub> = p/M, and p is the same before and after in any collision here.', 'Kinetic energy can be lost; momentum, and so v<sub>cm</sub> = p/M, cannot.', 'The carts\' internal forces cannot change the total momentum, so the center of mass keeps moving at ' + F(vcm, 2) + ' m/s.'] })
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'cm', text: text, steps: steps,
      figure: { kind: 'carts', m1: m1, m2: m2, v1: v1, v2: v2, bumper: 'spring', cm: true },
      solution: ['v<sub>cm</sub> = (m<sub>A</sub>v<sub>A</sub> + m<sub>B</sub>v<sub>B</sub>)/(m<sub>A</sub> + m<sub>B</sub>) = (' + fmt(m1 * v1, 3) + ' + ' + F(m2 * v2, 3) + ')/' + fmt(m1 + m2, 3) + ' = ' + fmt(vcm, 3) + ' m/s.',
        'The net external force on the two-cart system is zero, so its momentum, and v<sub>cm</sub> = p/M, stay the same through any collision.'],
      values: { m1: m1, m2: m2, v1: v1, v2: v2 } };
  }
  /* Momentum or energy? Situations a student must sort. */
  var CHOOSE = [
    { t: 'Two carts collide and stick. You know both masses and both velocities before. Find their speed after.', c: 0, w: 'Momentum: the net external force is zero during the collision, and a sticky collision does not conserve kinetic energy.' },
    { t: 'A cart rolls down a frictionless ramp from a known height. Find its speed at the bottom.', c: 1, w: 'Energy: gravity (an external force on the cart) changes its momentum, but in the cart-Earth system with no friction, K + U<sub>g</sub> is constant.' },
    { t: 'A ball of clay hits a block hanging from a string and sticks; the pair swings up. Find the speed just after impact.', c: 0, w: 'Momentum for the impact (it is sticky, so K is not conserved there). Energy only for the swing afterwards.' },
    { t: 'A compressed spring launches a block across a frictionless floor. Find the block\'s speed.', c: 1, w: 'Energy: the wall holds the spring, an external force, so momentum is not conserved; in the block-spring system with no friction, U<sub>s</sub> becomes K.' },
    { t: 'An ice skater pushes off from another skater; both start at rest. Find the second skater\'s speed from the first one\'s.', c: 0, w: 'Momentum: the push is internal, so the total stays 0. The energy they used came from their muscles, which you are not given.' },
    { t: 'A sled slides to a stop on rough snow. Find how far it goes from its starting speed and the friction force.', c: 1, w: 'Energy (work): friction is an external force, so momentum is not conserved; the work done by friction removes the kinetic energy.' },
    { t: 'A bullet passes through a block on a frictionless table. Find the block\'s speed from the bullet\'s speeds before and after.', c: 0, w: 'Momentum: the forces between bullet and block are internal; heating means kinetic energy is not conserved.' }
  ];
  function genChoose(r, ctx){
    var pick = [], pool = CHOOSE.slice();
    while(pick.length < 2){ var i = r.int(0, pool.length - 1); pick.push(pool.splice(i, 1)[0]); }
    var opts = ['Conservation of momentum', 'Conservation of energy'];
    var steps = pick.map(function(s, i){ return STEP({ kind: 'choice', key: 'q' + (i + 1), practice: '3.B', label: s.t + ' Which principle do you start from?', options: opts.slice(), fixed: true, correct: s.c,
      why: opts.map(function(o, j){ return (j === s.c ? 'Right. ' : 'Not this one. ') + s.w; }) }); });
    steps.push(STEP({ kind: 'choice', key: 'why', practice: '3.C', label: 'Which justification earns the point for using momentum conservation in a collision?',
      options: ['The net external force on the two-cart system is zero during the collision, so its momentum is constant.', 'Momentum is conserved because of the law of conservation of momentum.', 'The collision is elastic, so momentum is conserved.', 'Kinetic energy is conserved, so momentum is too.'], correct: 0,
      why: ['Right: it names the system and the condition that makes the principle hold.', 'That is circular: it names the principle without the condition (the readers do not award it).', 'Momentum is conserved in inelastic collisions too; what matters is zero net external force.', 'Kinetic energy is often not conserved in a collision, and it does not decide momentum.'] }));
    return { ctx: ctx.id, topic: ctx.topic, type: 'choose', text: '<p>For each situation, choose the principle that solves it, then pick the justification a reader would accept.</p>', steps: steps,
      figure: null,
      solution: pick.map(function(s){ return s.t + ' <b>' + opts[s.c] + '.</b> ' + s.w; }).concat(['A justification names the system and the condition: zero net external force for momentum, no work by nonconservative or outside forces for mechanical energy.']),
      values: { picks: pick.map(function(s){ return CHOOSE.indexOf(s); }) } };
  }
  /* Momentum bar chart: before and after bars for each cart and the total,
     in units of momentum, for a collision with whole-number values. */
  function genBars(r, ctx){
    var u = r.pick([0.25, 0.5, 1]), m1 = r.pick([1, 2, 3]) * 0.5, m2 = r.pick([1, 2, 3]) * 0.5;
    var pA, pB, fA, fB, kind = r.pick(['sticky', 'bounce', 'explode']);
    // p in units: integers from −6 to 6; momentum is conserved by construction.
    if(kind === 'explode'){ pA = 0; pB = 0; fB = r.int(2, 5); fA = -fB; }
    else {
      pA = r.int(2, 6); pB = r() < 0.5 ? 0 : -r.int(1, Math.min(3, pA - 1));
      var tot = pA + pB;
      if(kind === 'sticky'){ fA = tot * m1 / (m1 + m2); fB = tot - fA; if(Math.abs(fA - Math.round(fA)) > 1e-9){ m2 = m1; fA = tot / 2; fB = tot / 2; if(tot % 2){ pA += 1; tot += 1; fA = tot / 2; fB = tot / 2; } } }
      else {
        // A bounce: cart B ends up at least as fast as A (they separate) and
        // the total kinetic energy does not grow.
        var K0u = pA * pA / m1 + pB * pB / m2, ok = [];
        for(var c = -6; c <= 6; c++){ var b = tot - c; if(c !== pA && Math.abs(b) <= 6 && b / m2 >= c / m1 && c * c / m1 + b * b / m2 <= K0u + 1e-9 && b !== tot * m2 / (m1 + m2) + 0) ok.push(c); }
        fA = ok.length ? r.pick(ok) : tot * m1 / (m1 + m2); fB = tot - fA;
        if(!ok.length){ kind = 'sticky'; if(Math.abs(fA - Math.round(fA)) > 1e-9){ m2 = m1; fA = tot / 2; fB = tot / 2; if(tot % 2){ pA += 1; tot += 1; fA = tot / 2; fB = tot / 2; } } }
      }
    }
    var vA = pA * u / m1, vB = pB * u / m2, wA = fA * u / m1, wB = fB * u / m2;
    var d = function(v){ return v === 0 ? 'at rest' : (v > 0 ? 'right' : 'left') + ' at ' + fmt(Math.abs(v), 3) + ' m/s'; };
    var text = '<p>Cart A (' + fmt(m1, 2) + ' kg) and cart B (' + fmt(m2, 2) + ' kg) are on a level, low-friction track. ' +
      (kind === 'explode' ? 'They start at rest; a spring between them pushes them apart, and cart B moves ' + d(wB) + '.' :
        'Before: A moves ' + d(vA) + ', B is ' + d(vB) + '. ' + (kind === 'sticky' ? 'They stick together.' : 'After the collision, A moves ' + d(wA) + '.')) +
      '</p><p>One unit of momentum = <b>' + fmt(u, 2) + ' kg·m/s</b>. Take right as positive.</p>';
    var cells = [
      { key: 'pA', label: 'Cart A before', ans: pA, ms: pA ? [{ value: -pA, why: 'Sign: right is positive.' }] : [] },
      { key: 'pB', label: 'Cart B before', ans: pB, ms: pB ? [{ value: -pB, why: 'Cart B moves left, so its momentum bar points down (negative).' }] : [] },
      { key: 'pT', label: 'Total before', ans: pA + pB, ms: pB ? [{ value: pA - pB, why: 'The total is the sum with signs: a leftward momentum subtracts.' }] : [] },
      { key: 'fA', label: 'Cart A after', ans: fA, ms: [] },
      { key: 'fB', label: 'Cart B after', ans: fB, ms: [] },
      { key: 'fT', label: 'Total after', ans: fA + fB, ms: [] }
    ];
    if(kind !== 'explode' && fA + fB !== 0) cells[5].ms.push({ value: 0, why: 'The total momentum does not drop to zero in a collision: with no net external force, the total after equals the total before.' });
    if(kind === 'explode') cells[3].ms.push({ value: fB, why: 'The carts are pushed in opposite directions: cart A\'s momentum is equal and opposite to cart B\'s.' });
    cells[5].ms.push({ value: Math.abs(fA) + Math.abs(fB) === Math.abs(fA + fB) ? NaN : Math.abs(fA) + Math.abs(fB), why: 'Momentum is a vector: add with signs, so opposite bars cancel.' });
    var steps = [
      STEP({ kind: 'row', key: 'bars', row: 'bars', practice: '1.A', level: 'analyze', label: 'Build the momentum bar charts: drag each bar (or type its height in units). Bars below the line point left.',
        cells: cells.map(function(c){ return M.cell(c.ans, 0, c.ms.filter(function(m){ return isFinite(m.value) && m.value !== c.ans; }), 0.3); }) }),
      STEP({ kind: 'choice', key: 'total', practice: '3.C', label: 'Why are the two total bars the same?', options: ['The net external force on the two-cart system is zero, so its momentum is constant', 'The collision is elastic', 'Both carts have the same mass', 'The kinetic energy is the same before and after'], correct: 0,
        why: ['Right: the impulses the carts give each other are equal and opposite, and nothing outside pushes.', kind === 'sticky' ? 'A sticky collision is not elastic, and the totals still match.' : 'Elastic or not, momentum is conserved; that condition is about kinetic energy.', 'The masses do not need to match for momentum to be conserved.', 'Kinetic energy is not the reason; it is often not conserved, while momentum is.'] })
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'bars', text: text, steps: steps,
      figure: { kind: 'pbars', cells: cells.map(function(c){ return { key: c.key, label: c.label }; }), unit: u, scene: { m1: m1, m2: m2, v1: vA, v2: vB, bumper: kind === 'sticky' ? 'velcro' : kind === 'explode' ? 'loaded' : 'spring' } },
      solution: ['p = mv for each cart, divided by ' + fmt(u, 2) + ' kg·m/s per unit. Before: A ' + pA + ', B ' + pB + ', total ' + (pA + pB) + '.',
        'After: A ' + fA + ', B ' + fB + ', total ' + (fA + fB) + ' (velocities ' + F(wA, 3) + ' and ' + F(wB, 3) + ' m/s).',
        'The totals match because the net external force on the system is zero; the carts\' forces on each other are internal.'],
      values: { u: u, m1: m1, m2: m2, kind: kind, pA: pA, pB: pB, fA: fA, fB: fB, vA: vA, vB: vB, wA: wA, wB: wB } };
  }

  var GEN = { sticky: genSticky, onefinal: genOneFinal, explode: genExplode, ke: genKE, impulse: genImpulse, cm: genCM, choose: genChoose, bars: genBars };
  var TYPES = ['sticky', 'onefinal', 'explode', 'ke', 'impulse', 'cm', 'choose', 'bars'];
  M.register('collisionLab', {
    TYPES: TYPES, CHOOSE: CHOOSE, outcome: outcome, energy: energy, run: run, area: area,
    generate: function(r, ctx, type){
      var list = (ctx.types || TYPES).filter(function(t){ return GEN[t]; });
      var t = type && list.indexOf(type) > -1 ? type : r.pick(list);
      return GEN[t](r, ctx);
    }
  });
})();
