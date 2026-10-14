/* Rule drills model: ApCalcMath.ruleDrills (docs/apcalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apcalc-tool-checks/rule-drills.mjs) and the test
   (scripts/test/apcalc-tool-rule-drills.test.mjs) run exactly this code.

   Loaded after calc-expr.js (ApCalcExpr, whose parse trees this file reads
   and builds) and calc-tool-math.js, before calculus/assets/tools/rule-drills.js.

   The rule picker (Explore):
     analyze(str) -> { ok, error?, tree, tex, node, steps, d, dtex, dstr }
       node   the expression as a structure: { rule, name, tex, dtex, kids:
              [{ role, node }], outer? } where rule is one of constant, x,
              power, sum, multiple, product, quotient, chain, basic, exp,
              logdiff and role one of u, v, top, bottom, outer, inner, term,
              factor
       steps  the rules in the order they are used (outermost first)
       d      the derivative as a tree, simplified; dtex its TeX; dstr it
              in the syntax students type
     deriv(tree) -> tree (unsimplified); simplify(tree) -> tree; str(tree)
   Test yourself:
     generate(rng, ctx, type) -> { ctx, type, topic, text, fig, steps,
       solution, meta } where every expr step carries `check` (what its key
       must equal, so the validator can recompute it numerically) and the
       figure is { tree: 'f string' } (drawn by the page with analyze),
       { implicit }, { inverse } or { graphs }.
   Text holds TeX between dollar signs; the page renders it (ApCalcTex). */
(function(){
  'use strict';
  var M = window.ApCalcMath, X = window.ApCalcExpr;
  if(!M || !X) return;

  /* ================================================== trees */
  function num(v){ return { k: 'num', v: v }; }
  function vr(n){ return { k: 'var', v: n || 'x' }; }
  function cst(n){ return { k: 'const', v: n }; }
  function add(a, b){ return { k: 'add', a: a, b: b }; }
  function sub(a, b){ return { k: 'sub', a: a, b: b }; }
  function mul(a, b){ return { k: 'mul', a: a, b: b }; }
  function div(a, b){ return { k: 'div', a: a, b: b }; }
  function pow(a, b){ return { k: 'pow', a: a, b: b }; }
  function neg(a){ return { k: 'neg', a: a }; }
  function fn(f, a){ return { k: 'fn', f: f, a: a }; }
  function un(n){ while(n && n.k === 'paren') n = n.a; return n; }
  function hasX(n){ n = un(n); if(!n) return false; if(n.k === 'var') return n.v === 'x'; return hasX(n.a) || hasX(n.b); }
  function isNum(n, v){ n = un(n); return n && n.k === 'num' && (v === undefined || Math.abs(n.v - v) < 1e-12); }
  /* A numeric constant subtree (numbers only, no pi or e): its value, or null. */
  function numVal(n){
    n = un(n);
    if(!n) return null;
    if(n.k === 'num') return n.v;
    if(n.k === 'neg'){ var a = numVal(n.a); return a === null ? null : -a; }
    if(n.k === 'div' || n.k === 'mul' || n.k === 'add' || n.k === 'sub'){
      var p = numVal(n.a), q = numVal(n.b);
      if(p === null || q === null) return null;
      return n.k === 'div' ? (q === 0 ? null : p / q) : n.k === 'mul' ? p * q : n.k === 'add' ? p + q : p - q;
    }
    if(n.k === 'pow'){ var b = numVal(n.a), e = numVal(n.b); if(b === null || e === null) return null; var r = Math.pow(b, e); return isFinite(r) && Math.abs(r - Math.round(r)) < 1e-9 ? r : null; }
    return null;
  }
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ var t = a % b; a = b; b = t; } return a; }
  // A number as a node: an integer, a small fraction p/q, else a decimal.
  function nn(v){
    if(v < 0) return neg(nn(-v));
    if(Math.abs(v - Math.round(v)) < 1e-9) return num(Math.round(v));
    for(var q = 2; q <= 12; q++){ var p = v * q; if(Math.abs(p - Math.round(p)) < 1e-9){ p = Math.round(p); var g = gcd(p, q); return div(num(p / g), num(q / g)); } }
    return num(v);
  }
  // b^e, written sin²(x) when b is a named function and e a whole number
  function mkPow(b, e){
    var o = pow(b, e), ev = numVal(e);
    if(b.k === 'fn' && ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'ln'].indexOf(b.f) > -1 && ev !== null && ev > 0 && Math.abs(ev - Math.round(ev)) < 1e-12) o.fnPow = true;
    return o;
  }
  function key(n){ return JSON.stringify(strip(n)); }
  function strip(n){ n = un(n); if(!n || typeof n !== 'object') return n; var o = { k: n.k }; if(n.v !== undefined) o.v = n.v; if(n.f) o.f = n.f; if(n.a) o.a = strip(n.a); if(n.b) o.b = strip(n.b); return o; }

  /* ---------------------------------------------- simplify */
  function factors(n, out){
    n = un(n);
    if(n.k === 'mul'){ factors(n.a, out); factors(n.b, out); }
    else if(n.k === 'neg'){ out.sign = -out.sign; factors(n.a, out); }
    else out.push(n);
    return out;
  }
  function build(list){ return list.reduce(function(a, b){ return a ? mul(a, b) : b; }, null); }
  function rank(f){ // number, then powers of x, then the rest in their order
    var b = f.k === 'pow' ? un(f.a) : f;
    return b.k === 'var' ? 1 : 2;
  }
  function simpMul(n){
    var fs = factors(n, Object.assign([], { sign: 1 })), sign = fs.sign, coef = 1, rest = [], dens = [];
    fs = fs.map(simplify);
    // simplifying a factor can expose a sign or a product
    var flat = [];
    fs.forEach(function(f){ var g = factors(f, Object.assign([], { sign: 1 })); sign *= g.sign; g.forEach(function(x){ flat.push(x); }); });
    flat.forEach(function(f){
      var v = numVal(f);
      if(v !== null){ coef *= v; return; }
      if(f.k === 'div'){ var nv = numVal(f.a); if(nv !== null){ coef *= nv; dens.push(f.b); return; } var top = factors(f.a, Object.assign([], { sign: 1 })); sign *= top.sign; top.forEach(function(t){ var tv = numVal(t); if(tv !== null) coef *= tv; else rest.push(t); }); dens.push(f.b); return; }
      rest.push(f);
    });
    if(coef === 0) return num(0);
    if(coef < 0){ coef = -coef; sign = -sign; }
    // x^a · x^b = x^(a+b) for powers of the same base with number exponents
    var merged = [];
    rest.forEach(function(f){
      var b = f.k === 'pow' ? f.a : f, e = f.k === 'pow' ? numVal(f.b) : 1;
      if(e === null){ merged.push({ b: f, e: null }); return; }
      var kb = key(b), hit = merged.filter(function(m){ return m.e !== null && m.kb === kb; })[0];
      if(hit) hit.e += e; else merged.push({ b: b, kb: kb, e: e });
    });
    rest = merged.filter(function(m){ return m.e === null || Math.abs(m.e) > 1e-12; }).map(function(m){ return m.e === null ? m.b : Math.abs(m.e - 1) < 1e-12 ? m.b : mkPow(m.b, nn(m.e)); });
    rest.sort(function(p, q){ return rank(p) - rank(q); });
    var body = build(rest), out;
    if(dens.length){
      var top = coef !== 1 && Math.abs(coef - Math.round(coef)) < 1e-9 ? (body ? mul(num(Math.round(coef)), body) : num(Math.round(coef))) : body || num(1);
      var den = dens.length === 1 ? dens[0] : build(dens);
      if(coef !== 1 && Math.abs(coef - Math.round(coef)) >= 1e-9){
        var c = nn(coef); // p/q
        if(c.k === 'div'){ top = body ? (c.a.v === 1 ? body : mul(c.a, body)) : c.a; den = mul(c.b, den); }
        else top = body ? mul(c, body) : c;
      }
      out = div(top, simplify(den));
    } else {
      out = coef === 1 ? (body || num(1)) : body ? (nn(coef).k === 'div' ? div(body ? mul(nn(coef).a, body) : nn(coef).a, nn(coef).b) : mul(nn(coef), body)) : nn(coef);
      if(out.k === 'div' && isNum(out.a, 1) === false && out.a.k === 'mul' && isNum(out.a.a, 1)) out = div(out.a.b, out.b);
    }
    return sign < 0 ? neg(out) : out;
  }
  /* top/bottom with common factors cancelled: powers of the same base
     (x³/x⁵ = 1/x², (x² + 1)/(x² + 1)³ = 1/(x² + 1)²) and number factors. */
  function cancel(t, b){
    var ft = factors(t, Object.assign([], { sign: 1 })), fb = factors(b, Object.assign([], { sign: 1 })), sign = ft.sign * fb.sign;
    var ct = 1, cb = 1, tops = [], bots = [];
    var split = function(f){ var e = f.k === 'pow' ? numVal(f.b) : 1; return e === null ? { b: f, e: null } : { b: f.k === 'pow' ? f.a : f, e: e }; };
    ft.forEach(function(f){ var v = numVal(f); if(v !== null) ct *= v; else tops.push(split(f)); });
    fb.forEach(function(f){ var v = numVal(f); if(v !== null) cb *= v; else bots.push(split(f)); });
    tops.forEach(function(p){
      if(p.e === null) return;
      var kb = key(p.b);
      bots.forEach(function(q){ if(q.e !== null && p.e > 0 && q.e > 0 && key(q.b) === kb){ var m = Math.min(p.e, q.e); p.e -= m; q.e -= m; } });
    });
    if(Math.abs(ct - Math.round(ct)) < 1e-9 && Math.abs(cb - Math.round(cb)) < 1e-9 && cb){ var gg = gcd(Math.round(ct), Math.round(cb)) || 1; ct = Math.round(ct) / gg; cb = Math.round(cb) / gg; if(cb < 0){ cb = -cb; ct = -ct; } }
    var re = function(list){ return list.filter(function(p){ return p.e === null || p.e > 1e-12; }).map(function(p){ return p.e === null || Math.abs(p.e - 1) < 1e-12 ? p.b : mkPow(p.b, nn(p.e)); }); };
    var T0 = re(tops), B0 = re(bots);
    if(ct < 0){ ct = -ct; sign = -sign; }
    var top = build((ct !== 1 || !T0.length ? [nn(ct)] : []).concat(T0)), bot = build((cb !== 1 ? [nn(cb)] : []).concat(B0));
    var out = bot ? div(top, bot) : top;
    return sign < 0 ? neg(out) : out;
  }
  /* A sum with like terms collected (eˣ + eˣ + x eˣ = 2eˣ + x eˣ), or null
     when nothing combines. */
  function simpSum(n){
    var terms = [];
    (function walk(m, sg){
      m = un(m);
      if(m.k === 'add'){ walk(m.a, sg); walk(m.b, sg); }
      else if(m.k === 'sub'){ walk(m.a, sg); walk(m.b, -sg); }
      else if(m.k === 'neg') walk(m.a, -sg);
      else terms.push({ n: m, s: sg });
    })(n, 1);
    if(terms.length < 2) return null;
    var groups = [], hit = false;
    terms.forEach(function(t){
      var f = simplify(t.n), fs = factors(f, Object.assign([], { sign: 1 })), c = t.s * fs.sign, rest = [];
      fs.forEach(function(x){ var v = numVal(x); if(v !== null) c *= v; else rest.push(x); });
      var body = build(rest), kb = body ? key(body) : '#';
      var g = groups.filter(function(q){ return q.kb === kb; })[0];
      if(g){ g.c += c; hit = true; } else groups.push({ kb: kb, body: body, c: c });
    });
    if(!hit) return null;
    var out = null;
    groups.forEach(function(g){
      if(Math.abs(g.c) < 1e-12) return;
      var mag = g.body ? simplify(mul(nn(Math.abs(g.c)), g.body)) : nn(Math.abs(g.c));
      out = !out ? (g.c < 0 ? neg(mag) : mag) : g.c < 0 ? sub(out, mag) : add(out, mag);
    });
    return out ? simplify(out) : num(0);
  }
  function simplify(n){
    n = un(n);
    if(!n) return n;
    switch(n.k){
      case 'num': return n.v < 0 ? neg(num(-n.v)) : n;
      case 'var': case 'const': return n;
      case 'neg': { var a = simplify(n.a); if(isNum(a, 0)) return num(0); if(a.k === 'neg') return a.a; return neg(a); }
      case 'add': case 'sub': {
        var combined = simpSum(n);
        if(combined) return combined;
        var p = simplify(n.a), q = simplify(n.b), pv = numVal(p), qv = numVal(q);
        if(pv !== null && qv !== null) return nn(n.k === 'add' ? pv + qv : pv - qv);
        if(qv === 0) return p;
        if(pv === 0) return n.k === 'add' ? q : simplify(neg(q));
        var minus = n.k === 'sub';
        if(q.k === 'neg'){ q = q.a; minus = !minus; }
        return minus ? sub(p, q) : add(p, q);
      }
      case 'mul': return simpMul(n);
      case 'div': {
        var t = simplify(n.a), b = simplify(n.b), tv = numVal(t), bv = numVal(b);
        if(tv !== null && bv !== null && bv !== 0) return nn(tv / bv);
        if(bv === 1) return t;
        if(tv === 0) return num(0);
        if(bv !== null && bv !== 0) return simplify(mul(nn(1 / bv), t));
        if(t.k === 'neg') return neg(simplify(div(t.a, b)));
        if(b.k === 'neg') return neg(simplify(div(t, b.a)));
        if(t.k === 'div') return simplify(div(t.a, mul(t.b, b)));
        if(b.k === 'div') return simplify(div(mul(t, b.b), b.a));
        if(key(t) === key(b)) return num(1);
        return cancel(t, b);
      }
      case 'pow': {
        var base = simplify(n.a), ex = simplify(n.b), ev = numVal(ex), bv2 = numVal(base);
        if(ev === 0) return num(1);
        if(ev === 1) return base;
        if(bv2 !== null && ev !== null){ var r = Math.pow(bv2, ev); if(isFinite(r) && Math.abs(r - Math.round(r)) < 1e-9) return num(Math.round(r)); }
        // (b^p)^n = b^(pn) for a whole number n
        if(base.k === 'pow' && ev !== null && Math.abs(ev - Math.round(ev)) < 1e-12){ var e1 = numVal(base.b); if(e1 !== null) return simplify(pow(base.a, nn(e1 * ev))); }
        return mkPow(base, ex);
      }
      case 'fn': { var g = { k: 'fn', f: n.f, a: simplify(n.a) }; return g; }
    }
    return n;
  }

  /* ---------------------------------------------- differentiate */
  // d/du of each named function, as a tree in u (the argument).
  var DF = {
    sin: function(u){ return fn('cos', u); },
    cos: function(u){ return neg(fn('sin', u)); },
    tan: function(u){ return pow(fn('sec', u), num(2)); },
    sec: function(u){ return mul(fn('sec', u), fn('tan', u)); },
    csc: function(u){ return neg(mul(fn('csc', u), fn('cot', u))); },
    cot: function(u){ return neg(pow(fn('csc', u), num(2))); },
    exp: function(u){ return fn('exp', u); },
    ln: function(u){ return div(num(1), u); },
    log: function(u){ return div(num(1), mul(u, fn('ln', num(10)))); },
    sqrt: function(u){ return div(num(1), mul(num(2), fn('sqrt', u))); },
    cbrt: function(u){ return div(num(1), mul(num(3), pow(fn('cbrt', u), num(2)))); },
    abs: function(u){ return div(u, fn('abs', u)); },
    arcsin: function(u){ return div(num(1), fn('sqrt', sub(num(1), pow(u, num(2))))); },
    arccos: function(u){ return neg(div(num(1), fn('sqrt', sub(num(1), pow(u, num(2)))))); },
    arctan: function(u){ return div(num(1), add(num(1), pow(u, num(2)))); },
    arccot: function(u){ return neg(div(num(1), add(num(1), pow(u, num(2))))); },
    arcsec: function(u){ return div(num(1), mul(fn('abs', u), fn('sqrt', sub(pow(u, num(2)), num(1))))); },
    arccsc: function(u){ return neg(div(num(1), mul(fn('abs', u), fn('sqrt', sub(pow(u, num(2)), num(1)))))); }
  };
  function isE(n){ n = un(n); return n.k === 'const' && n.v === 'e'; }
  function deriv(n){
    n = un(n);
    if(!hasX(n)) return num(0);
    switch(n.k){
      case 'var': return num(1);
      case 'neg': return neg(deriv(n.a));
      case 'add': return add(deriv(n.a), deriv(n.b));
      case 'sub': return sub(deriv(n.a), deriv(n.b));
      case 'mul':
        if(!hasX(n.a)) return mul(n.a, deriv(n.b));
        if(!hasX(n.b)) return mul(deriv(n.a), n.b);
        return add(mul(deriv(n.a), n.b), mul(n.a, deriv(n.b)));
      case 'div':
        if(!hasX(n.b)) return div(deriv(n.a), n.b);
        if(!hasX(n.a)) return neg(div(mul(n.a, deriv(n.b)), pow(n.b, num(2))));
        return div(sub(mul(deriv(n.a), n.b), mul(n.a, deriv(n.b))), pow(n.b, num(2)));
      case 'pow':
        if(!hasX(n.b)){ var e = numVal(n.b); return mul(mul(n.b, pow(n.a, e !== null ? nn(e - 1) : sub(n.b, num(1)))), deriv(n.a)); }
        if(!hasX(n.a)) return mul(mul(n, isE(n.a) ? num(1) : fn('ln', n.a)), deriv(n.b));
        // u^v = e^(v ln u)
        return mul(n, add(mul(deriv(n.b), fn('ln', n.a)), div(mul(n.b, deriv(n.a)), n.a)));
      case 'fn':
        if(!DF[n.f]) throw new Error('No rule for ' + n.f);
        return mul(DF[n.f](n.a), deriv(n.a));
    }
    throw new Error('Cannot differentiate ' + n.k);
  }

  /* ---------------------------------------------- text */
  function tex(n){ return X.toTex(n); }
  // In the syntax students type (and ApCalcExpr parses), fully bracketed.
  function str(n){
    n = un(n);
    switch(n.k){
      case 'num': return n.v < 0 ? '(' + n.v + ')' : String(n.v);
      case 'var': return n.v;
      case 'const': return n.v;
      case 'neg': return '(-' + str(n.a) + ')';
      case 'add': return '(' + str(n.a) + ' + ' + str(n.b) + ')';
      case 'sub': return '(' + str(n.a) + ' - ' + str(n.b) + ')';
      case 'mul': return '(' + str(n.a) + ')*(' + str(n.b) + ')';
      case 'div': return '(' + str(n.a) + ')/(' + str(n.b) + ')';
      case 'pow': return '(' + str(n.a) + ')^(' + str(n.b) + ')';
      case 'fn': return n.f + '(' + str(n.a) + ')';
    }
    return '';
  }
  /* The same, written the way a student would type it (fewest brackets):
     3(x^2 + 3x)^2 * (2x + 3), sin(x)^2, e^(2x), (x^2 + 1)/(x - 1). */
  var PREC = { add: 1, sub: 1, neg: 2, mul: 2, div: 2, pow: 4 };
  function prec(n){ n = un(n); return n.k === 'num' ? (n.v < 0 ? 1 : 5) : PREC[n.k] || 5; }
  function typed(n){
    n = un(n);
    var wrap = function(m, p){ var s = typed(m); return prec(m) < p ? '(' + s + ')' : s; };
    switch(n.k){
      case 'num': return Math.abs(n.v - Math.round(n.v)) < 1e-12 ? String(Math.round(n.v)) : String(+n.v.toPrecision(12));
      case 'var': return n.v;
      case 'const': return n.v;
      case 'neg': return '-' + wrap(n.a, 2);
      case 'add': return typed(n.a) + ' + ' + wrap(n.b, 1);
      case 'sub': return typed(n.a) + ' - ' + wrap(n.b, 2);
      case 'mul': {
        // the whole chain of factors: a number first, glued on; the rest joined by *
        var fs = [], walk = function(m){ m = un(m); if(m.k === 'mul'){ walk(m.a); walk(m.b); } else fs.push(m); };
        walk(n);
        var lead = fs[0].k === 'num' ? typed(fs.shift()) : '', parts = fs.map(function(f){ return f.k === 'neg' || prec(f) < 3 ? '(' + typed(f) + ')' : typed(f); });
        var body = parts.join(' * ');
        return lead ? (/^[a-z(]/.test(body) && !/^e(\^|$)/.test(body) ? lead + body : lead + ' * ' + body) : body;
      }
      case 'div': return wrap(n.a, 2) + '/' + wrap(n.b, 3);
      case 'pow': {
        var base = un(n.a), e = un(n.b), es = e.k === 'num' && e.v >= 0 && Math.abs(e.v - Math.round(e.v)) < 1e-12 || e.k === 'var' ? typed(e) : '(' + typed(e) + ')';
        return (base.k === 'fn' || prec(base) >= 5 ? typed(base) : '(' + typed(base) + ')') + '^' + es;
      }
      case 'fn': return n.f + '(' + typed(n.a) + ')';
    }
    return '';
  }
  function P(s, vars){ return X.parse(s, { vars: vars || ['x'] }); }
  /* A tree tidied for display without reordering anything: no brackets
     nodes, 1x -> x, -1x -> -x, a + (-3) -> a - 3. */
  function tidy(n){
    n = un(n);
    if(!n || typeof n !== 'object') return n;
    var c = Object.assign({}, n);
    if(c.a) c.a = tidy(c.a);
    if(c.b) c.b = tidy(c.b);
    if(c.k === 'mul' && isNum(c.a, 1)) return c.b;
    if(c.k === 'mul' && un(c.a).k === 'neg' && isNum(un(c.a).a, 1)) return neg(c.b);
    if(c.k === 'mul' && un(c.a).k === 'num' && un(c.a).v === -1) return neg(c.b);
    if(c.k === 'add' && un(c.b).k === 'neg') return sub(c.a, un(c.b).a);
    if(c.k === 'add' && un(c.b).k === 'num' && un(c.b).v < 0) return sub(c.a, num(-un(c.b).v));
    if(c.k === 'add' && un(c.b).k === 'mul' && un(un(c.b).a).k === 'neg') return sub(c.a, mul(un(un(c.b).a).a, un(c.b).b));
    if(c.k === 'add' && un(c.b).k === 'mul' && un(un(c.b).a).k === 'num' && un(un(c.b).a).v < 0) return sub(c.a, tidy(mul(num(-un(un(c.b).a).v), un(c.b).b)));
    if(c.k === 'add' && un(c.b).k === 'div' && un(un(c.b).a).k === 'neg') return sub(c.a, div(un(un(c.b).a).a, un(c.b).b));
    if(c.k === 'sub' && un(c.b).k === 'mul' && un(un(c.b).a).k === 'neg') return add(c.a, mul(un(un(c.b).a).a, un(c.b).b));
    if(c.k === 'sub' && un(c.b).k === 'neg') return add(c.a, un(c.b).a);
    return c;
  }
  function T(s, vars){ return tex(tidy(P(s, vars))); } // TeX of a typed string, tidied (1x -> x, + (-3) -> - 3)
  // Plain text of an expression: "cos(x)", not the TeX-spaced "cos (x)".
  function tight(t){ return String(t).replace(/\b(sin|cos|tan|sec|csc|cot|ln|log|arcsin|arccos|arctan) \(/g, '$1('); }
  function plain(s){ var tx = window.ApCalcTex; return tx && tx.text ? tight(tx.text(T(s))) : s; }
  function plainU(s){ var tx = window.ApCalcTex; return tx && tx.text ? tight(tx.text(T(s, ['u']))) : s; }
  function D(s){ return simplify(deriv(P(s))); }          // its derivative, simplified
  function DS(s){ return str(D(s)); }
  function DT(s){ return tex(D(s)); }

  /* ---------------------------------------------- the structure (rule picker) */
  var BASIC = { sin: 'sin', cos: 'cos', tan: 'tan', sec: 'sec', csc: 'csc', cot: 'cot', ln: 'ln', log: 'log', exp: 'e^u', sqrt: 'square root', cbrt: 'cube root', abs: 'absolute value', arcsin: 'arcsin', arccos: 'arccos', arctan: 'arctan', arcsec: 'arcsec', arccsc: 'arccsc', arccot: 'arccot' };
  var U = vr('u');
  function outerOf(n){ // the outer function with its argument replaced by u
    n = un(n);
    if(n.k === 'fn') return fn(n.f, U);
    if(n.k === 'pow' && !hasX(n.b)) return pow(U, n.b);
    if(n.k === 'pow' && !hasX(n.a)) return pow(n.a, U);
    return U;
  }
  function douter(o){ // derivative of the outer function with respect to u
    var swap = function(t){ t = un(t); if(t.k === 'var' && t.v === 'u') return vr('x'); var c = Object.assign({}, t); if(c.a) c.a = swap(c.a); if(c.b) c.b = swap(c.b); return c; };
    var back = function(t){ t = un(t); if(t.k === 'var' && t.v === 'x') return vr('u'); var c = Object.assign({}, t); if(c.a) c.a = back(c.a); if(c.b) c.b = back(c.b); return c; };
    return back(simplify(deriv(swap(o))));
  }
  function describe(n){
    n = un(n);
    var t = tex(n), node = { tex: t, kids: [] };
    try { node.dtex = tex(simplify(deriv(n))); } catch(e){ node.dtex = '?'; }
    if(!hasX(n)){ node.rule = 'constant'; node.name = 'Constant'; return node; }
    switch(n.k){
      case 'var': node.rule = 'x'; node.name = 'd/dx of x is 1'; return node;
      case 'add': case 'sub': {
        // every term of a long sum at one level: a + b - c + d
        var terms = [], anySub = false;
        (function walk(m, sg){ m = un(m); if(m.k === 'add'){ walk(m.a, sg); walk(m.b, sg); } else if(m.k === 'sub'){ anySub = true; walk(m.a, sg); walk(m.b, -sg); } else terms.push({ n: m, s: sg }); })(n, 1);
        node.rule = 'sum'; node.name = anySub ? 'Sum and difference rules' : 'Sum rule';
        node.kids = terms.map(function(t){ var k = describe(t.s < 0 ? neg(t.n) : t.n); return { role: 'term', node: k }; });
        return node;
      }
      case 'neg': node.rule = 'multiple'; node.name = 'Constant multiple (−1)'; node.kids = [{ role: 'factor', node: describe(n.a) }]; return node;
      case 'mul':
        if(!hasX(n.a) || !hasX(n.b)){ node.rule = 'multiple'; node.name = 'Constant multiple'; node.kids = [{ role: 'factor', node: describe(hasX(n.a) ? n.a : n.b) }]; return node; }
        node.rule = 'product'; node.name = 'Product rule'; node.kids = [{ role: 'u', node: describe(n.a) }, { role: 'v', node: describe(n.b) }]; return node;
      case 'div':
        if(!hasX(n.b)){ node.rule = 'multiple'; node.name = 'Constant multiple (divide by a constant)'; node.kids = [{ role: 'factor', node: describe(n.a) }]; return node; }
        var bb = un(n.b);
        if(!hasX(n.a) && (bb.k === 'var' || bb.k === 'pow' && un(bb.a).k === 'var' && !hasX(bb.b))){ node.rule = 'power'; node.name = 'Rewrite as a negative power, then the power rule'; return node; }
        node.rule = 'quotient'; node.name = !hasX(n.a) ? 'Quotient rule (or a negative power and the chain rule)' : 'Quotient rule'; node.kids = [{ role: 'top', node: describe(n.a) }, { role: 'bottom', node: describe(n.b) }]; return node;
      case 'pow':
        if(!hasX(n.b)){
          if(un(n.a).k === 'var'){ node.rule = 'power'; node.name = 'Power rule'; return node; }
          node.rule = 'chain'; node.name = 'Chain rule (outer: a power)';
        } else if(!hasX(n.a)){
          if(un(n.b).k === 'var'){ node.rule = 'exp'; node.name = isE(n.a) ? 'd/dx of eˣ is eˣ' : 'Exponential rule'; return node; }
          node.rule = 'chain'; node.name = 'Chain rule (outer: an exponential)';
        } else { node.rule = 'logdiff'; node.name = 'Rewrite as e^(v ln u), then the chain and product rules'; node.kids = [{ role: 'u', node: describe(n.a) }, { role: 'v', node: describe(n.b) }]; return node; }
        break;
      case 'fn':
        if(un(n.a).k === 'var'){ node.rule = 'basic'; node.name = 'Derivative of ' + BASIC[n.f]; return node; }
        node.rule = 'chain'; node.name = 'Chain rule (outer: ' + BASIC[n.f] + ')'; break;
    }
    var o = outerOf(n), inner = n.k === 'fn' ? n.a : !hasX(n.b) ? n.a : n.b;
    node.outer = { tex: tex(o), dtex: tex(douter(o)) };
    node.kids = [{ role: 'outer', node: { tex: tex(o), dtex: node.outer.dtex, rule: 'outer', name: 'Outer function', kids: [] } }, { role: 'inner', node: describe(inner) }];
    return node;
  }
  function stepsOf(node, out){
    if(['constant', 'x', 'outer'].indexOf(node.rule) < 0 && node.name !== 'Constant multiple (−1)') out.push({ rule: node.rule, name: node.name, tex: node.tex, dtex: node.dtex, outer: node.outer });
    node.kids.forEach(function(k){ if(k.role !== 'outer') stepsOf(k.node, out); });
    return out;
  }
  function analyze(s){
    var r = X.read(String(s || ''), { vars: ['x'] });
    if(!r.ok) return { ok: false, error: r.error };
    try {
      var t = tidy(r.tree), d = simplify(deriv(t)), node = describe(t);
      return { ok: true, tree: t, tex: tex(t), node: node, steps: stepsOf(node, []), d: d, dtex: tex(d), dstr: str(d) };
    } catch(e){ return { ok: false, error: 'This one is outside the rules here: ' + e.message + '.' }; }
  }

  /* ================================================== Test yourself */
  var TYPES = [
    { value: 'rewrite', label: 'Rewrite as a power', topic: 'math-exponent-rules' },
    { value: 'power', label: 'Power rule', topic: 'power-rule' },
    { value: 'sum', label: 'Sum and constant multiple rules', topic: 'basic-derivative-rules' },
    { value: 'trigexp', label: 'sin, cos, eˣ and ln x', topic: 'derivatives-sin-cos-exp-ln' },
    { value: 'product', label: 'Product rule', topic: 'product-rule' },
    { value: 'quotient', label: 'Quotient rule', topic: 'quotient-rule' },
    { value: 'trig', label: 'tan, sec, csc and cot', topic: 'other-trig-derivatives' },
    { value: 'chain', label: 'Chain rule', topic: 'chain-rule' },
    { value: 'implicit', label: 'Implicit differentiation', topic: 'implicit-differentiation' },
    { value: 'inverse', label: 'Derivative of an inverse function', topic: 'inverse-function-derivatives' },
    { value: 'invtrig', label: 'Inverse trig functions', topic: 'inverse-trig-derivatives' },
    { value: 'mixed', label: 'Choosing the rules', topic: 'choosing-derivative-rules' },
    { value: 'higher', label: 'Second derivatives', topic: 'higher-order-derivatives' }
  ];
  var DOM = [0.3, 1.3];
  function $(t){ return '$' + t + '$'; }
  function tn(v){ return tex(nn(v)).replace(/^-/, '-'); }
  function tnb(v){ return v < 0 ? '{' + tn(v) + '}' : tn(v); }
  // Expression step: what it must equal is in `check` (for the validator).
  function exprStep(key, label, answer, o){
    answer = typed(simplify(P(answer, o.vars)));
    return { key: key, kind: 'expr', label: label, lhs: o.lhs, practice: o.practice || '1.E', reveal: o.reveal,
      cell: M.exprCell(answer, { domain: o.domain || DOM, vars: o.vars, mistakes: (o.mistakes || []).filter(function(m, i, all){
        // A slip that happens to equal the key (or an earlier slip) here is dropped.
        if(!m || !m.expr) return false;
        if(same(m.expr, answer, o)) return false;
        return !all.slice(0, i).some(function(q){ return q && q.expr && same(m.expr, q.expr, o); });
      }) }), check: o.check };
  }
  // Two typed expressions equal at a dozen points of the step's domain (cheap; the grader does the full check).
  function same(a, b, o){
    var vars = o.vars || ['x'], d = o.domain || DOM, fa, fb;
    try { fa = X.fn(a, vars); fb = X.fn(b, vars); } catch(e){ return false; }
    for(var i = 0; i < 12; i++){
      var t = (i + 0.37) / 12, pt = Array.isArray(d) ? d[0] + (d[1] - d[0]) * t : { x: d.x[0] + (d.x[1] - d.x[0]) * t, y: d.y[0] + (d.y[1] - d.y[0]) * ((i * 5 % 12) + 0.5) / 12 };
      var u = fa(pt), v = fb(pt);
      if(!isFinite(u) || !isFinite(v)) continue;
      if(Math.abs(u - v) > 1e-7 * Math.max(1, Math.abs(u), Math.abs(v))) return false;
    }
    return true;
  }
  function choiceStep(key, label, opts, practice, fixed){
    var seen = {}, list = [];
    opts.forEach(function(o){ if(o && !seen[o.t]){ seen[o.t] = 1; list.push(o); } });
    var c = -1; list.forEach(function(o, i){ if(o.ok && c < 0) c = i; });
    return { key: key, kind: 'choice', label: label, options: list.map(function(o){ return o.t; }), why: list.map(function(o){ return o.why; }), correct: c, practice: practice || '1.C', fixed: !!fixed, reveal: list[c] && list[c].reveal };
  }
  function numStep(key, label, v, mistakes, practice){
    var whole = Math.abs(v - Math.round(v)) < 1e-9;
    return { key: key, kind: 'num', label: label, cell: M.cell(v, 0, (mistakes || []).filter(function(m){ return typeof m.value === 'number' && isFinite(m.value); }), 1e-3), d: whole ? 0 : 3, practice: practice || '1.E' };
  }
  var RULES = { product: 'Product rule', quotient: 'Quotient rule', chain: 'Chain rule', power: 'Power rule', sum: 'Sum rule' };
  function ruleStep(rule, f, why){
    var opts = ['product', 'quotient', 'chain', 'power'].map(function(r){ return { t: RULES[r], ok: r === rule, why: r === rule ? why : WRONG_RULE[r](f) }; });
    return choiceStep('rule', 'Which rule do you use first on $f(x) = ' + T(f) + '$?', opts, '1.C', true);
  }
  var WRONG_RULE = {
    product: function(){ return 'The product rule is for two factors that both change with x, multiplied together at the top level.'; },
    quotient: function(){ return 'The quotient rule is for one function divided by another, at the top level.'; },
    chain: function(){ return 'The chain rule is for a function inside another function, at the top level.'; },
    power: function(){ return 'The power rule alone works only on xⁿ (times a constant).'; }
  };
  function cxp(c, p){ return (c === 1 ? '' : c === -1 ? '-' : tn(c)) + 'x^{' + tn(p) + '}'; }
  function solved(f){ return '$f\'(x) = ' + DT(f) + '$'; }

  /* ---------------------------------------------- powers (rewrite, power) */
  // c, p and how f is written: c·x^p
  // A leading coefficient 1 is not written (\sqrt{x}, not 1\sqrt{x}).
  function co(c){ return c === 1 ? '' : String(c); }
  var POW_FORMS = [
    { tex: function(c){ return '\\frac{' + c + '}{x^{3}}'; }, s: function(c){ return c + '/x^3'; }, p: -3, c: function(c){ return c; } },
    { tex: function(c){ return '\\frac{' + c + '}{x}'; }, s: function(c){ return c + '/x'; }, p: -1, c: function(c){ return c; } },
    { tex: function(c){ return co(c) + '\\sqrt{x}'; }, s: function(c){ return c + 'sqrt(x)'; }, p: 0.5, c: function(c){ return c; } },
    { tex: function(c){ return '\\frac{' + c + '}{\\sqrt{x}}'; }, s: function(c){ return c + '/sqrt(x)'; }, p: -0.5, c: function(c){ return c; } },
    { tex: function(c){ return co(c) + 'x^{2}\\sqrt{x}'; }, s: function(c){ return c + 'x^2 sqrt(x)'; }, p: 2.5, c: function(c){ return c; } },
    { tex: function(c){ return co(c) + '\\sqrt[3]{x^{2}}'; }, s: function(c){ return c + 'cbrt(x^2)'; }, p: 2 / 3, c: function(c){ return c; } },
    { tex: function(c){ return '\\frac{' + c + '}{2x^{4}}'; }, s: function(c){ return c + '/(2x^4)'; }, p: -4, c: function(c){ return c / 2; } },
    { tex: function(c){ return '\\frac{' + c + '}{x^{2}}'; }, s: function(c){ return c + '/x^2'; }, p: -2, c: function(c){ return c; } }
  ];
  function genRewrite(r){
    var F = r.pick(POW_FORMS), c0 = r.pick([1, 2, 3, 5, 6]), c = F.c(c0), p = F.p, f = F.s(c0);
    var pm = [{ value: -p, why: 'The sign of the exponent: a power in the bottom of a fraction moves up with a negative exponent, x⁻ⁿ = 1/xⁿ.' }];
    if(Math.abs(p - Math.round(p)) > 1e-9) pm.push({ value: 1 / p, why: 'A root is a fractional power with the root on the bottom: √x = x^(1/2), ∛(x²) = x^(2/3).' });
    var steps = [
      numStep('p', 'Write $f(x) = ' + F.tex(c0) + '$ as $c\\,x^{p}$. What is $p$?', p, pm, '1.E'),
      numStep('c', 'And the coefficient $c$?', c, [{ value: 1 / c, why: 'Only the power of x moves; a number in the bottom stays a division: 3/(2x⁴) = (3/2)x⁻⁴.' }].concat(c !== c0 ? [{ value: c0 * 2, why: 'The 2 in the bottom divides: c = ' + c0 + '/2.' }] : []).filter(function(m){ return Math.abs(m.value - c) > 1e-9; }), '1.E')
    ];
    return { text: 'Rewrite $f(x) = ' + F.tex(c0) + '$ as a constant times a power of $x$.', fig: { power: { tex: F.tex(c0), c: c, p: p } }, steps: steps, meta: { f: f, c: c, p: p },
      solution: ['A root is a fractional power: $\\sqrt{x} = x^{1/2}$, $\\sqrt[3]{x^2} = x^{2/3}$.', 'A power in the bottom moves up with a negative exponent: $\\frac{1}{x^n} = x^{-n}$.', '$f(x) = ' + F.tex(c0) + ' = ' + cxp(c, p) + '$.'] };
  }
  function genPower(r){
    var F = r.pick(POW_FORMS), c0 = r.pick([1, 2, 3, 4, 6]), c = F.c(c0), p = F.p, f = F.s(c0);
    var cp = function(k, e){ return '(' + k + ')*x^(' + e + ')'; };
    var steps = [
      numStep('p', 'First rewrite $f(x) = ' + F.tex(c0) + '$ as $c\\,x^{p}$. What is $p$?', p, [{ value: -p, why: 'A power in the bottom moves up with a negative exponent.' }], '1.E'),
      exprStep('d', 'Now use the power rule to find $f\'(x)$.', cp(c * p, p - 1), { lhs: "f'(x) =", reveal: 'f', check: { d1: f },
        mistakes: [{ expr: cp(c * p, p + 1), why: 'Subtract 1 from the exponent; adding 1 is what an antiderivative does.' }, { expr: cp(c, p - 1), why: 'Bring the exponent down as a factor: d/dx xⁿ = n·xⁿ⁻¹.' }, { expr: cp(-c * p, p - 1), why: 'Check the sign: the exponent ' + M.fmt(p, 3) + ' comes down as it is.' }] })
    ];
    return { text: 'Differentiate $f(x) = ' + F.tex(c0) + '$.', fig: { power: { tex: F.tex(c0), c: c, p: p } }, steps: steps, meta: { f: f },
      solution: ['Rewrite: $f(x) = ' + cxp(c, p) + '$.', 'Power rule, $\\frac{d}{dx} x^n = n x^{n-1}$: $f\'(x) = ' + (c === 1 ? '' : tn(c) + '\\cdot ') + tnb(p) + ' x^{' + tn(p - 1) + '} = ' + cxp(c * p, p - 1) + '$.'] };
  }

  /* ---------------------------------------------- sum and constant multiples */
  function genSum(r){
    var a = r.nonzero(-4, 5), n = r.pick([3, 4, 5]), b = r.nonzero(-6, 6), c = r.pick([2, 3, 4, 5, 6]) * r.pick([1, -1]), k = r.pick([1, 2, 3]), d = r.nonzero(-9, 9);
    var xk = k === 1 ? 'x' : 'x^' + k; // x, not x^1, on the page
    var f = a + 'x^' + n + ' + (' + b + ')x + (' + c + ')/' + xk + ' + (' + d + ')';
    var term = '(' + c + ')/' + xk + '', dterm = '(' + (-c * k) + ')*x^(' + (-k - 1) + ')';
    var key = '(' + (a * n) + ')x^' + (n - 1) + ' + (' + b + ') + ' + dterm;
    var steps = [
      choiceStep('const', 'What is the derivative of the constant term $' + tn(d) + '$?', [
        { t: $('0'), ok: true, why: 'A constant does not change, so its rate of change is 0.' },
        { t: $(tn(d)), why: 'A constant has slope 0: its graph is a horizontal line.' },
        { t: $(T(d + 'x')), why: 'That is an antiderivative of ' + d + ', not its derivative.' }
      ], '1.C'),
      exprStep('term', 'Differentiate the term $' + T(term) + '$ (rewrite it as a power first).', dterm, { lhs: "\\frac{d}{dx} =", check: { d1: term },
        mistakes: [{ expr: '(' + (c * k) + ')*x^(' + (-k - 1) + ')', why: 'The exponent is negative: bring down −' + k + ', which flips the sign.' }, { expr: '(' + (-c * k) + ')*x^(' + (-k + 1) + ')', why: 'Subtract 1 from the exponent: −' + k + ' − 1 = −' + (k + 1) + '. Yours went up by 1 instead.' }] }),
      exprStep('d', 'Now the whole derivative, $f\'(x)$.', key, { lhs: "f'(x) =", reveal: 'f', check: { d1: f },
        mistakes: [{ expr: key + ' + (' + d + ')', why: 'The constant term ' + d + ' differentiates to 0: drop it.' }, { expr: '(' + (a * n) + ')x^' + (n - 1) + ' + (' + b + ') + (' + (c * k) + ')*x^(' + (-k - 1) + ')', why: 'The derivative of ' + plain(term) + ' has the opposite sign: the exponent −' + k + ' comes down.' }] })
    ];
    return { text: 'Differentiate $f(x) = ' + T(f) + '$.', fig: { tree: f }, steps: steps, meta: { f: f },
      solution: ['Differentiate term by term (sum rule); constants multiply through (constant multiple rule).', 'Rewrite $' + T(term) + ' = ' + tn(c) + 'x^{' + tn(-k) + '}$, so its derivative is $' + tn(-c * k) + 'x^{' + tn(-k - 1) + '}$.', 'The constant $' + tn(d) + '$ gives $0$.', solved(f)] };
  }

  /* ---------------------------------------------- sin, cos, e^x, ln x */
  function genTrigExp(r){
    var a = r.nonzero(-4, 5), b = r.nonzero(-4, 5), c = r.nonzero(-3, 4), d = r.nonzero(-5, 5);
    var f = a + 'sin(x) + (' + b + ')cos(x) + (' + c + ')e^x + (' + d + ')ln(x)';
    var key = a + 'cos(x) - (' + b + ')sin(x) + (' + c + ')e^x + (' + d + ')/x';
    var steps = [
      choiceStep('cos', $('\\frac{d}{dx}\\cos x') + ' is', [
        { t: $('-\\sin x'), ok: true, why: 'cos x is falling where sin x is positive (from 0 to π), so the derivative is −sin x.' },
        { t: $('\\sin x'), why: 'Check the sign: at x = π/2, cos x is falling, so its slope there is −1 = −sin(π/2).' },
        { t: $('-\\cos x'), why: 'That is the second derivative of cos x.' },
        { t: $('\\sec^2 x'), why: 'That is the derivative of tan x.' }
      ], '1.C', true),
      choiceStep('ln', $('\\frac{d}{dx}\\ln x') + ' is', [
        { t: $('\\frac{1}{x}'), ok: true, why: 'd/dx ln x = 1/x for x > 0.' },
        { t: $('\\ln x'), why: 'Only eˣ is its own derivative.' },
        { t: $('e^x'), why: 'eˣ is the inverse of ln x, not its derivative.' },
        { t: $('\\frac{1}{\\ln x}'), why: 'The derivative is 1/x, the reciprocal of x, not of ln x.' }
      ], '1.C', true),
      exprStep('d', 'Find $f\'(x)$.', key, { lhs: "f'(x) =", reveal: 'f', check: { d1: f },
        mistakes: [{ expr: a + 'cos(x) + (' + b + ')sin(x) + (' + c + ')e^x + (' + d + ')/x', why: 'The derivative of cos x is −sin x: the cosine term changes sign.' }, { expr: a + 'cos(x) - (' + b + ')sin(x) + (' + c + ')e^x + (' + d + ')ln(x)', why: 'The derivative of ln x is 1/x.' }, { expr: '(' + (-a) + ')cos(x) - (' + b + ')sin(x) + (' + c + ')e^x + (' + d + ')/x', why: 'The derivative of sin x is +cos x.' }] })
    ];
    return { text: 'Differentiate $f(x) = ' + T(f) + '$ for $x > 0$.', fig: { tree: f }, steps: steps, meta: { f: f },
      solution: ['$\\frac{d}{dx}\\sin x = \\cos x$, $\\frac{d}{dx}\\cos x = -\\sin x$, $\\frac{d}{dx}e^x = e^x$, $\\frac{d}{dx}\\ln x = \\frac{1}{x}$.', 'Constant multiples and sums carry through.', solved(f)] };
  }

  /* ---------------------------------------------- product and quotient */
  var PA = ['x^2', 'x^3', '3x^2', 'x^4', '2x + 1', 'x^2 + 1', 'x^2 - 3x', 'sqrt(x)', '5x'];
  var PB = ['sin(x)', 'cos(x)', 'e^x', 'ln(x)'];
  var DEN = ['x^2 + 1', 'x + 2', 'e^x', 'cos(x)', 'x^3 + 1', '2x + 1', 'sin(x)'];
  function g(s){ return '(' + s + ')'; }
  // The usual slip on a basic piece's derivative.
  function pieceSlips(s){
    return s === 'cos(x)' ? [{ expr: 'sin(x)', why: 'The derivative of cos x is −sin x.' }] : s === 'ln(x)' ? [{ expr: 'ln(x)', why: 'The derivative of ln x is 1/x.' }] :
      s === 'sqrt(x)' ? [{ expr: 'sqrt(x)/2', why: '√x = x^(1/2), so its derivative is (1/2)x^(−1/2) = 1/(2√x).' }] : s === 'e^x' ? [{ expr: 'x e^(x-1)', why: 'The power rule is for xⁿ with a fixed n. eˣ is its own derivative.' }] : [];
  }
  function genProduct(r){
    var u = r.pick(PA), v = r.pick(PB);
    if(r() < 0.3){ var t = u; u = v; v = t; }
    var f = g(u) + g(v), du = DS(u), dv = DS(v);
    var key = g(du) + '*' + g(v) + ' + ' + g(u) + '*' + g(dv);
    var steps = [
      ruleStep('product', f, 'f is u·v with u = ' + plain(u) + ' and v = ' + plain(v) + ': a product of two functions of x.'),
      exprStep('du', 'With $u = ' + T(u) + '$, find $u\'$.', du, { lhs: "u' =", reveal: 'u', check: { d1: u }, mistakes: pieceSlips(u) }),
      exprStep('dv', 'With $v = ' + T(v) + '$, find $v\'$.', dv, { lhs: "v' =", reveal: 'v', check: { d1: v }, mistakes: pieceSlips(v) }),
      exprStep('d', 'Put it together with $f\'(x) = u\'v + uv\'$.', key, { lhs: "f'(x) =", reveal: 'f', check: { d1: f },
        mistakes: [{ expr: g(du) + '*' + g(dv), why: 'The derivative of a product is not the product of the derivatives. Use u′v + uv′.' }, { expr: g(du) + '*' + g(v), why: 'That is only u′v. Add uv′, the second term.' }, { expr: g(u) + '*' + g(dv), why: 'That is only uv′. Add u′v, the first term.' }] })
    ];
    return { text: 'Differentiate $f(x) = ' + T(f) + '$.', fig: { tree: f }, steps: steps, meta: { f: f, u: u, v: v },
      solution: ['Product rule: $(uv)\' = u\'v + uv\'$ with $u = ' + T(u) + '$, $v = ' + T(v) + '$.', '$u\' = ' + DT(u) + '$ and $v\' = ' + DT(v) + '$.', '$f\'(x) = (' + DT(u) + ')(' + T(v) + ') + (' + T(u) + ')(' + DT(v) + ')$', 'Simplified: ' + solved(f)] };
  }
  function genQuotient(r){
    var top = r.pick(PA.concat(['sin(x)', 'e^x', 'ln(x)', '1'])), bot = r.pick(DEN);
    while(top === bot) bot = r.pick(DEN);
    var f = g(top) + '/' + g(bot), du = DS(top), dv = DS(bot);
    var key = '(' + g(du) + '*' + g(bot) + ' - ' + g(top) + '*' + g(dv) + ')/' + g(bot) + '^2';
    var dom = bot === 'cos(x)' ? [0.2, 1.3] : DOM;
    var steps = [
      ruleStep('quotient', f, 'f is a quotient: ' + plain(top) + ' divided by ' + plain(bot) + '.'),
      exprStep('du', 'With top $u = ' + T(top) + '$, find $u\'$.', du, { lhs: "u' =", reveal: 'top', check: { d1: top }, domain: dom, mistakes: pieceSlips(top) }),
      exprStep('dv', 'With bottom $v = ' + T(bot) + '$, find $v\'$.', dv, { lhs: "v' =", reveal: 'bottom', check: { d1: bot }, domain: dom, mistakes: pieceSlips(bot) }),
      exprStep('d', 'Put it together with $f\'(x) = \\frac{u\'v - uv\'}{v^2}$.', key, { lhs: "f'(x) =", reveal: 'f', check: { d1: f }, domain: dom,
        mistakes: [{ expr: '(' + g(top) + '*' + g(dv) + ' - ' + g(du) + '*' + g(bot) + ')/' + g(bot) + '^2', why: 'The order in the top matters: u′v − uv′ (low d-high minus high d-low). Yours has the opposite sign.' },
          { expr: '(' + g(du) + '*' + g(bot) + ' - ' + g(top) + '*' + g(dv) + ')/' + g(bot), why: 'Square the bottom: the denominator is v².' },
          { expr: g(du) + '/' + g(dv), why: 'The derivative of a quotient is not the quotient of the derivatives. Use (u′v − uv′)/v².' }] })
    ];
    if(top === '1') steps.splice(1, 1);
    return { text: 'Differentiate $f(x) = ' + T(f) + '$.', fig: { tree: f }, steps: steps, meta: { f: f, top: top, bot: bot },
      solution: ['Quotient rule: $\\left(\\frac{u}{v}\\right)\' = \\frac{u\'v - uv\'}{v^2}$ with $u = ' + T(top) + '$, $v = ' + T(bot) + '$.', '$u\' = ' + DT(top) + '$ and $v\' = ' + DT(bot) + '$.', '$f\'(x) = \\frac{(' + DT(top) + ')(' + T(bot) + ') - (' + T(top) + ')(' + DT(bot) + ')}{(' + T(bot) + ')^2}$'] };
  }

  /* ---------------------------------------------- tan, sec, csc, cot */
  var TRIG = [
    { f: 'tan', t: '\\sec^2 x', s: 'sec(x)^2' }, { f: 'sec', t: '\\sec x\\tan x', s: 'sec(x)*tan(x)' },
    { f: 'cot', t: '-\\csc^2 x', s: '-csc(x)^2' }, { f: 'csc', t: '-\\csc x\\cot x', s: '-csc(x)*cot(x)' }
  ];
  function genTrig(r){
    var A = r.pick(TRIG), B = r.pick(TRIG.filter(function(t){ return t !== A; })), a = r.nonzero(-4, 5), b = r.nonzero(-4, 5);
    var f = a + A.f + '(x) + (' + b + ')' + B.f + '(x)', key = a + '*(' + A.s + ') + (' + b + ')*(' + B.s + ')';
    var opts = function(T0){ return TRIG.map(function(t){ return { t: $(t.t), ok: t === T0, why: t === T0 ? 'From ' + T0.f + ' x written with sin and cos and the quotient rule.' : 'That is the derivative of ' + t.f + ' x.' }; }); };
    var steps = [
      choiceStep('A', $('\\frac{d}{dx}\\' + A.f + ' x') + ' is', opts(A), '1.C', true),
      choiceStep('B', $('\\frac{d}{dx}\\' + B.f + ' x') + ' is', opts(B), '1.C', true),
      exprStep('d', 'Find $f\'(x)$.', key, { lhs: "f'(x) =", reveal: 'f', check: { d1: f }, domain: [0.3, 1.2],
        mistakes: [{ expr: a + '*(' + A.s.replace(/^-/, '') + ') + (' + b + ')*(' + B.s.replace(/^-/, '') + ')', why: 'The co-functions (cot, csc) have a minus sign in their derivatives.' }] })
    ];
    if(!/^-/.test(A.s) && !/^-/.test(B.s)) steps[2].cell.expr.mistakes = [];
    return { text: 'Differentiate $f(x) = ' + T(f) + '$.', fig: { tree: f }, steps: steps, meta: { f: f },
      solution: ['$\\frac{d}{dx}\\tan x = \\sec^2 x$, $\\frac{d}{dx}\\sec x = \\sec x\\tan x$, $\\frac{d}{dx}\\cot x = -\\csc^2 x$, $\\frac{d}{dx}\\csc x = -\\csc x\\cot x$ (each from sin and cos and the quotient rule).', solved(f)] };
  }

  /* ---------------------------------------------- chain */
  var OUTER = [
    { id: 'pow', make: function(u, n){ return '(' + u + ')^' + n; }, o: function(n){ return 'u^' + n; }, inner: ['3x + 1', '2x - 5', 'x^2 + 1', 'x^3 - 2x', 'sin(x)', 'x^2 + 3x'] },
    { id: 'sqrt', make: function(u){ return 'sqrt(' + u + ')'; }, o: function(){ return 'sqrt(u)'; }, inner: ['3x + 1', 'x^2 + 1', 'x^3 + 4', '2x^2 + 5'] },
    { id: 'sin', make: function(u){ return 'sin(' + u + ')'; }, o: function(){ return 'sin(u)'; }, inner: ['3x + 1', 'x^2', '4x', 'x^3 + 1', '2x^2 - x'] },
    { id: 'cos', make: function(u){ return 'cos(' + u + ')'; }, o: function(){ return 'cos(u)'; }, inner: ['3x + 1', 'x^2', '5x', 'x^3', '2x - 1'] },
    { id: 'tan', make: function(u){ return 'tan(' + u + ')'; }, o: function(){ return 'tan(u)'; }, inner: ['2x', 'x^2', '0.5x + 0.2'] },
    { id: 'exp', make: function(u){ return 'e^(' + u + ')'; }, o: function(){ return 'e^u'; }, inner: ['3x', 'x^2', '-2x + 1', 'x^3 - x', 'sin(x)'] },
    { id: 'ln', make: function(u){ return 'ln(' + u + ')'; }, o: function(){ return 'ln(u)'; }, inner: ['x^2 + 1', '3x + 2', 'x^3 + x', 'cos(x)', '5x'] }
  ];
  function sub_u(s, inner){ return s.replace(/u/g, '(' + inner + ')'); }
  function genChain(r){
    var O = r.pick(OUTER), n = O.id === 'pow' ? r.pick([3, 4, 5, -2]) : 0, inner = r.pick(O.inner);
    var f = O.make(inner, n), o = O.o(n), dinner = DS(inner);
    // the outer derivative with u put back: dO/du at u = inner
    var douT = str(douter(P(o, ['u']))), outerAtInner = sub_u(douT, inner);
    var key = g(outerAtInner) + '*' + g(dinner);
    var forgot = outerAtInner;
    var steps = [
      ruleStep('chain', f, 'f is a function of a function: the outer one is ' + plainU(o) + ' and the inside is u = ' + plain(inner) + '.'),
      exprStep('din', 'The inside is $u = ' + T(inner) + '$. Find $u\'$.', dinner, { lhs: "u' =", reveal: 'inner', check: { d1: inner } }),
      exprStep('dout', 'The outside is $' + T(o, ['u']) + '$. Differentiate it with respect to $u$, then put $u = ' + T(inner) + '$ back in.', outerAtInner, { lhs: '\\frac{d}{du}\\left(' + T(o, ['u']) + '\\right) =', reveal: 'outer', check: { outerAt: [o, inner] },
        mistakes: O.id === 'cos' ? [{ expr: sub_u('sin(u)', inner), why: 'The derivative of cos u is −sin u.' }] : O.id === 'ln' ? [{ expr: sub_u('ln(u)', inner), why: 'The derivative of ln u is 1/u.' }] : [] }),
      exprStep('d', 'Put it together: the outer derivative times the inner derivative.', key, { lhs: "f'(x) =", reveal: 'f', check: { d1: f }, domain: O.id === 'tan' ? [0.2, 0.9] : DOM,
        mistakes: [{ expr: forgot, why: 'You forgot the inner derivative: multiply by u′ = ' + plain(dinner) + '.' }, { expr: sub_u(douT, dinner), why: 'Evaluate the outer derivative at the inside u, then multiply by u′. Do not put u′ inside it.' }] })
    ];
    return { text: 'Differentiate $f(x) = ' + T(f) + '$.', fig: { tree: f }, steps: steps, meta: { f: f, inner: inner, outer: o },
      solution: ['Chain rule: $\\frac{d}{dx} f(g(x)) = f\'(g(x))\\,g\'(x)$. Outer: $' + T(o, ['u']) + '$, inner: $u = ' + T(inner) + '$.', '$u\' = ' + DT(inner) + '$; outer derivative $' + tex(douter(P(o, ['u']))) + '$, at $u = ' + T(inner) + '$.', solved(f)] };
  }

  /* ---------------------------------------------- choosing the rules (3.5) */
  var MIXED = [
    { f: function(n, k){ return 'x^' + n + ' sin(' + k + 'x)'; }, first: 'product', second: 'v', why: 'The top level is x^n times sin(kx): a product. The factor sin(kx) then needs the chain rule.' },
    { f: function(n, k){ return 'e^(' + k + 'x)/(x^2 + 1)'; }, first: 'quotient', second: 'top', why: 'The top level is a quotient. Its top, e^(kx), needs the chain rule.' },
    { f: function(n){ return '(x^2 + 1)^' + n + ' e^x'; }, first: 'product', second: 'u', why: 'The top level is a product. Its first factor, a power of (x² + 1), needs the chain rule.' },
    { f: function(n){ return 'x^3 ln(x^2 + ' + n + ')'; }, first: 'product', second: 'v', why: 'The top level is a product. Its second factor, ln(x² + c), needs the chain rule.' },
    { f: function(n, k){ return 'cos(x^2 e^x)'; }, first: 'chain', second: 'inner', why: 'The top level is cos of something: chain rule. Its inside, x²eˣ, needs the product rule.' },
    { f: function(n, k){ return '(x sin(x))^' + n; }, first: 'chain', second: 'inner', why: 'The top level is a power of something: chain rule. Its inside, x sin x, needs the product rule.' },
    { f: function(n, k){ return 'sqrt(x)/(' + k + 'x + 1)^2'; }, first: 'quotient', second: 'bottom', why: 'The top level is a quotient. Its bottom, a power of (kx + 1), needs the chain rule.' }
  ];
  var WHERE = { u: 'in the first factor', v: 'in the second factor', top: 'in the top', bottom: 'in the bottom', inner: 'inside, on the inner function' };
  function genMixed(r){
    var Mx = r.pick(MIXED), n = r.pick([2, 3, 4]), k = r.pick([2, 3, 5]), f = Mx.f(n, k);
    var A = analyze(f), node = A.node, second = Mx.second;
    var kid = node.kids.filter(function(c){ return c.role === second; })[0], need = kid && kid.node.rule;
    var secondRule = need === 'chain' ? 'chain' : need === 'product' ? 'product' : need === 'quotient' ? 'quotient' : 'chain';
    var forgot = null;
    // A likely slip: the chain-rule factor dropped in the piece that needs it.
    if(Mx.first === 'product' || Mx.first === 'quotient'){
      var pieces = node.kids.map(function(c){ return c.role; }), a = un(A.tree);
      var u = str(a.a), v = str(a.b), du = DS(u), dv = DS(v);
      // The piece's derivative with its inner derivative left off.
      var dropInner = function(s){
        var t = un(P(s));
        if(t.k === 'fn') return str(simplify(DF[t.f](t.a)));
        if(t.k === 'pow' && !hasX(t.a)) return str(t);
        if(t.k === 'pow' && numVal(t.b) !== null) return str(simplify(mul(t.b, pow(t.a, nn(numVal(t.b) - 1)))));
        return DS(s);
      };
      if(second === 'u' || second === 'top') du = dropInner(u); else dv = dropInner(v);
      forgot = Mx.first === 'product' ? g(du) + '*' + g(v) + ' + ' + g(u) + '*' + g(dv) : '(' + g(du) + '*' + g(v) + ' - ' + g(u) + '*' + g(dv) + ')/' + g(v) + '^2';
    }
    var steps = [
      ruleStep(Mx.first, f, Mx.why),
      choiceStep('second', 'Where else is a rule needed, and which?', Object.keys(WHERE).filter(function(w){ return node.kids.some(function(c){ return c.role === w; }) || w === second; }).reduce(function(list, w){
        ['chain', 'product'].forEach(function(rr){ list.push({ t: RULES[rr] + ' ' + WHERE[w], ok: w === second && rr === secondRule, why: w === second && rr === secondRule ? Mx.why : 'Look at each piece: which one is itself a composition (chain) or a product?' }); });
        return list;
      }, []).slice(0, 4).concat([{ t: RULES[secondRule] + ' ' + WHERE[second], ok: true, why: Mx.why }]), '1.C'),
      exprStep('d', 'Find $f\'(x)$.', A.dstr, { lhs: "f'(x) =", reveal: 'f', check: { d1: f }, domain: [0.3, 1.2],
        mistakes: forgot ? [{ expr: forgot, why: 'A chain-rule factor is missing: the piece with a function inside a function needs its inner derivative.' }] : [] })
    ];
    return { text: 'Differentiate $f(x) = ' + T(f) + '$.', fig: { tree: f }, steps: steps, meta: { f: f, first: Mx.first },
      solution: [Mx.why].concat(A.steps.slice(0, 4).map(function(s){ return s.name + ': $\\frac{d}{dx}\\left[' + s.tex + '\\right] = ' + s.dtex + '$'; })).concat([solved(f)]) };
  }

  /* ---------------------------------------------- implicit (3.2) */
  function mono(c, i, j){ // c x^i y^j as student text and TeX
    var s = c + (i ? '*x' + (i > 1 ? '^' + i : '') : '') + (j ? '*y' + (j > 1 ? '^' + j : '') : '');
    var t = (c === 1 && (i || j) ? '' : String(c)) + (i ? 'x' + (i > 1 ? '^' + i : '') : '') + (j ? 'y' + (j > 1 ? '^' + j : '') : '');
    return { s: s, t: t };
  }
  function genImplicit(r){
    var m = r.pick([2, 3]), p = r.pick([1, 2]), a = r.pick([1, 2, 3]), i = r.pick([1, 2]), j = r.pick([1, 2]), n = r.pick([2, 3]), b = r.pick([1, 2]);
    if(i === 2 && j === 2) j = 1;
    var x0 = r.pick([1, 2]), y0 = r.pick([1, 2]);
    var C = p * Math.pow(x0, m) + a * Math.pow(x0, i) * Math.pow(y0, j) + b * Math.pow(y0, n);
    var X1 = mono(p, m, 0), XY = mono(a, i, j), Y1 = mono(b, 0, n);
    var eqT = X1.t + ' + ' + XY.t + ' + ' + Y1.t + ' = ' + C;
    var Fx = '(' + (p * m) + ')*x^' + (m - 1) + ' + (' + (a * i) + ')*x^' + (i - 1) + '*y^' + j;
    var Fy = '(' + (a * j) + ')*x^' + i + '*y^' + (j - 1) + ' + (' + (b * n) + ')*y^' + (n - 1);
    var key = '-(' + Fx + ')/(' + Fy + ')';
    var D = '\\frac{dy}{dx}', yT = function(k){ return k === 1 ? 'y' : 'y^' + k; }, xT = function(k){ return k === 0 ? '' : k === 1 ? 'x' : 'x^' + k; };
    var co = function(c){ return c === 1 ? '' : String(c); };
    var dY = co(b * n) + (n - 1 === 1 ? 'y' : 'y^' + (n - 1));
    var dXY_x = co(a * i) + xT(i - 1) + yT(j), dXY_y = co(a * j) + xT(i) + (j - 1 ? yT(j - 1) : '');
    var steps = [
      choiceStep('y', 'Differentiate $' + Y1.t + '$ with respect to $x$.', [
        { t: $(dY + '\\,' + D), ok: true, why: 'y is a function of x, so the chain rule multiplies by dy/dx.' },
        { t: $(dY), why: 'You forgot dy/dx: y depends on x, so d/dx of a power of y needs the chain rule.' },
        { t: $(co(b * n) + (n - 1 === 1 ? 'x' : 'x^' + (n - 1))), why: 'The variable is y, not x: differentiate the power of y, then multiply by dy/dx.' },
        { t: $('0'), why: 'y is not a constant: it changes as x changes.' }
      ], '1.C'),
      choiceStep('xy', 'Differentiate $' + XY.t + '$ with respect to $x$.', [
        { t: $(dXY_x + ' + ' + dXY_y + '\\,' + D), ok: true, why: 'A product of a power of x and a power of y: product rule, with dy/dx on the y part.' },
        { t: $(dXY_x), why: 'That differentiates only the x part. The product rule needs a second term, with dy/dx.' },
        { t: $(co(a * i * j) + xT(i - 1) + (j - 1 ? yT(j - 1) : '') + '\\,' + D), why: 'That is the product of the two derivatives. Use the product rule: (first)′(second) + (first)(second)′.' },
        { t: $(dXY_x + ' + ' + dXY_y), why: 'The y part needs dy/dx: y depends on x.' }
      ], '1.C'),
      exprStep('d', 'Solve for $' + D + '$:', key, { lhs: "\\frac{dy}{dx} =", vars: ['x', 'y'], domain: { x: [0.5, 2], y: [0.5, 2] }, reveal: 'f', check: { implicit: X1.s + ' + ' + XY.s + ' + ' + Y1.s },
        mistakes: [{ expr: '(' + Fx + ')/(' + Fy + ')', why: 'Moving the x terms to the other side changes their sign: dy/dx = −(x terms)/(y terms).' }, { expr: '-(' + Fy + ')/(' + Fx + ')', why: 'Upside down: the terms with dy/dx go in the denominator.' }, { expr: '-(' + Fx + ')/(' + (b * n) + '*y^' + (n - 1) + ')', why: 'You dropped the dy/dx term from the product ' + XY.t + '.' }] }),
      numStep('slope', 'The point $(' + x0 + ', ' + y0 + ')$ is on the curve. The slope there is', -(p * m * Math.pow(x0, m - 1) + a * i * Math.pow(x0, i - 1) * Math.pow(y0, j)) / (a * j * Math.pow(x0, i) * Math.pow(y0, j - 1) + b * n * Math.pow(y0, n - 1)), [], '1.E')
    ];
    var sv = steps[3].cell.answer;
    steps[3].cell = M.cell(sv, 0, [{ value: -sv, why: 'Check the minus sign in front.' }, { value: 1 / sv, why: 'The fraction is upside down.' }], 1e-3);
    return { text: 'The curve $' + eqT + '$ defines $y$ as a function of $x$ near $(' + x0 + ', ' + y0 + ')$. Find $' + D + '$.', fig: { implicit: { eq: eqT, F: X1.s + ' + ' + XY.s + ' + ' + Y1.s, C: C, pt: [x0, y0], terms: [X1.t, XY.t, Y1.t] } }, steps: steps,
      meta: { F: X1.s + ' + ' + XY.s + ' + ' + Y1.s, C: C, x0: x0, y0: y0 },
      solution: ['Differentiate both sides with respect to $x$; every $y$ term gets a factor $' + D + '$ (chain rule), and $' + XY.t + '$ needs the product rule.', '$' + co(p * m) + xT(m - 1) + ' + ' + dXY_x + ' + ' + dXY_y + '\\,' + D + ' + ' + dY + '\\,' + D + ' = 0$', 'Collect the $' + D + '$ terms and solve: $' + D + ' = -\\frac{' + tex(simplify(P(Fx, ['x', 'y']))) + '}{' + tex(simplify(P(Fy, ['x', 'y']))) + '}$.', 'At $(' + x0 + ', ' + y0 + ')$: $' + D + ' = ' + tn(sv) + '$.'] };
  }

  /* ---------------------------------------------- inverse functions (3.3) */
  function genInverse(r){
    var p = r.pick([1, 2, 3]), q = r.int(-3, 3), b = r.pick([-1, 0, 1, 2]), c3 = r.pick([1, 1, 2]);
    var fS = c3 + 'x^3 + ' + p + 'x' + (q ? ' + (' + q + ')' : ''), fx = function(x){ return c3 * x * x * x + p * x + q; }, a = fx(b), fp = function(x){ return 3 * c3 * x * x + p; };
    var steps = [
      numStep('ginv', 'Let $g = f^{-1}$. First find $g(' + tnb(a) + ')$: the $x$ with $f(x) = ' + tnb(a) + '$.', b, [{ value: fx(a), why: 'g(a) is the input of f that gives a, not f(a).' }], '1.E'),
      numStep('fp', 'Find $f\'(' + tnb(b) + ')$.', fp(b), [{ value: fp(a), why: 'Use the x-value g(' + a + ') = ' + b + ', not ' + a + '.' }], '1.E'),
      numStep('gp', 'So $g\'(' + tnb(a) + ') =$', 1 / fp(b), [{ value: fp(b), why: 'Take the reciprocal: g′(a) = 1 / f′(g(a)).' }, { value: 1 / fp(a), why: 'f′ is evaluated at g(a) = ' + b + ', not at a = ' + a + '.' }], '1.E')
    ];
    return { text: 'Let $f(x) = ' + T(fS) + '$, which is increasing, and let $g$ be its inverse. Find $g\'(' + tnb(a) + ')$.', fig: { inverse: { f: fS, a: a, b: b } }, steps: steps, meta: { f: fS, a: a, b: b },
      solution: ['$g(' + tnb(a) + ') = ' + tnb(b) + '$ because $f(' + tnb(b) + ') = ' + tnb(a) + '$.', '$f\'(x) = ' + DT(fS) + '$, so $f\'(' + tnb(b) + ') = ' + fp(b) + '$.', 'The tangent slopes of a function and its inverse at matching points are reciprocals: $g\'(' + tnb(a) + ') = \\frac{1}{f\'(g(' + tnb(a) + '))} = \\frac{1}{' + fp(b) + '}$.'] };
  }

  /* ---------------------------------------------- inverse trig (3.4) */
  var INVT = [
    { f: 'arcsin', d: function(u){ return '1/sqrt(1 - (' + u + ')^2)'; }, t: '\\frac{1}{\\sqrt{1 - u^2}}' },
    { f: 'arccos', d: function(u){ return '-1/sqrt(1 - (' + u + ')^2)'; }, t: '-\\frac{1}{\\sqrt{1 - u^2}}' },
    { f: 'arctan', d: function(u){ return '1/(1 + (' + u + ')^2)'; }, t: '\\frac{1}{1 + u^2}' }
  ];
  function genInvTrig(r){
    var I = r.pick(INVT), inner = I.f === 'arctan' ? r.pick(['3x', '2x', 'x^2', 'x^3', '5x + 1']) : r.pick(['2x', '3x', 'x^2', 'x/2']);
    var f = I.f + '(' + inner + ')', din = DS(inner), key = g(I.d(inner)) + '*' + g(din);
    var dom = I.f === 'arctan' ? DOM : inner === '3x' ? [0.05, 0.3] : inner === '2x' ? [0.05, 0.45] : [0.05, 0.9];
    var steps = [
      choiceStep('outer', $('\\frac{d}{du}\\' + I.f + ' u') + ' is', INVT.map(function(t){ return { t: $(t.t), ok: t === I, why: t === I ? 'The standard result (from implicit differentiation of the inverse).' : 'That is the derivative of ' + t.f + ' u.' }; }).concat([{ t: $('\\sec^2 u'), why: 'That is the derivative of tan u, not arctan u.' }]), '1.C', true),
      exprStep('din', 'The inside is $u = ' + T(inner) + '$. Find $u\'$.', din, { lhs: "u' =", reveal: 'inner', check: { d1: inner }, domain: dom }),
      exprStep('d', 'Find $f\'(x)$.', key, { lhs: "f'(x) =", reveal: 'f', check: { d1: f }, domain: dom,
        mistakes: [{ expr: I.d(inner), why: 'You forgot the inner derivative u′ (chain rule).' }, { expr: g(I.f === 'arccos' ? I.d(inner).replace(/^-/, '') : '-' + I.d(inner)) + '*' + g(din), why: I.f === 'arccos' ? 'arccos has a minus sign in its derivative.' : 'Only arccos (and arccot) have a minus sign.' }] })
    ];
    return { text: 'Differentiate $f(x) = ' + T(f) + '$.', fig: { tree: f }, steps: steps, meta: { f: f },
      solution: ['$\\frac{d}{du}\\' + I.f + ' u = ' + I.t + '$, and the chain rule multiplies by $u\' = ' + DT(inner) + '$.', solved(f)] };
  }

  /* ---------------------------------------------- second derivatives (3.6) */
  var HIGH = [
    { f: function(a, k){ return a + 'x^4 - ' + k + 'x^3 + x'; }, x0: 1 },
    { f: function(){ return 'x e^x'; }, x0: 0 },
    { f: function(a, k){ return 'cos(' + k + 'x)'; }, x0: 0 },
    { f: function(){ return 'x ln(x)'; }, x0: 1 },
    { f: function(a, k){ return 'e^(' + k + 'x)'; }, x0: 0 },
    { f: function(a){ return a + 'x^3 + 6/x'; }, x0: 1 },
    { f: function(a, k){ return 'sin(' + k + 'x)'; }, x0: 0 }
  ];
  function genHigher(r){
    var H = r.pick(HIGH), a = r.pick([1, 2, 3]), k = r.pick([2, 3, 4]), f = H.f(a, k);
    var d1 = D(f), d1s = str(d1), d2 = simplify(deriv(d1)), d2s = str(d2), v2 = X.compile(d2)({ x: H.x0 });
    var steps = [
      exprStep('d1', 'Find $f\'(x)$.', d1s, { lhs: "f'(x) =", reveal: 'f', check: { d1: f } }),
      exprStep('d2', 'Differentiate again to find $f\'\'(x)$.', d2s, { lhs: "f''(x) =", check: { d2: f },
        mistakes: [{ expr: d1s, why: 'That is f′. Differentiate f′ once more.' }] }),
      numStep('v', 'So $f\'\'(' + H.x0 + ') =$', v2, [{ value: X.compile(d1)({ x: H.x0 }), why: 'That is f′(' + H.x0 + '). Evaluate f″.' }], '1.E')
    ];
    if(/sin|cos/.test(f)) steps[1].cell.expr.mistakes.push({ expr: str(simplify(mul(nn(1 / k), d2))), why: 'The chain rule gives a factor of ' + k + ' each time you differentiate, so k² in f″.' });
    return { text: 'Let $f(x) = ' + T(f) + '$. Find $f\'\'(x)$ and $f\'\'(' + H.x0 + ')$.', fig: { graphs: { f: f, d1: d1s, d2: d2s, x0: H.x0 } }, steps: steps, meta: { f: f, x0: H.x0 },
      solution: ['$f\'(x) = ' + tex(d1) + '$', '$f\'\'(x) = ' + tex(d2) + '$', '$f\'\'(' + H.x0 + ') = ' + tn(v2) + '$'] };
  }

  var GEN = { rewrite: genRewrite, power: genPower, sum: genSum, trigexp: genTrigExp, product: genProduct, quotient: genQuotient, trig: genTrig,
    chain: genChain, implicit: genImplicit, inverse: genInverse, invtrig: genInvTrig, mixed: genMixed, higher: genHigher };
  function generate(r, ctx, type){
    var list = ctx.types || [ctx.id], t = type && list.indexOf(type) > -1 ? type : list[0];
    var p = GEN[t](r, ctx);
    p.ctx = ctx.id; p.type = t; p.topic = ctx.topic;
    return p;
  }

  M.register('ruleDrills', {
    analyze: analyze, describe: describe, deriv: deriv, simplify: simplify, str: str, typed: typed, douter: douter, outerOf: outerOf, tex: tex, nn: nn,
    TYPES: TYPES, GEN: GEN, generate: generate, EXAMPLES: ['x^2 sin(3x)', 'e^(2x)/(x^2 + 1)', 'sqrt(1 + x^3)', 'ln(cos(x))', 'arctan(x^2)', '(3x - 1)^5', 'x e^x sin(x)', 'tan(x)/x']
  });
})();
