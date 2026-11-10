/* Vectors and matrices (simulator, Premium, Unit 4: beyond the exam;
   docs/apprecalc-spec.md section 6). OWNED BY THIS TOOL ONLY (builder T4,
   docs/apprecalc-briefs/t4.md). The model is ApPrecalcMath.vectorsMatrices
   (precalculus/assets/tools/math/vectors-matrices.js); math text ApPrecalcTex; the
   frame ApPrecalcTools.modes and drill on the Tool Studio.

   Explore, three views on one stage (the switch at the top of the dock):
     Motion    a point moves along a parametric path (Play, the slider, or
               arrow keys on the stage); the graphs of x(t) and y(t) run beside
               it, the point orange in all three. Interval: P(t₁) to P(t₂), the
               displacement arrow, Δx and Δy legs (in the colors of the x and y
               graphs) and the secants that give the average rates.
     Vectors   drag the tips of u (blue) and v (pink); the result (green) is
               u + v (parallelogram), u − v or k·u (slider).
     Matrices  a preset or your own 2 by 2 matrix moves the plane: the slider
               (or Play) carries every point from where it starts to its image.
               The columns are where (1, 0) and (0, 1) go (blue, pink, in the
               matrix too); the unit square becomes a parallelogram with area
               |det A|; "Undo with A⁻¹" carries it back. A draggable point and
               its image are orange.
   Test yourself: parametric position and direction, average rates and the
   slope, vector combinations, transformations, determinant and inverse. */
(function(){
  'use strict';
  var T = window.ApPrecalcTools, M = window.ApPrecalcMath, P = window.ApPrecalcPlot, X = window.ApPrecalcTex;
  (function(){
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Numbers & settings');
  })();
  if(!T || !M || !M.vectorsMatrices || M.vectorsMatrices.stub || !P) return;
  var VM = M.vectorsMatrices, F = T.F, esc = T.esc, PI = Math.PI, NS = 'http://www.w3.org/2000/svg';
  function html(s){ return X ? X.html(s) : s; }
  function tex(s){ return X ? X.render(s) : esc(s); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function num(v){ return VM.n(v, 2).replace(/^-/, '−'); }
  function studioNow(){ var app = document.getElementById('app'); return window.LevlStudio && app && app.getAttribute('data-studio') ? window.LevlStudio.get() : null; }
  function phoneNow(){ var s = studioNow(); return !!(s && s.root && s.root.classList.contains('ls-phone')) || (window.innerWidth || 1280) <= 640; }
  function tText(t, pi){ if(!pi) return VM.n(t, 2); var k = t / (PI / 4); if(Math.abs(k - Math.round(k)) < 1e-6){ k = Math.round(k); if(!k) return '0'; var g = k % 4 === 0 ? 4 : k % 2 === 0 ? 2 : 1; var nn = k / g, d = 4 / g; return (nn === 1 ? '' : nn) + 'π' + (d === 1 ? '' : '/' + d); } return VM.n(t, 2); }

  T.mount('vectors-matrices', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'vectors-matrices',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(ex) ex.pause(); var s = studioNow(); if(s) s.pills([{ html: 'Beyond the exam', tone: 'ghost' }], 'right', m); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ============================================================ drawing */
  /* An equal-scale plane in the box (x0, y0, w, h) showing at least
     [xa, xb] × [ya, yb]. */
  function plane(box, xa, xb, ya, yb){
    var k = Math.min(box.w / (xb - xa), box.h / (yb - ya)), cx = box.x0 + box.w / 2, cy = box.y0 + box.h / 2, mx = (xa + xb) / 2, my = (ya + yb) / 2;
    var g = { k: k, box: box,
      sx: function(x){ return cx + (x - mx) * k; }, sy: function(y){ return cy - (y - my) * k; },
      ix: function(px){ return mx + (px - cx) / k; }, iy: function(py){ return my - (py - cy) / k; } };
    g.X = [g.ix(box.x0), g.ix(box.x0 + box.w)]; g.Y = [g.iy(box.y0 + box.h), g.iy(box.y0)];
    return g;
  }
  function gridSvg(g, o){
    o = o || {};
    // steps that keep lines at least 7px and numbers at least 26px apart, however far the window zooms out (a path to y = −30 put a number every 10px)
    var stepFor = function(px){ var c = [1, 2, 5, 10, 20, 50, 100, 200, 500]; for(var i = 0; i < c.length; i++) if(c[i] * g.k >= px) return c[i]; return 1000; };
    var out = [], un = stepFor(7), st = Math.max(un, g.k < 22 ? 2 : 1), x, y;
    out.push('<rect class="vm-panel" x="' + r1(g.box.x0) + '" y="' + r1(g.box.y0) + '" width="' + r1(g.box.w) + '" height="' + r1(g.box.h) + '" rx="8"/>');
    var lines = [];
    for(x = Math.ceil(g.X[0] / un) * un; x <= g.X[1]; x += un) lines.push('<line' + (x === 0 ? ' class="vm-ax"' : x % st ? ' class="vm-minor"' : '') + ' x1="' + r1(g.sx(x)) + '" y1="' + r1(g.box.y0) + '" x2="' + r1(g.sx(x)) + '" y2="' + r1(g.box.y0 + g.box.h) + '"/>');
    for(y = Math.ceil(g.Y[0] / un) * un; y <= g.Y[1]; y += un) lines.push('<line' + (y === 0 ? ' class="vm-ax"' : y % st ? ' class="vm-minor"' : '') + ' x1="' + r1(g.box.x0) + '" y1="' + r1(g.sy(y)) + '" x2="' + r1(g.box.x0 + g.box.w) + '" y2="' + r1(g.sy(y)) + '"/>');
    out.push('<g class="vm-grid">' + lines.join('') + '</g>');
    if(o.labels !== false){
      var lab = [], ls = Math.max(g.k < 30 ? 2 : 1, stepFor(26));
      for(x = Math.ceil(g.X[0] + 0.4); x <= g.X[1] - 0.4; x++) if(x && x % ls === 0) lab.push('<text x="' + r1(g.sx(x)) + '" y="' + r1(clamp(g.sy(0) + 14, g.box.y0 + 12, g.box.y0 + g.box.h - 4)) + '" text-anchor="middle">' + F(x, 0) + '</text>');
      for(y = Math.ceil(g.Y[0] + 0.4); y <= g.Y[1] - 0.4; y++) if(y && y % ls === 0) lab.push('<text x="' + r1(clamp(g.sx(0) - 5, g.box.x0 + 14, g.box.x0 + g.box.w)) + '" y="' + r1(g.sy(y) + 4) + '" text-anchor="end">' + F(y, 0) + '</text>');
      out.push('<g class="vm-tk">' + lab.join('') + '</g>');
    }
    return out.join('');
  }
  function arrow(g, a, b, cls, label, lpos){
    var x1 = g.sx(a[0]), y1 = g.sy(a[1]), x2 = g.sx(b[0]), y2 = g.sy(b[1]), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if(L < 1){ return '<circle class="vm-zero ' + cls + '" cx="' + r1(x1) + '" cy="' + r1(y1) + '" r="4"/>'; }
    var ux = dx / L, uy = dy / L, hl = Math.min(13, L * 0.45), hw = hl * 0.55, bx = x2 - ux * hl, by = y2 - uy * hl;
    var out = '<g class="vm-arrow ' + cls + '"><line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(bx + ux * 2) + '" y2="' + r1(by + uy * 2) + '"/><path d="M' + r1(x2) + ' ' + r1(y2) + 'L' + r1(bx - uy * hw) + ' ' + r1(by + ux * hw) + 'L' + r1(bx + uy * hw) + ' ' + r1(by - ux * hw) + 'Z"/></g>';
    if(label){
      var t = lpos == null ? 1 : lpos, lx = x1 + dx * t + (-uy) * 14 + ux * 8, ly = y1 + dy * t + ux * 14 + uy * 8;
      out += '<text class="vm-alab ' + cls + '" x="' + r1(lx) + '" y="' + r1(ly + 4) + '" text-anchor="middle">' + esc(label) + '</text>';
    }
    return out;
  }
  function pathD(g, fx, fy, a, b, n){ var pts = []; for(var i = 0; i <= n; i++){ var t = a + (b - a) * i / n; pts.push(r1(g.sx(fx(t))) + ' ' + r1(g.sy(fy(t)))); } return 'M' + pts.join('L'); }
  /* A small graph of f against t in a box: { svg, gx, gy }. */
  function tGraph(box, f, dom, cls, name, pi){
    var lo = Infinity, hi = -Infinity, i;
    for(i = 0; i <= 160; i++){ var v = f(dom[0] + (dom[1] - dom[0]) * i / 160); lo = Math.min(lo, v); hi = Math.max(hi, v); }
    lo = Math.min(lo, 0); hi = Math.max(hi, 0); var pad = (hi - lo) * 0.12 || 1; lo -= pad; hi += pad;
    var L = box.x0 + 34, R = box.x0 + box.w - 8, Tp = box.y0 + 6, B = box.y0 + box.h - 20;
    var gx = function(t){ return L + (t - dom[0]) / (dom[1] - dom[0]) * (R - L); }, gy = function(v){ return Tp + (hi - v) / (hi - lo) * (B - Tp); };
    var out = ['<rect class="vm-panel" x="' + r1(L) + '" y="' + r1(Tp) + '" width="' + r1(R - L) + '" height="' + r1(B - Tp) + '" rx="6"/>'];
    var yt = P.ticks(lo, hi, 3), xt = pi ? P.piTicks(dom[0], dom[1]) : P.ticks(dom[0], dom[1], 4);
    out.push('<g class="vm-grid">' + yt.map(function(v){ return '<line' + (Math.abs(v) < 1e-12 ? ' class="vm-ax"' : '') + ' x1="' + r1(L) + '" y1="' + r1(gy(v)) + '" x2="' + r1(R) + '" y2="' + r1(gy(v)) + '"/>'; }).join('') + '</g>');
    out.push('<g class="vm-tk">' + yt.map(function(v){ return '<text x="' + r1(L - 5) + '" y="' + r1(gy(v) + 4) + '" text-anchor="end">' + F(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1) + '</text>'; }).join('') +
      xt.map(function(t){ return '<text x="' + r1(gx(t)) + '" y="' + r1(B + 14) + '" text-anchor="middle">' + tText(t, pi) + '</text>'; }).join('') + '</g>');
    var pts = []; for(i = 0; i <= 200; i++){ var t = dom[0] + (dom[1] - dom[0]) * i / 200; pts.push(r1(gx(t)) + ' ' + r1(gy(f(t)))); }
    out.push('<path class="vm-tcurve ' + cls + '" d="M' + pts.join('L') + '"/>');
    out.push('<text class="vm-tname ' + cls + '" x="' + r1(L + 6) + '" y="' + r1(Tp + 15) + '">' + name + '</text>');
    return { svg: out.join(''), gx: gx, gy: gy, lo: lo, hi: hi, L: L, R: R, T: Tp, B: B };
  }

  /* Persistent draggable points over a redrawn scene: focusable, arrow keys
     move one unit, pointer drags snap to whole numbers. */
  function handles(svg, layer){
    var list = [];
    function make(o){
      var gEl = document.createElementNS(NS, 'g');
      gEl.setAttribute('class', 'vm-handle ' + (o.cls || ''));
      gEl.setAttribute('tabindex', '0'); gEl.setAttribute('role', 'slider');
      gEl.setAttribute('aria-label', o.label + ': arrow keys move it one unit');
      gEl.innerHTML = '<circle class="vm-halo" r="17"/><circle class="vm-dot" r="7.5"/>';
      layer.appendChild(gEl);
      var h = { el: gEl, o: o, g: null };
      gEl.addEventListener('keydown', function(e){
        var p = o.get(), d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
        if(!d) return; e.preventDefault();
        o.set([clamp(p[0] + d[0], o.min[0], o.max[0]), clamp(p[1] + d[1], o.min[1], o.max[1])], true);
      });
      list.push(h); return h;
    }
    var drag = null;
    function local(e){ var b = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal; return [(e.clientX - b.left) * vb.width / b.width, (e.clientY - b.top) * vb.height / b.height]; }
    svg.addEventListener('pointerdown', function(e){
      var p = local(e), best = null;
      list.forEach(function(h){ if(!h.g || h.el.style.display === 'none') return; var q = h.o.get(), d = Math.hypot(h.g.sx(q[0]) - p[0], h.g.sy(q[1]) - p[1]); if(d < 28 && (!best || d < best.d)) best = { h: h, d: d }; });
      if(!best) return;
      drag = best.h; e.preventDefault(); try{ svg.setPointerCapture(e.pointerId); }catch(er){} drag.el.classList.add('is-drag'); drag.el.focus({ preventScroll: true });
    });
    svg.addEventListener('pointermove', function(e){
      if(!drag) return; var p = local(e), g = drag.g, o = drag.o;
      o.set([clamp(Math.round(g.ix(p[0])), o.min[0], o.max[0]), clamp(Math.round(g.iy(p[1])), o.min[1], o.max[1])], false);
    });
    function up(){ if(drag){ drag.el.classList.remove('is-drag'); drag = null; } }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    return {
      make: make,
      place: function(h, g, show){ h.g = g; h.el.style.display = show ? '' : 'none'; if(!show) return; var p = h.o.get(); h.el.setAttribute('transform', 'translate(' + r1(g.sx(p[0])) + ' ' + r1(g.sy(p[1])) + ')'); h.el.setAttribute('aria-valuetext', h.o.label + ' at (' + p[0] + ', ' + p[1] + ')'); h.el.setAttribute('aria-valuenow', String(p[0])); }
    };
  }

  /* ============================================================ explore */
  var DTS = { line: 1, toss: 0.5, circle: PI / 4, clock: PI / 4, ellipse: PI / 4 };
  function explore(host, data){
    var LS = null;
    var paths = (data.paths || VM.PORDER).filter(function(id){ return VM.PATHS[id]; });
    var mats = (data.matrices || VM.MORDER).filter(function(id){ return VM.MATRICES[id]; });
    var st = { view: 'motion', pid: paths[0], t: 1, iv: false, u: [3, 1], v: [1, 3], op: 'add', k: 2, mid: mats[0], A: VM.MATRICES[mats[0]].A.map(function(r){ return r.slice(); }), s: 1, undo: false, p: [2, 1], touched: false };
    var cue = T.cue('Press Play to send the point along its path; switch to Vectors or Matrices above.');
    host.innerHTML =
      '<section class="bt-problem vm-card" aria-label="Vectors and matrices explorer">' +
        '<div class="vm-stage">' +
          '<div class="vm-wrap" tabindex="0" role="slider" aria-label="Time t on the path: arrow keys change it"><svg class="vm-svg" aria-hidden="true"><g class="vm-scene"></g><g class="vm-handles"></g></svg></div>' +
          '<p class="vm-legend" aria-hidden="true"></p>' +
        '</div>' +
        '<div class="vm-ctl">' +
          '<div class="vm-views ls-seg" role="group" aria-label="View"><button type="button" class="bt-mode" data-v="motion" aria-pressed="true">Motion</button><button type="button" class="bt-mode" data-v="vectors" aria-pressed="false">Vectors</button><button type="button" class="bt-mode" data-v="matrix" aria-pressed="false">Matrices</button></div>' +
          '<div class="vm-chips ls-scroll" role="group" aria-label="Path"></div>' +
          '<div class="vm-slot"></div>' +
          '<div class="vm-row"><button type="button" class="bt-btn vm-play" aria-pressed="false"><span class="vm-play-i" aria-hidden="true"></span><span class="vm-play-t">Play</span></button><div class="vm-seg2 ls-seg" role="group"></div></div>' +
        '</div>' +
        T.moreHtml('<div class="vm-params"></div>', 'the matrix entries, the interval') +
        '<div class="vm-say"></div>' +
        '<div class="vm-det"></div>' +
        '<p class="sr-only vm-live"></p>' +
      '</section>';
    var card = host.querySelector('.vm-card');
    card.insertBefore(cue.el, card.querySelector('.vm-say'));
    var wrap = host.querySelector('.vm-wrap'), svg = host.querySelector('.vm-svg'), scn = host.querySelector('.vm-scene'), hl = host.querySelector('.vm-handles');
    var chips = host.querySelector('.vm-chips'), slot = host.querySelector('.vm-slot'), playBtn = host.querySelector('.vm-play'), seg2 = host.querySelector('.vm-seg2'), viewsEl = host.querySelector('.vm-views');
    var params = host.querySelector('.vm-params'), more = host.querySelector('details.bt-more'), legend = host.querySelector('.vm-legend');
    var say = T.announcer(host.querySelector('.vm-live'));
    var slider = null, anim = null, size = [0, 0], H = handles(svg, hl);
    var hU = H.make({ label: 'Tip of u', cls: 'c-u', min: [-7, -6], max: [7, 6], get: function(){ return st.u; }, set: function(p, kb){ st.u = p; touch(); draw(kb); } });
    var hV = H.make({ label: 'Tip of v', cls: 'c-v', min: [-7, -6], max: [7, 6], get: function(){ return st.v; }, set: function(p, kb){ st.v = p; touch(); draw(kb); } });
    var hP = H.make({ label: 'Point p', cls: 'c-p', min: [-4, -4], max: [4, 4], get: function(){ return st.p; }, set: function(p, kb){ st.p = p; touch(); draw(kb); } });
    function $(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); }
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }
    function path(){ return VM.PATHS[st.pid]; }
    function dt(){ return DTS[st.pid] || 1; }
    function tMax(){ return path().dom[1] - (st.iv ? dt() : 0); }

    /* ---------------- controls per view */
    function build(){
      pause();
      viewsEl.querySelectorAll('.bt-mode').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === st.view)); });
      var list = st.view === 'motion' ? paths.map(function(id){ return [id, VM.PATHS[id].name, id === st.pid]; }) : st.view === 'matrix' ? mats.map(function(id){ return [id, VM.MATRICES[id].name, id === st.mid]; }) : [['add', 'u + v', st.op === 'add'], ['sub', 'u − v', st.op === 'sub'], ['scale', 'k · u', st.op === 'scale']];
      chips.innerHTML = list.map(function(c){ return '<button type="button" class="bt-btn vm-chip" data-id="' + c[0] + '" aria-pressed="' + c[2] + '">' + esc(c[1]) + '</button>'; }).join('');
      chips.setAttribute('aria-label', st.view === 'motion' ? 'Path' : st.view === 'matrix' ? 'Matrix' : 'Operation');
      slot.innerHTML = ''; slider = null;
      if(st.view === 'motion'){
        var Pp = path();
        slider = T.slider({ label: st.iv ? 'Interval starts at t' : 'Time t', min: Pp.dom[0], max: M.round(tMax(), 6), step: Pp.pi ? PI / 48 : 0.05, value: clamp(st.t, Pp.dom[0], tMax()), decimals: 2, onInput: function(v){ pause(); st.t = v; touch(); draw(true); } });
      } else if(st.view === 'vectors'){
        if(st.op === 'scale') slider = T.slider({ label: 'Scalar k', min: -3, max: 3, step: 0.5, value: st.k, decimals: 1, onInput: function(v){ st.k = v; touch(); draw(true); } });
      } else {
        slider = T.slider({ label: st.undo ? 'Undo with A⁻¹' : 'Apply A', min: 0, max: 1, step: 0.02, value: st.s, decimals: 2, onInput: function(v){ pause(); st.s = v; touch(); draw(true); } });
      }
      if(slider) slot.appendChild(slider.el);
      slot.hidden = !slider;
      var row = playBtn.parentNode;
      row.hidden = st.view === 'vectors';
      seg2.innerHTML = st.view === 'motion' ? '<button type="button" class="bt-mode" data-k="pt" aria-pressed="' + !st.iv + '">Point</button><button type="button" class="bt-mode" data-k="iv" aria-pressed="' + st.iv + '">Interval</button>'
        : '<button type="button" class="bt-mode" data-k="A" aria-pressed="' + !st.undo + '">A</button><button type="button" class="bt-mode" data-k="U" aria-pressed="' + st.undo + '"' + (VM.inverse(st.A) ? '' : ' disabled') + '>Undo: A⁻¹</button>';
      seg2.setAttribute('aria-label', st.view === 'motion' ? 'Point or interval' : 'Apply A or undo it');
      wrap.setAttribute('aria-label', st.view === 'motion' ? 'Time t on the path: arrow keys change it' : st.view === 'vectors' ? 'Vectors u and v: tab to a tip and use the arrow keys' : 'The plane under the matrix A: arrow keys move the slider');
      wrap.setAttribute('role', st.view === 'motion' ? 'slider' : 'group');
      legend.innerHTML = st.view === 'motion' ? '<span class="vm-lg c-path">path</span><span class="vm-lg c-p">the point</span><span class="vm-lg c-x">x(t), Δx</span><span class="vm-lg c-y">y(t), Δy</span>' + (st.iv ? '<span class="vm-lg c-w">displacement, secants</span>' : '')
        : st.view === 'vectors' ? '<span class="vm-lg c-u">u</span><span class="vm-lg c-v">v</span><span class="vm-lg c-w">result</span>'
        : '<span class="vm-lg c-u">image of (1, 0): column 1</span><span class="vm-lg c-v">image of (0, 1): column 2</span><span class="vm-lg c-p">p and its image</span>';
      buildParams();
    }
    function buildParams(){
      var out = [];
      if(st.view === 'matrix'){
        var box = document.createElement('div'); box.className = 'vm-entries';
        box.innerHTML = '<p class="vm-ek">Entries of A (columns colored as on the stage)</p>' + [[0, 0], [0, 1], [1, 0], [1, 1]].map(function(ij){
          var id = 'vm-e' + ij.join(''), nm = ['a', 'b', 'c', 'd'][ij[0] * 2 + ij[1]];
          return '<label class="vm-e c-' + (ij[1] ? 'v' : 'u') + '" for="' + id + '"><span>' + nm + '</span><input id="' + id + '" type="number" inputmode="decimal" step="0.5" min="-4" max="4" value="' + st.A[ij[0]][ij[1]] + '" data-i="' + ij[0] + '" data-j="' + ij[1] + '"></label>';
        }).join('');
        box.addEventListener('input', function(e){
          var inp = e.target.closest('input'); if(!inp) return; var v = parseFloat(inp.value); if(!isFinite(v)) return;
          st.A[+inp.getAttribute('data-i')][+inp.getAttribute('data-j')] = clamp(v, -4, 4); st.mid = null; st.undo = st.undo && !!VM.inverse(st.A); touch();
          chips.querySelectorAll('.vm-chip').forEach(function(b){ b.setAttribute('aria-pressed', 'false'); });
          var u = seg2.querySelector('[data-k="U"]'); if(u) u.disabled = !VM.inverse(st.A);
          draw(true);
        });
        out.push(box);
      } else if(st.view === 'motion'){
        out.push(T.choiceSelect({ label: 'Interval length Δt', value: String(dt()), options: (path().pi ? [[PI / 6, 'π/6'], [PI / 4, 'π/4'], [PI / 2, 'π/2']] : [[0.5, '0.5'], [1, '1'], [2, '2']]).map(function(o){ return { value: String(o[0]), label: o[1] }; }), onChange: function(v){ DTS[st.pid] = +v; touch(); build(); draw(true); } }).el);
      } else {
        var p = document.createElement('p'); p.className = 'vm-ek'; p.textContent = 'Drag the tips of u and v on the stage, or tab to them and use the arrow keys.'; out.push(p);
      }
      params.innerHTML = ''; out.forEach(function(e){ params.appendChild(e); });
    }
    viewsEl.addEventListener('click', function(e){ var b = e.target.closest('.bt-mode'); if(!b || b.getAttribute('data-v') === st.view) return; touch(); st.view = b.getAttribute('data-v'); build(); draw(true); });
    chips.addEventListener('click', function(e){
      var b = e.target.closest('.vm-chip'); if(!b) return; touch(); var id = b.getAttribute('data-id');
      if(st.view === 'motion'){ st.pid = id; st.t = path().dom[0]; build(); if(!st.iv) play(); else draw(true); return; }
      if(st.view === 'vectors'){ st.op = id; build(); draw(true); return; }
      st.mid = id; st.A = VM.MATRICES[id].A.map(function(r){ return r.slice(); }); st.undo = false; st.s = 0; build(); play();
    });
    seg2.addEventListener('click', function(e){
      var b = e.target.closest('.bt-mode'); if(!b || b.disabled) return; touch(); var k = b.getAttribute('data-k');
      if(st.view === 'motion'){ st.iv = k === 'iv'; if(st.iv) st.t = Math.min(st.t, tMax()); build(); draw(true); return; }
      st.undo = k === 'U'; st.s = 0; build(); play();
    });
    /* Play: the point runs along the path, or the plane moves to its image. */
    function play(){
      pause();
      var start, end, dur, set;
      if(st.view === 'motion'){
        if(st.iv){ st.iv = false; build(); }
        var Pp = path(); if(st.t >= Pp.dom[1] - 1e-6) st.t = Pp.dom[0];
        start = st.t; end = Pp.dom[1]; dur = 5 * (end - start) / (Pp.dom[1] - Pp.dom[0]); set = function(v){ st.t = v; };
      } else { if(st.s >= 1 - 1e-6) st.s = 0; start = st.s; end = 1; dur = 1.8 * (1 - start); set = function(v){ st.s = v; }; }
      if(dur <= 0) return;
      playBtn.setAttribute('aria-pressed', 'true'); playBtn.querySelector('.vm-play-t').textContent = 'Pause';
      anim = P.loop(function(d, t){ var u = Math.min(1, t / dur), e = st.view === 'matrix' ? u * u * (3 - 2 * u) : u; set(start + (end - start) * e); draw(false); if(u >= 1) return false; },
        { duration: dur, still: function(){ set(end); }, onEnd: function(){ set(end); anim = null; stopped(); draw(true); } });
      anim.start();
    }
    function stopped(){ playBtn.setAttribute('aria-pressed', 'false'); playBtn.querySelector('.vm-play-t').textContent = 'Play'; }
    function pause(){ if(anim){ anim.stop(); anim = null; } stopped(); }
    playBtn.addEventListener('click', function(){ touch(); if(anim) pause(); else play(); });
    wrap.addEventListener('keydown', function(e){
      var d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
      if(!d || e.target !== wrap) return;
      e.preventDefault(); pause(); touch();
      if(st.view === 'motion'){ var Pp = path(), stp = Pp.pi ? PI / 24 : 0.1; st.t = clamp(Math.round((st.t + d * stp * (e.shiftKey ? 4 : 1)) / stp) * stp, Pp.dom[0], tMax()); }
      else if(st.view === 'matrix') st.s = clamp(st.s + d * 0.05, 0, 1);
      draw(true);
    });

    /* ---------------- the scene */
    function draw(full){
      var w = Math.max(280, Math.round(wrap.clientWidth || 640)), h = Math.max(260, Math.round(wrap.clientHeight || 420)), out;
      size = [w, h]; svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      if(st.view === 'motion') out = drawMotion(w, h); else if(st.view === 'vectors') out = drawVectors(w, h); else out = drawMatrix(w, h);
      scn.innerHTML = out;
      if(slider){ var v = st.view === 'motion' ? st.t : st.view === 'matrix' ? st.s : st.k; if(Math.abs(slider.value() - v) > 1e-6) slider.set(v); if(st.view === 'motion'){ var o = slider.el.querySelector('output'); if(o) o.textContent = 't = ' + tText(st.t, path().pi); } }
      words(full);
    }
    function drawMotion(w, h){
      var Pp = path(), wide = w >= h * 1.15, out = [];
      var pb = wide ? { x0: 6, y0: 6, w: w * 0.6 - 12, h: h - 12 } : { x0: 6, y0: 4, w: w - 12, h: h * 0.6 - 8 };
      var xs = [], ys = [], i; for(i = 0; i <= 120; i++){ var tt = Pp.dom[0] + (Pp.dom[1] - Pp.dom[0]) * i / 120; xs.push(Pp.x(tt)); ys.push(Pp.y(tt)); }
      var xa = Math.min(-1, Math.floor(Math.min.apply(null, xs)) - 1), xb = Math.max(1, Math.ceil(Math.max.apply(null, xs)) + 1), ya = Math.min(-1, Math.floor(Math.min.apply(null, ys)) - 1), yb = Math.max(1, Math.ceil(Math.max.apply(null, ys)) + 1);
      var g = plane(pb, xa, xb, ya, yb);
      out.push(gridSvg(g));
      out.push('<path class="vm-path is-ghost" d="' + pathD(g, Pp.x, Pp.y, Pp.dom[0], Pp.dom[1], 240) + '"/>');
      var tEnd = st.iv ? Pp.dom[1] : st.t;
      if(tEnd > Pp.dom[0]) out.push('<path class="vm-path" d="' + pathD(g, Pp.x, Pp.y, Pp.dom[0], tEnd, Math.max(8, Math.round(240 * (tEnd - Pp.dom[0]) / (Pp.dom[1] - Pp.dom[0])))) + '"/>');
      // direction chevrons along the path
      for(i = 1; i < 8; i++){
        var tc = Pp.dom[0] + (Pp.dom[1] - Pp.dom[0]) * i / 8, e = 0.002 * (Pp.dom[1] - Pp.dom[0]);
        var ax = g.sx(Pp.x(tc)), ay = g.sy(Pp.y(tc)), bx = g.sx(Pp.x(tc + e)) - g.sx(Pp.x(tc - e)), by = g.sy(Pp.y(tc + e)) - g.sy(Pp.y(tc - e)), L = Math.hypot(bx, by) || 1; bx /= L; by /= L;
        out.push('<path class="vm-chev" d="M' + r1(ax - bx * 6 - by * 5) + ' ' + r1(ay - by * 6 + bx * 5) + 'L' + r1(ax + bx * 4) + ' ' + r1(ay + by * 4) + 'L' + r1(ax - bx * 6 + by * 5) + ' ' + r1(ay - by * 6 - bx * 5) + '"/>');
      }
      var gb1, gb2;
      if(wide){ gb1 = { x0: w * 0.6, y0: 4, w: w * 0.4 - 4, h: h / 2 - 4 }; gb2 = { x0: w * 0.6, y0: h / 2, w: w * 0.4 - 4, h: h / 2 - 4 }; }
      else { gb1 = { x0: 0, y0: h * 0.6, w: w / 2, h: h * 0.4 }; gb2 = { x0: w / 2, y0: h * 0.6, w: w / 2, h: h * 0.4 }; }
      var gx = tGraph(gb1, Pp.x, Pp.dom, 'c-x', 'x(t)', Pp.pi), gy = tGraph(gb2, Pp.y, Pp.dom, 'c-y', 'y(t)', Pp.pi);
      out.push(gx.svg, gy.svg);
      if(st.iv){
        var t1 = st.t, t2 = st.t + dt(), p1 = [Pp.x(t1), Pp.y(t1)], p2 = [Pp.x(t2), Pp.y(t2)];
        out.push('<line class="vm-leg c-x" x1="' + r1(g.sx(p1[0])) + '" y1="' + r1(g.sy(p1[1])) + '" x2="' + r1(g.sx(p2[0])) + '" y2="' + r1(g.sy(p1[1])) + '"/>');
        out.push('<line class="vm-leg c-y" x1="' + r1(g.sx(p2[0])) + '" y1="' + r1(g.sy(p1[1])) + '" x2="' + r1(g.sx(p2[0])) + '" y2="' + r1(g.sy(p2[1])) + '"/>');
        out.push(arrow(g, p1, p2, 'c-w'));
        [[t1, p1], [t2, p2]].forEach(function(q){ out.push('<circle class="vm-ipt" cx="' + r1(g.sx(q[1][0])) + '" cy="' + r1(g.sy(q[1][1])) + '" r="5"/>'); });
        [[gx, Pp.x], [gy, Pp.y]].forEach(function(G2){
          var gg = G2[0], f = G2[1];
          out.push('<rect class="vm-ishade" x="' + r1(gg.gx(t1)) + '" y="' + r1(gg.T) + '" width="' + r1(gg.gx(t2) - gg.gx(t1)) + '" height="' + r1(gg.B - gg.T) + '"/>');
          out.push('<line class="vm-sec" x1="' + r1(gg.gx(t1)) + '" y1="' + r1(gg.gy(f(t1))) + '" x2="' + r1(gg.gx(t2)) + '" y2="' + r1(gg.gy(f(t2))) + '"/>');
          [t1, t2].forEach(function(t){ out.push('<circle class="vm-ipt" cx="' + r1(gg.gx(t)) + '" cy="' + r1(gg.gy(f(t))) + '" r="4.5"/>'); });
        });
      } else {
        var px = Pp.x(st.t), py = Pp.y(st.t);
        out.push('<line class="vm-proj c-x" x1="' + r1(g.sx(px)) + '" y1="' + r1(g.sy(py)) + '" x2="' + r1(g.sx(px)) + '" y2="' + r1(g.sy(0)) + '"/><line class="vm-proj c-y" x1="' + r1(g.sx(px)) + '" y1="' + r1(g.sy(py)) + '" x2="' + r1(g.sx(0)) + '" y2="' + r1(g.sy(py)) + '"/>');
        out.push('<circle class="vm-pt" cx="' + r1(g.sx(px)) + '" cy="' + r1(g.sy(py)) + '" r="7"/>');
        [[gx, Pp.x], [gy, Pp.y]].forEach(function(G2){ var gg = G2[0], v = G2[1](st.t); out.push('<line class="vm-cur" x1="' + r1(gg.gx(st.t)) + '" y1="' + r1(gg.T) + '" x2="' + r1(gg.gx(st.t)) + '" y2="' + r1(gg.B) + '"/><circle class="vm-pt" cx="' + r1(gg.gx(st.t)) + '" cy="' + r1(gg.gy(v)) + '" r="5.5"/>'); });
      }
      wrap.setAttribute('aria-valuemin', M.fixed(Pp.dom[0], 2)); wrap.setAttribute('aria-valuemax', M.fixed(tMax(), 2)); wrap.setAttribute('aria-valuenow', M.fixed(st.t, 2));
      wrap.setAttribute('aria-valuetext', 't = ' + tText(st.t, Pp.pi) + ', x = ' + num(Pp.x(st.t)) + ', y = ' + num(Pp.y(st.t)));
      H.place(hU, g, false); H.place(hV, g, false); H.place(hP, g, false);
      return out.join('');
    }
    function result(){ return st.op === 'add' ? VM.add(st.u, st.v) : st.op === 'sub' ? VM.sub(st.u, st.v) : VM.scale(st.k, st.u); }
    function drawVectors(w, h){
      var g = plane({ x0: 6, y0: 6, w: w - 12, h: h - 12 }, -7, 7, -6, 6), out = [gridSvg(g)], O = [0, 0], u = st.u, v = st.v, r = result();
      if(st.op === 'add'){
        out.push('<path class="vm-para" d="M' + r1(g.sx(0)) + ' ' + r1(g.sy(0)) + 'L' + r1(g.sx(u[0])) + ' ' + r1(g.sy(u[1])) + 'L' + r1(g.sx(r[0])) + ' ' + r1(g.sy(r[1])) + 'L' + r1(g.sx(v[0])) + ' ' + r1(g.sy(v[1])) + 'Z"/>');
        out.push(arrow(g, u, r, 'c-v is-copy'), arrow(g, v, r, 'c-u is-copy'));
      } else if(st.op === 'sub'){
        out.push(arrow(g, v, u, 'c-w is-copy'));
      }
      out.push(arrow(g, O, r, 'c-w', st.op === 'add' ? 'u + v' : st.op === 'sub' ? 'u − v' : (st.k === -1 ? '−' : VM.n(st.k)) + 'u', 0.62));
      out.push(arrow(g, O, u, 'c-u', 'u'));
      if(st.op !== 'scale') out.push(arrow(g, O, v, 'c-v', 'v'));
      H.place(hU, g, true); H.place(hV, g, st.op !== 'scale'); H.place(hP, g, false);
      return out.join('');
    }
    function drawMatrix(w, h){
      var g = plane({ x0: 6, y0: 6, w: w - 12, h: h - 12 }, -4.6, 4.6, -4.6, 4.6), out = [gridSvg(g, { labels: true })];
      var Ai = VM.inverse(st.A), B = st.undo && Ai ? VM.blend(st.A, 1).map(function(row, i){ return row.map(function(x, j){ return (1 - st.s) * x + st.s * (i === j ? 1 : 0); }); }) : VM.blend(st.A, st.s);
      // the image of the grid lines
      var lines = [], m;
      for(m = -12; m <= 12; m++){
        var a1 = VM.apply(B, [m, -24]), a2 = VM.apply(B, [m, 24]), b1 = VM.apply(B, [-24, m]), b2 = VM.apply(B, [24, m]);
        lines.push('<line' + (m === 0 ? ' class="vm-iax"' : '') + ' x1="' + r1(g.sx(a1[0])) + '" y1="' + r1(g.sy(a1[1])) + '" x2="' + r1(g.sx(a2[0])) + '" y2="' + r1(g.sy(a2[1])) + '"/>');
        lines.push('<line' + (m === 0 ? ' class="vm-iax"' : '') + ' x1="' + r1(g.sx(b1[0])) + '" y1="' + r1(g.sy(b1[1])) + '" x2="' + r1(g.sx(b2[0])) + '" y2="' + r1(g.sy(b2[1])) + '"/>');
      }
      out.push('<defs><clipPath id="vm-clip"><rect x="' + r1(g.box.x0) + '" y="' + r1(g.box.y0) + '" width="' + r1(g.box.w) + '" height="' + r1(g.box.h) + '" rx="8"/></clipPath></defs>');
      out.push('<g class="vm-igrid" clip-path="url(#vm-clip)">' + lines.join('') + '</g>');
      out.push('<path class="vm-usq" d="M' + r1(g.sx(0)) + ' ' + r1(g.sy(0)) + 'H' + r1(g.sx(1)) + 'V' + r1(g.sy(1)) + 'H' + r1(g.sx(0)) + 'Z"/>');
      var sq = [[0, 0], [1, 0], [1, 1], [0, 1]].map(function(p){ return VM.apply(B, p); });
      out.push('<path class="vm-isq" d="M' + sq.map(function(p){ return r1(g.sx(p[0])) + ' ' + r1(g.sy(p[1])); }).join('L') + 'Z"/>');
      var c1 = [B[0][0], B[1][0]], c2 = [B[0][1], B[1][1]];
      out.push(arrow(g, [0, 0], c1, 'c-u', '(' + num(c1[0]) + ', ' + num(c1[1]) + ')'), arrow(g, [0, 0], c2, 'c-v', '(' + num(c2[0]) + ', ' + num(c2[1]) + ')'));
      var D = VM.det(B), cen = VM.apply(B, [0.5, 0.5]);
      if(Math.abs(D) > 0.15) out.push('<text class="vm-area" x="' + r1(g.sx(cen[0])) + '" y="' + r1(g.sy(cen[1]) + 4) + '" text-anchor="middle">' + num(Math.abs(D)) + '</text>');
      var ip = VM.apply(B, st.p);
      out.push('<line class="vm-trip" x1="' + r1(g.sx(st.p[0])) + '" y1="' + r1(g.sy(st.p[1])) + '" x2="' + r1(g.sx(ip[0])) + '" y2="' + r1(g.sy(ip[1])) + '"/>');
      out.push('<circle class="vm-pt is-img" cx="' + r1(g.sx(ip[0])) + '" cy="' + r1(g.sy(ip[1])) + '" r="6.5"/>');
      H.place(hU, g, false); H.place(hV, g, false); H.place(hP, g, true);
      wrap.setAttribute('aria-valuetext', 'Matrix at ' + Math.round(st.s * 100) + ' percent: the unit square has area ' + num(Math.abs(D)));
      return out.join('');
    }

    /* ---------------- words */
    var lastCap = '';
    function words(full){
      var head, body, det, pills;
      if(st.view === 'motion'){
        var Pp = path(), pi = Pp.pi;
        if(st.iv){
          var t1 = st.t, t2 = st.t + dt(), R = VM.avgRates(Pp, t1, t2), T1 = tText(t1, pi), T2 = tText(t2, pi);
          head = esc('On [' + T1 + ', ' + T2 + ']: x changes ' + num(R.rx) + ' per unit of t and y changes ' + num(R.ry) + ' per unit of t, so the point moves ' + VM.dirWords(R.dx, R.dy) + ' overall.');
          body = '<ol class="vm-feats"><li>' + html('$\\frac{\\Delta x}{\\Delta t} = \\frac{x(t_2) - x(t_1)}{t_2 - t_1} = \\frac{' + M.fixed(R.dx, 3) + '}{' + M.fixed(t2 - t1, 3) + '} \\approx ' + M.fixed(R.rx, 3) + '$: the slope of the secant on the graph of $x(t)$.') + '</li>' +
            '<li>' + html('$\\frac{\\Delta y}{\\Delta t} \\approx ' + M.fixed(R.ry, 3) + '$, the slope of the secant on the graph of $y(t)$.') + '</li>' +
            '<li>' + html(isFinite(R.slope) ? 'The green arrow is the displacement $\\left\\langle ' + M.fixed(R.dx, 2) + ', ' + M.fixed(R.dy, 2) + ' \\right\\rangle$; its slope $\\frac{\\Delta y}{\\Delta x} \\approx ' + M.fixed(R.slope, 3) + '$ is the ratio of the two average rates.' : 'The displacement is vertical: $\\Delta x = 0$, so its slope is undefined.') + '</li></ol>';
          pills = [{ k: 'Δx/Δt', html: '<span class="vm-pv c-x">' + num(R.rx) + '</span>', tone: 'readout' }, { k: 'Δy/Δt', html: '<span class="vm-pv c-y">' + num(R.ry) + '</span>', tone: 'readout' }];
        } else {
          var x = Pp.x(st.t), y = Pp.y(st.t), e = 1e-4, ddx = Pp.x(Math.min(st.t + e, Pp.dom[1])) - Pp.x(Math.max(st.t - e, Pp.dom[0])), ddy = Pp.y(Math.min(st.t + e, Pp.dom[1])) - Pp.y(Math.max(st.t - e, Pp.dom[0]));
          head = esc('t = ' + tText(st.t, pi) + ': the point is at (' + num(x) + ', ' + num(y) + ') and moving ' + VM.dirWords(Math.abs(ddx) < 1e-9 ? 0 : ddx, Math.abs(ddy) < 1e-9 ? 0 : ddy) + '.');
          body = '<ol class="vm-feats"><li>' + html('$x(t) = ' + Pp.tex.x + '$ and $y(t) = ' + Pp.tex.y + '$ for $t$ in $[0, ' + (pi ? '2\\pi' : VM.n(Pp.dom[1])) + ']$.') + '</li>' +
            '<li>' + esc('Each value of t gives one point (x(t), y(t)). The arrows on the path show the way it is traced as t increases' + (st.pid === 'clock' ? ': this circle goes clockwise, unlike 3 cos t, 3 sin t.' : '.')) + '</li>' +
            '<li>' + esc('The graphs of x(t) and y(t) are the two shadows of the motion: where x(t) rises the point moves right, where y(t) rises it moves up.') + '</li></ol>';
          pills = phoneNow() ? [{ html: 't ' + esc(tText(st.t, pi)) + ' · <span class="vm-pv c-p">(' + num(x) + ', ' + num(y) + ')</span>', tone: 'ghost' }] : [{ k: 't', html: esc(tText(st.t, pi)), tone: 'readout' }, { k: '(x, y)', html: '<span class="vm-pv c-p">(' + num(x) + ', ' + num(y) + ')</span>', tone: 'readout' }];
        }
        det = '<h3 class="ls-title-l">' + esc(Pp.name) + '</h3><table class="ls-tbl"><tbody><tr><th scope="row">x(t)</th><td>' + tex(Pp.tex.x) + '</td></tr><tr><th scope="row">y(t)</th><td>' + tex(Pp.tex.y) + '</td></tr></tbody></table>' + motionTable(Pp);
      } else if(st.view === 'vectors'){
        var u = st.u, v = st.v, r = result(), d = VM.dot(u, v), mu = VM.mag(u), mv = VM.mag(v), name = st.op === 'add' ? 'u + v' : st.op === 'sub' ? 'u − v' : VM.n(st.k) + 'u';
        head = esc(name + ' = ⟨' + num(r[0]) + ', ' + num(r[1]) + '⟩, magnitude ' + num(VM.mag(r)) + '.' + (st.op === 'add' ? ' Tip to tail: the diagonal of the parallelogram.' : st.op === 'sub' ? ' It points from the tip of v to the tip of u.' : st.k < 0 ? ' A negative k turns it around.' : ''));
        body = '<ol class="vm-feats"><li>' + html(st.op === 'scale' ? '$k\\mathbf{u} = ' + VM.n(st.k) + VM.vTex(u) + ' = ' + VM.vTex(r) + '$: each entry times $k$, and the length is $|k|$ times as long.' : '$' + VM.vTex(u) + (st.op === 'add' ? ' + ' : ' - ') + VM.vTex(v) + ' = ' + VM.vTex(r) + '$: entry by entry.') + '</li>' +
          '<li>' + html('$\\left\\| \\mathbf{w} \\right\\| = \\sqrt{' + VM.n(r[0]) + '^2 + ' + VM.n(r[1]) + '^2} = ' + VM.rootTex(r[0] * r[0] + r[1] * r[1]) + '$' + (Number.isInteger(r[0]) && Number.isInteger(r[1]) ? '' : '')) + '</li>' +
          '<li>' + html('$\\mathbf{u} \\cdot \\mathbf{v} = ' + d + '$: ' + (d === 0 ? 'zero, so $\\mathbf{u}$ and $\\mathbf{v}$ are perpendicular.' : d > 0 ? 'positive, so the angle between them is less than $\\frac{\\pi}{2}$.' : 'negative, so the angle between them is more than $\\frac{\\pi}{2}$.')) + '</li></ol>';
        pills = [{ k: name, html: '<span class="vm-pv c-w">⟨' + num(r[0]) + ', ' + num(r[1]) + '⟩</span>', tone: 'readout' }].concat(phoneNow() ? [] : [{ k: '‖' + name + '‖', html: num(VM.mag(r)), tone: 'readout' }, { k: 'u · v', html: String(d), tone: 'readout' }]);
        var ang = mu && mv ? Math.acos(clamp(d / (mu * mv), -1, 1)) : NaN;
        det = '<table class="ls-tbl"><thead><tr><th scope="col">Vector</th><th scope="col">Components</th><th scope="col" class="r">Magnitude</th><th scope="col" class="r">Direction θ</th></tr></thead><tbody>' +
          [['u', u, 'c-u'], ['v', v, 'c-v'], [name, r, 'c-w']].map(function(q){ return '<tr><th scope="row" class="vm-pv ' + q[2] + '">' + esc(q[0]) + '</th><td>⟨' + num(q[1][0]) + ', ' + num(q[1][1]) + '⟩</td><td class="r">' + num(VM.mag(q[1])) + '</td><td class="r">' + (VM.mag(q[1]) ? F(VM.angle(q[1]), 3) : '—') + '</td></tr>'; }).join('') + '</tbody></table>' +
          '<p>' + html('Dot product $\\mathbf{u} \\cdot \\mathbf{v} = (' + u[0] + ')(' + v[0] + ') + (' + u[1] + ')(' + v[1] + ') = ' + d + '$.') + (isFinite(ang) ? ' ' + html('Angle between them: $\\cos\\theta = \\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\left\\| \\mathbf{u} \\right\\| \\left\\| \\mathbf{v} \\right\\|}$, so $\\theta \\approx ' + M.fixed(ang, 3) + '$.') : '') + '</p>';
      } else {
        var A = st.A, D = VM.det(A), Ai = VM.inverse(A), what = st.mid ? VM.MATRICES[st.mid].what : 'is your own matrix';
        var colTex = function(Mx){ return '\\left[ \\begin{matrix} ' + VM.n(Mx[0][0]) + ' & ' + VM.n(Mx[0][1]) + ' \\\\ ' + VM.n(Mx[1][0]) + ' & ' + VM.n(Mx[1][1]) + ' \\end{matrix} \\right]'; };
        head = esc((st.undo ? 'A⁻¹ carries the image back: the square returns to the unit square. ' : 'A ' + what + '. ') + (Math.abs(D) < 1e-12 ? 'det A = 0: the square flattens, and A has no inverse.' : 'det A = ' + num(D) + ', so areas are multiplied by ' + num(Math.abs(D)) + (D < 0 ? ' and the plane is flipped over.' : '.')));
        body = '<ol class="vm-feats"><li>' + html('$A = ' + colTex(A) + '$ sends $(1, 0)$ to its first column $(' + VM.n(A[0][0]) + ', ' + VM.n(A[1][0]) + ')$ and $(0, 1)$ to its second $(' + VM.n(A[0][1]) + ', ' + VM.n(A[1][1]) + ')$; every other point follows: $A\\left[ \\begin{matrix} x \\\\ y \\end{matrix} \\right] = x\\cdot$ column 1 $+ \\; y\\cdot$ column 2.') + '</li>' +
          '<li>' + html('$\\det A = ad - bc = (' + VM.n(A[0][0]) + ')(' + VM.n(A[1][1]) + ') - (' + VM.n(A[0][1]) + ')(' + VM.n(A[1][0]) + ') = ' + VM.n(D) + '$: the area of the green parallelogram.') + '</li>' +
          '<li>' + html(Ai ? '$A^{-1} = \\frac{1}{' + VM.n(D) + '}\\left[ \\begin{matrix} ' + VM.n(A[1][1]) + ' & ' + VM.n(-A[0][1]) + ' \\\\ ' + VM.n(-A[1][0]) + ' & ' + VM.n(A[0][0]) + ' \\end{matrix} \\right]$ undoes $A$: $A^{-1}A$ is the identity.' : 'With $\\det A = 0$ two different points land on the same image point, so nothing can undo $A$.') + '</li></ol>';
        var ip = VM.apply(A, st.p);
        pills = [{ k: 'det A', html: '<span class="vm-pv c-w">' + num(D) + '</span>', tone: 'readout' }].concat(phoneNow() ? [] : [{ k: 'p → Ap', html: '<span class="vm-pv c-p">(' + st.p[0] + ', ' + st.p[1] + ') → (' + num(ip[0]) + ', ' + num(ip[1]) + ')</span>', tone: 'readout' }]);
        det = '<h3 class="ls-title-l">' + tex('A = ' + colTex(A)) + '</h3><table class="ls-tbl"><tbody><tr><th scope="row">det A</th><td>' + num(D) + '</td></tr><tr><th scope="row">A⁻¹</th><td>' + (Ai ? tex(colTex(Ai.map(function(row){ return row.map(function(x){ return M.round(x, 3); }); }))) : 'none (det A = 0)') + '</td></tr><tr><th scope="row">p</th><td>(' + st.p[0] + ', ' + st.p[1] + ')</td></tr><tr><th scope="row">Ap</th><td>(' + num(ip[0]) + ', ' + num(ip[1]) + ')</td></tr></tbody></table>';
      }
      T.explain($('.vm-say'), head, body);
      $('.vm-det').innerHTML = det;
      if(LS){
        if(head !== lastCap){ LS.caption(head, 'explore'); lastCap = head; }
        LS.pills(pills, 'left', 'explore');
        LS.pills([{ html: 'Beyond the exam', tone: 'ghost' }], 'right', 'explore');
      }
      if(full) say(T.plainText(head));
    }
    function motionTable(Pp){
      var rows = [], n = 8;
      for(var i = 0; i <= n; i++){ var t = Pp.dom[0] + (Pp.dom[1] - Pp.dom[0]) * i / n; rows.push('<tr><td>' + esc(tText(t, Pp.pi)) + '</td><td class="r">' + num(Pp.x(t)) + '</td><td class="r">' + num(Pp.y(t)) + '</td></tr>'); }
      return '<table class="ls-tbl"><thead><tr><th scope="col">t</th><th scope="col" class="r">x(t)</th><th scope="col" class="r">y(t)</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>';
    }
    if(window.ResizeObserver) new ResizeObserver(function(){ var w = Math.round(wrap.clientWidth), h = Math.round(wrap.clientHeight); if(w && h && (Math.max(280, w) !== size[0] || Math.max(260, h) !== size[1])) draw(false); }).observe(wrap);

    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'pcalc-ls-stage vm-ls-stage'; stage.appendChild(host.querySelector('.vm-stage'));
      s.add('stage', stage, o);
      var dock = document.createElement('div'); dock.className = 'pcalc-ls-dock vm-ls-dock'; dock.appendChild(host.querySelector('.vm-ctl'));
      if(more){
        var row = document.createElement('button');
        row.type = 'button'; row.className = 'ls-linkrow pcalc-ls-setup';
        row.innerHTML = '<span><span class="ls-k">Settings</span><span class="ls-v">matrix entries, interval</span></span>' + window.LevlStudio.icon('more');
        row.setAttribute('aria-label', 'Settings: the matrix entries and the interval length (opens Details)');
        row.addEventListener('click', function(){ s.open('details', more.querySelector('summary')); });
        dock.appendChild(row);
      }
      s.add('dock', dock, o);
      var why = document.createElement('div'); why.className = 'ls-sec pcalc-ls-why vm-ls-why'; why.appendChild(cue.el); why.appendChild(host.querySelector('.vm-say'));
      s.add('why', why, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      var det = document.createElement('div'); det.className = 'ls-sec pcalc-ls-det vm-ls-det';
      if(more){ more.classList.add('pcalc-ls-more'); more.open = true; more.querySelector('summary').textContent = 'Settings'; det.appendChild(more); }
      det.appendChild(host.querySelector('.vm-det'));
      s.add('details', det, o);
      lastCap = '';
      draw(true);
      if(s.mode() === 'explore') s.hint({ target: playBtn, text: 'Play to send the point along its path', key: 'apprecalc-vectors-matrices-play' });
    }
    build(); draw(true);
    return { pause: pause, studio: studio };
  }

  /* ============================================================ test yourself */
  var METHOD = {
    x: 'Put the value of t into x(t), then into y(t): each gives one coordinate.',
    y: 'Square t first, then multiply by the coefficient and add the terms.',
    dir: 'Compare x and y at the two ends of the interval: x up means right, y up means up.',
    rx: 'Average rate of change of x = (x(t₂) − x(t₁)) / (t₂ − t₁).',
    ry: 'Average rate of change of y = (y(t₂) − y(t₁)) / (t₂ − t₁).',
    m: 'Slope = Δy / Δx between the two points: the rate of y divided by the rate of x.',
    wx: 'Multiply u by k entry by entry, then add v entry by entry.',
    wy: 'Use the second entries: k times the second entry of u, plus the second entry of v.',
    mag: 'Magnitude = √(x² + y²) of the result.',
    dot: 'Dot product = (first × first) + (second × second).',
    qx: 'x′ is the first row of A times the point: a·x + b·y.',
    qy: 'y′ is the second row of A times the point: c·x + d·y.',
    area: 'The area factor is |det A| = |ad − bc|.',
    det: 'det A = ad − bc, with a, b the first row and c, d the second.',
    inv: 'A 2 by 2 matrix has an inverse exactly when det A ≠ 0.',
    img: 'Areas are multiplied by |det A|.',
    i11: 'A⁻¹ = (1/det A) · [[d, −b], [−c, a]]: the top-left entry is d / det A.'
  };
  function quiz(host, data){
    var fig = null;
    T.drill(host, data, { slug: 'vectors-matrices', noun: 'drill',
      types: VM.KINDS.map(function(k){ return { value: k, label: VM.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: VM.generate, title: function(p){ return p.title; },
      extra: function(el, p){
        fig = drillFig(el, p);
        var s = studioNow();
        if(s) setTimeout(function(){ s.caption(String(p.text).replace(/<\/?p[^>]*>/g, ' ').trim(), 'quiz'); s.pills([{ html: 'Beyond the exam', tone: 'ghost' }], 'right', 'quiz'); }, 0);
      },
      method: function(s){ return METHOD[s.key]; },
      onStep: function(s){ if(fig) fig.step(s.key); },
      onTry: function(s, t){ return fig ? fig.tryOn(s, t) : false; } });
  }
  function drillFig(el, p){
    var f = p.fig, box = document.createElement('div'); box.className = 'vm-figwrap';
    box.innerHTML = '<svg class="vm-fig" role="img"></svg>'; el.appendChild(box);
    var svgEl = box.querySelector('svg'), done = {}, wrong = null, last = '';
    function dims(){ var bw = box.clientWidth, bh = box.clientHeight; if(bw > 100 && bh > 100) return [Math.round(bw), Math.round(bh)]; return (window.innerWidth || 1280) <= 640 ? [340, 340] : [600, 400]; }
    function draw(){
      var d = dims(), w = d[0], h = d[1], out = [], label, g;
      var full = { x0: 6, y0: 6, w: w - 12, h: h - 12 };
      if(f.kind === 'path' || f.kind === 'prates'){
        var X0 = function(t){ return VM.pEval(f.cx, t); }, Y0 = function(t){ return VM.pEval(f.cy, t); }, xs = [], ys = [];
        for(var i = 0; i <= 60; i++){ var tt = f.dom[0] + (f.dom[1] - f.dom[0]) * i / 60; xs.push(X0(tt)); ys.push(Y0(tt)); }
        g = plane(full, Math.min(-1, Math.floor(Math.min.apply(null, xs)) - 1), Math.max(1, Math.ceil(Math.max.apply(null, xs)) + 1), Math.min(-1, Math.floor(Math.min.apply(null, ys)) - 1), Math.max(1, Math.ceil(Math.max.apply(null, ys)) + 1));
        out.push(gridSvg(g));
        var showPath = f.kind === 'prates' || done.y;
        if(showPath) out.push('<path class="vm-path" d="' + pathD(g, X0, Y0, f.dom[0], f.dom[1], 160) + '"/>');
        if(f.kind === 'path'){
          if(done.x || done.y){ var q = [X0(f.t0), Y0(f.t0)]; out.push('<circle class="vm-pt" cx="' + r1(g.sx(q[0])) + '" cy="' + r1(g.sy(q[1])) + '" r="6.5"/><text class="vm-plab" x="' + r1(g.sx(q[0]) + 9) + '" y="' + r1(g.sy(q[1]) - 9) + '">t = ' + f.t0 + '</text>'); }
          if(done.dir) out.push(arrow(g, [X0(f.t1), Y0(f.t1)], [X0(f.t2), Y0(f.t2)], 'c-w'));
          label = 'Plane for the particle' + (showPath ? ', with its path drawn' : '');
        } else {
          var p1 = [X0(f.t1), Y0(f.t1)], p2 = [X0(f.t2), Y0(f.t2)];
          [[f.t1, p1], [f.t2, p2]].forEach(function(q2){ out.push('<circle class="vm-ipt" cx="' + r1(g.sx(q2[1][0])) + '" cy="' + r1(g.sy(q2[1][1])) + '" r="5.5"/><text class="vm-plab" x="' + r1(g.sx(q2[1][0]) + 9) + '" y="' + r1(g.sy(q2[1][1]) - 9) + '">t = ' + q2[0] + '</text>'); });
          if(done.rx) out.push('<line class="vm-leg c-x" x1="' + r1(g.sx(p1[0])) + '" y1="' + r1(g.sy(p1[1])) + '" x2="' + r1(g.sx(p2[0])) + '" y2="' + r1(g.sy(p1[1])) + '"/>');
          if(done.ry) out.push('<line class="vm-leg c-y" x1="' + r1(g.sx(p2[0])) + '" y1="' + r1(g.sy(p1[1])) + '" x2="' + r1(g.sx(p2[0])) + '" y2="' + r1(g.sy(p2[1])) + '"/>');
          if(done.m) out.push(arrow(g, p1, p2, 'c-w'));
          if(wrong && wrong.m != null && isFinite(wrong.m)){ var L = 3, dx = L / Math.sqrt(1 + wrong.m * wrong.m); out.push('<line class="vm-yours" x1="' + r1(g.sx(p1[0])) + '" y1="' + r1(g.sy(p1[1])) + '" x2="' + r1(g.sx(p1[0] + dx * Math.sign(p2[0] - p1[0] || 1))) + '" y2="' + r1(g.sy(p1[1] + wrong.m * dx * Math.sign(p2[0] - p1[0] || 1))) + '"/>'); }
          label = 'Plane with the particle at t = ' + f.t1 + ' and t = ' + f.t2;
        }
      } else if(f.kind === 'vectors'){
        var ext = [f.u, f.v, f.w, VM.scale(f.k, f.u)], mx = 3;
        ext.forEach(function(v2){ mx = Math.max(mx, Math.abs(v2[0]) + 1, Math.abs(v2[1]) + 1); });
        g = plane(full, -mx, mx, -mx, mx); out.push(gridSvg(g));
        out.push(arrow(g, [0, 0], f.u, 'c-u', 'u'), arrow(g, [0, 0], f.v, 'c-v', 'v'));
        if(done.wx || done.wy){ var ku = VM.scale(f.k, f.u); out.push(arrow(g, [0, 0], ku, 'c-u is-copy', (f.k === -1 ? '−' : f.k) + 'u', 0.6), arrow(g, ku, f.w, 'c-v is-copy')); }
        if(done.wy) out.push(arrow(g, [0, 0], f.w, 'c-w', 'w', 0.6));
        if(wrong && wrong.w){ out.push('<circle class="vm-yours-pt" cx="' + r1(g.sx(wrong.w[0])) + '" cy="' + r1(g.sy(wrong.w[1])) + '" r="6"/>'); }
        label = 'Grid with the vectors u and v' + (done.wy ? ' and w' : '');
      } else {
        var A = f.A, pts = [[0, 0], [1, 0], [1, 1], [0, 1]].map(function(q3){ return VM.apply(A, q3); }), all = pts.concat(f.p ? [f.p, f.q] : []), m2 = 2;
        all.forEach(function(q3){ m2 = Math.max(m2, Math.abs(q3[0]) + 1, Math.abs(q3[1]) + 1); });
        g = plane(full, -m2, m2, -m2, m2); out.push(gridSvg(g));
        out.push('<path class="vm-usq" d="M' + r1(g.sx(0)) + ' ' + r1(g.sy(0)) + 'H' + r1(g.sx(1)) + 'V' + r1(g.sy(1)) + 'H' + r1(g.sx(0)) + 'Z"/>');
        var showImg = f.kind === 'inverse' ? true : done.area;
        if(showImg){
          out.push('<path class="vm-isq" d="M' + pts.map(function(q3){ return r1(g.sx(q3[0])) + ' ' + r1(g.sy(q3[1])); }).join('L') + 'Z"/>');
          out.push(arrow(g, [0, 0], [A[0][0], A[1][0]], 'c-u'), arrow(g, [0, 0], [A[0][1], A[1][1]], 'c-v'));
          if(done.area || done.det){ var D = VM.det(A), cc = VM.apply(A, [0.5, 0.5]); if(Math.abs(D) > 0) out.push('<text class="vm-area" x="' + r1(g.sx(cc[0])) + '" y="' + r1(g.sy(cc[1]) + 4) + '" text-anchor="middle">' + Math.abs(D) + '</text>'); }
        }
        if(f.p){
          out.push('<circle class="vm-pt" cx="' + r1(g.sx(f.p[0])) + '" cy="' + r1(g.sy(f.p[1])) + '" r="6"/><text class="vm-plab" x="' + r1(g.sx(f.p[0]) + 9) + '" y="' + r1(g.sy(f.p[1]) - 9) + '">(' + f.p[0] + ', ' + f.p[1] + ')</text>');
          if(done.qy){ out.push('<line class="vm-trip" x1="' + r1(g.sx(f.p[0])) + '" y1="' + r1(g.sy(f.p[1])) + '" x2="' + r1(g.sx(f.q[0])) + '" y2="' + r1(g.sy(f.q[1])) + '"/><circle class="vm-pt is-img" cx="' + r1(g.sx(f.q[0])) + '" cy="' + r1(g.sy(f.q[1])) + '" r="6"/>'); }
          if(wrong && wrong.q) out.push('<circle class="vm-yours-pt" cx="' + r1(g.sx(wrong.q[0])) + '" cy="' + r1(g.sy(wrong.q[1])) + '" r="6"/>');
        }
        label = 'Grid with the unit square' + (showImg ? ' and its image under A' : '');
      }
      svgEl.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svgEl.setAttribute('aria-label', label); svgEl.innerHTML = out.join('');
    }
    function step(key){ done[key] = true; wrong = null; draw(); }
    function tryOn(s, t){
      if(t.ok || !isFinite(t.value)) return false;
      if(f.kind === 'prates' && s.key === 'm'){ wrong = { m: t.value }; draw(); return 'The dashed line has your slope from the first point; the segment must reach the second point.'; }
      if(f.kind === 'vectors' && (s.key === 'wx' || s.key === 'wy')){ wrong = { w: s.key === 'wx' ? [t.value, f.w[1]] : [f.w[0], t.value] }; draw(); return 'The hollow dot is where your component puts the tip of w.'; }
      if(f.kind === 'transform' && (s.key === 'qx' || s.key === 'qy')){ wrong = { q: s.key === 'qx' ? [t.value, f.q[1]] : [f.q[0], t.value] }; draw(); return 'The hollow dot is where your answer puts the image.'; }
      return false;
    }
    draw();
    if(window.ResizeObserver) new ResizeObserver(function(){ var k = box.clientWidth + 'x' + box.clientHeight; if(k !== last){ last = k; draw(); } }).observe(box);
    return { step: step, tryOn: tryOn };
  }
})();
