/* Population growth trainer page (docs/apenv-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T1). Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.populationGrowth (environmental-science/assets/tools/math/population-growth.js),
   the content environmental-science/data/tools/population-growth.json (served
   filtered as assets/tool-data/population-growth.json).

   Explore has three views, kept apart on purpose (the exam's r/K vs
   survivorship mix-up):
     Growth        a deer herd on an island. Pick Exponential (J-curve),
                   Logistic (S-curve) or Overshoot; set the growth rate r and
                   the carrying capacity K. The curve is the model's yearly
                   numbers, coloured by phase (lag, exponential, slowing, at K,
                   overshoot, dieback); Play runs time forward (reduced motion:
                   the end state); arrow keys move the year marker. A gauge
                   reads N against K, and the rule of 70 doubling time is
                   marked on the J-curve.
     Survivorship  Type I, II and III on a log scale; tap one to see who
                   lives that way.
     r and K       the two reproductive strategies side by side, and a
                   disturbance that knocks both populations down so the r
                   population rebounds while the K population crawls back
                   (both logistic, from the same model).
   Test yourself: ApEnvTools.drill over the model's generate(): doubling time
   and year, projections, reading K and the fastest growth off a logistic
   curve, overshoot and dieback, survivorship curves, r and K traits. */
(function(){
  'use strict';
  var T = window.ApEnvTools, M = window.ApEnvMath, P = window.ApEnvPlot;
  if(!T || !M || !M.populationGrowth) return;
  var S = M.populationGrowth, esc = T.esc, nf = S.nf;
  var app0 = document.getElementById('app');
  if(app0 && !app0.getAttribute('data-details-title')) app0.setAttribute('data-details-title', 'Numbers & settings');
  function r1(v){ return Math.round(v * 10) / 10; }
  function tx(x, y, s, cls, anchor){ return '<text x="' + r1(x) + '" y="' + r1(y) + '"' + (cls ? ' class="' + cls + '"' : '') + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(s) + '</text>'; }
  function reduced(){ return P && P.reduced ? P.reduced() : T.reduced(); }
  var PHASE = { lag: 'Lag', exponential: 'Exponential', slowing: 'Slowing', 'at K': 'At K', overshoot: 'Overshoot', dieback: 'Dieback' };
  var PHASE_CLS = { lag: 'ph-lag', exponential: 'ph-exp', slowing: 'ph-slow', 'at K': 'ph-k', overshoot: 'ph-over', dieback: 'ph-die' };

  T.mount('population-growth', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'population-growth',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------- the growth plot */
  /* sim from S.simulate; o: { W, H, upto (the last year drawn), marker,
     showK, Kline (the changing K' of overshoot), td (mark the doubling),
     unit, tu, yMax, labels } */
  function growthSvg(sim, o){
    var W = o.W, H = o.H, ph = W < 520, L = ph ? 46 : 64, R = W - (ph ? 12 : 22), T0 = ph ? 30 : 34, B = H - (ph ? 38 : 44);
    var K0 = sim.K[0], Y = sim.t.length - 1, upto = o.upto == null ? Y : o.upto;
    var yMax = o.yMax || niceUp(Math.max(K0 * 1.25, sim.model === 'exp' ? K0 * 1.6 : 0, sim.model === 'over' ? sim.peak * 1.08 : 0));
    var x = function(t){ return L + (R - L) * t / Y; }, y = function(v){ return B - (B - T0) * Math.min(v, yMax * 1.02) / yMax; };
    var out = [], ticks = P ? P.ticks(0, yMax, ph ? 4 : 5) : [0, yMax / 2, yMax];
    ticks.forEach(function(v){ out.push('<line class="pg-grid" x1="' + L + '" x2="' + R + '" y1="' + r1(y(v)) + '" y2="' + r1(y(v)) + '"/>' + tx(L - 7, y(v) + 4, nf(v), 'pg-tk', 'end')); });
    // A tick label in the stage's Enlarge corner (bottom right, about 56 px) is
    // left out; its tick mark stays.
    (P ? P.ticks(0, Y, ph ? 4 : 8) : [0, Y]).forEach(function(t){ out.push('<line class="pg-tick" x1="' + r1(x(t)) + '" x2="' + r1(x(t)) + '" y1="' + B + '" y2="' + (B + 4) + '"/>' + (o.enl && x(t) > W - 60 ? '' : tx(x(t), B + 18, String(t), 'pg-tk', 'middle'))); });
    out.push('<line class="pg-axis" x1="' + L + '" x2="' + R + '" y1="' + B + '" y2="' + B + '"/><line class="pg-axis" x1="' + L + '" x2="' + L + '" y1="' + T0 + '" y2="' + B + '"/>');
    out.push(tx(L, T0 - 12, (o.unit || 'population'), 'pg-axl', 'start'), tx((L + R) / 2, H - 4, (o.tu || 'year') + 's', 'pg-axl', 'middle'));
    var placed = [];
    if(o.showK !== false){
      out.push('<line class="pg-K" x1="' + L + '" x2="' + R + '" y1="' + r1(y(K0)) + '" y2="' + r1(y(K0)) + '"/>');
      out.push(tx(R - 4, y(K0) - 7, 'K = ' + nf(K0), 'pg-Kl', 'end'));
      if(sim.model === 'over' && o.Kline !== false){
        var kp = sim.K.slice(0, upto + 1).map(function(k, i){ return r1(x(i)) + ',' + r1(y(k)); }).join(' ');
        out.push('<polyline class="pg-K2" points="' + kp + '"/>');
        if(sim.K[upto] < K0 * 0.9){ var kx = x(upto) - 4, ky = y(sim.K[upto]) + 18; out.push(tx(kx, ky, 'K after overgrazing', 'pg-K2l', 'end')); placed.push([kx - 70, ky], [kx - 20, ky]); }
      }
    }
    // The curve in phase colours: one polyline per run of the same phase.
    var runs = [], cur = null;
    for(var i = 0; i <= upto; i++){
      var phz = S.phase(sim, i), pt = [x(i), y(sim.n[i])];
      if(!cur || cur.ph !== phz){ if(cur) cur.pts.push(pt); cur = { ph: phz, pts: [pt], i0: i }; runs.push(cur); }
      else cur.pts.push(pt);
    }
    runs.forEach(function(rn){ out.push('<polyline class="pg-curve ' + (o.mono ? 'ph-exp' : PHASE_CLS[rn.ph]) + '" points="' + rn.pts.map(function(p){ return r1(p[0]) + ',' + r1(p[1]); }).join(' ') + '"/>'); });
    if(sim.model === 'exp' && sim.n[upto] > yMax) out.push('<path class="pg-off" d="M' + r1(x(upto) - 8) + ' ' + (T0 + 10) + 'l8 -10 8 10"/>' + tx(x(upto) - 12, T0 + 12, 'off the chart', 'pg-axl', 'end'));
    // Phase names under the curve, only where a run is wide enough to hold one.
    if(o.labels !== false && !o.mono){
      runs.forEach(function(rn){
        var w = rn.pts[rn.pts.length - 1][0] - rn.pts[0][0]; if(w < (ph ? 46 : 64)) return;
        var mid = rn.pts[Math.floor(rn.pts.length / 2)], lx = mid[0], ly = Math.min(B - 8, mid[1] + (rn.ph === 'overshoot' ? -14 : 20));
        if(rn.ph === 'at K') ly = mid[1] + 20;
        // On a steep rise a centred label under the point sits on the curve;
        // put it below and to the right, where a rising curve leaves room.
        var a0 = rn.pts[0], a1 = rn.pts[rn.pts.length - 1], anc = 'middle';
        if(rn.ph !== 'overshoot' && (a0[1] - a1[1]) / Math.max(1, a1[0] - a0[0]) > 0.6){ lx = mid[0] + 10; ly = Math.min(B - 8, mid[1] + 14); anc = 'start'; }
        if(placed.some(function(p){ return Math.abs(p[0] - lx) < 80 && Math.abs(p[1] - ly) < 18; })) return;
        placed.push([lx, ly]);
        out.push(tx(lx, ly, PHASE[rn.ph], 'pg-phl ' + PHASE_CLS[rn.ph], anc));
      });
    }
    if(o.td){
      var xd = x(o.td), yd = y(sim.n[0] * 2);
      out.push('<line class="pg-guide" x1="' + L + '" x2="' + r1(xd) + '" y1="' + r1(yd) + '" y2="' + r1(yd) + '"/><line class="pg-guide" x1="' + r1(xd) + '" x2="' + r1(xd) + '" y1="' + r1(yd) + '" y2="' + B + '"/>');
      out.push('<circle class="pg-dot" cx="' + r1(xd) + '" cy="' + r1(yd) + '" r="5"/>');
      out.push(tx(xd + 6, B - 8, o.tdLabel || 'doubled', 'pg-axl', 'start'));
    }
    if(o.marker != null){
      var mi = Math.max(0, Math.min(upto, o.marker)), mx = x(mi), my = y(sim.n[mi]);
      out.push('<line class="pg-now" x1="' + r1(mx) + '" x2="' + r1(mx) + '" y1="' + T0 + '" y2="' + B + '"/><circle class="pg-mark" cx="' + r1(mx) + '" cy="' + r1(my) + '" r="7"/>');
    }
    return out.join('');
  }
  function niceUp(v){ var p = Math.pow(10, Math.floor(Math.log10(v))), m = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; for(var i = 0; i < m.length; i++) if(v <= m[i] * p + 1e-9) return m[i] * p; return 10 * p; }

  /* ---------------------------------------------- survivorship plot */
  function survSvg(W, H, sel){
    var ph = W < 520, L = ph ? 48 : 64, R = W - (ph ? 54 : 90), T0 = 30, B = H - 44, lo = Math.log10(1), hi = Math.log10(1000);
    var x = function(i){ return L + (R - L) * i / 10; }, y = function(v){ return B - (B - T0) * (Math.log10(Math.max(1, v)) - lo) / (hi - lo); };
    var out = [];
    [1, 10, 100, 1000].forEach(function(v){ out.push('<line class="pg-grid" x1="' + L + '" x2="' + R + '" y1="' + r1(y(v)) + '" y2="' + r1(y(v)) + '"/>' + tx(L - 7, y(v) + 4, nf(v), 'pg-tk', 'end')); });
    [0, 25, 50, 75, 100].forEach(function(p){ var xx = x(p / 10); out.push(tx(xx, B + 18, p + '%', 'pg-tk', 'middle')); });
    out.push('<line class="pg-axis" x1="' + L + '" x2="' + R + '" y1="' + B + '" y2="' + B + '"/><line class="pg-axis" x1="' + L + '" x2="' + L + '" y1="' + T0 + '" y2="' + B + '"/>');
    out.push(tx(L, T0 - 12, 'survivors of 1,000 (log scale)', 'pg-axl', 'start'), tx(R, H - 6, 'age, % of the longest life span', 'pg-axl', 'end'));
    ['III', 'II', 'I'].forEach(function(t){
      var on = !sel || sel === t, pts = S.CURVES[t].map(function(v, i){ return r1(x(i)) + ',' + r1(y(v)); }).join(' ');
      out.push('<polyline class="pg-surv s-' + t + (on ? '' : ' is-dim') + (sel === t ? ' is-sel' : '') + '" points="' + pts + '"/>');
      var ly = { I: y(S.CURVES.I[8]) - 8, II: y(S.CURVES.II[5]) - 10, III: y(S.CURVES.III[3]) + 18 }[t], lx = { I: x(8), II: x(5), III: x(3) }[t];
      // Type II falls in a straight line: its label starts just right of the
      // point, above the line, so a narrow plot's slope never crosses it.
      out.push('<g class="pg-sl s-' + t + (on ? '' : ' is-dim') + '">' + tx(t === 'II' ? lx + 4 : lx, t === 'II' ? ly - 2 : ly, 'Type ' + t, '', t === 'II' ? 'start' : 'middle') + '</g>');
    });
    return out.join('');
  }

  /* ---------------------------------------- r and K: the two strategies */
  function rkSvg(W, H, st){
    var ph = W < 520, half = W / 2, out = [];
    // Top: the brood. Many small eggs for r, one large young with a parent for K.
    var top = ph ? 10 : 14, bh = ph ? 108 : 132;
    out.push('<rect class="pg-panel" x="6" y="' + top + '" width="' + (half - 12) + '" height="' + bh + '" rx="14"/><rect class="pg-panel" x="' + (half + 6) + '" y="' + top + '" width="' + (half - 12) + '" height="' + bh + '" rx="14"/>');
    out.push(tx(half / 2, top + 22, 'r-selected', 'pg-h', 'middle'), tx(half * 1.5, top + 22, 'K-selected', 'pg-h', 'middle'));
    var cx = half / 2, cy = top + (ph ? 58 : 66);
    for(var i = 0; i < 30; i++){ var a = i * 2.39996, rr = 4.2 * Math.sqrt(i + 0.5) * (ph ? 0.95 : 1.15); out.push('<circle class="pg-egg" cx="' + r1(cx + Math.cos(a) * rr * 1.6) + '" cy="' + r1(cy + Math.sin(a) * rr * 0.75) + '" r="' + (ph ? 3.4 : 4) + '"/>'); }
    var kx = half * 1.5, ky = top + (ph ? 62 : 72);
    out.push('<ellipse class="pg-parent" cx="' + r1(kx - 18) + '" cy="' + r1(ky) + '" rx="' + (ph ? 26 : 32) + '" ry="' + (ph ? 18 : 22) + '"/><circle class="pg-parent" cx="' + r1(kx - (ph ? 42 : 52)) + '" cy="' + r1(ky - 14) + '" r="' + (ph ? 10 : 12) + '"/>');
    out.push('<ellipse class="pg-young" cx="' + r1(kx + (ph ? 26 : 32)) + '" cy="' + r1(ky + 6) + '" rx="' + (ph ? 14 : 17) + '" ry="' + (ph ? 10 : 12) + '"/><circle class="pg-young" cx="' + r1(kx + (ph ? 40 : 50)) + '" cy="' + r1(ky - 2) + '" r="' + (ph ? 6 : 7) + '"/>');
    out.push('<path class="pg-care" d="M' + r1(kx + 6) + ' ' + r1(ky - 26) + 'c-6-8 -16-2 -10 6l10 9 10-9c6-8-4-14-10-6z"/>');
    out.push(tx(half / 2, top + bh - 8, ph ? 'many eggs, no care' : 'many small eggs, no care', 'pg-axl', 'middle'), tx(half * 1.5, top + bh - 8, ph ? 'one young, much care' : 'one large young, years of care', 'pg-axl', 'middle'));
    // Bottom: the disturbance. Two populations at K, both cut to 20%, recovering at their own r.
    var g0 = top + bh + (ph ? 18 : 24), gh = Math.min(H - g0 - 30, ph ? 999 : 300), gw = half - 30, ys = st.series;
    [['r', 12], ['K', half + 12]].forEach(function(s){
      var x0 = s[1] + 12, n = ys[s[0]], Y = n.length - 1, xx = function(t){ return x0 + gw * t / Y; }, yy = function(v){ return g0 + gh - gh * v / 1.15; };
      out.push('<line class="pg-axis" x1="' + x0 + '" x2="' + r1(x0 + gw) + '" y1="' + r1(g0 + gh) + '" y2="' + r1(g0 + gh) + '"/><line class="pg-axis" x1="' + x0 + '" x2="' + x0 + '" y1="' + g0 + '" y2="' + r1(g0 + gh) + '"/>');
      out.push('<line class="pg-K" x1="' + x0 + '" x2="' + r1(x0 + gw) + '" y1="' + r1(yy(1)) + '" y2="' + r1(yy(1)) + '"/>' + tx(x0 + gw, yy(1) - 6, 'K', 'pg-Kl', 'end'));
      var upto = st.upto == null ? Y : st.upto;
      out.push('<polyline class="pg-curve ' + (s[0] === 'r' ? 'ph-exp' : 'ph-k') + '" points="' + n.slice(0, upto + 1).map(function(v, t){ return r1(xx(t)) + ',' + r1(yy(v)); }).join(' ') + '"/>');
      if(st.hit != null && upto >= st.hit) out.push('<path class="pg-bolt" d="M' + r1(xx(st.hit) - 5) + ' ' + r1(g0 - 4) + 'l8 0 -5 9 7 0 -11 14 3 -10 -6 0z"/>');
      out.push(tx(x0 + gw / 2, g0 + gh + 18, 'years', 'pg-axl', 'middle'));
      var rec = st.rec && st.rec[s[0]];
      if(st.upto === Y && rec != null) out.push(tx(x0 + gw / 2, g0 + 14, 'back near K in ' + rec + ' yr', 'pg-phl ' + (s[0] === 'r' ? 'ph-exp' : 'ph-k'), 'middle'));
    });
    return out.join('');
  }
  /* Two populations at K, cut to 20% at year 4, recovering by the logistic model with each strategy's r. */
  function disturbance(){
    var Y = 40, hit = 4, out = { r: [], K: [] }, rec = {};
    [['r', 0.9], ['K', 0.12]].forEach(function(s){
      var N = 1, arr = [];
      for(var t = 0; t <= Y; t++){ if(t === hit) N = 0.2; arr.push(N); N = N + s[1] * N * (1 - N); }
      out[s[0]] = arr;
      for(var u = hit + 1; u <= Y; u++) if(arr[u] >= 0.9){ rec[s[0]] = u - hit; break; }
      if(rec[s[0]] == null) rec[s[0]] = '> ' + (Y - hit);
    });
    return { series: out, hit: hit, rec: rec, Y: Y };
  }

  /* ------------------------------------------------------- explore */
  function explore(host, data){
    var view = 'growth', model = 'log', r = 0.35, K = 2000, n0 = 100, years = 40, upto = 40, marker = 40, LS = null, touched = false, playing = null, sel = null, nid = T.nid('pg');
    var dist = disturbance(), distUpto = dist.Y, distLoop = null;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem pg-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Population growth</h2>' +
      '<div class="pg-stage">' +
        '<div class="pg-gauge" aria-hidden="true"></div>' +
        '<div class="pg-fig"><svg class="pg-svg" role="img" aria-label="Population growth graph" tabindex="0" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '</div>' +
      '<div class="pg-ctl">' +
        '<div class="pg-views tseg" role="group" aria-label="View"><button type="button" class="pg-view" data-v="growth" aria-pressed="true">Growth</button><button type="button" class="pg-view" data-v="surv" aria-pressed="false">Survivorship</button><button type="button" class="pg-view" data-v="rk" aria-pressed="false">r and K</button></div>' +
        '<div class="pg-g">' +
          '<div class="pg-models ls-scroll" role="group" aria-label="Growth model"><button type="button" class="tchip pg-m" data-m="exp" aria-pressed="false">Exponential</button><button type="button" class="tchip pg-m" data-m="log" aria-pressed="true">Logistic</button><button type="button" class="tchip pg-m" data-m="over" aria-pressed="false">Overshoot</button></div>' +
          '<div class="pg-sl-r"></div><div class="pg-sl-k"></div>' +
          '<div class="pg-act ls-act"><button type="button" class="btn-press sm ls-btn ls-pri pg-play">Play 40 years</button></div>' +
        '</div>' +
        '<div class="pg-s" hidden><div class="pg-types ls-scroll" role="group" aria-label="Survivorship curve"><button type="button" class="tchip pg-t" data-t="I" aria-pressed="false">Type I</button><button type="button" class="tchip pg-t" data-t="II" aria-pressed="false">Type II</button><button type="button" class="tchip pg-t" data-t="III" aria-pressed="false">Type III</button></div><div class="pg-who"></div></div>' +
        '<div class="pg-r" hidden><div class="pg-act ls-act"><button type="button" class="btn-press sm ls-btn ls-pri pg-hit">Hit both with a flood</button></div></div>' +
      '</div>' +
      '<div class="pg-say"></div>' +
      T.moreHtml('<div class="pg-n0"></div>', 'start size') +
      '<div class="pg-nums"></div><p class="sr-only pg-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.pg-live'));
    var cue = T.cue('Press Play, then switch to Exponential and Overshoot to compare the curves.');
    $('.pg-ctl').insertBefore(cue.el, $('.pg-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var slR = T.slider({ label: 'Growth rate r (per year)', min: 0.05, max: 0.6, step: 0.05, value: r, decimals: 2, onInput: function(v){ r = v; act(); stop(); upto = years; marker = years; draw(); } });
    var slK = T.slider({ label: 'Carrying capacity K (deer)', min: 500, max: 4000, step: 100, value: K, decimals: 0, onInput: function(v){ K = v; act(); stop(); upto = years; marker = years; draw(); } });
    var slN = T.slider({ label: 'Deer released at the start', min: 20, max: 400, step: 10, value: n0, decimals: 0, onInput: function(v){ n0 = v; act(); stop(); upto = years; marker = years; draw(); } });
    $('.pg-sl-r').appendChild(slR.el); $('.pg-sl-k').appendChild(slK.el); $('.pg-n0').appendChild(slN.el);
    var svg = $('.pg-svg');
    function sim(){ return S.simulate({ model: model, r: r, K: K, n0: n0, years: years, lag: 2, crash: 0.55 }); }
    function size(){ var b = svg.getBoundingClientRect(); return [Math.max(300, Math.round(b.width || 640)), Math.max(240, Math.round(b.height || 380))]; }
    function draw(){
      var wh = size(), W = wh[0], H = wh[1];
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      if(view === 'growth'){
        var s = sim(), td = model === 'exp' ? S.doublingTime(r) : null;
        svg.innerHTML = growthSvg(s, { W: W, H: H, enl: true, upto: upto, marker: marker, unit: 'deer', td: td && td <= upto ? td : null, tdLabel: td ? 'doubled in ' + nf(td, 1) + ' yr' : '' });
        svg.setAttribute('aria-label', aria(s));
        gauge(s);
        words(s, td);
      } else if(view === 'surv'){
        svg.innerHTML = survSvg(W, H, sel);
        svg.setAttribute('aria-label', 'Survivorship curves on a log scale: Type I stays high then drops late; Type II falls in a straight line; Type III drops steeply at the start.' + (sel ? ' Type ' + sel + ' is highlighted.' : ''));
        $('.pg-gauge').innerHTML = '';
        survWords();
      } else {
        svg.innerHTML = rkSvg(W, H, { series: dist.series, hit: dist.hit, upto: distUpto, rec: dist.rec });
        svg.setAttribute('aria-label', 'r-selected: many small eggs and no care. K-selected: one large young with a parent. Below, both populations are knocked to 20% of K by a flood; the r population is back near K in ' + dist.rec.r + ' years, the K population in ' + dist.rec.K + ' years.');
        $('.pg-gauge').innerHTML = '';
        rkWords();
      }
      (LS ? LS.root : host).querySelectorAll('.pg-m').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-m') === model)); });
      (LS ? LS.root : host).querySelectorAll('.pg-view').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === view)); });
      (LS ? LS.root : host).querySelectorAll('.pg-t').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-t') === sel)); });
      slK.disable(model === 'exp');
    }
    function aria(s){
      var i = marker, N = s.n[i];
      return (model === 'exp' ? 'Exponential growth' : model === 'log' ? 'Logistic growth' : 'Overshoot and dieback') + ' of a deer herd over ' + years + ' years. Year ' + i + ': ' + nf(N) + ' deer, phase ' + PHASE[S.phase(s, i)] + (model === 'exp' ? '.' : ', carrying capacity ' + nf(s.K[i]) + '.') + ' Arrow keys move the year.';
    }
    function gauge(s){
      var i = marker, N = s.n[i], Kc = s.K[i], ph = S.phase(s, i);
      $('.pg-gauge').innerHTML = (LS ? '' : '<span class="pg-gy">Year ' + i + '</span><span class="pg-gn"><b>' + esc(nf(N)) + '</b> deer</span>') +
        (model === 'exp' ? '' : '<span class="pg-gbar"><span class="pg-gfill ' + PHASE_CLS[ph] + '" style="width:' + Math.min(100, N / Kc * 100).toFixed(1) + '%"></span><span class="pg-gK"></span></span><span class="pg-gk">' + Math.round(N / Kc * 100) + '% of K</span>') +
        '<span class="pg-gph ' + PHASE_CLS[ph] + '">' + PHASE[ph] + '</span>';
    }
    function words(s, td){
      var i = marker, ph = S.phase(s, i), head, why = [];
      if(!touched && upto === years) head = model === 'log' ? 'An S-curve: fast growth, then slower as the herd nears K = ' + nf(K) + '. Press Play to watch it grow.' : '';
      if(!head){
        if(model === 'exp') head = 'A J-curve: with unlimited food the herd doubles every ' + nf(td, 1) + ' years (70 ÷ ' + nf(r * 100) + '%). Year ' + i + ': ' + nf(s.n[i]) + ' deer.';
        else if(model === 'log') head = { lag: 'Lag: few breeders, so few births. Growth is slow at first.', exponential: 'Fast growth: plenty of food and many breeders.', slowing: 'Slowing: food and space run short as the herd nears K.', 'at K': 'At carrying capacity: births balance deaths at about ' + nf(K) + ' deer.' }[ph] || '';
        else head = ph === 'overshoot' ? 'Overshoot: the herd passed K = ' + nf(K) + ' before the shortage caught up with it.' : ph === 'dieback' ? 'Dieback: the range was overgrazed; deaths outrun births and K itself has dropped.' : i > s.peakT ? 'After the crash the herd regrows, then settles near the lower K of the damaged range, about ' + nf(s.K[i]) + '.' : 'Growing fast toward K = ' + nf(K) + '. Watch what happens when it gets there.';
      }
      why.push('<p><b>Exponential (J-curve).</b> With unlimited resources each year adds r × N, so the more deer, the faster it grows. The rule of 70 gives the doubling time: 70 ÷ (r in percent).</p>');
      why.push('<p><b>Logistic (S-curve).</b> Limiting resources (food, water, space) slow growth by a factor (1 − N/K). Growth is fastest at K/2 and stops at K, the carrying capacity: the most the habitat can support over time.</p>');
      why.push('<p><b>Overshoot and dieback.</b> Crowding takes time to bite (here, two years), so the herd passes K, eats the range faster than it regrows, and crashes. The damaged range has a lower K for years after.</p>');
      why.push('<p class="bt-small">Survivorship curves and r- and K-selection are separate views: they answer different questions (when individuals die, how they reproduce).</p>');
      T.explain($('.pg-say'), '<b>' + esc(head) + '</b>', why.join(''));
      nums(s, td);
      say(head);
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>', 'explore');
        LS.pills([{ k: 'Year ' + i, html: esc(nf(s.n[i])) + ' deer', tone: 'readout' }], 'left', 'explore');
        LS.pills(model === 'exp' ? [{ k: 'Doubles', html: 'every ' + nf(td, 1) + ' yr', tone: 'accent' }] : [{ k: 'K', html: esc(nf(s.K[i])), tone: ph === 'overshoot' || ph === 'dieback' ? 'warn' : 'accent' }], 'right', 'explore');
      }
    }
    function nums(s, td){
      var rows = [0, 5, 10, 15, 20, 25, 30, 35, 40].map(function(y){ return '<tr><th scope="row">' + y + '</th><td class="r">' + nf(s.n[y]) + '</td><td class="r">' + (model === 'exp' ? '·' : nf(s.K[y])) + '</td><td>' + PHASE[S.phase(s, y)] + '</td></tr>'; }).join('');
      $('.pg-nums').innerHTML = '<h3 class="ls-title-l">The numbers behind the curve</h3>' +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Deer by year"><table class="ls-tbl"><caption class="sr-only">Deer, carrying capacity and phase every 5 years</caption><thead><tr><th scope="col">Year</th><th scope="col">Deer</th><th scope="col">K</th><th scope="col">Phase</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="bt-small">r = ' + nf(r, 2) + ' per year (' + nf(r * 100) + '%)' + (td ? '; doubling time 70 / ' + nf(r * 100) + ' = ' + nf(td, 1) + ' years' : '') + '. ' + (model === 'over' ? 'Peak ' + nf(s.peak) + ' in year ' + s.peakT + '.' : '') + '</p>';
    }
    function survWords(){
      var info = sel ? S.CURVE_INFO[sel] : null;
      var head = info ? info.name + ': ' + info.what : 'Three ways a population can lose its members over a lifetime. Tap a type.';
      $('.pg-who').innerHTML = info ? '<p class="pg-whoh">Who lives this way</p><ul class="pg-wl">' + info.who.map(function(w){ return '<li>' + esc(w) + '</li>'; }).join('') + '</ul><p class="bt-small">Usually with ' + esc(info.care) + '.</p>' : '';
      var why = '<p><b>How to read it.</b> Start at 1,000 newborns and follow how many are still alive at each age. The y axis is a log scale, so a steady death rate (the same share dying each year) is a straight line: Type II.</p>' +
        '<p><b>Type I</b>: high survival until old age (humans, elephants). <b>Type II</b>: a constant rate (many birds, lizards). <b>Type III</b>: most die young; the survivors live long (oysters, sea turtles, many fish and plants).</p>' +
        '<p><b>Not the same as r and K.</b> Survivorship says when individuals die. r- and K-selection say how they reproduce. K-selected species often have Type I curves and r-selected species Type III, but the two ideas are not interchangeable.</p>';
      T.explain($('.pg-say'), '<b>' + esc(head) + '</b>', why);
      $('.pg-nums').innerHTML = '<h3 class="ls-title-l">Survivors out of 1,000</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Survivorship values"><table class="ls-tbl"><thead><tr><th scope="col">Age</th><th scope="col">Type I</th><th scope="col">Type II</th><th scope="col">Type III</th></tr></thead><tbody>' +
        [0, 2, 4, 6, 8, 10].map(function(i){ return '<tr><th scope="row">' + (i * 10) + '%</th><td class="r">' + nf(S.CURVES.I[i]) + '</td><td class="r">' + nf(S.CURVES.II[i]) + '</td><td class="r">' + nf(S.CURVES.III[i], 1) + '</td></tr>'; }).join('') + '</tbody></table></div><p class="bt-small">Idealized shapes for teaching; real species fall between them.</p>';
      say(head);
      if(LS){ LS.caption('<b>' + esc(head) + '</b>', 'explore'); LS.pills(sel ? [{ k: 'Curve', html: 'Type ' + sel, tone: 'accent' }] : [], 'left', 'explore'); LS.pills([{ k: 'Scale', html: 'log', tone: 'readout' }], 'right', 'explore'); }
    }
    function rkWords(){
      var done = distUpto === dist.Y;
      var head = done ? 'After the flood, the r-selected population is back near K in ' + dist.rec.r + ' years; the K-selected one takes ' + dist.rec.K + '.' : 'The flood knocks both populations to 20% of K. Watch them recover.';
      if(!touched) head = 'Two ways to spend energy on reproduction: many small offspring (r) or a few well cared for (K). Hit both with a flood.';
      var why = '<p><b>r-selected</b>: many small offspring, early breeding, little care, short lives. A high biotic potential lets the population rebound fast after a disturbance and spread fast into new places (many invasive species).</p>' +
        '<p><b>K-selected</b>: few large offspring, late breeding, much care, long lives. The population stays near K, but after a crash it recovers slowly, so hunting and habitat loss hit it hard.</p>' +
        '<p class="bt-small">The two curves come from the same logistic model with r = 0.9 and r = 0.12 per year.</p>';
      T.explain($('.pg-say'), '<b>' + esc(head) + '</b>', why);
      $('.pg-nums').innerHTML = '<h3 class="ls-title-l">Traits side by side</h3><div class="table-wrap" tabindex="0" role="region" aria-label="r and K traits"><table class="ls-tbl"><thead><tr><th scope="col">Trait</th><th scope="col">r-selected</th><th scope="col">K-selected</th></tr></thead><tbody>' +
        S.TRAITS.map(function(t){ return '<tr><th scope="row">' + esc(t.trait) + '</th><td>' + esc(t.r) + '</td><td>' + esc(t.K) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      say(head);
      if(LS){ LS.caption('<b>' + esc(head) + '</b>', 'explore'); LS.pills(done && touched ? [{ k: 'r back in', html: dist.rec.r + ' yr', tone: 'good' }] : [], 'left', 'explore'); LS.pills(done && touched ? [{ k: 'K back in', html: dist.rec.K + ' yr', tone: 'warn' }] : [], 'right', 'explore'); }
    }
    function stop(){ if(playing){ playing.stop(); playing = null; } if(distLoop){ distLoop.stop(); distLoop = null; } var b = $('.pg-play'); if(b) b.textContent = 'Play ' + years + ' years'; }
    function play(){
      stop(); act(); upto = 0; marker = 0; draw();
      var b = $('.pg-play'); b.textContent = 'Playing…';
      playing = P.loop(function(dt, t){ var y = Math.min(years, Math.floor(t / 4 * years)); if(y !== upto){ upto = y; marker = y; draw(); } return y < years; },
        { duration: 4.2, still: function(){ upto = years; marker = years; draw(); }, onEnd: function(){ upto = years; marker = years; playing = null; b.textContent = 'Play again'; draw(); T.event('apenv-tool-run', { tool: 'population-growth', model: model }); } });
      playing.start();
    }
    function hit(){
      stop(); act(); distUpto = 0; draw();
      distLoop = P.loop(function(dt, t){ var y = Math.min(dist.Y, Math.floor(t / 3.5 * dist.Y)); if(y !== distUpto){ distUpto = y; draw(); } return y < dist.Y; },
        { duration: 3.7, still: function(){ distUpto = dist.Y; draw(); }, onEnd: function(){ distUpto = dist.Y; distLoop = null; draw(); } });
      distLoop.start();
    }
    function setView(v){
      stop(); view = v;
      $('.pg-g').hidden = v !== 'growth'; $('.pg-s').hidden = v !== 'surv'; $('.pg-r').hidden = v !== 'rk';
      if(v === 'rk') distUpto = dist.Y;
      draw();
    }
    function onClick(e){
      var b = e.target.closest('button'); if(!b) return;
      if(b.classList.contains('pg-view')){ act(); setView(b.getAttribute('data-v')); return; }
      if(b.classList.contains('pg-m')){ model = b.getAttribute('data-m'); act(); stop(); upto = years; marker = years; draw(); return; }
      if(b.classList.contains('pg-play')){ play(); return; }
      if(b.classList.contains('pg-t')){ var t = b.getAttribute('data-t'); sel = sel === t ? null : t; act(); draw(); return; }
      if(b.classList.contains('pg-hit')){ hit(); return; }
    }
    host.addEventListener('click', onClick);
    svg.addEventListener('keydown', function(e){
      if(view !== 'growth') return;
      var k = e.key, m = marker;
      if(k === 'ArrowLeft' || k === 'ArrowDown') m--; else if(k === 'ArrowRight' || k === 'ArrowUp') m++; else if(k === 'Home') m = 0; else if(k === 'End') m = upto; else return;
      e.preventDefault(); stop(); act(); marker = Math.max(0, Math.min(upto, m)); draw();
    });
    svg.addEventListener('pointerdown', function(e){ if(view !== 'growth') return; scrub(e); svg.setPointerCapture && svg.setPointerCapture(e.pointerId); svg._drag = true; });
    svg.addEventListener('pointermove', function(e){ if(svg._drag) scrub(e); });
    svg.addEventListener('pointerup', function(){ svg._drag = false; });
    function scrub(e){
      var b = svg.getBoundingClientRect(), wh = size(), ph = wh[0] < 520, L = ph ? 46 : 64, R = wh[0] - (ph ? 12 : 22);
      var xx = (e.clientX - b.left) * wh[0] / b.width, y = Math.round((xx - L) / (R - L) * years);
      stop(); act(); marker = Math.max(0, Math.min(upto, y)); draw();
    }
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.pg-stage')], dock: [$('.pg-ctl')], why: [$('.pg-say')], details: [$('.pg-nums')] });
      host.removeEventListener('click', onClick); s.root.addEventListener('click', onClick);
      draw();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.pg-play'), text: 'Start here: press Play' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe($('.pg-fig')); }
    }
    draw();
    return { stop: stop, studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'population-growth', noun: 'problem',
      generate: function(r, ctx, type){ return S.generate(r, ctx, type); },
      types: S.TYPES, typeLabel: 'Kind of problem',
      title: function(p){ var t = S.TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); doneLine(host, s, right, api); }
    });
  }
  /* After the last step: say plainly that every answer is now right, and how
     many were right the first time (what is recorded), so a miss on a first
     try never reads as a wrong final answer. Runs after the shared drill's own
     summary (env-tools.js studioDrill done), which it replaces. */
  function doneLine(host, s, right, api){
    api.firsts = (api.firsts || 0) + (right ? 1 : 0);
    var steps = api.problem.steps, n = steps.length;
    if(s !== steps[n - 1]) return;
    var r = api.firsts, st = T.studioOf(host);
    api.firsts = 0;
    setTimeout(function(){
      var msg = r === n ? '<b>All ' + n + ' steps right the first time.</b> The worked solution is under Why.'
        : '<b>Done: every answer is now in.</b> First tries: ' + r + ' of ' + n + ' right (the misses go to your review queue). The worked solution is under Why.';
      if(st){ st.caption(msg, 'quiz'); st.pills([{ html: r + ' of ' + n + ' first try', tone: r === n ? 'good' : 'warn' }], 'left', 'quiz'); }
    }, 0);
  }

  function figure(el, p, st){
    var g = p.figure, ph = (window.innerWidth || 1280) <= 640, W = ph ? 360 : 640, H = ph ? 300 : 340, inner;
    if(!g){ el.innerHTML = ''; return; }
    if(g.kind === 'sim'){
      var s = S.simulate(g), o = { W: W, H: H, unit: g.unit || g.noun, tu: g.tu, labels: false };
      if(g.model === 'log'){ o.showK = !!st.k; if(st.phase) o.marker = s.n.findIndex(function(v){ return v >= g.K / 2; }); }
      if(g.model === 'over'){ o.Kline = !!st.why; o.mono = !st.phase; o.labels = !!st.phase; if(st.read) o.marker = s.peakT; }
      if(g.model === 'log') o.mono = true;
      if(g.model === 'exp'){ o.showK = false; o.mono = true; o.yMax = niceUp(Math.max.apply(null, s.n) * 1.05); if(g.mark && st.answer) { o.td = g.mark; o.tdLabel = 'doubled'; } if(g.marks && st.answer){ o.marker = s.t.length - 1; } }
      inner = '<svg class="pg-svg pg-qsvg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(qAria(g, s, st)) + '">' + growthSvg(s, o) + '</svg>';
    } else if(g.kind === 'surv'){
      inner = '<svg class="pg-svg pg-qsvg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Survivorship curves Type I, II and III on a log scale">' + survSvg(W, H, st.curve ? g.show : null) + '</svg>';
    } else if(g.kind === 'traits'){
      var d = disturbance();
      inner = '<svg class="pg-svg pg-qsvg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="The two reproductive strategies: many small eggs (r) and one large young with a parent (K); below, how fast each recovers after a disturbance">' + rkSvg(W, H, { series: d.series, hit: d.hit, upto: st.rk ? d.Y : d.hit - 1, rec: d.rec }) + '</svg>';
    }
    el.innerHTML = '<figure class="cd-fig pg-qfig">' + inner + '</figure>';
  }
  function qAria(g, s, st){
    if(g.model === 'log') return 'A logistic growth curve of the ' + g.noun + ' over ' + g.years + ' ' + (g.tu || 'year') + 's, rising from ' + nf(g.n0) + ' and levelling off near ' + nf(g.K) + '.';
    if(g.model === 'over') return 'The ' + g.noun + ' grows past the dashed line at ' + nf(g.K) + ', peaks at about ' + nf(s.peak) + ' in year ' + s.peakT + ', then falls and settles lower.';
    return 'Exponential growth from ' + nf(g.n0) + ': a J-shaped curve.';
  }
})();
