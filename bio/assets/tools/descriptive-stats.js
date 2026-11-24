/* Descriptive statistics, tools v2 (docs/tools-v2-bio-descriptive-stats-brief.md; standard docs/tools-v2-standard.md).
   Built on the shared kit (assets/course/tool-kit2.js) through the course adapter ApBioTools.studioKit2. The solver
   and the seeded problem generator are ApBioProblems.solve.descriptive and generate.descriptive
   (bio-skill-problems.js); the contexts, the fixed problems and the formula box are data
   (bio/data/tools/descriptive-stats.json, its "explore" block drives Explore).

   EXPLORE, one screen, one idea: one extreme value pulls the mean far more than the median. A tray of radish
   seedlings on a lab bench, lined up from shortest to tallest against a measuring board in cm. A blue line across
   the tray at the mean height and an amber line at the median; the middle plant (the two middle plants when n is
   even) glows amber. Beside the tray (below it on a phone) a clipboard: every plant as a dot on a number line plank,
   the mean as the pivot the plank balances on, the median named over its dot.
     Main control: drag any plant taller or shorter (each plant is a knob, a real slider; a press anywhere in a
     plant's column takes that plant). The row sorts itself again when the plant is let go.
     Quiet: Add a plant (the next seedling sprouts in its place in the row) and Remove one (the last one sown is
     pulled), 3 to 10 plants; Start over.
   Every number, line, glow, dot, pill and the cause line is read from the plants AS DRAWN in that frame: a plant is
   counted once it has finished sprouting and stops counting as it starts to leave.
   TEST YOURSELF: Problems (the old practice: new numbers or the worked problems, record ids
   descriptive-stats:<cid>:<part>, unchanged) and Challenges (the old goals, on the Explore picture). */
(function(){
  'use strict';
  var T = window.ApBioTools, S = window.ApBioSkillStage, M = window.ApBioMath;
  if(!T || !S) return;
  var F = T.F, esc = T.esc, SLUG = 'descriptive-stats', NS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------------ the practice figure (Test yourself, unchanged) */
  var W = 420, L = 18, R = 18, AY = 150, H = 196;

  /* pass 3 (2026-11-11): in Explore (v.drag) only mean and median are named on the plot; the SD band and the SE
     bracket are named in the key under it. Practice keeps their labels (no key there). */
  /* v: { values, lo, hi, unit, mean, median, sd, se (true or null), mine: {mean, median, sd, se}, drag, dp } */
  function draw(v){
    var p = [], pw = W - L - R, sx = function(x){ return L + (x - v.lo) / (v.hi - v.lo) * pw; };
    var step = T.niceStep(v.hi - v.lo, 6);
    for(var t = Math.ceil(v.lo / step - 1e-9) * step; t <= v.hi + 1e-9; t += step) p.push('<line class="grid" x1="' + sx(t).toFixed(1) + '" x2="' + sx(t).toFixed(1) + '" y1="28" y2="' + AY + '"/><text class="tick" x="' + sx(t).toFixed(1) + '" y="' + (AY + 17) + '" text-anchor="middle">' + M.round(t, 6) + '</text>');
    p.push('<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + AY + '" y2="' + AY + '"/>');
    p.push('<text class="sk-ph" x="' + (L + pw / 2) + '" y="' + (H - 4) + '" text-anchor="middle">' + esc((v.label || 'Value') + (v.unit ? ' (' + v.unit + ')' : '')) + '</text>');
    function band(m, sd, se, mine){
      if(isFinite(m) && isFinite(sd) && sd > 0) p.push('<rect class="ds-sd' + (mine ? ' mine' : '') + '" x="' + sx(m - sd).toFixed(1) + '" y="40" width="' + (sx(m + sd) - sx(m - sd)).toFixed(1) + '" height="' + (AY - 40) + '"/>' + (v.drag ? '' : '<text class="ds-bl" x="' + sx(m + sd).toFixed(1) + '" y="36" text-anchor="middle">+1 SD</text><text class="ds-bl" x="' + sx(m - sd).toFixed(1) + '" y="36" text-anchor="middle">−1 SD</text>'));
      if(isFinite(m) && isFinite(se) && se > 0) p.push('<path class="ds-se' + (mine ? ' mine' : '') + '" d="M' + sx(m - se).toFixed(1) + ' 58 v-8 M' + sx(m - se).toFixed(1) + ' 54 H' + sx(m + se).toFixed(1) + ' M' + sx(m + se).toFixed(1) + ' 58 v-8"/>' + (v.drag ? '' : '<text class="ds-bl" x="' + sx(m + se).toFixed(1) + '" y="68" text-anchor="start" dx="3">±1 SE</text>'));
    }
    if(v.mean != null) band(v.mean, v.sd, v.se, false);
    else if(v.mine) band(v.mine.mean, v.mine.sd, v.mine.se, true);
    // dots: one that would overlap a dot already placed stacks above it
    var rad = v.drag ? 10 : 7, placed = [], order = v.values.map(function(x, i){ return i; }).sort(function(a, b){ return v.values[a] - v.values[b]; });
    var lvl = {};
    order.forEach(function(i){
      var X = sx(v.values[i]), n = 0;
      while(placed.some(function(q){ return q.n === n && Math.abs(q.X - X) < 2 * rad - 1; })) n++;
      placed.push({ X: X, n: n }); lvl[i] = n;
    });
    v.values.forEach(function(x, i){
      var cy = AY - rad - 1 - lvl[i] * (2 * rad - 1);
      p.push('<circle class="ds-dot' + (v.hot === i ? ' hot' : '') + '"' + (v.drag ? ' data-k="' + i + '" tabindex="0" role="slider" aria-label="Value ' + (i + 1) + '" aria-valuemin="' + v.lo + '" aria-valuemax="' + v.hi + '" aria-valuenow="' + M.round(x, v.dp) + '" aria-valuetext="Value ' + (i + 1) + ': ' + F(x, v.dp) + (v.unit ? ' ' + esc(v.unit) : '') + '"' : '') + ' cx="' + sx(x).toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + rad + '"/>');
    });
    function line(x, cls, lab, y, anchor){ if(!isFinite(x)) return; var X = sx(Math.min(v.hi, Math.max(v.lo, x)));
      // a label near an edge reads inward, so a value off the plot never runs out of the figure
      if(X > W - R - 80) anchor = 'end'; else if(X < L + 80) anchor = 'start'; p.push('<line class="ds-' + cls + '" x1="' + X.toFixed(1) + '" x2="' + X.toFixed(1) + '" y1="76" y2="' + AY + '"/><text class="ds-ml ' + cls + '" x="' + X.toFixed(1) + '" y="' + y + '" text-anchor="' + anchor + '" dx="' + (anchor === 'end' ? -4 : anchor === 'start' ? 4 : 0) + '">' + lab + '</text>'); }
    var mm = v.mean != null ? v.mean : v.mine && v.mine.mean, md = v.median != null ? v.median : v.mine && v.mine.median, mine = v.mean == null;
    var meanLeft = isFinite(mm) && isFinite(md) && mm < md;
    line(md, 'median' + (mine ? ' mine' : ''), (mine ? 'your ' : '') + 'median', 86, meanLeft ? 'start' : 'end');
    line(mm, 'mean' + (mine ? ' mine' : ''), (mine ? 'your ' : '') + 'mean', 86, meanLeft ? 'end' : 'start');
    return '<svg class="bio-svg ds-fig ds2-pfig" viewBox="0 0 ' + W + ' ' + H + '" role="' + (v.drag ? 'group' : 'img') + '" aria-label="' + esc(v.aria) + '">' + p.join('') + '</svg>';
  }

  /* ---------------------------------------------------- practice stage */
  function stage0(host, s){
    var x = s.input, a = s.answers || {}, chk = s.phase === 'checked', v = x.values;
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), span = Math.max(mx - mn, 1e-6);
    var st = T.niceStep(span * 1.6, 5), lo = Math.floor((mn - span * 0.3) / st) * st, hi = Math.ceil((mx + span * 0.3) / st) * st;
    if(x.min != null || mn >= 0) lo = Math.max(0, lo);
    var spec = { values: v, lo: lo, hi: hi, unit: x.unit, label: x.label === 'Seedling' ? 'Height' : 'Value', dp: x.dp == null ? 1 : x.dp };
    if(chk){ spec.mean = M.mean(v); spec.median = M.median(v); spec.sd = M.sd(v); spec.se = M.se(v); }
    else spec.mine = { mean: S.num(a.mean), median: S.num(a.median), sd: S.num(a.sd), se: S.num(a.se) };
    spec.aria = v.length + ' values on a dot plot' + (chk ? ': mean ' + F(spec.mean, 2) + ', median ' + F(spec.median, 2) + ', SD ' + F(spec.sd, 2) + ', SE ' + F(spec.se, 2) : '') + '.';
    var typed = spec.mine && [spec.mine.mean, spec.mine.median, spec.mine.sd].some(isFinite);
    var cap = chk
      ? 'Here ' + v.filter(function(q){ return Math.abs(q - spec.mean) <= spec.sd; }).length + ' of ' + v.length + ' values lie within ±1 SD of the mean (the band); in roughly bell-shaped data about two thirds do. The SE bracket is narrower: it is SD / √' + v.length + ', about how far a sample mean typically falls from the true mean.' + (Math.abs(spec.mean - spec.median) > 0.25 * spec.sd ? ' The mean and median differ here: the ' + (spec.mean > spec.median ? 'high' : 'low') + ' values pull the mean their way.' : '')
      : typed ? 'Your answers are drawn on the dot plot as you type. Does your mean sit at the balance point of the dots? Does roughly two thirds of the data fall inside your ±1 SD band?'
      : 'Each dot is one value from the table. Type the mean, median and SD and they are drawn here.';
    S.redraw(host, '<div class="sk-fig">' + draw(spec) + '</div><p class="sk-cap">' + cap + '</p>');
  }

  /* ------------------------------------------------------------------ helpers */
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function r1(v){ return Math.round(v * 10 + (v >= 0 ? 1e-9 : -1e-9)) / 10; }
  function r2(v){ return Math.round(v * 100 + (v >= 0 ? 1e-9 : -1e-9)) / 100; }
  function n1(v){ return Math.round(v * 10) / 10; }
  function ease(x){ return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function mk(tag, cls, attrs, parent){ var e = document.createElementNS(NS, tag); if(cls) e.setAttribute('class', cls); if(attrs) for(var k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.appendChild(e); return e; }
  function at(e, attrs){ for(var k in attrs){ var v = typeof attrs[k] === 'number' ? String(n1(attrs[k])) : attrs[k]; if(e.getAttribute(k) !== v) e.setAttribute(k, v); } }
  function txt(e, s){ if(e.textContent !== s) e.textContent = s; }
  function show(e, on){ var v = on ? '' : 'none'; if(e.style.display !== v) e.style.display = v; }
  var mctx = null, mCache = {}, FONT = 'Nunito, "Segoe UI", system-ui, sans-serif';
  function tw(s, px, wt){
    var k = (wt || 800) + '|' + px + '|' + s;
    if(mCache[k] != null) return mCache[k];
    if(!mctx){ var c = document.createElement('canvas'); mctx = c.getContext('2d'); }
    mctx.font = (wt || 800) + ' ' + px + 'px ' + FONT;
    return (mCache[k] = mctx.measureText(s).width);
  }
  function hit(a, b, pad){ pad = pad || 0; return a[0] < b[2] + pad && a[2] > b[0] - pad && a[1] < b[3] + pad && a[3] > b[1] - pad; }
  /* the statistics of the heights exactly as the AP® Biology formula sheet writes them (s with n − 1) */
  function statsOf(hs){
    var n = hs.length; if(!n) return { n: 0 };
    var srt = hs.slice().sort(function(a, b){ return a - b; }), s = 0, q = 0;
    srt.forEach(function(h){ s += h; }); var m = s / n;
    srt.forEach(function(h){ q += (h - m) * (h - m); });
    var md = n % 2 ? srt[(n - 1) / 2] : (srt[n / 2 - 1] + srt[n / 2]) / 2;
    var sd = n > 1 ? Math.sqrt(q / (n - 1)) : NaN;
    return { n: n, sum: s, mean: m, median: md, sd: sd, se: n > 1 ? sd / Math.sqrt(n) : NaN, min: srt[0], max: srt[n - 1], srt: srt };
  }
  /* the mode of values given to 0.1 (none when no value repeats) */
  function modeOf(hs){
    var c = {}, best = 0; hs.forEach(function(h){ var k = r1(h).toFixed(1); c[k] = (c[k] || 0) + 1; if(c[k] > best) best = c[k]; });
    if(best < 2) return { vals: [], count: 1 };
    return { vals: Object.keys(c).filter(function(k){ return c[k] === best; }).map(Number).sort(function(a, b){ return a - b; }), count: best };
  }

  function boot(){
    var K = window.LevlKit2;
    T.mount(SLUG, function(app, data, ctx){
      var EX = data.explore, U = EX.unit, RMAX = EX.ruler, POOL = EX.heights, NMIN = EX.minN, NMAX = EX.maxN;
      var HLO = EX.min, HHI = EX.max;
      function calm(){ return K.reduced() || !window.requestAnimationFrame; }
      // P: the plants in the order they stand in the row (left to right); each { id, v (its height, 0.1 cm), h (drawn),
      // x (0..1 across the tray, drawn), op, lift, st: 'grown' | 'sprout' | 'leave', tw, el, hd (its knob) }
      var P = [], St = { mode: 'explore', part: null }, lastAct = null, drawn = { n: 0 }, dragP = null;

      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'ds2';
      var head = K.head({ purpose: EX.purpose, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'ds2-scene';
      sceneBox.innerHTML = '<svg class="ds2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><defs></defs><g class="ds2-static"></g><g class="ds2-glows"></g><g class="ds2-plants"></g><g class="ds2-front"></g><g class="ds2-live"></g><g class="ds2-labs"></g></svg>';
      stage.appendChild(sceneBox);
      var svg = sceneBox.querySelector('svg'), sDefs = svg.querySelector('defs'), sStatic = svg.querySelector('.ds2-static'), sGlow = svg.querySelector('.ds2-glows'), gPl = svg.querySelector('.ds2-plants'), sFront = svg.querySelector('.ds2-front'), sLive = svg.querySelector('.ds2-live'), sLabs = svg.querySelector('.ds2-labs');
      var layer = K.layer(sceneBox);
      var lines = document.createElement('div'); lines.className = 'ds2-lines';
      var cause = K.cause({ label: 'Why' });
      var acts = document.createElement('div'); acts.className = 'ds2-acts';
      acts.innerHTML = '<span class="ds2-n" role="group" aria-label="Number of plants"><button type="button" class="ds2-nb ds2-rm" aria-label="Remove a plant">−</button><span class="ds2-nv" aria-live="off"></span><button type="button" class="ds2-nb ds2-add" aria-label="Add a plant">+</button></span>' +
        '<button type="button" class="tk2-link ds2-reset">Start over</button>';
      var bAdd = acts.querySelector('.ds2-add'), bRm = acts.querySelector('.ds2-rm'), nVal = acts.querySelector('.ds2-nv'), bReset = acts.querySelector('.ds2-reset');
      lines.appendChild(cause.el); lines.appendChild(acts);
      stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      var lastSaid = '';
      function say(t){ if(t === lastSaid) return; lastSaid = t; live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

      /* ---------------------------------------------------- the height of the picture: from the room the screen has */
      // the picture, the row of plants and the cause line under it fit the window together at every width
      // (390 x 844, 1024 x 768, 1280 x 800): the scene's height is the window's height less what sits above it in the
      // tool (the tool's top bar and the purpose line) and the cause line with its buttons under it
      function fitHeight(){
        var vh = window.innerHeight || 800, wd = sceneBox.clientWidth || stage.clientWidth || 360;
        var root = stage.closest('.ls-root') || stage.parentNode, rt = root ? root.getBoundingClientRect() : null, sb = sceneBox.getBoundingClientRect();
        var above = rt ? clamp(sb.top - rt.top, 0, 260) : 60, below = lines.offsetHeight + 12;
        var bar = 0, tb = document.querySelector('.site-top, .lp-top, header.top'); if(tb){ var cs = getComputedStyle(tb); if(cs.position === 'sticky' || cs.position === 'fixed') bar = tb.offsetHeight; }
        var phone = wd < 600, stacked = !(wd >= 900 || (wd >= 640 && vh < 760));
        var lo = phone ? 440 : 380, hi = phone ? 640 : stacked ? 820 : 760;
        var h = Math.round(clamp(vh - above - below - bar - 14, lo, hi));
        if(sceneBox.style.height !== h + 'px') sceneBox.style.height = h + 'px';
      }

      /* ---------------------------------------------------- geometry (picture units = CSS px of the scene) */
      var G = null;
      function layout(){
        var Wd = sceneBox.clientWidth, Hd = sceneBox.clientHeight;
        if(!Wd || !Hd) return null;
        // the tray above, the clipboard lying on the bench below it, at every width (a wide clipboard puts its
        // words in a column at the left and gives the plank the rest, so no paper or wall is left bare)
        var g = { W: Wd, H: Hd, big: Wd >= 600, wide: false };
        var pad = g.big ? 16 : 8, trayEnd;
        g.clipH = g.big ? clamp(Hd * 0.34, 210, 260) : clamp(Hd * 0.37, 196, 232);
        g.topH = Hd - g.clipH;
        g.benchH = 20; g.yB = g.topH - g.benchH;
        trayEnd = Wd - pad;
        var cw0 = Wd - 2 * pad;
        g.cb = { x: (Wd - cw0) / 2, y: g.topH + 8, w: cw0, h: g.clipH - 14 };
        g.pad = pad; g.trayEnd = trayEnd;
        g.trayH = g.big ? 30 : 22;
        g.ySoil = g.yB + 4 - g.trayH + 3;
        g.yTop = g.big ? 44 : 36;
        g.k = (g.ySoil - g.yTop) / RMAX;
        g.rw = g.big ? 34 : 26;
        g.board = [pad, g.yTop - (g.big ? 28 : 26), trayEnd - pad, g.ySoil - g.yTop + (g.big ? 28 : 26)];
        // the strip at the right of the board where the mean and median lines are named (sized from the longest name)
        var fsP = g.big ? 13 : 12; g.pp = g.big ? 14 : 12; g.gut = (g.big ? tw('median 14.95 ' + U, fsP, 800) : tw('median', fsP, 800)) + g.pp + (g.big ? 14 : 8); g.gx = g.big ? 8 : 4;
        g.tx0 = pad + g.rw + 6; g.tx1 = trayEnd - 4 - g.gut;
        // every plant's column is at least 44 px wide: a narrow tray holds fewer plants
        g.cap = clamp(Math.floor((g.tx1 - g.tx0) / 44), NMIN, NMAX);
        // the clipboard's paper and its plank (a number line in cm the dots sit on)
        var c = g.cb, ins = g.big ? 14 : 10;
        c.px = c.x + ins; c.py = c.y + (g.big ? 26 : 20); c.pw = c.w - 2 * ins; c.ph = c.h - (g.big ? 26 : 20) - ins;
        c.fs = g.big ? 15 : 12.5;
        c.plH = g.big ? 18 : 16;
        c.two = c.pw >= 640;
        c.ly = c.py + c.ph - (g.big ? 44 : 36) - c.plH;
        if(c.two){
          // the words in a column at the left (title, the heights in order, the mean and median worked out)
          c.colW = clamp(c.pw * 0.3, 290, 380); c.cx = c.px + c.colW / 2;
          c.l = c.px + c.colW + 34; c.r = c.px + c.pw - 22;
          c.tY = c.py + 20; c.listY = c.py + 50; c.work = true; c.f1 = c.listY + 32; c.f2 = c.f1 + 26;
          c.free = c.py + 8;
        } else {
          c.colW = c.pw; c.cx = c.px + c.pw / 2;
          c.l = c.px + (g.big ? 22 : 14); c.r = c.px + c.pw - (g.big ? 22 : 14);
          c.tY = c.py + (g.big ? 26 : 18); c.listY = c.py + (g.big ? 48 : 41); c.work = false;
          c.free = c.listY + 8;
        }
        c.ax0 = c.two ? c.l - 16 : c.px + 2; c.ax1 = c.two ? c.r + 16 : c.px + c.pw - 2;
        c.kx = (c.r - c.l) / RMAX;
        // the dots as big as the room above the plank allows (a stack of about five), never under 5.5 px
        c.dr = clamp(Math.min(c.kx * 0.42, (c.ly - c.free - 18) / 10), 5.5, c.two ? 13 : 7);
        return g;
      }
      // the most plants the tray holds at this width, and the opening (7, or the largest odd number that fits)
      function capN(){ return G ? G.cap : NMAX; }
      function openN(){ var c = Math.min(EX.open, capN()); return c % 2 ? c : c - 1; }
      // a narrower screen holds fewer plants: the newest ones go (at once, as the layout changes)
      function fitN(){
        var lim = St.opening ? openN() : capN(), a = active(), cut = false;
        while(a.length > lim){ var q = a.reduce(function(b, x){ return x.id > b.id ? x : b; }, a[0]); drop(q); P.splice(P.indexOf(q), 1); a = active(); cut = true; }
        if(cut){ sortRow(0); P.forEach(function(p){ delete p.tw.x; }); }
        paintN();
      }
      function yH(h){ return G.ySoil - h * G.k; }
      function xP(f){ return G.tx0 + f * (G.tx1 - G.tx0); }
      function xA(v){ return G.cb.l + clamp(v, 0, RMAX) * G.cb.kx; }
      function spacing(){ return (G.tx1 - G.tx0) / Math.max(1, active().length); }

      /* ---------------------------------------------------- the still parts of the scene */
      var E = {};
      function drawStatic(){
        var g = G, o = '', d = '', trayEnd = g.trayEnd, pad = g.pad;
        d += '<linearGradient id="ds2-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ds2s-wall0"/><stop offset="1" class="ds2s-wall1"/></linearGradient>' +
          '<linearGradient id="ds2-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ds2s-wood0"/><stop offset="1" class="ds2s-wood1"/></linearGradient>' +
          '<linearGradient id="ds2-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ds2s-soil0"/><stop offset="1" class="ds2s-soil1"/></linearGradient>' +
          '<linearGradient id="ds2-plank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ds2s-pl0"/><stop offset="1" class="ds2s-pl1"/></linearGradient>' +
          '<radialGradient id="ds2-glow"><stop offset="0" class="ds2s-glow0"/><stop offset=".6" class="ds2s-glow1"/><stop offset="1" class="ds2s-glow2"/></radialGradient>';
        o += '<rect x="0" y="0" width="' + g.W + '" height="' + (g.wide ? g.H : g.topH) + '" fill="url(#ds2-wall)"/>';
        for(var ty = 40; ty < g.yB; ty += 44) o += '<line class="ds2-tile" x1="0" x2="' + g.W + '" y1="' + ty + '" y2="' + ty + '"/>';
        // the bench
        o += '<rect x="0" y="' + n1(g.yB) + '" width="' + g.W + '" height="' + n1(g.benchH) + '" fill="url(#ds2-wood)"/><rect class="ds2-bench-edge" x="0" y="' + n1(g.yB) + '" width="' + g.W + '" height="3"/>';
        for(var gx = 20; gx < g.W; gx += 130) o += '<path class="ds2-grain" d="M' + gx + ' ' + n1(g.yB + g.benchH * 0.5) + 'q40 -4 90 2"/>';
        if(!g.wide){
          o += '<rect x="0" y="' + n1(g.topH) + '" width="' + g.W + '" height="' + n1(g.clipH) + '" class="ds2-benchtop"/>';
          for(var gy = g.topH + 30; gy < g.H; gy += 46) o += '<path class="ds2-grain" d="M0 ' + gy + 'q' + n1(g.W * 0.3) + ' -6 ' + n1(g.W * 0.6) + ' 2t' + n1(g.W * 0.5) + ' 0"/>';
        }
        // the measuring board behind the plants: a ruler down its left edge, a tick every cm, numbers every 2 cm
        var b = g.board;
        o += '<rect class="ds2-board" x="' + n1(b[0]) + '" y="' + n1(b[1]) + '" width="' + n1(b[2]) + '" height="' + n1(b[3]) + '" rx="4"/>';
        o += '<rect class="ds2-rulecol" x="' + n1(b[0]) + '" y="' + n1(b[1]) + '" width="' + g.rw + '" height="' + n1(b[3]) + '" rx="4"/>';
        for(var mm = 1; mm <= RMAX * 2; mm++){
          var cm = mm / 2, y = yH(cm), big = mm % 2 === 0;
          o += '<line class="ds2-rtick' + (big ? ' is-big' : '') + '" x1="' + n1(b[0] + g.rw - (big ? (cm % 2 ? 6 : 9) : 4)) + '" x2="' + n1(b[0] + g.rw) + '" y1="' + n1(y) + '" y2="' + n1(y) + '"/>';
        }
        sDefs.innerHTML = d;
        sStatic.innerHTML = o;
        // the tray's front (over the stems' feet), its name, the ruler's numbers, the clipboard
        var f = '', x = g.tx0 - 8, w = trayEnd - pad - 4 - (g.tx0 - 8) + 2, yt = g.ySoil - 3;
        f += '<rect class="ds2-soil" x="' + n1(x + 2) + '" y="' + n1(g.ySoil - 2.5) + '" width="' + n1(w - 4) + '" height="5" rx="2" fill="url(#ds2-soil)"/>';
        f += '<path class="ds2-tray" d="M' + n1(x) + ' ' + n1(yt) + 'L' + n1(x + w) + ' ' + n1(yt) + 'L' + n1(x + w - 4) + ' ' + n1(yt + g.trayH) + 'L' + n1(x + 4) + ' ' + n1(yt + g.trayH) + 'Z"/><rect class="ds2-rim" x="' + n1(x - 1) + '" y="' + n1(yt - 1) + '" width="' + n1(w + 2) + '" height="4" rx="2"/>';
        var fs = g.big ? 14 : 12;
        f += '<text class="ds2-tname" data-lab="tray" x="' + n1(x + w / 2) + '" y="' + n1(yt + g.trayH / 2 + fs * 0.42) + '" text-anchor="middle" style="font-size:' + fs + 'px">Radish seedlings, day 7</text>';
        for(var c2 = 2; c2 <= RMAX; c2 += 2){ if(!g.big && c2 % 4) continue; f += '<text class="ds2-rnum" data-lab="rnum" x="' + n1(b[0] + g.rw - 11) + '" y="' + n1(yH(c2) + 4) + '" text-anchor="end">' + c2 + '</text>'; }
        f += '<text class="ds2-rnum is-unit" data-lab="rnum" x="' + n1(b[0] + g.rw / 2) + '" y="' + n1(b[1] + 12) + '" text-anchor="middle">cm</text>';
        var c = g.cb;
        f += '<rect class="ds2-cbshadow" x="' + n1(c.x + 4) + '" y="' + n1(c.y + 6) + '" width="' + n1(c.w) + '" height="' + n1(c.h) + '" rx="10"/>';
        f += '<rect class="ds2-cb" x="' + n1(c.x) + '" y="' + n1(c.y) + '" width="' + n1(c.w) + '" height="' + n1(c.h) + '" rx="10"/>';
        f += '<rect class="ds2-paper" x="' + n1(c.px) + '" y="' + n1(c.py) + '" width="' + n1(c.pw) + '" height="' + n1(c.ph) + '" rx="3"/>';
        var cw = Math.min(110, c.w * 0.3);
        f += '<rect class="ds2-clip" x="' + n1(c.x + c.w / 2 - cw / 2) + '" y="' + n1(c.y + 4) + '" width="' + n1(cw) + '" height="' + (g.big ? 30 : 24) + '" rx="6"/><rect class="ds2-clip-hi" x="' + n1(c.x + c.w / 2 - cw / 2 + 8) + '" y="' + n1(c.y + 9) + '" width="' + n1(cw - 16) + '" height="4" rx="2"/>';
        f += '<text class="ds2-ctitle" data-lab="ctitle" x="' + n1(c.cx) + '" y="' + n1(c.tY) + '" text-anchor="middle" style="font-size:' + c.fs + 'px">Each plant’s height (cm)</text>';
        // the plank: a wooden number line, a tick every cm and its numbers printed on it
        f += '<rect class="ds2-plank" x="' + n1(c.l - 10) + '" y="' + n1(c.ly) + '" width="' + n1(c.r - c.l + 20) + '" height="' + c.plH + '" rx="4" fill="url(#ds2-plank)"/>';
        for(var v = 0; v <= RMAX; v++){
          var X = xA(v), bg = v % 2 === 0;
          f += '<line class="ds2-ptick" x1="' + n1(X) + '" x2="' + n1(X) + '" y1="' + n1(c.ly) + '" y2="' + n1(c.ly + (bg ? 5 : 3.5)) + '"/>';
          if(bg && (g.big || v % 4 === 0)) f += '<text class="ds2-pnum" data-lab="pnum" x="' + n1(X) + '" y="' + n1(c.ly + c.plH - 3.5) + '" text-anchor="middle">' + v + '</text>';
        }
        sFront.innerHTML = f;
        // the live parts (built once per layout): the two lines, the plank's dots, the pivot and the labels
        sLive.innerHTML = ''; sLabs.innerHTML = '';
        // both halos first, then the thick blue mean line, then the thin amber median line on top: when the two values
        // are close the blue shows as a rim on both sides of the amber
        E.ml = { halo: mk('line', 'ds2-lhalo', null, sLive) }; E.dl = { halo: mk('line', 'ds2-lhalo', null, sLive) };
        E.ml.line = mk('line', 'ds2-mline', null, sLive); E.dl.line = mk('line', 'ds2-dline', null, sLive);
        E.dots = mk('g', 'ds2-dots', null, sLive);
        E.piv = mk('path', 'ds2-pivot', null, sLive);
        E.mdTick = mk('path', 'ds2-mdtick', null, sLive);
        E.pMean = pill('ds2-pill is-mean', 'pmean');
        E.pMed = pill('ds2-pill is-median', 'pmed');
        E.wMean = mk('text', 'ds2-cw is-mean', { 'text-anchor': 'middle', 'data-lab': 'cmean' }, sLabs);
        E.wMed = mk('text', 'ds2-cw is-median', { 'text-anchor': 'middle', 'data-lab': 'cmed' }, sLabs);
        E.dotEls = {};
        E.vals = mk('g', 'ds2-vals', null, sLabs); E.valEls = [];
        E.f1 = mk('text', 'ds2-work is-mean', { 'text-anchor': 'middle', 'data-lab': 'work' }, sLabs); E.f2 = mk('text', 'ds2-work is-median', { 'text-anchor': 'middle', 'data-lab': 'work' }, sLabs);
      }
      function pill(cls, lab){
        var g = mk('g', cls, { 'data-lab': lab }, sLabs), r = mk('rect', null, { rx: 9 }, g), t = mk('text', null, { 'text-anchor': 'middle' }, g);
        var o = { g: g, r: r, t: t, s: null, box: null,
          size: function(s){ var fs = G.big ? 13 : 12; return [tw(s, fs, 800) + G.pp, fs + 9]; },
          set: function(s, x0, yc){
            var fs = G.big ? 13 : 12, sz = o.size(s), w = sz[0], h = sz[1];
            show(g, true);
            if(o.s !== s){ o.s = s; t.textContent = s; t.style.fontSize = fs + 'px'; }
            at(r, { x: x0, y: yc - h / 2, width: w, height: h }); at(t, { x: x0 + w / 2, y: yc + fs * 0.36 });
            o.box = [x0, yc - h / 2, x0 + w, yc + h / 2];
          },
          hide: function(){ show(g, false); o.box = null; } };
        return o;
      }

      /* ---------------------------------------------------- the plants: one group each, the stem and the top set per frame */
      // a radish cotyledon: broad, heart shaped, notched at its tip (unit length, from where it joins the stem)
      var LEAF = '<path class="ds2-lf" d="M0 0C.12-.42.62-.64.94-.42C1.06-.3 1.02-.12.9-.03C.86 0 .86 0 .9.03C1.02.12 1.06.3.94.42C.62.64.12.42 0 0Z"/><path class="ds2-rib" d="M.04 0L.8 0"/>';
      function plantEl(p){
        var e = document.createElementNS(NS, 'g');
        e.setAttribute('class', 'ds2-pl');
        e.innerHTML = '<ellipse class="ds2-root" cx="0" cy="1.5" rx="3.6" ry="3.2"/><path class="ds2-stem"/><g class="ds2-top"><g transform="rotate(-158)">' + LEAF + '</g><g transform="rotate(-22)">' + LEAF + '</g><circle class="ds2-bud" r=".12"/></g>';
        p.el = e; p.stem = e.querySelector('.ds2-stem'); p.top = e.querySelector('.ds2-top'); p.root = e.querySelector('.ds2-root');
        p.sway = ((((p.id * 37) % 9) - 4) * 0.6);
        p._c = {};
        gPl.appendChild(e);
        p.glow = mk('ellipse', 'ds2-glow', { fill: 'url(#ds2-glow)' }, sGlow);
        return e;
      }
      function setA(p, k, e, name, v){ if(p._c[k] !== v){ p._c[k] = v; e.setAttribute(name, v); } }
      function leafL(){ return G.leaf; }
      function tipOf(p){ var hp = Math.max(0, p.h) * G.k, sw = p.sway * Math.min(1, hp / 50); return [xP(p.x) + sw, G.ySoil - hp - (p.lift || 0)]; }
      function paintPlant(p){
        var hp = Math.max(0, p.h) * G.k, x = xP(p.x), lift = p.lift || 0;
        setA(p, 'tr', p.el, 'transform', 'translate(' + n1(x) + ' ' + n1(G.ySoil - lift) + ')');
        var op = p.op < 0.999 ? String(Math.round(p.op * 100) / 100) : '1';
        if(p._c.op !== op){ p._c.op = op; p.el.style.opacity = op === '1' ? '' : op; }
        setA(p, 'st', p.el, 'data-st', p.st);
        setA(p, 'rs', p.root, 'transform', 'scale(' + n1(clamp(G.leaf / 14, 0.75, 1.5)) + ')');
        if(hp < 0.4){ setA(p, 'd', p.stem, 'd', ''); setA(p, 'tv', p.top, 'visibility', 'hidden'); return; }
        var sw = p.sway * Math.min(1, hp / 50), L = leafL() * (0.4 + 0.6 * Math.min(1, p.h / 3));
        // the stem's tip (where the two seed leaves meet) is exactly the plant's height above the soil
        setA(p, 'd', p.stem, 'd', 'M0 0Q' + n1(sw * 0.6) + ' ' + n1(-hp * 0.5) + ' ' + n1(sw) + ' ' + n1(-hp));
        var swd = String(n1(clamp(G.leaf / 6.5, 2, 4.6))); if(p._c.sw !== swd){ p._c.sw = swd; p.stem.style.strokeWidth = swd + 'px'; }
        setA(p, 'tv', p.top, 'visibility', 'visible');
        setA(p, 't', p.top, 'transform', 'translate(' + n1(sw) + ' ' + n1(-hp) + ') scale(' + n1(L) + ')');
      }
      function active(){ return P.filter(function(p){ return p.st !== 'leave'; }); }
      function counted(){ return P.filter(function(p){ return p.st === 'grown'; }); }

      /* ---------------------------------------------------- tweens */
      function twn(p, key, to, dur, delay){
        if(calm() || !dur){ p[key] = to; delete p.tw[key]; return; }
        if(Math.abs(p[key] - to) < 1e-9 && !p.tw[key]) return;
        p.tw[key] = { from: p[key], to: to, t0: now() + (delay || 0), dur: dur };
      }
      var LF = { v: null, tw: null };
      function busy(){ if(LF.tw) return true; for(var i = 0; i < P.length; i++){ var p = P[i]; if(p.st !== 'grown') return true; for(var k in p.tw) return true; } return false; }
      var raf = 0;
      function kick(){ if(calm()){ if(raf){ cancelAnimationFrame(raf); raf = 0; } frame(); return; } if(!raf) raf = requestAnimationFrame(frame); }
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
        for(var i = P.length - 1; i >= 0; i--){
          var p = P[i]; step(p, t);
          if(p.st === 'leave' && !p.tw.op && !p.tw.lift){ drop(p); P.splice(i, 1); continue; }
          if(G) paintPlant(p);
        }
        paint();
        if(busy() && !calm()) raf = requestAnimationFrame(frame);
        else settled();
      }
      function drop(p){ if(p.el) p.el.remove(); if(p.glow) p.glow.remove(); if(p.hd) p.hd.el.remove(); p.el = p.glow = null; p.hd = null; }
      function stopAll(){
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        if(LF.tw){ LF.v = LF.tw.to; LF.tw = null; if(G) G.leaf = LF.v; }
        for(var i = P.length - 1; i >= 0; i--){
          var p = P[i];
          for(var k in p.tw) p[k] = p.tw[k].to; p.tw = {};
          if(p.st === 'leave'){ drop(p); P.splice(i, 1); continue; }
          p.st = 'grown';
          if(G) paintPlant(p);
        }
        if(G) paint();
      }

      /* ---------------------------------------------------- changes to the model, each shown */
      // the row in height order (shortest at the left); ties keep their order. Each plant slides to its place.
      function sortRow(dur){
        var a = active(), idx = a.map(function(p, i){ return i; });
        idx.sort(function(i, j){ return a[i].v - a[j].v || a[i].x - a[j].x; });
        var n = a.length, rows = idx.map(function(i){ return a[i]; });
        rows.forEach(function(p, r){ var fx = (r + 0.5) / n; if(p.st === 'sprout' && !p.tw.x) p.x = fx; else twn(p, 'x', fx, dur == null ? 320 : dur); });
        // P keeps the row order (the leaving plants at the end)
        P = rows.concat(P.filter(function(p){ return p.st === 'leave'; }));
        // the knobs in row order, so Tab goes left to right (a knob that has focus keeps it)
        var fe = document.activeElement, now0 = Array.prototype.slice.call(layer.el.querySelectorAll('.ds2-hd')), want = rows.filter(function(p){ return p.hd; }).map(function(p){ return p.hd.el; });
        if(want.some(function(el, i){ return now0[i] !== el; })){
          want.forEach(function(el){ layer.el.appendChild(el); });
          if(fe && fe !== document.activeElement && fe.isConnected) try{ fe.focus({ preventScroll: true }); }catch(e){}
        }
        leafFor();
      }
      // a plant taken while others still move: only its own growth ends at once; the row's slide goes on
      function hold(p){
        if(p.tw.h){ p.h = p.tw.h.to; delete p.tw.h; }
        if(p.st === 'sprout'){ p.st = 'grown'; }
        if(G && p.el){ paintPlant(p); paint(); }
      }
      function newPlant(id, v, h){
        var p = { id: id, v: v, h: h == null ? v : h, x: 0.5, op: 1, lift: 0, st: 'grown', tw: {} };
        if(G) plantEl(p);
        p.hd = knob(p);
        return p;
      }
      function sow(){
        stopAll();
        var a = active(); if(a.length >= capN()) return;
        St.opening = false;
        var ids = a.map(function(p){ return p.id; }), id = 0; while(ids.indexOf(id) > -1) id++;
        var was = drawn, p = newPlant(id, POOL[id], 0);
        p.st = 'sprout';
        // its place in the row first, then it sprouts there while the others make room
        var n = a.length + 1, rank = a.filter(function(q){ return q.v <= p.v; }).length;
        p.x = (rank + 0.5) / n;
        P.push(p);
        sortRow(380);
        twn(p, 'h', p.v, 620, 120);
        if(calm()){ p.h = p.v; p.st = 'grown'; }
        lastAct = { kind: 'n', from: a.length, to: n, was: snap(was) };
        paintN(); paintAll(); kick(); if(calm()) fade();
      }
      function pull(){
        stopAll();
        St.opening = false;
        var a = active(); if(a.length <= NMIN) return;
        var was = drawn, p = a.reduce(function(b, q){ return q.id > b.id ? q : b; }, a[0]);
        // the last one sown is pulled out of the soil: it stops counting at once, rises and fades
        p.st = 'leave'; if(p.hd){ p.hd.el.remove(); p.hd = null; }
        twn(p, 'lift', G ? G.k * 2.2 : 30, 420); twn(p, 'op', 0, 420);
        sortRow(380);
        lastAct = { kind: 'n', from: a.length, to: a.length - 1, was: snap(was) };
        paintN(); paintAll(); kick(); if(calm()){ stopAll(); fade(); }
      }
      function snap(d){ return d && d.n ? { n: d.n, mean: d.mean, median: d.median, sd: d.sd, se: d.se } : null; }
      function setH(p, v, drag){
        v = clamp(r1(v), HLO, HHI);
        if(v === p.v && !drag) return;
        p.v = v;
        if(drag || calm()){ p.h = v; delete p.tw.h; } else twn(p, 'h', v, 240);
        if(p.hd && p.hd.value() !== v) p.hd.value(v);
        kick();
      }
      function paintN(){
        var n = active().length;
        txt(nVal, (drawn.n || 0) + ' plants');
        bAdd.disabled = n >= capN(); bRm.disabled = n <= NMIN;
        bAdd.title = n >= capN() ? 'The tray is full' : 'Add a plant'; bRm.title = n <= NMIN ? 'Keep at least three plants' : 'Remove a plant';
      }
      function paintAll(){ if(!G) return; P.forEach(function(p){ if(p.el) paintPlant(p); }); paint(); }

      /* ---------------------------------------------------- one knob per plant, on its top */
      var gOff = 0;
      function knobY(p){ return tipOf(p)[1]; }
      function lfH(p){ return G.leaf * (0.4 + 0.6 * Math.min(1, p.h / 3)) * 0.66; }
      function knob(p){
        var hd = K.handle(layer, { key: 'ds2-plant', quiet: true, chip: false, label: 'Height of a radish plant (cm)', value: p.v, min: HLO, max: HHI, step: 0.1,
          at: function(){ if(!G || p.st !== 'grown' && p.st !== 'sprout' || !p.el) return [NaN, NaN]; var t = tipOf(p); return [t[0], knobY(p)]; },
          pick: function(x, y){ var v = r1((G.ySoil - (y - gOff)) / G.k); return clamp(v, HLO, HHI); },
          dir: function(){ return 90; },
          keys: function(v, key, big){ var s = big ? 1 : 0.1; if(key === 'ArrowUp' || key === 'ArrowRight') return clamp(r1(v + s), HLO, HHI); if(key === 'ArrowDown' || key === 'ArrowLeft') return clamp(r1(v - s), HLO, HHI); if(key === 'PageUp') return clamp(r1(v + 1), HLO, HHI); if(key === 'PageDown') return clamp(r1(v - 1), HLO, HHI); if(key === 'Home') return HLO; if(key === 'End') return HHI; return null; },
          valuetext: function(){ return valueText(p); },
          onStart: function(v){ hideCue(true); tourDid('drag'); hold(p); dragP = p; begin(p); },
          onEnd: function(){ dragP = null; hd.before(null); sortRow(); kick(); },
          onInput: function(v){ setH(p, v, hd.dragging()); if(hd.dragging() && lastAct) hd.before(lastAct.h0); } });
        hd.el.classList.add('ds2-hd');
        return hd;
      }
      function valueText(p){
        var a = active(), r = a.indexOf(p) + 1, mid = isMid(p);
        return 'Plant ' + r + ' of ' + a.length + ' from the shortest, ' + F(r1(p.h), 1) + ' ' + U + (mid ? ', a middle plant' : '');
      }
      function begin(p){
        var d = drawn;
        St.opening = false;
        if(!(lastAct && lastAct.kind === 'plant' && lastAct.p === p && Date.now() - lastAct.t < 1500)) lastAct = { kind: 'plant', p: p, h0: p.v, was: snap(d) };
        lastAct.t = Date.now();
      }
      // a press anywhere in a plant's column takes that plant (the one drawn under the finger, by its column)
      function plantAt(cx){
        var a = active().filter(function(p){ return p.st === 'grown' && p.hd; }), best = null, bd = Infinity, half = spacing() / 2;
        a.forEach(function(p){ var d = Math.abs(xP(p.x) - cx); if(d < bd){ bd = d; best = p; } });
        return bd <= Math.max(half, 16) ? best : null;
      }
      sceneBox.addEventListener('pointerdown', function(e){
        if(!G || St.mode === 'quiz' && St.part !== 'goals') return;
        var r = sceneBox.getBoundingClientRect(), k = layer.scale() || 1, x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k;
        // always the plant whose column is under the finger, even on a knob (a neighbour's 44 px knob can reach over)
        var kn = e.target.closest && e.target.closest('.tk2-knob'), p = null;
        if(kn || (x > G.tx0 - 10 && x < G.tx1 + 10 && y < G.ySoil + 6 && y > G.board[1])) p = plantAt(x);
        if(!p){ if(kn){ e.stopPropagation(); e.preventDefault(); } return; }
        gOff = clamp(y - knobY(p), -60, 400);
        if(kn) e.stopPropagation();
        p.hd.grab(e);
      }, true);

      /* ---------------------------------------------------- paint: everything read from the plants as drawn */
      var mids = [], XS = { n: 0 };
      function isMid(p){ return mids.indexOf(p) > -1; }
      function paint(){
        if(!G) return;
        var c = G.cb, cn = counted();
        // the numbers from the heights as the clipboard lists them (to 0.1 cm), so the list, the sum, the mean and
        // every pill agree on every frame; the lines and the pivot sit at the exact drawn values
        drawn = statsOf(cn.map(function(p){ return r1(p.h); })); XS = statsOf(cn.map(function(p){ return p.h; }));
        var d = drawn, ok = d.n > 0;
        // the middle plant(s): by height as drawn (ties by place in the row), so the glow is right mid drag
        var byH = cn.slice().sort(function(a, b){ return a.h - b.h || a.x - b.x; });
        mids = !ok ? [] : d.n % 2 ? [byH[(d.n - 1) / 2]] : [byH[d.n / 2 - 1], byH[d.n / 2]];
        P.forEach(function(p){
          if(!p.glow) return;
          var on = isMid(p);
          show(p.glow, on);
          if(on){ var t = tipOf(p), L = G.leaf * 1.25; at(p.glow, { cx: t[0], cy: t[1] - L * 0.18, rx: L * 1.35, ry: L * 1.05 }); }
          if(p.el) p.el.classList.toggle('is-mid', on);
        });
        // the two lines across the tray
        var x0 = G.tx0 - 6, x1 = G.tx1 + G.gx + 2;
        [[E.ml, XS.mean], [E.dl, XS.median]].forEach(function(q){
          show(q[0].line, ok); show(q[0].halo, ok);
          if(ok){ var y = yH(q[1]); at(q[0].halo, { x1: x0, x2: x1, y1: y, y2: y }); at(q[0].line, { x1: x0, x2: x1, y1: y, y2: y }); }
        });
        paintPills(d);
        paintPlank(d, cn);
        txt(nVal, d.n + ' plants');
        paintCause(d);
        P.forEach(function(p){ if(p.hd) p.hd.place(); });
        if(cue.active()) placeCue();
      }
      // the boxes of everything drawn on the board that a label must stay 4 px clear of
      function boardBoxes(){
        var bx = [], L = G.leaf;
        active().forEach(function(p){
          if(!p.el) return;
          var t = tipOf(p), Lp = L * (0.4 + 0.6 * Math.min(1, p.h / 3));
          bx.push([t[0] - Lp * 1.02, t[1] - Lp * 0.66, t[0] + Lp * 1.02, t[1] + Lp * 0.2]);   // the two seed leaves
          bx.push([xP(p.x) - 3, t[1], xP(p.x) + 3, G.ySoil]);                                 // the stem
          if(p.hd && p.st === 'grown'){ var ky = knobY(p); bx.push([t[0] - 7, ky - 7, t[0] + 7, ky + 7]); }
        });
        return bx;
      }
      function pillTexts(d){ return G.big ? ['mean ' + F(r2(d.mean), 2) + ' ' + U, 'median ' + F(r2(d.median), 2) + ' ' + U] : ['mean', 'median']; }
      // the two names sit at the right end of their lines, in a strip of board kept free of plants; when the lines are
      // closer than a pill and 4 px, the higher line's name goes just over the lower one's
      function paintPills(d){
        if(!(d.n > 0)){ E.pMean.hide(); E.pMed.hide(); return; }
        var t = pillTexts(d), zM = E.pMean.size(t[0]), zD = E.pMed.size(t[1]), yM = yH(XS.mean), yD = yH(XS.median), h = Math.max(zM[1], zD[1]);
        var lo = G.board[1] + h / 2 + 3, hi = G.ySoil - h / 2 - 6, x0 = G.tx1 + G.gx;
        if(Math.abs(yM - yD) < h + 6){
          var mid = (yM + yD) / 2, up = yM <= yD;
          mid = clamp(mid, lo + (h + 6) / 2, hi - (h + 6) / 2);
          yM = mid + (up ? -1 : 1) * (h + 6) / 2; yD = mid + (up ? 1 : -1) * (h + 6) / 2;
        } else { yM = clamp(yM, lo, hi); yD = clamp(yD, lo, hi); }
        E.pMean.set(t[0], x0, yM); E.pMed.set(t[1], x0, yD);
      }
      // the clipboard: each plant a dot on the plank, the mean the pivot it balances on, the median named
      function paintPlank(d, cn){
        var c = G.cb, rr = c.dr, seen = {};
        var list = P.filter(function(p){ return p.st === 'grown'; }).slice().sort(function(a, b){ return a.h - b.h || a.x - b.x; });
        var room = c.ly - c.free - 22, lv = [], placed = [];
        list.forEach(function(p){
          var X = xA(p.h), n = 0;
          while(placed.some(function(q){ return q.n === n && Math.abs(q.X - X) < 2 * rr - 0.5; })) n++;
          placed.push({ X: X, n: n }); lv.push(n);
        });
        var top = lv.reduce(function(m, v){ return Math.max(m, v); }, 0), stepY = Math.min(2 * rr - 0.5, top ? room / top : 2 * rr);
        list.forEach(function(p, i){
          seen[p.id] = 1;
          var e = E.dotEls[p.id];
          if(!e){ e = E.dotEls[p.id] = mk('circle', 'ds2-dot', { r: rr }, E.dots); }
          at(e, { cx: placed[i].X, cy: c.ly - rr - 0.5 - lv[i] * stepY, r: rr });
          var cls = 'ds2-dot' + (isMid(p) ? ' is-mid' : '') + (p === dragP ? ' is-drag' : '');
          if(e.getAttribute('class') !== cls) e.setAttribute('class', cls);
          p._dot = [placed[i].X, c.ly - rr - 0.5 - lv[i] * stepY];
        });
        for(var id in E.dotEls) if(!seen[id]){ E.dotEls[id].remove(); delete E.dotEls[id]; }
        // the heights in order, shortest first, the middle one(s) in amber: the median is the middle value
        var fsv = c.two ? 14 : G.big ? 13 : 12, nl = list.length;
        while(fsv > 11 && nl * (tw('14.0', fsv, 900) + 7) > c.colW - 16) fsv -= 0.5;
        var span = Math.min(c.colW - 16, nl * (tw('14.0', fsv, 900) + (G.big ? 14 : 8)));
        while(E.valEls.length < nl) E.valEls.push(mk('text', 'ds2-val', { 'text-anchor': 'middle', 'data-lab': 'val' }, E.vals));
        E.valEls.forEach(function(e, i){
          if(i >= nl){ show(e, false); return; }
          var p = list[i]; show(e, true);
          txt(e, F(r1(p.h), 1)); e.style.fontSize = fsv + 'px';
          at(e, { x: c.cx - span / 2 + span * (i + 0.5) / nl, y: c.listY });
          var cls = 'ds2-val' + (isMid(p) ? ' is-mid' : ''); if(e.getAttribute('class') !== cls) e.setAttribute('class', cls);
        });
        show(E.f1, c.work && d.n > 0); show(E.f2, c.work && d.n > 0);
        if(c.work && d.n > 0){
          var fw = 14, sum = 0; list.forEach(function(p){ sum += r1(p.h); });
          txt(E.f1, 'mean = ' + F(r1(sum), 1) + ' ÷ ' + d.n + ' = ' + F(r2(d.mean), 2) + ' ' + U);
          txt(E.f2, d.n % 2 ? 'median = the middle value = ' + F(r2(d.median), 2) + ' ' + U : 'median = (' + F(d.srt[d.n / 2 - 1], 1) + ' + ' + F(d.srt[d.n / 2], 1) + ') ÷ 2 = ' + F(r2(d.median), 2) + ' ' + U);
          [E.f1, E.f2].forEach(function(e, i){ e.style.fontSize = fw + 'px'; at(e, { x: c.cx, y: i ? c.f2 : c.f1 }); });
        }
        if(!(d.n > 0)){ show(E.piv, false); show(E.wMean, false); show(E.wMed, false); show(E.mdTick, false); return; }
        // the pivot under the plank at the mean, "mean" under it
        var mx = xA(XS.mean), ph = G.big ? 16 : 13, yb = c.ly + c.plH;
        at(E.piv, { d: 'M' + n1(mx) + ' ' + n1(yb) + 'l' + n1(ph * 0.72) + ' ' + ph + 'h' + n1(-ph * 1.44) + 'Z' }); show(E.piv, true);
        var fs = G.big ? 13 : 12;
        txt(E.wMean, 'mean'); at(E.wMean, { x: clamp(mx, c.ax0 + 22, c.ax1 - 22), y: yb + ph + fs + 2 }); E.wMean.style.fontSize = fs + 'px'; show(E.wMean, true);
        // "median" over the middle dot(s), clear of every dot under it
        var mdx = xA(d.median), wtop = c.ly;
        var wlab = tw('median', fs, 900) / 2 + 4;
        list.forEach(function(p){ if(p._dot && Math.abs(p._dot[0] - mdx) < wlab + rr) wtop = Math.min(wtop, p._dot[1] - rr); });
        // "median" over the middle dot(s); with no room there, beside the top dot on the side that is clear
        var wl = tw('median', fs, 900), boxes = list.filter(function(p){ return p._dot; }).map(function(p){ return [p._dot[0] - rr, p._dot[1] - rr, p._dot[0] + rr, p._dot[1] + rr]; });
        var cands = [], ty = wtop - 9;
        cands.push({ x: clamp(mdx, c.ax0 + wl / 2 + 2, c.ax1 - wl / 2 - 2), y: ty - 3, tick: true });
        cands.push({ x: clamp(mdx, c.ax0 + wl / 2 + 2, c.ax1 - wl / 2 - 2), y: wtop - 7 });
        for(var lv2 = 0; lv2 < 8; lv2++){ var yy = wtop + rr + fs * 0.36 + lv2 * rr; for(var kk = 0; kk < 8; kk++) [1, -1].forEach(function(sd){ cands.push({ x: mdx + sd * (rr * (1 + 2 * kk) + 6 + wl / 2), y: yy }); }); }
        var pick = cands[cands.length - 1];
        for(var ci = 0; ci < cands.length; ci++){
          var q = cands[ci], bb = [q.x - wl / 2, q.y - fs * 0.95, q.x + wl / 2, q.y + fs * 0.3];
          if(bb[0] < c.ax0 || bb[2] > c.ax1 || bb[1] < c.free + 2 || bb[3] > c.ly - 4) continue;
          if(boxes.some(function(b){ return hit(bb, b, 3); })) continue;
          if(q.tick && boxes.some(function(b){ return hit([mdx - 4, ty, mdx + 4, ty + 6], b, 2); })) continue;
          pick = q; break;
        }
        var wx = pick.x, wy = pick.y;
        txt(E.wMed, 'median'); E.wMed.style.fontSize = fs + 'px'; show(E.wMed, true);
        if(pick.tick){ at(E.mdTick, { d: 'M' + n1(mdx) + ' ' + n1(ty + 5.5) + 'l-4 -5h8Z' }); show(E.mdTick, true); } else show(E.mdTick, false);
        at(E.wMed, { x: wx, y: wy });
      }
      function paintCause(d){
        if(cause.el.classList.contains('is-take') && busy()) cause.take(null);
        if(cause.el.classList.contains('is-take')) return;
        if(!(d.n > 1)){ cause.set([{ t: 'Growing', role: 'n' }]); return; }
        var a = lastAct, w = a && a.was, m = F(r2(d.mean), 2), md = F(r2(d.median), 2), parts = [];
        var sdp = { t: 'SD ' + F(r2(d.sd), 2) + ' · SE ' + F(r2(d.se), 2), role: 'sd', say: 'the SD is ' + F(r2(d.sd), 2) + ' and the SE ' + F(r2(d.se), 2) + ' ' + U };
        if(a && a.kind === 'plant' && w && Math.abs(r1(a.p.h) - a.h0) >= 0.05){
          parts.push({ t: 'one plant to ' + F(r1(a.p.h), 1) + ' ' + U, role: 'plant', say: 'One plant went from ' + F(a.h0, 1) + ' to ' + F(r1(a.p.h), 1) + ' ' + U });
          parts.push(chg('mean', m, F(r2(w.mean), 2)));
          parts.push(chg('median', md, F(r2(w.median), 2)));
        } else if(a && a.kind === 'n' && w){
          parts.push({ t: d.n + ' plants', role: 'plant', say: 'Now ' + d.n + ' plants' });
          parts.push(chg('mean', m, F(r2(w.mean), 2)));
          if(d.n % 2 === 0){ var s = d.srt; parts.push({ t: 'median (' + F(s[d.n / 2 - 1], 1) + ' + ' + F(s[d.n / 2], 1) + ') ÷ 2 = ' + md, role: 'median', say: 'the median is the mean of the two middle plants, ' + F(s[d.n / 2 - 1], 1) + ' and ' + F(s[d.n / 2], 1) + ', so ' + md + ' ' + U }); }
          else parts.push(chg('median', md, F(r2(w.median), 2)));
        } else {
          parts.push({ t: d.n + ' plants', role: 'plant', say: d.n + ' plants' });
          parts.push({ t: 'mean ' + m + ' ' + U, role: 'mean', say: 'the mean is ' + m + ' ' + U });
          parts.push({ t: 'median ' + md + ' ' + U, role: 'median', say: 'the median is ' + md + ' ' + U });
        }
        // SD and SE ride along when the line still fits two rows (else they are in "?": the worked table)
        if(rows(parts.concat([sdp])) <= 2) parts.push(sdp);
        cause.set(parts);
      }
      function chg(name, v, was){
        if(v === was) return { t: name + ' stays ' + v, role: name, say: 'the ' + name + ' stays ' + v + ' ' + U };
        return { t: name + ' ' + v + ' (was ' + was + ')', role: name, say: 'the ' + name + ' is now ' + v + ' ' + U + ', it was ' + was };
      }
      // how many rows the cause line takes at its width (the kit's sizes: 16 px text, or 14 px under 641 px)
      function rows(parts){
        var W0 = cause.el.clientWidth || lines.clientWidth || 340, sm = window.innerWidth < 641, fs = sm ? 14 : 16, padX = sm ? 19 : 26, gap = sm ? 4 : 6, arr = (sm ? 14 : 16) * 0.75;
        var r = 1, x = 0;
        parts.forEach(function(q, i){
          var w = tw(q.t, fs, 900) + padX + 2;
          var add = (i ? arr + 2 * gap : 0) + w;
          if(i && x + add > W0){ r++; x = w; } else x += add;
        });
        return r;
      }

      /* ---------------------------------------------------- settled: takeaways, challenges, live text, "?" */
      function settled(){
        if(busy() || !G) return;
        if(dragP) { refHtml(); return; }
        var d = drawn, a = lastAct, take = null, msg = cause.text();
        if(a && a.was && d.n > 1 && St.mode === 'explore'){
          var dm = Math.abs(d.mean - a.was.mean), dd = Math.abs(d.median - a.was.median);
          if(a.kind === 'plant' && dm >= 0.3 && dm > 2 * dd + 0.05 && Math.abs(a.p.v - d.median) > 2.5 * Math.max(0.5, d.sd * 0.5)) take = 'With an outlier, the median describes the typical plant better.';
          else if(a.kind === 'plant' && dd > dm + 0.05) take = 'The median follows the middle plant; the mean shares any change among all ' + d.n + ' plants.';
          else if(a.kind === 'n' && d.n % 2 === 0 && a.was.n % 2 === 1) take = 'An even number of plants: the median is the mean of the two middle ones.';
        }
        if(take){ cause.take(take); msg += ' ' + take; }
        if(a && a.was && d.n > 1){
          goal('outlier', a.kind === 'plant' && d.max > 11 && Math.abs(d.mean - a.was.mean) > Math.abs(d.median - a.was.median), 'One plant at <b>' + F(d.max, 1) + ' ' + esc(U) + '</b>: the mean moved <b>' + F(r2(Math.abs(d.mean - a.was.mean)), 2) + ' ' + esc(U) + '</b>, the median only ' + F(r2(Math.abs(d.median - a.was.median)), 2) + ' ' + esc(U) + '. The mean uses the size of every value; the median only which one is in the middle.');
          goal('sd', d.n >= 3 && r2(d.sd) <= 0.3, 'SD <b>' + F(r2(d.sd), 2) + ' ' + esc(U) + '</b>: every plant is close to the mean, so the spread is tiny.');
          goal('n', a.kind === 'n' && d.n >= capN(), d.n + ' plants: SE = s ÷ √n is <b>' + F(r2(d.se), 2) + ' ' + esc(U) + '</b>, while the SD is ' + F(r2(d.sd), 2) + ' ' + esc(U) + '. More plants pin down the mean better; they do not make the plants less varied.');
        }
        say(msg);
        refHtml();
      }

      /* ---------------------------------------------------- the first visit cue and "Show me how" */
      // the cue sits on the empty board above the tallest plant, its arrow pointing down at that plant's knob
      function tallest(){ var a = counted(), b = null; a.forEach(function(p){ if(!b || p.h > b.h) b = p; }); return b; }
      var cue = K.cue(layer, { key: 'apbio-ds', text: EX.cue, side: 'above', at: function(){ var t = tallest(); return G && t ? [tipOf(t)[0], knobY(t) - 12] : [0, 0]; } });
      function placeCue(){
        cue.place();
        var b = sceneBox.querySelector('.tk2-cue'); if(!b || !G) return;
        var r = b.getBoundingClientRect(), sr = sceneBox.getBoundingClientRect(), lim = sr.left + (G.wide ? G.cb.x - 6 : G.W - 4);
        if(r.right > lim){ var dx = parseFloat(b.style.getPropertyValue('--tk2-cue-dx')) || 0; b.style.setProperty('--tk2-cue-dx', (dx - (r.right - lim)).toFixed(1) + 'px'); }
      }
      function hideCue(used){ if(cue.active()) cue.hide(used); }
      var tour = K.tour({ key: 'apbio-ds', label: 'Show me how', steps: [
        { id: 'drag', text: 'Drag a plant up or down: it grows or shrinks. The blue line is the mean height, the amber line the median.', target: function(){ var t = tallest(); return t && t.hd ? t.hd.knob : sceneBox; } },
        { id: 'clip', text: 'Each dot is one plant. The plank balances on the mean; the median is the middle dot.', target: function(){ var r = sceneBox.getBoundingClientRect(); return G ? { left: r.left + G.cb.x, top: r.top + G.cb.y, width: G.cb.w, height: G.cb.h, right: r.left + G.cb.x + G.cb.w, bottom: r.top + G.cb.y + G.cb.h } : sceneBox; } },
        { id: 'n', text: 'Add or remove a plant. With an even number, the median is the mean of the two middle plants.', target: function(){ return acts.querySelector('.ds2-n'); } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      function tourDid(id){ if(tour.active()) tour.did(id); }
      function startTour(){ if(St.mode !== 'explore') return; hideCue(false); tour.start(true); }

      /* ---------------------------------------------------- "?": the numbers worked out */
      var ref = document.createElement('div'); ref.className = 'ds2-ref';
      ref.innerHTML = '<p class="ds2-ref-how"><button type="button" class="tk2-how ds2-ref-tour">Show me how</button></p><div class="ds2-ref-live"></div>' + EX.refHtml;
      ref.querySelector('.ds2-ref-tour').addEventListener('click', function(){ if(St.mode !== 'explore') return; var x = document.querySelector('.ls-sheet-x, .ls-sheet .ls-x'); if(x) x.click(); setTimeout(startTour, 60); });
      var refLive = ref.querySelector('.ds2-ref-live');
      function refHtml(){
        var d = drawn; if(!(d.n > 1)) return;
        var n = d.n, s = d.srt, mo = modeOf(s), q = 0;
        s.forEach(function(h){ q += (h - d.mean) * (h - d.mean); });
        var mid = n % 2 ? 'the middle one, plant ' + ((n + 1) / 2) + ' of ' + n + ': ' + F(s[(n - 1) / 2], 1) + ' ' + esc(U) : 'the mean of the two middle ones: (' + F(s[n / 2 - 1], 1) + ' + ' + F(s[n / 2], 1) + ') ÷ 2 = ' + F(r2(d.median), 2) + ' ' + esc(U);
        refLive.innerHTML = '<h3>This picture, worked out</h3><p>The ' + n + ' heights, shortest first: ' + s.map(function(h){ return F(h, 1); }).join(', ') + ' ' + esc(U) + '.</p><div class="bt-tablewrap"><table class="ds2-tab"><tbody>' +
          '<tr><th scope="row">Mean x̄</th><td>Σx ÷ n = ' + F(r1(d.sum), 1) + ' ÷ ' + n + ' = <b>' + F(r2(d.mean), 2) + ' ' + esc(U) + '</b></td></tr>' +
          '<tr><th scope="row">Median</th><td>' + (n % 2 ? 'odd n: ' : 'even n: ') + mid + '</td></tr>' +
          '<tr><th scope="row">Mode</th><td>' + (mo.vals.length ? mo.vals.map(function(v){ return F(v, 1); }).join(' and ') + ' ' + esc(U) + ' (' + mo.count + ' plants each)' : 'none: no two plants have the same height') + '</td></tr>' +
          '<tr><th scope="row">Range</th><td>' + F(d.max, 1) + ' − ' + F(d.min, 1) + ' = ' + F(r1(d.max - d.min), 1) + ' ' + esc(U) + '</td></tr>' +
          '<tr><th scope="row">s</th><td>√( Σ(x − x̄)² ÷ (n − 1) ) = √( ' + F(q, 2) + ' ÷ ' + (n - 1) + ' ) = <b>' + F(r2(d.sd), 2) + ' ' + esc(U) + '</b></td></tr>' +
          '<tr><th scope="row">SE</th><td>s ÷ √n = ' + F(d.sd, 3) + ' ÷ ' + F(Math.sqrt(n), 3) + ' = <b>' + F(r2(d.se), 2) + ' ' + esc(U) + '</b></td></tr>' +
          '</tbody></table></div>';
      }

      /* ---------------------------------------------------- Test yourself, "Challenges" */
      var dock = document.createElement('div'); dock.className = 'ds2-dock';
      var chal = K.challenges({ store: 'apbio-ds-goals', items: EX.goals,
        done: { title: 'All three done.', text: 'One extreme value pulls the mean but hardly the median. The SD measures the spread of the plants; the SE shrinks with more plants.' },
        onShow: function(){ if(St.mode === 'quiz' && St.part === 'goals') fresh(); }, onReset: function(){ fresh(); } });
      dock.appendChild(chal.el);
      function goal(id, ok, html){
        if(!ok || St.mode !== 'quiz' || St.part !== 'goals') return;
        var c = chal.current(); if(!c || c.id !== id || chal.isMet(id)) return;
        chal.met(id, html);
      }

      /* ---------------------------------------------------- the opening, Start over */
      function build(){
        stopAll();
        P.forEach(drop); P = [];
        St.opening = true;
        for(var i = 0; i < openN(); i++) P.push(newPlant(i, POOL[i]));
        lastAct = null; sortRow(0); P.forEach(function(p){ p.tw = {}; }); paintN();
      }
      function reset(){
        // Start over: the opening, shown (extra plants are pulled, missing ones sprout, the rest grow or shrink back)
        stopAll(); var was = drawn;
        active().forEach(function(p){
          if(p.id >= openN()){ p.st = 'leave'; if(p.hd){ p.hd.el.remove(); p.hd = null; } twn(p, 'lift', G ? G.k * 2.2 : 30, 420); twn(p, 'op', 0, 420); }
          else { p.v = POOL[p.id]; if(p.hd) p.hd.value(p.v); twn(p, 'h', p.v, 520); }
        });
        St.opening = true;
        for(var i = 0; i < openN(); i++) if(!P.some(function(p){ return p.id === i && p.st !== 'leave'; })){ var q = newPlant(i, POOL[i], 0); q.st = 'sprout'; q.x = 0.5; P.push(q); twn(q, 'h', q.v, 620, 120); if(calm()){ q.h = q.v; q.st = 'grown'; } }
        sortRow(420);
        lastAct = null; cause.take(null); paintN(); paintAll(); kick(); if(calm()){ stopAll(); fade(); }
        void was;
      }
      function fresh(){ build(); lastWH = ''; layoutNow(true); settled(); }
      // a button under the picture on a phone: bring the plants back into view so the change is seen
      function showPic(){ var r = sceneBox.getBoundingClientRect(); if(r.top < 0 && window.scrollBy) window.scrollBy({ top: r.top - 8, behavior: calm() ? 'auto' : 'smooth' }); }
      bAdd.addEventListener('click', function(){ hideCue(true); tourDid('n'); cause.take(null); showPic(); sow(); });
      bRm.addEventListener('click', function(){ hideCue(true); tourDid('n'); cause.take(null); showPic(); pull(); });
      bReset.addEventListener('click', function(){ hideCue(true); showPic(); reset(); });

      /* ---------------------------------------------------- layout */
      var lastWH = '';
      function layoutNow(force){
        fitHeight();
        var key = sceneBox.clientWidth + 'x' + sceneBox.clientHeight;
        if(!force && key === lastWH) return;
        if(!sceneBox.clientWidth) return;
        lastWH = key;
        var g = layout(); if(!g) return;
        G = g; fitN(); leafFor(true); svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H);
        drawStatic();
        P.forEach(function(p){ if(!p.el || !p.el.parentNode){ if(p.el) p.el.remove(); if(p.glow) p.glow.remove(); plantEl(p); } p._c = {}; paintPlant(p); });
        paint();
      }
      // the seed leaves: as big as the plants' spacing allows (fewer plants, bigger leaves), never under 11 px
      function leafFor(instant){
        if(!G) return;
        var to = clamp(Math.min(spacing() * 0.4, G.k * 1.4), 11, G.wide ? 34 : G.big ? 28 : 19);
        if(LF.v == null || instant || calm()){ LF.v = to; LF.tw = null; }
        else if(Math.abs(to - LF.v) > 0.01) LF.tw = { from: LF.v, to: to, t0: now(), dur: 380 };
        G.leaf = LF.v;
      }

      /* ---------------------------------------------------- the two modes (the adapter calls this) */
      var saved = null;
      function snapshot(){ return active().map(function(p){ return { id: p.id, v: p.v }; }); }
      function restore(sv){
        stopAll(); P.forEach(drop); P = sv.map(function(s){ return newPlant(s.id, s.v); });
        sortRow(0); P.forEach(function(p){ p.tw = {}; }); paintN();
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
        setTimeout(function(){ layoutNow(true); settled(); if(ex && !tour.active()){ if(cue.show()) placeCue(); } }, 30);
      }
      ctx.kit2 = { stage: stage, ref: ref, othersLabel: 'On the picture',
        parts: [{ value: 'practice', label: 'Problems', practice: true },
          { value: 'goals', label: 'Challenges', dock: dock, task: { kicker: 'Challenges', title: 'Change the picture to meet each challenge.', todo: 'Drag the plants, add or remove one.' } }],
        onShow: function(m, p){ shown(m, p); } };
      // the practice problems (unchanged): the adapter puts them in Test yourself
      T.skillTool(app, data, { slug: SLUG, kind: 'descriptive', stage: stage0 });
      build();
      if(!ctx.studio){ app.insertBefore(stage, app.firstChild); app.insertBefore(ref, stage.nextSibling); shown('explore', null); }
      // the whole stage stops when it is hidden (Test yourself, "?" on a phone, another page tab)
      if(window.IntersectionObserver) new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting && busy() && !dragP){ stopAll(); paint(); settled(); } }); }).observe(sceneBox);
      document.addEventListener('visibilitychange', function(){ if(document.hidden && busy()){ stopAll(); paint(); settled(); } });
      if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ mCache = {}; lastWH = ''; layoutNow(true); });
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(function(){ if(busy() && !dragP) stopAll(); layoutNow(false); settled(); }, 60); }).observe(sceneBox); }
      window.addEventListener('resize', function(){ fitHeight(); });
      // for the sweep (scripts/tools-v2/bio-descriptive-stats-sweep.mjs): the drawn state and the geometry
      window.__ds2 = { G: function(){ return G; }, P: function(){ return P; }, St: St, busy: busy, drawn: function(){ return drawn; }, mids: function(){ return mids; },
        set: function(hs){ stopAll(); St.opening = false; P.forEach(drop); P = hs.map(function(v, i){ return newPlant(i, v); }); sortRow(0); P.forEach(function(p){ p.tw = {}; }); lastAct = null; cause.take(null); paintN(); layoutNow(true); paint(); settled(); },
        open: function(){ fresh(); }, noCue: function(){ hideCue(true); }, sow: function(){ sow(); }, pull: function(){ pull(); }, reset: function(){ reset(); },
        drag: function(i, v){ var p = active()[i]; if(dragP !== p) begin(p); dragP = p; setH(p, v, true); paintAll(); }, end: function(){ dragP = null; sortRow(); kick(); },
        stopAll: stopAll, fit: fitHeight, openN: function(){ return openN(); }, cap: function(){ return capN(); } };
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApBioBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var l2 = document.createElement('link'); l2.rel = 'stylesheet'; l2.href = (window.ApBioBase || '../') + 'assets/tools/descriptive-stats.css'; document.head.appendChild(l2);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
