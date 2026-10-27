/* AP® Psychology calculations: ApPsychCalc (docs/appsych-spec.md section 7,
   docs/appsych-architecture.md "Calculations"). Pure, no DOM: it runs in the
   browser (questions, tools) and in node (the generator, the content check
   and the tests load this very file), so every numeric key, every FRQ "check
   my number" and every tool drill is recomputed by the same code from a
   recipe. It replaces AP® Statistics' distributions library.

   A recipe is { fn, args, pick? }: fn names one of the functions below, args
   its arguments (an argument may itself be a recipe, so recipes nest), pick a
   path into an object result. evaluate(recipe) gives the number.

     percentChange(old, new)            (new - old) / old × 100
     percentOf(pct, quantity)           pct / 100 × quantity
     fractionOf(part, whole)            part / whole × 100 (a share, in %)
     ruleOf70(ratePct)                  70 / rate: the doubling time
     doublingYear(startYear, ratePct)   startYear + 70 / rate ("in what year")
     naturalIncrease(cbr, cdr)          (CBR - CDR) / 10: per 1,000 to %
     growthRate(births, deaths, imm, emig, population)
                                        ((b + i) - (d + e)) / N × 100
     exponential(n0, ratePct, years)    n0 × (1 + r/100)^t (compounded yearly)
     continuous(n0, ratePct, years)     n0 × e^(r t / 100)
     afterDoublings(n0, years, doublingTime)  n0 × 2^(t / Td)
     tenPercent(energy, steps, eff?)    energy × eff^steps (eff 0.10 by default)
     trophicEnergy(energy, fromLevel, toLevel, eff?)  the same, by level number
     npp(gpp, respiration)              GPP - R
     gpp(npp, respiration)              NPP + R
     halfLifeLeft(amount, halfLife, time)      amount × 0.5^(t / T½)
     halfLives(time, halfLife)          t / T½
     timeToFraction(fraction, halfLife) T½ × log2(1 / fraction)
     convert(value, from, to)           a unit conversion (UNITS below)
     chain(value, unit, factors)        dimensional analysis: value × each
                                        factor [num, numUnit, den, denUnit];
                                        { value, unit } with units cancelled
     perCapita(total, population)       total / population
     density(count, area)               count / area
     efficiency(output, input)          output / input × 100
     chainEfficiency(effs...)           the product of efficiencies (each a
                                        fraction or a percent over 1), as %
     inputNeeded(output, effPct)        output / (eff / 100)
     cost(quantity, price)              quantity × price
     savings(before, after, price?)     (before - after) × price
     emissions(quantity, factor)        quantity × emission factor
     doseAt(points, response)           the dose at a response (LD50 at 50)
                                        read from a curve by linear
                                        interpolation; points [[dose, %], ...]
     ld50(points)                       doseAt(points, 50)
     doseFor(mgPerKg, bodyKg)           a whole-body dose
     biomagnify(conc, factor, steps)    conc × factor^steps
     magnification(high, low)           high / low
     tfr(asfrPer1000, bandYears?)       sum of age-specific rates × band / 1000
     aboveReplacement(tfr, level?)      tfr - 2.1
     waterVolume(depth, area)           depth × area (consistent units)
     waterPerArea(volume, area)         volume / area
     add, sub, mul, div, pow, round, min, max   arithmetic for nesting

   UNITS: factors to a base unit per dimension (energy J, mass kg, length m,
   area m², volume m³, time s, power W). Metric prefixes and scale words are
   read by ApPsychGrade; here a unit is one of the listed symbols. */
(function(root){
  'use strict';

  function num(x, name){
    if(typeof x !== 'number' || !isFinite(x)) throw new Error('ApPsychCalc: ' + (name || 'argument') + ' must be a finite number, got ' + JSON.stringify(x));
    return x;
  }
  function pos(x, name){ num(x, name); if(!(x > 0)) throw new Error('ApPsychCalc: ' + (name || 'argument') + ' must be positive'); return x; }

  /* Conversion factors to the base unit of each dimension. Sources: NIST SP
     811 (exact definitions where they exist); the BTU is the International
     Table BTU; a ton is the US short ton, a tonne (metric ton) 1000 kg. */
  var UNITS = {
    // energy, base J
    J: ['energy', 1], kJ: ['energy', 1e3], MJ: ['energy', 1e6], GJ: ['energy', 1e9], TJ: ['energy', 1e12], EJ: ['energy', 1e18],
    Wh: ['energy', 3600], kWh: ['energy', 3.6e6], MWh: ['energy', 3.6e9], GWh: ['energy', 3.6e12], TWh: ['energy', 3.6e15],
    cal: ['energy', 4.184], kcal: ['energy', 4184], BTU: ['energy', 1055.05585262], quad: ['energy', 1.05505585262e18],
    therm: ['energy', 1.05505585262e8],
    // power, base W
    W: ['power', 1], kW: ['power', 1e3], MW: ['power', 1e6], GW: ['power', 1e9],
    // mass, base kg
    mg: ['mass', 1e-6], g: ['mass', 1e-3], kg: ['mass', 1], t: ['mass', 1000], tonne: ['mass', 1000],
    lb: ['mass', 0.45359237], ton: ['mass', 907.18474], oz: ['mass', 0.028349523125],
    // length, base m
    mm: ['length', 1e-3], cm: ['length', 1e-2], m: ['length', 1], km: ['length', 1e3],
    in: ['length', 0.0254], ft: ['length', 0.3048], yd: ['length', 0.9144], mi: ['length', 1609.344],
    // area, base m²
    m2: ['area', 1], km2: ['area', 1e6], cm2: ['area', 1e-4], ha: ['area', 1e4], acre: ['area', 4046.8564224],
    ft2: ['area', 0.09290304], mi2: ['area', 2589988.110336],
    // volume, base m³
    mL: ['volume', 1e-6], L: ['volume', 1e-3], m3: ['volume', 1], gal: ['volume', 0.003785411784],
    ft3: ['volume', 0.028316846592], 'acre-ft': ['volume', 1233.48183754752],
    // time, base s
    s: ['time', 1], min: ['time', 60], h: ['time', 3600], day: ['time', 86400], week: ['time', 604800],
    yr: ['time', 31557600]  // a Julian year of 365.25 days
  };

  function unitOf(u){
    var x = UNITS[u];
    if(!x) throw new Error('ApPsychCalc: unknown unit "' + u + '" (known: ' + Object.keys(UNITS).join(', ') + ')');
    return x;
  }
  function convert(value, from, to){
    num(value, 'value');
    var a = unitOf(from), b = unitOf(to);
    if(a[0] !== b[0]) throw new Error('ApPsychCalc: cannot convert ' + from + ' (' + a[0] + ') to ' + to + ' (' + b[0] + ')');
    return value * a[1] / b[1];
  }

  /* Dimensional analysis: start from value in unit, multiply by each factor
     [num, numUnit, den, denUnit] (num numUnit per den denUnit). Unit tokens
     are counted with signs, so they cancel as they would on paper: the
     result's unit is what is left. Throws if a factor's denominator unit is
     not present to cancel, the slip the readers name ("conversions written so
     the units do not cancel"). */
  function chain(value, unit, factors){
    num(value, 'value');
    var v = value, u = {};
    // A unit is split on * or · only, so "kg CO2" stays one unit and "kW*h" is two.
    var split = function(tok){ return String(tok).split(/\s*[*·]\s*/).map(function(t){ return t.trim(); }).filter(Boolean); };
    var add = function(tok, k){ split(tok).forEach(function(t){ u[t] = (u[t] || 0) + k; }); };
    add(unit, 1);
    (factors || []).forEach(function(f, i){
      if(!Array.isArray(f) || f.length !== 4) throw new Error('ApPsychCalc.chain: factor ' + (i + 1) + ' must be [num, numUnit, den, denUnit]');
      num(f[0], 'factor numerator'); pos(f[2], 'factor denominator');
      var den = split(f[3]);
      den.forEach(function(t){ if(!(u[t] > 0)) throw new Error('ApPsychCalc.chain: factor ' + (i + 1) + ' divides by ' + t + ', which is not there to cancel'); });
      v = v * f[0] / f[2];
      add(f[1], 1); add(f[3], -1);
    });
    var top = [], bot = [];
    Object.keys(u).forEach(function(k){ var e = u[k]; if(e > 0) top.push(e === 1 ? k : k + '^' + e); else if(e < 0) bot.push(e === -1 ? k : k + '^' + (-e)); });
    return { value: v, unit: top.join('·') + (bot.length ? '/' + bot.join('·') : '') };
  }

  function doseAt(points, response){
    if(!Array.isArray(points) || points.length < 2) throw new Error('ApPsychCalc.doseAt: give at least two [dose, response] points');
    num(response, 'response');
    var p = points.slice().sort(function(a, b){ return a[0] - b[0]; });
    for(var i = 1; i < p.length; i++) if(p[i][1] < p[i - 1][1]) throw new Error('ApPsychCalc.doseAt: responses must not fall as the dose rises');
    for(var j = 1; j < p.length; j++){
      var a = p[j - 1], b = p[j];
      if(response >= a[1] && response <= b[1]){
        if(b[1] === a[1]) return a[0];
        return a[0] + (response - a[1]) * (b[0] - a[0]) / (b[1] - a[1]);
      }
    }
    throw new Error('ApPsychCalc.doseAt: the curve never reaches ' + response + '%');
  }

  var F = {
    percentChange: function(oldV, newV){ num(oldV, 'old'); num(newV, 'new'); if(oldV === 0) throw new Error('ApPsychCalc.percentChange: the old value is 0'); return (newV - oldV) / oldV * 100; },
    percentOf: function(pct, q){ return num(pct, 'percent') / 100 * num(q, 'quantity'); },
    fractionOf: function(part, whole){ return num(part, 'part') / pos(whole, 'whole') * 100; },
    ruleOf70: function(r){ return 70 / pos(r, 'growth rate'); },
    doublingYear: function(start, r){ return num(start, 'start year') + 70 / pos(r, 'growth rate'); },
    naturalIncrease: function(cbr, cdr){ return (num(cbr, 'CBR') - num(cdr, 'CDR')) / 10; },
    growthRate: function(b, d, im, em, n){ return ((num(b, 'births') + num(im || 0, 'immigration')) - (num(d, 'deaths') + num(em || 0, 'emigration'))) / pos(n, 'population') * 100; },
    exponential: function(n0, r, t){ return num(n0, 'start') * Math.pow(1 + num(r, 'rate') / 100, num(t, 'years')); },
    continuous: function(n0, r, t){ return num(n0, 'start') * Math.exp(num(r, 'rate') * num(t, 'years') / 100); },
    afterDoublings: function(n0, t, td){ return num(n0, 'start') * Math.pow(2, num(t, 'years') / pos(td, 'doubling time')); },
    tenPercent: function(e, steps, eff){ return num(e, 'energy') * Math.pow(eff == null ? 0.1 : pos(eff, 'efficiency'), num(steps, 'steps')); },
    trophicEnergy: function(e, from, to, eff){ return F.tenPercent(e, num(to, 'to level') - num(from, 'from level'), eff); },
    npp: function(g, r){ return num(g, 'GPP') - num(r, 'respiration'); },
    gpp: function(n, r){ return num(n, 'NPP') + num(r, 'respiration'); },
    halfLifeLeft: function(a, hl, t){ return num(a, 'amount') * Math.pow(0.5, num(t, 'time') / pos(hl, 'half-life')); },
    halfLives: function(t, hl){ return num(t, 'time') / pos(hl, 'half-life'); },
    timeToFraction: function(f, hl){ if(!(f > 0 && f < 1)) throw new Error('ApPsychCalc.timeToFraction: the fraction left must be between 0 and 1'); return pos(hl, 'half-life') * Math.log(1 / f) / Math.LN2; },
    convert: convert,
    chain: chain,
    perCapita: function(total, n){ return num(total, 'total') / pos(n, 'population'); },
    density: function(c, a){ return num(c, 'count') / pos(a, 'area'); },
    efficiency: function(out, inp){ return num(out, 'output') / pos(inp, 'input') * 100; },
    chainEfficiency: function(){
      var p = 1;
      for(var i = 0; i < arguments.length; i++){ var e = pos(arguments[i], 'efficiency'); p *= e > 1 ? e / 100 : e; }
      return p * 100;
    },
    inputNeeded: function(out, effPct){ return num(out, 'output') / (pos(effPct, 'efficiency') / 100); },
    cost: function(q, price){ return num(q, 'quantity') * num(price, 'price'); },
    savings: function(before, after, price){ return (num(before, 'before') - num(after, 'after')) * (price == null ? 1 : num(price, 'price')); },
    emissions: function(q, factor){ return num(q, 'quantity') * num(factor, 'emission factor'); },
    doseAt: doseAt,
    ld50: function(points){ return doseAt(points, 50); },
    doseFor: function(mgPerKg, kg){ return num(mgPerKg, 'dose per kg') * pos(kg, 'body mass'); },
    biomagnify: function(c, f, steps){ return num(c, 'concentration') * Math.pow(pos(f, 'factor'), num(steps, 'steps')); },
    magnification: function(high, low){ return num(high, 'higher concentration') / pos(low, 'lower concentration'); },
    tfr: function(rates, band){
      if(!Array.isArray(rates) || !rates.length) throw new Error('ApPsychCalc.tfr: give the age-specific fertility rates per 1,000 women');
      var s = 0; rates.forEach(function(r){ s += num(r, 'rate'); });
      return s * (band == null ? 5 : pos(band, 'band')) / 1000;
    },
    aboveReplacement: function(tfr, level){ return num(tfr, 'TFR') - (level == null ? 2.1 : num(level, 'replacement level')); },
    waterVolume: function(depth, area){ return num(depth, 'depth') * num(area, 'area'); },
    waterPerArea: function(v, a){ return num(v, 'volume') / pos(a, 'area'); },
    add: function(){ var s = 0; for(var i = 0; i < arguments.length; i++) s += num(arguments[i]); return s; },
    sub: function(a, b){ return num(a) - num(b); },
    mul: function(){ var p = 1; for(var i = 0; i < arguments.length; i++) p *= num(arguments[i]); return p; },
    div: function(a, b){ if(num(b) === 0) throw new Error('ApPsychCalc.div: division by 0'); return num(a) / b; },
    pow: function(a, b){ return Math.pow(num(a), num(b)); },
    round: function(a, d){ var k = Math.pow(10, d || 0); return Math.round(num(a) * k) / k; },
    min: function(){ return Math.min.apply(null, [].slice.call(arguments).map(function(x){ return num(x); })); },
    max: function(){ return Math.max.apply(null, [].slice.call(arguments).map(function(x){ return num(x); })); }
  };
  var FNS = Object.keys(F);

  function isRecipe(x){ return x && typeof x === 'object' && !Array.isArray(x) && typeof x.fn === 'string'; }
  /* A recipe's value. Arguments that are recipes are evaluated first. */
  function run(recipe){
    if(!isRecipe(recipe)) throw new Error('ApPsychCalc: a recipe is { fn, args, pick? }');
    var f = F[recipe.fn];
    if(!f) throw new Error('ApPsychCalc: unknown recipe "' + recipe.fn + '" (one of ' + FNS.join(', ') + ')');
    var args = (recipe.args || []).map(function a(x){ return isRecipe(x) ? evaluate(x) : Array.isArray(x) ? x.map(a) : x; });
    var v = f.apply(null, args);
    String(recipe.pick || '').split('.').filter(Boolean).forEach(function(k){
      if(v == null || !(k in Object(v))) throw new Error('ApPsychCalc: pick "' + recipe.pick + '" is not in the result of ' + recipe.fn);
      v = v[k];
    });
    return v;
  }
  function evaluate(recipe){
    var v = run(recipe);
    if(typeof v !== 'number' || !isFinite(v)) throw new Error('ApPsychCalc: recipe ' + recipe.fn + ' does not give a number' + (v && typeof v === 'object' ? ' (use pick)' : ''));
    // Floating-point noise off a key a student will see (100.00000000000001 is 100).
    return v === 0 ? 0 : Number(v.toPrecision(12));
  }

  root.ApPsychCalc = { FNS: FNS, UNITS: UNITS, evaluate: evaluate, run: run, isRecipe: isRecipe };
  FNS.forEach(function(k){ root.ApPsychCalc[k] = F[k]; });
})(typeof window !== 'undefined' ? window : globalThis);
