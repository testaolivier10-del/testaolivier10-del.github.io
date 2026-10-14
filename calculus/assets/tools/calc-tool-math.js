/* AP® Calculus AB tool math, the shared part: window.ApCalcMath. Pure
   functions, no DOM, so the validators (scripts/lib/apcalc-tool-checks/
   _shared.mjs) and the node tests recompute every number with the code
   students run (docs/apcalc-architecture.md, "Tools"). Needs ApCalcExpr
   (calc-expr.js), loaded before it on every tool page.

   This file holds ONLY what every trainer shares. Each trainer's model lives
   in its own file, calculus/assets/tools/math/<slug>.js, which registers
   ApCalcMath.<camelSlug> (tangent-tracer -> ApCalcMath.tangentTracer), so
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
                                   factor of 2, missing pi, degrees vs radians,
                                   not to three decimal places
   Expressions (ApCalcExpr underneath)
     parse(str, opts), fn(str, vars?), toTex(tree), read(str, opts)
     compare(student, key, opts), gradeExpr(item, typed)
     exprCell(answer, opts)        a drill step that takes an expression:
                                   { expr: { answer, vars, domain, mode, mistakes } }
     diagnoseExpr(cell, typed)     { ok, why?, error? } through ApCalcExpr.grade
   Calculus numerics
     deriv(f, x, h?)               central difference (h scaled to x)
     deriv2(f, x, h?)              second derivative
     integral(f, a, b, tol?)       adaptive Simpson; a > b gives the negative
     riemann(f, a, b, n, kind)     'left' | 'right' | 'mid' | 'trap' on n equal widths
     riemannTable(xs, ys, kind)    the same on a table (unequal widths allowed)
     root(f, a, b, tol?)           a zero in [a, b] by bisection (needs a sign change)
     roots(f, a, b, n?)            every zero found by scanning n pieces
     extrema(f, a, b)              { min: [x, y], max: [x, y], critical: [x...] } on [a, b]
   Registration
     register(name, model), camel(slug) */
(function(G){
  'use strict';
  // G is the global object (root() below is the root finder).
  function X(){ return G.ApCalcExpr; }

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
  /* The slips the Chief Reader Reports name (docs/apcalc-research/framework.md,
     section 8), tried after the authored ones. */
  function diagnose(c, x){
    if(typeof x !== 'number' || !isFinite(x)) return { ok: false, blank: true };
    var A = c.answer, r = c.rel, ab = c.abs;
    if(near(x, A, r, ab)) return { ok: true };
    for(var i = 0; i < c.mistakes.length; i++) if(near(x, c.mistakes[i].value, r, ab)) return { ok: false, why: c.mistakes[i].why };
    if(!A) return { ok: false };
    if(near(-x, A, r, ab)) return { ok: false, why: 'The size is right but the sign is wrong. Check the order of a subtraction, or a minus sign from a derivative.' };
    if(near(x / 2, A, r, ab) || near(x * 2, A, r, ab)) return { ok: false, why: 'Off by a factor of 2. Check a ½ (a triangle\'s area, the antiderivative of x) or a doubled term.' };
    if(near(x * Math.PI, A, r, ab) || near(x / Math.PI, A, r, ab)) return { ok: false, why: 'Off by a factor of π. Check for a missing π, as in a volume of revolution.' };
    if(near(x * Math.PI / 180, A, r, ab) || near(x * 180 / Math.PI, A, r, ab)) return { ok: false, why: 'Off by the factor between degrees and radians. Calculus uses radians.' };
    if(Math.abs(x - A) < 0.01) return { ok: false, why: 'Close, but not correct to three decimal places. Round only at the end.' };
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

  /* ---------------------------------------------------- numerics */
  function toF(f, v){ return typeof f === 'function' ? f : X().fn(String(f), v ? [v] : ['x']); }
  function deriv(f, x, h){ f = toF(f); h = h || 1e-5 * Math.max(1, Math.abs(x)); return (f(x + h) - f(x - h)) / (2 * h); }
  function deriv2(f, x, h){ f = toF(f); h = h || 1e-4 * Math.max(1, Math.abs(x)); return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h); }
  function simpson(f, a, b, fa, fm, fb){ return (b - a) / 6 * (fa + 4 * fm + fb); }
  function adapt(f, a, b, fa, fm, fb, whole, tol, depth){
    var m = (a + b) / 2, lm = (a + m) / 2, rm = (m + b) / 2, flm = f(lm), frm = f(rm);
    var left = simpson(f, a, m, fa, flm, fm), right = simpson(f, m, b, fm, frm, fb), d = left + right - whole;
    if(depth <= 0 || Math.abs(d) <= 15 * tol) return left + right + d / 15;
    return adapt(f, a, m, fa, flm, fm, left, tol / 2, depth - 1) + adapt(f, m, b, fm, frm, fb, right, tol / 2, depth - 1);
  }
  function integral(f, a, b, tol){
    f = toF(f);
    if(a === b) return 0;
    if(a > b) return -integral(f, b, a, tol);
    var fa = f(a), fb = f(b), fm = f((a + b) / 2);
    return adapt(f, a, b, fa, fm, fb, simpson(f, a, b, fa, fm, fb), tol || 1e-10, 40);
  }
  function riemann(f, a, b, n, kind){
    f = toF(f);
    var h = (b - a) / n, s = 0;
    for(var i = 0; i < n; i++){
      var x0 = a + i * h, x1 = x0 + h;
      s += kind === 'left' ? f(x0) : kind === 'right' ? f(x1) : kind === 'trap' ? (f(x0) + f(x1)) / 2 : f((x0 + x1) / 2);
    }
    return s * h;
  }
  /* A Riemann or trapezoidal sum from a table, widths as given (they may be
     unequal, as on the exam). 'mid' needs an odd number of points and uses
     every other one as the midpoint of a pair of intervals. */
  function riemannTable(xs, ys, kind){
    var s = 0, i;
    if(kind === 'mid'){
      for(i = 0; i + 2 < xs.length; i += 2) s += (xs[i + 2] - xs[i]) * ys[i + 1];
      return s;
    }
    for(i = 0; i + 1 < xs.length; i++){
      var w = xs[i + 1] - xs[i];
      s += w * (kind === 'left' ? ys[i] : kind === 'right' ? ys[i + 1] : (ys[i] + ys[i + 1]) / 2);
    }
    return s;
  }
  function root(f, a, b, tol){
    f = toF(f);
    var fa = f(a), fb = f(b);
    if(fa === 0) return a;
    if(fb === 0) return b;
    if(!(fa * fb < 0)) return NaN;
    tol = tol || 1e-12;
    for(var k = 0; k < 200 && b - a > tol * Math.max(1, Math.abs(a)); k++){
      var m = (a + b) / 2, fm = f(m);
      if(fm === 0) return m;
      if(fa * fm < 0){ b = m; fb = fm; } else { a = m; fa = fm; }
    }
    return (a + b) / 2;
  }
  function roots(f, a, b, n){
    f = toF(f); n = n || 400;
    var out = [], h = (b - a) / n, x0 = a, f0 = f(a);
    for(var i = 1; i <= n; i++){
      var x1 = a + i * h, f1 = f(x1);
      if(isFinite(f0) && isFinite(f1)){
        if(f0 === 0) out.push(x0);
        else if(f0 * f1 < 0){
          var z = root(f, x0, x1);
          // A sign change across a pole is not a zero.
          if(isFinite(z) && Math.abs(f(z)) < 1e-6 * Math.max(1, Math.abs(f0), Math.abs(f1))) out.push(z);
        }
      }
      x0 = x1; f0 = f1;
    }
    if(isFinite(f0) && f0 === 0 && out[out.length - 1] !== x0) out.push(x0);
    return out;
  }
  /* Global extrema on [a, b] by the candidates test: endpoints and the zeros
     of the numerical derivative. */
  function extrema(f, a, b){
    f = toF(f);
    var crit = roots(function(x){ return deriv(f, x); }, a, b, 600).filter(function(x){ return x > a && x < b; });
    var cand = [a].concat(crit, [b]).map(function(x){ return [x, f(x)]; }).filter(function(p){ return isFinite(p[1]); });
    var min = cand[0], max = cand[0];
    cand.forEach(function(p){ if(p[1] < min[1]) min = p; if(p[1] > max[1]) max = p; });
    return { min: min, max: max, critical: crit };
  }

  var M = {
    round: round, fixed: fixed, sig: sig, fmt: fmt, minus: minus, r3: r3, t3: t3, three: three, rng: rng,
    near: near, cell: cell, diagnose: diagnose,
    parse: function(s, o){ return X().parse(s, o); }, fn: function(s, v){ return X().fn(s, v); }, toTex: function(t){ return X().toTex(t); },
    read: function(s, o){ return X().read(s, o); }, compare: function(a, b, o){ return X().compare(a, b, o); },
    gradeExpr: function(item, typed){ return X().grade(item, typed); }, exprCell: exprCell, diagnoseExpr: diagnoseExpr,
    deriv: deriv, deriv2: deriv2, integral: integral, riemann: riemann, riemannTable: riemannTable, root: root, roots: roots, extrema: extrema,
    register: function(name, model){
      if(!/^[a-z][A-Za-z0-9]*$/.test(name)) throw new Error('ApCalcMath.register: "' + name + '" is not a camelCase name');
      if(Object.prototype.hasOwnProperty.call(M, name)) throw new Error('ApCalcMath.register: "' + name + '" is already registered');
      M[name] = model;
      return model;
    },
    /* "tangent-tracer" -> "tangentTracer": the name a tool's model file registers. */
    camel: function(slug){ return String(slug).replace(/-([a-z0-9])/g, function(_, c){ return c.toUpperCase(); }); }
  };
  G.ApCalcMath = M;
})(typeof window !== 'undefined' ? window : globalThis);
