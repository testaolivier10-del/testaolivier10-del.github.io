/* PPC and trade trainer page (simulator, free; docs/apmacro-spec.md section 6).
   OWNED BY THIS TOOL ONLY (builder T3, docs/apmacro-briefs/t3.md). Model:
   ApMacroMath.ppcTrade (macroeconomics/assets/tools/math/ppc-trade.js); the PPC
   graph is ApMacroGraph's `ppc` kind, the two countries' straight-line PPCs
   are data plotted with ApMacroPlot; frame: ApMacroTools.modes and drill.

   Explore, PPC: slide along the curve (each extra 10 robots costs more
   pizzas), tap the graph to put the economy anywhere (inside, on, outside),
   and apply events: the curve shifts (the old one stays faded) or the
   economy drops inside it. Explore, Trade: two countries' PPCs, who has the
   comparative advantage, and the terms of trade slider: with specializing
   on, each country's consumption moves outside its own PPC only when the
   terms lie between the two opportunity costs.
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
    groups.ppc.appendChild(xSl.el);
    var evBox = document.createElement('div');
    evBox.innerHTML = '<p class="pt-lbl">What happens</p><div class="pt-events">' + PT.PPC_EVENTS.map(function(e){ return '<button type="button" class="bt-btn pt-ev" data-ev="' + e.id + '">' + esc(e.name) + '</button>'; }).join('') + '<button type="button" class="bt-btn pt-ev" data-ev="reset">Start over</button></div>';
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
      var sl = T.slider({ label: 'Price of 1 ' + sc.goods[0].toLowerCase() + ' (in ' + sc.goods[1].toLowerCase() + ')', min: Math.floor(R.tMin * 20) / 20, max: Math.floor(R.tMax * 20) / 20, step: 0.05, value: st.t, onInput: function(v){ st.t = v; st.on = true; onSeg.set('on'); touch(); update(false); } });
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
      figs.ppc.querySelector('.pt-read').innerHTML = '<span class="pt-chip is-' + reg + '">' + (reg === 'on' ? 'On the PPC' : reg === 'inside' ? 'Inside the PPC' : 'Outside the PPC') + '</span>' +
        '<span class="pt-chip">' + Math.round(pt[0] * 10) + ' robots, ' + Math.round(pt[1] * 10) + ' pizzas</span>' +
        (onCurve && cost != null ? '<span class="pt-chip is-cost">Next 10 robots cost ' + n(Math.round(cost * 10) / 10, 1) + ' pizzas</span>' : '');
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
    function drawTrade(){
      var sc = PT.SCENARIOS[st.sc], R = PT.trade(sc, st.t, st.on), X = sc.goods[0].toLowerCase(), Y = sc.goods[1].toLowerCase();
      var A = sc.A, B = sc.B, box = figs.trade.querySelector('.pt-plot');
      var w = Math.max(260, box.clientWidth || 520), h = Math.max(200, Math.min(460, box.clientHeight || 300));
      var mx = Math.max(A.x, B.x, R.after.A[0], R.after.B[0]) * 1.12, my = Math.max(A.y, B.y, R.after.A[1], R.after.B[1]) * 1.18;
      var pts = [{ at: R.before.A, cls: 's1', open: true, label: st.on ? '' : A.name }, { at: R.before.B, cls: 's2', open: true, label: st.on ? '' : B.name }];
      if(st.on){ pts.push({ at: R.after.A, cls: 's1', label: A.name + ' after' }); pts.push({ at: R.after.B, cls: 's2', label: B.name + ' after' }); }
      var spec = { label: 'Straight-line PPCs of ' + A.name + ' and ' + B.name + (st.on ? ', with each country\'s consumption before trade (open) and after trade (filled)' : ''), width: w, height: h - 38, x: [0, mx], y: [0, my], xLabel: sc.goods[0] + ' (' + sc.unit + ')', yLabel: sc.goods[1],
        lines: [{ seg: true, through: [[0, A.y], [A.x, 0]], cls: 's1' }, { seg: true, through: [[0, B.y], [B.x, 0]], cls: 's2' }].concat(st.on ? [
          { seg: true, through: [R.before[R.xer], R.after[R.xer]], cls: R.xer === 'A' ? 's1' : 's2', dashed: true }, { seg: true, through: [R.before[R.yer], R.after[R.yer]], cls: R.yer === 'A' ? 's1' : 's2', dashed: true }] : []),
        points: pts, legend: [{ name: A.name + ' PPC', cls: 's1' }, { name: B.name + ' PPC', cls: 's2' }] };
      box.innerHTML = P.svg(spec);
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
