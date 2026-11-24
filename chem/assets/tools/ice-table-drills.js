/* ICE tables, tools v2 (docs/tools-v2-chem-ice-tables-brief.md; the standard: docs/tools-v2-standard.md). On the shared
   kit (assets/course/tool-kit2.js) through the course adapter ApChemTools.studioKit2 (chem-tools.js).

   THE ONE IDEA: a reaction runs forward by x until Q reaches K; the ICE table is that change written down.
   EXPLORE: a sealed round bottom flask of gas on a lab bench (H₂ and violet I₂; or colourless N₂O₄ that browns as NO₂
   forms), the molecules drawn with their atoms, and a clipboard on the wall with the ICE table. The main control is x,
   a knob on a rail under the flask: every step of x is one reaction event, drawn where it happens (an H₂ and an I₂
   meet, swap partners and leave as two HI; an N₂O₄ splits into two NO₂), so the drawn counts ARE the table (one
   molecule = 0.025 M, or 0.025 atm for Kp). The C row writes the change in x and its value, the E row I + C, and the
   clipboard's last line puts the E row into the K expression: Q. A small Q gauge on the flask's neck has K as a fixed
   notch; the needle reaches it at the equilibrium x. Past it the knob still moves (Explore is free): Q overshoots and
   the cause line says the reverse reaction would bring it back. The data (chem/data/tools/ice-table-drills.json
   "explore") is checked by scripts/lib/apchem-tool-checks/ice-table-drills.mjs (a step lands Q within 2% of K, and the
   exact x rounds to that step).
   Every number shown (table, Q, the knob's tag, the cause line, the needle, the gas colour) comes from the molecules
   DRAWN at that frame: a molecule counts once it has formed. Reduced motion: a short cross fade to the new state.
   TEST YOURSELF: the drill, unchanged (T.drill: Find K, Small K and the 5% check, Perfect square; ids
   "ice-table-drills:<context>:<step>", ?seed= and #quiz open it), with its typed table, live beaker and bar chart. */
(function(){
  'use strict';
  var SLUG = 'ice-table-drills';
  var T = window.ApChemTools;
  if(!T) return;
  var TITLE = { findK: 'Find K from equilibrium data', smallx: 'Equilibrium amounts when K is small', square: 'Equilibrium amounts: a perfect square' };
  var ROWS = [['I', 'Initial'], ['C', 'Change'], ['E', 'Equilibrium']];
  var plain = function(h){ return String(h).replace(/<[^>]+>/g, ''); };
  var NS = 'http://www.w3.org/2000/svg';
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function ease(t){ return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function f1(v){ return (+v).toFixed(1); }
  function rot(dx, dy, a){ var c = Math.cos(a), s = Math.sin(a); return [dx * c - dy * s, dx * s + dy * c]; }
  function mk(tag, cls, attrs){ var e = document.createElementNS(NS, tag); if(cls) e.setAttribute('class', cls); for(var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  // a subscript digit or letter in a species name, drawn as a lowered smaller tspan (H₂ -> H<tspan>2</tspan>)
  var SUBD = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  function svgChem(t){
    return String(t).replace(/[₀-₉]+/g, function(m){ return '<tspan class="ix-sub" dy="0.28em">' + m.split('').map(function(c){ return SUBD[c]; }).join('') + '</tspan><tspan dy="-0.28em"> </tspan>'; });
  }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var BARS = '<details class="ic-barsd"><summary>Bar chart</summary><figure class="ic-bars"><div class="ic-chart"></div></figure></details>';

  function boot(){
    var K = window.LevlKit2, M = window.ApChemMath;
    T.mount(SLUG, function(app, data, ctx){
      var EX = data.explore, RX = EX.reactions, TEMPL = M.particles.templ;
      var S = { ri: 0, mode: 'explore', target: 0 };
      var G = null, phone = false;

      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'ix2';
      var tabs = K.tabs({ label: 'Reaction', value: RX[0].id, items: RX.map(function(r){ return { value: r.id, label: eqText(r), short: r.chip }; }),
        onChange: function(v){ hideCue(true); pickReaction(v); } });
      stage.appendChild(tabs.el);
      var head = K.head({ purpose: 'See how far a reaction runs before Q reaches K.', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'ix2-scene'; sceneBox.id = T.nid('ix2');
      sceneBox.innerHTML = '<svg class="ix2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"></svg>';
      stage.appendChild(sceneBox);
      tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', sceneBox.id); });
      var svg = sceneBox.querySelector('svg'), layer = K.layer(sceneBox);
      var lines = document.createElement('div'); lines.className = 'ix2-lines';
      var cause = K.cause({ label: 'Why' });
      var again = document.createElement('button'); again.type = 'button'; again.className = 'tk2-btn ix2-again'; again.textContent = 'Start over'; again.hidden = true;
      again.addEventListener('click', function(){ hideCue(true); startOver(); });
      lines.appendChild(cause.el); lines.appendChild(again);
      stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      var sayT = 0;
      function say(t){ clearTimeout(sayT); sayT = setTimeout(function(){ live.textContent = t; }, 350); }

      function R(){ return RX[S.ri]; }
      function eqText(r){ return r.species.filter(function(s){ return s.nu < 0; }).map(function(s){ return (s.nu < -1 ? -s.nu : '') + s.html; }).join(' + ') + ' ⇌ ' + r.species.filter(function(s){ return s.nu > 0; }).map(function(s){ return (s.nu > 1 ? s.nu : '') + s.html; }).join(' + '); }
      function unitOf(r){ return r.unit; }
      function fmt(v){ return M.fmt(v, 3); }
      function fmtQ(q){ return q === 0 ? '0' : M.fmt(q, 3); }
      function Kname(r){ return r.K === 'Kp' ? 'Kp' : 'Kc'; }

      /* ---------------------------------------------------- the model: counts of drawn molecules */
      function countsAt(r, k){ return r.n0.map(function(n, i){ return n + r.species[i].nu * k; }); }
      function Qof(r, counts){
        var q = 1;
        for(var i = 0; i < counts.length; i++){ var c = counts[i] * r.per, nu = r.species[i].nu; if(nu > 0 && c === 0) return 0; q *= Math.pow(c, nu); }
        return q;
      }
      // the step of x whose Q is nearest K (the data guarantee within 2%): "at equilibrium" there and only there
      function eqStep(r){ var best = 0; for(var k = 1; k <= r.steps; k++) if(Math.abs(Math.log(Qof(r, countsAt(r, k)) / r.Kval)) < Math.abs(Math.log(Qof(r, countsAt(r, best)) / r.Kval) || Infinity)) best = k; return best; }
      // x from the DRAWN counts: the first reactant's fall over its coefficient
      function xOf(r, counts){ return (r.n0[0] - counts[0]) / -r.species[0].nu * r.per; }

      /* ---------------------------------------------------- geometry */
      function geo(W){
        var g = { W: W, narrow: W < 640 }, r = R();
        if(!g.narrow){
          g.H = clamp(Math.round(W * 0.44), 470, 600);
          g.yb = g.H - 112;
          g.R = Math.round(Math.min(W * 0.16, (g.yb - 34) / 2.9));
          g.cx = Math.round(Math.max(g.R + 40, W * 0.30));
          g.cy = g.yb - g.R - 4;
          g.nw = Math.round(Math.min(W * 0.4, 480)); g.nx = Math.round(clamp(W * 0.73 - g.nw / 2, g.cx + g.R + 0.62 * g.R + 70, W - 22 - g.nw));
          g.nw = Math.min(g.nw, W - 22 - g.nx);
          g.ny = 26;
          g.railY = g.yb + 50;
        } else {
          g.R = Math.round(Math.min(W * 0.33, 150));
          g.cx = Math.round(W * 0.42);
          g.cy = 22 + Math.round(0.95 * g.R) + g.R;
          g.yb = g.cy + g.R + 4;
          g.railY = g.yb + 44;
          g.nx = 10; g.nw = W - 20; g.ny = g.yb + 92;
        }
        g.neck = Math.max(10, Math.round(0.17 * g.R));
        g.neckTop = g.cy - Math.round(1.6 * g.R);
        g.gr = Math.round(clamp(0.27 * g.R, 30, 44));
        g.gx = g.cx + g.neck + 14 + g.gr; g.gy = g.cy - Math.round(1.24 * g.R);
        var span = Math.min(g.R * 1.08, g.cx - 34);
        g.rail = [g.cx - span, g.railY, g.cx + span, g.railY];
        // the clipboard (wide: hanging on the wall) or the notebook page (phone: lying on the bench)
        var n = r.species.length, pad = g.narrow ? 12 : 18;
        g.pad = pad; g.fsV = g.narrow ? 15 : 17; g.fsE = g.narrow ? 12 : 13; g.fsH = g.narrow ? 14 : 15.5;
        g.lw = g.narrow ? 34 : 64;
        g.cw = (g.nw - 2 * pad - g.lw) / n;
        g.tTop = (g.narrow ? 50 : 70);
        g.hh = g.narrow ? 50 : 56; g.rh = g.narrow ? 46 : 52;
        g.nh = g.tTop + g.hh + 3 * g.rh + (g.narrow ? 64 : 74);
        if(g.narrow){ g.H = g.ny + g.nh + 16; }
        else { g.ny = Math.max(22, Math.round((g.yb - 16 - g.nh) / 2)); }
        // molecule slots in the flask body: a staggered grid inside the circle, sized to hold the most molecules the
        // knob can draw (and a few spare), the molecule scale from the cell
        var most = 0; for(var k = 0; k <= r.steps; k++) most = Math.max(most, countsAt(r, k).reduce(function(a, b){ return a + b; }, 0));
        var inner = g.R - 8, cell = inner, slots = [];
        for(var c = inner; c > 8; c -= 0.5){
          slots = gridIn(g.cx, g.cy + 2, inner, c);
          if(slots.length >= most + 3){ cell = c; break; }
        }
        g.cell = cell; g.slots = slots;
        g.s = Math.min(1.25, cell / 46);
        return g;
      }
      function gridIn(cx, cy, rad, c){
        var out = [], h = c * 0.86, ext = c * 0.5;
        for(var row = -Math.ceil(rad / h); row <= Math.ceil(rad / h); row++){
          var y = cy + row * h, off = (row & 1) ? c / 2 : 0;
          for(var col = -Math.ceil(rad / c) - 1; col <= Math.ceil(rad / c) + 1; col++){
            var x = cx + col * c + off;
            if(Math.hypot(x - cx, y - cy) <= rad - ext) out.push([x, y]);
          }
        }
        return out;
      }

      /* ---------------------------------------------------- drawing the scene */
      var L = {};   // layers and nodes
      var mols = [], events = [], raf = 0, lastLaunch = 0, dirty = false, takeT = 0, drawnKey = '';
      var needle = { a: null, to: null };
      function rng(seed){ return M.rng(seed); }
      function atomSvg(el, rr){
        return '<circle r="' + f1(rr) + '"/><path class="pt-shade" d="M' + f1(-rr * 0.707) + ' ' + f1(rr * 0.707) + 'A' + f1(rr) + ' ' + f1(rr) + ' 0 0 0 ' + f1(rr * 0.707) + ' ' + f1(-rr * 0.707) + 'A' + f1(rr * 1.15) + ' ' + f1(rr * 1.15) + ' 0 0 1 ' + f1(-rr * 0.707) + ' ' + f1(rr * 0.707) + 'Z"/>' +
          '<ellipse class="pt-hi" cx="' + f1(-rr * 0.36) + '" cy="' + f1(-rr * 0.4) + '" rx="' + f1(rr * 0.36) + '" ry="' + f1(rr * 0.24) + '" transform="rotate(-35 ' + f1(-rr * 0.36) + ' ' + f1(-rr * 0.4) + ')"/>';
      }
      var ELC = { H: 'ph', I: 'pi', N: 'pn', O: 'po' };
      // one molecule: one <g> per atom (moved by transform), drawn back to front
      function newMol(key, x, y, a){
        var t = TEMPL[key].slice().sort(function(p, q){ return (p.z || 0) - (q.z || 0) || (q.r || 9) - (p.r || 9); });
        var m = { key: key, x: x, y: y, a: a, atoms: [], state: 'whole' };
        t.forEach(function(at){
          var n = mk('g', 'pt-atom ' + (ELC[at.el] || 'pa'));
          n.innerHTML = atomSvg(at.el, (at.r || 9) * G.s);
          L.mols.appendChild(n);
          m.atoms.push({ el: at.el, dx: at.dx, dy: at.dy, n: n, wx: 0, wy: 0 });
        });
        poseMol(m, x, y, a);
        return m;
      }
      function atomPos(m, at, x, y, a){ var p = rot(at.dx * G.s, at.dy * G.s, a); return [x + p[0], y + p[1]]; }
      function poseMol(m, x, y, a){
        m.x = x; m.y = y; m.a = a;
        m.atoms.forEach(function(at){ var p = atomPos(m, at, x, y, a); setAtom(at, p[0], p[1]); });
      }
      function setAtom(at, x, y){ at.wx = x; at.wy = y; at.n.setAttribute('transform', 'translate(' + f1(x) + ' ' + f1(y) + ')'); }
      function dropMol(m){ m.atoms.forEach(function(at){ at.n.remove(); }); }
      function countsDrawn(){
        var r = R(), c = r.species.map(function(){ return 0; });
        // every molecule in the flask counts: a reactant until its products have formed, a product from then on
        mols.forEach(function(m){ var i = idx(m.key); if(i > -1) c[i]++; });
        return c;
      }
      function idx(key){ var sp = R().species; for(var i = 0; i < sp.length; i++) if(sp[i].key === key) return i; return -1; }

      function drawStatic(){
        var g = G, r = R(), W = g.W, H = g.H, p = [];
        p.push('<defs><linearGradient id="ix2g-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ix2s-wall0"/><stop offset="1" class="ix2s-wall1"/></linearGradient>' +
          '<linearGradient id="ix2g-bench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ix2s-bn0"/><stop offset="1" class="ix2s-bn1"/></linearGradient>' +
          '<radialGradient id="ix2g-glass" cx="0.36" cy="0.32" r="0.75"><stop offset="0" class="ix2s-gl0"/><stop offset="1" class="ix2s-gl1"/></radialGradient>' +
          '<clipPath id="ix2c-flask"><path d="' + flaskPath(0) + '"/></clipPath></defs>');
        p.push('<rect class="ix2-wall" x="0" y="0" width="' + W + '" height="' + g.yb + '"/>');
        for(var ty = 46; ty < g.yb; ty += 58) p.push('<path class="ix2-grout" d="M0 ' + ty + 'H' + W + '"/>');
        p.push('<rect class="ix2-bench" x="0" y="' + g.yb + '" width="' + W + '" height="' + (H - g.yb) + '"/><path class="ix2-benchedge" d="M0 ' + (g.yb + 0.5) + 'H' + W + '"/>');
        // the cork ring the flask sits in, its shadow
        p.push('<ellipse class="ix2-shadow" cx="' + g.cx + '" cy="' + (g.yb + 6) + '" rx="' + Math.round(g.R * 0.8) + '" ry="7"/>');
        // the flask: glass body and neck, then the gas tint, the molecules, then the shine and the stopper on top
        p.push('<path class="ix2-glassbody" d="' + flaskPath(0) + '"/>');
        p.push('<g clip-path="url(#ix2c-flask)"><rect class="ix2-gas is-' + r.tint.color + '" x="0" y="0" width="' + W + '" height="' + g.yb + '"/></g>');
        p.push('<g class="ix2-mols"></g>');
        p.push('<g class="ix2-fx"></g>');
        p.push('<path class="ix2-glassrim" d="' + flaskPath(0) + '"/>');
        p.push('<path class="ix2-shine" d="M' + f1(g.cx - g.R * 0.62) + ' ' + f1(g.cy - g.R * 0.38) + 'A' + g.R * 0.78 + ' ' + g.R * 0.78 + ' 0 0 1 ' + f1(g.cx - g.R * 0.18) + ' ' + f1(g.cy - g.R * 0.74) + '"/>');
        p.push('<path class="ix2-shine is-thin" d="M' + f1(g.cx - g.neck * 0.45) + ' ' + f1(g.neckTop + 10) + 'V' + f1(g.cy - g.R * 1.02) + '"/>');
        var sw = g.neck * 1.32, sTop = g.neckTop - Math.round(0.2 * g.R);
        p.push('<path class="ix2-stopper" d="M' + f1(g.cx - sw) + ' ' + f1(sTop) + 'H' + f1(g.cx + sw) + 'L' + f1(g.cx + g.neck * 0.98) + ' ' + f1(g.neckTop + 0.12 * g.R) + 'H' + f1(g.cx - g.neck * 0.98) + 'Z"/>');
        p.push('<path class="ix2-stopperhi" d="M' + f1(g.cx - sw + 3) + ' ' + f1(sTop + 3) + 'H' + f1(g.cx + sw - 3) + '"/>');
        p.push('<path class="ix2-cork" d="M' + f1(g.cx - g.R * 0.62) + ' ' + f1(g.yb - 3) + 'Q' + g.cx + ' ' + f1(g.yb + 12) + ' ' + f1(g.cx + g.R * 0.62) + ' ' + f1(g.yb - 3) + 'L' + f1(g.cx + g.R * 0.56) + ' ' + f1(g.yb + 6) + 'Q' + g.cx + ' ' + f1(g.yb + 18) + ' ' + f1(g.cx - g.R * 0.56) + ' ' + f1(g.yb + 6) + 'Z"/>');
        // the Q gauge clipped to the neck: a dial, log scale, K as a fixed notch, the needle at Q
        var gx = g.gx, gy = g.gy, gr = g.gr, lo = r.gauge[0], hi = r.gauge[1];
        p.push('<path class="ix2-clip" d="M' + f1(g.cx + g.neck - 1) + ' ' + f1(gy + gr * 0.12) + 'H' + f1(gx - gr + 2) + '"/>');
        p.push('<path class="ix2-dial" d="M' + f1(gx - gr) + ' ' + f1(gy + gr * 0.26) + 'V' + gy + 'A' + gr + ' ' + gr + ' 0 0 1 ' + f1(gx + gr) + ' ' + gy + 'V' + f1(gy + gr * 0.26) + 'Z"/>');
        for(var d = lo; d <= hi; d++){ var a = angOf(Math.pow(10, d)), c1 = rot(gr * 0.78, 0, a), c2 = rot(gr * 0.92, 0, a); p.push('<path class="ix2-tick" d="M' + f1(gx + c1[0]) + ' ' + f1(gy + c1[1]) + 'L' + f1(gx + c2[0]) + ' ' + f1(gy + c2[1]) + '"/>'); }
        var ka = angOf(r.Kval), k1 = rot(gr * 0.62, 0, ka), k2 = rot(gr * 1.0, 0, ka), k3 = rot(gr + 11, 0, ka);
        p.push('<path class="ix2-knotch" d="M' + f1(gx + k1[0]) + ' ' + f1(gy + k1[1]) + 'L' + f1(gx + k2[0]) + ' ' + f1(gy + k2[1]) + '"/>');
        p.push('<text class="ix2-klab" x="' + f1(gx + k3[0]) + '" y="' + f1(gy + k3[1] + 4) + '" text-anchor="middle">K</text>');
        p.push('<text class="ix2-qlab" x="' + f1(gx - gr * 0.5) + '" y="' + f1(gy + gr * 0.2) + '" text-anchor="middle">Q</text>');
        p.push('<g class="ix2-needle"><path d="M0 -2.4L' + f1(gr * 0.86) + ' 0L0 2.4Z"/><circle r="4"/></g>');
        // the x rail on the bench: one tick per step of x (one reaction event)
        var rl = g.rail, n = r.steps;
        p.push('<path class="ix2-rail" d="M' + f1(rl[0]) + ' ' + rl[1] + 'H' + f1(rl[2]) + '"/>');
        for(var k = 0; k <= n; k++){ var tx = lerp(rl[0], rl[2], k / n); p.push('<path class="ix2-rtick" d="M' + f1(tx) + ' ' + (rl[1] + 7) + 'V' + (rl[1] + 12) + '"/>'); }
        p.push('<text class="ix2-xlab" x="' + f1(rl[0] - 14) + '" y="' + (rl[1] + 5) + '" text-anchor="end">x</text>');
        // the clipboard (wide) or the notebook page on the bench (phone)
        var nx = g.nx, ny = g.ny, nw = g.nw, nh = g.nh;
        if(!g.narrow){
          p.push('<rect class="ix2-board" x="' + f1(nx - 10) + '" y="' + f1(ny - 12) + '" width="' + f1(nw + 20) + '" height="' + f1(nh + 24) + '" rx="10"/>');
          p.push('<rect class="ix2-paper" x="' + nx + '" y="' + ny + '" width="' + nw + '" height="' + nh + '" rx="3"/>');
          var cw = 92; p.push('<rect class="ix2-clamp" x="' + f1(nx + nw / 2 - cw / 2) + '" y="' + f1(ny - 20) + '" width="' + cw + '" height="26" rx="6"/><rect class="ix2-clamphi" x="' + f1(nx + nw / 2 - cw / 2 + 6) + '" y="' + f1(ny - 16) + '" width="' + (cw - 12) + '" height="5" rx="2.5"/>');
        } else {
          p.push('<rect class="ix2-paper is-flat" x="' + nx + '" y="' + ny + '" width="' + nw + '" height="' + nh + '" rx="4"/>');
        }
        for(var ly = ny + g.tTop - 8; ly < ny + nh - 6; ly += 26) p.push('<path class="ix2-ruled" d="M' + (nx + 6) + ' ' + ly + 'H' + (nx + nw - 6) + '"/>');
        p.push('<path class="ix2-margin" d="M' + (nx + g.pad + g.lw - 6) + ' ' + (ny + 4) + 'V' + (ny + nh - 4) + '"/>');
        p.push('<g class="ix2-book"></g>');
        svg.innerHTML = p.join('');
        L.mols = svg.querySelector('.ix2-mols'); L.fx = svg.querySelector('.ix2-fx'); L.gas = svg.querySelector('.ix2-gas'); L.needle = svg.querySelector('.ix2-needle');
        L.book = svg.querySelector('.ix2-book');
        drawBook();
      }
      function flaskPath(){
        var g = G, R0 = g.R, n = g.neck, cx = g.cx, cy = g.cy, top = g.neckTop;
        // where the neck meets the round body
        var jy = cy - Math.sqrt(R0 * R0 - n * n);
        return 'M' + f1(cx - n) + ' ' + f1(top) + 'V' + f1(jy) + 'A' + R0 + ' ' + R0 + ' 0 1 0 ' + f1(cx + n) + ' ' + f1(jy) + 'V' + f1(top) + 'Z';
      }
      function angOf(q){
        var r = R(), lo = r.gauge[0], hi = r.gauge[1];
        var f = q <= 0 ? -0.04 : clamp((Math.log10(q) - lo) / (hi - lo), -0.04, 1.04);
        return Math.PI + f * Math.PI;   // left (low) to right (high) over the top
      }

      /* ---- the clipboard: the equation, K, the ICE table, the scale and Q */
      var BK = {};
      function txt(cls, x, y, html, anchor){ var t = mk('text', cls, { x: f1(x), y: f1(y) }); if(anchor) t.setAttribute('text-anchor', anchor); t.innerHTML = html; L.book.appendChild(t); return t; }
      function drawBook(){
        var g = G, r = R(), x0 = g.nx + g.pad, y0 = g.ny, sp = r.species, u = unitOf(r);
        L.book.innerHTML = '';
        BK = { cells: { I: [], C: [], E: [] } };
        txt('ix2-eqn', x0, y0 + (g.narrow ? 26 : 32), svgChem(eqText(r)));
        txt('ix2-kline', x0, y0 + (g.narrow ? 44 : 54), 'K<tspan class="ix-sub" dy="0.28em">' + (r.K === 'Kp' ? 'p' : 'c') + '</tspan><tspan dy="-0.28em"> = ' + esc(String(r.Kval)) + ' at ' + esc(r.T) + '</tspan>');
        var tt = y0 + g.tTop, colX = function(i){ return x0 + g.lw + g.cw * (i + 0.5); };
        // the E row's band: green once Q meets K
        BK.band = mk('rect', 'ix2-eqband', { x: f1(x0 - 6), y: f1(tt + g.hh + 2 * g.rh + 2), width: f1(g.nw - 2 * g.pad + 12), height: f1(g.rh - 4), rx: 6 });
        L.book.appendChild(BK.band);
        txt('ix2-unit', x0, tt + g.hh - 10, esc(u));
        sp.forEach(function(s, i){
          var cx = colX(i);
          // the key: a small drawing of the molecule over its name (the flask draws no letters)
          var icon = mk('g', 'ix2-icon', { transform: 'translate(' + f1(cx) + ' ' + f1(tt + (g.narrow ? 13 : 15)) + ')' });
          var sc = g.narrow ? 0.5 : 0.62, t = TEMPL[s.key].slice().sort(function(p, q){ return (p.z || 0) - (q.z || 0) || (q.r || 9) - (p.r || 9); });
          icon.innerHTML = t.map(function(at){ return '<g class="pt-atom ' + (ELC[at.el] || 'pa') + '" transform="translate(' + f1(at.dx * sc) + ' ' + f1(at.dy * sc) + ')">' + atomSvg(at.el, (at.r || 9) * sc) + '</g>'; }).join('');
          L.book.appendChild(icon);
          txt('ix2-sp', cx, tt + g.hh - 10, r.K === 'Kp' ? 'P<tspan class="ix-sub" dy="0.28em">' + svgChem(s.html).replace(/<tspan class="ix-sub" dy="0.28em">/g, '<tspan>').replace(/<tspan dy="-0.28em"> <\/tspan>/g, '') + '</tspan><tspan dy="-0.28em"> </tspan>' : '[' + svgChem(s.html) + ']', 'middle');
        });
        L.book.appendChild(mk('path', 'ix2-tline', { d: 'M' + f1(x0 - 4) + ' ' + f1(tt + g.hh) + 'H' + f1(g.nx + g.nw - g.pad + 4) }));
        ROWS.forEach(function(rw, ri){
          var ry = tt + g.hh + ri * g.rh;
          if(ri) L.book.appendChild(mk('path', 'ix2-rline', { d: 'M' + f1(x0 - 4) + ' ' + f1(ry) + 'H' + f1(g.nx + g.nw - g.pad + 4) }));
          txt('ix2-row', x0 + (g.narrow ? 4 : 2), ry + (g.narrow ? g.rh / 2 + 7 : g.rh / 2 + 2), rw[0]);
          if(!g.narrow) BK['w' + rw[0]] = txt('ix2-roww', x0 + 2, ry + g.rh / 2 + 18, rw[0] === 'E' ? 'at this x' : rw[1].toLowerCase());
          sp.forEach(function(s, i){
            var cx = colX(i), cell = {};
            if(rw[0] === 'I') cell.v = txt('ix2-val', cx, ry + g.rh / 2 + 6, '', 'middle');
            else { cell.e = txt('ix2-expr', cx, ry + g.rh / 2 - 6, '', 'middle'); cell.v = txt('ix2-val', cx, ry + g.rh / 2 + 14, '', 'middle'); }
            BK.cells[rw[0]].push(cell);
          });
        });
        var by = tt + g.hh + 3 * g.rh;
        L.book.appendChild(mk('path', 'ix2-tline', { d: 'M' + f1(x0 - 4) + ' ' + f1(by) + 'H' + f1(g.nx + g.nw - g.pad + 4) }));
        BK.key = txt('ix2-key', x0, by + (g.narrow ? 22 : 26), '1 molecule = ' + esc(String(r.per)) + ' ' + esc(u));
        BK.q = txt('ix2-qline', x0, by + (g.narrow ? 48 : 56), '');
        // the fixed parts of the C and E rows (in x)
        sp.forEach(function(s, i){
          var c = Math.abs(s.nu) > 1 ? Math.abs(s.nu) : '';
          BK.cells.C[i].e.textContent = (s.nu < 0 ? '−' : '+') + c + 'x';
          var i0 = r.n0[i] * r.per;
          BK.cells.E[i].e.textContent = i0 === 0 ? c + 'x' : fmt(i0) + ' ' + (s.nu < 0 ? '−' : '+') + ' ' + c + 'x';
          BK.cells.I[i].v.textContent = fmt(i0);
        });
      }
      function qExprHtml(r){
        var name = function(s){ return r.K === 'Kp' ? 'P<tspan class="ix-sub" dy="0.28em">' + svgChem(s.html).replace(/<tspan class="ix-sub" dy="0.28em">/g, '<tspan>').replace(/<tspan dy="-0.28em"> <\/tspan>/g, '') + '</tspan><tspan dy="-0.28em"> </tspan>' : '[' + svgChem(s.html) + ']'; };
        var pw = function(s){ var n = Math.abs(s.nu); return n > 1 ? '<tspan class="ix-sup" dy="-0.45em">' + n + '</tspan><tspan dy="0.45em"> </tspan>' : ''; };
        var top = r.species.filter(function(s){ return s.nu > 0; }).map(function(s){ return name(s) + pw(s); }).join('');
        var bot = r.species.filter(function(s){ return s.nu < 0; }).map(function(s){ return name(s) + pw(s); }).join('');
        return top + ' / ' + (r.species.filter(function(s){ return s.nu < 0; }).length > 1 ? '(' + bot + ')' : bot);
      }

      /* ---- the readouts, from the drawn counts */
      var shown = null;
      function paintReadouts(force){
        var r = R(), c = countsDrawn(), key = c.join(',');
        if(!force && key === drawnKey) return;
        var prev = shown ? shown.c : null;
        drawnKey = key;
        var x = xOf(r, c), q = Qof(r, c), ke = eqStep(r), k = Math.round(x / r.per), at = k === ke;
        shown = { c: c, x: x, q: q, k: k, at: at };
        r.species.forEach(function(s, i){
          var cv = BK.cells.C[i].v, ev = BK.cells.E[i].v;
          cv.textContent = x === 0 ? '0' : (s.nu < 0 ? '−' : '+') + fmt(Math.abs(s.nu) * x);
          ev.textContent = fmt(c[i] * r.per);
          if(prev && prev[i] !== c[i]){ tick(ev); tick(cv); }
        });
        BK.q.innerHTML = 'Q = ' + qExprHtml(r) + ' = <tspan class="ix2-qv">' + esc(fmtQ(q)) + '</tspan>';
        BK.band.classList.toggle('is-on', at);
        if(BK.wE) BK.wE.textContent = at ? 'equilibrium' : 'at this x';
        svg.classList.toggle('is-eq', at);
        // the gas colour from the drawn coloured molecules
        var ti = idx(r.tint.key), most = 0; for(var kk = 0; kk <= r.steps; kk++) most = Math.max(most, countsAt(r, kk)[ti]);
        L.gas.style.opacity = (0.08 + 0.5 * c[ti] / most).toFixed(3);
        needle.to = angOf(q); if(needle.a == null) needle.a = needle.to;
        kick();
        if(slider) slider.place();   // the knob's tag follows the drawn x
        paintCause();
        again.hidden = k === 0 && S.target === 0;
      }
      function tick(t){ t.classList.remove('is-tick'); requestAnimationFrame(function(){ t.classList.add('is-tick'); }); }
      function paintCause(){
        var r = R(), s = shown, u = unitOf(r), parts;
        clearTimeout(takeT);
        var xs = s.x === 0 ? 'x 0' : 'x ' + fmt(s.x) + ' ' + u, Ks = 'K ' + r.Kval;
        if(s.at) parts = [{ t: xs, role: 'x' }, { t: 'Q ' + fmtQ(s.q), role: 'q' }, { t: 'meets ' + Ks, role: 'k' }, { t: 'at equilibrium', role: 'eq' }];
        else if(s.q < r.Kval) parts = [{ t: xs, role: 'x' }, { t: 'Q ' + fmtQ(s.q), role: 'q' }, { t: 'below ' + Ks, role: 'k' }, { t: s.k === 0 ? 'runs forward' : 'still runs forward', role: 'ink' }];
        else parts = [{ t: xs, role: 'x' }, { t: 'Q ' + fmtQ(s.q), role: 'q' }, { t: 'above ' + Ks, role: 'k' }, { t: 'would run back', role: 'ink', say: 'the reverse reaction would bring it back' }];
        cause.set(parts, s.k === 0 && S.target === 0 ? 'Start:' : '');
      }
      function settled(){
        var s = shown; if(!s) return;
        say(cause.text());
        clearTimeout(takeT);
        if(s.at && S.mode === 'explore') takeT = setTimeout(function(){ if(!busy() && shown.at) cause.take('At equilibrium Q = K: that is the x the ICE table solves for.'); }, 1100);
      }

      /* ---------------------------------------------------- the molecules and their reactions */
      var slotUse = [];
      function freeSlotNear(x, y, avoid){
        var best = -1, bd = Infinity;
        G.slots.forEach(function(p, i){ if(slotUse[i] || (avoid && avoid.indexOf(i) > -1)) return; var d = Math.hypot(p[0] - x, p[1] - y); if(d < bd){ bd = d; best = i; } });
        return best;
      }
      function slotAngle(i){ var r = rng(7 + i * 13 + S.ri * 101); return (r() - 0.5) * 1.6; }
      // lay out the molecules for step k at once (a fresh picture: first draw, another reaction, Start over, reduced motion)
      function layoutAt(k){
        mols.forEach(dropMol); mols = []; events = []; L.fx.innerHTML = '';
        slotUse = G.slots.map(function(){ return null; });
        var r = R(), c = countsAt(r, k), order = G.slots.map(function(p, i){ return i; }), rr = rng(31 + S.ri * 7);
        for(var i = order.length - 1; i > 0; i--){ var j = Math.floor(rr() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
        var n = 0;
        r.species.forEach(function(s, si){ for(var q = 0; q < c[si]; q++){ var sl = order[n++]; var m = newMol(s.key, G.slots[sl][0], G.slots[sl][1], slotAngle(sl)); m.slot = sl; slotUse[sl] = m; mols.push(m); } });
      }
      function busy(){ return events.length > 0; }
      // the net steps on their way and not yet drawn (an event counts from its start until its products have formed)
      function pendingK(){ return events.reduce(function(a, e){ return a + (e.formed ? 0 : e.dir); }, 0); }
      function logicalK(){ var r = R(), c = countsDrawn(); return Math.round(xOf(r, c) / r.per); }
      function idle(m){ return m.state === 'whole'; }
      function pickNear(key, x, y, not){
        var best = null, bd = Infinity;
        mols.forEach(function(m){ if(m.key !== key || !idle(m) || m === not) return; var d = Math.hypot(m.x - x, m.y - y); if(d < bd){ bd = d; best = m; } });
        return best;
      }
      function pickAny(key, seed){ var list = mols.filter(function(m){ return m.key === key && idle(m); }); if(!list.length) return null; return list[Math.floor(rng(seed)() * list.length)]; }
      var evSeed = 1;
      function inside(x, y, pad){ var dx = x - G.cx, dy = y - (G.cy + 2), d = Math.hypot(dx, dy), lim = G.R - 8 - pad; if(d <= lim) return [x, y]; return [G.cx + dx / d * lim, G.cy + 2 + dy / d * lim]; }
      /* One reaction event. Forward: the reactants of one step meet, their atoms swap partners (a short glow), the
         products leave to the reactants' places. Reverse: the same, backward. The reactants count until the products
         have formed (t = 0.55); then the products count. */
      function launch(dir){
        var r = R(), sp = r.species, reac = sp.filter(function(s){ return dir > 0 ? s.nu < 0 : s.nu > 0; }), prod = sp.filter(function(s){ return dir > 0 ? s.nu > 0 : s.nu < 0; });
        // the molecules that go in: every coefficient's worth, the first picked at random, the rest the nearest to it
        var ins = [], first = null;
        for(var a = 0; a < reac.length; a++){
          for(var b = 0; b < Math.abs(reac[a].nu); b++){
            var m = !first ? pickAny(reac[a].key, 1000 + (evSeed++) * 17) : pickNear(reac[a].key, first.x, first.y, null);
            if(m && ins.indexOf(m) > -1){ var alt = mols.filter(function(z){ return z.key === reac[a].key && idle(z) && ins.indexOf(z) < 0; }); m = alt.length ? alt.sort(function(p, q){ return Math.hypot(p.x - first.x, p.y - first.y) - Math.hypot(q.x - first.x, q.y - first.y); })[0] : null; }
            if(!m){ ins.forEach(function(z){ z.state = 'whole'; }); return false; }
            if(!first) first = m;
            ins.push(m); m.state = 'busy';
          }
        }
        var cx = ins.reduce(function(s, m){ return s + m.x; }, 0) / ins.length, cy = ins.reduce(function(s, m){ return s + m.y; }, 0) / ins.length;
        var P = inside(cx, cy, 30 * G.s);
        // where each reactant waits at the meeting point (stacked, level)
        var gap = 13 * G.s;
        ins.forEach(function(m, i){ m.from = [m.x, m.y, m.a]; m.meet = [P[0], P[1] + (i - (ins.length - 1) / 2) * gap * 2, 0]; });
        // the products: their atoms come from the reactants' atoms, element by element
        var pool = [];
        ins.forEach(function(m){ m.atoms.forEach(function(at){ pool.push({ m: m, at: at }); }); });
        var outs = [], k = 0, np = prod.reduce(function(s, p){ return s + Math.abs(p.nu); }, 0);
        prod.forEach(function(p){ for(var b = 0; b < Math.abs(p.nu); b++){
          // two products side by side, turned so each takes the atoms on its own side (NO₂ faces outward)
          var off = (k - (np - 1) / 2) * 26 * G.s, pm = { key: p.key, atoms: [], state: 'forming', x: P[0] + off, y: P[1], a: np > 1 ? (p.key === 'NO2' && off > 0 ? -Math.PI / 2 : Math.PI / 2) : 0 };
          TEMPL[p.key].slice().sort(function(u, v){ return (u.z || 0) - (v.z || 0) || (v.r || 9) - (u.r || 9); }).forEach(function(at){
            var src = null; for(var q = 0; q < pool.length; q++) if(!pool[q].used && pool[q].at.el === at.el){ src = pool[q]; pool[q].used = true; break; }
            pm.atoms.push({ el: at.el, dx: at.dx, dy: at.dy, src: src, n: null });
          });
          outs.push(pm); k++;
        } });
        // their places: the reactants' places first, then the nearest free ones
        var freed = ins.map(function(m){ return m.slot; });
        outs.forEach(function(pm, i){
          var sl = i < freed.length ? freed[i] : freeSlotNear(P[0], P[1], freed);
          pm.slot = sl;
        });
        ins.forEach(function(m){ if(outs.every(function(pm){ return pm.slot !== m.slot; })) slotUse[m.slot] = null; });
        outs.forEach(function(pm){ slotUse[pm.slot] = pm; });
        var e = { dir: dir, ins: ins, outs: outs, P: P, t0: now(), dur: 820, formed: false, glow: null };
        events.push(e);
        return true;
      }
      function stepEvent(e, tn){
        var t = clamp((tn - e.t0) / e.dur, 0, 1);
        if(t < 0.4){
          var u = ease(t / 0.4);
          e.ins.forEach(function(m){ poseMol(m, lerp(m.from[0], m.meet[0], u), lerp(m.from[1], m.meet[1], u), lerp(m.from[2], m.meet[2], u)); });
          return;
        }
        if(!e.swapped){
          // the reactants' atoms now belong to the products being formed (the old molecules stay counted until formed)
          e.swapped = true;
          e.ins.forEach(function(m){ m.state = 'old'; m.atoms.forEach(function(at){ at.keep = [at.wx, at.wy]; }); });
          e.outs.forEach(function(pm){ pm.atoms.forEach(function(a){ a.n = a.src.at.n; a.start = [a.src.at.wx, a.src.at.wy]; }); });
          e.glow = mk('circle', 'ix2-glow', { cx: f1(e.P[0]), cy: f1(e.P[1]), r: f1(30 * G.s) }); L.fx.appendChild(e.glow);
        }
        var gG = clamp((t - 0.4) / 0.15, 0, 1), gl = Math.sin(Math.PI * clamp((t - 0.38) / 0.24, 0, 1));
        if(e.glow) e.glow.style.opacity = (0.75 * gl).toFixed(2);
        if(t < 0.55){
          var w = ease(gG);
          e.outs.forEach(function(pm){ pm.atoms.forEach(function(a){ var p = atomPos(pm, a, pm.x, pm.y, pm.a); setAtomN(a, lerp(a.start[0], p[0], w), lerp(a.start[1], p[1], w)); }); });
          return;
        }
        if(!e.formed){
          e.formed = true;
          // formed: the old molecules go (their atom nodes now belong to the products), the products count
          e.ins.forEach(function(m){ var i = mols.indexOf(m); if(i > -1) mols.splice(i, 1); });
          e.outs.forEach(function(pm){ pm.state = 'moving'; pm.from = [pm.x, pm.y, pm.a]; var sp = G.slots[pm.slot]; pm.to = [sp[0], sp[1], slotAngle(pm.slot)]; mols.push(pm); });
          paintReadouts();
        }
        var v = ease(clamp((t - 0.55) / 0.45, 0, 1));
        e.outs.forEach(function(pm){ var x = lerp(pm.from[0], pm.to[0], v), y = lerp(pm.from[1], pm.to[1], v), a = lerp(pm.from[2], pm.to[2], v); pm.x = x; pm.y = y; pm.a = a; pm.atoms.forEach(function(at){ var p = atomPos(pm, at, x, y, a); setAtomN(at, p[0], p[1]); }); });
        if(t >= 1){
          e.outs.forEach(function(pm){ pm.state = 'whole'; });
          if(e.glow) e.glow.remove();
          e.done = true;
        }
      }
      function setAtomN(a, x, y){ a.wx = x; a.wy = y; a.n.setAttribute('transform', 'translate(' + f1(x) + ' ' + f1(y) + ')'); }
      function kick(){ if(!raf) raf = requestAnimationFrame(frame); }
      function frame(){
        raf = 0;
        var tn = now();
        // launch the steps still needed toward the knob, a little apart (closer when far behind)
        var want = S.target - (logicalK() + pendingK());
        if(want !== 0 && events.length < 5 && tn - lastLaunch > Math.max(60, 150 - 12 * Math.abs(want))){
          if(launch(want > 0 ? 1 : -1)) lastLaunch = tn;
        }
        events.forEach(function(e){ stepEvent(e, tn); });
        events = events.filter(function(e){ return !e.done; });
        // the needle eases to the drawn Q
        if(needle.to != null){ var d = needle.to - needle.a; needle.a = Math.abs(d) < 0.002 ? needle.to : needle.a + d * 0.22; paintNeedle(); }
        var more = events.length || S.target !== logicalK() + pendingK() || (needle.to != null && needle.a !== needle.to);
        if(more){ dirty = true; raf = requestAnimationFrame(frame); }
        else if(dirty){ dirty = false; paintCause(); settled(); }
      }
      function paintNeedle(){ L.needle.setAttribute('transform', 'translate(' + G.gx + ' ' + G.gy + ') rotate(' + (needle.a * 180 / Math.PI).toFixed(2) + ')'); }
      // finish everything now (leaving Explore, the stage hidden, reduced motion): the picture of the knob's step
      function snap(){
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        if(!G) return;
        layoutAt(S.target); drawnKey = ''; paintReadouts(true); needle.a = needle.to; paintNeedle(); settled();
      }
      function crossFade(fn){
        var old = L.mols.cloneNode(true); old.setAttribute('class', 'ix2-old');
        L.mols.parentNode.insertBefore(old, L.mols.nextSibling);
        fn();
        if(!old.animate){ old.remove(); return; }
        L.mols.style.opacity = '0';
        var an = old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
        an.onfinish = function(){ old.remove(); L.mols.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 }); L.mols.style.opacity = ''; };
      }

      /* ---------------------------------------------------- the x knob */
      var slider = null;
      function makeSlider(){
        if(slider) slider.el.remove();
        var r = R();
        slider = K.drag(layer, { key: 'apchem-ice-x', label: 'x, the extent of reaction', min: 0, max: r.steps, step: 1, value: S.target, track: G.rail,
          valuetext: function(v){ return 'x = ' + fmt(v * r.per) + ' ' + unitOf(r) + ', step ' + v + ' of ' + r.steps; },
          // the tag says the DRAWN x (it catches up as the molecules react)
          tag: function(){ var x = shown ? shown.x : 0; return 'x = ' + (x === 0 ? '0' : fmt(x)) + ' ' + unitOf(r); }, tagSide: 'up', chip: false,
          onInput: function(v){ setTarget(v); } });
      }
      function setTarget(v){
        S.target = v; tourDid('drag');
        cause.take(null); clearTimeout(takeT);
        if(K.reduced()){ crossFade(function(){ layoutAt(v); }); drawnKey = ''; paintReadouts(true); needle.a = needle.to; paintNeedle(); settled(); return; }
        kick();
      }

      /* ---------------------------------------------------- layout */
      var lastW = 0;
      function layoutNow(force){
        var r0 = sceneBox.getBoundingClientRect(), W = Math.round(r0.width);
        if(!W || (!force && W === lastW && G)) { if(cue.active()) cue.place(); return; }
        lastW = W;
        phone = W < 640;
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        G = geo(W);
        sceneBox.style.height = G.H + 'px';
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + G.H); svg.setAttribute('width', W); svg.setAttribute('height', G.H);
        sceneBox.classList.toggle('is-narrow', phone);
        drawStatic();
        layoutAt(S.target);
        drawnKey = ''; shown = null; paintReadouts(true); needle.a = needle.to; paintNeedle();
        makeSlider();
        svg.setAttribute('aria-label', describe());
        if(cue.active()) cue.place();
        settled();
      }
      function describe(){
        var r = R();
        return 'A sealed flask of ' + eqText(r).replace(' ⇌ ', ' reacting to ') + ', the molecules drawn with their atoms; a clipboard with the ICE table; a Q gauge on the flask with K marked.';
      }
      function pickReaction(v){
        var i = RX.map(function(r){ return r.id; }).indexOf(v); if(i < 0 || i === S.ri) return;
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        S.ri = i; S.target = 0; cause.take(null);
        crossFade(function(){});
        layoutNow(true); refHtml();
      }
      function startOver(){
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
        S.target = 0; cause.take(null);
        crossFade(function(){ layoutAt(0); });
        drawnKey = ''; paintReadouts(true); needle.a = needle.to; paintNeedle();
        slider.value(0); settled();
      }

      /* ---------------------------------------------------- the cue and Show me how */
      // the one first visit cue, along the rail to the right of the knob (it covers no label or number)
      var cue = K.cue(layer, { key: 'apchem-ice-x', text: 'Drag x', side: 'right', at: function(){ var x = G ? lerp(G.rail[0], G.rail[2], S.target / R().steps) : 0; return G ? [x, G.rail[1]] : [0, 0]; } });
      function hideCue(used){ if(cue.active()) cue.hide(used); }
      stage.addEventListener('pointerdown', function(e){ if(sceneBox.contains(e.target)) hideCue(true); }, true);
      stage.addEventListener('keydown', function(e){ if(sceneBox.contains(e.target) && /^(Arrow|Page|Home|End)/.test(e.key)) hideCue(true); }, true);
      function rectOf(x, y, w, h){ var r0 = svg.getBoundingClientRect(), k = r0.width / G.W; return { left: r0.left + x * k, top: r0.top + y * k, right: r0.left + (x + w) * k, bottom: r0.top + (y + h) * k, width: w * k, height: h * k }; }
      var tour = K.tour({ key: 'apchem-ice-tables', label: 'Show me how', steps: [
        { id: 'drag', text: 'Drag x. Each step reacts a few more molecules in the flask.', target: function(){ return slider ? slider.el.querySelector('.tk2-knob') : sceneBox; } },
        { id: 'table', text: 'The ICE table writes it down: C is the change in x, E is I + C.', target: function(){ return G ? rectOf(G.nx, G.ny, G.nw, G.nh) : sceneBox; } },
        { id: 'gauge', text: 'Q climbs to the K notch. Where they meet is the equilibrium x.', target: function(){ return G ? rectOf(G.gx - G.gr - 4, G.gy - G.gr - 16, 2 * G.gr + 8, G.gr * 1.5 + 20) : sceneBox; } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      function tourDid(id){ if(tour.active()) tour.did(id); }
      function startTour(){ if(S.mode !== 'explore') return; hideCue(false); tour.start(true); }

      /* ---------------------------------------------------- "?" */
      var ref = document.createElement('div'); ref.className = 'ls-sec ix2-ref';
      function refHtml(){
        var r = R(), u = unitOf(r), ke = eqStep(r), c = countsAt(r, ke), x = ke * r.per, i0 = r.n0[0] * r.per;
        var sp = r.species, reac = sp.filter(function(s){ return s.nu < 0; }), prod = sp.filter(function(s){ return s.nu > 0; });
        var nm = function(s){ return (r.K === 'Kp' ? 'P(' + s.html + ')' : '[' + s.html + ']') + (Math.abs(s.nu) > 1 ? '<sup>' + Math.abs(s.nu) + '</sup>' : ''); };
        var expr = prod.map(nm).join('') + ' / ' + (reac.length > 1 ? '(' + reac.map(nm).join('') + ')' : reac.map(nm).join(''));
        var step = r.id === 'hi' ? 'one H₂ and one I₂ become two HI, so [H₂] and [I₂] each fall by x and [HI] rises by 2x' : 'one N₂O₄ splits into two NO₂, so P(N₂O₄) falls by x and P(NO₂) rises by 2x';
        ref.innerHTML = '<p class="ix2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>' +
          '<h3 class="ls-title-l">The flask and the table</h3><p>Each step of x is one reaction event in the flask: ' + step + '. One molecule stands for ' + r.per + ' ' + u + ', so the table\'s numbers are the molecules you can count. I is what was put in; C is the change, written in x from the coefficients (reactants −, products +); E is I + C.</p>' +
          '<h3 class="ls-title-l">Q and K</h3><p>' + (r.K === 'Kp' ? 'K<sub>p</sub>' : 'K<sub>c</sub>') + ' = ' + expr + ' = ' + r.Kval + ' at ' + esc(r.T) + '. Q is the same expression with the amounts at this x. Q below K: the reaction still runs forward. Q above K: the reverse reaction runs until Q comes back down to K. At equilibrium Q = K, and that is the x an ICE problem solves for. K changes only with temperature; moving x changes Q, never K.</p>' +
          '<p>Only gases and dissolved species go into K. A pure solid or a pure liquid is left out (its amount does not change its concentration). Both reactions here are all gas, so every species is in the expression. On the exam K is written without units.</p>' +
          '<h3 class="ls-title-l">Why Q lands near K, not on it</h3><p>The flask holds whole molecules, so x moves in steps of ' + r.per + ' ' + u + '. The step nearest K is x = ' + fmt(x) + ' ' + u + ', where Q = ' + fmtQ(Qof(r, c)) + ' (within ' + Math.max(1, Math.round(100 * Math.abs(Qof(r, c) / r.Kval - 1))) + '% of K). Solved exactly, x = ' + fmt(exactX(r)) + ' ' + u + ', the same to three significant figures.</p>' +
          '<h3 class="ls-title-l">When x is small: the 5% rule</h3><p>When K is small, x is small next to the starting amount, so you may write (' + fmt(i0) + ' − x) ≈ ' + fmt(i0) + ', solve, then check: if the change is more than 5% of the starting amount, the shortcut is not good enough and you solve the full equation (the quadratic formula). It does not apply here: x is ' + Math.round(100 * x * Math.abs(reac[0].nu) / i0) + '% of the starting ' + (r.K === 'Kp' ? 'P(' + reac[0].html + ')' : '[' + reac[0].html + ']') + '. Test yourself has small K problems with the 5% check.</p>' +
          '<h3 class="ls-title-l">K<sub>c</sub> and K<sub>p</sub></h3><p>H₂ + I₂ uses concentrations in mol/L (K<sub>c</sub>); N₂O₄ here uses partial pressures in atm (K<sub>p</sub>). The table works the same way with either. At a fixed volume and temperature a gas\'s partial pressure is proportional to its number of molecules, so one molecule stands for a fixed pressure.</p>' +
          '<h3 class="ls-title-l">The colours</h3><p>I₂ vapour is violet and NO₂ is brown; H₂, HI and N₂O₄ are colourless, so the gas in the flask fades as I₂ is used up, or browns as NO₂ forms. Atoms: H white, I purple, N blue, O red. The flask\'s molecules are drawn still between reactions; in a real gas they never stop moving.</p>' +
          '<h3 class="ls-title-l">The constants</h3><ul class="ix2-list">' + RX.map(function(z){ return '<li>' + esc(eqText(z)) + ': ' + (z.K === 'Kp' ? 'K<sub>p</sub>' : 'K<sub>c</sub>') + ' = ' + z.Kval + ' at ' + esc(z.T) + '. ' + esc(z.source.replace(/ See docs\/.*$/, '').replace(/ \(docs\/.*\)\.?$/, '.').replace(/, the same value as.*$/, '.').replace(/ \(chem\/data.*$/, '.')) + '</li>'; }).join('') + '</ul>' +
          '<h3 class="ls-title-l">' + esc(data.howItWorksTitle || 'How Test yourself checks') + '</h3>' + T.wrapTables(data.howItWorks) +
          '<p class="bt-small">Notes: <a href="../notes/equilibrium-concentrations.html">Calculating equilibrium concentrations</a></p>';
      }
      function exactX(r){
        var Qx = function(x){ return r.n0.reduce(function(q, n, i){ return q * Math.pow(n * r.per + r.species[i].nu * x, r.species[i].nu); }, 1); };
        var lo = 0, hi = r.steps * r.per; for(var i = 0; i < 100; i++){ var m = (lo + hi) / 2; if(Qx(m) < r.Kval) lo = m; else hi = m; }
        return lo;
      }
      ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(ctx.studio) ctx.studio.close(); if(S.mode !== 'explore' && ctx.studio && ctx.studio.kit2) ctx.studio.kit2.go('explore'); setTimeout(startTour, 60); });

      /* ================================================== TEST YOURSELF: the drill, unchanged */
      var qz = document.createElement('div'); qz.className = 'bt-pane bt-pane-quiz ix2-quiz';
      app.appendChild(qz);
      quiz(qz, data, M);
      var drillStage = ctx.studio ? ctx.studio.root.querySelector('.ls-drill-stage') : null, drillDock = qz.querySelector('.cd-problem');
      function shownMode(mode){
        var was = S.mode; S.mode = mode;
        tour.stop();
        stage.setAttribute('data-view', mode);
        if(mode !== 'explore'){ hideCue(false); clearTimeout(takeT); if(was === 'explore' && G && (busy() || raf)) snap(); return; }
        setTimeout(function(){ layoutNow(); if(!tour.active()) cue.show(); if(cue.active()) cue.place(); }, 30);
      }
      ctx.kit2 = { stage: stage, ref: ref, onShow: shownMode,
        parts: [{ value: 'quiz', label: 'Problems', placed: true, stage: drillStage, dock: drillDock }],
        about: [(function(){ var d = document.createElement('div'); d.className = 'bt-intro'; d.innerHTML = data.intro; return d; })()],
        start: function(){ try{ if(/[?&#]seed=\d+/.test(location.search + location.hash) || /^#quiz\b/.test(location.hash)) return { mode: 'quiz', part: 'quiz' }; }catch(e){} return null; } };
      refHtml();
      if(!ctx.studio){ app.insertBefore(stage, app.firstChild); app.insertBefore(ref, stage.nextSibling); shownMode('explore'); }
      // the stage stops when it is hidden (another tab of the page, scrolled away mid change)
      if(window.IntersectionObserver) new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting && (busy() || raf) && S.mode === 'explore') snap(); }); }).observe(sceneBox);
      document.addEventListener('visibilitychange', function(){ if(document.hidden && (busy() || raf)) snap(); });
      if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if(G) layoutNow(true); });
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(function(){ layoutNow(); }, 50); }).observe(sceneBox); }
      else window.addEventListener('resize', function(){ layoutNow(); });
      // for the sweep and the frames check (scripts/tools-v2/chem-ice-tables-sweep.mjs): the drawn state
      window.__ice2 = {
        G: function(){ return G; }, busy: function(){ return busy() || !!raf; }, target: function(){ return S.target; }, react: function(){ return R(); },
        drawn: function(){ return countsDrawn(); }, shown: function(){ return shown; }, needle: function(){ return needle.a; }, angOf: angOf, Qof: function(c){ return Qof(R(), c); }, eqStep: function(){ return eqStep(R()); },
        mols: function(){ return mols.map(function(m){ return { key: m.key, state: m.state, atoms: m.atoms.map(function(a){ return [a.wx, a.wy]; }) }; }); },
        events: function(){ return events.map(function(e){ return { dir: e.dir, formed: e.formed, swapped: !!e.swapped, ins: e.ins.map(function(m){ return m.key; }), atoms: e.outs.map(function(pm){ return pm.atoms.map(function(a){ return a.n ? [a.wx, a.wy] : null; }); }) }; }); },
        set: function(k){ slider.value(k, true); }, snap: snap
      };
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }

  /* ================================================== the drill (Test yourself), as before the rebuild */
  function quiz(app, data, M){
    var Q = window.ApChemQuestions, live = null;
    T.drill(app, data, {
      slug: 'ice-table-drills',
      generate: function(r, ctx, type){ return M.ice.generate(r, ctx, type); },
      types: [{ value: 'findK', label: 'Find K' }, { value: 'smallx', label: 'Small K and the 5% check' }, { value: 'square', label: 'Perfect square' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return TITLE[p.type]; },
      extra: function(host, p, api){
        var unit = p.Kp ? 'atm' : 'M';
        host.innerHTML = '<div class="ic-wrap"><div class="table-wrap" tabindex="0" role="region" aria-label="ICE table"><table class="chem-data cd-ice"><caption>ICE table (' + (p.Kp ? 'partial pressures, atm' : 'concentrations, M') + ')</caption><thead><tr><th scope="col">Row</th>' +
          p.species.map(function(s){ return '<th scope="col">' + (p.Kp ? 'P<sub>' + s.html + '</sub>' : '[' + s.html + ']') + '</th>'; }).join('') + '</tr></thead><tbody>' +
          ROWS.map(function(rw){
            return '<tr data-row="' + rw[0] + '"><th scope="row">' + rw[0] + ' <span class="bt-small">' + rw[1] + '</span></th>' + p.species.map(function(s, i){
              return '<td data-i="' + i + '" data-label="' + rw[1] + ' ' + (p.Kp ? 'P ' : '') + plain(s.html) + (rw[0] === 'C' ? ' (in terms of x)' : ' (' + unit + ')') + '"><span class="cd-blank" aria-hidden="true">·</span></td>';
            }).join('') + '</tr>';
          }).join('') + '</tbody></table></div>' +
          '<div class="ic-live" hidden><div class="ic-beaker"></div><p class="bt-small ic-cap"></p>' + BARS + '</div></div>';
        live = view(host, p, M, Q);
        // The table moves to the Tool Studio's stage with this host, so the
        // typing is heard here (api.area stays in the dock).
        var onType = function(e){ if(e.target.classList && e.target.classList.contains('cd-cell')) live.read(); };
        host.addEventListener('input', onType);
        if(!api.area.contains(host)) api.area.addEventListener('input', onType);
        live.draw();
      },
      onStep: function(s){ if(live) live.checked(s); },
      // Tool Studio: the problem and the table on the stage, the step below.
      textOnStage: true, studioCaption: 'Fill the table one row at a time.'
    });
  }

  function view(host, p, M, Q){
    var F = T.F, esc = T.esc, n = p.species.length, sp = p.species.map(function(s){ return { html: s.html, nu: s.nu }; });
    var rows = { I: arr(), C: arr(), E: arr() }, sure = { I: false, C: false, E: false }, kDone = p.type !== 'findK';
    function arr(){ var a = []; for(var i = 0; i < n; i++) a.push(null); return a; }
    // One scale for the whole problem: the largest amount any row can show.
    var top = Math.max.apply(null, p.c0.concat(p.E)) * 1.15;
    var perP = top / 9;
    // References kept: the live view may move to the Tool Studio's stage.
    var chart = host.querySelector('.ic-chart'), capEl = host.querySelector('.ic-cap'), live = host.querySelector('.ic-live');
    host.querySelector('.ic-barsd').addEventListener('toggle', function(){ draw(); });
    var beaker = window.ApChemBeaker.mount(host.querySelector('.ic-beaker'), {
      species: p.species.map(function(s, i){ return { key: 's' + i, label: plain(s.html), name: plain(s.html), tone: i + 1 }; }),
      readout: 'qk', title: 'The mixture', max: 22, seed: 3, vessel: 'gas' });
    function read(){
      ['I', 'C', 'E'].forEach(function(r){
        if(sure[r]) return;
        host.ownerDocument.querySelectorAll('[data-row="' + r + '"] [data-i] input').forEach(function(inp){
          var k = +inp.closest('[data-i]').getAttribute('data-i'), raw = inp.value.trim();
          var x = !raw ? null : r === 'C' ? M.parseCoef(raw) : Q.parseNumber(raw.replace(/\s/g, ''));
          rows[r][k] = raw && isFinite(x) ? x : null;
        });
      });
      draw();
    }
    function checked(s){
      if(s.kind === 'row' || s.kind === 'coef'){ rows[s.row] = s.cells.map(function(c){ return c.answer; }); sure[s.row] = true; }
      if(s.key === 'K') kDone = true;
      draw();
    }
    function draw(){
      var fb = T.fitBox(chart, 320, 190, { w: 160, h: 120 }), W = fb.w, H = fb.h, L = fb.fit ? 40 : 34, B = 34, Tp = fb.fit ? 18 : 14, pw = W - L - 8, ph = H - Tp - B, gw = pw / n;
      var y = function(v){ return Tp + ph - Math.max(0, Math.min(top, v)) / top * ph; };
      var g = [], tick = top > 1 ? M.round(top / 2, 1) : M.sig(top / 2, 1);
      g.push('<line class="axis" x1="' + L + '" x2="' + (L + pw) + '" y1="' + (Tp + ph) + '" y2="' + (Tp + ph) + '"/>');
      [0, tick].forEach(function(v){ g.push('<text class="tick" x="' + (L - 4) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + M.fmt(v, 2) + '</text><line class="grid" x1="' + L + '" x2="' + (L + pw) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/>'); });
      var say = [];
      for(var i = 0; i < n; i++){
        var x0 = L + gw * i, bw = Math.min(30, gw * 0.3), cx = x0 + gw / 2;
        var I = rows.I[i], E = rows.E[i], C = rows.C[i];
        if(I != null) g.push('<rect class="ic-bi' + (sure.I ? '' : ' is-typed') + '" x="' + (cx - bw - 3).toFixed(1) + '" y="' + y(I).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (Tp + ph - y(I)).toFixed(1) + '"/>');
        if(E != null) g.push('<rect class="ic-be' + (sure.E ? '' : ' is-typed') + '" x="' + (cx + 3).toFixed(1) + '" y="' + y(E).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (Tp + ph - y(E)).toFixed(1) + '"/>');
        if(C != null && C !== 0) g.push('<text class="ic-arrow ' + (C > 0 ? 'up' : 'down') + '" x="' + cx.toFixed(1) + '" y="' + (Tp + 12) + '" text-anchor="middle">' + (C > 0 ? '▲ ' : '▼ ') + esc(M.coefText(C)) + '</text>');
        g.push('<text class="lbl" x="' + cx.toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle">' + esc(plain(p.species[i].html)) + '</text>');
        say.push(plain(p.species[i].html) + ': ' + (I != null ? 'initial ' + M.fmt(I, 3) : 'initial not typed') + (C != null ? ', change ' + M.coefText(C) : '') + (E != null ? ', equilibrium ' + M.fmt(E, 3) : ''));
      }
      var label = 'Bar chart of ' + (p.Kp ? 'partial pressures in atm' : 'concentrations in M') + ', initial (faint) and equilibrium (solid): ' + say.join('; ') + '.';
      chart.innerHTML = '<svg class="chem-svg ic-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + g.join('') + '</svg>';
      // The beaker and the gauge: E row once it is complete, else the I row.
      var useE = rows.E.every(function(v){ return v != null; }), src = useE ? rows.E : rows.I, full = src.every(function(v){ return v != null; });
      // The jar joins the table once the first amount is typed: an empty
      // jar on the opening screen says nothing.
      live.hidden = !rows.I.some(function(v){ return v != null; });
      var counts = {}; src.forEach(function(v, i){ counts['s' + i] = v != null ? Math.round(Math.max(0, v) / perP) : 0; });
      var q = full && src.every(function(v){ return v >= 0; }) ? M.Q(sp, src) : NaN;
      var showK = kDone && isFinite(q) && q > 0;
      var st = { counts: counts };
      if(showK){ st.Q = q; st.K = p.K; }
      beaker.update(st);
      var cap = capEl, r = showK ? q / p.K : NaN;
      cap.innerHTML = (useE ? (sure.E ? 'Equilibrium row checked. ' : 'Your E row so far. ') : 'Initial row. ') +
        (!full ? 'Fill the row to see Q.' : !kDone ? 'Q of this row = ' + M.fmt(q, 3) + '. K is what you are finding.' :
          !isFinite(q) || q === 0 ? 'No products yet: Q = 0, far below K = ' + M.fmt(p.K, 2) + ', so the reaction runs forward.' :
          'Q = ' + M.fmt(q, 3) + ' vs K = ' + M.fmt(p.K, 3) + (Math.abs(r - 1) <= 0.01 ? ': they match, so this row is at equilibrium.' : Math.abs(r - 1) <= 0.04 ? ': within ' + F(100 * Math.abs(r - 1), 1) + '%, which is the rounding of a three-figure row, so this is the equilibrium.' : r < 1 ? ': Q is still below K' + (useE ? ', so these numbers are not yet the equilibrium.' : '.') : ': Q is above K' + (useE ? ', so too much product: recheck x or the signs.' : '.'))) +
        ' One particle ≈ ' + M.fmt(perP, 2) + ' ' + (p.Kp ? 'atm' : 'M') + '.';
    }
    T.watchBox(chart, draw);
    return { read: read, checked: checked, draw: draw };
  }

  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApChemBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
