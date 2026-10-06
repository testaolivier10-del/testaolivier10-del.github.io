/* AP® Chemistry tool math: window.ApChemMath. Pure functions, no DOM, so the
   validators (scripts/lib/apchem-tool-checks/_shared.mjs) recompute every
   authored number with the same code students run (as ApBioMath does for
   AP® Biology; docs/apchem-architecture.md, "Tools").

   Constants are the equations and constants sheet's values (2024 edition),
   so a seeded drill and the exam agree to the digit:
     R = 8.314 J/(mol·K) = 0.08206 L·atm/(mol·K), F = 96,485 C/mol e⁻,
     h = 6.626 × 10⁻³⁴ J·s, c = 2.998 × 10⁸ m/s, NA = 6.022 × 10²³ mol⁻¹,
     Kw = 1.0 × 10⁻¹⁴ at 25 °C, K = °C + 273.15.

   Phase 0 holds the shared pieces the trainers and drills will need; each
   drill adds its own model here, with tests, when it is built. */
(function(){
  var C = {
    R_J: 8.314, R_LATM: 0.08206, F: 96485, h: 6.626e-34, c: 2.998e8, NA: 6.022e23, Kw: 1.0e-14, T0: 273.15
  };

  /* Rounding. round(x, d) to d decimals; fixed() as a string; sig(x, n) to n
     significant figures (the number, not a string). */
  function round(x, d){ var k = Math.pow(10, d || 0); return Math.round((x + (x >= 0 ? 1e-12 : -1e-12)) * k) / k; }
  function fixed(x, d){ var r = round(x, d); if(Object.is(r, -0) || r === 0) r = 0; return r.toFixed(d); }
  function sig(x, n){ if(!x) return 0; return Number(Number(x).toPrecision(n)); }

  /* A seeded random source (mulberry32), so a drill's numbers come back the
     same for the same seed: rng(seed)() in [0, 1); .int(a, b); .pick(list). */
  function rng(seed){
    var s = (seed >>> 0) || 1;
    function next(){ s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    next.int = function(a, b){ return a + Math.floor(next() * (b - a + 1)); };
    next.pick = function(a){ return a[Math.floor(next() * a.length)]; };
    return next;
  }

  /* Acids and bases at 25 °C. */
  function pH(h){ return -Math.log10(h); }
  function hFromPH(p){ return Math.pow(10, -p); }
  /* A weak acid HA at concentration c with Ka: [H3O+] solved exactly from
     x² / (c − x) = Ka (no small-x approximation), and the approximation for
     comparison. */
  function weakAcid(c, Ka){
    var x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / 2;
    return { h: x, pH: pH(x), approx: Math.sqrt(Ka * c), percent: 100 * x / c };
  }
  /* Henderson-Hasselbalch: pH = pKa + log([A−]/[HA]) (base-10 log). */
  function hh(pKa, base, acid){ return pKa + Math.log10(base / acid); }

  /* Free energy, equilibrium and cell potential (consistent units: J, K). */
  function dG(dH_kJ, T, dS_J){ return dH_kJ - T * dS_J / 1000; }           // kJ/mol
  function KfromDG(dG_kJ, T){ return Math.exp(-dG_kJ * 1000 / (C.R_J * T)); }
  function dGfromE(n, E){ return -n * C.F * E / 1000; }                      // kJ/mol

  window.ApChemMath = {
    C: C, round: round, fixed: fixed, sig: sig, rng: rng,
    pH: pH, hFromPH: hFromPH, weakAcid: weakAcid, hh: hh,
    dG: dG, KfromDG: KfromDG, dGfromE: dGfromE
  };
})();
