/* Interval capture, tools v2 (docs/tools-v2-stat-ci-capture-brief.md; the standard: docs/tools-v2-standard.md). The
   first AP® Statistics tool on the shared kit (assets/course/tool-kit2.js), through the course adapter
   ApStatTools.studioKit2. OWNED BY THIS TOOL ONLY. The model is ApStatMath.ciCapture
   (statistics/assets/tools/math/ci-capture.js), distributions come from ApStatDist (stat-dist.js), math text from
   ApStatTex. Styles: ci-capture.css.

   EXPLORE (free play, nothing graded, no side panel), one screen:
     The population is drawn: a crowd of people (a proportion: the ones who say yes in blue, the share exactly p), or
     people standing at their values along a floor scale (a mean: the crowd's shape is the population's). Build 100
     takes 100 random samples: each one is scooped from the crowd, flies down as its statistic (the orange dot) and
     grows into its interval (a ring with two end posts) on its own row, against the true value (the blue peg).
     A ring around the peg captures it (green); one beside it misses (vermillion, thicker, crossed).
     Main control: Build 100 intervals (under the picture); after the first run, the level knob on the picture
     (80 to 99%): the SAME samples rebuild their intervals, every ring stretches or shrinks from its centre and some
     flip. Quiet: the sample size knob under the crowd (new samples are drawn). Tap or arrow to a row to read its
     parts (statistic, critical value × standard error) in the cause line. A small plot keeps the capture rate of
     all intervals so far at each level tried, against the line rate = level.
     Every count, colour and the cause line is read from the rings AS DRAWN in that frame: a ring is counted once it
     has landed and grown to its ends, and its capture is its drawn ends against the drawn peg.
   TEST YOURSELF (unchanged): the step drill (four kinds: prop, mean, claim, capture) with its figure, records
   ci-capture:<context>:<step>; ?seed= and #quiz open it. */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath, P = window.ApStatPlot, X = window.ApStatTex;
  if(!T || !M || !M.ciCapture) return;
  var C = M.ciCapture, esc = T.esc, SLUG = 'ci-capture', NS = 'http://www.w3.org/2000/svg';
  function F(x, d){ return T.F(x, d == null ? 2 : d); }
  function th(s){ return X ? X.html(s) : s; }
  function big(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function pct(x, d){ return String(+(x * 100).toFixed(d == null ? 1 : d)) + '%'; }
  var LEVELS = [0.8, 0.9, 0.95, 0.99];
  var NP = [10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 400, 1000], NM = [3, 4, 5, 6, 8, 10, 15, 20, 30, 50, 100];
  var MAXN = 20000;

  /* ----------------------------------------------------------- helpers */
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function n1(v){ return Math.round(v * 10) / 10; }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function mk(tag, cls, attrs, parent){ var e = document.createElementNS(NS, tag); if(cls) e.setAttribute('class', cls); if(attrs) for(var k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.appendChild(e); return e; }
  function at(e, attrs){ for(var k in attrs){ var v = typeof attrs[k] === 'number' ? String(n1(attrs[k])) : attrs[k]; if(e.getAttribute(k) !== v) e.setAttribute(k, v); } }
  function txt(e, s){ if(e.textContent !== s) e.textContent = s; }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function easeOut(k){ return 1 - Math.pow(1 - k, 3); }
  function easeIO(k){ return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  var mctx = null, mCache = {}, FONT = 'Nunito, "Segoe UI", system-ui, sans-serif';
  function tw(s, px, wt){
    var k = (wt || 800) + '|' + px + '|' + s;
    if(mCache[k] != null) return mCache[k];
    if(!mctx){ var c = document.createElement('canvas'); mctx = c.getContext('2d'); }
    mctx.font = (wt || 800) + ' ' + px + 'px ' + FONT;
    return (mCache[k] = mctx.measureText(s).width);
  }
  function minus(s){ return String(s).replace(/^-/, '−'); }
  /* a seeded stream for the drawing only (the crowd's layout); samples come from the model */
  function srng(seed){ var s = seed >>> 0 || 1; return function(){ s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function Dist(){ return window.ApStatDist; }
  /* gamma(2) quantile: F(x) = 1 − e^(−x)(1 + x) */
  function gq(u){ var lo = 0, hi = 40; for(var i = 0; i < 60; i++){ var m = (lo + hi) / 2; if(1 - Math.exp(-m) * (1 + m) < u) lo = m; else hi = m; } return (lo + hi) / 2; }

  /* ========================================================= EXPLORE */
  function explore(host, data){
    var K = window.LevlKit2, E = data.explore || {}, POPS = [];
    (E.props || []).forEach(function(x){ POPS.push(Object.assign({ kind: 'prop' }, x)); });
    (E.means || []).forEach(function(x){ POPS.push(Object.assign({ kind: 'mean' }, x)); });
    var S = { pop: POPS[0], level: 0.95, nIdx: { prop: 5, mean: 6 }, useZ: false, pTrue: POPS[0].p, mode: 'explore',
      smps: [], ivRes: null, sel: -1, builds: 0, took: {}, lastWhy: null };
    var seed = 10000 + Math.floor(Math.random() * 89999), r = M.rng(seed);
    var id = 'ci3-' + Math.floor(Math.random() * 1e6);
    function calm(){ return K.reduced() || !window.requestAnimationFrame; }
    function kind(){ return S.pop.kind; }
    function ns(){ return kind() === 'prop' ? NP : NM; }
    function n(){ return ns()[S.nIdx[kind()]]; }
    function setup(){ return kind() === 'prop' ? { kind: 'prop', p: S.pTrue, n: n() } : { kind: 'mean', mu: S.pop.mu, sigma: S.pop.sigma, shape: S.pop.shape, n: n() }; }
    function trueVal(){ return kind() === 'prop' ? S.pTrue : S.pop.mu; }
    function parName(){ return kind() === 'prop' ? 'p' : 'μ'; }
    function statName(){ return kind() === 'prop' ? 'p̂' : 'x̄'; }
    function critOf(L){ return C.crit(setup(), L, { z: S.useZ }); }
    /* the level whose critical value is c (to read the drawn width back as a level) */
    function levelOfCrit(c){
      var D = Dist(), s = setup(), z = s.kind === 'prop' || S.useZ;
      return z ? 2 * D.normCdf(c) - 1 : 2 * D.tCdf(c, s.n - 1) - 1;
    }
    function vFmt(v){ return kind() === 'prop' ? F(v, 2) : (S.pop.money ? '$' : '') + F(v, 1); }
    function parText(){ return parName() + ' = ' + (kind() === 'prop' ? F(S.pTrue, 2) : (S.pop.money ? '$' : '') + F(S.pop.mu, 0)); }

    /* The long run capture rate of this method (%): exact for a proportion (a sum over the binomial), exact for a
       normal mean (t*: the level itself; z*: from the t distribution), simulated once for the skewed one (data). */
    var covCache = {};
    function longRun(L){
      var s = setup(), k = [s.kind, s.p, s.n, S.pop.id, S.useZ, L].join('|');
      if(k in covCache) return covCache[k];
      var D = Dist(), v;
      if(s.kind === 'prop'){
        var z = D.invNorm(1 - (1 - L) / 2), c = 0;
        for(var x = 0; x <= s.n; x++){ var ph = x / s.n, se = Math.sqrt(ph * (1 - ph) / s.n); if(Math.abs(ph - s.p) <= z * se) c += D.binomPmf(x, s.n, s.p); }
        v = c * 100;
      } else if(s.shape === 'skewed'){
        var tab = ((E.skewCover || {})[S.useZ ? 'z' : 't'] || {})[s.n];
        v = tab ? tab[clamp(Math.round(L * 100) - 80, 0, 19)] : NaN;
      } else v = S.useZ ? (2 * D.tCdf(D.invNorm(1 - (1 - L) / 2), s.n - 1) - 1) * 100 : L * 100;
      return (covCache[k] = v);
    }
    function lrWord(L){ var v = longRun(L), d = v - L * 100; return !isFinite(v) ? '' : d < -2 ? 'below' : d > 2 ? 'above' : 'about'; }
    function condWhy(){
      var s = setup();
      if(s.kind === 'prop'){ var a = s.n * s.p, b = s.n * (1 - s.p); if(a < 10 || b < 10) return 'counts'; return lrWord(S.level) === 'about' ? '' : 'wobble'; }
      if(S.useZ) return 'z';
      if(s.shape === 'skewed' && lrWord(S.level) !== 'about') return 'skew';
      return '';
    }

    /* ---------------------------------------------------- the stage */
    var stage = el('div', 'ci3');
    var head = K.head({ purpose: E.purpose || 'See how often intervals capture the true value', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    var pickWrap = el('label', 'ci3-pick'), pick = el('select', 'ci3-sel');
    pickWrap.innerHTML = '<span class="ci3-pick-k">Population</span>';
    pick.setAttribute('aria-label', 'Population');
    pick.innerHTML = '<optgroup label="A proportion">' + POPS.filter(function(x){ return x.kind === 'prop'; }).map(function(x){ return '<option value="' + esc(x.id) + '">' + esc(x.name) + '</option>'; }).join('') + '</optgroup>' +
      '<optgroup label="A mean">' + POPS.filter(function(x){ return x.kind === 'mean'; }).map(function(x){ return '<option value="' + esc(x.id) + '">' + esc(x.name) + '</option>'; }).join('') + '</optgroup>';
    pickWrap.appendChild(pick);
    head.el.insertBefore(pickWrap, head.how);
    stage.appendChild(head.el);
    var sceneBox = el('div', 'ci3-scene');
    sceneBox.innerHTML = '<svg class="ci3-svg" role="img" xmlns="' + NS + '" data-ls-text="keep"><defs></defs><g class="ci3-static"></g><g class="ci3-crowd"></g><g class="ci3-sel"></g><g class="ci3-rows"></g><g class="ci3-fly"></g><g class="ci3-front"></g><g class="ci3-labs"></g></svg>';
    stage.appendChild(sceneBox);
    var svg = sceneBox.querySelector('svg'), sDefs = svg.querySelector('defs'), sStatic = svg.querySelector('.ci3-static'), sCrowd = svg.querySelector('.ci3-crowd'),
      sSel = svg.querySelector('.ci3-sel'), sRows = svg.querySelector('.ci3-rows'), sFly = svg.querySelector('.ci3-fly'), sFront = svg.querySelector('.ci3-front'), sLabs = svg.querySelector('.ci3-labs');
    var layer = K.layer(sceneBox);
    // the rows can be tapped: a box over them (the nearest drawn row answers), a real focusable group for the keys
    var pickBox = el('div', 'ci3-rowpick');
    pickBox.tabIndex = 0; pickBox.setAttribute('role', 'group');
    pickBox.setAttribute('aria-label', 'The intervals. Up and down arrows pick one to read its parts; Escape clears.');
    layer.el.appendChild(pickBox);
    var lines = el('div', 'ci3-lines'), cause = K.cause({ label: 'Why' });
    var acts = el('div', 'ci3-acts');
    acts.innerHTML = '<button type="button" class="tk2-btn tk2-btn-pri ci3-build">Build 100 intervals</button><button type="button" class="tk2-link ci3-reset" hidden>Start over</button>';
    var bBuild = acts.querySelector('.ci3-build'), bReset = acts.querySelector('.ci3-reset');
    lines.appendChild(cause.el); lines.appendChild(acts);
    stage.appendChild(lines);
    var actLayer = K.layer(acts);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    var lastSaid = '';
    function say(t){ if(!t || t === lastSaid) return; lastSaid = t; live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    /* the reference behind "?" */
    var ref = el('div', 'ci3-ref');

    /* ---------------------------------------------------- geometry (picture units = CSS px of the scene) */
    var G = null;
    function layout(){
      var W = sceneBox.clientWidth, H = sceneBox.clientHeight;
      if(!W || !H) return null;
      var g = { W: W, H: H, wide: W >= 900, mid: W >= 600 && W < 900, phone: W < 600 };
      var pad = g.phone ? 8 : 14, gap = g.phone ? 8 : 14;
      g.pad = pad; g.fs = g.phone ? 12 : 13;
      if(g.wide){
        var lw = clamp(W * 0.31, 290, 460);
        g.pop = { x: pad, y: pad, w: lw, h: Math.round((H - 2 * pad - gap) * 0.62) };
        g.rate = { x: pad, y: g.pop.y + g.pop.h + gap, w: lw, h: H - pad - (g.pop.y + g.pop.h + gap) };
        g.st = { x: pad + lw + gap + 4, y: pad, w: W - pad - (pad + lw + gap + 4), h: H - 2 * pad };
      } else if(g.mid){
        var th = clamp(H * 0.3, 170, 230), pw = Math.round((W - 2 * pad - gap) * 0.64);
        g.pop = { x: pad, y: pad, w: pw, h: th };
        g.rate = { x: pad + pw + gap, y: pad, w: W - pad - (pad + pw + gap), h: th };
        g.st = { x: pad, y: pad + th + gap, w: W - 2 * pad, h: H - (pad + th + gap) - pad };
      } else {
        // phones: the crowd and the rate plot side by side on top, the rings below
        var ph = clamp(H * 0.29, 150, 184), pw2 = Math.round((W - 2 * pad - gap) * 0.6);
        g.pop = { x: pad, y: pad, w: pw2, h: ph };
        g.rate = { x: pad + pw2 + gap, y: pad, w: W - pad - (pad + pw2 + gap), h: ph };
        g.st = { x: pad, y: pad + ph + gap, w: W - 2 * pad, h: H - (pad + ph + gap) - pad };
      }
      // the stack: a header (counts, the level knob), the rows, the axis
      var s = g.st;
      // the header is one band: the counts at the left, the level's value and its knob at the right
      s.head = g.phone ? 56 : 62; s.axisH = 46;
      s.l = s.x + (g.phone ? 12 : 22); s.r = s.x + s.w - (g.phone ? 12 : 22);
      s.top = s.y + s.head; s.bot = s.y + s.h - s.axisH;
      s.rowH = (s.bot - s.top) / 100;
      s.knobY = s.y + s.head / 2 + 1;
      s.cntW = tw('100 of 100 capture μ', g.phone ? 13 : 14, 900);
      s.lvW = tw(g.phone ? '99%' : 'Level 99%', g.phone ? 14 : 15, 900);
      var tL = Math.max(s.l - (g.phone ? 4 : 8) + s.cntW + 18 + s.lvW + 26, s.x + s.w * 0.5), tR = s.r - 22;
      s.track = [tL, s.knobY, tR, s.knobY];
      // the population panel: a title row, the crowd, the sample size knob along the ground
      var p = g.pop;
      p.title = p.y + 20; p.cTop = p.y + (kind() === 'mean' ? 40 : 32); p.knobY = p.y + p.h - 22; p.cBot = p.knobY - (kind() === 'mean' ? 44 : 26);
      // the ground line: a proportion's crowd stands below the building, a mean's on its floor scale
      p.gy = kind() === 'prop' ? p.cTop + (g.phone ? 14 : clamp((p.cBot - p.cTop) * 0.22, 22, 52)) : p.cTop + (p.cBot - p.cTop) * 0.3;
      p.nW = tw(g.phone ? 'n = 1000' : 'Sample size n = 1000', 12.5, 800);
      p.track = [Math.max(p.x + 12 + p.nW + 26, p.x + p.w * 0.45), p.knobY, p.x + p.w - (g.phone ? 20 : 32), p.knobY];
      // the rate plot
      var q = g.rate;
      q.two = g.phone || tw('Captured, at each level', 13, 900) + tw('100.0% of 20,000', 13, 900) + 34 > q.w;
      q.l = q.x + (g.phone ? 36 : 40); q.r = q.x + q.w - (g.phone ? 10 : 14); q.t = q.y + (q.two ? 56 : 42); q.b = q.y + q.h - 24;
      return g;
    }
    function dom(){ var v = trueVal(), s = setup(), w;
      if(s.kind === 'prop'){ var se = Math.sqrt(s.p * (1 - s.p) / s.n); w = Math.max(0.02, 2.576 * se * 1.55); }
      else { var se2 = s.sigma / Math.sqrt(s.n), tc = Math.min(9.92, Dist().invT(0.995, Math.max(1, s.n - 1))); w = Math.max(3.6 * se2, tc * se2 * (s.n < 6 ? 1.0 : 1.3)); }
      return [v - w, v + w];
    }
    var D0 = null;
    function xs(v){ var s = G.st; return s.l + (v - D0[0]) / (D0[1] - D0[0]) * (s.r - s.l); }
    function rowY(i){ return G.st.top + (i + 0.5) * G.st.rowH; }

    /* ---------------------------------------------------- the population (drawn once per layout and setting) */
    var crowd = [];   // { x, y, s, yes, el }
    function crowdModel(){
      var pr = srng(91 + POPS.indexOf(S.pop) * 7), out = [], small = !!(G && G.phone);
      CMsmall = small;
      if(kind() === 'prop'){
        var N = small ? 100 : 250, yes = Math.round(N * S.pTrue), flags = [];
        for(var i = 0; i < N; i++) flags.push(i < yes);
        for(var j = N - 1; j > 0; j--){ var k = Math.floor(pr() * (j + 1)), t = flags[j]; flags[j] = flags[k]; flags[k] = t; }
        flags.forEach(function(f, i){ out.push({ yes: f, sk: Math.floor(pr() * 5), hair: Math.floor(pr() * 4), jx: pr() - 0.5, jy: pr() - 0.5 }); });
      } else {
        var N2 = small ? 100 : 200, sk = S.pop.shape === 'skewed', th = S.pop.sigma / Math.SQRT2, sh = S.pop.mu - 2 * th;
        for(var q = 0; q < N2; q++){ var u = (q + 0.5) / N2, v = sk ? sh + th * gq(u) : S.pop.mu + S.pop.sigma * Dist().invNorm(u); out.push({ v: v, sk: Math.floor(pr() * 5), hair: Math.floor(pr() * 4), jx: pr() - 0.5, jy: pr() - 0.5 }); }
      }
      return out;
    }
    var CM = null, CMsmall = null;
    function popDom(){ if(kind() !== 'mean') return null; return S.pop.shape === 'skewed' ? [0, S.pop.mu + 4.2 * S.pop.sigma] : [S.pop.mu - 3.4 * S.pop.sigma, S.pop.mu + 3.4 * S.pop.sigma]; }
    function px(v){ var p = G.pop, d = popDom(); return p.x + 16 + (v - d[0]) / (d[1] - d[0]) * (p.w - 32); }
    function drawCrowd(){
      var p = G.pop, o = '';
      crowd = [];
      if(kind() === 'prop'){
        var top = p.gy + 4, N = CM.length, ar = (p.w - 16) / (p.cBot - top), rows = clamp(Math.round(Math.sqrt(N / (ar * 1.7))), 3, 14), cols = Math.ceil(N / rows);
        var cw = (p.w - 20) / cols, rh = (p.cBot - top) / rows;
        CM.forEach(function(m, i){
          var rr = Math.floor(i / cols), cc = i % cols, depth = 0.78 + 0.22 * (rr / Math.max(1, rows - 1));
          var x = p.x + 8 + (cc + 0.5 + m.jx * 0.5) * cw + (rr % 2 ? cw * 0.25 : 0), y = top + (rr + 1) * rh + m.jy * rh * 0.2;
          crowd.push({ x: x, y: y, s: Math.min(cw * 2.1, rh * 1.3, (y - p.gy + 2) / 1.05) * depth / 20, yes: m.yes, sk: m.sk, hair: m.hair });
        });
      } else {
        var d = popDom(), cwPx = 0, cells = {}, k0;
        // people stand in columns at their values; a column's width is one person, so the crowd's outline is the shape
        var maxStack = 1, colW = clamp((p.w - 32) / 28, 8, 15);
        var cMax0 = Math.floor((p.w - 20) / colW);
        CM.forEach(function(m){ var c = clamp(Math.floor((px(m.v) - p.x) / colW), 1, cMax0); cells[c] = (cells[c] || 0) + 1; if(cells[c] > maxStack) maxStack = cells[c]; });
        var hgt = p.cBot - p.cTop - 4, fh = Math.min(colW * 1.9, hgt * 0.3), step = Math.min(colW * 1.25, (hgt - fh) / Math.max(1, maxStack - 1)), filled = {}, cMax = Math.floor((p.w - 20) / colW);
        CM.forEach(function(m){
          var c = clamp(Math.floor((px(m.v) - p.x) / colW), 1, cMax), k = filled[c] = (filled[c] || 0) + 1;
          crowd.push({ x: p.x + (c + 0.5) * colW, y: p.cBot - (k - 1) * step, s: fh / 20, yes: false, v: m.v, sk: m.sk, hair: m.hair, col: c, k: k });
        });
        cwPx = colW; k0 = cwPx;
      }
      // draw back to front (higher on the picture first)
      var order = crowd.map(function(c, i){ return i; }).sort(function(a, b){ return crowd[a].y - crowd[b].y; });
      order.forEach(function(i){
        var c = crowd[i];
        o += '<use href="#' + id + '-person" class="ci3-p sk' + c.sk + ' hr' + c.hair + (c.yes ? ' is-yes' : '') + '" transform="translate(' + n1(c.x) + ' ' + n1(c.y) + ') scale(' + (Math.round(c.s * 1000) / 1000) + ')" data-i="' + i + '"/>';
      });
      sCrowd.innerHTML = o;
      var us = sCrowd.querySelectorAll('use');
      for(var j = 0; j < us.length; j++) crowd[+us[j].getAttribute('data-i')].el = us[j];
    }

    /* ---------------------------------------------------- the still parts */
    var Lb = {};
    function drawStatic(){
      var g = G, p = g.pop, s = g.st, q = g.rate, o = '', d = '';
      d += '<linearGradient id="' + id + '-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ci3s-sky0"/><stop offset="1" class="ci3s-sky1"/></linearGradient>' +
        '<linearGradient id="' + id + '-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ci3s-gr0"/><stop offset="1" class="ci3s-gr1"/></linearGradient>' +
        '<linearGradient id="' + id + '-board" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ci3s-bd0"/><stop offset="1" class="ci3s-bd1"/></linearGradient>' +
        '<linearGradient id="' + id + '-peg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="ci3s-peg0"/><stop offset=".5" class="ci3s-peg1"/><stop offset="1" class="ci3s-peg0"/></linearGradient>' +
        // one person, 20 units tall, feet at (0, 0): legs, a shirt (currentColor), arms, a head with hair
        '<symbol id="' + id + '-person" overflow="visible"><path class="ci3-legs" d="M-2.6 0V-6.5M2.6 0V-6.5"/><path class="ci3-shirt" d="M-4.6 -6C-4.8 -10.5 -4.2 -12.6 0 -12.6S4.8 -10.5 4.6 -6Z"/>' +
        '<circle class="ci3-head" cy="-16" r="3.6"/><path class="ci3-hair" d="M-3.7 -16.4C-3.7 -20.4 3.7 -20.4 3.7 -16.4C2.2 -17.8 -1.8 -18.4 -3.7 -16.4Z"/></symbol>';
      sDefs.innerHTML = d;
      // the population panel: sky, a far row of trees and a building, the ground
      var gy = p.gy;
      o += '<rect class="ci3-panel" x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="14"/>';
      o += '<clipPath id="' + id + '-pc"><rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="14"/></clipPath>';
      o += '<g clip-path="url(#' + id + '-pc)"><rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + n1(gy - p.y) + '" fill="url(#' + id + '-sky)"/>';
      if(kind() === 'prop'){
        // a school (or town hall) across the back
        var bx = p.x + p.w * 0.3, bw = p.w * 0.66, bh = Math.min(46, (gy - p.title - 6) * 0.9), by = gy - bh;
        o += '<rect class="ci3-bld" x="' + n1(bx) + '" y="' + n1(by) + '" width="' + n1(bw) + '" height="' + n1(bh) + '" rx="2"/><rect class="ci3-roof" x="' + n1(bx - 4) + '" y="' + n1(by - 4) + '" width="' + n1(bw + 8) + '" height="5" rx="2"/>';
        var nw = Math.max(3, Math.floor(bw / 26));
        for(var i = 0; i < nw; i++){ var wx = bx + (i + 0.5) * bw / nw - 5; o += '<rect class="ci3-win" x="' + n1(wx) + '" y="' + n1(by + bh * 0.25) + '" width="10" height="' + n1(Math.max(5, bh * 0.28)) + '" rx="1.5"/>'; }
        o += '<rect class="ci3-door" x="' + n1(bx + bw / 2 - 7) + '" y="' + n1(gy - Math.max(10, bh * 0.45)) + '" width="14" height="' + n1(Math.max(10, bh * 0.45)) + '" rx="2"/>';
      } else {
        for(var t = 0; t < 7; t++){ var tx = p.x + (t + 0.3) * p.w / 7, tr = 9 + (t % 3) * 3; o += '<path class="ci3-tree" d="M' + n1(tx) + ' ' + n1(gy) + 'v-' + (tr + 4) + '"/><circle class="ci3-leaf" cx="' + n1(tx) + '" cy="' + n1(gy - tr - 6) + '" r="' + tr + '"/>'; }
      }
      o += '<rect x="' + p.x + '" y="' + n1(gy) + '" width="' + p.w + '" height="' + n1(p.y + p.h - gy) + '" fill="url(#' + id + '-grass)"/>';
      if(kind() === 'mean'){
        // the floor scale the people stand on: their values
        var dd = popDom(), stepV = S.pop.shape === 'skewed' ? 20 : 10, fy = p.cBot + 2;
        o += '<rect class="ci3-floor" x="' + (p.x + 8) + '" y="' + n1(fy) + '" width="' + (p.w - 16) + '" height="7" rx="3"/>';
        for(var v = Math.ceil(dd[0] / stepV) * stepV; v <= dd[1]; v += stepV){ var xx = px(v); if(xx < p.x + 12 || xx > p.x + p.w - 12) continue; o += '<line class="ci3-ftick" x1="' + n1(xx) + '" x2="' + n1(xx) + '" y1="' + n1(fy) + '" y2="' + n1(fy + 7) + '"/>'; }
        F0.floor = { y: fy, step: stepV };
      }
      o += '</g>';
      // the stack's board
      o += '<rect class="ci3-board" x="' + s.x + '" y="' + s.y + '" width="' + s.w + '" height="' + s.h + '" rx="14" fill="url(#' + id + '-board)"/>';
      for(var gl = 0; gl <= 10; gl++){ var yy = s.top + gl * 10 * s.rowH; o += '<line class="ci3-rule" x1="' + n1(s.l - 6) + '" x2="' + n1(s.r + 6) + '" y1="' + n1(yy) + '" y2="' + n1(yy) + '"/>'; }
      // the axis
      var ay = s.bot + 6;
      o += '<line class="ci3-axis" x1="' + n1(s.l) + '" x2="' + n1(s.r) + '" y1="' + n1(ay) + '" y2="' + n1(ay) + '"/>';
      // the rate plot's card
      o += '<rect class="ci3-panel ci3-ratecard" x="' + q.x + '" y="' + q.y + '" width="' + q.w + '" height="' + q.h + '" rx="14"/>';
      sStatic.innerHTML = o;
      drawFront();
    }
    /* ticks, the peg, the rate plot's axes and the labels (they change with the setting, n and the level) */
    var F0 = {};
    function drawFront(){
      var g = G, s = g.st, q = g.rate, p = g.pop, o = '', v = trueVal(), pegX = xs(v), ay = s.bot + 6;
      // axis ticks: never within reach of the peg's label
      var pegLab = parText(), pegW = tw(pegLab, g.fs, 900) + 16, axW = tw(kind() === 'prop' ? 'sample proportion p̂' : 'sample mean x̄', 11.5, 800);
      var ticks = P ? P.ticks(D0[0], D0[1], Math.max(3, Math.min(9, Math.round((s.r - s.l) / 80)))) : [D0[0], D0[1]];
      ticks.forEach(function(t){
        var xx = xs(t); if(xx < s.l - 1 || xx > s.r + 1) return;
        if(kind() === 'prop' && (t < -1e-9 || t > 1 + 1e-9)) return;
        o += '<line class="ci3-tick" x1="' + n1(xx) + '" x2="' + n1(xx) + '" y1="' + n1(ay) + '" y2="' + n1(ay + 5) + '"/>';
        var lab = minus(String(+t.toPrecision(6))), lw = tw(lab, 11.5, 700);
        if(Math.abs(xx - pegX) < pegW / 2 + lw / 2 + 6) return;
        if(xx - lw / 2 < s.x + 4 || xx + lw / 2 > s.x + s.w - 4) return;
        if(xx + lw / 2 > s.r - axW - 6) return;
        o += '<text class="ci3-tk" x="' + n1(xx) + '" y="' + n1(ay + 18) + '" text-anchor="middle">' + lab + '</text>';
      });
      // a proportion below 0 cannot happen: the axis shows where 0 is
      // the peg: a pole from the header to the axis, its label on the axis
      o += '<rect class="ci3-pegsh" x="' + n1(pegX - 1) + '" y="' + n1(s.top - 6) + '" width="5" height="' + n1(ay - s.top + 6) + '" rx="2"/>';
      o += '<rect class="ci3-peg" x="' + n1(pegX - 2.5) + '" y="' + n1(s.top - 8) + '" width="5" height="' + n1(ay - s.top + 8) + '" rx="2.5" fill="url(#' + id + '-peg)"/>';
      o += '<circle class="ci3-pegcap" cx="' + n1(pegX) + '" cy="' + n1(s.top - 8) + '" r="4.5"/>';
      sFront.innerHTML = o;
      // the labels layer: built once per layout; texts set by paint()
      sLabs.innerHTML = '';
      Lb = {};
      Lb.peg = pill('ci3-pill is-pop', 'peg');
      Lb.peg.set(pegLab, clamp(pegX, s.x + pegW / 2 + 4, s.x + s.w - pegW / 2 - 4), ay + 17, 'middle');
      Lb.axName = mk('text', 'ci3-axn', { 'data-lab': 'axn', x: n1(s.r), y: n1(ay + 37), 'text-anchor': 'end' }, sLabs);
      txt(Lb.axName, kind() === 'prop' ? 'sample proportion p̂' : 'sample mean x̄');
      Lb.hit = mk('text', 'ci3-cnt is-hit', { 'data-lab': 'cnt', x: n1(s.l - (g.phone ? 4 : 8)), y: n1(s.y + 24) }, sLabs);
      Lb.miss = mk('text', 'ci3-cnt is-miss', { 'data-lab': 'cnt2', x: n1(s.l - (g.phone ? 4 : 8)), y: n1(s.y + 44) }, sLabs);
      Lb.lv = mk('text', 'ci3-lv', { 'data-lab': 'lv', x: n1(s.track[0] - 26), y: n1(s.knobY + 5), 'text-anchor': 'end' }, sLabs);
      Lb.hit.setAttribute('y', n1(s.y + (g.phone ? 19 : 22))); Lb.miss.setAttribute('y', n1(s.y + (g.phone ? 42 : 47)));
      // the population's title and its true value
      Lb.pt = mk('text', 'ci3-ptitle', { 'data-lab': 'ptitle', x: n1(p.x + 12), y: n1(p.title) }, sLabs);
      var ptv = kind() === 'prop' ? pct(S.pTrue, 0) + ' ' + (S.pop.yes || 'yes') : 'mean ' + (S.pop.money ? '$' : '') + F(S.pop.mu, 0) + (S.pop.money || g.phone ? '' : ' ' + (S.pop.unit || ''));
      var ptk = S.pop.crowd || S.pop.name;
      // the title fits its panel: a shorter name when it would not
      if(tw(ptk + ': ' + ptv, 13.5, 900) > p.w - 24) ptk = ptk.replace(/^All /, '');
      if(tw(ptk + ': ' + ptv, 13.5, 900) > p.w - 24 && kind() === 'prop'){ ptv = pct(S.pTrue, 0) + ' ' + (S.pop.yes || 'yes').split(' ')[0]; }
      Lb.pt.innerHTML = esc(ptk) + ': <tspan class="ci3-pv">' + esc(ptv) + '</tspan>';
      if(kind() === 'mean'){
        // μ on the floor scale
        var mx = px(S.pop.mu);
        var fy2 = p.cBot + 2, dd2 = popDom(), stp = S.pop.shape === 'skewed' ? 20 : 10, fl = '';
        Lb.mu = mk('path', 'ci3-mu', { d: 'M' + n1(mx) + ' ' + n1(fy2 + 9) + 'l-5.5 8h11z' }, sLabs);
        var muLab = 'μ', muW = tw(muLab, 13, 900);
        Lb.mut = mk('text', 'ci3-mut', { 'data-lab': 'mut', x: n1(mx + 8), y: n1(fy2 + 22) }, sLabs);
        txt(Lb.mut, muLab);
        for(var fv = Math.ceil(dd2[0] / stp) * stp; fv <= dd2[1]; fv += stp){ var fx = px(fv), lab = (S.pop.money ? '$' : '') + fv, lw2 = tw(lab, 11.5, 700); if(fx - lw2 / 2 < p.x + 4 || fx + lw2 / 2 > p.x + p.w - 4 || (fx + lw2 / 2 > mx - 9 && fx - lw2 / 2 < mx + 8 + muW + 6)) continue; fl += '<text class="ci3-tk" data-lab="ftk" x="' + n1(fx) + '" y="' + n1(fy2 + 22) + '" text-anchor="middle">' + lab + '</text>'; }
        var fg = mk('g', null, null, sLabs); fg.innerHTML = fl;
      }
      // the sample size rail: one notch for each n the knob can take
      var tk = p.track, nn = ns().length, rail = '<line class="ci3-nrail" x1="' + n1(tk[0]) + '" x2="' + n1(tk[2]) + '" y1="' + n1(tk[1]) + '" y2="' + n1(tk[1]) + '"/>';
      for(var ni = 0; ni < nn; ni++){ var nx = tk[0] + (tk[2] - tk[0]) * ni / (nn - 1); rail += '<line class="ci3-nnotch" x1="' + n1(nx) + '" x2="' + n1(nx) + '" y1="' + n1(tk[1] - 4) + '" y2="' + n1(tk[1] + 4) + '"/>'; }
      var rg0 = mk('g', 'ci3-nr', null, sLabs); rg0.innerHTML = rail;
      Lb.nl = mk('text', 'ci3-nk', { 'data-lab': 'nk', x: n1(p.x + 12), y: n1(p.knobY + 4.5) }, sLabs);
      Lb.nl.innerHTML = (g.phone ? '' : 'Sample size ') + '<tspan class="ci3-nv">n = ' + n() + '</tspan>';
      // the rate plot's axes
      var ro = '';
      ro += '<text class="ci3-rtitle" data-lab="rt" x="' + n1(q.x + (g.phone ? 10 : 12)) + '" y="' + n1(q.y + 19) + '">' + (g.phone ? 'Captured' : 'Captured, at each level') + '</text>';
      (g.phone ? [50, 100] : [50, 75, 100]).forEach(function(t){ var yy = rY(t); ro += '<line class="ci3-rgrid" x1="' + n1(q.l) + '" x2="' + n1(q.r) + '" y1="' + n1(yy) + '" y2="' + n1(yy) + '"/><text class="ci3-tk" data-lab="rtk" x="' + n1(q.l - 5) + '" y="' + n1(yy + 4) + '" text-anchor="end">' + t + '%</text>'; });
      [80, 90, 99].forEach(function(t){ var xx = rX(t); ro += '<line class="ci3-tick" x1="' + n1(xx) + '" x2="' + n1(xx) + '" y1="' + n1(q.b) + '" y2="' + n1(q.b + 4) + '"/><text class="ci3-tk" data-lab="rtk" x="' + n1(xx) + '" y="' + n1(q.b + 16) + '" text-anchor="middle">' + t + '%</text>'; });
      ro += '<line class="ci3-raxis" x1="' + n1(q.l) + '" x2="' + n1(q.r) + '" y1="' + n1(q.b) + '" y2="' + n1(q.b) + '"/>';
      ro += '<line class="ci3-diag" x1="' + n1(rX(80)) + '" y1="' + n1(rY(80)) + '" x2="' + n1(rX(99)) + '" y2="' + n1(rY(99)) + '"/>';
      var rg = mk('g', 'ci3-rstat', null, sLabs); rg.innerHTML = ro;
      Lb.diag = mk('text', 'ci3-diagt', { 'data-lab': 'diag', 'text-anchor': 'end' }, sLabs);
      txt(Lb.diag, 'rate = level');
      Lb.rdots = mk('g', 'ci3-rdots', null, sLabs);
      Lb.rdot = mk('circle', 'ci3-rdot', { r: 6 }, sLabs);
      Lb.rall = G.rate.two ? mk('text', 'ci3-rall', { 'data-lab': 'rall', x: n1(q.x + 10), y: n1(q.y + 40) }, sLabs) : mk('text', 'ci3-rall', { 'data-lab': 'rall', x: n1(q.r), y: n1(q.y + 19), 'text-anchor': 'end' }, sLabs);
    }
    /* the line's name sits just under the line, where it is farthest from every dot */
    function placeDiag(dots){
      var w = tw('rate = level', 11.5, 800), q = G.rate, best = null, bd = -Infinity, cands = [];
      // under the line: starting at a level and running right (the line climbs away), or ending at one (dropped by
      // the line's height at the text's left end)
      for(var L = 80; L <= 92; L += 2) cands.push([rX(L) + 2, rY(L) + 16]);
      [99, 96].forEach(function(L){ var x0 = rX(L) - w - 2, Lx = 80 + (x0 - rX(80)) / (rX(99) - rX(80)) * 19; cands.push([x0, rY(Math.max(80, Lx)) + 16]); });
      cands.forEach(function(c){
        var x0 = c[0], ay = c[1], d = Infinity;
        if(x0 < q.x + 6 || x0 + w > q.x + q.w - 6 || ay > q.b - 4) return;
        dots.forEach(function(p){ var dx = Math.max(x0 - 8 - p[0], 0, p[0] - (x0 + w + 8)), dy = Math.max(ay - 12 - 8 - p[1], 0, p[1] - (ay + 4 + 8)); d = Math.min(d, Math.hypot(dx, dy) + (dx === 0 && dy === 0 ? -100 : 0)); });
        if(d > bd + 0.5){ bd = d; best = [x0, ay]; }
      });
      if(!best) best = [rX(80) + 2, rY(80) + 16];
      at(Lb.diag, { x: best[0], y: best[1], 'text-anchor': 'start' });
    }
    function rX(l){ var q = G.rate; return q.l + 16 + (l - 80) / 19 * (q.r - q.l - 22); }
    function rY(c){ var q = G.rate; return q.b - (clamp(c, 50, 100) - 50) / 50 * (q.b - q.t); }
    function pill(cls, lab){
      var gg = mk('g', cls, { 'data-lab': lab }, sLabs), rr = mk('rect', null, { rx: 9 }, gg), t = mk('text', null, { 'text-anchor': 'middle' }, gg);
      var o = { g: gg, s: null, box: null,
        set: function(s, x, y, anchor){
          var fs = G.fs, w = tw(s, fs, 900) + 14, h = fs + 9, x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
          gg.style.display = '';
          if(o.s !== s){ o.s = s; t.textContent = s; t.style.fontSize = fs + 'px'; }
          at(rr, { x: x0, y: y - h / 2, width: w, height: h }); at(t, { x: x0 + w / 2, y: y + fs * 0.36 });
          o.box = [x0, y - h / 2, x0 + w, y + h / 2];
        },
        hide: function(){ gg.style.display = 'none'; o.box = null; } };
      return o;
    }

    /* ---------------------------------------------------- the rows: one group each (the ring with its posts, the dot, the cross) */
    var R = [];   // shown rows: { k (sample index), est, se, el, ring, dot, x, st: 'wait'|'fly'|'grow'|'done'|'leave', t0, f (grow 0..1), drawn: { lo, hi, hit } }
    var leaving = [];
    function rowEl(){
      var e = mk('g', 'ci3-row', null, sRows);
      return { el: e, ring: mk('path', 'ci3-ring', null, e), cross: mk('path', 'ci3-x', null, e), dot: mk('circle', 'ci3-dot', null, e) };
    }
    var dCrit = null, crit0 = null, crit1 = null, cT0 = 0, cDur = 0;   // the drawn critical value and its tween
    function curCrit(t){ if(cDur <= 0 || t >= cT0 + cDur) return crit1; return crit0 + (crit1 - crit0) * easeIO(clamp((t - cT0) / cDur, 0, 1)); }
    /* one row as drawn now: its ring's ends in px (rounded as drawn), and whether those ends hold the peg */
    function paintRow(r, i, t){
      var s = G.st, y = rowY(i), pegX = n1(xs(trueVal())), me = dCrit * r.se;
      var f = r.st === 'grow' ? r.f : r.st === 'done' || r.st === 'leave' ? 1 : 0;
      var x0 = n1(xs(r.est - me * f)), x1 = n1(xs(r.est + me * f)), xc = n1(xs(r.est));
      var a = Math.max(s.l - 8, x0), b = Math.min(s.r + 8, x1), cut0 = x0 < s.l - 8, cut1 = x1 > s.r + 8;
      var counted = r.st === 'done';
      var hit = x0 <= pegX && pegX <= x1;
      var tone = counted ? (hit ? 'is-hit' : 'is-miss') : 'is-grow';
      var sw = clamp(s.rowH * 0.62, 1.4, 4.2), post = clamp(s.rowH * 0.9, 2.2, 7) + (counted && !hit ? 0.6 : 0);
      if(r._tone !== tone){ if(r._tone === 'is-hit' && tone === 'is-miss' || r._tone === 'is-miss' && tone === 'is-hit'){ r.flip = t; } r._tone = tone; r.el.setAttribute('class', 'ci3-row ' + tone + (i === S.sel ? ' is-sel' : '')); }
      if(r._sel !== (i === S.sel)){ r._sel = i === S.sel; r.el.setAttribute('class', 'ci3-row ' + tone + (r._sel ? ' is-sel' : '')); }
      var d = '';
      if(r.st === 'fly' || r.st === 'wait'){ d = ''; }
      else {
        d = 'M' + a + ' ' + n1(y) + 'H' + b;
        if(!cut0) d += 'M' + x0 + ' ' + n1(y - post) + 'V' + n1(y + post);
        else d += 'M' + n1(a + 4) + ' ' + n1(y - post) + 'L' + a + ' ' + n1(y) + 'L' + n1(a + 4) + ' ' + n1(y + post);
        if(!cut1) d += 'M' + x1 + ' ' + n1(y - post) + 'V' + n1(y + post);
        else d += 'M' + n1(b - 4) + ' ' + n1(y - post) + 'L' + b + ' ' + n1(y) + 'L' + n1(b - 4) + ' ' + n1(y + post);
      }
      if(r._d !== d){ r._d = d; r.ring.setAttribute('d', d); }
      var swS = String(n1(counted && !hit ? sw * 1.35 : sw));
      if(r._sw !== swS){ r._sw = swS; r.ring.style.strokeWidth = swS; }
      // the cross: beside the end nearer the peg, on the peg's side
      var cx = '';
      if(counted && !hit){ var cs = clamp(s.rowH * 0.9, 2.4, 4.6), xx = x1 < pegX ? b + cs + 4 : a - cs - 4; if(xx > s.x + 2 && xx < s.x + s.w - 2) cx = 'M' + n1(xx - cs) + ' ' + n1(y - cs) + 'l' + n1(2 * cs) + ' ' + n1(2 * cs) + 'm0 ' + n1(-2 * cs) + 'l' + n1(-2 * cs) + ' ' + n1(2 * cs); }
      if(r._cx !== cx){ r._cx = cx; r.cross.setAttribute('d', cx); }
      if(r.st !== 'fly' && r.st !== 'wait'){ var rd = clamp(s.rowH * 0.55, 1.5, 3.6) + (i === S.sel ? 1.5 : 0); at(r.dot, { cx: xc, cy: y, r: rd }); if(r._dv !== 1){ r._dv = 1; r.dot.style.display = ''; } }
      else if(r._dv !== 0){ r._dv = 0; r.dot.style.display = 'none'; }
      var op = r.st === 'leave' ? String(n1(Math.max(0, 1 - r.lf))) : '1';
      if(r._op !== op){ r._op = op; r.el.style.opacity = op === '1' ? '' : op; }
      if(r.st === 'leave'){ var tr = 'translate(0 ' + n1(r.lf * 12) + ')'; if(r._tr !== tr){ r._tr = tr; r.el.setAttribute('transform', tr); } }
      r.drawn = { lo: x0, hi: x1, hit: hit, counted: counted, x: xc, y: y };
      return r.drawn;
    }

    /* ---------------------------------------------------- the flying samples: a scoop in the crowd, a bundle down to its row */
    var fly = [];   // { r (row), i, t0, dur, from: [x, y], to: [x, y], scoop }
    var flyPool = [];
    function flyEl(){ var e = flyPool.pop(); if(e){ e.style.display = ''; return e; } e = mk('g', 'ci3-bundle', null, sFly); mk('circle', 'ci3-bh', { r: 7 }, e); mk('circle', 'ci3-bd', { r: 3.6 }, e); return e; }
    function flyFree(e){ e.style.display = 'none'; flyPool.push(e); }
    var scoopEl = null, scooped = [];
    function scoopAt(cx, cy, rx, ry){
      if(!scoopEl) scoopEl = mk('ellipse', 'ci3-scoop', null, sSel);
      at(scoopEl, { cx: cx, cy: cy, rx: rx, ry: ry }); scoopEl.style.display = '';
      scooped.forEach(function(c){ c.el.classList.remove('is-scoop'); });
      scooped = crowd.filter(function(c){ var dx = (c.x - cx) / rx, dy = (c.y - 8 * c.s * 1.2 - cy) / ry; return dx * dx + dy * dy <= 1; });
      scooped.forEach(function(c){ c.el.classList.add('is-scoop'); });
    }
    function scoopOff(){ if(scoopEl) scoopEl.style.display = 'none'; scooped.forEach(function(c){ c.el.classList.remove('is-scoop'); }); scooped = []; }
    function crowdSpot(i){
      var pr = srng(seed + i * 31 + S.smps.length), p = G.pop;
      var c = crowd[Math.floor(pr() * crowd.length)] || { x: p.x + p.w / 2, y: (p.cTop + p.cBot) / 2, s: 1 };
      return [c.x, c.y - 10 * c.s];
    }

    /* ---------------------------------------------------- the loop */
    var raf = 0, lastT = 0;
    function busy(){ return fly.length || leaving.length || R.some(function(r){ return r.st !== 'done'; }) || (cDur > 0 && now() < cT0 + cDur) || flips(); }
    function flips(){ var t = now(); return R.some(function(r){ return r.flip && t - r.flip < 420; }); }
    function kick(){ if(!raf && !calm()) raf = requestAnimationFrame(frame); }
    function frame(){
      raf = 0;
      if(!G) return;
      var t = now();
      step(t);
      paint(t);
      if(busy()) raf = requestAnimationFrame(frame); else settled();
    }
    function step(t){
      dCrit = curCrit(t);
      // rows that wait for their sample, fly, grow
      var keep = [];
      fly.forEach(function(f){
        var k = (t - f.t0) / f.dur, r = f.r;
        if(k < 0){ keep.push(f); return; }
        if(r.st === 'wait'){ r.st = 'fly'; if(f.scoop) scoopAt(f.from[0], f.from[1] + 6, f.sr[0], f.sr[1]); }
        if(f.scoop && k < 0.35){ keep.push(f); if(!f.el){ f.el = flyEl(); } setFly(f.el, f.from[0], f.from[1], 0.6 + k); return; }
        var kk = f.scoop ? (k - 0.35) / 0.65 : k;
        if(kk >= 1){ if(f.el) flyFree(f.el); if(f.scoop) scoopOff(); r.st = 'grow'; r.g0 = t; r.f = 0; return; }
        if(!f.el) f.el = flyEl();
        var e = easeIO(clamp(kk, 0, 1)), x = f.from[0] + (f.to[0] - f.from[0]) * e, y = f.from[1] + (f.to[1] - f.from[1]) * e - Math.sin(Math.PI * e) * f.arc;
        setFly(f.el, x, y, 1 - 0.35 * e);
        keep.push(f);
      });
      fly = keep;
      R.forEach(function(r){ if(r.st === 'grow'){ r.f = clamp((t - r.g0) / r.gDur, 0, 1); r.f = easeOut(r.f); if(t - r.g0 >= r.gDur){ r.f = 1; r.st = 'done'; } } });
      var lk = [];
      leaving.forEach(function(r){ r.lf = clamp((t - r.l0) / 220, 0, 1); if(r.lf >= 1){ r.el.remove(); } else lk.push(r); });
      leaving = lk;
    }
    function setFly(e, x, y, sc){ var tr = 'translate(' + n1(x) + ' ' + n1(y) + ') scale(' + (Math.round(sc * 100) / 100) + ')'; if(e._tr !== tr){ e._tr = tr; e.setAttribute('transform', tr); } }

    /* the counts, the labels, the knob, the plot and the cause line, all from the rows as drawn */
    var Dn = { hit: 0, miss: 0, built: 0 };
    function paint(t){
      if(!G) return;
      var hit = 0, miss = 0, built = 0;
      R.forEach(function(r, i){ var d = paintRow(r, i, t); if(d.counted){ built++; if(d.hit) hit++; else miss++; } if(r.flip){ var on = t - r.flip < 420; if(r._fl !== on){ r._fl = on; r.el.classList.toggle('is-flip', on); } if(!on) r.flip = 0; } });
      leaving.forEach(function(r){ paintRow(r, r.i, t); });
      Dn = { hit: hit, miss: miss, built: built, all: R.length };
      var g = G, s = g.st;
      if(!R.length && !leaving.length){ txt(Lb.hit, 'No intervals yet'); Lb.hit.setAttribute('class', 'ci3-cnt is-none'); txt(Lb.miss, ''); }
      else {
        Lb.hit.setAttribute('class', 'ci3-cnt is-hit');
        txt(Lb.hit, built ? hit + ' of ' + built + ' capture ' + parName() : 'Building…');
        txt(Lb.miss, built ? miss + ' miss' : '');
      }
      // the level knob (the drawn level shows on its tag while the rings catch up)
      var dl = dCrit ? levelOfCrit(dCrit) : S.level;
      Lb.dl = dl;
      // while a key's change plays, the knob rides with the rings (the control and the picture never disagree)
      if(cDur > 0 && t < cT0 + cDur && !dragging && kLevel.value() !== Math.round(dl * 100)) kLevel.value(Math.round(dl * 100));
      else if(cDur > 0 && t >= cT0 + cDur && kLevel.value() !== Math.round(S.level * 100)) kLevel.value(Math.round(S.level * 100));
      var lvs = Math.round(dl * 100) + '%';
      if(Lb.lv && Lb._lvs !== lvs + g.phone){ Lb._lvs = lvs + g.phone; Lb.lv.innerHTML = g.phone ? lvs : '<tspan class="ci3-lvk">Level </tspan>' + lvs; }
      // the rate plot: the current level's capture rate over all intervals so far (drawn width), and the levels tried
      paintRate(dl);
      paintSel();
      words(t);
    }
    /* long run counting: every interval's |estimate − value| ÷ SE, sorted, so the rate at any width is one search */
    var tSorted = null;
    function rebuildT(){
      var v = trueVal(), a = new Float64Array(S.smps.length), s = setup();
      for(var i = 0; i < S.smps.length; i++){ var m = S.smps[i], se = s.kind === 'prop' ? Math.sqrt(m.est * (1 - m.est) / s.n) : m.s / Math.sqrt(s.n); a[i] = se > 0 ? Math.abs(m.est - v) / se : (m.est === v ? 0 : Infinity); }
      a.sort(); tSorted = a;
    }
    function capAt(c, upto){
      // how many of the first `upto` samples' intervals hold the true value at critical value c (upto: the samples landed so far)
      if(!tSorted || !tSorted.length) return 0;
      var lo = 0, hi = tSorted.length; while(lo < hi){ var m = (lo + hi) >> 1; if(tSorted[m] <= c + 1e-12) lo = m + 1; else hi = m; }
      return lo;
    }
    var tried = {};   // levels the student has looked at with these samples
    function paintRate(dl){
      var landedAll = S.smps.length - (R.length - Dn.built);   // samples whose rings have landed
      var q = G.rate;
      if(landedAll <= 0 || !R.length){ placeDiag([]); Lb.rdot.style.display = 'none'; txt(Lb.rall, ''); if(Lb.rdots.innerHTML) Lb.rdots.innerHTML = ''; return; }
      // the samples still in the air are not counted: the rate is the drawn rows plus every older sample
      var older = S.smps.length - R.length, cOld = older > 0 ? capOld(dCrit, older) : 0, rate = (cOld + Dn.hit) / (older + Dn.built) * 100;
      var x = rX(dl * 100), y = rY(rate);
      // the line's name sits under the line, at the end away from the current dot
      at(Lb.rdot, { cx: x, cy: y }); Lb.rdot.style.display = '';
      Lb.rall.innerHTML = '<tspan class="ci3-rv">' + F(rate, 1) + '%</tspan> of ' + big(older + Dn.built);
      placeDiag([[x, y]].concat(Dn.built === R.length ? Object.keys(tried).filter(function(k){ return Math.abs(+k - dl) >= 0.004; }).map(function(k){ var L = +k; return [rX(L * 100), rY(capAt(critOf(L)) / S.smps.length * 100)]; }) : []));

      // the levels tried, small: their rates with the same samples
      var key = '', dots = '';
      if(Dn.built === R.length){
        Object.keys(tried).forEach(function(k){ var L = +k; if(Math.abs(L - dl) < 0.004) return; var c = critOf(L), rr = capAt(c) / S.smps.length * 100; dots += '<circle class="ci3-rold" r="3.5" cx="' + n1(rX(L * 100)) + '" cy="' + n1(rY(rr)) + '"/>'; key += k + ','; });
      }
      if(Lb.rdots._k !== dots){ Lb.rdots._k = dots; Lb.rdots.innerHTML = dots; }
    }
    /* the older samples (not on the board) at critical value c: counted from the sorted list minus the rows shown */
    var oldSorted = null;
    function capOld(c, older){
      if(!oldSorted || oldSorted.length !== older){
        var v = trueVal(), s = setup(), a = new Float64Array(older);
        for(var i = 0; i < older; i++){ var m = S.smps[i], se = s.kind === 'prop' ? Math.sqrt(m.est * (1 - m.est) / s.n) : m.s / Math.sqrt(s.n); a[i] = se > 0 ? Math.abs(m.est - v) / se : (m.est === v ? 0 : Infinity); }
        a.sort(); oldSorted = a;
      }
      var lo = 0, hi = oldSorted.length; while(lo < hi){ var m2 = (lo + hi) >> 1; if(oldSorted[m2] <= c + 1e-12) lo = m2 + 1; else hi = m2; }
      return lo;
    }

    /* ---------------------------------------------------- the selected row */
    var selBand = null;
    function paintSel(){
      if(!selBand){ selBand = mk('rect', 'ci3-selband', { rx: 3 }, sSel); }
      var r = R[S.sel];
      if(!r || r.st !== 'done'){ selBand.style.display = 'none'; return; }
      var s = G.st, h = Math.max(s.rowH + 2, 7), y = rowY(S.sel);
      at(selBand, { x: s.l - 10, y: y - h / 2, width: s.r - s.l + 20, height: h }); selBand.style.display = '';
    }
    function select(i, how){
      if(i === S.sel && how === 'tap') i = -1;
      S.sel = i;
      R.forEach(function(r){ r._sel = null; });
      paint(now());
      var r = R[i];
      if(r && r.drawn){ say(rowText(r, i)); tourDid('tap'); }
    }
    function rowText(r, i){
      var me = dCrit * r.se, lo = r.est - me, hi = r.est + me;
      return 'Interval ' + (i + 1) + ': ' + statName() + ' = ' + F(r.est, kind() === 'prop' ? 3 : 2) + ', plus or minus ' + F(dCrit, 3) + ' times ' + F(r.se, kind() === 'prop' ? 4 : 3) + ', from ' + F(lo, 3) + ' to ' + F(hi, 3) + (r.drawn && r.drawn.hit ? ': it captures ' : ': it misses ') + parName() + '.';
    }
    function nearestRow(clientY){
      var rc = sceneBox.getBoundingClientRect(), y = clientY - rc.top, best = -1, bd = Infinity;
      R.forEach(function(r, i){ if(r.st !== 'done') return; var d = Math.abs(rowY(i) - y); if(d < bd){ bd = d; best = i; } });
      return bd <= Math.max(22, G.st.rowH * 2) ? best : -1;
    }
    pickBox.addEventListener('click', function(e){ if(!G || !R.length) return; hideCue(true); var i = nearestRow(e.clientY); if(i < 0){ select(-1); return; } select(i, 'tap'); });
    pickBox.addEventListener('keydown', function(e){
      if(!R.length) return;
      var i = S.sel;
      if(e.key === 'ArrowDown') i = Math.min(R.length - 1, i + 1); else if(e.key === 'ArrowUp') i = Math.max(0, i < 0 ? 0 : i - 1);
      else if(e.key === 'Home') i = 0; else if(e.key === 'End') i = R.length - 1; else if(e.key === 'Escape'){ if(S.sel < 0) return; i = -1; } else return;
      e.preventDefault(); hideCue(true); select(i, 'key');
    });

    /* ---------------------------------------------------- the words: cause line, live, takeaways */
    var wKey = '', take = null;
    function pills(t){
      var lv = Math.round((Lb.dl || S.level) * 100), L = S.level;
      var d = Dn;
      if(S.sel > -1 && R[S.sel] && R[S.sel].drawn){
        var r = R[S.sel], me = dCrit * r.se, hit = r.drawn.hit, dp = kind() === 'prop' ? 2 : 1;
        return [{ t: statName() + ' = ' + F(r.est, dp + 1), role: 'samp', say: 'the sample gives ' + statName() + ' = ' + F(r.est, dp + 1) },
          { t: '± ' + F(me, dp + 2), role: 'lev', say: 'the margin of error is ' + F(dCrit, 3) + ' times ' + F(r.se, dp + 2) + ', so plus or minus ' + F(me, dp + 2) },
          { t: hit ? 'captures ' + parName() : 'misses ' + parName(), role: hit ? 'hit' : 'miss' }];
      }
      if(!R.length) return [{ t: lv + '% level', role: 'lev' }, { t: '100 samples', role: 'samp' }, { t: 'how many capture ' + parName() + '?', role: 'hit' }];
      var out = [{ t: lv + '% level', role: 'lev' }];
      if(S.lastWhy && S.lastWhy.at > 0 && d.built === d.all) out.push({ t: S.lastWhy.t, role: 'ink' });
      if(d.built < d.all) out.push({ t: d.built + ' built', role: 'samp' });
      if(d.built) out.push({ t: d.hit + ' of ' + d.built + ' capture ' + parName(), role: 'hit' });
      if(d.built === d.all && d.all === 100 && !(S.lastWhy && S.lastWhy.at > 0)){
        var w = lrWord(L);
        out.push({ t: (w === 'about' ? 'about ' : w + ' ') + Math.round(L * 100) + '% in the long run', role: w === 'about' ? 'hit' : 'miss', say: (w === 'about' ? 'about ' : w + ' ') + Math.round(L * 100) + ' percent of intervals built this way capture ' + parName() + ' in the long run' });
      }
      return out;
    }
    function words(t){
      var list = pills(t), k = JSON.stringify(list);
      if(take && Dn.built === Dn.all && !busy()){ if(wKey !== 'take:' + take){ wKey = 'take:' + take; cause.take(take); } return; }
      if(k === wKey) return;
      wKey = k; cause.set(list);
    }

    /* ---------------------------------------------------- actions */
    function stopAll(){
      if(raf){ cancelAnimationFrame(raf); raf = 0; }
      fly.forEach(function(f){ if(f.el) flyFree(f.el); }); fly = [];
      scoopOff();
      R.forEach(function(r){ if(r.st !== 'done'){ r.st = 'done'; r.f = 1; } });
      leaving.forEach(function(r){ r.el.remove(); }); leaving = [];
      if(cDur > 0){ crit0 = crit1; cDur = 0; }
      dCrit = crit1;
    }
    function clearRows(animate){
      R.forEach(function(r, i){ r.i = i; if(animate && !calm()){ r.st = r.st === 'done' ? 'leave' : 'leave'; r.l0 = now(); r.lf = 0; leaving.push(r); } else r.el.remove(); });
      R = []; S.sel = -1;
    }
    function resetSamples(){ S.smps = []; tSorted = null; oldSorted = null; tried = {}; }
    function build(more){
      if(!G) return;
      hideCue(true); tourDid('build');
      if(S.smps.length >= MAXN){ say('That is ' + big(MAXN) + ' intervals, the most this page keeps. Start over to begin again.'); cause.take(big(MAXN) + ' intervals is the most this page keeps: Start over.'); wKey = ''; return; }
      stopAll();
      S.sel = -1; S.lastWhy = null; take = null;
      var s = setup(), fresh = C.batch(r, s, 100), first = !S.took.slow; S.took.slow = 1;
      S.smps = S.smps.concat(fresh); S.builds++;
      rebuildT(); oldSorted = null;
      tried[S.level.toFixed(2)] = 1;
      crit0 = crit1 = dCrit = critOf(S.level); cDur = 0;
      clearRows(true);
      var t0 = now() + (leaving.length ? 160 : 0), pegY = null;
      fresh.forEach(function(m, i){
        var e = rowEl(), se = s.kind === 'prop' ? Math.sqrt(m.est * (1 - m.est) / s.n) : m.s / Math.sqrt(s.n);
        var row = { k: S.smps.length - 100 + i, est: m.est, se: se, el: e.el, ring: e.ring, dot: e.dot, cross: e.cross, st: 'wait', f: 0, gDur: first && i < 2 ? 320 : 150 };
        R.push(row);
        var slow = first && i < 2, st = slow ? t0 + i * 760 : t0 + (first ? 1600 : 0) + (first ? i - 2 : i) * 9, from = crowdSpot(i), to = [n1(xs(m.est)), rowY(i)];
        var sp = Math.abs(to[1] - from[1]) + Math.abs(to[0] - from[0]);
        fly.push({ r: row, i: i, t0: st, dur: slow ? 700 : clamp(160 + sp * 0.25, 220, 340), from: from, to: to, arc: clamp(sp * 0.12, 10, 60), scoop: slow, sr: [clamp(G.pop.w * 0.09, 16, 34), clamp((G.pop.cBot - G.pop.cTop) * 0.14, 9, 22)] });
      });
      bBuild.textContent = 'Build 100 more';
      bReset.hidden = false;
      levelKnob(true);
      if(S.builds === 1) S.firstPending = true;
      scrollIn();
      if(calm()){ stopAll(); paint(now()); fade(); settled(); return; }
      kick();
    }
    function scrollIn(){
      if(!G || !G.phone) return;
      try{ var rc = sceneBox.getBoundingClientRect(); if(rc.top < 0 || rc.top > (window.innerHeight || 800) * 0.5) sceneBox.scrollIntoView({ block: 'start', behavior: calm() ? 'auto' : 'smooth' }); }catch(e){}
    }
    function fade(){ sceneBox.classList.remove('is-fade'); void sceneBox.offsetWidth; sceneBox.classList.add('is-fade'); }
    function setLevel(L, how){
      L = Math.round(L * 100) / 100;
      if(L === S.level) return;
      var was = S.level;
      S.level = L;
      hideCue(true); tourDid('level');
      take = null;
      if(!R.length){ levelTag(); paint(now()); return; }
      var c = critOf(L), t = now();
      crit0 = curCrit(t) || critOf(was); crit1 = c;
      if(how === 'drag' || calm()){ cDur = 0; crit0 = c; dCrit = c; }
      else { cT0 = t; cDur = 320; }
      S.lastWhy = { t: L > was ? 'wider' : 'narrower', at: t, dir: L > was ? 1 : -1 };
      levelTag();
      if(calm()){ paint(now()); fade(); settled(); return; }
      paint(t); kick();
    }
    function setN(i){
      i = clamp(i, 0, ns().length - 1);
      if(i === S.nIdx[kind()]) return;
      var was = n();
      S.nIdx[kind()] = i;
      hideCue(true);
      take = null; covCache = {};
      nTag();
      D0 = dom(); drawFront();
      crit0 = crit1 = dCrit = critOf(S.level); cDur = 0;
      var had = R.length > 0;
      stopAll(); clearRows(true); resetSamples(); S.builds = had ? 1 : 0;
      if(had){ rebuildAfter(n() > was ? 'larger n, narrower' : 'smaller n, wider'); return; }
      paint(now()); kick();
    }
    /* new samples of the same count after a change of n (or the population): rings drop out, new ones are thrown */
    function rebuildAfter(why){
      var s = setup(), fresh = C.batch(r, s, 100);
      S.smps = fresh.slice(); rebuildT(); oldSorted = null; tried = {}; tried[S.level.toFixed(2)] = 1;
      crit0 = crit1 = dCrit = critOf(S.level); cDur = 0;
      var t0 = now() + 200;
      fresh.forEach(function(m, i){
        var e = rowEl(), se = s.kind === 'prop' ? Math.sqrt(m.est * (1 - m.est) / s.n) : m.s / Math.sqrt(s.n);
        var row = { k: i, est: m.est, se: se, el: e.el, ring: e.ring, dot: e.dot, cross: e.cross, st: 'wait', f: 0, gDur: 150 };
        R.push(row);
        var from = crowdSpot(i), to = [n1(xs(m.est)), rowY(i)], sp = Math.abs(to[1] - from[1]) + Math.abs(to[0] - from[0]);
        fly.push({ r: row, i: i, t0: t0 + i * 8, dur: clamp(160 + sp * 0.25, 220, 340), from: from, to: to, arc: clamp(sp * 0.12, 10, 60), scoop: false });
      });
      S.lastWhy = { t: why, at: now(), dir: 0, n: true };
      if(calm()){ stopAll(); paint(now()); fade(); settled(); return; }
      kick();
    }
    function setPop(idv, pTrue){
      var p = POPS.filter(function(x){ return x.id === idv; })[0] || POPS[0];
      var same = p === S.pop && (pTrue == null || pTrue === S.pTrue);
      if(same) return;
      hideCue(true);
      stopAll();
      clearRows(false);
      S.pop = p; if(pTrue != null) S.pTrue = pTrue; else if(p.kind === 'prop') S.pTrue = p.p;
      pick.value = p.id;
      resetSamples(); S.builds = 0; S.lastWhy = null; take = null; covCache = {};
      bBuild.textContent = 'Build 100 intervals'; bReset.hidden = true;
      CM = crowdModel(); D0 = dom();
      crit0 = crit1 = dCrit = critOf(S.level); cDur = 0;
      relayout(true);
      levelKnob(false);
      fade();
      say('Population: ' + (p.crowd || p.name) + '. No intervals yet.');
      refHtml();
    }
    function startOver(){
      hideCue(true);
      stopAll(); clearRows(true); resetSamples(); S.builds = 0; S.lastWhy = null; take = null; S.sel = -1;
      bBuild.textContent = 'Build 100 intervals'; bReset.hidden = true;
      levelKnob(false);
      paint(now()); kick(); refHtml();
      try{ bBuild.focus({ preventScroll: true }); }catch(e){}
    }
    /* a change has finished: the takeaway (once each), the live line, the "?" numbers */
    function settled(){
      var d = Dn, L = Math.round(S.level * 100);
      if(!R.length){ refHtml(); return; }
      tried[S.level.toFixed(2)] = 1;
      if(S.firstPending){
        S.firstPending = false;
        var w = lrWord(S.level);
        if(!S.took.first){ S.took.first = 1; take = w === 'about' ? 'Over many samples, about ' + L + '% of ' + L + '% intervals capture the true value.'
          : 'In the long run ' + (w === 'below' ? 'fewer' : 'more') + ' than ' + L + '% of these capture ' + parName() + ': see ? for why.'; }
      } else if(S.lastWhy && S.lastWhy.dir){
        var dir = S.lastWhy.dir;
        if(!S.took['lv' + dir]){ S.took['lv' + dir] = 1; take = dir > 0 ? 'A higher level makes every interval wider, so more of them capture ' + parName() + '.' : 'A lower level makes every interval narrower, so more of them miss ' + parName() + '.'; }
      } else if(S.lastWhy && S.lastWhy.n){
        if(!S.took.n){ S.took.n = 1; take = 'Larger samples, narrower intervals; about the same share still capture ' + parName() + '.'; if(/smaller/.test(S.lastWhy.t)) take = 'Smaller samples, wider intervals; about the same share still capture ' + parName() + '.'; if(lrWord(S.level) !== 'about') take = null; }
      }
      wKey = '';
      words(now());
      say(d.hit + ' of ' + d.built + ' intervals capture ' + parName() + ' at a ' + L + '% level. ' + cause.text());
      refHtml();
    }

    /* ---------------------------------------------------- controls on the picture */
    var LV0 = 80, LV1 = 99;
    var kLevel = K.drag(layer, { key: 'apstat-ci-capture-level', label: 'Confidence level', min: LV0, max: LV1, step: 1, value: 95, chip: false,
      track: [0, 0, 1, 0],
      valuetext: function(v){ return v + ' percent confidence'; },
      onInput: function(v){ setLevel(v / 100, dragging ? 'drag' : 'key'); } });
    kLevel.el.classList.add('ci3-klev');
    var dragging = false;
    // a key steps from the level asked for, not from where the knob is while it rides with a change still playing
    kLevel.input.addEventListener('keydown', function(e){
      kLevel.input.value = String(Math.round(S.level * 100));
      if(e.key === 'PageUp' || e.key === 'PageDown'){ e.preventDefault(); hideCue(true); kLevel.value(clamp(Math.round(S.level * 100) + (e.key === 'PageUp' ? 10 : -10), LV0, LV1), true); }
    }, true);
    kLevel.el.addEventListener('pointerdown', function(){ dragging = true; }, true);
    window.addEventListener('pointerup', function(){ if(dragging){ dragging = false; } });
    window.addEventListener('pointercancel', function(){ dragging = false; });
    function levelKnob(on){ kLevel.hide(!on); if(Lb.lv) Lb.lv.style.display = on ? '' : 'none'; }
    function levelTag(){ kLevel.value(Math.round(S.level * 100)); }
    var kN = K.drag(layer, { key: 'apstat-ci-capture-n', label: 'Sample size n', min: 0, max: NP.length - 1, step: 1, value: S.nIdx.prop, quiet: true,
      track: [0, 0, 1, 0],
      valuetext: function(i){ return 'n = ' + ns()[clamp(i, 0, ns().length - 1)]; },
      onInput: function(i){ setN(i); } });
    kN.el.classList.add('ci3-kn');
    function nTag(){ kN.input.max = String(ns().length - 1); kN.value(S.nIdx[kind()]); var t = Lb.nl && Lb.nl.querySelector('.ci3-nv'); if(t) txt(t, 'n = ' + n()); }

    /* ---------------------------------------------------- the first visit cue (at the Build button) and "Show me how" */
    var cueO = { key: 'apstat-ci-capture', text: 'Start here', side: 'right',
      at: function(){ var a = acts.getBoundingClientRect(), b = bBuild.getBoundingClientRect(); var k = actLayer.scale() || 1; return [(cueO.side === 'left' ? b.left - a.left - 4 : b.right - a.left + 4) / k, (b.top - a.top + b.height / 2) / k]; } };   // the layer reads its scale from the first svg inside (the cue's own icon)
    var cue = K.cue(actLayer, cueO);
    function hideCue(used){ if(cue.active()) cue.hide(used); acts.classList.remove('has-cue'); }
    function cueShow(){
      if(S.mode !== 'explore' || R.length) return;
      // beside Build, on the side with room (right of it when the button starts its row, left of it when it ends one)
      var a = acts.getBoundingClientRect(), b = bBuild.getBoundingClientRect();
      cueO.side = a.right - b.right >= 180 ? 'right' : 'left';
      acts.classList.add('has-cue'); if(!cue.show()) acts.classList.remove('has-cue'); }
    var tour = K.tour({ key: 'apstat-ci-capture', label: 'Show me how', steps: [
      { id: 'build', text: 'Build 100 intervals: 100 random samples from this population, one interval from each.', target: function(){ return bBuild; } },
      { id: 'level', text: 'Drag the level. The same samples rebuild their intervals, wider or narrower.', target: function(){ return kLevel.el.hidden ? bBuild : kLevel.el.querySelector('.tk2-knob'); } },
      { id: 'tap', text: 'Tap an interval to read its parts: the statistic, plus or minus the margin of error.', target: function(){ return G ? rectOf(G.st) : sceneBox; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function rectOf(b){ var rc = sceneBox.getBoundingClientRect(); return { left: rc.left + b.x, top: rc.top + b.y, width: b.w, height: b.h, right: rc.left + b.x + b.w, bottom: rc.top + b.y + b.h }; }
    function tourDid(x){ if(tour.active()) tour.did(x); }
    function startTour(){ if(S.mode !== 'explore') return; hideCue(false); tour.start(true); }

    bBuild.addEventListener('click', function(){ build(); });
    bReset.addEventListener('click', function(){ startOver(); });
    pick.addEventListener('change', function(){ setPop(pick.value); });
    stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End)/.test(e.key)) hideCue(true); }, true);

    /* ---------------------------------------------------- layout and full redraws */
    function placeControls(){
      var s = G.st, p = G.pop;
      kLevel.place(s.track);
      kN.place(p.track);
      pickBox.style.left = (s.x) + 'px'; pickBox.style.top = (s.top - 4) + 'px'; pickBox.style.width = s.w + 'px'; pickBox.style.height = (s.bot - s.top + 8) + 'px';
      if(cue.active()) cue.place();
    }
    function relayout(force){
      var g = layout(); if(!g) return;
      var key = g.W + 'x' + g.H;
      if(!force && G && key === G.key) return;
      g.key = key; G = g;
      svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H); svg.setAttribute('width', g.W); svg.setAttribute('height', g.H);
      if(!CM || CMsmall !== g.phone) CM = crowdModel();
      if(!D0) D0 = dom();
      drawStatic(); drawCrowd();
      placeControls();
      levelKnob(R.length > 0);
      nTag(); levelTag();
      R.forEach(function(r){ r._d = r._cx = r._sw = null; });
      // rows in flight keep flying to their new place
      fly.forEach(function(f){ f.to = [n1(xs(f.r.est)), rowY(f.i)]; });
      paint(now());
      if(busy()) kick();
    }
    /* the scene's height comes from the room left on screen, so the picture, the Build button and the cause line show
       together (phones and tablets; on a desktop the frame gives the stage its height) */
    function fitHeight(){
      var vw = window.innerWidth || 1024, vh = window.innerHeight || 800;
      if(vw >= 1000){ sceneBox.style.height = ''; return; }
      var top = sceneBox.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
      var below = lines.offsetHeight || 120;
      var hh = Math.round(vh - Math.min(top, vh * 0.32) - below - 18);
      sceneBox.style.height = clamp(hh, vw < 600 ? 470 : 520, vw < 600 ? 720 : 860) + 'px';
    }
    var roT = 0;
    function onResize(){ clearTimeout(roT); roT = setTimeout(function(){ fitHeight(); relayout(); }, 40); }
    try{ if(window.ResizeObserver){ new ResizeObserver(function(){ relayout(); }).observe(sceneBox); new ResizeObserver(function(){ if(cue.active()) cue.place(); }).observe(bBuild); } }catch(e){}
    window.addEventListener('resize', onResize);

    /* ---------------------------------------------------- the reference behind "?" */
    function refHtml(){
      var s = setup(), isP = s.kind === 'prop', L = pct(S.level, 0), cw = condWhy(), v = R[S.sel];
      function art(t){ return (/^8/.test(t) ? 'an ' : 'a ') + t; }
      var rows = LEVELS.concat(LEVELS.indexOf(S.level) < 0 ? [S.level] : []).sort().map(function(Lv){ var c = critOf(Lv); return '<tr' + (Math.abs(Lv - S.level) < 1e-9 ? ' class="hl"' : '') + '><th scope="row">' + pct(Lv, 0) + '</th><td class="r">' + F(c, 3) + '</td><td class="r">' + (isFinite(longRun(Lv)) ? F(longRun(Lv), 1) + '%' : '') + '</td></tr>'; }).join('');
      var h = '<p class="ci3-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>';
      h += '<h3>What you are looking at</h3><p><b>The population</b> (top): ' + (isP ? 'each figure stands for many ' + esc(S.pop.noun || 'people') + '; the blue ones ' + esc(S.pop.yes || 'say yes') + ', exactly ' + pct(S.pTrue, 0) + ' of the crowd, so the true proportion is ' + parText() + '.' : 'each figure stands for many ' + esc(S.pop.noun || 'people') + ', standing at their value on the floor scale, so the crowd has the population’s shape (' + (S.pop.shape === 'skewed' ? 'skewed right' : 'normal') + '); its mean is ' + parText() + '.') + '</p>';
      h += '<p><b>One row, one sample.</b> Each row is ' + art(L) + ' confidence interval built from its own random sample of ' + s.n + '. The orange dot is that sample’s ' + (isP ? 'proportion p̂' : 'mean x̄') + '; the posts are its ends. The blue peg is the true ' + (isP ? 'proportion' : 'mean') + ', which in real life we never see. A green ring captures it; a vermillion one with a cross misses.</p>';
      h += '<p><b>What ' + L + ' confident means.</b> The method captures the true value in about ' + L + ' of samples: if we took many random samples of this size and built ' + art(L) + ' interval from each, about ' + L + ' of the intervals would capture the true ' + (isP ? 'proportion' : 'mean') + '. Any one interval either captures it or misses; the ' + L + ' describes the method, not one interval. That is why the count in one batch of 100 wobbles (96, 93, 95) while the rate over many batches settles.</p>';
      h += '<p><b>The margin of error</b> is critical value × standard error: ' + (isP ? th('$z^* \\sqrt{\\hat{p}(1 - \\hat{p})/n}$') : th(S.useZ ? '$z^* \\, s/\\sqrt{n}$' : '$t^* \\, s/\\sqrt{n}$ with $df = n - 1$')) + '. A higher level needs a larger critical value, so every interval gets wider and more of them capture the true value. A sample 4 times as large halves the standard error, so the intervals get about half as wide; the share that capture stays about the level.</p>';
      if(cw === 'counts') h += '<p><b>Why fewer capture here.</b> With n = ' + s.n + ' and p = ' + F(s.p, 2) + ', the expected ' + (s.n * s.p < 10 ? 'successes' : 'failures') + ' are ' + F(Math.min(s.n * s.p, s.n * (1 - s.p)), 1) + ', under 10: the large counts condition fails. The sampling distribution of p̂ is not close to normal (and a sample with p̂ = 0 gives an interval of width 0), so the z interval’s long run capture rate is ' + F(longRun(S.level), 1) + '%, not ' + L + '.</p>';
      if(cw === 'wobble') h += '<p><b>Why not exactly ' + L + '.</b> p̂ can only take the values 0, 1/n, 2/n, …, so the z interval’s long run capture rate wobbles around the level when n is small, even when the large counts condition holds: here it is ' + F(longRun(S.level), 1) + '%.</p>';
      if(cw === 'skew') h += '<p><b>Why fewer capture here.</b> The population is skewed right and n = ' + s.n + ' is small, so the sampling distribution of x̄ is still skewed and the t interval’s long run capture rate is about ' + F(longRun(S.level), 1) + '%, under ' + L + '. With n ≥ 30 (the central limit theorem) it comes close to the level.</p>';
      if(cw === 'z') h += '<p><b>Why fewer capture here.</b> z* is too small for a mean with s in place of σ: the intervals are too narrow, and their long run capture rate is about ' + F(longRun(S.level), 1) + '%, under ' + L + '. The t* with ' + (s.n - 1) + ' degrees of freedom fixes it.</p>';
      h += '<p><b>Say it right.</b> "We are ' + L + ' confident that the interval from … to … captures the true ' + (isP ? 'proportion' : 'mean') + ' of all ' + esc(S.pop.noun || '…') + ' …". Not "' + L + ' of the data", not "a ' + L + ' chance the true ' + (isP ? 'proportion' : 'mean') + ' is in this interval": once it is built, an interval either holds the true value or it does not.</p>';
      if(v && v.drawn){
        var me = dCrit * v.se, sd = isP ? null : v.se * Math.sqrt(s.n);
        h += '<h3>Interval ' + (S.sel + 1) + ', step by step</h3><p>' + th(isP ? '$\\hat{p} = ' + M.fixed(v.est, 4) + '$, $\\text{SE} = \\sqrt{\\frac{' + M.fixed(v.est, 4) + '(' + M.fixed(1 - v.est, 4) + ')}{' + s.n + '}} = ' + M.fixed(v.se, 4) + '$' : '$\\bar{x} = ' + M.fixed(v.est, 3) + '$, $s = ' + M.fixed(sd, 3) + '$, $\\text{SE} = \\frac{s}{\\sqrt{' + s.n + '}} = ' + M.fixed(v.se, 4) + '$') + '</p><p>' + th('$\\text{ME} = ' + M.fixed(dCrit, 3) + ' \\times ' + M.fixed(v.se, 4) + ' = ' + M.fixed(me, 4) + '$') + ', so the interval is from ' + F(v.est - me, 4) + ' to ' + F(v.est + me, 4) + (v.drawn.hit ? ': it captures ' : ': it misses ') + parText() + '.</p>';
      }
      h += '<h3>The critical values here</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Critical values by level"><table class="ls-tbl"><caption class="sr-only">Critical value and long run capture rate for each confidence level</caption><thead><tr><th scope="col">Level</th><th scope="col">' + (isP || S.useZ ? 'z*' : 't*, df = ' + (s.n - 1)) + '</th><th scope="col">Long run</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
      h += '<p class="ci3-small">"Long run" is this method’s capture rate over endless samples: ' + (isP ? 'exact, summed over every possible count' : S.pop.shape === 'skewed' ? 'from 200,000 simulated samples' : S.useZ ? 'exact, from the t distribution' : 'exactly the level, since the population is normal') + '.</p>';
      h += '<h3>More settings</h3>';
      if(isP) h += '<div class="ci3-set"><label for="' + id + '-p">True proportion p: <b class="ci3-pv">' + F(S.pTrue, 2) + '</b></label><input type="range" id="' + id + '-p" class="ci3-prange" min="0.02" max="0.98" step="0.01" value="' + S.pTrue + '"><p class="ci3-small">Changing p starts over with a new crowd.</p></div>';
      else h += '<label class="ci3-zopt"><input type="checkbox" class="ci3-z"' + (S.useZ ? ' checked' : '') + '> Use z* instead of t* for a mean (the wrong critical value)</label><p class="ci3-small">With s in place of σ, intervals for a mean need the wider t*. Turn this on with a small n and watch the capture rate fall below the level.</p>';
      h += '<h3>Keys</h3><p>The level knob: arrows one percent, Page Up and Down ten, Home and End 80% and 99%. The intervals: Tab to them, then up and down arrows pick one, Escape clears. The sample size knob: arrows.</p>';
      h += '<p class="ci3-small">Seed ' + seed + '. Every interval built since the last change of sample size or population counts toward the rate; a change of level keeps the same samples.</p>';
      h += '<div class="ci3-about">' + (data.intro || '') + '<h3>' + esc(data.howItWorksTitle || 'How it works') + '</h3>' + th(data.howItWorks || '') + '</div>';
      if(ref._h !== h){ ref._h = h; ref.innerHTML = h; bindRef(); }
    }
    function bindRef(){
      var hw = ref.querySelector('[data-how]'); if(hw) hw.addEventListener('click', function(){ startTour(); });
      var pr = ref.querySelector('.ci3-prange');
      if(pr){ var pv = ref.querySelector('.ci3-set .ci3-pv'); pr.addEventListener('input', function(){ pv.textContent = F(+pr.value, 2); }); pr.addEventListener('change', function(){ var v = Math.round(+pr.value * 100) / 100; S.pop = null; setPop(pick.value, v); }); }
      var z = ref.querySelector('.ci3-z');
      if(z) z.addEventListener('change', function(){ S.useZ = z.checked; covCache = {}; D0 = dom(); if(R.length){ var c = critOf(S.level); crit0 = curCrit(now()); crit1 = c; cT0 = now(); cDur = calm() ? 0 : 320; if(cDur === 0) dCrit = c; rebuildT(); oldSorted = null; } drawFront(); levelKnob(R.length > 0); paint(now()); kick(); refHtml(); });
    }

    function boot(){
      fitHeight();
      relayout(true);
      paint(now());
      refHtml();
      setTimeout(function(){ fitHeight(); relayout(); cueShow(); }, 60);
    }
    function shown(m){
      S.mode = m;
      if(m !== 'explore'){ stopAll(); paint(now()); tour.stop(); hideCue(false); return; }
      setTimeout(function(){ fitHeight(); relayout(true); cueShow(); }, 40);
    }
    return {
      kit2: function(pane, s){ boot(); return { stage: stage, ref: ref }; },
      plain: function(){ host.appendChild(stage); host.appendChild(ref); boot(); },
      shown: shown, stop: function(){ stopAll(); },
      // for the sweep test only: window.ApStatCiCapture when the test sets window.LevlToolTest before the page loads
      _t: { S: S, R: function(){ return R; }, G: function(){ return G; }, Dn: function(){ return Dn; }, D0: function(){ return D0; }, crit: function(){ return dCrit; }, xs: function(v){ return xs(v); },
        build: build, setLevel: function(v){ kLevel.value(v, true); }, setN: function(i){ kN.value(i, true); }, setPop: setPop, select: select, startOver: startOver,
        busy: busy, cause: cause, levelOf: levelOfCrit, rY: function(c){ return rY(c); }, go: function(m){ var b = document.querySelector('.bt-mode[data-m="' + m + '"]'); if(b) b.click(); }, longRun: longRun, kLevel: kLevel, kN: kN, crowd: function(){ return crowd; }, relayout: relayout, finish: function(){ stopAll(); paint(now()); settled(); } }
    };
  }

  /* ========================================================= TEST YOURSELF (unchanged) */
  function quiz(host, data){
    var o = { slug: 'ci-capture', noun: 'drill',
      generate: function(r, ctx, type){ return C.generate(r, ctx, type); },
      types: [{ value: 'prop', label: 'Interval for a proportion' }, { value: 'mean', label: 'Interval for a mean' }, { value: 'claim', label: 'A claim from an interval' }, { value: 'capture', label: 'What the level means' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { prop: 'A confidence interval for p', mean: 'A confidence interval for μ', claim: 'A claim from an interval', capture: 'Counting captures' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ var st = api.st; st[s.key] = true; st.yours = null; if(s.key === 'phat' || s.key === 'me' || s.key === 'claim' || s.key === 'count' || s.key === 'mefrom' || s.kind === 'num') figure(api.fig, api.problem, st); },
      // A wrong number is drawn: a dot for p̂, an interval for a margin of error, a tag for the rest.
      onTry: function(s, t, api){ if(t.right || s.kind !== 'num' || !isFinite(t.value)) return; api.st.yours = { key: s.key, v: t.value }; figure(api.fig, api.problem, api.st); },
      method: methodOf
    };
    T.drill(host, data, o);
  }
  function methodOf(s, p){
    var g = p.given || {}, L = g.level ? pct(g.level, 0) : '', tail = g.level ? pct((1 - g.level) / 2, g.level === 0.95 || g.level === 0.99 ? 1 : 0) : '';
    var H = {
      phat: th('$\\hat{p} = \\frac{x}{n} = \\frac{' + g.x + '}{' + g.n + '}$: the count of successes over the sample size.'),
      crit: p.type === 'mean' ? th('Use $t^*$ with $df = n - 1 = ' + (g.n - 1) + '$ and ' + tail + ' in each tail (technology: invT, or Table B at ' + L + ' confidence).') : th('Split the ' + pct(1 - (g.level || 0.95), 0) + ' outside the interval into two tails of ' + tail + ': $z^*$ has ' + pct(1 - (1 - (g.level || 0.95)) / 2, 1) + ' to its left.'),
      se: p.type === 'mean' ? th('$\\text{SE} = \\frac{s}{\\sqrt{n}} = \\frac{' + g.s + '}{\\sqrt{' + g.n + '}}$.') : th('$\\text{SE} = \\sqrt{\\frac{\\hat{p}(1 - \\hat{p})}{n}}$ with the $\\hat{p}$ from step 1 and $n = ' + g.n + '$.'),
      me: 'Multiply the critical value by the standard error from the steps above. Your interval is drawn dashed: it should be centered on the dot and match the solid one.',
      df: th('For one mean, $df = n - 1$.'),
      mefrom: 'The margin of error is half the width: (upper − lower) ÷ 2.',
      count: 'An interval captures the true value when the blue line passes through it. Count those rows.',
      longrun: 'In the long run the capture rate settles at the confidence level, whatever one batch shows.',
      interp: 'A good interpretation names the level, the interval, the parameter in context (all of the population), and says "captures". It is not about the sample or individual values.',
      level: 'The level describes the method: the share of intervals built this way that capture the true value.',
      claim: 'Plausible values are the ones inside the interval. A claim is supported only if every plausible value agrees with it.',
      wider: 'Higher confidence needs a larger critical value.',
      bign: th('The standard error has $\\sqrt{n}$ in the denominator.')
    };
    return H[s.key] || null;
  }
  /* The drill figure: the problem's interval on its axis, its parts shown
     once the margin of error is answered (never before); or the 20
     simulated intervals of a counting problem. */
  function figure(el, p, st){
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    var phone = (window.innerWidth || 1280) <= 640, W = phone ? 340 : 600, H = g.kind === 'many' ? (phone ? 380 : 340) : (phone ? 300 : 280), L = 18, R = W - 18, out = [];
    if(g.kind === 'many'){
      var lo = Infinity, hi = -Infinity; g.ivs.forEach(function(v){ lo = Math.min(lo, v.lo); hi = Math.max(hi, v.hi); });
      var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
      var x = function(v){ return L + (v - lo) / (hi - lo) * (R - L); }, top = 30, bot = H - 40, rh = (bot - top) / g.ivs.length, tx = x(g.p), reveal = !!st.count;
      out.push('<text class="ci-h" x="' + L + '" y="16">20 intervals, ' + esc(g.L) + ' confidence</text>');
      out.push('<line class="ci-true" x1="' + tx.toFixed(1) + '" x2="' + tx.toFixed(1) + '" y1="' + (top - 6) + '" y2="' + bot + '"/><text class="ci-lab ci-c-pop" x="' + (tx + 5).toFixed(1) + '" y="' + (bot + 14) + '">p = ' + T.F(g.p, 2) + '</text>');
      g.ivs.forEach(function(v, i){
        var y = top + (i + 0.5) * rh, cls = reveal ? (v.hit ? 'is-hit' : 'is-miss') : 'is-plain';
        out.push('<line class="ci-iv ' + cls + '" x1="' + x(v.lo).toFixed(1) + '" x2="' + x(v.hi).toFixed(1) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" style="stroke-width:' + (reveal && !v.hit ? 5 : 3.5) + '"/><circle class="ci-est" cx="' + x(v.est).toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.2"/>');
        if(reveal && !v.hit){ var cx = v.hi < g.p ? x(v.hi) + 8 : x(v.lo) - 8; out.push('<path class="ci-x" d="M' + (cx - 4) + ' ' + (y - 4).toFixed(1) + 'l8 8m0 -8l-8 8"/>'); }
      });
      if(st.yours) out.push('<text class="stat-yours-t" x="' + R + '" y="16" text-anchor="end">You counted ' + T.F(st.yours.v, 0) + '</text>');
      axis(lo, hi, x, bot + 22);
      el.innerHTML = '<figure class="ci-qfig"><svg class="ci-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Twenty confidence intervals, one per row, with a vertical line at the true proportion ' + esc(T.F(g.p, 2)) + (reveal ? '; ' + g.ivs.filter(function(v){ return v.hit; }).length + ' capture it' : '') + '">' + out.join('') + '</svg></figure>';
      return;
    }
    var shownParts = !!(st.me || st.mefrom || p.type === 'claim'), lo2 = g.lo, hi2 = g.hi, span = hi2 - lo2;
    var a = lo2 - span * 0.6, b = hi2 + span * 0.6;
    if(g.p0 != null){ a = Math.min(a, g.p0 - span * 0.25); b = Math.max(b, g.p0 + span * 0.25); }
    // Zoom out to show the student's interval or p̂ (within reason).
    var Yz = st.yours;
    if(Yz && (Yz.key === 'me' || Yz.key === 'mefrom') && Yz.v > 0){ var wv = Math.min(Yz.v, span * 3); a = Math.min(a, g.est - wv - span * 0.1); b = Math.max(b, g.est + wv + span * 0.1); }
    if(Yz && Yz.key === 'phat' && isFinite(Yz.v) && Math.abs(Yz.v - g.est) < span * 4){ a = Math.min(a, Yz.v - span * 0.2); b = Math.max(b, Yz.v + span * 0.2); }
    var x2 = function(v){ return L + (v - a) / (b - a) * (R - L); }, y = H * 0.48, unit = g.unit ? ' ' + g.unit : '';
    var sym = g.sym === '\\hat{p}' ? 'p̂' : 'x̄';
    out.push('<text class="ci-h" x="' + L + '" y="18">' + (shownParts ? 'The ' + esc(g.L) + ' interval' : 'The sample') + '</text>');
    if(shownParts){
      out.push('<line class="ci-iv is-plain" x1="' + x2(lo2).toFixed(1) + '" x2="' + x2(hi2).toFixed(1) + '" y1="' + y + '" y2="' + y + '" style="stroke-width:6"/>');
      if(p.type !== 'claim' || st.mefrom) out.push('<path class="ci-brace" d="M' + x2(g.est).toFixed(1) + ' ' + (y - 16) + 'V' + (y - 22) + 'H' + x2(hi2).toFixed(1) + 'V' + (y - 16) + '"/><text class="ci-lab ci-c-samp" x="' + ((x2(g.est) + x2(hi2)) / 2).toFixed(1) + '" y="' + (y - 28) + '" text-anchor="middle">ME = ' + T.F(g.me, 4) + '</text>');
      [[lo2, 'end'], [hi2, 'start']].forEach(function(e){ out.push('<text class="ci-lab" x="' + (x2(e[0]) + (e[1] === 'end' ? -6 : 6)).toFixed(1) + '" y="' + (y + 5) + '" text-anchor="' + e[1] + '">' + T.F(e[0], g.d) + '</text>'); });
    }
    var Y = st.yours;
    if(Y && (Y.key === 'me' || Y.key === 'mefrom') && Y.v > 0){
      // The student's interval: the center ± their margin of error, dashed, under the axis line of the right one.
      var ya = y + 46, yl = x2(g.est - Y.v), yr = x2(g.est + Y.v), cl = Math.max(L, yl), cr = Math.min(R, yr);
      out.push('<line class="stat-yours" x1="' + cl.toFixed(1) + '" x2="' + Math.max(cl + 2, cr).toFixed(1) + '" y1="' + ya + '" y2="' + ya + '" style="stroke-width:4"/>');
      out.push('<text class="stat-yours-t" x="' + ((cl + cr) / 2).toFixed(1) + '" y="' + (ya + 18) + '" text-anchor="middle">yours: ' + T.F(g.est - Y.v, g.d) + ' to ' + T.F(g.est + Y.v, g.d) + (yl < L || yr > R ? ' (off the scale)' : '') + '</text>');
    } else if(Y && Y.key === 'phat' && Y.v > a && Y.v < b){
      out.push('<circle class="stat-yours-f" cx="' + x2(Y.v).toFixed(1) + '" cy="' + y + '" r="6" opacity=".85"/><text class="stat-yours-t" x="' + x2(Y.v).toFixed(1) + '" y="' + (y - 14) + '" text-anchor="middle">yours ' + T.F(Y.v, 3) + '</text>');
    } else if(Y){
      out.push('<g class="ci-ytag"><text class="stat-yours-t" x="' + R + '" y="18" text-anchor="end">Yours: ' + T.F(Y.v, Y.key === 'df' ? 0 : 3) + '</text></g>');
    }
    var estKnown = p.type !== 'prop' || st.phat;
    // the estimate's label keeps clear of the claim's line (v2 review rule: labels never touch drawn lines)
    var eLab = sym + (estKnown ? ' = ' + T.F(g.est, g.d) + unit : ', the sample proportion'), ex = x2(g.est), eAnch = 'middle', eHalf = eLab.length * 4.2 + 8;
    if(g.p0 != null && Math.abs(x2(g.p0) - ex) < eHalf){ eAnch = x2(g.p0) > ex ? 'end' : 'start'; ex = x2(g.p0) + (x2(g.p0) > ex ? -8 : 8); }
    out.push('<circle class="ci-est" cx="' + x2(g.est).toFixed(1) + '" cy="' + y + '" r="6"/><text class="ci-lab ci-c-samp" x="' + ex.toFixed(1) + '" y="' + (y + 26) + '" text-anchor="' + eAnch + '">' + eLab + '</text>');
    // the claim: a line through the interval's row, its name above it (clear of the student's dashed interval below)
    if(g.p0 != null){ var px = x2(g.p0); out.push('<line class="ci-claim" x1="' + px.toFixed(1) + '" x2="' + px.toFixed(1) + '" y1="' + (y - 34) + '" y2="' + (y + 34) + '"/><text class="ci-lab ci-c-miss" x="' + px.toFixed(1) + '" y="' + (y - 48) + '" text-anchor="middle">claim: ' + T.F(g.p0, 2) + '</text>'); }
    axis(a, b, x2, H - 34);
    el.innerHTML = '<figure class="ci-qfig"><svg class="ci-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(sym + (estKnown ? ' = ' + T.F(g.est, g.d) : ', the sample statistic') + (shownParts ? '; the interval from ' + T.F(lo2, g.d) + ' to ' + T.F(hi2, g.d) : '') + (g.p0 != null ? '; the claimed value ' + T.F(g.p0, 2) : '')) + '">' + out.join('') + '</svg></figure>';
    function axis(a0, b0, xf, yb){
      out.push('<line class="ci-axis" x1="' + L + '" x2="' + R + '" y1="' + yb + '" y2="' + yb + '"/>');
      (P ? P.ticks(a0, b0, 6) : [a0, b0]).forEach(function(t){ var xx = xf(t); out.push('<line class="ci-tick" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + yb + '" y2="' + (yb + 5) + '"/><text class="ci-tk" x="' + xx.toFixed(1) + '" y="' + (yb + 18) + '" text-anchor="middle">' + String(+t.toPrecision(6)).replace('-', '−') + '</text>'); });
    }
  }

  function boot(){
    T.mount(SLUG, function(app, data){
      var ex = null, kit = !!(window.LevlKit2 && window.LevlStudio && app.getAttribute('data-studio'));
      T.modes(app, { slug: SLUG, labels: ['Explore', 'Test yourself'],
        explore: function(host){ ex = explore(host, data); if(window.LevlToolTest) window.ApStatCiCapture = ex._t; },
        quiz: function(host){ quiz(host, data); },
        onShow: function(m){ if(ex) ex.shown(m); },
        studio: kit ? { kit2: function(pane, s){ return ex.kit2(pane, s); } } : {} });
      // Without the frame (no Tool Studio, or no kit) the stage still works on its own, above Test yourself.
      if(!kit || !T.studioOf(app)) ex.plain();
    });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApStatBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; sc.onerror = boot; document.head.appendChild(sc);
  }
})();
