/* Accumulation model: ApCalcMath.accumulation (docs/apcalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apcalc-tool-checks/accumulation.mjs) and the test
   (scripts/test/apcalc-tool-accumulation.test.mjs) run exactly this code.

   Loaded after calc-expr.js, calc-math.js and calc-tool-math.js, before
   calculus/assets/tools/accumulation.js.

   A graph f "made of lines and semicircles", the exam's favourite, is a list
   of pieces, left to right and joined end to end:
     { k: 'line', x0, y0, x1, y1 }      a segment
     { k: 'semi', x0, x1, s }           a half circle on [x0, x1] (radius
                                         (x1 - x0)/2), above the axis (s = 1)
                                         or below it (s = -1); f = 0 at both ends
   Everything about it is exact (no numerical integration):
     val(P, x)            f(x) (NaN outside the domain)
     area(P, a, b)        the signed area, ∫ from a to b of f (b < a gives
                          the negative), from triangle, trapezoid and circle
                          formulas
     exact(P, a, b)       the same as { p, q }: p + q·π, p and q rational for
                          rational limits (null for a limit inside a semicircle
                          away from its centre)
     slopeSigns(P, x)     { l, r }: the sign of f's slope just left and right of x
     domain(P), knots(P), specials(P) (knots and semicircle centres)
     zeros(P)             [{ x, from: sign, to: sign }]: where f is 0 and its
                          sign on each side (+1, -1, 0)
     inflections(P)       x where f's slope changes sign (g bends the other way)
     pieceText(P, a, b)   the area split into named shapes, for "Why?"
     pi(p, q)             p + qπ as text ("4 − 2π", "3π/4")
   A formula f (any function) uses ApCalcMath.integral and deriv instead.
   Tanks (Unit 8): amount(A0, R, D, t) = A0 + ∫ from 0 to t of (R − D).
   Test yourself
     generate(rng, ctx, type?) -> { ctx, topic, type, text, steps, solution, graph? }
       types: values (g from geometry, limits either way round), behavior
       (increasing, extrema, concavity and inflection of g from f, with the
       reason), derivs (g′ and g″ at points), chain (d/dx of an integral with
       a variable upper limit), netgraph (h from h′ and an initial value;
       its absolute maximum), tank (rate in, rate out, amount). */
(function(G){
  'use strict';
  var M = G.ApCalcMath;
  if(!M) return;
  function tex(s){ return G.ApCalcTex ? G.ApCalcTex.html(s) : s; }
  function I(v){ return '<i>' + v + '</i>'; }

  /* ------------------------------------------------------- the graph */
  function rad(p){ return (p.x1 - p.x0) / 2; }
  function mid(p){ return (p.x0 + p.x1) / 2; }
  function pv(p, x){
    if(p.k === 'line') return p.y0 + (p.y1 - p.y0) * (x - p.x0) / (p.x1 - p.x0);
    var r = rad(p), u = x - mid(p);
    return p.s * Math.sqrt(Math.max(0, r * r - u * u));
  }
  function domain(P){ return [P[0].x0, P[P.length - 1].x1]; }
  function at(P, x){
    for(var i = 0; i < P.length; i++) if(x >= P[i].x0 - 1e-12 && x <= P[i].x1 + 1e-12) return P[i];
    return null;
  }
  function val(P, x){ var p = at(P, x); return p ? pv(p, Math.max(p.x0, Math.min(p.x1, x))) : NaN; }
  /* ∫ from p.x0 to x of piece p */
  function prim(p, x){
    if(p.k === 'line') return (x - p.x0) * (p.y0 + pv(p, x)) / 2;
    var r = rad(p), u = Math.max(-r, Math.min(r, x - mid(p)));
    var Gf = function(v){ return (v * Math.sqrt(Math.max(0, r * r - v * v)) + r * r * Math.asin(Math.max(-1, Math.min(1, v / r)))) / 2; };
    return p.s * (Gf(u) - Gf(-r));
  }
  function area(P, a, b){
    if(a > b) return -area(P, b, a);
    var s = 0;
    P.forEach(function(p){
      var lo = Math.max(a, p.x0), hi = Math.min(b, p.x1);
      if(hi > lo) s += prim(p, hi) - prim(p, lo);
    });
    return s;
  }
  /* Exact p + qπ: lines give a rational p; a semicircle gives ±πr²/2 whole,
     ±πr²/4 to its centre. Null if a limit is not a knot or a centre. */
  // exact at x unless x falls inside a semicircle away from its centre (or off the graph)
  function special(P, x){
    var D = domain(P);
    if(x < D[0] - 1e-9 || x > D[1] + 1e-9) return false;
    return !P.some(function(p){ return p.k === 'semi' && x > p.x0 + 1e-9 && x < p.x1 - 1e-9 && Math.abs(mid(p) - x) > 1e-9; });
  }
  function exact(P, a, b){
    if(!special(P, a) || !special(P, b)) return null;
    if(a > b){ var e = exact(P, b, a); return { p: -e.p, q: -e.q }; }
    var p = 0, q = 0;
    P.forEach(function(pc){
      var lo = Math.max(a, pc.x0), hi = Math.min(b, pc.x1);
      if(!(hi > lo)) return;
      if(pc.k === 'line') p += (hi - lo) * (pv(pc, lo) + pv(pc, hi)) / 2;
      else { var r = rad(pc), quarters = Math.round((hi - lo) / r); q += pc.s * r * r * quarters / 4; }
    });
    return { p: M.round(p, 9), q: M.round(q, 9) };
  }
  function frac(v){
    if(Math.abs(v - Math.round(v)) < 1e-9) return { n: Math.round(v), d: 1 };
    for(var d = 2; d <= 12; d++) if(Math.abs(v * d - Math.round(v * d)) < 1e-9) return { n: Math.round(v * d), d: d };
    return { n: v, d: 1 };
  }
  function ratText(v){ var f = frac(v); return (f.n < 0 ? '−' : '') + Math.abs(f.n) + (f.d > 1 ? '/' + f.d : ''); }
  function piText(q){
    var f = frac(Math.abs(q)), n = f.n === 1 ? '' : String(f.n);
    return n + 'π' + (f.d > 1 ? '/' + f.d : '');
  }
  /* p + qπ as text, the way a student writes it: "4 − 2π", "−π/2", "3 + π". */
  function pi(p, q){
    p = M.round(p, 9); q = M.round(q, 9);
    if(!q) return ratText(p);
    if(!p) return (q < 0 ? '−' : '') + piText(q);
    if(p < 0 && q > 0) return piText(q) + ' − ' + ratText(-p);   // "π − 2", the way it is written
    return ratText(p) + (q < 0 ? ' − ' : ' + ') + piText(q);
  }
  /* p + qπ in the student syntax ("4 - 2pi"), for a key that reads exactly. */
  function piInput(p, q){ return pi(p, q).replace(/−/g, '-').replace(/π/g, 'pi'); }
  function knots(P){ var k = [P[0].x0]; P.forEach(function(p){ k.push(p.x1); }); return k; }
  function specials(P){
    var s = knots(P);
    P.forEach(function(p){ if(p.k === 'semi') s.push(mid(p)); });
    return s.sort(function(a, b){ return a - b; }).filter(function(x, i, a){ return i === 0 || Math.abs(x - a[i - 1]) > 1e-9; });
  }
  function sgn(v){ return Math.abs(v) < 1e-12 ? 0 : v > 0 ? 1 : -1; }
  /* Where f is 0: knots on the axis, semicircle ends, and where a segment
     crosses (the generator keeps those at whole numbers). */
  function zeros(P){
    var D = domain(P), z = [];
    P.forEach(function(p){
      if(p.k === 'line' && p.y0 * p.y1 < 0) z.push(p.x0 + (p.x1 - p.x0) * p.y0 / (p.y0 - p.y1));
    });
    knots(P).forEach(function(x){ if(Math.abs(val(P, x)) < 1e-12) z.push(x); });
    z = z.sort(function(a, b){ return a - b; }).filter(function(x, i, a){ return i === 0 || Math.abs(x - a[i - 1]) > 1e-9; });
    var e = 1e-6;
    return z.map(function(x){ return { x: x, from: x - e < D[0] ? null : sgn(val(P, x - e)), to: x + e > D[1] ? null : sgn(val(P, x + e)) }; });
  }
  /* The sign of f's slope just left and right of x (semicircle ends count
     as steep). g has an inflection point where it changes. */
  function slopeSigns(P, x){
    // a step of 1e-3 stays inside the neighbouring piece (pieces are at least 1 wide)
    var e = 1e-3, D = domain(P);
    var s = function(v){ var h = 1e-5; return sgn(val(P, v + h) - val(P, v - h)); };
    return { l: x - e <= D[0] ? null : s(x - e), r: x + e >= D[1] ? null : s(x + e) };
  }
  function inflections(P){
    return specials(P).filter(function(x){ var s = slopeSigns(P, x); return s.l && s.r && s.l * s.r < 0; });
  }
  /* The area from a to b split into its shapes, signed, for "Why?". */
  function pieceText(P, a, b){
    var lo = Math.min(a, b), hi = Math.max(a, b), parts = [];
    P.forEach(function(p){
      var l = Math.max(lo, p.x0), h = Math.min(hi, p.x1);
      if(!(h > l)) return;
      var v = prim(p, h) - prim(p, l), e = exact(P, l, h);
      var what = p.k === 'semi' ? (Math.abs(h - l - (p.x1 - p.x0)) < 1e-9 ? 'half circle' : 'quarter circle') + (p.s > 0 ? ' above' : ' below') :
        (pv(p, l) * pv(p, h) < 0 ? 'two triangles, one above and one below,' : Math.abs(pv(p, l)) < 1e-12 || Math.abs(pv(p, h)) < 1e-12 ? 'triangle' : pv(p, l) === pv(p, h) ? 'rectangle' : 'trapezoid') + (pv(p, l) * pv(p, h) < 0 ? '' : v >= 0 ? ' above' : ' below');
      parts.push({ from: l, to: h, what: what, value: v, text: e ? pi(e.p, e.q) : M.fmt(v, 4) });
    });
    return parts;
  }

  /* ------------------------------------------------------- formulas */
  function fnArea(f, a, b){ return M.integral(f, a, b, 1e-11); }
  function amount(A0, R, D, t){ return A0 + M.integral(function(s){ return R(s) - D(s); }, 0, t, 1e-11); }

  /* ------------------------------------------------------- drills */
  var SK = { g1: '1.E', g2: '1.E', incr: '3.D', extremum: '3.D', concave: '3.D', inflect: '3.D', gp: '1.D', gpp: '1.D', gp2: '1.D', zero: '1.E', deriv: '1.D', h1: '1.E', h2: '1.E', absmax: '3.D', rate: '2.D', dir: '3.D', total: '1.E', when: '3.D' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '1.E' }; for(var k in o) s[k] = o[k]; return s; }
  function num(key, label, answer, mistakes, o){
    o = o || {};
    var d = o.d != null ? o.d : 3;
    return step(key, label, { kind: 'num', d: d, unit: o.unit, hint: o.hint, cell: M.cell(answer, 1e-6, mistakes || [], d === 3 ? 0.0012 : Math.pow(10, -d) * 0.6) });
  }
  function shuffleIn(r, good, wrong){
    var all = [good].concat(wrong), idx = all.map(function(x, i){ return i; });
    for(var i = idx.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    return { options: idx.map(function(i){ return all[i].o; }), why: idx.map(function(i){ return all[i].w; }), correct: idx.indexOf(0) };
  }
  function choice(key, label, sh){ return step(key, label, { kind: 'choice', options: sh.options, correct: sh.correct, why: sh.why }); }
  var HINT = 'Exact (such as 4 - 2pi) or to three decimal places.';

  /* A random exam-style graph: lines between whole-number points and at
     least one semicircle, f above and below the axis, zeros at whole numbers. */
  function randGraph(r){
    for(var t = 0; t < 400; t++){
      var x = r.pick([-4, -3, -2, 0]), end = x + r.pick([8, 9, 10]), y = r.int(-3, 3), P = [], semis = 0, g = 0;
      while(x < end && g++ < 40){
        var room = end - x;
        if(y === 0 && room >= 2 && r() < (semis ? 0.3 : 0.7)){
          var rr = room >= 4 && r() < 0.45 ? 2 : 1;
          P.push({ k: 'semi', x0: x, x1: x + 2 * rr, s: r.pick([1, -1]) }); x += 2 * rr; semis++; continue;
        }
        var w = Math.min(room, r.pick([1, 2, 2, 3])), y1 = r.int(-3, 3);
        if(!semis && r() < 0.4) y1 = 0;
        if(y1 === y) continue;
        if(y * y1 < 0 && (w * y) % (y - y1) !== 0) continue;
        P.push({ k: 'line', x0: x, y0: y, x1: x + w, y1: y1 }); x += w; y = y1;
      }
      if(x !== end || !semis || P.length > 6 || P.length < 3) continue;
      var D = domain(P), pos = 0, neg = 0;
      for(var i = 0; i <= 200; i++){ var v = val(P, D[0] + (D[1] - D[0]) * i / 200); if(v > 1e-9) pos++; if(v < -1e-9) neg++; }
      if(!pos || !neg) continue;
      if(!zeros(P).some(function(z){ return z.from && z.to && z.from * z.to < 0; })) continue;
      return P;
    }
    return [{ k: 'line', x0: -2, y0: 2, x1: 0, y1: 0 }, { k: 'semi', x0: 0, x1: 4, s: -1 }, { k: 'line', x0: 4, y0: 0, x1: 6, y1: 2 }, { k: 'line', x0: 6, y0: 2, x1: 8, y1: -1 }];
  }
  function graphDesc(P, fn){
    // the graph in words, for screen readers and the Details sheet
    return 'The graph of ' + fn + ' on [' + domain(P).join(', ') + '] is made of ' + P.map(function(p){
      return p.k === 'line' ? 'a segment from (' + p.x0 + ', ' + p.y0 + ') to (' + p.x1 + ', ' + p.y1 + ')' : 'a semicircle ' + (p.s > 0 ? 'above' : 'below') + ' the axis on [' + p.x0 + ', ' + p.x1 + ']';
    }).join(', ') + '.';
  }
  function gIntro(P, ctx, a, fn, g){
    fn = fn || 'f'; g = g || 'g';
    var D = domain(P);
    return tex('<p>The graph of $' + fn + '$ on $' + D[0] + ' \\le x \\le ' + D[1] + '$ is made of line segments and ' + (P.filter(function(p){ return p.k === 'semi'; }).length > 1 ? 'semicircles' : 'a semicircle') + '. Let $$' + g + '(x) = \\int_{' + a + '}^{x} ' + fn + '(t)\\,dt.$$</p>');
  }
  /* the area counted without signs (the slip), from the same shapes */
  function absArea(P, a, b){
    var sg = a > b ? -1 : 1, lo = Math.min(a, b), hi = Math.max(a, b), s = 0;
    P.forEach(function(p){
      var l = Math.max(lo, p.x0), h = Math.min(hi, p.x1);
      if(!(h > l)) return;
      var yl = pv(p, l), yh = pv(p, h);
      if(p.k === 'line' && yl * yh < 0){ var z = l + (h - l) * yl / (yl - yh); s += Math.abs((z - l) * yl / 2) + Math.abs((h - z) * yh / 2); }
      else s += Math.abs(prim(p, h) - prim(p, l));
    });
    return sg * s;
  }
  function fullCircle(P, a, b){ var e = exact(P, a, b); return e ? e.p + 2 * e.q * Math.PI : NaN; }

  function genValues(r, ctx){
    var P = randGraph(r), D = domain(P), S = specials(P);
    var inner = S.filter(function(x){ return x > D[0] && x < D[1]; });
    var a = r() < 0.4 ? D[0] : r.pick(inner);
    var right = S.filter(function(x){ return x > a; }), left = S.filter(function(x){ return x < a; });
    var c1 = r.pick(right.filter(function(x){ return x - a >= 2; }).length ? right.filter(function(x){ return x - a >= 2; }) : right);
    var c2 = left.length ? r.pick(left) : r.pick(right.filter(function(x){ return x !== c1; }));
    function vstep(key, c){
      var e = exact(P, a, c), v = e.p + e.q * Math.PI;
      var ms = [{ value: absArea(P, a, c), why: 'You added every area as positive. Area below the axis counts negative in ∫ f(t) dt.' },
        { value: fullCircle(P, a, c), why: 'A semicircle\'s area is half of πr²: ½πr². A quarter circle is ¼πr².' },
        { value: area(P, D[0], c), why: 'That integral starts at the left end of the graph. g starts at the lower limit ' + a + '.' }];
      if(c < a) ms.unshift({ value: -v, why: 'The upper limit ' + c + ' is less than the lower limit ' + a + ', so g(' + c + ') = −∫ from ' + c + ' to ' + a + ' of f(t) dt: flip the sign of the area.' });
      return { st: num(key, I('g') + '(' + c + ')', v, ms, { hint: HINT }), e: e, c: c, v: v };
    }
    var s1 = vstep('g1', c1), s2 = vstep('g2', c2);
    function sol(s){
      var parts = pieceText(P, a, s.c), sign = s.c < a ? '−' : '';
      return tex((s.c < a ? 'Because ' + s.c + ' &lt; ' + a + ', $g(' + s.c + ') = -\\int_{' + s.c + '}^{' + a + '} f(t)\\,dt$. ' : '$g(' + s.c + ') = \\int_{' + a + '}^{' + s.c + '} f(t)\\,dt$. ') +
        (parts.length ? 'Shapes: ' + parts.map(function(q){ return q.what + ' on [' + q.from + ', ' + q.to + ']: ' + q.text; }).join('; ') + '. ' : '') +
        'So ' + I('g') + '(' + s.c + ') = ' + (sign ? '−(' + pi(-s.e.p, -s.e.q) + ') = ' : '') + pi(s.e.p, s.e.q) + (s.e.q ? ' ≈ ' + M.fmt(s.v, 4) : '') + '.');
    }
    return { type: 'values', topic: 'integral-properties', graph: P, a: a, text: gIntro(P, ctx, a), steps: [s1.st, s2.st],
      solution: [sol(s1), sol(s2), 'Area above the axis adds, area below subtracts, and reversing the limits flips the sign.'] };
  }

  function genBehavior(r, ctx){
    var P, D, Z, sc;
    var ivs = [];
    for(var t = 0; t < 80; t++){
      P = randGraph(r); D = domain(P); Z = zeros(P); sc = Z.filter(function(z){ return z.from && z.to && z.from * z.to < 0; });
      // intervals where f keeps one sign
      var bounds = [D[0]].concat(Z.map(function(z){ return z.x; }).filter(function(x){ return x > D[0] && x < D[1]; }), [D[1]]);
      ivs = []; for(var i = 0; i + 1 < bounds.length; i++){ var m = (bounds[i] + bounds[i + 1]) / 2, s = sgn(val(P, m)); if(s && bounds[i + 1] - bounds[i] >= 1) ivs.push({ p: bounds[i], q: bounds[i + 1], s: s }); }
      if(sc.length && ivs.length) break;
    }
    var a = D[0];
    // (1) increasing or decreasing on an interval where f keeps one sign
    var iv = r.pick(ivs), on = '(' + iv.p + ', ' + iv.q + ')';
    var incr = shuffleIn(r,
      iv.s > 0 ? { o: I('g') + ' is increasing on ' + on + ' because ' + I('f') + '(' + I('x') + ') &gt; 0 there.', w: 'g′(x) = f(x), and f > 0 on ' + on + ', so g increases there.' }
               : { o: I('g') + ' is decreasing on ' + on + ' because ' + I('f') + '(' + I('x') + ') &lt; 0 there.', w: 'g′(x) = f(x), and f < 0 on ' + on + ', so g decreases there.' },
      [iv.s > 0 ? { o: I('g') + ' is decreasing on ' + on + ' because ' + I('f') + '(' + I('x') + ') &lt; 0 there.', w: 'Look at the graph: f is above the axis on ' + on + '.' }
                : { o: I('g') + ' is increasing on ' + on + ' because ' + I('f') + '(' + I('x') + ') &gt; 0 there.', w: 'Look at the graph: f is below the axis on ' + on + '.' },
       { o: I('g') + ' is increasing on ' + on + ' because ' + I('f') + ' is increasing there.', w: 'Whether f rises or falls decides g\'s concavity, not whether g increases. g increases where f = g′ is positive.' },
       { o: I('g') + ' is decreasing on ' + on + ' because ' + I('f') + ' is decreasing there.', w: 'Whether f rises or falls decides g\'s concavity. g decreases where f = g′ is negative.' }]);
    // (2) a relative extremum where f changes sign
    var z = r.pick(sc), isMax = z.from > 0;
    var ext = shuffleIn(r,
      isMax ? { o: 'A relative maximum, because ' + I('f') + ' changes from positive to negative at ' + I('x') + ' = ' + z.x + '.', w: 'g′ = f goes from + to −, so g rises then falls.' }
            : { o: 'A relative minimum, because ' + I('f') + ' changes from negative to positive at ' + I('x') + ' = ' + z.x + '.', w: 'g′ = f goes from − to +, so g falls then rises.' },
      [isMax ? { o: 'A relative minimum, because ' + I('f') + ' changes from negative to positive at ' + I('x') + ' = ' + z.x + '.', w: 'Read the sign of f on each side again: positive before ' + z.x + ', negative after.' }
             : { o: 'A relative maximum, because ' + I('f') + ' changes from positive to negative at ' + I('x') + ' = ' + z.x + '.', w: 'Read the sign of f on each side again: negative before ' + z.x + ', positive after.' },
       { o: 'A point of inflection, because ' + I('f') + '(' + z.x + ') = 0.', w: 'An inflection point of g is where f changes from increasing to decreasing (or back), not where f = 0.' },
       { o: 'Neither: ' + I('f') + '(' + z.x + ') = 0 only gives a horizontal tangent.', w: 'f(' + z.x + ') = 0 and f changes sign there, so g′ changes sign: an extremum.' }]);
    // (3) concavity on a piece where f's slope keeps one sign
    var segs = [];
    P.forEach(function(p){
      if(p.k === 'line' && p.y1 !== p.y0) segs.push({ p: p.x0, q: p.x1, s: sgn(p.y1 - p.y0) });
      if(p.k === 'semi'){ segs.push({ p: p.x0, q: mid(p), s: p.s }); segs.push({ p: mid(p), q: p.x1, s: -p.s }); }
    });
    var sg = r.pick(segs), on2 = '(' + sg.p + ', ' + sg.q + ')', fs = sgn(val(P, (sg.p + sg.q) / 2));
    var conc = shuffleIn(r,
      sg.s > 0 ? { o: 'Concave up, because ' + I('f') + ' is increasing on ' + on2 + '.', w: 'g″ = f′ > 0 there: f = g′ is increasing.' }
               : { o: 'Concave down, because ' + I('f') + ' is decreasing on ' + on2 + '.', w: 'g″ = f′ < 0 there: f = g′ is decreasing.' },
      [sg.s > 0 ? { o: 'Concave down, because ' + I('f') + ' is decreasing on ' + on2 + '.', w: 'Look at the graph: f rises on ' + on2 + '.' }
                : { o: 'Concave up, because ' + I('f') + ' is increasing on ' + on2 + '.', w: 'Look at the graph: f falls on ' + on2 + '.' },
       { o: 'Concave up, because ' + I('f') + '(' + I('x') + ') &gt; 0 on ' + on2 + '.', w: 'The sign of f tells whether g increases. Concavity comes from whether f increases' + (fs > 0 && sg.s > 0 ? ' (here the conclusion is right, but this reason does not earn the point).' : '.') },
       { o: 'Concave down, because ' + I('f') + '(' + I('x') + ') &lt; 0 on ' + on2 + '.', w: 'The sign of f tells whether g increases. Concavity comes from whether f decreases' + (fs < 0 && sg.s < 0 ? ' (here the conclusion is right, but this reason does not earn the point).' : '.') }]);
    var steps = [choice('incr', 'Which statement about ' + I('g') + ' on ' + on + ' is true and justified?', incr),
      choice('extremum', 'What does ' + I('g') + ' have at ' + I('x') + ' = ' + z.x + '?', ext),
      choice('concave', 'On ' + on2 + ', the graph of ' + I('g') + ' is', conc)];
    // (4) an inflection point, when the graph has one and enough look-alikes
    var infl = inflections(P), S = specials(P), Zx = Z.map(function(q){ return q.x; });
    var decoys = S.filter(function(x){ return infl.indexOf(x) < 0 && x > D[0] && x < D[1]; }).concat([D[0], D[1]]).concat(Zx.filter(function(x){ return infl.indexOf(x) < 0; }));
    decoys = decoys.filter(function(x, i, arr){ return arr.indexOf(x) === i; });
    if(infl.length && decoys.length >= 3){
      var ix = r.pick(infl), dd = [];
      while(dd.length < 3){ var c = r.pick(decoys); if(dd.indexOf(c) < 0) dd.push(c); }
      var ss = slopeSigns(P, ix);
      var inf = shuffleIn(r, { o: I('x') + ' = ' + ix, w: 'f changes from ' + (ss.l > 0 ? 'increasing to decreasing' : 'decreasing to increasing') + ' at x = ' + ix + ', so g″ = f′ changes sign there.' },
        dd.map(function(x){ return { o: I('x') + ' = ' + x, w: x === D[0] || x === D[1] ? 'x = ' + x + ' is an endpoint: a point of inflection needs the concavity to change, with the graph on both sides.' : Zx.indexOf(x) > -1 ? 'f(' + x + ') = 0 gives a critical point of g, not an inflection point. Look for where f changes from increasing to decreasing.' : 'f keeps rising (or keeps falling) through x = ' + x + ', so the concavity of g does not change there.' }; }));
      steps.push(choice('inflect', 'Which is the ' + I('x') + '-coordinate of a point of inflection of the graph of ' + I('g') + '?', inf));
    }
    return { type: 'behavior', topic: 'accumulation-behavior', graph: P, a: a, text: gIntro(P, ctx, a), steps: steps,
      solution: ['g′(x) = f(x) (the Fundamental Theorem), so g increases where f > 0 and decreases where f < 0.',
        'g has a relative maximum where f changes from positive to negative, a relative minimum where f changes from negative to positive.',
        'g″(x) = f′(x): g is concave up where f is increasing, concave down where f is decreasing, and has a point of inflection where f changes between the two.' + (infl.length ? ' Here: x = ' + infl.join(', ') + '.' : '')] };
  }

  function genDerivs(r, ctx){
    var P, lines;
    for(var t = 0; t < 50; t++){ P = randGraph(r); lines = P.filter(function(p){ return p.k === 'line' && p.y1 !== p.y0; }); if(lines.length) break; }
    var D = domain(P), S = specials(P), a = r.pick(S.filter(function(x){ return x < D[1] - 1; }));
    var L = r.pick(lines), pts = []; for(var x = L.x0 + 0.5; x < L.x1; x += 0.5) pts.push(x);
    var c1 = r.pick(pts), f1 = val(P, c1), m1 = (L.y1 - L.y0) / (L.x1 - L.x0);
    var semi = P.filter(function(p){ return p.k === 'semi'; })[0], c2 = mid(semi), f2 = semi.s * rad(semi);
    var g1 = area(P, a, c1);
    return { type: 'derivs', topic: 'ftc-accumulation', graph: P, a: a, text: gIntro(P, ctx, a),
      steps: [
        num('gp', I('g') + '′(' + c1 + ')', f1, [{ value: f1 - val(P, a), why: 'The lower limit does not enter g′: d/dx ∫ from a to x of f(t) dt = f(x), not f(x) − f(a).' }, { value: g1, why: 'That is g(' + c1 + '), the area. g′(' + c1 + ') is the height f(' + c1 + ').' }, { value: m1, why: 'That is the slope of f, which is g″. g′(' + c1 + ') = f(' + c1 + ').' }], { hint: 'Read it from the graph.' }),
        num('gpp', I('g') + '″(' + c1 + ')', m1, [{ value: f1, why: 'That is f(' + c1 + ') = g′(' + c1 + '). g″ is the slope of f there.' }]),
        num('gp2', I('g') + '′(' + c2 + ')', f2, [{ value: area(P, a, c2), why: 'That is the area g(' + c2 + '). g′(' + c2 + ') is the height f(' + c2 + '): the top (or bottom) of the semicircle, its radius.' }, { value: f2 - val(P, a), why: 'g′(x) = f(x): the lower limit does not enter.' }])
      ],
      solution: ['By the Fundamental Theorem, g′(x) = f(x), whatever the lower limit: g′(' + c1 + ') = f(' + c1 + ') = ' + M.fmt(f1, 4) + '.',
        'g″(x) = f′(x), the slope of the graph of f. On [' + L.x0 + ', ' + L.x1 + '] f is a segment of slope (' + L.y1 + ' − ' + L.y0 + ')/(' + L.x1 + ' − ' + L.x0 + ') = ' + M.fmt(m1, 4) + ', so g″(' + c1 + ') = ' + M.fmt(m1, 4) + '.',
        'g′(' + c2 + ') = f(' + c2 + ') = ' + M.fmt(f2, 4) + ': the center of the semicircle, one radius ' + (f2 > 0 ? 'above' : 'below') + ' the axis.'] };
  }

  /* d/dx of ∫ from a to u(x) of h(t) dt = h(u(x))·u′(x) */
  var HS = [
    { h: 'sqrt(1 + T^3)', tex: '\\sqrt{1 + t^3}' }, { h: 'cos(T^2)', tex: '\\cos\\left(t^2\\right)' }, { h: 'e^(-T^2)', tex: 'e^{-t^2}' },
    { h: 'ln(1 + T^2)', tex: '\\ln\\left(1 + t^2\\right)' }, { h: 'T*sin(T)', tex: 't\\,\\sin t' }, { h: '1/(1 + T^4)', tex: '\\frac{1}{1 + t^4}' }
  ];
  var US = [
    { u: 'x^2', du: '2x', tex: 'x^2', at: 1 }, { u: '3x', du: '3', tex: '3x', at: 1 }, { u: 'sin(x)', du: 'cos(x)', tex: '\\sin x', at: 0 },
    { u: 'x^3', du: '3x^2', tex: 'x^3', at: 1 }, { u: '2x + 1', du: '2', tex: '2x + 1', at: 0 }, { u: 'sqrt(x)', du: '1/(2sqrt(x))', tex: '\\sqrt{x}', at: 1 }
  ];
  function genChain(r, ctx){
    var H = r.pick(HS), U = r.pick(US), flip = r() < 0.35;
    var sub = function(h, u){ return h.replace(/\(T\)/g, '(' + u + ')').replace(/T/g, /^[a-z]$/.test(u) ? u : '(' + u + ')'); };
    var a = M.fn(U.u)(U.at), hu = sub(H.h, U.u), hx = sub(H.h, 'x');
    var key = (flip ? '-' : '') + hu + '*(' + U.du + ')';
    var F = flip ? '\\int_{' + U.tex + '}^{' + a + '} ' + H.tex + '\\,dt' : '\\int_{' + a + '}^{' + U.tex + '} ' + H.tex + '\\,dt';
    var mist = [{ expr: (flip ? '-' : '') + hu, why: 'The chain rule factor is missing: multiply h(u(x)) by u′(x) = ' + U.du + '.' },
      { expr: (flip ? '-' : '') + hx + '*(' + U.du + ')', why: 'Put the upper limit into h: h(u(x)), not h(x).' }];
    if(flip) mist.push({ expr: hu + '*(' + U.du + ')', why: 'The variable is in the LOWER limit: ∫ from u(x) to ' + a + ' = −∫ from ' + a + ' to u(x), so the derivative has a minus sign.' });
    var hAt = M.fn(H.h.replace(/T/g, 'x'))(a);
    var zeroM = Math.abs(hAt) > 1e-6 ? [{ value: hAt, why: 'That is h(' + a + '). F(' + U.at + ') = ∫ from ' + a + ' to ' + a + ', an integral over no width: 0.' }] : [];
    var ex = U.u === 'sqrt(x)' ? [0.2, 3] : [0.1, 2];
    return { type: 'chain', topic: 'ftc-accumulation', stageText: true, chain: { h: H.h, u: U.u, a: a, flip: flip, at: U.at },
      text: tex('<p>Let $$F(x) = ' + F + '.$$</p>'),
      steps: [
        num('zero', I('F') + '(' + U.at + ')', 0, zeroM, { d: 0, hint: 'Look at the two limits when x = ' + U.at + '.' }),
        step('deriv', I('F') + '′(' + I('x') + ')', { kind: 'expr', lhs: "F'(x) =", cell: M.exprCell(key, { vars: ['x'], domain: ex, mistakes: mist }) })
      ],
      solution: [tex('At $x = ' + U.at + '$ the upper limit is $' + a + '$, the same as the lower one, so $F(' + U.at + ') = 0$.'),
        tex('The Fundamental Theorem with the chain rule: $\\frac{d}{dx}\\int_a^{u(x)} h(t)\\,dt = h(u(x))\\,u\'(x)$. Here $u(x) = ' + U.tex + '$ and $u\'(x) = ' + G.ApCalcExpr.toTex(G.ApCalcExpr.parse(U.du, { vars: ['x'] })) + '$.'),
        tex('$F\'(x) = ' + (flip ? '-' : '') + G.ApCalcExpr.toTex(G.ApCalcExpr.parse(hu, { vars: ['x'] })) + '\\cdot ' + G.ApCalcExpr.toTex(G.ApCalcExpr.parse(U.du, { vars: ['x'] })) + '$' + (flip ? ' (minus, because the variable limit is the lower one).' : '.'))] };
  }

  function genNetGraph(r, ctx){
    var P = randGraph(r), D = domain(P), S = specials(P), inner = S.filter(function(x){ return x > D[0] && x < D[1]; });
    var a = r.pick(inner), k = r.int(-4, 8);
    var right = S.filter(function(x){ return x > a; }), left = S.filter(function(x){ return x < a; });
    var c1 = r.pick(right), c2 = r.pick(left);
    var e1 = exact(P, a, c1), e2 = exact(P, a, c2);
    var h1 = k + e1.p + e1.q * Math.PI, h2 = k + e2.p + e2.q * Math.PI;
    // absolute maximum: endpoints and where h′ = f changes from + to −
    var cand = [D[0], D[1]].concat(zeros(P).filter(function(z){ return z.from > 0 && z.to < 0; }).map(function(z){ return z.x; }));
    var vals = cand.map(function(x){ var e = exact(P, a, x); return { x: x, v: k + e.p + e.q * Math.PI, e: e }; }).sort(function(p, q){ return q.v - p.v; });
    var best = vals[0];
    var amM = [{ value: best.x, why: 'That is where the maximum happens (an x-value). The question asks for the maximum VALUE, h(' + best.x + ').' }];
    if(vals[1] && Math.abs(vals[1].v - best.v) > 1e-6) amM.push({ value: vals[1].v, why: 'h(' + vals[1].x + ') is a candidate, but not the largest. Compare every candidate: the endpoints and where h′ changes from positive to negative.' });
    amM.push({ value: best.v - k, why: 'Add the starting value h(' + a + ') = ' + k + '.' });
    var g = function(c, e, v, key){
      return num(key, I('h') + '(' + c + ')', v, [{ value: v - k, why: 'That is only the change ∫ h′. Add the initial value h(' + a + ') = ' + k + '.' },
        { value: k - (v - k), why: (c < a ? 'Going left from ' + a + ': h(' + c + ') = h(' + a + ') − ∫ from ' + c + ' to ' + a + ' of f. ' : '') + 'Check the sign of the area you added.' },
        { value: k + absArea(P, a, c), why: 'Area below the axis counts negative.' }], { hint: HINT });
    };
    return { type: 'netgraph', topic: 'ftc-definite-integrals', graph: P, a: a, fname: 'h′',
      text: '<p>A function ' + I('h') + ' is differentiable on [' + D[0] + ', ' + D[1] + '] with ' + I('h') + '(' + a + ') = ' + k + '. The graph shown is ' + I('h') + '′, the derivative of ' + I('h') + ', made of line segments and a semicircle.</p>',
      steps: [g(c1, e1, h1, 'h1'), g(c2, e2, h2, 'h2'),
        num('absmax', 'The absolute maximum value of ' + I('h') + ' on [' + D[0] + ', ' + D[1] + ']', best.v, amM, { hint: HINT })],
      solution: [tex('$h(' + c1 + ') = h(' + a + ') + \\int_{' + a + '}^{' + c1 + '} h\'(t)\\,dt = ' + k + ' + (' + pi(e1.p, e1.q) + ') = ' + pi(k + e1.p, e1.q) + '$.'),
        tex('$h(' + c2 + ') = h(' + a + ') - \\int_{' + c2 + '}^{' + a + '} h\'(t)\\,dt = ' + k + ' - (' + pi(-e2.p, -e2.q) + ') = ' + pi(k + e2.p, e2.q) + '$.'),
        'Candidates for the absolute maximum: the endpoints and where h′ changes from positive to negative (x = ' + cand.join(', ') + '). Values: ' + vals.map(function(q){ return 'h(' + q.x + ') = ' + pi(k + q.e.p, q.e.q); }).join('; ') + '. The largest is h(' + best.x + ') = ' + pi(k + best.e.p, best.e.q) + '.'] };
  }

  /* Unit 8: rate in R(t), rate out D(t), amount A(t) = A0 + ∫ (R − D). R − D
     = k(p − t)(t + q) changes sign once, at t = p, so the amount peaks there. */
  function poly(cs, v){ // [c0, c1, c2] -> "c2 t^2 + c1 t + c0"
    var out = [];
    for(var i = cs.length - 1; i >= 0; i--){
      var c = cs[i]; if(!c) continue;
      var mag = Math.abs(c), term = i === 0 ? String(mag) : (mag === 1 ? '' : mag) + v + (i > 1 ? '^' + i : '');
      out.push((out.length ? (c < 0 ? ' - ' : ' + ') : (c < 0 ? '-' : '')) + term);
    }
    return out.join('') || '0';
  }
  function genTank(r, ctx){
    for(var t = 0; t < 200; t++){
      var T = r.pick([4, 5, 6]), p = r.int(2, T - 1), q = r.pick([1, 2]), k = r.pick([1, 2]), m = r.int(1, 4), c = r.int(8, 30);
      // D = R - k(p - t)(t + q) = k t² + (m - k(p - q)) t + (c - kpq)
      var D2 = k, D1 = m - k * (p - q), D0 = c - k * p * q;
      var Rf = function(s){ return c + m * s; }, Df = function(s){ return D2 * s * s + D1 * s + D0; };
      var ok = true; for(var i = 0; i <= 40; i++) if(Df(T * i / 40) <= 0.5) ok = false;
      if(!ok) continue;
      var A0 = r.int(3, 12) * (ctx.initStep || 10);
      var net = function(s){ return k * (-s * s * s / 3 + (p - q) * s * s / 2 + p * q * s); };   // ∫ from 0 to s of (R - D)
      if(A0 + Math.min(net(T), 0) <= 0) continue;
      var t1 = r.pick([0, 1, 2, 3, 4, 5, 6].filter(function(x){ return x <= T && x !== p; }));
      var rate = Rf(t1) - Df(t1), tot = A0 + net(T), u = ctx.unit, ru = ctx.rateUnit, tu = ctx.tUnit;
      var Rs = poly([c, m], 't').replace(/ - /g, ' − '), Ds = poly([D0, D1, D2], 't').replace(/ - /g, ' − ').replace(/^-/, '−');
      var dir = shuffleIn(r,
        rate > 0 ? { o: 'Increasing, because ' + I('R') + '(' + t1 + ') &gt; ' + I('D') + '(' + t1 + ').', w: 'A′(' + t1 + ') = R(' + t1 + ') − D(' + t1 + ') = ' + rate + ' > 0.' }
                 : { o: 'Decreasing, because ' + I('R') + '(' + t1 + ') &lt; ' + I('D') + '(' + t1 + ').', w: 'A′(' + t1 + ') = R(' + t1 + ') − D(' + t1 + ') = ' + rate + ' < 0.' },
        [rate > 0 ? { o: 'Decreasing, because ' + I('R') + '(' + t1 + ') &lt; ' + I('D') + '(' + t1 + ').', w: 'Compute both: R(' + t1 + ') = ' + Rf(t1) + ' and D(' + t1 + ') = ' + Df(t1) + '.' }
                  : { o: 'Increasing, because ' + I('R') + '(' + t1 + ') &gt; ' + I('D') + '(' + t1 + ').', w: 'Compute both: R(' + t1 + ') = ' + Rf(t1) + ' and D(' + t1 + ') = ' + Df(t1) + '.' },
         { o: 'Increasing, because ' + I('R') + '(' + t1 + ') &gt; 0.', w: 'Water also leaves. The amount rises only if more comes in than goes out: compare R with D.' },
         { o: 'Decreasing, because ' + I('D') + ' is increasing.', w: 'How D changes does not decide it. Compare R(' + t1 + ') with D(' + t1 + ') at that moment.' }]);
      var cands = [0, p, T].map(function(s){ return { s: s, v: A0 + net(s) }; });
      var when = shuffleIn(r, { o: I('t') + ' = ' + p + ' ' + tu, w: 'A′ = R − D changes from positive to negative at t = ' + p + '; the candidates test: A(0) = ' + M.fmt(cands[0].v, 5) + ', A(' + p + ') = ' + M.fmt(cands[1].v, 5) + ', A(' + T + ') = ' + M.fmt(cands[2].v, 5) + '.' },
        [{ o: I('t') + ' = 0 ' + tu, w: 'The amount grows at first (R > D), so it is larger just after t = 0.' },
         { o: I('t') + ' = ' + T + ' ' + tu, w: 'After t = ' + p + ' more leaves than comes in, so the amount falls toward t = ' + T + '.' },
         { o: 'When ' + I('R') + ' is greatest, at ' + I('t') + ' = ' + T + ' ' + tu, w: 'The amount is greatest where the NET rate R − D changes from positive to negative, not where R peaks.' }]);
      if(new Set(when.options).size < when.options.length) continue;
      var text = '<p>' + ctx.lead + ' For 0 ≤ ' + I('t') + ' ≤ ' + T + ' ' + tu + ', ' + ctx.inWords + ' at a rate of ' + I('R') + '(' + I('t') + ') = ' + Rs.replace(/t/g, I('t')).replace(/\^2/g, '²') + ' ' + ru + ', and ' + ctx.outWords + ' at a rate of ' + I('D') + '(' + I('t') + ') = ' + Ds.replace(/t/g, I('t')).replace(/\^2/g, '²') + ' ' + ru + '. At ' + I('t') + ' = 0 there are ' + A0 + ' ' + u + ' ' + ctx.where + '.</p>';
      return { type: 'tank', topic: 'accumulation-in-context', text: text, tank: { R: Rs, D: Ds, Rx: poly([c, m], 'x'), Dx: poly([D0, D1, D2], 'x'), A0: A0, T: T, unit: u, rateUnit: ru, tUnit: tu },
        steps: [
          num('rate', 'The rate of change of the amount at ' + I('t') + ' = ' + t1, rate, [{ value: Rf(t1), why: 'That is only the rate in. The amount changes at R − D.' }, { value: -rate, why: 'Subtract the rate out from the rate in: R − D, not D − R.' }], { unit: ru, d: 3 }),
          choice('dir', 'At ' + I('t') + ' = ' + t1 + ', is the amount ' + ctx.where + ' increasing or decreasing?', dir),
          num('total', 'The amount ' + ctx.where + ' at ' + I('t') + ' = ' + T, tot, [{ value: net(T), why: 'That is only the change. Add the ' + A0 + ' ' + u + ' there at t = 0.' }, { value: A0 + M.integral(Rf, 0, T), why: 'That adds everything that came in but ignores what left. Integrate R − D.' }, { value: A0 - net(T), why: 'A(T) = A(0) + ∫ (R − D) dt: add the net change.' }], { unit: u, d: 3, hint: 'Exact, or to three decimal places.' }),
          choice('when', 'When on [0, ' + T + '] is the amount ' + ctx.where + ' greatest?', when)
        ],
        solution: [tex('$A\'(t) = R(t) - D(t)$, so $A\'(' + t1 + ') = ' + Rf(t1) + ' - ' + Df(t1) + ' = ' + rate + '$ ' + ru + '.'),
          tex('$A(' + T + ') = ' + A0 + ' + \\int_0^{' + T + '} \\left(R(t) - D(t)\\right)dt = ' + A0 + ' + \\int_0^{' + T + '} \\left(' + poly([-D0 + c, m - D1, -D2], 't') + '\\right)dt = ' + M.fmt(tot, 6) + '$ ' + u + '.'),
          'R(t) − D(t) = ' + k + '(' + p + ' − t)(t + ' + q + '): positive before t = ' + p + ', negative after. Candidates: A(0) = ' + M.fmt(cands[0].v, 5) + ', A(' + p + ') = ' + M.fmt(cands[1].v, 5) + ', A(' + T + ') = ' + M.fmt(cands[2].v, 5) + '. The greatest is at t = ' + p + '.'] };
    }
    throw new Error('genTank: no tank found');
  }

  /* A real minus sign in the words (not inside rendered math). */
  function minus(h){ return String(h).split(/(<math[\s\S]*?<\/math>)/).map(function(part, i){ return i % 2 ? part : part.replace(/(^|[\s(\[,=:;])-(?=\d)/g, '$1−'); }).join(''); }
  function tidy(p){
    p.text = minus(p.text);
    p.solution = p.solution.map(minus);
    p.steps.forEach(function(s){
      s.label = minus(s.label);
      if(s.options) s.options = s.options.map(function(o){ return '<span class="cd-o">' + minus(o) + '</span>'; });
      if(s.why) s.why = s.why.map(minus);
      if(s.cell && s.cell.mistakes) s.cell.mistakes.forEach(function(m){ m.why = minus(m.why); });
    });
    return p;
  }
  var GEN = { values: genValues, behavior: genBehavior, derivs: genDerivs, chain: genChain, netgraph: genNetGraph, tank: genTank };
  function generate(r, ctx, type){
    var t = type && GEN[type] && (!ctx.types || ctx.types.indexOf(type) > -1) ? type : r.pick(ctx.types || ['values']);
    var p = tidy(GEN[t](r, ctx));
    p.ctx = ctx.id; p.type = t;
    return p;
  }

  M.register('accumulation', {
    val: val, area: area, exact: exact, pi: pi, piInput: piInput, domain: domain, knots: knots, specials: specials,
    zeros: zeros, slopeSigns: slopeSigns, inflections: inflections, pieceText: pieceText, graphDesc: graphDesc,
    fnArea: fnArea, amount: amount, randGraph: randGraph, poly: poly, generate: generate, HS: HS, US: US
  });
})(typeof window !== 'undefined' ? window : globalThis);
