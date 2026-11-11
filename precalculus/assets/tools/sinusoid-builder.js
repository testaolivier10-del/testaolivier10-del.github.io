/* Sinusoid builder (simulator, Premium; docs/apprecalc-spec.md section 6, the Q3
   trainer). OWNED BY THIS TOOL ONLY (builder T3, docs/apprecalc-briefs/t3.md).
   Model: ApPrecalcMath.sinusoidBuilder (precalculus/assets/tools/math/sinusoid-builder.js);
   frame: ApPrecalcTools.modes and drill on the Tool Studio; animation: ApPrecalcPlot.loop.

   Explore: a scene (Ferris wheel, tide, spring, a day of temperatures) beside
   its graph on the same vertical scale. The data are points; the student's
   model a sin(b(t + c)) + d (or cos) is the green curve over them, and each
   point it passes through turns green. Set a, d, the period and the shift
   with one slider (a segmented choice picks which), or drag the handles on
   the graph: the peak (a and the shift), the midline (d), the next peak
   (the period). Brackets show the amplitude and the period; the formula is
   colored part by part to match. Play runs time: the scene moves and a
   cursor walks the graph. Why: each parameter from the data. Details: the
   five key points, sine or cosine, the answer.

   Test yourself: amplitude, period, midline and shift from a formula
   (built up on the graph step by step); a model from a context; the five
   labeled points of one cycle; how the value and its rate change on an
   interval; a model from a table. Exact values, no calculator. */
(function(){
  'use strict';
  var T = window.ApPrecalcTools, M = window.ApPrecalcMath, P = window.ApPrecalcPlot, X = window.ApPrecalcTex;
  (function(){
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Key points & form');
  })();
  if(!T || !M || !M.sinusoidBuilder || M.sinusoidBuilder.stub || !P) return;
  var SB = M.sinusoidBuilder, esc = T.esc, PI = Math.PI, TAU = 2 * PI, NS = 'http://www.w3.org/2000/svg';
  function html(s){ return X ? X.html(s) : s; }
  function r1(v){ return Math.round(v * 10) / 10; }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function div(cls, kids){ var d = document.createElement('div'); d.className = cls; (kids || []).forEach(function(k){ if(k) d.appendChild(k); }); return d; }
  function txt(x, y, s, cls, anchor, extra){ return '<text x="' + r1(x) + '" y="' + r1(y) + '" class="' + cls + '" text-anchor="' + (anchor || 'middle') + '"' + (extra || '') + '>' + s + '</text>'; }
  function niceStep(span, n){ var raw = span / (n || 6), p = Math.pow(10, Math.floor(Math.log10(raw))); var ms = [1, 2, 2.5, 5, 10]; for(var i = 0; i < ms.length; i++) if(raw <= ms[i] * p + 1e-9) return ms[i] * p; return 10 * p; }
  var nt = SB.nt;
  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>';
  var PNAME = { a: 'Amplitude a', d: 'Midline d', T: 'Period', c: 'Shift c' };

  T.mount('sinusoid-builder', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'sinusoid-builder',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.pause(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------------ scene art */
  /* Draws a scene at time t: o = { x0, x1 (panel), sy(v) (the vertical scale), val (the value now), tr (truth) }. */
  function sceneArt(sc, o){
    var out = [], xm = (o.x0 + o.x1) / 2, s = sc.s, tr = o.tr, ground = o.sy(Math.max(sc.y[0], 0));
    if(sc.id === 'ferris'){
      var cy = o.sy(tr.D), rw = Math.abs(o.sy(tr.D + tr.A) - cy), base = o.sy(0);
      out.push('<path class="sb-frame" d="M' + r1(xm - rw * 0.62) + ' ' + r1(base) + ' L' + r1(xm) + ' ' + r1(cy) + ' L' + r1(xm + rw * 0.62) + ' ' + r1(base) + '"/>');
      out.push('<line class="sb-ground" x1="' + o.x0 + '" y1="' + r1(base) + '" x2="' + o.x1 + '" y2="' + r1(base) + '"/>');
      out.push('<rect class="sb-plat" x="' + r1(xm - 26) + '" y="' + r1(o.sy(s.min)) + '" width="52" height="' + r1(Math.max(2, base - o.sy(s.min))) + '"/>');
      out.push('<circle class="sb-wheel" cx="' + r1(xm) + '" cy="' + r1(cy) + '" r="' + r1(rw) + '"/>');
      var phi = PI / 2 + TAU * (o.t - tr.tPk) / s.T;
      for(var k = 0; k < 8; k++){
        var an = phi + k * PI / 4, ex = xm + rw * Math.cos(an), ey = cy - rw * Math.sin(an);
        out.push('<line class="sb-spoke" x1="' + r1(xm) + '" y1="' + r1(cy) + '" x2="' + r1(ex) + '" y2="' + r1(ey) + '"/>');
        out.push('<rect class="sb-cab' + (k ? '' : ' is-me') + '" x="' + r1(ex - 7) + '" y="' + r1(ey - 3) + '" width="14" height="12" rx="3"/>');
      }
      out.push('<circle class="sb-hub" cx="' + r1(xm) + '" cy="' + r1(cy) + '" r="5"/>');
      if(o.p && o.share){
        // the student's model as a wheel: rim radius a around a hub at height d (dashed, clipped to the panel)
        var gcy = o.sy(o.p.d), grw = Math.abs(o.sy(o.p.d + o.p.a) - gcy), same = Math.abs(o.p.a - tr.A) < 1e-9 && Math.abs(o.p.d - tr.D) < 1e-9;
        if(!same){
          out.push('<g clip-path="url(#' + o.clip + ')"><circle class="sb-ghost" cx="' + r1(xm) + '" cy="' + r1(gcy) + '" r="' + r1(Math.max(1, grw)) + '"/>' +
            '<line class="sb-ghost-hub" x1="' + r1(xm - 9) + '" y1="' + r1(gcy) + '" x2="' + r1(xm + 9) + '" y2="' + r1(gcy) + '"/></g>');
          var gl = gcy - grw - 8 < o.top + 4 ? Math.min(gcy + grw + 20, o.bot - 6) : gcy - grw - 8;
          out.push(txt(xm, gl, 'your wheel', 'sb-lab sb-ghost-l'));
        }
      }
      return { svg: out.join(''), mx: xm + rw * Math.cos(phi) + 7, my: o.sy(o.val) };
    }
    if(sc.id === 'tide'){
      var px = o.x0 + 34, wy = o.sy(o.val), bed = o.sy(0);
      out.push('<rect class="sb-sky" x="' + o.x0 + '" y="' + r1(o.sy(sc.y[1])) + '" width="' + (o.x1 - o.x0) + '" height="' + r1(bed - o.sy(sc.y[1])) + '"/>');
      var d = 'M' + o.x0 + ' ' + r1(bed) + ' L' + o.x0 + ' ' + r1(wy);
      for(var i = 0; i <= 24; i++){ var x = o.x0 + (o.x1 - o.x0) * i / 24; d += ' L' + r1(x) + ' ' + r1(wy + 2.5 * Math.sin(i * 1.3 + o.t * 2)); }
      out.push('<path class="sb-water" d="' + d + ' L' + o.x1 + ' ' + r1(bed) + ' Z"/>');
      out.push('<rect class="sb-bed" x="' + o.x0 + '" y="' + r1(bed) + '" width="' + (o.x1 - o.x0) + '" height="10"/>');
      out.push('<rect class="sb-pile" x="' + (px - 7) + '" y="' + r1(o.sy(sc.y[1]) + 6) + '" width="14" height="' + r1(bed - o.sy(sc.y[1]) - 6) + '"/>');
      for(var v = 0; v <= sc.y[1]; v += 2){ out.push('<line class="sb-mark" x1="' + (px + 7) + '" y1="' + r1(o.sy(v)) + '" x2="' + (px + 16) + '" y2="' + r1(o.sy(v)) + '"/>', txt(px + 19, o.sy(v) + 4, v, 'sb-mk', 'start')); }
      var bx = (o.x0 + o.x1) / 2 + 30;
      out.push('<path class="sb-boat" d="M' + r1(bx - 30) + ' ' + r1(wy - 8) + ' L' + r1(bx + 30) + ' ' + r1(wy - 8) + ' L' + r1(bx + 20) + ' ' + r1(wy + 4) + ' L' + r1(bx - 20) + ' ' + r1(wy + 4) + ' Z"/><line class="sb-mast" x1="' + r1(bx) + '" y1="' + r1(wy - 8) + '" x2="' + r1(bx) + '" y2="' + r1(wy - 40) + '"/><path class="sb-sail" d="M' + r1(bx + 2) + ' ' + r1(wy - 38) + ' L' + r1(bx + 22) + ' ' + r1(wy - 12) + ' L' + r1(bx + 2) + ' ' + r1(wy - 12) + ' Z"/>');
      return { svg: out.join(''), mx: bx + 30, my: wy };
    }
    if(sc.id === 'spring'){
      var top = o.sy(sc.y[1]) + 4, my = o.sy(o.val), hh = Math.abs(o.sy(2.5) - o.sy(0)) * 2 || 20, fl = o.sy(0);
      out.push('<rect class="sb-ceil" x="' + r1(xm - 60) + '" y="' + r1(top - 8) + '" width="120" height="8"/>');
      out.push('<line class="sb-ground" x1="' + o.x0 + '" y1="' + r1(fl) + '" x2="' + o.x1 + '" y2="' + r1(fl) + '"/>');
      var s0 = top, s1 = my - hh / 2, n = 14, zz = 'M' + r1(xm) + ' ' + r1(s0);
      for(var j = 1; j < n; j++) zz += ' L' + r1(xm + (j % 2 ? 14 : -14)) + ' ' + r1(s0 + (s1 - s0) * j / n);
      zz += ' L' + r1(xm) + ' ' + r1(s1);
      out.push('<path class="sb-coil" d="' + zz + '"/>');
      out.push('<rect class="sb-mass" x="' + r1(xm - 22) + '" y="' + r1(my - hh / 2) + '" width="44" height="' + r1(hh) + '" rx="5"/>');
      out.push('<line class="sb-rest" x1="' + r1(xm - 40) + '" y1="' + r1(o.sy(tr.D)) + '" x2="' + r1(xm + 40) + '" y2="' + r1(o.sy(tr.D)) + '"/>', txt(xm - 44, o.sy(tr.D) + 4, 'rest', 'sb-mk', 'end'));
      return { svg: out.join(''), mx: xm + 22, my: my };
    }
    // a thermometer
    var tx = xm, y0 = o.sy(sc.y[0]), y1 = o.sy(sc.y[1]), ly = o.sy(o.val);
    out.push('<rect class="sb-tube" x="' + r1(tx - 9) + '" y="' + r1(y1) + '" width="18" height="' + r1(y0 - y1 + 4) + '" rx="9"/>');
    out.push('<rect class="sb-fluid" x="' + r1(tx - 5) + '" y="' + r1(ly) + '" width="10" height="' + r1(y0 - ly + 8) + '" rx="4"/>');
    out.push('<circle class="sb-bulb" cx="' + r1(tx) + '" cy="' + r1(y0 + 18) + '" r="15"/>');
    for(var tv = Math.ceil(sc.y[0] / 4) * 4; tv <= sc.y[1]; tv += 4) out.push('<line class="sb-mark" x1="' + r1(tx + 11) + '" y1="' + r1(o.sy(tv)) + '" x2="' + r1(tx + 19) + '" y2="' + r1(o.sy(tv)) + '"/>', txt(tx + 22, o.sy(tv) + 4, tv + '°', 'sb-mk', 'start'));
    return { svg: out.join(''), mx: tx + 9, my: ly };
  }

  /* ============================================================ explore */
  function explore(host){
    var id = T.nid('sb'), clipId = id + '-clip';
    var st = { sid: SB.SORDER[0], sel: 'a', form: 'sin', t: 0, touched: false, p: null };
    var LS = null, L = null, lastCap = '';
    var cue = T.cue('Pick <b>a</b>, <b>d</b>, <b>Period</b> or <b>Shift</b> and move the slider, or drag a handle on the graph, until your curve passes through every point.');
    host.innerHTML =
      '<section class="bt-problem sb-card" aria-label="Sinusoid builder">' +
        '<div class="sb-stage"><div class="sb-wrap"><svg class="sb-svg" role="group" aria-label="A periodic scene beside the graph of its data and your model"><g class="sb-dyn" aria-hidden="true"></g></svg></div></div>' +
        '<div class="sb-ctl">' +
          '<div class="ls-scroll sb-scenes" role="group" aria-label="Situation"></div>' +
          '<div class="ls-seg sb-params" role="group" aria-label="Parameter to set"></div>' +
          '<div class="bt-ctl bt-slider sb-sl"><label for="' + id + '-s"></label><div class="bt-slider-row">' +
            '<button type="button" class="bt-step" data-d="-1">−</button><input type="range" id="' + id + '-s"><button type="button" class="bt-step" data-d="1">+</button>' +
            '<output class="bt-out sb-out" for="' + id + '-s" aria-hidden="true"></output></div></div>' +
          '<div class="sb-row"><button type="button" class="bt-btn sb-play" aria-pressed="false">' + ICON_PLAY + '<span>Play time</span></button></div>' +
        '</div>' +
        '<div class="sb-say"></div><div class="sb-det"></div><p class="sr-only sb-live"></p>' +
      '</section>';
    var card = host.querySelector('.sb-card');
    card.insertBefore(cue.el, card.querySelector('.sb-say'));
    var wrap = host.querySelector('.sb-wrap'), svg = host.querySelector('.sb-svg'), gD = svg.querySelector('.sb-dyn');
    var ctl = host.querySelector('.sb-ctl'), say = host.querySelector('.sb-say'), det = host.querySelector('.sb-det');
    var range = host.querySelector('#' + id + '-s'), lab = host.querySelector('.sb-sl label'), out = host.querySelector('.sb-out'), playBtn = host.querySelector('.sb-play');
    var announce = T.announcer(host.querySelector('.sb-live'));
    function sc(){ return SB.SCENES[st.sid]; }
    function tr(){ return SB.truth(sc().s); }
    function data(){ return SB.sceneData(sc()); }
    function tol(){ return 0.03 * (sc().s.max - sc().s.min) + (sc().table ? 0.06 : 0); }
    function reset(){ var sl = sc().sl; st.p = { a: sl.a[3], d: sl.d[3], T: sl.T[3], c: sl.c[3], form: st.form }; st.t = 0; }

    /* ---------------------------------------------------- layout */
    function layout(){
      var w = wrap.clientWidth || 900, h = wrap.clientHeight || 480, wide = w / Math.max(1, h) > 1.05, H;
      if(sc().id === 'ferris') return wheelLayout(wide, w, h);
      if(wide){ H = Math.round(clamp(1000 * h / Math.max(1, w), 470, 760)); return { wide: true, W: 1000, H: H, sx0: 24, sx1: 330, gx0: 400, gx1: 972, top: 100, bot: H - 46, f1: 34, f2: 66, fs: 22 }; }
      H = Math.round(clamp(400 * h / Math.max(1, w), 560, 900));
      var sh = Math.round(H * 0.3);
      return { wide: false, W: 400, H: H, sx0: 20, sx1: 380, sTop: 62, sBot: 62 + sh, gx0: 44, gx1: 386, top: 62 + sh + 26, bot: H - 92, f1: 22, f2: 46, fs: 16 };
    }
    /* The Ferris wheel always shares the graph's vertical scale: the wheel stands
       to the left of the h axis, its hub on the true midline and its rim on the
       highest and lowest seats, so a horizontal dashed line joins the rider's
       cabin to the point it draws on the graph. The plot is only as tall as lets
       the wheel take about 40% of the width (a phone gets a short, wide-enough graph). */
    function wheelLayout(wide, w, h){
      var y = sc().y, k = 2 * tr().A / (y[1] - y[0]), W = wide ? 1000 : 400;
      var top = wide ? 100 : 74, dMax = wide ? 440 : 156, H0 = wide ? Math.round(clamp(1000 * h / Math.max(1, w), 470, 760)) : Math.round(clamp(400 * h / Math.max(1, w), 420, 900));
      var P = (H0 - (wide ? 46 : 64)) - top, D = Math.min(P * k, dMax);
      P = D / k;
      var bot = Math.round(top + P), sx0 = wide ? 22 : 6, sx1 = sx0 + D + (wide ? 16 : 6);
      return { wide: wide, wheel: true, W: W, H: bot + (wide ? 46 : 64), sx0: sx0, sx1: sx1, gx0: sx1 + (wide ? 44 : 30), gx1: W - (wide ? 28 : 12), top: top, bot: bot, f1: wide ? 34 : 22, f2: wide ? 66 : 46, fs: wide ? 22 : 16 };
    }
    function win(){ return 2 * sc().s.T; }
    function gx(t){ return L.gx0 + t / win() * (L.gx1 - L.gx0); }
    function gy(v){ var y = sc().y; return L.bot - (v - y[0]) / (y[1] - y[0]) * (L.bot - L.top); }
    function iy(py){ var y = sc().y; return y[0] + (L.bot - py) / (L.bot - L.top) * (y[1] - y[0]); }
    function it(px){ return (px - L.gx0) / (L.gx1 - L.gx0) * win(); }
    /* The scene shares the graph's vertical scale (then a dashed line links the
       scene to the graph); on a phone the stacked scenes get their own scale. */
    function shared(){ return !!L.wheel || (L.wide && sc().id !== 'ferris'); }
    function syScene(v){
      var y = sc().y;
      if(shared()) return gy(v);
      var top = L.wide ? L.top : L.sTop, bot = L.wide ? L.bot : L.sBot - (sc().id === 'temp' ? 34 : 8), /* a phone's thermometer keeps its bulb above the graph */ h = bot - top - (L.wide ? 0 : 8);
      return bot - (v - y[0]) / (y[1] - y[0]) * h;
    }
    /* ---------------------------------------------------- handles */
    var HANDLES = [['pk', 'Peak of your curve: up and down sets the amplitude, left and right the shift', 'sb-h-a'], ['md', 'Midline: up and down sets d', 'sb-h-d'], ['pr', 'Next peak: left and right sets the period', 'sb-h-T']];
    var hs = {};
    HANDLES.forEach(function(h){
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'sb-handle ' + h[2]); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'slider'); g.setAttribute('aria-label', h[1]);
      g.innerHTML = '<circle class="sb-halo" r="20"></circle><circle class="sb-hdot" r="9"></circle>';
      g.setAttribute('data-h', h[0]);
      svg.appendChild(g); hs[h[0]] = g;
    });
    function step(k){ return sc().sl[k][2]; }
    function setP(k, v, quiet){
      var sl = sc().sl[k];
      v = clamp(Math.round((v - sl[0]) / sl[2]) * sl[2] + sl[0], sl[0], sl[1]);
      st.p[k] = +v.toFixed(6);
      if(!st.touched){ st.touched = true; cue.done(); }
      draw();
      if(!quiet) announce(srText());
    }
    /* the first peak of the student's curve at or after t = 0 */
    function peak1(){ var p = st.p, base = p.form === 'cos' ? -p.c : -p.c + p.T / 4; return base - Math.floor(base / p.T) * p.T; }

    /* ---------------------------------------------------- draw */
    function draw(){
      if(!L){ L = layout(); svg.setAttribute('viewBox', '0 0 ' + L.W + ' ' + L.H); svg.classList.toggle('is-tall', !L.wide); svg.classList.toggle('is-wheel', !!L.wheel); }
      var S = sc(), TR = tr(), p = st.p, f = SB.model(p), o = [], dpts = data(), ok = SB.fit(p, dpts, tol()), y = S.y;
      // scene
      var art = sceneArt(S, { x0: L.sx0, x1: L.sx1, sy: syScene, val: TR.f(st.t), tr: TR, t: st.t, p: p, share: shared(), clip: clipId, top: L.top, bot: L.bot });
      o.push('<defs><clipPath id="' + clipId + '"><rect x="' + (L.sx0 - 4) + '" y="' + (L.top - 4) + '" width="' + (L.sx1 - L.sx0 + 8) + '" height="' + (L.bot - L.top + 8) + '"/></clipPath></defs>');
      o.push('<g class="sb-scene">' + art.svg + '</g>');
      // graph grid
      var ys = niceStep(y[1] - y[0], L.wide ? 6 : 5), xs = S.s.T / 4;
      while((L.gx1 - L.gx0) / (win() / xs) < (L.wide ? 52 : 40)) xs *= 2;
      for(var v = Math.ceil(y[0] / ys) * ys; v <= y[1] + 1e-9; v += ys) o.push('<line class="sb-grid" x1="' + L.gx0 + '" y1="' + r1(gy(v)) + '" x2="' + L.gx1 + '" y2="' + r1(gy(v)) + '"/>', txt(L.gx0 - 7, gy(v) + 5, nt(v), 'sb-tk', 'end'));
      for(var t = 0; t <= win() + 1e-9; t += xs) o.push('<line class="sb-grid" x1="' + r1(gx(t)) + '" y1="' + L.top + '" x2="' + r1(gx(t)) + '" y2="' + L.bot + '"/>', txt(gx(t), L.bot + 20, nt(t), 'sb-tk'));
      o.push('<line class="sb-axis" x1="' + L.gx0 + '" y1="' + L.bot + '" x2="' + L.gx1 + '" y2="' + L.bot + '"/><line class="sb-axis" x1="' + L.gx0 + '" y1="' + L.top + '" x2="' + L.gx0 + '" y2="' + L.bot + '"/>');
      o.push(txt(L.gx1, L.bot + 38, S.tName + ' (' + S.tUnit + ')', 'sb-axl', 'end'), txt(L.gx0 + 6, L.top - 8, S.yName + ' (' + S.yUnit + ')', 'sb-axl', 'start'));
      // the student's midline, amplitude and period
      var pk = peak1(), pk2 = pk + p.T, mid = gy(p.d);
      o.push('<line class="sb-midline" x1="' + L.gx0 + '" y1="' + r1(mid) + '" x2="' + L.gx1 + '" y2="' + r1(mid) + '"/>');
      o.push(txt(L.gx1 - 4, mid + 20 > L.bot - 2 ? Math.min(mid, L.bot) - 8 : mid + 20, 'y = ' + nt(p.d), 'sb-lab sb-c-d', 'end'));   // above the line when the line is on the t-axis
      // the curve, clipped to the plot
      var d = '', on = false;
      for(var i = 0; i <= 320; i++){ var tt = win() * i / 320, vv = f(tt); var py = gy(vv); if(py < L.top - 30 || py > L.bot + 30){ on = false; continue; } d += (on ? 'L' : 'M') + r1(gx(tt)) + ' ' + r1(py); on = true; }
      if(st.t > 0){
        // what the scene has drawn so far: its true value from t = 0 to now
        var tdz = '';
        for(var j = 0; j <= 240; j++){ var tj = st.t * j / 240; tdz += (j ? 'L' : 'M') + r1(gx(tj)) + ' ' + r1(gy(TR.f(tj))); }
        o.push('<path class="sb-trace" d="' + tdz + '"/>');
      }
      o.push('<path class="sb-curve" d="' + d + '"/>');
      // a model slid below the graph's window (a temperature midline of 0 on a 6 to 30 scale) keeps its marks off the axis numbers
      var inWin = mid <= L.bot + 1;
      if(pk <= win() && inWin){
        o.push('<line class="sb-amp" x1="' + r1(gx(pk)) + '" y1="' + r1(mid) + '" x2="' + r1(gx(pk)) + '" y2="' + r1(gy(p.d + p.a)) + '"/>');
        var left = gx(pk) - L.gx0 > 70; o.push(txt(gx(pk) + (left ? -10 : 26), (mid + gy(p.d + p.a)) / 2 + 5, 'a = ' + nt(p.a), 'sb-lab sb-c-a', left ? 'end' : 'start'));
      }
      var by = Math.max(L.top - 2, gy(p.d + p.a) - 16), px0 = gx(pk), px1 = gx(Math.min(pk2, win()));
      if(pk2 <= win() + 1e-9 && gy(p.d + p.a) <= L.bot){
        o.push('<path class="sb-per" d="M' + r1(px0) + ' ' + r1(by + 6) + ' V' + r1(by) + ' H' + r1(px1) + ' V' + r1(by + 6) + '"/>');
        o.push(txt((px0 + px1) / 2, by - 6, 'period ' + nt(p.T), 'sb-lab sb-c-T'));
      }
      // where a cycle starts: t = −c (rising midline crossing for sin, peak for cos)
      var s0 = -p.c; s0 = s0 - Math.floor(s0 / p.T) * p.T;
      if(s0 <= win() && inWin){
        var sY = p.form === 'cos' ? gy(p.d + p.a) : mid;
        o.push('<path class="sb-shift" d="M' + r1(gx(s0)) + ' ' + r1(sY + 4) + ' l-7 12 h14 z"/>', txt(gx(s0) + (gx(s0) - L.gx0 < 30 ? 3 : 0), sY + 32, 't = ' + nt(s0), 'sb-lab sb-c-c', gx(s0) - L.gx0 < 30 ? 'start' : L.gx1 - gx(s0) < 30 ? 'end' : 'middle'));   // beside the axis, clear of its tick numbers
      }
      // data points: green once the curve passes through
      dpts.forEach(function(q, k){
        if(q.t > win() + 1e-9) return;
        o.push('<circle class="sb-pt' + (ok[k] ? ' is-ok' : '') + '" cx="' + r1(gx(q.t)) + '" cy="' + r1(gy(q.y)) + '" r="' + (ok[k] ? 7 : 6.5) + '"/>');
      });
      // time cursor and the scene's value now
      var tc = gx(st.t), now = TR.f(st.t);
      o.push('<line class="sb-cur" x1="' + r1(tc) + '" y1="' + L.top + '" x2="' + r1(tc) + '" y2="' + L.bot + '"/>');
      o.push('<circle class="sb-now" cx="' + r1(tc) + '" cy="' + r1(gy(now)) + '" r="6"/>');
      if(shared()) o.push('<line class="sb-link" x1="' + r1(art.mx) + '" y1="' + r1(art.my) + '" x2="' + r1(tc) + '" y2="' + r1(gy(now)) + '"/>');
      // the formula, colored part by part, and the period line
      var b = TAU / p.T, bT = SB.piText(b), cT = p.c === 0 ? '' : ' ' + (p.c > 0 ? '+ ' : '− ') + nt(Math.abs(p.c));
      var fx = L.wide ? L.gx0 : L.W / 2, an = L.wide ? 'start' : 'middle';
      o.push(txt(fx, L.f1, '<tspan class="sb-c-y">' + S.yName + '(t) = </tspan><tspan class="sb-c-a">' + nt(p.a) + '</tspan> ' + p.form + '(<tspan class="sb-c-T">' + esc(bT) + '</tspan>(t<tspan class="sb-c-c">' + esc(cT) + '</tspan>)) <tspan class="sb-c-d">+ ' + nt(p.d) + '</tspan>', 'sb-formula', an));
      // pass 2: the period, b and frequency line moved off the picture into Key points & form
      var perl = det && det.querySelector('.sb-perline'); if(perl) perl.textContent = 'Period ' + nt(p.T) + ' ' + S.tUnit + ', so b = 2π/' + nt(p.T) + ' = ' + bT + ' and the frequency is ' + SB.n(1 / p.T) + ' per ' + S.tUnit + '.';
      gD.innerHTML = o.join('');
      // handles
      place('pk', gx(pk <= win() ? pk : pk - p.T), gy(p.d + p.a), pk <= win() || pk - p.T >= 0);
      place('md', gx(0) + 18, mid, true);
      place('pr', gx(pk2), gy(p.d + p.a), pk2 <= win() + 1e-9);
      hs.pk.setAttribute('aria-valuetext', 'amplitude ' + nt(p.a) + ', peak at t = ' + nt(pk)); hs.pk.setAttribute('aria-valuenow', String(p.a));
      hs.md.setAttribute('aria-valuetext', 'midline y = ' + nt(p.d)); hs.md.setAttribute('aria-valuenow', String(p.d));
      hs.pr.setAttribute('aria-valuetext', 'period ' + nt(p.T)); hs.pr.setAttribute('aria-valuenow', String(p.T));
      syncCtl(); words(ok); keyTable();
    }
    function place(k, x, y, show){ hs[k].setAttribute('transform', 'translate(' + r1(x) + ' ' + r1(y) + ')'); hs[k].style.display = show ? '' : 'none'; }
    function srText(){ var p = st.p, ok = SB.fit(p, data(), tol()); return sc().yName + '(t) = ' + nt(p.a) + ' ' + p.form + '(' + SB.piText(TAU / p.T) + '(t ' + (p.c >= 0 ? '+ ' : '− ') + nt(Math.abs(p.c)) + ')) + ' + nt(p.d) + '. ' + ok.filter(Boolean).length + ' of ' + ok.length + ' data points on your curve.'; }

    /* ---------------------------------------------------- dock */
    var chips = host.querySelector('.sb-scenes'), seg = host.querySelector('.sb-params');
    chips.innerHTML = SB.SORDER.map(function(k){ return '<button type="button" class="tchip" data-s="' + k + '" aria-pressed="' + (k === st.sid) + '">' + esc(SB.SCENES[k].name) + '</button>'; }).join('');
    seg.innerHTML = ['a', 'd', 'T', 'c'].map(function(k){ return '<button type="button" class="bt-mode" data-k="' + k + '" aria-pressed="' + (k === st.sel) + '"><span class="sb-pk sb-c-' + k + '">' + { a: 'a', d: 'd', T: 'period', c: 'shift c' }[k] + '</span><span class="sb-pv"></span></button>'; }).join('');
    chips.addEventListener('click', function(e){
      var b = e.target.closest('[data-s]'); if(!b) return;
      stopT(); st.sid = b.getAttribute('data-s'); reset(); L = null;
      chips.querySelectorAll('[data-s]').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
      draw(); announce(sc().name + '. ' + sc().story);
    });
    seg.addEventListener('click', function(e){ var b = e.target.closest('[data-k]'); if(!b) return; st.sel = b.getAttribute('data-k'); draw(); });
    function syncCtl(){
      var sl = sc().sl[st.sel], p = st.p;
      seg.querySelectorAll('[data-k]').forEach(function(b){ var k = b.getAttribute('data-k'); b.setAttribute('aria-pressed', String(k === st.sel)); b.querySelector('.sb-pv').textContent = nt(p[k]); });
      lab.textContent = PNAME[st.sel] + (st.sel === 'T' ? ' (' + sc().tUnit + ')' : '');
      range.min = sl[0]; range.max = sl[1]; range.step = sl[2]; range.value = p[st.sel];
      out.textContent = nt(p[st.sel]);
      range.setAttribute('aria-valuetext', PNAME[st.sel] + ' ' + nt(p[st.sel]));
      ctl.querySelectorAll('.sb-sl .bt-step').forEach(function(b){ b.setAttribute('aria-label', (b.getAttribute('data-d') > 0 ? 'Increase ' : 'Decrease ') + PNAME[st.sel].toLowerCase()); });
    }
    range.addEventListener('input', function(){ setP(st.sel, +range.value, true); });
    range.addEventListener('change', function(){ announce(srText()); });
    ctl.querySelectorAll('.sb-sl .bt-step').forEach(function(b){ b.addEventListener('click', function(){ setP(st.sel, st.p[st.sel] + (+b.getAttribute('data-d')) * step(st.sel)); }); });

    /* ---------------------------------------------------- words */
    function words(ok){
      var S = sc(), TR = tr(), p = st.p, n = ok.filter(Boolean).length, all = n === ok.length, A = TR.A, D = TR.D;
      var head;
      if(all) head = '<b>Your model fits every point.</b> ' + esc(S.yName) + '(t) = ' + nt(p.a) + ' ' + p.form + '(' + esc(SB.piText(TAU / p.T)) + '(t ' + (p.c >= 0 ? '+ ' : '− ') + nt(Math.abs(p.c)) + ')) + ' + nt(p.d) + '.';
      else if(st.sel === 'a') head = 'Amplitude: half the distance from lowest to highest. ' + (Math.abs(p.a - A) < 1e-9 ? 'Yours matches the data.' : 'The data swing ' + (A > p.a ? 'farther' : 'less') + ': ' + (A > p.a ? 'raise' : 'lower') + ' a.');
      else if(st.sel === 'd') head = 'Midline: halfway between the highest and lowest values. ' + (Math.abs(p.d - D) < 1e-9 ? 'Yours matches the data.' : 'Yours is ' + (p.d < D ? 'too low' : 'too high') + '.');
      else if(st.sel === 'T') head = 'Period: one full cycle, peak to peak. ' + (Math.abs(p.T - S.s.T) < 1e-9 ? 'Yours matches the data.' : 'Your cycle is too ' + (p.T < S.s.T ? 'short' : 'long') + '.');
      else head = (Math.abs(p.a - A) < 1e-9 && Math.abs(p.d - D) < 1e-9 && Math.abs(p.T - S.s.T) < 1e-9) ? 'Shift: slide the curve sideways until a peak sits on a highest point.' : 'Set a, d and the period first; then slide the shift.';
      var body = '<p>' + esc(S.story) + '</p>' +
        '<p><b class="sb-c-a">Amplitude</b> $a = \\frac{\\max - \\min}{2} = \\frac{' + nt(S.s.max) + ' - ' + nt(S.s.min) + '}{2}$ in the data.</p>' +
        '<p><b class="sb-c-d">Midline</b> $y = d$ with $d = \\frac{\\max + \\min}{2}$, halfway between the extremes.</p>' +
        '<p><b class="sb-c-T">Period</b>: the time from one peak to the next. Then $b = \\frac{2\\pi}{\\text{period}}$; the frequency is $\\frac{1}{\\text{period}}$ cycles per ' + esc(S.tUnit) + '. A larger $b$ squeezes the graph.</p>' +
        '<p><b class="sb-c-c">Shift</b>: in $a\\' + p.form + '(b(t + c)) + d$ the graph moves left by $c$ (right when $c < 0$). ' + (p.form === 'sin' ? 'Sine starts a cycle on the midline going up, at $t = -c$.' : 'Cosine starts a cycle at a peak, at $t = -c$.') + '</p>' +
        '<p><b>Rate of change.</b> Above the midline the graph is concave down: its rate of change is decreasing. Below it, concave up: the rate of change is increasing.</p>';
      T.explain(say, head, html(body));
      if(LS){
        var cap = T.sayHead(say);
        if(cap !== lastCap){ LS.caption(cap, 'explore'); lastCap = cap; }
        LS.pills([{ html: n + ' of ' + ok.length + ' points on your curve', tone: all ? 'good' : 'warn' }], 'left', 'explore');
        say.querySelectorAll('details.bt-why').forEach(function(x){ x.open = true; });
      }
    }

    /* ---------------------------------------------------- Details */
    function buildDetails(){
      det.innerHTML = '<h3 class="ls-title-l">Period, b and frequency</h3><p class="sb-perline"></p><h3 class="ls-title-l">The five key points of your model</h3><p class="bt-small">One cycle from where it starts, a quarter period apart. On the exam these are the labeled points of Q3.</p><div class="sb-keys"></div>' +
        '<h3 class="ls-title-l">Sine or cosine</h3><div class="ls-seg sb-form" role="group" aria-label="Form of the model"><button type="button" class="bt-mode" data-f="sin" aria-pressed="true">a sin(b(t + c)) + d</button><button type="button" class="bt-mode" data-f="cos" aria-pressed="false">a cos(b(t + c)) + d</button></div>' +
        '<p class="bt-small">Both forms can fit; only the shift changes. Cosine is sine shifted left a quarter period.</p>' +
        '<div class="sb-tbl"></div>' +
        '<div class="bt-actions"><button type="button" class="bt-btn sb-show">Show a model that fits</button><button type="button" class="bt-btn sb-reset">Start over</button></div>';
      det.querySelector('.sb-form').addEventListener('click', function(e){
        var b = e.target.closest('[data-f]'); if(!b) return;
        st.form = st.p.form = b.getAttribute('data-f');
        det.querySelectorAll('.sb-form [data-f]').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        draw(); announce(srText());
      });
      det.querySelector('.sb-show').addEventListener('click', function(){
        var TR = tr();
        st.p = { a: TR.A, d: TR.D, T: sc().s.T, c: st.form === 'cos' ? TR.cosC : TR.sinC, form: st.form };
        draw(); announce('Shown. ' + srText());
      });
      det.querySelector('.sb-reset').addEventListener('click', function(){ reset(); draw(); announce(srText()); });
    }
    function keyTable(){
      var S = sc(), kp = SB.keyPoints(st.p, 0);
      det.querySelector('.sb-keys').innerHTML = '<div class="table-wrap" tabindex="0" role="region" aria-label="Key points of your model"><table class="pcalc-data"><thead><tr><th scope="col">Point</th><th scope="col">t</th><th scope="col">' + esc(S.yName) + '(t)</th></tr></thead><tbody>' +
        kp.map(function(q, i){ return '<tr><th scope="row">P' + i + '</th><td>' + nt(q.t) + '</td><td>' + nt(Math.round(q.y * 1000) / 1000) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      det.querySelector('.sb-tbl').innerHTML = S.table ? '<h3 class="ls-title-l">The data</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Temperature data"><table class="pcalc-data"><thead><tr><th scope="col">t (hr)</th><th scope="col">F (°C)</th></tr></thead><tbody>' + data().map(function(q){ return '<tr><th scope="row">' + q.t + '</th><td>' + nt(q.y) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '';
    }

    /* ---------------------------------------------------- pointer + keyboard */
    function local(e){ var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(); var q = m ? pt.matrixTransform(m.inverse()) : pt; return [q.x, q.y]; }
    var drag = null;
    function dragTo(q){
      var p = st.p, tq = clamp(it(q[0]), 0, win()), vq = iy(q[1]);
      if(drag === 'pk'){ setP('a', Math.max(0, vq - p.d), true); var c = p.form === 'cos' ? -tq : p.T / 4 - tq; setP('c', SB.norm(c, p.T), true); }
      else if(drag === 'md') setP('d', vq, true);
      else if(drag === 'pr') setP('T', Math.max(sc().sl.T[0], tq - peak1()), true);
      else if(drag === 'time'){ st.t = tq; draw(); }
    }
    svg.addEventListener('pointerdown', function(e){
      if(!L) return;
      var h = e.target.closest('.sb-handle'), q = local(e);
      if(h) drag = h.getAttribute('data-h');
      else if(q[0] >= L.gx0 && q[0] <= L.gx1 && q[1] >= L.top - 10 && q[1] <= L.bot + 10) drag = 'time';
      else return;
      stopT();
      try{ svg.setPointerCapture(e.pointerId); }catch(err){}
      svg.classList.add('is-drag'); e.preventDefault();
      if(drag !== 'time') st.sel = drag === 'pk' ? (st.sel === 'c' ? 'c' : 'a') : drag === 'md' ? 'd' : 'T';
      dragTo(q);
    });
    svg.addEventListener('pointermove', function(e){ if(drag) dragTo(local(e)); });
    function up(){ if(drag){ drag = null; svg.classList.remove('is-drag'); announce(srText()); } }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    Object.keys(hs).forEach(function(k){
      hs[k].addEventListener('keydown', function(e){
        var key = e.key, p = st.p, sh = e.shiftKey ? 4 : 1;
        if(k === 'pk' && (key === 'ArrowUp' || key === 'ArrowDown')){ st.sel = 'a'; setP('a', p.a + (key === 'ArrowUp' ? 1 : -1) * step('a') * sh); }
        else if(k === 'pk' && (key === 'ArrowLeft' || key === 'ArrowRight')){ st.sel = 'c'; setP('c', p.c + (key === 'ArrowLeft' ? 1 : -1) * step('c') * sh); }
        else if(k === 'md' && (key === 'ArrowUp' || key === 'ArrowDown')){ st.sel = 'd'; setP('d', p.d + (key === 'ArrowUp' ? 1 : -1) * step('d') * sh); }
        else if(k === 'pr' && (key === 'ArrowLeft' || key === 'ArrowRight')){ st.sel = 'T'; setP('T', p.T + (key === 'ArrowRight' ? 1 : -1) * step('T') * sh); }
        else return;
        e.preventDefault();
      });
    });

    /* ---------------------------------------------------- Play: time runs */
    var DUR = 8, anim = P.loop(function(dt, t){ st.t = win() * Math.min(1, t / DUR); draw(); }, {
      duration: DUR, still: function(){ st.t = win(); draw(); },
      onEnd: function(){ playingT(false); }
    });
    function playingT(on){ playBtn.setAttribute('aria-pressed', String(on)); playBtn.innerHTML = (on ? ICON_PAUSE : ICON_PLAY) + '<span>' + (on ? 'Pause' : 'Play time') + '</span>'; }
    function stopT(){ if(anim.running()){ anim.stop(); playingT(false); } }
    playBtn.addEventListener('click', function(){
      if(anim.running()){ stopT(); return; }
      var from = st.t >= win() - 1e-6 ? 0 : st.t;
      anim.reset(); anim.once(from / win() * DUR); playingT(true); anim.start();
      if(!anim.running()) playingT(false);
    });

    if(window.ResizeObserver){
      var lastKey = '';
      new ResizeObserver(function(){ var n = layout(), key = n.wide + ':' + n.H; if(key !== lastKey && wrap.clientWidth){ lastKey = key; L = null; draw(); } }).observe(wrap);
    }
    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      s.add('stage', div('pcalc-ls-stage sb-ls-stage', [host.querySelector('.sb-stage')]), o);
      s.add('dock', div('pcalc-ls-dock sb-ls-dock', [ctl]), o);
      s.add('why', div('ls-sec pcalc-ls-why', [cue.el, say]), o);
      s.add('details', div('ls-sec pcalc-ls-det', [det]), o);
      lastCap = ''; L = null; draw();
      if(s.mode() === 'explore') s.hint({ target: range, text: 'Move the slider until your curve meets the points', key: 'apprecalc-sinusoid-builder-fit' });
    }
    reset(); buildDetails(); draw();
    return { pause: stopT, studio: studio };
  }

  /* ============================================================ test yourself */
  var METHOD = {
    amp: 'The amplitude is |a|, the number in front of sin or cos, without its sign.',
    per: 'The period is 2π / |b|. Factor b out of the parentheses first.',
    mid: 'The midline is the constant added outside: y = d.',
    shift: 'Factor out b: a sin(b(θ + c)) + d. Then θ + c moves the graph left by c, θ − c moves it right.',
    max: 'The highest value is the midline plus the amplitude: d + |a|.',
    a: 'Amplitude = (highest − lowest) / 2.',
    d: 'Midline = (highest + lowest) / 2.',
    T: 'One full cycle: from a maximum to the next maximum.',
    b: 'b = 2π / period.',
    model: 'Start from where the story starts: at a maximum use +a cos, at a minimum −a cos, on the midline going up +a sin. Then put in b and the shift.',
    pt: 'The labeled points are a quarter period apart, starting at P₀. Their values cycle through maximum, midline and minimum.',
    dir: 'Compare the values at the two ends of the interval.',
    rate: 'Look at the bend: concave up means the rate of change is increasing.',
    why: 'The rate of change is decided by the concavity, not by the direction or the sign of the values.'
  };
  function figDims(){ var W = window.innerWidth || 1280; return W > 999 ? [620, 380] : [360, 300]; }
  /* One cycle, unscaled, with P0..P4 (Q3 A and C). */
  function cycleSvg(f, done){
    var s = f.s, kinds = SB.PATTERN[s.start], dims = figDims(), W = dims[0], H = dims[1], x0 = 56, x1 = W - 26, top = 48, bot = H - 48;
    var yv = { max: top + 14, mid: (top + bot) / 2, min: bot - 14 }, tr = SB.truth(s), o = [];
    var X = function(i){ return x0 + 18 + (x1 - x0 - 36) * i / 4; };
    var Y = function(u){ return yv.mid - (yv.mid - yv.max) * Math.sin(u); };
    var phase = { max: PI / 2, min: -PI / 2, up: 0, down: PI }[s.start];
    o.push('<line class="sb-axis" x1="' + x0 + '" y1="' + (bot + 10) + '" x2="' + x1 + '" y2="' + (bot + 10) + '"/><line class="sb-axis" x1="' + x0 + '" y1="' + (top - 10) + '" x2="' + x0 + '" y2="' + (bot + 10) + '"/>');
    o.push(txt(x1, bot + 30, 't', 'sb-axl', 'end'), txt(x0 + 6, top - 18, f.y, 'sb-axl', 'start'), txt(x0 - 8, bot + 15, 'O', 'sb-tk', 'end'));
    o.push('<line class="sb-midline is-soft" x1="' + x0 + '" y1="' + yv.mid + '" x2="' + x1 + '" y2="' + yv.mid + '"/>');
    if(f.iv != null){ o.push('<rect class="sb-iv" x="' + r1(X(f.iv)) + '" y="' + (top - 6) + '" width="' + r1(X(1) - X(0)) + '" height="' + (bot - top + 12) + '"/>'); }
    var d = '';
    for(var i = 0; i <= 160; i++){ var u = i / 160; d += (i ? 'L' : 'M') + r1(X(4 * u)) + ' ' + r1(Y(phase + TAU * u)); }
    o.push('<path class="sb-curve" d="' + d + '"/>');
    if(f.iv != null && done.rate){
      var a = f.iv, m = a + 0.5;
      [[a, m], [m, a + 1]].forEach(function(h){ o.push('<line class="sb-sec" x1="' + r1(X(h[0])) + '" y1="' + r1(Y(phase + PI / 2 * h[0])) + '" x2="' + r1(X(h[1])) + '" y2="' + r1(Y(phase + PI / 2 * h[1])) + '"/>'); });
      o.push(txt((X(a) + X(a + 1)) / 2, top - 14, 'secants on two equal halves', 'sb-lab', 'middle'));
    }
    kinds.forEach(function(k, i){
      var px = X(i), py = yv[k], kp = tr.keys[i], shown = done['p' + i + 't'] && done['p' + i + 'y'];
      o.push('<circle class="sb-kp" cx="' + r1(px) + '" cy="' + r1(py) + '" r="6"/>');
      var lb = 'P' + i + (shown ? ' (' + SB.n(kp.t) + ', ' + SB.n(kp.y) + ')' : '');
      o.push(txt(px + (i === 4 ? -6 : i === 0 ? 6 : 0), py + (k === 'min' ? 24 : -12), lb, 'sb-lab sb-kpl', i === 4 ? 'end' : i === 0 ? 'start' : 'middle'));
    });
    return '<svg class="sb-dsvg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="One cycle of the graph of ' + esc(f.y) + ', not to scale, with five labeled points P0 to P4 a quarter cycle apart' + (f.iv != null ? ', and the interval from P' + f.iv + ' to P' + (f.iv + 1) + ' shaded' : '') + '.">' + o.join('') + '</svg>';
  }
  /* The plot spec of a context, table or transform figure (ApPrecalcPlot). */
  function plotSpec(p, stage){
    var f = p.fig, dims = figDims(), spec;
    if(f.kind === 'transform'){
      var tr = f.trig === 'sin' ? Math.sin : Math.cos, A = Math.abs(f.a), per = TAU / f.b, lo = Math.min(f.d - A, -A) - 0.8, hi = Math.max(f.d + A, A) + 0.8;
      var piX = Math.abs(per / PI - Math.round(per / PI * 2) / 2) < 1e-9;
      var x0 = -Math.max(Math.abs(f.c), per / 4) - 0.2, x1 = per <= TAU + 1e-9 ? 2 * per : 1.25 * per;
      if(x1 - x0 > 4.5 * PI) piX = false;
      var curves = [{ fn: function(x){ return tr(x); }, cls: 's5', dashed: true }];
      var cur = stage >= 4 ? function(x){ return f.a * tr(f.b * (x + f.c)) + f.d; } : stage >= 3 ? function(x){ return A * tr(f.b * x) + f.d; } : stage >= 2 ? function(x){ return A * tr(f.b * x); } : stage >= 1 ? function(x){ return A * tr(x); } : null;
      if(cur) curves.push({ fn: cur, cls: 's3', label: stage >= 4 ? 'f' : '' });
      spec = { label: 'The parent graph y = ' + f.trig + ' θ, dashed' + (cur ? ', and f built up step by step' : ''), width: dims[0], height: dims[1], x: [x0, x1], y: [lo, hi], piX: piX, xLabel: 'θ', yLabel: 'y', curves: curves };
      return spec;
    }
    var s = f.s, pts = f.kind === 'table' ? f.rows.map(function(r){ return { at: r, cls: 's2' }; }) : SB.dataPoints(s, 2 * s.T).map(function(q){ return { at: [q.t, q.y], cls: 's2' }; });
    var span = s.max - s.min, ylo = Math.min(0, s.min - span * 0.25), yhi = s.max + span * 0.25;
    return { label: (f.kind === 'table' ? 'The table values of g' : 'The data of the story: the highest, lowest and midline values a quarter period apart') + ', t from 0 to ' + 2 * s.T, width: dims[0], height: dims[1], x: [0, 2 * s.T], y: [ylo, yhi], xLabel: 't', yLabel: f.y || 'g', points: pts };
  }
  function drillFig(el, p, api){
    var f = p.fig, done = {}, stage = 0, box = document.createElement('figure');
    box.className = 'cd-fig sb-fig'; el.appendChild(box);
    if(f.kind === 'cycle'){
      var redrawC = function(){ box.innerHTML = cycleSvg(f, done); };
      redrawC();
      return { done: function(k){ done[k] = true; redrawC(); }, tryOn: function(){ return false; } };
    }
    if(f.kind === 'table' && api){
      // the table joins the figure, so the caption reads as words
      var tb = api.area.querySelector('.bt-context table');
      if(tb){ var w = document.createElement('div'); w.className = 'table-wrap sb-dtable'; w.setAttribute('tabindex', '0'); w.setAttribute('role', 'region'); w.setAttribute('aria-label', 'Values of g'); w.appendChild(tb); el.insertBefore(w, box); }
    }
    var fig = T.markedFigure(box, function(){ return plotSpec(p, stage); });
    var MARKS = f.kind === 'transform' ? { y: { mid: 1, max: 1 } } : { y: { d: 1 }, curve: { model: 1 } };
    var order = ['amp', 'per', 'mid', 'shift'];
    return {
      done: function(k){ if(f.kind === 'transform' && order.indexOf(k) > -1){ stage = Math.max(stage, order.indexOf(k) + 1); fig.redraw(); } },
      tryOn: T.tryOn(function(){ return fig; }, Object.assign({ v: f.kind === 'transform' ? 'θ' : 't' }, MARKS))
    };
  }
  function quiz(host, data){
    var fig = null;
    T.drill(host, data, { slug: 'sinusoid-builder', noun: 'drill',
      types: SB.KINDS.map(function(k){ return { value: k, label: SB.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: SB.generate, title: function(p){ return p.title; },
      extra: function(el, p, api){ fig = drillFig(el, p, api); },
      onStep: function(s){ if(fig) fig.done(s.key); },
      onTry: function(s, t){ return fig ? fig.tryOn(s, t) : false; },
      method: function(s){ return METHOD[s.key] || (/^p\d/.test(s.key) ? METHOD.pt : ''); } });
  }
})();
