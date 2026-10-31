/* Parametric motion (Unit 9, Premium; docs/apcalcbc-spec.md section 6). Job: a
   particle traced by (x(t), y(t)) with its velocity and acceleration vectors,
   speed, slope and concavity live, and the distance travelled shown as the
   area under the speed graph, so 9.1-9.6 are seen, not memorized. OWNED BY
   THIS TOOL ONLY (builder T2). Runs on calculus-bc/tools/parametric-motion.html
   on top of AB's framework (ApCalcTools, calculus/assets/tools/calc-tools.js)
   and plots (ApCalcPlot), with its own model ApCalcMath.parametricMotion
   (calculus-bc/assets/tools/math/parametric-motion.js).

   Explore: pick a path. Press Play, drag the particle along its path (or the
   time on the speed graph), or use the time slider. The velocity vector (blue,
   with its dashed x and y legs), the acceleration vector (green) and the
   tangent line (vermillion) can each be switched off. Vertical and
   horizontal tangents and stops are marked on the path. With velocity given,
   the path builds from its starting point as time runs.

   Test yourself: seeded problems (slope and tangent line, the second
   derivative, arc length, velocity and acceleration vectors, position from
   velocity, speed and distance), each with its path. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot, X = window.ApCalcTex;
  (function(){
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Formulas & numbers');
  })();
  if(!T || !M || !M.parametricMotion || !P) return;
  var PM = M.parametricMotion, F = T.F, esc = T.esc;
  function html(s){ return X ? X.html(s) : s; }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function storeGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function storeSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
  function tTxt(p, t){ return F(t, 2); }
  /* A time as a multiple of pi where the path's natural times are (tick labels). */
  function piLab(v){
    var k = Math.round(v / (Math.PI / 2));
    if(Math.abs(v - k * Math.PI / 2) > 1e-6) return F(v, 1);
    if(!k) return '0';
    return k % 2 ? (k === 1 ? '' : k) + 'π/2' : (k === 2 ? '' : k / 2) + 'π';
  }

  T.mount('parametric-motion', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'parametric-motion',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.pause(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ============================================================ explore */
  function explore(host, data){
    var LS = null;
    var ids = (data.paths || []).map(function(p){ return p.id; }).filter(function(id){ return PM.PATHS[id]; });
    if(!ids.length) ids = ['ellipse', 'loop', 'eight', 'wheel'];
    var st = { id: ids[0], t: 0, playing: false, touched: false, show: { v: true, a: false, tan: true } };
    var saved = storeGet('apcalcbc_parametric-motion_path'); if(saved && ids.indexOf(saved) > -1) st.id = saved;
    try{ var sv = JSON.parse(storeGet('apcalcbc_parametric-motion_show') || 'null'); if(sv) ['v', 'a', 'tan'].forEach(function(k){ if(typeof sv[k] === 'boolean') st.show[k] = sv[k]; }); }catch(e){}
    var cache = {};
    function pa(){ return PM.PATHS[st.id]; }
    function info(){
      if(!cache[st.id]){ var p = pa(); cache[st.id] = { tb: PM.table(p, 480), sp: PM.special(p) }; }
      return cache[st.id];
    }
    var cue = T.cue('Press Play, or drag the particle along its path.');
    host.innerHTML =
      '<section class="bt-problem pm-card" aria-label="Parametric motion explorer">' +
        '<div class="pm-stage">' +
          '<div class="pm-plane-wrap" tabindex="0" role="slider" aria-label="Time: drag the particle or use the arrow keys" aria-valuemin="0"><svg class="pm-plane" aria-hidden="true"></svg><p class="pm-badge" aria-hidden="true"></p></div>' +
          '<div class="pm-speed-wrap"><svg class="pm-speed" aria-hidden="true"></svg></div>' +
          '<p class="pm-legend" aria-hidden="true"><span class="pm-lg pm-lg-path">path</span><span class="pm-lg pm-lg-v">velocity</span><span class="pm-lg pm-lg-a">acceleration</span><span class="pm-lg pm-lg-tan">tangent</span><span class="pm-lg pm-lg-d">distance = area under speed</span></p>' +
        '</div>' +
        '<div class="pm-ctl">' +
          '<div class="pm-chips ls-scroll" role="group" aria-label="Path"></div>' +
          '<div class="pm-show ls-seg" role="group" aria-label="Show on the path"><button type="button" class="bt-mode" data-k="v">Velocity</button><button type="button" class="bt-mode" data-k="a">Acceleration</button><button type="button" class="bt-mode" data-k="tan">Tangent</button></div>' +
          '<div class="pm-time"><button type="button" class="bt-btn ls-btn ls-pri pm-play">Play</button><div class="pm-slot"></div></div>' +
        '</div>' +
        '<div class="pm-say"></div>' +
        '<div class="pm-det"></div>' +
        '<p class="sr-only pm-live"></p>' +
      '</section>';
    var card = host.querySelector('.pm-card');
    card.insertBefore(cue.el, card.querySelector('.pm-say'));
    var plane = host.querySelector('.pm-plane'), pwrap = host.querySelector('.pm-plane-wrap'), speed = host.querySelector('.pm-speed'), swrap = host.querySelector('.pm-speed-wrap');
    var chips = host.querySelector('.pm-chips'), showEl = host.querySelector('.pm-show'), playBtn = host.querySelector('.pm-play'), badge = host.querySelector('.pm-badge');
    var say = T.announcer(host.querySelector('.pm-live'));
    // the options object stays ours: T.slider clamps set() to its min and max, so a new path updates them
    var so = { label: 'Time t', min: 0, max: 1, step: 0.01, value: 0, decimals: 2, onInput: function(v){ pause(); setT(v); } }, slider = T.slider(so);
    host.querySelector('.pm-slot').appendChild(slider.el);
    var loop = null, pl = null, sl = null;

    function syncShow(){ showEl.querySelectorAll('.bt-mode').forEach(function(b){ b.setAttribute('aria-pressed', String(!!st.show[b.getAttribute('data-k')])); }); }
    syncShow();
    showEl.addEventListener('click', function(e){
      var b = e.target.closest('.bt-mode'); if(!b) return;
      var k = b.getAttribute('data-k'); st.show[k] = !st.show[k]; touch(); syncShow();
      storeSet('apcalcbc_parametric-motion_show', JSON.stringify(st.show)); draw(false);
    });
    function chipsDraw(){
      chips.innerHTML = ids.map(function(id){ return '<button type="button" class="bt-btn pm-chip" data-id="' + id + '" aria-pressed="' + (id === st.id) + '">' + esc(PM.PATHS[id].name) + '</button>'; }).join('');
      var on = chips.querySelector('[aria-pressed="true"]');
      if(on) chips.scrollLeft = Math.max(0, on.offsetLeft - chips.offsetLeft - 16);
    }
    function setPath(id){
      pause(); st.id = id; storeSet('apcalcbc_parametric-motion_path', id);
      // open a little way in, where the vectors and the slope are all showing
      var p = pa(); st.t = M.round(p.t[0] + (p.t[1] - p.t[0]) * 0.14, 2);
      chipsDraw();
      so.min = p.t[0]; so.max = p.t[1]; slider.input.min = String(p.t[0]); slider.input.max = String(p.t[1]); slider.set(st.t);
      pwrap.setAttribute('aria-valuemin', M.fixed(p.t[0], 2)); pwrap.setAttribute('aria-valuemax', M.fixed(p.t[1], 2));
      pl = null; sl = null; draw(true);
    }
    chips.addEventListener('click', function(e){ var b = e.target.closest('.pm-chip'); if(b){ touch(); setPath(b.getAttribute('data-id')); } });
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }
    function setT(t){ var p = pa(); st.t = clamp(t, p.t[0], p.t[1]); touch(); draw(true); }
    function idx(t){ var p = pa(), tb = info().tb; return Math.round((t - p.t[0]) / (p.t[1] - p.t[0]) * (tb.t.length - 1)); }

    /* ------------------------------------------------ the plane */
    function planeLayout(){
      var w = Math.max(260, Math.round(pwrap.clientWidth || 600)), h = Math.max(180, Math.round(pwrap.clientHeight || 380));
      var tb = info().tb, xs = tb.x, ys = tb.y;
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      if(pa().wheel){ y0 = Math.min(y0, -0.3); y1 = Math.max(y1, 2.2); }
      var span = Math.max(x1 - x0, y1 - y0, 1), pad = span * 0.16;
      x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
      var m = 30, k = Math.min((w - 2 * m) / (x1 - x0), (h - 2 * m) / (y1 - y0));
      var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      // the view in plane units, centred, one scale on both axes
      var X0 = cx - (w / 2) / k, X1 = cx + (w / 2) / k, Y0 = cy - (h / 2) / k, Y1 = cy + (h / 2) / k;
      return { w: w, h: h, k: k, X0: X0, X1: X1, Y0: Y0, Y1: Y1, span: span,
        sx: function(x){ return (x - X0) * k; }, sy: function(y){ return (Y1 - y) * k; },
        ix: function(px){ return X0 + px / k; }, iy: function(py){ return Y1 - py / k; } };
    }
    function arrow(x1, y1, x2, y2, cls, lab, o){
      o = o || {};
      var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      if(L < 3) return '<g class="' + cls + '"><circle cx="' + r1(x1) + '" cy="' + r1(y1) + '" r="3"/></g>';
      var ux = dx / L, uy = dy / L, hl = Math.min(11, L * 0.45), hx = x2 - ux * hl, hy = y2 - uy * hl;
      var lx = x2 + ux * 12 + (o.side || 0) * -uy * 10, ly = y2 + uy * 12 + (o.side || 0) * ux * 10;
      return '<g class="' + cls + '"><line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(hx) + '" y2="' + r1(hy) + '"/>' +
        '<path d="M' + r1(x2) + ' ' + r1(y2) + 'L' + r1(hx - uy * 5) + ' ' + r1(hy + ux * 5) + 'L' + r1(hx + uy * 5) + ' ' + r1(hy - ux * 5) + 'Z"/>' +
        (lab ? '<text x="' + r1(lx) + '" y="' + r1(ly + 4) + '" text-anchor="middle">' + lab + '</text>' : '') + '</g>';
    }
    function drawPlane(){
      if(!pl) pl = planeLayout();
      var g = pl, p = pa(), I = info(), tb = I.tb, t = st.t, s = PM.at(p, t), i = idx(t), o = [], vMode = p.mode === 'v';
      plane.setAttribute('viewBox', '0 0 ' + g.w + ' ' + g.h);
      // grid and axes
      var gx = P.ticks(g.X0, g.X1, Math.max(4, Math.round(g.w / 70))), gy = P.ticks(g.Y0, g.Y1, Math.max(4, Math.round(g.h / 70)));
      o.push('<rect class="pm-bg" x="0" y="0" width="' + g.w + '" height="' + g.h + '" rx="12"/>');
      o.push('<g class="pm-grid">' + gx.map(function(v){ var px = r1(g.sx(v)); return '<line x1="' + px + '" y1="0" x2="' + px + '" y2="' + g.h + '"/>'; }).join('') + gy.map(function(v){ var py = r1(g.sy(v)); return '<line x1="0" y1="' + py + '" x2="' + g.w + '" y2="' + py + '"/>'; }).join('') + '</g>');
      var ax = g.sy(0), ay = g.sx(0);
      if(ax > 0 && ax < g.h) o.push('<line class="pm-axis" x1="0" y1="' + r1(ax) + '" x2="' + g.w + '" y2="' + r1(ax) + '"/>');
      if(ay > 0 && ay < g.w) o.push('<line class="pm-axis" x1="' + r1(ay) + '" y1="0" x2="' + r1(ay) + '" y2="' + g.h + '"/>');
      var ly = clamp(ax, 14, g.h - 6), lx = clamp(ay, 6, g.w - 40);
      o.push('<g class="pm-tk">' + gx.filter(function(v){ return Math.abs(v) > 1e-9; }).map(function(v){ return '<text x="' + r1(g.sx(v)) + '" y="' + r1(ly + (ax > g.h - 20 ? -6 : 14)) + '" text-anchor="middle">' + F(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1) + '</text>'; }).join('') +
        gy.filter(function(v){ return Math.abs(v) > 1e-9; }).map(function(v){ return '<text x="' + r1(lx + 6) + '" y="' + r1(g.sy(v) + 4) + '">' + F(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1) + '</text>'; }).join('') + '</g>');
      o.push('<text class="pm-axl" x="' + (g.w - 8) + '" y="' + r1(clamp(ax - 6, 14, g.h - 8)) + '" text-anchor="end">x</text><text class="pm-axl" x="' + r1(clamp(ay + 8, 8, g.w - 14)) + '" y="16">y</text>');
      if(p.wheel){ var gy0 = r1(g.sy(0)); o.push('<rect class="pm-ground" x="0" y="' + gy0 + '" width="' + g.w + '" height="14"/>'); }
      // the path: faint whole (not in velocity mode), traced part strong
      function pts(a, b){ var out = []; for(var j = a; j <= b; j++) out.push(r1(g.sx(tb.x[j])) + ',' + r1(g.sy(tb.y[j]))); return out.join(' '); }
      var N = tb.t.length - 1;
      if(!vMode) o.push('<polyline class="pm-path-all" points="' + pts(0, N) + '"/>');
      if(i > 0) o.push('<polyline class="pm-path-on" points="' + pts(0, i) + '"/>');
      // which way it goes: chevrons along the path
      if(!vMode) for(var c = 1; c < 6; c++){
        var j = Math.round(N * (c - 0.5) / 5), dxp = g.sx(tb.x[Math.min(N, j + 2)]) - g.sx(tb.x[Math.max(0, j - 2)]), dyp = g.sy(tb.y[Math.min(N, j + 2)]) - g.sy(tb.y[Math.max(0, j - 2)]), L = Math.hypot(dxp, dyp);
        if(L < 1e-6) continue;
        var ux = dxp / L, uy = dyp / L, cxp = g.sx(tb.x[j]), cyp = g.sy(tb.y[j]);
        o.push('<path class="pm-chev" d="M' + r1(cxp - ux * 6 - uy * 5) + ' ' + r1(cyp - uy * 6 + ux * 5) + 'L' + r1(cxp + ux * 4) + ' ' + r1(cyp + uy * 4) + 'L' + r1(cxp - ux * 6 + uy * 5) + ' ' + r1(cyp - uy * 6 - ux * 5) + '"/>');
      }
      // special points
      var S = I.sp, show = function(z){ return !vMode || z <= t + 1e-9; };
      S.vert.filter(show).forEach(function(z){ var q = PM.posAt(p, z), px = g.sx(q[0]), py = g.sy(q[1]); o.push('<line class="pm-mk-v" x1="' + r1(px) + '" y1="' + r1(py - 11) + '" x2="' + r1(px) + '" y2="' + r1(py + 11) + '"/>'); });
      S.horiz.filter(show).forEach(function(z){ var q = PM.posAt(p, z), px = g.sx(q[0]), py = g.sy(q[1]); o.push('<line class="pm-mk-h" x1="' + r1(px - 11) + '" y1="' + r1(py) + '" x2="' + r1(px + 11) + '" y2="' + r1(py) + '"/>'); });
      S.stop.filter(show).forEach(function(z){ var q = PM.posAt(p, z); o.push('<circle class="pm-mk-s" cx="' + r1(g.sx(q[0])) + '" cy="' + r1(g.sy(q[1])) + '" r="6"/>'); });
      // the start point
      o.push('<circle class="pm-start" cx="' + r1(g.sx(tb.x[0])) + '" cy="' + r1(g.sy(tb.y[0])) + '" r="4.5"/>');
      if(vMode) o.push('<text class="pm-note" x="' + r1(g.sx(tb.x[0]) + 8) + '" y="' + r1(g.sy(tb.y[0]) + 16) + '">start (' + F(p.x0, 0) + ', ' + F(p.y0, 0) + ')</text>');
      var px0 = g.sx(s.x), py0 = g.sy(s.y);
      // the rolling wheel
      if(p.wheel){
        var wc = [g.sx(t), g.sy(1)];
        o.push('<g class="pm-wheel"><circle cx="' + r1(wc[0]) + '" cy="' + r1(wc[1]) + '" r="' + r1(g.k) + '"/><line x1="' + r1(wc[0]) + '" y1="' + r1(wc[1]) + '" x2="' + r1(px0) + '" y2="' + r1(py0) + '"/><circle class="pm-hub" cx="' + r1(wc[0]) + '" cy="' + r1(wc[1]) + '" r="3"/></g>');
      }
      // tangent line
      if(st.show.tan && s.speed > 1e-6){
        var L2 = Math.max(g.w, g.h) * 0.22, ux2 = s.vx / s.speed, uy2 = s.vy / s.speed;
        o.push('<line class="pm-tan" x1="' + r1(px0 - ux2 * L2) + '" y1="' + r1(py0 + uy2 * L2) + '" x2="' + r1(px0 + ux2 * L2) + '" y2="' + r1(py0 - uy2 * L2) + '"/>');
      }
      // vectors, scaled to this path's largest
      var vmax = Math.max.apply(null, tb.sp) || 1, amax = Math.max.apply(null, tb.ax.map(function(a, j){ return Math.hypot(a, tb.ay[j]); })) || 1;
      var kv = g.span * 0.3 / vmax * g.k, ka = g.span * 0.22 / amax * g.k;
      if(st.show.v){
        var vx2 = px0 + s.vx * kv, vy2 = py0 - s.vy * kv;
        if(Math.abs(s.vx * kv) > 4 && Math.abs(s.vy * kv) > 4) o.push('<g class="pm-legs"><line x1="' + r1(px0) + '" y1="' + r1(py0) + '" x2="' + r1(vx2) + '" y2="' + r1(py0) + '"/><line x1="' + r1(vx2) + '" y1="' + r1(py0) + '" x2="' + r1(vx2) + '" y2="' + r1(vy2) + '"/></g>');
        o.push(arrow(px0, py0, vx2, vy2, 'pm-av', 'v'));
      }
      if(st.show.a) o.push(arrow(px0, py0, px0 + s.ax * ka, py0 - s.ay * ka, 'pm-aa', 'a'));
      o.push('<circle class="pm-dot" cx="' + r1(px0) + '" cy="' + r1(py0) + '" r="8"/>');
      plane.innerHTML = o.join('');
      pwrap.setAttribute('aria-valuenow', M.fixed(t, 2));
      pwrap.setAttribute('aria-valuetext', 't = ' + F(t, 2) + ': at (' + F(s.x, 2) + ', ' + F(s.y, 2) + '), velocity ⟨' + F(s.vx, 2) + ', ' + F(s.vy, 2) + '⟩, speed ' + F(s.speed, 2));
      badge.innerHTML = 'at <b>(' + F(s.x, 2) + ', ' + F(s.y, 2) + ')</b>';
    }

    /* ------------------------------------------------ the speed graph */
    function speedLayout(){
      var w = Math.max(260, Math.round(swrap.clientWidth || 600)), h = Math.max(70, Math.round(swrap.clientHeight || 110));
      var p = pa(), tb = info().tb, hi = Math.max.apply(null, tb.sp) * 1.15 || 1, L = w < 420 ? 34 : 40, R = 10, top = 8, bot = 20;
      return { w: w, h: h, L: L, R: R, top: top, bot: bot, hi: hi, pw: w - L - R, ph: h - top - bot,
        gx: function(t){ return L + (t - p.t[0]) / (p.t[1] - p.t[0]) * (w - L - R); }, gy: function(v){ return top + (1 - v / hi) * (h - top - bot); } };
    }
    function drawSpeed(){
      if(!sl) sl = speedLayout();
      var g = sl, p = pa(), tb = info().tb, t = st.t, i = idx(t), N = tb.t.length - 1, o = [];
      speed.setAttribute('viewBox', '0 0 ' + g.w + ' ' + g.h);
      o.push('<rect class="pm-panel" x="' + g.L + '" y="' + g.top + '" width="' + g.pw + '" height="' + g.ph + '" rx="6"/>');
      var yt = P.ticks(0, g.hi, 2);
      yt.forEach(function(v){ var py = r1(g.gy(v)); o.push('<line class="pm-sgrid" x1="' + g.L + '" y1="' + py + '" x2="' + (g.L + g.pw) + '" y2="' + py + '"/><text class="pm-tk" x="' + (g.L - 5) + '" y="' + (+py + 3.5) + '" text-anchor="end">' + F(v, v % 1 ? 1 : 0) + '</text>'); });
      if(i > 0){
        var area = [r1(g.gx(tb.t[0])) + ',' + r1(g.gy(0))];
        for(var j = 0; j <= i; j++) area.push(r1(g.gx(tb.t[j])) + ',' + r1(g.gy(tb.sp[j])));
        area.push(r1(g.gx(tb.t[i])) + ',' + r1(g.gy(0)));
        o.push('<polygon class="pm-dist" points="' + area.join(' ') + '"/>');
      }
      var line = []; for(var k = 0; k <= N; k++) line.push(r1(g.gx(tb.t[k])) + ',' + r1(g.gy(tb.sp[k])));
      o.push('<polyline class="pm-scurve" points="' + line.join(' ') + '"/>');
      var tt = p.piT ? P.piTicks(p.t[0], p.t[1]) : P.ticks(p.t[0], p.t[1], Math.max(4, Math.round(g.pw / 70)));
      if(p.piT && tt.length > 9) tt = tt.filter(function(v, j){ return j % 2 === 0; });
      o.push('<g class="pm-taxis">' + tt.map(function(v){ return '<text x="' + r1(g.gx(v)) + '" y="' + (g.h - 5) + '" text-anchor="middle">' + (p.piT ? piLab(v) : F(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1)) + '</text>'; }).join('') + '</g>');
      o.push('<text class="pm-sl" x="' + (g.L + 6) + '" y="' + (g.top + 13) + '">speed</text>');
      var d = tb.d[i], cx = r1(g.gx(t));
      o.push('<text class="pm-dl" x="' + (g.L + g.pw - 6) + '" y="' + (g.top + 13) + '" text-anchor="end">distance so far ' + F(d, 2) + '</text>');
      o.push('<line class="pm-cur" x1="' + cx + '" y1="' + g.top + '" x2="' + cx + '" y2="' + (g.top + g.ph) + '"/><circle class="pm-cur-pt" cx="' + cx + '" cy="' + r1(g.gy(tb.sp[i])) + '" r="4.5"/>');
      speed.innerHTML = o.join('');
    }

    /* ---------------------------------------------------- words */
    var lastCap = '';
    function words(full){
      var p = pa(), t = st.t, d = PM.describe(p, t), s = d.s, dist = info().tb.d[idx(t)];
      var slopeLi = d.state === 'stop' ? '$\\frac{dx}{dt} = \\frac{dy}{dt} = 0$: no slope from the formula here.'
        : d.state === 'vert' ? '$\\frac{dx}{dt} = 0$ and $\\frac{dy}{dt} \\ne 0$: the tangent is vertical, and $\\frac{dy}{dx}$ does not exist.'
        : '$\\frac{dy}{dx} = \\frac{dy/dt}{dx/dt} = \\frac{' + F(s.vy, 2) + '}{' + F(s.vx, 2) + '} \\approx ' + F(s.slope, 2) + '$.' + (d.state === 'horiz' ? ' A horizontal tangent: $\\frac{dy}{dt} = 0$.' : '');
      var body = '<ul class="pm-why">' +
        '<li><b>Velocity</b> $\\left\\langle x\'(t), y\'(t) \\right\\rangle = \\left\\langle ' + F(s.vx, 2) + ', ' + F(s.vy, 2) + ' \\right\\rangle$ points along the path, the way the particle moves: ' + (s.vx > 1e-9 ? 'right' : s.vx < -1e-9 ? 'left' : 'not left or right') + ' (the sign of $x\'$) and ' + (s.vy > 1e-9 ? 'up' : s.vy < -1e-9 ? 'down' : 'not up or down') + ' (the sign of $y\'$).</li>' +
        '<li><b>Speed</b> is its length: $\\sqrt{(x\')^2 + (y\')^2} \\approx ' + F(s.speed, 2) + '$. It is not $\\left|\\frac{dy}{dx}\\right|$' + (isFinite(s.slope) ? ' (here $' + F(Math.abs(s.slope), 2) + '$, the steepness of the path)' : '') + '.</li>' +
        '<li><b>Slope:</b> ' + slopeLi + '</li>' +
        (isFinite(s.d2) && Math.abs(s.vx) > 1e-6 ? '<li><b>Concavity:</b> $\\frac{d^2y}{dx^2} = \\frac{\\frac{d}{dt}(dy/dx)}{dx/dt} \\approx ' + F(s.d2, 2) + '$, so the path is concave ' + (s.d2 > 0 ? 'up' : 'down') + ' here. Divide by $\\frac{dx}{dt}$ once more: its sign can flip the answer.</li>' : '') +
        '<li><b>Distance traveled</b> since the start is the area under the speed graph: $\\int \\sqrt{(x\')^2 + (y\')^2}\\,dt \\approx ' + F(dist, 2) + '$.' + (p.mode === 'v' ? ' The position is the start plus the integral of velocity: $x(t) = ' + p.x0 + ' + \\int_0^t x\'(s)\\,ds$, and the same for $y$.' : '') + '</li>' +
        '</ul>';
      T.explain(host.querySelector('.pm-say') || (LS && LS.root.querySelector('.pm-say')), d.head, html(body));
      details(p, t, s, dist);
      if(LS && d.head !== lastCap){ LS.caption(esc(d.head), 'explore'); lastCap = d.head; }
      pills();
      if(full) say(d.head);
    }
    function pills(){
      if(!LS) return;
      var p = pa(), s = PM.at(p, st.t), narrow = false;
      try{ narrow = LS.root.classList.contains('ls-phone') || matchMedia('(max-width: 599.98px)').matches; }catch(e){}
      var slope = isFinite(s.slope) && s.speed > 1e-6 ? F(s.slope, 2) : '—';
      LS.pills(narrow ? [{ html: '<span class="pm-pk pv">speed</span> ' + F(s.speed, 2) + ' · <span class="pm-pk pt">dy/dx</span> ' + slope, tone: 'ghost' }]
        : [{ k: 'speed', html: F(s.speed, 2), tone: 'readout' }, { k: 'dy/dx', html: slope, tone: 'readout' }], 'left', 'explore');
      LS.pills([{ html: 't = ' + F(st.t, 2), tone: st.playing ? 'accent' : 'ghost' }], 'right', 'explore');
    }
    function details(p, t, s, dist){
      var rows = p.mode === 'x'
        ? [['Position', '$x(t) = ' + PM.tx(p.x) + '$, $y(t) = ' + PM.tx(p.y) + '$'], ['Velocity', '$\\left\\langle ' + PM.tx(p.dx) + ', ' + PM.tx(p.dy) + ' \\right\\rangle$'], ['Acceleration', '$\\left\\langle ' + PM.tx(p.ddx) + ', ' + PM.tx(p.ddy) + ' \\right\\rangle$']]
        : [['Velocity', '$\\left\\langle ' + PM.tx(p.dx) + ', ' + PM.tx(p.dy) + ' \\right\\rangle$'], ['Acceleration', '$\\left\\langle ' + PM.tx(p.ddx) + ', ' + PM.tx(p.ddy) + ' \\right\\rangle$'], ['Start', '$(x(0), y(0)) = (' + p.x0 + ', ' + p.y0 + ')$'], ['Position', '$x(t) = ' + p.x0 + ' + \\int_0^t x\'(s)\\,ds$, $y(t) = ' + p.y0 + ' + \\int_0^t y\'(s)\\,ds$']];
      var S = info().sp, list = function(a){ return a.length ? a.map(function(z){ return 't ≈ ' + F(z, 3); }).join(', ') : 'none'; };
      var el = host.querySelector('.pm-det') || (LS && LS.root.querySelector('.pm-det'));
      el.innerHTML = '<h3 class="ls-title-l">' + esc(p.name) + ', ' + F(p.t[0], 2) + ' ≤ t ≤ ' + F(p.t[1], 2) + '</h3><table class="ls-tbl pm-ftbl"><tbody>' + rows.map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td>' + html(r[1]) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<h3 class="ls-title-l">At t = ' + F(t, 2) + '</h3><table class="ls-tbl"><tbody>' +
        [['Position (x, y)', '(' + F(s.x, 3) + ', ' + F(s.y, 3) + ')'], ['Velocity ⟨x′, y′⟩', '⟨' + F(s.vx, 3) + ', ' + F(s.vy, 3) + '⟩'], ['Acceleration ⟨x″, y″⟩', '⟨' + F(s.ax, 3) + ', ' + F(s.ay, 3) + '⟩'], ['Speed', F(s.speed, 3)],
          ['dy/dx', isFinite(s.slope) ? F(s.slope, 3) : 'does not exist (dx/dt = 0)'], ['d²y/dx²', isFinite(s.d2) ? F(s.d2, 3) : 'does not exist (dx/dt = 0)'], ['Distance traveled since the start', F(dist, 3)]]
          .map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td class="r">' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<p class="bt-small">Vertical tangents (dx/dt = 0, dy/dt ≠ 0): ' + list(S.vert) + '. Horizontal tangents: ' + list(S.horiz) + '. Stops (speed 0): ' + list(S.stop) + '. Distances are integrated numerically (adaptive Simpson).</p>';
    }

    /* ---------------------------------------------------- time */
    function draw(full){
      drawPlane(); drawSpeed();
      if(full || !st.playing || (st.t * 4 | 0) !== draw.q){ draw.q = st.t * 4 | 0; words(full); }
      else pills();
      if(Math.abs(slider.value() - st.t) > 1e-6) slider.set(st.t);
    }
    function play(){
      var p = pa();
      if(st.t >= p.t[1] - 1e-6) st.t = p.t[0];
      st.playing = true; touch(); playBtn.textContent = 'Pause';
      var rate = (p.t[1] - p.t[0]) / 7;
      loop = P.loop(function(dt){ var q = pa(); st.t = Math.min(q.t[1], st.t + dt * rate); draw(false); if(st.t >= q.t[1]) return false; },
        { still: function(){ st.t = pa().t[1]; }, onEnd: function(){ st.playing = false; playBtn.textContent = 'Play'; draw(true); } });
      loop.start();
    }
    function pause(){ if(loop) loop.stop(); if(st.playing){ st.playing = false; playBtn.textContent = 'Play'; draw(true); } }
    playBtn.addEventListener('click', function(){ if(st.playing) pause(); else play(); });
    (function(){
      // drag on the plane: the nearest point of the path (in velocity mode, of the part traced so far or just ahead)
      function nearest(e){
        var b = plane.getBoundingClientRect(); if(!pl) return st.t;
        var px = (e.clientX - b.left) * pl.w / b.width, py = (e.clientY - b.top) * pl.h / b.height, tb = info().tb, best = 0, bd = Infinity, p = pa();
        var lim = p.mode === 'v' ? Math.min(tb.t.length - 1, idx(st.t) + 40) : tb.t.length - 1;
        for(var j = 0; j <= lim; j++){ var d = Math.hypot(pl.sx(tb.x[j]) - px, pl.sy(tb.y[j]) - py) + Math.abs(j - idx(st.t)) * 0.02; if(d < bd){ bd = d; best = j; } }
        return tb.t[best];
      }
      var on = false;
      plane.addEventListener('pointerdown', function(e){ pause(); on = true; try{ plane.setPointerCapture(e.pointerId); }catch(er){} setT(nearest(e)); });
      plane.addEventListener('pointermove', function(e){ if(on) setT(nearest(e)); });
      plane.addEventListener('pointerup', function(){ on = false; });
      plane.addEventListener('pointercancel', function(){ on = false; });
      function toT(e){ var b = speed.getBoundingClientRect(); if(!sl) return st.t; var px = (e.clientX - b.left) * sl.w / b.width, p = pa(); return clamp(p.t[0] + (px - sl.L) / sl.pw * (p.t[1] - p.t[0]), p.t[0], p.t[1]); }
      var on2 = false;
      speed.addEventListener('pointerdown', function(e){ pause(); on2 = true; try{ speed.setPointerCapture(e.pointerId); }catch(er){} setT(toT(e)); });
      speed.addEventListener('pointermove', function(e){ if(on2) setT(toT(e)); });
      speed.addEventListener('pointerup', function(){ on2 = false; });
      speed.addEventListener('pointercancel', function(){ on2 = false; });
      pwrap.addEventListener('keydown', function(e){
        var p = pa(), k = e.key, d = k === 'ArrowRight' || k === 'ArrowUp' ? 1 : k === 'ArrowLeft' || k === 'ArrowDown' ? -1 : 0;
        if(k === 'Home'){ e.preventDefault(); pause(); return setT(p.t[0]); }
        if(k === 'End'){ e.preventDefault(); pause(); return setT(p.t[1]); }
        if(!d) return;
        e.preventDefault(); pause(); setT(st.t + d * (p.t[1] - p.t[0]) * (e.shiftKey ? 0.1 : 0.01));
      });
    })();
    if(window.ResizeObserver){
      var ro = new ResizeObserver(function(){
        var w1 = Math.round(pwrap.clientWidth), h1 = Math.round(pwrap.clientHeight), w2 = Math.round(swrap.clientWidth), h2 = Math.round(swrap.clientHeight);
        if(pl && w1 === pl.w && h1 === pl.h && sl && w2 === sl.w && h2 === sl.h) return;
        pl = null; sl = null; draw(false);
      });
      ro.observe(pwrap); ro.observe(swrap);
    }

    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'calc-ls-stage pm-ls-stage'; stage.appendChild(host.querySelector('.pm-stage'));
      s.add('stage', stage, o);
      var dock = document.createElement('div'); dock.className = 'calc-ls-dock pm-ls-dock'; dock.appendChild(host.querySelector('.pm-ctl'));
      s.add('dock', dock, o);
      var why = document.createElement('div'); why.className = 'ls-sec calc-ls-why pm-ls-why'; why.appendChild(cue.el); why.appendChild(host.querySelector('.pm-say'));
      s.add('why', why, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      var det = document.createElement('div'); det.className = 'ls-sec calc-ls-det pm-ls-det'; det.appendChild(host.querySelector('.pm-det'));
      s.add('details', det, o);
      lastCap = ''; pl = null; sl = null;
      draw(true);
      if(s.mode() === 'explore') s.hint({ target: playBtn, text: 'Press Play, or drag the particle', key: 'apcalcbc-parametric-motion-play' });
    }
    setPath(st.id);
    return { pause: pause, studio: studio };
  }

  /* ============================================================ test yourself */
  function figSize(w, h){
    var W = window.innerWidth || 1280, Hh = window.innerHeight || 800;
    if(W <= 640) return [340, Math.round(Math.max(260, Math.min(420, Hh * 0.6 - 90)))];
    if(W <= 999 && Hh <= 540) return [440, Math.round(Math.max(220, Math.min(300, Hh - 110)))];
    return [w, h];
  }
  /* The plot's ranges with one scale on both axes, so the path keeps its shape. */
  function figSpec(p, path){
    var f = p.fig, sz = figSize(560, 380), xs = path.map(function(q){ return q[0]; }), ys = path.map(function(q){ return q[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    if(!f.rel){ x0 = Math.min(x0, 0); x1 = Math.max(x1, 0); y0 = Math.min(y0, 0); y1 = Math.max(y1, 0); }
    var pad = Math.max(x1 - x0, y1 - y0, 1) * 0.1; x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
    var pw = sz[0] - 48, ph = sz[1] - 40, k = Math.min(pw / (x1 - x0), ph / (y1 - y0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return { label: f.label + ', for t from ' + PM.n(f.a, 2) + ' to ' + PM.n(f.b, 2), width: sz[0], height: sz[1], x: [cx - pw / 2 / k, cx + pw / 2 / k], y: [cy - ph / 2 / k, cy + ph / 2 / k], xLabel: 'x', yLabel: 'y', curves: [], points: [] };
  }
  function pathSvg(Fr, p, path, hidden){
    if(hidden) return '<g class="pm-fig" aria-hidden="true"><circle class="pm-fmark" cx="' + r1(Fr.sx(path[0][0])) + '" cy="' + r1(Fr.sy(path[0][1])) + '" r="6"/><text class="pm-flab" x="' + r1(Fr.sx(path[0][0]) + 9) + '" y="' + r1(Fr.sy(path[0][1]) - 9) + '" paint-order="stroke">start, t = ' + esc(PM.n(path[0][2], 2)) + '</text></g>';
    var pts = path.map(function(q){ return r1(Fr.sx(q[0])) + ',' + r1(Fr.sy(q[1])); }).join(' '), o = ['<g class="pm-fig" aria-hidden="true"><polyline class="pm-fpath" points="' + pts + '"/>'];
    var N = path.length - 1;
    for(var c = 1; c < 5; c++){
      var j = Math.round(N * (c - 0.5) / 4), a = path[Math.max(0, j - 2)], b = path[Math.min(N, j + 2)], dx = Fr.sx(b[0]) - Fr.sx(a[0]), dy = Fr.sy(b[1]) - Fr.sy(a[1]), L = Math.hypot(dx, dy);
      if(L < 1e-6) continue;
      var ux = dx / L, uy = dy / L, cx = Fr.sx(path[j][0]), cy = Fr.sy(path[j][1]);
      o.push('<path class="pm-fchev" d="M' + r1(cx - ux * 6 - uy * 5) + ' ' + r1(cy - uy * 6 + ux * 5) + 'L' + r1(cx + ux * 4) + ' ' + r1(cy + uy * 4) + 'L' + r1(cx - ux * 6 + uy * 5) + ' ' + r1(cy - uy * 6 - ux * 5) + '"/>');
    }
    o.push('<circle class="pm-fstart" cx="' + r1(Fr.sx(path[0][0])) + '" cy="' + r1(Fr.sy(path[0][1])) + '" r="4"/>');
    if(p.fig.mark != null){
      var m = path.reduce(function(best, q){ return Math.abs(q[2] - p.fig.mark) < Math.abs(best[2] - p.fig.mark) ? q : best; }, path[0]);
      o.push('<circle class="pm-fmark" cx="' + r1(Fr.sx(m[0])) + '" cy="' + r1(Fr.sy(m[1])) + '" r="6"/><text class="pm-flab" x="' + r1(Fr.sx(m[0]) + 9) + '" y="' + r1(Fr.sy(m[1]) - 9) + '" paint-order="stroke">t = ' + esc(p.fig.markLabel || PM.n(p.fig.mark, 2)) + '</text>');
    }
    o.push('</g>');
    return o.join('');
  }
  function pathFigure(box, p){
    var marks = T.tries(), path = PM.figPath(p.fig, 240), me = { marks: marks, path: path, hidden: !!p.fig.hide };
    function redraw(){
      var spec = figSpec(p, path), svg;
      try{ svg = P.svg(spec); }catch(e){ return; }
      var Fr = P.frame(spec);
      box.innerHTML = '<div class="pm-figwrap">' + svg.replace(/<\/svg>$/, pathSvg(Fr, p, path, me.hidden) + marks.svg(Fr) + '</svg>') + '</div>';
    }
    redraw();
    me.redraw = redraw;
    return me;
  }
  var METHOD = {
    dxdt: 'Differentiate x(t), then put the time in.', dydt: 'Differentiate y(t), then put the time in.',
    dydx: 'dy/dx = (dy/dt) ÷ (dx/dt): y over x, both derivatives with respect to t.', line: 'Point (x(t), y(t)) and slope dy/dx at that time: y − y₀ = m(x − x₀).',
    vert: 'A vertical tangent needs dx/dt = 0 while dy/dt ≠ 0.', dd: 'Differentiate dy/dx with respect to t (quotient rule or term by term).',
    d2: 'd²y/dx² = [d/dt (dy/dx)] ÷ (dx/dt).', cc: 'Concavity is the sign of d²y/dx².',
    setup: 'Write the integral first: speed for length, the start plus the integral for position.', len: 'Length = ∫ √((x′)² + (y′)²) dt over the interval.',
    vx: 'The x-component of velocity is x′(t).', vy: 'The y-component of velocity is y′(t).', ay: 'The y-component of acceleration is y″(t).',
    dir: 'Left or right: the sign of x′. Up or down: the sign of y′.', xT: 'x(T) = x(start) + ∫ x′(t) dt from the start time to T.', yT: 'y(T) = y(start) + ∫ y′(t) dt from the start time to T.',
    spd: 'Speed = √((x′)² + (y′)²) at that time.', dist: 'Distance traveled = ∫ speed dt over the interval.', yinc: 'y increases where dy/dt > 0.'
  };
  function onTry(fig, s, t, p){
    if(!fig) return false;
    var v = p.values, who = t.ok || t.shown ? 'right' : 'yours', k = s.key, mk = [], last = fig.last || (fig.last = {});
    var val = who === 'right' && s.kind === 'num' ? s.cell.answer : t.value, path = fig.path;
    var at = path.reduce(function(best, q){ return Math.abs(q[2] - v.t0) < Math.abs(best[2] - v.t0) ? q : best; }, path[0]);
    if(k === 'dydx' && s.kind === 'num' && isFinite(val) && v.t0 != null) mk.push({ tangent: [at[0], at[1]], slope: val, half: Math.max(1, Math.abs(path[path.length - 1][0] - path[0][0]) / 5), who: who, label: (who === 'yours' ? 'yours: slope ' : 'slope ') + T.numText(val) });
    if(k === 'xT' && isFinite(val)) mk.push({ vline: val, who: who, label: (who === 'yours' ? 'yours: ' : '') + 'x = ' + T.numText(val) });
    // the path of a position problem shows once its last coordinate is right or shown
    if(k === 'yT' && who === 'right') fig.hidden = false;
    if(k === 'yT' && isFinite(val)) mk.push({ hline: val, who: who, label: (who === 'yours' ? 'yours: ' : '') + 'y = ' + T.numText(val) });
    if(!mk.length) return false;
    if(who === 'yours') last[k] = mk; else if(last[k]) mk = last[k].concat(mk);
    fig.marks.set(k, mk); fig.redraw();
    return true;
  }
  function quiz(host, data){
    var fig = null;
    T.drill(host, data, { slug: 'parametric-motion', noun: 'drill',
      types: PM.KINDS.map(function(k){ return { value: k, label: PM.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: PM.generate, title: function(p){ return p.title; },
      extra: function(el, p, api){
        var box = document.createElement('div'); box.className = 'pm-figbox'; el.appendChild(box);
        fig = pathFigure(box, p);
        var s = api.area && window.LevlStudio && window.LevlStudio.get && document.getElementById('app').getAttribute('data-studio') ? window.LevlStudio.get() : null;
        if(s) setTimeout(function(){ s.caption(String(p.text).replace(/<\/?p[^>]*>/g, ' ').trim(), 'quiz'); }, 0);
      },
      method: function(s){ return METHOD[s.key]; },
      onTry: function(s, t, api){ return onTry(fig, s, t, api.problem); } });
  }
})();
