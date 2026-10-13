/* Torque balance (Unit 5 trainer; docs/apphys-spec.md section 6). OWNED BY
   THIS TOOL ONLY. Model: ApPhysMath.torqueBalance (tools/math/torque-balance.js).

   Explore, scene "Balance": a meter stick on a knife-edge fulcrum. Drag the
   brass masses along the stick (arrow keys move them 1 cm, Delete removes),
   drag the fulcrum, add a pull at an angle (its line of action and lever arm
   drawn). Live bars: counterclockwise against clockwise torque about the
   fulcrum with the stick level. Release: the stick tips with α = τ/I
   (integrated, the lever arms shrinking as cos θ) until it rests on a stop,
   or stays level when the torques balance.
   Scene "Inertia race": two wheels of the same mass, sliders at chosen
   radii; a weight on a string unwinds each hub; the one with the smaller
   rotational inertia lands first. Energy bars show the weight's K against
   the wheel's K_rot.

   Test yourself: ApPhysTools.drill over the model's five problem kinds,
   each with its own drawing. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath, S = window.ApPhysScene;
  if(!T || !M || !M.torqueBalance || !S) return;
  var TB = M.torqueBalance, esc = T.esc, F = T.F, G = M.C.g;
  var uid = 0;
  function nid(p){ return (p || 'tb') + (++uid); }
  function n1(x){ return Math.round(x * 10) / 10; }
  function nm(x){ return F(x, Math.abs(x) < 0.995 ? 3 : 2); }
  function gv(x){ return M.fmt(x, Number(Number(x).toPrecision(2)) === x ? 2 : 3); }   // a given value, as the problem writes it

  /* This tool's own stylesheet (the generator loads only phys-tools.css). */
  (function(){ var me = document.currentScript, href = me && me.src ? me.src.replace(/\.js(\?.*)?$/, '.css') : '';
    if(href && !document.querySelector('link[href$="tools/torque-balance.css"]')){ var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); } })();
  var appEl = document.getElementById('app');
  if(appEl) appEl.setAttribute('data-details-title', 'Settings & numbers');
  T.mount('torque-balance', function(app, data){
    document.body.classList.add('tb-root');
    var ex = null;
    T.modes(app, { slug: 'torque-balance', explore: function(pane){ ex = explore(pane, data); },
      quiz: function(pane){ quiz(pane, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------------ art */
  function defs(id){
    return '<defs>' +
      '<linearGradient id="' + id + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="tb-w1"/><stop offset="1" class="tb-w2"/></linearGradient>' +
      '<linearGradient id="' + id + 'm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="tb-m2"/><stop offset=".45" class="tb-m1"/><stop offset="1" class="tb-m2"/></linearGradient>' +
      '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="tb-b2"/><stop offset=".4" class="tb-b1"/><stop offset="1" class="tb-b2"/></linearGradient>' +
      '<radialGradient id="' + id + 'r" cx=".35" cy=".35" r=".7"><stop offset="0" class="tb-m1"/><stop offset="1" class="tb-m2"/></radialGradient>' +
      '</defs>';
  }
  var Z = 1;   // hardware zoom: bigger masses and labels on a narrow stage
  function massSize(m){ var z = m >= 0.45 ? { w: 42, h: 44 } : m >= 0.18 ? { w: 36, h: 30 } : { w: 30, h: 22 }; return { w: z.w * Z, h: z.h * Z }; }
  function gLabel(m){ return m < 1 ? Math.round(m * 1000) + ' g' : F(m, 1) + ' kg'; }
  /* A slotted brass weight hanging from a hook clamp at (x, y): string, hook, body. */
  function massArt(id, x, y, m, label){
    // The body is at least as wide as its label (about 7.4 px a character at 12 px, bold).
    var z = massSize(m), lab = label || gLabel(m), top = y + 18;
    z = { w: Math.max(z.w, Math.ceil(lab.length * 7.4 * Z + 10)), h: z.h };
    var l = x - z.w / 2;
    return '<line class="tb-string" x1="' + n1(x) + '" y1="' + n1(y) + '" x2="' + n1(x) + '" y2="' + n1(top - 4) + '"/>' +
      '<path class="tb-metal" fill="none" stroke-width="2" d="M' + n1(x) + ' ' + n1(top - 6) + 'q0 4 0 6"/>' +
      '<rect class="tb-body" x="' + n1(l) + '" y="' + n1(top) + '" width="' + z.w + '" height="' + z.h + '" rx="5" fill="url(#' + id + 'b)" stroke="#6B4E12" stroke-width="1.2"/>' +
      '<rect x="' + n1(l + 3) + '" y="' + n1(top + 3) + '" width="' + (z.w - 6) + '" height="3" rx="1.5" fill="#fff" opacity=".35"/>' +
      '<text class="tb-label" x="' + n1(x) + '" y="' + n1(top + z.h / 2 + 4.5 * Z) + '" text-anchor="middle"' + (Z !== 1 ? ' font-size="' + n1(12 * Z) + '"' : '') + '>' + esc(lab) + '</text>';
  }
  /* The meter stick, level, from x0 (px) with ppm, centred on y; ticks every
     cm, numbers every 10 cm. */
  function stickArt(id, x0, y, ppm, len, thick){
    len = len || 1; thick = thick || 15;
    var out = '<rect class="tb-wood" x="' + x0 + '" y="' + n1(y - thick / 2) + '" width="' + n1(len * ppm) + '" height="' + thick + '" rx="2" fill="url(#' + id + 'w)"/>';
    for(var c = 0; c <= len * 100; c++){
      var X = x0 + c / 100 * ppm, big = c % 10 === 0, mid = c % 5 === 0;
      if(c === 0 || c === len * 100) continue;
      out += '<line class="tb-tick' + (big ? ' big' : '') + '" x1="' + n1(X) + '" y1="' + n1(y - thick / 2) + '" x2="' + n1(X) + '" y2="' + n1(y - thick / 2 + (big ? 7 : mid ? 5 : 3)) + '"/>';
      if(big && (Z === 1 || c % 20 === 0) && ppm * 0.1 > 34) out += '<text class="tb-num" x="' + n1(X) + '" y="' + n1(y + thick / 2 - 2) + '" text-anchor="middle"' + (Z !== 1 ? ' font-size="' + n1(10 * Z) + '"' : '') + '>' + c + '</text>';
    }
    return out;
  }
  /* Knife-edge stand: base plate on the bench, a post, a V cradle at (x, y). */
  function standArt(id, x, y, bench, stops){
    var out = '';
    if(stops) stops.forEach(function(s){ out += '<rect class="tb-metal" x="' + n1(s.x - 4) + '" y="' + n1(s.y) + '" width="8" height="' + n1(bench - s.y) + '" rx="2" fill="url(#' + id + 'm)"/><rect x="' + n1(s.x - 5) + '" y="' + n1(s.y - 3) + '" width="10" height="5" rx="2" fill="#333" opacity=".75"/>'; });
    out += '<path class="tb-metal" fill="url(#' + id + 'm)" d="M' + n1(x - 46) + ' ' + bench + 'L' + n1(x - 8) + ' ' + n1(y + 18) + 'L' + n1(x + 8) + ' ' + n1(y + 18) + 'L' + n1(x + 46) + ' ' + bench + 'Z"/>' +
      '<path class="tb-metal" fill="url(#' + id + 'm)" d="M' + n1(x - 13) + ' ' + n1(y + 18) + 'L' + n1(x - 13) + ' ' + n1(y + 6) + 'L' + n1(x) + ' ' + n1(y + 13) + 'L' + n1(x + 13) + ' ' + n1(y + 6) + 'L' + n1(x + 13) + ' ' + n1(y + 18) + 'Z"/>';
    return out;
  }
  function clampArt(id, x, y, thick){
    return '<rect class="tb-metal" x="' + n1(x - 7) + '" y="' + n1(y - thick / 2 - 4) + '" width="14" height="' + (thick + 8) + '" rx="3" fill="url(#' + id + 'm)"/>' +
      '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="3.2" fill="#2E3438"/>';
  }
  function hookArt(id, x, y, thick){
    return '<rect class="tb-metal" x="' + n1(x - 5) + '" y="' + n1(y - thick / 2 - 3) + '" width="10" height="' + (thick + 6) + '" rx="2" fill="url(#' + id + 'm)"/>';
  }
  function benchArt(W, y){ return '<rect class="tb-bench" x="0" y="' + y + '" width="' + W + '" height="14"/><rect class="tb-bench-e" x="0" y="' + (y + 10) + '" width="' + W + '" height="4"/>'; }

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var W = 640, H = 300, X0 = 40, PPM = 560, BENCH = 284, HPIV = 0.26, THICK = 15, STOP = 10, STOPR = 0.30, FSC = 14;
    var PY = BENCH - HPIV * PPM;
    function zoomFor(){ var w = sceneEl.clientWidth || 600; Z = w < 520 ? 1.75 : 1; THICK = 15 * Z; }
    // On a phone the view is cropped to the stick (its ends, the masses at 5 cm
    // and 95 cm) and the empty band above it, so the stick fills the width.
    function vBox(){ var ph = Z > 1, x0 = ph ? 22 : 0, w = ph ? W - 44 : W, top = vTop(); return x0 + ' ' + top + ' ' + w + ' ' + (H - top); }
    var st = { L: 1, mb: 0.12, useMb: true, pivot: 0.5, h: HPIV, stop: STOP, masses: [], force: null };
    var nextId = 1, held = true, th = 0, om = 0, rest = '', s = null, scene = 'beam', idp = nid('tbx');
    function addMass(m, x){ var q = { id: nextId++, m: m, x: x }; st.masses.push(q); return q; }
    addMass(0.2, 0.30); addMass(0.1, 0.75);
    var pull = { F: 3, x: 0.85, ang: 120 };

    // ----- DOM
    host.innerHTML = '';
    var stage = document.createElement('div'); stage.className = 'tb-stage';
    var sceneEl = document.createElement('div'); sceneEl.className = 'tb-scene';
    var panel = document.createElement('div'); panel.className = 'tb-panel';
    stage.appendChild(sceneEl); stage.appendChild(panel);
    var cue = T.cue('Drag a brass mass along the stick until the two torque bars match, then press Release.');
    var dock = document.createElement('div'); dock.className = 'tb-dock';
    dock.innerHTML = '<div class="tseg tb-scenes" role="group" aria-label="Scene"><button type="button" data-sc="beam" class="on" aria-pressed="true">Balance</button><button type="button" data-sc="race" aria-pressed="false">Inertia race</button></div>' +
      '<div class="tb-beam-ctl"><div class="tb-sc" role="group" aria-label="Hang another mass"><button type="button" class="bt-btn" data-add="0.1" aria-label="Hang a 100 g mass">+ 100 g</button><button type="button" class="bt-btn" data-add="0.2" aria-label="Hang a 200 g mass">+ 200 g</button><button type="button" class="bt-btn" data-add="0.5" aria-label="Hang a 500 g mass">+ 500 g</button></div>' +
      '<div class="tb-row ls-act"><button type="button" class="ls-btn ls-pri tb-go">Release</button><button type="button" class="ls-btn tb-hold">Hold level</button></div></div>' +
      '<div class="tb-race-ctl" hidden></div>';
    var why = document.createElement('div'); why.className = 'tb-why';
    var det = document.createElement('div'); det.className = 'tb-det';
    host.appendChild(cue.el); host.appendChild(stage); host.appendChild(dock); host.appendChild(why); host.appendChild(det);
    var say = T.announcer(document.createElement('p'));
    var sayEl = null;

    // Details: settings, then the numbers.
    det.innerHTML = '<div class="tb-beam-set"><h3 class="ls-title-l">Settings</h3><div class="tb-set"></div>' +
      '<label class="tb-check"><input type="checkbox" class="tb-usemb" checked> <span>Count the stick\'s own mass (0.12 kg, acting at 50 cm)</span></label>' +
      '<label class="tb-check"><input type="checkbox" class="tb-usef"> <span>Add a pull at an angle (F<sub>A</sub>), drawn with its lever arm</span></label><div class="tb-fset" hidden></div>' +
      '<div class="tb-row"><button type="button" class="bt-btn tb-clear">Remove every mass</button></div></div>' +
      '<h3 class="ls-title-l tb-nums-h">The torques about the fulcrum</h3><div class="tb-nums"></div>';
    var setEl = det.querySelector('.tb-set'), fset = det.querySelector('.tb-fset');
    var pivS = T.slider({ label: 'Fulcrum position', min: 0.25, max: 0.75, step: 0.01, value: st.pivot, unit: 'm', decimals: 2, onInput: function(v){ st.pivot = v; holdLevel(); draw(); } });
    setEl.appendChild(pivS.el);
    var fF = T.slider({ label: 'Pull, F_A', min: 0, max: 8, step: 0.1, value: pull.F, unit: 'N', decimals: 1, onInput: function(v){ pull.F = v; holdLevel(); draw(); } });
    var fX = T.slider({ label: 'Where it acts (mark on the stick)', min: 0.02, max: 0.98, step: 0.01, value: pull.x, unit: 'm', decimals: 2, onInput: function(v){ pull.x = v; holdLevel(); draw(); } });
    var fA = T.slider({ label: 'Angle from the stick (measured from the +x direction)', min: 0, max: 355, step: 5, value: pull.ang, unit: '°', decimals: 0, onInput: function(v){ pull.ang = v; holdLevel(); draw(); } });
    fF.el.querySelector('label').innerHTML = 'Pull, F<sub>A</sub>';
    [fF, fX, fA].forEach(function(x){ fset.appendChild(x.el); });
    det.querySelector('.tb-usemb').addEventListener('change', function(e){ st.useMb = e.target.checked; holdLevel(); draw(); });
    det.querySelector('.tb-usef').addEventListener('change', function(e){ st.force = e.target.checked ? pull : null; fset.hidden = !e.target.checked; if(svg) svg.setAttribute('viewBox', vBox()); holdLevel(); draw(); });
    det.querySelector('.tb-clear').addEventListener('click', function(){ st.masses = []; holdLevel(); draw(); });
    dock.querySelectorAll('[data-add]').forEach(function(b){ b.addEventListener('click', function(){
      var m = +b.getAttribute('data-add'), x = freeSpot();
      var q = addMass(m, x); holdLevel(); draw(); cue.done();
      var el = sceneEl.querySelector('[data-id="' + q.id + '"]'); if(el) el.focus();
      say(gLabel(m) + ' mass hung at the ' + Math.round(x * 100) + ' cm mark.', true);
    }); });
    function freeSpot(){
      var c = [0.1, 0.9, 0.2, 0.8, 0.15, 0.85, 0.3, 0.7, 0.05, 0.95, 0.4, 0.6];
      for(var i = 0; i < c.length; i++) if(!st.masses.some(function(q){ return Math.abs(q.x - c[i]) < 0.045; }) && Math.abs(c[i] - st.pivot) > 0.03) return c[i];
      return 0.1;
    }
    var goBtn = dock.querySelector('.tb-go'), holdBtn = dock.querySelector('.tb-hold');
    goBtn.addEventListener('click', function(){ release(); });
    holdBtn.addEventListener('click', function(){ holdLevel(); draw(); say('Held level.', true); });
    dock.querySelectorAll('[data-sc]').forEach(function(b){ b.addEventListener('click', function(){ setScene(b.getAttribute('data-sc')); }); });

    // ----- physics state
    function model(){ return { L: 1, mb: st.useMb ? st.mb : 0, pivot: st.pivot, h: st.h, stop: st.stop, masses: st.masses, force: st.force && st.force.F > 0 ? st.force : null }; }
    var loop = S.loop(function(dt){
      var m = model(), lim = TB.limits(m), n = Math.max(1, Math.ceil(dt / 0.002)), h = dt / n;
      for(var i = 0; i < n; i++){
        var r = TB.tip(m, th, om, h, G); th = r.th; om = r.om;
        if(th <= lim.lo){ th = lim.lo; om = 0; rest = 'cw'; break; }
        if(th >= lim.hi){ th = lim.hi; om = 0; rest = 'ccw'; break; }
      }
      drawBeam();
      if(rest){ finish(); return false; }
    }, { still: function(){ var m = model(), net = TB.torques(m, G).net; if(Math.abs(net) < 1e-9){ th = 0; om = 0; rest = 'level'; } else { var l = TB.limits(m); th = net > 0 ? l.hi : l.lo; om = 0; rest = net > 0 ? 'ccw' : 'cw'; } drawBeam(); finish(); } });
    function release(){
      if(!held) return;
      var t = TB.torques(model(), G);
      held = false; rest = ''; th = 0; om = 0; cue.done();
      if(Math.abs(t.net) < 1e-9){ rest = 'level'; drawBeam(); finish(); return; }
      goBtn.disabled = true;
      loop.reset(); loop.start();
    }
    function finish(){
      goBtn.disabled = false;
      var t = TB.torques(model(), G);
      draw();
      say(rest === 'level' ? 'Released: the stick stays level. The torques balance.' : 'Released: the stick tipped ' + (rest === 'ccw' ? 'counterclockwise' : 'clockwise') + ' with an angular acceleration of ' + nm(Math.abs(t.alpha)) + ' radians per second squared at first, and now rests on the stop.', true);
    }
    function holdLevel(){ loop.stop(); held = true; th = 0; om = 0; rest = ''; goBtn.disabled = false; }
    function stop(){ loop.stop(); race.stop(); }

    // ----- drawing: build once, update positions
    var svg = null, gBeam, gMasses, gStand, gForce, gArm, gStops, did = nid('tbd');
    function build(){
      zoomFor();
      sceneEl.innerHTML = '<svg viewBox="' + vBox() + '" class="phys-scene tb-svg" role="group" aria-labelledby="' + did + 't">' + defs(did) +
        '<title id="' + did + 't">Meter stick on a fulcrum</title>' + benchArt(W, BENCH) +
        '<g class="tb-stops"></g><g class="tb-stand tb-drag" tabindex="0" role="slider" aria-label="Fulcrum position" aria-valuemin="25" aria-valuemax="75"></g>' +
        '<g class="tb-armg"></g><g class="tb-beam"></g><g class="tb-masses"></g><g class="tb-force"></g>' +
        '<text class="tb-hint" x="' + (W - (Z > 1 ? 26 : 12)) + '" y="' + (vTop() + 16) + '" text-anchor="end" aria-hidden="true"' + (Z > 1 ? ' font-size="17"' : '') + '></text></svg>';
      svg = sceneEl.querySelector('svg');
      gBeam = svg.querySelector('.tb-beam'); gMasses = svg.querySelector('.tb-masses'); gStand = svg.querySelector('.tb-stand');
      gForce = svg.querySelector('.tb-force'); gArm = svg.querySelector('.tb-armg'); gStops = svg.querySelector('.tb-stops');
      gBeam.innerHTML = stickArt(did, X0, PY, PPM, 1, THICK) + '<g class="tb-clampg"></g>';
      dragStand(); keysStand();
    }
    function vTop(){ return st.force ? 8 : Z > 1 ? Math.round(PY - 40) : 64; }
    function px(x){ return X0 + x * PPM; }
    function onBeam(x){ var r = (x - st.pivot) * PPM, c = Math.cos(th), sn = Math.sin(th); return { x: px(st.pivot) + r * c, y: PY - r * sn }; }
    function drawBeam(){
      var P = px(st.pivot);
      gBeam.setAttribute('transform', 'rotate(' + n1(-M.deg(th) * 10) / 10 + ' ' + n1(P) + ' ' + PY + ')');
      gBeam.querySelector('.tb-clampg').innerHTML = (st.useMb ? '<g aria-hidden="true"><circle cx="' + n1(px(0.5)) + '" cy="' + PY + '" r="' + n1(5.5 * Z) + '" fill="var(--white)" stroke="var(--phys-s5)" stroke-width="2"/><path d="M' + n1(px(0.5) - 5.5 * Z) + ' ' + PY + 'h' + n1(11 * Z) + 'M' + n1(px(0.5)) + ' ' + n1(PY - 5.5 * Z) + 'v' + n1(11 * Z) + '" stroke="var(--phys-s5)" stroke-width="1.6"/></g>' : '') +
        clampArt(did, P, PY, THICK) + st.masses.map(function(q, i){ return hookArt(did, px(q.x), PY, THICK) + '<circle class="' + COL[i % 4] + '" cx="' + n1(px(q.x)) + '" cy="' + n1(PY - THICK / 2 - 7 * Z) + '" r="' + n1(5 * Z) + '" stroke="var(--white)" stroke-width="1.5"/>'; }).join('');
      // Masses hang straight down from their hooks.
      var have = {};
      st.masses.forEach(function(q){
        have[q.id] = 1;
        var g = gMasses.querySelector('[data-id="' + q.id + '"]');
        if(!g){
          g = S.el('g', { 'class': 'tb-mass', 'data-id': q.id, tabindex: '0', role: 'slider', 'aria-valuemin': '0', 'aria-valuemax': '100' }, gMasses);
          dragMass(g, q); keysMass(g, q);
        }
        var p = onBeam(q.x), z = massSize(q.m);
        g.innerHTML = '<rect class="tb-hit" x="' + n1(p.x - z.w / 2 - 8) + '" y="' + n1(p.y - 14 * Z) + '" width="' + n1(z.w + 16) + '" height="' + n1(z.h + 34 * Z) + '"/>' + massArt(did, p.x, p.y + THICK / 2, q.m);
        var r = Math.round((q.x - st.pivot) * 100);
        g.setAttribute('aria-label', gLabel(q.m) + ' mass');
        g.setAttribute('aria-valuenow', String(Math.round(q.x * 100)));
        g.setAttribute('aria-valuetext', 'at the ' + Math.round(q.x * 100) + ' cm mark, ' + (r === 0 ? 'right at the fulcrum' : Math.abs(r) + ' cm ' + (r < 0 ? 'left' : 'right') + ' of the fulcrum') + '. Arrow keys move it, Delete removes it.');
      });
      Array.prototype.slice.call(gMasses.children).forEach(function(g){ if(!have[g.getAttribute('data-id')]) g.remove(); });
      drawForce();
    }
    function drawStand(){
      var P = px(st.pivot), sy = PY + STOPR * PPM * Math.sin(M.rad(STOP)) + THICK / 2 + 2;
      gStops.innerHTML = '';
      gStand.innerHTML = '<rect class="tb-hit" x="' + n1(P - 48) + '" y="' + n1(PY + 10) + '" width="96" height="' + n1(BENCH - PY - 8) + '"/>' +
        standArt(did, P, PY, BENCH, [{ x: P - STOPR * PPM, y: sy }, { x: P + STOPR * PPM, y: sy }]) +
        '<rect class="tb-metal" x="' + n1(P - STOPR * PPM - 8) + '" y="' + (BENCH - 6) + '" width="' + n1(2 * STOPR * PPM + 16) + '" height="6" rx="2" fill="url(#' + did + 'm)"/>';
      gStand.setAttribute('aria-valuenow', String(Math.round(st.pivot * 100)));
      gStand.setAttribute('aria-valuetext', 'at the ' + Math.round(st.pivot * 100) + ' cm mark. Arrow keys move it.');
    }
    function drawForce(){
      gForce.innerHTML = ''; gArm.innerHTML = '';
      var f = st.force;
      if(!f || !(f.F > 0)) return;
      var a = M.rad(f.ang) + th, p = onBeam(f.x), L = f.F * FSC, dx = Math.cos(a) * L, dy = -Math.sin(a) * L;
      // Line of action, then the lever arm: the perpendicular from the pivot.
      var P = { x: px(st.pivot), y: PY }, ux = Math.cos(a), uy = -Math.sin(a);
      var t = (P.x - p.x) * ux + (P.y - p.y) * uy, foot = { x: p.x + ux * t, y: p.y + uy * t };
      var arm = Math.abs((f.x - st.pivot) * Math.sin(M.rad(f.ang)));
      var e1 = Math.min(t, 0) - 40, e2 = Math.max(t, L) + 40;
      var out = '<line class="tb-loa" x1="' + n1(p.x + ux * e1) + '" y1="' + n1(p.y + uy * e1) + '" x2="' + n1(p.x + ux * e2) + '" y2="' + n1(p.y + uy * e2) + '"/>';
      if(arm * PPM > 6){
        var vx = foot.x - P.x, vy = foot.y - P.y, vl = Math.sqrt(vx * vx + vy * vy) || 1, k = 9;
        var c1 = { x: foot.x - vx / vl * k, y: foot.y - vy / vl * k }, sgn = t > 0 ? -1 : 1;
        out += '<line class="tb-arm" x1="' + n1(P.x) + '" y1="' + n1(P.y) + '" x2="' + n1(foot.x) + '" y2="' + n1(foot.y) + '"/>' +
          '<path class="tb-ra" d="M' + n1(c1.x) + ' ' + n1(c1.y) + 'l' + n1(sgn * ux * k) + ' ' + n1(sgn * uy * k) + 'l' + n1(vx / vl * k) + ' ' + n1(vy / vl * k) + '"/>' +
          '<text class="tb-arm-t" x="' + n1((P.x + foot.x) / 2 + (vy / vl) * 14) + '" y="' + n1((P.y + foot.y) / 2 - (vx / vl) * 14 + 4) + '" text-anchor="middle">lever arm ' + F(arm, 2) + ' m</text>';
      }
      gArm.innerHTML = out;
      gForce.innerHTML = '<g class="tb-fx tb-drag" tabindex="0" role="slider" aria-label="Pull F_A: drag its tip to change its size and direction" aria-valuemin="0" aria-valuemax="8" aria-valuenow="' + F(f.F, 1) + '" aria-valuetext="' + F(f.F, 1) + ' newtons at ' + Math.round(f.ang) + ' degrees from the stick, acting at the ' + Math.round(f.x * 100) + ' cm mark. Up and down arrows change its size, left and right its angle.">' +
        S.arrow(p.x, p.y, dx, dy, { cls: 'f-applied', label: 'F_A', width: 3.5, head: 11 }) +
        '<circle class="tb-hit" cx="' + n1(p.x + dx) + '" cy="' + n1(p.y + dy) + '" r="18"/><circle cx="' + n1(p.x + dx) + '" cy="' + n1(p.y + dy) + '" r="6" fill="var(--white)" stroke="currentColor" stroke-width="2" style="color:#5A6268"/></g>' +
        '<circle class="tb-fa tb-drag" tabindex="0" role="slider" aria-label="Where the pull acts" aria-valuemin="2" aria-valuemax="98" aria-valuenow="' + Math.round(f.x * 100) + '" aria-valuetext="at the ' + Math.round(f.x * 100) + ' cm mark" cx="' + n1(p.x) + '" cy="' + n1(p.y) + '" r="7" fill="var(--white)" stroke="#5A6268" stroke-width="2.5"/>';
      dragForce(); keysForce();
    }

    // ----- input
    function toSvg(e){ var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
    function snap(x, a, b){ return Math.max(a, Math.min(b, Math.round(x * 100) / 100)); }
    function drag(el, o){
      el.addEventListener('pointerdown', function(e){
        if(e.button) return;
        e.preventDefault(); el.setPointerCapture && el.setPointerCapture(e.pointerId);
        holdLevel(); cue.done(); el.classList.add('is-drag'); if(o.start) o.start(e);
        function mv(ev){ o.move(toSvg(ev), ev); }
        function up(ev){ el.classList.remove('is-drag'); el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); if(o.end) o.end(toSvg(ev)); }
        el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      });
    }
    function dragMass(g, q){
      drag(g, {
        move: function(p){ q.x = snap((p.x - X0) / PPM, 0.02, 0.98); var off = p.y > BENCH - 4; g.classList.toggle('is-gone', off); hint(off ? 'Let go here to remove it' : ''); drawBeam(); readout(); },
        end: function(p){ hint(''); if(p.y > BENCH - 4){ st.masses = st.masses.filter(function(m){ return m !== q; }); say(gLabel(q.m) + ' mass removed.', true); } draw(); }
      });
    }
    function keysMass(g, q){
      g.addEventListener('keydown', function(e){
        var d = { ArrowLeft: -0.01, ArrowDown: -0.01, ArrowRight: 0.01, ArrowUp: 0.01, PageDown: -0.1, PageUp: 0.1 }[e.key];
        if(e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); st.masses = st.masses.filter(function(m){ return m !== q; }); holdLevel(); draw(); say(gLabel(q.m) + ' mass removed.', true); var f = gMasses.querySelector('.tb-mass'); if(f) f.focus(); return; }
        if(e.key === 'Home') d = 0.02 - q.x; if(e.key === 'End') d = 0.98 - q.x;
        if(d == null) return;
        e.preventDefault(); holdLevel(); cue.done(); q.x = snap(q.x + d, 0.02, 0.98); draw();
      });
    }
    function dragStand(){
      var off = 0;
      drag(gStand, { start: function(e){ off = toSvg(e).x - px(st.pivot); }, move: function(p){ st.pivot = snap((p.x - off - X0) / PPM, 0.25, 0.75); pivS.set(st.pivot); draw(); } });
    }
    function keysStand(){
      gStand.addEventListener('keydown', function(e){
        var d = { ArrowLeft: -0.01, ArrowDown: -0.01, ArrowRight: 0.01, ArrowUp: 0.01, PageDown: -0.1, PageUp: 0.1 }[e.key];
        if(d == null) return;
        e.preventDefault(); holdLevel(); st.pivot = snap(st.pivot + d, 0.25, 0.75); pivS.set(st.pivot); draw();
      });
    }
    function dragForce(){
      var tipEl = gForce.querySelector('.tb-fx'), at = gForce.querySelector('.tb-fa'), f = st.force;
      drag(tipEl, { move: function(p){
        var o = onBeam(f.x), dx = p.x - o.x, dy = o.y - p.y, Fv = Math.min(8, Math.sqrt(dx * dx + dy * dy) / FSC);
        f.F = Math.round(Fv * 10) / 10; f.ang = (Math.round(M.deg(Math.atan2(dy, dx)) / 5) * 5 + 360) % 360;
        fF.set(f.F); fA.set(f.ang); drawForce(); readout();
      }, end: function(){ draw(); var n = gForce.querySelector('.tb-fx'); if(n) n.focus(); } });
      drag(at, { move: function(p){ f.x = snap((p.x - X0) / PPM, 0.02, 0.98); fX.set(f.x); drawForce(); readout(); }, end: function(){ draw(); var n = gForce.querySelector('.tb-fa'); if(n) n.focus(); } });
    }
    function keysForce(){
      var f = st.force, tipEl = gForce.querySelector('.tb-fx'), at = gForce.querySelector('.tb-fa');
      tipEl.addEventListener('keydown', function(e){
        var dF = { ArrowUp: 0.5, ArrowDown: -0.5 }[e.key], dA = { ArrowLeft: 5, ArrowRight: -5 }[e.key];
        if(dF == null && dA == null) return;
        e.preventDefault(); holdLevel();
        if(dF != null) f.F = Math.max(0, Math.min(8, Math.round((f.F + dF) * 10) / 10));
        if(dA != null) f.ang = (f.ang + dA + 360) % 360;
        fF.set(f.F); fA.set(f.ang); draw(); var n = gForce.querySelector('.tb-fx'); if(n) n.focus();
      });
      at.addEventListener('keydown', function(e){
        var d = { ArrowLeft: -0.01, ArrowDown: -0.01, ArrowRight: 0.01, ArrowUp: 0.01 }[e.key];
        if(d == null) return;
        e.preventDefault(); holdLevel(); f.x = snap(f.x + d, 0.02, 0.98); fX.set(f.x); draw(); var n = gForce.querySelector('.tb-fa'); if(n) n.focus();
      });
    }
    function hint(t){ var h = svg.querySelector('.tb-hint'); if(h) h.textContent = t; }

    // ----- torque bars and words
    var COL = ['tb-c0', 'tb-c1', 'tb-c2', 'tb-c3'];
    function colorOf(it){ return it.kind === 'beam' ? 'tb-cb' : it.kind === 'pull' ? 'tb-cp' : COL[it.i % 4]; }
    function nameOf(it){ return it.kind === 'beam' ? 'Stick\'s weight' : it.kind === 'pull' ? 'Pull F_A' : gLabel(st.masses[it.i].m) + ' at ' + Math.round(st.masses[it.i].x * 100) + ' cm'; }
    function bars(t){
      var max = Math.max(0.25, t.ccw, t.cw), ccwL = t.items.filter(function(it){ return it.tau > 1e-12; }), cwL = t.items.filter(function(it){ return it.tau < -1e-12; });
      var bal = Math.abs(t.net) < 5e-4;
      function row(sym, label, list, total){
        return '<div class="tb-brow"><span class="tb-bl">' + sym + ' ' + label + '</span><span class="tb-btrack">' + list.map(function(it){ return '<i class="' + colorOf(it) + '" style="width:' + (Math.abs(it.tau) / max * 100).toFixed(2) + '%"></i>'; }).join('') + '</span><span class="tb-bv">' + F(total, 3) + ' N·m</span></div>';
      }
      var desc = 'Torques about the fulcrum, stick level: counterclockwise ' + F(t.ccw, 3) + ' N·m, clockwise ' + F(t.cw, 3) + ' N·m, ' + (bal ? 'balanced.' : 'net ' + F(Math.abs(t.net), 3) + ' N·m ' + (t.net > 0 ? 'counterclockwise.' : 'clockwise.'));
      return '<div class="tb-bars" role="img" aria-label="' + esc(desc) + '">' + row('↺', 'Counterclockwise', ccwL, t.ccw) + row('↻', 'Clockwise', cwL, t.cw) +
        '<div class="tb-brow tb-bnet"><span class="tb-bl">Net torque</span><span class="tb-bnv ' + (bal ? 'is-bal' : 'is-off') + '">' + (bal ? 'zero: balanced' : F(Math.abs(t.net), 3) + ' N·m ' + (t.net > 0 ? '↺ counterclockwise' : '↻ clockwise')) + '</span></div></div>';
    }
    function readout(){
      var t = TB.torques(model(), G), bal = Math.abs(t.net) < 5e-4;
      panel.innerHTML = bars(t);
      var sense = t.net > 0 ? 'counterclockwise' : 'clockwise';
      var head = !held ? (rest === 'level' ? '<b>Balanced:</b> released, and it stays level.' : rest ? '<b>Tipped ' + sense + '</b> (α = ' + F(Math.abs(t.alpha), 2) + ' rad/s² at first), now on the stop.' : '<b>Tipping ' + sense + '…</b>')
        : bal ? '<b>Balanced.</b> Counterclockwise torque = clockwise torque.' : '<b>Unbalanced</b> by ' + F(Math.abs(t.net), 3) + ' N·m ' + (t.net > 0 ? '↺' : '↻') + '.';
      var steps = t.items.map(function(it){
        return '<li><b>' + esc(nameOf(it)).replace('F_A', 'F<sub>A</sub>') + ':</b> ' + (it.kind === 'pull' ? F(it.F, 1) + ' N × lever arm ' + F(it.arm, 3) + ' m' : F(it.F, 3) + ' N × ' + F(it.arm, 2) + ' m') + ' = ' + F(Math.abs(it.tau), 3) + ' N·m ' + (Math.abs(it.tau) < 1e-12 ? '(no lever arm)' : it.tau > 0 ? '↺' : '↻') + '</li>';
      }).join('');
      var body = '<p>Each torque is force × lever arm, about the fulcrum. A weight acts straight down at its hook' + (st.useMb ? ', and the stick\'s own weight at its center (50 cm)' : '') + '.</p><ol>' + (steps || '<li>No torques yet: hang a mass.</li>') + '</ol>' +
        '<p>Net torque ' + F(Math.abs(t.net), 3) + ' N·m' + (bal ? '' : ' ' + sense) + '. Rotational inertia about the fulcrum I = ' + F(t.I, 4) + ' kg·m² (point masses m r², the stick (1/12) M L² + M d²), so α = τ<sub>net</sub> / I = ' + F(Math.abs(t.alpha), 3) + ' rad/s²' + (bal ? '' : ' ' + sense) + ' at the moment of release.</p>' +
        '<p>The fulcrum pushes up with ' + F(t.support.y, 3) + ' N' + (Math.abs(t.support.x) > 1e-6 ? ' and sideways with ' + F(Math.abs(t.support.x), 3) + ' N' : '') + ' while the stick is held level' + (st.force && st.force.F > 0 ? ' (the weights minus the pull\'s upward part)' : ' (the total weight)') + ': translational equilibrium is a separate condition from rotational equilibrium.</p>';
      T.explain(why, head, body);
      if(s){
        s.caption(head + (held && !bal ? ' Press Release.' : ''), 'explore');
        s.pills([{ k: 'Net τ', html: F(Math.abs(t.net), 3) + ' N·m', tone: 'readout' }], 'left', 'explore');
        s.pills([bal ? { html: 'Balanced', tone: 'good' } : { html: 'Tips ' + (t.net > 0 ? '↺' : '↻'), tone: 'warn' }], 'right', 'explore');
      }
      var rows = t.items.map(function(it){ return '<tr><th scope="row"><span class="tb-sw ' + colorOf(it) + '"></span>' + esc(nameOf(it)).replace('F_A', 'F<sub>A</sub>') + '</th><td class="r">' + F(it.F, 3) + ' N</td><td class="r">' + F(it.arm, 3) + ' m</td><td class="r">' + (Math.abs(it.tau) < 1e-12 ? '0' : (it.tau > 0 ? '↺ ' : '↻ ') + F(Math.abs(it.tau), 3)) + '</td></tr>'; }).join('');
      det.querySelector('.tb-nums').innerHTML = '<table class="tb-tbl"><caption class="sr-only">Every torque about the fulcrum with the stick level</caption><thead><tr><th>Force</th><th class="r">Size</th><th class="r">Lever arm</th><th class="r">τ (N·m)</th></tr></thead><tbody>' + rows +
        '<tr class="hl"><th scope="row">Net</th><td></td><td></td><td class="r">' + (bal ? '0' : (t.net > 0 ? '↺ ' : '↻ ') + F(Math.abs(t.net), 3)) + '</td></tr></tbody></table>' +
        '<p class="bt-small">I about the fulcrum ' + F(t.I, 4) + ' kg·m²; α at release ' + F(Math.abs(t.alpha), 3) + ' rad/s². g = 9.8 m/s². Counterclockwise counts as positive.</p>';
      svg.querySelector('title').textContent = 'Meter stick on a fulcrum at the ' + Math.round(st.pivot * 100) + ' cm mark' + (held ? ', held level' : ', tilted ' + F(Math.abs(M.deg(th)), 1) + ' degrees') + ', with ' + (st.masses.length ? st.masses.map(function(q){ return gLabel(q.m) + ' at ' + Math.round(q.x * 100) + ' cm'; }).join(', ') : 'no masses') + (st.force && st.force.F > 0 ? ' and a ' + F(st.force.F, 1) + ' N pull at ' + Math.round(st.force.ang) + ' degrees acting at ' + Math.round(st.force.x * 100) + ' cm' : '') + '. ' + (bal ? 'The torques balance.' : 'Net torque ' + F(Math.abs(t.net), 3) + ' N·m ' + (t.net > 0 ? 'counterclockwise.' : 'clockwise.'));
      holdBtn.disabled = held;
    }
    function draw(){ if(scene !== 'beam') return; drawStand(); drawBeam(); readout(); }

    /* ----- scene 2: the inertia race */
    var raceCtl = dock.querySelector('.tb-race-ctl');
    var RA = { I0: 0.0015, ms: 0.25, m: 0.20, r: 0.040, h: 0.80 }, dA = 0.06, dB = 0.18, rt = 0, rdone = false;
    var sA = T.slider({ label: 'Wheel A: sliders from the axle', min: 0.04, max: 0.20, step: 0.01, value: dA, unit: 'm', decimals: 2, onInput: function(v){ dA = v; raceReset(); } });
    var sB = T.slider({ label: 'Wheel B: sliders from the axle', min: 0.04, max: 0.20, step: 0.01, value: dB, unit: 'm', decimals: 2, onInput: function(v){ dB = v; raceReset(); } });
    raceCtl.appendChild(sA.el); raceCtl.appendChild(sB.el);
    raceCtl.insertAdjacentHTML('beforeend', '<div class="tb-row ls-act"><button type="button" class="ls-btn ls-pri tb-race-go">Race</button><button type="button" class="ls-btn tb-race-reset">Reset</button></div>');
    var raceGo = raceCtl.querySelector('.tb-race-go');
    raceGo.addEventListener('click', function(){ if(rdone) raceReset(); race.reset(); race.start(); raceGo.disabled = true; });
    raceCtl.querySelector('.tb-race-reset').addEventListener('click', raceReset);
    function wheel(d){ var I = TB.race.inertia(RA.I0, RA.ms, d); return { m: RA.m, r: RA.r, I: I, h: RA.h, g: G }; }
    var race = S.loop(function(dt, t){ rt = t; drawRace(); var a = TB.race.at(wheel(dA), t), b = TB.race.at(wheel(dB), t); if(a.done && b.done){ rdone = true; raceGo.disabled = false; drawRace(); announceRace(); return false; } },
      { still: function(){ var a = TB.race.at(wheel(dA), 0), b = TB.race.at(wheel(dB), 0); rt = Math.max(a.tEnd, b.tEnd); rdone = true; raceGo.disabled = false; drawRace(); announceRace(); } });
    function raceReset(){ race.stop(); rt = 0; rdone = false; raceGo.disabled = false; drawRace(); }
    function announceRace(){ var a = TB.race.at(wheel(dA), 0), b = TB.race.at(wheel(dB), 0); say(Math.abs(a.tEnd - b.tEnd) < 1e-6 ? 'A tie: both weights land after ' + F(a.tEnd, 2) + ' seconds.' : 'Wheel ' + (a.tEnd < b.tEnd ? 'A' : 'B') + '\'s weight lands first, after ' + F(Math.min(a.tEnd, b.tEnd), 2) + ' seconds; the other after ' + F(Math.max(a.tEnd, b.tEnd), 2) + ' seconds.', true); }
    var RW = 640, RH = 360, RP = 300, AY = 92, W0 = AY + 30, FALL = 180, FLOOR = W0 + FALL + 40;
    /* Phone (Z > 1): a shorter drawn drop and the wheels closer together, so the
       picture is limited by the stage's width, not its small height. */
    function raceGeo(){ var ph = Z > 1, fall = ph ? 100 : 180; FALL = fall; FLOOR = W0 + fall + massSize(0.45).h; /* a landed weight rests on the floor */ return { xs: ph ? [190, 430] : [RW * 0.27, RW * 0.73], dim: ph ? 106 : 34, vb: ph ? '94 18 462 ' + (FLOOR + 12 - 18) : '0 0 ' + RW + ' ' + RH }; }
    /* A rotational-inertia apparatus: a grooved hub on an axle, a cross-bar
       with two brass sliders, hung from a bracket under the ceiling beam. */
    function wheelArt(id, cx, cy, d, ang, name){
      var R = 0.215 * RP, rh = RA.r * RP, dd = d * RP, deg = n1(M.deg(ang));
      var out = '<path class="tb-metal" fill="url(#' + id + 'm)" d="M' + (cx - 16) + ' ' + (AY - 62) + 'L' + (cx + 16) + ' ' + (AY - 62) + 'L' + (cx + 5) + ' ' + cy + 'L' + (cx - 5) + ' ' + cy + 'Z"/>';
      out += '<g transform="rotate(' + deg + ' ' + cx + ' ' + cy + ')">' +
        '<rect class="tb-metal" x="' + n1(cx - R) + '" y="' + n1(cy - 3.5) + '" width="' + n1(2 * R) + '" height="7" rx="3.5" fill="url(#' + id + 'm)"/>' +
        '<circle cx="' + n1(cx - R) + '" cy="' + cy + '" r="4" fill="url(#' + id + 'r)" class="tb-metal"/><circle cx="' + n1(cx + R) + '" cy="' + cy + '" r="4" fill="url(#' + id + 'r)" class="tb-metal"/>' +
        [-1, 1].map(function(sg){ return '<rect x="' + n1(cx + sg * dd - 10) + '" y="' + n1(cy - 12) + '" width="20" height="24" rx="4" fill="url(#' + id + 'b)" stroke="#6B4E12" stroke-width="1.2"/><line x1="' + n1(cx + sg * dd - 10) + '" x2="' + n1(cx + sg * dd + 10) + '" y1="' + cy + '" y2="' + cy + '" stroke="#6B4E12" stroke-width="1" opacity=".5"/>'; }).join('') +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + n1(rh + 2) + '" fill="url(#' + id + 'r)" class="tb-metal"/><circle cx="' + cx + '" cy="' + cy + '" r="' + n1(rh - 3) + '" fill="none" stroke="#2E3438" stroke-width="1" opacity=".55"/>' +
        '<line x1="' + cx + '" y1="' + n1(cy - rh + 3) + '" x2="' + cx + '" y2="' + n1(cy - rh + 8) + '" stroke="#2E3438" stroke-width="2"/></g>';
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="#2E3438"/>';
      return out;
    }
    function drawRace(){
      if(scene !== 'race') return;
      var A = wheel(dA), B = wheel(dB), a = TB.race.at(A, rt), b = TB.race.at(B, rt), id = did;
      var geo = raceGeo(), xs = geo.xs, fs = FALL / RA.h, dl = geo.dim;
      var html = '<svg viewBox="' + geo.vb + '" class="phys-scene tb-svg" role="img" aria-label="' + esc('Two wheels with the same mass. Wheel A has its sliders ' + F(dA, 2) + ' m from the axle (I = ' + F(A.I, 4) + ' kg·m²), wheel B ' + F(dB, 2) + ' m (I = ' + F(B.I, 4) + ' kg·m²). After ' + F(rt, 2) + ' s the weights have fallen ' + F(a.y, 2) + ' m and ' + F(b.y, 2) + ' m.') + '">' + defs(id) +
        '<rect class="tb-metal" x="16" y="' + (AY - 72) + '" width="' + (RW - 32) + '" height="10" rx="3" fill="url(#' + id + 'm)"/>';
      [[A, a, dA, 'A'], [B, b, dB, 'B']].forEach(function(w, i){
        var cx = xs[i], cy = AY, st2 = w[1], rh = RA.r * RP, sx = cx + rh, wy = W0 + st2.y * fs;
        html += wheelArt(id, cx, cy, w[2], st2.theta, w[3]) +
          '<line class="tb-string" x1="' + n1(sx) + '" y1="' + cy + '" x2="' + n1(sx) + '" y2="' + n1(wy) + '"/>' + massArt(id, sx, wy - 18, 0.45, '200 g') +
          '<text class="tb-bar-t" x="' + cx + '" y="' + (AY - 46) + '" text-anchor="middle">' + w[3] + '</text>';
        if(st2.done) html += '<text class="tb-bar-t tb-good" x="' + n1(sx - 40 * Z) + '" y="' + n1(FLOOR - 10) + '" text-anchor="end"' + (Z > 1 ? ' font-size="16"' : '') + '>' + F(st2.tEnd, 2) + ' s</text>';
        // This wheel's energy column: the weight's K under the wheel's K_rot,
        // as shares of the m g h it gives up by the floor.
        var bx = cx + 0.215 * RP + 26, top = AY - 20, bh = FLOOR - 14 - top, tot = RA.m * G * RA.h, hk = st2.K / tot * bh, hr = st2.Krot / tot * bh;
        html += '<rect class="tb-bar-bg" x="' + n1(bx) + '" y="' + n1(top) + '" width="26" height="' + n1(bh) + '" rx="5"/>' +
          '<rect class="tb-c0" x="' + n1(bx) + '" y="' + n1(top + bh - hk) + '" width="26" height="' + n1(hk) + '"/>' +
          '<rect class="tb-c1" x="' + n1(bx) + '" y="' + n1(top + bh - hk - hr) + '" width="26" height="' + n1(hr) + '"/>' +
          '<text class="tb-bar-k" x="' + n1(bx + 13) + '" y="' + n1(top - 6) + '" text-anchor="middle">' + F(st2.K + st2.Krot, 2) + ' J</text>';
      });
      html += '<rect class="tb-bench" x="0" y="' + n1(FLOOR) + '" width="' + RW + '" height="12"/><rect class="tb-bench-e" x="0" y="' + n1(FLOOR + 8) + '" width="' + RW + '" height="4"/>' +
        // The drop, as a dimension line at the left.
        '<g class="tb-dimv"><line x1="' + dl + '" x2="' + dl + '" y1="' + (FLOOR - FALL) + '" y2="' + FLOOR + '" stroke="var(--muted)" stroke-width="1.4"/><path d="M' + (dl - 6) + ' ' + (FLOOR - FALL) + 'h12M' + (dl - 6) + ' ' + FLOOR + 'h12" stroke="var(--muted)" stroke-width="1.4"/>' +
        '<text class="tb-hint" transform="translate(' + (dl - 6) + ' ' + n1(FLOOR - FALL / 2) + ') rotate(-90)" text-anchor="middle"' + (Z > 1 ? ' font-size="16"' : '') + '>drop ' + F(RA.h, 2) + ' m</text></g>' +
        (Z > 1 ? '<g class="tb-key-svg" font-size="15"><rect class="tb-c0" x="288" y="' + (AY - 62) + '" width="13" height="13" rx="3"/><text class="tb-bar-k" font-size="15" x="306" y="' + (AY - 51) + '">K</text><rect class="tb-c1" x="326" y="' + (AY - 62) + '" width="13" height="13" rx="3"/><text class="tb-bar-k" font-size="15" x="344" y="' + (AY - 51) + '">K<tspan dy="4" font-size="11">rot</tspan></text></g>' : '') + '</svg>';
      sceneEl.innerHTML = html;
      // Energy split: the weight's K against the wheel's K_rot, as shares of m g h.
      var tot = RA.m * G * RA.h;
      function erow(name, st2){
        return '<div class="tb-brow"><span class="tb-bl">Wheel ' + name + '</span><span class="tb-btrack"><i class="tb-c0" style="width:' + (st2.K / tot * 100).toFixed(2) + '%"></i><i class="tb-c1" style="width:' + (st2.Krot / tot * 100).toFixed(2) + '%"></i></span><span class="tb-bv">' + F(st2.K + st2.Krot, 2) + ' J</span></div>';
      }
      panel.innerHTML = '<p class="tb-key' + (Z > 1 ? ' sr-only' : '') + '" role="img" aria-label="' + esc('Energy columns beside each wheel: kinetic energy so far, out of the ' + F(tot, 2) + ' J the weight gives up by the floor. Wheel A: weight ' + F(a.K, 3) + ' J, wheel spin ' + F(a.Krot, 3) + ' J. Wheel B: weight ' + F(b.K, 3) + ' J, wheel spin ' + F(b.Krot, 3) + ' J.') + '"><span><i class="tb-c0"></i><b>K of the weight</b></span><span><i class="tb-c1"></i><b>K<sub>rot</sub> of the wheel</b></span><span class="tb-key-n">full column = m g h = ' + F(tot, 2) + ' J</span></p>';
      var win = A.I < B.I - 1e-12 ? 'A' : B.I < A.I - 1e-12 ? 'B' : '';
      var head = !win ? '<b>Same I, same race.</b> The sliders are equally far out.' : rdone ? '<b>Wheel ' + win + ' wins:</b> its mass sits closer to the axle, so its I is smaller.' : rt > 0 ? '<b>Racing…</b> same mass, different I.' : '<b>Same mass, different I.</b> Which weight lands first? Press Race.';
      T.explain(why, head, '<p>Both wheels have the same mass. Rotational inertia depends on where that mass is: I = I<sub>hub</sub> + 2 m d². A: ' + F(A.I, 4) + ' kg·m², B: ' + F(B.I, 4) + ' kg·m².</p>' +
        '<p>The string\'s tension gives each wheel a torque T r, and α = τ / I. Together with the weight (m g − T = m a, a = r α): a = m g / (m + I / r²). A: ' + F(a.a, 3) + ' m/s², B: ' + F(b.a, 3) + ' m/s².</p>' +
        '<p>In energy terms, the weight\'s lost U is shared between its own K and the wheel\'s K<sub>rot</sub> = ½ I ω². The wheel with the larger I takes the bigger share (the orange part of its bar), so its weight moves more slowly.</p>');
      if(s){
        s.caption(head, 'explore');
        s.pills([{ k: 't', html: F(rt, 2) + ' s', tone: 'readout' }], 'left', 'explore');
        s.pills(rdone ? [{ html: win ? 'A ' + F(a.tEnd, 2) + ' s · B ' + F(b.tEnd, 2) + ' s' : 'Tie', tone: 'good' }] : [{ html: 'I<sub>A</sub> ' + (A.I < B.I ? '<' : A.I > B.I ? '>' : '=') + ' I<sub>B</sub>', tone: 'ghost' }], 'right', 'explore');
      }
      det.querySelector('.tb-nums').innerHTML = '<table class="tb-tbl"><caption class="sr-only">The two wheels</caption><thead><tr><th></th><th class="r">Wheel A</th><th class="r">Wheel B</th></tr></thead><tbody>' +
        '<tr><th scope="row">Sliders from the axle</th><td class="r">' + F(dA, 2) + ' m</td><td class="r">' + F(dB, 2) + ' m</td></tr>' +
        '<tr><th scope="row">I = I<sub>hub</sub> + 2 m d² (kg·m²)</th><td class="r">' + F(A.I, 4) + '</td><td class="r">' + F(B.I, 4) + '</td></tr>' +
        '<tr><th scope="row">Weight\'s acceleration</th><td class="r">' + F(a.a, 3) + ' m/s²</td><td class="r">' + F(b.a, 3) + ' m/s²</td></tr>' +
        '<tr><th scope="row">String tension</th><td class="r">' + F(a.T, 3) + ' N</td><td class="r">' + F(b.T, 3) + ' N</td></tr>' +
        '<tr><th scope="row">Time to fall ' + F(RA.h, 2) + ' m</th><td class="r">' + F(a.tEnd, 2) + ' s</td><td class="r">' + F(b.tEnd, 2) + ' s</td></tr></tbody></table>' +
        '<p class="bt-small">Each wheel: hub I<sub>hub</sub> = ' + F(RA.I0, 4) + ' kg·m², hub radius ' + F(RA.r, 3) + ' m, two ' + F(RA.ms, 2) + ' kg sliders; each weight ' + F(RA.m, 2) + ' kg. g = 9.8 m/s². Axle friction neglected.</p>';
    }
    function setScene(sc){
      if(sc === scene) return;
      stop(); scene = sc;
      dock.querySelectorAll('[data-sc]').forEach(function(b){ var on = b.getAttribute('data-sc') === sc; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      dock.querySelector('.tb-beam-ctl').hidden = sc !== 'beam'; raceCtl.hidden = sc !== 'race';
      det.querySelector('.tb-beam-set').hidden = sc !== 'beam';
      det.querySelector('.tb-nums-h').textContent = sc === 'beam' ? 'The torques about the fulcrum' : 'The two wheels';
      if(sc === 'beam'){ holdLevel(); build(); draw(); } else { rt = 0; rdone = false; zoomFor(); drawRace(); }
      T.event('apphys-tool-scene', { tool: 'torque-balance', scene: sc });
    }

    build(); draw();
    if(window.ResizeObserver){ var lastZ = Z; new ResizeObserver(function(){ var z0 = Z; zoomFor(); if(Z !== lastZ){ lastZ = Z; if(scene === 'beam'){ build(); draw(); } else drawRace(); } else Z = z0; }).observe(sceneEl); }
    return {
      stop: stop,
      studio: function(pane, studio){
        s = studio;
        var o = { mode: 'explore' };
        s.add('stage', stage, o);
        s.add('dock', dock, o);
        var w = document.createElement('div'); w.className = 'ls-sec phys-ls-why';
        w.appendChild(cue.el); w.appendChild(why);
        s.add('why', w, o);
        var d = document.createElement('div'); d.className = 'ls-sec'; d.appendChild(det);
        s.add('details', d, o);
        why.querySelectorAll('details.bt-why').forEach(function(x){ x.open = true; });
        readout();
        if(s.mode() === 'explore') s.hint({ target: gMasses.querySelector('.tb-mass:last-child'), text: 'Drag me along the stick' });
      }
    };
  }

  /* ------------------------------------------------------------ quiz */
  function figure(p){
    var f = p.fig, id = nid('tbq'), W = 520, out = '', label = '', H = 240;
    if(f.kind === 'lever'){
      H = 220;
      var px0 = 90, py = 120, ppm = f.obj === 'door' ? 380 : f.obj === 'stick' ? 420 : 900, len = Math.min(380, f.r * ppm + 70), ax = px0 + f.r * ppm;
      if(f.obj === 'wrench'){
        out += '<polygon points="' + [0, 60, 120, 180, 240, 300].map(function(a){ return n1(px0 + 22 * Math.cos(M.rad(a))) + ',' + n1(py + 22 * Math.sin(M.rad(a))); }).join(' ') + '" fill="url(#' + id + 'm)" class="tb-metal"/>' +
          '<path class="tb-metal" fill="url(#' + id + 'm)" d="M' + (px0 + 18) + ' ' + (py - 11) + 'L' + n1(px0 + len) + ' ' + (py - 9) + 'a9 9 0 0 1 0 18L' + (px0 + 18) + ' ' + (py + 11) + 'Z"/><circle cx="' + px0 + '" cy="' + py + '" r="5" fill="#2E3438"/>';
      } else if(f.obj === 'door'){
        out += '<rect x="20" y="' + (py - 60) + '" width="' + (px0 - 30) + '" height="120" fill="var(--track)"/><rect class="tb-wood" x="' + px0 + '" y="' + (py - 8) + '" width="' + n1(len) + '" height="16" rx="2" fill="url(#' + id + 'w)"/>' +
          '<circle cx="' + px0 + '" cy="' + py + '" r="8" fill="url(#' + id + 'r)" class="tb-metal"/>' + '<text class="tb-hint" x="24" y="' + (py - 66) + '">wall</text>';
      } else {
        out += '<rect class="tb-wood" x="' + (px0 - 10) + '" y="' + (py - 8) + '" width="' + n1(len + 10) + '" height="16" rx="2" fill="url(#' + id + 'w)"/><circle cx="' + px0 + '" cy="' + py + '" r="6" fill="url(#' + id + 'r)" class="tb-metal"/><circle cx="' + px0 + '" cy="' + py + '" r="2" fill="#2E3438"/>';
      }
      var a = M.rad(f.ang), L = 92, dx = Math.cos(a) * L, dy = -Math.sin(a) * L;
      out += '<path class="tb-angle" d="M' + n1(ax + 34) + ' ' + py + 'A34 34 0 0 ' + (f.up ? 0 : 1) + ' ' + n1(ax + 34 * Math.cos(a)) + ' ' + n1(py - 34 * Math.sin(a)) + '"/>' +
        '<text class="tb-angle-t" x="' + n1(ax + 46 * Math.cos(a / 2)) + '" y="' + n1(py - 46 * Math.sin(a / 2) + 5) + '">' + f.th + '°</text>' +
        '<line class="tb-loa" x1="' + ax + '" y1="' + py + '" x2="' + n1(ax + 60) + '" y2="' + py + '" stroke-dasharray="3 4"/>' +
        S.arrow(ax, py, dx, dy, { cls: 'f-applied', label: 'F = ' + gv(f.F) + ' N', width: 3.5, head: 12 }) +
        '<circle cx="' + n1(ax) + '" cy="' + py + '" r="4" fill="var(--ink)"/>' +
        '<g class="tb-dim"><line x1="' + px0 + '" x2="' + n1(ax) + '" y1="' + (py + (f.up ? 40 : -40)) + '" y2="' + (py + (f.up ? 40 : -40)) + '" stroke="var(--ink)" stroke-width="1.3"/>' +
        '<line x1="' + px0 + '" x2="' + px0 + '" y1="' + (py + (f.up ? 33 : -47)) + '" y2="' + (py + (f.up ? 47 : -33)) + '" stroke="var(--ink)" stroke-width="1.3"/><line x1="' + n1(ax) + '" x2="' + n1(ax) + '" y1="' + (py + (f.up ? 33 : -47)) + '" y2="' + (py + (f.up ? 47 : -33)) + '" stroke="var(--ink)" stroke-width="1.3"/>' +
        '<text class="tb-angle-t" x="' + n1((px0 + ax) / 2) + '" y="' + (py + (f.up ? 60 : -48)) + '" text-anchor="middle">r = ' + gv(f.r) + ' m</text></g>';
      label = 'Top or side view of ' + (f.obj === 'door' ? 'a door on its hinge' : f.obj === 'wrench' ? 'a wrench on a bolt' : 'a stick on a pin') + ': a ' + gv(f.F) + ' N force at ' + f.th + ' degrees to it, ' + gv(f.r) + ' m from the pivot, pointing ' + (f.up ? 'up' : 'down') + ' and outward.';
    } else if(f.kind === 'stick'){
      H = 230; var x0 = 30, pp = 440, y = 100, bench = 200;
      out += benchArt(W, bench) + standArt(id, x0 + f.pivot * pp, y, bench) + stickArt(id, x0, y, pp, 1, 14) + clampArt(id, x0 + f.pivot * pp, y, 14) +
        f.masses.map(function(q){ return hookArt(id, x0 + q.x * pp, y, 14) + massArt(id, x0 + q.x * pp, y + 7, q.m, gv(q.m) + ' kg'); }).join('') +
        '<g opacity=".9"><rect class="tb-ghost" x="' + (W - 92) + '" y="18" width="62" height="34" rx="5"/><text class="tb-angle-t" x="' + (W - 61) + '" y="40" text-anchor="middle">' + gv(f.ghost.m) + ' kg</text><text class="tb-hint" x="' + (W - 100) + '" y="40" text-anchor="end">where?</text></g>';
      label = 'A meter stick on a fulcrum at the ' + Math.round(f.pivot * 100) + ' cm mark with a ' + gv(f.masses[0].m) + ' kg mass hanging at ' + Math.round(f.masses[0].x * 100) + ' cm; a ' + gv(f.ghost.m) + ' kg mass is still to be placed.';
    } else if(f.kind === 'plank'){
      H = 230; var lx = 50, pw = W - 100, sc = pw / f.L, yp = 140, bench2 = 206, xx = lx + f.x * sc;
      out += benchArt(W, bench2) + [lx, lx + pw].map(function(sx){ return '<path class="tb-metal" fill="url(#' + id + 'm)" d="M' + (sx - 22) + ' ' + bench2 + 'L' + (sx - 8) + ' ' + (yp + 8) + 'L' + (sx + 8) + ' ' + (yp + 8) + 'L' + (sx + 22) + ' ' + bench2 + 'Z"/>'; }).join('') +
        '<rect class="tb-wood" x="' + (lx - 12) + '" y="' + (yp - 8) + '" width="' + (pw + 24) + '" height="16" rx="2" fill="url(#' + id + 'w)"/>';
      if(f.who === 'A crate') out += '<rect x="' + n1(xx - 30) + '" y="' + (yp - 62) + '" width="60" height="54" rx="3" fill="url(#' + id + 'w)" class="tb-wood"/><path d="M' + n1(xx - 30) + ' ' + (yp - 62) + 'l60 54M' + n1(xx + 30) + ' ' + (yp - 62) + 'l-60 54" stroke="var(--tb-wood-ink)" stroke-width="1.5" opacity=".5"/>';
      else out += '<g fill="var(--phys-s1)"><circle cx="' + n1(xx) + '" cy="' + (yp - 84) + '" r="11"/><rect x="' + n1(xx - 13) + '" y="' + (yp - 70) + '" width="26" height="34" rx="9"/><rect x="' + n1(xx - 12) + '" y="' + (yp - 40) + '" width="10" height="32" rx="4"/><rect x="' + n1(xx + 2) + '" y="' + (yp - 40) + '" width="10" height="32" rx="4"/></g>';
      out += '<line x1="' + lx + '" x2="' + n1(xx) + '" y1="' + (yp + 24) + '" y2="' + (yp + 24) + '" stroke="var(--ink)" stroke-width="1.3"/><text class="tb-angle-t" x="' + n1((lx + xx) / 2) + '" y="' + (yp + 40) + '" text-anchor="middle">' + gv(f.x) + ' m</text>' +
        '<text class="tb-angle-t" x="' + (W / 2) + '" y="24" text-anchor="middle">L = ' + gv(f.L) + ' m, plank ' + gv(f.mb) + ' kg, load ' + gv(f.m) + ' kg</text>';
      label = 'A plank ' + gv(f.L) + ' m long on a support under each end, with ' + f.who.toLowerCase() + ' ' + gv(f.x) + ' m from the left end.';
    } else if(f.kind === 'rod'){
      H = 200; var cx = W / 2, cy = 90, ps = 420;
      out += '<rect class="tb-metal" x="' + (cx - 5) + '" y="' + cy + '" width="10" height="90" fill="url(#' + id + 'm)"/><rect class="tb-metal" x="' + (cx - 50) + '" y="178" width="100" height="10" rx="3" fill="url(#' + id + 'm)"/>' +
        '<rect x="' + n1(cx - 0.55 * ps) + '" y="' + (cy - 3) + '" width="' + n1(1.1 * ps) + '" height="6" rx="3" fill="var(--muted)"/>' +
        [[-f.r1, f.m1], [f.r2, f.m2]].map(function(b){ var rr = 9 + 7 * Math.sqrt(b[1]); return '<circle cx="' + n1(cx + b[0] * ps) + '" cy="' + cy + '" r="' + n1(rr) + '" fill="url(#' + id + 'r)" class="tb-metal"/><text class="tb-angle-t" x="' + n1(cx + b[0] * ps) + '" y="' + n1(cy - rr - 8) + '" text-anchor="middle">' + gv(b[1]) + ' kg</text>' +
          '<line x1="' + cx + '" x2="' + n1(cx + b[0] * ps) + '" y1="' + (cy + 34) + '" y2="' + (cy + 34) + '" stroke="var(--ink)" stroke-width="1.3"/><text class="tb-angle-t" x="' + n1(cx + b[0] * ps / 2) + '" y="' + (cy + 52) + '" text-anchor="middle">' + gv(Math.abs(b[0])) + ' m</text>'; }).join('') +
        '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="url(#' + id + 'r)" class="tb-metal"/><circle cx="' + cx + '" cy="' + cy + '" r="2.5" fill="#2E3438"/>';
      label = 'A light rod on a central pivot, held level: ' + gv(f.m1) + ' kg at ' + gv(f.r1) + ' m to the left and ' + gv(f.m2) + ' kg at ' + gv(f.r2) + ' m to the right.';
    } else {
      H = 210; var ps2 = 320;
      [['A', f.dA, W * 0.27], ['B', f.dB, W * 0.73]].forEach(function(w){
        var cx2 = w[2], cy2 = 70, dd = w[1] * ps2;
        out += '<rect class="tb-metal" x="' + n1(cx2 - 0.27 * ps2) + '" y="' + (cy2 - 3) + '" width="' + n1(0.54 * ps2) + '" height="6" rx="3" fill="url(#' + id + 'm)"/>' +
          [-1, 1].map(function(sg){ return '<rect x="' + n1(cx2 + sg * dd - 9) + '" y="' + (cy2 - 11) + '" width="18" height="22" rx="4" fill="url(#' + id + 'b)" stroke="#6B4E12" stroke-width="1.2"/>'; }).join('') +
          '<circle cx="' + cx2 + '" cy="' + cy2 + '" r="13" fill="url(#' + id + 'r)" class="tb-metal"/><line class="tb-string" x1="' + (cx2 + 13) + '" y1="' + cy2 + '" x2="' + (cx2 + 13) + '" y2="150"/>' + massArt(id, cx2 + 13, 132, 0.2, '0.20 kg') +
          '<text class="tb-angle-t" x="' + cx2 + '" y="' + (cy2 - 30) + '" text-anchor="middle">Wheel ' + w[0] + ': sliders ' + gv(w[1]) + ' m out</text>';
      });
      label = 'Two race wheels: A with its sliders ' + gv(f.dA) + ' m from the axle, B with them ' + gv(f.dB) + ' m out; a weight hangs from a string on each hub.';
    }
    return '<figure class="cd-fig tb-fig"><svg viewBox="0 0 ' + W + ' ' + H + '" class="phys-scene" role="img" aria-label="' + esc(label) + '">' + defs(id) + out + '</svg></figure>';
  }
  function quiz(pane, data){
    T.drill(pane, data, {
      slug: 'torque-balance', generate: TB.generate,
      types: [{ value: 'torque', label: 'Torque with an angle' }, { value: 'balance', label: 'Where to hang a mass' }, { value: 'support', label: 'Support forces' }, { value: 'alpha', label: 'Angular acceleration' }, { value: 'inertia', label: 'Rotational inertia race' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { torque: 'Torque with an angle', balance: 'Balance the stick', support: 'Two supports', alpha: 'Released from rest', inertia: 'Rotational inertia race' }[p.type]; },
      extra: function(host, p){ host.innerHTML = figure(p); }
    });
  }
})();
