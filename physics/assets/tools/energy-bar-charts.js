/* Energy bar charts (Unit 3; docs/apphys-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Job: watch energy move between stores while YOU choose the system,
   and see that the bars change with the system (inside: a potential energy
   or thermal bar; outside: work across the boundary).

   Explore: four scenes (a skater on a valley, hill or drop track, dragged to
   any start point; a spring launcher onto a ramp; a block sliding down a
   ramp onto a rough floor; a cable lifting a box), run from the model in
   ApPhysMath.energyBarCharts (sim, ledger). Live bars for K, U_g, U_s and
   thermal energy for the stores inside the chosen system, a W column for
   the work done by everything outside it (stacked by agent), a ghost of the
   start bars and the line "start + W = now". Speed, height and (for the
   lift) power read out on the stage.

   Test yourself: ApPhysTools.drill over the model's generate(): pick the
   system and build before/after bar charts by dragging bars (or typing),
   then speed, height, spring compression, work by friction, work by a
   force, power and kinetic energy, each slip named. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath, S = window.ApPhysScene;
  if(!T || !M || !M.energyBarCharts || !S) return;
  var E = M.energyBarCharts, esc = T.esc;
  // This tool's own stylesheet (the generator loads only phys-tools.css).
  (function(){
    var href = (window.ApPhysBase || '../') + 'assets/tools/energy-bar-charts.css';
    if(!document.querySelector('link[href$="tools/energy-bar-charts.css"]')){ var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
  })();
  function J(x){ return Math.abs(x) < 0.05 ? '0 J' : M.fmt(x, 3) + ' J'; }
  function F1(x, d){ return T.F(x, d == null ? 1 : d); }
  function sub(t){ return String(t).replace(/_(\w+)/, '<tspan class="eb-sub" dy="4" font-size="0.72em">$1</tspan>'); }
  function subH(t){ return String(t).replace(/_(\w+)/, '<sub>$1</sub>'); }

  T.mount('energy-bar-charts', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'energy-bar-charts', labels: ['Explore', 'Test yourself'],
      explore: function(pane){ ex = explore(pane, data); },
      quiz: function(pane){ quiz(pane, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ============================================================ explore */
  var STORE = {
    K: { sym: 'K', name: 'kinetic energy', cls: 'eb-k' },
    Ug: { sym: 'U_g', name: 'gravitational potential energy', cls: 'eb-ug', ag: 'earth' },
    Us: { sym: 'U_s', name: 'elastic (spring) energy', cls: 'eb-us', ag: 'spring' },
    Eth: { sym: 'E_th', name: 'thermal energy', cls: 'eb-th', ag: 'surface' }
  };
  var WORK = { grav: { name: 'gravity (Earth)', cls: 'eb-ug' }, spring: { name: 'the spring', cls: 'eb-us' }, fric: { name: 'friction', cls: 'eb-th' }, cable: { name: 'the cable', cls: 'eb-cable' } };
  var SCENE_UI = {
    skater: { label: 'Skater', obj: 'skater', surf: 'track', stores: ['K', 'Ug', 'Eth'] },
    launcher: { label: 'Launcher', obj: 'block', surf: 'floor', stores: ['K', 'Ug', 'Us'] },
    ramp: { label: 'Ramp', obj: 'block', surf: 'floor', stores: ['K', 'Ug', 'Eth'] },
    lift: { label: 'Lift', obj: 'box', surf: null, stores: ['K', 'Ug'] }
  };
  var VW = 640, VH = 330, SIZE = { skater: 330, launcher: 250, ramp: 205, lift: 330 };

  function explore(pane, data){
    var LS = null, scene = 'skater', track = 'valley', g = 9.8;
    var P = { skater: { m: 50, mu: 0, h0: 4.0, s0: null }, launcher: { m: 1.0, k: 300, x: 0.30 }, ramp: { m: 2.0, h: 1.5, mu: 0.40 }, lift: { m: 40, v: 1.0, H: 6 } };
    var sys = { earth: true, spring: true, surface: true };
    var trace = [], idx = 0, run = null, loopT = 0, playing = false, scaleBy = {};
    var $ = function(sel){ return pane.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); };

    pane.innerHTML = '<section class="bt-problem eb-explore" aria-label="Energy bar charts explorer">' +
      '<div class="eb-ctl"></div>' +
      '<div class="eb-stage"><figure class="eb-fig eb-scene-fig"><div class="eb-scene"></div></figure>' +
      '<figure class="eb-fig eb-bars-fig"><figcaption class="eb-sysname"></figcaption><div class="eb-bars"></div><p class="eb-eq" aria-hidden="true"></p></figure></div>' +
      '<div class="eb-say"></div><div class="eb-nums"></div>' +
      T.moreHtml('<div class="eb-more-ctl"></div><div class="eb-scrub"></div>', 'track, friction, mass, g, time') + '</section>';
    var ctl = $('.eb-ctl'), start = T.cue('Press Play, then switch Earth in and out of the system and watch the bars change.');
    ctl.appendChild(start.el);
    // Scene picker (segmented), system toggles, the scene's main slider, Play.
    var seg = document.createElement('div');
    seg.className = 'eb-seg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Scene');
    seg.innerHTML = Object.keys(SCENE_UI).map(function(k){ return '<button type="button" class="bt-btn eb-segb" data-scene="' + k + '" aria-pressed="false">' + SCENE_UI[k].label + '</button>'; }).join('');
    $('.eb-stage').insertBefore(seg, $('.eb-stage').firstChild);
    var sysRow = document.createElement('div');
    sysRow.className = 'eb-sys'; sysRow.setAttribute('role', 'group'); sysRow.setAttribute('aria-label', 'In the system');
    $('.eb-stage').insertBefore(sysRow, $('.eb-bars-fig'));
    var mainHost = document.createElement('div'); mainHost.className = 'eb-main'; ctl.appendChild(mainHost);
    var btns = document.createElement('div');
    btns.className = 'bt-buttons eb-btns';
    btns.innerHTML = '<button type="button" class="btn-press sm eb-play" aria-pressed="false">Play</button><button type="button" class="bt-btn eb-reset">Reset</button>';
    ctl.appendChild(btns);
    var say = T.announcer(document.createElement('p'));

        var moreCtl = $('.eb-more-ctl'), scrubHost = $('.eb-scrub'), mainSlider = null, scrub = null, extra = {};
    seg.addEventListener('click', function(e){ var b = e.target.closest('[data-scene]'); if(b){ scene = b.getAttribute('data-scene'); build(true); } });
    sysRow.addEventListener('click', function(e){
      var b = e.target.closest('[data-ag]'); if(!b || b.disabled) return;
      var a = b.getAttribute('data-ag'); sys[a] = !sys[a]; start.done(); paintSys(); draw();
      say('System: ' + sysName() + '. ' + sysLine());
    });
    btns.querySelector('.eb-play').addEventListener('click', function(){ playing ? pause() : play(); });
    btns.querySelector('.eb-reset').addEventListener('click', function(){ pause(); idx = 0; draw(); });
    

    /* The left slope of a track: from x = 0 down to the first low point. */
    function leftSlope(Pth){ var i = 1; while(i < Pth.n && Pth.y[i] <= Pth.y[i - 1] + 1e-12) i++; return { i: i - 1, ymin: Pth.y[i - 1], ytop: Pth.y[0] }; }
    function sAtHeight(Pth, lo, h){ var a = 0, b = lo.i; while(b - a > 1){ var m = (a + b) >> 1; if(Pth.y[m] > h) a = m; else b = m; } return Pth.s[a]; }
    function agentsOf(sc){ return sc === 'skater' ? (P.skater.mu > 0 ? ['earth', 'surface'] : ['earth']) : sc === 'launcher' ? ['earth', 'spring'] : sc === 'ramp' ? ['earth', 'surface'] : ['earth']; }
    function agLabel(a){ return a === 'earth' ? 'Earth' : a === 'spring' ? 'Spring' : cap(SCENE_UI[scene].surf); }
    function cap(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
    function sysName(){
      var u = SCENE_UI[scene], parts = ['the ' + u.obj];
      agentsOf(scene).forEach(function(a){ if(sys[a]) parts.push(a === 'earth' ? 'Earth' : 'the ' + (a === 'spring' ? 'spring' : u.surf)); });
      return parts.length === 1 ? 'the ' + u.obj + ' alone' : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
    }
    function paintSys(){
      var ags = agentsOf(scene), u = SCENE_UI[scene];
      sysRow.innerHTML = '<span class="eb-sys-k">In the system:</span><span class="eb-chip is-fixed" aria-label="' + cap(u.obj) + ', always in the system">' + cap(u.obj) + '</span>' +
        ags.map(function(a){ return '<button type="button" class="eb-chip" data-ag="' + a + '" aria-pressed="' + !!sys[a] + '"><span class="eb-tick" aria-hidden="true"></span>' + agLabel(a) + '</button>'; }).join('') +
        (scene === 'lift' ? '<span class="eb-chip is-out" aria-label="The cable is always outside the system">Cable: outside</span>' : '');
    }

    function mainFor(sc){
      var pr = P[sc], rebuild = function(){ start.done(); build(false); };
      if(sc === 'skater'){
        var lo = leftSlope(E.path('skater', { track: track })), a = M.round(lo.ymin + 0.3, 1), b = M.round(lo.ytop - 0.1, 1);
        pr.h0 = Math.max(a, Math.min(b, pr.h0));
        return T.slider({ label: 'Start height', min: a, max: b, step: 0.1, value: M.round(pr.h0, 1), unit: 'm', decimals: 1, onInput: function(v){ pr.h0 = v; pr.s0 = null; rebuild(); } });
      }
      var xmax = M.round(Math.min(0.45, Math.sqrt(2 * pr.m * g * 3.2 / pr.k)) - 0.005, 2);
      pr.x = Math.min(pr.x, xmax);
      return T.slider({ label: 'Spring compression', min: 0.05, max: xmax, step: 0.01, value: pr.x, unit: 'm', decimals: 2, onInput: function(v){ pr.x = v; rebuild(); } });
    }
    /* The scene's main slider (dock) and its extra settings (More options). */
    function controls(){
      mainHost.innerHTML = ''; moreCtl.innerHTML = ''; extra = {};
      var pr = P[scene], rebuild = function(){ start.done(); build(false); };
      if(scene === 'skater'){
        mainSlider = mainFor('skater');
        var tr = T.choiceSelect({ label: 'Track', options: Object.keys(E.TRACKS).map(function(k){ return { value: k, label: E.TRACKS[k].label }; }), value: track, onChange: function(v){ track = v; P.skater.s0 = null; P.skater.h0 = 9; limits(); rebuild(); } });
        moreCtl.appendChild(tr.el);
        extra.mu = T.slider({ label: 'Friction on the track (μ)', min: 0, max: 0.15, step: 0.01, value: pr.mu, decimals: 2, onInput: function(v){ pr.mu = v; if(v > 0) sys.surface = sys.surface !== false; paintSys(); rebuild(); } });
        extra.m = T.slider({ label: 'Skater mass', min: 30, max: 90, step: 5, value: pr.m, unit: 'kg', onInput: function(v){ pr.m = v; rebuild(); } });
      } else if(scene === 'launcher'){
        mainSlider = mainFor('launcher');
        extra.k = T.slider({ label: 'Spring constant k', min: 100, max: 800, step: 50, value: pr.k, unit: 'N/m', onInput: function(v){ pr.k = v; limits(); rebuild(); } });
        extra.m = T.slider({ label: 'Block mass', min: 0.5, max: 3, step: 0.1, value: pr.m, unit: 'kg', decimals: 1, onInput: function(v){ pr.m = v; limits(); rebuild(); } });
      } else if(scene === 'ramp'){
        mainSlider = T.slider({ label: 'Ramp height', min: 0.5, max: 3, step: 0.1, value: pr.h, unit: 'm', decimals: 1, onInput: function(v){ pr.h = v; rebuild(); } });
        extra.mu = T.slider({ label: 'Friction on the floor (μ)', min: 0.3, max: 0.8, step: 0.05, value: pr.mu, decimals: 2, onInput: function(v){ pr.mu = v; rebuild(); } });
        extra.m = T.slider({ label: 'Block mass', min: 0.5, max: 5, step: 0.5, value: pr.m, unit: 'kg', decimals: 1, onInput: function(v){ pr.m = v; rebuild(); } });
      } else {
        mainSlider = T.slider({ label: 'Lifting speed', min: 0.5, max: 2, step: 0.1, value: pr.v, unit: 'm/s', decimals: 1, onInput: function(v){ pr.v = v; rebuild(); } });
        extra.m = T.slider({ label: 'Box mass', min: 10, max: 80, step: 5, value: pr.m, unit: 'kg', onInput: function(v){ pr.m = v; rebuild(); } });
      }
      mainHost.appendChild(mainSlider.el);
      Object.keys(extra).forEach(function(k){ moreCtl.appendChild(extra[k].el); });
      var gs = T.choiceSelect({ label: 'g', options: [{ value: '9.8', label: '9.8 m/s² (equations sheet)' }, { value: '10', label: '10 m/s²' }], value: String(g), onChange: function(v){ g = +v; limits(); rebuild(); } });
      moreCtl.appendChild(gs.el);
    }

    /* Keep the main slider's range honest when a setting changes it: the
       skater starts on the left slope of the track; the launched block never
       goes past the top of its ramp (3.2 m). */
    function limits(){
      if(scene !== 'skater' && scene !== 'launcher') return;
      var old = mainSlider.el;
      mainSlider = mainFor(scene);
      old.replaceWith(mainSlider.el);
    }
    /* Run the model once and keep a trace at 60 frames per second. */
    function compute(){
      var pr = P[scene], o = { g: g, m: pr.m };
      if(scene === 'skater'){ o.track = track; o.mu = pr.mu; var Pth = E.path('skater', o); o.s0 = pr.s0 != null ? pr.s0 : sAtHeight(Pth, leftSlope(Pth), pr.h0); }
      if(scene === 'launcher'){ o.k = pr.k; o.x = pr.x; }
      if(scene === 'ramp'){ o.h = pr.h; o.mu = pr.mu; }
      if(scene === 'lift'){ o.v = pr.v; o.H = pr.H; o.a = 1.5; }
      run = E.sim(scene, o);
      trace = [run.state()];
      var Tmax = scene === 'skater' ? 30 : scene === 'launcher' ? 14 : 12, tail = 0;
      for(var i = 0; i < Tmax * 60; i++){
        trace.push(run.step(1 / 60));
        if(run.settled()){ if(++tail > 30) break; }
      }
      scaleBy = {};
    }
    /* Bar values for the system at frame i: stores inside, work from outside. */
    function barsAt(i){
      var s0 = trace[0], s = trace[i], L = E.ledger(s0, s, sys), have = SCENE_UI[scene].stores;
      var cols = have.filter(function(k){ return k !== 'Us' || scene === 'launcher'; }).filter(function(k){ return k !== 'Eth' || agentsOf(scene).indexOf('surface') > -1; });
      return { L: L, cols: cols };
    }
    function scale(){
      var key = JSON.stringify(sys);
      if(scaleBy[key]) return scaleBy[key];
      var pos = 1e-9, neg = 0;
      for(var i = 0; i < trace.length; i += 2){
        var L = barsAt(i).L;
        ['K', 'Ug', 'Us', 'Eth'].forEach(function(k){ [L.start[k], L.now[k]].forEach(function(v){ if(v != null) pos = Math.max(pos, v); }); });
        var wp = 0, wn = 0; Object.keys(L.work).forEach(function(k){ var w = L.work[k]; if(w > 0) wp += w; else wn -= w; });
        pos = Math.max(pos, wp); neg = Math.max(neg, wn);
      }
      return (scaleBy[key] = { pos: pos, neg: neg });
    }

    /* ------------------------------------------------ drawing the scene */
    var VIEW = {
      skater: { x0: 70, y0: 300, ppm: 50 },
      launcher: { x0: 24, y0: 222, ppm: 54 },
      ramp: { x0: 24, y0: 172, ppm: 40 },
      lift: { x0: 330, y0: 284, ppm: 34 }
    };
    function pt(x, y){ return S.toSvg(x, y, VIEW[scene]); }
    function n(x){ return Math.round(x * 10) / 10; }
    function staticScene(){
      var v = VIEW[scene], out = '', gy = v.y0;
      out += '<rect class="eb-sky" x="0" y="0" width="' + VW + '" height="' + SIZE[scene] + '"/>';
      if(scene === 'lift') return out + liftStatic();
      var Pth = run.path, pts = [];
      for(var i = 0; i <= Pth.n; i += 8){ var q = pt(Pth.x[i], Pth.y[i]); pts.push(n(q.x) + ',' + n(q.y)); }
      var first = pt(Pth.x[0], 0), last = pt(Pth.x[Pth.n], 0);
      out += '<rect class="eb-ground" x="0" y="' + gy + '" width="' + VW + '" height="' + (SIZE[scene] - gy) + '"/><line class="eb-ground-l" x1="0" x2="' + VW + '" y1="' + gy + '" y2="' + gy + '"/>';
      // A height ruler at the left edge, in meters.
      var top = scene === 'skater' ? 5 : scene === 'launcher' ? 3 : Math.ceil(P.ramp.h);
      for(var hh = 0; hh <= top; hh++){ var r = pt(0, hh); out += '<line class="eb-rule" x1="6" x2="14" y1="' + n(r.y) + '" y2="' + n(r.y) + '"/><text class="eb-rule-t" x="17" y="' + n(r.y + 4) + '">' + hh + (hh === top ? ' m' : '') + '</text>'; }
      if(scene === 'skater'){
        // Posts under the rail, then the rail itself.
        for(var xx = 0.5; xx < 10; xx += 1){ var j = Math.round(xx / 10 * Pth.n), a = pt(Pth.x[j], Pth.y[j]); out += '<line class="eb-post" x1="' + n(a.x) + '" x2="' + n(a.x) + '" y1="' + n(a.y + 4) + '" y2="' + gy + '"/>'; }
        out += '<polyline class="eb-rail-under" points="' + pts.join(' ') + '"/><polyline class="eb-rail' + (P.skater.mu > 0 ? ' is-rough' : '') + '" points="' + pts.join(' ') + '"/>';
      } else if(scene === 'launcher'){
        var top2 = pt(Pth.x[Pth.n], Pth.y[Pth.n]);
        out += '<polygon class="eb-ramp" points="' + pts.join(' ') + ' ' + n(top2.x) + ',' + gy + ' ' + n(first.x) + ',' + gy + '"/><polyline class="eb-surface" points="' + pts.join(' ') + '"/>';
        var w0 = pt(0, 0.9), w1 = pt(-0.3, 0);
        out += '<rect class="eb-wall" x="' + n(w1.x) + '" y="' + n(w0.y) + '" width="' + n(w0.x - w1.x) + '" height="' + n(gy - w0.y) + '"/>';
      } else {
        var xb = P.ramp.h / Math.tan(35 * Math.PI / 180), fx = pt(Pth.floorX, 0), endp = pt(Pth.x[Pth.n], 0);
        out += '<polygon class="eb-ramp" points="' + pts.join(' ') + ' ' + n(first.x) + ',' + gy + '"/><polyline class="eb-surface" points="' + pts.join(' ') + '"/>';
        out += '<rect class="eb-rough" x="' + n(fx.x) + '" y="' + (gy - 3) + '" width="' + n(endp.x - fx.x) + '" height="7"/>' +
          '<text class="eb-note" x="' + n((fx.x + endp.x) / 2) + '" y="' + (gy + 22) + '" text-anchor="middle">rough floor, μ = ' + F1(P.ramp.mu, 2) + '</text>' +
          '<text class="eb-note" x="' + n(pt(xb / 2, 0).x) + '" y="' + (gy + 22) + '" text-anchor="middle">frictionless ramp</text>';
      }
      return out;
    }
    function liftStatic(){
      var v = VIEW.lift, gy = v.y0, topY = pt(0, P.lift.H + 1.3).y, cx = v.x0;
      var out = '<rect class="eb-ground" x="0" y="' + gy + '" width="' + VW + '" height="' + (SIZE[scene] - gy) + '"/><line class="eb-ground-l" x1="0" x2="' + VW + '" y1="' + gy + '" y2="' + gy + '"/>';
      for(var hh = 0; hh <= P.lift.H; hh++){ var r = pt(0, hh); out += '<line class="eb-rule" x1="' + (cx - 120) + '" x2="' + (cx - 112) + '" y1="' + n(r.y) + '" y2="' + n(r.y) + '"/><text class="eb-rule-t" x="' + (cx - 108) + '" y="' + n(r.y + 4) + '">' + hh + (hh === P.lift.H ? ' m' : '') + '</text>'; }
      // A frame with a motor and pulley at the top.
      out += '<rect class="eb-frame" x="' + (cx + 60) + '" y="' + n(topY) + '" width="10" height="' + n(gy - topY) + '"/>' +
        '<rect class="eb-frame" x="' + (cx - 30) + '" y="' + n(topY) + '" width="100" height="10"/>' +
        '<rect class="eb-motor" x="' + (cx + 74) + '" y="' + n(topY - 4) + '" width="44" height="28" rx="5"/><text class="eb-note" x="' + (cx + 96) + '" y="' + n(topY + 14) + '" text-anchor="middle">motor</text>' +
        '<circle class="eb-pulley" cx="' + cx + '" cy="' + n(topY + 14) + '" r="13"/><circle class="eb-hub" cx="' + cx + '" cy="' + n(topY + 14) + '" r="3"/>';
      return out;
    }
    function skaterFigure(q, th){
      var d = -th * 180 / Math.PI;
      return '<g class="eb-skater" transform="translate(' + n(q.x) + ' ' + n(q.y) + ') rotate(' + n(d) + ') scale(1.3)">' +
        '<rect class="eb-board" x="-17" y="-8" width="34" height="5" rx="2.5"/><circle class="eb-wheel" cx="-10" cy="-2.5" r="3"/><circle class="eb-wheel" cx="10" cy="-2.5" r="3"/>' +
        '<path class="eb-limb" d="M-6 -9 L-4 -19 L-1 -27 M6 -9 L4 -19 L1 -27"/><path class="eb-torso" d="M0 -27 L1 -42"/>' +
        '<path class="eb-limb thin" d="M1 -39 L-11 -33 M1 -39 L13 -35"/><circle class="eb-head" cx="1.5" cy="-49" r="6.5"/><path class="eb-helmet" d="M-5 -50 A6.8 6.8 0 0 1 8 -50 Z"/></g>';
    }
    function blockFigure(q, th, w, h, label){
      var d = -th * 180 / Math.PI;
      return '<g class="eb-block" transform="translate(' + n(q.x) + ' ' + n(q.y) + ') rotate(' + n(d) + ')"><rect x="' + n(-w / 2) + '" y="' + n(-h) + '" width="' + n(w) + '" height="' + n(h) + '" rx="3"/>' +
        (label ? '<text x="0" y="' + n(-h / 2 + 4) + '" text-anchor="middle">' + label + '</text>' : '') + '</g>';
    }
    function springPath(x0, x1, y, coils, amp){
      var L = x1 - x0, d = 'M' + n(x0) + ' ' + n(y) + ' L' + n(x0 + L * 0.06) + ' ' + n(y);
      for(var i = 0; i < coils; i++){
        var a = x0 + L * (0.06 + 0.88 * (i + 0.25) / coils), b = x0 + L * (0.06 + 0.88 * (i + 0.75) / coils);
        d += ' L' + n(a) + ' ' + n(y - amp) + ' L' + n(b) + ' ' + n(y + amp);
      }
      return d + ' L' + n(x0 + L * 0.94) + ' ' + n(y) + ' L' + n(x1) + ' ' + n(y);
    }
    function dynamicScene(st){
      var out = '', v = VIEW[scene], gy = v.y0, q, label = '';
      if(scene === 'lift'){
        var cx = v.x0, topY = pt(0, P.lift.H + 1.3).y, by = pt(0, st.y).y, bw = 1.5 * v.ppm, bh = 1.1 * v.ppm;
        out += '<line class="eb-cable" x1="' + (cx + 13) + '" y1="' + n(topY + 14) + '" x2="' + (cx + 70) + '" y2="' + n(topY + 6) + '"/><line class="eb-cable" x1="' + (cx - 13) + '" y1="' + n(topY + 14) + '" x2="' + (cx - 13) + '" y2="' + n(by - bh) + '"/>';
        out += '<g class="eb-block eb-box"><rect x="' + n(cx - 13 - bw / 2) + '" y="' + n(by - bh) + '" width="' + n(bw) + '" height="' + n(bh) + '" rx="3"/><path class="eb-tape" d="M' + n(cx - 13 - bw / 2) + ' ' + n(by - bh / 2) + 'h' + n(bw) + '"/></g>';
        // Tension and weight to scale (2 px per 10 N).
        // Forces from the box's center, to scale (0.1 px per N).
        var k = 0.075, wN = st.m * st.g, c0 = cx - 13, cy0 = by - bh / 2;
        out += S.arrow(c0 + 8, cy0, 0, -st.tension * k, { cls: 'f-tension', label: 'F_T' }) + S.arrow(c0 - 8, cy0, 0, wN * k, { cls: 'f-grav', label: 'F_g' }) + '<circle class="eb-cm" cx="' + n(c0) + '" cy="' + n(cy0) + '" r="2.5"/>';
        out += heightMark(cx - 13 - bw / 2 - 14, by, gy, st.y);
        return out;
      }
      var Pth = run.path, p = E.at(Pth, st.s);
      q = pt(p.x, p.y);
      if(scene === 'skater') out += skaterFigure(q, p.th);
      else {
        var w = (scene === 'ramp' ? 0.5 : 0.55) * v.ppm, h = 0.4 * v.ppm;
        if(scene === 'launcher'){
          var sx = pt(0, 0).x, ex = pt(Math.min(st.s, E.LAUNCH.L0), 0).x, sy = pt(0, 0.2).y;
          out += '<path class="eb-spring' + (st.comp > 0 ? ' is-squeezed' : '') + '" d="' + springPath(sx, ex, sy, 9, 9) + '"/>';
          var bq = E.at(Pth, st.s + 0.275);
          out += blockFigure(pt(bq.x, bq.y), bq.th, w, h, '');
          q = pt(bq.x, bq.y);
        } else out += blockFigure(q, p.th, w, h, '');
      }
      // Velocity arrow along the track (8 px per m/s), from the object.
      var up = scene === 'skater' ? 40 : 12, c = { x: q.x - Math.sin(p.th) * up, y: q.y - Math.cos(p.th) * up };
      if(st.speed > 0.05) out += S.arrow(c.x, c.y, Math.cos(p.th) * st.v * 9, -Math.sin(p.th) * st.v * 9, { cls: 'vel', label: 'v' });
      out += heightMark(q.x, q.y, gy, st.y);
      return out;
    }
    function heightMark(x, y, gy, h){
      if(h < 0.3) return '';
      return '<g class="eb-hmark"><line x1="' + n(x) + '" x2="' + n(x) + '" y1="' + n(y) + '" y2="' + gy + '"/><text x="' + n(x + 6) + '" y="' + n((y + gy) / 2 + 4) + '">h = ' + F1(h, 2) + ' m</text></g>';
    }

    /* ------------------------------------------------ drawing the bars */
    var BW = 480, BH = 190, PAD = { l: 30, r: 10, t: 24, b: 40 };
    function narrow(){ try{ return window.matchMedia('(max-width: 760px)').matches; }catch(e){ return false; } }
    function drawBars(i){
      // Match the chart's shape to its box, so text keeps one size.
      var box = $('.eb-bars'), r = box && box.getBoundingClientRect();
      BH = 200; BW = r && r.width > 20 && r.height > 20 ? Math.max(240, Math.min(620, BH * r.width / r.height)) : 480;
      var b = barsAt(i), L = b.L, sc = scale(), cols = b.cols.concat(['W']);
      var H = BH - PAD.t - PAD.b, tot = sc.pos + sc.neg, zy = PAD.t + H * (sc.pos / tot), ppj = H / tot;
      var cw = (BW - PAD.l - PAD.r) / cols.length, out = '';
      out += '<line class="eb-zero" x1="' + PAD.l + '" x2="' + (BW - PAD.r) + '" y1="' + n(zy) + '" y2="' + n(zy) + '"/>';
      cols.forEach(function(k, ci){
        var x = PAD.l + ci * cw, bx = x + cw * 0.18, bw = cw * 0.64, cxm = x + cw / 2;
        if(k === 'W'){
          out += '<line class="eb-div" x1="' + n(x) + '" x2="' + n(x) + '" y1="' + (PAD.t - 8) + '" y2="' + (BH - PAD.b + 30) + '"/>';
          var up = zy, dn = zy;
          Object.keys(L.work).forEach(function(a){
            var w = L.work[a]; if(Math.abs(w) < 1e-6) return;
            var hpx = Math.abs(w) * ppj;
            if(w > 0){ up -= hpx; out += '<rect class="eb-bar ' + WORK[a].cls + '" x="' + n(bx) + '" y="' + n(up) + '" width="' + n(bw) + '" height="' + n(hpx) + '"/>'; }
            else { out += '<rect class="eb-bar eb-neg ' + WORK[a].cls + '" x="' + n(bx) + '" y="' + n(dn) + '" width="' + n(bw) + '" height="' + n(hpx) + '"/>'; dn += hpx; }
          });
          out += '<text class="eb-val" x="' + n(cxm) + '" y="' + n(L.W >= 0 ? up - 6 : dn + 14) + '" text-anchor="middle">' + (Math.abs(L.W) < 0.05 ? '0' : M.fmt(L.W, 3)) + '</text>';
          out += '<text class="eb-lab" x="' + n(cxm) + '" y="' + (BH - PAD.b + 18) + '" text-anchor="middle">W</text><text class="eb-lab2" x="' + n(cxm) + '" y="' + (BH - PAD.b + 32) + '" text-anchor="middle">work in</text>';
          return;
        }
        var st = STORE[k], inside = !st.ag || sys[st.ag], v = L.now[k], v0 = L.start[k];
        if(inside){
          var h = Math.max(0, v) * ppj, h0 = Math.max(0, v0 || 0) * ppj;
          out += '<rect class="eb-bar ' + st.cls + '" x="' + n(bx) + '" y="' + n(zy - h) + '" width="' + n(bw) + '" height="' + n(h) + '"/>';
          if(h0 > 0.5) out += '<rect class="eb-ghost" x="' + n(bx - 3) + '" y="' + n(zy - h0) + '" width="' + n(bw + 6) + '" height="' + n(h0) + '"/>';
          out += '<text class="eb-val" x="' + n(cxm) + '" y="' + n(zy - Math.max(h, h0) - 6) + '" text-anchor="middle">' + (v < 0.05 ? '0' : M.fmt(v, 3)) + '</text>';
        } else {
          out += '<rect class="eb-out" x="' + n(bx) + '" y="' + n(PAD.t) + '" width="' + n(bw) + '" height="' + n(zy - PAD.t) + '" rx="4"/><text class="eb-out-t" x="' + n(cxm) + '" y="' + n(PAD.t + (zy - PAD.t) / 2) + '" text-anchor="middle">outside</text><text class="eb-out-t" x="' + n(cxm) + '" y="' + n(PAD.t + (zy - PAD.t) / 2 + 14) + '" text-anchor="middle">→ W</text>';
        }
        out += '<text class="eb-lab' + (inside ? '' : ' is-out') + '" x="' + n(cxm) + '" y="' + (BH - PAD.b + 18) + '" text-anchor="middle">' + sub(st.sym) + '</text>';
      });
      out += '<text class="eb-axis" x="4" y="14">Energy (J)</text>';
      var lab = 'Energy bar chart for ' + sysName() + ': ' + b.cols.map(function(k){ var st = STORE[k], inside = !st.ag || sys[st.ag]; return st.name + (inside ? ' ' + J(L.now[k]) : ' outside the system'); }).join(', ') + '; work done on the system so far ' + J(L.W) + '.';
      return S.svg(BW, BH, lab, out);
    }

    function draw(){
      if(!trace.length) return;
      var st = trace[idx], L = barsAt(idx).L;
      var big = narrow(), lh = big ? 34 : 22, rx = scene === 'launcher' ? 96 : VW - 12, an = scene === 'launcher' ? 'start' : 'end';
      var lines = ['v = ' + F1(st.speed, 1) + ' m/s', 'h = ' + F1(st.y, 2) + ' m'].concat(scene === 'lift' ? ['P = ' + M.fmt(st.P, 3) + ' W'] : []);
      var rd = '<g class="eb-read' + (big ? ' is-big' : '') + '" aria-hidden="true">' + lines.map(function(t, k){ return '<text x="' + rx + '" y="' + ((big ? 30 : 24) + k * lh) + '" text-anchor="' + an + '">' + t + '</text>'; }).join('') +
        (big ? '' : '<text class="eb-read-t" x="' + rx + '" y="' + (24 + lines.length * lh) + '" text-anchor="' + an + '">t = ' + F1(st.t, 1) + ' s</text>') + '</g>';
      $('.eb-scene').innerHTML = S.svg(VW, SIZE[scene], sceneLabel(st), '<g class="eb-static">' + staticHtml + '</g>' + dynamicScene(st) + rd);
      $('.eb-bars').innerHTML = drawBars(idx);
      $('.eb-sysname').innerHTML = 'System: <b>' + esc(sysName()) + '</b>';
      $('.eb-eq').innerHTML = '<span>Start ' + J(L.totalStart) + '</span> + <span class="eb-eq-w">W ' + J(L.W) + '</span> = <span>Now ' + J(L.totalNow) + '</span>';
      if(scrub){ scrub.set(idx / 60); }
      var m = meaning(st, L);
      T.explain($('.eb-say'), '<b>' + m.head + '</b> <span class="tx-at">' + m.at + '</span>', m.body);
      numbers(st, L);
      if(LS){
        LS.pills([], 'left', 'explore'); LS.pills([], 'right', 'explore');
        LS.caption('<b>' + m.head + '</b> ' + m.short + (narrow() ? ' <span class="eb-cap-eq">' + J(L.totalStart) + ' + W ' + J(L.W) + ' = ' + J(L.totalNow) + '</span>' : ''), 'explore');
      }
    }
    var staticHtml = '';
    function sceneLabel(st){
      var u = SCENE_UI[scene];
      return cap(u.obj) + ' at height ' + F1(st.y, 2) + ' m moving at ' + F1(st.speed, 2) + ' m/s, t = ' + F1(st.t, 1) + ' s.' + (scene === 'lift' ? ' Cable tension ' + M.fmt(st.tension, 3) + ' N, power ' + M.fmt(st.P, 3) + ' W.' : '') + (scene === 'launcher' && st.comp > 0 ? ' Spring compressed ' + F1(st.comp, 2) + ' m.' : '');
    }
    /* What is happening, in words, for the system chosen. */
    function meaning(st, L){
      var prev = trace[Math.max(0, idx - 3)], dK = st.K - prev.K, u = SCENE_UI[scene];
      var at = 'v = ' + F1(st.speed, 2) + ' m/s, h = ' + F1(st.y, 2) + ' m', head, short;
      // Where the energy is going right now, for this system: stores that
      // grow or shrink inside it, and work by agents outside it.
      var Lp = E.ledger(trace[0], prev, sys), gain = [], lose = [], eps = 1e-6 * Math.max(1, L.totalStart + Math.abs(L.W));
      var NM = { K: 'K', Ug: 'U<sub>g</sub>', Us: 'U<sub>s</sub>', Eth: 'thermal energy' };
      ['K', 'Ug', 'Us', 'Eth'].forEach(function(k){ if(L.now[k] == null) return; var d = L.now[k] - Lp.now[k]; if(d > eps) gain.push(NM[k]); else if(d < -eps) lose.push(NM[k]); });
      Object.keys(L.work).forEach(function(a){ var d = L.work[a] - Lp.work[a]; if(d > eps) lose.push('work by ' + WORK[a].name); else if(d < -eps) gain.push('negative work by ' + WORK[a].name); });
      var list = function(x){ return x.length < 2 ? x.join('') : x.slice(0, -1).join(', ') + ' and ' + x[x.length - 1]; };
      var flow = lose.length && gain.length ? cap(list(lose)) + ' → ' + list(gain) + '.' : '';
      if(idx === 0){ head = 'At the start.'; short = 'Press Play.'; }
      else if(st.rest && run.settled() && idx >= trace.length - 31){ head = 'Stopped.'; short = scene === 'ramp' ? 'Friction turned all the energy into thermal energy.' : scene === 'lift' ? 'The cable did work mgh: it is all U<sub>g</sub> now.' : 'At rest.'; }
      else if(dK > 1e-6){ head = 'Speeding up.'; short = flow; }
      else if(dK < -1e-6){ head = 'Slowing down.'; short = flow; }
      else if(st.speed < 0.02 && !run.settled()){ head = 'Turning point.'; short = 'For an instant v = 0 and K = 0.'; }
      else { head = scene === 'lift' ? 'Steady speed.' : 'Steady.'; short = flow || 'No energy is changing form.'; }
      var body = '<p>' + systemLine(L) + '</p><p>' + bookLine(L) + '</p>' + (scene === 'lift' ? '<p><b>Power</b> is the rate of energy transfer: P = F<sub>T</sub>v = ' + M.fmt(st.tension, 3) + ' N × ' + F1(st.v, 2) + ' m/s = ' + M.fmt(st.P, 3) + ' W now. While the box speeds up the tension is more than mg, so the power is larger; at steady speed P = mgv.</p>' : '');
      return { head: head, short: short, at: at, body: body };
    }
    function sysLine(){ return systemLine(barsAt(idx).L).replace(/<[^>]+>/g, ''); }
    function systemLine(L){
      var u = SCENE_UI[scene], ags = agentsOf(scene), ins = ags.filter(function(a){ return sys[a]; }), outs = ags.filter(function(a){ return !sys[a]; });
      var nm = function(a){ return a === 'earth' ? 'Earth' : a === 'spring' ? 'the spring' : 'the ' + u.surf; };
      var s = 'The system is ' + esc(sysName()) + '. ';
      if(ins.length) s += ins.map(function(a){ return cap(nm(a)) + ' is inside, so ' + (a === 'earth' ? 'gravity is internal and shows as the U<sub>g</sub> bar' : a === 'spring' ? 'the spring\'s push is internal and shows as the U<sub>s</sub> bar' : 'friction is internal and its effect is the thermal energy bar'); }).join('; ') + '. ';
      if(outs.length || scene === 'lift') s += outs.map(function(a){ return cap(nm(a)) + ' is outside, so ' + (a === 'earth' ? 'there is no U<sub>g</sub> bar: gravity does work on the system instead' : a === 'spring' ? 'there is no U<sub>s</sub> bar: the spring does work on the block instead' : 'there is no thermal bar: friction does negative work on the ' + u.obj); }).concat(scene === 'lift' ? ['the cable is outside and does positive work, bringing energy in'] : []).join('; ') + '.';
      return s;
    }
    function bookLine(L){
      var parts = Object.keys(L.work).filter(function(a){ return Math.abs(L.work[a]) >= 0.05; }).map(function(a){ return 'work by ' + WORK[a].name + ' ' + J(L.work[a]); });
      return 'Bookkeeping: start total ' + J(L.totalStart) + ' + W ' + J(L.W) + ' = now ' + J(L.totalNow) + '.' + (parts.length ? ' W is ' + parts.join(', ') + '.' : ' No work crosses the boundary, so the total inside stays the same.');
    }
    function numbers(st, L){
      var el = $('.eb-nums'); if(!el) return;
      var pr = P[scene], row = function(k, v){ return '<tr><th scope="row">' + k + '</th><td class="r">' + v + '</td></tr>'; };
      var rows = row('Mass', M.fmt(st.m, 3) + ' kg') + row('g', F1(g, 1) + ' m/s²');
      if(scene === 'launcher') rows += row('Spring', 'k = ' + pr.k + ' N/m, compressed ' + F1(pr.x, 2) + ' m: U<sub>s</sub> = ½kx² = ' + J(0.5 * pr.k * pr.x * pr.x));
      if(scene === 'ramp') rows += row('Ramp', 'h = ' + F1(pr.h, 1) + ' m, floor μ = ' + F1(pr.mu, 2));
      if(scene === 'skater') rows += row('Track', E.TRACKS[track].label + (pr.mu > 0 ? ', μ = ' + F1(pr.mu, 2) : ', frictionless'));
      if(scene === 'lift') rows += row('Lift', 'to ' + pr.H + ' m at ' + F1(pr.v, 1) + ' m/s (speeds up and slows at 1.5 m/s²)') + row('Tension now', M.fmt(st.tension, 3) + ' N') + row('Power now', 'P = F<sub>T</sub>v = ' + M.fmt(st.P, 3) + ' W') + (st.t > 0 ? row('Average power so far', 'W/Δt = ' + M.fmt(st.Wc / st.t, 3) + ' W') : '');
      if(scene === 'ramp' && st.y < 0.01 && st.speed > 0) rows += row('Friction power now', 'f v = ' + M.fmt(pr.mu * st.m * g * st.speed, 3) + ' W (rate of energy into thermal)');
      rows += row('Speed', F1(st.speed, 2) + ' m/s') + row('Height', F1(st.y, 2) + ' m') + row('K = ½mv²', J(st.K)) + row('U<sub>g</sub> = mgh (with Earth)', J(st.Ug));
      if(scene === 'launcher') rows += row('U<sub>s</sub> = ½kx² (with the spring)', J(st.Us));
      if(agentsOf(scene).indexOf('surface') > -1) rows += row('Thermal energy from friction', J(st.Eth));
      Object.keys(L.work).forEach(function(a){ if(Math.abs(L.work[a]) >= 0.05) rows += row('Work by ' + WORK[a].name + ' (outside)', J(L.work[a])); });
      el.innerHTML = '<h3 class="ls-title-l">The numbers</h3><table class="ls-tbl"><caption class="sr-only">The run in numbers</caption><tbody>' + rows + '</tbody></table>';
    }

    /* ------------------------------------------------ playing */
    var loop = S.loop(function(dt){
      loopT += dt;
      var target = Math.round(loopT * 60);
      if(target >= trace.length - 1){ idx = trace.length - 1; draw(); stopUi(); return false; }
      idx = target; draw();
    }, { still: function(){ idx = trace.length - 1; draw(); stopUi(); } });
    function play(){
      if(idx >= trace.length - 1) idx = 0;
      loopT = idx / 60; playing = true; start.done();
      var b = btns.querySelector('.eb-play'); b.textContent = 'Pause'; b.setAttribute('aria-pressed', 'true');
      loop.reset(); loop.start();
      say('Playing.');
    }
    function stopUi(){ playing = false; var b = btns.querySelector('.eb-play'); if(b){ b.textContent = 'Play'; b.setAttribute('aria-pressed', 'false'); } }
    function pause(){ loop.stop(); stopUi(); }

    function build(newScene){
      pause();
      if(newScene){ sys = { earth: true, spring: true, surface: true }; controls(); }
      seg.querySelectorAll('[data-scene]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-scene') === scene)); });
      compute(); idx = 0;
      staticHtml = staticScene();
      paintSys();
      if(!scrub){ scrub = T.slider({ label: 'Time', min: 0, max: 30, step: 1 / 60, value: 0, unit: 's', decimals: 2, onInput: function(v){ pause(); idx = Math.min(trace.length - 1, Math.round(v * 60)); draw(); } }); scrubHost.appendChild(scrub.el); }
      var tmax = (trace.length - 1) / 60; scrub.input.max = String(tmax);
      draw();
          }
    // Drag the skater along the track to choose where it starts.
    pane.addEventListener('pointerdown', function(e){
      var svg = e.target.closest && e.target.closest('.eb-scene svg');
      if(!svg || scene !== 'skater') return;
      pause();
      var move = function(ev){
        var b = svg.getBoundingClientRect(), x = (ev.clientX - b.left) * VW / b.width, y = (ev.clientY - b.top) * SIZE[scene] / b.height, v = VIEW.skater;
        var Pth = run.path, s0 = E.nearest(Pth, (x - v.x0) / v.ppm, (v.y0 - y) / v.ppm);
        P.skater.s0 = s0; start.done(); build(false); P.skater.h0 = trace[0].y; mainSlider.set(Math.max(+mainSlider.input.min, M.round(trace[0].y, 1)));
      };
      move(e);
      var up = function(){ window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
    // The Tool Studio: scene and bars on the stage; scene, system, slider and
    // Play in the dock; the reasoning in Why; numbers and settings in Details.
    function studio(p, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.eb-stage')], dock: [ctl], moreLabel: 'Track, friction, mass, g and time', why: [start.el, $('.eb-say')], details: [$('.eb-nums')] });
      draw();
      if(s.mode() === 'explore') s.hint({ target: btns.querySelector('.eb-play'), text: 'Press Play' });
    }
    build(true);
    return { stop: pause, studio: studio };
  }

  /* ============================================================== quiz */
  var TYPES = [
    { value: 'bars', label: 'Build the bar charts' }, { value: 'speed', label: 'Find a speed' }, { value: 'height', label: 'Find a height' },
    { value: 'spring', label: 'Spring compression' }, { value: 'friction', label: 'Work by friction' }, { value: 'work', label: 'Work by a force' },
    { value: 'power', label: 'Power' }, { value: 'ke', label: 'Kinetic energy and ΔK' }
  ];
  function quiz(pane, data){
    var fig = null, cur = null;
    // A bar chart to build is the stage; its problem text is the caption.
    var opts = {
      slug: 'energy-bar-charts', generate: function(r, c, t){ var p = E.generate(r, c, t); opts.textOnStage = !(p.figure && /bars/.test(p.figure.kind)); return p; }, types: TYPES, typeLabel: 'Kind of problem', newLabel: 'New problem', textOnStage: true,
      title: function(p){ var t = TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Energy problem'; },
      extra: function(host, p){
        cur = p; fig = host;
        if(p.figure && p.figure.kind === 'bars') builder(host, p);
        else if(p.figure) host.innerHTML = '<figure class="cd-fig eb-qfig">' + sceneThumb(p.figure.scene) + '</figure>';
      },
      onStep: function(s, right){ if(s.key === 'system' && fig){ var n = fig.querySelector('.eb-q-sys'); if(n) n.innerHTML = 'System: <b>' + esc(cur.figure.sysName) + '</b>'; } if(fig && fig._redraw) fig._redraw(); }
    };
    T.drill(pane, data, opts);
  }

  /* The bar chart builder: one column per cell; drag a bar, press the arrow
     keys in its box or type a whole number of units. drill() puts the
     inputs into the [data-i] slots of the [data-row="bars"] strip. */
  function builder(host, p){
    var f = p.figure, cells = f.cells, MAX = 8, W = 520, H = 250, L = 34, R = 8, Tp = 18, B = 30;
    var cw = (W - L - R) / cells.length, zy = Tp + (H - Tp - B) / 2, ppu = (H - Tp - B) / (2 * MAX);
    host.innerHTML = '<figure class="eb-build"><div class="eb-build-top"><div class="eb-thumb">' + sceneThumb(f.scene) + '</div><p class="eb-q-sys">' + (f.given ? 'System: <b>' + esc(f.sysName) + '</b>' : 'System: <b>choose it in step 1</b>') + '</p></div>' +
      '<div class="eb-chart"></div><div class="eb-slots" data-row="bars"><span></span>' +
      cells.map(function(c, i){ return '<span class="eb-slot" data-i="' + i + '" data-label="' + esc(c.label) + '"></span>'; }).join('') + '<span></span></div></figure>';
    var chart = host.querySelector('.eb-chart');
    function inputs(){ return cells.map(function(c, i){ var s = host.querySelector('.eb-slot[data-i="' + i + '"] input'); return s || null; }); }
    function val(inp){ if(!inp) return null; var x = window.ApPhysQuestions.parseNumber(inp.value); return isFinite(x) ? x : null; }
    function fit(){
      var r = chart.getBoundingClientRect();
      W = r.width > 20 && r.height > 20 ? Math.max(360, Math.min(980, H * r.width / r.height)) : 520;
      cw = (W - L - R) / cells.length;
      host.querySelector('.eb-slots').style.gridTemplateColumns = (L / W * 100).toFixed(2) + '% repeat(' + cells.length + ',minmax(0,1fr)) ' + (R / W * 100).toFixed(2) + '%';
    }
    function draw(){
      fit();
      var ins = inputs(), out = '';
      for(var u = -MAX; u <= MAX; u++){ var y = zy - u * ppu; out += '<line class="' + (u === 0 ? 'eb-zero' : 'eb-gridl') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>'; if(u % 2 === 0) out += '<text class="eb-tick" x="' + (L - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + M.minus(String(u)) + '</text>'; }
      var groups = { i: 'Before', w: 'Work', f: 'After' }, seen = {};
      cells.forEach(function(c, i){
        var x = L + i * cw, v = val(ins[i]), inp = ins[i], cls = STORE[c.key.replace(/[if]$/, '')] ? STORE[c.key.replace(/[if]$/, '')].cls : c.key === 'W' ? 'eb-w' : 'eb-th';
        if(c.key === 'Ethf') cls = 'eb-th';
        if(!seen[c.grp]){ seen[c.grp] = 1; if(i) out += '<line class="eb-div" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + (Tp - 6) + '" y2="' + (H - 4) + '"/>'; out += '<text class="eb-grp" x="' + (x + 4).toFixed(1) + '" y="' + (Tp - 2) + '">' + groups[c.grp] + '</text>'; }
        if(v != null && v !== 0){ var h = Math.min(MAX, Math.abs(v)) * ppu; out += '<rect class="eb-bar ' + cls + (inp && inp.classList.contains('is-wrong') ? ' is-wrong' : inp && inp.classList.contains('is-right') ? ' is-right' : '') + '" x="' + (x + cw * 0.18).toFixed(1) + '" y="' + (v > 0 ? zy - h : zy).toFixed(1) + '" width="' + (cw * 0.64).toFixed(1) + '" height="' + h.toFixed(1) + '"/>'; }
        out += '<text class="eb-lab" x="' + (x + cw / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + sub(c.sym) + '</text>';
        out += '<rect class="eb-hit" data-c="' + i + '" x="' + x.toFixed(1) + '" y="' + Tp + '" width="' + cw.toFixed(1) + '" height="' + (H - Tp - B) + '"/>';
      });
      var ready = ins.some(Boolean);
      var lab = 'Bar chart to build, in units of ' + M.fmt(f.unit || 1, 3) + ' J. ' + cells.map(function(c, i){ var v = val(ins[i]); return c.label + ' ' + (v == null ? 'empty' : M.minus(String(v))); }).join(', ') + '.' + (ready ? '' : ' The bars open in the next step.');
      chart.innerHTML = S.svg(W, H, lab, out);
      chart.classList.toggle('is-live', ready && ins.some(function(x){ return x && !x.readOnly; }));
    }
    host._redraw = draw;
    function setFrom(ev, svg, i){
      var inp = inputs()[i]; if(!inp || inp.readOnly) return;
      var b = svg.getBoundingClientRect(), y = (ev.clientY - b.top) * H / b.height, v = Math.round((zy - y) / ppu);
      v = Math.max(-MAX, Math.min(MAX, v));
      inp.value = String(v); inp.dispatchEvent(new Event('input', { bubbles: true })); draw();
    }
    host.addEventListener('pointerdown', function(e){
      var hit = e.target.closest && e.target.closest('.eb-hit'); if(!hit) return;
      var svg = hit.ownerSVGElement, i = +hit.getAttribute('data-c');
      e.preventDefault(); setFrom(e, svg, i);
      var mv = function(ev){ setFrom(ev, svg, i); }, up = function(){ window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); var inp = inputs()[i]; if(inp && !inp.readOnly) inp.focus({ preventScroll: true }); };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    });
    host.addEventListener('input', draw);
    host.addEventListener('keydown', function(e){
      var inp = e.target; if(!inp.classList || !inp.classList.contains('cd-cell') || inp.readOnly) return;
      if(e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      var v = val(inp) || 0; v = Math.max(-MAX, Math.min(MAX, Math.round(v) + (e.key === 'ArrowUp' ? 1 : -1)));
      inp.value = String(v); draw();
    });
    // drill() adds the inputs and marks them right or wrong: redraw then.
    // Watch only the input slots (drill() adds inputs and marks them right or
    // wrong there), not the chart, which draw() itself rewrites.
    if(window.MutationObserver) new MutationObserver(function(){ draw(); }).observe(host.querySelector('.eb-slots'), { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'readonly'] });
    draw();
  }

  /* Small scene pictures for the drill problems (to the numbers given). */
  function sceneThumb(sc){
    if(!sc) return '';
    var w = 300, h = 170, out = '<rect class="eb-sky" width="' + w + '" height="' + h + '"/><rect class="eb-ground" y="148" width="' + w + '" height="22"/><line class="eb-ground-l" x1="0" x2="' + w + '" y1="148" y2="148"/>', lab = '';
    var gy = 148, blk = function(x, y, ang, s){ return '<g class="eb-block" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (-ang).toFixed(1) + ')"><rect x="' + (-s / 2) + '" y="' + (-s * 0.75) + '" width="' + s + '" height="' + (s * 0.75) + '" rx="2"/></g>'; };
    if(sc.scene === 'ramp' || sc.scene === 'incline'){
      var ang = sc.scene === 'incline' ? sc.ang : 35, run = 150, rise = Math.tan(ang * Math.PI / 180) * run, x0 = 30;
      if(rise > 110){ rise = 110; run = rise / Math.tan(ang * Math.PI / 180); }
      if(sc.scene === 'ramp'){
        out += '<polygon class="eb-ramp" points="' + x0 + ',' + (gy - rise).toFixed(1) + ' ' + (x0 + run).toFixed(1) + ',' + gy + ' ' + x0 + ',' + gy + '"/><line class="eb-surface' + (sc.rough === 'ramp' ? ' is-rough' : '') + '" x1="' + x0 + '" y1="' + (gy - rise).toFixed(1) + '" x2="' + (x0 + run).toFixed(1) + '" y2="' + gy + '"/>';
        if(sc.rough === 'floor') out += '<rect class="eb-rough" x="' + (x0 + run + 10).toFixed(1) + '" y="' + (gy - 3) + '" width="' + (w - x0 - run - 20).toFixed(1) + '" height="6"/>';
        out += blk(x0 + 14 * Math.cos(ang * Math.PI / 180), gy - rise + 14 * Math.sin(ang * Math.PI / 180), ang, 22) + '<g class="eb-hmark"><line x1="' + (x0 - 10) + '" x2="' + (x0 - 10) + '" y1="' + (gy - rise).toFixed(1) + '" y2="' + gy + '"/><text x="' + (x0 - 6) + '" y="' + (gy - rise - 6).toFixed(1) + '">h = ' + F1(sc.h, 2) + ' m</text></g>';
        lab = 'A block at the top of a ramp ' + F1(sc.h, 2) + ' m high' + (sc.rough === 'floor' ? ', with a rough floor after it.' : sc.rough === 'ramp' ? ', the ramp rough.' : '.');
      } else {
        out += '<polygon class="eb-ramp" points="' + (w - 30) + ',' + (gy - rise).toFixed(1) + ' ' + (w - 30 - run).toFixed(1) + ',' + gy + ' ' + (w - 30) + ',' + gy + '"/><line class="eb-surface" x1="' + (w - 30) + '" y1="' + (gy - rise).toFixed(1) + '" x2="' + (w - 30 - run).toFixed(1) + '" y2="' + gy + '"/>';
        out += blk(w - 30 - run - 30, gy, 0, 22) + S.arrow(w - 30 - run - 18, gy - 26, 30, 0, { cls: 'vel', label: 'v' }) + '<text class="eb-note" x="' + (w - 30 - run + 30).toFixed(1) + '" y="' + (gy - 6) + '">' + sc.ang + '°</text>';
        lab = 'A block sliding toward a ramp inclined at ' + sc.ang + ' degrees.';
      }
    } else if(sc.scene === 'launcher'){
      out += '<rect class="eb-wall" x="0" y="' + (gy - 60) + '" width="16" height="60"/><path class="eb-spring is-squeezed" d="M16 ' + (gy - 14) + ' l8 0 l6 -9 l8 18 l8 -18 l8 18 l8 -18 l8 18 l6 -9 l8 0"/>' + blk(110, gy, 0, 34);
      if(sc.up) out += '<polygon class="eb-ramp" points="' + (w - 10) + ',' + (gy - 70) + ' ' + (w - 130) + ',' + gy + ' ' + (w - 10) + ',' + gy + '"/><line class="eb-surface" x1="' + (w - 10) + '" y1="' + (gy - 70) + '" x2="' + (w - 130) + '" y2="' + gy + '"/>';
      out += '<text class="eb-note" x="40" y="' + (gy - 30) + '">k = ' + sc.k + ' N/m</text>';
      lab = 'A block against a spring with k = ' + sc.k + ' N/m' + (sc.up ? ', a ramp ahead.' : '.');
    } else if(sc.scene === 'lift'){
      out += '<rect class="eb-frame" x="200" y="12" width="8" height="136"/><rect class="eb-frame" x="120" y="12" width="88" height="8"/><circle class="eb-pulley" cx="130" cy="24" r="10"/><line class="eb-cable" x1="120" y1="24" x2="120" y2="78"/>' +
        '<g class="eb-block eb-box"><rect x="100" y="78" width="40" height="32" rx="2"/></g><g class="eb-hmark"><line x1="90" x2="90" y1="110" y2="148"/><text x="30" y="134">h = ' + F1(sc.h, 2) + ' m</text></g>';
      lab = 'A cable lifting a box ' + F1(sc.h, 2) + ' m.';
    } else if(sc.scene === 'skater'){
      var top = Math.max(sc.h1 || 6, 6), py = function(m){ return gy - m / top * 120; };
      var d = 'M10 ' + py(sc.h1).toFixed(1) + ' C 90 ' + py(sc.h1).toFixed(1) + ', 110 ' + py(0.4).toFixed(1) + ', 170 ' + py(0.4).toFixed(1) + ' S 250 ' + py(sc.h2).toFixed(1) + ', 290 ' + py(sc.h2).toFixed(1);
      out += '<path class="eb-rail-under" d="' + d + '"/><path class="eb-rail' + (sc.rough ? ' is-rough' : '') + '" d="' + d + '"/>' +
        '<circle class="eb-dot" cx="18" cy="' + py(sc.h1).toFixed(1) + '" r="6"/><circle class="eb-dot" cx="282" cy="' + py(sc.h2).toFixed(1) + '" r="6"/>' +
        '<text class="eb-note" x="26" y="' + (py(sc.h1) - 10).toFixed(1) + '">' + F1(sc.h1, 1) + ' m</text><text class="eb-note" x="282" y="' + (py(sc.h2) - 12).toFixed(1) + '" text-anchor="end">' + F1(sc.h2, 1) + ' m</text>';
      lab = 'A skater track from ' + F1(sc.h1, 1) + ' m down to ' + F1(sc.h2, 1) + ' m above the ground.';
    } else if(sc.scene === 'floor'){
      out += '<rect class="eb-rough" x="80" y="' + (gy - 3) + '" width="210" height="6"/>' + blk(60, gy, 0, 30) + S.arrow(76, gy - 30, 34, 0, { cls: 'vel', label: 'v' }) + '<text class="eb-note" x="185" y="' + (gy + 18) + '" text-anchor="middle">μ = ' + F1(sc.mu, 2) + '</text>';
      lab = 'A block sliding onto a rough floor with friction coefficient ' + F1(sc.mu, 2) + '.';
    } else if(sc.scene === 'pull'){
      var a = sc.ang * Math.PI / 180;
      out += blk(120, gy, 0, 46) + S.arrow(143, gy - 18, 100 * Math.cos(a), -100 * Math.sin(a), { cls: 'f-tension', label: 'F' }) + (sc.ang ? '<path class="eb-angle" d="M183 ' + (gy - 18) + ' A40 40 0 0 0 ' + (143 + 40 * Math.cos(a)).toFixed(1) + ' ' + (gy - 18 - 40 * Math.sin(a)).toFixed(1) + '"/><text class="eb-note" x="190" y="' + (gy - 24) + '">' + sc.ang + '°</text>' : '');
      lab = 'A crate pulled by a rope at ' + sc.ang + ' degrees above the horizontal.';
    } else if(sc.scene === 'car'){
      out += '<g class="eb-car"><rect x="70" y="' + (gy - 34) + '" width="120" height="22" rx="8"/><path d="M95 ' + (gy - 34) + ' l14 -18 h46 l16 18 z"/><circle class="eb-wheel" cx="98" cy="' + (gy - 10) + '" r="10"/><circle class="eb-wheel" cx="162" cy="' + (gy - 10) + '" r="10"/></g>' + S.arrow(200, gy - 26, 60, 0, { cls: 'vel', label: 'v' });
      lab = 'A car speeding up from ' + F1(sc.v1, 1) + ' to ' + F1(sc.v2, 1) + ' m/s.';
    }
    return S.svg(w, h, lab || 'The situation in the problem, drawn to its numbers', out);
  }
})();
