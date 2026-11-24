/* Q vs K, tools v2 (docs/tools-v2-chem-q-vs-k-brief.md; the standard: docs/tools-v2-standard.md). On the shared kit
   (assets/course/tool-kit2.js) through the course adapter ApChemTools.studioKit2 (chem-tools.js).

   THE ONE IDEA: compare Q with K to see which way a reaction runs. Q < K: forward. Q > K: back. Q = K: no net change.
   EXPLORE: a glass cylinder with a piston on a lab bench, holding particles you can count (A + B ⇌ AB, as on the exam's
   particle diagrams; or CaCO₃(s) ⇌ CaO(s) + CO₂(g) at 800 °C, its solids lying on the floor). The main control is the
   tray of particles: drag (or tap) a cup and three particles of a gas (or one lump of a solid) go in through the side
   port; tap or drag a particle in the cylinder and three of its kind leave. Q jumps (a needle on a dial with K as a
   notch), the arrow under the equation turns the way the reaction will run, and the reaction runs at once, one event
   at a time, drawn where it happens (an A and a B meet and join; an AB splits; a CO₂ goes into a CaO lump, which turns
   to CaCO₃, or comes out of a CaCO₃ lump), until the counts are as near K as whole particles allow. A quiet piston
   handle sets the volume (0.50 to 1.50 L): Q changes with it whenever the gas particles differ between the two sides.
   Every number shown (Q, the needle, the arrow, the volume tag, the cause line) comes from what is DRAWN at that frame:
   a particle counts once it is inside the glass, a product once it has formed (halfway through its event), the
   volume from the piston where it is drawn. Data: chem/data/tools/q-vs-k.json "explore", checked by
   scripts/lib/apchem-tool-checks/q-vs-k.mjs. Reduced motion: a short cross fade to the new state.
   TEST YOURSELF: the drill, unchanged (T.drill: Q, the comparison, the direction, the justification; numbers or
   particle pictures; ids "q-vs-k:<context>:<step>", ?seed= and #quiz open it). */
(function(){
  'use strict';
  var SLUG = 'q-vs-k';
  var T = window.ApChemTools;
  if(!T) return;
  var NS = 'http://www.w3.org/2000/svg';
  var DSPAN = Math.log10(4);   // the dial runs from K ÷ 4 to K × 4 (log scale); Q beyond rests at a stop
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function ease(t){ return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function f1(v){ return (+v).toFixed(1); }
  function rot(dx, dy, a){ var c = Math.cos(a), s = Math.sin(a); return [dx * c - dy * s, dx * s + dy * c]; }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var SUBD = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  // a subscript in a species name as a lowered smaller tspan (CO₂ -> CO<tspan>2</tspan>)
  function svgChem(t){
    return esc(t).replace(/[₀-₉]+/g, function(m){ return '<tspan class="qk2-sub" dy="0.28em">' + m.split('').map(function(c){ return SUBD[c]; }).join('') + '</tspan><tspan dy="-0.28em">​</tspan>'; });
  }

  function boot(){
    var K = window.LevlKit2, M = window.ApChemMath;
    T.mount(SLUG, function(app, data, ctx){
      var EX = data.explore, RX = EX.reactions, VOL = EX.volumes, TEMPL = M.particles.templ;
      var VMIN = VOL[0], VMAX = VOL[VOL.length - 1], DROP = EX.drop || 3;
      var S = { ri: 0, mode: 'explore', V: EX.V0, act: null, solidAct: false };
      var G = null;

      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'qk2';
      var tabs = K.tabs({ label: 'Reaction', value: RX[0].id, items: RX.map(function(r){ return { value: r.id, label: r.tab, short: r.chip }; }),
        onChange: function(v){ hideCue(true); pickReaction(v); } });
      stage.appendChild(tabs.el);
      var head = K.head({ purpose: 'See which way a reaction runs: compare Q with K.', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'qk2-scene'; sceneBox.id = T.nid('qk2');
      // the still scene (lab, cylinder, piston, dial face, tray, plate) under a canvas of the moving parts (particles,
      // lumps, glows, the needle), then the glass's front (rim, shine) over it
      sceneBox.innerHTML = '<svg class="qk2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"></svg><canvas class="qk2-mov" aria-hidden="true"></canvas><svg class="qk2-front" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"></svg>';
      stage.appendChild(sceneBox);
      tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', sceneBox.id); });
      var svg = sceneBox.querySelector('svg'), mov = sceneBox.querySelector('.qk2-mov'), front = sceneBox.querySelector('.qk2-front'), layer = K.layer(sceneBox);
      var lines = document.createElement('div'); lines.className = 'qk2-lines';
      var cause = K.cause({ label: 'Why' });
      var again = document.createElement('button'); again.type = 'button'; again.className = 'tk2-btn qk2-again'; again.textContent = 'Start over'; again.hidden = true;
      again.addEventListener('click', function(){ hideCue(true); startOver(); });
      lines.appendChild(cause.el); lines.appendChild(again);
      stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      var sayT = 0;
      function say(t){ clearTimeout(sayT); sayT = setTimeout(function(){ live.textContent = t; }, 350); }

      function R(){ return RX[S.ri]; }
      function eqText(r){
        var ph = function(s){ return r.id === 'ab' ? '' : '(' + s.phase + ')'; };
        return r.species.filter(function(s){ return s.nu < 0; }).map(function(s){ return (s.nu < -1 ? -s.nu : '') + s.html + ph(s); }).join(' + ') + ' ⇌ ' +
          r.species.filter(function(s){ return s.nu > 0; }).map(function(s){ return (s.nu > 1 ? s.nu : '') + s.html + ph(s); }).join(' + ');
      }
      function fq(q){ return q === 0 ? '0' : !isFinite(q) ? 'no value' : M.fmt(q, 3); }
      function Kname(r){ return r.K === 'Kp' ? 'Kp' : 'Kc'; }
      function idx(key){ var sp = R().species; for(var i = 0; i < sp.length; i++) if(sp[i].key === key) return i; return -1; }
      function isGas(key){ var i = idx(key); return i > -1 && R().species[i].phase === 'g'; }
      function gasKeys(){ return R().species.filter(function(s){ return s.phase === 'g'; }).map(function(s){ return s.key; }); }

      /* ---------------------------------------------------- the model: drawn counts, the drawn volume */
      // Q of whole counts c (per species, in data order) at volume V. A gas particle stands for r.per mol (A + B: a
      // concentration of per / V M) or r.per atm at 1.00 L (CO₂: a pressure of per / V atm). Solids are left out.
      // Returns NaN when Q has no value (0 / 0), Infinity when a reactant gas is at zero and a product is not.
      function Qof(r, c, V){
        var top = 1, bot = 1, zt = false, zb = false;
        r.species.forEach(function(s, i){ if(s.phase !== 'g') return; var x = c[i] * r.per / V; if(s.nu > 0){ if(x === 0) zt = true; top *= Math.pow(x, s.nu); } else { if(x === 0) zb = true; bot *= Math.pow(x, -s.nu); } });
        if(zt && zb) return NaN; if(zb) return Infinity; if(zt) return 0;
        return top / bot;
      }
      function same(a, b){ return Math.abs(a / b - 1) < 1e-9; }
      function dist(r, q){ return (q > 0 && isFinite(q)) ? Math.abs(Math.log(q / r.Kval)) : Infinity; }
      // can one event run that way? (every species it uses is there, and the gas fits the cylinder)
      function can(r, c, dir){
        var gas = 0;
        for(var i = 0; i < c.length; i++){ var s = r.species[i]; if(c[i] + dir * s.nu < 0) return false; if(s.phase === 'g') gas += c[i] + dir * s.nu; }
        return gas <= G.gasSlots.length;
      }
      // the way the next event runs from counts c at V: toward K, and only when one whole event brings Q nearer
      function nextDir(r, c, V){
        var q = Qof(r, c, V);
        if(q !== q || same(q, r.Kval)) return 0;
        var dir = q < r.Kval ? 1 : -1;
        if(!can(r, c, dir)) return 0;
        var c2 = c.map(function(n, i){ return n + dir * r.species[i].nu; });
        return dist(r, Qof(r, c2, V)) < dist(r, q) ? dir : 0;
      }
      // where the counts settle from c at V (the whole counts nearest K the reaction can reach)
      function settleFrom(r, c, V){ var n = 0; for(;;){ var d = nextDir(r, c, V); if(!d || n > 80) return c; c = c.map(function(x, i){ return x + d * r.species[i].nu; }); n++; } }

      /* ---------------------------------------------------- geometry */
      /* Sized from the height there is: the tray, the cylinder, the piston's handle and the cause line are on screen
         together. Wide (860 px and up): the cylinder on the bench at the left, the dial to its upper left, the plate with
         the equation on the wall at the right and the tray on the bench under it. Under 860 px: the plate across the top,
         the cylinder in the middle, the tray on the bench under it. The cylinder is always the largest object. The
         cylinder and the tray are the same size for both reactions. */
      var MC = null;
      function measure(t, fs, wt){
        if(!MC) MC = document.createElement('canvas').getContext('2d');
        var cs = getComputedStyle(stage);
        MC.font = (wt || 700) + ' ' + fs + 'px ' + (cs.getPropertyValue('--font-ui') || cs.fontFamily);
        return MC.measureText(String(t)).width;
      }
      function availH(phone){
        var lh = Math.max(lines.offsetHeight || 0, phone ? 76 : 44), sc = sceneBox.getBoundingClientRect();
        if(phone) return Math.max(560, window.innerHeight - lh - 22);
        return clamp(window.innerHeight - (sc.top + window.scrollY) - lh - (sc.width < 860 ? 28 : 36), 470, 1100);
      }
      function extent(key){
        var x0 = 0, x1 = 0, y0 = 0, y1 = 0;
        TEMPL[key].forEach(function(at){ var rr = at.r || 9; x0 = Math.min(x0, at.dx - rr); x1 = Math.max(x1, at.dx + rr); y0 = Math.min(y0, at.dy - rr); y1 = Math.max(y1, at.dy + rr); });
        return { w: 2 * Math.max(x1, -x0), h: 2 * Math.max(y1, -y0), d: Math.max.apply(null, TEMPL[key].map(function(at){ return 2 * (at.r || 9); })) };
      }
      // the plate's text: the equation, K and the scale, from measured text
      function plateMetrics(narrow){
        // lines with a subscript (shown at 0.78 of the size) stay at 14.5 px or more, so no text is under 11 px
        var fs = { eq: narrow ? 15 : 17, k: narrow ? 14.5 : 15, key: 14.5 };
        var w = 0;
        RX.forEach(function(r){ w = Math.max(w, measure(eqText(r), fs.eq, 900), measure(kText(r), fs.k, 800), measure(r.perText, fs.key, 700)); });
        var pad = narrow ? 10 : 14, arrowH = narrow ? 22 : 26;
        var y1 = Math.round(pad + 1.02 * fs.eq), ya = Math.round(y1 + 0.37 * fs.eq + 4 + arrowH / 2), y2 = Math.round(ya + arrowH / 2 + 4 + 1.02 * fs.k), y3 = Math.round(y2 + 0.37 * fs.k + 0.22 * fs.k + 7 + 1.02 * fs.key);
        return { fs: fs, pad: pad, w: Math.ceil(w + 2 * pad), h: Math.round(y3 + 0.37 * fs.key + 0.22 * fs.key + pad), y1: y1, ya: ya, y2: y2, y3: y3, arrowH: arrowH };
      }
      function kText(r){ return Kname(r) + ' = ' + r.Kval + (r.T ? ' at ' + r.T : ''); }
      function geo(W){
        var g = { W: W, narrow: W < 860, phone: W <= 640 }, H = availH(g.phone), r = R();
        // the tray's cups: as wide as the tray's room allows (wide: about a third of the stage; narrow: the width)
        var wellW = g.narrow ? Math.round(clamp((Math.min(W, 520) - 16 - 4 * 12) / 3, 70, 120)) : Math.round(clamp((W * 0.34 - 4 * 12) / 3, 84, 130));
        g.wellW = function(){ return wellW; };
        var pm = plateMetrics(g.narrow);
        g.pm = pm;
        g.wh = g.narrow ? 58 : 62;                          // a cup's height
        g.gr = Math.round(g.narrow ? 34 : clamp(W * 0.032, 38, 54));
        // horizontal: the cylinder's inside width (room for the dial at its left and the port at its right when wide)
        if(g.narrow) g.iw = Math.round(clamp(W - 2 * 50 - 8, 200, 430));
        else g.iw = Math.round(clamp(W * 0.27, 240, 430));
        // vertical: a band at the top (narrow: the plate and the dial), the knob over the piston's top place, the
        // cylinder, its foot, the bench with the tray
        var benchH = g.narrow ? g.wh + 112 : 48, band = g.narrow ? Math.max(pm.h, 2 * g.gr + 26) + 14 : 0;
        g.stem = 30;
        g.yRim = Math.round(band + 22 + g.stem + 12);       // the open top of the glass
        g.lumpW = Math.round(clamp(g.iw / 8 - 6, 22, 40)); g.lumpH = Math.round(g.lumpW * 0.7);
        g.hs = 2 * g.lumpH + 10;                            // the floor layer the solids lie in (CaCO₃)
        var tot = H - benchH - 14 - g.yRim - 8;
        tot = clamp(tot, 300, g.narrow ? Math.min(560, g.iw * 1.5) : 600);
        g.tot = Math.round(tot);                            // inside height from the floor to the piston at VMAX
        g.yF = g.yRim + 8 + g.tot;                          // the inside floor
        g.yb = g.yF + 14;                                   // the bench
        g.H = Math.round(g.yb + benchH);
        if(g.narrow) g.cx = Math.round(W / 2 - 6); else g.cx = Math.round(clamp(W * 0.34, 2 * g.gr + 70 + g.iw / 2, W / 2 - 40));
        g.x0 = g.cx - g.iw / 2; g.x1 = g.cx + g.iw / 2;
        // the port on the right wall, low enough to stay under the piston at VMIN
        g.portY = Math.round(g.yF - g.hs - Math.min(0.4 * (g.tot - g.hs) * VMIN / VMAX, 36));
        g.portL = g.narrow ? 34 : 44;
        g.portX = g.x1 + g.portL;
        // the dial: wide, left of the cylinder; narrow, at the top left beside the plate. A cable runs to a probe low on
        // the cylinder's left wall.
        if(g.narrow){ g.gx = Math.round(12 + g.gr); g.gy = Math.round(10 + 20 + g.gr); }
        else { g.gx = Math.round(g.x0 - 40 - g.gr); g.gy = Math.round(g.yRim + 26 + g.gr); }
        g.probeY = Math.round(g.yF - g.hs - 14);
        g.handleW = Math.round(clamp(g.iw * 0.3, 56, 96));
        // the plate and the tray
        if(g.narrow){
          g.px = Math.round(Math.max(g.gx + g.gr + 16, (W - pm.w) / 2 + 30)); if(g.px + pm.w > W - 8) g.px = W - 8 - pm.w; g.py = 8;
          g.trayY = g.yb + 18; g.trayX = Math.round(W / 2 - trayW(g) / 2);
        } else {
          var rx0 = g.portX + 40, rx1 = W - 24, mid = (rx0 + rx1) / 2;
          g.px = Math.round(clamp(mid - pm.w / 2, rx0, rx1 - pm.w)); g.py = Math.round(g.yRim + 10);
          g.trayX = Math.round(clamp(mid - trayW(g) / 2, rx0, rx1 - trayW(g))); g.trayY = g.yb + 34 - g.wh - 22;
        }
        // particle scales: the largest that holds the gas cap at VMIN with clear space between molecules
        g.rs = RX.map(function(rr){ return slotsFor(g, rr); });
        g.gasSlots = g.rs[S.ri].gas; g.lumpSlots = lumpSlots(g);
        return g;
      }
      function trayW(g){ return 3 * g.wellW() + 4 * 12; }
      // the slots a reaction's gas particles take: a staggered grid over the gas column, in fractions of its height
      function gasH(g, r, V){ return (r.id === 'ab' ? g.tot : g.tot - g.hs) * V / VMAX; }
      function gasFloor(g, r){ return r.id === 'ab' ? g.yF : g.yF - g.hs; }
      function slotsFor(g, r){
        var keys = r.species.filter(function(s){ return s.phase === 'g'; }).map(function(s){ return s.key; });
        var mw = 0, mh = 0, md = 0; keys.forEach(function(k){ var e = extent(k); mw = Math.max(mw, e.w); mh = Math.max(mh, e.h); md = Math.max(md, e.d); });
        var need = r.gasCap + 4, hMin = gasH(g, r, VMIN) - 8, wIn = g.iw - 10;
        for(var s = 1.05; s > 0.3; s -= 0.01){
          var gap = 0.6 * md * s, cw = mw * s + gap, ch = mh * s + gap;
          var cols = Math.floor((wIn - mw * s) / cw) + 1, rows = Math.floor((hMin - mh * s) / ch) + 1;
          if(cols < 2 || rows < 1) continue;
          // staggered rows hold one fewer when the offset does not fit
          var odd = (wIn - mw * s) - (cols - 1) * cw >= cw / 2 ? cols : cols - 1;
          var n = Math.ceil(rows / 2) * cols + Math.floor(rows / 2) * odd;
          if(n >= need){
            var list = [], rr = M.rng(41 + r.id.length * 7);
            for(var row = 0; row < rows; row++){
              var nc = (row & 1) ? odd : cols, off = (row & 1) && nc === cols ? cw / 2 : 0, span = (nc - 1) * cw;
              // each row centred (an odd row of one fewer sits in the gaps of the rows around it)
              var xs = g.cx - span / 2 - off / 2;
              for(var col = 0; col < nc; col++){
                // y as a fraction of the gas column (the piston squeezes the rows together; a small jitter keeps it gas)
                // fractions of the drawn column (gasH − 8): the rows at least a cell apart at VMIN, the edge rows half a
                // molecule in from the floor and the piston
                var fy = rows === 1 ? 0.5 : (mh * s / 2 + row * (hMin - mh * s) / (rows - 1)) / hMin;
                list.push({ x: xs + off + col * cw + (rr() - 0.5) * gap * 0.4, fy: clamp(fy + (rr() - 0.5) * (rows > 1 ? 0.2 * gap / hMin : 0), mh * s / 2 / hMin, 1 - mh * s / 2 / hMin), a: (rr() - 0.5) * 0.1 });
              }
              void span;
            }
            return { s: s, gas: list, hMin: hMin };
          }
        }
        return { s: 0.3, gas: [], hMin: hMin };
      }
      // the floor spots for lumps (two rows)
      function lumpSlots(g){
        var n = Math.floor((g.iw - 8) / (g.lumpW + 4)), out = [], x0 = g.cx - ((n - 1) * (g.lumpW + 4)) / 2;
        for(var row = 0; row < 2; row++) for(var i = 0; i < n; i++) out.push({ x: x0 + i * (g.lumpW + 4) + (row ? (g.lumpW + 4) / 2 * ((i < n - 1) ? 1 : 0) : 0), y: g.yF - 4 - g.lumpH / 2 - row * (g.lumpH + 2) });
        return out.filter(function(p, i){ return !(i >= n && p.x > g.x1 - g.lumpW / 2 - 2); });
      }

      /* ---------------------------------------------------- particles */
      var ps = [], evs = [], raf = 0, lastChange = 0, dirty = false, takeT = 0;
      var needle = { a: null, to: null }, VD = { v: EX.V0, from: EX.V0, to: EX.V0, t0: 0 };
      var gasUse = [], lumpUse = [];
      function sc(){ return G.rs[S.ri].s; }
      function slotPos(i, V){ var r = R(), sl = G.gasSlots[i]; return [sl.x, gasFloor(G, r) - 4 - sl.fy * (gasH(G, r, V) - 8)]; }
      function newP(key, x, y, a){ return { key: key, gas: isGas(key), x: x, y: y, a: a || 0, slot: -1, state: 'rest', counted: true, scale: 1 }; }
      function freeGas(nearX, nearY){
        var best = -1, bd = Infinity;
        G.gasSlots.forEach(function(p, i){ if(gasUse[i]) return; var q = slotPos(i, VD.v), d = nearX == null ? i * 0.001 + Math.abs(q[0] - G.cx) * 0 : Math.hypot(q[0] - nearX, q[1] - nearY); if(d < bd){ bd = d; best = i; } });
        return best;
      }
      function freeGasRandom(seed){ var fr = []; gasUse.forEach(function(u, i){ if(!u) fr.push(i); }); return fr.length ? fr[Math.floor(M.rng(seed)() * fr.length)] : -1; }
      function freeLump(){ for(var i = 0; i < G.lumpSlots.length; i++) if(!lumpUse[i]) return i; return -1; }
      function counts(){
        var r = R(), c = r.species.map(function(){ return 0; });
        ps.forEach(function(p){ if(!p.counted) return; var i = idx(p.key); if(i > -1) c[i]++; });
        return c;
      }
      function layoutAt(c){
        ps = []; evs = []; CV.baseDirty = true;
        gasUse = G.gasSlots.map(function(){ return null; }); lumpUse = G.lumpSlots.map(function(){ return null; });
        var r = R(), order = G.gasSlots.map(function(p, i){ return i; }), rr = M.rng(31 + S.ri * 7);
        for(var i = order.length - 1; i > 0; i--){ var j = Math.floor(rr() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
        var n = 0, ln = 0;
        r.species.forEach(function(s, si){
          for(var q = 0; q < c[si]; q++){
            if(s.phase === 'g'){ var sl = order[n++]; if(sl == null) continue; var p = newP(s.key, 0, 0, G.gasSlots[sl].a); p.slot = sl; gasUse[sl] = p; var xy = slotPos(sl, VD.v); p.x = xy[0]; p.y = xy[1]; ps.push(p); }
            else { var ls = lumpOrder(ln++); if(ls < 0) continue; var lp = newP(s.key, G.lumpSlots[ls].x, G.lumpSlots[ls].y, 0); lp.slot = ls; lumpUse[ls] = lp; ps.push(lp); }
          }
        });
      }
      // lumps fill the bottom row first, alternating sides from the middle
      function lumpOrder(k){ var free = []; G.lumpSlots.forEach(function(p, i){ if(!lumpUse[i]) free.push(i); }); free.sort(function(a, b){ var pa = G.lumpSlots[a], pb = G.lumpSlots[b]; return (pb.y - pa.y) || (Math.abs(pa.x - G.cx) - Math.abs(pb.x - G.cx)); }); return free.length ? free[0] : -1; }
      function restPos(p){ if(p.gas){ var xy = slotPos(p.slot, VD.v); return [xy[0], xy[1], G.gasSlots[p.slot].a]; } var l = G.lumpSlots[p.slot]; return [l.x, l.y, 0]; }

      /* ---- the canvas: sprites in the course's atom look, the lumps, the glows, the needle */
      var CV = { ctx: null, dpr: 1, spr: {}, col: {}, fade: null, base: null, baseDirty: true, box: [0, 0, 0, 0] };
      function cssVar(n){ return getComputedStyle(stage).getPropertyValue(n).trim(); }
      function readColors(){
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        CV.col = { dark: dark, A: '#7DB8EE', B: '#F2A65E', C: '#5A6268', O: '#EE5A4F', edge: dark ? 'rgba(0,0,0,.6)' : 'rgba(20,28,30,.55)',
          q: cssVar('--qk-q') || '#D55E00', ink: getComputedStyle(stage).color || '#10161a', calc0: '#FBFCFD', calc1: '#C9D3DC', lime0: '#EFEADB', lime1: '#BDB59F', hi: cssVar('--qk-dir') || '#0072B2' };
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
        x.fillStyle = 'rgba(11,26,36,' + (CV.col.dark ? 0.28 : 0.2) + ')'; x.fill('evenodd'); x.restore();
        x.save(); x.translate(o - rr * 0.36, o - rr * 0.4); x.rotate(-35 * Math.PI / 180); x.beginPath(); x.ellipse(0, 0, rr * 0.36, rr * 0.24, 0, 0, Math.PI * 2); x.fillStyle = 'rgba(255,255,255,.75)'; x.fill(); x.restore();
        CV.spr[key] = { c: c, h: sz / d / 2 };
        return CV.spr[key];
      }
      function sortT(key){ return TEMPL[key].slice().sort(function(p, q){ return (p.z || 0) - (q.z || 0) || (q.r || 9) - (p.r || 9); }); }
      // a particle's atoms where they are drawn (picture units); a split or join moves them apart or together (p.sep)
      function atomsOf(p){
        var s = sc() * (p.scale || 1), out = [];
        if(p.atomsAt) return p.atomsAt;
        sortT(p.key).forEach(function(at){ var q = rot(at.dx * s, at.dy * s, p.a); out.push({ el: at.el, r: (at.r || 9) * s, x: p.x + q[0], y: p.y + q[1] }); });
        return out;
      }
      function drawP(z, p){
        if(!p.gas){ drawLump(z, p); return; }
        var al = p.alpha == null ? 1 : p.alpha; if(al <= 0) return;
        if(al < 1){ z.save(); z.globalAlpha *= al; }
        atomsOf(p).forEach(function(at){ var sp = sprite(at.el, at.r); z.drawImage(sp.c, at.x - sp.h, at.y - sp.h, sp.h * 2, sp.h * 2); });
        if(al < 1) z.restore();
      }
      // a lump of solid: CaCO₃ a faceted white crystal (calcite), CaO a rounded chalky lump; p.mix (0 to 1) is CaCO₃'s share
      // while one turns into the other
      function drawLump(z, p){
        var w = G.lumpW * (p.scale || 1), h = G.lumpH * (p.scale || 1), x = p.x, y = p.y, mix = p.mix != null ? p.mix : (p.key === 'CaCO3' ? 1 : 0), al = p.alpha == null ? 1 : p.alpha;
        if(al <= 0) return;
        z.save(); z.globalAlpha *= al;
        if(mix < 1){
          z.globalAlpha *= (1 - mix) * (mix > 0 ? 1 : 1);
          z.beginPath(); z.ellipse(x, y + h * 0.06, w * 0.48, h * 0.44, 0, 0, Math.PI * 2);
          var gr = z.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2); gr.addColorStop(0, CV.col.lime0); gr.addColorStop(1, CV.col.lime1);
          z.fillStyle = gr; z.fill(); z.lineWidth = 1; z.strokeStyle = CV.col.edge; z.stroke();
          z.fillStyle = 'rgba(90,80,60,.35)';
          [[-0.2, -0.05], [0.15, 0.12], [0.24, -0.14], [-0.05, 0.2]].forEach(function(d){ z.beginPath(); z.arc(x + d[0] * w, y + d[1] * h, Math.max(1, w * 0.035), 0, Math.PI * 2); z.fill(); });
          z.globalAlpha = al;
        }
        if(mix > 0){
          z.globalAlpha = al * mix;
          var pts = [[-0.5, 0.18], [-0.3, -0.42], [0.22, -0.5], [0.5, -0.12], [0.34, 0.46], [-0.24, 0.5]];
          z.beginPath(); pts.forEach(function(d, i){ var px = x + d[0] * w, py = y + d[1] * h; if(i) z.lineTo(px, py); else z.moveTo(px, py); }); z.closePath();
          var g2 = z.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2); g2.addColorStop(0, CV.col.calc0); g2.addColorStop(1, CV.col.calc1);
          z.fillStyle = g2; z.fill(); z.lineWidth = 1; z.strokeStyle = CV.col.edge; z.stroke();
          // the facets
          z.beginPath(); z.moveTo(x - 0.3 * w, y - 0.42 * h); z.lineTo(x + 0.02 * w, y - 0.02 * h); z.lineTo(x + 0.5 * w, y - 0.12 * h); z.moveTo(x + 0.02 * w, y - 0.02 * h); z.lineTo(x - 0.24 * w, y + 0.5 * h);
          z.strokeStyle = 'rgba(80,100,120,.45)'; z.stroke();
          z.beginPath(); z.moveTo(x - 0.3 * w, y - 0.42 * h); z.lineTo(x + 0.22 * w, y - 0.5 * h); z.lineTo(x + 0.02 * w, y - 0.02 * h); z.closePath(); z.fillStyle = 'rgba(255,255,255,.7)'; z.fill();
        }
        z.restore();
      }
      function paintCanvas(){
        var x = CV.ctx; if(!x || !G) return;
        var d = CV.dpr, bx = CV.box, bw = bx[2] - bx[0], bh = bx[3] - bx[1];
        x.setTransform(d, 0, 0, d, 0, 0);
        x.clearRect(0, 0, bw, bh);
        var fade = CV.fade, alpha = 1;
        if(fade){ var t = (now() - fade.t0) / 300; if(t >= 1){ CV.fade = null; } else if(t < 0.5){ x.globalAlpha = 1 - t * 2; x.drawImage(fade.img, 0, 0, bw, bh); x.globalAlpha = 1; kick(); return; } else alpha = (t - 0.5) * 2; }
        x.translate(-bx[0], -bx[1]);
        x.globalAlpha = alpha;
        // glows of the events under way
        evs.forEach(function(e){ if(e.glowA > 0){ x.beginPath(); x.arc(e.P[0], e.P[1], 22 * sc() + 6, 0, Math.PI * 2); x.fillStyle = 'rgba(255,227,138,' + (0.55 * e.glowA).toFixed(3) + ')'; x.fill(); x.lineWidth = 2; x.strokeStyle = 'rgba(245,184,61,' + e.glowA.toFixed(3) + ')'; x.stroke(); } });
        if(CV.baseDirty){
          var bc = CV.base.getContext('2d'); bc.setTransform(d, 0, 0, d, 0, 0); bc.clearRect(0, 0, bw, bh); bc.translate(-bx[0], -bx[1]);
          ps.forEach(function(p){ if(p.state === 'rest') drawP(bc, p); });
          CV.baseDirty = false;
        }
        x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = alpha; x.drawImage(CV.base, 0, 0); x.restore();
        x.globalAlpha = alpha;
        // the picked particle's ring (a tap or drag that takes it out)
        if(pick && pick.p){ var pp = pick.p, rr = pp.gas ? Math.max(extent(pp.key).w, extent(pp.key).h) * sc() / 2 + 5 : G.lumpW * 0.62; x.beginPath(); x.arc(pp.x, pp.y, rr, 0, Math.PI * 2); x.lineWidth = 2.5; x.strokeStyle = CV.col.hi; x.stroke(); }
        ps.forEach(function(p){ if(p.state !== 'rest') drawP(x, p); });
        evs.forEach(function(e){ if(e.extra) e.extra.forEach(function(p){ drawP(x, p); }); });
        // the needle
        x.save(); x.translate(G.gx, G.gy); x.rotate(needle.a == null ? Math.PI : needle.a); x.beginPath(); x.moveTo(0, -2.6); x.lineTo(G.gr * 0.86, 0); x.lineTo(0, 2.6); x.closePath(); x.fillStyle = CV.col.q; x.fill(); x.restore();
        x.beginPath(); x.arc(G.gx, G.gy, 4.2, 0, Math.PI * 2); x.fillStyle = CV.col.ink; x.fill();
        x.globalAlpha = 1;
        if(CV.fade) kick();
      }
      function angOf(q){
        var r = R(), lk = Math.log10(r.Kval), lo = lk - DSPAN, hi = lk + DSPAN;
        var f = q !== q ? 0.5 : q <= 0 ? -0.04 : !isFinite(q) ? 1.04 : clamp((Math.log10(q) - lo) / (hi - lo), -0.04, 1.04);
        return Math.PI + f * Math.PI;
      }

      /* ---------------------------------------------------- the still scene */
      var L = {};
      function mkSvg(tag, cls, attrs){ var e = document.createElementNS(NS, tag); if(cls) e.setAttribute('class', cls); for(var k in attrs) e.setAttribute(k, attrs[k]); return e; }
      function cylPath(){ var g = G, rr = 10, x0 = g.x0 - 4, x1 = g.x1 + 4, y0 = g.yRim, y1 = g.yF + 4; return 'M' + x0 + ' ' + y0 + 'V' + (y1 - rr) + 'Q' + x0 + ' ' + y1 + ' ' + (x0 + rr) + ' ' + y1 + 'H' + (x1 - rr) + 'Q' + x1 + ' ' + y1 + ' ' + x1 + ' ' + (y1 - rr) + 'V' + y0; }
      function drawStatic(){
        var g = G, r = R(), W = g.W, H = g.H, p = [], f = [];
        p.push('<defs><linearGradient id="qk2g-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="qk2s-wall0"/><stop offset="1" class="qk2s-wall1"/></linearGradient>' +
          '<linearGradient id="qk2g-bench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="qk2s-bn0"/><stop offset="1" class="qk2s-bn1"/></linearGradient>' +
          '<linearGradient id="qk2g-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="qk2s-gl1"/><stop offset=".35" class="qk2s-gl0"/><stop offset="1" class="qk2s-gl1"/></linearGradient>' +
          '<linearGradient id="qk2g-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="qk2s-st0"/><stop offset=".45" class="qk2s-st1"/><stop offset="1" class="qk2s-st0"/></linearGradient>' +
          '<radialGradient id="qk2g-heat" cx=".5" cy=".5" r=".5"><stop offset="0" class="qk2s-ht0"/><stop offset="1" class="qk2s-ht1"/></radialGradient></defs>');
        p.push('<rect class="qk2-wall" x="0" y="0" width="' + W + '" height="' + g.yb + '"/>');
        for(var ty = 46; ty < g.yb; ty += 58) p.push('<path class="qk2-grout" d="M0 ' + ty + 'H' + W + '"/>');
        p.push('<rect class="qk2-bench" x="0" y="' + g.yb + '" width="' + W + '" height="' + (H - g.yb) + '"/><path class="qk2-benchedge" d="M0 ' + (g.yb + 0.5) + 'H' + W + '"/>');
        // the stand under the cylinder; for CaCO₃ a hot plate glowing (800 °C)
        p.push('<ellipse class="qk2-shadow" cx="' + g.cx + '" cy="' + (g.yb + 5) + '" rx="' + Math.round(g.iw * 0.62) + '" ry="7"/>');
        p.push('<rect class="qk2-foot' + (r.id === 'caco3' ? ' is-hot' : '') + '" x="' + (g.x0 - 16) + '" y="' + (g.yF + 4) + '" width="' + (g.iw + 32) + '" height="' + (g.yb - g.yF - 4) + '" rx="4"/>');
        if(r.id === 'caco3') p.push('<ellipse class="qk2-heat" cx="' + g.cx + '" cy="' + (g.yF - 6) + '" rx="' + Math.round(g.iw * 0.6) + '" ry="' + Math.round(g.hs * 0.9) + '"/>');
        // the glass: body, the port tube and its funnel on the right, the dial's tube on the left
        p.push('<path class="qk2-glassbody" d="' + cylPath() + 'Z"/>');
        var py = g.portY, pt = 7;
        p.push('<path class="qk2-tube" d="M' + (g.x1 + 3) + ' ' + (py - pt) + 'H' + (g.portX - 6) + 'L' + (g.portX + 4) + ' ' + (py - pt - 10) + 'M' + (g.x1 + 3) + ' ' + (py + pt) + 'H' + (g.portX - 6) + 'L' + (g.portX + 4) + ' ' + (py + pt + 10) + '"/>');
        p.push('<rect class="qk2-cock" x="' + Math.round(g.x1 + g.portL * 0.42 - 5) + '" y="' + (py - pt - 6) + '" width="10" height="' + (2 * pt + 12) + '" rx="3"/>');
        // the dial: a face, a log scale (each tick ×10), K as a notch, "Q" under the hub
        var gx = g.gx, gy = g.gy, gr = g.gr;
        var cx0 = g.narrow ? Math.round(g.x0 - 16) : gx;
        p.push('<path class="qk2-cable" d="M' + gx + ' ' + Math.round(gy + gr * 0.62) + (g.narrow ? 'V' + Math.round(gy + gr * 0.62 + 12) + 'H' + cx0 : '') + 'V' + (g.probeY - 10) + 'Q' + cx0 + ' ' + g.probeY + ' ' + (cx0 + 10) + ' ' + g.probeY + 'H' + (g.x0 - 4) + '"/><rect class="qk2-probe" x="' + (g.x0 - 9) + '" y="' + (g.probeY - 5) + '" width="12" height="10" rx="2"/>');
        p.push('<path class="qk2-dial" d="M' + f1(gx - gr) + ' ' + f1(gy + gr * 0.62) + 'V' + gy + 'A' + gr + ' ' + gr + ' 0 0 1 ' + f1(gx + gr) + ' ' + gy + 'V' + f1(gy + gr * 0.62) + 'Z"/>');
        // ticks at K ÷ 4, ÷ 2, K, × 2, × 4 (each tick twice the last)
        for(var dd = -2; dd <= 2; dd++){ if(!dd) continue; var a = angOf(r.Kval * Math.pow(2, dd)), c1 = rot(gr * 0.78, 0, a), c2 = rot(gr * 0.93, 0, a); p.push('<path class="qk2-tick" d="M' + f1(gx + c1[0]) + ' ' + f1(gy + c1[1]) + 'L' + f1(gx + c2[0]) + ' ' + f1(gy + c2[1]) + '"/>'); }
        var ka = angOf(r.Kval), k1 = rot(gr * 0.6, 0, ka), k2 = rot(gr * 1.0, 0, ka);
        p.push('<path class="qk2-knotch" d="M' + f1(gx + k1[0]) + ' ' + f1(gy + k1[1]) + 'L' + f1(gx + k2[0]) + ' ' + f1(gy + k2[1]) + '"/>');
        p.push('<text class="qk2-klab" x="' + gx + '" y="' + f1(gy - gr - 7) + '" text-anchor="middle">K</text>');
        p.push('<text class="qk2-qlab" x="' + gx + '" y="' + f1(gy + gr * 0.5) + '" text-anchor="middle">Q</text>');
        if(!g.narrow) p.push('<text class="qk2-dlo" x="' + f1(gx - gr + 3) + '" y="' + f1(gy + gr * 0.5) + '">low</text><text class="qk2-dhi" x="' + f1(gx + gr - 3) + '" y="' + f1(gy + gr * 0.5) + '" text-anchor="end">high</text>');
        // the piston (moved by its transform), its rod and the T handle
        p.push('<g class="qk2-piston"><rect class="qk2-rod" x="' + (g.cx - 5) + '" y="' + (-12 - g.stem) + '" width="10" height="' + g.stem + '"/>' +
          '<rect class="qk2-handle" x="' + Math.round(g.cx - g.handleW / 2) + '" y="' + (-12 - g.stem - 6) + '" width="' + g.handleW + '" height="12" rx="6"/>' +
          '<rect class="qk2-plate" x="' + (g.x0 + 1) + '" y="-12" width="' + (g.iw - 2) + '" height="12" rx="2"/><path class="qk2-seal" d="M' + (g.x0 + 2) + ' -3H' + (g.x1 - 2) + '"/></g>');
        // the lip of the open top
        p.push('<rect class="qk2-cap" x="' + (g.x0 - 9) + '" y="' + (g.yRim - 3) + '" width="' + (g.iw + 18) + '" height="7" rx="3"/>');
        // the plate on the wall (wide) or across the top (narrow): the equation, the arrow, K and the scale
        var pm = g.pm;
        p.push('<rect class="qk2-plateshadow" x="' + (g.px + 2) + '" y="' + (g.py + 3) + '" width="' + pm.w + '" height="' + pm.h + '" rx="8"/><rect class="qk2-card" x="' + g.px + '" y="' + g.py + '" width="' + pm.w + '" height="' + pm.h + '" rx="8"/>');
        p.push('<g class="qk2-book"></g>');
        // the tray: three cups, each with what it adds and its name
        p.push('<g class="qk2-tray"></g>');
        // over the canvas: the glass rim, the shine, the volume marks
        f.push('<path class="qk2-glassrim" d="' + cylPath() + '"/>');
        f.push('<path class="qk2-shine" d="M' + (g.x0 + 9) + ' ' + (g.yRim + 16) + 'V' + (g.yF - 14) + '"/>');
        VOL.forEach(function(v){ var y = Math.round(gasFloor(g, r) - gasH(g, r, v)); f.push('<path class="qk2-mark" d="M' + (g.x1 - 10) + ' ' + y + 'H' + (g.x1 + 2) + '"/>'); });
        svg.innerHTML = p.join('');
        front.innerHTML = f.join('');
        front.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        L.piston = svg.querySelector('.qk2-piston'); L.book = svg.querySelector('.qk2-book'); L.tray = svg.querySelector('.qk2-tray');
        drawPlate(); drawTray();
      }
      function drawPlate(){
        var g = G, pm = g.pm, r = R(), x0 = g.px + pm.pad, w = pm.w - 2 * pm.pad;
        L.book.innerHTML = '';
        var t1 = mkSvg('text', 'qk2-eqn', { x: f1(x0 + w / 2), y: pm.y1 + g.py, 'text-anchor': 'middle' }); t1.style.fontSize = pm.fs.eq + 'px'; t1.innerHTML = svgChem(eqText(r)); L.book.appendChild(t1);
        // the arrow under the ⇌: centered on it, as long as the gap allows
        var eq = eqText(r), iL = eq.indexOf('⇌'), wAll = measure(eq, pm.fs.eq, 900), wL = measure(eq.slice(0, iL), pm.fs.eq, 900), wS = measure('⇌', pm.fs.eq, 900);
        var ax = x0 + w / 2 - wAll / 2 + wL + wS / 2, ay = g.py + pm.ya, half = Math.round(clamp(wAll * 0.28, 34, 70));
        L.arrowX = [ax - half, ax + half]; L.arrowY = ay;
        var gA = mkSvg('g', 'qk2-arrows', {});
        gA.innerHTML = '<path class="qk2-ar is-fwd" d="M' + f1(ax - half) + ' ' + ay + 'H' + f1(ax + half - 8) + '"/><path class="qk2-arh is-fwd" d="M' + f1(ax + half - 12) + ' ' + (ay - 8) + 'L' + f1(ax + half + 1) + ' ' + ay + 'L' + f1(ax + half - 12) + ' ' + (ay + 8) + 'Z"/>' +
          '<path class="qk2-ar is-rev" d="M' + f1(ax + half) + ' ' + ay + 'H' + f1(ax - half + 8) + '"/><path class="qk2-arh is-rev" d="M' + f1(ax - half + 12) + ' ' + (ay - 8) + 'L' + f1(ax - half - 1) + ' ' + ay + 'L' + f1(ax - half + 12) + ' ' + (ay + 8) + 'Z"/>' +
          '<path class="qk2-ar2 is-eq" d="M' + f1(ax - half + 7) + ' ' + ay + 'H' + f1(ax + half - 7) + '"/><path class="qk2-arh2 is-eq" d="M' + f1(ax + half - 8) + ' ' + (ay - 5) + 'L' + f1(ax + half) + ' ' + ay + 'L' + f1(ax + half - 8) + ' ' + (ay + 5) + 'M' + f1(ax - half + 8) + ' ' + (ay - 5) + 'L' + f1(ax - half) + ' ' + ay + 'L' + f1(ax - half + 8) + ' ' + (ay + 5) + '"/>';
        L.book.appendChild(gA); L.arrows = gA;
        var t2 = mkSvg('text', 'qk2-kline', { x: f1(x0 + w / 2), y: pm.y2 + g.py, 'text-anchor': 'middle' }); t2.style.fontSize = pm.fs.k + 'px';
        t2.innerHTML = 'K<tspan class="qk2-sub" dy="0.28em">' + (r.K === 'Kp' ? 'p' : 'c') + '</tspan><tspan dy="-0.28em"> = ' + esc(String(r.Kval)) + (r.T ? ' at ' + esc(r.T) : '') + '</tspan>'; L.book.appendChild(t2);
        var t3 = mkSvg('text', 'qk2-key', { x: f1(x0 + w / 2), y: pm.y3 + g.py, 'text-anchor': 'middle' }); t3.style.fontSize = pm.fs.key + 'px'; t3.innerHTML = svgChem(r.perText); L.book.appendChild(t3);
      }
      function wells(){
        var g = G, items = R().id === 'ab' ? R().species : [R().species[2], R().species[0], R().species[1]], ww = g.wellW(), out = [];
        items.forEach(function(s, i){ out.push({ s: s, x: g.trayX + 12 + i * (ww + 12), y: g.trayY, w: ww, h: g.wh }); });
        return out;
      }
      function drawTray(){
        var g = G, tw = trayW(g), ws = wells();
        L.tray.innerHTML = '<rect class="qk2-trayb" x="' + g.trayX + '" y="' + (g.trayY - 8) + '" width="' + tw + '" height="' + (g.wh + 30) + '" rx="10"/>';
        ws.forEach(function(wl){
          L.tray.insertAdjacentHTML('beforeend', '<rect class="qk2-well" x="' + wl.x + '" y="' + wl.y + '" width="' + wl.w + '" height="' + wl.h + '" rx="8"/>');
          var t = mkSvg('text', 'qk2-wlab', { x: f1(wl.x + wl.w / 2), y: wl.y + wl.h + 17, 'text-anchor': 'middle' }); t.innerHTML = svgChem(wl.s.html); L.tray.appendChild(t);
        });
        L.wells = ws;
      }
      function pistonY(V){ return Math.round((gasFloor(G, R()) - gasH(G, R(), V)) * 10) / 10; }
      function paintPiston(){ if(L.piston) L.piston.setAttribute('transform', 'translate(0 ' + f1(pistonY(VD.v)) + ')'); }

      /* ---- the tray's sprites (drawn into the well buttons) and the cluster carried by a drag */
      function clusterCanvas(key, n, big){
        var s = sc() * (big || 1), gas = isGas(key), c = document.createElement('canvas'), d = CV.dpr, e = gas ? extent(key) : null;
        var w = gas ? (e.w * s + 4) * (n > 1 ? 1.75 : 1) : G.lumpW * 1.1, h = gas ? (e.h * s + 6) * (n > 1 ? 3.1 : 1) : G.lumpH * 1.2;
        w = Math.ceil(w + 6); h = Math.ceil(h + 6);
        c.width = Math.round(w * d); c.height = Math.round(h * d); c.style.width = w + 'px'; c.style.height = h + 'px';
        var x = c.getContext('2d'); x.scale(d, d);
        var pos = n > 1 ? [[0.34, 0.25], [0.62, 0.5], [0.38, 0.77]] : [[0.5, 0.5]];
        pos.slice(0, n).forEach(function(q, i){ var p = newP(key, q[0] * w, q[1] * h, (i === 1 ? -0.18 : 0.12 * (i ? 1 : -1))); if(!gas){ p.x = w / 2; p.y = h / 2; } p.scale = big || 1; drawP(x, p); });
        return c;
      }

      /* ---------------------------------------------------- the readouts, from what is drawn */
      var shown = null, lastKey = '';
      function paintReadouts(force){
        var r = R(), c = counts(), V = VD.v, q = Qof(r, c, V), key = c.join(',') + '|' + V.toFixed(4);
        if(!force && key === lastKey) return;
        lastKey = key;
        var dir = 0, at = false, stuck = '';
        if(q === q){
          if(same(q, r.Kval)) at = true;
          else { dir = q < r.Kval ? 1 : -1; var nd = nextDir(r, c, V); if(!nd){ at = true; stuck = why0(r, c, dir); } }
        }
        var near = q === q && Math.abs(Math.log(q / r.Kval)) <= Math.log(1.2);
        shown = { c: c, V: V, q: q, dir: dir, at: at, near: near, stuck: stuck };
        needle.to = angOf(q); if(needle.a == null) needle.a = needle.to;
        // the arrow under the equation: the way it runs, thicker the farther Q is from K; a thin two headed arrow when
        // there is no net change
        var run = q === q && !at ? dir : 0, far = run ? clamp(dist(r, q) / Math.log(4), 0, 1) : 0;
        L.arrows.setAttribute('data-dir', q !== q ? 'none' : run > 0 ? 'fwd' : run < 0 ? 'rev' : 'eq');
        L.arrows.style.setProperty('--qk-aw', f1(3 + 5 * far));
        if(slider) slider.place();
        paintCause(); kick();
        again.hidden = sameAsStart();
      }
      // why no whole event brings Q nearer: a species is gone, the cylinder is full, or one more event overshoots
      function why0(r, c, dir){
        for(var i = 0; i < c.length; i++){ var s = r.species[i]; if(c[i] + dir * s.nu < 0) return 'no ' + s.html + ' left'; }
        if(!can(r, c, dir)) return 'the cylinder is full';
        var prod = r.species.filter(function(s){ return dir > 0 ? s.nu > 0 : s.nu < 0; });
        var g0 = prod.filter(function(s){ return s.phase === 'g'; })[0] || prod[0];
        return '1 more ' + (r.id === 'caco3' ? (dir > 0 ? 'CO₂ out' : 'CO₂ in') : g0.html) + ' overshoots';
      }
      function sameAsStart(){ var c = counts(), r = R(); return Math.abs(VD.v - EX.V0) < 1e-6 && S.V === EX.V0 && c.every(function(n, i){ return n === r.n0[i]; }) && !evs.length; }
      function actPill(){
        var a = S.act; if(!a) return null;
        if(a.kind === 'vol') return { t: 'volume ' + a.V.toFixed(2) + ' L', role: 'act' };
        return { t: (a.d > 0 ? 'added ' : 'removed ') + (a.n > 1 || isGas(a.key) ? a.n + ' ' : '') + plainName(a.key) + (isGas(a.key) ? '' : ' (solid)'), role: 'act' };
      }
      function plainName(key){ var i = idx(key); return i > -1 ? R().species[i].html : key; }
      function paintCause(){
        var r = R(), s = shown, K0 = 'K ' + r.Kval, parts = [], a = actPill();
        clearTimeout(takeT);
        if(a) parts.push(a);
        // once it has settled after running, the chain keeps the way it ran (added 3 B → ran forward → Q ≈ K)
        if(s.at && S.ran) parts.push({ t: S.ran > 0 ? 'ran forward' : 'ran back', role: 'dir' });
        if(s.q !== s.q){ parts.push({ t: 'Q has no value', role: 'q' }); parts.push({ t: 'nothing can react', role: 'dir' }); }
        else if(S.solidAct && S.act && !isGas(S.act.key)){
          parts.push({ t: 'Q stays ' + fq(s.q), role: 'q' }); parts.push({ t: 'solids are not in Q', role: 'dir' });
        } else if(s.at){
          if(same(s.q, r.Kval) || (s.near && !s.stuck)) { var eq0 = same(s.q, r.Kval); parts.push({ t: 'Q ' + fq(s.q), role: 'q' }); parts.push({ t: (eq0 ? '= ' : '≈ ') + K0, role: 'k', say: (eq0 ? 'equal to ' : 'about equal to ') + K0 }); if(!S.ran) parts.push({ t: 'no net change', role: 'dir' }); }
          else { parts.push({ t: 'Q ' + fq(s.q), role: 'q' }); parts.push({ t: (s.q < r.Kval ? '< ' : '> ') + K0, role: 'k', say: (s.q < r.Kval ? 'less than ' : 'greater than ') + K0 }); parts.push({ t: s.stuck, role: 'dir' }); }
        } else {
          parts.push({ t: 'Q ' + fq(s.q), role: 'q' }); parts.push({ t: (s.q < r.Kval ? '< ' : '> ') + K0, role: 'k', say: (s.q < r.Kval ? 'less than ' : 'greater than ') + K0 });
          parts.push({ t: s.dir > 0 ? 'runs forward' : 'runs back', role: 'dir', say: s.dir > 0 ? 'runs forward, toward products' : 'runs back, toward reactants' });
        }
        cause.set(parts, a ? '' : 'Start:');
      }
      function settled(){
        if(!shown) return;
        say(cause.text());
        clearTimeout(takeT);
        if(S.mode !== 'explore' || !S.act) return;
        var take = S.solidAct && !isGas(S.act.key) ? 'A pure solid is left out of Q, so adding or removing it changes nothing.' : shown.at && shown.near ? 'The reaction always runs toward Q = K.' : null;
        if(take) takeT = setTimeout(function(){ if(!busy() && shown && (shown.at || S.solidAct)) cause.take(take); }, 1100);
      }

      /* ---------------------------------------------------- events: particles going in or out, reactions */
      function busy(){ return evs.length > 0 || flights > 0; }
      var flights = 0, evSeed = 1;
      function inner(x, y){ return x > G.x0 + 1 && x < G.x1 - 1 && y < G.yF && y > pistonY(VD.v); }
      // a particle going in through the port: from the funnel's mouth along the tube to its slot; it counts once it is
      // inside the glass
      function enter(key, delay){
        var gas = isGas(key), sl = gas ? freeGasRandom(900 + (evSeed++) * 13) : lumpOrder(0);
        if(sl < 0) return false;
        var p = newP(key, G.portX + 4, G.portY, 0); p.state = 'enter'; p.counted = false; p.slot = sl; p.alpha = 0;
        if(gas) gasUse[sl] = p; else lumpUse[sl] = p;
        ps.push(p);
        evs.push({ type: 'enter', p: p, t0: now() + (delay || 0), dur: gas ? 700 : 800 });
        return true;
      }
      function leave(p, delay){
        p.state = 'leave';
        CV.baseDirty = true;
        evs.push({ type: 'leave', p: p, t0: now() + (delay || 0), dur: 700, from: [p.x, p.y, p.a] });
      }
      function stepIO(e, tn){
        var t = clamp((tn - e.t0) / e.dur, 0, 1), p = e.p, mouth = [G.portX + 4, G.portY], gate = [G.x1 - 2, G.portY];
        if(tn < e.t0) return;
        if(e.type === 'enter'){
          var to = restPos(p);
          if(t < 0.35){ var u = t / 0.35; p.alpha = Math.min(1, u * 3); p.x = lerp(mouth[0], gate[0] - 6, u); p.y = mouth[1]; }
          else { var v = ease((t - 0.35) / 0.65); p.alpha = 1; p.x = lerp(gate[0] - 6, to[0], v); p.y = lerp(gate[1], to[1], v); p.a = lerp(0, to[2], v); }
          // it counts once it is drawn inside the glass
          if(!p.counted && p.x < G.x1 - 1){ p.counted = true; paintReadouts(); }
          if(t >= 1){ p.x = to[0]; p.y = to[1]; p.a = to[2]; p.state = 'rest'; p.alpha = 1; CV.baseDirty = true; e.done = true; }
        } else {
          if(t < 0.6){ var w = ease(t / 0.6); p.x = lerp(e.from[0], gate[0] - 6, w); p.y = lerp(e.from[1], gate[1], w); p.a = lerp(e.from[2], 0, w); }
          else { var z = (t - 0.6) / 0.4; p.x = lerp(gate[0] - 6, mouth[0], z); p.y = mouth[1]; p.alpha = 1 - Math.max(0, (z - 0.4) / 0.6); }
          if(p.counted && p.x >= G.x1 - 1){ p.counted = false; if(p.gas) gasUse[p.slot] = null; else lumpUse[p.slot] = null; paintReadouts(); }
          if(t >= 1){ var i = ps.indexOf(p); if(i > -1) ps.splice(i, 1); e.done = true; }
        }
      }
      /* One reaction event. A + B: forward, an A and a B meet and join (a short glow) and the AB takes one of their places;
         back, an AB splits and its A and B move apart to two places. CaCO₃: back, a CO₂ goes down into a CaO lump, which
         turns to CaCO₃; forward, a CO₂ comes out of a CaCO₃ lump, which turns to CaO. The old particles count until the
         middle of the event (t = 0.475), the new ones from then. */
      function launch(dir){
        var r = R(), e = { type: 'rx', dir: dir, t0: now(), dur: 840, formed: false };
        if(!S.ran) S.ran = dir;
        if(r.id === 'ab'){
          if(dir > 0){
            var a = pickRest('A'), b = a ? nearestRest('B', a.x, a.y) : null; if(!a || !b) return false;
            a.state = b.state = 'busy'; CV.baseDirty = true;
            var P = [(a.x + b.x) / 2, (a.y + b.y) / 2];
            e.ins = [a, b]; e.P = P; e.from = [[a.x, a.y], [b.x, b.y]];
            var ab = newP('AB', P[0], P[1], 0); ab.state = 'form'; ab.counted = false; ab.slot = b.slot; e.out = [ab];
            gasUse[a.slot] = null; gasUse[b.slot] = ab;
          } else {
            var m = pickRest('AB'); if(!m) return false;
            var s2 = freeGas(m.x, m.y); if(s2 < 0) return false;
            m.state = 'busy'; CV.baseDirty = true;
            e.ins = [m]; e.P = [m.x, m.y];
            var pa = newP('A', m.x, m.y, 0), pb = newP('B', m.x, m.y, 0); pa.state = pb.state = 'form'; pa.counted = pb.counted = false;
            pa.slot = m.slot; pb.slot = s2; gasUse[m.slot] = pa; gasUse[s2] = pb; e.out = [pa, pb];
          }
        } else {
          if(dir < 0){
            var co = pickRest('CO2'), lu = co ? nearestRest('CaO', co.x, co.y) : null; if(!co || !lu) return false;
            co.state = 'busy'; lu.state = 'busy'; CV.baseDirty = true;
            e.ins = [co, lu]; e.P = [lu.x, lu.y]; e.from = [[co.x, co.y, co.a]];
            gasUse[co.slot] = null;
          } else {
            var cc = pickRest('CaCO3'); if(!cc) return false;
            var gs = freeGas(cc.x, cc.y - 40); if(gs < 0) return false;
            cc.state = 'busy'; CV.baseDirty = true;
            e.ins = [cc]; e.P = [cc.x, cc.y];
            var nc = newP('CO2', cc.x, cc.y, 0); nc.state = 'form'; nc.counted = false; nc.slot = gs; nc.alpha = 0; gasUse[gs] = nc; e.out = [nc];
          }
        }
        evs.push(e);
        return true;
      }
      function restList(key){ return ps.filter(function(p){ return p.key === key && p.state === 'rest' && p.counted; }); }
      function pickRest(key){ var l = restList(key); return l.length ? l[Math.floor(M.rng(1000 + (evSeed++) * 17)() * l.length)] : null; }
      function nearestRest(key, x, y){ var best = null, bd = Infinity; restList(key).forEach(function(p){ var d = Math.hypot(p.x - x, p.y - y); if(d < bd){ bd = d; best = p; } }); return best; }
      function stepRx(e, tn){
        var t = clamp((tn - e.t0) / e.dur, 0, 1), r = R();
        e.glowA = 0.75 * Math.sin(Math.PI * clamp((t - 0.36) / 0.26, 0, 1));
        if(r.id === 'ab'){
          if(e.dir > 0){
            var a = e.ins[0], b = e.ins[1], s = sc(), d = 9 * s;
            // the two meet: A to the left of the point, B to the right, a bond length apart at the middle
            var u = ease(clamp(t / 0.475, 0, 1));
            if(!e.formed){
              a.x = lerp(e.from[0][0], e.P[0] - d, u); a.y = lerp(e.from[0][1], e.P[1], u); b.x = lerp(e.from[1][0], e.P[0] + d, u); b.y = lerp(e.from[1][1], e.P[1], u);
              a.a = b.a = 0;
            }
            if(t >= 0.475 && !e.formed){ e.formed = true; [a, b].forEach(function(p){ var i = ps.indexOf(p); if(i > -1) ps.splice(i, 1); }); var ab = e.out[0]; ab.counted = true; ab.state = 'move'; ab.x = e.P[0]; ab.y = e.P[1]; ps.push(ab); paintReadouts(); }
            if(e.formed){ var ab2 = e.out[0], to = restPos(ab2), v = ease(clamp((t - 0.55) / 0.45, 0, 1)); ab2.x = lerp(e.P[0], to[0], v); ab2.y = lerp(e.P[1], to[1], v); ab2.a = lerp(0, to[2], v); }
          } else {
            var m = e.ins[0], s3 = sc();
            if(!e.formed){ var sp = ease(clamp(t / 0.475, 0, 1)); m.atomsAt = null; var base = restPos(m); m.x = base[0]; m.y = base[1]; m.a = lerp(base[2], 0, sp); e.P = [m.x, m.y];
              // the bond stretches
              var dd = 9 * s3 * (1 + 0.5 * sp); m.atomsAt = [{ el: 'A', r: 9 * s3, x: m.x - dd, y: m.y }, { el: 'B', r: 9 * s3, x: m.x + dd, y: m.y }]; m.state = 'busy2'; }
            if(t >= 0.475 && !e.formed){ e.formed = true; var i2 = ps.indexOf(m); if(i2 > -1) ps.splice(i2, 1); e.out.forEach(function(p){ p.counted = true; p.state = 'move'; ps.push(p); }); paintReadouts(); }
            if(e.formed){ var w = ease(clamp((t - 0.5) / 0.5, 0, 1)), dd2 = 9 * s3 * 1.5;
              e.out.forEach(function(p, k){ var to2 = restPos(p), sx = e.P[0] + (k ? dd2 : -dd2); p.x = lerp(sx, to2[0], w); p.y = lerp(e.P[1], to2[1], w); p.a = to2[2] * w; }); }
          }
        } else {
          if(e.dir < 0){
            var co = e.ins[0], lu = e.ins[1];
            var u2 = ease(clamp(t / 0.475, 0, 1));
            if(!e.formed){ co.x = lerp(e.from[0][0], lu.x, u2); co.y = lerp(e.from[0][1], lu.y - G.lumpH * 0.2, u2); co.a = lerp(e.from[0][2], 0, u2); co.alpha = 1 - clamp((t - 0.3) / 0.175, 0, 1) * 0.6; }
            if(t >= 0.475 && !e.formed){ e.formed = true; var i3 = ps.indexOf(co); if(i3 > -1) ps.splice(i3, 1); lu.key = 'CaCO3'; paintReadouts(); }
            lu.mix = clamp((t - 0.36) / 0.26, 0, 1);
          } else {
            var cc = e.ins[0], nc = e.out[0];
            cc.mix = 1 - clamp((t - 0.36) / 0.26, 0, 1);
            if(t >= 0.475 && !e.formed){ e.formed = true; cc.key = 'CaO'; nc.counted = true; nc.state = 'move'; ps.push(nc); paintReadouts(); }
            if(e.formed){ var to3 = restPos(nc), v3 = ease(clamp((t - 0.475) / 0.525, 0, 1)); nc.alpha = clamp(0.4 + (t - 0.475) / 0.15, 0, 1); nc.x = lerp(cc.x, to3[0], v3); nc.y = lerp(cc.y - G.lumpH * 0.2, to3[1], v3); nc.a = to3[2] * v3; }
          }
        }
        if(t >= 1){
          e.done = true; e.glowA = 0; CV.baseDirty = true;
          if(e.out) e.out.forEach(function(p){ p.state = 'rest'; var to = restPos(p); p.x = to[0]; p.y = to[1]; p.a = to[2]; p.alpha = 1; });
          e.ins.forEach(function(p){ if(!p.gas){ p.state = 'rest'; p.mix = null; p.alpha = 1; } });
        }
      }
      // the net events on their way and not yet formed
      function pendingC(){
        var r = R(), c = counts();
        evs.forEach(function(e){ if(e.type === 'rx' && !e.formed) r.species.forEach(function(s, i){ c[i] += e.dir * s.nu; }); });
        // particles still on their way in count already; those on their way out are gone
        evs.forEach(function(e){ if(e.type === 'enter' && !e.p.counted){ c[idx(e.p.key)]++; } if(e.type === 'leave' && e.p.counted){ c[idx(e.p.key)]--; } });
        return c;
      }
      function kick(){ if(!raf) raf = requestAnimationFrame(frame); }
      function frame(){
        raf = 0;
        var tn = now(), r = R();
        // the piston glides to its volume; the gas particles at rest follow it (they fill the space it leaves)
        if(VD.v !== VD.to){
          var u = clamp((tn - VD.t0) / 360, 0, 1); VD.v = u >= 1 ? VD.to : lerp(VD.from, VD.to, ease(u));
          CV.baseDirty = true; paintPiston();
          ps.forEach(function(p){ if(p.state === 'rest' && p.gas){ var xy = slotPos(p.slot, VD.v); p.x = xy[0]; p.y = xy[1]; } });
          paintReadouts();
          if(VD.v === VD.to) lastChange = tn;
        }
        // the reaction: once nothing is going in or out and the piston has stopped (a third of a second after the last
        // change), one event at a time toward K, the next starting as the last forms
        var io = evs.some(function(e){ return e.type !== 'rx'; }), rxOn = evs.filter(function(e){ return e.type === 'rx'; });
        if(!io && VD.v === VD.to && tn - lastChange > 340 && rxOn.every(function(e){ return e.formed; }) && rxOn.length < 2){
          var d = nextDir(r, pendingC(), VD.v);
          if(d) launch(d);
        }
        evs.forEach(function(e){ if(e.type === 'rx') stepRx(e, tn); else stepIO(e, tn); });
        evs = evs.filter(function(e){ return !e.done; });
        if(needle.to != null){ var dn = needle.to - needle.a; needle.a = Math.abs(dn) < 0.002 ? needle.to : needle.a + dn * 0.24; }
        paintCanvas();
        var more = evs.length || VD.v !== VD.to || (needle.to != null && needle.a !== needle.to) || !!CV.fade || flights > 0 || (tn - lastChange <= 340 && nextDir(r, pendingC(), VD.v) !== 0);
        if(!more && nextDir(r, pendingC(), VD.v) !== 0) more = true;
        if(more){ dirty = true; raf = requestAnimationFrame(frame); }
        else if(dirty){ dirty = false; paintReadouts(true); settled(); }
      }
      // finish everything now (leaving Explore, hidden, reduced motion): the picture of where it all settles
      function snap(){
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        if(!G) return;
        flights = 0; ghostOff();
        var r = R(), c = settleFrom(r, pendingC(), S.V);
        VD.v = VD.from = VD.to = S.V; paintPiston();
        layoutAt(c); lastKey = ''; paintReadouts(true); needle.a = needle.to; CV.fade = null; paintCanvas(); settled();
      }
      function crossFade(fn){
        var img = null;
        if(CV.ctx && mov.width){ img = document.createElement('canvas'); img.width = mov.width; img.height = mov.height; img.getContext('2d').drawImage(mov, 0, 0); }
        fn();
        if(img){ CV.fade = { img: img, t0: now() }; kick(); }
      }
      // a change by the student: in reduced motion the result at once (a cross fade)
      function changed(){ lastChange = now(); cause.take(null); clearTimeout(takeT); if(K.reduced()){ crossFade(function(){ snap(); }); return; } kick(); }

      /* ---------------------------------------------------- the main control: the tray */
      var wellBtns = [];
      function makeWells(){
        wellBtns.forEach(function(b){ b.remove(); }); wellBtns = [];
        (L.wells || []).forEach(function(wl, i){
          var b = document.createElement('button'); b.type = 'button'; b.className = 'qk2-wellbtn';
          var s = wl.s, gas = s.phase === 'g', n = gas ? DROP : 1;
          b.setAttribute('aria-label', s.html.replace(/[₀-₉]/g, function(m){ return SUBD[m]; }) + (gas ? '' : ' (solid)') + ': press to add ' + n + (gas ? ' particles' : ' lump') + ', Delete to take ' + n + ' out');
          b.setAttribute('aria-keyshortcuts', 'Enter Delete');
          b.dataset.key = s.key;
          var cv = clusterCanvas(s.key, n, gas ? 1 : 1.05); cv.className = 'qk2-wellart'; b.appendChild(cv);
          layer.el.appendChild(b); wellBtns.push(b);
          b.addEventListener('pointerdown', function(ev){ wellDown(ev, wl, b); });
          b.addEventListener('click', function(ev){ if(ev.detail === 0) { add(s.key); } });
          b.addEventListener('keydown', function(ev){ if(ev.key === 'Delete' || ev.key === 'Backspace' || ev.key === '-'){ ev.preventDefault(); takeOut(s.key, null); } });
        });
        placeWells();
      }
      function placeWells(){
        var k = layer.scale();
        wellBtns.forEach(function(b, i){ var wl = L.wells[i]; b.style.left = (wl.x * k) + 'px'; b.style.top = (wl.y * k) + 'px'; b.style.width = (wl.w * k) + 'px'; b.style.height = (wl.h * k) + 'px';
          var r = R(), s = wl.s, c = counts()[idx(s.key)], gas = s.phase === 'g', capped = c + (gas ? DROP : 1) > r.cap[idx(s.key)] || (gas && gasCount() + DROP > r.gasCap) || (!gas && solidCount() + 1 > (r.solidCap || 99));
          b.classList.toggle('is-full', capped); b.setAttribute('aria-disabled', String(capped)); });
      }
      function gasCount(){ return ps.filter(function(p){ return p.gas && (p.counted || p.state === 'enter'); }).length; }
      function solidCount(){ return ps.filter(function(p){ return !p.gas && (p.counted || p.state === 'enter'); }).length; }
      var drag = null, ghost = null;
      function ghostOn(key, n){ ghostOff(); ghost = clusterCanvas(key, n, 1.1); ghost.className = 'qk2-ghost'; layer.el.appendChild(ghost); }
      function ghostOff(){ if(ghost){ ghost.remove(); ghost = null; } }
      function ghostAt(px, py){ if(ghost) ghost.style.transform = 'translate(' + Math.round(px - ghost.offsetWidth / 2) + 'px,' + Math.round(py - ghost.offsetHeight / 2) + 'px)'; }
      function wellDown(ev, wl, b){
        if(ev.pointerType === 'mouse' && ev.button !== 0) return;
        ev.preventDefault();
        var r0 = layer.el.getBoundingClientRect();
        drag = { wl: wl, id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, moved: false, b: b, r0: r0 };
        try{ b.setPointerCapture(ev.pointerId); }catch(e){}
        b.classList.add('is-press');
      }
      layer.el.addEventListener('pointermove', function(ev){
        if(!drag || ev.pointerId !== drag.id) return;
        var r0 = layer.el.getBoundingClientRect();
        if(!drag.moved && Math.hypot(ev.clientX - drag.x0, ev.clientY - drag.y0) > 8){ drag.moved = true; var s = drag.wl.s; ghostOn(s.key, s.phase === 'g' ? DROP : 1); hideCue(true); }
        if(drag.moved) ghostAt(ev.clientX - r0.left, ev.clientY - r0.top);
      });
      function wellUp(ev){
        if(!drag || ev.pointerId !== drag.id) return;
        var d = drag; drag = null; d.b.classList.remove('is-press');
        if(ev.type === 'pointercancel'){ ghostOff(); return; }
        var key = d.wl.s.key;
        if(!d.moved){ ghostOff(); add(key); return; }
        // dropped over the cylinder (or the port): in it goes; elsewhere it goes back to the tray
        var r0 = layer.el.getBoundingClientRect(), k = layer.scale(), x = (ev.clientX - r0.left) / k, y = (ev.clientY - r0.top) / k;
        if(x > G.x0 - 30 && x < G.portX + 30 && y > pistonY(VD.v) - 30 && y < G.yb + 10){ fly(key, ev.clientX - r0.left, ev.clientY - r0.top); }
        else ghostOff();
      }
      layer.el.addEventListener('pointerup', wellUp); layer.el.addEventListener('pointercancel', wellUp);
      // the dropped cluster flies to the port's mouth (the ghost), then goes in particle by particle
      function fly(key, px, py){
        if(!canAdd(key)){ ghostOff(); nudgeFull(key); return; }
        var k = layer.scale(), tx = (G.portX + 8) * k, ty = G.portY * k, t0 = now(), gx0 = px, gy0 = py;
        if(K.reduced() || !ghost){ ghostOff(); add(key); return; }
        flights++; kick();
        var g0 = ghost;
        (function step(){
          if(ghost !== g0){ flights = Math.max(0, flights - 1); return; }
          var u = clamp((now() - t0) / 260, 0, 1), e = ease(u);
          ghostAt(lerp(gx0, tx, e), lerp(gy0, ty, e) - Math.sin(Math.PI * e) * 20);
          if(u < 1){ requestAnimationFrame(step); return; }
          ghostOff(); flights = Math.max(0, flights - 1); add(key);
        })();
      }
      function canAdd(key){ var r = R(), i = idx(key), gas = isGas(key), c = pendingC()[i]; return !(c + (gas ? DROP : 1) > r.cap[i] || (gas && gasCount() + DROP > r.gasCap) || (!gas && solidCount() + 1 > (r.solidCap || 99))); }
      function nudgeFull(key){ var b = wellBtns.filter(function(x){ return x.dataset.key === key; })[0]; if(b){ b.classList.remove('is-nope'); void b.offsetWidth; b.classList.add('is-nope'); } say('The cylinder holds no more ' + plainName(key) + ' here. Take some out or start over.'); }
      function add(key){
        if(S.mode !== 'explore') return;
        hideCue(true); tourDid('add');
        if(!canAdd(key)){ nudgeFull(key); return; }
        var gas = isGas(key), n = gas ? DROP : 1;
        for(var i = 0; i < n; i++) enter(key, i * 110);
        S.act = { kind: 'add', key: key, d: 1, n: n }; S.solidAct = !gas; S.ran = 0;
        if(K.reduced()){ changed(); return; }
        changed(); paintReadouts(true); placeWells();
      }
      // three of a kind (one lump of a solid) leave through the port: the picked one and the nearest others
      function takeOut(key, p0){
        if(S.mode !== 'explore') return;
        var gas = isGas(key), n = gas ? DROP : 1, list = restList(key);
        if(!list.length){ say('There is no ' + plainName(key) + ' in the cylinder.'); return; }
        var first = p0 && list.indexOf(p0) > -1 ? p0 : list.slice().sort(function(a, b){ return Math.hypot(a.x - G.x1, a.y - G.portY) - Math.hypot(b.x - G.x1, b.y - G.portY); })[0];
        var go = [first].concat(list.filter(function(p){ return p !== first; }).sort(function(a, b){ return Math.hypot(a.x - first.x, a.y - first.y) - Math.hypot(b.x - first.x, b.y - first.y); })).slice(0, n);
        go.forEach(function(p, i){ leave(p, i * 110); });
        S.act = { kind: 'out', key: key, d: -1, n: go.length }; S.solidAct = !gas; S.ran = 0;
        hideCue(true);
        changed(); paintReadouts(true); placeWells();
      }
      // a tap or drag on a particle in the cylinder takes it (and two more of its kind) out: what is drawn under the
      // pointer, within its own size
      var pick = null;
      sceneBox.addEventListener('pointerdown', function(ev){
        if(S.mode !== 'explore' || !G || ev.target.closest('.qk2-wellbtn, .tk2-drag, .tk2-cue')) return;
        var r0 = sceneBox.getBoundingClientRect(), k = r0.width / G.W, x = (ev.clientX - r0.left) / k, y = (ev.clientY - r0.top) / k;
        if(!inner(x, y)) return;
        var best = null, bd = Infinity;
        ps.forEach(function(p){ if(p.state !== 'rest' || !p.counted) return; var lim = p.gas ? Math.max(extent(p.key).w, extent(p.key).h) * sc() / 2 + 4 : G.lumpW * 0.6; var dd = Math.hypot(p.x - x, p.y - y); if(dd <= lim && dd < bd){ bd = dd; best = p; } });
        if(!best) return;
        pick = { p: best, id: ev.pointerId }; kick();
        hideCue(true);
      });
      sceneBox.addEventListener('pointerup', function(ev){ if(!pick || pick.id !== ev.pointerId) return; var p = pick.p; pick = null; kick(); if(p.state === 'rest' && p.counted) takeOut(p.key, p); });
      sceneBox.addEventListener('pointercancel', function(ev){ if(pick && pick.id === ev.pointerId){ pick = null; kick(); } });

      /* ---------------------------------------------------- the volume: the piston's handle (quiet) */
      var slider = null;
      function makeSlider(){
        if(slider) slider.el.remove();
        var r = R(), x = G.cx + G.handleW / 2 + 14;
        slider = K.drag(layer, { key: 'apchem-qk-vol', label: 'Volume of the cylinder', min: VMIN, max: VMAX, step: VOL[1] - VOL[0], value: S.V, quiet: true,
          track: [G.cx, handleY(VMIN), G.cx, handleY(VMAX)],
          valuetext: function(v){ return 'volume ' + v.toFixed(2) + ' liters'; },
          // the tag says the DRAWN volume (it catches up as the piston glides)
          tag: function(){ return VD.v.toFixed(2) + ' L'; }, tagSide: 'right',
          onInput: function(v){ setV(v); } });
        void x;
      }
      function handleY(V){ return pistonY(V) - 12 - G.stem; }
      function setV(v){
        if(v === S.V) return;
        S.V = v; hideCue(true); tourDid('vol');
        VD.from = VD.v; VD.to = v; VD.t0 = now();
        S.act = { kind: 'vol', V: v }; S.solidAct = false; S.ran = 0;
        changed();
      }

      /* ---------------------------------------------------- layout */
      var lastW = 0;
      function layoutNow(force){
        var r0 = sceneBox.getBoundingClientRect(), W = Math.round(r0.width);
        if(!W || (!force && W === lastW && G)){ if(cue.active()) cue.place(); return; }
        lastW = W;
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        var keep = G ? pendingC() : null;
        G = geo(W);
        sceneBox.style.height = G.H + 'px';
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + G.H); svg.setAttribute('width', W); svg.setAttribute('height', G.H);
        var bx = [Math.floor(Math.min(G.gx - G.gr - 8, G.x0 - 12)), Math.floor(Math.min(G.gy - G.gr - 8, G.yRim - 4)), Math.ceil(G.portX + 16), Math.ceil(G.yb + 2)];
        CV.box = bx; CV.dpr = Math.min(2, window.devicePixelRatio || 1);
        mov.style.left = bx[0] + 'px'; mov.style.top = bx[1] + 'px'; mov.style.width = (bx[2] - bx[0]) + 'px'; mov.style.height = (bx[3] - bx[1]) + 'px';
        mov.width = Math.round((bx[2] - bx[0]) * CV.dpr); mov.height = Math.round((bx[3] - bx[1]) * CV.dpr); CV.ctx = mov.getContext('2d');
        CV.base = document.createElement('canvas'); CV.base.width = mov.width; CV.base.height = mov.height; CV.baseDirty = true; readColors();
        sceneBox.classList.toggle('is-narrow', G.narrow);
        drawStatic();
        VD.v = VD.from = VD.to = S.V; paintPiston();
        layoutAt(keep ? settleFrom(R(), keep, S.V) : R().n0.slice());
        lastKey = ''; shown = null; paintReadouts(true); needle.a = needle.to; paintCanvas();
        makeSlider(); makeWells();
        svg.setAttribute('aria-label', describe());
        if(cue.active()) cue.place();
        settled();
      }
      function describe(){
        var r = R();
        return 'A glass cylinder with a piston holding ' + (r.id === 'ab' ? 'A, B and AB particles' : 'CO₂ gas over lumps of CaCO₃ and CaO, heated to 800 °C') + ' for ' + eqText(r) + '; a dial reads Q with K marked; a tray of particles to add.';
      }
      function pickReaction(v){
        var i = RX.map(function(r){ return r.id; }).indexOf(v); if(i < 0 || i === S.ri) return;
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        S.ri = i; S.V = EX.V0; S.act = null; S.solidAct = false; S.ran = 0; S.ran = 0; cause.take(null); clearTimeout(takeT);
        G = null; crossFade(function(){});
        layoutNow(true); refHtml();
      }
      function startOver(){
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        S.V = EX.V0; S.act = null; S.solidAct = false; S.ran = 0; cause.take(null); clearTimeout(takeT); flights = 0; ghostOff();
        VD.v = VD.from = VD.to = S.V; paintPiston();
        crossFade(function(){ layoutAt(R().n0.slice()); });
        lastKey = ''; paintReadouts(true); needle.a = needle.to; paintCanvas();
        slider.value(S.V); placeWells(); settled();
      }

      /* ---------------------------------------------------- the cue and Show me how */
      // the one first visit cue: above the tray on a wide screen (over the bare wall), under it on a narrow one (so it
      // covers neither the cylinder nor a cup's name)
      var cue = K.cue(layer, { key: 'apchem-qk-tray', text: 'Drag B into the cylinder', side: window.innerWidth < 860 ? 'below' : 'above',
        at: function(){ if(!G || !L.wells) return [0, 0]; var wl = L.wells[1]; return G.narrow ? [wl.x + wl.w / 2, wl.y + wl.h + 16] : [wl.x + wl.w / 2, wl.y - 12]; } });
      function hideCue(used){ if(cue.active()) cue.hide(used); }
      stage.addEventListener('keydown', function(e){ if(sceneBox.contains(e.target) && /^(Arrow|Page|Home|End|Enter| |Delete)/.test(e.key)) hideCue(true); }, true);
      function rectOf(x, y, w, h){ var r0 = svg.getBoundingClientRect(), k = r0.width / G.W; return { left: r0.left + x * k, top: r0.top + y * k, right: r0.left + (x + w) * k, bottom: r0.top + (y + h) * k, width: w * k, height: h * k }; }
      var tour = K.tour({ key: 'apchem-q-vs-k', label: 'Show me how', steps: [
        { id: 'add', text: 'Drag particles from the tray into the cylinder (or tap a cup). Tap a particle inside to take some out.', target: function(){ return seen('add', wellBtns[1] || sceneBox); } },
        { id: 'gauge', text: 'Q jumps away from the K notch. The arrow shows which way the reaction runs to bring Q back to K.', target: function(){ if(!G) return sceneBox; seen('gauge', mov); return rectOf(G.gx - G.gr - 6, G.gy - G.gr - 24, 2 * G.gr + 12, G.gr * 1.62 + 30); } },
        { id: 'vol', text: 'Move the piston to change the volume. Q changes when the two sides have different numbers of gas particles.', target: function(){ return seen('vol', slider ? slider.el.querySelector('.tk2-knob') : sceneBox); } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      var tourSeen = {};
      function seen(id, el){ if(el && !tourSeen[id]){ tourSeen[id] = true; try{ el.scrollIntoView({ block: 'nearest' }); }catch(e){} } return el; }
      function tourDid(id){ if(tour.active()) tour.did(id); }
      function startTour(){ if(S.mode !== 'explore') return; hideCue(false); tourSeen = {}; tour.start(true); }

      /* ---------------------------------------------------- "?" */
      var ref = document.createElement('div'); ref.className = 'ls-sec qk2-ref';
      function refHtml(){
        var r = R(), s = shown, c = s ? s.c : r.n0, V = s ? s.V : EX.V0;
        var conc = r.species.map(function(sp, i){ if(sp.phase !== 'g') return sp.html + '(s): ' + c[i] + ' lump' + (c[i] === 1 ? '' : 's') + ', not in Q';
          return (r.K === 'Kp' ? 'P(' + sp.html + ')' : '[' + sp.html + ']') + ' = ' + c[i] + ' × ' + r.per.toFixed(3) + ' ÷ ' + V.toFixed(2) + ' = ' + M.fmt(c[i] * r.per / V, 3) + ' ' + r.unit; });
        var expr = r.id === 'ab' ? 'Q = [AB] / ([A][B])' : 'Q = P(CO₂)';
        ref.innerHTML = '<p class="qk2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>' +
          '<h3 class="ls-title-l">Q and K</h3><p>Q has the same form as K, with the amounts right now: ' + expr + '. Compare them: <b>Q &lt; K</b>, the reaction runs forward (toward products) until Q rises to K; <b>Q &gt; K</b>, it runs back (toward reactants) until Q falls to K; <b>Q = K</b>, it is at equilibrium: the forward and reverse reactions go on at equal rates, so there is no net change. K changes only with temperature; adding, removing or squeezing changes Q, never K. On the exam the comparison of Q with K is the justification ("Q &lt; K, so the net reaction goes forward"); Le Chatelier\'s principle is only a prediction.</p>' +
          '<h3 class="ls-title-l">Counting Q from the picture</h3><p>' + esc(r.perText) + '. Count each gas, turn the count into ' + (r.K === 'Kp' ? 'a pressure' : 'a concentration') + ', then put the numbers into Q. Now: ' + conc.join('; ') + '. So Q = ' + fq(Qof(r, c, V)) + ' and K = ' + r.Kval + '.</p>' +
          (r.id === 'ab' ? '<h3 class="ls-title-l">The volume</h3><p>Each gas particle\'s concentration is its amount over the volume, so squeezing the cylinder raises every concentration by the same factor. Q has one gas particle on top (AB) and two on the bottom (A and B), so Q goes as the volume: halving the volume halves Q, so Q &lt; K and the reaction runs forward, toward the side with fewer gas particles. Making it larger raises Q and it runs back.</p>'
            : '<h3 class="ls-title-l">The solids</h3><p>CaCO₃ and CaO are pure solids: their concentration is fixed by their own density, so they are left out of Q and K. K<sub>p</sub> = P(CO₂). Adding a lump of either solid changes nothing; adding CO₂ makes Q &gt; K and CO₂ goes into the CaO, which turns to CaCO₃; taking CO₂ out makes Q &lt; K and CaCO₃ gives off CO₂. Squeezing the cylinder raises P(CO₂), so some CO₂ goes back into the solid, until P(CO₂) is K again: at equilibrium the pressure of CO₂ is the same whatever the volume. If one of the solids is used up, the reaction cannot run that way any further.</p>') +
          '<h3 class="ls-title-l">Why Q lands near K, not on it</h3><p>The cylinder holds whole particles, so the reaction runs one event at a time and stops at the counts nearest K. When one more event would take Q farther from K than it is, the reaction stops there and the cause line says so (a real mixture would shift by a fraction of a particle). Each press of a cup adds three particles of a gas, enough to make at least one whole event run in most mixtures.</p>' +
          '<h3 class="ls-title-l">The dial</h3><p>The dial is a log scale: each tick is twice the last, from K ÷ 4 at the left to K × 4 at the right (a Q beyond rests at the end). K is the green notch; the needle is Q, read from the particles drawn. The arrow under the equation points the way the reaction runs, thicker the farther Q is from K; a thin arrow with two heads means no net change.</p>' +
          '<h3 class="ls-title-l">The constants</h3><ul class="qk2-list">' + RX.map(function(z){ return '<li>' + esc(eqText(z)) + ': ' + (z.K === 'Kp' ? 'K<sub>p</sub>' : 'K<sub>c</sub>') + ' = ' + z.Kval + (z.T ? ' at ' + esc(z.T) : '') + ' (' + esc(z.ref) + ').</li>'; }).join('') + '</ul>' +
          '<h3 class="ls-title-l">' + esc(data.howItWorksTitle || 'How Test yourself checks') + '</h3>' + T.wrapTables(data.howItWorks) +
          '<p class="bt-small">Notes: <a href="../notes/q-and-le-chatelier.html">Q, K and Le Chatelier\'s principle</a></p>';
      }
      ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(ctx.studio) ctx.studio.close(); if(S.mode !== 'explore' && ctx.studio && ctx.studio.kit2) ctx.studio.kit2.go('explore'); setTimeout(startTour, 60); });

      /* ================================================== TEST YOURSELF: the drill, unchanged */
      var qz = document.createElement('div'); qz.className = 'bt-pane bt-pane-quiz qk2-quiz';
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
        about: [(function(){ var d = document.createElement('div'); d.className = 'bt-intro'; d.innerHTML = '<p><b>Explore:</b> drag particles into a cylinder (or take some out, or move its piston) and watch Q jump away from K; the reaction then runs, one event at a time, the way that brings Q back to K.</p><p><b>Test yourself:</b></p>' + data.intro; return d; })()],
        start: function(){ try{ if(/[?&#]seed=\d+/.test(location.search + location.hash) || /^#quiz\b/.test(location.hash)) return { mode: 'quiz', part: 'quiz' }; }catch(e){} return null; } };
      refHtml();
      if(!ctx.studio){ app.insertBefore(stage, app.firstChild); app.insertBefore(ref, stage.nextSibling); shownMode('explore'); }
      // the stage stops when it is hidden (another tab of the page, scrolled away mid change)
      if(window.IntersectionObserver) new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting && (busy() || raf) && S.mode === 'explore') snap(); }); }).observe(sceneBox);
      if(window.MutationObserver) new MutationObserver(function(){ if(G){ readColors(); makeWells(); paintCanvas(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      document.addEventListener('visibilitychange', function(){ if(document.hidden && (busy() || raf)) snap(); });
      if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if(G) layoutNow(true); });
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(function(){ layoutNow(); if(G) placeWells(); }, 50); }).observe(sceneBox); }
      else window.addEventListener('resize', function(){ layoutNow(); });
      // keep the "?" text current once a change settles
      var refT = 0; var _settled = settled; settled = function(){ _settled(); clearTimeout(refT); refT = setTimeout(refHtml, 200); };
      // for the sweep and the frames check (scripts/tools-v2/chem-q-vs-k-sweep.mjs): the drawn state
      window.__qk2 = {
        G: function(){ return G; }, busy: function(){ return busy() || !!raf; }, react: function(){ return R(); }, V: function(){ return VD.v; }, Vtarget: function(){ return S.V; },
        drawn: function(){ return counts(); }, shown: function(){ return shown; }, needle: function(){ return needle.a; }, angOf: angOf, Qof: function(c, V){ return Qof(R(), c, V); }, nextDir: function(c, V){ return nextDir(R(), c, V); },
        settleFrom: function(c, V){ return settleFrom(R(), c, V); }, pistonY: pistonY, s: sc,
        ps: function(){ return ps.map(function(p){ return { key: p.key, gas: p.gas, state: p.state, counted: p.counted, x: p.x, y: p.y, alpha: p.alpha == null ? 1 : p.alpha, mix: p.mix, atoms: p.gas ? atomsOf(p).map(function(a){ return [a.x, a.y, a.r]; }) : null }; }); },
        evs: function(){ return evs.map(function(e){ return { type: e.type, dir: e.dir, formed: !!e.formed, glow: e.glowA || 0, counted: e.p ? e.p.counted : null }; }); },
        add: add, takeOut: function(key){ takeOut(key, null); }, setV: function(v){ slider.value(v, true); }, snap: snap, arrows: function(){ return L.arrows.getAttribute('data-dir'); }
      };
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }

  /* ================================================== the drill (Test yourself), as before the rebuild */
  function quiz(app, data, M){
    T.drill(app, data, {
      slug: 'q-vs-k',
      generate: function(r, ctx){ return M.qk.generate(r, ctx); },
      types: [{ value: 'numbers', label: 'Concentrations and pressures' }, { value: 'particles', label: 'Particle pictures' }],
      typeLabel: 'Show the mixture as',
      title: function(p){ return p.mode === 'particles' ? 'Count the particles, then compare Q with K' : 'Compare Q with K'; },
      extra: function(host, p){
        var fig = '';
        if(p.mode === 'particles'){
          var counts = {}, names = {};
          p.species.forEach(function(s, i){ if(s.draw){ counts[s.draw] = p.counts[i]; names[s.draw] = s.html + (p.counts[i] === 1 ? ' particle' : ' particles'); } });
          fig = '<figure class="cd-fig">' + M.particles.box(counts, p.counts.join('') * 7 + 11, { w: 300, h: 190, names: names }) +
            '<figcaption class="bt-small">Each particle represents ' + M.fmt(p.per, 2) + ' ' + p.unit + '.</figcaption></figure>';
        }
        // The Q-K bar: K in the middle; Q appears once it is calculated (the student's own Q too, when it was off).
        host.innerHTML = fig + '<div class="qk-qbar lb" aria-live="polite">' + qkBar(p, null, null) + '</div>';
      },
      onStep: function(s, right, api){
        if(s.key !== 'Q') return;
        var bar = api.area.querySelector('.qk-qbar') || document.querySelector('.qk-qbar'); if(!bar) return;
        var inp = api.area.querySelector('.cd-step .cd-num input'), mine = inp && window.ApChemQuestions ? window.ApChemQuestions.parseNumber(inp.dataset.first || inp.value) : NaN;
        bar.innerHTML = qkBar(api.problem, right ? null : mine, true);
      }
    });
    // Remember the first number the student typed for Q, so the bar can draw it next to the right one after Show the
    // answer fills the box in. On the document: the Tool Studio moves the drill out of app.
    document.addEventListener('submit', function(e){
      var inp = e.target.querySelector && e.target.querySelector('.cd-num input');
      if(inp && !inp.dataset.first && inp.value.trim()) inp.dataset.first = inp.value;
    }, true);
    function qkBar(p, mine, shown){
      var lk = Math.log10(p.K), pos = function(q){ return Math.max(0, Math.min(100, 50 + (Math.log10(Math.max(q, 1e-30)) - lk) * 25)); };
      var t = ''; ['÷100', '÷10', '', '×10', '×100'].forEach(function(w, i){ t += '<i style="left:' + (i * 25) + '%"' + (i === 2 ? ' class="lb-tk7"' : '') + '></i>' + (i === 0 || i === 4 ? '<em class="lb-e' + i + '" style="left:' + (i * 25) + '%">' + w + '</em>' : ''); });
      var dir = p.dir === 'f' ? 'fwd' : p.dir === 'r' ? 'rev' : 'eq', bad = shown && isFinite(mine) && mine > 0 && Math.abs(mine / p.Q - 1) > 0.05;
      return '<p class="qk-qbar-h"><b>Q against K</b> <span class="bt-small">' + (shown ? 'log scale: each step is ×10' : 'Q appears here once you calculate it.') + '</span></p>' +
        '<div class="lb-scale lb-qk lb-' + (shown ? dir : 'eq') + '"><span class="lb-scale-bar"></span><span class="lb-tks">' + t + '</span><span class="lb-k" style="left:50%"><b>K</b></span>' +
        (shown ? '<span class="lb-mark" style="left:' + pos(p.Q).toFixed(1) + '%"><b>Q</b></span>' : '') +
        (bad ? '<span class="lb-mark qk-mine" style="left:' + pos(mine).toFixed(1) + '%"><b>yours</b></span>' : '') + '</div>' +
        (bad ? '<p class="bt-small qk-mine-t">Your Q, ' + M.fmt(mine, 3) + ', is on the dashed mark; the right Q is ' + M.fmt(p.Q, 3) + '.</p>' : '');
    }
  }

  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApChemBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
