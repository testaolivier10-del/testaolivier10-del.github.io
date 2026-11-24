/* Function lab (simulator, free; docs/apprecalc-spec.md section 6). OWNED BY THIS TOOL ONLY. Model:
   ApPrecalcMath.functionLab (precalculus/assets/tools/math/function-lab.js); math text ApPrecalcTex.

   EXPLORE (tools v2, docs/tools-v2-pcalc-function-lab-brief.md): the first AP® Precalculus tool on the shared kit
   (assets/course/tool-kit2.js), through the course adapter ApPrecalcTools.studioKit2. The graph of
   g(x) = a f(b(x - h)) + k is a steel wire bent on a pegboard (the board's holes are the grid, its painted lines the
   exact axes); the parent f is a thin grey wire behind it. Two pins hold the wire, both K.handle: the square pin is
   (h, k), where the parent's origin goes (drag it and every point moves the same way); the round pin holds one key
   point (up and down sets a, sideways sets b). Key points are beads that keep their colour; while a pin moves, a
   thin arrow runs from each parent point to its bead. The cause line (K.cause) says what the last change did, live,
   from what is drawn. "Show the steps" plays the changes in the order they act (b, then h, then a, then k) and ends
   on the takeaway. "?" holds the formula, the sentence in words, the table of key points, the features (zeros,
   asymptotes, end behavior in limit notation, domain, range) and the keys.

   TEST YOURSELF (unchanged): read a, h, k from a graph; where a point goes; describe a transformation (b factored out
   first); asymptotes of a/(x - h) + k in limit notation; an exponential's asymptote, ends and zero. Record ids
   function-lab:<context>:<step>; ?seed= and #quiz open it. */
(function(){
  'use strict';
  var T = window.ApPrecalcTools, M = window.ApPrecalcMath, P = window.ApPrecalcPlot, X = window.ApPrecalcTex;
  (function(){
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Numbers & details');
  })();
  if(!T || !M || !M.functionLab || M.functionLab.stub || !P) return;
  var FL = M.functionLab, F = T.F, esc = T.esc, NS = 'http://www.w3.org/2000/svg', PI = Math.PI;
  var ID = { a: 1, b: 1, h: 0, k: 0 }, uid = 0;
  function tex(s){ return X ? X.render(s) : esc(s); }
  function html(s){ return X ? X.html(s) : s; }
  function r1(v){ return Math.round(v * 10) / 10; }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function num(v){ return FL.n(v, 2).replace(/^-/, '−'); }
  function el(tag, cls, h){ var e = document.createElement(tag); if(cls) e.className = cls; if(h != null) e.innerHTML = h; return e; }
  function sv(tag, cls, at){ var e = document.createElementNS(NS, tag); if(cls) e.setAttribute('class', cls); if(at) for(var k in at) e.setAttribute(k, at[k]); return e; }
  function now(){ return window.performance ? performance.now() : Date.now(); }

  /* ======================================================= EXPLORE (tools v2) */
  /* b moves along a ladder of values that read well: tenths from 0.5 to 3, and below 0.5 the reciprocals of whole and
     half numbers (so the width factor 1/b is 2.5, 3, 4, 5, 8 or 10). The round pin snaps to the rung nearest the finger. */
  var BL = (function(){ var out = [0.1, 0.125, 0.2, 0.25, 1 / 3, 0.4]; for(var i = 5; i <= 30; i++) out.push(i / 10); return out; })();
  var BSTR = { '0.1': '0.1', '0.125': '1/8', '0.2': '0.2', '0.25': '1/4', '0.333': '1/3', '0.4': '0.4' };
  function bText(b){ var s = BSTR[String(+Math.abs(b).toFixed(3))]; return (b < 0 ? '−' : '') + (s || num(Math.abs(b))); }
  function bNice(b){ var m = Math.abs(b), best = BL[0]; BL.forEach(function(x){ if(Math.abs(x - m) < Math.abs(best - m)) best = x; }); return (b < 0 ? -1 : 1) * best; }
  /* a width or height factor in words (a dilation by f) */
  function times(f){ f = Math.abs(f); var t = FL.n(f, 3);
    return Math.abs(f - 1) < 1e-9 ? 'the same' : Math.abs(f - 2) < 1e-9 ? 'twice' : Math.abs(f - 0.5) < 1e-9 ? 'half' : Math.abs(f - 1 / 3) < 1e-6 ? 'a third' : Math.abs(f - 0.25) < 1e-6 ? 'a quarter' : t + ' times'; }
  var PARENT_LAB = { linear: 'f(x) = x', quadratic: 'f(x) = x²', cubic: 'f(x) = x³', absolute: 'f(x) = |x|', sqrt: 'f(x) = √x', reciprocal: 'f(x) = 1/x',
    piecewise: 'f, two pieces', exponential: 'f(x) = 2ˣ', logarithmic: 'f(x) = log₂ x', sine: 'f(x) = sin x' };

  function explore(host, data){
    var K = window.LevlKit2, id = 'fl' + (++uid);
    var fams = (data.families || []).map(function(f){ return f.id; }).filter(function(x){ return FL.FAMILIES[x]; });
    if(!fams.length) fams = ['quadratic'];
    var S = { fam: fams.indexOf('quadratic') > -1 ? 'quadratic' : fams[0], p: { a: 1, b: 1, h: 2, k: -1 }, mode: 'explore', ready: false,
      last: 'hk', d0: null, steps: 0, took: null, moving: 0, used: false };
    /* D: what is drawn now (sx = 1/b, sy = a). Every number, label and the cause line is read from D, never from the target. */
    var PH = [], D0 = null;
    var D = { sx: 1, sy: 1, h: 2, k: -1 }, TW = {}, MORPH = null, ARW = 0, G = null, LS = null, raf = 0;
    function Fm(f){ return FL.FAMILIES[f || S.fam]; }

    /* ---------------------------------------------------- the stage */
    var stage = el('div', 'fl2');
    var head = K.head({ purpose: '', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    var pickWrap = el('label', 'fl2-pick'), pick = el('select', 'fl2-sel');
    pickWrap.innerHTML = '<span class="fl2-pick-k">Parent</span>';
    pick.setAttribute('aria-label', 'Parent function');
    fams.forEach(function(k){ var o = document.createElement('option'); o.value = k; o.textContent = Fm(k).name; pick.appendChild(o); });
    pick.value = S.fam; pickWrap.appendChild(pick);
    head.el.insertBefore(pickWrap, head.how);
    stage.appendChild(head.el);
    var scene = el('div', 'fl2-scene'); scene.id = id + '-scene';
    // two layers: the board (painted once per layout) and, over it, the wires, beads and labels (every frame)
    scene.innerHTML = '<svg class="fl2-bg" aria-hidden="true" xmlns="' + NS + '"><defs></defs><g class="fl2-static"></g></svg>' +
      '<svg class="fl2-svg" role="img" aria-label="" xmlns="' + NS + '" data-ls-text="keep"><g class="fl2-dyn"></g><g class="fl2-labs"></g></svg>';
    stage.appendChild(scene);
    var svgB = scene.querySelector('.fl2-bg'), svg = scene.querySelector('.fl2-svg'), defs = svgB.querySelector('defs'), gS = svgB.querySelector('.fl2-static'), gD = svg.querySelector('.fl2-dyn'), gL = svg.querySelector('.fl2-labs');
    var layer = K.layer(scene);
    var lines = el('div', 'fl2-lines'), cause = K.cause({ label: 'What the change did' });
    lines.appendChild(cause.el);
    var acts = el('div', 'fl2-acts');
    var SMAX = 1.04, steps = K.player({ min: 0, max: SMAX, speed: function(){ return 1 / (0.95 * Math.max(1, PH.length)); }, hold: 0.5,
      labels: { play: 'Show the steps', pause: 'Pause', again: 'Show the steps', next: 'Next step', rest: 'Show the steps' },
      get: function(){ return S.steps; }, set: function(v){ stepTo(v); }, stops: function(){ return stepStops(); },
      before: function(){ return stepsStart(); }, onEnd: function(){ stepsEnd(); } });
    steps.el.classList.add('is-sm');
    var reset = el('button', 'fl2-reset', 'Back to f'); reset.type = 'button';
    acts.appendChild(steps.el); acts.appendChild(reset);
    lines.appendChild(acts);
    stage.appendChild(lines);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    /* ---------------------------------------------------- the board's geometry */
    /* Equal units on both axes, the origin in the middle of the board; at least 12 units across and 9 down. */
    function geo(W, H){
      var narrow = W < 560, fw = narrow ? 9 : 14, g = { W: W, H: H, narrow: narrow, fw: fw };
      g.L = fw; g.T = fw; g.R = W - fw; g.B = H - fw;
      var u = Math.min((g.R - g.L) / 12, (g.B - g.T) / 9);
      g.u = u; g.cx = Math.round((g.L + g.R) / 2); g.cy = Math.round((g.T + g.B) / 2);
      g.x0 = (g.L - g.cx) / u; g.x1 = (g.R - g.cx) / u; g.y0 = (g.cy - g.B) / u; g.y1 = (g.cy - g.T) / u;
      g.sx = function(x){ return g.cx + x * u; }; g.sy = function(y){ return g.cy - y * u; };
      g.ix = function(px){ return (px - g.cx) / u; }; g.iy = function(py){ return (g.cy - py) / u; };
      // a pin's centre stays this far inside the frame (its knob and a short tag fit)
      var m = (narrow ? 22 : 26) / u; g.px0 = g.x0 + m; g.px1 = g.x1 - m; g.py0 = g.y0 + m; g.py1 = g.y1 - m;
      g.minD = narrow ? 38 : 44;
      return g;
    }

    /* ---------------------------------------------------- the wire: g sampled through the parent's own input */
    /* A parent point (u, v) is drawn at (u·sx + h, v·sy + k): the same map moves every point, so the wire, its beads
       and the pins can never disagree. Runs break where f is undefined, at the piecewise jump and off the board. */
    function runs(fam, d, pv){
      var Fa = Fm(fam), out = [], lo, hi, ax = Math.abs(d.sx);
      var xa = G.x0 - 1.5, xb = G.x1 + 1.5;
      if(ax < 1e-6){ lo = -40; hi = 40; } else { var u1 = (xa - d.h) / d.sx, u2 = (xb - d.h) / d.sx; lo = Math.max(-400, Math.min(u1, u2)); hi = Math.min(400, Math.max(u1, u2)); }
      if(fam === 'sqrt' || fam === 'logarithmic') lo = Math.max(lo, fam === 'sqrt' ? 0 : 1e-7);
      if(!(hi > lo)) return out;
      var px = Math.max(60, (hi - lo) * Math.max(ax, 0.02) * G.u), n = Math.round(clamp(px / 2.5, 160, 900));
      if(Fa.periodic) n = Math.round(clamp(Math.max(n, (hi - lo) / (2 * PI) * 40), 160, 1400));
      var us = [];
      for(var i = 0; i <= n; i++) us.push(lo + (hi - lo) * i / n);
      // close to an asymptote (reciprocal, log) the wire is steep: sample it finely there
      if(fam === 'reciprocal' || fam === 'logarithmic') for(var j = 0; j <= 48; j++){ var e = Math.pow(10, -j / 12); if(e > lo && e < hi) us.push(e); if(fam === 'reciprocal' && -e > lo && -e < hi) us.push(-e); }
      if(fam === 'piecewise' && lo < 0 && hi > 0){ us.push(-1e-9); us.push(0); }
      if(fam === 'sqrt' && lo === 0) for(var q = 1; q <= 12; q++) us.push(Math.pow(10, -q / 3));
      us.sort(function(p, c){ return p - c; });
      var yT = G.T - 40, yB = G.B + 40, run = [], prev = null;
      function end(){ if(run.length > 1) out.push(run); run = []; }
      for(var k = 0; k < us.length; k++){
        var u = us[k], v = pv ? pv(u) : Fa.f(u);
        if(fam === 'reciprocal' && Math.abs(u) < 1e-12) v = NaN;
        if(!isFinite(v)){ end(); prev = null; continue; }
        if(fam === 'piecewise' && prev && prev.u < 0 && u >= 0) end();
        if(fam === 'reciprocal' && prev && prev.u < 0 && u > 0) end();
        var X0 = G.sx(u * d.sx + d.h), Y0 = G.sy(v * d.sy + d.k), cur = { u: u, X: X0, Y: Y0, out: Y0 < yT || Y0 > yB };
        if(cur.out){
          if(run.length){ run.push([X0, clamp(Y0, yT - 20, yB + 20)]); end(); }
          prev = cur; continue;
        }
        if(prev && prev.out && !run.length) run.push([prev.X, clamp(prev.Y, yT - 20, yB + 20)]);
        run.push([X0, Y0]); prev = cur;
      }
      end();
      return out;
    }
    function pathOf(rs){ return rs.map(function(r){ return 'M' + r.map(function(p){ return r1(p[0]) + ' ' + r1(p[1]); }).join('L'); }).join(''); }
    function imgOf(d, q){ return [q[0] * d.sx + d.h, q[1] * d.sy + d.k]; }

    /* ---------------------------------------------------- the target and the tweens */
    function lerp(a, b, t){ return a + (b - a) * t; }
    function ease(t){ return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function targetD(p){ return { sx: 1 / p.b, sy: p.a, h: p.h, k: p.k }; }
    /* glide D to the target: quick while a finger drags (it follows), slower for a key, a flip, a reset or a step */
    function aim(dur){
      var t = targetD(S.p), t0 = now(), rd = K.reduced();
      ['sx', 'sy', 'h', 'k'].forEach(function(k){
        if(Math.abs(D[k] - t[k]) < 1e-9 && !TW[k]){ D[k] = t[k]; return; }
        var dd = dur;
        if((k === 'sx' || k === 'sy') && D[k] * t[k] < 0) dd = Math.max(dur, 420);   // a flip passes through flat
        TW[k] = rd ? null : { from: D[k], to: t[k], t0: t0, dur: dd };
        if(rd) D[k] = t[k];
      });
      if(rd){ fadeOnce(); }
      kick();
    }
    function tick(t){
      var busy = false;
      ['sx', 'sy', 'h', 'k'].forEach(function(k){
        var w = TW[k]; if(!w) return;
        var u = clamp((t - w.t0) / w.dur, 0, 1); D[k] = lerp(w.from, w.to, ease(u));
        if(u >= 1){ D[k] = w.to; TW[k] = null; } else busy = true;
      });
      if(MORPH){ var m = clamp((t - MORPH.t0) / MORPH.dur, 0, 1); MORPH.w = ease(m); if(m >= 1) MORPH = null; else busy = true; }
      // the arrows from each parent point to its bead show while a pin moves, then fade
      var want = S.moving || steps.playing() ? 1 : 0;
      if(ARW !== want){ ARW = want ? Math.min(1, ARW + 0.2) : Math.max(0, ARW - 0.05); busy = true; }
      return busy;
    }
    function kick(){ if(raf || !G) return; raf = requestAnimationFrame(loop); }
    function loop(t){
      raf = 0;
      var busy = tick(t);
      draw();
      if(busy && !stage.hidden && S.mode === 'explore') raf = requestAnimationFrame(loop);
      else if(!busy) settled();
    }
    function stopAnim(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } ['sx', 'sy', 'h', 'k'].forEach(function(k){ if(TW[k]){ D[k] = TW[k].to; TW[k] = null; } }); MORPH = null; ARW = 0; }
    function fadeOnce(){ svg.classList.remove('is-fade'); void svg.getBoundingClientRect(); svg.classList.add('is-fade'); }
    var setT = 0;
    function settled(){
      // the live region speaks once the picture and the cause line show the end of the change
      if(S.sayNext != null){ var pre = S.sayNext; S.sayNext = null; say(pre + cause.text()); }
      clearTimeout(setT); setT = setTimeout(function(){ refLater(); }, 60);
    }

    /* ---------------------------------------------------- pin limits */
    /* a value in tenths kept inside [lo, hi] (rounded inward at the ends) */
    function inT(v, lo, hi){ return clamp(r1(v), Math.ceil(lo * 10 - 1e-9) / 10, Math.floor(hi * 10 + 1e-9) / 10); }
    function inBoard(x, y){ return x >= G.px0 - 1e-9 && x <= G.px1 + 1e-9 && y >= G.py0 - 1e-9 && y <= G.py1 + 1e-9; }
    function shapePt(p, fam){ var Fa = Fm(fam); return imgOf(targetD(p), Fa.keys[Fa.shape]); }
    function pinsOk(p){
      var q = shapePt(p);
      if(!inBoard(p.h, p.k) || !inBoard(q[0], q[1])) return false;
      return Math.hypot((q[0] - p.h) * G.u, (q[1] - p.k) * G.u) >= G.minD - 0.5;
    }
    /* After a resize or a new parent the pins must still be on the board: slide (h, k) in, then shrink a and b if needed. */
    function fit(){
      if(!G) return false;
      var p = S.p, c = Object.assign({}, p);
      if(pinsOk(c)) return false;
      var q = shapePt(c), dx = q[0] - c.h, dy = q[1] - c.k;
      c.h = inT(c.h, Math.max(G.px0, G.px0 - dx), Math.min(G.px1, G.px1 - dx));
      c.k = inT(c.k, Math.max(G.py0, G.py0 - dy), Math.min(G.py1, G.py1 - dy));
      if(!pinsOk(c)){ c.a = 1; c.b = 1; c.h = 0; c.k = 0; if(!pinsOk(c)){ c.h = r1(G.px0 + 0.5); c.k = r1(G.py0 + 0.5); } }
      S.p = c; return true;
    }

    /* ---------------------------------------------------- the two pins (K.handle): the value encodes two numbers */
    // square pin: v = (10h + 1000)·10000 + (10k + 1000); round pin: v = (10a + 1000)·10000 + rung of b (b < 0: 500 + rung)
    function encHK(p){ return (Math.round(p.h * 10) + 1000) * 10000 + (Math.round(p.k * 10) + 1000); }
    function encAB(p){ var i = BL.indexOf(BL.reduce(function(s, x){ return Math.abs(x - Math.abs(p.b)) < Math.abs(s - Math.abs(p.b)) ? x : s; }, BL[0])); return (Math.round(p.a * 10) + 1000) * 10000 + (p.b < 0 ? 500 : 0) + i; }
    function decAB(v){ var A = Math.floor(v / 10000), r = v - A * 10000, neg = r >= 500, i = neg ? r - 500 : r; return { a: (A - 1000) / 10, b: (neg ? -1 : 1) * BL[i] }; }
    function decHK(v){ var A = Math.floor(v / 10000); return { h: (A - 1000) / 10, k: (v - A * 10000 - 1000) / 10 }; }
    /* where the pins and their numbers are read from: what is drawn, except in the first half of Show the steps'
       cross fade back onto f, where the pins (fading out) still hold g's places */
    var XF = null;
    function PD(){ return XF && XF.u < 0.5 ? XF.D0 : D; }
    function hkAt(){ var d = PD(); return G ? [G.sx(d.h), G.sy(d.k)] : null; }
    function abAt(){ if(!G) return null; var Fa = Fm(), q = imgOf(PD(), Fa.keys[Fa.shape]); return [G.sx(q[0]), G.sy(q[1])]; }
    function shownP(){
      // the parameters as drawn now. While a flip passes through flat (|drawn b| over 3, |drawn a| under 0.05) that
      // number is not a value of the slider: it reads null ("flipping")
      var d = PD(), b = Math.abs(d.sx) < 1 / 3.02 ? null : 1 / d.sx;
      return { a: Math.abs(d.sy) < 0.05 ? null : r1(d.sy), b: b == null ? null : Math.abs(b - bNice(b)) < 0.02 ? bNice(b) : Math.round(b * 100) / 100, h: r1(d.h), k: r1(d.k) };
    }
    function aT(q){ return q.a == null ? 'a flipping' : 'a = ' + num(q.a); }
    function bT(q){ return q.b == null ? 'b flipping' : 'b = ' + bText(q.b); }
    function hkTag(){ var q = shownP(); return 'h = ' + num(q.h) + ', k = ' + num(q.k); }
    function abTag(){ var q = shownP(); return aT(q) + ', ' + bT(q); }
    /* a tag goes on the side of its pin away from the other pin, inside the board, clear of the other pin's knob and
       tag (the square pin's tag is placed first, the round pin's after it) */
    function sideAway(h, from, to, ban){
      if(!G) return 'down';
      var dx = to[0] - from[0], dy = to[1] - from[1], c = Math.abs(dx) > Math.abs(dy) * 1.2 ? (dx > 0 ? 'left' : 'right') : (dy > 0 ? 'up' : 'down');
      var opp = { up: 'down', down: 'up', left: 'right', right: 'left' }, perp = c === 'up' || c === 'down' ? ['right', 'left'] : ['down', 'up'];
      var order = [c].concat(perp, [opp[c]]).filter(function(x){ return x !== ban; });
      var txt = h === hk ? hkTag() : abTag(), stay = [knobBox(to, 23)];
      if(h === ab){ var ot = hk.el.querySelector('.tk2-tag'); if(ot && !ot.hidden) stay.push(tagBox(hk, hkTag(), ot.className.replace(/.*is-/, ''))); }
      var inside = function(b){ return b && b[0] >= G.L + 2 && b[2] <= G.R - 2 && b[1] >= G.T + 2 && b[3] <= G.B - 2; };
      // among the sides clear of the other pin and its tag, the one that covers the fewest axis numbers (so a half axis
      // keeps its numbers); ties go in the order above
      var tk = (E.tickBoxes || []).filter(function(b, i){ return !E.tickEls[i]._spare; }), bestS0 = null, bestN = Infinity;
      for(var i = 0; i < order.length; i++){ var b = tagBox(h, txt, order[i], true); if(inside(b) && !hitAny(b, stay.filter(Boolean), 5)){ var nT = tk.filter(function(t){ return hitAny(b, [t], 8); }).length; if(nT < bestN){ bestN = nT; bestS0 = order[i]; } } }
      if(bestS0) return bestS0;
      // nothing is wholly clear (both pins in a corner): the side that covers the least
      var area = function(b){ var t = 0; stay.filter(Boolean).forEach(function(c){ t += Math.max(0, Math.min(b[2], c[2]) - Math.max(b[0], c[0]) + 5) * Math.max(0, Math.min(b[3], c[3]) - Math.max(b[1], c[1]) + 5); }); return t; };
      var bestS = null, bestA = Infinity;
      order.forEach(function(sd){ var b = tagBox(h, txt, sd, true); if(!inside(b)) return; var a = area(b); if(a < bestA){ bestA = a; bestS = sd; } });
      return bestS || order[0];
    }
    var hk = K.handle(layer, { key: 'apprecalc-function-lab-hk', label: 'Square pin at (h, k), where the parent’s origin goes: drag it to move every point. Arrow keys move it (Shift: one unit).',
      value: encHK(S.p), chip: false,
      at: function(){ return hkAt(); },
      dir: function(){ return 0; },
      pick: function(x, y){ return pickHK(x, y); },
      keys: function(v, k, big){ return keyHK(k, big); },
      valuetext: function(){ return hkTag() + '. ' + cause.text(); },
      tag: function(){ return hkTag(); },
      tagSide: function(){ var a = hkAt(), b = abAt(); return a && b ? sideAway(hk, a, b, cueOn() ? { below: 'down', above: 'up', left: 'left', right: 'right' }[cueO.side] : null) : 'down'; },
      bounds: function(){ return tagBounds(hk); },
      onStart: function(){ grab('hk'); }, onInput: function(v){ var q = decHK(v); setP({ h: q.h, k: q.k }, 'hk', hk.dragging() ? 70 : 220); },
      onEnd: function(){ letGo(); } });
    var ab = K.handle(layer, { key: 'apprecalc-function-lab-drag', label: 'Round pin on a key point of g: up and down changes a, sideways changes b. Arrow keys move it.',
      value: encAB(S.p), chip: true, hint: 'Drag',
      at: function(){ return abAt(); },
      dir: function(){ return 0; },
      pick: function(x, y){ return pickAB(x, y); },
      keys: function(v, k, big){ return keyAB(k, big); },
      valuetext: function(){ return abTag() + '. ' + cause.text(); },
      tag: function(){ return abTag(); },
      tagSide: function(){ var a = abAt(), b = hkAt(); return a && b ? sideAway(ab, a, b) : 'up'; },
      chipSide: function(){ var s = ab.el.querySelector('.tk2-tag').className.replace(/.*is-/, '') || 'up'; return { up: 'right', down: 'right', left: 'down', right: 'down' }[s]; },
      bounds: function(){ return tagBounds(ab); },
      onStart: function(){ grab('ab'); }, onInput: function(v){ var q = decAB(v); setP({ a: q.a, b: q.b }, 'ab', ab.dragging() ? 70 : 220); },
      onEnd: function(){ letGo(); } });
    hk.el.classList.add('fl2-hk'); ab.el.classList.add('fl2-ab', 'is-wait');
    // a four way arrow on both knobs (each pin moves in two directions)
    [hk, ab].forEach(function(h){ var ar = h.el.querySelector('.tk2-ar'); ar.innerHTML = '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>'; });
    function pickHK(x, y){
      if(!G) return null;
      var c = { a: S.p.a, b: S.p.b, h: inT(G.ix(x), G.px0, G.px1), k: inT(G.iy(y), G.py0, G.py1) };
      var q = shapePt(c), dx = q[0] - c.h, dy = q[1] - c.k;
      // the round pin rides on the wire: (h, k) stops where it would leave the board
      c.h = inT(c.h, Math.max(G.px0, G.px0 - dx), Math.min(G.px1, G.px1 - dx));
      c.k = inT(c.k, Math.max(G.py0, G.py0 - dy), Math.min(G.py1, G.py1 - dy));
      return inBoard(c.h, c.k) && inBoard(c.h + dx, c.k + dy) ? encHK(c) : null;
    }
    function keyHK(k, big){
      var s = big ? 1 : 0.1, c = { a: S.p.a, b: S.p.b, h: S.p.h, k: S.p.k };
      if(k === 'ArrowRight') c.h += s; else if(k === 'ArrowLeft') c.h -= s; else if(k === 'ArrowUp') c.k += s; else if(k === 'ArrowDown') c.k -= s;
      else if(k === 'PageUp') c.k += 1; else if(k === 'PageDown') c.k -= 1; else if(k === 'Home'){ c.h = 0; c.k = 0; } else return null;
      c.h = r1(c.h); c.k = r1(c.k);
      return pinsOk(c) ? encHK(c) : encHK(S.p);
    }
    /* The round pin: its height sets a (tenths, never 0), its distance from h sets b (the rung nearest the finger;
       the far side of h is b < 0). It stops at the board's edge and never sits on the square pin. */
    function abFrom(x, y){
      var Fa = Fm(), kp = Fa.keys[Fa.shape], u0 = kp[0], v0 = kp[1], p = S.p;
      var a = r1(clamp((y - p.k) / v0, -3, 3));
      if(Math.abs(a) < 0.05) a = (y - p.k) / v0 < 0 ? -0.1 : 0.1;
      var best = null, bd = Infinity;
      BL.forEach(function(m){ [m, -m].forEach(function(b){ var px = p.h + u0 / b, dd = Math.abs(px - x); if(px >= G.px0 && px <= G.px1 && dd < bd){ bd = dd; best = b; } }); });
      return best == null ? null : { a: a, b: best };
    }
    function okAB(c){ var q = { a: c.a, b: c.b, h: S.p.h, k: S.p.k }; return pinsOk(q); }
    function pickAB(x, y){
      if(!G) return null;
      var c = abFrom(G.ix(x), clamp(G.iy(y), G.py0, G.py1));
      if(!c) return null;
      if(!okAB(c)){
        // keep a or keep b, whichever still fits; otherwise the pin stays
        var c1 = { a: S.p.a, b: c.b }, c2 = { a: c.a, b: S.p.b };
        c = okAB(c2) ? c2 : okAB(c1) ? c1 : null;
        if(!c) return null;
      }
      return encAB(Object.assign({ h: S.p.h, k: S.p.k }, c));
    }
    function keyAB(k, big){
      var Fa = Fm(), u0 = Fa.keys[Fa.shape][0], p = S.p, c = { a: p.a, b: p.b };
      if(k === 'ArrowUp' || k === 'ArrowDown' || k === 'PageUp' || k === 'PageDown'){
        // the pin moves the way of the arrow; a skips 0 (past it the wire flips)
        var st = (k === 'PageUp' || k === 'PageDown' || big ? 1 : 0.1) * (k === 'ArrowUp' || k === 'PageUp' ? 1 : -1) * (Fa.keys[Fa.shape][1] > 0 ? 1 : -1), a = r1(p.a + st);
        if(Math.abs(a) < 0.05) a = st > 0 ? 0.1 : -0.1;
        c.a = clamp(a, -3, 3);
        // a value too close to the square pin is skipped: on to the first one that fits (so the keys can flip a)
        for(var g2 = 0; g2 < 70 && !okAB(Object.assign({ h: p.h, k: p.k }, c)) && Math.abs(c.a) < 3; g2++){ var a2 = r1(c.a + (st > 0 ? 0.1 : -0.1)); if(Math.abs(a2) < 0.05) a2 = st > 0 ? 0.1 : -0.1; c.a = clamp(a2, -3, 3); }
      } else if(k === 'ArrowRight' || k === 'ArrowLeft'){
        // the pin moves the way of the arrow: the next rung that puts it further that way
        var x0 = p.h + u0 / p.b, dir = k === 'ArrowRight' ? 1 : -1, cand = [];
        BL.forEach(function(m){ [m, -m].forEach(function(b){ var px = p.h + u0 / b; if((px - x0) * dir > 1e-9 && px >= G.px0 && px <= G.px1) cand.push({ b: b, d: Math.abs(px - x0) }); }); });
        cand.sort(function(s, t){ return s.d - t.d; });
        // the next rung that fits (a rung too close to the square pin is skipped, so the keys can reach b < 0)
        var fits = cand.filter(function(x){ return okAB({ a: c.a, b: x.b, h: p.h, k: p.k }); }), pickc = fits[big ? Math.min(fits.length - 1, 4) : 0];
        if(!pickc) return encAB(p);
        c.b = pickc.b;
      } else if(k === 'Home'){ c.a = 1; c.b = 1; } else return null;
      var full = Object.assign({ h: p.h, k: p.k }, c);
      return okAB(full) ? encAB(full) : encAB(p);
    }
    function grab(who){
      if(steps.playing() || S.steps > 0 && S.steps < SMAX) stepsAbort();
      S.moving = 1; S.d0 = Object.assign({}, S.p); S.last = who; hideCue(true); tourDid(who);
      if(who === 'hk' && ab.el.classList.contains('is-wait')) wakeAB();
      kick();
    }
    function letGo(){ S.moving = 0; S.sayNext = ''; kick(); }
    function wakeAB(){ ab.el.classList.remove('is-wait'); }
    function setP(ch, who, dur){
      Object.keys(ch).forEach(function(k){ S.p[k] = Math.round(ch[k] * 1000) / 1000; });
      S.last = who; S.took = null;
      if(!S.moving && who !== 'steps'){ S.d0 = S.d0 || Object.assign({}, S.p); }
      aim(dur);
    }

    /* ---------------------------------------------------- Show the steps */
    /* From the parent f to g, each change in the order it acts: b (dilate, then reflect over the y-axis), h, a
       (dilate, then reflect over the x-axis), k. It starts with the wire gliding back onto f. */
    function phases(){
      var p = S.p, ab_ = Math.abs(p.b), aa = Math.abs(p.a), out = [{ key: 'start' }];
      if(Math.abs(ab_ - 1) > 1e-9) out.push({ key: 'b', from: { sx: 1 }, to: { sx: 1 / ab_ } });
      if(p.b < 0) out.push({ key: 'bf', from: { sx: 1 / ab_ }, to: { sx: 1 / p.b } });
      if(Math.abs(p.h) > 1e-9) out.push({ key: 'h', from: { h: 0 }, to: { h: p.h } });
      if(Math.abs(aa - 1) > 1e-9) out.push({ key: 'a', from: { sy: 1 }, to: { sy: aa } });
      if(p.a < 0) out.push({ key: 'af', from: { sy: aa }, to: { sy: p.a } });
      if(Math.abs(p.k) > 1e-9) out.push({ key: 'k', from: { k: 0 }, to: { k: p.k } });
      return out;
    }
    function stepStops(){ var n = PH.length; return PH.map(function(x, i){ return (i + 1) / n; }); }   // the last one too: step n is seen done before the takeaway
    function stepsStart(){
      if(S.mode !== 'explore') return false;
      // reduced motion: each press is the next step of the same run
      if(S.last === 'steps' && S.steps > 0 && S.steps < SMAX && PH.length) return true;
      stopAnim(); hideCue(true); tourDid('steps'); wakeAB();
      PH = phases();
      if(PH.length < 2){ cause.set([{ t: 'g = f', role: 'ink' }, { t: 'nothing to show: move a pin first', role: 'ink' }]); return false; }
      D0 = Object.assign({}, D); S.steps = 0; S.last = 'steps'; S.took = null;
      steps.reset();
      if(LS && LS.root.classList.contains('ls-phone')) try{ scene.scrollIntoView({ block: 'nearest', behavior: K.reduced() ? 'auto' : 'smooth' }); }catch(e){}
      return true;
    }
    /* v in [0, 1] over all the phases: D is set from the phase that v is in (the earlier ones done, the later ones not) */
    function stepTo(v){
      S.steps = v; var n = PH.length, f = clamp(Math.min(v, 1) * n, 0, n), i = Math.min(n - 1, Math.floor(f)), u = ease(clamp(f - i, 0, 1));
      // at a stop (a hold, or each press with reduced motion) the step just done is named, with its result
      if(f > 0.5 && Math.abs(f - Math.round(f)) < 1e-9){ i = Math.round(f) - 1; u = 1; }
      var d = { sx: 1, sy: 1, h: 0, k: 0 };
      for(var j = 1; j < n; j++){ var ph = PH[j], w = j < i ? 1 : j === i ? u : 0; Object.keys(ph.to).forEach(function(k){ if(w > 0) d[k] = lerp(ph.from[k], ph.to[k], w); }); }
      // the first phase cross fades g back onto f (nothing passes through flat, the pins never meet)
      XF = i === 0 && u < 1 ? { u: u, D0: D0 } : null;
      Object.assign(D, d);
      if(K.reduced()) fadeOnce();
      S.phase = i; S.phaseU = f - i;
      draw();
    }
    function stepsEnd(){
      S.steps = SMAX; S.phase = -1; XF = null; Object.assign(D, targetD(S.p));
      S.took = 'Every point moves the same way: (x, y) → (x/b + h, a·y + k).';
      draw(); say(S.took); refLater();
    }
    function stepsAbort(){ steps.stop(); S.steps = 0; S.phase = -1; PH = []; XF = null; aim(260); }

    /* ---------------------------------------------------- the words: the cause line, from what is drawn */
    function shiftWords(h, k, to){
      var p = [];
      // the first frame of a step: the way it is about to go
      if(to && Math.abs(h) < 0.05 && Math.abs(k) < 0.05) return 'every point starts to move ' + (Math.abs(to.h) > 1e-9 ? (to.h > 0 ? 'right' : 'left') : (to.k > 0 ? 'up' : 'down'));
      if(Math.abs(h) > 1e-9) p.push((h > 0 ? 'right ' : 'left ') + num(Math.abs(h)));
      if(Math.abs(k) > 1e-9) p.push((k > 0 ? 'up ' : 'down ') + num(Math.abs(k)));
      return p.length ? 'every point ' + p.join(', ') : 'no shift';
    }
    function dil(f, dim){ return Math.abs(Math.abs(f) - 1) < 1e-9 ? (dim === 'wide' ? 'the same width' : 'the same height') : times(f) + ' as ' + dim; }
    function aWords(a, flipWord){ var t = Math.abs(Math.abs(a) - 1) < 1e-9 ? '' : times(a) + ' as tall'; return a < 0 ? (flipWord || 'flipped upside down') + (t ? ', ' + t : '') : t || 'the same height'; }
    function bWords(b, flipWord){ var t = Math.abs(Math.abs(b) - 1) < 1e-9 ? '' : times(1 / b) + ' as wide'; return b < 0 ? (flipWord || 'flipped left to right') + (t ? ', ' + t : '') : t || 'the same width'; }
    function words(){
      var q = shownP();
      if(S.took){ cause.take(S.took); return; }
      if(S.last === 'steps' && PH.length && S.phase >= 0){
        var ph = PH[S.phase], n = PH.length - 1, pre = ph.key === 'start' ? 'First:' : 'Step ' + S.phase + ' of ' + n + ':';
        if(ph.key === 'start') cause.set([{ t: 'start from the parent f', role: 'ink' }], pre);
        else if(ph.key === 'b') cause.set([{ t: 'b = ' + bText(Math.abs(q.b)), role: 'size' }, { t: 'horizontal dilation: ' + dil(1 / q.b, 'wide'), role: 'size' }], pre);
        else if(ph.key === 'bf') cause.set([{ t: 'b = ' + bText(S.p.b), role: 'size' }, { t: 'reflected over the y-axis', role: 'size' }], pre);
        else if(ph.key === 'h') cause.set([{ t: 'h = ' + num(q.h), role: 'move' }, { t: shiftWords(q.h, 0, { h: S.p.h, k: 0 }), role: 'move' }], pre);
        else if(ph.key === 'a') cause.set([{ t: 'a = ' + num(Math.abs(q.a)), role: 'size' }, { t: 'vertical dilation: ' + dil(q.a, 'tall'), role: 'size' }], pre);
        else if(ph.key === 'af') cause.set([{ t: 'a = ' + num(S.p.a), role: 'size' }, { t: 'reflected over the x-axis', role: 'size' }], pre);
        else if(ph.key === 'k') cause.set([{ t: 'k = ' + num(q.k), role: 'move' }, { t: shiftWords(0, q.k, { h: 0, k: S.p.k }), role: 'move' }], pre);
        return;
      }
      if(S.last === 'ab'){
        var d0 = S.d0 || S.p, ca = Math.abs(d0.a - S.p.a) > 1e-9, cb = Math.abs(d0.b - S.p.b) > 1e-9;
        if(!ca && !cb){ ca = q.a == null || Math.abs(q.a - 1) > 1e-9 || !(q.b == null || Math.abs(q.b - 1) > 1e-9); cb = q.b == null || Math.abs(q.b - 1) > 1e-9; }
        var parts = [];
        if(ca) parts.push({ t: aT(q), role: 'size' }, { t: q.a == null ? 'flipping upside down' : aWords(q.a), role: 'size' });
        if(cb){ parts.push({ t: bT(q), role: 'size', join: parts.length ? '+' : null }, { t: q.b == null ? 'flipping left to right' : bWords(q.b), role: 'size' }); }
        cause.set(parts);
        return;
      }
      if(S.last === 'fam'){ cause.set([{ t: 'new parent: ' + PARENT_LAB[S.fam].replace(/^f, /, ''), role: 'ink' }, { t: 'the same a, b, h and k', role: 'ink' }]); return; }
      if(S.last === 'reset'){
        var home = q.a != null && q.b != null && Math.abs(q.a - 1) < 1e-9 && Math.abs(q.b - 1) < 1e-9 && Math.abs(q.h) < 1e-9 && Math.abs(q.k) < 1e-9;
        cause.set([{ t: aT(q) + ', ' + bT(q) + ', h = ' + num(q.h) + ', k = ' + num(q.k), role: 'ink' }, { t: home ? 'g is the parent f' : 'going back to f', role: 'ink' }]); return; }
      cause.set([{ t: 'h = ' + num(q.h) + ', k = ' + num(q.k), role: 'move' }, { t: shiftWords(q.h, q.k), role: 'move' }]);
    }

    /* ---------------------------------------------------- drawing */
    var E = {};   // the dynamic elements, made once per layout and only updated after that
    function build(){
      gD.innerHTML = ''; gL.innerHTML = '';
      E.asym = [0, 1].map(function(){ var g = sv('g', 'fl2-asym'); g.appendChild(sv('line', 'fl2-asym-s')); g.appendChild(sv('line', 'fl2-asym-l')); gD.appendChild(g); return g; });
      E.pShadow = sv('path', 'fl2-pshadow'); E.pLine = sv('path', 'fl2-parent'); E.pOld = sv('path', 'fl2-parent is-old');
      [E.pShadow, E.pOld, E.pLine].forEach(function(x){ gD.appendChild(x); });
      E.pdots = []; E.beads = []; E.arw = [];
      for(var i = 0; i < 5; i++){ var dt = sv('circle', 'fl2-pdot c' + i, { r: 4 }); E.pdots.push(dt); gD.appendChild(dt); }
      for(var j = 0; j < 5; j++){ var a = sv('g', 'fl2-arw c' + j); a.appendChild(sv('line')); a.appendChild(sv('path')); E.arw.push(a); gD.appendChild(a); }
      E.wShadow = sv('path', 'fl2-wshadow'); E.wDark = sv('path', 'fl2-wire-d'); E.wMid = sv('path', 'fl2-wire-m'); E.wHi = sv('path', 'fl2-wire-h');
      E.wOld = sv('path', 'fl2-wire-m is-old');
      [E.wShadow, E.wOld, E.wDark, E.wMid, E.wHi].forEach(function(x){ gD.appendChild(x); });
      for(var b = 0; b < 5; b++){ var g2 = sv('g', 'fl2-bead c' + b); g2.appendChild(sv('circle', 'fl2-bead-b', { r: 6 })); g2.appendChild(sv('circle', 'fl2-bead-h', { r: 1.8, cx: -1.8, cy: -1.9 })); E.beads.push(g2); gD.appendChild(g2); }
      E.pinS = [0, 1].map(function(){ var e = sv('ellipse', 'fl2-pinshadow', { rx: 15, ry: 9 }); gD.appendChild(e); return e; });
      E.lab = mkLab('fl2-lab is-g'); E.plab = mkLab('fl2-lab is-f'); E.alab = [mkLab('fl2-lab is-a'), mkLab('fl2-lab is-a')];
      E.labCache = {};
    }
    function mkLab(cls){ var g = sv('g', cls); g.appendChild(sv('line', 'fl2-lead')); g.appendChild(sv('rect', null, { rx: 8 })); g.appendChild(sv('text')); gL.appendChild(g); g._s = null; g._pos = null; return g; }
    /* a label's text: runs of [text, role] (role tints a number: the move or the size colour) */
    function setLab(g, runsT){
      var key = runsT.map(function(r){ return r[0] + '\u0001' + (r[1] || ''); }).join('\u0002');
      if(g._s === key) return;
      g._s = key;
      var t = g.querySelector('text'); t.textContent = '';
      runsT.forEach(function(r){ var s = sv('tspan', r[1] ? 'is-' + r[1] : null); s.textContent = r[0]; t.appendChild(s); });
      var w = labW(key, t);
      g._w = w + 16; g._h = G.narrow ? 22 : 24;
      var rc = g.querySelector('rect'); rc.setAttribute('width', r1(g._w)); rc.setAttribute('height', g._h); rc.setAttribute('x', r1(-g._w / 2)); rc.setAttribute('y', -g._h / 2);
      t.setAttribute('x', 0); t.setAttribute('y', 0);
    }
    /* a label's width, measured once per text with the label's own font (no layout read, the same on every frame) */
    var labCv = null;
    function labW(key, t){
      if(E.labCache[key] == null){
        if(!labCv) labCv = document.createElement('canvas').getContext('2d');
        var cs = getComputedStyle(t), w = 0;
        [].forEach.call(t.childNodes, function(sp){ labCv.font = (sp.getAttribute && sp.getAttribute('class') ? '900 ' : cs.fontWeight + ' ') + cs.fontSize + ' ' + cs.fontFamily; w += labCv.measureText(sp.textContent).width; });
        // the drawn text is the truth when the browser has it (a weight still loading would measure too narrow)
        var real = 0; try{ real = t.getComputedTextLength(); }catch(e){}
        if(real > 0) w = Math.max(w, real);
        if(!(w > 0)) return 200;
        w = w * 1.03 + 2;
        if(!document.fonts || document.fonts.status === 'loaded') E.labCache[key] = w;
        return w;
      }
      return E.labCache[key];
    }
    function gLabel(){
      // g(x) = a·f(b(x − h)) + k with the numbers that are not 1 or 0, each tinted with its pin's colour
      var q = shownP(), r = [['g(x) = ']];
      if(q.a == null) r.push(['a', 'size'], ['·']); else if(Math.abs(q.a + 1) < 1e-9) r.push(['−', 'size']); else if(Math.abs(q.a - 1) > 1e-9) r.push([num(q.a), 'size'], ['·']);
      r.push(['f(']);
      var inner = [], hh = Math.abs(q.h) > 1e-9;
      // a fraction for b goes in brackets, so (1/4)x never reads as 1/(4x)
      if(q.b == null || Math.abs(q.b - 1) > 1e-9){ var bt = q.b == null ? 'b' : Math.abs(q.b + 1) < 1e-9 ? '−' : bText(q.b); if(bt.indexOf('/') > -1) bt = bt.charAt(0) === '−' ? '−(' + bt.slice(1) + ')' : '(' + bt + ')'; inner.push([bt, 'size']); inner.push([hh ? '(' : '']); }
      inner.push(['x']);
      if(hh) inner.push([q.h > 0 ? ' − ' : ' + '], [num(Math.abs(q.h)), 'move']);
      if(Math.abs(q.b - 1) > 1e-9 && hh) inner.push([')']);
      r = r.concat(inner.filter(function(x){ return x[0]; })); r.push([')']);
      if(Math.abs(q.k) > 1e-9) r.push([q.k > 0 ? ' + ' : ' − '], [num(Math.abs(q.k)), 'move']);
      return r;
    }
    function drawStatic(){
      var g = G, o = [], W = g.W, H = g.H, sine = S.fam === 'sine', step = sine ? PI / 4 : 1;
      defs.innerHTML =
        '<linearGradient id="' + id + '-wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="fl2s-w0"/><stop offset=".5" class="fl2s-w1"/><stop offset="1" class="fl2s-w2"/></linearGradient>' +
        '<clipPath id="' + id + '-clip"><rect x="' + g.L + '" y="' + g.T + '" width="' + (g.R - g.L) + '" height="' + (g.B - g.T) + '" rx="4"/></clipPath>' +
        '<radialGradient id="' + id + '-light" cx=".35" cy=".25" r=".9"><stop offset="0" class="fl2s-l0"/><stop offset="1" class="fl2s-l1"/></radialGradient>' +
        '<pattern id="' + id + '-holes" patternUnits="userSpaceOnUse" width="' + r1(g.u * step * 1000) / 1000 + '" height="' + r1(g.u * 1000) / 1000 + '" x="' + r1(g.cx - g.u * step / 2) + '" y="' + r1(g.cy - g.u / 2) + '">' +
          '<circle class="fl2-hole-l" cx="' + (g.u * step / 2 + 0.6).toFixed(2) + '" cy="' + (g.u / 2 + 0.9).toFixed(2) + '" r="' + clamp(g.u * 0.065, 1.8, 4).toFixed(2) + '"/>' +
          '<circle class="fl2-hole" cx="' + (g.u * step / 2).toFixed(2) + '" cy="' + (g.u / 2).toFixed(2) + '" r="' + clamp(g.u * 0.065, 1.8, 4).toFixed(2) + '"/></pattern>';
      gD.setAttribute('clip-path', 'url(#' + id + '-clip)');
      o.push('<rect class="fl2-frame" x="0" y="0" width="' + W + '" height="' + H + '" rx="' + (g.narrow ? 12 : 16) + '" fill="url(#' + id + '-wood)"/>');
      o.push('<rect class="fl2-frame-hi" x="1.5" y="1.5" width="' + (W - 3) + '" height="' + (H - 3) + '" rx="' + (g.narrow ? 11 : 15) + '"/>');
      o.push('<rect class="fl2-board" x="' + g.L + '" y="' + g.T + '" width="' + (g.R - g.L) + '" height="' + (g.B - g.T) + '" rx="4"/>');
      o.push('<rect x="' + g.L + '" y="' + g.T + '" width="' + (g.R - g.L) + '" height="' + (g.B - g.T) + '" fill="url(#' + id + '-light)" rx="4"/>');
      // faint painted grid through the holes, then the holes
      var gl = [];
      for(var i = Math.ceil(g.x0 / step); i * step <= g.x1; i++){ var X0 = r1(g.sx(i * step)); gl.push('M' + X0 + ' ' + g.T + 'V' + g.B); }
      for(var j = Math.ceil(g.y0); j <= g.y1; j++){ var Y0 = r1(g.sy(j)); gl.push('M' + g.L + ' ' + Y0 + 'H' + g.R); }
      o.push('<path class="fl2-grid" d="' + gl.join('') + '"/>');
      o.push('<rect x="' + g.L + '" y="' + g.T + '" width="' + (g.R - g.L) + '" height="' + (g.B - g.T) + '" fill="url(#' + id + '-holes)"/>');
      o.push('<rect class="fl2-inset" x="' + (g.L + 0.5) + '" y="' + (g.T + 0.5) + '" width="' + (g.R - g.L - 1) + '" height="' + (g.B - g.T - 1) + '" rx="4"/>');
      // the axes, painted on the board, with their ticks and numbers
      var ax = r1(g.sy(0)), ay = r1(g.sx(0)), a = [];
      a.push('<path class="fl2-axis" d="M' + (g.L + 4) + ' ' + ax + 'H' + (g.R - 6) + 'M' + ay + ' ' + (g.B - 4) + 'V' + (g.T + 6) + '"/>');
      a.push('<path class="fl2-axhead" d="M' + (g.R - 4) + ' ' + ax + 'l-9 -4.5v9zM' + ay + ' ' + (g.T + 4) + 'l-4.5 9h9z"/>');
      var lab = g.u >= 40 ? 1 : 2, tk = [];
      E.ticks = [];
      // every number also has a spare copy on the other side of its axis (above the x-axis, right of the y-axis), shown
      // only when every number of that half axis is covered
      function tickT(x, y, s, anchor, grp, spare){
        tk.push('<text class="fl2-tick' + (spare ? ' is-spare' : '') + '" data-g="' + grp + '" x="' + r1(x) + '" y="' + r1(y) + '" text-anchor="' + anchor + '"' + (spare ? ' style="visibility:hidden"' : '') + '>' + s + '</text>');
        var xa = anchor === 'end', x2 = xa ? +ay + 7 : x, y2 = xa ? y : +ax - 8;
        tk.push('<text class="fl2-tick is-spare" data-g="' + grp + '" x="' + r1(x2) + '" y="' + r1(y2) + '" text-anchor="' + (xa ? 'start' : anchor) + '" style="visibility:hidden">' + s + '</text>');
      }
      if(sine){ for(var q2 = Math.ceil(g.x0 / (PI / 4)); q2 * PI / 4 <= g.x1; q2++){ var xx = g.sx(q2 * PI / 4); if(q2 && xx > g.L + 16 && xx < g.R - 22) tickT(xx, +ax + 16, q2 % 2 ? (q2 < 0 ? '−' : '') + (Math.abs(q2) === 1 ? '' : Math.abs(q2)) + 'π/4' : piLab(q2 * PI / 4), 'middle', q2 > 0 ? 'x+' : 'x-', q2 % 2); } }
      else for(var tx = Math.ceil(g.x0); tx <= g.x1; tx++){ var x2 = g.sx(tx); if(tx && x2 > g.L + 12 && x2 < g.R - 22) tickT(x2, +ax + 16, num(tx), 'middle', tx > 0 ? 'x+' : 'x-', tx % lab); }
      for(var ty = Math.ceil(g.y0); ty <= g.y1; ty++){ var y2 = g.sy(ty); if(ty && y2 > g.T + 22 && y2 < g.B - 10) tickT(+ay - 7, y2 + 4, num(ty), 'end', ty > 0 ? 'y+' : 'y-', ty % lab); }
      tk.push('<text class="fl2-axl" x="' + (g.R - 10) + '" y="' + (+ax - 10) + '" text-anchor="end">x</text><text class="fl2-axl" x="' + (+ay + 10) + '" y="' + (g.T + 20) + '">y</text>');
      gS.innerHTML = o.join('') + a.join('') + '<g class="fl2-ticks">' + tk.join('') + '</g>';
      E.tickBoxes = []; E.tickEls = [];
      [].forEach.call(gS.querySelectorAll('.fl2-ticks text'), function(t){ try{ var b = t.getBBox(); E.tickBoxes.push([b.x - 2, b.y - 1, b.x + b.width + 2, b.y + b.height + 1]); E.tickEls.push(t); t._spare = t.classList.contains('is-spare'); t._h = t._spare; }catch(e){} });
    }
    function piLab(v){ var k = Math.round(v / (PI / 2)); if(!k) return '0'; var neg = k < 0; k = Math.abs(k); return (neg ? '−' : '') + (k % 2 ? (k === 1 ? '' : k) + 'π/2' : (k / 2 === 1 ? '' : k / 2) + 'π'); }

    function asymOf(fam, d){
      var Fa = Fm(fam), out = [];
      if(Fa.va) out.push({ v: true, x: d.h });
      if(Fa.ha) out.push({ v: false, y: d.k });
      return out;
    }
    var boxes = [];
    function hitAny(b, list, g){ g = g || 0; for(var i = 0; i < list.length; i++){ var c = list[i]; if(!(b[2] + g <= c[0] || c[2] + g <= b[0] || b[3] + g <= c[1] || c[3] + g <= b[1])) return true; } return false; }
    function knobBox(p, r){ return [p[0] - r, p[1] - r, p[0] + r, p[1] + r]; }
    var tagFont = null, tagCv = null;
    function tagBox(h, txt, side){
      var p = h === hk ? hkAt() : abAt(); if(!p) return null;
      if(!tagFont){ var te = layer.el.querySelector('.tk2-tag'); tagFont = te ? getComputedStyle(te).font : '900 13px sans-serif'; tagCv = document.createElement('canvas').getContext('2d'); }
      tagCv.font = tagFont;
      var w = tagCv.measureText(txt).width + 20, hh = 25, x0, y0;
      if(side === 'up'){ x0 = p[0] - w / 2; y0 = p[1] - 25 - hh; } else if(side === 'down'){ x0 = p[0] - w / 2; y0 = p[1] + 26; }
      else if(side === 'left'){ x0 = p[0] - 26 - w; y0 = p[1] - hh / 2; } else { x0 = p[0] + 26; y0 = p[1] - hh / 2; }
      if(side === 'up' || side === 'down'){ x0 = clamp(x0, G.L + 2, G.R - 2 - w); x0 += tagShift(h, [x0, y0, x0 + w, y0 + hh], p); }
      return [x0, y0, x0 + w, y0 + hh];
    }
    /* a tag above or below its pin slides sideways (at most 60 px, staying on its pin) when it would cover every number
       of a half axis, so each half axis keeps one number to read */
    function tagShift(h, b, p){
      if(!E.tickEls) return 0;
      var other = knobBox(h === hk ? abAt() : hkAt(), 23);
      function bad(dx){
        var bx = [b[0] + dx, b[1], b[2] + dx, b[3]];
        if(bx[0] < G.L + 2 || bx[2] > G.R - 2 || bx[0] > p[0] - 14 || bx[2] < p[0] + 14 || hitAny(bx, [other], 5)) return true;
        var free = {}, has = {};
        E.tickEls.forEach(function(t, i){ var gp = t.getAttribute('data-g'); has[gp] = 1; if(!hitAny(E.tickBoxes[i], [bx], 8) && !hitAny(E.tickBoxes[i], [other], 8)) free[gp] = 1; });
        return Object.keys(has).some(function(gp){ return !free[gp]; });
      }
      var tries = [0, 20, -20, 40, -40, 60, -60];
      for(var i = 0; i < tries.length; i++) if(!bad(tries[i])) return tries[i];
      return 0;
    }
    function tagBounds(h){
      // the kit slides a tag to stay inside these bounds: a narrowed side moves it by the shift above
      if(!G) return null;
      var side = h.el.querySelector('.tk2-tag').className.replace(/.*is-/, '');
      if(side !== 'up' && side !== 'down') return [G.L + 2, G.T, G.R - 2, G.B];
      var b = tagBox(h, h === hk ? hkTag() : abTag(), side), p = h === hk ? hkAt() : abAt(), w = b[2] - b[0], cx = clamp(p[0] - w / 2, G.L + 2, G.R - 2 - w), dx = b[0] - cx;
      return dx > 0 ? [b[0], G.T, G.R - 2, G.B] : dx < 0 ? [G.L + 2, G.T, b[2], G.B] : [G.L + 2, G.T, G.R - 2, G.B];
    }
    function cueBox(){
      var c = cueOn() && layer.el.querySelector('.tk2-cue'); if(!c) return null;
      var r = c.getBoundingClientRect(), sr = scene.getBoundingClientRect();
      return [r.left - sr.left, r.top - sr.top, r.right - sr.left, r.bottom - sr.top];
    }
    /* place a label beside a run of points: the candidate spots in order, the last good one kept while it stays good */
    function placeLab(g, pts, prefs, avoid, keep, free, loose){
      if(!pts.length){ g.style.display = 'none'; g._pos = null; return null; }
      if(g._pos && g._pos.free === undefined && g._pos.f == null) g._pos = null;
      g.style.display = '';
      var w = g._w, h = g._h, n = pts.length, cands = [], capL = typeof free === 'number' ? free : 40;
      function anchorOf(c){ return pts[Math.round(clamp(c.f, 0, 1) * (n - 1))]; }
      /* the drawn leader: from the pill's edge to its spot on the line; at most capL long, never under a pin, a tag,
         the chip or the cue (a hidden leader names nothing) */
      function leadOk(c, ip){
        var lx = ip[0] - c.x, ly = ip[1] - c.y, ex = clamp(lx, -w / 2, w / 2), ey = clamp(ly, -h / 2, h / 2), len = Math.hypot(lx - ex, ly - ey);
        if(len > capL + 0.5) return false;
        if(loose) return true;   // the last tries: the drawn leader stops at the first pin or tag it meets
        for(var t = 0; t <= len; t += 3){ var f = len ? t / len : 0, px = c.x + ex + (lx - ex) * f, py = c.y + ey + (ly - ey) * f;
          for(var i = 0; i < (E.block || []).length; i++){ var B = E.block[i]; if(px > B[0] - 2 && px < B[2] + 2 && py > B[1] - 2 && py < B[3] + 2) return false; } }
        return true;
      }
      // beside the line at that spot: pushed out along its normal until the pill clears it
      function at(f, sd, far){
        var i = Math.round(clamp(f, 0, 1) * (n - 1)), p = pts[i], a = pts[Math.max(0, i - 3)], b = pts[Math.min(n - 1, i + 3)];
        var tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl;
        if(ny > 0 || (ny === 0 && nx < 0)){ nx = -nx; ny = -ny; }   // sd 1: above (or right of) the line
        var dd = (w / 2) * Math.abs(nx) + (h / 2) * Math.abs(ny) + 9 + (far || 0);
        return { f: f, sd: sd, far: far || 0, x: p[0] + sd * nx * dd, y: p[1] + sd * ny * dd };
      }
      [0, 26].forEach(function(far){ prefs.forEach(function(f){ [1, -1].forEach(function(sd){ cands.push(at(f, sd, far)); }); }); });   // further out (a longer leader) only when nothing nearer fits
      function ok(c, ip){
        var b = [c.x - w / 2, c.y - h / 2, c.x + w / 2, c.y + h / 2];
        if(!leadOk(c, ip || anchorOf(c))) return false;
        if(b[0] < G.L + 4 || b[2] > G.R - 4 || b[1] < G.T + 4 || b[3] > G.B - 4) return false;
        if(hitAny(b, avoid, 6)) return false;
        // never on its own wire or on the other one
        for(var i = 0; i < keep.length; i++){ var L = keep[i]; for(var j = 0; j < L.length; j += 2){ var q = L[j]; if(q[0] > b[0] - 3 && q[0] < b[2] + 3 && q[1] > b[1] - 3 && q[1] < b[3] + 3) return false; } }
        return b;
      }
      var best = null, keep0 = keep;
      // first clear of both wires; failing that, it may cross the thin parent wire (never its own)
      [keep0, keep0.slice(0, 1)].forEach(function(kp){
        if(best) return; keep = kp;
        if(g._pos && !g._pos.free){ var c0 = at(g._pos.f, g._pos.sd, g._pos.far), b0 = ok(c0); if(b0) best = { c: c0, b: b0 }; }
        for(var k = 0; !best && k < cands.length; k++){ var b1 = ok(cands[k]); if(b1) best = { c: cands[k], b: b1 }; }
      });
      // a crowded board (a phone): the free spot nearest the line, with a longer leader; kept while it stays free
      if(!best && free){
        var cap = typeof free === 'number' ? free : 40;
        keep = keep0.slice(0, 1);
        // the leader runs from the pill's edge to the nearest point of its line: at most 40 px, or it reads as a line of the graph
        // the nearest point of the line whose leader is clear (not under a pin, a tag, the chip or the cue)
        var near = function(x, y){
          var list = [];
          for(var i = 0; i < n; i += 2){ var dx = Math.max(0, Math.abs(pts[i][0] - x) - w / 2), dy = Math.max(0, Math.abs(pts[i][1] - y) - h / 2), dq = Math.hypot(dx, dy); if(dq <= cap) list.push([dq, i]); }
          list.sort(function(p1, p2){ return p1[0] - p2[0]; });
          for(var j = 0; j < list.length && j < 12; j++) if(leadOk({ x: x, y: y }, pts[list[j][1]])) return { d: list[j][0], i: list[j][1] };
          return { d: Infinity, i: 0 };
        };
        if(g._pos && g._pos.free){ var cf = { x: g._pos.x, y: g._pos.y }, nf = near(cf.x, cf.y), bf = nf.d <= cap ? ok(cf, pts[nf.i]) : null; if(bf){ cf.f = nf.i / Math.max(1, n - 1); cf.free = true; best = { c: cf, b: bf }; } }
        if(!best){
          var cand = null;
          for(var y2 = G.T + h / 2 + 6; y2 <= G.B - h / 2 - 6; y2 += 5) for(var x2 = G.L + w / 2 + 6; x2 <= G.R - w / 2 - 6; x2 += 12){
            var c2 = { x: x2, y: y2 }, nn = near(x2, y2); if(nn.d > cap || (cand && nn.d >= cand.d)) continue;
            var b2 = ok(c2, pts[nn.i]); if(b2) cand = { d: nn.d, c: { x: x2, y: y2, f: nn.i / Math.max(1, n - 1), free: true }, b: b2 };
          }
          if(cand) best = { c: cand.c, b: cand.b };
        }
      }
      if(!best){ g.style.display = 'none'; g._pos = null; return null; }
      g._pos = best.c.free ? { free: true, x: best.c.x, y: best.c.y } : { f: best.c.f, sd: best.c.sd, far: best.c.far };
      g.setAttribute('transform', 'translate(' + r1(best.c.x) + ' ' + r1(best.c.y) + ')');
      // a short leader from the pill to the spot on its line, so the label names that line and no other
      var ip = pts[Math.round(clamp(best.c.f, 0, 1) * (n - 1))], lx = ip[0] - best.c.x, ly = ip[1] - best.c.y, ex = clamp(lx, -w / 2, w / 2), ey = clamp(ly, -h / 2, h / 2), ld = g.firstChild;
      // (a loose leader stops where it would go under a pin or a tag: the pin sits on the wire, so it still points at it)
      if(loose){ var L0 = Math.hypot(lx - ex, ly - ey); for(var t = 0; t <= L0; t += 2){ var fr = L0 ? t / L0 : 0, px = best.c.x + ex + (lx - ex) * fr, py = best.c.y + ey + (ly - ey) * fr;
        if((E.block || []).some(function(B){ return px > B[0] - 3 && px < B[2] + 3 && py > B[1] - 3 && py < B[3] + 3; })){ lx = ex + (lx - ex) * Math.max(0, t - 2) / (L0 || 1); ly = ey + (ly - ey) * Math.max(0, t - 2) / (L0 || 1); break; } } }
      ld.setAttribute('x1', r1(ex)); ld.setAttribute('y1', r1(ey)); ld.setAttribute('x2', r1(lx)); ld.setAttribute('y2', r1(ly));
      return best.b;
    }
    function flat(rs){ var o = []; rs.forEach(function(r){ r.forEach(function(p){ if(p[0] > G.L - 2 && p[0] < G.R + 2 && p[1] > G.T - 2 && p[1] < G.B + 2) o.push(p); }); }); return o; }

    function draw(){
      if(!G || !E.wMid) return;
      var fam = S.fam, Fa = Fm(), d = D, mw = MORPH ? MORPH.w : 1;
      // the parent (behind), the wire g, both through the same map
      var pk = fam + '|' + lastWH; if(E.prKey !== pk){ E.pr = runs(fam, ID_D); E.prKey = pk; }
      var pr = E.pr, wr = runs(fam, d);
      var pd = pathOf(pr), wd = pathOf(wr);
      E.pLine.setAttribute('d', pd); E.pShadow.setAttribute('d', pd);
      E.wDark.setAttribute('d', wd); E.wMid.setAttribute('d', wd); E.wHi.setAttribute('d', wd); E.wShadow.setAttribute('d', wd);
      E.pLine.style.opacity = E.pShadow.style.opacity = MORPH ? mw : '';
      if(XF){ mw = XF.u; }
      [E.wDark, E.wMid, E.wHi, E.wShadow].forEach(function(x){ x.style.opacity = MORPH || XF ? mw : ''; });
      // the pins never sit on each other: in a played change (a step passing through flat, Back to f) the round pin
      // fades out while it comes within 40 px of the square pin, and back as it leaves (a drag never brings it there)
      var played = !S.moving && (XF || steps.playing() || (S.steps > 0 && S.steps < SMAX) || TW.sx || TW.sy || TW.h || TW.k);
      var hp0 = hkAt(), ap0 = abAt(), near = played && hp0 && ap0 ? clamp((Math.hypot(hp0[0] - ap0[0], hp0[1] - ap0[1]) - 30) / 10, 0, 1) : 1;
      var xo = XF ? Math.abs(1 - 2 * XF.u) : 1;
      [hk.el, E.pinS[0]].forEach(function(x){ x.style.opacity = xo < 1 ? xo.toFixed(2) : ''; });
      [ab.el, E.pinS[1]].forEach(function(x){ x.style.opacity = xo * near < 1 ? (xo * near).toFixed(2) : ''; });
      ab.knob.style.pointerEvents = xo * near < 0.3 ? 'none' : '';
      if(MORPH){ var od = pathOf(runs(MORPH.from, d)), op = MORPH.op || (MORPH.op = pathOf(runs(MORPH.from, ID_D))); E.wOld.setAttribute('d', od); E.wOld.style.opacity = 1 - mw; E.pOld.setAttribute('d', op); E.pOld.style.opacity = 1 - mw; E.wOld.style.display = E.pOld.style.display = ''; }
      else if(XF){ E.wOld.setAttribute('d', pathOf(runs(fam, XF.D0))); E.wOld.style.opacity = 1 - XF.u; E.wOld.style.display = ''; E.pOld.style.display = 'none'; }
      else { E.wOld.style.display = E.pOld.style.display = 'none'; }
      // the asymptotes: thin threads tied across the board, each named
      var as = asymOf(fam, d);
      E.asym.forEach(function(g, i){
        var a = as[i]; if(!a){ g.style.display = 'none'; return; }
        g.style.display = ''; g.style.opacity = (MORPH || XF) ? mw : '';
        var s = g.querySelector('.fl2-asym-s'), l = g.querySelector('.fl2-asym-l');
        if(a.v){ var X0 = r1(G.sx(a.x)); [s, l].forEach(function(e){ e.setAttribute('x1', X0); e.setAttribute('x2', X0); e.setAttribute('y1', G.T); e.setAttribute('y2', G.B); }); s.setAttribute('transform', 'translate(1.5 2)'); }
        else { var Y0 = r1(G.sy(a.y)); [s, l].forEach(function(e){ e.setAttribute('y1', Y0); e.setAttribute('y2', Y0); e.setAttribute('x1', G.L); e.setAttribute('x2', G.R); }); s.setAttribute('transform', 'translate(1.5 2)'); }
      });
      // beads (on g) and their parent points (on f), one colour each; arrows from each parent point to its bead
      var keys = Fa.keys, hkP = hkAt(), abP = abAt(), q = shownP();
      boxes = [knobBox(hkP, 20), knobBox(abP, 20)];
      E.beads.forEach(function(b, i){
        var kp = keys[i]; if(!kp){ b.style.display = 'none'; E.pdots[i].style.display = 'none'; E.arw[i].style.display = 'none'; return; }
        var im = imgOf(d, kp), X0 = G.sx(im[0]), Y0 = G.sy(im[1]), pX = G.sx(kp[0]), pY = G.sy(kp[1]);
        var inB = X0 > G.L + 4 && X0 < G.R - 4 && Y0 > G.T + 4 && Y0 < G.B - 4, inP = pX > G.L + 4 && pX < G.R - 4 && pY > G.T + 4 && pY < G.B - 4;
        b.style.display = inB ? '' : 'none'; b.style.opacity = (MORPH || XF) ? mw : '';
        if(inB){ b.setAttribute('transform', 'translate(' + r1(X0) + ' ' + r1(Y0) + ')'); b.classList.toggle('is-open', !!(Fa.open && Fa.open.indexOf(i) > -1)); boxes.push([X0 - 7, Y0 - 7, X0 + 7, Y0 + 7]); }
        var pdot = E.pdots[i]; pdot.style.display = inP ? '' : 'none'; pdot.style.opacity = (MORPH || XF) ? mw : '';
        if(inP){ pdot.setAttribute('cx', r1(pX)); pdot.setAttribute('cy', r1(pY)); pdot.classList.toggle('is-open', !!(Fa.open && Fa.open.indexOf(i) > -1)); boxes.push([pX - 5, pY - 5, pX + 5, pY + 5]); }
        var aw = E.arw[i], len = Math.hypot(X0 - pX, Y0 - pY);
        if(ARW > 0.01 && inB && inP && len > 24){
          aw.style.display = ''; aw.style.opacity = (0.85 * ARW * (MORPH ? mw : 1)).toFixed(2);
          var ux = (X0 - pX) / len, uy = (Y0 - pY) / len, ex = X0 - ux * 9, ey = Y0 - uy * 9, sx0 = pX + ux * 6, sy0 = pY + uy * 6;
          var ln = aw.firstChild; ln.setAttribute('x1', r1(sx0)); ln.setAttribute('y1', r1(sy0)); ln.setAttribute('x2', r1(ex)); ln.setAttribute('y2', r1(ey));
          aw.lastChild.setAttribute('d', 'M' + r1(ex + ux * 2) + ' ' + r1(ey + uy * 2) + 'l' + r1(-ux * 7 - uy * 4) + ' ' + r1(-uy * 7 + ux * 4) + 'l' + r1(uy * 8) + ' ' + r1(-ux * 8) + 'z');
        } else aw.style.display = 'none';
      });
      words();   // before the pins are placed, so their screen reader text reads this frame's cause line
      // the pins' shadows on the board
      [hkP, abP].forEach(function(p, i){ var e = E.pinS[i]; if(!p){ e.style.display = 'none'; return; } e.style.display = ''; e.setAttribute('cx', r1(p[0] + 5)); e.setAttribute('cy', r1(p[1] + 7)); });
      hk.place(); ab.place();
      // the labels: the tags first (they belong to the pins), then the cue, then the wire's formula, the parent and the threads
      var tb = [tagBox(hk, hkTag(), hk.el.querySelector('.tk2-tag').className.replace(/.*is-/, '')), tagBox(ab, abTag(), ab.el.querySelector('.tk2-tag').className.replace(/.*is-/, ''))];
      tb.forEach(function(b){ if(b) boxes.push(b); });
      var cb = cueBox(); if(cb) boxes.push(cb);
      E.block = [knobBox(hkP, 20), knobBox(abP, 20)].concat(tb.filter(Boolean)); if(cb) E.block.push(cb);
      var chip = ab.el.querySelector('.tk2-chip'), chipBx = null; if(chip && !ab.el.classList.contains('is-wait')){ var cr = chip.getBoundingClientRect(), sr = scene.getBoundingClientRect(); chipBx = [cr.left - sr.left, cr.top - sr.top, cr.right - sr.left, cr.bottom - sr.top]; boxes.push(chipBx); }
      // a number painted on the board is hidden while a pin, its tag, the chip or the cue sits on it (never half covered)
      var over = [knobBox(hkP, 23), knobBox(abP, 23)].concat(tb.filter(Boolean)); if(cb) over.push(cb);
      if(chipBx){ over.push(chipBx); E.block.push(chipBx); }
      var want = (E.tickEls || []).map(function(t, i){ return !t._spare && !hitAny(E.tickBoxes[i], over, 8); }), seen = {};
      (E.tickEls || []).forEach(function(t, i){ if(want[i]) seen[t.getAttribute('data-g')] = 1; });
      // a half axis whose numbers are all covered shows one spare (odd) number instead, so it can still be read
      (E.tickEls || []).forEach(function(t, i){ var gp = t.getAttribute('data-g'); if(t._spare && !seen[gp] && !hitAny(E.tickBoxes[i], over, 8)){ want[i] = true; seen[gp] = 1; } });
      (E.tickEls || []).forEach(function(t, i){ var hide = !want[i]; if(t._h !== hide){ t._h = hide; t.style.visibility = hide ? 'hidden' : ''; } });
      var avoid = boxes.concat(E.tickBoxes.filter(function(b, i){ return !E.tickEls[i]._h; })), wf = flat(wr), pf = flat(pr);
      // first half of the cross fade into the steps: the label still names g, so it sits on g's fading wire and fades with it
      if(XF && XF.u < 0.5) wf = flat(runs(fam, XF.D0));
      setLab(E.lab, gLabel());
      // each label: clear of everything; else (a crowded phone board) it may cover a painted number, which hides
      // under the pill; a leader of at most 40 px (70 px for the last try, a wire mostly off the board)
      var placed = [], keepNum = [], kg = {};
      // one number per half axis that no label may cover, even on a crowded board (the shown one, else a free spare)
      (E.tickEls || []).forEach(function(t, i){ var gp = t.getAttribute('data-g'); if(!kg[gp] && !t._h){ kg[gp] = 1; keepNum.push(E.tickBoxes[i]); } });
      (E.tickEls || []).forEach(function(t, i){ var gp = t.getAttribute('data-g'); if(!kg[gp] && !hitAny(E.tickBoxes[i], over, 8)){ kg[gp] = 1; keepNum.push(E.tickBoxes[i]); } });
      function place2(g, pts, prefs, keep){
        var b = placeLab(g, pts, prefs, avoid, keep, 40);
        if(!b){ [[40, 1], [40, 0], [70, 1], [70, 0], [40, 0, 1], [70, 0, 1], [140, 0, 1], [1e4, 0, 1]].forEach(function(t){ if(!b) b = placeLab(g, pts, prefs, boxes.concat(placed, t[1] ? keepNum : []), keep, t[0], t[2]); });
          if(b) (E.tickEls || []).forEach(function(t, i){ if(!t._h && hitAny(E.tickBoxes[i], [b], 8)){ t._h = true; t.style.visibility = 'hidden'; } }); }
        if(b){ avoid.push(b); placed.push(b); }
        return b;
      }
      setLab(E.lab, gLabel());
      place2(E.lab, wf, [0.88, 0.72, 0.12, 0.3, 0.6, 0.95, 0.05, 0.45, 0.8, 0.2, 0.66, 0.36], [wf, pf]);
      setLab(E.plab, [[PARENT_LAB[fam]]]);
      place2(E.plab, pf, [0.2, 0.08, 0.35, 0.8, 0.92, 0.5, 0.65, 0.28, 0.14], [pf, wf]);
      E.plab.style.opacity = MORPH ? Math.max(0.15, mw) : '';
      E.lab.style.opacity = MORPH ? Math.max(0.15, mw) : XF ? Math.abs(1 - 2 * XF.u).toFixed(2) : '';
      E.alab.forEach(function(g, i){
        var a = as[i]; if(!a){ g.style.display = 'none'; g._pos = null; return; }
        setLab(g, [['asymptote ' + (a.v ? 'x = ' + num(q.h) : 'y = ' + num(q.k))]]);
        var bb = null;
        // beside its thread, near an end of the board
        var pts = [];
        if(a.v){ for(var y = G.T + 14; y <= G.B - 14; y += 4) pts.push([G.sx(a.x), y]); }
        else { for(var x = G.L + 14; x <= G.R - 14; x += 4) pts.push([x, G.sy(a.y)]); }
        bb = place2(g, pts, [0.03, 0.97, 0.15, 0.85, 0.3, 0.7, 0.5], [wf, pf]);
        g.style.opacity = (MORPH || XF) ? mw : '';
      });
      // a half axis left with no number (under pins, tags or a label) shows a spare one where nothing covers it
      var cover = over.concat(placed), seen2 = {};
      (E.tickEls || []).forEach(function(t){ if(!t._h) seen2[t.getAttribute('data-g')] = 1; });
      (E.tickEls || []).forEach(function(t, i){ var gp = t.getAttribute('data-g'); if(!seen2[gp] && t._h && !hitAny(E.tickBoxes[i], cover, 8)){ t._h = false; t.style.visibility = ''; seen2[gp] = 1; } });
      svg.setAttribute('aria-label', 'A pegboard: the graph of ' + gLabel().map(function(r){ return r[0]; }).join('') + ' as a steel wire, with the parent ' + PARENT_LAB[fam] + ' as a gray wire behind it' + (as.length ? ' and its asymptote' + (as.length > 1 ? 's' : '') : '') + '.');
      if(cueOn()) cue.place();
    }
    var ID_D = { sx: 1, sy: 1, h: 0, k: 0 };

    /* ---------------------------------------------------- the first visit cue and "Show me how" */
    var cueO = { key: 'apprecalc-function-lab', text: 'Drag the square pin', side: 'below',
      at: function(){ var p = hkAt() || [0, 0]; return cueO.side === 'below' ? [p[0], p[1] + 2] : cueO.side === 'left' ? [p[0] - 4, p[1]] : [p[0], p[1] - 2]; } };
    var cue = K.cue(layer, cueO);
    function cueOn(){ return cue.active(); }
    function cueShow(){
      if(!G || S.used) return;
      var p = hkAt(), a = abAt();
      // on a side of the pin away from its tag and from the round pin, with room on the board
      // (the pin's tag then takes another side); never over a number, the round pin or its tag
      if(!tagCv){ tagCv = document.createElement('canvas').getContext('2d'); }
      tagCv.font = '800 ' + (G.narrow ? 14.5 : 15) + 'px ' + getComputedStyle(stage).fontFamily;
      var cw = tagCv.measureText(cueO.text).width + 56, ch = 42, gp = 30;
      var sides = [['below', [p[0] - cw / 2, p[1] + gp, p[0] + cw / 2, p[1] + gp + ch]], ['left', [p[0] - gp - cw, p[1] - ch / 2, p[0] - gp, p[1] + ch / 2]],
        ['right', [p[0] + gp, p[1] - ch / 2, p[0] + gp + cw, p[1] + ch / 2]], ['above', [p[0] - cw / 2, p[1] - gp - ch, p[0] + cw / 2, p[1] - gp]]];
      var stay = [knobBox(a, 24), tagBox(ab, abTag(), ab.el.querySelector('.tk2-tag').className.replace(/.*is-/, ''))].filter(Boolean).concat(E.tickBoxes || []);
      var good = sides.filter(function(x){ var b = x[1]; return b[0] > G.L + 4 && b[2] < G.R - 4 && b[1] > G.T + 4 && b[3] < G.B - 4 && !hitAny(b, stay, 3); });
      cueO.side = (good[0] || sides[0])[0];
      if(cue.show()) draw();
    }
    function hideCue(used){ if(used) S.used = true; if(cue.active()){ cue.hide(used); draw(); } }
    stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End)/.test(e.key)) hideCue(true); }, true);
    var tour = K.tour({ key: 'apprecalc-function-lab', label: 'Show me how', steps: [
      { id: 'hk', text: 'Drag the square pin. It is (h, k): every point of the wire moves the same way.', target: function(){ return hk.knob; } },
      { id: 'ab', text: 'Drag the round pin: up and down sets a (taller, flatter, flipped), sideways sets b (narrower, wider).', target: function(){ return ab.knob; } },
      { id: 'steps', text: 'Press Show the steps to see the changes one at a time, in the order they act.', target: function(){ return steps.el; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function tourDid(x){ if(tour.active()) tour.did(x); }
    function startTour(){ if(S.mode !== 'explore') return; hideCue(false); wakeAB(); tour.start(true); }

    /* ---------------------------------------------------- the parent picker and Back to f */
    pick.addEventListener('change', function(){
      var from = S.fam; if(pick.value === from) return;
      if(steps.playing() || (S.steps > 0 && S.steps < SMAX)) stepsAbort();
      hideCue(true);
      S.fam = pick.value; S.last = 'fam'; S.took = null;
      E.lab._pos = E.plab._pos = null;
      fit(); hk.value(encHK(S.p)); ab.value(encAB(S.p));
      if(from === 'sine' || S.fam === 'sine') drawStatic();
      if(K.reduced()){ MORPH = null; Object.assign(D, targetD(S.p)); fadeOnce(); draw(); }
      else { MORPH = { from: from, t0: now(), dur: 420, w: 0 }; aim(300); }
      S.sayNext = PARENT_LAB[S.fam] + '. '; if(K.reduced()) settled(); refLater();
    });
    reset.addEventListener('click', function(){
      if(steps.playing() || (S.steps > 0 && S.steps < SMAX)) stepsAbort();
      hideCue(true); S.d0 = Object.assign({}, S.p);
      S.p = { a: 1, b: 1, h: 0, k: 0 };
      if(!pinsOk(S.p)) fit();
      hk.value(encHK(S.p)); ab.value(encAB(S.p));
      S.last = 'reset'; S.took = null; aim(360);
      S.sayNext = ''; refLater();
    });

    /* ---------------------------------------------------- "?": the formula, the words, the table, the features */
    var ref = el('div', 'ls-sec fl2-ref'), refT = null, cache = {};
    function refLater(){ clearTimeout(refT); refT = setTimeout(refHtml, S.moving || steps.playing() ? 300 : 60); }
    function limHtml(to, L, side){ var key = to + '|' + L + '|' + side; if(!cache[key]) cache[key] = tex(FL.limTex(to, L, side)); return cache[key]; }
    function domTex(t){ if(!cache['d' + t]) cache['d' + t] = tex(t); return cache['d' + t]; }
    function pnum(v){ return S.fam === 'sine' && Math.abs(v) > 1e-9 && Math.abs(v - Math.round(v)) > 1e-9 ? piLab(v) : num(v); }
    function refHtml(){
      var p = S.p, fam = S.fam, Fa = Fm(), Sx = FL.steps(p), win = G ? [G.x0, G.x1] : [-8, 8];
      var Z = FL.zeros(fam, p, win), En = FL.ends(fam, p), vas = FL.vas(fam, p), has = FL.has(fam, p);
      var conc = fam === 'piecewise' ? '' : tex(FL.tex(fam, p, 'g'));
      var tpl = 'g(x) = a·f(b(x − h)) + k, with a = ' + num(p.a) + ', b = ' + bText(p.b) + ', h = ' + num(p.h) + ', k = ' + num(p.k);
      // no zero at all (0 outside the range) says so; "on the board" only when there are zeros off it
      var none = fam === 'sine' ? Math.abs(p.k) > Math.abs(p.a) + 1e-9 : !FL.zeros(fam, p, [-1e6, 1e6]).length;
      var zt = !Z.length ? (none ? 'none' : 'none on the board') : fam === 'sine' ? Z.length + ' on the board: ' + (Z.length > 4 ? Z.slice(0, 4).map(num).join(', ') + ', …' : Z.map(num).join(', ')) : 'x = ' + Z.map(num).join(', x = ');
      var rows = [['Zeros', esc(zt)]];
      vas.forEach(function(v){ rows.push(['Vertical asymptote', 'x = ' + num(v.x) + (v.right ? '<br>' + limHtml(v.x, v.right, '+') : '') + (v.left ? '<br>' + limHtml(v.x, v.left, '-') : '')]); });
      has.forEach(function(a){ rows.push(['Horizontal asymptote', 'y = ' + num(a.y)]); });
      var endRow = fam === 'sine' ? 'No limit at either end: g keeps oscillating between ' + num(p.k - Math.abs(p.a)) + ' and ' + num(p.k + Math.abs(p.a)) + '.'
        : [['inf', En.pos], ['-inf', En.neg]].filter(function(e){ return e[1] !== null; }).map(function(e){ return limHtml(e[0], e[1]); }).join('<br>');
      rows.push(['End behavior', endRow + (En.pos === null ? '<br><span class="bt-small">g is undefined for large x</span>' : En.neg === null ? '<br><span class="bt-small">g is undefined for very negative x</span>' : '')]);
      rows.push(['Domain', domTex(FL.domain(fam, p))]);
      rows.push(['Range', domTex(FL.range(fam, p))]);
      var words = !Sx.length ? 'g is the parent function f itself: no transformation yet.' : 'g is f after ' + (Sx.length === 1 ? Sx[0].text : Sx.slice(0, -1).map(function(x){ return x.text; }).join(', ') + ' and ' + Sx[Sx.length - 1].text) + ', in that order.';
      var h = '<p class="fl2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>' +
        '<h3 class="ls-title-l">This graph</h3><p>' + tex('f(x) = ' + Fa.tex) + '</p><p>' + esc(tpl) + '</p>' + (conc ? '<p>' + conc + '</p>' : '') +
        '<p>' + esc(words) + '</p>' +
        '<h3 class="ls-title-l">Key points: the beads</h3><p class="bt-small">Each point (x, y) of f goes to (x/b + h, a·y + k) on g. The colors match the beads on the wire.</p>' +
        '<table class="ls-tbl fl2-tbl"><caption class="sr-only">Key points of f and where they go on g</caption><thead><tr><th scope="col"><span class="sr-only">Color</span></th><th scope="col">on f</th><th scope="col">on g</th></tr></thead><tbody>' +
        Fa.keys.map(function(kp, i){ var q = FL.image(p, kp), open = Fa.open && Fa.open.indexOf(i) > -1;
          return '<tr><td><i class="fl2-sw c' + i + (i === Fa.shape ? ' is-pin' : '') + '"></i>' + (i === Fa.shape ? '<span class="bt-small"> round pin</span>' : '') + '</td><td>(' + pnum(kp[0]) + ', ' + pnum(kp[1]) + ')' + (open ? ' <span class="bt-small">open</span>' : '') + '</td><td>(' + num(q[0]) + ', ' + num(q[1]) + ')</td></tr>'; }).join('') + '</tbody></table>' +
        '<h3 class="ls-title-l">Features of g</h3><dl class="fl-feats">' + rows.map(function(r){ return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>' +
        '<h3 class="ls-title-l">Inside and outside</h3><p>' + html('Inside $f(\\ldots)$ the changes act on the input, so they read "backwards": $x - 3$ moves the graph 3 right, and $2x$ makes it half as wide. Outside, they act on the output as written: $a$ multiplies every height, then $k$ is added.') + '</p>' +
        '<p>' + html('Order matters. Factor $b$ out first, so the inside reads $b(x - h)$. The input is dilated by a factor of $\\frac{1}{|b|}$ (and reflected over the $y$-axis if $b < 0$), then translated by $h$; the output is dilated by a factor of $|a|$ (and reflected over the $x$-axis if $a < 0$), then translated by $k$. Show the steps plays them in this order.') + '</p>' +
        '<p class="bt-small">The pins: the square pin is (h, k), where the parent’s origin (0, 0) goes. The round pin holds one key point: its height sets a (never 0: past 0 the wire flips), its distance from h sets b; on the far side of h, b is negative. Both pins stay on the board and never sit on each other.</p>' +
        '<details class="tt-keys"><summary>Keyboard</summary><p class="bt-small">Tab to the square pin: arrow keys move h and k by 0.1 (Shift: by 1), Home puts it at (0, 0). Tab to the round pin: ↑ ↓ change a by 0.1 (Shift: by 1), ← → move it sideways to the next value of b, Home sets a = 1 and b = 1.</p></details>' +
        '<p class="tool-about-n">Notes for this topic: <a href="../notes/transformations.html">Transformations of functions</a></p>';
      ref.innerHTML = h;
    }
    ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(LS) LS.close(); setTimeout(startTour, 60); });

    /* ---------------------------------------------------- layout */
    var lastWH = '';
    function layout(){
      if(stage.hidden || !stage.isConnected) return;
      var r = scene.getBoundingClientRect(), W = Math.round(r.width), H = Math.round(r.height);
      if(W < 200 || H < 200) return;
      [svgB, svg].forEach(function(e){ e.setAttribute('viewBox', '0 0 ' + W + ' ' + H); e.setAttribute('width', W); e.setAttribute('height', H); });
      G = geo(W, H); lastWH = W + 'x' + H;
      if(fit()){ hk.value(encHK(S.p)); ab.value(encAB(S.p)); Object.assign(D, targetD(S.p)); }
      E.lab && (E.lab._pos = E.plab._pos = null);
      build(); drawStatic(); draw();
    }
    if(window.ResizeObserver){ new ResizeObserver(function(){ var r = scene.getBoundingClientRect(); if(Math.round(r.width) + 'x' + Math.round(r.height) === lastWH) return; layout(); }).observe(scene); }
    else window.addEventListener('resize', layout);

    function boot(){
      S.ready = true;
      head.purpose('Every point of f moves by the same rule.');
      Object.assign(D, targetD(S.p));
      refHtml(); layout();
      setTimeout(function(){ layout(); if(S.mode === 'explore' && !tour.active()) cueShow(); }, 60);
      // labels and numbers are measured with the page's font: measure again once the web fonts have loaded
      // (a weight is fetched the first time it is used, so every font that finishes loading triggers a new measure)
      try{ if(document.fonts){ var refit = function(){ lastWH = ''; if(E.lab) E.lab._pos = E.plab._pos = null; tagFont = null; layout(); };
        if(document.fonts.ready) document.fonts.ready.then(refit);
        if(document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', refit); } }catch(e){}
    }
    function shown(m){
      S.mode = m;
      if(m !== 'explore'){ if(steps.playing()) stepsAbort(); stopAnim(); tour.stop(); if(cue.active()) cue.hide(false); S.moving = 0; return; }
      setTimeout(function(){ layout(); if(!tour.active()) cueShow(); }, 40);
    }
    return {
      kit2: function(pane, s){ LS = s; boot(); return { stage: stage, ref: ref }; },
      plain: function(){ host.appendChild(stage); host.appendChild(ref); boot(); },
      shown: shown, redraw: function(){ layout(); },
      // for the sweep and the browser checks only: window.ApPrecalcFunctionLab is set only when a test sets
      // window.LevlToolTest before the page loads (never in production)
      _t: { S: S, D: D, E: E, PD: function(){ return PD(); }, G: function(){ return G; }, hk: hk, ab: ab, steps: steps, cause: cause, FL: FL, shownP: shownP, BL: BL,
        set: function(p, fam){ if(fam && fam !== S.fam){ pick.value = fam; pick.dispatchEvent(new Event('change')); stopAnim(); } ['a', 'b', 'h', 'k'].forEach(function(k){ if(p[k] != null) S.p[k] = p[k]; }); fit(); hk.value(encHK(S.p)); ab.value(encAB(S.p)); S.last = p.last || 'hk'; S.d0 = null; S.took = null; stopAnim(); Object.assign(D, targetD(S.p)); draw(); refHtml(); },
        busy: function(){ return !!raf; }, pinsOk: pinsOk, encAB: encAB, encHK: encHK }
    };
  }

  /* ============================================================ test yourself */
  function figSize(w, h){
    var W = window.innerWidth || 1280, Hh = window.innerHeight || 800;
    if(W <= 640) return [340, Math.round(Math.max(260, Math.min(420, Hh * 0.62 - 90)))];
    if(W <= 999 && Hh <= 540) return [440, Math.round(Math.max(220, Math.min(300, Hh - 110)))];
    return [w, h];
  }
  function gFn(fam, p){ return function(x){ return FL.g(fam, p, x); }; }
  function figSpec(pr){
    var f = pr.fig, sz = figSize(560, 400), spec;
    if(f.grid){
      var xs = [f.from[0], f.to[0], 0], ys = [f.from[1], f.to[1], 0];
      var x0 = Math.min.apply(null, xs) - 2, x1 = Math.max.apply(null, xs) + 2, y0 = Math.min.apply(null, ys) - 2, y1 = Math.max.apply(null, ys) + 2;
      spec = { label: f.label, width: sz[0], height: sz[1], x: [Math.floor(x0), Math.ceil(x1)], y: [Math.floor(y0), Math.ceil(y1)], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
        points: [{ at: f.from, cls: 's1', label: 'on f (' + FL.n(f.from[0]) + ', ' + FL.n(f.from[1]) + ')' }] };
      return spec;
    }
    var p = f.p, c = [p.h, p.k], xr = [c[0] - 5, c[0] + 5], yr = [c[1] - 4, c[1] + 4];
    if(f.pts){ xr = [c[0] - 3, c[0] + 3]; yr = [c[1] - 3, c[1] + 3]; f.pts.forEach(function(q){ xr[0] = Math.min(xr[0], q[0] - 2); xr[1] = Math.max(xr[1], q[0] + 2); yr[0] = Math.min(yr[0], q[1] - 2); yr[1] = Math.max(yr[1], q[1] + 2); }); }
    xr = [Math.min(xr[0], -1), Math.max(xr[1], 1)]; yr = [Math.min(yr[0], -1), Math.max(yr[1], 1)];
    spec = { label: f.label, width: sz[0], height: sz[1], x: xr, y: yr, xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y', curves: [], points: [] };
    if(f.parentOnly){ spec.x = [-6, 6]; spec.y = [-6, 6]; spec.curves.push({ fn: gFn(f.fam, ID), cls: 's5', label: 'f' }); }
    else if(f.show){
      spec.curves.push({ fn: gFn(f.fam, p), cls: 's1', label: 'g', domain: f.fam === 'sqrt' ? [p.h, xr[1]] : null, ends: f.fam === 'sqrt' ? ['closed', null] : null });
      (f.pts || []).forEach(function(q){ spec.points.push({ at: q, cls: 's1', label: '(' + FL.n(q[0]) + ', ' + FL.n(q[1]) + ')' }); });
    }
    return spec;
  }
  var METHOD = {
    h: 'Find the corner (the vertex, or where the graph starts). Its x-coordinate is h: x − h is 0 there.',
    k: 'The corner\'s y-coordinate is k: + k lifts every output by k.',
    a: 'From the corner, go to the other point. Divide the change in height by how much the parent changes over the same run.',
    g: 'Put a, h and k into a·f(x − h) + k. Watch the sign inside: h = −2 gives x + 2.',
    x: 'Solve b(x − h) = (the old x) for x: divide by b, then add h.',
    y: 'The output is multiplied by a, then k is added.',
    in: 'Factor b out of the inside first, so it reads b(x − h). Then the dilation factor is 1/|b| and the shift is h.',
    out: 'Outside f, a multiplies the outputs (a < 0 also reflects over the x-axis), then k is added.',
    va: 'Where is the denominator 0 (and the numerator not)?',
    ha: 'As x grows, what does the fraction (or the power) go to? Add the constant.',
    right: 'Test a number a little bigger than the asymptote: the sign of the denominator and of the numerator give the sign.',
    end: 'Write end behavior in limit notation: lim as x → ∞ of g(x) = the value.',
    neg: 'For very negative x, 2^(x − h) is a tiny positive number.',
    zero: 'Set g(x) = 0, isolate the power of 2, then write both sides as powers of 2.'
  };
  function quiz(host, data){
    var fig = null, prob = null;
    T.drill(host, data, { slug: 'function-lab', noun: 'drill',
      types: FL.KINDS.map(function(k){ return { value: k, label: FL.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: FL.generate, title: function(p){ return p.title; },
      extra: function(el, p){
        prob = p;
        var box = document.createElement('div'); el.appendChild(box);
        fig = T.markedFigure(box, function(){ return figSpec(p); }, 'fl-figwrap');
      },
      method: function(s){ return METHOD[s.key]; },
      onTry: function(s, t){
        var p = prob, v = p.values;
        if(!fig) return false;
        if(p.type === 'pointMap'){ return T.tryOn(function(){ return fig; }, { x: { x: 1 }, pt: { y: v.to[0] } })(s, t); }
        if(p.type === 'identify'){
          if(s.key === 'g') return T.tryOn(function(){ return fig; }, { curve: { g: 1 } })(s, t);
          return T.tryOn(function(){ return fig; }, { x: { h: 1 }, y: { k: 1 } })(s, t);
        }
        if(p.type === 'describe'){
          var opt = t.ok || t.shown ? 0 : t.pick, picks = v.picks[s.key];
          if(opt == null || !picks) return false;
          // the option's parameters, drawn: inside options are whole (a = 1, k = 0);
          // outside ones keep the right inside part
          var mk = function(q, who){
            var full = s.key === 'in' ? q : { a: q.a, b: v.p.b * (q.b === -1 ? -1 : 1), h: v.p.h, k: q.k };
            return { curve: gFn(v.fam, full), who: who, label: who === 'yours' ? 'yours' : 'right' };
          };
          var marks = [];
          if(!t.ok && !t.shown) marks.push(mk(picks[opt], 'yours'));
          else { if(fig.lastD && fig.lastD[s.key]) marks.push(fig.lastD[s.key]); marks.push(mk(picks[0], 'right')); }
          if(!t.ok && !t.shown){ fig.lastD = fig.lastD || {}; fig.lastD[s.key] = marks[0]; }
          fig.marks.set(s.key, marks); fig.redraw();
          return true;
        }
        if(p.type === 'rational' || p.type === 'exponential'){
          var o = { x: { va: 1 }, y: { ha: 1 } };
          if(s.kind === 'num' && (s.key === 'zero')) o = { x: { zero: 1 } };
          var drew = T.tryOn(function(){ return fig; }, o)(s, t);
          if(s.kind === 'choice' && (t.ok || t.shown)){
            fig.marks.set(s.key, [{ curve: gFn(p.type === 'rational' ? 'reciprocal' : 'exponential', v.p), who: 'right', label: 'g' }]);
            fig.redraw(); return 'The graph of g is drawn: check your answer against it.';
          }
          return drew;
        }
        return false;
      } });
  }

  function boot(){
    T.mount('function-lab', function(app, data){
      var ex = null, kit = !!(window.LevlKit2 && window.LevlStudio && app.getAttribute('data-studio'));
      var md = T.modes(app, { slug: 'function-lab',
        explore: function(host){ ex = explore(host, data); if(window.LevlToolTest) window.ApPrecalcFunctionLab = ex._t; },
        quiz: function(host){ quiz(host, data); },
        onShow: function(m){
          if(ex) ex.shown(m);
          // a pane that was hidden has no size: draw it again once it shows
          setTimeout(function(){ if(m === 'explore' && ex) ex.redraw(); }, 30);
        },
        studio: kit ? { kit2: function(pane, s){ return ex.kit2(pane, s); } } : {} });
      // Without the frame (no Tool Studio, or no kit) the stage still works on its own, above Test yourself.
      if(!kit || !T.studioOf(app)) ex.plain();
      return md;
    });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApPrecalcBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; sc.onerror = boot; document.head.appendChild(sc);
  }
})();
