/* Motion graphs (Unit 1, free). Job: drive a cart and watch its position,
   velocity and acceleration graphs draw themselves from the same motion.
   OWNED BY THIS TOOL ONLY. Model: ApPhysMath.motionGraphs
   (physics/assets/tools/math/motion-graphs.js); arrows: ApPhysScene; frame:
   ApPhysTools.modes / studio / drill.

   Explore: a cart on a 10 m track with a motion detector at the left end.
     Drag      the student drags the cart (or holds the arrow keys); the clock
               runs 10 s from the first touch and the detector records x; v and
               a are measured from x the way a real detector does (slopes over
               a short window), so they are honest and a little noisy.
     Set v, a  sliders for the starting velocity and the acceleration; Run
               plays the exact constant-acceleration motion, and changing a
               while it runs starts a new segment. The cart stops at a bumper.
     Match     a target x-t or v-t graph; drive the cart to trace it and get a
               match score with where you were furthest off.
   Tap (or arrow along) the graphs to put a time cursor on them: the readout
   shows the slope of x-t (v), the slope of v-t (a), the area under v-t (Δx)
   and under a-t (Δv) at that moment, drawn on the graphs.

   Test yourself: seeded drills from ApPhysMath.motionGraphs.generate (slope,
   area, pick the a-t graph, describe the motion, signs, turning points,
   distance and displacement), each with a figure drawn here. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath, PS = window.ApPhysScene;
  // This tool's own stylesheet, next to this script.
  (function(){
    var me = document.currentScript, href = me && me.src ? me.src.replace(/motion-graphs\.js(\?.*)?$/, 'motion-graphs.css') : null;
    if(href && !document.querySelector('link[href$="tools/motion-graphs.css"]')){ var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Readings');
  })();
  if(!T || !M || !M.motionGraphs || !PS) return;
  var MG = M.motionGraphs, F = T.F, esc = T.esc;
  var WIN = MG.WINDOW, TR = MG.TRACK;
  var NS = 'http://www.w3.org/2000/svg';
  var RANGE = { x: [-5, 5, 2.5], v: [-4, 4, 2], a: [-3, 3, 1.5] };
  var UNIT = { x: 'm', v: 'm/s', a: 'm/s²' };
  var NAME = { x: 'Position', v: 'Velocity', a: 'Acceleration' };
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function sgn(x, d){ var s = F(x, d); return x > 0 && Number(M.fixed(x, d)) !== 0 ? '+' + s : s; }
  function storeGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function storeSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }

  T.mount('motion-graphs', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'motion-graphs', labels: ['Explore', 'Test yourself'],
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.pause(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ================================================================ explore */
  function explore(host, data){
    var LS = null;
    var targets = (data.targets || []).filter(function(t){ return t.kind === 'x' || t.kind === 'v'; });
    var st = {
      drive: 'drag', clock: 0, running: false, done: false,
      rec: { t: [], x: [], v: [], a: [] }, exact: false,
      x: 0, kv: 0, grab: null,
      x0: 0, v0: 1, a: 0, segs: null, segStart: 0, hit: null,
      cursor: null, target: 0, result: null
    };
    var raf = null, last = 0, firstAct = false;

    host.innerHTML =
      '<section class="bt-problem mg-card" aria-label="Motion graphs explorer">' +
        '<div class="mg-stage">' +
          '<div class="mg-scene-wrap"><svg class="phys-scene mg-scene" role="group" aria-label="A cart on a straight track with a motion detector at the left end"></svg></div>' +
          '<div class="mg-graphs-wrap" tabindex="0" role="slider" aria-label="Time cursor on the graphs: arrow keys move it" aria-valuemin="0" aria-valuemax="' + WIN + '" aria-valuenow="0"><svg class="phys-svg bt-plot mg-graphs" role="img" aria-label="Position, velocity and acceleration against time"></svg></div>' +
        '</div>' +
        '<div class="mg-ctl">' +
          '<div class="mg-drive ls-seg" role="group" aria-label="How to drive the cart">' +
            '<button type="button" class="bt-mode" data-d="drag" aria-pressed="true">Drag</button>' +
            '<button type="button" class="bt-mode" data-d="set" aria-pressed="false">Set v and a</button>' +
            '<button type="button" class="bt-mode" data-d="match" aria-pressed="false">Match</button>' +
          '</div>' +
          '<div class="mg-panel mg-p-drag"></div><div class="mg-panel mg-p-set" hidden></div><div class="mg-panel mg-p-match" hidden></div>' +
          '<div class="bt-buttons mg-btns"><button type="button" class="bt-btn mg-run" hidden>▶ Run</button><button type="button" class="bt-btn mg-reset">Start over</button></div>' +
        '</div>' +
        '<div class="mg-say"></div><div class="mg-cur"></div>' +
        '<div class="mg-read"></div>' +
        T.moreHtml('<div class="mg-more"></div><p class="bt-small">The track runs from −5 m to +5 m, positive to the right. The detector records for ' + WIN + ' s. In Drag and Match, v and a are measured from the recorded positions over a short window (0.3 s for v, 0.5 s for a), as a real motion detector does, so a hand-driven graph is a little bumpy.</p>', 'start position, what the graphs show') +
      '</section>';
    var $ = function(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); };
    var sceneSvg = $('.mg-scene'), graphsWrap = $('.mg-graphs-wrap'), graphsSvg = $('.mg-graphs');
    var say = T.announcer(document.createElement('p'));

    /* ---- controls */
    var start = T.cue('Drag the cart along the track. The graphs record for ' + WIN + ' s.');
    $('.mg-p-drag').appendChild(start.el);
    var sv0 = T.slider({ label: 'Starting velocity, v₀', min: -3, max: 3, step: 0.1, value: st.v0, unit: 'm/s', decimals: 1, onInput: function(v){ st.v0 = v; if(!st.running) previewSet(); } });
    var sa = T.slider({ label: 'Acceleration, a', min: -2, max: 2, step: 0.1, value: st.a, unit: 'm/s²', decimals: 1, onInput: function(v){ st.a = v; if(st.running && st.drive === 'set') newSegment(); else if(!st.running) previewSet(); } });
    $('.mg-p-set').appendChild(sv0.el); $('.mg-p-set').appendChild(sa.el);
    var sx0 = T.slider({ label: 'Start position (Set v and a)', min: -4.5, max: 4.5, step: 0.5, value: 0, unit: 'm', decimals: 1, onInput: function(v){ st.x0 = v; if(st.drive === 'set' && !st.running) previewSet(); } });
    $('.mg-more').appendChild(sx0.el);
    var matchBox = $('.mg-p-match');
    matchBox.innerHTML = '<p class="mg-target"></p><div class="bt-buttons"><button type="button" class="bt-btn mg-next">New target</button></div>';
    var runBtn = $('.mg-run');

    var driveBtns = Array.prototype.slice.call(host.querySelectorAll('.mg-drive .bt-mode'));
    driveBtns.forEach(function(b){ b.addEventListener('click', function(){ setDrive(b.getAttribute('data-d')); }); });
    runBtn.addEventListener('click', function(){ if(st.running) pause(); else runSet(); });
    $('.mg-reset').addEventListener('click', function(){ reset(); });
    matchBox.querySelector('.mg-next').addEventListener('click', function(){ st.target = (st.target + 1) % targets.length; reset(); });

    function setDrive(d){
      if(d === st.drive) return;
      pause();
      st.drive = d;
      driveBtns.forEach(function(b){ var on = b.getAttribute('data-d') === d; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
      ['drag', 'set', 'match'].forEach(function(k){ $('.mg-p-' + k).hidden = k !== d; });
      runBtn.hidden = d !== 'set';
      reset();
      T.event('apphys-tool-drive', { tool: 'motion-graphs', drive: d });
    }

    /* ---- recording */
    function clearRec(){ st.rec = { t: [], x: [], v: [], a: [] }; st.clock = 0; st.done = false; st.cursor = null; st.result = null; st.hit = null; }
    function reset(){
      pause();
      clearRec();
      st.kv = 0;
      if(st.drive === 'set'){ st.x = st.x0; previewSet(); }
      else if(st.drive === 'match'){ var tg = targets[st.target]; st.x = tg && tg.kind === 'x' ? tg.pts[0][1] : (tg && tg.x0 != null ? tg.x0 : 0); }
      draw(true);
    }
    function previewSet(){ clearRec(); st.x = st.x0; st.exact = true; draw(true); }
    function push(t, x, v, a){ var r = st.rec; r.t.push(t); r.x.push(x); if(v != null){ r.v.push(v); r.a.push(a); } }
    // Measured v and a (Drag, Match): recomputed from the positions.
    function measured(){
      var r = st.rec;
      if(st.exact || r.t.length < 2) return st.exact ? r : { t: [], x: [], v: [], a: [] };
      var g = MG.resample(r.t, r.x, Math.min(st.clock, WIN), 0.05), d = MG.derive(g.t, g.x);
      return { t: g.t, x: g.x, v: d.v, a: d.a };
    }

    /* ---- the hand-driven clock (Drag, Match) */
    function startClock(){
      if(st.running) return;
      if(st.done || st.clock >= WIN) clearRec();
      st.exact = false; st.running = true; st.clock = st.clock || 0;
      if(!st.rec.t.length) push(0, st.x);
      firstTouch();
      last = 0; raf = requestAnimationFrame(tick);
    }
    function tick(now){
      if(!st.running) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      if(st.drive === 'set'){ stepSet(dt); }
      else {
        if(st.kv) st.x = clamp(st.x + st.kv * dt, TR.min, TR.max);
        st.clock = Math.min(WIN, st.clock + dt);
        if(dt > 0) push(st.clock, st.x);
        if(st.clock >= WIN) return finish();
      }
      draw(false);
      raf = requestAnimationFrame(tick);
    }
    function pause(){
      if(raf) cancelAnimationFrame(raf); raf = null;
      if(st.running && st.drive === 'set'){ st.running = false; runBtn.textContent = '▶ Run'; runBtn.setAttribute('aria-pressed', 'false'); sv0.disable(false); draw(true); return; }
      st.running = false;
    }
    function finish(){
      if(st.done && !st.running) return;
      st.running = false; st.done = true; st.kv = 0; if(raf) cancelAnimationFrame(raf); raf = null;
      runBtn.textContent = '▶ Run again'; runBtn.setAttribute('aria-pressed', 'false'); sv0.disable(false);
      if(st.drive === 'match') scoreMatch();
      draw(true);
    }

    /* ---- Set v and a: the exact model, a new segment when a changes */
    function runSet(){
      if(st.done || st.clock >= WIN || !st.segs) { clearRec(); st.segs = null; }
      st.exact = true;
      if(!st.segs){ st.segs = []; st.segStart = 0; st.mo = MG.motion(st.x0, st.v0, [{ dur: WIN, a: st.a }]); push(0, st.x0, st.v0, st.a); st.clock = 0; }
      firstTouch();
      sv0.disable(true);
      runBtn.textContent = '❚❚ Pause'; runBtn.setAttribute('aria-pressed', 'true');
      if(PS.reduced()){
        // Reduced motion: the whole run at once, the end state shown.
        stepSet(WIN - st.clock); return finish();
      }
      st.running = true; last = 0; raf = requestAnimationFrame(tick);
    }
    function newSegment(){
      // a changes from now on: rebuild the motion as the run so far plus a new segment.
      var t0 = st.clock, s0 = st.mo.at(t0);
      st.base = { t: t0 };
      st.mo = (function(prev, tc, x, v, a){ var tail = MG.motion(x, v, [{ dur: WIN, a: a }]);
        return { at: function(t){ if(t <= tc) return prev.at(t); var q = tail.at(t - tc); return { t: t, x: q.x, v: q.v, a: q.a }; } }; })(st.mo, t0, s0.x, s0.v, st.a);
    }
    function stepSet(dt){
      var t1 = Math.min(WIN, st.clock + dt), n = Math.max(1, Math.ceil((t1 - st.clock) / 0.02));
      for(var i = 1; i <= n && !st.hit; i++){
        var t = st.clock + (t1 - st.clock) * i / n, s = st.mo.at(t);
        if(s.x <= TR.min || s.x >= TR.max){
          // The bumper: find when it touched, then the cart sits still.
          var lo = st.rec.t[st.rec.t.length - 1], hi = t;
          for(var k = 0; k < 30; k++){ var mid = (lo + hi) / 2, xm = st.mo.at(mid).x; if(xm <= TR.min || xm >= TR.max) hi = mid; else lo = mid; }
          var sh = st.mo.at(hi);
          push(hi, clamp(sh.x, TR.min, TR.max), sh.v, sh.a);
          st.hit = { t: hi, x: clamp(sh.x, TR.min, TR.max), v: sh.v };
          push(hi + 1e-6, st.hit.x, 0, 0);
        } else push(t, s.x, s.v, s.a);
      }
      st.x = st.rec.x[st.rec.x.length - 1];
      // A bumper stop ends the run there: the cart cannot go on.
      if(st.hit){ st.clock = st.hit.t; return finish(); }
      st.clock = t1;
      if(st.clock >= WIN) finish();
    }

    /* ---- Match */
    function targetFn(tg){ return function(t){ return MG.plAt(tg.pts, t); }; }
    function scoreMatch(){
      var tg = targets[st.target]; if(!tg) return;
      var m = measured(), y = tg.kind === 'x' ? m.x : m.v;
      var res = MG.score(tg.kind, targetFn(tg), m.t, y);
      st.result = res;
      var key = 'apphys_mg_best_' + tg.id, best = +(storeGet(key) || 0);
      if(res.score > best) storeSet(key, String(res.score));
      res.best = Math.max(best, res.score);
      T.record('motion-graphs', [{ id: 'motion-graphs:match:' + tg.id, correct: res.score >= 80, topic: 'motion-representations', practice: '1.C', level: 'apply', group: 'match' }]);
      T.event('apphys-mg-match', { target: tg.id, score: res.score });
    }

    /* ---- first touch quiets the cue */
    function firstTouch(){ if(!firstAct){ firstAct = true; start.done(); if(geo) drawScene(nowState()); } }

    /* ================================================ drawing: the scene */
    var geo = null, cartG = null, vecG = null, pingG = null;
    // A phone in either orientation (Tool Studio's .ls-phone; docs/tools-phone-pass.md).
    function onPhone(){ return !!(sceneSvg.closest && sceneSvg.closest('.ls-phone')); }
    function sceneLayout(){
      var w = Math.max(300, Math.round(sceneSvg.clientWidth || sceneSvg.parentNode.clientWidth || 600));
      var h = Math.round(clamp(w * 0.2, w < 480 ? 92 : 104, 132));
      var L = Math.round(clamp(w * 0.1, 46, 74)), R = w - 18, ppm = (R - L) / (TR.max - TR.min);
      var cw0 = clamp(ppm * 0.95, 44, 86), ch0 = cw0 * 0.42, wr0 = Math.max(6, cw0 * 0.12);
      // Room above the cart for the v and a arrows and their labels.
      var railY = Math.max(h - 40, Math.round(ch0 + wr0 * 2 + 50));
      // A phone gives the axis name its own row under the ruler's numbers.
      var axisRow = onPhone();
      h = railY + (axisRow ? 54 : 40);
      geo = { w: w, h: h, L: L, R: R, ppm: ppm, railY: railY, cw: cw0, ch: ch0, wr: wr0 };
      var X = function(x){ return L + (x - TR.min) * ppm; };
      var p = [];
      // Bench, rail with end bumpers, ruler.
      p.push('<rect class="mg-bench" x="0" y="' + (railY + 8) + '" width="' + w + '" height="' + (h - railY - 8) + '"/>');
      p.push('<rect class="mg-rail" x="' + (X(TR.min) - 6) + '" y="' + (railY - 3) + '" width="' + (X(TR.max) - X(TR.min) + 12) + '" height="8" rx="3"/>');
      p.push('<rect class="mg-rail-slot" x="' + X(TR.min) + '" y="' + (railY - 1) + '" width="' + (X(TR.max) - X(TR.min)) + '" height="2"/>');
      [TR.min, TR.max].forEach(function(x, i){ p.push('<rect class="mg-bumper" x="' + (X(x) + (i ? 2 : -10)) + '" y="' + (railY - 16) + '" width="8" height="21" rx="2"/>'); });
      for(var x = TR.min; x <= TR.max + 1e-9; x += 0.5){
        var major = Math.abs(x - Math.round(x)) < 1e-9, X1 = X(x);
        p.push('<line class="mg-tick' + (major ? ' major' : '') + '" x1="' + X1.toFixed(1) + '" x2="' + X1.toFixed(1) + '" y1="' + (railY + 8) + '" y2="' + (railY + (major ? 16 : 12)) + '"/>');
        if(major && (ppm > 34 || x % 2 === 0)) p.push('<text class="mg-tl' + (x === 0 ? ' zero' : '') + '" x="' + X1.toFixed(1) + '" y="' + (railY + 29) + '" text-anchor="middle">' + M.minus(String(x)) + '</text>');
      }
      p.push('<text class="mg-axis-l" x="' + (R) + '" y="' + (h - (axisRow ? 4 : 2)) + '" text-anchor="end">' + (w < 480 ? 'x (m) →' : 'x (m), + to the right →') + '</text>');
      // The motion detector on its stand.
      var dx = X(TR.min) - 30, dy = railY - 46;
      p.push('<g class="mg-det" aria-hidden="true"><rect class="mg-stand" x="' + (dx + 9) + '" y="' + (dy + 26) + '" width="6" height="' + (railY - dy - 20) + '"/>' +
        '<rect class="mg-det-body" x="' + dx + '" y="' + dy + '" width="24" height="30" rx="5"/>' +
        '<rect class="mg-det-face" x="' + (dx + 17) + '" y="' + (dy + 4) + '" width="5" height="22" rx="2"/>' +
        '<circle class="mg-det-led" cx="' + (dx + 7) + '" cy="' + (dy + 7) + '" r="2.4"/></g>');
      p.push('<g class="mg-ping"></g><g class="mg-vecs"></g>');
      // The cart: body, deck, flag, two spoked wheels (rotate as it rolls).
      var cw = geo.cw, ch = geo.ch, wr = geo.wr;
      var wheel = function(cx){ return '<g class="mg-wheel" data-cx="' + cx + '"><circle class="mg-tyre" cx="' + cx + '" cy="0" r="' + wr + '"/><circle class="mg-hub" cx="' + cx + '" cy="0" r="' + (wr * 0.35) + '"/>' +
        '<g class="mg-spokes"><line x1="' + (cx - wr * 0.75) + '" y1="0" x2="' + (cx + wr * 0.75) + '" y2="0"/><line x1="' + cx + '" y1="' + (-wr * 0.75) + '" x2="' + cx + '" y2="' + (wr * 0.75) + '"/></g></g>'; };
      p.push('<g class="mg-cart" tabindex="0" role="slider" aria-label="Cart: drag it, or hold the left and right arrow keys" aria-valuemin="' + TR.min + '" aria-valuemax="' + TR.max + '">' +
        '<rect class="mg-hit" x="' + (-cw / 2 - 10) + '" y="' + (-ch - wr - 26) + '" width="' + (cw + 20) + '" height="' + (ch + wr * 2 + 34) + '"/>' +
        '<g class="mg-wheels" transform="translate(0,' + (-wr) + ')">' + wheel(-cw * 0.28) + wheel(cw * 0.28) + '</g>' +
        '<rect class="mg-body" x="' + (-cw / 2) + '" y="' + (-wr - ch) + '" width="' + cw + '" height="' + ch + '" rx="' + (ch * 0.28) + '"/>' +
        '<rect class="mg-stripe" x="' + (-cw / 2 + 4) + '" y="' + (-wr - ch * 0.48) + '" width="' + (cw - 8) + '" height="' + (ch * 0.16) + '" rx="2"/>' +
        '<rect class="mg-reflector" x="' + (-cw / 2 - 3) + '" y="' + (-wr - ch * 0.9) + '" width="5" height="' + (ch * 0.75) + '" rx="1.5"/>' +
        '<line class="mg-dot-l" x1="0" x2="0" y1="' + (-wr - ch) + '" y2="' + (wr * 0.2) + '"/>' +
        '<circle class="mg-dot" cx="0" cy="' + (-wr - ch / 2) + '" r="3"/></g>');
      sceneSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      sceneSvg.innerHTML = p.join('');
      cartG = sceneSvg.querySelector('.mg-cart'); vecG = sceneSvg.querySelector('.mg-vecs'); pingG = sceneSvg.querySelector('.mg-ping');
      wireCart();
    }
    function sceneX(x){ return geo.L + (x - TR.min) * geo.ppm; }
    function drawScene(now){
      if(!geo) return;
      var X = sceneX(st.x);
      cartG.setAttribute('transform', 'translate(' + X.toFixed(1) + ',' + (geo.railY - 3) + ')');
      var ang = (st.x * geo.ppm / geo.wr) * 180 / Math.PI;
      cartG.querySelectorAll('.mg-spokes').forEach(function(g){ var cx = +g.parentNode.getAttribute('data-cx'); g.setAttribute('transform', 'rotate(' + ang.toFixed(1) + ' ' + cx + ' 0)'); });
      cartG.setAttribute('aria-valuenow', M.fixed(st.x, 2));
      cartG.setAttribute('aria-valuetext', 'x = ' + F(st.x, 2) + ' m');
      // Velocity and acceleration arrows above the cart, to scale.
      var y0 = geo.railY - 3 - geo.wr * 2 - geo.ch - 12, vs = geo.ppm * 0.6, as = geo.ppm * 0.7, out = '';
      var vNow = now.v, aNow = now.a;
      // A zero vector is drawn as nothing here (the readout says 0).
      if(Math.abs(vNow) * vs >= 4) out += PS.arrow(X, y0, clamp(vNow * vs, -geo.w, geo.w), 0, { cls: 'vel', label: 'v', width: 3.5 });
      if(Math.abs(aNow) * as >= 4) out += PS.arrow(X, y0 - 20, clamp(aNow * as, -geo.w, geo.w), 0, { cls: 'acc', label: 'a', width: 3, dashed: true });
      // Before the first move in Drag: a "drag me" cue on the track.
      if(st.drive === 'drag' && !firstAct && !st.rec.t.length){
        var cy = geo.railY + 1, hw = geo.cw * 0.5 + 34;
        out += '<g class="mg-drag-cue" aria-hidden="true"><path d="M' + (X - hw).toFixed(1) + ' ' + (y0 + 4) + 'h' + (hw * 2).toFixed(1) + '"/><path class="hd" d="M' + (X - hw + 8).toFixed(1) + ' ' + (y0 - 2) + 'l-8 6 8 6M' + (X + hw - 8).toFixed(1) + ' ' + (y0 - 2) + 'l8 6 -8 6"/>' +
          '<text x="' + X.toFixed(1) + '" y="' + (y0 - 8) + '" text-anchor="middle">Drag the cart</text></g>';
      }
      vecG.innerHTML = out;
      // The detector's ping while recording.
      var dx = sceneX(TR.min) - 6, dy = geo.railY - 31;
      pingG.innerHTML = st.running ? [0, 1, 2].map(function(k){ var r = 10 + k * 9; return '<path d="M' + (dx + r * 0.5) + ' ' + (dy - r * 0.86) + ' A' + r + ' ' + r + ' 0 0 1 ' + (dx + r * 0.5) + ' ' + (dy + r * 0.86) + '"/>'; }).join('') : '';
      sceneSvg.querySelector('.mg-det-led').classList.toggle('on', st.running);
    }

    /* ---- dragging the cart (pointer and keys) */
    function wireCart(){
      function toX(e){ var b = sceneSvg.getBoundingClientRect(); var px = (e.clientX - b.left) * geo.w / b.width; return TR.min + (px - geo.L) / geo.ppm; }
      sceneSvg.addEventListener('pointerdown', function(e){
        if(st.drive === 'set') return;
        var x = toX(e);
        if(Math.abs(x - st.x) * geo.ppm > geo.cw * 0.75 + 14) return;
        e.preventDefault();
        st.grab = x - st.x;
        try{ sceneSvg.setPointerCapture(e.pointerId); }catch(er){}
        if(st.done) { clearRec(); }
        startClock();
      });
      sceneSvg.addEventListener('pointermove', function(e){ if(st.grab == null) return; st.x = clamp(toX(e) - st.grab, TR.min, TR.max); if(!st.running) drawScene(nowState()); });
      var up = function(){ st.grab = null; };
      sceneSvg.addEventListener('pointerup', up); sceneSvg.addEventListener('pointercancel', up);
      cartG.addEventListener('keydown', function(e){
        if(st.drive === 'set') return;
        var d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
        if(!d) return;
        e.preventDefault();
        st.kv = d * (e.shiftKey ? 0.5 : 1.5);
        if(st.done) clearRec();
        startClock();
      });
      cartG.addEventListener('keyup', function(e){ if(/Arrow/.test(e.key)) st.kv = 0; });
      cartG.addEventListener('blur', function(){ st.kv = 0; });
    }

    /* ================================================ drawing: the graphs */
    var gl = null;
    function graphsLayout(){
      var w = Math.max(280, Math.round(graphsWrap.clientWidth || 600));
      var hAvail = Math.round(graphsWrap.clientHeight || 0);
      // In the studio the graphs fill their slot exactly; on a plain page they
      // take a height from the width.
      var h = LS && hAvail >= 90 ? hAvail : hAvail > 150 ? hAvail : Math.round(clamp(w * 0.62, 300, 460));
      var L = w < 420 ? 44 : 58, R = 12, T0 = 8, B = 30, gap = w < 420 ? 10 : 14;
      var ph = (h - T0 - B - gap * 2) / 3;
      gl = { w: w, h: h, L: L, R: R, pw: w - L - R, ph: ph, top: { x: T0, v: T0 + ph + gap, a: T0 + 2 * (ph + gap) }, B: B, phone: onPhone() };
      graphsSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    }
    function gx(t){ return gl.L + t / WIN * gl.pw; }
    function gy(k, y){ var r = RANGE[k]; return gl.top[k] + gl.ph - (clamp(y, r[0], r[1]) - r[0]) / (r[1] - r[0]) * gl.ph; }
    function drawGraphs(m){
      if(!gl) return;
      var p = [], tg = st.drive === 'match' ? targets[st.target] : null;
      ['x', 'v', 'a'].forEach(function(k){
        var r = RANGE[k], top = gl.top[k], ph = gl.ph;
        p.push('<rect class="mg-panel-bg' + (tg && tg.kind === k ? ' is-target' : '') + '" x="' + gl.L + '" y="' + top.toFixed(1) + '" width="' + gl.pw + '" height="' + ph.toFixed(1) + '"/>');
        for(var t = 0; t <= WIN; t += 1) p.push('<line class="grid" x1="' + gx(t).toFixed(1) + '" x2="' + gx(t).toFixed(1) + '" y1="' + top.toFixed(1) + '" y2="' + (top + ph).toFixed(1) + '"/>');
        for(var y = r[0]; y <= r[1] + 1e-9; y += r[2]){
          p.push('<line class="grid" x1="' + gl.L + '" x2="' + (gl.L + gl.pw) + '" y1="' + gy(k, y).toFixed(1) + '" y2="' + gy(k, y).toFixed(1) + '"/>');
          // A panel too short for three numbers (a phone on its side) labels only 0.
          if(Math.abs(y) < 1e-9 || (Math.abs(y - r[1]) < 1e-9 && gl.ph >= 44) || (Math.abs(y - r[0]) < 1e-9 && !gl.phone && gl.ph > 90)) p.push('<text class="tick" x="' + (gl.L - 5) + '" y="' + (gy(k, y) + 4).toFixed(1) + '" text-anchor="end">' + M.minus(String(y)) + '</text>');
        }
        p.push('<line class="zero" x1="' + gl.L + '" x2="' + (gl.L + gl.pw) + '" y1="' + gy(k, 0).toFixed(1) + '" y2="' + gy(k, 0).toFixed(1) + '"/>');
        p.push('<line class="axis" x1="' + gl.L + '" x2="' + gl.L + '" y1="' + top.toFixed(1) + '" y2="' + (top + ph).toFixed(1) + '"/>');
        p.push('<text class="lbl mg-glbl" x="' + (gl.L + 6) + '" y="' + (top + 14).toFixed(1) + '">' + k + ' (' + UNIT[k] + ')</text>');
      });
      p.push('<line class="axis" x1="' + gl.L + '" x2="' + (gl.L + gl.pw) + '" y1="' + (gl.top.a + gl.ph).toFixed(1) + '" y2="' + (gl.top.a + gl.ph).toFixed(1) + '"/>');
      // On a phone the Enlarge button sits over the bottom-right corner: the
      // last time number is left out there and "t (s)" moves to the left.
      for(var t = 0; t <= WIN; t += (gl.pw < 300 ? 2 : 1)) if(!(gl.phone && gx(t) > gl.w - 58)) p.push('<text class="tick" x="' + gx(t).toFixed(1) + '" y="' + (gl.top.a + gl.ph + 16).toFixed(1) + '" text-anchor="middle">' + t + '</text>');
      p.push(gl.phone ? '<text class="lbl" x="2" y="' + (gl.h - 2) + '">t (s)</text>' : '<text class="lbl" x="' + (gl.L + gl.pw) + '" y="' + (gl.h - 2) + '" text-anchor="end">t (s)</text>');
      // Before any motion: a faint example run and a hint, so the first screen
      // shows what the graphs will do (Drag), or the run that Run will make (Set).
      var ghost = !m.t.length && !st.running ? ghostRun() : null;
      if(ghost){
        var gcls = { x: 's1', v: 's2', a: 's3' };
        ['x', 'v', 'a'].forEach(function(k){ p.push('<polyline class="series mg-ghost ' + gcls[k] + '" points="' + ghost.m.t.map(function(t, i){ return gx(t).toFixed(1) + ',' + gy(k, ghost.m[k][i]).toFixed(1); }).join(' ') + '"/>'); });
        // Panels too short for notes (a phone on its side) skip them; on a phone a note near the panel's name goes under the line.
        if(ghost.notes && gl.ph >= 44) ghost.notes.forEach(function(n){ var under = gl.phone && gx(n[0]) - gl.L < 90 && n[3] < 0; p.push('<text class="mg-ghost-n" x="' + gx(n[0]).toFixed(1) + '" y="' + (gy(n[1], n[2]) + (under ? 18 : n[3])).toFixed(1) + '" text-anchor="middle">' + n[4] + '</text>'); });
        var hx = gl.L + gl.pw - 8, hy = gl.top.x + 16;
        p.push('<g class="mg-ghost-hint"><text x="' + hx + '" y="' + hy + '" text-anchor="end">' + ghost.title + '</text>' + (ghost.sub && gl.pw > 300 && gl.ph >= 44 ? '<text class="sub" x="' + hx + '" y="' + (hy + 16) + '" text-anchor="end">' + ghost.sub + '</text>' : '') + '</g>');
      }
      // Target (Match).
      if(tg) p.push('<polyline class="mg-target-l" points="' + tg.pts.map(function(q){ return gx(q[0]).toFixed(1) + ',' + gy(tg.kind, q[1]).toFixed(1); }).join(' ') + '"/>');
      // The cursor's area and tangents go under the curves.
      var c = cursorInfo(m);
      if(c){
        p.push(areaPath('v', m, c.t, 's1'));
        p.push(areaPath('a', m, c.t, 's3'));
      }
      // The recorded curves.
      var cls = { x: 's1', v: 's2', a: 's3' };
      if(m.t.length > 1) ['x', 'v', 'a'].forEach(function(k){
        var pts = [], ys = m[k];
        for(var i = 0; i < m.t.length; i++) pts.push(gx(m.t[i]).toFixed(1) + ',' + gy(k, ys[i]).toFixed(1));
        p.push('<polyline class="series ' + cls[k] + '" points="' + pts.join(' ') + '"/>');
      });
      if(m.t.length){ var li = m.t.length - 1; ['x', 'v', 'a'].forEach(function(k){ p.push('<circle class="pt ' + cls[k] + '" cx="' + gx(m.t[li]).toFixed(1) + '" cy="' + gy(k, m[k][li]).toFixed(1) + '" r="4"/>'); }); }
      if(c){
        var x0 = gx(c.t).toFixed(1);
        p.push('<line class="mg-cursor" x1="' + x0 + '" x2="' + x0 + '" y1="' + gl.top.x + '" y2="' + (gl.top.a + gl.ph).toFixed(1) + '"/>');
        p.push(tangent('x', c.t, c.x, c.v)); p.push(tangent('v', c.t, c.v, c.a));
        ['x', 'v', 'a'].forEach(function(k){ p.push('<circle class="mg-cur-pt" cx="' + x0 + '" cy="' + gy(k, c[k]).toFixed(1) + '" r="5"/>'); });
        var lx = c.t > WIN * 0.7 ? -6 : 6, anc = c.t > WIN * 0.7 ? 'end' : 'start';
        p.push('<text class="mg-cur-t" x="' + (+x0 + lx) + '" y="' + (gl.top.x + gl.ph - 6).toFixed(1) + '" text-anchor="' + anc + '">t = ' + F(c.t, 1) + ' s</text>');
      }
      graphsSvg.innerHTML = p.join('');
      graphsSvg.setAttribute('aria-label', graphsLabel(m, c));
    }
    /* The faint example (Drag) or the preview of Run (Set), from the exact model. */
    function ghostRun(){
      if(st.drive === 'drag'){
        var mo = MG.motion(-1.5, 0, [{ dur: 2, a: 0.6 }, { dur: 2, a: 0 }, { dur: 2, a: -0.6 }, { dur: 2, a: -0.6 }, { dur: 2, a: 0 }]);
        var w = gl.pw > 300;
        return { m: MG.sample(mo, WIN, 0.05), title: 'Example run (faint)', sub: 'Drag the cart: your own run draws here',
          notes: w ? [[1, 'v', 0.6, -10, 'speeds up'], [3, 'v', 1.2, -10, 'steady'], [6, 'v', 0.0, -10, 'turns around'], [9, 'v', -1.2, 18, 'steady back']] : null };
      }
      if(st.drive === 'set'){
        var mo2 = MG.motion(st.x0, st.v0, [{ dur: WIN, a: st.a }]), T = MG.edgeTime(mo2, WIN);
        if(T < 0.1) return null;
        return { m: MG.sample(mo2, T, 0.05), title: 'Preview of the run (faint)', sub: 'Press Run to record it' };
      }
      return null;
    }
    function areaPath(k, m, t1, cls){
      var ys = m[k], pts = [gx(0).toFixed(1) + ',' + gy(k, 0).toFixed(1)];
      for(var i = 0; i < m.t.length && m.t[i] <= t1 + 1e-9; i++) pts.push(gx(m.t[i]).toFixed(1) + ',' + gy(k, ys[i]).toFixed(1));
      pts.push(gx(t1).toFixed(1) + ',' + gy(k, MG.interp(m.t, ys, t1)).toFixed(1));
      pts.push(gx(t1).toFixed(1) + ',' + gy(k, 0).toFixed(1));
      return '<polygon class="mg-area ' + cls + '" points="' + pts.join(' ') + '"/>';
    }
    function tangent(k, t, y, slope){
      var half = 1.2, ta = Math.max(0, t - half), tb = Math.min(WIN, t + half);
      return '<line class="mg-tan" x1="' + gx(ta).toFixed(1) + '" y1="' + gy(k, y + slope * (ta - t)).toFixed(1) + '" x2="' + gx(tb).toFixed(1) + '" y2="' + gy(k, y + slope * (tb - t)).toFixed(1) + '"/>';
    }
    function cursorInfo(m){
      if(!m.t.length) return null;
      var tEnd = m.t[m.t.length - 1];
      if(st.cursor == null) return null;
      var t = clamp(st.cursor, 0, tEnd);
      return { t: t, x: MG.interp(m.t, m.x, t), v: MG.interp(m.t, m.v, t), a: MG.interp(m.t, m.a, t),
        dx: MG.areaTo(m.t, m.v, 0, t), dv: MG.areaTo(m.t, m.a, 0, t), x0: m.x[0], v0: m.v[0],
        slopeX: st.exact ? MG.interp(m.t, m.v, t) : MG.slopeAt(m.t, m.x, t, 0.15), slopeV: st.exact ? MG.interp(m.t, m.a, t) : MG.slopeAt(m.t, m.v, t, 0.25) };
    }
    function graphsLabel(m, c){
      if(!m.t.length) return 'Empty graphs of position, velocity and acceleration against time, 0 to ' + WIN + ' s. Nothing recorded yet.';
      var li = m.t.length - 1;
      return 'Graphs of position, velocity and acceleration against time, recorded from 0 to ' + F(m.t[li], 1) + ' s. Now x = ' + F(m.x[li], 2) + ' m, v = ' + F(m.v[li], 2) + ' m/s, a = ' + F(m.a[li], 2) + ' m/s².' +
        (c ? ' Cursor at ' + F(c.t, 1) + ' s: slope of x-t ' + F(c.slopeX, 2) + ' m/s, slope of v-t ' + F(c.slopeV, 2) + ' m/s², area under v-t ' + F(c.dx, 2) + ' m.' : '');
    }
    /* the time cursor: tap, drag or arrow keys */
    (function(){
      function toT(e){ var b = graphsSvg.getBoundingClientRect(); var px = (e.clientX - b.left) * gl.w / b.width; return clamp((px - gl.L) / gl.pw * WIN, 0, WIN); }
      var on = false;
      graphsSvg.addEventListener('pointerdown', function(e){ if(!gl) return; on = true; try{ graphsSvg.setPointerCapture(e.pointerId); }catch(er){} setCursor(toT(e)); });
      graphsSvg.addEventListener('pointermove', function(e){ if(on) setCursor(toT(e)); });
      graphsSvg.addEventListener('pointerup', function(){ on = false; });
      graphsSvg.addEventListener('pointercancel', function(){ on = false; });
      graphsWrap.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
        if(e.key === 'Home'){ e.preventDefault(); return setCursor(0); }
        if(e.key === 'End'){ e.preventDefault(); return setCursor(WIN); }
        if(!d) return;
        e.preventDefault();
        setCursor((st.cursor == null ? maxT() : st.cursor) + d * (e.shiftKey ? 1 : 0.1));
      });
    })();
    function maxT(){ var r = st.rec.t; return r.length ? r[r.length - 1] : 0; }
    function setCursor(t){ if(!st.rec.t.length) return; st.cursor = clamp(M.round(t, 2), 0, maxT()); firstTouch(); draw(true); }

    /* ================================================ words: caption, why, readings */
    function nowState(){
      var m = measured(), n = m.t.length;
      if(!n) return { have: false, x: st.x, v: st.drive === 'set' ? st.v0 : 0, a: st.drive === 'set' ? st.a : 0, m: m };
      return { have: true, x: m.x[n - 1], v: m.v[n - 1], a: m.a[n - 1], t: m.t[n - 1], m: m };
    }
    var lastCap = '';
    function words(now, c){
      var tg = targets[st.target];
      var head, body;
      if(st.drive === 'match' && tg){
        $('.mg-target').innerHTML = '<b>Target:</b> ' + esc(tg.name) + ' <span class="bt-small">(' + (tg.kind === 'x' ? 'position-time' : 'velocity-time') + ', dashed)</span>';
        if(st.result){
          var w = st.result.worst, off = w && Math.abs(w.mean) > 0.15 ? (tg.kind === 'x' ? (w.sign > 0 ? 'too far to the right' : 'too far to the left') : (w.sign > 0 ? 'moving too fast in the + direction' : 'moving too fast in the − direction')) : '';
          head = '<b>Match ' + st.result.score + '%.</b> ' + (st.result.score >= 80 ? 'Well driven.' : off ? 'Furthest off from ' + w.t0 + ' s to ' + w.t1 + ' s: ' + off + '.' : 'Close. Try again for a smoother match.');
          body = '<p>The score compares your ' + (tg.kind === 'x' ? 'position' : 'velocity') + ' with the target every 0.05 s (root-mean-square difference: ' + F(st.result.rms, 2) + ' ' + UNIT[tg.kind] + '). Best so far on this target: ' + st.result.best + '%.</p>' + matchTip(tg);
        } else {
          head = st.running ? 'Recording… follow the dashed line.' : '<b>Drive the cart to trace the dashed line.</b>';
          body = matchTip(tg);
        }
      } else if(!now.have){
        head = st.drive === 'set' ? '<b>Set v₀ and a, then Run.</b>' : '<b>Grab the cart and move it.</b>';
        body = st.drive === 'set' ? '<p>With constant acceleration, v-t is a straight line with slope a, and x-t is a curve (a parabola) whose slope is v. Change a while it runs to start a new straight piece on v-t.</p>' : '<p>Move right and the position goes up; move left and it goes down. The steeper the x-t graph, the faster you are moving.</p>';
      } else {
        var d = MG.describe(now.v, now.a, 0.08, st.exact ? 0.05 : 0.4);
        head = '<b>' + d.text + '.</b>';
        body = '<p>' + motionWhy(now, d) + '</p>' + (st.hit ? '<p>The cart hit the bumper at t = ' + F(st.hit.t, 2) + ' s and stopped. Stopping that fast changes v in a very short time: a spike on a-t too narrow to draw.</p>' : '');
      }
      // The cursor's reasoning: slope and area, with the numbers.
      var cur = '';
      if(c){
        cur = '<p class="mg-cur-h"><b>At t = ' + F(c.t, 1) + ' s</b> (the cursor)</p><ul class="mg-why-list">' +
          '<li><span class="mg-k s1"></span><b>Slope of x-t = velocity:</b> ' + sgn(c.slopeX, 2) + ' m/s. The tangent line rises ' + F(c.slopeX, 2) + ' m for every 1 s.</li>' +
          '<li><span class="mg-k s2"></span><b>Slope of v-t = acceleration:</b> ' + sgn(c.slopeV, 2) + ' m/s².</li>' +
          '<li><span class="mg-k s1 a"></span><b>Area under v-t from 0 = displacement:</b> ' + sgn(c.dx, 2) + ' m, and x went from ' + F(c.x0, 2) + ' m to ' + F(c.x, 2) + ' m (Δx = ' + sgn(c.x - c.x0, 2) + ' m). Area below the axis counts as negative.</li>' +
          '<li><span class="mg-k s3 a"></span><b>Area under a-t from 0 = change in velocity:</b> ' + sgn(c.dv, 2) + ' m/s (v went from ' + F(c.v0, 2) + ' to ' + F(c.v, 2) + ' m/s).</li></ul>' +
          (st.hit && c.t >= st.hit.t - 1e-6 ? '<p class="bt-small">The sudden stop at the bumper is a spike on a-t too narrow to draw, so the area under a-t leaves it out.</p>' : '') +
          (st.exact ? '' : '<p class="bt-small">Measured from your hand-driven positions, so slopes and areas agree only roughly.</p>');
      } else if(st.rec.t.length > 1) cur = '<p class="bt-small">Tap a graph (or focus it and use the arrow keys) to read the slope and area at any moment.</p>';
      T.explain($('.mg-say'), head, body);
      $('.mg-cur').innerHTML = cur;
      // Readings (Details).
      var rows = [['Time', now.have ? F(now.t, 2) + ' s' : '0 s'], ['Position x', F(now.x, 2) + ' m'], ['Velocity v', F(now.v, 2) + ' m/s'], ['Acceleration a', F(now.a, 2) + ' m/s²']];
      if(c) rows.push(['Cursor', F(c.t, 1) + ' s'], ['Slope of x-t', F(c.slopeX, 2) + ' m/s'], ['Slope of v-t', F(c.slopeV, 2) + ' m/s²'], ['Area under v-t (0 to cursor)', F(c.dx, 2) + ' m'], ['Area under a-t (0 to cursor)', F(c.dv, 2) + ' m/s']);
      $('.mg-read').innerHTML = '<h3 class="ls-title-l">Readings</h3><table class="ls-tbl mg-tbl"><caption class="sr-only">Readings now</caption><tbody>' + rows.map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td class="r">' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>';
      // The studio's caption and pills.
      if(LS){
        var cap = head.replace(/<\/?b>/g, function(x){ return x; });
        if(cap !== lastCap){ LS.caption(cap, 'explore'); lastCap = cap; }
        var narrow = false; try{ narrow = matchMedia('(max-width: 599.98px)').matches; }catch(e){}
        var showA = st.drive === 'set' || st.exact, pills;
        if(narrow) pills = [{ html: '<span class="mg-pk">x</span> ' + F(now.x, 1) + ' m · <span class="mg-pk">v</span> ' + F(now.v, 1) + ' m/s' + (showA ? ' · <span class="mg-pk">a</span> ' + F(now.a, 1) + ' m/s²' : ''), tone: 'ghost' }];
        else { pills = [{ k: 'x', html: F(now.x, 1) + ' m', tone: 'readout' }, { k: 'v', html: F(now.v, 1) + ' m/s', tone: 'readout' }]; if(showA) pills.push({ k: 'a', html: F(now.a, 1) + ' m/s²', tone: 'readout' }); }
        LS.pills(pills, 'left', 'explore');
        var right = [];
        if(st.running) right.push({ html: '● ' + (narrow ? '' : 'Recording ') + F(st.clock, 1) + ' s', tone: 'accent' });
        else if(st.result) right.push({ html: 'Match ' + st.result.score + '%', tone: st.result.score >= 80 ? 'good' : st.result.score >= 50 ? 'warn' : 'bad' });
        else if(st.done) right.push({ html: 'Tap a graph to read it', tone: 'ghost' });
        LS.pills(right, 'right', 'explore');
      }
    }
    function motionWhy(now, d){
      var v = now.v, a = now.a;
      if(d.change === 'rest') return 'v = 0, so the x-t graph is flat right now and the v-t graph sits on the axis.';
      if(d.change === 'turn') return 'v is zero for an instant but a is not, so the cart is turning around: the x-t graph has a peak or a valley here.';
      var s = 'v is ' + (v > 0 ? 'positive' : 'negative') + ' (' + sgn(v, 2) + ' m/s), so x is ' + (v > 0 ? 'increasing' : 'decreasing') + ' and the x-t graph slopes ' + (v > 0 ? 'up' : 'down') + '. ';
      if(d.change === 'const') return s + 'a ≈ 0, so v is steady: the x-t graph is straight and v-t is flat.';
      return s + 'a is ' + (a > 0 ? 'positive' : 'negative') + ' (' + sgn(a, 2) + ' m/s²), ' + (d.change === 'up' ? 'the same sign as v, so the cart speeds up' : 'opposite to v, so the cart slows down') + ': v-t slopes ' + (a > 0 ? 'up' : 'down') + ' and x-t curves ' + (a > 0 ? 'upward' : 'downward') + '.';
    }
    function matchTip(tg){
      return tg.kind === 'x'
        ? '<p>On a position-time target, height is where the cart is and steepness is how fast it moves. A flat piece means stand still; a steeper piece means move faster.</p>'
        : '<p>On a velocity-time target, height is how fast and which way the cart moves, not where it is. Above the axis: move right; below: move left; on the axis: hold still. A sloped piece means speed up or slow down steadily.</p>';
    }

    /* ================================================ the redraw */
    function draw(full){
      var now = nowState();
      if(!geo) sceneLayout();
      if(!gl) graphsLayout();
      drawScene(now);
      var c = cursorInfo(now.m);
      drawGraphs(now.m);
      graphsWrap.setAttribute('aria-valuenow', M.fixed(st.cursor == null ? 0 : st.cursor, 1));
      graphsWrap.setAttribute('aria-valuetext', st.cursor == null ? 'No cursor yet' : 't = ' + F(c ? c.t : st.cursor, 1) + ' s');
      if(full || !st.running || (now.t * 4 | 0) !== (draw.q || 0)){ draw.q = (now.t * 4) | 0; words(now, c); }
    }
    // Redraw at the right size whenever the stage changes size.
    if(window.ResizeObserver){
      var ro = new ResizeObserver(function(){ var w1 = Math.round(sceneSvg.clientWidth), w2 = Math.round(graphsWrap.clientWidth), h2 = Math.round(graphsWrap.clientHeight);
        if(geo && w1 === geo.w && gl && w2 === gl.w && (h2 === gl.h || (!LS && h2 <= 150))) return;
        var f = document.activeElement === cartG; geo = null; gl = null; draw(true); if(f && cartG) cartG.focus(); });
      ro.observe(sceneSvg.parentNode); ro.observe(graphsWrap);
    }

    /* ================================================ Tool Studio */
    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'phys-ls-stage mg-ls-stage';
      stage.appendChild($('.mg-stage'));
      s.add('stage', stage, o);
      var dock = document.createElement('div'); dock.className = 'phys-ls-dock mg-ls-dock';
      dock.appendChild($('.mg-ctl'));
      s.add('dock', dock, o);
      var why = document.createElement('div'); why.className = 'ls-sec phys-ls-why mg-ls-why';
      why.appendChild($('.mg-say')); why.appendChild($('.mg-cur'));
      s.add('why', why, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      var det = document.createElement('div'); det.className = 'ls-sec phys-ls-det';
      det.appendChild($('.mg-read'));
      var more = pane.querySelector('details.bt-more'); if(more){ more.open = true; more.querySelector('summary').textContent = 'Start position and how the graphs are measured'; det.appendChild(more); }
      s.add('details', det, o);
      geo = null; gl = null;
      draw(true);
      if(s.mode() === 'explore') s.hint({ target: cartG, text: 'Drag the cart', key: 'apphys-motion-graphs-cart' });
    }

    reset();
    if(!targets.length) driveBtns[2].hidden = true;
    return { pause: function(){ if(st.running) { if(st.drive === 'set') pause(); else finish(); } }, studio: studio };
  }

  /* ================================================================ quiz figures */
  /* A static graph for a drill problem (fig from the model): straight
     segments or a smooth curve, a highlighted segment, a shaded area, a
     marked moment. Drawn in a fixed viewBox like ApPhysTools.plot. */
  function graphSvg(f, o){
    o = o || {};
    var W = o.w || 520, H = o.h || 260, L = o.small ? 30 : 52, R = o.R || (o.small ? 8 : 14), T0 = o.small ? 8 : 14, B = o.small ? 20 : 40, pw = W - L - R, ph = H - T0 - B;
    var ymin = f.ymin, ymax = f.ymax, step = f.step || 1, tmax = f.tmax;
    var sx = function(t){ return L + t / tmax * pw; }, sy = function(y){ return T0 + ph - (y - ymin) / (ymax - ymin) * ph; };
    var p = [], k = f.kind, cls = { x: 's1', v: 's2', a: 's3' }[k];
    for(var t = 0; t <= tmax + 1e-9; t += 1){ p.push('<line class="grid" x1="' + sx(t).toFixed(1) + '" x2="' + sx(t).toFixed(1) + '" y1="' + T0 + '" y2="' + (T0 + ph) + '"/>'); if(o.small ? t % 2 === 0 : true) p.push('<text class="tick" x="' + sx(t).toFixed(1) + '" y="' + (T0 + ph + 16) + '" text-anchor="middle">' + t + '</text>'); }
    var ys = Math.ceil(ymin / step) * step;
    // Gridlines closer than 18 units (a short phone drawing) get every other number, 0 always.
    var every = ph / ((ymax - ymin) / step) < 18 ? 2 : 1;
    for(var y = ys; y <= ymax + 1e-9; y += step){ y = M.round(y, 6); p.push('<line class="grid" x1="' + L + '" x2="' + (L + pw) + '" y1="' + sy(y).toFixed(1) + '" y2="' + sy(y).toFixed(1) + '"/>' + (every === 1 || Math.round(y / step) % 2 === 0 ? '<text class="tick" x="' + (L - 6) + '" y="' + (sy(y) + 4).toFixed(1) + '" text-anchor="end">' + M.minus(String(y)) + '</text>' : '')); }
    p.push('<line class="zero" x1="' + L + '" x2="' + (L + pw) + '" y1="' + sy(0).toFixed(1) + '" y2="' + sy(0).toFixed(1) + '"/>');
    p.push('<line class="axis" x1="' + L + '" y1="' + T0 + '" x2="' + L + '" y2="' + (T0 + ph) + '"/><line class="axis" x1="' + L + '" y1="' + (T0 + ph) + '" x2="' + (L + pw) + '" y2="' + (T0 + ph) + '"/>');
    if(f.shade){
      var a = f.shade[0], b = f.shade[1], pts = [sx(a).toFixed(1) + ',' + sy(0).toFixed(1)];
      pts.push(sx(a).toFixed(1) + ',' + sy(MG.plAt(f.pts, a)).toFixed(1));
      f.pts.forEach(function(q){ if(q[0] > a && q[0] < b) pts.push(sx(q[0]).toFixed(1) + ',' + sy(q[1]).toFixed(1)); });
      pts.push(sx(b).toFixed(1) + ',' + sy(MG.plAt(f.pts, b)).toFixed(1), sx(b).toFixed(1) + ',' + sy(0).toFixed(1));
      p.push('<polygon class="mg-area s1" points="' + pts.join(' ') + '"/>');
    }
    var line = f.curve || f.pts;
    p.push('<polyline class="series ' + cls + '" points="' + line.map(function(q){ return sx(q[0]).toFixed(1) + ',' + sy(q[1]).toFixed(1); }).join(' ') + '"/>');
    if(f.hl) f.hl.forEach(function(i){ var a2 = f.pts[i], b2 = f.pts[i + 1]; p.push('<line class="mg-hl" x1="' + sx(a2[0]).toFixed(1) + '" y1="' + sy(a2[1]).toFixed(1) + '" x2="' + sx(b2[0]).toFixed(1) + '" y2="' + sy(b2[1]).toFixed(1) + '"/>'); });
    if(!f.curve) f.pts.forEach(function(q){ p.push('<circle class="pt ' + cls + '" cx="' + sx(q[0]).toFixed(1) + '" cy="' + sy(q[1]).toFixed(1) + '" r="3.5"/>'); });
    if(f.mark != null){ var ym = f.curve ? MG.interp(f.curve.map(function(q){ return q[0]; }), f.curve.map(function(q){ return q[1]; }), f.mark) : MG.plAt(f.pts, f.mark);
      p.push('<line class="vline" x1="' + sx(f.mark).toFixed(1) + '" x2="' + sx(f.mark).toFixed(1) + '" y1="' + T0 + '" y2="' + (T0 + ph) + '"/><circle class="mg-cur-pt" cx="' + sx(f.mark).toFixed(1) + '" cy="' + sy(ym).toFixed(1) + '" r="6"/>'); }
    if(o.small){
      // Steps join with vertical risers, as a hand-drawn a-t graph would.
      if(!f.curve) p.push('<polyline class="series ' + cls + '" points="' + f.pts.map(function(q){ return sx(q[0]).toFixed(1) + ',' + sy(q[1]).toFixed(1); }).join(' ') + '"/>');
      p.push('<text class="lbl mg-sm-l" x="' + (L + 4) + '" y="' + (T0 + 12) + '">a (m/s²)</text>');
    } else {
      p.push('<text class="lbl" x="' + (L + pw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">t (s)</text>');
      p.push('<text class="lbl" transform="translate(14 ' + (T0 + ph / 2) + ') rotate(-90)" text-anchor="middle">' + k + ' (' + UNIT[k] + ')</text>');
    }
    return '<svg class="phys-svg bt-plot mg-fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || f.label) + '">' + p.join('') + '</svg>';
  }
  /* A small a-t graph (three flat steps) for "pick the a-t graph" options. */
  function stepsSvg(g, range, label){
    var f;
    if(g.type === 'line') f = { kind: 'a', pts: g.pts, tmax: 6, ymin: -range, ymax: range, step: range };
    else { var pts = []; g.a.forEach(function(a, k){ pts.push([2 * k, a], [2 * k + 2, a]); }); f = { kind: 'a', pts: pts, tmax: 6, ymin: -range, ymax: range, step: range };
      f.label = label; }
    var s = graphSvg(f, { w: 190, h: 120, small: true, label: label });
    // The steps are drawn without their joining verticals' dots.
    return s.replace(/<circle class="pt[^>]*>/g, '');
  }

  /* ================================================================ quiz */
  function quiz(host, data){
    var TYPES = [
      { value: 'slope', label: 'Velocity from the slope of x-t' },
      { value: 'area', label: 'Displacement from the area under v-t' },
      { value: 'pick', label: 'Pick the a-t graph for a v-t graph' },
      { value: 'describe', label: 'Describe the motion from a graph' },
      { value: 'signs', label: 'Signs of velocity and acceleration' },
      { value: 'turn', label: 'Turning points' },
      { value: 'dist', label: 'Distance and displacement' }
    ];
    T.drill(host, data, {
      slug: 'motion-graphs', types: TYPES, typeLabel: 'Kind of problem',
      title: function(p){ var t = TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Practice problem'; },
      generate: function(r, ctx, type){
        var p = MG.generate(r, ctx, type);
        if(p.type === 'pick'){
          var s = p.steps[0];
          s.optionsHtml = p.graphs.map(function(g, i){ return stepsSvg(g, p.range, 'Acceleration-time graph: ' + s.options[i]); });
        }
        return p;
      },
      extra: function(el, p){
        // A phone gets a narrower drawing, so its labels stay readable.
        var narrow = false; try{ narrow = matchMedia('(max-width: 599.98px)').matches; }catch(e){}
        if(p.fig){ el.innerHTML = '<figure class="cd-fig mg-qfig">' + graphSvg(p.fig, narrow ? { w: 340, h: 230 } : null) + '</figure>'; qfig = { el: el, fig: p.fig }; requestAnimationFrame(fitQ); }
        else qfig = null;
      }
    });
    /* On a phone (either way up) the graph is redrawn at its box's own size
       (1 unit = 1 px), so its numbers are their CSS size and it fills the box. */
    var qfig = null, rq = 0;
    function fitQ(){
      if(!qfig || !qfig.el.isConnected || !qfig.el.closest('.ls-phone')) return;
      var svg = qfig.el.querySelector('.mg-qfig svg'); if(!svg) return;
      var r = svg.getBoundingClientRect(), ms = getComputedStyle(svg).maxHeight, mh = /px$/.test(ms) ? parseFloat(ms) : Infinity;
      if(r.width < 120) return;
      var w = Math.round(r.width), h = Math.round(Math.max(100, Math.min(isFinite(mh) ? mh : r.height, r.height, w * 0.8)));
      // A graph at the bottom of the stage keeps its right end clear of the Enlarge button.
      var stg = svg.closest('.ls-stage'), low = stg && stg.getBoundingClientRect().bottom - r.bottom < 56;
      if(svg.getAttribute('data-fit') === w + 'x' + h + low) return;
      svg.outerHTML = graphSvg(qfig.fig, { w: w, h: h, R: low ? 62 : 0 }).replace('<svg ', '<svg data-fit="' + w + 'x' + h + low + '" ');
    }
    window.addEventListener('resize', function(){ if(rq) return; rq = requestAnimationFrame(function(){ rq = 0; fitQ(); }); });
  }
})();
