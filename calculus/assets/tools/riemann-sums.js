/* Riemann sums (simulator; docs/apcalc-spec.md section 6). OWNED BY THIS TOOL
   ONLY. The model is ApCalcMath.riemannSums (calculus/assets/tools/math/
   riemann-sums.js); plots are ApCalcPlot (calc-plot.js) with the strips drawn
   on top from the same pieces the sum adds up, math text is ApCalcTex.

   Explore: a function, a table (unequal widths, drawn as data points) or a
   water-flow context. Left, right, midpoint or trapezoid; n on a slider; the
   strips shaded (positive above the axis, negative below, two tones); Play
   adds them one by one with a running sum; the exact value beside it; over
   or under explained from increasing/decreasing or concavity; tap a strip to
   read its term. Flow: a tank fills to the amount the sum stands for.
   Test yourself: ApCalcTools.drill over the model's generate(). */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot, X = window.ApCalcTex;
  if(!T || !M || !M.riemannSums || !P) return;
  var R = M.riemannSums, esc = T.esc, F = T.F;
  function tx(s){ return X ? X.html(s) : s; }
  function tr(t){ return X ? X.render(t) : t; }
  function plainTex(t){ return X ? X.text(t) : t; }
  function fmt(x, d){ return F(x, d == null ? 3 : d); }
  function nf(x){ return M.fmt(M.round(x, 3), 6); }   // a table value or an endpoint: no trailing zeros

  T.mount('riemann-sums', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'riemann-sums',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------- the picture */
  /* stripsSvg(o) -> svg string: the curve or the data points (ApCalcPlot),
     with the strips inserted under the axes. o: { spec, pieces, kind,
     shown, sel, curve? }. Each strip is the exact shape the sum counts:
     a rectangle w × h, or a trapezoid split where it crosses the axis. */
  function stripsSvg(o){
    var spec = o.spec, Fr = P.frame(spec), y0 = Fr.sy(0), g = [], dots = [];
    var shown = o.shown == null ? o.pieces.length : o.shown;
    function pt(x, y){ return Fr.sx(x).toFixed(1) + ',' + Fr.sy(y).toFixed(1); }
    function poly(pts, cls, i){ return '<polygon class="rs-strip ' + cls + (i === o.sel ? ' is-sel' : '') + '" data-i="' + i + '" points="' + pts.join(' ') + '"/>'; }
    o.pieces.slice(0, shown).forEach(function(p, i){
      if(o.kind === 'trap'){
        var a = p.h0, b = p.h1;
        if(a * b < 0){
          var xc = p.x0 + p.w * a / (a - b);
          g.push(poly([pt(p.x0, 0), pt(p.x0, a), pt(xc, 0)], a > 0 ? 'is-pos' : 'is-neg', i));
          g.push(poly([pt(xc, 0), pt(p.x1, b), pt(p.x1, 0)], b > 0 ? 'is-pos' : 'is-neg', i));
        } else g.push(poly([pt(p.x0, 0), pt(p.x0, a), pt(p.x1, b), pt(p.x1, 0)], a + b >= 0 ? 'is-pos' : 'is-neg', i));
        dots.push('<circle class="rs-dot" cx="' + Fr.sx(p.x0).toFixed(1) + '" cy="' + Fr.sy(a).toFixed(1) + '" r="3"/><circle class="rs-dot" cx="' + Fr.sx(p.x1).toFixed(1) + '" cy="' + Fr.sy(b).toFixed(1) + '" r="3"/>');
      } else {
        g.push(poly([pt(p.x0, 0), pt(p.x0, p.h), pt(p.x1, p.h), pt(p.x1, 0)], p.h >= 0 ? 'is-pos' : 'is-neg', i));
        dots.push('<line class="rs-at" x1="' + Fr.sx(p.at).toFixed(1) + '" x2="' + Fr.sx(p.at).toFixed(1) + '" y1="' + y0.toFixed(1) + '" y2="' + Fr.sy(p.h).toFixed(1) + '"/><circle class="rs-dot" cx="' + Fr.sx(p.at).toFixed(1) + '" cy="' + Fr.sy(p.h).toFixed(1) + '" r="3.2"/>');
      }
    });
    var svg = P.svg(spec);
    var layer = '<g class="rs-strips">' + g.join('') + '</g>';
    svg = svg.replace('<g class="calc-plot-axis">', layer + '<g class="calc-plot-axis">');
    return svg.replace('</svg>', '<g class="rs-dots" aria-hidden="true">' + dots.join('') + '</g></svg>');
  }
  function yRange(vals, pad){
    var lo = Math.min.apply(null, vals.concat([0])), hi = Math.max.apply(null, vals.concat([0])), sp = hi - lo || 1;
    return [lo - sp * (pad || 0.08), hi + sp * (pad || 0.12)];
  }
  /* The tank: a real-looking scene, its water level the amount so far. */
  function tankSvg(amount, cap, unit, flowing){
    var W = 170, H = 230, x0 = 34, x1 = 150, top = 46, bot = 212, frac = Math.max(0, Math.min(1, amount / cap)), lev = bot - (bot - top) * frac;
    var ticks = [0, 0.25, 0.5, 0.75, 1].map(function(t){ var y = bot - (bot - top) * t; return '<line class="rs-tk" x1="' + (x1 - 10) + '" x2="' + x1 + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><text class="rs-tkt" x="' + (x1 + 4) + '" y="' + (y + 4).toFixed(1) + '">' + M.fmt(cap * t, 3) + '</text>'; }).join('');
    return '<svg class="rs-tank-svg" viewBox="0 0 ' + (W + 20) + ' ' + H + '" role="img" aria-label="Tank holding about ' + esc(M.fmt(amount, 4)) + ' ' + esc(unit) + ' so far, of a scale up to ' + esc(M.fmt(cap, 3)) + '">' +
      '<defs><clipPath id="rsTankClip"><rect x="' + x0 + '" y="' + top + '" width="' + (x1 - x0) + '" height="' + (bot - top) + '" rx="6"/></clipPath></defs>' +
      '<path class="rs-pipe" d="M0 18 H58 Q66 18 66 26 V34"/>' +
      (flowing ? '<path class="rs-pour" d="M66 34 V' + lev.toFixed(1) + '"/>' : '') +
      '<g clip-path="url(#rsTankClip)"><rect class="rs-water" x="' + x0 + '" y="' + lev.toFixed(1) + '" width="' + (x1 - x0) + '" height="' + (bot - lev + 2).toFixed(1) + '"/>' +
      '<path class="rs-wave" d="M' + x0 + ' ' + lev.toFixed(1) + ' q14 -4 29 0 t29 0 t29 0 t29 0"/></g>' +
      '<rect class="rs-tank" x="' + x0 + '" y="' + top + '" width="' + (x1 - x0) + '" height="' + (bot - top) + '" rx="6"/>' + ticks +
      '<text class="rs-tank-v" x="' + ((x0 + x1) / 2) + '" y="' + Math.min(bot - 8, Math.max(top + 18, lev + 22)).toFixed(1) + '" text-anchor="middle">' + esc(M.fmt(amount, 4)) + ' ' + esc(unit) + '</text></svg>';
  }

  /* --------------------------------------------------------- explore */
  function explore(host, data){
    var E = data.explore || {}, items = [];
    (E.functions || []).forEach(function(f){ items.push({ type: 'fn', it: f }); });
    (E.flows || []).forEach(function(f){ items.push({ type: 'flow', it: f }); });
    (E.tables || []).forEach(function(f){ items.push({ type: 'table', it: f }); });
    var cur = items[0], kind = 'left', n = 4, shown = null, sel = -1, anim = null, LS = null, cue = null, touched = false;
    var nid = T.nid('rs');
    function $(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); }
    host.innerHTML = '<section class="bt-problem rs-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Riemann sums explorer</h2>' +
      '<div class="rs-fig"><div class="rs-plot"></div><div class="rs-tank" hidden></div></div>' +
      '<div class="rs-ctl"><div class="rs-seg ls-seg" role="group" aria-label="Kind of sum">' + R.KINDS.map(function(k){ return '<button type="button" data-k="' + k + '" aria-pressed="false">' + R.SHORT[k] + '</button>'; }).join('') + '</div>' +
      '<div class="rs-n"></div><div class="rs-tablenote bt-small" hidden></div>' +
      '<div class="bt-buttons rs-btns"><button type="button" class="bt-btn rs-play" aria-pressed="false">▶ Add them one by one</button></div></div>' +
      '<div class="rs-say"></div>' +
      T.moreHtml('<div class="rs-pick"></div>', 'a function, a table or the water tank') +
      '<div class="rs-nums"></div><div class="rs-cmp"></div><p class="sr-only rs-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.rs-live'));
    cue = T.cue('Pick a kind of sum, then drag n to use more strips.');
    $('.rs-ctl').insertBefore(cue.el, $('.rs-ctl').firstChild);
    var nSl = T.slider({ label: 'Number of subintervals, n', min: 1, max: 40, step: 1, value: n, decimals: 0, onInput: function(v){ n = v; act(); stop(); shown = null; draw(); } });
    $('.rs-n').appendChild(nSl.el);
    var opts = items.map(function(x, i){ return { value: i, label: (x.type === 'table' ? 'Table: ' : x.type === 'flow' ? 'Context: ' : '') + x.it.name }; });
    var pick = T.choiceSelect({ label: 'Function', options: opts, value: 0, onChange: function(v){ cur = items[+v]; stop(); shown = null; sel = -1; setup(); draw(); } });
    $('.rs-pick').appendChild(pick.el);
    host.querySelectorAll('.rs-seg button').forEach(function(b){ b.addEventListener('click', function(){ if(b.disabled) return; kind = b.getAttribute('data-k'); act(); stop(); shown = null; sel = -1; draw(); }); });
    $('.rs-play').addEventListener('click', function(){ anim ? stop() : play(); });
    function act(){ if(!touched){ touched = true; cue.done(); } }

    function src(){
      var it = cur.it;
      if(cur.type === 'table') return { xs: it.xs, ys: it.ys, a: it.xs[0], b: it.xs[it.xs.length - 1], trend: it.trend ? M.fn(it.trend) : null, it: it };
      return { f: M.fn(it.fn), a: it.a, b: it.b, it: it };
    }
    function setup(){
      var isT = cur.type === 'table', s = src();
      nSl.el.hidden = isT;
      var note = $('.rs-tablenote'); note.hidden = !isT;
      if(isT) note.textContent = 'A table fixes the subintervals: ' + (s.xs.length - 1) + ' of them, with widths ' + s.xs.slice(1).map(function(x, i){ return M.fmt(x - s.xs[i], 3); }).join(', ') + '.';
      var midBtn = host.querySelector('.rs-seg [data-k="mid"]') || (LS && LS.root.querySelector('.rs-seg [data-k="mid"]'));
      var midOk = !isT || R.midOk(s.xs);
      if(midBtn){ midBtn.disabled = !midOk; midBtn.title = midOk ? '' : 'A midpoint sum from a table needs an odd number of points, so the subintervals pair up.'; }
      if(!midOk && kind === 'mid') kind = 'left';
      var tank = $('.rs-tank'); tank.hidden = cur.type !== 'flow';
      $('.rs-fig').classList.toggle('has-tank', cur.type === 'flow');
      if(LS) LS.root.querySelector('.calc-ls-setup .ls-v') && (LS.root.querySelector('.calc-ls-setup .ls-v').textContent = cur.it.name);
    }
    function compute(){
      var s = src(), ps, exact = null;
      if(cur.type === 'table'){ ps = R.tablePieces(s.xs, s.ys, kind); if(s.trend) exact = M.integral(s.trend, s.a, s.b); }
      else { ps = R.pieces(s.f, R.partition(s.a, s.b, n), kind); exact = M.integral(s.f, s.a, s.b); }
      var sh = cur.type === 'table' ? (s.trend ? R.shape(s.trend, s.a, s.b) : { inc: null, conc: null }) : R.shape(s.f, s.a, s.b);
      return { s: s, ps: ps, sum: R.total(ps), exact: exact, shape: sh };
    }
    function names(){
      var it = cur.it;
      if(cur.type === 'fn') return { f: 'f', v: 'x', unitAmt: '', rateU: '', varU: '' };
      return { f: it.rate || 'r', v: it.var || 't', unitAmt: it.amtUnit, rateU: it.rateUnit, varU: it.varUnit };
    }
    function spec(c, w, h){
      var s = c.s, it = cur.it, nm = names(), vals = [], pad = (s.b - s.a) * 0.04;
      var curves = [], pts = [];
      if(cur.type === 'table'){
        vals = s.ys.slice();
        if(s.trend) curves.push({ fn: s.trend, domain: [s.a, s.b], cls: 's1', dashed: true });
        pts = s.xs.map(function(x, i){ return { at: [x, s.ys[i]], cls: 's1' }; });
      } else {
        for(var i = 0; i <= 120; i++) vals.push(s.f(s.a + (s.b - s.a) * i / 120));
        curves.push({ fn: s.f, domain: [s.a, s.b], cls: 's1', label: cur.type === 'fn' ? 'f' : nm.f });
      }
      var yr = it.y || yRange(vals);
      return { label: (cur.type === 'table' ? 'Data points of ' + nm.f + ' from the table' : 'Graph of ' + plainTex(it.tex)) + ' with the ' + R.NAME[kind] + ' strips' + (cur.type === 'table' ? '' : ' for n = ' + n) + '. The sum is ' + M.fmt(c.sum, 4) + '.',
        width: w, height: h, x: [s.a - pad, s.b + pad], y: yr, piX: !!it.piX,
        xLabel: cur.type === 'fn' ? 'x' : nm.v + ' (' + nm.varU + ')', yLabel: cur.type === 'fn' ? 'y' : nm.f + '(' + nm.v + ')',
        curves: curves, points: pts };
    }
    function size(el){
      var r = el.getBoundingClientRect(), w = Math.round(r.width) || 620, h = Math.round(r.height) || 0;
      w = Math.max(300, Math.min(1000, w));
      if(!h || h < 120) h = Math.round(Math.min(420, Math.max(240, w * 0.6)));
      return [w, Math.min(h, 640)];
    }
    var last = null;
    function draw(){
      var c = compute(); last = c;
      var host2 = $('.rs-plot'), wh = size(host2), nm = names(), it = cur.it;
      var k = shown == null ? c.ps.length : shown;
      var running = c.ps.slice(0, k).reduce(function(a, p){ return a + p.area; }, 0);
      host2.innerHTML = stripsSvg({ spec: spec(c, wh[0], wh[1]), pieces: c.ps, kind: kind, shown: k, sel: sel });
      var svg = host2.querySelector('svg');
      svg.addEventListener('click', function(e){ var t = e.target.closest('[data-i]'); if(!t) return; sel = +t.getAttribute('data-i'); act(); draw(); });
      if(cur.type === 'flow'){
        var cap = niceCap(Math.max(c.exact, c.sum) * 1.15);
        $('.rs-tank').innerHTML = tankSvg(running, cap, it.amtAbbr || it.amtUnit, !!anim);
      }
      var vd = R.verdict(kind, c.shape, nm.f), err = c.exact == null ? null : c.sum - c.exact;
      var NAMEc = R.NAME[kind].charAt(0).toUpperCase() + R.NAME[kind].slice(1);
      var unit = nm.unitAmt ? ' ' + nm.unitAmt : '';
      var headSum = anim ? 'Running sum after ' + k + ' of ' + c.ps.length + ': ' + fmt(running) + unit + '.' : NAMEc + (cur.type === 'table' ? '' : ', n = ' + n) + ': ' + fmt(c.sum) + unit + '.';
      var verdictLine = err == null ? 'The table alone cannot say whether it is too big or too small.' :
        Math.abs(err) < 5e-4 * Math.max(1, Math.abs(c.exact)) ? 'Equal to the exact value here (to three decimals).' :
        vd.v ? (vd.v === 'over' ? 'An overestimate' : 'An underestimate') + ': ' + vd.why : (err > 0 ? 'Over' : 'Under') + ' this time, but ' + vd.why.replace(/^\w+ is not/, nm.f + ' is not');
      var selLine = '';
      if(sel > -1 && sel < c.ps.length){
        var p = c.ps[sel];
        selLine = 'Strip ' + (sel + 1) + ': width ' + fmt(p.w) + ' × ' + (kind === 'trap' ? 'average height (' + fmt(p.h0) + ' + ' + fmt(p.h1) + ') ÷ 2' : 'height ' + nm.f + '(' + fmt(p.at) + ') = ' + fmt(p.h)) + ' = ' + fmt(p.area) + (p.area < 0 ? ' (below the axis, so it counts as negative)' : '') + '.';
      }
      var meaning = cur.type === 'flow' ? 'Width (' + nm.varU + ') × rate (' + nm.rateU + ') = ' + nm.unitAmt + ', so the sum is an amount: about ' + fmt(c.sum, 1) + ' ' + nm.unitAmt + ' of water from ' + nm.v + ' = ' + M.fmt(c.s.a, 3) + ' to ' + M.fmt(c.s.b, 3) + ' ' + nm.varU + '.' : '';
      var neg = c.ps.some(function(p){ return p.area < 0; });
      var why = '<p>' + esc(verdictLine) + '</p>' +
        (meaning ? '<p>' + esc(meaning) + '</p>' : '') +
        (neg ? '<p>Strips below the axis (the second tone) count as negative: the sum is a net, signed amount.</p>' : '') +
        '<p>' + esc(rule(kind)) + '</p>' +
        (cur.type !== 'table' && err != null ? '<p>' + esc(conv(kind)) + '</p>' : '');
      T.explain($('.rs-say'), '<b>' + esc(headSum) + '</b> ' + esc(selLine || shortVerdict(vd, err, c)), why);
      drawNums(c, k);
      if(LS){
        var pills = [{ k: R.SHORT[kind] + (cur.type === 'table' ? '' : ' n=' + n), html: fmt(anim ? running : c.sum), tone: 'readout' }];
        LS.pills(pills, 'left', 'explore');
        LS.pills(c.exact == null ? [] : [{ k: cur.type === 'table' ? 'Trend' : 'Exact', html: fmt(c.exact), tone: 'ghost' }], 'right', 'explore');
        LS.caption('<b>' + esc(headSum) + '</b> ' + esc(selLine || shortVerdict(vd, err, c)), 'explore');
        var sv = LS.root.querySelector('.calc-ls-setup .ls-v'); if(sv) sv.textContent = cur.it.name;
      }
      host.querySelectorAll('.rs-seg button').forEach(sync); if(LS) LS.root.querySelectorAll('.rs-seg button').forEach(sync);
      if(!anim) say(headSum + ' ' + (c.exact != null ? (cur.type === 'table' ? 'Trend value ' : 'Exact value ') + fmt(c.exact) + '. ' : '') + verdictLine);
    }
    function sync(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === kind)); }
    function shortVerdict(vd, err, c){
      if(err == null) return 'Tap a strip to read its term.';
      if(Math.abs(err) < 5e-4 * Math.max(1, Math.abs(c.exact))) return 'It matches the exact value.';
      var by = ' by ' + fmt(Math.abs(err)) + '.';
      if(vd.v) return (vd.v === 'over' ? 'Over' : 'Under') + by + ' ' + vd.why.split(',')[0] + '.';
      return (err > 0 ? 'Over' : 'Under') + by + ' No rule fixes the side here.';
    }
    function rule(k){
      return k === 'left' ? 'A left sum takes each height at the left end of its subinterval.' : k === 'right' ? 'A right sum takes each height at the right end of its subinterval.'
        : k === 'mid' ? 'A midpoint sum takes each height at the middle of its subinterval.' : 'A trapezoidal sum joins the two end heights of each subinterval with a straight top: width × (left + right) ÷ 2. It is the average of the left and right sums.';
    }
    function conv(k){ return k === 'mid' || k === 'trap' ? 'Doubling n cuts the error to about a quarter.' : 'Doubling n cuts the error to about half.'; }
    function niceCap(v){ var p = Math.pow(10, Math.floor(Math.log10(Math.max(1, v)))), ms = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; for(var i = 0; i < ms.length; i++) if(v <= ms[i] * p) return ms[i] * p; return 10 * p; }
    function drawNums(c, k){
      var nm = names(), isT = cur.type === 'table', box = $('.rs-nums');
      var head = '<tr><th scope="col">Strip</th><th scope="col">Subinterval</th><th scope="col">Width</th><th scope="col">' + (kind === 'trap' ? 'Heights (ends)' : 'Height ' + esc(nm.f) + '(' + (kind === 'left' ? 'left end' : kind === 'right' ? 'right end' : 'middle') + ')') + '</th><th scope="col">Term</th></tr>';
      var rows = c.ps.map(function(p, i){
        return '<tr' + (i === sel ? ' class="hl"' : '') + (i >= k ? ' class="rs-later"' : '') + '><th scope="row">' + (i + 1) + '</th><td>[' + nf(p.x0) + ', ' + nf(p.x1) + ']</td><td class="r">' + nf(p.w) + '</td><td class="r">' + (kind === 'trap' ? nf(p.h0) + ', ' + nf(p.h1) : nf(p.h)) + '</td><td class="r">' + fmt(p.area) + '</td></tr>';
      }).join('');
      var dx = isT ? '' : '\\Delta ' + nm.v + ' = \\frac{' + M.fmt(c.s.b, 4).replace('−', '-') + ' - ' + M.fmt(c.s.a, 4).replace('−', '-').replace(/^-(.*)$/, '(-$1)') + '}{' + n + '} = ' + M.fmt((c.s.b - c.s.a) / n, 4).replace('−', '-');
      var sig = isT ? '' : kind === 'trap' ? '\\sum_{i=1}^{' + n + '} \\frac{' + nm.f + '(' + nm.v + '_{i-1}) + ' + nm.f + '(' + nm.v + '_i)}{2}\\,\\Delta ' + nm.v
        : '\\sum_{i=1}^{' + n + '} ' + nm.f + '(' + (kind === 'left' ? nm.v + '_{i-1}' : kind === 'right' ? nm.v + '_i' : 'm_i') + ')\\,\\Delta ' + nm.v;
      box.innerHTML = '<h3 class="ls-title-l">The sum, strip by strip</h3>' +
        (isT ? '' : '<p>' + tr(dx) + '</p><p>' + tr(sig + ' = ' + M.fmt(c.sum, 6).replace('−', '-')) + '</p>') +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Every strip of the sum"><table class="ls-tbl rs-tbl"><caption class="sr-only">Every strip: width, height and term</caption><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="bt-small">Total: ' + fmt(c.sum) + (nm.unitAmt ? ' ' + esc(nm.unitAmt) : '') + (c.exact != null ? '. ' + (isT ? 'Area under the trend curve (not known on the exam): ' : 'Exact area (the definite integral): ') + fmt(c.exact) : '') + '.</p>';
      var cmp = $('.rs-cmp'), s = c.s;
      var all = R.KINDS.map(function(kk){
        var ps = isT ? R.tablePieces(s.xs, s.ys, kk) : R.pieces(s.f, R.partition(s.a, s.b, n), kk);
        return ps.length ? '<tr' + (kk === kind ? ' class="hl"' : '') + '><th scope="row">' + R.SHORT[kk] + '</th><td class="r">' + fmt(R.total(ps)) + '</td>' + (c.exact != null ? '<td class="r">' + fmt(R.total(ps) - c.exact) + '</td>' : '') + '</tr>' : '';
      }).join('');
      cmp.innerHTML = '<h3 class="ls-title-l">All four, side by side</h3><table class="ls-tbl"><caption class="sr-only">Left, right, midpoint and trapezoid sums compared</caption><thead><tr><th scope="col">Sum</th><th scope="col">Value</th>' + (c.exact != null ? '<th scope="col">' + (isT ? 'Minus trend' : 'Minus exact') + '</th>' : '') + '</tr></thead><tbody>' + all + '</tbody></table>' +
        (c.exact != null ? '<p class="bt-small">' + (isT ? 'Trend' : 'Exact') + ': ' + fmt(c.exact) + '.</p>' : '');
    }
    function play(){
      var c = compute(), N = c.ps.length;
      act(); sel = -1;
      var b = $('.rs-play'); b.setAttribute('aria-pressed', 'true'); b.textContent = '❚❚ Pause';
      if(T.reduced()){ shown = null; anim = null; stopBtn(); draw(); say('All ' + N + ' strips added: ' + fmt(c.sum) + '.'); return; }
      shown = 0;
      var per = Math.max(0.06, Math.min(0.45, 3.2 / N)), t0 = 0;
      anim = P.loop(function(dt, t){
        var k = Math.min(N, Math.floor(t / per) + 1);
        if(k !== shown){ shown = k; draw(); }
        return k < N || t - t0 < 0;
      }, { onEnd: function(){ anim = null; shown = null; stopBtn(); draw(); } });
      anim.start();
    }
    function stopBtn(){ var b = $('.rs-play'); if(b){ b.setAttribute('aria-pressed', 'false'); b.textContent = '▶ Add them one by one'; } }
    function stop(){ if(anim){ anim.stop(); anim = null; shown = null; stopBtn(); } }

    function studio(pane, s){
      LS = s;
      var fig = $('.rs-fig'), ctl = $('.rs-ctl');
      var sp = T.studioPane(pane, s, { stage: [fig], dock: [ctl], setup: 'Function', moreLabel: 'Function, table or context', why: [$('.rs-say')], details: [$('.rs-nums'), $('.rs-cmp')] });
      sp.setup(cur.it.name);
      setup(); draw();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.rs-seg'), text: 'Pick a kind of sum' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe(fig); }
    }
    setup(); draw();
    if(!window.LevlStudio && window.ResizeObserver){ var t2 = null; new ResizeObserver(function(){ clearTimeout(t2); t2 = setTimeout(draw, 60); }).observe($('.rs-fig')); }
    return { stop: stop, studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    // A problem whose text holds real formulas is read on the stage, over
    // its figure (the caption is plain text).
    var o = { slug: 'riemann-sums', noun: 'drill',
      generate: function(r, ctx, type){ var p = M.riemannSums.generate(r, ctx, type); o.textOnStage = !!p.stageText; return p; },
      types: [{ value: 'table', label: 'Sums from a table' }, { value: 'overunder', label: 'Over or under?' }, { value: 'context', label: 'The sum in context' }, { value: 'sigma', label: 'Limit of a sum to an integral' }, { value: 'tosum', label: 'Integral to a limit of sums' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { table: 'A sum from a table', overunder: 'Over or under?', context: 'An amount from a rate', sigma: 'From a sum to an integral', tosum: 'From an integral to a sum' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; figure(el, p, false); },
      onStep: function(s, right, api){ if(s.key === 'setup' || s.key === 'verdict' || s.key === 'pick') figure(api.fig, api.problem, true); }
    };
    T.drill(host, data, o);
  }
  /* The drill's figure: the data or the graph; the strips appear once the
     student has picked the sum (feedback on the stage). */
  function figure(el, p, reveal){
    var g = p.figure;
    if(!g && p.table){ el.innerHTML = '<div class="rs-qtable">' + p.table.html + '</div>'; return; }
    if(!g){ el.innerHTML = ''; return; }
    var spec, ps = [], kind = g.sumKind;
    if(g.kind === 'table'){
      var xs = g.xs, ys = g.ys, pad = (xs[xs.length - 1] - xs[0]) * 0.05;
      spec = { label: 'Data points of ' + g.rate + '(' + g.v + ') from the table, at ' + xs.join(', ') + ' ' + g.varUnit, width: 520, height: 300, x: [xs[0] - pad, xs[xs.length - 1] + pad], y: yRange(ys), xLabel: g.v + ' (' + g.varUnit + ')', yLabel: g.rate + '(' + g.v + ')',
        points: xs.map(function(x, i){ return { at: [x, ys[i]], cls: 's1' }; }), xStep: niceX(xs) };
      if(reveal) ps = R.tablePieces(xs, ys, kind);
    } else if(g.kind === 'poly'){
      var fx = function(x){ for(var i = 0; i + 1 < g.xs.length; i++) if(x <= g.xs[i + 1] + 1e-12) return g.ys[i] + (g.ys[i + 1] - g.ys[i]) * (x - g.xs[i]) / (g.xs[i + 1] - g.xs[i]); return g.ys[g.ys.length - 1]; };
      var p0 = g.xs[0], p1 = g.xs[g.xs.length - 1];
      spec = { label: 'Graph of the rate ' + g.rate + '(' + g.v + ') made of straight pieces, with the area under it shaded', width: 520, height: 300, x: [p0 - 0.3, p1 + 0.3], y: yRange(g.ys), xLabel: g.v + ' (' + g.varUnit + ')', yLabel: g.rate + '(' + g.v + ')', xStep: 1,
        curves: [{ fn: fx, domain: [p0, p1], cls: 's1' }], shade: [{ fn: fx, domain: [p0, p1] }], points: g.xs.map(function(x, i){ return { at: [x, g.ys[i]], cls: 's1' }; }) };
    } else {
      var f = M.fn(g.fn), vals = []; for(var i = 0; i <= 80; i++) vals.push(f(g.a + (g.b - g.a) * i / 80));
      spec = { label: 'Graph of f on the interval from ' + g.a + ' to ' + g.b, width: 520, height: 300, x: [g.a - (g.b - g.a) * 0.05, g.b + (g.b - g.a) * 0.05], y: yRange(vals), xLabel: 'x', yLabel: 'y', curves: [{ fn: f, domain: [g.a, g.b], cls: 's1', label: 'f' }] };
      if(reveal) ps = R.pieces(f, R.partition(g.a, g.b, g.n || 4), kind);
    }
    el.innerHTML = (p.table ? '<div class="rs-qtable">' + p.table.html + '</div>' : '') + '<figure class="rs-qfig">' + stripsSvg({ spec: spec, pieces: ps, kind: kind }) + (reveal && ps.length ? '<figcaption class="bt-small">The ' + esc(R.NAME[kind]) + ', drawn.</figcaption>' : '') + '</figure>';
  }
  function niceX(xs){ var span = xs[xs.length - 1] - xs[0]; return span <= 12 ? 1 : span <= 24 ? 2 : 5; }
})();
