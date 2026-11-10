/* ApHugCalc: the arithmetic of AP® Human Geography (docs/aphug-architecture.md,
   "ApHugCalc"). Pure, no DOM; runs in node (the generator, the checks, the
   tests) and in the browser (the trainers, the grader). In place of
   AP® Psychology's ApPsychStats.

   Every number a key, a drill or an exam item shows is a recipe
   { fn, args, pick? }; evaluate(recipe) gives it to 12 significant digits,
   and an argument may itself be a recipe. The exam has no calculator, so the
   numbers in items stay small enough to work by hand (authoring guide).

   Rates (per 1,000 people a year unless the name says percent):
     cbr(births, pop)          crude birth rate: births per 1,000 people
     cdr(deaths, pop)          crude death rate: deaths per 1,000 people
     rni(cbr, cdr)             rate of natural increase, PERCENT: (CBR - CDR) / 10.
                               Migration is not in it (the CR 2023 slip).
     rniPer1000(cbr, cdr)      the same per 1,000 (CBR - CDR)
     doublingTime(rniPct)      years to double by the rule of 70: 70 / RNI%
                               (null when RNI <= 0: the population is not growing)
     netMigrationRate(in, out, pop)   (immigrants - emigrants) per 1,000 people
     growthRate(cbr, cdr, nmr)        population change per 1,000 with migration
   Age and sex:
     dependency(young, old, working)  total dependency ratio: dependents per
                               100 people of working age (15-64)
     youthDependency(young, working)  per 100 of working age
     elderlyDependency(old, working)  per 100 of working age
     sexRatio(males, females)  males per 100 females
   Density (people per unit of land; say which unit):
     arithmeticDensity(pop, totalLand)
     physiologicalDensity(pop, arableLand)     people per unit of farmland
     agriculturalDensity(farmers, arableLand)  farmers per unit of farmland
   Change and comparison:
     percentChange(old, new)   (new - old) / old x 100
     share(part, whole)        part / whole x 100
   Cities and interaction:
     rankSize(largest, rank)   the rank-size rule: largest / rank
     gravity(p1, p2, d, k?)    interaction = k x P1 x P2 / d^2 (k defaults to 1)
   Map scale:
     mapToGround(mapCm, denom)        ground distance in km for a map length in
                               cm at a ratio scale 1:denom
     groundToMap(groundKm, denom)     map length in cm for a ground distance
     scaleDenominator(mapCm, groundKm)  the 1:denom a map length and its
                               ground distance give
   Arithmetic: add sub mul div pow round abs min max sum mean

   Words, not recipes: transitionStage({ cbr, cdr }) names the stage of the
   demographic transition model a pair of rates is CONSISTENT with (spec
   decision 7: a model fits data, a country "is" in no stage); it is a teaching
   helper, never an answer key on its own. */
(function(root){
  'use strict';
  function num(x, what){
    if(typeof x !== 'number' || !isFinite(x)) throw new Error('ApHugCalc: ' + (what || 'a value') + ' must be a finite number (got ' + JSON.stringify(x) + ')');
    return x;
  }
  function pos(x, what){ if(num(x, what) <= 0) throw new Error('ApHugCalc: ' + what + ' must be more than 0'); return x; }
  function nonneg(x, what){ if(num(x, what) < 0) throw new Error('ApHugCalc: ' + what + ' cannot be negative'); return x; }
  function list(d){
    if(!Array.isArray(d) || !d.length) throw new Error('ApHugCalc: a list of numbers is needed');
    d.forEach(function(x){ num(x, 'a list value'); });
    return d;
  }
  function round(v, places){ var p = Math.pow(10, places || 0); return Math.round(num(v) * p) / p; }

  var F = {
    cbr: function(births, pop){ return 1000 * nonneg(births, 'births') / pos(pop, 'population'); },
    cdr: function(deaths, pop){ return 1000 * nonneg(deaths, 'deaths') / pos(pop, 'population'); },
    rni: function(cbr, cdr){ return (nonneg(cbr, 'CBR') - nonneg(cdr, 'CDR')) / 10; },
    rniPer1000: function(cbr, cdr){ return nonneg(cbr, 'CBR') - nonneg(cdr, 'CDR'); },
    doublingTime: function(rniPct){ num(rniPct, 'RNI'); return rniPct > 0 ? 70 / rniPct : null; },
    netMigrationRate: function(inn, out, pop){ return 1000 * (nonneg(inn, 'immigrants') - nonneg(out, 'emigrants')) / pos(pop, 'population'); },
    growthRate: function(cbr, cdr, nmr){ return num(cbr, 'CBR') - num(cdr, 'CDR') + num(nmr, 'net migration rate'); },
    dependency: function(young, old, working){ return 100 * (nonneg(young, 'people under 15') + nonneg(old, 'people 65 and over')) / pos(working, 'people 15-64'); },
    youthDependency: function(young, working){ return 100 * nonneg(young, 'people under 15') / pos(working, 'people 15-64'); },
    elderlyDependency: function(old, working){ return 100 * nonneg(old, 'people 65 and over') / pos(working, 'people 15-64'); },
    sexRatio: function(m, f){ return 100 * nonneg(m, 'males') / pos(f, 'females'); },
    arithmeticDensity: function(pop, land){ return nonneg(pop, 'population') / pos(land, 'land area'); },
    physiologicalDensity: function(pop, arable){ return nonneg(pop, 'population') / pos(arable, 'arable land'); },
    agriculturalDensity: function(farmers, arable){ return nonneg(farmers, 'farmers') / pos(arable, 'arable land'); },
    percentChange: function(a, b){ return 100 * (num(b, 'new value') - pos(a, 'old value')) / a; },
    share: function(part, whole){ return 100 * num(part, 'part') / pos(whole, 'whole'); },
    rankSize: function(largest, rank){ if(!(Number.isInteger(rank) && rank >= 1)) throw new Error('ApHugCalc: rank must be a whole number from 1'); return pos(largest, 'largest city') / rank; },
    gravity: function(p1, p2, d, k){ return (k == null ? 1 : num(k, 'k')) * pos(p1, 'P1') * pos(p2, 'P2') / Math.pow(pos(d, 'distance'), 2); },
    mapToGround: function(mapCm, denom){ return nonneg(mapCm, 'map length') * pos(denom, 'scale denominator') / 100000; },
    groundToMap: function(km, denom){ return nonneg(km, 'ground distance') * 100000 / pos(denom, 'scale denominator'); },
    scaleDenominator: function(mapCm, km){ return pos(km, 'ground distance') * 100000 / pos(mapCm, 'map length'); },
    add: function(){ var s = 0; for(var i = 0; i < arguments.length; i++) s += num(arguments[i]); return s; },
    sub: function(a, b){ return num(a) - num(b); },
    mul: function(){ var p = 1; for(var i = 0; i < arguments.length; i++) p *= num(arguments[i]); return p; },
    div: function(a, b){ if(num(b) === 0) throw new Error('ApHugCalc.div: division by 0'); return num(a) / b; },
    pow: function(a, b){ return Math.pow(num(a), num(b)); },
    round: round,
    abs: function(a){ return Math.abs(num(a)); },
    min: function(){ return Math.min.apply(null, [].slice.call(arguments).map(function(x){ return num(x); })); },
    max: function(){ return Math.max.apply(null, [].slice.call(arguments).map(function(x){ return num(x); })); },
    sum: function(d){ return list(d).reduce(function(s, x){ return s + x; }, 0); },
    mean: function(d){ d = list(d); return F.sum(d) / d.length; }
  };
  var FNS = Object.keys(F);

  /* The DTM stage a pair of rates is consistent with (five stages, framework.md
     section 3). Thresholds are ours, for teaching: high is 30+ per 1,000 for
     births and 20+ for deaths. */
  function transitionStage(r){
    var b = num(r.cbr, 'CBR'), d = num(r.cdr, 'CDR');
    if(b < d) return { stage: 5, why: 'deaths outnumber births, so the population shrinks without migration' };
    if(b >= 30 && d >= 20) return { stage: 1, why: 'both rates are high and close together' };
    if(b >= 30) return { stage: 2, why: 'the birth rate is still high but the death rate has fallen' };
    if(b - d >= 5) return { stage: 3, why: 'the birth rate is falling toward a low death rate' };
    return { stage: 4, why: 'both rates are low and close together' };
  }

  function isRecipe(x){ return !!x && typeof x === 'object' && !Array.isArray(x) && typeof x.fn === 'string'; }
  /* A recipe's value. Arguments that are recipes are evaluated first. */
  function run(recipe){
    if(!isRecipe(recipe)) throw new Error('ApHugCalc: a recipe is { fn, args, pick? }');
    var f = F[recipe.fn];
    if(!f) throw new Error('ApHugCalc: unknown recipe "' + recipe.fn + '" (one of ' + FNS.join(', ') + ')');
    var args = (recipe.args || []).map(function a(x){ return isRecipe(x) ? evaluate(x) : Array.isArray(x) ? x.map(a) : x; });
    var v = f.apply(null, args);
    String(recipe.pick || '').split('.').filter(Boolean).forEach(function(k){
      if(v == null || !(k in Object(v))) throw new Error('ApHugCalc: pick "' + recipe.pick + '" is not in the result of ' + recipe.fn);
      v = v[k];
    });
    return v;
  }
  function evaluate(recipe){
    var v = run(recipe);
    if(typeof v !== 'number' || !isFinite(v)) throw new Error('ApHugCalc: recipe ' + recipe.fn + ' does not give a number' + (v === null ? ' (the population is not growing)' : ''));
    // Floating-point noise off a key a student will see (100.00000000000001 is 100).
    return v === 0 ? 0 : Number(v.toPrecision(12));
  }

  root.ApHugCalc = { FNS: FNS, evaluate: evaluate, run: run, isRecipe: isRecipe, transitionStage: transitionStage };
  FNS.forEach(function(k){ root.ApHugCalc[k] = F[k]; });
})(typeof window !== 'undefined' ? window : globalThis);
