/* Simpson's diversity index, tools v2 (docs/tools-v2-standard.md; brief: docs/tools-v2-simpson-diversity-brief.md).
   The one idea: diversity depends on how many species there are AND on how evenly the individuals are spread.

   EXPLORE (free play, nothing graded): a drawn woodland plot with places for trees. The student picks a tree from
   the tray on the picture and taps the plot: a tree there is replaced by it, bare soil is planted, and "Cut"
   removes a tree. D answers that instant on the gauge on the picture: the fill is D, the mark is the most D can
   be with that many species (1 − 1/S), so richness moves the mark and evenness moves the fill toward it. The
   bar under each tree in the tray is that species' share. The line under the picture is the CAUSE LINE
   (K.cause): species + how even -> how often two random trees differ -> D. Every word is read from the trees
   as drawn (vis), never from where a change will end. The numbers and the calculation are behind "?".
   TEST YOURSELF: "Calculate D" is the old Practice, unchanged (ApBioTools.skillTool: seeded problems and the
   worked set, the quadrat of icons and the D meter below); "Build a community" holds the old Explore goals as
   challenges on the same plot.
   The solver and the seeded problem generator are ApBioProblems.solve.simpson and generate.simpson
   (bio-skill-problems.js); the contexts, the fixed problems, the formula box and the Explore plot are data
   (bio/data/tools/simpson-diversity.json). */
(function(){
  'use strict';
  var T = window.ApBioTools, S = window.ApBioSkillStage, M = window.ApBioMath;
  if(!T || !S) return;
  var SLUG = 'simpson-diversity';
  var F = T.F, esc = T.esc;

  /* ============================================================ Test yourself, "Calculate D": the practice figure (unchanged) */
  var SH = ['c', 'q', 't', 'd', 'h', 'p', 'r', 's'];   // circle, square, triangle, diamond, hexagon, pentagon, ring, star
  var CL = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];
  var QW = 260, QH = 260, QX = 8, QY = 8;

  /* One organism: its drawing (ApBioArt) in the species color when there
     is one for the name, else a colored shape. */
  function icon(k, x, y, r, name){
    var A = window.ApBioArt;
    if(A && name && A.has(name)) return A.icon(name, x, y, r * 3.3, 'sd-o ' + CL[k % 8]);
    var c = 'sd-i ' + CL[k % 8], s = SH[k % 8];
    if(s === 'c') return '<circle class="' + c + '" cx="' + x + '" cy="' + y + '" r="' + r + '"/>';
    if(s === 'q') return '<rect class="' + c + '" x="' + (x - r) + '" y="' + (y - r) + '" width="' + 2 * r + '" height="' + 2 * r + '" rx="1.5"/>';
    if(s === 'r') return '<circle class="' + c + ' ring" cx="' + x + '" cy="' + y + '" r="' + (r - 1) + '"/>';
    var n = { t: 3, d: 4, h: 6, p: 5, s: 10 }[s], pts = [];
    for(var i = 0; i < n; i++){ var a = -Math.PI / 2 + i * 2 * Math.PI / n, rr = s === 's' && i % 2 ? r * 0.45 : r * (s === 't' ? 1.2 : 1.05); pts.push((x + rr * Math.cos(a)).toFixed(1) + ',' + (y + rr * Math.sin(a)).toFixed(1)); }
    return '<polygon class="' + c + '" points="' + pts.join(' ') + '"/>';
  }
  /* Fixed jittered grid spots, shuffled by a seed: the same community
     always looks the same, and adding one organism only adds one icon. */
  var spots = null;
  function grid(){
    if(spots) return spots;
    var r = M.rng(7), out = [], cols = 16, rows = 16, cw = QW / cols, ch = QH / rows;
    for(var i = 0; i < rows; i++) for(var j = 0; j < cols; j++) out.push([QX + (j + 0.5) * cw + r.real(-cw * 0.22, cw * 0.22), QY + (i + 0.5) * ch + r.real(-ch * 0.22, ch * 0.22)]);
    spots = r.shuffle(out);
    return spots;
  }
  function quadrat(counts, names){
    var g = grid(), N = M.sum(counts), r = N > 160 ? 4.6 : N > 90 ? 5.6 : 6.6, h = ['<rect class="sd-q" x="' + QX + '" y="' + QY + '" width="' + QW + '" height="' + QH + '" rx="6"/>', '<path class="sd-qgrid" d="M' + (QX + QW / 2) + ' ' + QY + 'V' + (QY + QH) + 'M' + QX + ' ' + (QY + QH / 2) + 'H' + (QX + QW) + '"/>'], k = 0;
    // interleave species so each is scattered: species by organism index
    var order = [];
    var left = counts.slice();
    while(order.length < Math.min(N, g.length)){ for(var s = 0; s < left.length; s++) if(left[s] > 0){ order.push(s); left[s]--; } }
    order.forEach(function(sp, i){ h.push(icon(sp, +g[i][0].toFixed(1), +g[i][1].toFixed(1), r, names && names[sp])); });
    if(N > g.length) h.push('<text class="sk-ph" x="' + (QX + 4) + '" y="' + (QY + QH + 14) + '">' + g.length + ' of ' + N + ' shown</text>');
    return h.join('');
  }
  /* D meter: a vertical bar from 0 (bottom) to 1; Σ(n/N)² stacked from the
     top by species, D is what is left. */
  function meter(counts, Dtrue, Dmine){
    var x = QX + QW + 34, y0 = QY, hh = QH, w = 30, h = [], s = M.sum(counts) ? M.simpson(counts) : null;  // zero counts give zero squares, so colors stay with their species
    h.push('<rect class="sd-mbg" x="' + x + '" y="' + y0 + '" width="' + w + '" height="' + hh + '" rx="4"/>');
    if(Dtrue != null && s){
      var yy = y0;
      s.squares.forEach(function(q, k){ var hgt = q * hh; if(hgt > 0.3) h.push('<rect class="sd-i ' + CL[k % 8] + ' sd-sq" x="' + x + '" y="' + yy.toFixed(1) + '" width="' + w + '" height="' + hgt.toFixed(1) + '"/>'); yy += hgt; });
      h.push('<rect class="sd-D" x="' + x + '" y="' + yy.toFixed(1) + '" width="' + w + '" height="' + (y0 + hh - yy).toFixed(1) + '"/>');
      h.push('<line class="sd-lev" x1="' + (x - 6) + '" x2="' + (x + w + 6) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/><text class="sd-Dl" x="' + (x + w + 9) + '" y="' + (yy + 5).toFixed(1) + '">D = ' + F(Dtrue, 2) + '</text>');
    }
    if(Dmine != null && isFinite(Dmine)){ var ym = y0 + (1 - Math.max(0, Math.min(1, Dmine))) * hh; h.push('<line class="sd-lev mine" x1="' + (x - 8) + '" x2="' + (x + w + 8) + '" y1="' + ym.toFixed(1) + '" y2="' + ym.toFixed(1) + '"/><text class="sd-Dl mine" x="' + (x + w + 9) + '" y="' + (ym + (Dtrue != null && Math.abs(ym - (y0 + (1 - Dtrue) * hh)) < 16 ? 18 : 5)).toFixed(1) + '">your D ' + F(Dmine, 2) + '</text>'); }
    [0, 0.5, 1].forEach(function(v){ h.push('<text class="tick" x="' + (x - 8) + '" y="' + (y0 + (1 - v) * hh + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>'); });
    h.push('<text class="sk-ph" x="' + (x + w / 2) + '" y="' + (y0 + hh + 16) + '" text-anchor="middle">D</text>');
    return h.join('');
  }


  /* ---------------------------------------------------- practice stage */
  function practiceStage(host, s){
    var x = s.input, a = s.answers || {}, chk = s.phase === 'checked', counts = x.species.map(function(sp){ return sp.n; }), sim = M.simpson(counts);
    var Dm = S.num(a.D);
    var svg = '<svg class="bio-svg" viewBox="0 0 400 290" role="img" aria-label="' + esc('Quadrat with ' + x.species.map(function(sp){ return sp.n + ' ' + sp.name; }).join(', ') + '.' + (chk ? ' D = ' + F(sim.D, 2) + '.' : '')) + '">' + quadrat(counts, x.species.map(function(sp){ return sp.name; })) + meter(counts, chk ? sim.D : null, isFinite(Dm) ? Dm : null) + '</svg>';
    var big = 0; counts.forEach(function(n, k){ if(n > counts[big]) big = k; });
    var cap = chk ? 'The colored blocks on the meter are each species’ (n/N)²; D is the outlined part left over. ' + esc(x.species[big].name) + ' has the biggest block: the more one species dominates, the lower D.'
      : isFinite(Dm) ? 'Your D is marked on the meter. Does it fit the picture? A quadrat dominated by one species should score low; an even mix of many species, high.'
      : 'One icon per organism counted (each species its own shape). Before you calculate: does this look diverse? Type D and it is marked on the meter.';
    var key = '<p class="sd-key">' + x.species.map(function(sp, k){ return '<span><svg class="sd-sw" viewBox="0 0 20 20" aria-hidden="true">' + icon(k, 10, 10, 6.5, sp.name) + '</svg>' + esc(sp.name) + ' ' + sp.n + '</span>'; }).join('') + '</p>';
    S.redraw(host, '<div class="sk-fig">' + svg + '</div>' + key + '<p class="sk-cap">' + cap + '</p>');
  }


  /* ============================================================ Explore: the woodland plot */
  /* One tree, in its own units: the base of the trunk at (0, 0), the top near y = −100. Each species has its own
     outline as well as its own colour, so it is never told apart by colour alone. flat: plain fills (the tray and
     "?" icons; the scene's gradients may be hidden with the stage). */
  function circles(list, grow){ return list.map(function(c){ return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + (c[2] + (grow || 0)) + '"/>'; }).join(''); }
  var ART = [
    function(){   // oak: a short thick trunk and a broad round crown
      var c = [[-15, -56, 16], [15, -55, 16], [-20, -72, 13], [20, -72, 13], [0, -66, 20], [-8, -84, 14], [9, -85, 13]];
      return '<path class="sd2-trunk" d="M-6 0C-4-14-5-24-8-38L-1-40L0-30L3-42L9-38C6-26 5-12 7 0Z"/>' +
        '<g class="sd2-ol">' + circles(c, 1.5) + '</g><g class="sd2-cr sd2-cr0">' + circles(c) + '</g>' +
        '<g class="sd2-lo">' + circles([[12, -50, 9], [-14, -50, 8], [4, -58, 8]]) + '</g><g class="sd2-hi">' + circles([[-10, -82, 7], [8, -72, 6], [-19, -68, 5]]) + '</g>';
    },
    function(){   // pine: three tiers on a straight trunk
      var t = ['M-27-17L0-54L27-17Q0-8-27-17Z', 'M-22-40L0-75L22-40Q0-32-22-40Z', 'M-16-62L0-99L16-62Q0-55-16-62Z'];
      return '<path class="sd2-trunk" d="M-3.5 0L-3-22L3-22L3.5 0Z"/>' + t.map(function(d){ return '<path class="sd2-cr sd2-cr1 sd2-olp" d="' + d + '"/>'; }).join('') +
        '<path class="sd2-hil" d="M-15-22L-5-38M-12-44L-4-58M-8-66L-2-80"/>';
    },
    function(){   // birch: a thin white trunk with dark marks and a narrow crown
      var c = [[0, -81, 16], [-8, -64, 14], [8, -62, 14], [0, -50, 13]];
      return '<path class="sd2-trunk sd2-birch" d="M-3.4 0L-2.6-62L2.6-62L3.4 0Z"/><path class="sd2-bmark" d="M-3-8L1-9M3-18L-1-19M-3-28L1-29M3-36L0-37"/>' +
        '<g class="sd2-ol">' + circles(c, 1.5) + '</g><g class="sd2-cr sd2-cr2">' + circles(c) + '</g>' +
        '<g class="sd2-lo">' + circles([[6, -54, 7], [-6, -52, 6]]) + '</g><g class="sd2-hi">' + circles([[-5, -86, 6], [-10, -68, 5]]) + '</g>';
    },
    function(){   // maple: a crown of five points
      var p = [], i, a, r;
      for(i = 0; i < 10; i++){ a = -Math.PI / 2 + i * Math.PI / 5; r = i % 2 ? 21 : 32; p.push((r * Math.cos(a)).toFixed(1) + ',' + (-64 + r * Math.sin(a)).toFixed(1)); }
      return '<path class="sd2-trunk" d="M-4.5 0C-3.5-12-4-24-5-36L5-36C4-24 3.5-12 4.5 0Z"/>' +
        '<polygon class="sd2-cr sd2-cr3 sd2-olp sd2-round" points="' + p.join(' ') + '"/>' +
        '<g class="sd2-lo">' + circles([[8, -54, 8]]) + '</g><g class="sd2-hi">' + circles([[-7, -74, 7], [-13, -60, 4]]) + '</g>';
    },
    function(){   // cherry: a slender forked trunk and a low crown in blossom
      var c = [[-14, -56, 14], [14, -56, 14], [0, -71, 16], [0, -55, 13]];
      return '<path class="sd2-trunk sd2-cherry" d="M-3.5 0C-3-12-3.5-22-8-38L-3-40L0-30L4-41L8-38C4-24 3-12 3.5 0Z"/>' +
        '<g class="sd2-ol">' + circles(c, 1.5) + '</g><g class="sd2-cr sd2-cr4">' + circles(c) + '</g>' +
        '<g class="sd2-lo">' + circles([[10, -50, 7], [-12, -50, 6]]) + '</g><g class="sd2-bl">' + circles([[-8, -76, 2.6], [6, -66, 2.6], [-17, -60, 2.4], [15, -62, 2.4], [1, -80, 2.2], [-3, -58, 2.4], [9, -48, 2.2]]) + '</g>';
    }
  ];
  function treeArt(k){ return ART[k % ART.length](); }
  function treeIcon(k){ return '<svg class="sd2-ico sd2-flat" viewBox="-36 -104 72 108" aria-hidden="true" focusable="false">' + treeArt(k) + '</svg>'; }
  var AXE = '<svg class="sd2-ico sd2-axe" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path class="sd2-axe-h" d="M9 33L25 13"/><path class="sd2-axe-b" d="M21 8C26 6 32 8 35 13L27 21C25 17 23 14 19 12Z"/><ellipse class="sd2-axe-s" cx="12" cy="35" rx="9" ry="2.6"/></svg>';

  function boot(){
    var K = window.LevlKit2;
    T.mount(SLUG, function(app, data, ctx){
      var EX = data.explore, SP = EX.species, NS = SP.length, SPOTS = EX.spots, CUT = -1;
      function lower(k){ return SP[k].name.toLowerCase(); }
      /* The opening plot: which places hold which tree. A fixed shuffle, so the plot always opens the same. */
      var ORDER = M.rng(11).shuffle(Array.apply(null, { length: SPOTS }).map(function(_, i){ return i; }));
      function startPlot(){ var m = [], at = 0; for(var i = 0; i < SPOTS; i++) m.push(CUT); EX.start.forEach(function(n, k){ for(var j = 0; j < n; j++) m[ORDER[at++]] = k; }); return m; }
      var JIT = (function(){ var r = M.rng(23), o = []; for(var i = 0; i < SPOTS; i++) o.push([r.real(-1, 1), r.real(-1, 1)]); return o; })();
      var model = startPlot(), vis = model.slice(), timers = {}, pick = Math.max(0, SP.map(function(s){ return s.id; }).indexOf(EX.plant));
      var St = { mode: 'explore', part: null }, took = false, lastD = null, arrowT = null;
      function tally(list){
        var c = SP.map(function(){ return 0; }), N = 0; list.forEach(function(k){ if(k > CUT){ c[k]++; N++; } });
        var pres = c.filter(function(n){ return n > 0; }), s = N ? M.simpson(pres) : null;
        return { counts: c, N: N, S: pres.length, D: s ? s.D : null, sumSq: s ? s.sumSq : null, max: pres.length ? 1 - 1 / pres.length : null };
      }
      var START = tally(model);

      // The page's own blocks. The adapter moves them: About, and the practice problems into Test yourself.
      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'sd2';
      var head = K.head({ purpose: 'See what makes a community more diverse.', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'sd2-scene'; sceneBox.id = T.nid('sd2');
      sceneBox.innerHTML = '<svg class="sd2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="sd2-static"></g><g class="sd2-plot"></g></svg>' +
        '<div class="sd2-gauge" role="group" aria-label="Simpson’s diversity index of this plot"><span class="sd2-g-k">Diversity</span><span class="sd2-g-v"><b></b><i class="sd2-g-d" aria-hidden="true"></i></span>' +
        '<span class="sd2-g-row"><span class="sd2-g-e">0</span><span class="sd2-g-bar"><i class="sd2-g-fill"></i><i class="sd2-g-max"></i></span><span class="sd2-g-e">1</span></span><span class="sd2-g-maxl"></span></div>' +
        '<div class="sd2-tray" role="radiogroup" aria-label="What a tap on the plot does"><span class="sd2-tray-k" aria-hidden="true">Plant</span>' +
        SP.map(function(s, k){ return '<button type="button" class="sd2-chip" role="radio" data-k="' + k + '">' + treeIcon(k) + '<span class="sd2-chip-n">' + esc(s.name) + '</span><b class="sd2-chip-c"></b><span class="sd2-chip-bar" aria-hidden="true"><i></i></span></button>'; }).join('') +
        '<button type="button" class="sd2-chip is-cut" role="radio" data-k="' + CUT + '">' + AXE + '<span class="sd2-chip-n">Cut</span></button></div>';
      stage.appendChild(sceneBox);
      var svg = sceneBox.querySelector('svg'), gStatic = svg.querySelector('.sd2-static'), gPlot = svg.querySelector('.sd2-plot'), layer = K.layer(sceneBox), G = null;
      var gauge = sceneBox.querySelector('.sd2-gauge'), tray = sceneBox.querySelector('.sd2-tray'), chips = Array.prototype.slice.call(tray.querySelectorAll('.sd2-chip'));
      var lines = document.createElement('div'); lines.className = 'sd2-lines';
      var cause = K.cause({ label: 'Why' });
      var acts = document.createElement('div'); acts.className = 'sd2-acts';
      acts.innerHTML = '<button type="button" class="tk2-btn sd2-even">Even it out</button><button type="button" class="tk2-link sd2-reset">Start over</button>';
      var bEven = acts.querySelector('.sd2-even'), bReset = acts.querySelector('.sd2-reset');
      lines.appendChild(cause.el); lines.appendChild(acts);
      stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }
      // the places as real buttons (keys and screen readers); the pointer is read from the picture itself (hit())
      var spotBtns = [];
      (function(){ for(var i = 0; i < SPOTS; i++){ var b = document.createElement('button'); b.type = 'button'; b.className = 'sd2-spotb'; b.setAttribute('data-i', i); b.tabIndex = i ? -1 : 0; layer.el.appendChild(b); spotBtns.push(b); } })();

      /* ---- the picture */
      function n1(v){ return Math.round(v * 10) / 10; }
      function layout(){
        var W = sceneBox.clientWidth, H = sceneBox.clientHeight;
        if(!W || !H) return null;
        var phone = W < 600, cols = phone ? 6 : 9, rows = SPOTS / cols, sky = Math.max(gauge.offsetHeight + (phone ? 16 : 22), phone ? 84 : 100), trayH = tray.offsetHeight + (phone ? 6 : 10);
        var pad = phone ? 10 : Math.max(24, W * 0.035), colW = (W - 2 * pad) / cols, th = Math.max(54, Math.min(colW * 1.2, 150));
        var yN = H - trayH - (phone ? 12 : 16), back = 0.86, y0 = sky + back * th + 6, pitch = (yN - y0) / (rows - 1);
        if(pitch < th * 0.4){ th = Math.max(48, th * (pitch / (th * 0.4)) * 0.94 + 0); y0 = sky + back * th + 6; pitch = (yN - y0) / (rows - 1); }
        var cx = W / 2, spots = [];
        for(var i = 0; i < SPOTS; i++){
          var r = Math.floor(i / cols), c = i % cols, f = rows > 1 ? r / (rows - 1) : 1, s = back + (1 - back) * f, persp = 0.93 + 0.07 * f;
          var x0 = pad + (c + 0.5) * colW + (r % 2 ? 0.16 : -0.16) * colW + JIT[i][0] * colW * 0.1;
          spots.push({ x: cx + (x0 - cx) * persp, y: y0 + r * pitch + JIT[i][1] * pitch * 0.1, s: s, k: th * s / 100, row: r, col: c });
        }
        return { W: W, H: H, phone: phone, cols: cols, rows: rows, sky: sky, pad: pad, colW: colW, th: th, y0: y0, yN: yN, pitch: pitch, spots: spots, trayTop: H - trayH };
      }
      function staticSvg(){
        var W = G.W, H = G.H, sky = G.sky, h = [], r = M.rng(5), i;
        h.push('<defs><linearGradient id="sd2g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sd2s-sky0"/><stop offset="1" class="sd2s-sky1"/></linearGradient>' +
          '<linearGradient id="sd2g-gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sd2s-gr0"/><stop offset="1" class="sd2s-gr1"/></linearGradient>' +
          '<linearGradient id="sd2g-pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sd2s-pl0"/><stop offset="1" class="sd2s-pl1"/></linearGradient>' +
          [0, 1, 2, 3, 4].map(function(k){ return '<radialGradient id="sd2g-c' + k + '" gradientUnits="userSpaceOnUse" cx="-8" cy="-80" r="62"><stop offset="0" class="sd2s-c' + k + 'a"/><stop offset="1" class="sd2s-c' + k + 'b"/></radialGradient>'; }).join('') + '</defs>');
        h.push('<rect class="sd2-sky" x="0" y="0" width="' + W + '" height="' + (sky + 4) + '"/>');
        // far hills and one soft band of far woodland: a place, not things to count
        var d = 'M0 ' + sky, n = Math.max(4, Math.round(W / 220)), x, y;
        for(i = 0; i <= n; i++){ x = W * i / n; y = sky - (0.28 + 0.2 * Math.sin(i * 2.1 + 0.6)) * sky; d += (i ? 'S' + n1(x - W / n / 2) + ' ' + n1(y - 10) + ' ' : 'L') + n1(x) + ' ' + n1(y) + ' '; }
        h.push('<path class="sd2-hill" d="' + d + 'L' + W + ' ' + sky + 'Z"/>');
        d = 'M0 ' + (sky + 2) + 'L0 ' + n1(sky - 12);
        var bumps = Math.round(W / 26);
        for(i = 1; i <= bumps; i++){ x = W * i / bumps; d += 'Q' + n1(x - W / bumps / 2) + ' ' + n1(sky - 13 - r.real(5, 15)) + ' ' + n1(x) + ' ' + n1(sky - 10 - r.real(0, 4)) + ' '; }
        h.push('<path class="sd2-far" d="' + d + 'L' + W + ' ' + (sky + 2) + 'Z"/>');
        h.push('<rect class="sd2-ground" x="0" y="' + sky + '" width="' + W + '" height="' + (H - sky) + '"/>');
        // the plot: a roped square of woodland floor, seen from a little above
        var top = G.y0 - G.pitch * 0.62 - 4, bot = Math.min(G.trayTop - 5, G.yN + G.pitch * 0.34 + 8), inT = G.pad * 0.5 + W * 0.035, inB = Math.max(5, G.pad * 0.35);
        top = Math.max(sky + 8, top);
        var P = [[inT, top], [W - inT, top], [W - inB, bot], [inB, bot]];
        h.push('<polygon class="sd2-floor" points="' + P.map(function(p){ return n1(p[0]) + ',' + n1(p[1]); }).join(' ') + '"/>');
        var fl = Math.round(W * (H - sky) / 5200);
        for(i = 0; i < fl; i++){ y = r.real(top + 6, bot - 4); var f = (y - top) / (bot - top), xa = inT + (inB - inT) * f + 8; x = r.real(xa, W - xa); h.push('<ellipse class="sd2-leaf sd2-leaf' + (i % 3) + '" cx="' + n1(x) + '" cy="' + n1(y) + '" rx="' + n1(r.real(2.2, 4.4)) + '" ry="' + n1(r.real(1, 1.8)) + '" transform="rotate(' + Math.round(r.real(-40, 40)) + ' ' + n1(x) + ' ' + n1(y) + ')"/>'); }
        h.push('<polygon class="sd2-rope" points="' + P.map(function(p){ return n1(p[0]) + ',' + n1(p[1]); }).join(' ') + '"/>');
        P.forEach(function(p){ h.push('<path class="sd2-stake" d="M' + n1(p[0] - 2.5) + ' ' + n1(p[1] + 3) + 'L' + n1(p[0] - 2) + ' ' + n1(p[1] - 11) + 'L' + n1(p[0] + 2) + ' ' + n1(p[1] - 11) + 'L' + n1(p[0] + 2.5) + ' ' + n1(p[1] + 3) + 'Z"/>'); });
        G.floor = { top: top, bot: bot };
        return h.join('');
      }
      /* One place: its tree as drawn (vis), or bare soil. */
      function spotInner(i, cls){
        var k = vis[i];
        if(k === CUT) return '<g class="sd2-soil' + (cls ? ' ' + cls : '') + '"><ellipse class="sd2-soil-a" cx="0" cy="0" rx="17" ry="5.6"/><ellipse class="sd2-soil-b" cx="-2" cy="-1" rx="10" ry="2.8"/></g>';
        return '<ellipse class="sd2-shadow" cx="5" cy="1" rx="24" ry="5.5"/><g class="sd2-tree' + (cls ? ' ' + cls : '') + '" data-sp="' + k + '">' + treeArt(k) + '</g>';
      }
      var spotG = [];
      function buildPlot(){
        gPlot.innerHTML = G.spots.map(function(p, i){ return '<g class="sd2-spot" data-i="' + i + '" transform="translate(' + n1(p.x) + ' ' + n1(p.y) + ') scale(' + p.k.toFixed(3) + ')">' + spotInner(i) + '</g>'; }).join('');
        spotG = Array.prototype.slice.call(gPlot.children);
      }
      function layoutNow(){
        var g = layout(); if(!g) return;
        var same = G && g.W === G.W && g.H === G.H && g.sky === G.sky && g.trayTop === G.trayTop;
        G = g;
        if(!same){
          svg.setAttribute('viewBox', '0 0 ' + G.W + ' ' + G.H);
          gStatic.innerHTML = staticSvg();
          buildPlot();
          G.spots.forEach(function(p, i){ var b = spotBtns[i], w = Math.min(G.colW - 4, 64), hh = Math.max(40, Math.min(G.pitch, 56)); b.style.left = (p.x - w / 2) + 'px'; b.style.top = (p.y - hh + 8) + 'px'; b.style.width = w + 'px'; b.style.height = hh + 'px'; });
        }
        cue.place(); if(tour.active()) tour.place();
      }

      /* ---- what a tap does */
      function hit(px, py){
        if(!G) return -1;
        var i, p, best = -1;
        for(i = SPOTS - 1; i >= 0; i--){ p = G.spots[i]; if(model[i] > CUT || vis[i] > CUT){ var tw = G.th * p.s; if(Math.abs(px - p.x) <= tw * 0.31 && py <= p.y + 6 && py >= p.y - tw) return i; } }
        var bd = 1e9;
        for(i = 0; i < SPOTS; i++){ p = G.spots[i]; var dx = (px - p.x) / (G.colW * 0.5), dy = (py - (p.y - G.pitch * 0.12)) / (G.pitch * 0.5), dd = dx * dx + dy * dy; if(Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && dd < bd){ bd = dd; best = i; } }
        return best;
      }
      function calm(){ return K.reduced() || !window.requestAnimationFrame; }
      function restart(el, cls){ if(!el) return; el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); }
      /* The tree at place i changes to what the model says. The words follow the trees as drawn: vis[i] flips when
         the old tree is gone (and the new one is growing), never before. */
      function paintSpot(i, cls){ if(spotG[i]) spotG[i].innerHTML = spotInner(i, cls); }
      function flip(i){ timers[i] = null; var was = vis[i]; vis[i] = model[i]; paintSpot(i, vis[i] === CUT ? (was === CUT ? '' : 'is-in') : 'is-in'); syncWords(); }
      function animate(i){
        if(timers[i]) return;                     // the running change will land on the latest choice
        if(vis[i] === model[i]) return;
        if(calm()){ var w = vis[i]; vis[i] = model[i]; paintSpot(i, 'is-fade'); syncWords(); return; }
        if(vis[i] === CUT){ flip(i); return; }  // bare soil: the tree grows in at once
        var t = spotG[i] && spotG[i].querySelector('.sd2-tree'), cutting = model[i] === CUT;
        if(t) t.classList.add(cutting ? 'is-cut' : 'is-out');
        timers[i] = setTimeout(function(){ flip(i); }, cutting ? 250 : 170);
      }
      function busy(){ for(var k in timers) if(timers[k]) return true; return false; }
      function setSpot(i, k){ if(model[i] === k) return false; model[i] = k; animate(i); return true; }
      function nudge(i){
        var t = spotG[i] && spotG[i].querySelector('.sd2-tree, .sd2-soil'); restart(t, 'is-same');
        restart(chips[pick === CUT ? NS : pick], 'is-same');
      }
      function act(i){
        hideCue(true); tourDid('tap'); took = false;
        var was = model[i];
        if(was === pick){ nudge(i); say(pick === CUT ? 'Bare soil. Nothing to cut here.' : 'This tree is already ' + aAn(lower(pick)) + '.'); return; }
        stopRuns();
        setSpot(i, pick);
        var t = tally(model), what = pick === CUT ? 'Cut one ' + lower(was) + '.' : was === CUT ? 'Planted ' + aAn(lower(pick)) + '.' : 'Replaced ' + aAn(lower(was)) + ' with ' + aAn(lower(pick)) + '.';
        say(what + ' ' + (t.N ? t.N + ' tree' + (t.N === 1 ? '' : 's') + ', ' + t.S + ' species, D = ' + F(t.D, 2) + '.' : 'No trees left.'));
      }
      function aAn(w){ return (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w; }
      sceneBox.addEventListener('click', function(e){
        if(e.target.closest && e.target.closest('.sd2-tray, .sd2-gauge, .tk2-cue, .tk2-tour')) return;
        var bt = e.target.closest && e.target.closest('.sd2-spotb');
        if(bt){ act(+bt.getAttribute('data-i')); return; }      // a key press or a screen reader's activation
        var r = sceneBox.getBoundingClientRect(), i = hit(e.clientX - r.left, e.clientY - r.top);
        if(i > -1){ act(i); focusSpot(i, true); }
      });
      // a mouse shows what a click would act on
      var hot = -1;
      function setHot(i){ if(i === hot) return; if(hot > -1 && spotG[hot]) spotG[hot].classList.remove('is-hot'); hot = i; if(hot > -1 && spotG[hot]) spotG[hot].classList.add('is-hot'); sceneBox.classList.toggle('is-point', hot > -1); }
      sceneBox.addEventListener('pointermove', function(e){ if(e.pointerType !== 'mouse') return; if(e.target.closest && e.target.closest('.sd2-tray, .sd2-gauge')){ setHot(-1); return; } var r = sceneBox.getBoundingClientRect(); setHot(hit(e.clientX - r.left, e.clientY - r.top)); });
      sceneBox.addEventListener('pointerleave', function(){ setHot(-1); });
      function focusSpot(i, quiet){ spotBtns.forEach(function(b, j){ b.tabIndex = j === i ? 0 : -1; }); if(!quiet) try{ spotBtns[i].focus({ preventScroll: true }); }catch(e){} }
      layer.el.addEventListener('keydown', function(e){
        var b = e.target.closest && e.target.closest('.sd2-spotb'); if(!b || !G) return;
        var i = +b.getAttribute('data-i'), j = i;
        if(e.key === 'ArrowRight') j = i + 1; else if(e.key === 'ArrowLeft') j = i - 1; else if(e.key === 'ArrowDown') j = i + G.cols; else if(e.key === 'ArrowUp') j = i - G.cols; else if(e.key === 'Home') j = 0; else if(e.key === 'End') j = SPOTS - 1; else return;
        e.preventDefault(); if(j < 0 || j >= SPOTS) return; focusSpot(j);
      });
      /* ---- the tray: what a tap plants (or Cut) */
      function setPick(k, user){
        pick = k;
        chips.forEach(function(c){ var on = +c.getAttribute('data-k') === k; c.setAttribute('aria-checked', on ? 'true' : 'false'); c.tabIndex = on ? 0 : -1; });
        sceneBox.setAttribute('data-pick', k === CUT ? 'cut' : 'plant');
        if(user){ hideCue(false); tourDid('pick'); spotLabels(); say(k === CUT ? 'Cut. Tap a tree to remove it.' : SP[k].name + '. Tap a tree to replace it, or bare soil to plant one.'); }
      }
      tray.addEventListener('click', function(e){ var c = e.target.closest('.sd2-chip'); if(c) setPick(+c.getAttribute('data-k'), true); });
      tray.addEventListener('keydown', function(e){
        var c = e.target.closest('.sd2-chip'); if(!c) return;
        var i = chips.indexOf(c), j = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? chips.length - 1 : -9;
        if(j === -9) return;
        e.preventDefault(); j = (j + chips.length) % chips.length; setPick(+chips[j].getAttribute('data-k'), true); chips[j].focus({ preventScroll: true });
      });

      /* ---- the one cue, and "Show me how" */
      function cueSpot(){ var want = G ? G.cols + 1 : 0, i; for(i = want; i < SPOTS; i++) if(vis[i] > CUT) return i; return want; }
      var cue = K.cue(layer, { key: 'apbio-simpson', text: 'Tap a tree', side: 'right', at: function(){ if(!G) return [0, 0]; var p = G.spots[cueSpot()]; return [p.x + G.th * p.s * 0.2, p.y - G.th * p.s * 0.55]; } });
      function hideCue(used){ if(cue.active()) cue.hide(used); }
      var tour = K.tour({ key: 'apbio-simpson', label: 'Show me how', steps: [
        { id: 'pick', text: 'Pick a tree to plant, or Cut.', target: function(){ return tray; } },
        { id: 'tap', text: 'Tap a tree to replace it. Tap bare soil to plant.', target: function(){ return spotBtns[cueSpot()]; } },
        { id: 'read', text: 'Watch D, and read why on the line below.', target: function(){ return gauge; } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      function tourDid(id){ if(tour.active()) tour.did(id); }
      function startTour(){ if(St.mode !== 'explore') return; hideCue(false); tour.start(true); }

      /* ---- the words: all read from the trees as drawn */
      function evenWord(t){
        var pres = t.counts.filter(function(n){ return n > 0; }), mx = Math.max.apply(null, pres), mn = Math.min.apply(null, pres);
        if(mx - mn <= 1) return { t: 'evenly spread', say: 'spread evenly' };
        if(mx / t.N > 0.5){ var k = t.counts.indexOf(mx); return { t: 'mostly ' + lower(k), say: 'mostly ' + lower(k) + ', ' + mx + ' of ' + t.N }; }
        return { t: 'uneven', say: 'spread unevenly' };
      }
      function chain(t){
        if(!t.N) return [{ t: 'No trees', role: 'ink' }, { t: 'nothing to measure', role: 'ink' }];
        if(t.S === 1) return [{ t: '1 species', role: 'rich' }, { t: 'any 2 trees match', role: 'ink', say: 'any two trees picked at random are the same species' }, { t: 'D = 0', role: 'div', say: 'D is 0' }];
        var e = evenWord(t), pct = Math.round(t.D * 100);
        return [{ t: t.S + ' species', role: 'rich' }, { t: e.t, say: e.say, role: 'even', join: '+' },
          { t: '2 random trees differ ' + pct + '%', role: 'ink', say: 'two trees picked at random are different species ' + pct + ' percent of the time' }, { t: 'D = ' + F(t.D, 2), role: 'div', say: 'D is ' + F(t.D, 2) }];
      }
      function spotLabels(){
        spotBtns.forEach(function(b, i){
          var k = model[i], here = k === CUT ? 'Bare soil' : SP[k].name, does = pick === CUT ? (k === CUT ? 'nothing to cut' : 'press to cut it down') : k === CUT ? 'press to plant ' + aAn(lower(pick)) : k === pick ? 'already ' + aAn(lower(pick)) : 'press to replace it with ' + aAn(lower(pick));
          b.setAttribute('aria-label', 'Row ' + (G ? G.spots[i].row + 1 : 1) + ', place ' + (G ? G.spots[i].col + 1 : i + 1) + ': ' + here + ', ' + does);
        });
      }
      function syncWords(){
        var t = tally(vis), D = t.D;
        // the tray: how many of each, and its share of the trees
        chips.forEach(function(c){ var k = +c.getAttribute('data-k'); if(k === CUT) return; var n = t.counts[k]; c.querySelector('.sd2-chip-c').textContent = n; c.querySelector('.sd2-chip-bar i').style.width = (t.N ? 100 * n / t.N : 0).toFixed(1) + '%'; c.classList.toggle('is-none', !n);
          c.setAttribute('aria-label', SP[k].name + ': ' + n + ' of ' + t.N + ' trees. Plant ' + lower(k)); });
        // the gauge: D is the fill, the mark is the most D can be with this many species
        gauge.querySelector('.sd2-g-v b').textContent = D == null ? 'D –' : 'D = ' + F(D, 2);
        gauge.querySelector('.sd2-g-fill').style.width = (D == null ? 0 : 100 * D).toFixed(1) + '%';
        var mk = gauge.querySelector('.sd2-g-max'), ml = gauge.querySelector('.sd2-g-maxl');
        mk.hidden = ml.hidden = !t.S;
        if(t.S){ mk.style.left = (100 * t.max).toFixed(1) + '%'; ml.textContent = t.S + ' species max'; ml.style.setProperty('--at', (100 * t.max).toFixed(1) + '%'); }
        gauge.classList.toggle('is-full', t.S > 1 && D >= t.max - 1e-9);
        var ar = gauge.querySelector('.sd2-g-d');
        if(lastD != null && D != null && Math.abs(D - lastD) > 0.0005){ ar.textContent = D > lastD ? '▲' : '▼'; ar.className = 'sd2-g-d is-on ' + (D > lastD ? 'is-up' : 'is-down'); clearTimeout(arrowT); arrowT = setTimeout(function(){ ar.className = 'sd2-g-d'; }, 2400); }
        lastD = D;
        if(!took) cause.set(chain(t));
        svg.setAttribute('aria-label', t.N ? 'A woodland plot with ' + SP.map(function(s, k){ return t.counts[k] ? t.counts[k] + ' ' + lower(k) : ''; }).filter(Boolean).join(', ') + '. Simpson’s diversity index D = ' + F(D, 2) + '.' : 'A woodland plot with no trees.');
        var ev = tally(model), pr = ev.counts.filter(function(n){ return n > 0; });
        bEven.disabled = !ev.N || ev.S < 2 || Math.max.apply(null, pr) - Math.min.apply(null, pr) <= 1;
        spotLabels(); refHtml(); goals(t);
        stage.setAttribute('data-n', t.N); stage.setAttribute('data-s', t.S); stage.setAttribute('data-d', D == null ? '' : F(D, 3));
      }

      /* ---- the two buttons under the picture */
      var runT = [];
      function stopRuns(){ runT.forEach(clearTimeout); runT = []; }
      function intoView(){ try{ var r = sceneBox.getBoundingClientRect(), vh = window.innerHeight || 0; if(r.top < 0 || r.bottom > vh) sceneBox.scrollIntoView({ block: r.height > vh ? 'start' : 'center', behavior: calm() ? 'auto' : 'smooth' }); }catch(e){} }
      function evenOut(){
        var t = tally(model); if(!t.N || t.S < 2) return;
        hideCue(true); stopRuns(); took = false; intoView();
        var idx = []; t.counts.forEach(function(n, k){ if(n > 0) idx.push(k); });
        idx.sort(function(a, b){ return t.counts[b] - t.counts[a]; });
        var share = M.apportion(idx.map(function(){ return 1 / idx.length; }), t.N).slice().sort(function(a, b){ return b - a; });
        var pool = [], need = [];
        idx.forEach(function(k, j){
          var extra = t.counts[k] - share[j], i;
          if(extra > 0){ for(i = ORDER.length - 1; i >= 0 && extra > 0; i--) if(model[ORDER[i]] === k){ pool.push(ORDER[i]); extra--; } }
          else for(i = 0; i < -extra; i++) need.push(k);
        });
        var before = t.D, step = calm() ? 0 : 70;
        pool.forEach(function(sp, j){ runT.push(setTimeout(function(){ setSpot(sp, need[j]); }, j * step)); });
        runT.push(setTimeout(function(){
          var a = tally(model); took = true;
          var line = 'Same ' + a.N + ' trees, same ' + a.S + ' species, now evenly spread: D rose from ' + F(before, 2) + ' to ' + F(a.D, 2) + '.';
          cause.take(line); say(line);
        }, pool.length * step + (calm() ? 60 : 520)));
      }
      function reset(quiet){
        stopRuns(); took = false;
        var m = startPlot(), n = 0, step = calm() ? 0 : 22;
        m.forEach(function(k, i){ if(model[i] !== k){ (function(i, k, j){ runT.push(setTimeout(function(){ setSpot(i, k); }, j * step)); })(i, k, n++); } });
        setPick(Math.max(0, SP.map(function(s){ return s.id; }).indexOf(EX.plant)), false);
        if(!quiet){ intoView(); say('Back to the start: ' + EX.start.map(function(c, k){ return c ? c + ' ' + lower(k) : ''; }).filter(Boolean).join(', ') + '.'); }
        if(!n) syncWords();
      }
      bEven.addEventListener('click', evenOut);
      bReset.addEventListener('click', function(){ hideCue(true); reset(false); });

      /* ---- "?": the numbers and the calculation for the plot as it is now */
      var ref = document.createElement('div'); ref.className = 'ls-sec sd2-ref';
      ref.innerHTML = '<h3 class="ls-title-l">This plot, calculated</h3><div class="sd2-ref-live"></div>' +
        '<p class="sd2-ref-p"><b>What D means.</b> Pick one tree at random, put it back, and pick again. D is the chance that the two trees are different species. More species, in more even numbers, make that chance higher.</p>' +
        '<p class="sd2-ref-p"><b>On the picture.</b> The blue bar is D. The mark is the most D can be with that many species, 1 − 1/S, reached when every species has the same number of trees. The bar under each tree in the tray is its share of the trees. The plot holds up to ' + SPOTS + ' trees.</p>' +
        '<p class="sd2-ref-p"><button type="button" class="tk2-how sd2-ref-how">Show me how</button> <button type="button" class="tk2-link sd2-ref-prac">Practice the calculation</button></p>';
      var refLive = ref.querySelector('.sd2-ref-live');
      ref.querySelector('.sd2-ref-how').addEventListener('click', function(){ if(ctx.studio){ if(ctx.studio.kit2 && ctx.studio.kit2.mode() !== 'explore') ctx.studio.kit2.go('explore'); if(ctx.studio.close) ctx.studio.close(); } setTimeout(startTour, 60); });
      ref.querySelector('.sd2-ref-prac').addEventListener('click', function(){ if(ctx.studio && ctx.studio.kit2){ if(ctx.studio.close) ctx.studio.close(); ctx.studio.kit2.go('quiz', 'practice'); } });
      function refHtml(){
        var t = tally(vis), rows = SP.map(function(s, k){
          var n = t.counts[k], p = t.N ? n / t.N : 0;
          return '<tr><th scope="row"><span class="sd2-ref-sp">' + treeIcon(k) + esc(s.name) + '</span></th><td><span class="sd2-step"><button type="button" class="bt-step" data-k="' + k + '" data-d="-1" aria-label="One fewer ' + esc(s.name) + '"' + (n ? '' : ' disabled') + '>−</button><b>' + n + '</b><button type="button" class="bt-step" data-k="' + k + '" data-d="1" aria-label="One more ' + esc(s.name) + '"' + (t.N < SPOTS ? '' : ' disabled') + '>+</button></span></td><td>' + (t.N ? F(p, 3) : '–') + '</td><td>' + (t.N ? F(p * p, 3) : '–') + '</td></tr>';
        }).join('');
        var x = 0, blocks = t.N ? t.counts.map(function(n, k){ var q = (n / t.N) * (n / t.N), b = q > 0.002 ? '<rect class="sd2-sq sd2-sq' + k + '" x="' + (x * 300).toFixed(1) + '" y="0" width="' + (q * 300).toFixed(1) + '" height="22"/>' : ''; x += q; return b; }).join('') + '<rect class="sd2-sqD" x="' + (x * 300).toFixed(1) + '" y="0" width="' + ((1 - x) * 300).toFixed(1) + '" height="22"/>' : '';
        var foc = document.activeElement && refLive.contains(document.activeElement) ? [document.activeElement.getAttribute('data-k'), document.activeElement.getAttribute('data-d')] : null;
        refLive.innerHTML = '<div class="table-wrap"><table class="sd2-ref-t"><thead><tr><th scope="col">Species</th><th scope="col">Trees (n)</th><th scope="col">n / N</th><th scope="col">(n / N)²</th></tr></thead><tbody>' + rows +
          '</tbody><tfoot><tr><th scope="row">Total</th><td>N = ' + t.N + '</td><td></td><td>Σ = ' + (t.N ? F(t.sumSq, 3) : '–') + '</td></tr></tfoot></table></div>' +
          '<p class="bt-eq">' + (t.N ? 'D = 1 − Σ(n/N)² = 1 − ' + F(t.sumSq, 3) + ' = ' + F(t.D, 2) : 'No trees: there is nothing to measure.') + '</p>' +
          (t.N ? '<svg class="sd2-ref-bar" viewBox="-1 -1 302 24" role="img" aria-label="' + esc('Each species’ (n/N)² as a block; what is left is D = ' + F(t.D, 2)) + '">' + blocks + '</svg><p class="sd2-ref-cap">Each colored block is one species’ (n/N)². What is left (outlined) is D. ' + (t.S ? 'Species: ' + t.S + '. Most D can be with ' + t.S + ' species: ' + F(t.max, 2) + '.' : '') + '</p>' : '');
        if(foc){ var b = refLive.querySelector('.bt-step[data-k="' + foc[0] + '"][data-d="' + foc[1] + '"]'); if(b && !b.disabled) b.focus({ preventScroll: true }); }
      }
      refLive.addEventListener('click', function(e){
        var b = e.target.closest('.bt-step'); if(!b) return;
        var k = +b.getAttribute('data-k'), d = +b.getAttribute('data-d'), i;
        stopRuns(); took = false;
        if(d > 0){ for(i = 0; i < ORDER.length; i++) if(model[ORDER[i]] === CUT){ setSpot(ORDER[i], k); break; } }
        else for(i = ORDER.length - 1; i >= 0; i--) if(model[ORDER[i]] === k){ setSpot(ORDER[i], CUT); break; }
      });

      /* ---- Test yourself, "Build a community": the old Explore goals, as challenges on the same plot */
      var dock = document.createElement('div'); dock.className = 'sd2-dock';
      var N0 = START.N, S0 = START.S, D0 = START.D, HIGH = EX.goalHigh;
      var chal = K.challenges({ store: 'apbio-simpson-build', items: [
        { id: 'evenN', text: 'Raise D with the same ' + N0 + ' trees and the same ' + S0 + ' species.' },
        { id: 'rich', text: 'Add a species that is not in the plot yet.' },
        { id: 'mono', text: 'Leave only one species in the plot.' },
        { id: 'high', text: 'Get D above ' + F(HIGH, 2) + '.' }],
        done: { title: 'All four done.', text: 'More species raise the most D can be. Even numbers bring D up to it.' },
        onShow: function(){ if(St.mode === 'quiz' && St.part === 'build') reset(true); }, onReset: function(){ reset(true); } });
      dock.appendChild(chal.el);
      function goals(t){
        if(St.mode !== 'quiz' || St.part !== 'build' || busy() || runT.length && tally(model).N !== t.N) return;
        var c = chal.current(); if(!c || chal.isMet(c.id)) return;
        var same = t.counts.every(function(n, k){ return (n > 0) === (START.counts[k] > 0); });
        if(c.id === 'evenN' && t.N === N0 && same && t.D > D0 + 0.005) chal.met('evenN', 'Same trees, same species, more even: D rose from ' + F(D0, 2) + ' to ' + F(t.D, 2) + '. Evenness counts.');
        else if(c.id === 'rich' && t.counts.some(function(n, k){ return n > 0 && !START.counts[k]; })) chal.met('rich', 'A new species: ' + t.S + ' species now, and D went from ' + F(D0, 2) + ' to ' + F(t.D, 2) + '. Richness counts.');
        else if(c.id === 'mono' && t.S === 1) chal.met('mono', 'One species: any two trees you pick are the same species, so D = 0.');
        else if(c.id === 'high' && t.D > HIGH + 1e-9) chal.met('high', 'D = ' + F(t.D, 2) + ' with ' + t.S + ' species in nearly even numbers. It takes both: many species, evenly spread.');
      }

      /* ---- modes (the adapter calls this after every switch) */
      function shown(mode, part){
        St.mode = mode; St.part = part;
        var ex = mode === 'explore', build = mode === 'quiz' && part === 'build';
        stage.setAttribute('data-view', ex ? 'explore' : 'build');
        head.el.hidden = !ex; cause.el.hidden = !ex; bEven.hidden = !ex;
        if(!ex){ hideCue(false); if(tour.active()) tour.stop(); }
        if(!ex && !build) return;
        took = false;
        if(build && chal.current() && !chal.isMet(chal.current().id)) reset(true);
        setTimeout(function(){ layoutNow(); syncWords(); if(ex && !tour.active()) cue.show(); }, 30);
      }
      ctx.kit2 = { stage: stage, ref: ref,
        parts: [{ value: 'practice', label: 'Calculate D', practice: true },
          { value: 'build', label: 'Build a community', dock: dock, task: { kicker: 'Build a community', title: 'Change the plot to meet each challenge.', todo: 'Pick a tree or Cut under the plot, then tap the plot.' } }],
        onShow: function(m, p){ shown(m, p); } };
      setPick(pick, false);
      // The practice problems (unchanged): the adapter puts them in Test yourself.
      T.skillTool(app, data, { slug: SLUG, kind: 'simpson', stage: practiceStage });
      // Without the frame (no Tool Studio on the page) the stage still works on its own, above the practice problems.
      if(!ctx.studio){ app.insertBefore(stage, app.firstChild); app.insertBefore(ref, stage.nextSibling); shown('explore', null); }
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(layoutNow, 50); }).observe(sceneBox); }
      else window.addEventListener('resize', layoutNow);
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApBioBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var l2 = document.createElement('link'); l2.rel = 'stylesheet'; l2.href = (window.ApBioBase || '../') + 'assets/tools/simpson-diversity.css'; document.head.appendChild(l2);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
