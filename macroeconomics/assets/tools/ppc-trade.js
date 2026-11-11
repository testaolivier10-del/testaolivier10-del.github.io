/* PPC and trade trainer page (simulator, free; docs/apmacro-spec.md section 6).
   OWNED BY THIS TOOL ONLY (builder T3, docs/apmacro-briefs/t3.md). Model:
   ApMacroMath.ppcTrade (macroeconomics/assets/tools/math/ppc-trade.js); the PPC
   graph is ApMacroGraph's `ppc` kind; the trade view draws each country on its
   own PPC here (country()), and Test yourself's plots are ApMacroPlot; frame:
   ApMacroTools.modes and drill.

   Explore, PPC: slide along the curve (each extra 10 robots costs more
   pizzas), tap the graph to put the economy anywhere (inside, on, outside),
   and apply events: the curve shifts (the old one stays faded) or the
   economy drops inside it. Explore, Trade: two countries' PPCs, who has the
   comparative advantage, and the terms of trade slider: with specializing
   on, each country's production slides to its corner, the trade line runs
   from there with slope = the terms of trade, what is shipped each way is
   drawn between the two, and consumption lands on the trade line: outside
   its own PPC only when the terms lie between the two opportunity costs.
   Test yourself: points and shifts, opportunity cost from a table,
   comparative advantage from output and from input data, terms of trade. */
(function(){
  'use strict';
  var T = window.ApMacroTools, M = window.ApMacroMath, G = window.ApMacroGraph, P = window.ApMacroPlot;
  (function(){ var app = document.getElementById('app'); if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Numbers & rules'); })();
  if(!T || !M || !M.ppcTrade || M.ppcTrade.stub || !G || !P) return;
  var PT = M.ppcTrade, esc = T.esc, n = PT.n;

  T.mount('ppc-trade', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'ppc-trade',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  function seg(label, items, value, onChange, cls){
    var el = document.createElement('div');
    el.className = 'ls-seg pt-seg' + (cls ? ' ' + cls : '');
    el.setAttribute('role', 'group'); el.setAttribute('aria-label', label);
    el.innerHTML = '<span class="pt-seg-l" aria-hidden="true">' + esc(label) + '</span>' + items.map(function(it){ return '<button type="button" class="bt-mode" data-v="' + esc(it.value) + '" aria-pressed="' + (it.value === value) + '"' + (it.aria ? ' aria-label="' + esc(it.aria) + '"' : '') + '>' + esc(it.label) + '</button>'; }).join('');
    el.addEventListener('click', function(e){ var b = e.target.closest('button[data-v]'); if(b){ set(b.getAttribute('data-v')); onChange(b.getAttribute('data-v')); } });
    function set(v){ el.querySelectorAll('button[data-v]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); }); }
    return { el: el, set: set };
  }
  /* The plot frame of ApMacroGraph.svg (viewBox 320 x 300, plot from x 50,
     y 14, 250 by 226, data 0-10): used only to read a tap on the graph. */
  var GF = { W: 320, H: 300, L: 50, T: 14, PW: 250, PH: 226 };
  var NAMES = { x: 'Robots', y: 'Pizzas' };
  var RWHY = {
    on: '<b>On the PPC:</b> efficient. Every worker and machine is in use; more robots now means fewer pizzas.',
    inside: '<b>Inside the PPC:</b> possible but inefficient. Idle or wasted resources: the economy could make more of both.',
    outside: '<b>Outside the PPC:</b> not possible with today\'s resources and technology.'
  };

  /* ============================================================ explore */
  function explore(host, data){
    var LS = null, live = {};
    (data.contexts || []).forEach(function(c){ live[c.id] = 1; });
    var views = [{ value: 'ppc', label: 'PPC' }, { value: 'trade', label: 'Trade' }].filter(function(v){ return live[v.value]; });
    if(!views.length) views = [{ value: 'trade', label: 'Trade' }];
    var st = { view: views[0].value, x: 4, eff: 1, shift: 0, free: null, evSay: '', sc: 0, t: 0.75, on: false, touched: false };
    var cue = T.cue(st.view === 'ppc' ? 'Slide to make more robots. Watch how many pizzas each extra 10 robots costs.' : 'Turn on Specialize and trade, then move the terms of trade.');
    host.innerHTML = '<section class="bt-problem pt-card" aria-label="PPC and trade explorer"><div class="pt-stage">' +
      '<div class="pt-fig" data-v="ppc"><div class="pt-graph"></div><div class="pt-read"></div></div>' +
      '<div class="pt-fig" data-v="trade" hidden><div class="pt-plot"></div><div class="pt-oc"></div></div>' +
      '</div><div class="pt-ctl"></div><div class="pt-say"></div><div class="pt-det"></div><p class="sr-only pt-live"></p></section>';
    var card = host.querySelector('.pt-card'), ctl = host.querySelector('.pt-ctl'), det = host.querySelector('.pt-det'), sayEl = host.querySelector('.pt-say'), stageEl = host.querySelector('.pt-stage');
    card.insertBefore(cue.el, sayEl);
    var figs = {}; host.querySelectorAll('.pt-fig').forEach(function(f){ figs[f.getAttribute('data-v')] = f; });
    var say = T.announcer(host.querySelector('.pt-live'));
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }
    var viewSeg = views.length > 1 ? seg('View', views, st.view, function(v){ st.view = v; touch(); update(true); }, 'pt-views') : null;
    if(viewSeg) ctl.appendChild(viewSeg.el);
    var groups = { ppc: document.createElement('div'), trade: document.createElement('div') };
    Object.keys(groups).forEach(function(k){ groups[k].className = 'pt-group'; ctl.appendChild(groups[k]); });
    var xSl = T.slider({ label: 'Robots made', min: 0, max: 70, step: 5, value: 40, onInput: function(v){ st.x = v / 10; st.free = null; touch(); update(false); } });
    // The main control: on a phone the studio keeps it on screen (it sat under the fold, with the curve scrolled away once reached).
    xSl.el.setAttribute('data-ls-primary', '');
    groups.ppc.appendChild(xSl.el);
    // Pass 3: one shift and one move inside come first; past four, the shared Tool Studio "More" chip folds the rest.
    var FIRST_EV = { tech: 1, recession: 1 };
    var evOrder = PT.PPC_EVENTS.filter(function(e){ return FIRST_EV[e.id]; }).concat(PT.PPC_EVENTS.filter(function(e){ return !FIRST_EV[e.id]; }));
    var evBox = document.createElement('div');
    evBox.innerHTML = '<p class="pt-lbl">What happens</p><div class="pt-events">' + evOrder.map(function(e){ return '<button type="button" class="bt-btn pt-ev" data-ev="' + e.id + '">' + esc(e.name) + '</button>'; }).join('') + '<button type="button" class="bt-btn pt-ev" data-ev="reset">Start over</button></div>';
    groups.ppc.appendChild(evBox);
    evBox.addEventListener('click', function(e){
      var b = e.target.closest('[data-ev]'); if(!b) return;
      touch();
      var id = b.getAttribute('data-ev');
      if(id === 'reset'){ st.shift = 0; st.eff = 1; st.free = null; st.evSay = ''; }
      else { var ev = PT.PPC_EVENTS.filter(function(x){ return x.id === id; })[0]; if(ev.shift) st.shift = Math.max(-2, Math.min(2, st.shift + ev.shift)); if(ev.eff != null) st.eff = ev.eff; st.free = null; st.evSay = ev.say; }
      update(true);
    });
    var scSeg = seg('Countries', PT.SCENARIOS.map(function(s, i){ return { value: String(i), label: s.goods[0], aria: s.goods.join(' and ') + ': ' + s.A.name + ' and ' + s.B.name }; }), '0', function(v){ st.sc = +v; st.t = mid(); buildT(); touch(); update(true); }, 'pt-sc');
    groups.trade.appendChild(scSeg.el);
    var onSeg = seg('Specialize and trade', [{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }], 'off', function(v){ st.on = v === 'on'; touch(); update(true); }, 'pt-on');
    groups.trade.appendChild(onSeg.el);
    var tSl = null;
    function mid(){ var R = PT.trade(PT.SCENARIOS[st.sc], 1, false); return Math.round((R.lo + R.hi) / 2 * 20) / 20; }
    function buildT(){
      var sc = PT.SCENARIOS[st.sc], R = PT.trade(sc, st.t, st.on);
      var sl = T.slider({ label: 'Price of 1 ' + sc.goods[0].toLowerCase().replace(/s$/, '') + ' (in ' + sc.goods[1].toLowerCase() + ')', min: Math.floor(R.tMin * 20) / 20, max: Math.floor(R.tMax * 20) / 20, step: 0.05, value: st.t, onInput: function(v){ st.t = v; st.on = true; onSeg.set('on'); touch(); update(false); } });
      if(tSl) groups.trade.replaceChild(sl.el, tSl.el); else groups.trade.appendChild(sl.el);
      tSl = sl;
    }
    st.t = mid(); buildT();

    var lastCap = '';
    function update(full){
      Object.keys(figs).forEach(function(k){ figs[k].hidden = k !== st.view; });
      Object.keys(groups).forEach(function(k){ groups[k].hidden = k !== st.view; });
      if(viewSeg) viewSeg.set(st.view);
      var r = st.view === 'ppc' ? drawPpc() : drawTrade();
      T.explain(sayEl, r.head, r.body);
      det.innerHTML = r.det + data.howItWorks;
      if(LS){ if(r.head !== lastCap){ LS.caption(r.head, 'explore'); lastCap = r.head; } LS.pills(r.pills || [], 'left', 'explore'); }
      if(full) say(r.head.replace(/<[^>]+>/g, ''));
    }

    /* ---------------------------------------------------- PPC */
    function drawPpc(){
      var spec = PT.ppcSpec(NAMES), sh = st.shift ? { PPC: st.shift } : {}, r = PT.R0 + st.shift;
      var x = Math.min(st.x, r), pt = st.free || PT.ppcAt(x, st.eff, st.shift);
      var reg = G.region(spec, sh, pt);
      var box = figs.ppc.querySelector('.pt-graph');
      var lab = 'Production possibilities curve for robots and pizzas' + (st.shift ? ', shifted ' + (st.shift > 0 ? 'out' : 'in') + ' from the faded original' : '') + '. The economy is at ' + Math.round(pt[0] * 10) + ' robots and ' + Math.round(pt[1] * 10) + ' pizzas, ' + reg + ' the curve.';
      box.innerHTML = G.svg({ kind: 'ppc', names: NAMES, do: ['point'], pointLabel: 'Now' }, { shifts: sh, point: pt }, { label: lab });
      var svg = box.querySelector('svg');
      svg.addEventListener('pointerdown', function(ev){
        var b = svg.getBoundingClientRect(), px = (ev.clientX - b.left) * GF.W / b.width, py = (ev.clientY - b.top) * GF.H / b.height;
        var dx = (px - GF.L) / GF.PW * 10, dy = 10 - (py - GF.T) / GF.PH * 10;
        if(dx < -0.3 || dy < -0.3 || dx > 10.3 || dy > 10.3) return;
        st.free = [Math.max(0, Math.min(10, Math.round(dx * 4) / 4)), Math.max(0, Math.min(10, Math.round(dy * 4) / 4))];
        touch(); update(true);
      });
      var onCurve = !st.free && st.eff === 1, cost = x < r ? PT.marginal(x, st.shift) : null;
      // Pass 3: the readout sits beside the point, inside the curve (the pills under the graph were far from it);
      // on or off the curve is said by the caption.
      figs.ppc.querySelector('.pt-read').innerHTML = '';
      var qx = GF.L + pt[0] / 10 * GF.PW, qy = GF.T + GF.PH - pt[1] / 10 * GF.PH;
      var l1 = Math.round(pt[0] * 10) + ' robots, ' + Math.round(pt[1] * 10) + ' pizzas', l2 = onCurve && cost != null ? 'next 10 robots cost ' + n(Math.round(cost * 10) / 10, 1) + ' pizzas' : '';
      svg.insertAdjacentHTML('beforeend', '<g class="pt-ptread" aria-hidden="true"><text>' + l1 + '</text>' + (l2 ? '<text class="is-cost">' + l2 + '</text>' : '') + '</g>');
      var tEls = svg.querySelectorAll('.pt-ptread text'), tw = 0;
      tEls.forEach(function(t){ try{ tw = Math.max(tw, t.getComputedTextLength()); }catch(e){} });
      if(!tw) tw = Math.max(l1.length, l2.length) * 5.6;
      var yMax = GF.T + GF.PH - (l2 ? 20 : 6), y1, tx = null;
      // the curve's x at a height, to keep the words off the line: inside it from the axis, as near the point as fits; else just outside it
      function curveX(y){ var v = (GF.T + GF.PH - y) / GF.PH * 10, k = 0; for(var q = 0; q <= 10; q += 0.05){ var c = PT.ppcAt(q, 1, st.shift); if(c && c[1] >= v) k = q; else break; } return GF.L + k / 10 * GF.PW; }
      function lowX(y){ return Math.min(curveX(y - 9), curveX(l2 ? y + 14 : y)); }
      for(var dy = 22; dy <= 130 && tx === null; dy += 12){
        y1 = Math.min(yMax, qy + dy);
        var cIn = lowX(y1);
        if(st.free || GF.L + 6 + tw < cIn - 6) tx = Math.max(GF.L + 6, Math.min(qx - tw / 2, cIn - 6 - tw));
        if(y1 === yMax) break;
      }
      if(tx === null){ y1 = Math.min(yMax, qy + 22); var cOut = Math.max(curveX(y1 - 9), curveX(l2 ? y1 + 14 : y1)); tx = cOut + 8 + tw < GF.W - 2 ? cOut + 8 : GF.L + 6; }
      tEls.forEach(function(t, i){ t.setAttribute('x', f1(tx)); t.setAttribute('y', f1(y1 + i * 14)); });
      var head = st.evSay && !st.free ? st.evSay : RWHY[reg].replace(/<[^>]+>/g, '');
      var c1 = PT.marginal(1, st.shift), c5 = PT.marginal(Math.min(5, r - 1), st.shift);
      var body = '<p>' + RWHY[reg] + '</p>' +
        '<p><b>Increasing opportunity cost:</b> going from 10 to 20 robots gives up about ' + n(Math.round(c1 * 10) / 10, 1) + ' pizzas, but going from ' + Math.min(50, (r - 1) * 10) + ' to ' + Math.min(60, r * 10) + ' gives up about ' + n(Math.round(c5 * 10) / 10, 1) + '. Workers and machines that are good at pizzas get moved to robots last, so the curve bows out. A straight-line PPC would mean the same cost for every unit.</p>' +
        '<p class="mac-slip"><b>Shift or move?</b> More resources or better technology shift the curve; a recession does not, it puts the economy inside the curve. Choosing more robots is a move along it.</p>';
      var detH = '<h3 class="ls-title-l">Along this PPC</h3><table class="ls-tbl"><thead><tr><th scope="col">Robots</th><th scope="col" class="r">Pizzas</th><th scope="col" class="r">Cost of the next 10 robots</th></tr></thead><tbody>' +
        [0, 1, 2, 3, 4, 5, 6].filter(function(k){ return k < r; }).map(function(k){ var p = PT.ppcAt(k, 1, st.shift); return '<tr><td>' + k * 10 + '</td><td class="r">' + n(Math.round(p[1] * 100) / 10, 1) + '</td><td class="r">' + n(Math.round(PT.marginal(k, st.shift) * 10) / 10, 1) + '</td></tr>'; }).join('') + '</tbody></table>';
      return { head: head, body: body, det: detH };
    }

    /* ---------------------------------------------------- trade */
    /* Each country on its own PPC (one scale for both, so sizes compare).
       Off: each makes and eats a mix (the open point). On: production slides
       to its corner (specialization), the trade line runs from that corner
       with slope = the terms of trade, the exchange is drawn between the two
       countries, and consumption sits on the trade line: outside the PPC
       (green wedge) when the terms lie between the two opportunity costs,
       inside it (red wedge) when they do not. */
    var tAnim = { p: 0, id: 0 };
    function tween(to){
      if(tAnim.id) cancelAnimationFrame(tAnim.id);
      tAnim.id = 0;
      if(T.reduced && T.reduced() || !window.requestAnimationFrame){ tAnim.p = to; return; }
      var from = tAnim.p, t0 = null;
      var f = function(ts){
        if(t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / 700), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        tAnim.p = from + (to - from) * e;
        drawPanels();
        if(k < 1) tAnim.id = requestAnimationFrame(f); else tAnim.id = 0;
      };
      tAnim.id = requestAnimationFrame(f);
    }
    function niceStep(m){ var c = [1, 2, 5, 10, 20, 25, 50, 100]; for(var i = 0; i < c.length; i++) if(m / c[i] <= 5) return c[i]; return 200; }
    function f1(v){ return Math.round(v * 10) / 10; }
    function country(k, w, h, sc, R, p){
      var c = sc[k], X = sc.goods[0], Y = sc.goods[1], s = k === 'A' ? 's1' : 's2', ex = k === R.xer;
      var mx = Math.max(sc.A.x, sc.B.x) * 1.08, my = Math.max(sc.A.y, sc.B.y, R.after.A[1], R.after.B[1]) * 1.12;
      var L = 44, Tp = 46, Rt = 14, B = 40, PW = w - L - Rt, PH = h - Tp - B;
      function sx(v){ return L + v / mx * PW; } function sy(v){ return Tp + PH - v / my * PH; }
      var g = [], lab = [];
      var stx = niceStep(mx), sty = niceStep(my);
      for(var v = 0; v <= mx + 1e-9; v += stx){ g.push('<line class="pt-grid" x1="' + f1(sx(v)) + '" y1="' + Tp + '" x2="' + f1(sx(v)) + '" y2="' + (Tp + PH) + '"/><text class="pt-tick" x="' + f1(sx(v)) + '" y="' + (Tp + PH + 14) + '" text-anchor="middle">' + v + '</text>'); }
      for(v = 0; v <= my + 1e-9; v += sty){ g.push('<line class="pt-grid" x1="' + L + '" y1="' + f1(sy(v)) + '" x2="' + (L + PW) + '" y2="' + f1(sy(v)) + '"/><text class="pt-tick" x="' + (L - 6) + '" y="' + f1(sy(v) + 4) + '" text-anchor="end">' + v + '</text>'); }
      g.push('<line class="pt-axis" x1="' + L + '" y1="' + Tp + '" x2="' + L + '" y2="' + (Tp + PH) + '"/><line class="pt-axis" x1="' + L + '" y1="' + (Tp + PH) + '" x2="' + (L + PW) + '" y2="' + (Tp + PH) + '"/>');
      g.push('<text class="pt-axl" x="' + (L + PW) + '" y="' + (Tp + PH + 30) + '" text-anchor="end">' + esc(X) + ' (' + esc(sc.unit) + ')</text><text class="pt-axl" x="' + (L - 6) + '" y="' + (Tp - 8) + '" text-anchor="start">' + esc(Y) + '</text>');
      var on = st.on && p > 0, done = st.on && p >= 1 - 1e-6, t = st.t;
      var corner = ex ? [c.x, 0] : [0, c.y], before = R.before[k], after = R.after[k];
      // the trade line from the corner, slope -t, to the axes
      var tl = ex ? [[c.x, 0], [0, t * c.x]] : [[0, c.y], [c.y / t, 0]];
      var gain = ex ? t * c.x > c.y + 1e-9 : c.y / t > c.x + 1e-9, flat = ex ? Math.abs(t * c.x - c.y) < 1e-9 : Math.abs(c.y / t - c.x) < 1e-9;
      function clip(pt){ return [Math.min(pt[0], mx), Math.min(pt[1], my)]; }
      if(done){
        // the wedge between the PPC and the trade line: what trade adds (or takes away)
        var tip = ex ? [0, Math.min(t * c.x, my)] : [Math.min(c.y / t, mx), 0], ppcEnd = ex ? [0, c.y] : [c.x, 0];
        var poly = [corner, ppcEnd, tip];
        if(ex && t * c.x > my){ poly = [corner, ppcEnd, [0, my], [c.x - my / t, my]]; }
        if(!ex && c.y / t > mx){ poly = [corner, ppcEnd, [mx, 0], [mx, c.y - t * mx]]; }
        if(!flat) g.push('<polygon class="pt-wedge ' + (gain ? 'is-gain' : 'is-loss') + '" points="' + poly.map(function(q){ return f1(sx(q[0])) + ',' + f1(sy(q[1])); }).join(' ') + '"/>');
        var e = ex ? clip([Math.max(0, c.x - my / t), Math.min(t * c.x, my)]) : clip([Math.min(c.y / t, mx), Math.max(0, c.y - t * mx)]);
        g.push('<line class="pt-tline ' + s + '" x1="' + f1(sx(corner[0])) + '" y1="' + f1(sy(corner[1])) + '" x2="' + f1(sx(e[0])) + '" y2="' + f1(sy(e[1])) + '"/>');
      }
      g.push('<line class="pt-ppc ' + s + '" x1="' + f1(sx(0)) + '" y1="' + f1(sy(c.y)) + '" x2="' + f1(sx(c.x)) + '" y2="' + f1(sy(0)) + '"/>');
      // PPC label near its top end
      lab.push('<text class="pt-plab ' + s + '" x="' + f1(sx(0) + 6) + '" y="' + f1(sy(c.y) - 6) + '">PPC</text>');
      if(done){
        // "Trade line" beside the line, 80% of the way from the corner, on its outer side
        var te = ex ? [Math.max(0, c.x - my / t), Math.min(t * c.x, my)] : [Math.min(c.y / t, mx), Math.max(0, c.y - t * mx)];
        var tx = sx(corner[0] + (te[0] - corner[0]) * 0.8), ty = sy(corner[1] + (te[1] - corner[1]) * 0.8);
        lab.push('<text class="pt-plab pt-tlab ' + s + '" x="' + f1(tx + 8) + '" y="' + f1(ty - 6) + '" text-anchor="start">Trade line</text>');
      }
      // before: makes and eats the same mix (faded once trade is on)
      g.push('<circle class="pt-pt is-open ' + s + (on ? ' is-faded' : '') + '" cx="' + f1(sx(before[0])) + '" cy="' + f1(sy(before[1])) + '" r="5"/>');
      if(!on) lab.push('<text class="pt-plab" x="' + f1(sx(before[0]) + 9) + '" y="' + f1(sy(before[1]) - 8) + '">Makes and eats</text>');
      if(on){
        var mk = [before[0] + (corner[0] - before[0]) * p, before[1] + (corner[1] - before[1]) * p];
        g.push('<rect class="pt-make ' + s + '" x="' + f1(sx(mk[0]) - 6) + '" y="' + f1(sy(mk[1]) - 6) + '" width="12" height="12" rx="2"/>');
        if(done){
          lab.push('<text class="pt-plab" x="' + f1(sx(corner[0]) + (ex ? -8 : 10)) + '" y="' + f1(sy(corner[1]) + (ex ? -12 : 16)) + '" text-anchor="' + (ex ? 'end' : 'start') + '">Makes only ' + esc((ex ? X : Y).toLowerCase()) + '</text>');
          // the exchange: from what it makes to what it eats, stopping short of the point
          var ax = sx(after[0]) - sx(corner[0]), ay = sy(after[1]) - sy(corner[1]), al = Math.sqrt(ax * ax + ay * ay) || 1, sh0 = Math.min(12, al / 3);
          g.push('<line class="pt-move" x1="' + f1(sx(corner[0]) + ax / al * 10) + '" y1="' + f1(sy(corner[1]) + ay / al * 10) + '" x2="' + f1(sx(after[0]) - ax / al * sh0) + '" y2="' + f1(sy(after[1]) - ay / al * sh0) + '" marker-end="url(#pt-ah-' + k + ')"/>');
          g.push('<circle class="pt-pt ' + s + '" cx="' + f1(sx(after[0])) + '" cy="' + f1(sy(after[1])) + '" r="6"/>');
          // above and right of the point: the space outside both lines
          var lx = Math.max(L + 6, Math.min(sx(after[0]) + 10, L + PW - 150)), ly = Math.max(Tp + 12, sy(after[1]) - 24);
          lab.push('<text class="pt-plab is-strong" x="' + f1(lx) + '" y="' + f1(ly) + '" text-anchor="start">Eats ' + n(after[0]) + ' ' + esc(X.toLowerCase()) + ', ' + n(after[1]) + ' ' + esc(Y.toLowerCase()) + '</text>');
          lab.push('<text class="pt-plab ' + (flat ? 'is-flat' : gain ? 'is-gain' : 'is-loss') + '" x="' + f1(lx) + '" y="' + f1(ly + 14) + '" text-anchor="start">' + (flat ? 'on its PPC: no gain' : gain ? 'outside its PPC' : 'inside its PPC') + '</text>');
        }
      }
      var head = '<text class="pt-ctitle ' + s + '" x="' + L + '" y="16">' + esc(c.name) + '</text><text class="pt-csub" x="' + (L + PW) + '" y="16" text-anchor="end">' + (st.on ? 'specializes in ' + esc((ex ? X : Y).toLowerCase()) : '1 ' + esc(X.toLowerCase().replace(/s$/, '')) + ' costs ' + n(k === 'A' ? R.ocA : R.ocB) + ' ' + esc(Y.toLowerCase())) + '</text>';
      var defs = '<defs><marker id="pt-ah-' + k + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="pt-ahead"/></marker></defs>';
      var aria = c.name + '’s straight-line PPC: at most ' + c.x + ' ' + X.toLowerCase() + ' or ' + c.y + ' ' + Y.toLowerCase() + '. ' + (!st.on ? 'It makes and eats ' + n(before[0]) + ' and ' + n(before[1]) + '.' : 'It makes only ' + (ex ? X : Y).toLowerCase() + ' and, after trade, eats ' + n(after[0]) + ' ' + X.toLowerCase() + ' and ' + n(after[1]) + ' ' + Y.toLowerCase() + ', ' + (flat ? 'on its PPC' : gain ? 'outside its PPC' : 'inside its PPC') + '.');
      return '<svg class="pt-csvg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(aria) + '">' + defs + head + g.join('') + lab.join('') + '</svg>';
    }
    function drawPanels(){
      var sc = PT.SCENARIOS[st.sc], R = PT.trade(sc, st.t, st.on), box = figs.trade.querySelector('.pt-plot');
      var two = box.querySelector('.pt-two');
      if(!two){ box.innerHTML = '<div class="pt-two"><div class="pt-cty" data-k="A"></div><div class="pt-xch"></div><div class="pt-cty" data-k="B"></div></div>'; two = box.querySelector('.pt-two'); }
      var narrow = (box.clientWidth || 520) < 560;
      two.classList.toggle('is-narrow', narrow);
      var cw = narrow ? Math.max(260, box.clientWidth || 340) : Math.max(220, ((box.clientWidth || 640) - 140) / 2);
      var ch = narrow ? Math.max(190, Math.min(320, ((box.clientHeight || 520) - 64) / 2)) : Math.max(240, Math.min(cw * 1.2, (box.clientHeight || 360) - 4));
      ['A', 'B'].forEach(function(k){ two.querySelector('.pt-cty[data-k=' + k + ']').innerHTML = country(k, Math.round(cw), Math.round(ch), sc, R, st.on ? tAnim.p : 0); });
      var xer = sc[R.xer], yer = sc[R.yer], X = sc.goods[0].toLowerCase(), Y = sc.goods[1].toLowerCase(), done = st.on && tAnim.p >= 1 - 1e-6;
      var xa = R.xer === 'A', got = R.q * st.t;
      two.querySelector('.pt-xch').innerHTML = !done ? '<p class="pt-xnone">' + (st.on ? 'Specializing…' : 'No trade: each country makes everything it eats.') + '</p>' :
        '<div class="pt-ship s' + (xa ? 1 : 2) + ' ' + (xa ? 'to-b' : 'to-a') + '"><b>' + esc(xer.name) + '</b> ships ' + n(R.q) + ' ' + esc(X) + '<i aria-hidden="true"></i></div>' +
        '<div class="pt-ship s' + (xa ? 2 : 1) + ' ' + (xa ? 'to-a' : 'to-b') + '"><b>' + esc(yer.name) + '</b> pays ' + n(Math.round(got * 100) / 100) + ' ' + esc(Y) + '<i aria-hidden="true"></i></div>' +
        '<p class="pt-xrate">' + n(st.t) + ' ' + esc(Y) + ' per ' + esc(X.replace(/s$/, '')) + '</p>';
    }
    function drawTrade(){
      var sc = PT.SCENARIOS[st.sc], R = PT.trade(sc, st.t, st.on), X = sc.goods[0].toLowerCase(), Y = sc.goods[1].toLowerCase();
      var A = sc.A, B = sc.B;
      if(st.on !== tAnim.on){ tAnim.on = st.on; if(st.on){ tAnim.p = 0; tween(1); } else { if(tAnim.id) cancelAnimationFrame(tAnim.id); tAnim.id = 0; tAnim.p = 0; } }
      drawPanels();
      var xer = sc[R.xer], yer = sc[R.yer], gx = R.gain[R.xer], gy = R.gain[R.yer];
      figs.trade.querySelector('.pt-oc').innerHTML = '<table class="pt-tbl"><thead><tr><th scope="col"></th><th scope="col" class="r">Most ' + esc(X) + '</th><th scope="col" class="r">Most ' + esc(Y) + '</th><th scope="col" class="r">1 ' + esc(X.replace(/s$/, '')) + ' costs</th></tr></thead><tbody>' +
        ['A', 'B'].map(function(k){ var c = sc[k], oc = k === 'A' ? R.ocA : R.ocB; return '<tr class="is-' + k + '"><th scope="row"><i class="pt-sw s' + (k === 'A' ? 1 : 2) + '"></i>' + esc(c.name) + '</th><td class="r">' + c.x + '</td><td class="r">' + c.y + '</td><td class="r"><b>' + n(oc) + ' ' + esc(Y) + '</b>' + (k === R.xer ? ' <span class="pt-ca">lower</span>' : '') + '</td></tr>'; }).join('') + '</tbody></table>';
      var verdict = !st.on ? null : R.both ? 'good' : 'warn';
      var head = !st.on ? '<b>' + esc(xer.name) + '</b> gives up less ' + esc(Y) + ' per unit of ' + esc(X) + ' (' + n(R.lo) + ' against ' + n(R.hi) + '): its comparative advantage is ' + esc(X) + '.'
        : R.both ? '<b>Both gain.</b> At ' + n(st.t) + ' ' + esc(Y) + ' per ' + esc(X.replace(/s$/, '')) + ', between ' + n(R.lo) + ' and ' + n(R.hi) + ', both end up outside their own PPCs.'
        : st.t <= R.lo + 1e-9 ? '<b>' + esc(xer.name) + ' ' + (Math.abs(st.t - R.lo) < 1e-9 ? 'gains nothing' : 'loses') + '.</b> At ' + n(st.t) + ', it gets no more ' + esc(Y) + ' than making them itself (' + n(R.lo) + ').'
        : '<b>' + esc(yer.name) + ' ' + (Math.abs(st.t - R.hi) < 1e-9 ? 'gains nothing' : 'loses') + '.</b> At ' + n(st.t) + ', it pays at least what making ' + esc(X) + ' itself costs (' + n(R.hi) + ').';
      var body = '<p><b>Opportunity cost</b> with output data: one ' + esc(X.replace(/s$/, '')) + ' costs ' + esc(Y) + ' ÷ ' + esc(X) + '. ' + esc(A.name) + ': ' + A.y + ' ÷ ' + A.x + ' = ' + n(R.ocA) + '; ' + esc(B.name) + ': ' + B.y + ' ÷ ' + B.x + ' = ' + n(R.ocB) + '.</p>' +
        '<p><b>Comparative advantage</b> is the lower opportunity cost: ' + esc(xer.name) + ' in ' + esc(X) + ', ' + esc(yer.name) + ' in ' + esc(Y) + '.' + (R.absX && R.absX === R.absY ? ' ' + esc(sc[R.absX].name) + ' can make more of both (an absolute advantage in both), and trade still helps both.' : '') + '</p>' +
        (st.on ? '<p>' + esc(xer.name) + ' makes only ' + esc(X) + ' and sells ' + n(R.q) + ' of them; ' + esc(yer.name) + ' makes only ' + esc(Y) + '. Gains compared with making the same goods alone: ' + esc(xer.name) + ' ' + n(Math.round(gx * 100) / 100) + ' ' + esc(Y) + ', ' + esc(yer.name) + ' ' + n(Math.round(gy * 100) / 100) + ' ' + esc(Y) + '.</p>' : '') +
        '<p class="mac-slip"><b>Terms that help both</b> lie strictly between the two opportunity costs, here between ' + n(R.lo) + ' and ' + n(R.hi) + ' ' + esc(Y) + ' per ' + esc(X.replace(/s$/, '')) + '.</p>';
      var detH = '<h3 class="ls-title-l">This trade</h3><table class="ls-tbl"><tbody><tr><th scope="row">Opportunity cost of 1 ' + esc(X.replace(/s$/, '')) + '</th><td class="r">' + esc(A.name) + ' ' + n(R.ocA) + ', ' + esc(B.name) + ' ' + n(R.ocB) + '</td></tr><tr><th scope="row">Opportunity cost of 1 unit of ' + esc(Y) + '</th><td class="r">' + esc(A.name) + ' ' + n(R.ocAy) + ', ' + esc(B.name) + ' ' + n(R.ocBy) + '</td></tr><tr><th scope="row">Terms that help both</th><td class="r">' + n(R.lo) + ' to ' + n(R.hi) + '</td></tr>' +
        (st.on ? '<tr><th scope="row">' + esc(A.name) + ' consumes</th><td class="r">' + n(R.after.A[0]) + ' ' + esc(X) + ', ' + n(R.after.A[1]) + ' ' + esc(Y) + '</td></tr><tr><th scope="row">' + esc(B.name) + ' consumes</th><td class="r">' + n(R.after.B[0]) + ' ' + esc(X) + ', ' + n(R.after.B[1]) + ' ' + esc(Y) + '</td></tr>' : '') + '</tbody></table>';
      return { head: head, body: body, det: detH, pills: verdict ? [{ html: R.both ? 'Both gain' : 'One side loses', tone: verdict }] : [] };
    }
    if(window.ResizeObserver){ var k0 = ''; new ResizeObserver(function(){ var k = stageEl.clientWidth + 'x' + stageEl.clientHeight; if(k !== k0){ k0 = k; update(false); } }).observe(stageEl); }
    function studio(p, s){
      LS = s;
      T.studioPane(p, s, { stage: [stageEl], dock: [ctl], why: [sayEl], details: [det] });
      lastCap = ''; update(true);
      var tgt = st.view === 'ppc' ? xSl.input : onSeg.el.querySelector('[data-v="on"]');
      if(s.mode() === 'explore' && tgt) T.hintSlot(s, tgt, st.view === 'ppc' ? 'Slide to make more robots' : 'Turn trade on');
    }
    update(true);
    return { studio: studio };
  }

  /* ============================================================ test yourself */
  function quiz(host, data){
    var kinds = [];
    (data.contexts || []).forEach(function(c){ (c.types || []).forEach(function(t){ if(kinds.indexOf(t) < 0) kinds.push(t); }); });
    T.drill(host, data, { slug: 'ppc-trade', noun: 'drill',
      types: kinds.map(function(k){ return { value: k, label: PT.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: PT.generate, title: function(p){ return p.title; },
      extra: function(el, p){
        var box = document.createElement('div'); box.className = 'pt-qfig pt-qfig-' + p.type;
        el.appendChild(box);
        if(p.fig.graph){
          box.innerHTML = '<div class="pt-qgraph">' + G.svg(p.fig.graph, { point: p.fig.point }, { label: 'Production possibilities curve for ' + p.fig.graph.names.x.toLowerCase() + ' and ' + p.fig.graph.names.y.toLowerCase() + ' with point X marked.' }) + '</div>';
          return;
        }
        box.innerHTML = (p.fig.html || '') + (p.fig.plot ? '<div class="pt-qplot"></div>' : '');
        if(!p.fig.plot) return;
        var pl = box.querySelector('.pt-qplot');
        function draw(){ if(!pl.isConnected) return; var spec = JSON.parse(JSON.stringify(p.fig.plot)), w = Math.max(240, pl.clientWidth || 360), h = Math.max(160, Math.min(320, pl.clientHeight || 220)); spec.width = w; spec.height = h - (spec.legend ? 22 : 0) - 16; pl.innerHTML = P.svg(spec); }
        requestAnimationFrame(draw);
        if(window.ResizeObserver){ var k0 = ''; new ResizeObserver(function(){ var k = pl.clientWidth + 'x' + pl.clientHeight; if(k !== k0){ k0 = k; draw(); } }).observe(pl); }
      }
    });
  }
})();
