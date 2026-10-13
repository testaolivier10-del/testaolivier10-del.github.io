/* Projectile lab (Unit 1, motion-2d; Premium). Job: launch a ball and see
   its motion split into a steady sideways part and a falling up-and-down part.
   OWNED BY THIS TOOL ONLY. Model: ApPhysMath.projectileLab
   (physics/assets/tools/math/projectile-lab.js); arrows: ApPhysScene; frame:
   ApPhysTools.modes / studio / drill.

   Explore, three views:
     Launch   a cannon on the ground or on a cliff. Aim it by dragging the
              barrel (or the angle slider), set the speed, drag the cliff top
              (or the height slider) and press Launch. The ball flies in real
              time (slow motion for short flights) and leaves a strobe trail:
              at each dot the velocity's components are drawn to scale, so the
              horizontal arrows stay the same length while the vertical ones
              shrink, flip and grow. Time of flight, range and the highest
              point are marked on the picture.
     Compare  keep a launch as A, change the settings, launch B: both fly on
              one clock, so you see which lands first and why.
     Moving cart  a cart rolling at constant speed launches a ball straight
              up. Seen from the ground the path is a parabola; switch to
              "Seen from the cart" and it goes straight up and down while the
              ground slides by. The ball lands back in the cart either way.
   Test yourself: seeded drills from ApPhysMath.projectileLab.generate with a
   labeled figure of the setup (never the answers). */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath, PS = window.ApPhysScene;
  (function(){
    var me = document.currentScript, href = me && me.src ? me.src.replace(/projectile-lab\.js(\?.*)?$/, 'projectile-lab.css') : null;
    if(href && !document.querySelector('link[href$="tools/projectile-lab.css"]')){ var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Numbers & settings');
  })();
  if(!T || !M || !M.projectileLab || !PS) return;
  var P = M.projectileLab, F = T.F, esc = T.esc;
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function W3(x){ return M.fmt(x, 3); }
  var NICE = [5, 10, 20, 25, 50, 100, 200];
  function niceUp(x){ for(var i = 0; i < NICE.length; i++) if(x <= NICE[i]) return NICE[i]; return Math.ceil(x / 100) * 100; }
  function gridStep(span){ return span <= 10 ? 2 : span <= 25 ? 5 : span <= 50 ? 10 : span <= 100 ? 20 : 50; }

  T.mount('projectile-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'projectile-lab', labels: ['Explore', 'Test yourself'],
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ============================================================ drawing */
  /* Shared pieces: ground, cliff, cannon, cart, ball. All in SVG pixels. */
  function grass(x0, x1, y){ return '<rect class="pl-ground" x="' + x0.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (x1 - x0).toFixed(1) + '" height="400"/><line class="pl-grass" x1="' + x0.toFixed(1) + '" x2="' + x1.toFixed(1) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>'; }
  function cliff(xEdge, yTop, yBase, left){
    if(yBase - yTop < 1) return '';
    var w = xEdge - left, jag = [];
    // A rock face with a few ledges, the same every time for a given size.
    var n = Math.max(3, Math.round((yBase - yTop) / 22));
    for(var i = 0; i <= n; i++){ var y = yTop + (yBase - yTop) * i / n, dx = (i % 2 ? -3.5 : 2) * (i === 0 || i === n ? 0 : 1); jag.push((xEdge + dx).toFixed(1) + ',' + y.toFixed(1)); }
    var face = '<polygon class="pl-cliff" points="' + left.toFixed(1) + ',' + yTop.toFixed(1) + ' ' + jag.join(' ') + ' ' + left.toFixed(1) + ',' + yBase.toFixed(1) + '"/>';
    var strata = '';
    for(var k = 1; k < n; k++){ var yy = yTop + (yBase - yTop) * k / n; strata += '<line class="pl-strata" x1="' + (left + 4).toFixed(1) + '" x2="' + (xEdge - 6).toFixed(1) + '" y1="' + yy.toFixed(1) + '" y2="' + (yy + (k % 2 ? 3 : -2)).toFixed(1) + '"/>'; }
    return face + strata + '<line class="pl-grass" x1="' + left.toFixed(1) + '" x2="' + xEdge.toFixed(1) + '" y1="' + yTop.toFixed(1) + '" y2="' + yTop.toFixed(1) + '"/>';
  }
  /* A cannon on a wheeled carriage, its barrel pivoting at (x, y), aimed at
     deg above the horizontal; s is its size (barrel length) in px. */
  function cannon(x, y, deg, s, cls){
    var bl = s, bw = s * 0.26, wr = s * 0.3;
    var barrel = '<g class="pl-barrel" transform="rotate(' + (-deg).toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">' +
      '<rect x="' + (x - bl * 0.22).toFixed(1) + '" y="' + (y - bw / 2).toFixed(1) + '" width="' + (bl * 1.12).toFixed(1) + '" height="' + bw.toFixed(1) + '" rx="' + (bw * 0.45).toFixed(1) + '"/>' +
      '<rect class="pl-muzzle" x="' + (x + bl * 0.8).toFixed(1) + '" y="' + (y - bw * 0.62).toFixed(1) + '" width="' + (bl * 0.12).toFixed(1) + '" height="' + (bw * 1.24).toFixed(1) + '" rx="2"/>' +
      '<rect class="pl-band" x="' + (x + bl * 0.25).toFixed(1) + '" y="' + (y - bw / 2).toFixed(1) + '" width="' + (bl * 0.06).toFixed(1) + '" height="' + bw.toFixed(1) + '"/></g>';
    var carriage = '<path class="pl-carriage" d="M' + (x - s * 0.42).toFixed(1) + ' ' + (y + wr * 1.15).toFixed(1) + ' L' + (x - s * 0.1).toFixed(1) + ' ' + (y - bw * 0.2).toFixed(1) + ' L' + (x + s * 0.16).toFixed(1) + ' ' + (y - bw * 0.2).toFixed(1) + ' L' + (x + s * 0.24).toFixed(1) + ' ' + (y + wr * 0.6).toFixed(1) + ' Z"/>';
    var wy = y + wr * 0.95 - wr, wx = x - s * 0.02, spokes = '';
    for(var k = 0; k < 6; k++){ var a = k * Math.PI / 3; spokes += '<line x1="' + wx.toFixed(1) + '" y1="' + (wy + wr).toFixed(1) + '" x2="' + (wx + Math.cos(a) * wr * 0.86).toFixed(1) + '" y2="' + (wy + wr + Math.sin(a) * wr * 0.86).toFixed(1) + '"/>'; }
    var wheel = '<g class="pl-wheel"><circle cx="' + wx.toFixed(1) + '" cy="' + (wy + wr).toFixed(1) + '" r="' + wr.toFixed(1) + '"/>' + '<g class="pl-spokes">' + spokes + '</g><circle class="pl-hubc" cx="' + wx.toFixed(1) + '" cy="' + (wy + wr).toFixed(1) + '" r="' + (wr * 0.22).toFixed(1) + '"/></g>';
    return '<g class="pl-cannon' + (cls ? ' ' + cls : '') + '">' + barrel + carriage + wheel + '</g>';
  }
  /* A flat cart with a spring launcher tube, centered at x, wheels on y. */
  function cartArt(x, y, s){
    var w = s, h = s * 0.32, wr = s * 0.13;
    return '<g class="pl-cart">' +
      '<rect class="pl-cart-body" x="' + (x - w / 2).toFixed(1) + '" y="' + (y - wr * 2 - h).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + (h * 0.3).toFixed(1) + '"/>' +
      '<rect class="pl-tube" x="' + (x - w * 0.09).toFixed(1) + '" y="' + (y - wr * 2 - h - s * 0.3).toFixed(1) + '" width="' + (w * 0.18).toFixed(1) + '" height="' + (s * 0.34).toFixed(1) + '" rx="3"/>' +
      [-0.3, 0.3].map(function(f){ return '<circle class="pl-cwheel" cx="' + (x + w * f).toFixed(1) + '" cy="' + (y - wr).toFixed(1) + '" r="' + wr.toFixed(1) + '"/><circle class="pl-hubc" cx="' + (x + w * f).toFixed(1) + '" cy="' + (y - wr).toFixed(1) + '" r="' + (wr * 0.35).toFixed(1) + '"/>'; }).join('') +
      '</g>';
  }
  function ball(x, y, r, cls){ return '<circle class="pl-ball' + (cls ? ' ' + cls : '') + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '"/><circle class="pl-shine" cx="' + (x - r * 0.35).toFixed(1) + '" cy="' + (y - r * 0.35).toFixed(1) + '" r="' + (r * 0.3).toFixed(1) + '"/>'; }
  function label(x, y, text, anchor, cls){ return '<text class="pl-lbl' + (cls ? ' ' + cls : '') + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (anchor || 'start') + '">' + text + '</text>'; }
  function arc(x, y, r, deg){
    if(Math.abs(deg) < 1) return '';
    var a = M.rad(deg), ex = x + r * Math.cos(a), ey = y - r * Math.sin(a);
    return '<path class="pl-arc" d="M' + (x + r).toFixed(1) + ' ' + y.toFixed(1) + ' A' + r + ' ' + r + ' 0 0 ' + (deg > 0 ? 0 : 1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1) + '"/>';
  }

  /* ============================================================ explore */
  function explore(host, data){
    var LS = null;
    var st = {
      view: 'launch', g: data.g || 9.8,
      v: 18, angle: 40, h: 0,
      A: null, run: null, t: 0, flown: false, tSel: null,
      u: 4, w: 8, frame: 'ground',
      comp: true, total: false
    };
    var loop = null, firstAct = false;
    host.innerHTML =
      '<section class="bt-problem pl-card" aria-label="Projectile lab">' +
        '<div class="pl-stage"><svg class="phys-scene pl-scene" role="img" aria-label="A cannon ready to launch a ball"></svg><p class="sr-only pl-sr" aria-live="polite"></p></div>' +
        '<div class="pl-ctl">' +
          '<div class="pl-views ls-seg" role="group" aria-label="What to explore">' +
            '<button type="button" class="bt-mode on" data-v="launch" aria-pressed="true">One ball</button>' +
            '<button type="button" class="bt-mode" data-v="compare" aria-pressed="false">Compare</button>' +
            '<button type="button" class="bt-mode" data-v="cart" aria-pressed="false">Moving cart</button>' +
          '</div>' +
          '<div class="pl-p pl-p-launch"></div>' +
          '<div class="pl-p pl-p-cart" hidden></div>' +
          '<div class="bt-buttons pl-btns"><button type="button" class="btn-press pl-go">Launch</button><button type="button" class="bt-btn pl-keep" hidden>Keep as A</button></div>' +
        '</div>' +
        '<div class="pl-say"></div>' +
        '<div class="pl-nums"></div>' +
        T.moreHtml('<div class="pl-more"></div>', 'height, g, which arrows') +
      '</section>';
    var $ = function(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); };
    var svg = $('.pl-scene'), srEl = $('.pl-sr');
    var say = T.announcer(srEl);
    var viewBtns = Array.prototype.slice.call(host.querySelectorAll('.pl-views .bt-mode'));
    viewBtns.forEach(function(b){ b.addEventListener('click', function(){ setView(b.getAttribute('data-v')); }); });

    var cue = T.cue('Drag the barrel to aim (or use the sliders), then press Launch.');
    var sAng = T.slider({ label: 'Launch angle', min: -30, max: 90, step: 1, value: st.angle, unit: '°', decimals: 0, onInput: function(v){ st.angle = v; changed(); } });
    var sV = T.slider({ label: 'Launch speed', min: 2, max: 30, step: 0.5, value: st.v, unit: 'm/s', decimals: 1, onInput: function(v){ st.v = v; changed(); } });
    $('.pl-p-launch').appendChild(sAng.el); $('.pl-p-launch').appendChild(sV.el);
    var sH = T.slider({ label: 'Launch height (cliff)', min: 0, max: 50, step: 1, value: st.h, unit: 'm', decimals: 0, onInput: function(v){ st.h = v; changed(); } });
    var sU = T.slider({ label: 'Cart speed', min: 0, max: 8, step: 0.5, value: st.u, unit: 'm/s', decimals: 1, onInput: function(v){ st.u = v; changed(); } });
    var sW = T.slider({ label: 'Launch speed, straight up from the cart', min: 2, max: 14, step: 0.5, value: st.w, unit: 'm/s', decimals: 1, onInput: function(v){ st.w = v; changed(); } });
    var frameSeg = document.createElement('div');
    frameSeg.className = 'pl-frames ls-seg'; frameSeg.setAttribute('role', 'group'); frameSeg.setAttribute('aria-label', 'Seen from');
    frameSeg.innerHTML = '<button type="button" class="bt-mode on" data-f="ground" aria-pressed="true">From the ground</button><button type="button" class="bt-mode" data-f="cart" aria-pressed="false">From the cart</button>';
    $('.pl-p-cart').appendChild(frameSeg); $('.pl-p-cart').appendChild(sU.el); $('.pl-p-cart').appendChild(sW.el);
    var frameBtns = Array.prototype.slice.call(frameSeg.querySelectorAll('.bt-mode'));
    frameBtns.forEach(function(b){ b.addEventListener('click', function(){ st.frame = b.getAttribute('data-f'); frameBtns.forEach(function(x){ var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); geo = null; draw(true); if(st.flown) go(); }); });
    var more = $('.pl-more');
    more.appendChild(sH.el);
    var gSel = T.choiceSelect({ label: 'g', options: [{ value: '9.8', label: '9.8 m/s² (equations sheet)' }, { value: '10', label: '10 m/s² (also accepted)' }], value: String(st.g), onChange: function(v){ st.g = +v; changed(); } });
    gSel.el.classList.add('bt-inline'); more.appendChild(gSel.el);
    more.insertAdjacentHTML('beforeend', '<fieldset class="pl-checks"><legend>Arrows at each dot</legend>' +
      '<div class="bt-radio"><input type="checkbox" id="pl-cb-c" checked><label for="pl-cb-c">Components, v<sub>x</sub> and v<sub>y</sub></label></div>' +
      '<div class="bt-radio"><input type="checkbox" id="pl-cb-t"><label for="pl-cb-t">The whole velocity, v</label></div></fieldset>' +
      '<p class="bt-small">The dots are equal time steps apart (the step is shown on the picture). Arrows: 1 m/s is drawn the same length everywhere in a view, so you can compare them.</p>');
    more.querySelector('#pl-cb-c').addEventListener('change', function(){ st.comp = this.checked; draw(true); });
    more.querySelector('#pl-cb-t').addEventListener('change', function(){ st.total = this.checked; draw(true); });
    // The time slider (read any moment of the flight): Details.
    var sT = T.slider({ label: 'Read the flight at time t', min: 0, max: 1, step: 0.01, value: 0, unit: 's', decimals: 2, onInput: function(v){ stop(); st.tSel = v; st.t = v; draw(true); } });
    sT.disable(true);
    var goBtn = $('.pl-go'), keepBtn = $('.pl-keep');
    goBtn.addEventListener('click', function(){ go(); });
    keepBtn.addEventListener('click', function(){
      if(st.A){ st.A = null; keepBtn.textContent = 'Keep as A'; }
      else { st.A = { v: st.v, angle: st.angle, h: st.h }; keepBtn.textContent = 'Clear A'; }
      geo = null; draw(true);
    });

    function setView(v){
      if(v === st.view) return;
      stop(); st.view = v;
      viewBtns.forEach(function(b){ var on = b.getAttribute('data-v') === v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      $('.pl-p-launch').hidden = v === 'cart'; $('.pl-p-cart').hidden = v !== 'cart';
      keepBtn.hidden = v !== 'compare';
      if(v === 'compare' && !st.A){ st.A = { v: st.v, angle: st.angle, h: st.h }; keepBtn.textContent = 'Clear A'; sAng.set(clamp(st.angle + 20 > 80 ? st.angle - 25 : st.angle + 20, -30, 90), true); }
      st.flown = false; st.t = 0; st.tSel = null; geo = null;
      draw(true);
      T.event('apphys-tool-view', { tool: 'projectile-lab', view: v });
    }
    function changed(){ stop(); st.flown = false; st.t = 0; st.tSel = null; sT.disable(true); geo = null; draw(true); }

    /* ---- the model of what is on screen */
    function launches(){
      if(st.view === 'cart') return [];
      var out = [{ id: 'B', L: P.launch({ v: st.v, angle: st.angle, h: st.h, g: st.g }) }];
      if(st.view === 'compare' && st.A) out.unshift({ id: 'A', L: P.launch({ v: st.A.v, angle: st.A.angle, h: st.A.h, g: st.g }) });
      if(st.view === 'compare') out[out.length - 1].id = 'B'; else out[0].id = '';
      return out;
    }
    function cartModel(){ return P.cartLaunch({ u: st.u, w: st.w, g: st.g }); }
    function duration(){
      if(st.view === 'cart') return cartModel().T;
      return Math.max.apply(null, launches().map(function(x){ return x.L.T; }));
    }

    /* ---- running a launch */
    function go(){
      stop(); firstAct = true; cue.done();
      st.flown = true; st.t = 0; st.tSel = null;
      var D = duration(), rate = D < 1.6 ? D / 1.6 : D > 6 ? D / 6 : 1;
      st.rate = rate;
      sT.disable(true);
      loop = PS.loop(function(dt){ st.t = Math.min(D, st.t + dt * rate); draw(false); return st.t < D; }, {
        duration: D / rate,
        still: function(){ st.t = D; draw(true); },
        onEnd: function(){ st.t = D; landed(); }
      });
      goBtn.textContent = 'Launch again';
      loop.start();
      T.event('apphys-pl-launch', { view: st.view });
    }
    function landed(){
      var D = duration();
      sT.disable(false);
      sT.input.max = String(M.round(D, 2)); sT.set(D);
      draw(true);
      say(srText(true));
    }
    function stop(){ if(loop) loop.stop(); loop = null; }

    /* The strobe step for a flight of D seconds: about 10 dots. */
    function stepFor(D){ var ns = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2]; for(var i = 0; i < ns.length; i++) if(D / ns[i] <= 11) return ns[i]; return 2; }
    /* ---- geometry: fit the whole flight, true shape (same scale both ways) */
    var geo = null;
    function layout(){
      var w = Math.max(300, Math.round(svg.parentNode.clientWidth || 640));
      var hAvail = Math.round(svg.parentNode.clientHeight || 0);
      var h = hAvail > 160 ? hAvail : Math.round(clamp(w * 0.56, 240, 440));
      var Lm = Math.round(clamp(w * 0.09, 62, 96)), Rm = 18, Tm = 22, Bm = 34;
      var spanX, spanY, x0World = 0;
      if(st.view === 'cart'){
        var K = cartModel();
        spanX = st.frame === 'cart' ? Math.max(6, K.H * 1.6) : Math.max(6, K.D * 1.15 + 2.5);
        spanY = Math.max(2, K.H * 1.25 + 1.5);
        x0World = st.frame === 'cart' ? -spanX / 2 : -1;
      } else {
        var Ls = launches(), maxX = 0, maxY = 0;
        Ls.forEach(function(x){ maxX = Math.max(maxX, x.L.R); maxY = Math.max(maxY, x.L.H, x.L.h); });
        spanX = Math.max(8, maxX * 1.08 + 1);
        spanY = Math.max(4, maxY * 1.14);
      }
      var pw = w - Lm - Rm, ph = h - Tm - Bm;
      var ppm = Math.min(pw / spanX, ph / spanY);
      // Fit the view to this flight: one scale both ways (true shape), and the
      // scene only as tall as the flight needs (plus room for the cannon and
      // the scale bar), so a low, long flight is not drawn under a tall empty
      // sky. The stage centers the shorter scene.
      if(hAvail > 160){
        var need = Math.round(Tm + Bm + spanY * ppm + 30), hMin = Math.round(Math.min(h, Math.max(240, w * 0.46)));
        h = clamp(need, hMin, h);
      }
      geo = { hA: hAvail, w: w, h: h, L: Lm, R: Rm, T: Tm, B: Bm, ppm: ppm, spanX: spanX, x0: x0World, ground: h - Bm };
      // Velocity arrows: one px-per-(m/s) for the whole view, chosen so an
      // arrow shows how far the ball would go in 0.8 of a strobe step at that
      // velocity: horizontal arrows then fit between the dots.
      geo.dt = stepFor(duration());
      var vmax = st.view === 'cart' ? Math.max(st.u, st.w) : Math.max.apply(null, launches().map(function(x){ return Math.max(x.L.v, Math.abs(x.L.vyEnd), 1); }));
      geo.vs = clamp(0.8 * geo.dt * ppm, Math.min(w, h) * 0.05 / vmax, Math.min(w, h) * 0.22 / vmax);
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    }
    function X(x){ return geo.L + (x - geo.x0) * geo.ppm; }
    function Y(y){ return geo.ground - y * geo.ppm; }

    /* ---- the picture */
    function draw(full){
      if(!geo) layout();
      if(st.view === 'cart') drawCart(); else drawLaunch();
      if(full) words();
      else if(LS){ var D = duration(); if(st.t >= D - 1e-9) words(); else pillsNow(); }
    }
    function axisLabels(){
      var p = [], step = gridStep(geo.spanX), xEnd = geo.x0 + (geo.w - geo.L - geo.R) / geo.ppm;
      for(var x = Math.ceil(geo.x0 / step) * step; x <= xEnd + 1e-9; x += step){
        p.push('<line class="pl-tick" x1="' + X(x).toFixed(1) + '" x2="' + X(x).toFixed(1) + '" y1="' + geo.ground + '" y2="' + (geo.ground + 5) + '"/>');
        p.push(label(X(x), geo.ground + 18, M.minus(String(M.round(x, 1))), 'middle', 'pl-tl'));
      }
      p.push(label(geo.w - geo.R, geo.h - 3, 'x (m)', 'end', 'pl-tl'));
      return p.join('') + scaleBar();
    }
    /* A scale bar: the same meters across and up (the picture has the true shape). */
    function scaleBar(){
      var m = gridStep(geo.spanX); while(m * geo.ppm > geo.w * 0.28 && m > 1) m = m / 2 >= 1 ? m / 2 : 1;
      var px = m * geo.ppm, x = geo.L + 34, y = geo.T + 10;
      return '<g class="pl-scale"><rect class="pl-scale-bg" x="' + (x - 8) + '" y="' + (y - 14) + '" width="' + (px + 150).toFixed(1) + '" height="26" rx="8"/>' +
        '<path class="pl-scale-bar" d="M' + x + ' ' + (y - 4) + 'v8M' + x + ' ' + y + 'h' + px.toFixed(1) + 'M' + (x + px).toFixed(1) + ' ' + (y - 4) + 'v8"/>' +
        label(x + px + 8, y + 4, m + ' m, across and up', 'start', 'pl-scale-t') + '</g>';
    }
    function heightRuler(){
      var yMax = (geo.ground - geo.T) / geo.ppm, step = gridStep(yMax * 1.6), p = [], xr = geo.L - 10;
      p.push('<line class="pl-ruler" x1="' + xr + '" x2="' + xr + '" y1="' + geo.ground + '" y2="' + Y(Math.floor(yMax / step) * step).toFixed(1) + '"/>');
      for(var y = 0; y <= yMax + 1e-9; y += step){ p.push('<line class="pl-tick" x1="' + (xr - 4) + '" x2="' + xr + '" y1="' + Y(y).toFixed(1) + '" y2="' + Y(y).toFixed(1) + '"/>'); p.push(label(xr - 6, Y(y) + 4, String(y), 'end', 'pl-tl')); }
      p.push(label(xr - 6, geo.T - 6, 'y (m)', 'end', 'pl-tl'));
      return p.join('');
    }
    function comps(x, y, vx, vy, cls){
      var s = geo.vs, out = '';
      if(st.comp){
        out += PS.arrow(x, y, vx * s, 0, { cls: 'pl-vx' + (cls || ''), width: 2.6, head: 7 });
        out += PS.arrow(x, y, 0, -vy * s, { cls: 'pl-vy' + (cls || ''), width: 2.6, head: 7 });
      }
      if(st.total) out += PS.arrow(x, y, vx * s, -vy * s, { cls: 'vel', width: 2.4, head: 7, dashed: true });
      return out;
    }
    function drawLaunch(){
      var Ls = launches(), p = [], cs = clamp(geo.ppm * 2.2, 34, 58), hMax = 0;
      Ls.forEach(function(x){ hMax = Math.max(hMax, x.L.h); });
      p.push('<rect class="pl-sky" x="-1500" y="-1500" width="' + (geo.w + 3000) + '" height="' + (geo.ground + 1500) + '"/>');
      p.push(grass(-1500, geo.w + 1500, geo.ground));
      p.push(axisLabels());
      // Cliffs (one per launch height; A and B can differ).
      Ls.slice().sort(function(a, b){ return b.L.h - a.L.h; }).forEach(function(x){ if(x.L.h > 0) p.push(cliff(X(0), Y(x.L.h), geo.ground, 0)); });
      p.push(heightRuler());
      var t = st.t, showT = st.flown;
      Ls.forEach(function(x, i){
        var L = x.L, ghost = Ls.length > 1 && i === 0, tag = x.id ? ' pl-' + x.id.toLowerCase() : '';
        // Full path as a faint guide before launch; the traced part after.
        var tt = showT ? Math.min(t, L.T) : L.T, pts = [];
        for(var k = 0; k <= 80; k++){ var q = L.at(tt * k / 80); pts.push(X(q.x).toFixed(1) + ',' + Y(Math.max(0, q.y)).toFixed(1)); }
        if(!showT) p.push('<polyline class="pl-guide' + tag + '" points="' + pts.join(' ') + '"/>');
        else p.push('<polyline class="pl-path' + tag + '" points="' + pts.join(' ') + '"/>');
        // The strobe: dots every dt with their component arrows.
        if(showT){
          var sb = { dt: geo.dt, ts: [] };
          for(var ts0 = 0; ts0 <= L.T + 1e-9; ts0 = M.round(ts0 + geo.dt, 6)) sb.ts.push(ts0);
          sb.ts.forEach(function(ts){ if(ts > tt + 1e-9) return; var q = L.at(ts); p.push(comps(X(q.x), Y(Math.max(0, q.y)), q.vx, q.vy, ghost ? ' is-ghost' : '')); p.push('<circle class="pl-dot' + tag + '" cx="' + X(q.x).toFixed(1) + '" cy="' + Y(Math.max(0, q.y)).toFixed(1) + '" r="3.2"/>'); });
          if(i === Ls.length - 1) p.push(label(geo.w - geo.R, geo.T - 6, 'dots every ' + sb.dt + ' s', 'end', 'pl-note'));
        }
        // Landmarks once that ball has landed.
        if(showT && t >= L.T - 1e-9){
          if(L.tTop > 0){ var top = L.at(L.tTop);
            p.push('<line class="pl-mark" x1="' + X(top.x).toFixed(1) + '" x2="' + X(top.x).toFixed(1) + '" y1="' + Y(top.y).toFixed(1) + '" y2="' + geo.ground + '"/>');
            p.push(label(X(top.x) + 6, Y(top.y) - 8, (x.id ? x.id + ': ' : '') + 'top ' + W3(L.H) + ' m', 'start', 'pl-mk'));
          }
          var far = X(L.R) > geo.w * 0.7, lift = x.id === 'A' ? 34 : 18;
          p.push(label(X(L.R) + (far ? -12 : 0), geo.ground - lift, (x.id ? x.id + ': ' : '') + W3(L.R) + ' m, ' + W3(L.T) + ' s', far ? 'end' : 'middle', 'pl-mk'));
          p.push('<path class="pl-land" d="M' + (X(L.R) - 5) + ' ' + (geo.ground - 5) + 'l10 10M' + (X(L.R) + 5) + ' ' + (geo.ground - 5) + 'l-10 10"/>');
        }
      });
      // Cannons (B, the live one, on top), then the balls in flight.
      Ls.forEach(function(x, i){ var L = x.L; p.push(cannon(X(0) - cs * 0.15, Y(L.h) - cs * 0.42, L.angle, cs, (Ls.length > 1 && i === 0 ? 'is-ghost' : 'is-live') + (x.id ? ' pl-' + x.id.toLowerCase() : ''))); });
      Ls.forEach(function(x){ var L = x.L, tt = showT ? Math.min(t, L.T) : 0, q = L.at(tt);
        if(!showT) return;
        p.push(ball(X(q.x), Y(Math.max(0, q.y)), clamp(geo.ppm * 0.45, 5, 9), x.id ? 'pl-' + x.id.toLowerCase() : ''));
        if(x.id && tt < L.T - 1e-9) p.push(label(X(q.x) + 10, Y(Math.max(0, q.y)) - 10, x.id, 'start', 'pl-id'));
      });
      // Before launch: the launch velocity arrow and the angle.
      if(!showT){ var L0 = Ls[Ls.length - 1].L, ox = X(0), oy = Y(L0.h);
        p.push(arc(ox, oy, 34, L0.angle));
        p.push(PS.arrow(ox, oy, L0.vx * geo.vs, -L0.vy * geo.vs, { cls: 'vel', width: 3, label: 'v' }));
        p.push(label(ox + 40, oy + (L0.angle >= 0 ? -6 : 16), M.minus(String(L0.angle)) + '°', 'start', 'pl-mk'));
      }
      // Grab handles: aim (barrel) and height (cliff top).
      var Lb = Ls[Ls.length - 1].L, ax = X(0) + Math.cos(M.rad(Lb.angle)) * cs * 1.2, ay = Y(Lb.h) - Math.sin(M.rad(Lb.angle)) * cs * 1.2;
      p.push('<circle class="pl-grab pl-aim" cx="' + ax.toFixed(1) + '" cy="' + ay.toFixed(1) + '" r="22" tabindex="0" role="slider" aria-label="Aim: drag to set the launch angle, or use the arrow keys" aria-valuemin="-30" aria-valuemax="90" aria-valuenow="' + st.angle + '" aria-valuetext="' + st.angle + ' degrees"/>');
      if(st.view === 'launch' || st.view === 'compare') p.push('<rect class="pl-grab pl-hgt" x="' + Math.max(2, X(0) - cs * 0.6 - 44).toFixed(1) + '" y="' + (Y(Lb.h) - 6).toFixed(1) + '" width="40" height="16" rx="6" tabindex="0" role="slider" aria-label="Cliff height: drag up or down, or use the arrow keys" aria-valuemin="0" aria-valuemax="50" aria-valuenow="' + st.h + '" aria-valuetext="' + st.h + ' meters"/>' +
        '<path class="pl-hgt-i" d="M' + (X(0) - cs * 0.6 - 30).toFixed(1) + ' ' + (Y(Lb.h) - 1).toFixed(1) + 'l6 -5 6 5M' + (X(0) - cs * 0.6 - 30).toFixed(1) + ' ' + (Y(Lb.h) + 5).toFixed(1) + 'l6 5 6 -5"/>');
      var keepFocus = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('pl-grab') ? document.activeElement.getAttribute('class') : null;
      svg.innerHTML = p.join('');
      svg.setAttribute('aria-label', sceneLabel());
      wireGrab();
      if(keepFocus){ var f = svg.querySelector('.' + keepFocus.split(' ').filter(function(c){ return c === 'pl-aim' || c === 'pl-hgt'; })[0]); if(f) f.focus(); }
    }
    function drawCart(){
      var K = cartModel(), t = st.flown ? st.t : 0, inCart = st.frame === 'cart';
      var cs = clamp(geo.ppm * 1.6, 56, 96), p = [];
      var gq = K.ground(t), cartX = inCart ? 0 : gq.cart, ballX = inCart ? 0 : gq.x;
      p.push('<rect class="pl-sky" x="-1500" y="-1500" width="' + (geo.w + 3000) + '" height="' + (geo.ground + 1500) + '"/>');
      // In the cart's frame the ground slides backward: offset the ground marks by the cart's travel.
      var shift = inCart ? gq.cart : 0, p2 = [];
      p.push(grass(-1500, geo.w + 1500, geo.ground));
      var step = gridStep(geo.spanX) / 2, xEnd = geo.x0 + (geo.w - geo.L - geo.R) / geo.ppm;
      for(var x = Math.floor((geo.x0 + shift) / step) * step; x - shift <= xEnd + step; x += step){
        var sx = X(x - shift);
        if(sx < -10 || sx > geo.w + 10) continue;
        p2.push('<line class="pl-post" x1="' + sx.toFixed(1) + '" x2="' + sx.toFixed(1) + '" y1="' + (geo.ground - 9) + '" y2="' + geo.ground + '"/>');
        if(Math.abs(x / (step * 2) - Math.round(x / (step * 2))) < 1e-9) p2.push(label(sx, geo.ground + 18, M.minus(String(M.round(x, 1))), 'middle', 'pl-tl'));
      }
      p.push(p2.join(''));
      p.push(label(geo.w - geo.R, geo.h - 3, inCart ? 'ground marks (m): they slide past' : 'x (m), ground frame', 'end', 'pl-tl'));
      p.push(scaleBar());
      p.push(heightRuler());
      // The path traced so far, in this frame.
      var fr = inCart ? K.cart : K.ground, pts = [], sb = { dt: geo.dt };
      if(st.flown){
        for(var k = 0; k <= 60; k++){ var q = fr(t * k / 60); pts.push(X(q.x).toFixed(1) + ',' + Y(Math.max(0, q.y) + launchY()).toFixed(1)); }
        p.push('<polyline class="pl-path" points="' + pts.join(' ') + '"/>');
        // In the cart's frame every dot is on one vertical line: arrows there
        // would sit on top of each other, so only the ball carries them.
        for(var j = 0; j <= 40; j++){ var tj = j * sb.dt; if(tj > t + 1e-9) break; var qj = fr(tj); if(!inCart) p.push(comps(X(qj.x), Y(qj.y + launchY()), qj.vx, qj.vy, '')); p.push('<circle class="pl-dot" cx="' + X(qj.x).toFixed(1) + '" cy="' + Y(qj.y + launchY()).toFixed(1) + '" r="3.2"/>'); }
      } else {
        for(var k2 = 0; k2 <= 60; k2++){ var q2 = fr(K.T * k2 / 60); pts.push(X(q2.x).toFixed(1) + ',' + Y(Math.max(0, q2.y) + launchY()).toFixed(1)); }
        p.push('<polyline class="pl-guide" points="' + pts.join(' ') + '"/>');
      }
      p.push(cartArt(X(cartX), geo.ground, cs));
      // The cart's own velocity, in this frame.
      var cv = inCart ? 0 : st.u;
      if(cv) p.push(PS.arrow(X(cartX), geo.ground - cs * 0.62 - 8, cv * geo.vs, 0, { cls: 'pl-cartv', width: 3, label: 'v_cart' }));
      else { var right = X(cartX) + cs * 0.6 + 150 < geo.w; p.push(label(X(cartX) + (right ? 1 : -1) * cs * 0.6, geo.ground - cs * 0.35, inCart ? 'cart at rest (this frame)' : 'cart at rest', right ? 'start' : 'end', 'pl-note')); }
      var q = fr(t);
      if(inCart && st.flown && t < K.T - 1e-9) p.push(comps(X(ballX) + 14, Y(q.y + launchY()), q.vx, q.vy, ''));
      p.push(ball(X(ballX), Y(Math.max(0, q.y) + launchY()), clamp(geo.ppm * 0.35, 5, 8)));
      if(!st.flown) p.push(PS.arrow(X(ballX), Y(launchY()), (inCart ? 0 : st.u) * geo.vs, -st.w * geo.vs, { cls: 'vel', width: 3, label: 'v' }));
      svg.innerHTML = p.join('');
      svg.setAttribute('aria-label', sceneLabel());
    }
    function launchY(){ return 0.62 * clamp(geo.ppm * 1.6, 56, 96) / geo.ppm; }

    /* ---- drag to aim, drag the cliff */
    function wireGrab(){
      var aim = svg.querySelector('.pl-aim'), hg = svg.querySelector('.pl-hgt');
      function pt(e){ var b = svg.getBoundingClientRect(); return { x: (e.clientX - b.left) * geo.w / b.width, y: (e.clientY - b.top) * geo.h / b.height }; }
      function drag(el, fn){
        if(!el) return;
        el.addEventListener('pointerdown', function(e){ e.preventDefault(); stop(); el.setPointerCapture && el.setPointerCapture(e.pointerId); first();
          var mv = function(ev){ fn(pt(ev)); }, up = function(){ el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
          el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); });
      }
      var oy = function(){ return Y(st.h); };
      drag(aim, function(q){ var a = Math.round(M.deg(Math.atan2(oy() - q.y, q.x - X(0)))); sAng.set(clamp(a, -30, 90), true); });
      drag(hg, function(q){ var h = Math.round((geo.ground - q.y) / geo.ppm); sH.set(clamp(h, 0, 50), true); });
      [[aim, sAng], [hg, sH]].forEach(function(pair){
        if(!pair[0]) return;
        pair[0].addEventListener('keydown', function(e){
          var d = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0;
          if(!d) return; e.preventDefault(); first(); pair[1].set(pair[1].value() + d * (e.shiftKey ? 5 : 1), true);
        });
      });
    }
    function first(){ if(!firstAct){ firstAct = true; cue.done(); } }

    /* ---- words */
    function sceneLabel(){
      if(st.view === 'cart'){ var K = cartModel(); return 'A cart rolling at ' + F(st.u, 1) + ' m/s launches a ball straight up at ' + F(st.w, 1) + ' m/s, seen from ' + (st.frame === 'cart' ? 'the cart: the ball goes straight up and down.' : 'the ground: the ball follows a parabola and lands back in the cart after ' + W3(K.T) + ' s, ' + W3(K.D) + ' m along.'); }
      var Ls = launches();
      return Ls.map(function(x){ var L = x.L; return (x.id ? 'Launch ' + x.id + ': ' : 'A cannon ') + (L.h ? 'on a cliff ' + L.h + ' m high ' : 'on the ground ') + 'aimed at ' + L.angle + '° with speed ' + F(L.v, 1) + ' m/s' + (st.flown && st.t >= L.T - 1e-9 ? '; it lands ' + W3(L.R) + ' m away after ' + W3(L.T) + ' s, highest point ' + W3(L.H) + ' m' : ''); }).join('. ') + '.';
    }
    function srText(done){ return sceneLabel(); }
    function words(){
      var head, body, nums = '';
      if(st.view === 'cart'){
        var K = cartModel(), g0 = K.ground(st.t);
        head = st.flown && st.t >= K.T - 1e-9 ? '<b>It lands back in the cart</b> after ' + W3(K.T) + ' s.' : st.frame === 'cart' ? '<b>From the cart, the ball goes straight up and down.</b>' : '<b>From the ground, the ball follows a parabola.</b>';
        body = '<p>Ground frame: the ball\'s velocity = its velocity in the cart\'s frame + the cart\'s velocity, so it leaves with v<sub>x</sub> = ' + F(st.u, 1) + ' m/s and v<sub>y</sub> = ' + F(st.w, 1) + ' m/s. Nothing pushes it sideways, so it keeps pace with the cart and comes down in it.</p><p>Cart frame: subtract the cart\'s velocity and v<sub>x</sub> = 0. The vertical motion (and the acceleration, g down) is the same in both frames; only the horizontal velocity differs, by ' + F(st.u, 1) + ' m/s.</p>';
        nums = row('Time up and back', W3(K.T) + ' s') + row('Highest point above the launch', W3(K.H) + ' m') + row('Ball and cart travel (ground)', W3(K.D) + ' m') + row('Now, t', F(st.t, 2) + ' s') + row('Ball v<sub>x</sub> (this frame)', F(st.frame === 'cart' ? 0 : st.u, 2) + ' m/s') + row('Ball v<sub>y</sub>', F(g0.vy, 2) + ' m/s');
      } else {
        var Ls = launches(), B = Ls[Ls.length - 1].L, done = st.flown && st.t >= duration() - 1e-9;
        if(st.view === 'compare' && Ls.length > 1){
          var A = Ls[0].L, d = A.T - B.T;
          head = !st.flown ? '<b>Change B, then Launch both.</b>' : !done ? 'Both in the air…' : Math.abs(d) < 0.005 ? '<b>A and B land together</b>, at ' + W3(A.T) + ' s.' : '<b>' + (d < 0 ? 'A' : 'B') + ' lands first</b>: ' + W3(Math.min(A.T, B.T)) + ' s against ' + W3(Math.max(A.T, B.T)) + ' s.';
          body = '<p>The time in the air depends only on the vertical motion: the starting v<sub>y</sub> (A: ' + F(A.vy, 2) + ' m/s, B: ' + F(B.vy, 2) + ' m/s), the launch height (A: ' + A.h + ' m, B: ' + B.h + ' m) and g. The horizontal speed only decides how far each goes.</p>' + (Math.abs(A.vy - B.vy) < 0.01 && A.h === B.h ? '<p>Same v<sub>y</sub> and same height: they must land together, whatever their horizontal speeds.</p>' : '');
          nums = '<tr><th scope="col"></th><th scope="col" class="r">A</th><th scope="col" class="r">B</th></tr>' +
            row3('Speed, angle', F(A.v, 1) + ' m/s, ' + A.angle + '°', F(B.v, 1) + ' m/s, ' + B.angle + '°') + row3('Launch height', A.h + ' m', B.h + ' m') +
            row3('v<sub>x</sub>', F(A.vx, 2) + ' m/s', F(B.vx, 2) + ' m/s') + row3('v<sub>y</sub> at launch', F(A.vy, 2) + ' m/s', F(B.vy, 2) + ' m/s') +
            row3('Time of flight', W3(A.T) + ' s', W3(B.T) + ' s') + row3('Range', W3(A.R) + ' m', W3(B.R) + ' m') + row3('Highest point', W3(A.H) + ' m', W3(B.H) + ' m');
        } else {
          var L = B, q = L.at(clamp(st.t, 0, L.T));
          head = !st.flown ? '<b>Aim, then Launch.</b> ' + (L.h ? 'From ' + L.h + ' m up.' : 'From the ground.') : !done ? 'In flight: v<sub>x</sub> stays ' + F(L.vx, 1) + ' m/s.' : '<b>Lands ' + W3(L.R) + ' m away after ' + W3(L.T) + ' s.</b> Top: ' + W3(L.H) + ' m.';
          body = '<p><b>Sideways:</b> nothing pushes the ball sideways, so v<sub>x</sub> = v cos θ = ' + F(L.vx, 2) + ' m/s the whole flight: every horizontal arrow is the same length and the dots are evenly spaced across.</p>' +
            '<p><b>Up and down:</b> v<sub>y</sub> starts at v sin θ = ' + F(L.vy, 2) + ' m/s and changes by ' + st.g + ' m/s every second (g, downward). ' + (L.vy > 0 ? 'It shrinks to zero at the top (' + W3(L.tTop) + ' s), then grows downward.' : 'It only grows downward.') + '</p>' +
            '<p><b>Together:</b> the time in the air comes from the vertical motion alone (' + W3(L.T) + ' s); the range is v<sub>x</sub> × that time = ' + W3(L.R) + ' m.' + (L.h === 0 && L.angle > 0 && L.angle < 90 ? ' On level ground ' + L.angle + '° and ' + (90 - L.angle) + '° give the same range.' : '') + '</p>';
          nums = row('v<sub>x</sub> = v cos θ', F(L.vx, 2) + ' m/s') + row('v<sub>y</sub> at launch = v sin θ', F(L.vy, 2) + ' m/s') + row('Time of flight', W3(L.T) + ' s') + row('Range', W3(L.R) + ' m') + row('Highest point (above the ground)', W3(L.H) + ' m') + (L.tTop ? row('Time to the top', W3(L.tTop) + ' s') : '') +
            (st.flown ? row('At t = ' + F(q.t, 2) + ' s', 'x ' + F(q.x, 2) + ' m, y ' + F(Math.max(0, q.y), 2) + ' m') + row('… velocity', 'v<sub>x</sub> ' + F(q.vx, 2) + ', v<sub>y</sub> ' + F(q.vy, 2) + ' m/s') : '');
        }
      }
      T.explain($('.pl-say'), head, body);
      $('.pl-nums').innerHTML = '<h3 class="ls-title-l">The numbers</h3><table class="ls-tbl pl-tbl"><caption class="sr-only">The launch in numbers</caption><tbody>' + nums + '</tbody></table><p class="bt-small">g = ' + st.g + ' m/s², no air resistance.</p>';
      if(sT.el.parentNode !== $('.pl-nums').parentNode) $('.pl-nums').parentNode.insertBefore(sT.el, $('.pl-nums').nextSibling);
      if(LS){ LS.caption(head, 'explore'); pillsNow(); }
    }
    function row(k, v){ return '<tr><th scope="row">' + k + '</th><td class="r">' + v + '</td></tr>'; }
    function row3(k, a, b){ return '<tr><th scope="row">' + k + '</th><td class="r">' + a + '</td><td class="r">' + b + '</td></tr>'; }
    function pillsNow(){
      if(!LS) return;
      var left = [], right = [];
      if(st.view === 'cart'){ var K = cartModel(), q = (st.frame === 'cart' ? K.cart : K.ground)(st.t); left.push({ k: 't', html: F(st.t, 2) + ' s', tone: 'readout' }, { k: 'v<sub>x</sub>', html: F(q.vx, 1) + ' m/s', tone: 'readout' }); right.push({ html: st.frame === 'cart' ? 'Cart frame' : 'Ground frame', tone: 'ghost' }); }
      else {
        var Ls = launches(), L = Ls[Ls.length - 1].L, tq = clamp(st.t, 0, L.T), q2 = L.at(tq);
        left.push({ k: 't', html: F(st.t, 2) + ' s', tone: 'readout' });
        if(Ls.length === 1) left.push({ k: 'v<sub>x</sub>', html: F(q2.vx, 1), tone: 'readout' }, { k: 'v<sub>y</sub>', html: F(q2.vy, 1) + ' m/s', tone: 'readout' });
        if(st.flown && st.rate < 0.99) right.push({ html: 'Slow motion ×' + F(st.rate, 2), tone: 'ghost' });
      }
      var narrow = false; try{ narrow = matchMedia('(max-width: 599.98px)').matches; }catch(e){}
      if(narrow && left.length > 1) left = [{ html: left.map(function(x){ return '<span class="pl-pk">' + x.k + '</span> ' + x.html; }).join(' · '), tone: 'ghost' }];
      LS.pills(left, 'left', 'explore'); LS.pills(right, 'right', 'explore');
    }

    if(window.ResizeObserver){
      var ro = new ResizeObserver(function(){ var w = Math.round(svg.parentNode.clientWidth), h = Math.round(svg.parentNode.clientHeight); if(geo && w === geo.w && (h <= 160 || h === geo.hA)) return; geo = null; draw(false); });
      ro.observe(svg.parentNode);
    }

    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'phys-ls-stage pl-ls-stage'; stage.appendChild($('.pl-stage'));
      s.add('stage', stage, o);
      var dock = document.createElement('div'); dock.className = 'phys-ls-dock pl-ls-dock'; dock.appendChild($('.pl-ctl'));
      s.add('dock', dock, o);
      var why = document.createElement('div'); why.className = 'ls-sec phys-ls-why'; why.appendChild(cue.el); why.appendChild($('.pl-say'));
      s.add('why', why, o);
      var det = document.createElement('div'); det.className = 'ls-sec phys-ls-det pl-ls-det';
      det.appendChild($('.pl-nums')); det.appendChild(sT.el);
      var mo = pane.querySelector('details.bt-more'); if(mo){ mo.open = true; mo.querySelector('summary').textContent = 'Cliff height, g and arrows'; det.appendChild(mo); }
      s.add('details', det, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      geo = null; draw(true);
      if(s.mode() === 'explore') s.hint({ target: svg.querySelector('.pl-aim'), text: 'Drag to aim', key: 'apphys-projectile-aim' });
    }
    draw(true);
    return { stop: stop, studio: studio };
  }

  /* ============================================================ quiz figures */
  /* The setup only (the problem's givens), never an answer. */
  function figure(f){
    var w = 520, h = 250, p = [], ground = h - 30;
    // Sky and ground run past the viewBox, so a stage that letterboxes the
    // figure shows more of the same scene, not a blank band.
    p.push('<rect class="pl-sky" x="-600" y="-600" width="' + (w + 1200) + '" height="' + (ground + 600) + '"/>');
    p.push(grass(-600, w + 600, ground));
    if(f.cart){
      var cx = 150;
      p.push(cartArt(cx, ground, 90));
      p.push(PS.arrow(cx, ground - 64, 70, 0, { cls: 'pl-cartv', width: 3, label: 'v_cart' }));
      p.push(label(cx + 80, ground - 74, F(f.u, 1) + ' m/s', 'start', 'pl-mk'));
      p.push(ball(cx, ground - 66, 7));
      p.push(PS.arrow(cx, ground - 76, 0, -80, { cls: 'vel', width: 3 }));
      p.push(label(cx + 10, ground - 140, F(f.w, 1) + ' m/s up (seen from the cart)', 'start', 'pl-mk'));
      p.push('<path class="pl-guide" d="M' + (cx + 90) + ' ' + (ground - 20) + 'h160" stroke-dasharray="4 6"/>');
      return PS.svg(w, h, 'A cart rolling to the right at ' + F(f.u, 1) + ' m/s launches a ball straight up at ' + F(f.w, 1) + ' m/s relative to the cart.', p.join(''));
    }
    var L = P.launch({ v: f.v, angle: f.angle, h: f.h, g: f.g }), Lo = f.other ? P.launch({ v: f.other.v, angle: f.other.angle, h: f.h, g: f.g }) : null;
    var spanX = Math.max(L.R, Lo ? Lo.R : 0, 4) * 1.15, spanY = Math.max(L.H, Lo ? Lo.H : 0, f.h, 2) * 1.2;
    var x0 = f.h ? 90 : 60, ppm = Math.min((w - x0 - 20) / spanX, (ground - 20) / spanY);
    var Xf = function(x){ return x0 + x * ppm; }, Yf = function(y){ return ground - y * ppm; };
    if(f.h) p.push(cliff(x0, Yf(f.h), ground, -600));
    var path = function(LL, cls){ var q = []; for(var k = 0; k <= 60; k++){ var s = LL.at(LL.T * k / 60); q.push(Xf(s.x).toFixed(1) + ',' + Yf(Math.max(0, s.y)).toFixed(1)); } return '<polyline class="' + cls + '" points="' + q.join(' ') + '"/>'; };
    if(f.show !== 'components') p.push(path(L, 'pl-guide'));
    if(Lo) p.push(path(Lo, 'pl-guide pl-a'));
    if(f.show === 'top' && L.tTop > 0){ var tp = L.at(L.tTop); p.push('<line class="pl-mark" x1="' + Xf(tp.x).toFixed(1) + '" x2="' + Xf(tp.x).toFixed(1) + '" y1="' + Yf(tp.y).toFixed(1) + '" y2="' + ground + '"/>' + label(Xf(tp.x) + 6, Yf(tp.y) - 6, 'highest point?', 'start', 'pl-mk')); }
    p.push(cannon(Xf(0) - 6, Yf(f.h) - 12, f.angle, 34, 'is-live'));
    var ox = Xf(0), oy = Yf(f.h), al = 70;
    p.push(arc(ox, oy, 34, f.angle));
    if(f.v > 0) p.push(PS.arrow(ox, oy, Math.cos(M.rad(f.angle)) * al, -Math.sin(M.rad(f.angle)) * al, { cls: 'vel', width: 3 }));
    if(f.angle) p.push(label(ox + 40, oy + (f.angle > 0 ? -6 : 18), M.minus(String(f.angle)) + '°', 'start', 'pl-mk'));
    if(f.v > 0) p.push(label(ox + Math.cos(M.rad(f.angle)) * al + 10, oy - Math.sin(M.rad(f.angle)) * al - (f.angle > 30 ? 8 : -4), 'v = ' + F(f.v, 1) + ' m/s', 'start', 'pl-mk'));
    if(f.show === 'components'){
      p.push('<line class="pl-help" x1="' + ox + '" y1="' + oy + '" x2="' + (ox + Math.cos(M.rad(f.angle)) * al).toFixed(1) + '" y2="' + oy + '"/><line class="pl-help" x1="' + (ox + Math.cos(M.rad(f.angle)) * al).toFixed(1) + '" y1="' + oy + '" x2="' + (ox + Math.cos(M.rad(f.angle)) * al).toFixed(1) + '" y2="' + (oy - Math.sin(M.rad(f.angle)) * al).toFixed(1) + '"/>');
      p.push(label(ox + Math.cos(M.rad(f.angle)) * al / 2, oy + 16, 'v<tspan dy="4" font-size="0.75em">x</tspan>', 'middle', 'pl-mk') + label(ox + Math.cos(M.rad(f.angle)) * al + 8, oy - Math.sin(M.rad(f.angle)) * al / 2, 'v<tspan dy="4" font-size="0.75em">y</tspan>', 'start', 'pl-mk'));
    }
    if(Lo){ p.push(ball(ox + 4, oy - 4, 6, 'pl-a') + label(ox - 4, oy - 14, 'A', 'end', 'pl-id')); p.push(label(ox + 16, oy + 22, 'B', 'start', 'pl-id'));
      if(f.other.v === 0) p.push('<line class="pl-guide pl-a" x1="' + (ox + 4) + '" x2="' + (ox + 4) + '" y1="' + (oy + 4) + '" y2="' + ground + '"/>'); }
    if(f.h){ p.push('<line class="pl-help" x1="' + (x0 - 18) + '" x2="' + (x0 - 18) + '" y1="' + Yf(f.h).toFixed(1) + '" y2="' + ground + '"/>' + label(x0 - 24, (Yf(f.h) + ground) / 2 + 4, F(f.h, 1) + ' m', 'end', 'pl-mk pl-on-rock')); }
    return PS.svg(w, h, 'A ball launched at ' + F(f.v, 1) + ' m/s, ' + f.angle + '° from the horizontal, from ' + (f.h ? 'a height of ' + F(f.h, 1) + ' m' : 'level ground') + (Lo ? '; a second ball A leaves from the same point' : '') + '.', p.join(''));
  }

  /* ============================================================ quiz */
  function quiz(host, data){
    var TYPES = [
      { value: 'components', label: 'Components of a launch velocity' },
      { value: 'flight', label: 'Horizontal launch: time and distance' },
      { value: 'range', label: 'Time of flight and range' },
      { value: 'maxh', label: 'Maximum height' },
      { value: 'first', label: 'Which lands first?' },
      { value: 'vxconst', label: 'The horizontal velocity stays the same' },
      { value: 'relative', label: 'Seen from a moving cart' }
    ];
    T.drill(host, data, {
      slug: 'projectile-lab', types: TYPES, typeLabel: 'Kind of problem',
      title: function(p){ var t = TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Practice problem'; },
      generate: function(r, ctx, type){ return P.generate(r, ctx, type); },
      extra: function(el, p){ if(p.fig) el.innerHTML = '<figure class="cd-fig pl-qfig">' + figure(p.fig) + '</figure>'; }
    });
  }
})();
