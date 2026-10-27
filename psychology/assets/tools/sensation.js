/* Sensation and perception trainer page (docs/appsych-spec.md section 6).
   OWNED BY THIS TOOL ONLY (builder T2). Mounts into #app with
   ApPsychTools.mount; the model is ApPsychMath.sensation
   (psychology/assets/tools/math/sensation.js), the content
   psychology/data/tools/sensation.json (served filtered as
   assets/tool-data/sensation.json). The frame is ApPsychTools.modes
   (Explore, then Test yourself) on the Tool Studio.

   Explore: four scenes (the Scene switch):
     Detect    signal detection: the noise and signal-plus-noise curves the
               model draws (normal, SD 1), the listener's criterion (drag it
               or use the slider), the hit and false-alarm areas shaded, and
               the four outcomes with their percents (ApPsychStats.cdf).
               Run 20 trials: each trial is a seeded draw, dropped on the
               axis and colored by outcome. More options: signal strength.
     Weber     two patches of light: change the comparison and see whether
               the change reaches the just noticeable difference (8% of the
               starting brightness); the graph shows Weber's law, the JND
               growing in proportion to the stimulus.
     Color     a real afterimage: stare at the dot on a yellow, black and
               green flag for 20 seconds, then the screen turns white and you
               see the opponent colors yourself (blue, white, red); "Show
               what most people see" draws them.
     Perceive  depth cues and Gestalt figures, one at a time; "Show the cue"
               draws what the brain uses.
   Colors: the course cerulean for the signal, gray for noise, green for
   hits, vermillion for false alarms; every value is written, so color is
   never the only cue (lighter tones in dark mode). The afterimage colors
   are the real stimulus colors in both themes.
   Reduced motion: Run 20 trials shows all trials at once; the stare
   countdown is a number only.
   Test yourself: ApPsychTools.drill over the model's generate(); a figure
   never gives an answer away before its step is answered. */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath, P = window.ApPsychPlot;
  if(!T || !M || !M.sensation || M.sensation.stub) return;
  var X = M.sensation, esc = T.esc;
  function r1(v){ return Math.round(v * 10) / 10; }
  function pt(x, y){ return r1(x) + ',' + r1(y); }
  function pc(v){ return M.fixed(v, 0) + '%'; }

  /* ------------------------------------------------------------ art */
  /* Signal detection curves in the box. o: { d, c, trials: [{ x, sig, out }], grid, fs } */
  function sdtArt(x0, y0, w, h, o){
    var g = [], fs = o.fs || 13, d = o.d, c = o.c, r = X.sdt(d, c);
    var gridH = o.grid === false ? 0 : Math.min(150, Math.max(104, h * 0.3)), stripH = o.trials ? 40 + fs : 0;
    var L = x0 + 10, R = x0 + w - 10, top = y0 + fs * 2.6, bot = y0 + h - gridH - stripH - fs * 2.2;
    var lo = -3.4, hi = Math.max(3.4, d + 3.4), sx = function(v){ return L + (v - lo) / (hi - lo) * (R - L); };
    var peak = X.pdf(0, 0), sy = function(v){ return bot - v / peak * (bot - top); };
    function curve(mu, from, to){ var p = []; for(var v = from; v <= to + 1e-9; v += (hi - lo) / 160) p.push(pt(sx(v), sy(X.pdf(v, mu)))); return p; }
    function area(mu, from, to, cls){ if(to <= from) return ''; var p = curve(mu, from, to); return '<polygon class="' + cls + '" points="' + pt(sx(from), bot) + ' ' + p.join(' ') + ' ' + pt(sx(to), bot) + '"/>'; }
    g.push(area(0, Math.max(c, lo), hi, 'sd-fa'));
    g.push(area(d, Math.max(c, lo), hi, 'sd-hit'));
    g.push('<line class="sd-axis" x1="' + r1(L) + '" x2="' + r1(R) + '" y1="' + r1(bot) + '" y2="' + r1(bot) + '"/>');
    g.push('<polyline class="sd-noise" points="' + curve(0, lo, hi).join(' ') + '"/><polyline class="sd-sig" points="' + curve(d, lo, hi).join(' ') + '"/>');
    var lx0 = sx(0), lx1 = sx(d), same = Math.abs(lx1 - lx0) < fs * 9;
    g.push('<text class="sd-noise-t" x="' + r1(same ? lx0 - 6 : lx0) + '" y="' + r1(top - fs * 0.6) + '" text-anchor="' + (same ? 'end' : 'middle') + '" font-size="' + fs + '">Noise only</text>');
    g.push('<text class="sd-sig-t" x="' + r1(same ? lx1 + 6 : lx1) + '" y="' + r1(top - fs * 0.6) + '" text-anchor="' + (same ? 'start' : 'middle') + '" font-size="' + fs + '">Signal + noise</text>');
    var cxp = sx(c);
    g.push('<line class="sd-crit" x1="' + r1(cxp) + '" x2="' + r1(cxp) + '" y1="' + r1(top - 4) + '" y2="' + r1(bot + 8) + '"/>');
    g.push('<g class="sd-handle"' + (o.drag ? ' data-drag="1"' : '') + '><circle cx="' + r1(cxp) + '" cy="' + r1(bot + 8) + '" r="11"/><path d="M' + r1(cxp - 4) + ' ' + r1(bot + 4) + ' l-4 4 l4 4 M' + r1(cxp + 4) + ' ' + r1(bot + 4) + ' l4 4 l-4 4"/></g>');
    g.push('<text class="sd-crit-t" x="' + r1(Math.min(R - 4, cxp + 6)) + '" y="' + r1(bot + fs * 1.7 + 6) + '" text-anchor="' + (cxp > R - 120 ? 'end' : 'start') + '" font-size="' + (fs * 0.92) + '">say “yes” →</text>');
    g.push('<text class="sd-crit-t" x="' + r1(Math.max(L + 4, cxp - 6)) + '" y="' + r1(bot + fs * 1.7 + 6) + '" text-anchor="' + (cxp < L + 120 ? 'start' : 'end') + '" font-size="' + (fs * 0.92) + '">← “no”</text>');
    // trial dots: signal trials on the upper row, noise on the lower
    if(o.trials){
      var ty0 = bot + fs * 2.6 + 10;
      if(o.trials.length){
        g.push('<text class="sd-tk" x="' + r1(L) + '" y="' + r1(ty0 + 14) + '" font-size="' + (fs * 0.8) + '">signal</text><text class="sd-tk" x="' + r1(L) + '" y="' + r1(ty0 + 32) + '" font-size="' + (fs * 0.8) + '">none</text>');
      }
      var tl = L + fs * 3.4;
      o.trials.forEach(function(t){ var yy = ty0 + (t.sig ? 10 : 28), xx = Math.max(tl, Math.min(R - 5, sx(t.x))); g.push('<circle class="sd-dot is-' + t.out + '" cx="' + r1(xx) + '" cy="' + r1(yy) + '" r="5"/>'); });
    }
    // the four outcomes
    if(o.grid !== false){
      var gy = y0 + h - gridH + 6, gw = Math.min(w - 4 - (o.enl ? 60 : 0), 520), gx = x0 + (w - gw - (o.enl ? 60 : 0)) / 2, rh = (gridH - 6 - fs * 1.6) / 2, cw = (gw - fs * 6.2) / 2, hx = gx + fs * 6.2;
      g.push('<text class="sd-gh" x="' + r1(hx + cw / 2) + '" y="' + r1(gy + fs) + '" text-anchor="middle" font-size="' + fs + '">Said yes</text><text class="sd-gh" x="' + r1(hx + cw * 1.5) + '" y="' + r1(gy + fs) + '" text-anchor="middle" font-size="' + fs + '">Said no</text>');
      var rowsY = [gy + fs * 1.6, gy + fs * 1.6 + rh];
      g.push('<text class="sd-gh" x="' + r1(gx) + '" y="' + r1(rowsY[0] + rh / 2 + fs * 0.35) + '" font-size="' + fs + '">Signal</text><text class="sd-gh" x="' + r1(gx) + '" y="' + r1(rowsY[1] + rh / 2 + fs * 0.35) + '" font-size="' + fs + '">No signal</text>');
      var cells = [[['hit', 'Hit', r.hit], ['miss', 'Miss', r.miss]], [['fa', 'False alarm', r.fa], ['cr', 'Correct rejection', r.cr]]];
      cells.forEach(function(row, ri){ row.forEach(function(cl, ci){
        var cx0 = hx + ci * cw, cy0 = rowsY[ri], nm = cw < 150 && cl[0] === 'cr' ? 'Correct rej.' : cl[1];
        g.push('<rect class="sd-cell is-' + cl[0] + '" x="' + r1(cx0 + 2) + '" y="' + r1(cy0 + 2) + '" width="' + r1(cw - 4) + '" height="' + r1(rh - 4) + '" rx="10"/>');
        g.push('<text class="sd-cell-t" x="' + r1(cx0 + cw / 2) + '" y="' + r1(cy0 + rh / 2 - 2) + '" text-anchor="middle" font-size="' + (fs * 0.95) + '">' + nm + '</text>');
        g.push('<text class="sd-cell-v" x="' + r1(cx0 + cw / 2) + '" y="' + r1(cy0 + rh / 2 + fs * 1.15) + '" text-anchor="middle" font-size="' + (fs * 1.15) + '">' + (cl[2] == null ? '?' : pc(cl[2])) + '</text>');
      }); });
    }
    return { svg: g.join(''), sx: sx, L: L, R: R, lo: lo, hi: hi, r: r };
  }
  /* Two patches and Weber's law. o: { I, add, k, fs, graph } */
  function weberArt(x0, y0, w, h, o){
    var g = [], fs = o.fs || 13, k = o.k || 0.08, I = o.I, I2 = I + o.add, j = I * k, noticed = o.add >= j - 1e-9;
    var ph = o.graph === false ? h - fs * 3 : Math.min(h * 0.46, 220), pw = Math.min((w - 30) / 2, ph * 1.3), gap = Math.max(18, w * 0.05);
    var px0 = x0 + (w - pw * 2 - gap) / 2, py = y0 + fs * 1.6;
    var lum = function(v){ return Math.max(6, Math.min(94, 8 + v * 0.4)); };
    [[I, 'Starting'], [I2, 'Comparison']].forEach(function(p, i){
      var xx = px0 + i * (pw + gap);
      g.push('<rect class="wb-patch" x="' + r1(xx) + '" y="' + r1(py) + '" width="' + r1(pw) + '" height="' + r1(ph) + '" rx="14" style="fill:hsl(45 30% ' + r1(lum(p[0])) + '%)"/>');
      g.push('<text class="wb-t" x="' + r1(xx + pw / 2) + '" y="' + r1(py - 6) + '" text-anchor="middle" font-size="' + fs + '">' + p[1] + ': ' + M.fmt(p[0], 4) + '</text>');
    });
    if(o.graph !== false){
      var gTop = py + ph + fs * 3, L = x0 + 46, R = x0 + w - (o.enl ? 58 : 16), bot = y0 + h - fs * 2.2, xm = 220, ym = xm * k * 1.6;
      var sxx = function(v){ return L + v / xm * (R - L); }, syy = function(v){ return bot - v / ym * (bot - gTop); };
      g.push('<rect class="wb-plot" x="' + r1(L) + '" y="' + r1(gTop) + '" width="' + r1(R - L) + '" height="' + r1(bot - gTop) + '" rx="4"/>');
      g.push('<polygon class="wb-zone" points="' + pt(sxx(0), syy(0)) + ' ' + pt(sxx(xm), syy(xm * k)) + ' ' + pt(sxx(xm), syy(ym)) + ' ' + pt(sxx(0), syy(ym)) + '"/>');
      g.push('<line class="wb-law" x1="' + r1(sxx(0)) + '" y1="' + r1(syy(0)) + '" x2="' + r1(sxx(xm)) + '" y2="' + r1(syy(xm * k)) + '"/>');
      for(var t = 0; t <= xm; t += 50) g.push('<text class="wb-tk" x="' + r1(sxx(t)) + '" y="' + r1(bot + fs * 1.1) + '" text-anchor="middle" font-size="' + (fs * 0.85) + '">' + t + '</text>');
      [0, Math.round(ym / 2), Math.round(ym)].forEach(function(v){ g.push('<text class="wb-tk" x="' + r1(L - 6) + '" y="' + r1(syy(v) + 4) + '" text-anchor="end" font-size="' + (fs * 0.85) + '">' + v + '</text>'); });
      g.push('<text class="wb-t" x="' + r1(L) + '" y="' + r1(gTop - 6) + '" font-size="' + (fs * 0.9) + '">change needed to notice (JND) vs starting brightness</text>');
      g.push('<text class="wb-zone-t" x="' + r1(sxx(8)) + '" y="' + r1(gTop + fs * 1.2) + '" font-size="' + (fs * 0.85) + '">noticed</text><text class="wb-law-t" x="' + r1(sxx(xm * 0.62)) + '" y="' + r1(syy(xm * 0.62 * k) + fs * 1.3) + '" font-size="' + (fs * 0.85) + '">JND = ' + M.fmt(k * 100, 2) + '% of the start</text>');
      var dy = Math.min(ym, o.add);
      g.push('<line class="wb-guide" x1="' + r1(sxx(I)) + '" x2="' + r1(sxx(I)) + '" y1="' + r1(syy(0)) + '" y2="' + r1(syy(ym)) + '"/>');
      g.push('<circle class="wb-jnd" cx="' + r1(sxx(I)) + '" cy="' + r1(syy(j)) + '" r="5"/><circle class="wb-now ' + (noticed ? 'is-yes' : 'is-no') + '" cx="' + r1(sxx(I)) + '" cy="' + r1(syy(dy)) + '" r="7"/>');
    }
    return { svg: g.join(''), j: j, noticed: noticed };
  }
  /* The flag (or a square) and its afterimage. o: { pic, phase: 'stare' |
     'white' | 'shown' | 'side', fs } */
  var FLAG = ['yellow', 'black', 'green'];
  function afterArt(x0, y0, w, h, o){
    var g = [], fs = o.fs || 13, cols = o.pic === 'flag' ? FLAG : [o.pic];
    var side = o.phase === 'side', fw = side ? Math.min((w - 40) / 2, (h - fs * 4) * 1.5) : Math.min(w - 20, (h - fs * 4) * 1.5), fh = fw / 1.5;
    var fx = x0 + (w - (side ? fw * 2 + 30 : fw)) / 2, fy = y0 + (h - fh) / 2;
    function draw(xx, colsDraw, opp, op){
      var bw = fw / colsDraw.length;
      colsDraw.forEach(function(cname, i){ var col = opp ? X.AFTER[cname] : cname; g.push('<rect x="' + r1(xx + i * bw) + '" y="' + r1(fy) + '" width="' + r1(bw + 0.5) + '" height="' + r1(fh) + '" style="fill:' + X.HEX[col] + ';opacity:' + (op || 1) + '"/>'); });
      g.push('<rect class="af-frame" x="' + r1(xx) + '" y="' + r1(fy) + '" width="' + r1(fw) + '" height="' + r1(fh) + '" rx="6"/>');
    }
    if(side){
      draw(fx, cols, false); draw(fx + fw + 30, cols, true, 0.85);
      g.push('<text class="af-t" x="' + r1(fx + fw / 2) + '" y="' + r1(fy - 8) + '" text-anchor="middle" font-size="' + fs + '">Stare at this</text><text class="af-t" x="' + r1(fx + fw * 1.5 + 30) + '" y="' + r1(fy - 8) + '" text-anchor="middle" font-size="' + fs + '">Afterimage on white</text>');
    } else if(o.phase === 'stare'){
      draw(fx, cols, false);
    } else {
      g.push('<rect class="af-white" x="' + r1(fx) + '" y="' + r1(fy) + '" width="' + r1(fw) + '" height="' + r1(fh) + '" rx="6"/>');
      if(o.phase === 'shown') draw(fx, cols, true, 0.42);
    }
    if(!side){ var cx = fx + fw / 2, cy = fy + fh / 2; g.push('<path class="af-cross" d="M' + r1(cx - 14) + ' ' + r1(cy) + ' h28 M' + r1(cx) + ' ' + r1(cy - 14) + ' v28"/><circle class="af-dot" cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="6"/>'); }
    return { svg: g.join(''), box: [fx, fy, fw, fh] };
  }
  /* A depth-cue scene. show: draw what the brain uses. */
  function depthArt(x0, y0, w, h, cue, show, fs){
    var g = [], hz = y0 + h * 0.42, L = x0, R = x0 + w, B = y0 + h, cx = x0 + w / 2;
    var sky = '<rect class="dp-sky" x="' + r1(L) + '" y="' + r1(y0) + '" width="' + r1(w) + '" height="' + r1(hz - y0) + '"/>', ground = '<rect class="dp-ground" x="' + r1(L) + '" y="' + r1(hz) + '" width="' + r1(w) + '" height="' + r1(B - hz) + '"/>';
    function tree(x, base, s){ return '<g class="dp-tree"><rect x="' + r1(x - 4 * s) + '" y="' + r1(base - 34 * s) + '" width="' + r1(8 * s) + '" height="' + r1(34 * s) + '" class="dp-trunk"/><ellipse cx="' + r1(x) + '" cy="' + r1(base - 52 * s) + '" rx="' + r1(26 * s) + '" ry="' + r1(30 * s) + '" class="dp-crown"/><ellipse cx="' + r1(x - 10 * s) + '" cy="' + r1(base - 60 * s) + '" rx="' + r1(12 * s) + '" ry="' + r1(12 * s) + '" class="dp-crown2"/></g>'; }
    var lab = function(x, y, t, a){ return '<text class="dp-show" x="' + r1(x) + '" y="' + r1(y) + '" text-anchor="' + (a || 'middle') + '" font-size="' + fs + '">' + t + '</text>'; };
    if(cue === 'linear-perspective'){
      g.push(sky, ground);
      var vx = cx, vy = hz, rl = cx - w * 0.36, rr = cx + w * 0.36;
      g.push('<polygon class="dp-road" points="' + pt(vx - 2, vy) + ' ' + pt(vx + 2, vy) + ' ' + pt(rr, B) + ' ' + pt(rl, B) + '"/>');
      for(var i = 0; i < 7; i++){ var t0 = Math.pow(i / 7, 1.8), t1 = Math.pow((i + 0.5) / 7, 1.8); g.push('<line class="dp-dash" x1="' + r1(vx) + '" y1="' + r1(vy + (B - vy) * t0) + '" x2="' + r1(vx) + '" y2="' + r1(vy + (B - vy) * t1) + '" stroke-width="' + r1(1 + 5 * t1) + '"/>'); }
      for(var p = 0; p < 6; p++){ var tt = Math.pow((p + 1) / 7, 1.6), px = vx + (rr + 30 - vx) * tt, py = vy + (B - vy) * tt; g.push('<line class="dp-pole" x1="' + r1(px) + '" y1="' + r1(py) + '" x2="' + r1(px) + '" y2="' + r1(py - 70 * tt) + '" stroke-width="' + r1(1 + 4 * tt) + '"/>'); }
      if(show){ g.push('<line class="dp-guide" x1="' + r1(rl) + '" y1="' + r1(B) + '" x2="' + r1(vx) + '" y2="' + r1(vy) + '"/><line class="dp-guide" x1="' + r1(rr) + '" y1="' + r1(B) + '" x2="' + r1(vx) + '" y2="' + r1(vy) + '"/><circle class="dp-vp" cx="' + r1(vx) + '" cy="' + r1(vy) + '" r="6"/>'); g.push(lab(vx, vy - 12, 'parallel edges meet far away')); }
    } else if(cue === 'relative-size'){
      g.push(sky, ground);
      g.push(tree(x0 + w * 0.28, B - 14, Math.min(2.3, h / 120)), tree(x0 + w * 0.72, hz + 22, 0.55));
      if(show){ g.push(lab(x0 + w * 0.28, B - h * 0.62, 'same tree, big image: near'), lab(x0 + w * 0.72, hz - 24, 'small image: far')); }
    } else if(cue === 'interposition'){
      g.push(sky, ground);
      var sx2 = x0 + w * 0.58, sw = w * 0.11, sh2 = h * 0.5, sb = hz + h * 0.22;
      if(show) g.push('<rect class="dp-hidden" x="' + r1(sx2) + '" y="' + r1(sb - sh2) + '" width="' + r1(sw) + '" height="' + r1(sh2) + '" rx="' + r1(sw / 2) + '"/>');
      g.push('<rect class="dp-silo" x="' + r1(sx2) + '" y="' + r1(sb - sh2) + '" width="' + r1(sw) + '" height="' + r1(sh2) + '" rx="' + r1(sw / 2) + '"/>');
      var bx = x0 + w * 0.32, bw = w * 0.36, bh = h * 0.3, bb = B - h * 0.12;
      g.push('<polygon class="dp-barn" points="' + pt(bx, bb) + ' ' + pt(bx, bb - bh) + ' ' + pt(bx + bw / 2, bb - bh - h * 0.14) + ' ' + pt(bx + bw, bb - bh) + ' ' + pt(bx + bw, bb) + '"/><rect class="dp-door" x="' + r1(bx + bw * 0.38) + '" y="' + r1(bb - bh * 0.6) + '" width="' + r1(bw * 0.24) + '" height="' + r1(bh * 0.6) + '"/>');
      if(show) g.push(lab(sx2 + sw / 2, sb - sh2 - 10, 'partly hidden: behind'));
    } else if(cue === 'texture-gradient'){
      g.push(sky, ground);
      for(var row = 0; row < 16; row++){
        var tr = Math.pow(row / 15, 2.2), yy = hz + 6 + (B - hz - 10) * tr, rr2 = 1 + 7 * tr, gap = 6 + 40 * tr;
        for(var xx = L + ((row % 2) * gap / 2); xx < R; xx += gap) g.push('<ellipse class="dp-flower" cx="' + r1(xx) + '" cy="' + r1(yy) + '" rx="' + r1(rr2) + '" ry="' + r1(rr2 * 0.7) + '"/>');
      }
      if(show){ g.push(lab(cx, B - 10, 'coarse, spaced out: near'), lab(cx, hz - 10, 'fine, crowded: far')); }
    } else if(cue === 'relative-clarity'){
      g.push('<rect class="dp-haze" x="' + r1(L) + '" y="' + r1(y0) + '" width="' + r1(w) + '" height="' + r1(h) + '"/>');
      [[0.22, 0.25, 'dp-m3'], [0.42, 0.55, 'dp-m2'], [0.62, 0.9, 'dp-m1']].forEach(function(m, i){
        var top = y0 + h * m[0], pts = [pt(L, B)];
        for(var k2 = 0; k2 <= 10; k2++) pts.push(pt(L + w * k2 / 10, top + (k2 % 2 ? 0.12 : 0) * h * (1 - i * 0.2) + Math.sin(k2 * (i + 2)) * 10));
        pts.push(pt(R, B)); g.push('<polygon class="' + m[2] + '" points="' + pts.join(' ') + '"/>');
      });
      if(show){ g.push(lab(cx, y0 + h * 0.18, 'hazy, faint: far'), lab(cx, B - 12, 'sharp, clear: near')); }
    } else if(cue === 'retinal-disparity' || cue === 'convergence'){
      g.push('<rect class="dp-room" x="' + r1(L) + '" y="' + r1(y0) + '" width="' + r1(w) + '" height="' + r1(h) + '"/>');
      var ey = B - h * 0.14, ex1 = cx - 34, ex2 = cx + 34, near = y0 + h * 0.42, far = y0 + h * 0.1;
      [ex1, ex2].forEach(function(ex){ g.push('<circle class="dp-eye" cx="' + r1(ex) + '" cy="' + r1(ey) + '" r="14"/><circle class="dp-pupil" cx="' + r1(ex + (cx - ex) * 0.25) + '" cy="' + r1(ey - 8) + '" r="5"/>'); });
      g.push('<circle class="dp-obj" cx="' + r1(cx) + '" cy="' + r1(near) + '" r="10"/>' + (cue === 'convergence' ? '<circle class="dp-obj is-far" cx="' + r1(cx) + '" cy="' + r1(far) + '" r="8"/>' : ''));
      g.push('<line class="dp-ray" x1="' + r1(ex1) + '" y1="' + r1(ey - 12) + '" x2="' + r1(cx) + '" y2="' + r1(near) + '"/><line class="dp-ray" x1="' + r1(ex2) + '" y1="' + r1(ey - 12) + '" x2="' + r1(cx) + '" y2="' + r1(near) + '"/>');
      if(cue === 'convergence') g.push('<line class="dp-ray is-far" x1="' + r1(ex1) + '" y1="' + r1(ey - 12) + '" x2="' + r1(cx) + '" y2="' + r1(far) + '"/><line class="dp-ray is-far" x1="' + r1(ex2) + '" y1="' + r1(ey - 12) + '" x2="' + r1(cx) + '" y2="' + r1(far) + '"/>');
      if(cue === 'retinal-disparity'){
        var bw2 = Math.min(w * 0.3, 150), bh2 = bw2 * 0.6, by2 = y0 + 10;
        [[x0 + 10, 'Left eye sees', -1], [R - 10 - bw2, 'Right eye sees', 1]].forEach(function(v){ g.push('<rect class="dp-view" x="' + r1(v[0]) + '" y="' + r1(by2 + fs * 1.4) + '" width="' + r1(bw2) + '" height="' + r1(bh2) + '" rx="8"/><text class="dp-t" x="' + r1(v[0] + bw2 / 2) + '" y="' + r1(by2 + fs) + '" text-anchor="middle" font-size="' + fs + '">' + v[1] + '</text><circle class="dp-obj" cx="' + r1(v[0] + bw2 / 2 - v[2] * bw2 * 0.18) + '" cy="' + r1(by2 + fs * 1.4 + bh2 / 2) + '" r="9"/><rect class="dp-bg" x="' + r1(v[0] + bw2 / 2 - 4) + '" y="' + r1(by2 + fs * 1.4 + 8) + '" width="8" height="' + r1(bh2 - 16) + '"/>'); });
        if(show) g.push(lab(cx, B - 4, 'two views differ: the object is close'));
      } else if(show) g.push(lab(cx + 60, near + 4, 'eyes turn in more: close', 'start'), lab(cx + 60, far + 4, 'less: far', 'start'));
    }
    return g.join('');
  }
  /* A Gestalt figure. show: draw the organization the brain adds. */
  function gestaltArt(x0, y0, w, h, law, show, fs){
    var g = [], cx = x0 + w / 2, cy = y0 + h / 2, s = Math.min(w, h);
    if(law === 'closure'){
      var R = s * 0.3, rr = s * 0.11, pts = [0, 1, 2].map(function(i){ var a = -Math.PI / 2 + i * 2 * Math.PI / 3; return [cx + Math.cos(a) * R, cy + 14 + Math.sin(a) * R]; });
      pts.forEach(function(p, i){ var a0 = Math.atan2(cy + 14 - p[1], cx - p[0]), sp = Math.PI / 6; g.push('<path class="gs-ink" d="M' + pt(p[0], p[1]) + ' L' + pt(p[0] + Math.cos(a0 + sp) * rr, p[1] + Math.sin(a0 + sp) * rr) + ' A' + rr + ' ' + rr + ' 0 1 0 ' + pt(p[0] + Math.cos(a0 - sp) * rr, p[1] + Math.sin(a0 - sp) * rr) + ' Z"/>'); });
      if(show) g.push('<polygon class="gs-show" points="' + pts.map(function(p){ return pt(p[0], p[1]); }).join(' ') + '"/>');
    } else if(law === 'figure-ground'){
      var vh = s * 0.8, vw = s * 0.62, top = cy - vh / 2, prof = [[0.30, 0], [0.30, 0.08], [0.18, 0.16], [0.14, 0.28], [0.24, 0.40], [0.12, 0.48], [0.16, 0.58], [0.08, 0.66], [0.20, 0.80], [0.30, 1]];
      var right = prof.map(function(q){ return [cx + q[0] * vw, top + q[1] * vh]; }), left = prof.slice().reverse().map(function(q){ return [cx - q[0] * vw, top + q[1] * vh]; });
      g.push('<rect class="gs-ground" x="' + r1(cx - vw * 0.5) + '" y="' + r1(top) + '" width="' + r1(vw) + '" height="' + r1(vh) + '"/>');
      g.push('<path class="gs-vase" d="M' + right.concat(left).map(function(p){ return pt(p[0], p[1]); }).join(' L') + 'Z"/>');
      if(show) g.push('<text class="gs-lab" x="' + r1(cx) + '" y="' + r1(top + vh + fs * 1.4) + '" text-anchor="middle" font-size="' + fs + '">a vase (figure) or two faces (the ground becomes the figure)</text>');
    } else if(law === 'proximity'){
      var dx = s * 0.08, gp = s * 0.2, sx0 = cx - (4 * dx + 3 * gp) / 2 + dx / 2;
      for(var i2 = 0; i2 < 4; i2++) for(var j2 = 0; j2 < 2; j2++){ var xx = sx0 + i2 * (dx + gp) + j2 * dx; g.push('<circle class="gs-dot" cx="' + r1(xx) + '" cy="' + r1(cy) + '" r="' + r1(s * 0.025) + '"/>'); }
      if(show) for(var k = 0; k < 4; k++) g.push('<ellipse class="gs-show" cx="' + r1(sx0 + k * (dx + gp) + dx / 2) + '" cy="' + r1(cy) + '" rx="' + r1(dx * 0.95) + '" ry="' + r1(s * 0.06) + '"/>');
    } else {
      var n = 6, st = s * 0.11, gx0 = cx - st * (n - 1) / 2, gy0 = cy - st * (n - 1) / 2;
      for(var a = 0; a < n; a++) for(var b = 0; b < n; b++) g.push('<circle class="gs-dot' + (a % 2 ? ' is-hollow' : '') + '" cx="' + r1(gx0 + b * st) + '" cy="' + r1(gy0 + a * st) + '" r="' + r1(st * 0.28) + '"/>');
      if(show) for(var a2 = 0; a2 < n; a2 += 2) g.push('<rect class="gs-show" x="' + r1(gx0 - st * 0.45) + '" y="' + r1(gy0 + a2 * st - st * 0.45) + '" width="' + r1(st * (n - 1) + st * 0.9) + '" height="' + r1(st * 0.9) + '" rx="' + r1(st * 0.45) + '"/>');
    }
    return g.join('');
  }
  /* The psychometric curve (drill): detection data, with the 50% line only
     once the threshold is answered. */
  function psychoArt(x0, y0, w, h, o){
    var g = [], fs = o.fs || 13, L = x0 + 44, R = x0 + w - 12, top = y0 + 14, bot = y0 + h - 30, lv = o.levels, lo = lv[0], hi = lv[lv.length - 1];
    var sx = function(v){ return L + (v - lo) / (hi - lo) * (R - L); }, sy = function(v){ return bot - v / 100 * (bot - top); };
    g.push('<rect class="wb-plot" x="' + r1(L) + '" y="' + r1(top) + '" width="' + r1(R - L) + '" height="' + r1(bot - top) + '" rx="4"/>');
    [0, 50, 100].forEach(function(v){ g.push('<line class="sd-grid" x1="' + r1(L) + '" x2="' + r1(R) + '" y1="' + r1(sy(v)) + '" y2="' + r1(sy(v)) + '"/><text class="wb-tk" x="' + r1(L - 6) + '" y="' + r1(sy(v) + 4) + '" text-anchor="end" font-size="' + (fs * 0.9) + '">' + v + '%</text>'); });
    lv.forEach(function(v){ g.push('<text class="wb-tk" x="' + r1(sx(v)) + '" y="' + r1(bot + fs * 1.2) + '" text-anchor="middle" font-size="' + (fs * 0.9) + '">' + v + '</text>'); });
    g.push('<text class="wb-t" x="' + r1(R) + '" y="' + r1(bot + fs * 2.3) + '" text-anchor="end" font-size="' + (fs * 0.9) + '">intensity (' + esc(o.unit) + ')</text>');
    g.push('<polyline class="ps-line" points="' + lv.map(function(v, i){ return pt(sx(v), sy(o.pct[i])); }).join(' ') + '"/>');
    lv.forEach(function(v, i){ g.push('<circle class="ps-pt" cx="' + r1(sx(v)) + '" cy="' + r1(sy(o.pct[i])) + '" r="5"/>'); });
    if(o.T != null) g.push('<line class="ps-t" x1="' + r1(L) + '" x2="' + r1(sx(o.T)) + '" y1="' + r1(sy(50)) + '" y2="' + r1(sy(50)) + '"/><line class="ps-t" x1="' + r1(sx(o.T)) + '" x2="' + r1(sx(o.T)) + '" y1="' + r1(sy(50)) + '" y2="' + r1(bot) + '"/><text class="ps-tt" x="' + r1(sx(o.T) + 6) + '" y="' + r1(sy(50) - 6) + '" font-size="' + fs + '">threshold</text>');
    return g.join('');
  }

  /* ------------------------------------------------------------ mount */
  T.mount('sensation', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'sensation',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------------ explore */
  var SCENES = [{ v: 'detect', label: 'Detect' }, { v: 'weber', label: 'Weber' }, { v: 'color', label: 'Color' }, { v: 'perceive', label: 'Perceive' }];
  var FIGS = ['linear-perspective', 'relative-size', 'interposition', 'texture-gradient', 'relative-clarity', 'retinal-disparity', 'convergence', 'closure', 'figure-ground', 'proximity', 'similarity'];
  function figName(k){ return (X.DEPTH[k] || X.GESTALT[k]).name; }
  function explore(host, data){
    var scene = 'detect', d = 1.5, c = 0.75, trials = [], seed = 7, anim = null, I = 100, add = 6, pic = 'flag', phase = 'stare', secs = 20, left = null, fig = 'linear-perspective', show = false;
    var LS = null, touched = false, nid = T.nid('sn');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem sn-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Sensation and perception</h2>' +
      '<div class="sn-fig"><svg class="sn-svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<div class="sn-ctl">' +
        '<div class="ls-seg sn-scenes" role="group" aria-label="Scene">' + SCENES.map(function(x){ return '<button type="button" data-s="' + x.v + '" aria-pressed="' + (x.v === scene) + '">' + x.label + '</button>'; }).join('') + '</div>' +
        '<div class="sn-grp sn-grp-detect"></div>' +
        '<div class="sn-grp sn-grp-weber" hidden></div>' +
        '<div class="sn-grp sn-grp-color" hidden></div>' +
        '<div class="sn-grp sn-grp-perceive" hidden><div class="ls-scroll sn-figs" role="group" aria-label="Figure">' + FIGS.map(function(k){ return '<button type="button" class="bt-btn" data-f="' + k + '" aria-pressed="' + (k === fig) + '">' + figName(k) + '</button>'; }).join('') + '</div></div>' +
        '<div class="sn-go"><button type="button" class="btn-press sm ls-btn ls-pri sn-act">Run 20 trials</button></div>' +
      '</div><div class="sn-say"></div>' +
      T.moreHtml('<div class="sn-more"></div>', 'signal strength, starting brightness, stare time') +
      '<div class="sn-nums"></div><p class="sr-only sn-live"></p></section>';
    var say = T.announcer($('.sn-live'));
    var cue = T.cue('Run 20 trials, then move your criterion.');
    $('.sn-ctl').insertBefore(cue.el, $('.sn-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var svg = $('.sn-svg');
    function wordsC(v){ return v <= -0.5 ? 'very lenient' : v < 0.5 ? 'lenient' : v < 1.25 ? 'middle' : v < 2 ? 'strict' : 'very strict'; }
    var sC = T.slider({ label: 'Your criterion (when you say yes)', min: -1.5, max: 3, step: 0.25, value: c, onInput: function(v){ act(); c = v; reclass(); draw(); words(); say('Criterion ' + wordsC(v) + '. ' + sdtLine()); } });
    relabel(sC, function(v){ return wordsC(v); });
    $('.sn-grp-detect').appendChild(sC.el);
    var sD = T.slider({ label: 'Signal strength (how far apart the curves are)', min: 0, max: 3, step: 0.25, value: d, onInput: function(v){ act(); d = v; trials = []; draw(); words(); } });
    var sAdd = T.slider({ label: 'Change in brightness', min: 0, max: 30, step: 1, value: add, onInput: function(v){ act(); add = v; draw(); words(); say(weberLine()); } });
    $('.sn-grp-weber').appendChild(sAdd.el);
    var sI = T.slider({ label: 'Starting brightness', min: 20, max: 200, step: 10, value: I, onInput: function(v){ act(); I = v; draw(); words(); say(weberLine()); } });
    var sPic = T.choiceSelect({ label: 'Picture to stare at', options: [{ value: 'flag', label: 'Flag (yellow, black, green)' }, { value: 'red', label: 'Red square' }, { value: 'green', label: 'Green square' }, { value: 'blue', label: 'Blue square' }, { value: 'yellow', label: 'Yellow square' }], value: pic, onChange: function(v){ act(); stopStare(); pic = v; phase = 'stare'; draw(); words(); } });
    $('.sn-grp-color').appendChild(sPic.el);
    var sSecs = T.choiceSelect({ label: 'Stare time', options: [{ value: '10', label: '10 seconds' }, { value: '20', label: '20 seconds' }, { value: '30', label: '30 seconds' }], value: '20', onChange: function(v){ secs = +v; } });
    [sD, sI, sSecs].forEach(function(x){ $('.sn-more').appendChild(x.el); });
    function relabel(sl, fn){ var out = sl.el.querySelector('output'), inp = sl.input; function sh(){ out.textContent = fn(+inp.value); inp.setAttribute('aria-valuetext', fn(+inp.value)); } inp.addEventListener('input', sh); sl.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', sh); }); var s0 = sl.set; sl.set = function(v, fire){ s0(v, fire); sh(); }; sh(); }

    function onClick(e){
      var b;
      if((b = e.target.closest('.sn-scenes button'))){ act(); stop(); scene = b.getAttribute('data-s'); sync(); draw(); words(); say(SCENES.filter(function(x){ return x.v === scene; })[0].label + ' scene.'); return; }
      if((b = e.target.closest('.sn-figs button'))){ act(); fig = b.getAttribute('data-f'); show = false; sync(); draw(); words(); say(figName(fig) + '.'); return; }
      if(e.target.closest('.sn-act')){ act(); action(); return; }
    }
    host.addEventListener('click', onClick);
    // drag the criterion on the picture
    var dragging = false;
    function critFrom(ev){ var rc = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, x = (ev.clientX - rc.left) / rc.width * vb.width; if(!geo) return; var v = geo.lo + (x - geo.L) / (geo.R - geo.L) * (geo.hi - geo.lo); sC.set(Math.max(-1.5, Math.min(3, Math.round(v * 4) / 4)), true); }
    svg.addEventListener('pointerdown', function(ev){ if(scene !== 'detect') return; var hnd = ev.target.closest('.sd-handle, .sd-crit'); if(!hnd && !ev.target.closest('svg')) return; dragging = true; try{ svg.setPointerCapture(ev.pointerId); }catch(x){} critFrom(ev); });
    svg.addEventListener('pointermove', function(ev){ if(dragging) critFrom(ev); });
    svg.addEventListener('pointerup', function(){ dragging = false; });
    svg.addEventListener('pointercancel', function(){ dragging = false; });

    function sync(){
      var root = LS ? LS.root : host;
      root.querySelectorAll('.sn-scenes button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-s') === scene)); });
      root.querySelectorAll('.sn-figs button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === fig)); });
      SCENES.forEach(function(x){ var el = $('.sn-grp-' + x.v); if(el) el.hidden = x.v !== scene; });
      sD.el.hidden = scene !== 'detect'; sI.el.hidden = scene !== 'weber'; sSecs.el.hidden = scene !== 'color';
      var more = $('.psy-ls-more') || $('.bt-more'), go = $('.sn-go');
      if(go) go.hidden = scene === 'weber';
      var a = $('.sn-act'); if(a) a.textContent = actLabel();
      if(LS && LS.setupRow) LS.setupRow.setup(scene === 'detect' ? 'Signal strength ' + d : scene === 'weber' ? 'Starting at ' + I : scene === 'color' ? secs + ' second stare' : figName(fig));
      svg.classList.toggle('is-drag', scene === 'detect');
    }
    function actLabel(){
      if(scene === 'detect') return anim ? 'Pause' : trials.length ? 'Run 20 more' : 'Run 20 trials';
      if(scene === 'color') return left != null ? 'Stop' : phase === 'white' ? 'Show what most people see' : phase === 'shown' ? 'Stare again' : 'Start staring';
      if(scene === 'perceive') return show ? 'Hide the cue' : (X.GESTALT[fig] ? 'Show the grouping' : 'Show the cue');
      return '';
    }
    function stop(){ if(anim){ anim.stop(); anim = null; } stopStare(); var a = $('.sn-act'); if(a) a.textContent = actLabel(); }
    var timer = null;
    function stopStare(){ if(timer){ clearInterval(timer); timer = null; } if(left != null){ left = null; phase = 'stare'; } }
    function action(){
      if(scene === 'detect'){
        if(anim){ stop(); return; }
        var r = M.rng(seed++), batch = [];
        for(var i = 0; i < 20; i++){ var sig = i % 2 === 0, x = M.normal(r, sig ? d : 0, 1); batch.push({ x: x, sig: sig }); }
        var start = trials.length;
        if(start >= 100) trials = [];
        start = trials.length;
        anim = P.loop(function(dt, t){ var n = Math.min(20, Math.floor(t / 2.4 * 20) + 1); while(trials.length < start + n) trials.push(batch[trials.length - start]); reclass(); draw(); return n < 20; },
          { duration: 2.4, still: function(){ batch.forEach(function(b){ trials.push(b); }); reclass(); draw(); }, onEnd: function(){ anim = null; while(trials.length < start + 20) trials.push(batch[trials.length - start]); reclass(); draw(); words(); say(tally()); var a = $('.sn-act'); if(a) a.textContent = actLabel(); } });
        var a = $('.sn-act'); if(a) a.textContent = 'Pause'; anim.start();
      } else if(scene === 'color'){
        if(left != null){ stopStare(); draw(); words(); sync(); return; }
        if(phase === 'white'){ phase = 'shown'; draw(); words(); sync(); say('Most people see ' + afterWords() + '.'); return; }
        phase = 'stare'; left = secs; draw(); words(); sync();
        timer = setInterval(function(){ left--; if(left <= 0){ clearInterval(timer); timer = null; left = null; phase = 'white'; say('Now the page is white. Keep looking at the dot.'); } draw(); words(); sync(); }, 1000);
      } else if(scene === 'perceive'){ show = !show; draw(); words(); sync(); if(show) say(figLook()); }
    }
    function reclass(){ trials.forEach(function(t){ var yes = t.x >= c; t.out = t.sig ? (yes ? 'hit' : 'miss') : (yes ? 'fa' : 'cr'); }); }
    function counts(){ var n = { hit: 0, miss: 0, fa: 0, cr: 0 }; trials.forEach(function(t){ n[t.out]++; }); return n; }
    function tally(){ var n = counts(); return trials.length + ' trials: ' + n.hit + ' hits, ' + n.miss + ' misses, ' + n.fa + ' false alarms, ' + n.cr + ' correct rejections.'; }
    function sdtLine(){ var r = X.sdt(d, c); return 'Hits ' + pc(r.hit) + ' of signal trials, false alarms ' + pc(r.fa) + ' of no-signal trials.'; }
    function weberLine(){ var j = X.jnd(I, X.WEBER.brightness.k); return 'JND ' + M.fmt(j, 3) + '. A change of ' + add + ' is ' + (add >= j - 1e-9 ? 'noticed.' : 'usually not noticed.'); }
    function afterWords(){ return pic === 'flag' ? 'blue, white and red stripes' : X.AFTER[pic]; }
    function figLook(){ return (X.DEPTH[fig] || X.GESTALT[fig]).look; }
    function words(){
      var head, sub = '', why = '';
      if(scene === 'detect'){
        var r = X.sdt(d, c);
        head = 'Criterion ' + wordsC(c) + ': hits ' + pc(r.hit) + ', false alarms ' + pc(r.fa) + '.';
        sub = trials.length ? tally() : 'Press Run 20 trials: half have the signal, half do not.';
        why = '<ul class="ls-steps"><li><span><b>Signal detection theory.</b> Whether you report a faint signal depends on how strong it is and on your criterion: your expectations, motivation and what a mistake costs.</span></li><li><span><b>The four outcomes.</b> Hit (signal, yes), miss (signal, no), false alarm (no signal, yes), correct rejection (no signal, no).</span></li><li><span><b>Move the criterion</b> left (lenient) and both hits and false alarms rise; right (strict) and both fall. Only a stronger signal (curves farther apart) raises hits without more false alarms.</span></li><li><span>A radiologist reading scans, a lifeguard watching swimmers, an airport screener: each sets a criterion.</span></li></ul>';
      } else if(scene === 'weber'){
        var j = X.jnd(I, X.WEBER.brightness.k), noticed = add >= j - 1e-9;
        head = 'Starting brightness ' + I + ': the JND is ' + M.fmt(j, 3) + '. A change of ' + add + ' is ' + (noticed ? 'noticed.' : 'usually not noticed.');
        sub = 'Double the starting brightness in More options: the JND doubles too.';
        why = '<ul class="ls-steps"><li><span><b>Absolute threshold</b>: the weakest stimulus you detect half the time.</span></li><li><span><b>Difference threshold (just noticeable difference, JND)</b>: the smallest change you notice half the time.</span></li><li><span><b>Weber’s law</b>: the JND is a constant fraction of the starting stimulus. For brightness that fraction is about 8% (a textbook value), so a dim light needs a small change and a bright one a large change.</span></li><li><span>That is why one candle is obvious in a dark room and invisible in sunlight.</span></li></ul>';
      } else if(scene === 'color'){
        if(left != null){ head = 'Keep your eyes on the dot: ' + left + ' s.'; sub = 'Do not move your eyes.'; }
        else if(phase === 'white'){ head = 'Keep looking at the dot. What colors do you see?'; sub = 'The afterimage fades in a few seconds.'; }
        else if(phase === 'shown'){ head = 'Most people see ' + afterWords() + '.'; sub = 'Each color is replaced by its opponent: yellow by blue, green by red, black by white.'; }
        else { head = 'Stare at the dot for ' + secs + ' seconds, then look at the white page.'; sub = 'Press Start staring.'; }
        why = '<ul class="ls-steps"><li><span><b>Opponent-process theory.</b> Further along the visual pathway, cells work in opposing pairs: red-green, blue-yellow, black-white. Staring at one color tires its side of the pair.</span></li><li><span>On a white page, the rested side wins for a moment, so you see the opponent color: an <b>afterimage</b>.</span></li><li><span><b>Trichromatic theory</b> explains the first step: three kinds of cones (most sensitive to red, green and blue light) whose mix gives every color. Both theories are right, at different stages.</span></li><li><span><b>Color vision deficiency</b> usually means one kind of cone works differently, so some colors (often red and green) look alike.</span></li></ul>';
      } else {
        var D = X.DEPTH[fig], Gs = X.GESTALT[fig];
        head = figName(fig) + ': ' + (D || Gs).look;
        sub = D ? (D.kind === 'monocular' ? 'A monocular cue: it works with one eye, even in a flat picture.' : 'A binocular cue: it needs both eyes.') : 'A Gestalt principle: the brain organizes parts into a whole.';
        why = '<ul class="ls-steps"><li><span><b>Bottom-up</b> processing builds a picture from the senses; <b>top-down</b> processing uses knowledge and expectations (schemas, perceptual set) to interpret it.</span></li><li><span><b>Depth cues.</b> Binocular: retinal disparity, convergence. Monocular: relative size, interposition, linear perspective, texture gradient, relative clarity.</span></li><li><span><b>Gestalt principles</b>: the whole is different from the sum of its parts: closure, figure-ground, proximity, similarity.</span></li></ul>';
      }
      T.explain($('.sn-say'), '<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), why);
      nums();
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), 'explore');
        if(scene === 'detect'){ var n = counts(); LS.pills([{ html: 'd′ ' + d, tone: 'readout' }], 'left', 'explore'); LS.pills(trials.length ? [{ html: n.hit + ' hits, ' + n.fa + ' false alarms', tone: 'accent' }] : [], 'right', 'explore'); }
        else if(scene === 'weber'){ var jj = X.jnd(I, X.WEBER.brightness.k); LS.pills([{ html: 'JND ' + M.fmt(jj, 3), tone: 'readout' }], 'left', 'explore'); LS.pills([{ html: add >= jj - 1e-9 ? 'Noticed' : 'Not noticed', tone: add >= jj - 1e-9 ? 'good' : 'warn' }], 'right', 'explore'); }
        else if(scene === 'color'){ LS.pills(left != null ? [{ html: left + ' s', tone: 'readout' }] : [], 'left', 'explore'); LS.pills([], 'right', 'explore'); }
        else { LS.pills([{ html: X.DEPTH[fig] ? (X.DEPTH[fig].kind === 'monocular' ? 'Monocular cue' : 'Binocular cue') : 'Gestalt', tone: 'readout' }], 'left', 'explore'); LS.pills([], 'right', 'explore'); }
      }
    }
    function nums(){
      var el = $('.sn-nums'); if(!el) return;
      var rows = [-1, 0, 0.75, 1.5, 2.25].map(function(cc){ var r = X.sdt(d, cc); return '<tr><td>' + wordsC(cc) + '</td><td>' + pc(r.hit) + '</td><td>' + pc(r.miss) + '</td><td>' + pc(r.fa) + '</td><td>' + pc(r.cr) + '</td></tr>'; }).join('');
      el.innerHTML = '<h3 class="ls-title-l">Signal detection at signal strength ' + d + '</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Signal detection outcomes"><table class="ls-tbl"><thead><tr><th scope="col">Criterion</th><th scope="col">Hits</th><th scope="col">Misses</th><th scope="col">False alarms</th><th scope="col">Correct rejections</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="bt-small">Hits and misses are percents of the trials with the signal; false alarms and correct rejections of the trials without it. Both curves are normal with an SD of 1 (an explanatory model).</p>' +
        '<h3 class="ls-title-l">Weber fractions (typical textbook values)</h3><ul class="sn-list">' + Object.keys(X.WEBER).map(function(k){ return '<li><b>' + esc(X.WEBER[k].name) + '</b>: about ' + X.WEBER[k].pct + '%</li>'; }).join('') + '</ul>' +
        '<h3 class="ls-title-l">Depth cues and Gestalt principles</h3><ul class="sn-list">' + FIGS.map(function(k){ return '<li><b>' + esc(figName(k)) + '</b>: ' + esc(figLookOf(k)) + '</li>'; }).join('') + '</ul>';
    }
    function figLookOf(k){ return (X.DEPTH[k] || X.GESTALT[k]).look; }

    var geo = null;
    function size(){ var rc = $('.sn-fig').getBoundingClientRect(); return [Math.max(300, Math.min(1500, Math.round(rc.width) || 640)), Math.max(300, Math.min(1000, Math.round(rc.height) || 480))]; }
    function draw(){
      var wh = size(), W = wh[0], H = wh[1], phone = W < 560, fs = phone ? 12.5 : 14, out, label;
      if(scene === 'detect'){ var a = sdtArt(6, 4, W - 12, H - 8, { d: d, c: c, trials: trials, fs: fs, drag: true, enl: true }); geo = a; out = a.svg; label = 'Two normal curves: noise only, and signal plus noise ' + d + ' SD to the right. The criterion line is ' + wordsC(c) + '. ' + sdtLine() + (trials.length ? ' ' + tally() : ''); }
      else if(scene === 'weber'){ out = weberArt(6, 4, W - 12, H - 8, { I: I, add: add, k: X.WEBER.brightness.k, fs: fs, enl: true }).svg; label = 'Two patches of light, starting brightness ' + I + ' and comparison ' + (I + add) + '. ' + weberLine() + ' A graph shows the JND rising in a straight line with the starting brightness.'; }
      else if(scene === 'color'){ out = afterArt(6, 4, W - 12, H - 8, { pic: pic, phase: left != null ? 'stare' : phase, fs: fs }).svg; label = phase === 'white' ? 'A white page with a dot. Look for the afterimage.' : phase === 'shown' ? 'The afterimage most people see: ' + afterWords() + '.' : 'A picture to stare at: ' + (pic === 'flag' ? 'a flag with yellow, black and green stripes' : 'a ' + pic + ' square') + ', with a dot in the middle.'; }
      else { var isD = !!X.DEPTH[fig]; out = isD ? depthArt(6, 4, W - 12, H - 8, fig, show, fs) : gestaltArt(6, 4, W - 12, H - 8, fig, show, fs); label = figName(fig) + '. ' + figLook() + (show ? ' The cue is drawn.' : ''); }
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.innerHTML = out; svg.setAttribute('aria-label', label);
      svg.classList.toggle('is-stare', scene === 'color');
    }

    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.sn-fig')], dock: [$('.sn-ctl')], setup: 'Settings', moreLabel: 'Signal strength, starting brightness, stare time', why: [$('.sn-say')], details: [$('.sn-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      sync(); draw(); words();
      if(s.mode() === 'explore') ApPsychTools.hintSlot(s, s.root.querySelector('.sn-act'), 'Start here: run 20 trials', { cls: 'sn-tipslot' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ draw(); }, 60); }).observe($('.sn-fig')); }
      try{ new MutationObserver(function(){ draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
    }
    sync(); draw(); words();
    return { stop: stop, studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'sensation', noun: 'drill',
      generate: function(r, ctx, type){ return X.generate(r, ctx, type); },
      types: [{ value: 'sdt', label: 'Signal detection' }, { value: 'weber', label: 'Weber’s law' }, { value: 'threshold', label: 'Absolute threshold' }, { value: 'afterimage', label: 'Afterimages' }, { value: 'adapt', label: 'Adaptation and theories' }, { value: 'depth', label: 'Depth cues' }, { value: 'gestalt', label: 'Gestalt' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { sdt: 'Signal detection', weber: 'Weber’s law', threshold: 'The absolute threshold', afterimage: 'An afterimage', adapt: 'Which concept?', depth: 'Which depth cue?', gestalt: 'Which Gestalt principle?' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); }
    });
  }
  function figure(el, p, st){
    st = st || {};
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    var phone = (window.innerWidth || 1280) <= 640, W = phone ? 340 : 600, H = phone ? 240 : 300, fs = phone ? 12 : 13, out = '', label = '';
    if(g.kind === 'sdtgrid'){
      var cw = (W - 110) / 2, rh = (H - 40) / 2, cells = [[['hit', 'Hits', g.hits], ['miss', 'Misses', g.misses]], [['fa', 'False alarms', g.fas], ['cr', 'Correct rejections', g.crs]]];
      out += '<text class="sd-gh" x="' + r1(110 + cw / 2) + '" y="20" text-anchor="middle" font-size="' + fs + '">Said yes</text><text class="sd-gh" x="' + r1(110 + cw * 1.5) + '" y="20" text-anchor="middle" font-size="' + fs + '">Said no</text>';
      cells.forEach(function(row, ri){ out += '<text class="sd-gh" x="6" y="' + r1(40 + ri * rh + rh / 2 + 4) + '" font-size="' + fs + '">' + (ri ? 'No signal' : 'Signal') + '</text>'; row.forEach(function(c, ci){ var x = 110 + ci * cw, y = 34 + ri * rh; out += '<rect class="sd-cell is-' + c[0] + '" x="' + r1(x + 3) + '" y="' + r1(y + 3) + '" width="' + r1(cw - 6) + '" height="' + r1(rh - 6) + '" rx="10"/><text class="sd-cell-t" x="' + r1(x + cw / 2) + '" y="' + r1(y + rh / 2 - 4) + '" text-anchor="middle" font-size="' + fs + '">' + (phone && c[0] === 'cr' ? 'Correct rej.' : c[1]) + '</text><text class="sd-cell-v" x="' + r1(x + cw / 2) + '" y="' + r1(y + rh / 2 + 18) + '" text-anchor="middle" font-size="' + (fs * 1.3) + '">' + c[2] + '</text>'; }); });
      label = 'Outcome table (invented): ' + g.hits + ' hits, ' + g.misses + ' misses, ' + g.fas + ' false alarms, ' + g.crs + ' correct rejections.';
    } else if(g.kind === 'weber'){
      out = weberArt(4, 4, W - 8, H - 8, { I: g.I, add: st.notice ? g.add : 0, k: X.WEBER[g.sense].k, fs: fs, graph: false }).svg;
      label = 'Two patches: the starting stimulus ' + g.I + (st.notice ? ' and the comparison ' + (g.I + g.add) : '') + '.';
    } else if(g.kind === 'psycho'){
      out = psychoArt(4, 4, W - 8, H - 8, { levels: g.levels, pct: g.pct, unit: g.unit, T: st.thresh ? g.levels[3] : null, fs: fs });
      label = 'Detection curve (invented data): ' + g.levels.map(function(v, i){ return v + ' ' + g.unit + ', ' + g.pct[i] + '%'; }).join('; ') + '.';
    } else if(g.kind === 'after'){
      out = afterArt(4, 4, W - 8, H - 8, { pic: g.color, phase: st.color ? 'side' : 'stare', fs: fs }).svg;
      label = 'A ' + g.color + ' square' + (st.color ? ' and its afterimage, ' + X.AFTER[g.color] + '.' : '.');
    } else if(g.kind === 'depth'){
      out = depthArt(4, 4, W - 8, H - 8, g.cue, !!st.cue, fs);
      label = 'A scene showing a depth cue' + (st.cue ? ': ' + X.DEPTH[g.cue].name + '.' : '.');
    } else if(g.kind === 'gestalt'){
      out = gestaltArt(4, 4, W - 8, H - 8, g.law, !!st.law, fs);
      label = 'A figure' + (st.law ? ' showing ' + X.GESTALT[g.law].name.toLowerCase() + '.' : '.');
    }
    el.innerHTML = '<figure class="cd-fig sn-qfig"><svg class="sn-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + out + '</svg></figure>';
  }
})();
