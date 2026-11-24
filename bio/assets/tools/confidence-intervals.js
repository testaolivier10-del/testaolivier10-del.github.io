/* Confidence intervals and error bars, tools v2 (docs/tools-v2-bio-confidence-intervals-brief.md; standard
   docs/tools-v2-standard.md). Built on the shared kit (assets/course/tool-kit2.js) through the course adapter
   ApBioTools.studioKit2. The solver and the seeded problem generator are ApBioProblems.solve.ci and generate.ci
   (bio-skill-problems.js); the contexts, the fixed problems and the formula box are data
   (bio/data/tools/confidence-intervals.json, its "explore" block drives Explore).

   EXPLORE, one screen: two trays of bean seedlings on a lab bench, "Full light" under a lamp and "Shade" under a
   shade cloth, every plant drawn at its height in cm against a measuring board. Beside them (below on a phone) a
   clipboard graph: each tray's mean as a bar with its ±2 SE error bar (the 95% confidence interval), the overlap
   (or the gap) between the two error bars tinted.
     Main control: the knob on the Shade tray's mean line; dragging it grows or shrinks every shade plant together.
     Quiet: the knob on the tallest shade plant spreads the plants from their mean (the SD); "5 | 10 | 20" plants per
     tray (new plants sprout, extra ones go back into the soil; each tray keeps its mean and SD, so only n changes);
     New sample (new plants from the same two populations: chance alone moves the means); Start over.
   Every number, bar, error bar, tint and the cause line is read from the plants AS DRAWN in that frame: a plant is
   counted once it has finished sprouting and stops counting when it starts to leave.
   TEST YOURSELF: Problems (the old practice: new numbers or the worked problems, record ids
   confidence-intervals:<cid>:<part>, unchanged) and Challenges (the old goals, on the Explore picture). */
(function(){
  'use strict';
  var T = window.ApBioTools, S = window.ApBioSkillStage, M = window.ApBioMath;
  if(!T || !S) return;
  var F = T.F, esc = T.esc, SLUG = 'confidence-intervals', NS = 'http://www.w3.org/2000/svg';
  var W = 420, L = 52, R = 16, TP = 14, B = 40, H = 280, pw = W - L - R, ph = H - TP - B;

  /* ------------------------------------------------------------------ the practice figure (Test yourself, unchanged) */
  /* g: [{ name, mean, sd, n }], o: { unit, yLabel, ymax, mine: [{lo, hi}], marks } */
  function draw(g, o){
    var iv = g.map(function(x){ return M.ci95(x.mean, M.seFrom(x.sd, x.n)); });
    var top = 0; iv.forEach(function(c){ top = Math.max(top, c.hi); });
    var ymax = o.ymax || T.niceMax(top * 1.1), sy = function(v){ return TP + ph - Math.max(0, Math.min(1, v / ymax)) * ph; };
    var p = [], ys = T.niceStep(ymax, 5), n = g.length, cx = function(i){ return L + pw * (i + 0.5) / n; }, bw = Math.min(70, pw / n * 0.42);
    for(var t = 0; t <= ymax + 1e-9; t += ys) p.push('<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(t).toFixed(1) + '" y2="' + sy(t).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (sy(t) + 4).toFixed(1) + '" text-anchor="end">' + M.round(t, 6) + '</text>');
    p.push('<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (TP + ph) + '" y2="' + (TP + ph) + '"/><line class="axis" x1="' + L + '" x2="' + L + '" y1="' + TP + '" y2="' + (TP + ph) + '"/>');
    p.push('<text class="lbl" transform="translate(14 ' + (TP + ph / 2) + ') rotate(-90)" text-anchor="middle">' + esc((o.yLabel || 'Mean') + (o.unit ? ' (' + o.unit + ')' : '')) + '</text>');
    var ov = M.overlap(iv[0], iv[1]);
    if(o.marks){
      // the band where the two intervals overlap, or the gap between them, across the plot
      var lo = Math.max(iv[0].lo, iv[1].lo), hi = Math.min(iv[0].hi, iv[1].hi);
      var a = sy(Math.max(lo, hi)), b = sy(Math.min(lo, hi));
      p.push('<rect class="ci-band ' + (ov ? 'ov' : 'gap') + '" x="' + L + '" y="' + a.toFixed(1) + '" width="' + pw + '" height="' + Math.max(1.5, b - a).toFixed(1) + '"/>');
      // pass 3 (2026-11-11): the word sits inside the band, halfway between the two bars, so it never stacks with
      // the interval values beside the caps (a thin band gets the word just above it)
      var bx = g.length > 1 ? (cx(0) + bw / 2 + 42 + cx(1) - bw / 2) / 2 : L + pw / 2, by = b - a >= 16 ? (a + b) / 2 + 4 : a - 5;
      p.push('<text class="ci-bl ' + (ov ? 'ov' : 'gap') + '" x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" text-anchor="middle">' + (ov ? 'overlap' : 'gap') + '</text>');
    }
    g.forEach(function(x, i){
      var c = cx(i), y = sy(x.mean), e = iv[i];
      p.push('<path class="bar ' + (i ? 's2' : 's1') + ' ci-bar" d="' + T.barPath(c - bw / 2, y, bw, TP + ph - y) + '"/>');
      p.push('<path class="err ci-err" d="M' + c.toFixed(1) + ' ' + sy(e.hi).toFixed(1) + 'V' + sy(e.lo).toFixed(1) + 'M' + (c - 9).toFixed(1) + ' ' + sy(e.hi).toFixed(1) + 'h18M' + (c - 9).toFixed(1) + ' ' + sy(e.lo).toFixed(1) + 'h18"/>');
      p.push('<text class="tick" x="' + c.toFixed(1) + '" y="' + (TP + ph + 17) + '" text-anchor="middle">' + esc(x.name) + '</text>');
      if(o.drag){
        p.push('<rect class="sk-col" data-k="m' + i + '" x="' + (c - bw / 2).toFixed(1) + '" y="' + TP + '" width="' + bw.toFixed(1) + '" height="' + ph + '"/>');
        p.push('<circle class="sk-grip ci-grip" data-k="m' + i + '" tabindex="0" role="slider" aria-label="' + esc(x.name + ' mean') + '" aria-valuenow="' + F(x.mean, 1) + '" aria-valuetext="' + esc(x.name + ' mean ' + F(x.mean, 1)) + '" cx="' + c.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9"/>');
        p.push('<rect class="ci-whisk" data-k="s' + i + '" tabindex="0" role="slider" aria-label="' + esc(x.name + ' SD (drag the whisker)') + '" aria-valuenow="' + F(x.sd, 1) + '" aria-valuetext="' + esc(x.name + ' SD ' + F(x.sd, 1)) + '" x="' + (c - 13).toFixed(1) + '" y="' + (sy(e.hi) - 7).toFixed(1) + '" width="26" height="14" rx="5"/>');
      }
      // The interval values sit just right of the bar, clear of its outline.
      var vx = c + bw / 2 + 5;
      if(o.marks) p.push('<text class="ci-v" x="' + vx.toFixed(1) + '" y="' + (sy(e.hi) + 4).toFixed(1) + '">' + F(e.hi, o.d) + '</text><text class="ci-v" x="' + vx.toFixed(1) + '" y="' + (sy(e.lo) + 4).toFixed(1) + '">' + F(e.lo, o.d) + '</text>');
      var m = (o.mine || [])[i];
      if(m && (isFinite(m.lo) || isFinite(m.hi))){
        var mx = c - bw / 2 - 12, yl = isFinite(m.lo) ? sy(m.lo) : null, yh = isFinite(m.hi) ? sy(m.hi) : null;
        [m.lo, m.hi].forEach(function(v){ if(isFinite(v) && (v > ymax || v < 0)){ var yy = v > ymax ? TP : TP + ph, dir = v > ymax ? -1 : 1; p.push('<path class="ci-off" d="M' + (mx - 3) + ' ' + (yy - dir * 2) + 'l6 ' + (dir * 9) + 'l6 ' + (-dir * 9) + 'z"/>'); } });
        if(yl != null && yh != null) p.push('<path class="ci-mine" d="M' + (mx + 6) + ' ' + yh.toFixed(1) + 'h-6V' + yl.toFixed(1) + 'h6"/>');
        else p.push('<line class="ci-mine" x1="' + (mx - 2) + '" x2="' + (mx + 8) + '" y1="' + (yl != null ? yl : yh).toFixed(1) + '" y2="' + (yl != null ? yl : yh).toFixed(1) + '"/>');
      }
    });
    return { svg: '<svg class="bio-svg ci-fig ci2-pfig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria || '') + '">' + p.join('') + '</svg>', iv: iv, ov: ov };
  }

  function stage0(host, s){
    var x = s.input, a = s.answers || {}, chk = s.phase === 'checked', d = x.d == null ? 2 : x.d;
    var mine = x.groups.map(function(gr, k){ return { lo: S.num(a['lo-' + k]), hi: S.num(a['hi-' + k]) }; });
    var r = draw(x.groups, { unit: x.unit, yLabel: x.yLabel, marks: chk, d: d, mine: chk ? [] : mine, aria: 'Bar graph of ' + (x.yLabel || 'the means') + ' for ' + x.groups.map(function(gr){ return gr.name; }).join(' and ') + ', each with error bars of plus or minus 2 SE.' + (chk ? ' The intervals ' + (M.overlap(M.ci95(x.groups[0].mean, M.seFrom(x.groups[0].sd, x.groups[0].n)), M.ci95(x.groups[1].mean, M.seFrom(x.groups[1].sd, x.groups[1].n))) ? 'overlap.' : 'do not overlap.') : '') });
    var typed = mine.some(function(m){ return isFinite(m.lo) || isFinite(m.hi); });
    var cap = chk ? (r.ov ? 'The shaded band is where the two intervals overlap: the true means could be equal, so the data do not show a significant difference.' : 'The shaded band is the gap between the intervals: if the true means were equal, a gap like this would rarely happen by chance.')
      : typed ? 'Your interval ends are the gray brackets left of each bar. They should line up with the ends of that bar’s error bar.' + (mine.some(function(m){ return [m.lo, m.hi].some(function(v){ return isFinite(v) && (v < 0 || v > 1.4 * Math.max.apply(null, x.groups.map(function(gr){ return gr.mean; }))); }); }) ? ' A triangle means a value is off the scale: check it against the mean.' : '')
      : 'Each error bar is ±2 SE around its mean. Type the interval ends and they are drawn beside the bars.';
    S.redraw(host, '<div class="sk-fig">' + r.svg + '</div><p class="sk-cap">' + cap + '</p>');
  }


  /* ------------------------------------------------------------------ helpers */
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function r1(v){ return Math.round(v * 10 + (v >= 0 ? 1e-9 : -1e-9)) / 10; }
  function n1(v){ return Math.round(v * 10) / 10; }
  function ease(x){ return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function mk(tag, cls, attrs, parent){ var e = document.createElementNS(NS, tag); if(cls) e.setAttribute('class', cls); if(attrs) for(var k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.appendChild(e); return e; }
  function at(e, attrs){ for(var k in attrs){ var v = typeof attrs[k] === 'number' ? String(n1(attrs[k])) : attrs[k]; if(e.getAttribute(k) !== v) e.setAttribute(k, v); } }
  function txt(e, s){ if(e.textContent !== s) e.textContent = s; }
  var mctx = null, mCache = {}, FONT = 'Nunito, "Segoe UI", system-ui, sans-serif';
  function tw(s, px, wt){
    var k = (wt || 800) + '|' + px + '|' + s;
    if(mCache[k] != null) return mCache[k];
    if(!mctx){ var c = document.createElement('canvas'); mctx = c.getContext('2d'); }
    mctx.font = (wt || 800) + ' ' + px + 'px ' + FONT;
    return (mCache[k] = mctx.measureText(s).width);
  }
  /* n standardized values (mean 0, SD 1 with n − 1), none beyond ±2.2 */
  function zset(n, r){
    for(var t = 0; t < 80; t++){
      var a = [], s = 0, q = 0, i;
      for(i = 0; i < n; i++){ a.push(r.normal(0, 1)); s += a[i]; }
      var m = s / n; for(i = 0; i < n; i++) q += (a[i] - m) * (a[i] - m);
      var sd = Math.sqrt(q / (n - 1));
      a = a.map(function(v){ return (v - m) / sd; });
      if(a.every(function(v){ return Math.abs(v) <= 2.2; })) return a;
    }
    return a;
  }
  function statsOf(hs){
    var n = hs.length; if(!n) return { n: 0, mean: NaN, sd: NaN, e2: NaN };
    var s = 0, q = 0; hs.forEach(function(h){ s += h; }); var m = s / n;
    hs.forEach(function(h){ q += (h - m) * (h - m); });
    var sd = n > 1 ? Math.sqrt(q / (n - 1)) : NaN;
    return { n: n, mean: m, sd: sd, e2: n > 1 ? 2 * sd / Math.sqrt(n) : NaN };
  }

  function boot(){
    var K = window.LevlKit2;
    T.mount(SLUG, function(app, data, ctx){
      var EX = data.explore, U = EX.unit, RMAX = EX.ruler, AMAX = EX.axis, COUNTS = EX.counts, GR = EX.groups;
      var HLO = 0.8, HHI = RMAX - 0.3;   // the shortest and tallest a plant may be drawn (cm)
      var draws = 0, uid = 0;
      function calm(){ return K.reduced() || !window.requestAnimationFrame; }
      var ZOPEN = GR.map(function(g, i){ return zset(EX.open.n, M.rng(EX.open.seed + 101 * i)); });
      // the model: each tray's sample mean and SD (the plants' targets) and the population New sample draws from
      var Mo = [], P = [[], []], St = { mode: 'explore', part: null, n: EX.open.n }, lastAct = null, before = null;
      function openModel(){ Mo = GR.map(function(g){ return { m: g.mean, s: g.sd, mu: g.mean, sig: g.sd }; }); }
      openModel();

      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'ci2';
      var head = K.head({ purpose: EX.purpose, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'ci2-scene';
      sceneBox.innerHTML = '<svg class="ci2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><defs></defs><g class="ci2-static"></g><g class="ci2-plants"><g class="ci2-pl0"></g><g class="ci2-pl1"></g></g><g class="ci2-front"></g><g class="ci2-live"></g><g class="ci2-labs"></g></svg>';
      stage.appendChild(sceneBox);
      var svg = sceneBox.querySelector('svg'), sDefs = svg.querySelector('defs'), sStatic = svg.querySelector('.ci2-static'), sFront = svg.querySelector('.ci2-front'), sLive = svg.querySelector('.ci2-live'), sLabs = svg.querySelector('.ci2-labs');
      var gPl = [svg.querySelector('.ci2-pl0'), svg.querySelector('.ci2-pl1')];
      var layer = K.layer(sceneBox);
      var lines = document.createElement('div'); lines.className = 'ci2-lines';
      var cause = K.cause({ label: 'Why' });
      var acts = document.createElement('div'); acts.className = 'ci2-acts';
      acts.innerHTML = '<span class="ci2-n" role="group" aria-label="Plants per tray">' + COUNTS.map(function(c){ return '<button type="button" class="ci2-nb" data-n="' + c + '" aria-pressed="' + (c === St.n) + '">' + c + '</button>'; }).join('') + '</span><span class="ci2-nl" aria-hidden="true">plants each</span>' +
        '<button type="button" class="tk2-btn ci2-new">New sample</button><button type="button" class="tk2-link ci2-reset">Start over</button>';
      var nBtns = Array.prototype.slice.call(acts.querySelectorAll('.ci2-nb')), bNew = acts.querySelector('.ci2-new'), bReset = acts.querySelector('.ci2-reset');
      nBtns.forEach(function(b){ b.setAttribute('aria-label', b.getAttribute('data-n') + ' plants in each tray'); });
      lines.appendChild(cause.el); lines.appendChild(acts);
      stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      var lastSaid = '';
      function say(t){ if(t === lastSaid) return; lastSaid = t; live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

      /* ---------------------------------------------------- geometry (picture units = CSS px of the scene) */
      var G = null;
      function layout(){
        var Wd = sceneBox.clientWidth, Hd = sceneBox.clientHeight;
        if(!Wd || !Hd) return null;
        // side by side when there is room across, or too little height to stack; sizes follow the width
        var g = { W: Wd, H: Hd, big: Wd >= 600, wide: Wd >= 900 || (Wd >= 600 && Hd < 600) };
        var pad = g.big ? 16 : 8, trayEnd, top0;
        if(g.wide){
          g.benchH = clamp(Hd * 0.1, 38, 60); g.yB = Hd - g.benchH;
          trayEnd = Wd * 0.6;
          // the clipboard stands on the bench, right of the trays
          g.cb = { x: Wd * 0.635, y: 18, w: Wd - pad - Wd * 0.635, h: g.yB + 6 - 18 };
          top0 = 0;
        } else {
          g.clipH = g.big ? clamp(Hd * 0.46, 300, 340) : clamp(Wd * 0.8, 270, 320);
          g.topH = Hd - g.clipH;
          g.benchH = 22; g.yB = g.topH - g.benchH;
          trayEnd = Wd - pad;
          var cw0 = Math.min(Wd - 2 * pad - 4, 560);
          g.cb = { x: (Wd - cw0) / 2, y: g.topH + 10, w: cw0, h: g.clipH - 18 };
          top0 = 0;
        }
        g.pad = pad;
        g.lampY = top0 + 10; g.lampH = g.big ? 13 : 10;
        g.trayH = g.big ? 30 : 24;
        g.ySoil = g.yB + 4 - g.trayH + 3;
        g.yTop = g.lampY + g.lampH + (g.big ? 30 : 22);
        g.k = (g.ySoil - g.yTop) / RMAX;
        g.rw = g.big ? 34 : 24;
        var gp = g.big ? 30 : 14, mr = g.big ? 34 : 26, x0 = pad + g.rw + 4;
        g.tw = (trayEnd - x0 - gp - mr) / 2;
        g.tx = [x0, x0 + g.tw + gp];
        g.board = [pad, g.yTop - 26, trayEnd - pad, g.ySoil - g.yTop + 26];
        g.knobX = g.tx[1] + g.tw + mr / 2;
        // the clipboard's paper and plot
        var c = g.cb, ins = g.big ? 14 : 10;
        c.px = c.x + ins; c.py = c.y + (g.big ? 26 : 20); c.pw = c.w - 2 * ins; c.ph = c.h - (g.big ? 26 : 20) - ins;
        c.fs = g.big ? 15 : 13;
        c.l = c.px + (g.big ? 46 : 34); c.r = c.px + c.pw - (g.big ? 16 : 10);
        c.t = c.py + (g.big ? 60 : 44); c.b = c.py + c.ph - (g.big ? 56 : 46);
        c.cx = [c.l + (c.r - c.l) * 0.3, c.l + (c.r - c.l) * 0.72];
        c.bw = Math.min((c.r - c.l) * 0.24, 74); c.cap = Math.min(c.bw * 0.55, 26);
        c.y = c.y; c.ky = (c.b - c.t) / AMAX;
        return g;
      }
      function yH(h){ return G.ySoil - h * G.k; }
      function yA(v){ return G.cb.b - clamp(v, 0, AMAX) * G.cb.ky; }
      function plantX(g, f){ return G.tx[g] + 6 + f * (G.tw - 12); }

      /* ---------------------------------------------------- the still parts of the scene */
      function drawStatic(){
        var g = G, o = '', d = '';
        d += '<linearGradient id="ci2-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ci2s-wall0"/><stop offset="1" class="ci2s-wall1"/></linearGradient>' +
          '<linearGradient id="ci2-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ci2s-wood0"/><stop offset="1" class="ci2s-wood1"/></linearGradient>' +
          '<linearGradient id="ci2-sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ci2s-sun0"/><stop offset="1" class="ci2s-sun1"/></linearGradient>' +
          '<linearGradient id="ci2-dim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ci2s-dim0"/><stop offset="1" class="ci2s-dim1"/></linearGradient>' +
          '<pattern id="ci2-mesh" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" class="ci2-mesh-bg"/><path d="M0 0L5 5M5 0L0 5" class="ci2-mesh-l"/></pattern>' +
          '<linearGradient id="ci2-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ci2s-soil0"/><stop offset="1" class="ci2s-soil1"/></linearGradient>';
        o += '<rect x="0" y="0" width="' + g.W + '" height="' + (g.wide ? g.H : g.topH) + '" fill="url(#ci2-wall)"/>';
        // wall tiles, faint
        for(var ty = 40; ty < g.yB; ty += 44) o += '<line class="ci2-tile" x1="0" x2="' + g.W + '" y1="' + ty + '" y2="' + ty + '"/>';
        // the bench
        o += '<rect x="0" y="' + n1(g.yB) + '" width="' + g.W + '" height="' + n1(g.benchH) + '" fill="url(#ci2-wood)"/><rect class="ci2-bench-edge" x="0" y="' + n1(g.yB) + '" width="' + g.W + '" height="3"/>';
        for(var gx = 20; gx < g.W; gx += 130) o += '<path class="ci2-grain" d="M' + gx + ' ' + n1(g.yB + g.benchH * 0.45) + 'q40 -4 90 2"/>';
        if(!g.wide){
          // the bench top below, where the clipboard lies
          o += '<rect x="0" y="' + n1(g.topH) + '" width="' + g.W + '" height="' + n1(g.clipH) + '" class="ci2-benchtop"/>';
          for(var gy = g.topH + 30; gy < g.H; gy += 46) o += '<path class="ci2-grain" d="M0 ' + gy + 'q' + n1(g.W * 0.3) + ' -6 ' + n1(g.W * 0.6) + ' 2t' + n1(g.W * 0.5) + ' 0"/>';
        }
        // the measuring board behind the plants: a line every 5 cm, numbers in its left column
        var b = g.board;
        o += '<rect class="ci2-board" x="' + n1(b[0]) + '" y="' + n1(b[1]) + '" width="' + n1(b[2]) + '" height="' + n1(b[3]) + '" rx="4"/>';
        o += '<rect class="ci2-rulecol" x="' + n1(b[0]) + '" y="' + n1(b[1]) + '" width="' + g.rw + '" height="' + n1(b[3]) + '" rx="4"/>';
        for(var cm = 1; cm <= RMAX; cm++){
          var y = yH(cm), big = cm % 5 === 0;
          o += '<line class="ci2-rtick' + (big ? ' is-big' : '') + '" x1="' + n1(b[0] + g.rw - (big ? 9 : 5)) + '" x2="' + n1(b[0] + g.rw) + '" y1="' + n1(y) + '" y2="' + n1(y) + '"/>';
          if(big) o += '<line class="ci2-rline" x1="' + n1(b[0] + g.rw) + '" x2="' + n1(b[0] + b[2]) + '" y1="' + n1(y) + '" y2="' + n1(y) + '"/>';
        }
        // the lamps: a bright one over Full light, the same lamp behind a shade cloth over Shade
        [0, 1].forEach(function(i){
          var x = g.tx[i] + g.tw * 0.06, w = g.tw * 0.88, ly = g.lampY, lh = g.lampH;
          o += '<line class="ci2-wire" x1="' + n1(x + 6) + '" x2="' + n1(x + 6) + '" y1="0" y2="' + ly + '"/><line class="ci2-wire" x1="' + n1(x + w - 6) + '" x2="' + n1(x + w - 6) + '" y1="0" y2="' + ly + '"/>';
          o += '<path class="ci2-beam' + (i ? ' is-dim' : '') + '" d="M' + n1(x + 4) + ' ' + n1(ly + lh) + 'L' + n1(x + w - 4) + ' ' + n1(ly + lh) + 'L' + n1(g.tx[i] + g.tw + 2) + ' ' + n1(g.ySoil) + 'L' + n1(g.tx[i] - 2) + ' ' + n1(g.ySoil) + 'Z" fill="url(#ci2-' + (i ? 'dim' : 'sun') + ')"/>';
          o += '<rect class="ci2-lamp" x="' + n1(x) + '" y="' + ly + '" width="' + n1(w) + '" height="' + lh + '" rx="3"/><rect class="ci2-bulb' + (i ? ' is-dim' : '') + '" x="' + n1(x + 3) + '" y="' + n1(ly + lh - 3.5) + '" width="' + n1(w - 6) + '" height="3" rx="1.5"/>';
          if(i) o += '<rect class="ci2-cloth" x="' + n1(x - 3) + '" y="' + n1(ly + lh + 2) + '" width="' + n1(w + 6) + '" height="' + (g.big ? 12 : 9) + '" fill="url(#ci2-mesh)" rx="1.5"/>';
        });
        sDefs.innerHTML = d;
        sStatic.innerHTML = o;
        // the trays' fronts (over the stems' feet) and their names
        var f = '';
        [0, 1].forEach(function(i){
          var x = g.tx[i], w = g.tw, y = g.ySoil - 3;
          f += '<rect class="ci2-soil" x="' + n1(x + 2) + '" y="' + n1(g.ySoil - 2.5) + '" width="' + n1(w - 4) + '" height="5" rx="2" fill="url(#ci2-soil)"/>';
          f += '<path class="ci2-tray" d="M' + n1(x) + ' ' + n1(y) + 'L' + n1(x + w) + ' ' + n1(y) + 'L' + n1(x + w - 4) + ' ' + n1(y + g.trayH) + 'L' + n1(x + 4) + ' ' + n1(y + g.trayH) + 'Z"/><rect class="ci2-rim" x="' + n1(x - 1) + '" y="' + n1(y - 1) + '" width="' + n1(w + 2) + '" height="4" rx="2"/>';
          var nm = GR[i].name, fs = g.big ? 14 : 12.5;
          f += '<text class="ci2-tname is-' + GR[i].id + '" data-lab="tray" x="' + n1(x + w / 2) + '" y="' + n1(y + g.trayH / 2 + fs * 0.42) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(nm) + '</text>';
        });
        // the ruler's numbers (on top, so the soil never hides them)
        for(var c2 = 5; c2 <= RMAX; c2 += 5){ if(!g.big && c2 % 10) continue; var yy = yH(c2); f += '<text class="ci2-rnum" data-lab="rnum" x="' + n1(b[0] + g.rw - 11) + '" y="' + n1(yy + 4) + '" text-anchor="end">' + c2 + '</text>'; }
        f += '<text class="ci2-rnum is-unit" data-lab="rnum" x="' + n1(b[0] + g.rw / 2 - 1) + '" y="' + n1(b[1] + 13) + '" text-anchor="middle">cm</text>';
        // the clipboard: board, clip, paper, axes, title
        var c = g.cb;
        f += '<rect class="ci2-cbshadow" x="' + n1(c.x + 4) + '" y="' + n1(c.y + 6) + '" width="' + n1(c.w) + '" height="' + n1(c.h) + '" rx="10"/>';
        f += '<rect class="ci2-cb" x="' + n1(c.x) + '" y="' + n1(c.y) + '" width="' + n1(c.w) + '" height="' + n1(c.h) + '" rx="10"/>';
        f += '<rect class="ci2-paper" x="' + n1(c.px) + '" y="' + n1(c.py) + '" width="' + n1(c.pw) + '" height="' + n1(c.ph) + '" rx="3"/>';
        var cw = Math.min(110, c.w * 0.36);
        f += '<rect class="ci2-clip" x="' + n1(c.x + c.w / 2 - cw / 2) + '" y="' + n1(c.y + 4) + '" width="' + n1(cw) + '" height="' + (g.big ? 30 : 24) + '" rx="6"/><rect class="ci2-clip-hi" x="' + n1(c.x + c.w / 2 - cw / 2 + 8) + '" y="' + n1(c.y + 9) + '" width="' + n1(cw - 16) + '" height="4" rx="2"/>';
        var title = 'Mean height ± 2 SE';
        f += '<text class="ci2-ctitle" data-lab="ctitle" x="' + n1(c.px + c.pw / 2) + '" y="' + n1(c.py + (g.big ? 44 : 28)) + '" text-anchor="middle" style="font-size:' + c.fs + 'px">' + esc(title) + '</text>';
        for(var v = 0; v <= AMAX; v += 5){
          f += '<line class="ci2-grid" x1="' + n1(c.l) + '" x2="' + n1(c.r) + '" y1="' + n1(yA(v)) + '" y2="' + n1(yA(v)) + '"/>';
          f += '<text class="ci2-tick" data-lab="tick" x="' + n1(c.l - 6) + '" y="' + n1(yA(v) + 4) + '" text-anchor="end">' + v + '</text>';
        }
        f += '<text class="ci2-tick is-unit" data-lab="tick" x="' + n1(c.l - 6) + '" y="' + n1(c.t - 15) + '" text-anchor="end">cm</text>';
        f += '<line class="ci2-axis" x1="' + n1(c.l) + '" x2="' + n1(c.l) + '" y1="' + n1(c.t - 4) + '" y2="' + n1(c.b) + '"/><line class="ci2-axis" x1="' + n1(c.l) + '" x2="' + n1(c.r) + '" y1="' + n1(c.b) + '" y2="' + n1(c.b) + '"/>';
        [0, 1].forEach(function(i){ f += '<text class="ci2-bname is-' + GR[i].id + '" data-lab="bname" x="' + n1(c.cx[i]) + '" y="' + n1(c.b + 18) + '" text-anchor="middle">' + esc(GR[i].name) + '</text>'; });
        sFront.innerHTML = f;
        // the live parts: mean lines, bars, error bars, the band and their labels (built once per layout)
        sLive.innerHTML = '';
        E = {};
        E.ml = [0, 1].map(function(i){ return { halo: mk('line', 'ci2-mhalo', null, sLive), line: mk('line', 'ci2-mline is-' + GR[i].id, null, sLive) }; });
        E.bar = [0, 1].map(function(i){ return mk('rect', 'ci2-bar is-' + GR[i].id, null, sLive); });
        E.band = mk('rect', 'ci2-band', null, sLive);   // over the bars, under the error bars
        E.err = [0, 1].map(function(){ return mk('path', 'ci2-err', null, sLive); });
        sLabs.innerHTML = '';
        E.pMean = pill('ci2-pill is-sun', 'mean');
        E.pBand = pill('ci2-pill is-band', 'band');
        // each ± beside its error bar's top cap, on the outer side (the middle is the band's)
        E.pE = [0, 1].map(function(i){ return mk('text', 'ci2-elab is-' + GR[i].id, { 'text-anchor': i ? 'start' : 'end', 'data-lab': 'elab' }, sLabs); });
        E.nl = [0, 1].map(function(i){ return mk('text', 'ci2-nlab', { 'text-anchor': 'middle', 'data-lab': 'nlab', x: n1(G.cb.cx[i]), y: n1(G.cb.b + (G.big ? 43 : 41)) }, sLabs); });
      }
      var E = {}, LF = { v: null, tw: null };   // the leaf size, tweened when the number of plants changes
      function pill(cls, lab){
        var g = mk('g', cls, { 'data-lab': lab }, sLabs), r = mk('rect', null, { rx: 9 }, g), t = mk('text', null, { 'text-anchor': 'middle' }, g);
        var o = { g: g, r: r, t: t, s: null,
          set: function(s, x, y, anchor){
            var fs = G.big ? 13 : 12, w = tw(s, fs, 800) + 14, h = fs + 9, x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
            g.style.display = '';
            if(o.s !== s){ o.s = s; t.textContent = s; t.style.fontSize = fs + 'px'; }
            at(r, { x: x0, y: y - h / 2, width: w, height: h }); at(t, { x: x0 + w / 2, y: y + fs * 0.36 });
            o.box = [x0, y - h / 2, x0 + w, y + h / 2];
          },
          hide: function(){ g.style.display = 'none'; o.box = null; } };
        return o;
      }

      /* ---------------------------------------------------- the plants: one group each, the stem and the top set per frame */
      var LEAF = '<path class="ci2-lf" d="M0 0C.18-.5.82-.56 1 0C.82.5.18.46 0 0Z"/><path class="ci2-rib" d="M.06 0L.9 0"/>';
      function plantEl(p){
        var e = document.createElementNS(NS, 'g');
        e.setAttribute('class', 'ci2-pl' + (p.g ? ' is-shade' : ''));
        e.innerHTML = '<path class="ci2-stem"/><g class="ci2-cot"><ellipse class="ci2-cotl" cx="-2.2" cy="0" rx="2.6" ry="1.7"/><ellipse class="ci2-cotl" cx="2.2" cy="0" rx="2.6" ry="1.7"/></g><g class="ci2-top"><g transform="rotate(144)">' + LEAF + '</g><g transform="rotate(36)">' + LEAF + '</g><circle class="ci2-bud" r=".16"/></g>';
        p.el = e; p.stem = e.querySelector('.ci2-stem'); p.cot = e.querySelector('.ci2-cot'); p.top = e.querySelector('.ci2-top');
        p.sway = ((((p.id * 37) % 9) - 4) * 0.7);
        p._c = {};
        gPl[p.g].appendChild(e);
        return e;
      }
      function setA(p, k, e, name, v){ if(p._c[k] !== v){ p._c[k] = v; e.setAttribute(name, v); } }
      function paintPlant(p){
        var hp = Math.max(0, p.h) * G.k, x = plantX(p.g, p.x);
        setA(p, 'tr', p.el, 'transform', 'translate(' + n1(x) + ' ' + n1(G.ySoil) + ')');
        var op = p.op < 0.999 ? String(Math.round(p.op * 100) / 100) : '1';
        if(p._c.op !== op){ p._c.op = op; p.el.style.opacity = op === '1' ? '' : op; }
        p.el.setAttribute('data-st', p.st);
        if(hp < 0.4){ setA(p, 'd', p.stem, 'd', ''); setA(p, 'tv', p.top, 'visibility', 'hidden'); setA(p, 'cv', p.cot, 'visibility', 'hidden'); return; }
        var sw = p.sway * Math.min(1, hp / 50), L = G.leaf * (0.45 + 0.55 * Math.min(1, p.h / 6));
        // the stem's tip is exactly the plant's height above the soil
        setA(p, 'd', p.stem, 'd', 'M0 0Q' + n1(sw * 0.6) + ' ' + n1(-hp * 0.5) + ' ' + n1(sw) + ' ' + n1(-hp));
        setA(p, 'tv', p.top, 'visibility', 'visible');
        setA(p, 't', p.top, 'transform', 'translate(' + n1(sw) + ' ' + n1(-hp) + ') scale(' + n1(L) + ')');
        var f = 0.24, cx = 2 * (1 - f) * f * sw * 0.6 + f * f * sw;
        setA(p, 'cv', p.cot, 'visibility', p.h > 3 ? 'visible' : 'hidden');
        setA(p, 'c', p.cot, 'transform', 'translate(' + n1(cx) + ' ' + n1(-hp * f) + ') scale(' + n1(Math.min(1.25, G.leaf / 9)) + ')');
      }
      function active(g){ return P[g].filter(function(p){ return p.st !== 'leave'; }); }
      function counted(g){ return P[g].filter(function(p){ return p.st === 'grown'; }); }
      function target(p){ return Mo[p.g].m + Mo[p.g].s * p.z; }

      /* ---------------------------------------------------- tweens */
      function twn(p, key, to, dur, delay){
        if(calm() || !dur){ p[key] = to; delete p.tw[key]; return; }
        if(Math.abs(p[key] - to) < 1e-9 && !p.tw[key]){ return; }
        p.tw[key] = { from: p[key], to: to, t0: now() + (delay || 0), dur: dur };
      }
      function busy(){ if(LF.tw) return true; for(var g = 0; g < 2; g++) for(var i = 0; i < P[g].length; i++){ var p = P[g][i]; if(p.st !== 'grown') return true; for(var k in p.tw) return true; } return false; }
      var raf = 0;
      // repaint now (a change just began): the plants' states and every label read from them stay in step
      function paintAll(){ if(!G) return; P.forEach(function(a){ a.forEach(function(p){ if(p.el) paintPlant(p); }); }); paint(); }
      function kick(){ if(calm()){ if(raf){ cancelAnimationFrame(raf); raf = 0; } frame(); fade(); return; } if(!raf) raf = requestAnimationFrame(frame); }
      function fade(){ sceneBox.classList.remove('is-fade'); void sceneBox.offsetWidth; sceneBox.classList.add('is-fade'); }
      function step(p, t){
        for(var k in p.tw){
          var w = p.tw[k]; if(t < w.t0) continue;
          var f = clamp((t - w.t0) / w.dur, 0, 1);
          p[k] = w.from + (w.to - w.from) * ease(f);
          if(f >= 1){ p[k] = w.to; delete p.tw[k]; }
        }
        if(p.st === 'sprout' && !p.tw.h) p.st = 'grown';
      }
      function frame(){
        raf = 0;
        var t = now();
        if(LF.tw){ var lf = clamp((t - LF.tw.t0) / LF.tw.dur, 0, 1); LF.v = LF.tw.from + (LF.tw.to - LF.tw.from) * ease(lf); if(lf >= 1){ LF.v = LF.tw.to; LF.tw = null; } if(G) G.leaf = LF.v; }
        for(var g = 0; g < 2; g++){
          for(var i = P[g].length - 1; i >= 0; i--){
            var p = P[g][i]; step(p, t);
            if(p.st === 'leave' && !p.tw.op && !p.tw.h){ if(p.el) p.el.remove(); P[g].splice(i, 1); continue; }
            if(G) paintPlant(p);
          }
        }
        paint();
        if(busy() && !calm()) raf = requestAnimationFrame(frame);
        else settled();
      }
      // finish every change at once (leaving the stage, a new change on top of one still playing)
      function stopAll(){
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        if(LF.tw){ LF.v = LF.tw.to; LF.tw = null; if(G) G.leaf = LF.v; }
        for(var g = 0; g < 2; g++){
          for(var i = P[g].length - 1; i >= 0; i--){
            var p = P[g][i];
            for(var k in p.tw){ p[k] = p.tw[k].to; } p.tw = {};
            if(p.st === 'leave'){ if(p.el) p.el.remove(); P[g].splice(i, 1); continue; }
            p.st = 'grown';
            if(G) paintPlant(p);
          }
        }
        if(G) paint();
      }

      /* ---------------------------------------------------- changes to the model, each shown */
      // the tallest shade plant carries the spread knob: keep it away from the tray's ends (the mean knob is at the right)
      function arrange(g, list){
        if(g !== 1 || list.length < 5) return list;
        var mi = 0; list.forEach(function(s, i){ if(s.z > list[mi].z) mi = i; });
        if(mi === 0 || mi >= list.length - 2){ var mid = Math.floor(list.length / 2), tmp = list[mid]; list[mid] = list[mi]; list[mi] = tmp; }
        return list;
      }
      /* slots: the final order, each { p: an existing plant or null, z }; the others leave */
      function morph(g, slots, o){
        o = o || {};
        var n = slots.length, keep = slots.map(function(s){ return s.p; }), T0 = now();
        P[g].forEach(function(p){ if(p.st !== 'leave' && keep.indexOf(p) < 0){ p.st = 'leave'; twn(p, 'op', 0, 420); twn(p, 'h', 0, 420); if(calm()){ p.op = 0; p.h = 0; } } });
        slots.forEach(function(s, i){
          var fx = (i + 0.5) / n, p = s.p;
          if(!p){
            p = { g: g, id: ++uid, z: s.z, h: 0, x: fx, op: 1, st: 'sprout', tw: {} };
            P[g].push(p); if(G) plantEl(p);
            // a group of new plants sprouts together and is counted together (it keeps the tray's mean and SD)
            var dl = s.grp != null ? GD * s.grp : (o.stagger || 45) * i;
            twn(p, 'h', target(p), 620, dl);
            if(p.tw.h) p.tw.h.t0 = T0 + dl;   // one clock for the whole change: a group finishes on the same frame
            if(calm()){ p.h = target(p); p.st = 'grown'; }
          } else {
            p.z = s.z;
            twn(p, 'x', fx, 380);
            twn(p, 'h', target(p), o.dur || 420, o.wave ? 22 * i : 0);
          }
        });
      }
      var GD = 380;   // ms between two groups of new plants
      /* n values with mean 0 and Σz² = n (population SD 1), none beyond ±2.2: a group that keeps a standardized set standardized */
      function zpop(n, r){
        if(n === 1) return [0];
        for(var t = 0; t < 80; t++){
          var a = [], sm = 0, q = 0, i;
          for(i = 0; i < n; i++){ a.push(r.normal(0, 1)); sm += a[i]; }
          var m = sm / n; for(i = 0; i < n; i++) q += (a[i] - m) * (a[i] - m);
          var sd = Math.sqrt(q / n); a = a.map(function(v){ return (v - m) / sd; });
          if(a.every(function(v){ return Math.abs(v) <= 2.2; })) return a;
        }
        return a;
      }
      /* the indices of n values out of zs whose mean is nearest 0 and SD (n − 1) nearest 1 (every subset is tried) */
      function bestSubset(zs, n){
        var k = zs.length, best = null, bs = Infinity, pick = [];
        (function rec(start, d, S, Q){
          if(d === n){ var m = S / n, sd = Math.sqrt(Math.max(0, (Q - n * m * m) / (n - 1))), sc = Math.abs(m) + Math.abs(sd - 1); if(sc < bs){ bs = sc; best = pick.slice(); } return; }
          for(var i = start; i <= k - (n - d); i++){ pick.push(i); rec(i + 1, d + 1, S + zs[i], Q + zs[i] * zs[i]); pick.pop(); }
        })(0, 0, 0, 0);
        return best;
      }
      function heightsOk(g, zs, m, s){ return zs.every(function(z){ var h = m + s * z; return h >= HLO && h <= HHI; }); }
      function restd(zs){ var st = statsOf(zs); return zs.map(function(z){ return (z - st.mean) / st.sd; }); }
      function setN(n, user){
        if(n === St.n) return;
        stopAll();
        var from = St.n; St.n = n;
        [0, 1].forEach(function(g){
          var a = active(g), k = a.length, slots;
          if(n > k){
            // new plants come in groups, each with mean 0 and Σz² equal to its size: the tray keeps its mean and SD
            // exactly as each group is counted, so only n changes, on every frame
            var j = n - k, ng = Math.max(1, Math.round(j / 5)), sizes = [], left = j;
            for(var gi = 0; gi < ng; gi++){ var sz = Math.round(left / (ng - gi)); sizes.push(sz); left -= sz; }
            var groups = sizes.map(function(sz){ var u = null; for(var t = 0; t < 60; t++){ u = zpop(sz, M.rng(7919 + 131 * (++draws))); if(heightsOk(g, u, Mo[g].m, Mo[g].s)) break; } return u; });
            slots = new Array(n);
            a.forEach(function(p, i){ slots[Math.min(n - 1, Math.round((i + 0.5) * n / k - 0.5))] = { p: p, z: p.z }; });
            var q = 0, used = sizes.map(function(){ return 0; });
            for(var i = 0; i < n; i++) if(!slots[i]){ var gq = q % ng; while(used[gq] >= sizes[gq]) gq = (gq + 1) % ng; slots[i] = { p: null, z: groups[gq][used[gq]++], grp: gq }; q++; }
            St.sprout = (ng - 1) * GD + 620;
          } else {
            // the kept plants: the subset whose mean and SD are already closest to the tray's, so none jumps
            var best = bestSubset(a.map(function(p){ return p.z; }), n);
            var ks = best.map(function(i){ return a[i]; }), zs = restd(ks.map(function(p){ return p.z; }));
            slots = ks.map(function(p, i){ return { p: p, z: zs[i] }; });
            St.sprout = 420;
          }
          morph(g, arrange(g, slots));
        });
        lastAct = { kind: 'n', from: from, to: n, was: verdictNow() };
        paintN(); paintAll();
        kick();
      }
      function newSample(){
        stopAll();
        var was = verdictNow();
        [0, 1].forEach(function(g){
          var n = active(g).length, mo = Mo[g], r = M.rng(4099 + 977 * (++draws) + g), m = mo.mu, s = mo.sig, zs = null;
          for(var t = 0; t < 60; t++){
            var raw = []; for(var i = 0; i < n; i++) raw.push(r.normal(mo.mu, mo.sig));
            var st = statsOf(raw);
            m = clamp(r1(st.mean), EX.meanRange[0], EX.meanRange[1]); s = clamp(r1(st.sd), EX.sdRange[0], EX.sdRange[1]);
            zs = raw.map(function(v){ return (v - st.mean) / st.sd; });
            if(zs.every(function(z){ return Math.abs(z) <= 2.2; }) && heightsOk(g, zs, m, s)) break;
          }
          mo.m = m; mo.s = s;
          var a = active(g), list = arrange(g, zs.map(function(z){ return { z: z }; }));
          // the new heights go to the plants where they stand (the tallest shade plant away from the ends)
          morph(g, a.map(function(p, i){ return { p: p, z: list[i].z }; }), { dur: 700, wave: true });
        });
        lastAct = { kind: 'sample', was: was, n: St.n };
        hMean.value(Mo[1].m); hSd.value(Mo[1].s); hMean.before(null); paintAll();
        kick();
      }
      function zRange(g){ var a = active(g), lo = 0, hi = 0; a.forEach(function(p){ lo = Math.min(lo, p.z); hi = Math.max(hi, p.z); }); return [lo, hi]; }
      function meanLim(){ var z = zRange(1), s = Mo[1].s; return [Math.max(EX.meanRange[0], r1(HLO - s * z[0] + 0.05)), Math.min(EX.meanRange[1], r1(HHI - s * z[1] - 0.05))]; }
      function sdLim(){ var z = zRange(1), m = Mo[1].m; return [EX.sdRange[0], Math.min(EX.sdRange[1], Math.floor(Math.min((HHI - m) / Math.max(z[1], 1e-6), (m - HLO) / Math.max(-z[0], 1e-6)) * 10) / 10)]; }
      function retarget(g, dur){
        P[g].forEach(function(p){
          if(p.st === 'leave') return;
          var t = target(p);
          if(p.st === 'sprout' && p.tw.h){ p.tw.h.to = t; return; }
          if(!dur){ p.h = t; delete p.tw.h; } else twn(p, 'h', t, dur);
        });
      }
      function setMean(v, drag){ var lim = meanLim(); v = clamp(r1(v), lim[0], lim[1]); Mo[1].m = v; Mo[1].mu = v; retarget(1, drag ? 0 : 240); if(hMean.value() !== v) hMean.value(v); kick(); }
      function setSd(v, drag){ var lim = sdLim(); v = clamp(r1(v), lim[0], lim[1]); Mo[1].s = v; Mo[1].sig = v; retarget(1, drag ? 0 : 240); if(hSd.value() !== v) hSd.value(v); kick(); }
      function paintN(){ nBtns.forEach(function(b){ b.setAttribute('aria-pressed', String(+b.getAttribute('data-n') === St.n)); }); }

      /* ---------------------------------------------------- the knobs on the picture */
      function tallest(){ var a = counted(1).length ? counted(1) : active(1), best = null; a.forEach(function(p){ if(!best || p.h > best.h) best = p; }); return best; }
      var drawn = [null, null];   // what is drawn this frame: the stats of the counted plants
      var hMean = K.handle(layer, { key: 'ci2-mean', chip: false, label: 'Mean height of the shade plants (cm)', value: Mo[1].m, min: EX.meanRange[0], max: EX.meanRange[1], step: 0.1,
        at: function(){ return G && drawn[1] && isFinite(drawn[1].mean) ? [G.knobX, yH(drawn[1].mean)] : [NaN, NaN]; },
        pick: function(x, y){ var v = r1((G.ySoil - y) / G.k), lim = meanLim(); return clamp(v, lim[0], lim[1]); },
        dir: function(){ return 90; },
        keys: function(v, key, big){ var st = big ? 1 : 0.1, lim = meanLim(); if(key === 'ArrowUp' || key === 'ArrowRight') return clamp(r1(v + st), lim[0], lim[1]); if(key === 'ArrowDown' || key === 'ArrowLeft') return clamp(r1(v - st), lim[0], lim[1]); if(key === 'PageUp') return clamp(r1(v + 1), lim[0], lim[1]); if(key === 'PageDown') return clamp(r1(v - 1), lim[0], lim[1]); if(key === 'Home') return lim[0]; if(key === 'End') return lim[1]; return null; },
        valuetext: function(){ var d = drawn[1]; return d && isFinite(d.mean) ? 'Shade plants, mean ' + F(r1(d.mean), 1) + ' ' + U : ''; },
        tag: function(){ var d = drawn[1]; return d && isFinite(d.mean) ? 'mean ' + F(r1(d.mean), 1) + ' ' + U : ''; }, tagSide: function(){ var d = drawn[1]; return G && d && isFinite(d.mean) && yH(d.mean) + 62 > G.ySoil - 3 ? 'left' : 'down'; },
        bounds: function(){ return G ? [G.tx[1], 0, G.W - 4, G.H] : null; },
        onStart: function(v){ hideCue(true); tourDid('mean'); if(before == null){ before = v; } lastAct = { kind: 'mean', was: verdictNow() }; },
        onEnd: function(){ kick(); },
        onInput: function(v){ var dr = hMean.dragging(); setMean(v, dr); if(before != null) hMean.before(before); } });
      hMean.el.classList.add('ci2-hmean');
      var hSd = K.handle(layer, { key: 'ci2-sd', quiet: true, label: 'Spread of the shade plants, the SD (cm): drag the tallest plant', value: Mo[1].s, min: EX.sdRange[0], max: EX.sdRange[1], step: 0.1,
        at: function(){ var p = G && tallest(); return p ? [plantX(1, p.x) + p.sway * Math.min(1, p.h * G.k / 50), yH(p.h)] : [NaN, NaN]; },
        pick: function(x, y){ var p = tallest(); if(!p || p.z < 0.2) return null; var top = (G.ySoil - y) / G.k, lim = sdLim(); return clamp(r1((top - Mo[1].m) / p.z), lim[0], lim[1]); },
        dir: function(){ return 90; },
        keys: function(v, key, big){ var st = big ? 0.5 : 0.1, lim = sdLim(); if(key === 'ArrowUp' || key === 'ArrowRight' || key === 'PageUp') return clamp(r1(v + (key === 'PageUp' ? 0.5 : st)), lim[0], lim[1]); if(key === 'ArrowDown' || key === 'ArrowLeft' || key === 'PageDown') return clamp(r1(v - (key === 'PageDown' ? 0.5 : st)), lim[0], lim[1]); if(key === 'Home') return lim[0]; if(key === 'End') return lim[1]; return null; },
        valuetext: function(){ var d = drawn[1]; return d && isFinite(d.sd) ? 'Shade plants, SD ' + F(r1(d.sd), 1) + ' ' + U : ''; },
        tag: function(){ var d = drawn[1]; if(cue && cue.active()) return ''; return d && isFinite(d.sd) ? 'SD ' + F(r1(d.sd), 1) + ' ' + U + (Mo[1].s >= sdLim()[1] - 1e-9 ? ' (max)' : '') : ''; }, tagSide: function(){ return 'up'; },
        bounds: function(){ return G ? [G.tx[1] - 8, 0, G.W - 4, G.H] : null; },
        onStart: function(){ hideCue(true); lastAct = { kind: 'sd', was: verdictNow() }; },
        onEnd: function(){ kick(); },
        onInput: function(v){ setSd(v, hSd.dragging()); } });
      hSd.el.classList.add('ci2-hsd');

      /* ---------------------------------------------------- paint: everything read from the plants as drawn */
      function verdictOf(a, b){
        if(!a || !b || !(a.n > 1) || !(b.n > 1)) return null;
        var A = { m: r1(a.mean), e: r1(a.e2), x: a }, Bq = { m: r1(b.mean), e: r1(b.e2), x: b };
        var lo = A.m <= Bq.m ? A : Bq, up = lo === A ? Bq : A;
        // the overlap from the numbers as shown (each to 0.1), so the cause line adds up
        var ov = Math.round(((lo.m + lo.e) - (up.m - up.e)) * 10) / 10;
        return { lo: lo, up: up, diff: Math.round((up.m - lo.m) * 10) / 10, ov: ov, kind: ov > 0 ? 'ov' : ov < 0 ? 'gap' : 'touch', loI: lo === A ? 0 : 1 };
      }
      function verdictNow(){ return lastV ? lastV.kind : null; }
      var lastV = null;
      function paint(){
        if(!G) return;
        var c = G.cb;
        drawn = [0, 1].map(function(g){ return statsOf(counted(g).map(function(p){ return p.h; })); });
        [0, 1].forEach(function(g){
          var d = drawn[g], ok = d.n > 0, y = ok ? yH(d.mean) : 0, x0 = G.tx[g] + 2, x1 = G.tx[g] + G.tw - 2 + (g ? 8 : 0);
          var ml = E.ml[g]; ml.line.style.display = ml.halo.style.display = ok ? '' : 'none';
          if(ok){ at(ml.halo, { x1: x0, x2: x1, y1: y, y2: y }); at(ml.line, { x1: x0, x2: x1, y1: y, y2: y }); }
          // the bar and its error bar on the clipboard
          var bar = E.bar[g], er = E.err[g], cx = c.cx[g];
          if(ok){ var yt = yA(d.mean); at(bar, { x: cx - c.bw / 2, y: yt, width: c.bw, height: Math.max(0, c.b - yt) }); bar.style.display = ''; } else bar.style.display = 'none';
          if(d.n > 1){
            var ylo = yA(d.mean - d.e2), yhi = yA(d.mean + d.e2), cp = c.cap / 2;
            at(er, { d: 'M' + n1(cx) + ' ' + n1(yhi) + 'V' + n1(ylo) + 'M' + n1(cx - cp) + ' ' + n1(yhi) + 'h' + n1(c.cap) + 'M' + n1(cx - cp) + ' ' + n1(ylo) + 'h' + n1(c.cap) });
            er.style.display = '';
            var et = E.pE[g]; txt(et, '±' + F(r1(d.e2), 1)); at(et, { x: g ? cx + cp + 5 : cx - cp - 5, y: yhi + 4.5 }); et.style.display = '';
          } else { er.style.display = 'none'; E.pE[g].style.display = 'none'; }
          txt(E.nl[g], 'n = ' + d.n);
        });
        // the full light tray's mean, on a pill under its line, at its left end
        var d0 = drawn[0];
        if(d0.n > 0) E.pMean.set('mean ' + F(r1(d0.mean), 1) + ' ' + U, G.tx[0] + 5, yH(d0.mean) + (G.big ? 17 : 15), 'start'); else E.pMean.hide();
        // the overlap or the gap between the two error bars
        var V = verdictOf(drawn[0], drawn[1]); lastV = V;
        stage.setAttribute('data-v', V ? V.kind : '');
        if(V){
          var loHi = V.lo.x.mean + V.lo.x.e2, upLo = V.up.x.mean - V.up.x.e2, ya = yA(Math.max(loHi, upLo)), yb = yA(Math.min(loHi, upLo));
          if(V.kind === 'touch' || yb - ya < 1.5){ var ym = (ya + yb) / 2; ya = ym - 1; yb = ym + 1; }
          var bx0 = c.cx[0], bx1 = c.cx[1];   // from one bar's center to the other's
          at(E.band, { x: bx0, y: ya, width: bx1 - bx0, height: yb - ya, 'class': 'ci2-band is-' + V.kind }); E.band.style.display = '';
          E.pBand.g.setAttribute('class', 'ci2-pill is-' + V.kind);
          // the band's word: on the band, or just under or over it when a ± label is in the way (4 px clear)
          var word = V.kind === 'ov' ? 'overlap' : V.kind === 'gap' ? 'gap' : 'touch', fsb = G.big ? 13 : 12, wb = tw(word, fsb, 800) + 14, hb = fsb + 9, mx = (bx0 + bx1) / 2;
          var boxes = [0, 1].map(function(g){ var d = drawn[g]; if(!(d.n > 1)) return null; var yy = yA(d.mean + d.e2) + 4.5, w2 = tw('±' + F(r1(d.e2), 1), 12.5, 900), x0 = g ? c.cx[g] + c.cap / 2 + 5 : c.cx[g] - c.cap / 2 - 5 - w2; return [x0, yy - 13, x0 + w2, yy + 4]; });
          // a band too thin for the word gets it just over or under it, never on it
          var cands = (yb - ya >= hb + 8 ? [(ya + yb) / 2] : []).concat([ya - hb / 2 - 4, yb + hb / 2 + 4]), yw = cands[0];
          for(var ci = 0; ci < cands.length; ci++){
            var bb = [mx - wb / 2 - 4, cands[ci] - hb / 2 - 4, mx + wb / 2 + 4, cands[ci] + hb / 2 + 4];
            if(!boxes.some(function(q){ return q && q[0] < bb[2] && q[2] > bb[0] && q[1] < bb[3] && q[3] > bb[1]; })){ yw = cands[ci]; break; }
          }
          E.pBand.set(word, mx, yw, 'middle');
        } else { E.band.style.display = 'none'; E.pBand.hide(); }
        paintCause(V);
        hMean.place(); hSd.place();
        if(cue.active()) cue.place();
      }
      function paintCause(V){
        if(cause.el.classList.contains('is-take') && busy()) cause.take(null);
        if(cause.el.classList.contains('is-take')) return;
        if(!V){ cause.set([{ t: 'Growing', role: 'diff' }]); return; }
        var d = { t: 'means ' + F(V.diff, 1) + ' ' + U + ' apart', role: 'diff', say: 'The means are ' + F(V.diff, 1) + ' ' + U + ' apart' };
        if(V.kind === 'ov') cause.set([d, { t: 'bars overlap by ' + F(V.ov, 1) + ' ' + U, role: 'ov', say: 'the error bars overlap by ' + F(V.ov, 1) + ' ' + U }, { t: 'may be chance', role: 'ov', say: 'the difference may be due to chance' }]);
        else if(V.kind === 'gap') cause.set([d, { t: 'bars ' + F(-V.ov, 1) + ' ' + U + ' apart', role: 'gap', say: 'the error bars are ' + F(-V.ov, 1) + ' ' + U + ' apart' }, { t: 'unlikely to be chance', role: 'gap', say: 'the difference is unlikely to be due to chance' }]);
        // just touching is still no overlap (here p is about 0.02): by the rule, unlikely to be chance
        else cause.set([d, { t: 'bars just touch', role: 'touch', say: 'the error bars just touch, with no overlap' }, { t: 'unlikely to be chance', role: 'gap', say: 'the difference is unlikely to be due to chance' }]);
      }

      /* ---------------------------------------------------- settled: takeaways, challenges, live text, "?" */
      function settled(){
        if(busy() || !G) return;
        var V = lastV, msg = cause.text(), take = null, a = lastAct;
        if(a && V && St.mode === 'explore'){
          if(a.kind === 'n' && a.to === 4 * a.from) take = 'Four times the plants, half the bar: SE\u00a0=\u00a0SD\u00a0÷\u00a0√n.';
          else if(a.kind === 'n' && a.was === 'ov' && V.kind !== 'ov') take = 'More plants made the bars shorter, so the real difference shows.';
          else if(a.kind === 'sample') take = St.n <= COUNTS[0] ? 'With ' + St.n + ' plants a tray, chance alone moves the means a lot.' : St.n >= COUNTS[COUNTS.length - 1] ? 'With ' + St.n + ' plants a tray, a new sample moves the means much less.' : null;
          else if(a.kind === 'sd' && a.was && a.was !== 'ov' && V.kind === 'ov') take = 'More spread, longer bars: the same difference is harder to see.';
        }
        if(take){ cause.take(take); msg += ' ' + take; }
        if(a && V){
          goal('gap', a.kind === 'n' && V.kind !== 'ov' && Mo[0].m === GR[0].mean && Mo[1].m === GR[1].mean, 'With ' + St.n + ' plants a tray the bars are <b>' + (V.ov < 0 ? F(-V.ov, 1) + ' ' + esc(U) + ' apart' : 'just touching') + '</b>: the same means, but shorter bars, so the difference is <b>unlikely to be chance</b>.');
          goal('sd', a.kind === 'sd' && V.kind === 'ov', 'SD ' + F(Mo[1].s, 1) + ' ' + esc(U) + ': more spread makes the Shade bar longer, and the bars <b>overlap</b> again.');
          if(a.kind === 'n' && a.to === 4 * a.from){ var s = Mo[1].s; goal('four', true, a.from + ' to ' + a.to + ' plants, <b>four times</b> as many: the Shade bar went from ±' + F(r1(2 * s / Math.sqrt(a.from)), 1) + ' to <b>±' + F(r1(2 * s / Math.sqrt(a.to)), 1) + '</b>, half as long, because SE = SD ÷ √n.'); }
          goal('flip', a.kind === 'sample' && St.n === COUNTS[0] && a.was && (a.was === 'ov') !== (V.kind === 'ov'), 'Same trays, new plants, and the verdict changed to <b>' + (V.kind === 'gap' ? 'bars apart' : V.kind === 'ov' ? 'bars overlap' : 'bars just touch') + '</b>. With 5 plants, chance alone can do that.');
        }
        say(msg);
        refHtml();
      }

      /* ---------------------------------------------------- the first visit cue and "Show me how" */
      // the cue sits on the empty board above the shade plants, pointing down at the knob: never on a plant or the line
      var cue = K.cue(layer, { key: 'apbio-ci', text: EX.cue, side: 'above', at: function(){ var t = tallest(); if(!G || !t) return [0, 0]; var half = tw(EX.cue, 15, 800) / 2 + 34, lim = (G.wide ? G.cb.x + 20 : G.W - 4) - half; return [Math.min(G.knobX, lim), yH(t.h) - 6]; } });   // on wide stages it stops short of the clipboard
      function hideCue(used){ if(cue.active()){ cue.hide(used); hSd.place(); } }
      var tour = K.tour({ key: 'apbio-ci', label: 'Show me how', steps: [
        { id: 'mean', text: 'Drag the knob: every shade plant grows or shrinks. Their mean is the blue bar on the clipboard.', target: function(){ return hMean.knob; } },
        { id: 'clip', text: 'Each error bar reaches 2 SE above and below the mean. Overlap: the difference may be chance.', target: function(){ var r = sceneBox.getBoundingClientRect(); return G ? { left: r.left + G.cb.x, top: r.top + G.cb.y, width: G.cb.w, height: G.cb.h, right: r.left + G.cb.x + G.cb.w, bottom: r.top + G.cb.y + G.cb.h } : sceneBox; } },
        { id: 'n', text: 'More plants make the bars shorter, so a small real difference can show.', target: function(){ return acts.querySelector('.ci2-n'); } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      function tourDid(id){ if(tour.active()) tour.did(id); }
      function startTour(){ if(St.mode !== 'explore') return; hideCue(false); tour.start(true); }

      /* ---------------------------------------------------- "?": the numbers worked out */
      var ref = document.createElement('div'); ref.className = 'ci2-ref';
      ref.innerHTML = '<p class="ci2-ref-how"><button type="button" class="tk2-how ci2-ref-tour">Show me how</button></p><div class="ci2-ref-live"></div>' + EX.refHtml;
      ref.querySelector('.ci2-ref-tour').addEventListener('click', function(){ if(St.mode !== 'explore') return; var x = document.querySelector('.ls-sheet-x, .ls-sheet .ls-x'); if(x) x.click(); setTimeout(startTour, 60); });
      var refLive = ref.querySelector('.ci2-ref-live');
      function refHtml(){
        var V = lastV; if(!V) return;
        var rows = [0, 1].map(function(g){ var d = drawn[g], se = d.sd / Math.sqrt(d.n), m = r1(d.mean), e = r1(d.e2); return '<tr><th scope="row">' + esc(GR[g].name) + '</th><td>' + d.n + '</td><td>' + F(m, 1) + '</td><td>' + F(r1(d.sd), 1) + '</td><td>' + F(r1(d.sd), 1) + ' ÷ ' + F(Math.sqrt(d.n), 2) + ' = ' + F(se, 2) + '</td><td>' + F(m, 1) + ' ± ' + F(e, 1) + ' = ' + F(r1(m - e), 1) + ' to ' + F(r1(m + e), 1) + '</td></tr>'; }).join('');
        refLive.innerHTML = '<h3>This picture, worked out</h3><div class="bt-tablewrap"><table class="ci2-tab"><thead><tr><th scope="col">Tray</th><th scope="col">n</th><th scope="col">Mean (' + esc(U) + ')</th><th scope="col">SD</th><th scope="col">SE = SD ÷ √n</th><th scope="col">95% CI ≈ mean ± 2 SE</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '<p>' + (V.kind === 'ov' ? 'The error bars overlap by ' + F(V.ov, 1) + ' ' + esc(U) + '. By the course’s rule the data do not show a difference: it may be due to chance. (A formal test can still find one when bars overlap a little; see “Strictly speaking”.)' : V.kind === 'gap' ? 'The error bars are ' + F(-V.ov, 1) + ' ' + esc(U) + ' apart, so the difference is unlikely to be due to chance: it is likely a real difference.' : 'The error bars just touch: there is no overlap, so by the rule the difference is unlikely to be due to chance (bars like these that just touch give p of about 0.01 to 0.02).') + '</p>';
      }

      /* ---------------------------------------------------- Test yourself, "Challenges" */
      var dock = document.createElement('div'); dock.className = 'ci2-dock';
      var chal = K.challenges({ store: 'apbio-ci-goals', items: EX.goals,
        done: { title: 'All four done.', text: 'Error bars of ±2 SE shrink with more plants and grow with more spread. Apart: likely a real difference. Overlapping: it may be chance.' },
        onShow: function(){ if(St.mode === 'quiz' && St.part === 'goals') fresh(); }, onReset: function(){ fresh(); } });
      dock.appendChild(chal.el);
      function goal(id, ok, html){
        if(!ok || St.mode !== 'quiz' || St.part !== 'goals') return;
        var c = chal.current(); if(!c || c.id !== id || chal.isMet(id)) return;
        chal.met(id, html);
      }

      /* ---------------------------------------------------- the opening, Start over */
      function build(){
        // the opening plants at once (a first visit, Challenges)
        stopAll();
        P.forEach(function(a){ a.forEach(function(p){ if(p.el) p.el.remove(); }); });
        P = [[], []]; openModel(); St.n = EX.open.n; lastAct = null; before = null;
        [0, 1].forEach(function(g){ var zs = arrange(g, ZOPEN[g].map(function(z){ return { z: z }; })).map(function(s){ return s.z; }); zs.forEach(function(z, i){ var p = { g: g, id: ++uid, z: z, h: 0, x: (i + 0.5) / zs.length, op: 1, st: 'grown', tw: {} }; p.h = target(p); P[g].push(p); if(G) plantEl(p); }); });
        hMean.value(Mo[1].m); hSd.value(Mo[1].s); hMean.before(null); paintN();
      }
      function reset(){
        // Start over: the opening, shown (extra plants go back into the soil, the rest grow or shrink to their place)
        stopAll(); openModel(); var from = St.n; St.n = EX.open.n; before = null; hMean.before(null);
        [0, 1].forEach(function(g){
          var a = active(g), zs = arrange(g, ZOPEN[g].map(function(z){ return { z: z }; })).map(function(s){ return s.z; }), k = a.length, n = zs.length, slots = [];
          for(var i = 0; i < n; i++){ var j = Math.round((i + 0.5) * k / n - 0.5); slots.push({ p: k ? a[Math.min(k - 1, j)] : null, z: zs[i] }); }
          // a plant is never used twice
          var seen = []; slots.forEach(function(s){ if(s.p && seen.indexOf(s.p) > -1) s.p = null; else if(s.p) seen.push(s.p); });
          morph(g, slots, { dur: 520 });
        });
        lastAct = null; hMean.value(Mo[1].m); hSd.value(Mo[1].s); paintN(); cause.take(null);
        leafFor(); paintAll(); kick();
      }
      function fresh(){ build(); lastWH = ''; layoutNow(true); settled(); }
      // a button under the picture on a phone: bring the trays back into view so the change is seen
      function showPic(){ var r = sceneBox.getBoundingClientRect(); if(r.top < 0 && window.scrollBy) window.scrollBy({ top: r.top - 8, behavior: calm() ? 'auto' : 'smooth' }); }
      nBtns.forEach(function(b){ b.addEventListener('click', function(){ hideCue(true); tourDid('n'); cause.take(null); showPic(); setN(+b.getAttribute('data-n'), true); }); });
      bNew.addEventListener('click', function(){ hideCue(true); cause.take(null); showPic(); newSample(); });
      bReset.addEventListener('click', function(){ hideCue(true); showPic(); reset(); });

      /* ---------------------------------------------------- layout */
      var lastWH = '';
      function layoutNow(force){
        var key = sceneBox.clientWidth + 'x' + sceneBox.clientHeight;
        if(!force && key === lastWH) return;
        if(!sceneBox.clientWidth) return;
        lastWH = key;
        var g = layout(); if(!g) return;
        G = g; leafFor(true); svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H);
        drawStatic();
        P.forEach(function(a){ a.forEach(function(p){ if(!p.el || !p.el.parentNode) plantEl(p); p._c = {}; paintPlant(p); }); });
        paint();
      }
      // the leaves: as big as the plants' spacing allows (fewer plants, bigger leaves), never under 7 px
      function leafFor(instant, dur){
        if(!G) return;
        // never under 11 px: at 20 plants neighbouring leaves overlap, as real seedling leaves do
        var to = clamp(G.tw / Math.max(1, St.n) * 0.6, 11, G.wide ? 30 : G.big ? 24 : 16);
        if(LF.v == null || instant || calm()){ LF.v = to; LF.tw = null; }
        else if(Math.abs(to - LF.v) > 0.01) LF.tw = { from: LF.v, to: to, t0: now(), dur: dur || 420 };   // over the whole sprouting
        G.leaf = LF.v;
      }

      /* ---------------------------------------------------- the two modes (the adapter calls this) */
      var saved = null;
      function snapshot(){ return { n: St.n, Mo: Mo.map(function(o){ return { m: o.m, s: o.s, mu: o.mu, sig: o.sig }; }), z: P.map(function(a){ return active(P.indexOf(a)).map(function(p){ return p.z; }); }) }; }
      function restore(sv){
        stopAll(); P.forEach(function(a){ a.forEach(function(p){ if(p.el) p.el.remove(); }); }); P = [[], []];
        Mo = sv.Mo; St.n = sv.n;
        [0, 1].forEach(function(g){ sv.z[g].forEach(function(z, i){ var p = { g: g, id: ++uid, z: z, h: 0, x: (i + 0.5) / sv.z[g].length, op: 1, st: 'grown', tw: {} }; p.h = target(p); P[g].push(p); if(G) plantEl(p); }); });
        hMean.value(Mo[1].m); hSd.value(Mo[1].s); paintN();
      }
      function shown(mode, part){
        var was = St.mode === 'explore' ? 'explore' : St.part === 'goals' ? 'goals' : 'other';
        St.mode = mode; St.part = part;
        var ex = mode === 'explore', goals = mode === 'quiz' && part === 'goals';
        stage.setAttribute('data-view', ex ? 'explore' : 'goals');
        head.el.hidden = !ex;
        if(!ex){ hideCue(false); if(tour.active()) tour.stop(); }
        if(was === 'explore' && !ex){ stopAll(); saved = snapshot(); }
        if(!ex && !goals){ stopAll(); return; }
        if(ex && saved){ restore(saved); saved = null; }
        cause.take(null); lastAct = null;
        if(goals && was !== 'goals'){ setTimeout(function(){ fresh(); }, 30); return; }
        setTimeout(function(){ layoutNow(true); settled(); if(ex && !tour.active()){ if(cue.show()){ hSd.place(); cue.place(); } } }, 30);
      }
      ctx.kit2 = { stage: stage, ref: ref, othersLabel: 'On the picture',
        parts: [{ value: 'practice', label: 'Problems', practice: true },
          { value: 'goals', label: 'Challenges', dock: dock, task: { kicker: 'Challenges', title: 'Change the picture to meet each challenge.', todo: 'Drag the knobs, change the plants.' } }],
        onShow: function(m, p){ shown(m, p); } };
      // the practice problems (unchanged): the adapter puts them in Test yourself
      T.skillTool(app, data, { slug: SLUG, kind: 'ci', stage: stage0 });
      build();
      if(!ctx.studio){ app.insertBefore(stage, app.firstChild); app.insertBefore(ref, stage.nextSibling); shown('explore', null); }
      // the whole stage stops when it is hidden (Test yourself, "?" on a phone, another page tab)
      if(window.IntersectionObserver) new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting && busy() && !hMean.dragging() && !hSd.dragging()){ stopAll(); paint(); settled(); } }); }).observe(sceneBox);
      document.addEventListener('visibilitychange', function(){ if(document.hidden && busy()){ stopAll(); paint(); settled(); } });
      if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ mCache = {}; lastWH = ''; layoutNow(true); });
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(function(){ if(busy()){ stopAll(); } layoutNow(false); settled(); }, 60); }).observe(sceneBox); }
      else window.addEventListener('resize', function(){ layoutNow(false); });
      // n changes the leaf size a little (fewer plants, bigger leaves): set it as the count changes
      var setN0 = setN; setN = function(n, u){ setN0(n, u); leafFor(false, St.sprout); kick(); };
      // for the sweep (scripts/tools-v2/bio-confidence-intervals-sweep.mjs): the drawn state and the geometry
      window.__ci2 = { G: function(){ return G; }, P: function(){ return P; }, Mo: function(){ return Mo; }, St: St, busy: busy, drawn: function(){ return drawn; }, V: function(){ return lastV; },
        set: function(o){ stopAll(); if(o.n && o.n !== St.n){ setN(o.n); stopAll(); } if(o.mean != null){ setMean(o.mean); } if(o.sd != null){ setSd(o.sd); } stopAll(); cause.take(null); lastAct = null; paint(); settled(); },
        open: function(){ fresh(); }, noCue: function(){ hideCue(true); }, setN: function(n){ setN(n); }, sample: function(){ newSample(); }, reset: function(){ reset(); },
        mean: function(v){ setMean(v); }, sd: function(v){ setSd(v); } };
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApBioBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var l2 = document.createElement('link'); l2.rel = 'stylesheet'; l2.href = (window.ApBioBase || '../') + 'assets/tools/confidence-intervals.css'; document.head.appendChild(l2);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
