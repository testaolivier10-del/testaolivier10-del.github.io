/* Function lab model: ApPrecalcMath.functionLab (docs/apprecalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/apprecalc-briefs/t1.md): no other tool edits this
   file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/apprecalc-tool-checks/function-lab.mjs) and the test
   (scripts/test/apprecalc-tool-function-lab.test.mjs) run exactly this code.

   Explore: every parent function the course transforms (FAMILIES, in ORDER),
   g(x) = a f(b(x - h)) + k with p = { a, b, h, k }.
     g(fam, p, x)           the value (NaN outside the domain)
     image(p, [u, v])       a parent point's image (u/b + h, a v + k)
     zeros(fam, p, [lo, hi]) exact zeros from the parent's inverse, in a window
     ends(fam, p)           end behavior: { neg, pos } each 'inf' | '-inf' | number | 'osc' | null
     vas(fam, p)            vertical asymptotes with both one-sided limits
     has(fam, p)            horizontal asymptotes [{ y, side }]
     domain(fam, p), range(fam, p)   interval notation (TeX)
     steps(p)               the transformations in words, in the order they act
     limTex(...)            limit notation the exam rewards
     str(fam, p), tex(fam, p)   g in student syntax (graded by ApPrecalcExpr) and TeX
   Test yourself: generate(rng, ctx, type) -> { ctx, topic, type, title, text,
   steps, solution, fig, values } for the kinds in KINDS. Spec:
   docs/apprecalc-spec.md section 6. */
(function(G){
  'use strict';
  var M = G.ApPrecalcMath;
  if(!M) return;
  var PI = Math.PI, INF = Infinity;
  function H(s){ return G.ApPrecalcTex ? G.ApPrecalcTex.html(s, { strict: true }) : s; }
  function escT(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function optHtml(t){
    if(String(t).indexOf('$') < 0 || !G.ApPrecalcTex) return '<span class="cd-opt-t">' + H(t) + '</span>';
    return '<span class="cd-opt-t"><span class="sr-only">' + escT(G.ApPrecalcTex.plain(t)) + '</span><span aria-hidden="true">' + H(t) + '</span></span>';
  }
  /* A number as the page writes it: an integer, else up to three decimals. */
  function n(x, d){
    if(Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    var s = M.fixed(x, d == null ? 3 : d).replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
  }
  /* A number in TeX: halves and quarters as fractions, multiples of pi/2 with pi. */
  function nt(x){
    if(Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    for(var d = 2; d <= 8; d++){ var k = Math.round(x * d); if(Math.abs(k / d - x) < 1e-9) return (k < 0 ? '-' : '') + '\\frac{' + Math.abs(k) + '}{' + d + '}'; }
    var q = x / (PI / 2), kq = Math.round(q);
    if(Math.abs(q - kq) < 1e-9){
      var K = Math.abs(kq), s = K % 2 === 0 ? (K / 2 === 1 ? '' : K / 2) + '\\pi' : '\\frac{' + (K === 1 ? '' : K) + '\\pi}{2}';
      return (kq < 0 ? '-' : '') + s;
    }
    return n(x);
  }
  function exactish(x){ return Math.abs(x * 8 - Math.round(x * 8)) < 1e-9; }
  function sgn(x){ return x > 0 ? 1 : x < 0 ? -1 : 0; }

  /* ------------------------------------------------------- families */
  /* f: the parent; keys: its key points (the table); shape: the key point the
     second handle drags (u ≠ 0, f(u) ≠ 0); lim: the parent's limits at
     u → -∞ and u → +∞ (null outside the domain); dom/rng: the parent's
     domain and range. inv(c): every u with f(u) = c (zeros of g). */
  var FAMILIES = {
    linear: { name: 'Linear', tex: 'x', f: function(u){ return u; }, keys: [[-1, -1], [0, 0], [1, 1]], shape: 2,
      lim: ['-inf', 'inf'], dom: 'R', rng: 'R', inv: function(c){ return [c]; } },
    quadratic: { name: 'Quadratic', tex: 'x^2', f: function(u){ return u * u; }, keys: [[-1, 1], [0, 0], [1, 1], [2, 4]], shape: 2,
      lim: ['inf', 'inf'], dom: 'R', rng: 'nonneg', inv: function(c){ return c > 1e-12 ? [-Math.sqrt(c), Math.sqrt(c)] : Math.abs(c) <= 1e-12 ? [0] : []; } },
    cubic: { name: 'Cubic', tex: 'x^3', f: function(u){ return u * u * u; }, keys: [[-1, -1], [0, 0], [1, 1]], shape: 2,
      lim: ['-inf', 'inf'], dom: 'R', rng: 'R', inv: function(c){ return [Math.cbrt(c)]; } },
    absolute: { name: 'Absolute value', tex: '\\left|x\\right|', f: function(u){ return Math.abs(u); }, keys: [[-1, 1], [0, 0], [1, 1]], shape: 2,
      lim: ['inf', 'inf'], dom: 'R', rng: 'nonneg', inv: function(c){ return c > 1e-12 ? [-c, c] : Math.abs(c) <= 1e-12 ? [0] : []; } },
    sqrt: { name: 'Square root', tex: '\\sqrt{x}', f: function(u){ return u >= 0 ? Math.sqrt(u) : NaN; }, keys: [[0, 0], [1, 1], [4, 2]], shape: 1,
      lim: [null, 'inf'], dom: 'nonneg', rng: 'nonneg', inv: function(c){ return c >= -1e-12 ? [Math.max(0, c) * Math.max(0, c)] : []; } },
    reciprocal: { name: 'Reciprocal', tex: '\\frac{1}{x}', f: function(u){ return u === 0 ? NaN : 1 / u; }, keys: [[-1, -1], [1, 1], [2, 0.5]], shape: 1,
      lim: [0, 0], dom: 'nonzero', rng: 'nonzero', inv: function(c){ return Math.abs(c) > 1e-12 ? [1 / c] : []; }, va: true, ha: true },
    exponential: { name: 'Exponential', tex: '2^x', f: function(u){ return Math.pow(2, u); }, keys: [[-1, 0.5], [0, 1], [1, 2], [2, 4]], shape: 2,
      lim: [0, 'inf'], dom: 'R', rng: 'pos', inv: function(c){ return c > 1e-12 ? [Math.log2(c)] : []; }, ha: true },
    logarithmic: { name: 'Logarithmic', tex: '\\log_{2} x', f: function(u){ return u > 0 ? Math.log2(u) : NaN; }, keys: [[0.5, -1], [1, 0], [2, 1], [4, 2]], shape: 2,
      lim: [null, 'inf'], dom: 'pos', rng: 'R', inv: function(c){ return [Math.pow(2, c)]; }, va: true },
    sine: { name: 'Sine', tex: '\\sin x', f: function(u){ return Math.sin(u); }, keys: [[0, 0], [PI / 2, 1], [PI, 0], [3 * PI / 2, -1], [2 * PI, 0]], shape: 1,
      lim: ['osc', 'osc'], dom: 'R', rng: 'unit', periodic: true, inv: null },
    piecewise: { name: 'Piecewise', tex: '\\begin{cases} x + 2 & x < 0 \\\\ 1 - \\frac{x}{2} & x \\ge 0 \\end{cases}',
      f: function(u){ return u < 0 ? u + 2 : 1 - u / 2; }, keys: [[-2, 0], [-1, 1], [0, 2], [0, 1], [2, 0]], open: [2], shape: 1,
      lim: ['-inf', '-inf'], dom: 'R', rng: 'piece', jump: 0,
      inv: function(c){ var out = []; if(c - 2 < 0) out.push(c - 2); if(2 * (1 - c) >= 0) out.push(2 * (1 - c)); return out; } }
  };
  var ORDER = ['linear', 'quadratic', 'cubic', 'absolute', 'sqrt', 'reciprocal', 'piecewise', 'exponential', 'logarithmic', 'sine'];

  function fam(id){ return typeof id === 'string' ? FAMILIES[id] : id; }
  function gval(id, p, x){ var F = fam(id), v = F.f(p.b * (x - p.h)); return isFinite(v) ? p.a * v + p.k : NaN; }
  function image(p, pt){ return [pt[0] / p.b + p.h, p.a * pt[1] + p.k]; }
  /* The parameters that put a parent point at (x, y): the second handle. */
  function fromShape(id, p, x, y){
    var F = fam(id), u = F.keys[F.shape][0], v = F.keys[F.shape][1];
    return { a: (y - p.k) / v, b: u / (x - p.h) };
  }

  /* Exact zeros of g in [lo, hi] (sine: every zero in the window). */
  function zeros(id, p, win){
    var F = fam(id), c = -p.k / p.a, us = [];
    if(F.periodic){
      if(Math.abs(c) > 1 + 1e-12) return [];
      var base = Math.asin(Math.max(-1, Math.min(1, c))), cand = [base, PI - base];
      var lo = Math.min(p.b * (win[0] - p.h), p.b * (win[1] - p.h)), hi = Math.max(p.b * (win[0] - p.h), p.b * (win[1] - p.h));
      cand.forEach(function(u0){ for(var j = Math.floor((lo - u0) / (2 * PI)) - 1; u0 + 2 * PI * j <= hi + 1e-9; j++){ var u = u0 + 2 * PI * j; if(u >= lo - 1e-9) us.push(u); } });
    } else us = F.inv(c);
    var xs = us.map(function(u){ return u / p.b + p.h; }).filter(function(x){ return x >= win[0] - 1e-9 && x <= win[1] + 1e-9 && Math.abs(gval(id, p, x)) < 1e-7 * Math.max(1, Math.abs(p.k)); });
    xs.sort(function(s, t){ return s - t; });
    return xs.filter(function(x, i){ return !i || Math.abs(x - xs[i - 1]) > 1e-9; });
  }
  /* End behavior. x → +∞ sends u = b(x - h) to sign(b)·∞. */
  function limOf(F, side, p){
    var L = F.lim[side];
    if(L === null || L === 'osc') return L;
    if(L === 'inf' || L === '-inf') return (L === 'inf') === (p.a > 0) ? 'inf' : '-inf';
    return p.a * L + p.k;
  }
  function ends(id, p){
    var F = fam(id);
    return { pos: limOf(F, p.b > 0 ? 1 : 0, p), neg: limOf(F, p.b > 0 ? 0 : 1, p) };
  }
  /* Vertical asymptotes: x = h, with the limit from each side that exists. */
  function vas(id, p){
    var F = fam(id);
    if(!F.va) return [];
    if(id === 'reciprocal' || F === FAMILIES.reciprocal){
      var right = sgn(p.a) * sgn(p.b) > 0 ? 'inf' : '-inf';
      return [{ x: p.h, right: right, left: right === 'inf' ? '-inf' : 'inf' }];
    }
    // log: only the side where b(x - h) > 0; there log → -∞
    var v = p.a > 0 ? '-inf' : 'inf';
    return [p.b > 0 ? { x: p.h, right: v, left: null } : { x: p.h, right: null, left: v }];
  }
  function has(id, p){
    var F = fam(id);
    if(!F.ha) return [];
    var e = ends(id, p), out = [];
    if(typeof e.neg === 'number') out.push({ y: e.neg, side: 'neg' });
    if(typeof e.pos === 'number') out.push({ y: e.pos, side: 'pos' });
    return out.length === 2 && Math.abs(out[0].y - out[1].y) < 1e-12 ? [{ y: out[0].y, side: 'both' }] : out;
  }
  function limVal(L){ return L === 'inf' ? '\\infty' : L === '-inf' ? '-\\infty' : nt(L); }
  /* \lim_{x \to ...} g(x) = ...  (to: 'inf' | '-inf' | a number; side '+' or '-') */
  function limTex(to, L, side, name){
    var t = to === 'inf' ? '\\infty' : to === '-inf' ? '-\\infty' : nt(to) + (side ? '^' + side : '');
    return '\\lim_{x \\to ' + t + '} ' + (name || 'g') + '(x) = ' + limVal(L);
  }
  /* Domain and range in interval notation (TeX). */
  function iv(lo, hi, lc, hc){ return (lc ? '[' : '(') + (lo === -INF ? '-\\infty' : nt(lo)) + ', ' + (hi === INF ? '\\infty' : nt(hi)) + (hc ? ']' : ')'); }
  var ALL = '(-\\infty, \\infty)';
  function domain(id, p){
    var F = fam(id), h = p.h;
    if(F.dom === 'R') return ALL;
    if(F.dom === 'nonzero') return iv(-INF, h) + ' \\cup ' + iv(h, INF);
    var closed = F.dom === 'nonneg';
    return p.b > 0 ? iv(h, INF, closed, false) : iv(-INF, h, false, closed);
  }
  function range(id, p){
    var F = fam(id), k = p.k, a = p.a;
    switch(F.rng){
      case 'R': return ALL;
      case 'nonneg': return a > 0 ? iv(k, INF, true) : iv(-INF, k, false, true);
      case 'pos': return a > 0 ? iv(k, INF) : iv(-INF, k);
      case 'nonzero': return iv(-INF, k) + ' \\cup ' + iv(k, INF);
      case 'unit': return iv(k - Math.abs(a), k + Math.abs(a), true, true);
      case 'piece': return a > 0 ? iv(-INF, 2 * a + k) : iv(2 * a + k, INF);
    }
    return ALL;
  }

  /* The transformations in words, in the order they act on the parent:
     inside (the input) b then h, outside (the output) a then k. Each
     { key, text }; key names the parameter, so the page can tint it. */
  function frac(x){ var t = nt(x); return t.indexOf('\\frac') === 0 ? t.replace(/\\frac\{(\d+)\}\{(\d+)\}/, '$1/$2') : t; }
  function steps(p){
    var out = [], ab = Math.abs(p.b), aa = Math.abs(p.a);
    if(Math.abs(ab - 1) > 1e-9) out.push({ key: 'b', text: 'a horizontal dilation by a factor of ' + frac(1 / ab) + (ab > 1 ? ' (narrower)' : ' (wider)') });
    if(p.b < 0) out.push({ key: 'b', text: 'a reflection over the y-axis' });
    if(Math.abs(p.h) > 1e-9) out.push({ key: 'h', text: 'a horizontal translation ' + n(Math.abs(p.h)) + (Math.abs(Math.abs(p.h) - 1) < 1e-9 ? ' unit ' : ' units ') + (p.h > 0 ? 'right' : 'left') });
    if(Math.abs(aa - 1) > 1e-9) out.push({ key: 'a', text: 'a vertical dilation by a factor of ' + frac(aa) + (aa > 1 ? ' (taller)' : ' (flatter)') });
    if(p.a < 0) out.push({ key: 'a', text: 'a reflection over the x-axis' });
    if(Math.abs(p.k) > 1e-9) out.push({ key: 'k', text: 'a vertical translation ' + n(Math.abs(p.k)) + (Math.abs(Math.abs(p.k) - 1) < 1e-9 ? ' unit ' : ' units ') + (p.k > 0 ? 'up' : 'down') });
    return out;
  }
  function sentence(p){
    var s = steps(p);
    if(!s.length) return 'g is the parent function f itself: no transformation.';
    var t = s.map(function(x){ return x.text; });
    return 'g is the graph of f after ' + (t.length === 1 ? t[0] : t.slice(0, -1).join(', ') + ' and ' + t[t.length - 1]) + '.';
  }

  /* g in student syntax (for ApPrecalcExpr) and in TeX. */
  function inner(p, tex){
    var h = Math.abs(p.h) < 1e-9 ? '' : (p.h > 0 ? ' - ' : ' + ') + (tex ? nt(Math.abs(p.h)) : n(Math.abs(p.h)));
    var xh = 'x' + h, b = p.b;
    if(Math.abs(b - 1) < 1e-9) return { s: xh, wrap: !!h };
    var bs = Math.abs(b + 1) < 1e-9 ? '-' : tex ? nt(b) : n(b);
    return { s: bs + (h ? '(' + xh + ')' : 'x'), wrap: true };
  }
  function str(id, p){
    var I = inner(p, false), u = I.s, pu = '(' + u + ')', body;
    switch(id){
      case 'linear': body = pu; break;
      case 'quadratic': body = pu + '^2'; break;
      case 'cubic': body = pu + '^3'; break;
      case 'absolute': body = '|' + u + '|'; break;
      case 'sqrt': body = 'sqrt(' + u + ')'; break;
      case 'reciprocal': body = '1/' + pu; break;
      case 'exponential': body = '2^' + pu; break;
      case 'logarithmic': body = 'log_2' + pu; break;
      case 'sine': body = 'sin' + pu; break;
      default: return '';
    }
    var a = Math.abs(p.a - 1) < 1e-9 ? '' : Math.abs(p.a + 1) < 1e-9 ? '-' : n(p.a) + (id === 'exponential' ? '*' : '');
    if(id === 'reciprocal' && a && a !== '-'){ a = ''; body = n(p.a) + '/' + pu; }
    var k = Math.abs(p.k) < 1e-9 ? '' : (p.k > 0 ? ' + ' : ' - ') + n(Math.abs(p.k));
    return a + body + k;
  }
  function tex(id, p, name){
    var I = inner(p, true), u = I.s, pu = I.wrap ? '(' + u + ')' : u, body;
    switch(id){
      case 'linear': body = I.wrap ? '(' + u + ')' : u; break;
      case 'quadratic': body = (I.wrap ? '(' + u + ')' : u) + '^{2}'; break;
      case 'cubic': body = (I.wrap ? '(' + u + ')' : u) + '^{3}'; break;
      case 'absolute': body = '\\left|' + u + '\\right|'; break;
      case 'sqrt': body = '\\sqrt{' + u + '}'; break;
      case 'reciprocal': body = '\\frac{1}{' + u + '}'; break;
      case 'exponential': body = '2^{' + u + '}'; break;
      case 'logarithmic': body = '\\log_{2}' + '(' + u + ')'; break;
      case 'sine': body = '\\sin(' + u + ')'; break;
      default: body = 'f(' + u + ')';
    }
    var a = Math.abs(p.a - 1) < 1e-9 ? '' : Math.abs(p.a + 1) < 1e-9 ? '-' : nt(p.a) + (id === 'exponential' || id === 'reciprocal' ? ' \\cdot ' : '');
    if(id === 'reciprocal' && a && a !== '-'){ a = ''; body = '\\frac{' + nt(p.a) + '}{' + u + '}'; }
    var k = Math.abs(p.k) < 1e-9 ? '' : (p.k > 0 ? ' + ' : ' - ') + nt(Math.abs(p.k));
    return (name ? name + '(x) = ' : '') + a + body + k;
  }

  /* ------------------------------------------------------- the drill */
  function distinct(list, pool){
    var seen = [], spare = (pool || []).slice();
    return list.map(function(o){
      while(seen.indexOf(o[0]) > -1 && spare.length) o = spare.shift();
      seen.push(o[0]); return o;
    });
  }
  function choice(key, label, list, practice){
    return { key: key, kind: 'choice', label: H(label), options: list.map(function(o){ return optHtml(o[0]); }), why: list.map(function(o){ return H(o[1]); }), correct: 0, practice: practice || '3.A' };
  }
  function numStep(key, label, answer, mistakes, o){
    o = o || {};
    var whole = Math.abs(answer - Math.round(answer)) < 1e-9;
    return { key: key, kind: 'num', label: H(label), unit: o.unit || '', practice: o.practice || '2.A', d: whole ? 0 : 3,
      hint: whole ? '' : 'Exact (like 7/2) or to three decimal places.',
      cell: M.cell(answer, 6e-4, (mistakes || []).map(function(m){ return { value: m[0], why: H(m[1]) }; }), 6e-4) };
  }
  function exprStep(key, label, lhs, answer, mistakes, dom, practice){
    return { key: key, kind: 'expr', label: H(label), lhs: lhs, practice: practice || '1.C',
      cell: M.exprCell(answer, { vars: ['x'], domain: dom || [-5, 5], mistakes: (mistakes || []).filter(function(m, i, all){ return m[0] !== answer && all.findIndex(function(o){ return o[0] === m[0]; }) === i; }).map(function(m){ return { expr: m[0], why: m[1] }; }) }) };
  }
  function pt(x, y){ return '(' + nt(x) + ', ' + nt(y) + ')'; }
  var GEN = {};

  /* Read a, h and k off a graph: vertex (or corner) and one more point. */
  GEN.identify = function(r){
    var id = r.pick(['quadratic', 'quadratic', 'absolute', 'sqrt', 'cubic']), F = FAMILIES[id];
    var a = r.pick([-3, -2, -1, -0.5, 0.5, 2, 3]), h = r.nonzero(-4, 4), k = r.int(-4, 4);
    if(id === 'sqrt' && Math.abs(a) === 0.5) a = a * 4;   // a point with whole coordinates
    var p = { a: a, b: 1, h: h, k: k }, u1 = id === 'sqrt' ? 4 : id === 'quadratic' && Math.abs(a) === 0.5 ? 2 : 1, q = image(p, [u1, F.f(u1)]);
    var what = { quadratic: 'vertex', absolute: 'vertex', sqrt: 'starting point', cubic: 'point of symmetry' }[id];
    var text = H('<p>The graph of $g$ is a transformation of $f(x) = ' + F.tex + '$, of the form $g(x) = a\\,f(x - h) + k$. Its ' + what + ' is at $' + pt(h, k) + '$ and it passes through $' + pt(q[0], q[1]) + '$.</p>');
    var rise = q[1] - k, run = q[0] - h;
    var steps = [
      numStep('h', 'What is $h$?', h, [[-h, 'The ' + what + ' sits at $x = ' + n(h) + '$. In $x - h$ that is $h = ' + n(h) + '$: $x - (' + n(h) + ')$' + (h < 0 ? ' $= x + ' + n(-h) + '$' : '') + '.'], [k, 'That is the $y$-coordinate of the ' + what + ', which is $k$.']]),
      numStep('k', 'What is $k$?', k, [[-k, 'The ' + what + ' is at height $' + n(k) + '$, and $+ k$ moves the graph up by $k$: $k = ' + n(k) + '$.'], [h, 'That is the $x$-coordinate of the ' + what + ', which is $h$.']]),
      numStep('a', 'What is $a$?', a, [[q[1], 'Measure from the ' + what + ', not from the axis: the change in height is $' + n(q[1]) + ' - (' + n(k) + ') = ' + n(rise) + '$.'], [-a, 'Check the sign: from the ' + what + ' to the other point the graph goes ' + (rise > 0 ? 'up' : 'down') + '.'], [1 / a, 'Divide the change in height by $f(' + n(run) + ') = ' + n(F.f(run)) + '$, not the other way round.']], { practice: '2.A' }),
      exprStep('g', 'Write $g(x)$.', 'g(x) =', str(id, p), [[str(id, { a: a, b: 1, h: -h, k: k }), 'The sign of h: a shift right by ' + n(Math.abs(h)) + ' is x − ' + n(Math.abs(h)) + ' when h > 0 (here h = ' + n(h) + ').'], [str(id, { a: a, b: 1, h: h, k: -k }), 'The vertical shift: + k moves the graph up, so k = ' + n(k) + '.'], [str(id, { a: -a, b: 1, h: h, k: k }), 'The sign of a: a < 0 turns the graph upside down.']], id === 'sqrt' ? [h + 0.05, h + 6] : [h - 4, h + 4])
    ];
    var sol = ['The ' + what + ' of $f$ is $(0, 0)$; it moved to $' + pt(h, k) + '$, so $h = ' + n(h) + '$ and $k = ' + n(k) + '$.',
      'From the ' + what + ', $' + n(run) + '$ to the right, the graph of $g$ changes by $' + n(rise) + '$; the graph of $f$ changes by $f(' + n(run) + ') = ' + n(F.f(run)) + '$. So $a = ' + n(rise) + ' \\div ' + n(F.f(run)) + ' = ' + nt(a) + '$.',
      '$' + tex(id, p, 'g') + '$.'];
    return { text: text, steps: steps, solution: sol, fig: { fam: id, p: p, pts: [[h, k], q], show: true, label: 'Graph of g, a transformation of f(x) = ' + F.name.toLowerCase() }, values: { fam: id, p: p, q: q } };
  };

  /* Where does a point of f go? (x, y) -> (x/b + h, a y + k). */
  GEN.pointMap = function(r){
    var b = r.pick([2, -2, 3, 0.5, -1, 1]), a = r.pick([2, 3, -2, -1, 0.5, -3]), h = r.nonzero(-4, 4), k = r.nonzero(-5, 5);
    var px = b === 0.5 ? r.nonzero(-3, 3) : Math.abs(b) * r.nonzero(-3, 3), py = a === 0.5 ? 2 * r.nonzero(-3, 3) : r.nonzero(-4, 4);
    var p = { a: a, b: b, h: h, k: k }, q = image(p, [px, py]);
    var gx = 'g(x) = ' + (a === 1 ? '' : a === -1 ? '-' : nt(a)) + 'f\\left(' + (b === 1 ? 'x' : (b === -1 ? '-' : nt(b)) + '(x') + (h > 0 ? ' - ' : ' + ') + n(Math.abs(h)) + (b === 1 ? '' : ')') + '\\right)' + (k > 0 ? ' + ' : ' - ') + n(Math.abs(k));
    var text = H('<p>The point $' + pt(px, py) + '$ is on the graph of $f$. Let $' + gx + '$. Which point must be on the graph of $g$?</p>');
    var steps = [
      numStep('x', 'The $x$-coordinate of the new point.', q[0], [[b * px + h, 'Inside the function, b multiplies x, so the graph is squeezed: divide by $b$. Solve $' + (b === 1 ? '' : nt(b)) + '(x - (' + n(h) + ')) = ' + n(px) + '$.'], [px / b - h, 'The input is $x - h$ with $h = ' + n(h) + '$: solve for $x$, which adds $h$.'], [px + h, 'Undo the inside in order: divide by $b = ' + nt(b) + '$, then add $h = ' + n(h) + '$.']], { practice: '2.B' }),
      numStep('y', 'The $y$-coordinate of the new point.', q[1], [[a * (py + k), 'Multiply first, then add: $a \\cdot ' + n(py) + ' + k$, not $a(' + n(py) + ' + k)$.'], [py / a + k, 'Outside the function, $a$ multiplies the output: $' + nt(a) + ' \\cdot ' + n(py) + '$.'], [a * py - k, 'Add $k = ' + n(k) + '$ as written.']], { practice: '2.B' })
    ];
    var sol = ['Inside: solve $' + (b === 1 ? '' : nt(b)) + '(x - (' + n(h) + ')) = ' + n(px) + '$, so $x = ' + n(px) + ' \\div ' + nt(b) + ' + (' + n(h) + ') = ' + nt(q[0]) + '$.',
      'Outside: $y = ' + nt(a) + ' \\cdot ' + n(py) + ' + (' + n(k) + ') = ' + nt(q[1]) + '$.',
      'The point $' + pt(q[0], q[1]) + '$ is on the graph of $g$.'];
    return { text: text, steps: steps, solution: sol, fig: { grid: true, from: [px, py], to: q, label: 'Coordinate grid with the point on the graph of f' }, values: { p: p, from: [px, py], to: q } };
  };

  /* Describe the change: factor b out first (f(2x + 6) = f(2(x + 3))).
     Each option carries the parameters it describes, so the page can draw
     the student's pick beside the right one. */
  GEN.describe = function(r){
    var id = r.pick(['quadratic', 'absolute', 'sqrt']), F = FAMILIES[id];
    var b = r.pick([2, 3, 0.5, 1, -1]), h = r.nonzero(-3, 3), a = r.pick([2, 3, -1, -2, 0.5]), k = r.nonzero(-4, 4);
    if(b === 1 && r() < 0.5) b = 2;
    var p = { a: a, b: b, h: h, k: k }, c = -b * h;   // b(x - h) = bx + c
    var bT = b === 1 ? '' : b === -1 ? '-' : nt(b);
    var insideTex = (b === 1 ? 'x' : bT + 'x') + (c > 0 ? ' + ' : ' - ') + nt(Math.abs(c));
    var factored = bT + '(x ' + (h > 0 ? '- ' : '+ ') + n(Math.abs(h)) + ')';
    var gx = 'g(x) = ' + (a === 1 ? '' : a === -1 ? '-' : nt(a)) + 'f(' + insideTex + ')' + (k > 0 ? ' + ' : ' - ') + n(Math.abs(k));
    var text = H('<p>Let $f(x) = ' + F.tex + '$ and $' + gx + '$. Describe how the graph of $g$ comes from the graph of $f$.</p>');
    function words(pp, part){ return steps(pp).filter(function(s){ return part === 'in' ? s.key === 'b' || s.key === 'h' : s.key === 'a' || s.key === 'k'; }).map(function(s){ return s.text; }).join(', then '); }
    function opt(pp, part, why){ return [cap(words(pp, part)) + '.', why, pp]; }
    var flipWhy = 'Inside the function the shift goes against the sign: $x ' + (h > 0 ? '- ' : '+ ') + n(Math.abs(h)) + '$ moves the graph ' + (h > 0 ? 'right' : 'left') + '.';
    var inR = { a: 1, b: b, h: h, k: 0 };
    var optsH = distinct([
      opt(inR, 'in', 'Right: factor first, $' + insideTex + ' = ' + factored + '$, so $h = ' + n(h) + '$' + (Math.abs(b) !== 1 ? ' and the dilation factor is $\\frac{1}{|b|} = ' + nt(1 / Math.abs(b)) + '$' : '') + '.'),
      Math.abs(b) !== 1 ? opt({ a: 1, b: b, h: -c, k: 0 }, 'in', 'Factor $b$ out first: $' + insideTex + ' = ' + factored + '$. The shift is $' + n(Math.abs(h)) + '$, not $' + n(Math.abs(c)) + '$.') : opt({ a: 1, b: b, h: -h, k: 0 }, 'in', flipWhy),
      opt({ a: 1, b: b, h: -h, k: 0 }, 'in', flipWhy),
      Math.abs(b) !== 1 ? opt({ a: 1, b: 1 / b, h: h, k: 0 }, 'in', 'A factor $b$ inside makes the graph $|b|$ times narrower: the dilation factor is $\\frac{1}{|b|} = ' + nt(1 / Math.abs(b)) + '$.')
        : ['A vertical translation ' + n(Math.abs(h)) + ' units ' + (h > 0 ? 'up' : 'down') + '.', 'A change inside $f(\\ldots)$ acts on the input, so it moves the graph sideways, not up or down.', { a: 1, b: 1, h: 0, k: h }]
    ], [['A vertical translation ' + n(Math.abs(h)) + ' units ' + (h > 0 ? 'down' : 'up') + '.', 'A change inside $f(\\ldots)$ acts on the input, so it moves the graph sideways.', { a: 1, b: 1, h: 0, k: -h }],
      opt({ a: 1, b: -b, h: h, k: 0 }, 'in', 'Check the sign of $b$: $b = ' + nt(b) + '$' + (b < 0 ? ' reflects the graph over the y-axis.' : ' does not reflect it.'))]);
    var outR = { a: a, b: 1, h: 0, k: k };
    var optsV = distinct([
      opt(outR, 'out', 'Right: outside the function, $a = ' + nt(a) + '$ multiplies every output, then $k = ' + n(k) + '$ is added.'),
      opt({ a: a, b: 1, h: 0, k: -k }, 'out', 'Outside the function the sign is read as written: $' + (k > 0 ? '+ ' : '- ') + n(Math.abs(k)) + '$ moves the graph ' + (k > 0 ? 'up' : 'down') + '.'),
      Math.abs(Math.abs(a) - 1) > 1e-9 ? opt({ a: 1 / a, b: 1, h: 0, k: k }, 'out', 'Outside, $a$ multiplies the outputs directly: the factor is $|a| = ' + nt(Math.abs(a)) + '$, not its reciprocal.')
        : opt({ a: -a, b: 1, h: 0, k: k }, 'out', 'Check the sign of $a$: $a = ' + nt(a) + '$ reflects the graph over the x-axis.'),
      opt({ a: -a, b: 1, h: 0, k: k }, 'out', 'Check the sign of $a$: $a = ' + nt(a) + '$' + (a < 0 ? ' reflects the graph over the x-axis.' : ' does not reflect it.'))
    ], [[cap(words({ a: Math.abs(a), b: 1, h: 0, k: k }, 'out').replace(/^a vertical translation/, 'a reflection over the y-axis, then a vertical translation').replace(/^(a vertical dilation[^,]*)/, '$1, then a reflection over the y-axis')) + '.', 'A negative factor outside $f$ flips the outputs: the reflection is over the x-axis, not the y-axis.', { a: Math.abs(a), b: -1, h: 0, k: k }]]);
    var stepsOut = [choice('in', 'What do the changes inside $f$ do?', optsH, '3.A'), choice('out', 'What do the changes outside $f$ do?', optsV, '3.A')];
    var picks = { in: optsH.map(function(o){ return o[2]; }), out: optsV.map(function(o){ return o[2]; }) };
    var sol = ['Factor the inside: $' + insideTex + ' = ' + factored + '$, so $b = ' + nt(b) + '$ and $h = ' + n(h) + '$.',
      'Inside (the input): ' + words(p, 'in') + '.', 'Outside (the output): ' + words(p, 'out') + '.', 'So $' + tex(id, p, 'g') + '$.'];
    return { text: text, steps: stepsOut, solution: sol, fig: { fam: id, p: p, parentOnly: true, label: 'Graph of the parent f(x) = ' + F.name.toLowerCase() }, values: { fam: id, p: p, c: c, picks: picks } };
  };
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  /* g(x) = a/(x - h) + k: asymptotes in limit notation. */
  GEN.rational = function(r){
    var a = r.nonzero(-4, 4), h = r.nonzero(-4, 4), k = r.nonzero(-3, 3), p = { a: a, b: 1, h: h, k: k };
    var V = vas('reciprocal', p)[0], E = ends('reciprocal', p);
    var text = H('<p>Let $g(x) = \\frac{' + n(a) + '}{x ' + (h > 0 ? '- ' : '+ ') + n(Math.abs(h)) + '} ' + (k > 0 ? '+ ' : '- ') + n(Math.abs(k)) + '$.</p>');
    var oneSided = limTex(h, V.right, '+'), wrongSide = limTex(h, V.left, '+');
    var steps = [
      numStep('va', 'The vertical asymptote is $x = c$. What is $c$?', h, [[-h, 'The denominator is $0$ where $x ' + (h > 0 ? '- ' : '+ ') + n(Math.abs(h)) + ' = 0$, at $x = ' + n(h) + '$.'], [k, 'That is the horizontal asymptote. The vertical one is where the denominator is $0$.']], { practice: '2.A' }),
      numStep('ha', 'The horizontal asymptote is $y = d$. What is $d$?', k, [[a, 'As $x$ grows, the fraction goes to $0$, so $g$ goes to the added constant, $' + n(k) + '$.'], [-k, 'The constant is added as written: $' + (k > 0 ? '+ ' : '- ') + n(Math.abs(k)) + '$.'], [h, 'That is the vertical asymptote.']], { practice: '2.A' }),
      choice('right', 'Which describes $g$ just to the right of the vertical asymptote?', [
        ['$' + oneSided + '$', 'Right: for $x$ a little more than $' + n(h) + '$ the denominator is small and positive, and the numerator is $' + n(a) + '$.'],
        ['$' + wrongSide + '$', 'Check the signs: just right of $x = ' + n(h) + '$ the denominator is positive, and the numerator is $' + n(a) + '$.'],
        ['$' + limTex(h, k, '+') + '$', 'Near the vertical asymptote the outputs grow without bound. They approach $' + n(k) + '$ only as $x \\to \\pm\\infty$.'],
        ['As $x$ gets close to $' + n(h) + '$, $g$ gets very large.', 'Write it in limit notation, with the side and the sign: the exam takes the point for $\\lim_{x \\to c^+} g(x) = \\pm\\infty$.']
      ], '3.A'),
      choice('end', 'Which describes the end behavior of $g$ as $x$ increases without bound?', [
        ['$' + limTex('inf', E.pos) + '$', 'Right: the fraction goes to $0$, so the outputs approach $' + n(k) + '$.'],
        ['$' + limTex('inf', 0) + '$', 'The fraction goes to $0$, but the constant ' + n(k) + ' is still added.'],
        ['$' + limTex('inf', a > 0 ? 'inf' : '-inf') + '$', 'The numerator is a constant and the denominator grows, so the fraction shrinks to $0$.'],
        ['As $x$ gets large, $g$ gets close to $' + n(k) + '$.', 'True, but say it in limit notation: $\\lim_{x \\to \\infty} g(x) = ' + n(k) + '$.']
      ], '3.A')
    ];
    var sol = ['The denominator is $0$ at $x = ' + n(h) + '$ and the numerator is not, so $x = ' + n(h) + '$ is a vertical asymptote.',
      'Just to the right, $x - (' + n(h) + ')$ is small and positive, so $\\frac{' + n(a) + '}{x - (' + n(h) + ')}$ is ' + (a > 0 ? 'large and positive' : 'large and negative') + ': $' + oneSided + '$ and $' + limTex(h, V.left, '-') + '$.',
      'As $x \\to \\pm\\infty$ the fraction goes to $0$: $' + limTex('inf', k) + '$ and $' + limTex('-inf', k) + '$, so $y = ' + n(k) + '$ is the horizontal asymptote.'];
    return { text: text, steps: steps, solution: sol, fig: { fam: 'reciprocal', p: p, show: false, label: 'Coordinate plane for the graph of g' }, values: { p: p, V: V, E: E } };
  };

  /* g(x) = a 2^(x - h) + k: asymptote, end behavior, the zero. */
  GEN.exponential = function(r){
    var a = r.pick([1, 2, -1, -2, 3, -3]), h = r.int(-3, 3), m = r.int(-1, 3), k = -a * Math.pow(2, m), p = { a: a, b: 1, h: h, k: k };
    if(r() < 0.25){ k = a > 0 ? r.int(1, 3) : -r.int(1, 3); p.k = k; }   // no zero: a and k have the same sign
    var E = ends('exponential', p), Z = zeros('exponential', p, [-50, 50]);
    var text = H('<p>Let $' + tex('exponential', p, 'g') + '$.</p>');
    var steps = [
      numStep('ha', 'The horizontal asymptote is $y = d$. What is $d$?', k, [[0, 'The parent $2^x$ has the asymptote $y = 0$; adding $' + n(k) + '$ moves it.'], [-k, 'The constant is added as written.'], [a, 'The asymptote is the added constant, not the factor in front.']], { practice: '2.A' }),
      choice('neg', 'Which describes $g$ as $x$ decreases without bound?', distinct([
        ['$' + limTex('-inf', E.neg) + '$', 'Right: $2^{x - h}$ goes to $0$, so $g$ approaches $' + n(k) + '$.'],
        ['$' + limTex('-inf', 0) + '$', '$2^{x - h} \\to 0$, but $' + n(k) + '$ is still added.'],
        ['$' + limTex('-inf', '-inf') + '$', 'For very negative $x$, $2^{x - h}$ is a tiny positive number: the outputs level off.'],
        ['As $x$ gets very negative, $g$ levels off near $' + n(k) + '$.', 'True, but say it in limit notation: $' + limTex('-inf', k) + '$.']
      ], [['$' + limTex('-inf', 'inf') + '$', 'For very negative $x$, $2^{x - h}$ is a tiny positive number: the outputs level off at $' + n(k) + '$.']]), '3.A'),
      Z.length ? numStep('zero', 'Solve $g(x) = 0$.', Z[0], [[m, 'You solved $2^{x} = ' + n(-k / a) + '$; the input is $x ' + (h > 0 ? '- ' : '+ ') + n(Math.abs(h)) + '$, so add $' + n(h) + '$.'], [h - m, 'From $2^{x - h} = 2^{' + m + '}$, $x - h = ' + m + '$, so $x = ' + m + ' + (' + n(h) + ')$.'], [h + Math.log2(Math.abs(k)), 'Divide by $a = ' + n(a) + '$ before taking the log: $2^{x - h} = ' + n(-k / a) + '$.']], { practice: '1.A' })
        : choice('zero', 'How many zeros does $g$ have?', [['None: $g(x) = 0$ has no solution.', 'Right: $' + n(a) + ' \\cdot 2^{x - h}$ ' + (a > 0 ? 'is always positive' : 'is always negative') + ' and $k = ' + n(k) + '$ has the same sign, so their sum is never $0$.'], ['Exactly one, as every exponential function has.', 'Solving gives $2^{x - h} = ' + n(-k / a) + '$, and a power of $2$ is never negative.'], ['Two.', 'An exponential function is always increasing or always decreasing, so it takes the value $0$ at most once.'], ['Infinitely many.', 'An exponential function is always increasing or always decreasing, so it takes any value at most once.']], '3.A')
    ];
    var sol = ['$2^{x - h} > 0$ always and $2^{x - h} \\to 0$ as $x \\to -\\infty$, so $' + limTex('-inf', k) + '$: the asymptote is $y = ' + n(k) + '$.',
      'As $x \\to \\infty$, $2^{x - h} \\to \\infty$, so $' + limTex('inf', E.pos) + '$.',
      Z.length ? '$' + n(a) + ' \\cdot 2^{x - h} = ' + n(-k) + '$ gives $2^{x - h} = ' + n(-k / a) + ' = 2^{' + m + '}$, so $x - (' + n(h) + ') = ' + m + '$ and $x = ' + n(Z[0]) + '$.' : '$g(x) = 0$ needs $2^{x - h} = ' + n(-k / a) + '$, which is negative: no solution.'];
    return { text: text, steps: steps, solution: sol, fig: { fam: 'exponential', p: p, show: false, label: 'Coordinate plane for the graph of g' }, values: { p: p, E: E, Z: Z } };
  };

  var KINDS = ['identify', 'pointMap', 'describe', 'rational', 'exponential'];
  var TITLE = { identify: 'Read the transformation from a graph', pointMap: 'Where a point goes', describe: 'Describe the transformation', rational: 'Asymptotes in limit notation', exponential: 'Exponential: asymptote, ends and zero' };
  function generate(r, ctx, type){
    var kind = type || ctx.kind;
    if(!GEN[kind]) throw new Error('function-lab: no problem kind "' + kind + '"');
    var p = GEN[kind](r);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = kind; p.title = TITLE[kind];
    p.solution = p.solution.map(H);
    return p;
  }

  M.register('functionLab', {
    FAMILIES: FAMILIES, ORDER: ORDER, KINDS: KINDS, TITLE: TITLE,
    g: gval, image: image, fromShape: fromShape, zeros: zeros, ends: ends, vas: vas, has: has, domain: domain, range: range,
    steps: steps, sentence: sentence, limTex: limTex, str: str, tex: tex, n: n, nt: nt, exactish: exactish, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
