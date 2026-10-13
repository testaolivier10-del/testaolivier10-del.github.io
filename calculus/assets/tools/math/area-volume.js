/* Area and volume model: ApCalcMath.areaVolume (docs/apcalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apcalc-tool-checks/area-volume.mjs) and the test
   (scripts/test/apcalc-tool-area-volume.test.mjs) run exactly this code.

   AB only (CED Unit 8, 8.4-8.12): area between curves in x or in y (split
   where they cross), volumes with square, equilateral-triangle and
   semicircle cross sections, discs and washers about the axes and about
   other horizontal and vertical lines. No shells (not in the CED), no arc
   length (BC).

   Explore
     REGIONS                 the gallery: { id, name, v: 'x' | 'y', f, g (top and
                             bottom, or right and left, as student-syntax strings),
                             span (where to look for crossings), view, axes }
     region(id)              one entry, compiled: { ..., F, Gf, a, b, cuts }
     cuts(F, G, lo, hi)      the crossings of F and G in [lo, hi] (numerically)
     area(reg)               { total, net, pieces: [{ a, b, top: 'f'|'g', value }] }
     radii(reg, axis, u)     { R, r } at u from the axis { dir: 'h'|'v', at }
     axisOk(reg, axis)       the axis does not cut through the region
     volume(reg, setup)      the solid's volume: setup { kind: 'rev' | 'cross',
                             axis, shape: 'square'|'tri'|'semi' }
     sectionArea(shape, s)   s², (√3/4)s², (π/8)s²
     mesh(reg, setup, n, m)  the solid as quads in 3D, for the page's renderer:
                             { quads: [{ p: [[X,Y,Z] x4], t }], box }
     slice(reg, setup, u, m) the slice at u: { loops: [[[X,Y,Z]...]], R, r, s, ... }
   Test yourself
     generate(rng, ctx, type) -> { ctx, topic, type, text, steps, solution, fig }
       types: areaX, areaY, areaCross, crossSq, crossTri, discAxes, discOther,
       washerAxes, washerOther */
(function(G){
  'use strict';
  var M = G.ApCalcMath;
  if(!M) return;
  function H(s){ var t = G.ApCalcTex; return t ? t.html(s) : s; }
  var PI = Math.PI, SQ3 = Math.sqrt(3);

  /* ---------------------------------------------------- numbers as TeX */
  function fracOf(v){
    if(Math.abs(v - Math.round(v)) < 1e-9) return { n: Math.round(v), d: 1 };
    for(var d = 2; d <= 60; d++) if(Math.abs(v * d - Math.round(v * d)) < 1e-7) return { n: Math.round(v * d), d: d };
    return null;
  }
  function tn(v){
    var f = fracOf(v);
    if(f && f.d === 1) return String(f.n);
    if(f) return (f.n < 0 ? '-' : '') + '\\frac{' + Math.abs(f.n) + '}{' + f.d + '}';
    return String(+v.toFixed(3));
  }
  function tp(v){ var s = tn(v); return v < 0 ? '{' + s + '}' : s; } // a negative number grouped, so its minus reads as a sign
  function dn(v, d){ var s = (+v).toFixed(d == null ? 3 : d); return s === '-0.000' ? '0.000' : s; }
  // exact multiples of pi: "\frac{3\pi}{10}"
  function piTex(v){
    var f = fracOf(v / PI);
    if(!f) return null;
    var n = Math.abs(f.n), s = f.n < 0 ? '-' : '';
    if(f.d === 1) return s + (n === 1 ? '' : n) + '\\pi';
    return s + '\\frac{' + (n === 1 ? '' : n) + '\\pi}{' + f.d + '}';
  }
  function exactTex(v){ var f = fracOf(v); if(f && f.d <= 60) return tn(v); var p = piTex(v); return p; }

  /* -------------------------------------------------------- the gallery */
  var REGIONS = [
    { id: 'sqrt-sq', name: '√x and x²', v: 'x', f: 'sqrt(x)', g: 'x^2', ftex: '\\sqrt{x}', gtex: 'x^2', span: [0, 1.5],
      alt: { f: 'y^2', g: 'sqrt(y)', ftex: 'y^2', gtex: '\\sqrt{y}', span: [0, 1.5] }, view: { x: [-0.6, 1.6], y: [-0.6, 1.6] } },
    { id: 'under-sqrt', name: 'Under √x', v: 'x', f: 'sqrt(x)', g: '0', ftex: '\\sqrt{x}', gtex: '0', ends: [0, 4],
      alt: { f: 'y^2', g: '4', ftex: 'y^2', gtex: '4', ends: [0, 2] }, view: { x: [-1, 5], y: [-1, 3] } },
    { id: 'para-line', name: '4 − x² and x + 2', v: 'x', f: '4 - x^2', g: 'x + 2', ftex: '4 - x^2', gtex: 'x + 2', span: [-3, 2], view: { x: [-3, 2], y: [-1, 5] } },
    { id: 'cubic', name: 'x³ − 3x and x', v: 'x', f: 'x^3 - 3*x', g: 'x', ftex: 'x^3 - 3x', gtex: 'x', span: [-2.5, 2.5], view: { x: [-2.6, 2.6], y: [-3, 3] } },
    { id: 'cos-para', name: '2cos x and x² − 1', v: 'x', f: '2*cos(x)', g: 'x^2 - 1', ftex: '2\\cos x', gtex: 'x^2 - 1', span: [-2, 2], view: { x: [-2, 2], y: [-1.5, 2.5] } },
    { id: 'in-y', name: 'x = y² and x = y + 2', v: 'y', f: 'y + 2', g: 'y^2', ftex: 'y + 2', gtex: 'y^2', span: [-1.5, 2.5], view: { x: [-1, 5], y: [-1.6, 2.6] } }
  ];
  function compile(s, v){ return M.fn(s, [v]); }
  function cuts(F, Gf, lo, hi){
    var d = function(u){ return F(u) - Gf(u); }, rs = M.roots(d, lo, hi, 800);
    // a tangency (no sign change) is not found by roots(); none of the gallery has one
    return rs.filter(function(x, i){ return i === 0 || Math.abs(x - rs[i - 1]) > 1e-7; });
  }
  /* A region compiled from its description (or its alt, in y). */
  function build(desc, v){
    var F = compile(desc.f, v), Gf = compile(desc.g, v), a, b, cs;
    if(desc.ends){ a = desc.ends[0]; b = desc.ends[1]; cs = cuts(F, Gf, a, b).filter(function(x){ return x > a + 1e-9 && x < b - 1e-9; }); }
    else { cs = cuts(F, Gf, desc.span[0], desc.span[1]); a = cs[0]; b = cs[cs.length - 1]; cs = cs.slice(1, -1); }
    return { v: v, f: desc.f, g: desc.g, ftex: desc.ftex, gtex: desc.gtex, F: F, Gf: Gf, a: a, b: b, cuts: cs };
  }
  function region(id, inY){
    var d = REGIONS.filter(function(x){ return x.id === id; })[0] || REGIONS[0];
    var r = inY && d.alt ? build(d.alt, 'y') : build(d, d.v);
    r.id = d.id; r.name = d.name; r.view = d.view; r.hasAlt = !!d.alt || d.v === 'y'; r.native = d.v;
    return r;
  }
  function hi(reg, u){ return Math.max(reg.F(u), reg.Gf(u)); }
  function lo(reg, u){ return Math.min(reg.F(u), reg.Gf(u)); }
  function area(reg){
    var pts = [reg.a].concat(reg.cuts, [reg.b]), pieces = [], total = 0, net = 0;
    for(var i = 0; i + 1 < pts.length; i++){
      var p = pts[i], q = pts[i + 1], m = (p + q) / 2, top = reg.F(m) >= reg.Gf(m) ? 'f' : 'g';
      var val = M.integral(function(u){ return reg.F(u) - reg.Gf(u); }, p, q, 1e-10);
      pieces.push({ a: p, b: q, top: top, value: Math.abs(val) }); total += Math.abs(val); net += val;
    }
    return { total: total, net: net, pieces: pieces };
  }
  /* Axes: { dir: 'h', at: k } is the line y = k, { dir: 'v', at: h } the line
     x = h. Discs and washers slice across the axis, so a horizontal axis
     needs a region in x and a vertical one a region in y. */
  function axisOk(reg, axis){
    if((axis.dir === 'h') !== (reg.v === 'x')) return false;
    var mn = Infinity, mx = -Infinity;
    for(var i = 0; i <= 200; i++){ var u = reg.a + (reg.b - reg.a) * i / 200; mn = Math.min(mn, lo(reg, u)); mx = Math.max(mx, hi(reg, u)); }
    return axis.at <= mn + 1e-9 || axis.at >= mx - 1e-9;
  }
  function extent(reg){
    var mn = Infinity, mx = -Infinity;
    for(var i = 0; i <= 200; i++){ var u = reg.a + (reg.b - reg.a) * i / 200; mn = Math.min(mn, lo(reg, u)); mx = Math.max(mx, hi(reg, u)); }
    return [mn, mx];
  }
  function radii(reg, axis, u){
    var p = Math.abs(reg.F(u) - axis.at), q = Math.abs(reg.Gf(u) - axis.at);
    return { R: Math.max(p, q), r: Math.min(p, q) };
  }
  function sectionArea(shape, s){ return shape === 'square' ? s * s : shape === 'tri' ? SQ3 / 4 * s * s : PI / 8 * s * s; }
  var SHAPES = { square: 'square', tri: 'equilateral triangle', semi: 'semicircle' };
  function volume(reg, setup){
    if(setup.kind === 'rev') return PI * M.integral(function(u){ var q = radii(reg, setup.axis, u); return q.R * q.R - q.r * q.r; }, reg.a, reg.b, 1e-10);
    return M.integral(function(u){ return sectionArea(setup.shape, hi(reg, u) - lo(reg, u)); }, reg.a, reg.b, 1e-10);
  }

  /* ---------------------------------------------------------- 3D mesh */
  /* World coordinates: X right, Y up, Z toward the viewer at rest. A region
     in x lies in the plane Z = 0 with X = x, Y = y; a region in y the same
     (X = x, Y = y). The section at u is a closed loop in its own plane. */
  function sectionLoops(reg, setup, u, m){
    var top = hi(reg, u), bot = lo(reg, u), loops = [];
    var put = reg.v === 'x' ? function(w, z){ return [u, w, z]; } : function(w, z){ return [w, u, z]; };
    if(setup.kind === 'rev'){
      var q = radii(reg, setup.axis, u), k = setup.axis.at, out = [], inn = [];
      for(var j = 0; j <= m; j++){ var th = 2 * PI * j / m, c = Math.cos(th), s = Math.sin(th); out.push(put(k + q.R * c, q.R * s)); inn.push(put(k + q.r * c, q.r * s)); }
      loops.push(out); loops.push(inn);
      return { loops: loops, R: q.R, r: q.r, top: top, bot: bot };
    }
    var side = top - bot, pts = [];
    if(setup.shape === 'square') pts = [[bot, 0], [top, 0], [top, side], [bot, side], [bot, 0]];
    else if(setup.shape === 'tri') pts = [[bot, 0], [top, 0], [(bot + top) / 2, side * SQ3 / 2], [bot, 0]];
    else { pts = []; for(var i = 0; i <= m; i++){ var ph = PI * i / m; pts.push([(bot + top) / 2 + side / 2 * Math.cos(ph), side / 2 * Math.sin(ph)]); } pts.push(pts[0]); }
    loops.push(pts.map(function(p){ return put(p[0], p[1]); }));
    return { loops: loops, s: side, top: top, bot: bot };
  }
  function mesh(reg, setup, n, m){
    n = n || 48; m = m || 40;
    var quads = [], prev = null, us = [];
    for(var i = 0; i <= n; i++) us.push(reg.a + (reg.b - reg.a) * i / n);
    // finer near the ends of a square-root region, where the radius changes fast
    us.forEach(function(u, i){
      var L = sectionLoops(reg, setup, u, m);
      if(prev){
        L.loops.forEach(function(loop, li){
          var P = prev.loops[li];
          for(var j = 0; j + 1 < loop.length; j++) quads.push({ p: [P[j], P[j + 1], loop[j + 1], loop[j]], t: li === 0 ? 'out' : 'in' });
        });
      }
      prev = L;
    });
    // end caps
    [0, n].forEach(function(i){
      var L = sectionLoops(reg, setup, us[i], m);
      if(setup.kind === 'rev'){
        var o = L.loops[0], q = L.loops[1];
        for(var j = 0; j + 1 < o.length; j++) quads.push({ p: [o[j], o[j + 1], q[j + 1], q[j]], t: 'cap' });
      } else {
        var lp = L.loops[0], c = lp.slice(0, -1).reduce(function(s, p){ return [s[0] + p[0], s[1] + p[1], s[2] + p[2]]; }, [0, 0, 0]).map(function(v){ return v / (lp.length - 1); });
        for(var k = 0; k + 1 < lp.length; k++) quads.push({ p: [c, lp[k], lp[k + 1], lp[k + 1]], t: 'cap' });
      }
    });
    return { quads: quads };
  }
  function slice(reg, setup, u, m){ return sectionLoops(reg, setup, u, m || 48); }

  /* ================================================== Test yourself */
  function stepNum(key, label, cell, o){ o = o || {}; return { key: key, kind: 'num', label: label, cell: cell, d: o.d, hint: o.hint, practice: o.practice || '1.E', level: o.level || 'apply' }; }
  function stepExpr(key, label, answer, v, dom, mistakes, o){
    o = o || {};
    return { key: key, kind: 'expr', label: label, lhs: o.lhs, cell: { expr: { answer: answer, vars: [v], mode: 'exact', domain: dom, mistakes: mistakes } }, hint: o.hint, practice: o.practice || '1.E', level: o.level || 'apply' };
  }
  function stepChoice(key, label, options, correct, why, o){ o = o || {}; return { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: o.practice || '3.C', level: o.level || 'analyze' }; }
  function shuffleIn(r, n){
    var idx = []; for(var i = 0; i < n; i++) idx.push(i);
    for(i = idx.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)), t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    return { idx: idx, correct: idx.indexOf(0) };
  }
  function ans(v, mistakes){ return M.cell(v, 0, mistakes || [], 0.001); }
  function poly(cs, v){ // [c0, c1, c2, c3] -> TeX and student syntax
    var tex = '', st = '', first = true;
    for(var p = cs.length - 1; p >= 0; p--){
      var c = cs[p]; if(!c) continue;
      var a = Math.abs(c), sgn = c < 0 ? (first ? '-' : ' - ') : (first ? '' : ' + ');
      var body = p === 0 ? tn(a) : (a === 1 ? '' : tn(a)) + v + (p > 1 ? '^' + p : '');
      tex += sgn + body;
      st += (c < 0 ? (first ? '-' : ' - ') : (first ? '' : ' + ')) + (p === 0 ? String(a) : (a === 1 ? '' : a + '*') + v + (p > 1 ? '^' + p : ''));
      first = false;
    }
    return { tex: tex || '0', s: st || '0' };
  }
  function pmul(a, b){ var o = []; for(var i = 0; i < a.length + b.length - 1; i++) o.push(0); a.forEach(function(x, i){ b.forEach(function(y, j){ o[i + j] += x * y; }); }); return o; }
  function padd(a, b){ var o = []; for(var i = 0; i < Math.max(a.length, b.length); i++) o.push((a[i] || 0) + (b[i] || 0)); return o; }
  function pscale(a, k){ return a.map(function(x){ return x * k; }); }
  function pint(a, lo, hi){ var s = 0; a.forEach(function(c, p){ s += c * (Math.pow(hi, p + 1) - Math.pow(lo, p + 1)) / (p + 1); }); return s; }
  function pval(a, x){ return a.reduce(function(s, c, p){ return s + c * Math.pow(x, p); }, 0); }

  /* A base region for a problem: { v, top, bot (student syntax), ttex, btex,
     a, b, exact (limits are nice), poly? (coefficients of top - bot) } */
  function regQuadLine(r){
    var r1 = r.int(-2, 1), r2 = r1 + r.pick([2, 3]), m = r.int(-1, 2), q = r.int(-1, 2);
    // top = m x + q + (x - r1)(r2 - x)
    var diff = [-r1 * r2, r1 + r2, -1], g = [q, m], f = padd(g, diff), F = poly(f, 'x'), Gp = poly(g, 'x');
    return { v: 'x', top: F.s, bot: Gp.s, ttex: F.tex, btex: Gp.tex, a: r1, b: r2, diff: diff, top_p: f, bot_p: g, exact: true };
  }
  function regSqrtLine(r){
    var c = r.pick([1, 2, 3]);
    return { v: 'x', top: 'sqrt(x)', bot: c === 1 ? 'x' : 'x/' + c, ttex: '\\sqrt{x}', btex: c === 1 ? 'x' : '\\frac{x}{' + c + '}', a: 0, b: c * c, exact: true, sqrt: true };
  }
  function regCalc(r){
    if(r() < 0.5) return { v: 'x', top: '2*cos(x)', bot: 'x^2 - 1', ttex: '2\\cos x', btex: 'x^2 - 1', calc: true, span: [-2, 2] };
    return { v: 'x', top: '4/(1 + x^2)', bot: 'x^2', ttex: '\\frac{4}{1 + x^2}', btex: 'x^2', calc: true, span: [-2, 2] };
  }
  function limitsOf(R){
    if(R.a != null) return R;
    var F = M.fn(R.top, [R.v]), Gf = M.fn(R.bot, [R.v]), cs = cuts(F, Gf, R.span[0], R.span[1]);
    R.a = cs[0]; R.b = cs[cs.length - 1];
    return R;
  }
  function dom(R){ return [R.a, R.b]; }
  function diffOf(R){ return R.bot === '0' ? R.top : R.top + ' - ' + (plainSum(R.bot) ? R.bot : '(' + R.bot + ')'); }
  function sayRegion(R){
    var V = R.v === 'x' ? 'y' : 'x';
    var b = R.btex === '0' ? 'the ' + R.v + '-axis' : '$' + V + ' = ' + R.btex + '$';
    return 'the region $R$ bounded by $' + V + ' = ' + R.ttex + '$' + (R.extra ? ', ' + b + ' ' + R.extra : ' and ' + b);
  }
  function limitSteps(R, mis){
    var v = R.v, txt = R.calc ? 'a calculator is fine: three decimal places' : 'exact';
    return [
      stepNum('lo', H('The lower limit of integration (a value of $' + v + '$)'), ans(R.a, mis ? mis.lo : []), { d: 3, hint: H(R.extra ? 'Read the limits from the boundaries: where the curve meets the other boundary, and the line.' : 'The curves meet where $' + R.ttex + ' = ' + R.btex + '$: solve (' + txt + ').'), practice: R.calc ? '3.F' : '1.E' }),
      stepNum('hi', H('The upper limit of integration'), ans(R.b, mis ? mis.hi : []), { d: 3, practice: R.calc ? '3.F' : '1.E' })
    ];
  }
  function numFig(R, extra){
    var o = { v: R.v, top: R.top, bot: R.bot, ttex: R.ttex, btex: R.btex, a: R.a, b: R.b };
    for(var k in extra) o[k] = extra[k];
    return o;
  }
  function I(R, body){ return '\\int_{' + tl(R.a) + '}^{' + tl(R.b) + '} ' + body + '\\,d' + R.v; }
  function tl(x){ var f = fracOf(x); return f && f.d <= 4 ? tp(x) : x < 0 ? '{' + dn(x, 3) + '}' : dn(x, 3); }
  function valTex(v, R){ var e = R.calc ? null : exactTex(v); return e ? e + (fracOf(v) && fracOf(v).d === 1 ? '' : ' \\approx ' + dn(v, 3)) : '\\approx ' + dn(v, 3); }

  /* ---------- area in x */
  function genAreaX(r, ctx){
    var k = r.int(0, 2), R = limitsOf(k === 0 ? regQuadLine(r) : k === 1 ? regSqrtLine(r) : regCalc(r)), D = diffOf(R);
    var Ft = M.fn(R.top, ['x']), Fb = M.fn(R.bot, ['x']);
    var A = M.integral(function(x){ return Ft(x) - Fb(x); }, R.a, R.b, 1e-10);
    var A2 = M.integral(function(x){ var d = Ft(x) - Fb(x); return d * d; }, R.a, R.b, 1e-8);
    var ig = R.top + ' - ' + (plainSum(R.bot) ? R.bot : '(' + R.bot + ')');
    var steps = limitSteps(R).concat([
      stepExpr('ig', H('The integrand: top minus bottom'), ig, 'x', dom(R), [
        { expr: '(' + D + ')^2', why: 'Do not square the difference: squaring is for volumes. The area of a thin rectangle is its height (top minus bottom) times dx.' },
        { expr: R.bot === '0' ? '-(' + R.top + ')' : '(' + R.top + ') + (' + R.bot + ')', why: 'The height of a rectangle is top minus bottom, a difference, not a sum.' }].slice(0, R.bot === '0' ? 1 : 2), { lhs: 'A = \\int_a^b', hint: H('Which curve is on top between the limits? Test a point in the middle.') }),
      stepNum('A', H('The area of $R$' + (R.calc ? ' (three decimal places)' : ' (exact, or three decimal places)')), ans(A, [{ value: A2, why: 'You squared the difference. Area is the integral of (top − bottom), not of its square.' }]), { d: 3, practice: R.calc ? '3.F' : '1.E' })
    ]);
    return { ctx: ctx.id, topic: ctx.topic, type: 'areaX',
      text: H('<p>Find the area of ' + sayRegion(R) + '.</p>'), steps: steps,
      solution: [H('The curves meet where $' + R.ttex + ' = ' + R.btex + '$: $x = ' + tl(R.a) + '$ and $x = ' + tl(R.b) + '$' + (R.calc ? ' (calculator)' : '') + '.'),
        H('Between them $y = ' + R.ttex + '$ is on top.'), H('$A = ' + I(R, '\\left(' + R.ttex + ' - ' + (R.btex.indexOf(' ') > -1 ? '(' + R.btex + ')' : R.btex) + '\\right)') + ' ' + (R.calc ? '\\approx ' + dn(A, 3) : '= ' + valTex(A, R).replace(/^\\approx /, '')) + '$.')],
      fig: numFig(R, { kind: 'area' }), reg: R };
  }

  /* ---------- area in y */
  function genAreaY(r, ctx){
    var R;
    if(r() < 0.6){
      var r1 = r.int(-2, 0), r2 = r1 + r.pick([2, 3]), m = r1 + r2, q = -r1 * r2, P = poly([q, m], 'y');
      R = { v: 'y', top: P.s, bot: 'y^2', ttex: P.tex, btex: 'y^2', a: r1, b: r2, exact: true };
    } else {
      var s = r.pick([1, 2]), c = r.int(0, 2 * s * s), c2 = 2 * s * s - c;
      var L = poly([-c, 0, 1], 'y'), Rt = poly([c2, 0, -1], 'y');
      R = { v: 'y', top: Rt.s, bot: L.s, ttex: Rt.tex, btex: L.tex, a: -s, b: s, exact: true };
    }
    var Ft = M.fn(R.top, ['y']), Fb = M.fn(R.bot, ['y']);
    var A = M.integral(function(y){ return Ft(y) - Fb(y); }, R.a, R.b, 1e-10);
    var steps = limitSteps(R).concat([
      stepExpr('ig', H('The integrand in $y$: right minus left'), diffOf(R), 'y', dom(R), [
        { expr: '(' + R.bot + ') - (' + R.top + ')', why: 'For horizontal strips the length is right minus left. Here $x = ' + R.ttex + '$ is on the right.' },
        { expr: '((' + R.top + ') - (' + R.bot + '))^2', why: 'Do not square the length: that is for volumes. The strip\'s area is (right − left) dy.' }], { lhs: 'A = \\int_c^d', hint: H('Horizontal strips: which curve has the larger $x$?') }),
      stepNum('A', H('The area of $R$ (exact, or three decimal places)'), ans(A, []), { d: 3 })
    ]);
    // the sign mistake above duplicates the built-in sign note; keep it, it names right minus left
    return { ctx: ctx.id, topic: ctx.topic, type: 'areaY',
      text: H('<p>Find the area of the region $R$ bounded by $x = ' + R.ttex + '$ and $x = ' + R.btex + '$. Integrate with respect to $y$.</p>'), steps: steps,
      solution: [H('The curves meet where $' + R.ttex + ' = ' + R.btex + '$: $y = ' + tl(R.a) + '$ and $y = ' + tl(R.b) + '$.'),
        H('Horizontal strips run from $x = ' + R.btex + '$ on the left to $x = ' + R.ttex + '$ on the right.'),
        H('$A = ' + I(R, '\\left(' + R.ttex + ' - (' + R.btex + ')\\right)') + ' = ' + valTex(A, R) + '$.')],
      fig: numFig(R, { kind: 'area' }), reg: R };
  }

  /* ---------- area between curves that cross three times */
  function genAreaCross(r, ctx){
    var r1 = r.int(-3, -1), r2 = r1 + r.pick([1, 2]), r3 = r2 + r.pick([1, 2]), sg = r.pick([1, -1]), m = r.int(-1, 1), q = r.int(-1, 1);
    var cub = pscale(pmul(pmul([-r1, 1], [-r2, 1]), [-r3, 1]), sg), g = [q, m], f = padd(g, cub);
    var F = poly(f, 'x'), Gp = poly(g, 'x');
    var p1 = pint(cub, r1, r2), p2 = pint(cub, r2, r3), total = Math.abs(p1) + Math.abs(p2), net = p1 + p2;
    var fTop = p1 > 0; // on [r1, r2]
    var ft = 'f(x)', gt = 'g(x)';
    var correct = '\\int_{' + r1 + '}^{' + r2 + '} \\left(' + (fTop ? ft + ' - ' + gt : gt + ' - ' + ft) + '\\right)dx + \\int_{' + r2 + '}^{' + r3 + '} \\left(' + (fTop ? gt + ' - ' + ft : ft + ' - ' + gt) + '\\right)dx';
    var flipped = '\\int_{' + r1 + '}^{' + r2 + '} \\left(' + (fTop ? gt + ' - ' + ft : ft + ' - ' + gt) + '\\right)dx + \\int_{' + r2 + '}^{' + r3 + '} \\left(' + (fTop ? ft + ' - ' + gt : gt + ' - ' + ft) + '\\right)dx';
    var netT = '\\int_{' + r1 + '}^{' + r3 + '} \\left(f(x) - g(x)\\right)dx', sqT = '\\int_{' + r1 + '}^{' + r3 + '} \\left(f(x) - g(x)\\right)^2 dx';
    var sh = shuffleIn(r, 4), all = [correct, flipped, netT, sqT];
    var why = ['Right: split at $x = ' + r2 + '$, where the curves cross, and take top minus bottom on each piece.',
      'Split in the right place, but each piece is bottom minus top, so both are negative.',
      'One integral over the whole interval gives the net value: the pieces above and below cancel, it is not the area.',
      'Squaring keeps the sign positive but changes the size: area is the integral of the height, not of its square.'];
    var R = { v: 'x', top: F.s, bot: Gp.s, ttex: F.tex, btex: Gp.tex, a: r1, b: r3, exact: true };
    return { ctx: ctx.id, topic: ctx.topic, type: 'areaCross',
      text: H('<p>$f(x) = ' + F.tex + '$ and $g(x) = ' + Gp.tex + '$ cross at $x = ' + r1 + '$, $x = ' + r2 + '$ and $x = ' + r3 + '$. Find the total area enclosed between them.</p>'),
      steps: [
        stepChoice('setup', H('Which setup gives the total area?'), sh.idx.map(function(i){ return H('$' + all[i] + '$'); }), sh.correct, sh.idx.map(function(i){ return H(why[i]); }), { practice: '3.C' }),
        stepNum('A', H('The total area (exact, or three decimal places)'), ans(total, [{ value: net, why: 'That is the net integral: the piece where g is on top counted as negative. Add the two areas.' }, { value: Math.abs(net), why: 'The pieces still partly cancel. Take each piece as top minus bottom, then add.' }]), { d: 3 })
      ],
      solution: [H('On $[' + r1 + ', ' + r2 + ']$, ' + (fTop ? '$f$' : '$g$') + ' is on top; on $[' + r2 + ', ' + r3 + ']$, ' + (fTop ? '$g$' : '$f$') + ' is.'),
        H('Area $= ' + tn(Math.abs(p1)) + ' + ' + tn(Math.abs(p2)) + ' = ' + tn(total) + '$.'), H('The single integral $' + netT + ' = ' + tn(net) + '$ is the net value, not the area.')],
      fig: numFig(R, { kind: 'area', cuts: [r2] }), reg: R };
  }

  /* ---------- known cross sections */
  function baseRegion(r){
    var k = r.int(0, 2);
    if(k === 0) return regQuadLine(r);
    if(k === 1) return regSqrtLine(r);
    var b = r.pick([1, 4]);
    return { v: 'x', top: 'sqrt(x)', bot: '0', ttex: '\\sqrt{x}', btex: '0', a: 0, b: b, exact: true, sqrt: true, extra: 'and the line $x = ' + b + '$' };
  }
  function genCross(r, ctx, shapes){
    var R = baseRegion(r), shape = r.pick(shapes), s = diffOf(R);
    var Ft = M.fn(R.top, ['x']), Fb = M.fn(R.bot, ['x']);
    var V = M.integral(function(x){ return sectionArea(shape, Ft(x) - Fb(x)); }, R.a, R.b, 1e-10);
    var base = M.integral(function(x){ return Ft(x) - Fb(x); }, R.a, R.b, 1e-8);
    var areaAns = shape === 'square' ? '(' + s + ')^2' : shape === 'tri' ? 'sqrt(3)/4*(' + s + ')^2' : 'pi/8*(' + s + ')^2';
    var aMis = shape === 'square' ? [{ expr: s, why: 'That is the side. A square\'s area is the side squared.' }, { expr: 'pi*(' + s + ')^2', why: 'That is a circle of radius s. These cross sections are squares: A = s².' }]
      : shape === 'tri' ? [{ expr: '(' + s + ')^2/2', why: 'That is a right isosceles triangle with legs s. An equilateral triangle with side s has height (√3/2)s, so A = (√3/4)s².' }, { expr: 'sqrt(3)/2*(' + s + ')^2', why: 'Area is ½ · base · height: ½ · s · (√3/2)s = (√3/4)s².' }]
      : [{ expr: 'pi/2*(' + s + ')^2', why: 'The diameter is s, so the radius is s/2. A semicircle: ½π(s/2)² = (π/8)s².' }, { expr: 'pi/4*(' + s + ')^2', why: 'That is the whole circle of diameter s. A semicircle is half: (π/8)s².' }];
    var vMis = [{ value: base, why: 'That is the area of the base region. Integrate the area of each cross section, A(x), not its side.' }];
    if(shape === 'square') vMis.push({ value: PI * V, why: 'No π here: the cross sections are squares, not discs.' });
    var Atex = shape === 'square' ? 's^2' : shape === 'tri' ? '\\frac{\\sqrt{3}}{4}s^2' : '\\frac{\\pi}{8}s^2';
    var steps = limitSteps(R).concat([
      stepExpr('side', H('The side $s$ of a cross section at $x$ (the length across the base)'), s, 'x', dom(R), [{ expr: '(' + R.bot + ') - (' + R.top + ')', why: 'A length is top minus bottom, so it comes out positive.' }], { lhs: 's(x) =' }),
      stepExpr('Ax', H('The area of the cross section at $x$'), areaAns, 'x', dom(R), aMis, { lhs: 'A(x) =', hint: H('A ' + SHAPES[shape] + ' with ' + (shape === 'semi' ? 'diameter' : 'side') + ' $s$.') }),
      stepNum('V', H('The volume of the solid (exact, or three decimal places)'), ans(V, vMis), { d: 3 })
    ]);
    return { ctx: ctx.id, topic: ctx.topic, type: shape === 'square' ? 'crossSq' : 'crossTri',
      text: H('<p>The base of a solid is ' + sayRegion(R) + '. Each cross section perpendicular to the $x$-axis is ' + (shape === 'square' ? 'a square' : shape === 'tri' ? 'an equilateral triangle' : 'a semicircle') + ' with ' + (shape === 'semi' ? 'its diameter' : 'one side') + ' in the base. Find the volume.</p>'),
      steps: steps,
      solution: [H('Limits: $x = ' + tl(R.a) + '$ to $x = ' + tl(R.b) + '$. Side: $s(x) = ' + R.ttex + ' - ' + (R.btex.indexOf(' ') > -1 ? '(' + R.btex + ')' : R.btex) + '$.'),
        H('Area of a cross section: $A(x) = ' + Atex + '$.'), H('$V = ' + I(R, 'A(x)') + ' = ' + valTex(V, R) + '$.')],
      fig: numFig(R, { kind: 'cross', shape: shape }), reg: R };
  }

  /* ---------- discs and washers */
  function fmtLine(axis){ return axis.dir === 'h' ? (axis.at === 0 ? 'the $x$-axis' : 'the line $y = ' + tp(axis.at) + '$') : (axis.at === 0 ? 'the $y$-axis' : 'the line $x = ' + tp(axis.at) + '$'); }
  // Student-syntax strings that read the way a student would write them.
  function plainSum(s){ return !/\s[+-]\s/.test(s) && s.charAt(0) !== '-'; }
  function sq(s){ return /^[A-Za-z0-9.]+$|^sqrt\([^()]*\)$/.test(s) ? s + '^2' : '(' + s + ')^2'; }
  function radExpr(f, k, below){
    if(k === 0) return f;
    if(below) return k < 0 ? f + ' + ' + (-k) : f + ' - ' + k;
    return k + ' - ' + (plainSum(f) ? f : '(' + f + ')');
  }
  function revProblem(r, ctx, R, axis, type, washer){
    var v = R.v, Ft = M.fn(R.top, [v]), Fb = M.fn(R.bot, [v]), below = axis.at <= Math.min(Ft((R.a + R.b) / 2), Fb((R.a + R.b) / 2));
    // R from the far curve, r from the near one
    var far = below ? R.top : R.bot, near = below ? R.bot : R.top, k = axis.at;
    var Rs = radExpr(far, k, below), rs = radExpr(near, k, below);
    var nearZero = M.integral(function(u){ var x = M.fn(rs, [v])(u); return Math.abs(x); }, R.a, R.b, 1e-8) < 1e-9;
    if(!washer && !nearZero) washer = true;
    var Rf = M.fn(Rs, [v]), rf = M.fn(rs, [v]);
    var V = PI * M.integral(function(u){ return Rf(u) * Rf(u) - (washer ? rf(u) * rf(u) : 0); }, R.a, R.b, 1e-10);
    var ig = washer ? 'pi*(' + sq(Rs) + ' - ' + sq(rs) + ')' : 'pi*' + sq(Rs);
    var igMis = [{ expr: washer ? sq(Rs) + ' - ' + sq(rs) : sq(Rs), why: 'Missing π: each slice is a ' + (washer ? 'washer, area π(R² − r²)' : 'disc, area πR²') + '.' }];
    if(washer) igMis.push({ expr: 'pi*(' + Rs + ' - ' + rs + ')^2', why: '(R − r)² is not R² − r². A washer\'s area is the big disc minus the hole: πR² − πr².' });
    if(k !== 0){
      var Fs = '(' + far + ')', ns = '(' + near + ')';
      igMis.push({ expr: washer ? 'pi*(' + Fs + '^2 - ' + ns + '^2)' : 'pi*' + sq(far), why: 'Those radii are measured from the ' + (axis.dir === 'h' ? 'x' : 'y') + '-axis. Measure from the axis of rotation, ' + (axis.dir === 'h' ? 'y' : 'x') + ' = ' + k + ': R = ' + (below ? 'curve − (' + k + ')' : k + ' − curve') + '.' });
    }
    if(!washer) igMis.push({ expr: 'pi*(' + Rs + ')', why: 'Square the radius: a disc has area πR².' });
    var RMis = [];
    if(k !== 0) RMis.push({ expr: far, why: 'That is the height above the ' + (axis.dir === 'h' ? 'x' : 'y') + '-axis. The radius runs from the axis of rotation, ' + (axis.dir === 'h' ? 'y' : 'x') + ' = ' + k + ', to the curve.' });
    if(washer) RMis.push({ expr: rs, why: 'That is the inner radius r, to the nearer curve. R reaches the farther curve.' });
    var vMis = [];
    if(washer){ var VRr = PI * M.integral(function(u){ var d = Rf(u) - rf(u); return d * d; }, R.a, R.b, 1e-8); vMis.push({ value: VRr, why: 'You used (R − r)². A washer is πR² − πr².' }); }
    if(k !== 0){ var Ff = M.fn(far, [v]), Nf = M.fn(near, [v]); var V0 = PI * M.integral(function(u){ return Ff(u) * Ff(u) - (washer ? Nf(u) * Nf(u) : 0); }, R.a, R.b, 1e-8); vMis.push({ value: V0, why: 'That revolves the region about the ' + (axis.dir === 'h' ? 'x' : 'y') + '-axis. Measure the radii from ' + (axis.dir === 'h' ? 'y' : 'x') + ' = ' + k + '.' }); }
    var V2 = M.integral(function(u){ return Rf(u) * Rf(u) - (washer ? rf(u) * rf(u) : 0); }, R.a, R.b, 1e-8);
    vMis.push({ value: V2, why: 'Missing π: V = π∫(R² − r²).' });
    var Vv = axis.dir === 'h' ? 'x' : 'y';
    var steps = limitSteps(R).concat([
      stepExpr('R', H('The outer radius $R(' + v + ')$, from the axis to the farther curve'), Rs, v, dom(R), RMis, { lhs: 'R(' + v + ') =', hint: H('The axis is ' + fmtLine(axis) + '. A radius is a distance: farther curve minus the axis line, or the line minus the curve.') }),
      stepExpr('ig', H('The integrand: the area of the ' + (washer ? 'washer' : 'disc') + ' at $' + v + '$'), ig, v, dom(R), igMis, { lhs: 'V = \\int_a^b', hint: H(washer ? 'A washer: $\\pi\\left(R^2 - r^2\\right)$, with $r$ to the nearer curve.' : 'A disc: $\\pi R^2$.') }),
      stepNum('V', H('The volume (exact, or three decimal places)'), ans(V, vMis), { d: 3 })
    ]);
    var regionText = R.v === 'x' ? sayRegion(R) : 'the region $R$ bounded by $x = ' + R.ttex + '$ and $x = ' + R.btex + '$';
    return { ctx: ctx.id, topic: ctx.topic, type: type,
      text: H('<p>' + regionText.charAt(0).toUpperCase() + regionText.slice(1) + ' is revolved about ' + fmtLine(axis) + '. Find the volume of the solid.</p>'),
      steps: steps,
      solution: [H('Limits: $' + v + ' = ' + tl(R.a) + '$ to $' + v + ' = ' + tl(R.b) + '$. Slices are perpendicular to the axis, so integrate in $' + v + '$.'),
        H('Radii from ' + fmtLine(axis) + ': $R = ' + texOf(Rs, v) + '$' + (washer ? ', $r = ' + texOf(rs, v) + '$' : '') + '.'),
        H('$V = \\pi' + I(R, washer ? '\\left(R^2 - r^2\\right)' : 'R^2') + ' = ' + valTex(V, R) + '$.')],
      fig: numFig(R, { kind: 'rev', axis: axis, R: Rs, r: washer ? rs : null }), reg: R, axis: axis, washer: washer };
  }
  function texOf(s, v){ try{ return M.toTex(M.parse(s, { vars: [v] })); }catch(e){ return s; } }
  function genDiscAxes(r, ctx){
    var k = r.int(0, 2), R, axis;
    if(k === 0){ var b = r.pick([1, 2, 3, 4]); R = { v: 'x', top: 'sqrt(x)', bot: '0', ttex: '\\sqrt{x}', btex: '0', a: 0, b: b, exact: true, extra: 'and the line $x = ' + b + '$' }; axis = { dir: 'h', at: 0 }; }
    else if(k === 1){ var b2 = r.pick([1, 2]); R = { v: 'x', top: 'x^2', bot: '0', ttex: 'x^2', btex: '0', a: 0, b: b2, exact: true, extra: 'and the line $x = ' + b2 + '$' }; axis = { dir: 'h', at: 0 }; }
    else { var d = r.pick([1, 4, 9]), sd = Math.sqrt(d); R = { v: 'y', top: 'sqrt(y)', bot: '0', ttex: '\\sqrt{y}', btex: '0', a: 0, b: d, exact: true, extra: 'and the line $y = ' + d + '$', curveX: 'y = x^2' }; axis = { dir: 'v', at: 0 }; }
    var p = revProblem(r, ctx, R, axis, 'discAxes', false);
    if(R.v === 'y') p.text = H('<p>The region $R$ in the first quadrant bounded by $y = x^2$, the $y$-axis and the line $y = ' + R.b + '$ is revolved about the $y$-axis. Find the volume of the solid. (Write the curve as $x = \\sqrt{y}$.)</p>');
    else p.text = H('<p>The region $R$ bounded by $y = ' + R.ttex + '$, the $x$-axis and the line $x = ' + R.b + '$ is revolved about the $x$-axis. Find the volume of the solid.</p>');
    // the lower limit is where the curve meets the axis line
    return p;
  }
  function genDiscOther(r, ctx){
    var k = r.int(0, 2), R, axis;
    if(k === 0){ var c = r.pick([1, 2]); R = { v: 'x', top: String(c * c), bot: 'x^2', ttex: String(c * c), btex: 'x^2', a: -c, b: c, exact: true }; axis = { dir: 'h', at: c * c }; }
    else if(k === 1){ var c1 = r.pick([1, 2]); R = { v: 'x', top: String(c1), bot: 'sqrt(x)', ttex: String(c1), btex: '\\sqrt{x}', a: 0, b: c1 * c1, exact: true, sqrt: true }; axis = { dir: 'h', at: c1 }; }
    else { var c2 = r.pick([1, 2]); R = { v: 'y', top: String(c2 * c2), bot: 'y^2', ttex: String(c2 * c2), btex: 'y^2', a: -c2, b: c2, exact: true }; axis = { dir: 'v', at: c2 * c2 }; }
    var p = revProblem(r, ctx, R, axis, 'discOther', false);
    if(k === 1) p.text = H('<p>The region $R$ bounded by $y = \\sqrt{x}$, the line $y = ' + R.top + '$ and the $y$-axis is revolved about the line $y = ' + R.top + '$. Find the volume of the solid.</p>');
    return p;
  }
  function genWasherAxes(r, ctx){
    var k = r.int(0, 2), R, axis;
    if(k === 0){ var m = r.pick([1, 2]); R = { v: 'x', top: m === 1 ? 'x' : m + '*x', bot: 'x^2', ttex: (m === 1 ? '' : m) + 'x', btex: 'x^2', a: 0, b: m, exact: true }; axis = { dir: 'h', at: 0 }; }
    else if(k === 1){ R = regSqrtLine(r); axis = { dir: 'h', at: 0 }; }
    else { var m2 = r.pick([1, 2]); R = { v: 'y', top: 'sqrt(y)', bot: m2 === 1 ? 'y' : 'y/' + m2, ttex: '\\sqrt{y}', btex: m2 === 1 ? 'y' : '\\frac{y}{' + m2 + '}', a: 0, b: m2 * m2, exact: true }; axis = { dir: 'v', at: 0 }; }
    return revProblem(r, ctx, R, axis, 'washerAxes', true);
  }
  function genWasherOther(r, ctx){
    var k = r.int(0, 2), R, axis;
    if(k === 0){ var m = r.pick([1, 2]); R = { v: 'x', top: m === 1 ? 'x' : m + '*x', bot: 'x^2', ttex: (m === 1 ? '' : m) + 'x', btex: 'x^2', a: 0, b: m, exact: true }; axis = r() < 0.5 ? { dir: 'h', at: -r.pick([1, 2]) } : { dir: 'h', at: m * m + r.pick([0, 1]) }; }
    else if(k === 1){ R = regSqrtLine(r); axis = { dir: 'h', at: -r.pick([1, 2]) }; }
    else { var m2 = r.pick([1, 2]); R = { v: 'y', top: 'sqrt(y)', bot: m2 === 1 ? 'y' : 'y/' + m2, ttex: '\\sqrt{y}', btex: m2 === 1 ? 'y' : '\\frac{y}{' + m2 + '}', a: 0, b: m2 * m2, exact: true }; axis = { dir: 'v', at: -r.pick([1, 2]) }; }
    return revProblem(r, ctx, R, axis, 'washerOther', true);
  }

  var GEN = {
    areaX: genAreaX, areaY: genAreaY, areaCross: genAreaCross,
    crossSq: function(r, c){ return genCross(r, c, ['square']); }, crossTri: function(r, c){ return genCross(r, c, ['tri', 'semi']); },
    discAxes: genDiscAxes, discOther: genDiscOther, washerAxes: genWasherAxes, washerOther: genWasherOther
  };
  function generate(r, ctx, type){
    var kind = type || ctx.kind || 'areaX';
    if(!GEN[kind]) throw new Error('areaVolume.generate: no problem kind "' + kind + '"');
    return GEN[kind](r, ctx);
  }

  M.register('areaVolume', {
    REGIONS: REGIONS, region: region, cuts: cuts, area: area, radii: radii, axisOk: axisOk, extent: extent, volume: volume, sectionArea: sectionArea, SHAPES: SHAPES,
    mesh: mesh, slice: slice, hi: hi, lo: lo, generate: generate, KINDS: Object.keys(GEN), tn: tn, dn: dn, piTex: piTex, exactTex: exactTex, fmtLine: fmtLine,
    pint: pint, pval: pval
  });
})(typeof window !== 'undefined' ? window : globalThis);
