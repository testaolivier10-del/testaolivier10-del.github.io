/* A&P Feedback loops, tools v2 Explore (docs/tools-v2-anp-feedback-loops-brief.md; standard docs/tools-v2-standard.md).

   The one idea: homeostasis by negative feedback. A change in a regulated variable is sensed, sent to a control center
   that compares it with the set point, and an effector's response pushes the variable back toward the set point; as it
   returns, the loop eases off by itself. Positive feedback is the other idea, on its own tab: the response makes the
   change bigger, turn after turn, until an event outside the loop ends it.

   Three screens, each a drawn body: body temperature (sweating and widened skin vessels, or narrowed vessels and
   shivering), blood glucose (insulin, or glucagon) and childbirth (stretch of the cervix and oxytocin). The student
   pushes the variable off normal (the thermometer, the glucose meter, the baby's head: K.handle); on release the loop
   runs, and each of its seven parts acts in place as the signal reaches it, while the value is drawn on the body and on
   a monitor trace against time with the set point and the normal range.

   A run is a pure function of the time since release (run.t): every frame, label, number, dot and cause line is read
   from the same state of the drawn moment (never from where the loop is going). Every timer stops when the stage hides
   (Test yourself, "?", another tab, the page hidden): the run jumps to its end and the screen comes back clean.

   Data: the loops' own slot texts (anatomy-physiology/data/tools/feedback-loops.json) name the seven parts on the line
   under the picture. Nothing here changes an item id or a record: Test yourself (feedback-loops.js) keeps every loop.
   window.AnpLoopExplore.build({ data, base, studio, onQuiz(id) }) -> { stage, ref, shown(on), tab(id?), tabFor(q), loopOf(tab) } */
(function(){
  'use strict';
  if(window.AnpLoopExplore) return;
  var NS = 'http://www.w3.org/2000/svg';
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function ss(t){ t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function ramp(x, a, b){ return ss((x - a) / (b - a)); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function f1(v){ return (Math.round(v * 10) / 10).toFixed(1); }
  function P(pts){ return pts.map(function(p, i){ return (i ? 'L' : 'M') + f1(p[0]) + ',' + f1(p[1]); }).join(''); }
  function sa(el, k, v){ v = String(v); if(el.getAttribute(k) !== v) el.setAttribute(k, v); }
  function so(el, v){ v = String(+(+v).toFixed(3)); if(el.style.opacity !== v) el.style.opacity = v; }
  function arrowHead(x, y, ang, s){
    var a = ang * Math.PI / 180, c = Math.cos(a), n = Math.sin(a);
    return 'M' + f1(x - c * s - n * s * 0.6) + ',' + f1(y - n * s + c * s * 0.6) + 'L' + f1(x) + ',' + f1(y) + 'L' + f1(x - c * s + n * s * 0.6) + ',' + f1(y - n * s - c * s * 0.6);
  }
  var SLOTS = ['stimulus', 'sensor', 'afferent', 'control', 'efferent', 'effector', 'response'];
  var NAMES = ['Stimulus', 'Sensor', 'Afferent pathway', 'Control center', 'Efferent pathway', 'Effector', 'Response'];
  var ROLE = ['stim', 'aff', 'aff', 'ctl', 'eff', 'eff', 'resp'];
  var PART_SAY = ['a change in the regulated variable', 'a sensory receptor that detects the change', 'carries the information toward the control center',
    'compares it with the set point and sends out a command', 'carries the command away from the control center', 'the muscle, gland or cells that act',
    'what the effector does to the variable; it feeds back on the stimulus'];

  /* ------------------------------------------------------------------ layouts */
  /* Each screen has two compositions of the same drawn parts: "wide" (2:1, a desktop stage) and "tall" (a phone or an
     upright tablet). L.g[name] = [x, y, scale] places a part drawn in its own coordinates; L.mon is the monitor's box. */
  function T(L, p){ var g = p[2] ? L.g[p[2]] : null; return g ? [g[0] + p[0] * g[2], g[1] + p[1] * g[2]] : [p[0], p[1]]; }
  function TS(L, pts){ return pts.map(function(p){ return T(L, p); }); }
  function G(L, name, inner, extra){ var g = L.g[name]; return '<g' + (extra || '') + ' transform="translate(' + f1(g[0]) + ',' + f1(g[1]) + ') scale(' + g[2] + ')">' + inner + '</g>'; }
  /* a polyline measured once: at(f) the point a fraction f along it */
  function Poly(pts){
    var c = [0], i;
    for(i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var len = c[c.length - 1] || 1;
    return { pts: pts, len: len, d: P(pts),
      at: function(f){
        var s = clamp(f, 0, 1) * len, j = 1;
        while(j < c.length - 1 && c[j] < s) j++;
        var a = pts[j - 1], b = pts[j], seg = (c[j] - c[j - 1]) || 1, u = (s - c[j - 1]) / seg;
        return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
      } };
  }
  function Route(polys){
    var tot = polys.reduce(function(a, p){ return a + p.len; }, 0) || 1;
    return { len: tot, polys: polys,
      at: function(f){ var s = clamp(f, 0, 1) * tot; for(var i = 0; i < polys.length; i++){ if(s <= polys[i].len || i === polys.length - 1) return polys[i].at(s / (polys[i].len || 1)); s -= polys[i].len; } } };
  }
  function join(){ var out = []; [].slice.call(arguments).forEach(function(a){ a.forEach(function(p, i){ if(!out.length || i) out.push(p); }); }); return out; }

  /* ------------------------------------------------------------------ the two kinds of run */
  /* Negative feedback. d is how far the push moved the value from the set point. The parts act at fixed moments after
     release (sc.TM); the value holds until the response starts, then returns along a lightly damped curve (a small
     overshoot inside the normal range, as the notes describe). Signals keep flowing while the value is off: a pulse
     leaves the sensor every PER seconds, sized by how far off the value was then, and the matching command leaves the
     control center when it arrives; the effector works in proportion to how far off the value is now, so the loop eases
     off as it corrects. */
  var PER = 0.34;
  function g(tau){ if(tau <= 0) return 1; var tc = 1.4, w = 1.1; return Math.exp(-tau / tc) * (Math.cos(w * tau) + Math.sin(w * tau) / (w * tc)); }
  function negDev(sc, run, t){ var M = sc.TM; return t < M.resp ? run.d : run.d * g(t - M.resp); }
  function negAct(sc, run, t){ var dv = negDev(sc, run, t); return clamp(run.s * dv / Math.abs(run.d) * 1.35, 0, 1); }
  function negState(sc, run, t){
    var M = sc.TM, end = M.resp + M.tail, st = { kind: 'neg', run: run, t: t, dir: run.s > 0 ? 'up' : 'down' };
    var dv = negDev(sc, run, t);
    st.x = sc.set + dv; st.dev = dv;
    var starts = [0, M.sens, M.aff, M.ctl, M.eff, M.act, M.resp];
    st.k = 0; for(var i = 0; i < 7; i++) if(t >= starts[i]) st.k = i;
    st.done = t >= end;
    st.a = negAct(sc, run, t);
    st.sens = ramp(t, M.sens - 0.12, M.sens + 0.12) * st.a;
    st.ctl = ramp(t, M.ctl - 0.1, M.ctl + 0.08) * negAct(sc, run, Math.max(0, t - (M.ctl - M.sens)));
    st.eff = ramp(t, M.act - 0.12, M.act + 0.4) * st.a;
    st.aff = []; st.effp = [];
    var ta = M.affEnd - M.aff, te = M.effEnd - M.eff;
    for(var n = 0; n < 60; n++){
      var t1 = M.aff + n * PER; if(t1 > t) break;
      var amp = negAct(sc, run, t1 - (M.aff - M.sens));
      if(amp < 0.12) continue;
      var p1 = ta > 0 ? (t - t1) / ta : 2;
      if(p1 <= 1) st.aff.push({ p: p1, a: amp });
      var t2 = M.eff + n * PER;
      if(t2 <= t){ var p2 = (t - t2) / te; if(p2 <= 1) st.effp.push({ p: p2, a: amp }); }
    }
    return st;
  }
  /* Positive feedback (childbirth). s is the stretch of the cervix, 0 (none) to 1 (full, the baby is born). Each turn
     of the loop has the same seven parts; its contraction is stronger than the last (c), so each turn adds more
     stretch, and the turns come closer together. When the stretch reaches full, the baby is born, the stretch on the
     cervix stops and the loop ends. Built once per push, so every frame reads the same plan. */
  var FR = { sens: 0.08, aff: 0.14, affEnd: 0.4, ctl: 0.4, eff: 0.5, effEnd: 0.72, act: 0.72, resp: 0.84, peak: 0.84 };
  function posPlan(s0){
    var cyc = [], s = s0, t = 0, c = 0.36;
    for(var k = 0; k < 8; k++){
      var D = Math.max(1.5, 3.0 - 0.4 * k), add = c * 0.33, s1 = s + add;
      cyc.push({ t0: t, D: D, s0: s, s1: Math.min(1, s1), c: Math.min(1, c) });
      t += D; s = s1; c = Math.min(1, c * 1.45);
      if(s >= 1) break;
    }
    return { kind: 'pos', s0: s0, cyc: cyc, birth: t, end: t + 2.0 };
  }
  function posValue(plan, t){
    // the stretch and the contraction at time t (both pure)
    if(t <= 0) return { s: plan.s0, c: 0 };
    if(t >= plan.birth){ var b = (t - plan.birth) / 1.6; return { s: lerp(1, 0, ramp(b, 0.85, 1)), c: lerp(0.4, 0, ramp(b, 0, 0.6)) }; }
    for(var i = 0; i < plan.cyc.length; i++){
      var y = plan.cyc[i]; if(t > y.t0 + y.D) continue;
      var u = (t - y.t0) / y.D;
      var c = y.c * (ramp(u, FR.act - 0.04, FR.peak) - 0.75 * ramp(u, FR.peak + 0.04, 1)) + (i ? plan.cyc[i - 1].c * 0.25 * (1 - ramp(u, 0, 0.3)) : 0);
      return { s: lerp(y.s0, y.s1, ramp(u, FR.act + 0.02, FR.peak + 0.06)), c: Math.max(0, c) };
    }
    return { s: 1, c: 0.4 };
  }
  function posState(sc, plan, t){
    var v = posValue(plan, t), st = { kind: 'pos', run: plan, t: t, x: v.s, c: v.c };
    st.done = t >= plan.end; st.born = t >= plan.birth ? clamp((t - plan.birth) / 1.6, 0, 1) : 0; st.birthing = t >= plan.birth;
    st.aff = []; st.effp = []; st.sens = 0; st.ctl = 0; st.eff = 0; st.k = 0; st.turn = 0;
    if(st.birthing){ st.k = 7; st.turn = plan.cyc.length - 1; return st; }
    for(var i = 0; i < plan.cyc.length; i++){
      var y = plan.cyc[i]; if(t > y.t0 + y.D && i < plan.cyc.length - 1) continue;
      var u = clamp((t - y.t0) / y.D, 0, 1), st0 = [0, FR.sens, FR.aff, FR.ctl, FR.eff, FR.act, FR.resp];
      st.turn = i; st.u = u;
      for(var j = 0; j < 7; j++) if(u >= st0[j]) st.k = j;
      st.sens = ramp(u, FR.sens - 0.04, FR.sens + 0.04) * (1 - ramp(u, FR.affEnd, FR.ctl + 0.1) * 0.6) * (0.5 + 0.5 * y.s0);
      if(u >= FR.aff && u <= FR.affEnd) st.aff.push({ p: (u - FR.aff) / (FR.affEnd - FR.aff), a: 1 });
      st.ctl = ramp(u, FR.ctl - 0.03, FR.ctl + 0.02) * (1 - ramp(u, FR.effEnd, FR.effEnd + 0.1));
      if(u >= FR.eff && u <= FR.effEnd) st.effp.push({ p: (u - FR.eff) / (FR.effEnd - FR.eff), a: 1 });
      st.eff = clamp(v.c, 0, 1);
      st.cyc = y;
      break;
    }
    return st;
  }

  var SCENES = [];

  /* ================================================================== 1. Body temperature */
  (function(){
    var LAY = {
      wide: { w: 1080, h: 540, g: { person: [520, 74, 1], mag: [856, 266, 1.1], therm: [392, 98, 1] }, mon: [14, 64, 306, 410], spread: { mon: -1, mag: 1 } },
      tall: { w: 600, h: 620, g: { person: [172, 70, 0.78], mag: [454, 204, 0.8], therm: [62, 104, 0.9] }, mon: [14, 432, 572, 178] }
    };
    var MIN = 35.5, MAX = 38.5, SET = 37;
    // the patch of skin on the forearm (person) that the magnifier shows; the nerves between it and the brain
    var PATCH = [96, 236];
    // up the arm, over the shoulder, up the back of the neck (behind the head, so hidden there) to the hypothalamus
    var AFF_P = [[96, 236], [93, 184], [86, 128], [64, 90], [28, 70], [8, 54], [4, 30], [2, 4], [0, -7]];
    var EFF_P = [[-1, -7], [-4, 4], [-6, 30], [-10, 54], [14, 74], [56, 98], [78, 134], [86, 188], [88, 232]];
    function inHead(q){ return Math.pow(q[0] / 36, 2) + Math.pow(q[1] / 44, 2) < 1 && q[1] > -2; }
    // inside the magnifier (r 170): the nerve ending's fiber to the edge; the command fiber from the edge to the effectors
    var AFF_M = [[-34, -64], [-50, -30], [-86, 14], [-120, 52], [-150, 80]];
    var EFF_M = [[-162, 46], [-126, 22], [-70, 14], [-10, 22], [58, 28]];
    var EFF_TO_ART = [[-70, 14], [-70, -4]], EFF_TO_MUS = [[-10, 22], [-10, 104]];
    function thermY(v){ return 300 * (MAX - v) / (MAX - MIN); }
    function knobAt(L, v){ return T(L, [0, thermY(v), 'therm']); }
    function geo(L){
      // the afferent route: nerve ending to the edge of the magnifier, then the patch on the arm to the brain
      var a1 = TS(L, AFF_M.map(function(p){ return [p[0], p[1], 'mag']; })), a2 = TS(L, AFF_P.map(function(p){ return [p[0], p[1], 'person']; }));
      var e1 = TS(L, EFF_P.map(function(p){ return [p[0], p[1], 'person']; })), e2 = TS(L, EFF_M.map(function(p){ return [p[0], p[1], 'mag']; }));
      return { aff: Route([Poly(a1), Poly(a2)]), eff: Route([Poly(e1), Poly(e2)]) };
    }
    function person(){
      var p = '';
      // legs, shorts, shoes
      p += '<path class="fe-skinp" d="M-44,330 C-46,370 -44,410 -42,436 L-18,436 C-16,410 -12,370 -8,334 Z M44,330 C46,370 44,410 42,436 L18,436 C16,410 12,370 8,334 Z"/>';
      p += '<path class="fe-shoe" d="M-46,432 C-46,446 -52,452 -60,456 C-40,460 -22,460 -14,456 L-16,432 Z M46,432 C46,446 52,452 60,456 C40,460 22,460 14,456 L16,432 Z"/>';
      p += '<path class="fe-shorts" d="M-60,276 C-62,300 -58,330 -54,350 L-4,352 L0,318 L4,352 L54,350 C58,330 62,300 60,276 Z"/>';
      // arms: the viewer's right forearm holds the magnified patch
      p += '<path class="fe-skinp" d="M-78,120 C-90,160 -96,200 -98,250 C-99,272 -98,290 -96,300 L-80,300 C-80,280 -80,262 -79,248 C-76,206 -70,170 -60,138 Z"/>';
      p += '<path class="fe-skinp" d="M78,120 C90,160 96,200 98,250 C99,272 98,290 96,300 L80,300 C80,280 80,262 79,248 C76,206 70,170 60,138 Z"/>';
      p += '<path class="fe-hand" d="M-96,298 C-104,310 -102,330 -90,336 C-80,340 -74,330 -76,318 C-77,308 -79,302 -80,300 Z M96,298 C104,310 102,330 90,336 C80,340 74,330 76,318 C77,308 79,302 80,300 Z"/>';
      // the shirt with short sleeves
      p += '<path class="fe-shirt" d="M-16,56 C-46,62 -72,72 -84,92 C-92,108 -94,124 -92,140 L-64,146 L-62,136 C-64,190 -62,240 -60,286 L60,286 C62,240 64,190 62,136 L64,146 L92,140 C94,124 92,108 84,92 C72,72 46,62 16,56 Z"/>';
      p += '<path class="fe-fold" d="M-62,146 C-56,166 -58,186 -60,200 M62,146 C56,166 58,186 60,200 M-34,268 C-10,274 14,274 36,268"/>';
      p += '<path class="fe-collar" d="M-18,57 C-8,72 8,72 18,57"/>';
      // the two nerves (drawn under the neck and head: they run up the back of the neck)
      p += '<path class="fe-nv is-aff fe-nvp" data-r="affp" d="' + P(AFF_P) + '"/><path class="fe-nv is-eff fe-nvp" data-r="effp" d="' + P(EFF_P) + '"/>';
      // neck and head
      p += '<path class="fe-skinp" d="M-13,30 L-13,60 C-6,66 6,66 13,60 L13,30 Z"/>';
      p += '<ellipse class="fe-ear" cx="-35" cy="2" rx="7" ry="11"/><ellipse class="fe-ear" cx="35" cy="2" rx="7" ry="11"/>';
      p += '<ellipse class="fe-skinp" cx="0" cy="0" rx="34" ry="42"/>';
      p += '<path class="fe-hair" d="M-36,-6 C-40,-36 -20,-50 2,-48 C26,-46 42,-30 36,-6 C30,-22 18,-30 2,-30 C-16,-30 -30,-22 -36,-6 Z"/>';
      // the top of the head cut away: the skull's rim, the brain's two halves, the hypothalamus at its base
      p += '<path class="fe-skull" d="M-33,-8 C-36,-34 -20,-50 0,-50 C20,-50 36,-34 33,-8 C30,-2 20,0 8,-1 L-8,-1 C-20,0 -30,-2 -33,-8 Z"/>';
      p += '<path class="fe-brainc" d="M-29,-9 C-32,-30 -18,-45 -1,-45 L-1,-6 C-10,-4 -22,-3 -29,-9 Z M1,-45 C18,-45 32,-30 29,-9 C22,-3 10,-4 1,-6 Z"/>';
      p += '<path class="fe-gyrc" d="M-22,-30 c5,-4 8,2 13,-1 M-24,-18 c5,-3 9,3 14,0 M8,-34 c5,-4 9,3 13,0 M10,-20 c5,-3 9,3 14,0 M-14,-40 c4,-2 7,2 10,0"/>';
      p += '<ellipse class="fe-hypo" data-r="hypo" cx="0" cy="-7" rx="6" ry="4"/>';
      p += '<path class="fe-brow" d="M-20,-4 q7,-4 14,0 M6,-4 q7,-4 14,0"/><ellipse class="fe-eye" cx="-12" cy="5" rx="3.4" ry="4"/><ellipse class="fe-eye" cx="12" cy="5" rx="3.4" ry="4"/>';
      p += '<path class="fe-nose" d="M0,8 C-2,16 -5,20 -1,22 C2,23 4,22 5,20"/><path class="fe-mouth" d="M-10,30 C-5,28 5,28 10,30"/>';
      return p;
    }
    // skin overlays that follow the skin vessels: flushed (widened), pale (narrowed)
    function skinShapes(){
      return '<path d="M-78,120 C-90,160 -96,200 -98,250 C-99,272 -98,290 -96,300 L-80,300 C-80,280 -80,262 -79,248 C-76,206 -70,170 -60,138 Z M78,120 C90,160 96,200 98,250 C99,272 98,290 96,300 L80,300 C80,280 80,262 79,248 C76,206 70,170 60,138 Z' +
        'M-96,298 C-104,310 -102,330 -90,336 C-80,340 -74,330 -76,318 C-77,308 -79,302 -80,300 Z M96,298 C104,310 102,330 90,336 C80,340 74,330 76,318 C77,308 79,302 80,300 Z' +
        'M-44,350 C-46,380 -44,410 -42,432 L-18,432 C-16,410 -12,380 -8,352 Z M44,350 C46,380 44,410 42,432 L18,432 C16,410 12,380 8,352 Z M-13,30 L-13,60 C-6,66 6,66 13,60 L13,30 Z' +
        'M-34,-4 C-34,30 -18,42 0,42 C18,42 34,30 34,-4 Z"/>';
    }
    function mag(){
      var m = '<defs><clipPath id="fe-tmag"><circle cx="0" cy="0" r="170"/></clipPath></defs><circle class="fe-magbg" r="170"/><g clip-path="url(#fe-tmag)">';
      m += '<rect class="fe-air" x="-180" y="-180" width="360" height="92"/>';
      m += '<path class="fe-dermis" d="M-180,-62 C-120,-58 -60,-66 0,-60 C60,-54 120,-64 180,-60 L180,52 L-180,52 Z"/>';
      // collagen
      m += '<path class="fe-coll" d="M-160,-30 c20,-8 30,8 50,0 M-20,-36 c20,-8 30,8 50,0 M100,-34 c20,-8 30,8 50,0 M-140,30 c20,-8 30,8 50,0 M20,38 c20,-8 30,8 50,0 M120,26 c16,-6 24,6 40,0"/>';
      // fat
      m += '<rect class="fe-fatbg" x="-180" y="52" width="360" height="42"/>';
      for(var i = 0; i < 9; i++) m += '<ellipse class="fe-fatc" cx="' + (-160 + i * 40) + '" cy="73" rx="19" ry="17"/>';
      // skeletal muscle under the skin
      m += '<g data-r="musg"><rect class="fe-musbg" x="-180" y="94" width="360" height="90"/>';
      for(i = 0; i < 4; i++) m += '<rect class="fe-musf" x="-190" y="' + (98 + i * 20) + '" width="380" height="17" rx="8"/>';
      m += '<path class="fe-mustr" d="' + (function(){ var s = ''; for(var x = -176; x < 180; x += 9) s += 'M' + x + ',98 v78 '; return s; })() + '"/>';
      m += '<rect class="fe-heatin" data-r="heatin" x="-180" y="94" width="360" height="90"/></g>';
      // epidermis, with its cells, over the dermis
      m += '<path class="fe-epi" d="M-180,-92 C-120,-88 -60,-96 0,-90 C60,-84 120,-94 180,-90 L180,-60 C120,-64 60,-54 0,-60 C-60,-66 -120,-58 -180,-62 Z"/>';
      m += '<path class="fe-epic" d="M-170,-76 h20 M-140,-80 h22 M-110,-74 h20 M-80,-80 h22 M-50,-76 h20 M-20,-78 h22 M10,-74 h20 M40,-80 h22 M70,-76 h20 M100,-78 h22 M130,-74 h20 M160,-80 h18"/>';
      // the arteriole (wall and lumen are drawn by paint)
      m += '<path class="fe-artw" data-r="artw" d="M-180,-12 C-90,-18 0,-6 90,-14 C130,-18 160,-12 180,-14"/>';
      m += '<path class="fe-artl" data-r="artl" d="M-180,-12 C-90,-18 0,-6 90,-14 C130,-18 160,-12 180,-14"/>';
      m += '<g data-r="rbc"></g>';
      // the sweat gland: a coil deep in the dermis, its duct up to a pore
      m += '<path class="fe-gland" data-r="gland" d="M66,34 c-14,-2 -18,-14 -6,-18 c12,-4 22,6 12,12 c-10,6 -24,-2 -18,-12 c6,-10 26,-8 26,4 c0,10 -16,16 -24,10"/>';
      m += '<path class="fe-duct" d="M62,14 C58,-10 70,-30 62,-50 C58,-64 62,-80 60,-92"/>';
      m += '<path class="fe-duct-in" data-r="duct" d="M62,14 C58,-10 70,-30 62,-50 C58,-64 62,-80 60,-92"/>';
      // the nerve ending (sensor) and its fiber; the command fiber and its branches
      m += '<path class="fe-nv is-aff" data-r="affm" d="' + P(AFF_M) + '"/>';
      m += '<path class="fe-nend is-aff" data-r="nend" d="M-34,-64 l-12,-14 M-34,-64 l4,-18 M-34,-64 l16,-10 M-46,-78 l-6,-4 M-30,-82 l2,-6"/>';
      m += '<path class="fe-nv is-eff" data-r="effm" d="' + P(EFF_M) + ' M-70,14 L-70,-4 M-10,22 L-10,104"/>';
      m += '</g>';
      // above the skin: sweat on the surface, vapor, heat leaving
      m += '<g data-r="drop"><ellipse class="fe-sweat" cx="60" cy="-92" rx="10" ry="6"/></g>';
      m += '<g data-r="vap"></g><g data-r="heat"></g>';
      m += '<circle class="fe-magring" r="170"/>';
      return m;
    }
    function therm(E){
      // a wall thermometer, 35.5 to 38.5 °C; the normal range shaded, the set point marked
      var fs = E.fsm / E.L.g.therm[2], s = '<rect class="fe-tband" x="-16" y="' + f1(thermY(37.5)) + '" width="32" height="' + f1(thermY(36.5) - thermY(37.5)) + '" rx="4"/>';
      s += '<rect class="fe-ttube" x="-10" y="-8" width="20" height="324" rx="10"/><circle class="fe-tbulb" cx="0" cy="326" r="20"/>';
      s += '<rect class="fe-tcol" data-r="tcol" x="-5" y="0" width="10" height="320" rx="5"/><circle class="fe-tbulbc" cx="0" cy="326" r="14"/>';
      for(var v = 36; v <= 38; v += 0.5){ var y = thermY(v), big = v % 1 === 0; s += '<path class="fe-ttick' + (v === SET ? ' is-set' : '') + '" d="M-10,' + f1(y) + 'h' + (big ? -21 : -9) + '"/>'; if(big) s += '<text class="fe-ttxt' + (v === SET ? ' is-set' : '') + '" x="-37" y="' + f1(y) + '" dy="0.35em" style="font-size:' + f1(fs) + 'px">' + v + '</text>'; }
      return s;
    }
    SCENES.push({
      id: 'temperature', tab: 'Temperature', short: 'Temperature', kind: 'neg', loops: { up: 'temperature-hot', down: 'temperature-cold' },
      topics: ['homeostasis-feedback', 'skin-functions', 'energy-balance-thermoregulation'],
      purpose: 'Push body temperature off 37 °C and watch the loop answer',
      cue: 'Drag the thermometer', thing: 'thermometer', layouts: LAY,
      set: SET, min: MIN, max: MAX, step: 0.1, dead: 0.1, band: [36.5, 37.5],
      fmt: function(v){ return v.toFixed(1) + ' °C'; },
      TM: { sens: 0.35, aff: 0.8, affEnd: 1.75, ctl: 1.75, eff: 2.35, effEnd: 3.3, act: 3.3, resp: 3.7, tail: 4.4 },
      mon: { title: 'Body temperature', short: 'Temperature', lo: 35.5, hi: 38.5, ticks: [36, 37, 38], unit: '°C', setLabel: 'Set point', role: 'temp' },
      knobAt: knobAt,
      pick: function(L, x, y){ var g0 = L.g.therm; return MAX - (y - g0[1]) / (300 * g0[2]) * (MAX - MIN); },
      valRole: function(v){ return v > SET + 0.05 ? 'heat' : v < SET - 0.05 ? 'cold' : 'tok'; },
      // a signal behind the head (the back of the neck) is not drawn over the face
      pulseHidden: function(E, q){ var g0 = E.L.g.person; return inHead([(q[0] - g0[0]) / g0[2], (q[1] - g0[1]) / g0[2]]); },
      geo: geo,
      art: function(E){
        var L = E.L, gg = geo(L), s = '<defs><linearGradient id="fe-skin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E0AD8E"/><stop offset="0.5" stop-color="#F4D4BE"/><stop offset="1" stop-color="#DDA888"/></linearGradient>' +
          '<linearGradient id="fe-shirt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2F6D8C"/><stop offset="0.4" stop-color="#4C8FB0"/><stop offset="1" stop-color="#2F6D8C"/></linearGradient>' +
          '<linearGradient id="fe-shorts" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4A556B"/><stop offset="0.5" stop-color="#5E6A82"/><stop offset="1" stop-color="#4A556B"/></linearGradient>' +
          '<linearGradient id="fe-mus" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D86A57"/><stop offset="1" stop-color="#A9402F"/></linearGradient></defs>';
        s += '<rect class="fe-bg" x="-400" y="0" width="' + (L.w + 800) + '" height="' + L.h + '"/>';
        // zoom lines from the patch on the forearm to the magnifier
        var pa = T(L, [PATCH[0], PATCH[1], 'person']), mg = L.g.mag, r = 170 * mg[2], ang = Math.atan2(mg[1] - pa[1], mg[0] - pa[0]);
        var z1 = [mg[0] + Math.cos(ang + Math.PI / 2 + 0.25) * r, mg[1] + Math.sin(ang + Math.PI / 2 + 0.25) * r], z2 = [mg[0] + Math.cos(ang - Math.PI / 2 - 0.25) * r, mg[1] + Math.sin(ang - Math.PI / 2 - 0.25) * r];
        s += '<path class="fe-zoom" d="M' + f1(pa[0]) + ',' + f1(pa[1]) + 'L' + f1(z1[0]) + ',' + f1(z1[1]) + 'M' + f1(pa[0]) + ',' + f1(pa[1]) + 'L' + f1(z2[0]) + ',' + f1(z2[1]) + '"/>';
        s += '<g data-r="body">' + G(L, 'person', person() + '<g class="fe-flush" data-r="flush">' + skinShapes() + '</g><g class="fe-pale" data-r="pale">' + skinShapes() + '</g>' +
          '<g data-r="sweatp"></g><circle class="fe-patch" cx="' + PATCH[0] + '" cy="' + PATCH[1] + '" r="10"/>') + '</g>';
        // the two nerves between the arm and the brain (afferent orange, efferent sky blue)
        s += G(L, 'mag', mag());
        s += G(L, 'therm', therm(E));
        s += '<g data-r="pulses"></g>';
        return s;
      },
      fxInit: function(fx, R, E){
        var g0 = E.L.g.mag, h = '', i;
        // red blood cells in the arteriole
        for(i = 0; i < 9; i++) h += '<ellipse class="fe-rbc" rx="7" ry="4.5" cx="' + (-160 + i * 40) + '" cy="' + f1(-12 - 3 * Math.sin(i)) + '"/>';
        R.rbc.innerHTML = h;
        // sweat beads on the person (forehead, arms) and vapor and heat above the magnified skin
        var b = '';
        [[-24, 14], [24, 16], [-18, 24], [86, 190], [-88, 214], [92, 262], [-90, 268], [18, 26]].forEach(function(p){ b += '<path class="fe-bead" d="M' + p[0] + ',' + (p[1] - 5) + ' c-3,4 -4,6 -4,8 a4,4 0 0 0 8,0 c0,-2 -1,-4 -4,-8 Z"/>'; });
        R.sweatp.innerHTML = b;
        var v = '';
        [[48, -108], [66, -126], [56, -146]].forEach(function(p){ v += '<path class="fe-vapor" d="M' + p[0] + ',' + p[1] + ' c-6,-6 6,-10 0,-16 c-6,-6 6,-10 0,-16"/>'; });
        R.vap.innerHTML = v;
        var hh = '';
        [-130, -60, 120].forEach(function(x){ hh += '<g class="fe-hwave"><path d="M' + x + ',-100 c-8,-10 8,-16 0,-26 c-8,-10 8,-16 0,-26"/><path d="' + arrowHead(x, -156, -90, 8) + '"/></g>'; });
        R.heat.innerHTML = hh;
      },
      paint: function(R, st, E){
        var hot = st.dir === 'up', eff = st.eff || 0, dil = hot ? eff : 0, con = hot ? 0 : eff, sw = hot ? eff : 0, shv = hot ? 0 : eff;
        // the thermometer's column follows the drawn value
        var y = thermY(st.x);
        sa(R.tcol, 'y', f1(y)); sa(R.tcol, 'height', f1(326 - y));
        // skin colour, sweat, shivering (the whole body trembles a little, fast)
        so(R.flush, 0.32 * dil); so(R.pale, 0.42 * con);
        so(R.sweatp, sw);
        var jit = shv > 0.02 ? Math.sin(st.t * 78) * 1.6 * shv : 0;
        sa(R.body, 'transform', jit ? 'translate(' + f1(jit) + ',0)' : '');
        // the arteriole widens or narrows
        var lw = 14 * (1 + 0.75 * dil - 0.5 * con);
        sa(R.artl, 'style', 'stroke-width:' + f1(lw) + 'px'); sa(R.artw, 'style', 'stroke-width:' + f1(lw + 10 - 3 * dil + 4 * con) + 'px');
        var ry = 4.5 * (1 + 0.5 * dil - 0.35 * con);
        [].forEach.call(R.rbc.childNodes, function(n){ sa(n, 'ry', f1(ry)); });
        // sweat in the duct and on the surface, vapor rising off it; heat leaving the warm skin
        so(R.duct, sw); so(R.drop, sw);
        sa(R.drop.firstChild, 'rx', f1(6 + 10 * sw)); sa(R.drop.firstChild, 'ry', f1(3 + 3 * sw));
        so(R.vap, sw * 0.9);
        [].forEach.call(R.vap.childNodes, function(n, i){ var ph = ((st.t * 0.9 + i / 3) % 1); sa(n, 'transform', sw > 0.02 ? 'translate(0,' + f1(-ph * 14) + ')' : ''); so(n, sw > 0.02 ? 1 - ph : 0); });
        so(R.heat, dil);
        [].forEach.call(R.heat.childNodes, function(n, i){ var ph = ((st.t * 0.8 + i / 3) % 1); sa(n, 'transform', dil > 0.02 ? 'translate(0,' + f1(-ph * 10) + ')' : ''); });
        // shivering: the muscle fibers jitter and make heat
        sa(R.musg, 'transform', shv > 0.02 ? 'translate(' + f1(Math.sin(st.t * 90) * 2.2 * shv) + ',0)' : '');
        so(R.heatin, 0.55 * shv);
        // the parts light as the signal reaches them
        R.nend.classList.toggle('is-on', st.sens > 0.05); so(R.nend, 0.45 + 0.55 * clamp(st.sens * 1.4, 0, 1));
        R.affm.classList.toggle('is-on', st.k >= 2 && st.aff.length > 0); R.affp.classList.toggle('is-on', st.k >= 2 && st.aff.length > 0);
        R.effm.classList.toggle('is-on', st.effp.length > 0 || eff > 0.05); R.effp.classList.toggle('is-on', st.effp.length > 0);
        R.hypo.classList.toggle('is-on', st.ctl > 0.05); so(R.hypo, 0.55 + 0.45 * clamp(st.ctl * 1.4, 0, 1));
        R.gland.classList.toggle('is-on', sw > 0.05);
      },
      labels: function(st, E){
        var L = E.L, k = st.k, hot = st.dir === 'up', out = [], idle = k < 0;
        var M = function(p){ return T(L, [p[0], p[1], 'mag']); }, B = function(p){ return T(L, [p[0], p[1], 'person']); };
        if(idle || k === 0) out.push({ key: 'skin', text: 'Skin', role: 'tok', at: M([-130, -76]), side: ['u', 'r'] });
        if(k >= 1 && k <= 2 && st.sens > 0.05) out.push({ key: 'nend', text: 'Nerve ending', role: 'aff', at: M([-34, -70]), side: ['u', 'l', 'r'], strong: k === 1 });
        if(k === 2) out.push({ key: 'affn', text: 'Sensory nerve', role: 'aff', at: B([90, 150]), side: ['r', 'l'], strong: true });
        // the brain's label sits off the head; k >= 3 names the hypothalamus at its base
        var hd = { c: B([0, 0]), r: 46 * L.g.person[2] };
        out.push({ key: 'brain', text: k >= 3 ? 'Hypothalamus' : 'Brain', role: k >= 3 ? 'ctl' : 'tok', at: k >= 3 ? B([0, -7]) : B([-14, -32]), side: ['l', 'r', 'u'], strong: k === 3, lead: true, avoid: [hd] });
        if(k === 4) out.push({ key: 'effn', text: 'Efferent nerve', role: 'eff', at: B([36, 86]), side: ['r', 'u'], strong: true, avoid: [hd] });
        // the effectors are named from outside the magnifier, each with a line to its part, so the part stays in sight
        var mg = L.g.mag, ring = { c: [mg[0], mg[1]], r: 170 * mg[2] };
        if(k >= 5 && !st.done && st.eff > 0.15){
          if(hot){ out.push({ key: 'gland', text: 'Sweat gland', role: 'eff', at: M([68, 30]), side: ['d', 'r'], strong: k === 5, lead: true, avoid: [ring] }); out.push({ key: 'art', text: 'Arteriole widens', role: 'eff', at: M([-128, -14]), side: ['l', 'u'], lead: true, avoid: [ring] }); }
          else { out.push({ key: 'mus', text: 'Muscle shivers', role: 'eff', at: M([60, 140]), side: ['d', 'r'], strong: k === 5, lead: true, avoid: [ring] }); out.push({ key: 'art', text: 'Arteriole narrows', role: 'eff', at: M([-128, -14]), side: ['l', 'u'], lead: true, avoid: [ring] }); }
        }
        // the response inside the magnifier: heat above the skin (air), or in the shivering muscle
        if(k === 6 && !st.done && st.eff > 0.15) out.push({ key: 'resp', text: hot ? 'Heat lost' : 'Heat kept, made', role: 'heat', at: hot ? M([-20, -128]) : M([-40, 150]), side: ['r', 'l', 'u', 'd'], strong: true, inside: { c: [mg[0], mg[1]], r: 170 * mg[2] } });
        return out;
      },
      words: function(st){
        var hot = st.dir === 'up', v = this.fmt(st.x), k = st.k;
        if(st.done) return { pre: 'Response:', parts: [{ t: v, role: 'temp' }, { t: 'back near the set point', role: 'temp' }, { t: hot ? 'sweating stops' : 'shivering stops', role: 'eff' }] };
        switch(k){
          case 0: return { pre: 'Stimulus:', parts: [{ t: hot ? 'Body warms to ' + v : 'Body cools to ' + v, role: hot ? 'heat' : 'cold' }] };
          case 1: return { pre: 'Sensor:', parts: [{ t: hot ? 'Warm-sensitive nerve endings fire' : 'Cold-sensitive nerve endings fire', role: 'aff' }] };
          case 2: return { pre: 'Afferent:', parts: [{ t: 'Sensory nerves', role: 'aff' }, { t: 'signals to the brain', role: 'aff' }] };
          case 3: return { pre: 'Control center:', parts: [{ t: v + ' vs set point 37.0', role: 'ctl' }, { t: hot ? 'too warm' : 'too cold', role: hot ? 'heat' : 'cold' }] };
          case 4: return { pre: 'Efferent:', parts: [{ t: 'Nerves', role: 'eff' }, { t: hot ? 'to skin vessels, sweat glands' : 'to skin vessels, muscles', role: 'eff' }] };
          case 5: return { pre: 'Effector:', parts: hot ? [{ t: 'Arterioles widen', role: 'eff' }, { t: 'sweat glands sweat', role: 'eff', join: '+' }] : [{ t: 'Arterioles narrow', role: 'eff' }, { t: 'muscles shiver', role: 'eff', join: '+' }] };
          default:
            if(st.eff < 0.15) return { pre: 'Response:', parts: [{ t: v, role: 'temp' }, { t: 'near the set point', role: 'temp' }, { t: hot ? 'sweating eases off' : 'shivering eases off', role: 'eff' }] };
            return { pre: 'Response:', parts: hot ? [{ t: 'Heat leaves the skin', role: 'heat' }, { t: v, role: 'temp' }] : [{ t: 'Heat kept in and made', role: 'heat' }, { t: v, role: 'temp' }] };
        }
      },
      take: function(st){ return st.dir === 'up' ? 'Negative feedback: sweating and wide skin vessels undid the rise, then switched off.' : 'Negative feedback: narrow skin vessels and shivering undid the fall, then switched off.'; },
      idleWords: function(x){ var at = Math.abs(x - SET) < 0.05; return { pre: 'Now:', parts: [{ t: this.fmt(x), role: 'temp' }, { t: at ? 'at the set point' : 'near the set point', role: 'temp' }, { t: at ? 'nothing to correct' : 'too small to correct' }] }; },
      note: 'One patch of skin on the forearm is magnified; the same happens in skin all over the body. The brain also has its own temperature-sensitive neurons in the hypothalamus, which sense the blood flowing through it. The nerves are drawn as one route from the arm to the brain and back; in the body the sensory signal enters the spinal cord and climbs to the brain. Narrow skin vessels keep warm blood away from the skin, so less heat is lost; shivering is skeletal muscle contracting in rapid small bursts, which releases heat. Sweat cools you only as it evaporates. The trace wobbles a little past the set point and settles, inside the normal range.'
    });
  })();

  /* ================================================================== 2. Blood glucose */
  (function(){
    var LAY = {
      wide: { w: 1080, h: 540, g: { person: [520, 76, 1], mag: [858, 268, 1.1], therm: [392, 104, 1] }, mon: [14, 64, 306, 410], spread: { mon: -1, mag: 1 } },
      tall: { w: 600, h: 620, g: { person: [178, 70, 0.78], mag: [456, 206, 0.82], therm: [70, 104, 0.9] }, mon: [14, 432, 572, 178] }
    };
    var MIN = 55, MAX = 160, SET = 88;
    function meterY(v){ return 300 * (MAX - v) / (MAX - MIN); }
    // the islet spot on the pancreas (person) and the vessels from it
    var ISLET = [26, 214];
    var V_AORTA = [[4, 108], [4, 380]];
    var TO_LIVER = [[26, 214], [4, 214], [4, 176], [-22, 172]];
    var TO_MUS = [[26, 214], [4, 214], [4, 116], [40, 104], [76, 130], [92, 176], [96, 200]];
    var TO_FAT = [[26, 214], [4, 214], [4, 320], [-30, 330]];
    // where glucose sits in the blood (person): slots along the vessels, shown as the level needs
    var SLOTS_G = [[4, 128], [4, 150], [4, 196], [4, 240], [4, 262], [4, 290], [4, 344], [4, 366], [-12, 174], [24, 106], [60, 112], [84, 152], [-16, 326], [14, 214], [4, 306], [4, 228], [52, 108], [-2, 172]];
    function geo(L){
      var m = function(pts){ return Poly(TS(L, pts.map(function(p){ return [p[0], p[1], 'person']; }))); };
      // out of the islet in the magnifier first, then into the body's vessels
      var mOut = Poly(TS(L, [[20, -6, 'mag'], [80, -10, 'mag'], [140, -15, 'mag']]));
      return { liver: m(TO_LIVER), mus: m(TO_MUS), fat: m(TO_FAT), out: mOut };
    }
    function person(){
      var p = '';
      p += '<path class="fe-pants" d="M-72,384 C-60,380 60,380 72,384 L80,452 L-80,452 Z"/>';
      p += '<path class="fe-skinp" d="M-104,196 C-112,250 -116,300 -112,346 C-110,366 -100,378 -90,376 C-84,350 -84,300 -82,250 Z M104,196 C112,250 116,300 112,346 C110,366 100,378 90,376 C84,350 84,300 82,250 Z"/>';
      p += '<path class="fe-hand" d="M-112,346 C-122,356 -120,380 -104,388 C-92,392 -84,382 -88,368 C-90,358 -96,352 -100,350 Z M112,346 C122,356 120,380 104,388 C92,392 84,382 88,368 C90,358 96,352 100,350 Z"/>';
      p += '<path class="fe-shirt2" d="M-18,82 C-50,88 -84,98 -98,118 C-110,140 -112,180 -108,210 L-80,214 L-78,196 C-80,260 -78,340 -74,392 L74,392 C78,340 80,260 78,196 L80,214 L108,210 C112,180 110,140 98,118 C84,98 50,88 18,82 Z"/>';
      p += '<path class="fe-fold" d="M-78,214 C-70,230 -72,250 -76,262 M-40,376 C-10,382 20,382 44,376"/>';
      p += '<path class="fe-skinp" d="M-16,40 L-16,88 C-8,96 8,96 16,88 L16,40 Z"/><path class="fe-collar" d="M-20,84 C-10,100 10,100 20,84"/>';
      p += '<ellipse class="fe-ear" cx="-42" cy="4" rx="8" ry="13"/><ellipse class="fe-ear" cx="42" cy="4" rx="8" ry="13"/><ellipse class="fe-skinp" cx="0" cy="0" rx="42" ry="52"/>';
      p += '<path class="fe-hair2" d="M-44,-4 C-48,-44 -22,-60 2,-58 C30,-56 50,-38 44,-4 C38,-24 22,-34 4,-34 C-16,-34 -34,-24 -44,-4 Z"/>';
      p += '<path class="fe-brow" d="M-24,-10 q9,-5 17,0 M7,-10 q9,-5 17,0"/><ellipse class="fe-eye" cx="-15" cy="0" rx="4" ry="4.6"/><ellipse class="fe-eye" cx="15" cy="0" rx="4" ry="4.6"/>';
      p += '<path class="fe-nose" d="M0,4 C-3,14 -6,20 -1,23 C2,24 5,23 6,21"/><path class="fe-mouth" d="M-12,34 C-6,31 6,31 12,34"/>';
      // the window into the trunk; a window into the upper arm (muscle) and one into the belly's fat
      p += '<path class="fe-win" d="M-64,128 C-30,118 30,118 64,128 L64,300 C30,306 -30,306 -64,300 Z"/>';
      p += '<path class="fe-win" d="M-60,308 C-30,302 -2,302 18,306 L16,372 C-10,376 -40,376 -60,372 Z"/>';
      p += '<path class="fe-win" d="M84,150 C98,146 110,154 112,170 L114,250 C106,258 92,258 86,250 Z"/>';
      // fat cells
      [[-46, 326], [-24, 322], [-2, 326], [-48, 352], [-26, 350], [-4, 352]].forEach(function(c){ p += '<ellipse class="fe-adip" data-fat="1" cx="' + c[0] + '" cy="' + c[1] + '" rx="11" ry="10"/>'; });
      // muscle fibers in the arm
      p += '<path class="fe-armmus" d="M88,160 C98,156 108,162 110,174 L112,244 C104,250 94,250 90,244 Z"/><path class="fe-armstr" d="M92,176 h18 M92,188 h18 M92,200 h19 M92,212 h19 M92,224 h19 M92,236 h19"/>';
      // liver, stomach, pancreas
      p += '<path class="fe-liver" data-r="liver" d="M-60,150 C-46,136 4,134 30,142 C42,148 36,170 18,176 C-10,186 -40,184 -52,178 C-64,170 -66,158 -60,150 Z"/>';
      p += '<path class="fe-stom" d="M24,156 C40,150 58,156 58,176 C58,196 44,206 28,204 C18,203 14,196 18,190 C26,186 34,184 34,176 C34,168 26,166 24,156 Z"/>';
      p += '<path class="fe-panc" data-r="panc" d="M-14,212 C-6,204 14,206 30,208 C44,208 56,204 60,210 C62,218 50,222 34,222 C16,224 -2,224 -12,220 Z"/>';
      p += '<path class="fe-pancl" d="M0,214 c4,-3 8,3 12,0 M24,214 c4,-3 8,3 12,0 M44,212 c4,-3 8,3 12,0"/>';
      // the aorta and its branches
      p += '<path class="fe-bv" d="' + P(V_AORTA) + '"/><path class="fe-bv is-thin" d="' + P(TO_LIVER) + 'M' + P(TO_MUS).slice(1) + 'M' + P(TO_FAT).slice(1) + '"/>';
      p += '<circle class="fe-patch" cx="' + ISLET[0] + '" cy="' + ISLET[1] + '" r="9"/>';
      // glycogen granules (rosettes) in the liver and the muscle
      [[-40, 156], [-24, 162], [-8, 152], [8, 160], [-30, 172], [-12, 170], [-48, 166], [20, 154]].forEach(function(c, i){ p += '<g class="fe-gly" data-gly="' + i + '" transform="translate(' + c[0] + ',' + c[1] + ')"><circle r="3.2"/><circle cx="4" cy="2" r="2.4"/><circle cx="-3" cy="3" r="2.2"/></g>'; });
      [[100, 182], [97, 206], [102, 228]].forEach(function(c, i){ p += '<g class="fe-gly" data-glym="' + i + '" transform="translate(' + c[0] + ',' + c[1] + ')"><circle r="3"/><circle cx="3.6" cy="2" r="2.2"/></g>'; });
      return p;
    }
    function mag(){
      // an islet among the pancreas's enzyme-making cells, with a capillary through it
      var m = '<defs><clipPath id="fe-gmag"><circle cx="0" cy="0" r="150"/></clipPath></defs><circle class="fe-magbg" r="150"/><g clip-path="url(#fe-gmag)">';
      m += '<rect class="fe-acbg" x="-160" y="-160" width="320" height="320"/>';
      for(var i = 0; i < 26; i++){ var a = i * 2.4, rr = 120 + (i % 3) * 18, x = Math.cos(a) * rr, y = Math.sin(a) * rr; m += '<circle class="fe-acin" cx="' + f1(x) + '" cy="' + f1(y) + '" r="22"/><circle class="fe-acnuc" cx="' + f1(x * 1.06) + '" cy="' + f1(y * 1.06) + '" r="5"/>'; }
      m += '<ellipse class="fe-islet" cx="0" cy="4" rx="96" ry="88"/>';
      // the capillary through the islet
      m += '<path class="fe-cap" d="M-160,40 C-90,30 -40,-4 20,-6 C80,-8 120,-12 160,-16"/><path class="fe-capl" d="M-160,40 C-90,30 -40,-4 20,-6 C80,-8 120,-12 160,-16"/>';
      return m;
    }
    // a human islet: beta cells (about 55%) and alpha cells mixed through it, not in a core and a rim
    var BETA = [[-40, -40], [28, -40], [-52, 18], [16, 30], [50, 22], [-30, 58], [8, 62], [62, -62], [-76, -20]];
    var ALPHA = [[-6, -46], [-18, 26], [82, -16], [72, 56], [-70, 60], [40, 78], [-60, -66]];
    function cells(){
      var m = '';
      BETA.forEach(function(c, i){ m += '<g class="fe-beta" data-b="' + i + '"><circle cx="' + c[0] + '" cy="' + c[1] + '" r="17"/><circle class="fe-cnuc" cx="' + (c[0] - 4) + '" cy="' + (c[1] - 3) + '" r="5.5"/></g>'; });
      ALPHA.forEach(function(c, i){ m += '<g class="fe-alpha" data-a="' + i + '"><circle cx="' + c[0] + '" cy="' + c[1] + '" r="15"/><circle class="fe-cnuc" cx="' + (c[0] + 3) + '" cy="' + (c[1] - 2) + '" r="5"/></g>'; });
      return m;
    }
    function hexP(x, y, r){ var s = ''; for(var i = 0; i < 6; i++){ var a = Math.PI / 6 + i * Math.PI / 3; s += (i ? 'L' : 'M') + f1(x + Math.cos(a) * r) + ',' + f1(y + Math.sin(a) * r); } return s + 'Z'; }
    function nGlu(x){ return x / SET * 8; }
    SCENES.push({
      id: 'glucose', tab: 'Blood glucose', short: 'Glucose', kind: 'neg', loops: { up: 'glucose-high-insulin', down: 'glucose-low-glucagon' },
      topics: ['pancreas-glucose'],
      purpose: 'Push blood glucose off normal and watch the loop answer',
      cue: 'Drag the glucose level', thing: 'glucose meter', layouts: LAY,
      set: SET, min: MIN, max: MAX, step: 2, dead: 4, band: [70, 99],
      fmt: function(v){ return Math.round(v) + ' mg/dL'; },
      TM: { sens: 0.35, aff: 0.8, affEnd: 0.8, ctl: 1.15, eff: 1.75, effEnd: 3.0, act: 3.0, resp: 3.4, tail: 4.4 },
      mon: { title: 'Blood glucose', short: 'Glucose', lo: 55, hi: 160, ticks: [70, 100, 140], unit: 'mg/dL', setLabel: 'Set point', role: 'glu' },
      knobAt: function(L, v){ return T(L, [0, meterY(v), 'therm']); },
      pick: function(L, x, y){ var g0 = L.g.therm; return MAX - (y - g0[1]) / (300 * g0[2]) * (MAX - MIN); },
      valRole: function(){ return 'glu'; },
      geo: geo,
      art: function(E){
        var L = E.L, s = '<defs><linearGradient id="fe-skin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E0AD8E"/><stop offset="0.5" stop-color="#F4D4BE"/><stop offset="1" stop-color="#DDA888"/></linearGradient>' +
          '<linearGradient id="fe-shirt2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7A4E86"/><stop offset="0.4" stop-color="#9B6CA8"/><stop offset="1" stop-color="#7A4E86"/></linearGradient>' +
          '<linearGradient id="fe-pants" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4A556B"/><stop offset="0.5" stop-color="#5E6A82"/><stop offset="1" stop-color="#4A556B"/></linearGradient>' +
          '<radialGradient id="fe-liverg" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#B5574A"/><stop offset="1" stop-color="#7E2F26"/></radialGradient></defs>';
        s += '<rect class="fe-bg" x="-400" y="0" width="' + (L.w + 800) + '" height="' + L.h + '"/>';
        var pa = T(L, [ISLET[0], ISLET[1], 'person']), mg = L.g.mag, r = 150 * mg[2], ang = Math.atan2(mg[1] - pa[1], mg[0] - pa[0]);
        var z1 = [mg[0] + Math.cos(ang + Math.PI / 2 + 0.25) * r, mg[1] + Math.sin(ang + Math.PI / 2 + 0.25) * r], z2 = [mg[0] + Math.cos(ang - Math.PI / 2 - 0.25) * r, mg[1] + Math.sin(ang - Math.PI / 2 - 0.25) * r];
        s += G(L, 'person', person());
        s += '<path class="fe-zoom" d="M' + f1(pa[0]) + ',' + f1(pa[1]) + 'L' + f1(z1[0]) + ',' + f1(z1[1]) + 'M' + f1(pa[0]) + ',' + f1(pa[1]) + 'L' + f1(z2[0]) + ',' + f1(z2[1]) + '"/>';
        s += G(L, 'mag', mag() + '<g data-r="cells">' + cells() + '</g><g data-r="gin"></g><g data-r="gran"></g></g><circle class="fe-magring" r="150"/>');
        s += G(L, 'therm', '<g data-r="meter"></g>');
        s += '<g data-r="glu"></g><g data-r="mol"></g><g data-r="upt"></g>';
        return s;
      },
      fxInit: function(fx, R, E){
        var L = E.L, gm = L.g.therm, fs = E.fsm / gm[2], h = '';
        // the meter: a scale with the normal fasting range shaded and the set point marked
        h += '<rect class="fe-mband" x="-16" y="' + f1(meterY(99)) + '" width="32" height="' + f1(meterY(70) - meterY(99)) + '" rx="4"/>';
        h += '<rect class="fe-mtube" x="-10" y="-8" width="20" height="316" rx="10"/><rect class="fe-mcol" data-r="mcol" x="-5" y="0" width="10" height="300" rx="5"/>';
        [60, 70, 80, 88, 100, 120, 140, 160].forEach(function(v){ var y = meterY(v), lab = v === 70 || v === 100 || v === 140; h += '<path class="fe-ttick' + (v === SET ? ' is-set' : '') + '" d="M-10,' + f1(y) + 'h' + (lab ? -21 : -9) + '"/>'; if(lab) h += '<text class="fe-ttxt" x="-37" y="' + f1(y) + '" dy="0.35em" style="font-size:' + f1(fs) + 'px">' + v + '</text>'; });
        R.meter.innerHTML = h; R.mcol = R.meter.querySelector('[data-r="mcol"]');
        var g2 = '';
        SLOTS_G.forEach(function(p){ var q = T(L, [p[0], p[1], 'person']), rr = 5.2 * L.g.person[2]; g2 += '<path class="fe-gmol" d="' + hexP(q[0], q[1], rr) + '"/>'; });
        R.glu.innerHTML = g2;
        // glucose in the islet's capillary and going into the beta cells
        var gi = '';
        for(var i = 0; i < 6; i++) gi += '<path class="fe-gmol" d="' + hexP(0, 0, 6) + '" transform="translate(-300,0)"/>';
        R.gin.innerHTML = gi;
        var gr = '';
        for(i = 0; i < 8; i++) gr += '<circle class="fe-gran" r="3.2" cx="-300" cy="0"/>';
        R.gran.innerHTML = gr;
        // hormone molecules in the blood and glucose moving into or out of the organs (pools)
        var mo = '';
        for(i = 0; i < 30; i++) mo += '<circle class="fe-hmol" r="' + f1(Math.max(6.5 * L.g.person[2], 4.2 / (E.k || 1))) + '" cx="-300" cy="0"/>';
        R.mol.innerHTML = mo;
        var up = '';
        for(i = 0; i < 12; i++) up += '<path class="fe-gmol is-up" d="' + hexP(0, 0, 5.2 * L.g.person[2]) + '" transform="translate(-300,0)"/>';
        R.upt.innerHTML = up;
        R._geo = geo(L);
        R._gly = [].slice.call(E.art.querySelectorAll('[data-gly]')); R._glym = [].slice.call(E.art.querySelectorAll('[data-glym]')); R._fat = [].slice.call(E.art.querySelectorAll('[data-fat]'));
      },
      paint: function(R, st, E){
        var L = E.L, hi = st.dir === 'up', k = st.k, M = this.TM, gg = R._geo, t = st.t;
        var y = meterY(st.x); sa(R.mcol, 'y', f1(y)); sa(R.mcol, 'height', f1(300 - y));
        // glucose in the blood: as many as the drawn level
        var n = nGlu(st.x);
        [].forEach.call(R.glu.childNodes, function(c, i){ so(c, clamp(n - i, 0, 1)); });
        // the islet: the sensing cells light; glucose enters the beta cells when high
        var on = st.sens > 0.05;
        if(!R._beta){ R._beta = [].slice.call(R.cells.querySelectorAll('.fe-beta')); R._alpha = [].slice.call(R.cells.querySelectorAll('.fe-alpha')); }
        var bOn = hi && on, aOn = !hi && on;
        if(R._bOn !== bOn){ R._bOn = bOn; R._beta.forEach(function(c){ c.classList.toggle('is-on', bOn); }); }
        if(R._aOn !== aOn){ R._aOn = aOn; R._alpha.forEach(function(c){ c.classList.toggle('is-on', aOn); }); }
        var cap = function(f){ var x = lerp(-150, 150, f); return [x, x < 20 ? lerp(40, -6, (x + 160) / 180) : lerp(-6, -16, (x - 20) / 140)]; };
        [].forEach.call(R.gin.childNodes, function(c, i){
          var f = ((i / 6) + 0.05) % 1, p = cap(f), dest = BETA[(i * 2) % BETA.length], into = hi && k >= 1 && !st.done ? ramp(t, M.sens + i * 0.05, M.sens + 0.45 + i * 0.05) * clamp(st.a * 1.2, 0, 1) : 0;
          var vis = clamp(n / 2 - i * 0.6, 0, 1);
          sa(c, 'transform', 'translate(' + f1(lerp(p[0], dest[0], into)) + ',' + f1(lerp(p[1], dest[1], into)) + ')'); so(c, vis * (into > 0.95 ? 0.5 : 1));
        });
        // the control center: hormone granules move to the membrane by the capillary and leave (exocytosis)
        var src = hi ? BETA : ALPHA;
        [].forEach.call(R.gran.childNodes, function(c, i){
          var cell = src[i % src.length], ph = st.ctl > 0.05 ? ((t - M.ctl) * 1.2 + i / 8) % 1 : 0, p = cap(0.5 + (cell[0] / 300));
          sa(c, 'cx', f1(lerp(cell[0], p[0], ss(ph)))); sa(c, 'cy', f1(lerp(cell[1], p[1], ss(ph))));
          sa(c, 'class', 'fe-gran ' + (hi ? 'is-ins' : 'is-gcg')); so(c, st.ctl > 0.05 ? (1 - ramp(ph, 0.85, 1)) * clamp(st.ctl * 1.3, 0, 1) : 0);
        });
        // the efferent: insulin (to liver, muscle and fat) or glucagon (to the liver) carried in the blood
        var mols = R.mol.childNodes, mi = 0;
        st.effp.forEach(function(pu){
          var pth = hi ? [gg.liver, gg.mus, gg.fat] : [gg.liver];
          pth.forEach(function(pl, j){
            if(mi >= mols.length) return;
            var p = pu.p < 0.3 ? gg.out.at(pu.p / 0.3) : pl.at((pu.p - 0.3) / 0.7), c = mols[mi++];
            sa(c, 'cx', f1(p[0])); sa(c, 'cy', f1(p[1])); sa(c, 'class', 'fe-hmol ' + (hi ? 'is-ins' : 'is-gcg')); so(c, pu.a * (1 - ramp(pu.p, 0.92, 1)));
          });
        });
        for(; mi < mols.length; mi++) so(mols[mi], 0);
        // the effectors: glucose moves from the blood into liver, muscle and fat (insulin), or out of the liver (glucagon)
        var ups = R.upt.childNodes, ui = 0, eff = st.eff;
        if(eff > 0.04 && !st.done){
          var to = hi ? [[-30, 162], [100, 200], [-24, 334]] : [[-30, 162]], from = hi ? [[-22, 172], [96, 200], [-30, 330]] : [[-22, 172]];
          for(var q = 0; q < 4; q++){
            to.forEach(function(dst, j){
              if(ui >= ups.length) return;
              var ph = ((t - M.act) * 1.1 + q / 4) % 1, a = from[j], b = dst;
              if(!hi){ var tmp = a; a = [b[0], b[1]]; b = [tmp[0] + 10, tmp[1] + 2]; }
              var p = T(L, [lerp(a[0], b[0], ph), lerp(a[1], b[1], ph) - Math.sin(ph * Math.PI) * 10, 'person']), c = ups[ui++];
              sa(c, 'transform', 'translate(' + f1(p[0]) + ',' + f1(p[1]) + ')'); so(c, eff * Math.sin(ph * Math.PI));
            });
          }
        }
        for(; ui < ups.length; ui++) so(ups[ui], 0);
        // stores: glycogen in the liver and muscle grows with insulin, shrinks with glucagon; fat cells swell a little
        var moved = Math.abs(st.run ? st.run.d - st.dev : 0), base = 4;
        var gl = hi ? base + moved / 72 * 4 : base - moved / 33 * 3;
        R._gly.forEach(function(c, i){ so(c, clamp(gl - i, 0, 1)); });
        var gm = hi ? 1 + moved / 72 * 2 : 1;
        R._glym.forEach(function(c, i){ so(c, clamp(gm - i, 0, 1)); });
        var fat = hi ? 1 + moved / 72 * 0.18 : 1;
        R._fat.forEach(function(c){ sa(c, 'rx', f1(11 * fat)); sa(c, 'ry', f1(10 * fat)); });
        R.liver.classList.toggle('is-on', eff > 0.08 && k >= 5);
      },
      labels: function(st, E){
        var L = E.L, k = st.k, hi = st.dir === 'up', out = [];
        var M = function(p){ return T(L, [p[0], p[1], 'mag']); }, B = function(p){ return T(L, [p[0], p[1], 'person']); };
        if(k < 1) out.push({ key: 'islet', text: 'Pancreatic islet', role: 'tok', at: M([0, -90]), side: ['u', 'd'] });
        if(k < 5 || st.done) out.push({ key: 'panc', text: 'Pancreas', role: 'tok', at: B([50, 214]), side: ['r', 'd'] });
        if(k >= 1 && k <= 3) out.push({ key: 'cells', text: hi ? 'Beta cells' : 'Alpha cells', role: hi ? 'ins' : 'gcg', at: hi ? M([-40, -40]) : M([-6, -46]), side: ['u', 'l', 'r'], strong: k === 1 || k === 3 });
        if(k === 2) out.push({ key: 'same', text: 'No nerve: same cells', role: hi ? 'ins' : 'gcg', at: hi ? M([16, 30]) : M([-18, 26]), side: ['d', 'r'], strong: true });
        if(k === 3 || k === 4) out.push({ key: 'horm', text: hi ? 'Insulin' : 'Glucagon', role: hi ? 'ins' : 'gcg', at: k === 3 ? M([80, -6]) : (st.effp.length ? (hi ? R0(E).mus : R0(E).liver).at(clamp((st.effp[0].p - 0.3) / 0.7, 0, 1)) : B([4, 214])), side: ['u', 'r', 'l'], strong: k === 4, lead: k === 4 });
        if(k >= 5 && !st.done && st.eff > 0.15){
          out.push({ key: 'liver', text: 'Liver', role: 'eff', at: B([-44, 148]), side: ['u', 'l'], strong: k === 5, lead: true });
          if(hi){ out.push({ key: 'mus', text: 'Muscle', role: 'eff', at: B([104, 166]), side: ['r', 'u'] }); out.push({ key: 'fat', text: 'Fat', role: 'eff', at: B([-50, 340]), side: ['l', 'd'] }); }
        }
        if(k === 6 && !st.done && st.eff > 0.15) out.push({ key: 'resp', text: hi ? 'Glucose stored' : 'Glucose released', role: 'glu', at: B([-52, 168]), side: ['l', 'd'], strong: true, lead: true });
        return out;
      },
      words: function(st){
        var hi = st.dir === 'up', v = this.fmt(st.x), k = st.k;
        if(st.done) return { pre: 'Response:', parts: [{ t: v, role: 'glu' }, { t: 'back near the set point', role: 'glu' }, { t: hi ? 'insulin falls' : 'glucagon falls', role: hi ? 'ins' : 'gcg' }] };
        switch(k){
          case 0: return { pre: 'Stimulus:', parts: [{ t: (hi ? 'Glucose rises to ' : 'Glucose falls to ') + v, role: 'glu' }] };
          case 1: return { pre: 'Sensor:', parts: [{ t: hi ? 'Beta cells sense the rise' : 'Alpha cells sense the fall', role: hi ? 'ins' : 'gcg' }] };
          case 2: return { pre: 'Afferent:', parts: [{ t: 'None', role: hi ? 'ins' : 'gcg' }, { t: 'the same cells sense and decide', role: hi ? 'ins' : 'gcg' }] };
          case 3: return { pre: 'Control center:', parts: [{ t: hi ? 'Beta cells release insulin' : 'Alpha cells release glucagon', role: hi ? 'ins' : 'gcg' }] };
          case 4: return { pre: 'Efferent:', parts: [{ t: hi ? 'Insulin in the blood' : 'Glucagon in the blood', role: hi ? 'ins' : 'gcg' }] };
          case 5: return { pre: 'Effector:', parts: hi ? [{ t: 'Liver, muscle, fat', role: 'eff' }, { t: 'take glucose in', role: 'glu' }] : [{ t: 'Liver', role: 'eff' }, { t: 'breaks down glycogen', role: 'glu' }] };
          default:
            if(st.eff < 0.15) return { pre: 'Response:', parts: [{ t: v, role: 'glu' }, { t: 'near the set point', role: 'glu' }, { t: hi ? 'less insulin released' : 'less glucagon released', role: hi ? 'ins' : 'gcg' }] };
            return { pre: 'Response:', parts: hi ? [{ t: 'Glucose stored', role: 'glu' }, { t: v, role: 'glu' }] : [{ t: 'Glucose released', role: 'glu' }, { t: v, role: 'glu' }] };
        }
      },
      take: function(st){ return st.dir === 'up' ? 'Negative feedback: insulin moved glucose into storage, and less insulin is released as it falls.' : 'Negative feedback: glucagon made the liver release glucose, and less glucagon is released as it rises.'; },
      idleWords: function(x){ var at = Math.abs(x - SET) < 1; return { pre: 'Now:', parts: [{ t: this.fmt(x), role: 'glu' }, { t: at ? 'at the set point' : 'near the set point', role: 'glu' }, { t: at ? 'nothing to correct' : 'too small to correct' }] }; },
      note: 'The pancreas is drawn in front of the stomach so it can be seen; it lies behind it. Each gold hexagon in the blood stands for a share of the glucose, not one molecule. The islet cells are their own sensors and control center, so this loop has no nerve between them. Insulin acts on the liver, skeletal muscle and fat (muscle and fat move glucose carriers to their membranes; the liver stores glucose as glycogen); glucagon acts on the liver, which breaks glycogen down and makes new glucose. Muscle keeps its glycogen for itself. In a human islet the beta and alpha cells are mixed, as drawn. The fasting normal range is about 70 to 99 mg/dL; the set point is drawn at 88, the level in the bank’s loop.'
    });
    // the scene's routes, for labels that follow a molecule (computed per layout, cached on the engine's E)
    function R0(E){ if(!E._g || E._g.L !== E.L){ E._g = geo(E.L); E._g.L = E.L; } return E._g; }
  })();

  /* ================================================================== 3. Childbirth (positive feedback) */
  (function(){
    /* wide: the whole woman, the brain magnified beside her head. tall (phones, upright tablets): cropped to her trunk and
       pelvis so the uterus is the largest thing; the cord leaves the top of the picture toward the magnified brain. */
    var LAY = {
      wide: { w: 1080, h: 540, g: { body: [590, 64, 1], mag: [220, 200, 1.02] }, mon: [772, 108, 290, 300], spread: { mon: 1, mag: -1 } },
      tall: { w: 600, h: 620, g: { body: [250, -226, 1.75], mag: [86, 94, 0.5] }, mon: [14, 482, 572, 128], crop: true }
    };
    // the woman in profile, facing right (body coordinates: the head's centre at 0,0); the cord runs inside her back
    var CORD = [[-2, 40], [-14, 100], [-20, 160], [-22, 210], [-24, 252]];
    var AFF_B = [[46, 362], [20, 340], [-4, 300], [-24, 262]].concat(CORD.slice().reverse()).concat([[-4, 22], [4, 10]]);
    var VES = [[10, 18], [12, 60], [10, 110], [-2, 160], [-6, 210], [6, 250], [26, 262]];
    var HEAD0 = [52, 314];         // the fetal head with no stretch
    var PLAC = [100, 206];         // the placenta on the uterine wall
    var UT = 'M18,214 C30,170 104,166 120,226 C132,272 116,320 82,346 C70,356 60,362 56,364 L44,364 C36,358 24,346 16,326 C2,292 6,246 18,214 Z';
    var WIN = 'M8,206 C24,158 114,154 130,224 C142,278 122,332 88,358 C74,368 62,372 50,372 C36,372 22,362 12,338 C-2,302 -4,250 8,206 Z';
    function headAt(s, born){ return [HEAD0[0] - 4 * s, HEAD0[1] + 48 * s + born * 190]; }
    // the knob sits just behind the head, on the baby's shoulders, so the head it pushes stays in sight
    var KNOB = [10, -52];
    // the magnifier (r 150): the hypothalamus, the stalk and the posterior pituitary
    var M_AFF = [[-150, 120], [-80, 60], [-30, -10]];
    var M_EFF = [[-30, -10], [-22, 30], [-14, 66], [-12, 92]];
    var M_OUT = [[-12, 92], [40, 110], [110, 120], [150, 140]];
    function geo(L){
      var b = function(pts){ return TS(L, pts.map(function(p){ return [p[0], p[1], 'body']; })); }, m = function(pts){ return TS(L, pts.map(function(p){ return [p[0], p[1], 'mag']; })); };
      return { aff: Route([Poly(b(AFF_B.slice(0, -2))), Poly(m(M_AFF))]), eff: Route([Poly(m(M_EFF).concat(m(M_OUT))), Poly(b(VES))]) };
    }
    function limb(x1, y1, x2, y2, w){ return '<path class="fe-flo" style="stroke-width:' + (w + 3) + 'px" d="M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2 + '"/><path class="fe-fli" style="stroke-width:' + w + 'px" d="M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2 + '"/>'; }
    function baby(){
      // the newborn, wrapped, lying along her forearm with its head in her hand
      var b = '<path class="fe-blanket" d="M18,158 C14,142 34,132 62,134 C82,136 92,146 90,160 C86,172 60,176 38,172 C26,170 20,166 18,158 Z"/>';
      b += '<path class="fe-blankf" d="M34,140 C46,150 54,160 58,172 M62,136 C66,148 70,160 70,172"/>';
      b += '<circle class="fe-fhead" cx="94" cy="146" r="15"/><path class="fe-fface" d="M98,142 q3,-2 6,0 M100,152 q3,1.5 5,-1"/><path class="fe-fhair" d="M84,136 q6,-6 14,-4"/>';
      return b;
    }
    function body(){
      var p = '';
      // legs (cut at the thighs) in leggings
      p += '<path class="fe-pants" d="M-58,330 C-62,380 -58,430 -54,470 L28,470 C32,430 40,400 44,374 C10,372 -28,356 -58,330 Z"/>';
      p += '<path class="fe-fold" d="M-12,400 C-6,430 -6,452 -8,470"/>';
      // the dress: shoulders, the back with its curve, the breast and the pregnant belly
      p += '<path class="fe-top" d="M-26,76 C-40,84 -44,110 -42,150 C-40,196 -34,226 -40,262 C-46,292 -60,316 -62,336 C-30,356 10,372 46,380 C100,376 142,338 154,288 C162,236 140,192 100,172 C80,166 66,166 58,160 C64,144 62,124 50,110 C40,98 26,86 16,76 Z"/>';
      p += '<path class="fe-fold" d="M-36,200 C-30,220 -32,240 -38,256 M132,204 C146,224 152,250 152,272 M46,118 C54,128 56,142 52,154"/>';
      // the spinal cord inside her back (vertebrae), seen through
      p += '<path class="fe-cordb" d="' + P(CORD) + '"/>';
      CORD.forEach(function(c, i){ if(i) p += '<rect class="fe-vert" x="' + (c[0] - 7) + '" y="' + (c[1] - 6) + '" width="14" height="12" rx="3"/>'; });
      // the window into the belly: the uterus, its muscle wall (myometrium), the placenta, the cervix below
      p += '<path class="fe-win" d="' + WIN + '"/>';
      p += '<g data-r="ut"><path class="fe-myo" d="' + UT + '"/>';
      p += '<path class="fe-amn" d="M30,222 C40,190 96,186 106,232 C116,272 102,310 76,332 C66,340 58,346 54,348 L46,348 C38,344 30,334 26,320 C14,290 18,250 30,222 Z"/>';
      p += '<path class="fe-myof" d="M24,224 c6,-14 20,-26 36,-30 M84,186 c16,6 26,18 30,34 M118,264 c0,16 -6,32 -14,44 M10,280 c0,16 4,30 10,42"/>';
      p += '<ellipse class="fe-plac" cx="' + PLAC[0] + '" cy="' + PLAC[1] + '" rx="16" ry="8" transform="rotate(48 ' + PLAC[0] + ' ' + PLAC[1] + ')"/></g>';
      p += '<path class="fe-canal" d="M42,366 C40,384 36,398 30,412 M60,366 C60,386 56,400 50,414"/>';
      p += '<g data-r="cerv"><path class="fe-cerv" data-r="cervl" d="M44,354 C38,356 36,364 40,368 L50,366 Z"/><path class="fe-cerv" data-r="cervr" d="M58,354 C64,356 66,364 62,368 L52,366 Z"/></g>';
      p += '<g data-r="sens"><circle class="fe-sdot" cx="40" cy="362" r="3.6"/><circle class="fe-sdot" cx="62" cy="362" r="3.6"/><circle class="fe-sdot" cx="44" cy="369" r="3"/><circle class="fe-sdot" cx="58" cy="369" r="3"/></g>';
      // the afferent nerve from the cervix to the cord; one vessel from the pituitary down to the uterus
      p += '<path class="fe-nv is-aff" data-r="affb" d="' + P(AFF_B.slice(0, -2)) + '"/>';
      p += '<path class="fe-bv" d="' + P(VES) + '"/>';
      // the near arm, bent, resting on top of the belly; after the birth the baby lies along it, its head in her hand
      p += '<path class="fe-skinp" d="M-14,90 C-24,120 -24,160 -16,190 C-10,206 10,206 30,196 C46,188 62,180 74,176 C84,172 84,162 74,160 C56,162 36,170 18,174 C10,160 10,124 12,98 Z"/>';
      p += '<g data-r="baby" style="opacity:0">' + baby() + '</g>';
      p += '<path class="fe-hand" d="M70,158 C82,152 98,154 104,162 C108,170 98,176 86,176 C78,176 72,172 70,166 Z"/>';
      p += '<path class="fe-sleeve" d="M-26,78 C-34,96 -32,118 -24,132 L12,132 C16,112 16,92 10,78 Z"/>';
      // neck and head in profile, facing right; the brain seen through it, the hypothalamus at its base
      p += '<path class="fe-skinp" d="M-10,34 L-14,84 C-2,92 14,90 22,82 L18,38 Z"/>';
      p += '<path class="fe-skinp" d="M-36,-6 C-38,-40 -12,-54 12,-50 C32,-46 42,-30 42,-14 C42,-8 48,0 52,8 C54,12 48,14 46,14 C48,20 46,24 42,26 C44,30 42,36 36,40 C26,48 8,50 -8,44 C-26,36 -36,18 -36,-6 Z"/>';
      p += '<path class="fe-hair3" d="M-40,-2 C-48,-44 -14,-62 14,-56 C34,-52 46,-38 42,-22 C28,-34 10,-38 -6,-34 C-14,-16 -18,6 -20,30 C-32,26 -40,14 -40,-2 Z"/><circle class="fe-hair3" cx="-38" cy="-30" r="14"/>';
      p += '<path class="fe-brainc" d="M-24,-10 C-26,-30 -6,-40 10,-38 C26,-36 34,-24 32,-10 C30,0 20,4 10,4 C4,10 -2,10 -6,4 C-16,4 -22,0 -24,-10 Z"/><path class="fe-gyrc" d="M-14,-24 c6,-5 10,3 15,-1 M6,-28 c6,-4 10,4 15,0 M-16,-12 c6,-4 10,4 16,0 M10,-14 c5,-3 9,3 13,0"/>';
      p += '<ellipse class="fe-hypo" data-r="hypob" cx="4" cy="6" rx="6" ry="4"/>';
      p += '<ellipse class="fe-ear" cx="-6" cy="6" rx="6" ry="10"/><ellipse class="fe-eye" cx="30" cy="-4" rx="3" ry="3.6"/><path class="fe-brow" d="M24,-13 q6,-3 12,0"/><path class="fe-mouth" d="M34,30 C38,31 41,30 43,28"/>';
      return p;
    }
    function fetus(){
      // head down (the head at 0,0), the face toward the mother's back, chin tucked; the curled back toward her belly;
      // the knees drawn up by the chest, the feet by the buttocks at the top of the uterus, an arm folded by the face
      var f = '<path class="fe-fbody" d="M12,-20 C30,-30 44,-56 44,-86 C44,-112 32,-132 10,-138 C-10,-142 -26,-128 -28,-108 C-30,-88 -26,-62 -18,-42 C-12,-30 -2,-22 4,-20 Z"/>';
      f += '<path class="fe-fline" d="M24,-32 C38,-50 42,-80 36,-108 C32,-120 24,-128 14,-132"/>';
      f += '<ellipse class="fe-fhi" cx="26" cy="-80" rx="6" ry="20" transform="rotate(-8 26 -80)"/>';
      f += limb(18, -120, -28, -94, 20) + limb(-30, -92, -14, -132, 15) + '<ellipse class="fe-ffoot" cx="-8" cy="-138" rx="9" ry="6" transform="rotate(-30 -8 -138)"/>';
      f += limb(6, -44, -20, -62, 12) + limb(-20, -62, -24, -26, 11) + '<circle class="fe-ffoot" cx="-24" cy="-22" r="6"/>';
      f += '<ellipse class="fe-fhead" cx="0" cy="0" rx="27" ry="28"/><ellipse class="fe-fhi" cx="10" cy="-8" rx="9" ry="12"/>';
      f += '<path class="fe-fear" d="M10,-8 c6,1 8,8 3,12"/><path class="fe-fface" d="M-20,-8 q5,3 10,0 M-27,-2 q-4,4 0,8 M-22,10 q3,2 6,0"/>';
      f += '<path class="fe-fhair" d="M-12,25 q6,4 12,0 M2,27 q6,3 10,-2 M14,22 q5,2 8,-3"/>';
      return f;
    }
    function mag(){
      var m = '<defs><clipPath id="fe-bmag"><circle cx="0" cy="0" r="150"/></clipPath></defs><circle class="fe-magbg" r="150"/><g clip-path="url(#fe-bmag)">';
      m += '<path class="fe-brain" d="M-160,-160 H160 V-30 C110,-20 60,-16 20,-24 C0,-28 -10,-30 -20,-36 C-60,-30 -110,-24 -160,-30 Z"/>';
      m += '<path class="fe-gyri" d="M-120,-110 c20,-14 30,10 50,-2 M-60,-70 c22,-10 34,12 56,0 M50,-110 c16,12 36,4 48,18 M60,-60 c18,-8 28,8 46,0"/>';
      m += '<path class="fe-stem" d="M-160,60 C-120,40 -80,20 -60,-24 L-36,-30 C-50,20 -90,70 -130,160 L-160,160 Z"/>';
      m += '<path class="fe-hypoM" data-r="hypo" d="M-60,-40 C-40,-58 20,-56 34,-38 C42,-24 26,-6 4,-2 C-20,2 -54,-10 -60,-40 Z"/>';
      [[-30, -32], [0, -40], [20, -28]].forEach(function(n){ m += '<path class="fe-oxn" d="M' + n[0] + ',' + n[1] + ' C' + n[0] + ',' + (n[1] + 30) + ' -18,40 -14,80"/><circle class="fe-oxs" cx="' + n[0] + '" cy="' + n[1] + '" r="7"/>'; });
      m += '<path class="fe-stalk" d="M-24,-4 C-26,24 -24,50 -22,70 L-2,70 C-2,50 0,24 6,-4 Z"/>';
      m += '<ellipse class="fe-pitp" data-r="pitp" cx="-12" cy="92" rx="30" ry="24"/><ellipse class="fe-pita" cx="42" cy="88" rx="36" ry="28"/>';
      m += '<path class="fe-sella" d="M-56,104 C-50,140 -10,150 30,150 C70,150 96,140 100,104"/>';
      m += '<path class="fe-nv is-aff" data-r="affmag" d="' + P(M_AFF) + '"/>';
      m += '<path class="fe-bv" d="' + P(M_OUT) + '"/>';
      m += '</g><circle class="fe-magring" r="150"/>';
      return m;
    }
    SCENES.push({
      id: 'childbirth', tab: 'Childbirth', short: 'Childbirth', kind: 'pos', loops: { up: 'dv-labor-oxytocin' },
      topics: ['labor-birth'],
      purpose: 'Positive feedback: each turn makes the change bigger',
      cue: 'Push the baby down', thing: 'baby', layouts: LAY,
      set: 0, min: 0, max: 1, step: 0.01, dead: 0.04, push: 0.35,
      fmt: function(v){ return v < 0.04 ? 'none' : v < 0.35 ? 'low' : v < 0.7 ? 'medium' : 'high'; },
      mon: { title: 'Stretch of the cervix', short: 'Stretch', lo: 0, hi: 1, pos: true, role: 'str' },
      knobAt: function(L, v, born){ var h = headAt(v, born || 0); return T(L, [h[0] + KNOB[0], h[1] + KNOB[1], 'body']); },
      pick: function(L, x, y){ var g0 = L.g.body; return ((y - g0[1]) / g0[2] - HEAD0[1] - KNOB[1]) / 120; },
      valRole: function(){ return 'str'; },
      geo: geo,
      art: function(E){
        var L = E.L, s = '<defs><linearGradient id="fe-skin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C98E6C"/><stop offset="0.5" stop-color="#DDA982"/><stop offset="1" stop-color="#C38766"/></linearGradient>' +
          '<linearGradient id="fe-top" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2E7F73"/><stop offset="0.5" stop-color="#4FA393"/><stop offset="1" stop-color="#2E7F73"/></linearGradient>' +
          '<linearGradient id="fe-pants" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4A556B"/><stop offset="0.5" stop-color="#5E6A82"/><stop offset="1" stop-color="#4A556B"/></linearGradient>' +
          '<radialGradient id="fe-myog" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stop-color="#E08A84"/><stop offset="1" stop-color="#B3504A"/></radialGradient>' +
          '<clipPath id="fe-win"><path transform="translate(' + f1(L.g.body[0]) + ',' + f1(L.g.body[1]) + ') scale(' + L.g.body[2] + ')" d="' + WIN + ' M26,360 L66,360 L54,414 L24,414 Z"/></clipPath></defs>';
        s += '<rect class="fe-bg" x="-400" y="0" width="' + (L.w + 800) + '" height="' + L.h + '"/>';
        s += G(L, 'body', body());
        s += '<g clip-path="url(#fe-win)"><g data-r="fetus">' + G(L, 'body', '<path class="fe-ucord" data-r="ucord"/><path class="fe-ucordl" data-r="ucordl"/><g data-r="fet">' + fetus() + '</g>') + '</g></g>';
        s += G(L, 'body', '<g data-r="sq"></g>');
        // zoom lines from the head to the magnifier
        var hd = L.crop ? [T(L, [-2, 0, 'body'])[0] + (T(L, [-14, 100, 'body'])[0] - T(L, [-2, 40, 'body'])[0]) * 0.2, 0] : T(L, [4, 8, 'body']), mg = L.g.mag, r = 150 * mg[2], ang = Math.atan2(mg[1] - hd[1], mg[0] - hd[0]);
        var z1 = [mg[0] + Math.cos(ang + Math.PI / 2 + 0.2) * r, mg[1] + Math.sin(ang + Math.PI / 2 + 0.2) * r], z2 = [mg[0] + Math.cos(ang - Math.PI / 2 - 0.2) * r, mg[1] + Math.sin(ang - Math.PI / 2 - 0.2) * r];
        s += '<path class="fe-zoom" d="M' + f1(hd[0]) + ',' + f1(hd[1]) + 'L' + f1(z1[0]) + ',' + f1(z1[1]) + 'M' + f1(hd[0]) + ',' + f1(hd[1]) + 'L' + f1(z2[0]) + ',' + f1(z2[1]) + '"/>';
        s += G(L, 'mag', mag());
        s += '<g data-r="mol"></g>';
        return s;
      },
      fxInit: function(fx, R, E){
        var L = E.L, h = '', i;
        for(i = 0; i < 10; i++) h += '<circle class="fe-hmol is-oxy" r="' + f1(5.5 * Math.max(L.g.body[2], 0.85)) + '" cx="-300" cy="0"/>';
        R.mol.innerHTML = h;
        var q = '';
        [[-4, 262, 0], [140, 252, 180], [66, 156, 90], [124, 322, 215]].forEach(function(a){ q += '<path class="fe-squeeze" transform="translate(' + a[0] + ',' + a[1] + ') rotate(' + a[2] + ')" d="M-12,0 H8 M2,-7 L10,0 L2,7"/>'; });
        R.sq.innerHTML = q;
        R._geo = geo(L);
      },
      paint: function(R, st, E){
        var gg = R._geo, born = st.born || 0, s = st.x, c = st.c || 0;
        // the fetus moves down as the stretch grows, and out at birth
        var h = headAt(s, ramp(born, 0, 1)), dh = [h[0] - HEAD0[0], h[1] - HEAD0[1]];
        sa(R.fet, 'transform', 'translate(' + f1(HEAD0[0] + dh[0]) + ',' + f1(HEAD0[1] + dh[1]) + ')');
        so(R.fetus, 1 - ramp(born, 0.55, 0.85));
        so(R.baby, ramp(born, 0.7, 1));
        // the umbilical cord from the baby's belly to the placenta on the wall
        var bx = h[0] - 18, by = h[1] - 66, cd = 'M' + f1(bx) + ',' + f1(by) + 'C' + f1(bx + 10) + ',' + f1(by - 40) + ' ' + f1(PLAC[0] - 40) + ',' + f1(PLAC[1] + 30) + ' ' + f1(PLAC[0] - 6) + ',' + f1(PLAC[1] + 4);
        sa(R.ucord, 'd', cd); sa(R.ucordl, 'd', cd);
        // the cervix opens with the stretch; its stretch sensors fire
        var w = 12 * s + (born > 0 ? 18 * (1 - ramp(born, 0.6, 1)) : 0);
        sa(R.cervl, 'transform', 'translate(' + f1(-w) + ',0)'); sa(R.cervr, 'transform', 'translate(' + f1(w) + ',0)');
        R.sens.classList.toggle('is-on', st.sens > 0.05); so(R.sens, 0.5 + 0.5 * clamp(st.sens * 1.5, 0, 1));
        // the uterus contracts: its wall squeezes in, harder each turn
        // after birth the empty uterus shrinks back
        var sh = 1 - 0.16 * ramp(born, 0.85, 1);
        sa(R.ut, 'transform', c > 0.01 || sh < 1 ? 'translate(54,360) scale(' + f1(sh * (1 - 0.05 * c)) + ',' + f1(sh * (1 - 0.035 * c)) + ') translate(-54,-360)' : '');
        R.ut.classList.toggle('is-on', c > 0.08);
        so(R.sq, clamp(c * 1.3, 0, 1) * (st.birthing ? 1 - ramp(born, 0.2, 0.6) : 1));
        [].forEach.call(R.sq.childNodes, function(n){ n.style.strokeWidth = f1(2 + 4 * c) + 'px'; });
        // the nerve, the hypothalamus and the posterior pituitary light as the signal reaches them
        var affOn = st.aff.length > 0;
        R.affb.classList.toggle('is-on', affOn); R.affmag.classList.toggle('is-on', affOn);
        R.hypo.classList.toggle('is-on', st.ctl > 0.05); R.hypob.classList.toggle('is-on', st.ctl > 0.05);
        R.pitp.classList.toggle('is-on', st.k === 4 && !st.birthing);
        // oxytocin carried in the blood from the posterior pituitary to the uterus
        var mols = R.mol.childNodes, mi = 0;
        st.effp.forEach(function(pu){
          for(var j = 0; j < 4 && mi < mols.length; j++){
            var f = pu.p - j * 0.05; if(f < 0 || f > 1) continue;
            var p = gg.eff.at(f), m = mols[mi++]; sa(m, 'cx', f1(p[0])); sa(m, 'cy', f1(p[1])); so(m, 1 - ramp(f, 0.94, 1));
          }
        });
        for(; mi < mols.length; mi++) so(mols[mi], 0);
      },
      labels: function(st, E){
        var L = E.L, k = st.k, out = [];
        var M = function(p){ return T(L, [p[0], p[1], 'mag']); }, B = function(p){ return T(L, [p[0], p[1], 'body']); };
        if(st.birthing){
          if(st.born >= 0.85){
            var bb = [T(L, [16, 128, 'body']), T(L, [110, 178, 'body'])];
            out.push({ key: 'baby', text: 'Baby born', role: 'str', at: B([60, 152]), side: ['r', 'u', 'l', 'd'], strong: true, lead: true, avoid: [[bb[0][0], bb[0][1], bb[1][0], bb[1][1]]] });
            out.push({ key: 'cerv', text: st.x < 0.5 ? 'No more stretch' : 'Stretch falling', role: 'str', at: B([51, 362]), side: ['r', 'l', 'd'] });
          } else out.push({ key: 'cerv', text: 'Head passes', role: 'str', at: B([51, 362]), side: ['r', 'l', 'd'], strong: true });
          return out;
        }
        if(k <= 0 || st.idle) out.push({ key: 'cerv', text: 'Cervix', role: 'str', at: B([51, 362]), side: ['r', 'l', 'd'], strong: k === 0 && !st.idle });
        if(k === 1) out.push({ key: 'sens', text: 'Stretch sensors', role: 'aff', at: B([62, 364]), side: ['r', 'd'], strong: true });
        if(st.idle || k === 0) out.push({ key: 'myo', text: 'Uterine muscle', role: 'mus', at: B([128, 250]), side: ['r', 'u', 'd'], avoid: [utBox(E)], lead: true });
        if(k === 2) out.push({ key: 'cord', text: 'Spinal cord', role: 'aff', at: B([-34, 160]), side: ['l', 'u'], strong: true });
        out.push({ key: 'hyp', text: 'Hypothalamus', role: k >= 3 ? 'ctl' : 'tok', at: M([-10, -30]), side: ['u', 'r', 'l'], strong: k === 3 });
        if(k === 4) out.push({ key: 'pit', text: 'Posterior pituitary', role: 'oxy', at: M([-12, 92]), side: ['d', 'l', 'r'], strong: true });
        if(k === 4 && st.effp.length){ var pu = st.effp[0]; if(pu.p > 0.35) out.push({ key: 'oxy', text: 'Oxytocin', role: 'oxy', at: R1(E).eff.at(pu.p), side: ['r', 'l', 'u'], lead: true }); }
        if(k >= 5) out.push({ key: 'myo', text: k === 5 ? 'Uterine muscle' : 'More stretch', role: k === 5 ? 'mus' : 'str', at: k === 5 ? B([128, 250]) : B([51, 362]), side: ['r', 'u', 'd'], strong: true, avoid: [utBox(E)], lead: true });
        return out;
      },
      words: function(st){
        var k = st.k, turn = st.turn || 0;
        if(st.birthing && st.born < 0.85) return { pre: 'Ending:', parts: [{ t: 'Full stretch', role: 'str' }, { t: 'the head passes through', role: 'str' }] };
        if(st.birthing) return { pre: 'Ending:', parts: [{ t: 'Baby born', role: 'str' }, { t: st.x < 0.5 ? 'no more stretch' : 'stretch falling', role: 'str' }, { t: 'the loop stops' }] };
        switch(k){
          case 0: return { pre: turn ? 'Turn ' + (turn + 1) + ':' : 'Stimulus:', parts: [{ t: turn ? 'More stretch on the cervix' : 'Head stretches the cervix', role: 'str' }] };
          case 1: return { pre: 'Sensor:', parts: [{ t: 'Stretch sensors fire', role: 'aff' }] };
          case 2: return { pre: 'Afferent:', parts: [{ t: 'Nerves up the spinal cord', role: 'aff' }, { t: 'to the brain', role: 'aff' }] };
          case 3: return { pre: 'Control center:', parts: [{ t: 'Hypothalamus', role: 'ctl' }, { t: turn ? 'sends more oxytocin pulses' : 'sends oxytocin pulses', role: 'oxy' }] };
          case 4: return { pre: 'Efferent:', parts: [{ t: 'Oxytocin in the blood', role: 'oxy' }] };
          case 5: return { pre: 'Effector:', parts: [{ t: turn ? 'Uterine muscle contracts harder still' : 'Uterine muscle contracts harder', role: 'mus' }] };
          default: return { pre: 'Response:', parts: [{ t: 'Head pushed lower', role: 'mus' }, { t: 'more stretch', role: 'str' }, { t: 'the loop goes round again', role: 'str' }] };
        }
      },
      take: function(){ return 'Positive feedback: each turn made the stretch bigger, until birth ended it.'; },
      idleWords: function(){ return { pre: 'Now:', parts: [{ t: 'Head above the cervix', role: 'str' }, { t: 'no stretch yet' }] }; },
      note: 'Late in labor. The uterus and the birth canal are drawn cut open; the hypothalamus and pituitary are magnified. One vessel stands for the circulation from the pituitary to the uterus. The hypothalamic neurons make oxytocin; their axons end in the posterior pituitary, which releases it into the blood in pulses. Prostaglandins from the uterine lining add to each contraction (not drawn). The loop strengthens contractions; it is not what starts labor. In real labor each turn takes minutes and labor takes hours; here it is quick.'
    });
    function R1(E){ if(!E._g || E._g.L !== E.L){ E._g = geo(E.L); E._g.L = E.L; } return E._g; }
    // the uterus's box in the picture: labels about the wall sit outside it
    function utBox(E){ var a = T(E.L, [0, 168, 'body']), b = T(E.L, [134, 366, 'body']); return [a[0], a[1], b[0], b[1]]; }
  })();

  /* ================================================================== the engine */
  function build(o){
    var K = window.LevlKit2, DATA = o.data;
    function loop(id){ for(var i = 0; i < DATA.loops.length; i++) if(DATA.loops[i].id === id) return DATA.loops[i]; return null; }
    var scenes = SCENES.filter(function(sc){ return !!loop(sc.loops.up); });
    if(!scenes.length || !K) return null;
    scenes.forEach(function(sc){ sc.x = sc.set; sc.run = null; sc.t = 0; });
    var cur = scenes[0], raf = 0, onScreen = true, wKey = '', E = { fs: 13, fsm: 11.6, k: 1 }, last = 0, dragging = false;

    var stage = document.createElement('div'); stage.className = 'fe';
    var tabs = K.tabs({ label: 'Which loop', items: scenes.map(function(sc){ return { value: sc.id, label: sc.tab, short: sc.short }; }), value: cur.id, big: true, onChange: function(v){ setTab(v, true); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: cur.purpose, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var main = document.createElement('div'); main.className = 'fe-main'; main.id = 'fe-main';
    main.innerHTML = '<div class="fe-pic"><svg class="fe-svg" viewBox="0 0 1080 540" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep">' +
      '<g class="fe-art"></g><g class="fe-pulse"></g><g class="fe-mon"></g><g class="fe-labs"></g></svg><div class="fe-over"></div></div>' +
      '<div class="fe-rail" aria-hidden="true"><span class="fe-dots">' + SLOTS.map(function(k, i){ return '<i class="fe-dot is-' + ROLE[i] + '"></i>'; }).join('') + '</span><span class="fe-rn"></span><span class="fe-rt"></span></div>';
    stage.appendChild(main);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', main.id); });
    var pic = main.querySelector('.fe-pic'), svg = main.querySelector('.fe-svg'), art = svg.querySelector('.fe-art'), pulseG = svg.querySelector('.fe-pulse'),
      monG = svg.querySelector('.fe-mon'), labs = svg.querySelector('.fe-labs'), over = main.querySelector('.fe-over'), rail = main.querySelector('.fe-rail');
    var dots = rail.querySelectorAll('.fe-dot'), railN = rail.querySelector('.fe-rn'), railT = rail.querySelector('.fe-rt');
    E.art = art;
    var layer = K.layer(pic);
    var lines = document.createElement('div'); lines.className = 'fe-lines';
    var cause = K.cause({ label: 'Why' });
    lines.appendChild(cause.el);
    stage.appendChild(lines);
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }
    var reset = document.createElement('button'); reset.type = 'button'; reset.className = 'fe-reset';
    reset.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/></svg><span>Start over</span>';
    over.appendChild(reset);

    var R = {}, handle = null, cue = null;
    function scale(){ var r = svg.getBoundingClientRect(); return r.width ? r.width / (E.W || 1080) : 1; }
    function pickLayout(){ return (stage.clientWidth || 0) >= 900 ? 'wide' : 'tall'; }
    function layout(){
      var id = pickLayout(), L = cur.layouts[id], ex = 0;
      if(id === 'wide'){ var avail = Math.max(300, (window.innerHeight || 800) - 330), asp = (stage.clientWidth || 0) / avail; if(asp > 2) ex = Math.min(360, Math.round(L.h * asp - L.w)); }
      if(!L.g0){ L.g0 = JSON.parse(JSON.stringify(L.g)); L.mon0 = L.mon.slice(); }
      L.g = JSON.parse(JSON.stringify(L.g0)); L.mon = L.mon0.slice();
      var sh = ex / 2 * 0.85;
      Object.keys(L.spread || {}).forEach(function(n){ if(n === 'mon') L.mon[0] += L.spread[n] * sh; else L.g[n][0] += L.spread[n] * sh; });
      L.id = id; E.L = L; E.W = L.w + ex; E.H = L.h; E.X0 = -ex / 2;
      svg.setAttribute('viewBox', f1(E.X0) + ' 0 ' + E.W + ' ' + L.h); pic.setAttribute('data-lay', id);
      pic.style.maxWidth = id === 'wide' ? 'calc((100vh - 330px) * ' + (E.W / E.H).toFixed(4) + ')' : 'max(320px, calc((100vh - 358px) * ' + (L.w / L.h).toFixed(4) + '))';
    }
    function metrics(){ var k = scale() || 1; E.k = k; E.fs = clamp((k < 0.8 ? 12.5 : 13.5) / k, 10, 27); E.fsm = clamp(11.8 / k, 8, 24); E.gap = 6 / k; }

    /* ---- the state of the drawn moment */
    function state(){
      var sc = cur, st;
      if(sc.run){
        st = sc.kind === 'pos' ? posState(sc, sc.run, sc.t) : negState(sc, sc.run, sc.t);
      } else {
        // no run: the value as the student holds it (the stimulus while it is off the set point), or the rest state
        var off = Math.abs(sc.x - sc.set) >= sc.dead;
        st = { kind: sc.kind, t: 0, x: sc.x, k: off ? 0 : -1, idle: !off, dir: sc.x >= sc.set ? 'up' : 'down', aff: [], effp: [], sens: 0, ctl: 0, eff: 0, a: 0, c: 0, turn: 0, dev: sc.x - sc.set, drag: dragging };
        if(sc.after){ st = posState(sc, sc.after, sc.after.end); st.after = true; }
        else if(sc.endRun && !dragging){ st = negState(sc, sc.endRun, sc.TM.resp + sc.TM.tail); }
      }
      return st;
    }
    function loopFor(st){ return loop(st.dir === 'down' && cur.loops.down ? cur.loops.down : cur.loops.up); }

    /* ---- the picture */
    function buildArt(){
      art.innerHTML = cur.art(E);
      R = {};
      art.querySelectorAll('[data-r]').forEach(function(n){ R[n.getAttribute('data-r')] = n; });
      labCache = {}; labs.innerHTML = ''; placeKey = '';
      if(cur.fxInit) cur.fxInit(null, R, E);
      E.geo = cur.geo(E.L);
      pulseG.innerHTML = '';
      pulsePool = [];
      monBuild();
    }
    var pulsePool = [];
    function pulses(st){
      // the afferent signal (orange) and the command (sky blue) as bright pulses travelling the drawn nerves
      var need = [], k = E.k || 1, r = 6.5 / k;
      if(cur.id !== 'glucose'){
        st.aff.forEach(function(p){ need.push({ at: E.geo.aff.at(p.p), cls: 'is-aff', a: p.a }); });
        if(cur.id === 'temperature') st.effp.forEach(function(p){ need.push({ at: E.geo.eff.at(p.p), cls: 'is-eff', a: p.a }); });
      }
      while(pulsePool.length < need.length){ var c = document.createElementNS(NS, 'circle'); pulseG.appendChild(c); pulsePool.push(c); }
      pulsePool.forEach(function(c, i){
        var n = need[i];
        if(!n || (cur.pulseHidden && cur.pulseHidden(E, n.at))){ so(c, 0); return; }
        sa(c, 'cx', f1(n.at[0])); sa(c, 'cy', f1(n.at[1])); sa(c, 'r', f1(r * (0.7 + 0.3 * n.a))); sa(c, 'class', 'fe-pulse-c ' + n.cls); so(c, 0.35 + 0.65 * n.a);
      });
    }

    /* ---- the monitor: the value against time, the set point and the normal range (negative), or the stretch climbing
       and the contractions (positive) */
    var MON = {};
    function monBox(){ var b = E.L.mon; return b; }
    function monBuild(){
      var b = monBox(), m = cur.mon, fs = E.fsm, x0 = b[0], y0 = b[1], w = b[2], h = b[3], head = fs * 1.9, pad = 8;
      var sx0 = x0 + pad, sy0 = y0 + head, sw = w - pad * 2, sh = h - head - pad;
      var px0 = sx0 + fs * (m.pos ? 0.8 : 2.4), px1 = sx0 + sw - fs * 0.8, py0 = sy0 + fs * 0.9, py1 = sy0 + sh - fs * 1.7;
      MON = { px0: px0, px1: px1, py0: py0, py1: py1, box: [x0, y0, x0 + w, y0 + h] };
      var s = '<rect class="fe-mbez" x="' + f1(x0) + '" y="' + f1(y0) + '" width="' + f1(w) + '" height="' + f1(h) + '" rx="' + f1(fs * 0.9) + '"/>';
      s += '<rect class="fe-mscr" x="' + f1(sx0) + '" y="' + f1(sy0) + '" width="' + f1(sw) + '" height="' + f1(sh) + '" rx="' + f1(fs * 0.4) + '"/>';
      s += '<text class="fe-mtitle' + (m.pos ? ' is-str' : '') + '" x="' + f1(x0 + pad + 2) + '" y="' + f1(y0 + head * 0.55) + '" dy="0.35em" style="font-size:' + f1(fs * 1.05) + 'px">' + esc(m.title) + '</text>';
      if(m.pos) s += '<text class="fe-mlab is-con" x="' + f1(x0 + w - pad - 2) + '" y="' + f1(y0 + head * 0.55) + '" dy="0.35em" style="font-size:' + f1(fs) + 'px">Contractions</text>';
      if(!m.pos){
        var yb0 = vy(cur.band[1]), yb1 = vy(cur.band[0]);
        s += '<rect class="fe-mnorm" x="' + f1(px0) + '" y="' + f1(yb0) + '" width="' + f1(px1 - px0) + '" height="' + f1(yb1 - yb0) + '"/>';
        s += '<path class="fe-mset" d="M' + f1(px0) + ',' + f1(vy(cur.set)) + 'H' + f1(px1) + '"/>';
        // tick numbers only where they have room (on a phone the middle one steps aside)
        var lastY = -1e9, tk = m.ticks.slice().sort(function(a, b){ return b - a; }), keep = [];
        tk.forEach(function(v, i){ var y = vy(v); if(y - lastY >= fs * 1.45 && (i === tk.length - 1 || vy(tk[tk.length - 1]) - y >= fs * 1.45 || keep.length === 0)){ keep.push(v); lastY = y; } });
        if(keep.indexOf(tk[tk.length - 1]) < 0 && vy(tk[tk.length - 1]) - lastY >= fs * 1.45) keep.push(tk[tk.length - 1]);
        keep.forEach(function(v){ s += '<text class="fe-mtick" x="' + f1(px0 - fs * 0.35) + '" y="' + f1(vy(v)) + '" dy="0.35em" style="font-size:' + f1(fs) + 'px">' + v + '</text>'; });
        s += '<text class="fe-mlab is-set" x="' + f1(px1 - 2) + '" y="' + f1(vy(cur.set) - fs * 0.45) + '" style="font-size:' + f1(fs) + 'px">' + esc(m.setLabel) + '</text>';
        // the normal range is named in the title row, beside a swatch of its colour
        var nx = x0 + w - pad - 2;
        s += '<text class="fe-mlab is-norm" x="' + f1(nx) + '" y="' + f1(y0 + head * 0.55) + '" dy="0.35em" style="font-size:' + f1(fs) + 'px">Normal range</text>';
        s += '<rect class="fe-mnorm is-sw" data-m="sw" x="0" y="' + f1(y0 + head * 0.55 - fs * 0.45) + '" width="' + f1(fs * 0.9) + '" height="' + f1(fs * 0.9) + '" rx="2"/>';
      } else {
        s += '<text class="fe-mlab is-str" x="' + f1(px1 - 2) + '" y="' + f1(py0 + fs * 0.4) + '" style="font-size:' + f1(fs) + 'px">Birth</text><path class="fe-mfull" d="M' + f1(px0) + ',' + f1(py0) + 'H' + f1(px1) + '"/>';
      }
      s += '<text class="fe-mtime" x="' + f1(px1) + '" y="' + f1(py1 + fs * 1.15) + '" style="font-size:' + f1(fs) + 'px">Time</text>';
      s += '<path class="fe-mtr is-con" data-m="con"/><path class="fe-mtr is-' + m.role + '" data-m="tr"/><circle class="fe-mnow is-' + m.role + '" data-m="now" r="' + f1(fs * 0.38) + '"/>';
      monG.innerHTML = s;
      // a narrow monitor: the title shortens rather than run into the legend
      var ti = monG.querySelector('.fe-mtitle'), lg = monG.querySelector('.fe-mlab.is-norm, .fe-mlab.is-con');
      if(ti && lg && ti.getComputedTextLength && ti.getComputedTextLength() + lg.getComputedTextLength() + fs * (m.pos ? 1.2 : 2.6) > w - pad * 2 - 4) ti.textContent = m.short || m.title;
      var sw = monG.querySelector('[data-m="sw"]'), nl = monG.querySelector('.fe-mlab.is-norm');
      if(sw && nl && nl.getComputedTextLength){ sw.setAttribute('x', f1(+nl.getAttribute('x') - nl.getComputedTextLength() - fs * 1.3)); }
      MON.tr = monG.querySelector('[data-m="tr"]'); MON.con = monG.querySelector('[data-m="con"]'); MON.now = monG.querySelector('[data-m="now"]');
    }
    function vy(v){ var m = cur.mon; return lerp(MON.py1, MON.py0, (v - m.lo) / (m.hi - m.lo)); }
    function dom(){ return cur.kind === 'pos' ? [-1, 14.5] : [-1.2, cur.TM.resp + cur.TM.tail + 0.3]; }
    function tx(t){ var d = dom(); return lerp(MON.px0, MON.px1, (t - d[0]) / (d[1] - d[0])); }
    function monPaint(st){
      var pts = [], cp = [], d = dom(), sc = cur, N = 140, i, t;
      if(sc.kind === 'neg'){
        var runN = st.run;
        pts.push([tx(d[0]), vy(sc.set)]);
        if(runN){
          pts.push([tx(0), vy(sc.set)]);
          for(i = 0; i <= N; i++){ t = d[0] + (d[1] - d[0]) * i / N; if(t < 0) continue; if(t > st.t) break; pts.push([tx(t), vy(sc.set + negDev(sc, runN, t))]); }
          pts.push([tx(st.t), vy(st.x)]);
        } else { pts.push([tx(0), vy(sc.set)]); pts.push([tx(0), vy(st.x)]); }
      } else {
        var plan = st.run || null, now = plan ? st.t : 0;
        pts.push([tx(d[0]), vy(0)]); pts.push([tx(0), vy(0)]); cp.push([tx(d[0]), vy(0)]);
        if(plan){
          for(i = 0; i <= N * 2; i++){ t = d[1] * i / (N * 2); if(t > now) break; var v = posValue(plan, t); pts.push([tx(t), vy(v.s)]); cp.push([tx(t), vy(v.c * 0.55)]); }
          var vn = posValue(plan, now); pts.push([tx(Math.min(now, d[1])), vy(vn.s)]);
        } else { pts.push([tx(0), vy(st.x)]); cp.push([tx(0), vy(0)]); }
      }
      sa(MON.tr, 'd', P(pts)); sa(MON.con, 'd', cp.length > 1 ? P(cp) : '');
      var e = pts[pts.length - 1]; sa(MON.now, 'cx', f1(e[0])); sa(MON.now, 'cy', f1(e[1]));
    }

    /* ---- labels: pooled pills placed clear of each other, the knob, the monitor and the controls */
    var labCache = {}, lastPlace = {}, TW = {};
    function textW(t){
      var key = t + '|' + E.fs.toFixed(2);
      if(TW[key]) return TW[key];
      var n = document.createElementNS(NS, 'text'); n.setAttribute('class', 'fe-lab-m'); n.setAttribute('x', -999); n.setAttribute('y', -999); n.style.fontSize = E.fs.toFixed(2) + 'px'; n.textContent = t; labs.appendChild(n);
      var w = n.getComputedTextLength ? n.getComputedTextLength() : 0; labs.removeChild(n);
      return (TW[key] = w > 0 ? w : t.length * E.fs * 0.6);
    }
    function inter(a, b, gp){ return a[0] < b[2] + gp && a[2] > b[0] - gp && a[1] < b[3] + gp && a[3] > b[1] - gp; }
    var OFF = { r: [1, 0], l: [-1, 0], u: [0, -1], d: [0, 1], ur: [0.8, -0.8], ul: [-0.8, -0.8], dr: [0.8, 0.8], dl: [-0.8, 0.8] };
    var ctrlBox = null;
    function ctrlDirty(){ ctrlBox = null; placeKey = ''; }
    function ctrls(){
      if(ctrlBox) return ctrlBox;
      var out = [], k = E.k || 1, pr = pic.getBoundingClientRect(), x0 = E.X0 || 0;
      function add(el){ if(!el || el.hidden || !el.offsetWidth) return; var q = el.getBoundingClientRect(); out.push([(q.left - pr.left) / k + x0, (q.top - pr.top) / k, (q.right - pr.left) / k + x0, (q.bottom - pr.top) / k]); }
      add(reset);
      if(cue && cue.active()) add(pic.querySelector('.tk2-cue'));
      return (ctrlBox = out);
    }
    function keepOut(st){
      var k = E.k || 1, out = ctrls().slice();
      if(handle && !handle.el.hidden){ var p = knobPos(st), r = 30 / k; out.push([p[0] - r, p[1] - r, p[0] + r, p[1] + r]); }
      out.push(MON.box);
      if(E.L.g.therm){ var g0 = E.L.g.therm, sc2 = g0[2]; out.push([g0[0] - 30 * sc2 - E.fsm * 2.2, g0[1] - 12 * sc2, g0[0] + 22 * sc2, g0[1] + 350 * sc2]); }
      return out;
    }
    var placeKey = '';
    function placeLabels(list, st){
      // the same labels at the same spots as the last frame: nothing to place (most frames of a run)
      var kp = handle && !handle.el.hidden ? knobPos(st) : [0, 0], pk = list.map(function(Lb){ return Lb.key + ':' + Lb.text + ':' + Lb.role + ':' + !!Lb.strong + ':' + f1(Lb.at[0]) + ',' + f1(Lb.at[1]) + ':' + (Lb.avoid ? Lb.avoid.length : 0); }).join('|') + '#' + f1(kp[0]) + ',' + f1(kp[1]) + '#' + E.fs.toFixed(2) + '#' + (ctrlBox ? 1 : 0) + E.L.id;
      if(pk === placeKey) return;
      placeKey = pk;
      var fs = E.fs, h = fs * 1.75, pad = fs * 0.55, placed = keepOut(st), used = {}, gp = E.gap, X0 = E.X0 || 0;
      list.forEach(function(Lb){
        var w = textW(Lb.text) + pad * 2, at = Lb.at, best = null, av = Lb.avoid || [];
        function clear(b){
          if(placed.some(function(x){ return inter(x, b, gp); })) return false;
          if(Lb.inside){ var ic = Lb.inside; if([[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]].some(function(p){ return Math.hypot(p[0] - ic.c[0], p[1] - ic.c[1]) > ic.r - gp; })) return false; }
          return !av.some(function(a){
            if(a.c){ var nx = clamp(a.c[0], b[0], b[2]), ny = clamp(a.c[1], b[1], b[3]); return Math.hypot(nx - a.c[0], ny - a.c[1]) < a.r + gp; }
            return inter(a, b, gp);
          });
        }
        if(Lb.fixed){
          // the value's own place: above the thermometer or meter, centred on it
          var fx0 = clamp(at[0] - w / 2, X0 + 4, X0 + E.W - 4 - w), fb = [fx0, Math.max(4, at[1] - h - 6), fx0 + w, Math.max(4, at[1] - h - 6) + h];
          placed.push(fb); used[Lb.key] = 1; drawLab(Lb, fb, at); return;
        }
        var sides = (Lb.side || ['r', 'l', 'u', 'd']).concat(['u', 'd', 'r', 'l', 'ur', 'ul', 'dr', 'dl']);
        var cands = [];
        [0.9, 1.6, 2.4, 3.4, 4.6, 6, 8, 10, 13].filter(function(dd){ return !Lb.away || dd >= Lb.away; }).forEach(function(dd, di){ sides.forEach(function(sd, si){ cands.push({ sd: sd, dd: dd, cost: di * 10 + si }); }); });
        var prev = lastPlace[cur.id + ':' + Lb.key + ':' + Lb.text + ':' + E.L.id];
        if(prev) cands.unshift({ sd: prev.sd, dd: prev.dd, cost: -1 });
        for(var c = 0; c < cands.length && !best; c++){
          var q = cands[c], o2 = OFF[q.sd], d = q.dd * fs;
          var cx = o2[0] ? at[0] + o2[0] * (w / 2 + d * 0.6) : at[0], cy = at[1] + o2[1] * (h / 2 + d);
          var b = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
          if(b[0] < X0 + 4 || b[2] > X0 + E.W - 4 || b[1] < 4 || b[3] > E.H - 4) continue;
          if(!clear(b)) continue;
          best = { b: b, sd: q.sd, dd: q.dd };
        }
        if(!best){
          for(var ring = 1; ring <= 30 && !best; ring++){
            var rr = ring * fs * 1.1, nn = 8 + ring * 4, bestD = Infinity;
            for(var a = 0; a < nn; a++){
              var ang = a / nn * Math.PI * 2, cx2 = at[0] + Math.cos(ang) * (rr + w * 0.35 * Math.abs(Math.cos(ang))), cy2 = at[1] + Math.sin(ang) * rr;
              var b2 = [cx2 - w / 2, cy2 - h / 2, cx2 + w / 2, cy2 + h / 2];
              if(b2[0] < X0 + 4 || b2[2] > X0 + E.W - 4 || b2[1] < 4 || b2[3] > E.H - 4) continue;
              if(!clear(b2)) continue;
              var dd2 = Math.hypot(cx2 - at[0], cy2 - at[1]);
              if(dd2 < bestD){ bestD = dd2; best = { b: b2, sd: 'u', dd: 99, far: true }; }
            }
          }
          if(!best){ var bx = clamp(at[0] - w / 2, X0 + 4, X0 + E.W - 4 - w), by = clamp(at[1] - h * 1.6, 4, E.H - 4 - h); best = { b: [bx, by, bx + w, by + h], sd: 'u', dd: 1 }; }
          if(best.far) Lb = Object.assign({}, Lb, { lead: true });
        }
        if(!best.far) lastPlace[cur.id + ':' + Lb.key + ':' + Lb.text + ':' + E.L.id] = { sd: best.sd, dd: best.dd };
        placed.push(best.b);
        used[Lb.key] = 1;
        drawLab(Lb, best.b, at);
      });
      Object.keys(labCache).forEach(function(k){ if(!used[k]){ labCache[k].g.remove(); delete labCache[k]; } });
    }
    function drawLab(Lb, b, at){
      var c = labCache[Lb.key];
      if(!c){
        var gEl = document.createElementNS(NS, 'g');
        gEl.innerHTML = '<path class="fe-lead"/><circle class="fe-lead-dot"/><rect/><text dy="0.36em"/>';
        labs.appendChild(gEl);
        c = labCache[Lb.key] = { g: gEl, lead: gEl.childNodes[0], dot: gEl.childNodes[1], rect: gEl.childNodes[2], t: gEl.childNodes[3], sig: '' };
      }
      var sig = Lb.text + '|' + Lb.role + '|' + b.map(f1).join(',') + '|' + (Lb.lead ? f1(at[0]) + ',' + f1(at[1]) : '') + '|' + E.fs.toFixed(2) + (Lb.strong ? 's' : '');
      if(sig === c.sig) return;
      c.sig = sig;
      c.g.setAttribute('class', 'fe-lab is-' + Lb.role + (Lb.strong ? ' is-strong' : ''));
      c.g.setAttribute('data-lab', Lb.text); c.g.setAttribute('data-key', Lb.key);
      var hh = b[3] - b[1];
      c.rect.setAttribute('x', f1(b[0])); c.rect.setAttribute('y', f1(b[1])); c.rect.setAttribute('width', f1(b[2] - b[0])); c.rect.setAttribute('height', f1(hh)); c.rect.setAttribute('rx', f1(hh / 2));
      c.t.setAttribute('x', f1((b[0] + b[2]) / 2)); c.t.setAttribute('y', f1((b[1] + b[3]) / 2)); c.t.style.fontSize = E.fs.toFixed(2) + 'px'; c.t.textContent = Lb.text;
      var inside = at[0] > b[0] && at[0] < b[2] && at[1] > b[1] && at[1] < b[3];
      if(Lb.lead && !inside){
        var cx = clamp(at[0], b[0], b[2]), cy = clamp(at[1], b[1], b[3]);
        c.lead.setAttribute('d', 'M' + f1(cx) + ',' + f1(cy) + 'L' + f1(at[0]) + ',' + f1(at[1]));
        c.dot.setAttribute('cx', f1(at[0])); c.dot.setAttribute('cy', f1(at[1])); c.dot.setAttribute('r', f1(E.fs * 0.22));
        c.lead.style.display = c.dot.style.display = '';
      } else c.lead.style.display = c.dot.style.display = 'none';
    }

    /* ---- the line under the picture: the seven parts, the current one named with the loop's own words */
    var railKey = '';
    function railPaint(st){
      var l = loopFor(st), k = st.k, key = cur.id + '|' + k + '|' + (st.turn || 0) + '|' + !!st.done + '|' + !!st.birthing + '|' + (st.born >= 0.85) + '|' + (l && l.id);
      if(key === railKey) return; railKey = key;
      dots.forEach(function(d, i){ d.classList.toggle('is-on', k >= 0 && (i <= k || st.done || st.birthing)); d.classList.toggle('is-cur', k === i && !st.done); });
      if(k < 0){ railN.textContent = 'Seven parts'; railT.textContent = 'each lights as the signal reaches it'; return; }
      if(st.birthing && st.born < 0.85){ railN.textContent = 'Birth'; railT.textContent = 'The head passes through the cervix.'; return; }
      if(st.birthing){ railN.textContent = 'Loop ends'; railT.textContent = l.live && l.live.end ? l.live.end : 'Birth ends the loop.'; return; }
      if(st.done){ railN.textContent = 'All 7 parts'; railT.textContent = 'back near the set point'; return; }
      railN.textContent = (st.turn ? 'Turn ' + (st.turn + 1) + ' · ' : '') + 'Part ' + (k + 1) + ' of 7';
      railT.textContent = NAMES[k] + ': ' + (l ? l.slots[SLOTS[k]].short : '');
    }

    /* ---- the knob: the variable itself */
    function knobPos(st){ var born = st && st.born ? st.born : 0; var q = cur.knobAt(E.L, cur.kind === 'pos' ? st.x : st.x, born); return q; }
    function makeHandle(){
      if(handle){ handle.el.remove(); handle = null; }
      var sc = cur;
      handle = K.handle(layer, { key: 'anp-loops-knob', label: sc.kind === 'pos' ? 'Push the baby’s head down onto the cervix' : 'Body ' + (sc.id === 'glucose' ? 'blood glucose' : 'temperature') + ': drag it off the set point',
        value: sc.x, min: sc.min, max: sc.kind === 'pos' ? sc.max : sc.max, step: sc.step, chip: false, beforeLabel: 'pushed',
        at: function(v){ var st = lastSt || { x: v }; var q = sc.knobAt(E.L, v, st.born || 0); return [q[0] - (E.X0 || 0), q[1]]; },
        dir: function(){ return 90; },
        pick: function(x, y, v){ x += E.X0 || 0; var nv = sc.pick(E.L, x, y); if(sc.kind === 'pos'){ var lo = sc.run ? lastSt.x : 0; nv = clamp(nv, lo, Math.max(lo, sc.push)); } return clamp(nv, sc.min, sc.max); },
        keys: sc.kind === 'pos' ? function(v, key){
          var lo = sc.run && lastSt ? lastSt.x : 0, top = Math.max(lo, sc.push);
          if(key === 'ArrowDown' || key === 'ArrowRight') return Math.min(top, v + 0.05);
          if(key === 'ArrowUp' || key === 'ArrowLeft') return Math.max(lo, v - 0.05);
          if(key === 'PageDown' || key === 'End') return top;
          if(key === 'PageUp' || key === 'Home') return lo;
          return null;
        } : undefined,
        valuetext: function(v){ return sc.kind === 'pos' ? 'Stretch of the cervix: ' + sc.fmt(v) : sc.fmt(v); },
        onStart: function(){ hideCue(true); tourDid('drag'); startDrag(); },
        onInput: function(v){ hideCue(true); tourDid('drag'); dragTo(v); },
        onEnd: function(v){ release(v); } });
    }
    // a press on the thermometer or meter away from the knob takes the value there (and the drag goes on); a press on
    // the baby's head grabs it
    svg.addEventListener('pointerdown', function(e){
      if(!handle || handle.el.hidden || (e.pointerType === 'mouse' && e.button !== 0)) return;
      var r = svg.getBoundingClientRect(), k = scale(), x = (e.clientX - r.left) / k + (E.X0 || 0), y = (e.clientY - r.top) / k, g0 = E.L.g.therm, hit = false;
      if(g0) hit = Math.abs(x - g0[0]) < 24 * g0[2] && y > g0[1] - 10 * g0[2] && y < g0[1] + 312 * g0[2];
      else { var hp = knobPos(lastSt || state()); hit = Math.hypot(x - hp[0], y - hp[1]) < 34 * E.L.g.body[2]; }
      if(!hit) return;
      hideCue(true); tourDid('drag');
      handle.grab(e);
    });
    function fastKnob(st){
      var kn = handle.knob, q = knobPos(st), k = E.k || scale(), x = f1((q[0] - (E.X0 || 0)) * k) + 'px', y = f1(q[1] * k) + 'px';
      if(kn.style.left !== x) kn.style.left = x; if(kn.style.top !== y) kn.style.top = y;
      var vt = cur.kind === 'pos' ? 'Stretch of the cervix: ' + cur.fmt(st.x) : cur.fmt(st.x);
      if(kn.getAttribute('aria-valuetext') !== vt){ kn.setAttribute('aria-valuetext', vt); kn.setAttribute('aria-valuenow', String(+(+st.x).toFixed(3))); }
    }
    var lastSt = null;
    function startDrag(){
      var sc = cur;
      if(sc.kind === 'pos' && (sc.after || (sc.run && lastSt && lastSt.birthing))) return;
      if(sc.run){ sc.x = lastSt ? lastSt.x : sc.x; sc.run = null; stopRaf(); }
      sc.endRun = null; dragging = true;
      if(handle) handle.before(null);
    }
    function dragTo(v){
      var sc = cur;
      if(sc.kind === 'pos' && sc.after) return;
      if(sc.run){ sc.x = lastSt ? lastSt.x : sc.x; sc.run = null; stopRaf(); }
      dragging = true; sc.x = v; draw();
    }
    function release(v){
      var sc = cur; dragging = false;
      if(sc.kind === 'pos' && sc.after){ draw(); return; }
      if(v == null) v = sc.x;
      sc.x = v;
      if(Math.abs(v - sc.set) < sc.dead){ sc.run = null; draw(); say(sc.kind === 'pos' ? 'Push the head further down to stretch the cervix.' : sc.fmt(v) + ': close to the set point, nothing to correct.'); return; }
      startRun(v);
    }
    function startRun(v){
      var sc = cur;
      if(sc.kind === 'pos') sc.run = posPlan(v);
      else sc.run = { d: v - sc.set, s: v > sc.set ? 1 : -1, x0: v };
      sc.t = 0; sc.after = null; sc.endRun = null;
      if(handle && sc.kind === 'neg') handle.before(v);
      if(K.reduced() || !onScreen){ fadeOut(); sc.t = endT(); finishRun(); return; }
      last = 0; stopRaf(); raf = requestAnimationFrame(tick);
      draw();
      var st = state(); say(words(st).text);
    }
    function endT(){ var sc = cur; return sc.kind === 'pos' ? sc.run.end : sc.TM.resp + sc.TM.tail; }
    function finishRun(){
      var sc = cur; stopRaf();
      var st = state();
      if(sc.kind === 'pos'){ sc.after = sc.run; sc.run = null; sc.x = 0; }
      else { sc.x = st.x; sc.endRun = sc.run; sc.run = null; }
      draw();
      say(sc.take(st));
    }
    function stopRaf(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } last = 0; }
    function tick(ts){
      raf = 0;
      var sc = cur; if(!sc.run) return;
      var dt = last ? Math.min(50, ts - last) : 16; last = ts;
      sc.t += dt / 1000;
      if(sc.t >= endT()){ sc.t = endT(); finishRun(); return; }
      draw();
      raf = requestAnimationFrame(tick);
    }
    function fadeOut(){
      if(!onScreen) return;
      var c = svg.cloneNode(true); c.removeAttribute('id'); c.setAttribute('aria-hidden', 'true'); c.classList.add('fe-fade');
      pic.appendChild(c);
      var done = function(){ if(c.parentNode) c.parentNode.removeChild(c); };
      if(c.animate){ var an = c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'linear' }); an.onfinish = done; setTimeout(done, 450); } else done();
    }
    reset.addEventListener('click', function(){
      var sc = cur; stopRaf(); fadeOut();
      sc.run = null; sc.after = null; sc.endRun = null; sc.x = sc.set; sc.t = 0; dragging = false;
      if(handle){ handle.before(null); handle.value(sc.x, false); }
      wKey = ''; railKey = ''; draw();
      say('Start over. ' + sc.tab + (sc.kind === 'pos' ? ': the head rests above the cervix.' : ': back at the set point, ' + sc.fmt(sc.set) + '.'));
    });

    /* ---- one frame */
    function words(st){
      var sc = cur, w;
      if(st.idle && !st.after) w = sc.idleWords(st.x);
      else w = sc.words(st);
      return { pre: w.pre, parts: w.parts, text: (w.pre ? w.pre + ' ' : '') + w.parts.map(function(p){ return p.t; }).join(', ') + '.' };
    }
    function draw(){
      var st = state(), sc = cur; lastSt = st;
      if(st.after){ st.birthing = true; st.born = 1; st.k = 7; }
      sc.paint(R, st, E);
      pulses(st);
      monPaint(st);
      if(handle){
        var hidden = sc.kind === 'pos' && (st.birthing || st.after);
        handle.el.hidden = hidden;
        // during a run the knob is moved here directly: the kit's own paint rewrites its tag and hidden state each
        // call, and on a phone those writes make the page restyle every frame
        if(!dragging && !hidden){ if(sc.run) fastKnob(st); else handle.value(st.x, false); }
        else if(dragging) handle.place();
      }
      var LL = sc.labels(st, E);
      // the value itself, at the column (temperature and glucose)
      if(sc.kind === 'neg'){ var tp = T(E.L, [0, 0, 'therm']); tp[1] -= 30 / (E.k || 1); LL.unshift({ key: 'val', text: sc.fmt(st.x), role: sc.valRole(st.x), at: tp, fixed: true, strong: true }); }
      placeLabels(LL, st);
      railPaint(st);
      var w = words(st), key = JSON.stringify(w.parts) + w.pre + (st.done ? '|end' : '') + (st.after ? '|after' : '');
      if(key !== wKey){
        wKey = key;
        cause.set(w.parts, w.pre);
        if(st.done || st.after) cause.take(sc.take(st));
        svg.setAttribute('aria-label', sc.tab + '. ' + w.text);
      }
    }

    /* ---- tabs */
    function setTab(id, user){
      var sc = scenes.filter(function(x){ return x.id === id; })[0];
      if(!sc) return;
      if(cur.run){ cur.t = endT(); finishRun(); }
      stopRaf();
      cur = sc; wKey = ''; railKey = ''; dragging = false;
      tabs.value(sc.id); head.purpose(sc.purpose);
      main.setAttribute('data-scene', sc.id);
      layout(); metrics(); ctrlDirty(); buildArt(); makeHandle(); draw(); refHtml();
      if(sc.endRun && handle) handle.before(sc.endRun.x0);
      if(user){ try{ history.replaceState(null, '', location.pathname + location.search + '#explore/' + sc.id); }catch(e){} say(sc.tab + '. ' + words(state()).text); }
      if(cue && cue.active()){ cue.hide(false); makeCue(); }
    }

    /* ---- the first visit cue and "Show me how" */
    function makeCue(){
      var kq = knobPos(lastSt || state()), right = kq[0] - (E.X0 || 0) < E.W * 0.5;
      cue = K.cue(layer, { key: 'anp-loops', text: cur.cue, side: right ? 'right' : 'left', at: function(){ var q = knobPos(lastSt || state()); return [q[0] - (E.X0 || 0), q[1]]; } });
      cue.show(); ctrlDirty();
      setTimeout(function(){ if(cue && cue.active()){ ctrlDirty(); draw(); } }, 450);
    }
    function hideCue(used){ if(cue && cue.active()){ cue.hide(used); ctrlDirty(); } }
    var tour = K.tour({ key: 'anp-loops', label: 'Show me how', steps: [
      { id: 'drag', text: 'Drag the value off normal, then let go.', target: function(){ return handle ? handle.knob : pic; } },
      { id: 'rail', text: 'The seven parts light in order as the signal reaches each one.', target: function(){ return rail; } },
      { id: 'why', text: 'This line says what each part is doing now.', target: function(){ return cause.el; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function tourDid(id){ if(tour.active()) tour.did(id); }
    function startTour(){ hideCue(false); tour.start(true); }

    /* ---- "?" for this screen */
    var ref = document.createElement('div'); ref.className = 'ls-sec fe-ref';
    function refHtml(){
      var sc = cur, B = o.base || '../', ids = [sc.loops.up].concat(sc.loops.down ? [sc.loops.down] : []);
      var l0 = loop(ids[0]), t = topicOf(l0.topic);
      ref.innerHTML = '<h3 class="ls-h">' + esc(sc.tab) + (sc.kind === 'pos' ? ': positive feedback' : ': negative feedback') + '</h3>' +
        '<p>' + (sc.kind === 'pos'
          ? 'In positive feedback the response pushes the variable further the same way as the stimulus, so each turn of the loop is stronger than the last. It does not stop itself; an event outside the loop ends it. Here, birth removes the stretch.'
          : 'In negative feedback the response moves the variable the opposite way to the stimulus, back toward the set point. As the variable returns, the sensors signal less and the effectors ease off, so the loop switches itself off.') + '</p>' +
        '<p class="ls-sub">Drag the ' + esc(sc.thing) + (sc.kind === 'pos' ? ' down' : ' up or down') + ', or use the arrow keys on it, then let go. The seven parts light in order as the signal reaches them; the line under the picture names each one. The monitor draws the value against time. Pictures show the idea, not the real timing or scale.</p>' +
        '<p class="ls-sub">' + sc.note + '</p>' +
        '<h3 class="ls-h">The seven parts</h3><ol class="fe-parts">' + NAMES.map(function(n, i){ return '<li>' + esc(n) + ': ' + esc(PART_SAY[i]) + '</li>'; }).join('') + '</ol>' +
        '<p>' + ids.map(function(id){ var l = loop(id); return '<button type="button" class="btn-outline fe-ref-q" data-l="' + esc(id) + '">Test yourself: ' + esc(l.title) + '</button>'; }).join(' ') + '</p>' +
        (t && t.built ? '<p>Topic: <a href="' + esc(B + 'lessons/' + t.id + '.html') + '">' + esc(t.title) + '</a> · <a href="' + esc(B + 'notes/' + t.id + '.html') + '">notes</a></p>' : '') +
        '<p><button type="button" class="tk2-link fe-ref-how">Show me how</button></p>';
    }
    function topicOf(id){ var ts = (window.AnpCurriculum || {}).topics || []; return ts.filter(function(x){ return x.id === id; })[0] || null; }
    ref.addEventListener('click', function(e){
      var q = e.target.closest('.fe-ref-q'); if(q){ if(o.studio) o.studio.close(); if(o.onQuiz) o.onQuiz(q.getAttribute('data-l')); return; }
      if(e.target.closest('.fe-ref-how')){ if(o.studio) o.studio.close(); setTimeout(startTour, 60); }
    });

    /* ---- sizes, visibility */
    var rz = 0, lastW = 0, lastLay = '';
    function resized(){ clearTimeout(rz); rz = setTimeout(function(){
      if(!stage.isConnected || !pic.offsetWidth) return;
      var w = pic.offsetWidth, lay = pickLayout();
      if(w === lastW && lay === lastLay){ if(handle) handle.place(); return; }
      lastW = w; lastLay = lay; layout(); metrics(); ctrlDirty(); buildArt(); draw(); if(handle) handle.place(); if(cue && cue.active()) cue.place();
    }, 60); }
    if(window.ResizeObserver){ var ro = new ResizeObserver(resized); ro.observe(stage); } else window.addEventListener('resize', resized);
    // leaving (Test yourself, "?", another tab, the page hidden) ends a run at once, so the screen comes back clean
    function hideNow(){ if(cur.run){ cur.t = endT(); finishRun(); } stopRaf(); dragging = false; }
    // "?" open over the stage counts as leaving it
    if(o.studio && o.studio.root && window.MutationObserver){
      var wasSheet = false;
      new MutationObserver(function(){ var on = o.studio.root.classList.contains('is-sheet'); if(on && !wasSheet) hideNow(); wasSheet = on; }).observe(o.studio.root, { attributes: true, attributeFilter: ['class'] });
    }
    document.addEventListener('visibilitychange', function(){ if(document.hidden){ onScreen = false; hideNow(); } else onScreen = stage.offsetWidth > 0; });

    // first frame
    main.setAttribute('data-scene', cur.id);
    setTimeout(function(){ layout(); metrics(); buildArt(); makeHandle(); draw(); refHtml(); makeCue(); lastW = pic.offsetWidth; lastLay = pickLayout(); }, 0);

    function tabFor(q){
      if(q.tab){ var a = scenes.filter(function(x){ return x.id === q.tab; })[0]; return a ? a.id : null; }
      if(q.loop){ var b = scenes.filter(function(x){ return x.loops.up === q.loop || x.loops.down === q.loop; })[0]; return b ? b.id : null; }
      if(q.topic){ var c = scenes.filter(function(x){ return x.topics.indexOf(q.topic) > -1; })[0]; if(c) return c.id; }
      if(q.chapter && q.topicOf){ var d = scenes.filter(function(x){ return x.topics.some(function(tp){ var tt = q.topicOf(tp); return tt && tt.chapter === q.chapter; }); })[0]; if(d) return d.id; }
      return null;
    }
    var api = {
      stage: stage, ref: ref,
      shown: function(on){
        onScreen = !!on;
        if(!on){ hideNow(); return; }
        setTimeout(function(){ ctrlDirty(); resized(); lastW = 0; resized(); }, 30);
      },
      tab: function(id){ if(id === undefined) return cur.id; if(id !== cur.id) setTab(id, false); return cur.id; },
      tabFor: tabFor,
      loopOf: function(id){ var sc = scenes.filter(function(x){ return x.id === (id || cur.id); })[0]; return sc ? sc.loops.up : null; },
      // for tests: the drawn state and the scene's timing
      _state: function(){ return lastSt; }, _cur: function(){ return cur; },
      _seek: function(t){ var sc = cur; if(!sc.run) return false; stopRaf(); sc.t = clamp(t, 0, endT()); if(sc.t >= endT()) finishRun(); else draw(); return true; },
      _push: function(v, hold){ var sc = cur; startDrag(); dragTo(v); if(!hold) release(v); return true; },
      _end: endT
    };
    window.AnpLoopExplore.current = api;
    return api;
  }

  window.AnpLoopExplore = { build: build, _scenes: SCENES, _negState: negState, _posPlan: posPlan, _posValue: posValue };
})();
