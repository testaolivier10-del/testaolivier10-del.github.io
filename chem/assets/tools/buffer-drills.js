/* Buffers, tools v2 (docs/tools-v2-chem-buffers-brief.md; the standard: docs/tools-v2-standard.md). On the shared kit
   (assets/course/tool-kit2.js) through the course adapter ApChemTools.studioKit2 (chem-tools.js), like ICE tables.

   THE ONE IDEA: a buffer soaks up added acid or base because its weak acid and conjugate base trade places; plain water
   cannot. A buffer holds its pH until one of its two forms runs out.
   EXPLORE: two beakers side by side on a lab bench, 100 mL each: a buffer (CH₃COOH and CH₃COO⁻, or NH₄⁺ and NH₃, drawn
   as molecules with their atoms) and plain water. Above them a rack of droppers, 1.0 M HCl and 1.0 M NaOH over each
   beaker. The main control: tap a dropper. One squeeze (1.0 mL, 1.0 mmol, one particle) falls into EACH beaker. In the
   buffer the drop's ion meets the form that takes it, and an H⁺ moves across where they meet (OH⁻ takes the H from
   CH₃COOH, which becomes CH₃COO⁻, and leaves as water; H₃O⁺ gives its H to CH₃COO⁻). In the water nothing takes it, so
   the ion stays. A pH meter in each beaker reads the drawn solution. When one form runs out the next drop stays in the
   buffer too, and its meter jumps (the header says "used up").
   Every number shown (the meters, their pointers, the counts under them, the cause line, the liquid level) comes from
   what is DRAWN at that frame. A drop's ion counts once it is mixed: in water when its drop has faded into the liquid,
   in the buffer when its H has passed halfway to its partner (the reaction is the mixing). The meter reads
   ApChemMath.bufferMeter: Henderson-Hasselbalch while both forms are there in a ratio from 1 : 10 to 10 : 1, the exact
   pH (charge balance with water, the added volume included) everywhere else. Reduced motion: a short cross fade.
   TEST YOURSELF: the drill, unchanged (T.drill: pH of a buffer, ratio for a target pH, adding strong acid or base,
   capacity, over all six buffers; ids "buffer-drills:<context>:<step>", ?seed= and #quiz open it), with its beaker. */
(function(){
  'use strict';
  var SLUG = 'buffer-drills';
  var T = window.ApChemTools;
  if(!T) return;
  var TITLE = { ph: 'pH of a buffer', ratio: 'The ratio for a target pH', add: 'Adding strong acid or base', capacity: 'Buffer capacity' };
  var NS = 'http://www.w3.org/2000/svg';
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function ease(t){ t = clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function f1(v){ return (+v).toFixed(1); }
  function rot(dx, dy, a){ var c = Math.cos(a), s = Math.sin(a); return [dx * c - dy * s, dx * s + dy * c]; }
  function mk(tag, cls, attrs){ var e = document.createElementNS(NS, tag); if(cls) e.setAttribute('class', cls); for(var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  // a subscript digit in a formula, drawn as a lowered smaller tspan (CH₃ -> CH<tspan>3</tspan>); a charge stays as it is
  var SUBD = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  function svgChem(t){
    return esc(t).replace(/[₀-₉]+/g, function(m){ return '<tspan class="bx2-sub" dy="0.26em">' + m.split('').map(function(c){ return SUBD[c]; }).join('') + '</tspan><tspan dy="-0.26em">​</tspan>'; });
  }
  function plain(h){ return String(h).replace(/<[^>]+>/g, ''); }

  /* ---------------------------------------------------- the molecules, atom by atom (our own drawings) */
  /* Space filling, flat projections; z orders atoms back to front. A protonated form is its base form plus the H that
     moves (hx), at the same place, so an H⁺ passing over is the only change. */
  var AR = { H: 5.5, C: 8.5, O: 8, N: 8.5 };
  function at(el, dx, dy, z){ return { el: el, dx: dx, dy: dy, r: AR[el], z: z || 0 }; }
  var BASEF = {
    'CH3COO-': [at('H', -12, -10.5, -1), at('C', -12, 0), at('H', -21, -5), at('H', -20, 8), at('O', 9, -11), at('O', 10, 10), at('C', 2, 0, 1)],
    'OH-': [at('O', 0, 0), at('H', -9, 8)],
    'NH3': [at('H', 0, -12, -1), at('N', 0, 0), at('H', -11, 5), at('H', 11, 5)]
  };
  var PROT = { 'CH3COOH': ['CH3COO-', 18, 16], 'H2O': ['OH-', 9, 8], 'H3O+': ['H2O', 0, -12], 'NH4+': ['NH3', 0, 12] };
  var BASEOF = {}, PROTOF = {};
  Object.keys(PROT).forEach(function(k){ BASEOF[k] = PROT[k][0]; PROTOF[PROT[k][0]] = k; });
  var TPL = {}, HX = {};
  function build(key){
    if(TPL[key]) return TPL[key];
    if(BASEF[key]) TPL[key] = BASEF[key].map(function(a){ return Object.assign({}, a); });
    else { var b = build(PROT[key][0]); TPL[key] = b.map(function(a){ return Object.assign({}, a); }).concat([at('H', PROT[key][1], PROT[key][2], 2)]); HX[key] = TPL[key].length - 1; }
    return TPL[key];
  }
  ['CH3COOH', 'H3O+', 'NH4+'].forEach(build);
  // each family centred on its largest form's box (the base form keeps the same coordinates, so nothing jumps)
  [['CH3COOH', 'CH3COO-'], ['H3O+', 'H2O', 'OH-'], ['NH4+', 'NH3']].forEach(function(fam){
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    TPL[fam[0]].forEach(function(a){ x0 = Math.min(x0, a.dx - a.r); x1 = Math.max(x1, a.dx + a.r); y0 = Math.min(y0, a.dy - a.r); y1 = Math.max(y1, a.dy + a.r); });
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    fam.forEach(function(k){ TPL[k].forEach(function(a){ a.dx -= cx; a.dy -= cy; }); });
  });
  // draw order: back to front
  var ORDER = {};
  Object.keys(TPL).forEach(function(k){ ORDER[k] = TPL[k].map(function(a, i){ return i; }).sort(function(p, q){ return (TPL[k][p].z - TPL[k][q].z) || (TPL[k][q].r - TPL[k][p].r); }); });
  function radiusOf(key){ return Math.max.apply(null, TPL[key].map(function(a){ return Math.hypot(a.dx, a.dy) + a.r; })); }
  // the box a molecule takes at rest, turned by up to `tilt` (as ICE tables' extent)
  var TILT = 0.3;
  function extent(key, tilt){
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, c = Math.cos(tilt), sn = Math.abs(Math.sin(tilt));
    TPL[key].forEach(function(a){ x0 = Math.min(x0, a.dx - a.r); x1 = Math.max(x1, a.dx + a.r); y0 = Math.min(y0, a.dy - a.r); y1 = Math.max(y1, a.dy + a.r); });
    var xw = 2 * Math.max(x1, -x0), yh = 2 * Math.max(y1, -y0);
    return { w: xw * c + yh * sn, h: yh * c + xw * sn };
  }
  // the H that moves, and where an acceptor takes it (its protonated form's hx)
  function hxVec(key){ var a = TPL[key][HX[key]]; return [a.dx, a.dy]; }
  /* The charge of an ion, a small sign on it: a minus where the H⁺ would join (CH₃COO⁻, OH⁻), a plus at the upper right
     (NH₄⁺, H₃O⁺). It belongs to the particle's counted identity, so it changes at the same moment as the counts. */
  var QPOS = {};
  ['CH3COO-', 'OH-'].forEach(function(k){ var p = TPL[PROTOF[k]][HX[PROTOF[k]]]; QPOS[k] = { q: -1, x: p.dx, y: p.dy }; });
  ['NH4+', 'H3O+'].forEach(function(k){ var x1 = -Infinity, y0 = Infinity; TPL[k].forEach(function(a){ x1 = Math.max(x1, a.dx + a.r); y0 = Math.min(y0, a.dy - a.r); }); QPOS[k] = { q: 1, x: x1 - 3, y: y0 + 3 }; });
  var CHG = { 'CH3COO-': 'CH₃COO⁻', 'CH3COOH': 'CH₃COOH', 'OH-': 'OH⁻', 'H2O': 'H₂O', 'H3O+': 'H₃O⁺', 'NH3': 'NH₃', 'NH4+': 'NH₄⁺' };

  /* ---------------------------------------------------- the drill's helpers (Test yourself, unchanged) */
  function names(ctx){
    var b = !!ctx.base, a = ctx.acid || {}, B = ctx.base || {};
    return { isBase: b, HA: b ? B.BH : a.HA, A: b ? B.B : a.A, name: b ? B.name : a.name, Ka: b ? 1e-14 / B.Kb : a.Ka };
  }
  function species(n){
    return n.isBase
      ? [{ key: 'HA', label: 'BH⁺', name: n.HA + ' (BH⁺)', tone: 2 }, { key: 'A', label: 'B', name: n.A + ' (B)', tone: 3 }]
      : [{ key: 'HA', label: 'HA', mol: 'HA', name: n.HA + ' (HA)' }, { key: 'A', label: 'A⁻', mol: 'A-', name: n.A + ' (A⁻)' }];
  }

  function boot(){
    var K = window.LevlKit2, M = window.ApChemMath;
    T.mount(SLUG, function(app, data, ctx){
      var EX = data.explore, BUF = EX.buffers;
      var S = { bi: 0, n: EX.amounts[0], mode: 'explore' };
      var G = null;
      function BF(){ return BUF[S.bi]; }
      function KaOf(b){ return b.Ka || M.C.Kw / b.Kb; }
      function pKaOf(b){ return -Math.log10(KaOf(b)); }
      function lim(){ return S.n + EX.extra; }

      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'bx2';
      var top = document.createElement('div'); top.className = 'bx2-top';
      var tabs = K.tabs({ label: 'Buffer', value: BUF[0].id, items: BUF.map(function(b){ return { value: b.id, label: b.tab, short: b.short }; }),
        onChange: function(v){ hideCue(true); pickBuffer(v); } });
      top.appendChild(tabs.el);
      // the amount of each form: a quiet setting beside the tabs (capacity: the same ratio, twice the particles)
      var amt = document.createElement('div'); amt.className = 'bx2-amt'; amt.setAttribute('role', 'group'); amt.setAttribute('aria-label', 'Amount of each form');
      amt.innerHTML = '<span class="bx2-amt-l" aria-hidden="true">Each form</span>' + EX.amounts.map(function(n){ return '<button type="button" class="bx2-amt-b" data-n="' + n + '" aria-pressed="' + (n === S.n) + '" aria-label="' + n + ' millimoles of each form">' + n + ' mmol</button>'; }).join('');
      amt.addEventListener('click', function(e){ var b = e.target.closest('.bx2-amt-b'); if(!b) return; hideCue(true); pickAmount(+b.getAttribute('data-n')); });
      top.appendChild(amt);
      stage.appendChild(top);
      var head = K.head({ purpose: 'See why a buffer holds its pH and water does not.', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'bx2-scene'; sceneBox.id = T.nid('bx2');
      // three layers: the still scene behind (the lab, the droppers, the probes, the meters), the moving parts on a
      // canvas (the liquid, the molecules, the drops, the glow of a reaction), and the glass in front of them
      sceneBox.innerHTML = '<svg class="bx2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"></svg><canvas class="bx2-mov" aria-hidden="true"></canvas><svg class="bx2-front" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"></svg>';
      stage.appendChild(sceneBox);
      tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', sceneBox.id); });
      var svg = sceneBox.querySelector('svg'), mov = sceneBox.querySelector('.bx2-mov'), front = sceneBox.querySelector('.bx2-front'), layer = K.layer(sceneBox);
      var lines = document.createElement('div'); lines.className = 'bx2-lines';
      var cause = K.cause({ label: 'Why' });
      var again = document.createElement('button'); again.type = 'button'; again.className = 'tk2-btn bx2-again'; again.textContent = 'Start over'; again.hidden = true;
      again.addEventListener('click', function(){ hideCue(true); startOver(); });
      lines.appendChild(cause.el); lines.appendChild(again);
      stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      var sayT = 0;
      function say(t){ clearTimeout(sayT); sayT = setTimeout(function(){ live.textContent = t; }, 350); }

      /* ---------------------------------------------------- measuring text */
      var MC = null;
      function measure(t, fs, wt){
        if(!MC) MC = document.createElement('canvas').getContext('2d');
        var cs = getComputedStyle(stage), fam = cs.getPropertyValue('--font-ui') || cs.fontFamily;
        MC.font = (wt || 700) + ' ' + fs + 'px ' + fam;
        return MC.measureText(plain(t).replace(/​/g, '')).width;
      }

      /* ---------------------------------------------------- geometry */
      /* Sized from the height there is (as ICE tables): the droppers, both beakers, both meters and the cause line are on
         screen together. Wide (860 px and up): each beaker with its meter standing beside it and its counts above the
         meter. Narrower: the meter and the counts on the bench under each beaker. The beakers are always the largest
         things on the picture, and they never change size between the buffers or the amounts. */
      // the lines under the picture take a fixed reserve (two rows of the cause line and Start over), never their
      // measured height, so the beakers keep one size whatever the cause line says
      function availH(phone){
        var lh = phone ? 122 : sceneBox.getBoundingClientRect().width < 860 ? 124 : 52, sc = sceneBox.getBoundingClientRect();
        if(phone) return Math.max(440, window.innerHeight - lh - 22);
        return clamp(window.innerHeight - (sc.top + window.scrollY) - lh - (sc.width < 860 ? 28 : 36), 440, 1200);
      }
      var RMAX = Math.max.apply(null, ['CH3COOH', 'CH3COO-', 'NH4+', 'NH3', 'OH-', 'H3O+'].map(radiusOf));
      function keyLines(b, kind){ return kind === 'buf' ? [b.HA.html + ' 20', b.A.html + ' 20', 'H₃O⁺ 13'] : ['H₃O⁺ 13', 'OH⁻ 13']; }
      function geo(W){
        var g = { W: W, narrow: W < 860, phone: W <= 640 }, H = availH(g.phone);
        // a line with a subscript (shown at 0.86 of its size) stays at 13 px or more, so no text renders under 11 px
        var f = g.narrow ? { lab: 12.5, head: 12.5, key: 13, tick: 11, pka: 13, ph: 11 } : { lab: 14, head: 14, key: 13.5, tick: 11.5, pka: 13.5, ph: 12 };
        g.f = f;
        g.keyLH = Math.round(f.key * 1.85 + 4);
        var keyW = 0;
        BUF.forEach(function(b){ keyLines(b, 'buf').concat(keyLines(b, 'wat')).forEach(function(t){ keyW = Math.max(keyW, measure(t, f.key, 800)); }); });
        g.iconW = Math.round(g.keyLH * 1.5);
        g.keyW = Math.ceil(g.iconW + 6 + keyW);
        var headW = Math.max(measure('Buffer used up', f.head, 900), measure('Water', f.head, 900));
        // the droppers' labels on the wall
        g.labH = Math.round(f.lab * 1.55);
        var labW = Math.max(measure('HCl', f.lab, 900), measure('NaOH', f.lab, 900)) + 14;
        g.labW = Math.ceil(labW);
        var top0 = 8, bw, bh, mw;
        function vert(bw){
          var v = {};
          v.labY = top0; v.bulbTop = top0 + g.labH + 5; v.bulbH = Math.round(Math.max(20, 0.15 * bw)); v.tubeTop = v.bulbTop + v.bulbH;
          v.tubeL = Math.round(Math.max(30, 0.22 * bw)); v.tipY = v.tubeTop + v.tubeL; v.rimY = v.tipY + Math.round(Math.max(12, 0.05 * bw));
          return v;
        }
        function meterH(mw){
          var dh = Math.round(clamp(mw * 0.3, 34, 60));
          return { dh: dh, h: Math.round(f.head * 1.3 + 8 + dh + 14 + 8 + 4 + f.tick * 1.35 + 6) };
        }
        if(!g.narrow){
          mw = Math.round(clamp(W * 0.12, Math.max(150, headW + 24, g.keyW), 220));
          var mh0 = meterH(mw).h, v0 = vert(300);
          // height: the dropper rack, the beaker (1.12 of its width), the bench
          bw = (H - (v0.rimY - 0.27 * 300) - 40) / (0.27 + 1.12);
          bw = Math.min(bw, (W - 2 * (mw + 34) - 3 * 36) / 2, 420);
          bw = Math.round(Math.max(150, bw));
          bh = Math.round(1.12 * bw);
          // the counts and the meter beside the beaker must fit its height
          bh = Math.max(bh, mh0 + 10 + 3 * g.keyLH + 16);
          g.mw = mw;
        } else {
          var m0 = g.phone ? 8 : 16, cw = (W - 3 * m0) / 2;
          bw = Math.round(Math.min(cw - 14, g.phone ? 230 : 290));
          mw = Math.round(Math.min(cw - 4, Math.max(bw + 10, g.keyW + 8)));
          g.mw = mw;
          var bench = 10 + meterH(mw).h + 10 + 3 * g.keyLH + 8;
          // a tablet: the beakers from the height as well, so the droppers, the meters and the cause line fit together
          if(!g.phone) while(bw > 160 && vert(bw).rimY + 1.15 * bw + bench > H) bw--;
          var v1 = vert(bw);
          bh = Math.round(clamp(H - v1.rimY - bench, 1.15 * bw, (g.phone ? 1.9 : 1.5) * bw));
        }
        g.bw = bw; g.bh = bh;
        var v = vert(bw); Object.assign(g, v);
        g.yb = g.rimY + bh;
        var MH = meterH(g.mw); g.dh = MH.dh; g.mh = MH.h;
        g.cols = [];
        var colW, m;
        if(!g.narrow){
          colW = bw + 34 + g.mw; m = (W - 2 * colW) / 3;
          for(var i = 0; i < 2; i++){ var x0 = m + i * (colW + m); g.cols.push({ cx: Math.round(x0 + bw / 2), mx: Math.round(x0 + bw + 34) }); }
          g.H = g.yb + 34;
        } else {
          var m1 = g.phone ? 8 : 16, cw2 = (W - 3 * m1) / 2;
          for(var j = 0; j < 2; j++){ var x1 = m1 + j * (cw2 + m1); g.cols.push({ cx: Math.round(x1 + (cw2 - 12) / 2), mx: Math.round(x1 + (cw2 - g.mw) / 2) }); }
          g.H = g.yb + 10 + g.mh + 10 + 3 * g.keyLH + 8;
        }
        g.cols.forEach(function(c, i){
          c.i = i; c.kind = i ? 'wat' : 'buf';
          c.x0 = c.cx - bw / 2; c.x1 = c.cx + bw / 2; c.top = g.rimY; c.bot = g.yb - 1;
          c.ix0 = c.x0 + 5; c.ix1 = c.x1 - 5; c.iy0 = c.top + 4; c.iy1 = c.bot - 5;
          // the probe at the right inside the beaker, behind the molecules' space
          c.pw = Math.round(Math.max(7, 0.05 * bw)); c.px = Math.round(c.ix1 - 0.09 * bw); c.ptop = Math.round(c.top - Math.max(18, 0.12 * bw)); c.pbot = Math.round(c.iy1 - 0.1 * bh);
          c.drop = { acid: Math.round(c.cx - 0.25 * bw), base: Math.round(c.cx + 0.2 * bw) };
          // the meter: beside the beaker standing on the bench (wide), or on the bench under it (narrow)
          if(!g.narrow){ c.my = g.yb - g.mh - 2; c.ky = c.my - 12 - 3 * g.keyLH; c.kx = c.mx; }
          else { c.my = g.yb + 10; c.ky = c.my + g.mh + 10; c.kx = c.mx + 2; }
        });
        // the liquid: 100 mL fills 0.78 of the inside (the most drops, 20 mL more, reach 0.94)
        g.lev = function(c, V){ return c.iy1 - (c.iy1 - c.iy0) * 0.78 * V / 100; };
        // molecule slots: rows of cells as wide as the widest molecule and as tall as the tallest (turned by up to TILT),
        // with one H atom's width between them, in the liquid below the 100 mL line and clear of the probe; the scale is
        // the largest that holds the most particles the buffer beaker can draw (both forms at the larger amount and the
        // extra drops), so no two particles at rest are closer than an H atom
        var need = 2 * EX.amounts[EX.amounts.length - 1] + EX.extra + 1, best = null, mw0 = 0, mh0 = 0;
        ['CH3COOH', 'CH3COO-', 'NH4+', 'NH3', 'OH-', 'H3O+'].forEach(function(k){ var e = extent(k, TILT); mw0 = Math.max(mw0, e.w); mh0 = Math.max(mh0, e.h); });
        var c0 = g.cols[0], rx0 = c0.ix0 + 3, rx1 = c0.px - c0.pw / 2 - 3, ry0 = g.lev(c0, 100) + 5, ry1 = c0.iy1 - 3;
        for(var sc = 1.2; sc > 0.2; sc -= 0.01){
          var cw0 = (mw0 + 2 * AR.H) * sc, ch0 = (mh0 + 2 * AR.H) * sc, hw = mw0 * sc / 2, hh = mh0 * sc / 2, list = [];
          for(var y = ry0 + hh, row = 0; y <= ry1 - hh + 0.01; y += ch0, row++){
            var off = (row & 1) ? cw0 / 2 : 0, xs = [];
            for(var x = rx0 + hw + off; x <= rx1 - hw + 0.01; x += cw0) xs.push(x);
            // each row centred in the space (rows are a full cell apart, so a row may slide sideways freely)
            var sh = xs.length ? ((rx1 - hw) - xs[xs.length - 1] - (xs[0] - (rx0 + hw))) / 2 : 0;
            xs.forEach(function(x){ list.push([x + sh - c0.cx, y]); });
          }
          if(list.length >= need){ best = { s: sc, slots: list }; break; }
        }
        g.s = best ? best.s : 0.3; g.rel = best ? best.slots : [];
        g.mw0 = mw0; g.mh0 = mh0;
        // a little give inside each cell (at most half the gap), so the rows do not read as a lattice
        var jr = rng(97);
        g.rel = g.rel.map(function(p){ return [p[0] + (jr() - 0.5) * AR.H * g.s, p[1] + (jr() - 0.5) * AR.H * g.s]; });
        g.cols.forEach(function(c){ c.slots = g.rel.map(function(p){ return [c.cx + p[0], p[1]]; }); });
        return g;
      }

      /* ---------------------------------------------------- the beakers' contents */
      var BK = [];      // two beakers: { c, kind, mols, slotUse, events, plan, vol, volShown, mixed: { acid, base } }
      function newBeakers(){
        BK = G.cols.map(function(c){ return { c: c, kind: c.kind, mols: [], slotUse: c.slots.map(function(){ return null; }), events: [], plan: { h: 0, a: 0, oh: 0, h3o: 0, acid: 0, base: 0 }, vol: EX.V0, volShown: EX.V0, mixed: { acid: 0, base: 0 } }; });
      }
      function rng(seed){ return M.rng(seed); }
      function slotAngle(b, i){ var r = rng(7 + i * 13 + b.c.i * 71 + S.bi * 101); return (r() - 0.5) * 2 * TILT; }
      function newMol(key, x, y, a){ return { key: key, x: x, y: y, a: a, state: 'whole', alpha: 1, hide: -1, slot: -1 }; }
      // the plan after every drop launched so far, from the drops alone (buffer: the stoichiometry; water: the excess)
      function planFor(kind, acid, base){
        var n = S.n, k = base - acid, p = { acid: acid, base: base };
        if(kind === 'buf'){ p.h = Math.max(0, n - Math.max(0, k)) + Math.max(0, Math.min(n, -k)); p.a = 2 * n - p.h; p.oh = Math.max(0, k - n); p.h3o = Math.max(0, -k - n); }
        else { p.h = 0; p.a = 0; p.oh = Math.max(0, k); p.h3o = Math.max(0, -k); }
        return p;
      }
      function keyFor(b, what){ var bf = BF(); return what === 'h' ? bf.HA.key : what === 'a' ? bf.A.key : what === 'oh' ? 'OH-' : 'H3O+'; }
      // lay the beakers out at a state at once (a fresh picture: first draw, another buffer, Start over, reduced motion)
      function layoutAt(acid, base){
        CV.baseDirty = true;
        BK.forEach(function(b){
          b.mols = []; b.events = []; b.slotUse = b.c.slots.map(function(){ return null; });
          b.plan = planFor(b.kind, acid, base); b.mixed = { acid: acid, base: base };
          b.vol = EX.V0 + (acid + base) * EX.drop.mL; b.volShown = b.vol;
          var order = b.c.slots.map(function(p, i){ return i; }), rr = rng(31 + S.bi * 7 + b.c.i * 3);
          for(var i = order.length - 1; i > 0; i--){ var j = Math.floor(rr() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
          var q = 0;
          ['h', 'a', 'oh', 'h3o'].forEach(function(w){ for(var z = 0; z < b.plan[w]; z++){ var sl = order[q++]; var m = newMol(keyFor(b, w), b.c.slots[sl][0], b.c.slots[sl][1], slotAngle(b, sl)); m.slot = sl; b.slotUse[sl] = m; b.mols.push(m); } });
        });
        queue = []; ripples = [];
      }
      // what the picture shows: every particle out of its drop, by species (the water formed is the solvent: not counted)
      function drawn(b){
        var bf = BF(), c = { h: 0, a: 0, oh: 0, h3o: 0 };
        b.mols.forEach(function(m){ if(m.state === 'drop' || m.key === 'H2O') return; if(m.key === bf.HA.key) c.h++; else if(m.key === bf.A.key) c.a++; else if(m.key === 'OH-') c.oh++; else if(m.key === 'H3O+') c.h3o++; });
        return c;
      }
      function pHof(b, c){
        if(b.kind === 'buf') return M.bufferMeter({ Ka: KaOf(BF()), h: c.h, a: c.a, oh: c.oh, h3o: c.h3o, V: b.vol }).pH;
        return M.bufferMeter.water((c.oh - c.h3o) / 1000, b.vol / 1000);
      }

      /* ---------------------------------------------------- the canvas: the liquid and the moving parts */
      var CV = { ctx: null, dpr: 1, spr: {}, col: {}, fade: null, base: null, baseDirty: true, box: [0, 0, 0, 0] };
      function cssVar(n){ return getComputedStyle(stage).getPropertyValue(n).trim(); }
      function readColors(){
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        CV.col = { dark: dark, H: '#F4F6F8', C: dark ? '#7C858C' : '#5A6268', O: '#EE5A4F', N: '#5677E0', edge: dark ? 'rgba(0,0,0,.6)' : 'rgba(20,28,30,.55)',
          liq: cssVar('--liq') || 'rgba(120,170,210,.22)', liqTop: cssVar('--liq-top') || 'rgba(120,170,210,.5)', acid: cssVar('--bx-acid') || '#D55E00', base: cssVar('--bx-base') || '#0072B2' };
        CV.spr = {}; CV.baseDirty = true;
      }
      function sprite(el, rr){
        var key = el + rr.toFixed(2); if(CV.spr[key]) return CV.spr[key];
        var d = CV.dpr, sz = Math.ceil((rr * 2 + 4) * d), c = document.createElement('canvas'); c.width = c.height = sz;
        var x = c.getContext('2d'), o = sz / 2 / d;
        x.scale(d, d);
        x.beginPath(); x.arc(o, o, rr, 0, Math.PI * 2); x.fillStyle = CV.col[el] || '#7DB8EE'; x.fill();
        x.lineWidth = 0.9; x.strokeStyle = CV.col.edge; x.stroke();
        x.save(); x.beginPath(); x.arc(o, o, rr, 0, Math.PI * 2); x.clip();
        x.beginPath(); x.arc(o + rr * 0.32, o + rr * 0.32, rr * 1.02, 0, Math.PI * 2); x.arc(o - rr * 0.05, o - rr * 0.05, rr * 0.98, 0, Math.PI * 2, true);
        x.fillStyle = 'rgba(11,26,36,' + (el === 'H' ? 0.13 : CV.col.dark ? 0.28 : 0.2) + ')'; x.fill('evenodd'); x.restore();
        x.save(); x.translate(o - rr * 0.36, o - rr * 0.4); x.rotate(-35 * Math.PI / 180); x.beginPath(); x.ellipse(0, 0, rr * 0.36, rr * 0.24, 0, 0, Math.PI * 2); x.fillStyle = 'rgba(255,255,255,.75)'; x.fill(); x.restore();
        CV.spr[key] = { c: c, h: sz / d / 2 };
        return CV.spr[key];
      }
      // the charge sign: a white disc with a minus or a plus, the size of an H atom at least 9 px across
      function badge(q, z){
        var rr = Math.max(4.6, AR.H * G.s * 1.05) * (z || 1), key = 'q' + q + rr.toFixed(2); if(CV.spr[key]) return CV.spr[key];
        var d = CV.dpr, sz = Math.ceil((rr * 2 + 3) * d), c = document.createElement('canvas'); c.width = c.height = sz;
        var x = c.getContext('2d'), o = sz / 2 / d; x.scale(d, d);
        x.beginPath(); x.arc(o, o, rr, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 1.1; x.strokeStyle = q < 0 ? CV.col.base : CV.col.acid; x.stroke();
        x.lineWidth = Math.max(1.4, rr * 0.32); x.lineCap = 'round'; x.strokeStyle = '#11161B';
        x.beginPath(); x.moveTo(o - rr * 0.5, o); x.lineTo(o + rr * 0.5, o); if(q > 0){ x.moveTo(o, o - rr * 0.5); x.lineTo(o, o + rr * 0.5); } x.stroke();
        CV.spr[key] = { c: c, h: sz / d / 2 };
        return CV.spr[key];
      }
      function atomsOf(m, key){
        var k = key || m.key, t = TPL[k], out = [];
        var sc = G.s * (m.zoom || 1);
        ORDER[k].forEach(function(i){ if(i === m.hide && k === m.hideKey) return; var a = t[i], p = rot(a.dx * sc, a.dy * sc, m.a); out.push({ el: a.el, x: m.x + p[0], y: m.y + p[1], r: a.r * sc, i: i }); });
        return out;
      }
      function drawMol(x, m){
        var k = m.drawKey || m.key;
        if(m.alpha < 1) x.globalAlpha = CV.alpha * Math.max(0, m.alpha);
        atomsOf(m, k).forEach(function(a){ var sp = sprite(a.el, a.r); x.drawImage(sp.c, a.x - sp.h, a.y - sp.h, sp.h * 2, sp.h * 2); });
        var q = QPOS[m.key];
        if(q){ var zq = G.s * (m.zoom || 1), qp = rot(q.x * zq, q.y * zq, m.a), bs = badge(q.q, m.zoom || 1); x.drawImage(bs.c, m.x + qp[0] - bs.h, m.y + qp[1] - bs.h, bs.h * 2, bs.h * 2); }
        if(m.alpha < 1) x.globalAlpha = CV.alpha;
      }
      function liquidPath(x, c, V){
        var ly = G.lev(c, V), r = Math.min(10, G.bw * 0.06);
        x.beginPath(); x.moveTo(c.ix0, ly); x.lineTo(c.ix0, c.iy1 - r); x.quadraticCurveTo(c.ix0, c.iy1, c.ix0 + r, c.iy1); x.lineTo(c.ix1 - r, c.iy1); x.quadraticCurveTo(c.ix1, c.iy1, c.ix1, c.iy1 - r); x.lineTo(c.ix1, ly); x.closePath();
      }
      function paintCanvas(){
        var x = CV.ctx; if(!x || !G) return;
        var d = CV.dpr, bx = CV.box, bw = bx[2] - bx[0], bh = bx[3] - bx[1], tn = now();
        x.setTransform(d, 0, 0, d, 0, 0);
        x.clearRect(0, 0, bw, bh);
        var fade = CV.fade, alpha = 1;
        if(fade){ var t = (tn - fade.t0) / 300; if(t >= 1){ CV.fade = null; } else if(t < 0.5){ x.globalAlpha = 1 - t * 2; x.drawImage(fade.img, 0, 0, bw, bh); x.globalAlpha = 1; return; } else alpha = (t - 0.5) * 2; }
        CV.alpha = alpha;
        x.translate(-bx[0], -bx[1]);
        x.globalAlpha = alpha;
        // the liquid, then its surface line
        BK.forEach(function(b){
          liquidPath(x, b.c, b.volShown); x.fillStyle = CV.col.liq; x.fill();
          var ly = G.lev(b.c, b.volShown); x.beginPath(); x.moveTo(b.c.ix0, ly); x.lineTo(b.c.ix1, ly); x.lineWidth = 2; x.strokeStyle = CV.col.liqTop; x.stroke();
        });
        // ripples where a drop went in
        ripples = ripples.filter(function(rp){ var u = (tn - rp.t0) / 420; if(u >= 1) return false; x.beginPath(); x.ellipse(rp.x, rp.y, (6 + 22 * u) * Math.max(0.6, G.s * 1.6), (2 + 4 * u), 0, 0, Math.PI * 2); x.lineWidth = 1.5; x.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - u)).toFixed(3) + ')'; x.stroke(); return true; });
        // the molecules at rest come from a cached layer, redrawn only when one starts or stops moving
        if(CV.baseDirty){
          var bc = CV.base.getContext('2d'); bc.setTransform(d, 0, 0, d, 0, 0); bc.clearRect(0, 0, bw, bh); bc.translate(-bx[0], -bx[1]);
          var a0 = CV.alpha; CV.alpha = 1;
          BK.forEach(function(b){ b.mols.forEach(function(m){ if(m.state === 'whole') drawMol(bc, m); }); });
          CV.alpha = a0; CV.baseDirty = false;
        }
        x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = alpha; x.drawImage(CV.base, 0, 0); x.restore();
        x.globalAlpha = alpha;
        BK.forEach(function(b){
          // the glow where an H⁺ is passing over
          b.events.forEach(function(e){ if(e.glowA > 0){ x.beginPath(); x.arc(e.hAt[0], e.hAt[1], (16 * G.s + 6) * ZOOM, 0, Math.PI * 2); x.fillStyle = 'rgba(255,227,138,' + (0.55 * e.glowA).toFixed(3) + ')'; x.fill(); x.lineWidth = 1.6; x.strokeStyle = 'rgba(245,184,61,' + e.glowA.toFixed(3) + ')'; x.stroke(); } });
          b.mols.forEach(function(m){ if(m.state !== 'whole') drawMol(x, m); });
          // the H on its way across, and each drop's shell around its ion
          b.events.forEach(function(e){
            if(e.flyH){ var sp = sprite('H', AR.H * G.s * ZOOM); x.drawImage(sp.c, e.hAt[0] - sp.h, e.hAt[1] - sp.h, sp.h * 2, sp.h * 2); }
            if(e.shellA > 0){ var ion = e.ion, rr = radiusOf(ion.drawKey || ion.key) * G.s * (ion.zoom || 1) + 4; x.beginPath(); x.arc(ion.x, ion.y, rr, 0, Math.PI * 2); var col = e.dir > 0 ? CV.col.base : CV.col.acid;
              x.globalAlpha = alpha * 0.2 * e.shellA; x.fillStyle = col; x.fill(); x.globalAlpha = alpha * 0.85 * e.shellA; x.lineWidth = 1.6; x.strokeStyle = col; x.stroke(); x.globalAlpha = alpha; }
          });
        });
        x.globalAlpha = 1;
        if(CV.fade) kick();
      }

      /* ---------------------------------------------------- drawing the still scene */
      var L = {};
      function beakerPath(c){
        var r = Math.min(12, G.bw * 0.07), lip = Math.max(4, G.bw * 0.025);
        return 'M' + f1(c.x0 - lip) + ' ' + f1(c.top - 2) + 'Q' + f1(c.x0) + ' ' + f1(c.top - 1) + ' ' + f1(c.x0) + ' ' + f1(c.top + lip) + 'V' + f1(c.bot - r) + 'Q' + f1(c.x0) + ' ' + f1(c.bot) + ' ' + f1(c.x0 + r) + ' ' + f1(c.bot) +
          'H' + f1(c.x1 - r) + 'Q' + f1(c.x1) + ' ' + f1(c.bot) + ' ' + f1(c.x1) + ' ' + f1(c.bot - r) + 'V' + f1(c.top + 1) + 'H' + f1(c.x1 + 2);
      }
      function stripX(c, pH){ var x0 = c.mx + 12, x1 = c.mx + G.mw - 12; return x0 + (x1 - x0) * clamp(pH, 0, 14) / 14; }
      function iconSvg(key, cx, cy, s){
        var q = QPOS[key], rq = Math.max(4, AR.H * s * 1.05);
        return '<g class="bx2-icon" transform="translate(' + f1(cx) + ' ' + f1(cy) + ')">' + ORDER[key].map(function(i){ var a = TPL[key][i];
          return '<circle class="bx2-at is-' + a.el + '" cx="' + f1(a.dx * s) + '" cy="' + f1(a.dy * s) + '" r="' + f1(a.r * s) + '"/>'; }).join('') +
          (q ? '<g class="bx2-q is-' + (q.q < 0 ? 'neg' : 'pos') + '" transform="translate(' + f1(q.x * s) + ' ' + f1(q.y * s) + ')"><circle r="' + f1(rq) + '"/><path d="M' + f1(-rq / 2) + ' 0H' + f1(rq / 2) + (q.q > 0 ? 'M0 ' + f1(-rq / 2) + 'V' + f1(rq / 2) : '') + '"/></g>' : '') + '</g>';
      }
      function drawStatic(){
        var g = G, W = g.W, H = g.H, p = [], f = [], fz = g.f, bf = BF();
        p.push('<defs><linearGradient id="bx2g-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="bx2s-wall0"/><stop offset="1" class="bx2s-wall1"/></linearGradient>' +
          '<linearGradient id="bx2g-bench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="bx2s-bn0"/><stop offset="1" class="bx2s-bn1"/></linearGradient>' +
          '<linearGradient id="bx2g-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="bx2s-gl0"/><stop offset=".5" class="bx2s-gl1"/><stop offset="1" class="bx2s-gl0"/></linearGradient>' +
          '<linearGradient id="bx2g-bulbA" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="bx2s-ba0"/><stop offset="1" class="bx2s-ba1"/></linearGradient>' +
          '<linearGradient id="bx2g-bulbB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="bx2s-bb0"/><stop offset="1" class="bx2s-bb1"/></linearGradient></defs>');
        p.push('<rect class="bx2-wall" x="0" y="0" width="' + W + '" height="' + g.yb + '"/>');
        for(var ty = 46; ty < g.yb; ty += 58) p.push('<path class="bx2-grout" d="M0 ' + ty + 'H' + W + '"/>');
        p.push('<rect class="bx2-bench" x="0" y="' + g.yb + '" width="' + W + '" height="' + (H - g.yb) + '"/><path class="bx2-benchedge" d="M0 ' + (g.yb + 0.5) + 'H' + W + '"/>');
        // the dropper rack: a rod on two posts, across all four droppers
        var rodY = g.tubeTop + 3, rx0 = Math.max(4, g.cols[0].x0 - 14), rx1 = Math.min(W - 4, g.cols[1].x1 + (g.narrow ? 10 : 14));
        p.push('<path class="bx2-post" d="M' + f1(rx0) + ' ' + f1(rodY) + 'V' + g.yb + 'M' + f1(rx1) + ' ' + f1(rodY) + 'V' + g.yb + '"/>');
        p.push('<path class="bx2-rod" d="M' + f1(rx0 - 3) + ' ' + f1(rodY) + 'H' + f1(rx1 + 3) + '"/>');
        L.drop = { acid: [], base: [] };
        g.cols.forEach(function(c){
          // shadow, the beaker's glass (its back), the probe in it
          p.push('<ellipse class="bx2-shadow" cx="' + c.cx + '" cy="' + (g.yb + 4) + '" rx="' + Math.round(g.bw * 0.56) + '" ry="6"/>');
          p.push('<path class="bx2-glassbody" d="' + beakerPath(c) + 'Z"/>');
          p.push('<rect class="bx2-probe" x="' + f1(c.px - c.pw / 2) + '" y="' + c.ptop + '" width="' + c.pw + '" height="' + (c.pbot - c.ptop) + '" rx="' + f1(c.pw / 2) + '"/>' +
            '<circle class="bx2-probetip" cx="' + c.px + '" cy="' + f1(c.pbot - c.pw * 0.4) + '" r="' + f1(c.pw * 0.75) + '"/>' +
            '<rect class="bx2-probecap" x="' + f1(c.px - c.pw / 2 - 1.5) + '" y="' + (c.ptop - 6) + '" width="' + (c.pw + 3) + '" height="12" rx="3"/>');
          // the cable from the probe to its meter
          var mx = c.mx, my = c.my, cab;
          var ox = c.x1 + (g.narrow ? 7 : 16);
          if(!g.narrow){ var my2 = my + g.mh / 2; cab = 'M' + c.px + ' ' + (c.ptop - 6) + 'C' + f1(c.px) + ' ' + f1(c.ptop - 30) + ' ' + f1(ox) + ' ' + f1(c.ptop - 30) + ' ' + f1(ox) + ' ' + f1(c.ptop + 14) + 'V' + f1(my2 - 12) + 'Q' + f1(ox) + ' ' + f1(my2) + ' ' + f1(mx) + ' ' + f1(my2); }
          else { cab = 'M' + c.px + ' ' + (c.ptop - 6) + 'C' + f1(c.px) + ' ' + f1(c.ptop - 22) + ' ' + f1(ox) + ' ' + f1(c.ptop - 22) + ' ' + f1(ox) + ' ' + f1(c.ptop + 16) + 'V' + f1(my - 14) + 'Q' + f1(ox) + ' ' + f1(my) + ' ' + f1(Math.min(ox - 4, mx + g.mw - 14)) + ' ' + f1(my); }
          p.push('<path class="bx2-cable" d="' + cab + '"/>');
          // the droppers over this beaker (HCl at the left, NaOH at the right), each held in the rack
          ['acid', 'base'].forEach(function(w){
            var dx = c.drop[w], bwid = Math.round(Math.max(14, 0.1 * g.bw)), tw = Math.max(5, Math.round(0.035 * g.bw));
            var grp = '<g class="bx2-dropper is-' + w + '" data-w="' + w + '" data-c="' + c.i + '">' +
              '<path class="bx2-tube" d="M' + f1(dx - tw) + ' ' + g.tubeTop + 'V' + f1(g.tipY - g.tubeL * 0.35) + 'L' + f1(dx - 1.6) + ' ' + g.tipY + 'H' + f1(dx + 1.6) + 'L' + f1(dx + tw) + ' ' + f1(g.tipY - g.tubeL * 0.35) + 'V' + g.tubeTop + 'Z"/>' +
              '<path class="bx2-tubefill is-' + w + '" d="M' + f1(dx - tw + 1.5) + ' ' + f1(g.tipY - g.tubeL * 0.55) + 'V' + f1(g.tipY - g.tubeL * 0.35) + 'L' + f1(dx - 1) + ' ' + f1(g.tipY - 1) + 'H' + f1(dx + 1) + 'L' + f1(dx + tw - 1.5) + ' ' + f1(g.tipY - g.tubeL * 0.35) + 'V' + f1(g.tipY - g.tubeL * 0.55) + 'Z"/>' +
              '<rect class="bx2-clamp" x="' + f1(dx - tw - 3) + '" y="' + f1(rodY - 4) + '" width="' + (2 * tw + 6) + '" height="8" rx="2"/>' +
              '<g class="bx2-bulb"><path fill="url(#bx2g-bulb' + (w === 'acid' ? 'A' : 'B') + ')" d="M' + f1(dx - bwid / 2) + ' ' + (g.tubeTop + 1) + 'V' + f1(g.bulbTop + bwid / 2) + 'A' + f1(bwid / 2) + ' ' + f1(bwid / 2) + ' 0 0 1 ' + f1(dx + bwid / 2) + ' ' + f1(g.bulbTop + bwid / 2) + 'V' + (g.tubeTop + 1) + 'Z"/>' +
              '<path class="bx2-bulbhi" d="M' + f1(dx - bwid * 0.22) + ' ' + f1(g.bulbTop + bwid * 0.45) + 'V' + f1(g.tubeTop - 3) + '"/></g>' +
              '<rect class="bx2-lab is-' + w + '" x="' + f1(dx - g.labW / 2) + '" y="' + g.labY + '" width="' + g.labW + '" height="' + g.labH + '" rx="' + f1(g.labH / 2) + '"/>' +
              '<text class="bx2-labt is-' + w + '" x="' + dx + '" y="' + f1(g.labY + g.labH / 2 + fz.lab * 0.36) + '" text-anchor="middle" style="font-size:' + fz.lab + 'px">' + (w === 'acid' ? 'HCl' : 'NaOH') + '</text></g>';
            p.push(grp);
          });
          // the meter: a box with its name, the reading and a pH scale with a pointer (the buffer's with pKa ± 1)
          var mw = g.mw, mh = g.mh, hy = my + 6 + fz.head;
          p.push('<rect class="bx2-meter" x="' + mx + '" y="' + my + '" width="' + mw + '" height="' + mh + '" rx="9"/>');
          p.push('<text class="bx2-mhead" x="' + (mx + 10) + '" y="' + f1(hy) + '" style="font-size:' + fz.head + 'px">' + (c.kind === 'buf' ? 'Buffer' : 'Water') + '</text>');
          var dy0 = Math.round(my + fz.head * 1.3 + 8), dh = g.dh;
          p.push('<rect class="bx2-disp" x="' + (mx + 8) + '" y="' + dy0 + '" width="' + (mw - 16) + '" height="' + dh + '" rx="5"/>');
          p.push('<text class="bx2-phl" x="' + (mx + 15) + '" y="' + f1(dy0 + dh / 2 + fz.ph * 0.36) + '" style="font-size:' + fz.ph + 'px">pH</text>');
          var dfs = Math.round(dh * 0.62);
          p.push('<text class="bx2-ph" x="' + (mx + mw - 15) + '" y="' + f1(dy0 + dh / 2 + dfs * 0.36) + '" text-anchor="end" style="font-size:' + dfs + 'px"></text>');
          var sy = dy0 + dh + 14, sx0 = mx + 12, sx1 = mx + mw - 12;
          c.sy = sy;
          p.push('<rect class="bx2-strip" x="' + sx0 + '" y="' + sy + '" width="' + (sx1 - sx0) + '" height="7" rx="3.5"/>');
          if(c.kind === 'buf'){ var pk = pKaOf(bf); p.push('<rect class="bx2-band" x="' + f1(stripX(c, pk - 1)) + '" y="' + sy + '" width="' + f1(stripX(c, pk + 1) - stripX(c, pk - 1)) + '" height="7" rx="3.5"/><path class="bx2-pkaline" d="M' + f1(stripX(c, pk)) + ' ' + (sy - 1) + 'V' + (sy + 8) + '"/>'); }
          [0, 7, 14].forEach(function(v){ p.push('<path class="bx2-stick" d="M' + f1(stripX(c, v)) + ' ' + (sy + 7) + 'V' + (sy + 10) + '"/>'); });
          var ly = f1(sy + 7 + 4 + fz.tick * 1.0);
          p.push('<text class="bx2-tick" x="' + sx0 + '" y="' + ly + '" text-anchor="middle" style="font-size:' + fz.tick + 'px">0</text>' +
            '<text class="bx2-tick" x="' + f1(stripX(c, 7)) + '" y="' + ly + '" text-anchor="middle" style="font-size:' + fz.tick + 'px">7</text>' +
            '<text class="bx2-tick" x="' + sx1 + '" y="' + ly + '" text-anchor="middle" style="font-size:' + fz.tick + 'px">14</text>');
          if(c.kind === 'buf') p.push('<text class="bx2-pka" x="' + f1(stripX(c, pKaOf(bf))) + '" y="' + ly + '" text-anchor="middle" style="font-size:' + fz.pka + 'px">pK<tspan class="bx2-sub" dy="0.26em">a</tspan></text>');
          p.push('<path class="bx2-ptr" data-c="' + c.i + '" d="M-5 ' + (sy - 7) + 'H5L0 ' + (sy - 1) + 'Z"/>');
          // the counts: a small drawing of each particle and how many are drawn
          var iconS = Math.min((g.keyLH - 4) / g.mh0, (g.iconW - 2) / g.mw0);
          var rowsK = c.kind === 'buf' ? [bf.HA.key, bf.A.key, 'X'] : ['H3O+', 'OH-'];
          rowsK.forEach(function(k, r){
            var yy = c.ky + r * g.keyLH + g.keyLH / 2, icx = c.kx + g.iconW / 2;
            p.push('<g class="bx2-krow" data-c="' + c.i + '" data-r="' + r + '">' + (k === 'X' ? '<g class="bx2-kx"></g>' : iconSvg(k, icx, yy, iconS)) +
              '<text class="bx2-kt" x="' + f1(c.kx + g.iconW + 6) + '" y="' + f1(yy + fz.key * 0.36) + '" style="font-size:' + fz.key + 'px"></text></g>');
          });
          c.iconS = iconS;
          // in front of the canvas: the glass's rim, shine and its 50 and 100 mL marks
          f.push('<path class="bx2-glassrim" d="' + beakerPath(c) + '"/>');
          f.push('<path class="bx2-shine" d="M' + f1(c.x0 + Math.max(5, g.bw * 0.035)) + ' ' + f1(c.top + g.bh * 0.1) + 'V' + f1(c.top + g.bh * 0.42) + '"/>');
          [50, 100].forEach(function(v){ var yy = g.lev(c, v); f.push('<path class="bx2-grad" d="M' + f1(c.x0 + 1) + ' ' + f1(yy) + 'H' + f1(c.x0 + g.bw * (v === 100 ? 0.12 : 0.07)) + '"/>'); });
        });
        svg.innerHTML = p.join('');
        front.innerHTML = f.join('');
        front.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        L.ph = [].slice.call(svg.querySelectorAll('.bx2-ph'));
        L.ptr = [].slice.call(svg.querySelectorAll('.bx2-ptr'));
        L.head = [].slice.call(svg.querySelectorAll('.bx2-mhead'));
        L.meter = [].slice.call(svg.querySelectorAll('.bx2-meter'));
        L.krow = [0, 1].map(function(i){ return [].slice.call(svg.querySelectorAll('.bx2-krow[data-c="' + i + '"]')); });
        L.droppers = [].slice.call(svg.querySelectorAll('.bx2-dropper'));
      }

      /* ---------------------------------------------------- the readouts, from what is drawn */
      var shown = null, drawnKey = '', ptr = [{ a: null, to: null }, { a: null, to: null }];
      function fmtPH(v){ return T.F(v, 2); }
      function paintReadouts(force){
        var c0 = drawn(BK[0]), c1 = drawn(BK[1]);
        var key = [c0.h, c0.a, c0.oh, c0.h3o, BK[0].vol, c1.oh, c1.h3o, BK[1].vol, BK[0].mixed.acid, BK[0].mixed.base].join(',');
        if(!force && key === drawnKey) return;
        drawnKey = key;
        var p0 = pHof(BK[0], c0), p1 = pHof(BK[1], c1), bf = BF();
        var prev = shown;
        shown = { c: [c0, c1], pH: [p0, p1], mixed: { acid: BK[0].mixed.acid, base: BK[0].mixed.base }, wmixed: { acid: BK[1].mixed.acid, base: BK[1].mixed.base }, spent: c0.h === 0 || c0.a === 0 };
        [p0, p1].forEach(function(v, i){
          var t = fmtPH(v); if(L.ph[i].textContent !== t){ L.ph[i].textContent = t; if(prev) tick(L.ph[i]); }
          ptr[i].to = stripX(G.cols[i], v); if(ptr[i].a == null || force && !prev) ptr[i].a = ptr[i].to;
        });
        L.head[0].textContent = shown.spent ? 'Buffer used up' : 'Buffer';
        L.meter[0].classList.toggle('is-spent', shown.spent);
        // the counts
        var t0 = [bf.HA.html + ' ' + c0.h, bf.A.html + ' ' + c0.a], ex = c0.oh ? ['OH-', 'OH⁻ ' + c0.oh] : c0.h3o ? ['H3O+', 'H₃O⁺ ' + c0.h3o] : null;
        setKey(L.krow[0][0], t0[0], prev && prev.c[0].h !== c0.h, c0.h === 0);
        setKey(L.krow[0][1], t0[1], prev && prev.c[0].a !== c0.a, c0.a === 0);
        var xr = L.krow[0][2], xg = xr.querySelector('.bx2-kx');
        if(ex){ if(xg.getAttribute('data-k') !== ex[0]){ xg.setAttribute('data-k', ex[0]); xg.innerHTML = iconSvg(ex[0], G.cols[0].kx + G.iconW / 2, G.cols[0].ky + 2 * G.keyLH + G.keyLH / 2, G.cols[0].iconS); } }
        else { xg.removeAttribute('data-k'); xg.innerHTML = ''; }
        setKey(xr, ex ? ex[1] : '', prev && ex && (prev.c[0].oh !== c0.oh || prev.c[0].h3o !== c0.h3o), false);
        setKey(L.krow[1][0], 'H₃O⁺ ' + c1.h3o, prev && prev.c[1].h3o !== c1.h3o, false);
        setKey(L.krow[1][1], 'OH⁻ ' + c1.oh, prev && prev.c[1].oh !== c1.oh, false);
        kick();
        paintCause();
        again.hidden = !(BK[0].plan.acid || BK[0].plan.base);
        paintDroppers();
      }
      function setKey(row, html, changed, zero){
        var t = row.querySelector('.bx2-kt'), h = svgChem(html);
        if(t.getAttribute('data-h') !== html){ t.setAttribute('data-h', html); t.innerHTML = h; if(changed) tick(t); }
        row.classList.toggle('is-zero', !!zero);
      }
      function tick(t){ t.classList.remove('is-tick'); requestAnimationFrame(function(){ t.classList.add('is-tick'); }); }
      function paintCause(){
        var s = shown, bf = BF(), c = s.c[0], m = s.mixed, w = s.pH[1], HA = plain(bf.HA.html), A = plain(bf.A.html), pk = pKaOf(bf), parts, lead = '';
        var p0 = fmtPH(pk), pH = fmtPH(s.pH[0]), net = m.base - m.acid;
        clearTimeout(takeT);
        var wm = s.wmixed, wch = (wm.acid || wm.base) && fmtPH(w) !== '7.00';
        var water = { t: 'water ' + (wch ? '7.00 → ' + fmtPH(w) : '7.00'), role: 'wat', join: '+', say: 'in water the pH ' + (wch ? 'goes from 7.00 to ' + fmtPH(w) : 'is 7.00') };
        var first = m.acid && m.base ? { t: net === 0 ? 'HCl and NaOH cancel' : 'net ' + Math.abs(net) + ' drop' + (Math.abs(net) > 1 ? 's ' : ' ') + (net > 0 ? 'NaOH' : 'HCl'), role: net > 0 ? 'base' : net < 0 ? 'acid' : 'ink' }
          : { t: Math.abs(net) + ' drop' + (Math.abs(net) > 1 ? 's ' : ' ') + (net > 0 ? 'NaOH' : 'HCl'), role: net > 0 ? 'base' : 'acid' };
        if(!(m.acid || m.base)){ lead = 'Start:'; parts = [{ t: c.h + ' ' + HA + ' = ' + c.a + ' ' + A, role: 'pair', say: 'equal amounts of ' + HA + ' and ' + A }, { t: 'pH = pKa ' + p0, role: 'buf', say: 'the pH equals pKa, ' + p0 }, water]; }
        else if(net === 0) parts = [first, { t: c.h + ' ' + HA + ' = ' + c.a + ' ' + A, role: 'pair' }, { t: 'pH = pKa ' + p0, role: 'buf' }, water];
        else if(c.oh || c.h3o) parts = [first, { t: (c.oh || c.h3o) + ' ' + (c.oh ? 'OH⁻' : 'H₃O⁺') + ' left over', role: c.oh ? 'base' : 'acid', say: (c.oh || c.h3o) + ' ' + (c.oh ? 'hydroxide' : 'hydronium') + ' left over, nothing takes it' }, { t: 'pH ' + p0 + ' → ' + pH, role: 'buf', say: 'the buffer pH goes from ' + p0 + ' to ' + pH }, water];
        else if(c.h === 0 || c.a === 0) parts = [first, { t: 'all ' + (c.h === 0 ? HA : A) + ' used', role: 'pair' }, { t: 'pH ' + p0 + ' → ' + pH, role: 'buf', say: 'the buffer pH goes from ' + p0 + ' to ' + pH }, water];
        else { var k = Math.abs(net); parts = [first, { t: k + ' ' + (net > 0 ? HA + ' → ' + A : A + ' → ' + HA), role: 'pair', say: k + ' ' + (net > 0 ? HA + ' became ' + A : A + ' became ' + HA) }, { t: 'pH ' + p0 + ' → ' + pH, role: 'buf', say: 'the buffer pH goes from ' + p0 + ' to ' + pH }, water]; }
        cause.set(parts, lead);
      }
      var takeT = 0;
      function settled(){
        if(!shown) return;
        say(cause.text());
        clearTimeout(takeT);
        if(shown.spent && S.mode === 'explore') takeT = setTimeout(function(){ if(!busy() && shown.spent) cause.take('A buffer holds its pH until one of its two forms runs out.'); }, 1100);
        refNow();
      }
      function paintDroppers(){
        var p = BK[0].plan, tot = p.acid + p.base, k = p.base - p.acid;
        var off = { base: k >= lim() || tot >= EX.maxDrops, acid: -k >= lim() || tot >= EX.maxDrops };
        L.droppers.forEach(function(d){ d.classList.toggle('is-off', off[d.getAttribute('data-w')]); });
        taps.forEach(function(tp){ var o = off[tp.w]; tp.t.el.disabled = o; tp.t.el.setAttribute('aria-label', tp.label + (o ? ' (the most this beaker takes)' : '')); });
      }

      /* ---------------------------------------------------- the drops and their reactions */
      var queue = [], ripples = [], raf = 0, lastLaunch = 0, dirty = false;
      function busy(){ return queue.length > 0 || BK.some(function(b){ return b.events.length > 0; }); }
      function idleOf(b, key, near){
        var best = null, bd = Infinity;
        b.mols.forEach(function(m){ if(m.key !== key || m.state !== 'whole') return; var d = Math.hypot(m.x - near[0], m.y - near[1]); if(d < bd){ bd = d; best = m; } });
        return best;
      }
      function freeSlotNear(b, x, y){ var best = -1, bd = Infinity; b.c.slots.forEach(function(p, i){ if(b.slotUse[i]) return; var d = Math.hypot(p[0] - x, p[1] - y); if(d < bd){ bd = d; best = i; } }); return best; }
      // what a drop does in a beaker, from the plan: which particle takes it, or none (it stays)
      function decide(b, dir){
        var p = b.plan, bf = BF();
        if(dir > 0){ if(p.h3o > 0) return { key: 'H3O+', w: 'h3o' }; if(b.kind === 'buf' && p.h > 0) return { key: bf.HA.key, w: 'h' }; return { key: null }; }
        if(p.oh > 0) return { key: 'OH-', w: 'oh' }; if(b.kind === 'buf' && p.a > 0) return { key: bf.A.key, w: 'a' }; return { key: null };
      }
      function entryOf(b, dir){ var c = b.c, x = c.drop[dir > 0 ? 'base' : 'acid']; return [x, G.lev(c, b.vol)]; }
      function canLaunch(dir){
        return BK.every(function(b){ if(b.events.length >= 5) return false; var d = decide(b, dir), e = entryOf(b, dir); return d.key ? !!idleOf(b, d.key, e) : freeSlotNear(b, e[0], e[1]) > -1; });
      }
      function wrapTo(a, ref){ while(a - ref > Math.PI) a -= 2 * Math.PI; while(ref - a > Math.PI) a += 2 * Math.PI; return a; }
      function launch(dir){
        var tn = now();
        BK.forEach(function(b){
          var d = decide(b, dir), c = b.c, ent = entryOf(b, dir), tip = [c.drop[dir > 0 ? 'base' : 'acid'], G.tipY + 2];
          var ion = newMol(dir > 0 ? 'OH-' : 'H3O+', tip[0], tip[1], (rng(500 + tn % 997)() - 0.5) * 1.2); ion.state = 'drop';
          b.mols.push(ion);
          var e = { dir: dir, ion: ion, t0: tn, tip: tip, entry: ent.slice(), shellA: 1, glowA: 0, mixed: false };
          // the plan moves on now (the next drop is decided against it)
          var p = b.plan; if(dir > 0) p.base++; else p.acid++;
          if(d.key){
            var tg = idleOf(b, d.key, ent); tg.state = 'busy'; CV.baseDirty = true;
            e.kind = 'react'; e.target = tg; tg.from = [tg.x, tg.y, tg.a];
            var donor = dir > 0 ? tg : ion, acc = dir > 0 ? ion : tg;
            e.donor = donor; e.acc = acc;
            p[d.w]--;
            if(d.w === 'h') p.a++; else if(d.w === 'a') p.h++;
            // where they meet: at the target, on the side the drop comes from, both inside the liquid
            var u0 = [ent[0] - tg.x, ent[1] - tg.y], ul = Math.hypot(u0[0], u0[1]) || 1; u0 = [u0[0] / ul, u0[1] / ul];
            var phi = Math.atan2(u0[1], u0[0]) + (dir > 0 ? 0 : Math.PI);
            ZOOM = zoomFor();
            var hd = hxVec(donor.key), ra = hxVec(PROTOF[acc.key]), sep = (Math.hypot(hd[0], hd[1]) + Math.hypot(ra[0], ra[1]) + 16) * G.s * ZOOM;
            // the target stays where it is (it turns to face the drop) and the drop's ion comes down beside it, on the
            // side it comes from; both are kept inside the liquid
            var Ri = radiusOf(ion.key) * G.s * ZOOM, Rt = radiusOf(tg.key) * G.s * ZOOM;
            var tP = [tg.x, tg.y], iP = [tg.x + u0[0] * sep, tg.y + u0[1] * sep], lev0 = G.lev(c, b.vol);
            var dy = Math.max(0, lev0 + 3 + Ri - iP[1], lev0 + 3 + Rt - tP[1]); dy = Math.min(dy, Math.max(0, c.iy1 - 2 - Rt - tP[1]));
            var xl = c.ix0 + 2, xr = c.px - c.pw / 2 - 2, push = Math.max(0, xl + Ri - iP[0], xl + Rt - tP[0]), room = Math.min(xr - Ri - iP[0], xr - Rt - tP[0]);
            var dx = push > 0 ? push : room < 0 ? room : 0;
            tP = [tP[0] + dx, tP[1] + dy]; iP = [iP[0] + dx, iP[1] + dy];
            var dP = dir > 0 ? tP : iP, aP = dir > 0 ? iP : tP;
            donor.meet = [dP[0], dP[1], phi - Math.atan2(hd[1], hd[0])];
            acc.meet = [aP[0], aP[1], phi + Math.PI - Math.atan2(ra[1], ra[0])];
            tg.meet[2] = wrapTo(tg.meet[2], tg.a);
          } else {
            e.kind = 'stay';
            var sl = freeSlotNear(b, ent[0], ent[1]); e.slot = sl; b.slotUse[sl] = ion; ion.slot = sl;
            ion.to = [c.slots[sl][0], c.slots[sl][1], slotAngle(b, sl)];
            if(dir > 0) p.oh++; else p.h3o++;
          }
          b.events.push(e);
        });
        // both droppers of this kind squeeze
        L.droppers.forEach(function(dd){ if(dd.getAttribute('data-w') === (dir > 0 ? 'base' : 'acid')){ dd.classList.remove('is-sq'); void dd.getBBox(); dd.classList.add('is-sq'); } });
        paintDroppers();
      }
      // the timeline of one drop (ms). An ion that stays mixes at the same moment as a swap would (1025 ms), so the two
      // beakers always count the same drop on the same frame
      // the two particles that react are drawn larger while they meet and trade the H (on a phone the particles are
      // small), then go back to their size as they return
      var ZOOM = 1.45;
      function zoomFor(){ return G && G.s < 0.75 ? Math.min(1.6, 0.75 / G.s * 1.2) : 1.3; }
      var TM = { sq: 150, fall: 520, meet: 900, xfer: 1150, back: 1600, stay: 1150 };
      function stepEvent(b, e, tn){
        var t = tn - e.t0, ion = e.ion;
        if(t < TM.sq){ poseAt(ion, e.tip[0], e.tip[1], ion.a); return; }
        if(t < TM.fall){ var u = (t - TM.sq) / (TM.fall - TM.sq); poseAt(ion, e.tip[0], lerp(e.tip[1], e.entry[1] - 2, u * u), ion.a); return; }
        if(!e.splashed){ e.splashed = true; ripples.push({ x: e.entry[0], y: G.lev(b.c, b.vol), t0: tn }); ion.from = [ion.x, ion.y, ion.a]; }
        if(e.kind === 'stay'){
          var v = ease((t - TM.fall) / (TM.stay - TM.fall));
          e.shellA = clamp(1 - (t - TM.meet) / (TM.stay - TM.meet), 0, 1);
          ion.to[2] = wrapTo(ion.to[2], ion.from[2]);
          poseAt(ion, lerp(ion.from[0], ion.to[0], v), lerp(ion.from[1], ion.to[1], v), lerp(ion.from[2], ion.to[2], v));
          // the ion counts once its drop has faded into the liquid
          if(!e.mixed && e.shellA <= 0.5){ e.mixed = true; ion.state = 'moving'; mixIn(b, e); }
          if(t >= TM.stay){ ion.state = 'whole'; CV.baseDirty = true; e.done = true; }
          return;
        }
        var tg = e.target, don = e.donor, acc = e.acc;
        if(t < TM.meet){
          var w = ease((t - TM.fall) / (TM.meet - TM.fall));
          ion.meet[2] = wrapTo(ion.meet[2], ion.from[2]);
          [ion, tg].forEach(function(m){ poseAt(m, lerp(m.from[0], m.meet[0], w), lerp(m.from[1], m.meet[1], w), lerp(m.from[2], m.meet[2], w)); m.zoom = lerp(1, ZOOM, w); });
          return;
        }
        if(!e.xStart){
          e.xStart = true;
          // the H leaves the donor: the donor draws as its base form, the acceptor as its protonated form without that H
          [ion, tg].forEach(function(m){ poseAt(m, m.meet[0], m.meet[1], m.meet[2]); m.zoom = ZOOM; });
          var zs = G.s * ZOOM, hl = TPL[don.key][HX[don.key]], hp = rot(hl.dx * zs, hl.dy * zs, don.a), pk = PROTOF[acc.key], rl = TPL[pk][HX[pk]], rp = rot(rl.dx * zs, rl.dy * zs, acc.a);
          e.hFrom = [don.x + hp[0], don.y + hp[1]]; e.hTo = [acc.x + rp[0], acc.y + rp[1]]; e.hAt = e.hFrom.slice();
          e.flyH = true; don.drawKey = BASEOF[don.key]; acc.drawKey = pk; acc.hideKey = pk; acc.hide = HX[pk];
        }
        if(t < TM.xfer){
        var xu = clamp((t - TM.meet) / (TM.xfer - TM.meet), 0, 1), hu = ease(xu);
        e.hu = hu;
        e.hAt = [lerp(e.hFrom[0], e.hTo[0], hu), lerp(e.hFrom[1], e.hTo[1], hu)];
        e.glowA = Math.sin(Math.PI * xu) * 0.85;
        e.shellA = clamp(1 - xu, 0, 1);
        // the swap counts when the H is drawn halfway across (the drop's shell is half faded then too)
        if(!e.mixed && hu >= 0.5){
          e.mixed = true;
          don.key = BASEOF[don.key]; acc.key = PROTOF[acc.key];
          ion.state = 'busy';
          mixIn(b, e);
        }
        return;
        }
        if(!e.mixed){ e.mixed = true; don.key = BASEOF[don.key]; acc.key = PROTOF[acc.key]; ion.state = 'busy'; mixIn(b, e); }
        if(!e.back){
          e.back = true; e.flyH = false; e.glowA = 0; e.shellA = 0;
          don.drawKey = null; acc.drawKey = null; acc.hide = -1; acc.hideKey = null;
          // the products: the water formed fades into the liquid; the buffer's particle goes back to its place
          [don, acc].forEach(function(m){
            m.from = [m.x, m.y, m.a];
            if(m.key === 'H2O'){ m.fadeFrom = [m.x, m.y]; if(m === tg && tg.slot > -1){ b.slotUse[tg.slot] = null; tg.slot = -1; } }
            else { var sp = b.c.slots[tg.slot]; m.to = [sp[0], sp[1], wrapTo(slotAngle(b, tg.slot), m.a)]; }
          });
        }
        var r = ease((t - TM.xfer) / (TM.back - TM.xfer)), fa = clamp((t - TM.xfer) / (TM.back - TM.xfer - 80), 0, 1);
        [don, acc].forEach(function(m){
          if(m.key === 'H2O'){ m.alpha = 1 - fa; poseAt(m, m.fadeFrom[0], m.fadeFrom[1] - 10 * fa, m.from[2] + 0.4 * fa); }
          else { poseAt(m, lerp(m.from[0], m.to[0], r), lerp(m.from[1], m.to[1], r), lerp(m.from[2], m.to[2], r)); m.zoom = lerp(ZOOM, 1, r); }
        });
        if(t >= TM.back){
          b.mols = b.mols.filter(function(m){ return !(m.key === 'H2O' && (m === don || m === acc)); });
          [don, acc].forEach(function(m){ if(m.key !== 'H2O'){ m.state = 'whole'; m.zoom = 1; } });
          CV.baseDirty = true; e.done = true;
        }
      }
      function poseAt(m, x, y, a){ m.x = x; m.y = y; m.a = a; }
      // a drop is mixed into this beaker: its volume joins the liquid, and the readouts follow
      function mixIn(b, e){
        b.vol += EX.drop.mL; if(e.dir > 0) b.mixed.base++; else b.mixed.acid++;
        paintReadouts();
      }
      function kick(){ if(!raf) raf = requestAnimationFrame(frame); }
      function frame(){
        raf = 0;
        var tn = now();
        if(queue.length && tn - lastLaunch > 300 && canLaunch(queue[0])){ launch(queue.shift()); lastLaunch = tn; }
        BK.forEach(function(b){ b.events.forEach(function(e){ stepEvent(b, e, tn); }); b.events = b.events.filter(function(e){ return !e.done; });
          var dv = b.vol - b.volShown; b.volShown = Math.abs(dv) < 0.02 ? b.vol : b.volShown + dv * 0.2; });
        // the meters' pointers ease to the drawn pH
        var pm = false;
        ptr.forEach(function(q, i){ if(q.to == null) return; var d = q.to - q.a; q.a = Math.abs(d) < 0.15 ? q.to : q.a + d * 0.25; L.ptr[i].setAttribute('transform', 'translate(' + q.a.toFixed(1) + ' 0)'); if(q.a !== q.to) pm = true; });
        paintCanvas();
        var more = busy() || pm || BK.some(function(b){ return b.volShown !== b.vol; }) || ripples.length || !!CV.fade;
        if(more){ dirty = true; raf = requestAnimationFrame(frame); }
        else if(dirty){ dirty = false; settled(); }
      }
      // finish everything now (leaving Explore, the stage hidden): the picture of every drop tapped so far
      function snap(){
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        if(!G) return;
        var p = BK[0].plan, a = p.acid + queue.filter(function(d){ return d < 0; }).length, bs = p.base + queue.filter(function(d){ return d > 0; }).length;
        layoutAt(a, bs); drawnKey = ''; paintReadouts(true); ptr.forEach(function(q){ q.a = q.to; }); CV.fade = null; frame(); settled();
      }
      function crossFade(fn){
        var img = null;
        if(CV.ctx && mov.width){ img = document.createElement('canvas'); img.width = mov.width; img.height = mov.height; img.getContext('2d').drawImage(mov, 0, 0); }
        fn();
        if(img){ CV.fade = { img: img, t0: now() }; kick(); }
      }
      // a tap on a dropper: one drop of it into each beaker
      function tap(dir){
        var p = BK[0].plan, qa = queue.filter(function(d){ return d < 0; }).length, qb = queue.length - qa;
        var k = p.base + qb - p.acid - qa, tot = p.acid + p.base + queue.length;
        if(tot >= EX.maxDrops || (dir > 0 ? k >= lim() : -k >= lim())) return false;
        tourDid('tap');
        cause.take(null); clearTimeout(takeT);
        if(K.reduced()){
          var na = p.acid + (dir < 0 ? 1 : 0), nb = p.base + (dir > 0 ? 1 : 0);
          crossFade(function(){ layoutAt(na, nb); }); drawnKey = ''; paintReadouts(true); ptr.forEach(function(q){ q.a = q.to; }); frame(); settled();
          return true;
        }
        queue.push(dir); kick();
        return true;
      }

      /* ---------------------------------------------------- the tap targets: the droppers */
      var taps = [];
      function makeTaps(){
        taps.forEach(function(t){ t.t.el.remove(); }); taps = [];
        G.cols.forEach(function(c){
          ['acid', 'base'].forEach(function(w){
            var dx = c.drop[w], hw = Math.max(22, G.labW / 2 + 3), label = (w === 'acid' ? 'HCl' : 'NaOH') + ' dropper: one drop into each beaker';
            var t = K.tap(layer, { key: c.i === 0 && w === 'base' ? 'apchem-buffer-drop' : null, label: label, chip: false, box: [dx - hw, G.labY - 2, 2 * hw, G.tipY - G.labY + 6], onClick: function(){ hideCue(true); tap(w === 'base' ? 1 : -1); } });
            t.el.classList.add('bx2-tap'); taps.push({ t: t, w: w, label: label });
          });
        });
      }

      /* ---------------------------------------------------- layout */
      var lastW = 0;
      function layoutNow(force){
        var r0 = sceneBox.getBoundingClientRect(), W = Math.round(r0.width);
        if(!W || (!force && W === lastW && G)){ if(cue.active()) cue.place(); return; }
        lastW = W;
        var keep = BK.length ? { a: BK[0].plan.acid + queue.filter(function(d){ return d < 0; }).length, b: BK[0].plan.base + queue.filter(function(d){ return d > 0; }).length } : { a: 0, b: 0 };
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        G = geo(W);
        sceneBox.style.height = G.H + 'px';
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + G.H); svg.setAttribute('width', W); svg.setAttribute('height', G.H);
        // the canvas covers the drops' path and the beakers only
        var bx = [0, Math.floor(G.tipY - 4), W, Math.ceil(G.yb + 2)];
        CV.box = bx; CV.dpr = Math.min(2, window.devicePixelRatio || 1);
        mov.style.left = '0px'; mov.style.top = bx[1] + 'px'; mov.style.width = W + 'px'; mov.style.height = (bx[3] - bx[1]) + 'px';
        mov.width = Math.round(W * CV.dpr); mov.height = Math.round((bx[3] - bx[1]) * CV.dpr); CV.ctx = mov.getContext('2d');
        CV.base = document.createElement('canvas'); CV.base.width = mov.width; CV.base.height = mov.height; CV.baseDirty = true; readColors();
        sceneBox.classList.toggle('is-narrow', G.narrow);
        drawStatic();
        newBeakers();
        layoutAt(keep.a, keep.b);
        drawnKey = ''; shown = null; ptr = [{ a: null, to: null }, { a: null, to: null }]; paintReadouts(true);
        ptr.forEach(function(q){ q.a = q.to; });
        makeTaps();
        frame();
        svg.setAttribute('aria-label', describe());
        if(cue.active()) cue.place();
        settled();
      }
      function describe(){
        var bf = BF();
        return 'Two beakers of 100 mL on a lab bench: a buffer of ' + S.n + ' millimoles each of ' + plain(bf.HA.html) + ' and ' + plain(bf.A.html) + ', and plain water, each with a pH meter. Above them droppers of HCl and NaOH; one tap puts one drop into each beaker.';
      }
      function pickBuffer(v){
        var i = BUF.map(function(b){ return b.id; }).indexOf(v); if(i < 0 || i === S.bi) return;
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        S.bi = i; queue = []; cause.take(null);
        crossFade(function(){});
        BK = [];
        layoutNow(true); refHtml();
      }
      function pickAmount(n){
        if(n === S.n) return;
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        S.n = n; queue = []; cause.take(null);
        amt.querySelectorAll('.bx2-amt-b').forEach(function(b){ b.setAttribute('aria-pressed', String(+b.getAttribute('data-n') === n)); });
        crossFade(function(){ layoutAt(0, 0); });
        drawnKey = ''; paintReadouts(true); ptr.forEach(function(q){ q.a = q.to; }); frame(); settled(); refHtml();
      }
      function startOver(){
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        queue = []; cause.take(null);
        crossFade(function(){ layoutAt(0, 0); });
        drawnKey = ''; paintReadouts(true); ptr.forEach(function(q){ q.a = q.to; }); frame(); settled();
      }

      /* ---------------------------------------------------- the cue and Show me how */
      var cue = K.cue(layer, { key: 'apchem-buffer-drop', text: 'Tap a dropper', side: 'below', at: function(){ if(!G) return [0, 0]; var c = G.cols[0]; return [c.drop.base, G.tipY + 4]; } });
      function hideCue(used){ if(cue.active()) cue.hide(used); }
      stage.addEventListener('pointerdown', function(e){ if(sceneBox.contains(e.target)) hideCue(true); }, true);
      function rectOf(x, y, w, h){ var r0 = svg.getBoundingClientRect(), k = r0.width / G.W; return { left: r0.left + x * k, top: r0.top + y * k, right: r0.left + (x + w) * k, bottom: r0.top + (y + h) * k, width: w * k, height: h * k }; }
      var tour = K.tour({ key: 'apchem-buffers', label: 'Show me how', steps: [
        { id: 'tap', text: 'Tap NaOH or HCl. One drop goes into each beaker.', target: function(){ return seen('tap', taps[1] ? taps[1].t.el : sceneBox); } },
        { id: 'react', text: 'In the buffer one form takes each drop and turns into the other. In water nothing takes it.', target: function(){ if(!G) return sceneBox; var c = G.cols[0]; seen('react', mov); return rectOf(c.x0, G.lev(c, 100), G.bw, c.iy1 - G.lev(c, 100)); } },
        { id: 'meters', text: 'Compare the meters: the buffer barely moves until a form runs out.', target: function(){ if(!G) return sceneBox; var c = G.cols[0]; seen('meters', L.meter[0]); return rectOf(c.mx, c.my, G.mw, G.mh); } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      var tourSeen = {};
      function seen(id, el){ if(el && !tourSeen[id]){ tourSeen[id] = true; try{ el.scrollIntoView({ block: 'nearest' }); }catch(e){} } return el; }
      function tourDid(id){ if(tour.active()) tour.did(id); }
      function startTour(){ if(S.mode !== 'explore') return; hideCue(false); tourSeen = {}; tour.start(true); }

      /* ---------------------------------------------------- "?" */
      var ref = document.createElement('div'); ref.className = 'ls-sec bx2-ref';
      function refHtml(){
        var bf = BF(), isB = !!bf.Kb, Ka = KaOf(bf), pk = pKaOf(bf), HA = bf.HA.html, A = bf.A.html, n = S.n;
        var rows = [];
        for(var k = -lim(); k <= lim(); k++){
          var pl = planFor('buf', Math.max(0, -k), Math.max(0, k)), V = EX.V0 + Math.abs(k);
          var bm = M.bufferMeter({ Ka: Ka, h: pl.h, a: pl.a, oh: pl.oh, h3o: pl.h3o, V: V }), wp = M.bufferMeter.water(k / 1000, V / 1000);
          rows.push('<tr' + (k === 0 ? ' class="hl"' : '') + '><td>' + (k === 0 ? 'none' : Math.abs(k) + ' ' + (k > 0 ? 'NaOH' : 'HCl')) + '</td><td>' + pl.h + ' : ' + pl.a + (pl.oh ? ' + ' + pl.oh + ' OH⁻' : pl.h3o ? ' + ' + pl.h3o + ' H₃O⁺' : '') + '</td><td>' + fmtPH(bm.pH) + (bm.how === 'hh' ? '' : ' *') + '</td><td>' + fmtPH(wp) + '</td></tr>');
        }
        var takesB = isB ? 'OH⁻ + NH₄⁺ → NH₃ + H₂O' : 'OH⁻ + CH₃COOH → CH₃COO⁻ + H₂O', takesA = isB ? 'H₃O⁺ + NH₃ → NH₄⁺ + H₂O' : 'H₃O⁺ + CH₃COO⁻ → CH₃COOH + H₂O';
        ref.innerHTML = '<p class="bx2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>' +
          '<h3 class="ls-title-l">The two beakers</h3><p>Each holds 100 mL. The buffer has ' + n + ' mmol of ' + HA + ' and ' + n + ' mmol of ' + A + ' (' + M.fmt(n / 100, 2) + ' M of each); the other is plain water. One particle stands for 1 mmol. Each tap squeezes 1.0 mL of 1.0 M HCl or NaOH, 1.0 mmol, into each beaker, so both always get the same. ' +
          (isB ? 'Cl⁻ from NH₄Cl and HCl and Na⁺ from NaOH' : 'Na⁺ from sodium acetate and NaOH and Cl⁻ from HCl') + ' are spectator ions and are not drawn, and neither is the water itself (100 mL is about 5,500 mmol of water). The particles are drawn still between drops; in a real solution they never stop moving.</p>' +
          '<h3 class="ls-title-l">Which particle takes the drop</h3><p>A strong acid or base reacts completely with the form that can take it:</p><ul class="bx2-list"><li>Added base: ' + takesB + '</li><li>Added acid: ' + takesA + '</li></ul><p>So the strong acid or base is used up and a weak one is made in its place: only the ratio of the two forms changes. In plain water nothing can take the drop, so the H₃O⁺ or OH⁻ stays and sets the pH. Left over strong acid and left over strong base react with each other first (H₃O⁺ + OH⁻ → 2 H₂O). The water a reaction makes joins the water already there.</p>' +
          '<h3 class="ls-title-l">Henderson-Hasselbalch</h3><p class="bx2-eq">pH = pK<sub>a</sub> + log([' + A + '] / [' + HA + '])</p><p>' + (isB ? 'For an ammonia buffer use pK<sub>a</sub> of NH₄⁺: pK<sub>a</sub> = 14.00 − pK<sub>b</sub> = 14.00 − ' + T.F(-Math.log10(bf.Kb), 2) + ' = ' + T.F(pk, 2) + '. ' : 'pK<sub>a</sub> of acetic acid = −log(' + '1.8 × 10⁻⁵) = ' + T.F(pk, 2) + '. ') +
          'Both forms are in the same volume, so the ratio of amounts is the ratio of concentrations: count the particles. Use log (base 10), never ln, and base over acid.</p><div class="bx2-now"></div>' +
          '<h3 class="ls-title-l">pH = pK<sub>a</sub> at equal amounts</h3><p>With as much ' + A + ' as ' + HA + ' the log term is log 1 = 0, so pH = pK<sub>a</sub> = ' + T.F(pk, 2) + '. That is what the half-equivalence point of a titration makes: half the ' + (isB ? 'weak base has been turned into its conjugate acid' : 'weak acid has been turned into its conjugate base') + ', so the two are equal and the pH there is the pK<sub>a</sub>. A buffer works best there: it can take acid and base equally well.</p>' +
          '<h3 class="ls-title-l">Capacity and the buffer range</h3><p>The green band on the buffer\'s scale is pK<sub>a</sub> ± 1: the ratio from 1 : 10 to 10 : 1, where a buffer is useful. Capacity is how much acid or base it can take before one form runs out: here ' + n + ' drops of either. With ' + EX.amounts[EX.amounts.length - 1] + ' mmol of each it starts at the same pH (the ratio is the same) but takes twice the drops: capacity depends on the amounts, the pH on the ratio. Once a form is gone, the next drop has nothing to react with and the pH jumps, as in water.</p>' +
          '<h3 class="ls-title-l">The meters</h3><p>While both forms are there in a ratio from 1 : 10 to 10 : 1 the meter shows the Henderson-Hasselbalch pH, the exam\'s method (the exact pH differs by less than 0.01 there). Everywhere else (* in the table) it shows the exact pH, solved from the charge balance with water and the volume after the drops: Henderson-Hasselbalch fails as one form runs out. Water starts at 7.00: 1 mmol of HCl in 101 mL is 0.0099 M H₃O⁺, pH 2.00.</p>' +
          '<h3 class="ls-title-l">Each drop, this buffer</h3><div class="table-wrap" tabindex="0" role="region" aria-label="pH after each drop"><table class="chem-data bx2-tbl"><caption>' + n + ' mmol each of ' + HA + ' and ' + A + ' in 100 mL, and 100 mL of water</caption><thead><tr><th scope="col">Drops</th><th scope="col">' + HA + ' : ' + A + '</th><th scope="col">Buffer pH</th><th scope="col">Water pH</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' +
          '<h3 class="ls-title-l">The constants</h3><ul class="bx2-list">' + BUF.map(function(b){ return '<li>' + esc(b.tab) + ': ' + esc(b.ref) + '.</li>'; }).join('') + '<li>K<sub>w</sub> = 1.0 × 10⁻¹⁴ at 25 °C.</li></ul>' +
          '<h3 class="ls-title-l">' + esc(data.howItWorksTitle || 'How Test yourself checks') + '</h3>' + T.wrapTables(data.howItWorks) +
          '<p class="bt-small">Notes: <a href="../notes/henderson-hasselbalch.html">Henderson-Hasselbalch</a></p>';
        refNow();
      }
      // the method for what is drawn now, as the exam expects it
      function refNow(){
        var box = ref.querySelector('.bx2-now'); if(!box || !shown) return;
        var bf = BF(), c = shown.c[0], pk = pKaOf(bf), HA = bf.HA.html, A = bf.A.html, V = BK[0].vol, t;
        if(c.h > 0 && c.a > 0){ var q = c.a / c.h, inR = q >= 0.1 && q <= 10;
          t = 'Now: pH = ' + T.F(pk, 2) + ' + log(' + c.a + ' / ' + c.h + ') = ' + T.F(pk + Math.log10(q), 2) + (inR ? '' : '. The ratio is outside 1 : 10 to 10 : 1, so the meter shows the exact pH, ' + fmtPH(shown.pH[0])) + '.'; }
        else if(c.oh || c.h3o){ var x = c.oh || c.h3o, cM = x / V;
          t = 'Now: no ' + (c.oh ? HA : A) + ' is left, so ' + x + ' mmol ' + (c.oh ? 'OH⁻' : 'H₃O⁺') + ' stays: [' + (c.oh ? 'OH⁻' : 'H₃O⁺') + '] = ' + x + ' mmol ÷ ' + V + ' mL = ' + M.fmt(cM, 2) + ' M, ' + (c.oh ? 'pOH = ' + T.F(-Math.log10(cM), 2) + ', pH = ' + T.F(14 + Math.log10(cM), 2) : 'pH = ' + T.F(-Math.log10(cM), 2)) + ' (the meter, with the weak ' + (c.oh ? 'base' : 'acid') + ' and water included: ' + fmtPH(shown.pH[0]) + ').'; }
        else t = 'Now: only ' + (c.h ? HA : A) + ' is left, a weak ' + (c.h ? 'acid' : 'base') + ' solution, not a buffer: pH ' + fmtPH(shown.pH[0]) + '.';
        box.innerHTML = '<p class="bx2-calc">' + t + '</p>';
      }
      ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(ctx.studio) ctx.studio.close(); if(S.mode !== 'explore' && ctx.studio && ctx.studio.kit2) ctx.studio.kit2.go('explore'); setTimeout(startTour, 60); });

      /* ================================================== TEST YOURSELF: the drill, unchanged */
      var qz = document.createElement('div'); qz.className = 'bt-pane bt-pane-quiz bx2-quiz';
      app.appendChild(qz);
      quiz(qz, data, M);
      var drillStage = ctx.studio ? ctx.studio.root.querySelector('.ls-drill-stage') : null, drillDock = ctx.studio ? ctx.studio.root.querySelector('.ls-drill') : qz.querySelector('.cd-problem');
      if(ctx.studio){ var dab = ctx.studio.root.querySelector('.bt-about'); if(dab) dab.remove(); }
      function shownMode(mode){
        var was = S.mode; S.mode = mode;
        tour.stop();
        stage.setAttribute('data-view', mode);
        if(mode !== 'explore'){ hideCue(false); clearTimeout(takeT); if(was === 'explore' && G && (busy() || raf)) snap(); return; }
        setTimeout(function(){ layoutNow(); if(!tour.active()) cue.show(); if(cue.active()) cue.place(); }, 30);
      }
      ctx.kit2 = { stage: stage, ref: ref, onShow: shownMode,
        parts: [{ value: 'quiz', label: 'Problems', placed: true, stage: drillStage, dock: drillDock }],
        about: [(function(){ var d = document.createElement('div'); d.className = 'bt-intro'; d.innerHTML = '<p><b>Explore:</b> tap the HCl or NaOH dropper and the same drop falls into a buffer and into plain water. Watch which particle takes it, and compare the two pH meters until the buffer runs out.</p><p><b>Test yourself:</b></p>' + data.intro; return d; })()],
        start: function(){ try{ if(/[?&#]seed=\d+/.test(location.search + location.hash) || /^#quiz\b/.test(location.hash)) return { mode: 'quiz', part: 'quiz' }; }catch(e){} return null; } };
      refHtml();
      if(!ctx.studio){ app.insertBefore(stage, app.firstChild); app.insertBefore(ref, stage.nextSibling); shownMode('explore'); }
      if(window.IntersectionObserver) new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting && (busy() || raf) && S.mode === 'explore') snap(); }); }).observe(sceneBox);
      if(window.MutationObserver) new MutationObserver(function(){ if(G){ readColors(); paintCanvas(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      document.addEventListener('visibilitychange', function(){ if(document.hidden && (busy() || raf)) snap(); });
      if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if(G) layoutNow(true); });
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(function(){ layoutNow(); }, 50); }).observe(sceneBox); }
      else window.addEventListener('resize', function(){ layoutNow(); });
      // for the sweep and the frames check (scripts/tools-v2/chem-buffers-sweep.mjs): the drawn state
      window.__buf2 = {
        G: function(){ return G; }, busy: function(){ return busy() || !!raf; }, buffer: function(){ return BF(); }, n: function(){ return S.n; }, lim: lim,
        drawn: function(){ return BK.map(drawn); }, vol: function(){ return BK.map(function(b){ return b.vol; }); }, volShown: function(){ return BK.map(function(b){ return b.volShown; }); },
        mixed: function(){ return BK.map(function(b){ return { acid: b.mixed.acid, base: b.mixed.base }; }); }, plan: function(){ return BK.map(function(b){ return Object.assign({}, b.plan); }); },
        pHof: function(i, c){ return pHof(BK[i], c); }, shown: function(){ return shown; }, ptr: function(){ return ptr.map(function(q){ return { a: q.a, to: q.to }; }); }, stripX: function(i, v){ return stripX(G.cols[i], v); },
        mols: function(){ return BK.map(function(b){ return b.mols.map(function(m){ return { key: m.key, drawKey: m.drawKey || m.key, state: m.state, alpha: m.alpha, atoms: atomsOf(m, m.drawKey || m.key).map(function(a){ return [a.x, a.y, a.r, a.i]; }) }; }); }); },
        tpl: function(k){ return TPL[k]; }, order: function(k){ return ORDER[k]; }, hx: function(k){ return HX[k]; },
        events: function(){ return BK.map(function(b){ return b.events.map(function(e){ return { kind: e.kind, dir: e.dir, mixed: e.mixed, shell: e.shellA, hu: e.flyH ? e.hu : null, glow: e.glowA || 0 }; }); }); },
        queue: function(){ return queue.slice(); },
        tap: tap, snap: snap,
        set: function(acid, base){ if(raf){ cancelAnimationFrame(raf); raf = 0; } queue = []; layoutAt(acid, base); drawnKey = ''; paintReadouts(true); ptr.forEach(function(q){ q.a = q.to; }); frame(); settled(); }
      };
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }

  /* ================================================== the drill (Test yourself), as before the rebuild */
  function quiz(app, data, M){
    var beaker = null, cur = null, qnote = null;   // the figure moves to the stage in the Tool Studio: keep references
    function mountB(host, ctx, title){ return window.ApChemBeaker.mount(host, { species: species(names(ctx)), readout: 'none', title: title, max: 24, seed: 5 }); }
    function counts(nH, nA){ return { HA: Math.round(nH * 1e6), A: Math.round(nA * 1e6) }; }
    T.drill(app, data, {
      slug: 'buffer-drills',
      generate: function(r, ctx, type){ var p = M.buffer.generate(r, ctx, type); p.context = ctx; return p; },
      types: [{ value: 'ph', label: 'pH of a buffer' }, { value: 'ratio', label: 'Ratio for a target pH' }, { value: 'add', label: 'Adding strong acid or base' }, { value: 'capacity', label: 'Buffer capacity' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return TITLE[p.type]; },
      extra: function(host, p){
        cur = p; beaker = null; qnote = null;
        var v = p.values, n = names(p.context);
        if(p.type === 'capacity'){
          host.innerHTML = '<div class="bf-two"><div class="bf-b1"></div><div class="bf-b2"></div></div><p class="bt-small">Same ratio in both; buffer ' + v.high + ' has more of each form. Both beakers use one scale.</p>';
          var big = v.high === 1 ? v.b1 : v.b2, k = 22 / (big.cH + big.cA);
          [['.bf-b1', v.b1, 'Buffer 1'], ['.bf-b2', v.b2, 'Buffer 2']].forEach(function(x){
            mountB(host.querySelector(x[0]), p.context, x[2]).update({ counts: { HA: Math.max(1, Math.round(x[1].cH * k)), A: Math.max(1, Math.round(x[1].cA * k)) } });
          });
          return;
        }
        host.innerHTML = '<div class="bf-qb"></div><p class="bt-small bf-qnote"></p>';
        beaker = mountB(host.querySelector('.bf-qb'), p.context, 'The buffer');
        var note = qnote = host.querySelector('.bf-qnote');
        if(p.type === 'ph'){ beaker.update({ counts: counts(v.cH, v.cA) }); note.textContent = 'Drawn in the ratio of the concentrations given: ' + n.A + ' : ' + n.HA + ' = ' + M.fmt(v.cA / v.cH, 3) + '.'; }
        else if(p.type === 'add'){ beaker.update({ counts: counts(v.cH * v.L, v.cA * v.L) }); note.textContent = 'Before the ' + (v.acidAdded ? 'HCl' : 'NaOH') + ' goes in. Do the stoichiometry, then watch the beaker change.'; }
        else { beaker.update({ counts: { HA: 6, A: 6 } }); note.textContent = 'Equal amounts: pH = pKa. Find the ratio the target pH needs.'; }
      },
      onStep: function(s){
        if(!beaker || !cur) return;
        var v = cur.values, n = names(cur.context), nt = qnote;
        if(cur.type === 'add' && s.key === 'nH'){
          beaker.update({ counts: counts(v.nH, v.nA), note: 'After the reaction: ' + (v.acidAdded ? 'H₃O⁺ turned ' + n.A + ' into ' + n.HA : 'OH⁻ turned ' + n.HA + ' into ' + n.A) + '.' });
          if(nt) nt.textContent = 'After the reaction: the strong ' + (v.acidAdded ? 'acid' : 'base') + ' is used up; only the ratio changed.';
        }
        if(cur.type === 'ratio' && s.key === 'ratio'){
          var r = v.ratio, t = 12, hA = Math.max(1, Math.round(t * r / (1 + r))), hH = Math.max(1, t - hA);
          beaker.update({ counts: { HA: hH, A: hA }, note: 'Drawn at the ratio ' + M.fmt(r, 2) + '.' });
          if(nt) nt.textContent = 'At pH ' + T.F(v.target, 2) + ': ' + n.A + ' : ' + n.HA + ' = ' + M.fmt(r, 2) + ' (rounded to whole particles).';
        }
      }
    });
  }

  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApChemBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
