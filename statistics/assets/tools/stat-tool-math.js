/* AP® Statistics tool math, the shared part: window.ApStatMath. Pure
   functions, no DOM, so the validators (scripts/lib/apstat-tool-checks/
   _shared.mjs) and the node tests recompute every number with the code
   students run (docs/apstat-architecture.md, "Tools"). Needs ApStatExpr
   (stat-expr.js), loaded before it on every tool page.

   Forked from AP® Calculus AB's calc-tool-math.js; the calculus numerics
   (derivatives, integrals, Riemann sums, roots) are replaced by samplers
   and simulation helpers. Every probability, interval and test comes from
   ApStatDist (stat-dist.js), loaded before this file on tool pages.

   This file holds ONLY what every trainer shares. Each trainer's model lives
   in its own file, statistics/assets/tools/math/<slug>.js, which registers
   ApStatMath.<camelSlug> (ci-capture -> ApStatMath.ciCapture), so
   tool authors never edit the same file. The generator loads this file,
   then the tool's model file, on the tool's page.

   Numbers
     round(x, d), fixed(x, d)      to d decimals (a number; a string)
     sig(x, n), fmt(x, n)          n significant figures; fmt as text with a real minus
     r3(x), t3(x), three(x, a)     the exam's three-decimal rule: x rounded or
                                   truncated to 3 places matches a's
     rng(seed)                     seeded (mulberry32): r() in [0, 1), r.int(a, b),
                                   r.pick(list), r.between(a, b, n), r.nonzero(a, b)
     near(x, a, rel, abs)
     cell(answer, rel, mistakes, abs)
                                   a numeric drill step; a mistake that would be
                                   graded right is dropped
     diagnose(cell, x)             { ok, why? }: the authored slip, else sign,
                                   complement, one-sided vs two-sided, rounding
   Expressions (ApStatExpr underneath)
     parse(str, opts), fn(str, vars?), toTex(tree), read(str, opts)
     compare(student, key, opts), gradeExpr(item, typed)
     exprCell(answer, opts)        a drill step that takes an expression:
                                   { expr: { answer, vars, domain, mode, mistakes } }
     diagnoseExpr(cell, typed)     { ok, why?, error? } through ApStatExpr.grade
   Sampling and simulation (every draw from a seeded rng, so a drill is
   reproducible and its validator regenerates it)
     normal(r, mu?, sd?)           one normal draw (Box-Muller)
     sample(r, pop, n, replace?)   n values from a list; without replacement by default
     bernoulli(r, p, n)            the count of successes in n trials
     shuffle(r, list)              a copy in random order (random assignment)
     repeat(k, f)                  [f(0), f(1), ... f(k - 1)]: k simulated statistics
     Dist()                        ApStatDist, for the numbers
   Registration
     register(name, model), camel(slug) */
(function(G){
  'use strict';
  // G is the global object (root() below is the root finder).
  function X(){ return G.ApStatExpr; }

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
  function r3(x){ return Math.sign(x) * Math.round(Math.abs(x) * 1000 + 1e-7) / 1000; }
  function t3(x){ return Math.sign(x) * Math.floor(Math.abs(x) * 1000 + 1e-7) / 1000; }
  function three(x, a){
    var ok = [r3(a), t3(a)];
    return [r3(x), t3(x)].some(function(v){ return ok.some(function(w){ return Math.abs(v - w) < 1e-9; }); });
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
  /* The slips the Chief Reader Reports name (docs/apstat-research/framework.md,
     section 8), tried after the authored ones. */
  function diagnose(c, x){
    if(typeof x !== 'number' || !isFinite(x)) return { ok: false, blank: true };
    var A = c.answer, r = c.rel, ab = c.abs;
    if(near(x, A, r, ab)) return { ok: true };
    for(var i = 0; i < c.mistakes.length; i++) if(near(x, c.mistakes[i].value, r, ab)) return { ok: false, why: c.mistakes[i].why };
    if(!A) return { ok: false };
    if(near(-x, A, r, ab)) return { ok: false, why: 'The size is right but the sign is wrong. Check the order of a subtraction: statistic minus the null value.' };
    if(near(1 - x, A, r, ab) && A > 0 && A < 1) return { ok: false, why: 'That is the complement. Check the direction: less than or greater than.' };
    if(near(x / 2, A, r, ab) || near(x * 2, A, r, ab)) return { ok: false, why: 'Off by a factor of 2. Check whether the test is one-sided or two-sided.' };
    if(Math.abs(x - A) < 0.01) return { ok: false, why: 'Close. Keep full precision until the last step, then round.' };
    return { ok: false };
  }

  /* ---------------------------------------------------- expressions */
  function exprCell(answer, opts){
    opts = opts || {};
    var E = { answer: String(answer), vars: opts.vars || ['x'], mode: opts.mode || 'exact' };
    if(opts.domain) E.domain = opts.domain;
    if(opts.mistakes) E.mistakes = opts.mistakes;
    if(opts.needC === false) E.needC = false;
    return { expr: E };
  }
  function diagnoseExpr(c, typed){
    var g = X().grade(c, typed);
    if(!g.valid) return { ok: false, blank: !String(typed || '').trim(), error: g.error };
    return { ok: g.correct, why: g.notes && g.notes[0] };
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
  function sample(r, pop, n, replace){
    if(replace){ var out = []; for(var i = 0; i < n; i++) out.push(pop[Math.floor(r() * pop.length)]); return out; }
    if(n > pop.length) throw new Error('ApStatMath.sample: n is larger than the population');
    return shuffle(r, pop).slice(0, n);
  }
  function bernoulli(r, p, n){ var k = 0; for(var i = 0; i < n; i++) if(r() < p) k++; return k; }
  function repeat(k, f){ var out = []; for(var i = 0; i < k; i++) out.push(f(i)); return out; }

  var M = {
    round: round, fixed: fixed, sig: sig, fmt: fmt, minus: minus, r3: r3, t3: t3, three: three, rng: rng,
    near: near, cell: cell, diagnose: diagnose,
    parse: function(s, o){ return X().parse(s, o); }, fn: function(s, v){ return X().fn(s, v); }, toTex: function(t){ return X().toTex(t); },
    read: function(s, o){ return X().read(s, o); }, compare: function(a, b, o){ return X().compare(a, b, o); },
    gradeExpr: function(item, typed){ return X().grade(item, typed); }, exprCell: exprCell, diagnoseExpr: diagnoseExpr,
    normal: normal, sample: sample, bernoulli: bernoulli, shuffle: shuffle, repeat: repeat,
    Dist: function(){ return G.ApStatDist; },
    register: function(name, model){
      if(!/^[a-z][A-Za-z0-9]*$/.test(name)) throw new Error('ApStatMath.register: "' + name + '" is not a camelCase name');
      if(Object.prototype.hasOwnProperty.call(M, name)) throw new Error('ApStatMath.register: "' + name + '" is already registered');
      M[name] = model;
      return model;
    },
    /* "ci-capture" -> "ciCapture": the name a tool's model file registers. */
    camel: function(slug){ return String(slug).replace(/-([a-z0-9])/g, function(_, c){ return c.toUpperCase(); }); }
  };
  G.ApStatMath = M;
})(typeof window !== 'undefined' ? window : globalThis);
