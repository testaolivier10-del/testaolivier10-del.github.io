/* AP® Calculus AB expressions: the parser, evaluator and grader behind
   `expr` items, exact-form numeric answers, the live preview and every tool
   (docs/apcalc-architecture.md, "Math"). No eval: a hand-written parser
   builds a small tree, and the tree is compiled to closures.

   What a student may type (friendly input):
     3x^2   3*x^2   3·x²   2(x+1)   (x+1)(x-1)   x^-2   x^(1/3)   e^x   e^(2x)
     sin(x)  sin x  sin^2(x) (= (sin x)²)  sin^-1(x) (= arcsin x)  arcsin  asin
     cos tan sec csc cot  arccos arctan  ln  log (base 10)  log_2(x)  exp
     sqrt(x)  √x  cbrt  abs(x)  |x|  pi  π  e  and the declared variables
   Implicit multiplication binds like * (left to right), so 1/2x is (1/2)x;
   the live preview shows how an answer was read. A function written without
   brackets takes the product that follows it, up to the next function or
   operator: sin 2x = sin(2x), x sin x = x·sin(x).

     ApCalcExpr.parse(str, { vars: ['x'], allowC }) -> tree (throws ApCalcExpr.Error)
     ApCalcExpr.compile(tree) -> f(scope) where scope = { x: 1.2, C: 0 }
     ApCalcExpr.fn(str, vars?) -> f(x) or f(scope): parse + compile, cached
     ApCalcExpr.toTex(tree) -> TeX for ApCalcTex (the preview, keys)
     ApCalcExpr.number(str) -> the value of a constant expression, or NaN
     ApCalcExpr.read(str, opts) -> { ok, tree, tex, error }
     ApCalcExpr.compare(student, key, opts) -> { valid, equal, error?, hasC, ... }
       opts: { vars, domain, mode: 'exact'|'constant', points, seed, tol }
     ApCalcExpr.grade(item, typed) -> { valid, correct, score, notes, mistake }
       for an `expr` item (docs/apcalc-architecture.md, "expr items"). */
(function(root){
  'use strict';

  function ExprError(msg, at){ this.message = msg; this.at = at; }
  ExprError.prototype = Object.create(Error.prototype);
  ExprError.prototype.name = 'ExprError';

  var FUNCS = ['arcsin', 'arccos', 'arctan', 'arcsec', 'arccsc', 'arccot', 'asin', 'acos', 'atan',
    'sqrt', 'cbrt', 'sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'exp', 'abs', 'log', 'ln'];
  var ALIAS = { asin: 'arcsin', acos: 'arccos', atan: 'arctan' };
  var INVERSE = { sin: 'arcsin', cos: 'arccos', tan: 'arctan', sec: 'arcsec', csc: 'arccsc', cot: 'arccot' };
  var GREEK = { theta: 'θ', alpha: 'α', beta: 'β', phi: 'φ', omega: 'ω' };
  var SUPS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };

  /* ---------------------------------------------------------- tokens */
  function normalize(s){
    s = String(s == null ? '' : s);
    s = s.replace(/[−–—]/g, '-').replace(/[×·⋅•∙]/g, '*').replace(/÷/g, '/').replace(/π/g, ' pi ').replace(/\*\*/g, '^')
      .replace(/θ/g, ' theta ').replace(/√/g, ' sqrt ').replace(/[[{]/g, '(').replace(/[\]}]/g, ')');
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, function(m){ return '^(' + m.replace(/./g, function(c){ return SUPS[c]; }) + ')'; });
    return s;
  }
  function tokenize(src, names){
    var s = normalize(src), out = [], i = 0;
    while(i < s.length){
      var c = s.charAt(i);
      if(/\s/.test(c)){ i++; continue; }
      if(/[0-9.]/.test(c)){
        var m = /^(\d+\.?\d*|\.\d+)(?:[eE](?=[+-]?\d)[+-]?\d+)?/.exec(s.slice(i));
        if(!m) throw new ExprError('A number is not written right near "' + s.slice(i, i + 4) + '".', i);
        out.push({ t: 'num', v: parseFloat(m[0]), at: i }); i += m[0].length; continue;
      }
      if(/[A-Za-z]/.test(c)){
        var run = /^[A-Za-z]+/.exec(s.slice(i))[0], j = 0;
        while(j < run.length){
          var rest = run.slice(j), hit = null;
          for(var k = 0; k < names.length && !hit; k++) if(rest.indexOf(names[k].name) === 0) hit = names[k];
          if(!hit) throw new ExprError('"' + rest.charAt(0) + '" is not a variable or function here.' + (names.vars.length ? ' Use ' + names.vars.join(', ') + '.' : ''), i + j);
          out.push({ t: hit.kind, v: hit.name, at: i + j }); j += hit.name.length;
        }
        i += run.length; continue;
      }
      if('+-*/^(),|_!'.indexOf(c) > -1){ out.push({ t: c, at: i }); i++; continue; }
      if(c === '=') throw new ExprError('Type only the expression, without "y =" or "=".', i);
      throw new ExprError('"' + c + '" cannot be read.', i);
    }
    return out;
  }
  function nameTable(vars, allowC){
    var list = [];
    FUNCS.forEach(function(f){ list.push({ name: f, kind: 'fn' }); });
    list.push({ name: 'pi', kind: 'const' });
    Object.keys(GREEK).forEach(function(g){ if(vars.indexOf(g) > -1) list.push({ name: g, kind: 'var' }); });
    vars.forEach(function(v){ if(!GREEK[v]) list.push({ name: v, kind: 'var' }); });
    if(allowC && vars.indexOf('C') < 0) list.push({ name: 'C', kind: 'var' });
    if(vars.indexOf('e') < 0) list.push({ name: 'e', kind: 'const' });
    // Longest first, so "sec" beats "s", "exp" beats "e", "pi" beats "p".
    list.sort(function(a, b){ return b.name.length - a.name.length; });
    list.vars = vars.slice();
    return list;
  }

  /* ---------------------------------------------------------- parser */
  function parse(src, opts){
    opts = opts || {};
    var vars = opts.vars || ['x'];
    var toks = tokenize(src, nameTable(vars, opts.allowC)), p = 0, absDepth = 0;
    if(!toks.length) throw new ExprError('Type an expression.', 0);
    function peek(){ return toks[p]; }
    function next(){ return toks[p++]; }
    function is(t){ return toks[p] && toks[p].t === t; }
    function expect(t, msg){ if(!is(t)) throw new ExprError(msg, toks[p] ? toks[p].at : -1); return next(); }
    function startsFactor(noFn){
      var k = peek();
      if(!k) return false;
      if(k.t === 'num' || k.t === 'var' || k.t === 'const' || k.t === '(') return true;
      if(k.t === 'fn') return !noFn;
      if(k.t === '|') return absDepth === 0;
      return false;
    }
    function expr(){
      var a = term();
      while(is('+') || is('-')){ var op = next().t; a = { k: op === '+' ? 'add' : 'sub', a: a, b: term() }; }
      return a;
    }
    function term(){
      var a = unary();
      for(;;){
        if(is('*') || is('/')){ var op = next().t; a = { k: op === '*' ? 'mul' : 'div', a: a, b: unary() }; }
        else if(startsFactor(false)) a = { k: 'mul', a: a, b: power(), imp: true };
        else return a;
      }
    }
    function unary(){
      if(is('-')){ next(); return { k: 'neg', a: unary() }; }
      if(is('+')){ next(); return unary(); }
      return power();
    }
    function power(){
      var b = primary();
      if(is('^')){ next(); return { k: 'pow', a: b, b: unary() }; }
      return b;
    }
    // The argument of a function written without brackets: the product of
    // factors that follows, stopping at the next function.
    function bareArg(){
      if(!startsFactor(true) && !is('-')) throw new ExprError('A function needs something to act on.', peek() ? peek().at : -1);
      var a = is('-') ? (next(), { k: 'neg', a: power() }) : power();
      while(startsFactor(true)) a = { k: 'mul', a: a, b: power(), imp: true };
      return a;
    }
    function primary(){
      var k = peek();
      if(!k) throw new ExprError('The expression ends too soon.', -1);
      if(k.t === 'num'){ next(); return { k: 'num', v: k.v }; }
      if(k.t === 'const'){ next(); return { k: 'const', v: k.v }; }
      if(k.t === 'var'){ next(); return { k: 'var', v: k.v }; }
      if(k.t === '('){
        next();
        var e = expr();
        expect(')', 'A bracket is not closed.');
        return { k: 'paren', a: e };
      }
      if(k.t === '|'){
        next(); absDepth++;
        var inner = expr();
        absDepth--;
        expect('|', 'An absolute value bar | is not closed.');
        return { k: 'fn', f: 'abs', a: inner };
      }
      if(k.t === 'fn'){
        next();
        var f = ALIAS[k.v] || k.v, powr = null, base = null;
        if(f === 'log' && is('_')){ next(); base = primary(); }
        if(is('^')){
          // sin^2(x) is (sin x)^2; sin^-1(x) is arcsin(x).
          next();
          var neg = false;
          if(is('-')){ next(); neg = true; }
          var pw = primary();
          if(neg && pw.k === 'num' && pw.v === 1 && INVERSE[f]) f = INVERSE[f];
          else powr = neg ? { k: 'neg', a: pw } : pw;
          if(pw.k === 'paren' && pw.a.k === 'neg' && pw.a.a.k === 'num' && pw.a.a.v === 1 && INVERSE[f]){ f = INVERSE[f]; powr = null; }
        }
        var arg;
        if(is('(')){ next(); arg = expr(); expect(')', 'A bracket is not closed after ' + k.v + '.'); }
        else arg = bareArg();
        var node = { k: 'fn', f: f, a: arg };
        if(base) node = { k: 'div', a: { k: 'fn', f: 'ln', a: arg }, b: { k: 'fn', f: 'ln', a: base }, logBase: base, arg: arg };
        return powr ? { k: 'pow', a: node, b: powr, fnPow: true } : node;
      }
      if(k.t === ')') throw new ExprError('There is a closing bracket with nothing before it.', k.at);
      throw new ExprError('"' + k.t + '" is not expected here.', k.at);
    }
    var tree = expr();
    if(p < toks.length){
      var t = toks[p];
      throw new ExprError(t.t === ')' ? 'There is an extra closing bracket.' : t.t === '|' ? 'An absolute value bar | is not opened.' : 'Something is missing before "' + (t.v || t.t) + '".', t.at);
    }
    return tree;
  }

  /* ---------------------------------------------------------- evaluation */
  // A real power: a negative base with an exponent p/q, q odd, is real
  // (x^(1/3) of -8 is -2), as students and the exam read it.
  function rpow(b, e){
    if(b >= 0 || Number.isInteger(e)) return Math.pow(b, e);
    for(var q = 3; q <= 15; q += 2){
      var pp = e * q;
      if(Math.abs(pp - Math.round(pp)) < 1e-9){ var r = Math.pow(-b, e); return Math.round(pp) % 2 ? -r : r; }
    }
    return NaN;
  }
  var F = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    sec: function(x){ return 1 / Math.cos(x); }, csc: function(x){ return 1 / Math.sin(x); }, cot: function(x){ return Math.cos(x) / Math.sin(x); },
    arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
    arcsec: function(x){ return Math.acos(1 / x); }, arccsc: function(x){ return Math.asin(1 / x); },
    arccot: function(x){ return Math.PI / 2 - Math.atan(x); },
    sqrt: function(x){ return x < 0 ? NaN : Math.sqrt(x); }, cbrt: function(x){ return Math.cbrt ? Math.cbrt(x) : rpow(x, 1 / 3); },
    exp: Math.exp, abs: Math.abs,
    ln: function(x){ return x <= 0 ? NaN : Math.log(x); }, log: function(x){ return x <= 0 ? NaN : Math.log(x) / Math.LN10; }
  };
  var CONST = { pi: Math.PI, e: Math.E };
  function compile(n){
    switch(n.k){
      case 'num': var v = n.v; return function(){ return v; };
      case 'const': var c = CONST[n.v]; return function(){ return c; };
      case 'var': var name = n.v; return function(s){ var x = s[name]; return x === undefined ? 0 : x; };
      case 'paren': return compile(n.a);
      case 'neg': var f0 = compile(n.a); return function(s){ return -f0(s); };
      case 'fn': var g = F[n.f], a0 = compile(n.a); return function(s){ return g(a0(s)); };
      case 'pow': var pb = compile(n.a), pe = compile(n.b); return function(s){ return rpow(pb(s), pe(s)); };
    }
    var A = compile(n.a), B = compile(n.b);
    if(n.k === 'add') return function(s){ return A(s) + B(s); };
    if(n.k === 'sub') return function(s){ return A(s) - B(s); };
    if(n.k === 'mul') return function(s){ return A(s) * B(s); };
    if(n.k === 'div') return function(s){ return A(s) / B(s); };
    throw new ExprError('Unknown node ' + n.k, -1);
  }
  var cache = {};
  /* fn('x^2 + 1') -> f(x); fn('x*y', ['x', 'y']) -> f({ x, y }). */
  function fn(str, vars){
    vars = vars || ['x'];
    var key = vars.join(',') + '|' + str;
    if(!cache[key]){
      var f = compile(parse(str, { vars: vars }));
      cache[key] = vars.length === 1 ? (function(v){ return function(x){ var s = {}; s[v] = x; return f(s); }; })(vars[0]) : f;
    }
    return cache[key];
  }
  function number(str){
    try{ return compile(parse(str, { vars: [] }))({}); }catch(e){ return NaN; }
  }
  function uses(n, name){
    if(!n) return false;
    if(n.k === 'var') return n.v === name;
    return uses(n.a, name) || uses(n.b, name);
  }

  /* ---------------------------------------------------------- TeX */
  var TEXFN = { sin: '\\sin', cos: '\\cos', tan: '\\tan', sec: '\\sec', csc: '\\csc', cot: '\\cot', arcsin: '\\arcsin', arccos: '\\arccos',
    arctan: '\\arctan', arcsec: '\\operatorname{arcsec}', arccsc: '\\operatorname{arccsc}', arccot: '\\operatorname{arccot}', ln: '\\ln', log: '\\log', exp: '\\exp' };
  function numTex(v){
    if(Number.isInteger(v)) return String(v);
    var s = String(+v.toPrecision(12));
    return /e/.test(s) ? s.replace(/e\+?(-?\d+)/, '\\times 10^{$1}') : s;
  }
  function isAtom(n){ return n.k === 'num' && n.v >= 0 || n.k === 'var' || n.k === 'const' || n.k === 'paren' || n.k === 'fn' && (n.f === 'abs' || n.f === 'sqrt'); }
  function startsWithNumber(n){
    while(n.k === 'mul' || n.k === 'pow') n = n.a;
    return n.k === 'num' || n.k === 'neg';
  }
  // Brackets stretch only around a fraction; elsewhere plain ones read better.
  function wrap(t){ return /\\frac/.test(t) ? '\\left(' + t + '\\right)' : '(' + t + ')'; }
  function toTex(n){
    switch(n.k){
      case 'num': return numTex(n.v);
      case 'const': return n.v === 'pi' ? '\\pi' : 'e';
      case 'var': return GREEK[n.v] ? '\\' + n.v : n.v;
      case 'paren': return wrap(toTex(n.a));
      case 'neg': return '-' + (n.a.k === 'add' || n.a.k === 'sub' ? wrap(toTex(n.a)) : toTex(n.a));
      case 'add': return toTex(n.a) + ' + ' + toTex(n.b);
      case 'sub': return toTex(n.a) + ' - ' + (n.b.k === 'add' || n.b.k === 'sub' || n.b.k === 'neg' ? wrap(toTex(n.b)) : toTex(n.b));
      case 'div':
        if(n.logBase) return '\\log_{' + toTex(n.logBase) + '}' + wrap(toTex(n.arg));
        return '\\frac{' + toTex(unparen(n.a)) + '}{' + toTex(unparen(n.b)) + '}';
      case 'mul': {
        var a = n.a.k === 'add' || n.a.k === 'sub' ? wrap(toTex(n.a)) : toTex(n.a);
        var b = n.b.k === 'add' || n.b.k === 'sub' || n.b.k === 'neg' ? wrap(toTex(n.b)) : toTex(n.b);
        var sep = startsWithNumber(n.b) || n.b.k === 'div' && n.a.k === 'num' ? ' \\cdot ' : /^\\[a-z]/.test(b) || /\\[a-zA-Z]+$/.test(a) ? '\\,' : n.a.k === 'num' || n.a.k === 'const' || n.a.k === 'var' ? '' : ' ';
        return a + sep + b;
      }
      case 'pow': {
        if(n.fnPow && n.a.k === 'fn' && TEXFN[n.a.f]) return TEXFN[n.a.f] + '^{' + toTex(unparen(n.b)) + '}' + wrap(toTex(n.a.a));
        if(n.a.k === 'const' && n.a.v === 'e') return 'e^{' + toTex(unparen(n.b)) + '}';
        var base = isAtom(n.a) && n.a.k !== 'fn' ? toTex(n.a) : wrap(toTex(unparen(n.a)));
        return base + '^{' + toTex(unparen(n.b)) + '}';
      }
      case 'fn':
        if(n.f === 'sqrt') return '\\sqrt{' + toTex(n.a) + '}';
        if(n.f === 'cbrt') return '\\sqrt[3]{' + toTex(n.a) + '}';
        if(n.f === 'abs') return '\\left|' + toTex(n.a) + '\\right|';
        if(n.f === 'exp') return 'e^{' + toTex(n.a) + '}';
        return TEXFN[n.f] + wrap(toTex(n.a));
    }
    return '';
  }
  function unparen(n){ return n.k === 'paren' ? n.a : n; }

  /* ---------------------------------------------------------- sampling */
  function rng(seed){
    var a = (seed >>> 0) || 0x9e3779b9;
    return function(){
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function domainOf(opts, v){
    var d = opts.domain;
    if(Array.isArray(d)) return d;
    if(d && d[v]) return d[v];
    return [-3, 3];
  }
  function points(opts){
    var vars = opts.vars || ['x'], r = rng(opts.seed || 20270510), n = opts.points || 40, out = [];
    for(var i = 0; i < n; i++){
      var s = {};
      vars.forEach(function(v){ var d = domainOf(opts, v); s[v] = d[0] + (d[1] - d[0]) * (0.02 + 0.96 * r()); });
      out.push(s);
    }
    return out;
  }
  function read(str, opts){
    try{
      var tree = parse(str, opts || {});
      return { ok: true, tree: tree, tex: toTex(tree) };
    }catch(e){
      if(e instanceof ExprError) return { ok: false, error: e.message, at: e.at };
      throw e;
    }
  }

  /* Compare a typed expression with a key by evaluating both at many points
     of the domain (docs/apcalc-architecture.md). Points where the key is not
     a finite number are skipped (a hole, an asymptote, outside the domain);
     a point where the key is finite and the answer is not is a difference.
     mode 'exact': the two agree everywhere; 'constant': they differ by one
     constant everywhere (antiderivatives). Also reports what a wrong answer
     is related by: the opposite sign, a constant factor, or a constant. */
  function compare(student, key, opts){
    opts = opts || {};
    var vars = opts.vars || ['x'], mode = opts.mode || 'exact', tol = opts.tol || 1e-6;
    var sr = typeof student === 'string' ? read(student, { vars: vars, allowC: mode === 'constant' }) : { ok: true, tree: student };
    if(!sr.ok) return { valid: false, error: sr.error };
    var kt = typeof key === 'string' ? parse(key, { vars: vars }) : key;
    var S = compile(sr.tree), K = compile(kt), hasC = uses(sr.tree, 'C') && vars.indexOf('C') < 0;
    var pts = points(opts), pairs = [], bad = 0;
    for(var i = 0; i < pts.length; i++){
      var k = K(pts[i]);
      if(!isFinite(k) || Math.abs(k) > 1e9) continue;
      var sc = Object.assign({}, pts[i]); sc.C = 0;
      var s = S(sc);
      if(!isFinite(s)){ bad++; continue; }
      pairs.push([s, k]);
    }
    var out = { valid: true, hasC: hasC, used: pairs.length + bad, nonFinite: bad, tex: sr.tex };
    if(pairs.length + bad < 8){ out.equal = false; out.tooFew = true; return out; }
    function close(a, b){ return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b)); }
    function all(f){ return bad === 0 && pairs.every(f); }
    var d0 = median(pairs.map(function(q){ return q[0] - q[1]; }));
    out.exact = all(function(q){ return close(q[0], q[1]); });
    out.constant = all(function(q){ return close(q[0] - q[1], d0); });
    out.diff = d0;
    out.equal = mode === 'constant' ? out.constant : out.exact;
    if(!out.equal){
      out.sign = all(function(q){ return close(q[0], -q[1]); }) && pairs.some(function(q){ return Math.abs(q[1]) > 1e-6; });
      var nz = pairs.filter(function(q){ return Math.abs(q[1]) > 1e-6; });
      if(nz.length >= 6 && bad === 0){
        var r0 = median(nz.map(function(q){ return q[0] / q[1]; }));
        if(isFinite(r0) && Math.abs(r0 - 1) > 1e-6 && nz.every(function(q){ return close(q[0] / q[1], r0); }) && pairs.every(function(q){ return Math.abs(q[1]) > 1e-6 || Math.abs(q[0]) <= 1e-6; })) out.factor = r0;
      }
    }
    return out;
  }
  function median(a){ a = a.slice().sort(function(x, y){ return x - y; }); return a.length ? a[a.length >> 1] : NaN; }

  function niceNum(v){
    if(Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    for(var q = 2; q <= 12; q++) if(Math.abs(v * q - Math.round(v * q)) < 1e-9) return Math.round(v * q) + '/' + q;
    return String(+v.toPrecision(4));
  }

  /* Grades an `expr` item. item: { expr: { answer, vars?, domain?, mode?,
     needC?, mistakes?: [{ expr, why }] } }. A wrong answer gets the first
     authored mistake it matches, else a note on sign, a constant factor or a
     constant; an antiderivative without + C is graded wrong with that note. */
  function gradeItem(item, typed){
    var E = item.expr || {}, vars = E.vars || ['x'], mode = E.mode || 'exact';
    var opts = { vars: vars, domain: E.domain, mode: mode, seed: E.seed };
    if(!String(typed == null ? '' : typed).trim()) return { valid: false, correct: false, score: 0, error: 'Type an expression.' };
    var res = compare(String(typed), E.answer, opts);
    if(!res.valid) return { valid: false, correct: false, score: 0, error: res.error };
    var notes = [], mistake = null, correct = !!res.equal;
    var needC = mode === 'constant' && E.needC !== false;
    if(correct && needC && !res.hasC){ correct = false; notes.push('Add + C: an indefinite integral is a whole family of antiderivatives, and the exam takes the point without it.'); }
    if(!correct && !notes.length){
      (E.mistakes || []).some(function(m){
        var r = compare(String(typed), m.expr, { vars: vars, domain: E.domain, mode: m.mode || mode, seed: E.seed });
        if(r.valid && r.equal){ mistake = m; return true; }
        return false;
      });
      if(mistake) notes.push(mistake.why);
      else if(res.sign) notes.push('The size is right but the sign is wrong everywhere. Check a minus sign (the derivative of cos x is -sin x).');
      else if(res.factor != null) notes.push('Your answer is ' + niceNum(res.factor) + ' times the right one everywhere. Check a constant factor: one from the chain rule, or a coefficient you dropped.');
      else if(mode === 'exact' && res.constant) notes.push('Your answer differs from the right one by a constant (' + niceNum(res.diff) + '). Check the constant term.');
    }
    return { valid: true, correct: correct, score: correct ? 1 : 0, notes: notes, mistake: mistake, tex: res.tex };
  }

  var api = {
    Error: ExprError, parse: parse, compile: compile, fn: fn, number: number, toTex: toTex, read: read,
    compare: compare, grade: gradeItem, points: points, rng: rng, uses: uses, FUNCS: FUNCS.slice()
  };
  root.ApCalcExpr = api;
})(typeof window !== 'undefined' ? window : globalThis);
