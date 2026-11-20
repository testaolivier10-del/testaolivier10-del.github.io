/* Rates and percent change, tools v2 (docs/tools-v2-rates-brief.md; the standard: docs/tools-v2-standard.md). On the
   shared kit (assets/course/tool-kit2.js) through the course adapter ApBioTools.studioKit2. The solver and the seeded
   problem generator are ApBioProblems.solve.rates and generate.rates (bio-skill-problems.js); the Explore run, the
   contexts and the fixed problems are data (bio/data/tools/rates.json).

   THE ONE IDEA: a rate is how much something changes per unit of time, Δy / Δt, the slope of the amount against
   time; percent change compares a change with where it started.

   EXPLORE: nothing locked or graded, no side panel. Three tabs, one idea each.
     1 "Rate over time": a catalase run on a lab bench. Potato extract and hydrogen peroxide fizz in a flask; the
       oxygen goes down a delivery tube and collects in an upside down measuring cylinder over a water trough; a timer
       runs. The graph of oxygen against time is under the scene. ONE control: the end point of an interval, dragged
       along the readings (the start point is a quiet second knob). The slope triangle is drawn between them (Δt
       amber, Δy blue, the slope purple), and the cylinder shows the same Δy as a blue band between two levels.
     2 "Rate at a moment": the same run; drag a point along the curve: its tangent, a 1 minute run and its rise,
       the foam in the flask (high while fast) and the cylinder at that moment.
     3 "Percent change": two potato cores standing on two balances, the start and after a day; drag the after core
       taller or shorter (its mass); a ruler beside it is marked in tenths of the START mass.
   Every number on the screen is read from the picture as drawn in that frame (the drawn time, the drawn mass); a
   jump (a key, a snap to a reading, Start over) is a short tween, so the gas, the triangle and the numbers move
   together. Bubbles rise only while oxygen is being added (one bubble per 0.25 mL), so a fast minute sends many.
   Reduced motion: the new state at once with a short cross fade.
   TEST YOURSELF, one dropdown on the stage:
     "Problems" (the old Practice, unchanged in content, grading and record ids).
     "Challenges" (the old Explore goals, and one for percent change), on the Explore picture from the opening.
   "?": this interval (or moment, or core) worked out, the readings table, the intervals measured, the formulas. */
(function(){
  'use strict';
  var SLUG = 'rates';
  var T = window.ApBioTools, S = window.ApBioSkillStage, M = window.ApBioMath, P = window.ApBioProblems;
  if(!T || !S || !M) return;
  var F = T.F, esc = T.esc, NS = 'http://www.w3.org/2000/svg';
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function r2(v){ return Math.round(v * 100) / 100; }
  function ease(x){ return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function mk(tag, cls, attrs, parent){ var e = document.createElementNS(NS, tag); if(cls) e.setAttribute('class', cls); if(attrs) for(var k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.appendChild(e); return e; }
  function at(e, attrs){ for(var k in attrs){ var v = typeof attrs[k] === 'number' ? attrs[k].toFixed(2) : attrs[k]; if(e.getAttribute(k) !== v) e.setAttribute(k, v); } }
  function txt(e, s){ if(e.textContent !== s) e.textContent = s; }
  // a time shown in min: a whole number when it is one, else one decimal
  function tStr(t){ return Math.abs(t - Math.round(t)) < 0.005 ? String(Math.round(t)) : F(t, 1); }
  function tVal(t){ return Math.abs(t - Math.round(t)) < 0.005 ? Math.round(t) : r1(t); }
  function sgn(v, d){ return (v > 0 ? '+' : '') + F(v, d); }

  /* A smooth curve through the readings (monotone cubic, Fritsch and Carlson): it passes through every reading
     exactly, never overshoots, and has a slope everywhere (for the tangent). */
  function smooth(ts, vs){
    var n = ts.length, h = [], dl = [], m = [];
    for(var i = 0; i < n - 1; i++){ h[i] = ts[i + 1] - ts[i]; dl[i] = (vs[i + 1] - vs[i]) / h[i]; }
    for(i = 1; i < n - 1; i++) m[i] = dl[i - 1] * dl[i] <= 0 ? 0 : (dl[i - 1] + dl[i]) / 2;
    function endSlope(h0, h1, d0, d1){ var s = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1); if(s * d0 <= 0) return 0; if(Math.abs(s) > 3 * Math.abs(d0)) return 3 * d0; return s; }
    m[0] = endSlope(h[0], h[1], dl[0], dl[1]); m[n - 1] = endSlope(h[n - 2], h[n - 3], dl[n - 2], dl[n - 3]);
    for(i = 0; i < n - 1; i++){
      if(dl[i] === 0){ m[i] = m[i + 1] = 0; continue; }
      var a = m[i] / dl[i], b = m[i + 1] / dl[i], s2 = a * a + b * b;
      if(s2 > 9){ var tau = 3 / Math.sqrt(s2); m[i] = tau * a * dl[i]; m[i + 1] = tau * b * dl[i]; }
    }
    function seg(t){ var k = 0; while(k < n - 2 && t > ts[k + 1]) k++; return k; }
    function f(t){
      t = clamp(t, ts[0], ts[n - 1]);
      var k = seg(t), x = (t - ts[k]) / h[k], x2 = x * x, x3 = x2 * x;
      return (2 * x3 - 3 * x2 + 1) * vs[k] + (x3 - 2 * x2 + x) * h[k] * m[k] + (-2 * x3 + 3 * x2) * vs[k + 1] + (x3 - x2) * h[k] * m[k + 1];
    }
    function d(t){
      t = clamp(t, ts[0], ts[n - 1]);
      var k = seg(t), x = (t - ts[k]) / h[k], x2 = x * x;
      return ((6 * x2 - 6 * x) * vs[k] + (3 * x2 - 4 * x + 1) * h[k] * m[k] + (-6 * x2 + 6 * x) * vs[k + 1] + (3 * x2 - 2 * x) * h[k] * m[k + 1]) / h[k];
    }
    return { f: f, d: d };
  }

  /* ------------------------------------------------------------------ the practice figures (Test yourself) */
  var W = 420, L = 50, R = 14, TP = 16, B = 46, H = 270, pw = W - L - R, ph = H - TP - B;
  function lineGraph(x, o){
    var t = x.times, y = x.values, tmax = t[t.length - 1], ymax = T.niceMax(Math.max.apply(null, y) * 1.12);
    var sx = function(v){ return L + v / tmax * pw; }, sy = function(v){ return TP + ph - Math.max(0, Math.min(1, v / ymax)) * ph; };
    var p = [], ys = T.niceStep(ymax, 5), xs = T.niceStep(tmax, 6);
    for(var g = 0; g <= ymax + 1e-9; g += ys) p.push('<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(g).toFixed(1) + '" y2="' + sy(g).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (sy(g) + 4).toFixed(1) + '" text-anchor="end">' + M.round(g, 6) + '</text>');
    for(var u = 0; u <= tmax + 1e-9; u += xs) p.push('<text class="tick" x="' + sx(u).toFixed(1) + '" y="' + (TP + ph + 16) + '" text-anchor="middle">' + M.round(u, 6) + '</text>');
    p.push('<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (TP + ph) + '" y2="' + (TP + ph) + '"/><line class="axis" x1="' + L + '" x2="' + L + '" y1="' + TP + '" y2="' + (TP + ph) + '"/>');
    p.push('<text class="lbl" x="' + (L + pw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">Time (' + esc(x.unitT) + ')</text><text class="lbl" transform="translate(13 ' + (TP + ph / 2) + ') rotate(-90)" text-anchor="middle">' + esc((x.label || 'Amount') + ' (' + x.unitY + ')') + '</text>');
    p.push('<polyline class="series s1" points="' + t.map(function(v, i){ return sx(v).toFixed(1) + ',' + sy(y[i]).toFixed(1); }).join(' ') + '"/>');
    (o.lines || []).forEach(function(l){
      var t0 = t[l.i], y0 = y[l.i], t1 = tmax, y1 = y0 + l.slope * (t1 - t0);
      if(y1 > ymax){ t1 = t0 + (ymax - y0) / l.slope; y1 = ymax; }
      if(y1 < 0){ t1 = t0 + (0 - y0) / l.slope; y1 = 0; }
      p.push('<line class="rt-mine ' + (l.cls || '') + '" x1="' + sx(t0).toFixed(1) + '" y1="' + sy(y0).toFixed(1) + '" x2="' + sx(t1).toFixed(1) + '" y2="' + sy(y1).toFixed(1) + '"/>');
    });
    (o.tris || []).forEach(function(tr){
      var a = tr.i, b = tr.j, xa = sx(t[a]), xb = sx(t[b]), ya = sy(y[a]), yb = sy(y[b]);
      p.push('<path class="rt-tri ' + (tr.cls || '') + '" d="M' + xa.toFixed(1) + ' ' + ya.toFixed(1) + ' H' + xb.toFixed(1) + ' V' + yb.toFixed(1) + ' Z"/>');
      p.push('<line class="rt-hyp ' + (tr.cls || '') + '" x1="' + xa.toFixed(1) + '" y1="' + ya.toFixed(1) + '" x2="' + xb.toFixed(1) + '" y2="' + yb.toFixed(1) + '"/>');
      p.push('<text class="rt-d" x="' + ((xa + xb) / 2).toFixed(1) + '" y="' + (ya + 14).toFixed(1) + '" text-anchor="middle">Δt ' + M.round(t[b] - t[a], 6) + '</text>');
      p.push('<text class="rt-d" x="' + (xb + 5).toFixed(1) + '" y="' + ((ya + yb) / 2 + 4).toFixed(1) + '">Δy ' + F(y[b] - y[a], x.dp) + '</text>');
      if(tr.label) p.push('<text class="rt-lab ' + (tr.cls || '') + '" x="' + ((xa + xb) / 2 - 6).toFixed(1) + '" y="' + ((ya + yb) / 2 - 10).toFixed(1) + '" text-anchor="end">' + tr.label + '</text>');
    });
    t.forEach(function(v, i){
      var on = (o.tris || []).some(function(tr){ return tr.i === i || tr.j === i; });
      p.push('<circle class="pt s1 rt-pt' + (on ? ' on' : '') + '" cx="' + sx(v).toFixed(1) + '" cy="' + sy(y[i]).toFixed(1) + '" r="5"/>');
    });
    return '<svg class="bio-svg rt-fig rt2-pfig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria) + '">' + p.join('') + '</svg>';
  }
  function pctGraph(x, typed, chk){
    var n = x.items.length, top = 0;
    x.items.forEach(function(it, k){ top = Math.max(top, it.initial, it.final); var g = typed[k]; if(isFinite(g)) top = Math.max(top, it.initial * (1 + g / 100)); });
    var ymax = T.niceMax(top * 1.15), sy = function(v){ return TP + ph - Math.max(0, Math.min(1, v / ymax)) * ph; };
    var p = [], ys = T.niceStep(ymax, 5), gw = pw / n, bw = Math.min(46, gw * 0.28);
    for(var g = 0; g <= ymax + 1e-9; g += ys) p.push('<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(g).toFixed(1) + '" y2="' + sy(g).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (sy(g) + 4).toFixed(1) + '" text-anchor="end">' + M.round(g, 6) + '</text>');
    p.push('<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (TP + ph) + '" y2="' + (TP + ph) + '"/><line class="axis" x1="' + L + '" x2="' + L + '" y1="' + TP + '" y2="' + (TP + ph) + '"/>');
    p.push('<text class="lbl" transform="translate(13 ' + (TP + ph / 2) + ') rotate(-90)" text-anchor="middle">' + esc((x.unit === 'g' || x.unit === 'kg' || x.unit === 'mg' ? 'Mass' : 'Value') + ' (' + x.unit + ')') + '</text>');
    x.items.forEach(function(it, k){
      var c = L + gw * (k + 0.5), xi = c - bw - 3, xf = c + 3;
      p.push('<path class="bar rt-init" d="' + T.barPath(xi, sy(it.initial), bw, TP + ph - sy(it.initial)) + '"/>');
      p.push('<path class="bar rt-fin" d="' + T.barPath(xf, sy(it.final), bw, TP + ph - sy(it.final)) + '"/>');
      p.push('<line class="rt-base" x1="' + (xi - 4).toFixed(1) + '" x2="' + (xf + bw + 4).toFixed(1) + '" y1="' + sy(it.initial).toFixed(1) + '" y2="' + sy(it.initial).toFixed(1) + '"/>');
      var gt = typed[k];
      if(isFinite(gt) && !chk) p.push('<rect class="rt-ghost" x="' + (xf - 3).toFixed(1) + '" y="' + sy(it.initial * (1 + gt / 100)).toFixed(1) + '" width="' + (bw + 6).toFixed(1) + '" height="' + (TP + ph - sy(it.initial * (1 + gt / 100))).toFixed(1) + '"/>');
      p.push('<text class="tick" x="' + c.toFixed(1) + '" y="' + (TP + ph + 16) + '" text-anchor="middle">' + esc(it.name) + '</text>');
      p.push('<text class="rt-d" x="' + (xi + bw / 2).toFixed(1) + '" y="' + (TP + ph + 30) + '" text-anchor="middle">start</text><text class="rt-d" x="' + (xf + bw / 2).toFixed(1) + '" y="' + (TP + ph + 30) + '" text-anchor="middle">end</text>');
      if(chk){ var pc = M.percentChange(it.initial, it.final); p.push('<text class="rt-lab" x="' + (xf + bw / 2).toFixed(1) + '" y="' + (Math.min(sy(it.final), sy(it.initial)) - 6).toFixed(1) + '" text-anchor="middle">' + (pc > 0 ? '+' : '') + F(pc, 1) + '%</text>'); }
    });
    return '<svg class="bio-svg rt-fig rt2-pfig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Start and end values for ' + x.items.map(function(it){ return it.name; }).join(' and ') + '.') + '">' + p.join('') + '</svg>';
  }
  function practiceStage(host, s){
    var x = s.input, a = s.answers || {}, chk = s.phase === 'checked', cap, svg;
    if(x.mode === 'pct'){
      var typed = x.items.map(function(it, k){ return S.num(a['pct-' + k]); });
      svg = pctGraph(x, typed, chk);
      cap = chk ? 'Each percent change compares the end bar with its own start (the line across): ' + x.items.map(function(it){ var pc = M.percentChange(it.initial, it.final); return esc(it.name) + ' ' + (pc < 0 ? 'lost' : 'gained') + ' ' + F(Math.abs(pc), 1) + '%'; }).join(', ') + '.'
        : typed.some(isFinite) ? 'The outline is where the end bar would be if your percent change were right: start × (1 + your % / 100). It should match the end bar exactly.'
        : 'Start and end values, from the table. Type a percent change and an outline shows the end value it predicts.';
    } else {
      var lines = [], tris = [];
      if(chk){
        tris = [{ i: x.early[0], j: x.early[1], cls: 'a', label: F(M.rate(x.values[x.early[0]], x.values[x.early[1]], x.times[x.early[0]], x.times[x.early[1]]), 2) },
                { i: x.late[0], j: x.late[1], cls: 'b', label: F(M.rate(x.values[x.late[0]], x.values[x.late[1]], x.times[x.late[0]], x.times[x.late[1]]), 2) }];
      } else {
        var e = S.num(a['rate-early']), l = S.num(a['rate-late']);
        if(isFinite(e)) lines.push({ i: x.early[0], slope: e, cls: 'a' });
        if(isFinite(l)) lines.push({ i: x.late[0], slope: l, cls: 'b' });
      }
      svg = lineGraph(x, { tris: tris, lines: lines, aria: 'Line graph of ' + (x.label || 'amount') + ' against time.' + (chk ? ' Slope triangles for both intervals.' : '') });
      var e1 = chk ? M.rate(x.values[x.early[0]], x.values[x.early[1]], x.times[x.early[0]], x.times[x.early[1]]) : 0, l1 = chk ? M.rate(x.values[x.late[0]], x.values[x.late[1]], x.times[x.late[0]], x.times[x.late[1]]) : 0;
      cap = chk ? 'Each triangle’s height over its width is a rate. The ' + (l1 < e1 ? 'later triangle is flatter, so the rate is falling' : 'later triangle is steeper, so the rate is rising') + '.' + (x.why ? ' ' + esc(x.why) : '')
        : lines.length ? 'Your rates are drawn as thin slopes from the start of each interval. A right answer runs along the curve to the end of the interval.'
        : 'The table, plotted. Type a rate and it is drawn as a slope from the start of that interval.';
    }
    S.redraw(host, '<div class="sk-fig">' + svg + '</div><p class="sk-cap">' + cap + '</p>');
  }

  /* ------------------------------------------------------------------ text measure (no layout per frame) */
  var mctx = null, mCache = {}, FONT = 'Nunito, "Segoe UI", system-ui, sans-serif';
  function tw(s, px, wt){
    var k = (wt || 800) + '|' + px + '|' + s;
    if(mCache[k] != null) return mCache[k];
    if(!mctx){ var c = document.createElement('canvas'); mctx = c.getContext('2d'); }
    mctx.font = (wt || 800) + ' ' + px + 'px ' + FONT;
    return (mCache[k] = mctx.measureText(s).width);
  }

  function boot(){
    var K = window.LevlKit2;
    T.mount(SLUG, function(app, data, ctx){
      var EX = data.explore, RUN = EX.run, CORE = EX.core;
      var TS = RUN.times, VS = RUN.values, N = TS.length, TMAX = TS[N - 1], VMAX = T.niceMax(Math.max.apply(null, VS) * 1.12);
      var SM = smooth(TS, VS), f = SM.f, fd = SM.d;
      var TABS = EX.tabs.map(function(t){ return t.id; });
      var UY = RUN.unitY, UT = RUN.unitT, RU = UY + '/' + UT;
      /* the model (targets) and what is drawn this frame */
      var OPEN = { tab: 'avg', a: RUN.open[0], b: RUN.open[1], m: RUN.moment, c: CORE.open };
      var MD = { tab: OPEN.tab, a: OPEN.a, b: OPEN.b, m: OPEN.m, c: OPEN.c };
      var DR = { a: MD.a, b: MD.b, m: MD.m, c: MD.c };
      var TW = {}, raf = 0, St = { mode: 'explore', part: null };
      var measured = [];   // the intervals measured (for "?")
      function calm(){ return K.reduced() || !window.requestAnimationFrame; }

      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'rt2'; stage.setAttribute('data-tab', MD.tab);
      var tabs = K.tabs({ label: 'What to explore', items: EX.tabs.map(function(t){ return { value: t.id, label: t.label, short: t.short }; }), value: MD.tab, big: true, onChange: function(v){ setTab(v, true); } });
      stage.appendChild(tabs.el);
      var head = K.head({ purpose: EX.purpose[MD.tab], how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'rt2-scene'; sceneBox.id = T.nid('rt2');
      sceneBox.innerHTML = '<svg class="rt2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><defs></defs><g class="rt2-static"></g><g class="rt2-live"></g><g class="rt2-bub"></g><g class="rt2-labs"></g></svg>';
      stage.appendChild(sceneBox);
      tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', sceneBox.id); });
      var svg = sceneBox.querySelector('svg'), sDefs = svg.querySelector('defs'), sStatic = svg.querySelector('.rt2-static'), sLive = svg.querySelector('.rt2-live'), sBub = svg.querySelector('.rt2-bub'), sLabs = svg.querySelector('.rt2-labs');
      var sLayer = K.layer(sceneBox);
      var graphBox = document.createElement('div'); graphBox.className = 'rt2-graph';
      graphBox.innerHTML = '<svg class="rt2-gsvg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><defs></defs><g class="rt2-gstatic"></g><g class="rt2-glive"></g><g class="rt2-glabs"></g></svg>';
      stage.appendChild(graphBox);
      var gsvg = graphBox.querySelector('svg'), gDefs = gsvg.querySelector('defs'), gStatic = gsvg.querySelector('.rt2-gstatic'), gLive = gsvg.querySelector('.rt2-glive'), gLabs = gsvg.querySelector('.rt2-glabs');
      var gLayer = K.layer(graphBox);
      var lines = document.createElement('div'); lines.className = 'rt2-lines';
      var cause = K.cause({ label: 'Why' });
      var acts = document.createElement('div'); acts.className = 'rt2-acts';
      acts.innerHTML = '<button type="button" class="tk2-link rt2-reset">Start over</button>';
      var bReset = acts.querySelector('.rt2-reset');
      lines.appendChild(cause.el); lines.appendChild(acts);
      stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      var lastSaid = '';
      function say(t){ if(t === lastSaid) return; lastSaid = t; live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

      /* ---------------------------------------------------- the scene's geometry (picture units = CSS px) */
      var G = null, GG = null;
      function layoutScene(){
        var Wd = sceneBox.clientWidth, Hd = sceneBox.clientHeight;
        if(!Wd || !Hd) return null;
        var g = { W: Wd, H: Hd, tab: MD.tab };
        if(MD.tab === 'pct'){
          // design: 300 tall above the bench, two balances 130 wide with 120 between their centres + the ruler and the pill
          var benchP = Math.max(44, Hd * 0.13);
          g.bench = Hd - benchP;
          var needP = 470, sp = Math.min((g.bench - 14) / 260, (Wd - 16) / needP, 2.2);
          g.s = sp;
          var blockW = needP * sp, x0 = (Wd - blockW) / 2;
          g.bal = [x0 + 80 * sp, x0 + 80 * sp + 175 * sp];   // balance centres
          g.balW = Math.max(130 * sp, 112); g.balH = Math.max(34 * sp, 32);
          g.pan = g.bench - g.balH - 8 * sp;                   // pan top (the cores stand on it)
          g.coreW = clamp(44 * sp, 32, 70);
          g.kM = (g.pan - 74) / CORE.max;   // px per gram (the tallest core leaves room for the tag)
          g.ruler = g.bal[1] + g.coreW / 2 + 22 * sp;                       // the ruler's line
          return g;
        }
        var bench = Hd - Math.max(40, Math.min(64, Hd * 0.16));
        g.bench = bench;
        var wide = Wd >= 600, blockW = wide ? 660 : 452;
        var s = Math.min((bench - 6) / 244, (Wd - 12) / blockW);
        g.s = s; g.wide = wide;
        var extra = Math.max(0, Wd - 12 - blockW * s);
        var ox = 6 + Math.min(extra * 0.08, 60);
        function X(dx, share){ return ox + dx * s + extra * share; }
        g.top = bench - 240 * s;
        g.fx = X(62, 0.04);                 // flask centre
        g.cx = X(250, 0.28);                // cylinder centre (the trough's too)
        g.rod = X(352, 0.31);               // the stand's rod
        g.tx = X(410, 0.42);                // the timer's centre
        g.clip = wide ? X(500, 0.62) : null; // the clipboard's left
        g.Y = function(dy){ return g.top + dy * s; };
        // the cylinder's scale: 0 mL at the top, 15 mL down to y 178 (design)
        g.gy0 = g.Y(26); g.kV = (g.Y(26 + 152) - g.gy0) / 15;
        g.mouth = g.Y(204); g.cw = 15 * s;
        g.tip = [g.cx, g.Y(214)];
        g.flaskLiq = g.Y(198);
        return g;
      }
      function layoutGraph(){
        var Wd = graphBox.clientWidth, Hd = graphBox.clientHeight;
        if(!Wd || !Hd) return null;
        var phone = Wd < 560;
        var g = { W: Wd, H: Hd, L: phone ? 40 : 52, R: phone ? 96 : 100, T: 36, B: 56, IN: 14 };
        g.pw = Wd - g.L - g.R; g.ph = Hd - g.T - g.B;
        // the readings sit a little inside the axes, so a knob at 0 never covers a tick number
        g.x = function(t){ return g.L + g.IN + t / TMAX * (g.pw - g.IN); };
        g.y = function(v){ return g.T + g.ph - g.IN - v / VMAX * (g.ph - g.IN); };
        g.t = function(x){ return (x - g.L - g.IN) / (g.pw - g.IN) * TMAX; };
        return g;
      }

      /* ---------------------------------------------------- drawing helpers */
      function rr(x, y, w, h, r){ return 'M' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + 'V' + (y + h - r) + 'Q' + (x + w) + ' ' + (y + h) + ' ' + (x + w - r) + ' ' + (y + h) + 'H' + (x + r) + 'Q' + x + ' ' + (y + h) + ' ' + x + ' ' + (y + h - r) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'Z'; }
      function grad(defs, id, stops, v){ var g = mk('linearGradient', null, v ? { id: id, x1: 0, y1: 0, x2: 0, y2: 1 } : { id: id, x1: 0, y1: 0, x2: 1, y2: 0 }, defs); stops.forEach(function(s){ mk('stop', s[1], { offset: s[0] }, g); }); return g; }
      // a pill label: { g, r, t } with a colour class; place(x, y, anchor) sets text and size
      function pill(parent, cls){
        var g = mk('g', 'rt2-pill ' + cls, null, parent), r = mk('rect', 'rt2-pill-bg', { rx: 9, ry: 9 }, g), t = mk('text', 'rt2-pill-t', null, g);
        var o = { g: g, w: 0, h: 22, x: 0, y: 0, s: '', px: 12.5,
          set: function(s, x, y, anchor){
            var w = Math.ceil(tw(s, o.px, 800)) + 16, h = o.h, x0 = anchor === 'end' ? x - w : anchor === 'start' ? x : x - w / 2;
            o.w = w; o.x = x0; o.y = y - h / 2; o.s = s;
            txt(t, s); at(r, { x: x0, y: y - h / 2, width: w, height: h }); at(t, { x: x0 + w / 2, y: y + o.px * 0.36 });
            if(g.style.display) g.style.display = '';
          },
          hide: function(){ if(g.style.display !== 'none') g.style.display = 'none'; o.w = 0; },
          box: function(){ return o.w ? [o.x, o.y, o.x + o.w, o.y + o.h] : null; } };
        at(t, { 'text-anchor': 'middle' });
        return o;
      }

      /* ---------------------------------------------------- tabs 1 and 2: the catalase bench */
      var E = {};   // the live elements of the scene
      function drawBench(){
        var g = G, s = g.s, Y = g.Y, h = [];
        sDefs.innerHTML = '';
        grad(sDefs, 'rt2g-wall', [[0, 'rt2s-wall0'], [1, 'rt2s-wall1']], true);
        grad(sDefs, 'rt2g-wood', [[0, 'rt2s-wood0'], [1, 'rt2s-wood1']], true);
        grad(sDefs, 'rt2g-glass', [[0, 'rt2s-glass0'], [0.35, 'rt2s-glass1'], [1, 'rt2s-glass2']]);
        grad(sDefs, 'rt2g-water', [[0, 'rt2s-water0'], [1, 'rt2s-water1']], true);
        grad(sDefs, 'rt2g-liq', [[0, 'rt2s-liq0'], [1, 'rt2s-liq1']], true);
        grad(sDefs, 'rt2g-metal', [[0, 'rt2s-metal0'], [0.5, 'rt2s-metal1'], [1, 'rt2s-metal0']]);
        // the wall (tiles) and the bench
        h.push('<rect class="rt2-wall" x="0" y="0" width="' + g.W + '" height="' + g.bench + '" fill="url(#rt2g-wall)"/>');
        var tile = Math.max(26, 34 * s);
        for(var ty = g.bench - tile; ty > 0; ty -= tile) h.push('<line class="rt2-tile" x1="0" x2="' + g.W + '" y1="' + ty.toFixed(1) + '" y2="' + ty.toFixed(1) + '"/>');
        for(var row = 0, yy = g.bench; yy > 0; yy -= tile, row++) for(var tx = (row % 2 ? tile : 0); tx < g.W; tx += tile * 2) h.push('<line class="rt2-tile" x1="' + tx.toFixed(1) + '" x2="' + tx.toFixed(1) + '" y1="' + Math.max(0, yy - tile).toFixed(1) + '" y2="' + yy.toFixed(1) + '"/>');
        h.push('<rect class="rt2-bench" x="0" y="' + g.bench + '" width="' + g.W + '" height="' + (g.H - g.bench) + '" fill="url(#rt2g-wood)"/>');
        h.push('<rect class="rt2-bench-edge" x="0" y="' + g.bench + '" width="' + g.W + '" height="' + Math.max(4, 6 * s).toFixed(1) + '"/>');
        for(var k = 0; k < 4; k++){ var gy = g.bench + 12 + k * (g.H - g.bench - 14) / 4; h.push('<path class="rt2-grain" d="M0 ' + gy.toFixed(1) + ' C' + (g.W * 0.3).toFixed(0) + ' ' + (gy - 3).toFixed(1) + ' ' + (g.W * 0.6).toFixed(0) + ' ' + (gy + 4).toFixed(1) + ' ' + g.W + ' ' + (gy + 1).toFixed(1) + '"/>'); }
        return h;
      }
      function drawCatalase(){
        var g = G, s = g.s, Y = g.Y, h = drawBench(), fx = g.fx, cx = g.cx;
        function hw(y){ return 14 + 38 * clamp((y - 120) / 120, 0, 1); }   // the flask's half width at design y
        g.hw = function(py){ return hw((py - g.top) / s) * s; };
        // shadows on the bench
        h.push('<ellipse class="rt2-shadow" cx="' + fx + '" cy="' + (g.bench + 2) + '" rx="' + (60 * s).toFixed(1) + '" ry="' + (6 * s).toFixed(1) + '"/>');
        h.push('<ellipse class="rt2-shadow" cx="' + cx + '" cy="' + (g.bench + 2) + '" rx="' + (84 * s).toFixed(1) + '" ry="' + (6 * s).toFixed(1) + '"/>');
        // the stand: base, rod, the clamp arm to the cylinder
        var rod = g.rod;
        h.push('<rect class="rt2-standbase" x="' + (rod - 34 * s).toFixed(1) + '" y="' + (g.bench - 8 * s).toFixed(1) + '" width="' + (62 * s).toFixed(1) + '" height="' + (8 * s).toFixed(1) + '" rx="' + (2 * s).toFixed(1) + '"/>');
        h.push('<rect x="' + (rod - 3 * s).toFixed(1) + '" y="' + Y(0).toFixed(1) + '" width="' + (6 * s).toFixed(1) + '" height="' + (g.bench - 8 * s - Y(0)).toFixed(1) + '" fill="url(#rt2g-metal)" class="rt2-rod"/>');
        // the trough: back wall, water, front glass
        var tl = cx - 80 * s, tr = cx + 80 * s, tt = Y(140), wl = Y(156);
        h.push('<rect class="rt2-trough-back" x="' + tl.toFixed(1) + '" y="' + tt.toFixed(1) + '" width="' + (tr - tl).toFixed(1) + '" height="' + (g.bench - tt).toFixed(1) + '"/>');
        h.push('<rect x="' + tl.toFixed(1) + '" y="' + wl.toFixed(1) + '" width="' + (tr - tl).toFixed(1) + '" height="' + (g.bench - wl).toFixed(1) + '" fill="url(#rt2g-water)" class="rt2-water"/>');
        // the shelf the cylinder stands on, under water
        h.push('<rect class="rt2-shelf" x="' + (cx - 30 * s).toFixed(1) + '" y="' + Y(206).toFixed(1) + '" width="' + (60 * s).toFixed(1) + '" height="' + (6 * s).toFixed(1) + '" rx="' + (2 * s).toFixed(1) + '"/>');
        h.push('<rect class="rt2-shelf" x="' + (cx - 24 * s).toFixed(1) + '" y="' + Y(212).toFixed(1) + '" width="' + (6 * s).toFixed(1) + '" height="' + (28 * s).toFixed(1) + '"/><rect class="rt2-shelf" x="' + (cx + 18 * s).toFixed(1) + '" y="' + Y(212).toFixed(1) + '" width="' + (6 * s).toFixed(1) + '" height="' + (28 * s).toFixed(1) + '"/>');
        // the cylinder (upside down): glass, then the live gas and water inside, then the marks
        var cw = 18 * s, cTop = Y(14);
        h.push('<path class="rt2-foot" d="M' + (cx - 28 * s).toFixed(1) + ' ' + Y(4).toFixed(1) + 'H' + (cx + 28 * s).toFixed(1) + 'L' + (cx + 22 * s).toFixed(1) + ' ' + cTop.toFixed(1) + 'H' + (cx - 22 * s).toFixed(1) + 'Z"/>');
        h.push('<rect class="rt2-cyl-in" x="' + (cx - g.cw).toFixed(1) + '" y="' + Y(18).toFixed(1) + '" width="' + (2 * g.cw).toFixed(1) + '" height="' + (g.mouth - Y(18)).toFixed(1) + '"/>');
        g.cylIn = [cx - g.cw, Y(18), cx + g.cw, g.mouth];
        sStatic.innerHTML = h.join('');
        // the live parts (built once per layout, changed per frame)
        sLive.innerHTML = '';
        E.gas = mk('rect', 'rt2-gas', { x: cx - g.cw, width: 2 * g.cw }, sLive);
        E.band = mk('rect', 'rt2-band', { x: cx - g.cw, width: 2 * g.cw }, sLive);
        E.cwater = mk('rect', 'rt2-cwater', { x: cx - g.cw, width: 2 * g.cw, fill: 'url(#rt2g-water)' }, sLive);
        E.lvA = mk('line', 'rt2-level is-a', { x1: cx - g.cw - 3 * s, x2: cx + g.cw + 3 * s }, sLive);
        E.lvB = mk('line', 'rt2-level is-b', { x1: cx - g.cw - 3 * s, x2: cx + g.cw + 3 * s }, sLive);
        var st = [];
        // graduations: every 1 mL, a number every 5 (printed on the glass, read from the top)
        for(var v = 0; v <= 15; v++){ var y = g.gy0 + v * g.kV, long = v % 5 === 0; st.push('<line class="rt2-grad' + (long ? ' is-long' : '') + '" x1="' + (cx + g.cw - (long ? 9 : 5) * s).toFixed(1) + '" x2="' + (cx + g.cw).toFixed(1) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>'); if(long && v) st.push('<text class="rt2-gnum" x="' + (cx - g.cw + 2).toFixed(1) + '" y="' + (y + 4).toFixed(1) + '">' + v + '</text>'); }
        st.push('<rect class="rt2-cyl" x="' + (cx - cw).toFixed(1) + '" y="' + cTop.toFixed(1) + '" width="' + (2 * cw).toFixed(1) + '" height="' + (g.mouth - cTop).toFixed(1) + '" fill="url(#rt2g-glass)"/>');
        st.push('<line class="rt2-glint" x1="' + (cx - cw + 4 * s).toFixed(1) + '" x2="' + (cx - cw + 4 * s).toFixed(1) + '" y1="' + Y(24).toFixed(1) + '" y2="' + Y(196).toFixed(1) + '"/>');
        // the clamp arm and its jaws
        st.push('<rect x="' + (cx + cw).toFixed(1) + '" y="' + Y(56).toFixed(1) + '" width="' + (rod - cx - cw).toFixed(1) + '" height="' + (5 * s).toFixed(1) + '" fill="url(#rt2g-metal)" class="rt2-arm"/>');
        st.push('<rect class="rt2-boss" x="' + (rod - 6 * s).toFixed(1) + '" y="' + Y(50).toFixed(1) + '" width="' + (12 * s).toFixed(1) + '" height="' + (16 * s).toFixed(1) + '" rx="' + (2 * s).toFixed(1) + '"/>');
        st.push('<rect class="rt2-jaw" x="' + (cx - cw - 3 * s).toFixed(1) + '" y="' + Y(50).toFixed(1) + '" width="' + (2 * cw + 6 * s).toFixed(1) + '" height="' + (16 * s).toFixed(1) + '" rx="' + (4 * s).toFixed(1) + '"/>');
        // the trough's front glass and rim
        st.push('<rect class="rt2-trough" x="' + tl.toFixed(1) + '" y="' + tt.toFixed(1) + '" width="' + (tr - tl).toFixed(1) + '" height="' + (g.bench - tt).toFixed(1) + '" rx="' + (3 * s).toFixed(1) + '"/>');
        st.push('<line class="rt2-surface" x1="' + tl.toFixed(1) + '" x2="' + tr.toFixed(1) + '" y1="' + wl.toFixed(1) + '" y2="' + wl.toFixed(1) + '"/>');
        // the flask: glass, liquid, foam (live), bung, the delivery tube
        var fl = [], yTop = 92, lip = 86;
        fl.push('M' + (fx - 15 * s).toFixed(1) + ' ' + Y(lip).toFixed(1) + 'L' + (fx - 14 * s).toFixed(1) + ' ' + Y(yTop).toFixed(1) + 'V' + Y(120).toFixed(1) + 'L' + (fx - 52 * s).toFixed(1) + ' ' + Y(234).toFixed(1) + 'Q' + (fx - 53 * s).toFixed(1) + ' ' + Y(240).toFixed(1) + ' ' + (fx - 46 * s).toFixed(1) + ' ' + Y(240).toFixed(1) + 'H' + (fx + 46 * s).toFixed(1) + 'Q' + (fx + 53 * s).toFixed(1) + ' ' + Y(240).toFixed(1) + ' ' + (fx + 52 * s).toFixed(1) + ' ' + Y(234).toFixed(1) + 'L' + (fx + 14 * s).toFixed(1) + ' ' + Y(120).toFixed(1) + 'V' + Y(yTop).toFixed(1) + 'L' + (fx + 15 * s).toFixed(1) + ' ' + Y(lip).toFixed(1));
        var ly = 198;
        st.push('<path class="rt2-liq" fill="url(#rt2g-liq)" d="M' + (fx - hw(ly) * s).toFixed(1) + ' ' + Y(ly).toFixed(1) + 'H' + (fx + hw(ly) * s).toFixed(1) + 'L' + (fx + 51 * s).toFixed(1) + ' ' + Y(236).toFixed(1) + 'Q' + (fx + 50 * s).toFixed(1) + ' ' + Y(238).toFixed(1) + ' ' + (fx + 46 * s).toFixed(1) + ' ' + Y(238).toFixed(1) + 'H' + (fx - 46 * s).toFixed(1) + 'Q' + (fx - 50 * s).toFixed(1) + ' ' + Y(238).toFixed(1) + ' ' + (fx - 51 * s).toFixed(1) + ' ' + Y(236).toFixed(1) + 'Z"/>');
        // potato bits in the liquid
        [[-24, 226, 5], [10, 230, 4], [30, 224, 3.5], [-6, 216, 3], [18, 212, 2.6], [-34, 232, 3]].forEach(function(p){ st.push('<ellipse class="rt2-bit" cx="' + (fx + p[0] * s).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" rx="' + (p[2] * s).toFixed(1) + '" ry="' + (p[2] * 0.7 * s).toFixed(1) + '"/>'); });
        g.foamBase = Y(ly);
        st.push('<g class="rt2-foamg"></g>');
        st.push('<path class="rt2-flask" d="' + fl.join('') + '"/>');
        st.push('<path class="rt2-flask-hi" d="M' + (fx - 9 * s).toFixed(1) + ' ' + Y(100).toFixed(1) + 'V' + Y(122).toFixed(1) + 'L' + (fx - 40 * s).toFixed(1) + ' ' + Y(222).toFixed(1) + '"/>');
        st.push('<path class="rt2-bung" d="M' + (fx - 17 * s).toFixed(1) + ' ' + Y(76).toFixed(1) + 'H' + (fx + 17 * s).toFixed(1) + 'L' + (fx + 13 * s).toFixed(1) + ' ' + Y(100).toFixed(1) + 'H' + (fx - 13 * s).toFixed(1) + 'Z"/>');
        var tubeD = 'M' + fx.toFixed(1) + ' ' + Y(88).toFixed(1) + 'V' + Y(40).toFixed(1) + 'Q' + fx.toFixed(1) + ' ' + Y(28).toFixed(1) + ' ' + (fx + 12 * s).toFixed(1) + ' ' + Y(28).toFixed(1) +
          'H' + (cx - 58 * s).toFixed(1) + 'Q' + (cx - 46 * s).toFixed(1) + ' ' + Y(28).toFixed(1) + ' ' + (cx - 46 * s).toFixed(1) + ' ' + Y(40).toFixed(1) + 'V' + Y(222).toFixed(1) +
          'Q' + (cx - 46 * s).toFixed(1) + ' ' + Y(230).toFixed(1) + ' ' + (cx - 38 * s).toFixed(1) + ' ' + Y(230).toFixed(1) + 'H' + (cx - 8 * s).toFixed(1) + 'Q' + cx.toFixed(1) + ' ' + Y(230).toFixed(1) + ' ' + cx.toFixed(1) + ' ' + Y(222).toFixed(1) + 'V' + Y(214).toFixed(1);
        st.push('<path class="rt2-tube" d="' + tubeD + '" style="stroke-width:' + (7 * s).toFixed(1) + 'px"/><path class="rt2-tube-in" d="' + tubeD + '" style="stroke-width:' + (3.4 * s).toFixed(1) + 'px"/>');
        // the timer
        var tx = g.tx, tw0 = 70 * s, th = 56 * s, tyy = g.bench - th;
        st.push('<rect class="rt2-timer" x="' + (tx - tw0 / 2).toFixed(1) + '" y="' + tyy.toFixed(1) + '" width="' + tw0.toFixed(1) + '" height="' + th.toFixed(1) + '" rx="' + (10 * s).toFixed(1) + '"/>');
        st.push('<rect class="rt2-timer-btn" x="' + (tx - 12 * s).toFixed(1) + '" y="' + (tyy - 6 * s).toFixed(1) + '" width="' + (24 * s).toFixed(1) + '" height="' + (8 * s).toFixed(1) + '" rx="' + (3 * s).toFixed(1) + '"/>');
        st.push('<rect class="rt2-lcd" x="' + (tx - tw0 / 2 + 7 * s).toFixed(1) + '" y="' + (tyy + 9 * s).toFixed(1) + '" width="' + (tw0 - 14 * s).toFixed(1) + '" height="' + (th - 22 * s).toFixed(1) + '" rx="' + (4 * s).toFixed(1) + '"/>');
        g.lcd = [tx, tyy + 9 * s + (th - 22 * s) / 2];
        // the clipboard with the readings (wide stages)
        if(g.clip != null){
          var cl = g.clip, cwd = 160 * s, cht = 196 * s, ct = g.bench - cht;
          st.push('<rect class="rt2-board" x="' + cl.toFixed(1) + '" y="' + ct.toFixed(1) + '" width="' + cwd.toFixed(1) + '" height="' + cht.toFixed(1) + '" rx="' + (8 * s).toFixed(1) + '"/>');
          st.push('<rect class="rt2-paper" x="' + (cl + 9 * s).toFixed(1) + '" y="' + (ct + 14 * s).toFixed(1) + '" width="' + (cwd - 18 * s).toFixed(1) + '" height="' + (cht - 22 * s).toFixed(1) + '" rx="' + (2 * s).toFixed(1) + '"/>');
          st.push('<rect class="rt2-clipm" x="' + (cl + cwd / 2 - 24 * s).toFixed(1) + '" y="' + (ct - 4 * s).toFixed(1) + '" width="' + (48 * s).toFixed(1) + '" height="' + (16 * s).toFixed(1) + '" rx="' + (4 * s).toFixed(1) + '" fill="url(#rt2g-metal)"/>');
          g.paper = [cl + 9 * s, ct + 14 * s, cwd - 18 * s, cht - 22 * s];
        }
        sStatic.insertAdjacentHTML('beforeend', st.join(''));
        E.foam = sStatic.querySelector('.rt2-foamg');
        E.foamP = mk('path', 'rt2-foam', null, E.foam);
        // the readings on the clipboard (live rows)
        E.rows = null;
        if(g.paper){
          var pp = g.paper, rh = Math.min(22, (pp[3] - 34) / (N + 1)), x1 = pp[0] + 10, x2 = pp[0] + pp[2] - 10, y0 = pp[1] + 10 + rh;
          var tb = mk('g', 'rt2-table', null, sLive);
          mk('text', 'rt2-th', { x: x1, y: y0 - 4 }, tb).textContent = 'min';
          mk('text', 'rt2-th', { x: x2, y: y0 - 4, 'text-anchor': 'end' }, tb).textContent = 'O₂ (mL)';
          mk('line', 'rt2-trule', { x1: x1 - 4, x2: x2 + 4, y1: y0 + 2, y2: y0 + 2 }, tb);
          E.rows = TS.map(function(t, i){
            var y = y0 + 2 + (i + 1) * rh, hl = mk('rect', 'rt2-trow', { x: x1 - 6, y: y - rh + 3, width: x2 - x1 + 12, height: rh - 2, rx: 4 }, tb);
            var a = mk('text', 'rt2-td', { x: x1, y: y - 4 }, tb), b = mk('text', 'rt2-td', { x: x2, y: y - 4, 'text-anchor': 'end' }, tb);
            a.textContent = String(t); b.textContent = F(VS[i], RUN.dp);
            return { hl: hl, a: a, b: b, y: y };
          });
          g.tableBox = [x1 - 6, pp[1], x2 + 6, y0 + 2 + N * rh];
        }
        // labels on the picture
        sLabs.innerHTML = '';
        E.pDy = pill(sLabs, 'is-dy'); E.pDt = pill(sLabs, 'is-dt'); E.pGas = pill(sLabs, 'is-gas');
        E.lcd = mk('text', 'rt2-lcdt', { x: g.lcd[0], y: g.lcd[1] + 6.5, 'text-anchor': 'middle' }, sLabs);
        E.what = mk('text', 'rt2-what', { x: fx, y: Math.min(g.H - 8, g.bench + 22), 'text-anchor': 'middle' }, sLabs); E.what.textContent = RUN.what;
        E.foamL = mk('text', 'rt2-foaml', { 'text-anchor': 'start' }, sLabs);
        // the bubbles: a pool of circles, one transform each
        sBub.innerHTML = ''; bubs = [];
        for(var i = 0; i < 40; i++){ var c = mk('circle', 'rt2-bubble', { cx: 0, cy: 0, r: Math.max(2.4, 3.4 * s) }, sBub); c.style.display = 'none'; bubs.push({ el: c, on: false }); }
        svg.setAttribute('aria-label', 'Catalase and hydrogen peroxide in a flask; the oxygen collects in an upside down measuring cylinder over water.');
      }

      /* ---------------------------------------------------- tab 3: two potato cores on two balances */
      function corePath(cx, base, hgt, w, wob){
        // an upright cylinder of potato: side outline with a wrinkle when it has lost water
        var l = cx - w / 2, r = cx + w / 2, top = base - hgt, n = Math.max(2, Math.round(hgt / 14)), d = 'M' + l.toFixed(1) + ' ' + (top + w * 0.14).toFixed(1);
        for(var i = 1; i <= n; i++){ var y = top + w * 0.14 + (hgt - w * 0.14) * i / n; d += 'Q' + (l + (i % 2 ? wob : -wob * 0.5)).toFixed(1) + ' ' + (y - (hgt / n) / 2).toFixed(1) + ' ' + l.toFixed(1) + ' ' + y.toFixed(1); }
        d += 'Q' + cx.toFixed(1) + ' ' + (base + w * 0.16).toFixed(1) + ' ' + r.toFixed(1) + ' ' + base.toFixed(1);
        for(i = n - 1; i >= 0; i--){ var y2 = top + w * 0.14 + (hgt - w * 0.14) * i / n; d += 'Q' + (r - (i % 2 ? wob * 0.5 : -wob)).toFixed(1) + ' ' + (y2 + (hgt / n) / 2).toFixed(1) + ' ' + r.toFixed(1) + ' ' + y2.toFixed(1); }
        return d + 'Z';
      }
      function drawCores(){
        var g = G, s = g.s, h = drawBench();
        grad(sDefs, 'rt2g-core', [[0, 'rt2s-core0'], [0.45, 'rt2s-core1'], [1, 'rt2s-core2']]);
        grad(sDefs, 'rt2g-bal', [[0, 'rt2s-bal0'], [1, 'rt2s-bal1']], true);
        g.bal.forEach(function(bx){
          h.push('<ellipse class="rt2-shadow" cx="' + bx.toFixed(1) + '" cy="' + (g.bench + 2) + '" rx="' + (g.balW * 0.55).toFixed(1) + '" ry="' + (5 * s).toFixed(1) + '"/>');
          h.push('<rect fill="url(#rt2g-bal)" class="rt2-balance" x="' + (bx - g.balW / 2).toFixed(1) + '" y="' + (g.bench - g.balH).toFixed(1) + '" width="' + g.balW.toFixed(1) + '" height="' + g.balH.toFixed(1) + '" rx="' + (7 * s).toFixed(1) + '"/>');
          var lw = Math.max(68 * s, tw('0.00 g', 16, 800) * 1.25 + 14); h.push('<rect class="rt2-lcd" x="' + (bx - lw / 2).toFixed(1) + '" y="' + (g.bench - g.balH + 7 * s).toFixed(1) + '" width="' + lw.toFixed(1) + '" height="' + (g.balH - 14 * s).toFixed(1) + '" rx="' + (3 * s).toFixed(1) + '"/>');
          h.push('<rect class="rt2-pan" x="' + (bx - 44 * s).toFixed(1) + '" y="' + g.pan.toFixed(1) + '" width="' + (88 * s).toFixed(1) + '" height="' + (6 * s).toFixed(1) + '" rx="' + (3 * s).toFixed(1) + '"/>');
          h.push('<rect class="rt2-panpost" x="' + (bx - 5 * s).toFixed(1) + '" y="' + (g.pan + 6 * s).toFixed(1) + '" width="' + (10 * s).toFixed(1) + '" height="' + (g.bench - g.balH - g.pan - 6 * s).toFixed(1) + '"/>');
        });
        sStatic.innerHTML = h.join('');
        sLive.innerHTML = '';
        var base = g.pan;
        // the start core (fixed)
        var hs = CORE.start * g.kM;
        mk('path', 'rt2-core', { d: corePath(g.bal[0], base, hs, g.coreW, 0), fill: 'url(#rt2g-core)' }, sLive);
        mk('ellipse', 'rt2-coretop', { cx: g.bal[0], cy: base - hs + g.coreW * 0.14, rx: g.coreW / 2, ry: g.coreW * 0.14 }, sLive);
        g.startTop = base - hs;
        // the start level carried across to the ruler
        E.ref = mk('line', 'rt2-ref', { x1: g.bal[0] + g.coreW / 2 + 4, x2: g.ruler + 6, y1: g.startTop, y2: g.startTop }, sLive);
        // the after core (live)
        E.core = mk('path', 'rt2-core', { fill: 'url(#rt2g-core)' }, sLive);
        E.coreTop = mk('ellipse', 'rt2-coretop', { cx: g.bal[1], rx: g.coreW / 2, ry: g.coreW * 0.14 }, sLive);
        E.coreHi = mk('path', 'rt2-corehi', null, sLive);
        E.drops = [0, 1, 2].map(function(){ return mk('ellipse', 'rt2-drop', { rx: Math.max(3, 3.4 * s), ry: Math.max(4, 4.6 * s) }, sLive); });
        // the change: a bracket beside the after core
        E.chg = mk('path', 'rt2-chg', null, sLive);
        // the ruler in tenths of the start mass
        var rl = mk('g', 'rt2-rulerg', null, sLive), lo = CORE.min / CORE.start - 1, hi = CORE.max / CORE.start - 1;
        mk('line', 'rt2-ruler', { x1: g.ruler, x2: g.ruler, y1: base - CORE.max * g.kM, y2: base - CORE.min * g.kM }, rl);
        var stepPx = CORE.start * 0.1 * g.kM, every = stepPx >= 19 ? 1 : 2;
        g.rulerTicks = [];
        for(var k = Math.round(lo * 10); k <= Math.round(hi * 10); k++){
          var y = base - CORE.start * (1 + k / 10) * g.kM, big = k === 0;
          mk('line', 'rt2-rtick' + (big ? ' is-zero' : ''), { x1: g.ruler, x2: g.ruler + (big ? 12 : 7), y1: y, y2: y }, rl);
          if(k % every === 0){ var t = mk('text', 'rt2-rnum' + (big ? ' is-zero' : ''), { x: g.ruler + 15, y: y + 4 }, rl); t.textContent = (k > 0 ? '+' : k < 0 ? '−' : '') + Math.abs(k * 10) + '%'; g.rulerTicks.push([g.ruler + 15, y - 7, g.ruler + 15 + tw(t.textContent, 11.5, 700), y + 6]); }
        }
        // labels
        sLabs.innerHTML = '';
        E.lStart = mk('text', 'rt2-clab', { x: g.bal[0], 'text-anchor': 'middle' }, sLabs); E.lStart.textContent = 'Start';
        E.lAfter = mk('text', 'rt2-clab', { x: g.bal[1], y: Math.min(g.H - 8, g.bench + 24), 'text-anchor': 'middle' }, sLabs); E.lAfter.textContent = 'After a day';
        at(E.lStart, { y: Math.min(g.H - 8, g.bench + 24) });
        E.lcd0 = mk('text', 'rt2-lcdt', { x: g.bal[0], y: g.bench - g.balH / 2 + 6, 'text-anchor': 'middle' }, sLabs); E.lcd0.textContent = F(CORE.start, CORE.dp) + ' ' + CORE.unit;
        E.lcd1 = mk('text', 'rt2-lcdt', { x: g.bal[1], y: g.bench - g.balH / 2 + 6, 'text-anchor': 'middle' }, sLabs);
        E.pPct = pill(sLabs, 'is-pct'); E.pChg = pill(sLabs, 'is-chg');
        svg.setAttribute('aria-label', 'Two potato cores on two balances: the start core and the same core after a day in solution. A ruler beside it is marked in tenths of the start mass.');
      }

      /* ---------------------------------------------------- the graph (tabs 1 and 2) */
      var GE = {};
      function drawGraph(){
        var g = GG, h = [];
        gDefs.innerHTML = '<clipPath id="rt2-gclip"><rect x="' + g.L + '" y="' + g.T + '" width="' + g.pw + '" height="' + g.ph + '"/></clipPath>';
        h.push('<rect class="rt2-gpaper" x="0" y="0" width="' + g.W + '" height="' + g.H + '" rx="14"/>');
        for(var v = 0; v <= VMAX + 1e-9; v += 5){ var y = g.y(v); h.push('<line class="rt2-ggrid" x1="' + g.x(0) + '" x2="' + (g.L + g.pw) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><text class="rt2-gtick" x="' + (g.L - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>'); }
        for(var t = 0; t <= TMAX; t++){ var x = g.x(t); h.push('<line class="rt2-ggrid is-v" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + g.T + '" y2="' + g.y(0) + '"/><text class="rt2-gtick" x="' + x.toFixed(1) + '" y="' + (g.T + g.ph + 17) + '" text-anchor="middle">' + t + '</text>'); }
        h.push('<line class="rt2-gaxis" x1="' + g.x(0) + '" x2="' + (g.L + g.pw) + '" y1="' + g.y(0) + '" y2="' + g.y(0) + '"/><line class="rt2-gaxis" x1="' + g.x(0) + '" x2="' + g.x(0) + '" y1="' + g.T + '" y2="' + g.y(0) + '"/>');
        h.push('<text class="rt2-gtitle" x="' + (g.L - 4) + '" y="18">' + esc(RUN.label + ' collected (' + UY + ')') + '</text>');
        h.push('<text class="rt2-gtick is-unit" x="' + (g.L + g.pw + 10) + '" y="' + (g.T + g.ph + 17) + '">' + esc('Time (' + UT + ')') + '</text>');
        var pts = []; for(var i = 0; i <= 120; i++){ var tt = TMAX * i / 120; pts.push(g.x(tt).toFixed(1) + ',' + g.y(f(tt)).toFixed(1)); }
        h.push('<polyline class="rt2-curve" points="' + pts.join(' ') + '"/>');
        g.curvePts = []; for(i = 0; i <= 60; i++){ var t2 = TMAX * i / 60; g.curvePts.push([g.x(t2), g.y(f(t2))]); }
        TS.forEach(function(t, i){ h.push('<circle class="rt2-gpt" cx="' + g.x(t).toFixed(1) + '" cy="' + g.y(VS[i]).toFixed(1) + '" r="4.5"/>'); });
        gStatic.innerHTML = h.join('');
        gLive.innerHTML = ''; gLabs.innerHTML = '';
        GE.tan = mk('line', 'rt2-tan', { 'clip-path': 'url(#rt2-gclip)' }, gLive);
        GE.legT = mk('line', 'rt2-leg is-dt', null, gLive);
        GE.legY = mk('line', 'rt2-leg is-dy', null, gLive);
        GE.hyp = mk('line', 'rt2-hyp', null, gLive);
        GE.brk = mk('path', 'rt2-brk', null, gLive);
        GE.pA = mk('circle', 'rt2-gend', { r: 6 }, gLive); GE.pB = mk('circle', 'rt2-gend', { r: 6 }, gLive);
        GE.pRate = pill(gLabs, 'is-rate'); GE.pDy = pill(gLabs, 'is-dy'); GE.pDt = pill(gLabs, 'is-dt');
        GE.pRate.px = 13.5; GE.pRate.h = 26;
        gsvg.setAttribute('aria-label', 'Graph of the oxygen collected against time, through the six readings.');
      }
      // label placement on the graph: the first candidate clear of the curve, the points, the other labels and the plot's edge
      function hitsCurve(b, pad){
        var c = GG.curvePts;
        for(var i = 0; i < c.length - 1; i++){
          var x0 = c[i][0], y0 = c[i][1], x1 = c[i + 1][0], y1 = c[i + 1][1];
          if(Math.max(x0, x1) < b[0] - pad || Math.min(x0, x1) > b[2] + pad) continue;
          for(var k = 0; k <= 4; k++){ var x = x0 + (x1 - x0) * k / 4, y = y0 + (y1 - y0) * k / 4; if(x > b[0] - pad && x < b[2] + pad && y > b[1] - pad && y < b[3] + pad) return true; }
        }
        for(i = 0; i < N; i++){ var px = GG.x(TS[i]), py = GG.y(VS[i]); if(px > b[0] - 6 && px < b[2] + 6 && py > b[1] - 6 && py < b[3] + 6) return true; }
        return false;
      }
      function hitsLine(b, x0, y0, x1, y1, pad){
        for(var k = 0; k <= 40; k++){ var x = x0 + (x1 - x0) * k / 40, y = y0 + (y1 - y0) * k / 40; if(x > b[0] - pad && x < b[2] + pad && y > b[1] - pad && y < b[3] + pad) return true; }
        return false;
      }
      function overlap(a, b, pad){ return a && b && a[0] < b[2] + pad && a[2] > b[0] - pad && a[1] < b[3] + pad && a[3] > b[1] - pad; }
      function placePill(p, s, cands, avoid){
        var w = Math.ceil(tw(s, p.px, 800)) + 16, h = p.h;
        for(var i = 0; i < cands.length; i++){
          var c = cands[i], x0 = c[2] === 'end' ? c[0] - w : c[2] === 'start' ? c[0] : c[0] - w / 2, b = [x0, c[1] - h / 2, x0 + w, c[1] + h / 2];
          if(b[0] < 2 || b[2] > GG.W - 2 || b[1] < GG.T - 2 || b[3] > GG.H - 2) continue;
          if(!c[3] && hitsCurve(b, 3)) continue;
          if(avoid.some(function(fn){ return fn(b); })) continue;
          p.set(s, c[0], c[1], c[2]); return true;
        }
        p.hide(); return false;
      }

      /* ---------------------------------------------------- painting a frame */
      var bubs = [], gasAt = null;
      function tEnd(){ return MD.tab === 'moment' ? DR.m : DR.b; }
      function paintCatalase(){
        var g = G, cx = g.cx, ta = DR.a, tb = tEnd(), vb = f(tb), yb = g.gy0 + vb * g.kV;
        at(E.gas, { y: g.cylIn[1], height: Math.max(0, yb - g.cylIn[1]) });
        at(E.cwater, { y: yb, height: Math.max(0, g.mouth - yb) });
        at(E.lvB, { y1: yb, y2: yb });
        var avg = MD.tab === 'avg', va = f(ta), ya = g.gy0 + va * g.kV;
        E.band.style.display = avg ? '' : 'none'; E.lvA.style.display = avg ? '' : 'none';
        // the numbers, from what is drawn
        var dt = tb - ta, dtS = tStr(dt), dy = vb - va, dyR = r1(dy);
        if(avg){
          at(E.band, { y: ya, height: Math.max(0, yb - ya) });
          at(E.lvA, { y1: ya, y2: ya });
          var mid = clamp((ya + yb) / 2, g.cylIn[1] + 12, g.mouth - 12);
          E.pDy.set('Δy ' + F(dyR, RUN.dp) + ' ' + UY, cx + 18 * g.s + 8, mid, 'start');
          E.pDt.set('Δt ' + dtS + ' ' + UT, g.tx, Math.min(g.H - 14, g.bench + 22), 'middle');
          E.pGas.hide();
        } else {
          E.pDy.hide(); E.pDt.hide();
          E.pGas.set(F(r1(vb), RUN.dp) + ' ' + UY + ' O₂', cx + 18 * g.s + 8, clamp(yb, g.cylIn[1] + 12, g.mouth - 12), 'start');
        }
        // the timer reads the drawn end time
        var secs = Math.round(tb * 60), lcd = Math.floor(secs / 60) + ':' + ('0' + (secs % 60)).slice(-2);
        txt(E.lcd, lcd);
        // foam: high while the reaction is fast (the slope at the drawn time)
        var rate = fd(tb), fh = clamp(rate / 6, 0, 1) * 34 * g.s, base = g.foamBase, fx = g.fx, hwB = g.hw(base), top = base - fh, hwT = g.hw(top), d;
        if(fh < 1.5) d = 'M0 0';
        else { var nb = 5; d = 'M' + (fx - hwB).toFixed(1) + ' ' + base.toFixed(1) + 'L' + (fx - hwT).toFixed(1) + ' ' + (top + 3).toFixed(1); for(var i = 0; i < nb; i++){ var x0 = fx - hwT + 2 * hwT * i / nb, x1 = fx - hwT + 2 * hwT * (i + 1) / nb; d += 'Q' + ((x0 + x1) / 2).toFixed(1) + ' ' + (top - 5 * g.s * (i % 2 ? 0.6 : 1)).toFixed(1) + ' ' + x1.toFixed(1) + ' ' + (top + 3).toFixed(1); } d += 'L' + (fx + hwB).toFixed(1) + ' ' + base.toFixed(1) + 'Z'; }
        at(E.foamP, { d: d });
        if(MD.tab === 'moment' && fh >= 6){ at(E.foamL, { x: fx + g.hw(top) + 6, y: top + 6 }); txt(E.foamL, rate >= 3.5 ? 'Fast fizz' : rate <= 1.5 ? 'Slow fizz' : 'Fizzing'); E.foamL.style.display = ''; }
        else E.foamL.style.display = 'none';
        // the readings on the clipboard: the rows of the interval
        if(E.rows) E.rows.forEach(function(r, i){
          var on = avg ? (Math.abs(TS[i] - ta) < 0.02 || Math.abs(TS[i] - tb) < 0.02) : false;
          r.hl.classList.toggle('is-on', on); r.a.classList.toggle('is-on', on); r.b.classList.toggle('is-on', on);
        });
        return { dt: dt, dtS: dtS, dy: dy, dyR: dyR, vb: vb, va: va, rate: rate };
      }
      function paintGraph(R){
        var g = GG, avg = MD.tab === 'avg', ta = DR.a, tb = tEnd(), xa = g.x(ta), ya = g.y(f(ta)), xb = g.x(tb), yb = g.y(f(tb));
        var avoid = [], kpts = avg ? [[xa, ya], [xb, yb]] : [[xb, yb]];
        var knobs = function(b){ return kpts.some(function(k){ var dx = Math.max(b[0] - k[0], 0, k[0] - b[2]), dy = Math.max(b[1] - k[1], 0, k[1] - b[3]); return Math.hypot(dx, dy) < 26; }); };
        if(avg){
          GE.tan.style.display = 'none';
          at(GE.legT, { x1: xa, y1: ya, x2: xb, y2: ya }); at(GE.legY, { x1: xb, y1: ya, x2: xb, y2: yb }); at(GE.hyp, { x1: xa, y1: ya, x2: xb, y2: yb });
          [GE.legT, GE.legY, GE.hyp, GE.pA, GE.brk].forEach(function(e){ e.style.display = ''; });
          at(GE.pA, { cx: xa, cy: ya }); at(GE.pB, { cx: xb, cy: yb });
          // the rate: from the two numbers on the screen (Δy and Δt as shown)
          var dtV = tVal(R.dt), rate = dtV > 0 ? R.dyR / dtV : 0;
          R.rateS = F(rate, RUN.d); R.rateV = rate;
          // Δt: under its leg when there is room, else a bracket under the time axis
          var yAx = g.T + g.ph, sDt = 'Δt ' + R.dtS + ' ' + UT, sDy = 'Δy ' + F(R.dyR, RUN.dp) + ' ' + UY;
          var hyp = function(b){ return hitsLine(b, xa, ya, xb, yb, 3); };
          var onLeg = ya < yAx - 30 && placePill(GE.pDt, sDt, [[(xa + xb) / 2, ya + 16, 'middle']], [hyp, knobs]);
          if(!onLeg){
            var by = yAx + 38;
            at(GE.brk, { d: 'M' + xa.toFixed(1) + ' ' + (by - 12).toFixed(1) + 'V' + (by - 6).toFixed(1) + 'H' + xb.toFixed(1) + 'V' + (by - 12).toFixed(1) });
            var cxm = clamp((xa + xb) / 2, g.L + 30, g.L + g.pw - 10);
            GE.pDt.set(sDt, cxm, by + 4, 'middle');
          } else at(GE.brk, { d: 'M0 0' });
          avoid.push(function(b){ return overlap(b, GE.pDt.box(), 4); });
          var lowMid = Math.max((ya + yb) / 2, yb + 13);
          placePill(GE.pDy, sDy, [[xb + 9, Math.max(lowMid, yb + 36), 'start'], [xb + 27, lowMid, 'start'], [xb + 27, yb + 28, 'start'], [xb + 9, ya + 14, 'start'], [xb - 9, lowMid, 'end', true]], avoid.concat([hyp, knobs]));
          avoid.push(function(b){ return overlap(b, GE.pDy.box(), 4); });
          GE.pRate.set('slope ' + R.rateS + ' ' + RU, g.W - 8, 16, 'end');
        } else {
          [GE.legT, GE.legY, GE.hyp, GE.pA, GE.brk].forEach(function(e){ e.style.display = ''; });
          GE.pA.style.display = 'none'; at(GE.brk, { d: 'M0 0' });
          var sl = fd(tb), slR = r1(sl), x0 = g.L, x1 = g.L + g.pw;
          GE.tan.style.display = '';
          at(GE.tan, { x1: x0, y1: g.y(f(tb) + sl * (g.t(x0) - tb)), x2: x1, y2: g.y(f(tb) + sl * (g.t(x1) - tb)) });
          at(GE.pB, { cx: xb, cy: yb });
          // a 1 minute run along the tangent, to the right (to the left near the end)
          var back = tb > TMAX - 1, t2 = back ? tb - 1 : tb + 1, x2 = g.x(t2), y2 = g.y(f(tb) + sl * (t2 - tb));
          at(GE.legT, { x1: xb, y1: yb, x2: x2, y2: yb }); at(GE.legY, { x1: x2, y1: yb, x2: x2, y2: y2 });
          GE.hyp.style.display = 'none';
          R.slR = slR; R.rateS = F(slR, 1); R.back = back;
          var tanHit = function(b){ return hitsLine(b, x0, g.y(f(tb) + sl * (g.t(x0) - tb)), x1, g.y(f(tb) + sl * (g.t(x1) - tb)), 3); };
          var sRun = 'run 1 ' + UT, sRise = 'rise ' + F(slR, 1) + ' ' + UY;
          var yAx2 = g.T + g.ph;
          var okRun = placePill(GE.pDt, sRun, [[(xb + x2) / 2, yb + 16, 'middle']], [tanHit, knobs]);
          if(!okRun){
            var by2 = yAx2 + 38, lo = Math.min(xb, x2), hi = Math.max(xb, x2);
            at(GE.brk, { d: 'M' + lo.toFixed(1) + ' ' + (by2 - 12).toFixed(1) + 'V' + (by2 - 6).toFixed(1) + 'H' + hi.toFixed(1) + 'V' + (by2 - 12).toFixed(1) });
            GE.pDt.set(sRun, clamp((xb + x2) / 2, g.L + 30, g.L + g.pw - 10), by2 + 4, 'middle');
          }
          avoid.push(function(b){ return overlap(b, GE.pDt.box(), 4); });
          var mid2 = (yb + y2) / 2;
          placePill(GE.pDy, sRise, back ? [[x2 - 9, mid2, 'end'], [x2 - 9, yb - 16, 'end'], [x2 - 9, yb - 40, 'end'], [x2 - 9, y2 + 16, 'end']] : [[x2 + 9, mid2, 'start'], [x2 + 9, yb + 16, 'start'], [x2 + 9, yb + 40, 'start'], [x2 + 9, y2 - 14, 'start'], [x2 - 9, mid2, 'end']], avoid.concat([tanHit, knobs]));
          avoid.push(function(b){ return overlap(b, GE.pDy.box(), 4); });
          GE.pRate.set('rate ≈ ' + R.rateS + ' ' + RU, g.W - 8, 16, 'end');
        }
      }
      function paintCores(){
        var g = G, s = g.s, m = DR.c, base = g.pan, hgt = m * g.kM, top = base - hgt, bx = g.bal[1], loss = Math.max(0, 1 - m / CORE.start), gain = Math.max(0, m / CORE.start - 1);
        at(E.core, { d: corePath(bx, base, hgt, g.coreW, loss * 9 * s) });
        at(E.coreTop, { cy: top + g.coreW * 0.14 });
        at(E.coreHi, { d: 'M' + (bx - g.coreW * 0.22).toFixed(1) + ' ' + (top + g.coreW * 0.4).toFixed(1) + 'V' + (base - g.coreW * 0.2).toFixed(1) });
        E.coreHi.style.opacity = (0.25 + Math.min(0.6, gain * 2)).toFixed(2);
        E.drops.forEach(function(d, i){ var on = gain > 0.04 + i * 0.07; d.style.display = on ? '' : 'none'; if(on) at(d, { cx: bx + (i % 2 ? 1 : -1) * g.coreW * 0.24, cy: top + hgt * (0.3 + 0.22 * i) }); });
        
        var mR = r2(m), chg = r2(mR - CORE.start), pc = chg / CORE.start * 100, pcR = r1(pc);
        txt(E.lcd1, F(mR, CORE.dp) + ' ' + CORE.unit);
        // the change bracket on the after core's left
        var xL = bx - g.coreW / 2 - 9 * s;
        if(Math.abs(top - g.startTop) > 2) at(E.chg, { d: 'M' + (xL + 5).toFixed(1) + ' ' + g.startTop.toFixed(1) + 'H' + xL.toFixed(1) + 'V' + top.toFixed(1) + 'H' + (xL + 5).toFixed(1) });
        else at(E.chg, { d: 'M0 0' });
        E.chg.classList.toggle('is-loss', chg < 0);
        E.pChg.g.classList.toggle('is-loss', chg < 0);
        if(Math.abs(chg) >= 0.005) E.pChg.set(sgn(chg, CORE.dp) + ' ' + CORE.unit, xL - 6, (top + g.startTop) / 2, 'end'); else E.pChg.hide();
        E.pPct.g.classList.toggle('is-loss', pcR < 0);
        // the percent at the core's top, right of the ruler's numbers
        var rx = g.ruler + 15 + tw('+50%', 11.5, 700) + 10;
        E.pPct.set(sgn(pcR, 1) + '%', rx, clamp(top, 30, base - 14), 'start');
        return { m: mR, chg: chg, pc: pcR };
      }
      var lastR = null;
      function paint(){
        if(!G) return;
        var R;
        if(MD.tab === 'pct'){ R = paintCores(); R.tab = 'pct'; }
        else { R = paintCatalase(); if(GG) paintGraph(R); R.tab = MD.tab; }
        lastR = R;
        paintCause(R);
        hA.place(); hB.place(); hM.place(); hC.place();
        if(cue.active()) cue.place();
      }

      /* ---------------------------------------------------- the cause line */
      function paintCause(R){
        if(cause.el.classList.contains('is-take') && busy()) cause.take(null);
        if(cause.el.classList.contains('is-take')) return;
        if(R.tab === 'avg') cause.set([{ t: 'Δy = ' + F(R.dyR, RUN.dp) + ' ' + UY, role: 'dy', say: 'Δy is ' + F(R.dyR, RUN.dp) + ' ' + UY + ' of oxygen' }, { t: '÷ Δt ' + R.dtS + ' ' + UT, role: 'dt', say: 'divided by Δt, ' + R.dtS + ' ' + UT }, { t: '= ' + R.rateS + ' ' + RU, role: 'rate', say: 'a rate of ' + R.rateS + ' ' + UY + ' per ' + UT }]);
        else if(R.tab === 'moment') cause.set([{ t: 'at ' + tStr(DR.m) + ' ' + UT, role: 'dt', say: 'At ' + tStr(DR.m) + ' ' + UT }, { t: 'rises ' + F(R.slR, 1) + ' ' + UY + ' in 1 ' + UT, role: 'dy', say: 'the tangent rises ' + F(R.slR, 1) + ' ' + UY + ' in 1 ' + UT }, { t: '≈ ' + R.rateS + ' ' + RU, role: 'rate', say: 'a rate of about ' + R.rateS + ' ' + UY + ' per ' + UT }]);
        else cause.set([{ t: sgn(R.chg, CORE.dp) + ' ' + CORE.unit, role: R.chg < 0 ? 'loss' : 'chg', say: (R.chg < 0 ? 'A loss of ' : 'A gain of ') + F(Math.abs(R.chg), CORE.dp) + ' ' + CORE.unit }, { t: '÷ start ' + F(CORE.start, CORE.dp) + ' ' + CORE.unit, role: 'start', say: 'divided by the start, ' + F(CORE.start, CORE.dp) + ' ' + CORE.unit }, { t: '× 100 = ' + sgn(R.pc, 1) + '%', role: 'pct', say: 'times 100 is ' + sgn(R.pc, 1) + ' percent' }]);
      }

      /* ---------------------------------------------------- animation */
      function busy(){ for(var k in TW) return true; return bubs.some(function(b){ return b.on; }); }
      function go(key, v, instant){
        if(instant || calm()){
          delete TW[key]; DR[key] = v;
          if(calm() && !instant){ sceneBox.classList.remove('is-fade'); void sceneBox.offsetWidth; sceneBox.classList.add('is-fade'); }
          kick(); return;
        }
        var from = DR[key], d = Math.abs(v - from), span = key === 'c' ? d / CORE.start * 5 : d;
        if(d < 1e-9){ delete TW[key]; kick(); return; }
        TW[key] = { from: from, to: v, t0: now(), dur: clamp(220 + 260 * span, 220, 900) };
        kick();
      }
      function kick(){ if(!raf) raf = requestAnimationFrame(frame); }
      function spawnBubbles(){
        if(MD.tab === 'pct' || !G) { gasAt = null; return; }
        var v = f(tEnd());
        if(gasAt == null || calm()){ gasAt = v; return; }
        var add = v - gasAt;
        if(add < 0){ gasAt = v; return; }
        var per = 0.25;
        while(add >= per){
          add -= per; gasAt += per;
          var b = bubs.filter(function(x){ return !x.on; })[0]; if(!b) break;
          b.on = true; b.t0 = now(); b.dx = (Math.random() - 0.5) * G.cw * 0.9; b.dur = 520 + Math.random() * 180; b.el.style.display = '';
        }
      }
      function moveBubbles(t){
        var g = G, top = g.gy0 + f(tEnd()) * g.kV;
        bubs.forEach(function(b){
          if(!b.on) return;
          var k = (t - b.t0) / b.dur, x = g.tip[0] + b.dx * Math.min(1, k * 2), y = g.tip[1] - (g.tip[1] - top) * k;
          if(k >= 1 || y <= top + 2){ b.on = false; b.el.style.display = 'none'; return; }
          b.el.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
        });
      }
      function frame(){
        raf = 0;
        var t = now();
        for(var k in TW){
          var w = TW[k], p = clamp((t - w.t0) / w.dur, 0, 1);
          DR[k] = w.from + (w.to - w.from) * ease(p);
          if(p >= 1){ DR[k] = w.to; delete TW[k]; }
        }
        spawnBubbles();
        if(MD.tab !== 'pct' && G) moveBubbles(t);
        paint();
        if(busy()) raf = requestAnimationFrame(frame);
        else settled();
      }
      function stopAll(){
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        for(var k in TW){ DR[k] = TW[k].to; delete TW[k]; }
        bubs.forEach(function(b){ b.on = false; b.el.style.display = 'none'; });
        gasAt = null;
      }

      /* ---------------------------------------------------- the controls on the picture */
      function nearestIdx(t){ var best = 0, bd = 1e9; TS.forEach(function(x, i){ var d = Math.abs(x - t); if(d < bd){ bd = d; best = i; } }); return best; }
      // every knob sits on what is DRAWN (DR), so it moves with the picture during a tween
      var hB = K.handle(gLayer, { key: 'rt2-end', chip: false, label: 'End of the interval (time)', value: TS.indexOf(MD.b), min: 1, max: N - 1, step: 1,
        at: function(){ return GG ? [GG.x(DR.b), GG.y(f(DR.b))] : [NaN, NaN]; },
        pick: function(x, y, v){ var i = nearestIdx(GG.t(x)); return i <= TS.indexOf(MD.a) ? null : i; },
        keys: function(v, key, big){ var a = TS.indexOf(MD.a); if(key === 'ArrowRight' || key === 'ArrowUp') return Math.min(N - 1, v + 1); if(key === 'ArrowLeft' || key === 'ArrowDown') return Math.max(a + 1, v - 1); if(key === 'Home') return a + 1; if(key === 'End') return N - 1; return null; },
        valuetext: function(v){ return TS[v] + ' ' + UT + ', ' + F(VS[v], RUN.dp) + ' ' + UY; },
        onStart: function(){ hideCue(true); tourDid('end'); },
        onInput: function(v){ MD.b = TS[v]; go('b', MD.b); } });
      var hA = K.handle(gLayer, { key: 'rt2-start', quiet: true, label: 'Start of the interval (time)', value: TS.indexOf(MD.a), min: 0, max: N - 2, step: 1,
        at: function(){ return GG ? [GG.x(DR.a), GG.y(f(DR.a))] : [NaN, NaN]; },
        pick: function(x, y, v){ var i = nearestIdx(GG.t(x)); return i >= TS.indexOf(MD.b) ? null : i; },
        keys: function(v, key){ var b = TS.indexOf(MD.b); if(key === 'ArrowRight' || key === 'ArrowUp') return Math.min(b - 1, v + 1); if(key === 'ArrowLeft' || key === 'ArrowDown') return Math.max(0, v - 1); if(key === 'Home') return 0; if(key === 'End') return b - 1; return null; },
        valuetext: function(v){ return TS[v] + ' ' + UT + ', ' + F(VS[v], RUN.dp) + ' ' + UY; },
        onStart: function(){ hideCue(true); },
        onInput: function(v){ MD.a = TS[v]; go('a', MD.a); } });
      var dragM = false;
      var hM = K.handle(gLayer, { key: 'rt2-moment', chip: false, label: 'A moment on the curve (time)', value: MD.m, min: 0, max: TMAX, step: 0.1,
        at: function(){ return GG && MD.tab === 'moment' ? [GG.x(DR.m), GG.y(f(DR.m))] : [NaN, NaN]; },
        pick: function(x){ return clamp(r1(GG.t(x)), 0, TMAX); },
        dir: function(){ if(!GG) return 0; var dx = (GG.pw - GG.IN) / TMAX, dy = fd(DR.m) * (GG.ph - GG.IN) / VMAX; return -Math.atan2(dy, dx) * 180 / Math.PI; },
        keys: function(v, key, big){ var st = big ? 1 : 0.1; if(key === 'ArrowRight' || key === 'ArrowUp' || key === 'PageUp') return clamp(r1(v + (key === 'PageUp' ? 1 : st)), 0, TMAX); if(key === 'ArrowLeft' || key === 'ArrowDown' || key === 'PageDown') return clamp(r1(v - (key === 'PageDown' ? 1 : st)), 0, TMAX); if(key === 'Home') return 0; if(key === 'End') return TMAX; return null; },
        valuetext: function(v){ return tStr(v) + ' ' + UT + ', rate about ' + F(r1(fd(v)), 1) + ' ' + RU; },
        onStart: function(){ dragM = true; hideCue(true); tourDid('end'); },
        onEnd: function(){ dragM = false; kick(); },
        onInput: function(v){ MD.m = v; go('m', v, hM.dragging()); } });
      var hC = K.handle(sLayer, { key: 'rt2-core', chip: false, label: 'Mass of the core after a day (grams)', value: MD.c, min: CORE.min, max: CORE.max, step: 0.01,
        at: function(){ return G && G.tab === 'pct' ? [G.bal[1], G.pan - DR.c * G.kM] : [NaN, NaN]; },
        pick: function(x, y){ return clamp(r2((G.pan - y) / G.kM), CORE.min, CORE.max); },
        dir: function(){ return 90; },
        keys: function(v, key, big){ var st = big ? 0.35 : 0.05; if(key === 'ArrowUp' || key === 'ArrowRight' || key === 'PageUp') return clamp(r2(v + (key === 'PageUp' ? 0.35 : st)), CORE.min, CORE.max); if(key === 'ArrowDown' || key === 'ArrowLeft' || key === 'PageDown') return clamp(r2(v - (key === 'PageDown' ? 0.35 : st)), CORE.min, CORE.max); if(key === 'Home') return CORE.min; if(key === 'End') return CORE.max; return null; },
        valuetext: function(v){ var pc = r1((r2(v) - CORE.start) / CORE.start * 100); return F(v, CORE.dp) + ' ' + CORE.unit + ', ' + sgn(pc, 1) + ' percent'; },
        onStart: function(){ hideCue(true); tourDid('end'); },
        onInput: function(v){ MD.c = v; go('c', v, hC.dragging()); } });
      // a press on the curve away from a knob grabs the nearest knob of this tab
      gsvg.addEventListener('pointerdown', function(e){
        if(St.mode === 'quiz' && St.part !== 'goals') return;
        if(MD.tab === 'moment'){ hM.grab(e); return; }
        if(MD.tab !== 'avg' || !GG) return;
        var r = gsvg.getBoundingClientRect(), x = e.clientX - r.left, t = GG.t(x), i = nearestIdx(t), a = TS.indexOf(MD.a), b = TS.indexOf(MD.b);
        if(Math.abs(GG.x(TS[i]) - x) > 30) return;
        if(i > a && (Math.abs(i - b) <= Math.abs(i - a) || i > b)) hB.grab(e); else if(i < b) hA.grab(e);
      });

      /* ---------------------------------------------------- tabs, layout */
      function showHandles(){
        var t = MD.tab; hA.hide(t !== 'avg'); hB.hide(t !== 'avg'); hM.hide(t !== 'moment'); hC.hide(t !== 'pct');
      }
      function setTab(v, user){
        if(TABS.indexOf(v) < 0 || v === MD.tab) return;
        stopAll();
        MD.tab = v; stage.setAttribute('data-tab', v);
        head.purpose(EX.purpose[v]);
        if(tabs.value() !== v) tabs.value(v);
        cause.take(null);
        showHandles();
        lastWH = '';
        sceneBox.classList.remove('is-fade'); void sceneBox.offsetWidth; sceneBox.classList.add('is-fade');
        layoutNow(true);
        if(user){ hideCue(true); tourDid('tab'); }
        settled();
      }
      var lastWH = '';
      function layoutNow(force){
        var key = MD.tab + ':' + sceneBox.clientWidth + 'x' + sceneBox.clientHeight + ':' + graphBox.clientWidth + 'x' + graphBox.clientHeight;
        if(!force && key === lastWH) return;
        if(!sceneBox.clientWidth) return;
        lastWH = key;
        var g = layoutScene(); if(!g) return;
        G = g; svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H);
        if(MD.tab === 'pct') drawCores(); else drawCatalase();
        if(MD.tab !== 'pct'){ var gg = layoutGraph(); if(gg){ GG = gg; gsvg.setAttribute('viewBox', '0 0 ' + gg.W + ' ' + gg.H); drawGraph(); } }
        gasAt = null;
        paint();
      }

      /* ---------------------------------------------------- settled: takeaways, goals, live text, "?" */
      function settled(){
        if(busy() || !lastR) return;
        var R = lastR, msg = cause.text();
        if(R.tab === 'avg'){
          var a = TS.indexOf(MD.a), b = TS.indexOf(MD.b), k = a + ':' + b;
          if(!measured.length || measured[measured.length - 1].k !== k){ measured.push({ k: k, a: a, b: b, r: (VS[b] - VS[a]) / (TS[b] - TS[a]) }); if(measured.length > 3) measured.shift(); }
          var take = null;
          if(a === 0 && b === N - 1) take = 'The average over the whole run hides the fall from ' + F(VS[1] - VS[0], RUN.d) + ' to ' + F(VS[N - 1] - VS[N - 2], RUN.d) + ' ' + RU + '.';
          else if(a >= N - 3 && b === N - 1) take = 'Flatter slope, smaller rate: the reaction is slowing down.';
          if(take && St.mode === 'explore'){ cause.take(take); msg += ' ' + take; }
          goal('early', a === 0 && b === 1, 'The first minute: <b>' + F((VS[1] - VS[0]), RUN.d) + ' ' + esc(RU) + '</b>, the steepest stretch.');
          goal('late', a >= N - 3 && b === N - 1, 'Near the end: <b>' + F((VS[b] - VS[a]) / (TS[b] - TS[a]), RUN.d) + ' ' + esc(RU) + '</b>, smaller than at the start, so it is <b>slowing down</b>.');
          goal('whole', a === 0 && b === N - 1, 'The whole run averages <b>' + F((VS[N - 1] - VS[0]) / TMAX, RUN.d) + ' ' + esc(RU) + '</b>: faster than that at first, slower later.');
        } else if(R.tab === 'moment'){
          if(DR.m >= TMAX * 0.75 && St.mode === 'explore'){ var tk = 'A flatter tangent: the rate has fallen as the H₂O₂ runs out.'; cause.take(tk); msg += ' ' + tk; }
          goal('late', DR.m >= TMAX * 0.75, 'At ' + tStr(DR.m) + ' ' + esc(UT) + ' the tangent is nearly flat (about <b>' + F(r1(fd(DR.m)), 1) + ' ' + esc(RU) + '</b>): the reaction is <b>slowing down</b>.');
        } else {
          goal('loss', Math.abs(R.pc + 10) < 0.05, 'Lost <b>' + F(Math.abs(R.chg), CORE.dp) + ' ' + esc(CORE.unit) + '</b> of ' + F(CORE.start, CORE.dp) + ': <b>−10.0%</b>. A loss keeps its minus sign.');
        }
        say(msg);
        refHtml();
      }

      /* ---------------------------------------------------- the first visit cue and "Show me how" */
      var cue = K.cue(gLayer, { key: 'apbio-rates', text: EX.cue.avg, side: 'above', at: function(){ return GG ? [GG.x(MD.b), GG.y(f(MD.b)) - 6] : [0, 0]; } });
      function hideCue(used){ if(cue.active()) cue.hide(used); }
      var tour = K.tour({ key: 'apbio-rates', label: 'Show me how', steps: [
        { id: 'end', text: 'Drag the knob. The rate between the two points is the slope: Δy ÷ Δt.', target: function(){ var h = MD.tab === 'avg' ? hB : MD.tab === 'moment' ? hM : hC; return h.knob; } },
        { id: 'scene', text: 'The picture shows the same change: the oxygen in the cylinder, the timer, the core on the balance.', target: function(){ return sceneBox; } },
        { id: 'tab', text: 'Each tab is one idea: a rate over time, the rate at a moment, percent change.', target: function(){ return tabs.el; } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      function tourDid(id){ if(tour.active()) tour.did(id); }
      function startTour(){ if(St.mode !== 'explore') return; hideCue(false); tour.start(true); }

      /* ---------------------------------------------------- "?": the numbers worked out */
      var ref = document.createElement('div'); ref.className = 'rt2-ref';
      ref.innerHTML = '<p class="rt2-ref-how"><button type="button" class="tk2-how rt2-ref-tour">Show me how</button></p><div class="rt2-ref-live"></div>' + EX.refHtml;
      ref.querySelector('.rt2-ref-tour').addEventListener('click', function(){ if(St.mode !== 'explore') return; var x = document.querySelector('.ls-sheet-x, .ls-sheet .ls-x'); if(x) x.click(); setTimeout(startTour, 60); });
      var refLive = ref.querySelector('.rt2-ref-live');
      function tableHtml(mark){
        return '<div class="bt-tablewrap"><table class="rt2-tab"><thead><tr><th scope="col">Time (' + esc(UT) + ')</th><th scope="col">' + esc(RUN.label + ' (' + UY + ')') + '</th></tr></thead><tbody>' +
          TS.map(function(t, i){ return '<tr' + (mark.indexOf(i) > -1 ? ' class="is-on"' : '') + '><td>' + t + '</td><td>' + F(VS[i], RUN.dp) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }
      function refHtml(){
        var R = lastR; if(!R) return;
        if(R.tab === 'avg'){
          var a = TS.indexOf(MD.a), b = TS.indexOf(MD.b), dy = VS[b] - VS[a], dt = TS[b] - TS[a];
          refLive.innerHTML = '<h3>This interval, worked out</h3><p class="bt-eq">rate = Δy / Δt = (' + F(VS[b], RUN.dp) + ' − ' + F(VS[a], RUN.dp) + ') / (' + TS[b] + ' − ' + TS[a] + ') = ' + F(dy, RUN.dp) + ' / ' + dt + ' = <b>' + F(dy / dt, RUN.d) + ' ' + esc(RU) + '</b></p>' + tableHtml([a, b]) +
            (measured.length > 1 ? '<h3>The intervals you measured</h3><ul class="rt2-meas">' + measured.slice().reverse().map(function(x){ return '<li>' + TS[x.a] + ' to ' + TS[x.b] + ' ' + esc(UT) + ': <b>' + F(x.r, RUN.d) + ' ' + esc(RU) + '</b></li>'; }).join('') + '</ul><p>A flatter triangle has a smaller rate.</p>' : '');
        } else if(R.tab === 'moment'){
          var t = DR.m;
          refLive.innerHTML = '<h3>This moment, worked out</h3><p>At ' + tStr(t) + ' ' + esc(UT) + ' the tangent rises about ' + F(R.slR, 1) + ' ' + esc(UY) + ' over a run of 1 ' + esc(UT) + ', so the rate there is about <b>' + F(R.slR, 1) + ' ' + esc(RU) + '</b>. Any run gives the same slope: over 2 ' + esc(UT) + ' it rises about ' + F(2 * R.slR, 1) + ' ' + esc(UY) + '.</p>' + tableHtml([]);
        } else {
          var m = R.m, pc = R.pc, wrong = Math.abs(R.chg) > 1e-9 ? R.chg / m * 100 : 0;
          refLive.innerHTML = '<h3>This core, worked out</h3><p class="bt-eq">percent change = (' + F(m, CORE.dp) + ' − ' + F(CORE.start, CORE.dp) + ') / ' + F(CORE.start, CORE.dp) + ' × 100 = <b>' + sgn(pc, 1) + '%</b></p>' +
            (Math.abs(R.chg) > 1e-9 ? '<p>Dividing by the end mass (' + F(m, CORE.dp) + ' ' + esc(CORE.unit) + ') instead would give ' + sgn(r1(wrong), 1) + '%, which is wrong: always divide by the start.</p>' : '<p>No change: 0%.</p>') +
            (pc < 0 ? '<p>A loss is negative: keep the sign.</p>' : '');
        }
      }

      /* ---------------------------------------------------- Test yourself, "Challenges" */
      var dock = document.createElement('div'); dock.className = 'rt2-dock';
      var chal = K.challenges({ store: 'apbio-rates-goals', items: EX.goals,
        done: { title: 'All four done.', text: 'A rate is a slope: change over time, with a unit made of two units. It fell as the substrate ran out. And a percent change is always taken of the start.' },
        onShow: function(){ if(St.mode === 'quiz' && St.part === 'goals') fresh(); }, onReset: function(){ fresh(); } });
      dock.appendChild(chal.el);
      function goal(id, ok, html){
        if(!ok || St.mode !== 'quiz' || St.part !== 'goals') return;
        var c = chal.current(); if(!c || c.id !== id || chal.isMet(id)) return;
        chal.met(id, html);
      }
      function fresh(){
        stopAll();
        MD.a = OPEN.a; MD.b = OPEN.b; MD.m = OPEN.m; MD.c = OPEN.c; DR.a = MD.a; DR.b = MD.b; DR.m = MD.m; DR.c = MD.c;
        hA.value(TS.indexOf(MD.a)); hB.value(TS.indexOf(MD.b)); hM.value(MD.m); hC.value(MD.c);
        cause.take(null);
        if(MD.tab !== OPEN.tab){ MD.tab = OPEN.tab; tabs.value(OPEN.tab); stage.setAttribute('data-tab', OPEN.tab); head.purpose(EX.purpose[OPEN.tab]); showHandles(); }
        lastWH = ''; layoutNow(true); settled();
      }
      function reset(){
        // Start over: this tab back to its opening, animated
        cause.take(null);
        if(MD.tab === 'avg'){ MD.a = OPEN.a; MD.b = OPEN.b; hA.value(TS.indexOf(MD.a)); hB.value(TS.indexOf(MD.b)); go('a', MD.a); go('b', MD.b); }
        else if(MD.tab === 'moment'){ MD.m = OPEN.m; hM.value(MD.m); go('m', MD.m); }
        else { MD.c = OPEN.c; hC.value(MD.c); go('c', MD.c); }
        if(St.mode === 'explore') measured = [];
      }
      bReset.addEventListener('click', function(){ hideCue(true); reset(); });

      /* ---------------------------------------------------- the two modes (the adapter calls this) */
      var saved = null;
      function shown(mode, part){
        var was = St.mode === 'explore' ? 'explore' : St.part === 'goals' ? 'goals' : 'other';
        St.mode = mode; St.part = part;
        var ex = mode === 'explore', goals = mode === 'quiz' && part === 'goals';
        stage.setAttribute('data-view', ex ? 'explore' : 'goals');
        head.el.hidden = !ex;
        if(!ex){ hideCue(false); if(tour.active()) tour.stop(); }
        if(was === 'explore' && !ex){ stopAll(); saved = { tab: MD.tab, a: MD.a, b: MD.b, m: MD.m, c: MD.c }; }
        if(!ex && !goals){ stopAll(); return; }
        if(ex && saved){
          stopAll(); MD.tab = saved.tab; MD.a = saved.a; MD.b = saved.b; MD.m = saved.m; MD.c = saved.c; saved = null;
          DR.a = MD.a; DR.b = MD.b; DR.m = MD.m; DR.c = MD.c;
          hA.value(TS.indexOf(MD.a)); hB.value(TS.indexOf(MD.b)); hM.value(MD.m); hC.value(MD.c);
          tabs.value(MD.tab); stage.setAttribute('data-tab', MD.tab); head.purpose(EX.purpose[MD.tab]); showHandles();
        }
        cause.take(null);
        if(goals && was !== 'goals'){ setTimeout(function(){ fresh(); }, 30); return; }
        setTimeout(function(){ layoutNow(true); settled(); if(ex && !tour.active() && MD.tab === 'avg') { if(cue.show()) cue.place(); } }, 30);
      }
      ctx.kit2 = { stage: stage, ref: ref, othersLabel: 'On the picture',
        parts: [{ value: 'practice', label: 'Problems', practice: true },
          { value: 'goals', label: 'Challenges', dock: dock, task: { kicker: 'Challenges', title: 'Change the picture to meet each challenge.', todo: 'Drag the knobs, switch tabs.' } }],
        onShow: function(m, p){ shown(m, p); } };
      // The practice problems (unchanged): the adapter puts them in Test yourself.
      T.skillTool(app, data, { slug: SLUG, kind: 'rates', stage: practiceStage });
      if(!ctx.studio){ app.insertBefore(stage, app.firstChild); app.insertBefore(ref, stage.nextSibling); shown('explore', null); }
      showHandles();
      // the whole stage stops when it is hidden (Test yourself, "?" on a phone, another page tab)
      if(window.IntersectionObserver) new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting && busy() && !hB.dragging() && !hM.dragging() && !hC.dragging()){ stopAll(); paint(); settled(); } }); }).observe(sceneBox);
      document.addEventListener('visibilitychange', function(){ if(document.hidden && busy()){ stopAll(); paint(); settled(); } });
      if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ mCache = {}; lastWH = ''; layoutNow(true); });
      if(window.ResizeObserver){ var tm = null; var ro = new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(function(){ if(!busy()) layoutNow(false); else { stopAll(); layoutNow(true); settled(); } }, 60); }); ro.observe(sceneBox); ro.observe(graphBox); }
      else window.addEventListener('resize', function(){ layoutNow(false); });
      // for the sweep (scripts/tools-v2/rates-sweep.mjs): the drawn state and the geometry
      window.__rt2 = { DR: DR, MD: MD, G: function(){ return G; }, GG: function(){ return GG; }, R: function(){ return lastR; }, busy: busy, f: f, fd: fd,
        set: function(o){ stopAll(); if(o.tab) setTab(o.tab, false); ['a', 'b', 'm', 'c'].forEach(function(k){ if(o[k] != null){ MD[k] = o[k]; DR[k] = o[k]; } }); hA.value(TS.indexOf(MD.a)); hB.value(TS.indexOf(MD.b)); hM.value(MD.m); hC.value(MD.c); cause.take(null); paint(); settled(); },
        go: function(k, v){ MD[k] = v; if(k === 'a') hA.value(TS.indexOf(v)); if(k === 'b') hB.value(TS.indexOf(v)); if(k === 'm') hM.value(v); if(k === 'c') hC.value(v); go(k, v); },
        tab: function(v){ setTab(v, true); }, bubbles: function(){ return bubs.filter(function(b){ return b.on; }).length; } };
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApBioBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var l2 = document.createElement('link'); l2.rel = 'stylesheet'; l2.href = (window.ApBioBase || '../') + 'assets/tools/rates.css'; document.head.appendChild(l2);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
