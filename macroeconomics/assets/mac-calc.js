/* AP® Macroeconomics calculations: ApMacroCalc (docs/apmacro-spec.md section 7,
   docs/apmacro-architecture.md "Calculations"). Pure, no DOM: it runs in the
   browser (questions, tools) and in node (the generator, the content check
   and the tests load this very file), so every numeric key, every tool drill
   and every exam number is recomputed by the same code from a recipe. It
   replaces AP® Psychology's ApPsychStats (spec decision 1).

   The exam allows a four-function calculator (docs/apmacro-research/
   framework.md section 5), so items keep the arithmetic hand-friendly; the
   library is exact.

   A recipe is { fn, args, pick? }: fn names one of the functions below, args
   its arguments (an argument may itself be a recipe, so recipes nest), pick a
   path into an object result. evaluate(recipe) gives the number.

   Output and prices (framework.md section 9)
     gdp(C, I, G, X, M)               C + I + G + (X - M), the expenditure approach
     netExports(X, M)                 X - M
     cpi(basketNow, basketBase)       basketNow / basketBase × 100
     inflation(indexOld, indexNew)    (new - old) / old × 100, percent
     deflator(nominal, real)          nominal / real × 100
     realValue(nominal, index)        nominal / index × 100 (real GDP, real wage)
     nominalValue(real, index)        real × index / 100
     growth(old, new)                 percent change, (new - old) / old × 100
     perCapita(total, population)     total / population
   Labor market
     laborForce(employed, unemployed)            employed + unemployed
     unemploymentRate(unemployed, laborForce)    unemployed / labor force × 100
     participationRate(laborForce, adults)       labor force / adult population × 100
     naturalRate(frictional, structural)         the rates (percent) added
     cyclicalRate(actual, natural)               actual - natural
   Interest rates
     realRate(nominal, expectedInflation)        nominal - inflation (percent)
     nominalRate(real, expectedInflation)        real + inflation
   Multipliers (MPC and MPS as decimals: 0.8, not 80)
     mps(mpc)                         1 - MPC
     spendingMultiplier(mpc)          1 / (1 - MPC)
     taxMultiplier(mpc)               -MPC / (1 - MPC) (negative: a tax rise lowers output)
     balancedBudgetMultiplier(mpc)    spending + tax multiplier = 1
     moneyMultiplier(rr)              1 / required reserve ratio (decimal)
     requiredReserves(deposits, rr)   deposits × rr
     excessReserves(reserves, deposits, rr)    reserves - deposits × rr
     maxLoans(excess)                 excess reserves (one bank can lend them)
     maxMoneyChange(excess, rr)       excess × money multiplier
     gapChange(gap, multiplier)       gap / multiplier: the change in spending
                                      (or taxes, with the tax multiplier) that
                                      closes a gap; sign included
     totalChange(change, multiplier)  change × multiplier (the effect on real GDP)
   Money and the government
     velocity(P, Y, M)                P × Y / M (from M × V = P × Y)
     budgetBalance(revenue, outlays)  revenue - outlays (negative is a deficit)
   Trade and exchange rates
     opportunityCost(gaveUp, gained)  units of the other good given up per unit gained
     inverseRate(rate)                1 / rate (Y per X to X per Y)
     convert(amount, rate)            amount × rate (an amount of X in Y at Y per X)
   Arithmetic for nesting
     add sub mul div pow round abs min max neg pct  (pct(part, whole) = part / whole × 100) */
(function(root){
  'use strict';

  function num(x, name){
    if(typeof x !== 'number' || !isFinite(x)) throw new Error('ApMacroCalc: ' + (name || 'argument') + ' must be a finite number, got ' + JSON.stringify(x));
    return x;
  }
  function pos(x, name){ if(!(num(x, name) > 0)) throw new Error('ApMacroCalc: ' + name + ' must be positive, got ' + x); return x; }
  function frac(x, name){ num(x, name); if(!(x > 0 && x < 1)) throw new Error('ApMacroCalc: ' + name + ' is a decimal between 0 and 1 (0.8, not 80), got ' + x); return x; }
  function ratio(a, b, an, bn){ num(a, an); pos(b, bn); return a / b * 100; }
  function round(v, p){ num(v, 'value'); var k = Math.pow(10, p == null ? 0 : num(p, 'places')); return Math.round(v * k) / k; }

  var F = {
    gdp: function(C, I, G, X, M){ return num(C, 'C') + num(I, 'I') + num(G, 'G') + (num(X == null ? 0 : X, 'X') - num(M == null ? 0 : M, 'M')); },
    netExports: function(X, M){ return num(X, 'exports') - num(M, 'imports'); },
    cpi: function(now, base){ return ratio(now, base, 'basket cost now', 'basket cost in the base year'); },
    inflation: function(o, n){ return (num(n, 'new index') - pos(o, 'old index')) / o * 100; },
    deflator: function(nominal, real){ return ratio(nominal, real, 'nominal GDP', 'real GDP'); },
    realValue: function(nominal, index){ return ratio(nominal, index, 'nominal value', 'price index'); },
    nominalValue: function(real, index){ return num(real, 'real value') * pos(index, 'price index') / 100; },
    growth: function(o, n){ return (num(n, 'new value') - pos(o, 'old value')) / o * 100; },
    perCapita: function(t, p){ return num(t, 'total') / pos(p, 'population'); },
    laborForce: function(e, u){ return num(e, 'employed') + num(u, 'unemployed'); },
    unemploymentRate: function(u, lf){ if(num(u, 'unemployed') > pos(lf, 'labor force')) throw new Error('ApMacroCalc: more unemployed than the labor force'); return u / lf * 100; },
    participationRate: function(lf, adults){ if(num(lf, 'labor force') > pos(adults, 'adult population')) throw new Error('ApMacroCalc: the labor force is larger than the adult population'); return lf / adults * 100; },
    naturalRate: function(f, s){ return num(f, 'frictional rate') + num(s, 'structural rate'); },
    cyclicalRate: function(a, n){ return num(a, 'actual rate') - num(n, 'natural rate'); },
    realRate: function(i, pi){ return num(i, 'nominal rate') - num(pi, 'expected inflation'); },
    nominalRate: function(r, pi){ return num(r, 'real rate') + num(pi, 'expected inflation'); },
    mps: function(mpc){ return 1 - frac(mpc, 'MPC'); },
    spendingMultiplier: function(mpc){ return 1 / (1 - frac(mpc, 'MPC')); },
    taxMultiplier: function(mpc){ return -frac(mpc, 'MPC') / (1 - mpc); },
    balancedBudgetMultiplier: function(mpc){ frac(mpc, 'MPC'); return 1 / (1 - mpc) - mpc / (1 - mpc); },
    moneyMultiplier: function(rr){ return 1 / frac(rr, 'required reserve ratio'); },
    requiredReserves: function(d, rr){ return num(d, 'deposits') * frac(rr, 'required reserve ratio'); },
    excessReserves: function(res, d, rr){ return num(res, 'reserves') - num(d, 'deposits') * frac(rr, 'required reserve ratio'); },
    maxLoans: function(ex){ return num(ex, 'excess reserves'); },
    maxMoneyChange: function(ex, rr){ return num(ex, 'excess reserves') / frac(rr, 'required reserve ratio'); },
    gapChange: function(gap, m){ num(gap, 'gap'); if(num(m, 'multiplier') === 0) throw new Error('ApMacroCalc.gapChange: multiplier is 0'); return gap / m; },
    totalChange: function(c, m){ return num(c, 'change') * num(m, 'multiplier'); },
    velocity: function(P, Y, M){ return num(P, 'price level') * num(Y, 'real output') / pos(M, 'money supply'); },
    budgetBalance: function(rev, out){ return num(rev, 'revenue') - num(out, 'outlays'); },
    opportunityCost: function(gaveUp, gained){ return num(gaveUp, 'units given up') / pos(gained, 'units gained'); },
    inverseRate: function(r){ return 1 / pos(r, 'exchange rate'); },
    convert: function(a, r){ return num(a, 'amount') * pos(r, 'exchange rate'); },
    pct: function(part, whole){ return ratio(part, whole, 'part', 'whole'); },
    add: function(){ var s = 0; for(var i = 0; i < arguments.length; i++) s += num(arguments[i]); return s; },
    sub: function(a, b){ return num(a) - num(b); },
    mul: function(){ var p = 1; for(var i = 0; i < arguments.length; i++) p *= num(arguments[i]); return p; },
    div: function(a, b){ if(num(b) === 0) throw new Error('ApMacroCalc.div: division by 0'); return num(a) / b; },
    pow: function(a, b){ return Math.pow(num(a), num(b)); },
    neg: function(a){ return -num(a); },
    round: round,
    abs: function(a){ return Math.abs(num(a)); },
    min: function(){ return Math.min.apply(null, [].slice.call(arguments).map(function(x){ return num(x); })); },
    max: function(){ return Math.max.apply(null, [].slice.call(arguments).map(function(x){ return num(x); })); }
  };
  var FNS = Object.keys(F);

  function isRecipe(x){ return !!x && typeof x === 'object' && !Array.isArray(x) && typeof x.fn === 'string'; }
  /* A recipe's value. Arguments that are recipes are evaluated first. */
  function run(recipe){
    if(!isRecipe(recipe)) throw new Error('ApMacroCalc: a recipe is { fn, args, pick? }');
    var f = F[recipe.fn];
    if(!f) throw new Error('ApMacroCalc: unknown recipe "' + recipe.fn + '" (one of ' + FNS.join(', ') + ')');
    var args = (recipe.args || []).map(function a(x){ return isRecipe(x) ? evaluate(x) : Array.isArray(x) ? x.map(a) : x; });
    var v = f.apply(null, args);
    String(recipe.pick || '').split('.').filter(Boolean).forEach(function(k){
      if(v == null || !(k in Object(v))) throw new Error('ApMacroCalc: pick "' + recipe.pick + '" is not in the result of ' + recipe.fn);
      v = v[k];
    });
    return v;
  }
  function evaluate(recipe){
    var v = run(recipe);
    if(typeof v !== 'number' || !isFinite(v)) throw new Error('ApMacroCalc: recipe ' + recipe.fn + ' does not give a number' + (v && typeof v === 'object' ? ' (use pick)' : ''));
    // Floating-point noise off a key a student will see (4.999999999999999 is 5).
    return v === 0 ? 0 : Number(v.toPrecision(12));
  }

  root.ApMacroCalc = { FNS: FNS, evaluate: evaluate, run: run, isRecipe: isRecipe };
  FNS.forEach(function(k){ root.ApMacroCalc[k] = F[k]; });
})(typeof window !== 'undefined' ? window : globalThis);
