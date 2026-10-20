/* AP® Environmental Science expressions: the parser, evaluator and grader behind
   `setup` items, exact-form numeric answers, the live preview and every tool
   (docs/apenv-architecture.md, "Setups"). No eval: a hand-written parser
   builds a small tree, and the tree is compiled to closures. Forked from AP®
   Statistics' stat-expr.js (itself AP® Calculus AB's calc-expr.js).

   What a student types (Bluebook's typed-math notation): numbers, + - * /,
   ^ for powers, brackets, sqrt( ), ln( ), log( ), e, and units after a
   number. × · and an x between two numbers are multiplication; ÷ divides.
     (150 - 120) / 120 * 100        70 / 2        5000 kWh * 0.9 kg/kWh
     2.5 × 10^6 people / 300 km^2   1200 - 500     80 * 0.5^(15/5)
   A unit is a value-1 factor with a dimension, so a setup is graded on its
   number and on whether its units cancel to the answer's unit.

     ApEnvExpr.parse(str, { vars, units }) -> tree (throws ApEnvExpr.Error)
     ApEnvExpr.compile(tree) -> f(scope)
     ApEnvExpr.toTex(tree) -> TeX for ApEnvTex (the preview, keys)
     ApEnvExpr.number(str) -> the value of a constant expression, or NaN
     ApEnvExpr.read(str, opts) -> { ok, tree, tex, error }
     ApEnvExpr.evaluate(str, bind, units?) -> { ok, value, tree, tex, dims, error }
     ApEnvExpr.dims(tree) -> { unit: power } or null when units are mixed in
       a sum; ApEnvExpr.dimText(dims) the unit as text ("kg CO2/yr")
     ApEnvExpr.used(tree) -> { names, numbers, units }
     ApEnvExpr.gradeSetup(item, typed) -> { valid, correct, valueOk, structOk, notes, mistake, value }
       for a `setup` item (docs/apenv-architecture.md, "setup"): graded by
       value and by structure: mustUse, mustNotUse, parens (a difference in
       brackets before it is divided, the percent-change rule), and units
       (unit: the answer's unit; requireUnits: every setup shows them). */
(function(root){
  'use strict';

  function ExprError(msg, at){ this.message = msg; this.at = at; }
  ExprError.prototype = Object.create(Error.prototype);
  ExprError.prototype.name = 'ExprError';

  // Only what a four-function or scientific calculator setup needs: no trig
  // (its names would collide with units: sec, min).
  var FUNCS = ['sqrt', 'exp', 'abs', 'log', 'ln'];
  /* Units a student may write after a number, each with its canonical name
     (the same names ApEnvGrade.normUnit gives). An item adds its own count
     nouns with setup.units ("households", "trees"). */
  var UNIT_CANON = {
    kWh: 'kWh', MWh: 'MWh', GWh: 'GWh', TWh: 'TWh', Wh: 'Wh', kW: 'kW', MW: 'MW', GW: 'GW', W: 'W',
    J: 'J', kJ: 'kJ', MJ: 'MJ', GJ: 'GJ', EJ: 'EJ', BTU: 'BTU', BTUs: 'BTU', Btu: 'BTU', quad: 'quad', quads: 'quad', therm: 'therm', therms: 'therm',
    kcal: 'kcal', cal: 'cal', Calories: 'kcal',
    kg: 'kg', g: 'g', mg: 'mg', ug: 'ug', tonne: 'tonne', tonnes: 'tonne', ton: 'ton', tons: 'ton', lb: 'lb', lbs: 'lb',
    km: 'km', m: 'm', cm: 'cm', mm: 'mm', ft: 'ft', mi: 'mi', miles: 'mi', mile: 'mi', inch: 'in', inches: 'in',
    km2: 'km2', m2: 'm2', cm2: 'cm2', mi2: 'mi2', ft2: 'ft2', m3: 'm3', cm3: 'cm3', km3: 'km3', ft3: 'ft3', ha: 'ha', hectare: 'ha', hectares: 'ha', acre: 'acre', acres: 'acre',
    L: 'L', mL: 'mL', gal: 'gal', gallon: 'gal', gallons: 'gal', liter: 'L', liters: 'L',
    yr: 'yr', yrs: 'yr', year: 'yr', years: 'yr', day: 'day', days: 'day', h: 'h', hr: 'h', hrs: 'h', hour: 'h', hours: 'h', min: 'min', minutes: 'min', week: 'week', weeks: 'week',
    people: 'person', person: 'person', persons: 'person', individuals: 'individual', individual: 'individual',
    ppm: 'ppm', ppb: 'ppb', CO2: 'CO2', '%': '%', '$': '$', dollars: '$', dollar: '$', cents: 'cent', cent: 'cent',
    women: 'woman', woman: 'woman', births: 'birth', deaths: 'death',
    // Phase 3 (author F's report): nanograms, seconds, kiloliters, decades,
    // degrees, and metric tons as t or MT.
    ng: 'ng', kL: 'kL', s: 's', sec: 's', secs: 's', second: 's', seconds: 's', mins: 'min', decade: 'decade', decades: 'decade',
    '°C': '°C', '°F': '°F', t: 'tonne', MT: 'tonne'
  };
  /* One-letter units are read only as a whole word ("86400 s", "40 t"),
     never split out of a longer run, so an unknown word such as "kgs" is
     an error rather than kg times s. */
  var WHOLE_ONLY = { s: 1, t: 1 };
  /* Squares and cubes of a length written with a digit (m2, km3) are that
     length to a power, so m2 x m gives m3 and units cancel as on paper. */
  var POWER_OF = { km2: ['km', 2], m2: ['m', 2], cm2: ['cm', 2], mi2: ['mi', 2], ft2: ['ft', 2], m3: ['m', 3], cm3: ['cm', 3], ft3: ['ft', 3], km3: ['km', 3] };
  var ALIAS = { asin: 'arcsin', acos: 'arccos', atan: 'arctan' };
  var INVERSE = { sin: 'arcsin', cos: 'arccos', tan: 'arctan', sec: 'arcsec', csc: 'arccsc', cot: 'arccot' };
  var GREEK = { theta: 'θ', alpha: 'α', beta: 'β', phi: 'φ', omega: 'ω', mu: 'μ', sigma: 'σ' };
  var SUPS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };

  /* ---------------------------------------------------------- tokens */
  function normalize(s){
    s = String(s == null ? '' : s);
    s = s.replace(/[−–—]/g, '-').replace(/[×·⋅•∙]/g, '*').replace(/÷/g, '/').replace(/π/g, ' pi ').replace(/\*\*/g, '^')
      .replace(/θ/g, ' theta ').replace(/√/g, ' sqrt ').replace(/[[{]/g, '(').replace(/[\]}]/g, ')').replace(/[µμ](?=g\b)/g, 'u');
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, function(m){ return '^(' + m.replace(/./g, function(c){ return SUPS[c]; }) + ')'; });
    return envNormalize(s);
  }
  // 5 x 3 and 5 X 3 are times; ÷ already divides.
  function envNormalize(s){
    // An x (or X) between two numbers or brackets is a times sign, as typed on a phone.
    s = s.replace(/([0-9.)])\s*[xX]\s*(?=[0-9.(])/g, '$1*');
    // A space between digits is not a thousands separator here; a comma is.
    s = s.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
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
        // A whole word that is a unit or a bound name wins (km2, CO2, kWh,
        // people); a name may end in digits. Otherwise the letters are split
        // into known names, longest first (2kg is 2 times kg).
        var full = /^[A-Za-z]+[0-9]*/.exec(s.slice(i))[0], whole = null;
        for(var q = 0; q < names.length && !whole; q++) if(names[q].name === full) whole = names[q];
        if(whole){ out.push({ t: whole.kind, v: whole.name, at: i }); i += full.length; continue; }
        var run = /^[A-Za-z]+/.exec(s.slice(i))[0], j = 0;
        while(j < run.length){
          var rest = run.slice(j), hit = null;
          for(var k = 0; k < names.length && !hit; k++) if(rest.indexOf(names[k].name) === 0 && !(names[k].kind === 'unit' && WHOLE_ONLY[names[k].name])) hit = names[k];
          if(!hit) throw new ExprError('"' + run.slice(j) + '" is not a unit, name or function this answer uses.' + (names.vars.length ? ' Use ' + names.vars.join(', ') + '.' : ''), i + j);
          out.push({ t: hit.kind, v: hit.name, at: i + j }); j += hit.name.length;
        }
        i += run.length; continue;
      }
      if(c === '%' || c === '$'){ out.push({ t: 'unit', v: c, at: i }); i++; continue; }
      // Degrees: °C and °F (a bare ° is not a unit here).
      if(c === '°' && /[CF]/.test(s.charAt(i + 1)) && !/[A-Za-z0-9]/.test(s.charAt(i + 2))){ out.push({ t: 'unit', v: '°' + s.charAt(i + 1), at: i }); i += 2; continue; }
      if('+-*/^(),|_!'.indexOf(c) > -1){ out.push({ t: c, at: i }); i++; continue; }
      if(c === '=') throw new ExprError('Type only the expression, without "y =" or "=".', i);
      throw new ExprError('"' + c + '" cannot be read.', i);
    }
    return out;
  }
  function nameTable(vars, allowC, units){
    var list = [];
    Object.keys(UNIT_CANON).concat(units || []).forEach(function(u){ if(/^[A-Za-z]/.test(u) && vars.indexOf(u) < 0) list.push({ name: u, kind: 'unit' }); });
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
    var vars = opts.vars || [];
    var toks = tokenize(src, nameTable(vars, opts.allowC, opts.units)), p = 0, absDepth = 0;
    if(!toks.length) throw new ExprError('Type an expression.', 0);
    function peek(){ return toks[p]; }
    function next(){ return toks[p++]; }
    function is(t){ return toks[p] && toks[p].t === t; }
    function expect(t, msg){ if(!is(t)) throw new ExprError(msg, toks[p] ? toks[p].at : -1); return next(); }
    function startsFactor(noFn){
      var k = peek();
      if(!k) return false;
      if(k.t === 'num' || k.t === 'var' || k.t === 'const' || k.t === '(' || k.t === 'unit') return true;
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
    /* A number's units bind to it: in "/ 300 km^2" the km^2 is part of the
       divisor, as a reader would read it. */
    function unitPow(){
      var u = next(), node = { k: 'unit', v: u.v };
      if(is('^') && toks[p + 1] && (toks[p + 1].t === 'num' || toks[p + 1].t === '-')){ next(); var neg = is('-') ? (next(), true) : false; var e = next(); node = { k: 'pow', a: node, b: { k: 'num', v: neg ? -e.v : e.v } }; }
      return node;
    }
    var inExp = 0;
    function power(){
      var b = primary();
      while(is('!')){ next(); b = { k: 'fact', a: b }; }
      if(is('^')){ next(); inExp++; var e = unary(); inExp--; b = { k: 'pow', a: b, b: e }; }
      // Units after a quantity (not inside an exponent): 2.5 × 10^6 people.
      if(!inExp){
        var hasU = false;
        while(is('unit')){ b = { k: 'mul', a: b, b: unitPow(), imp: true, qty: true }; hasU = true; }
        // A conversion factor written with a compound unit stays one quantity:
        // in "5000 W / 1000 W/kW" the divisor is 1000 W/kW, as a reader reads
        // it, so W cancels and the answer is in kW (u1-math review).
        while(hasU && is('/') && toks[p + 1] && toks[p + 1].t === 'unit'){ next(); b = { k: 'div', a: b, b: unitPow(), qty: true }; }
      }
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
      if(k.t === 'unit'){ next(); return { k: 'unit', v: k.v }; }
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
  function factorial(x){
    if(!(x >= 0) || Math.abs(x - Math.round(x)) > 1e-9 || x > 170) return NaN;
    var r = 1; for(var i = 2; i <= Math.round(x); i++) r *= i; return r;
  }
  function compile(n){
    switch(n.k){
      case 'num': var v = n.v; return function(){ return v; };
      case 'const': var c = CONST[n.v]; return function(){ return c; };
      case 'var': var name = n.v; return function(s){ var x = s[name]; return x === undefined ? 0 : x; };
      case 'unit': return function(){ return 1; };
      case 'paren': return compile(n.a);
      case 'neg': var f0 = compile(n.a); return function(s){ return -f0(s); };
      case 'fn': var g = F[n.f], a0 = compile(n.a); return function(s){ return g(a0(s)); };
      case 'pow': var pb = compile(n.a), pe = compile(n.b); return function(s){ return rpow(pb(s), pe(s)); };
      case 'fact': var fa = compile(n.a); return function(s){ return factorial(fa(s)); };
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
  function isAtom(n){ return n.k === 'num' && n.v >= 0 || n.k === 'unit' || n.k === 'var' || n.k === 'const' || n.k === 'paren' || n.k === 'fn' && (n.f === 'abs' || n.f === 'sqrt'); }
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
      case 'var': return varTex(n.v);
      case 'unit': return n.v === '%' ? '\\%' : n.v === '$' ? '\\$' : '\\text{' + n.v.replace(/(\d+)$/, '') + '}' + (/\d+$/.test(n.v) && /^[A-Z]/.test(n.v) ? '_{' + n.v.match(/\d+$/)[0] + '}' : /\d+$/.test(n.v) ? '^{' + n.v.match(/\d+$/)[0] + '}' : '');
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
      case 'fact': return (isAtom(n.a) ? toTex(n.a) : wrap(toTex(n.a))) + '!';
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
  // A bound name as TeX: a Greek name as its letter, a name with digits subscripted.
  function varTex(v){
    if(GREEK[v]) return '\\' + v;
    var m = /^([A-Za-z]+?)_?([0-9]+)$/.exec(v);
    if(m && m[1].length === 1) return m[1] + '_{' + m[2] + '}';
    return v.length > 1 ? '\\text{' + v + '}' : v;
  }

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
     of the domain (docs/apenv-architecture.md). Points where the key is not
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

  /* ---------------------------------------------------------- setups */
  // Names an item binds (old, new, rate ...): plain identifiers.
  function bindNames(bind){ return Object.keys(bind || {}); }
  function bindScope(bind){
    var sc = {};
    Object.keys(bind || {}).forEach(function(k){ sc[k] = +bind[k]; });
    return sc;
  }
  function canon(u){ return UNIT_CANON[u] || u; }
  /* The unit of a tree as { unit: power }, cancelling as on paper; null when
     a sum or difference adds unlike units (kg + yr). A bare number is
     dimensionless ({}); "%" and "$" are units like any other. */
  function same(a, b){ var ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every(function(k){ return a[k] === b[k]; }); }
  function dims(n){
    if(!n) return {};
    switch(n.k){
      case 'num': case 'const': case 'var': return {};
      case 'unit': var o = {}, cu = canon(n.v); if(POWER_OF[cu]) o[POWER_OF[cu][0]] = POWER_OF[cu][1]; else o[cu] = 1; return o;
      case 'paren': return dims(n.a);
      case 'neg': return dims(n.a);
      case 'fn': return n.f === 'sqrt' ? halve(dims(n.a)) : {};
      case 'fact': return {};
    }
    var A = dims(n.a), B = dims(n.b);
    if(A === null || B === null) return null;
    if(n.k === 'add' || n.k === 'sub'){
      // A unitless number may sit beside a unit ("1200 - 500 kcal"): the unit carries.
      if(!Object.keys(A).length) return B;
      if(!Object.keys(B).length) return A;
      return same(A, B) ? A : null;
    }
    if(n.k === 'mul' || n.k === 'div'){
      var out = {}, k, sgn = n.k === 'div' ? -1 : 1;
      for(k in A) out[k] = (out[k] || 0) + A[k];
      for(k in B) out[k] = (out[k] || 0) + sgn * B[k];
      for(k in out) if(!out[k]) delete out[k];
      return out;
    }
    if(n.k === 'pow'){
      var e = n.b.k === 'num' ? n.b.v : n.b.k === 'paren' && n.b.a.k === 'num' ? n.b.a.v : null;
      if(!Object.keys(A).length) return {};
      if(e === null) return null;
      var o2 = {}; for(var k2 in A) o2[k2] = A[k2] * e; return o2;
    }
    return {};
  }
  function halve(d){ if(d === null) return null; var o = {}; for(var k in d) o[k] = d[k] / 2; return o; }
  function dimText(d){
    if(!d) return '';
    var top = [], bot = [];
    Object.keys(d).sort().forEach(function(k){ var e = d[k]; if(e > 0) top.push(e === 1 ? k : k + '^' + e); else if(e < 0) bot.push(e === -1 ? k : k + '^' + (-e)); });
    return (top.join(' ') || (bot.length ? '1' : '')) + (bot.length ? '/' + bot.join(' ') : '');
  }
  /* A unit written as text ("kg CO2/yr", "people/km^2") in the same form as
     dims, so the two compare. */
  function unitDims(text, extra){
    var t = String(text || '').trim();
    if(!t) return {};
    try{ return dims(parse('1 ' + t.replace(/\bper\b/g, '/'), { vars: [], units: extra })); }catch(e){ return null; }
  }
  function evaluate(str, bind, units){
    var vars = bindNames(bind), r = read(str, { vars: vars, units: units });
    if(!r.ok) return { ok: false, error: r.error };
    var v = compile(r.tree)(bindScope(bind));
    return { ok: isFinite(v), tree: r.tree, tex: r.tex, value: v, dims: dims(r.tree), error: isFinite(v) ? undefined : 'That does not give a number.' };
  }
  function used(tree){
    var out = { names: [], numbers: [], units: [] };
    (function walk(n){
      if(!n) return;
      if(n.k === 'var' && out.names.indexOf(n.v) < 0) out.names.push(n.v);
      if(n.k === 'num' && out.numbers.indexOf(n.v) < 0) out.numbers.push(n.v);
      if(n.k === 'unit' && out.units.indexOf(canon(n.v)) < 0) out.units.push(canon(n.v));
      walk(n.a); walk(n.b);
    })(tree);
    return out;
  }
  /* Does `token` (a bound name, a number written as text, or a unit) appear?
     A name counts when typed by name or by its bound value. */
  function appears(token, u, bind){
    var name = String(token).trim(), sc = bindScope(bind);
    if(u.names.indexOf(name) > -1) return true;
    if(UNIT_CANON[name] && u.units.indexOf(canon(name)) > -1) return true;
    var v = name in sc ? sc[name] : parseFloat(name);
    if(!isFinite(v)) return false;
    return u.numbers.some(function(x){ return Math.abs(x - v) <= 1e-9 * Math.max(1, Math.abs(v)); });
  }
  /* The percent-change rule the readers check: every division whose
     numerator is a difference has that difference in brackets. "150 - 120 /
     120" parses as 150 - (120/120) and is caught by its value; this catches
     a right value typed without the brackets the setup point needs. */
  function bareDifferences(n, out){
    out = out || [];
    if(!n) return out;
    if(n.k === 'div' && (n.a.k === 'sub' || n.a.k === 'add')) out.push(n);
    bareDifferences(n.a, out); bareDifferences(n.b, out);
    return out;
  }
  function hasDivOfDifference(n){
    if(!n) return false;
    if(n.k === 'div' && n.a.k === 'paren' && (n.a.a.k === 'sub' || n.a.a.k === 'add')) return true;
    return hasDivOfDifference(n.a) || hasDivOfDifference(n.b);
  }
  function hasSub(n){ return !!n && (n.k === 'sub' || hasSub(n.a) || hasSub(n.b)); }
  function hasMul100(n){
    if(!n) return false;
    if(n.k === 'mul' && ((n.b.k === 'num' && n.b.v === 100) || (n.a.k === 'num' && n.a.v === 100))) return true;
    return hasMul100(n.a) || hasMul100(n.b);
  }
  /* Grades a `setup` item: { setup: { answer, bind?, unit?, units?: [count
     nouns], mustUse?, mustNotUse?, parens?: true (a difference divided must
     be in brackets; on by default when the key has one), times100?: true,
     requireUnits?: true, mistakes?: [{ expr, why }], tol? } }. Value first
     (relative 1e-6, ignoring units), then structure. */
  function gradeSetup(item, typed){
    var S = item.setup || {}, bind = S.bind || {}, tol = S.tol || 1e-6, U = S.units || [];
    if(!String(typed == null ? '' : typed).trim()) return { valid: false, correct: false, error: 'Type the expression.' };
    var got = evaluate(String(typed), bind, U);
    if(!got.ok) return { valid: false, correct: false, error: got.error || 'That expression cannot be worked out.' };
    var key = evaluate(String(S.answer), bind, U);
    if(!key.ok) return { valid: false, correct: false, error: 'This item has a broken key.' };
    function close(a, b){ return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b)); }
    var notes = [], mistake = null, valueOk = close(got.value, key.value);
    if(!valueOk){
      (S.mistakes || []).some(function(m){ var r = evaluate(String(m.expr), bind, U); if(r.ok && close(got.value, r.value)){ mistake = m; return true; } return false; });
      if(mistake) notes.push(mistake.why);
      else if(bareDifferences(got.tree).length || (hasDivOfDifference(key.tree) && !hasDivOfDifference(got.tree) && hasSub(got.tree))) notes.push('Put the difference in brackets before you divide: (new - old) / old. Without them the division happens first.');
      else if(close(got.value * 100, key.value)) notes.push('Multiply by 100 to turn the fraction into a percent.');
      else if(close(got.value, key.value * 100)) notes.push('You multiplied by 100 one time too many.');
      else notes.push('That expression does not give the right value.');
    }
    var u = used(got.tree), structOk = true;
    if(valueOk){
      var needParens = S.parens != null ? S.parens : hasDivOfDifference(key.tree);
      if(needParens && (bareDifferences(got.tree).length || !hasDivOfDifference(got.tree))){ structOk = false; notes.push('Show the brackets: (new - old) / old. Readers give the setup point only when the subtraction is clearly done before the division.'); }
      if((S.times100 != null ? S.times100 : hasMul100(key.tree)) && !hasMul100(got.tree)){ structOk = false; notes.push('Show the × 100 that turns the fraction into a percent.'); }
      (S.mustUse || []).forEach(function(t){ if(!appears(t, u, bind)){ structOk = false; notes.push('Show ' + t + ' in the setup: the exam wants the values substituted, then the answer.'); } });
      (S.mustNotUse || []).forEach(function(t){ if(appears(t, u, bind)){ structOk = false; notes.push(t + ' does not belong in this setup.'); } });
      if(S.requireUnits || S.unit){
        var want = S.unit != null ? unitDims(S.unit, U) : key.dims;
        if(!u.units.length && want && Object.keys(want).length){ structOk = false; notes.push('Write the units in the setup (kWh, kg, people), so they visibly cancel to ' + dimText(want) + '.'); }
        else if(u.units.length){
          if(got.dims === null){ structOk = false; notes.push('Your setup adds or subtracts quantities with different units.'); }
          else if(want && !same(got.dims, want)){ structOk = false; notes.push('Your units come out as ' + (dimText(got.dims) || 'no unit') + ', not ' + dimText(want) + '. Check that each conversion factor is the right way up, so the units cancel.'); }
        }
      }
    }
    return { valid: true, correct: valueOk && structOk, valueOk: valueOk, structOk: structOk, notes: notes, mistake: mistake,
      value: got.value, dims: got.dims, unit: dimText(got.dims), tex: got.tex };
  }

  var api = {
    evaluate: evaluate, used: used, gradeSetup: gradeSetup, dims: dims, dimText: dimText, unitDims: unitDims, UNIT_CANON: UNIT_CANON, factorial: factorial,
    Error: ExprError, parse: parse, compile: compile, fn: fn, number: number, toTex: toTex, read: read,
    compare: compare, grade: gradeItem, points: points, rng: rng, uses: uses, FUNCS: FUNCS.slice()
  };
  root.ApEnvExpr = api;
})(typeof window !== 'undefined' ? window : globalThis);
