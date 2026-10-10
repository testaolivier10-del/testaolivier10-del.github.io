/* Skills tool: Simpson’s diversity index. The solver and the seeded problem generator are
   ApBioProblems.solve.simpson and generate.simpson (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/simpson-diversity.json); the page is ApBioTools.skillTool.

   The picture: a quadrat with one icon per organism (each species its own
   color and shape, placed at a fixed seeded spot) and a D meter from 0 to 1
   (ApBioMath.simpson), each species' (n/N)² shown as the share of the meter
   it "uses up".
     Explore: −/+ per species, a species added or removed; goals include
     "raise D with the same N" (evenness) and "add a species" (richness).
     Practice: the problem's community in the quadrat; the meter shows the
     student's typed D, and the true D after Check. */
(function(){
  'use strict';
  var T = window.ApBioTools, S = window.ApBioSkillStage, M = window.ApBioMath;
  if(!T || !S) return;
  var F = T.F, esc = T.esc;
  var SH = ['c', 'q', 't', 'd', 'h', 'p', 'r', 's'];   // circle, square, triangle, diamond, hexagon, pentagon, ring, star
  var CL = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];
  var QW = 260, QH = 260, QX = 8, QY = 8;

  function icon(k, x, y, r){
    var c = 'sd-i ' + CL[k % 8], s = SH[k % 8];
    if(s === 'c') return '<circle class="' + c + '" cx="' + x + '" cy="' + y + '" r="' + r + '"/>';
    if(s === 'q') return '<rect class="' + c + '" x="' + (x - r) + '" y="' + (y - r) + '" width="' + 2 * r + '" height="' + 2 * r + '" rx="1.5"/>';
    if(s === 'r') return '<circle class="' + c + ' ring" cx="' + x + '" cy="' + y + '" r="' + (r - 1) + '"/>';
    var n = { t: 3, d: 4, h: 6, p: 5, s: 10 }[s], pts = [];
    for(var i = 0; i < n; i++){ var a = -Math.PI / 2 + i * 2 * Math.PI / n, rr = s === 's' && i % 2 ? r * 0.45 : r * (s === 't' ? 1.2 : 1.05); pts.push((x + rr * Math.cos(a)).toFixed(1) + ',' + (y + rr * Math.sin(a)).toFixed(1)); }
    return '<polygon class="' + c + '" points="' + pts.join(' ') + '"/>';
  }
  /* Fixed jittered grid spots, shuffled by a seed: the same community
     always looks the same, and adding one organism only adds one icon. */
  var spots = null;
  function grid(){
    if(spots) return spots;
    var r = M.rng(7), out = [], cols = 16, rows = 16, cw = QW / cols, ch = QH / rows;
    for(var i = 0; i < rows; i++) for(var j = 0; j < cols; j++) out.push([QX + (j + 0.5) * cw + r.real(-cw * 0.22, cw * 0.22), QY + (i + 0.5) * ch + r.real(-ch * 0.22, ch * 0.22)]);
    spots = r.shuffle(out);
    return spots;
  }
  function quadrat(counts){
    var g = grid(), N = M.sum(counts), r = N > 160 ? 4.6 : N > 90 ? 5.6 : 6.6, h = ['<rect class="sd-q" x="' + QX + '" y="' + QY + '" width="' + QW + '" height="' + QH + '" rx="6"/>'], k = 0;
    // interleave species so each is scattered: species by organism index
    var order = [];
    var left = counts.slice();
    while(order.length < Math.min(N, g.length)){ for(var s = 0; s < left.length; s++) if(left[s] > 0){ order.push(s); left[s]--; } }
    order.forEach(function(sp, i){ h.push(icon(sp, +g[i][0].toFixed(1), +g[i][1].toFixed(1), r)); });
    if(N > g.length) h.push('<text class="sk-ph" x="' + (QX + 4) + '" y="' + (QY + QH + 14) + '">' + g.length + ' of ' + N + ' shown</text>');
    return h.join('');
  }
  /* D meter: a vertical bar from 0 (bottom) to 1; Σ(n/N)² stacked from the
     top by species, D is what is left. */
  function meter(counts, Dtrue, Dmine){
    var x = QX + QW + 34, y0 = QY, hh = QH, w = 30, h = [], s = M.sum(counts) ? M.simpson(counts) : null;  // zero counts give zero squares, so colors stay with their species
    h.push('<rect class="sd-mbg" x="' + x + '" y="' + y0 + '" width="' + w + '" height="' + hh + '" rx="4"/>');
    if(Dtrue != null && s){
      var yy = y0;
      s.squares.forEach(function(q, k){ var hgt = q * hh; if(hgt > 0.3) h.push('<rect class="sd-i ' + CL[k % 8] + ' sd-sq" x="' + x + '" y="' + yy.toFixed(1) + '" width="' + w + '" height="' + hgt.toFixed(1) + '"/>'); yy += hgt; });
      h.push('<rect class="sd-D" x="' + x + '" y="' + yy.toFixed(1) + '" width="' + w + '" height="' + (y0 + hh - yy).toFixed(1) + '"/>');
      h.push('<line class="sd-lev" x1="' + (x - 6) + '" x2="' + (x + w + 6) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/><text class="sd-Dl" x="' + (x + w + 9) + '" y="' + (yy + 5).toFixed(1) + '">D = ' + F(Dtrue, 2) + '</text>');
    }
    if(Dmine != null && isFinite(Dmine)){ var ym = y0 + (1 - Math.max(0, Math.min(1, Dmine))) * hh; h.push('<line class="sd-lev mine" x1="' + (x - 8) + '" x2="' + (x + w + 8) + '" y1="' + ym.toFixed(1) + '" y2="' + ym.toFixed(1) + '"/><text class="sd-Dl mine" x="' + (x + w + 9) + '" y="' + (ym + (Dtrue != null && Math.abs(ym - (y0 + (1 - Dtrue) * hh)) < 16 ? 18 : 5)).toFixed(1) + '">your D ' + F(Dmine, 2) + '</text>'); }
    [0, 0.5, 1].forEach(function(v){ h.push('<text class="tick" x="' + (x - 8) + '" y="' + (y0 + (1 - v) * hh + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>'); });
    h.push('<text class="sk-ph" x="' + (x + w / 2) + '" y="' + (y0 + hh + 16) + '" text-anchor="middle">D</text>');
    return h.join('');
  }

  /* ------------------------------------------------------- explore */
  function explore(app, data){
    var ctx = data.contexts[0], names = ctx.species.slice(0, 6);
    var sec = S.card(app, { title: 'Build a community, watch D', lead: 'Each icon is one tree in a woodland quadrat. Add or remove trees and watch Simpson’s D. On the meter, each species’ colored block is its (n/N)²; D = 1 minus all of them.' });
    sec.insertAdjacentHTML('beforeend', '<div class="sk-fig sd-fig"></div><div class="sd-rows" role="group" aria-label="Number of each species"></div><div class="sk-out"></div><p class="sk-say" role="status" aria-live="polite"></p><div class="bt-buttons"><button type="button" class="bt-btn sd-even">Even it out (same N)</button><button type="button" class="bt-btn sd-reset">Reset</button></div><div class="sk-goalhost"></div>');
    var fig = sec.querySelector('.sd-fig'), rows = sec.querySelector('.sd-rows'), out = sec.querySelector('.sk-out'), sayEl = sec.querySelector('.sk-say');
    var START = [28, 6, 3, 3, 0, 0], counts = START.slice(), N0 = M.sum(START), D0 = M.simpson(START.filter(Boolean)).D;
    var done = S.goals(sec.querySelector('.sk-goalhost'), [
      { id: 'evenN', text: 'Raise D while keeping <b>N = ' + N0 + '</b>: move trees from one species to others (evenness).' },
      { id: 'rich', text: 'Add a <b>new species</b>: D rises (richness).' },
      { id: 'mono', text: 'Remove every species but one: D falls to 0.' },
      { id: 'high', text: 'Get D above 0.80.' }
    ]);
    function present(){ return counts.filter(function(n){ return n > 0; }); }
    function render(){
      var c = present(), s = c.length ? M.simpson(c) : null, D = s ? s.D : 0;
      S.redraw(fig, '<svg class="bio-svg" viewBox="0 0 400 290" role="img" aria-label="' + esc('Quadrat with ' + counts.map(function(n, k){ return n + ' ' + names[k]; }).filter(function(t){ return !/^0 /.test(t); }).join(', ') + '. D = ' + F(D, 2) + '.') + '">' + quadrat(counts) + meter(counts, D, null) + '</svg>');
      rows.innerHTML = names.map(function(nm, k){ return '<span class="sk-stp"><svg class="sd-sw" viewBox="0 0 20 20" aria-hidden="true">' + icon(k, 10, 10, 6.5) + '</svg><span class="sk-stpn">' + esc(nm) + '</span><button type="button" class="bt-step" data-i="' + k + '" data-d="-1" aria-label="One fewer ' + esc(nm) + '">−</button><b>' + counts[k] + '</b><button type="button" class="bt-step" data-i="' + k + '" data-d="1" aria-label="One more ' + esc(nm) + '">+</button></span>'; }).join('');
      out.innerHTML = S.readout([['Species', String(c.length)], ['N', String(M.sum(counts))], ['Σ(n/N)²', s ? F(s.sumSq, 3) : '–'], ['D', F(D, 2)]]);
      return { D: D, N: M.sum(counts), k: c.length };
    }
    function after(before, what){
      var r = render(), msg = what + ' N = ' + r.N + ', ' + r.k + ' species, D = ' + F(r.D, 2) + (r.D > before.D + 0.005 ? ' (up).' : r.D < before.D - 0.005 ? ' (down).' : '.');
      if(r.k === 1){ msg += ' One species only: any two organisms picked are the same species, so D = 0.'; done('mono'); }
      else if(r.k > before.k){ msg += ' A new species adds richness.'; done('rich'); }
      else if(r.N === N0 && r.D > D0 + 0.01 && r.k === before.k){ msg += ' Same N and same species, but more even: D rose from ' + F(D0, 2) + '. Evenness counts as much as richness.'; done('evenN'); }
      if(r.D > 0.8) done('high');
      sayEl.textContent = msg;
    }
    rows.addEventListener('click', function(e){
      var b = e.target.closest('button'); if(!b) return;
      var i = +b.getAttribute('data-i'), d = +b.getAttribute('data-d'), c = present(), before = { D: c.length ? M.simpson(c).D : 0, k: c.length };
      if(d < 0 && counts[i] === 0) return;
      if(d < 0 && M.sum(counts) === 1){ sayEl.textContent = 'Keep at least one organism.'; return; }
      if(d > 0 && M.sum(counts) >= 200){ sayEl.textContent = 'The quadrat is full.'; return; }
      counts[i] += d;
      after(before, (d > 0 ? 'One more ' : 'One fewer ') + names[i] + '.');
      var f = rows.querySelector('button[data-i="' + i + '"][data-d="' + d + '"]'); if(f) f.focus();
    });
    sec.querySelector('.sd-even').addEventListener('click', function(){
      var c = present(), before = { D: M.simpson(c).D, k: c.length }, idx = []; counts.forEach(function(n, k){ if(n > 0) idx.push(k); });
      var share = M.apportion(idx.map(function(){ return 1 / idx.length; }), M.sum(counts));
      idx.forEach(function(k, j){ counts[k] = share[j]; });
      after(before, 'Same trees, shared out evenly among the ' + idx.length + ' species.');
    });
    sec.querySelector('.sd-reset').addEventListener('click', function(){ counts = START.slice(); render(); sayEl.textContent = 'Back to the start: one species dominates.'; });
    render();
  }

  /* ---------------------------------------------------- practice stage */
  function stage(host, s){
    var x = s.input, a = s.answers || {}, chk = s.phase === 'checked', counts = x.species.map(function(sp){ return sp.n; }), sim = M.simpson(counts);
    var Dm = S.num(a.D);
    var svg = '<svg class="bio-svg" viewBox="0 0 400 290" role="img" aria-label="' + esc('Quadrat with ' + x.species.map(function(sp){ return sp.n + ' ' + sp.name; }).join(', ') + '.' + (chk ? ' D = ' + F(sim.D, 2) + '.' : '')) + '">' + quadrat(counts) + meter(counts, chk ? sim.D : null, isFinite(Dm) ? Dm : null) + '</svg>';
    var big = 0; counts.forEach(function(n, k){ if(n > counts[big]) big = k; });
    var cap = chk ? 'The colored blocks on the meter are each species’ (n/N)²; D is the white part left over. ' + esc(x.species[big].name) + ' has the biggest block: the more one species dominates, the lower D.'
      : isFinite(Dm) ? 'Your D is marked on the meter. Does it fit the picture? A quadrat dominated by one species should score low; an even mix of many species, high.'
      : 'One icon per organism counted (each species its own shape). Before you calculate: does this look diverse? Type D and it is marked on the meter.';
    var key = '<p class="sd-key">' + x.species.map(function(sp, k){ return '<span><svg class="sd-sw" viewBox="0 0 20 20" aria-hidden="true">' + icon(k, 10, 10, 6.5) + '</svg>' + esc(sp.name) + ' ' + sp.n + '</span>'; }).join('') + '</p>';
    S.redraw(host, '<div class="sk-fig">' + svg + '</div>' + key + '<p class="sk-cap">' + cap + '</p>');
  }

  T.mount('simpson-diversity', function(app, data){
    explore(app, data);
    T.skillTool(app, data, { slug: 'simpson-diversity', kind: 'simpson', stage: stage });
  });
})();
