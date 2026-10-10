/* Simulator: osmosis and water potential (Unit 2). The model is in
   bio-tool-math.js (ApBioMath.osmosis: simulate, and trajectory for the
   animation); the systems, solutes, ranges, the "How this model works" box,
   the questions and the mini FRQ are data (bio/data/tools/osmosis.json).

   Job: see which way water moves and why, from ψ inside against ψ outside.

   The stage (ApBioTools stage slot, moved to the top of the model card) is
   the hero: a beaker with a potato cell, a red blood cell or a dialysis bag
   that swells, shrinks, plasmolyzes or bursts as the run plays; solute dots
   show concentration; water arrows are as wide as the water potential gap
   right now (they thin to nothing at equilibrium); a ψ ladder beside the
   beaker shows water running "downhill". Every control redraws it at once
   (end state); Play runs the clock from 0. Modes: Explore, Predict then run
   (a challenge: predict the direction and the end state, then watch; both
   recorded as osmosis:predict-<system>:dir|state), and Calculate it, which
   links to the water potential calculations tool (its quiz). The concentration
   graph, trials, data tables, questions and mini FRQ are kept. */
(function(){
  'use strict';
  var SLUG = 'osmosis';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  var NF = 160; // samples in a trajectory
  function reduced(){ try{ return window.LevlMotion ? window.LevlMotion.reduced() : matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }

  T.mount(SLUG, function(app, data, ctx){
    var esc = T.esc, F = T.F;
    var sys = data.systems[0], runs = [], runSeed = 104729;
    var st = { outC: data.outside.value, outSolute: data.solutes[0].id, inC: data.inside.value, T: sys.defaults.T, t: sys.time.value };
    var STATE = data.states, mode = 'explore', chal = null, anim = null;
    var view = { k: NF, playing: false, hide: false }; // k: frame shown (fractional)

    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
      '<section class="bt-card os-card" aria-labelledby="os-h"><h2 id="os-h">The model</h2>' +
      '<div class="os-modes" role="group" aria-label="Mode"><button type="button" class="bt-btn" data-m="explore" aria-pressed="true">Explore</button><button type="button" class="bt-btn" data-m="predict" aria-pressed="false">Predict, then run</button>' +
      '<a class="os-calc" href="water-potential.html">Calculate it: ψ practice <span aria-hidden="true">→</span></a></div>' +
      '<p class="bt-first">Slide the beaker concentration and watch which way water moves.</p><div class="os-chal" hidden></div>' +
      '<div class="os-play"><button type="button" class="btn-press sm os-go" data-a="play">Play from the start</button><p class="os-clock" aria-hidden="true"></p></div>' +
      '<div class="os-pick bt-ctl"><span class="os-pick-h" id="os-pick-h">What goes in the beaker</span><div class="os-pick-row" role="group" aria-labelledby="os-pick-h">' +
        data.systems.map(function(s){ return '<button type="button" class="bt-btn" data-sys="' + esc(s.id) + '" aria-pressed="' + (s.id === sys.id) + '">' + esc(s.short) + '</button>'; }).join('') + '</div></div>' +
      '<p class="os-why" role="status" aria-live="polite"></p>' +
      '<div class="bt-controls" data-primary="1"></div>' +
      '<dl class="bt-readout"></dl><div class="bt-eqs"></div><p class="bt-summary"></p>' +
      '<div class="os-graph bt-num"><h3 class="os-gh">Mass change against beaker concentration</h3><p class="bt-small">Tap the graph to set the beaker concentration.</p><div class="bt-plotwrap"></div></div>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm" data-a="run">Run one trial</button><button type="button" class="btn-press sm alt" data-a="series">Run a concentration series</button><button type="button" class="bt-btn" data-a="clear">Clear runs</button></div>' +
      '<p class="bt-small bt-runnote" role="status" aria-live="polite"></p>' +
      '<details class="bt-data"><summary>Data table: your runs and the curve</summary><div class="bt-tables"></div></details></section>' +
      '<section class="bt-card" aria-labelledby="os-q"><h2 id="os-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');
    var card = app.querySelector('.os-card'), ctl = card.querySelector('.bt-controls');
    if(ctx.stage){ ctx.stage.classList.add('os-stage', 'bt-hero'); card.insertBefore(ctx.stage, card.querySelector('.os-modes').nextSibling); }
    var say = T.announcer(card.querySelector('.bt-summary'));
    var whyEl = card.querySelector('.os-why'), clock = card.querySelector('.os-clock'), goBtn = card.querySelector('[data-a="play"]');
    function short(k){ return STATE[k].split(':')[0]; }
    function solute(id){ return data.solutes.filter(function(s){ return s.id === id; })[0]; }
    function sysById(id){ return data.systems.filter(function(s){ return s.id === id; })[0]; }
    function td(sy, t){ return F(t, sy.time.step < 1 ? 2 : 0); }

    var solSel = T.choiceSelect({ label: 'Solute in the beaker', value: st.outSolute, options: data.solutes.map(function(s){ return { value: s.id, label: s.name + ' (i = ' + s.i + ')' }; }), onChange: function(v){ st.outSolute = v; update(true); } });
    var sOut = T.slider({ label: 'Beaker concentration', min: 0, max: data.outside.max, step: data.outside.step, value: st.outC, unit: 'M', decimals: 2, onInput: function(v){ st.outC = v; update(); } });
    var sIn = T.slider({ label: 'Sucrose inside the bag', min: 0, max: data.inside.max, step: data.inside.step, value: st.inC, unit: 'M', decimals: 2, onInput: function(v){ st.inC = v; update(); } });
    var sT = T.slider({ label: 'Temperature', min: 0, max: 40, step: 1, value: st.T, unit: '°C', decimals: 0, onInput: function(v){ st.T = v; update(); } });
    [sOut, solSel, sIn, sT].forEach(function(c){ ctl.appendChild(c.el); });
    var timeHost = document.createElement('div'); timeHost.className = 'bt-timehost'; ctl.appendChild(timeHost);
    var sTime;
    function makeTime(){
      var tm = sys.time;
      sTime = T.slider({ label: 'Time in the solution', min: 0, max: tm.max, step: tm.step, value: st.t, unit: 'min', decimals: tm.step < 1 ? 2 : 0, onInput: function(v){ st.t = v; update(); }, hint: esc(tm.hint) });
      timeHost.innerHTML = ''; timeHost.appendChild(sTime.el);
    }
    makeTime();
    var note = document.createElement('p'); note.className = 'bt-hint'; ctl.appendChild(note);
    function showInside(){ sIn.el.hidden = sys.kind !== 'bag'; }
    showInside();

    function setSys(id, play){
      sys = sysById(id);
      card.querySelectorAll('[data-sys]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-sys') === id)); });
      st.T = sys.defaults.T; sT.set(st.T); st.t = sys.time.value; makeTime(); showInside(); update(true);
      if(play) playRun();
    }
    card.querySelectorAll('[data-sys]').forEach(function(b){ b.addEventListener('click', function(){ setSys(b.getAttribute('data-sys'), true); }); });
    goBtn.addEventListener('click', function(){ if(mode === 'predict' && chal && !chal.done) return submitPrediction(); playRun(); });
    card.querySelector('[data-a="run"]').addEventListener('click', function(){ run([st.outC]); });
    card.querySelector('[data-a="series"]').addEventListener('click', function(){ run(data.series); });
    card.querySelector('[data-a="clear"]').addEventListener('click', function(){ runs = []; card.querySelector('.bt-runnote').textContent = 'Runs cleared.'; update(true); });
    card.querySelectorAll('[data-m]').forEach(function(b){ b.addEventListener('click', function(){ setMode(b.getAttribute('data-m')); }); });
    // Tap the graph: set the beaker concentration there.
    card.querySelector('.bt-plotwrap').addEventListener('click', function(e){
      var svg = e.currentTarget.querySelector('svg'); if(!svg || mode !== 'explore') return;
      var bx = svg.getBoundingClientRect(), x = (e.clientX - bx.left) / bx.width * 560;
      var C = (x - 66) / (560 - 66 - 16) * data.outside.max;
      if(C < -0.05 || C > data.outside.max + 0.05) return;
      sOut.set(Math.max(0, Math.min(data.outside.max, C)), true);
    });

    function cond(over){ var s = solute(st.outSolute), c = { outC: st.outC, outI: s.i, inC: st.inC, inI: 1, T: st.T, t: st.t }; for(var k in over) c[k] = over[k]; return c; }
    function sim(over){ return M.osmosis.simulate(sys, cond(over)); }
    function run(cs){
      cs.forEach(function(c){
        var r = sim({ outC: c }), g = M.rng(runSeed + runs.length * 17);
        runs.push({ n: runs.length + 1, sys: sys.id, solute: st.outSolute, C: c, inC: sys.kind === 'bag' ? st.inC : null, T: st.T, t: st.t, lysed: r.lysed, pct: r.lysed ? null : M.round(r.pct + g.normal(0, data.scatter), 1) });
      });
      T.event('apbio-sim-run', { tool: SLUG, n: cs.length });
      var last = runs[runs.length - 1];
      card.querySelector('.bt-runnote').textContent = cs.length === 1 ? 'Trial ' + last.n + ': ' + (last.lysed ? 'the cells burst (lysed).' : 'mass change ' + F(last.pct, 1) + '%.') : 'Ran ' + cs.length + ' trials from 0 to ' + data.outside.max + ' M. They appear as points on the graph and in the data table.';
      update(true);
      if(cs.length === 1) playRun();
    }
    function shown(){ return runs.filter(function(r){ return r.sys === sys.id && r.solute === st.outSolute && r.T === st.T && r.t === st.t && !r.lysed && (sys.kind !== 'bag' || r.inC === st.inC); }); }

    /* ---------------------------------------------------- the stage */
    var pools = {};
    function pool(key, n, fn){ if(!pools[key]){ var g = M.rng(key.length * 7919 + 17), a = []; for(var i = 0; i < n; i++) a.push(fn(g)); pools[key] = a; } return pools[key]; }
    var BX = 14, BY = 56, BW = 270, BH = 196, CX = 149, CY = 158, KD = 0.0036;
    /* A smooth closed path through points (Catmull-Rom as cubic Béziers). */
    function smooth(pts){
      var n = pts.length, d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
      for(var i = 0; i < n; i++){
        var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
        d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
      }
      return d + 'Z';
    }
    /* A potato parenchyma cell's outline: a rounded, slightly irregular
       polygon (cells in a tissue press into many-sided shapes). r(θ) is its
       radius at angle θ for half-widths hx, hy. */
    var CELL = [[0, 1], [0.9, 0.96], [1.75, 1.02], [2.6, 0.97], [3.3, 1], [4.15, 0.95], [5.05, 1.01]];
    function wallR(a){
      // a superellipse-like polygon: distance to the nearest of the CELL facets, softened
      var best = 9;
      for(var i = 0; i < CELL.length; i++){
        var f = CELL[i], c = Math.cos(a - f[0]);
        if(c > 0.05) best = Math.min(best, f[1] / c);
      }
      return Math.min(best, 1.22);
    }
    function ring(cx, cy, fn, n){ var pts = []; for(var i = 0; i < n; i++){ var a = i / n * Math.PI * 2, r = fn(a); pts.push([cx + Math.cos(a) * r[0], cy + Math.sin(a) * r[1]]); } return pts; }
    /* The specimen at water W (fraction of starting water): its drawing, its
       inside region (for solute dots) and its half-extent (for arrows). */
    function shape(sy, W, lysed){
      var o = { parts: [], hx: 0, hy: 0, edge: [] };
      if(sy.kind === 'plant'){
        var bulge = W > sy.W0 ? 1 + Math.min(0.05, (W / sy.W0 - 1) * 0.6) : 1;
        var whx = 78 * bulge, why = 60 * bulge, s = Math.max(0.3, Math.min(1, Math.pow(W / sy.W0, 0.9)));
        var round = Math.max(0, Math.min(1, (1 - s) * 4)), soft = 0.86; // a shrinking protoplast rounds up
        var wr = function(a){ var k = wallR(a) * 0.92 + 0.08; return k; };
        var outer = ring(CX, CY, function(a){ var k = wr(a); return [whx * k, why * k]; }, 42);
        var inner = ring(CX, CY, function(a){ var k = wr(a); return [(whx - 8) * k, (why - 8) * k]; }, 42);
        var pr = function(a){ var k = wr(a) * (1 - round) + soft * round; return [(whx - 9.5) * k * s, (why - 9.5) * k * s]; };
        var memb = ring(CX, CY, pr, 42);
        var vs = 0.70 + 0.12 * s; // the vacuole loses most of the water
        var vac = ring(CX + 4, CY + 2, function(a){ var r = pr(a); return [Math.max(4, r[0] * vs - 6), Math.max(4, r[1] * vs - 6)]; }, 36);
        o.parts.push('<path class="os-wallband' + (W > sy.W0 * 1.005 ? ' taut' : '') + '" fill-rule="evenodd" d="' + smooth(outer) + smooth(inner).replace('M', 'M') + '"/>');
        o.parts.push('<path class="os-walledge" d="' + smooth(outer) + '"/><path class="os-walledge in" d="' + smooth(inner) + '"/>');
        if(round > 0.05){ // the gap between wall and membrane fills with outside solution; Hechtian strands still tether the membrane
          o.parts.push('<path class="os-gap" d="' + smooth(inner) + '"/>');
          [0.5, 2.2, 3.9, 5.4].forEach(function(a){ var r1 = pr(a), k = wr(a); o.parts.push('<path class="os-strand" d="M' + (CX + Math.cos(a) * r1[0]).toFixed(1) + ' ' + (CY + Math.sin(a) * r1[1]).toFixed(1) + 'L' + (CX + Math.cos(a) * (whx - 8) * k).toFixed(1) + ' ' + (CY + Math.sin(a) * (why - 8) * k).toFixed(1) + '"/>'); });
        }
        o.parts.push('<path class="os-cyto" d="' + smooth(memb) + '"/>');
        o.parts.push('<path class="os-vac" d="' + smooth(vac) + '"/>');
        // amyloplasts (starch grains: potato tuber cells store starch, they have no chloroplasts) and the nucleus, in the cytoplasm band
        var band = function(a, t){ var r = pr(a), v = [Math.max(4, r[0] * vs - 6), Math.max(4, r[1] * vs - 6)]; t = t == null ? 0.5 : t; return [CX + Math.cos(a) * (r[0] * (1 - t) + v[0] * t) + (t > 0.9 ? 4 : 0), CY + Math.sin(a) * (r[1] * (1 - t) + v[1] * t)]; };
        [0.25, 1.35, 2.05, 3.0, 4.6, 5.6].forEach(function(a, n){ var q = band(a, 0.42), rx = 5 + (n % 3) * 0.8, ry = 3.6 + (n % 2) * 0.6, rot = (a * 57.3 + 90).toFixed(0);
          o.parts.push('<g transform="translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ') rotate(' + rot + ')"><ellipse class="os-amy" rx="' + (rx * Math.sqrt(s)).toFixed(1) + '" ry="' + (ry * Math.sqrt(s)).toFixed(1) + '"/><ellipse class="os-amy-r" rx="' + (rx * 0.5 * Math.sqrt(s)).toFixed(1) + '" ry="' + (ry * 0.45 * Math.sqrt(s)).toFixed(1) + '"/></g>'); });
        var nq = band(3.75, 0.45);
        o.parts.push('<circle class="os-nuc" cx="' + nq[0].toFixed(1) + '" cy="' + nq[1].toFixed(1) + '" r="' + (8 * Math.sqrt(s)).toFixed(1) + '"/><circle class="os-nucl" cx="' + (nq[0] + 1.5).toFixed(1) + '" cy="' + (nq[1] - 1).toFixed(1) + '" r="' + (2.6 * Math.sqrt(s)).toFixed(1) + '"/>');
        var vr = pr(0);
        o.hx = (whx - 9.5) * s; o.hy = (why - 9.5) * s; o.ex = whx; o.ey = why; o.inner = { x: Math.max(6, vr[0] * vs - 12), y: Math.max(6, pr(Math.PI / 2)[1] * vs - 12) };
      } else if(sy.kind === 'animal'){
        /* Face-on red blood cell: a biconcave disc (pale centre), a sphere
           when swollen (the pallor fills in), an echinocyte with spicules when
           crenated, a torn pale ghost when lysed. */
        var m = M.osmosis.mass(sy, W), r0 = 58, R;
        if(lysed){
          R = 66;
          o.parts.push('<circle class="os-hb" cx="' + CX + '" cy="' + CY + '" r="' + (R + 26) + '"/>');
          o.parts.push('<path class="os-ghost" d="M' + (CX + R * Math.cos(-0.35)).toFixed(1) + ' ' + (CY + R * Math.sin(-0.35)).toFixed(1) + 'A' + R + ' ' + R + ' 0 1 1 ' + (CX + R * Math.cos(-1.05)).toFixed(1) + ' ' + (CY + R * Math.sin(-1.05)).toFixed(1) + '"/>');
          o.parts.push('<path class="os-ghost tear" d="M' + (CX + R * Math.cos(-0.35)).toFixed(1) + ' ' + (CY + R * Math.sin(-0.35)).toFixed(1) + 'l14 -4M' + (CX + R * Math.cos(-1.05)).toFixed(1) + ' ' + (CY + R * Math.sin(-1.05)).toFixed(1) + 'l10 -12"/>');
          o.ex = R; o.ey = R; o.hx = R * 0.8; o.hy = R * 0.8;
        } else {
          R = m > 1 ? r0 * (1 + (m - 1) * 0.42) : r0 * Math.pow(m, 0.5);
          var amp = m < 0.985 ? Math.min(0.11, (1 - m) * 0.45) : 0, sp = 16, body;
          if(amp > 0){
            body = smooth(ring(CX, CY, function(a){ var c = Math.cos(a * sp), k = 1 - amp * 0.3 + amp * Math.pow(Math.max(0, c), 2.5) * 1.2; return [R * k, R * k]; }, sp * 6));
          } else body = smooth(ring(CX, CY, function(){ return [R, R]; }, 24));
          o.parts.push('<path class="os-rbc" d="' + body + '"/>');
          var pal = m >= 1 ? Math.max(0, 1 - (m - 1) * 5) : Math.max(0.25, 1 - (1 - m) * 2.5);
          if(pal > 0.03) o.parts.push('<circle class="os-pallor" cx="' + CX + '" cy="' + (CY + 2) + '" r="' + (R * 0.46).toFixed(1) + '" opacity="' + pal.toFixed(2) + '"/>');
          o.parts.push('<ellipse class="os-sheen" cx="' + (CX - R * 0.42).toFixed(1) + '" cy="' + (CY - R * 0.48).toFixed(1) + '" rx="' + (R * 0.22).toFixed(1) + '" ry="' + (R * 0.1).toFixed(1) + '" transform="rotate(-35 ' + (CX - R * 0.42).toFixed(1) + ' ' + (CY - R * 0.48).toFixed(1) + ')"/>');
          o.ex = R * (1 + amp * 0.6); o.ey = o.ex; o.hx = R * 0.78; o.hy = R * 0.78;
        }
        o.inner = { x: o.hx, y: o.hy };
      } else {
        /* Dialysis tubing tied off at both ends: a translucent flattened
           tube, creased while it is slack, smooth and round when full. */
        var vol = W, f = Math.min(vol, sy.W0 * 1.03), h = 118 * Math.pow(f, 0.6), w = 70 * Math.pow(f, 0.42), top = CY - h / 2 + 8, bot = top + h;
        var full = Math.max(0, Math.min(1, (vol - 0.7) / (sy.W0 - 0.7))), bow = 4 + full * 9, neck = 9;
        var L = CX - w / 2, Rr = CX + w / 2;
        var body2 = 'M' + (CX - neck) + ' ' + top.toFixed(1) +
          'C' + (L - bow * 0.2).toFixed(1) + ' ' + (top + 6).toFixed(1) + ' ' + (L - bow).toFixed(1) + ' ' + (top + h * 0.3).toFixed(1) + ' ' + (L - bow * 0.6).toFixed(1) + ' ' + (top + h * 0.55).toFixed(1) +
          'C' + (L - bow * 0.2).toFixed(1) + ' ' + (top + h * 0.82).toFixed(1) + ' ' + (L + 4).toFixed(1) + ' ' + (bot - 2).toFixed(1) + ' ' + (CX - neck) + ' ' + bot.toFixed(1) +
          'L' + (CX + neck) + ' ' + bot.toFixed(1) +
          'C' + (Rr - 4).toFixed(1) + ' ' + (bot - 2).toFixed(1) + ' ' + (Rr + bow * 0.2).toFixed(1) + ' ' + (top + h * 0.82).toFixed(1) + ' ' + (Rr + bow * 0.6).toFixed(1) + ' ' + (top + h * 0.55).toFixed(1) +
          'C' + (Rr + bow).toFixed(1) + ' ' + (top + h * 0.3).toFixed(1) + ' ' + (Rr + bow * 0.2).toFixed(1) + ' ' + (top + 6).toFixed(1) + ' ' + (CX + neck) + ' ' + top.toFixed(1) + 'Z';
        o.parts.push('<path class="os-string" d="M' + CX + ' ' + (top - 12).toFixed(1) + 'V' + (BY - 34) + '"/>');
        o.parts.push('<path class="os-bag' + (vol >= sy.W0 ? ' taut' : '') + '" d="' + body2 + '"/>');
        // creases while slack
        var cr = (1 - full) * 0.9;
        if(cr > 0.05) o.parts.push('<path class="os-crease" opacity="' + cr.toFixed(2) + '" d="M' + (CX - w * 0.18).toFixed(1) + ' ' + (top + 10).toFixed(1) + 'q-6 ' + (h * 0.4).toFixed(1) + ' 2 ' + (h - 20).toFixed(1) + 'M' + (CX + w * 0.22).toFixed(1) + ' ' + (top + 14).toFixed(1) + 'q5 ' + (h * 0.35).toFixed(1) + ' -3 ' + (h - 26).toFixed(1) + '"/>');
        o.parts.push('<path class="os-bagsheen" d="M' + (L + 7).toFixed(1) + ' ' + (top + h * 0.22).toFixed(1) + 'q-2 ' + (h * 0.3).toFixed(1) + ' 3 ' + (h * 0.5).toFixed(1) + '"/>');
        // tied ends: the gathered tubing, a knot of string at the top, a folded tail at the bottom
        o.parts.push('<path class="os-bagend" d="M' + (CX - neck) + ' ' + top.toFixed(1) + 'l-3 -10h' + (2 * neck + 6) + 'l-3 10zM' + (CX - neck) + ' ' + bot.toFixed(1) + 'l-4 12h' + (2 * neck + 8) + 'l-4 -12z"/>');
        o.parts.push('<rect class="os-knot" x="' + (CX - neck - 3) + '" y="' + (top - 4).toFixed(1) + '" width="' + (2 * neck + 6) + '" height="4" rx="2"/><rect class="os-knot" x="' + (CX - neck - 2) + '" y="' + (bot + 1).toFixed(1) + '" width="' + (2 * neck + 4) + '" height="4" rx="2"/>');
        o.hx = w / 2 - 6; o.hy = h / 2 - 12; o.ex = w / 2 + bow * 0.6; o.ey = h / 2; o.inner = { x: o.hx, y: o.hy }; o.cyOff = 8;
      }
      return o;
    }
    /* What the stage shows at frame k of the current trajectory. */
    function frameAt(tr, k){
      var i = Math.max(0, Math.min(NF, Math.floor(k))), j = Math.min(NF, i + 1), f = k - i;
      var a = tr[i], b = tr[j];
      return { t: a.t + (b.t - a.t) * f, W: a.W + (b.W - a.W) * f, lysed: f > 0.5 ? b.lysed : a.lysed };
    }
    function drawStage(host, s){
      var sy = s.sys, c = s.c, now = frameAt(s.tr, s.k), W = now.W;
      var pp = M.osmosis.psiParts(sy, c, W), psiO = s.res.psiO, dpsi = psiO - pp.psi, hide = s.hide;
      var o = shape(sy, W, now.lysed), cy = CY + (o.cyOff || 0);
      /* A glass beaker: a pouring lip, a rolled rim, graduations, a
         highlight down the glass and a liquid with a meniscus. */
      var y0 = BY - 32, y1 = BY + BH, R0 = BX + BW;
      var p = ['<defs><linearGradient id="osLiq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="os-liq0"/><stop offset="1" class="os-liq1"/></linearGradient>' +
        '<radialGradient id="osRbc" cx=".42" cy=".38" r=".7"><stop offset="0" class="os-rbc0"/><stop offset=".7" class="os-rbc1"/><stop offset="1" class="os-rbc2"/></radialGradient>' +
        '<radialGradient id="osHb" cx=".5" cy=".5" r=".5"><stop offset="0" class="os-hb0"/><stop offset="1" class="os-hb1"/></radialGradient>' +
        '<linearGradient id="osGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="os-gl0"/><stop offset=".12" class="os-gl1"/><stop offset=".85" class="os-gl1"/><stop offset="1" class="os-gl0"/></linearGradient></defs>',
        '<path class="os-glass" d="M' + (BX - 9) + ' ' + (y0 - 3) + 'q7 1 9 9V' + (y1 - 14) + 'q0 14 14 14H' + (R0 - 14) + 'q14 0 14 -14V' + (y0 + 3) + 'q0 -4 4 -5"/>',
        '<path class="os-sol" d="M' + (BX + 3) + ' ' + (BY - 4) + 'q3 4 11 4H' + (R0 - 14) + 'q8 0 11 -4V' + (y1 - 13) + 'q0 10 -10 10H' + (BX + 13) + 'q-10 0 -10 -10Z"/>',
        '<path class="os-menis" d="M' + (BX + 3) + ' ' + (BY - 4) + 'q3 4 11 4H' + (R0 - 14) + 'q8 0 11 -4"/>'];
      [0, 1, 2, 3].forEach(function(n){ var gy = BY + 30 + n * 40; p.push('<path class="os-grad" d="M' + (R0 - 4) + ' ' + gy + 'h-' + (n % 2 ? 7 : 12) + '"/>'); });
      // outside solute dots: density follows osmolarity; none inside the specimen
      var osmO = c.outC * c.outI, nOut = Math.min(250, Math.round(osmO * KD * (BW - 8) * (BH - 4)));
      var po = pool('out', 280, function(g){ return [BX + 8 + g() * (BW - 16), BY + 6 + g() * (BH - 14)]; }), drawn = 0, dots = [];
      for(var i = 0; i < po.length && drawn < nOut; i++){
        var q = po[i], ex = (q[0] - CX) / (o.ex + 6), ey = (q[1] - cy) / (o.ey + 6);
        if(ex * ex + ey * ey < 1.15 && !now.lysed) continue;
        dots.push('<circle class="os-sd' + (c.outI > 1 && i % 2 ? ' ion' : '') + '" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="2.3"/>'); drawn++;
      }
      p.push(dots.join(''));
      p = p.concat(o.parts);
      // inside solute: a fixed amount, crowded as the specimen shrinks
      var o1 = shape(sy, 1, false).inner, nIn = Math.round((sy.kind === 'bag' ? c.inC * c.inI : sy.osmIn) * KD * 3.2 * o1.x * o1.y);
      var pin = pool('in', 140, function(g){ var a = g() * Math.PI * 2, r = Math.sqrt(g()) * 0.9; return [Math.cos(a) * r, Math.sin(a) * r]; });
      var spill = now.lysed ? 2.1 : 1;
      for(var j = 0; j < Math.min(nIn, pin.length); j++) p.push('<circle class="os-si" cx="' + (CX + pin[j][0] * o.inner.x * spill).toFixed(1) + '" cy="' + (cy + pin[j][1] * o.inner.y * spill).toFixed(1) + '" r="2.6"/>');
      // water arrows: width from the ψ gap now; moving water while playing
      var mag = Math.abs(dpsi), dir = now.lysed ? 0 : mag < 0.05 ? 0 : dpsi > 0 ? 1 : -1;
      if(!hide){
        var sw = 2 + Math.min(11, mag * 0.75), spots = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        spots.forEach(function(d, n){
          var x0 = CX + d[0] * (o.ex + 34), y0 = cy + d[1] * (o.ey + 26), x1 = CX + d[0] * (o.ex + 8), y1 = cy + d[1] * (o.ey + 6);
          if(n === 2 && sy.kind === 'bag') return;
          if(dir === 0){
            if(now.lysed) return;
            p.push('<path class="os-eq" d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + 'L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '"/>');
            return;
          }
          var fx = dir > 0 ? x0 : x1, fy = dir > 0 ? y0 : y1, tx = dir > 0 ? x1 : x0, ty = dir > 0 ? y1 : y0;
          var ang = Math.atan2(ty - fy, tx - fx), hl = 7 + sw * 0.7;
          var bx = tx - Math.cos(ang) * hl, by = ty - Math.sin(ang) * hl;
          p.push('<path class="os-flow" stroke-width="' + sw.toFixed(1) + '" d="M' + fx.toFixed(1) + ' ' + fy.toFixed(1) + 'L' + bx.toFixed(1) + ' ' + by.toFixed(1) + '"/>');
          p.push('<path class="os-flowhead" d="M' + tx.toFixed(1) + ' ' + ty.toFixed(1) + 'L' + (bx + Math.sin(ang) * hl * 0.75).toFixed(1) + ' ' + (by - Math.cos(ang) * hl * 0.75).toFixed(1) + 'L' + (bx - Math.sin(ang) * hl * 0.75).toFixed(1) + ' ' + (by + Math.cos(ang) * hl * 0.75).toFixed(1) + 'Z"/>');
          if(s.playing){
            var ph = (s.clock / 700) % 1;
            for(var w = 0; w < 3; w++){ var u = (ph + w / 3) % 1; p.push('<circle class="os-w" cx="' + (fx + (tx - fx) * u).toFixed(1) + '" cy="' + (fy + (ty - fy) * u).toFixed(1) + '" r="3.2"/>'); }
          }
        });
      }
      p.push('<path class="os-shine" d="M' + (BX + 7) + ' ' + (BY + 8) + 'V' + (BY + BH - 30) + '"/>');
      // labels
      p.push('<text class="os-tag" x="' + (BX + 10) + '" y="' + (BY - 8) + '">' + esc(F(c.outC, 2) + ' M ' + solute(s.solute).name) + '</text>');
      var stateTxt = hide ? 'Predict first' : now.lysed ? short('lysed') : short(M.osmosis.simulate(sy, Object.assign({}, c, { t: now.t })).state);
      p.push('<text class="os-state" x="' + (BX + BW - 10) + '" y="' + (BY - 8) + '" text-anchor="end">' + esc(stateTxt) + '</text>');
      var LBY = BY + BH + 16;
      p.push('<text class="os-lab" x="' + CX + '" y="' + LBY + '" text-anchor="middle">' + (sy.kind === 'plant' ? 'one potato cell: wall, membrane, vacuole, starch grains' : sy.kind === 'animal' ? (now.lysed ? 'burst: membrane torn, contents spilled' : 'red blood cell (no wall)') : 'dialysis bag, ' + F(c.inC, 2) + ' M sucrose inside') + '</text>');
      // the ψ ladder
      var lo = Math.min(-10, Math.floor(Math.min(psiO, s.res.start.psi, pp.psi) / 10) * 10), LX = 318, LT = BY - 4, LB = BY + BH - 22;
      var ly = function(v){ return LT + (v / lo) * (LB - LT); };
      p.push('<text class="os-lh" x="' + LX + '" y="' + (BY - 26) + '" text-anchor="middle">ψ (bar)</text><line class="os-axis" x1="' + LX + '" x2="' + LX + '" y1="' + LT + '" y2="' + LB + '"/>');
      [0, lo / 2, lo].forEach(function(v){ p.push('<line class="os-axis" x1="' + (LX - 4) + '" x2="' + (LX + 4) + '" y1="' + ly(v).toFixed(1) + '" y2="' + ly(v).toFixed(1) + '"/><text class="os-tick" x="' + (LX - 7) + '" y="' + (ly(v) + 4).toFixed(1) + '" text-anchor="end">' + F(v, 0) + '</text>'); });
      if(!hide){
        var yo = ly(psiO), yi = ly(pp.psi);
        if(Math.abs(yo - yi) > 3 && dir !== 0) p.push('<path class="os-down" d="M' + (LX + 70) + ' ' + Math.min(yo, yi).toFixed(1) + 'V' + (Math.max(yo, yi) - 6).toFixed(1) + '"/><path class="os-flowhead" d="M' + (LX + 70) + ' ' + Math.max(yo, yi).toFixed(1) + 'l-5 -8h10z"/>');
        p.push('<g class="os-mk out"><rect x="' + (LX + 4) + '" y="' + (yo - 9).toFixed(1) + '" width="30" height="18" rx="6"/><text x="' + (LX + 19) + '" y="' + (yo + 4).toFixed(1) + '" text-anchor="middle">out</text></g>');
        p.push('<g class="os-mk in"><rect x="' + (LX + 37) + '" y="' + (yi - 9).toFixed(1) + '" width="26" height="18" rx="6"/><text x="' + (LX + 50) + '" y="' + (yi + 4).toFixed(1) + '" text-anchor="middle">in</text></g>');
        p.push('<text class="os-tick" x="' + (LX + 34) + '" y="' + (LB + 18) + '" text-anchor="middle">Δψ = ' + F(Math.abs(dpsi), 1) + ' bar</text>');
      } else p.push('<text class="os-q" x="' + LX + '" y="' + ((LT + LB) / 2) + '" text-anchor="middle">?</text>');
      var lab = hide ? sy.name + ' about to go into ' + F(c.outC, 2) + ' M ' + solute(s.solute).name + '. Make your prediction, then run it.'
        : sy.name + ' in ' + F(c.outC, 2) + ' M ' + solute(s.solute).name + ', at ' + td(sy, now.t) + ' minutes: ' + stateTxt + '. ψ outside ' + F(psiO, 2) + ' bar, ψ inside ' + F(pp.psi, 2) + ' bar, so net water movement is ' + (dir > 0 ? 'into it' : dir < 0 ? 'out of it' : 'zero') + '.';
      host.innerHTML = '<svg class="os-fig" viewBox="0 0 400 276" role="img" aria-label="' + esc(lab) + '">' + p.join('') + '</svg>';
      clock.textContent = hide ? '' : 't = ' + td(sy, now.t) + ' of ' + td(sy, c.t) + ' min';
    }
    var cur = null; // the last computed { sys, c, tr, res, solute }
    function stageState(){ return { draw: function(host){ drawStage(host, Object.assign({}, cur, { k: view.k, hide: view.hide, playing: view.playing, clock: view.clock || 0 })); } }; }
    function redraw(){ if(cur) ctx.redraw(stageState()); }

    function stopAnim(){ if(anim){ cancelAnimationFrame(anim); anim = null; } view.playing = false; }
    /* Play from t = 0 to the chosen time, about 2.6 s; reduced motion: end. */
    function playRun(done){
      stopAnim(); view.hide = false;
      if(reduced() || !window.requestAnimationFrame){ view.k = NF; redraw(); if(done) done(); return; }
      var t0 = null, dur = 3200;
      view.playing = true;
      function step(ts){
        if(t0 == null) t0 = ts;
        var f = Math.min(1, (ts - t0) / dur);
        view.k = NF * Math.pow(f, 2.2); view.clock = ts; // slow start: most water moves early
        redraw();
        if(f < 1) anim = requestAnimationFrame(step);
        else { anim = null; view.playing = false; view.k = NF; redraw(); if(done) done(); }
      }
      anim = requestAnimationFrame(step);
    }

    /* Why: the one-paragraph explanation for the end state. */
    function why(r, sy, c){
      var o = F(r.psiO, 2), i0 = F(r.start.psi, 2), i1 = F(r.end.psi, 2), gap = Math.abs(r.psiO - r.end.psi);
      var head = r.startDir === 'none' ? 'ψ outside (' + o + ' bar) equals ψ inside (' + i0 + ' bar): water crosses both ways at the same rate, so there is no net movement. '
        : 'Water moves from higher to lower water potential: ψ outside is ' + o + ' bar and ψ inside starts at ' + i0 + ' bar, so net water moves ' + (r.startDir === 'in' ? 'in. ' : 'out. ');
      var body = '';
      if(r.lysed) body = 'With no wall, ψp stays 0, so only diluting the cytoplasm could raise its ψ. It would have to swell past ' + F(sy.lyseAt, 2) + '× its volume first, so the membrane tears: the cell lyses.';
      else if(sy.kind === 'plant'){
        if(r.state === 'turgid' && r.startDir === 'out') body = 'The cell loses a little water but stays pressed on its wall: ψp falls to ' + F(r.end.psiP, 2) + ' bar, which lowers ψ inside to ' + i1 + ' bar.';
        else if(r.state === 'turgid') body = 'As the cell fills, the wall pushes back: ψp rises to ' + F(r.end.psiP, 2) + ' bar, which lifts ψ inside to ' + i1 + ' bar. The wall, not the solute, stops the intake, so the cell stays whole.';
        else if(r.state === 'plasmolyzed') body = 'The cell loses water, its push on the wall (ψp) falls to 0, and the membrane pulls away from the wall. The gap fills with the outside solution, because the wall lets it through.';
        else body = 'The cell barely changes: ψp is about 0, so the cell is flaccid, neither pressing on its wall nor pulled away.';
      } else if(sy.kind === 'animal') body = r.state === 'swollen' ? 'Water dilutes the cytoplasm until its ψs matches the outside. No wall pushes back, so the cell swells but has not burst.'
        : r.state === 'shriveled' ? 'Losing water concentrates the cytoplasm until its ψ matches the outside; the shrinking membrane crinkles (crenation).' : 'The cell keeps its normal shape: the solution is about isotonic.';
      else body = r.startDir === 'none' ? 'The bag keeps its size.' : (c.outI > 1 ? 'In this model no solute crosses the tubing (real dialysis tubing lets NaCl through, so a real bag would behave differently), so only water moves: toward the side with more dissolved particles. ' : 'Sucrose cannot cross in this model, so only water moves: toward the side with more solute. ') + (r.end.psiP > 0.01 ? 'The bag fills until the tubing is tight and its pressure (ψp ' + F(r.end.psiP, 2) + ' bar) helps stop the intake.' : '');
      var tail = !r.lysed && !r.equilibrium ? ' Not at equilibrium yet after ' + td(sy, c.t) + ' min: ψ still differs by ' + F(gap, 2) + ' bar, so the arrows have not thinned to nothing.' : (!r.lysed && r.startDir !== 'none' ? ' Now ψ inside equals ψ outside, so the arrows have thinned to nothing: no net flow.' : '');
      return head + body + tail;
    }

    function update(now){
      if(mode === 'predict') return;
      stopAnim();
      var c = cond({}), r = sim({}), s = solute(st.outSolute), K = st.T + M.K0;
      cur = { sys: sys, c: c, tr: M.osmosis.trajectory(sys, c, NF), res: r, solute: st.outSolute };
      view.k = NF; view.hide = false;
      redraw();
      note.textContent = sys.note;
      whyEl.textContent = why(r, sys, c);
      // the curve: mass change against the beaker concentration
      var curve = [], lysedBelow = null, n = 60;
      for(var i = 0; i <= n; i++){ var C = data.outside.max * i / n, x = sim({ outC: C }); if(x.lysed){ lysedBelow = C; continue; } curve.push([C, x.pct]); }
      var pts = shown();
      var big = Math.max.apply(null, curve.map(function(q){ return Math.abs(q[1]); }).concat(pts.map(function(q){ return Math.abs(q.pct); })).concat([5]));
      var ym = T.niceMax(big * 1.1);
      var title = 'Graph of percent mass change after ' + F(st.t, 0) + ' minutes against ' + s.name + ' concentration in the beaker, from 0 to ' + data.outside.max + ' M, for the ' + sys.name.toLowerCase() + '.' + (lysedBelow != null ? ' Below ' + F(lysedBelow + data.outside.max / n, 2) + ' M the cells burst, so no mass is shown.' : '') + ' ' + pts.length + ' run' + (pts.length === 1 ? '' : 's') + ' shown as points. The data table below lists the values.';
      card.querySelector('.bt-plotwrap').innerHTML = T.plot({ title: title, x: { label: s.name + ' in the beaker', unit: 'M', min: 0, max: data.outside.max, step: 0.2 }, y: { label: 'Mass change', unit: '%', min: -ym, max: ym, step: T.niceStep(2 * ym, 6) },
        curves: [{ points: curve, cls: 's1' }], points: pts.map(function(q){ return { x: q.C, y: q.pct, cls: 's2' }; }).concat(r.lysed ? [] : [{ x: st.outC, y: r.pct, cls: 's1 os-now', square: true }]), vline: { x: st.outC } });
      card.querySelector('.bt-readout').innerHTML = [
        ['ψ outside', F(r.psiO, 2) + ' bar'], ['ψ inside, start', F(r.start.psi, 2) + ' bar'], ['ψ inside, end', r.lysed ? 'burst' : F(r.end.psi, 2) + ' bar'],
        ['Net water, start', r.startDir === 'in' ? 'into it' : r.startDir === 'out' ? 'out of it' : 'none'], ['Mass change', r.lysed ? 'burst' : F(r.pct, 1) + '%'], ['State', short(r.state)]
      ].map(function(x){ return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('');
      var inS = sys.kind === 'bag' ? 'Inside the bag: ψs = −iCRT = −(1)(' + F(st.inC, 2) + ')(0.0831)(' + K + ') = ' + F(r.start.psiS, 2) + ' bar'
        : 'Inside at the start: ψs = −(' + F(sys.osmIn, 2) + ' osmol/L)(0.0831)(' + K + ') = ' + F(r.start.psiS, 2) + ' bar';
      card.querySelector('.bt-eqs').innerHTML = '<p class="bt-eq">Beaker: ψ = ψs = −iCRT = −(' + s.i + ')(' + F(st.outC, 2) + ' mol/L)(0.0831 L·bar/(mol·K))(' + K + ' K) = ' + F(r.psiO, 2) + ' bar</p>' +
        '<p class="bt-eq">' + inS + '; ψp = ' + F(r.start.psiP, 2) + ' bar; ψ = ψs + ψp = ' + F(r.start.psi, 2) + ' bar</p>';
      var words = sys.name + ' in ' + F(st.outC, 2) + ' M ' + s.name + ' at ' + st.T + ' °C. Outside water potential ' + F(r.psiO, 2) + ' bar; inside at the start ' + F(r.start.psi, 2) + ' bar, so water moves ' +
        (r.startDir === 'in' ? 'in' : r.startDir === 'out' ? 'out' : 'neither way overall') + '. After ' + td(sys, st.t) + ' minutes: ' + (r.lysed ? 'the cell has burst (lysed).' : STATE[r.state] + ', mass change ' + F(r.pct, 1) + '%' + (r.equilibrium ? ', and the water potentials are now equal.' : '.'));
      say(words, now);
      var sample = [];
      for(var j = 0; j <= 10; j++){ var C2 = data.outside.max * j / 10, y = sim({ outC: C2 }); sample.push([F(C2, 2), y.lysed ? 'burst' : F(y.pct, 1), F(y.psiO, 2)]); }
      card.querySelector('.bt-tables').innerHTML =
        (runs.length ? T.dataTable(['Trial', 'In the beaker', 'Solution', 'Temperature (°C)', 'Time (min)', 'Mass change (%)'], runs.map(function(q){
          var sy = sysById(q.sys);
          return [String(q.n), esc(sy.short) + (q.inC != null ? ' (' + F(q.inC, 2) + ' M inside)' : ''), F(q.C, 2) + ' M ' + esc(solute(q.solute).name), String(q.T), td(sy, q.t), q.lysed ? 'burst' : F(q.pct, 1)];
        }), 'Your runs (' + runs.length + ')') : '<p class="bt-small">No runs yet. Use Run one trial or Run a concentration series.</p>') +
        T.dataTable(['Beaker (M ' + esc(s.name) + ')', 'Model mass change (%)', 'ψ of the beaker (bar)'], sample, 'The curve on the graph, sampled');
    }

    /* --------------------------------------- predict, then run */
    var chalBox = card.querySelector('.os-chal'), chalN = 0, chalSeed = 1 + Math.floor(Math.random() * 99999);
    var DIRS = [['in', 'Into it'], ['out', 'Out of it'], ['none', 'No net movement']];
    var STATES = { plant: ['turgid', 'flaccid', 'plasmolyzed'], animal: ['normal', 'swollen', 'shriveled', 'lysed'], bag: ['swollen', 'unchanged', 'shrunken'] };
    /* A challenge whose answer is clear: nothing near a state boundary. */
    function makeChallenge(){
      var want = location.hash.replace(/^#predict-?/, '');
      for(var tries = 0; tries < 400; tries++){
        var g = M.rng(chalSeed + 7919 * (chalN * 400 + tries));
        var sy = (tries === 0 && sysById(want)) || data.systems[chalN % data.systems.length];
        var so = g.pick(data.solutes), C = M.round(g.int(0, Math.round(data.outside.max / data.outside.step)) * data.outside.step, 2);
        var inC = sy.kind === 'bag' ? M.round(g.int(2, Math.round(data.inside.max / data.inside.step)) * data.inside.step, 2) : st.inC;
        if(sy.kind === 'bag'){ so = data.solutes[0]; if(g() < 0.3) C = inC; } // real tubing lets NaCl through, so bag challenges use sucrose only
        var c = { outC: C, outI: so.i, inC: inC, inI: 1, T: sy.defaults.T, t: sy.time.value };
        var r = M.osmosis.simulate(sy, c), gap = Math.abs(r.psiO - r.start.psi);
        if(!(gap < 0.01 || gap > 1.2)) continue;
        if(r.startDir !== 'none' && (r.state === 'unchanged' || r.state === 'normal' || r.state === 'flaccid')) continue; // water moves but the size barely changes: not clear-cut
        var ok = [-0.04, 0.04].every(function(d){ var c2 = Object.assign({}, c, { outC: Math.max(0, C + d) }); return M.osmosis.simulate(sy, c2).state === r.state; });
        if(!ok && gap >= 0.01) continue;
        return { sys: sy, solute: so, c: c, r: r };
      }
      return null;
    }
    function showChallenge(){
      stopAnim();
      chal = makeChallenge(); chalN++;
      if(!chal) return;
      var sy = chal.sys, id = 'os-c' + chalN;
      cur = { sys: sy, c: chal.c, tr: M.osmosis.trajectory(sy, chal.c, NF), res: chal.r, solute: chal.solute.id };
      view.k = 0; view.hide = true; redraw();
      chalBox.innerHTML = '<p class="os-chal-q"><b>Challenge ' + chalN + '.</b> ' + esc(sy.name) + (sy.kind === 'bag' ? ' holding ' + F(chal.c.inC, 2) + ' M sucrose' : '') + ' goes into <b>' + F(chal.c.outC, 2) + ' M ' + esc(chal.solute.name) + '</b> at ' + chal.c.T + ' °C for ' + td(sy, chal.c.t) + ' minutes.' + (sy.kind === 'plant' ? ' Its cell sap is about ' + F(sy.osmIn, 2) + ' osmol/L.' : sy.kind === 'animal' ? ' Its cytoplasm is about ' + F(sy.osmIn, 2) + ' osmol/L.' : '') + '</p>' +
        '<fieldset class="os-ask"><legend>1. At the start, net water moves…</legend>' + DIRS.map(function(d, i){ return '<div class="bt-radio"><input type="radio" name="' + id + 'd" id="' + id + 'd' + i + '" value="' + d[0] + '"><label for="' + id + 'd' + i + '">' + d[1] + '</label></div>'; }).join('') + '</fieldset>' +
        '<fieldset class="os-ask"><legend>2. After ' + td(sy, chal.c.t) + ' minutes it will be…</legend>' + STATES[sy.kind].map(function(k, i){ return '<div class="bt-radio"><input type="radio" name="' + id + 's" id="' + id + 's' + i + '" value="' + k + '"><label for="' + id + 's' + i + '">' + esc(STATE[k]) + '</label></div>'; }).join('') + '</fieldset>' +
        '<div class="os-chal-fb" role="status" aria-live="polite"></div>';
      goBtn.textContent = 'Run it and check';
      whyEl.textContent = 'Predict both, then run it. Hint: compare ψ = −iCRT outside with ψ inside.';
      clock.textContent = '';
    }
    function submitPrediction(){
      var d = chalBox.querySelector('input[name$="d"]:checked'), s = chalBox.querySelector('input[name$="s"]:checked');
      var fb = chalBox.querySelector('.os-chal-fb');
      if(!d || !s){ fb.textContent = 'Pick an answer for both parts first.'; return; }
      chal.done = true;
      chalBox.querySelectorAll('input').forEach(function(x){ x.disabled = true; });
      goBtn.disabled = true;
      var r = chal.r, sy = chal.sys, okD = d.value === r.startDir, okS = s.value === r.state;
      playRun(function(){
        goBtn.disabled = false; goBtn.textContent = 'Replay';
        var dirWord = { in: 'into it', out: 'out of it', none: 'no net movement' };
        fb.innerHTML = '<p><span class="bio-mark ' + (okD ? 'ok">Right' : 'no">Not quite') + '</span> Direction: ' + dirWord[r.startDir] + '. <span class="bio-mark ' + (okS ? 'ok">Right' : 'no">Not quite') + '</span> End state: ' + esc(STATE[r.state]) + '.</p><p>' + esc(why(r, sy, chal.c)) + '</p>' +
          '<div class="bt-actions"><button type="button" class="btn-press sm os-next">Next challenge</button>' + T.report(SLUG + ':predict-' + sy.id) + '</div>';
        fb.querySelector('.os-next').addEventListener('click', function(){ showChallenge(); var q = chalBox.querySelector('.os-chal-q'); q.setAttribute('tabindex', '-1'); q.focus(); });
        whyEl.textContent = '';
        T.record(SLUG, [
          { id: SLUG + ':predict-' + sy.id + ':dir', correct: okD, topic: data.topic, level: 'apply', diff: 2, group: 'predict' },
          { id: SLUG + ':predict-' + sy.id + ':state', correct: okS, topic: data.topic, level: 'analyze', diff: 2, group: 'predict' }
        ]);
      });
    }
    function setMode(m){
      if(m === mode) return;
      mode = m;
      card.querySelectorAll('[data-m]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-m') === m)); });
      var pred = m === 'predict';
      card.classList.toggle('is-predict', pred);
      chalBox.hidden = !pred;
      ['.os-pick', '.bt-controls', '.bt-readout', '.bt-eqs', '.bt-summary', '.os-graph', '.bt-buttons', '.bt-data', '.bt-runnote'].forEach(function(sel){ var el = card.querySelector(sel); if(el) el.hidden = pred; });
      if(pred) showChallenge();
      else { goBtn.textContent = 'Play from the start'; goBtn.disabled = false; chal = null; update(true); }
    }

    update(true);
    T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
    if(data.frq) T.frq(app, data.frq, SLUG);
    if(/^#predict/.test(location.hash)) setMode('predict');
    else setTimeout(function(){ playRun(); }, 350);
  }, { stage: function(host, s){ if(s && s.draw) s.draw(host); } });
})();
