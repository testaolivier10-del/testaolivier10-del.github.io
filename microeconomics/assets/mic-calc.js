/* AP® Microeconomics calculations: ApMicroCalc (docs/apmicro-spec.md section 7,
   docs/apmicro-architecture.md "Calculations"). Pure, no DOM: it runs in the
   browser (questions, tools) and in node (the generator, the content check
   and the tests load this very file), so every numeric key, every tool drill
   and every exam number is recomputed by the same code from a recipe. It
   replaces AP® Macroeconomics' ApMacroCalc (spec decision 1).

   The exam allows a four-function calculator (docs/apmicro-research/
   framework.md section 5), so items keep the arithmetic hand-friendly; the
   library is exact.

   A recipe is { fn, args, pick? }: fn names one of the functions below, args
   its arguments (an argument may itself be a recipe, so recipes nest; arrays
   are table columns), pick a path into an object result ("mc.3": the fourth
   entry of the mc column). evaluate(recipe) gives the number.

   Percent changes and elasticities (framework.md section 9; percents are percents: 20, not 0.2)
     pctChange(old, new)                  (new - old) / old × 100
     midpointPct(old, new)                (new - old) / ((old + new) / 2) × 100
     elasticity(pctQ, pctP)               pctQ / pctP, signed
     priceElasticity(q1, q2, p1, p2)      |%ΔQ / %ΔP|, from the starting values (demand or supply)
     midpointElasticity(q1, q2, p1, p2)   |%ΔQ / %ΔP| by the midpoint method (taught as one route, never the only one)
     incomeElasticity(q1, q2, i1, i2)     %ΔQ / %Δincome, signed (+ normal, - inferior)
     crossElasticity(qx1, qx2, py1, py2)  %ΔQx / %ΔPy, signed (+ substitutes, - complements)
     totalRevenue(p, q)                   P × Q
   Production
     marginalProduct(tp1, tp2, l1, l2)    ΔTP / ΔL
     averageProduct(tp, l)                TP / L
     productTable(l[], tp[])              { mp: [], ap: [] } (mp[i] from row i-1 to i; row 0 null)
   Costs (every measure from a table)
     totalCost(tfc, tvc)  variableCost(tc, tfc)  afc(tfc, q)  avc(tvc, q)  atc(tc, q)
     marginalCost(tc1, tc2, q1, q2)       ΔTC / ΔQ (divide by the change in output)
     costTable(q[], tc[], tfc?)           { tfc, tc: [], tvc: [], afc: [], avc: [], atc: [], mc: [] };
                                          tfc defaults to TC at Q = 0 (the first row must then be Q = 0)
   Revenue and profit
     marginalRevenue(tr1, tr2, q1, q2)    ΔTR / ΔQ
     profit(tr, tc)                       TR - TC
     unitProfit(p, atc, q)                (P - ATC) × Q
     accountingProfit(tr, explicit)       TR - explicit costs
     economicProfit(tr, explicit, implicit)   TR - explicit - implicit
     profitMaxQ(q[], mr[] | P, mc[])      the last output whose MR is at least its MC (the MR = MC rule from a table)
   Factor markets
     mrp(mp, mr)                          MP × MR (MP × P for a competitive seller)
     mrc(tc1, tc2, l1, l2)                ΔTC / ΔL (the marginal resource cost, MFC)
     wageBill(w, l)                       W × L
     hireCount(mrp[], mrc[] | W)          workers hired: the last worker whose MRP is at least the MRC
     perDollar(mp, price)                 MP / price (MU / P for a consumer, MP / w for a firm)
     leastCost(mpl, w, mpk, r)            { labor: MPL / w, capital: MPK / r, gap: labor - capital } (gap 0: least cost)
   Consumer choice
     muPerDollar(mu, p)                   MU / P
     utilityMax(muX[], px, muY[], py, budget)  { x, y, tu }: the bundle with the most total utility the budget buys
   Areas and policy
     triangle(base, height)  rectangle(base, height)  trapezoid(a, b, height)
     consumerSurplus(q, choke, p)         ½ × Q × (choke price - P) (a straight demand curve)
     producerSurplus(q, p, floor)         ½ × Q × (P - the supply curve's price at Q = 0)
     taxRevenue(t, q)  subsidyCost(s, q)  tariffRevenue(t, imports)   per-unit amount × the NEW quantity
     dwl(dq, wedge)                       ½ × ΔQ × the price wedge (the deadweight loss triangle)
     incidence(pBefore, pBuyers, pSellers)  { buyers, sellers, buyerShare, sellerShare } per unit (shares in percent)
     shortage(qd, qs)  surplusQty(qs, qd)  imports(qd, qs)  exports(qs, qd)
     linearMarket(a, b, c, d)             Qd = a - bP, Qs = c + dP: { p, q }
   Inequality
     lorenz(incomes[])                    cumulative percent of income held by each cumulative group, poorest first
     share(incomes[], k)                  percent of income of group k (0 = poorest) after sorting
     gini(cumulative[])                   area between the line of equality and the Lorenz curve over the area under
                                          the line, from equal-size groups (needs-author ced-text: taught, labeled, never the only route)
   Trade
     opportunityCost(gaveUp, gained)      units of the other good given up per unit gained
   Arithmetic for nesting
     add sub mul div pow round abs min max neg pct  (pct(part, whole) = part / whole × 100) */
(function(root){
  'use strict';

  function num(x, name){
    if(typeof x !== 'number' || !isFinite(x)) throw new Error('ApMicroCalc: ' + (name || 'argument') + ' must be a finite number, got ' + JSON.stringify(x));
    return x;
  }
  function pos(x, name){ if(!(num(x, name) > 0)) throw new Error('ApMicroCalc: ' + name + ' must be positive, got ' + x); return x; }
  function nonzero(x, name){ if(num(x, name) === 0) throw new Error('ApMicroCalc: ' + name + ' must not be 0'); return x; }
  function list(a, name){ if(!Array.isArray(a) || !a.length) throw new Error('ApMicroCalc: ' + name + ' is a column of numbers'); a.forEach(function(v, i){ num(v, name + '[' + i + ']'); }); return a; }
  function ratio(a, b, an, bn){ num(a, an); pos(b, bn); return a / b * 100; }
  function round(v, p){ num(v, 'value'); var k = Math.pow(10, p == null ? 0 : num(p, 'places')); return Math.round(v * k) / k; }
  function pctChange(o, n){ return (num(n, 'new value') - nonzero(o, 'old value')) / o * 100; }
  function midpointPct(o, n){ num(o, 'old value'); num(n, 'new value'); if(o + n === 0) throw new Error('ApMicroCalc.midpointPct: the midpoint is 0'); return (n - o) / ((o + n) / 2) * 100; }
  function ela(pq, pp){ return num(pq, '%ΔQ') / nonzero(pp, '%ΔP'); }
  // The last row of a column pair where the marginal benefit side is at least the marginal cost side.
  function lastAtLeast(gain, cost){
    var n = gain.length, last = -1;
    for(var i = 0; i < n; i++){ var c = Array.isArray(cost) ? cost[i] : cost; if(gain[i] == null || c == null) continue; if(gain[i] >= c - 1e-9) last = i; else break; }
    return last;
  }

  var F = {
    pctChange: pctChange,
    midpointPct: midpointPct,
    elasticity: ela,
    priceElasticity: function(q1, q2, p1, p2){ return Math.abs(ela(pctChange(q1, q2), pctChange(p1, p2))); },
    midpointElasticity: function(q1, q2, p1, p2){ return Math.abs(ela(midpointPct(q1, q2), midpointPct(p1, p2))); },
    incomeElasticity: function(q1, q2, i1, i2){ return ela(pctChange(q1, q2), pctChange(i1, i2)); },
    crossElasticity: function(q1, q2, p1, p2){ return ela(pctChange(q1, q2), pctChange(p1, p2)); },
    totalRevenue: function(p, q){ return num(p, 'price') * num(q, 'quantity'); },

    marginalProduct: function(t1, t2, l1, l2){ return (num(t2, 'TP') - num(t1, 'TP')) / nonzero(num(l2, 'L') - num(l1, 'L'), 'the change in labor'); },
    averageProduct: function(tp, l){ return num(tp, 'TP') / pos(l, 'labor'); },
    productTable: function(l, tp){
      list(l, 'labor'); list(tp, 'total product');
      if(l.length !== tp.length) throw new Error('ApMicroCalc.productTable: the columns differ in length');
      return { mp: tp.map(function(t, i){ return i ? (t - tp[i - 1]) / nonzero(l[i] - l[i - 1], 'the change in labor') : null; }),
        ap: tp.map(function(t, i){ return l[i] > 0 ? t / l[i] : null; }) };
    },

    totalCost: function(tfc, tvc){ return num(tfc, 'TFC') + num(tvc, 'TVC'); },
    variableCost: function(tc, tfc){ return num(tc, 'TC') - num(tfc, 'TFC'); },
    afc: function(tfc, q){ return num(tfc, 'TFC') / pos(q, 'output'); },
    avc: function(tvc, q){ return num(tvc, 'TVC') / pos(q, 'output'); },
    atc: function(tc, q){ return num(tc, 'TC') / pos(q, 'output'); },
    marginalCost: function(c1, c2, q1, q2){ return (num(c2, 'TC') - num(c1, 'TC')) / nonzero(num(q2, 'Q') - num(q1, 'Q'), 'the change in output'); },
    costTable: function(q, tc, tfc){
      list(q, 'output'); list(tc, 'total cost');
      if(q.length !== tc.length) throw new Error('ApMicroCalc.costTable: the columns differ in length');
      if(tfc == null){ if(q[0] !== 0) throw new Error('ApMicroCalc.costTable: give tfc, or start the table at Q = 0'); tfc = tc[0]; }
      num(tfc, 'TFC');
      var tvc = tc.map(function(c){ return c - tfc; });
      var per = function(v, i){ return q[i] > 0 ? v / q[i] : null; };
      return { tfc: tfc, tc: tc.slice(), tvc: tvc,
        afc: q.map(function(x, i){ return per(tfc, i); }), avc: tvc.map(per), atc: tc.map(per),
        mc: tc.map(function(c, i){ return i ? (c - tc[i - 1]) / nonzero(q[i] - q[i - 1], 'the change in output') : null; }) };
    },

    marginalRevenue: function(r1, r2, q1, q2){ return (num(r2, 'TR') - num(r1, 'TR')) / nonzero(num(q2, 'Q') - num(q1, 'Q'), 'the change in output'); },
    profit: function(tr, tc){ return num(tr, 'TR') - num(tc, 'TC'); },
    unitProfit: function(p, atc, q){ return (num(p, 'price') - num(atc, 'ATC')) * num(q, 'quantity'); },
    accountingProfit: function(tr, ex){ return num(tr, 'TR') - num(ex, 'explicit costs'); },
    economicProfit: function(tr, ex, im){ return num(tr, 'TR') - num(ex, 'explicit costs') - num(im, 'implicit costs'); },
    // q: outputs; mr: a column (or one price for a competitive firm); mc: a column. Rows whose mc is null (Q = 0) are skipped.
    profitMaxQ: function(q, mr, mc){
      list(q, 'output'); if(!Array.isArray(mc)) throw new Error('ApMicroCalc.profitMaxQ: mc is a column');
      var start = mc[0] == null ? 1 : 0, gain = (Array.isArray(mr) ? mr : q.map(function(){ return num(mr, 'price'); })).slice(start), i = lastAtLeast(gain, mc.slice(start));
      return i < 0 ? q[start - 1 < 0 ? 0 : start - 1] : q[i + start];
    },

    mrp: function(mp, mr){ return num(mp, 'MP') * num(mr, 'MR'); },
    mrc: function(c1, c2, l1, l2){ return (num(c2, 'TC') - num(c1, 'TC')) / nonzero(num(l2, 'L') - num(l1, 'L'), 'the change in labor'); },
    wageBill: function(w, l){ return num(w, 'wage') * num(l, 'workers'); },
    // mrp[i] is the MRP of worker i + 1; mrc is a column (worker by worker) or one wage.
    hireCount: function(mrps, mrc){ list(mrps, 'MRP'); return lastAtLeast(mrps, mrc) + 1; },
    perDollar: function(mp, p){ return num(mp, 'marginal product') / pos(p, 'price'); },
    leastCost: function(mpl, w, mpk, r){ var a = num(mpl, 'MPL') / pos(w, 'wage'), b = num(mpk, 'MPK') / pos(r, 'rental rate'); return { labor: a, capital: b, gap: a - b }; },

    muPerDollar: function(mu, p){ return num(mu, 'MU') / pos(p, 'price'); },
    // muX[i] is the MU of unit i + 1 of X. Ties go to the bundle with more X (stated in the item).
    utilityMax: function(mx, px, my, py, budget){
      list(mx, 'MU of X'); list(my, 'MU of Y'); pos(px, 'price of X'); pos(py, 'price of Y'); num(budget, 'budget');
      var best = null;
      for(var x = 0; x <= mx.length; x++) for(var y = 0; y <= my.length; y++){
        if(x * px + y * py > budget + 1e-9) continue;
        var tu = 0, i; for(i = 0; i < x; i++) tu += mx[i]; for(i = 0; i < y; i++) tu += my[i];
        if(!best || tu > best.tu + 1e-9 || (Math.abs(tu - best.tu) < 1e-9 && x > best.x)) best = { x: x, y: y, tu: tu };
      }
      return best;
    },

    triangle: function(b, h){ return 0.5 * num(b, 'base') * num(h, 'height'); },
    rectangle: function(b, h){ return num(b, 'base') * num(h, 'height'); },
    trapezoid: function(a, b, h){ return 0.5 * (num(a, 'side a') + num(b, 'side b')) * num(h, 'height'); },
    consumerSurplus: function(q, choke, p){ return 0.5 * num(q, 'quantity') * (num(choke, 'choke price') - num(p, 'price')); },
    producerSurplus: function(q, p, floor){ return 0.5 * num(q, 'quantity') * (num(p, 'price') - num(floor, 'the supply curve at Q = 0')); },
    taxRevenue: function(t, q){ return num(t, 'tax per unit') * num(q, 'quantity after the tax'); },
    subsidyCost: function(s, q){ return num(s, 'subsidy per unit') * num(q, 'quantity after the subsidy'); },
    tariffRevenue: function(t, m){ return num(t, 'tariff per unit') * num(m, 'imports after the tariff'); },
    dwl: function(dq, w){ return 0.5 * Math.abs(num(dq, 'change in quantity')) * Math.abs(num(w, 'price wedge')); },
    incidence: function(p0, pb, ps){
      num(p0, 'price before'); num(pb, 'price buyers pay'); num(ps, 'price sellers keep');
      var t = pb - ps; if(!(t > 0)) throw new Error('ApMicroCalc.incidence: buyers must pay more than sellers keep');
      return { buyers: pb - p0, sellers: p0 - ps, tax: t, buyerShare: (pb - p0) / t * 100, sellerShare: (p0 - ps) / t * 100 };
    },
    shortage: function(qd, qs){ return num(qd, 'Qd') - num(qs, 'Qs'); },
    surplusQty: function(qs, qd){ return num(qs, 'Qs') - num(qd, 'Qd'); },
    imports: function(qd, qs){ return num(qd, 'Qd') - num(qs, 'Qs'); },
    exports: function(qs, qd){ return num(qs, 'Qs') - num(qd, 'Qd'); },
    linearMarket: function(a, b, c, d){ num(a, 'a'); num(b, 'b'); num(c, 'c'); num(d, 'd'); var p = (a - c) / nonzero(b + d, 'b + d'); return { p: p, q: a - b * p }; },

    lorenz: function(inc){ list(inc, 'incomes'); var s = inc.slice().sort(function(a, b){ return a - b; }), tot = s.reduce(function(a, b){ return a + b; }, 0), run = 0;
      pos(tot, 'total income'); return s.map(function(v){ run += v; return run / tot * 100; }); },
    share: function(inc, k){ list(inc, 'incomes'); var s = inc.slice().sort(function(a, b){ return a - b; }), tot = s.reduce(function(a, b){ return a + b; }, 0);
      if(!(k >= 0 && k < s.length)) throw new Error('ApMicroCalc.share: group ' + k + ' is not in the table'); return s[num(k, 'group')] / pos(tot, 'total income') * 100; },
    gini: function(cum){ list(cum, 'cumulative shares'); var n = cum.length, area = 0, prev = 0;
      cum.forEach(function(c){ area += (prev + c) / 2 / n; prev = c; }); return (50 - area) / 50; },

    opportunityCost: function(gaveUp, gained){ return num(gaveUp, 'units given up') / pos(gained, 'units gained'); },
    pct: function(part, whole){ return ratio(part, whole, 'part', 'whole'); },
    add: function(){ var s = 0; for(var i = 0; i < arguments.length; i++) s += num(arguments[i]); return s; },
    sub: function(a, b){ return num(a) - num(b); },
    mul: function(){ var p = 1; for(var i = 0; i < arguments.length; i++) p *= num(arguments[i]); return p; },
    div: function(a, b){ if(num(b) === 0) throw new Error('ApMicroCalc.div: division by 0'); return num(a) / b; },
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
    if(!isRecipe(recipe)) throw new Error('ApMicroCalc: a recipe is { fn, args, pick? }');
    var f = F[recipe.fn];
    if(!f) throw new Error('ApMicroCalc: unknown recipe "' + recipe.fn + '" (one of ' + FNS.join(', ') + ')');
    var args = (recipe.args || []).map(function a(x){ return isRecipe(x) ? evaluate(x) : Array.isArray(x) ? x.map(a) : x; });
    var v = f.apply(null, args);
    String(recipe.pick == null ? '' : recipe.pick).split('.').filter(Boolean).forEach(function(k){
      if(v == null || !(k in Object(v))) throw new Error('ApMicroCalc: pick "' + recipe.pick + '" is not in the result of ' + recipe.fn);
      v = v[k];
    });
    return v;
  }
  function evaluate(recipe){
    var v = run(recipe);
    if(typeof v !== 'number' || !isFinite(v)) throw new Error('ApMicroCalc: recipe ' + recipe.fn + ' does not give a number' + (v && typeof v === 'object' ? ' (use pick)' : ''));
    // Floating-point noise off a key a student will see (4.999999999999999 is 5).
    return v === 0 ? 0 : Number(v.toPrecision(12));
  }

  root.ApMicroCalc = { FNS: FNS, evaluate: evaluate, run: run, isRecipe: isRecipe };
  FNS.forEach(function(k){ root.ApMicroCalc[k] = F[k]; });
})(typeof window !== 'undefined' ? window : globalThis);
