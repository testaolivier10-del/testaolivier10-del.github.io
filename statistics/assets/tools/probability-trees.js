/* Probability trees (simulator, free; docs/apstat-spec.md section 6). OWNED
   BY THIS TOOL ONLY. The model is ApStatMath.probabilityTrees (statistics/
   assets/tools/math/probability-trees.js); the frame is ApStatTools.modes on
   the Tool Studio.

   Explore: two events shown three ways at once (a tree whose branch widths
   are their probabilities, a two-way table of counts out of 1,000, a Venn
   diagram whose areas are the probabilities) plus a simulation. Pick a
   question (P(A and B), P(A | B) ...): every view marks the outcomes it
   counts in the accent and, for a conditional probability, the slice it is
   limited to; the others fade. Tap any branch, leaf, cell or region to ask
   about it. Simulate 100 or 1,000 trials: the running share closes in on
   the exact value. Change the three numbers under "Change the
   probabilities"; "Make them independent" sets the two B branches equal.
   Event A is always the first series color, B the second.
   Test yourself: ApStatTools.drill over the model's generate(); a table
   problem puts its two-way table on the stage, a tree problem its tree. */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath;
  if(!T || !M || !M.probabilityTrees) return;
  var PT = M.probabilityTrees, esc = T.esc;
  var QLIST = ['A', 'AB', 'AorB', 'B', 'BgA', 'AgB'];
  var QNAME = { A: 'P(A)', B: 'P(B)', nA: 'P(not A)', nB: 'P(not B)', AB: 'P(A and B)', AnB: 'P(A and not B)', nAB: 'P(not A and B)', nAnB: 'P(not A and not B)', AorB: 'P(A or B)', BgA: 'P(B | A)', AgB: 'P(A | B)', BgnA: 'P(B | not A)', AgnB: 'P(A | not B)' };

  T.mount('probability-trees', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'probability-trees',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ T.drill(host, data, { slug: 'probability-trees', noun: 'drill', generate: PT.generate,
        types: [{ value: 'tree', label: 'From a tree' }, { value: 'table', label: 'From a two-way table' }, { value: 'rules', label: 'Or, mutually exclusive, independent' }],
        typeLabel: 'Kind of problem',
        title: function(p){ return { tree: 'Probabilities from a tree', table: 'Probabilities from a table', rules: 'The addition rule and independence' }[p.type] || 'Practice problem'; },
        extra: function(el, p){ qfig(el, p); } }); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  function F4(x){ return T.F(x, 4); }
  function cnt(x){ return M.round(x, 1).toLocaleString('en-US'); }
  function nice(x){ return M.fmt(M.round(x, 4), 4); }

  /* --------------------------------------------------------------- views */
  /* state of a cell for question q: 'num' (counted), 'den' (in the slice
     only) or 'dim' */
  function cellState(q, c){ if(!q) return 'off'; var Q = PT.QS[q]; if(Q.num.indexOf(c) > -1) return 'num'; if(Q.den && Q.den.indexOf(c) > -1) return 'den'; return Q.den ? 'dim' : 'off'; }

  function treeSvg(J, sc, q, o){
    var W = 560, H = 344, x0 = 26, x1 = 196, x2 = 358, ys = { A: 92, nA: 252 }, leaf = { AB: 46, AnB: 138, nAB: 206, nAnB: 298 }, y0 = 172;
    var w = function(p){ return (2.5 + 15 * p).toFixed(1); };
    function st(cells){ var s = cells.map(function(c){ return cellState(q, c); }); return s.indexOf('num') > -1 ? 'num' : s.indexOf('den') > -1 ? 'den' : s.every(function(x){ return x === 'off'; }) ? 'off' : 'dim'; }
    function branch(xa, ya, xb, yb, p, label, cells, cls, tap){
      var mx = (xa + xb) / 2, my = (ya + yb) / 2, s = st(cells), up = yb < ya;
      return '<g class="pt-br pt-' + cls + ' is-' + s + '" data-q="' + tap + '"><path class="pt-brl" d="M' + xa + ' ' + ya + ' C ' + (xa + 50) + ' ' + ya + ', ' + (xb - 50) + ' ' + yb + ', ' + xb + ' ' + yb + '" stroke-width="' + w(p) + '"/>' +
        '<path class="pt-hitl" d="M' + xa + ' ' + ya + ' C ' + (xa + 50) + ' ' + ya + ', ' + (xb - 50) + ' ' + yb + ', ' + xb + ' ' + yb + '"/>' +
        '<text class="pt-brt" x="' + mx + '" y="' + (my + (up ? -10 : 20)) + '" text-anchor="middle">' + esc(label) + '</text></g>';
    }
    var g = [];
    g.push(branch(x0, y0, x1, ys.A, J.A, nice(J.A), ['AB', 'AnB'], 'a', 'A'));
    g.push(branch(x0, y0, x1, ys.nA, J.nA, nice(J.nA), ['nAB', 'nAnB'], 'na', 'nA'));
    g.push(branch(x1 + 46, ys.A, x2, leaf.AB, J.BgA, nice(J.BgA), ['AB'], 'b', 'BgA'));
    g.push(branch(x1 + 46, ys.A, x2, leaf.AnB, 1 - J.BgA, nice(1 - J.BgA), ['AnB'], 'nb', 'AnB'));
    g.push(branch(x1 + 46, ys.nA, x2, leaf.nAB, J.BgnA, nice(J.BgnA), ['nAB'], 'b', 'BgnA'));
    g.push(branch(x1 + 46, ys.nA, x2, leaf.nAnB, 1 - J.BgnA, nice(1 - J.BgnA), ['nAnB'], 'nb', 'nAnB'));
    // nodes
    g.push('<g class="pt-node pt-a is-' + st(['AB', 'AnB']) + '" data-q="A"><rect x="' + x1 + '" y="' + (ys.A - 17) + '" width="46" height="34" rx="17"/><text x="' + (x1 + 23) + '" y="' + (ys.A + 6) + '" text-anchor="middle">A</text></g>');
    g.push('<g class="pt-node pt-na is-' + st(['nAB', 'nAnB']) + '" data-q="nA"><rect x="' + x1 + '" y="' + (ys.nA - 17) + '" width="46" height="34" rx="17"/><text x="' + (x1 + 23) + '" y="' + (ys.nA + 6) + '" text-anchor="middle">not A</text></g>');
    g.push('<circle class="pt-root" cx="' + x0 + '" cy="' + y0 + '" r="7"/>');
    var LN = { AB: ['B', 'A and B'], AnB: ['not B', 'A and not B'], nAB: ['B', 'not A and B'], nAnB: ['not B', 'not A and not B'] };
    PT.CELLS.forEach(function(c){
      var y = leaf[c], s = cellState(q, c), isB = c === 'AB' || c === 'nAB';
      g.push('<g class="pt-leaf ' + (isB ? 'pt-lb' : 'pt-lnb') + ' is-' + s + '" data-q="' + c + '"><rect x="' + x2 + '" y="' + (y - 21) + '" width="' + (W - x2 - 8) + '" height="42" rx="10"/>' +
        '<text class="pt-lt" x="' + (x2 + 12) + '" y="' + (y - 3) + '">' + esc(LN[c][0]) + '</text><text class="pt-lv" x="' + (W - 18) + '" y="' + (y + 6) + '" text-anchor="end">' + F4(J[c]) + '</text>' +
        '<text class="pt-ls" x="' + (x2 + 12) + '" y="' + (y + 14) + '">' + esc(LN[c][1]) + '</text></g>');
    });
    return '<svg class="pt-tree-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label) + '">' + g.join('') + '</svg>';
  }
  function tableHtml(J, sc, q, N){
    var c = function(k){ var s = cellState(q, k); return '<td class="pt-cell is-' + s + '"><button type="button" class="pt-cb" data-q="' + k + '" aria-label="' + esc(QNAME[k]) + ': ' + Math.round(J[k] * N) + ' of ' + N + '"><b>' + cnt(J[k] * N) + '</b><span>' + F4(J[k]) + '</span></button></td>'; };
    var tot = function(k, cells){ var den = PT.QS[q].den, isDen = den && cells.every(function(x){ return den.indexOf(x) > -1; }) && den.length === cells.length;
      return '<td class="pt-tot' + (isDen ? ' is-dent' : '') + '"><button type="button" class="pt-cb" data-q="' + k + '" aria-label="' + esc(QNAME[k]) + ': ' + Math.round(J[k] * N) + ' of ' + N + '"><b>' + cnt(J[k] * N) + '</b><span>' + F4(J[k]) + '</span></button></td>'; };
    return '<table class="pt-tbl"><caption>' + esc('Out of ' + N.toLocaleString('en-US') + ' ' + sc.pop) + '</caption><thead><tr><th scope="col"><span class="sr-only">Event A</span></th><th scope="col" class="pt-hb">B: ' + esc(sc.B) + '</th><th scope="col">not B</th><th scope="col">Total</th></tr></thead><tbody>' +
      '<tr><th scope="row" class="pt-ha">A: ' + esc(sc.A) + '</th>' + c('AB') + c('AnB') + tot('A', ['AB', 'AnB']) + '</tr>' +
      '<tr><th scope="row">not A</th>' + c('nAB') + c('nAnB') + tot('nA', ['nAB', 'nAnB']) + '</tr>' +
      '<tr><th scope="row">Total</th>' + tot('B', ['AB', 'nAB']) + tot('nB', ['AnB', 'nAnB']) + '<td class="pt-tot"><b>' + N.toLocaleString('en-US') + '</b><span>1</span></td></tr></tbody></table>';
  }
  var vid = 0;
  function vennSvg(J, sc, q, o){
    var W = 520, H = 330, bx = 16, by = 34, bw = W - 32, bh = H - 50, V = PT.venn(J.A, J.B, J.AB, { w: bw, h: bh });
    var cy = by + bh / 2, cxA = bx + bw / 2 - V.d / 2 - (V.rB - V.rA) * 0.15, cxB = cxA + V.d, id = 'ptv' + (++vid);
    var sState = {}; PT.CELLS.forEach(function(c){ sState[c] = cellState(q, c); });
    var cA = '<circle cx="' + cxA.toFixed(1) + '" cy="' + cy + '" r="' + V.rA.toFixed(1) + '"/>', cB = '<circle cx="' + cxB.toFixed(1) + '" cy="' + cy + '" r="' + V.rB.toFixed(1) + '"/>';
    var defs = '<defs><clipPath id="' + id + 'a">' + cA + '</clipPath><clipPath id="' + id + 'b">' + cB + '</clipPath>' +
      '<mask id="' + id + 'na"><rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#fff"/>' + cA.replace('/>', ' fill="#000"/>') + '</mask>' +
      '<mask id="' + id + 'nb"><rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#fff"/>' + cB.replace('/>', ' fill="#000"/>') + '</mask></defs>';
    var reg = function(c, inner){ return '<g class="pt-reg pt-r-' + c + ' is-' + sState[c] + '" data-q="' + c + '">' + inner + '</g>'; };
    var g = [defs,
      reg('nAnB', '<g mask="url(#' + id + 'na)"><g mask="url(#' + id + 'nb)"><rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="10"/></g></g>'),
      reg('AnB', '<g mask="url(#' + id + 'nb)">' + cA + '</g>'),
      reg('nAB', '<g mask="url(#' + id + 'na)">' + cB + '</g>'),
      reg('AB', '<g clip-path="url(#' + id + 'b)">' + cA + '</g>'),
      '<rect class="pt-box" x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="10"/>',
      '<circle class="pt-ca" cx="' + cxA.toFixed(1) + '" cy="' + cy + '" r="' + V.rA.toFixed(1) + '"/>',
      '<circle class="pt-cbo" cx="' + cxB.toFixed(1) + '" cy="' + cy + '" r="' + V.rB.toFixed(1) + '"/>'];
    // labels: each region's probability, placed inside it when it fits
    var lab = function(x, y, t, cls){ return '<text class="pt-vt ' + (cls || '') + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="middle">' + t + '</text>'; };
    g.push('<text class="pt-vh pt-vha" x="' + (bx + 4) + '" y="' + (by - 10) + '">A: ' + esc(sc.A) + '</text>');
    g.push('<text class="pt-vh pt-vhb" x="' + (bx + bw - 4) + '" y="' + (by - 10) + '" text-anchor="end">B: ' + esc(sc.B) + '</text>');
    // a region's number goes inside it only when the region is wide enough
    var aOnlyW = Math.max(0, Math.min(cxA + V.rA, cxB - V.rB) - (cxA - V.rA)), bOnlyW = Math.max(0, (cxB + V.rB) - Math.max(cxB - V.rB, cxA + V.rA)), abW = Math.max(0, Math.min(cxA + V.rA, cxB + V.rB) - Math.max(cxA - V.rA, cxB - V.rB));
    if(J.AnB > 0 && aOnlyW >= 64) g.push(lab((cxA - V.rA + Math.min(cxA + V.rA, cxB - V.rB)) / 2, cy + 5, F4(J.AnB)));
    if(J.nAB > 0 && bOnlyW >= 64) g.push(lab((Math.max(cxB - V.rB, cxA + V.rA) + cxB + V.rB) / 2, cy + 5, F4(J.nAB)));
    if(J.AB > 0 && abW >= 64) g.push(lab((Math.max(cxA - V.rA, cxB - V.rB) + Math.min(cxA + V.rA, cxB + V.rB)) / 2, cy + 5, F4(J.AB), 'pt-vt-ab'));
    g.push(lab(bx + bw - 44, by + bh - 12, F4(J.nAnB), 'pt-vt-out'));
    return '<svg class="pt-venn-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label) + '">' + g.join('') + '</svg>' +
      (V.scale < 0.999 ? '<p class="pt-vnote">Circles to scale with each other; the box is drawn smaller than its true area.</p>' : '');
  }
  function simSvg(outs, q, exact, w, h){
    var W = Math.max(240, w), H = Math.max(140, h), L = 44, R = 26, Tp = 14, B = 34, pw = W - L - R, ph = H - Tp - B;
    var n = outs.length, maxX = Math.max(100, n), lx = function(k){ return L + Math.log10(Math.max(1, k)) / Math.log10(maxX) * pw; }, sy = function(p){ return Tp + (1 - p) * ph; };
    var g = [];
    [0, 0.25, 0.5, 0.75, 1].forEach(function(p){ g.push('<line class="pt-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(p).toFixed(1) + '" y2="' + sy(p).toFixed(1) + '"/><text class="pt-tick" x="' + (L - 6) + '" y="' + (sy(p) + 4).toFixed(1) + '" text-anchor="end">' + p + '</text>'); });
    [1, 10, 100, 1000, 10000].filter(function(k){ return k <= maxX; }).forEach(function(k){ g.push('<text class="pt-tick" x="' + lx(k).toFixed(1) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + M.fmt(k, 5).replace(/(\d)(?=(\d{3})+$)/g, '$1,') + '</text>'); });
    g.push('<line class="pt-axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (Tp + ph) + '" y2="' + (Tp + ph) + '"/>');
    g.push('<line class="pt-exact" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(exact).toFixed(1) + '" y2="' + sy(exact).toFixed(1) + '"/><text class="pt-exactt" x="' + (W - R) + '" y="' + (sy(exact) - 6).toFixed(1) + '" text-anchor="end">exact ' + F4(exact) + '</text>');
    if(n){
      var Q = PT.QS[q], nn = 0, dd = 0, pts = [], step = Math.max(1, Math.floor(n / 600));
      for(var i = 0; i < n; i++){ var c = outs[i]; if(Q.num.indexOf(c) > -1) nn++; if(!Q.den || Q.den.indexOf(c) > -1) dd++; if(dd && (i % step === 0 || i === n - 1)) pts.push(lx(i + 1).toFixed(1) + ',' + sy(nn / dd).toFixed(1)); }
      if(pts.length) g.push('<polyline class="pt-run" points="' + pts.join(' ') + '"/><circle class="pt-runend" cx="' + pts[pts.length - 1].split(',')[0] + '" cy="' + pts[pts.length - 1].split(',')[1] + '" r="4.5"/>');
    } else g.push('<text class="pt-empty" x="' + (L + pw / 2) + '" y="' + (Tp + ph / 2) + '" text-anchor="middle">Simulate to see the share settle</text>');
    g.push('<text class="pt-axl" x="' + (L + pw / 2) + '" y="' + (H - 4) + '" text-anchor="middle">Number of trials (log scale)</text>');
    return '<svg class="pt-sim-svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Running estimate of the chosen probability against the number of trials, with the exact value ' + F4(exact) + ' as a line">' + g.join('') + '</svg>';
  }

  /* --------------------------------------------------------- explore */
  function explore(host, data){
    var scenes = (data.explore && data.explore.scenes) || [];
    var LS = null, nid = T.nid('pt'), sc, pA, pBgA, pBgNA, J, q = 'AB', view = 'tree', outs = [], touched = false, anim = null, N = 1000;
    var rng = M.rng(1000 + Math.floor(Math.random() * 9000));
    function $(s){ return host.querySelector(s) || (LS ? LS.root.querySelector(s) : null); }
    function $$(s){ var a = Array.prototype.slice.call(host.querySelectorAll(s)); if(LS) a = a.concat(Array.prototype.slice.call(LS.root.querySelectorAll(s))); return a.filter(function(x, i){ return a.indexOf(x) === i; }); }
    var VIEWS = [['tree', 'Tree'], ['table', 'Table'], ['venn', 'Venn'], ['sim', 'Simulation']];
    host.innerHTML = '<section class="bt-problem pt-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Probability trees</h2>' +
      '<div class="pt-fig"><div class="pt-top"><p class="pt-events"></p><div class="ls-seg pt-tabs" role="group" aria-label="View">' + VIEWS.map(function(v){ return '<button type="button" data-v="' + v[0] + '" aria-pressed="false">' + v[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="pt-views">' + VIEWS.map(function(v){ return '<div class="pt-view pt-v-' + v[0] + '" data-v="' + v[0] + '"><p class="pt-vtitle">' + v[1] + '</p><div class="pt-vbody"></div></div>'; }).join('') + '</div></div>' +
      '<div class="pt-ctl"><div class="pt-qs" role="group" aria-label="Probability to find">' + QLIST.map(function(k){ return '<button type="button" class="pt-q" data-q="' + k + '" aria-pressed="false">' + QNAME[k] + '</button>'; }).join('') + '</div>' +
      '<div class="bt-buttons pt-btns"><button type="button" class="bt-btn pt-sim1" aria-label="Simulate 100 trials">Simulate 100</button><button type="button" class="bt-btn pt-sim2" aria-label="Simulate 1,000 trials">Simulate 1,000</button></div>' +
      '<details class="pt-change"><summary>Change the probabilities</summary><div class="pt-sliders"></div><div class="bt-buttons"><button type="button" class="bt-btn pt-indep">Make them independent</button></div></details></div>' +
      '<div class="pt-say"></div>' +
      T.moreHtml('<div class="pt-pick"></div><div class="bt-buttons"><button type="button" class="bt-btn pt-reset">Clear the simulation</button></div>', 'the events, clear the simulation') +
      '<div class="pt-all"></div><p class="sr-only pt-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.pt-live'));
    var cue = T.cue('Pick a probability to find, or tap a branch, cell or region.');
    $('.pt-ctl').insertBefore(cue.el, $('.pt-ctl').firstChild);
    var sl = {
      pA: T.slider({ label: 'P(A)', min: 0.01, max: 0.99, step: 0.01, value: 0.5, decimals: 2, onInput: function(v){ pA = v; changed(); } }),
      pBgA: T.slider({ label: 'P(B | A)', min: 0, max: 1, step: 0.01, value: 0.5, decimals: 2, onInput: function(v){ pBgA = v; changed(); } }),
      pBgNA: T.slider({ label: 'P(B | not A)', min: 0, max: 1, step: 0.01, value: 0.5, decimals: 2, onInput: function(v){ pBgNA = v; changed(); } })
    };
    Object.keys(sl).forEach(function(k){ $('.pt-sliders').appendChild(sl[k].el); });
    var pick = T.choiceSelect({ label: 'Events', options: scenes.map(function(s, i){ return { value: i, label: s.name }; }), value: 0, onChange: function(v){ setScene(scenes[+v]); } });
    $('.pt-pick').appendChild(pick.el);
    $$('.pt-q').forEach(function(b){ b.addEventListener('click', function(){ act(); ask(b.getAttribute('data-q')); }); });
    $$('.pt-tabs button').forEach(function(b){ b.addEventListener('click', function(){ act(); setView(b.getAttribute('data-v')); }); });
    $('.pt-sim1').addEventListener('click', function(){ act(); sim(100); });
    $('.pt-sim2').addEventListener('click', function(){ act(); sim(1000); });
    $('.pt-indep').addEventListener('click', function(){ act(); pBgNA = pBgA; sl.pBgNA.set(pBgNA); changed(); say('Now P(B | not A) = P(B | A) = ' + nice(pBgA) + ': A and B are independent.'); });
    $('.pt-reset').addEventListener('click', function(){ stop(); outs = []; draw(); say('The simulation is cleared.'); });
    // taps on any view
    $('.pt-views').addEventListener('click', function(e){ var t = e.target.closest('[data-q]'); if(!t) return; act(); ask(t.getAttribute('data-q')); });
    function act(){ if(!touched){ touched = true; cue.done(); } }
    function setScene(s){ stop(); sc = s; pA = s.pA; pBgA = s.pBgA; pBgNA = s.pBgNA; sl.pA.set(pA); sl.pBgA.set(pBgA); sl.pBgNA.set(pBgNA); outs = []; changed(true);
      var sv = LS && LS.root.querySelector('.stat-ls-setup .ls-v'); if(sv) sv.textContent = sc.name; }
    function changed(keep){ J = PT.joint(pA, pBgA, pBgNA); if(!keep){ stop(); outs = []; } draw(); }
    function ask(k){ if(!PT.QS[k]) return; q = k; draw(); var narrow = !$('.pt-fig').classList.contains('is-wide'); if(narrow && view === 'sim' && !outs.length) setView('tree'); }
    function setView(v){ view = v; $$('.pt-tabs button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); }); $$('.pt-view').forEach(function(el){ el.classList.toggle('is-on', el.getAttribute('data-v') === v); }); if(v === 'sim') drawSim(); }
    function formula(){
      var v = PT.value(J, q), Q = PT.QS[q];
      var parts = {
        A: 'P(A) = ' + F4(J.A), B: 'P(B) = P(A)P(B | A) + P(not A)P(B | not A) = ' + nice(J.A) + ' × ' + nice(J.BgA) + ' + ' + nice(J.nA) + ' × ' + nice(J.BgnA) + ' = ' + F4(J.B),
        nA: 'P(not A) = 1 − P(A) = ' + F4(J.nA), nB: 'P(not B) = 1 − P(B) = ' + F4(J.nB),
        AB: 'P(A and B) = P(A) × P(B | A) = ' + nice(J.A) + ' × ' + nice(J.BgA) + ' = ' + F4(J.AB),
        AnB: 'P(A and not B) = ' + nice(J.A) + ' × ' + nice(1 - J.BgA) + ' = ' + F4(J.AnB), nAB: 'P(not A and B) = ' + nice(J.nA) + ' × ' + nice(J.BgnA) + ' = ' + F4(J.nAB), nAnB: 'P(not A and not B) = ' + nice(J.nA) + ' × ' + nice(1 - J.BgnA) + ' = ' + F4(J.nAnB),
        AorB: 'P(A or B) = P(A) + P(B) − P(A and B) = ' + F4(J.A) + ' + ' + F4(J.B) + ' − ' + F4(J.AB) + ' = ' + F4(J.AorB),
        BgA: 'P(B | A) = P(A and B) ÷ P(A) = ' + F4(J.AB) + ' ÷ ' + F4(J.A) + ' = ' + F4(J.BgA),
        AgB: 'P(A | B) = P(A and B) ÷ P(B) = ' + F4(J.AB) + ' ÷ ' + F4(J.B) + ' = ' + F4(v),
        BgnA: 'P(B | not A) = ' + F4(J.nAB) + ' ÷ ' + F4(J.nA) + ' = ' + F4(J.BgnA), AgnB: 'P(A | not B) = P(A and not B) ÷ P(not B) = ' + F4(J.AnB) + ' ÷ ' + F4(J.nB) + ' = ' + F4(v)
      };
      return { text: parts[q], v: v, cond: !!Q.den };
    }
    function words(){
      var A = '"' + sc.A + '" (A)', B = '"' + sc.B + '" (B)';
      return { A: 'the share of all ' + sc.pop + ' in ' + A, B: 'the share of all ' + sc.pop + ' in ' + B + ': add both paths that end in B', nA: 'everyone outside ' + A, nB: 'everyone outside ' + B,
        AB: 'the ' + sc.pop + ' in both ' + A + ' and ' + B, AnB: 'in ' + A + ' but not ' + B, nAB: 'in ' + B + ' but not ' + A, nAnB: 'in neither', AorB: 'in at least one of ' + A + ' and ' + B + ', the overlap counted once',
        BgA: 'only the ' + A + ' slice counts as the whole; the share of it also in ' + B, AgB: 'only the ' + B + ' slice counts as the whole; the share of it also in ' + A,
        BgnA: 'only the slice outside A counts; the share of it in ' + B, AgnB: 'only the slice outside B counts; the share of it in ' + A }[q];
    }
    function draw(){
      var lbl = sc.name + '. A: ' + sc.A + '. B: ' + sc.B + '. ' + QNAME[q] + ' = ' + F4(PT.value(J, q)) + '.';
      $('.pt-events').innerHTML = '<span class="pt-ea">A: ' + esc(sc.A) + '</span><span class="pt-eb">B: ' + esc(sc.B) + '</span>';
      $('.pt-v-tree .pt-vbody').innerHTML = treeSvg(J, sc, q, { label: 'Tree diagram. ' + lbl });
      $('.pt-v-table .pt-vbody').innerHTML = tableHtml(J, sc, q, N);
      $('.pt-v-venn .pt-vbody').innerHTML = vennSvg(J, sc, q, { label: 'Venn diagram. ' + lbl });
      $$('.pt-q').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-q') === q)); });
      drawSim(); text(); allBox(); setView(view);
      var fig = $('.pt-fig'); if(fig){ var r = fig.getBoundingClientRect(); fig.classList.toggle('is-wide', r.width >= 860 && r.height >= 460); }
    }
    function drawSim(){
      var b = $('.pt-v-sim .pt-vbody'); if(!b) return;
      var r = b.getBoundingClientRect(), w = Math.round(r.width) || 480, h = Math.round(r.height) || 260;
      var e = outs.length ? PT.estimate(outs, q) : null;
      b.innerHTML = simSvg(outs, q, PT.value(J, q), w, Math.max(150, h - 30)) + '<p class="pt-simline">' + (e ? esc(outs.length.toLocaleString('en-US') + ' trials: ' + e.n + ' of ' + e.d + (PT.QS[q].den ? ' in the slice' : '') + ' = ' + (e.d ? F4(e.p) : 'none yet')) : 'No trials yet.') + '</p>';
      if(LS) LS.pills(e && e.d ? [{ k: 'Simulated', html: F4(e.p), tone: 'ghost' }] : [], 'right', 'explore');
    }
    function text(){
      var f = formula(), head = f.text + '.', tail = cap(words()) + '.';
      var e = outs.length ? PT.estimate(outs, q) : null;
      if(e && e.d) tail += ' Simulated: ' + F4(e.p) + ' from ' + outs.length.toLocaleString('en-US') + ' trials.';
      var why = '<p>' + esc(cap(words())) + '. ' + (f.cond ? 'A conditional probability keeps only the slice that matches the condition (outlined), then asks what share of it is counted (filled).' : 'The filled outcomes are the ones counted, out of all of them.') + '</p>' +
        '<p><b>Independent?</b> P(B | A) = ' + F4(J.BgA) + ' and P(B) = ' + F4(J.B) + (J.indep ? ': equal, so knowing A does not change the chance of B. A and B are independent.' : ': not equal, so A and B are not independent.') + ' Mutually exclusive would mean P(A and B) = 0' + (J.AB > 0 ? ', which is not the case here.' : ', as here.') + '</p>' +
        '<p>' + esc(sc.note) + '</p>';
      T.explain($('.pt-say'), '<b>' + esc(head) + '</b> ' + esc(tail), why);
      if(LS){ LS.caption('<b>' + esc(head) + '</b> ' + esc(tail), 'explore'); LS.pills([{ k: QNAME[q], html: F4(f.v), tone: 'readout' }], 'left', 'explore'); }
      say(QNAME[q] + ' = ' + F4(f.v) + '. ' + tail);
    }
    function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
    function allBox(){
      var el = $('.pt-all'); if(!el) return;
      var ks = ['A', 'nA', 'B', 'nB', 'AB', 'AnB', 'nAB', 'nAnB', 'AorB', 'BgA', 'BgnA', 'AgB', 'AgnB'];
      el.innerHTML = '<h3 class="ls-title-l">Every probability of these two events</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Every probability of A and B"><table class="ls-tbl"><thead><tr><th scope="col">Probability</th><th scope="col">Exact</th>' + (outs.length ? '<th scope="col">Simulated</th>' : '') + '</tr></thead><tbody>' +
        ks.map(function(k){ var e = outs.length ? PT.estimate(outs, k) : null; return '<tr' + (k === q ? ' class="hl"' : '') + '><th scope="row">' + QNAME[k] + '</th><td class="r">' + F4(PT.value(J, k)) + '</td>' + (e ? '<td class="r">' + (e.d ? F4(e.p) : '') + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table></div>' +
        '<p class="bt-small">A: ' + esc(sc.A) + '. B: ' + esc(sc.B) + '. ' + (outs.length ? outs.length.toLocaleString('en-US') + ' simulated trials.' : '') + '</p>';
    }
    function sim(k){
      stop();
      var add = PT.simulate(rng, J, k);
      var narrow = !$('.pt-fig').classList.contains('is-wide');
      if(narrow) setView('sim');
      if(T.reduced()){ outs = outs.concat(add); drawSim(); text(); allBox(); return; }
      var done = 0, per = Math.max(1, Math.ceil(k / 30));
      anim = window.ApStatPlot.loop(function(){ var n = Math.min(k, done + per); outs = outs.concat(add.slice(done, n)); done = n; drawSim(); return done < k; },
        { onEnd: function(){ anim = null; text(); allBox(); say(outs.length + ' trials. ' + QNAME[q] + ' simulated ' + F4(PT.estimate(outs, q).p) + ', exact ' + F4(PT.value(J, q)) + '.'); } });
      anim.start();
    }
    function stop(){ if(anim){ anim.stop(); anim = null; } }
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.pt-fig')], dock: [$('.pt-ctl')], setup: 'Events', moreLabel: 'The events and the simulation', why: [$('.pt-say')], details: [$('.pt-all')] });
      sp.setup(sc.name);
      draw();
      var ab = document.createElement('div'); ab.className = 'ls-sec stat-about';
      ab.innerHTML = (data.intro || '') + (data.howItWorks ? '<h3 class="ls-title-l">' + esc(data.howItWorksTitle || 'How it works') + '</h3>' + data.howItWorks : '');
      s.add('about', ab, { mode: 'explore' });
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.pt-qs'), text: 'Pick a probability' });
      if(window.ResizeObserver){ var t = null, last = ''; new ResizeObserver(function(en){ var r = en[0].contentRect, k = Math.round(r.width / 4) + 'x' + Math.round(r.height / 4); if(k === last) return; last = k; clearTimeout(t); t = setTimeout(draw, 60); }).observe($('.pt-fig')); }
    }
    setScene(scenes[0]);
    return { stop: stop, studio: studio };
  }

  /* A drill's picture: the problem's tree (its three given numbers only,
     the answers left as question marks) or its two-way table. */
  function qfig(el, p){
    if(!el) return;
    if(p.type === 'table'){ el.innerHTML = '<div class="pt-qtable">' + p.table.html + '</div>'; return; }
    if(p.type !== 'tree'){ el.innerHTML = ''; return; }
    var f = p.figure, J = PT.joint(f.pA, f.pBgA, f.pBgNA);
    var svg = treeSvg(J, { A: 'A', B: 'B' }, null, { label: 'Tree diagram with P(A) = ' + f.pA + ', P(B | A) = ' + f.pBgA + ' and P(B | not A) = ' + f.pBgNA + '. The path probabilities are left for you.' });
    // hide the leaves' values: they are what the problem asks
    svg = svg.replace(/<text class="pt-lv"[^>]*>[^<]*<\/text>/g, function(m){ return m.replace(/>[^<]*</, '>?<'); });
    el.innerHTML = '<figure class="pt-qtree">' + svg + '</figure>';
  }
})();
