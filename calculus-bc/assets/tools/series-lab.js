/* Series lab: the page script (docs/apcalcbc-architecture.md, "Trainers"; spec section 6, the
   flagship). OWNED BY THIS TOOL ONLY (builder T1). Runs on calculus-bc/tools/series-lab.html on
   top of AB's framework (ApCalcTools, calculus/assets/tools/calc-tools.js), plots (ApCalcPlot),
   math text (ApCalcTex) and BC's interval grader (ApCalcBCInterval), with its own model
   ApCalcMath.seriesLab (calculus-bc/assets/tools/math/series-lab.js).

   Explore, two views (the switch in the dock):
     Number series  the partial sums S_n (dots) and the terms a_n (bars) of a gallery series
                    as terms are added, the sum dashed when there is one, the alternating
                    series bound drawn as a bracket at S_N. Past N = 40 the slider (and the
                    "×10 terms" button) jumps by powers of ten up to 10⁶ and the chart turns
                    into S_N against N on a log axis, with ln N + γ (harmonic) or ln(ln n) + C
                    (1/(n ln n)) dashed as a guide, so a slow divergence is seen to keep
                    climbing (equal steps per ×10) and a convergent series stays under its
                    sum. Why: what the series does and the
                    board of the six tests (settles it / no conclusion / does not apply, each
                    with its reason); Details: the table of n, a_n, S_n.
     Power series   a number line with the interval of convergence (endpoints open or
                    closed), a draggable x, the ratio test limit at x and the partial sums
                    S_N(x) against the function the series sums to.
   Test yourself: ApCalcTools.drill with five kinds (partial, sum, test, absolute, interval).
   The interval step is a custom step graded in four parts by ApCalcBCInterval; each try is
   drawn on the number line, yours dashed. After the conclusion of a test problem the partial
   sums are drawn, so the picture is checked against the test (and seen to mislead, for
   1/(n ln n)). */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot;
  if(!T || !M || !M.seriesLab || !P) return;
  var S = M.seriesLab, esc = T.esc, IV = window.ApCalcBCInterval;
  function tex(s, o){ return window.ApCalcTex ? window.ApCalcTex.render(s, o || {}) : esc(s); }
  function html(s){ return window.ApCalcTex ? window.ApCalcTex.html(s) : esc(s); }
  function plainTex(s){ return window.ApCalcTex ? window.ApCalcTex.text(s) : s; }
  function r2(v){ return Math.round(v * 100) / 100; }
  function d3(v){ return isFinite(v) ? T.F(v, 3) : '—'; }
  function sig(v){ if(!isFinite(v)) return '—'; var a = Math.abs(v); return a !== 0 && (a < 0.001 || a >= 1e5) ? v.toExponential(2).replace('-', '−') : T.F(v, a < 1 ? 4 : 3); }
  function phone(el){ var r = el && el.closest && el.closest('.ls-root'); return !!(r && r.classList.contains('ls-phone')) || window.innerWidth <= 640; }
  var STATUS = { works: ['Settles it', 'is-works'], inc: ['No conclusion', 'is-inc'], na: ['Does not apply', 'is-na'] };
  var ORDER = ['nth', 'integral', 'direct', 'limit', 'alt', 'ratio'];

  T.mount('series-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'series-lab', explore: function(h){ ex = explore(h, data); }, quiz: function(h){ quiz(h, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* A partial-sums chart: terms as bars, S_n as dots on a line, a sum line, a bracket.
     o: { a(n), n0, N, sum, sumLabel, bound: { at, half }, w, h, label, mine } */
  function sumsSvg(o){
    var n0 = o.n0, N = o.N, a = [], s = [], acc = 0;
    for(var k = 0; k < N; k++){ var v = o.a(n0 + k); a.push(v); acc += v; s.push(acc); }
    var vals = a.concat(s).concat(o.sum != null && isFinite(o.sum) ? [o.sum] : []).concat(o.mine != null && isFinite(o.mine) ? [o.mine] : []).filter(isFinite);
    var lo = Math.min(0, Math.min.apply(null, vals)), hi = Math.max(0, Math.max.apply(null, vals));
    var cap = o.cap || Infinity;
    if(hi > cap) hi = cap; if(lo < -cap) lo = -cap;
    var pad = (hi - lo) * 0.12 || 1; hi += pad; if(lo < 0) lo -= pad;
    var xs = [n0 - 0.7, n0 + N - 0.3];
    var spec = { label: o.label, width: o.w, height: o.h, x: xs, y: [lo, hi], xLabel: 'n', yLabel: '', xStep: N > 24 ? 5 : N > 10 ? 2 : 1 };
    var F = P.frame(spec), base = P.svg(spec), out = [], bw = Math.max(2, Math.min(16, (F.sx(n0 + 1) - F.sx(n0)) * 0.42));
    var clampY = function(y){ return Math.max(lo, Math.min(hi, y)); };
    a.forEach(function(v, i){ var x = F.sx(n0 + i), y0 = F.sy(0), y1 = F.sy(clampY(v)); out.push('<rect class="sl-bar' + (i === N - 1 ? ' is-cur' : '') + '" x="' + r2(x - bw / 2) + '" y="' + r2(Math.min(y0, y1)) + '" width="' + r2(bw) + '" height="' + r2(Math.max(0.6, Math.abs(y1 - y0))) + '"/>'); });
    if(o.sum != null && isFinite(o.sum)){
      var ys = F.sy(o.sum);
      out.push('<line class="sl-sum" x1="' + F.pad.l + '" x2="' + (F.w - F.pad.r) + '" y1="' + r2(ys) + '" y2="' + r2(ys) + '"/>');
      if(o.sumLabel) out.push('<text class="sl-sumlab" x="' + (F.w - F.pad.r - 4) + '" y="' + r2(ys - 7) + '" text-anchor="end">' + esc(o.sumLabel) + '</text>');
    }
    if(o.mine != null && isFinite(o.mine)){ var ym = F.sy(clampY(o.mine)); out.push('<line class="sl-mine" x1="' + F.pad.l + '" x2="' + (F.w - F.pad.r) + '" y1="' + r2(ym) + '" y2="' + r2(ym) + '"/><text class="sl-minelab" x="' + (F.pad.l + 6) + '" y="' + r2(ym - 6) + '">yours: ' + esc(sig(o.mine)) + '</text>'); }
    if(o.bound){
      var bx = F.sx(n0 + N - 1) + bw + 6, b1 = F.sy(clampY(s[N - 1] - o.bound)), b2 = F.sy(clampY(s[N - 1] + o.bound));
      out.push('<path class="sl-bound" d="M' + r2(bx - 4) + ' ' + r2(b1) + 'H' + r2(bx) + 'V' + r2(b2) + 'H' + r2(bx - 4) + '"/>');
    }
    var pts = s.map(function(v, i){ return [F.sx(n0 + i), F.sy(clampY(v))]; });
    out.push('<path class="sl-path" d="' + pts.map(function(p, i){ return (i ? 'L' : 'M') + r2(p[0]) + ' ' + r2(p[1]); }).join('') + '"/>');
    pts.forEach(function(p, i){ var off = s[i] > hi || s[i] < lo; out.push('<circle class="sl-dot' + (i === N - 1 ? ' is-cur' : '') + (off ? ' is-off' : '') + '" cx="' + r2(p[0]) + '" cy="' + r2(p[1]) + '" r="' + (i === N - 1 ? 5.5 : N > 30 ? 2.8 : 3.6) + '"/>'); });
    if(o.curLabel !== false){
      // above the dot, or below it when the sum line (or the top) is in the way
      var cp = pts[N - 1], right = cp[0] > F.w * 0.62, ly = cp[1] - 10;
      var ysum = o.sum != null && isFinite(o.sum) ? F.sy(o.sum) : null;
      if(ly < F.pad.t + 12 || (ysum != null && Math.abs(ly - 4 - ysum) < 16) || (ysum != null && ysum < cp[1] && cp[1] - ysum < 26)) ly = cp[1] + 20;
      ly = Math.min(F.h - F.pad.b - 4, ly);
      // pushed back up by the x-axis onto the sum's own label (a sum of 0 at the center of a power series): sit on the line above it
      if(ysum != null && o.sumLabel && right && Math.abs(ly - (ysum - 7)) < 15) ly = ysum - 7 - 17;
      out.push('<text class="sl-curlab" x="' + r2(right ? cp[0] - 10 : cp[0] + 10) + '" y="' + r2(ly) + '" text-anchor="' + (right ? 'end' : 'start') + '">S' + sub(n0 + N - 1) + ' = ' + esc(sig(s[N - 1])) + '</text>');
    }
    return { svg: base.replace('</svg>', out.join('') + '</svg>'), F: F, sums: s, terms: a };
  }
  var SUBD = '₀₁₂₃₄₅₆₇₈₉';
  function sub(n){ return String(n).split('').map(function(c){ return SUBD[+c] || c; }).join(''); }

  /* Many terms. The slider runs 1 to 40 one term at a time, then 10², 10³, ... 10⁶ (index 41 to 45). */
  var NMAX_LIN = 40, NIDX_MAX = 45;
  function idxToN(i){ return i <= NMAX_LIN ? i : Math.pow(10, i - NMAX_LIN + 1); }
  function nToIdx(n){ return n <= NMAX_LIN ? n : NMAX_LIN - 1 + Math.round(Math.log(n) / Math.LN10); }
  var SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function pow10(n){ var e = Math.round(Math.log(n) / Math.LN10); return n >= 1e4 && Math.pow(10, e) === n ? e : -1; }
  function fmtN(n){ var e = pow10(n); return e > 0 ? '10' + String(e).split('').map(function(c){ return SUPD[+c]; }).join('') : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function nTex(n){ var e = pow10(n); return e > 0 ? '10^{' + e + '}' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}'); }
  /* Partial sums of a gallery series out to 10⁶ terms, kept only at the term counts the log chart
     draws: every count up to 200, then about 60 per power of ten (each with the count after it, so
     an alternating series shows both its odd and its even partial sums), and each power of ten.
     Worked out once per series (a million additions, a few milliseconds). A term that is not a
     finite number (3ⁿ/n! past n = 170: Infinity/Infinity) is counted as 0; every gallery series
     with such terms converges and its terms are below 1e-300 there. */
  var bigCache = {};
  function bigSums(g){
    if(bigCache[g.id]) return bigCache[g.id];
    var want = {}, k;
    for(k = 1; k <= 200; k++) want[k] = 1;
    for(var u = Math.log(200) / Math.LN10; u <= 6 + 1e-9; u += 1 / 60){ k = Math.round(Math.pow(10, u)); want[k] = 1; want[k + 1] = 1; }
    for(var e = 0; e <= 6; e++) want[Math.pow(10, e)] = 1;
    var ks = Object.keys(want).map(Number).filter(function(v){ return v <= 1e6; }).sort(function(a, b){ return a - b; }), S = [], acc = 0, j = 0;
    // A ratio-test series (geometric or factorial) is spent long before 10⁶: once its terms are below
    // 1e-20 the rest cannot change a double, so they are not worked out (n! is a loop, and 10⁶ of
    // them would hang the page).
    var spent = false;
    for(k = 1; k <= 1e6 && j < ks.length; k++){
      if(!spent){ var v = g.a(g.n0 + k - 1); acc += isFinite(v) ? v : 0; if(g.best === 'ratio' && k > 40 && !(Math.abs(v) >= 1e-20)) spent = true; }
      if(k === ks[j]){ S.push(acc); j++; }
    }
    return (bigCache[g.id] = { ks: ks, S: S });
  }
  function bigTxt(v){ return Math.abs(v) >= 1e4 ? Math.round(v).toLocaleString('en-US') : sig(v); }
  var EULER_GAMMA = 0.5772156649015329;
  /* The guide drawn under a divergent series' partial sums, as a function of the term count k. */
  function guideOf(g){
    if(g.id === 'harm') return { f: function(k){ return Math.log(k) + EULER_GAMMA; }, label: 'ln N + 0.577', from: 1 };
    if(g.id === 'nlogn'){
      var B = bigSums(g), C = B.S[B.S.length - 1] - Math.log(Math.log(g.n0 + 1e6 - 1));   // the constant, fitted at 10⁶ terms
      return { f: function(k){ var n = g.n0 + k - 1; return Math.log(Math.log(n)) + C; }, label: 'ln(ln n) + ' + T.F(C, 2), from: 2 };
    }
    return null;
  }
  /* S_N against N on a log axis, N from 1 to 10² ... 10⁶. Dots at each power of ten with their values,
     the sum dashed (convergent) or the guide dashed (divergent). o: { g, N, w, h, label } */
  function logSvg(o){
    var g = o.g, N = o.N, B = bigSums(g), ks = [], Ss = [];
    for(var i = 0; i < B.ks.length && B.ks[i] <= N; i++){ ks.push(B.ks[i]); Ss.push(B.S[i]); }
    var U = Math.log(N) / Math.LN10, gd = g.verdict === 'div' ? guideOf(g) : null;
    var vals = Ss.slice(); if(g.sum != null) vals.push(g.sum); if(gd) vals.push(gd.f(N));
    var lo = Math.min(0, Math.min.apply(null, vals)), hi = Math.max(0, Math.max.apply(null, vals));
    hi += (hi - lo) * 0.16 || 1; if(lo < 0) lo -= (hi - lo) * 0.08;
    var w = o.w, h = o.h, ph = w < 420, F = P.frame({ width: w, height: h, x: [-0.12 * U / 3, U * (1 + (ph ? 0.1 : 0.06))], y: [lo, hi] });
    var L = F.pad.l, R = F.w - F.pad.r, Tp = F.pad.t, Bt = F.h - F.pad.b, out = [], txt = [];
    var lx = function(k){ return F.sx(Math.log(k) / Math.LN10); };
    var yt = P.ticks(lo, hi, 6);
    out.push('<g class="calc-plot-grid">' + [0, 1, 2, 3, 4, 5, 6].filter(function(e){ return e <= U + 1e-9; }).map(function(e){ return '<line x1="' + r2(F.sx(e)) + '" y1="' + Tp + '" x2="' + r2(F.sx(e)) + '" y2="' + Bt + '"/>'; }).join('') +
      yt.map(function(v){ return '<line x1="' + L + '" y1="' + r2(F.sy(v)) + '" x2="' + R + '" y2="' + r2(F.sy(v)) + '"/>'; }).join('') + '</g>');
    var ax = lo <= 0 && hi >= 0 ? F.sy(0) : Bt, ay = F.sx(0);
    out.push('<g class="calc-plot-axis"><line x1="' + L + '" y1="' + r2(ax) + '" x2="' + R + '" y2="' + r2(ax) + '"/><line x1="' + r2(ay) + '" y1="' + Tp + '" x2="' + r2(ay) + '" y2="' + Bt + '"/></g>');
    [0, 1, 2, 3, 4, 5, 6].forEach(function(e){ if(e > U + 1e-9) return; txt.push('<text x="' + r2(F.sx(e)) + '" y="' + r2(Math.min(F.h - 4, ax + 15)) + '" text-anchor="middle">' + esc(fmtN(Math.pow(10, e))) + '</text>'); });
    yt.forEach(function(v){ if(Math.abs(v) < 1e-12) return; txt.push('<text x="' + r2(ay - 6) + '" y="' + r2(F.sy(v) + 4) + '" text-anchor="end">' + esc(Math.abs(v) >= 1e4 ? bigTxt(v) : String(+v.toPrecision(6)).replace('-', '−')) + '</text>'); });
    var axl = '<text class="calc-plot-axlabel" x="' + (R - 2) + '" y="' + r2(Math.max(Tp + 10, ax - 6)) + '" text-anchor="end">N, log scale</text>';
    if(g.sum != null && isFinite(g.sum)){
      var ys = F.sy(g.sum);
      out.push('<line class="sl-sum" x1="' + L + '" x2="' + R + '" y1="' + r2(ys) + '" y2="' + r2(ys) + '"/><text class="sl-sumlab" x="' + (R - 4) + '" y="' + r2(ys - 7) + '" text-anchor="end">' + esc(o.sumLabel || '') + '</text>');
    }
    if(gd){
      var gp = [];
      for(var q = 0; q <= 160; q++){ var kk = Math.pow(10, U * q / 160); if(kk < gd.from) continue; var gy = gd.f(kk); if(isFinite(gy) && gy >= lo && gy <= hi) gp.push(r2(lx(kk)) + ' ' + r2(F.sy(gy))); }
      out.push('<path class="sl-guide" d="M' + gp.join('L') + '"/>');
      out.push('<text class="sl-guidelab" x="' + r2(lx(Math.pow(10, U * 0.62))) + '" y="' + r2(F.sy(gd.f(Math.pow(10, U * 0.62))) + 17) + '" text-anchor="start">' + esc(gd.label) + '</text>');
    }
    // the partial sums: one line, or the odd and the even partial sums apart for an alternating series
    var alt = g.verdict === 'cond', runs = alt ? [[], []] : [[]];
    ks.forEach(function(k, j){ runs[alt ? k % 2 : 0].push(r2(lx(k)) + ' ' + r2(F.sy(Ss[j]))); });
    runs.forEach(function(r){ if(r.length > 1) out.push('<path class="sl-path is-log" d="M' + r.join('L') + '"/>'); });
    var marks = [];
    for(var e2 = 0; e2 <= 6; e2++){ var k2 = Math.pow(10, e2); if(k2 > N) break; var j2 = ks.indexOf(k2); if(j2 >= 0) marks.push([k2, Ss[j2]]); }
    var last = marks[marks.length - 1], cy = F.sy(last[1]), sumY = g.sum != null ? F.sy(g.sum) : null, ly = cy - 12;
    if(ly < Tp + 12 || (sumY != null && Math.abs(ly - 4 - sumY) < 16)) ly = cy + 22;
    var prevTxt = '';
    marks.forEach(function(m, mi){
      var cur = m[0] === N, X = lx(m[0]), Y = F.sy(m[1]), t = bigTxt(m[1]);
      out.push('<circle class="sl-dot' + (cur ? ' is-cur' : '') + '" cx="' + r2(X) + '" cy="' + r2(Y) + '" r="' + (cur ? 5.5 : 4) + '"/>');
      if(cur) return;
      // each power of ten carries its value (the step from one to the next is the point); a value the
      // same as the one before is left out (a convergent series sitting on its sum), and so is one in
      // the way of the label at N
      if(t === prevTxt || (mi === marks.length - 2 && Math.abs(Y - 9 - ly) < 18)) return;
      prevTxt = t;
      txt.push('<text class="sl-p10" x="' + r2(mi === 0 ? X + 6 : X) + '" y="' + r2(Y - 9) + '" text-anchor="' + (mi === 0 ? 'start' : 'middle') + '">' + esc(t) + '</text>');
    });
    out.push('<text class="sl-curlab" x="' + r2(lx(N) - 10) + '" y="' + r2(ly) + '" text-anchor="end">S at N = ' + esc(fmtN(N)) + ': ' + esc(bigTxt(last[1])) + '</text>');
    return { svg: '<svg class="calc-plot sl-log" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(o.label) + '">' + out.join('') + '<g class="calc-plot-ticks">' + txt.join('') + '</g>' + axl + '</svg>', marks: marks };
  }

  /* A number line with an interval. o: { view, center, R, loIn, hiIn, x, w, mine: {lo, hi, loIn, hiIn}, unknownEnds } */
  function lineSvg(o){
    var w = o.w, h = o.h || 74, L = 18, Rt = w - 18, v = o.view, sx = function(x){ return L + (x - v[0]) / (v[1] - v[0]) * (Rt - L); }, y = Math.max(34, Math.round(h * 0.5)), out = [];
    out.push('<line class="sl-nl" x1="' + L + '" x2="' + Rt + '" y1="' + y + '" y2="' + y + '"/>');
    var span = v[1] - v[0], st = span > 12 ? 2 : span > 5 ? 1 : 0.5;
    for(var t = Math.ceil(v[0] / st) * st; t <= v[1] + 1e-9; t += st){ var X = sx(t); out.push('<line class="sl-nlt" x1="' + r2(X) + '" x2="' + r2(X) + '" y1="' + (y - 5) + '" y2="' + (y + 5) + '"/><text class="sl-nltl" x="' + r2(X) + '" y="' + (y + 20) + '" text-anchor="middle">' + esc(String(+t.toFixed(2)).replace('-', '−')) + '</text>'); }
    function band(I, cls, yy, unk){
      if(!I) return;
      if(I.point){ out.push('<circle class="sl-end is-in ' + cls + '" cx="' + r2(sx(I.lo)) + '" cy="' + yy + '" r="6"/>'); return; }
      var a = isFinite(I.lo) ? sx(Math.max(v[0], I.lo)) : L, b = isFinite(I.hi) ? sx(Math.min(v[1], I.hi)) : Rt;
      out.push('<line class="sl-band ' + cls + '" x1="' + r2(a) + '" x2="' + r2(b) + '" y1="' + yy + '" y2="' + yy + '"/>');
      [['lo', I.lo, I.loIn], ['hi', I.hi, I.hiIn]].forEach(function(e){
        if(!isFinite(e[1])){ out.push('<path class="sl-arrow ' + cls + '" d="' + (e[0] === 'lo' ? 'M' + (L + 8) + ' ' + (yy - 6) + 'L' + L + ' ' + yy + 'L' + (L + 8) + ' ' + (yy + 6) : 'M' + (Rt - 8) + ' ' + (yy - 6) + 'L' + Rt + ' ' + yy + 'L' + (Rt - 8) + ' ' + (yy + 6)) + '"/>'); return; }
        if(e[1] < v[0] || e[1] > v[1]) return;
        if(unk) out.push('<circle class="sl-end is-unk ' + cls + '" cx="' + r2(sx(e[1])) + '" cy="' + yy + '" r="6"/><text class="sl-unk" x="' + r2(sx(e[1])) + '" y="' + (yy - 11) + '" text-anchor="middle">?</text>');
        else out.push('<circle class="sl-end ' + (e[2] ? 'is-in ' : 'is-out ') + cls + '" cx="' + r2(sx(e[1])) + '" cy="' + yy + '" r="6"/>');
      });
    }
    band(o.I, 'is-key', y, o.unknownEnds);
    band(o.mine, 'is-mine', y - 16, false);
    if(o.center != null){ var cx = sx(o.center); out.push('<line class="sl-ctr" x1="' + r2(cx) + '" x2="' + r2(cx) + '" y1="' + (y - 9) + '" y2="' + (y + 9) + '"/>'); }
    if(o.x != null){ var xx = sx(o.x); out.push('<g class="sl-xmark" transform="translate(' + r2(xx) + ' ' + y + ')"><path d="M0 -4L-7 -16H7Z"/></g>'); }
    return { svg: '<svg class="calc-plot sl-line" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(o.label || 'Number line with the interval of convergence') + '">' + out.join('') + '</svg>', sx: sx, ix: function(px){ return v[0] + (px - L) / (Rt - L) * (v[1] - v[0]); } };
  }
  /* The six-test board for a gallery series. */
  function boardHtml(g){
    return '<div class="sl-board" role="list">' + ORDER.map(function(k){
      var b = g.board[k], st = STATUS[b[0]], best = k === g.best;
      return '<div class="sl-test ' + st[1] + (best ? ' is-best' : '') + '" role="listitem"><p class="sl-test-h"><span class="sl-test-n">' + esc(S.TESTS[k].short) + '</span><span class="sl-stat">' + (best ? 'Use this' : st[0]) + '</span></p><p class="sl-test-w">' + html(b[1]) + '</p></div>';
    }).join('') + '</div>';
  }

  /* =========================================================== explore */
  function explore(host, data){
    var view = 'num', g = S.galleryById('p2'), N = 12, Pw = S.powerById('p1'), x = 4, LS = null, touched = false, nid = T.nid('sl');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem sl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Series explorer</h2>' +
      '<div class="sl-fig"><p class="sl-eq"></p><div class="sl-nlbox"></div><div class="sl-plot"></div></div>' +
      '<div class="sl-ctl"><div class="sl-views" role="group" aria-label="What to explore"><button type="button" class="tchip sl-view" data-v="num" aria-pressed="true">Number series</button><button type="button" class="tchip sl-view" data-v="pow" aria-pressed="false">Power series</button></div>' +
      '<div class="sl-chips ls-scroll" role="group" aria-label="Series"></div><div class="sl-slot"></div></div>' +
      '<div class="sl-say"></div><div class="sl-boardbox"></div>' +
      T.moreHtml('<div class="sl-more-b"></div><p class="bt-small">Keyboard: every chip and slider is reachable with Tab; arrow keys move a slider (the minus and plus buttons step it). In Power series, the marker on the number line follows the x slider.</p>', 'more terms, the term values') +
      '<div class="sl-nums"></div><p class="sr-only sl-live"></p></section>';
    var say = T.announcer($('.sl-live'));
    var cue = T.cue('Add terms with the slider and watch the partial sums settle, or not. Past 40 it jumps by ×10, up to a million terms. Then open Why for the test that decides it.');
    $('.sl-ctl').insertBefore(cue.el, $('.sl-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var nSl = T.slider({ label: 'Terms added, N', min: 1, max: NIDX_MAX, step: 1, value: N, decimals: 0, onInput: function(v){ act(); N = idxToN(v); nOut(); draw(); sayNum(); } });
    // the slider's value is a position: 1 to 40 are N itself, then 10², 10³, ... 10⁶
    function nOut(){ var o = nSl.el.querySelector('output'), t = fmtN(N); if(o) o.textContent = t; nSl.input.setAttribute('aria-valuetext', String(N) + (N > NMAX_LIN ? ' terms' : '')); if(x10) x10.disabled = N >= 1e6; }
    var x10 = document.createElement('button'); x10.type = 'button'; x10.className = 'bt-btn sl-x10'; x10.textContent = '×10 terms';
    x10.setAttribute('aria-label', 'Ten times as many terms');
    x10.addEventListener('click', function(){ act(); var n2 = Math.min(1e6, N < 10 ? 10 : N <= NMAX_LIN ? 100 : N * 10); N = n2; nSl.set(nToIdx(n2)); nOut(); draw(); sayNum(); });
    var xSl = T.slider({ label: 'x', min: -1, max: 7, step: 0.05, value: x, decimals: 2, onInput: function(v){ act(); x = v; draw(); sayPow(); } });
    xSl.el.classList.add('sl-xsl'); $('.sl-slot').setAttribute('data-ls-primary', '');
    $('.sl-slot').appendChild(nSl.el); $('.sl-slot').appendChild(x10); $('.sl-slot').appendChild(xSl.el); nOut();
    var mN = 30, mSl = T.slider({ label: 'Partial sums drawn (power series)', min: 5, max: 60, step: 1, value: mN, decimals: 0, onInput: function(v){ mN = v; draw(); } });
    $('.sl-more-b').appendChild(mSl.el);
    host.querySelectorAll('.sl-view').forEach(function(b){ b.addEventListener('click', function(){ act(); setView(b.getAttribute('data-v')); }); });
    function chips(){
      var list = view === 'num' ? S.GALLERY : S.POWER, cur = view === 'num' ? g.id : Pw.id, box = $('.sl-chips');
      box.innerHTML = list.map(function(it){ return '<button type="button" class="tchip sl-chip" data-id="' + it.id + '" aria-pressed="' + (it.id === cur) + '" aria-label="' + esc(plainTex(it.tex)) + '">' + esc(it.chip) + '</button>'; }).join('');
      box.querySelectorAll('.sl-chip').forEach(function(b){ b.addEventListener('click', function(){ act(); pick(b.getAttribute('data-id')); }); });
    }
    function setView(v){
      view = v;
      [host, LS && LS.root].forEach(function(r){ if(r) r.querySelectorAll('.sl-view').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); }); });
      nSl.el.hidden = v !== 'num'; x10.hidden = v !== 'num'; xSl.el.hidden = v !== 'pow';
      var fig = $('.sl-fig'); if(fig) fig.classList.toggle('is-pow', v === 'pow');
      chips(); setX(); draw(); if(LS && LS.fit) LS.fit();
    }
    function setX(){
      if(view !== 'pow') return;
      var v = Pw.view, st = (v[1] - v[0]) > 4 ? 0.05 : 0.01;
      xSl.input.min = String(v[0]); xSl.input.max = String(v[1]); xSl.input.step = String(st);
      if(x < v[0] || x > v[1]) x = Pw.R === Infinity || Pw.R === 0 ? Pw.center + Math.min(1, (v[1] - Pw.center) / 2) : Pw.center + Pw.R * 0.5;
      xSl.set(x);
    }
    function pick(id){
      if(view === 'num'){ g = S.galleryById(id); } else { Pw = S.powerById(id); x = Pw.R === Infinity || Pw.R === 0 ? Pw.center + Math.min(1, (Pw.view[1] - Pw.center) / 2) : Pw.center + Pw.R * 0.5; setX(); }
      [host, LS && LS.root].forEach(function(r){ if(r) r.querySelectorAll('.sl-chip').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-id') === id)); }); });
      draw(); view === 'num' ? sayNum() : sayPow();
    }
    function dims(box){
      var w = Math.max(280, Math.round(box.clientWidth || 560)), h = LS && box.clientHeight > 120 ? Math.round(box.clientHeight) : Math.round(Math.min(w * 0.62, 420));
      return [w, Math.max(170, h)];
    }
    function draw(){ if(view === 'num') drawNum(); else drawPow(); }
    function sumText(gg){ return gg.sum == null ? '' : 'S = ' + plainTex(gg.sumTex) + (gg.sumTex.length > 1 ? ' ≈ ' + d3(gg.sum) : ''); }
    function drawNum(){
      var box = $('.sl-plot'), d = dims(box), nl = $('.sl-nlbox'); nl.innerHTML = '';
      $('.sl-eq').innerHTML = tex(g.tex);
      var aN1 = g.a(g.n0 + N), bound = g.verdict === 'cond' ? Math.abs(aN1) : null, many = N > NMAX_LIN, C, SN;
      if(many){
        C = logSvg({ g: g, N: N, w: d[0], h: d[1], sumLabel: sumText(g), label: 'Partial sums of ' + plainTex(g.tex) + ' against the number of terms N on a log scale, N from 1 to ' + fmtN(N) });
        SN = C.marks[C.marks.length - 1][1];
      } else {
        C = sumsSvg({ a: g.a, n0: g.n0, N: N, sum: g.sum, sumLabel: sumText(g), bound: bound, w: d[0], h: d[1], label: 'Partial sums and terms of ' + plainTex(g.tex) + ' for the first ' + N + ' terms' });
        SN = C.sums[N - 1];
      }
      box.innerHTML = C.svg;
      var err = g.sum != null ? Math.abs(g.sum - SN) : NaN, last = g.n0 + N - 1;
      var vtxt = { abs: 'converges', cond: 'converges (conditionally)', div: 'diverges' }[g.verdict];
      var head = '<b>' + tex('S_{' + nTex(last) + '} = ' + T.F(SN, 4).replace('−', '-')) + '.</b> ' + (g.verdict === 'div' ? 'The series diverges: ' + (g.best === 'nth' ? 'each term adds almost 1.' : 'the partial sums grow without bound, slowly.') : 'The series ' + vtxt + (g.sum != null ? ' to ' + tex(g.sumTex) + (g.sumTex.length > 1 ? ' ≈ ' + d3(g.sum) : '') : '') + '; ' + (isFinite(err) ? 'still ' + sig(err) + ' away.' : ''));
      if(many) head += ' ' + (g.id === 'harm' ? 'Each ×10 in N adds about ln 10 ≈ 2.3, forever.' :
        g.id === 'nlogn' ? 'Each ×10 in N adds less than the one before (the sums follow ln(ln n)), but the climb never stops.' :
        g.verdict === 'div' ? 'S_N is close to N itself.' :
        g.verdict === 'cond' ? 'The odd and even partial sums close in on the sum from both sides.' : 'However many terms, the dots stay at or under the sum.');
      var why = '<p>' + html(g.known) + '</p>' +
        '<p>' + html('The dots are the partial sums $S_n$, the sum of the terms up to $n$; the bars are the terms $a_n$ themselves. A series converges when its partial sums approach a finite number; the terms approaching 0 is needed, but never enough.') + '</p>' +
        (bound != null ? '<p>' + html('The orange bracket is the alternating series error bound: $|S - S_{' + last + '}| \\le |a_{' + (last + 1) + '}| = ' + sig(Math.abs(aN1)).replace('−', '-') + '$. The sum line always passes through it.') + '</p>' : '') +
        '<p class="sl-board-h"><b>Which test decides it?</b> The natural choice is ' + esc(S.TESTS[g.best].name.replace(/^The /, 'the ')) + '.</p>';
      T.explain($('.sl-say'), head, why);
      $('.sl-boardbox').innerHTML = boardHtml(g);
      var nm = $('.sl-nums');
      if(nm){
        var rows = '';
        if(many){ var Bg = bigSums(g); Bg.ks.forEach(function(kk, j){ if(kk > N || !(kk <= 10 || [100, 1e3, 1e4, 1e5, 1e6].indexOf(kk) >= 0)) return; rows += '<tr><td>' + esc(fmtN(g.n0 + kk - 1)) + '</td><td class="r">' + sig(g.a(g.n0 + kk - 1)) + '</td><td class="r">' + T.F(Bg.S[j], 5) + '</td></tr>'; }); }
        else for(var k = 0; k < N; k++) rows += '<tr><td>' + (g.n0 + k) + '</td><td class="r">' + sig(C.terms[k]) + '</td><td class="r">' + T.F(C.sums[k], 5) + '</td></tr>';
        nm.innerHTML = '<h3 class="ls-title-l">The numbers</h3><table class="ls-tbl sl-tbl"><caption class="sr-only">Terms and partial sums</caption><thead><tr><th scope="col">n</th><th scope="col" class="r">a<sub>n</sub></th><th scope="col" class="r">S<sub>n</sub></th></tr></thead><tbody>' + rows + '</tbody></table>' +
          (g.sum != null ? '<p class="bt-small">' + html('Sum $S = ' + g.sumTex + (g.sumTex.length > 1 ? ' \\approx ' + T.F(g.sum, 6).replace('−', '-') : '') + '$; $|S - S_{' + nTex(last) + '}| = ' + sig(err).replace('−', '-') + '$.') + '</p>' : '');
      }
      if(LS){
        LS.caption(T.sayHead($('.sl-say')), 'explore');
        LS.pills([{ k: many ? 'S, N = ' + fmtN(N) : 'S' + sub(last), html: T.F(SN, 3), tone: 'readout' }], 'left', 'explore');
        LS.pills([{ html: g.verdict === 'div' ? 'Diverges' : g.verdict === 'cond' ? 'Converges conditionally' : 'Converges', tone: g.verdict === 'div' ? 'warn' : 'good' }], 'right', 'explore');
      }
    }
    function drawPow(){
      var box = $('.sl-plot'), d = dims(box), nl = $('.sl-nlbox'), at = S.powerAt(Pw, x, mN), Rr = Pw.R;
      $('.sl-eq').innerHTML = tex(Pw.tex);
      var I = Rr === Infinity ? { lo: -Infinity, hi: Infinity } : Rr === 0 ? { point: true, lo: Pw.center, hi: Pw.center } : { lo: Pw.center - Rr, hi: Pw.center + Rr, loIn: Pw.loIn, hiIn: Pw.hiIn };
      var Lsv = lineSvg({ view: Pw.view, center: Pw.center, I: I, x: x, w: d[0], label: 'Number line: the interval of convergence and x = ' + T.F(x, 2) });
      nl.innerHTML = Lsv.svg;
      var line = nl.querySelector('svg');
      line.addEventListener('pointerdown', function(e){ var pt = line.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var mtx = line.getScreenCTM(); var q = mtx ? pt.matrixTransform(mtx.inverse()) : pt; act(); x = Math.max(Pw.view[0], Math.min(Pw.view[1], Math.round(Lsv.ix(q.x) * 20) / 20)); xSl.set(x); draw(); sayPow(); });
      var fx = Pw.f ? Pw.f(x) : NaN, conv = at.where === 'in' || at.where === 'center' || (at.where === 'lo' && Pw.loIn) || (at.where === 'hi' && Pw.hiIn);
      var lim = conv && isFinite(fx) ? fx : null;
      var ph = Math.max(150, d[1] - 74);
      var C = sumsSvg({ a: function(n){ return Pw.term(x, n); }, n0: Pw.n0, N: mN, sum: lim, sumLabel: lim != null ? (Pw.fTex ? plainTex(Pw.fTex) + ' = ' + d3(lim) : 'sum ≈ ' + d3(lim)) : '', w: d[0], h: ph, cap: Math.max(6, lim != null ? Math.abs(lim) * 3 : 6), label: 'Partial sums of the power series at x = ' + T.F(x, 2) });
      box.innerHTML = C.svg;
      var Ltx = Pw.R === Infinity || Pw.R === 0 ? Pw.ratioTex : Pw.ratioTex + ' = ' + T.F(at.L, 3);
      var head, why = '<p>' + html('The ratio test on the terms gives $\\lim \\left|\\frac{a_{n+1}}{a_n}\\right| = ' + Pw.ratioTex + '$. The series converges where that is less than 1 and diverges where it is more than 1.') + '</p>';
      if(Pw.R === Infinity){ head = '<b>Converges for every x.</b> ' + html('The ratio test limit is 0 whatever $x$ is: the interval is $(-\\infty, \\infty)$.'); }
      else if(Pw.R === 0){ head = at.where === 'center' ? '<b>Converges at the center only.</b> ' + html('At $x = 0$ every term after the first is 0.') : '<b>Diverges.</b> ' + html('For any $x \\ne 0$ the ratio grows without bound: the series converges only at $x = 0$.'); }
      else if(at.where === 'lo' || at.where === 'hi'){
        head = '<b>An endpoint: the ratio test limit is exactly 1, so it cannot decide.</b> ' + html(Pw.ends[at.where]);
      } else head = '<b>' + html('$' + Ltx + (at.L < 1 ? ' < 1' : ' > 1') + '$') + ':</b> ' + (at.L < 1 ? 'the series converges at this x' + (lim != null ? html(Pw.fTex ? ', to $' + Pw.fTex + ' \\approx ' + T.F(lim, 4).replace('−', '-') + '$.' : ', to about ' + T.F(lim, 4) + '.') : '.') : 'the series diverges at this x: the terms grow.');
      if(isFinite(Rr) && Rr > 0){
        why += '<p>' + html('Solving gives the radius $R = ' + S.tn(Rr) + '$ around the center $x = ' + Pw.center + '$: the open interval $(' + S.tn(Pw.center - Rr) + ', ' + S.tn(Pw.center + Rr) + ')$.') + (Pw.note ? ' ' + html(Pw.note) : '') + '</p>' +
          '<p>At each endpoint the ratio test limit is 1, so each endpoint is a new series, tested on its own:</p><ul class="sl-ends"><li>' + html(Pw.ends.lo) + '</li><li>' + html(Pw.ends.hi) + '</li></ul>' +
          '<p>' + html('Interval of convergence: $' + (Pw.loIn ? '[' : '(') + S.tn(Pw.center - Rr) + ', ' + S.tn(Pw.center + Rr) + (Pw.hiIn ? ']' : ')') + '$. Filled dots are included, open dots are not. Drag $x$ onto an endpoint and watch the partial sums.') + '</p>';
      }
      if(Pw.fTex) why += '<p>' + html('Inside the interval the series sums to $' + Pw.fTex + '$, the dashed line.') + '</p>';
      T.explain($('.sl-say'), head, why);
      $('.sl-boardbox').innerHTML = '';
      var nm = $('.sl-nums');
      if(nm){
        var rows = ''; for(var k = 0; k < Math.min(mN, 30); k++) rows += '<tr><td>' + (Pw.n0 + k) + '</td><td class="r">' + sig(C.terms[k]) + '</td><td class="r">' + sig(C.sums[k]) + '</td></tr>';
        nm.innerHTML = '<h3 class="ls-title-l">At x = ' + esc(T.F(x, 2)) + '</h3><table class="ls-tbl sl-tbl"><caption class="sr-only">Terms and partial sums at x</caption><thead><tr><th scope="col">n</th><th scope="col" class="r">term</th><th scope="col" class="r">partial sum</th></tr></thead><tbody>' + rows + '</tbody></table>';
      }
      if(LS){
        LS.caption(T.sayHead($('.sl-say')), 'explore');
        LS.pills([{ k: 'Ratio limit', html: isFinite(at.L) ? T.F(at.L, 3) : '∞', tone: 'readout' }], 'left', 'explore');
        LS.pills([{ html: conv ? 'Converges' : at.where === 'lo' || at.where === 'hi' ? 'Diverges at this endpoint' : 'Diverges', tone: conv ? 'good' : 'warn' }], 'right', 'explore');
      }
    }
    function sayNum(){ var SN = N > NMAX_LIN ? bigSums(g).S[bigSums(g).ks.indexOf(N)] : S.partial(g.a, g.n0, N)[N - 1]; say('After ' + fmtN(N) + ' terms the partial sum is ' + T.F(SN, 4) + '. The series ' + (g.verdict === 'div' ? 'diverges.' : 'converges' + (g.sum != null ? ' to about ' + T.F(g.sum, 4) + '.' : '.'))); }
    function sayPow(){ var at = S.powerAt(Pw, x, mN); say('x = ' + T.F(x, 2) + '. Ratio test limit ' + (isFinite(at.L) ? T.F(at.L, 3) : 'infinite') + (at.where === 'lo' || at.where === 'hi' ? ': an endpoint, tested on its own.' : at.L < 1 ? ': converges.' : ': diverges.')); }
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.sl-fig')], dock: [$('.sl-ctl')], why: [$('.sl-say'), $('.sl-boardbox')], details: [$('.sl-nums')], moreLabel: 'More terms, the term values' });
      draw();
      if(s.mode() === 'explore') s.hint({ target: nSl.input, text: 'Add terms' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe($('.sl-plot')); }
      sp.open();
    }
    chips(); setView('num');
    if(!window.LevlStudio && window.ResizeObserver){ var t2 = null; new ResizeObserver(function(){ clearTimeout(t2); t2 = setTimeout(draw, 80); }).observe($('.sl-plot')); }
    return { studio: studio };
  }

  /* ===================================================== test yourself */
  var TITLES = { partial: 'Partial sums', sum: 'A geometric series', test: 'Choose and justify a test', absolute: 'Absolutely, conditionally, or not at all', interval: 'Interval of convergence' };
  var METHOD = {
    test: 'Read the term: a limit that is not 0 (nth term test), a function you can integrate, a p-series or geometric series to compare with, alternating signs, or factorials and powers (ratio test).',
    lim: 'Divide the top and the bottom by the highest power of n.',
    cond: 'The integral test needs f positive, continuous and decreasing from the first n on.',
    ival: 'Substitute u = ln x, du = dx/x, and change the bounds: x = 2 gives u = ln 2.',
    intd: 'Write the improper integral as a limit and look at what the antiderivative does as b grows.',
    cmp: 'Bound the trig part, then compare with a series you know: smaller than a convergent one, or larger than a divergent one.',
    L: 'Write the ratio, cancel what you can, then take the limit as n goes to infinity.',
    conds: 'The alternating series test needs both: |a_n| decreasing and approaching 0.',
    concl: 'Match the test\'s result to its conclusion: which way the comparison or the limit points.',
    a1: 'The first partial sum is the first term.',
    a3: 'A term is the difference of two consecutive partial sums.',
    sum: 'The sum of a series is the limit of its partial sums; for a geometric series, first term over 1 − r.',
    r: 'Divide one term by the term before it.',
    first: 'Put the starting value of n into the term.',
    s3: 'Write out the first three terms and add them.',
    conv: 'A geometric series converges exactly when |r| < 1.',
    absS: 'Drop the signs and name the series you get: p-series, geometric, or one for a test.',
    serS: 'If the absolute values converge, so does the series; if not, try the alternating series test.',
    cls: 'Absolutely: Σ|a_n| converges. Conditionally: Σa_n converges but Σ|a_n| does not.',
    R: 'Solve the ratio test inequality for the distance from the center.',
    lo: 'Put the endpoint into the series and test that series by name; the ratio test cannot decide it.',
    hi: 'Put the endpoint into the series and test that series by name; the ratio test cannot decide it.',
    int: 'The center plus and minus the radius, then a bracket at each endpoint from its own test.'
  };
  function quiz(host, data){
    T.drill(host, data, { slug: 'series-lab', noun: 'drill', typeLabel: 'Kind of problem', textOnStage: true,
      types: [{ value: 'test', label: 'Choose and justify a test' }, { value: 'interval', label: 'Interval of convergence' }, { value: 'absolute', label: 'Absolute or conditional' },
        { value: 'sum', label: 'Geometric series' }, { value: 'partial', label: 'Partial sums' }],
      generate: function(r, ctx, type){ return S.generate(r, ctx, type); },
      title: function(p){ return TITLES[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = figure(el, p, api); },
      onStep: function(s, right, api){ if(api.fig && api.fig.after) api.fig.after(s, right); },
      onTry: function(s, t, api){ return api.fig && api.fig.tryOn ? api.fig.tryOn(s, t) : false; },
      method: function(s, p){ return s.key === 'L' && p.type === 'interval' ? 'Write the ratio of consecutive terms, cancel the powers, and keep |x − a| (with absolute value bars).' : METHOD[s.key] || ''; },
      custom: function(s, api){ return s.custom === 'interval' ? intervalStep(s, api) : { html: '' }; }
    });
  }
  /* The interval step: a text box with a live reading, graded by ApCalcBCInterval. */
  function intervalStep(s, api){
    var id = T.nid('iv'), inp = null, pv = null, I = s.interval, K = IV ? IV.key(I) : null;
    function keyText(){ return K.point ? 'x = ' + I.point : IV.text(K, 'x').replace(/∞/g, 'inf').replace(/−/g, '-'); }
    function preview(){
      var v = inp.value.trim(), R = v && IV ? IV.parse(v, 'x') : null;
      pv.innerHTML = !v ? '' : R ? '<span class="bt-small">Reads as</span> <b>' + esc(IV.text(R, 'x')) + '</b>' : '<span class="calc-expr-err">Not read as an interval yet: try [1, 5), 1 &lt;= x &lt; 5, all real numbers, or x = 2.</span>';
      if(api.fig && api.fig.mine) api.fig.mine(R, true);
    }
    return {
      html: '<div class="bt-num-row cd-expr sl-iv"><label class="sr-only" for="' + id + '-i">Interval of convergence</label><input type="text" id="' + id + '-i" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="[a, b)" aria-describedby="' + id + '-p"></div><div class="cd-expr-preview calc-expr-preview" id="' + id + '-p" aria-live="polite"></div>',
      init: function(el){ inp = el.querySelector('#' + id + '-i'); pv = el.querySelector('#' + id + '-p'); inp.addEventListener('input', preview); },
      check: function(){
        var v = inp.value.trim();
        if(!v) return { blank: true, msg: 'Type the interval first, for example [1, 5) or 1 <= x < 5.' };
        if(!IV) return { blank: true, msg: 'The interval grader did not load. Reload the page.' };
        var g = IV.grade({ interval: I }, v);
        if(!g.valid) return { blank: true, msg: 'Not read as an interval. Write it like [1, 5), (-inf, inf), 1 <= x < 5, all real numbers, or x = 2.' };
        inp.classList.toggle('is-right', g.correct); inp.classList.toggle('is-wrong', !g.correct);
        var parts = g.parts || {}, partNote = g.correct || !g.total ? '' : '<span class="sl-parts">' + g.right + ' of ' + g.total + ' parts right (' + ['lo', 'loIn', 'hi', 'hiIn'].filter(function(k){ return parts[k] != null; }).map(function(k){ return { lo: 'left end', hi: 'right end', loIn: 'left bracket', hiIn: 'right bracket' }[k] + (parts[k] ? ' ✓' : ' ✗'); }).join(', ') + ')</span>';
        if(api.fig && api.fig.mine) api.fig.mine(g.read || IV.parse(v, 'x'), false, g.correct);
        return { ok: g.correct, notes: (g.notes || []).map(esc).concat(partNote ? [partNote] : []).concat(g.correct ? [] : ['<span class="sl-parts">Yours is drawn dashed on the number line.</span>']), drew: false };
      },
      reveal: function(){ inp.value = keyText(); preview(); if(api.fig && api.fig.mine) api.fig.mine(null, false, true); },
      lock: function(){ if(inp) inp.readOnly = true; },
      shownMsg: 'The interval is filled in and drawn on the number line.'
    };
  }
  /* sized(box, draw): draw at a default size, again once the studio has placed the
     figure, and whenever its box changes (text stays readable on a phone). */
  function sized(box, draw, ratio){
    var last = '';
    function dims(){
      var st = box.closest && box.closest('.ls-drill-stage'), w = Math.round(box.clientWidth) || 480, h = st ? Math.round(box.clientHeight) : 0;
      if(!st || h < 150) h = Math.round(Math.min(w * (ratio || 0.6), 360));
      return [Math.max(240, w), Math.max(150, h)];
    }
    function go(force){ var d = dims(), k = d.join('x'); if(k === last && !force) return; last = k; draw(d[0], d[1]); }
    draw(480, Math.round(480 * (ratio || 0.6)));
    setTimeout(function(){ go(true); }, 0);
    if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(go, 40); }).observe(box); }
  }
  function figure(el, p, api){
    var g = p.fig;
    if(g.kind === 'interval') return intervalFig(el, p);
    var done = {}, mine = null, a, n0, N, sum = null, sumLabel = '', hideUntil = null;
    if(g.kind === 'geo'){ a = function(n){ return g.first * Math.pow(g.r, n); }; n0 = 0; N = Math.abs(g.r) >= 1 ? 8 : 14; sum = g.sum; sumLabel = g.sum != null ? 'S = ' + T.F(g.sum, 3) : ''; hideUntil = 'conv'; }
    else if(g.kind === 'partial'){
      var Pp = g.prm, Sn = Pp.v === 0 ? function(n){ return Pp.a * n / (Pp.b * n + Pp.c); } : function(n){ return Pp.k - Pp.m / (n + Pp.j); };
      a = function(n){ return n === 1 ? Sn(1) : Sn(n) - Sn(n - 1); }; n0 = 1; N = 16; sum = g.sum; sumLabel = 'lim S_n = ' + T.F(g.sum, 3); hideUntil = 'sum';
    } else { a = S.termOf(g); n0 = g.n0; N = 30; hideUntil = g.kind === 'abs' ? 'cls' : 'concl'; }
    var shown = g.kind === 'partial' || g.kind === 'geo';
    function draw(w, h){
      if(!shown){ el.innerHTML = ''; return; }
      var C = sumsSvg({ a: a, n0: n0, N: N, sum: done[hideUntil] ? sum : null, sumLabel: sumLabel, w: w, h: h, mine: mine, curLabel: done[hideUntil] ? undefined : false, label: g.kind === 'geo' ? 'Terms and partial sums of the geometric series' : g.kind === 'partial' ? 'The partial sums S_n from the formula' : 'Partial sums of the series in the problem' });
      el.innerHTML = '<figure class="cd-fig sl-qfig">' + C.svg + '<figcaption class="bt-small">' + esc(g.kind === 'geo' ? (done[hideUntil] ? 'Bars: the terms. Dots: the partial sums.' : 'Bars: the terms. Dots: the partial sums.') : g.kind === 'partial' ? 'Dots: the partial sums S₁, S₂, … from the formula.' : capFor()) + '</figcaption></figure>';
    }
    function capFor(){
      if(g.fam === 'integral' && g.verdict === 'div') return 'The first 30 partial sums. They look as if they level off, yet the series diverges: no picture can prove convergence; a test does.';
      return 'The first 30 partial sums. They agree with the test: the series ' + (g.verdict === 'div' ? 'diverges.' : 'converges' + (g.verdict === 'cond' ? ', zigzagging toward its sum.' : '.'));
    }
    var redraw = function(){};
    sized(el, function(w, h){ redraw = function(){ draw(w, h); }; draw(w, h); }, 0.58);
    return {
      after: function(s){ done[s.key] = true; if(s.key === hideUntil){ shown = true; mine = null; } redraw(); if(s.key === hideUntil && !g.kind.match(/geo|partial/)) setTimeout(redraw, 0); },
      tryOn: function(s, t){
        if(s.kind !== 'num' || !(g.kind === 'geo' || g.kind === 'partial') || !/^(sum|s3)$/.test(s.key)) return false;
        mine = t.ok || t.shown ? null : t.value; redraw();
        return t.ok || t.shown ? false : 'Your value is the dashed line beside the partial sums.';
      }
    };
  }
  function intervalFig(el, p){
    var g = p.fig, a = g.center, Rr = g.R, stage = 0, mineI = null;
    var span = isFinite(Rr) && Rr > 0 ? Math.max(Rr * 1.8, 1.5) : 4, view = [a - span, a + span];
    function I(){
      if(Rr === Infinity) return { lo: -Infinity, hi: Infinity };
      if(Rr === 0) return { point: true, lo: a, hi: a };
      return { lo: a - Rr, hi: a + Rr, loIn: g.loIn, hiIn: g.hiIn };
    }
    var redraw = function(){};
    function draw(w, h){
      var avail = el.closest && el.closest('.ls-drill-stage') && el.clientHeight > 40 ? el.clientHeight : (h || 150), show = stage >= 1, lh = Math.max(64, Math.min(104, avail - 46));
      var L = lineSvg({ view: view, center: a, I: show ? I() : null, unknownEnds: show && stage < 2 && isFinite(Rr) && Rr > 0, mine: mineI, w: w, h: lh, label: 'Number line centered at x = ' + a + (show ? ', with the interval so far' : '') });
      el.innerHTML = '<figure class="cd-fig sl-qfig sl-ivfig">' + L.svg + '<figcaption class="bt-small">' + esc(stage === 0 ? 'The center x = ' + a + ' is marked. The interval appears as you find it.' : stage === 1 ? (isFinite(Rr) && Rr > 0 ? 'The open interval from the radius. Each endpoint is its own question.' : 'From the ratio test.') + (mineI ? ' Dashed above: yours.' : '') : 'The interval of convergence. Filled dot: included. Open dot: left out.') + '</figcaption></figure>';
    }
    sized(el, function(w, h){ redraw = function(){ draw(w, h); }; draw(w, h); }, 0.32);
    return {
      after: function(s){ if(s.key === 'R' || (s.key === 'L' && !(isFinite(Rr) && Rr > 0))) stage = Math.max(stage, 1); if(s.key === 'int'){ stage = 2; mineI = null; } redraw(); },
      mine: function(R, live, ok){ mineI = R && !ok ? R : null; redraw(); },
      tryOn: function(){ return false; }
    };
  }
})();
