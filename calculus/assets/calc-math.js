/* AP® Calculus AB math rendering: a small TeX subset to MathML, so math reads
   like a textbook offline with no library (docs/apcalc-authoring-guide.md,
   "Math syntax"). The generator renders every $...$ in authored text at build
   time with this same file (scripts/lib/apcalc-mathlib.mjs); the runtime uses
   it for the live preview of typed answers and in tools.

     ApCalcTex.render(tex, { display, strict }) -> '<math ...>...</math>'
       Each formula keeps its source in <annotation encoding="application/x-tex">
       (screen readers read the MathML; the ordering check reads the TeX).
       strict: throw ApCalcTex.Error on anything outside the subset (the build);
       otherwise unknown commands show as text (the preview).
     ApCalcTex.html(str, opts) -> str with $$...$$ (display) and $...$ (inline)
       rendered; \$ is a literal dollar sign.
     ApCalcTex.text(tex) -> plain text ("∫ from 0 to 1 of x² dx"), for titles,
       labels and search.
     ApCalcTex.check(str) -> [problems] (unbalanced $, unknown commands)

   The subset: letters, numbers, + - = < > ( ) [ ] | , ' (prime: f' f'')
     ^{...} _{...}   \frac \dfrac \tfrac {a}{b}   \sqrt{x} \sqrt[3]{x}
     \int \sum \lim (limits: \int_0^1, \lim_{x \to 2^-}, \sum_{i=1}^{n})
     \left( \right) \left[ \right] \left| \right| \left. \right|_{a}^{b}
     \big| \Big| (evaluation bars)   \sin \cos \tan \sec \csc \cot \ln \log
     \exp \arcsin \arccos \arctan \max \min \operatorname{name}
     \text{words} \mathrm{d}   \mathbb{R}   \begin{cases} a & b \\ c & d \end{cases}
     \begin{aligned} ... \end{aligned}   \displaystyle
     Greek \alpha ... \omega, \Delta \Sigma \Pi; \pi \theta \infty \cdot \times \pm \mp
     \le \ge \ne \approx \to \rightarrow \Rightarrow \in \circ \prime \ldots \cdots
     \mid \lvert \rvert \{ \} \% \$ \&   spaces \, \; \: \! \quad \qquad */
(function(root){
  'use strict';
  function TexError(msg){ this.message = msg; }
  TexError.prototype = Object.create(Error.prototype);
  TexError.prototype.name = 'TexError';

  var GREEK = { alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ',
    lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
    Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Sigma: 'Σ', Pi: 'Π', Phi: 'Φ', Omega: 'Ω' };
  var OPS = { cdot: '⋅', times: '×', pm: '±', mp: '∓', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', to: '→',
    rightarrow: '→', Rightarrow: '⇒', leftarrow: '←', Leftrightarrow: '⇔', implies: '⇒', in: '∈', notin: '∉', circ: '∘', ldots: '…', cdots: '⋯', dots: '…',
    mid: '|', lvert: '|', rvert: '|', vert: '|', lbrace: '{', rbrace: '}', '{': '{', '}': '}', '%': '%', '$': '$', '&': '&', '#': '#', '_': '_',
    sim: '∼', equiv: '≡', cap: '∩', cup: '∪', subset: '⊂', div: '÷', ast: '∗', star: '⋆', prime: '′', angle: '∠', triangle: '△', perp: '⊥', parallel: '∥', degree: '°' };
  var IDENT = { infty: '∞', partial: '∂', ell: 'ℓ', emptyset: '∅', varnothing: '∅' };
  var FUNCS = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'ln', 'log', 'exp', 'arcsin', 'arccos', 'arctan', 'max', 'min', 'det', 'gcd'];
  var BIG = { int: '∫', sum: '∑', prod: '∏', lim: 'lim', iint: '∬', oint: '∮' };
  var SPACE = { ',': '0.1667em', ':': '0.2222em', '>': '0.2222em', ';': '0.2778em', ' ': '0.25em', quad: '1em', qquad: '2em', '!': '-0.1667em' };
  var BB = { R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ' };
  var FENCE = { '(': '(', ')': ')', '[': '[', ']': ']', '|': '|', '.': '', '\\{': '{', '\\}': '}', '\\lbrace': '{', '\\rbrace': '}', '\\|': '‖', '\\lvert': '|', '\\rvert': '|', '\\langle': '⟨', '\\rangle': '⟩' };

  /* ---------------------------------------------------------- tokens */
  function tokenize(s){
    var out = [], i = 0;
    function push(t, len){ t.at = i; t.end = i + len; out.push(t); i += len; }
    while(i < s.length){
      var c = s.charAt(i);
      if(c === '\\'){
        var m = /^\\([A-Za-z]+)/.exec(s.slice(i));
        if(m){ push({ t: 'cmd', v: m[1] }, m[0].length); continue; }
        var n = s.charAt(i + 1);
        if(n === '\\'){ push({ t: 'newline' }, 2); continue; }
        push({ t: 'cmd', v: n }, 2); continue;
      }
      if(/\s/.test(c)){ i++; continue; }
      if(/[0-9]/.test(c) || c === '.' && /[0-9]/.test(s.charAt(i + 1))){
        var d = /^[0-9]*\.?[0-9]+|^[0-9]+\.?/.exec(s.slice(i))[0];
        push({ t: 'num', v: d }, d.length); continue;
      }
      if(c === "'"){ var pr = /^'+/.exec(s.slice(i))[0]; push({ t: 'prime', v: pr.length }, pr.length); continue; }
      push({ t: c === '{' || c === '}' || c === '^' || c === '_' || c === '&' ? c : 'ch', v: c }, 1);
    }
    return out;
  }

  /* ---------------------------------------------------------- parser -> tree
     Nodes: { k: 'mi'|'mn'|'mo'|'mtext'|'space'|'row'|'frac'|'sqrt'|'scripts'|
     'big'|'fence'|'table'|'prime', ... } */
  function parse(tex, strict){
    var toks = tokenize(String(tex)), p = 0, display = false;
    function fail(msg){ if(strict) throw new TexError(msg + ' in $' + tex + '$'); }
    function peek(){ return toks[p]; }
    function group(){
      // A {...} group or a single token, as the argument of a command or script.
      var t = toks[p];
      if(!t){ fail('missing argument'); return { k: 'row', c: [] }; }
      if(t.t === '{'){ p++; var r = row(['}']); if(toks[p] && toks[p].t === '}') p++; else fail('unclosed {'); return r; }
      return atom();
    }
    function rawGroup(){
      // The literal source of a {...} group (\\text, \\operatorname, \\begin),
      // spaces included.
      var t = toks[p];
      if(!t || t.t !== '{'){ fail('missing {'); return ''; }
      var depth = 0, q = p + 1;
      while(toks[q] && !(toks[q].t === '}' && depth === 0)){ if(toks[q].t === '{') depth++; if(toks[q].t === '}') depth--; q++; }
      if(!toks[q]){ fail('unclosed {'); p = q; return ''; }
      var s = String(tex).slice(t.end, toks[q].at);
      p = q + 1;
      return s;
    }
    function row(stops){
      var c = [];
      while(p < toks.length){
        var t = toks[p];
        if(stops.indexOf(t.t) > -1 || t.t === 'ch' && t.v === ']' && stops.indexOf(']') > -1) break;
        if(t.t === 'cmd' && (t.v === 'right' || t.v === 'end') && stops.indexOf(t.v) > -1) break;
        if(t.t === '^' || t.t === '_'){
          var base = c.length ? c.pop() : { k: 'mi', v: '' };
          c.push(scripts(base));
          continue;
        }
        if(t.t === 'prime'){
          p++;
          var b = c.length ? c.pop() : { k: 'mi', v: '' };
          // A prime sits after its base at text height (f′, y″), as print does.
          var node = { k: 'row', c: [b, { k: 'mo', v: t.v === 1 ? '′' : t.v === 2 ? '″' : '‴', prime: true }] };
          if(peek() && (peek().t === '^' || peek().t === '_')) node = scripts(node);
          c.push(node);
          continue;
        }
        // A minus or plus with nothing to subtract from (at the start, after
        // =, (, a comma, \to or another operator) is a sign: no binary spacing.
        if((t.t === 'ch' && (t.v === '-' || t.v === '+') || t.t === 'cmd' && (t.v === 'pm' || t.v === 'mp')) && signAt(c)){
          p++;
          c.push({ k: 'mo', v: t.v === '-' ? '−' : t.v === '+' ? '+' : OPS[t.v], sign: true });
          continue;
        }
        var a = atom();
        if(a) c.push(a);
      }
      return { k: 'row', c: c };
    }
    function signAt(c){
      for(var i = c.length - 1; i >= 0; i--){
        var q = c[i];
        if(q.k === 'space') continue;
        if(q.k === 'big') return true;
        // An opening bar (an odd count so far): |-2|.
        if(q.k === 'mo' && q.v === '|' && !q.size) return c.filter(function(o){ return o.k === 'mo' && o.v === '|' && !o.size; }).length % 2 === 1;
        // After any operator but a closing bracket, a factorial or a size bar.
        return q.k === 'mo' && !q.prime && !q.size && ')]}‖!′″‴…⋯'.indexOf(q.v) < 0;
      }
      return true;
    }
    function scripts(base){
      var sub = null, sup = null;
      for(var n = 0; n < 2; n++){
        var t = peek();
        if(!t) break;
        if(t.t === '_' && !sub){ p++; sub = group(); }
        else if(t.t === '^' && !sup){
          p++;
          // f'^2 and x^\prime keep reading as primes.
          sup = group();
        }
        else break;
      }
      return { k: 'scripts', base: base, sub: sub, sup: sup };
    }
    function atom(){
      var t = toks[p++];
      if(t.t === 'num') return { k: 'mn', v: t.v };
      if(t.t === '{'){ var r = row(['}']); if(toks[p] && toks[p].t === '}') p++; else fail('unclosed {'); return r; }
      if(t.t === '}'){ fail('unmatched }'); return null; }
      if(t.t === '&' || t.t === 'newline'){ fail('& or \\\\ outside cases or aligned'); return null; }
      if(t.t === 'ch'){
        var ch = t.v;
        if(/[A-Za-z]/.test(ch)) return { k: 'mi', v: ch };
        if(ch === '-') return { k: 'mo', v: '−' };
        if(ch === '*') return { k: 'mo', v: '∗' };
        if('+=<>,;:!?/()[]|'.indexOf(ch) > -1) return { k: 'mo', v: ch, fence: '()[]|'.indexOf(ch) > -1 };
        if(ch === '~') return { k: 'space', w: '0.25em' };
        return { k: 'mo', v: ch };
      }
      var v = t.v;
      if(GREEK[v]) return { k: 'mi', v: GREEK[v], upright: /^[A-Z]/.test(v) };
      if(IDENT[v]) return { k: 'mi', v: IDENT[v], upright: true };
      if(OPS[v] != null) return { k: 'mo', v: OPS[v] };
      if(SPACE[v]) return { k: 'space', w: SPACE[v] };
      if(FUNCS.indexOf(v) > -1) return { k: 'fn', v: v };
      if(BIG[v]) return { k: 'big', v: BIG[v], name: v };
      if(v === 'frac' || v === 'dfrac' || v === 'tfrac' || v === 'cfrac') return { k: 'frac', num: group(), den: group(), style: v === 'dfrac' ? 'd' : v === 'tfrac' ? 't' : '' };
      if(v === 'sqrt'){
        var idx = null;
        if(peek() && peek().t === 'ch' && peek().v === '['){
          p++; idx = row([']']);
          if(peek() && peek().v === ']') p++; else fail('unclosed [');
        }
        return { k: 'sqrt', a: group(), idx: idx };
      }
      if(v === 'text' || v === 'textrm' || v === 'mbox' || v === 'textit' || v === 'textbf') return { k: 'mtext', v: rawGroup() };
      if(v === 'mathrm' || v === 'operatorname'){ return { k: 'fn', v: rawGroup(), op: v === 'operatorname' }; }
      if(v === 'mathbb'){ var l = rawGroup(); return { k: 'mi', v: BB[l] || l, upright: true }; }
      if(v === 'mathbf' || v === 'boldsymbol'){ return { k: 'mi', v: rawGroup(), bold: true }; }
      if(v === 'displaystyle'){ display = true; return null; }
      if(v === 'left'){
        var open = fenceTok();
        var inner = row(['right']);
        if(!(toks[p] && toks[p].t === 'cmd' && toks[p].v === 'right')){ fail('\\left without \\right'); return { k: 'fence', open: open, close: '', a: inner }; }
        p++;
        var close = fenceTok();
        return { k: 'fence', open: open, close: close, a: inner };
      }
      if(v === 'right'){ fail('\\right without \\left'); return null; }
      if(v === 'big' || v === 'Big' || v === 'bigg' || v === 'Bigg' || v === 'bigl' || v === 'bigr' || v === 'Bigl' || v === 'Bigr'){
        return { k: 'mo', v: fenceTok(), size: /^B/.test(v) ? (v.indexOf('gg') > -1 ? '2.4em' : '1.8em') : (v.indexOf('gg') > -1 ? '2.1em' : '1.2em') };
      }
      if(v === 'begin'){
        var env = rawGroup();
        if(env !== 'cases' && env !== 'aligned' && env !== 'array' && env !== 'matrix'){ fail('unknown environment ' + env); }
        if(env === 'array' && peek() && peek().t === '{') rawGroup();
        var rows = [[]];
        for(;;){
          var cell = row(['&', 'newline', 'end']);
          rows[rows.length - 1].push(cell);
          var u = toks[p];
          if(!u){ fail('\\begin{' + env + '} without \\end'); break; }
          if(u.t === '&'){ p++; continue; }
          if(u.t === 'newline'){ p++; rows.push([]); continue; }
          if(u.t === 'cmd' && u.v === 'end'){ p++; rawGroup(); break; }
        }
        if(rows.length && rows[rows.length - 1].length === 1 && !rows[rows.length - 1][0].c.length) rows.pop();
        return { k: 'table', env: env, rows: rows };
      }
      if(v === 'end'){ fail('\\end without \\begin'); return null; }
      if(v === 'quad' || v === 'qquad') return { k: 'space', w: SPACE[v] };
      fail('unknown command \\' + v);
      return { k: 'mtext', v: '\\' + v };
    }
    function fenceTok(){
      var t = toks[p++];
      if(!t){ fail('missing delimiter'); return ''; }
      var key = t.t === 'cmd' ? '\\' + t.v : t.v;
      if(FENCE[key] == null){ fail('unknown delimiter ' + key); return key || ''; }
      return FENCE[key];
    }
    var tree = row([]);
    if(p < toks.length) fail('unexpected ' + (toks[p].v || toks[p].t));
    return { tree: tree, display: display };
  }

  /* ---------------------------------------------------------- MathML */
  function esc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function ml(n){
    if(!n) return '';
    switch(n.k){
      case 'row': return n.c.length === 1 ? ml(n.c[0]) : '<mrow>' + n.c.map(ml).join('') + '</mrow>';
      case 'mi': return '<mi' + (n.upright ? ' mathvariant="normal"' : n.bold ? ' mathvariant="bold"' : '') + '>' + esc(n.v) + '</mi>';
      case 'mn': return '<mn>' + esc(n.v) + '</mn>';
      case 'mo':
        if(n.size) return '<mo stretchy="true" symmetric="true" minsize="' + n.size + '" maxsize="' + n.size + '">' + esc(n.v) + '</mo>';
        if(n.prime) return '<mo lspace="0" rspace="0">' + esc(n.v) + '</mo>';
        if(n.sign) return '<mo form="prefix" lspace="0" rspace="0">' + esc(n.v) + '</mo>';
        return '<mo' + (n.fence ? ' stretchy="false"' : '') + '>' + esc(n.v) + '</mo>';
      case 'mtext': return '<mtext>' + esc(n.v) + '</mtext>';
      case 'space': return '<mspace width="' + n.w + '"></mspace>';
      case 'fn': return '<mi' + (n.v.length === 1 ? ' mathvariant="normal"' : '') + '>' + esc(n.v) + '</mi><mo lspace="0" rspace="0.1667em">&#x2061;</mo>';
      case 'big': return n.name === 'lim' ? '<mo movablelimits="false">lim</mo>' : '<mo largeop="true" movablelimits="false">' + n.v + '</mo>';
      case 'frac': {
        var f = '<mfrac>' + ml(n.num) + ml(n.den) + '</mfrac>';
        return n.style === 'd' ? '<mstyle displaystyle="true">' + f + '</mstyle>' : n.style === 't' ? '<mstyle displaystyle="false">' + f + '</mstyle>' : f;
      }
      case 'sqrt': return n.idx ? '<mroot>' + ml(n.a) + ml(n.idx) + '</mroot>' : '<msqrt>' + ml(n.a) + '</msqrt>';
      case 'fence':
        return '<mrow>' + (n.open ? '<mo fence="true" stretchy="true">' + esc(n.open) + '</mo>' : '') + ml(n.a) + (n.close ? '<mo fence="true" stretchy="true">' + esc(n.close) + '</mo>' : '') + '</mrow>';
      case 'table': {
        var rowsMl = n.rows.map(function(r){ return '<mtr>' + r.map(function(c){ return '<mtd>' + ml(c) + '</mtd>'; }).join('') + '</mtr>'; }).join('');
        if(n.env === 'cases') return '<mrow><mo stretchy="true">{</mo><mtable columnalign="left left" columnspacing="1em">' + rowsMl + '</mtable></mrow>';
        if(n.env === 'aligned') return '<mtable columnalign="right left" columnspacing="0" displaystyle="true">' + rowsMl + '</mtable>';
        return '<mtable>' + rowsMl + '</mtable>';
      }
      case 'scripts': {
        var b = n.base, base, under = b.k === 'big' && b.name !== 'int' && b.name !== 'iint' && b.name !== 'oint';
        // A function with a power (sin^2) keeps its apply-function mark after the power.
        if(b.k === 'fn'){
          var name = '<mi' + (b.v.length === 1 ? ' mathvariant="normal"' : '') + '>' + esc(b.v) + '</mi>';
          return wrapScripts(name, n, false) + '<mo lspace="0" rspace="0.1667em">&#x2061;</mo>';
        }
        base = ml(b);
        return wrapScripts(base, n, under);
      }
    }
    return '';
  }
  function wrapScripts(base, n, under){
    var sub = n.sub ? ml(n.sub) : '', sup = n.sup ? ml(n.sup) : '';
    if(under){
      if(sub && sup) return '<munderover>' + base + sub + sup + '</munderover>';
      if(sub) return '<munder>' + base + sub + '</munder>';
      return '<mover>' + base + sup + '</mover>';
    }
    if(sub && sup) return '<msubsup>' + base + sub + sup + '</msubsup>';
    if(sub) return '<msub>' + base + sub + '</msub>';
    return '<msup>' + base + sup + '</msup>';
  }

  function render(tex, opts){
    opts = opts || {};
    var r = parse(tex, !!opts.strict);
    var display = opts.display || r.display;
    return '<math class="calc-m"' + (display ? ' display="block"' : '') + '><semantics>' + (r.tree.c.length === 1 ? '<mrow>' + ml(r.tree) + '</mrow>' : ml(r.tree)) +
      '<annotation encoding="application/x-tex">' + esc(String(tex).trim()) + '</annotation></semantics></math>';
  }

  /* ---------------------------------------------------------- text */
  var SUPD = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '−': '⁻', '-': '⁻', '+': '⁺' };
  function tx(n){
    if(!n) return '';
    switch(n.k){
      case 'row': return n.c.map(tx).join('').replace(/\s+/g, ' ');
      case 'mi': case 'mn': case 'mtext': return n.v;
      case 'mo': return n.sign ? n.v : /[=<>≤≥≠≈→⇒±+−∈]/.test(n.v) && !n.fence ? ' ' + n.v + ' ' : n.v === ',' ? ', ' : n.v;
      case 'space': return ' ';
      case 'fn': return n.v + ' ';
      case 'big': return n.v + ' ';
      case 'frac': { var a = tx(n.num).trim(), b = tx(n.den).trim(); return par(a) + '/' + par(b) + ' '; }
      case 'sqrt': return (n.idx ? tx(n.idx) : '') + '√' + par(tx(n.a).trim());
      case 'fence': return n.open + tx(n.a).trim() + n.close;
      case 'table': return n.rows.map(function(r){ return r.map(tx).join(', '); }).join('; ');
      case 'scripts': {
        var b0 = n.base;
        if(b0.k === 'big' && b0.name === 'int' && (n.sub || n.sup)) return '∫ from ' + tx(n.sub).trim() + ' to ' + tx(n.sup).trim() + ' of ';
        if(b0.k === 'big' && b0.name === 'lim') return 'lim as ' + tx(n.sub).trim() + ', ';
        if(b0.k === 'big' && b0.name === 'sum') return '∑ for ' + tx(n.sub).trim() + ' to ' + tx(n.sup).trim() + ' of ';
        var s = tx(b0).trimEnd();
        if(n.sub) s += '_' + par(tx(n.sub).trim());
        if(n.sup){
          var u = tx(n.sup).trim();
          s += /^[0-9−+-]+$/.test(u) ? u.replace(/./g, function(c){ return SUPD[c]; }) : /^[′″‴]$/.test(u) ? u : '^' + par(u);
        }
        return s + (b0.k === 'fn' ? ' ' : '');
      }
    }
    return '';
  }
  function par(s){ return /^[A-Za-z0-9.πθ∞′″⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+$/.test(s) ? s : '(' + s + ')'; }
  function text(tex){
    try{ return tx(parse(tex, false).tree).replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim(); }
    catch(e){ return String(tex); }
  }

  /* ---------------------------------------------------------- in text */
  var MATH_RE = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  /* A long inline chain (a = b = c) is split before each top-level = or \approx
     into pieces of math with a space between, so a line can wrap there: MathML
     never breaks inside an inline formula, and on a phone one long chain made
     the whole page scroll sideways (AP® Calculus AB launch). */
  var BREAK_AT = 30;
  function splitChain(tex){
    var out = [], from = 0, depth = 0, i = 0, m;
    while(i < tex.length){
      var c = tex[i];
      if(c === '\\'){
        m = /^\\([A-Za-z]+|.)/.exec(tex.slice(i));
        var cmd = m ? m[1] : '';
        if(cmd === 'left' || cmd === 'begin') depth++;
        else if(cmd === 'right' || cmd === 'end') depth--;
        else if(cmd === 'approx' && depth === 0 && i > from){ out.push(tex.slice(from, i)); from = i; }
        i += m ? m[0].length : 1; continue;
      }
      if(c === '{') depth++;
      else if(c === '}') depth--;
      else if(c === '=' && depth === 0 && i > from && tex.slice(from, i).trim()){ out.push(tex.slice(from, i)); from = i; }
      i++;
    }
    out.push(tex.slice(from));
    return out.map(function(x){ return x.trim(); }).filter(Boolean);
  }
  function inline(tex, opts){
    var parts = text(tex).length > BREAK_AT ? splitChain(tex) : [tex];
    if(parts.length < 2) return render(tex, opts);
    return parts.map(function(x){ return render(x, opts); }).join(' ');
  }
  function html(str, opts){
    var s = String(str == null ? '' : str);
    if(s.indexOf('$') < 0) return s;
    return s.replace(/\\\$/g, '\u0000').replace(MATH_RE, function(m, d, i){
      var o = { display: d !== undefined, strict: opts && opts.strict };
      return d !== undefined ? render(d, o) : inline(i, o);
    }).replace(/\u0000/g, '$');
  }
  function plain(str){
    var s = String(str == null ? '' : str);
    if(s.indexOf('$') < 0) return s;
    return s.replace(/\\\$/g, '\u0000').replace(MATH_RE, function(m, d, i){ return text(d !== undefined ? d : i); }).replace(/\u0000/g, '$');
  }
  function check(str){
    var s = String(str == null ? '' : str).replace(/\\\$/g, ''), out = [];
    var stripped = s.replace(MATH_RE, ' ');
    if(stripped.indexOf('$') > -1) out.push('an unmatched $ (write a literal dollar as \\$)');
    s.replace(MATH_RE, function(m, d, i){
      try{ parse(d !== undefined ? d : i, true); }catch(e){ out.push(e.message); }
      return m;
    });
    return out;
  }

  root.ApCalcTex = { Error: TexError, render: render, html: html, text: text, plain: plain, check: check, parse: parse };
})(typeof window !== 'undefined' ? window : globalThis);
