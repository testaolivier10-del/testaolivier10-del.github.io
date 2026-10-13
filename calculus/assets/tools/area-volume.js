/* Area and volume trainer (simulator; docs/apcalc-spec.md section 6). OWNED BY
   THIS TOOL ONLY. The model is ApCalcMath.areaVolume
   (calculus/assets/tools/math/area-volume.js); the 2D region is drawn with
   ApCalcPlot (calc-plot.js), the solid with this file's small canvas
   renderer (no WebGL needed): the model's quads, rotated, depth-sorted and
   lit, then the highlighted slice and its R, r or s on top. Math text is
   ApCalcTex.

   Explore: Area | Discs and washers | Cross sections. The region on the
   left (or on top on a phone) with the representative slice the student
   drags; the solid in 3D beside it (drag to turn it, arrow keys when it has
   focus). Dock: the mode, then the axis (and the line's position) or the
   cross-section shape; Setup opens the region list. The caption is the
   integral with its numbers; Why sets it up step by step; Details has the
   numbers.

   Test yourself: ApCalcTools.drill, nine kinds (area in x, in y, with three
   crossings; squares; triangles and semicircles; discs about the axes and
   about other lines; washers about the axes and about other lines). The
   region is on the stage; each answered step draws itself on it (limits,
   radius), and the solid appears in 3D at the end. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot;
  if(!T || !M || !M.areaVolume || !P) return;
  var A = M.areaVolume, esc = T.esc, NS = 'http://www.w3.org/2000/svg';
  function tex(s, o){ return window.ApCalcTex ? window.ApCalcTex.render(s, o || {}) : esc(s); }
  function html(s){ return window.ApCalcTex ? window.ApCalcTex.html(s) : esc(s); }
  function r2(v){ return Math.round(v * 100) / 100; }
  function clean(v, d){ return String(+(+v).toFixed(d == null ? 2 : d)).replace('-', '−'); }
  function d3(v){ return T.F(v, 3); }
  function reduced(){ return T.reduced ? T.reduced() : false; }
  function dark(){ return document.documentElement.getAttribute('data-theme') === 'dark'; }

  /* ================================================== the 3D renderer */
  /* Solid(host): a canvas that draws a region's solid. set({ reg, setup, u })
     then draw(). Drag (or arrow keys) turns it; the view survives a redraw. */
  function Solid(host, o){
    o = o || {};
    var cv = document.createElement('canvas'), ctx = cv.getContext('2d'), yaw = o.yaw != null ? o.yaw : -0.75, pitch = o.pitch != null ? o.pitch : 0.36, st = null, meshC = null, key = '';
    cv.className = 'av-canvas'; cv.setAttribute('tabindex', '0'); cv.setAttribute('role', 'img');
    host.appendChild(cv);
    var drag = null;
    cv.addEventListener('pointerdown', function(e){ drag = [e.clientX, e.clientY, yaw, pitch]; try{ cv.setPointerCapture(e.pointerId); }catch(err){} cv.classList.add('is-drag'); if(o.onTouch) o.onTouch(); });
    cv.addEventListener('pointermove', function(e){ if(!drag) return; yaw = drag[2] + (e.clientX - drag[0]) * 0.011; pitch = Math.max(-1.35, Math.min(1.35, drag[3] + (e.clientY - drag[1]) * 0.011)); draw(); });
    function up(){ drag = null; cv.classList.remove('is-drag'); }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('keydown', function(e){
      var k = e.key, s = e.shiftKey ? 0.35 : 0.12;
      if(k === 'ArrowLeft') yaw -= s; else if(k === 'ArrowRight') yaw += s; else if(k === 'ArrowUp') pitch = Math.min(1.35, pitch + s); else if(k === 'ArrowDown') pitch = Math.max(-1.35, pitch - s);
      else if(k === 'Home'){ yaw = -0.75; pitch = 0.36; } else return;
      e.preventDefault(); draw(); if(o.onTouch) o.onTouch();
    });
    function set(next){
      st = next;
      var k2 = JSON.stringify([next.reg.id, next.reg.v, next.reg.f, next.reg.g, next.reg.a, next.reg.b, next.setup]);
      if(k2 !== key){ key = k2; meshC = A.mesh(next.reg, next.setup, o.n || 56, o.m || 40); }
      draw();
    }
    function colors(){
      var dk = dark();
      return { solid: dk ? [235, 120, 155] : [176, 18, 58], inner: dk ? [107, 180, 232] : [0, 114, 178], cap: dk ? [245, 160, 185] : [196, 60, 95],
        cross: dk ? [242, 154, 92] : [213, 94, 0], slice: dk ? 'rgba(255,214,102,0.8)' : 'rgba(240,173,0,0.78)', sliceEdge: dk ? '#FFE08A' : '#7A5200',
        ink: dk ? '#ECECEC' : '#1E1E1E', faint: dk ? 'rgba(236,236,236,0.55)' : 'rgba(30,30,30,0.55)', axis: dk ? '#C3A3E0' : '#5B3A86', bg: dk ? '#1c1c1e' : '#ffffff' };
    }
    function draw(){
      if(!st) return;
      var w = Math.max(160, host.clientWidth || 320), h = Math.max(160, host.clientHeight || 280), dpr = Math.min(2, window.devicePixelRatio || 1);
      if(cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)){ cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      var C = colors(), reg = st.reg, setup = st.setup, qs = meshC.quads;
      // the box around the solid and the axis, for centering and scale
      var mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
      qs.forEach(function(q){ q.p.forEach(function(p){ for(var i = 0; i < 3; i++){ if(p[i] < mn[i]) mn[i] = p[i]; if(p[i] > mx[i]) mx[i] = p[i]; } }); });
      if(setup.kind === 'rev'){ if(setup.axis.dir === 'h'){ mn[1] = Math.min(mn[1], setup.axis.at); mx[1] = Math.max(mx[1], setup.axis.at); } else { mn[0] = Math.min(mn[0], setup.axis.at); mx[0] = Math.max(mx[0], setup.axis.at); } }
      // known cross sections stand on a base lying flat: the section height is up
      var lay = setup.kind === 'cross';
      if(lay){ var m0 = mn, m1 = mx; mn = [m0[0], m0[2], -m1[1]]; mx = [m1[0], m1[2], -m0[1]]; }
      var c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], rad = Math.max(1e-6, Math.sqrt(Math.pow(mx[0] - mn[0], 2) + Math.pow(mx[1] - mn[1], 2) + Math.pow(mx[2] - mn[2], 2)) / 2);
      var sc = 0.46 * Math.min(w, h) / rad, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), foc = 5 * rad;
      function view(p){
        if(lay) p = [p[0], p[2], -p[1]];
        var x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2];
        var x1 = cy * x + sy * z, z1 = -sy * x + cy * z;          // yaw about Y
        var y2 = cp * y - sp * z1, z2 = sp * y + cp * z1;          // pitch about X
        var k = foc / (foc - z2);                                   // a gentle perspective
        return [w / 2 + x1 * sc * k, h / 2 - y2 * sc * k, z2];
      }
      var L = [0.35, 0.55, 0.76], ln = Math.sqrt(L[0] * L[0] + L[1] * L[1] + L[2] * L[2]); L = L.map(function(v){ return v / ln; });
      var polys = qs.map(function(q){
        var v = q.p.map(view), z = (v[0][2] + v[1][2] + v[2][2] + v[3][2]) / 4;
        // normal in view space from two edges (a degenerate quad uses the next one)
        var a = [v[2][0] - v[0][0], v[2][1] - v[0][1], v[2][2] - v[0][2]], b = [v[3][0] - v[1][0], v[3][1] - v[1][1], v[3][2] - v[1][2]];
        var n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], nl = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
        var lam = Math.abs((n[0] * L[0] - n[1] * L[1] + n[2] * L[2]) / nl);
        return { v: v, z: z, t: q.t, lam: lam };
      }).sort(function(p, q){ return p.z - q.z; });
      var base = setup.kind === 'rev' ? C.solid : C.cross;
      polys.forEach(function(p){
        var col = p.t === 'in' ? C.inner : p.t === 'cap' ? C.cap : base, f = 0.3 + 0.7 * p.lam;
        var fill = 'rgba(' + Math.round(col[0] * f + 255 * (1 - f) * 0.18) + ',' + Math.round(col[1] * f + 255 * (1 - f) * 0.18) + ',' + Math.round(col[2] * f + 255 * (1 - f) * 0.18) + ',0.86)';
        ctx.beginPath(); ctx.moveTo(p.v[0][0], p.v[0][1]); for(var i = 1; i < 4; i++) ctx.lineTo(p.v[i][0], p.v[i][1]); ctx.closePath();
        ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = fill; ctx.lineWidth = 0.6; ctx.stroke();
      });
      // the region itself, in the plane Z = 0
      var outline = [], N = 80, i;
      for(i = 0; i <= N; i++){ var u = reg.a + (reg.b - reg.a) * i / N; outline.push(reg.v === 'x' ? [u, reg.F(u), 0] : [reg.F(u), u, 0]); }
      for(i = N; i >= 0; i--){ var u2 = reg.a + (reg.b - reg.a) * i / N; outline.push(reg.v === 'x' ? [u2, reg.Gf(u2), 0] : [reg.Gf(u2), u2, 0]); }
      ctx.beginPath(); outline.map(view).forEach(function(p, j){ if(j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = C.faint; ctx.lineWidth = 1.4; ctx.stroke(); ctx.setLineDash([]);
      // the axis of rotation, past both ends
      if(setup.kind === 'rev'){
        var ex = (reg.b - reg.a) * 0.18, A0 = setup.axis.dir === 'h' ? [reg.a - ex, setup.axis.at, 0] : [setup.axis.at, reg.a - ex, 0], A1 = setup.axis.dir === 'h' ? [reg.b + ex, setup.axis.at, 0] : [setup.axis.at, reg.b + ex, 0];
        var p0 = view(A0), p1 = view(A1);
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.setLineDash([8, 5]); ctx.strokeStyle = C.axis; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        label(p1, 'axis', C.axis, 6, -6);
      }
      // the highlighted slice
      if(st.u != null){
        var sl = A.slice(reg, setup, st.u, 64);
        ctx.beginPath();
        sl.loops.forEach(function(lp){ lp.map(view).forEach(function(p, j){ if(j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); });
        ctx.fillStyle = C.slice; ctx.fill('evenodd'); ctx.strokeStyle = C.sliceEdge; ctx.lineWidth = 1.6; ctx.stroke();
        var put = reg.v === 'x' ? function(wv, zv){ return [st.u, wv, zv]; } : function(wv, zv){ return [wv, st.u, zv]; };
        if(setup.kind === 'rev'){
          var k = setup.axis.at, ctr = view(put(k, 0)), aR = 1.05, ar = 2.55;
          var pR = view(put(k + sl.R * Math.cos(aR), sl.R * Math.sin(aR)));
          seg(ctr, pR, C.ink, 2.2); label(pR, 'R = ' + clean(sl.R), C.ink, 6, -4);
          if(sl.r > 1e-6){ var pr = view(put(k + sl.r * Math.cos(ar), sl.r * Math.sin(ar))); seg(ctr, pr, C.ink, 2.2); label(pr, 'r = ' + clean(sl.r), C.ink, -6, -4, 'right'); }
          dot(ctr, C.ink);
        } else {
          var e0 = view(put(sl.bot, 0)), e1 = view(put(sl.top, 0));
          seg(e0, e1, C.ink, 2.4); label([(e0[0] + e1[0]) / 2, (e0[1] + e1[1]) / 2], 's = ' + clean(sl.s), C.ink, 8, 14);
        }
      }
      if(o.onDraw) o.onDraw();
      function seg(p, q, col, wd){ ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.stroke(); }
      function dot(p, col){ ctx.beginPath(); ctx.arc(p[0], p[1], 3.2, 0, 7); ctx.fillStyle = col; ctx.fill(); }
      function label(p, t, col, dx, dy, align){
        ctx.font = '800 13px ' + (getComputedStyle(document.body).getPropertyValue('--font-ui') || 'system-ui');
        ctx.textAlign = align || 'left'; ctx.lineWidth = 4; ctx.strokeStyle = C.bg; ctx.lineJoin = 'round';
        var x = Math.max(4, Math.min(w - 4, p[0] + dx)), y = Math.max(14, Math.min(h - 4, p[1] + dy));
        ctx.strokeText(t, x, y); ctx.fillStyle = col; ctx.fillText(t, x, y);
      }
    }
    return { el: cv, set: set, draw: draw, label: function(t){ cv.setAttribute('aria-label', t); } };
  }

  /* A draggable slice handle on the 2D plot (along u only). */
  function sliceHandle(svg, F, o){
    var g = document.createElementNS(NS, 'g'), u = o.u;
    g.setAttribute('class', 'av-handle'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'slider');
    g.innerHTML = '<circle class="av-halo" r="18"/><circle class="av-dot" r="8"/>';
    svg.appendChild(g);
    function pos(){ var w = o.at(u); return o.v === 'x' ? [F.sx(u), F.sy(w)] : [F.sx(w), F.sy(u)]; }
    function place(){ var p = pos(); g.setAttribute('transform', 'translate(' + r2(p[0]) + ' ' + r2(p[1]) + ')'); g.setAttribute('aria-valuenow', String(+u.toFixed(3))); g.setAttribute('aria-valuemin', String(+o.lo.toFixed(3))); g.setAttribute('aria-valuemax', String(+o.hi.toFixed(3))); g.setAttribute('aria-valuetext', o.label(u)); g.setAttribute('aria-label', 'The slice: ' + o.label(u)); }
    function set(v, fire){ u = Math.max(o.lo, Math.min(o.hi, v)); place(); if(fire) o.onMove(u); }
    var on = false;
    function local(e){ var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(), q = m ? pt.matrixTransform(m.inverse()) : pt; return o.v === 'x' ? F.ix(q.x) : F.iy(q.y); }
    g.addEventListener('pointerdown', function(e){ on = true; try{ g.setPointerCapture(e.pointerId); }catch(err){} g.classList.add('is-drag'); e.preventDefault(); e.stopPropagation(); });
    g.addEventListener('pointermove', function(e){ if(on) set(local(e), true); });
    function up(){ on = false; g.classList.remove('is-drag'); if(o.onEnd) o.onEnd(u); }
    g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    g.addEventListener('keydown', function(e){
      var k = e.key, s = (o.hi - o.lo) / 50 * (e.shiftKey ? 5 : 1);
      if(k === 'ArrowRight' || k === 'ArrowUp') set(u + s, true); else if(k === 'ArrowLeft' || k === 'ArrowDown') set(u - s, true);
      else if(k === 'Home') set(o.lo, true); else if(k === 'End') set(o.hi, true); else return;
      e.preventDefault(); if(o.onEnd) o.onEnd(u);
    });
    place();
    return { el: g, set: set, get: function(){ return u; } };
  }
  /* The region's 2D picture: two curves, the shaded region, the axis, the
     strip at u with R and r (or s), as an SVG string over a spec. */
  function regionSvg(reg, F, o){
    var out = [], v = reg.v, pts = [], N = 160, i;
    for(i = 0; i <= N; i++){ var u = reg.a + (reg.b - reg.a) * i / N; pts.push(v === 'x' ? [F.sx(u), F.sy(reg.F(u))] : [F.sx(reg.F(u)), F.sy(u)]); }
    for(i = N; i >= 0; i--){ var u2 = reg.a + (reg.b - reg.a) * i / N; pts.push(v === 'x' ? [F.sx(u2), F.sy(reg.Gf(u2))] : [F.sx(reg.Gf(u2)), F.sy(u2)]); }
    out.push('<polygon class="av-region" points="' + pts.map(function(p){ return r2(p[0]) + ',' + r2(p[1]); }).join(' ') + '"/>');
    // the two curves across the whole view
    [['F', 'av-f', reg.ftex], ['Gf', 'av-g', reg.gtex]].forEach(function(c){
      var fn = reg[c[0]], lo = v === 'x' ? F.x[0] : F.y[0], hi = v === 'x' ? F.x[1] : F.y[1], d = '', pen = false;
      for(var j = 0; j <= 240; j++){
        var t = lo + (hi - lo) * j / 240, w = fn(t), ok = isFinite(w) && (v === 'x' ? w >= F.y[0] - 1 && w <= F.y[1] + 1 : w >= F.x[0] - 1 && w <= F.x[1] + 1);
        if(!ok){ pen = false; continue; }
        var p = v === 'x' ? [F.sx(t), F.sy(Math.max(F.y[0] - 1, Math.min(F.y[1] + 1, w)))] : [F.sx(w), F.sy(t)];
        d += (pen ? 'L' : 'M') + r2(p[0]) + ' ' + r2(p[1]); pen = true;
      }
      out.push('<path class="av-curve ' + c[1] + '" d="' + d + '"/>');
    });
    // crossings
    [reg.a].concat(reg.cuts, [reg.b]).forEach(function(u){ var w = reg.F(u); if(Math.abs(w - reg.Gf(u)) < 1e-6){ var p = v === 'x' ? [F.sx(u), F.sy(w)] : [F.sx(w), F.sy(u)]; out.push('<circle class="av-cross" cx="' + r2(p[0]) + '" cy="' + r2(p[1]) + '" r="4"/>'); } });
    if(o.axis){
      var ax = o.axis;
      out.push(ax.dir === 'h' ? '<line class="av-axis" x1="' + F.pad.l + '" x2="' + (F.w - F.pad.r) + '" y1="' + r2(F.sy(ax.at)) + '" y2="' + r2(F.sy(ax.at)) + '"/>' : '<line class="av-axis" y1="' + F.pad.t + '" y2="' + (F.h - F.pad.b) + '" x1="' + r2(F.sx(ax.at)) + '" x2="' + r2(F.sx(ax.at)) + '"/>');
      out.push('<text class="av-axlab" ' + (ax.dir === 'h' ? 'x="' + (F.pad.l + 6) + '" y="' + r2(F.sy(ax.at) - 6) + '"' : 'x="' + r2(F.sx(ax.at) + 6) + '" y="' + (F.pad.t + 30) + '"') + '>axis</text>');
    }
    return out.join('');
  }
  function stripSvg(reg, F, u, o){
    var v = reg.v, du = (reg.b - reg.a) / 40, top = A.hi(reg, u), bot = A.lo(reg, u), out = [];
    if(v === 'x') out.push('<rect class="av-strip" x="' + r2(F.sx(u - du / 2)) + '" y="' + r2(F.sy(top)) + '" width="' + r2(Math.max(3, F.sx(u + du / 2) - F.sx(u - du / 2))) + '" height="' + r2(Math.max(1, F.sy(bot) - F.sy(top))) + '"/>');
    else out.push('<rect class="av-strip" y="' + r2(F.sy(u + du / 2)) + '" x="' + r2(F.sx(bot)) + '" height="' + r2(Math.max(3, F.sy(u - du / 2) - F.sy(u + du / 2))) + '" width="' + r2(Math.max(1, F.sx(top) - F.sx(bot))) + '"/>');
    var P2 = function(w){ return v === 'x' ? [F.sx(u), F.sy(w)] : [F.sx(w), F.sy(u)]; };
    if(o.axis){
      var k = o.axis.at, q = A.radii(reg, o.axis, u), far = Math.abs(top - k) >= Math.abs(bot - k) ? top : bot, near = far === top ? bot : top;
      var p0 = P2(k), p1 = P2(far), p2 = P2(near), off = v === 'x' ? [14, 0] : [0, -14];
      out.push('<line class="av-R" x1="' + r2(p0[0] + off[0]) + '" y1="' + r2(p0[1] + off[1]) + '" x2="' + r2(p1[0] + off[0]) + '" y2="' + r2(p1[1] + off[1]) + '"/>');
      out.push('<text class="av-Rl" x="' + r2((p0[0] + p1[0]) / 2 + off[0] + (v === 'x' ? 6 : 0)) + '" y="' + r2((p0[1] + p1[1]) / 2 + off[1] + (v === 'x' ? 4 : -6)) + '">R</text>');
      if(q.r > 1e-6){ out.push('<line class="av-r" x1="' + r2(p0[0] - off[0]) + '" y1="' + r2(p0[1] - off[1]) + '" x2="' + r2(p2[0] - off[0]) + '" y2="' + r2(p2[1] - off[1]) + '"/>');
        out.push('<text class="av-rl" x="' + r2((p0[0] + p2[0]) / 2 - off[0] - (v === 'x' ? 6 : 0)) + '" y="' + r2((p0[1] + p2[1]) / 2 - off[1] + (v === 'x' ? 4 : 16)) + '" text-anchor="' + (v === 'x' ? 'end' : 'middle') + '">r</text>'); }
    } else if(o.cross){
      var a = P2(bot), b = P2(top);
      out.push('<text class="av-Rl" x="' + r2((a[0] + b[0]) / 2 + (v === 'x' ? 12 : 0)) + '" y="' + r2((a[1] + b[1]) / 2 + (v === 'x' ? 4 : -10)) + '">s</text>');
    }
    return out.join('');
  }
  function viewOf(reg, axis, base){
    var lo = reg.a, hi = reg.b, e = A.extent(reg), ylo = e[0], yhi = e[1];
    if(axis){ if(axis.dir === 'h'){ ylo = Math.min(ylo, axis.at); yhi = Math.max(yhi, axis.at); } else { lo = Math.min(lo, axis.at); hi = Math.max(hi, axis.at); } }
    if(base){ lo = Math.min(lo, base.x[0]); hi = Math.max(hi, base.x[1]); ylo = Math.min(ylo, base.y[0]); yhi = Math.max(yhi, base.y[1]); }
    var padU = (hi - lo) * 0.16 + 0.15, padW = (yhi - ylo) * 0.16 + 0.15;
    var U = [lo - padU, hi + padU], W = [ylo - padW, yhi + padW];
    return reg.v === 'x' ? { x: U, y: W } : { x: W, y: U };
  }

  T.mount('area-volume', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'area-volume', explore: function(h){ ex = explore(h, data); }, quiz: function(h){ quiz(h, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* =========================================================== explore */
  var MODES = [{ k: 'area', t: 'Area' }, { k: 'rev', t: 'Revolve' }, { k: 'cross', t: 'Cross sections' }];
  var AXES = [{ k: 'xaxis', t: 'x-axis' }, { k: 'h', t: 'Line y = k' }, { k: 'yaxis', t: 'y-axis' }, { k: 'v', t: 'Line x = h' }];
  var SHAPES = [{ k: 'square', t: 'Square' }, { k: 'tri', t: 'Equilateral triangle' }, { k: 'semi', t: 'Semicircle' }];
  function explore(host, data){
    var rid = 'sqrt-sq', mode = 'area', axisK = 'xaxis', lineAt = -1, shape = 'square', inY = false, reg = null, u = 0.5, LS = null, touched = false;
    var svg = null, F = null, H = null, solid = null, nid = T.nid('av');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    function $$(q){ var a = Array.prototype.slice.call(host.querySelectorAll(q)); return LS ? a.concat(Array.prototype.slice.call(LS.root.querySelectorAll(q))) : a; }
    function seg(cls, items, label){ return '<div class="ls-seg av-seg ' + cls + '" role="group" aria-label="' + label + '">' + items.map(function(x){ return '<button type="button" data-k="' + x.k + '" aria-pressed="false">' + esc(x.t) + '</button>'; }).join('') + '</div>'; }
    host.innerHTML = '<section class="bt-problem av-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Area and volume explorer</h2>' +
      '<div class="av-fig"><div class="av-2d"><div class="av-plot"></div></div><div class="av-3d"><div class="av-solid"></div><p class="av-turn">Drag to turn the solid</p></div></div>' +
      '<div class="av-ctl">' + seg('av-mode', MODES, 'What to build') +
        '<div class="av-sub av-axisrow"><div class="av-chips av-axes" role="group" aria-label="Axis of rotation">' + AXES.map(function(x){ return '<button type="button" class="av-chip" data-k="' + x.k + '" aria-pressed="false">' + esc(x.t) + '</button>'; }).join('') + '</div><div class="av-line"></div></div>' +
        '<div class="av-sub av-shaperow"><div class="av-chips av-shapes" role="group" aria-label="Cross-section shape">' + SHAPES.map(function(x){ return '<button type="button" class="av-chip" data-k="' + x.k + '" aria-pressed="false">' + esc(x.t) + '</button>'; }).join('') + '</div></div>' +
        '<div class="av-sub av-sliceinrow"><div class="av-chips av-slicein" role="group" aria-label="Slice">' + '<button type="button" class="av-chip" data-k="x" aria-pressed="false">Slice in x (dx)</button><button type="button" class="av-chip" data-k="y" aria-pressed="false">Slice in y (dy)</button></div></div>' +
        '<p class="bt-small av-note" hidden></p></div>' +
      '<div class="av-say"></div>' +
      T.moreHtml('<div class="av-pick"></div><div class="bt-buttons"><button type="button" class="bt-btn av-resetview">Reset the 3D view</button></div><p class="bt-small">Keyboard: the slice handle moves with the arrow keys (Home and End jump to the ends); the solid turns with the arrow keys when it has focus.</p>', 'region, 3D view') +
      '<div class="av-nums"></div><p class="sr-only av-live"></p></section>';
    var say = T.announcer($('.av-live'));
    var cue = T.cue('Drag the orange slice across the region; then pick Discs & washers or Cross sections to build a solid.');
    $('.av-ctl').insertBefore(cue.el, $('.av-ctl').firstChild);
    var lineSl = T.slider({ label: 'Line position', min: -3, max: 3, step: 0.25, value: -1, decimals: 2, onInput: function(v){ act(); lineAt = v; fixLine(); draw(); } });
    $('.av-line').appendChild(lineSl.el);
    var pick = T.choiceSelect({ label: 'Region', options: A.REGIONS.map(function(r){ return { value: r.id, label: r.name }; }), value: rid, onChange: function(v){ rid = v; act(); setRegion(); } });
    $('.av-pick').appendChild(pick.el);
    solid = Solid($('.av-solid'), { onTouch: act });
    $('.av-resetview').addEventListener('click', function(){ solid = null; $('.av-solid').innerHTML = ''; solid = Solid($('.av-solid'), { onTouch: act }); draw(); });
    host.addEventListener('click', onClick);
    function onClick(e){
      var b = e.target.closest && e.target.closest('button[data-k]');
      if(!b) return;
      var grp = b.parentNode, k = b.getAttribute('data-k');
      if(b.disabled) return;
      act();
      if(grp.classList.contains('av-mode')){ mode = k; if(mode === 'rev') chooseAxis(axisK); setRegion(true); }
      else if(grp.classList.contains('av-axes')) chooseAxis(k);
      else if(grp.classList.contains('av-shapes')){ shape = k; draw(); }
      else if(grp.classList.contains('av-slicein')){ inY = k === 'y'; setRegion(true); }
    }
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var G = function(){ return A.REGIONS.filter(function(r){ return r.id === rid; })[0]; };
    function hasX(){ return G().v === 'x'; }
    function hasY(){ return G().v === 'y' || !!G().alt; }
    function chooseAxis(k){
      axisK = k;
      var vert = k === 'yaxis' || k === 'v';
      inY = vert ? true : (hasX() ? false : true);
      if(k === 'h' || k === 'v'){ var r0 = A.region(rid, vert && G().v === 'x'); var e = A.extent(r0); lineAt = (k === 'h' ? (e[0] >= -0.01 ? -1 : e[1] + 1) : (r0.v === 'y' ? (e[0] >= -0.01 ? -1 : e[1] + 1) : -1)); }
      setRegion(true);
    }
    function axis(){
      if(mode !== 'rev') return null;
      if(axisK === 'xaxis') return { dir: 'h', at: 0 };
      if(axisK === 'yaxis') return { dir: 'v', at: 0 };
      return { dir: axisK === 'h' ? 'h' : 'v', at: lineAt };
    }
    /* A line axis may not cut through the region: snap it to the nearer edge. */
    function fixLine(){
      if(!reg || (axisK !== 'h' && axisK !== 'v')) return;
      var e = A.extent(reg);
      if(lineAt > e[0] + 1e-9 && lineAt < e[1] - 1e-9){ lineAt = (lineAt - e[0] < e[1] - lineAt) ? Math.floor(e[0] * 4) / 4 : Math.ceil(e[1] * 4) / 4; lineSl.set(lineAt); }
    }
    function axisAllowed(k){
      var vert = k === 'yaxis' || k === 'v';
      if(vert && !hasY()) return 'This region is not one piece in y (its sides change partway), so a vertical axis would need the shell method, which is not AB.';
      if(!vert && !hasX()) return 'This region is given in y, so it slices across a vertical axis. A horizontal axis would need shells (not AB).';
      if(k === 'xaxis' || k === 'yaxis'){ var r0 = A.region(rid, vert && G().v === 'x'); if(!A.axisOk(r0, { dir: vert ? 'v' : 'h', at: 0 })) return 'The ' + (vert ? 'y' : 'x') + '-axis cuts through this region, so the slices would not be discs or washers.'; }
      return '';
    }
    function setRegion(keepU){
      if(mode === 'rev'){
        if(axisAllowed(axisK)){ var ok = ['xaxis', 'h', 'yaxis', 'v'].filter(function(k){ return !axisAllowed(k); }); if(ok.length) axisK = ok[0]; }
        inY = axisK === 'yaxis' || axisK === 'v' || !hasX();
      } else if(!hasY()) inY = false; else if(!hasX()) inY = true;
      var old = reg;
      reg = A.region(rid, inY && G().v === 'x');
      if(!keepU || !old || old.v !== reg.v || u < reg.a || u > reg.b) u = reg.a + (reg.b - reg.a) * 0.45;
      fixLine();
      // the rows for this mode
      var ar = $('.av-axisrow'), sr = $('.av-shaperow'), ir = $('.av-sliceinrow');
      ar.hidden = mode !== 'rev'; sr.hidden = mode !== 'cross'; ir.hidden = mode === 'rev' || !(hasX() && hasY());
      $('.av-line').hidden = !(axisK === 'h' || axisK === 'v');
      lineSl.input.closest('.bt-ctl').querySelector('label').textContent = axisK === 'v' ? 'The line x = h' : 'The line y = k';
      $$('.av-axes button').forEach(function(b){ var why = axisAllowed(b.getAttribute('data-k')); b.disabled = !!why; b.title = why; });
      var note = $('.av-note'); var w = mode === 'rev' ? axisAllowed(axisK) : ''; note.hidden = !w; note.textContent = w;
      $$('.av-3d').forEach(function(x){ x.hidden = mode === 'area'; });
      $$('.av-fig').forEach(function(x){ x.classList.toggle('is-area', mode === 'area'); });
      if(LS){ var sv = LS.root.querySelector('.calc-ls-setup .ls-v'); if(sv) sv.textContent = G().name; }
      build();
    }
    function build(){
      var box = $('.av-plot'); if(!box) return;
      var ax = axis(), vw = viewOf(reg, ax, null);
      var w = Math.max(240, Math.round(box.clientWidth || 420)), h = Math.max(200, Math.round(box.clientHeight || 0));
      if(!LS || !box.clientHeight) h = Math.round(w * 0.8);
      var spec = { label: 'The region between y = ' + plainOf(reg, 'f') + ' and ' + plainOf(reg, 'g') + ', with the slice you drag', width: w, height: h, x: vw.x, y: vw.y, xLabel: 'x', yLabel: 'y' };
      F = P.frame(spec);
      box.innerHTML = P.svg(spec).replace('</svg>', '<g class="av-stat"></g><g class="av-dyn"></g></svg>');
      svg = box.querySelector('svg');
      svg.setAttribute('role', 'group'); // it holds the slice handle (a slider)
      svg.querySelector('.av-stat').innerHTML = regionSvg(reg, F, { axis: ax });
      var mid = function(t){ return (A.hi(reg, t) + A.lo(reg, t)) / 2; };
      var hadFocus = H && document.activeElement === H.el;
      H = sliceHandle(svg, F, { u: u, v: reg.v, lo: reg.a, hi: reg.b, at: mid, label: function(t){ return reg.v + ' = ' + clean(t); },
        onMove: function(t){ act(); u = t; schedule(); }, onEnd: function(){ announce(); } });
      if(hadFocus) H.el.focus();
      draw();
    }
    var raf = 0;
    function schedule(){ if(raf) return; raf = (window.requestAnimationFrame || setTimeout)(function(){ raf = 0; draw(); }); }
    function setup(){ return mode === 'rev' ? { kind: 'rev', axis: axis() } : { kind: 'cross', shape: shape }; }
    function draw(){
      if(!svg) return;
      var ax = axis();
      svg.querySelector('.av-dyn').innerHTML = stripSvg(reg, F, u, { axis: ax, cross: mode === 'cross' });
      if(svg.lastChild !== H.el) svg.appendChild(H.el); H.set(u);
      if(mode !== 'area' && solid){ solid.set({ reg: reg, setup: setup(), u: u }); }
      words();
      syncButtons();
    }
    function syncButtons(){
      var on = function(sel, k){ $$(sel + ' button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === k)); }); };
      on('.av-mode', mode); on('.av-axes', axisK); on('.av-shapes', shape); on('.av-slicein', reg.v);
    }
    function plainOf(r, w){ var t = w === 'f' ? r.ftex : r.gtex; return window.ApCalcTex ? window.ApCalcTex.text(t) : t; }
    function texOf(s){ try{ return M.toTex(M.parse(s, { vars: [reg.v] })); }catch(e){ return s; } }
    function lim(x){ var f = A.exactTex(x); return f && !/\\pi/.test(f) && f.length < 14 ? f : d3(x); }
    function words(){
      var v = reg.v, D = 'd' + v, top = A.hi(reg, u), bot = A.lo(reg, u), fT = texOf(reg.f), gT = texOf(reg.g);
      var fTop = reg.F(u) >= reg.Gf(u), topT = fTop ? fT : gT, botT = fTop ? gT : fT;
      var head, why = [], val, I = '\\int_{' + lim(reg.a) + '}^{' + lim(reg.b) + '}', nums = [];
      var row = function(k, x){ return '<tr><th scope="row">' + k + '</th><td class="r">' + x + '</td></tr>'; };
      var lims = 'The curves meet at $' + v + ' = ' + [reg.a].concat(reg.cuts, [reg.b]).map(lim).join('$, $' + v + ' = ') + '$' + (G().ends ? ' (the region also stops at a boundary line)' : '') + ' (found numerically).';
      if(mode === 'area'){
        var ar = A.area(reg); val = ar.total;
        var many = ar.pieces.length > 1, nf = v === 'x' ? 'f(x)' : 'f(y)', ng = v === 'x' ? 'g(x)' : 'g(y)';
        var parts = ar.pieces.map(function(pc){ var t = pc.top === 'f' ? (many ? nf : fT) : (many ? ng : gT), b = pc.top === 'f' ? (many ? ng : gT) : (many ? nf : fT); return '\\int_{' + lim(pc.a) + '}^{' + lim(pc.b) + '}\\left(' + t + ' - ' + (many ? b : paren(b)) + '\\right)' + D; });
        head = '<b>A = ' + tex(many ? parts.join(' + ') : parts[0]) + ' ≈ ' + d3(val) + '</b>';
        if(many) why.push('<p>' + html('Name the curves: $' + nf + ' = ' + fT + '$ and $' + ng + ' = ' + gT + '$.') + '</p>');
        why.push('<p>' + html(lims) + '</p>',
          '<p>' + html('The slice at $' + v + ' = ' + clean(u) + '$ is a thin rectangle ' + (v === 'x' ? 'from the bottom curve to the top one: its height, top minus bottom,' : 'from the left curve to the right one: its length, right minus left,') + ' is ' + clean(top - bot, 3) + ', and its width is $' + D + '$.') + '</p>',
          '<p>' + html('Adding every slice is the integral. ' + (parts.length > 1 ? 'The curves cross inside, so the one on top changes: split there and take top minus bottom on each piece. One integral over the whole interval would give the net value ' + d3(ar.net) + ', not the area.' : 'Top minus bottom stays positive across the whole interval.')) + '</p>');
        nums.push(row('Limits and crossings', [reg.a].concat(reg.cuts, [reg.b]).map(d3).join(', ')), row('Slice at ' + v + ' = ' + clean(u), (v === 'x' ? 'height ' : 'length ') + d3(top - bot)), row('Area', d3(val) + exactNote(val)));
        if(ar.pieces.length > 1) nums.push(row('Net integral', d3(ar.net)));
      } else if(mode === 'rev'){
        var ax = axis(), q = A.radii(reg, ax, u), k = ax.at; val = A.volume(reg, setup());
        var farIsF = Math.abs(reg.F(u) - k) >= Math.abs(reg.Gf(u) - k), farT = farIsF ? fT : gT, nearT = farIsF ? gT : fT;
        var hole = M.integral(function(t){ return A.radii(reg, ax, t).r; }, reg.a, reg.b, 1e-8) > 1e-6;
        var Rt = dist(farT, k), rt = dist(nearT, k);
        head = '<b>V = ' + tex('\\pi' + I + (hole ? '\\left[\\left(' + Rt + '\\right)^2 - \\left(' + rt + '\\right)^2\\right]' : '\\left(' + Rt + '\\right)^2') + D) + ' ≈ ' + d3(val) + '</b>';
        why.push('<p>' + html(lims) + '</p>',
          '<p>' + html('Slices are perpendicular to the axis (' + (ax.dir === 'h' ? 'the line $y = ' + clean(k) + '$' : 'the line $x = ' + clean(k) + '$') + '), so they are ' + (hole ? 'washers' : 'discs') + ' and you integrate in $' + v + '$.') + '</p>',
          '<p>' + html('Measure each radius from the axis: the outer radius $R = ' + Rt + '$ reaches the farther curve' + (hole ? ', the inner radius $r = ' + rt + '$ the nearer one' : '; the other edge is on the axis, so there is no hole') + '. At $' + v + ' = ' + clean(u) + '$: $R = ' + clean(q.R, 3) + '$' + (hole ? ', $r = ' + clean(q.r, 3) + '$' : '') + '.') + '</p>',
          '<p>' + html('A ' + (hole ? 'washer has area $\\pi R^2 - \\pi r^2 = \\pi\\left(R^2 - r^2\\right)$, not $\\pi(R - r)^2$' : 'disc has area $\\pi R^2$') + '. Its thickness is $' + D + '$; adding the slices gives the volume.') + '</p>');
        nums.push(row('Axis', ax.dir === 'h' ? 'y = ' + clean(k) : 'x = ' + clean(k)), row('At ' + v + ' = ' + clean(u), 'R = ' + d3(q.R) + (hole ? ', r = ' + d3(q.r) : '')), row('Slice area', d3(Math.PI * (q.R * q.R - q.r * q.r))), row('Volume', d3(val) + exactNote(val)));
        if(hole){ var wrong = Math.PI * M.integral(function(t){ var z = A.radii(reg, ax, t); return (z.R - z.r) * (z.R - z.r); }, reg.a, reg.b, 1e-8); nums.push(row('With (R − r)² instead', d3(wrong) + ' (wrong)')); }
      } else {
        val = A.volume(reg, setup());
        var s = top - bot, kf = shape === 'square' ? 's^2' : shape === 'tri' ? '\\frac{\\sqrt{3}}{4}s^2' : '\\frac{\\pi}{8}s^2';
        var sideT = topT + ' - ' + paren(botT);
        head = '<b>V = ' + tex(I + (shape === 'square' ? '\\left(' + sideT + '\\right)^2' : shape === 'tri' ? '\\frac{\\sqrt{3}}{4}\\left(' + sideT + '\\right)^2' : '\\frac{\\pi}{8}\\left(' + sideT + '\\right)^2') + D) + ' ≈ ' + d3(val) + '</b>';
        why.push('<p>' + html(lims) + '</p>',
          '<p>' + html('Each slice stands on the base, perpendicular to the $' + v + '$-axis. Its side is the width of the region there: $s = ' + sideT + '$, which is ' + clean(s, 3) + ' at $' + v + ' = ' + clean(u) + '$.') + '</p>',
          '<p>' + html('A ' + A.SHAPES[shape] + ' with ' + (shape === 'semi' ? 'diameter' : 'side') + ' $s$ has area $' + kf + '$' + (shape === 'semi' ? ' (radius $s/2$, half a circle)' : shape === 'tri' ? ' (height $\\frac{\\sqrt{3}}{2}s$, times half the base)' : '') + '. Integrate that area across the base.') + '</p>');
        nums.push(row('At ' + v + ' = ' + clean(u), 's = ' + d3(s) + ', area ' + d3(A.sectionArea(shape, s))), row('Volume', d3(val) + exactNote(val)));
      }
      T.explain($('.av-say'), head, why.join(''));
      var nm = $('.av-nums');
      if(nm) nm.innerHTML = '<h3 class="ls-title-l">The numbers</h3><table class="ls-tbl"><caption class="sr-only">The region, the slice and the result</caption><tbody>' + row('Region', esc(G().name) + (reg.v === 'y' ? ', in y' : '')) + nums.join('') + '</tbody></table>';
      if(solid) solid.label(mode === 'area' ? '' : 'The solid ' + (mode === 'rev' ? 'formed by revolving the region about ' + (axis().dir === 'h' ? 'y = ' : 'x = ') + clean(axis().at) : 'with ' + A.SHAPES[shape] + ' cross sections on the region') + '. The slice at ' + reg.v + ' = ' + clean(u) + ' is highlighted. Volume ' + d3(val) + '.');
      if(LS){
        LS.caption(T.sayHead($('.av-say')), 'explore');
        LS.pills([{ k: mode === 'area' ? 'A' : 'V', html: d3(val), tone: 'readout' }], 'left', 'explore');
        var q2 = mode === 'rev' ? A.radii(reg, axis(), u) : null;
        LS.pills([{ html: mode === 'rev' ? 'R ' + clean(q2.R) + (q2.r > 1e-6 ? ', r ' + clean(q2.r) : '') : mode === 'cross' ? 's ' + clean(top - bot) : (v === 'x' ? 'height ' : 'length ') + clean(top - bot), tone: 'ghost' }], 'right', 'explore');
      }
    }
    function exactNote(x){ var e = A.exactTex(x); return e && !/\\frac\{\d+\}\{\d{2,}\}/.test(e) ? ' (' + (window.ApCalcTex ? window.ApCalcTex.text(e) : e) + ')' : ''; }
    function paren(t){ return /[+-]/.test(t.replace(/^-/, '')) ? '\\left(' + t + '\\right)' : t; }
    function dist(t, k){
      var below = A.lo(reg, (reg.a + reg.b) / 2) >= k - 1e-9, K = String(+(+k).toFixed(2));
      if(below) return k === 0 ? t : t + (k < 0 ? ' + ' + String(-K) : ' - ' + K);
      return k === 0 ? '-' + paren(t) : K + ' - ' + paren(t);
    }
    function announce(){ var top = A.hi(reg, u), bot = A.lo(reg, u); say('Slice at ' + reg.v + ' = ' + clean(u) + ': ' + (mode === 'rev' ? 'outer radius ' + clean(A.radii(reg, axis(), u).R) + ', inner radius ' + clean(A.radii(reg, axis(), u).r) : (reg.v === 'x' ? 'height ' : 'length ') + clean(top - bot)) + '.'); }
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.av-fig')], dock: [$('.av-ctl')], setup: 'Region', moreLabel: 'Region and 3D view', why: [$('.av-say')], details: [$('.av-nums')] });
      LS.root.addEventListener('click', function(e){ if(!host.contains(e.target)) onClick(e); });
      sp.setup(G().name);
      setRegion();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.av-handle'), text: 'Drag the slice' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ build(); }, 60); }).observe($('.av-fig')); }
      sp.open();
    }
    setRegion();
    if(!window.LevlStudio && window.ResizeObserver){ var t2 = null; new ResizeObserver(function(){ clearTimeout(t2); t2 = setTimeout(build, 80); }).observe($('.av-fig')); }
    return { studio: studio };
  }

  /* ===================================================== test yourself */
  function quiz(host, data){
    var o = { slug: 'area-volume', noun: 'drill', typeLabel: 'Kind of problem', textOnStage: true,
      types: [{ value: 'areaX', label: 'Area between curves (in x)' }, { value: 'areaY', label: 'Area between curves (in y)' }, { value: 'areaCross', label: 'Curves that cross three times' },
        { value: 'crossSq', label: 'Square cross sections' }, { value: 'crossTri', label: 'Triangle and semicircle cross sections' }, { value: 'discAxes', label: 'Discs about an axis' },
        { value: 'discOther', label: 'Discs about another line' }, { value: 'washerAxes', label: 'Washers about an axis' }, { value: 'washerOther', label: 'Washers about another line' }],
      generate: function(r, ctx, type){ return A.generate(r, ctx, type); },
      title: function(p){ return /^area/.test(p.type) ? 'Area between curves' : /^cross/.test(p.type) ? 'Volume with known cross sections' : 'Volume of a solid of revolution'; },
      extra: function(el, p, api){ api.fig = figure(el, p); },
      onStep: function(s, right, api){ if(api.fig) api.fig.after(s); }
    };
    T.drill(host, data, o);
  }
  /* sized(box, draw): draw(w, h) at a default size, again once the Tool
     Studio has placed the figure and whenever its box changes, so the SVG
     is drawn at the size it is shown (readable text on a phone). */
  function sized(box, draw, ratio){
    var last = '';
    function dims(){
      var st = box.closest && box.closest('.ls-drill-stage'), w = Math.round(box.clientWidth) || 480, h = st ? Math.round(box.clientHeight) : 0;
      if(!st || h < 140) h = st ? 140 : Math.round(Math.min(w * (ratio || 0.85), 460));
      return [Math.max(160, w), h];
    }
    function go(force){ var d = dims(), k = d.join('x'); if(k === last && !force) return; last = k; draw(d[0], d[1]); }
    draw(480, Math.round(480 * (ratio || 0.85)));
    setTimeout(function(){ go(true); }, 0);
    if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(go, 40); }).observe(box); }
  }
  function figure(el, p){
    var R = p.reg, reg = { id: 'q', v: R.v, f: R.top, g: R.bot, ftex: R.ttex, gtex: R.btex, F: M.fn(R.top, [R.v]), Gf: M.fn(R.bot, [R.v]), a: R.a, b: R.b, cuts: p.fig.cuts || [] };
    var ax = p.axis || null, vw = viewOf(reg, ax), done = [], solid = null, mid = (R.a + R.b) / 2, svg = null, F = null;
    el.innerHTML = '<div class="av-qfig"><figure class="cd-fig av-q2d"></figure><div class="av-q3d" hidden><div class="av-solid"></div><p class="av-turn">Drag to turn the solid</p></div></div>';
    var fig2 = el.querySelector('.av-q2d');
    function curveLab(){
      var out = '';
      [['F', R.ttex], ['Gf', R.btex]].forEach(function(c, i){
        if(R.bot === '0' && i === 1) return;
        var u = R.a + (R.b - R.a) * (i ? 0.7 : 0.3), w = reg[c[0]](u), pt = reg.v === 'x' ? [F.sx(u), F.sy(w)] : [F.sx(w), F.sy(u)];
        out += '<text class="av-clab ' + (i ? 'av-g' : 'av-f') + '" x="' + r2(pt[0] + (reg.v === 'x' ? (i ? 10 : -10) : 10)) + '" y="' + r2(pt[1] + (i ? 18 : -10)) + '" text-anchor="' + (reg.v === 'x' && !i ? 'end' : 'start') + '">' + esc((reg.v === 'x' ? 'y = ' : 'x = ') + (window.ApCalcTex ? window.ApCalcTex.text(c[1]) : c[1])) + '</text>';
      });
      return out;
    }
    function overlay(){
      var shown = [];
      done.forEach(function(key){
        if(key === 'lo' || key === 'hi'){
          var x = key === 'lo' ? R.a : R.b;
          shown.push(reg.v === 'x' ? '<line class="av-lim" x1="' + r2(F.sx(x)) + '" x2="' + r2(F.sx(x)) + '" y1="' + F.pad.t + '" y2="' + (F.h - F.pad.b) + '"/><text class="av-limlab" x="' + r2(F.sx(x) + 4) + '" y="' + (F.h - F.pad.b - 6) + '">' + reg.v + ' = ' + clean(x, 3) + '</text>'
            : '<line class="av-lim" y1="' + r2(F.sy(x)) + '" y2="' + r2(F.sy(x)) + '" x1="' + F.pad.l + '" x2="' + (F.w - F.pad.r) + '"/><text class="av-limlab" x="' + (F.w - F.pad.r - 4) + '" y="' + r2(F.sy(x) - 4) + '" text-anchor="end">' + reg.v + ' = ' + clean(x, 3) + '</text>');
        }
      });
      if(done.some(function(k){ return k === 'ig' || k === 'R' || k === 'side'; })) shown.push(stripSvg(reg, F, mid, { axis: ax, cross: /^cross/.test(p.type) }));
      svg.querySelector('.av-dyn').innerHTML = shown.join('');
    }
    sized(fig2, function(w, h){
      var spec = { label: 'The region in the problem' + (ax ? ', with the axis of rotation dashed' : ''), width: w, height: h, x: vw.x, y: vw.y, xLabel: 'x', yLabel: 'y' };
      fig2.innerHTML = P.svg(spec).replace('</svg>', '<g class="av-stat"></g><g class="av-dyn"></g></svg>');
      svg = fig2.querySelector('svg'); F = P.frame(spec);
      svg.querySelector('.av-stat').innerHTML = regionSvg(reg, F, { axis: ax }) + curveLab();
      overlay();
    });
    return { after: function(s){
      done.push(s.key); overlay();
      if(s.key === 'V' && (ax || p.fig.shape)){
        var box = el.querySelector('.av-q3d'); box.hidden = false; el.querySelector('.av-qfig').classList.add('has-3d');
        solid = Solid(box.querySelector('.av-solid'), { n: 44, m: 36 });
        var setup = ax ? { kind: 'rev', axis: ax } : { kind: 'cross', shape: p.fig.shape };
        requestAnimationFrame(function(){ solid.set({ reg: reg, setup: setup, u: mid }); solid.label('The solid of this problem, with one slice highlighted. Drag or use the arrow keys to turn it.'); });
        if(window.ResizeObserver){ new ResizeObserver(function(){ if(solid) solid.draw(); }).observe(box); }
      }
    } };
  }
})();
