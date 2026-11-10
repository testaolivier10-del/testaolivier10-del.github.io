/* Elasticity Lab page (docs/apmicro-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T3). The model is ApMicroMath.elasticityLab (tools/math/elasticity-lab.js);
   the demand curve is ApMicroGraph's (mic-graph.js), every shift step graded
   by ApMicroGrade.graph, every number from ApMicroCalc.

   Explore, three views on one switch:
     Price        a straight demand curve (ApMicroGraph's sd graph with supply
                  taken out: the engine has no demand-only kind yet, see
                  docs/apmicro-reviews/self-t3.md) with its elastic and
                  inelastic halves marked, point A on it (drag it, use the
                  slider or the arrow keys) and B one $2 step lower; the TR
                  rectangle at A, and beside it the total revenue curve
                  (ApMicroPlot, a data figure) with A and B on it, in the same
                  colors. The arc elasticity from A to B (starting values, or
                  the midpoint method from More options) and the total revenue
                  test in the caption.
     Income       pick a kind of good and change income: demand shifts
                  (ApMicroGraph draws D1, D2 and the arrow); the quantity at
                  $10 moves from Q1 to Q2 and the income elasticity, sign
                  and all, names the good.
     Cross-price  the same with the price of a related good.

   Test yourself: ApMicroTools.drill with the model's five kinds; a shift step
   is drill's "graph" kind mounted on the stage figure (graphHost). */
(function(){
  'use strict';
  var T = window.ApMicroTools, M = window.ApMicroMath, E = M && M.elasticityLab, G = window.ApMicroGraph, P = window.ApMicroPlot, C = window.ApMicroCalc;
  var app = document.getElementById('app');
  if(!T || !E || !G || !app) return;
  if(E.stub){ app.innerHTML = '<p class="mic-soon">This trainer is being built. Meanwhile, read the <a href="../learn.html">free notes</a>.</p>'; return; }
  var esc = T.esc, money = E.money, n = E.n, px = G.px, py = G.py;
  function f1(v){ return Math.round(v * 10) / 10; }
  function ev(fn, args){ return C.evaluate({ fn: fn, args: args }); }

  T.mount('elasticity-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'elasticity-lab',
      explore: function(host){ ex = explore(host); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ---------------------------------------------- the demand curve alone */
  /* ApMicroGraph's sd graph with S, the S label and the starting
     equilibrium's dot, guides and marks taken out. */
  function demandSvg(shifts, label){
    var svg = G.svg({ kind: 'sd' }, { shifts: shifts || {} }, { label: label });
    return svg.replace(/<g class="mic-gr-c" data-curve="S">[\s\S]*?<\/g><text class="mic-gr-clabel[^"]*"[\s\S]*?<\/text>/, '')
      .replace(/<path class="mic-gr-guide is-old"[^>]*\/>/g, '').replace(/<circle class="mic-gr-eq is-old"[^>]*\/>/g, '')
      .replace(/<text class="mic-gr-mark is-old"[\s\S]*?<\/text>/g, '');
  }
  function inject(svg, extra){ return svg.replace('</svg>', extra + '</svg>'); }
  function sub(a, s){ return esc(a) + '<tspan class="mic-gr-sub" dy="3">' + esc(s) + '</tspan>'; }
  function xmark(x, t, cls){ return '<text class="mic-gr-mark ' + (cls || '') + '" x="' + f1(px(x)) + '" y="' + (G.BOX.T + G.BOX.PH + 13) + '" text-anchor="middle">' + t + '</text>'; }
  function ymark(yv, t, cls){ return '<text class="mic-gr-mark ' + (cls || '') + '" x="' + (G.BOX.L - 4) + '" y="' + f1(py(yv) + 4) + '" text-anchor="end">' + t + '</text>'; }
  function guide(x, yv, cls){ return '<path class="mic-gr-guide ' + (cls || '') + '" d="M' + f1(px(0)) + ' ' + f1(py(yv)) + 'H' + f1(px(x)) + 'V' + f1(py(0)) + '"/>'; }
  /* The elastic half and the inelastic half of D (from (0,10) to (10,0)), the midpoint. */
  function rangesLayer(){
    return '<path class="el-half el-elastic" d="M' + f1(px(0.15)) + ' ' + f1(py(9.85)) + 'L' + f1(px(5)) + ' ' + f1(py(5)) + '"/>' +
      '<path class="el-half el-inelastic" d="M' + f1(px(5)) + ' ' + f1(py(5)) + 'L' + f1(px(9.85)) + ' ' + f1(py(0.15)) + '"/>' +
      '<text class="el-rlab el-elastic-t" x="' + f1(px(2.9)) + '" y="' + f1(py(8.7)) + '">Elastic</text><text class="el-rsub" x="' + f1(px(2.9)) + '" y="' + f1(py(8.7) + 14) + '">|Ed| &gt; 1</text>' +
      '<text class="el-rlab el-inelastic-t" x="' + f1(px(7.4)) + '" y="' + f1(py(4.2)) + '">Inelastic</text><text class="el-rsub" x="' + f1(px(7.4)) + '" y="' + f1(py(4.2) + 14) + '">|Ed| &lt; 1</text>' +
      '<circle class="el-mid" cx="' + f1(px(5)) + '" cy="' + f1(py(5)) + '" r="5"/><text class="el-rlab el-mid-t" x="' + f1(px(5) + 10) + '" y="' + f1(py(5) - 8) + '">Unit elastic</text>';
  }
  /* Points on D, the TR rectangle at the first one. s: a scale { kP, kQ }; pts: [{ p, label }] */
  function pointsLayer(s, pts, o){
    o = o || {};
    var out = [];
    pts.forEach(function(pt, i){
      var y = pt.p / s.kP, x = 10 - y;
      if(i === 0 && o.tr) out.unshift('<path class="el-tr" d="M' + f1(px(0)) + ' ' + f1(py(0)) + 'H' + f1(px(x)) + 'V' + f1(py(y)) + 'H' + f1(px(0)) + 'Z"/>');
      if(i === 1 && o.tr) out.unshift('<path class="el-tr2" d="M' + f1(px(0)) + ' ' + f1(py(y)) + 'H' + f1(px(x)) + 'V' + f1(py(0)) + '"/>');
      out.push(guide(x, y, i ? 'el-g2' : 'el-g1'));
      out.push('<circle class="el-pt' + (i ? ' is-b' : '') + '" cx="' + f1(px(x)) + '" cy="' + f1(py(y)) + '" r="6"/>');
      out.push('<text class="mic-gr-plabel el-plab" x="' + f1(px(x) + 9) + '" y="' + f1(py(y) - 7) + '">' + esc(pt.label) + '</text>');
      if(o.marks !== false){ out.push(ymark(y, money(pt.p), i ? 'el-m2' : 'el-m1')); out.push(xmark(x, n(pt.q != null ? pt.q : (10 - y) * s.kQ), i ? 'el-m2' : 'el-m1')); }
    });
    return out.join('');
  }
  /* Spread axis marks that would touch (the engine centers each on its value). */
  function spreadMarks(root){
    Array.prototype.forEach.call(root.querySelectorAll('svg.mic-graph-svg'), function(svg){
      var ms = Array.prototype.slice.call(svg.querySelectorAll('text.mic-gr-mark')).map(function(t){ var b; try{ b = t.getBBox(); }catch(e){} return { t: t, b: b, a: t.getAttribute('text-anchor') }; }).filter(function(o){ return o.b && o.b.width; });
      var X = ms.filter(function(o){ return o.a === 'middle'; }).sort(function(p, q){ return p.b.x - q.b.x; }), end = -Infinity;
      X.forEach(function(o){ if(o.b.x < end + 3){ var dx = end + 3 - o.b.x; o.t.setAttribute('x', String(+o.t.getAttribute('x') + dx)); o.b.x += dx; } end = o.b.x + o.b.width; });
      var Y = ms.filter(function(o){ return o.a === 'end'; }).sort(function(p, q){ return p.b.y - q.b.y; }), bot = -Infinity;
      Y.forEach(function(o){ if(o.b.y < bot + 1){ var dy = bot + 1 - o.b.y; o.t.setAttribute('y', String(+o.t.getAttribute('y') + dy)); o.b.y += dy; } bot = o.b.y + o.b.height - 3; });
    });
  }

  /* ------------------------------------------------------------ explore */
  var S = { kP: 2, kQ: 10 };     // demand from $20 to 100 units
  var KINDS = {
    income: [{ id: 'necessity', label: 'A necessity', e: 0.5, good: 'bus passes' }, { id: 'luxury', label: 'A luxury', e: 1.8, good: 'boat rentals' }, { id: 'inferior', label: 'An inferior good', e: -0.6, good: 'instant noodles' }],
    cross: [{ id: 'sub', label: 'A substitute', e: 0.8, good: 'tea', other: 'coffee' }, { id: 'comp', label: 'A complement', e: -1.2, good: 'printer ink', other: 'printers' }, { id: 'none', label: 'Unrelated', e: 0, good: 'socks', other: 'garden hoses' }]
  };
  function explore(host){
    var st = { view: 'price', pA: 14, mid: false, kind: { income: 'necessity', cross: 'sub' }, pct: { income: 20, cross: 20 }, panel: 'd' };
    var LS = null, sp = null;
    host.innerHTML =
      '<figure class="el-fig"><div class="el-tabs" role="group" aria-label="Which graph"><button type="button" class="tchip el-tab on" data-p="d" aria-pressed="true">Demand</button><button type="button" class="tchip el-tab" data-p="tr" aria-pressed="false">Total revenue</button></div>' +
        '<div class="el-panels"><div class="el-p el-p-d"><div class="el-d" tabindex="-1"></div></div><div class="el-p el-p-tr"><div class="el-trp"></div></div></div>' +
        '<div class="el-read" aria-hidden="true"></div><figcaption class="sr-only" id="el-live"></figcaption></figure>' +
      '<div class="el-ctl"><div class="el-views" role="group" aria-label="Which elasticity">' +
        [['price', 'Price'], ['income', 'Income'], ['cross', 'Cross-price']].map(function(v){ return '<button type="button" class="tchip el-view" data-v="' + v[0] + '" aria-pressed="false">' + v[1] + '</button>'; }).join('') +
      '</div><div class="el-slot"></div></div>' +
      '<div class="el-say"></div><div class="el-nums"></div>' +
      T.moreHtml('<div class="bt-radio"><input type="checkbox" id="el-mid"><label for="el-mid">Use the midpoint method (divide by the average of the two values)</label></div>' +
        '<p class="bt-small">Demand here meets the price axis at $20 and the quantity axis at 100 units. B is always $2 below A.</p>', 'the midpoint method');
    var fig = host.querySelector('.el-fig'), dEl = host.querySelector('.el-d'), trEl = host.querySelector('.el-trp'), read = host.querySelector('.el-read'), slot = host.querySelector('.el-slot');
    var say = T.announcer(host.querySelector('#el-live'));
    var cue = T.cue('Drag point A along the demand curve, or use the slider: watch elasticity and total revenue.');
    host.insertBefore(cue.el, host.firstChild);
    var slider = null;
    function $(sel){ return host.querySelector(sel) || (LS && LS.root.querySelector(sel)); }

    function buildSlot(){
      slot.innerHTML = '';
      if(st.view === 'price'){
        slider = T.slider({ id: 'el-pa', label: 'Price at A', min: 4, max: 18, step: 1, value: st.pA, decimals: 0, onInput: function(v){ cue.done(); st.pA = v; draw(); } });
        var o = slider.el.querySelector('output'), i = slider.input, fx = function(){ o.textContent = money(+i.value); i.setAttribute('aria-valuetext', money(+i.value) + ', B at ' + money(+i.value - 2)); };
        i.addEventListener('input', fx); slider.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', fx); }); fx();
        slot.appendChild(slider.el);
        return;
      }
      var v = st.view, ks = KINDS[v];
      var row = document.createElement('div');
      row.className = 'el-kinds'; row.setAttribute('role', 'group'); row.setAttribute('aria-label', v === 'income' ? 'Kind of good' : 'The other good is');
      row.innerHTML = ks.map(function(k){ return '<button type="button" class="tchip el-kind' + (k.id === st.kind[v] ? ' on' : '') + '" data-k="' + k.id + '" aria-pressed="' + (k.id === st.kind[v]) + '">' + esc(k.label) + '</button>'; }).join('');
      slot.appendChild(row);
      slider = T.slider({ id: 'el-pct', label: v === 'income' ? 'Change in income' : 'Change in the other good’s price', min: -30, max: 30, step: 5, value: st.pct[v], decimals: 0, onInput: function(x){ cue.done(); st.pct[v] = x; draw(); } });
      var o2 = slider.el.querySelector('output'), i2 = slider.input, f2 = function(){ var x = +i2.value; o2.textContent = (x > 0 ? '+' : '') + M.minus(String(x)) + '%'; i2.setAttribute('aria-valuetext', o2.textContent); };
      i2.addEventListener('input', f2); slider.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', f2); }); f2();
      slot.appendChild(slider.el);
    }

    /* -------- the price view */
    function priceState(){ return E.arc(S, st.pA, st.pA - 2, st.mid ? 'midpoint' : 'start'); }
    function drawPrice(){
      var A = priceState(), w = E.word(A.e);
      var label = 'Demand curve from $20 to 100 units, elastic above the midpoint ($10) and inelastic below it. Point A at ' + money(A.a.p) + ' and ' + n(A.a.q) + ' units, B at ' + money(A.b.p) + ' and ' + n(A.b.q) + ' units.';
      dEl.innerHTML = inject(demandSvg({}, label), rangesLayer() + pointsLayer(S, [{ p: A.a.p, q: A.a.q, label: 'A' }, { p: A.b.p, q: A.b.q, label: 'B' }], { tr: true }));
      // the TR curve: TR(Q) = P(Q) x Q along this demand
      var spec = { label: 'Total revenue against quantity along this demand curve: a hill, largest at 50 units ($500), where demand is unit elastic. A at ' + n(A.a.q) + ' units (' + money(A.a.tr) + '), B at ' + n(A.b.q) + ' units (' + money(A.b.tr) + ').',
        width: 360, height: 300, x: [0, 100], y: [0, 560], xStep: 25, yStep: 100, xLabel: 'Quantity', yLabel: 'Total revenue ($)', grid: true,
        curves: [{ fn: function(q){ return (20 - q / 5) * q; }, domain: [0, 100], cls: 'el-trc' }],
        points: [{ at: [A.a.q, A.a.tr], label: 'A', cls: 'el-tra' }, { at: [A.b.q, A.b.tr], label: 'B', cls: 'el-trb' }, { at: [50, 500], open: true, label: 'Largest', cls: 'el-trm' }] };
      trEl.innerHTML = P ? P.svg(spec) : '';
      var trUp = A.b.tr > A.a.tr + 1e-9, trSame = Math.abs(A.b.tr - A.a.tr) < 1e-9;
      read.innerHTML = '<span class="el-chip el-c-e">|Ed| <b>' + M.fixed(A.e, 2) + '</b> ' + w + '</span><span class="el-chip el-c-tr">TR <b>' + money(A.a.tr) + '</b> → <b>' + money(A.b.tr) + '</b></span>';
      spreadMarks(dEl);
      var head = 'Price ' + money(A.a.p) + ' → ' + money(A.b.p) + ': quantity ' + n(A.a.q) + ' → ' + n(A.b.q) + '. |Ed| = ' + M.fixed(A.e, 2) + ', ' + w + '; total revenue ' + (trSame ? 'stays at ' + money(A.a.tr) : (trUp ? 'rises to ' : 'falls to ') + money(A.b.tr)) + '.';
      var body = [
        '%ΔQ = ' + E.signed(A.pq, 1) + '% and %ΔP = ' + E.signed(A.pp, 1) + '% (' + (st.mid ? 'midpoint method: each change over the average of the two values' : 'from the starting values at A') + '), so |Ed| = ' + M.fixed(Math.abs(A.pq), 1) + ' ÷ ' + M.fixed(Math.abs(A.pp), 1) + ' = ' + M.fixed(A.e, 2) + '.',
        w === 'elastic' ? 'Elastic: quantity responds by a bigger percent than price. A price cut raises total revenue: price and revenue move in opposite directions.' : w === 'inelastic' ? 'Inelastic: quantity responds by a smaller percent than price. A price cut lowers total revenue: price and revenue move in the same direction.' : 'Unit elastic: the two percent changes are the same size, so total revenue does not change.',
        'The slope of this line is the same everywhere, but elasticity is not: high up, a $2 change is a small percent of the price and a big percent of the small quantity. Above the midpoint ($10, 50 units) demand is elastic, below it inelastic.',
        'Total revenue (the shaded rectangle, P × Q) is largest at the midpoint, the top of the hill on the total revenue graph.'
      ];
      if(A.a.p > 10 && A.b.p < 10) body.splice(2, 0, 'A and B sit on either side of the midpoint, so the arc mixes an elastic and an inelastic stretch.');
      return { head: head, body: body };
    }
    /* -------- the income and cross-price views */
    function drawShift(){
      var v = st.view, k = KINDS[v].filter(function(x){ return x.id === st.kind[v]; })[0], pct = st.pct[v];
      var q1 = 50, q2 = E.shift(k.e, pct, q1), dx = (q2 - q1) / S.kQ, shifts = Math.abs(dx) > 1e-9 ? { D: dx } : {};
      var b1 = v === 'income' ? 40000 : 10, b2 = M.round(b1 * (1 + pct / 100), 6);
      var e = pct === 0 ? null : ev(v === 'income' ? 'incomeElasticity' : 'crossElasticity', [q1, q2, b1, b2]);
      var label = 'Demand for ' + k.good + ': ' + G.describe({ kind: 'sd' }, { shifts: shifts }).replace(/; supply\./, '.').replace(/supply\.?/, '') + ' At $10 the quantity demanded goes from ' + n(q1) + ' to ' + n(q2) + '.';
      var x1 = q1 / S.kQ, x2 = q2 / S.kQ, extra = '<path class="mic-gr-guide el-g1" d="M' + f1(px(0)) + ' ' + f1(py(5)) + 'H' + f1(px(Math.max(x1, x2))) + '"/>' +
        '<path class="mic-gr-guide el-g1" d="M' + f1(px(x1)) + ' ' + f1(py(5)) + 'V' + f1(py(0)) + '"/>' + ymark(5, '$10', 'el-m1') +
        '<circle class="el-pt is-b" cx="' + f1(px(x1)) + '" cy="' + f1(py(5)) + '" r="5"/>' + xmark(x1, Math.abs(dx) > 1e-9 ? sub('Q', '1') : 'Q', 'el-m2');
      if(Math.abs(dx) > 1e-9) extra += '<path class="mic-gr-guide el-g1" d="M' + f1(px(x2)) + ' ' + f1(py(5)) + 'V' + f1(py(0)) + '"/><circle class="el-pt" cx="' + f1(px(x2)) + '" cy="' + f1(py(5)) + '" r="6"/>' + xmark(x2, sub('Q', '2'), 'el-m1');
      // The curve labels and the shift arrow, placed here: the engine puts the
      // old curve's label and its arrow in one spot for a shift under a step.
      var right = dx >= 0, lab = function(at, t, s2, cls, side){ var yl = side > 0 ? 1.6 : 6.2, x = at - yl; return '<text class="mic-gr-clabel ' + cls + '" x="' + f1(px(x) + (side > 0 ? 7 : -7)) + '" y="' + f1(py(yl) + (side > 0 ? 3 : 12)) + '" text-anchor="' + (side > 0 ? 'start' : 'end') + '">' + esc(t) + (s2 ? '<tspan class="mic-gr-sub" dy="3">' + s2 + '</tspan>' : '') + '</text>'; };
      var moved = Math.abs(dx) > 1e-9;
      extra += moved ? lab(10, 'D', '1', 'is-old', right ? -1 : 1) + lab(10 + dx, 'D', '2', '', right ? 1 : -1) : lab(10, 'D', '', '', 1);
      if(Math.abs(dx) >= 0.6){ var ay = py(5) - 12, xa = px(x1) + (right ? 4 : -4), xb = px(x2) + (right ? -4 : 4), hd = right ? -5 : 5;
        extra += '<path class="mic-gr-arrow" d="M' + f1(xa) + ' ' + f1(ay) + 'H' + f1(xb) + 'M' + f1(xb + hd) + ' ' + f1(ay - 4) + 'L' + f1(xb) + ' ' + f1(ay) + 'L' + f1(xb + hd) + ' ' + f1(ay + 4) + '"/>'; }
      var base = demandSvg(shifts, label).replace(/<text class="mic-gr-clabel[^"]*"[^>]*>[\s\S]*?<\/text>/g, '').replace(/<path class="mic-gr-arrow"[^>]*\/>/g, '');
      dEl.innerHTML = inject(base, extra);
      spreadMarks(dEl);
      var what = v === 'income' ? (k.e < 0 ? 'an inferior good' : k.e > 1 ? 'a normal good and a luxury' : 'a normal good and a necessity') : (k.e > 0 ? 'substitutes' : k.e < 0 ? 'complements' : 'unrelated goods');
      var cause = v === 'income' ? 'Income ' + (pct > 0 ? 'rises' : pct < 0 ? 'falls' : 'does not change') + (pct ? ' ' + Math.abs(pct) + '%' : '') : 'The price of ' + k.other + ' ' + (pct > 0 ? 'rises' : pct < 0 ? 'falls' : 'does not change') + (pct ? ' ' + Math.abs(pct) + '%' : '');
      var name = v === 'income' ? 'Income elasticity' : 'Cross-price elasticity';
      read.innerHTML = '<span class="el-chip el-c-e">' + name + ' <b>' + (e == null ? E.signed(k.e, 1) : E.signed(e, 2)) + '</b></span><span class="el-chip el-c-tr">Q at $10 <b>' + n(q1) + '</b> → <b>' + n(q2) + '</b></span>';
      var head = cause + ': ' + (pct === 0 ? 'move the slider to see demand for ' + k.good + ' shift.' : 'demand for ' + k.good + ' shifts ' + (dx > 0 ? 'right' : dx < 0 ? 'left' : 'nowhere') + '. ' + name + ' = ' + E.signed(e, 2) + ': ' + what + '.');
      var body = [
        name + ' = %ΔQ ÷ %Δ' + (v === 'income' ? 'income' : 'P of ' + k.other) + (pct ? ' = ' + E.signed(ev('pctChange', [q1, q2]), 1) + ' ÷ ' + E.signed(pct, 0) + ' = ' + E.signed(e, 2) : '') + '. Keep the sign: here the sign is the answer.',
        v === 'income' ? 'Positive: a normal good (above 1 a luxury, between 0 and 1 a necessity). Negative: an inferior good, bought less as income rises.' : 'Positive: substitutes (one gets more expensive, buyers switch to the other). Negative: complements (used together). Zero: unrelated.',
        'This is a shift of the whole demand curve, not a move along it: at every price, including $10, buyers want ' + (dx > 0 ? 'more' : dx < 0 ? 'less' : 'the same') + '.'
      ];
      return { head: head, body: body };
    }
    function draw(){
      fig.setAttribute('data-view', st.view);
      host.querySelectorAll('.el-view').forEach(function(b){ var on = b.getAttribute('data-v') === st.view; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
      var r = st.view === 'price' ? drawPrice() : drawShift();
      T.explain($('.el-say'), esc(r.head), '<ol class="ls-steps">' + r.body.map(function(b){ return '<li><span>' + esc(b) + '</span></li>'; }).join('') + '</ol>');
      nums();
      if(LS){ LS.caption(esc(r.head), 'explore'); if(sp) sp.open(); }
      say(r.head);
    }
    function nums(){
      var el = $('.el-nums');
      if(st.view !== 'price'){ el.innerHTML = '<h3 class="ls-title-l">Signs to remember</h3><table class="ls-tbl"><tbody><tr><th scope="row">Income elasticity &gt; 1</th><td>Normal good, a luxury</td></tr><tr><th scope="row">Between 0 and 1</th><td>Normal good, a necessity</td></tr><tr><th scope="row">Below 0</th><td>Inferior good</td></tr><tr><th scope="row">Cross-price &gt; 0</th><td>Substitutes</td></tr><tr><th scope="row">Cross-price &lt; 0</th><td>Complements</td></tr></tbody></table>'; return; }
      var rows = [18, 16, 14, 12, 10, 8, 6, 4, 2].map(function(p){ return E.at(S, p); });
      el.innerHTML = '<h3 class="ls-title-l">Along this demand curve</h3><table class="ls-tbl el-ntbl"><thead><tr><th scope="col">Price</th><th scope="col">Quantity</th><th scope="col">TR</th><th scope="col">|Ed| at the point</th></tr></thead><tbody>' +
        rows.map(function(x){ return '<tr' + (x.p === st.pA ? ' class="is-a"' : x.p === st.pA - 2 ? ' class="is-b"' : '') + '><th scope="row">' + money(x.p) + '</th><td>' + n(x.q) + '</td><td>' + money(x.tr) + '</td><td>' + M.fixed(x.e, 2) + ' ' + E.word(x.e) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<p class="bt-small">The point value is P ÷ (20 − P) on this line; the caption’s value is the arc from A to B.</p>';
    }

    /* -------- dragging A along D, the keyboard */
    function toData(ev2){ var svg = dEl.querySelector('svg'), r = svg.getBoundingClientRect(), B = G.BOX; return [((ev2.clientX - r.left) * B.W / r.width - B.L) / B.PW * 10, 10 - ((ev2.clientY - r.top) * B.H / r.height - B.T) / B.PH * 10]; }
    var drag = false;
    dEl.addEventListener('pointerdown', function(e){
      if(st.view !== 'price') return;
      var p = toData(e), y = (st.pA) / S.kP, x = 10 - y;
      if(Math.hypot(p[0] - x, p[1] - y) > 1.6) return;
      drag = true; cue.done(); try{ dEl.setPointerCapture(e.pointerId); }catch(x2){} e.preventDefault();
    });
    dEl.addEventListener('pointermove', function(e){
      if(!drag) return;
      var p = toData(e), yy = Math.max(2, Math.min(9, ((10 - p[0]) + p[1]) / 2)), pa = Math.round(yy * S.kP);
      if(pa !== st.pA){ st.pA = pa; if(slider) slider.set(pa); draw(); }
    });
    function end(){ drag = false; }
    dEl.addEventListener('pointerup', end); dEl.addEventListener('pointercancel', end);
    host.querySelector('.el-views').addEventListener('click', function(e){ var b = e.target.closest('.el-view'); if(!b || b.getAttribute('data-v') === st.view) return; cue.done(); st.view = b.getAttribute('data-v'); buildSlot(); draw(); });
    slot.addEventListener('click', function(e){ var b = e.target.closest('.el-kind'); if(!b) return; cue.done(); st.kind[st.view] = b.getAttribute('data-k'); buildSlot(); draw(); var nb = slot.querySelector('.el-kind[data-k="' + st.kind[st.view] + '"]'); if(nb) nb.focus(); });
    host.querySelector('#el-mid').addEventListener('change', function(e){ st.mid = e.target.checked; draw(); if(sp) sp.setup(st.mid ? 'Midpoint method' : 'Starting values'); });
    function setPanel(p){ st.panel = p; fig.setAttribute('data-panel', p); fig.querySelectorAll('.el-tab').forEach(function(t){ var on = t.getAttribute('data-p') === p; t.classList.toggle('on', on); t.setAttribute('aria-pressed', String(on)); }); }
    fig.addEventListener('click', function(e){ var t = e.target.closest('.el-tab'); if(t) setPanel(t.getAttribute('data-p')); });
    function fit(){ fig.classList.toggle('is-narrow', fig.clientWidth > 0 && fig.clientWidth < 620); }
    if(window.ResizeObserver) new ResizeObserver(fit).observe(fig);
    setPanel('d');

    function studio(pane, s){
      LS = s;
      sp = T.studioPane(pane, s, { stage: [fig], dock: [host.querySelector('.el-ctl')], setup: 'Method', moreLabel: 'Percent changes', why: [host.querySelector('.el-say')], details: [host.querySelector('.el-nums')] });
      sp.setup('Starting values');
      draw(); fit();
      if(s.mode() === 'explore') T.hintSlot(s, slider ? slider.el : slot, 'Start here: move point A', {});
    }
    buildSlot(); draw(); fit();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'elasticity-lab', noun: 'drill',
      generate: function(r, ctx, type){ return E.generate(r, ctx, type); },
      types: [{ value: 'coef', label: 'Elasticity from two points' }, { value: 'trtest', label: 'The total revenue test' }, { value: 'range', label: 'Elastic and inelastic ranges' }, { value: 'income', label: 'Income elasticity' }, { value: 'cross', label: 'Cross-price elasticity' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { coef: 'Elasticity from two points', trtest: 'The total revenue test', range: 'Along a demand curve', income: 'Income elasticity', cross: 'Cross-price elasticity' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){
        var f = document.createElement('figure');
        f.className = 'cd-fig el-qfig';
        el.appendChild(f);
        api.fig = f; api.gbox = null;
        var a = p.answer;
        if(p.figure && p.figure.demand){
          var s = p.figure.demand, pts = p.figure.points.map(function(x){ return { p: x.p, label: x.label, q: E.at(s, x.p).q }; });
          var g = document.createElement('div');
          g.className = 'mic-graph el-qgraph';
          var lbl = 'A straight demand curve from ' + money(10 * s.kP) + ' to ' + n(10 * s.kQ) + ' units, with ' + pts.map(function(x){ return 'point ' + x.label + ' at ' + money(x.p) + ' and ' + n(x.q) + ' units'; }).join(' and ') + '.';
          var svg = demandSvg({}, lbl);
          // the axis values in this problem's dollars and units
          svg = inject(svg, (p.figure.ranges ? '<circle class="el-mid" cx="' + f1(px(5)) + '" cy="' + f1(py(5)) + '" r="4"/>' : '') + ymark(10, money(10 * s.kP), 'el-m0') + xmark(10, n(10 * s.kQ), 'el-m0') + pointsLayer(s, pts, { tr: !!p.figure.tr }));
          g.innerHTML = '<div class="mic-gr-stage">' + svg + '</div>';
          f.appendChild(g);
          api.gbox = g;
          spreadLater(f);
        }
        if(p.table) f.insertAdjacentHTML('beforeend', T.wrapTables(p.table));
        if(p.type === 'income' || p.type === 'cross'){
          var inc = p.type === 'income', good = (p.text.match(/<b>([^<]+)<\/b>/g) || []).map(function(x){ return x.replace(/<\/?b>/g, ''); });
          var tbl = '<table class="ls-tbl el-tbl"><caption>' + (inc ? 'Income and quantity demanded at the same price' : 'The other good’s price and quantity demanded') + ' (invented data)</caption><thead><tr><th scope="col"></th><th scope="col">' + (inc ? 'Income' : 'Price of ' + esc(good[0] || 'the other good')) + '</th><th scope="col">Quantity demanded' + (inc ? '' : ' of ' + esc(good[good.length - 1] || 'this good')) + '</th></tr></thead><tbody>' +
            '<tr><th scope="row">Before</th><td>' + money(inc ? a.i1 : a.py1) + '</td><td>' + n(a.q1) + '</td></tr><tr><th scope="row">After</th><td>' + money(inc ? a.i2 : a.py2) + '</td><td>' + n(a.q2) + '</td></tr></tbody></table>';
          var holder = document.createElement('div');
          holder.className = 'el-qtbl';
          holder.innerHTML = T.wrapTables(tbl);
          f.appendChild(holder);
          api.gbox = holder;
        }
      },
      // A shift step mounts its graph in the figure, in place of the table or picture.
      graphHost: function(s, api){
        var d = document.createElement('div');
        if(api.gbox && api.gbox.parentNode === api.fig) api.fig.replaceChild(d, api.gbox); else api.fig.appendChild(d);
        api.gbox = d;
        return d;
      }
    });
  }
  function spreadLater(el){ requestAnimationFrame(function(){ spreadMarks(el); }); }
})();
