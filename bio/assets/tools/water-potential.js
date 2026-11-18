/* Water potential, tools v2 (docs/tools-v2-water-potential-brief.md; the standard: docs/tools-v2-standard.md).
   On the shared kit (assets/course/tool-kit2.js) through the course adapter ApBioTools.studioKit2.
   The solver and the seeded problem generator are ApBioProblems.solve.wp and generate.wp (bio-skill-problems.js);
   the Explore settings, the contexts, the fixed problems and the formula box are data
   (bio/data/tools/water-potential.json).

   THE ONE IDEA: water potential is a number you add up, solute potential plus pressure potential, and water moves
   from the higher total to the lower total. (Osmosis, the sister tool, shows what that does to a cell and has no
   numbers on its picture; this one has no tonicity words and no "what happens next".)

   Two modes (the rule for every tool): EXPLORE is for playing with it, TEST YOURSELF is where you get quizzed.
   Explore: nothing locked, nothing graded, no side panel. One picture across the stage: a plant cell standing in
   an open beaker of solution. On it, a written sum for the cell and one for the solution (solute, pressure, a
   rule, the total ψ in bar, and one word: higher, lower or equal), and two controls: "Pressure in the cell" on the
   bench (the main one, with the first visit cue) and "Solute outside" on the beaker's wall (same idea, so it stays
   on the screen; calm). INSTANT RESPONSE: the wall bows and pushes, particles fill the solution, the numbers
   count, the water arrows across the wall thin to nothing, turn and grow. Numbers, words, arrows and the cause
   line are all read from the same drawn state, so they never disagree, also in the middle of a change. The line
   under the picture is the CAUSE LINE (K.cause): "Cell ψ −7.8 → lower than −4.9 outside → water moves in".
   Explore rounds each solute potential to 0.1 bar before adding, so every sum on the picture is exact.
   Test yourself: the practice problems (ApBioTools.skillTool: new numbers or the worked set, one part at a time,
   recorded as water-potential:<context>:<part>, as before) on the same picture: the sums fill in with what the
   student types and, after the last part, the true values, the words and the arrows.
   "?": the numbers behind this setting worked with −iCRT, the two totals on one scale, things to try, and what
   Explore holds fixed.
   One colour per idea, everywhere: solute amber, pressure (the wall's push) green, water and the total ψ blue.
   Reduced motion: the result at once with a short cross fade. */
(function(){
  'use strict';
  var SLUG = 'water-potential';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T || !M) return;
  var MIN = '−';
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function n1(v){ return (+v).toFixed(1); }
  function r1(v){ var x = Math.round(v * 10) / 10; return x === 0 ? 0 : x; }
  /* A fixed scatter pattern (the same on every load, so a redraw never jumps): each new point is the candidate
     farthest from those before it, so it is evenly spread at every count, with no rows or clumps. */
  var POOLS = {};
  function poolFor(aspect){
    var key = Math.max(0.6, Math.min(4, Math.round(aspect * 4) / 4));
    if(POOLS[key]) return POOLS[key];
    var P = [], sd = 20261118, rnd = function(){ sd = (sd + 0x6D2B79F5) | 0; var t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    for(var i = 0; i < 1000; i++){
      var best = null, bd = -1;
      for(var c = 0; c < 8; c++){
        var x = rnd(), y = rnd(), d = 9;
        for(var j = 0; j < P.length; j++){ var dx = (x - P[j][0]) * key, dy = y - P[j][1], q = dx * dx + dy * dy; if(q < d) d = q; }
        if(d > bd){ bd = d; best = [x, y]; }
      }
      P.push(best);
    }
    return (POOLS[key] = P);
  }
  var KD = 0.0062; // solute particles per unit area per osmol/L, the same inside and outside
  /* A plant cell's outline: a box with round corners (a superellipse). n: how square (5 is boxy, 3 is round). */
  function sq(a, hw, hh, n){ var c = Math.cos(a), s = Math.sin(a), e = 2 / n; return [hw * (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), e), hh * (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), e)]; }
  function ringPath(cx, cy, hw, hh, n, N){
    var d = '';
    for(var i = 0; i < N; i++){ var p = sq(i / N * Math.PI * 2, hw, hh, n); d += (i ? 'L' : 'M') + n1(cx + p[0]) + ' ' + n1(cy + p[1]); }
    return d + 'Z';
  }
  function inSq(x, y, hw, hh, n){ return Math.pow(Math.abs(x) / hw, n) + Math.pow(Math.abs(y) / hh, n) < 1; }

  function boot(){
    var K = window.LevlKit2;
    T.mount(SLUG, function(app, data, ctx){
      var esc = T.esc, F = T.F, EX = data.explore, TC = EX.T, PMAX = EX.pressure.max, CMAX = EX.outside.max;
      var CELL_S = r1(M.psiS(EX.cell.i, EX.cell.C, TC));           // the cell's solute potential, held (−9.8 bar)
      function outS(C){ return r1(M.psiS(EX.outside.i, C, TC)); }    // the solution's, rounded before adding
      function sg(v, d, plus){ var x = +(+v).toFixed(d); return (x < 0 ? MIN : plus && x > 0 ? '+' : '') + Math.abs(x).toFixed(d); }
      var S = { p: EX.pressure.value, c: EX.outside.value, mode: 'explore' };
      var view = { p: S.p, c: S.c, reveal: 1, clock: 0 }, prev = null, gest = null, prob = null, flowUntil = 0;

      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'wp2';
      var head = K.head({ purpose: 'Solute plus pressure decides which way water moves', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'wp2-scene'; sceneBox.id = T.nid('wp2');
      sceneBox.innerHTML = '<svg class="wp2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="wp2-static"></g><g class="wp2-dyn"></g></svg>';
      stage.appendChild(sceneBox);
      var svg = sceneBox.querySelector('svg'), gStatic = svg.querySelector('.wp2-static'), gDyn = svg.querySelector('.wp2-dyn'), layer = K.layer(sceneBox), G = null;
      var lines = document.createElement('div'); lines.className = 'wp2-lines';
      var cause = K.cause({ label: 'Why' });
      lines.appendChild(cause.el);
      stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

      /* ---- what the picture shows right now (Explore): read from the drawn state, never from where it will end */
      function shown(){
        var p = r1(view.p), so = outS(view.c), cell = r1(CELL_S + p);
        return { p: p, cellS: CELL_S, cell: cell, outS: so, out: so, d: 1, dir: cell === so ? 'none' : so > cell ? 'in' : 'out', gap: Math.abs(cell - so) };
      }
      function target(){ var p = S.p, so = outS(S.c), cell = r1(CELL_S + p); return { p: p, cell: cell, out: so, dir: cell === so ? 'none' : so > cell ? 'in' : 'out' }; }
      function dirWords(d){ return d === 'in' ? 'water moves in' : d === 'out' ? 'water moves out' : 'no net water movement'; }
      function chainOf(m){
        var d = m.d;
        return [{ t: 'Cell ψ ' + sg(m.cell, d), role: 'water', say: 'the cell’s water potential is ' + sg(m.cell, d) + ' bar' },
          { t: (m.dir === 'none' ? 'equal to ' : m.dir === 'in' ? 'lower than ' : 'higher than ') + sg(m.out, d) + ' outside', role: 'ink' },
          { t: dirWords(m.dir), role: 'water' }];
      }
      function sentence(m){
        return 'Cell: solute potential ' + sg(m.cellS, 1) + ' bar plus pressure potential ' + sg(m.p, 1) + ' bar is ' + sg(m.cell, 1) + ' bar. Outside: ' + sg(m.out, 1) + ' bar. ' +
          (m.dir === 'none' ? 'The totals are equal, so there is no net water movement.' : 'Water moves ' + (m.dir === 'in' ? 'into' : 'out of') + ' the cell, from the higher total to the lower.');
      }

      /* ---- the two controls, on the picture */
      function begin(k){ if(gest === k) return; gest = k; prev = { k: k, v: k === 'p' ? S.p : S.c }; }
      var cP = K.drag(layer, { key: 'apbio-wp-pressure', label: 'Pressure in the cell (pressure potential), in bar', min: EX.pressure.min, max: PMAX, step: EX.pressure.step, value: S.p, track: [0, 0, 1, 0], chip: false,
        valuetext: function(v){ var c = r1(CELL_S + v), o = outS(S.c); return F(v, 1) + ' bar of pressure. Cell water potential ' + sg(c, 1) + ' bar, outside ' + sg(o, 1) + ' bar: ' + dirWords(c === o ? 'none' : o > c ? 'in' : 'out') + '.'; },
        tag: function(v){ return F(v, 1) + ' bar'; },
        onInput: function(v){ begin('p'); S.p = v; changed(); tourDid('press'); },
        onEnd: function(){ gest = null; say(sentence(shownOf(target()))); refHtml(); } });
      cP.el.classList.add('wp2-kp');
      var cC = K.drag(layer, { label: 'Solute outside the cell: ' + EX.outside.solute + ' in the beaker, in moles per liter', min: 0, max: CMAX, step: EX.outside.step, value: S.c, track: [0, 1, 0, 0], tagSide: 'up',
        valuetext: function(v){ var c = r1(CELL_S + S.p), o = outS(v); return F(v, 2) + ' molar ' + EX.outside.solute + ' outside. Water potential outside ' + sg(o, 1) + ' bar, cell ' + sg(c, 1) + ' bar: ' + dirWords(c === o ? 'none' : o > c ? 'in' : 'out') + '.'; },
        tag: function(v){ return F(v, 2) + ' M'; },
        onInput: function(v){ begin('c'); S.c = v; changed(); tourDid('solute'); },
        onEnd: function(){ gest = null; say(sentence(shownOf(target()))); refHtml(); } });
      cC.el.classList.add('wp2-ks');
      function shownOf(t){ return { p: t.p, cellS: CELL_S, cell: t.cell, out: t.out, dir: t.dir, d: 1 }; }
      var cue = K.cue(layer, { key: 'apbio-water-potential', text: 'Drag the pressure', side: 'right', at: function(){ return G ? [G.tx0 + (G.tx1 - G.tx0) * (S.p / PMAX), G.ty] : [0, 0]; } });
      function hideCue(used){ if(cue.active()) cue.hide(used); }
      stage.addEventListener('pointerdown', function(){ hideCue(true); }, true);
      stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End|Enter| )/.test(e.key)) hideCue(true); }, true);
      var tour = K.tour({ key: 'apbio-water-potential', label: 'Show me how', steps: [
        { id: 'press', text: 'Drag the pressure. The cell’s total changes at once.', target: function(){ return cP.el.querySelector('.tk2-knob'); } },
        { id: 'solute', text: 'Drag the solute outside. More solute, lower total.', target: function(){ return cC.el.querySelector('.tk2-knob'); } },
        { id: 'read', text: 'Water moves from the higher total to the lower one.', target: function(){ return sceneBox.querySelector('.wp2-flowg') || sceneBox; } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      function tourDid(id){ if(tour.active()) tour.did(id); }
      function startTour(){ if(S.mode !== 'explore') return; hideCue(false); tour.start(true); }

      /* ---- the picture chases the setting, so every change is seen happening (rule 13): the wall bows, particles
         come and go, the arrows thin, turn and grow. One loop; reduced motion: at once, with a short cross fade. */
      var tw = 0, lastTs = 0, wKey = '';
      function now(){ return window.performance ? performance.now() : Date.now(); }
      function stopTween(){ if(tw){ cancelAnimationFrame(tw); tw = 0; } lastTs = 0; }
      function snap(){ view.p = S.mode === 'explore' ? S.p : sceneP(); view.c = S.mode === 'explore' ? S.c : 0; view.reveal = 1; }
      function crossFade(old){
        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'wp2-fade'); g.innerHTML = old; svg.appendChild(g);
        var done = function(){ if(g.parentNode) g.parentNode.removeChild(g); };
        if(g.animate){ var an = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'linear' }); an.onfinish = done; setTimeout(done, 400); } else done();
      }
      function syncWords(){
        if(S.mode !== 'explore') return;
        var m = shown(), k = m.cell + '|' + m.out;
        if(k !== wKey){ wKey = k; cause.set(chainOf(m)); }
      }
      function changed(){
        if(K.reduced() || !window.requestAnimationFrame){ var old = gDyn.innerHTML; snap(); syncWords(); draw(); crossFade(old); return; }
        flowUntil = now() + 900;
        if(!tw){ lastTs = 0; tw = requestAnimationFrame(tick); }
      }
      function tick(ts){
        var dt = lastTs ? Math.min(120, ts - lastTs) : 16, go = false, f = 1 - Math.exp(-dt / 110); lastTs = ts; view.clock = ts;
        var tp = S.mode === 'explore' ? S.p : sceneP(), tc = S.mode === 'explore' ? S.c : 0;
        if(Math.abs(tp - view.p) > 0.03){ view.p += (tp - view.p) * f; go = true; } else view.p = tp;
        if(Math.abs(tc - view.c) > 0.004){ view.c += (tc - view.c) * f; go = true; } else view.c = tc;
        if(view.reveal < 1){ view.reveal = Math.min(1, view.reveal + dt / 420); go = true; }
        if(!go && now() < flowUntil) go = true;   // the drops run on for a moment after a change, then rest
        syncWords(); draw();
        if(go) tw = requestAnimationFrame(tick); else { tw = 0; lastTs = 0; }
      }

      /* ---------------------------------------------------- layout and drawing */
      function geo(Wd, H){
        var ph = Wd < 520, ex = S.mode === 'explore';
        var ctl = ex ? (ph ? 100 : 106) : (ph ? 30 : 38), air = ph ? 22 : 32, gx = ph ? 5 : 9, gw = ph ? 5 : 8;
        var BX = gx + gw, BW = Wd - 2 * BX, BY = air, BH = Math.max(200, H - BY - ctl), y1 = BY + BH, R0 = BX + BW;
        var fs = ph ? 12 : 14.5, fsS = ph ? 11.5 : 13, rowH = ph ? fs + 5 : fs + 7.5, wt = ph ? 7 : 10, band = ph ? 11 : 17;
        var cw = ph ? Math.min(146, Math.floor((BW - 32) / 2)) : clamp(BW * 0.18, 200, 236);
        var ch = (ph ? 8 : 11) + fs * 0.8 + rowH + (ph ? 1 : 3) + rowH + (ph ? 6 : 7) + fs + (ph ? 5 : 7) + (ph ? 8 : 11), wordH = fsS + 10;
        var vx = R0 - (ph ? 36 : 70), rightLim = ex ? vx - (ph ? 30 : 60) : R0 - 10;   // the solute track, on the beaker's right wall
        // Roomy stage: the cell fills the height and carries its sum inside its vacuole. Otherwise the sums sit in a
        // band above and the cell stands under its own.
        var cellBot = y1 - (ph ? 12 : 20), top0 = BY + (ph ? 14 : 20), hh = (cellBot - top0) / 2 / 1.05, hw = Math.min(clamp(BW * 0.22, 170, 330), hh * 1.45);
        hh = Math.min(hh, hw * 0.95);
        var inside = !ph && 2 * (hw - wt - band) * 0.8 >= cw + 30 && 2 * (hh - wt - band) >= ch + wordH + 120, cardY, cellTop;
        if(inside){ cellTop = top0; cardY = (top0 + cellBot) / 2 - hh + wt + band + 18; }
        else {
          cardY = top0; cellTop = cardY + ch + wordH / 2 + (ph ? 12 : 16); hh = (cellBot - cellTop) / 2 / 1.05;
          hw = ph ? Math.min(BW * 0.25, hh * 1.1) : Math.min(clamp(BW * 0.2, 150, 300), hh * 1.5);
          hh = Math.min(hh, hw * (ph ? 1.45 : 0.95));
        }
        var cx = ph ? BX + 8 + hw * 1.05 : BX + Math.max(BW * 0.27, hw * 1.05 + 30), cy = (cellTop + cellBot) / 2, k = Math.min(hh / 120, ph ? 9 : 1.9);
        var xr = cx + hw * 1.05, c1 = clamp(cx - cw / 2, BX + 6, R0);
        var c2 = ph ? R0 - 6 - cw : clamp((xr + (ex ? vx - 20 : R0)) / 2 - cw / 2, Math.max(c1 + cw + 16, xr + 24), R0 - 8 - cw);
        var tx0 = ph ? BX + 26 : Math.max(BX + 30, cx - hw * 1.4), tx1 = ph ? R0 - 26 : Math.min(R0 - 40, Math.max(cx + hw * 1.4, tx0 + 420));
        var vy0 = y1 - (ph ? 50 : 62), vy1 = Math.max(cardY + ch + wordH / 2 + (ph ? 58 : 70), vy0 - (ph ? 190 : 300));
        return { W: Wd, H: H, ph: ph, ex: ex, gx: gx, gw: gw, BX: BX, BY: BY, BW: BW, BH: BH, y1: y1, R0: R0, fs: fs, fsS: fsS, rowH: rowH, cw: cw, ch: ch, cardY: cardY, inside: inside, wordH: wordH,
          c1: c1, c2: c2, vx: vx, vy0: vy0, vy1: vy1, cx: cx, cy: cy, hw: hw, hh: hh, k: k, wt: wt, band: band, xr: xr, rightLim: rightLim,
          tx0: tx0, tx1: tx1, ty: y1 + (ph ? 48 : 50), pool: poolFor((BW - 24) / (BH - 28)) };
      }
      function pillW(text, fs){ return text.length * fs * 0.56 + 18; }
      function pill(x, y, text, cls, anchor, fs){
        var w = pillW(text, fs), h = fs + 10, x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
        return '<g class="wp2-pill ' + cls + '"><rect x="' + n1(x0) + '" y="' + n1(y - h / 2) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="' + n1(h / 2) + '"/><text x="' + n1(x0 + w / 2) + '" y="' + n1(y + fs * 0.36) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(text) + '</text></g>';
      }
      function arrow(fx, fy, tx, ty, sw, cls){
        var ang = Math.atan2(ty - fy, tx - fx), hl = 6 + sw * 0.9, bx = tx - Math.cos(ang) * hl, by = ty - Math.sin(ang) * hl;
        return '<path class="' + cls + '" stroke-width="' + n1(sw) + '" d="M' + n1(fx) + ' ' + n1(fy) + 'L' + n1(bx) + ' ' + n1(by) + '"/>' +
          '<path class="' + cls + '-h" d="M' + n1(tx) + ' ' + n1(ty) + 'L' + n1(bx + Math.sin(ang) * hl * 0.75) + ' ' + n1(by - Math.cos(ang) * hl * 0.75) + 'L' + n1(bx - Math.sin(ang) * hl * 0.75) + ' ' + n1(by + Math.cos(ang) * hl * 0.75) + 'Z"/>';
      }
      /* A written sum: the name of the place, its two parts and, under a rule, the total with one word. */
      function card(x, y, title, rows, total, word, key){
        var g = G, w = g.cw, fs = g.fs, p = [], pad = g.ph ? 9 : 13, yy = y + (g.ph ? 8 : 11) + fs * 0.8;
        p.push('<g class="wp2-card" data-card="' + key + '"><rect class="wp2-cardbg" x="' + n1(x) + '" y="' + n1(y) + '" width="' + n1(w) + '" height="' + n1(g.ch) + '" rx="' + (g.ph ? 10 : 13) + '"/>');
        p.push('<text class="wp2-ct" x="' + n1(x + pad) + '" y="' + n1(yy) + '" style="font-size:' + fs + 'px">' + esc(title) + '</text>');
        yy += g.ph ? 1 : 3;
        rows.forEach(function(r){
          yy += g.rowH;
          p.push('<text class="wp2-ck is-' + r.role + '" x="' + n1(x + pad) + '" y="' + n1(yy) + '" style="font-size:' + fs + 'px">' + esc(r.k) + '</text>' +
            '<text class="wp2-cv is-' + r.role + (r.mine ? ' is-mine' : '') + '" data-v="' + r.id + '" x="' + n1(x + w - pad) + '" y="' + n1(yy) + '" text-anchor="end" style="font-size:' + (fs + 1) + 'px">' + esc(r.v) + '</text>');
        });
        yy += g.ph ? 6 : 7;
        p.push('<path class="wp2-rule" d="M' + n1(x + pad) + ' ' + n1(yy) + 'H' + n1(x + w - pad) + '"/>');
        yy += fs + (g.ph ? 5 : 7);
        p.push('<text class="wp2-ck is-water is-tot" x="' + n1(x + pad) + '" y="' + n1(yy) + '" style="font-size:' + (w < 170 ? fs + 1 : fs) + 'px">' + (w < 170 ? '\u03C8' : 'Total \u03C8') + '</text>' +
          '<text class="wp2-cv is-water is-tot' + (total.mine ? ' is-mine' : '') + '" data-v="total" x="' + n1(x + w - pad) + '" y="' + n1(yy) + '" text-anchor="end" style="font-size:' + (fs + (g.ph ? 1 : 2)) + 'px">' + esc(total.v) + '</text>');
        p.push('</g>');
        if(word) p.push('<g class="wp2-word" data-word="' + key + '">' + pill(x + w / 2, y + g.ch + 3, word, 'is-water is-fill', 'middle', g.fsS) + '</g>');
        return p.join('');
      }
      /* What to draw now. Explore: the drawn state. A problem: its cell and beaker, the student's numbers so far
         and, after the last part, the true ones with the words and the arrows. */
      function sceneP(){ return prob && prob.input.mode !== 'zero' ? clamp(prob.input.cell.psiP, 0, PMAX) : 0; }
      function sceneNow(){
        if(S.mode === 'explore'){
          var m = shown();
          return { ex: true, p: view.p, osmOut: view.c * EX.outside.i, osmIn: EX.cell.C * EX.cell.i, m: m, dir: m.dir, gap: m.gap, reveal: 1,
            t1: 'Plant cell', t2: view.c < 0.001 ? 'Pure water' : 'Open beaker',
            rows1: [{ k: 'Solute ψs', v: sg(m.cellS, 1), role: 'sol', id: 's' }, { k: 'Pressure ψp', v: sg(m.p, 1, true), role: 'press', id: 'p' }], tot1: { v: sg(m.cell, 1) + ' bar' },
            rows2: [{ k: 'Solute ψs', v: sg(m.outS, 1), role: 'sol', id: 's' }, { k: 'Pressure ψp', v: '0.0', role: 'press', id: 'p' }], tot2: { v: sg(m.out, 1) + ' bar' },
            w1: m.dir === 'none' ? 'equal' : m.dir === 'in' ? 'lower' : 'higher', w2: m.dir === 'none' ? 'equal' : m.dir === 'in' ? 'higher' : 'lower' };
        }
        if(!prob) return null;
        var x = prob.input, a = prob.answers || {}, chk = prob.phase === 'checked', zero = x.mode === 'zero';
        var sS = M.psiS(x.sol.i, x.sol.C, x.T), cS = zero ? NaN : M.psiS(x.cell.i, x.cell.C, x.T), cPsi = zero ? sS : cS + x.cell.psiP;
        var num = function(v){ return typeof v === 'number' && isFinite(v); };
        var val = function(truth, mine){ return chk ? { v: sg(truth, 2), mine: false } : num(mine) ? { v: sg(mine, 2), mine: true } : { v: '?', mine: false }; };
        var dir = !chk ? null : zero || Math.abs(sS - cPsi) < 0.005 ? 'none' : sS > cPsi ? 'in' : 'out';
        var t1v = val(cPsi, zero ? a['psi-tissue'] : a['psi-cell']), t2v = val(sS, a['psi-sol']), s1 = zero ? null : val(cS, a['psiS-cell']);
        return { ex: false, p: view.p, osmOut: x.sol.C * x.sol.i, osmIn: zero ? x.sol.C * x.sol.i : x.cell.C * x.cell.i, dir: dir, gap: Math.abs(sS - cPsi), reveal: chk ? view.reveal : 0, chk: chk,
          m: chk ? { cell: cPsi, out: sS, dir: dir, d: 2 } : null,
          t1: zero ? 'Tissue' : 'Plant cell', t2: F(x.sol.C, 2) + ' M ' + x.sol.name,
          rows1: zero ? [{ k: 'Solute ψs', v: '?', role: 'sol', id: 's' }, { k: 'Pressure ψp', v: '?', role: 'press', id: 'p' }]
            : [{ k: 'Solute ψs', v: s1.v, mine: s1.mine, role: 'sol', id: 's' }, { k: 'Pressure ψp', v: sg(x.cell.psiP, 1, true), role: 'press', id: 'p' }],
          tot1: { v: t1v.v + (t1v.v === '?' ? '' : ' bar'), mine: t1v.mine },
          rows2: [{ k: 'Solute ψs', v: chk ? sg(sS, 2) : '?', role: 'sol', id: 's' }, { k: 'Pressure ψp', v: chk ? '0.0' : '?', role: 'press', id: 'p' }],
          tot2: { v: t2v.v + (t2v.v === '?' ? '' : ' bar'), mine: t2v.mine },
          w1: !chk ? '' : dir === 'none' ? 'equal' : dir === 'in' ? 'lower' : 'higher', w2: !chk ? '' : dir === 'none' ? 'equal' : dir === 'in' ? 'higher' : 'lower' };
      }
      /* The scene that does not change with the controls: the vessel of solution across the whole stage (air, a
         surface, depth), its glass with the graduations the solute knob rides on, the bench and the controls' names. */
      function drawStatic(){
        var g = G, BX = g.BX, BY = g.BY, y1 = g.y1, R0 = g.R0, p = [];
        p.push('<defs>' +
          '<linearGradient id="wp2g-liq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="wp2s-liq0"/><stop offset=".12" class="wp2s-liq1"/><stop offset="1" class="wp2s-liq2"/></linearGradient>' +
          '<linearGradient id="wp2g-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="wp2s-gl0"/><stop offset=".45" class="wp2s-gl1"/><stop offset="1" class="wp2s-gl0"/></linearGradient>' +
          '<linearGradient id="wp2g-bench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="wp2s-bn0"/><stop offset="1" class="wp2s-bn1"/></linearGradient>' +
          '<radialGradient id="wp2g-cyto" cx=".45" cy=".4" r=".75"><stop offset="0" class="wp2s-cy0"/><stop offset="1" class="wp2s-cy1"/></radialGradient>' +
          '<radialGradient id="wp2g-vac" cx=".42" cy=".36" r=".8"><stop offset="0" class="wp2s-va0"/><stop offset="1" class="wp2s-va1"/></radialGradient>' +
          '<radialGradient id="wp2g-sol" cx=".35" cy=".3" r=".8"><stop offset="0" class="wp2s-so0"/><stop offset="1" class="wp2s-so1"/></radialGradient>' +
          '<clipPath id="wp2c-liq"><path d="M' + n1(BX) + ' ' + n1(BY) + 'H' + n1(R0) + 'V' + n1(y1 - 12) + 'q0 12 -12 12H' + n1(BX + 12) + 'q-12 0 -12 -12Z"/></clipPath></defs>');
        p.push('<rect class="wp2-bench" x="0" y="' + n1(y1 + g.gw) + '" width="' + g.W + '" height="' + n1(g.H - y1 - g.gw) + '"/><path class="wp2-benchedge" d="M0 ' + n1(y1 + g.gw + 0.5) + 'H' + g.W + '"/>');
        p.push('<path class="wp2-sol" d="M' + n1(BX) + ' ' + n1(BY) + 'H' + n1(R0) + 'V' + n1(y1 - 12) + 'q0 12 -12 12H' + n1(BX + 12) + 'q-12 0 -12 -12Z"/>');
        p.push('<path class="wp2-surface" d="M' + n1(BX) + ' ' + n1(BY - 5) + 'q4 6 18 6H' + n1(R0 - 18) + 'q14 0 18 -6V' + n1(BY + 9) + 'H' + n1(BX) + 'Z"/>');
        p.push('<path class="wp2-menis" d="M' + n1(BX) + ' ' + n1(BY - 5) + 'q4 6 18 6H' + n1(R0 - 18) + 'q14 0 18 -6"/>');
        var gy0 = Math.max(3, BY - (g.ph ? 18 : 27));
        p.push('<path class="wp2-glass" d="M' + n1(g.gx) + ' ' + n1(gy0) + 'V' + n1(y1) + 'q0 ' + g.gw + ' ' + g.gw + ' ' + g.gw + 'H' + n1(R0) + 'q' + g.gw + ' 0 ' + g.gw + ' -' + g.gw + 'V' + n1(gy0) + 'h-' + g.gw + 'V' + n1(y1 - 12) + 'q0 12 -12 12H' + n1(BX + 12) + 'q-12 0 -12 -12V' + n1(gy0) + 'Z"/>');
        p.push('<path class="wp2-rim" d="M' + n1(g.gx - 2) + ' ' + n1(gy0) + 'h' + (g.gw + 4) + 'M' + n1(R0 - 2) + ' ' + n1(gy0) + 'h' + (g.gw + 4) + '"/>');
        p.push('<path class="wp2-shine" d="M' + n1(BX + 7) + ' ' + n1(BY + 16) + 'V' + n1(y1 - 30) + '"/>');
        if(g.ex){
          // the beaker's graduations: the solute knob rides on them (0 at the bottom)
          var gr = [];
          for(var i = 0; i <= 10; i++){ var yy = g.vy0 + (g.vy1 - g.vy0) * i / 10, L = i % 5 === 0 ? 9 : 5; gr.push('M' + n1(g.vx - L) + ' ' + n1(yy) + 'h' + (2 * L)); }
          p.push('<path class="wp2-rail" d="M' + n1(g.vx) + ' ' + n1(g.vy0) + 'V' + n1(g.vy1) + '"/><path class="wp2-grad" d="' + gr.join('') + '"/>');
          p.push(pill(Math.min(g.vx + pillW('Solute outside', g.fsS) / 2, R0 - 6), g.vy0 + (g.ph ? 32 : 36), 'Solute outside', 'is-sol', 'end', g.fsS));
          p.push(pill((g.tx0 + g.tx1) / 2, g.ty + 34, 'Pressure in the cell', 'is-press', 'middle', g.fsS));
          p.push('<text class="wp2-end" x="' + n1(g.tx0) + '" y="' + n1(g.ty + 38) + '" text-anchor="middle" style="font-size:' + g.fsS + 'px">0</text><text class="wp2-end" x="' + n1(g.tx1) + '" y="' + n1(g.ty + 38) + '" text-anchor="middle" style="font-size:' + g.fsS + 'px">' + F(PMAX, 1) + ' bar</text>');
        }
        gStatic.innerHTML = p.join('');
      }
      function draw(){
        if(!G) return;
        var sc = sceneNow(); if(!sc) return;
        var g = G, BX = g.BX, BY = g.BY, BW = g.BW, BH = g.BH, y1 = g.y1, R0 = g.R0, cx = g.cx, cy = g.cy, k = g.k, p = [];
        // the cell's shape follows its pressure: boxy and slack at 0, bowed out and round cornered when full
        var tg = clamp(sc.p / PMAX, 0, 1), n = 5.4 - 2.3 * tg, grow = 1 + 0.05 * tg, hw = g.hw * grow, hh = g.hh * grow, wt = g.wt;
        var ihw = hw - wt - 1.4, ihh = hh - wt - 1.4, vhw = ihw - g.band, vhh = ihh - g.band, vn = Math.max(2.6, n - 1.5);
        // solute outside: particles at the same density rule as the cell sap, never on the cell, a card or the rail
        var POOL = g.pool, area = BW * BH / (k * k), nf = Math.min(POOL.length, sc.osmOut * KD * area), nOut = Math.ceil(nf - 1e-9), dr = Math.max(2.6, 2.9 * Math.sqrt(k)), dots = [];
        var wy = cy - (g.ph ? 0.2 : 0.32) * g.hh - (g.ph ? 24 : 30), sp = pillW('Solute outside', g.fsS), spx = Math.min(g.vx + sp / 2, R0 - 6);
        var keep = [[g.c2, g.cardY, g.c2 + g.cw, g.cardY + g.ch + g.wordH / 2 + 2], [g.xr, wy - 20, g.xr + 16 + pillW('no net flow', g.fsS), wy + 12]];
        if(!g.inside) keep.push([g.c1, g.cardY, g.c1 + g.cw, g.cardY + g.ch + g.wordH / 2 + 2]);
        if(g.ex) keep.push([g.vx - 26, g.vy1 - 52, g.vx + 26, g.vy0 + 22], [spx - sp, g.vy0 + (g.ph ? 32 : 36) - g.wordH / 2, spx, g.vy0 + (g.ph ? 32 : 36) + g.wordH / 2]);
        var hit = function(x, y, m){ for(var z = 0; z < keep.length; z++){ var q = keep[z]; if(x > q[0] - m && x < q[2] + m && y > q[1] - m && y < q[3] + m) return true; } return false; };
        for(var i = 0; i < nOut; i++){
          var qx = BX + 12 + POOL[i][0] * (BW - 24), qy = BY + 16 + POOL[i][1] * (BH - 28);
          if(inSq(qx - cx, qy - cy, g.hw * 1.05 + dr + 3, g.hh * 1.05 + dr + 3, 3.1)) continue;
          if(hit(qx, qy, dr + 2)) continue;
          dots.push('<circle cx="' + n1(qx) + '" cy="' + n1(qy) + '" r="' + n1(dr) + '"' + (i === nOut - 1 && nf < nOut ? ' opacity="' + (nf - (nOut - 1)).toFixed(2) + '"' : '') + '/>');
        }
        p.push('<g class="wp2-dots" data-n="' + dots.length + '" clip-path="url(#wp2c-liq)">' + dots.join('') + '</g>');
        // the cell: a wall with thickness, the membrane just inside it, cytoplasm, chloroplasts, a nucleus, the vacuole
        var outer = ringPath(cx, cy, hw, hh, n, 88), inner = ringPath(cx, cy, hw - wt, hh - wt, n, 88), mid = ringPath(cx, cy, hw - wt / 2, hh - wt / 2, n, 88);
        p.push('<g class="wp2-cell">');
        p.push('<path class="wp2-wall' + (tg > 0.04 ? ' is-taut' : '') + '" fill-rule="evenodd" d="' + outer + inner + '"/><path class="wp2-wallmid" d="' + mid + '"/><path class="wp2-walledge" d="' + outer + '"/><path class="wp2-walledge is-in" d="' + inner + '"/>');
        var memb = ringPath(cx, cy, ihw, ihh, n, 88);
        p.push('<path class="wp2-cyto" d="' + memb + '"/>');
        var bandAt = function(a, f){ var m0 = sq(a, ihw, ihh, n), v0 = sq(a, vhw, vhh, vn); return [cx + v0[0] + (m0[0] - v0[0]) * f, cy + v0[1] + (m0[1] - v0[1]) * f, Math.hypot(m0[0] - v0[0], m0[1] - v0[1])]; };
        [0.33, 1.18, 1.95, 3.5, 4.32, 5.1, 5.95].forEach(function(a){
          var b = bandAt(a, 0.5), ry = clamp(b[2] * 0.3, 2.4, 6.5), rx = ry * 1.9, t = sq(a + 0.02, ihw, ihh, n), t0 = sq(a - 0.02, ihw, ihh, n), rot = Math.atan2(t[1] - t0[1], t[0] - t0[0]) * 57.3;
          p.push('<g transform="translate(' + n1(b[0]) + ' ' + n1(b[1]) + ') rotate(' + rot.toFixed(0) + ')"><ellipse class="wp2-chl" rx="' + n1(rx) + '" ry="' + n1(ry) + '"/><path class="wp2-chl-l" d="M' + n1(-rx * 0.55) + ' 0H' + n1(rx * 0.55) + '"/></g>');
        });
        var nq = bandAt(2.72, 0.52), nrad = clamp(nq[2] * 0.36, 3.5, 11);
        p.push('<circle class="wp2-nuc" cx="' + n1(nq[0]) + '" cy="' + n1(nq[1]) + '" r="' + n1(nrad) + '"/><circle class="wp2-nucl" cx="' + n1(nq[0] + nrad * 0.2) + '" cy="' + n1(nq[1] - nrad * 0.15) + '" r="' + n1(nrad * 0.36) + '"/>');
        p.push('<path class="wp2-vac" d="' + ringPath(cx, cy, vhw, vhh, vn, 72) + '"/>');
        var s0 = sq(3.55, vhw * 0.84, vhh * 0.84, vn), s1 = sq(4.1, vhw * 0.9, vhh * 0.9, vn), s2 = sq(4.6, vhw * 0.84, vhh * 0.84, vn);
        p.push('<path class="wp2-vacshine" d="M' + n1(cx + s0[0]) + ' ' + n1(cy + s0[1]) + 'Q' + n1(cx + s1[0]) + ' ' + n1(cy + s1[1]) + ' ' + n1(cx + s2[0]) + ' ' + n1(cy + s2[1]) + '"/>');
        p.push('<path class="wp2-memb" d="' + memb + '"/>');
        // the cell sap's solute, in the vacuole: a fixed amount
        var nIn = Math.min(160, Math.round(sc.osmIn * KD * Math.PI * (g.hw - wt - g.band) * (g.hh - wt - g.band) / (k * k) * 1.06)), ind = [];
        for(var j = 0; j < nIn; j++){
          var da = j * 2.39996 + 0.6, dq = Math.sqrt((j + 0.5) / nIn) * 0.9, c0 = Math.cos(da), s0b = Math.sin(da), e = 2 / Math.max(vn, 2.6) * 0.5 + 0.5;
          var ix = cx + (vhw - dr - 2) * dq * (c0 < 0 ? -1 : 1) * Math.pow(Math.abs(c0), e), iy = cy + (vhh - dr - 2) * dq * (s0b < 0 ? -1 : 1) * Math.pow(Math.abs(s0b), e);
          if(g.inside && ix > g.c1 - dr - 2 && ix < g.c1 + g.cw + dr + 2 && iy > g.cardY - dr - 2 && iy < g.cardY + g.ch + g.wordH / 2 + dr + 2) continue;
          ind.push('<circle cx="' + n1(ix) + '" cy="' + n1(iy) + '" r="' + n1(dr) + '"/>');
        }
        p.push('<g class="wp2-dots is-in" data-n="' + ind.length + '">' + ind.join('') + '</g>');
        // pressure: the wall pushes in on what it holds, harder as the cell fills
        if(sc.p > 0.08){
          var len = (6 + 3 * sc.p) * clamp(k, 0.8, 1.9), psw = clamp(2.2 * k, 2.4, 4.4);
          [0.76, 2.3, 3.93, 5.52, 3.1416, 1.5708, 4.7124].forEach(function(a, ix){
            if((g.ph && ix > 4) || (g.inside && ix === 6)) return;
            var q0 = sq(a, hw - wt - 1, hh - wt - 1, n), d0 = Math.hypot(q0[0], q0[1]) || 1, ux = -q0[0] / d0, uy = -q0[1] / d0;
            p.push(arrow(cx + q0[0], cy + q0[1], cx + q0[0] + ux * len, cy + q0[1] + uy * len, psw, 'wp2-push'));
          });
        }
        p.push('</g>');
        // water: arrows across the wall from the higher total to the lower one, as wide as the difference
        var xr = cx + hw, ys = g.ph ? [-0.2, 0.2] : [-0.32, 0, 0.32], fl = [];
        if(sc.dir && sc.reveal > 0){
          var sw = Math.min(15, 1.6 + sc.gap * 0.8) * clamp(k, 0.85, 1.35) * (0.35 + 0.65 * sc.reveal), ax0 = xr + (g.ph ? 40 : 58) + sw * 0.5, ax1 = xr - wt - (g.ph ? 14 : 22);
          ys.forEach(function(f){
            var ay = cy + f * g.hh;
            if(sc.dir === 'none'){ fl.push('<path class="wp2-eq" d="M' + n1(ax0) + ' ' + n1(ay) + 'H' + n1(ax1) + '"/>'); return; }
            var inn = sc.dir === 'in', fx = inn ? ax0 : ax1, tx = inn ? ax1 : ax0;
            fl.push(arrow(fx, ay, tx, ay, sw, 'wp2-flow'));
            if(tw && !K.reduced()){ var phs = (view.clock / 640) % 1; for(var w = 0; w < 2; w++){ var u = (phs + w / 2) % 1; fl.push('<circle class="wp2-w" cx="' + n1(fx + (tx - fx) * u * 0.78) + '" cy="' + n1(ay) + '" r="' + n1(2.2 + sw * 0.13) + '"/>'); } }
          });
          var wtxt = sc.dir === 'none' ? 'no net flow' : sc.dir === 'in' ? 'water in' : 'water out';
          fl.push(pill(Math.min(g.xr + 8, g.rightLim - pillW(wtxt, g.fsS)), wy, wtxt, 'is-water', 'start', g.fsS));
          p.push('<g class="wp2-flowg" data-dir="' + sc.dir + '" opacity="' + sc.reveal.toFixed(2) + '">' + fl.join('') + '</g>');
        }
        // the two written sums
        p.push(card(g.c1, g.cardY, sc.t1, sc.rows1, sc.tot1, sc.w1, 'cell'));
        p.push(card(g.c2, g.cardY, sc.t2, sc.rows2, sc.tot2, sc.w2, 'out'));
        // the setting before this change: a tick on that control's track (a mark, never a moved handle)
        if(sc.ex && prev && (prev.k === 'p' ? prev.v !== S.p : prev.v !== S.c)){
          if(prev.k === 'p'){
            var bx = g.tx0 + (g.tx1 - g.tx0) * (prev.v / PMAX), kx = g.tx0 + (g.tx1 - g.tx0) * (S.p / PMAX);
            p.push('<path class="wp2-mark" d="M' + n1(bx) + ' ' + n1(g.ty - 9) + 'V' + n1(g.ty + 9) + '"/>' + (Math.abs(bx - kx) > 62 ? '<text class="wp2-markt" x="' + n1(bx) + '" y="' + n1(g.ty - 13) + '" text-anchor="middle" style="font-size:' + (g.fsS - 1) + 'px">before</text>' : ''));
          } else {
            var by = g.vy0 + (g.vy1 - g.vy0) * (prev.v / CMAX), ky = g.vy0 + (g.vy1 - g.vy0) * (S.c / CMAX);
            p.push('<path class="wp2-mark is-v" d="M' + n1(g.vx - 11) + ' ' + n1(by) + 'h22"/>' + (Math.abs(by - ky) > 30 ? '<text class="wp2-markt is-v" x="' + n1(g.vx - 15) + '" y="' + n1(by + 4) + '" text-anchor="end" style="font-size:' + (g.fsS - 1) + 'px">before</text>' : ''));
          }
        }
        gDyn.innerHTML = p.join('');
        var al = sc.ex ? 'A plant cell in an open beaker of ' + F(view.c, 2) + ' molar ' + EX.outside.solute + '. ' + sentence(sc.m)
          : 'The problem’s ' + sc.t1.toLowerCase() + ' in a beaker of ' + sc.t2 + '.' + (sc.chk ? ' Cell water potential ' + sg(sc.m.cell, 2) + ' bar, outside ' + sg(sc.m.out, 2) + ' bar: ' + dirWords(sc.dir) + '.' : ' The sums fill in as you answer.');
        if(draw.al !== al){ draw.al = al; svg.setAttribute('aria-label', al); }
      }
      function layoutNow(){
        if(stage.hidden) return;
        var r = sceneBox.getBoundingClientRect(), Wd = Math.max(280, Math.round(r.width)), H = Math.max(300, Math.round(r.height));
        svg.setAttribute('viewBox', '0 0 ' + Wd + ' ' + H); svg.setAttribute('width', Wd); svg.setAttribute('height', H);
        G = geo(Wd, H);
        cP.place([G.tx0, G.ty, G.tx1, G.ty]); cC.place([G.vx, G.vy0, G.vx, G.vy1]);
        drawStatic(); draw();
        if(cue.active()) cue.place();
      }

      /* ---------------------------------------------------- "?": the numbers behind this setting */
      var ref = document.createElement('div'); ref.className = 'ls-sec wp2-ref';
      function ladder(m){
        var W = 300, H = 150, L = 46, top = 18, bot = 132, lo = -25, sy = function(v){ return top + (v / lo) * (bot - top); }, q = [];
        [0, -5, -10, -15, -20, -25].forEach(function(t){ q.push('<path class="wp2-lg" d="M' + L + ' ' + n1(sy(t)) + 'H' + (W - 8) + '"/><text class="wp2-lt" x="' + (L - 6) + '" y="' + n1(sy(t) + 4) + '" text-anchor="end">' + sg(t, 0) + '</text>'); });
        q.push('<path class="wp2-ll" d="M' + (L + 14) + ' ' + n1(sy(m.cell)) + 'h96"/><text class="wp2-lv" x="' + (L + 62) + '" y="' + n1(sy(m.cell) - 5) + '" text-anchor="middle">cell ' + sg(m.cell, 1) + '</text>');
        q.push('<path class="wp2-ll" d="M' + (L + 138) + ' ' + n1(sy(m.out)) + 'h96"/><text class="wp2-lv" x="' + (L + 186) + '" y="' + n1(sy(m.out) - 5) + '" text-anchor="middle">outside ' + sg(m.out, 1) + '</text>');
        return '<svg class="wp2-ladder" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="A scale of water potential in bar, 0 at the top. The cell is at ' + sg(m.cell, 1) + ' and the outside at ' + sg(m.out, 1) + '.">' + q.join('') + '</svg>';
      }
      function refHtml(){
        var t = target(), m = shownOf(t), Kk = TC + M.K0, so = M.psiS(EX.outside.i, S.c, TC), cs = M.psiS(EX.cell.i, EX.cell.C, TC);
        ref.innerHTML = '<p class="wp2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>' +
          '<h3 class="ls-title-l">This setting, worked</h3>' +
          '<p class="bt-eq">Cell: ψs = −iCRT = −(' + EX.cell.i + ')(' + F(EX.cell.C, 2) + ' mol/L)(0.0831 L·bar/(mol·K))(' + Kk + ' K) = ' + sg(cs, 2) + ' bar, used as ' + sg(CELL_S, 1) + '</p>' +
          '<p class="bt-eq">Cell: ψ = ψs + ψp = ' + sg(CELL_S, 1) + ' + ' + F(t.p, 1) + ' = ' + sg(t.cell, 1) + ' bar</p>' +
          '<p class="bt-eq">Outside: ψs = −(' + EX.outside.i + ')(' + F(S.c, 2) + ')(0.0831)(' + Kk + ') = ' + sg(so, 2) + ' bar, used as ' + sg(t.out, 1) + '; an open beaker has ψp = 0, so ψ = ' + sg(t.out, 1) + ' bar</p>' +
          '<p class="bt-small">' + (t.dir === 'none' ? 'The two totals are equal, so there is no net water movement. Water still crosses both ways at the same rate.' : sg(Math.max(t.cell, t.out), 1) + ' is higher (less negative) than ' + sg(Math.min(t.cell, t.out), 1) + ', so water moves ' + (t.dir === 'in' ? 'into the cell.' : 'out of the cell.')) + '</p>' +
          '<h3 class="ls-title-l">The two totals on one scale</h3>' + ladder(m) +
          '<p class="bt-small">0 is pure water in an open beaker. Solute pulls a total down; pressure lifts it. Water moves from the higher mark to the lower one.</p>' +
          '<h3 class="ls-title-l">Things to try</h3><ul class="wp2-try"><li>Find the pressure where there is no net water movement.</li><li>Take the solute outside to 0. How much pressure stops the water now?</li><li>Set the pressure to 0 and make water leave the cell.</li></ul>' +
          '<h3 class="ls-title-l">What Explore holds still</h3><ul class="wp2-try"><li>The cell sap is ' + F(EX.cell.C, 2) + ' M (as ' + esc(EX.cell.solute) + '), the solute outside is ' + esc(EX.outside.solute) + ' (i = 1) and the temperature is ' + TC + ' °C. The practice problems change all three, with NaCl (i = 2) and CaCl₂ (i = 3).</li>' +
          '<li>Each solute potential is rounded to 0.1 bar before adding, so the sums are exact. The practice problems use 0.01 bar.</li>' +
          '<li>Particles are drawn at i × C, at the same crowding rule inside and outside.</li>' +
          '<li>The picture is the moment the cell goes in. As water moves, the cell’s pressure changes until the totals are equal. <a class="wp2-osm" href="osmosis.html">See what happens to the cell: Osmosis <span aria-hidden="true">→</span></a></li></ul>';
      }
      ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(ctx.studio) ctx.studio.close(); if(S.mode !== 'explore' && ctx.studio && ctx.studio.kit2) ctx.studio.kit2.go('explore'); setTimeout(startTour, 60); });

      /* ---------------------------------------------------- Test yourself: the practice problems on the picture */
      function toScene(){
        var b = sceneBox.getBoundingClientRect(), vh = window.innerHeight || 800;
        if(b.top >= 0 && b.bottom <= vh) return false;
        try{ sceneBox.scrollIntoView({ block: 'center', behavior: K.reduced() ? 'auto' : 'smooth' }); }catch(e){ return false; }
        return true;
      }
      var lastPhase = '', lastProb = null;
      function problemStage(host, s){
        host.hidden = true;                      // the tool draws on its own picture, not in the skill tool's slot
        var fresh = s.input !== lastProb, done = s.phase === 'checked' && lastPhase !== 'checked';
        prob = s; lastProb = s.input; lastPhase = s.phase;
        if(S.mode !== 'quiz') return;
        if(fresh){ stopTween(); snap(); cause.el.hidden = true; }
        if(done){
          var m = sceneNow().m; cause.set(chainOf(m)); cause.el.hidden = false;
          if(K.reduced() || !window.requestAnimationFrame){ var old = gDyn.innerHTML; view.reveal = 1; draw(); crossFade(old); return; }
          var away = toScene(), me = s;
          view.reveal = 0; draw();
          setTimeout(function(){ if(prob !== me) return; flowUntil = now() + 1100; if(!tw){ lastTs = 0; tw = requestAnimationFrame(tick); } }, away ? 450 : 0);
          // on a phone the answers are above the picture: come back to them once the arrows are in
          if(away && ctx.studio) setTimeout(function(){ if(prob !== me) return; var d = ctx.studio.root.querySelector('.ls-dock'); try{ if(d) d.scrollIntoView({ block: 'start', behavior: 'smooth' }); }catch(e){} }, 1700);
          return;
        }
        draw();
      }

      /* ---------------------------------------------------- the two modes (the adapter calls onShow) */
      function showMode(mode){
        S.mode = mode === 'quiz' ? 'quiz' : 'explore';
        stopTween(); tour.stop();
        var ex = S.mode === 'explore';
        stage.setAttribute('data-view', ex ? 'explore' : 'problem');
        head.el.hidden = !ex; cP.hide(!ex); cC.hide(!ex);
        if(ex){ prev = null; gest = null; cause.el.hidden = false; snap(); wKey = ''; syncWords(); refHtml(); }
        else { hideCue(false); snap(); var sc = sceneNow(); cause.el.hidden = !(sc && sc.chk); if(sc && sc.chk) cause.set(chainOf(sc.m)); }
        setTimeout(function(){ layoutNow(); if(ex && !tour.active()) cue.show(); }, 30);
      }

      // The practice problems (the page's own blocks: About, the formula box, the problem area). The adapter moves them.
      T.skillTool(app, data, { slug: SLUG, kind: 'wp', stage: problemStage });
      var area = app.querySelector('.bt-problem'), modes = app.querySelector('.bt-modes');
      ctx.kit2 = { stage: stage, ref: ref,
        parts: [{ value: 'practice', label: 'Practice problems', practice: area, modes: modes }],
        onShow: function(m){ showMode(m); } };
      snap(); syncWords(); refHtml();
      // Without the frame (no Tool Studio on the page) the stage still works on its own, above the problems.
      if(!ctx.studio){ app.insertBefore(stage, app.firstChild); app.insertBefore(ref, stage.nextSibling); showMode('explore'); }
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(layoutNow, 50); }).observe(sceneBox); }
      else window.addEventListener('resize', layoutNow);
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApBioBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var l2 = document.createElement('link'); l2.rel = 'stylesheet'; l2.href = (window.ApBioBase || '../') + 'assets/tools/water-potential.css'; document.head.appendChild(l2);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
