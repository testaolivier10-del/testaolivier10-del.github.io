/* Motion graphs, tools v2 (docs/tools-v2-phys-motion-graphs-brief.md; the standard: docs/tools-v2-standard.md).
   On the shared kit (assets/course/tool-kit2.js) through the course adapter ApPhysTools.studioKit2 (phys-tools.js).
   OWNED BY THIS TOOL ONLY. Model: ApPhysMath.motionGraphs (tools/math/motion-graphs.js), unchanged.

   The one idea: the x, v and a graphs are three views of one motion; the slope of each is the next.
   EXPLORE, two tabs:
   1 Drive it. A dynamics cart on a 10 m track on a lab bench, a motion detector at the left end. Drag the cart (or
     hold the arrow keys): the detector records 10 s from the first touch and the x, v and a graphs under the track
     draw live; v and a are slopes measured from the recorded positions (as a real detector does). The cart carries
     its v and a arrows, in the colors of their graphs. The landing shows an example run already drawn. After a run,
     drag along the graphs (the time cursor) and the cart goes back to that moment; Replay plays it again.
   2 Set v and a. Drag the tip of the cart's velocity arrow (v₀) and of its acceleration arrow (a): the whole run and
     its three graphs redraw at once (exact constant acceleration); let go and the cart runs it. The cart itself is
     a quiet control here: drag it to choose where it starts.
   At the time cursor: the tangent to x-t (in v's color, its slope is v), the tangent to v-t (in a's color, its
   slope is a) and the area under v-t from 0 (in x's color, it is Δx); a turn is named where v crosses zero.
   Every change is animated (the cart rolls, the graphs draw, the example fades, the cart fades back to its start
   after a run); every number and word is read from what is drawn on that frame.

   TEST YOURSELF: ApPhysTools.drill over the model's seven problem kinds (records motion-graphs:<context>:<step>,
   ?seed=, #quiz unchanged) and "Match the graph" (the old Match mode): drive the cart to trace a target, then
   Check; recorded as motion-graphs:match:<target>. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath;
  (function(){ var me = document.currentScript, href = me && me.src ? me.src.replace(/\.js(\?.*)?$/, '.css') : '';
    if(href && !document.querySelector('link[href$="tools/motion-graphs.css"]')){ var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); } })();
  var appEl = document.getElementById('app');
  if(appEl) appEl.setAttribute('data-details-title', 'How it works');
  if(!T || !M || !M.motionGraphs) return;
  var MG = M.motionGraphs, F = T.F, esc = T.esc;
  var WIN = MG.WINDOW, TR = MG.TRACK, DT = 0.05;
  var RANGE = { x: [-5, 5], v: [-4, 4], a: [-3, 3] };
  var UNIT = { x: 'm', v: 'm/s', a: 'm/s²' };
  var GNAME = { x: 'position x', v: 'velocity v', a: 'acceleration a' };
  var CLS = { x: 's1', v: 's2', a: 's3' };
  // Measured v and a from a hand drive: least squares slopes over ±0.2 s (v) and ±0.4 s (a) of the positions
  // resampled every 0.05 s (stated in "?").
  var HV = 0.2, HA = 0.4;
  var EX = { x0: -4, v0: 0, segs: [{ dur: 2, a: 0.6 }, { dur: 2, a: 0 }, { dur: 2, a: -0.6 }, { dur: 2, a: -0.6 }, { dur: 2, a: 0 }] };
  var SET0 = { x0: -3, v0: 2.0, a: -0.4 };
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function n1(x){ return Math.round(x * 10) / 10; }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function r1(x){ var y = Math.round(x * 10) / 10; return y === 0 ? 0 : y; }
  function sg(x, d){ d = d == null ? 1 : d; var s = F(x, d); return Number(M.fixed(x, d)) > 0 ? '+' + s : Number(M.fixed(x, d)) === 0 ? F(0, d) : s; }
  function storeGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function storeSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
  function slopeIdx(t, y, i, half){
    var n = 0, st = 0, sy = 0, stt = 0, sty = 0, k = Math.ceil(half / DT + 1e-9);
    for(var j = Math.max(0, i - k); j <= Math.min(t.length - 1, i + k); j++){
      if(Math.abs(t[j] - t[i]) > half + 1e-9) continue;
      n++; st += t[j]; sy += y[j]; stt += t[j] * t[j]; sty += t[j] * y[j];
    }
    var den = n * stt - st * st;
    return n < 2 || Math.abs(den) < 1e-12 ? 0 : (n * sty - st * sy) / den;
  }
  /* The exact run for x0, v0, a (Set v and a, the example, a shown Match answer): sampled every 0.05 s up to 10 s
     or the moment it reaches an end stop, where it stops dead (v drops to 0; the a spike is too narrow to draw). */
  function exactRun(x0, v0, segs){
    var mo = MG.motion(x0, v0, segs), tEnd = MG.edgeTime(mo, WIN), s = { t: [], x: [], v: [], a: [], hit: null, exact: true };
    var n = Math.floor(tEnd / DT + 1e-9);
    // each change of a is drawn as a step: the boundary twice, same t, x and v, the old a then the new one (the
    // cursor at the boundary reads the new piece)
    var bounds = [], tb = 0;
    (segs || []).forEach(function(q, i){ tb += q.dur; if(i < segs.length - 1 && tb > 1e-9 && tb < tEnd - 1e-9) bounds.push({ t: tb, a0: q.a, a1: segs[i + 1].a }); });
    var bi = 0;
    for(var i = 0; i <= n; i++){
      var ti = i * DT;
      while(bi < bounds.length && bounds[bi].t <= ti + 1e-9){
        var b = bounds[bi++], qb = mo.at(b.t);
        s.t.push(b.t); s.x.push(qb.x); s.v.push(qb.v); s.a.push(b.a0); s.t.push(b.t); s.x.push(qb.x); s.v.push(qb.v); s.a.push(b.a1);
      }
      if(s.t.length && Math.abs(s.t[s.t.length - 1] - ti) < 1e-9) continue;
      var q = mo.at(ti); s.t.push(ti); s.x.push(q.x); s.v.push(q.v); s.a.push(q.a);
    }
    if(tEnd < WIN - 1e-9){
      var e = mo.at(tEnd), xe = clamp(e.x, TR.min, TR.max);
      if(s.t[s.t.length - 1] < tEnd - 1e-6){ s.t.push(tEnd); s.x.push(xe); s.v.push(e.v); s.a.push(e.a); }
      s.t.push(tEnd + 1e-4); s.x.push(xe); s.v.push(0); s.a.push(0);
      s.hit = { t: tEnd, x: xe };
    } else if(s.t[s.t.length - 1] < WIN - 1e-9){ var z = mo.at(WIN); s.t.push(WIN); s.x.push(z.x); s.v.push(z.v); s.a.push(z.a); }
    s.end = s.t[s.t.length - 1];
    return s;
  }
  function at(s, k, t){ return MG.interp(s.t, s[k], t); }
  /* Where v crosses zero and keeps going the other way (a turn), up to time tMax. */
  function turnsOf(s, tMax, eps){
    var out = [], sign = 0, lastI = -1;
    for(var i = 0; i < s.t.length && s.t[i] <= tMax + 1e-9; i++){
      var v = s.v[i];
      if(s.hit && s.t[i] > s.hit.t) break;
      var sv = v > eps ? 1 : v < -eps ? -1 : 0;
      if(!sv) continue;
      if(sign && sv !== sign){
        // the crossing between lastI and i: the x extreme there
        var best = lastI;
        for(var j = lastI; j <= i; j++) if(sign > 0 ? s.x[j] > s.x[best] : s.x[j] < s.x[best]) best = j;
        out.push({ t: s.t[best], x: s.x[best], peak: sign > 0 });
      }
      sign = sv; lastI = i;
    }
    return out;
  }
  /* The result word for the drawn moment t of series s. Near v = 0 it reads the drawn v around t: "turning around"
     only where v changes sign there; "starting from rest" where it grows from rest; "stopping" where it falls to rest. */
  function describeText(v, a, exact, s, t){
    var ev = exact ? 0.02 : 0.08, ea = exact ? 0.02 : 0.4;
    // a hand drive's first 0.6 s: a's window is not full yet
    if(!exact && s && t < HV + HA - 1e-9) return { t: 'measuring', k: 'meas' };
    var dir = Math.abs(v) < ev ? 0 : v > 0 ? 1 : -1, ad = Math.abs(a) < ea ? 0 : a > 0 ? 1 : -1;
    if(!dir){
      if(!s) return { t: 'at rest', k: 'rest' };
      var end = s.t[s.t.length - 1], dt = exact ? 0.3 : 0.35, ew = exact ? 0.02 : 0.12;
      var vb = t - dt >= 0 ? at(s, 'v', t - dt) : null, va2 = t + dt <= end ? at(s, 'v', t + dt) : null;
      if(vb != null && va2 != null && Math.abs(vb) > ew && Math.abs(va2) > ew && vb * va2 < 0) return { t: 'turning around', k: 'turn' };
      if(va2 != null && Math.abs(va2) > ew && (vb == null || Math.abs(vb) <= ew)) return { t: 'starting from rest', k: 'start' };
      if(vb != null && Math.abs(vb) > ew) return { t: 'stopping', k: 'stop' };
      return { t: 'at rest', k: 'rest' };
    }
    if(!ad) return { t: 'steady to the ' + (dir > 0 ? 'right' : 'left'), k: 'const' };
    return ad === dir ? { t: 'speeding up', k: 'up' } : { t: 'slowing down', k: 'down' };
  }

  function boot(){
    T.mount('motion-graphs', function(app, data){
      document.body.classList.add('mg-root');
      var ex = null, kit = !!(window.LevlKit2 && window.LevlStudio && app.getAttribute('data-studio'));
      T.modes(app, { slug: 'motion-graphs', explore: function(pane){ ex = explore(pane, data, kit); },
        quiz: function(pane){ quiz(pane, data); },
        onShow: function(m){ if(ex) ex.shown(m); quizShown(m); },
        studio: kit ? { kit2: function(pane, s){ return ex.kit2(pane, s); } } : {} });
      if(!kit || !T.studioOf(app)) ex.plain();
    });
  }

  /* ================================================================ the lab (the picture and its controls) */
  /* lab(o): one picture: the scene (wall, bench, track, detector, cart) over the three stacked graphs, with the
     controls on it. o: { kit, match: target | null, onRun(series) } */
  function lab(o){
    var K = window.LevlKit2, kit = !!(o.kit && K), match = o.match || null;
    var gid = T.nid('mg2');
    var box = document.createElement('div'); box.className = 'mg2-scene' + (match ? ' is-match' : ''); box.id = gid;
    box.innerHTML = '<svg class="mg2-svg" xmlns="http://www.w3.org/2000/svg" role="img" data-ls-text="keep"></svg>';
    var svg = box.querySelector('svg');
    var layer = kit ? K.layer(box) : { el: document.createElement('div'), scale: function(){ return 1; } };
    var st = {
      tab: 'drive', mode: 'explore',
      // Drive it: the recorded run (raw frame samples and the 0.05 s grid with measured v and a)
      drv: { raw: { t: [], x: [] }, g: null, clock: 0, rec: false, done: false, x: match ? startOfTarget(match) : EX.x0, kv: 0, hold: false, example: !match },
      set: { x0: SET0.x0, v0: SET0.v0, a: SET0.a, segs: [{ t0: 0, a: SET0.a }], run: null },
      cursor: WIN, play: null, back: null, fade: 0, pulse: 0
    };
    var exampleRun = exactRun(EX.x0, EX.v0, EX.segs);
    st.set.run = exactRun(st.set.x0, st.set.v0, [{ dur: WIN, a: st.set.a }]);
    if(match){ st.drv.example = false; st.cursor = 0; }
    else st.drv.x = at(exampleRun, 'x', WIN);
    var G = null, W = 640, H = 480, built = '', D = {};
    var KINDS = match ? [match.kind] : ['x', 'v', 'a'];
    function shownK(k){ return KINDS.indexOf(k) > -1; }
    var raf = 0, lastT = 0, listeners = [];

    function startOfTarget(tg){ return tg.kind === 'x' ? tg.pts[0][1] : tg.x0 != null ? tg.x0 : 0; }
    /* The series drawn now: the drive's record (or the example), or the exact Set run. */
    function series(){
      if(st.tab === 'set') return st.set.run;
      if(st.drv.g && st.drv.g.t.length) return st.drv.g;
      return st.drv.example ? exampleRun : null;
    }
    function seriesEnd(s){ return s ? s.t[s.t.length - 1] : 0; }
    /* The drawn moment: the cursor, within what is drawn. */
    function curT(){ var s = series(); return s ? clamp(st.cursor, 0, seriesEnd(s)) : 0; }
    function cartX(){
      if(st.tab === 'drive'){ if(st.drv.rec || st.drv.hold || !series()) return st.drv.x; return at(series(), 'x', curT()); }
      return at(st.set.run, 'x', curT());
    }
    /* v and a on the cart: the drawn values at the drawn moment (while recording, the newest measured point). */
    function nowVA(){
      var s = series(), t = curT();
      if(!s) return { v: 0, a: 0, t: 0, have: false };
      return { v: at(s, 'v', t), a: at(s, 'a', t), t: t, have: true, x: at(s, 'x', t) };
    }

    /* ---------------------------------------------------------------- geometry */
    function geo(W, Hin, phone, fitH){
      if(fitH == null) fitH = phone;
      var pad = phone ? 10 : clamp(Math.round(W * 0.025), 16, 36);
      var cw = phone ? 60 : clamp(Math.round(W * 0.075), 76, 128), ch = Math.round(cw * 0.36), wr = Math.round(cw * 0.12);
      var detW = phone ? 26 : 34;
      var xL = pad + detW + 14 + cw / 2, xR = W - pad - cw / 2 - 10, ppm = (xR - xL) / (TR.max - TR.min);
      // the scene, from the top: room for the a arrow's knob, the v arrow, the cart's knob, the cart, the rail, the bench
      // (Match has no arrow knobs: its rows sit closer)
      var aY = match ? 17 : 22, vY = aY + (match ? 27 : 36), kY = vY + 34, cartTop = kY + 20;
      var railTop = cartTop + ch + 2 * wr - 2, railH = phone ? 17 : 19, benchY = railTop + railH + 3, sceneH = benchY + (phone ? 16 : 22);
      var gTop = sceneH + 22, gap = phone ? 9 : 11, axisB = 27, L = phone ? 36 : 46, R = phone ? 44 : 40;
      // Match on a phone: the stage's Enlarge button sits at the bottom right, so "t (s)" moves left and the axis ends short of it
      var tLeft = !!match && phone; if(tLeft){ L = 44; R = 62; }
      // the panels shown (Match shows only its target's graph), stacked on one time axis
      var kinds = KINDS, n = kinds.length;
      var ph = fitH ? clamp(Math.floor((Hin - gTop - axisB - (n - 1) * gap) / n), 64, n === 1 ? 170 : phone ? 112 : 130) : Math.floor((Hin - gTop - axisB - (n - 1) * gap) / n);
      if(!fitH && ph > 170){ ph = 170; }
      var Hh = gTop + n * ph + (n - 1) * gap + axisB;
      if(!fitH) Hh = Math.max(Hh, Hin);
      var top = { x: -1e4, v: -1e4, a: -1e4 };
      kinds.forEach(function(k, i){ top[k] = gTop + i * (ph + gap); });
      // the arrows' scales: the longest (3 m/s, 2 m/s²) fits on the picture from any start (−3 m to 3 m)
      var room = Math.min(xL + 2 * ppm, W - (xL + 8 * ppm)) - 22;
      var vs = Math.min(56, room / 3), as = Math.min(70, room / 2);
      return { W: W, H: Hh, phone: phone, fitH: fitH, pad: pad, cw: cw, ch: ch, wr: wr, detW: detW, xL: xL, xR: xR, ppm: ppm, aY: aY, vY: vY, kY: kY, cartTop: cartTop,
        railTop: railTop, railH: railH, benchY: benchY, sceneH: sceneH, gTop: gTop, gap: gap, L: L, R: R, pw: W - L - R, ph: ph, top: top, kinds: kinds, gTop: gTop, tLeft: tLeft, axisY: gTop + n * ph + (n - 1) * gap, vs: vs, as: as };
    }
    function X(x){ return G.xL + (x - TR.min) * G.ppm; }
    // a panel's tick numbers: the top one under the scrub's knob, the bottom one clear of the next panel's top
    function tickY(k, y){ var r = RANGE[k]; return y === r[1] ? G.top[k] + 12.5 : y === r[0] ? G.top[k] + G.ph - 3 : gy(k, y) + 4; }
    function gx(t){ return G.L + t / WIN * G.pw; }
    function gy(k, y){ var r = RANGE[k]; return G.top[k] + G.ph - (y - r[0]) / (r[1] - r[0]) * G.ph; }

    /* ---------------------------------------------------------------- building the static picture */
    function build(){
      var g = G, p = [], W = g.W;
      p.push('<defs>' +
        '<linearGradient id="' + gid + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="mg2-wall1"/><stop offset="1" class="mg2-wall2"/></linearGradient>' +
        '<linearGradient id="' + gid + 'r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="mg2-al1"/><stop offset=".55" class="mg2-al2"/><stop offset="1" class="mg2-al3"/></linearGradient>' +
        '<linearGradient id="' + gid + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="mg2-cb1"/><stop offset="1" class="mg2-cb2"/></linearGradient>' +
        '<linearGradient id="' + gid + 't" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="mg2-t1"/><stop offset="1" class="mg2-t2"/></linearGradient>' +
        ['x', 'v', 'a'].map(function(k){ return '<clipPath id="' + gid + 'c' + k + '"><rect x="' + g.L + '" y="' + (g.top[k] - 1) + '" width="' + g.pw + '" height="' + (g.ph + 2) + '"/></clipPath>'; }).join('') +
        '</defs>');
      // the lab: a wall, a bench top and its front edge
      p.push('<rect x="0" y="0" width="' + W + '" height="' + g.benchY + '" fill="url(#' + gid + 'w)"/>');
      for(var yy = 22; yy < g.benchY - 4; yy += 22) p.push('<line class="mg2-tile" x1="0" x2="' + W + '" y1="' + yy + '" y2="' + yy + '"/>');
      // the lab wall in panels, a skirting board on the bench's line (no object that could be read as a part)
      var pw2 = g.phone ? 120 : 180;
      for(var xx2 = pw2; xx2 < W; xx2 += pw2) p.push('<line class="mg2-seam" x1="' + xx2 + '" x2="' + xx2 + '" y1="0" y2="' + g.benchY + '"/>');
      p.push('<rect class="mg2-skirt" x="0" y="' + (g.benchY - 7) + '" width="' + W + '" height="7"/>');
      p.push('<rect x="0" y="' + g.benchY + '" width="' + W + '" height="' + (g.sceneH - g.benchY) + '" fill="url(#' + gid + 't)"/>');
      p.push('<rect class="mg2-edge" x="0" y="' + (g.sceneH - 4) + '" width="' + W + '" height="4"/>');
      // the track: an aluminum rail with a meter tape on its face, end stops
      var r0 = X(TR.min) - g.cw / 2 - 8, r1 = X(TR.max) + g.cw / 2 + 8;
      p.push('<rect class="mg2-shadow" x="' + n1(r0 + 4) + '" y="' + (g.railTop + g.railH) + '" width="' + n1(r1 - r0 - 8) + '" height="4" rx="2"/>');
      p.push('<rect class="mg2-rail" x="' + n1(r0) + '" y="' + g.railTop + '" width="' + n1(r1 - r0) + '" height="' + g.railH + '" rx="3" fill="url(#' + gid + 'r)"/>');
      p.push('<rect class="mg2-tape" x="' + n1(X(TR.min) - 6) + '" y="' + (g.railTop + 3) + '" width="' + n1(X(TR.max) - X(TR.min) + 12) + '" height="' + (g.railH - 5) + '" rx="1.5"/>');
      for(var m = TR.min; m <= TR.max + 1e-9; m += 0.5){
        var big = Math.abs(m - Math.round(m)) < 1e-9, xx = n1(X(m));
        p.push('<line class="mg2-tick' + (big ? ' big' : '') + '" x1="' + xx + '" x2="' + xx + '" y1="' + (g.railTop + 3) + '" y2="' + (g.railTop + 3 + (big ? 4 : 2.5)) + '"/>');
        if(big) p.push('<text class="mg2-tl' + (m === 0 ? ' zero' : '') + '" x="' + xx + '" y="' + (g.railTop + g.railH - 3.5) + '" text-anchor="middle">' + M.minus(String(m)) + '</text>');
      }
      [r0, r1 - 7].forEach(function(x){ p.push('<rect class="mg2-stop" x="' + n1(x) + '" y="' + (g.railTop - 12) + '" width="7" height="' + (g.railH + 12) + '" rx="2"/>'); });
      // the motion detector on its clamp at the left end, facing the cart
      var dx = r0 - g.detW - 4, dh = Math.round(g.detW * 1.05), dy = g.railTop - dh - 4;
      p.push('<g class="mg2-det" aria-hidden="true"><rect class="mg2-clamp" x="' + n1(dx + g.detW / 2 - 4) + '" y="' + (dy + dh - 2) + '" width="8" height="' + n1(g.railTop + g.railH - dy - dh + 2) + '" rx="2"/>' +
        '<rect class="mg2-det-b" x="' + n1(dx) + '" y="' + dy + '" width="' + g.detW + '" height="' + dh + '" rx="5"/>' +
        '<circle class="mg2-det-f" cx="' + n1(dx + g.detW - 3) + '" cy="' + n1(dy + dh / 2) + '" r="' + n1(dh * 0.36) + '"/>' +
        '<circle class="mg2-det-m" cx="' + n1(dx + g.detW - 3) + '" cy="' + n1(dy + dh / 2) + '" r="' + n1(dh * 0.24) + '"/>' +
        '<circle class="mg2-led" cx="' + n1(dx + 6) + '" cy="' + (dy + 6) + '" r="2.4"/></g>');
      D.detF = [dx + g.detW, dy + dh / 2];
      // the sonar pulses (shown while the detector measures)
      p.push('<g class="mg2-ping" aria-hidden="true">' + [0, 1, 2].map(function(k){ return '<path class="mg2-pw" style="animation-delay:' + (k * 0.22).toFixed(2) + 's" d=""/>'; }).join('') + '</g>');
      // the position pointer on the tape (x's color)
      p.push('<path class="mg2-xp" d=""/>');
      // the cart (drawn at 0, moved by transform)
      var cw = g.cw, ch = g.ch, wr = g.wr, top = -ch - 2 * wr + 2;
      var wheel = function(cx){ return '<g class="mg2-wheel" data-cx="' + n1(cx) + '"><circle class="mg2-tyre" cx="' + n1(cx) + '" cy="' + (-wr) + '" r="' + wr + '"/><circle class="mg2-hub" cx="' + n1(cx) + '" cy="' + (-wr) + '" r="' + n1(wr * 0.42) + '"/>' +
        '<path class="mg2-spk" d="M' + n1(cx - wr * 0.78) + ' ' + (-wr) + 'h' + n1(wr * 1.56) + 'M' + n1(cx) + ' ' + n1(-wr - wr * 0.78) + 'v' + n1(wr * 1.56) + '"/></g>'; };
      p.push('<g class="mg2-cart" aria-hidden="true">' +
        '<rect class="mg2-shadow" x="' + n1(-cw / 2 + 4) + '" y="-2" width="' + (cw - 8) + '" height="4" rx="2"/>' +
        wheel(-cw * 0.3) + wheel(cw * 0.3) +
        '<rect class="mg2-body" x="' + n1(-cw / 2) + '" y="' + n1(top) + '" width="' + cw + '" height="' + ch + '" rx="' + n1(ch * 0.25) + '" fill="url(#' + gid + 'b)"/>' +
        '<rect class="mg2-deck" x="' + n1(-cw / 2 + 3) + '" y="' + n1(top + 2) + '" width="' + (cw - 6) + '" height="' + n1(ch * 0.22) + '" rx="2"/>' +
        '<rect class="mg2-plunger" x="' + n1(cw / 2 - 1) + '" y="' + n1(top + ch * 0.42) + '" width="5" height="' + n1(ch * 0.26) + '" rx="1.5"/>' +
        '<rect class="mg2-card" x="' + n1(-cw / 2 - 2) + '" y="' + n1(top - ch * 0.9) + '" width="3.5" height="' + n1(ch * 0.95) + '" rx="1"/>' +
        '<circle class="mg2-pin" cx="0" cy="' + n1(top + ch * 0.62) + '" r="2.6"/></g>');
      // the arrows over the cart (v and a)
      p.push('<g class="mg2-arrows"><path class="mg2-arr mg2-va" d=""/><path class="mg2-arr mg2-aa" d=""/>' +
        '<text class="mg2-al is-v" x="0" y="0"></text><text class="mg2-al is-a" x="0" y="0"></text></g>');
      // the graphs: three stacked panels sharing one time axis
      g.kinds.forEach(function(k){
        var t0 = g.top[k], r = RANGE[k];
        p.push('<rect class="mg2-pbg' + (match && match.kind === k ? ' is-target' : '') + '" x="' + g.L + '" y="' + t0 + '" width="' + g.pw + '" height="' + g.ph + '" rx="6"/>');
        for(var t = 1; t < WIN; t++) p.push('<line class="mg2-grid" x1="' + n1(gx(t)) + '" x2="' + n1(gx(t)) + '" y1="' + t0 + '" y2="' + (t0 + g.ph) + '"/>');
        [r[0] / 2, r[1] / 2].forEach(function(y){ p.push('<line class="mg2-grid" x1="' + g.L + '" x2="' + (g.L + g.pw) + '" y1="' + n1(gy(k, y)) + '" y2="' + n1(gy(k, y)) + '"/>'); });
        p.push('<line class="mg2-zero" x1="' + g.L + '" x2="' + (g.L + g.pw) + '" y1="' + n1(gy(k, 0)) + '" y2="' + n1(gy(k, 0)) + '"/>');
        p.push('<line class="mg2-axis" x1="' + g.L + '" x2="' + g.L + '" y1="' + t0 + '" y2="' + (t0 + g.ph) + '"/>');
        [r[1], 0, r[0]].forEach(function(y){ var yy2 = tickY(k, y); p.push('<text class="mg2-tk" x="' + (g.L - 5) + '" y="' + n1(yy2) + '" text-anchor="end">' + M.minus(String(y)) + '</text>'); });
      });
      p.push('<line class="mg2-axis" x1="' + g.L + '" x2="' + (g.L + g.pw) + '" y1="' + g.axisY + '" y2="' + g.axisY + '"/>');
      var every = g.pw < 420 ? 2 : 1;
      for(var t2 = 0; t2 <= WIN; t2 += every) p.push('<text class="mg2-tk" x="' + n1(gx(t2)) + '" y="' + (g.axisY + 19) + '" text-anchor="middle">' + t2 + '</text>');
      p.push(g.tLeft ? '<text class="mg2-tk mg2-tn" x="4" y="' + (g.axisY + 19) + '">t (s)</text>' : '<text class="mg2-tk mg2-tn" x="' + (g.W - 4) + '" y="' + (g.axisY + 19) + '" text-anchor="end">t (s)</text>');
      // live layers: the area under v-t, the target (Match), the traces, the tangents, the cursor
      p.push('<path class="mg2-area" clip-path="url(#' + gid + 'cv)" d=""/>');
      if(match) p.push('<polyline class="mg2-target" clip-path="url(#' + gid + 'c' + match.kind + ')" points="' + match.pts.map(function(q){ return n1(gx(q[0])) + ',' + n1(gy(match.kind, q[1])); }).join(' ') + '"/>');
      ['x', 'v', 'a'].forEach(function(k){ p.push('<polyline class="mg2-tr ' + CLS[k] + '" clip-path="url(#' + gid + 'c' + k + ')" points=""/>'); });
      p.push('<line class="mg2-tan is-v" clip-path="url(#' + gid + 'cx)"/><line class="mg2-tan is-a" clip-path="url(#' + gid + 'cv)"/>');
      p.push('<line class="mg2-cur" x1="0" x2="0" y1="' + g.gTop + '" y2="' + g.axisY + '"/>');
      ['x', 'v', 'a'].forEach(function(k){ p.push('<circle class="mg2-dot ' + CLS[k] + '" r="5" cx="-20" cy="-20"/>'); });
      // the words on the graphs: each panel's name, the slopes, the area, a turn, the example's name, the target's name
      p.push('<g class="mg2-words"></g>');
      svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H); svg.setAttribute('width', g.W); svg.setAttribute('height', g.H);
      svg.innerHTML = p.join('');
      D = { detF: D.detF, cart: svg.querySelector('.mg2-cart'), spk: [].slice.call(svg.querySelectorAll('.mg2-spk')), va: svg.querySelector('.mg2-va'), aa: svg.querySelector('.mg2-aa'),
        vl: svg.querySelector('.mg2-al.is-v'), al: svg.querySelector('.mg2-al.is-a'), xp: svg.querySelector('.mg2-xp'), ping: svg.querySelector('.mg2-ping'), pw: [].slice.call(svg.querySelectorAll('.mg2-pw')),
        led: svg.querySelector('.mg2-led'), area: svg.querySelector('.mg2-area'), tr: { x: svg.querySelector('.mg2-tr.s1'), v: svg.querySelector('.mg2-tr.s2'), a: svg.querySelector('.mg2-tr.s3') },
        tanV: svg.querySelector('.mg2-tan.is-v'), tanA: svg.querySelector('.mg2-tan.is-a'), cur: svg.querySelector('.mg2-cur'), dots: { x: svg.querySelector('.mg2-dot.s1'), v: svg.querySelector('.mg2-dot.s2'), a: svg.querySelector('.mg2-dot.s3') },
        words: svg.querySelector('.mg2-words') };
      D.ping.querySelectorAll('path').forEach(function(pth, k){ var r = 9 + k * 7, x0 = D.detF[0] + 2, y0 = D.detF[1]; pth.setAttribute('d', 'M' + n1(x0 + r * 0.42) + ' ' + n1(y0 - r * 0.9) + 'A' + r + ' ' + r + ' 0 0 1 ' + n1(x0 + r * 0.42) + ' ' + n1(y0 + r * 0.9)); });
      lastPts = { x: '', v: '', a: '' }; lastWords = ''; lastKey = ''; lastS = null; wordsCache = null; areaKey = '';
    }

    /* ---------------------------------------------------------------- painting a frame */
    var lastPts = { x: '', v: '', a: '' }, lastWords = '', lastKey = '', lastS = null, wordsCache = null, areaKey = '', areaDx = 0;
    function arrowPath(x0, y, len, head){
      if(Math.abs(len) < 0.5) return '';
      var s = len > 0 ? 1 : -1, hl = Math.min(head, Math.abs(len)), x1 = x0 + len, xb = x1 - s * hl;
      return 'M' + n1(x0) + ' ' + n1(y - 2) + 'H' + n1(xb) + 'V' + n1(y - head * 0.55) + 'L' + n1(x1) + ' ' + n1(y) + 'L' + n1(xb) + ' ' + n1(y + head * 0.55) + 'V' + n1(y + 2) + 'H' + n1(x0) + 'Z';
    }
    /* The words on the picture, placed so none touches another (estimated text boxes, 4 px apart). */
    function placer(){
      var boxes = [];
      return {
        fits: function(b){ return boxes.every(function(q){ return b[2] + 5 <= q[0] || q[2] + 5 <= b[0] || b[3] + 5 <= q[1] || q[3] + 5 <= b[1]; }); },
        add: function(b){ boxes.push(b); },
        box: function(x, y, txt, fs, anchor){ var w = txt.length * fs * 0.64 + 3, l = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x; return [l, y - fs, l + w, y + fs * 0.32]; }
      };
    }
    function paint(){
      if(!G) return;
      var s = series(), t = curT(), x = cartX(), cx = X(x), g = G, va = nowVA();
      // the cart rolls (its wheels turn with the distance)
      D.cart.setAttribute('transform', 'translate(' + n1(cx) + ',' + g.railTop + ')');
      var ang = (x * g.ppm / g.wr) * 180 / Math.PI;
      D.spk.forEach(function(e){ var c = +e.parentNode.getAttribute('data-cx'); e.setAttribute('transform', 'rotate(' + n1(ang) + ' ' + c + ' ' + (-g.wr) + ')'); });
      D.cart.setAttribute('data-x', x.toFixed(4));
      D.xp.setAttribute('d', 'M' + n1(cx) + ' ' + (g.railTop + 3) + 'l-5 -6h10z');
      // the arrows: v and a at the drawn moment (Set, before the run: v₀ and a)
      var v = va.v, a = va.a;
      var vLen = v * g.vs, aLen = a * g.as;
      D.va.setAttribute('d', arrowPath(cx, g.vY, vLen, 11)); D.aa.setAttribute('d', arrowPath(cx, g.aY, aLen, 10));
      D.va.setAttribute('data-v', v.toFixed(4)); D.aa.setAttribute('data-a', a.toFixed(4));
      var vz = Math.abs(vLen) < 0.5, az = Math.abs(aLen) < 0.5, setHandles = st.tab === 'set' && !st.play && !st.back, aHandle = st.tab === 'set' && !st.back;
      var lv = vz ? 'v = 0' : 'v', la = az ? 'a = 0' : 'a';
      // the arrow's name sits at its tail, on the side away from the tip (the tip is free for its knob and the cue)
      function name(el, txt, len, y, hd){
        // (a tip's knob sits past the tip, on the right at zero: there the name goes left)
        var zero = Math.abs(len) < 0.5, gapK = 8;
        var right = zero ? !hd : len < 0, xx = zero ? (hd ? cx - 9 : cx + 9) : right ? cx + gapK : cx - gapK;
        var w = txt.length * 13 * 0.58 + 4;
        if(!right && xx - w < 4){ right = true; xx = cx + len + 8 + (hd ? 16 : 0); }
        if(right && xx + w > g.W - 4){ right = false; xx = cx + Math.min(len, 0) - 8 - (hd ? 16 : 0); }
        var q = n1(xx) + '|' + n1(y + 4.5) + '|' + right + '|' + txt;
        if(el.__q === q) return; el.__q = q;
        el.setAttribute('x', n1(xx)); el.setAttribute('y', n1(y + 4.5)); el.setAttribute('text-anchor', right ? 'start' : 'end');
        if(el.textContent !== txt) el.textContent = txt;
      }
      name(D.vl, lv, vLen, g.vY, setHandles); name(D.al, la, aLen, g.aY, aHandle);
      // the detector pings while it measures
      var measuring = (st.tab === 'drive' && st.drv.rec) || !!st.play;
      D.ping.classList.toggle('is-on', measuring && !red());
      D.led.classList.toggle('is-on', measuring);
      // the traces (rebuilt only when what is drawn changes: a new point, a new run)
      var key = s ? (s === lastS ? 'same' : 'new') + ':' + s.t.length + ':' + s.v[s.v.length - 1] + ':' + s.a[s.a.length - 1] + ':' + s.x[s.x.length - 1] : 'none';
      if(key !== lastKey || s !== lastS){
        lastKey = key; lastS = s; wordsCache = null;
        ['x', 'v', 'a'].forEach(function(k){
          var pts = '';
          if(s){ var arr = []; for(var i = 0; i < s.t.length; i++) arr.push(n1(gx(s.t[i])) + ',' + n1(gy(k, s[k][i]))); pts = arr.join(' '); }
          if(pts !== lastPts[k]){ D.tr[k].setAttribute('points', pts); lastPts[k] = pts; }
        });
      }
      // the cursor, its dots, the tangents and the area at the drawn moment
      var have = !!s, cxg = n1(gx(t));
      D.cur.setAttribute('x1', cxg); D.cur.setAttribute('x2', cxg); D.cur.style.display = have ? '' : 'none';
      ['x', 'v', 'a'].forEach(function(k){ var d = D.dots[k]; if(!have){ d.setAttribute('cx', -20); return; } d.setAttribute('cx', cxg); d.setAttribute('cy', n1(clamp(gy(k, at(s, k, t)), g.top[k], g.top[k] + g.ph))); });
      var xNow = have ? at(s, 'x', t) : 0, vNow = va.v, aNow = va.a, half = 1.1;
      function tan(el, k, y0, slope){
        if(!have || match){ el.setAttribute('x1', -9); el.setAttribute('x2', -9); return; }
        var ta = clamp(t - half, 0, WIN), tb = clamp(t + half, 0, WIN);
        el.setAttribute('x1', n1(gx(ta))); el.setAttribute('x2', n1(gx(tb)));
        el.setAttribute('y1', n1(gy(k, y0 + slope * (ta - t)))); el.setAttribute('y2', n1(gy(k, y0 + slope * (tb - t))));
        el.setAttribute('data-slope', slope.toFixed(4));
      }
      tan(D.tanV, 'x', xNow, vNow); tan(D.tanA, 'v', vNow, aNow);
      var areaD = '', dxArea = 0, ak = lastKey + '|' + t.toFixed(4);
      if(ak === areaKey){ areaD = null; dxArea = areaDx; }
      else if(have && t > 0.02 && !match){
        var pts2 = ['M' + n1(gx(0)) + ' ' + n1(gy('v', 0))];
        for(var i2 = 0; i2 < s.t.length && s.t[i2] < t; i2++) pts2.push('L' + n1(gx(s.t[i2])) + ' ' + n1(gy('v', s.v[i2])));
        pts2.push('L' + cxg + ' ' + n1(gy('v', vNow)) + 'L' + cxg + ' ' + n1(gy('v', 0)) + 'Z');
        areaD = pts2.join('');
        dxArea = MG.areaTo(s.t, s.v, 0, t);
      }
      if(areaD !== null){ areaKey = ak; areaDx = dxArea; D.area.setAttribute('d', areaD); D.area.setAttribute('data-area', dxArea.toFixed(4)); }
      words(s, t, vNow, aNow, dxArea);
      paintAria(s, t, x, vNow, aNow);
    }
    /* The words on the graphs (one string; set only when it changes). */
    function words(s, t, vNow, aNow, dxArea){
      var wk = lastKey + '|' + t.toFixed(3) + '|' + vNow.toFixed(4) + '|' + aNow.toFixed(4);
      if(wk === wordsCache) return;
      wordsCache = wk;
      var g = G, P = placer(), out = [], fs = g.phone ? 12 : 12.5;
      // a word never sits on a drawn line: the traces, the tangents, the cursor
      var lines = [];
      if(s){
        g.kinds.forEach(function(k){ lines.push({ k: k, f: function(tt){ return gy(k, at(s, k, tt)); } }); });
        var t0 = t;
        if(shownK('x')) lines.push({ k: 'x', f: function(tt){ return Math.abs(tt - t0) <= 1.1 ? gy('x', at(s, 'x', t0) + vNow * (tt - t0)) : null; } });
        if(shownK('v')) lines.push({ k: 'v', f: function(tt){ return Math.abs(tt - t0) <= 1.1 ? gy('v', vNow + aNow * (tt - t0)) : null; } });
        if(match) lines.push({ k: match.kind, f: function(tt){ return gy(match.kind, MG.plAt(match.pts, tt)); }, w: 6 });
      }
      function yAt(L2, px){
        var c = L2.c || (L2.c = {}), key = px | 0;
        if(!(key in c)) c[key] = L2.f((key - g.L) / g.pw * WIN);
        return c[key];
      }
      function onLine(b){
        var cxg = gx(t);
        if(s && b[0] - 3 < cxg && b[2] + 3 > cxg && b[1] < g.axisY && b[3] > g.gTop) return true;
        for(var i = 0; i < lines.length; i++){
          var L2 = lines[i], top = g.top[L2.k], w = L2.w || 3;
          if(b[3] < top || b[1] > top + g.ph) continue;
          for(var px = Math.max(g.L, b[0] - 2); px <= Math.min(g.L + g.pw, b[2] + 2); px += 3){
            var yy = yAt(L2, px);
            if(yy != null && yy >= b[1] - w && yy <= b[3] + w) return true;
          }
        }
        return false;
      }
      function txt(x, y, s2, cls, anchor, force){
        var b = P.box(x, y, s2, fs, anchor);
        if(b[0] < 2 || b[2] > g.W - 2) return false;
        if(!force && (!P.fits(b) || onLine(b))) return false;
        P.add(b); out.push('<text class="' + cls + '" x="' + n1(x) + '" y="' + n1(y) + '"' + (anchor && anchor !== 'start' ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(s2) + '</text>'); return true;
      }
      // the tick numbers and the cursor's dots are things too: reserve them
      g.kinds.forEach(function(k){ var r = RANGE[k]; [r[1], 0, r[0]].forEach(function(y){ var yy2 = tickY(k, y); P.add(P.box(g.L - 5, yy2, M.minus(String(y)), 11.5, 'end')); }); });
      // each panel's name, top left inside it
      g.kinds.forEach(function(k){ txt(g.L + 8, g.top[k] + 15, GNAME[k] + ' (' + UNIT[k] + ')', 'mg2-gn ' + CLS[k], 'start', true); });
      if(s && s === exampleRun) txt(g.L + g.pw - 8, g.top.x + 15, 'Example run', 'mg2-w is-ex', 'end', true);
      if(match) txt(g.L + g.pw - 8, g.top[match.kind] + 15, 'target', 'mg2-w is-tg', 'end', true);
      if(s && !match){
        var cx = gx(t), right = t < WIN * 0.62;
        // the slopes, by their tangents
        var yx = gy('x', at(s, 'x', t)), yv = gy('v', vNow);
        var tryAt = function(k, y0, label, cls){
          var sides = right ? [[cx + 12, 'start'], [cx + 64, 'start'], [cx - 12, 'end'], [cx + 116, 'start']] : [[cx - 12, 'end'], [cx - 64, 'end'], [cx + 12, 'start'], [cx - 116, 'end']];
          var ys = [y0 - 14, y0 + 24, y0 - 30, y0 + 40, g.top[k] + g.ph - 6, g.top[k] + 34];
          for(var j = 0; j < sides.length; j++) for(var i = 0; i < ys.length; i++){ var yy = clamp(ys[i], g.top[k] + 34, g.top[k] + g.ph - 5); if(txt(sides[j][0], yy, label, cls, sides[j][1])) return; }
        };
        if(shownK('x')) tryAt('x', yx, 'slope = v', 'mg2-w is-v');
        if(shownK('v')) tryAt('v', yv, 'slope = a', 'mg2-w is-a');
        // the area under v-t: named inside it when it is wide enough
        if(shownK('v') && t > 1.6 && Math.abs(dxArea) > 0.3){
          var yz = gy('v', 0), pos = dxArea > 0;
          [t / 2, t / 3, 2 * t / 3].some(function(tm){
            return [pos ? yz - 6 : yz + 16, pos ? yz + 16 : yz - 6].some(function(ya){ return txt(gx(tm), clamp(ya, g.top.v + 30, g.top.v + g.ph - 4), 'area = Δx', 'mg2-w is-x', 'middle'); });
          });
        }
        // the turns, on x-t (only those already drawn)
        var tEnd = st.tab === 'drive' && st.drv.rec ? seriesEnd(s) : seriesEnd(s);
        if(shownK('x')) turnsOf(s, tEnd, s.exact ? 0.01 : 0.12).slice(0, 3).forEach(function(q){
          var y0 = gy('x', q.x), yy = q.peak ? y0 - 10 : y0 + 19;
          if(yy < g.top.x + 12 || yy > g.top.x + g.ph - 2) yy = q.peak ? y0 + 19 : y0 - 10;
          txt(gx(q.t), clamp(yy, g.top.x + 12, g.top.x + g.ph - 3), 'turns', 'mg2-w is-turn', 'middle');
        });
        // the end stop
        if(s.hit && t >= s.hit.t - 1e-6 && shownK('x')) txt(clamp(gx(s.hit.t), g.L + 40, g.L + g.pw - 40), g.top.x + g.ph - 6, 'end stop', 'mg2-w is-turn', 'middle');
      } else if(!match) txt(g.L + g.pw / 2, g.gTop + g.ph / 2 + 4, 'Your run draws here', 'mg2-w is-ex', 'middle');
      var h = out.join('');
      if(h !== lastWords){ D.words.innerHTML = h; lastWords = h; }
    }
    var ariaQ = '';
    function paintAria(s, t, x, v, a){
      var q = [st.tab, F(x, 1), F(v, 1), F(a, 1), F(t, 1)].join('|');
      if(q === ariaQ) return; ariaQ = q;
      svg.setAttribute('aria-label', (match ? 'Match the graph: ' + match.name + '. ' : '') + 'A cart on a 10 m track with a motion detector at the left end, at x = ' + F(x, 1) + ' m. Under it, graphs of position, velocity and acceleration against time' +
        (s ? ', drawn to ' + F(seriesEnd(s), 1) + ' s; at t = ' + F(t, 1) + ' s, v = ' + F(v, 1) + ' m/s and a = ' + F(a, 1) + ' m/s².' : ', still empty.'));
      if(H_.cart) H_.cart.knob.setAttribute('aria-valuetext', 'x = ' + F(x, 1) + ' m' + (st.tab === 'drive' && s ? ', v = ' + F(v, 1) + ' m/s' : ''));
      if(o.onPaint) o.onPaint();
    }

    /* ---------------------------------------------------------------- the drive: recording a hand run */
    function newDrive(x){
      st.drv.raw = { t: [0], x: [x] }; st.drv.g = { t: [0], x: [x], v: [0], a: [0], exact: false, hit: null }; st.drv.clock = 0; st.drv.rec = true; st.drv.done = false; st.drv.x = x;
      st.cursor = 0;
    }
    function gridStep(){
      // add the grid points the clock has passed, interpolated from the raw samples; re-measure v and a near the end
      var d = st.drv, g = d.g, raw = d.raw;
      while(g.t[g.t.length - 1] + DT <= d.clock + 1e-9){
        var tt = +(g.t[g.t.length - 1] + DT).toFixed(4);
        g.t.push(tt); g.x.push(MG.interp(raw.t, raw.x, tt)); g.v.push(0); g.a.push(0);
        var n = g.t.length - 1, kv = Math.ceil(HV / DT), ka = Math.ceil(HA / DT);
        for(var i = Math.max(0, n - kv); i <= n; i++) g.v[i] = slopeIdx(g.t, g.x, i, HV);
        for(var j = Math.max(0, n - kv - ka); j <= n; j++) g.a[j] = slopeIdx(g.t, g.v, j, HA);
      }
    }
    function driveTick(dt){
      var d = st.drv;
      if(d.kv) d.x = clamp(d.x + d.kv * dt, TR.min, TR.max);
      d.clock = Math.min(WIN, d.clock + dt);
      d.raw.t.push(d.clock); d.raw.x.push(d.x);
      gridStep();
      st.cursor = seriesEnd(d.g);
      if(d.clock >= WIN - 1e-9) finishDrive(true);
    }
    function finishDrive(full){
      var d = st.drv; d.rec = false; d.done = !!full; d.kv = 0; d.example = false; st.cursor = WIN;
      if(full && o.onDone) o.onDone('drive');
    }

    /* ---------------------------------------------------------------- the loop (only while something moves) */
    function kick(){ if(!raf){ lastT = 0; raf = requestAnimationFrame(loop); } }
    function busy(){ return st.drv.rec || (!!st.play && !st.play.paused) || !!st.back || st.fade > 0; }
    function loop(ts){
      raf = 0;
      var dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 0; lastT = ts;
      if(st.drv.rec && st.tab === 'drive') driveTick(dt);
      if(st.play && !st.play.paused){
        st.play.t = Math.min(st.play.end, st.play.t + dt);
        st.cursor = st.play.t;
        if(st.play.t >= st.play.end - 1e-9){ var pl = st.play; st.play = null; playEnded(pl); }
      }
      if(st.back){
        st.back.k += dt;
        if(st.back.k >= st.back.hold && !st.back.faded){ st.back.faded = true; fadeBox(); st.cursor = 0; afterBack(); }
        if(st.back && st.back.k >= st.back.hold + 0.3){ st.back = null; afterBack(); }
      }
      paint(); if(st.play && H_.a && st.tab === 'set') H_.a.place(); if(scrub) scrub.value(curT()); if(o.onFrame) o.onFrame();
      if(busy()) raf = requestAnimationFrame(loop); else lastT = 0;
    }
    function fadeBox(){ box.classList.remove('is-fade'); void box.offsetWidth; box.classList.add('is-fade'); }
    // a new run: the old traces give way with a short fade of the traces alone (cheap on a phone)
    function fadeTraces(){ box.classList.remove('is-fadetr'); void box.offsetWidth; box.classList.add('is-fadetr'); }
    function stopAll(){
      if(raf){ cancelAnimationFrame(raf); raf = 0; }
      lastT = 0;
      if(st.drv.rec){ finishDrive(false); }
      if(st.play){ var pl = st.play; st.play = null; st.cursor = pl.kind === 'set' ? 0 : pl.end; }
      if(st.back){ st.back = null; st.cursor = 0; }
      st.drv.kv = 0; st.drv.hold = false;
      afterBack();
    }

    /* ---------------------------------------------------------------- playing a run (Set v and a; Replay) */
    /* Pause holds the moment (the old tool's Pause): the cart, its arrows and the cursor stay; Resume goes on. */
    function pause(on){ if(!st.play) return; st.play.paused = !!on; lastT = 0; if(!on) kick(); afterPlay(); }
    function play(kind){
      var s = series(); if(!s) return;
      hideCue(false);   // a run never plays under the first visit cue
      if(red()){
        // reduced motion: the end state at once (a short cross fade), then back to the start in Set
        fadeBox(); st.cursor = seriesEnd(s);
        if(kind === 'set'){ st.back = { k: 0, hold: 1.4, faded: false }; }
        paint(); afterPlay(); kick(); return;
      }
      st.play = { t: 0, end: seriesEnd(s), kind: kind }; st.cursor = 0;
      afterPlay(); kick();
    }
    function playEnded(pl){
      st.cursor = pl.end;
      if(pl.kind === 'set') st.back = { k: 0, hold: 1.2, faded: false };
      afterPlay();
      if(o.onDone) o.onDone(pl.kind);
    }
    // the picture is painted before the words that read it (the cause line never runs a frame ahead)
    function afterPlay(){ placeControls(); if(G) paint(); if(o.onState) o.onState(); }
    function afterBack(){ placeControls(); if(G) paint(); if(o.onState) o.onState(); }

    /* ---------------------------------------------------------------- the controls on the picture */
    var H_ = {}, scrub = null, grabOff = null, byPtr = false, heldByDrag = false;
    function red(){ return kit ? K.reduced() : T.reduced(); }
    var rebuilding = false;
    function makeControls(){
      // a redraw keeps the keyboard where it was (and a held key keeps driving)
      var fo = document.activeElement, foL = fo && box.contains(fo) ? (fo.getAttribute('aria-label') || '') : null;
      rebuilding = true;
      box.querySelectorAll('.tk2-handle, .tk2-scrub').forEach(function(e){ e.remove(); });
      rebuilding = false;
      H_ = {}; scrub = null;
      if(!kit) return;
      // the cart's knob, over the cart: Drive (main: drag to drive) or Set (quiet: where it starts)
      var drive = st.tab === 'drive';
      H_.cart = K.handle(layer, { key: drive ? 'apphys-motion-graphs-cart' : '', chip: false, label: drive ? 'Cart: drag it, or hold the left or right arrow key, to drive it' : 'Cart start position',
        value: drive ? cartX() : st.set.x0, min: drive ? TR.min : -3, max: drive ? TR.max : 3, step: drive ? 0.01 : 0.5, quiet: !drive,
        at: function(v){ return [X(st.tab === 'drive' ? cartX() : v), G.kY]; },
        pick: function(x){ var v = TR.min + (x - G.xL) / G.ppm;
          // the cart keeps where it was grabbed (no jump on the first move)
          if(grabOff == null) grabOff = v - (st.tab === 'drive' ? cartX() : st.set.x0);
          v -= grabOff;
          return st.tab === 'drive' ? clamp(v, TR.min, TR.max) : clamp(Math.round(v * 2) / 2, -3, 3); },
        keys: drive ? function(){ return null; } : undefined,
        valuetext: function(v){ return 'x = ' + F(v, 1) + ' m'; },
        onStart: function(){ hideCue(true); grabOff = null; if(st.tab === 'drive'){ if(!st.drv.rec) grabCart(); } else stopRun(); },
        onInput: function(v){ if(st.tab === 'drive'){ if(!st.drv.rec) return; st.drv.x = v; st.drv.hold = true; kick(); tourDid('drag'); } else setRun({ x0: v }); },
        onEnd: function(){ grabOff = null; if(st.tab === 'drive') st.drv.hold = false; else { tourDid('cart'); } } });
      if(drive){
        // hold an arrow key to drive (no page scroll); Shift drives slowly
        H_.cart.knob.addEventListener('keydown', function(e){
          var d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
          if(!d) return;
          e.preventDefault(); e.stopImmediatePropagation(); hideCue(true); H_.cart.used();
          if(!st.drv.rec && e.repeat) return;   // a key still held after a run ended does not start the next one
          st.drv.kv = d * (e.shiftKey ? 0.4 : 1.2);
          if(!st.drv.rec) grabCart(true);
          tourDid('drag');
          kick();
        }, true);
        var release = function(e){ if(!e || /Arrow/.test(e.key)) st.drv.kv = 0; };
        H_.cart.knob.addEventListener('keyup', release); H_.cart.knob.addEventListener('blur', function(){ if(!rebuilding) release(); });
        // the time cursor along the graphs: the cart goes back to that moment
        scrub = K.scrub(box, { key: '', label: 'Time cursor on the graphs', min: 0, max: WIN, step: DT, value: curT(), chip: false,
          rect: [G.L, G.gTop, G.L + G.pw, G.axisY], valuetext: function(v){ return 't = ' + F(v, 1) + ' s'; },
          onStart: function(){ hideCue(true); if(st.play){ st.play = null; } },
          onInput: function(v){ if(st.drv.rec) return; var s = series(); st.cursor = s ? Math.min(v, seriesEnd(s)) : 0; paint(); tourDid('scrub'); if(o.onState) o.onState(); } });
      } else {
        H_.v = K.handle(layer, { key: 'apphys-motion-graphs-v0', chip: false, label: 'Starting velocity, the velocity arrow’s tip', value: st.set.v0, min: -3, max: 3, step: 0.1,
          at: function(v){ return [tipAt(X(st.set.x0), v, G.vs), G.vY]; }, dir: function(){ return 0; },
          pick: function(x){ return tipPick(x, G.vs, -3, 3); },
          valuetext: function(v){ return 'v₀ = ' + sg(v) + ' m/s'; },
          onStart: function(){ hideCue(true); stopRun(); }, onInput: function(v){ setRun({ v0: r1(v) }); }, onEnd: function(){ tourDid('drag'); if(byPtr) autoRun(); } });
        H_.a = K.handle(layer, { key: 'apphys-motion-graphs-a', label: 'Acceleration, the acceleration arrow’s tip', value: st.set.a, min: -2, max: 2, step: 0.1, chip: false,
          // while the cart runs this knob rides on the cart's a arrow: a change starts a new piece of the run
          at: function(v){ return [tipAt(X(st.play ? cartX() : st.set.x0), v, G.as), G.aY]; }, dir: function(){ return 0; },
          pick: function(x){ return tipPick(x, G.as, -2, 2); },
          valuetext: function(v){ return 'a = ' + sg(v) + ' m/s²'; },
          onStart: function(){ hideCue(true); if(!st.play) stopRun(); else if(byPtr && !st.play.paused){ heldByDrag = true; pause(true); } },
          onInput: function(v){ setRun({ a: r1(v) }); },
          onEnd: function(){ tourDid('drag'); if(heldByDrag){ heldByDrag = false; pause(false); } else if(!st.play && byPtr) autoRun(); } });
        // a press of a tip by pointer or by key (keys never start a run; Enter on a tip runs it)
        [H_.v, H_.a].forEach(function(h){
          h.knob.addEventListener('pointerdown', function(){ byPtr = true; }, true);
          h.knob.addEventListener('keydown', function(e){
            byPtr = false;
            if(e.key === 'Enter' && !st.play && !st.back){ e.preventDefault(); clearTimeout(autoT); play('set'); }
          }, true);
        });
      }
      placeControls();
      if(foL != null){ var nf = [].slice.call(box.querySelectorAll('.tk2-knob, .tk2-in')).filter(function(e){ return (e.getAttribute('aria-label') || '') === foL; })[0]; if(nf) try{ nf.focus({ preventScroll: true }); }catch(e){} }
    }
    /* The a of the piece drawn now (stopped at the start, the first piece): the knob, the arrow and its words. */
    function aShown(){ var sg2 = st.set.segs, t = st.play ? curT() : 0, a0 = sg2[0].a; sg2.forEach(function(q){ if(q.t0 <= t + 1e-9) a0 = q.a; }); return a0; }
    /* Each tip's knob sits just past its arrow's tip (KO px), so a short arrow is never hidden under it; a press
       within KO of the cart's centre is zero. */
    var KO = 18;
    function tipAt(cx, v, scale){ return cx + v * scale + (v < 0 ? -KO : KO); }
    function tipPick(x, scale, lo, hi){
      var cx = X(st.play ? cartX() : st.set.x0), d = clamp(x, 6, G.W - 6) - cx;
      var v = d > KO ? (d - KO) / scale : d < -KO ? (d + KO) / scale : 0;
      return clamp(Math.round(v * 10) / 10, lo, hi);
    }
    function placeControls(){
      // the picture always matches its box (a stale viewBox would letterbox the drawing under the knobs)
      if(G && !G.fitH && (Math.abs(box.clientHeight - G.H) > 1 || Math.abs(box.clientWidth - G.W) > 1)) layoutSoon();
      if(!kit || !G) return;
      var running = !!st.play || !!st.back || st.drv.rec;
      var ae = document.activeElement, hideV = H_.v && running, hideC = H_.cart && st.tab === 'set' && running, hideA = H_.a && (!!st.back || st.drv.rec);
      if(ae && ((hideV && H_.v.el.contains(ae)) || (hideC && H_.cart.el.contains(ae)) || (hideA && H_.a.el.contains(ae)))){ if(o.keepFocus) o.keepFocus(); else if(H_.a && !hideA) H_.a.knob.focus({ preventScroll: true }); }
      if(H_.cart){ H_.cart.value(st.tab === 'drive' ? cartX() : st.set.x0); H_.cart.hide(st.tab === 'set' && running); H_.cart.place(); }
      if(H_.v){ H_.v.value(st.set.v0); H_.v.hide(running); H_.v.place(); }
      // (stopped, the knob sits on the drawn arrow: the first piece's a; running, on the cart's arrow now)
      if(H_.a){ H_.a.value(aShown()); H_.a.hide(!!st.back || st.drv.rec); H_.a.place(); }
      if(scrub){ scrub.place([G.L, G.gTop, G.L + G.pw, G.axisY]); scrub.value(curT()); scrub.el.classList.toggle('is-rec', st.drv.rec); }
    }
    function grabCart(byKey){
      var d = st.drv;
      if(st.play){ st.play = null; }
      if(!d.rec){
        // a new run starts from where the cart is drawn now; the old run (or the example) fades out
        var x0 = cartX(), had = !!series();
        newDrive(x0); d.example = false;
        if(had) fadeTraces();
        if(o.onStart) o.onStart();
      }
      d.hold = !byKey;
      kick(); afterPlay();
    }
    /* A change of v₀, a or the start: the whole run is redrawn at once. While the cart runs, a change of a starts a
       new straight piece on v-t from that moment (the run so far is kept). */
    function setRun(ch){
      // a new a at the start replaces the run's pieces; a new v₀ or start keeps them (one a everywhere)
      var s = st.set, live = !!st.play && ch.a != null && ch.v0 == null && ch.x0 == null;
      if(ch.x0 != null) s.x0 = ch.x0; if(ch.v0 != null) s.v0 = ch.v0;
      if(live){
        var tc = curT(), lastP = s.segs[s.segs.length - 1];   // (unrounded: the cursor at the boundary reads the new piece)
        // changes within 0.2 s of the newest piece's start are one change (keys, a drag): the last value, the first time
        if(lastP.t0 > 0 && tc - lastP.t0 < 0.2 - 1e-9) lastP.a = ch.a;
        else s.segs = s.segs.filter(function(q){ return q.t0 < tc - 1e-9; }).concat([{ t0: tc, a: ch.a }]);
        // a piece that ends up equal to the one before it is no change
        s.segs = s.segs.filter(function(q, i, arr){ return i === 0 || Math.abs(q.a - arr[i - 1].a) > 1e-9; });
      } else if(ch.a != null) s.segs = [{ t0: 0, a: ch.a }];
      s.a = s.segs[0].a;
      s.run = exactRun(s.x0, s.v0, s.segs.map(function(q, i){ return { dur: (i + 1 < s.segs.length ? s.segs[i + 1].t0 : WIN) - q.t0, a: q.a }; }));
      if(live){ st.play.end = seriesEnd(s.run); if(st.play.t >= st.play.end){ var pl = st.play; st.play = null; playEnded(pl); } }
      else st.cursor = 0;
      if(H_.v){ H_.v.place(); H_.a.place(); }
      if(H_.cart && ch.x0 != null){ H_.v.value(s.v0); H_.a.value(aShown()); }
      paint(); if(o.onState) o.onState();
    }
    var autoT = 0;
    function autoRun(){ clearTimeout(autoT); autoT = setTimeout(function(){ if(st.tab === 'set' && st.mode === 'explore' && !anyDrag()) play('set'); }, 260); }
    function anyDrag(){ return (H_.v && H_.v.dragging()) || (H_.a && H_.a.dragging()) || (H_.cart && H_.cart.dragging()); }
    function stopRun(){ clearTimeout(autoT); if(st.play || st.back){ st.play = null; st.back = null; st.cursor = 0; placeControls(); paint(); if(o.onState) o.onState(); } }

    // a press on the cart itself drives it too (the cue names the cart)
    box.addEventListener('pointerdown', function(e){
      if(!G || !H_.cart || e.target.closest('.tk2-knob, .tk2-hit, .tk2-sk, .tk2-cue')) return;
      var r = svg.getBoundingClientRect(), k = r.width / G.W, px = (e.clientX - r.left) / k, py = (e.clientY - r.top) / k;
      var cx = X(cartX());
      if(Math.abs(px - cx) <= G.cw / 2 + 6 && py >= G.cartTop - G.ch && py <= G.railTop + 4 && !(st.tab === 'set' && (st.play || st.back))) H_.cart.grab(e);
    });

    /* ---------------------------------------------------------------- the cue and the tour */
    var cue = null;
    function hideCue(used){ if(cue && cue.active()) cue.hide(used); }
    var tourDid = function(){};

    /* ---------------------------------------------------------------- layout */
    function layout(){
      if(!box.isConnected || box.closest('[hidden]')) return;
      var r = box.getBoundingClientRect();
      if(!r.width) return;
      W = Math.max(280, Math.round(r.width));
      // a phone or a tablet (it scrolls) takes the height its picture needs; a desktop fills the stage
      // (by the screen's width, as the stylesheet decides: a 1024 px screen is a desktop even if the stage is narrower)
      var vw = window.innerWidth || W, phone = vw < 600 || W < 420, fitH = vw < 1000 || !!match;
      if(fitH){
        // Match: the stage it sits in can change height after it is placed (a phone's frame settles): watch it too
        if(match && ro && !watched){ var sb = box.closest('.ls-stage-body') || box.closest('.ls-stage'); if(sb){ ro.observe(sb); watched = true; } }
        var vh = window.innerHeight || 800, avail = o.availH ? o.availH() : vh - 330;
        var g0 = geo(W, Math.max(avail, 0), phone, true);
        box.style.height = g0.H + 'px'; box.style.minHeight = '0px';
        H = g0.H;
      } else {
        box.style.height = ''; box.style.minHeight = '';
        r = box.getBoundingClientRect();
        H = Math.max(420, Math.round(r.height));
      }
      var sig = st.tab + ':' + W + 'x' + H + ':' + phone;
      if(sig === built){ placeControls(); paint(); if(cue && cue.active()) cue.place(); return; }
      built = sig;
      G = geo(W, H, phone, fitH);
      build(); makeControls(); paint();
      if(cue && cue.active()) cue.place();
      if(o.onLayout) o.onLayout();
    }
    var soonT = 0, watched = false;
    function layoutSoon(){ if(!soonT) soonT = setTimeout(function(){ soonT = 0; layout(); }, 0); }
    var ro = null;
    if(window.ResizeObserver){ var tm = null; ro = new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(layout, 40); }); ro.observe(box); }
    else window.addEventListener('resize', layout);

    return {
      el: box, layer: layer, st: st, geo: function(){ return G; }, series: series, curT: curT, cartX: cartX, nowVA: nowVA, example: exampleRun,
      layout: layout, paint: paint, kick: kick, stopAll: stopAll, play: play, red: red, X: X,
      pause: pause,
      setTab: function(t){ stopAll(); st.tab = t; st.cursor = t === 'set' ? 0 : WIN; built = ''; layout(); },
      setCue: function(c){ cue = c; }, setTour: function(f){ tourDid = f; },
      handles: function(){ return H_; }, scrubber: function(){ return scrub; },
      resetDrive: function(){ stopAll(); st.drv = { raw: { t: [], x: [] }, g: null, clock: 0, rec: false, done: false, x: match ? startOfTarget(match) : at(exampleRun, 'x', WIN), kv: 0, hold: false, example: !match }; st.cursor = match ? 0 : WIN; built = ''; layout(); },
      resetSet: function(){ stopAll(); st.set = { x0: SET0.x0, v0: SET0.v0, a: SET0.a, segs: [{ t0: 0, a: SET0.a }], run: exactRun(SET0.x0, SET0.v0, [{ dur: WIN, a: SET0.a }]) }; st.cursor = 0; built = ''; layout(); },
      /* Show a run as if driven (Match's "Show the answer"): replayed from the start. */
      showRun: function(s){ stopAll(); st.drv.g = s; st.drv.done = true; st.drv.example = false; play('drive'); },
      destroy: function(){ stopAll(); clearTimeout(autoT); if(ro) ro.disconnect(); listeners.forEach(function(f){ f(); }); }
    };
  }

  /* ================================================================ EXPLORE */
  var PURPOSE = { drive: 'Drive the cart and watch its three graphs draw.', set: 'Set v and a and see the motion they make.' };
  var CUE = { drive: 'Drag the cart', set: 'Drag a tip' };
  function explore(host, data, kit){
    var K = window.LevlKit2, LS = null;
    var stage = document.createElement('div'); stage.className = 'mg2';
    var tabs = kit ? K.tabs({ label: 'How to move the cart', big: true, value: 'drive', items: [{ value: 'drive', label: 'Drive it' }, { value: 'set', label: 'Set v and a' }],
      onChange: function(v){ setTab(v, true); } }) : null;
    if(tabs) stage.appendChild(tabs.el);
    var head = kit ? K.head({ purpose: PURPOSE.drive, how: { label: 'Show me how', onClick: function(){ startTour(true); } } }) : null;
    if(head) stage.appendChild(head.el);
    var L = lab({ kit: kit, availH: availH,
      onStart: function(){ cause.take(null); },
      onState: function(){ paintCause(); paintButtons(); },
      // a knob that hides (a run starts, the cart fades back) hands the keyboard on: to the a tip while it shows, else to Run
      keepFocus: function(){ var ha = L.handles().a; if(ha && !L.st.back && !L.st.drv.rec && L.st.tab === 'set') ha.knob.focus({ preventScroll: true }); else (runB.hidden ? again : runB).focus({ preventScroll: true }); },
      onFrame: function(){ paintCause(); if(ref.offsetParent) paintRef(); },
      onDone: function(kind){ paintButtons(); if(kind === 'drive' && L.st.tab === 'drive' && !L.st.play){ takeaway(); } else if(kind === 'set') say(cause.text()); } });
    stage.appendChild(L.el);
    if(tabs) tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', L.el.id); });
    var lines = document.createElement('div'); lines.className = 'mg2-lines';
    var cause = kit ? K.cause({ label: 'Why' }) : { el: document.createElement('p'), set: function(){}, take: function(){}, text: function(){ return ''; } };
    var runB = document.createElement('button'); runB.type = 'button'; runB.className = 'tk2-btn mg2-run';
    var again = document.createElement('button'); again.type = 'button'; again.className = 'tk2-btn mg2-again'; again.textContent = 'Start over';
    var btns = document.createElement('div'); btns.className = 'mg2-btns'; btns.appendChild(runB); btns.appendChild(again);
    lines.appendChild(cause.el); lines.appendChild(btns);
    stage.appendChild(lines);
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    var sayT = 0;
    function say(t){ clearTimeout(sayT); sayT = setTimeout(function(){ live.textContent = t; }, 60); }
    runB.addEventListener('click', function(){
      var st = L.st;
      // Pause holds the moment (tangents, area and words stay readable there); Resume goes on
      if(st.play){ L.pause(!st.play.paused); paintButtons(); paintCause(); return; }
      cause.take(null); L.play(st.tab); paintButtons();
    });
    again.addEventListener('click', function(){ if(cue) cue.hide(true); cause.take(null); if(L.st.tab === 'drive') L.resetDrive(); else L.resetSet(); paintCause(); paintButtons(); });
    function paintButtons(){
      var st = L.st, s = L.series();
      runB.textContent = st.play ? (st.play.paused ? 'Resume' : 'Pause') : st.tab === 'set' ? 'Run' : 'Replay';
      runB.hidden = st.tab === 'drive' && (!s || st.drv.rec);
      runB.setAttribute('aria-label', st.play ? (st.play.paused ? 'Resume the run' : 'Pause the run') : st.tab === 'set' ? 'Run the motion' : 'Replay the run');
    }
    function availH(){
      // a phone: the stage's room is the screen less the frame above the picture and the lines under it
      var r = L.el.getBoundingClientRect(), top = r.top + (window.scrollY || 0), sc = document.scrollingElement || document.documentElement;
      var y0 = r.top + sc.scrollTop;
      var below = lines.getBoundingClientRect().height + 24;
      return (window.innerHeight || 800) - Math.min(y0, 220) - below - 6;
    }

    /* ---------------------------------------------------- the cause line: read from the drawn frame */
    var causeQ = '';
    function paintCause(){
      if(!kit) return;
      var st = L.st, g = L.geo(); if(!g) return;
      if(cause.el.classList.contains('is-take')) return;
      var s0 = L.series(), vq = s0 ? L.nowVA() : null;
      var q = st.tab + '|' + (s0 ? [s0 === L.example, F(vq.v, 1), F(vq.a, 1), F(vq.t, 1), s0.exact].join(',') : '-') + '|' + (st.tab === 'set' ? [st.set.v0, JSON.stringify(st.set.segs), st.set.x0].join(',') : '');
      if(q === causeQ && cause.el.childNodes.length) return;
      causeQ = q;
      if(st.tab === 'drive'){
        var s = L.series();
        if(!s){ cause.set([{ t: 'Drag the cart', role: 'ink' }]); cause.el.setAttribute('data-res', ''); return; }
        var va = L.nowVA(), d = describeText(va.v, va.a, !!s.exact, s, va.t);
        cause.set([{ t: 'v ' + sg(va.v) + ' m/s', role: 'v', say: 'velocity ' + sg(va.v) + ' meters per second' }, { t: 'a ' + sg(va.a) + ' m/s²', role: 'a', join: '+', say: 'acceleration ' + sg(va.a) + ' meters per second squared' }, { t: d.t, role: 'res' }],
          (s === L.example ? 'Example, ' : '') + 'at ' + F(va.t, 1) + ' s:');
        cause.el.setAttribute('data-res', d.k);
      } else {
        // the newest piece of the run: from v₀ at 0 s, or from the v at the moment a was changed mid run
        // the a pill names every piece ("a −0.3, then +0.5 m/s² at 1.6 s"); the result word is the newest piece's
        var se = st.set, run = se.run, a0 = se.segs[0].a, last = se.segs[se.segs.length - 1], piece = last.t0 > 0, aL = last.a;
        var v1 = piece ? +at(run, 'v', last.t0).toFixed(6) : se.v0;
        // every piece is named (on a phone, more than two are counted: "2 changes, last +0.5 at 3.3 s")
        var rest = se.segs.slice(1), narrow = (window.innerWidth || 1000) < 640;
        var aT = !piece ? 'a ' + sg(a0) + ' m/s²' : narrow && rest.length > 1 ? 'a ' + sg(a0) + ' m/s², ' + rest.length + ' changes'
          : narrow ? 'a ' + sg(a0) + ', ' + sg(aL) + ' m/s² at ' + F(last.t0, 1) + ' s'
          : 'a ' + sg(a0) + ' m/s², ' + rest.map(function(q){ return sg(q.a) + ' at ' + F(q.t0, 1) + ' s'; }).join(', ');
        var parts = [{ t: 'v₀ ' + sg(se.v0) + ' m/s', role: 'v', say: 'starting velocity ' + sg(se.v0) + ' meters per second' }, { t: aT, role: 'a', join: '+', say: piece ? 'acceleration ' + sg(a0) + ' meters per second squared, then ' + rest.map(function(q){ return sg(q.a) + ' from ' + F(q.t0, 1) + ' seconds'; }).join(', then ') : 'acceleration ' + sg(a0) + ' meters per second squared' }];
        var tn = turnsOf(run, run.end, 0.01).filter(function(q){ return q.t >= last.t0 - 1e-9; })[0], res = '';
        if(piece){ res = Math.abs(v1) < 1e-9 && Math.abs(aL) < 1e-9 ? 'rest' : Math.abs(aL) < 1e-9 ? 'const' : Math.abs(v1) < 1e-9 || v1 * aL > 0 ? 'up' : 'down'; }
        else if(Math.abs(v1) < 1e-9 && Math.abs(aL) < 1e-9){ parts.push({ t: 'stays at rest', role: 'res' }); res = 'rest'; }
        else if(Math.abs(aL) < 1e-9){ parts.push({ t: 'steady to the ' + (v1 > 0 ? 'right' : 'left'), role: 'res' }); res = 'const'; }
        else if(Math.abs(v1) < 1e-9){ parts.push({ t: 'speeds up from rest', role: 'res' }); res = 'up'; }
        else if(v1 * aL > 0){ parts.push({ t: 'speeds up', role: 'res' }); res = 'up'; }
        else { parts.push({ t: 'slows down', role: 'res' }); res = 'down'; }
        // a turn and an end stop are both named when both happen
        if(tn && run.hit) { parts.push({ t: narrow ? 'turns ' + F(tn.t, 1) + ' s, end stop ' + F(run.hit.t, 1) + ' s' : 'turns at ' + F(tn.t, 1) + ' s, end stop at ' + F(run.hit.t, 1) + ' s', role: 'turn' }); res += ' turn hit'; }
        else if(tn) { parts.push({ t: 'turns at ' + F(tn.t, 1) + ' s', role: 'turn' }); res += ' turn'; }
        else if(run.hit) { parts.push({ t: 'end stop at ' + F(run.hit.t, 1) + ' s', role: 'turn' }); res += ' hit'; }
        cause.set(parts);
        cause.el.setAttribute('data-res', res);
      }
    }
    function takeaway(){
      cause.take('Where x-t is steepest, the cart is fastest; where v-t is flat, a is zero.');
      say('Recorded 10 seconds. Where the position graph is steepest, the cart is fastest; where the velocity graph is flat, the acceleration is zero.');
    }

    /* ---------------------------------------------------- "?" */
    var ref = document.createElement('div'); ref.className = 'ls-sec mg2-ref';
    ref.innerHTML = '<p><button type="button" class="tk2-btn" data-how>Show me how</button></p>' +
      '<h3 class="ls-title-l">' + esc(data.howItWorksTitle || 'How it works') + '</h3><div class="mg2-howit">' + (data.howItWorks || '') + '</div>' +
      '<h3 class="ls-title-l">At the time cursor</h3><div class="mg2-nums"></div>' +
      '<h3 class="ls-title-l">How this picture is drawn</h3><ul class="mg2-list">' +
      '<li>Right is the + direction. x is where the cart’s center is on the track’s tape; the track runs from −5 m to +5 m.</li>' +
      '<li>At the time cursor: the line touching the x graph is drawn in v’s color, because its slope is v; the line touching the v graph is drawn in a’s color, because its slope is a; the shaded area under the v graph from 0 is Δx (below the axis it counts as negative).</li>' +
      '<li>Drive it: the detector records the cart’s position every frame. v and a are measured from those positions as a real detector does: least squares slopes over ±0.2 s for v and ±0.4 s for a, from positions taken every 0.05 s. So a hand drive gives a slightly bumpy, slightly late v and a, and slopes and areas agree only roughly. The newest point uses only the time before it.</li>' +
      '<li>Set v and a: the motion is exact, x = x₀ + v₀t + ½at² and v = v₀ + at. Change a while the cart runs (its arrow’s tip rides with the cart) and a new straight piece starts on v-t from that moment. “turns” marks where v crosses zero, the top or bottom of the x graph. At an end stop the cart stops dead: v drops to 0 at once, a spike on the a graph too narrow to draw.</li>' +
      '<li>The detector here reads the whole 10 m track. A classroom motion detector reads from about 0.15 m to 3.5 m (6 m for some), so a real track is shorter; the numbers here are kept as the problems use them.</li>' +
      '<li>The graphs show v from −4 to 4 m/s and a from −3 to 3 m/s²; a line that goes past runs off the panel.</li></ul>' +
      '<h3 class="ls-title-l">Keys</h3><p class="bt-small">Drive it: Tab to the cart’s knob and hold the left or right arrow key to drive (Shift drives slowly); Tab on to the time cursor and use the arrow keys. Set v and a: on an arrow’s tip, the arrow keys change it by 0.1 (Page Up and Page Down by 1); the cart’s knob moves the start 0.5 m.</p>';
    ref.addEventListener('click', function(e){ if(!e.target.closest('[data-how]')) return; if(LS) LS.close(); setTimeout(function(){ startTour(true); }, 60); });
    var refQ = '';
    function paintRef(){
      var s = L.series(), t = L.curT(), el = ref.querySelector('.mg2-nums');
      if(!s){ if(refQ !== 'none'){ el.innerHTML = '<p class="bt-small">Nothing drawn yet.</p>'; refQ = 'none'; } return; }
      var x = at(s, 'x', t), v = at(s, 'v', t), a = at(s, 'a', t), dx = MG.areaTo(s.t, s.v, 0, t), dv = MG.areaTo(s.t, s.a, 0, t);
      var q = [F(t, 1), F(x, 2), F(v, 2), F(a, 2), F(dx, 2), F(dv, 2)].join('|');
      if(q === refQ) return; refQ = q;
      var rows = [['Time t', F(t, 1) + ' s'], ['Position x', F(x, 2) + ' m'], ['Velocity v (slope of x-t)', sg(v, 2) + ' m/s'], ['Acceleration a (slope of v-t)', sg(a, 2) + ' m/s²'],
        ['Area under v-t from 0', sg(dx, 2) + ' m'], ['Δx = x − x₀', sg(x - s.x[0], 2) + ' m'], ['Area under a-t from 0', sg(dv, 2) + ' m/s'], ['Δv = v − v₀', sg(v - s.v[0], 2) + ' m/s']];
      el.innerHTML = '<table class="mg2-tbl"><caption class="sr-only">The numbers at the time cursor</caption><tbody>' + rows.map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td class="r">' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>' +
        (s.exact ? '' : '<p class="bt-small">Measured from a hand drive: the area and Δx agree only roughly.</p>');
    }

    /* ---------------------------------------------------- tabs, cue, tour */
    var cues = {}, cue = null, tours = {}, tour = null;
    if(kit){
      ['drive', 'set'].forEach(function(k){
        cues[k] = K.cue(L.layer, { key: 'apphys-motion-graphs-' + k, text: CUE[k], side: 'right', at: function(){
          var g = L.geo(); if(!g) return [0, 0];
          // (the kit puts a right-hand cue 30 px past this point)
          if(k === 'drive') return [L.X(L.cartX()) + g.cw / 2 - 18, g.cartTop + g.ch * 0.4];
          return [L.X(L.st.set.x0) + Math.max(L.st.set.v0 * g.vs, 0) + 18, g.vY];
        } });
      });
      cue = { show: function(){ return cues[L.st.tab].show(); }, hide: function(u){ Object.keys(cues).forEach(function(k){ if(cues[k].active()) cues[k].hide(u && k === L.st.tab); }); }, place: function(){ cues[L.st.tab].place(); }, active: function(){ return cues[L.st.tab].active(); } };
      L.setCue(cue);
      var kr = function(sel){ var e = L.layer.el.querySelector(sel); return e ? e.getBoundingClientRect() : L.el.getBoundingClientRect(); };
      tours.drive = K.tour({ key: 'apphys-motion-graphs-drive', label: 'Show me how', steps: [
        { id: 'drag', text: 'Drag the cart along the track. The detector records 10 s and the graphs draw as you move.', target: function(){ return kr('.tk2-handle .tk2-knob'); } },
        { id: 'slope', text: 'Steeper x graph, faster cart: the line touching x is in v’s color because its slope is v.', target: function(){ var e = L.el.querySelector('.mg2-tan.is-v'); return e ? e.getBoundingClientRect() : L.el.getBoundingClientRect(); } },
        { id: 'scrub', text: 'After a run, drag along the graphs: the cart goes back to that moment.', target: function(){ var e = L.el.querySelector('.mg2-pbg'); return e ? e.getBoundingClientRect() : L.el.getBoundingClientRect(); } }] });
      tours.set = K.tour({ key: 'apphys-motion-graphs-set', label: 'Show me how', steps: [
        { id: 'drag', text: 'Drag the tip of the velocity arrow or the acceleration arrow. The whole run redraws.', target: function(){ return kr('.tk2-handle:not(.is-quiet) .tk2-knob'); } },
        { id: 'run', text: 'Let go and the cart runs it. Opposite signs of v and a: it slows down and can turn around.', target: function(){ var e = L.el.querySelector('.mg2-tr.s1'); return e ? e.getBoundingClientRect() : L.el.getBoundingClientRect(); } },
        { id: 'cart', text: 'Drag the cart itself to choose where it starts.', target: function(){ return kr('.tk2-handle.is-quiet .tk2-knob'); } }] });
      tour = { start: function(f){ return tours[L.st.tab].start(f); }, stop: function(){ Object.keys(tours).forEach(function(k){ tours[k].stop(); }); }, active: function(){ return Object.keys(tours).some(function(k){ return tours[k].active(); }); }, did: function(id){ tours[L.st.tab].did(id); } };
      L.setTour(function(id){ tour.did(id); });
    }
    function startTour(force){ if(!tour) return; if(cue) cue.hide(false); tour.start(force); }
    function setTab(v, user){
      if(cue) cue.hide(false); if(tour) tour.stop();
      cause.take(null);
      L.setTab(v);
      stage.setAttribute('data-tab', v);
      if(head) head.purpose(PURPOSE[v]);
      if(tabs && tabs.value() !== v) tabs.value(v);
      paintCause(); paintButtons(); paintRef();
      if(user) T.event('apphys-tool-drive', { tool: 'motion-graphs', drive: v });
      setTimeout(function(){ if(cue && !(tour && tour.active())) cue.show(); }, 60);
    }
    function shown(m){
      L.st.mode = m;
      if(m !== 'explore'){ L.stopAll(); if(tour) tour.stop(); if(cue) cue.hide(false); paintButtons(); return; }
      setTimeout(function(){ L.layout(); L.paint(); paintCause(); paintButtons(); if(cue && !(tour && tour.active())) cue.show(); }, 30);
    }
    // a phone that scrolls: a run started below the picture brings the picture into view
    runB.addEventListener('click', function(){ var r = L.el.getBoundingClientRect(); if(r.top < 0 || r.top > (window.innerHeight || 800) * 0.4) try{ L.el.scrollIntoView({ block: 'nearest', behavior: L.red() ? 'auto' : 'smooth' }); }catch(e){} });

    // tests and the frame checks read the drawn state here (no behavior hangs on it)
    stage.__mg = { lab: L, st: L.st };
    stage.setAttribute('data-tab', 'drive');
    paintButtons();
    return {
      shown: shown,
      kit2: function(pane, s){ LS = s; setTimeout(function(){ L.layout(); paintCause(); paintRef(); paintButtons(); if(cue) cue.show(); }, 30);
        return { stage: stage, ref: ref, about: [(function(){ var d = document.createElement('div'); d.className = 'bt-intro'; d.innerHTML = data.intro || ''; return d; })()] }; },
      plain: function(){ host.appendChild(stage); host.appendChild(ref); setTimeout(function(){ L.layout(); paintCause(); paintRef(); }, 30); }
    };
  }

  /* ================================================================ TEST YOURSELF */
  /* The problem drawings (unchanged from the first version): a static graph for a drill problem. */
  function graphSvg(f, o){
    o = o || {};
    var W = o.w || 520, H = o.h || 260, L = o.small ? 30 : 52, R = o.R || (o.small ? 8 : 14), T0 = o.small ? 8 : 14, B = o.small ? 20 : 40, pw = W - L - R, ph = H - T0 - B;
    var ymin = f.ymin, ymax = f.ymax, step = f.step || 1, tmax = f.tmax;
    var sx = function(t){ return L + t / tmax * pw; }, sy = function(y){ return T0 + ph - (y - ymin) / (ymax - ymin) * ph; };
    var p = [], k = f.kind, cls = CLS[k];
    for(var t = 0; t <= tmax + 1e-9; t += 1){ p.push('<line class="grid" x1="' + sx(t).toFixed(1) + '" x2="' + sx(t).toFixed(1) + '" y1="' + T0 + '" y2="' + (T0 + ph) + '"/>'); if(o.small ? t % 2 === 0 : true) p.push('<text class="tick" x="' + sx(t).toFixed(1) + '" y="' + (T0 + ph + 16) + '" text-anchor="middle">' + t + '</text>'); }
    var ys = Math.ceil(ymin / step) * step;
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
      if(!f.curve) p.push('<polyline class="series ' + cls + '" points="' + f.pts.map(function(q){ return sx(q[0]).toFixed(1) + ',' + sy(q[1]).toFixed(1); }).join(' ') + '"/>');
      p.push('<text class="lbl mg-sm-l" x="' + (L + 4) + '" y="' + (T0 + 12) + '">a (m/s²)</text>');
    } else {
      p.push('<text class="lbl" x="' + (L + pw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">t (s)</text>');
      p.push('<text class="lbl" transform="translate(14 ' + (T0 + ph / 2) + ') rotate(-90)" text-anchor="middle">' + k + ' (' + UNIT[k] + ')</text>');
    }
    return '<svg class="phys-svg bt-plot mg-fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || f.label) + '">' + p.join('') + '</svg>';
  }
  function stepsSvg(g, range, label){
    var f;
    if(g.type === 'line') f = { kind: 'a', pts: g.pts, tmax: 6, ymin: -range, ymax: range, step: range };
    else { var pts = []; g.a.forEach(function(a, k){ pts.push([2 * k, a], [2 * k + 2, a]); }); f = { kind: 'a', pts: pts, tmax: 6, ymin: -range, ymax: range, step: range };
      f.label = label; }
    var s = graphSvg(f, { w: 190, h: 120, small: true, label: label });
    return s.replace(/<circle class="pt[^>]*>/g, '');
  }

  /* Match the graph (Test yourself; the old Explore Match): drive the cart to trace a target, then Check. The figure
     is the lab with the target drawn on its graph; the step is graded by the tool (the drill's "task" step). */
  var matchLab = null;
  function quizShown(m){ if(m !== 'quiz' && matchLab) matchLab.stopAll(); }
  function matchProblem(r, data){
    var tg = r.pick(data.targets);
    var kindW = tg.kind === 'x' ? 'position' : 'velocity';
    var p = { type: 'match', ctx: 'match', topic: 'motion-representations', target: tg,
      text: '<p><b>' + esc(tg.name) + '.</b> Drive the cart so its ' + kindW + ' graph follows the target for the whole 10 s, then Check.</p>',
      steps: [{ kind: 'task', key: tg.id, practice: '1.C', level: 'apply', label: 'Drive the cart along the target (' + kindW + '-time), then Check.',
        hint: tg.kind === 'x' ? 'On x-t, height is where the cart is and steepness is how fast: a flat piece means hold still; steeper means faster.' : 'On v-t, height is how fast and which way: above the axis move right, below move left, on the axis hold still; a sloped piece means speed up or slow down steadily.',
        check: function(){ return gradeMatch(tg); },
        reveal: function(){ showTarget(tg); },
        shown: 'The cart drives the target’s motion now: watch its ' + kindW + ' graph lie on the target.' }],
      solution: [tg.kind === 'x' ? 'On a position-time target, the height of the line is the position to drive to, and its slope is the velocity to drive at: a flat piece is standing still.' : 'On a velocity-time target, the height of the line is the velocity (sign = direction), not the position; a sloped piece is a steady speeding up or slowing down.',
        'The score compares your graph with the target every 0.05 s; 80% or more is a match.'] };
    return p;
  }
  function gradeMatch(tg){
    if(!matchLab) return { blank: true, note: 'Drive the cart first.' };
    var st = matchLab.st, g = st.drv.g;
    if(st.drv.rec) return { blank: true, note: 'Keep driving: the run records 10 s.' };
    if(!g || !st.drv.done || g.t[g.t.length - 1] < WIN - 0.06) return { blank: true, note: 'Drive the cart for the whole 10 s first: grab it and move it.' };
    var y = tg.kind === 'x' ? g.x : g.v, res = MG.score(tg.kind, function(t){ return MG.plAt(tg.pts, t); }, g.t, y);
    var key = 'apphys_mg_best_' + tg.id, best = Math.max(+(storeGet(key) || 0), res.score);
    storeSet(key, String(best));
    T.event('apphys-mg-match', { target: tg.id, score: res.score });
    var w = res.worst && res.worst.t0 >= WIN ? Object.assign({}, res.worst, { t0: WIN - 1, t1: WIN }) : res.worst, off = w && Math.abs(w.mean) > 0.15 ? (tg.kind === 'x' ? (w.sign > 0 ? 'too far to the right' : 'too far to the left') : (w.sign > 0 ? 'velocity above the target' : 'velocity below the target')) : '';
    var note = '<b>Match ' + res.score + '%</b> (best on this target ' + best + '%). ' + (res.score >= 80 ? 'Well driven.' : off ? 'Furthest off from ' + w.t0 + ' s to ' + w.t1 + ' s: ' + off + '. Grab the cart to drive again.' : 'Close. Grab the cart to drive again, more smoothly.');
    return { ok: res.score >= 80, note: note };
  }
  function showTarget(tg){
    if(!matchLab) return;
    // the target's own motion, as a run: x from the target (x-t), or x from the area under the target (v-t)
    var s = { t: [], x: [], v: [], a: [], exact: true, hit: null }, x0 = tg.kind === 'x' ? tg.pts[0][1] : (tg.x0 || 0);
    for(var i = 0; i <= Math.round(WIN / DT); i++){
      var t = i * DT, x = tg.kind === 'x' ? MG.plAt(tg.pts, t) : x0 + MG.plArea(tg.pts, 0, t), v;
      s.t.push(t); s.x.push(x);
    }
    for(var j = 0; j < s.t.length; j++){ s.v.push(tg.kind === 'v' ? MG.plAt(tg.pts, s.t[j]) : slopeIdx(s.t, s.x, j, 0.06)); }
    for(var k = 0; k < s.t.length; k++) s.a.push(slopeIdx(s.t, s.v, k, 0.06));
    s.end = WIN;
    matchLab.showRun(s);
  }

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
    var targets = (data.targets || []).filter(function(t){ return t.kind === 'x' || t.kind === 'v'; });
    var d2 = data;
    if(targets.length){
      TYPES.push({ value: 'match', label: 'Match the graph (drive the cart)' });
      // Match is offered only when picked (only: true), so a ?seed= link opens the same problem as before
      d2 = Object.assign({}, data, { targets: targets, contexts: (data.contexts || []).concat([{ id: 'match', kind: 'match', only: true, topic: 'motion-representations' }]) });
    }
    var kit = !!window.LevlKit2;
    T.drill(host, d2, {
      slug: 'motion-graphs', types: TYPES, typeLabel: 'Kind of problem',
      title: function(p){ var t = TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Practice problem'; },
      generate: function(r, ctx, type){
        if(ctx && ctx.kind === 'match') return matchProblem(r, d2);
        var p = MG.generate(r, ctx, type);
        if(p.type === 'pick'){
          var s = p.steps[0];
          s.optionsHtml = p.graphs.map(function(g, i){ return stepsSvg(g, p.range, 'Acceleration-time graph: ' + s.options[i]); });
        }
        return p;
      },
      extra: function(el, p, api){
        if(matchLab){ matchLab.destroy(); matchLab = null; }
        if(p.type === 'match'){
          el.innerHTML = '';
          var code = api && api.area && api.area.querySelector('.bt-code'); if(code) code.hidden = true;
          // the Match figure takes the room the stage gives it (a phone's stage is short: no inner scroll)
          matchLab = lab({ kit: kit, match: p.target, availH: function(){
            var el2 = matchLab && matchLab.el, stg = el2 && (el2.closest('.ls-stage-body') || el2.closest('.ls-stage'));
            if(!stg) return Math.min(560, (window.innerHeight || 800) - 260);
            // (on a phone the question's sheet covers the stage's foot: stop above it)
            var r = stg.getBoundingClientRect(), b = el2.getBoundingClientRect(), dock = document.querySelector('.ls-root .ls-dock'), bot = r.bottom;
            if(dock && dock.getClientRects().length){ var dr = dock.getBoundingClientRect(); if(dr.top > b.top + 100 && dr.top < bot) bot = dr.top; }
            return Math.min(560, Math.max(230, bot - b.top - 8));
          } });
          var fig = document.createElement('div'); fig.className = 'cd-fig mg2-mfig';
          fig.appendChild(matchLab.el); el.appendChild(fig);
          fig.__mg = { lab: matchLab, st: matchLab.st };   // tests read the drawn state here
          setTimeout(function(){ matchLab && matchLab.layout(); }, 30);
          qfig = null; return;
        }
        var narrow = false; try{ narrow = matchMedia('(max-width: 599.98px)').matches; }catch(e){}
        if(p.fig){ el.innerHTML = '<figure class="cd-fig mg-qfig">' + graphSvg(p.fig, narrow ? { w: 340, h: 230 } : null) + '</figure>'; qfig = { el: el, fig: p.fig }; requestAnimationFrame(fitQ); }
        else qfig = null;
      }
    });
    var qfig = null, rq = 0;
    function fitQ(){
      if(!qfig || !qfig.el.isConnected || !qfig.el.closest('.ls-phone')) return;
      var svg = qfig.el.querySelector('.mg-qfig svg'); if(!svg) return;
      var r = svg.getBoundingClientRect(), ms = getComputedStyle(svg).maxHeight, mh = /px$/.test(ms) ? parseFloat(ms) : Infinity;
      if(r.width < 120) return;
      var w = Math.round(r.width), h = Math.round(Math.max(100, Math.min(isFinite(mh) ? mh : r.height, r.height, w * 0.8)));
      var stg = svg.closest('.ls-stage'), low = stg && stg.getBoundingClientRect().bottom - r.bottom < 56;
      if(svg.getAttribute('data-fit') === w + 'x' + h + low) return;
      svg.outerHTML = graphSvg(qfig.fig, { w: w, h: h, R: low ? 62 : 0 }).replace('<svg ', '<svg data-fit="' + w + 'x' + h + low + '" ');
    }
    window.addEventListener('resize', function(){ if(rq) return; rq = requestAnimationFrame(function(){ rq = 0; fitQ(); }); });
  }

  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApPhysBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; sc.onerror = boot; document.head.appendChild(sc);
  }
})();
