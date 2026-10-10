/* Skills tool: Hardy-Weinberg allele and genotype frequencies. The solver and the seeded problem generator are
   ApBioProblems.solve.hw and generate.hw (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/hardy-weinberg.json); the page is ApBioTools.skillTool.

   The picture: a gamete Punnett square whose sides are split at p and q,
   so its cells' areas are p², pq, pq and q² (ApBioMath.hwRecessive gives
   the frequencies), beside a population of individuals shaped by genotype
   (circle AA, dotted circle Aa, square aa; ApBioMath.apportion rounds the
   frequencies to whole individuals).
     Explore: drag the square's corner (or the p slider); the cells, the
     population and the readout follow. Targets in "Try this".
     Practice: the problem's individuals (counts mode), or the affected and
     the "can't tell" rest (recessive mode); the square is split at the p
     (or 1 − q) the student types, and at the true p after Check. */
(function(){
  'use strict';
  var T = window.ApBioTools, S = window.ApBioSkillStage, M = window.ApBioMath;
  if(!T || !S) return;
  var F = T.F, esc = T.esc;

  /* The square: side Z at (X0, Y0), split at p. */
  var Z = 200, X0 = 34, Y0 = 38, R = 7.2, GAP = 17, PX = 254, PY = 46;
  function square(p, o){
    o = o || {};
    var q = 1 - p, s = Z * p, h = [], A = o.A || 'A', a = o.a || 'a';
    function cell(x, y, w, hh, cls, lab, f){
      h.push('<rect class="hw-cell ' + cls + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(0, w).toFixed(1) + '" height="' + Math.max(0, hh).toFixed(1) + '"/>');
      if(w > 40 && hh > 30) h.push('<text class="hw-cl" x="' + (x + w / 2).toFixed(1) + '" y="' + (y + hh / 2 - 2).toFixed(1) + '" text-anchor="middle">' + esc(lab) + '</text><text class="hw-cv" x="' + (x + w / 2).toFixed(1) + '" y="' + (y + hh / 2 + 13).toFixed(1) + '" text-anchor="middle">' + F(f, 3) + '</text>');
    }
    cell(X0, Y0, s, s, 'g0', A + A, p * p);
    cell(X0 + s, Y0, Z - s, s, 'g1', A + a, p * q);
    cell(X0, Y0 + s, s, Z - s, 'g1', A + a, p * q);
    cell(X0 + s, Y0 + s, Z - s, Z - s, 'g2', a + a, q * q);
    h.push('<rect class="hw-frame" x="' + X0 + '" y="' + Y0 + '" width="' + Z + '" height="' + Z + '"/>');
    // gametes on the edges: an egg (round, with a nucleus) over each column, a sperm beside each row
    var egg = function(x, y){ return '<g class="hw-gam egg"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6"/><circle class="n" cx="' + (x + 1).toFixed(1) + '" cy="' + (y - 1).toFixed(1) + '" r="2"/></g>'; };
    var sperm = function(x, y){ return '<g class="hw-gam sperm"><ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="3.2" ry="4.4"/><path d="M' + x.toFixed(1) + ' ' + (y + 4.4).toFixed(1) + 'q-3 4 0 7t0 7"/></g>'; };
    if(s > 24) h.push(egg(X0 + s / 2 - 22, Y0 - 12) + '<text class="sk-ph" x="' + (X0 + s / 2 + 4).toFixed(1) + '" y="' + (Y0 - 8) + '" text-anchor="middle">' + esc(A) + ': p</text>');
    if(Z - s > 24) h.push((Z - s > 56 ? egg(X0 + s + (Z - s) / 2 - 22, Y0 - 12) : '') + '<text class="sk-ph" x="' + (X0 + s + (Z - s) / 2 + (Z - s > 56 ? 4 : 0)).toFixed(1) + '" y="' + (Y0 - 8) + '" text-anchor="middle">' + esc(a) + ': q</text>');
    if(s > 50) h.push(sperm(X0 - 10, Y0 + s / 2 - 34));
    if(Z - s > 50) h.push(sperm(X0 - 10, Y0 + s + (Z - s) / 2 - 34));
    if(s > 24) h.push('<text class="sk-ph" transform="translate(' + (X0 - 10) + ' ' + (Y0 + s / 2).toFixed(1) + ') rotate(-90)" text-anchor="middle">' + esc(A) + ': p</text>');
    if(Z - s > 24) h.push('<text class="sk-ph" transform="translate(' + (X0 - 10) + ' ' + (Y0 + s + (Z - s) / 2).toFixed(1) + ') rotate(-90)" text-anchor="middle">' + esc(a) + ': q</text>');
    h.push('<text class="sk-ph sk-dim" x="' + (X0 + Z / 2) + '" y="' + (Y0 + Z + 18) + '" text-anchor="middle">eggs across, sperm down</text>');
    if(o.drag){
      h.push('<line class="hw-split" x1="' + (X0 + s).toFixed(1) + '" x2="' + (X0 + s).toFixed(1) + '" y1="' + Y0 + '" y2="' + (Y0 + Z) + '"/><line class="hw-split" y1="' + (Y0 + s).toFixed(1) + '" y2="' + (Y0 + s).toFixed(1) + '" x1="' + X0 + '" x2="' + (X0 + Z) + '"/>');
      h.push('<rect class="sk-col" data-k="p" x="' + X0 + '" y="' + Y0 + '" width="' + Z + '" height="' + Z + '"/>');
      h.push('<circle class="sk-grip" data-k="p" tabindex="0" role="slider" aria-label="p, the frequency of allele A" aria-valuemin="0" aria-valuemax="1" aria-valuenow="' + F(p, 2) + '" aria-valuetext="p = ' + F(p, 2) + ', q = ' + F(q, 2) + '" cx="' + (X0 + s).toFixed(1) + '" cy="' + (Y0 + s).toFixed(1) + '" r="10"/>');
    }
    return h.join('');
  }
  function ind(g, k){
    var cx = PX + (k % 10) * GAP + R, cy = PY + Math.floor(k / 10) * GAP + R;
    if(g === 2) return '<rect class="hw-ind g2" x="' + (cx - R + 0.6).toFixed(1) + '" y="' + (cy - R + 0.6).toFixed(1) + '" width="' + (2 * R - 1.2).toFixed(1) + '" height="' + (2 * R - 1.2).toFixed(1) + '" rx="2"/>';
    return '<circle class="hw-ind ' + (g === 1 ? 'g1' : g === 0 ? 'g0' : 'unk') + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + R + '"/>' + (g === 1 ? '<circle class="hw-dot" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="2.6"/>' : '');
  }
  /* Up to 100 individuals in rows of 10: genotype g per entry of counts
     (index 3 = "AA or Aa", unknown). */
  function people(counts, title){
    var tot = M.sum(counts), show = tot > 100 ? M.apportion(counts.map(function(c){ return c / tot; }), 100) : counts, h = [], k = 0;
    [0, 1, 3, 2].forEach(function(g){ for(var i = 0; i < (show[g] || 0); i++) h.push(ind(g, k++)); });
    h.push('<text class="sk-ph" x="' + PX + '" y="' + (PY - 8) + '">' + esc(title || (tot > 100 ? '100 of ' + tot + ', in proportion' : tot + ' individuals')) + '</text>');
    return h.join('');
  }
  function key(A, a, unk){
    return '<p class="hw-key"><span><i class="hw-k g0"></i>' + A + A + '</span><span><i class="hw-k g1"></i>' + A + a + ' (carrier)</span><span><i class="hw-k g2 sq"></i>' + a + a + ' (shows the recessive trait)</span>' + (unk ? '<span><i class="hw-k unk"></i>' + A + A + ' or ' + A + a + ': looks the same</span>' : '') + '</p>';
  }
  function plain(s){ return String(s).replace(/<sup>(.*?)<\/sup>/g, '$1').replace(/<[^>]+>/g, ''); }

  /* ------------------------------------------------------- explore */
  function explore(app){
    var sec = S.card(app, { title: 'Drag p, watch the population', lead: 'The square’s sides are the gametes: a share p carry A, the rest (q) carry a. Each cell’s <b>area</b> is a genotype’s frequency. Drag the corner.' });
    sec.insertAdjacentHTML('beforeend', '<div class="sk-fig sk-drag hw-fig"></div>' + key('A', 'a') + '<div class="hw-sl"></div><div class="sk-out"></div><p class="sk-say" role="status" aria-live="polite"></p><div class="sk-goalhost"></div>');
    var fig = sec.querySelector('.hw-fig'), out = sec.querySelector('.sk-out'), sayEl = sec.querySelector('.sk-say');
    var p = 0.7;
    var done = S.goals(sec.querySelector('.sk-goalhost'), [
      { id: 'q16', text: 'Set p so that <b>16%</b> of the population shows the recessive trait.' },
      { id: 'het', text: 'Find the p that gives the <b>most carriers</b> (2pq at its largest).' },
      { id: 'rare', text: 'Make the recessive trait rare (1% or less) and count the carriers that remain.' }
    ]);
    var sl = T.slider({ label: 'p (frequency of allele A)', min: 0, max: 1, step: 0.01, value: p, decimals: 2, onInput: function(v){ set(v); } });
    sec.querySelector('.hw-sl').appendChild(sl.el);
    function set(v){
      p = Math.max(0, Math.min(1, M.round(v, 2)));
      if(Math.abs(sl.value() - p) > 1e-9) sl.set(p);
      var h = M.hwRecessive((1 - p) * (1 - p)), counts = M.apportion([h.p2, h.pq2, h.q2], 100);
      S.redraw(fig, '<svg class="bio-svg" viewBox="0 0 430 262" role="group" aria-label="Punnett square split at p = ' + F(p, 2) + ', and 100 individuals: ' + counts[0] + ' AA, ' + counts[1] + ' Aa, ' + counts[2] + ' aa.">' + square(p, { drag: true }) + people(counts, 'A population of 100') + '</svg>');
      out.innerHTML = S.readout([['p', F(p, 2)], ['q = 1 − p', F(1 - p, 2)], ['p² (AA)', F(h.p2, 3)], ['2pq (Aa)', F(h.pq2, 3)], ['q² (aa)', F(h.q2, 3)]]);
      var msg = 'p = ' + F(p, 2) + ', q = ' + F(1 - p, 2) + ': ' + counts[0] + ' AA, ' + counts[1] + ' Aa and ' + counts[2] + ' aa in 100. ';
      if(Math.abs(h.q2 - 0.16) < 1e-9){ msg += 'q² = 0.16, so q = √0.16 = 0.4 and p = 0.6. Always start from the recessive phenotype: only aa shows it.'; done('q16'); }
      else if(Math.abs(p - 0.5) < 1e-9){ msg += 'At p = q = 0.5, 2pq = 0.5: the most carriers any population can have at equilibrium.'; done('het'); }
      else if(h.q2 <= 0.01 && h.q2 > 0){ msg += 'Only ' + F(h.q2 * 100, 1) + '% show the trait, but ' + F(h.pq2 * 100, 1) + '% carry it: most copies of a rare allele hide in carriers.'; done('rare'); }
      else if(p === 0 || p === 1) msg += 'One allele is gone (fixed): no variation is left at this gene.';
      else if(h.q2 > 0.16 && h.q2 < 0.2) msg += 'Close: q² is ' + F(h.q2, 3) + '. A little more p.';
      else if(h.q2 < 0.16 && h.q2 > 0.12) msg += 'Close: q² is ' + F(h.q2, 3) + '. A little less p.';
      sayEl.textContent = msg;
    }
    S.drag(fig, '[data-k]', { move: function(k, pt){ set(((pt.x - X0) + (pt.y - Y0)) / 2 / Z); } });
    S.keys(fig, '.sk-grip', function(k, d, big){ set(p + d * (big ? 0.1 : 0.01)); });
    set(p);
  }

  /* ---------------------------------------------------- practice stage */
  function stage(host, s){
    var x = s.input, a = s.answers || {}, chk = s.phase === 'checked', rec = x.mode === 'recessive';
    var A = rec ? 'A' : plain(x.A), al = rec ? 'a' : plain(x.a), pTrue, counts, title = null;
    if(rec){
      var h = M.hwRecessive(x.affected / x.N); pTrue = h.p;
      counts = chk ? M.apportion([h.p2, h.pq2, h.q2], Math.min(100, x.N)) : [0, 0, x.affected, x.N - x.affected];
      title = chk ? 'Expected genotypes in ' + Math.min(100, x.N) : null;
    } else { pTrue = M.hwCounts(x.AA, x.Aa, x.aa).p; counts = [x.AA, x.Aa, x.aa]; }
    var pT = S.num(a.p), qT = S.num(a.q), fromP = pT >= 0 && pT <= 1;
    var pUse = chk ? pTrue : fromP ? pT : qT >= 0 && qT <= 1 ? 1 - qT : null;
    var svg = '<svg class="bio-svg" viewBox="0 0 430 262" role="img" aria-label="' + esc(rec ? x.affected + ' of ' + x.N + ' show the recessive trait.' : x.AA + ' ' + A + A + ', ' + x.Aa + ' ' + A + al + ' and ' + x.aa + ' ' + al + al + ' individuals.') + (pUse != null ? ' Punnett square split at p = ' + F(pUse, 2) + '.' : '') + '">';
    svg += pUse != null ? square(pUse, { A: A, a: al })
      : '<rect class="hw-frame hw-empty" x="' + X0 + '" y="' + Y0 + '" width="' + Z + '" height="' + Z + '"/><text class="sk-ph sk-dim" x="' + (X0 + Z / 2) + '" y="' + (Y0 + Z / 2) + '" text-anchor="middle">Type p or q</text><text class="sk-ph sk-dim" x="' + (X0 + Z / 2) + '" y="' + (Y0 + Z / 2 + 16) + '" text-anchor="middle">to split the square</text>';
    svg += people(counts, title) + '</svg>';
    var cap = chk ? (rec
        ? 'Only the squares (' + al + al + ') can be counted directly, so start from q² = ' + F(x.affected / x.N, 3) + '. The square is split at p = ' + F(pTrue, 2) + ': its two pq cells together are the carriers, 2pq = ' + F(2 * pTrue * (1 - pTrue), 3) + ' of the population.'
        : 'The square is split at the true p = ' + F(pTrue, 2) + '. Its two pq cells add up to 2pq, the heterozygotes expected at equilibrium; compare that with the dotted circles actually counted.')
      : pUse != null ? 'The square is split at your ' + (fromP ? 'p' : '1 − q') + ' = ' + F(pUse, 2) + ': its cells are p², two pq and q².'
      : rec ? 'You can see who shows the trait (squares), but not who is a carrier. Type p or q and the Punnett square splits to match.' : 'Each symbol is one individual. Count alleles: every individual carries two. Type p or q and the square splits to match.';
    S.redraw(host, '<div class="sk-fig">' + svg + '</div>' + key(esc(A), esc(al), rec && !chk) + '<p class="sk-cap">' + cap + '</p>');
  }

  T.mount('hardy-weinberg', function(app, data){
    explore(app);
    T.skillTool(app, data, { slug: 'hardy-weinberg', kind: 'hw', stage: stage });
  });
})();
