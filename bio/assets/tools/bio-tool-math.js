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

   The simulator models (enzyme kinetics, osmosis, signal amplification,
   cell cycle checkpoints, meiosis, operons, Hardy-Weinberg with drift,
   phylogenetic trees) are described, with
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
  /* Critical values of χ² as printed on the formula sheet, df 1-8 (df 3 at p = 0.05 is 7.815, printed 7.82). */
  var CHI_CRIT = {
    '0.05': [null, 3.84, 5.99, 7.82, 9.49, 11.07, 12.59, 14.07, 15.51],
    '0.01': [null, 6.63, 9.21, 11.34, 13.28, 15.09, 16.81, 18.48, 20.09]
  };
  function chiSquare(obs, exp){
    var terms = obs.map(function(o, i){ return (o - exp[i]) * (o - exp[i]) / exp[i]; });
    var df = obs.length - 1;
    var chi2 = sum(terms);
    return { terms: terms, chi2: chi2, df: df, crit: CHI_CRIT['0.05'][df], reject: chi2 > CHI_CRIT['0.05'][df] };
  }
  /* The χ² distribution's density, for drawing its curve (skills tools):
     f(x; k) = x^(k/2 − 1) e^(−x/2) / (2^(k/2) Γ(k/2)), x > 0. Γ(k/2) for a
     whole number k is exact: (k/2 − 1)! for even k, and from Γ(1/2) = √π by
     Γ(s + 1) = sΓ(s) for odd k. 0 for x ≤ 0 (for k = 1 the density rises
     without limit near 0; callers clamp what they draw). */
  function gammaHalf(k){ var g = k % 2 ? Math.sqrt(Math.PI) : 1; for(var s = k % 2 ? 0.5 : 1; s < k / 2 - 1e-9; s += 1) g *= s; return g; }
  function chiPdf(x, k){
    if(!(x > 0) || !(k >= 1)) return 0;
    return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2) / gammaHalf(k);
  }
  /* Split a whole-number total into whole shares as close as possible to
     fracs × total that still add up to total (largest remainder), for
     drawing a population of individuals from frequencies. */
  function apportion(fracs, total){
    var raw = fracs.map(function(f){ return f * total; }), out = raw.map(Math.floor), left = total - sum(out);
    raw.map(function(r, i){ return { i: i, r: r - Math.floor(r) }; }).sort(function(a, b){ return b.r - a.r || a.i - b.i; })
      .slice(0, Math.max(0, left)).forEach(function(o){ out[o.i]++; });
    return out;
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
     passes lyseAt times the start (the model tests mass, which here tracks volume: water plus a fixed non-water part). */
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

  /* ------------------------------------------- signal amplification */
  /* A G protein-coupled receptor pathway in a liver cell (epinephrine →
     receptor → G protein → adenylyl cyclase → cAMP → PKA → phosphorylase
     kinase → glycogen phosphorylase → glucose units from glycogen). Counts
     are molecules per cell; p (the tool data's "model") holds every number
     and the data's "How this model works" box states each rule:
       receptor occupancy O relaxes toward L/(L + Kd'), rate kR, where
         Kd' = Kd(1 + antag) with the antagonist, else Kd; L = 0 after tOff
       dG/dt = (kAct·R/Gtot + kBasal)(Gtot − G) − kHyd·G   (R = Rtot·O)
         locked on: kHyd = 0; locked off: kAct = kBasal = 0
       AC = ACtot·G/(G + KG)            (one Gα switches on one cyclase)
       dC/dt = kAC·AC − kPDE·C          (PDE inhibitor: kPDE × pdeLeft)
       PKA = PKAtot·Cⁿ/(Cⁿ + Kcⁿ)      (kinase inhibitor: × (1 − pkaBlock))
       dK/dt = k1·PKA·(Ktot − K)/Ktot − kp1·K   (phosphatase undoes it)
       dP/dt = k2·K·(Ptot − P)/Ptot − kp2·P
       glucose release rate = kGP·P
     Euler steps of dt seconds from the resting (no ligand) steady state. */
  function sigBasal(p){
    var G = p.kBasal * p.Gtot / (p.kBasal + p.kHyd), AC = p.ACtot * G / (G + p.KG), C = p.kAC * AC / p.kPDE;
    var PKA = p.PKAtot * Math.pow(C, p.n) / (Math.pow(C, p.n) + Math.pow(p.Kc, p.n));
    var K = p.k1 * PKA / (p.kp1 + p.k1 * PKA / p.Ktot), P = p.k2 * K / (p.kp2 + p.k2 * K / p.Ptot);
    return { O: 0, G: G, C: C, K: K, P: P };
  }
  function signalSim(p, c){
    var s = sigBasal(p), dt = p.dt, tEnd = c.tEnd == null ? p.tEnd : c.tEnd, every = Math.round(p.sample / dt);
    var kd = p.Kd * (c.antagonist ? 1 + p.antag : 1);
    var kAct = c.gprotein === 'off' ? 0 : p.kAct, kB = c.gprotein === 'off' ? 0 : p.kBasal, kH = c.gprotein === 'on' ? 0 : p.kHyd;
    var kPDE = p.kPDE * (c.pde ? p.pdeLeft : 1), pkaOn = c.pka ? 1 - p.pkaBlock : 1;
    var out = { t: [], R: [], G: [], AC: [], cAMP: [], PKA: [], PhK: [], GP: [], rate: [], glucose: [] }, glu = 0;
    function derived(){
      var AC = p.ACtot * s.G / (s.G + p.KG), Cn = Math.pow(s.C, p.n), PKA = p.PKAtot * Cn / (Cn + Math.pow(p.Kc, p.n)) * pkaOn;
      return { R: p.Rtot * s.O, AC: AC, PKA: PKA, rate: p.kGP * s.P };
    }
    var steps = Math.round(tEnd / dt);
    for(var i = 0; i <= steps; i++){
      var t = i * dt, d = derived();
      if(i % every === 0){
        out.t.push(round(t, 6)); out.R.push(d.R); out.G.push(s.G); out.AC.push(d.AC); out.cAMP.push(s.C);
        out.PKA.push(d.PKA); out.PhK.push(s.K); out.GP.push(s.P); out.rate.push(d.rate); out.glucose.push(glu);
      }
      if(i === steps) break;
      var L = t < c.tOff ? c.L : 0, oEq = L > 0 ? L / (L + kd) : 0;
      var dO = p.kR * (oEq - s.O);
      var dG = (kAct * d.R / p.Gtot + kB) * (p.Gtot - s.G) - kH * s.G;
      var dC = p.kAC * d.AC - kPDE * s.C;
      var dK = p.k1 * d.PKA * (p.Ktot - s.K) / p.Ktot - p.kp1 * s.K;
      var dP = p.k2 * s.K * (p.Ptot - s.P) / p.Ptot - p.kp2 * s.P;
      glu += d.rate * dt;
      s = { O: s.O + dO * dt, G: s.G + dG * dt, C: s.C + dC * dt, K: s.K + dK * dt, P: s.P + dP * dt };
    }
    return out;
  }
  function sigAt(sim, t){
    var i = 0, best = Infinity;
    for(var j = 0; j < sim.t.length; j++){ var e = Math.abs(sim.t[j] - t); if(e < best){ best = e; i = j; } }
    var o = {}; for(var k in sim) o[k] = sim[k][i]; return o;
  }
  /* Counts to three significant figures with thousands commas (the tool's
     readouts and its stimulus tables use the same rounding). */
  function sig3(x){
    if(!(x >= 0.5)) return '0';
    var v = Math.round(Number(x.toPrecision(3)));
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  var signal = { simulate: signalSim, at: sigAt, basal: sigBasal, fmt: sig3,
    STAGES: ['R', 'G', 'AC', 'cAMP', 'PKA', 'PhK', 'GP', 'rate'] };

  /* ------------------------------------------- cell cycle checkpoints */
  /* A deterministic population model: cell numbers (real numbers, so the
     same settings always give the same result) sit in age bins of dt hours
     in G1, S, G2 and M, in G0, or held at a checkpoint, each split into
     undamaged (0) and DNA-damaged (1). G1 has a fixed early part (G1min h)
     and a late part that cells leave at a constant rate, mean G1 − G1min h
     (G1fast − G1min with cyclin D–CDK overactive), so G1 length varies from
     cell to cell as it does in real populations. p is the tool data's "model"; the
     data's "How this model works" box states each rule:
       damage: each hour a fraction c.damage of undamaged cells (anywhere)
         become damaged
       G1 checkpoint (leaving late G1): a damaged cell with working p53 is held; any
         other cell passes with probability gEff = 1 if Rb is lost, cyclin
         D–CDK is overactive or ras is stuck on, else the growth factor
         level c.gf (0-1); the rest go to G0, which they leave for G1 at
         kre·gEff per hour
       held at G1 or G2: repaired at repair per hour (then go on undamaged);
         with p53 die by apoptosis at apoptosis per hour; at G2 without p53
         the hold is not kept: escape per hour go on into M still damaged
       G2 checkpoint: a damaged cell is held (p53 or not)
       M checkpoint: with a spindle poison no chromosome is attached, so no
         cell leaves M; otherwise a cell divides into two G1 cells that
         inherit its damage status
     The start is a normal population grown for warm hours, scaled to N0. */
  function zeros(n){ var a = []; for(var i = 0; i < n; i++) a.push(0); return a; }
  function cyclePop(p){
    var b = function(h){ return Math.round(h / p.dt); };
    var o = { g1: [], s: [], g2: [], m: [], g0: [0, 0], lg1: [0, 0], h1: [0, 0], h2: [0, 0], hm: [0, 0] };
    for(var d = 0; d < 2; d++){ o.g1.push(zeros(b(p.G1min))); o.s.push(zeros(b(p.S))); o.g2.push(zeros(b(p.G2))); o.m.push(zeros(b(p.M))); }
    return o;
  }
  function popCount(o){
    var n = { G0: 0, G1: 0, S: 0, G2: 0, M: 0, damaged: 0, held1: 0, held2: 0, heldM: 0, hist: [0, 0, 0, 0, 0, 0] };
    for(var d = 0; d < 2; d++){
      var g1 = sum(o.g1[d]) + o.lg1[d] + o.h1[d], s = sum(o.s[d]), g2 = sum(o.g2[d]) + o.h2[d], m = sum(o.m[d]) + o.hm[d];
      n.G0 += o.g0[d]; n.G1 += g1; n.S += s; n.G2 += g2; n.M += m;
      n.held1 += o.h1[d]; n.held2 += o.h2[d]; n.heldM += o.hm[d];
      if(d) n.damaged = o.g0[d] + g1 + s + g2 + m;
      n.hist[0] += o.g0[d] + g1; n.hist[5] += g2 + m;
      var q = o.s[d].length / 4;
      o.s[d].forEach(function(x, i){ n.hist[1 + Math.min(3, Math.floor(i / q))] += x; });
    }
    n.N = n.G0 + n.G1 + n.S + n.G2 + n.M;
    return n;
  }
  function cycleStep(p, c, o){
    var dt = p.dt, ev = { div: 0, divDam: 0, died: 0 };
    var gEff = (c.rb || c.cycd || c.ras) ? 1 : c.gf;
    var late = 1 - Math.exp(-dt / ((c.cycd ? p.G1fast : p.G1) - p.G1min));
    // 1. new damage
    var f = c.damage * dt;
    if(f > 0){
      ['g1', 's', 'g2', 'm'].forEach(function(k){ o[k][0].forEach(function(x, i){ var mv = x * f; o[k][0][i] -= mv; o[k][1][i] += mv; }); });
      ['g0', 'lg1', 'h1', 'h2', 'hm'].forEach(function(k){ var mv = o[k][0] * f; o[k][0] -= mv; o[k][1] += mv; });
    }
    var inS = [0, 0], inG1 = [0, 0], inM = [0, 0], inG2 = [0, 0];
    function g1Exit(x, d){
      if(d === 1 && c.p53){ o.h1[1] += x; return; }
      inS[d] += gEff * x; o.g0[d] += (1 - gEff) * x;
    }
    // 2. pools
    var h1 = o.h1[1]; o.h1[1] = 0;
    if(c.p53){
      var rep1 = h1 * p.repair * dt, die1 = h1 * p.apoptosis * dt;
      o.h1[1] = h1 - rep1 - die1; ev.died += die1;
      inS[0] += gEff * rep1; o.g0[0] += (1 - gEff) * rep1;
    } else { inS[1] += gEff * h1; o.g0[1] += (1 - gEff) * h1; }
    var h2 = o.h2[1], rep2 = h2 * p.repair * dt, die2 = c.p53 ? h2 * p.apoptosis * dt : 0, esc2 = c.p53 ? 0 : h2 * p.escape * dt;
    o.h2[1] = h2 - rep2 - die2 - esc2; ev.died += die2; inM[0] += rep2; inM[1] += esc2;
    for(var d = 0; d < 2; d++){ var re = o.g0[d] * p.kre * gEff * dt; o.g0[d] -= re; inG1[d] += re; }
    // 3. advance every phase by one bin
    for(d = 0; d < 2; d++){
      var g1 = o.g1[d], ng1 = zeros(g1.length);
      var lx = o.lg1[d] * late; o.lg1[d] -= lx; g1Exit(lx, d);
      g1.forEach(function(x, i){ if(i + 1 >= g1.length) o.lg1[d] += x; else ng1[i + 1] += x; });
      var s = o.s[d], ns = zeros(s.length);
      s.forEach(function(x, i){ if(i + 1 >= s.length) inG2[d] += x; else ns[i + 1] += x; });
      var g2 = o.g2[d], ng2 = zeros(g2.length);
      g2.forEach(function(x, i){ if(i + 1 >= g2.length){ if(d === 1) o.h2[1] += x; else inM[0] += x; } else ng2[i + 1] += x; });
      var m = o.m[d], nm = zeros(m.length), out = 0;
      m.forEach(function(x, i){ if(i + 1 >= m.length) out += x; else nm[i + 1] += x; });
      if(!c.spindle){ out += o.hm[d]; o.hm[d] = 0; }
      if(c.spindle) o.hm[d] += out;
      else { inG1[d] += 2 * out; ev.div += out; if(d) ev.divDam += out; }
      o.g1[d] = ng1; o.s[d] = ns; o.g2[d] = ng2; o.m[d] = nm;
    }
    for(d = 0; d < 2; d++){ o.g1[d][0] += inG1[d]; o.s[d][0] += inS[d]; o.g2[d][0] += inG2[d]; o.m[d][0] += inM[d]; }
    return ev;
  }
  var warmCache = {};
  function cycleStart(p){
    var key = [p.dt, p.G1, p.S, p.G2, p.M, p.warm, p.N0].join(',');
    if(!warmCache[key]){
      var o = cyclePop(p), normal = { gf: 1, damage: 0, p53: true }, len = o.g1[0].length + o.s[0].length + o.g2[0].length + o.m[0].length;
      ['g1', 's', 'g2', 'm'].forEach(function(k){ o[k][0] = o[k][0].map(function(){ return p.N0 / len; }); });
      var hist = [];
      for(var i = 0; i < Math.round(p.warm / p.dt); i++) hist.push(cycleStep(p, normal, o));
      var k = p.N0 / popCount(o).N;
      ['g1', 's', 'g2', 'm'].forEach(function(n){ o[n][0] = o[n][0].map(function(x){ return x * k; }); });
      o.lg1[0] *= k;
      warmCache[key] = { o: o, last: hist.slice(-Math.round(1 / p.dt)).map(function(e){ return { div: e.div * k, divDam: 0, died: 0 }; }) };
    }
    return JSON.parse(JSON.stringify(warmCache[key]));
  }
  function cycleSim(p, c){
    var w = cycleStart(p), o = w.o, win = w.last, perH = Math.round(1 / p.dt), tEnd = c.tEnd == null ? p.tEnd : c.tEnd;
    var out = [], cumDiv = 0, cumDam = 0, cumDied = 0;
    function rec(t){
      var n = popCount(o), last = win.slice(-perH), r = function(k){ return sum(last.map(function(e){ return e[k]; })); };
      n.t = round(t, 6); n.div = r('div'); n.divDam = r('divDam'); n.died = r('died');
      n.divRate = 100 * n.div / n.N; n.cumDiv = cumDiv; n.cumDivDam = cumDam; n.cumDied = cumDied;
      n.pctG1 = 100 * (n.G0 + n.G1) / n.N; n.pctS = 100 * n.S / n.N; n.pctG2M = 100 * (n.G2 + n.M) / n.N;
      n.pctDam = 100 * n.damaged / n.N; n.pctDivDam = n.div > 0 ? 100 * n.divDam / n.div : 0;
      out.push(n);
    }
    rec(0);
    for(var i = 1; i <= Math.round(tEnd / p.dt); i++){
      var e = cycleStep(p, c, o); win.push(e); cumDiv += e.div; cumDam += e.divDam; cumDied += e.died;
      rec(i * p.dt);
    }
    return out;
  }
  var cellCycle = { simulate: cycleSim, at: function(sim, t){ for(var i = 0; i < sim.length; i++) if(Math.abs(sim[i].t - t) < 1e-6) return sim[i]; return sim[sim.length - 1]; } };

  /* ------------------------------------------- meiosis and nondisjunction */
  /* A diploid cell with k homologous pairs (2n = 2k) goes through meiosis.
     A chromatid is { pair, from, tip }: "from" is the parent its body
     (centromere side) came from, 'M' maternal or 'P' paternal, and "tip" is
     where its far end came from (different after crossing over). A
     chromosome is { pair, from, c: [chromatids] }: one chromatid before S
     phase and in gametes, two (sister chromatids) from S to anaphase II.
     c: { pairs: k, cross: bool, orient: [0|1 per pair] (0: the maternal
     homolog faces cell 1 at metaphase I), orient2: [[0|1 per pair] per cell]
     (0: chromatid 1 goes to the first gamete of that cell), nd: 'none', 'I'
     or 'II', ndPair: pair index, ndCell: 0 or 1 (the cell in meiosis II)}.
     Rules (also in the tool's "How this model works" box): one crossover
     per pair when crossing over is on, between the two inner nonsister
     chromatids (maternal chromatid 2 and paternal chromatid 1), which swap
     their tips; nondisjunction in meiosis I sends both homologs of the pair
     to cell 1; in meiosis II both sister chromatids of the pair go to the
     first gamete of the chosen cell. Every chromatid counts as the same
     amount of DNA, scaled so a G1 cell holds 2 units. */
  var MEIO_STAGES = ['g1', 's', 'pro1', 'meta1', 'ana1', 'mei1', 'meta2', 'ana2', 'gametes'];
  function mcopy(x){ return JSON.parse(JSON.stringify(x)); }
  function meioCount(cell){ return cell.length; }
  function meioChromatids(cell){ var n = 0; cell.forEach(function(ch){ n += ch.c.length; }); return n; }
  function meioOpts(c){
    var k = c.pairs || 3, o = { pairs: k, cross: !!c.cross, nd: c.nd || 'none', ndPair: c.ndPair || 0, ndCell: c.ndCell || 0, orient: [], orient2: [[], []] };
    for(var i = 0; i < k; i++){ o.orient.push((c.orient && c.orient[i]) ? 1 : 0); o.orient2[0].push(c.orient2 && c.orient2[0] && c.orient2[0][i] ? 1 : 0); o.orient2[1].push(c.orient2 && c.orient2[1] && c.orient2[1][i] ? 1 : 0); }
    return o;
  }
  function byPair(a, b){ return a.pair - b.pair || (a.from < b.from ? -1 : a.from > b.from ? 1 : 0); }
  function meiosisSim(c){
    var o = meioOpts(c), k = o.pairs, st = [], i;
    var g1 = [];
    for(i = 0; i < k; i++){ g1.push({ pair: i, from: 'M', c: [{ pair: i, from: 'M', tip: 'M' }] }); g1.push({ pair: i, from: 'P', c: [{ pair: i, from: 'P', tip: 'P' }] }); }
    st.push({ id: 'g1', cells: [g1] });
    var s = g1.map(function(ch){ return { pair: ch.pair, from: ch.from, c: [mcopy(ch.c[0]), mcopy(ch.c[0])] }; });
    st.push({ id: 's', cells: [mcopy(s)] });
    var pro = mcopy(s);
    if(o.cross) for(i = 0; i < k; i++){
      var m = pro[2 * i], p = pro[2 * i + 1];
      m.c[1].tip = 'P'; p.c[0].tip = 'M';
    }
    st.push({ id: 'pro1', cells: [mcopy(pro)], paired: true, crossed: o.cross });
    // metaphase I: each pair's homologs face the two poles (cell 1 side, cell 2 side)
    var left = [], right = [];
    for(i = 0; i < k; i++){
      var mm = pro[2 * i], pp = pro[2 * i + 1], a = o.orient[i] ? pp : mm, b = o.orient[i] ? mm : pp;
      left.push(a); right.push(b);
    }
    st.push({ id: 'meta1', cells: [mcopy(pro)], sides: [mcopy(left), mcopy(right)], orient: o.orient.slice() });
    var c1 = [], c2 = [];
    for(i = 0; i < k; i++){
      if(o.nd === 'I' && o.ndPair === i){ c1.push(mcopy(left[i])); c1.push(mcopy(right[i])); }
      else { c1.push(mcopy(left[i])); c2.push(mcopy(right[i])); }
    }
    c1.sort(byPair); c2.sort(byPair);
    st.push({ id: 'ana1', cells: [mcopy(c1), mcopy(c2)], moving: true });
    st.push({ id: 'mei1', cells: [mcopy(c1), mcopy(c2)] });
    st.push({ id: 'meta2', cells: [mcopy(c1), mcopy(c2)] });
    var gam = [[], [], [], []];
    [c1, c2].forEach(function(cell, ci){
      cell.forEach(function(ch){
        var sw = o.orient2[ci][ch.pair], first = ch.c[sw ? 1 : 0], second = ch.c[sw ? 0 : 1];
        if(o.nd === 'II' && o.ndCell === ci && o.ndPair === ch.pair){ gam[2 * ci].push({ pair: ch.pair, from: first.from, c: [first] }); gam[2 * ci].push({ pair: ch.pair, from: second.from, c: [second] }); }
        else { gam[2 * ci].push({ pair: ch.pair, from: first.from, c: [first] }); gam[2 * ci + 1].push({ pair: ch.pair, from: second.from, c: [second] }); }
      });
    });
    st.push({ id: 'ana2', cells: mcopy(gam), moving: true });
    st.push({ id: 'gametes', cells: mcopy(gam) });
    st.forEach(function(x){
      x.counts = x.cells.map(meioCount);
      x.dna = x.cells.map(function(cell){ return meioChromatids(cell) * 2 / (2 * k); });
    });
    var gametes = gam.map(function(cell){
      var n = cell.length, d = n - k;
      var per = []; for(i = 0; i < k; i++) per.push(cell.filter(function(ch){ return ch.pair === i; }).length);
      var extra = per.indexOf(2), miss = per.indexOf(0);
      return { chromosomes: cell, n: n, label: d === 0 ? 'n' : d > 0 ? 'n+' + d : 'n−' + (-d), perPair: per, key: meioKey(cell),
        zygote: n + k, zlabel: d === 0 ? '2n' : d > 0 ? '2n+' + d : '2n−' + (-d), trisomy: extra, monosomy: miss };
    });
    var keys = {}; gametes.forEach(function(g){ keys[g.key] = 1; });
    return { opts: o, stages: st, gametes: gametes, kinds: Object.keys(keys).length, combos: Math.pow(2, k), k: k };
  }
  /* A gamete's chromosome set as text, e.g. "1M 2P(tip M) 3P". */
  function meioName(ch){ var t = ch.c.length === 1 ? ch.c[0] : null; return (ch.pair + 1) + ch.from + (t && t.tip !== t.from ? '(tip ' + t.tip + ')' : ''); }
  function meioKey(cell){ return cell.slice().sort(function(a, b){ return a.pair - b.pair || (meioName(a) < meioName(b) ? -1 : 1); }).map(meioName).join(' '); }
  /* Every way the chromosomes can line up: 2^k in meiosis I and, for each,
     4^k sister arrangements in meiosis II (they matter only after crossing
     over, when sisters differ). Returns how many different gametes appear. */
  function meiosisSeries(c){
    var o = meioOpts(c), k = o.pairs, kinds = {}, n1 = Math.pow(2, k), n2 = o.cross ? Math.pow(4, k) : 1;
    for(var a = 0; a < n1; a++) for(var b = 0; b < n2; b++){
      var or = [], o2 = [[], []];
      for(var i = 0; i < k; i++){ or.push((a >> i) & 1); o2[0].push((b >> i) & 1); o2[1].push((b >> (k + i)) & 1); }
      var r = meiosisSim({ pairs: k, cross: o.cross, orient: or, orient2: o2, nd: o.nd, ndPair: o.ndPair, ndCell: o.ndCell });
      r.gametes.forEach(function(g){ kinds[g.key] = (kinds[g.key] || 0) + 1; });
    }
    return { lineups: n1 * n2, meiosisI: n1, kinds: Object.keys(kinds).length, list: Object.keys(kinds).sort() };
  }
  /* Mitosis of the same G1 cell: S phase, then sister chromatids separate,
     so each of the two daughter cells gets one copy of every chromosome. */
  function mitosisSim(c){
    var k = (c && c.pairs) || 3, cell = [];
    for(var i = 0; i < k; i++){ cell.push({ pair: i, from: 'M', c: [{ pair: i, from: 'M', tip: 'M' }] }); cell.push({ pair: i, from: 'P', c: [{ pair: i, from: 'P', tip: 'P' }] }); }
    var d = [mcopy(cell), mcopy(cell)];
    return { parent: cell, daughters: d, counts: [d[0].length, d[1].length], identical: meioKey(d[0]) === meioKey(d[1]) && meioKey(d[0]) === meioKey(cell), dna: [2, 4, 2] };
  }
  var meiosis = { STAGES: MEIO_STAGES, simulate: meiosisSim, series: meiosisSeries, mitosis: mitosisSim, name: meioName, key: meioKey };

  /* ------------------------------------------------ lac and trp operons */
  /* A rule-based model of two bacterial operons, with a time course after
     the inputs change. p (the tool data's "model"): { basal, full, noCap,
     trpOn, mHalf, eDouble, tStart, tEnd, dt }. A condition c:
       lac: { mode: 'lac', glucose, lactose, copies: [{ I: '+'|'-'|'s', O: '+'|'c', Z: '+'|'-' }] }
       trp: { mode: 'trp', trp, copies: [{ R: '+'|'-', O: '+'|'c' }] }
     One copy is a normal (haploid) cell; two copies (chromosome + F′) is the
     "going further" merodiploid. Rules (also in the tool's "How this model
     works" box):
     - lac: no glucose → cAMP high → CAP–cAMP binds the CAP site of every
       lac promoter in the cell. Lactose → allolactose (the inducer).
       Repressor protein from any lacI copy acts on every operator (trans).
       A lacIˢ super-repressor cannot bind allolactose, so it stays on every
       normal operator. A normal repressor leaves the operator when
       allolactose binds it. lacI⁻ makes no working repressor. An Oᶜ
       operator binds no repressor, so only its own copy is freed (cis).
     - A blocked copy is transcribed at `basal`; a free copy at `full` with
       CAP bound and `noCap` without. lacZ⁻ copies still make mRNA, but
       no working β-galactosidase.
     - trp: tryptophan is the corepressor: the trp repressor binds the
       operator only with tryptophan bound. trpR⁻ makes no repressor; an
       Oᶜ trp operator binds none. Blocked → basal, free → trpOn.
     - mRNA and enzyme are relative: a fully induced wild-type copy makes
       100 at steady state. mRNA decays with half-life mHalf (min); the
       enzyme is stable and is diluted by growth (doubling time eDouble),
       so dm/dt = a(rate − m), de/dt = b(mZ − e), solved exactly. */
  function opState(p, c){
    var copies = c.copies || [], lac = c.mode !== 'trp', res = { mode: lac ? 'lac' : 'trp', copies: [], m: 0, e: 0 };
    if(lac){
      var cap = !c.glucose, ind = !!c.lactose;
      var hasS = copies.some(function(k){ return k.I === 's'; }), hasWT = copies.some(function(k){ return k.I === '+'; });
      res.cAMP = cap ? 'high' : 'low'; res.cap = cap; res.inducer = ind; res.repressor = hasS ? 'super' : hasWT ? 'normal' : 'none';
      copies.forEach(function(k){
        var rep;
        if(!hasS && !hasWT) rep = 'none';
        else if(k.O === 'c') rep = 'cantbind';
        else if(hasS) rep = 'super';
        else rep = ind ? 'released' : 'bound';
        var blocked = rep === 'bound' || rep === 'super';
        var rnap = blocked ? 'blocked' : cap ? 'strong' : 'weak';
        var rate = blocked ? p.basal : cap ? p.full : p.noCap;
        var enz = k.Z === '-' ? 0 : rate;
        res.copies.push({ rep: rep, cap: cap, rnap: rnap, rate: rate, enz: enz });
        res.m += rate; res.e += enz;
      });
    } else {
      var trp = !!c.trp, made = copies.some(function(k){ return k.R !== '-'; });
      res.corepressor = trp; res.repressor = made ? 'normal' : 'none';
      copies.forEach(function(k){
        var rep = !made ? 'none' : k.O === 'c' ? 'cantbind' : trp ? 'bound' : 'inactive';
        var blocked = rep === 'bound', rate = blocked ? p.basal : p.trpOn;
        res.copies.push({ rep: rep, rnap: blocked ? 'blocked' : 'binds', rate: rate, enz: rate });
        res.m += rate; res.e += rate;
      });
    }
    return res;
  }
  /* The time course: steady state under `before` until 0 min, then `after`. */
  function opCourse(p, before, after){
    var s0 = opState(p, before), s1 = opState(p, after), a = Math.LN2 / p.mHalf, b = Math.LN2 / p.eDouble;
    var m0 = s0.m, e0 = s0.e, mz0 = s0.e, m1 = s1.m, mz1 = s1.e, out = [];
    // the enzyme follows the lacZ⁺ mRNA (mz), which decays like all the mRNA
    var D = mz0 - mz1, K = b * D / (b - a);
    var n = Math.round((p.tEnd - p.tStart) / p.dt);
    for(var i = 0; i <= n; i++){
      var t = round(p.tStart + i * p.dt, 6), m, e;
      if(t <= 0){ m = m0; e = e0; }
      else {
        var ea = Math.exp(-a * t), eb = Math.exp(-b * t);
        m = m1 + (m0 - m1) * ea;
        e = mz1 + K * ea + (e0 - mz1 - K) * eb;
      }
      out.push({ t: t, m: m, e: e });
    }
    return { before: s0, after: s1, points: out };
  }
  function opAt(course, t){ var ps = course.points; for(var i = 0; i < ps.length; i++) if(Math.abs(ps[i].t - t) < 1e-6) return ps[i]; return ps[ps.length - 1]; }
  var operon = { state: opState, course: opCourse, at: opAt };

  /* ---------------------------------- Hardy-Weinberg, drift and selection */
  /* One gene with two alleles, A (frequency p) and a (q = 1 − p), in a
     population of N diploid adults. N = 0 means "very large": no drift, so
     every replicate is the same and nothing is random. A condition c:
       { p0, N, gens, reps, seed, w: [wAA, wAa, waa], u, v, m, pm, F, event }
     u: A → a mutations per allele per generation; v: a → A. m: the share of
     each generation's gene pool that comes from migrants, whose p is pm.
     F: non-random mating (the inbreeding coefficient; 0 = random mating).
     event: null or { gen, size, len }: from generation `gen` the population
     has only `size` adults for `len` generations (a bottleneck; a founder
     event is the same with len 1, the new colony being the population we
     follow), then N again.
     Each generation, in this order (also in the tool's box):
       1. selection: each genotype's adults leave gametes in proportion to
          its fitness: gene-pool p = (wAA·AA + ½·wAa·Aa) / (wAA·AA + wAa·Aa + waa·aa);
       2. mutation: p ← p(1 − u) + (1 − p)v;
       3. migration: p ← (1 − m)p + m·pm;
       4. mating: zygote frequencies p²(1 − F) + pF, 2pq(1 − F), q²(1 − F) + qF
          (F = 0 gives the Hardy-Weinberg p², 2pq, q²);
       5. drift (Wright-Fisher): the next N adults are drawn one by one at
          random from those zygote frequencies with the seeded generator; in a
          very large population the adults are exactly those frequencies.
     Generation 0 is set, not drawn: round(N·AA) AA and round(N·aa) aa adults
     from the step-4 frequencies at p0, the rest Aa; identical in every
     replicate. Replicate r draws from its own stream rng(seed + 7919·r), so
     adding replicates leaves the earlier ones unchanged. */
  function pgZygotes(p, F){ var q = 1 - p; F = F || 0; return [p * p * (1 - F) + F * p, 2 * p * q * (1 - F), q * q * (1 - F) + F * q]; }
  function pgPool(c, g){
    var w = c.w || [1, 1, 1], tot = g[0] * w[0] + g[1] * w[1] + g[2] * w[2];
    if(!(tot > 0)) return null;
    var p = (g[0] * w[0] + 0.5 * g[1] * w[1]) / tot;
    p = p * (1 - (c.u || 0)) + (1 - p) * (c.v || 0);
    p = (1 - (c.m || 0)) * p + (c.m || 0) * (c.pm == null ? 0.5 : c.pm);
    return Math.min(1, Math.max(0, p));
  }
  function pgSizeAt(c, t){ var e = c.event; return e && t >= e.gen && t < e.gen + e.len ? e.size : c.N; }
  function pgPofG(g){ return g[0] + g[1] / 2; }
  function pgRun(c, r){
    var R = rng((c.seed >>> 0) + 7919 * r), z = pgZygotes(c.p0, c.F), N0 = c.N, g, n;
    if(N0 > 0){
      var AA = Math.round(N0 * z[0]), aa = Math.round(N0 * z[2]), Aa = N0 - AA - aa;
      if(Aa < 0){ aa += Aa; Aa = 0; }
      g = [AA / N0, Aa / N0, aa / N0];
    } else g = z.slice();
    var rec = { p: [pgPofG(g)], g: [g], n: [N0], fate: null, end: null, extinct: null };
    for(var t = 1; t <= c.gens; t++){
      var pool = rec.extinct == null ? pgPool(c, g) : null;
      if(pool == null){ if(rec.extinct == null) rec.extinct = t; rec.p.push(rec.p[t - 1]); rec.g.push(g); rec.n.push(0); continue; }
      z = pgZygotes(pool, c.F); n = pgSizeAt(c, t);
      if(n > 0){
        var k = [0, 0, 0], a = z[0], b = z[0] + z[1];
        for(var i = 0; i < n; i++){ var x = R(); if(x < a) k[0]++; else if(x < b) k[1]++; else k[2]++; }
        g = [k[0] / n, k[1] / n, k[2] / n];
      } else g = z;
      var p = pgPofG(g);
      if(p < 1e-12) p = 0; if(p > 1 - 1e-12) p = 1;
      rec.p.push(p); rec.g.push(g); rec.n.push(n);
      if(rec.end == null && (p === 0 || p === 1)) rec.end = t;
    }
    var last = rec.p[c.gens];
    rec.fate = rec.extinct != null ? 'extinct' : last === 1 ? 'fixed' : last === 0 ? 'lost' : 'poly';
    return rec;
  }
  function pgSim(c){
    var reps = [], n = Math.max(1, c.reps || 1);
    for(var r = 0; r < n; r++) reps.push(pgRun(c, r));
    var f = { fixed: 0, lost: 0, poly: 0, extinct: 0 };
    reps.forEach(function(x){ f[x.fate]++; });
    return { c: c, reps: reps, fates: f };
  }
  /* Genotype counts against Hardy-Weinberg for one generation of a finite
     population: expected = n·p², n·2pq, n·q² with p from the same counts.
     df = 2 by the goodness-of-fit rule (categories − 1), 1 if you also count
     estimating p (needs-author hw-chi-square-df); both decisions are given. */
  function pgChi(g, n){
    var obs = [Math.round(g[0] * n), Math.round(g[1] * n), Math.round(g[2] * n)];
    var N = obs[0] + obs[1] + obs[2], p = (2 * obs[0] + obs[1]) / (2 * N), q = 1 - p;
    var exp = [N * p * p, N * 2 * p * q, N * q * q];
    if(!(N > 0) || p === 0 || p === 1) return { obs: obs, exp: exp, p: p, n: N, chi2: null };
    var x = chiSquare(obs, exp);
    return { obs: obs, exp: exp, p: p, n: N, terms: x.terms, chi2: x.chi2, crit2: CHI_CRIT['0.05'][2], crit1: CHI_CRIT['0.05'][1],
      reject2: x.chi2 > CHI_CRIT['0.05'][2], reject1: x.chi2 > CHI_CRIT['0.05'][1], small: exp.some(function(e){ return e < 5; }) };
  }
  var popgen = { zygotes: pgZygotes, pool: pgPool, simulate: pgSim, run: pgRun, chi: pgChi };

  /* --------------------------------------------------------- phylogeny */
  /* Trees are Newick strings of taxon ids, e.g. "(lancelet,(lamprey,(shark,frog)))",
     with optional branch lengths "(human:0.6,chimp:0.6):0.2". parse() gives
     nodes { id, name?, len?, kids[], parent, depth, dist, tips[] }; internal
     nodes are numbered 1, 2, ... in the order first drawn (1 = root), and
     keep their number when rotated. Rotating a node (reversing its
     children) changes the drawing, never the tree: key() sorts children, so
     two drawings show the same relationships exactly when their keys match. */
  function phParse(src){
    var s = String(src).replace(/\s+/g, '').replace(/;$/, ''), i = 0;
    function word(re){ var m = re.exec(s.slice(i)); if(!m) return ''; i += m[0].length; return m[0]; }
    function node(){
      var n = { kids: [] };
      if(s[i] === '('){
        i++;
        for(;;){ n.kids.push(node()); if(s[i] === ','){ i++; continue; } break; }
        if(s[i] !== ')') throw new Error('unbalanced parentheses at ' + i);
        i++;
        var lab = word(/^[^(),:;]+/); if(lab) n.name = lab;
      } else {
        n.name = word(/^[^(),:;]+/);
        if(!n.name) throw new Error('missing taxon name at ' + i);
      }
      if(s[i] === ':'){ i++; n.len = +word(/^[-0-9.eE]+/); }
      return n;
    }
    var root = node();
    if(i !== s.length) throw new Error('unexpected text at ' + i);
    var k = 0;
    (function walk(n, parent, depth, dist){
      n.parent = parent; n.depth = depth; n.dist = dist;
      if(n.kids.length) n.id = ++k;
      n.kids.forEach(function(x){ walk(x, n, depth + 1, dist + (x.len || 0)); });
      n.tips = n.kids.length ? [].concat.apply([], n.kids.map(function(x){ return x.tips; })).sort() : [n.name];
    })(root, null, 0, 0);
    return root;
  }
  function phNodes(root){ var out = []; (function w(n){ out.push(n); n.kids.forEach(w); })(root); return out; }
  function phInternal(root){ return phNodes(root).filter(function(n){ return n.kids.length; }); }
  function phLeaves(root){ return phNodes(root).filter(function(n){ return !n.kids.length; }); }
  function phKey(n){ return n.kids.length ? '(' + n.kids.map(phKey).sort().join(',') + ')' : n.name; }
  function phSame(a, b){ return phKey(a) === phKey(b); }
  function phClades(root){ return phInternal(root).map(function(n){ return n.tips.join(','); }).sort(); }
  function phHas(n, names){ return names.every(function(x){ return n.tips.indexOf(x) >= 0; }); }
  function phMrca(root, names){
    var n = root;
    for(;;){ var down = n.kids.filter(function(k){ return phHas(k, names); })[0]; if(!down) return n; n = down; }
  }
  function phFind(root, names){
    var key = names.slice().sort().join(',');
    return phNodes(root).filter(function(n){ return n.tips.join(',') === key; })[0] || null;
  }
  /* A set of tips is a clade (monophyletic) when it is exactly the tips of
     its most recent common ancestor. Otherwise the tips under that ancestor
     that were left out decide the word: if they form one clade, the group is
     the ancestor and all but one branch of its descendants (paraphyletic);
     if not, it pulls together tips from separate branches (polyphyletic).
     (needs-author tree-group-words) */
  function phClassify(root, names){
    var m = phMrca(root, names), missing = m.tips.filter(function(x){ return names.indexOf(x) < 0; });
    if(!missing.length) return { kind: 'clade', mrca: m, missing: [] };
    return { kind: phFind(root, missing) ? 'paraphyletic' : 'polyphyletic', mrca: m, missing: missing };
  }
  function phSisters(n){ return n.parent ? n.parent.kids.filter(function(k){ return k !== n; }) : []; }
  function phRotate(n){ n.kids.reverse(); return n; }
  function phDistance(root, a, b){
    var A = phFind(root, [a]), B = phFind(root, [b]), m = phMrca(root, [a, b]);
    return A.dist + B.dist - 2 * m.dist;
  }
  /* A tree from a character table: chars [{ id, has: [taxa with the derived
     state] }]. Each shared derived character marks one clade; a character's
     clade sits inside another's when its taxa are a subset. Two characters
     whose taxa overlap without nesting conflict (no single tree fits both).
     Characters held by one taxon or by none mark no clade. Returns
     { tree (Newick), conflicts: [[id, id]] }. */
  function phFromCharacters(taxa, chars){
    var sets = [], conflicts = [];
    chars.forEach(function(ch){
      var s = ch.has.slice().sort();
      if(s.length < 2 || s.length >= taxa.length) return;
      if(!sets.some(function(x){ return x.join(',') === s.join(','); })) sets.push(s);
    });
    chars.forEach(function(a, i){ chars.slice(i + 1).forEach(function(b){
      var both = a.has.filter(function(x){ return b.has.indexOf(x) >= 0; }).length;
      if(both && both < a.has.length && both < b.has.length) conflicts.push([a.id, b.id]);
    }); });
    var all = taxa.slice().sort();
    sets.push(all);
    sets.sort(function(a, b){ return b.length - a.length; });
    var kids = new Map(sets.map(function(s){ return [s, []]; }));
    sets.forEach(function(s){ if(s !== all){ var up = sets.filter(function(o){ return o.length > s.length && s.every(function(x){ return o.indexOf(x) >= 0; }); }).sort(function(a, b){ return a.length - b.length; })[0]; kids.get(up).push(s); } });
    all.forEach(function(t){ var up = sets.filter(function(o){ return o.indexOf(t) >= 0; }).sort(function(a, b){ return a.length - b.length; })[0]; kids.get(up).push(t); });
    function nw(s){ return typeof s === 'string' ? s : '(' + kids.get(s).map(nw).join(',') + ')'; }
    return { tree: nw(all), conflicts: conflicts };
  }
  var phylo = { parse: phParse, nodes: phNodes, internal: phInternal, leaves: phLeaves, key: phKey, same: phSame, clades: phClades,
    mrca: phMrca, find: phFind, classify: phClassify, sisters: phSisters, rotate: phRotate, distance: phDistance, fromCharacters: phFromCharacters };

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
    CHI_CRIT: CHI_CRIT, chiSquare: chiSquare, chiPdf: chiPdf, apportion: apportion, kelvin: kelvin, psiS: psiS, hwCounts: hwCounts, hwRecessive: hwRecessive,
    simpson: simpson, rng: rng, enzyme: enzyme, osmosis: osmosis, signal: signal, cellCycle: cellCycle, meiosis: meiosis, operon: operon, popgen: popgen, phylo: phylo, graph: graph
  };

  /* ===== Unit 8 models (population growth, energy flow): begin =====
     Kept in one block, exported below, so other units' additions merge
     cleanly. */

  /* ------------------------------------------------ population growth */
  /* The formula sheet's forms: exponential dN/dt = r_max·N; logistic
     dN/dt = r_max·N·(K − N)/K. Time runs in steps of Δt (Euler's method):
     dN/dt is worked out from N at the start of a step and
     N(t + Δt) = N(t) + (dN/dt)·Δt. N is a real number (the expected size).
     A density-independent event at time t removes the same fraction f of
     the population whatever its size (N → N·(1 − f)), applied at the first
     step at or after t; a change in K applies from its time on. Stops at
     tEnd, or once N passes nMax. No randomness. */
  function popRate(model, r, K, N){ return model === 'exp' ? r * N : r * N * (K - N) / K; }
  function popPerCap(model, r, K, N){ return model === 'exp' ? r : r * (K - N) / K; }
  function popSim(c){
    var dt = c.dt, steps = Math.round(c.tEnd / dt), N = c.N0, K = c.K, out = [], nMax = c.nMax || 1e6, stopped = null;
    var evs = (c.disasters || []).map(function(e){ return { t: e.t, f: e.f, done: false }; });
    var kc = c.kChange ? { t: c.kChange.t, K: c.kChange.K, done: false } : null;
    for(var i = 0; i <= steps; i++){
      var t = round(i * dt, 6), pre = null, hit = [];
      if(kc && !kc.done && t >= kc.t - 1e-9){ K = kc.K; kc.done = true; }
      evs.forEach(function(e){ if(!e.done && t >= e.t - 1e-9){ if(pre === null) pre = N; N = N * (1 - e.f); e.done = true; hit.push(e.f); } });
      var g = popRate(c.model, c.r, K, N);
      out.push({ t: t, N: N, K: K, dNdt: g, perCap: popPerCap(c.model, c.r, K, N), pre: pre, hit: hit });
      if(N > nMax){ stopped = t; break; }
      N = Math.max(0, N + g * dt);
    }
    return { points: out, stopped: stopped };
  }
  function popAt(sim, t){
    var ps = sim.points, best = ps[0];
    for(var i = 0; i < ps.length; i++){ if(ps[i].t <= t + 1e-9) best = ps[i]; else break; }
    return best;
  }
  var population = { simulate: popSim, at: popAt, rate: popRate, perCap: popPerCap,
    peak: function(r, K){ return { N: K / 2, dNdt: r * K / 4 }; } };

  /* ------------------------------------------------------- energy flow */
  /* Energy in kcal/m²/yr through a food chain of c.levels trophic levels
     (producers = level 0). Producers: GPP; their respiration (heat) is
     prodResp·GPP; NPP = GPP − respiration is the energy stored in new
     producer tissue, the base of the energy pyramid. Each consumer level
     stores eff × the level below's stored energy (eff = the fraction passed
     on, the "10% rule"). To store P a consumer level must take in (eat and
     absorb) A = P / (1 − resp), because a share resp of what it absorbs is
     used in cellular respiration and leaves as heat. The rest of the level
     below's stored energy (not eaten, or eaten but not absorbed) goes to
     decomposers, and so does all of the top level's. So
     GPP = Σ heat + Σ to decomposers. Biomass (g/m², dry) = stored energy /
     kcalPerG / pb, where pb is the level's production-to-biomass ratio
     (how many times a year its biomass is replaced). A persistent toxin:
     a consumer keeps a share retain of the toxin in the food it absorbs and
     builds P / kcalPerG grams of tissue from A / kcalPerG grams of food, so
     its concentration is retain × A / P = retain / (1 − resp) times its
     food's. No randomness. */
  function energySim(c){
    var n = c.levels, lv = [], kg = c.kcalPerG || 4;
    if(c.resp > 1 - c.eff + 1e-9) throw new Error('resp must be at most 1 − eff (a level cannot absorb more than the level below stores)');
    for(var i = 0; i < n; i++){
      var L = { i: i };
      if(i === 0){ L.inE = c.gpp; L.heat = c.gpp * c.prodResp; L.stored = c.gpp - L.heat; L.conc = c.c0 == null ? 0 : c.c0; }
      else {
        var below = lv[i - 1];
        L.stored = c.eff * below.stored; L.inE = L.stored / (1 - c.resp); L.heat = L.inE - L.stored;
        below.passed = L.inE; below.decomp = below.stored - L.inE; below.onward = L.stored;
        L.conc = below.conc * (c.retain == null ? 1 : c.retain) * L.inE / L.stored;
      }
      L.biomass = L.stored / kg / c.pb[i];
      lv.push(L);
    }
    var top = lv[n - 1]; top.passed = 0; top.decomp = top.stored; top.onward = 0;
    var heat = 0, decomp = 0;
    lv.forEach(function(L){ heat += L.heat; decomp += L.decomp; });
    return { levels: lv, gpp: c.gpp, npp: lv[0].stored, heat: heat, decomp: decomp, topShare: top.stored / lv[0].stored,
      factor: (c.retain == null ? 1 : c.retain) / (1 - c.resp) };
  }
  var energyFlow = { simulate: energySim };

  root.ApBioMath.population = population;
  root.ApBioMath.energyFlow = energyFlow;
  /* ===== Unit 8 models: end ===== */
})(typeof window !== 'undefined' ? window : globalThis);
