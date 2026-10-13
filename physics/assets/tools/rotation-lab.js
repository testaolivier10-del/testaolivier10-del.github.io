/* Rotation lab (Unit 6 trainer; docs/apphys-spec.md section 6). OWNED BY THIS
   TOOL ONLY. Model: ApPhysMath.rotationLab (tools/math/rotation-lab.js).

   Explore has three scenes:
   - Rolling race: up to four racers (hoop, solid disk, solid sphere, a block
     that slides without friction) on parallel lanes of one ramp; each rolls
     without slipping (its mark turns by s / r) with a = g sin θ / (1 + β),
     and its bar splits m g h into K_trans, K_rot and the U still left.
   - Spinning stool, seen from above: drag a dumbbell (or the slider) to pull
     the arms in; L = I ω stays fixed, ω and K rise. Bars compare I, ω, L
     and K with the arms-out values.
   - Orbit: a satellite launched sideways at k × the circular speed; velocity
     Verlet keeps E and L; live K, U, E columns, speed and distance, the
     velocity and gravitational-force arrows to scale.
   Test yourself: ApPhysTools.drill over the model's five problem kinds. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath, S = window.ApPhysScene;
  if(!T || !M || !M.rotationLab || !S) return;
  var RL = M.rotationLab, esc = T.esc, F = T.F, G = M.C.g, SH = RL.roll.SHAPES;
  var uid = 0;
  function nid(p){ return (p || 'rl') + (++uid); }
  function n1(x){ return Math.round(x * 10) / 10; }
  function gv(x){ return M.fmt(x, Number(Number(x).toPrecision(2)) === x ? 2 : 3); }

  (function(){ var me = document.currentScript, href = me && me.src ? me.src.replace(/\.js(\?.*)?$/, '.css') : '';
    if(href && !document.querySelector('link[href$="tools/rotation-lab.css"]')){ var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); } })();
  var appEl = document.getElementById('app');
  if(appEl) appEl.setAttribute('data-details-title', 'Settings & numbers');

  T.mount('rotation-lab', function(app, data){
    document.body.classList.add('rl-root');
    var ex = null;
    T.modes(app, { slug: 'rotation-lab', explore: function(pane){ ex = explore(pane, data); },
      quiz: function(pane){ quiz(pane, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------------ art */
  function defs(id){
    return '<defs>' +
      '<linearGradient id="' + id + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="rl-w1"/><stop offset="1" class="rl-w2"/></linearGradient>' +
      '<linearGradient id="' + id + 'm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="rl-m1"/><stop offset="1" class="rl-m2"/></linearGradient>' +
      '<radialGradient id="' + id + 'b" cx=".35" cy=".32" r=".75"><stop offset="0" class="rl-b1"/><stop offset="1" class="rl-b2"/></radialGradient>' +
      '<radialGradient id="' + id + 'd" cx=".4" cy=".35" r=".8"><stop offset="0" class="rl-d1"/><stop offset="1" class="rl-d2"/></radialGradient>' +
      '<radialGradient id="' + id + 'e" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#7EC3F2"/><stop offset=".6" stop-color="#2E78BF"/><stop offset="1" stop-color="#173F73"/></radialGradient>' +
      '</defs>';
  }
  /* One racer at (x, y) (its center), radius R px, turned by ang (rad, clockwise
     positive on screen), on a slope of th (deg). */
  function racerArt(id, sh, x, y, R, ang, th){
    var c = Math.cos(ang), s = Math.sin(ang), d = M.deg(ang);
    if(sh === 'block'){
      var w = R * 2.2, h = R * 1.5;
      return '<g transform="translate(' + n1(x) + ' ' + n1(y) + ') rotate(' + n1(th) + ')"><rect class="rl-metal" x="' + n1(-w / 2) + '" y="' + n1(R - h) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="3" fill="url(#' + id + 'm)"/><path d="M' + n1(-w / 2 + 4) + ' ' + n1(R - h + 4) + 'h' + n1(w - 8) + '" stroke="#fff" stroke-width="2" opacity=".5"/></g>';
    }
    if(sh === 'hoop') return '<circle class="rl-hoop" cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + n1(R - 2.5) + '" stroke-width="5"/>' +
      '<circle class="rl-mark" cx="' + n1(x + (R - 2.5) * s) + '" cy="' + n1(y - (R - 2.5) * c) + '" r="3.6"/>' +
      '<line class="rl-markl" x1="' + n1(x) + '" y1="' + n1(y) + '" x2="' + n1(x + (R - 5) * s) + '" y2="' + n1(y - (R - 5) * c) + '" stroke-width="1.2" opacity=".5"/>';
    if(sh === 'disk') return '<g transform="rotate(' + n1(d) + ' ' + n1(x) + ' ' + n1(y) + ')"><circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + n1(R) + '" fill="url(#' + id + 'd)" stroke="#7A3A0E" stroke-width="1.2"/>' +
      '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + n1(R * 0.18) + '" fill="#7A3A0E"/><line class="rl-markl" x1="' + n1(x) + '" y1="' + n1(y) + '" x2="' + n1(x) + '" y2="' + n1(y - R + 2) + '" stroke="#fff"/></g>';
    return '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + n1(R) + '" fill="url(#' + id + 'b)" stroke="#123A5E" stroke-width="1.2"/>' +
      '<g transform="rotate(' + n1(d) + ' ' + n1(x) + ' ' + n1(y) + ')"><path d="M' + n1(x - R * 0.96) + ' ' + n1(y) + 'Q' + n1(x) + ' ' + n1(y + R * 0.5) + ' ' + n1(x + R * 0.96) + ' ' + n1(y) + '" fill="none" stroke="#fff" stroke-width="2" opacity=".75"/><circle class="rl-mark" cx="' + n1(x) + '" cy="' + n1(y - R * 0.62) + '" r="3.4"/></g>';
  }
  var SHORT = { hoop: 'Hoop', disk: 'Disk', sphere: 'Sphere', block: 'Block' };

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var s = null, scene = 'roll', say = T.announcer(document.createElement('p')), did = nid('rld');
    host.innerHTML = '';
    var stage = document.createElement('div'); stage.className = 'rl-stage';
    var sceneEl = document.createElement('div'); sceneEl.className = 'rl-scene';
    var panel = document.createElement('div'); panel.className = 'rl-panel';
    stage.appendChild(sceneEl); stage.appendChild(panel);
    var cue = T.cue('Pick who races, then press Race. Watch where each one\'s energy goes.');
    var dock = document.createElement('div'); dock.className = 'rl-dock';
    dock.innerHTML = '<div class="tseg rl-scenes" role="group" aria-label="Scene"><button type="button" data-sc="roll" class="on" aria-pressed="true">Rolling race</button><button type="button" data-sc="stool" aria-pressed="false">Spinning stool</button><button type="button" data-sc="orbit" aria-pressed="false">Orbit</button></div>' +
      '<div class="rl-ctl" data-for="roll"></div><div class="rl-ctl" data-for="stool" hidden></div><div class="rl-ctl" data-for="orbit" hidden></div>';
    var why = document.createElement('div');
    var det = document.createElement('div'); det.className = 'rl-det';
    det.innerHTML = '<div class="rl-set" data-for="roll"></div><div class="rl-set" data-for="stool" hidden></div><div class="rl-set" data-for="orbit" hidden></div><h3 class="ls-title-l rl-nums-h">The numbers</h3><div class="rl-nums"></div>';
    host.appendChild(cue.el); host.appendChild(stage); host.appendChild(dock); host.appendChild(why); host.appendChild(det);
    function ctl(sc){ return dock.querySelector('.rl-ctl[data-for="' + sc + '"]'); }
    function setEl(sc){ return det.querySelector('.rl-set[data-for="' + sc + '"]'); }
    function nums(html){ det.querySelector('.rl-nums').innerHTML = html; }
    function caption(head, pillsL, pillsR){
      T.explain(why, head.h, head.b);
      if(s){ s.caption(head.h, 'explore'); s.pills(pillsL || [], 'left', 'explore'); s.pills(pillsR || [], 'right', 'explore'); }
    }
    function narrow(){ return (sceneEl.clientWidth || 600) < 520; }

    /* ======================== scene 1: the rolling race */
    var R0 = { len: 1.6, theta: 25, m: 1, r: 0.05 }, lineup = ['hoop', 'disk', 'sphere'], rt = 0, rdone = false, slow = true;
    var rc = ctl('roll');
    rc.innerHTML = '<div class="rl-chips" role="group" aria-label="Racers">' + ['hoop', 'disk', 'sphere', 'block'].map(function(k){ return '<button type="button" class="bt-btn" data-r="' + k + '" aria-pressed="' + (lineup.indexOf(k) > -1) + '">' + SHORT[k] + '</button>'; }).join('') + '</div>' +
      '<div class="rl-row ls-act"><button type="button" class="ls-btn ls-pri rl-go">Race</button><button type="button" class="ls-btn rl-reset">Reset</button></div>';
    var thS = T.slider({ label: 'Ramp angle', min: 10, max: 40, step: 1, value: R0.theta, unit: '°', decimals: 0, onInput: function(v){ R0.theta = v; rollReset(); } });
    setEl('roll').appendChild(thS.el);
    setEl('roll').insertAdjacentHTML('beforeend', '<label class="rl-check"><input type="checkbox" class="rl-slow" checked> <span>Slow motion (half speed; the times shown are real)</span></label>' +
      '<p class="bt-small">Every racer has mass ' + gv(R0.m) + ' kg; the round ones have radius ' + gv(R0.r) + ' m. Ramp length ' + gv(R0.len) + ' m. I = β m r²: hoop β = 1, solid disk ½, solid sphere ⅖ (given, not memorized). The block slides without friction (β = 0, nothing turns).</p>');
    setEl('roll').querySelector('.rl-slow').addEventListener('change', function(e){ slow = e.target.checked; });
    rc.querySelectorAll('[data-r]').forEach(function(b){ b.addEventListener('click', function(){
      var k = b.getAttribute('data-r'), on = lineup.indexOf(k) > -1;
      if(on && lineup.length <= 2){ say('A race needs at least two racers.', true); return; }
      lineup = on ? lineup.filter(function(x){ return x !== k; }) : lineup.concat([k]);
      lineup.sort(function(a, b2){ return ['hoop', 'disk', 'sphere', 'block'].indexOf(a) - ['hoop', 'disk', 'sphere', 'block'].indexOf(b2); });
      b.setAttribute('aria-pressed', String(!on)); cue.done(); rollReset();
    }); });
    var goR = rc.querySelector('.rl-go');
    goR.addEventListener('click', function(){ if(rdone) rollReset(); cue.done(); rloop.reset(); rloop.start(); goR.disabled = true; });
    rc.querySelector('.rl-reset').addEventListener('click', rollReset);
    var rloop = S.loop(function(dt){
      rt += slow ? dt / 2 : dt;
      var all = lineup.every(function(k){ return RL.roll.at(k, rt, R0).done; });
      drawRoll(); if(all){ rdone = true; goR.disabled = false; drawRoll(); announceRoll(); return false; }
    }, { still: function(){ rt = Math.max.apply(null, lineup.map(function(k){ return RL.roll.at(k, 0, R0).tEnd; })); rdone = true; goR.disabled = false; drawRoll(); announceRoll(); } });
    function rollReset(){ rloop.stop(); rt = 0; rdone = false; goR.disabled = false; drawRoll(); }
    function order(){ return lineup.slice().sort(function(a, b){ return SH[a].beta - SH[b].beta; }); }
    function announceRoll(){ say('Finish order: ' + order().map(function(k){ return SHORT[k] + ' in ' + F(RL.roll.at(k, 0, R0).tEnd, 2) + ' seconds'; }).join(', then ') + '.', true); }
    function drawRoll(){
      if(scene !== 'roll') return;
      var nar = narrow(), W = nar ? 340 : 640, th = M.rad(R0.theta), ppm = (nar ? 160 : 330) * Math.min(1, Math.cos(M.rad(25)) / Math.cos(th)), rpx = R0.r * ppm * (nar ? 1.6 : 1);
      var gap = nar ? 30 : 48, n = lineup.length, run = R0.len * Math.cos(th) * ppm, drop = R0.len * Math.sin(th) * ppm;
      var x0 = nar ? 58 : 70, y0 = nar ? 34 : 46, H = Math.ceil(y0 + drop + (n - 1) * gap + (nar ? 24 : 70)), xEnd = x0 + run;
      var out = '<rect class="rl-floor" x="0" y="' + n1(H - 22) + '" width="' + W + '" height="22"/><rect class="rl-floor2" x="0" y="' + n1(H - 6) + '" width="' + W + '" height="6"/>';
      // The ramp: one wooden block carrying a lane per racer.
      var topY = y0, botY = y0 + drop + (n - 1) * gap;
      out += '<path class="rl-wood" fill="url(#' + did + 'w)" d="M' + x0 + ' ' + n1(topY + 2) + 'L' + n1(xEnd) + ' ' + n1(topY + drop + 2) + 'L' + n1(xEnd) + ' ' + n1(H - 22) + 'L' + x0 + ' ' + n1(H - 22) + 'Z" opacity=".35"/>';
      lineup.forEach(function(k, i){
        var ly = y0 + i * gap;
        out += '<path class="rl-wood" fill="url(#' + did + 'w)" d="M' + (x0 - 8) + ' ' + n1(ly) + 'L' + n1(xEnd) + ' ' + n1(ly + drop) + 'l0 7L' + (x0 - 8) + ' ' + n1(ly + 7) + 'Z"/>' +
          '<text class="rl-t" x="' + (x0 - 14) + '" y="' + n1(ly + 4) + '" text-anchor="end"' + (nar ? ' font-size="15"' : '') + '>' + SHORT[k] + '</text>';
      });
      out += '<line class="rl-fin" x1="' + n1(xEnd) + '" x2="' + n1(xEnd) + '" y1="' + (y0 - 30) + '" y2="' + n1(H - 22) + '"/><text class="rl-tm" x="' + n1(xEnd - 6) + '" y="' + (y0 - 34) + '" text-anchor="end"' + (nar ? ' font-size="15"' : '') + '>finish</text>';
      // Angle mark at the bottom lane's end.
      var bx = xEnd, by = y0 + (n - 1) * gap + drop + 3.5, ar = 44;
      out += '<path class="rl-ang" d="M' + n1(bx - ar) + ' ' + n1(by) + 'A' + ar + ' ' + ar + ' 0 0 1 ' + n1(bx - ar * Math.cos(th)) + ' ' + n1(by - ar * Math.sin(th)) + '"/><line class="rl-dim" x1="' + n1(bx - ar - 30) + '" x2="' + n1(bx) + '" y1="' + n1(by) + '" y2="' + n1(by) + '" stroke-dasharray="3 4"/>' +
        '<text class="rl-t" x="' + n1(bx - ar - 8) + '" y="' + n1(by - 8) + '" text-anchor="end"' + (nar ? ' font-size="15"' : '') + '>' + R0.theta + '°</text>';
      // Height dimension at the right.
      out += '<g><line class="rl-dim" x1="' + n1(xEnd + 22) + '" x2="' + n1(xEnd + 22) + '" y1="' + n1(y0) + '" y2="' + n1(y0 + drop) + '"/><path class="rl-dim" d="M' + n1(xEnd + 16) + ' ' + n1(y0) + 'h12M' + n1(xEnd + 16) + ' ' + n1(y0 + drop) + 'h12"/>' +
        '<text class="rl-tm" transform="translate(' + n1(xEnd + 38) + ' ' + n1(y0 + drop / 2) + ') rotate(90)" text-anchor="middle"' + (nar ? ' font-size="15"' : '') + '>h = ' + F(R0.len * Math.sin(th), 2) + ' m</text></g>';
      lineup.forEach(function(k, i){
        var st = RL.roll.at(k, rt, R0), ly = y0 + i * gap, sx = st.s * Math.cos(th) * ppm, sy = st.s * Math.sin(th) * ppm;
        var cx = x0 + 10 * Math.cos(th) + sx + rpx * Math.sin(th), cy = ly + 10 * Math.sin(th) + sy - rpx * Math.cos(th);
        out += racerArt(did, k, cx, cy, rpx, st.angle * R0.r * ppm / rpx, R0.theta);
        if(st.done && rt > 0 && !nar) out += '<text class="rl-t" x="' + n1(xEnd + (nar ? 8 : 52)) + '" y="' + n1(ly + drop - 2) + '"' + (nar ? ' font-size="15"' : '') + '>' + F(st.tEnd, 2) + ' s</text>';
      });
      sceneEl.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="phys-scene" role="img" aria-label="' + esc('A ramp at ' + R0.theta + ' degrees with ' + lineup.length + ' lanes: ' + lineup.map(function(k){ var st = RL.roll.at(k, rt, R0); return SHORT[k] + ' ' + (st.done && rt > 0 ? 'finished in ' + F(st.tEnd, 2) + ' s' : F(st.s, 2) + ' m down'); }).join(', ') + '.') + '">' + defs(did) + out + '</svg>';
      // Energy bars: K_trans, K_rot, and the U still to give up, as shares of m g h.
      panel.innerHTML = '<div class="rl-bars" role="img" aria-label="' + esc('Energy of each racer as a share of m g h: ' + lineup.map(function(k){ var st = RL.roll.at(k, rt, R0), tot = R0.m * G * R0.len * Math.sin(th); return SHORT[k] + ' translational ' + Math.round(st.K / tot * 100) + '%, rotational ' + Math.round(st.Krot / tot * 100) + '%'; }).join('; ') + '.') + '">' +
        lineup.map(function(k){ var st = RL.roll.at(k, rt, R0), tot = R0.m * G * R0.len * Math.sin(th);
          return '<div class="rl-brow"><span class="rl-bl">' + SHORT[k] + '</span><span class="rl-btrack"><i class="rl-kt" style="width:' + (st.K / tot * 100).toFixed(2) + '%"></i><i class="rl-kr" style="width:' + (st.Krot / tot * 100).toFixed(2) + '%"></i><i class="rl-u" style="width:' + (st.U / tot * 100).toFixed(2) + '%"></i></span><span class="rl-bv">' + (st.done && rt > 0 ? F(st.tEnd, 2) + ' s' : F(st.v, 2) + ' m/s') + '</span></div>'; }).join('') +
        '<p class="rl-key"><span><i class="rl-kt"></i><b>K<sub>trans</sub></b></span><span><i class="rl-kr"></i><b>K<sub>rot</sub></b></span><span><i class="rl-u"></i><b>U<sub>g</sub> still to go</b></span></p></div>';
      var o = order(), first = o[0], h = R0.len * Math.sin(th);
      var head = rdone ? { h: '<b>' + SHORT[first] + ' wins, ' + SHORT[o[o.length - 1]].toLowerCase() + ' is last.</b> The smaller β, the faster.' } : rt > 0 ? { h: '<b>Rolling…</b> same drop, different shapes.' } : { h: '<b>Same mass, same drop.</b> Who reaches the bottom first? Press Race.' };
      head.b = '<p>Each racer turns m g h = ' + F(R0.m * G * h, 2) + ' J of potential energy into kinetic energy. Rolling without slipping, v = r ω, so K = ½ m v² + ½ (β m r²)(v / r)² = ½ (1 + β) m v².</p>' +
        '<p>So v = √(2 g h / (1 + β)) at the bottom. Mass and radius cancel; only the shape, through β, matters. The orange part of each bar is the share β / (1 + β) that goes into spinning instead of speed: hoop ½, disk ⅓, sphere 2⁄7, block 0.</p>' +
        '<p>Static friction from the ramp makes the round ones roll. It does no work on them (the contact point is momentarily at rest), so mechanical energy is conserved for every racer.</p>';
      caption(head, [{ k: 't', html: F(rt, 2) + ' s', tone: 'readout' }], rdone ? [{ html: nar ? SHORT[first] + ' first' : o.map(function(k){ return SHORT[k]; }).join(' › '), tone: 'good' }] : []);
      nums('<table class="rl-tbl"><caption class="sr-only">Each racer</caption><thead><tr><th>Racer</th><th class="r">β</th><th class="r">a (m/s²)</th><th class="r">v at bottom</th><th class="r">Time</th></tr></thead><tbody>' +
        lineup.map(function(k){ var e = RL.roll.at(k, 99, R0); return '<tr><th scope="row">' + SH[k].name + '</th><td class="r">' + SH[k].beta + '</td><td class="r">' + F(e.a, 2) + '</td><td class="r">' + F(e.v, 2) + ' m/s</td><td class="r">' + F(e.tEnd, 2) + ' s</td></tr>'; }).join('') +
        '</tbody></table><p class="bt-small">h = ' + F(h, 3) + ' m, m g h = ' + F(R0.m * G * h, 2) + ' J. a = g sin θ / (1 + β). g = 9.8 m/s².</p>');
    }

    /* ======================== scene 2: the spinning stool */
    var SO = { I0: 1.8, m: 2.5, d0: 0.75, w0: 2.0 }, dNow = 0.75, ang = 0, spinning = false;
    var sc2 = ctl('stool');
    var dS = T.slider({ label: 'Dumbbells from the axis', min: 0.2, max: 0.75, step: 0.01, value: dNow, unit: 'm', decimals: 2, onInput: function(v){ dNow = v; cue.done(); drawStool(); } });
    sc2.appendChild(dS.el);
    sc2.insertAdjacentHTML('beforeend', '<div class="rl-row ls-act"><button type="button" class="ls-btn ls-pri rl-spin-go" aria-pressed="false">Spin</button><button type="button" class="ls-btn rl-stool-reset">Arms out</button></div>');
    setEl('stool').innerHTML = '<p class="bt-small">The student and stool: I₀ = ' + gv(SO.I0) + ' kg·m² about the axis. Each dumbbell ' + gv(SO.m) + ' kg, treated as a point. Started at ω = ' + gv(SO.w0) + ' rad/s with the dumbbells ' + gv(SO.d0) + ' m out. The stool\'s bearing has no friction, so no outside torque acts about the axis.</p>';
    var spinBtn = sc2.querySelector('.rl-spin-go');
    var sloop = S.loop(function(dt){ ang += RL.stool.omega(SO, dNow) * dt; drawStool(true); }, { still: function(){ ang = 0.6; drawStool(); } });
    spinBtn.addEventListener('click', function(){ spinning = !spinning; spinBtn.setAttribute('aria-pressed', String(spinning)); spinBtn.textContent = spinning ? 'Pause' : 'Spin'; if(spinning){ cue.done(); sloop.start(); } else sloop.stop(); });
    sc2.querySelector('.rl-stool-reset').addEventListener('click', function(){ dNow = SO.d0; dS.set(dNow); drawStool(); });
    var sbuilt = false;
    function stoolArt(cx, cy, ppm, d, a){
      var c = Math.cos(a), sn = Math.sin(a);
      function P(x, y){ return { x: cx + (x * c - y * sn) * ppm, y: cy + (x * sn + y * c) * ppm }; }
      function pt(p){ return n1(p.x) + ' ' + n1(p.y); }
      var out = '<circle cx="' + cx + '" cy="' + cy + '" r="' + n1(0.24 * ppm) + '" fill="url(#' + did + 'w)" class="rl-wood"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + n1(0.20 * ppm) + '" fill="none" class="rl-wood" opacity=".5"/>';
      // The hands hold the dumbbells at distance d from the axis; pulled in,
      // they come in front of the chest. Elbows bend outward (two-link arm).
      var hy = -Math.min(0.10 + 0.25 * (0.75 - d) / 0.55, 0.7 * d), hxa = Math.sqrt(Math.max(0, d * d - hy * hy)), L1 = 0.29, L2 = 0.27;
      [-1, 1].forEach(function(sg){
        var sx = sg * 0.19, sy = 0.02, hx = sg * hxa, dx = hx - sx, dy = hy - sy, D = Math.min(L1 + L2 - 1e-6, Math.sqrt(dx * dx + dy * dy));
        var a0 = Math.atan2(dy, dx), k = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D)))), ea = a0 + sg * k;
        var ex = sx + L1 * Math.cos(ea), ey = sy + L1 * Math.sin(ea);
        var S0 = P(sx, sy), E = P(ex, ey), H = P(hx, hy);
        out += '<path class="rl-arm" d="M' + pt(S0) + 'L' + pt(E) + '" stroke-width="' + n1(0.09 * ppm) + '" fill="none"/>' +
          '<path class="rl-fore" d="M' + pt(E) + 'L' + pt(H) + '" stroke-width="' + n1(0.075 * ppm) + '" fill="none"/>';
      });
      // shoulders and head
      out += '<ellipse class="rl-shirt" cx="' + cx + '" cy="' + cy + '" rx="' + n1(0.23 * ppm) + '" ry="' + n1(0.12 * ppm) + '" transform="rotate(' + n1(M.deg(a)) + ' ' + cx + ' ' + cy + ')"/>';
      var Hd = P(0, -0.01), N = P(0, -0.105);
      out += '<circle class="rl-hair" cx="' + n1(Hd.x) + '" cy="' + n1(Hd.y) + '" r="' + n1(0.095 * ppm) + '"/><ellipse class="rl-skin" cx="' + n1(N.x) + '" cy="' + n1(N.y) + '" rx="' + n1(0.025 * ppm) + '" ry="' + n1(0.02 * ppm) + '"/>';
      // dumbbells at the hands, with a drag handle
      [-1, 1].forEach(function(sg){
        var hx = sg * hxa, H = P(hx, hy), A1 = P(hx, hy - 0.07), A2 = P(hx, hy + 0.07), B1 = P(hx - 0.04, hy - 0.07), B2 = P(hx + 0.04, hy - 0.07), C1 = P(hx - 0.04, hy + 0.07), C2 = P(hx + 0.04, hy + 0.07);
        out += '<g class="rl-db rl-drag" data-sg="' + sg + '" tabindex="0" role="slider" aria-label="' + (sg < 0 ? 'Left' : 'Right') + ' dumbbell: drag it in or out" aria-valuemin="20" aria-valuemax="75" aria-valuenow="' + Math.round(d * 100) + '" aria-valuetext="' + F(d, 2) + ' meters from the axis">' +
          '<circle class="rl-hit" cx="' + n1(H.x) + '" cy="' + n1(H.y) + '" r="30"/><path class="rl-bellbar" d="M' + pt(A1) + 'L' + pt(A2) + '"/>' +
          '<path class="rl-bell" d="M' + pt(B1) + 'L' + pt(B2) + '" stroke="#3B4248" stroke-width="' + n1(0.05 * ppm) + '" stroke-linecap="round"/><path class="rl-bell" d="M' + pt(C1) + 'L' + pt(C2) + '" stroke="#3B4248" stroke-width="' + n1(0.05 * ppm) + '" stroke-linecap="round"/>' +
          '<circle cx="' + n1(H.x) + '" cy="' + n1(H.y) + '" r="' + n1(0.035 * ppm) + '" class="rl-skin"/></g>';
      });
      return out;
    }
    function drawStool(fast){
      if(scene !== 'stool') return;
      var nar = narrow(), W = nar ? 420 : 520, H = nar ? 420 : 440, cx = W / 2, cy = H / 2 + 10, ppm = nar ? 230 : 240;
      var I = RL.stool.I(SO, dNow), w = RL.stool.omega(SO, dNow), Ii = RL.stool.I(SO, SO.d0), L = Ii * SO.w0, K = 0.5 * I * w * w, Ki = 0.5 * Ii * SO.w0 * SO.w0;
      var rr = 0.86 * ppm, arc = '<path class="rl-spin" d="M' + n1(cx + rr) + ' ' + n1(cy) + 'A' + n1(rr) + ' ' + n1(rr) + ' 0 0 0 ' + n1(cx) + ' ' + n1(cy - rr) + '"/><path class="rl-spin-h" d="M' + n1(cx - 2) + ' ' + n1(cy - rr) + 'l12 -7l0 14z"/>' +
        (nar ? '' : '<text class="rl-t" x="' + n1(cx + rr * 0.78) + '" y="' + n1(cy - rr * 0.78) + '">ω = ' + F(w, 2) + ' rad/s</text>');
      var label = 'Top view of a student on a spinning stool holding two dumbbells ' + F(dNow, 2) + ' m from the axis, turning counterclockwise at ' + F(w, 2) + ' rad/s.';
      if(!sbuilt || !fast){
        var vb = nar ? n1(cx - 0.95 * ppm) + ' ' + n1(cy - 0.95 * ppm) + ' ' + n1(1.9 * ppm) + ' ' + n1(1.9 * ppm) : '0 0 ' + W + ' ' + H;
        sceneEl.innerHTML = '<svg viewBox="' + vb + '" class="phys-scene rl-stool" role="group" aria-label="Spinning stool scene">' + defs(did) +
          '<title>' + esc(label) + '</title><circle class="rl-ghost" cx="' + cx + '" cy="' + cy + '" r="' + n1(SO.d0 * ppm) + '"/><circle class="rl-ghost" cx="' + cx + '" cy="' + cy + '" r="' + n1(dNow * ppm) + '" style="stroke:var(--cink)"/><g class="rl-arc">' + arc + '</g><g class="rl-body"></g></svg>';
        sbuilt = true;
        var svg = sceneEl.querySelector('svg');
        svg.addEventListener('pointerdown', function(e){
          var g = e.target.closest('.rl-db'); if(!g) return;
          e.preventDefault(); cue.done();
          function mv(ev){ var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; var p = pt.matrixTransform(svg.getScreenCTM().inverse());
            var r = Math.sqrt(Math.pow(p.x - cx, 2) + Math.pow(p.y - cy, 2)) / ppm; dNow = Math.max(0.2, Math.min(0.75, Math.round(r * 100) / 100)); dS.set(dNow); drawStool(true); }
          function up(){ window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); drawStool(); }
          window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
        });
        svg.addEventListener('keydown', function(e){
          if(!e.target.closest('.rl-db')) return;
          var d = { ArrowLeft: -0.01, ArrowDown: -0.01, ArrowRight: 0.01, ArrowUp: 0.01, PageDown: -0.1, PageUp: 0.1 }[e.key];
          if(d == null) return;
          e.preventDefault(); var sg = e.target.closest('.rl-db').getAttribute('data-sg');
          dNow = Math.max(0.2, Math.min(0.75, Math.round((dNow + d) * 100) / 100)); dS.set(dNow); drawStool();
          var n = sceneEl.querySelector('.rl-db[data-sg="' + sg + '"]'); if(n) n.focus();
        });
      } else {
        sceneEl.querySelector('title').textContent = label;
        sceneEl.querySelector('.rl-arc').innerHTML = arc;
        var gh = sceneEl.querySelectorAll('.rl-ghost')[1]; if(gh) gh.setAttribute('r', n1(dNow * ppm));
      }
      var foc = document.activeElement && document.activeElement.closest ? document.activeElement.closest('.rl-db') : null, fsg = foc ? foc.getAttribute('data-sg') : null;
      sceneEl.querySelector('.rl-body').innerHTML = stoolArt(cx, cy, ppm, dNow, -ang);
      if(fsg){ var nf = sceneEl.querySelector('.rl-db[data-sg="' + fsg + '"]'); if(nf) nf.focus(); }
      if(fast) return;
      // Bars: each quantity against its arms-out value.
      var rows = [['I', I / Ii, F(I, 2) + ' kg·m²'], ['ω', w / SO.w0, F(w, 2) + ' rad/s'], ['L = Iω', 1, F(L, 2) + ' kg·m²/s'], ['K = ½Iω²', K / Ki, F(K, 1) + ' J']], mx = 3.2;
      panel.innerHTML = '<div class="rl-bars" role="img" aria-label="' + esc('Compared with arms out: I times ' + F(I / Ii, 2) + ', omega times ' + F(w / SO.w0, 2) + ', L unchanged, K times ' + F(K / Ki, 2) + '.') + '">' +
        rows.map(function(r){ return '<div class="rl-brow"><span class="rl-bl">' + r[0] + '</span><span class="rl-btrack"><i class="' + (r[0] === 'L = Iω' ? 'rl-u" style="opacity:1;background:var(--phys-s4);' : r[0] === 'I' ? 'rl-kt" style="' : 'rl-kr" style="') + 'width:' + Math.min(100, r[1] / mx * 100).toFixed(2) + '%"></i></span><span class="rl-bv">× ' + F(r[1], 2) + '</span></div>'; }).join('') +
        '<p class="rl-key"><span>Each bar compares with arms out (× 1.00)</span></p></div>';
      var head = Math.abs(dNow - SO.d0) < 1e-9 ? { h: '<b>Arms out.</b> Drag a dumbbell inward and watch ω.' } : { h: '<b>Arms in to ' + F(dNow, 2) + ' m:</b> I × ' + F(I / Ii, 2) + ', so ω × ' + F(w / SO.w0, 2) + '. L is unchanged.' };
      head.b = '<p>The stool turns freely, so nothing outside the system exerts a torque about the axis: angular momentum L = I ω is conserved.</p>' +
        '<p>I = I₀ + 2 m d² = ' + F(SO.I0, 2) + ' + 2 × ' + F(SO.m, 1) + ' × ' + F(dNow, 2) + '² = ' + F(I, 3) + ' kg·m². ω = L / I = ' + F(L, 3) + ' / ' + F(I, 3) + ' = ' + F(w, 3) + ' rad/s.</p>' +
        '<p>Kinetic energy is not conserved: K = ½ I ω² = L² / 2I rises from ' + F(Ki, 2) + ' J to ' + F(K, 2) + ' J as I falls. The extra comes from the student\'s arms, which do work pulling the dumbbells inward. Letting them back out returns K to where it was.</p>';
      caption(head, [{ k: 'ω', html: F(w, 2) + ' rad/s', tone: 'readout' }], [{ html: nar ? 'L constant' : 'L = ' + F(L, 2) + ' kg·m²/s, constant', tone: 'ghost' }]);
      nums('<table class="rl-tbl"><caption class="sr-only">Arms out against now</caption><thead><tr><th></th><th class="r">Arms out</th><th class="r">Now</th></tr></thead><tbody>' +
        '<tr><th scope="row">d</th><td class="r">' + F(SO.d0, 2) + ' m</td><td class="r">' + F(dNow, 2) + ' m</td></tr>' +
        '<tr><th scope="row">I</th><td class="r">' + F(Ii, 3) + ' kg·m²</td><td class="r">' + F(I, 3) + ' kg·m²</td></tr>' +
        '<tr><th scope="row">ω</th><td class="r">' + F(SO.w0, 2) + ' rad/s</td><td class="r">' + F(w, 2) + ' rad/s</td></tr>' +
        '<tr><th scope="row">L = I ω</th><td class="r">' + F(L, 3) + '</td><td class="r">' + F(I * w, 3) + '</td></tr>' +
        '<tr class="hl"><th scope="row">K = ½ I ω²</th><td class="r">' + F(Ki, 2) + ' J</td><td class="r">' + F(K, 2) + ' J</td></tr></tbody></table>');
    }

    /* ======================== scene 3: the orbit */
    var GM = 3.986e14, RE = 6.371e6, R0o = 1.0e7, mSat = 1000, kO = 1.0, os = null, otrail = [], orun = false, otime = 0, WARP = 1500;
    var oc = ctl('orbit');
    var kS = T.slider({ label: 'Launch speed (× the circular speed)', min: 0.9, max: 1.2, step: 0.01, value: kO, unit: '×', decimals: 2, onInput: function(v){ kO = v; cue.done(); orbitReset(); } });
    oc.appendChild(kS.el);
    oc.insertAdjacentHTML('beforeend', '<div class="rl-row ls-act"><button type="button" class="ls-btn ls-pri rl-o-go" aria-pressed="false">Launch</button><button type="button" class="ls-btn rl-o-reset">Reset</button></div>');
    setEl('orbit').innerHTML = '<p class="bt-small">A ' + gv(mSat) + ' kg satellite launched sideways ' + M.fmt(R0o, 2) + ' m from Earth\'s center (G M = ' + M.fmt(GM, 4) + ' m³/s², Earth\'s radius ' + M.fmt(RE, 3) + ' m). Time runs ' + WARP + ' times faster than real. Speeds from 0.90 to 1.20 times the circular speed keep the orbit clear of the ground and bound.</p>';
    var oGo = oc.querySelector('.rl-o-go');
    oGo.addEventListener('click', function(){ orun = !orun; oGo.setAttribute('aria-pressed', String(orun)); oGo.textContent = orun ? 'Pause' : 'Launch'; if(orun){ cue.done(); oloop.start(); } else { oloop.stop(); drawOrbit(); } });
    oc.querySelector('.rl-o-reset').addEventListener('click', orbitReset);
    var oloop = S.loop(function(dt){
      var tt = dt * WARP, n = Math.max(1, Math.ceil(tt / 4)), h = tt / n;
      for(var i = 0; i < n; i++) os = RL.orbit.step(os, h, GM);
      otime += tt; otrail.push([os.x, os.y]); if(otrail.length > 600) otrail.shift();
      drawOrbit(true);
    }, { still: function(){ for(var i = 0; i < 1500; i++){ os = RL.orbit.step(os, 4, GM); if(i % 5 === 0) otrail.push([os.x, os.y]); } drawOrbit(); } });
    function orbitReset(){ oloop.stop(); orun = false; oGo.setAttribute('aria-pressed', 'false'); oGo.textContent = 'Launch'; os = RL.orbit.start({ r0: R0o, k: kO, GM: GM }); otrail = []; otime = 0; drawOrbit(); }
    var lastOrbitFull = 0;
    /* The K, U, E columns inside the space scene (phones), bottom right. */
    function inset(en, rp){
      var Up = GM * mSat / rp, sc = 52 / Up, x0 = 300, z = 290, cw = 26;
      function c(i, v, cls, t){ var h = v * sc, x = x0 + i * (cw + 10); return '<rect class="' + cls + '" x="' + x + '" y="' + n1(h >= 0 ? z - h : z) + '" width="' + cw + '" height="' + n1(Math.abs(h)) + '" rx="3"/><text class="rl-st" x="' + (x + cw / 2) + '" y="' + (z + 72) + '" text-anchor="middle" font-size="15">' + t + '</text>'; }
      return '<g aria-hidden="true">' + c(0, en.K, 'rl-col-k', 'K') + c(1, en.U, 'rl-col-u', 'U') + c(2, en.E, 'rl-col-e', 'E') + '<line x1="' + (x0 - 6) + '" x2="' + (x0 + 3 * cw + 26) + '" y1="' + z + '" y2="' + z + '" stroke="#E6EDF5" stroke-width="1.4"/></g>';
    }
    function drawOrbit(fast){
      if(scene !== 'orbit') return;
      var nar = narrow(), W = nar ? 420 : 640, H = nar ? 380 : 400;
      var far = RL.orbit.farPoint(R0o, kO), rp = Math.min(R0o, far), ra = Math.max(R0o, far), a = (rp + ra) / 2, b = Math.sqrt(rp * ra);
      // Fixed frame (fits the widest orbit, k = 1.2), so the picture does not jump.
      var fa = RL.orbit.farPoint(R0o, 1.2), span = R0o + fa, ppm = Math.min((W - 40) / span, (H - 40) / (2 * Math.sqrt(R0o * fa))), ox = 20 + fa * ppm + (W - 40 - span * ppm) / 2, oy = H / 2;
      function X(x){ return ox + x * ppm; } function Y(y){ return oy - y * ppm; }
      var centerX = (R0o - far) / 2;   // midway between the launch point (+x) and the other turning point (−x)
      var en = RL.orbit.energy(os, GM, mSat), v = en.v, r = en.r;
      var stars = ''; for(var i = 0; i < 40; i++){ var sx = (i * 97.13) % W, sy = (i * 53.71 + (i % 7) * 37) % H; stars += '<circle class="rl-star" cx="' + n1(sx) + '" cy="' + n1(sy) + '" r="' + ((i % 5) ? 0.8 : 1.4) + '" opacity="' + (0.35 + (i % 4) * 0.15) + '"/>'; }
      var path = '<ellipse class="rl-orbit" cx="' + n1(X(centerX)) + '" cy="' + n1(oy) + '" rx="' + n1(a * ppm) + '" ry="' + n1(b * ppm) + '"/>';
      var trail = otrail.length > 1 ? '<polyline class="rl-trail" points="' + otrail.map(function(p){ return n1(X(p[0])) + ',' + n1(Y(p[1])); }).join(' ') + '" opacity=".85"/>' : '';
      var sxp = X(os.x), syp = Y(os.y), vang = Math.atan2(-os.vy, os.vx);
      var vs = 7.5e-3, fs = 40 / (GM * mSat / (R0o * R0o));   // px per m/s; px per N (40 px at the launch radius)
      var Fg = GM * mSat / (r * r), ux = -os.x / r, uy = -os.y / r;
      var sat = '<g transform="translate(' + n1(sxp) + ' ' + n1(syp) + ') rotate(' + n1(M.deg(vang)) + ')"><rect class="rl-solar" x="-4" y="-17" width="8" height="12"/><rect class="rl-solar" x="-4" y="5" width="8" height="12"/><rect class="rl-sat" x="-6" y="-5" width="12" height="10" rx="2"/></g>';
      var arrows = S.arrow(sxp, syp, os.vx * vs, -os.vy * vs, { cls: 'vel', label: 'v', width: 3, head: 10 }) + S.arrow(sxp, syp, ux * Fg * fs, -uy * Fg * fs, { cls: 'f-grav', label: 'F_g', width: 3, head: 10 });
      var marks = '';
      if(Math.abs(kO - 1) > 0.004){
        var pX = kO >= 1 ? R0o : -ra, qX = kO >= 1 ? -ra : R0o;
        marks = '<circle cx="' + n1(X(kO >= 1 ? R0o : -far)) + '" cy="' + oy + '" r="4" fill="#F5CF8A"/><text class="rl-st" x="' + n1(X(kO >= 1 ? R0o : -far) + (kO >= 1 ? 10 : -10)) + '" y="' + (oy + 18) + '" text-anchor="' + (kO >= 1 ? 'start' : 'end') + '">closest</text>' +
          '<circle cx="' + n1(X(kO >= 1 ? -far : R0o)) + '" cy="' + oy + '" r="4" fill="#8FB3D9"/><text class="rl-st" x="' + n1(X(kO >= 1 ? -far : R0o) + (kO >= 1 ? -10 : 10)) + '" y="' + (oy + 18) + '" text-anchor="' + (kO >= 1 ? 'end' : 'start') + '">farthest</text>';
      }
      var desc = 'A satellite orbiting Earth: ' + (Math.abs(kO - 1) < 0.004 ? 'a circle' : 'an ellipse with Earth at one focus') + '. Now ' + M.fmt(r, 3) + ' m from Earth\'s center, moving at ' + M.fmt(v, 3) + ' m/s.';
      sceneEl.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="phys-scene rl-space-g" role="img" aria-label="' + esc(desc) + '">' + defs(did) + '<rect class="rl-space" x="0" y="0" width="' + W + '" height="' + H + '" rx="14"/>' + stars + path + trail +
        '<circle cx="' + n1(X(0)) + '" cy="' + oy + '" r="' + n1(RE * ppm + 4) + '" fill="#5FA8E8" opacity=".18"/><circle cx="' + n1(X(0)) + '" cy="' + oy + '" r="' + n1(RE * ppm) + '" fill="url(#' + did + 'e)"/>' +
        '<path d="M' + n1(X(0) - RE * ppm * 0.5) + ' ' + n1(oy - RE * ppm * 0.35) + 'q' + n1(RE * ppm * 0.3) + ' ' + n1(-RE * ppm * 0.2) + ' ' + n1(RE * ppm * 0.55) + ' ' + n1(RE * ppm * 0.05) + 'q' + n1(-RE * ppm * 0.1) + ' ' + n1(RE * ppm * 0.3) + ' ' + n1(-RE * ppm * 0.35) + ' ' + n1(RE * ppm * 0.2) + 'z" fill="#4FA36A" opacity=".75"/>' +
        '<text class="rl-st" x="' + n1(X(0)) + '" y="' + n1(oy + 4) + '" text-anchor="middle">Earth</text>' + marks + arrows + sat + (nar ? inset(en, rp) : '') + '</svg>';
      if(fast && Date.now() - lastOrbitFull < 120) return;
      lastOrbitFull = Date.now();
      // K, U, E columns with a zero line, L beside them.
      var Up = GM * mSat / rp, PW = 250, PH = 200, z = 92, sc = 80 / Up;
      if(nar){ PH = 120; z = 52; sc = 44 / Up; }
      function col(x, val, cls, name){ var h = val * sc; return '<rect class="' + cls + '" x="' + x + '" y="' + n1(h >= 0 ? z - h : z) + '" width="38" height="' + n1(Math.abs(h)) + '" rx="3"/><text class="rl-col-t" x="' + (x + 19) + '" y="' + (PH - 6) + '" text-anchor="middle">' + name + '</text>'; }
      if(nar){ panel.innerHTML = '<p class="sr-only">' + esc('Energy now: K ' + M.fmt(en.K, 3) + ' J, U ' + M.fmt(en.U, 3) + ' J, total E ' + M.fmt(en.E, 3) + ' J; angular momentum constant.') + '</p>'; }
      else panel.innerHTML = '<div class="rl-cols"><svg viewBox="0 0 ' + PW + ' ' + PH + '" role="img" aria-label="' + esc('Energy now: K ' + M.fmt(en.K, 3) + ' J, U ' + M.fmt(en.U, 3) + ' J, total E ' + M.fmt(en.E, 3) + ' J. Angular momentum ' + M.fmt(en.L, 3) + ' kg·m²/s.') + '">' +
        col(16, en.K, 'rl-col-k', 'K') + col(70, en.U, 'rl-col-u', 'U') + col(124, en.E, 'rl-col-e', 'E') +
        '<line class="rl-zero" x1="8" x2="172" y1="' + z + '" y2="' + z + '"/><text class="rl-col-t" x="176" y="' + (z + 4) + '">0</text>' +
        '<text class="rl-col-t" x="' + (PW - 4) + '" y="40" text-anchor="end">L = m r v⊥</text><text class="rl-col-t" x="' + (PW - 4) + '" y="58" text-anchor="end">constant</text></svg></div>';
      var ecc = Math.abs(kO - 1) < 0.004;
      var head = ecc ? { h: '<b>Circular orbit:</b> speed, K and U stay the same all the way round.' } : { h: '<b>Elliptical orbit:</b> fastest when closest. K and U trade off; E stays the same.' };
      head.b = '<p>Gravity on the satellite always points at Earth\'s center, so it exerts no torque about it: angular momentum L = m r v⊥ is conserved. Nothing outside the satellite-Earth system does work, so E = K + U is conserved too.</p>' +
        '<p>U = −G M m / r (zero at infinity), so U is negative and rises toward zero as the satellite moves out; K falls by the same amount. E is negative: the satellite is bound.</p>' +
        (ecc ? '<p>For a circle, gravity supplies the centripetal force: G M m / r² = m v² / r, so v = √(G M / r) = ' + M.fmt(RL.orbit.vc(GM, R0o), 3) + ' m/s, K = G M m / 2r and E = −G M m / 2r.</p>'
          : '<p>Launched at ' + F(kO, 2) + ' × the circular speed, it ' + (kO > 1 ? 'swings out to ' + M.fmt(ra, 3) + ' m' : 'falls in to ' + M.fmt(rp, 3) + ' m') + ' and back. At the closest and farthest points v is perpendicular to r, so r₁ v₁ = r₂ v₂.</p>');
      caption(head, [{ k: 'v', html: M.fmt(v, 3) + ' m/s', tone: 'readout' }], [{ html: 'r ' + M.fmt(r, 3) + ' m', tone: 'ghost' }]);
      var vpp = Math.sqrt(2 * GM * ra / (rp * (rp + ra))), vap = vpp * rp / ra;
      nums('<table class="rl-tbl"><caption class="sr-only">The orbit now and at its turning points</caption><thead><tr><th></th><th class="r">Now</th><th class="r">Closest</th><th class="r">Farthest</th></tr></thead><tbody>' +
        '<tr><th scope="row">r (m)</th><td class="r">' + M.fmt(r, 3) + '</td><td class="r">' + M.fmt(rp, 3) + '</td><td class="r">' + M.fmt(ra, 3) + '</td></tr>' +
        '<tr><th scope="row">v (m/s)</th><td class="r">' + M.fmt(v, 3) + '</td><td class="r">' + M.fmt(vpp, 3) + '</td><td class="r">' + M.fmt(vap, 3) + '</td></tr>' +
        '<tr><th scope="row">K (J)</th><td class="r">' + M.fmt(en.K, 3) + '</td><td class="r">' + M.fmt(0.5 * mSat * vpp * vpp, 3) + '</td><td class="r">' + M.fmt(0.5 * mSat * vap * vap, 3) + '</td></tr>' +
        '<tr><th scope="row">U (J)</th><td class="r">' + M.fmt(en.U, 3) + '</td><td class="r">' + M.fmt(-GM * mSat / rp, 3) + '</td><td class="r">' + M.fmt(-GM * mSat / ra, 3) + '</td></tr>' +
        '<tr class="hl"><th scope="row">E = K + U (J)</th><td class="r">' + M.fmt(en.E, 4) + '</td><td class="r" colspan="2">' + M.fmt(-GM * mSat / (2 * a), 4) + ' everywhere</td></tr>' +
        '<tr><th scope="row">L (kg·m²/s)</th><td class="r">' + M.fmt(en.L, 4) + '</td><td class="r" colspan="2">' + M.fmt(mSat * rp * vpp, 4) + ' everywhere</td></tr></tbody></table>' +
        '<p class="bt-small">Escape speed here would be √2 × the circular speed, ' + M.fmt(RL.orbit.vesc(GM, R0o), 3) + ' m/s (total energy zero). Elapsed ' + F(otime / 60, 0) + ' min of simulated time.</p>');
    }

    /* ======================== switching */
    function stop(){ rloop.stop(); sloop.stop(); oloop.stop(); spinning = false; orun = false; spinBtn.textContent = 'Spin'; spinBtn.setAttribute('aria-pressed', 'false'); oGo.textContent = 'Launch'; oGo.setAttribute('aria-pressed', 'false'); }
    function draw(){ if(scene === 'roll') drawRoll(); else if(scene === 'stool'){ sbuilt = false; drawStool(); } else drawOrbit(); }
    function setScene(sc){
      if(sc === scene) return;
      stop(); scene = sc;
      dock.querySelectorAll('[data-sc]').forEach(function(b){ var on = b.getAttribute('data-sc') === sc; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      dock.querySelectorAll('.rl-ctl').forEach(function(c){ c.hidden = c.getAttribute('data-for') !== sc; });
      det.querySelectorAll('.rl-set').forEach(function(c){ c.hidden = c.getAttribute('data-for') !== sc; });
      stage.classList.toggle('is-side', sc !== 'roll');
      stage.classList.toggle('is-orbit', sc === 'orbit');
      if(sc === 'orbit' && !os) os = RL.orbit.start({ r0: R0o, k: kO, GM: GM });
      sbuilt = false; draw();
      T.event('apphys-tool-scene', { tool: 'rotation-lab', scene: sc });
    }
    dock.querySelectorAll('[data-sc]').forEach(function(b){ b.addEventListener('click', function(){ setScene(b.getAttribute('data-sc')); }); });
    os = RL.orbit.start({ r0: R0o, k: kO, GM: GM });
    drawRoll();
    if(window.ResizeObserver){ var lastN = narrow(); new ResizeObserver(function(){ var nn = narrow(); if(nn !== lastN){ lastN = nn; draw(); } }).observe(sceneEl); }
    return {
      stop: stop,
      studio: function(pane, studio){
        s = studio;
        var o = { mode: 'explore' };
        s.add('stage', stage, o); s.add('dock', dock, o);
        var w = document.createElement('div'); w.className = 'ls-sec phys-ls-why'; w.appendChild(cue.el); w.appendChild(why);
        s.add('why', w, o);
        var d = document.createElement('div'); d.className = 'ls-sec'; d.appendChild(det); s.add('details', d, o);
        why.querySelectorAll('details.bt-why').forEach(function(x){ x.open = true; });
        draw();
        if(s.mode() === 'explore') s.hint({ target: goR, text: 'Press Race' });
      }
    };
  }

  /* ------------------------------------------------------------ quiz */
  function figure(p){
    var f = p.fig, id = nid('rlq'), W = 520, H = 240, out = '', label = '';
    if(f.kind === 'race' || f.kind === 'ramp'){
      var th = f.kind === 'ramp' ? f.th : 28, list = f.kind === 'race' ? f.pick : [f.sh], x0 = 60, y0 = 50, run = 330, drop = run * Math.tan(M.rad(th)), gap = 40, n = list.length;
      H = Math.ceil(y0 + drop + (n - 1) * gap + 25);
      out += '<rect class="rl-floor" x="0" y="' + (H - 18) + '" width="' + W + '" height="18"/>';
      list.forEach(function(k, i){
        var ly = y0 + i * gap, R = 15;
        out += '<path class="rl-wood" fill="url(#' + id + 'w)" d="M' + (x0 - 8) + ' ' + ly + 'L' + n1(x0 + run) + ' ' + n1(ly + drop) + 'l0 7L' + (x0 - 8) + ' ' + (ly + 7) + 'Z"/>' +
          racerArt(id, k, x0 + 14 * Math.cos(M.rad(th)) + R * Math.sin(M.rad(th)), ly + 14 * Math.sin(M.rad(th)) - R * Math.cos(M.rad(th)), R, 0.4, th) +
          (n > 1 ? '<text class="rl-t" x="' + (x0 - 14) + '" y="' + (ly + 4) + '" text-anchor="end">' + SHORT[k] + '</text>' : '');
      });
      var bx = x0 + run, by = y0 + (n - 1) * gap + drop + 3.5;
      out += '<path class="rl-ang" d="M' + n1(bx - 46) + ' ' + n1(by) + 'A46 46 0 0 1 ' + n1(bx - 46 * Math.cos(M.rad(th))) + ' ' + n1(by - 46 * Math.sin(M.rad(th))) + '"/><text class="rl-t" x="' + n1(bx - 54) + '" y="' + n1(by - 8) + '" text-anchor="end">' + th + '°</text>';
      if(f.kind === 'race') out += '<line class="rl-dim" x1="' + n1(bx + 22) + '" x2="' + n1(bx + 22) + '" y1="' + y0 + '" y2="' + n1(y0 + drop) + '"/><text class="rl-tm" x="' + n1(bx + 30) + '" y="' + n1(y0 + drop / 2) + '">h = ' + gv(f.h) + ' m</text>';
      label = f.kind === 'race' ? 'Three lanes of one ramp with a ' + list.map(function(k){ return SHORT[k].toLowerCase(); }).join(', a ') + ' at the top, released together from a height of ' + gv(f.h) + ' m.' : 'A ' + SH[f.sh].name.toLowerCase() + ' at the top of a ramp tilted ' + th + ' degrees.';
    } else if(f.kind === 'stool'){
      H = 230;
      [[f.d0, 'Arms out', W * 0.26], [f.d1, 'Arms in', W * 0.74]].forEach(function(c){
        var cx = c[2], cy = 120, ppm = 115, d = c[0];
        out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + n1(0.24 * ppm) + '" fill="url(#' + id + 'w)" class="rl-wood"/><ellipse class="rl-shirt" cx="' + cx + '" cy="' + cy + '" rx="' + n1(0.23 * ppm) + '" ry="' + n1(0.12 * ppm) + '"/><circle class="rl-hair" cx="' + cx + '" cy="' + n1(cy - 0.01 * ppm) + '" r="' + n1(0.095 * ppm) + '"/>' +
          [-1, 1].map(function(sg){ return '<path class="rl-arm" d="M' + n1(cx + sg * 0.19 * ppm) + ' ' + cy + 'L' + n1(cx + sg * d * ppm) + ' ' + n1(cy - 0.1 * ppm) + '" stroke-width="7"/><rect class="rl-bell" x="' + n1(cx + sg * d * ppm - 5) + '" y="' + n1(cy - 0.1 * ppm - 12) + '" width="10" height="24" rx="3"/>'; }).join('') +
          '<text class="rl-t" x="' + cx + '" y="' + (cy + 70) + '" text-anchor="middle">' + c[1] + ': d = ' + gv(d) + ' m</text>' +
          '<path class="rl-spin" d="M' + n1(cx + 92) + ' ' + cy + 'A92 92 0 0 0 ' + cx + ' ' + (cy - 92) + '"/><path class="rl-spin-h" d="M' + (cx - 2) + ' ' + (cy - 92) + 'l11 -6l0 12z"/>';
      });
      label = 'Top view of a student on a spinning stool, first with the dumbbells ' + gv(f.d0) + ' m from the axis, then pulled in to ' + gv(f.d1) + ' m.';
    } else {
      H = 260; var cx = W / 2, cy = 130, e = f.e || 0, a = Math.min(220, 105 / Math.sqrt(1 - e * e)), b = a * Math.sqrt(1 - e * e), fx = cx + a * e;
      out += '<rect class="rl-space" x="0" y="0" width="' + W + '" height="' + H + '" rx="12"/><ellipse class="rl-orbit" cx="' + cx + '" cy="' + cy + '" rx="' + a + '" ry="' + n1(b) + '"/>' +
        '<circle cx="' + n1(e ? fx : cx) + '" cy="' + cy + '" r="34" fill="url(#' + id + 'e)"/>' +
        (e ? '<circle cx="' + (cx + a) + '" cy="' + cy + '" r="5" fill="#F5CF8A"/><text class="rl-st" x="' + (cx + a - 8) + '" y="' + (cy - 12) + '" text-anchor="end">closest</text><circle cx="' + (cx - a) + '" cy="' + cy + '" r="5" fill="#8FB3D9"/><text class="rl-st" x="' + (cx - a + 8) + '" y="' + (cy - 12) + '">farthest</text>'
          : '<line x1="' + cx + '" y1="' + cy + '" x2="' + n1(cx + a * 0.707) + '" y2="' + n1(cy - b * 0.707) + '" stroke="#E6EDF5" stroke-width="1.3" stroke-dasharray="4 4"/><text class="rl-st" x="' + n1(cx + a * 0.32) + '" y="' + n1(cy - b * 0.42) + '">r</text>') +
        '<g transform="translate(' + n1(e ? cx + a : cx + a * 0.707) + ' ' + n1(e ? cy : cy - b * 0.707) + ')"><rect class="rl-solar" x="-4" y="-16" width="8" height="11"/><rect class="rl-solar" x="-4" y="5" width="8" height="11"/><rect class="rl-sat" x="-6" y="-5" width="12" height="10" rx="2"/></g>';
      label = e ? 'A satellite on an elliptical orbit, with the closest and farthest points marked.' : 'A satellite on a circular orbit of radius r around a planet.';
    }
    return '<figure class="cd-fig rl-fig"><svg viewBox="0 0 ' + W + ' ' + H + '" class="phys-scene' + (f.kind === 'orbit' ? '' : ' rl-light') + '" role="img" aria-label="' + esc(label) + '">' + defs(id) + out + '</svg></figure>';
  }
  function quiz(pane, data){
    T.drill(pane, data, {
      slug: 'rotation-lab', generate: RL.generate,
      types: [{ value: 'race', label: 'Rolling race' }, { value: 'speed', label: 'Rolling down a ramp' }, { value: 'stool', label: 'Spinning stool' }, { value: 'orbit', label: 'Circular orbit' }, { value: 'ellipse', label: 'Elliptical orbit' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { race: 'Rolling race', speed: 'Rolling down a ramp', stool: 'Spinning stool', orbit: 'Circular orbit', ellipse: 'Elliptical orbit' }[p.type]; },
      extra: function(host, p){ host.innerHTML = figure(p); }
    });
  }
})();
