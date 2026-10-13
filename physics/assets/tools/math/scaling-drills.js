/* Scaling drills model: ApPhysMath.scalingDrills (docs/apphys-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY. Pure functions, no DOM, so the validator
   (scripts/lib/apphys-tool-checks/scaling-drills.mjs) and the test
   (scripts/test/apphys-tool-scaling-drills.test.mjs) run exactly this code.

   Functional dependence ("if L is 4 times as long, the period is ... times")
   and units (base-unit checks, SI conversions). Every relation is tagged
   with the map topic that teaches it, so a context (one per topic) lists
   only relations already taught.

     REL[key]     { topic, Y: { sym, name }, vars: [{ sym, name, p, kind }],
                    formula, pic, say } with Y ∝ Π var^p
     EXPR[key]    { topic, html, dims: [m, kg, s], q } an expression and the
                    base units it has
     CONV[key]    { topic, from, to, k, ... } an SI conversion (value × k)
     QTY          named quantities and their dimensions
     factor(p, k) k^p, the factor Y changes by when one variable is scaled by k
     dimsText(d)  "kg·m²/s²" from [2, 1, -2]
     powText(sym, p)  "L²", "√L", "1/r²", ...
     generate(r, ctx, type)  a seeded "Test yourself" problem
     TYPES        factor, combo, units, convert */
(function(){
  'use strict';
  var M = window.ApPhysMath;
  if(!M) return;

  function V(sym, name, p, kind){ return { sym: sym, name: name, p: p, kind: kind || 'length' }; }
  var REL = {
    square: { topic: 'math-proportional', Y: { sym: 'A', name: 'area' }, vars: [V('s', 'side length', 2, 'length')], formula: 'A = s²', pic: 'square', say: 'a square floor tile' },
    cube: { topic: 'math-proportional', Y: { sym: 'V', name: 'volume' }, vars: [V('s', 'edge length', 3, 'length')], formula: 'V = s³', pic: 'cube', say: 'a cube-shaped box' },
    circle: { topic: 'math-proportional', Y: { sym: 'A', name: 'area' }, vars: [V('r', 'radius', 2, 'length')], formula: 'A = πr²', pic: 'circle', say: 'a circular pizza' },
    trip: { topic: 'math-proportional', Y: { sym: 't', name: 'travel time' }, vars: [V('v', 'speed', -1, 'speed'), V('d', 'distance', 1, 'length')], formula: 't = d / v', pic: 'generic', say: 'a bus on a trip' },
    rect: { topic: 'math-proportional', Y: { sym: 'A', name: 'area' }, vars: [V('ℓ', 'length', 1, 'length'), V('w', 'width', 1, 'length')], formula: 'A = ℓw', pic: 'generic', say: 'a rectangular garden' },
    fromrest: { topic: 'motion-representations', Y: { sym: 'Δx', name: 'distance covered' }, vars: [V('t', 'time', 2, 'time'), V('a', 'acceleration', 1, 'accel')], formula: 'Δx = ½at² (from rest)', pic: 'generic', say: 'a cart that starts from rest and speeds up steadily' },
    vat: { topic: 'motion-representations', Y: { sym: 'v', name: 'speed' }, vars: [V('t', 'time', 1, 'time'), V('a', 'acceleration', 1, 'accel')], formula: 'v = at (from rest)', pic: 'generic', say: 'a cart that starts from rest and speeds up steadily' },
    droptime: { topic: 'motion-2d', Y: { sym: 't', name: 'time to fall' }, vars: [V('h', 'drop height', 0.5, 'height'), V('g', 'gravitational field strength', -0.5, 'field')], formula: 't = √(2h/g)', pic: 'drop', say: 'a ball dropped from rest' },
    range: { topic: 'motion-2d', Y: { sym: 'R', name: 'range on level ground' }, vars: [V('v₀', 'launch speed', 2, 'speed')], formula: 'R = v₀² sin(2θ) / g', pic: 'generic', say: 'a ball launched at a fixed angle over level ground' },
    newton: { topic: 'second-law', Y: { sym: 'a', name: 'acceleration' }, vars: [V('F', 'net force', 1, 'force'), V('m', 'mass', -1, 'mass')], formula: 'a = F_net / m', pic: 'generic', say: 'a cart pushed along a frictionless track' },
    gravity: { topic: 'gravitational-force', Y: { sym: 'F_g', name: 'gravitational force' }, vars: [V('r', 'distance between centers', -2, 'distance'), V('m₁', 'mass of one object', 1, 'mass')], formula: 'F_g = Gm₁m₂ / r²', pic: 'orbit', say: 'two moons pulling on each other' },
    surfaceg: { topic: 'gravitational-force', Y: { sym: 'g', name: 'gravitational field at the surface' }, vars: [V('R', 'radius of the planet', -2, 'length'), V('M', 'mass of the planet', 1, 'mass')], formula: 'g = GM / R²', pic: 'generic', say: 'a planet' },
    spring: { topic: 'spring-forces', Y: { sym: 'F_s', name: 'spring force' }, vars: [V('x', 'stretch', 1, 'length'), V('k', 'spring constant', 1, 'stiff')], formula: 'F_s = kx', pic: 'generic', say: 'a stretched spring' },
    centripetal: { topic: 'circular-motion', Y: { sym: 'a_c', name: 'centripetal acceleration' }, vars: [V('v', 'speed', 2, 'speed'), V('r', 'radius of the circle', -1, 'length')], formula: 'a_c = v² / r', pic: 'generic', say: 'a car going around a circular track' },
    ke: { topic: 'kinetic-energy', Y: { sym: 'K', name: 'kinetic energy' }, vars: [V('v', 'speed', 2, 'speed'), V('m', 'mass', 1, 'mass')], formula: 'K = ½mv²', pic: 'car', say: 'a moving car' },
    pespring: { topic: 'potential-energy', Y: { sym: 'U_s', name: 'spring potential energy' }, vars: [V('x', 'compression', 2, 'length'), V('k', 'spring constant', 1, 'stiff')], formula: 'U_s = ½kx²', pic: 'generic', say: 'a compressed spring in a launcher' },
    pegrav: { topic: 'potential-energy', Y: { sym: 'ΔU_g', name: 'change in gravitational potential energy' }, vars: [V('Δh', 'height lifted', 1, 'height'), V('m', 'mass', 1, 'mass')], formula: 'ΔU_g = mgΔh', pic: 'generic', say: 'a box lifted onto a shelf' },
    power: { topic: 'power', Y: { sym: 'P', name: 'average power' }, vars: [V('Δt', 'time taken', -1, 'time'), V('W', 'work done', 1, 'energy')], formula: 'P = W / Δt', pic: 'generic', say: 'a motor lifting a load' },
    momentum: { topic: 'linear-momentum', Y: { sym: 'p', name: 'momentum' }, vars: [V('v', 'speed', 1, 'speed'), V('m', 'mass', 1, 'mass')], formula: 'p = mv', pic: 'car', say: 'a moving cart' },
    impulse: { topic: 'impulse', Y: { sym: 'F_avg', name: 'average force on it' }, vars: [V('Δt', 'collision time', -1, 'time')], formula: 'F_avg = Δp / Δt (same Δp)', pic: 'generic', say: 'an egg stopped by a soft cushion instead of a hard floor, with the same change in momentum' },
    torque: { topic: 'torque', Y: { sym: 'τ', name: 'torque' }, vars: [V('r', 'distance from the hinge', 1, 'length'), V('F', 'force (perpendicular)', 1, 'force')], formula: 'τ = rF sin θ', pic: 'generic', say: 'a push on a door' },
    inertia: { topic: 'rotational-inertia', Y: { sym: 'I', name: 'rotational inertia' }, vars: [V('r', 'distance from the axis', 2, 'length'), V('m', 'mass', 1, 'mass')], formula: 'I = mr² (a small mass)', pic: 'generic', say: 'a small mass on a light rod spinning about an axis' },
    rotke: { topic: 'rotational-kinetic-energy', Y: { sym: 'K_rot', name: 'rotational kinetic energy' }, vars: [V('ω', 'angular speed', 2, 'speed'), V('I', 'rotational inertia', 1, 'inertia')], formula: 'K = ½Iω²', pic: 'generic', say: 'a spinning flywheel' },
    orbitv: { topic: 'orbits', Y: { sym: 'v', name: 'orbital speed' }, vars: [V('r', 'orbit radius', -0.5, 'distance'), V('M', 'mass of the planet', 0.5, 'mass')], formula: 'v = √(GM / r)', pic: 'orbit', say: 'a satellite in a circular orbit' },
    pendulum: { topic: 'shm-period', Y: { sym: 'T', name: 'period' }, vars: [V('L', 'length', 0.5, 'length'), V('m', 'mass of the bob', 0, 'mass'), V('g', 'gravitational field strength', -0.5, 'field')], formula: 'T = 2π√(L / g)', pic: 'pendulum', say: 'a simple pendulum swinging through small angles' },
    springT: { topic: 'shm-period', Y: { sym: 'T', name: 'period' }, vars: [V('m', 'mass of the block', 0.5, 'mass'), V('k', 'spring constant', -0.5, 'stiff'), V('A', 'amplitude', 0, 'length')], formula: 'T = 2π√(m / k)', pic: 'spring', say: 'a block oscillating on a spring' },
    shmE: { topic: 'shm-energy', Y: { sym: 'E', name: 'total energy' }, vars: [V('A', 'amplitude', 2, 'length'), V('k', 'spring constant', 1, 'stiff')], formula: 'E = ½kA²', pic: 'spring', say: 'a block oscillating on a spring' },
    pressure: { topic: 'fluid-pressure', Y: { sym: 'P_gauge', name: 'gauge pressure' }, vars: [V('h', 'depth', 1, 'height'), V('ρ', 'density of the fluid', 1, 'density')], formula: 'P_gauge = ρgh', pic: 'generic', say: 'a diver under water' },
    buoyant: { topic: 'buoyancy', Y: { sym: 'F_b', name: 'buoyant force' }, vars: [V('s', 'edge length of the (fully submerged) cube', 3, 'length'), V('ρ', 'density of the fluid', 1, 'density')], formula: 'F_b = ρ_fluid·V·g with V = s³', pic: 'generic', say: 'a cube held fully under water' },
    continuity: { topic: 'fluid-flow', Y: { sym: 'v', name: 'flow speed in the narrow part' }, vars: [V('d', 'diameter of the narrow part', -2, 'length')], formula: 'A₁v₁ = A₂v₂ with A = πd²/4', pic: 'pipe', say: 'water flowing through a full pipe that narrows' },
    torricelli: { topic: 'fluid-flow', Y: { sym: 'v', name: 'speed of the water leaving a small hole' }, vars: [V('h', 'depth of the hole below the surface', 0.5, 'height')], formula: 'v = √(2gh)', pic: 'generic', say: 'water leaking from a small hole in a tank' }
  };

  /* SI base-unit dimensions [m, kg, s]. */
  var QTY = {
    length: { name: 'a length', d: [1, 0, 0] }, time: { name: 'a time', d: [0, 0, 1] }, mass: { name: 'a mass', d: [0, 1, 0] },
    speed: { name: 'a speed', d: [1, 0, -1] }, accel: { name: 'an acceleration', d: [1, 0, -2] }, force: { name: 'a force', d: [1, 1, -2] },
    energy: { name: 'an energy', d: [2, 1, -2] }, power: { name: 'a power', d: [2, 1, -3] }, momentum: { name: 'a momentum (or an impulse)', d: [1, 1, -1] },
    pressure: { name: 'a pressure', d: [-1, 1, -2] }, density: { name: 'a density', d: [-3, 1, 0] }, area: { name: 'an area', d: [2, 0, 0] },
    volume: { name: 'a volume', d: [3, 0, 0] }, flow: { name: 'a volume flow rate', d: [3, 0, -1] }, inertia: { name: 'a rotational inertia', d: [2, 1, 0] }, stiff: { name: 'a spring constant', d: [0, 1, -2] }
  };
  var EXPR = {
    dt: { topic: 'math-units', html: 'Δx / Δt (a distance over a time)', q: 'speed' },
    dvdt: { topic: 'math-units', html: 'Δv / Δt (a change in speed over a time)', q: 'accel' },
    rho: { topic: 'math-units', html: 'm / V (a mass over a volume)', q: 'density' },
    lw: { topic: 'math-units', html: 'ℓ × w (a length times a width)', q: 'area' },
    halfat2: { topic: 'motion-representations', html: '½at² (a in m/s², t in s)', q: 'length' },
    ma: { topic: 'second-law', html: 'ma (m in kg, a in m/s²)', q: 'force' },
    v2r: { topic: 'circular-motion', html: 'v² / r (v in m/s, r in m)', q: 'accel' },
    halfmv2: { topic: 'kinetic-energy', html: '½mv² (m in kg, v in m/s)', q: 'energy' },
    mgh: { topic: 'potential-energy', html: 'mgh (m in kg, g in m/s², h in m)', q: 'energy' },
    kx: { topic: 'spring-forces', html: 'kx (k in N/m, x in m)', q: 'force' },
    halfkx2: { topic: 'potential-energy', html: '½kx² (k in N/m, x in m)', q: 'energy' },
    fv: { topic: 'power', html: 'Fv (F in N, v in m/s)', q: 'power' },
    wt: { topic: 'power', html: 'W / Δt (W in J, Δt in s)', q: 'power' },
    mv: { topic: 'linear-momentum', html: 'mv (m in kg, v in m/s)', q: 'momentum' },
    ft: { topic: 'impulse', html: 'FΔt (F in N, Δt in s)', q: 'momentum' },
    mr2: { topic: 'rotational-inertia', html: 'mr² (m in kg, r in m)', q: 'inertia' },
    pend: { topic: 'shm-period', html: '2π√(L / g) (L in m, g in m/s²)', q: 'time' },
    springT: { topic: 'shm-period', html: '2π√(m / k) (m in kg, k in N/m)', q: 'time' },
    rhogh: { topic: 'fluid-pressure', html: 'ρgh (ρ in kg/m³, g in m/s², h in m)', q: 'pressure' },
    fa: { topic: 'fluid-pressure', html: 'F / A (F in N, A in m²)', q: 'pressure' },
    rhovg: { topic: 'buoyancy', html: 'ρVg (ρ in kg/m³, V in m³, g in m/s²)', q: 'force' },
    av: { topic: 'fluid-flow', html: 'Av (A in m², v in m/s)', q: 'flow' },
    sqrt2gh: { topic: 'fluid-flow', html: '√(2gh) (g in m/s², h in m)', q: 'speed' }
  };
  var CONV = {
    kmh: { topic: 'math-units', from: 'km/h', to: 'm/s', k: 1 / 3.6, vals: [18, 36, 54, 72, 90, 108, 120], what: 'a car\'s speed', how: '1 km/h = 1000 m / 3600 s, so divide by 3.6', wrong: [{ k: 3.6, why: 'Divide by 3.6, do not multiply: a meter per second is the bigger unit, so the number in m/s is smaller.' }, { k: 1000, why: 'Converting km to m is only half of it: an hour is also 3600 s. Divide by 3.6 overall.' }] },
    g: { topic: 'math-units', from: 'g', to: 'kg', k: 1e-3, vals: [45, 125, 250, 350, 600, 850], what: 'a ball\'s mass', how: '1 kg = 1000 g', wrong: [] },
    cm: { topic: 'math-units', from: 'cm', to: 'm', k: 1e-2, vals: [12, 35, 48, 75, 150, 250], what: 'a length', how: '1 m = 100 cm', wrong: [] },
    mm: { topic: 'math-units', from: 'mm', to: 'm', k: 1e-3, vals: [2.5, 4.0, 15, 32, 125], what: 'a wire\'s diameter', how: '1 m = 1000 mm', wrong: [] },
    cm2: { topic: 'math-units', from: 'cm²', to: 'm²', k: 1e-4, vals: [4.0, 12, 25, 50, 80, 150], what: 'an area', how: '1 m² = (100 cm)² = 10⁴ cm²', wrong: [{ k: 1e-2, why: 'An area has two lengths: 1 m² = 100 cm × 100 cm = 10⁴ cm², not 100 cm².' }] },
    cm3: { topic: 'math-units', from: 'cm³', to: 'm³', k: 1e-6, vals: [8.0, 27, 64, 125, 250, 500], what: 'a block\'s volume', how: '1 m³ = (100 cm)³ = 10⁶ cm³', wrong: [{ k: 1e-2, why: 'A volume has three lengths: 1 m³ = (100 cm)³ = 10⁶ cm³.' }, { k: 1e-4, why: 'A volume has three lengths, not two: 1 m³ = 10⁶ cm³.' }] },
    gcm3: { topic: 'math-units', from: 'g/cm³', to: 'kg/m³', k: 1000, vals: [0.80, 0.92, 1.03, 2.7, 7.8, 11.3], what: 'a density', how: '1 g/cm³ = (10⁻³ kg)/(10⁻⁶ m³) = 1000 kg/m³', wrong: [{ k: 1e-3, why: 'Upside down: a kg/m³ is a much smaller unit than a g/cm³, so the number gets bigger (×1000).' }, { k: 1e-1, why: 'Grams to kilograms is ÷1000, but cm³ to m³ is ÷10⁶ in the denominator, so overall ×1000.' }] },
    min: { topic: 'math-units', from: 'min', to: 's', k: 60, vals: [1.5, 2.5, 4.0, 12, 45], what: 'a time', how: '1 min = 60 s', wrong: [{ k: 1 / 60, why: 'Multiply by 60: there are more seconds than minutes.' }, { k: 100, why: 'A minute is 60 s, not 100 s.' }] },
    L: { topic: 'math-units', from: 'L', to: 'm³', k: 1e-3, vals: [0.50, 1.5, 2.0, 5.0, 20], what: 'a volume of water', how: '1 L = 1000 cm³ = 10⁻³ m³', wrong: [] },
    kN: { topic: 'math-units', from: 'kN', to: 'N', k: 1e3, vals: [1.2, 2.5, 4.8, 15], what: 'a force', how: '1 kN = 1000 N', wrong: [] }
  };

  function factor(p, k){ return Math.pow(k, p); }
  var SUPS = { 2: '²', 3: '³', 4: '⁴', 5: '⁵' };
  function dimsText(d){
    var parts = [['kg', d[1]], ['m', d[0]], ['s', d[2]]], top = [], bot = [];
    parts.forEach(function(x){ if(x[1] > 0) top.push(x[0] + (x[1] > 1 ? SUPS[x[1]] : '')); else if(x[1] < 0) bot.push(x[0] + (x[1] < -1 ? SUPS[-x[1]] : '')); });
    var t = top.length ? top.join('·') : '1';
    if(!bot.length) return t;
    return t + '/' + (bot.length > 1 ? '(' + bot.join('·') + ')' : bot[0]);
  }
  function sub(sym){ return String(sym).replace(/_([A-Za-z]+)/g, '<sub>$1</sub>'); }
  function powText(sym, p){
    var s = sub(sym);
    if(p === 0) return 'does not depend on ' + s;
    if(p === 1) return s;
    if(p === 2) return s + '²';
    if(p === 3) return s + '³';
    if(p === 0.5) return '√' + s;
    if(p === -1) return '1/' + s;
    if(p === -2) return '1/' + s + '²';
    if(p === -0.5) return '1/√' + s;
    return s + '^' + p;
  }
  var KS = { 1: [2, 3, 4, 5, 0.5, 0.25], 2: [2, 3, 4, 0.5, 10], 3: [2, 3, 0.5], 0.5: [4, 9, 16, 0.25, 2], '-1': [2, 3, 4, 0.5, 0.25], '-2': [2, 3, 4, 0.5, 10], '-0.5': [4, 9, 0.25, 16], 0: [2, 3, 4, 0.5] };
  function kWord(k, name){
    var w = { 2: 'doubled', 3: 'tripled', 0.5: 'halved', 0.25: 'cut to one quarter' }[k];
    return w ? 'the ' + name + ' is ' + w : 'the ' + name + ' is made ' + k + ' times as large';
  }
  function kTxt(k){ return k === 0.5 ? '½' : k === 0.25 ? '¼' : String(k); }

  /* ------------------------------------------------------- the drill */
  var TYPES = ['factor', 'combo', 'units', 'convert'];
  var REL_OPTS = [1, 2, 0.5, -1, -2, 3, -0.5, 0];
  function relChoice(rel, v, r){
    var opts = [v.p], pool = REL_OPTS.filter(function(x){ return x !== v.p; });
    // the likeliest confusions first: the square for the root, the inverse, the linear
    var near = [v.p * 2, v.p / 2, -v.p, 1, 0].filter(function(x){ return pool.indexOf(x) > -1; });
    near.concat(pool).forEach(function(x){ if(opts.length < 4 && opts.indexOf(x) < 0) opts.push(x); });
    var text = opts.map(function(x){ return x === 0 ? sub(rel.Y.sym) + ' does not depend on ' + sub(v.sym) : sub(rel.Y.sym) + ' ∝ ' + powText(v.sym, x); });
    var why = opts.map(function(x, i){
      if(i === 0) return 'Right: ' + sub(rel.formula) + (v.p === 0 ? ', and ' + sub(v.sym) + ' does not appear in it.' : ', so with everything else fixed, ' + sub(rel.Y.sym) + ' ∝ ' + powText(v.sym, v.p) + '.');
      if(x === 0) return sub(v.sym) + ' appears in ' + sub(rel.formula) + ', so changing it does change ' + sub(rel.Y.sym) + '.';
      if(v.p === 0) return sub(v.sym) + ' is not in ' + sub(rel.formula) + ', so ' + sub(rel.Y.sym) + ' does not depend on it.';
      if(x === -v.p) return 'Check whether ' + sub(v.sym) + ' is in the numerator or the denominator of ' + sub(rel.formula) + '.';
      return 'Look at the power of ' + sub(v.sym) + ' in ' + sub(rel.formula) + (Math.abs(v.p) === 0.5 ? ' (a square root is a power of ½).' : '.');
    });
    return { options: text, why: why };
  }
  function factorMistakes(p, k){
    var out = [];
    if(p !== 1) out.push({ value: k, why: 'That treats the dependence as linear. ' + (p === 0 ? 'This quantity does not depend on it at all: the factor is 1.' : 'Raise the factor to the power in the formula.') });
    if(p === 0.5 || p === -0.5) out.push({ value: Math.pow(k, 4 * p), why: 'You squared the factor, but the formula has a square ROOT: raise the factor to the power ½' + (p < 0 ? ' and take the reciprocal.' : ' (4 times as much gives twice as much).') });
    if(p !== 0){
      out.push({ value: Math.pow(k, -p), why: 'Upside down: check whether the variable is in the numerator or the denominator.' });
      out.push({ value: Math.pow(k, 2 * p), why: 'You squared once too often. Use the power in the formula: ' + (p === 0.5 || p === -0.5 ? 'a square root is a power of ½.' : 'only one square.') });
      if(Math.abs(p) >= 1) out.push({ value: Math.pow(k, p / 2), why: 'You took a square root that is not in the formula.' });
      out.push({ value: k * Math.abs(p), why: 'Multiply the factor by itself (a power), do not multiply it by the exponent.' });
    }
    return out;
  }
  function pickVar(r, rel){ return r.pick(rel.vars); }
  function pickK(r, p){ return r.pick(KS[p] || KS[1]); }
  function relsOf(ctx){ return (ctx.relations || []).map(function(k){ return REL[k]; }).filter(Boolean); }

  var GEN = {
    factor: function(r, ctx){
      var key = r.pick(ctx.relations), rel = REL[key], v = pickVar(r, rel), k = pickK(r, v.p), ans = factor(v.p, k), ch = relChoice(rel, v, r);
      var others = rel.vars.filter(function(x){ return x !== v; }).map(function(x){ return x.name; });
      var text = '<p>For ' + rel.say + ', ' + kWord(k, v.name + ' ' + sub(v.sym)) + (others.length ? ', and the ' + others.join(' and the ') + (others.length > 1 ? ' stay' : ' stays') + ' the same' : ', and nothing else changes') + '.</p><p>By what factor does the ' + rel.Y.name + ' ' + sub(rel.Y.sym) + ' change?</p>';
      return {
        values: { rel: key, v: v.sym, p: v.p, k: k, ans: ans },
        text: text,
        steps: [
          { key: 'dep', kind: 'choice', label: 'How does ' + sub(rel.Y.sym) + ' depend on ' + sub(v.sym) + '?', options: ch.options, correct: 0, why: ch.why, practice: '2.D', fixed: false },
          { key: 'k', kind: 'num', label: sub(rel.Y.sym) + '<sub>new</sub> / ' + sub(rel.Y.sym) + '<sub>old</sub>', unit: '', hint: 'Give a decimal (0.25 for one quarter). ' + (v.p === 0 ? '' : 'Factor = (' + kTxt(k) + ')' + (v.p === 0.5 ? ' to the power ½' : v.p === -0.5 ? ' to the power −½' : v.p === 1 ? '' : v.p === -1 ? ' to the power −1' : ' to the power ' + v.p) + '.'), practice: '2.D', d: null,
            cell: M.cell(ans, 0.012, factorMistakes(v.p, k)) }
        ],
        solution: [sub(rel.formula) + ': with everything else fixed, ' + (v.p === 0 ? sub(rel.Y.sym) + ' does not depend on ' + sub(v.sym) + '.' : sub(rel.Y.sym) + ' ∝ ' + powText(v.sym, v.p) + '.'),
          'Factor = (' + kTxt(k) + ')' + (v.p === 1 ? '' : v.p === 0.5 ? '<sup>½</sup>' : v.p === -0.5 ? '<sup>−½</sup>' : '<sup>' + String(v.p).replace('-', '−') + '</sup>') + ' = ' + M.fmt(ans, 3) + (ans > 1 ? ': ' + sub(rel.Y.sym) + ' becomes ' + M.fmt(ans, 3) + ' times as large.' : ans < 1 ? ': ' + sub(rel.Y.sym) + ' becomes ' + M.fmt(ans, 3) + ' of what it was.' : ': no change.')]
      };
    },
    combo: function(r, ctx){
      var pool = (ctx.relations || []).filter(function(k){ return REL[k].vars.filter(function(v){ return v.p !== 0; }).length >= 2; });
      var key = r.pick(pool), rel = REL[key], vs = rel.vars.filter(function(v){ return v.p !== 0; }).slice(0, 2), a = vs[0], b = vs[1];
      var ka = pickK(r, a.p), kb = pickK(r, b.p);
      for(var i = 0; i < 6 && ka === kb; i++) kb = pickK(r, b.p);
      var fa = factor(a.p, ka), fb = factor(b.p, kb), tot = fa * fb;
      var text = '<p>For ' + rel.say + ', ' + kWord(ka, a.name + ' ' + sub(a.sym)) + ' and ' + kWord(kb, b.name + ' ' + sub(b.sym)) + ' at the same time.</p><p>By what factor does the ' + rel.Y.name + ' ' + sub(rel.Y.sym) + ' change?</p>';
      return {
        values: { rel: key, a: a.sym, b: b.sym, ka: ka, kb: kb, ans: tot },
        text: text,
        steps: [
          { key: 'fa', kind: 'num', label: 'Factor from ' + sub(a.sym) + ' alone', unit: '', hint: sub(rel.Y.sym) + ' ∝ ' + powText(a.sym, a.p) + '. Give a decimal.', practice: '2.D', d: null, cell: M.cell(fa, 0.012, factorMistakes(a.p, ka)) },
          { key: 'fb', kind: 'num', label: 'Factor from ' + sub(b.sym) + ' alone', unit: '', hint: sub(rel.Y.sym) + ' ∝ ' + powText(b.sym, b.p) + '. Give a decimal.', practice: '2.D', d: null, cell: M.cell(fb, 0.012, factorMistakes(b.p, kb)) },
          { key: 'tot', kind: 'num', label: 'Total factor ' + sub(rel.Y.sym) + '<sub>new</sub> / ' + sub(rel.Y.sym) + '<sub>old</sub>', unit: '', hint: 'Independent changes multiply.', practice: '2.D', d: null,
            cell: M.cell(tot, 0.012, [{ value: fa + fb, why: 'Factors multiply, they do not add: each change scales the result again.' }, { value: fa / fb, why: 'Multiply the two factors (each one already accounts for numerator or denominator).' }, { value: fb / fa, why: 'Multiply the two factors (each one already accounts for numerator or denominator).' }]) }
        ],
        solution: [sub(rel.formula) + '.', sub(a.sym) + ' scaled by ' + kTxt(ka) + ' gives a factor ' + M.fmt(fa, 3) + '; ' + sub(b.sym) + ' scaled by ' + kTxt(kb) + ' gives ' + M.fmt(fb, 3) + '.', 'Together: ' + M.fmt(fa, 3) + ' × ' + M.fmt(fb, 3) + ' = ' + M.fmt(tot, 3) + '.']
      };
    },
    units: function(r, ctx){
      var key = r.pick(ctx.exprs), e = EXPR[key], q = QTY[e.q], d = q.d;
      // distractors: the same expression with one exponent off by one (unique, not the key)
      var cand = [], seen = {}; seen[d.join()] = 1;
      [[0, 1], [2, 1], [0, -1], [2, -1], [1, 1], [1, -1]].forEach(function(c){ var x = d.slice(); x[c[0]] += c[1]; if(!seen[x.join()] && !(x[0] === 0 && x[1] === 0 && x[2] === 0)){ seen[x.join()] = 1; cand.push(x); } });
      var picks = [];
      while(picks.length < 3 && cand.length){ var i = Math.floor(r() * cand.length); picks.push(cand.splice(i, 1)[0]); }
      var opts = [dimsText(d)].concat(picks.map(dimsText));
      var qkeys = Object.keys(QTY).filter(function(k){ return QTY[k].d.join() !== d.join(); });
      var qopts = [q.name], qpool = qkeys.slice();
      while(qopts.length < 4){ var j = Math.floor(r() * qpool.length); qopts.push(QTY[qpool.splice(j, 1)[0]].name); }
      var named = { N: 'kg·m/s²', J: 'kg·m²/s²', W: 'kg·m²/s³', Pa: 'kg/(m·s²)' };
      return {
        values: { expr: key, dims: d },
        text: '<p>Unit check: what are the SI base units (kg, m, s) of ' + e.html + '?</p>',
        steps: [
          { key: 'base', kind: 'choice', label: 'Base units of ' + e.html.replace(/ \(.*\)$/, ''), options: opts, correct: 0, practice: '2.A', fixed: false,
            why: opts.map(function(o, i){ return i === 0 ? 'Right: write each quantity in base units (N = kg·m/s², J = kg·m²/s², Pa = kg/(m·s²)) and combine the powers.' : 'Not quite: write each quantity in kg, m and s, then add the powers. One power here is off by one.'; }) },
          { key: 'qty', kind: 'choice', label: 'So the expression is', options: qopts, correct: 0, practice: '2.A', fixed: false,
            why: qopts.map(function(o, i){ return i === 0 ? 'Right: ' + dimsText(d) + ' are the units of ' + q.name + '.' : 'Not this one: ' + o + ' has different base units from ' + dimsText(d) + '.'; }) }
        ],
        solution: ['Base units: ' + dimsText(d) + '.', 'Those are the units of ' + q.name + '. (Named units: N = kg·m/s², J = kg·m²/s², W = kg·m²/s³, Pa = kg/(m·s²).)']
      };
    },
    convert: function(r, ctx){
      var keys = (ctx.convs || []).slice(), a = keys.splice(Math.floor(r() * keys.length), 1)[0], b = keys.length ? r.pick(keys) : a;
      function one(key, sk){
        var c = CONV[key], x = r.pick(c.vals), ans = x * c.k;
        var ms = c.wrong.map(function(w){ return { value: x * w.k, why: w.why }; });
        return { c: c, x: x, step: { key: sk, kind: 'num', label: 'Convert ' + c.what + ', ' + M.fmt(x, 3) + ' ' + c.from + ', to ' + c.to, unit: c.to, hint: c.how + '.', practice: '2.B', d: null, cell: M.cell(ans, 0.006, ms) }, ans: ans };
      }
      var s1 = one(a, 'c1'), s2 = one(b, 'c2');
      return {
        values: { a: a, b: b, xa: s1.x, xb: s2.x },
        text: '<p>Before using an equation, put every quantity in SI units. Convert ' + M.fmt(s1.x, 3) + ' ' + s1.c.from + ' to ' + s1.c.to + ' and ' + M.fmt(s2.x, 3) + ' ' + s2.c.from + ' to ' + s2.c.to + '.</p>',
        steps: [s1.step, s2.step],
        solution: [M.fmt(s1.x, 3) + ' ' + s1.c.from + ' = ' + M.fmt(s1.ans, 3) + ' ' + s1.c.to + ' (' + s1.c.how + ').', M.fmt(s2.x, 3) + ' ' + s2.c.from + ' = ' + M.fmt(s2.ans, 3) + ' ' + s2.c.to + ' (' + s2.c.how + ').']
      };
    }
  };
  function generate(r, ctx, type){
    var types = ctx.types || TYPES, t = type && types.indexOf(type) > -1 ? type : r.pick(types);
    var p = GEN[t](r, ctx);
    p.type = t; p.ctx = ctx.id; p.topic = ctx.topic;
    return p;
  }

  M.register('scalingDrills', {
    REL: REL, EXPR: EXPR, CONV: CONV, QTY: QTY, TYPES: TYPES, KS: KS,
    factor: factor, dimsText: dimsText, powText: powText, kWord: kWord, kTxt: kTxt, sub: sub, relsOf: relsOf, generate: generate
  });
})();
