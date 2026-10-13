/* Collision lab (Unit 4; docs/apphys-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Job: crash two carts and see what is conserved: momentum always (no
   net external force), kinetic energy only when the bumper gives it back.

   Explore: two carts on a track with masses and velocities the student sets
   (sliders, or drag a cart's velocity arrow), a bumper from Velcro (sticky,
   e = 0) to a spring (elastic, e = 1) and its stiffness, and an explosion
   mode (at rest, a loaded spring pushes them apart). The run is the model's
   closed-form solution (ApPhysMath.collisionLab.run): the carts, the
   center-of-mass marker gliding at constant velocity, momentum bars and
   kinetic energy bars (before vs now), and the force-time graph during
   contact with the impulse shaded as its area. A stiffer bumper gives a
   shorter, taller spike with the same area.

   Test yourself: ApPhysTools.drill over generate(): sticky collisions, one
   final velocity, explosions, is KE conserved, impulse from a force-time
   graph, center-of-mass velocity, momentum or energy, and momentum bar
   charts built by dragging bars. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath, S = window.ApPhysScene;
  if(!T || !M || !M.collisionLab || !S) return;
  var C = M.collisionLab, esc = T.esc;
  (function(){
    var href = (window.ApPhysBase || '../') + 'assets/tools/collision-lab.css';
    if(!document.querySelector('link[href$="tools/collision-lab.css"]')){ var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
  })();
  function F(x, d){ return T.F(x, d == null ? 2 : d); }
  function n(x){ return Math.round(x * 10) / 10; }
  function sub(t){ return String(t).replace(/_(\w+)/, '<tspan dy="4" font-size="0.72em">$1</tspan>'); }

  T.mount('collision-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'collision-lab', labels: ['Explore', 'Test yourself'],
      explore: function(pane){ ex = explore(pane, data); },
      quiz: function(pane){ quiz(pane, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* A cart: a body with a mass label, two wheels, a bumper on the facing
     side (spring coil, Velcro pad or a loaded plunger). */
  function cart(cx, y, w, mass, cls, side, bumper, comp, label){
    var h = 34 + Math.min(16, mass * 6), x = cx - w / 2, top = y - 16 - h;
    var out = '<g class="cl-cart ' + cls + '"><rect class="cl-body" x="' + n(x) + '" y="' + n(top) + '" width="' + n(w) + '" height="' + n(h) + '" rx="6"/>' +
      '<rect class="cl-stripe" x="' + n(x + 6) + '" y="' + n(top + 6) + '" width="' + n(w - 12) + '" height="5" rx="2"/>' +
      '<text class="cl-name" x="' + n(cx) + '" y="' + n(top + h * 0.5 + 6) + '" text-anchor="middle">' + label + '</text>' +
      '<text class="cl-mass" x="' + n(cx) + '" y="' + n(top - 6) + '" text-anchor="middle">' + M.fmt(mass, 2) + ' kg</text>' +
      '<circle class="cl-wheel" cx="' + n(x + w * 0.22) + '" cy="' + n(y - 8) + '" r="8"/><circle class="cl-hub" cx="' + n(x + w * 0.22) + '" cy="' + n(y - 8) + '" r="2.5"/>' +
      '<circle class="cl-wheel" cx="' + n(x + w * 0.78) + '" cy="' + n(y - 8) + '" r="8"/><circle class="cl-hub" cx="' + n(x + w * 0.78) + '" cy="' + n(y - 8) + '" r="2.5"/>';
    if(side){
      var bx = side > 0 ? x + w : x, by = top + h / 2, len = Math.max(4, 16 - comp);
      if(bumper === 'velcro') out += '<rect class="cl-velcro" x="' + n(side > 0 ? bx : bx - 7) + '" y="' + n(by - 13) + '" width="7" height="26" rx="2"/>';
      else {
        var d = 'M' + n(bx) + ' ' + n(by), st = len / 5;
        for(var i = 0; i < 5; i++) d += ' L' + n(bx + side * st * (i + 0.5)) + ' ' + n(by + (i % 2 ? 6 : -6));
        d += ' L' + n(bx + side * len) + ' ' + n(by);
        out += '<path class="cl-coil" d="' + d + '"/><rect class="cl-plate" x="' + n(bx + side * len - (side > 0 ? 0 : 3)) + '" y="' + n(by - 11) + '" width="3" height="22"/>';
      }
    }
    return out + '</g>';
  }

  /* ============================================================ explore */
  function explore(pane, data){
    var LS = null, $ = function(sel){ return pane.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); };
    var st = { mode: 'collide', m1: 1.0, m2: 0.5, v1: 1.5, v2: -0.5, e: 1, k: 2000, E: 1.5 };
    var R = null, t = 0, playing = false, W = 640, H = 210, TR = { x0: 30, ppm: 105, y: 150 }, L = 0.5;
    pane.innerHTML = '<section class="bt-problem cl-explore" aria-label="Collision lab">' +
      '<div class="cl-ctl"></div>' +
      '<div class="cl-stage"><figure class="cl-fig cl-track"></figure><div class="cl-tabs" role="group" aria-label="Show"><button type="button" class="bt-btn" data-p="bars" aria-pressed="true">p and K bars</button><button type="button" class="bt-btn" data-p="ft" aria-pressed="false">F vs t</button></div><div class="cl-lower" data-show="bars"><figure class="cl-fig cl-bars"></figure><figure class="cl-fig cl-ft"></figure></div></div>' +
      '<div class="cl-say"></div><div class="cl-nums"></div>' +
      T.moreHtml('<div class="cl-more-ctl"></div>', 'velocities, masses, stiffness, time') + '</section>';
    pane.querySelector('.cl-tabs').addEventListener('click', function(e){ var b = e.target.closest('[data-p]'); if(!b) return; var lw = $('.cl-lower'); lw.setAttribute('data-show', b.getAttribute('data-p')); b.parentNode.querySelectorAll('[data-p]').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); }); draw(); });
    var ctl = $('.cl-ctl'), start = T.cue('Set the bumper, press Crash, and compare the momentum and energy bars before and after. Drag a cart sideways to set its velocity.');
    ctl.appendChild(start.el);
    var seg = document.createElement('div'); seg.className = 'cl-seg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Mode');
    seg.innerHTML = '<button type="button" class="bt-btn" data-mode="collide" aria-pressed="true">Collision</button><button type="button" class="bt-btn" data-mode="explode" aria-pressed="false">Explosion</button>';
    var top = document.createElement('div'); top.className = 'cl-top'; top.appendChild(seg); top.appendChild(pane.querySelector('.cl-tabs'));
    $('.cl-stage').insertBefore(top, $('.cl-stage').firstChild);
    var eS = T.slider({ label: 'Bumper: Velcro (sticky) to spring (elastic)', min: 0, max: 1, step: 0.05, value: st.e, decimals: 2, onInput: function(v){ st.e = v; rebuild(); } });
    eS.el.classList.add('cl-e');
    ctl.appendChild(eS.el);
    var btns = document.createElement('div'); btns.className = 'bt-buttons cl-btns';
    btns.innerHTML = '<button type="button" class="btn-press sm cl-play" aria-pressed="false">Crash</button><button type="button" class="bt-btn cl-reset">Reset</button>';
    ctl.appendChild(btns);
    var more = $('.cl-more-ctl'), sl = {};
    sl.m1 = T.slider({ label: 'Mass of cart A', min: 0.25, max: 3, step: 0.25, value: st.m1, unit: 'kg', decimals: 2, onInput: function(v){ st.m1 = v; rebuild(); } });
    sl.m2 = T.slider({ label: 'Mass of cart B', min: 0.25, max: 3, step: 0.25, value: st.m2, unit: 'kg', decimals: 2, onInput: function(v){ st.m2 = v; rebuild(); } });
    sl.v1 = T.slider({ label: 'Velocity of cart A', min: -1, max: 3, step: 0.1, value: st.v1, unit: 'm/s', decimals: 1, onInput: function(v){ st.v1 = v; rebuild(); } });
    sl.v2 = T.slider({ label: 'Velocity of cart B', min: -3, max: 1, step: 0.1, value: st.v2, unit: 'm/s', decimals: 1, onInput: function(v){ st.v2 = v; rebuild(); } });
    sl.k = T.slider({ label: 'Bumper stiffness k', min: 500, max: 20000, step: 500, value: st.k, unit: 'N/m', onInput: function(v){ st.k = v; rebuild(); } });
    sl.E = T.slider({ label: 'Energy stored in the loaded spring', min: 0.2, max: 4, step: 0.1, value: st.E, unit: 'J', decimals: 1, onInput: function(v){ st.E = v; rebuild(); } });
    ['v1', 'v2', 'm1', 'm2', 'k', 'E'].forEach(function(k){ more.appendChild(sl[k].el); });
    var scrub = T.slider({ label: 'Time', min: 0, max: 3, step: 0.005, value: 0, unit: 's', decimals: 3, onInput: function(v){ pause(); t = v; draw(); } });
    more.appendChild(scrub.el);
    var say = T.announcer(document.createElement('p'));
    seg.addEventListener('click', function(e){ var b = e.target.closest('[data-mode]'); if(!b) return; st.mode = b.getAttribute('data-mode'); seg.querySelectorAll('[data-mode]').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); }); start.done(); rebuild(); });
    btns.querySelector('.cl-play').addEventListener('click', function(){ playing ? pause() : play(); });
    btns.querySelector('.cl-reset').addEventListener('click', function(){ pause(); t = 0; draw(); });

    function rebuild(){
      pause();
      var ex = st.mode === 'explode';
      eS.disable(ex); sl.v1.disable(ex); sl.v2.disable(ex); sl.E.disable(!ex);
      var o = ex ? { mode: 'explode', m1: st.m1, m2: st.m2, E: st.E, k: st.k, L: L, xc: 2.8, t0: 0.4, T: 3 } : { m1: st.m1, m2: st.m2, v1: st.v1, v2: st.v2, e: st.e, k: st.k, L: L, x1: 1.0, x2: 3.6, T: 3 };
      R = C.run(o);
      // Start the collision 0.6 s in when it can be arranged, so the run shows "before".
      if(!ex && R.hits){ var lead = 0.6; var close = st.v1 - st.v2; o.x1 = 2.6 - L / 2 - st.v1 * lead - 0.02; o.x2 = o.x1 + L + close * lead; if(o.x1 < 0.3 || o.x2 > 5.6){ o.x1 = 1.0; o.x2 = 3.6; } R = C.run(o); }
      // End the run 1.6 s after contact, or as soon as a cart reaches the end of the track.
      var end = Math.min(3.2, (isFinite(R.T1) ? R.T1 : 0) + 1.6);
      for(var tt = 0; tt < end; tt += 0.01){ var q = R.at(tt); if(tt > (isFinite(R.T1) ? R.T1 : 0) && (q.x1 < 0.45 || q.x2 > 5.3)){ end = tt; break; } }
      R.T = Math.max(isFinite(R.T1) ? R.T1 + 0.2 : 0.5, end);
      scrub.input.max = String(R.T);
      t = 0; draw();
    }
    function bumperOf(){ return st.mode === 'explode' ? 'spring' : st.e < 0.05 ? 'velcro' : 'spring'; }
    function bumperWord(){ return st.mode === 'explode' ? 'loaded spring' : st.e < 0.05 ? 'Velcro: perfectly inelastic (they stick)' : st.e > 0.95 ? 'spring: elastic' : 'partly springy: inelastic'; }

    /* The track scene. */
    // Each panel draws at its box's shape, so text keeps one size on any screen.
    function boxOf(sel, w0, h0, wmin, wmax){ var e = $(sel), r = e && e.getBoundingClientRect(); return r && r.width > 20 && r.height > 20 ? { w: Math.max(wmin, Math.min(wmax, h0 * r.width / r.height)), h: h0 } : { w: w0, h: h0 }; }
    function narrow(){ try{ return window.matchMedia('(max-width: 760px)').matches; }catch(e){ return false; } }
    function trackSvg(s){
      H = narrow() ? 196 : 220; TR.y = H - 52; var bx = boxOf('.cl-track', 640, H, narrow() ? 300 : 420, 900); W = bx.w; TR.ppm = (W - 50) / 5.8; TR.x0 = 26;
      var y = TR.y, px = function(x){ return TR.x0 + x * TR.ppm; }, out = '';
      out += '<rect class="cl-bg" width="' + W + '" height="' + H + '"/>';
      out += '<rect class="cl-rail" x="10" y="' + y + '" width="' + (W - 20) + '" height="10" rx="3"/><rect class="cl-leg" x="22" y="' + (y + 10) + '" width="8" height="30"/><rect class="cl-leg" x="' + (W - 30) + '" y="' + (y + 10) + '" width="8" height="30"/>';
      for(var m = 0; m <= 5.75; m += 0.5){ var X = px(m); out += '<line class="cl-tick' + (m % 1 ? '' : ' big') + '" x1="' + n(X) + '" x2="' + n(X) + '" y1="' + (y + 10) + '" y2="' + (y + (m % 1 ? 15 : 19)) + '"/>' + (m % 1 ? '' : '<text class="cl-tickt" x="' + n(X) + '" y="' + (y + 32) + '" text-anchor="middle">' + m + ' m</text>'); }
      var w = L * TR.ppm * 0.86, comp = s.comp * TR.ppm, bump = bumperOf();
      var x1 = px(s.x1), x2 = px(s.x2);
      out += cart(x1, y, w, st.m1, 'cl-a', 1, bump, comp / 2, 'A') + cart(x2, y, w, st.m2, 'cl-b', 0, bump, comp / 2, 'B');
      // Velocity arrows (30 px per m/s) above each cart.
      // Above the tallest cart (66 px) and its mass label: v_A, then v_B one
      // row higher, each starting over its own cart; the CM marker on top.
      var ay = y - 88;
      // 30 px per m/s; an arrow that would leave the picture starts further in.
      var va = function(x, v, yy, lab){ var len = v * 30, x0 = Math.max(12 - Math.min(0, len) + 18, Math.min(W - 30 - Math.max(0, len), x)); return S.arrow(x0, yy, len, 0, { cls: 'vel', label: Math.abs(v) > 0.2 ? lab : '' }); };
      out += va(x1, s.v1, ay, 'v_A') + va(x2, s.v2, ay - 22, 'v_B');
      // Center of mass: a marker over the rail that glides at constant velocity.
      var cx = px(s.xcm), cy = ay - 44;
      out += '<g class="cl-cm"><line x1="' + n(cx) + '" x2="' + n(cx) + '" y1="' + (cy + 8) + '" y2="' + (y + 10) + '"/><circle cx="' + n(cx) + '" cy="' + cy + '" r="8"/><path d="M' + n(cx) + ' ' + (cy - 8) + 'v16M' + n(cx - 8) + ' ' + cy + 'h16"/><text x="' + n(cx + 12) + '" y="' + (cy + 4) + '">CM</text></g>';
      if(s.contact) out += '<g class="cl-flash"><circle cx="' + n((x1 + x2) / 2) + '" cy="' + (y - 40) + '" r="16"/></g>';
      var lab = 'Track: cart A (' + F(st.m1, 2) + ' kg) at ' + F(s.x1, 2) + ' m moving ' + F(s.v1, 2) + ' m/s, cart B (' + F(st.m2, 2) + ' kg) at ' + F(s.x2, 2) + ' m moving ' + F(s.v2, 2) + ' m/s; center of mass at ' + F(s.xcm, 2) + ' m moving ' + F(s.vcm, 2) + ' m/s' + (s.contact ? '; the bumper is squeezed, force ' + M.fmt(s.F, 3) + ' N.' : '.');
      return S.svg(W, H, lab, out);
    }
    /* Momentum and kinetic energy bars: before (outline) and now (filled). */
    function barsSvg(s){
      var bb = boxOf('.cl-bars', 360, narrow() ? 150 : 210, narrow() ? 220 : 300, 640), BW = bb.w, BH = bb.h, p0 = [st.m1 * R.v1i, st.m2 * R.v2i], p = [st.m1 * s.v1, st.m2 * s.v2], K0 = [0.5 * st.m1 * R.v1i * R.v1i, 0.5 * st.m2 * R.v2i * R.v2i], K = [0.5 * st.m1 * s.v1 * s.v1, 0.5 * st.m2 * s.v2 * s.v2];
      var pf = [st.m1 * R.v1f, st.m2 * R.v2f], Kf = [0.5 * st.m1 * R.v1f * R.v1f, 0.5 * st.m2 * R.v2f * R.v2f];
      var pmax = Math.max(0.5, Math.abs(p0[0]), Math.abs(p0[1]), Math.abs(pf[0]), Math.abs(pf[1]), Math.abs(p0[0] + p0[1])) * 1.1;
      var Kmax = Math.max(0.2, K0[0] + K0[1], Kf[0] + Kf[1], K0[0], K0[1], Kf[0], Kf[1]) * 1.1;
      var out = '', top = 30, bot = BH - 24, mid = (top + bot) / 2, half = (bot - top) / 2;
      var col = function(i, x, v, v0, sc, cls, zero, hgt){
        var hh = v / sc * hgt, h0 = v0 / sc * hgt;
        out += '<rect class="cl-bar ' + cls + '" x="' + n(x) + '" y="' + n(hh >= 0 ? zero - hh : zero) + '" width="' + n(bw2) + '" height="' + n(Math.abs(hh)) + '"/>';
        out += '<rect class="cl-ghost" x="' + n(x - 3) + '" y="' + n(h0 >= 0 ? zero - h0 : zero) + '" width="' + n(bw2 + 6) + '" height="' + n(Math.abs(h0)) + '"/>';
      };
      // Momentum, a signed axis.
      var half2 = BW / 2, gap = (half2 - 20) / 3, bw2 = Math.min(34, gap * 0.6);
      var tight = BW < 460;
      out += '<text class="cl-h" x="10" y="16">' + (tight ? 'p (kg·m/s)' : 'Momentum (kg·m/s)') + '</text><line class="cl-zero" x1="10" x2="' + n(half2 - 8) + '" y1="' + n(mid) + '" y2="' + n(mid) + '"/>';
      [['A', p[0], p0[0], 'cl-a'], ['B', p[1], p0[1], 'cl-b'], ['Total', p[0] + p[1], p0[0] + p0[1], 'cl-tot']].forEach(function(b, i){
        var x = 14 + gap * (i + 0.5) - bw2 / 2; col(i, x, b[1], b[2], pmax, b[3], mid, half);
        out += '<text class="cl-bl" x="' + (x + bw2 / 2) + '" y="' + (BH - 6) + '" text-anchor="middle">' + b[0] + '</text><text class="cl-bv" x="' + (x + bw2 / 2) + '" y="' + n(b[1] >= 0 ? mid - b[1] / pmax * half - 5 : mid - b[1] / pmax * half + 13) + '" text-anchor="middle">' + F(b[1], 2) + '</text>';
      });
      // Kinetic energy, from zero.
      out += '<text class="cl-h" x="' + n(half2 + 10) + '" y="16">' + (tight ? 'K (J)' : 'Kinetic energy (J)') + '</text><line class="cl-zero" x1="' + n(half2 + 4) + '" x2="' + (BW - 6) + '" y1="' + bot + '" y2="' + bot + '"/><line class="cl-div" x1="' + n(half2) + '" x2="' + n(half2) + '" y1="24" y2="' + (BH - 4) + '"/>';
      [['A', K[0], K0[0], 'cl-a'], ['B', K[1], K0[1], 'cl-b'], ['Total', K[0] + K[1], K0[0] + K0[1], 'cl-tot']].forEach(function(b, i){
        var x = half2 + 10 + gap * (i + 0.5) - bw2 / 2; col(i, x, b[1], b[2], Kmax, b[3], bot, bot - top);
        out += '<text class="cl-bl" x="' + (x + bw2 / 2) + '" y="' + (BH - 6) + '" text-anchor="middle">' + b[0] + '</text><text class="cl-bv" x="' + (x + bw2 / 2) + '" y="' + n(bot - b[1] / Kmax * (bot - top) - 5) + '" text-anchor="middle">' + F(b[1], 2) + '</text>';
      });
      var lab = 'Bars now (dashed outlines: before). Momentum: A ' + F(p[0], 2) + ', B ' + F(p[1], 2) + ', total ' + F(p[0] + p[1], 2) + ' kg·m/s, was ' + F(p0[0] + p0[1], 2) + '. Kinetic energy: total ' + F(K[0] + K[1], 2) + ' J, was ' + F(K0[0] + K0[1], 2) + ' J. The bumper\'s stored energy and the energy lost to heating are not shown as bars.';
      return S.svg(BW, BH, lab, out);
    }
    /* Force-time graph of the contact, impulse shaded as the area. */
    function ftSvg(s){
      var fb = boxOf('.cl-ft', 280, narrow() ? 160 : 210, 220, 640), FW = fb.w, FH = fb.h, l = 46, r = 10, tp = 26, b = 34, pw = FW - l - r, ph = FH - tp - b;
      if(!R.Tc){ return S.svg(FW, FH, 'Force-time graph: the carts never touch, so there is no contact force and no impulse.', '<text class="cl-h" x="10" y="16">Force on B during contact</text><text class="cl-note" x="' + (FW / 2) + '" y="' + (FH / 2) + '" text-anchor="middle">They never touch.</text><text class="cl-note" x="' + (FW / 2) + '" y="' + (FH / 2 + 18) + '" text-anchor="middle">Set B slower than A.</text>'); }
      // A fixed time window (60 ms) and force scale, so a stiffer bumper is visibly narrower and taller.
      var win = Math.max(0.06, R.Tc * 1.25), fmax = Math.max(20, R.Fmax * 1.15), fsc = M.fmt(fmax, 2);
      var X = function(tt){ return l + tt / win * pw; }, Y = function(f){ return tp + ph - f / fmax * ph; };
      var out = '<text class="cl-h" x="10" y="16">Force on B during contact</text>';
      out += '<line class="cl-axis" x1="' + l + '" x2="' + (l + pw) + '" y1="' + (tp + ph) + '" y2="' + (tp + ph) + '"/><line class="cl-axis" x1="' + l + '" x2="' + l + '" y1="' + tp + '" y2="' + (tp + ph) + '"/>';
      var tstep = win > 0.12 ? 0.05 : win > 0.06 ? 0.02 : 0.01;
      for(var tt = 0; tt <= win + 1e-9; tt += tstep){ out += '<text class="cl-tickt" x="' + n(X(tt)) + '" y="' + (tp + ph + 14) + '" text-anchor="middle">' + Math.round(tt * 1000) + '</text>'; }
      var fst = T.niceStep(fmax, 4);
      for(var f = 0; f <= fmax + 1e-9; f += fst){ out += '<line class="cl-grid" x1="' + l + '" x2="' + (l + pw) + '" y1="' + n(Y(f)) + '" y2="' + n(Y(f)) + '"/><text class="cl-tickt" x="' + (l - 5) + '" y="' + n(Y(f) + 4) + '" text-anchor="end">' + M.fmt(f, 3) + '</text>'; }
      out += '<text class="cl-ax" x="' + (l + pw / 2) + '" y="' + (FH - 4) + '" text-anchor="middle">time since contact (ms)</text><text class="cl-ax" x="12" y="' + (tp + ph / 2) + '" transform="rotate(-90 12 ' + (tp + ph / 2) + ')" text-anchor="middle">F (N)</text>';
      var N = 120, pts = [], now = s.contact || t >= R.T1 ? Math.min(R.Tc, t - R.T0) : t >= R.T0 ? 0 : -1;
      for(var i = 0; i <= N; i++){ var u = R.Tc * i / N; pts.push(n(X(u)) + ',' + n(Y(R.pulse(u)))); }
      var shade = [];
      if(now > 0){ for(i = 0; i <= N; i++){ var u2 = now * i / N; shade.push(n(X(u2)) + ',' + n(Y(R.pulse(u2)))); } out += '<polygon class="cl-area" points="' + n(X(0)) + ',' + (tp + ph) + ' ' + shade.join(' ') + ' ' + n(X(now)) + ',' + (tp + ph) + '"/>'; }
      out += '<polyline class="cl-curve" points="' + pts.join(' ') + '"/>';
      var Jnow = now > 0 ? C.area(R.pulse, 0, now, 200) : 0;
      out += '<text class="cl-j" x="' + (l + pw - 4) + '" y="' + (tp + 14) + '" text-anchor="end">J = area = ' + F(Jnow, 3) + ' N·s</text>';
      var lab = 'Force-time graph of the bumper force on cart B: a pulse ' + Math.round(R.Tc * 1000) + ' ms long with a peak of ' + M.fmt(R.Fmax, 3) + ' N. Shaded area so far, the impulse: ' + F(Jnow, 3) + ' N·s of ' + F(R.J, 3) + ' N·s.';
      return S.svg(FW, FH, lab, out);
    }
    function draw(){
      var s = R.at(t);
      $('.cl-track').innerHTML = trackSvg(s);
      $('.cl-bars').innerHTML = barsSvg(s);
      $('.cl-ft').innerHTML = ftSvg(s);
      scrub.set(t);
      var p = st.m1 * s.v1 + st.m2 * s.v2, K = 0.5 * st.m1 * s.v1 * s.v1 + 0.5 * st.m2 * s.v2 * s.v2, K0 = 0.5 * st.m1 * R.v1i * R.v1i + 0.5 * st.m2 * R.v2i * R.v2i;
      var phase = !R.hits && R.mode !== 'explode' ? 'none' : t < R.T0 ? 'before' : t < R.T1 ? 'contact' : 'after', head, short, body;
      var pt = M.fmt(st.m1 * R.v1i + st.m2 * R.v2i, 3), Kf = 0.5 * st.m1 * R.v1f * R.v1f + 0.5 * st.m2 * R.v2f * R.v2f;
      if(phase === 'none'){ head = 'No collision.'; short = 'Cart B is not slower than cart A, so they never meet.'; }
      else if(phase === 'before'){ head = R.mode === 'explode' ? 'At rest, spring loaded.' : 'Before.'; short = R.mode === 'explode' ? 'Total momentum 0.' : 'Total momentum ' + pt + ' kg·m/s.'; }
      else if(phase === 'contact'){ head = 'In contact.'; short = 'The bumper pushes them apart with equal and opposite forces; the total momentum stays ' + (R.mode === 'explode' ? '0' : pt) + ' kg·m/s.'; }
      else { head = 'After.'; short = R.mode === 'explode' ? 'Momentum still 0; the spring\'s energy is now kinetic.' : Math.abs(Kf - K0) < 1e-6 * K0 ? 'Elastic: kinetic energy is back to ' + F(K0, 2) + ' J.' : 'Momentum the same; ' + F(K0 - Kf, 2) + ' J of kinetic energy is gone.'; }
      body = '<p><b>Momentum</b> is conserved because the net external force on the two-cart system is zero: the track is level and nearly frictionless, and the bumper forces are internal, equal and opposite (Newton\'s third law), acting for the same time. So the impulses on A and B cancel, the total bar never moves, and the center of mass glides at ' + F(R.vcm, 2) + ' m/s the whole time.</p>' +
        '<p><b>Kinetic energy</b> ' + (R.mode === 'explode' ? 'comes from the spring: ' + F(st.E, 2) + ' J of elastic energy becomes kinetic energy of the two carts.' : st.e > 0.95 ? 'dips during contact (it is stored in the spring) and comes back: elastic.' : st.e < 0.05 ? 'drops for good: the Velcro holds them together and the lost energy heats and deforms it. Perfectly inelastic: the most kinetic energy a collision can lose while momentum is conserved.' : 'drops: the bumper gives back only part of what it stored. Inelastic.') + '</p>' +
        '<p><b>Impulse</b> is the area under the force-time graph: ' + F(R.J, 3) + ' N·s on B (and −' + F(R.J, 3) + ' N·s on A). Make the bumper stiffer under More options: the spike gets shorter and taller, and the area stays the same, because the area is set by the change in momentum.</p>';
      T.explain($('.cl-say'), '<b>' + head + '</b> <span class="tx-at">t = ' + F(t, 2) + ' s</span>', body);
      var row = function(k, v){ return '<tr><th scope="row">' + k + '</th><td class="r">' + v + '</td></tr>'; };
      $('.cl-nums').innerHTML = '<h3 class="ls-title-l">The numbers</h3><table class="ls-tbl"><caption class="sr-only">The collision in numbers</caption><tbody>' +
        row('Masses', 'A ' + F(st.m1, 2) + ' kg, B ' + F(st.m2, 2) + ' kg') + row('Bumper', esc(bumperWord()) + (R.mode === 'explode' ? '' : ', e = ' + F(st.e, 2)) + ', k = ' + st.k + ' N/m') +
        row('Velocities before', 'A ' + F(R.v1i, 2) + ', B ' + F(R.v2i, 2) + ' m/s') + row('Velocities after', 'A ' + F(R.v1f, 3) + ', B ' + F(R.v2f, 3) + ' m/s') +
        row('Momentum before / after', F(st.m1 * R.v1i + st.m2 * R.v2i, 3) + ' / ' + F(st.m1 * R.v1f + st.m2 * R.v2f, 3) + ' kg·m/s') +
        row('Kinetic energy before / after', F(K0, 3) + ' / ' + F(Kf, 3) + ' J') + row('Center of mass velocity', F(R.vcm, 3) + ' m/s') +
        (R.Tc ? row('Contact time', Math.round(R.Tc * 1000) + ' ms') + row('Peak force', M.fmt(R.Fmax, 3) + ' N') + row('Impulse on B = Δp of B', F(R.J, 3) + ' N·s') + row('Average force', M.fmt(R.J / R.Tc, 3) + ' N') : '') +
        row('Now', 'p = ' + F(p, 3) + ' kg·m/s, K = ' + F(K, 3) + ' J') + '</tbody></table>';
      if(LS){
        LS.pills([], 'left', 'explore'); LS.pills([], 'right', 'explore');
        LS.caption('<b>' + head + '</b> ' + short + ' <span class="cl-cap-r">p = ' + F(p, 2) + ' kg·m/s, K = ' + F(K, 2) + ' J</span>', 'explore');
      }
    }
    var loop = S.loop(function(dt){
      t += dt;
      // Slow motion through the contact so the spike can be watched.
      if(R.Tc && t > R.T0 - 0.01 && t < R.T1 + 0.01) t -= dt * 0.85;
      if(t >= R.T){ t = R.T; draw(); stopUi(); return false; }
      draw();
    }, { still: function(){ t = R.T; draw(); stopUi(); } });
    function play(){ if(t >= R.T - 1e-6) t = 0; playing = true; start.done(); var b = btns.querySelector('.cl-play'); b.textContent = 'Pause'; b.setAttribute('aria-pressed', 'true'); loop.reset(); loop.start(); say('Running.'); }
    function stopUi(){ playing = false; var b = btns.querySelector('.cl-play'); if(b){ b.textContent = st.mode === 'explode' ? 'Release' : 'Crash'; b.setAttribute('aria-pressed', 'false'); } }
    function pause(){ loop.stop(); stopUi(); }
    // Drag a cart's velocity arrow (or the cart) sideways to set its velocity.
    pane.addEventListener('pointerdown', function(e){
      var svg = e.target.closest && e.target.closest('.cl-track svg'); if(!svg || st.mode === 'explode') return;
      var b0 = svg.getBoundingClientRect(), x0 = (e.clientX - b0.left) * W / b0.width, s = R.at(t);
      var which = Math.abs(x0 - (TR.x0 + s.x1 * TR.ppm)) < Math.abs(x0 - (TR.x0 + s.x2 * TR.ppm)) ? 1 : 2, cx = TR.x0 + (which === 1 ? s.x1 : s.x2) * TR.ppm;
      pause(); t = 0;
      var move = function(ev){
        var b = svg.getBoundingClientRect(), x = (ev.clientX - b.left) * W / b.width, v = Math.round((x - cx) / 30 * 10) / 10;
        if(which === 1){ v = Math.max(-1, Math.min(3, v)); st.v1 = v; sl.v1.set(v); } else { v = Math.max(-3, Math.min(1, v)); st.v2 = v; sl.v2.set(v); }
        start.done(); rebuild();
      };
      var up = function(){ window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
    function studio(p, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.cl-stage')], dock: [ctl], moreLabel: 'Velocities, masses, stiffness and time', why: [start.el, $('.cl-say')], details: [$('.cl-nums')] });
      draw();
      if(s.mode() === 'explore') s.hint({ target: btns.querySelector('.cl-play'), text: 'Press Crash' });
    }
    rebuild();
    return { stop: pause, studio: studio };
  }

  /* ============================================================== quiz */
  var TYPES = [
    { value: 'sticky', label: 'Sticky collision' }, { value: 'onefinal', label: 'Find a final velocity' }, { value: 'explode', label: 'Explosion' },
    { value: 'ke', label: 'Is KE conserved?' }, { value: 'impulse', label: 'Impulse from a graph' }, { value: 'cm', label: 'Center of mass' },
    { value: 'choose', label: 'Momentum or energy?' }, { value: 'bars', label: 'Momentum bar charts' }
  ];
  // On a phone the problem text over the picture leaves the picture too little
  // height: there it is the caption instead, and the picture fills the stage.
  function narrowQ(){ try{ return window.matchMedia('(max-width: 760px)').matches; }catch(e){ return false; } }
  function quiz(pane, data){
    // A bar chart to build is the stage; its problem text is the caption.
    var opts = {
      slug: 'collision-lab', generate: function(r, c, t){ var p = C.generate(r, c, t); opts.textOnStage = !(p.figure && /bars/.test(p.figure.kind)) && !narrowQ(); return p; }, types: TYPES, typeLabel: 'Kind of problem', newLabel: 'New problem', textOnStage: true,
      title: function(p){ var t = TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Momentum problem'; },
      extra: function(host, p){
        var f = p.figure;
        if(!f) return;
        if(f.kind === 'pbars') return pbuilder(host, p);
        host.innerHTML = '<figure class="cd-fig cl-qfig">' + (f.kind === 'ft' ? ftFigure(f) : cartsFigure(f)) + '</figure>';
      }
    };
    T.drill(pane, data, opts);
  }
  function cartsFigure(f){
    var w = 420, h = 150, y = 124, out = '<rect class="cl-bg" width="' + w + '" height="' + h + '"/><rect class="cl-rail" x="6" y="' + y + '" width="' + (w - 12) + '" height="8" rx="3"/>';
    var bump = f.bumper === 'velcro' ? 'velcro' : 'spring', ax = f.bumper === 'loaded' ? 168 : 120, bx = f.bumper === 'loaded' ? 252 : 300;
    out += cart(ax, y, 70, f.m1, 'cl-a', 1, bump, f.bumper === 'loaded' ? 10 : 0, 'A') + cart(bx, y, 70, f.m2, 'cl-b', 0, bump, f.bumper === 'loaded' ? 10 : 0, 'B');
    var sc = 26;
    if(f.v1) out += S.arrow(ax, 36, f.v1 * sc, 0, { cls: 'vel', label: 'v_A' });
    if(f.v2) out += S.arrow(bx, 36, f.v2 * sc, 0, { cls: 'vel', label: 'v_B' });
    if(f.cm){ var xc = (f.m1 * ax + f.m2 * bx) / (f.m1 + f.m2); out += '<g class="cl-cm"><line x1="' + n(xc) + '" x2="' + n(xc) + '" y1="20" y2="' + y + '"/><circle cx="' + n(xc) + '" cy="13" r="7"/><text x="' + n(xc + 10) + '" y="17">CM</text></g>'; }
    return S.svg(w, h, 'Two carts on a track: A ' + F(f.m1, 2) + ' kg, B ' + F(f.m2, 2) + ' kg' + (f.bumper === 'velcro' ? ', with Velcro bumpers.' : f.bumper === 'loaded' ? ', touching, a compressed spring between them.' : ', with spring bumpers.'), out);
  }
  function ftFigure(f){
    var W = 420, H = 230, l = 56, r = 14, tp = 18, b = 40, pw = W - l - r, ph = H - tp - b, tmax = f.dt * 1.25, fmax = f.Fm * 1.25;
    var X = function(t){ return l + t / tmax * pw; }, Y = function(F2){ return tp + ph - F2 / fmax * ph; }, out = '';
    var tst = T.niceStep(tmax, 5), fst = T.niceStep(fmax, 5);
    for(var t = 0; t <= tmax + 1e-9; t += tst){ out += '<line class="cl-grid" x1="' + n(X(t)) + '" x2="' + n(X(t)) + '" y1="' + tp + '" y2="' + (tp + ph) + '"/><text class="cl-tickt" x="' + n(X(t)) + '" y="' + (tp + ph + 15) + '" text-anchor="middle">' + M.fmt(t, 2).replace(/^0$/, '0') + '</text>'; }
    for(var F2 = 0; F2 <= fmax + 1e-9; F2 += fst){ out += '<line class="cl-grid" x1="' + l + '" x2="' + (l + pw) + '" y1="' + n(Y(F2)) + '" y2="' + n(Y(F2)) + '"/><text class="cl-tickt" x="' + (l - 6) + '" y="' + n(Y(F2) + 4) + '" text-anchor="end">' + M.fmt(F2, 3) + '</text>'; }
    out += '<line class="cl-axis" x1="' + l + '" x2="' + (l + pw) + '" y1="' + (tp + ph) + '" y2="' + (tp + ph) + '"/><line class="cl-axis" x1="' + l + '" x2="' + l + '" y1="' + tp + '" y2="' + (tp + ph) + '"/>';
    var pts = f.shape === 'tri' ? [[0, 0], [f.dt / 2, f.Fm], [f.dt, 0]] : f.shape === 'rect' ? [[0, 0], [0, f.Fm], [f.dt, f.Fm], [f.dt, 0]] : [[0, 0], [f.ramp, f.Fm], [f.dt - f.ramp, f.Fm], [f.dt, 0]];
    out += '<polygon class="cl-area" points="' + pts.map(function(q){ return n(X(q[0])) + ',' + n(Y(q[1])); }).join(' ') + '"/><polyline class="cl-curve" points="' + pts.map(function(q){ return n(X(q[0])) + ',' + n(Y(q[1])); }).join(' ') + '"/>';
    out += '<text class="cl-ax" x="' + (l + pw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">Time t (s)</text><text class="cl-ax" x="14" y="' + (tp + ph / 2) + '" transform="rotate(-90 14 ' + (tp + ph / 2) + ')" text-anchor="middle">Force F (N)</text>';
    var desc = f.shape === 'tri' ? 'a triangle rising from 0 to ' + M.fmt(f.Fm, 3) + ' N at ' + M.fmt(f.dt / 2, 3) + ' s and back to 0 at ' + M.fmt(f.dt, 3) + ' s' : f.shape === 'rect' ? 'a constant ' + M.fmt(f.Fm, 3) + ' N from 0 to ' + M.fmt(f.dt, 3) + ' s' : 'a trapezoid rising to ' + M.fmt(f.Fm, 3) + ' N by ' + M.fmt(f.ramp, 3) + ' s, flat until ' + M.fmt(f.dt - f.ramp, 3) + ' s, back to 0 at ' + M.fmt(f.dt, 3) + ' s';
    return S.svg(W, H, 'Force against time graph: ' + desc + '.', out);
  }
  /* The momentum bar builder: six bars (A, B, total; before and after),
     dragged in units or typed; drill() puts the inputs in the slots. */
  function pbuilder(host, p){
    var f = p.figure, cells = f.cells, MAX = 8, W = 480, H = 240, L = 30, R = 8, Tp = 16, B = 26;
    var cw = (W - L - R) / cells.length, zy = Tp + (H - Tp - B) / 2, ppu = (H - Tp - B) / (2 * MAX);
    host.innerHTML = '<figure class="cl-build"><div class="cl-build-top">' + cartsFigure(f.scene) + '</div><div class="cl-chart"></div>' +
      '<div class="cl-slots" data-row="bars"><span></span>' + cells.map(function(c, i){ return '<span class="cl-slot" data-i="' + i + '" data-label="' + esc(c.label) + '"></span>'; }).join('') + '<span></span></div></figure>';
    var chart = host.querySelector('.cl-chart');
    function ins(){ return cells.map(function(c, i){ return host.querySelector('.cl-slot[data-i="' + i + '"] input'); }); }
    function val(x){ if(!x) return null; var v = window.ApPhysQuestions.parseNumber(x.value); return isFinite(v) ? v : null; }
    function draw(){
      var rc = chart.getBoundingClientRect();
      W = rc.width > 20 && rc.height > 20 ? Math.max(320, Math.min(900, H * rc.width / rc.height)) : 480; cw = (W - L - R) / cells.length;
      host.querySelector('.cl-slots').style.gridTemplateColumns = (L / W * 100).toFixed(2) + '% repeat(' + cells.length + ',minmax(0,1fr)) ' + (R / W * 100).toFixed(2) + '%';
      var I = ins(), out = '';
      for(var u = -MAX; u <= MAX; u++){ var y = zy - u * ppu; out += '<line class="' + (u === 0 ? 'cl-zero' : 'cl-grid') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + n(y) + '" y2="' + n(y) + '"/>' + (u % 2 === 0 ? '<text class="cl-tickt" x="' + (L - 5) + '" y="' + n(y + 4) + '" text-anchor="end">' + M.minus(String(u)) + '</text>' : ''); }
      out += '<text class="cl-grpt" x="' + (L + 4) + '" y="' + (Tp - 4) + '">Before</text><text class="cl-grpt" x="' + n(L + 3 * cw + 4) + '" y="' + (Tp - 4) + '">After</text><line class="cl-div" x1="' + n(L + 3 * cw) + '" x2="' + n(L + 3 * cw) + '" y1="4" y2="' + (H - 2) + '"/>';
      cells.forEach(function(c, i){
        var x = L + i * cw, v = val(I[i]), cls = /A/.test(c.key) ? 'cl-a' : /B/.test(c.key) ? 'cl-b' : 'cl-tot';
        if(v != null && v !== 0){ var hh = Math.min(MAX, Math.abs(v)) * ppu; out += '<rect class="cl-bar ' + cls + (I[i] && I[i].classList.contains('is-wrong') ? ' is-wrong' : I[i] && I[i].classList.contains('is-right') ? ' is-right' : '') + '" x="' + n(x + cw * 0.2) + '" y="' + n(v > 0 ? zy - hh : zy) + '" width="' + n(cw * 0.6) + '" height="' + n(hh) + '"/>'; }
        out += '<text class="cl-bl" x="' + n(x + cw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + (c.key.slice(1) === 'T' ? 'Total' : c.key.slice(1)) + '</text><rect class="cl-hit" data-c="' + i + '" x="' + n(x) + '" y="' + Tp + '" width="' + n(cw) + '" height="' + (H - Tp - B) + '"/>';
      });
      chart.innerHTML = S.svg(W, H, 'Momentum bar chart to build, in units of ' + M.fmt(f.unit, 2) + ' kg·m/s. ' + cells.map(function(c, i){ var v = val(I[i]); return c.label + ' ' + (v == null ? 'empty' : M.minus(String(v))); }).join(', ') + '.', out);
    }
    function setFrom(ev, svg, i){
      var inp = ins()[i]; if(!inp || inp.readOnly) return;
      var b = svg.getBoundingClientRect(), y = (ev.clientY - b.top) * H / b.height, v = Math.max(-MAX, Math.min(MAX, Math.round((zy - y) / ppu)));
      inp.value = String(v); draw();
    }
    host.addEventListener('pointerdown', function(e){
      var hit = e.target.closest && e.target.closest('.cl-hit'); if(!hit) return;
      var svg = hit.ownerSVGElement, i = +hit.getAttribute('data-c'); e.preventDefault(); setFrom(e, svg, i);
      var mv = function(ev){ setFrom(ev, svg, i); }, up = function(){ window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); var x = ins()[i]; if(x && !x.readOnly) x.focus({ preventScroll: true }); };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    });
    host.addEventListener('input', draw);
    host.addEventListener('keydown', function(e){
      var inp = e.target; if(!inp.classList || !inp.classList.contains('cd-cell') || inp.readOnly || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      e.preventDefault(); var v = Math.max(-MAX, Math.min(MAX, Math.round(val(inp) || 0) + (e.key === 'ArrowUp' ? 1 : -1))); inp.value = String(v); draw();
    });
    if(window.MutationObserver) new MutationObserver(function(){ draw(); }).observe(host.querySelector('.cl-slots'), { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'readonly'] });
    draw();
  }
})();
