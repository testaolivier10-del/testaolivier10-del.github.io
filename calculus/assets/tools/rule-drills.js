/* Rule drills (drill; docs/apcalc-spec.md section 6). OWNED BY THIS TOOL ONLY.
   The model is ApCalcMath.ruleDrills (tools/math/rule-drills.js); math
   text is ApCalcTex; plots are ApCalcPlot; the frame is ApCalcTools.modes
   (Explore, then Test yourself) on the Tool Studio.

   Explore, the rule picker: type any function of x (or tap an example). The
   stage shows it as a structure: the rule that comes first at the top, its
   pieces under it, colour-coded (purple: u, the top or the outer function;
   green: v, the bottom or the inner function), each with its own rule and
   derivative, and f'(x) put together; on a wide stage the graphs of f
   (crimson) and f' (blue) beside it.
   Test yourself: ApCalcTools.drill over the model's thirteen kinds. The
   figure on the stage builds as you answer: the plain function until you
   name the rule, then its tree, each piece showing its derivative once you
   have it, f'(x) at the end. Implicit curves are drawn from the equation
   (with the tangent line once you have the slope); an inverse is drawn as
   the mirror image of f in y = x with both tangent lines; second
   derivatives as f, f' and f'' together. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot, E = window.ApCalcExpr;
  if(!T || !M || !M.ruleDrills || !P || !E) return;
  var RD = M.ruleDrills, esc = T.esc;
  function X(){ return window.ApCalcTex; }
  function tx(s){ return X() ? X().html(String(s)) : esc(s); }
  function tm(t, display){ return X() ? X().render(t, { display: !!display }) : esc(t); }
  function r2(v){ return Math.round(v * 100) / 100; }

  /* Formulas with coloured pieces: the TeX holds \text{QQA}-style
     placeholders; each is replaced in the MathML by its own rendered piece,
     wrapped in a class for its colour. */
  function inner(t){ var m = /<semantics>([\s\S]*?)<annotation/.exec(tm(t)); return m ? m[1] : esc(t); }
  function colored(texWith, parts, plainTex){
    var h = tm(texWith, false);
    Object.keys(parts).forEach(function(id){ h = h.replace('<mtext>' + id + '</mtext>', '<mrow class="' + parts[id].cls + '">' + inner(parts[id].tex) + '</mrow>'); });
    if(plainTex) h = h.replace(/<annotation encoding="application\/x-tex">[\s\S]*?<\/annotation>/, '<annotation encoding="application/x-tex">' + esc(plainTex) + '</annotation>');
    return h;
  }
  var ROLE = { u: 'a', top: 'a', outer: 'a', v: 'b', bottom: 'b', inner: 'b', term: 't', factor: 't' };
  var ROLE_NAME = { u: 'u', v: 'v', top: 'top', bottom: 'bottom', outer: 'outer', inner: 'inner u', term: 'term', factor: 'factor' };
  var DNAME = { u: "u'", v: "v'", top: "u'", bottom: "v'", outer: "\\frac{d}{du}", inner: "u'", term: '', factor: '' };
  /* f(x) = the top-level pieces in their colours. */
  function headline(node, lhs){
    var k = node.kids, L = lhs || 'f(x) =';
    var par = function(i, id){ var r = k[i].node.rule; return r === 'sum' || (r === 'multiple' && /^-/.test(k[i].node.tex)) ? '\\left(\\text{' + id + '}\\right)' : '\\text{' + id + '}'; };
    if(node.rule === 'product') return colored(L + ' ' + par(0, 'QQA') + '\\,' + par(1, 'QQB'), { QQA: { tex: k[0].node.tex, cls: 'rd-ca' }, QQB: { tex: k[1].node.tex, cls: 'rd-cb' } }, L + ' ' + node.tex);
    if(node.rule === 'quotient') return colored(L + ' \\frac{\\text{QQA}}{\\text{QQB}}', { QQA: { tex: k[0].node.tex, cls: 'rd-ca' }, QQB: { tex: k[1].node.tex, cls: 'rd-cb' } }, L + ' ' + node.tex);
    if(node.rule === 'chain'){
      var o = node.outer.tex.replace(/(^|[^a-zA-Z\\])u(?![a-zA-Z])/g, '$1\\text{QQB}');
      return colored(L + ' \\text{QQA}', { QQA: { tex: o, cls: 'rd-ca' } }, L + ' ' + node.tex).replace('<mtext>QQB</mtext>', '<mrow class="rd-cb">' + inner(k[1].node.tex) + '</mrow>');
    }
    return tm(L + ' ' + node.tex);
  }
  /* The structure as a tree of cards. o: { depth, reveal: { role: true },
     showD, hideRule } */
  function treeHtml(node, o, role, depth){
    o = o || {}; depth = depth || 0;
    var cls = role ? 'rd-c' + ROLE[role] : 'rd-root', kids = node.kids || [];
    var showD = (o.showD && (role || !o.noRootD)) || (o.reveal && o.reveal[role || 'f']);
    // A slim root: just the rule's name over its pieces (the headline above already shows f).
    if(!role && o.slimRoot && kids.length){
      var ks = kids.filter(function(k){ return k.role === 'outer' || (k.node.rule !== 'x' && k.node.rule !== 'constant'); });
      return '<div class="rd-branch"><div class="rd-node rd-root rd-slim" data-role="f"><span class="rd-rule">' + esc(node.name) + '</span></div><div class="rd-kids">' + ks.map(function(k){ return treeHtml(k.node, Object.assign({}, o, { showD: o.showDAll }), k.role, depth + 1); }).join('') + '</div></div>';
    }
    var name = role === 'outer' ? 'Outer function' : node.name;
    var dl = role === 'outer' ? '\\frac{d}{du}' : role === 'inner' ? "u'" : role ? (DNAME[role] ? DNAME[role] : '\\frac{d}{dx}') : "f'(x)";
    var card = '<div class="rd-node ' + cls + '" data-role="' + (role || 'f') + '">' +
      (role ? '<span class="rd-role">' + esc(ROLE_NAME[role]) + '</span>' : '') +
      '<span class="rd-rule' + (o.hideRule && !role ? ' is-hidden' : '') + '">' + esc(o.hideRule && !role ? 'Which rule?' : name) + '</span>' +
      '<span class="rd-expr">' + tm(node.tex) + '</span>' +
      '<span class="rd-d"' + (showD ? '' : ' hidden') + '>' + tm((dl ? dl + (role === 'outer' || role === 'term' || role === 'factor' ? '' : ' =') + ' ' : '') + (role === 'outer' ? '\\left(' + node.tex + '\\right) = ' : role === 'term' || role === 'factor' ? '\\left(' + node.tex + '\\right) = ' : '') + node.dtex) + '</span></div>';
    var deep = depth >= (o.depth == null ? 2 : o.depth) || !kids.length || (o.hideRule && !role);
    if(deep) return '<div class="rd-branch">' + card + '</div>';
    kids = kids.filter(function(k){ return k.role === 'outer' || (k.node.rule !== 'x' && k.node.rule !== 'constant'); });
    if(!kids.length) return '<div class="rd-branch">' + card + '</div>';
    return '<div class="rd-branch">' + card + '<div class="rd-kids">' + kids.map(function(k){ return treeHtml(k.node, Object.assign({}, o, { showD: o.showDAll }), k.role, depth + 1); }).join('') + '</div></div>';
  }

  /* Text with its formulas in words, for screen readers (an option that is
     only a formula has no name otherwise). */
  function plainOf(s){ return String(s).replace(/\$\$([\s\S]*?)\$\$|\$([^$]*)\$/g, function(m, a, b){ return X() ? X().text(a || b) : (a || b); }); }
  /* Problems carry TeX between $...$; render every string the drill shows. */
  function texify(p){
    p.text = tx(p.text);
    p.solution = p.solution.map(tx);
    p.steps.forEach(function(s){
      s.label = tx(s.label);
      if(s.hint) s.hint = tx(s.hint);
      if(s.options) s.options = s.options.map(function(o){ return /\$/.test(o) ? '<span class="rd-opt" aria-hidden="true">' + tx(o) + '</span><span class="sr-only">' + esc(plainOf(o)) + '</span>' : '<span class="rd-opt">' + tx(o) + '</span>'; });
      if(s.why) s.why = s.why.map(tx);
      if(s.cell && s.cell.mistakes) s.cell.mistakes.forEach(function(m){ m.why = tx(m.why); });
    });
    return p;
  }

  T.mount('rule-drills', function(app, data){
    var ex = picker();
    T.modes(app, {
      slug: 'rule-drills', labels: ['Rule picker', 'Test yourself'],
      explore: ex.build,
      quiz: function(pane){
        var figs = {};
        T.drill(pane, data, {
          slug: 'rule-drills', noun: 'drill', typeLabel: 'Rule', textOnStage: true,
          types: RD.TYPES.map(function(t){ return { value: t.value, label: t.label }; }),
          generate: function(r, ctx, type){ return texify(RD.generate(r, ctx, type)); },
          extra: function(host, p){ figs.cur = figure(host, p); },
          onStep: function(s, right){ if(figs.cur) figs.cur.step(s); },
          // X1 and the audit's [bigger] item: the tree node a step works on is
          // highlighted, and a typed derivative is graphed under the tree
          // against the right one (yours dashed).
          onStart: function(s){ if(figs.cur && figs.cur.focus) figs.cur.focus(s); },
          onTry: function(s, t){ return figs.cur && figs.cur.tryOn ? figs.cur.tryOn(s, t) : false; },
          method: function(s, p){ return RMETHOD[p.type + '.' + s.key] || RMETHOD[s.key] || ''; },
          title: function(p){ var t = RD.TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Practice problem'; }
        });
      },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } },
      onShow: function(m){ if(m === 'explore') ex.redraw(); }
    });
  });

  /* ------------------------------------------------ plots that fit */
  function fitPlot(box, specOf){
    box._spec = specOf;
    function fit(){
      if(!box.isConnected) return;
      var r = box.getBoundingClientRect(), w = Math.round(r.width) || 420, h = Math.round(r.height);
      var spec = box._spec();
      spec.width = Math.max(240, Math.min(900, w));
      spec.height = Math.max(160, Math.min(560, h > 80 ? h : spec.width * 0.66));
      box.innerHTML = P.svg(spec);
    }
    if(!box._fit){
      box._fit = fit;
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(fit, 60); }).observe(box); }
    }
    box.innerHTML = P.svg(Object.assign(specOf(), { width: 420, height: 280 }));
    requestAnimationFrame(function(){ requestAnimationFrame(fit); });
    return fit;
  }
  // A y window that holds most of the sampled values (spikes clipped).
  function yRange(fs, a, b){
    var v = [];
    fs.forEach(function(f){ for(var i = 0; i <= 120; i++){ var y = f(a + (b - a) * i / 120); if(isFinite(y)) v.push(y); } });
    if(!v.length) return [-5, 5];
    v.sort(function(p, q){ return p - q; });
    var lo = v[Math.floor(v.length * 0.04)], hi = v[Math.ceil(v.length * 0.96) - 1];
    if(hi - lo < 1){ lo -= 1; hi += 1; }
    var pad = (hi - lo) * 0.12;
    return [Math.floor(lo - pad), Math.ceil(hi + pad)];
  }

  /* ================================================== the drill figures */
  var RMETHOD = {
    rule: 'Look at the last operation you would do to compute f(x): a product, a quotient, or a function of an inside expression.',
    second: 'After the first rule, look inside each piece: a function of an inside expression needs the chain rule.',
    p: 'Write a root as a power 1/n, and 1/x^k as x^(−k).',
    c: 'The number in front once f is written as c x^p.',
    d: 'Differentiate each piece with its own rule (the tree shows them), then combine them with the rule at the top.',
    'power.d': 'Power rule: bring p down in front and lower the power by one: c·p·x^(p−1).',
    'higher.d1': 'Differentiate each piece with its own rule (product rule for a product).',
    term: 'Rewrite the term as a power of x first, then use the power rule.',
    const: 'A constant does not change, so its derivative is 0.',
    du: 'Differentiate the purple piece u on its own.',
    dv: 'Differentiate the green piece v on its own.',
    din: 'Differentiate the inside expression on its own.',
    dout: 'Differentiate the outside function as if the inside were a single letter u, then put the inside back in.',
    cos: 'Recall the basic derivative: d/dx cos x = −sin x.',
    ln: 'Recall the basic derivative: d/dx ln x = 1/x.',
    A: 'Recall the basic trig derivatives (sec x tan x, sec² x, −csc x cot x, −csc² x).',
    B: 'Recall the basic trig derivatives (sec x tan x, sec² x, −csc x cot x, −csc² x).',
    outer: 'Recall the inverse trig derivatives; arccos and arccot carry a minus sign.',
    y: 'y is a function of x: differentiate the power of y, then multiply by dy/dx.',
    xy: 'A product of x and y: product rule, with dy/dx on the y factor.',
    'implicit.d': 'Collect the dy/dx terms on one side, factor dy/dx out, and divide.',
    slope: 'Put the point\'s x and y into your dy/dx.',
    ginv: 'g(a) is the x that f sends to a: solve f(x) = a (try small whole numbers).',
    fp: 'Differentiate f and evaluate at that x.',
    gp: 'g′(a) = 1 / f′(g(a)): one over the slope of f at the matching point.',
    d1: 'Differentiate each piece with its own rule.',
    d2: 'Differentiate f′ once more.',
    v: 'Put the x-value into f″.'
  };
  // Which node of the tree each step's expression belongs to.
  var FOCUS = { du: 'u', dv: 'v', din: 'inner', dout: 'outer', term: 'term', rule: 'f', second: 'f', d: 'f', const: 'term', A: 'term', B: 'term', cos: 'term', ln: 'term', outer: 'outer' };
  /* f′ under the tree: the right derivative solid, yours dashed. */
  function dPlot(box, a){
    var f = E.compile(a.tree), d = E.compile(a.d), ff = function(x){ return f({ x: x }); }, dd = function(x){ return d({ x: x }); };
    var x = [-3, 3], ok = 0;
    for(var i = 0; i <= 30; i++) if(isFinite(ff(-3 + i * 0.2))) ok++;
    if(ok < 20) x = [0.05, 4];
    var marks = T.tries(), shown = false, yours = null;
    function draw(){
      if(!shown || !box.isConnected) return;
      var r = box.getBoundingClientRect(), W = Math.max(240, Math.min(720, Math.round(r.width) || 360)), Hh = Math.max(140, Math.min(260, Math.round(r.height) > 100 ? Math.round(r.height) : W * 0.42));
      var fs = [dd].concat(yours ? [yours] : []);
      var spec = { label: 'Graph of the derivative f prime' + (yours ? ' and of your answer' : ''), width: W, height: Hh, x: x, y: yRange(fs, x[0], x[1]), xLabel: 'x', yLabel: '' };
      box.innerHTML = '<p class="rd-dplot-k"><span class="rd-sw rd-sw-r"></span>f′(x), right' + (yours ? '<span class="rd-sw rd-sw-y"></span>yours' : '') + '</p>' + P.svg(spec).replace(/<\/svg>$/, marks.svg(P.frame(spec)) + '</svg>');
    }
    if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe(box); }
    return {
      // fn: the typed derivative (a wrong try); on right or shown, the last wrong one stays beside it
      show: function(fn, right){
        shown = true; box.hidden = false;
        if(!right) yours = fn;
        marks.clear();
        marks.set('d', [{ curve: dd, who: 'right' }].concat(yours ? [{ curve: yours, who: 'yours' }] : []));
        draw();
      }
    };
  }
  function figure(host, p){
    var F = p.fig || {}, box = document.createElement('div');
    box.className = 'cd-fig rd-fig';
    host.appendChild(box);
    var api = { step: function(){} };
    if(F.tree){
      var a = RD.analyze(F.tree), reveal = {}, ruled = !p.steps.some(function(s){ return s.key === 'rule'; }), focus = '', wrongAt = '';
      var tb = document.createElement('div'), pb = document.createElement('div');
      tb.className = 'rd-treebox'; pb.className = 'rd-dplot'; pb.hidden = true;
      box.appendChild(tb); box.appendChild(pb);
      var dp = dPlot(pb, a);
      var draw = function(){
        tb.innerHTML = '<div class="rd-head">' + (ruled ? headline(a.node) : tm('f(x) = ' + a.tex)) + '</div>' +
          '<div class="rd-tree' + (ruled ? '' : ' is-folded') + '">' + treeHtml(a.node, { reveal: reveal, hideRule: !ruled, depth: 1 }) + '</div>' +
          (ruled ? '' : '<p class="rd-wait">Name the rule that comes first, and the function opens into its pieces.</p>');
        // the node this step is about
        var sel = focus === 'f' ? '.rd-node[data-role="f"]' : focus ? '.rd-node[data-role="' + focus + '"]' : '';
        var nd = sel ? tb.querySelector(sel) : null;
        if(!nd && focus === 'term') nd = tb.querySelector('.rd-node[data-role="term"], .rd-node[data-role="factor"]');
        if(nd){ nd.classList.add('is-focus'); if(wrongAt === focus) nd.classList.add('is-miss'); }
      };
      draw();
      api.step = function(s){
        if(s.key === 'rule' || s.key === 'second') ruled = true;
        if(s.reveal) reveal[s.reveal] = true;
        wrongAt = '';
        draw();
      };
      api.focus = function(s){ focus = s.reveal || FOCUS[s.key] || ''; wrongAt = ''; draw(); };
      api.tryOn = function(s, t){
        if(!t.ok && !t.shown){ wrongAt = focus; draw(); }
        // the whole derivative: graphed under the tree, yours against the right one
        if(s.kind === 'expr' && (s.reveal === 'f' || s.key === 'd') && (t.fn || t.ok || t.shown)){
          dp.show(t.ok || t.shown ? null : t.fn, t.ok || t.shown);
          return t.ok || t.shown ? 'The graph under the tree shows the right f′(x) (solid) beside your earlier try (dashed).' : 'The graph under the tree shows your f′(x) dashed against the right one: where they part, a piece is off.';
        }
        // a piece (u′, v′, inner, outer): the engine graphs yours against it; the tree marks which piece
        if(s.kind === 'expr') return false;
        return !t.ok && !t.shown && focus ? 'The highlighted card in the tree is the piece this step is about.' : false;
      };
      return api;
    }
    if(F.power){
      var got = {};
      var drawP = function(){
        var c = got.c ? texNum(F.power.c) : '\\text{?}', pp = got.p ? texNum(F.power.p) : '\\text{?}';
        box.innerHTML = '<div class="rd-pow">' + tm('f(x) = ' + F.power.tex, true) + '<div class="rd-pow-eq">' + tm('= ' + c + '\\,x^{' + pp + '}', true) + '</div>' +
          (got.d ? '<div class="rd-pow-eq rd-pow-d">' + tm("f'(x) = " + texNum(F.power.c * F.power.p) + '\\,x^{' + texNum(F.power.p - 1) + '}', true) + '</div>' : '') + '</div>';
      };
      drawP();
      api.step = function(s){ got[s.key] = true; if(s.key === 'p' && !p.steps.some(function(x){ return x.key === 'c'; })) got.c = true; drawP(); };
      return api;
    }
    if(F.implicit) return implicitFig(box, F.implicit, p);
    if(F.inverse) return inverseFig(box, F.inverse);
    if(F.graphs) return graphsFig(box, F.graphs);
    return api;
  }
  function texNum(v){ return RD.tex(RD.nn(v)); }

  /* An implicit curve F(x, y) = C, drawn by marching squares on a grid. */
  function implicitFig(box, I, p){
    var Fn = E.fn(I.F, ['x', 'y']), x0 = I.pt[0], y0 = I.pt[1], w = 3.2, slope = null;
    var spec = function(){
      var x = [x0 - w, x0 + w], y = [y0 - w * 0.75, y0 + w * 0.75], n = 140, segs = [];
      var g = function(i, j){ return Fn({ x: x[0] + (x[1] - x[0]) * i / n, y: y[0] + (y[1] - y[0]) * j / n }) - I.C; };
      var lerp = function(i0, j0, i1, j1, v0, v1){ var t = v0 / (v0 - v1); return [x[0] + (x[1] - x[0]) * (i0 + (i1 - i0) * t) / n, y[0] + (y[1] - y[0]) * (j0 + (j1 - j0) * t) / n]; };
      var V = [];
      for(var i = 0; i <= n; i++){ V[i] = []; for(var j = 0; j <= n; j++) V[i][j] = g(i, j); }
      for(i = 0; i < n; i++) for(j = 0; j < n; j++){
        var a = V[i][j], b = V[i + 1][j], c = V[i + 1][j + 1], d = V[i][j + 1], pts = [];
        if(a * b < 0) pts.push(lerp(i, j, i + 1, j, a, b));
        if(b * c < 0) pts.push(lerp(i + 1, j, i + 1, j + 1, b, c));
        if(c * d < 0) pts.push(lerp(i + 1, j + 1, i, j + 1, c, d));
        if(d * a < 0) pts.push(lerp(i, j + 1, i, j, d, a));
        if(pts.length >= 2) segs.push([pts[0], pts[1]]);
        if(pts.length === 4) segs.push([pts[2], pts[3]]);
      }
      return { label: 'The curve ' + I.eq + ' near the point (' + x0 + ', ' + y0 + ')', x: x, y: y, xLabel: 'x', yLabel: 'y', segs: segs,
        lines: slope === null ? [] : [{ point: [x0, y0], slope: slope, cls: 's2', label: 'tangent' }], points: [{ at: [x0, y0], cls: 's1', label: '(' + x0 + ', ' + y0 + ')' }] };
    };
    function draw(){
      var r = box.getBoundingClientRect(), W = Math.max(240, Math.min(900, Math.round(r.width) || 420)), H = Math.max(160, Math.min(560, r.height > 80 ? Math.round(r.height) : W * 0.66));
      var s = spec(); s.width = W; s.height = H;
      var svg = P.svg(s), Fm = P.frame(s);
      var path = s.segs.map(function(q){ return 'M' + r2(Fm.sx(q[0][0])) + ' ' + r2(Fm.sy(q[0][1])) + 'L' + r2(Fm.sx(q[1][0])) + ' ' + r2(Fm.sy(q[1][1])); }).join('');
      box.innerHTML = svg.replace(/(<circle class="calc-plot-pt)/, '<path class="calc-plot-curve s1" d="' + path + '"/>$1');
    }
    draw();
    if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe(box); }
    requestAnimationFrame(function(){ requestAnimationFrame(draw); });
    var yourSlope = null;
    var base = spec;
    spec = function(){ var s = base(); if(yourSlope != null && isFinite(yourSlope)) s.lines.push({ point: [x0, y0], slope: yourSlope, cls: 's4', dashed: true, label: 'yours' }); return s; };
    return { step: function(s){ if(s.key === 'slope'){ slope = s.cell.answer; draw(); } },
      // a wrong slope is drawn as a dashed tangent at the point, against the curve
      tryOn: function(s, t){ if(s.key !== 'slope') return false; if(!t.ok && !t.shown){ yourSlope = t.value; draw(); return isFinite(t.value); } return yourSlope != null; } };
  }
  /* f and its inverse g, mirror images in y = x, with tangent lines at
     (b, a) on f and (a, b) on g once the slopes are known. */
  function inverseFig(box, I){
    var f = E.fn(I.f), a = I.a, b = I.b, got = {}, fp = M.deriv(f, b);
    var g = function(y){ var lo = -20, hi = 20; for(var i = 0; i < 80; i++){ var m = (lo + hi) / 2; if(f(m) < y) lo = m; else hi = m; } return (lo + hi) / 2; };
    var lo = Math.min(a, b) - 3, hi = Math.max(a, b) + 3, span = Math.max(8, hi - lo);
    var c = (Math.min(a, b) + Math.max(a, b)) / 2, x = [c - span / 2 - 1, c + span / 2 + 1];
    var specOf = function(){
      return { label: 'The graph of f and of its inverse g, mirror images in the line y = x', x: x, y: x, xLabel: 'x', yLabel: 'y',
        curves: [{ fn: f, cls: 's1', label: 'f' }, { fn: g, cls: 's5', label: 'g = f⁻¹' }, { fn: function(t){ return t; }, cls: 's4', dashed: true }],
        points: [{ at: [b, a], cls: 's1', label: '(' + b + ', ' + a + ')' }].concat(got.ginv ? [{ at: [a, b], cls: 's5', label: '(' + a + ', ' + b + ')' }] : []),
        lines: (got.fp ? [{ point: [b, a], slope: fp, cls: 's1', dashed: true }] : []).concat(got.gp ? [{ point: [a, b], slope: 1 / fp, cls: 's5', dashed: true }] : []) };
    };
    var fit = fitPlot(box, specOf), mine = {};
    var base = specOf;
    box._spec = function(){
      var s = base();
      if(mine.ginv != null) s.points.push({ at: [a, mine.ginv], cls: 's4', label: 'yours: (' + a + ', ' + T.numText(mine.ginv) + ')' });
      if(mine.gp != null) s.lines.push({ point: [a, b], slope: mine.gp, cls: 's4', dashed: true, label: 'yours' });
      return s;
    };
    return { step: function(s){ got[s.key] = true; fit(); },
      tryOn: function(s, t){
        if(t.ok || t.shown){ delete mine[s.key]; fit(); return s.key === 'ginv' || s.key === 'gp'; }
        if((s.key === 'ginv' || s.key === 'gp') && isFinite(t.value)){ mine[s.key] = t.value; fit(); return true; }
        return false;
      } };
  }
  /* f, f' and f'' in their colours (crimson, blue, green), each appearing
     when it has been found. */
  function graphsFig(box, G){
    var f = E.fn(G.f), d1 = E.fn(G.d1), d2 = E.fn(G.d2), got = {};
    var x = [G.x0 - 2.5, G.x0 + 2.5];
    if(/ln/.test(G.f)) x = [0.05, 4];
    var specOf = function(){
      var fs = [f].concat(got.d1 ? [d1] : []).concat(got.d2 ? [d2] : []);
      return { label: 'Graphs of f and of the derivatives found so far', x: x, y: yRange(fs, x[0], x[1]), xLabel: 'x', yLabel: 'y',
        curves: [{ fn: f, cls: 's1', label: 'f' }].concat(got.d1 ? [{ fn: d1, cls: 's2', label: "f′" }] : []).concat(got.d2 ? [{ fn: d2, cls: 's3', label: "f″" }] : []),
        points: got.v ? [{ at: [G.x0, d2(G.x0)], cls: 's3', label: "f″(" + G.x0 + ")" }] : [] };
    };
    var fit = fitPlot(box, specOf), mine = null;
    var base = specOf;
    box._spec = function(){ var s = base(); if(mine) s.curves.push({ fn: mine.fn, cls: 's4', dashed: true, label: 'yours' }); return s; };
    return { step: function(s){ got[s.key] = true; fit(); },
      // a wrong f′ or f″ is drawn dashed next to the graphs
      tryOn: function(s, t){
        if(s.kind !== 'expr') return false;
        if(!t.ok && !t.shown && t.fn){ mine = { fn: t.fn }; fit(); return true; }
        if(t.ok || t.shown){ var had = !!mine; mine = null; fit(); return had; }
        return false;
      } };
  }

  /* ================================================== the rule picker */
  function picker(){
    var el = {}, LS = null, built = false, cur = null, last = '';
    function build(pane){
      el.stage = document.createElement('div');
      el.stage.className = 'rd-stage';
      el.stage.innerHTML = '<div class="rd-main"><div class="rd-head" aria-live="off"></div><div class="rd-dbox rd-dnarrow"></div><div class="rd-tree"></div></div>' +
        '<div class="rd-side"><div class="rd-dbox"></div><div class="rd-plot"></div></div>';
      el.head = el.stage.querySelector('.rd-head'); el.tree = el.stage.querySelector('.rd-tree');
      el.dbox = el.stage.querySelector('.rd-side .rd-dbox'); el.dbox2 = el.stage.querySelector('.rd-dnarrow'); el.plot = el.stage.querySelector('.rd-plot');
      el.input = document.createElement('div');
      el.input.className = 'rd-input';
      el.input.innerHTML = '<label class="rd-lbl" for="rd-f">Type a function of x</label><div class="rd-irow"><span class="rd-fx" aria-hidden="true">' + tm('f(x) =') + '</span><input id="rd-f" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="rd-read"></div><p class="rd-read" id="rd-read" aria-live="polite"></p>';
      el.field = el.input.querySelector('input'); el.read = el.input.querySelector('.rd-read');
      el.chips = document.createElement('div');
      el.chips.className = 'rd-examples';
      el.chips.innerHTML = '<p class="rd-lbl" id="rd-ex-l">Or try</p><div class="ls-scroll rd-chips" role="group" aria-labelledby="rd-ex-l">' + RD.EXAMPLES.map(function(s){ var t = RD.analyze(s).tex; return '<button type="button" class="ls-chip rd-chip" data-f="' + esc(s) + '" aria-label="' + esc(X() ? X().text(t) : s) + '"><span aria-hidden="true">' + tm(t) + '</span></button>'; }).join('') + '</div>';
      el.cue = T.cue('Type a function, or tap an example. The tree shows which rule comes first and what is inside what.');
      el.why = document.createElement('div'); el.why.className = 'rd-why';
      el.det = document.createElement('div'); el.det.className = 'rd-det';
      [el.cue.el, el.stage, el.input, el.chips, el.why, el.det].forEach(function(x){ pane.appendChild(x); });
      var t = null;
      el.field.addEventListener('input', function(){ clearTimeout(t); t = setTimeout(function(){ show(el.field.value, true); }, 160); el.cue.done(); });
      el.chips.addEventListener('click', function(e){ var b = e.target.closest('.rd-chip'); if(!b) return; el.field.value = b.getAttribute('data-f'); show(el.field.value); el.cue.done(); });
      function fitStage(){
        var w = el.stage.getBoundingClientRect().width;
        if(!w) return;
        var narrow = w < 520;
        el.stage.classList.toggle('rd-wide', w >= 720);
        el.stage.classList.toggle('rd-narrow', narrow);
        if(cur) drawTree();
      }
      if(window.ResizeObserver) new ResizeObserver(fitStage).observe(el.stage);
      requestAnimationFrame(fitStage);
      el.field.value = RD.EXAMPLES[0];
      show(el.field.value);
      built = true;
    }
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [el.stage], dock: [el.input, el.chips], why: [el.why], details: [el.det] });
      if(s.mode() === 'explore') s.hint({ target: el.field, text: 'Type any function of x' });
      show(el.field.value);
    }
    function show(str, typing){
      str = String(str || '').trim();
      if(!str){ el.read.textContent = ''; return; }
      var a = RD.analyze(str);
      if(!a.ok){ el.read.innerHTML = '<span class="calc-expr-err">' + esc(a.error) + '</span>'; return; }
      el.read.innerHTML = typing ? '<span class="bt-small">Reads as</span> ' + tm(a.tex) : '';
      if(typing && str === last) return;
      last = str; cur = a;
      el.head.innerHTML = headline(a.node);
      drawTree();
      el.dbox.innerHTML = el.dbox2.innerHTML = '<p class="rd-dk">The derivative</p>' + tm("f'(x) = " + a.dtex, true);
      el.chips.querySelectorAll('.rd-chip').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === str)); });
      drawPlot();
      var st = a.steps, first = st[0];
      var short = function(x){ return x.name.replace(/ \(.*\)$/, '').replace(/ rules?$/, '').replace(/^Derivative of /, '').replace(/^d\/dx of /, '').toLowerCase(); };
      var then = st.slice(1).filter(function(x){ return x.rule !== 'multiple' && x.rule !== 'sum'; }).map(short).filter(function(x, i, arr){ return arr.indexOf(x) === i; }).slice(0, 3);
      var cap = !first ? 'A constant: its derivative is 0.' : '<b>' + esc(first.name.replace(/ \(.*\)$/, '')) + '</b> first' + (then.length ? ', then ' + esc(then.join(', ')) + '.' : '.');
      if(LS) LS.caption(cap, 'explore');
      T.explain(el.why, cap, '<ol class="rd-steps">' + st.map(function(x){
        return '<li><b>' + esc(x.name) + '</b> on ' + tm(x.tex) + (x.outer ? ': outer ' + tm(x.outer.tex) + ' has derivative ' + tm(x.outer.dtex) + ', times the inner derivative' : '') + '. ' + tm('\\frac{d}{dx}\\left[' + x.tex + '\\right] = ' + x.dtex) + '</li>';
      }).join('') + '</ol><p>Work from the top of the tree down: the rule at the top says how the pieces combine; each piece then needs its own rule.</p>');
      el.why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      el.det.innerHTML = '<h3 class="ls-title-l">The derivative</h3>' + tm("f'(x) = " + a.dtex, true) +
        '<p class="bt-small">Typed the way the answer boxes take it:</p><p class="rd-typed"><code>' + esc(RD.typed(a.d)) + '</code></p>' +
        '<h3 class="ls-h">f and f′</h3><div class="rd-plot2"></div>' +
        '<h3 class="ls-h">What you can type</h3><p class="bt-small">3x^2, 2(x+1), sin x, sin^2(x), e^(2x), ln(x), sqrt(x), |x|, arctan(x), x^(1/3). Implicit multiplication binds like *, so 1/2x is (1/2)x.</p>';
      var p2 = el.det.querySelector('.rd-plot2');
      if(p2) fitPlot(p2, plotSpec);
    }
    /* Three levels of the tree when they fit the stage's width (a wide stage
       always); a narrow one drops levels until the tree fits without
       scrolling sideways. Then, on a narrow stage, f and f′ are drawn below
       the tree when at least 170 px are left (rd-room). */
    function drawTree(){
      var nw = el.stage.classList.contains('rd-narrow');
      for(var dp = 3; dp >= 1; dp--){
        el.tree.innerHTML = treeHtml(cur.node, { showD: true, showDAll: true, noRootD: true, slimRoot: true, depth: dp });
        if(!nw || dp === 1 || fits()) break;
      }
      fitRoom();
    }
    // Nothing scrolls sideways or is cut: the tree, and every card in it.
    function fits(){
      if(el.tree.scrollWidth > el.tree.clientWidth + 1) return false;
      return [].every.call(el.tree.querySelectorAll('.rd-node'), function(n){
        var b = n.getBoundingClientRect();
        return [].every.call(n.children, function(c){ var r = c.getBoundingClientRect(); return r.left >= b.left - 0.5 && r.right <= b.right + 0.5; });
      });
    }
    function fitRoom(){
      var wide = el.stage.classList.contains('rd-wide'), main = el.stage.querySelector('.rd-main');
      var used = el.tree.getBoundingClientRect().bottom - main.getBoundingClientRect().top, room = wide ? 0 : el.stage.clientHeight - used - 12, on = !wide && room >= 170, was = el.stage.classList.contains('rd-room');
      el.stage.classList.toggle('rd-room', on);
      if(on && !was) requestAnimationFrame(drawPlot);
    }
    function plotSpec(){
      var a = cur, f = E.compile(a.tree), d = E.compile(a.d), ff = function(x){ return f({ x: x }); }, dd = function(x){ return d({ x: x }); };
      var x = [-3, 3], ok = 0;
      for(var i = 0; i <= 30; i++) if(isFinite(ff(-3 + i * 0.1))) ok++;
      if(ok < 5) x = [0, 6];
      return { label: 'Graphs of f and its derivative f prime', x: x, y: yRange([ff, dd], x[0], x[1]), xLabel: 'x', yLabel: 'y',
        curves: [{ fn: ff, cls: 's1', label: 'f' }, { fn: dd, cls: 's2', label: 'f′' }] };
    }
    function drawPlot(){ if(cur && el.plot.isConnected) fitPlot(el.plot, plotSpec); }
    function redraw(){ if(built) requestAnimationFrame(drawPlot); }
    return { build: build, studio: studio, redraw: redraw };
  }
})();
