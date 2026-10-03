/* AP® Biology tools: the pure math behind every simulator and skills tool
   (docs/apbio-architecture.md, "Tools"). No DOM: the same file runs in the
   browser (window.ApBioMath) and in Node, where the tool validators load it
   in a vm sandbox to recompute every authored number (scripts/lib/apbio-tool-checks/).

   Conventions follow the course formula sheet:
     sample standard deviation s = sqrt( Σ(x - x̄)² / (n - 1) )
     standard error SE = s / sqrt(n); 95% confidence interval ≈ x̄ ± 2 SE
     chi-square χ² = Σ (o - e)² / e, df = categories - 1, critical values at p = 0.05
     solute potential ψs = -iCRT, R = 0.0831 L·bar/(mol·K), T = °C + 273
     water potential ψ = ψs + ψp
     Hardy-Weinberg p + q = 1, p² + 2pq + q² = 1
     Simpson's diversity index D = 1 - Σ (n/N)²
     rate = Δy/Δt; percent change = (final - initial) / initial × 100

   The two simulator models (enzyme kinetics, osmosis) are described, with
   their assumptions, in the "How this model works" box of each tool's data. */
(function(root){
  'use strict';
  var R_BAR = 0.0831;      // L·bar/(mol·K), as on the formula sheet
  var K0 = 273;            // the formula sheet's °C → K conversion
  var R_KJ = 0.008314;     // kJ/(mol·K), for the Arrhenius factor

  /* ------------------------------------------------------- numbers */
  function round(x, d){ var k = Math.pow(10, d || 0); return Math.round((x + (x >= 0 ? 1e-12 : -1e-12)) * k) / k; }
  function fixed(x, d){ var r = round(x, d); if(Object.is(r, -0) || (r === 0)) r = 0; return r.toFixed(d); }
  function sum(a){ var s = 0; for(var i = 0; i < a.length; i++) s += a[i]; return s; }
  function mean(a){ return sum(a) / a.length; }
  function sorted(a){ return a.slice().sort(function(x, y){ return x - y; }); }
  function median(a){ var s = sorted(a), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }
  function range(a){ var s = sorted(a); return s[s.length - 1] - s[0]; }
  /* Sample SD: divide by n - 1 (the formula sheet's s). */
  function sumSq(a){ var m = mean(a), t = 0; for(var i = 0; i < a.length; i++) t += (a[i] - m) * (a[i] - m); return t; }
  function sd(a){ return Math.sqrt(sumSq(a) / (a.length - 1)); }
  function se(a){ return sd(a) / Math.sqrt(a.length); }
  function seFrom(s, n){ return s / Math.sqrt(n); }
  function ci95(m, seV){ return { lo: m - 2 * seV, hi: m + 2 * seV }; }
  function overlap(a, b){ return a.lo <= b.hi && b.lo <= a.hi; }
  function rate(y1, y2, t1, t2){ return (y2 - y1) / (t2 - t1); }
  function percentChange(initial, final){ return (final - initial) / initial * 100; }
  /* Tolerance for a typed answer: one unit in the last decimal place asked
     for, or 1% of the answer, whichever is larger (intermediate rounding). */
  function tol(answer, d, rel){ return Math.max(Math.pow(10, -(d || 0)), Math.abs(answer) * (rel == null ? 0.01 : rel)); }

  /* ------------------------------------------------------ chi-square */
  /* Critical values of χ² (formula sheet table), df 1-8. */
  var CHI_CRIT = {
    '0.05': [null, 3.84, 5.99, 7.81, 9.49, 11.07, 12.59, 14.07, 15.51],
    '0.01': [null, 6.63, 9.21, 11.34, 13.28, 15.09, 16.81, 18.48, 20.09]
  };
  function chiSquare(obs, exp){
    var terms = obs.map(function(o, i){ return (o - exp[i]) * (o - exp[i]) / exp[i]; });
    var df = obs.length - 1;
    var chi2 = sum(terms);
    return { terms: terms, chi2: chi2, df: df, crit: CHI_CRIT['0.05'][df], reject: chi2 > CHI_CRIT['0.05'][df] };
  }

  /* -------------------------------------------------- water potential */
  function kelvin(c){ return c + K0; }
  function psiS(i, C, tc){ var v = -i * C * R_BAR * kelvin(tc); return v === 0 ? 0 : v; }

  /* ---------------------------------------------------- Hardy-Weinberg */
  function hwCounts(AA, Aa, aa){
    var N = AA + Aa + aa, p = (2 * AA + Aa) / (2 * N), q = 1 - p;
    return { N: N, p: p, q: q, p2: p * p, pq2: 2 * p * q, q2: q * q };
  }
  function hwRecessive(q2){ var q = Math.sqrt(q2), p = 1 - q; return { q2: q2, q: q, p: p, p2: p * p, pq2: 2 * p * q }; }

  /* --------------------------------------------------------- Simpson */
  function simpson(counts){
    var N = sum(counts), props = counts.map(function(n){ return n / N; });
    var squares = props.map(function(x){ return x * x; });
    var s = sum(squares);
    return { N: N, props: props, squares: squares, sumSq: s, D: 1 - s };
  }

  /* ------------------------------------------------------------- rng */
  /* mulberry32: a small seeded generator, so a problem code reproduces a
     problem exactly (teachers can share it). */
  function rng(seed){
    var a = (seed >>> 0) || 1;
    function next(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    next.int = function(lo, hi){ return lo + Math.floor(next() * (hi - lo + 1)); };
    next.real = function(lo, hi){ return lo + next() * (hi - lo); };
    next.pick = function(a){ return a[Math.floor(next() * a.length)]; };
    next.normal = function(m, s){ var u = 1 - next(), v = next(); return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    next.shuffle = function(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(next() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    return next;
  }

  /* ------------------------------------------------- enzyme kinetics */
  /* Michaelis-Menten: v = Vmax·[S] / (Km + [S]).
     Temperature: an Arrhenius rise (activation energy Ea) times the fraction
     of enzyme still folded, 1 / (1 + e^((T - Tm)/w)), normalized so the best
     temperature gives 1. pH: the fraction of enzyme whose two key groups are
     in the working ionization state, 1 / (1 + 10^(pKa1 - pH) + 10^(pH - pKa2)),
     normalized to 1 at its peak. Both scale Vmax (the amount of working
     enzyme), not Km: a simplification the data's assumptions box states.
     Competitive inhibitor: apparent Km = Km(1 + [I]/Ki), Vmax unchanged.
     Noncompetitive (pure) inhibitor: apparent Vmax = Vmax / (1 + [I]/Ki), Km
     unchanged. */
  var cache = {};
  function tempRaw(p, t){
    var arr = Math.exp(-p.Ea / R_KJ * (1 / (t + 273.15) - 1 / (p.Tm + 273.15)));
    return arr / (1 + Math.exp((t - p.Tm) / p.w));
  }
  function phRaw(p, x){ return 1 / (1 + Math.pow(10, p.pKa1 - x) + Math.pow(10, x - p.pKa2)); }
  function peak(p, kind){
    var key = kind + ':' + [p.Ea, p.Tm, p.w, p.pKa1, p.pKa2].join(',');
    if(cache[key]) return cache[key];
    var best = 0, at = 0, lo = kind === 't' ? 0 : 0, hi = kind === 't' ? 100 : 14, st = kind === 't' ? 0.05 : 0.005;
    for(var x = lo; x <= hi + 1e-9; x += st){ var v = kind === 't' ? tempRaw(p, x) : phRaw(p, x); if(v > best){ best = v; at = x; } }
    cache[key] = { max: best, at: at };
    return cache[key];
  }
  function tempFactor(p, t){ return tempRaw(p, t) / peak(p, 't').max; }
  function phFactor(p, x){ return phRaw(p, x) / peak(p, 'ph').max; }
  function enzymeParams(p, c){
    var f = tempFactor(p, c.T) * phFactor(p, c.pH);
    var vmax = p.Vmax * f, km = p.Km, I = c.I || 0;
    if(c.inhibitor === 'competitive') km = p.Km * (1 + I / p.Ki);
    else if(c.inhibitor === 'noncompetitive') vmax = vmax / (1 + I / p.Ki);
    return { vmax: vmax, km: km, tempFactor: tempFactor(p, c.T), phFactor: phFactor(p, c.pH) };
  }
  function enzymeRate(p, c, S){
    var k = enzymeParams(p, c), s = S == null ? c.S : S;
    return k.vmax * s / (k.km + s);
  }
  var enzyme = {
    params: enzymeParams, rate: enzymeRate, tempFactor: tempFactor, phFactor: phFactor,
    optimumT: function(p){ return peak(p, 't').at; },
    optimumPH: function(p){ return peak(p, 'ph').at; }
  };

  /* -------------------------------------------------------- osmosis */
  /* A cell (or bag) holds water W (1 = its starting water) and a fixed amount
     of solute that cannot cross the membrane: n osmoles per liter of its
     starting water. Then ψs(W) = -(n/W)·R·T, and the wall (or a full bag)
     pushes back once the water passes W0: ψp = ε(W/W0 - 1), else 0. Water
     crosses at a rate proportional to the water potential difference,
     dW/dt = L(ψ_outside - ψ_inside), until the two are equal. Mass is the
     part that is not osmotic water (b) plus the water: m = b + (1 - b)W.
     The outside solution is large, so its concentration does not change.
     An animal cell has no wall (ψp = 0) and bursts (lyses) when its volume
     passes lyseAt times the start. */
  function osmo(sys, c){
    var RT = R_BAR * kelvin(c.T);
    var n = sys.kind === 'bag' ? (c.inI || 1) * (c.inC || 0) : sys.osmIn;
    return { RT: RT, n: n, psiO: psiS(c.outI || 1, c.outC || 0, c.T) };
  }
  function psiParts(sys, o, W){
    var s = o.n ? -o.n * o.RT / W : 0;
    var p = sys.W0 && W > sys.W0 ? sys.eps * (W / sys.W0 - 1) : 0;
    return { psiS: s === 0 ? 0 : s, psiP: p, psi: s + p };
  }
  function massOf(sys, W){ return sys.b + (1 - sys.b) * W; }
  function osmosisState(sys, W, lysed){
    if(sys.kind === 'animal') return lysed ? 'lysed' : W > 1.03 ? 'swollen' : W < 0.97 ? 'shriveled' : 'normal';
    if(sys.kind === 'plant') return W < sys.W0 * 0.98 ? 'plasmolyzed' : W <= sys.W0 * 1.005 ? 'flaccid' : 'turgid';
    return W > 1.02 ? 'swollen' : W < 0.98 ? 'shrunken' : 'unchanged';
  }
  function simulate(sys, c){
    var o = osmo(sys, c), W = 1, t = 0, end = c.t || 0, lysed = false, guard = 0;
    var Wmin = 0.02;
    while(t < end - 1e-9 && guard++ < 200000){
      var pp = psiParts(sys, o, W);
      var slope = (o.n ? o.n * o.RT / (W * W) : 0) + (sys.W0 && W > sys.W0 ? sys.eps / sys.W0 : 0);
      var dt = Math.min(end - t, slope > 0 ? 0.05 / (sys.L * slope) : end / 400, end / 400);
      W = Math.max(Wmin, W + sys.L * (o.psiO - pp.psi) * dt);
      t += dt;
      if(sys.kind === 'animal' && sys.lyseAt && massOf(sys, W) >= sys.lyseAt){ lysed = true; W = (sys.lyseAt - sys.b) / (1 - sys.b); break; }
    }
    var fin = psiParts(sys, o, W), start = psiParts(sys, o, 1), mass = massOf(sys, W);
    var diff = o.psiO - fin.psi;
    return {
      W: W, mass: mass, pct: (mass - 1) * 100, lysed: lysed, state: osmosisState(sys, W, lysed),
      psiO: o.psiO, start: start, end: fin,
      startDir: Math.abs(o.psiO - start.psi) < 0.05 ? 'none' : o.psiO > start.psi ? 'in' : 'out',
      nowDir: lysed ? 'none' : Math.abs(diff) < 0.05 ? 'none' : diff > 0 ? 'in' : 'out',
      equilibrium: !lysed && Math.abs(diff) < 0.05
    };
  }
  /* The outside concentration at which nothing moves (start ψ = outside ψ). */
  function isotonicC(sys, c){
    var o = osmo(sys, c), st = psiParts(sys, o, 1);
    return -st.psi / ((c.outI || 1) * o.RT);
  }
  var osmosis = { simulate: simulate, psiParts: function(sys, c, W){ return psiParts(sys, osmo(sys, c), W); }, isotonicC: isotonicC, mass: massOf };

  /* ---------------------------------------------------- graph checks */
  /* "Nice" intervals: 1, 2, 2.5 or 5 times a power of ten. */
  function isNice(v){
    if(!(v > 0)) return false;
    var p = Math.pow(10, Math.floor(Math.log10(v) + 1e-9)), m = v / p;
    return [1, 2, 2.5, 5, 10].some(function(k){ return Math.abs(m - k) < 1e-6; });
  }
  /* The grid's minor step: about a fifth of the interval, itself nice. */
  function minorStep(interval){
    var ds = [5, 4, 2, 1];
    for(var i = 0; i < ds.length; i++){ var s = interval / ds[i]; if(isNice(s)) return s; }
    return interval / 5;
  }
  /* Check one numeric axis. values: every value the axis must show (data
     and error bar ends). opts.bar: bars start from zero. Returns a list of
     { ok, key, msg } so the page can say exactly what to fix. */
  function checkScale(ax, values, opts){
    opts = opts || {};
    var out = [], name = opts.name || 'axis';
    var min = +ax.min, max = +ax.max, iv = +ax.interval;
    if(!isFinite(min) || !isFinite(max) || !isFinite(iv)) return [{ ok: false, key: 'numbers', msg: 'Enter a minimum, a maximum and an interval for the ' + name + '.' }];
    if(max <= min) return [{ ok: false, key: 'order', msg: 'The ' + name + ' maximum must be larger than its minimum.' }];
    if(iv <= 0) return [{ ok: false, key: 'interval', msg: 'The ' + name + ' interval must be a positive number.' }];
    var lo = Math.min.apply(null, values), hi = Math.max.apply(null, values);
    var ticks = (max - min) / iv;
    out.push(Math.abs(ticks - Math.round(ticks)) < 1e-6
      ? { ok: true, key: 'even', msg: 'The interval divides the ' + name + ' evenly.' }
      : { ok: false, key: 'even', msg: 'The interval does not divide the ' + name + ' evenly: from ' + min + ' to ' + max + ' in steps of ' + iv + ' leaves a partial step. Every step on an axis must be the same size.' });
    var tn = Math.round(ticks);
    out.push(tn >= 4 && tn <= 15
      ? { ok: true, key: 'ticks', msg: 'The ' + name + ' has ' + tn + ' steps, easy to read.' }
      : { ok: false, key: 'ticks', msg: 'The ' + name + ' has ' + tn + ' step' + (tn === 1 ? '' : 's') + '. Use an interval that gives between 4 and 15 steps, so values can be read off the graph.' });
    out.push(isNice(iv)
      ? { ok: true, key: 'nice', msg: 'The interval (' + iv + ') is easy to count in.' }
      : { ok: false, key: 'nice', msg: 'Count in an easy interval such as 1, 2, 5, 10, 20, 25 or 50 (times a power of ten); ' + iv + ' makes values hard to read.' });
    out.push(min <= lo + 1e-9 && max >= hi - 1e-9
      ? { ok: true, key: 'fits', msg: 'Every value fits on the ' + name + '.' }
      : { ok: false, key: 'fits', msg: 'Some values fall off the ' + name + ': the data run from ' + round(lo, 6) + ' to ' + round(hi, 6) + ', so the axis must reach at least that far.' });
    var zeroOk;
    if(opts.bar || lo < 0) zeroOk = min <= 0 && max >= 0;
    else zeroOk = min === 0 || lo > 0.5 * hi;
    out.push(zeroOk
      ? { ok: true, key: 'start', msg: 'The ' + name + ' starts at a sensible value.' }
      : { ok: false, key: 'start', msg: opts.bar ? 'Bars show size from zero, so the ' + name + ' must include 0.'
          : lo < 0 ? 'Some values are negative, so the ' + name + ' must run through 0 and show the zero line.'
          : 'The values are all positive and not far from zero, so start the ' + name + ' at 0.' });
    // What the data occupy: from zero when the axis shows zero, else from the smallest value.
    var showsZero = min <= 0 && max >= 0;
    var from = showsZero ? Math.min(0, lo) : lo, to = showsZero ? Math.max(0, hi) : hi;
    var cover = (to - from) / (max - min);
    out.push(cover >= 0.5 - 1e-9
      ? { ok: true, key: 'cover', msg: 'The data use most of the ' + name + '.' }
      : { ok: false, key: 'cover', msg: 'The data fill only ' + Math.round(cover * 100) + '% of the ' + name + '. Choose a maximum closer to the largest value so the data use at least half of the grid.' });
    return out;
  }
  var graph = { isNice: isNice, minorStep: minorStep, checkScale: checkScale };

  root.ApBioMath = {
    R: R_BAR, K0: K0, round: round, fixed: fixed, sum: sum, mean: mean, median: median, range: range, sorted: sorted,
    sumSq: sumSq, sd: sd, se: se, seFrom: seFrom, ci95: ci95, overlap: overlap, rate: rate, percentChange: percentChange, tol: tol,
    CHI_CRIT: CHI_CRIT, chiSquare: chiSquare, kelvin: kelvin, psiS: psiS, hwCounts: hwCounts, hwRecessive: hwRecessive,
    simpson: simpson, rng: rng, enzyme: enzyme, osmosis: osmosis, graph: graph
  };
})(typeof window !== 'undefined' ? window : globalThis);
