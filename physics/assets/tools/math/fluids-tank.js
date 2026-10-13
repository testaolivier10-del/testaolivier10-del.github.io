/* Fluids tank model: ApPhysMath.fluidsTank (docs/apphys-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY. Pure functions, no DOM, SI units throughout, so the
   validator (scripts/lib/apphys-tool-checks/fluids-tank.mjs) and the test
   (scripts/test/apphys-tool-fluids-tank.test.mjs) run exactly this code.

   Ideal fluids only (incompressible, no viscosity, pipes full: the CED
   boundary). P_atm = 1.0 × 10⁵ Pa and g = 9.8 m/s² (the equations sheet).

     FLUIDS, OBJECTS             the explorer's fluids and objects
     volume(o), mass(o)          of an object { shape: 'box'|'ball', side|r, rho }
     submerged(o, y)             volume below the surface when the object's
                                 bottom is y below it (m); y < 0: above
     settle(o, rhoF)             { state: 'floats'|'sinks'|'hovers', frac, y }
     sim(o, rhoF, floorY)        a drop: { step(dt) -> state } integrated with
                                 semi-implicit Euler in 1 ms substeps; the
                                 water's drag is a damping term that settles
                                 the motion and never moves the end state
     forces(o, rhoF, y, floorY)  { Fg, Fb, N } on a resting object (N)
     scale(o, rhoF, hookDepth)   a spring scale lowering o: { reading, y, slack }
     pressure(depth, rhoF)       { gauge, abs } in Pa
     pipe(o)                     continuity and Bernoulli: { A1, A2, v2, P2, Q }
     hole(H, yHole)              Torricelli from energy: { h, v, t, range }
     generate(r, ctx, type)      a seeded "Test yourself" problem
     TYPES                       the drill's problem kinds */
(function(){
  'use strict';
  var M = window.ApPhysMath;
  if(!M) return;
  var G = M.C.g, ATM = M.C.ATM, PI = Math.PI;

  var FLUIDS = {
    water: { key: 'water', name: 'Water', rho: 1000 },
    oil: { key: 'oil', name: 'Light oil', rho: 800 },
    salt: { key: 'salt', name: 'Salt water', rho: 1025 }
  };
  var OBJECTS = {
    wood: { key: 'wood', name: 'Wood block', shape: 'box', side: 0.10, rho: 500 },
    ice: { key: 'ice', name: 'Ice cube', shape: 'box', side: 0.08, rho: 917 },
    aluminum: { key: 'aluminum', name: 'Aluminum block', shape: 'box', side: 0.05, rho: 2700 },
    ball: { key: 'ball', name: 'Hollow ball', shape: 'ball', r: 0.06, rho: 1000 }
  };

  function volume(o){ return o.shape === 'ball' ? 4 / 3 * PI * o.r * o.r * o.r : o.side * o.side * o.side; }
  function mass(o){ return o.rho * volume(o); }
  function height(o){ return o.shape === 'ball' ? 2 * o.r : o.side; }
  function waterplane(o){ return o.shape === 'ball' ? PI * o.r * o.r : o.side * o.side; }
  /* Volume below the surface when the object's lowest point is y below it. */
  function submerged(o, y){
    var hgt = height(o), d = Math.max(0, Math.min(hgt, y));
    if(o.shape === 'ball') return PI * d * d * (3 * o.r - d) / 3;
    return o.side * o.side * d;
  }
  /* Depth of the bottom that displaces volume V (bisection: works for both shapes). */
  function depthFor(o, V){
    var lo = 0, hi = height(o);
    for(var i = 0; i < 60; i++){ var mid = (lo + hi) / 2; if(submerged(o, mid) < V) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  var HOVER = 0.002;   // within 0.2% of the fluid's density: neutrally buoyant
  function settle(o, rhoF){
    var r = o.rho / rhoF;
    if(Math.abs(r - 1) <= HOVER) return { state: 'hovers', frac: 1, y: null };
    if(r > 1) return { state: 'sinks', frac: 1, y: null };
    return { state: 'floats', frac: r, y: depthFor(o, r * volume(o)) };
  }

  /* Forces on the object (N), with y the depth of its bottom (m). */
  function forces(o, rhoF, y, floorY){
    var m = mass(o), Fg = m * G, Fb = rhoF * submerged(o, y) * G;
    var onFloor = floorY != null && y >= floorY - 1e-6;
    var N = onFloor ? Math.max(0, Fg - Fb) : 0;
    return { Fg: Fg, Fb: Fb, N: N, net: Fg - Fb - N };
  }

  /* A drop from y0 (negative: above the surface). The drag term is
     b·v (critical-ish damping on the waterline stiffness ρ_f·g·A) plus a
     quadratic part; it only decides how fast the bobbing dies out. */
  function sim(o, rhoF, floorY, y0){
    var m = mass(o), k = rhoF * G * waterplane(o), b = 0.55 * 2 * Math.sqrt(k * m), hgt = height(o);
    var s = { y: y0 == null ? -0.14 : y0, v: 0, t: 0, still: false };
    function acc(y, v){
      var sub = submerged(o, y), inside = Math.min(1, sub / volume(o));
      var F = m * G - rhoF * sub * G - (b * v + 0.6 * rhoF * waterplane(o) * v * Math.abs(v)) * inside;
      // Added mass of the displaced fluid (half the submerged volume) keeps a
      // light object from snapping up unphysically fast.
      return F / (m + 0.5 * rhoF * sub);
    }
    function step(dt){
      var n = Math.max(1, Math.ceil(dt / 0.001)), h = dt / n;
      for(var i = 0; i < n; i++){
        s.v += acc(s.y, s.v) * h;
        s.y += s.v * h;
        if(floorY != null && s.y > floorY){ s.y = floorY; if(s.v > 0) s.v = 0; }
      }
      s.t += dt;
      var a = acc(s.y, s.v), rest = floorY != null && s.y >= floorY - 1e-9 && a >= 0;
      s.still = Math.abs(s.v) < 0.002 && (rest || Math.abs(a) < 0.02) && s.y > 0;
      return s;
    }
    /* The state the motion ends in (for reduced motion and the readouts). */
    function end(){
      var st = settle(o, rhoF);
      if(st.state === 'floats') s.y = Math.min(st.y, floorY == null ? st.y : floorY);
      else if(st.state === 'sinks') s.y = floorY;
      else s.y = Math.min(floorY, Math.max(hgt, s.y));
      s.v = 0; s.still = true;
      return s;
    }
    return { state: s, step: step, end: end, height: hgt };
  }

  /* A spring scale lowers o until its bottom is hookDepth below the surface
     (the depth it would have on a taut string). If the fluid would hold it
     up there, the string goes slack and it floats at its own depth. */
  function scale(o, rhoF, hookDepth){
    var Fg = mass(o) * G, y = hookDepth, Fb = rhoF * submerged(o, y) * G, slack = false;
    if(Fb > Fg){ var st = settle(o, rhoF); y = st.y; Fb = Fg; slack = true; }
    return { reading: Math.max(0, Fg - Fb), Fg: Fg, Fb: Fb, y: y, slack: slack, frac: submerged(o, y) / volume(o) };
  }

  function pressure(depth, rhoF){ var gauge = rhoF * G * Math.max(0, depth); return { gauge: gauge, abs: ATM + gauge }; }

  /* Ideal flow through a full pipe. o: { rho, v1, d1, d2, y1, y2, P1 } (P1 absolute, Pa). */
  function pipe(o){
    var A1 = PI * o.d1 * o.d1 / 4, A2 = PI * o.d2 * o.d2 / 4, v2 = o.v1 * A1 / A2;
    var P2 = o.P1 + 0.5 * o.rho * (o.v1 * o.v1 - v2 * v2) + o.rho * G * ((o.y1 || 0) - (o.y2 || 0));
    return { A1: A1, A2: A2, v2: v2, P2: P2, Q: A1 * o.v1 };
  }
  /* A small hole yHole above the floor of a wide tank filled to H. The
     surface barely drops, so energy per unit volume gives ½ρv² = ρgh. */
  function hole(H, yHole){
    var h = Math.max(0, H - yHole), v = Math.sqrt(2 * G * h), t = Math.sqrt(2 * yHole / G);
    return { h: h, v: v, t: t, range: v * t };
  }

  /* ------------------------------------------------------- the drill */
  var TYPES = ['density', 'buoyant', 'float', 'apparent', 'pressure', 'continuity', 'bernoulli', 'hole'];
  var REL = 0.015;
  var gTxt = 'Use g = 9.8 m/s².';
  function f3(x){ return M.fmt(x, 3); }
  function f2(x){ return M.fmt(x, 2); }
  function num(key, label, answer, unit, o){
    o = o || {};
    return { key: key, kind: 'num', label: label, unit: unit, hint: o.hint, practice: o.practice || '2.B', cell: M.cell(answer, o.rel || REL, o.mistakes || [], o.abs) };
  }
  function choice(key, label, options, correct, why, practice, fixed){
    return { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: practice || '3.B', fixed: fixed !== false };
  }
  function fluidOf(r, ctx){ return FLUIDS[r.pick(ctx.fluids || ['water', 'salt', 'oil'])]; }
  var MATS = [
    { name: 'pine', rho: 500 }, { name: 'oak', rho: 750 }, { name: 'ice', rho: 917 }, { name: 'polyethylene plastic', rho: 950 },
    { name: 'cork', rho: 240 }, { name: 'aluminum', rho: 2700 }, { name: 'steel', rho: 7800 }, { name: 'concrete', rho: 2400 }, { name: 'brick', rho: 1800 }
  ];

  var GEN = {
    /* 8.1: density from mass and dimensions, then float or sink. */
    density: function(r){
      var mat = r.pick(MATS), fl = FLUIDS[r.pick(['water', 'oil', 'salt'])];
      var a = r.pick([4, 5, 6, 8, 10, 12]), b = r.pick([4, 5, 6, 8, 10]), c = r.pick([2, 3, 4, 5]);
      var V = a * b * c * 1e-6, m = M.sig(mat.rho * V * (0.97 + 0.06 * r()), 3), rho = m / V, sinks = rho > fl.rho;
      var text = '<p>A solid block of ' + mat.name + ' measures ' + a + ' cm × ' + b + ' cm × ' + c + ' cm and has a mass of ' + f3(m * 1000) + ' g.</p><p>What is its density, and does it float or sink in ' + fl.name.toLowerCase() + ' (ρ = ' + fl.rho + ' kg/m³)?</p>';
      return {
        values: { V: V, m: m, rho: rho, rhoF: fl.rho, sinks: sinks },
        text: text,
        steps: [
          num('V', 'Volume of the block', V, 'm³', { hint: '1 cm³ = 10⁻⁶ m³.', practice: '2.B', mistakes: [{ value: V * 1e6, why: 'That is the volume in cm³. One cubic centimeter is 10⁻⁶ m³, not 10⁻² m³: convert each side to meters before multiplying.' }, { value: V * 1e4, why: 'Converting cm to m once is not enough for a volume: each of the three sides is 100 times smaller, so the volume is 10⁶ times smaller.' }] }),
          num('rho', 'Density of the block', rho, 'kg/m³', { hint: 'ρ = m / V, with m in kg.', mistakes: [{ value: m * 1000 / V, why: 'The mass is still in grams. Use kilograms: divide the grams by 1000.' }, { value: V / m, why: 'That is V / m, upside down. Density is mass per volume: ρ = m / V.' }] }),
          choice('sink', 'In ' + fl.name.toLowerCase() + ', the block', ['floats', 'sinks'], sinks ? 1 : 0,
            sinks ? ['The block is denser than the fluid (' + f3(rho) + ' > ' + fl.rho + ' kg/m³). Even fully under, the fluid it displaces weighs less than the block, so the net force stays downward.', 'Right: ρ_block = ' + f3(rho) + ' kg/m³ is more than ρ_fluid = ' + fl.rho + ' kg/m³, so the buoyant force at full submersion is less than the block\'s weight.']
              : ['Right: ρ_block = ' + f3(rho) + ' kg/m³ is less than ρ_fluid = ' + fl.rho + ' kg/m³, so it floats with part of it above the surface.', 'The block is less dense than the fluid (' + f3(rho) + ' < ' + fl.rho + ' kg/m³). Fully under, it would displace fluid heavier than itself, so it rises until it floats.'], '3.B')
        ],
        solution: ['V = ' + a + ' cm × ' + b + ' cm × ' + c + ' cm = ' + (a * b * c) + ' cm³ = ' + f3(V) + ' m³.', 'ρ = m / V = ' + f3(m) + ' kg / ' + f3(V) + ' m³ = ' + f3(rho) + ' kg/m³.',
          'Compare with the fluid: ' + f3(rho) + (sinks ? ' > ' : ' < ') + fl.rho + ' kg/m³, so the block ' + (sinks ? 'sinks' : 'floats') + '.']
      };
    },
    /* 8.3: Archimedes on a fully submerged object (held under or sunk). */
    buoyant: function(r, ctx){
      var fl = fluidOf(r, ctx), mat = r.pick(MATS.filter(function(x){ return x.rho > 1100; })), side = r.pick([4, 5, 6, 8, 10]);
      var V = Math.pow(side / 100, 3), Fb = fl.rho * V * G, Fg = mat.rho * V * G;
      return {
        values: { V: V, rhoF: fl.rho, rhoO: mat.rho, Fb: Fb },
        text: '<p>A ' + side + ' cm cube of ' + mat.name + ' (ρ = ' + mat.rho + ' kg/m³) rests fully under ' + fl.name.toLowerCase() + ' (ρ = ' + fl.rho + ' kg/m³). ' + gTxt + '</p><p>What is the buoyant force on the cube?</p>',
        steps: [
          num('V', 'Volume of fluid the cube displaces', V, 'm³', { hint: 'Fully submerged: V_displaced = V_cube = side³, in meters.', mistakes: [{ value: side * side * side, why: 'That is cm³. Convert the side to meters first: ' + side + ' cm = ' + (side / 100) + ' m.' }] }),
          num('Fb', 'Buoyant force on the cube', Fb, 'N', { hint: 'F_b = ρ_fluid · V_displaced · g.', mistakes: [
            { value: Fg, why: 'You used the cube\'s density. The buoyant force is the weight of the displaced FLUID: use ρ of the ' + fl.name.toLowerCase() + '.' },
            { value: fl.rho * V, why: 'That is the mass of the displaced fluid (kg). Multiply by g to get its weight, which is the buoyant force.' },
            { value: Fg - Fb, why: 'That is the weight minus the buoyant force (what a spring scale would read). The buoyant force alone is ρ_fluid·V·g.' }] }),
          choice('cmp', 'Compared with the cube\'s weight, the buoyant force is', ['smaller', 'equal', 'larger'], 0,
            ['Right: F_b = ' + f3(Fb) + ' N and F_g = ' + f3(Fg) + ' N. Same volume, but the fluid is less dense than ' + mat.name + ', so the cube rests on the bottom with a normal force making up the difference.',
              'Equal only for an object as dense as the fluid (it would hover). Here ρ_cube > ρ_fluid, so F_b < F_g.',
              'A larger buoyant force would push the cube up to the surface. With ρ_cube > ρ_fluid, the displaced fluid weighs less than the cube.'], '2.C')
        ],
        solution: ['Fully submerged, so V_displaced = (' + (side / 100) + ' m)³ = ' + f3(V) + ' m³.', 'F_b = ρ_fluid·V·g = ' + fl.rho + ' × ' + f3(V) + ' × 9.8 = ' + f3(Fb) + ' N (the density of the cube does not enter).',
          'F_g = ρ_cube·V·g = ' + f3(Fg) + ' N, larger, so the cube sinks and the floor pushes up with ' + f3(Fg - Fb) + ' N.']
      };
    },
    /* 8.3: floating: the fraction under the surface. */
    float: function(r, ctx){
      var fl = fluidOf(r, ctx), mats = MATS.filter(function(x){ return x.rho < fl.rho * 0.99; }), mat = r.pick(mats);
      var frac = mat.rho / fl.rho, side = r.pick([6, 8, 10, 12, 20]), depth = frac * side;
      return {
        values: { frac: frac, rhoO: mat.rho, rhoF: fl.rho, depth: depth },
        text: '<p>A ' + side + ' cm cube of ' + mat.name + ' (ρ = ' + mat.rho + ' kg/m³) floats upright in ' + fl.name.toLowerCase() + ' (ρ = ' + fl.rho + ' kg/m³).</p><p>What fraction of its volume is under the surface, and how deep does it sit?</p>',
        steps: [
          choice('why', 'At rest, floating, the buoyant force on the cube is', ['equal to its weight', 'larger than its weight', 'smaller than its weight'], 0,
            ['Right: it is at rest, so the net force is zero: F_b = F_g. That is the equation that gives the fraction.', 'If F_b were larger, the net force would be upward and the cube would still be rising. At rest, the forces balance.', 'If F_b were smaller, the cube would sink. A floating object at rest has F_b = F_g.'], '3.B'),
          num('frac', 'Fraction of the volume under the surface', frac, '', { hint: 'ρ_fluid·V_sub·g = ρ_obj·V·g, so V_sub / V = ρ_obj / ρ_fluid. Give a decimal.', mistakes: [
            { value: fl.rho / mat.rho, why: 'Upside down: V_sub / V = ρ_object / ρ_fluid, which is less than 1 for anything that floats.' },
            { value: 1 - frac, why: 'That is the fraction ABOVE the surface. The fraction under is ρ_object / ρ_fluid.' }] }),
          num('depth', 'Depth of the cube\'s bottom below the surface', depth, 'cm', { hint: 'An upright cube: depth = fraction × side.', mistakes: [{ value: (1 - frac) * side, why: 'That is the height above the surface. The depth under is fraction × side.' }] })
        ],
        solution: ['Floating at rest: F_b = F_g, so ρ_fluid·V_sub·g = ρ_obj·V·g.', 'V_sub / V = ρ_obj / ρ_fluid = ' + mat.rho + ' / ' + fl.rho + ' = ' + f3(frac) + '.', 'Depth = ' + f3(frac) + ' × ' + side + ' cm = ' + f3(depth) + ' cm.']
      };
    },
    /* 8.3: a spring scale holds an object fully under the fluid. */
    apparent: function(r, ctx){
      var fl = fluidOf(r, ctx), mat = r.pick(MATS.filter(function(x){ return x.rho > 1500; }));
      var m = r.pick([0.20, 0.25, 0.30, 0.40, 0.50, 0.60, 0.80, 1.2, 1.5]), V = m / mat.rho, Fg = m * G, Fb = fl.rho * V * G, T = Fg - Fb;
      return {
        values: { m: m, V: V, Fg: Fg, Fb: Fb, T: T, rhoF: fl.rho, rhoO: mat.rho },
        text: '<p>A ' + f3(m) + ' kg piece of ' + mat.name + ' (ρ = ' + mat.rho + ' kg/m³) hangs from a spring scale, fully under ' + fl.name.toLowerCase() + ' (ρ = ' + fl.rho + ' kg/m³) and not touching the bottom. ' + gTxt + '</p><p>What does the scale read?</p>',
        steps: [
          num('Fg', 'Weight of the piece (the reading in air)', Fg, 'N', { hint: 'F_g = mg.', mistakes: [{ value: m, why: 'That is the mass in kg. A spring scale reads a force: multiply by g.' }] }),
          num('Fb', 'Buoyant force on it', Fb, 'N', { hint: 'V = m / ρ_object, then F_b = ρ_fluid·V·g.', mistakes: [{ value: Fg, why: 'That is its weight. The buoyant force uses the fluid\'s density and the volume: ρ_fluid·(m/ρ_object)·g.' }, { value: m / fl.rho * mat.rho * G, why: 'The densities are swapped. V = m / ρ_object; then multiply by ρ_fluid.' }] }),
          num('T', 'Spring scale reading', T, 'N', { hint: 'The piece is at rest: F_scale + F_b = F_g.', mistakes: [{ value: Fg + Fb, why: 'The buoyant force points UP, helping the scale hold the piece, so the scale reads less: F_g − F_b.' }, { value: Fb, why: 'That is the buoyant force. The scale supplies the rest of the upward force: F_g − F_b.' }] })
        ],
        solution: ['F_g = mg = ' + f3(m) + ' × 9.8 = ' + f3(Fg) + ' N.', 'V = m / ρ = ' + f3(m) + ' / ' + mat.rho + ' = ' + f3(V) + ' m³; F_b = ρ_fluid·V·g = ' + fl.rho + ' × ' + f3(V) + ' × 9.8 = ' + f3(Fb) + ' N.',
          'At rest: F_scale + F_b − F_g = 0, so F_scale = ' + f3(Fg) + ' − ' + f3(Fb) + ' = ' + f3(T) + ' N.']
      };
    },
    /* 8.2: pressure at a depth: gauge vs absolute. */
    pressure: function(r, ctx){
      var fl = fluidOf(r, ctx), H = r.pick([1.2, 1.5, 2.0, 2.4, 3.0, 4.0, 5.0]), above = M.round(H * r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5]), 2);
      var d = H - above, gauge = fl.rho * G * d, abs = ATM + gauge;
      return {
        values: { H: H, above: above, d: d, gauge: gauge, abs: abs, rhoF: fl.rho },
        text: '<p>A tank is filled with ' + fl.name.toLowerCase() + ' (ρ = ' + fl.rho + ' kg/m³) to a depth of ' + f3(H) + ' m and is open to the air (P<sub>atm</sub> = 1.0 × 10⁵ Pa). A pressure sensor sits ' + f3(above) + ' m above the bottom. ' + gTxt + '</p><p>Find the gauge and absolute pressure at the sensor.</p>',
        steps: [
          num('d', 'Depth of the sensor below the surface', d, 'm', { mistakes: [{ value: above, why: 'That is the height above the BOTTOM. Pressure depends on the depth below the surface: ' + f3(H) + ' − ' + f3(above) + '.' }] }),
          num('gauge', 'Gauge pressure (above atmospheric)', gauge / 1000, 'kPa', { hint: 'P_gauge = ρgh.', mistakes: [{ value: fl.rho * G * above / 1000, why: 'Use the depth below the surface, not the height above the bottom.' }, { value: abs / 1000, why: 'That is the absolute pressure. Gauge pressure leaves out the atmosphere: ρgh alone.' }] }),
          num('abs', 'Absolute pressure', abs / 1000, 'kPa', { hint: 'P = P_atm + ρgh.', mistakes: [{ value: gauge / 1000, why: 'That is the gauge pressure. The air pushes on the surface too: add P_atm = 100 kPa.' }] })
        ],
        solution: ['Depth below the surface: h = ' + f3(H) + ' − ' + f3(above) + ' = ' + f3(d) + ' m.', 'P_gauge = ρgh = ' + fl.rho + ' × 9.8 × ' + f3(d) + ' = ' + f3(gauge) + ' Pa = ' + f3(gauge / 1000) + ' kPa.',
          'P_abs = P_atm + ρgh = 100 kPa + ' + f3(gauge / 1000) + ' kPa = ' + f3(abs / 1000) + ' kPa.']
      };
    },
    /* 8.4: continuity in a pipe that narrows. */
    continuity: function(r){
      var d1 = r.pick([2.0, 3.0, 4.0, 5.0, 6.0, 8.0]), k = r.pick([1.5, 2, 2.5, 3, 4]), d2 = M.sig(d1 / k, 2), v1 = r.pick([0.40, 0.60, 0.80, 1.2, 1.5, 2.0]);
      var A1 = PI * Math.pow(d1 / 200, 2), A2 = PI * Math.pow(d2 / 200, 2), v2 = v1 * A1 / A2, Q = A1 * v1;
      return {
        values: { d1: d1, d2: d2, v1: v1, v2: v2, Q: Q },
        text: '<p>Water flows through a full horizontal pipe that narrows from an inside diameter of ' + f2(d1) + ' cm to ' + f2(d2) + ' cm. In the wide part it moves at ' + f2(v1) + ' m/s.</p><p>Find the volume flow rate and the speed in the narrow part.</p>',
        steps: [
          num('Q', 'Volume flow rate', Q, 'm³/s', { hint: 'Q = A₁v₁ with A = πd²/4 in m².', mistakes: [{ value: PI * Math.pow(d1 / 100, 2) * v1, why: 'You used the diameter as the radius. A = πr² with r = d/2, or A = πd²/4.' }, { value: PI * Math.pow(d1 / 2, 2) * v1, why: 'The diameter is still in cm. Convert to meters first: the area comes out in m².' }] }),
          num('v2', 'Speed in the narrow part', v2, 'm/s', { hint: 'A₁v₁ = A₂v₂, so v₂ = v₁(d₁/d₂)².', mistakes: [{ value: v1 * d1 / d2, why: 'The speed scales with the AREA ratio, which is the diameter ratio squared.' }, { value: v1 * Math.pow(d2 / d1, 2), why: 'Upside down: the narrow part has the smaller area, so the water there moves faster.' }] }),
          choice('why', 'Why is the water faster in the narrow part?', ['The same volume passes every cross-section each second, and a smaller area needs a larger speed', 'The narrow part squeezes the water, which raises its pressure and pushes it faster', 'Water is compressed in the narrow part, so it speeds up'], 0,
            ['Right: an ideal fluid is incompressible and the pipe is full, so the volume flow rate Av is the same everywhere.', 'The pressure is actually LOWER where the water is faster (Bernoulli); the speed-up comes from continuity, Av = constant.', 'An ideal fluid is incompressible: its density does not change. Continuity (Av constant) is what speeds it up.'], '3.C', false)
        ],
        solution: ['A₁ = π(' + f2(d1 / 100) + ' m)² / 4 = ' + f3(A1) + ' m²; Q = A₁v₁ = ' + f3(Q) + ' m³/s.', 'Continuity: v₂ = v₁·A₁/A₂ = v₁(d₁/d₂)² = ' + f2(v1) + ' × (' + f2(d1) + ' / ' + f2(d2) + ')² = ' + f3(v2) + ' m/s.']
      };
    },
    /* 8.4: Bernoulli in a pipe that narrows and may rise. */
    bernoulli: function(r){
      var rho = 1000, d1 = r.pick([4.0, 5.0, 6.0, 8.0]), k = r.pick([1.5, 2]), d2 = M.sig(d1 / k, 2), v1 = r.pick([0.8, 1.0, 1.2, 1.5, 2.0]);
      var dy = r.pick([0, 0, 0.5, 1.0, 1.5, 2.0, 3.0]), P1k = r.pick([150, 180, 200, 220, 250]);
      var res = pipe({ rho: rho, v1: v1, d1: d1 / 100, d2: d2 / 100, y1: 0, y2: dy, P1: P1k * 1000 });
      var v2 = res.v2, P2 = res.P2, kin = 0.5 * rho * (v1 * v1 - v2 * v2), pot = -rho * G * dy;
      return {
        values: { d1: d1, d2: d2, v1: v1, dy: dy, P1: P1k * 1000, v2: v2, P2: P2 },
        text: '<p>Water (ρ = 1000 kg/m³) flows through a full pipe. At point 1 the inside diameter is ' + f2(d1) + ' cm, the speed is ' + f2(v1) + ' m/s and the absolute pressure is ' + P1k + ' kPa. Point 2 is ' + (dy ? f2(dy) + ' m higher, where' : 'at the same height, where') + ' the diameter is ' + f2(d2) + ' cm. Treat the water as an ideal fluid. ' + gTxt + '</p><p>Find the speed and the pressure at point 2.</p>',
        steps: [
          num('v2', 'Speed at point 2', v2, 'm/s', { hint: 'Continuity first: v₂ = v₁(d₁/d₂)².', mistakes: [{ value: v1 * d1 / d2, why: 'The speed scales with the area ratio, the diameter ratio SQUARED.' }] }),
          num('P2', 'Absolute pressure at point 2', P2 / 1000, 'kPa', { hint: 'P₁ + ½ρv₁² + ρgy₁ = P₂ + ½ρv₂² + ρgy₂.', mistakes: [
            { value: (P1k * 1000 - kin) / 1000, why: 'The kinetic term has the wrong sign: where the water is faster, the pressure is LOWER. P₂ = P₁ + ½ρ(v₁² − v₂²) + ρg(y₁ − y₂).' },
            { value: (P1k * 1000 + 2 * kin + pot) / 1000, why: 'Missing the ½ in ½ρv².' },
            { value: (P1k * 1000 + kin - pot) / 1000, why: 'The height term has the wrong sign: going UP, the pressure drops by ρgΔy.' },
            { value: (P1k * 1000 + 0.5 * rho * Math.pow(v1 - v2, 2) * -1 + pot) / 1000, why: 'Square each speed first: ½ρ(v₁² − v₂²), not ½ρ(v₁ − v₂)².' }] }),
          choice('cmp', 'The pressure at point 2 is lower than at point 1 because', dy ? ['the water is faster there AND it is higher', 'the water is faster there, but height does not matter', 'it is higher there, but speed does not matter'] : ['the water is faster there, so more of its energy per volume is kinetic', 'the narrow pipe wall pushes less on the water', 'some energy is lost to friction in the narrow part'],
            0, dy ? ['Right: both the ½ρv² term and the ρgy term grow from 1 to 2, so P must fall to keep the sum constant.', 'Height matters: going up ' + f2(dy) + ' m costs ρgΔy = ' + f3(rho * G * dy / 1000) + ' kPa of pressure.', 'Speed matters: the kinetic term grows by ' + f3(-kin / 1000) + ' kPa between the two points.']
              : ['Right: P + ½ρv² is constant along a horizontal ideal flow, so a larger speed means a smaller pressure.', 'There is no such effect in Bernoulli\'s equation: the drop comes from the gain in ½ρv².', 'An ideal fluid has no friction (no viscosity); the energy per volume P + ½ρv² + ρgy stays the same.'], '3.C', false)
        ],
        solution: ['Continuity: v₂ = ' + f2(v1) + ' × (' + f2(d1) + ' / ' + f2(d2) + ')² = ' + f3(v2) + ' m/s.',
          'Bernoulli: P₂ = P₁ + ½ρ(v₁² − v₂²) + ρg(y₁ − y₂) = ' + P1k + ' kPa + (' + f3(kin / 1000) + ' kPa)' + (dy ? ' + (' + f3(pot / 1000) + ' kPa)' : '') + ' = ' + f3(P2 / 1000) + ' kPa.']
      };
    },
    /* 8.4: a hole in a tank: speed from energy (Torricelli). */
    hole: function(r){
      var H = r.pick([0.80, 1.0, 1.2, 1.5, 2.0]), yh = M.round(H * r.pick([0.1, 0.2, 0.25, 0.4, 0.5]), 2), res = hole(H, yh);
      return {
        values: { H: H, yHole: yh, h: res.h, v: res.v, range: res.range },
        text: '<p>A wide open tank holds water to a height of ' + f3(H) + ' m. A small hole is ' + f3(yh) + ' m above the floor. The water level drops so slowly that it barely moves. ' + gTxt + '</p><p>How fast does the water leave the hole?</p>',
        steps: [
          num('h', 'Depth of the hole below the surface', res.h, 'm', { mistakes: [{ value: yh, why: 'That is the height of the hole above the floor. The water falls from the SURFACE: h = ' + f3(H) + ' − ' + f3(yh) + '.' }] }),
          num('v', 'Speed of the water leaving the hole', res.v, 'm/s', { hint: 'Energy per unit volume: ρgh = ½ρv², so v = √(2gh).', mistakes: [{ value: Math.sqrt(G * res.h), why: 'Missing the 2: ½ρv² = ρgh gives v² = 2gh.' }, { value: Math.sqrt(2 * G * yh), why: 'Use the depth below the surface, not the height above the floor.' }] })
        ],
        solution: ['h = ' + f3(H) + ' − ' + f3(yh) + ' = ' + f3(res.h) + ' m below the surface.', 'Both the surface and the jet are at atmospheric pressure and the surface is nearly still, so Bernoulli gives ρgh = ½ρv²: v = √(2gh) = √(2 × 9.8 × ' + f3(res.h) + ') = ' + f3(res.v) + ' m/s, the speed of a drop falling ' + f3(res.h) + ' m.']
      };
    }
  };
  /* "F_b" -> F<sub>b</sub> in every student-facing string. */
  function subs(x){ return String(x).replace(/([A-Za-zρΔ])_([A-Za-z]+)/g, '$1<sub>$2</sub>'); }
  function tidy(p){
    p.text = subs(p.text); p.solution = p.solution.map(subs);
    p.steps.forEach(function(s){
      s.label = subs(s.label); if(s.hint) s.hint = subs(s.hint);
      if(s.options) s.options = s.options.map(subs); if(s.why) s.why = s.why.map(subs);
      if(s.cell) s.cell.mistakes.forEach(function(m){ m.why = subs(m.why); });
    });
    return p;
  }
  function generate(r, ctx, type){
    var types = ctx.types || TYPES, t = type && types.indexOf(type) > -1 ? type : r.pick(types);
    var p = tidy(GEN[t](r, ctx));
    p.type = t; p.ctx = ctx.id; p.topic = ctx.topic;
    return p;
  }

  M.register('fluidsTank', {
    FLUIDS: FLUIDS, OBJECTS: OBJECTS, HOVER: HOVER, TYPES: TYPES, MATS: MATS,
    volume: volume, mass: mass, height: height, submerged: submerged, depthFor: depthFor, settle: settle, forces: forces, sim: sim,
    scale: scale, pressure: pressure, pipe: pipe, hole: hole, generate: generate, subs: subs
  });
})();
