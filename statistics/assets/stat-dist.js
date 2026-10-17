/* AP® Statistics distributions: ApStatDist (docs/apstat-architecture.md,
   "Distributions"). The one place numbers come from: question keys, the
   content check, explanations, tool models, validators and exam keys all call
   it. Pure, no DOM; runs in node (the generator and checks load it in a vm,
   scripts/lib/apstat-mathlib.mjs) and in the browser.

     normCdf(z) normPdf(z) invNorm(p)             standard normal; normCdf(x, mu, sd) too
     tCdf(t, df) tPdf(t, df) invT(p, df)          Student t
     chi2Cdf(x, df) chi2Pdf(x, df) invChi2(p, df) chi-square
     binomPmf(k, n, p) binomCdf(k, n, p)          exact, in log space for large n
     z1prop(phat, p0, n) z2prop(x1, n1, x2, n2)   { z, se, p: { less, greater, two } }
     t1(xbar, mu0, s, n) t2(x1, s1, n1, x2, s2, n2)  { t, se, df, dfCons, p }, Welch df
     ci1prop(phat, n, level) ci2prop(p1, n1, p2, n2, level)
     ci1mean(xbar, s, n, level) ci2mean(x1, s1, n1, x2, s2, n2, level)
                                                  { lo, hi, me, crit, se, df? }
     chi2table(observed rows)                     { expected, components, chi2, df, p }
     lsrl(xs, ys)                                 { a, b, r, r2, s, residuals, predict }
     summary(xs)                                  { n, mean, sd, min, q1, med, q3, max, iqr, range, fences, outliers }
     tableRoute(kind, value, df?)                 what a student reads from Table A, B or C

   Accuracy: the normal CDF uses erfc (W. J. Cody's rational approximations,
   about 1e-15); t and chi-square use the regularized incomplete beta and
   gamma functions (Numerical Recipes continued fractions, 1e-13). The tests
   (scripts/test/apstat-dist.test.mjs) compare every function with reference
   values computed independently (SciPy 1.18), stored in the test file.

   Quartiles follow the AP® convention: the median of each half, leaving out
   the overall median when n is odd. */
(function(root){
  'use strict';

  /* ---------------------------------------------------------- special functions */
  var LANCZOS = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function lgamma(x){
    if(x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1;
    var a = LANCZOS[0], t = x + 7.5;
    for(var i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  // Complementary error function (Cody), relative error about 1e-15.
  function erfc(x){
    var z = Math.abs(x), r;
    if(z < 0.5){
      r = 1 - erfSmall(z);
    } else if(z < 4){
      var P = [3.004592610201616005e2, 4.519189537118729422e2, 3.393208167343436870e2, 1.529892850469404039e2,
        4.316222722205673530e1, 7.211758250883093659e0, 5.641955174789739711e-1, -1.368648573827167067e-7];
      var Q = [3.004592609569832933e2, 7.909509253278980272e2, 9.313540948506096211e2, 6.389802644656311665e2,
        2.775854447439876434e2, 7.700015293522947295e1, 1.278272731962942351e1, 1];
      var num = 0, den = 0;
      for(var i = 7; i >= 0; i--){ num = num * z + P[i]; den = den * z + Q[i]; }
      r = Math.exp(-z * z) * num / den;
    } else {
      var P2 = [-2.99610707703542174e-3, -4.94730910623250734e-2, -2.26956593539686930e-1, -2.78661308609647788e-1, -2.23192459734184686e-2];
      var Q2 = [1.06209230528467918e-2, 1.91308926107829841e-1, 1.05167510706793207e0, 1.98733201817135256e0, 1];
      var zi = 1 / (z * z), n2 = 0, d2 = 0;
      for(var j = 4; j >= 0; j--){ n2 = n2 * zi + P2[j]; d2 = d2 * zi + Q2[j]; }
      r = Math.exp(-z * z) / z * (1 / Math.sqrt(Math.PI) + zi * n2 / d2);
    }
    return x < 0 ? 2 - r : r;
  }
  function erfSmall(z){
    var P = [3.209377589138469473e3, 3.774852376853020208e2, 1.138641541510501556e2, 3.161123743870565597e0, 1.857777061846031527e-1];
    var Q = [2.844236833439170622e3, 1.282616526077372276e3, 2.440246379344441733e2, 2.360129095234412093e1, 1];
    var z2 = z * z, n = 0, d = 0;
    for(var i = 4; i >= 0; i--){ n = n * z2 + P[i]; d = d * z2 + Q[i]; }
    return z * n / d;
  }
  // Regularized lower incomplete gamma P(a, x).
  function gammaP(a, x){
    if(x <= 0) return 0;
    if(x < a + 1){
      var sum = 1 / a, del = sum, ap = a;
      for(var n = 0; n < 1000; n++){ ap++; del *= x / ap; sum += del; if(Math.abs(del) < Math.abs(sum) * 1e-16) break; }
      return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
    }
    return 1 - gammaQcf(a, x);
  }
  function gammaQcf(a, x){
    var FPMIN = 1e-300, b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
    for(var i = 1; i < 1000; i++){
      var an = -i * (i - a); b += 2;
      d = an * d + b; if(Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c; if(Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if(Math.abs(del - 1) < 1e-16) break;
    }
    return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
  }
  function gammaQ(a, x){ return x <= 0 ? 1 : x < a + 1 ? 1 - gammaP(a, x) : gammaQcf(a, x); }
  // Regularized incomplete beta I_x(a, b).
  function betacf(a, b, x){
    var FPMIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if(Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; var h = d;
    for(var m = 1; m < 1000; m++){
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if(Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if(Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if(Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if(Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if(Math.abs(del - 1) < 1e-16) break;
    }
    return h;
  }
  function betaI(x, a, b){
    if(x <= 0) return 0;
    if(x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }

  /* ---------------------------------------------------------- normal */
  function normCdf(x, mu, sd){
    var z = mu == null ? x : (x - mu) / sd;
    return 0.5 * erfc(-z / Math.SQRT2);
  }
  function normPdf(x, mu, sd){
    mu = mu || 0; sd = sd || 1;
    var z = (x - mu) / sd;
    return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
  }
  // Acklam's rational approximation, then two Newton steps on normCdf.
  function invNorm(p, mu, sd){
    if(!(p > 0 && p < 1)) return p === 0 ? -Infinity : p === 1 ? Infinity : NaN;
    var a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0];
    var b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
    var c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0, -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0];
    var d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0, 3.754408661907416e0];
    var q, r, x, pl = 0.02425;
    if(p < pl){ q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if(p <= 1 - pl){ q = p - 0.5; r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    else { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    for(var i = 0; i < 2; i++){ var e = normCdf(x) - p; x -= e / normPdf(x); }
    return mu == null ? x : mu + sd * x;
  }

  /* ---------------------------------------------------------- t */
  function tCdf(t, df){
    if(!isFinite(t)) return t > 0 ? 1 : 0;
    if(df === Infinity) return normCdf(t);
    var x = df / (df + t * t), tail = 0.5 * betaI(x, df / 2, 0.5);
    return t > 0 ? 1 - tail : tail;
  }
  function tPdf(t, df){
    return Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2) - 0.5 * Math.log(df * Math.PI) - (df + 1) / 2 * Math.log(1 + t * t / df));
  }
  function invT(p, df){
    if(df === Infinity) return invNorm(p);
    if(!(p > 0 && p < 1)) return p === 0 ? -Infinity : p === 1 ? Infinity : NaN;
    // Bisection on a bracket, then Newton polish: robust for small df.
    var lo = -1, hi = 1;
    while(tCdf(lo, df) > p) lo *= 2;
    while(tCdf(hi, df) < p) hi *= 2;
    for(var i = 0; i < 200 && hi - lo > 1e-13 * Math.max(1, Math.abs(lo)); i++){ var mid = (lo + hi) / 2; if(tCdf(mid, df) < p) lo = mid; else hi = mid; }
    var x = (lo + hi) / 2;
    for(var j = 0; j < 2; j++){ var f = tPdf(x, df); if(f > 1e-300) x -= (tCdf(x, df) - p) / f; }
    return x;
  }

  /* ---------------------------------------------------------- chi-square */
  function chi2Cdf(x, df){ return x <= 0 ? 0 : gammaP(df / 2, x / 2); }
  function chi2Sf(x, df){ return x <= 0 ? 1 : gammaQ(df / 2, x / 2); }
  function chi2Pdf(x, df){
    if(x < 0) return 0;
    if(x === 0) return df === 2 ? 0.5 : df < 2 ? Infinity : 0;
    return Math.exp((df / 2 - 1) * Math.log(x) - x / 2 - df / 2 * Math.LN2 - lgamma(df / 2));
  }
  function invChi2(p, df){
    if(!(p > 0 && p < 1)) return p === 0 ? 0 : p === 1 ? Infinity : NaN;
    var lo = 0, hi = Math.max(1, df);
    while(chi2Cdf(hi, df) < p) hi *= 2;
    for(var i = 0; i < 300 && hi - lo > 1e-13 * Math.max(1, hi); i++){ var mid = (lo + hi) / 2; if(chi2Cdf(mid, df) < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  /* ---------------------------------------------------------- binomial */
  function lchoose(n, k){ return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1); }
  function binomPmf(k, n, p){
    if(k < 0 || k > n || k !== Math.floor(k)) return 0;
    if(p === 0) return k === 0 ? 1 : 0;
    if(p === 1) return k === n ? 1 : 0;
    if(n <= 60){
      // Exact product for small n: matches the reference sheet's formula.
      var c = 1, kk = Math.min(k, n - k);
      for(var i = 1; i <= kk; i++) c = c * (n - kk + i) / i;
      return c * Math.pow(p, k) * Math.pow(1 - p, n - k);
    }
    return Math.exp(lchoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }
  // P(X <= k).
  function binomCdf(k, n, p){
    if(k < 0) return 0;
    if(k >= n) return 1;
    var s = 0;
    for(var i = 0; i <= Math.floor(k); i++) s += binomPmf(i, n, p);
    return Math.min(1, s);
  }

  /* ---------------------------------------------------------- inference */
  function tails(stat, cdf){
    var less = cdf(stat), greater = 1 - less;
    return { less: less, greater: greater, two: Math.min(1, 2 * Math.min(less, greater)) };
  }
  function crit(level, df){
    var q = 1 - (1 - level) / 2;
    return df == null ? invNorm(q) : invT(q, df);
  }
  function z1prop(phat, p0, n){
    var se = Math.sqrt(p0 * (1 - p0) / n), z = (phat - p0) / se;
    return { z: z, se: se, p: tails(z, normCdf) };
  }
  function z2prop(x1, n1, x2, n2){
    var p1 = x1 / n1, p2 = x2 / n2, pc = (x1 + x2) / (n1 + n2);
    var se = Math.sqrt(pc * (1 - pc) * (1 / n1 + 1 / n2)), z = (p1 - p2) / se;
    return { z: z, se: se, pc: pc, p1: p1, p2: p2, p: tails(z, normCdf) };
  }
  function welchDf(s1, n1, s2, n2){
    var a = s1 * s1 / n1, b = s2 * s2 / n2;
    return (a + b) * (a + b) / (a * a / (n1 - 1) + b * b / (n2 - 1));
  }
  function t1(xbar, mu0, s, n){
    var se = s / Math.sqrt(n), t = (xbar - mu0) / se, df = n - 1;
    return { t: t, se: se, df: df, dfCons: df, p: tails(t, function(v){ return tCdf(v, df); }) };
  }
  function t2(x1, s1, n1, x2, s2, n2){
    var se = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2), t = (x1 - x2) / se, df = welchDf(s1, n1, s2, n2), dfCons = Math.min(n1, n2) - 1;
    return { t: t, se: se, df: df, dfCons: dfCons, p: tails(t, function(v){ return tCdf(v, df); }),
      pCons: tails(t, function(v){ return tCdf(v, dfCons); }) };
  }
  function interval(est, se, c, extra){
    var me = c * se, out = { est: est, lo: est - me, hi: est + me, me: me, crit: c, se: se };
    for(var k in extra) out[k] = extra[k];
    return out;
  }
  function ci1prop(phat, n, level){ return interval(phat, Math.sqrt(phat * (1 - phat) / n), crit(level)); }
  function ci2prop(p1, n1, p2, n2, level){ return interval(p1 - p2, Math.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2), crit(level)); }
  function ci1mean(xbar, s, n, level){ var df = n - 1; return interval(xbar, s / Math.sqrt(n), crit(level, df), { df: df }); }
  function ci2mean(x1, s1, n1, x2, s2, n2, level){
    var df = welchDf(s1, n1, s2, n2), dfCons = Math.min(n1, n2) - 1, se = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2);
    var out = interval(x1 - x2, se, crit(level, df), { df: df, dfCons: dfCons });
    out.cons = interval(x1 - x2, se, crit(level, dfCons), { df: dfCons });
    return out;
  }
  function chi2table(obs){
    var R = obs.length, C = obs[0].length, rows = [], cols = [], N = 0, i, j;
    for(i = 0; i < R; i++){ rows[i] = 0; for(j = 0; j < C; j++){ rows[i] += obs[i][j]; } N += rows[i]; }
    for(j = 0; j < C; j++){ cols[j] = 0; for(i = 0; i < R; i++) cols[j] += obs[i][j]; }
    var expected = [], components = [], chi2 = 0, minExpected = Infinity;
    for(i = 0; i < R; i++){
      expected[i] = []; components[i] = [];
      for(j = 0; j < C; j++){
        var e = rows[i] * cols[j] / N, c = (obs[i][j] - e) * (obs[i][j] - e) / e;
        expected[i][j] = e; components[i][j] = c; chi2 += c; if(e < minExpected) minExpected = e;
      }
    }
    var df = (R - 1) * (C - 1);
    return { expected: expected, components: components, chi2: chi2, df: df, p: chi2Sf(chi2, df), rowTotals: rows, colTotals: cols, total: N, minExpected: minExpected };
  }

  /* ---------------------------------------------------------- descriptive */
  function mean(xs){ var s = 0; for(var i = 0; i < xs.length; i++) s += xs[i]; return s / xs.length; }
  function sd(xs){
    var m = mean(xs), s = 0;
    for(var i = 0; i < xs.length; i++) s += (xs[i] - m) * (xs[i] - m);
    return Math.sqrt(s / (xs.length - 1));
  }
  function medianSorted(a){ var n = a.length; return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2; }
  function summary(xs){
    var a = xs.slice().sort(function(x, y){ return x - y; }), n = a.length, h = Math.floor(n / 2);
    var lower = a.slice(0, h), upper = a.slice(n % 2 ? h + 1 : h);
    var q1 = n > 1 ? medianSorted(lower) : a[0], q3 = n > 1 ? medianSorted(upper) : a[0], iqr = q3 - q1;
    var fences = [q1 - 1.5 * iqr, q3 + 1.5 * iqr];
    return { n: n, mean: mean(a), sd: n > 1 ? sd(a) : 0, min: a[0], q1: q1, med: medianSorted(a), q3: q3, max: a[n - 1],
      iqr: iqr, range: a[n - 1] - a[0], fences: fences,
      outliers: a.filter(function(x){ return x < fences[0] || x > fences[1]; }) };
  }
  function lsrl(xs, ys){
    var n = xs.length, mx = mean(xs), my = mean(ys), sxy = 0, sxx = 0, syy = 0, i;
    for(i = 0; i < n; i++){ sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); syy += (ys[i] - my) * (ys[i] - my); }
    var b = sxy / sxx, a = my - b * mx, r = sxy / Math.sqrt(sxx * syy), res = [], sse = 0;
    for(i = 0; i < n; i++){ var e = ys[i] - (a + b * xs[i]); res.push(e); sse += e * e; }
    return { a: a, b: b, r: r, r2: r * r, s: n > 2 ? Math.sqrt(sse / (n - 2)) : NaN, residuals: res,
      predict: function(x){ return a + b * x; } };
  }

  /* ---------------------------------------------------------- the table route
     What a student reads from the reference sheet, so a grader can accept
     it beside the technology value (docs/apstat-spec.md section 7, rule 2).
       ('normal', z)        -> P(Z < z) with z rounded to two decimals (Table A)
       ('tdf', df)          -> the Table B row: df itself up to 30, else the
                               next row down (40, 50, 60, 80, 100, 1000)
       ('tcrit', level, df) -> t* from that row
       ('tbracket', t, df)  -> [lo, hi] one-tail probabilities from that row
       ('chi2bracket', x, df) -> [lo, hi] upper-tail probabilities (Table C) */
  var TB_ROWS = [40, 50, 60, 80, 100, 1000];
  var TAILS = [0.25, 0.20, 0.15, 0.10, 0.05, 0.025, 0.02, 0.01, 0.005, 0.0025, 0.001, 0.0005];
  function tableDf(df){
    df = Math.floor(df);
    if(df <= 30) return Math.max(1, df);
    var row = 30;
    for(var i = 0; i < TB_ROWS.length; i++) if(TB_ROWS[i] <= df) row = TB_ROWS[i];
    return row;
  }
  function bracket(stat, upper){
    // upper(tailP) -> the critical value with that upper-tail probability.
    var lo = 0, hi = 1;
    for(var i = 0; i < TAILS.length; i++){
      var cv = upper(TAILS[i]);
      if(stat >= cv){ hi = TAILS[i]; lo = i + 1 < TAILS.length ? TAILS[i + 1] : 0; }
    }
    if(hi === 1) lo = TAILS[0];
    return [lo, hi];
  }
  function tableRoute(kind, a, b){
    if(kind === 'normal') return normCdf(Math.round(a * 100) / 100);
    if(kind === 'tdf') return tableDf(a);
    if(kind === 'tcrit') return invT(1 - (1 - a) / 2, tableDf(b));
    if(kind === 'tbracket'){ var d = tableDf(b), t = Math.abs(a); return bracket(t, function(p){ return invT(1 - p, d); }); }
    if(kind === 'chi2bracket') return bracket(a, function(p){ return invChi2(1 - p, b); });
    throw new Error('tableRoute: unknown kind ' + kind);
  }

  root.ApStatDist = {
    lgamma: lgamma, erfc: erfc, betaI: betaI, gammaP: gammaP,
    normCdf: normCdf, normPdf: normPdf, invNorm: invNorm,
    tCdf: tCdf, tPdf: tPdf, invT: invT,
    chi2Cdf: chi2Cdf, chi2Sf: chi2Sf, chi2Pdf: chi2Pdf, invChi2: invChi2,
    binomPmf: binomPmf, binomCdf: binomCdf,
    z1prop: z1prop, z2prop: z2prop, t1: t1, t2: t2, welchDf: welchDf,
    ci1prop: ci1prop, ci2prop: ci2prop, ci1mean: ci1mean, ci2mean: ci2mean,
    chi2table: chi2table, lsrl: lsrl, summary: summary, mean: mean, sd: sd,
    tableRoute: tableRoute, tableDf: tableDf, TABLE_TAILS: TAILS.slice()
  };
})(typeof window !== 'undefined' ? window : globalThis);
