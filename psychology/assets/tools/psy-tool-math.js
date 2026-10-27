/* AP® Psychology tool math, the shared part: window.ApPsychMath. Pure
   functions, no DOM, so the validators (scripts/lib/appsych-tool-checks/
   _shared.mjs) and the node tests recompute every number with the code
   students run (docs/appsych-architecture.md, "Tools"). Needs ApPsychExpr
   (psy-expr.js), ApPsychCalc (psy-calc.js) and ApPsychGrade (psy-grade.js),
   loaded before it on every tool page.

   Forked from AP® Statistics' stat-tool-math.js; the distributions are
   replaced by ApPsychCalc, the calculation recipes (every number a drill
   shows comes from it), and numeric cells may carry a unit graded by
   ApPsychGrade.

   This file holds ONLY what every trainer shares. Each trainer's model lives
   in its own file, psychology/assets/tools/math/<slug>.js, which
   registers ApPsychMath.<camelSlug> (energy-flow -> ApPsychMath.energyFlow), so
   tool builders never edit the same file. The generator loads this file,
   then the tool's model file, on the tool's page.

   Numbers
     round(x, d), fixed(x, d)      to d decimals (a number; a string)
     sig(x, n), fmt(x, n)          n significant figures; fmt as text with a real minus
     rng(seed)                     seeded (mulberry32): r() in [0, 1), r.int(a, b),
                                   r.pick(list), r.between(a, b, n), r.nonzero(a, b)
     near(x, a, rel, abs)
     cell(answer, rel, mistakes, abs)
                                   a numeric drill step; a mistake that would be
                                   graded right is dropped
     diagnose(cell, x)             { ok, why? }: the authored slip, else the
                                   slips the readers name: forgot x 100, a
                                   factor of 1000, the sign, rounding
     unitCell(answer, unit, opts)  a step graded by ApPsychGrade.numeric: value
                                   and unit apart, scale words read
     diagnoseUnit(cell, typed)     { ok, value, unit, why? }
   Expressions (ApPsychExpr underneath)
     read(str, opts), evaluate(str, bind, units)
     setupCell(answer, opts)       a step that takes a typed setup, graded by
                                   ApPsychExpr.gradeSetup (brackets, units, x 100)
     diagnoseSetup(cell, typed)    { ok, valueOk, why?, error? }
   Simulation (every draw from a seeded rng, so a drill is reproducible and
   its validator regenerates it)
     normal(r, mu?, sd?), shuffle(r, list), repeat(k, f)
     Calc()                        ApPsychCalc, for the numbers
   Registration
     register(name, model), camel(slug) */
(function(G){
  'use strict';
  // G is the global object (root() below is the root finder).
  function X(){ return G.ApPsychExpr; }
  function GR(){ return G.ApPsychGrade; }

  function round(x, d){ var k = Math.pow(10, d || 0); return Math.round((x + (x >= 0 ? 1e-12 : -1e-12)) * k) / k; }
  function fixed(x, d){ var r = round(x, d); if(Object.is(r, -0) || r === 0) r = 0; return r.toFixed(d); }
  function sig(x, n){ if(!x) return 0; return Number(Number(x).toPrecision(n)); }
  function minus(s){ return String(s).replace(/^-/, '−'); }
  function fmt(x, n){
    n = n || 3;
    if(!isFinite(x)) return String(x);
    if(x === 0) return '0';
    var v = sig(x, n), e = Math.floor(Math.log10(Math.abs(v)) + 1e-12);
    if(e < -3 || e >= 6) return minus(v.toExponential(n - 1));
    return minus(String(+v.toFixed(Math.max(0, n - 1 - e))));
  }
  /* mulberry32: the same numbers for the same seed, on every device. */
  function rng(seed){
    var s = (seed >>> 0) || 1;
    function next(){ s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    next.int = function(a, b){ return a + Math.floor(next() * (b - a + 1)); };
    next.pick = function(a){ return a[Math.floor(next() * a.length)]; };
    next.between = function(a, b, n){ return sig(a + next() * (b - a), n || 2); };
    next.nonzero = function(a, b){ var v = 0, guard = 0; while(v === 0 && guard++ < 50) v = next.int(a, b); return v || 1; };
    return next;
  }

  function near(x, a, rel, abs){ return Math.abs(x - a) <= (rel || 0) * Math.abs(a) + (abs || 0) + 1e-12 * Math.abs(a) + 1e-300; }
  function cell(answer, rel, mistakes, abs){
    var seen = [];
    var ms = (mistakes || []).filter(function(m){
      if(!isFinite(m.value) || near(m.value, answer, 2.5 * rel, 2.5 * (abs || 0))) return false;
      if(seen.some(function(v){ return near(m.value, v, 2 * rel, 2 * (abs || 0)); })) return false;
      seen.push(m.value); return true;
    });
    var c = { answer: answer, rel: rel, mistakes: ms };
    if(abs) c.abs = abs;
    return c;
  }
  /* The slips the Chief Reader Reports name (docs/appsych-research/framework.md,
     section 6), tried after the authored ones. */
  function diagnose(c, x){
    if(typeof x !== 'number' || !isFinite(x)) return { ok: false, blank: true };
    var A = c.answer, r = c.rel, ab = c.abs;
    if(near(x, A, r, ab)) return { ok: true };
    for(var i = 0; i < c.mistakes.length; i++) if(near(x, c.mistakes[i].value, r, ab)) return { ok: false, why: c.mistakes[i].why };
    if(!A) return { ok: false };
    if(near(x * 100, A, r, ab)) return { ok: false, why: 'Your number is 100 times too small. A percent is the fraction times 100.' };
    if(near(x / 100, A, r, ab)) return { ok: false, why: 'Your number is 100 times too large. Multiply by 100 only once.' };
    if(near(x / 1000, A, r, ab) || near(x * 1000, A, r, ab)) return { ok: false, why: 'Off by a factor of 1000. Check a metric prefix (k, M, m) or "thousand".' };
    if(near(-x, A, r, ab)) return { ok: false, why: 'The size is right but the sign is wrong. Check the order of the subtraction (new minus old).' };
    if(near(x, A, Math.max(10 * r, 0.02), 10 * (ab || 0))) return { ok: false, why: 'Close. Keep every digit until the last step, then round.' };
    return { ok: false };
  }

  /* ---------------------------------------------------- units and setups */
  function unitCell(answer, unit, opts){
    opts = opts || {};
    var N = { answer: answer, unit: unit };
    ['units', 'places', 'tol', 'rel', 'mistakes', 'askUnit'].forEach(function(k){ if(opts[k] != null) N[k] = opts[k]; });
    return { numeric: N };
  }
  function diagnoseUnit(c, typed){
    var g = GR().numeric(c.numeric, typed);
    if(!g.valid) return { ok: false, blank: !String(typed && typed.value != null ? typed.value : typed || '').trim(), why: g.notes[0] };
    return { ok: g.correct, value: g.parts.value, unit: g.parts.unit, why: g.notes.join(' ') || undefined };
  }
  function setupCell(answer, opts){
    opts = opts || {};
    var S = { answer: String(answer) };
    ['bind', 'units', 'unit', 'mustUse', 'mustNotUse', 'parens', 'times100', 'requireUnits', 'mistakes', 'tol'].forEach(function(k){ if(opts[k] != null) S[k] = opts[k]; });
    return { setup: S };
  }
  function diagnoseSetup(c, typed){
    var g = X().gradeSetup(c, typed);
    if(!g.valid) return { ok: false, blank: !String(typed || '').trim(), error: g.error };
    return { ok: g.correct, valueOk: g.valueOk, why: g.notes && g.notes[0] };
  }

  /* ---------------------------------------------------- sampling */
  function normal(r, mu, sd){
    var u = 0, v = 0;
    while(u === 0) u = r();
    while(v === 0) v = r();
    return (mu || 0) + (sd == null ? 1 : sd) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function shuffle(r, list){
    var a = list.slice();
    for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function repeat(k, f){ var out = []; for(var i = 0; i < k; i++) out.push(f(i)); return out; }

  var M = {
    round: round, fixed: fixed, sig: sig, fmt: fmt, minus: minus, rng: rng,
    near: near, cell: cell, diagnose: diagnose, unitCell: unitCell, diagnoseUnit: diagnoseUnit, setupCell: setupCell, diagnoseSetup: diagnoseSetup,
    read: function(s, o){ return X().read(s, o); }, evaluate: function(s, b, u){ return X().evaluate(s, b, u); }, toTex: function(t){ return X().toTex(t); },
    normal: normal, shuffle: shuffle, repeat: repeat,
    Calc: function(){ return G.ApPsychCalc; },
    register: function(name, model){
      if(!/^[a-z][A-Za-z0-9]*$/.test(name)) throw new Error('ApPsychMath.register: "' + name + '" is not a camelCase name');
      if(Object.prototype.hasOwnProperty.call(M, name)) throw new Error('ApPsychMath.register: "' + name + '" is already registered');
      M[name] = model;
      return model;
    },
    /* "energy-flow" -> "energyFlow": the name a tool's model file registers. */
    camel: function(slug){ return String(slug).replace(/-([a-z0-9])/g, function(_, c){ return c.toUpperCase(); }); }
  };
  G.ApPsychMath = M;
})(typeof window !== 'undefined' ? window : globalThis);
