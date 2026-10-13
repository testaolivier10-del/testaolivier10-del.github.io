/* Oscillator lab (Unit 7 trainer; docs/apphys-spec.md section 6). OWNED BY
   THIS TOOL ONLY. Model: ApPhysMath.oscillatorLab (tools/math/oscillator-lab.js).

   Explore: a cart on a spring (horizontal), a mass hanging from a spring
   (vertical) or a pendulum, integrated live from Newton's second law (the
   pendulum with the full sin θ). Drag the mass to set the amplitude, press
   Play. The x-t, v-t and a-t graphs and the K / U energy bars draw from the
   same simulation; the period is measured from the motion (zero crossings)
   and shown beside the formula. Pick one thing to change (mass, spring
   constant, amplitude, length, angle, planet) and the caption says what it
   did to the period, as a factor.

   Test yourself: ApPhysTools.drill over the model's five problem kinds
   (period, what changes the period, maxima, energy, reading an x-t graph). */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath, S = window.ApPhysScene;
  if(!T || !M || !M.oscillatorLab || !S) return;
  var OL = M.oscillatorLab, esc = T.esc, F = T.F, TAU = 2 * Math.PI;
  var uid = 0;
  function nid(p){ return (p || 'ol') + (++uid); }
  function n1(x){ return Math.round(x * 10) / 10; }
  function gv(x){ return M.fmt(x, Number(Number(x).toPrecision(2)) === x ? 2 : 3); }
  function ratioTxt(r){ return Math.abs(r - 1) < 0.005 ? 'unchanged' : '× ' + F(r, 2); }

  (function(){ var me = document.currentScript, href = me && me.src ? me.src.replace(/\.js(\?.*)?$/, '.css') : '';
    if(href && !document.querySelector('link[href$="tools/oscillator-lab.css"]')){ var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); } })();
  var appEl = document.getElementById('app');
  if(appEl) appEl.setAttribute('data-details-title', 'Settings & numbers');

  T.mount('oscillator-lab', function(app, data){
    document.body.classList.add('ol-root');
    var ex = null;
    T.modes(app, { slug: 'oscillator-lab', explore: function(pane){ ex = explore(pane, data); },
      quiz: function(pane){ quiz(pane, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------------ art */
  function defs(id){
    return '<defs>' +
      '<linearGradient id="' + id + 'm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ol-m1"/><stop offset="1" class="ol-m2"/></linearGradient>' +
      '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="ol-b2"/><stop offset=".4" class="ol-b1"/><stop offset="1" class="ol-b2"/></linearGradient>' +
      '<radialGradient id="' + id + 'r" cx=".35" cy=".32" r=".75"><stop offset="0" class="ol-b1"/><stop offset="1" class="ol-b2"/></radialGradient>' +
      '<linearGradient id="' + id + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ol-w1"/><stop offset="1" class="ol-w2"/></linearGradient>' +
      '<linearGradient id="' + id + 'c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ol-c1"/><stop offset="1" class="ol-c2"/></linearGradient>' +
      '<pattern id="' + id + 'h" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" class="ol-hatch"/></pattern>' +
      '</defs>';
  }
  /* A coil spring from (x1, y1) to (x2, y2): straight leads, then n turns of
     width w drawn as a zigzag with a lighter back stroke, so it reads as a
     helix and stretches with the motion. */
  function coil(x1, y1, x2, y2, n, w){
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L, px = -uy, py = ux;
    var lead = Math.min(12, L * 0.12), a = lead, b = L - lead, seg = (b - a) / (2 * n);
    var front = 'M' + n1(x1) + ' ' + n1(y1) + 'L' + n1(x1 + ux * a) + ' ' + n1(y1 + uy * a), back = '';
    for(var i = 0; i < 2 * n; i++){
      var t = a + seg * (i + 0.5), side = i % 2 ? -1 : 1, X = x1 + ux * t + px * side * w / 2, Y = y1 + uy * t + py * side * w / 2;
      if(i % 2){ back += 'M' + n1(x1 + ux * (t - seg) + px * w / 2) + ' ' + n1(y1 + uy * (t - seg) + py * w / 2) + 'L' + n1(X) + ' ' + n1(Y); }
      front += 'L' + n1(X) + ' ' + n1(Y);
    }
    front += 'L' + n1(x1 + ux * b) + ' ' + n1(y1 + uy * b) + 'L' + n1(x2) + ' ' + n1(y2);
    return '<path class="ol-coilb" d="' + back + '"/><path class="ol-coil" d="' + front + '"/>';
  }
  function cartArt(id, x, y, w, h){
    return '<rect class="ol-body" x="' + n1(x - w / 2) + '" y="' + n1(y - h) + '" width="' + n1(w) + '" height="' + n1(h - 6) + '" rx="6" fill="url(#' + id + 'c)" stroke="#173F5F" stroke-width="1.2"/>' +
      '<rect x="' + n1(x - w / 2 + 6) + '" y="' + n1(y - h + 5) + '" width="' + n1(w - 12) + '" height="4" rx="2" fill="#fff" opacity=".3"/>' +
      [-1, 1].map(function(sg){ return '<circle cx="' + n1(x + sg * w * 0.28) + '" cy="' + n1(y - 6) + '" r="7" fill="url(#' + id + 'm)" class="ol-metal"/><circle cx="' + n1(x + sg * w * 0.28) + '" cy="' + n1(y - 6) + '" r="2" fill="#2E3438"/>'; }).join('');
  }
  function massArt(id, x, y, w, h, label){
    return '<rect class="ol-body" x="' + n1(x - w / 2) + '" y="' + n1(y) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="5" fill="url(#' + id + 'b)" stroke="#6B4E12" stroke-width="1.2"/>' +
      '<rect x="' + n1(x - w / 2 + 3) + '" y="' + n1(y + 3) + '" width="' + n1(w - 6) + '" height="3" rx="1.5" fill="#fff" opacity=".35"/>' +
      (label ? '<text x="' + n1(x) + '" y="' + n1(y + h / 2 + 4.5) + '" text-anchor="middle" font-size="12" font-weight="900" fill="#2B2205">' + esc(label) + '</text>' : '');
  }
  function kgTxt(m){ return m < 1 ? Math.round(m * 1000) + ' g' : F(m, 2).replace(/0$/, '') + ' kg'; }

  /* ------------------------------------------------------------ explore */
  var VARS = {
    spring: [
      { key: 'm', name: 'Mass', sym: 'm', unit: 'kg', min: 0.1, max: 2, step: 0.05, d: 2 },
      { key: 'k', name: 'Spring constant', sym: 'k', unit: 'N/m', min: 5, max: 100, step: 1, d: 0 },
      { key: 'A', name: 'Amplitude', sym: 'A', unit: 'm', min: 0.02, max: 0.2, step: 0.01, d: 2 }],
    vspring: [
      { key: 'm', name: 'Mass', sym: 'm', unit: 'kg', min: 0.1, max: 1, step: 0.05, d: 2 },
      { key: 'k', name: 'Spring constant', sym: 'k', unit: 'N/m', min: 10, max: 100, step: 1, d: 0 },
      { key: 'A', name: 'Amplitude', sym: 'A', unit: 'm', min: 0.02, max: 0.15, step: 0.01, d: 2 },
      { key: 'g', name: 'Planet', sym: 'g', unit: 'm/s²' }],
    pendulum: [
      { key: 'L', name: 'Length', sym: 'ℓ', unit: 'm', min: 0.25, max: 2, step: 0.05, d: 2 },
      { key: 'm', name: 'Mass', sym: 'm', unit: 'kg', min: 0.1, max: 2, step: 0.05, d: 2 },
      { key: 'A', name: 'Release angle', sym: 'θ₀', unit: '°', min: 2, max: 60, step: 1, d: 0 },
      { key: 'g', name: 'Planet', sym: 'g', unit: 'm/s²' }]
  };
  var NAMES = { spring: 'Spring, horizontal', vspring: 'Spring, vertical', pendulum: 'Pendulum' };
  var PL = OL.PLANETS;

  function explore(host, data){
    var s = null, say = T.announcer(document.createElement('p')), did = nid('old');
    var P = { spring: { type: 'spring', m: 0.5, k: 20, A: 0.10, g: 9.8 }, vspring: { type: 'vspring', m: 0.4, k: 25, A: 0.08, g: 9.8 }, pendulum: { type: 'pendulum', m: 0.5, L: 1.0, A: 10, g: 9.8 } };
    var sysKey = 'spring', sys = P.spring, varKey = 'm', st = null, playing = false, slow = 1, hist = [], cross = [], tMeas = null;
    var base = null;   // { key, value, T } before the student's change
    host.innerHTML = '';
    var stage = document.createElement('div'); stage.className = 'ol-stage';
    stage.innerHTML = '<div class="ol-top"><div class="ol-scene"></div><div class="ol-bars"></div></div>' +
      '<div class="ol-graphs"><div class="tseg ol-gsel" role="group" aria-label="Graph"><button type="button" data-g="x" class="on" aria-pressed="true">x–t</button><button type="button" data-g="v" aria-pressed="false">v–t</button><button type="button" data-g="a" aria-pressed="false">a–t</button></div>' +
      '<div class="ol-graph is-on" data-g="x"></div><div class="ol-graph" data-g="v"></div><div class="ol-graph" data-g="a"></div></div>';
    var sceneEl = stage.querySelector('.ol-scene'), barsEl = stage.querySelector('.ol-bars');
    stage.querySelectorAll('.ol-gsel [data-g]').forEach(function(b){ b.addEventListener('click', function(){
      var g = b.getAttribute('data-g');
      stage.querySelectorAll('.ol-gsel [data-g]').forEach(function(x){ var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
      stage.querySelectorAll('.ol-graph').forEach(function(x){ x.classList.toggle('is-on', x.getAttribute('data-g') === g); });
    }); });
    var cue = T.cue('Press Play, then pick one thing to change and see whether the period changes.');
    var dock = document.createElement('div'); dock.className = 'ol-dock';
    dock.innerHTML = '<div class="tseg ol-sys" role="group" aria-label="Oscillator">' + Object.keys(NAMES).map(function(k){ return '<button type="button" data-sys="' + k + '"' + (k === sysKey ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + (k === 'spring' ? 'Spring ↔' : k === 'vspring' ? 'Spring ↕' : 'Pendulum') + '</button>'; }).join('') + '</div>' +
      '<div class="ol-vars" role="group" aria-label="What to change"></div><div class="ol-varctl"></div>' +
      '<div class="ol-row ls-act"><button type="button" class="ls-btn ls-pri ol-play" aria-pressed="false">Play</button><button type="button" class="ls-btn ol-reset">Release again</button></div>';
    var why = document.createElement('div');
    var det = document.createElement('div');
    det.innerHTML = '<label class="ol-check"><input type="checkbox" class="ol-slow"> <span>Slow motion (¼ speed; the graphs keep real time)</span></label><h3 class="ls-title-l">The numbers</h3><div class="ol-nums"></div>';
    det.querySelector('.ol-slow').addEventListener('change', function(e){ slow = e.target.checked ? 0.25 : 1; });
    host.appendChild(cue.el); host.appendChild(stage); host.appendChild(dock); host.appendChild(why); host.appendChild(det);
    var playBtn = dock.querySelector('.ol-play'), varsEl = dock.querySelector('.ol-vars'), varCtl = dock.querySelector('.ol-varctl');

    function period(){ return OL.period(sys) * (sys.type === 'pendulum' ? OL.largeAngle(sys.A) : 1); }
    function window_(){ return Math.max(1.5, Math.min(12, 2.5 * period())); }
    function release(){ st = OL.init(sys); hist = [sample(st)]; cross = []; tMeas = null; }
    function sample(q){ var a = OL.accel(sys, q.x), k = sys.type === 'pendulum' ? sys.L : 1; return { t: q.t, x: q.x * k, v: q.v * k, a: a * k }; }

    var loop = S.loop(function(dt){
      var h = dt * slow, before = st;
      st = OL.advance(sys, st, h);
      var newT = false;
      if(before.x > 0 && st.x <= 0){ var tc = before.t + (st.t - before.t) * before.x / (before.x - st.x); cross.push(tc); if(cross.length > 1){ tMeas = cross[cross.length - 1] - cross[cross.length - 2]; newT = true; } }
      hist.push(sample(st));
      var w = window_(); while(hist.length > 2 && hist[0].t < st.t - w) hist.shift();
      draw(!newT);
    }, { still: function(){ fill(); draw(); } });
    /* Reduced motion: compute a whole window of motion at once. */
    function fill(){
      release();
      var w = window_(), n = Math.ceil(w / 0.01);
      for(var i = 0; i < n; i++){ var b = st; st = OL.advance(sys, st, 0.01); if(b.x > 0 && st.x <= 0){ cross.push(b.t + 0.01 * b.x / (b.x - st.x)); if(cross.length > 1) tMeas = cross[cross.length - 1] - cross[cross.length - 2]; } hist.push(sample(st)); }
    }
    function play(on){
      playing = on; playBtn.setAttribute('aria-pressed', String(on)); playBtn.textContent = on ? 'Pause' : 'Play';
      if(on){ cue.done(); loop.start(); if(S.reduced()){ playing = false; playBtn.setAttribute('aria-pressed', 'false'); playBtn.textContent = 'Play'; } } else loop.stop();
    }
    playBtn.addEventListener('click', function(){ play(!playing); });
    dock.querySelector('.ol-reset').addEventListener('click', function(){ loop.stop(); release(); if(playing || S.reduced()) { playing = false; play(true); } else draw(); });
    dock.querySelectorAll('[data-sys]').forEach(function(b){ b.addEventListener('click', function(){
      var k = b.getAttribute('data-sys'); if(k === sysKey) return;
      loop.stop(); playing = false; play(false);
      sysKey = k; sys = P[k]; varKey = VARS[k][0].key; base = null;
      dock.querySelectorAll('[data-sys]').forEach(function(x){ var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
      buildVars(); release(); built = false; draw();
      T.event('apphys-tool-scene', { tool: 'oscillator-lab', scene: k });
    }); });

    function vdef(){ return VARS[sysKey].filter(function(v){ return v.key === varKey; })[0]; }
    function buildVars(){
      varsEl.innerHTML = VARS[sysKey].map(function(v){ return '<button type="button" class="bt-btn" data-v="' + v.key + '" aria-pressed="' + (v.key === varKey) + '">' + v.sym + '</button>'; }).join('');
      varsEl.querySelectorAll('[data-v]').forEach(function(b){ b.setAttribute('aria-label', 'Change the ' + VARS[sysKey].filter(function(v){ return v.key === b.getAttribute('data-v'); })[0].name.toLowerCase());
        b.addEventListener('click', function(){ varKey = b.getAttribute('data-v'); base = null; buildVars(); cue.done(); draw(); }); });
      var v = vdef();
      varCtl.innerHTML = '';
      if(v.key === 'g'){
        varCtl.innerHTML = '<div class="ol-planets" role="group" aria-label="Planet">' + PL.map(function(p){ return '<button type="button" class="bt-btn" data-p="' + p.g + '" aria-pressed="' + (Math.abs(p.g - sys.g) < 1e-9) + '">' + esc(p.name.replace(/^the /, '').replace(/^./, function(c){ return c.toUpperCase(); })) + '</button>'; }).join('') + '</div>';
        varCtl.querySelectorAll('[data-p]').forEach(function(b){ b.addEventListener('click', function(){ change('g', +b.getAttribute('data-p')); varCtl.querySelectorAll('[data-p]').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); }); }); });
      } else {
        var sl = T.slider({ label: v.name + ' (' + v.sym + ')', min: v.min, max: v.max, step: v.step, value: sys[v.key], unit: v.unit, decimals: v.d, onInput: function(x){ change(v.key, x); } });
        varCtl.appendChild(sl.el);
        varCtl.slider = sl;
      }
    }
    function change(key, val){
      if(!base || base.key !== key) base = { key: key, value: sys[key], T: period() };
      sys[key] = val; cue.done();
      var wasPlaying = playing;
      loop.stop(); release(); built = false;
      if(wasPlaying){ playing = false; play(true); draw(); } else draw();
    }

    /* ----- drawing */
    var built = false, gEls = {};
    function geom(){
      var nar = (sceneEl.clientWidth || 500) < 420;
      if(sys.type === 'spring') return { W: 520, H: 200, nar: nar, vb: '6 30 500 160' };
      if(sys.type === 'vspring') return { W: 380, H: 360, nar: nar };
      return { W: 420, H: 360, nar: nar };
    }
    function drawScene(){
      var g = geom(), W = g.W, H = g.H, out = '', x = st.x, label = '';
      if(sys.type === 'spring'){
        var ppm = 600, eqX = 300, y = 150, cw = 64 + 18 * Math.sqrt(sys.m), cx = eqX + x * ppm;
        out += '<rect class="ol-wood" x="20" y="' + y + '" width="' + (W - 30) + '" height="14" rx="3" fill="url(#' + did + 'w)"/>' +
          '<rect class="ol-wall" x="14" y="40" width="22" height="' + (y - 40) + '"/><rect x="14" y="40" width="22" height="' + (y - 40) + '" fill="url(#' + did + 'h)"/>' +
          '<line class="ol-eq" x1="' + eqX + '" x2="' + eqX + '" y1="40" y2="' + (y + 22) + '"/><text class="ol-tm" x="' + eqX + '" y="' + (y + 34) + '" text-anchor="middle">x = 0</text>' +
          [-1, 1].map(function(sg){ return '<line class="ol-amp" x1="' + n1(eqX + sg * sys.A * ppm) + '" x2="' + n1(eqX + sg * sys.A * ppm) + '" y1="52" y2="' + (y + 18) + '"/><text class="ol-tm" x="' + n1(eqX + sg * sys.A * ppm) + '" y="48" text-anchor="middle">' + (sg < 0 ? '−A' : '+A') + '</text>'; }).join('') +
          coil(36, y - 26, cx - cw / 2, y - 26, 11, 22) + '<g class="ol-mass ol-drag" tabindex="0" role="slider" aria-label="Cart: drag it to stretch or squash the spring" aria-valuemin="-20" aria-valuemax="20" aria-valuenow="' + Math.round(x * 100) + '" aria-valuetext="' + F(x * 100, 0) + ' centimeters from equilibrium">' +
          '<rect class="ol-hit" x="' + n1(cx - cw / 2 - 10) + '" y="' + (y - 64) + '" width="' + n1(cw + 20) + '" height="70"/>' + cartArt(did, cx, y, cw, 46) +
          '<text x="' + n1(cx) + '" y="' + (y - 22) + '" text-anchor="middle" font-size="12" font-weight="900" fill="#fff">' + kgTxt(sys.m) + '</text></g>';
        label = 'A ' + kgTxt(sys.m) + ' cart on a spring of k = ' + F(sys.k, 0) + ' N/m, ' + F(x * 100, 1) + ' cm from equilibrium, amplitude ' + F(sys.A * 100, 0) + ' cm.';
      } else if(sys.type === 'vspring'){
        var L0 = 0.20, x0 = sys.m * sys.g / sys.k, mh = 0.06, tot = L0 + x0 + sys.A + mh, ppm2 = Math.min(600, (H - 70) / tot), top = 30, cx2 = W / 2;
        var eqY = top + (L0 + x0) * ppm2, my = eqY + x * ppm2, mw = 46 + 16 * Math.sqrt(sys.m), mhp = 28 + 14 * Math.sqrt(sys.m);
        out += '<rect class="ol-metal" x="40" y="' + (top - 16) + '" width="' + (W - 80) + '" height="12" rx="3" fill="url(#' + did + 'm)"/><rect class="ol-metal" x="' + (cx2 - 6) + '" y="' + (top - 6) + '" width="12" height="8" fill="url(#' + did + 'm)"/>' +
          '<line class="ol-eq" x1="' + (cx2 - 80) + '" x2="' + (cx2 + 80) + '" y1="' + n1(eqY + 6 + mhp / 2) + '" y2="' + n1(eqY + 6 + mhp / 2) + '"/><text class="ol-tm" x="' + (cx2 + 84) + '" y="' + n1(eqY + 6 + mhp / 2 + 4) + '">equilibrium</text>' +
          '<line class="ol-amp" x1="' + (cx2 - 70) + '" x2="' + (cx2 - 30) + '" y1="' + n1(top + L0 * ppm2) + '" y2="' + n1(top + L0 * ppm2) + '"/><text class="ol-tm" x="' + (cx2 - 74) + '" y="' + n1(top + L0 * ppm2 + 4) + '" text-anchor="end">unstretched</text>' +
          coil(cx2, top + 2, cx2, my, 13, 26) + '<g class="ol-mass ol-drag" tabindex="0" role="slider" aria-label="Mass: drag it up or down from equilibrium" aria-valuemin="-15" aria-valuemax="15" aria-valuenow="' + Math.round(x * 100) + '" aria-valuetext="' + F(Math.abs(x) * 100, 0) + ' centimeters ' + (x >= 0 ? 'below' : 'above') + ' equilibrium">' +
          '<rect class="ol-hit" x="' + n1(cx2 - mw / 2 - 12) + '" y="' + n1(my - 10) + '" width="' + n1(mw + 24) + '" height="' + n1(mhp + 20) + '"/><path class="ol-metal" d="M' + cx2 + ' ' + n1(my) + 'v6" stroke-width="2.4"/>' + massArt(did, cx2, my + 6, mw, mhp, kgTxt(sys.m)) + '</g>' +
          '<g><line class="ol-amp" x1="' + (cx2 + 56) + '" x2="' + (cx2 + 56) + '" y1="' + n1(top + L0 * ppm2) + '" y2="' + n1(eqY) + '" style="stroke-dasharray:none"/><text class="ol-tm" x="' + (cx2 + 62) + '" y="' + n1(top + (L0 + x0 / 2) * ppm2 + 4) + '">mg/k = ' + F(x0 * 100, 1) + ' cm</text></g>';
        label = 'A ' + kgTxt(sys.m) + ' mass hanging from a spring of k = ' + F(sys.k, 0) + ' N/m, stretched ' + F(x0 * 100, 1) + ' cm at equilibrium, now ' + F(Math.abs(x) * 100, 1) + ' cm ' + (x >= 0 ? 'below' : 'above') + ' it.';
      } else {
        // The frame grows with the length: 0.25 m reads short, 2 m long, without cropping.
        var ppm3 = (H - 80) / Math.max(1, sys.L) * Math.min(1, (0.55 + 0.45 * sys.L / 2) / 1), px = W / 2, py = 26, Lp = sys.L * ppm3, th = x, bx = px + Lp * Math.sin(th), by = py + Lp * Math.cos(th), br = 11 + 8 * Math.sqrt(sys.m), A0 = M.rad(sys.A);
        out += '<rect class="ol-metal" x="' + (px - 120) + '" y="' + (py - 16) + '" width="240" height="12" rx="3" fill="url(#' + did + 'm)"/><circle cx="' + px + '" cy="' + py + '" r="5" fill="url(#' + did + 'm)" class="ol-metal"/>' +
          '<line class="ol-eq" x1="' + px + '" x2="' + px + '" y1="' + py + '" y2="' + n1(py + Lp + 28) + '"/>' +
          '<path class="ol-arc" d="M' + n1(px - Lp * Math.sin(A0)) + ' ' + n1(py + Lp * Math.cos(A0)) + 'A' + n1(Lp) + ' ' + n1(Lp) + ' 0 0 0 ' + n1(px + Lp * Math.sin(A0)) + ' ' + n1(py + Lp * Math.cos(A0)) + '"/>' +
          '<line class="ol-string" x1="' + px + '" y1="' + py + '" x2="' + n1(bx) + '" y2="' + n1(by) + '"/>' +
          '<g class="ol-mass ol-drag" tabindex="0" role="slider" aria-label="Bob: drag it to the side to set the release angle" aria-valuemin="-60" aria-valuemax="60" aria-valuenow="' + Math.round(M.deg(th)) + '" aria-valuetext="' + F(Math.abs(M.deg(th)), 0) + ' degrees ' + (th >= 0 ? 'right' : 'left') + ' of straight down">' +
          '<circle class="ol-hit" cx="' + n1(bx) + '" cy="' + n1(by) + '" r="' + n1(br + 16) + '"/><circle class="ol-body" cx="' + n1(bx) + '" cy="' + n1(by) + '" r="' + n1(br) + '" fill="url(#' + did + 'r)" stroke="#6B4E12" stroke-width="1.2"/></g>' +
          '<text class="ol-tm" x="' + n1(px - 10) + '" y="' + n1(py + Lp * 0.5) + '" text-anchor="end">ℓ = ' + F(sys.L, 2) + ' m</text>' +
          '<text class="ol-tm" x="' + n1(px + Lp * Math.sin(A0) + 6) + '" y="' + n1(py + Lp * Math.cos(A0) - 8) + '">' + F(sys.A, 0) + '°</text>';
        label = 'A pendulum ' + F(sys.L, 2) + ' m long with a ' + kgTxt(sys.m) + ' bob, released from ' + F(sys.A, 0) + ' degrees, now at ' + F(M.deg(th), 1) + ' degrees.';
      }
      var pl = PL.filter(function(p){ return Math.abs(p.g - sys.g) < 1e-9; })[0];
      if(sys.type !== 'spring') out += '<text class="ol-tm" x="' + (W - 10) + '" y="' + (H - 8) + '" text-anchor="end">' + (pl ? (pl.name === 'Earth' ? 'On Earth' : 'On ' + pl.name) : '') + ', g = ' + sys.g + ' m/s²</text>';
      if(g.nar && sys.type === 'spring') out = out.replace(/class="ol-tm"/g, 'class="ol-tm" font-size="16"');
      if(g.nar && sys.type === 'pendulum'){ var Lq = sys.L * (H - 80) / Math.max(1, sys.L) * Math.min(1, 0.55 + 0.45 * sys.L / 2), hw = Math.max(120, Lq * Math.sin(M.rad(Math.max(sys.A, 8))) + 50); g.vb = n1(W / 2 - hw) + ' 6 ' + n1(2 * hw) + ' ' + n1(Lq + 60); }
      sceneEl.innerHTML = '<svg viewBox="' + (g.vb || '0 0 ' + W + ' ' + H) + '" class="phys-scene" role="group" aria-label="' + esc(NAMES[sysKey]) + '">' + defs(did) + '<title>' + esc(label) + '</title>' + out + '</svg>';
      dragWire();
    }
    function drawBars(){
      var e = OL.energy(sys, st), E = e.E || 1, Hb = 200, top = 26, bw = 18, col = function(i, v, cls, t){ var h = Math.max(0, v / E * Hb); return '<rect class="ol-e-bg" x="' + (6 + i * 26) + '" y="' + top + '" width="' + bw + '" height="' + Hb + '" rx="4"/><rect class="' + cls + '" x="' + (6 + i * 26) + '" y="' + n1(top + Hb - h) + '" width="' + bw + '" height="' + n1(h) + '" rx="3"/><text class="ol-e-t" x="' + (15 + i * 26) + '" y="' + (top + Hb + 16) + '" text-anchor="middle">' + t + '</text>'; };
      var cols = sys.type === 'pendulum' ? [[e.K, 'ol-e-k', 'K'], [e.Ug, 'ol-e-ug', 'U<tspan dy="3" font-size="9">g</tspan>']] : sys.type === 'vspring' ? [[e.K, 'ol-e-k', 'K'], [e.Us, 'ol-e-us', 'U<tspan dy="3" font-size="9">s</tspan>'], [e.Ug, 'ol-e-ug', 'U<tspan dy="3" font-size="9">g</tspan>']] : [[e.K, 'ol-e-k', 'K'], [e.Us, 'ol-e-us', 'U<tspan dy="3" font-size="9">s</tspan>']];
      var Wd = 10 + cols.length * 26;
      barsEl.innerHTML = '<svg viewBox="0 0 ' + Wd + ' ' + (top + Hb + 22) + '" role="img" aria-label="' + esc('Energy now: K ' + F(e.K, 3) + ' J' + (sys.type !== 'pendulum' ? ', spring U ' + F(e.Us, 3) + ' J' : '') + (sys.type !== 'spring' ? ', gravitational U ' + F(e.Ug, 3) + ' J' : '') + '; total ' + F(e.E, 3) + ' J, constant.') + '">' +
        cols.map(function(c, i){ return col(i, c[0], c[1], c[2]); }).join('') + '<line class="ol-e-tot" x1="2" x2="' + (Wd - 2) + '" y1="' + top + '" y2="' + top + '"/><text class="ol-e-v" x="' + (Wd / 2) + '" y="' + (top - 8) + '" text-anchor="middle">E ' + F(e.E, e.E < 1 ? 3 : 2) + ' J</text></svg>';
    }
    /* Graphs: built once per run (axes, grid), the lines' points updated. */
    var GW = 360, GH = 104, GL = 46, GR = 10, GT = 8, GB = 22;
    function buildGraphs(){
      var w = window_(), A = sys.type === 'pendulum' ? sys.L * M.rad(sys.A) : sys.A, om = TAU / period();
      var amp = { x: A, v: A * om, a: sys.type === 'pendulum' ? sys.g * Math.sin(M.rad(sys.A)) : A * om * om };
      var unit = { x: sys.type === 'vspring' ? 'm, down' : 'm', v: 'm/s', a: 'm/s²' }, name = { x: sys.type === 'pendulum' ? 's' : 'x', v: 'v', a: 'a' };
      ['x', 'v', 'a'].forEach(function(k){
        var ym = T.niceMax(amp[k] * 1.1), PW = GW - GL - GR, PH = GH - GT - GB, ts = T.niceStep(w, 5), grid = '';
        for(var t = 0; t <= w + 1e-9; t += ts){ var X = GL + t / w * PW; grid += '<line class="ol-g-grid" x1="' + n1(X) + '" x2="' + n1(X) + '" y1="' + GT + '" y2="' + (GT + PH) + '"/>' + (X > GL + PW - 34 ? '' : '<text class="ol-g-tick" x="' + n1(X) + '" y="' + (GH - 8) + '" text-anchor="middle">' + M.fixed(t, ts < 1 ? 1 : 0) + '</text>'); }
        [-1, 0, 1].forEach(function(f){ var Y = GT + PH / 2 - f * PH / 2; grid += '<line class="' + (f ? 'ol-g-grid' : 'ol-g-zero') + '" x1="' + GL + '" x2="' + (GL + PW) + '" y1="' + n1(Y) + '" y2="' + n1(Y) + '"/>' + (f ? '<text class="ol-g-tick" x="' + (GL - 4) + '" y="' + n1(Y + 3) + '" text-anchor="end">' + M.fmt(f * ym, 2) + '</text>' : ''); });
        var el = stage.querySelector('.ol-graph[data-g="' + k + '"]');
        el.innerHTML = '<svg viewBox="0 0 ' + GW + ' ' + GH + '" class="phys-svg" role="img" aria-label="' + esc(name[k] + ' against time') + '"><rect class="ol-g-bg" x="' + GL + '" y="' + GT + '" width="' + PW + '" height="' + PH + '"/>' + grid +
          '<line class="ol-g-axis" x1="' + GL + '" x2="' + GL + '" y1="' + GT + '" y2="' + (GT + PH) + '"/>' +
          '<text class="ol-g-lbl" x="6" y="' + (GT + 11) + '">' + name[k] + '</text><text class="ol-g-tick" x="6" y="' + (GT + 24) + '">' + unit[k] + '</text><text class="ol-g-tick" x="' + (GL + PW) + '" y="' + (GH - 8) + '" text-anchor="end" dx="0">t (s)</text>' +
          '<g class="ol-g-Tg"></g><polyline class="ol-g-line ol-g-' + k + '" points=""/><circle class="ol-g-dot ol-g-d' + k + '" r="4" cx="-9" cy="-9"/></svg>';
        gEls[k] = { svg: el.querySelector('svg'), line: el.querySelector('polyline'), dot: el.querySelector('circle.ol-g-dot'), Tg: el.querySelector('.ol-g-Tg'), ym: ym, PW: PW, PH: PH, w: w, name: name[k], unit: unit[k] };
      });
    }
    function drawGraphs(){
      if(!hist.length) return;
      var t1 = hist[hist.length - 1].t, w = gEls.x.w, t0 = Math.max(0, t1 - w);
      ['x', 'v', 'a'].forEach(function(k){
        var G = gEls[k], pts = [];
        for(var i = 0; i < hist.length; i++){ var h = hist[i]; if(h.t < t0) continue; pts.push(n1(GL + (h.t - t0) / w * G.PW) + ',' + n1(GT + G.PH / 2 - h[k] / G.ym * G.PH / 2)); }
        G.line.setAttribute('points', pts.join(' '));
        var last = hist[hist.length - 1];
        G.dot.setAttribute('cx', n1(GL + (last.t - t0) / w * G.PW)); G.dot.setAttribute('cy', n1(GT + G.PH / 2 - last[k] / G.ym * G.PH / 2));
        // One measured period bracketed on x-t.
        if(k === 'x'){
          var c = cross.filter(function(t){ return t >= t0; });
          G.Tg.innerHTML = c.length > 1 ? (function(){ var a = GL + (c[c.length - 2] - t0) / w * G.PW, b = GL + (c[c.length - 1] - t0) / w * G.PW, y = GT + 6; return '<path class="ol-g-T" d="M' + n1(a) + ' ' + (y + 5) + 'v-5H' + n1(b) + 'v5"/><text class="ol-g-Tt" x="' + n1((a + b) / 2) + '" y="' + (y + 14) + '" text-anchor="middle">T</text>'; })() : '';
        }
      });
      gEls.x.svg.setAttribute('aria-label', 'Position against time over the last ' + F(w, 1) + ' s; now ' + F(hist[hist.length - 1].x, 3) + ' m.');
    }
    function readout(){
      var Tf = OL.period(sys), Tl = period(), e = OL.energy(sys, st), v = vdef();
      var formula = sys.type === 'pendulum' ? 'T = 2π√(ℓ/g) = 2π√(' + F(sys.L, 2) + ' / ' + sys.g + ')' : 'T = 2π√(m/k) = 2π√(' + F(sys.m, 2) + ' / ' + F(sys.k, 0) + ')';
      var head;
      if(base && base.key === varKey && Math.abs(sys[varKey] - base.value) > 1e-9){
        var r = Tl / base.T, f = sys[varKey] / base.value, nm = v.name.toLowerCase();
        var fac = v.key === 'g' ? 'g × ' + F(f, 2) : nm + ' × ' + F(f, 2);
        head = '<b>' + fac.charAt(0).toUpperCase() + fac.slice(1) + ' → period ' + ratioTxt(r) + '.</b> ' + (Math.abs(r - 1) < 0.005 ? (v.key === 'A' ? 'The period does not depend on the amplitude.' : v.key === 'm' ? 'Mass cancels for a pendulum.' : 'The spring\'s period does not depend on g.') : v.key === 'A' ? 'At large angles a real pendulum is a bit slower.' : 'T goes as ' + (v.key === 'k' || v.key === 'g' ? '1/√' : '√') + v.sym + '.');
      } else head = '<b>T = ' + F(Tl, 2) + ' s.</b> Change one thing and see whether the period changes.';
      var big = sys.type === 'pendulum' && sys.A > 15 ? '<p>At a ' + F(sys.A, 0) + '° release the pendulum is ' + F((OL.largeAngle(sys.A) - 1) * 100, 1) + '% slower than 2π√(ℓ/g): the small-angle formula assumes sin θ ≈ θ, which is good to 1% only below about 23°. Here the simulation uses the full equation.</p>' : '';
      var body = '<p>' + (sys.type === 'pendulum' ? 'The restoring force on the bob is m g sin θ along its path, close to proportional to the displacement for small angles, so the motion is close to simple harmonic: T = 2π√(ℓ/g). The bob\'s mass cancels (more mass, more pull, but more inertia).'
          : 'The spring pulls back with F = −k x, proportional to the displacement and opposite it: simple harmonic motion with T = 2π√(m/k). The amplitude does not appear: pulled twice as far, the cart feels twice the force and covers the longer path at twice the speed.' +
            (sys.type === 'vspring' ? ' Hanging, the mass sits m g / k lower; measured from that new equilibrium it moves exactly like the horizontal cart, with the same period on any planet.' : '')) + '</p>' +
        '<p>' + formula + ' = ' + F(Tf, 3) + ' s' + (tMeas ? '. Measured from the simulation (between zero crossings): ' + F(tMeas, 3) + ' s.' : '.') + '</p>' + big +
        '<p>On the graphs: v is greatest where x = 0 (the steepest part of x–t), and the acceleration is greatest at the ends, where v = 0. Energy sloshes between K and U; the total stays the same.' +
        (sys.type === 'pendulum' ? ' For the pendulum the graphs show s = ℓ θ, the distance along the arc from the bottom (positive to the right), and the bob\'s speed and acceleration along the arc.' : sys.type === 'vspring' ? ' Here x is measured downward from the equilibrium position, where the spring is already stretched m g / k.' : '') + '</p>';
      T.explain(why, head, body);
      if(s){
        s.caption(head, 'explore');
        s.pills([{ k: 'T', html: F(tMeas || Tl, 2) + ' s', tone: 'readout' }], 'left', 'explore');
        s.pills([{ html: tMeas ? 'measured' : 'from the formula', tone: 'ghost' }], 'right', 'explore');
      }
      var A = sys.type === 'pendulum' ? sys.L * M.rad(sys.A) : sys.A, om = TAU / Tl;
      det.querySelector('.ol-nums').innerHTML = '<table class="ol-tbl"><caption class="sr-only">This oscillator</caption><tbody>' +
        (sys.type === 'pendulum' ? '<tr><th scope="row">Length ℓ</th><td class="r">' + F(sys.L, 2) + ' m</td></tr><tr><th scope="row">Bob mass</th><td class="r">' + F(sys.m, 2) + ' kg</td></tr><tr><th scope="row">Release angle</th><td class="r">' + F(sys.A, 0) + '° (arc ' + F(A, 3) + ' m)</td></tr>'
          : '<tr><th scope="row">Mass m</th><td class="r">' + F(sys.m, 2) + ' kg</td></tr><tr><th scope="row">Spring constant k</th><td class="r">' + F(sys.k, 0) + ' N/m</td></tr><tr><th scope="row">Amplitude A</th><td class="r">' + F(sys.A, 2) + ' m</td></tr>') +
        (sys.type !== 'spring' ? '<tr><th scope="row">g</th><td class="r">' + sys.g + ' m/s²</td></tr>' : '') +
        '<tr class="hl"><th scope="row">Period, formula</th><td class="r">' + F(Tf, 3) + ' s</td></tr>' +
        (sys.type === 'pendulum' && sys.A > 5 ? '<tr><th scope="row">Period, full equation</th><td class="r">' + F(Tl, 3) + ' s</td></tr>' : '') +
        '<tr><th scope="row">Period, measured</th><td class="r">' + (tMeas ? F(tMeas, 3) + ' s' : 'press Play') + '</td></tr>' +
        '<tr><th scope="row">Frequency f = 1/T</th><td class="r">' + F(1 / Tl, 3) + ' Hz</td></tr>' +
        '<tr><th scope="row">Greatest speed</th><td class="r">' + F(sys.type === 'pendulum' ? Math.sqrt(2 * sys.g * sys.L * (1 - Math.cos(M.rad(sys.A)))) : A * om, 3) + ' m/s</td></tr>' +
        '<tr><th scope="row">Total energy</th><td class="r">' + F(e.E, 4) + ' J</td></tr></tbody></table>' +
        '<p class="bt-small">Energy zero points: spring U at its natural length; gravitational U at the lowest point. The simulation steps Newton\'s second law every 2 ms; the total energy stays constant to better than 0.1%.</p>';
    }
    function draw(fast){
      var g = geom();
      drawScene(); drawBars();
      if(!built){ buildGraphs(); built = true; }
      drawGraphs();
      if(!fast) readout();
      else if(s && tMeas){ s.pills([{ k: 'T', html: F(tMeas, 2) + ' s', tone: 'readout' }], 'left', 'explore'); s.pills([{ html: 'measured', tone: 'ghost' }], 'right', 'explore'); }
    }
    var lastCross = 0;
    /* ----- dragging the mass sets the release point (paused) */
    function dragWire(){
      var el = sceneEl.querySelector('.ol-mass'), svg = sceneEl.querySelector('svg');
      if(!el) return;
      el.addEventListener('pointerdown', function(e){
        if(e.button) return;
        e.preventDefault(); loop.stop(); playing = false; playBtn.setAttribute('aria-pressed', 'false'); playBtn.textContent = 'Play'; cue.done();
        function pos(ev){ var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
        function mv(ev){
          var p = pos(ev), g = geom(), v;
          if(sys.type === 'spring'){ v = Math.max(-0.2, Math.min(0.2, Math.round((p.x - 300) / 600 * 100) / 100)); if(Math.abs(v) < 0.02) v = v < 0 ? -0.02 : 0.02; setAmp(Math.abs(v), v < 0 ? -1 : 1); }
          else if(sys.type === 'vspring'){ var L0 = 0.2, x0 = sys.m * sys.g / sys.k, ppm2 = Math.min(600, (g.H - 70) / (L0 + x0 + 0.15 + 0.06)), eqY = 30 + (L0 + x0) * ppm2; v = Math.max(-0.15, Math.min(0.15, Math.round((p.y - eqY - 14) / ppm2 * 100) / 100)); if(Math.abs(v) < 0.02) v = v < 0 ? -0.02 : 0.02; setAmp(Math.abs(v), v < 0 ? -1 : 1); }
          else { var a = M.deg(Math.atan2(p.x - g.W / 2, p.y - 26)); a = Math.max(-60, Math.min(60, Math.round(a))); if(Math.abs(a) < 2) a = a < 0 ? -2 : 2; setAmp(Math.abs(a), a < 0 ? -1 : 1); }
        }
        function up(){ window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); var n = sceneEl.querySelector('.ol-mass'); if(n) n.focus(); say('Released from ' + (sys.type === 'pendulum' ? F(sys.A, 0) + ' degrees' : F(sys.A * 100, 0) + ' centimeters') + '. Press Play.', true); }
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      });
      el.addEventListener('keydown', function(e){
        var step = sys.type === 'pendulum' ? 1 : 0.01, d = { ArrowLeft: -step, ArrowDown: sys.type === 'vspring' ? step : -step, ArrowRight: step, ArrowUp: sys.type === 'vspring' ? -step : step }[e.key];
        if(d == null) return;
        e.preventDefault(); loop.stop(); playing = false; playBtn.textContent = 'Play'; playBtn.setAttribute('aria-pressed', 'false');
        var v0 = st.x * (sys.type === 'pendulum' ? 180 / Math.PI : 1), v = v0 + d, lim = sys.type === 'pendulum' ? 60 : sys.type === 'vspring' ? 0.15 : 0.2, lo = sys.type === 'pendulum' ? 2 : 0.02;
        v = Math.max(-lim, Math.min(lim, v)); if(Math.abs(v) < lo) v = d > 0 ? lo : -lo;
        setAmp(Math.abs(v), v < 0 ? -1 : 1);
        var n = sceneEl.querySelector('.ol-mass'); if(n) n.focus();
      });
    }
    function setAmp(a, sign){
      if(!base || base.key !== 'A'){ if(varKey === 'A') base = { key: 'A', value: sys.A, T: period() }; }
      sys.A = sys.type === 'pendulum' ? a : Math.round(a * 100) / 100;
      release(); st.x = sign * Math.abs(st.x); hist = [sample(st)];
      if(varKey === 'A' && varCtl.slider) varCtl.slider.set(sys.A);
      built = false; draw();
    }

    buildVars(); release(); draw();
    if(window.ResizeObserver){ var lastW = 0; new ResizeObserver(function(){ var w = sceneEl.clientWidth; if(Math.abs(w - lastW) > 40){ lastW = w; draw(); } }).observe(sceneEl); }
    return {
      stop: function(){ loop.stop(); playing = false; playBtn.textContent = 'Play'; playBtn.setAttribute('aria-pressed', 'false'); },
      studio: function(pane, studio){
        s = studio;
        var o = { mode: 'explore' };
        s.add('stage', stage, o); s.add('dock', dock, o);
        var w = document.createElement('div'); w.className = 'ls-sec phys-ls-why'; w.appendChild(cue.el); w.appendChild(why); s.add('why', w, o);
        var d = document.createElement('div'); d.className = 'ls-sec'; d.appendChild(det); s.add('details', d, o);
        why.querySelectorAll('details.bt-why').forEach(function(x){ x.open = true; });
        readout();
        if(s.mode() === 'explore') s.hint({ target: playBtn, text: 'Press Play' });
      }
    };
  }

  /* ------------------------------------------------------------ quiz */
  function figure(p){
    var f = p.fig, id = nid('olq'), W = 520, H = 200, out = '', label = '';
    if(f.kind === 'spring'){
      var ppm = 1100, eqX = 300, y = 150, A = f.A, cx = eqX + (f.x != null ? f.x : A) * ppm;
      out += '<rect class="ol-wood" x="20" y="' + y + '" width="' + (W - 30) + '" height="14" rx="3" fill="url(#' + id + 'w)"/><rect class="ol-wall" x="14" y="40" width="22" height="' + (y - 40) + '"/><rect x="14" y="40" width="22" height="' + (y - 40) + '" fill="url(#' + id + 'h)"/>' +
        '<line class="ol-eq" x1="' + eqX + '" x2="' + eqX + '" y1="40" y2="' + (y + 22) + '"/><text class="ol-tm" x="' + eqX + '" y="' + (y + 36) + '" text-anchor="middle">x = 0</text>' +
        [-1, 1].map(function(sg){ return '<line class="ol-amp" x1="' + n1(eqX + sg * A * ppm) + '" x2="' + n1(eqX + sg * A * ppm) + '" y1="52" y2="' + (y + 18) + '"/><text class="ol-tm" x="' + n1(eqX + sg * A * ppm) + '" y="48" text-anchor="middle">' + (sg < 0 ? '−A' : '+A') + '</text>'; }).join('') +
        coil(36, y - 26, cx - 36, y - 26, 11, 22) + cartArt(id, cx, y, 72, 46);
      label = 'A cart on a spring on a level track, with the equilibrium position x = 0 and the turning points plus and minus A marked' + (f.x != null ? '; the cart is shown at x = ' + gv(f.x) + ' m' : '') + '.';
    } else if(f.kind === 'pendulum'){
      H = 230; var px = W / 2, py = 24, L = 170, a = M.rad(f.ang * 2.2), bx = px + L * Math.sin(a), by = py + L * Math.cos(a);
      out += '<rect class="ol-metal" x="' + (px - 110) + '" y="' + (py - 14) + '" width="220" height="10" rx="3" fill="url(#' + id + 'm)"/><line class="ol-eq" x1="' + px + '" x2="' + px + '" y1="' + py + '" y2="' + (py + L + 24) + '"/>' +
        '<line class="ol-string" x1="' + px + '" y1="' + py + '" x2="' + n1(bx) + '" y2="' + n1(by) + '"/><circle cx="' + n1(bx) + '" cy="' + n1(by) + '" r="16" fill="url(#' + id + 'r)" stroke="#6B4E12" stroke-width="1.2"/>' +
        '<path class="ol-arc" d="M' + px + ' ' + (py + 60) + 'A60 60 0 0 0 ' + n1(px + 60 * Math.sin(a)) + ' ' + n1(py + 60 * Math.cos(a)) + '"/><text class="ol-t" x="' + n1(px + 70 * Math.sin(a / 2) + 4) + '" y="' + n1(py + 70 * Math.cos(a / 2)) + '">' + f.ang + '°</text>' +
        '<text class="ol-tm" x="' + n1(px - 12) + '" y="' + n1(py + L * 0.55) + '" text-anchor="end">ℓ</text>';
      label = 'A simple pendulum pulled ' + f.ang + ' degrees to the side (angle drawn larger for clarity).';
    } else {
      H = 250; var GL = 70, GR = 20, GT = 20, GB = 40, PW = W - GL - GR, PH = H - GT - GB, tMax = 2 * f.T, yM = f.A * 1.5;
      function X(t){ return GL + t / tMax * PW; } function Y(v){ return GT + PH / 2 - v / yM * PH / 2; }
      for(var i = 0; i <= 8; i++){ var t = i * f.T / 4; out += '<line class="ol-g-grid" x1="' + n1(X(t)) + '" x2="' + n1(X(t)) + '" y1="' + GT + '" y2="' + (GT + PH) + '"/>' + (i % 2 === 0 ? '<text class="ol-g-tick" font-size="12" x="' + n1(X(t)) + '" y="' + (GT + PH + 16) + '" text-anchor="middle">' + gv(Number(M.fixed(t, 3))) + '</text>' : ''); }
      [-1.5, -1, -0.5, 0, 0.5, 1, 1.5].forEach(function(k){ var yv = k * f.A; out += '<line class="' + (k ? 'ol-g-grid' : 'ol-g-zero') + '" x1="' + GL + '" x2="' + (GL + PW) + '" y1="' + n1(Y(yv)) + '" y2="' + n1(Y(yv)) + '"/>' + (Math.abs(k) === 1 || Math.abs(k) === 0.5 ? '<text class="ol-g-tick" font-size="12" x="' + (GL - 6) + '" y="' + n1(Y(yv) + 4) + '" text-anchor="end">' + M.fmt(yv, 2) + '</text>' : ''); });
      var pts = []; for(var j = 0; j <= 240; j++){ var tt = j / 240 * tMax; pts.push(n1(X(tt)) + ',' + n1(Y(f.A * Math.cos(TAU * tt / f.T + f.phase)))); }
      out = '<rect class="ol-g-bg" x="' + GL + '" y="' + GT + '" width="' + PW + '" height="' + PH + '"/>' + out + '<line class="ol-g-axis" x1="' + GL + '" x2="' + GL + '" y1="' + GT + '" y2="' + (GT + PH) + '"/>' +
        '<polyline class="ol-g-line ol-g-x" points="' + pts.join(' ') + '"/>' +
        '<line class="ol-g-T" x1="' + n1(X(f.mark)) + '" x2="' + n1(X(f.mark)) + '" y1="' + GT + '" y2="' + (GT + PH) + '" stroke-dasharray="5 4"/><text class="ol-g-Tt" font-size="12" x="' + n1(X(f.mark) + 4) + '" y="' + (GT + 12) + '">marked time</text>' +
        '<text class="ol-g-lbl" x="8" y="' + (GT + PH / 2 - 6) + '">x (m)</text><text class="ol-g-lbl" x="' + (GL + PW) + '" y="' + (H - 6) + '" text-anchor="end">t (s)</text>';
      label = 'A graph of position x against time t for two periods of simple harmonic motion, with a grid and a marked time.';
    }
    return '<figure class="cd-fig ol-fig"><svg viewBox="0 0 ' + W + ' ' + H + '" class="phys-scene phys-svg" role="img" aria-label="' + esc(label) + '">' + defs(id) + out + '</svg></figure>';
  }
  function quiz(pane, data){
    T.drill(pane, data, {
      slug: 'oscillator-lab', generate: OL.generate,
      types: [{ value: 'period', label: 'Period and frequency' }, { value: 'change', label: 'What changes the period' }, { value: 'points', label: 'Where speed and acceleration peak' }, { value: 'energy', label: 'Energy at a point' }, { value: 'graph', label: 'Read an x–t graph' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { period: 'Period and frequency', change: 'What changes the period?', points: 'Speed and acceleration', energy: 'Energy in SHM', graph: 'Read the graph' }[p.type]; },
      extra: function(host, p){ host.innerHTML = figure(p); }
    });
  }
})();
