/* Skills tool: solute potential and water potential. The solver and the seeded problem generator are
   ApBioProblems.solve.wp and generate.wp (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/water-potential.json); the page is ApBioTools.skillTool.

   The picture (one drawing, both modes): a plant cell and an open beaker
   side by side, on one shared ψ scale in bar (0 at the top, more negative
   lower down). Each is drawn as itself: the cell with its wall, membrane,
   chloroplasts and a vacuole holding solute particles; the beaker in glass
   with its solute particles (NaCl drawn as Na⁺ and Cl⁻, two particles per
   formula unit, which is i). A level line on the scale marks each
   compartment's ψ, so "water moves from higher to lower ψ" reads as water
   running downhill, and a wide arrow between them shows the net flow.

     Explore (tool audit 2026-10: the tool had no Explore mode and opened on
       an empty beaker): sliders for the cell's solute concentration, its
       turgor pressure ψp, the beaker's concentration and solute, and the
       temperature. ψs = −iCRT and ψ = ψs + ψp are worked live with the
       numbers, the levels and the arrow follow, and the cell swells or
       shrinks (plasmolysis) with the direction. "Try this" goals.
     Practice: the problem's cell and beaker are drawn from the start, with
       their particles; the level lines follow the values the student types,
       then the true ones (ApBioMath.psiS) after the last part.
   For mass change over time, the page links to the osmosis simulator. */
(function(){
  'use strict';
  var T = window.ApBioTools, S = window.ApBioSkillStage, M = window.ApBioMath;
  if(!T || !S) return;
  var F = T.F, esc = T.esc;
  var W = 420, H = 262, TOP = 30, BOT = 206, L = 58;
  var CX = L + 26, CW = 128, BX = L + 214, BW = 128;   // cell and beaker boxes

  /* Particles: n dots spread in a box from a fixed pattern (no randomness, so
     a redraw never jumps). ions: draw pairs (Na⁺ and Cl⁻). */
  function particles(x0, y0, w, h, n, ions){
    var out = [], k = 0;
    for(var i = 0; i < n; i++){
      var fx = ((0.5 + i * 0.7548777) % 1), fy = ((0.5 + i * 0.5698403) % 1);   // the R2 sequence: evenly spread, never in a line
      var x = x0 + 6 + fx * (w - 12), y = y0 + 6 + fy * (h - 12);
      if(ions){
        out.push('<circle class="wp-na" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.6"/><circle class="wp-cl" cx="' + Math.min(x0 + w - 4, x + 6).toFixed(1) + '" cy="' + (y + 3).toFixed(1) + '" r="3.4"/>');
      } else out.push('<path class="wp-suc" d="M' + (x - 3.4).toFixed(1) + ' ' + y.toFixed(1) + 'l1.7 -3 3.4 0 1.7 3 -1.7 3 -3.4 0z"/>');
      k++;
    }
    return out.join('');
  }
  /* The drawing. v = { scaleLo, cell: { psi, psiS, psiP, i, C, mine, label, ions }, sol: { psi, i, C, name, mine },
     dir: 0 in, 1 out, 2 none, null unknown, tissue: bool, swell: −1..1 }. */
  function draw(v){
    var lo = v.scaleLo, sy = function(x){ return TOP + (Math.min(0, Math.max(lo, x)) / lo) * (BOT - TOP); };
    var p = [], st = T.niceStep(-lo, 5);
    for(var t = 0; t >= lo - 1e-9; t -= st) p.push('<line class="grid" x1="' + L + '" x2="' + (W - 12) + '" y1="' + sy(t).toFixed(1) + '" y2="' + sy(t).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (sy(t) + 4).toFixed(1) + '" text-anchor="end">' + F(M.round(t, 6), Math.max(0, Math.min(3, (String(M.round(st, 6)).split('.')[1] || '').length))) + '</text>');
    p.push('<text class="lbl" transform="translate(14 ' + ((TOP + BOT) / 2) + ') rotate(-90)" text-anchor="middle">ψ (bar)</text>');
    p.push('<text class="sk-ph" x="' + (L + 4) + '" y="' + (TOP - 14) + '">0 = pure water; lower = more negative</text>');
    // the cell: wall, then the protoplast (membrane) that shrinks away from the wall when water leaves
    var c = v.cell, sw = Math.max(-1, Math.min(1, v.swell || 0)), shrink = sw < 0 ? -sw * 18 : 0, puff = sw > 0 ? sw * 3 : 0;
    var cy0 = TOP + 4, ch = BOT - TOP - 8;
    p.push('<rect class="wp-wall" x="' + (CX - puff) + '" y="' + (cy0 - puff) + '" width="' + (CW + 2 * puff) + '" height="' + (ch + 2 * puff) + '" rx="20"/>');
    p.push('<rect class="wp-gap" x="' + (CX + 6) + '" y="' + (cy0 + 6) + '" width="' + (CW - 12) + '" height="' + (ch - 12) + '" rx="15"/>');
    var px = CX + 6 + shrink, py = cy0 + 6 + shrink * 1.3, pw = CW - 12 - 2 * shrink, ph = ch - 12 - 2.6 * shrink;
    p.push('<rect class="wp-cyto" x="' + px.toFixed(1) + '" y="' + py.toFixed(1) + '" width="' + pw.toFixed(1) + '" height="' + ph.toFixed(1) + '" rx="' + (15 - shrink * 0.3).toFixed(1) + '"/>');
    [[12, 18, 0], [pw - 14, 34, 1], [10, ph - 26, 1], [pw - 12, ph - 16, 0]].forEach(function(q){ p.push('<g transform="translate(' + (px + q[0]).toFixed(1) + ' ' + (py + q[1]).toFixed(1) + ') rotate(' + (q[2] ? 90 : 0) + ')"><ellipse class="wp-chl" rx="6.5" ry="3.6"/><path class="wp-thy" d="M-3.5-1.5v3M-1-2v4M1.5-2v4M3.8-1.4v2.8"/></g>'); });
    var vx = px + 20, vy = py + 22, vw = pw - 40, vh = ph - 46;
    p.push('<rect class="wp-vac" x="' + vx.toFixed(1) + '" y="' + vy.toFixed(1) + '" width="' + Math.max(10, vw).toFixed(1) + '" height="' + Math.max(10, vh).toFixed(1) + '" rx="12"/>');
    if(isFinite(c.C)) p.push(particles(vx, vy, Math.max(10, vw), Math.max(10, vh), Math.round(Math.min(16, c.C * c.i * 16)), false));
    p.push('<circle class="wp-nuc" cx="' + (px + pw - 18).toFixed(1) + '" cy="' + (py + ph - 30).toFixed(1) + '" r="7"/>');
    // the beaker: glass, liquid, particles
    var by0 = TOP + 10;
    p.push('<rect class="wp-liq" x="' + (BX + 2) + '" y="' + (by0 + 18) + '" width="' + (BW - 4) + '" height="' + (BOT - by0 - 22) + '" rx="6"/>');
    if(isFinite(v.sol.C)) p.push(particles(BX + 2, by0 + 20, BW - 4, BOT - by0 - 26, Math.round(Math.min(16, v.sol.C * 16 * (v.sol.i === 2 ? 1 : v.sol.i))), v.sol.i === 2));
    p.push('<path class="wp-glass" d="M' + (BX - 6) + ' ' + (by0 - 2) + 'q5 1 6 7V' + (BOT - 8) + 'q0 8 8 8H' + (BX + BW - 8) + 'q8 0 8 -8V' + (by0 + 3) + 'q0 -4 4 -5"/>');
    [0.35, 0.55, 0.75].forEach(function(f){ var gy = by0 + (BOT - by0) * f; p.push('<path class="wp-grad" d="M' + (BX + BW - 3) + ' ' + gy.toFixed(1) + 'h-10"/>'); });
    // the ψ levels
    [[CX, CW, c.psi, c.mine], [BX, BW, v.sol.psi, v.sol.mine]].forEach(function(b){
      if(!isFinite(b[2])) return;
      var y = sy(b[2]);
      p.push('<line class="wp-surf' + (b[3] ? ' mine' : '') + '" x1="' + (b[0] - 8) + '" x2="' + (b[0] + b[1] + 8) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>');
      p.push('<text class="wp-v" x="' + (b[0] + b[1] / 2) + '" y="' + (y - 6).toFixed(1) + '" text-anchor="middle">' + (b[3] ? 'your ' : '') + 'ψ ' + F(b[2], 2) + (b[2] < lo ? ' ↓' : '') + '</text>');
    });
    if(!isFinite(c.psi)) p.push('<text class="wp-ask" x="' + (CX + CW / 2) + '" y="' + (TOP + 16) + '" text-anchor="middle">ψ ?</text>');
    if(!isFinite(v.sol.psi)) p.push('<text class="wp-ask" x="' + (BX + BW / 2) + '" y="' + (TOP + 16) + '" text-anchor="middle">ψ ?</text>');
    p.push('<text class="tick" x="' + (CX + CW / 2) + '" y="' + (BOT + 18) + '" text-anchor="middle">' + esc(c.label) + '</text>');
    p.push('<text class="tick" x="' + (BX + BW / 2) + '" y="' + (BOT + 18) + '" text-anchor="middle">' + esc('Beaker: ' + v.sol.name) + '</text>');
    // the net flow
    var mid = (TOP + BOT) / 2, x1 = CX + CW + 6, x2 = BX - 10, d = v.dir;
    if(d === 0 || d === 1){
      var from = d === 0 ? x2 : x1, to = d === 0 ? x1 : x2, s = d === 0 ? 1 : -1;
      p.push('<path class="wp-flow' + (v.dirMine ? ' mine' : '') + '" d="M' + from + ' ' + (mid - 7) + 'H' + (to + s * 14) + 'V' + (mid - 15) + 'L' + to + ' ' + mid + 'L' + (to + s * 14) + ' ' + (mid + 15) + 'V' + (mid + 7) + 'H' + from + 'Z"/>');
      p.push('<text class="wp-v" x="' + ((x1 + x2) / 2) + '" y="' + (mid - 20) + '" text-anchor="middle">water</text>');
    } else if(d === 2) p.push('<text class="wp-v" x="' + ((x1 + x2) / 2) + '" y="' + (mid + 4) + '" text-anchor="middle">⇄</text><text class="sk-ph" x="' + ((x1 + x2) / 2) + '" y="' + (mid + 20) + '" text-anchor="middle">no net</text>');
    return '<svg class="bio-svg wp-fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(v.aria) + '">' + p.join('') + '</svg>';
  }
  function scaleLo(vals){ var low = Math.min.apply(null, [-2].concat(vals.filter(isFinite).map(function(x){ return Math.max(x, -40); }))); return -T.niceMax(-low * 1.15); }
  function key(){ return '<p class="wp-key"><span><i class="wp-k suc"></i>sucrose or glucose (i = 1)</span><span><i class="wp-k na"></i><i class="wp-k cl"></i>Na⁺ and Cl⁻ (NaCl, i = 2)</span><span><i class="wp-k lvl"></i>ψ level</span></p>'; }

  /* ------------------------------------------------------- explore */
  var SOLUTES = [{ v: 'sucrose', i: 1 }, { v: 'NaCl', i: 2 }];
  function explore(app){
    var sec = S.card(app, { title: 'Set the solutions, watch the water move', lead: 'ψs = −iCRT: more dissolved particles mean a more negative solute potential. ψ = ψs + ψp: turgor pressure raises the cell’s ψ. Water runs from the higher level to the lower one.' });
    sec.insertAdjacentHTML('beforeend', '<div class="sk-fig wp-xfig"></div>' + key() + '<div class="bt-controls wp-ctl"></div><div class="wp-more"><h3 class="ls-h">Cell sap and temperature</h3></div><div class="sk-out"></div><p class="wp-work"></p><p class="sk-say" role="status" aria-live="polite"></p><div class="sk-goalhost"></div>');
    var fig = sec.querySelector('.wp-xfig'), out = sec.querySelector('.sk-out'), work = sec.querySelector('.wp-work'), sayEl = sec.querySelector('.sk-say'), ctl = sec.querySelector('.wp-ctl');
    var st = { cC: 0.4, psiP: 2, sC: 0.2, sol: 'sucrose', T: 22 };
    var done = S.goals(sec.querySelector('.sk-goalhost'), [
      { id: 'plasmo', text: 'Make water leave the cell until its membrane pulls away from the wall (plasmolysis).' },
      { id: 'equal', text: 'Find a beaker concentration where there is <b>no net movement</b> (levels within 0.2 bar).' },
      { id: 'nacl', text: 'Switch the beaker to NaCl: how does ψs change at the same concentration, and why?' }
    ]);
    var sC = T.slider({ label: 'Beaker concentration', min: 0, max: 1, step: 0.05, value: st.sC, unit: 'M', decimals: 2, onInput: function(x){ st.sC = x; set('sC'); } });
    var cC = T.slider({ label: 'Cell sap concentration (as sucrose)', min: 0.05, max: 1, step: 0.05, value: st.cC, unit: 'M', decimals: 2, onInput: function(x){ st.cC = x; set('cC'); } });
    var pp = T.slider({ label: 'Cell turgor pressure (ψp)', min: 0, max: 6, step: 0.5, value: st.psiP, unit: 'bar', decimals: 1, onInput: function(x){ st.psiP = x; set('pp'); } });
    var sol = T.choiceSelect({ label: 'Beaker solute', value: st.sol, options: SOLUTES.map(function(s){ return { value: s.v, label: s.v === 'NaCl' ? 'NaCl (i = 2)' : 'Sucrose (i = 1)' }; }), onChange: function(x){ st.sol = x; set('sol'); } });
    var tt = T.slider({ label: 'Temperature', min: 0, max: 40, step: 1, value: st.T, unit: '°C', decimals: 0, onInput: function(x){ st.T = x; set('T'); } });
    // The beaker and the turgor in the dock (the three goals need only these); the cell sap and the temperature under Details.
    [sC.el, sol.el, pp.el].forEach(function(e){ ctl.appendChild(e); });
    [cC.el, tt.el].forEach(function(e){ sec.querySelector('.wp-more').appendChild(e); });
    function calc(){
      var si = st.sol === 'NaCl' ? 2 : 1, cS = M.psiS(1, st.cC, st.T), cPsi = cS + st.psiP, sS = M.psiS(si, st.sC, st.T);
      var dir = Math.abs(sS - cPsi) < 0.2 ? 2 : sS > cPsi ? 0 : 1;
      return { si: si, cS: cS, cPsi: cPsi, sS: sS, dir: dir };
    }
    function set(what){
      var r = calc(), K = st.T + M.K0, gap = r.sS - r.cPsi;
      // how far the cell swells or shrinks: by the ψ gap, capped; plasmolysis once water leaves and ψp is gone
      var swell = r.dir === 2 ? 0 : Math.max(-1, Math.min(1, gap / 8));
      if(r.dir === 1 && st.psiP === 0) swell = Math.min(swell, -0.35);
      var lo = scaleLo([r.cPsi, r.sS, r.cS]);
      S.redraw(fig, draw({ scaleLo: lo, swell: swell, dir: r.dir,
        cell: { psi: r.cPsi, i: 1, C: st.cC, label: 'Plant cell' }, sol: { psi: r.sS, i: r.si, C: st.sC, name: st.sol },
        aria: 'Plant cell ψ ' + F(r.cPsi, 2) + ' bar beside a beaker of ' + F(st.sC, 2) + ' M ' + st.sol + ' at ψ ' + F(r.sS, 2) + ' bar. ' + (r.dir === 0 ? 'Water moves into the cell.' : r.dir === 1 ? 'Water moves out of the cell.' : 'No net movement.') }));
      out.innerHTML = S.readout([['Cell ψs', F(r.cS, 2) + ' bar'], ['Cell ψ', F(r.cPsi, 2) + ' bar'], ['Beaker ψ', F(r.sS, 2) + ' bar'], ['Water moves', r.dir === 0 ? 'into the cell' : r.dir === 1 ? 'out of the cell' : 'no net movement']]);
      work.innerHTML = '<b>Cell:</b> ψs = −(1)(' + F(st.cC, 2) + ')(0.0831)(' + K + ') = ' + F(r.cS, 2) + ' bar; ψ = ' + F(r.cS, 2) + ' + ' + F(st.psiP, 1) + ' = <b>' + F(r.cPsi, 2) + ' bar</b>. ' +
        '<b>Beaker:</b> ψ = ψs = −(' + r.si + ')(' + F(st.sC, 2) + ')(0.0831)(' + K + ') = <b>' + F(r.sS, 2) + ' bar</b> (open beaker, ψp = 0).';
      var msg = r.dir === 2 ? 'The levels match: equal ψ, so water moves both ways at the same rate and there is no net movement.'
        : r.dir === 0 ? 'The beaker’s level is higher (less negative), so water runs downhill into the cell. The cell swells and presses on its wall: turgor rises.'
        : 'The cell’s level is higher, so water runs out of it into the beaker.' + (st.psiP === 0 ? ' With no turgor left, the membrane pulls away from the wall: plasmolysis.' : ' As it loses water, its turgor pressure would fall.');
      if(what === 'sol' && st.sol === 'NaCl') msg = 'NaCl splits into Na⁺ and Cl⁻, so i = 2: twice the particles of sucrose at the same concentration, and twice as negative a ψs (' + F(r.sS, 2) + ' bar). ' + msg;
      if(what === 'T') msg = 'Temperature is in T (kelvins): ' + st.T + ' °C + 273 = ' + K + ' K. A warmer solution has a slightly more negative ψs. ' + msg;
      sayEl.textContent = msg;
      if(r.dir === 1 && st.psiP === 0) done('plasmo');
      if(Math.abs(gap) < 0.2) done('equal');
      if(st.sol === 'NaCl') done('nacl');
    }
    set('');
  }

  /* ---------------------------------------------------- practice stage */
  function stage(host, s){
    var x = s.input, a = s.answers || {}, chk = s.phase === 'checked', zero = x.mode === 'zero';
    var tc = x.T, sS = M.psiS(x.sol.i, x.sol.C, tc), cPsi = zero ? sS : M.psiS(x.cell.i, x.cell.C, tc) + x.cell.psiP;
    var mineC = S.num(zero ? a['psi-tissue'] : a['psi-cell']), mineS = S.num(a['psi-sol']);
    var vC = chk ? cPsi : mineC, vS = chk ? sS : mineS;
    var dir = chk ? (zero ? 2 : Math.abs(sS - cPsi) < 0.005 ? 2 : sS > cPsi ? 0 : 1) : zero ? null : (a.direction == null ? null : a.direction);
    var swell = dir === 0 ? 0.5 : dir === 1 ? -0.5 : 0;
    var lo = scaleLo([cPsi, sS, mineC, mineS]);
    var svg = draw({ scaleLo: lo, swell: chk ? swell : 0, dir: dir, dirMine: !chk,
      cell: { psi: vC, i: zero ? 1 : x.cell.i, C: zero ? x.sol.C : x.cell.C, mine: !chk, label: zero ? 'Potato tissue' : 'Plant cell' },
      sol: { psi: vS, i: x.sol.i, C: x.sol.C, name: x.sol.name, mine: !chk },
      aria: (zero ? 'Tissue' : 'Cell') + ' and beaker drawn on a water potential scale.' + (isFinite(vC) ? ' ' + (zero ? 'Tissue' : 'Cell') + ' ψ ' + F(vC, 2) + ' bar.' : '') + (isFinite(vS) ? ' Beaker ψ ' + F(vS, 2) + ' bar.' : '') + (dir === 0 ? ' Water moves into the cell.' : dir === 1 ? ' Water moves out of the cell.' : dir === 2 ? ' No net movement.' : '') });
    var cap;
    if(chk) cap = zero ? 'No mass change means no net water movement, so the tissue’s ψ equals the solution’s: both levels sit at ' + F(sS, 2) + ' bar.'
      : dir === 2 ? 'The two levels match: equal ψ, so no net movement.'
      : 'Water runs “downhill”, from the higher level (less negative ψ, ' + F(Math.max(sS, cPsi), 2) + ' bar) to the lower one (' + F(Math.min(sS, cPsi), 2) + ' bar): ' + (dir === 0 ? 'into the cell' : 'out of the cell') + '.' + (!zero && x.cell.psiP > 0 ? ' The cell’s pressure potential (+' + F(x.cell.psiP, 1) + ' bar) raises its level.' : '');
    else if(isFinite(vC) && isFinite(vS)) cap = 'Each dashed level sits at the ψ you typed. Water moves from the higher level to the lower one' + (zero ? '.' : a.direction != null ? ': does your arrow run downhill?' : '. Now pick the direction.');
    else cap = 'The particles show what is dissolved' + (x.sol.i === 2 ? ' (NaCl splits into two ions: i = 2)' : '') + '. Type each ψ and a level line marks it on the shared scale.';
    S.redraw(host, '<div class="sk-fig">' + svg + '</div>' + key() + '<p class="sk-cap">' + cap + ' <a href="osmosis.html">See it in the osmosis simulator</a>.</p>');
  }

  T.mount('water-potential', function(app, data){
    explore(app);
    T.skillTool(app, data, { slug: 'water-potential', kind: 'wp', stage: function(host, s){ host.classList.add('wp-pin'); stage(host, s); } });
  }, {
    // Tool Studio (docs/tools-calm.md; bio-tools.js studioArrange)
    studio: { dock: ['.wp-ctl'], stageAlso: ['.wp-key'], why: ['.wp-work'], hint: { target: '.ls-dock input[type=range]', text: 'Slide the beaker concentration' },
      caption: function(g){ return g.live ? T.esc(T.firstSentence(g.live)) : ''; },
      pills: function(g){ return [{ k: 'Cell ψ', html: g.ro(1), tone: 'readout' }]; },
      pillsR: function(g){ return [{ html: 'Beaker ψ ' + g.ro(2), tone: 'ghost' }]; } } });
})();
