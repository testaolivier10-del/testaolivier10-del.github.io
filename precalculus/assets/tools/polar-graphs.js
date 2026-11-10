/* Polar graphs (simulator, Premium; docs/apprecalc-spec.md section 6). OWNED BY THIS
   TOOL ONLY (builder T4, docs/apprecalc-briefs/t4.md). The model is
   ApPrecalcMath.polarGraphs (precalculus/assets/tools/math/polar-graphs.js); math
   text ApPrecalcTex; the frame ApPrecalcTools.modes and drill on the Tool Studio.

   Explore: the polar grid and the graph of r against θ side by side (stacked
   on a phone), one SVG. Sweep θ (drag on either view, the slider, Play, or
   the arrow keys): the curve draws itself, the current point and its signed
   distance r are orange in both views, and bands show where the distance
   |r| from the origin increases (green) or decreases (pink), in both views.
   Parts with r < 0 are dashed in both. Interval: a secant on the graph of r
   against θ gives the average rate of change of r; the arc it covers is
   highlighted on the polar curve. Curve settings (a, b, n, cos or sin, the
   interval width) are in Details.

   Test yourself: polar and rectangular coordinates, reading a polar
   equation (r at an angle, the shape, the greatest distance), and rates of
   change of r (the average rate, the signs, the direction of |r|). The
   figure fills in as each step is answered. */
(function(){
  'use strict';
  var T = window.ApPrecalcTools, M = window.ApPrecalcMath, P = window.ApPrecalcPlot, X = window.ApPrecalcTex;
  (function(){
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Curve & numbers');
  })();
  if(!T || !M || !M.polarGraphs || M.polarGraphs.stub || !P) return;
  var PG = M.polarGraphs, F = T.F, esc = T.esc, PI = Math.PI, TAU = 2 * PI;
  function html(s){ return X ? X.html(s) : s; }
  function tex(s){ return X ? X.render(s) : esc(s); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function num(v, d){ return d == null ? PG.n(v, 2).replace(/^-/, '−') : F(v, d); }
  function studioNow(){ var app = document.getElementById('app'); return window.LevlStudio && app && app.getAttribute('data-studio') ? window.LevlStudio.get() : null; }
  function phoneNow(){ var s = studioNow(); return !!(s && s.root && s.root.classList.contains('ls-phone')) || (window.innerWidth || 1280) <= 640; }

  T.mount('polar-graphs', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'polar-graphs',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.pause(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* =================================================== the scene (shared) */
  /* scene(o) -> svg inner markup. o: { w, h, c (curve), polar, graph (bool),
     theta, traced (θ drawn up to; null: the whole curve solid), ghost (the
     rest faint), point, bands, interval [t1, t2], secant { t1, r1, m, cls },
     extra { polar: [], graph: [] } (functions (geometry) -> markup), rmax } */
  function niceR(m){ return m <= 1 ? 1 : m <= 6 ? Math.ceil(m - 1e-9) : 2 * Math.ceil(m / 2 - 1e-9); }
  function layout(o){
    var w = o.w, h = o.h, g = {};
    var both = o.polar && o.graph, wide = w >= h * 1.15;
    var P0 = 26; // room for angle labels
    if(o.polar){
      var S = !both ? Math.min(w, h) : wide ? Math.min(h, w * 0.5) : Math.min(w, h * 0.6);
      g.cx = !both ? w / 2 : wide ? S / 2 : w / 2; g.cy = !both ? h / 2 : wide ? h / 2 : S / 2; g.R = S / 2 - P0;
      g.S = S;
    }
    if(o.graph){
      var gx0 = !both ? 0 : wide ? g.S + 10 : 0, gy0 = !both ? 0 : wide ? Math.max(0, (h - Math.min(h, (w - g.S) * 0.9)) / 2) : g.S + 4;
      var gw = w - gx0, gh = !both ? h : wide ? h - 2 * gy0 : h - gy0;
      g.gx0 = gx0; g.gy0 = gy0; g.gw = gw; g.gh = gh;
      g.gL = gx0 + 38; g.gR = gx0 + gw - 12; g.gT = gy0 + 12; g.gB = gy0 + gh - 24;
    }
    g.wide = wide; g.both = both;
    return g;
  }
  function samples(c, a, b, n){ var out = []; for(var i = 0; i <= n; i++){ var t = a + (b - a) * i / n; out.push([t, c.f(t)]); } return out; }
  /* Paths of a run of [θ, r] split where r changes sign: { pos, neg }. */
  function splitPaths(pts, toXY){
    var pos = [], neg = [], cur = [], sign = 0;
    function flush(){ if(cur.length > 1) (sign >= 0 ? pos : neg).push('M' + cur.join('L')); cur = []; }
    pts.forEach(function(p, i){
      var s = p[1] > 1e-9 ? 1 : p[1] < -1e-9 ? -1 : 0, xy = toXY(p[0], p[1]), pt = r1(xy[0]) + ' ' + r1(xy[1]);
      if(s && sign && s !== sign){ cur.push(pt); flush(); }
      if(s) sign = s;
      cur.push(pt);
    });
    flush();
    return { pos: pos.join(''), neg: neg.join('') };
  }
  function scene(o){
    var g = layout(o), c = o.c, out = [], R = o.rmax || niceR(c ? c.maxR : 1);
    var bandsOf = c && o.bands ? PG.pieces(c) : [];
    if(o.polar){
      var k = g.R / R, cx = g.cx, cy = g.cy;
      var xy = function(t, r){ return [cx + r * Math.cos(t) * k, cy - r * Math.sin(t) * k]; };
      g.xy = xy; g.k = k;
      var step = R <= 6 ? 1 : 2, rings = [];
      for(var q = step; q <= R + 1e-9; q += step) rings.push(q);
      out.push('<g class="pg-grid">' + rings.map(function(q){ return '<circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(q * k) + '"' + (Math.abs(q - R) < 1e-9 ? ' class="pg-rim"' : '') + '/>'; }).join('') +
        Array.apply(null, Array(12)).map(function(_, i){ var t = i * PI / 6, e = xy(t, R); return '<line' + (i % 3 ? '' : ' class="pg-ax"') + ' x1="' + r1(cx) + '" y1="' + r1(cy) + '" x2="' + r1(e[0]) + '" y2="' + r1(e[1]) + '"/>'; }).join('') + '</g>');
      // angle labels round the rim; ring numbers along θ = 0
      var labs = [];
      for(var i = 0; i < 12; i++){
        if(g.R < 120 && i % 3) continue;
        var t = i * PI / 6, e = xy(t, R + 13 / k), an = Math.abs(Math.cos(t)) < 0.2 ? 'middle' : Math.cos(t) > 0 ? 'start' : 'end';
        labs.push('<text x="' + r1(e[0] + (an === 'start' ? -4 : an === 'end' ? 4 : 0)) + '" y="' + r1(e[1] + 4) + '" text-anchor="' + an + '">' + PG.piText(2 * i) + '</text>');
      }
      rings.forEach(function(q){ var e = xy(0, q); labs.push('<text class="pg-rn" x="' + r1(e[0] - 3) + '" y="' + r1(e[1] + 13) + '" text-anchor="end">' + q + '</text>'); });
      out.push('<g class="pg-alab">' + labs.join('') + '</g>');
      if(c){
        var tr = o.traced == null ? TAU : o.traced;
        // band-colored glow under the traced curve, then the curve
        bandsOf.forEach(function(pc){
          var a = pc.a, b = Math.min(pc.b, tr); if(b <= a + 1e-9) return;
          var pts = samples(c, a, b, Math.max(8, Math.round(240 * (b - a) / TAU)));
          out.push('<path class="pg-glow is-' + pc.dist + '" d="M' + pts.map(function(p){ var z = xy(p[0], p[1]); return r1(z[0]) + ' ' + r1(z[1]); }).join('L') + '"/>');
        });
        if(o.ghost && tr < TAU){ var gp = splitPaths(samples(c, tr, TAU, 360), xy); out.push('<path class="pg-ghost" d="' + gp.pos + gp.neg + '"/>'); }
        if(tr > 0){ var sp = splitPaths(samples(c, 0, tr, Math.max(12, Math.round(720 * tr / TAU))), xy); out.push('<path class="pg-curve" d="' + sp.pos + '"/><path class="pg-curve is-neg" d="' + sp.neg + '"/>'); }
        if(o.interval){
          var ia = o.interval[0], ib = o.interval[1], ip = splitPaths(samples(c, ia, ib, 160), xy);
          out.push('<path class="pg-arc" d="' + ip.pos + ip.neg + '"/>');
          [ia, ib].forEach(function(t){ var z = xy(t, c.f(t)); out.push('<circle class="pg-ipt" cx="' + r1(z[0]) + '" cy="' + r1(z[1]) + '" r="5"/>'); });
        }
      }
      (o.extra && o.extra.polar || []).forEach(function(fn){ out.push(fn(g)); });
      if(o.point && c){
        var th = o.theta, rv = c.f(th), ray = xy(th, R), pt = xy(th, rv);
        out.push('<line class="pg-ray" x1="' + r1(cx) + '" y1="' + r1(cy) + '" x2="' + r1(ray[0]) + '" y2="' + r1(ray[1]) + '"/>');
        if(th > 0.02){
          var ar = 20, large = th > PI ? 1 : 0, ae = xy(th, ar / k);
          out.push('<path class="pg-ang" d="M' + r1(cx + ar) + ' ' + r1(cy) + 'A' + ar + ' ' + ar + ' 0 ' + large + ' 0 ' + r1(ae[0]) + ' ' + r1(ae[1]) + '"/>');
          var lp = xy(th / 2, (ar + 11) / k); out.push('<text class="pg-th" x="' + r1(lp[0]) + '" y="' + r1(lp[1] + 4) + '" text-anchor="middle">θ</text>');
        }
        out.push('<line class="pg-rad' + (rv < 0 ? ' is-neg' : '') + '" x1="' + r1(cx) + '" y1="' + r1(cy) + '" x2="' + r1(pt[0]) + '" y2="' + r1(pt[1]) + '"/>');
        out.push('<circle class="pg-pt" cx="' + r1(pt[0]) + '" cy="' + r1(pt[1]) + '" r="6.5"/>');
      }
    }
    if(o.graph && c){
      var lo = 0, hi = 0;
      samples(c, 0, TAU, 360).forEach(function(p){ lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); });
      var pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
      var gxf = function(t){ return g.gL + t / TAU * (g.gR - g.gL); }, gyf = function(v){ return g.gT + (hi - v) / (hi - lo) * (g.gB - g.gT); };
      g.gxf = gxf; g.gyf = gyf; g.lo = lo; g.hi = hi;
      out.push('<rect class="pg-panel" x="' + r1(g.gL) + '" y="' + r1(g.gT) + '" width="' + r1(g.gR - g.gL) + '" height="' + r1(g.gB - g.gT) + '" rx="6"/>');
      bandsOf.forEach(function(pc){ if(pc.dist === 'steady') return; out.push('<rect class="pg-band is-' + pc.dist + '" x="' + r1(gxf(pc.a)) + '" y="' + r1(g.gT) + '" width="' + r1(gxf(pc.b) - gxf(pc.a)) + '" height="' + r1(g.gB - g.gT) + '"/>'); });
      var dense = g.gR - g.gL > 420, xt = []; for(var j = 0; j <= (dense ? 8 : 4); j++) xt.push(j * TAU / (dense ? 8 : 4));
      var yt = P.ticks(lo, hi, Math.max(3, Math.round((g.gB - g.gT) / 50)));
      if(yt.length < 3) yt = P.ticks(lo, hi, 6);   // a range such as −4.6 to 4.6 would keep only 0: an axis with no scale
      out.push('<g class="pg-ggrid">' + xt.map(function(t){ return '<line x1="' + r1(gxf(t)) + '" y1="' + r1(g.gT) + '" x2="' + r1(gxf(t)) + '" y2="' + r1(g.gB) + '"/>'; }).join('') +
        yt.map(function(v){ return '<line' + (Math.abs(v) < 1e-12 ? ' class="pg-zero"' : '') + ' x1="' + r1(g.gL) + '" y1="' + r1(gyf(v)) + '" x2="' + r1(g.gR) + '" y2="' + r1(gyf(v)) + '"/>'; }).join('') + '</g>');
      out.push('<g class="pg-gtk">' + xt.map(function(t){ return '<text x="' + r1(gxf(t)) + '" y="' + r1(g.gB + 16) + '" text-anchor="middle">' + PG.angleText(t) + '</text>'; }).join('') +
        yt.map(function(v){ return '<text x="' + r1(g.gL - 6) + '" y="' + r1(gyf(v) + 4) + '" text-anchor="end">' + F(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1) + '</text>'; }).join('') +
        '<text class="pg-axl" x="' + r1(g.gR - 4) + '" y="' + r1(gyf(0) - 6) + '" text-anchor="end">θ</text><text class="pg-axl" x="' + r1(g.gL + 6) + '" y="' + r1(g.gT + 14) + '">r</text></g>');
      var gp2 = splitPaths(samples(c, 0, TAU, 720), function(t, v){ return [gxf(t), gyf(v)]; });
      out.push('<path class="pg-curve" d="' + gp2.pos + '"/><path class="pg-curve is-neg" d="' + gp2.neg + '"/>');
      if(o.interval){
        var a1 = o.interval[0], b1 = o.interval[1];
        out.push('<rect class="pg-ishade" x="' + r1(gxf(a1)) + '" y="' + r1(g.gT) + '" width="' + r1(gxf(b1) - gxf(a1)) + '" height="' + r1(g.gB - g.gT) + '"/>');
      }
      if(o.secant){
        var s = o.secant, ext = (o.interval ? o.interval[1] - o.interval[0] : 1) * 0.35, ta = clamp(s.t1 - ext, 0, TAU), tb = clamp((o.interval ? o.interval[1] : s.t1 + 1) + ext, 0, TAU);
        var ya = s.r1 + s.m * (ta - s.t1), yb = s.r1 + s.m * (tb - s.t1);
        out.push('<line class="pg-sec' + (s.cls ? ' ' + s.cls : '') + '" x1="' + r1(gxf(ta)) + '" y1="' + r1(gyf(clamp(ya, lo, hi))) + '" x2="' + r1(gxf(tb)) + '" y2="' + r1(gyf(clamp(yb, lo, hi))) + '"/>');
      }
      if(o.interval) o.interval.forEach(function(t){ out.push('<circle class="pg-ipt" cx="' + r1(gxf(t)) + '" cy="' + r1(gyf(c.f(t))) + '" r="5"/>'); });
      (o.extra && o.extra.graph || []).forEach(function(fn){ out.push(fn(g)); });
      if(o.point){
        var tt = o.theta, rr = c.f(tt), px = r1(gxf(tt));
        out.push('<line class="pg-cur" x1="' + px + '" y1="' + r1(g.gT) + '" x2="' + px + '" y2="' + r1(g.gB) + '"/>');
        out.push('<line class="pg-rad' + (rr < 0 ? ' is-neg' : '') + '" x1="' + px + '" y1="' + r1(gyf(0)) + '" x2="' + px + '" y2="' + r1(gyf(rr)) + '"/>');
        out.push('<circle class="pg-pt" cx="' + px + '" cy="' + r1(gyf(rr)) + '" r="6.5"/>');
      }
    }
    return { svg: out.join(''), g: g };
  }

  /* ============================================================ explore */
  var WIDTHS = [[2, 'π/6'], [3, 'π/4'], [4, 'π/3'], [6, 'π/2'], [8, '2π/3']];
  function explore(host, data){
    var LS = null;
    var ids = (data.curves || PG.ORDER).filter(function(id){ return PG.PRESETS[id]; });
    var st = { id: ids[0], spec: JSON.parse(JSON.stringify(PG.PRESETS[ids[0]].spec)), t: PI / 12, view: 'point', wk: 3, traced: TAU, touched: false };
    var cue = T.cue('Press Play, or drag around the polar grid: the curve draws itself as θ turns.');
    host.innerHTML =
      '<section class="bt-problem pg-card" aria-label="Polar graphs explorer">' +
        '<div class="pg-stage">' +
          '<div class="pg-wrap" tabindex="0" role="slider" aria-label="Angle θ on the polar curve: arrow keys turn it"><svg class="pg-svg" aria-hidden="true"></svg></div>' +
          '<p class="pg-legend" aria-hidden="true"><span class="pg-lg pg-lg-c">r = f(θ)</span><span class="pg-lg pg-lg-p">the point and r</span><span class="pg-lg pg-lg-a">moving away</span><span class="pg-lg pg-lg-t">moving toward</span><span class="pg-lg pg-lg-n">r &lt; 0</span></p>' +
        '</div>' +
        '<div class="pg-ctl">' +
          '<div class="pg-chips ls-scroll" role="group" aria-label="Curve"></div>' +
          '<div class="pg-slot"></div>' +
          '<div class="pg-row"><button type="button" class="bt-btn pg-play" aria-pressed="false"><span class="pg-play-i" aria-hidden="true"></span><span class="pg-play-t">Play</span></button>' +
          '<div class="pg-views ls-seg" role="group" aria-label="View"><button type="button" class="bt-mode" data-v="point" aria-pressed="true">Point</button><button type="button" class="bt-mode" data-v="interval" aria-pressed="false">Interval</button></div></div>' +
        '</div>' +
        T.moreHtml('<div class="pg-params"></div>', 'a, b, n, cos or sin, the interval') +
        '<div class="pg-say"></div>' +
        '<div class="pg-det"></div>' +
        '<p class="sr-only pg-live"></p>' +
      '</section>';
    var card = host.querySelector('.pg-card');
    card.insertBefore(cue.el, card.querySelector('.pg-say'));
    var wrap = host.querySelector('.pg-wrap'), svg = host.querySelector('.pg-svg'), chips = host.querySelector('.pg-chips'), slot = host.querySelector('.pg-slot');
    var playBtn = host.querySelector('.pg-play'), viewsEl = host.querySelector('.pg-views'), params = host.querySelector('.pg-params'), more = host.querySelector('details.bt-more');
    var say = T.announcer(host.querySelector('.pg-live'));
    var slider = null, anim = null, geo = null, c = PG.curve(st.spec), size = [0, 0];
    function $(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); }
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }
    function width(){ return st.wk * PI / 12; }
    function tMax(){ return st.view === 'interval' ? TAU - width() : TAU; }

    function buildChips(){
      chips.innerHTML = ids.map(function(id){ return '<button type="button" class="bt-btn pg-chip" data-id="' + id + '" aria-pressed="' + (id === st.id) + '">' + esc(PG.PRESETS[id].name) + '</button>'; }).join('');
    }
    function thetaText(v){ return PG.angleText(v); }
    function buildSlider(){
      slider = T.slider({ label: st.view === 'interval' ? 'Interval starts at θ' : 'Angle θ', min: 0, max: M.round(tMax(), 6), step: PI / 48, value: clamp(st.t, 0, tMax()), decimals: 2, unit: 'rad', onInput: function(v){ pause(); setT(v, true); } });
      slot.innerHTML = ''; slot.appendChild(slider.el);
      showSlider();
    }
    function showSlider(){
      if(!slider) return;
      var out = slider.el.querySelector('output'), txt = thetaText(st.t);
      if(out) out.textContent = txt;
      slider.input.setAttribute('aria-valuetext', 'θ = ' + txt + (st.view === 'interval' ? ' to ' + thetaText(st.t + width()) : ''));
    }
    /* the parameter sliders for this family (in Details) */
    function buildParams(){
      var s = st.spec, out = [];
      function sl(key, label, min, max, stp){
        var x = T.slider({ label: label, min: min, max: max, step: stp, value: s[key], decimals: stp < 1 ? 1 : 0, onInput: function(v){ if(key === 'a' && s.fam === 'circle' && v === 0) v = x.value() > 0 ? 1 : -1; s[key] = v; touch(); recurve(); } });
        out.push(x.el);
      }
      if(s.fam === 'rose'){ sl('a', 'a (petal length)', 1, 5, 1); sl('n', 'n (in nθ)', 2, 6, 1); }
      else if(s.fam === 'limacon'){ sl('a', 'a (the constant)', 0, 4, 0.5); sl('b', 'b (times the trig part)', -4, 4, 0.5); }
      else sl('a', 'a', -5, 5, 1);
      var trig = T.choiceSelect({ label: 'Trig function', value: s.trig, options: [{ value: 'cos', label: 'cos' }, { value: 'sin', label: 'sin' }].concat(s.fam === 'circle' ? [{ value: 'const', label: 'none (r = a)' }] : []), onChange: function(v){ s.trig = v; touch(); recurve(); } });
      out.push(trig.el);
      var wsel = T.choiceSelect({ label: 'Interval width', value: String(st.wk), options: WIDTHS.map(function(wd){ return { value: String(wd[0]), label: wd[1] }; }), onChange: function(v){ st.wk = +v; st.t = clamp(st.t, 0, tMax()); touch(); buildSlider(); draw(true); } });
      out.push(wsel.el);
      params.innerHTML = ''; out.forEach(function(e){ params.appendChild(e); });
    }
    function recurve(){ c = PG.curve(st.spec); draw(true); }
    function setCurve(id){
      pause(); st.id = id; st.spec = JSON.parse(JSON.stringify(PG.PRESETS[id].spec)); c = PG.curve(st.spec);
      buildChips(); buildParams();
      // the new curve draws itself once from 0 (in Interval, it is simply shown)
      if(st.view === 'interval'){ st.t = clamp(st.t, 0, tMax()); st.traced = TAU; draw(true); return; }
      st.t = 0; st.traced = 0; play(true);
    }
    function setT(v, fromSlider){
      st.t = clamp(v, 0, tMax()); touch();
      // snap to a multiple of π/12 when close (a named angle)
      if(!fromSlider){ var k = st.t / (PI / 12); if(Math.abs(k - Math.round(k)) < 0.12) st.t = Math.round(k) * PI / 12; }
      if(st.traced < st.t) st.traced = st.t;
      draw(true);
    }
    /* Play sweeps θ from where it is (from 0 at the end) to the end. */
    function play(fromStart){
      pause();
      if(st.view === 'interval'){ st.view = 'point'; syncView(); }
      if(fromStart || st.t >= tMax() - 1e-6){ st.t = 0; st.traced = 0; }
      var t0 = st.t, dur = 6 * (TAU - t0) / TAU;
      playBtn.setAttribute('aria-pressed', 'true'); playBtn.querySelector('.pg-play-t').textContent = 'Pause';
      anim = P.loop(function(dt, t){ st.t = Math.min(TAU, t0 + (TAU - t0) * t / dur); st.traced = Math.max(st.traced, st.t); draw(false); if(st.t >= TAU) return false; },
        { duration: dur, still: function(){ st.t = TAU; st.traced = TAU; }, onEnd: function(){ st.traced = TAU; anim = null; stopped(); draw(true); } });
      anim.start();
    }
    function stopped(){ playBtn.setAttribute('aria-pressed', 'false'); playBtn.querySelector('.pg-play-t').textContent = 'Play'; }
    function pause(){ if(anim){ anim.stop(); anim = null; } stopped(); }
    playBtn.addEventListener('click', function(){ touch(); if(anim){ pause(); st.traced = TAU; draw(true); } else play(false); });
    chips.addEventListener('click', function(e){ var b = e.target.closest('.pg-chip'); if(!b) return; touch(); setCurve(b.getAttribute('data-id')); });
    function syncView(){
      viewsEl.querySelectorAll('.bt-mode').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === st.view)); });
      st.t = clamp(st.t, 0, tMax()); buildSlider();
    }
    viewsEl.addEventListener('click', function(e){
      var b = e.target.closest('.bt-mode'); if(!b || b.getAttribute('data-v') === st.view) return;
      touch(); pause(); st.view = b.getAttribute('data-v'); st.traced = TAU;
      if(st.view === 'interval'){ st.t = Math.round(st.t / (PI / 12)) * PI / 12; if(st.t > tMax() - 1e-9) st.t = PI / 6; }
      syncView(); draw(true);
    });

    /* ------------------------------------------------ drawing */
    function draw(full){
      var w = Math.max(280, Math.round(wrap.clientWidth || 640)), h = Math.max(260, Math.round(wrap.clientHeight || 420));
      size = [w, h]; st.t = clamp(st.t, 0, tMax());
      var iv = st.view === 'interval' ? [st.t, st.t + width()] : null;
      var o = { w: w, h: h, c: c, polar: true, graph: true, theta: st.t, traced: st.view === 'interval' ? null : st.traced, ghost: true, point: st.view === 'point', bands: true, interval: iv };
      if(iv) o.secant = { t1: iv[0], r1: c.f(iv[0]), m: PG.avgRate(c, iv[0], iv[1]) };
      var sc = scene(o); geo = sc.g;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svg.innerHTML = sc.svg;
      var rv = c.f(st.t), xy = PG.rect(rv, st.t);
      wrap.setAttribute('aria-valuemin', '0'); wrap.setAttribute('aria-valuemax', M.fixed(tMax(), 3)); wrap.setAttribute('aria-valuenow', M.fixed(st.t, 3));
      wrap.setAttribute('aria-valuetext', iv ? 'θ from ' + thetaText(iv[0]) + ' to ' + thetaText(iv[1]) + ', average rate of change of r ' + num(o.secant.m, 3) : 'θ = ' + thetaText(st.t) + ', r = ' + num(rv) + ', x = ' + num(xy[0]) + ', y = ' + num(xy[1]));
      if(slider && Math.abs(slider.value() - st.t) > 1e-6) slider.set(st.t);
      showSlider();
      words(full);
    }
    var lastCap = '';
    function words(full){
      var rv = c.f(st.t), pc = PG.pieceAt(c, st.t + 1e-7 < TAU ? st.t + 1e-7 : st.t), xy = PG.rect(rv, st.t), th = thetaText(st.t), head, body;
      var dirR = pc.ds > 0 ? 'increasing' : pc.ds < 0 ? 'decreasing' : 'constant';
      var move = pc.dist === 'away' ? 'the point moves away from the origin' : pc.dist === 'toward' ? 'the point moves toward the origin' : 'the point stays the same distance from the origin';
      if(st.view === 'interval'){
        var a = st.t, b = st.t + width(), ra = c.f(a), rb = c.f(b), m = (rb - ra) / (b - a), same = PG.pieceAt(c, a + 1e-7), one = b <= same.b + 1e-9;
        head = esc('On [' + thetaText(a) + ', ' + thetaText(b) + '] the average rate of change of r is ' + num(m, 3) + ' per radian: the slope of the secant line.');
        body = '<ol class="pg-feats"><li>' + html('$\\frac{r(\\theta_2) - r(\\theta_1)}{\\theta_2 - \\theta_1} = \\frac{' + M.fixed(rb, 3) + ' - ' + (ra < 0 ? '(' + M.fixed(ra, 3) + ')' : M.fixed(ra, 3)) + '}{' + PG.angleTex(b) + ' - ' + PG.angleTex(a) + '} \\approx ' + M.fixed(m, 3) + '$') + '</li>' +
          '<li>' + esc(m > 0 ? 'On average r rises ' + num(m, 3) + ' for each radian θ turns.' : m < 0 ? 'On average r falls ' + num(-m, 3) + ' for each radian θ turns.' : 'r ends where it started: on average it does not change.') + '</li>' +
          '<li>' + esc(one ? 'The interval is one band: ' + (same.rs > 0 ? 'r > 0' : 'r < 0') + ' and r is ' + (same.ds > 0 ? 'increasing' : 'decreasing') + ' throughout, so the distance from the origin is ' + (same.dist === 'away' ? 'increasing' : same.dist === 'toward' ? 'decreasing' : 'constant') + '.' : 'The interval crosses a band edge, so the distance from the origin increases on part of it and decreases on another part. The average rate alone cannot tell you that.') + '</li></ol>';
      } else {
        if(Math.abs(rv) < 1e-9) head = esc('θ = ' + th + ': r = 0, so the curve passes through the origin here.');
        else if(Math.abs(c.slope(st.t)) < 1e-9 && c.spec.trig !== 'const') head = esc('θ = ' + th + ': r = ' + num(rv) + ' is a turning value of r, so the distance ' + num(Math.abs(rv)) + ' is ' + (Math.abs(rv) >= c.maxR - 1e-9 ? 'the greatest on the curve' : 'a turning point of the distance') + (rv < 0 ? ' (r < 0: the point is on the ray opposite θ).' : '.'));
        else if(rv > 0) head = esc('θ = ' + th + ': r = ' + num(rv) + '. r > 0 and r is ' + dirR + ', so ' + move + '.');
        else head = esc('θ = ' + th + ': r = ' + num(rv) + ' < 0, so the point is ' + num(-rv) + ' from the origin on the ray opposite θ. r is ' + dirR + ', so ' + move + '.');
        body = '<ol class="pg-feats"><li>' + html('$x = r\\cos\\theta = ' + M.fixed(xy[0], 3) + '$ and $y = r\\sin\\theta = ' + M.fixed(xy[1], 3) + '$.') + '</li>' +
          '<li>' + html('The distance from the origin is $|r|$. It increases where $r > 0$ and $r$ is increasing, or $r < 0$ and $r$ is decreasing (green bands); it decreases in the other two cases (pink bands).') + '</li>' +
          '<li>' + html(shapeRule()) + '</li></ol>';
      }
      T.explain($('.pg-say'), head, body);
      $('.pg-det').innerHTML = details();
      if(LS){
        if(head !== lastCap){ LS.caption(head, 'explore'); lastCap = head; }
        var ph = phoneNow();
        LS.pills(st.view === 'interval' ? [{ k: 'Δr/Δθ', html: num(PG.avgRate(c, st.t, st.t + width()), 3), tone: 'readout' }] :
          ph ? [{ html: 'θ ' + esc(th) + ' · <span class="pg-pv">r ' + num(rv) + '</span>', tone: 'ghost' }] :
          [{ k: 'θ', html: esc(th), tone: 'readout' }, { k: 'r', html: '<span class="pg-pv">' + num(rv) + '</span>', tone: 'readout' }, { k: '(x, y)', html: '(' + num(xy[0]) + ', ' + num(xy[1]) + ')', tone: 'readout' }], 'left', 'explore');
      }
      if(full) say(T.plainText(head));
    }
    function shapeRule(){
      var s = st.spec;
      if(s.fam === 'rose') return '$r = a\\' + s.trig + '(n\\theta)$ with $n = ' + s.n + '$ ' + (s.n % 2 ? 'odd: ' + s.n + ' petals, traced twice as $\\theta$ goes round once.' : 'even: $2n = ' + 2 * s.n + '$ petals; the negative values of $r$ draw half of them.');
      if(s.fam === 'limacon') return Math.abs(s.a) < Math.abs(s.b) ? '$|a| < |b|$: $r$ is negative for some $\\theta$, and those points draw the inner loop.' : Math.abs(s.a) === Math.abs(s.b) ? '$|a| = |b|$: $r$ touches 0 at one angle, the point of the cardioid.' : '$|a| > |b|$: $r$ never reaches 0, so there is no loop.';
      return s.trig === 'const' ? '$r = a$: every point is $|a|$ from the origin, a circle centered there.' : '$r = a\\' + s.trig + '\\theta$: a circle through the origin, diameter $|a| = ' + Math.abs(s.a) + '$; it is traced once as $\\theta$ goes from 0 to $\\pi$.';
    }
    function details(){
      var rows = [];
      for(var k = 0; k <= 12; k++){ var t = k * PI / 6, rv = c.f(t), xy = PG.rect(rv, t), on = Math.abs(t - st.t) < PI / 12 + 1e-9 && st.view === 'point';
        rows.push('<tr' + (on ? ' class="hl"' : '') + '><td>' + tex(PG.piTex(2 * k)) + '</td><td class="r">' + num(rv, 3) + '</td><td class="r">(' + num(xy[0], 3) + ', ' + num(xy[1], 3) + ')</td></tr>'); }
      var ps = PG.pieces(c).map(function(pc){ return '<tr><td>[' + esc(thetaText(pc.a)) + ', ' + esc(thetaText(pc.b)) + ']</td><td>' + (pc.rs > 0 ? '+' : pc.rs < 0 ? '−' : '0') + '</td><td>' + (pc.ds > 0 ? 'increasing' : pc.ds < 0 ? 'decreasing' : 'constant') + '</td><td>' + (pc.dist === 'away' ? '<b class="pg-tag is-away">increasing</b>' : pc.dist === 'toward' ? '<b class="pg-tag is-toward">decreasing</b>' : 'constant') + '</td></tr>'; }).join('');
      return '<h3 class="ls-title-l">' + tex(c.tex) + '</h3><p class="pg-shape">A ' + esc(c.shape) + '. ' + esc(c.period < TAU - 1e-9 ? 'It is traced once as θ goes from 0 to π, then again.' : 'It is traced once as θ goes from 0 to 2π.') + '</p>' +
        '<table class="ls-tbl"><caption class="sr-only">Values of r and the rectangular point at multiples of π/6</caption><thead><tr><th scope="col">θ</th><th scope="col" class="r">r</th><th scope="col" class="r">(x, y)</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>' +
        '<h3 class="ls-title-l">Where the distance from the origin changes</h3><table class="ls-tbl"><thead><tr><th scope="col">θ in</th><th scope="col">r</th><th scope="col">r is</th><th scope="col">distance |r|</th></tr></thead><tbody>' + ps + '</tbody></table>';
    }

    /* ------------------------------------------------ pointer and keys */
    (function(){
      var on = false;
      function toT(e){
        if(!geo) return st.t;
        var b = svg.getBoundingClientRect(), px = (e.clientX - b.left) * size[0] / b.width, py = (e.clientY - b.top) * size[1] / b.height;
        var inGraph = geo.gxf && px >= geo.gL - 10 && (geo.both ? (geo.wide ? px > geo.S : py > geo.S) : true);
        if(inGraph) return clamp((px - geo.gL) / (geo.gR - geo.gL) * TAU, 0, tMax());
        var t = Math.atan2(geo.cy - py, px - geo.cx); if(t < 0) t += TAU;
        // keep it continuous near 0 and 2π
        var best = t; [t - TAU, t + TAU].forEach(function(u){ if(u >= 0 && u <= TAU && Math.abs(u - st.t) < Math.abs(best - st.t)) best = u; });
        return clamp(best, 0, tMax());
      }
      svg.addEventListener('pointerdown', function(e){ pause(); on = true; st.traced = TAU; try{ svg.setPointerCapture(e.pointerId); }catch(er){} setT(toT(e)); });
      svg.addEventListener('pointermove', function(e){ if(on) setT(toT(e)); });
      svg.addEventListener('pointerup', function(){ on = false; });
      svg.addEventListener('pointercancel', function(){ on = false; });
      wrap.addEventListener('keydown', function(e){
        var k = e.key, d = k === 'ArrowRight' || k === 'ArrowUp' ? 1 : k === 'ArrowLeft' || k === 'ArrowDown' ? -1 : 0;
        if(k === 'Home'){ e.preventDefault(); pause(); return setT(0, true); }
        if(k === 'End'){ e.preventDefault(); pause(); st.traced = TAU; return setT(tMax(), true); }
        if(!d) return;
        e.preventDefault(); pause(); setT(Math.round((st.t + d * (e.shiftKey ? PI / 6 : PI / 24)) / (PI / 24)) * (PI / 24), true);
      });
    })();
    if(window.ResizeObserver){
      new ResizeObserver(function(){ var w = Math.round(wrap.clientWidth), h = Math.round(wrap.clientHeight); if(w && h && (Math.max(280, w) !== size[0] || Math.max(260, h) !== size[1])) draw(false); }).observe(wrap);
    }

    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'pcalc-ls-stage pg-ls-stage'; stage.appendChild(host.querySelector('.pg-stage'));
      s.add('stage', stage, o);
      var dock = document.createElement('div'); dock.className = 'pcalc-ls-dock pg-ls-dock'; dock.appendChild(host.querySelector('.pg-ctl'));
      if(more){
        var row = document.createElement('button');
        row.type = 'button'; row.className = 'ls-linkrow pcalc-ls-setup';
        row.innerHTML = '<span><span class="ls-k">Curve settings</span><span class="ls-v">a, b, n, cos or sin</span></span>' + window.LevlStudio.icon('more');
        row.setAttribute('aria-label', 'Curve settings: a, b, n, cos or sin, the interval width (opens Details)');
        row.addEventListener('click', function(){ s.open('details', more.querySelector('summary')); });
        dock.appendChild(row);
      }
      s.add('dock', dock, o);
      var why = document.createElement('div'); why.className = 'ls-sec pcalc-ls-why pg-ls-why'; why.appendChild(cue.el); why.appendChild(host.querySelector('.pg-say'));
      s.add('why', why, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      var det = document.createElement('div'); det.className = 'ls-sec pcalc-ls-det pg-ls-det';
      if(more){ more.classList.add('pcalc-ls-more'); more.open = true; more.querySelector('summary').textContent = 'Curve settings'; det.appendChild(more); }
      det.appendChild(host.querySelector('.pg-det'));
      s.add('details', det, o);
      lastCap = '';
      draw(true);
      if(s.mode() === 'explore') s.hint({ target: playBtn, text: 'Play to watch the curve draw itself', key: 'apprecalc-polar-graphs-play' });
    }
    buildChips(); buildParams(); buildSlider();
    st.traced = TAU; draw(true);
    return { pause: pause, studio: studio };
  }

  /* ============================================================ test yourself */
  var METHOD = {
    x: 'x = r cos θ: multiply r, sign included, by the cosine of the angle (radians).',
    y: 'y = r sin θ: multiply r, sign included, by the sine of the angle (radians).',
    quad: 'Read the signs of x and y you found. A negative r puts the point on the ray opposite the angle.',
    r: 'Put the angle into the equation, then use exact values: cos(π/3) = 1/2, sin(π/4) = √2/2 and so on.',
    t: 'First find the quadrant from the signs of x and y, then the angle there whose tangent is y/x.',
    shape: 'Rose: r = a cos(nθ) or a sin(nθ). Limaçon: r = a + b cos θ; compare |a| with |b|. Circle: r = a cos θ.',
    max: 'Find the largest value of |r|: where the trig part is 1 or −1.',
    avg: 'Average rate of change = (r(θ₂) − r(θ₁)) / (θ₂ − θ₁), with θ in radians.',
    reason: 'On the graph of r against θ: above or below the θ-axis gives the sign of r; rising or falling gives its direction.',
    dist: 'The distance is |r|. Same signs (r > 0 and increasing, or r < 0 and decreasing): increasing. Opposite: decreasing.'
  };
  function quiz(host, data){
    var fig = null;
    T.drill(host, data, { slug: 'polar-graphs', noun: 'drill',
      types: PG.KINDS.map(function(k){ return { value: k, label: PG.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: PG.generate, title: function(p){ return p.title; },
      extra: function(el, p){
        fig = drillFig(el, p);
        var s = studioNow();
        if(s) setTimeout(function(){ s.caption(String(p.text).replace(/<\/?p[^>]*>/g, ' ').trim(), 'quiz'); }, 0);
      },
      method: function(s){ return METHOD[s.key]; },
      onStep: function(s){ if(fig) fig.step(s.key); },
      onTry: function(s, t){ return fig ? fig.tryOn(s, t) : false; } });
  }
  /* The drill's figure: a polar grid (convert, graph) or the graph of r
     against θ (rates), filled in as each step is answered. */
  function drillFig(el, p){
    var f = p.fig, box = document.createElement('div'); box.className = 'pg-figwrap';
    box.innerHTML = '<svg class="pg-fig" role="img"></svg>'; el.appendChild(box);
    var svgEl = box.querySelector('svg'), done = {}, wrong = null, c = f.spec ? PG.curve(f.spec) : null, trace = null, traced = TAU;
    function dims(){
      var W = window.innerWidth || 1280, Hh = window.innerHeight || 800, bw = box.clientWidth, bh = box.clientHeight;
      if(bw > 100 && bh > 100) return [Math.round(bw), Math.round(bh)];
      if(W <= 640) return [340, Math.round(Math.max(260, Math.min(420, Hh * 0.58 - 80)))];
      return [600, 400];
    }
    function draw(){
      var d = dims(), o = { w: d[0], h: d[1], extra: { polar: [], graph: [] } }, label;
      if(f.kind === 'convert'){
        var R = Math.max(2, Math.ceil(Math.abs(f.r))), shown = f.shown || done.quad || done.y;
        o.polar = true; o.rmax = R; o.c = null;
        o.extra.polar.push(function(g){
          var out = [], cx = g.cx, cy = g.cy, k = g.k, toRect = !f.shown;
          var ray = function(t, cls){ var e = g.xy(t, R); return '<line class="' + cls + '" x1="' + r1(cx) + '" y1="' + r1(cy) + '" x2="' + r1(e[0]) + '" y2="' + r1(e[1]) + '"/>'; };
          if(toRect || done.t) out.push(ray(f.t, 'pg-ray is-strong'));
          if(toRect || done.r) out.push('<circle class="pg-ring" cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(Math.abs(f.r) * k) + '"/>');
          if(wrong && wrong.t != null){ out.push(ray(wrong.t, 'pg-yours')); var e = g.xy(wrong.t, R + 0.0); out.push('<text class="pg-yours-t" x="' + r1(e[0]) + '" y="' + r1(e[1] - 6) + '" text-anchor="middle">yours</text>'); }
          if(shown){
            var px = cx + f.x * k, py = cy - f.y * k;
            out.push('<line class="pg-proj" x1="' + r1(px) + '" y1="' + r1(py) + '" x2="' + r1(px) + '" y2="' + r1(cy) + '"/><line class="pg-proj" x1="' + r1(px) + '" y1="' + r1(py) + '" x2="' + r1(cx) + '" y2="' + r1(py) + '"/>');
            out.push('<line class="pg-rad' + (f.r < 0 ? ' is-neg' : '') + '" x1="' + r1(cx) + '" y1="' + r1(cy) + '" x2="' + r1(px) + '" y2="' + r1(py) + '"/><circle class="pg-pt" cx="' + r1(px) + '" cy="' + r1(py) + '" r="6.5"/>');
            out.push('<text class="pg-plab" x="' + r1(px + (f.x >= 0 ? 10 : -10)) + '" y="' + r1(py + (f.y >= 0 ? -10 : 18)) + '" text-anchor="' + (f.x >= 0 ? 'start' : 'end') + '">(' + num(f.x) + ', ' + num(f.y) + ')</text>');
          }
          return out.join('');
        });
        label = f.shown ? 'Polar grid with the point at x = ' + num(f.x) + ', y = ' + num(f.y) : 'Polar grid with the ray at θ = ' + PG.angleText(f.t) + ' and the circle of radius ' + Math.abs(f.r);
      } else if(f.kind === 'graph'){
        o.polar = true; o.c = c; o.rmax = niceR(c.maxR);
        if(done.shape){ o.traced = traced; o.ghost = false; o.bands = false; }
        else { o.traced = 0; }
        if(done.r){ o.point = true; o.theta = f.t; }
        if(done.max) o.extra.polar.push(function(g){ return '<circle class="pg-ring is-max" cx="' + r1(g.cx) + '" cy="' + r1(g.cy) + '" r="' + r1(c.maxR * g.k) + '"/>'; });
        if(!done.r) o.extra.polar.push(function(g){ var e = g.xy(f.t, o.rmax); return '<line class="pg-ray is-strong" x1="' + r1(g.cx) + '" y1="' + r1(g.cy) + '" x2="' + r1(e[0]) + '" y2="' + r1(e[1]) + '"/>'; });
        label = 'Polar grid for ' + X.text(c.tex) + (done.shape ? ', with the curve drawn' : '');
      } else {
        var after = done.dist;
        o.c = c; o.graph = true; o.polar = !!after; o.bands = !!after; o.interval = [f.t1, f.t2];
        if(done.avg) o.secant = { t1: f.t1, r1: f.r1, m: f.avg };
        if(wrong && wrong.m != null && isFinite(wrong.m)) o.extra.graph.push(function(g){
          var ta = f.t1, tb = f.t2 + (f.t2 - f.t1) * 0.3, ya = f.r1, yb = f.r1 + wrong.m * (tb - f.t1);
          return '<line class="pg-yours" x1="' + r1(g.gxf(ta)) + '" y1="' + r1(g.gyf(clamp(ya, g.lo, g.hi))) + '" x2="' + r1(g.gxf(tb)) + '" y2="' + r1(g.gyf(clamp(yb, g.lo, g.hi))) + '"/>';
        });
        label = 'Graph of r against θ for ' + X.text(c.tex) + ', with the interval from ' + PG.angleText(f.t1) + ' to ' + PG.angleText(f.t2) + ' marked';
      }
      var sc = scene(o);
      svgEl.setAttribute('viewBox', '0 0 ' + o.w + ' ' + o.h);
      svgEl.setAttribute('aria-label', label);
      svgEl.innerHTML = sc.svg;
    }
    function step(key){
      done[key] = true; wrong = null;
      if(f.kind === 'graph' && key === 'shape'){
        traced = 0;
        if(trace) trace.stop();
        trace = P.loop(function(dt, t){ traced = Math.min(TAU, TAU * t / 2.4); draw(); if(traced >= TAU) return false; }, { duration: 2.4, still: function(){ traced = TAU; }, onEnd: function(){ traced = TAU; draw(); } });
        trace.start();
      }
      draw();
    }
    function tryOn(s, t){
      if(t.ok) return false;
      if(f.kind === 'convert' && s.key === 't' && isFinite(t.value)){ wrong = { t: t.value }; draw(); return 'Your angle is the dashed ray; the point is on the solid one.'; }
      if(f.kind === 'rates' && s.key === 'avg' && isFinite(t.value)){ wrong = { m: t.value }; draw(); return 'The dashed line has your slope from the left end point; the secant line must pass through both marked points.'; }
      return false;
    }
    draw();
    var last = '';
    if(window.ResizeObserver) new ResizeObserver(function(){ var k = box.clientWidth + 'x' + box.clientHeight; if(k !== last){ last = k; draw(); } }).observe(box);
    return { step: step, tryOn: tryOn };
  }
})();
