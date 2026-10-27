/* AP® Psychology statistics: ApPsychStats (docs/appsych-spec.md section 7,
   docs/appsych-architecture.md "Statistics"). Pure, no DOM: it runs in the
   browser (questions, tools, plots) and in node (the generator, the content
   check and the tests load this very file), so every numeric key, every tool
   drill and every exam number is recomputed by the same code from a recipe.
   It replaces AP® Environmental Science's ApEnvCalc (spec decision 1).

   The exam allows no calculator (docs/appsych-research/framework.md section
   5): items ask for numbers a student can work out by hand (a mean of a few
   whole numbers, a median, a range, a share under the normal curve by the
   68-95-99.7 rule, a z score with round numbers). The library is exact; the
   authoring guide keeps the numbers small.

   A recipe is { fn, args, pick? }: fn names one of the functions below, args
   its arguments (an argument may itself be a recipe, so recipes nest), pick a
   path into an object result. evaluate(recipe) gives the number.

   Central tendency and variation (data is a list of numbers)
     mean(data)  median(data)  mode(data)   mode: the smallest most common
                                            value; modes(data) lists them all
     range(data)                            max - min
     sd(data)        population standard deviation (divide by n)
     sampleSd(data)  sample standard deviation (divide by n - 1)
     variance(data), sampleVariance(data)
   The normal curve
     z(x, mean, sd)                         (x - mean) / sd
     fromZ(z, mean, sd)                     mean + z × sd
     rulePct(fromZ, toZ)                    percent between two whole-SD
                                            marks by the 68-95-99.7 rule
                                            exactly (34, 13.5, 2.35, 0.15 per
                                            band; ends may be -Infinity/Infinity
                                            written as null)
     percentileRule(z)                      percent below a whole-SD mark by
                                            the rule (z = 1 gives 84)
     cdf(z)                                 the standard normal CDF (0 to 1)
     percentile(x, mean, sd)                100 × cdf(z), the percent below x
     between(a, b, mean, sd)                percent between two values (CDF)
     percentRank(value, data)               percent of the data below value
                                            (ties count half), as in a
                                            percentile rank from raw scores
   Correlation (points are [[x, y], ...])
     r(points)                              Pearson's r
     slope(points), intercept(points)       the least-squares line
     strength(r) -> 'strong' | 'moderate' | 'weak' | 'none'
                    (|r| >= .7, >= .4, >= .1, else none; a teaching rule of
                    thumb, said so wherever it is shown)
     direction(r) -> 'positive' | 'negative' | 'none'
     describe(r) -> 'a strong negative correlation' and so on
   Arithmetic for nesting
     add sub mul div pow round abs min max count sum */
(function(root){
  'use strict';

  function num(x, name){
    if(typeof x !== 'number' || !isFinite(x)) throw new Error('ApPsychStats: ' + (name || 'argument') + ' must be a finite number, got ' + JSON.stringify(x));
    return x;
  }
  function list(d, name, min){
    if(!Array.isArray(d) || d.length < (min || 1)) throw new Error('ApPsychStats: ' + (name || 'data') + ' must be a list of at least ' + (min || 1) + ' number' + ((min || 1) > 1 ? 's' : ''));
    d.forEach(function(x){ num(x, name || 'data value'); });
    return d.slice();
  }
  function pts(p){
    if(!Array.isArray(p) || p.length < 3) throw new Error('ApPsychStats: give at least three [x, y] points');
    p.forEach(function(q){ if(!Array.isArray(q) || q.length !== 2) throw new Error('ApPsychStats: a point is [x, y]'); num(q[0], 'x'); num(q[1], 'y'); });
    return p;
  }
  function sum(d){ return list(d).reduce(function(a, b){ return a + b; }, 0); }
  function mean(d){ d = list(d); return sum(d) / d.length; }
  function median(d){
    d = list(d).sort(function(a, b){ return a - b; });
    var m = Math.floor(d.length / 2);
    return d.length % 2 ? d[m] : (d[m - 1] + d[m]) / 2;
  }
  function modes(d){
    d = list(d);
    var c = {}, best = 0;
    d.forEach(function(x){ c[x] = (c[x] || 0) + 1; if(c[x] > best) best = c[x]; });
    return Object.keys(c).filter(function(k){ return c[k] === best; }).map(Number).sort(function(a, b){ return a - b; });
  }
  function mode(d){ return modes(d)[0]; }
  function range(d){ d = list(d); return Math.max.apply(null, d) - Math.min.apply(null, d); }
  function ss(d){ var m = mean(d); return d.reduce(function(a, x){ return a + (x - m) * (x - m); }, 0); }
  function variance(d){ d = list(d); return ss(d) / d.length; }
  function sampleVariance(d){ d = list(d, 'data', 2); return ss(d) / (d.length - 1); }

  /* The 68-95-99.7 rule, band by band from the mean outward. */
  var BAND = [34, 13.5, 2.35, 0.15];
  function ruleBelow(z){
    // Percent below a whole-SD mark, built from the bands so the parts add up exactly.
    if(z === null || z === -Infinity) return 0;
    if(z === Infinity) return 100;
    num(z, 'z');
    if(z !== Math.round(z) || Math.abs(z) > 3) throw new Error('ApPsychStats.rulePct: the 68-95-99.7 rule works at whole standard deviations from -3 to 3, got ' + z);
    var below = 50;
    for(var i = 0; i < Math.abs(z); i++) below += (z > 0 ? 1 : -1) * BAND[i];
    return Math.round(below * 100) / 100;   // the bands have two decimals; no float noise

  }
  function rulePct(a, b){
    var lo = a === null ? -Infinity : a, hi = b === null ? Infinity : b;
    if(lo > hi) throw new Error('ApPsychStats.rulePct: the first mark must be the lower one');
    return round(ruleBelow(hi) - ruleBelow(lo), 2);
  }
  /* The standard normal CDF (Zelen and Severo 26.2.17 via erf; error below 1e-7). */
  function erf(x){
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function cdf(z){ num(z, 'z'); return 0.5 * (1 + erf(z / Math.SQRT2)); }
  function zOf(x, m, s){ num(x, 'x'); num(m, 'mean'); if(!(num(s, 'sd') > 0)) throw new Error('ApPsychStats.z: the standard deviation must be positive'); return (x - m) / s; }
  function round(a, d){ var k = Math.pow(10, d || 0); return Math.round(num(a) * k + (a >= 0 ? 1e-9 : -1e-9)) / k; }

  function r(p){
    p = pts(p);
    var xs = p.map(function(q){ return q[0]; }), ys = p.map(function(q){ return q[1]; });
    var mx = mean(xs), my = mean(ys), sxy = 0, sxx = 0, syy = 0;
    p.forEach(function(q){ sxy += (q[0] - mx) * (q[1] - my); sxx += (q[0] - mx) * (q[0] - mx); syy += (q[1] - my) * (q[1] - my); });
    if(!sxx || !syy) throw new Error('ApPsychStats.r: x or y does not vary, so r is undefined');
    return sxy / Math.sqrt(sxx * syy);
  }
  function slope(p){
    p = pts(p);
    var xs = p.map(function(q){ return q[0]; }), ys = p.map(function(q){ return q[1]; }), mx = mean(xs), my = mean(ys), sxy = 0, sxx = 0;
    p.forEach(function(q){ sxy += (q[0] - mx) * (q[1] - my); sxx += (q[0] - mx) * (q[0] - mx); });
    if(!sxx) throw new Error('ApPsychStats.slope: x does not vary');
    return sxy / sxx;
  }
  function intercept(p){ var b = slope(p); return mean(p.map(function(q){ return q[1]; })) - b * mean(p.map(function(q){ return q[0]; })); }
  function strength(v){ num(v, 'r'); if(Math.abs(v) > 1 + 1e-12) throw new Error('ApPsychStats.strength: r is between -1 and 1'); var a = Math.abs(v); return a >= 0.7 ? 'strong' : a >= 0.4 ? 'moderate' : a >= 0.1 ? 'weak' : 'none'; }
  function direction(v){ num(v, 'r'); return Math.abs(v) < 0.1 ? 'none' : v > 0 ? 'positive' : 'negative'; }
  function describe(v){ var s = strength(v); return s === 'none' ? 'little or no correlation' : 'a ' + s + ' ' + direction(v) + ' correlation'; }

  /* Every recipe function. Words (strength, direction, describe) and lists
     (modes) are not numbers: they are called directly, never as a key. */
  var F = {
    mean: mean, median: median, mode: mode, range: range,
    sd: function(d){ return Math.sqrt(variance(d)); },
    sampleSd: function(d){ return Math.sqrt(sampleVariance(d)); },
    variance: variance, sampleVariance: sampleVariance,
    z: zOf,
    fromZ: function(zv, m, s){ return num(m, 'mean') + num(zv, 'z') * num(s, 'sd'); },
    rulePct: rulePct,
    percentileRule: function(zv){ return ruleBelow(zv); },
    cdf: cdf,
    percentile: function(x, m, s){ return 100 * cdf(zOf(x, m, s)); },
    between: function(a, b, m, s){ if(num(a, 'a') > num(b, 'b')) throw new Error('ApPsychStats.between: a must be below b'); return 100 * (cdf(zOf(b, m, s)) - cdf(zOf(a, m, s))); },
    percentRank: function(v, d){ d = list(d); num(v, 'value'); var below = 0, same = 0; d.forEach(function(x){ if(x < v) below++; else if(x === v) same++; }); return 100 * (below + same / 2) / d.length; },
    r: r, slope: slope, intercept: intercept,
    count: function(d){ return list(d).length; }, sum: sum,
    add: function(){ var s = 0; for(var i = 0; i < arguments.length; i++) s += num(arguments[i]); return s; },
    sub: function(a, b){ return num(a) - num(b); },
    mul: function(){ var p = 1; for(var i = 0; i < arguments.length; i++) p *= num(arguments[i]); return p; },
    div: function(a, b){ if(num(b) === 0) throw new Error('ApPsychStats.div: division by 0'); return num(a) / b; },
    pow: function(a, b){ return Math.pow(num(a), num(b)); },
    round: round,
    abs: function(a){ return Math.abs(num(a)); },
    min: function(){ return Math.min.apply(null, [].slice.call(arguments).map(function(x){ return num(x); })); },
    max: function(){ return Math.max.apply(null, [].slice.call(arguments).map(function(x){ return num(x); })); }
  };
  var FNS = Object.keys(F);

  function isRecipe(x){ return !!x && typeof x === 'object' && !Array.isArray(x) && typeof x.fn === 'string'; }
  /* A recipe's value. Arguments that are recipes are evaluated first. */
  function run(recipe){
    if(!isRecipe(recipe)) throw new Error('ApPsychStats: a recipe is { fn, args, pick? }');
    var f = F[recipe.fn];
    if(!f) throw new Error('ApPsychStats: unknown recipe "' + recipe.fn + '" (one of ' + FNS.join(', ') + ')');
    var args = (recipe.args || []).map(function a(x){ return isRecipe(x) ? evaluate(x) : Array.isArray(x) ? x.map(a) : x; });
    var v = f.apply(null, args);
    String(recipe.pick || '').split('.').filter(Boolean).forEach(function(k){
      if(v == null || !(k in Object(v))) throw new Error('ApPsychStats: pick "' + recipe.pick + '" is not in the result of ' + recipe.fn);
      v = v[k];
    });
    return v;
  }
  function evaluate(recipe){
    var v = run(recipe);
    if(typeof v !== 'number' || !isFinite(v)) throw new Error('ApPsychStats: recipe ' + recipe.fn + ' does not give a number' + (v && typeof v === 'object' ? ' (use pick)' : ''));
    // Floating-point noise off a key a student will see (100.00000000000001 is 100).
    return v === 0 ? 0 : Number(v.toPrecision(12));
  }

  root.ApPsychStats = { FNS: FNS, BAND: BAND.slice(), evaluate: evaluate, run: run, isRecipe: isRecipe,
    modes: modes, strength: strength, direction: direction, describe: describe };
  FNS.forEach(function(k){ root.ApPsychStats[k] = F[k]; });
})(typeof window !== 'undefined' ? window : globalThis);
