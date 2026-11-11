/* Rate of change (simulator, free; docs/apprecalc-spec.md section 6). OWNED BY
   THIS TOOL ONLY (builder T1, docs/apprecalc-briefs/t1.md). Model:
   ApPrecalcMath.rateOfChange (precalculus/assets/tools/math/rate-of-change.js);
   frame: ApPrecalcTools.modes and drill on the Tool Studio.

   Explore, Secants: a context's graph with secant lines over 2 to 4 equal
   intervals, each in its own color with its slope; below, the same slopes as
   bars, so you see the rates themselves rise or fall, and the verdict (the
   rate of change is increasing: concave up). Drag the start point along the
   curve, change the interval width. Explore, Estimate: drag the two ends of
   a secant and the input to estimate at; the estimate sits on the secant,
   the true value on the curve, and the gap between them is shaded and
   explained by the concavity on the interval (the Q2 reasoning).

   Test yourself: the average rate of change and what it means; estimate on a
   secant line, then over or under from concavity; concavity from a table of
   equally spaced values; the rates of a quadratic changing by 2aw. */
(function(){
  'use strict';
  var T = window.ApPrecalcTools, M = window.ApPrecalcMath, P = window.ApPrecalcPlot, X = window.ApPrecalcTex;
  (function(){
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Numbers & details');
  })();
  if(!T || !M || !M.rateOfChange || M.rateOfChange.stub || !P) return;
  var RC = M.rateOfChange, esc = T.esc, NS = 'http://www.w3.org/2000/svg';
  function html(s){ return X ? X.html(s) : s; }
  function tex(s){ return X ? X.render(s) : esc(s); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function num(v, d){ return RC.n(v, d == null ? 2 : d).replace(/^-/, '−'); }
  function sgnNum(v, d){ return (v > 0 ? '+' : '') + num(v, d); }

  T.mount('rate-of-change', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'rate-of-change',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.pause(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ============================================================ explore */
  var COLS = ['p1', 'p2', 'p3', 'p4'];
  function explore(host, data){
    var LS = null;
    var ids = (data.functions || []).map(function(f){ return f.id; }).filter(function(id){ return RC.FUNCS[id]; });
    if(!ids.length) ids = ['ball'];
    var first = ids.indexOf('ball') > -1 ? 'ball' : ids[0];
    var st = { view: 'sec', id: first, a: 0, d: 1, k: 4, p: 0, q: 0, x0: 0, touched: false };
    function Fn(){ return RC.FUNCS[st.id]; }
    function reset(){ var F = Fn(); st.a = F.start; st.d = F.d; st.k = F.nn; var s = F.dom[1] - F.dom[0]; st.p = F.dom[0] + s * 0.2; st.q = F.dom[0] + s * 0.7; st.x0 = (st.p + st.q) / 2 + s * 0.08; snapAll(); }
    function stepOf(){ var s = Fn().dom[1] - Fn().dom[0]; return s <= 5 ? 0.05 : 0.1; }
    function snapAll(){ var k = stepOf(); ['a', 'p', 'q', 'x0'].forEach(function(n){ st[n] = Math.round(st[n] / k) * k; }); }
    var cue = T.cue('Drag the first point along the curve. Watch the slopes, and the bars under the graph.');
    host.innerHTML =
      '<section class="bt-problem rc-card" aria-label="Rate of change explorer">' +
        '<div class="rc-stage">' +
          '<p class="rc-ctx"></p>' +
          '<div class="rc-graph-wrap"><svg class="rc-graph" role="group" aria-roledescription="graph"><g class="rc-plot"></g><g class="rc-handles"></g></svg></div>' +
          '<div class="rc-bars-wrap"><svg class="rc-bars" role="img"></svg></div>' +
        '</div>' +
        '<div class="rc-ctl">' +
          '<div class="rc-views ls-seg" role="group" aria-label="View"><button type="button" class="bt-mode" data-v="sec" aria-pressed="true">Secants</button><button type="button" class="bt-mode" data-v="est" aria-pressed="false">Estimate</button></div>' +
          '<div class="rc-chips ls-scroll" role="group" aria-label="Context"></div>' +
          '<div class="rc-slot"></div>' +
          '<div class="rc-nseg ls-seg" role="group" aria-label="Number of intervals"><span class="rc-nlab" aria-hidden="true">Intervals</span>' + [2, 3, 4].map(function(k){ return '<button type="button" class="bt-mode rc-n" data-k="' + k + '" aria-pressed="false" aria-label="' + k + ' intervals">' + k + '</button>'; }).join('') + '</div>' +
        '</div>' +
        '<div class="rc-say"></div>' +
        '<div class="rc-det"></div>' +
        '<p class="sr-only rc-live"></p>' +
      '</section>';
    var card = host.querySelector('.rc-card');
    card.insertBefore(cue.el, card.querySelector('.rc-say'));
    var wrap = host.querySelector('.rc-graph-wrap'), svg = host.querySelector('.rc-graph'), plot = svg.querySelector('.rc-plot'), hg = svg.querySelector('.rc-handles');
    var bwrap = host.querySelector('.rc-bars-wrap'), bars = host.querySelector('.rc-bars'), chips = host.querySelector('.rc-chips'), slot = host.querySelector('.rc-slot');
    var nseg = host.querySelector('.rc-nseg'), views = host.querySelector('.rc-views'), ctxEl = host.querySelector('.rc-ctx'), det = host.querySelector('.rc-det');
    var say = T.announcer(host.querySelector('.rc-live'));
    var V = null, slider = null;
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }

    /* ---------------------------------------------- frame */
    function layout(){
      var F = Fn(), w = Math.max(260, Math.round(wrap.clientWidth || 600)), h = Math.max(200, Math.round(wrap.clientHeight || 380));
      var a = F.dom[0], b = F.dom[1], lo = Infinity, hi = -Infinity;
      for(var i = 0; i <= 200; i++){ var y = F.f(a + (b - a) * i / 200); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      lo = Math.min(lo, 0); var pad = (hi - lo) * 0.12; hi += pad; if(lo < 0) lo -= pad;
      var L = w < 420 ? 40 : 50, R = 14, Tp = 12, B = 30;
      return { w: w, h: h, x: [a, b], y: [lo, hi], L: L, R: R, T: Tp, B: B,
        sx: function(x){ return L + (x - a) / (b - a) * (w - L - R); }, sy: function(y){ return Tp + (hi - y) / (hi - lo) * (h - Tp - B); },
        ix: function(px){ return a + (px - L) / (w - L - R) * (b - a); } };
    }
    function curve(f, lo, hi){
      var d = '', n = 300;
      for(var i = 0; i <= n; i++){ var x = lo + (hi - lo) * i / n, y = f(x); d += (i ? 'L' : 'M') + r1(V.sx(x)) + ' ' + r1(V.sy(y)); }
      return d;
    }
    function axes(){
      var F = Fn(), o = [], xt = P.ticks(V.x[0], V.x[1], Math.max(4, Math.round((V.w - V.L) / 80))), yt = P.ticks(V.y[0], V.y[1], 5);
      o.push('<rect class="rc-bg" x="' + V.L + '" y="' + V.T + '" width="' + (V.w - V.L - V.R) + '" height="' + (V.h - V.T - V.B) + '" rx="8"/>');
      xt.forEach(function(x){ var px = r1(V.sx(x)); o.push('<line class="rc-grid" x1="' + px + '" y1="' + V.T + '" x2="' + px + '" y2="' + (V.h - V.B) + '"/><text class="rc-tk" x="' + px + '" y="' + (V.h - V.B + 16) + '" text-anchor="middle">' + num(x) + '</text>'); });
      yt.forEach(function(y){ var py = r1(V.sy(y)); o.push('<line class="rc-grid' + (Math.abs(y) < 1e-12 ? ' rc-zero' : '') + '" x1="' + V.L + '" y1="' + py + '" x2="' + (V.w - V.R) + '" y2="' + py + '"/><text class="rc-tk" x="' + (V.L - 6) + '" y="' + (+py + 4) + '" text-anchor="end">' + num(y) + '</text>'); });
      o.push('<text class="rc-axl" x="' + (V.w - V.R - 8) + '" y="' + (V.h - V.B - 8) + '" text-anchor="end">' + esc(F.x) + ' (' + esc(F.xus) + ')</text>');
      o.push('<text class="rc-axl" x="' + (V.L + 6) + '" y="' + (V.T + 14) + '">' + esc(F.fn) + '(' + esc(F.x) + ')</text>');
      return o.join('');
    }

    /* ---------------------------------------------- secants view */
    function secs(){ var F = Fn(); return RC.secants(F.f, st.a, st.d, st.k); }
    function fitSecants(){
      var F = Fn(), span = F.dom[1] - F.dom[0];
      st.d = clamp(st.d, stepOf() * 2, span / st.k);
      st.a = clamp(st.a, F.dom[0], F.dom[1] - st.d * st.k);
      st.a = Math.round(st.a / stepOf()) * stepOf();
    }
    function drawSec(){
      var F = Fn(), S = secs(), o = [axes()], end = st.a + st.d * st.k;
      // the stretch the secants cover
      o.push('<rect class="rc-span" x="' + r1(V.sx(st.a)) + '" y="' + V.T + '" width="' + r1(V.sx(end) - V.sx(st.a)) + '" height="' + (V.h - V.T - V.B) + '"/>');
      o.push('<path class="rc-curve" d="' + curve(F.f, V.x[0], V.x[1]) + '"/>');
      S.forEach(function(s, i){
        var c = COLS[i], x1 = V.sx(s.a), y1 = V.sy(s.fa), x2 = V.sx(s.b), y2 = V.sy(s.fb);
        o.push('<line class="rc-sec ' + c + '" x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '"/>');
      });
      // pass 2: no slope numbers on the secants; each secant's rate is the bar of its color right under the graph
      S.forEach(function(s, i){ o.push('<circle class="rc-pt ' + COLS[i] + '" cx="' + r1(V.sx(s.a)) + '" cy="' + r1(V.sy(s.fa)) + '" r="4.5"/>'); });
      var lst = S[S.length - 1]; o.push('<circle class="rc-pt ' + COLS[S.length - 1] + '" cx="' + r1(V.sx(lst.b)) + '" cy="' + r1(V.sy(lst.fb)) + '" r="4.5"/>');
      plot.innerHTML = o.join('');
      handles([['a', st.a, F.f(st.a)]]);
      drawBars(S);
    }
    function drawBars(S){
      var w = Math.max(240, Math.round(bwrap.clientWidth || 600)), h = Math.max(80, Math.round(bwrap.clientHeight || 110));
      var ms = S.map(function(s){ return s.m; }), lo = Math.min(0, Math.min.apply(null, ms)), hi = Math.max(0, Math.max.apply(null, ms));
      if(hi - lo < 1e-9){ hi += 1; }
      var L = V ? V.L : 44, R = 58, Tp = 18, B = lo < 0 ? 32 : 18 /* a negative bar's number goes under it: keep it off the row of changes */, n = S.length, gw = (w - L - R) / n, bw = Math.min(54, gw * 0.42);
      var sy = function(v){ return Tp + (hi - v) / (hi - lo) * (h - Tp - B); }, o = [];
      bars.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      o.push('<text class="rc-blab" x="' + (L - 6) + '" y="' + (Tp - 4) + '" text-anchor="end">rate</text>');
      o.push('<line class="rc-bzero" x1="' + L + '" y1="' + r1(sy(0)) + '" x2="' + (w - R) + '" y2="' + r1(sy(0)) + '"/>');
      S.forEach(function(s, i){
        var cx = L + gw * (i + 0.5), y0 = sy(0), y1 = sy(s.m), top = Math.min(y0, y1);
        o.push('<rect class="rc-bar ' + COLS[i] + '" x="' + r1(cx - bw / 2) + '" y="' + r1(top) + '" width="' + r1(bw) + '" height="' + r1(Math.max(1.5, Math.abs(y1 - y0))) + '" rx="4"/>');
        o.push('<text class="rc-bval" x="' + r1(cx) + '" y="' + r1(s.m >= 0 ? top - 4 : top + Math.abs(y1 - y0) + 13) + '" text-anchor="middle">' + sgnNum(s.m) + '</text>');
        if(i){
          var dd = s.m - S[i - 1].m, ax = L + gw * i, cls = Math.abs(dd) < 1e-9 ? 'is-flat' : dd > 0 ? 'is-up' : 'is-down';
          o.push('<text class="rc-diff ' + cls + '" x="' + r1(ax) + '" y="' + (h - 4) + '" text-anchor="middle">' + (Math.abs(dd) < 1e-9 ? '=' : (dd > 0 ? '▲ ' : '▼ ') + num(Math.abs(dd))) + '</text>');
        }
      });
      bars.innerHTML = o.join('');
      bars.setAttribute('aria-label', 'Average rates of change over ' + S.length + ' equal intervals: ' + S.map(function(s){ return num(s.m); }).join(', ') + '.');
    }

    /* ---------------------------------------------- estimate view */
    function drawEst(){
      var F = Fn(), E = RC.estimate(F.f, st.p, st.q, st.x0), o = [axes()], c = RC.concOn(F, st.p, st.q);
      var line = function(x){ return F.f(st.p) + E.m * (x - st.p); };
      // between the curve and the secant on [p, q], shaded
      var top = '', bot = '';
      for(var i = 0; i <= 80; i++){ var x = st.p + (st.q - st.p) * i / 80; top += (i ? 'L' : 'M') + r1(V.sx(x)) + ' ' + r1(V.sy(F.f(x))); }
      for(var j = 80; j >= 0; j--){ var x2 = st.p + (st.q - st.p) * j / 80; bot += 'L' + r1(V.sx(x2)) + ' ' + r1(V.sy(line(x2))); }
      o.push('<path class="rc-gapfill' + (c > 0 ? ' is-up' : c < 0 ? ' is-down' : '') + '" d="' + top + bot + 'Z"/>');
      o.push('<path class="rc-curve" d="' + curve(F.f, V.x[0], V.x[1]) + '"/>');
      // the secant line, extended thin, solid between its points
      var xa = V.x[0], xb = V.x[1];
      o.push('<line class="rc-secx" x1="' + r1(V.sx(xa)) + '" y1="' + r1(V.sy(line(xa))) + '" x2="' + r1(V.sx(xb)) + '" y2="' + r1(V.sy(line(xb))) + '"/>');
      o.push('<line class="rc-sec p1" x1="' + r1(V.sx(st.p)) + '" y1="' + r1(V.sy(F.f(st.p))) + '" x2="' + r1(V.sx(st.q)) + '" y2="' + r1(V.sy(F.f(st.q))) + '"/>');
      // the estimate (on the secant) and the true value (on the curve)
      var ex = r1(V.sx(st.x0)), ey = V.sy(E.est), ty = V.sy(E.true);
      o.push('<line class="rc-x0" x1="' + ex + '" y1="' + (V.h - V.B) + '" x2="' + ex + '" y2="' + r1(Math.max(ey, ty)) + '"/>');
      o.push('<line class="rc-gap" x1="' + ex + '" y1="' + r1(ey) + '" x2="' + ex + '" y2="' + r1(ty) + '"/>');
      o.push('<circle class="rc-true" cx="' + ex + '" cy="' + r1(ty) + '" r="5.5"/>');
      o.push('<circle class="rc-est" cx="' + ex + '" cy="' + r1(ey) + '" r="6"/>');
      var right = +ex < V.w * 0.62, anc = right ? 'start' : 'end', dx = right ? 12 : -12, upE = ey < ty;
      o.push('<text class="rc-elab" x="' + (+ex + dx) + '" y="' + r1(ey + (upE ? -6 : 14)) + '" text-anchor="' + anc + '">estimate ' + num(E.est) + '</text>');
      o.push('<text class="rc-tlab" x="' + (+ex + dx) + '" y="' + r1(ty + (upE ? 14 : -6)) + '" text-anchor="' + anc + '">true ' + num(E.true) + '</text>');
      plot.innerHTML = o.join('');
      handles([['p', st.p, F.f(st.p)], ['q', st.q, F.f(st.q)], ['x0', st.x0, E.est]]);
    }

    /* ---------------------------------------------- handles */
    var HS = {};
    function mkHandle(key, label){
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'rc-h rc-h-' + key); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'slider'); g.setAttribute('aria-label', label);
      g.innerHTML = '<circle class="rc-halo" r="19"/><circle class="rc-hdot" r="8"/>';
      hg.appendChild(g);
      var on = false;
      function toX(e){ var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(); return V.ix((m ? pt.matrixTransform(m.inverse()) : pt).x); }
      g.addEventListener('pointerdown', function(e){ on = true; try{ g.setPointerCapture(e.pointerId); }catch(er){} g.classList.add('is-drag'); e.preventDefault(); touch(); });
      g.addEventListener('pointermove', function(e){ if(on) setX(key, toX(e), false); });
      function up(){ if(!on) return; on = false; g.classList.remove('is-drag'); update(true); }
      g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
      g.addEventListener('keydown', function(e){
        var k = e.key, s = stepOf() * (e.shiftKey ? 10 : 1), F = Fn(), cur = st[key], nx;
        if(k === 'ArrowRight' || k === 'ArrowUp') nx = cur + s; else if(k === 'ArrowLeft' || k === 'ArrowDown') nx = cur - s;
        else if(k === 'Home') nx = F.dom[0]; else if(k === 'End') nx = F.dom[1]; else return;
        e.preventDefault(); touch(); setX(key, nx, true);
      });
      HS[key] = g; return g;
    }
    function setX(key, x, full){
      var F = Fn(), k = stepOf(), gap = k * 4;
      x = Math.round(x / k) * k;
      if(key === 'a') st.a = clamp(x, F.dom[0], F.dom[1] - st.d * st.k);
      if(key === 'p') st.p = clamp(x, F.dom[0], st.q - gap);
      if(key === 'q') st.q = clamp(x, st.p + gap, F.dom[1]);
      if(key === 'x0') st.x0 = clamp(x, st.p, st.q);
      if(key !== 'x0') st.x0 = clamp(st.x0, st.p, st.q);
      update(full);
    }
    function handles(list){
      Object.keys(HS).forEach(function(k){ HS[k].style.display = 'none'; });
      list.forEach(function(h){
        var g = HS[h[0]] || mkHandle(h[0], h[0] === 'a' ? 'Start of the first interval: arrow keys move it along the curve' : h[0] === 'p' ? 'Left end of the secant line' : h[0] === 'q' ? 'Right end of the secant line' : 'Input to estimate at, on the secant line');
        g.style.display = '';
        g.setAttribute('transform', 'translate(' + r1(V.sx(h[1])) + ' ' + r1(V.sy(h[2])) + ')');
        g.setAttribute('aria-valuenow', M.fixed(h[1], 2)); g.setAttribute('aria-valuemin', String(Fn().dom[0])); g.setAttribute('aria-valuemax', String(Fn().dom[1]));
        g.setAttribute('aria-valuetext', Fn().x + ' = ' + num(h[1]));
      });
    }

    /* ---------------------------------------------- controls */
    function buildChips(){ chips.innerHTML = ids.map(function(id){ return '<button type="button" class="bt-btn rc-chip" data-id="' + id + '" aria-pressed="' + (id === st.id) + '">' + esc(RC.FUNCS[id].name) + '</button>'; }).join(''); }
    chips.addEventListener('click', function(e){ var b = e.target.closest('.rc-chip'); if(!b) return; touch(); st.id = b.getAttribute('data-id'); reset(); buildChips(); buildSlider(); update(true); });
    views.addEventListener('click', function(e){
      var b = e.target.closest('.bt-mode'); if(!b) return; touch(); st.view = b.getAttribute('data-v');
      views.querySelectorAll('.bt-mode').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
      buildSlider(); update(true);
    });
    nseg.addEventListener('click', function(e){ var b = e.target.closest('.rc-n'); if(!b) return; touch(); st.k = +b.getAttribute('data-k'); fitSecants(); if(slider) slider.set(st.d); update(true); });
    function buildSlider(){
      var F = Fn(), span = F.dom[1] - F.dom[0], k = stepOf();
      if(st.view === 'sec') slider = T.slider({ label: 'Interval width (' + F.xus + ')', min: k * 2, max: Math.round(span / 2 / k) * k, step: k, value: st.d, onInput: function(v){ touch(); st.d = v; fitSecants(); update(true); } });
      else slider = T.slider({ label: 'Estimate at ' + F.x, min: F.dom[0], max: F.dom[1], step: k, value: st.x0, onInput: function(v){ touch(); setX('x0', v, true); if(Math.abs(slider.value() - st.x0) > 1e-9) slider.set(st.x0); } });
      slot.innerHTML = ''; slot.appendChild(slider.el);
      var ns = host.querySelector('.rc-nseg') || (LS && LS.root.querySelector('.rc-nseg')); if(ns) ns.hidden = st.view !== 'sec';
      var bw = host.querySelector('.rc-bars-wrap') || (LS && LS.root.querySelector('.rc-bars-wrap')); if(bw) bw.hidden = st.view !== 'sec';
    }

    /* ---------------------------------------------- words */
    var lastCap = '';
    function update(full){
      V = layout();
      svg.setAttribute('viewBox', '0 0 ' + V.w + ' ' + V.h);
      if(st.view === 'sec') drawSec(); else drawEst();
      var F = Fn();
      (host.querySelector('.rc-nseg') || (LS && LS.root.querySelector('.rc-nseg'))).querySelectorAll('.rc-n').forEach(function(b){ b.setAttribute('aria-pressed', String(+b.getAttribute('data-k') === st.k)); });
      if(slider){ var sv = st.view === 'sec' ? st.d : st.x0; if(Math.abs(slider.value() - sv) > 1e-9) slider.set(sv); }
      ctxEl.innerHTML = html(F.story) + ' <span class="rc-f">' + tex(F.tex) + '</span>';
      var head, body, dt;
      if(st.view === 'sec'){
        var S = secs(), ms = S.map(function(s){ return s.m; }), tr = RC.trend(ms, 1e-6), a = S[0].a, b = S[S.length - 1].b;
        head = tr === 'same' ? 'Equal rates on every interval: the rate of change of ' + F.fn + ' is constant, a line.'
          : tr === 'up' ? '<b>The rates increase</b>: the rate of change of ' + F.fn + ' is increasing, so ' + F.fn + ' is <b>concave up</b> here.'
          : tr === 'down' ? '<b>The rates decrease</b>: the rate of change of ' + F.fn + ' is decreasing, so ' + F.fn + ' is <b>concave down</b> here.'
          : '<b>The rates go up and down</b>: the concavity of ' + F.fn + ' changes inside this stretch.';
        body = '<p>' + html(RC.arocSentence(F, S[0].a, S[0].b)) + '</p><p>' + html(RC.trendSentence(F, tr, a, b)) + '</p>' +
          '<p class="rc-rule"><b>Compare like with like:</b> only rates over intervals of the same length show the concavity. Whether ' + esc(F.fn) + ' itself goes up or down is a different question: look at the sign of the rates for that.</p>';
        dt = '<h3 class="ls-title-l">Secants over equal intervals of ' + num(st.d) + ' ' + esc(st.d === 1 ? F.xu : F.xus) + '</h3><table class="ls-tbl rc-tbl"><thead><tr><th scope="col"><span class="sr-only">Color</span></th><th scope="col">Interval</th><th scope="col" class="r">' + esc(F.fn) + ' at the ends</th><th scope="col" class="r">Rate (' + esc(F.rate) + ')</th></tr></thead><tbody>' +
          S.map(function(s, i){ return '<tr><td><i class="rc-sw ' + COLS[i] + '"></i></td><td>[' + num(s.a) + ', ' + num(s.b) + ']</td><td class="r">' + num(s.fa, 3) + ' → ' + num(s.fb, 3) + '</td><td class="r"><b>' + num(s.m, 3) + '</b></td></tr>'; }).join('') + '</tbody></table>';
      } else {
        var E = RC.estimate(F.f, st.p, st.q, st.x0), c = RC.concOn(F, st.p, st.q), I = '[' + num(st.p) + ', ' + num(st.q) + ']';
        var verdict = Math.abs(E.gap) < 1e-6 ? 'The estimate equals the true value here.'
          : c > 0 ? '<b>Overestimate:</b> ' + F.fn + ' is concave up on ' + I + ', so its graph lies below the secant line there.'
          : c < 0 ? '<b>Underestimate:</b> ' + F.fn + ' is concave down on ' + I + ', so its graph lies above the secant line there.'
          : c === 0 ? 'A line is its own secant: the estimate is exact.'
          : '<b>' + (E.over ? 'Over' : 'Under') + 'estimate here</b>, but the concavity changes on ' + I + ', so concavity alone cannot decide it. Shrink the interval.';
        head = 'Estimate ' + F.fn + '(' + num(st.x0) + ') ≈ ' + num(E.est) + ' on the secant line. ' + verdict;
        body = '<p>' + html('The secant line through $(' + num(st.p).replace('−', '-') + ', ' + F.fn + '(' + num(st.p).replace('−', '-') + '))$ and $(' + num(st.q).replace('−', '-') + ', ' + F.fn + '(' + num(st.q).replace('−', '-') + '))$ has slope $m \\approx ' + RC.n(E.m, 3) + '$, the average rate of change of $' + F.fn + '$ on that interval.') + '</p>' +
          '<p>' + html('On it, $' + F.fn + '(' + RC.n(st.x0, 2) + ') \\approx ' + F.fn + '(' + RC.n(st.p, 2) + ') + m(' + RC.n(st.x0, 2) + ' - ' + RC.n(st.p, 2) + ') = ' + RC.n(E.est, 3) + '$; the true value is $' + RC.n(E.true, 3) + '$.') + '</p>' +
          '<p class="rc-rule"><b>The reason the scoring guide wants:</b> name the concavity on the interval and where the graph lies compared with the secant line. "' + esc(F.fn) + ' is increasing" does not decide over or under.</p>';
        dt = '<h3 class="ls-title-l">The estimate</h3><table class="ls-tbl"><tbody><tr><th scope="row">Secant slope</th><td class="r">' + num(E.m, 3) + ' ' + esc(F.rate) + '</td></tr><tr><th scope="row">Estimate on the secant</th><td class="r">' + num(E.est, 3) + '</td></tr><tr><th scope="row">True value</th><td class="r">' + num(E.true, 3) + '</td></tr><tr><th scope="row">Estimate − true</th><td class="r">' + num(E.gap, 3) + '</td></tr></tbody></table>';
      }
      det.innerHTML = '<p>' + html(F.story) + '</p><p>' + tex(F.tex) + '</p>' + dt;
      T.explain(host.querySelector('.rc-say') || (LS && LS.root.querySelector('.rc-say')), head, body);
      if(LS){ if(head !== lastCap){ LS.caption(head, 'explore'); lastCap = head; } LS.pills([], 'left', 'explore'); }
      svg.setAttribute('aria-label', F.name + ': graph of ' + (X ? X.text(F.tex) : F.tex) + '. ' + head.replace(/<[^>]+>/g, ''));
      if(full) say(head.replace(/<[^>]+>/g, ''));
    }
    if(window.ResizeObserver){
      var last = '';
      new ResizeObserver(function(){ var k = wrap.clientWidth + 'x' + wrap.clientHeight + 'x' + bwrap.clientWidth; if(k !== last){ last = k; update(false); } }).observe(wrap);
    }
    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'pcalc-ls-stage rc-ls-stage'; stage.appendChild(host.querySelector('.rc-stage'));
      s.add('stage', stage, o);
      var dock = document.createElement('div'); dock.className = 'pcalc-ls-dock rc-ls-dock'; dock.appendChild(host.querySelector('.rc-ctl'));
      s.add('dock', dock, o);
      var why = document.createElement('div'); why.className = 'ls-sec pcalc-ls-why rc-ls-why'; why.appendChild(cue.el); why.appendChild(host.querySelector('.rc-say'));
      s.add('why', why, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      var dd = document.createElement('div'); dd.className = 'ls-sec pcalc-ls-det rc-ls-det'; dd.appendChild(det);
      s.add('details', dd, o);
      lastCap = ''; update(true);
      if(s.mode() === 'explore' && HS.a) s.hint({ target: HS.a, text: 'Drag this point along the curve', key: 'apprecalc-rate-of-change-drag' });
    }
    reset(); buildChips(); buildSlider(); update(true);
    return { pause: function(){}, studio: studio };
  }

  /* ============================================================ test yourself */
  function figSize(w, h){
    var W = window.innerWidth || 1280, Hh = window.innerHeight || 800;
    if(W <= 640) return [340, Math.round(Math.max(260, Math.min(420, Hh * 0.62 - 90)))];
    if(W <= 999 && Hh <= 540) return [440, Math.round(Math.max(220, Math.min(300, Hh - 110)))];
    return [w, h];
  }
  function range(f, a, b){ var lo = Infinity, hi = -Infinity; for(var i = 0; i <= 120; i++){ var y = f(a + (b - a) * i / 120); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; }
  function figSpec(p){
    var g = p.fig, sz = figSize(560, 380), spec = { label: 'Graph of ' + g.fn + ' with the points the problem uses', width: sz[0], height: sz[1], xLabel: g.x, yLabel: g.fn, curves: [], points: [] };
    var ys;
    if(g.pts){
      ys = g.pts.map(function(q){ return q[1]; });
      var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), pad = (hi - lo) * 0.15 || 1;
      spec.x = [g.pts[0][0] - (g.pts[1][0] - g.pts[0][0]) * 0.4, g.pts[4][0] + (g.pts[1][0] - g.pts[0][0]) * 0.4]; spec.y = [Math.min(0, lo - pad), hi + pad];
      spec.points = g.pts.map(function(q){ return { at: q, cls: 's1' }; });
      spec.label = 'The values in the table, plotted';
      return spec;
    }
    var f = function(x){ return RC.peval(g.c, x); }, r = range(f, g.dom[0], g.dom[1]), pd = (r[1] - r[0]) * 0.15 || 1;
    spec.x = g.dom; spec.y = [Math.min(0, r[0] - pd), r[1] + pd];
    spec.curves.push({ fn: f, cls: 's1', label: g.fn });
    var xsOn = p.type === 'aroc' ? [g.a, g.b] : p.type === 'estimate' ? [g.p, g.q] : g.secs.map(function(s){ return s.a; }).concat([g.secs[g.secs.length - 1].b]);
    spec.points = xsOn.map(function(x){ return { at: [x, f(x)], cls: 's1', label: '(' + RC.n(x) + ', ' + RC.n(f(x)) + ')' }; });
    if(p.type === 'quadratic') spec.points.forEach(function(q){ q.label = ''; });
    return spec;
  }
  var METHOD = {
    m: 'Average rate of change = (f(b) − f(a)) / (b − a): the change in the output over the change in the input.',
    means: 'An average rate is the change in output per unit of input, over the whole interval.',
    est: 'Write the secant line through one of its points: y = f(a) + m(x − a). Then put in x.',
    ou: 'Concave up: the graph sags below a secant line. Concave down: it bulges above. The estimate is on the line.',
    r1: 'Rate on one interval: the change in the output divided by the width of the interval.',
    r2: 'Rate on one interval: the change in the output divided by the width of the interval.',
    r4: 'Rate on one interval: the change in the output divided by the width of the interval.',
    conc: 'List the rates over the equal intervals in order. Rising rates: concave up. Falling rates: concave down.',
    dd: 'Subtract: the later rate minus the earlier one.',
    why: 'Compare: lines have equal rates, exponentials have equal ratios of outputs.'
  };
  function quiz(host, data){
    var fig = null, prob = null;
    T.drill(host, data, { slug: 'rate-of-change', noun: 'drill',
      types: RC.KINDS.map(function(k){ return { value: k, label: RC.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: RC.generate, title: function(p){ return p.title; },
      extra: function(el, p){
        prob = p;
        // the table of values goes on the stage, over the figure (the caption keeps the words)
        var tb = el.parentNode && el.parentNode.querySelector('.bt-context table');
        if(tb){ var tw = document.createElement('div'); tw.className = 'rc-tabwrap'; tw.appendChild(tb.closest('.bt-table-wrap') || tb); el.appendChild(tw); }
        var box = document.createElement('div'); el.appendChild(box);
        fig = T.markedFigure(box, function(){ return figSpec(p); }, 'rc-figwrap');
      },
      method: function(s){ return METHOD[s.key]; },
      onTry: function(s, t){
        var p = prob, v = p.values, g = p.fig;
        if(!fig || s.kind !== 'num') return false;
        // a rate is a secant: draw the line with the student's slope from the left point
        var seg = null;
        if(p.type === 'aroc' && s.key === 'm') seg = [v.a, v.b, RC.peval(v.c, v.a)];
        if(p.type === 'estimate' && s.key === 'm') seg = [v.p, v.q, RC.peval(v.c, v.p)];
        if(p.type === 'quadratic' && (s.key === 'r1' || s.key === 'r2')){ var i0 = s.key === 'r1' ? 0 : 1, sc = g.secs[i0]; seg = [sc.a, sc.b, sc.fa]; }
        if(p.type === 'concavity' && (s.key === 'r1' || s.key === 'r4')){ var j = s.key === 'r1' ? 0 : 3; seg = [v.xs[j], v.xs[j + 1], v.ys[j]]; }
        var marks = [], last = fig.lastS || (fig.lastS = {});
        function line(m, who){ return { line: [[seg[0], seg[2]], [seg[1], seg[2] + m * (seg[1] - seg[0])]], who: who, label: who === 'yours' ? 'yours: slope ' + T.numText(m) : 'slope ' + T.numText(m) }; }
        if(seg){
          if(!t.ok && !t.shown){ if(isFinite(t.value)) marks.push(line(t.value, 'yours')); last[s.key] = marks.slice(); }
          else marks = (last[s.key] || []).concat([line(s.cell.answer, 'right')]);
        } else if(p.type === 'estimate' && s.key === 'est'){
          if(!t.ok && !t.shown){ if(isFinite(t.value)) marks.push({ point: [v.x0, t.value], who: 'yours', label: 'yours' }); last.est = marks.slice(); }
          else marks = (last.est || []).concat([{ line: [[v.p, RC.peval(v.c, v.p)], [v.q, RC.peval(v.c, v.q)]], who: 'right' }, { point: [v.x0, s.cell.answer], who: 'right', label: 'on the secant' }]);
        } else return false;
        if(!marks.length) return false;
        fig.marks.set(s.key, marks); fig.redraw();
        return true;
      } });
  }
})();
