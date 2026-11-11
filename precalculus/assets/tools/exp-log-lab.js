/* Exponential and log lab (simulator, Unit 2, Premium; docs/apprecalc-spec.md section 6).
   OWNED BY THIS TOOL ONLY (builder T2, docs/apprecalc-briefs/t2.md). The model is
   ApPrecalcMath.expLogLab (precalculus/assets/tools/math/exp-log-lab.js); math text
   ApPrecalcTex; sampling, dragging and the animation loop ApPrecalcPlot; the
   frame ApPrecalcTools.modes and drill on the Tool Studio.

   Explore has four views (the switch in the dock; each unlocks with its topic):
     Ratios   L(x) = a + mx (blue) and E(x) = a·b^x (green) from one start,
              with the step table under the graph: L adds m, E multiplies by
              b. Tap a step on the graph or the table: it is marked in both.
     Inverse  y = b^x and y = log_b x mirrored in y = x; drag the point and
              its mirror swaps the coordinates; Reflect folds one graph onto
              the other (the end state under reduced motion).
     Log rules  heights on y = log_b x: the bars at u and v stack to the bar
              at uv (product), subtract (quotient), or k copies (power).
     Semi-log  a data set on y against x, then on log10 y against x (animated):
              exponential data straighten; the line gives a and b.
   Test yourself: ApPrecalcTools.drill over the model's five kinds; the
   figure builds as you answer and a wrong value is drawn dashed. */
(function(){
  'use strict';
  (function(){ var app = document.getElementById('app'); if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Tables & formulas'); })();
  var T = window.ApPrecalcTools, M = window.ApPrecalcMath, P = window.ApPrecalcPlot;
  if(!T || !M || !M.expLogLab || M.expLogLab.stub || !P) return;
  var EL = M.expLogLab, esc = T.esc;
  function X(){ return window.ApPrecalcTex; }
  function tx(s){ return X() ? X().html(String(s)) : esc(s); }
  function tm(t, d){ return X() ? X().render(t, { display: !!d }) : esc(t); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function mn(s){ return String(s).replace(/-/g, '−'); }
  function f2(v){ return mn(M.fixed(v, 2)); }
  function f3(v){ return mn(M.fixed(v, 3)); }
  function g3(v){ return mn(String(+M.fixed(v, 3))); }
  var SUB = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '.': '.' };
  function logName(b){ var s = g3(b); return /^[\d.]+$/.test(s) && s.length <= 4 ? 'log' + s.replace(/./g, function(c){ return SUB[c]; }) : 'log_b'; }
  var VIEW_NAME = { ratios: 'Ratios', inverse: 'Inverse', rules: 'Rules', semilog: 'Semi-log' };

  /* ------------------------------------------------ a plot frame */
  function frameOf(w, h, xr, yr, o){
    o = o || {};
    var L = o.L || (w < 420 ? 34 : 44), Rr = 12, T0 = 10, B = h - (o.bottom || 24);
    if(o.square){
      // equal scales: shrink one side
      var sx = (w - L - Rr) / (xr[1] - xr[0]), sy = (B - T0) / (yr[1] - yr[0]), s = Math.min(sx, sy);
      var pw = s * (xr[1] - xr[0]), phh = s * (yr[1] - yr[0]); L = L + ((w - L - Rr) - pw) / 2; Rr = w - L - pw; T0 = T0 + ((B - T0) - phh) / 2; B = T0 + phh;
    }
    var G = { w: w, h: h, L: L, R: w - Rr, T: T0, B: B, x: xr, y: yr, phone: w < 420 };
    G.sx = function(v){ return L + (v - xr[0]) / (xr[1] - xr[0]) * (G.R - L); };
    G.sy = function(v){ return T0 + (yr[1] - v) / (yr[1] - yr[0]) * (B - T0); };
    G.ix = function(p){ return xr[0] + (p - L) / (G.R - L) * (xr[1] - xr[0]); };
    G.iy = function(p){ return yr[1] - (p - T0) / (B - T0) * (yr[1] - yr[0]); };
    return G;
  }
  function axes(G, o){
    o = o || {}; var out = [], xt = P.ticks(G.x[0], G.x[1], o.nx || (G.phone ? 5 : 8)), yt = P.ticks(G.y[0], G.y[1], o.ny || (G.phone ? 4 : 6));
    out.push('<rect class="el-bg" x="' + r1(G.L) + '" y="' + r1(G.T) + '" width="' + r1(G.R - G.L) + '" height="' + r1(G.B - G.T) + '" rx="8"/>');
    out.push('<g class="el-grid">' + xt.map(function(v){ return '<line x1="' + r1(G.sx(v)) + '" y1="' + r1(G.T) + '" x2="' + r1(G.sx(v)) + '" y2="' + r1(G.B) + '"/>'; }).join('') + yt.map(function(v){ return '<line x1="' + r1(G.L) + '" y1="' + r1(G.sy(v)) + '" x2="' + r1(G.R) + '" y2="' + r1(G.sy(v)) + '"/>'; }).join('') + '</g>');
    var ax = G.y[0] <= 0 && G.y[1] >= 0 ? G.sy(0) : G.B, ay = G.x[0] <= 0 && G.x[1] >= 0 ? G.sx(0) : G.L;
    out.push('<g class="el-axis"><line x1="' + r1(G.L) + '" y1="' + r1(ax) + '" x2="' + r1(G.R) + '" y2="' + r1(ax) + '"/><line x1="' + r1(ay) + '" y1="' + r1(G.T) + '" x2="' + r1(ay) + '" y2="' + r1(G.B) + '"/></g>');
    out.push('<g class="el-tk">' + xt.filter(function(v){ return v !== 0 || ay === G.L; }).map(function(v){ return '<text x="' + r1(G.sx(v)) + '" y="' + r1(G.B + 15) + '" text-anchor="middle">' + mn(+v.toPrecision(6)) + '</text>'; }).join('') +
      yt.filter(function(v){ return v !== 0 || ax === G.B; }).map(function(v){ return '<text x="' + r1(G.L - 5) + '" y="' + r1(G.sy(v) + 4) + '" text-anchor="end">' + (o.yfmt ? o.yfmt(v) : mn(+v.toPrecision(6))) + '</text>'; }).join('') +
      (o.xLabel ? '<text class="el-axl" x="' + r1(G.R - 2) + '" y="' + r1(G.B - 6) + '" text-anchor="end">' + esc(o.xLabel) + '</text>' : '') +
      (o.yLabel ? '<text class="el-axl" x="' + r1(G.L + 6) + '" y="' + r1(G.T + 14) + '">' + esc(o.yLabel) + '</text>' : '') + '</g>');
    return out.join('');
  }
  function path(G, f, a, b, cls, n){
    var runs = P.sample(f, a, b, G, n || 300);
    return '<path class="' + cls + '" d="' + runs.map(function(rn){ return 'M' + rn.map(function(p){ return r1(G.sx(p[0])) + ' ' + r1(G.sy(p[1])); }).join('L'); }).join('') + '"/>';
  }
  function dot(G, x, y, cls, r){ return x >= G.x[0] && x <= G.x[1] && y >= G.y[0] && y <= G.y[1] ? '<circle class="' + cls + '" cx="' + r1(G.sx(x)) + '" cy="' + r1(G.sy(y)) + '" r="' + (r || 5) + '"/>' : ''; }
  function label(G, x, y, text, cls, anchor, dx, dy){ return '<text class="el-lab ' + (cls || '') + '" x="' + r1(G.sx(x) + (dx || 0)) + '" y="' + r1(G.sy(y) + (dy || 0)) + '" text-anchor="' + (anchor || 'start') + '">' + esc(text) + '</text>'; }
  function niceUp(v){ var p = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1e-9)))), ms = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; for(var i = 0; i < ms.length; i++) if(v <= ms[i] * p + 1e-9) return ms[i] * p; return 10 * p; }
  function sizeOf(wrap, mw, mh){ return [Math.max(260, Math.round(wrap.clientWidth || mw)), Math.max(200, Math.round(wrap.clientHeight || mh))]; }
  function observe(wrap, fn){ if(window.ResizeObserver){ var t = null, last = ''; new ResizeObserver(function(){ var k = wrap.clientWidth + 'x' + wrap.clientHeight; if(k === last) return; last = k; clearTimeout(t); t = setTimeout(fn, 40); }).observe(wrap); } }

  T.mount('exp-log-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'exp-log-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } },
      onShow: function(m){ if(ex){ if(m === 'explore') ex.redraw(); else ex.pause(); } } });
  });

  /* ============================================================ explore */
  function explore(host, data){
    var views = (data.views || []).map(function(v){ return v.id; }).filter(function(v){ return VIEW_NAME[v]; });
    if(!views.length) views = ['ratios'];
    var sets = (data.datasets || []).map(function(d){ return d.id; }).filter(function(id){ return EL.DATASETS[id]; });
    if(!sets.length) sets = EL.DATASET_ORDER.slice();
    var st = { view: views[0], a: 2, m: 3, b: 1.5, k: 3, ib: 2, t: 1, fold: 0, rule: 'product', rb: 2, u: 2, v: 4, kp: 3, set: sets[0], logy: 0, touched: false };
    var LS = null, anim = null;
    var cue = T.cue('Move the sliders and watch the table: one column adds the same amount, the other multiplies by the same factor.');
    host.innerHTML =
      '<section class="bt-problem el-card" aria-label="Exponential and log lab">' +
        '<div class="el-stage">' +
          '<div class="el-plotwrap"><svg class="el-svg" role="img"></svg></div>' +
          '<div class="el-under"></div>' +
        '</div>' +
        '<div class="el-ctl">' +
          (views.length > 1 ? '<div class="el-views ls-seg" role="group" aria-label="View">' + views.map(function(v){ return '<button type="button" class="bt-mode" data-v="' + v + '" aria-pressed="false">' + VIEW_NAME[v] + '</button>'; }).join('') + '</div>' : '') +
          '<div class="el-slot"></div>' +
        '</div>' +
        '<div class="el-say"></div>' +
        '<div class="el-det"></div>' +
        T.moreHtml('<div class="el-more"></div>') +
        '<p class="sr-only el-live"></p>' +
      '</section>';
    var card = host.querySelector('.el-card');
    card.insertBefore(cue.el, card.querySelector('.el-say'));
    var svg = host.querySelector('.el-svg'), wrap = host.querySelector('.el-plotwrap'), under = host.querySelector('.el-under'), slot = host.querySelector('.el-slot'), moreEl = host.querySelector('.el-more');
    var say = T.announcer(host.querySelector('.el-live')), G = null, handle = null, lastCap = '';
    function $(s){ return host.querySelector(s) || (LS ? LS.root.querySelector(s) : null); }
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }
    function pause(){ if(anim){ anim.stop(); anim = null; } }
    var viewsEl = host.querySelector('.el-views');
    if(viewsEl) viewsEl.addEventListener('click', function(e){ var b = e.target.closest('.bt-mode'); if(b && b.getAttribute('data-v') !== st.view){ touch(); setView(b.getAttribute('data-v')); say(VIEW_NAME[st.view] + ' view.'); } });

    function seg(label, items, cur, on){
      var d = document.createElement('div'); d.className = 'ls-seg el-seg'; d.setAttribute('role', 'group'); d.setAttribute('aria-label', label);
      d.innerHTML = items.map(function(it){ return '<button type="button" class="bt-mode" data-k="' + it[0] + '" aria-pressed="' + (it[0] === cur) + '">' + esc(it[1]) + '</button>'; }).join('');
      d.addEventListener('click', function(e){ var b = e.target.closest('.bt-mode'); if(!b) return; d.querySelectorAll('.bt-mode').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); }); touch(); on(b.getAttribute('data-k')); });
      return d;
    }
    function controls(){
      slot.innerHTML = ''; moreEl.innerHTML = '';
      var add = function(el){ slot.appendChild(el.el || el); }, more = function(el){ moreEl.appendChild(el.el || el); };
      if(st.view === 'ratios'){
        add(T.slider({ label: 'Growth factor b', min: 0.5, max: 2.5, step: 0.05, value: st.b, decimals: 2, onInput: function(v){ st.b = v; touch(); draw(true); } }));
        add(T.slider({ label: 'Rate m (added per step)', min: -2, max: 8, step: 0.5, value: st.m, decimals: 1, onInput: function(v){ st.m = v; touch(); draw(true); } }));
        more(T.slider({ label: 'Starting value a', min: 1, max: 10, step: 1, value: st.a, decimals: 0, onInput: function(v){ st.a = v; touch(); draw(true); } }));
      } else if(st.view === 'inverse'){
        add(T.slider({ label: 'Base b', min: 0.3, max: 4, step: 0.05, value: st.ib, decimals: 2, onInput: function(v){ if(Math.abs(v - 1) < 0.04) v = v < 1 ? 0.95 : 1.05; st.ib = v; touch(); st.fold = 0; pause(); draw(true); } }));
        var rb = document.createElement('div'); rb.className = 'el-row';
        rb.innerHTML = '<button type="button" class="bt-btn el-fold">Reflect in y = x</button>';
        rb.querySelector('.el-fold').addEventListener('click', function(){ touch(); fold(); });
        add(rb);
        more(T.slider({ label: 'The point\'s x on y = b^x', min: -2, max: 2.5, step: 0.05, value: st.t, decimals: 2, onInput: function(v){ st.t = v; touch(); draw(true); } }));
      } else if(st.view === 'rules'){
        add(seg('Rule', [['product', 'Product'], ['quotient', 'Quotient'], ['power', 'Power']], st.rule, function(k){ st.rule = k; controls(); draw(true); }));
        add(T.slider({ label: 'u', min: 0.5, max: 8, step: 0.5, value: st.u, decimals: 1, onInput: function(v){ st.u = v; touch(); draw(true); } }));
        if(st.rule === 'power') add(T.slider({ label: 'Exponent k', min: -2, max: 4, step: 1, value: st.kp, decimals: 0, onInput: function(v){ st.kp = v; touch(); draw(true); } }));
        else add(T.slider({ label: 'v', min: 0.5, max: 8, step: 0.5, value: st.v, decimals: 1, onInput: function(v){ st.v = v; touch(); draw(true); } }));
        more(seg('Base of the logarithm', [['2', 'base 2'], ['3', 'base 3'], ['10', 'base 10'], ['e', 'base e']], String(st.rb), function(k){ st.rb = k === 'e' ? 'e' : +k; draw(true); }));
      } else {
        add(seg('Vertical axis', [['0', 'y'], ['1', 'log₁₀ y']], String(st.logy ? 1 : 0), function(k){ morph(+k); }));
        var chips = document.createElement('div'); chips.className = 'el-chips ls-scroll'; chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Data set');
        chips.innerHTML = sets.map(function(id){ return '<button type="button" class="bt-btn el-chip" data-id="' + id + '" aria-pressed="' + (id === st.set) + '">' + esc(EL.DATASETS[id].name) + '</button>'; }).join('');
        chips.addEventListener('click', function(e){ var b = e.target.closest('.el-chip'); if(!b) return; touch(); st.set = b.getAttribute('data-id'); chips.querySelectorAll('.el-chip').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); }); draw(true); });
        add(chips);
      }
      if(!moreEl.children.length) moreEl.innerHTML = '<p class="bt-small">No more settings in this view.</p>';
    }
    function setView(v){
      pause(); st.view = v; st.fold = 0;
      if(viewsEl) viewsEl.querySelectorAll('.bt-mode').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); });
      controls(); draw(true);
    }
    function fold(){
      pause();
      var from = st.fold >= 0.5 ? 1 : 0, to = 1 - from;
      anim = P.loop(function(dt, t){ var s = Math.min(1, t / 1.3), e = s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2; st.fold = from + (to - from) * e; draw(false); if(s >= 1) return false; },
        { duration: 1.3, still: function(){ st.fold = to; draw(true); }, onEnd: function(){ st.fold = to; anim = null; draw(true); } });
      anim.start();
    }
    function morph(to){
      pause(); var from = st.logy;
      anim = P.loop(function(dt, t){ var s = Math.min(1, t / 1.1); st.logy = from + (to - from) * (s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2); draw(false); if(s >= 1) return false; },
        { duration: 1.1, still: function(){ st.logy = to; draw(true); }, onEnd: function(){ st.logy = to; anim = null; draw(true); } });
      anim.start();
    }

    /* ---------------------------------------------- the four scenes */
    function drawRatios(w, h){
      var rows = EL.table(st.a, st.m, st.b, 6, 1), vals = [];
      rows.forEach(function(r){ vals.push(r.L, r.E); });
      var hi = niceUp(Math.max.apply(null, vals) * 1.08), lo = Math.min(0, Math.min.apply(null, vals)); lo = lo < 0 ? -niceUp(-lo * 1.1) : 0;
      G = frameOf(w, h, [0, 6.3], [lo, hi]);
      var o = [axes(G, { nx: 7, xLabel: 'x' })], k = st.k, r0 = rows[k - 1], r = rows[k];
      // the chosen step: a band across both graphs
      o.push('<rect class="el-band" x="' + r1(G.sx(k - 1)) + '" y="' + r1(G.T) + '" width="' + r1(G.sx(k) - G.sx(k - 1)) + '" height="' + r1(G.B - G.T) + '"/>');
      o.push(path(G, function(x){ return st.a + st.m * x; }, 0, 6.3, 'el-curve el-L'));
      o.push(path(G, function(x){ return st.a * Math.pow(st.b, x); }, 0, 6.3, 'el-curve el-E'));
      rows.forEach(function(q){ o.push(dot(G, q.x, q.L, 'el-pt el-L', q.x === k || q.x === k - 1 ? 5.5 : 4)); o.push(dot(G, q.x, q.E, 'el-pt el-E', q.x === k || q.x === k - 1 ? 5.5 : 4)); });
      // the step itself: rise of L (+m) and of E (×b)
      var riseY = [];
      [['L', r0.L, r.L, (st.m >= 0 ? '+' : '') + g3(st.m)], ['E', r0.E, r.E, '×' + g3(st.b)]].forEach(function(s, i){
        if(Math.max(s[1], s[2]) < G.y[0] || Math.min(s[1], s[2]) > G.y[1]) return;
        var x = G.sx(k) + (i ? 7 : -7), y1 = G.sy(s[1]), y2 = G.sy(s[2]);
        o.push('<line class="el-rise el-' + s[0] + '" x1="' + r1(G.sx(k - 1)) + '" y1="' + r1(y1) + '" x2="' + r1(x) + '" y2="' + r1(y1) + '"/><line class="el-rise el-' + s[0] + '" x1="' + r1(x) + '" y1="' + r1(y1) + '" x2="' + r1(x) + '" y2="' + r1(y2) + '"/>');
        var ly = (y1 + y2) / 2 + 4;
        riseY.push(ly);
        o.push('<text class="el-lab el-' + s[0] + '" x="' + r1(x + (i ? 6 : -6)) + '" y="' + r1(ly) + '" text-anchor="' + (i ? 'start' : 'end') + '">' + mn(s[3]) + '</text>');
      });
      var t = st.b > 1 ? EL.overtake(st.a, st.m, st.b) : null;
      if(t && t <= 6.3){ o.push(dot(G, t, st.a + st.m * t, 'el-pass', 6)); 
        // lift the note clear of the step labels when the crossing is beside the chosen step
        var py = G.sy(st.a + st.m * t) - 8, lift = 0;
        riseY.forEach(function(yy){ if(Math.abs(G.sx(t) - G.sx(k)) < 120 && py - lift > yy - 30 && py - lift < yy + 16) lift = Math.max(lift, py - (yy - 30)); });
        o.push(label(G, t, st.a + st.m * t, 'E passes L', 'el-E', t > 4.5 ? 'end' : 'start', t > 4.5 ? -8 : 8, -8 - lift)); }
      o.push(label(G, 6.25, st.a + st.m * 6.25, 'L', 'el-L el-name', 'end', -4, -8), label(G, st.b > 1 ? Math.min(6.25, Math.log(G.y[1] * 0.97 / st.a) / Math.log(st.b) || 6.25) : 6.25 /* a decaying E has its name at the right end, not off the left edge */, Math.min(G.y[1] * 0.97, st.a * Math.pow(st.b, 6.25)), 'E', 'el-E el-name', 'end', -6, st.b > 1 ? 4 : -9));
      svg.innerHTML = o.join('');
      svg.setAttribute('aria-label', 'Graph of L(x) = ' + st.a + ' + ' + st.m + 'x and E(x) = ' + st.a + ' times ' + st.b + ' to the x, for x from 0 to 6. Step from x = ' + (k - 1) + ' to ' + k + ': L goes from ' + g3(r0.L) + ' to ' + g3(r.L) + ', E from ' + g3(r0.E) + ' to ' + g3(r.E) + '.');
      // the step table, linked to the graph by colour and by the chosen column
      var head = '<tr><th scope="row">$x$</th>' + rows.map(function(q){ return '<th scope="col" data-k="' + q.x + '"' + (q.x === k ? ' class="is-on"' : '') + '>' + q.x + '</th>'; }).join('') + '</tr>';
      var rowL = '<tr class="el-L"><th scope="row">$L(x)$</th>' + rows.map(function(q){ return '<td data-k="' + q.x + '"' + (q.x === k ? ' class="is-on"' : '') + '>' + g3(q.L) + (q.dL != null ? '<small>' + (q.dL >= 0 ? '+' : '') + mn(g3(q.dL)) + '</small>' : '') + '</td>'; }).join('') + '</tr>';
      var rowE = '<tr class="el-E"><th scope="row">$E(x)$</th>' + rows.map(function(q){ return '<td data-k="' + q.x + '"' + (q.x === k ? ' class="is-on"' : '') + '>' + g3(q.E) + (q.rE != null ? '<small>×' + g3(q.rE) + '</small>' : '') + '</td>'; }).join('') + '</tr>';
      under.innerHTML = '<div class="table-wrap el-steps" tabindex="0" role="region" aria-label="Step table"><table class="el-tbl"><caption class="sr-only">L and E at each x, with each step\'s change</caption><thead>' + tx(head) + '</thead><tbody>' + tx(rowL) + tx(rowE) + '</tbody></table></div>';
      // pass 2: one short line; the graph and the table already show each step's change, so no chips repeat it
      return { head: 'Every step of $x$: $L$ adds ' + mn(g3(st.m)) + ', $E$ multiplies by ' + g3(st.b) + '.',
        pills: [],
        why: '<p>Over equal steps of $x$, a <b>linear</b> function changes by equal <b>differences</b> and an <b>exponential</b> function by equal <b>ratios</b>. Say both halves, with the numbers: "equal steps of $x$; outputs ' + (st.b >= 1 ? 'multiplied' : 'multiplied') + ' by ' + g3(st.b) + ' each step".</p>' +
          (st.b > 1 ? '<p>Any exponential with $b > 1$ eventually passes any linear function: the line adds the same amount each step, while the exponential adds more each step, because it multiplies a bigger number.' + (t ? ' Here $E$ passes $L$ at $x \\approx ' + M.fixed(t, 3) + '$.' : '') + '</p>' : st.b < 1 ? '<p>With $0 < b < 1$ the ratio is less than 1: $E$ decays toward 0, by the same factor each step.</p>' : ''),
        det: '<h3 class="ls-title-l">The two functions</h3><p>' + tm('L(x) = ' + st.a + (st.m < 0 ? ' - ' + g3(-st.m) : ' + ' + g3(st.m)) + 'x') + '</p><p>' + tm('E(x) = ' + st.a + ' \\cdot ' + g3(st.b) + '^{x}') + '</p>' +
          '<table class="ls-tbl"><caption class="sr-only">Differences and ratios</caption><thead><tr><th scope="col">Step</th><th scope="col" class="r">L difference</th><th scope="col" class="r">E difference</th><th scope="col" class="r">E ratio</th></tr></thead><tbody>' +
          rows.slice(1).map(function(q){ return '<tr' + (q.x === k ? ' class="hl"' : '') + '><td>' + (q.x - 1) + ' to ' + q.x + '</td><td class="r">' + mn(g3(q.dL)) + '</td><td class="r">' + mn(g3(q.dE)) + '</td><td class="r">' + g3(q.rE) + '</td></tr>'; }).join('') + '</tbody></table>' +
          '<p class="bt-small">The differences of E are not constant (they grow when b > 1), but its ratios are.</p>' };
    }
    function drawInverse(w, h){
      var b = st.ib, lo = -2.5, hi = 6;
      G = frameOf(w, h, [lo, hi], [lo, hi], { square: true });
      var o = [axes(G, { nx: 8, ny: 8 })], s = st.fold;
      o.push('<line class="el-mirror" x1="' + r1(G.sx(lo)) + '" y1="' + r1(G.sy(lo)) + '" x2="' + r1(G.sx(hi)) + '" y2="' + r1(G.sy(hi)) + '"/>');
      o.push(label(G, hi - 0.2, hi - 0.2, 'y = x', 'el-muted', 'end', -2, 14));
      o.push(path(G, function(x){ return Math.log(x) / Math.log(b); }, 1e-4, hi, 'el-curve el-L', 400));
      // y = b^x stays put; when s > 0 a dashed copy of it folds over y = x and lands on the log curve.
      // Everything is clipped to the plot, so the part of b^x above the frame never folds into view as a stub.
      var cid = 'el-clip-' + (G.L | 0) + '-' + (G.T | 0);
      o.push('<defs><clipPath id="' + cid + '"><rect x="' + r1(G.L) + '" y="' + r1(G.T) + '" width="' + r1(G.R - G.L) + '" height="' + r1(G.B - G.T) + '"/></clipPath></defs>');
      function expPath(sf, cls){
        var d = '';
        for(var i = 0; i <= 260; i++){ var x = lo - 0.5 + (hi - lo + 1) * i / 260, y = Math.pow(b, x); if(y > hi + 8){ continue; } var px = (1 - sf) * x + sf * y, py = (1 - sf) * y + sf * x; d += (d ? 'L' : 'M') + r1(G.sx(px)) + ' ' + r1(G.sy(py)); }
        return '<path class="' + cls + '" clip-path="url(#' + cid + ')" d="' + d + '"/>';
      }
      o.push(expPath(0, 'el-curve el-E' + (s > 0.02 ? ' el-src' : '')));
      if(s > 0.02) o.push(expPath(s, 'el-curve el-E el-folded'));
      var t = st.t, q = Math.pow(b, t), inP = q <= hi && q >= lo, still = s < 0.02 || s > 0.98;
      if(inP){
        if(still){
          o.push('<line class="el-swap" x1="' + r1(G.sx(t)) + '" y1="' + r1(G.sy(q)) + '" x2="' + r1(G.sx(q)) + '" y2="' + r1(G.sy(t)) + '"/>');
          o.push(dot(G, q, t, 'el-pt el-L', 6));
          o.push(label(G, q, t, '(' + f2(q) + ', ' + f2(t) + ')', 'el-L', 'start', 9, 16));
          o.push(label(G, t, q, '(' + f2(t) + ', ' + f2(q) + ')', 'el-E', 'end', -9, -8));
        } else o.push(dot(G, (1 - s) * t + s * q, (1 - s) * q + s * t, 'el-pt el-E el-moving', 6));   // the point riding on the folding copy
      }
      o.push(label(G, hi - 0.15, Math.log(hi - 0.15) / Math.log(b), 'y = ' + logName(b) + ' x', 'el-L el-name', 'end', 0, b > 1 ? -8 : 16));
      var ex = Math.min(hi - 0.3, Math.log(hi * 0.85) / Math.log(b));
      if(still) o.push(label(G, b > 1 ? ex : -ex, Math.pow(b, b > 1 ? ex : -ex), 'y = ' + g3(b) + 'ˣ', 'el-E el-name', b > 1 ? 'end' : 'start', b > 1 ? -8 : 8, 0));
      svg.innerHTML = o.join('');
      svg.setAttribute('role', 'group');
      if(!handle || !handle.el.isConnected){
        handle = P.draggable(svg, liveFrame, { x: t, y: q, step: 0.05, label: 'Point on y = b to the x: arrow keys move it along the curve',
          constrain: function(nx){ var x = Math.max(-2, Math.min(2.5, Math.round(nx * 20) / 20)); return [x, Math.pow(st.ib, x)]; },
          onMove: function(nx){ st.t = nx; touch(); draw(false); }, onEnd: function(){ draw(true); } });
        handle.el.classList.add('el-handle');
      } else svg.appendChild(handle.el);
      handle.el.style.display = still && inP ? '' : 'none';
      handle.set(t, q, true);
      handle.el.setAttribute('aria-valuemin', '-2'); handle.el.setAttribute('aria-valuemax', '2.5'); handle.el.setAttribute('aria-valuetext', 'point (' + f2(t) + ', ' + f2(q) + '); its mirror is (' + f2(q) + ', ' + f2(t) + ')');
      svg.setAttribute('aria-label', 'Graphs of y = ' + g3(b) + ' to the x and y = log base ' + g3(b) + ' of x, mirror images in y = x.');
      under.innerHTML = '<p class="el-swapline"><span class="el-chip-c el-E">' + tm('(' + f2(t) + ',\\ ' + f2(q) + ')') + ' on ' + tm('y = ' + g3(b) + '^{x}') + '</span><span class="el-arrow" aria-hidden="true">⇄</span><span class="el-chip-c el-L">' + tm('(' + f2(q) + ',\\ ' + f2(t) + ')') + ' on ' + tm('y = \\log_{' + g3(b) + '} x') + '</span></p>';
      return { head: 'The point $(' + f2(t) + ', ' + f2(q) + ')$ on $y = ' + g3(b) + '^x$ becomes $(' + f2(q) + ', ' + f2(t) + ')$ on $y = \\log_{' + g3(b) + '} x$: inputs and outputs swap.',
        pills: [{ k: 'b', html: g3(b), tone: 'readout' }, { k: 'log', html: ' ' + mn(f2(t)), tone: 'readout' }],
        why: '<p>$y = \\log_b x$ means $b^y = x$: the log undoes the exponential, so its graph is the reflection of $y = b^x$ in the line $y = x$. Every point $(a, c)$ becomes $(c, a)$.</p><p>So the domain of $\\log_b x$ is the range of $b^x$, all $x > 0$, and $y = b^x$\'s horizontal asymptote $y = 0$ becomes the vertical asymptote $x = 0$ of the log: $\\lim_{x \\to 0^+} \\log_b x = ' + (b > 1 ? '-\\infty' : '\\infty') + '$.</p>' +
          (b < 1 ? '<p>With $0 < b < 1$ both graphs decrease.</p>' : ''),
        det: '<h3 class="ls-title-l">Matching points</h3><table class="ls-tbl"><caption class="sr-only">Points on both graphs</caption><thead><tr><th scope="col">' + tm('x') + '</th><th scope="col" class="r">' + tm(g3(b) + '^{x}') + '</th><th scope="col">On the log graph</th></tr></thead><tbody>' +
          [-2, -1, 0, 1, 2].map(function(x){ return '<tr><td>' + x + '</td><td class="r">' + g3(Math.pow(b, x)) + '</td><td>(' + g3(Math.pow(b, x)) + ', ' + mn(x) + ')</td></tr>'; }).join('') + '</tbody></table>' };
    }
    var liveFrame = { x: [-2.5, 6], sx: function(v){ return G.sx(v); }, sy: function(v){ return G.sy(v); }, ix: function(v){ return G.ix(v); }, iy: function(v){ return G.iy(v); } };
    function drawRules(w, h){
      var b = st.rb === 'e' ? Math.E : st.rb, bt = st.rb === 'e' ? 'e' : String(st.rb), u = st.u, v = st.rule === 'power' ? st.kp : st.v;
      var R = EL.rule(st.rule, b, u, v), arg = R.arg, xs = [u, arg].concat(st.rule === 'power' ? [] : [v]), lg = function(x){ return Math.log(x) / Math.log(b); };
      var xmax = niceUp(Math.max.apply(null, xs) * 1.12), ys = xs.map(lg).concat([0, R.lhs]), ylo = Math.min.apply(null, ys), yhi = Math.max.apply(null, ys);
      var pad = Math.max(0.6, (yhi - ylo) * 0.15);
      G = frameOf(w, h, [0, xmax], [Math.min(-0.5, ylo - pad), yhi + pad]);
      var o = [axes(G, { xLabel: 'x' })], bw = G.phone ? 7 : 9;
      o.push(path(G, lg, xmax * 1e-4, xmax, 'el-curve el-log', 400));
      function bar(x, y0, y1, cls, dx){ var px = G.sx(x) + (dx || 0); return '<rect class="el-bar ' + cls + '" x="' + r1(px - bw / 2) + '" y="' + r1(Math.min(G.sy(y0), G.sy(y1))) + '" width="' + bw + '" height="' + r1(Math.max(1, Math.abs(G.sy(y1) - G.sy(y0)))) + '" rx="2"/>'; }
      var lu = lg(u), lv = st.rule === 'power' ? 0 : lg(v);
      o.push(bar(u, 0, lu, 'el-u'), label(G, u, lu, 'log ' + g3(u), 'el-u', 'middle', 0, lu >= 0 ? -8 : 16));
      if(st.rule !== 'power') o.push(bar(v, 0, lv, 'el-v'), label(G, v, lv, 'log ' + g3(v), 'el-v', 'middle', 0, lv >= 0 ? -8 : 16));
      // at the result: the true height, and beside it the pieces stacked
      o.push(bar(arg, 0, R.lhs, 'el-r', -bw * 0.7));
      if(st.rule === 'product'){ o.push(bar(arg, 0, lu, 'el-u', bw * 0.7), bar(arg, lu, lu + lv, 'el-v', bw * 0.7)); }
      else if(st.rule === 'quotient'){ o.push(bar(arg, 0, lu, 'el-u is-ghost', bw * 0.7), bar(arg, lu, lu - lv, 'el-v is-minus', bw * 0.7)); }
      else { for(var i = 0; i < Math.abs(v); i++){ var s0 = Math.sign(v) * i * lu; o.push(bar(arg, s0, s0 + Math.sign(v) * lu, 'el-u is-copy', bw * 0.7)); } }
      o.push(dot(G, arg, R.lhs, 'el-pt el-r', 5));
      o.push(label(G, arg, R.lhs, 'log ' + g3(arg), 'el-r', arg > xmax * 0.7 ? 'end' : 'start', arg > xmax * 0.7 ? -14 : 14, R.lhs >= 0 ? -6 : 14));
      svg.innerHTML = o.join('');
      svg.setAttribute('aria-label', 'Graph of y = log base ' + bt + ' of x with bars at x = ' + g3(u) + (st.rule !== 'power' ? ', ' + g3(v) : '') + ' and ' + g3(arg) + '; the bar at ' + g3(arg) + ' equals the stacked bars.');
      var L = '\\log_{' + bt + '}', eqs = { product: L + '(' + g3(u) + ' \\cdot ' + g3(v) + ') = ' + L + ' ' + g3(u) + ' + ' + L + ' ' + g3(v),
        quotient: L + '\\left(\\frac{' + g3(u) + '}{' + g3(v) + '}\\right) = ' + L + ' ' + g3(u) + ' - ' + L + ' ' + g3(v), power: L + '(' + g3(u) + '^{' + v + '}) = ' + v + ' \\cdot ' + L + ' ' + g3(u) };
      var nums = st.rule === 'product' ? f3(lu) + ' + ' + f3(lv) + ' = ' + f3(R.rhs) : st.rule === 'quotient' ? f3(lu) + ' - ' + f3(lv) + ' = ' + f3(R.rhs) : v + ' \\cdot ' + f3(lu) + ' = ' + f3(R.rhs);
      under.innerHTML = '<p class="el-eq">' + tm(eqs[st.rule]) + '</p><p class="el-eq el-eq-n">' + tm(nums.replace(/−/g, '-')) + '</p>';
      var trap = st.rule === 'product' ? '<p><b>The trap:</b> $' + L + '(u + v)$ is not $' + L + ' u + ' + L + ' v$. Here $' + L + '(' + g3(u) + ' + ' + g3(v) + ') = ' + f3(lg(u + v)) + '$, not $' + f3(lu + lv) + '$.</p>'
        : st.rule === 'quotient' ? '<p><b>The trap:</b> $\\frac{' + L + ' u}{' + L + ' v}$ is not $' + L + '\\frac{u}{v}$. Here $\\frac{' + f3(lu) + '}{' + f3(lv) + '}$' + (Math.abs(lv) > 1e-9 ? ' $= ' + f3(lu / lv) + '$' : ' is not even defined') + ', not $' + f3(R.lhs) + '$.</p>'
        : '<p><b>The trap:</b> $' + L + '(u^k)$ is $k ' + L + ' u$, not $(' + L + ' u)^k$. Here $(' + f3(lu) + ')^{' + v + '} = ' + f3(Math.pow(lu, v)) + '$, not $' + f3(R.lhs) + '$.</p>';
      return { head: '$' + eqs[st.rule] + '$: ' + (st.rule === 'product' ? 'the bar at ' + g3(arg) + ' is as tall as the bars at ' + g3(u) + ' and ' + g3(v) + ' stacked.' : st.rule === 'quotient' ? 'the bar at ' + g3(arg) + ' is the bar at ' + g3(u) + ' minus the bar at ' + g3(v) + '.' : 'the bar at ' + g3(arg) + ' is ' + Math.abs(v) + ' copies of the bar at ' + g3(u) + (v < 0 ? ', pointing the other way.' : '.')),
        pills: [{ k: 'rule', html: { product: 'product', quotient: 'quotient', power: 'power' }[st.rule], tone: 'readout' }, { k: 'value', html: f3(R.lhs), tone: 'readout' }],
        why: '<p>A logarithm turns multiplying into adding: $b^p \\cdot b^q = b^{p + q}$, so the exponents (the logs) add. Dividing subtracts them, and a power multiplies them.</p>' + trap,
        det: '<h3 class="ls-title-l">The numbers</h3><table class="ls-tbl"><caption class="sr-only">Logs of the inputs</caption><tbody><tr><th scope="row">' + tm(L + ' ' + g3(u)) + '</th><td class="r">' + f3(lu) + '</td></tr>' + (st.rule !== 'power' ? '<tr><th scope="row">' + tm(L + ' ' + g3(v)) + '</th><td class="r">' + f3(lv) + '</td></tr>' : '') + '<tr class="hl"><th scope="row">' + tm(L + ' ' + g3(arg)) + '</th><td class="r">' + f3(R.lhs) + '</td></tr></tbody></table>' };
    }
    function drawSemi(w, h){
      var d = EL.DATASETS[st.set], F = EL.fit(d.pts), s = st.logy, xs = d.pts.map(function(p){ return p[0]; });
      var ymax = Math.max.apply(null, d.pts.map(function(p){ return p[1]; })), lmin = Math.floor(Math.min.apply(null, d.pts.map(function(p){ return Math.log10(p[1]); }))), lmax = Math.ceil(Math.log10(ymax * 1.05) * 2) / 2;
      // vertical position: blend of y (linear axis) and log10 y (log axis), each scaled to 0..1
      var Y1 = niceUp(ymax * 1.08), yl = function(y){ return y / Y1; }, ll = function(y){ return (Math.log10(y) - lmin) / (lmax - lmin); };
      var pos = function(y){ return (1 - s) * yl(y) + s * ll(y); };
      var xm = niceUp(Math.max.apply(null, xs) * 1.05);
      G = frameOf(w, h, [0, xm], [0, 1], { L: w < 420 ? 44 : 54 });
      var tickY = s < 0.5 ? P.ticks(0, Y1, G.phone ? 4 : 5).map(function(v){ return [yl(v), mn(+v.toPrecision(6))]; }) : P.ticks(lmin, lmax, 5).map(function(v){ return [(v - lmin) / (lmax - lmin), mn(+v.toPrecision(4))]; });
      var o = [], xt = P.ticks(0, xm, G.phone ? 5 : 8);
      o.push('<rect class="el-bg" x="' + r1(G.L) + '" y="' + r1(G.T) + '" width="' + r1(G.R - G.L) + '" height="' + r1(G.B - G.T) + '" rx="8"/>');
      o.push('<g class="el-grid">' + xt.map(function(v){ return '<line x1="' + r1(G.sx(v)) + '" y1="' + r1(G.T) + '" x2="' + r1(G.sx(v)) + '" y2="' + r1(G.B) + '"/>'; }).join('') + tickY.map(function(t){ return '<line x1="' + r1(G.L) + '" y1="' + r1(G.sy(t[0])) + '" x2="' + r1(G.R) + '" y2="' + r1(G.sy(t[0])) + '"/>'; }).join('') + '</g>');
      o.push('<g class="el-axis"><line x1="' + r1(G.L) + '" y1="' + r1(G.B) + '" x2="' + r1(G.R) + '" y2="' + r1(G.B) + '"/><line x1="' + r1(G.L) + '" y1="' + r1(G.T) + '" x2="' + r1(G.L) + '" y2="' + r1(G.B) + '"/></g>');
      o.push('<g class="el-tk">' + xt.map(function(v){ return '<text x="' + r1(G.sx(v)) + '" y="' + r1(G.B + 15) + '" text-anchor="middle">' + mn(v) + '</text>'; }).join('') + tickY.map(function(t){ return '<text x="' + r1(G.L - 5) + '" y="' + r1(G.sy(t[0]) + 4) + '" text-anchor="end"' + (Math.abs(s - 0.5) < 0.3 ? ' opacity="' + M.fixed(Math.abs(s - 0.5) / 0.3, 2) + '"' : '') + '>' + t[1] + '</text>'; }).join('') +
        '<text class="el-axl" x="' + r1(G.R - 2) + '" y="' + r1(G.B - 6) + '" text-anchor="end">' + esc(d.xLabel) + '</text><text class="el-axl" x="' + r1(G.L + 6) + '" y="' + r1(G.T + 14) + '">' + esc(s < 0.5 ? d.yLabel : 'log₁₀ of ' + d.yLabel) + '</text></g>');
      // the fitted model, drawn in the same blend
      var fx = function(x){ return F.a * Math.pow(F.b, x); }, pts = [];
      for(var i = 0; i <= 120; i++){ var x = xm * i / 120, y = fx(x); if(y > 0){ var p = pos(y); if(p <= 1.05 && p >= -0.05) pts.push(r1(G.sx(x)) + ' ' + r1(G.sy(p))); } }
      o.push('<path class="el-curve el-fit" d="M' + pts.join('L') + '"/>');
      d.pts.forEach(function(p){ o.push('<circle class="el-pt el-data" cx="' + r1(G.sx(p[0])) + '" cy="' + r1(G.sy(pos(p[1]))) + '" r="5"/>'); });
      svg.innerHTML = o.join('');
      svg.setAttribute('aria-label', d.name + ' plotted with ' + (s > 0.5 ? 'log base 10 of y' : 'y') + ' on the vertical axis' + (s > 0.5 ? (Math.abs(F.r) > 0.995 ? ': the points lie on a line.' : ': the points still curve.') : '.'));
      var straight = Math.abs(F.r) > 0.995;
      under.innerHTML = '<p class="el-eq">' + (s > 0.5 ? tm('\\log_{10} y \\approx ' + M.fixed(F.c, 3) + (F.m < 0 ? ' - ' + M.fixed(-F.m, 3) : ' + ' + M.fixed(F.m, 3)) + 'x') : tm('y \\approx ' + M.fixed(F.a, 3) + ' \\cdot ' + M.fixed(F.b, 3) + '^{x}')) + '</p>';
      return { head: s > 0.5 ? (straight ? 'On the semi-log plot the points line up: slope ' + f3(F.m) + ' $= \\log_{10} b$, so $b \\approx ' + f3(F.b) + '$; intercept ' + f3(F.c) + ' $= \\log_{10} a$, so $a \\approx ' + f3(F.a) + '$.' : 'On the semi-log plot these points still bend: the data are not exponential (here they are linear).')
          : 'Plotted as they are, ' + (st.set === 'linear' ? 'these points lie close to a line.' : 'these points curve: ' + (F.b > 1 ? 'growth' : 'decay') + ' by about the same factor each step.') + ' Switch the vertical axis to $\\log_{10} y$.',
        pills: [{ k: 'a', html: f3(F.a), tone: 'readout' }, { k: 'b', html: f3(F.b), tone: 'readout' }].concat(G.phone ? [] : [{ k: 'r (log y)', html: f3(F.r), tone: 'readout' }]),
        why: '<p>If $y = a \\cdot b^x$, then $\\log_{10} y = \\log_{10} a + x \\log_{10} b$. Against $x$ that is a line: slope $\\log_{10} b$, intercept $\\log_{10} a$. So exponential data look straight on a semi-log plot, and a straight semi-log plot means an exponential model fits.</p><p>To get the model back, undo the log: $b = 10^{\\text{slope}}$ and $a = 10^{\\text{intercept}}$. Keep every digit until the end (three decimals).</p>',
        det: '<h3 class="ls-title-l">' + esc(d.name) + '</h3><table class="ls-tbl"><caption class="sr-only">The data and their logs</caption><thead><tr><th scope="col">' + esc(d.xLabel) + '</th><th scope="col" class="r">y</th><th scope="col" class="r">log₁₀ y</th></tr></thead><tbody>' +
          d.pts.map(function(p){ return '<tr><td>' + p[0] + '</td><td class="r">' + p[1] + '</td><td class="r">' + M.fixed(Math.log10(p[1]), 3) + '</td></tr>'; }).join('') + '</tbody></table>' +
          '<p>Least squares on $\\log_{10} y$: slope $' + M.fixed(F.m, 3) + '$, intercept $' + M.fixed(F.c, 3) + '$, $r = ' + M.fixed(F.r, 3) + '$; model $y = ' + M.fixed(F.a, 3) + ' \\cdot ' + M.fixed(F.b, 3) + '^x$.</p>' };
    }
    function draw(full){
      var sz = sizeOf(wrap, 600, 360), w = sz[0], h = sz[1];
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      if(st.view !== 'inverse' && handle && handle.el.parentNode) handle.el.parentNode.removeChild(handle.el);
      if(st.view !== 'inverse') svg.setAttribute('role', 'img');
      var r = st.view === 'ratios' ? drawRatios(w, h) : st.view === 'inverse' ? drawInverse(w, h) : st.view === 'rules' ? drawRules(w, h) : drawSemi(w, h);
      card.setAttribute('data-view', st.view); if(LS) LS.root.setAttribute('data-el-view', st.view);
      T.explain($('.el-say'), tx(r.head), tx(r.why));
      $('.el-det').innerHTML = tx(r.det);
      if(LS){ if(r.head !== lastCap){ LS.caption(tx(r.head), 'explore'); lastCap = r.head; } LS.pills(r.pills, 'left', 'explore'); }
      if(full){ var dd = document.createElement('div'); dd.innerHTML = tx(r.head); say(T.plainText(dd)); }
    }
    // tap a step on the graph or the table
    svg.addEventListener('click', function(e){
      if(st.view !== 'ratios' || !G) return;
      var b = svg.getBoundingClientRect(), x = G.ix((e.clientX - b.left) * G.w / b.width), k = Math.max(1, Math.min(6, Math.ceil(x)));
      if(k !== st.k){ st.k = k; touch(); draw(true); }
    });
    under.addEventListener('click', function(e){ var c = e.target.closest('[data-k]'); if(!c) return; var k = Math.max(1, +c.getAttribute('data-k')); if(k !== st.k){ st.k = k; touch(); draw(true); } });
    observe(wrap, function(){ draw(false); });
    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'pcalc-ls-stage el-ls-stage'; stage.appendChild(host.querySelector('.el-stage')); s.add('stage', stage, o);
      var dk = document.createElement('div'); dk.className = 'pcalc-ls-dock el-ls-dock'; dk.appendChild(host.querySelector('.el-ctl')); s.add('dock', dk, o);
      var why = document.createElement('div'); why.className = 'ls-sec pcalc-ls-why'; why.appendChild(cue.el); why.appendChild(host.querySelector('.el-say')); s.add('why', why, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      var det = document.createElement('div'); det.className = 'ls-sec pcalc-ls-det'; det.appendChild(host.querySelector('.el-det'));
      var more = host.querySelector('details.bt-more'); if(more){ more.open = true; more.classList.add('pcalc-ls-more'); det.appendChild(more); }
      s.add('details', det, o);
      lastCap = ''; draw(false);
      var first = slot.querySelector('input[type=range]');
      if(s.mode() === 'explore' && first) s.hint({ target: first, text: 'Move a slider: watch the table', key: 'apprecalc-exp-log-lab-slider' });
    }
    controls(); draw(false);
    return { studio: studio, pause: pause, redraw: function(){ draw(false); } };
  }

  /* ============================================================ test yourself */
  function texify(p){
    p.text = '<div class="el-ptext">' + tx(p.text) + '</div>'; p.solution = p.solution.map(tx);
    p.steps.forEach(function(s){
      s.label = tx(s.label); if(s.hint) s.hint = tx(s.hint);
      if(s.options) s.options = s.options.map(function(o){ return '<span class="el-opt">' + tx(o) + '</span>'; });
      if(s.why) s.why = s.why.map(tx);
      if(s.cell && s.cell.mistakes) s.cell.mistakes.forEach(function(m){ m.why = tx(m.why); });
    });
    return p;
  }
  var METHOD = {
    type: 'Check that the x steps are equal, then compute the differences and the ratios of the outputs. Name the one that is constant, with its value.',
    k: 'Linear: subtract consecutive outputs. Exponential: divide each output by the one before it.',
    next: 'One more step: add the difference (linear) or multiply by the ratio (exponential).',
    a: 'At x = 0, a·b⁰ = a.',
    b: 'Divide the later value by a to get bᵏ, then take the k-th root.',
    pred: 'Use the stored b (every digit) in a·bˣ; round only the final answer.',
    lx: 'Inverse functions swap coordinates: (a, c) on y = bˣ becomes (c, a) on y = log_b x.',
    ly: 'The y-coordinate on the log graph is the exponent.',
    val: 'log_b N asks: b to what power gives N?',
    pow: 'Power rule: log_b(Pᵐ) = m·log_b P.',
    comb: 'Product: add the logs. Quotient: subtract. A root is the power 1/2.',
    m: 'Slope = rise / run between the two points of the line.'
  };
  function quiz(host, data){
    var cur = null;
    T.drill(host, data, { slug: 'exp-log-lab', noun: 'drill', typeLabel: 'Problem type', textOnStage: true,
      types: EL.KINDS.map(function(k){ return { value: k, label: EL.TITLE[k] }; }),
      generate: function(r, ctx, type){ return texify(EL.generate(r, ctx, type)); },
      title: function(p){ return p.title; },
      extra: function(el, p){ cur = figure(el, p); },
      onStep: function(s){ if(cur) cur.done(s.key); },
      onTry: function(s, t){ if(!cur || t.ok || t.shown || !isFinite(t.value)) return false; return cur.yours(s.key, t.value); },
      method: function(s, p){ return p.type === 'semilog' && s.key === 'b' ? 'The slope is log₁₀ b, so b = 10^slope.' : p.type === 'semilog' && s.key === 'a' ? 'The intercept is log₁₀ a, so a = 10^intercept.' : METHOD[s.key] || ''; }
    });
  }
  /* The drill figure: the problem's points and curves, more as you answer. */
  function figure(el, p){
    if(p.type === 'rules') return null;
    var box = document.createElement('div'); box.className = 'el-figwrap';
    box.innerHTML = '<div class="el-plotwrap el-fig-plot"><svg class="el-svg" role="img"></svg></div>';
    el.appendChild(box);
    var svg = box.querySelector('svg'), wrap = box.querySelector('.el-fig-plot'), got = {}, mine = null, V = p.values;
    function draw(){
      var sz = sizeOf(wrap, 420, 260), w = sz[0], h = sz[1], o = [], G;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      if(p.type === 'table'){
        var xs = V.xs, ys = V.ys.concat([V.next]), hx = V.h, all = ys.concat(mine != null ? [mine] : []);
        var lo = Math.min(0, Math.min.apply(null, all)), hi = Math.max.apply(null, all);
        G = frameOf(w, h, [Math.max(0, xs[0] - hx), xs[3] + 1.6 * hx], [lo < 0 ? -niceUp(-lo * 1.15) : 0, niceUp(hi * 1.15)]);
        o.push(axes(G, { xLabel: 'x', yLabel: 'g(x)' }));
        if(got.type) o.push(path(G, V.lin ? function(x){ return V.ys[0] + V.k * (x - xs[0]) / hx; } : function(x){ return V.ys[0] * Math.pow(V.k, (x - xs[0]) / hx); }, G.x[0], G.x[1], 'el-curve el-E is-faint'));
        xs.forEach(function(x, i){ o.push(dot(G, x, V.ys[i], 'el-pt el-data')); if(i && got.k) o.push(label(G, (x + xs[i - 1]) / 2, (V.ys[i] + V.ys[i - 1]) / 2, V.lin ? (V.k > 0 ? '+' : '') + mn(g3(V.k)) : '×' + g3(V.k), 'el-E', 'middle', 0, -10)); });
        if(got.next) o.push(dot(G, xs[3] + hx, V.next, 'el-pt el-r', 6), label(G, xs[3] + hx, V.next, g3(V.next), 'el-r', 'end', -9, -8));
        if(mine != null) o.push(dot(G, xs[3] + hx, mine, 'el-yours', 6), label(G, xs[3] + hx, mine, 'yours', 'el-yours-t', 'start', 9, 4));
      } else if(p.type === 'model'){
        var top = Math.max(V.a, V.yk, got.pred ? V.pred : 0, mine && mine.k === 'pred' ? mine.v : 0);
        G = frameOf(w, h, [0, V.t + 1], [0, niceUp(top * 1.15)]);
        o.push(axes(G, { xLabel: 'x', yLabel: 'y' }));
        if(got.b) o.push(path(G, function(x){ return V.a * Math.pow(V.B, x); }, 0, V.t + 1, 'el-curve el-E'));
        if(mine && mine.k === 'b') o.push(path(G, function(x){ return V.a * Math.pow(mine.v, x); }, 0, V.t + 1, 'el-curve el-yours-c'));
        o.push(dot(G, 0, V.a, 'el-pt el-data'), dot(G, V.k, V.yk, 'el-pt el-data'));
        o.push(label(G, V.k, V.yk, '(' + V.k + ', ' + g3(V.yk) + ')', '', 'start', 8, -8));
        if(got.pred) o.push(dot(G, V.t, V.pred, 'el-pt el-r', 6), label(G, V.t, V.pred, g3(V.pred), 'el-r', 'end', -9, -8));
        if(mine && mine.k === 'pred') o.push(dot(G, V.t, mine.v, 'el-yours', 6), label(G, V.t, mine.v, 'yours', 'el-yours-t', 'start', 9, 4));
      } else if(p.type === 'inverse'){
        var b = V.b, lim = Math.max(4, Math.min(300, niceUp(Math.max(V.N, Math.abs(V.k)) * 1.15))), lo2 = -Math.max(3, Math.abs(V.k) + 1);
        G = frameOf(w, h, [lo2, lim], [lo2, lim], { square: true });
        o.push(axes(G, {}));
        o.push('<line class="el-mirror" x1="' + r1(G.sx(lo2)) + '" y1="' + r1(G.sy(lo2)) + '" x2="' + r1(G.sx(lim)) + '" y2="' + r1(G.sy(lim)) + '"/>');
        o.push(path(G, function(x){ return Math.pow(b, x); }, lo2, lim, 'el-curve el-E', 400));
        o.push(dot(G, V.k, V.N, 'el-pt el-E', 6));
        if(got.lx || got.ly){ o.push(path(G, function(x){ return Math.log(x) / Math.log(b); }, 1e-4, lim, 'el-curve el-L', 400)); }
        if(got.ly){ o.push('<line class="el-swap" x1="' + r1(G.sx(V.k)) + '" y1="' + r1(G.sy(V.N)) + '" x2="' + r1(G.sx(V.N)) + '" y2="' + r1(G.sy(V.k)) + '"/>', dot(G, V.N, V.k, 'el-pt el-L', 6)); }
        if(mine) o.push('<line class="el-yours-l" x1="' + r1(G.sx(mine.k === 'lx' ? mine.v : G.x[0])) + '" y1="' + r1(G.sy(mine.k === 'lx' ? G.y[0] : mine.v)) + '" x2="' + r1(G.sx(mine.k === 'lx' ? mine.v : G.x[1])) + '" y2="' + r1(G.sy(mine.k === 'lx' ? G.y[1] : mine.v)) + '"/>');
      } else {
        var y0 = V.c, y1 = V.y1, ylo = Math.min(0, y0, y1) - 0.3, yhi = Math.max(y0, y1) + 0.4;
        G = frameOf(w, h, [0, V.x1 * 1.2], [ylo, yhi], { L: w < 420 ? 40 : 48 });
        o.push(axes(G, { xLabel: 'x', yLabel: 'log₁₀ y' }));
        o.push('<line class="el-curve el-fit" x1="' + r1(G.sx(0)) + '" y1="' + r1(G.sy(y0)) + '" x2="' + r1(G.sx(V.x1 * 1.2)) + '" y2="' + r1(G.sy(y0 + V.m * V.x1 * 1.2)) + '"/>');
        o.push(dot(G, 0, y0, 'el-pt el-data', 6), dot(G, V.x1, y1, 'el-pt el-data', 6));
        o.push(label(G, V.x1, y1, '(' + V.x1 + ', ' + g3(y1) + ')', '', 'end', -8, -10));
        if(got.m){ o.push('<line class="el-rise el-E" x1="' + r1(G.sx(0)) + '" y1="' + r1(G.sy(y0)) + '" x2="' + r1(G.sx(V.x1)) + '" y2="' + r1(G.sy(y0)) + '"/><line class="el-rise el-E" x1="' + r1(G.sx(V.x1)) + '" y1="' + r1(G.sy(y0)) + '" x2="' + r1(G.sx(V.x1)) + '" y2="' + r1(G.sy(y1)) + '"/>', label(G, V.x1, (y0 + y1) / 2, 'slope ' + g3(V.m), 'el-E', 'start', 8, 4)); }
        if(got.b) o.push(label(G, V.x1 * 0.5, y0 + V.m * V.x1 * 0.5, 'b = 10^' + g3(V.m) + ' ≈ ' + f3(V.b), 'el-r', 'middle', 0, V.m > 0 ? 22 : -14));
      }
      svg.innerHTML = o.join('');
      svg.setAttribute('aria-label', p.type === 'table' ? 'The table\'s points plotted' : p.type === 'model' ? 'The two data points of the model' : p.type === 'inverse' ? 'Graph of y = ' + V.b + ' to the x with the given point' : 'The semi-log line through the two given points');
    }
    observe(wrap, draw); draw(); setTimeout(draw, 0);
    return {
      done: function(k){ got[k] = true; mine = null; draw(); },
      yours: function(k, v){
        if(p.type === 'table' && k === 'next'){ mine = v; draw(); return true; }
        if(p.type === 'model' && (k === 'pred' || k === 'b') && v > 0){ mine = { k: k, v: v }; draw(); return true; }
        if(p.type === 'inverse' && (k === 'lx' || k === 'ly')){ mine = { k: k, v: v }; draw(); return true; }
        return false;
      }
    };
  }
})();
