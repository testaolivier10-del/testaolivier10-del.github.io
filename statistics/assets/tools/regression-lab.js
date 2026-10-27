/* Regression lab (simulator; docs/apstat-spec.md section 6). OWNED BY THIS TOOL
   ONLY. The model is ApStatMath.regressionLab (statistics/assets/tools/math/
   regression-lab.js); every number on the page is computed from the points on
   the screen (ApStatDist.lsrl underneath).

   Explore: a scatterplot over a residual plot on one x scale. Drag any point
   (mouse, touch, or focus it and use the arrow keys: left and right move x,
   up and down move y) or tap empty space to add one; the least-squares line,
   r, r², s and the residual plot follow at once. The dock holds three
   overlays (residuals as segments, their squares, your own line to beat the
   least-squares sum of squares) and the "Predict at x" slider with its
   extrapolation warning. A dragged point reports its residual, its leverage
   and what the fit would be without it (influence). Why explains; the
   second sheet has every number, the point table and the data set chooser.
   Test yourself: ApStatTools.drill over the model's generate(); the stage
   shows the problem's points, and answers draw the line, the prediction,
   the residual and the residual plot there. */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath, P = window.ApStatPlot;
  if(!T || !M || !M.regressionLab || !P) return;
  var R = M.regressionLab, esc = T.esc;
  var NS = 'http://www.w3.org/2000/svg';
  var app0 = document.getElementById('app');
  if(app0 && !app0.getAttribute('data-details-title')) app0.setAttribute('data-details-title', 'Data & numbers');

  T.mount('regression-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'regression-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  function fx(v, d){ return T.F(v, d == null ? 2 : d); }
  function nf(v){ return M.fmt(M.round(v, 4), 6); }
  function phone(){ return (window.innerWidth || 1280) <= 640; }
  function cap(s){ s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function eqText(a, b, dA, dB){ return 'ŷ = ' + fx(a, dA) + (b < 0 ? ' − ' : ' + ') + M.fixed(Math.abs(b), dB) + 'x'; }
  function sig(v){ var d = R.dpFor(v); return d; }

  /* ------------------------------------------------------- the picture */
  /* inner(o, W, H) -> { html, sx, sy, ix, iy, pts, sc }: the scatterplot and,
     under it, the residual plot. o: { xs, ys, x: { lo, hi, name, unit },
     y: { lo, hi, name, unit }, fit (null: no line), line ({ a, b } drawn as
     the line, default the fit), show: { seg, squares, resid, mine }, mine:
     { a, b, p: [[x, y], [x, y]] }, sel, drag, at (prediction x), far,
     residPanel } */
  function inner(o, W, H){
    var out = [], small = W < 520, fs = small ? 12 : 13.5;
    var padL = small ? 40 : 48, padR = small ? 14 : 24, top = 8, axisH = 40, gap = 16;
    var xs = o.xs, ys = o.ys, n = xs.length, X = o.x, Y = o.y, sh = o.show || {};
    var hasRes = o.residPanel !== false;
    var avail = H - top - axisH, hS = hasRes ? avail * 0.68 : avail;
    var sc = { y0: top, y1: top + hS }, rp = hasRes ? { y0: sc.y1 + gap, y1: H - axisH } : null;
    var pw = W - padL - padR;
    function sx(v){ return padL + (v - X.lo) / (X.hi - X.lo) * pw; }
    function ix(p){ return X.lo + (p - padL) / pw * (X.hi - X.lo); }
    function sy(v){ return sc.y1 - (v - Y.lo) / (Y.hi - Y.lo) * (sc.y1 - sc.y0 - 6); }
    function iy(p){ return Y.lo + (sc.y1 - p) / (sc.y1 - sc.y0 - 6) * (Y.hi - Y.lo); }
    var F = o.fit, L = o.line || F;
    var xt = P.ticks(X.lo, X.hi, small ? 5 : 8), yt = P.ticks(Y.lo, Y.hi, small ? 5 : 6);
    // grid, axes
    out.push('<g class="rl-grid" aria-hidden="true">' + xt.map(function(t){ var x = sx(t).toFixed(1); return '<line x1="' + x + '" x2="' + x + '" y1="' + sc.y0 + '" y2="' + (rp ? rp.y1 : sc.y1) + '"/>'; }).join('') +
      yt.map(function(t){ var y = sy(t).toFixed(1); return '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y + '" y2="' + y + '"/>'; }).join('') + '</g>');
    out.push('<g class="rl-axis" aria-hidden="true"><line x1="' + padL + '" x2="' + padL + '" y1="' + sc.y0 + '" y2="' + sc.y1 + '"/><line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + sc.y1 + '" y2="' + sc.y1 + '"/>' +
      yt.map(function(t){ var y = sy(t); return '<text x="' + (padL - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" style="font-size:' + (fs - 1) + 'px">' + esc(M.fmt(t, 6)) + '</text>'; }).join('') +
      '<text class="rl-axt" x="' + (padL + 6) + '" y="' + (sc.y0 + 12) + '" style="font-size:' + (fs - 0.5) + 'px">' + esc(cap(Y.name) + ' (' + Y.unit + ')') + '</text></g>');
    var base = rp ? rp.y1 : sc.y1;
    out.push('<g class="rl-axis" aria-hidden="true">' + (rp ? '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + base + '" y2="' + base + '"/>' : '') +
      xt.filter(function(t){ return !small || sx(t) < W - 46; }).map(function(t){ var x = sx(t).toFixed(1); return '<line x1="' + x + '" x2="' + x + '" y1="' + base + '" y2="' + (base + 5) + '"/><text x="' + x + '" y="' + (base + 17) + '" text-anchor="middle" style="font-size:' + (fs - 0.5) + 'px">' + esc(M.fmt(t, 6)) + '</text>'; }).join('') +
      '<text class="rl-axt" x="' + (padL + pw / 2) + '" y="' + (H - 5) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(cap(X.name) + ' (' + X.unit + ')') + '</text></g>');
    out.push('<defs><clipPath id="' + o.clip + '"><rect x="' + padL + '" y="' + sc.y0 + '" width="' + pw + '" height="' + (sc.y1 - sc.y0) + '"/></clipPath></defs>');
    var g = '<g clip-path="url(#' + o.clip + ')">';
    // the line the residuals are measured from (yours, in "your line" mode)
    var ref = sh.mine && o.mine ? o.mine : L;
    if(ref && (sh.seg || sh.squares)){
      xs.forEach(function(x, i){
        var yh = ref.a + ref.b * x, y1 = sy(ys[i]), y2 = sy(yh), xx = sx(x), side = Math.abs(y1 - y2);
        if(sh.squares){ var right = xx + side <= W - padR, x0 = right ? xx : xx - side; g += '<rect class="rl-sq' + (ys[i] >= yh ? ' is-pos' : ' is-neg') + '" x="' + x0.toFixed(1) + '" y="' + Math.min(y1, y2).toFixed(1) + '" width="' + side.toFixed(1) + '" height="' + side.toFixed(1) + '"/>'; }
        if(sh.seg || sh.squares) g += '<line class="rl-seg' + (o.sel === i ? ' is-sel' : '') + '" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + y1.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
      });
    }
    // a single residual (drills)
    if(o.segOnly != null && L){ var j = o.segOnly, yh2 = L.a + L.b * xs[j]; g += '<line class="rl-seg is-sel" x1="' + sx(xs[j]).toFixed(1) + '" x2="' + sx(xs[j]).toFixed(1) + '" y1="' + sy(ys[j]).toFixed(1) + '" y2="' + sy(yh2).toFixed(1) + '"/>'; }
    if(L){
      g += '<line class="rl-line" x1="' + sx(X.lo).toFixed(1) + '" x2="' + sx(X.hi).toFixed(1) + '" y1="' + sy(L.a + L.b * X.lo).toFixed(1) + '" y2="' + sy(L.a + L.b * X.hi).toFixed(1) + '"/>';
      // the data's x range, solid; beyond it, dashed: extrapolation
      if(o.dataRange){ var mn = Math.min.apply(null, xs), mx = Math.max.apply(null, xs);
        g += '<line class="rl-line is-ext" x1="' + sx(X.lo).toFixed(1) + '" x2="' + sx(mn).toFixed(1) + '" y1="' + sy(L.a + L.b * X.lo).toFixed(1) + '" y2="' + sy(L.a + L.b * mn).toFixed(1) + '"/><line class="rl-line is-ext" x1="' + sx(mx).toFixed(1) + '" x2="' + sx(X.hi).toFixed(1) + '" y1="' + sy(L.a + L.b * mx).toFixed(1) + '" y2="' + sy(L.a + L.b * X.hi).toFixed(1) + '"/>'; }
    }
    if(sh.mine && o.mine){
      g += '<line class="rl-mine" x1="' + sx(X.lo).toFixed(1) + '" x2="' + sx(X.hi).toFixed(1) + '" y1="' + sy(o.mine.a + o.mine.b * X.lo).toFixed(1) + '" y2="' + sy(o.mine.a + o.mine.b * X.hi).toFixed(1) + '"/>';
    }
    // the prediction
    if(o.at != null && L){
      var xa = Math.max(X.lo, Math.min(X.hi, o.at)), ya = L.a + L.b * xa, outR = o.extrap;
      g += '<line class="rl-at' + (outR ? ' is-warn' : '') + '" x1="' + sx(xa).toFixed(1) + '" x2="' + sx(xa).toFixed(1) + '" y1="' + sc.y1 + '" y2="' + sy(ya).toFixed(1) + '"/>' +
        '<line class="rl-at' + (outR ? ' is-warn' : '') + '" x1="' + padL + '" x2="' + sx(xa).toFixed(1) + '" y1="' + sy(ya).toFixed(1) + '" y2="' + sy(ya).toFixed(1) + '"/>' +
        '<circle class="rl-hat' + (outR ? ' is-warn' : '') + '" cx="' + sx(xa).toFixed(1) + '" cy="' + sy(ya).toFixed(1) + '" r="6"/>';
    }
    // the target x of a prediction, before it is answered: a guide up to the line
    if(o.guide != null && L && o.at == null){
      var xg = Math.max(X.lo, Math.min(X.hi, o.guide));
      g += '<line class="rl-at" x1="' + sx(xg).toFixed(1) + '" x2="' + sx(xg).toFixed(1) + '" y1="' + sc.y1 + '" y2="' + sy(L.a + L.b * xg).toFixed(1) + '"/>';
    }
    // the student's answer: a predicted point, or a residual from the chosen point
    if(o.yours){
      var Yo = o.yours;
      if(Yo.kind === 'point'){ var ypx = sy(Yo.y); g += '<circle class="stat-yours" cx="' + sx(Yo.x).toFixed(1) + '" cy="' + ypx.toFixed(1) + '" r="7"/>'; }
      if(Yo.kind === 'resid' && o.sel != null && o.sel > -1){ var jx = sx(xs[o.sel]), yh3 = L ? L.a + L.b * xs[o.sel] : ys[o.sel]; g += '<line class="stat-yours" x1="' + (jx + 6).toFixed(1) + '" x2="' + (jx + 6).toFixed(1) + '" y1="' + sy(yh3).toFixed(1) + '" y2="' + sy(yh3 + Yo.e).toFixed(1) + '"/><circle class="stat-yours-f" cx="' + (jx + 6).toFixed(1) + '" cy="' + sy(yh3 + Yo.e).toFixed(1) + '" r="4"/>'; }
    }
    g += '</g>';
    out.push(g);
    if(o.yours){
      var yl = 'yours: ' + o.yours.t, yy0 = o.yours.kind === 'point' ? sy(o.yours.y) : sc.y0 + 30, yx = o.yours.kind === 'point' ? sx(o.yours.x) : W - padR - 4;
      var yclip = o.yours.kind === 'point' && (o.yours.y < Y.lo || o.yours.y > Y.hi);
      var yw = yl.length * fs * 0.56, isPt = o.yours.kind === 'point';
      out.push('<text class="stat-yours-t" x="' + (isPt ? Math.max(padL + yw / 2, Math.min(W - padR - yw / 2, yx)) : yx).toFixed(1) + '" y="' + (isPt ? Math.max(sc.y0 + 30, Math.min(sc.y1 - 6, yy0 - 14)) : yy0).toFixed(1) + '" text-anchor="' + (isPt ? 'middle' : 'end') + '" style="font-size:' + fs + 'px">' + esc(yl + (yclip ? (o.yours.y > Y.hi ? ' ↑' : ' ↓') : '')) + '</text>');
    }
    if(o.at != null && L){
      var xa2 = Math.max(X.lo, Math.min(X.hi, o.at)), ya2 = L.a + L.b * xa2, ly = sy(ya2), t = 'ŷ = ' + nf(M.round(ya2, sig(ya2))) + (o.extrap ? ' (extrapolation)' : '');
      // on the y axis end of the dashed guide, clear of the points
      out.push('<text class="rl-hatl' + (o.extrap ? ' is-warn' : '') + '" x="' + (padL + 6) + '" y="' + Math.max(sc.y0 + 30, ly - 7).toFixed(1) + '" style="font-size:' + fs + 'px">' + esc(t) + '</text>');
    }
    if(o.far != null){
      var fxp = W - padR - 4;
      out.push('<text class="rl-hatl is-warn" x="' + fxp + '" y="' + (sc.y1 - 10) + '" text-anchor="end" style="font-size:' + fs + 'px">' + esc('x = ' + nf(o.far) + ' is off the scale →') + '</text>');
    }
    // the points
    var pts = [], pg = '<g class="rl-pts">', rad = small ? 7 : 7.5;
    xs.forEach(function(x, i){
      var cx = sx(x), cy = sy(ys[i]), cls = 'rl-pt' + (o.sel === i ? ' is-sel' : '') + (o.flag && o.flag[i] ? ' is-flag' : '');
      pts.push({ i: i, cx: cx, cy: cy });
      pg += o.drag ? '<circle class="' + cls + '" data-i="' + i + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + rad + '" tabindex="0" role="slider" aria-roledescription="draggable point" aria-label="Point ' + (i + 1) + '" aria-valuenow="' + ys[i] + '" aria-valuemin="' + Y.lo + '" aria-valuemax="' + Y.hi + '" aria-valuetext="' + esc(X.name + ' ' + nf(x) + ' ' + X.unit + ', ' + Y.name + ' ' + nf(ys[i]) + ' ' + Y.unit) + '" aria-describedby="' + o.clip + '-k"/>'
        : '<circle class="' + cls + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + rad + '"/>';
    });
    out.push(pg + '</g>');
    if(o.flag && o.flag.some(Boolean)) out.push('<g class="rl-key" aria-hidden="true"><circle cx="' + (W - padR - 8) + '" cy="' + (sc.y0 + 8) + '" r="5"/><text x="' + (W - padR - 18) + '" y="' + (sc.y0 + 12) + '" text-anchor="end" style="font-size:' + (fs - 1) + 'px">outlier or influential</text></g>');
    if(o.drag) out.push('<desc id="' + o.clip + '-k">Arrow keys move the point: left and right change ' + esc(X.name) + ', up and down change ' + esc(Y.name) + '. Shift moves farther. Delete removes it.</desc>');
    if(sh.mine && o.mine && o.drag){
      o.mine.p.forEach(function(q, k){ out.push('<g class="rl-handle" data-h="' + k + '" tabindex="0" role="slider" aria-label="Your line, ' + (k ? 'right' : 'left') + ' handle" aria-valuenow="' + M.round(q[1], 3) + '" aria-valuemin="' + Y.lo + '" aria-valuemax="' + Y.hi + '" aria-valuetext="' + esc('at x = ' + nf(q[0]) + ', y = ' + nf(M.round(q[1], 2))) + '" transform="translate(' + sx(q[0]).toFixed(1) + ' ' + sy(q[1]).toFixed(1) + ')"><rect x="-9" y="-9" width="18" height="18" rx="4"/><path d="M-4 -2 L0 -6 L4 -2 M-4 2 L0 6 L4 2"/></g>'); });
    }
    // the selected point's label
    if(o.sel != null && o.sel > -1 && o.sel < n){
      var sp = pts[o.sel], lab = '(' + nf(xs[o.sel]) + ', ' + nf(ys[o.sel]) + ')', lw = lab.length * fs * 0.55;
      var la = sp.cx + 12 + lw < W - padR ? 'start' : 'end';
      out.push('<text class="rl-sell" x="' + (la === 'start' ? sp.cx + 12 : sp.cx - 12).toFixed(1) + '" y="' + (sp.cy - 10).toFixed(1) + '" text-anchor="' + la + '" style="font-size:' + fs + 'px">' + esc(lab) + '</text>');
    }

    // ---- residual plot
    if(rp){
      var res = L ? xs.map(function(x, i){ return ys[i] - (L.a + L.b * x); }) : null;
      var m = res ? Math.max.apply(null, res.map(Math.abs).concat([1e-9])) : 1;
      // A round tick step, then the scale to the first tick past the largest residual.
      var rs = (function(x){ var p = Math.pow(10, Math.floor(Math.log10(x))), k = x / p; return (k <= 1 ? 1 : k <= 2 ? 2 : k <= 2.5 ? 2.5 : k <= 5 ? 5 : 10) * p; })(m / 1.6);
      var rtop = Math.ceil(m / rs - 1e-9) * rs, rm = Math.max(rtop, m) * 1.12, rticks = [];
      for(var rk = rs; rk <= rtop + 1e-9; rk += rs) rticks.push(+rk.toPrecision(6));
      if(rticks.length > 2) rticks = [rticks[Math.floor((rticks.length - 1) / 2)], rticks[rticks.length - 1]];
      var ry = function(e){ return (rp.y0 + rp.y1) / 2 - e / rm * ((rp.y1 - rp.y0) / 2 - 4); };
      var rg = '<g class="rl-res"><text class="rl-axt" x="' + (padL + 6) + '" y="' + (rp.y0 + 2) + '" style="font-size:' + (fs - 0.5) + 'px">Residual plot: y − ŷ (' + esc(Y.unit) + ')' + (sh.mine ? ', from the least-squares line' : '') + '</text>' +
        '<line class="rl-axis-l" x1="' + padL + '" x2="' + padL + '" y1="' + rp.y0 + '" y2="' + rp.y1 + '"/>';
      if(res){
        rg += '<line class="rl-zero" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + ry(0).toFixed(1) + '" y2="' + ry(0).toFixed(1) + '"/>' +
          rticks.slice(-1).concat(rticks.slice(-1).map(function(v){ return -v; })).map(function(v){ return '<line class="rl-rgrid" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + ry(v).toFixed(1) + '" y2="' + ry(v).toFixed(1) + '"/><text class="rl-rt" x="' + (padL - 6) + '" y="' + (ry(v) + 4).toFixed(1) + '" text-anchor="end" style="font-size:' + (fs - 1) + 'px">' + esc(String(v).replace('-', '−')) + '</text>'; }).join('') +
          '<text class="rl-rt" x="' + (padL - 6) + '" y="' + (ry(0) + 4).toFixed(1) + '" text-anchor="end" style="font-size:' + (fs - 1) + 'px">0</text>';
        res.forEach(function(e, i){ var x = sx(xs[i]).toFixed(1); rg += '<line class="rl-stem' + (o.sel === i ? ' is-sel' : '') + '" x1="' + x + '" x2="' + x + '" y1="' + ry(0).toFixed(1) + '" y2="' + ry(e).toFixed(1) + '"/><circle class="rl-rpt' + (o.sel === i ? ' is-sel' : '') + '" cx="' + x + '" cy="' + ry(e).toFixed(1) + '" r="' + (small ? 4.5 : 5) + '"/>'; });
      } else rg += '<text class="rl-ph" x="' + (padL + pw / 2) + '" y="' + ((rp.y0 + rp.y1) / 2 + 4) + '" text-anchor="middle" style="font-size:' + fs + 'px">The residual plot appears with the line.</text>';
      out.push(rg + '</g>');
    }
    return { html: out.join(''), sx: sx, sy: sy, ix: ix, iy: iy, pts: pts, sc: sc };
  }
  function sizeOf(el, fb){
    var r = el.getBoundingClientRect(), w = Math.round(r.width) || 640, h = Math.round(r.height) || 0;
    w = Math.max(260, Math.min(1400, w));
    if(!h || h < 220) h = fb;
    return [w, Math.min(h, 900)];
  }

  /* --------------------------------------------------------- explore */
  function explore(host, data){
    var sets = ((data.explore || {}).datasets || []).filter(function(d){ return d.xs && d.xs.length > 2; });
    var cur = sets[0], xs = cur.xs.slice(), ys = cur.ys.slice(), sel = -1, LS = null, touched = false;
    var show = { seg: false, squares: false, mine: false }, mine = null, at = null, lastMsg = '', before = null;
    var nid = T.nid('rl');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem rl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Regression lab</h2>' +
      '<div class="rl-fig"><svg class="rl-svg" xmlns="' + NS + '" role="group"></svg></div>' +
      '<div class="rl-ctl"><div class="rl-chips" role="group" aria-label="Show on the scatterplot">' +
        '<button type="button" class="tchip rl-chip" data-k="seg" aria-pressed="false">Residuals</button>' +
        '<button type="button" class="tchip rl-chip" data-k="squares" aria-pressed="false">Squares</button>' +
        '<button type="button" class="tchip rl-chip" data-k="mine" aria-pressed="false">Your line</button></div>' +
        '<div class="rl-pred"></div></div>' +
      '<div class="rl-say"></div>' +
      T.moreHtml('<div class="rl-pick"></div><div class="bt-buttons rl-btns"><button type="button" class="bt-btn rl-add">Add a point</button><button type="button" class="bt-btn rl-rm">Remove the selected point</button><button type="button" class="bt-btn rl-reset">Reset the data</button></div><p class="bt-small rl-note" role="status"></p>', 'the data set and its points') +
      '<div class="rl-nums"></div><p class="sr-only rl-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.rl-live'));
    var cue = T.cue('Drag one point far above the line and watch the line, r and the residual plot respond. Tap empty space to add a point.');
    $('.rl-ctl').insertBefore(cue.el, $('.rl-ctl').firstChild);
    var predSl = null;
    function makePred(){
      if(predSl) predSl.el.remove();
      var X = cur.x, mid = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
      at = M.round(Math.round(mid / X.step) * X.step, 6);
      predSl = T.slider({ label: 'Predict ' + cur.y.name + ' at x =', min: X.lo, max: X.hi, step: X.step, value: at, unit: X.short || X.unit, decimals: X.dp, onInput: function(v){ at = v; act(); lastMsg = ''; draw(); } });
      $('.rl-pred').appendChild(predSl.el);
    }
    makePred();
    var pick = T.choiceSelect({ label: 'Data set', options: sets.map(function(d, i){ return { value: i, label: d.name }; }), value: 0, onChange: function(v){ load(sets[+v]); } });
    $('.rl-pick').appendChild(pick.el);
    host.querySelectorAll('.rl-chip').forEach(function(b){ b.addEventListener('click', function(){ var k = b.getAttribute('data-k'); show[k] = !show[k]; if(k === 'mine' && show.mine) startMine(); act(); lastMsg = ''; draw(); }); });
    $('.rl-add').addEventListener('click', function(){
      if(xs.length >= 30){ note('That is plenty of points.'); return; }
      var F = R.fit(xs, ys), x = snapX((cur.x.lo + cur.x.hi) / 2), y = snapY(F.a + F.b * x + F.s * 2.5);
      xs.push(x); ys.push(y); sel = xs.length - 1; act(); lastMsg = ''; draw(); note('Added (' + nf(x) + ', ' + nf(y) + '). n = ' + xs.length + '.');
    });
    $('.rl-rm').addEventListener('click', removeSel);
    $('.rl-reset').addEventListener('click', function(){ xs = cur.xs.slice(); ys = cur.ys.slice(); sel = -1; lastMsg = ''; if(show.mine) startMine(); draw(); note('Back to the original ' + xs.length + ' points.'); });
    function removeSel(){
      if(sel < 0){ note('Tap a point first, then remove it.'); return; }
      if(xs.length <= 3){ note('Keep at least three points.'); return; }
      var p = '(' + nf(xs[sel]) + ', ' + nf(ys[sel]) + ')';
      xs.splice(sel, 1); ys.splice(sel, 1); sel = -1; lastMsg = ''; draw(); note('Removed ' + p + '. n = ' + xs.length + '.'); say('Removed point ' + p + '.');
    }
    function note(t){ var n = $('.rl-note'); if(n) n.textContent = t; }
    function load(d){ cur = d; xs = d.xs.slice(); ys = d.ys.slice(); sel = -1; lastMsg = ''; makePred(); if(show.mine) startMine(); if(LSsetup) LSsetup(d.name); draw(); }
    function act(){ if(!touched){ touched = true; cue.done(); } }
    function snapX(v){ var X = cur.x; return Math.max(X.lo, Math.min(X.hi, M.round(Math.round(v / X.step) * X.step, 6))); }
    function snapY(v){ var Y = cur.y; return Math.max(Y.lo, Math.min(Y.hi, M.round(Math.round(v / Y.step) * Y.step, 6))); }
    function startMine(){
      // a level line at ȳ to start: the student tilts it toward the points
      var X = cur.x, yb = M.Dist().mean(ys), xa = X.lo + (X.hi - X.lo) * 0.15, xb = X.lo + (X.hi - X.lo) * 0.85;
      mine = { p: [[xa, yb], [xb, yb]] }; lineOfMine();
    }
    function lineOfMine(){ var p = mine.p, b = (p[1][1] - p[0][1]) / (p[1][0] - p[0][0]); mine.b = b; mine.a = p[0][1] - b * p[0][0]; }

    var svg = $('.rl-svg'), fig = $('.rl-fig'), geo = null, restoring = false, F = null;
    function flags(){ if(xs.length < 4) return null; var f = []; for(var i = 0; i < xs.length; i++){ var q = R.point(xs, ys, i, F); f.push(q.outlier || (q.influential && q.dx > 1.5)); } return f; }
    function draw(){
      F = R.fit(xs, ys);
      var ok = isFinite(F.b) && isFinite(F.r);
      var wh = sizeOf(fig, phone() ? 440 : 480), X = cur.x, mn = Math.min.apply(null, xs), mx = Math.max.apply(null, xs);
      var o = { xs: xs, ys: ys, x: X, y: cur.y, fit: ok ? F : null, show: show, mine: show.mine ? mine : null, sel: sel, drag: true, at: ok ? at : null,
        extrap: at < mn || at > mx, dataRange: true, clip: nid + '-c', flag: ok ? flags() : null };
      svg.setAttribute('viewBox', '0 0 ' + wh[0] + ' ' + wh[1]); svg.setAttribute('width', wh[0]); svg.setAttribute('height', wh[1]);
      var ae = document.activeElement, fi = ae && ae.closest && ae.closest('.rl-svg') ? (ae.getAttribute('data-i') != null ? '[data-i="' + ae.getAttribute('data-i') + '"]' : ae.getAttribute('data-h') != null ? '[data-h="' + ae.getAttribute('data-h') + '"]' : null) : null;
      geo = inner(o, wh[0], wh[1]);
      svg.innerHTML = geo.html;
      svg.setAttribute('aria-label', ok ? 'Scatterplot of ' + cur.y.name + ' against ' + cur.x.name + ', ' + xs.length + ' points, with the least-squares line ' + eqText(F.a, F.b, sig(F.a), sig(F.b)) + ', r = ' + fx(F.r, 3) + ', and a residual plot below.' : 'Scatterplot with ' + xs.length + ' points; no line until the x values differ.');
      if(fi){ var f = svg.querySelector(fi); if(f){ restoring = true; f.focus({ preventScroll: true }); restoring = false; } }
      var sync = function(b){ var on = !!show[b.getAttribute('data-k')]; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); };
      host.querySelectorAll('.rl-chip').forEach(sync); if(LS) LS.root.querySelectorAll('.rl-chip').forEach(sync);
      words(ok);
    }

    function words(ok){
      var X = cur.x, Y = cur.y, head;
      if(!ok){ head = '<b>No line yet.</b> The x values must differ.'; T.explain($('.rl-say'), head, ''); if(LS) LS.caption(head, 'explore'); return; }
      var dA = sig(F.a), dB = sig(F.b), mn = Math.min.apply(null, xs), mx = Math.max.apply(null, xs), st = R.strength(F.r), dir = R.direction(F.r);
      var curve = xs.length >= 6 ? R.curvature(xs, F.residuals) : 0;
      if(lastMsg) head = lastMsg;
      else if(show.mine && mine){
        var mySse = R.sse(xs, ys, mine.a, mine.b), ratio = mySse / F.sse;
        head = '<b>Your line: sum of squares ' + esc(nf(M.round(mySse, 1))) + '. Least squares: ' + esc(nf(M.round(F.sse, 1))) + '.</b> ' + (ratio < 1.01 ? 'That is the least-squares line, to within 1%.' : 'Drag the two handles to make yours smaller. No line can beat least squares.');
      } else if(at != null && (at < mn || at > mx) && touched){
        head = '<b>Extrapolation: x = ' + esc(nf(at)) + ' is outside the data (' + esc(nf(mn)) + ' to ' + esc(nf(mx)) + ').</b> ŷ = ' + esc(nf(M.round(F.a + F.b * at, sig(F.a + F.b * at)))) + ' assumes the pattern continues, which the data cannot show.';
      } else if(sel > -1){ head = pointText(sel); }
      else head = '<b>' + esc(eqText(F.a, F.b, dA, dB)) + ', r = ' + esc(fx(F.r, 2)) + '.</b> ' + esc(cap(st) + ', ' + dir + (Math.abs(curve) > 0.6 ? ', but the residuals curve' : ', linear') + '. ') + (touched ? '' : 'Drag a point and watch the line and r respond.');
      T.explain($('.rl-say'), head, whyHtml(curve));
      nums(curve);
      if(LS){
        LS.caption(head, 'explore');
        LS.pills([{ html: esc(eqText(F.a, F.b, dA, dB)), tone: 'readout' }], 'left', 'explore');
        LS.pills([{ k: 'r', html: esc(fx(F.r, 2)), tone: 'ghost' }, { k: 'r²', html: esc(fx(F.r2, 2)), tone: 'ghost' }], 'right', 'explore');
      }
    }
    function pointText(i){
      var q = R.point(xs, ys, i, F), u = cur.y.unit, bits = [];
      if(q.outlier) bits.push('an outlier (|residual| > 2s = ' + fx(2 * F.s, 2) + ')');
      if(q.leverage) bits.push('high leverage (x is ' + fx(q.dx, 1) + ' SDs from x̄)');
      var wo = q.without ? 'Without it: slope ' + fx(q.without.b, sig(q.without.b)) + ' (now ' + fx(F.b, sig(F.b)) + '), r ' + fx(q.without.r, 2) + ' (now ' + fx(F.r, 2) + ')' + (q.influential ? ', so it is influential.' : ', so it is not influential.') : '';
      return '<b>(' + esc(nf(xs[i]) + ', ' + nf(ys[i])) + '): residual ' + esc(fx(q.residual, 2) + ' ' + u) + '.</b> ' + esc((bits.length ? 'It is ' + bits.join(' and ') + '. ' : '') + wo);
    }
    function whyHtml(curve){
      var X = cur.x, Y = cur.y;
      return '<h3 class="rl-h">The least-squares line</h3><p>Of every possible line, ' + esc(eqText(F.a, F.b, sig(F.a), sig(F.b))) + ' makes the sum of the squared residuals smallest (' + esc(nf(M.round(F.sse, 2))) + '). Turn on Squares to see them, then Your line to try to beat it. It always passes through (x̄, ȳ) = (' + esc(fx(F.xbar, 2)) + ', ' + esc(fx(F.ybar, 2)) + ').</p>' +
        '<h3 class="rl-h">Slope</h3><p>' + esc(X.per) + ', the predicted ' + esc(Y.name) + ' ' + (F.b >= 0 ? 'increases' : 'decreases') + ' by about ' + esc(M.fixed(Math.abs(F.b), sig(F.b))) + ' ' + esc(Y.unit) + '. Say “predicted”: individual points scatter around the line.</p>' +
        '<h3 class="rl-h">r and r²</h3><p>r = ' + esc(fx(F.r, 3)) + ' measures the direction and strength of the linear association (' + esc(R.strength(F.r)) + ', ' + esc(R.direction(F.r)) + '; ' + esc(R.RULES.strength) + ') r² = ' + esc(fx(F.r2, 3)) + ': about ' + Math.round(F.r2 * 100) + '% of the variation in ' + esc(Y.name) + ' is accounted for by the linear model using ' + esc(X.name) + '.</p>' +
        '<details class="rl-more"><summary>More: residuals, outliers and extrapolation</summary>' +
        '<h3 class="rl-h">s and residuals</h3><p>A residual is actual minus predicted, y − ŷ: above the line is positive. s = ' + esc(fx(F.s, 2)) + ' ' + esc(Y.unit) + ' is the typical size of a residual, the typical prediction error.</p>' +
        '<h3 class="rl-h">The residual plot</h3><p>' + (Math.abs(curve) > 0.6 ? 'Here the residuals curve (pattern score ' + esc(fx(curve, 2)) + '): a line misses the form, even though r is ' + esc(fx(F.r, 2)) + '.' : 'Here the residuals scatter with no clear curve (pattern score ' + esc(fx(curve, 2)) + '), so a line fits the form.') + ' The pattern score is the correlation of the residuals with (x − x̄)²; above 0.6 in size it flags a bend.</p>' +
        '<h3 class="rl-h">Outliers, leverage, influence</h3><p>' + esc(R.RULES.outlier + ' ' + R.RULES.leverage + ' ' + R.RULES.influential) + ' Drag a point far to the right of the others and up or down: it pulls the line with it.</p>' +
        '<h3 class="rl-h">Extrapolation</h3><p>The line is solid over the x values in the data and dashed beyond them. Predictions out there assume the pattern continues.</p>' +
        '<h3 class="rl-h">Correlation is not causation</h3><p>Only a randomized experiment supports a cause and effect conclusion.</p></details>';
    }
    function nums(curve){
      var X = cur.x, Y = cur.y, rows = [['n', String(F.n)], ['Equation', eqText(F.a, F.b, 4, 4)], ['Slope, b', fx(F.b, 4)], ['Intercept, a', fx(F.a, 4)], ['r', fx(F.r, 4)], ['r²', fx(F.r2, 4)], ['s', fx(F.s, 4)],
        ['x̄, s_x', fx(F.xbar, 3) + ', ' + fx(F.sx, 3)], ['ȳ, s_y', fx(F.ybar, 3) + ', ' + fx(F.sy, 3)], ['Sum of squared residuals', fx(F.sse, 3)], ['Residual pattern score', fx(curve, 3)]];
      var pts = xs.map(function(x, i){ var yh = F.a + F.b * x; return '<tr' + (i === sel ? ' class="hl"' : '') + '><td class="r">' + esc(nf(x)) + '</td><td class="r">' + esc(nf(ys[i])) + '</td><td class="r">' + esc(fx(yh, 2)) + '</td><td class="r">' + esc(fx(ys[i] - yh, 2)) + '</td></tr>'; }).join('');
      $('.rl-nums').innerHTML = '<h3 class="ls-title-l">The fit, from the points</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Regression summary"><table class="ls-tbl rl-tbl"><caption class="sr-only">Least-squares summary</caption><tbody>' +
        rows.map(function(r){ return '<tr><th scope="row">' + esc(r[0]).replace('s_x', 's<sub>x</sub>').replace('s_y', 's<sub>y</sub>') + '</th><td class="r">' + esc(r[1]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<p class="bt-small">b = r · s<sub>y</sub> / s<sub>x</sub> = ' + esc(fx(F.r, 4)) + ' × ' + esc(fx(F.sy, 3)) + ' / ' + esc(fx(F.sx, 3)) + ' = ' + esc(fx(F.b, 4)) + '; a = ȳ − b x̄ = ' + esc(fx(F.a, 4)) + '.</p>' +
        '<h3 class="ls-title-l">Every point</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Points, predictions and residuals"><table class="ls-tbl rl-tbl"><caption class="sr-only">Each point with its prediction and residual</caption><thead><tr><th scope="col">x (' + esc(X.short || X.unit) + ')</th><th scope="col">y (' + esc(Y.short || Y.unit) + ')</th><th scope="col">ŷ</th><th scope="col">y − ŷ</th></tr></thead><tbody>' + pts + '</tbody></table></div>';
    }

    /* ---- dragging (pointer capture on the svg, which stays across redraws) */
    var drag = null;
    function local(e){ var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(); return m ? pt.matrixTransform(m.inverse()) : pt; }
    function nearest(p){ var best = -1, bd = 1e9; geo.pts.forEach(function(q){ var d = Math.hypot(q.cx - p.x, q.cy - p.y); if(d < bd){ bd = d; best = q.i; } }); return bd <= 24 ? best : -1; }
    svg.addEventListener('pointerdown', function(e){
      if(e.button > 0) return;
      var p = local(e), h = e.target.closest && e.target.closest('[data-h]');
      if(h && mine){ e.preventDefault(); drag = { h: +h.getAttribute('data-h'), id: e.pointerId, moved: false }; try{ svg.setPointerCapture(e.pointerId); }catch(er){} return; }
      var t = e.target.closest && e.target.closest('[data-i]'), i = t ? +t.getAttribute('data-i') : nearest(p);
      if(i < 0){
        // inside the scatterplot: add a point there and keep dragging it
        if(p.y > geo.sc.y1 || p.y < geo.sc.y0 || xs.length >= 30) { if(sel > -1){ sel = -1; lastMsg = ''; draw(); } return; }
        e.preventDefault();
        before = R.fit(xs, ys);
        xs.push(snapX(geo.ix(p.x))); ys.push(snapY(geo.iy(p.y))); i = xs.length - 1; sel = i; act(); lastMsg = '';
        drag = { i: i, id: e.pointerId, moved: true, added: true }; try{ svg.setPointerCapture(e.pointerId); }catch(er){}
        draw(); return;
      }
      e.preventDefault();
      before = R.fit(xs, ys);
      drag = { i: i, id: e.pointerId, moved: false, p0: [p.x, p.y], v0: [xs[i], ys[i]] };
      try{ svg.setPointerCapture(e.pointerId); }catch(er){}
      sel = i; act(); lastMsg = ''; draw();
    });
    svg.addEventListener('pointermove', function(e){
      if(!drag || e.pointerId !== drag.id) return;
      var p = local(e);
      if(drag.h != null){ mine.p[drag.h][1] = Math.max(cur.y.lo, Math.min(cur.y.hi, geo.iy(p.y))); lineOfMine(); drag.moved = true; draw(); return; }
      if(!drag.moved && drag.p0 && Math.hypot(p.x - drag.p0[0], p.y - drag.p0[1]) < 3) return;
      drag.moved = true;
      var nx = snapX(geo.ix(p.x)), ny = snapY(geo.iy(p.y));
      if(nx !== xs[drag.i] || ny !== ys[drag.i]){ xs[drag.i] = nx; ys[drag.i] = ny; draw(); }
    });
    function up(e){
      if(!drag || (e && e.pointerId !== drag.id)) return;
      var d = drag; drag = null;
      if(d.h != null){ say(plain(captionNow())); return; }
      if(d.moved) settle(d.i, d.added); else { draw(); say(plain(captionNow())); }
    }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    svg.addEventListener('keydown', function(e){
      var h = e.target.closest && e.target.closest('[data-h]');
      var k = e.key, big = e.shiftKey ? 10 : 1;
      if(h && mine){
        var j = +h.getAttribute('data-h'), dy = cur.y.step * big * ((cur.y.hi - cur.y.lo) / cur.y.step > 200 ? 5 : 1);
        if(k === 'ArrowUp' || k === 'ArrowRight') mine.p[j][1] += dy; else if(k === 'ArrowDown' || k === 'ArrowLeft') mine.p[j][1] -= dy; else return;
        e.preventDefault(); mine.p[j][1] = Math.max(cur.y.lo, Math.min(cur.y.hi, mine.p[j][1])); lineOfMine(); draw(); say(plain(captionNow())); return;
      }
      var t = e.target.closest && e.target.closest('[data-i]'); if(!t) return;
      var i = +t.getAttribute('data-i'), x = xs[i], y = ys[i];
      if(k === 'ArrowRight') x += cur.x.step * big; else if(k === 'ArrowLeft') x -= cur.x.step * big;
      else if(k === 'ArrowUp') y += cur.y.step * big; else if(k === 'ArrowDown') y -= cur.y.step * big;
      else if(k === 'Delete' || k === 'Backspace'){ e.preventDefault(); sel = i; removeSel(); return; }
      else return;
      e.preventDefault(); before = R.fit(xs, ys); sel = i; act();
      xs[i] = snapX(x); ys[i] = snapY(y); settle(i);
    });
    svg.addEventListener('focusin', function(e){
      if(restoring) return;
      var t = e.target.closest && e.target.closest('[data-i]'); if(!t) return;
      var i = +t.getAttribute('data-i'); if(i === sel) return;
      sel = i; lastMsg = ''; draw();
    });
    function settle(i, added){
      var b = before || R.fit(xs, ys); before = null; lastMsg = '';
      F = R.fit(xs, ys);
      if(isFinite(F.b) && isFinite(b.b)){
        lastMsg = (added ? '<b>Added (' + esc(nf(xs[i]) + ', ' + nf(ys[i])) + ').</b> ' : '') + pointText(i).replace('<b>', added ? '' : '<b>').replace('</b>', added ? '' : '</b>') +
          ' ' + esc('Slope ' + fx(b.b, sig(b.b)) + ' → ' + fx(F.b, sig(F.b)) + ', r ' + fx(b.r, 2) + ' → ' + fx(F.r, 2) + '.');
      }
      draw(); say(plain(lastMsg));
      setTimeout(function(){ lastMsg = ''; }, 30);
    }
    function captionNow(){ var c = $('.rl-say .bt-say-h'); return c ? c.innerHTML : ''; }
    function plain(h){ var d = document.createElement('div'); d.innerHTML = h; return d.textContent; }

    var LSsetup = null;
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [fig], dock: [$('.rl-ctl')], setup: 'Data', moreLabel: 'Data set and points', why: [$('.rl-say')], details: [$('.rl-nums')] });
      LSsetup = function(t){ sp.setup(t); };
      sp.setup(cur.name);
      draw();
      if(s.mode() === 'explore'){ var pts = svg.querySelectorAll('.rl-pt'); s.hint({ target: pts[pts.length - 1] || svg, text: 'Drag a point' }); }
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 40); }).observe(fig); }
    }
    draw();
    if(!window.LevlStudio && window.ResizeObserver){ var t2 = null; new ResizeObserver(function(){ clearTimeout(t2); t2 = setTimeout(draw, 60); }).observe(fig); }
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    var o = { slug: 'regression-lab', noun: 'drill', types: R.TYPES, typeLabel: 'Kind of problem',
      // a table or the summary statistics are read from the text, so it sits on the stage
      generate: function(r, ctx, type){ var p = R.generate(r, ctx, type); o.textOnStage = p.type === 'residual' || p.type === 'lsrl' || p.type === 'predict'; return p; },
      title: function(p){ return ({ describe: 'Describe the scatterplot', correlation: 'Correlation', predict: 'Predict and interpret', residual: 'A residual', lsrl: 'The line from summary statistics' })[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.shown = {}; figure(el, p, api.shown); },
      onStep: function(s, right, api){ var f = api.problem.figure, k = f.reveal && f.reveal[s.key]; api.shown.yours = null; if(k) api.shown[k] = true; figure(api.fig, api.problem, api.shown); },
      // A wrong ŷ is drawn as a point above x, a wrong residual as a segment from the line.
      onTry: function(s, t, api){
        if(t.right || s.kind !== 'num' || !isFinite(t.value)) return;
        var f = api.problem.figure, d = s.d != null ? s.d : 2;
        if(s.key === 'yhat' && f.at != null) api.shown.yours = { kind: 'point', x: f.at, y: t.value, t: 'ŷ = ' + M.fixed(t.value, d) };
        else if(s.key === 'resid' && f.sel != null){ api.shown.seg = true; api.shown.yours = { kind: 'resid', e: t.value, t: 'residual ' + M.fixed(t.value, d) }; }
        else api.shown.yours = { kind: 'tag', t: M.fixed(t.value, d) };
        figure(api.fig, api.problem, api.shown);
      },
      method: function(s, p){
        var d = p.data || {};
        var H = { dir: 'As x increases, does y tend to increase (positive) or decrease (negative)?', form: 'Does a straight line follow the points, or do they bend?',
          str: 'How tightly do the points hug a line? Close is strong, loose is weak.', pickr: 'r has the sign of the slope, and its size grows as the points hug a line.',
          rmeans: 'r measures the direction and strength of a linear association only.', units: 'r has no units: changing units does not change it.',
          yhat: 'Put x into the line: ŷ = a + b·x. The dashed guide marks that x; your ŷ is the red circle.',
          who: 'The slope describes the predicted y, not individual values.', how: 'Use the sign and the size of the slope, per one unit of x.',
          extrap: 'Compare x with the smallest and largest x values in the data.',
          resid: 'Residual = actual − predicted: y − ŷ, with ŷ from the line at that x. Your residual is the red segment.',
          rsign: 'A positive residual means the point is above the line: the actual value is more than predicted.',
          plot: 'A good linear fit leaves residuals scattered with no curve or fan.', b: 'b = r · s_y / s_x, using the summary statistics.',
          a: 'a = ȳ − b·x̄, with the slope from step 1.', r2: 'r² is the share of the variation in y accounted for by the linear model.', s: 's is the typical size of a residual: the typical prediction error.' };
        return H[s.key] || null;
      }
    };
    T.drill(host, data, o);
  }
  var qid = 0;
  function figure(el, p, shown){
    var f = p.figure, xs = f.xs, ys = f.ys, F = R.fit(xs, ys);
    var L = f.line ? { a: f.line.a, b: f.line.b } : { a: F.a, b: F.b };
    var showLine = !!(f.line && p.type !== 'lsrl') || !!shown.line;
    function rng(v, pad, dp){ var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), sp = (mx - mn) || 1, st = P.ticks(mn, mx, 5), s1 = st.length > 1 ? st[1] - st[0] : sp / 5; return { lo: Math.floor((mn - sp * pad) / s1) * s1, hi: Math.ceil((mx + sp * pad) / s1) * s1 }; }
    var xr = rng(xs, 0.08), yv = ys.slice(); if(showLine) yv.push(L.a + L.b * xr.lo, L.a + L.b * xr.hi);
    var yr = rng(yv, 0.08);
    if(Math.min.apply(null, ys) >= 0 && yr.lo < 0) yr.lo = 0;
    var o = { xs: xs, ys: ys, x: { lo: xr.lo, hi: xr.hi, name: f.x.name, unit: f.x.unit }, y: { lo: yr.lo, hi: yr.hi, name: f.y.name, unit: f.y.unit },
      fit: F, line: showLine ? L : null, show: {}, residPanel: !!f.residPlot && !!shown.resid, sel: f.sel != null ? f.sel : -1, segOnly: shown.seg && f.sel != null ? f.sel : null,
      at: shown.at ? f.at : null, far: shown.far ? f.far : null, clip: 'rlq' + (++qid), dataRange: false, guide: f.at, yours: shown.yours || null };
    if(!showLine) o.fit = null;
    function render(){
      var box = el.querySelector('.rl-qfig') || el, rc = box.getBoundingClientRect();
      var W = Math.round(rc.width) || 520, H = Math.round(rc.height);
      if(!(H >= 200)) H = phone() ? 320 : 380;
      W = Math.max(280, Math.min(1200, W)); H = Math.min(H, 760);
      var g = inner(o, W, H);
      el.innerHTML = '<figure class="rl-qfig"><svg class="rl-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Scatterplot of ' + f.y.name + ' against ' + f.x.name + ', ' + xs.length + ' points' + (o.line ? ', with the line ' + eqText(L.a, L.b, sig(L.a), sig(L.b)) : '') + (o.residPanel ? ', and its residual plot' : '') + '.') + '">' + g.html + '</svg></figure>';
    }
    render();
    if(window.ResizeObserver && !el.__rlRO){ var t = null; el.__rlRO = new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ if(el.__rlDraw) el.__rlDraw(); }, 60); }); el.__rlRO.observe(el); }
    el.__rlDraw = render;
  }
})();
