/* Riemann sums (simulator; docs/apcalc-spec.md section 6). OWNED BY THIS TOOL
   ONLY. The model is ApCalcMath.riemannSums (calculus/assets/tools/math/
   riemann-sums.js); math text is ApCalcTex.

   Explore (tools v2, docs/tools-v2-calc-riemann-sums-brief.md): two tabs on the
   shared kit (assets/course/tool-kit2.js) through the adapter
   ApCalcTools.studioKit2. The strips are glass columns of water on the graph,
   a tank beside them holds their total, a thin line in the tank is the exact
   amount; the gaps between the columns' tops and the curve are colored
   (orange: counted extra, green: missed). Tab 1 "More strips": the strips'
   knob on the picture (1 to 100); the four sums a quiet switch; Fill one by
   one pours each column into the tank; tap a strip to read its term. Tab 2
   "Over or under": the four sums are the main control and the cause line
   gives the rule. A table fixes the strips. "?" holds the strip table, the
   sigma notation, all four sums side by side and the rules.
   Test yourself: ApCalcTools.drill over the model's generate() (unchanged). */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot, X = window.ApCalcTex;
  if(!T || !M || !M.riemannSums || !P) return;
  var R = M.riemannSums, esc = T.esc, F = T.F;
  function tr(t){ return X ? X.render(t) : t; }
  function plainTex(t){ return X ? X.text(t) : t; }
  function fmt(x, d){ return F(x, d == null ? 3 : d); }
  function nf(x){ return M.fmt(M.round(x, 3), 6); }   // a table value or an endpoint: no trailing zeros

  /* ------------------------------------------------------- the quiz's picture */
  /* stripsSvg(o) -> svg string: the curve or the data points (ApCalcPlot),
     with the strips inserted under the axes. o: { spec, pieces, kind,
     shown, sel, fn? }. Each strip is the exact shape the sum counts:
     a rectangle w × h, or a trapezoid split where it crosses the axis.
     With o.fn (a function, not a table) the slivers between each strip's top
     and the curve are shaded too: where the curve is above the top the sum
     misses that area (amber), where it is below the sum counts extra (pink),
     so "under by 7.9" is a region you can see. */
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
    var sl = [];
    if(o.fn) o.pieces.slice(0, shown).forEach(function(p){
      var top = o.kind === 'trap' ? function(x){ return p.h0 + (p.h1 - p.h0) * (x - p.x0) / p.w; } : function(){ return p.h; };
      var m = 32, run = [], sgn = 0;
      function flush(){ if(run.length > 1 && sgn){ var up = run.map(function(q){ return pt(q[0], q[1]); }), dn = run.slice().reverse().map(function(q){ return pt(q[0], q[2]); }); sl.push('<polygon class="rs-sliver ' + (sgn > 0 ? 'is-miss' : 'is-extra') + '" points="' + up.concat(dn).join(' ') + '"/>'); } run = []; }
      for(var j = 0; j <= m; j++){
        var x = p.x0 + p.w * j / m, fy = o.fn(x), ty = top(x), d = fy - ty, sg = Math.abs(d) < 1e-12 ? 0 : d > 0 ? 1 : -1;
        if(!isFinite(fy)){ flush(); sgn = 0; continue; }
        if(sg && sgn && sg !== sgn){
          // the curve crosses the strip's top between samples: end one sliver there and start the other
          var xa = p.x0 + p.w * (j - 1) / m, da = o.fn(xa) - top(xa), xc = xa + (x - xa) * da / (da - d), yc = top(xc);
          run.push([xc, yc, yc]); flush(); run.push([xc, yc, yc]);
        }
        if(sg) sgn = sg;
        run.push([x, fy, ty]);
      }
      flush();
    });
    var svg = P.svg(spec);
    var layer = '<g class="rs-strips">' + g.join('') + '</g>' + (sl.length ? '<g class="rs-slivers" aria-hidden="true">' + sl.join('') + '</g>' : '');
    svg = svg.replace('<g class="calc-plot-axis">', layer + '<g class="calc-plot-axis">');
    return svg.replace('</svg>', '<g class="rs-dots" aria-hidden="true">' + dots.join('') + '</g>' + (o.marks ? o.marks.svg(Fr) : '') + '</svg>');
  }
  function yRange(vals, pad){
    var lo = Math.min.apply(null, vals.concat([0])), hi = Math.max.apply(null, vals.concat([0])), sp = hi - lo || 1;
    return [lo - sp * (pad || 0.08), hi + sp * (pad || 0.12)];
  }

  /* ========================================================= Explore (tools v2) */
  /* docs/tools-v2-calc-riemann-sums-brief.md. The strips are glass columns of water standing on the graph: each holds
     width × height, the exact shape the sum adds. Beside them a tank holds the columns' total, with a thin line at the
     exact amount. Every number on screen is read from what is drawn on that frame: the drawn tops are one polyline,
     and the sum is that polyline's signed area (during a split or merge the tops are a blend of the old and new strips,
     so the sum passes through the values in between). Two tabs: More strips (the strips' knob on the picture's top edge
     is the main control) and Over or under (the four sums are the main control; the knob is quiet). */
  var NS = 'http://www.w3.org/2000/svg', uid = 0;
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function mn(s){ s = String(s); if(/^-0(\.0*)?$/.test(s)) s = s.slice(1); return s.replace(/^-/, '−'); }
  function fix(x, d){ return mn((Math.abs(x) < 0.5 * Math.pow(10, -d) ? 0 : x).toFixed(d)); }
  function sig2(x){ if(!x) return '0'; var d = clamp(1 - Math.floor(Math.log10(Math.abs(x))), 0, 8); return mn(x.toFixed(d)); }
  var ABBR = { minutes: 'min', seconds: 's', hours: 'h', 'liters per minute': 'L/min', 'meters per second': 'm/s', liters: 'L', meters: 'm' };
  function ab(u){ return ABBR[u] || u || ''; }
  function piT(v){ var k = Math.round(v / (Math.PI / 2)); return ['0', 'π/2', 'π', '3π/2', '2π'][k] || mn(+v.toFixed(3)); }
  var SUB = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '-': '₋', '−': '₋' };
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '−': '⁻' };
  function scr(s, map){ s = String(s); for(var i = 0; i < s.length; i++) if(!map[s.charAt(i)]) return null; return s.split('').map(function(c){ return map[c]; }).join(''); }

  /* A strip set as one polyline of its tops: [[x, y], ...], with two points at a shared x where the height jumps. */
  function profOf(ps, kind){
    var pts = [];
    ps.forEach(function(p){ if(kind === 'trap'){ pts.push([p.x0, p.h0], [p.x1, p.h1]); } else { pts.push([p.x0, p.h], [p.x1, p.h]); } });
    return pts;
  }
  /* the segments of a polyline (consecutive points with different x) */
  function segsOf(P){ var s = []; for(var i = 0; i + 1 < P.length; i++) if(P[i + 1][0] - P[i][0] > 1e-12) s.push(P[i][0], P[i][1], P[i + 1][0], P[i + 1][1]); return s; }
  /* its value at x, from the left (side < 0) or from the right */
  function valAt(sg, x, side){
    var n = sg.length / 4, lo = 0, hi = n - 1;
    if(!n) return 0;
    while(lo < hi){
      var mid = (lo + hi) >> 1, x0 = sg[mid * 4], x1 = sg[mid * 4 + 2];
      if(side < 0 ? x <= x0 : x < x0) hi = mid - 1;
      else if(side < 0 ? x > x1 : x >= x1) lo = mid + 1;
      else { lo = hi = mid; }
    }
    var j = clamp(lo, 0, n - 1) * 4, a = sg[j], b = sg[j + 2], t = b > a ? clamp((x - a) / (b - a), 0, 1) : 0;
    return sg[j + 1] + (sg[j + 3] - sg[j + 1]) * t;
  }
  /* the blend of two polylines on the same interval: (1 − e) A + e B, exactly (linear between the union of breaks) */
  function blend(A, B, e){
    var xs = A.map(function(p){ return p[0]; }).concat(B.map(function(p){ return p[0]; })).sort(function(a, b){ return a - b; }), ux = [];
    xs.forEach(function(x){ if(!ux.length || x - ux[ux.length - 1] > 1e-9) ux.push(x); });
    var sa = segsOf(A), sb = segsOf(B), out = [];
    ux.forEach(function(x, i){
      var l = (1 - e) * valAt(sa, x, -1) + e * valAt(sb, x, -1), r = (1 - e) * valAt(sa, x, 1) + e * valAt(sb, x, 1);
      if(!i) out.push([x, r]); else if(i === ux.length - 1) out.push([x, l]); else { out.push([x, l]); if(Math.abs(r - l) > 1e-12) out.push([x, r]); }
    });
    return out;
  }
  /* signed area under a polyline (exact) */
  function areaOf(P){ var s = 0; for(var i = 0; i + 1 < P.length; i++) s += (P[i + 1][0] - P[i][0]) * (P[i][1] + P[i + 1][1]) / 2; return s; }

  function explore(host, data){
    var K = window.LevlKit2, id = 'rs2-' + (++uid), E = data.explore || {}, items = [];
    (E.flows || []).forEach(function(f){ items.push({ type: 'flow', it: f }); });
    (E.functions || []).forEach(function(f){ items.push({ type: 'fn', it: f }); });
    (E.tables || []).forEach(function(f){ items.push({ type: 'table', it: f }); });
    var start = items.filter(function(x){ return x.it.id === 'pump'; })[0] || items[0];
    var S = { tab: 'n', cur: start, kind: 'left', n1: 4, n2: 3, sel: -1, mode: 'explore', ready: false,
      from: null, to: null, e: 1, wFrom: [], wTo: [], ps: [], fill: null, refill: 1, took: null, at100: false, drawn: null };
    var D = null, G = null, LS = null;
    function isT(){ return S.cur.type === 'table'; }
    function nOf(){ return S.tab === 'n' ? S.n1 : S.n2; }

    /* ---------------------------------------------------- the stage */
    var stage = el('div', 'rs2');
    var tabs = K.tabs({ label: 'What to explore', big: true, value: S.tab,
      items: [{ value: 'n', label: 'More strips', short: 'More strips' }, { value: 'ou', label: 'Over or under', short: 'Over or under' }],
      onChange: function(v){ setTab(v); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: '', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    var pickWrap = el('label', 'rs2-pick'), pick = el('select', 'rs2-sel');
    pickWrap.innerHTML = '<span class="rs2-pick-k">Rate</span>';
    pick.setAttribute('aria-label', 'Curve or table');
    [['flow', 'Flows'], ['fn', 'Functions'], ['table', 'Tables']].forEach(function(g){
      var og = document.createElement('optgroup'); og.label = g[1];
      items.forEach(function(x, i){ if(x.type !== g[0]) return; var op = document.createElement('option'); op.value = String(i); op.textContent = x.it.name; og.appendChild(op); });
      if(og.children.length) pick.appendChild(og);
    });
    pick.value = String(items.indexOf(S.cur));
    pickWrap.appendChild(pick);
    head.el.insertBefore(pickWrap, head.how);
    stage.appendChild(head.el);
    var scene = el('div', 'rs2-scene'); scene.id = id + '-scene';
    scene.innerHTML = '<svg class="rs2-svg" role="img" aria-label="" xmlns="' + NS + '"><defs></defs><g class="rs2-static"></g><g class="rs2-dyn"></g><g class="rs2-labs"></g></svg>';
    stage.appendChild(scene);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', scene.id); });
    var svg = scene.querySelector('svg'), defs = svg.querySelector('defs'), gS = svg.querySelector('.rs2-static'), gD = svg.querySelector('.rs2-dyn'), gL = svg.querySelector('.rs2-labs');
    var layer = K.layer(scene);
    // the four sums: a quiet switch in tab 1, the main control in tab 2
    var seg = el('div', 'rs2-seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Kind of sum');
    seg.innerHTML = R.KINDS.map(function(k){ return '<button type="button" data-k="' + k + '" aria-pressed="false">' + R.SHORT[k] + '</button>'; }).join('');
    layer.el.appendChild(seg);
    var lines = el('div', 'rs2-lines'), cause = K.cause({ label: 'Why' });
    lines.appendChild(cause.el);
    var fillO = { min: -0.5, max: 4, speed: function(v){ return v < 0 ? 1.4 : Math.max(1, fillO.max / 3.2); },
      labels: { play: 'Fill one by one', pause: 'Pause', again: 'Fill again', rest: 'Fill one by one' },
      get: function(){ return S.fill == null ? -0.5 : S.fill; }, set: function(v){ S.fill = v; kick(); }, before: function(){ return fillStart(); }, onEnd: function(){ fillEnd(); } };
    var fillP = K.player(fillO);
    fillP.el.classList.add('is-sm');
    lines.appendChild(fillP.el);
    stage.appendChild(lines);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    /* ---------------------------------------------------- the curve or the table */
    function curveOf(x){
      var it = x.it, c = { type: x.type, it: it, name: it.name };
      if(x.type === 'fn') c.nm = { f: 'f', v: 'x', amt: '', amtA: '', rateA: '', varA: '' };
      else c.nm = { f: it.rate || 'r', v: it.var || 't', amt: it.amtUnit, amtA: it.amtAbbr || ab(it.amtUnit), rateA: ab(it.rateUnit), varA: ab(it.varUnit), rateU: it.rateUnit, varU: it.varUnit };
      if(x.type === 'table'){ c.xs = it.xs; c.ys = it.ys; c.a = it.xs[0]; c.b = it.xs[it.xs.length - 1]; c.f = null; c.exact = null; c.shape = { inc: null, conc: null }; c.midOk = R.midOk(it.xs); c.trend = it.trend ? M.integral(M.fn(it.trend), c.a, c.b) : null; }
      else { c.f = M.fn(it.fn); c.a = it.a; c.b = it.b; c.exact = M.integral(c.f, c.a, c.b); c.shape = R.shape(c.f, c.a, c.b); c.midOk = true; }
      // the plot's heights: the curve (or the data) and 0
      var vals = [0];
      if(c.f){ for(var i = 0; i <= 240; i++) vals.push(c.f(c.a + (c.b - c.a) * i / 240)); } else vals = vals.concat(c.ys);
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), sp = hi - lo || 1;
      c.y = [lo < 0 ? lo - sp * 0.07 : 0, hi + sp * 0.1];
      // the tank's scale: every running total any sum could reach (every kind, 1 to 100 strips), so the tank never rescales
      var tlo = 0, thi = c.exact || 0;
      R.KINDS.forEach(function(k){
        for(var n = 1; n <= (c.f ? 100 : 1); n++){
          var ps = c.f ? R.pieces(c.f, R.partition(c.a, c.b, n), k) : R.tablePieces(c.xs, c.ys, k), run = 0;
          ps.forEach(function(p){ run += p.area; if(run < tlo) tlo = run; if(run > thi) thi = run; });
        }
      });
      var tsp = thi - tlo || 1;
      c.tank = [tlo < 0 ? tlo - tsp * 0.05 : 0, thi + tsp * 0.06];
      var big = Math.max(Math.abs(c.tank[0]), Math.abs(c.tank[1]));
      c.dec = big >= 100 ? 1 : big >= 10 ? 2 : 3;
      return c;
    }
    function piecesFor(n, kind){ return D.f ? R.pieces(D.f, R.partition(D.a, D.b, n), kind) : R.tablePieces(D.xs, D.ys, kind); }
    function amt(v){ return fix(v, D.dec) + (D.nm.amtA ? ' ' + D.nm.amtA : ''); }
    function intText(){
      var a = scr(String(D.a), SUB), b = scr(String(D.b), SUP), nm = D.nm;
      var body = nm.f + '(' + nm.v + ') d' + nm.v;
      if(D.it.piX) return '∫ ' + body + ' from 0 to ' + piT(D.b);
      return a && b ? '∫' + a + b + ' ' + body : '∫ ' + body + ' from ' + mn(D.a) + ' to ' + mn(D.b);
    }

    /* ---------------------------------------------------- geometry (picture units = CSS px) */
    function geo(W, H){
      var g = { W: W, H: H, narrow: W < 600 };
      var segW = seg.offsetWidth || 300, segH = seg.offsetHeight || 36;
      g.segW = segW; g.segH = segH;
      g.tankW = g.narrow ? clamp(W * 0.18, 62, 86) : clamp(W * 0.13, 110, 180);
      g.TX1 = W - (g.narrow ? 8 : 16); g.TX0 = g.TX1 - g.tankW;
      g.segX = g.narrow ? Math.round((W - segW) / 2) : 14; g.segY = 8;
      if(g.narrow){ g.railY = g.segY + segH + 23; g.band = g.railY + 20; g.rx0 = 44; g.rx1 = W - 64; }
      else { g.railY = g.segY + segH / 2; g.band = g.segY + segH + 10; g.rx0 = g.segX + segW + 70; g.rx1 = g.TX0 - 60; }
      g.L = g.narrow ? 46 : 58; g.R = g.TX0 - (g.narrow ? 12 : 26);
      g.T = g.band + (g.narrow ? 26 : 30); g.B = H - (g.narrow ? 42 : 44);
      var pad = (D.b - D.a) * 0.03;
      g.x = [D.a - pad, D.b + pad]; g.y = D.y;
      g.sx = function(x){ return g.L + (x - g.x[0]) / (g.x[1] - g.x[0]) * (g.R - g.L); };
      g.ix = function(X){ return g.x[0] + (X - g.L) / (g.R - g.L) * (g.x[1] - g.x[0]); };
      g.sy = function(y){ return g.B - (y - g.y[0]) / (g.y[1] - g.y[0]) * (g.B - g.T); };
      g.y0 = g.sy(0);
      // the tank: glass from T to B, its scale the curve's tank range
      g.tT = g.T + 6; g.tB = g.B; g.spY = g.tT + 14;
      g.ty = function(v){ return g.tB - 6 - (v - D.tank[0]) / (D.tank[1] - D.tank[0]) * (g.tB - g.tT - 12); };
      return g;
    }
    function railX(n){ return G.rx0 + Math.log(n) / Math.log(100) * (G.rx1 - G.rx0); }
    function railN(X){ return clamp(Math.round(Math.pow(100, clamp((X - G.rx0) / (G.rx1 - G.rx0), 0, 1))), 1, 100); }

    /* ---------------------------------------------------- the static picture: ground, grid, axes, ticks, rail, tank glass */
    var boxes0 = [];
    function niceStep(span, n){ var s = span / n, p = Math.pow(10, Math.floor(Math.log10(s))), m = s / p; return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p; }
    function tw(t, size){ return String(t).length * size * 0.6 + 4; }
    function drawStatic(){
      var g = G, h = [], W = g.W, H = g.H, nm = D.nm;
      boxes0 = [];
      defs.innerHTML = '<linearGradient id="' + id + '-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="rs2s-sky0"/><stop offset="1" class="rs2s-sky1"/></linearGradient>' +
        '<linearGradient id="' + id + '-wat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="rs2s-w0"/><stop offset="1" class="rs2s-w1"/></linearGradient>' +
        '<linearGradient id="' + id + '-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="rs2s-g0"/><stop offset=".45" class="rs2s-g1"/><stop offset="1" class="rs2s-g0"/></linearGradient>' +
        '<clipPath id="' + id + '-up"><rect x="0" y="0" width="' + W + '" height="' + r1(g.y0) + '"/></clipPath>' +
        '<clipPath id="' + id + '-dn"><rect x="0" y="' + r1(g.y0) + '" width="' + W + '" height="' + r1(H - g.y0) + '"/></clipPath>' +
        '<clipPath id="' + id + '-cb"><path/></clipPath><clipPath id="' + id + '-ca"><path/></clipPath>' +
        '<clipPath id="' + id + '-tk"><rect x="' + r1(g.TX0 + 5) + '" y="' + r1(g.tT) + '" width="' + r1(g.tankW - 10) + '" height="' + r1(g.tB - g.tT - 4) + '" rx="6"/></clipPath>';
      h.push('<rect class="rs2-bg" x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#' + id + '-sky)"/>');
      h.push('<rect class="rs2-band" x="0" y="0" width="' + W + '" height="' + r1(g.band) + '"/>');
      // grid and ticks
      var xt = [], yt = [];
      if(isT()) xt = D.xs.map(function(x){ return { v: x, t: mn(x) }; });
      else if(D.it.piX) xt = [0, 1, 2, 3, 4].filter(function(k){ return k * Math.PI / 2 <= D.b + 1e-9; }).map(function(k){ return { v: k * Math.PI / 2, t: piT(k * Math.PI / 2) }; });
      else { var st = niceStep(D.b - D.a, g.narrow ? 4 : 8); for(var x = Math.ceil(D.a / st - 1e-9) * st; x <= D.b + 1e-9; x += st) xt.push({ v: x, t: mn(+x.toFixed(6)) }); }
      var ys = niceStep(g.y[1] - g.y[0], g.narrow ? 4 : 6);
      for(var y = Math.ceil(g.y[0] / ys - 1e-9) * ys; y <= g.y[1] + 1e-9; y += ys) yt.push({ v: y, t: mn(+y.toFixed(6)) });
      h.push('<g class="rs2-grid">' + xt.map(function(t){ var X = r1(g.sx(t.v)); return '<line x1="' + X + '" x2="' + X + '" y1="' + r1(g.T) + '" y2="' + r1(g.B) + '"/>'; }).join('') +
        yt.map(function(t){ var Y = r1(g.sy(t.v)); return '<line x1="' + r1(g.L) + '" x2="' + r1(g.R) + '" y1="' + Y + '" y2="' + Y + '"/>'; }).join('') + '</g>');
      // the ground under the plot (the columns stand on the axis)
      h.push('<rect class="rs2-plotbg" x="' + r1(g.L) + '" y="' + r1(g.T) + '" width="' + r1(g.R - g.L) + '" height="' + r1(g.B - g.T) + '"/>');
      // the x axis title at the right end, the ticks clear of it
      var xTitle = nm.v + (nm.varA ? ' (' + nm.varA + ')' : ''), xtW = tw(xTitle, 12.5), xtY = g.B + 34;
      boxes0.push([g.R - xtW, xtY - 13, g.R + 2, xtY + 4]);
      h.push('<text class="rs2-title" x="' + r1(g.R) + '" y="' + r1(xtY) + '" text-anchor="end">' + esc(xTitle) + '</text>');
      var tk = [];
      xt.forEach(function(t){ var X = g.sx(t.v), w = tw(t.t, 11.5), b = [X - w / 2, g.B + 5, X + w / 2, g.B + 20];
        if(tk.some(function(q){ return !(b[2] + 4 < q[0] || b[0] - 4 > q[2]); })) return;
        tk.push(b); boxes0.push(b); h.push('<text class="rs2-tick" x="' + r1(X) + '" y="' + r1(g.B + 17) + '" text-anchor="middle">' + esc(t.t) + '</text>'); });
      yt.forEach(function(t){ var Y = g.sy(t.v); if(Y < g.T + 6 || Y > g.B - 2 && t.v !== 0) return; var b = [g.L - 6 - tw(t.t, 11.5), Y - 8, g.L - 2, Y + 7]; boxes0.push(b);
        h.push('<text class="rs2-tick" x="' + r1(g.L - 6) + '" y="' + r1(Y + 4) + '" text-anchor="end">' + esc(t.t) + '</text>'); });
      // the y axis title, turned, at the left edge
      var yTitle = nm.f + '(' + nm.v + ')' + (nm.rateA ? ' (' + nm.rateA + ')' : ''), yc = (g.T + g.B) / 2;
      h.push('<text class="rs2-title" transform="translate(' + (g.narrow ? 15 : 18) + ' ' + r1(yc) + ') rotate(-90)" text-anchor="middle">' + esc(yTitle) + '</text>');
      boxes0.push([2, yc - tw(yTitle, 12.5) / 2, (g.narrow ? 15 : 18) + 4, yc + tw(yTitle, 12.5) / 2]);
      // axes
      h.push('<g class="rs2-axis"><line x1="' + r1(g.L) + '" x2="' + r1(g.L) + '" y1="' + r1(g.T) + '" y2="' + r1(g.B) + '"/><line x1="' + r1(g.L) + '" x2="' + r1(g.R) + '" y1="' + r1(g.y0) + '" y2="' + r1(g.y0) + '"/></g>');
      // the rail: a groove with faint ticks at 1, 2, 5, 10, 20, 50, 100 (the knob is the kit's), or the table's note
      if(!isT()){
        h.push('<g class="rs2-rail"><line class="rs2-groove" x1="' + r1(g.rx0) + '" x2="' + r1(g.rx1) + '" y1="' + r1(g.railY) + '" y2="' + r1(g.railY) + '"/>' +
          [1, 2, 5, 10, 20, 50, 100].map(function(n){ var X = r1(railX(n)); return '<line class="rs2-rtk" x1="' + X + '" x2="' + X + '" y1="' + r1(g.railY - 5) + '" y2="' + r1(g.railY + 5) + '"/>'; }).join('') +
          '<text class="rs2-rlab" x="' + r1(g.rx0 - 28) + '" y="' + r1(g.railY + 4) + '" text-anchor="end">1</text><text class="rs2-rlab" x="' + r1(g.rx1 + 28) + '" y="' + r1(g.railY + 4) + '">100</text></g>');
      } else {
        h.push('<text class="rs2-tnote" x="' + r1(g.narrow ? W / 2 : (g.rx0 + g.rx1) / 2) + '" y="' + r1(g.railY + 4) + '" text-anchor="middle">The table sets the strips: ' + (D.xs.length - 1) + ' widths</text>');
      }
      // the tank's glass and its foot
      var tks = '', tst = niceStep(D.tank[1] - D.tank[0], 2);
      for(var ti = 1; ti < 10; ti++){ var Yk = r1(g.tT + (g.tB - 4 - g.tT) * ti / 10); tks += 'M' + r1(g.TX1 - 5) + ' ' + Yk + 'h-6'; }
      // numbered marks (0, then every nice step), so the level can be read without its label
      G.tmarks = [];
      for(var tv = Math.ceil(D.tank[0] / tst - 1e-9) * tst; tv <= D.tank[1] + 1e-9; tv += tst){ var Yv = g.ty(tv); if(Yv < g.tT + 8) continue; G.tmarks.push({ v: tv, y: Yv, t: mn(+tv.toPrecision(6)) }); tks += 'M' + r1(g.TX1 - 5) + ' ' + r1(Yv) + 'h-14'; }
      h.push('<g class="rs2-tank"><rect class="rs2-tank-in" x="' + r1(g.TX0 + 5) + '" y="' + r1(g.tT) + '" width="' + r1(g.tankW - 10) + '" height="' + r1(g.tB - g.tT - 4) + '" rx="6"/>' +
        '<path class="rs2-tank-tk" d="' + tks + '"/>' +
        '<rect class="rs2-tank-foot" x="' + r1(g.TX0 - 2) + '" y="' + r1(g.tB - 4) + '" width="' + r1(g.tankW + 4) + '" height="6" rx="3"/>' +
        // the spout through the left wall (where the columns pour in) and the tap at the foot (where it drains)
        '<path class="rs2-spout" d="M' + r1(g.TX0 - (g.narrow ? 8 : 14)) + ' ' + r1(g.spY) + 'H' + r1(g.TX0 + 16) + '"/>' +
        '<path class="rs2-spout" d="M' + r1(g.TX1 - 6) + ' ' + r1(g.tB - 12) + 'H' + r1(g.TX1 + 4) + '"/></g>');
      gS.innerHTML = h.join('');
      // the curve as pixel points (every 2 px), and the regions above and below it (the slivers are these, clipped)
      G.curve = null;
      if(D.f){
        var pts = [], N = Math.max(40, Math.round((g.sx(D.b) - g.sx(D.a)) / 2));
        for(var i = 0; i <= N; i++){ var xv = D.a + (D.b - D.a) * i / N; pts.push([g.sx(xv), g.sy(D.f(xv)), xv]); }
        G.curve = pts;
        var line = pts.map(function(p){ return r1(p[0]) + ' ' + r1(p[1]); }).join('L');
        G.curveD = 'M' + line;
        G.aboveD = 'M' + line + 'L' + r1(pts[pts.length - 1][0]) + ' ' + r1(g.T - 40) + 'L' + r1(pts[0][0]) + ' ' + r1(g.T - 40) + 'Z';
        G.belowD = 'M' + line + 'L' + r1(pts[pts.length - 1][0]) + ' ' + r1(g.B + 40) + 'L' + r1(pts[0][0]) + ' ' + r1(g.B + 40) + 'Z';
      }
      buildDyn();
    }
    /* the moving layer: built once per layout, then only attributes change each frame */
    var dyn = {};
    function buildDyn(){
      var parts = [['glass', 'path', 'rs2-glass', 'up'], ['glass-neg', 'path', 'rs2-glass is-neg', 'dn'], ['water', 'path', 'rs2-water', 'up'], ['water-neg', 'path', 'rs2-water is-neg', 'dn'],
        ['shine', 'path', 'rs2-shine', 'up'], ['men', 'path', 'rs2-men', 'up'], ['sl-extra', 'path', 'rs2-sl is-extra', 'cb'], ['sl-miss', 'path', 'rs2-sl is-miss', 'ca'], ['walls-from', 'path', 'rs2-walls'], ['walls', 'path', 'rs2-walls'], ['btk', 'path', 'rs2-btk'],
        ['tops', 'path', 'rs2-tops'], ['sel', 'path', 'rs2-selp'], ['curve', 'path', 'rs2-curve'], ['dots', 'g', 'rs2-dots'], ['pour', 'path', 'rs2-pour'],
        ['tw', 'rect', 'rs2-tw', 'tk'], ['tw-top', 'path', 'rs2-tw-top', 'tk'], ['start', 'line', 'rs2-start'], ['exact', 'line', 'rs2-exact'], ['drain', 'path', 'rs2-drain'], ['tank-glint', 'path', 'rs2-tank-glint'], ['tank-rim', 'rect', 'rs2-tank-rim']];
      gD.innerHTML = parts.map(function(p){ return '<' + p[1] + ' data-k="' + p[0] + '" class="' + p[2] + '"' + (p[3] ? ' clip-path="url(#' + id + '-' + p[3] + ')"' : '') + (p[1] === 'g' ? '></g>' : '/>'); }).join('');
      parts.forEach(function(p){ dyn[p[0]] = gD.querySelector('[data-k="' + p[0] + '"]'); });
      dyn.water.setAttribute('fill', 'url(#' + id + '-wat)'); dyn.tw.setAttribute('fill', 'url(#' + id + '-wat)');
      var rim = dyn['tank-rim']; rim.setAttribute('rx', '7');
      dyn['tank-glint'].setAttribute('d', 'M' + r1(G.TX0 + 12) + ' ' + r1(G.tT + 12) + 'V' + r1(G.tB - 16));
      rim.setAttribute('x', r1(G.TX0 + 2)); rim.setAttribute('y', r1(G.tT - 3)); rim.setAttribute('width', r1(G.tankW - 4)); rim.setAttribute('height', r1(G.tB - G.tT + 1));
      dyn.cb = defs.querySelector('#' + id + '-cb path'); dyn.ca = defs.querySelector('#' + id + '-ca path');
      dyn.curve.setAttribute('d', G.curveD || '');
      dyn['sl-extra'].setAttribute('d', G.aboveD || ''); dyn['sl-miss'].setAttribute('d', G.belowD || '');
      dyn.dots.innerHTML = isT() ? D.xs.map(function(x, i){ return '<circle class="rs2-dot" cx="' + r1(G.sx(x)) + '" cy="' + r1(G.sy(D.ys[i])) + '" r="4.5"/>'; }).join('') : '';
      var tx = G.TX0 + G.tankW / 2;
      ['start', 'exact'].forEach(function(k){ dyn[k].setAttribute('x1', r1(G.TX0 + 5)); dyn[k].setAttribute('x2', r1(G.TX1 - 5)); });
      var ey = D.exact == null ? null : G.ty(D.exact), sy0 = G.ty(0);
      dyn.exact.setAttribute('y1', ey == null ? -99 : r1(ey)); dyn.exact.setAttribute('y2', ey == null ? -99 : r1(ey)); dyn.exact.style.display = ey == null ? 'none' : '';
      dyn.start.setAttribute('y1', r1(sy0)); dyn.start.setAttribute('y2', r1(sy0)); dyn.start.style.display = D.tank[0] < 0 ? '' : 'none';
      void tx;
      gL.innerHTML = '';
      labs = {};
    }

    /* ---------------------------------------------------- labels on the picture (placed clear of each other) */
    var labs = {}, boxes = [];
    function hitB(b, q){ return !(b[2] <= q[0] || b[0] >= q[2] || b[3] <= q[1] || b[1] >= q[3]); }
    function lab(key, text, cls, cands, size, keep){
      var e = labs[key];
      if(!e){ e = document.createElementNS(NS, 'text'); e.setAttribute('class', 'rs2-lab ' + cls); gL.appendChild(e); labs[key] = e; }
      if(text == null){ e.style.display = 'none'; return null; }
      var w = tw(text, size || 13), hh = (size || 13) + 2;
      for(var i = 0; i < cands.length; i++){
        var c = cands[i], an = c[2] || 'middle', x0 = an === 'middle' ? c[0] - w / 2 : an === 'end' ? c[0] - w : c[0];
        var b = [x0 - 2, c[1] - hh + 3, x0 + w + 2, c[1] + 4];
        if(!keep && (b[0] < 2 || b[2] > G.W - 2 || b[1] < 2 || b[3] > G.H - 2)) continue;
        var bb = [b[0] - 8, b[1] - 7, b[2] + 8, b[3] + 7];
        if(!keep && boxes.some(function(q){ return hitB(bb, q); })) continue;
        boxes.push(b);
        if(e.textContent !== text) e.textContent = text;
        e.setAttribute('x', r1(c[0])); e.setAttribute('y', r1(c[1])); e.setAttribute('text-anchor', an); e.style.display = '';
        return b;
      }
      e.style.display = 'none';
      return null;
    }

    /* ---------------------------------------------------- the target strips and the blend toward them */
    function target(animate){
      var ps = piecesFor(nOf(), S.kind), P = profOf(ps, S.kind), walls = ps.length ? [ps[0].x0].concat(ps.map(function(p){ return p.x1; })) : [];
      if(animate && S.to && S.drawn && !K.reduced()){
        var from = S.drawn.P;
        if(from.length > 420) from = S.to;   // a fast drag: start from the last strips, not a blend of many
        S.from = from; S.wFrom = S.wTo; S.e = 0;
      } else { S.from = null; S.e = 1; if(animate && S.to && K.reduced()) fade(); }
      S.to = P; S.wTo = walls; S.ps = ps; S.sel = -1;
      if(G) draw();
      kick();
    }
    function ease(t){ return 1 - Math.pow(1 - t, 3); }

    /* ---------------------------------------------------- draw one frame from the state */
    function pathOf(P, close){
      var g = G, s = 'M' + r1(g.sx(P[0][0])) + ' ' + r1(close ? g.y0 : g.sy(P[0][1]));
      for(var i = close ? 0 : 1; i < P.length; i++) s += 'L' + r1(g.sx(P[i][0])) + ' ' + r1(g.sy(P[i][1]));
      if(close) s += 'L' + r1(g.sx(P[P.length - 1][0])) + ' ' + r1(g.y0) + 'Z';
      return s;
    }
    function wallsD(xs, sg, alpha){
      if(alpha <= 0.01 || !xs.length) return '';
      var g = G, s = '';
      xs.forEach(function(x, i){
        var yl = i ? valAt(sg, x, -1) : 0, yr = i < xs.length - 1 ? valAt(sg, x, 1) : 0, top = Math.abs(yl) > Math.abs(yr) ? yl : yr;
        if(Math.abs(top) < 1e-12) return;
        s += 'M' + r1(g.sx(x)) + ' ' + r1(g.y0) + 'V' + r1(g.sy(top));
      });
      return s;
    }
    function wallAlpha(xs){ if(xs.length < 2) return 1; var px = (G.sx(xs[xs.length - 1]) - G.sx(xs[0])) / (xs.length - 1); return clamp((px - 3) / 7, 0, 1); }
    function draw(){
      if(!G || !S.to) return;
      var g = G, e = S.from ? ease(S.e) : 1, P = S.from ? blend(S.from, S.to, e) : S.to, sg = segsOf(P), total = areaOf(P);
      boxes = boxes0.slice();
      // the water: full columns, or (Fill one by one) what is left in each after pouring
      var water = P, inTank = total, pourK = -1;
      if(S.fill != null && !S.from){
        var v = S.fill, N = S.ps.length;
        if(v < 0){ inTank = total * (-v / 0.5); }
        else {
          var k = Math.floor(v), p = v - k;
          water = []; S.ps.forEach(function(q, i){ var f = i < k ? 0 : i === k ? 1 - p : 1, a = S.kind === 'trap' ? q.h0 : q.h, b = S.kind === 'trap' ? q.h1 : q.h; water.push([q.x0, a * f], [q.x1, b * f]); });
          inTank = total - areaOf(water);
          if(k < N && p > 0) pourK = k;
        }
      } else if(S.refill < 1){ water = P.map(function(q){ return [q[0], q[1] * S.refill]; }); }
      var wd = pathOf(water, true), gd = pathOf(P, true);
      dyn.water.setAttribute('d', wd); dyn['water-neg'].setAttribute('d', wd);
      dyn.glass.setAttribute('d', gd); dyn['glass-neg'].setAttribute('d', gd);
      dyn.tops.setAttribute('d', pathOf(P, false));
      // walls: the new strips' walls come in as the old ones go (they fade when the strips get thinner than a few px)
      var aT = wallAlpha(S.wTo) * e, aF = S.from ? wallAlpha(S.wFrom) * (1 - e) : 0;
      dyn.walls.setAttribute('d', wallsD(S.wTo, sg, aT)); dyn.walls.style.opacity = r1(aT * 10) / 10;
      dyn['walls-from'].setAttribute('d', wallsD(S.wFrom, sg, aF)); dyn['walls-from'].style.opacity = r1(aF * 10) / 10;
      // a glint of light down the inside of each glass column (only while the columns are wide enough to show it)
      var sh = '', aS = wallAlpha(S.wTo) * e;
      if(aS > 0.05) S.ps.forEach(function(q){ var top = S.kind === 'trap' ? q.h0 : q.h, X = g.sx(q.x0) + Math.min(5, (g.sx(q.x1) - g.sx(q.x0)) * 0.12), Yt = g.sy(top);
        if(top > 0 && g.y0 - Yt > 14) sh += 'M' + r1(X) + ' ' + r1(g.y0 - 4) + 'V' + r1(Yt + 5); });
      dyn.shine.setAttribute('d', sh); dyn.shine.style.opacity = r1(aS * 10) / 10;
      var mz = '';
      if(aS > 0.05 && S.fill == null) S.ps.forEach(function(q){ var a = S.kind === 'trap' ? q.h0 : q.h, b = S.kind === 'trap' ? q.h1 : q.h, X0 = g.sx(q.x0) + 3, X1 = g.sx(q.x1) - 3;
        if(a > 0 && b > 0 && X1 - X0 > 6 && g.y0 - g.sy(Math.max(a, b)) > 12) mz += 'M' + r1(X0) + ' ' + r1(g.sy(a) + 3.5) + 'L' + r1(X1) + ' ' + r1(g.sy(b) + 3.5); });
      dyn.men.setAttribute('d', mz); dyn.men.style.opacity = r1(aS * 10) / 10;
      // thin strips: a small tick on the axis at every wall (the strips are still there)
      var bt = '';
      if(wallAlpha(S.wTo) < 1 && e > 0.5) S.wTo.forEach(function(x){ bt += 'M' + r1(g.sx(x)) + ' ' + r1(g.y0 - 3) + 'v6'; });
      dyn.btk.setAttribute('d', bt);
      // the slivers: between the tops and the curve (extra where the tops are above it, missed where below)
      var sl = null;
      if(D.f){
        var tp = 'M' + r1(g.sx(P[0][0])) + ' ' + r1(g.sy(P[0][1]));
        for(var i = 1; i < P.length; i++) tp += 'L' + r1(g.sx(P[i][0])) + ' ' + r1(g.sy(P[i][1]));
        var xa = r1(g.sx(P[0][0])), xb = r1(g.sx(P[P.length - 1][0]));
        dyn.cb.setAttribute('d', tp + 'L' + xb + ' ' + r1(g.B + 40) + 'L' + xa + ' ' + r1(g.B + 40) + 'Z');
        dyn.ca.setAttribute('d', tp + 'L' + xb + ' ' + r1(g.T - 40) + 'L' + xa + ' ' + r1(g.T - 40) + 'Z');
        sl = sliverInfo(sg);
      }
      // the selected strip (a tap): its outline
      var sp = S.sel >= 0 && !S.from && S.ps[S.sel] ? S.ps[S.sel] : null;
      dyn.sel.setAttribute('d', sp ? pathOf(profOf([sp], S.kind), true) : '');
      // the pour: a stream from the column being poured into the tank's mouth
      // a column pouring in: a short solid stream from the spout in the tank's wall down to the water (never over the
      // plot); a negative column, or the tank emptying before a fill, runs out of the tap at the tank's foot
      var negPour = false;
      if(pourK >= 0){
        var q = S.ps[pourK], hy = S.kind === 'trap' ? (q.h0 + q.h1) / 2 : q.h;
        negPour = q.area < 0;
        dyn.pour.setAttribute('d', negPour ? '' : 'M' + r1(g.TX0 + 16) + ' ' + r1(g.spY + 3) + 'V' + r1(Math.max(g.spY + 6, g.ty(inTank))));
        void hy;
      } else dyn.pour.setAttribute('d', '');
      var draining = negPour || (S.fill != null && S.fill < 0 && S.fill > -0.5);
      dyn.drain.setAttribute('d', draining ? 'M' + r1(g.TX1 + 3) + ' ' + r1(g.tB - 9) + 'v' + r1(Math.max(4, Math.min(14, g.H - g.tB - 2))) : '');
      // the tank's water
      var ly = clamp(g.ty(inTank), g.tT, g.tB - 4), base = g.tB - 4;
      dyn.tw.setAttribute('x', r1(g.TX0 + 5)); dyn.tw.setAttribute('width', r1(g.tankW - 10));
      dyn.tw.setAttribute('y', r1(ly)); dyn.tw.setAttribute('height', r1(Math.max(0, base - ly)));
      var ww = (g.tankW - 10) / 4, wv = 'M' + r1(g.TX0 + 5) + ' ' + r1(ly);
      for(var wi = 0; wi < 4; wi++) wv += 'q' + r1(ww / 2) + ' ' + (wi % 2 ? 2.2 : -2.2) + ' ' + r1(ww) + ' 0';
      dyn['tw-top'].setAttribute('d', wv);
      S.drawn = { P: P, total: total, inTank: inTank, sl: sl, ly: ly };
      labels(P, sg, sl, inTank);
      words();
      if(knob) knob.place();
    }
    /* where the tops are above (extra) or below (missed) the curve, from the drawn pixels: the biggest of each */
    function sliverInfo(sg){
      var c = G.curve, best = { x: null, h: 0 }, bestM = { x: null, h: 0 }, ex = 0, mi = 0, st = S.from ? 3 : 1;
      for(var i = 0; i < c.length; i += st){
        var Yt = G.sy(valAt(sg, c[i][2], i ? -1 : 1)), d = c[i][1] - Yt;   // > 0: the top is above the curve on screen (extra)
        if(d > 0.6){ ex += d * st; if(d > best.h) best = { X: c[i][0], h: d, y: (c[i][1] + Yt) / 2 }; }
        else if(d < -0.6){ mi -= d * st; if(-d > bestM.h) bestM = { X: c[i][0], h: -d, y: (c[i][1] + Yt) / 2 }; }
      }
      return { extra: best, miss: bestM, exA: ex, miA: mi };
    }
    function labels(P, sg, sl, inTank){
      var g = G, nm = D.nm, cl = [];
      // the controls on the picture keep their room (from the geometry, so a frame never waits for a layout read)
      cl.push([g.segX - 3, g.segY - 3, g.segX + g.segW + 3, g.segY + g.segH + 3]);
      if(knob && !knob.el.hidden){
        var n = nOf(), kx = railX(n), ky = g.railY, t = tagOf(n), twd = tw(t, 13) + 18;
        cl.push([kx - 25, ky - 25, kx + 25, ky + 25]);
        if(t) cl.push(railX(n) - g.rx0 > 96 ? [kx - 28 - twd, ky - 13, kx - 24, ky + 13] : [kx + 24, ky - 13, kx + 28 + twd, ky + 13]);
      }
      if(ctlBoxes) cl = cl.concat(ctlBoxes);
      boxes = boxes.concat(cl);
      // the tank: its amount above it, and "exact" (and "start" when the tank can drain below where it began)
      var tx = g.TX0 + g.tankW / 2;
      lab('tank', amt(inTank), 'rs2-cink rs2-big', [[tx, g.tT - 10]], 13.5, true);
      if(D.exact != null){ var ey = g.ty(D.exact), ly = S.drawn.ly; lab('exact', 'exact', 'rs2-cex', [[g.TX1 - 8, ey - 5, 'end'], [g.TX1 - 8, ey + 15, 'end']].filter(function(c){ return Math.abs(c[1] - 4 - ly) > 12; }), 11.5); }
      else lab('exact', null);
      (g.tmarks || []).forEach(function(m, i){ lab('tm' + i, m.t, 'rs2-cmut', [[g.TX1 - 22, m.y + 4, 'end']], 11.5); });
      if(D.tank[0] < 0){ var s0 = g.ty(0); lab('start', 'start', 'rs2-cmut', [[g.TX0 + 9, s0 + 14, 'start'], [g.TX0 + 9, s0 - 5, 'start']], 11.5); } else lab('start', null);
      // the curve's name
      if(G.curve){
        var cc = [], c = G.curve;
        [0.9, 0.12, 0.5, 0.7, 0.3].forEach(function(t){ var p = c[Math.round(t * (c.length - 1))]; cc.push([p[0], p[1] - 12], [p[0], p[1] + 22]); });
        lab('curve', nm.f + '(' + nm.v + ')', 'rs2-ccur', cc, 13.5);
      } else lab('curve', null);
      // the slivers' names on the biggest of each (only when one is tall enough to hold its name next to it)
      var tab2 = S.tab === 'ou';
      if(sl && sl.extra.h > 5 && S.e >= 1){ var b1 = sl.extra; lab('extra', 'extra', 'rs2-cextra', [[b1.X, b1.y - b1.h / 2 - 6], [b1.X, b1.y + b1.h / 2 + 16], [b1.X + 8, b1.y + 4, 'start'], [b1.X - 8, b1.y + 4, 'end']], 12.5); } else lab('extra', null);
      if(sl && sl.miss.h > 5 && S.e >= 1){ var b2 = sl.miss; lab('miss', 'missed', 'rs2-cmiss', [[b2.X, b2.y - b2.h / 2 - 6], [b2.X, b2.y + b2.h / 2 + 16], [b2.X + 8, b2.y + 4, 'start'], [b2.X - 8, b2.y + 4, 'end']], 12.5); } else lab('miss', null);
      void tab2;
      // a column below the axis counts as negative: say so on the biggest one
      var neg = null;
      if(S.e >= 1) S.ps.forEach(function(q){ var hh = S.kind === 'trap' ? Math.min(q.h0, q.h1) : q.h; if(hh < 0 && (!neg || hh < neg.h)) neg = { x: (q.x0 + q.x1) / 2, h: hh }; });
      if(neg && g.sy(neg.h) - g.y0 > 24) lab('neg', 'counts as negative', 'rs2-cneg', [[g.sx(neg.x), g.sy(neg.h) + 16], [g.sx(neg.x), g.y0 + 16]], 12);
      else lab('neg', null);
    }

    /* ---------------------------------------------------- the words: cause line, takeaway, knob tag, screen reader */
    function kindWord(){ return { left: 'left sum', right: 'right sum', mid: 'midpoint sum', trap: 'trapezoid sum' }[S.kind]; }
    function errParts(sum, phone){
      if(D.exact == null) return [];
      var err = sum - D.exact, scale = Math.max(1, Math.abs(D.tank[1] - D.tank[0]));
      if(Math.abs(err) < 1e-9 * scale) return [{ t: 'equal to exact', role: 'ex' }];
      var by = Math.abs(err) >= 0.5 * Math.pow(10, -D.dec) ? fix(Math.abs(err), D.dec) : sig2(Math.abs(err));
      by += D.nm.amtA ? ' ' + D.nm.amtA : '';
      return [{ t: (err > 0 ? 'over by ' : 'under by ') + by, role: err > 0 ? 'extra' : 'miss', say: (err > 0 ? 'over by ' : 'under by ') + by }];
    }
    var wKey = '';
    function words(){
      var Dr = S.drawn, phone = G.narrow, nm = D.nm, n = S.ps.length, parts = [], key;
      if(S.took && !S.from && (S.fill == null || S.fill >= S.ps.length - 1e-9)){ key = 'take|' + S.took; if(key !== wKey){ wKey = key; cause.take(S.took); } }
      else {
        if(S.fill != null && !S.from){
          var v = S.fill, k = clamp(Math.floor(v) + (v - Math.floor(v) > 0.999 ? 1 : 0), 0, n);
          parts = v < 0 ? [{ t: 'emptying the tank', role: 'n' }, { t: amt(Dr.inTank) + ' left', role: 'sum' }]
            : [{ t: (phone ? '' : 'poured ') + Math.min(n, Math.floor(v + 1e-9)) + ' of ' + n + (phone ? ' poured' : ' columns'), role: 'n' }, { t: (phone ? '' : 'tank ') + amt(Dr.inTank), role: 'sum' }];
          void k;
        } else if(S.sel >= 0 && S.ps[S.sel] && !S.from){
          var p = S.ps[S.sel], w = fix(p.w, 3).replace(/\.?0+$/, '');
          var term = S.kind === 'trap' ? w + ' × (' + fix(p.h0, D.dec) + ' + ' + fix(p.h1, D.dec) + ') ÷ 2' : (phone ? w + ' × ' + fix(p.h, D.dec) : w + ' × ' + nm.f + '(' + mn(+p.at.toFixed(4)) + ')');
          parts = [{ t: 'strip ' + (S.sel + 1) + (phone ? '' : ' of ' + n), role: 'n' }, { t: term, role: 'ink' }, { t: '= ' + amt(p.area), role: p.area < 0 ? 'neg' : 'sum' }];
        } else if(S.tab === 'n' || isT()){
          parts = [{ t: n + (n === 1 ? ' strip' : ' strips'), role: 'n' }, { t: (phone ? S.kind === 'mid' ? 'midpoint' : S.kind === 'trap' ? 'trapezoid' : S.kind : kindWord()) + ' ' + amt(Dr.total), role: 'sum' }];
          if(D.exact != null) parts.push({ t: 'exact ' + amt(D.exact), role: 'ex' });
          parts = parts.concat(errParts(Dr.total, phone));
          if(isT()) parts.push({ t: 'no exact: a table gives only these values', role: 'ink' });
          if(isT() && phone) parts[parts.length - 1].t = 'a table has no exact';
          if(isT() && S.tab === 'ou') parts = verdictParts(phone);
        } else parts = verdictParts(phone);
        key = JSON.stringify(parts);
        if(key !== wKey){ wKey = key; cause.set(parts); }
      }
    }
    /* tab 2: the shape, what it does to this kind's tops, the verdict (the model's rule, R.verdict) */
    function verdictParts(phone){
      var nm = D.nm, f = nm.f, sh = D.shape, k = S.kind, lr = k === 'left' || k === 'right', sum = S.drawn.total, KW = { left: 'left', right: 'right', mid: 'midpoint', trap: 'trapezoid' }[k];
      if(isT()){
        var ys = D.ys, up = ys.every(function(y, i){ return !i || y > ys[i - 1]; }), dn = ys.every(function(y, i){ return !i || y < ys[i - 1]; });
        if(lr && (up || dn)){ var over = (k === 'left') === dn; return [{ t: 'values ' + (up ? 'rise' : 'fall'), role: 'shape' }, { t: (phone ? '' : KW + ': ') + (over ? 'over' : 'under') + ' if ' + f + ' ' + (up ? 'rises' : 'falls') + ' throughout', role: over ? 'extra' : 'miss' }]; }
        return [{ t: lr ? 'values go up and down' : 'a table can\'t show bending', role: 'shape' }, { t: 'over or under not known', role: 'ink' }];
      }
      var vd = R.verdict(k, sh, f), parts;
      if(lr){
        if(sh.inc){ var o1 = vd.v === 'over'; parts = [{ t: f + ' ' + (sh.inc === 'up' ? 'increasing' : 'decreasing'), role: 'shape' }, { t: KW + ' tops ' + (o1 ? 'above' : 'below') + ' ' + f, role: o1 ? 'extra' : 'miss' }, { t: o1 ? 'overestimate' : 'underestimate', role: o1 ? 'extra' : 'miss' }]; }
        else parts = [{ t: f + ' changes direction', role: 'shape' }, { t: 'no rule for ' + KW, role: 'ink' }];
      } else {
        if(sh.conc){ var o2 = vd.v === 'over'; parts = [{ t: f + ' concave ' + sh.conc, role: 'shape' }, { t: k === 'trap' ? (phone ? 'tops ' : 'trapezoid tops ') + (o2 ? 'above ' : 'below ') + f : (phone ? '' : 'midpoint ') + (o2 ? 'more extra than missed' : 'more missed than extra'), role: o2 ? 'extra' : 'miss' }, { t: o2 ? 'overestimate' : 'underestimate', role: o2 ? 'extra' : 'miss' }]; }
        else parts = [{ t: f + ' changes concavity', role: 'shape' }, { t: 'no rule for ' + KW, role: 'ink' }];
      }
      if(!vd.v && D.exact != null){ var ep = errParts(sum, phone); if(ep.length) parts.push({ t: 'this time ' + ep[0].t, role: ep[0].role }); }
      return parts;
    }
    function tagOf(n){ return n + (n === 1 ? ' strip' : ' strips'); }

    /* ---------------------------------------------------- the strips' knob (K.handle on the rail, log scale) */
    var knob = null;
    function mkKnob(){
      knob = K.handle(layer, { key: 'apcalc-riemann-sums-n', label: 'Number of strips', value: S.n1, min: 1, max: 100, step: 1, hint: 'Drag',
        at: function(v){ return G ? [railX(v), G.railY] : [0, 0]; },
        pick: function(x){ return railN(x); }, dir: function(){ return 0; },
        keys: function(v, key, shift){
          if(key === 'ArrowRight' || key === 'ArrowUp') return Math.min(100, v + (shift ? 10 : 1));
          if(key === 'ArrowLeft' || key === 'ArrowDown') return Math.max(1, v - (shift ? 10 : 1));
          if(key === 'PageUp') return Math.min(100, v * 2);
          if(key === 'PageDown') return Math.max(1, Math.ceil(v / 2));
          if(key === 'Home') return 1; if(key === 'End') return 100;
          return null;
        },
        valuetext: function(v){ return tagOf(v); }, tag: function(v){ return tagOf(v); },
        tagSide: function(v){ return G && railX(v) - G.rx0 > 96 ? 'left' : 'right'; },
        chipSide: function(v){ if(!G) return 'down'; var x = railX(v); return x - G.rx0 < 110 || G.rx1 - x < 110 ? 'down' : 'right'; },
        onStart: function(){ userActs(); hideCue(true); tourDid('drag'); setTimeout(measureCtl, 0); },
        onInput: function(v){ setN(v); },
        onEnd: function(){ settleSoon(); } });
      knob.el.classList.add('rs2-knob');
    }
    function setN(v){
      v = Math.round(v);
      if(S.tab === 'n'){ if(v === S.n1) return; S.n1 = v; } else { if(v === S.n2) return; S.n2 = v; }
      change(); target(true);
    }
    /* any change of setting: a fill or a takeaway gives way (the columns refill, shown) */
    function change(){
      if(fillP.playing()) fillP.stop();
      if(S.fill != null){ S.fill = null; S.refill = 0; }
      S.took = null; fillP.paint();
    }
    function userActs(){ if(S.mode === 'explore') hideCue(true); if(knob){ knob.used(); setTimeout(measureCtl, 0); } }

    /* ---------------------------------------------------- the four sums */
    seg.addEventListener('click', function(e){
      var b = e.target.closest('button[data-k]'); if(!b || b.disabled) return;
      userActs(); hideCue(true); tourDid('kind');
      var k = b.getAttribute('data-k'); if(k === S.kind) return;
      S.kind = k; change(); target(true); paintSeg(); settleSoon();
    });
    function paintSeg(){ seg.querySelectorAll('button').forEach(function(b){ var k = b.getAttribute('data-k'); b.setAttribute('aria-pressed', String(k === S.kind)); b.disabled = k === 'mid' && !D.midOk; b.title = b.disabled ? 'A midpoint sum needs the value at the middle of each pair of widths; this table does not give it.' : ''; }); }

    /* ---------------------------------------------------- Fill one by one */
    function fillStart(){
      userActs(); hideCue(true); tourDid('fill');
      S.from = null; S.e = 1; S.sel = -1; S.took = null; S.refill = 1;
      fillO.max = S.ps.length;
      if(K.reduced()){ fade(); S.fill = fillO.max; draw(); fillEnd(); fillP.paint(); return false; }
      scrollIn();
      return true;
    }
    function fillEnd(){
      var n = S.ps.length;
      // the last column is fully poured first, so the sentence and the tank show the same amount
      S.fill = n; draw();
      S.took = 'Poured together, the ' + n + ' column' + (n === 1 ? '' : 's') + ' hold ' + amt(R.total(S.ps)) + ': that is the ' + (isT() ? kindWord() + ' from the table' : kindWord() + (D.exact != null ? '. The exact amount is ' + amt(D.exact) : '')) + '.';
      wKey = ''; words(); say(S.took);
    }
    function scrollIn(){ var r = scene.getBoundingClientRect(); if(r.top < 0 || r.bottom > (window.innerHeight || 800)) try{ scene.scrollIntoView({ block: 'nearest', behavior: K.reduced() ? 'auto' : 'smooth' }); }catch(e){} }

    /* ---------------------------------------------------- a tap on a strip reads its term */
    scene.addEventListener('pointerdown', function(e){
      if(!G || e.target.closest('.tk2-knob, .tk2-cue, button, select')) return;
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      if(S.fill != null && fillP.playing()) return;
      var r = scene.getBoundingClientRect(), k = layer.scale() || 1, X = (e.clientX - r.left) / k, Y = (e.clientY - r.top) / k;
      if(X < G.L || X > G.R || Y < G.T - 4 || Y > G.B + 4) return;
      var xv = G.ix(X), i = -1;
      S.ps.forEach(function(p, j){ if(xv >= p.x0 && xv <= p.x1) i = j; });
      var hit = false;
      if(i >= 0){ var p = S.ps[i], top = S.kind === 'trap' ? p.h0 + (p.h1 - p.h0) * (xv - p.x0) / p.w : p.h, Yt = G.sy(top), lo = Math.min(Yt, G.y0) - 8, hi = Math.max(Yt, G.y0) + 8; hit = Y >= lo && Y <= hi; }
      userActs(); hideCue(true);
      S.sel = hit && !S.from ? i : -1;
      if(S.fill != null){ S.fill = null; S.refill = 0; fillP.paint(); }
      S.took = null; kick();
      if(hit) say(cause.text());
    });

    /* ---------------------------------------------------- the first visit cue and "Show me how" */
    var cueO = { key: 'apcalc-riemann-sums', text: 'Drag for more strips', side: 'below',
      at: function(){ if(!G) return [0, 0]; if(S.tab === 'ou'){ var r = seg.getBoundingClientRect(), sr = scene.getBoundingClientRect(), kk = layer.scale() || 1; return [((r.left + r.right) / 2 - sr.left) / kk, (r.bottom - sr.top) / kk - 22]; } return [railX(nOf()), G.railY]; } };
    var cue = K.cue(layer, cueO);
    var cue2 = K.cue(layer, { key: 'apcalc-riemann-sums-2', text: 'Tap a sum', side: 'below', at: cueO.at });
    /* the first-time chip and the cue: measured once when they appear or the picture is laid out (not every frame) */
    var ctlBoxes = null;
    function measureCtl(){
      ctlBoxes = [];
      var sr = scene.getBoundingClientRect(), k = layer.scale() || 1;
      [knob && knob.el.querySelector('.tk2-chip'), scene.querySelector('.tk2-cue')].forEach(function(x){
        if(!x || !x.offsetWidth) return; var r = x.getBoundingClientRect(); ctlBoxes.push([(r.left - sr.left) / k - 3, (r.top - sr.top) / k - 3, (r.right - sr.left) / k + 3, (r.bottom - sr.top) / k + 3]); });
    }
    function cueShow(){
      if(!G || S.mode !== 'explore') return;
      if(S.tab === 'n'){ cue2.hide(false); if(!isT() && cue.show()){ draw(); measureCtl(); draw(); } }
      else { cue.hide(false); if(cue2.show()){ knobMode(); draw(); measureCtl(); draw(); } }
    }
    function hideCue(used){ var was = cue.active() || cue2.active(); if(S.tab === 'n'){ if(cue.active()) cue.hide(used); } else if(cue2.active()) cue2.hide(used); if(was){ knobMode(); setTimeout(measureCtl, 0); } }
    stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End)/.test(e.key)) hideCue(true); }, true);
    var tour = K.tour({ key: 'apcalc-riemann-sums', label: 'Show me how', steps: [
      { id: 'drag', text: 'Drag the knob for more, thinner strips. The tank holds their total; the thin line is the exact amount.', target: function(){ return knob.knob; } },
      { id: 'kind', text: 'Pick where each strip takes its height: left end, right end, middle, or a trapezoid.', target: function(){ return seg; } },
      { id: 'fill', text: 'Fill one by one pours each column into the tank.', target: function(){ return fillP.el; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    var tour2 = K.tour({ key: 'apcalc-riemann-sums-2', label: 'Show me how', steps: [
      { id: 'kind', text: 'Tap a sum. Orange is area the sum counts extra, green is area it misses.', target: function(){ return seg; } },
      { id: 'pick', text: 'Pick another curve: rising, falling or bending changes the answer.', target: function(){ return pick; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function tourDid(x){ [tour, tour2].forEach(function(t){ if(t.active()) t.did(x); }); }
    function startTour(){ if(S.mode !== 'explore') return; hideCue(false); (S.tab === 'n' && !isT() ? tour : tour2).start(true); }

    /* ---------------------------------------------------- tabs and curves */
    function purpose(){ var ph = (window.innerWidth || 1024) < 600; head.purpose(S.tab === 'n' ? (ph ? 'Thinner strips close in on the area.' : 'Thinner strips: the sum closes in on the exact area.') : (ph ? 'Rising, falling or bending: over or under.' : 'Rising, falling or bending decides over or under.')); }
    function setTab(v){
      if(v === S.tab) return;
      cue.hide(false); cue2.hide(false);
      S.tab = v; tabs.value(v); purpose(); change();
      stage.classList.toggle('is-ou', v === 'ou');
      knobMode(); layout();
      target(true); refLater(); settleSoon();
      if(S.mode === 'explore') setTimeout(cueShow, 30);
      say((v === 'n' ? 'More strips. ' : 'Over or under. ') + cause.text());
    }
    function knobMode(){
      if(!knob) return;
      knob.hide(isT() || (S.tab === 'ou' && G && G.narrow && cue2.active()));
      knob.el.classList.toggle('is-quiet', S.tab === 'ou');
      knob.value(nOf());
    }
    function setCurve(i){
      var x = items[i]; if(!x || x === S.cur) return;
      fade(); change();
      S.cur = x; D = curveOf(x);
      if(!D.midOk && S.kind === 'mid') S.kind = 'left';
      paintSeg(); knobMode();
      S.to = null; S.from = null; S.drawn = null;
      layout(); target(false); refLater(); settleSoon();
      if(S.mode === 'explore' && S.tab === 'n' && !isT()) cueShow();
    }
    pick.addEventListener('change', function(){ userActs(); tourDid('pick'); setCurve(+pick.value); });
    /* a short cross fade of the picture that was there (a new curve, or any change under reduced motion) */
    function fade(){
      if(!S.ready || !G) return;
      var old = gS.innerHTML + gD.innerHTML;
      if(!old) return;
      var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'rs2-fade'); g.innerHTML = old; svg.appendChild(g);
      var done = function(){ if(g.parentNode) g.parentNode.removeChild(g); };
      if(g.animate){ var an = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: K.reduced() ? 220 : 300, easing: 'ease-out' }); an.onfinish = done; setTimeout(done, 500); } else done();
    }

    /* ---------------------------------------------------- the one loop */
    var raf = 0, lastT = 0;
    function kick(){ if(!raf && S.ready && G) { lastT = 0; raf = requestAnimationFrame(frame); } }
    function frame(t){
      raf = 0;
      var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016; lastT = t;
      var busy = false, red = K.reduced();
      if(S.from){ S.e = red ? 1 : Math.min(1, S.e + dt / 0.32); if(S.e >= 1){ S.from = null; S.e = 1; settle(); } else busy = true; }
      if(S.refill < 1){ S.refill = red ? 1 : Math.min(1, S.refill + dt / 0.4); busy = busy || S.refill < 1; }
      draw();
      if(busy) raf = requestAnimationFrame(frame);
    }
    /* a change that has finished drawing: the takeaway at 100 strips, the screen reader's sentence, "?" */
    var setT = 0;
    function settleSoon(){ clearTimeout(setT); setT = setTimeout(function(){ if(!S.from) settle(); }, 60); }
    function settle(){
      if(!S.drawn || !G){ refLater(); return; }
      if(knob && knob.dragging()) { refLater(); return; }
      if(S.tab === 'n' && !isT() && S.n1 === 100 && D.exact != null && S.fill == null && !S.from){
        var Dr = S.drawn, err = Dr.total - D.exact, by = Math.abs(err) >= 0.5 * Math.pow(10, -D.dec) ? fix(Math.abs(err), D.dec) : sig2(Math.abs(err));
        S.took = 'With 100 strips the ' + kindWord() + ' ' + amt(Dr.total) + ' is ' + (Math.abs(err) < 1e-9 ? 'exactly' : 'only ' + by + ' from') + ' ' + intText() + ' = ' + amt(D.exact) + ': thinner strips close in.';
        wKey = ''; words();
      }
      var label = (isT() ? 'Data points of ' + D.nm.f + ' from the table' : 'Graph of ' + plainTex(D.it.tex)) + ' with ' + S.ps.length + ' ' + R.NAME[S.kind] + ' strips drawn as columns of water; the tank beside them holds their total, ' + amt(S.drawn.total) + (D.exact != null ? ', and a line marks the exact amount, ' + amt(D.exact) : '') + '.';
      svg.setAttribute('aria-label', label);
      say(S.took || cause.text());
      refLater();
    }

    /* ---------------------------------------------------- "?": the sum strip by strip, all four, the rules */
    var ref = el('div', 'ls-sec rs2-ref'), refT = null;
    function refLater(){ clearTimeout(refT); refT = setTimeout(refHtml, (knob && knob.dragging()) || fillP.playing() ? 300 : 60); }
    function refHtml(){
      var nm = D.nm, isTab = isT(), n = nOf(), ps = S.ps, kind = S.kind, unit = nm.amtA ? ' ' + esc(nm.amtA) : '', sum = R.total(ps);
      var html = '<p class="rs2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>';
      html += '<h3 class="ls-title-l">' + esc(D.name) + '</h3>' + (isTab ? '' : tr(D.it.tex)) + (isTab ? '<p>A table of ' + esc(nm.f) + '(' + esc(nm.v) + ') in ' + esc(nm.rateU) + ', ' + esc(nm.v) + ' in ' + esc(nm.varU) + '.</p>' : '<p>From ' + esc(nm.v) + ' = ' + esc(mn(D.it.piX ? '0' : D.a)) + ' to ' + esc(D.it.piX ? piT(D.b) : mn(D.b)) + (nm.varU ? ' ' + esc(nm.varU) : '') + '.</p>');
      var dx = isTab ? '' : '\\Delta ' + nm.v + ' = \\frac{' + M.fmt(D.b, 4).replace('−', '-') + ' - ' + M.fmt(D.a, 4).replace('−', '-').replace(/^-(.*)$/, '(-$1)') + '}{' + n + '} = ' + M.fmt((D.b - D.a) / n, 4).replace('−', '-');
      var sig = isTab ? '' : kind === 'trap' ? '\\sum_{i=1}^{' + n + '} \\frac{' + nm.f + '(' + nm.v + '_{i-1}) + ' + nm.f + '(' + nm.v + '_i)}{2}\\,\\Delta ' + nm.v
        : '\\sum_{i=1}^{' + n + '} ' + nm.f + '(' + (kind === 'left' ? nm.v + '_{i-1}' : kind === 'right' ? nm.v + '_i' : 'm_i') + ')\\,\\Delta ' + nm.v;
      var head2 = '<tr><th scope="col">Strip</th><th scope="col">Subinterval</th><th scope="col">Width</th><th scope="col">' + (kind === 'trap' ? 'Heights (ends)' : 'Height ' + esc(nm.f) + '(' + (kind === 'left' ? 'left end' : kind === 'right' ? 'right end' : 'middle') + ')') + '</th><th scope="col">Term</th></tr>';
      var rows = ps.map(function(p, i){ return '<tr' + (i === S.sel ? ' class="hl"' : '') + '><th scope="row">' + (i + 1) + '</th><td>[' + nf(p.x0) + ', ' + nf(p.x1) + ']</td><td class="r">' + nf(p.w) + '</td><td class="r">' + (kind === 'trap' ? nf(p.h0) + ', ' + nf(p.h1) : nf(p.h)) + '</td><td class="r">' + fmt(p.area) + '</td></tr>'; }).join('');
      html += '<h3 class="ls-title-l">The ' + esc(R.NAME[kind]) + ', strip by strip</h3>' +
        (isTab ? '<p>The table fixes the subintervals: ' + (D.xs.length - 1) + ' of them, with widths ' + D.xs.slice(1).map(function(x, i){ return M.fmt(x - D.xs[i], 3); }).join(', ') + '. Each term uses its own width.</p>' : '<p>' + tr(dx) + '</p><p>' + tr(sig + ' = ' + M.fmt(sum, 6).replace('−', '-')) + '</p>') +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Every strip of the sum"><table class="ls-tbl rs-tbl"><caption class="sr-only">Every strip: width, height and term</caption><thead>' + head2 + '</thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="bt-small">Total: ' + fmt(sum) + unit + '.' + (D.exact != null ? ' Exact (the definite integral, ' + esc(intText()) + '): ' + fmt(D.exact) + unit + '.' : '') +
        (isTab && D.trend != null ? ' Area under one possible smooth ' + esc(nm.f) + ' through these points (not given; a table cannot know it): ' + fmt(D.trend) + unit + '.' : '') + '</p>';
      var all = R.KINDS.map(function(kk){ var q = piecesFor(n, kk); return q.length ? '<tr' + (kk === kind ? ' class="hl"' : '') + '><th scope="row">' + R.SHORT[kk] + '</th><td class="r">' + fmt(R.total(q)) + '</td>' + (D.exact != null ? '<td class="r">' + fmt(R.total(q) - D.exact) + '</td>' : D.trend != null ? '<td class="r">' + fmt(R.total(q) - D.trend) + '</td>' : '') + '</tr>' : ''; }).join('');
      html += '<h3 class="ls-title-l">All four, side by side' + (isTab ? '' : ' (' + n + ' strips)') + '</h3><table class="ls-tbl"><caption class="sr-only">Left, right, midpoint and trapezoidal sums compared</caption><thead><tr><th scope="col">Sum</th><th scope="col">Value</th>' + (D.exact != null ? '<th scope="col">Minus exact</th>' : D.trend != null ? '<th scope="col">Minus one possible ' + esc(nm.f) + '</th>' : '') + '</tr></thead><tbody>' + all + '</tbody></table>' +
        '<p class="bt-small">With equal widths the trapezoidal sum is the average of the left and right sums.' + (isTab ? ' A midpoint sum from a table needs the value at the true middle of each pair of subintervals (each pair of widths equal); neither table here gives that, so Midpoint is off.' : '') + '</p>';
      html += '<h3 class="ls-title-l">Over or under</h3><ul>' +
        '<li><b>Left and right sums</b> follow increasing or decreasing. If ' + esc(nm.f) + ' is increasing on the whole interval, a left sum is an underestimate and a right sum an overestimate; decreasing, the other way round.</li>' +
        '<li><b>Midpoint and trapezoidal sums</b> follow concavity. If ' + esc(nm.f) + ' is concave up on the whole interval, each trapezoid’s top (a chord) lies above the curve, so the trapezoidal sum is an overestimate; a midpoint rectangle has the same area as the trapezoid under the tangent line at the midpoint, which lies below the curve, so the midpoint sum is an underestimate. Concave down, both turn round.</li>' +
        '<li>When ' + esc(nm.f) + ' changes direction (or concavity) on the interval, no rule fixes the side: the sum can land on either.</li>' +
        '<li>A table never shows concavity, and rising values only point to a side if the problem says ' + esc(nm.f) + ' is increasing (or decreasing) throughout.</li></ul>' +
        '<p>On the picture the gap between each column’s top and the curve is colored: <b class="rs2-kextra">orange</b> where the column counts extra area, <b class="rs2-kmiss">green</b> where it misses area. The sum minus the exact value is the orange area minus the green area.</p>' +
        (isTab ? '' : '<p>Doubling the strips cuts the error of a left or right sum to about half, and of a midpoint or trapezoidal sum to about a quarter. As the strips get thinner every sum closes in on the definite integral: the limit of the Riemann sums as n → ∞ is ' + esc(intText()) + '.</p>');
      if(S.cur.type !== 'fn') html += '<h3 class="ls-title-l">Units</h3><p>Each column is a width in ' + esc(nm.varU) + ' times a rate in ' + esc(nm.rateU) + ', so it holds ' + esc(nm.amt) + ': the sum is an amount, not a rate.</p>';
      html += '<h3 class="ls-title-l">Negative strips</h3><p>A column below the axis counts as negative: it drains the tank instead of filling it, so the sum is a net, signed amount (here the tank has a “start” line when that can happen).</p>' +
        '<p class="bt-small">How it is drawn: each column is exactly the rectangle or trapezoid the sum adds, and the tank’s water is their total, read from the drawn columns on every frame (during a change the tops pass smoothly from the old strips to the new). With many strips the columns’ walls are thinner than a pixel, so the strips show as one shaded shape with a tick on the axis at each wall.</p>' +
        '<details class="rs2-keys"><summary>Keyboard</summary><p class="bt-small">Tab to the strips knob: ← → one strip fewer or more (Shift: ten), Page Up doubles, Page Down halves, Home 1 strip, End 100. The four sums are buttons. The table above lists every strip’s term.</p></details>' +
        '<p class="tool-about-n">Notes for this topic: <a href="../notes/riemann-sums.html">Riemann sums</a>' + (S.cur.type !== 'fn' ? ', <a href="../notes/accumulation-of-change.html">Accumulation of change</a>' : '') + '</p>';
      ref.innerHTML = html;
    }
    ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(LS) LS.close(); setTimeout(startTour, 60); });

    /* ---------------------------------------------------- layout */
    var lastWH = '';
    function fitHeight(){
      var vw = window.innerWidth || 1024, vh = window.innerHeight || 800;
      if(vw >= 1024){ scene.style.height = ''; return; }
      var top = scene.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
      // on a phone the picture and the cause line share the screen; Fill one by one may sit just below
      var below = vw < 600 ? (cause.el.offsetHeight || 84) + 6 : (lines.offsetHeight || 90);
      var hh = Math.round(vh - Math.min(top, vh * 0.4) - below - 14);
      scene.style.height = clamp(hh, vw < 600 ? 300 : 420, vw < 600 ? 640 : 760) + 'px';
    }
    function layout(){
      if(stage.hidden || !stage.isConnected) return;
      fitHeight();
      var r = scene.getBoundingClientRect(), W = Math.round(r.width), H = Math.round(r.height);
      if(W < 200 || H < 200) return;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      G = geo(W, H); lastWH = W + 'x' + H;
      seg.style.left = G.segX + 'px'; seg.style.top = G.segY + 'px';
      drawStatic(); if(!S.to) target(false); draw(); measureCtl(); draw();
      if(cue.active()) cue.place(); if(cue2.active()) cue2.place();
    }
    if(window.ResizeObserver){ var rt = 0; new ResizeObserver(function(){ var r = scene.getBoundingClientRect(); if(Math.round(r.width) + 'x' + Math.round(r.height) === lastWH) return; cancelAnimationFrame(rt); rt = requestAnimationFrame(layout); }).observe(scene); }
    var rzT = 0; window.addEventListener('resize', function(){ clearTimeout(rzT); rzT = setTimeout(layout, 60); });

    function boot(){
      S.ready = true; D = curveOf(S.cur);
      mkKnob(); paintSeg(); purpose(); knobMode();
      target(false); refHtml(); layout();
      setTimeout(function(){ layout(); settle(); if(S.mode === 'explore' && !tour.active()) cueShow(); }, 60);
    }
    function stopAll(){
      fillP.stop(); tour.stop(); tour2.stop(); cue.hide(false); cue2.hide(false);
      if(raf){ cancelAnimationFrame(raf); raf = 0; }
      S.from = null; S.e = 1; S.refill = 1;
      if(S.fill != null){ S.fill = null; S.took = null; fillP.paint(); }
      if(G && S.to) draw();
    }
    function shown(m){
      S.mode = m;
      if(m !== 'explore'){ stopAll(); return; }
      setTimeout(function(){ layout(); settleSoon(); if(!tour.active() && !tour2.active()) cueShow(); }, 40);
    }
    return {
      kit2: function(pane, s){
        LS = s; boot();
        // "?" opened over the stage: a running fill pauses (it goes on from there with the button)
        var sh = s.root && s.root.querySelector('.ls-sheet');
        if(window.MutationObserver && sh) new MutationObserver(function(){ if(!sh.hidden && fillP.playing()) fillP.stop(); }).observe(sh, { attributes: true, attributeFilter: ['hidden'] });
        return { stage: stage, ref: ref };
      },
      plain: function(){ host.appendChild(stage); host.appendChild(ref); boot(); },
      shown: shown, stop: stopAll, redraw: function(){ layout(); },
      // for the sweep test and the browser checks only: exposed as window.ApCalcRiemannSums only when the test sets
      // window.LevlToolTest before the page loads (never in production)
      _t: { S: S, D: function(){ return D; }, G: function(){ return G; }, knob: function(){ return knob; }, fill: fillP, cause: cause, setTab: setTab,
        setCurve: function(idv){ var i = items.findIndex(function(x){ return x.it.id === idv; }); pick.value = String(i); pick.dispatchEvent(new Event('change')); },
        setN: function(v){ knob.value(v, true); settleSoon(); }, kind: function(k){ var b = seg.querySelector('[data-k="' + k + '"]'); if(b) b.click(); },
        tap: function(i){ S.sel = i; kick(); }, areaOf: areaOf, items: items }
    };
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
      extra: function(el, p, api){ api.fig = el; QM.clear(); QM.last = {}; QM.reveal = false; figure(el, p, false); },
      onStep: function(s, right, api){ if(s.key === 'setup' || s.key === 'verdict' || s.key === 'pick'){ QM.reveal = true; figure(api.fig, api.problem, true); } },
      method: function(s, p){ var sk = (p.figure && p.figure.sumKind) || (p.sketch && p.sketch.sumKind); if(s.key === 'verdict' && sk) return VERDICT_M[sk === 'mid' || sk === 'trap' ? sk : 'lr'];
        return (p.type === 'table' && s.key === 'setup' ? 'A table gives each subinterval its own width: multiply each width by the height the sum uses (left end, right end, middle, or the average of both ends).' : METHOD[s.key]) || ''; },
      // X1: the over/under verdict draws the strips at once (their tops show the answer);
      // a sum is drawn as yours against the right one on the strips.
      onTry: function(s, t, api){
        var p = api.problem, who = t.ok || t.shown ? 'right' : 'yours', mk = [];
        if(s.key === 'verdict'){ QM.reveal = true; figure(api.fig, p, true); return !!p.figure; }
        if(!p.figure || s.kind !== 'num') return false;
        var val = who === 'right' ? s.cell.answer : t.value; if(!isFinite(val)) return false;
        var g = p.figure, xr = g.kind === 'fn' ? [g.a, g.b] : [g.xs[0], g.xs[g.xs.length - 1]];
        mk.push({ label: (who === 'yours' ? 'yours: ' : s.key === 'value' ? 'right sum = ' : s.key === 'total' ? 'amount = ' : 'sum of the strips = ') + T.numText(val), at: [who === 'yours' ? xr[0] : xr[1], 1e9], who: who, anchor: who === 'yours' ? 'start' : 'end' });
        if(who === 'yours') QM.last[s.key] = mk; else if(QM.last[s.key]) mk = QM.last[s.key].concat(mk);
        QM.set(s.key, mk); figure(api.fig, p, QM.reveal || who === 'right');
        return true;
      }
    };
    T.drill(host, data, o);
  }
  var QM = T.tries();
  // Over or under, by kind of sum: what to look at on the strips.
  var VERDICT_M = {
    lr: 'Look at the strips: tops above the curve make an overestimate, tops below it an underestimate.',
    trap: 'Look at each slanted top: a chord above the curve (concave up) overestimates, below it (concave down) underestimates.',
    mid: 'A midpoint rectangle has the same area as the trapezoid under the tangent line at the midpoint. Concave up puts that tangent below the curve (an underestimate); concave down puts it above (an overestimate).'
  };
  var METHOD = {
    sum: 'Add the terms of the setup you chose: each width times its height. Round only at the end.',
    meaning: 'Width (time) times rate gives an amount: the units of the sum are the units of the amount.',
    verdict: 'Look at the strips: tops above the curve make an overestimate, tops below it an underestimate.',
    reason: 'Left and right sums depend on increasing or decreasing; midpoint and trapezoid sums on concavity.',
    units: 'The area under a rate graph multiplies the horizontal unit by the vertical unit.',
    area: 'Each strip under a straight piece is a trapezoid: width × (left height + right height) ÷ 2. Add them.',
    total: 'Amount at the end = amount at the start + the area (the change).',
    width: 'Δx = (b − a)/n: the number over n is the length of the interval.',
    upper: 'b = a + (b − a): add the length of the interval to the lower limit.',
    integrand: 'The k-th point is x = a + kΔx. Whatever the sum does to that point is f(x).',
    pick: 'Check three things: Δx = (b − a)/n, the points start at a, and each term is a height times Δx.',
    value: 'Δx = (b − a)/4. Add f at the four right endpoints, then multiply by Δx.'
  };
  /* The drill's figure: the data or the graph; the strips appear once the
     student has picked the sum (feedback on the stage). */
  /* A sketch of a rate with the stated shape (signs of R′ and R″ only): a
     smooth curve on [a, b] that rises or falls and bends the stated way. */
  function sketchFig(el, k, reveal){
    var a = k.a, b = k.b, L = b - a, up = k.inc === 'up', cu = k.conc === 'up';
    // u in [0, 1]: a strongly bent rise e(u) = (e^{3u} − 1)/(e^3 − 1) (concave up),
    // and its mirrors, so the gap between strip tops and the curve is easy to see
    var e = function(u){ return (Math.exp(3 * u) - 1) / (Math.exp(3) - 1); };
    var shape = function(u){ return up ? (cu ? e(u) : 1 - e(1 - u)) : (cu ? e(1 - u) : 1 - e(u)); };
    var f = function(x){ return 1.5 + 6.5 * shape((x - a) / L); };
    var nS = k.sumKind === 'left' || k.sumKind === 'right' ? 4 : 2;
    var fs = figSize(520, 300, true), ps = reveal ? R.pieces(f, R.partition(a, b, nS), k.sumKind) : [];
    var spec = { label: 'A sketch of a rate that is ' + (up ? 'increasing' : 'decreasing') + ' and concave ' + k.conc + ', with no scale on the vertical axis', width: fs[0], height: fs[1], x: [a - L * 0.05, b + L * 0.05], y: [0, 9.5], xLabel: k.v + ' (' + k.varUnit + ')', yLabel: k.rate + '(' + k.v + ')',
      curves: [{ fn: f, domain: [a, b], cls: 's1', label: k.rate }] };
    // no numbers up the vertical axis: only the shape is given (y tick labels are the unclassed end- or start-anchored texts)
    var svg = stripsSvg({ spec: spec, pieces: ps, kind: k.sumKind, marks: QM }).replace(/<g class="calc-plot-ticks">[\s\S]*?<\/g>/, function(g){ return g.replace(/<text x="[^"]*" y="[^"]*" text-anchor="(?:end|start)">[^<]*<\/text>/g, ''); });
    el.innerHTML = '<figure class="rs-qfig">' + svg + '<figcaption class="bt-small">A sketch with the stated shape, no vertical scale: any rate with these signs gives the same answer' + (reveal ? '. The ' + esc(R.NAME[k.sumKind]) + ', drawn' : '') + '.</figcaption></figure>';
  }
  function figure(el, p, reveal){
    if(p.sketch) return sketchFig(el, p.sketch, reveal);
    var g = p.figure;
    if(!g && p.table){ el.innerHTML = '<div class="rs-qtable">' + p.table.html + '</div>'; return; }
    if(!g){ el.innerHTML = ''; return; }
    var spec, ps = [], kind = g.sumKind, fs = figSize(520, 300, !!p.table || !!p.stageText);
    if(g.kind === 'table'){
      var xs = g.xs, ys = g.ys, pad = (xs[xs.length - 1] - xs[0]) * 0.05;
      spec = { label: 'Data points of ' + g.rate + '(' + g.v + ') from the table, at ' + xs.join(', ') + ' ' + g.varUnit, width: fs[0], height: fs[1], x: [xs[0] - pad, xs[xs.length - 1] + pad], y: yRange(ys), xLabel: g.v + ' (' + g.varUnit + ')', yLabel: g.rate + '(' + g.v + ')',
        points: xs.map(function(x, i){ return { at: [x, ys[i]], cls: 's1' }; }), xStep: niceX(xs) };
      if(reveal) ps = R.tablePieces(xs, ys, kind);
    } else if(g.kind === 'poly'){
      var fx = function(x){ for(var i = 0; i + 1 < g.xs.length; i++) if(x <= g.xs[i + 1] + 1e-12) return g.ys[i] + (g.ys[i + 1] - g.ys[i]) * (x - g.xs[i]) / (g.xs[i + 1] - g.xs[i]); return g.ys[g.ys.length - 1]; };
      var p0 = g.xs[0], p1 = g.xs[g.xs.length - 1];
      // The area under straight pieces is a row of trapezoids: drawn as strips
      // (trapezoidal sum, exact here) from the start, so the shape to add is in view.
      spec = { label: 'Graph of the rate ' + g.rate + '(' + g.v + ') made of straight pieces; the area under it is ' + (g.xs.length - 1) + ' trapezoids', width: fs[0], height: fs[1], x: [p0 - 0.3, p1 + 0.3], y: yRange(g.ys), xLabel: g.v + ' (' + g.varUnit + ')', yLabel: g.rate + '(' + g.v + ')', xStep: 1,
        curves: [{ fn: fx, domain: [p0, p1], cls: 's1' }], points: g.xs.map(function(x, i){ return { at: [x, g.ys[i]], cls: 's1' }; }) };
      ps = R.tablePieces(g.xs, g.ys, 'trap'); kind = 'trap';
    } else {
      var f = M.fn(g.fn), vals = []; for(var i = 0; i <= 80; i++) vals.push(f(g.a + (g.b - g.a) * i / 80));
      spec = { label: 'Graph of f on the interval from ' + g.a + ' to ' + g.b, width: fs[0], height: fs[1], x: [g.a - (g.b - g.a) * 0.05, g.b + (g.b - g.a) * 0.05], y: yRange(vals), xLabel: 'x', yLabel: 'y', curves: [{ fn: f, domain: [g.a, g.b], cls: 's1', label: 'f' }] };
      if(reveal) ps = R.pieces(f, R.partition(g.a, g.b, g.n || 4), kind);
    }
    el.innerHTML = (p.table ? '<div class="rs-qtable">' + p.table.html + '</div>' : '') + '<figure class="rs-qfig">' + stripsSvg({ spec: spec, pieces: ps, kind: kind, marks: QM }) +
      (g.kind === 'poly' ? '<figcaption class="bt-small">Each strip is a trapezoid: width × (left height + right height) ÷ 2.</figcaption>' : reveal && ps.length ? '<figcaption class="bt-small">The ' + esc(R.NAME[kind]) + ', drawn' + (g.kind === 'fn' && R.verdict ? ': ' + esc(qVerdict(g, kind)) : '') + '.</figcaption>' : '') + '</figure>';
  }
  /* A drawn sum against the exact area, in words (for the caption under the strips). */
  function qVerdict(g, kind){
    var f = M.fn(g.fn), sum = R.total(R.pieces(f, R.partition(g.a, g.b, g.n || 4), kind)), ex = M.integral(f, g.a, g.b);
    return Math.abs(sum - ex) < 1e-9 ? 'it equals the area' : 'the sum is ' + M.fmt(M.round(sum, 3), 6) + ' and the area is ' + M.fmt(M.round(ex, 3), 6) + ', an ' + (sum > ex ? 'overestimate' : 'underestimate');
  }
  /* The drill figure's size in its own units: on a phone about the room it
     gets in CSS px (less when a table or the problem shares the stage), so
     its labels are drawn near their true size. */
  function figSize(w, h, shared){
    var W = window.innerWidth || 1280, Hh = window.innerHeight || 800;
    if(W <= 640) return [340, Math.round(Math.max(220, Math.min(420, Hh * 0.62 - (shared ? 200 : 90))))];
    if(W <= 999 && Hh <= 540) return [440, shared ? Math.round(Math.max(150, Hh - 170)) : Math.round(Math.max(220, Math.min(300, Hh - 110)))];
    return [w, h];
  }
  function niceX(xs){ var span = xs[xs.length - 1] - xs[0]; return span <= 12 ? 1 : span <= 24 ? 2 : 5; }

  /* ========================================================= mount */
  function boot(){
    T.mount('riemann-sums', function(app, data){
      var ex = null, kit = !!(window.LevlKit2 && window.LevlStudio && app.getAttribute('data-studio'));
      var md = T.modes(app, { slug: 'riemann-sums', labels: ['Explore', 'Test yourself'],
        explore: function(host){ ex = explore(host, data); if(window.LevlToolTest) window.ApCalcRiemannSums = ex._t; },
        quiz: function(host){ quiz(host, data); },
        onShow: function(m){
          if(ex) ex.shown(m);
          // A pane that was hidden has no size: draw it again once it shows.
          setTimeout(function(){ if(m === 'explore' && ex) ex.redraw(); }, 30);
        },
        studio: kit ? { kit2: function(pane, s){ return ex.kit2(pane, s); } } : {} });
      // Without the frame (no Tool Studio, or no kit) the stage still works on its own, above Test yourself.
      if(!kit || !T.studioOf(app)) ex.plain();
      return md;
    });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApCalcBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; sc.onerror = boot; document.head.appendChild(sc);
  }
})();
