/* Skills tool: solute potential and water potential. The solver and the seeded problem generator are
   ApBioProblems.solve.wp and generate.wp (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/water-potential.json); the page is ApBioTools.skillTool.

   The stage: two compartments (the cell and the beaker, or the tissue and
   the beaker) on one shared ψ scale in bar, 0 at the top, more negative
   lower down. Each compartment's water surface sits at its ψ, so "water
   moves from higher to lower ψ" reads as water running downhill. The
   levels follow the values the student types (ψ of the cell, ψ of the
   solution); the arrow appears with the direction they pick, and after
   Check the true levels (ApBioMath.psiS, the solver's answers) and arrow.
   For the full picture with mass change, the page links to the osmosis
   simulator. */
(function(){
  'use strict';
  var T = window.ApBioTools, S = window.ApBioSkillStage, M = window.ApBioMath;
  if(!T || !S) return;
  var F = T.F, esc = T.esc;
  var W = 420, H = 250, TOP = 30, BOT = 200, L = 58;

  function stage(host, s){
    var x = s.input, a = s.answers || {}, chk = s.phase === 'checked', zero = x.mode === 'zero';
    var tc = x.T, sS = M.psiS(x.sol.i, x.sol.C, tc), cPsi = zero ? sS : M.psiS(x.cell.i, x.cell.C, tc) + x.cell.psiP;
    var mineC = S.num(zero ? a['psi-tissue'] : a['psi-cell']), mineS = S.num(a['psi-sol']);
    var vC = chk ? cPsi : mineC, vS = chk ? sS : mineS;
    var low = Math.min(-2, cPsi, sS, isFinite(mineC) ? Math.max(mineC, -40) : 0, isFinite(mineS) ? Math.max(mineS, -40) : 0);
    var lo = -T.niceMax(-low * 1.15), sy = function(v){ return TOP + (Math.min(0, Math.max(lo, v)) / lo) * (BOT - TOP); };
    var p = [], st = T.niceStep(-lo, 5);
    for(var t = 0; t >= lo - 1e-9; t -= st) p.push('<line class="grid" x1="' + L + '" x2="' + (W - 12) + '" y1="' + sy(t).toFixed(1) + '" y2="' + sy(t).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (sy(t) + 4).toFixed(1) + '" text-anchor="end">' + F(M.round(t, 6), Math.max(0, Math.min(3, (String(M.round(st, 6)).split('.')[1] || '').length))) + '</text>');
    p.push('<text class="lbl" transform="translate(14 ' + ((TOP + BOT) / 2) + ') rotate(-90)" text-anchor="middle">ψ (bar)</text>');
    p.push('<text class="sk-ph" x="' + (L + 4) + '" y="' + (TOP - 14) + '">higher ψ (toward 0)</text>');
    var boxes = [{ x: L + 30, w: 120, v: vC, name: zero ? 'Tissue' : 'Cell', real: cPsi, cls: 'cell', mine: !chk }, { x: L + 210, w: 120, v: vS, name: 'Beaker (' + x.sol.name + ')', real: sS, cls: 'sol', mine: !chk }];
    boxes.forEach(function(b){
      p.push('<rect class="wp-tank ' + b.cls + '" x="' + b.x + '" y="' + TOP + '" width="' + b.w + '" height="' + (BOT - TOP) + '" rx="' + (b.cls === 'cell' ? 22 : 4) + '"/>');
      if(isFinite(b.v)){
        var y = sy(b.v);
        var ins = b.cls === 'cell' ? 6 : 2, wy = Math.min(y, BOT - 8);
        p.push('<rect class="wp-water" x="' + (b.x + ins) + '" y="' + wy.toFixed(1) + '" width="' + (b.w - 2 * ins) + '" height="' + Math.max(0, BOT - ins - wy).toFixed(1) + '" rx="' + (b.cls === 'cell' ? 16 : 2) + '"/>');
        p.push('<line class="wp-surf' + (b.mine ? ' mine' : '') + '" x1="' + (b.x - 6) + '" x2="' + (b.x + b.w + 6) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>');
        p.push('<text class="wp-v" x="' + (b.x + b.w / 2) + '" y="' + (y - 7).toFixed(1) + '" text-anchor="middle">' + (b.mine ? 'your ' : '') + 'ψ = ' + F(b.v, 2) + (b.v < lo ? ' ↓' : '') + '</text>');
      } else p.push('<text class="sk-ph sk-dim" x="' + (b.x + b.w / 2) + '" y="' + ((TOP + BOT) / 2) + '" text-anchor="middle">type its ψ</text>');
      p.push('<text class="tick" x="' + (b.x + b.w / 2) + '" y="' + (BOT + 18) + '" text-anchor="middle">' + esc(b.name) + '</text>');
    });
    // the arrow: picked direction (or true after Check)
    var dir = chk ? (Math.abs(sS - cPsi) < 0.005 ? 2 : sS > cPsi ? 0 : 1) : (a.direction == null ? null : a.direction);
    if(zero) dir = chk ? 2 : null;
    var ay = BOT + 34, x1 = L + 150, x2 = L + 210;
    if(dir === 0 || dir === 1){
      var from = dir === 0 ? x2 : x1, to = dir === 0 ? x1 : x2;
      p.push('<line class="wp-arrow' + (chk ? '' : ' mine') + '" x1="' + from + '" x2="' + (to + (dir === 0 ? 10 : -10)) + '" y1="' + ((TOP + BOT) / 2) + '" y2="' + ((TOP + BOT) / 2) + '"/><path class="wp-head' + (chk ? '' : ' mine') + '" d="M' + to + ' ' + ((TOP + BOT) / 2) + ' l' + (dir === 0 ? 12 : -12) + ' -8 v16 z"/>');
      p.push('<text class="wp-v" x="' + ((x1 + x2) / 2) + '" y="' + ((TOP + BOT) / 2 - 12) + '" text-anchor="middle">water</text>');
    } else if(dir === 2) p.push('<text class="wp-v" x="' + ((x1 + x2) / 2) + '" y="' + ((TOP + BOT) / 2) + '" text-anchor="middle">⇄</text><text class="sk-ph" x="' + ((x1 + x2) / 2) + '" y="' + ((TOP + BOT) / 2 + 16) + '" text-anchor="middle">no net</text>');
    var svg = '<svg class="bio-svg wp-fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc((zero ? 'Tissue' : 'Cell') + ' and beaker drawn on a water potential scale.' + (isFinite(vC) ? ' ' + (zero ? 'Tissue' : 'Cell') + ' ψ ' + F(vC, 2) + ' bar.' : '') + (isFinite(vS) ? ' Beaker ψ ' + F(vS, 2) + ' bar.' : '') + (dir === 0 ? ' Water moves into the cell.' : dir === 1 ? ' Water moves out of the cell.' : dir === 2 ? ' No net movement.' : '')) + '">' + p.join('') + '</svg>';
    var cap;
    if(chk) cap = zero ? 'No mass change means no net water movement, so the tissue’s ψ equals the solution’s: both surfaces sit at ' + F(sS, 2) + ' bar.'
      : dir === 2 ? 'The two surfaces are level: equal ψ, so no net movement.'
      : 'Water runs “downhill”, from the higher surface (less negative ψ, ' + F(Math.max(sS, cPsi), 2) + ' bar) to the lower one (' + F(Math.min(sS, cPsi), 2) + ' bar): ' + (dir === 0 ? 'into the cell' : 'out of the cell') + '.' + (!zero && x.cell.psiP > 0 ? ' The cell’s pressure potential (+' + F(x.cell.psiP, 1) + ' bar) raises its surface.' : '');
    else if(isFinite(vC) && isFinite(vS)) cap = 'Each water surface sits at the ψ you typed. Water moves from the higher surface to the lower one' + (a.direction != null ? ': does your arrow run downhill?' : '. Now pick the direction.');
    else cap = 'Both compartments share one ψ scale: 0 at the top, more negative lower down. Type each ψ and its water surface moves to that level.';
    S.redraw(host, '<div class="sk-fig">' + svg + '</div><p class="sk-cap">' + cap + ' <a href="osmosis.html">See it in the osmosis simulator</a>.</p>');
  }

  T.mount('water-potential', function(app, data){
    T.skillTool(app, data, { slug: 'water-potential', kind: 'wp', stage: function(host, s){ host.classList.add('wp-pin'); stage(host, s); } });
  });
})();
