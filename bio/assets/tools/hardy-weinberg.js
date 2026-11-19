/* Hardy-Weinberg, tools v2 (docs/tools-v2-hardy-weinberg-brief.md; the standard: docs/tools-v2-standard.md). On the
   shared kit (assets/course/tool-kit2.js) through the course adapter ApBioTools.studioKit2. The solver and the seeded
   problem generator are ApBioProblems.solve.hw and generate.hw (bio-skill-problems.js); the bed, the targets, the
   contexts and the fixed problems are data (bio/data/tools/hardy-weinberg.json).

   THE ONE IDEA: with nothing acting on a population (random mating above all), the allele frequencies p and q fix
   the genotype frequencies p², 2pq and q².

   EXPLORE: nothing locked, nothing graded, no side panel. The picture is a garden bed of 10 by 10 snapdragons seen
   from the front. Along the back of the bed lie ten pollen grains and down its left side ten eggs, each carrying
   R or W: the gene pool. A plant gets its column's pollen allele and its row's egg allele, and flower colour shows
   incomplete dominance, so every genotype can be seen: RR red, RW pink, WW white. ONE control on the picture: the
   knob on the back board sets p, the share of R among the pollen and among the eggs alike (twine marks the split
   both ways). The bed is then four plots whose areas are p², pq, pq and q², filled with real plants: at once the
   three signs in front of the bed count them. The line under the picture is the CAUSE LINE (K.cause), one colour
   per idea: "p = 0.7 + q = 0.3 → p² = 0.49 + 2pq = 0.42 + q² = 0.09". Every change is seen happening: the allele
   that changed flips, and the change runs down its column and along its row, plant by plant; the signs count the
   plants as drawn and the result pills wait until the bed has settled. Reduced motion: the result at once with a
   short cross fade.
   TEST YOURSELF, one dropdown on the stage:
     "Set the alleles" (the old Explore's "Try this" targets, now checked): the bed is planted but not in bloom;
       set p for the target, then let it bloom. Recorded as hardy-weinberg:target-<id>.
       The targets about a hidden recessive (sp: "pea") use a second bed: pea plants, A purple dominant over a
       white, so AA and Aa look the same; after the bloom two signs (purple, white) and the Aa plot named carriers.
     "Problems" (the calculations: ApBioTools.skillTool, unchanged in content, grading and record ids): new numbers every time or
       the worked set; the figure shows the problem's individuals as pairs of alleles and the gene pool square split
       at the p the student types.
   "?": the numbers behind this setting, every setting in a table, any p to three decimals, the five conditions.
   One colour per idea, everywhere: R, p, p² and RR red; W, q, q² and WW white; RW and 2pq pink. Every value is also
   written, so colour is never the only cue. */
(function(){
  'use strict';
  var SLUG = 'hardy-weinberg';
  var T = window.ApBioTools, S0 = window.ApBioSkillStage, M = window.ApBioMath;
  if(!T || !M) return;
  var F = T.F, esc = T.esc;
  function n1(v){ return (+v).toFixed(1); }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  var GC = ['g0', 'g1', 'g2'];

  /* ------------------------------------------------------------ drawn parts (symbols; origin at the soil) */
  /* Shapes are few on purpose: a hundred plants repaint during a drag (review round 1, must fix 3). A floret is
     drawn without a group or transform: its lip and hood are placed directly. */
  function bloom(x, y, k, side, throat){
    var s = side < 0 ? -1 : 1;
    return '<ellipse class="hw2-lip" cx="' + n1(x + s * 1.6 * k) + '" cy="' + n1(y + 1.8 * k) + '" rx="' + n1(6.6 * k) + '" ry="' + n1(5.2 * k) + '"/><ellipse class="hw2-hood" cx="' + n1(x - s * 0.4 * k) + '" cy="' + n1(y - 2.4 * k) + '" rx="' + n1(5.2 * k) + '" ry="' + n1(4.2 * k) + '"/>' +
      (throat ? '<circle class="hw2-throat" cx="' + n1(x + s * 2.6 * k) + '" cy="' + n1(y + 0.4 * k) + '" r="' + n1(1.5 * k) + '"/>' : '');
  }
  function spike(dx, lean, top, few){
    // one flowering stem: the stem, then florets up it, smaller toward the tip, and a bud
    var h = '<path class="hw2-stem" d="M' + n1(dx) + ' 0C' + n1(dx + lean * 0.3) + ' ' + n1(top * 0.35) + ' ' + n1(dx + lean * 0.8) + ' ' + n1(top * 0.7) + ' ' + n1(dx + lean) + ' ' + n1(top) + '"/>';
    var ys = few ? [0.55, 0.72, 0.88] : [0.5, 0.63, 0.76, 0.89], ks = few ? [1, 0.88, 0.7] : [1, 0.92, 0.8, 0.64];
    for(var i = 0; i < ys.length; i++){ var s = i % 2 ? 1 : -1; h += bloom(dx + lean * ys[i] + s * 4.6 * ks[i], top * ys[i], ks[i], s, !few && i < 2); }
    return h + '<ellipse class="hw2-bud" cx="' + n1(dx + lean) + '" cy="' + n1(top - 1) + '" rx="2.3" ry="3.3"/>';
  }
  /* a pea flower (Pisum: the banner petal above, the wings and keel below) and a pea plant: a climbing stem with
     paired leaflets, a tendril and flowers on short stalks */
  function pflower(x, y, k, side){
    var s = (side < 0 ? -1 : 1) * k, X = function(v){ return n1(x + s * v); }, Y = function(v){ return n1(y + k * v); };
    return '<path class="hw2-ban" d="M' + X(-1) + ' ' + Y(2) + 'C' + X(-7) + ' ' + Y(1) + ' ' + X(-8) + ' ' + Y(-7) + ' ' + X(-2) + ' ' + Y(-8) + 'C' + X(1) + ' ' + Y(-8.5) + ' ' + X(5) + ' ' + Y(-6) + ' ' + X(4) + ' ' + Y(-1) + 'Z"/>' +
      '<path class="hw2-wing" d="M' + X(-2) + ' ' + Y(1) + 'C' + X(0) + ' ' + Y(5) + ' ' + X(5) + ' ' + Y(6) + ' ' + X(7) + ' ' + Y(3) + 'C' + X(6) + ' ' + Y(0) + ' ' + X(2) + ' ' + Y(-1) + ' ' + X(-2) + ' ' + Y(1) + 'Z"/>';
  }
  function peaStem(dx, lean, top, n){
    var h = '<path class="hw2-stem" d="M' + n1(dx) + ' 0C' + n1(dx + lean * 0.3) + ' ' + n1(top * 0.35) + ' ' + n1(dx + lean * 0.8) + ' ' + n1(top * 0.7) + ' ' + n1(dx + lean) + ' ' + n1(top) + '"/>';
    h += '<path class="hw2-tendril" d="M' + n1(dx + lean) + ' ' + n1(top) + 'c3 -3 7 -2 6 2c-1 2 -4 1 -3 -1"/>';
    var ys = n === 3 ? [0.55, 0.72, 0.88] : [0.5, 0.64, 0.78, 0.9], ks = n === 3 ? [1, 0.9, 0.75] : [1, 0.95, 0.85, 0.72];
    for(var i = 0; i < ys.length; i++){ var s = i % 2 ? 1 : -1; h += pflower(dx + lean * ys[i] + s * 5 * ks[i], top * ys[i], ks[i], s); }
    return h;
  }
  function leaf(x, y, w, s){ return '<path class="hw2-leaf" d="M' + n1(x) + ' ' + n1(y) + 'q' + n1(s * w * 0.5) + ' ' + n1(-w * 0.42) + ' ' + n1(s * w) + ' ' + n1(-w * 0.2) + 'q' + n1(-s * w * 0.42) + ' ' + n1(w * 0.42) + ' ' + n1(-s * w) + ' ' + n1(w * 0.2) + 'z"/>'; }
  function leaves(dx){ return leaf(dx, -7, 15, 1) + leaf(dx, -8, 15, -1) + leaf(dx, -16, 13, 1) + leaf(dx, -17, 13, -1) + leaf(dx, -25, 10, 1) + leaf(dx, -26, 10, -1); }
  /* The drawings of a plant, in plant units (the base of the stem at 0 0, about 62 tall). Each is turned into one
     image per genotype and colour scheme (sprites() in the tool), so a plant on the bed is one <use> of one <image>:
     a hundred plants then repaint cheaply during a drag (review round 1, must fix 3). */
  var PLANT = {
    plant1: '<ellipse class="hw2-shade" cx="3" cy="0" rx="13" ry="3.2"/>' + leaves(0) + spike(0, 0, -58),
    plant3: '<ellipse class="hw2-shade" cx="3" cy="0" rx="22" ry="3.6"/>' + leaf(-3, -6, 17, -1) + leaf(3, -6, 17, 1) + leaf(-2, -14, 14, -1) + leaf(2, -14, 14, 1) +
      spike(-3, -15, -46) + spike(3, 15, -46) + leaf(0, -22, 11, 1) + leaf(0, -23, 11, -1) + spike(0, 0, -58),
    pea1: '<ellipse class="hw2-shade" cx="3" cy="0" rx="13" ry="3.2"/>' + leaves(0) + peaStem(0, 0, -58, 4),
    pea3: '<ellipse class="hw2-shade" cx="3" cy="0" rx="22" ry="3.6"/>' + leaf(-3, -6, 17, -1) + leaf(3, -6, 17, 1) + leaf(-2, -14, 14, -1) + leaf(2, -14, 14, 1) +
      peaStem(-3, -15, -46, 3) + peaStem(3, 15, -46, 3) + leaf(0, -22, 11, 1) + leaf(0, -23, 11, -1) + peaStem(0, 0, -58, 4),
    sprout: '<ellipse class="hw2-shade" cx="1" cy="0" rx="7" ry="2.2"/><path class="hw2-stem" d="M0 0V-13"/>' + leaf(0, -9, 11, 1) + leaf(0, -10, 11, -1) + '<ellipse class="hw2-leaf" cx="0" cy="-15" rx="2" ry="3"/>'
  };
  var PBOX = [-34, -68, 68, 76];   // the box every drawing fits in
  var DEFS = '<defs>' +
    '<linearGradient id="hw2g-lawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="hw2s-la0"/><stop offset="1" class="hw2s-la1"/></linearGradient>' +
    '<linearGradient id="hw2g-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="hw2s-so0"/><stop offset="1" class="hw2s-so1"/></linearGradient>' +
    '<linearGradient id="hw2g-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="hw2s-wd0"/><stop offset="1" class="hw2s-wd1"/></linearGradient>' +
    '</defs>';

  /* ------------------------------------------------------------ Calculations: the figure of a problem
     The problem's individuals, each a pair of alleles (up to 100, in proportion), beside the gene pool square split
     at the p (or 1 − q) the student types, and at the true p after Check. */
  var Z = 196, X0 = 30, Y0 = 44, PX = 250, PY = 50, GX = 17.4, GY = 19;
  function plain(s){ return String(s).replace(/<sup>(.*?)<\/sup>/g, '$1').replace(/<[^>]+>/g, ''); }
  function square(p, A, a){
    var q = 1 - p, s = Z * p, h = [];
    function cell(x, y, w, hh, cls, lab, f){
      h.push('<rect class="hw2f-cell ' + cls + '" x="' + n1(x) + '" y="' + n1(y) + '" width="' + n1(Math.max(0, w)) + '" height="' + n1(Math.max(0, hh)) + '"/>');
      if(w > 40 && hh > 30) h.push('<text class="hw2f-cl ' + cls + '" x="' + n1(x + w / 2) + '" y="' + n1(y + hh / 2 - 2) + '" text-anchor="middle">' + esc(lab) + '</text><text class="hw2f-cv ' + cls + '" x="' + n1(x + w / 2) + '" y="' + n1(y + hh / 2 + 13) + '" text-anchor="middle">' + F(f, 3) + '</text>');
    }
    cell(X0, Y0, s, s, 'g0', A + A, p * p);
    cell(X0 + s, Y0, Z - s, s, 'g1', A + a, p * q);
    cell(X0, Y0 + s, s, Z - s, 'g1', A + a, p * q);
    cell(X0 + s, Y0 + s, Z - s, Z - s, 'g2', a + a, q * q);
    // the gene pool on two sides: a bar split at p
    if(s > 0) h.push('<rect class="hw2f-bar is-p" x="' + X0 + '" y="' + (Y0 - 11) + '" width="' + n1(s) + '" height="7" rx="3"/><rect class="hw2f-bar is-p" x="' + (X0 - 11) + '" y="' + Y0 + '" width="7" height="' + n1(s) + '" rx="3"/>');
    if(Z - s > 0) h.push('<rect class="hw2f-bar is-q" x="' + n1(X0 + s) + '" y="' + (Y0 - 11) + '" width="' + n1(Z - s) + '" height="7" rx="3"/><rect class="hw2f-bar is-q" x="' + (X0 - 11) + '" y="' + n1(Y0 + s) + '" width="7" height="' + n1(Z - s) + '" rx="3"/>');
    h.push('<rect class="hw2f-frame" x="' + X0 + '" y="' + Y0 + '" width="' + Z + '" height="' + Z + '"/>');
    if(s > 22) h.push('<text class="hw2f-ph" x="' + n1(X0 + s / 2) + '" y="' + (Y0 - 17) + '" text-anchor="middle">' + esc(A) + ': p</text>');
    if(Z - s > 22) h.push('<text class="hw2f-ph" x="' + n1(X0 + s + (Z - s) / 2) + '" y="' + (Y0 - 17) + '" text-anchor="middle">' + esc(a) + ': q</text>');
    if(s > 22) h.push('<text class="hw2f-ph" transform="translate(' + (X0 - 16) + ' ' + n1(Y0 + s / 2) + ') rotate(-90)" text-anchor="middle">' + esc(A) + ': p</text>');
    if(Z - s > 22) h.push('<text class="hw2f-ph" transform="translate(' + (X0 - 16) + ' ' + n1(Y0 + s + (Z - s) / 2) + ') rotate(-90)" text-anchor="middle">' + esc(a) + ': q</text>');
    h.push('<text class="hw2f-ph hw2f-dim" x="' + (X0 + Z / 2) + '" y="' + (Y0 + Z + 17) + '" text-anchor="middle">one allele from each parent</text>');
    return h.join('');
  }
  /* One individual: two alleles in a capsule. g: 0 AA, 1 Aa, 2 aa, 3 "AA or Aa" (the second allele is not known). */
  function ind(g, k){
    var cx = PX + (k % 10) * GX + 7.6, cy = PY + Math.floor(k / 10) * GY + 6;
    var l = g === 2 ? 'is-q' : 'is-p', r = g === 0 ? 'is-p' : g === 3 ? 'is-u' : 'is-q';
    return '<g class="hw2f-ind"><rect x="' + n1(cx - 7.6) + '" y="' + n1(cy - 5) + '" width="15.2" height="10" rx="5"/><circle class="' + l + '" cx="' + n1(cx - 3.3) + '" cy="' + n1(cy) + '" r="3.1"/><circle class="' + r + '" cx="' + n1(cx + 3.3) + '" cy="' + n1(cy) + '" r="3.1"/>' +
      (g === 3 ? '<text x="' + n1(cx + 3.3) + '" y="' + n1(cy + 2.2) + '" text-anchor="middle">?</text>' : '') + '</g>';
  }
  function people(counts, title){
    var tot = M.sum(counts), show = tot > 100 ? M.apportion(counts.map(function(c){ return c / tot; }), 100) : counts, h = [], k = 0;
    [0, 1, 3, 2].forEach(function(g){ for(var i = 0; i < (show[g] || 0); i++) h.push(ind(g, k++)); });
    h.push('<text class="hw2f-ph" x="' + PX + '" y="' + (PY - 9) + '">' + esc(title || (tot > 100 ? '100 of ' + tot + ', in proportion' : tot + ' individuals')) + '</text>');
    return h.join('');
  }
  /* phen: one phenotype per genotype ([AA, Aa, aa]) when the alleles are incompletely dominant (snapdragons: red,
     pink, white). Then there is no carrier and no recessive trait: every genotype shows. */
  function sw(g){ var l = g === 2 ? 'is-q' : 'is-p', r = g === 0 ? 'is-p' : g === 3 ? 'is-u' : 'is-q'; return '<i class="hw2f-k"><b class="' + l + '"></b><b class="' + r + '">' + (g === 3 ? '?' : '') + '</b></i>'; }
  function key(A, a, unk, phen){
    if(phen) return '<p class="hw2f-key"><span>' + sw(0) + A + A + ' (' + esc(phen[0]) + ')</span><span>' + sw(1) + A + a + ' (' + esc(phen[1]) + ')</span><span>' + sw(2) + a + a + ' (' + esc(phen[2]) + ')</span></p>';
    return '<p class="hw2f-key"><span>' + sw(0) + A + A + '</span><span>' + sw(1) + A + a + ' (carrier)</span><span>' + sw(2) + a + a + ' (shows the recessive trait)</span>' + (unk ? '<span>' + sw(3) + A + A + ' or ' + A + a + ': looks the same</span>' : '') + '</p>';
  }
  function pstage(host, s){
    var x = s.input, a = s.answers || {}, chk = s.phase === 'checked', rec = x.mode === 'recessive';
    var A = rec ? 'A' : plain(x.A), al = rec ? 'a' : plain(x.a), pTrue, counts, title = null;
    if(rec){
      var h = M.hwRecessive(x.affected / x.N); pTrue = h.p;
      counts = chk ? M.apportion([h.p2, h.pq2, h.q2], Math.min(100, x.N)) : [0, 0, x.affected, x.N - x.affected];
      title = chk ? 'Expected genotypes in ' + Math.min(100, x.N) : null;
    } else { pTrue = M.hwCounts(x.AA, x.Aa, x.aa).p; counts = [x.AA, x.Aa, x.aa]; }
    var num = S0 ? S0.num : function(v){ return typeof v === 'number' && isFinite(v) ? v : NaN; };
    var pT = num(a.p), qT = num(a.q), fromP = pT >= 0 && pT <= 1;
    var pUse = chk ? pTrue : fromP ? pT : qT >= 0 && qT <= 1 ? 1 - qT : null;
    var svg = '<svg class="bio-svg hw2f-svg" viewBox="0 0 430 262" role="img" aria-label="' + esc(rec ? x.affected + ' of ' + x.N + ' show the recessive trait.' : x.AA + ' ' + A + A + ', ' + x.Aa + ' ' + A + al + ' and ' + x.aa + ' ' + al + al + ' individuals.') + (pUse != null ? ' Gene pool square split at p = ' + F(pUse, 2) + '.' : '') + '">';
    svg += pUse != null ? square(pUse, A, al)
      : '<rect class="hw2f-frame hw2f-empty" x="' + X0 + '" y="' + Y0 + '" width="' + Z + '" height="' + Z + '"/><text class="hw2f-ph hw2f-dim" x="' + (X0 + Z / 2) + '" y="' + (Y0 + Z / 2) + '" text-anchor="middle">Type p or q</text><text class="hw2f-ph hw2f-dim" x="' + (X0 + Z / 2) + '" y="' + (Y0 + Z / 2 + 16) + '" text-anchor="middle">to split the square</text>';
    svg += people(counts, title) + '</svg>';
    var cap = chk ? (rec
        ? 'Only ' + al + al + ' individuals can be counted directly, so start from q² = ' + F(x.affected / x.N, 3) + '. The square is split at p = ' + F(pTrue, 2) + ': its two pq cells together are the carriers, 2pq = ' + F(2 * pTrue * (1 - pTrue), 3) + ' of the population.'
        : 'The square is split at the true p = ' + F(pTrue, 2) + '. Its two pq cells add up to 2pq, the heterozygotes expected at equilibrium; compare that with the ' + A + al + ' individuals actually counted.')
      : pUse != null ? 'The square is split at your ' + (fromP ? 'p' : '1 − q') + ' = ' + F(pUse, 2) + ': its cells are p², two pq and q².'
      : rec ? 'You can see who shows the trait (' + al + al + '), but not who is a carrier. Type p or q and the square splits to match.' : 'Each pair is one individual. Count alleles: every individual carries two. Type p or q and the square splits to match.';
    var html = '<div class="sk-fig hw2f">' + svg + '</div>' + key(esc(A), esc(al), rec && !chk, rec ? null : x.phen) + '<p class="sk-cap">' + cap + '</p>';
    if(host.__hw !== html){ host.__hw = html; host.innerHTML = html; }
  }

  function boot(){
    var K = window.LevlKit2;
    T.mount(SLUG, function(app, data, ctx){
      var EX = data.explore, TG = data.targets || [], N = EX.side, NN = N * N;
      /* Two species. Explore is snapdragons (incomplete dominance: every genotype shows). Targets about a hidden
         recessive use pea plants (complete dominance: AA and Aa both purple, aa white), so carriers are met. */
      var SPS = { snap: { A: EX.A, a: EX.a, phen: EX.phen, name: EX.name || 'snapdragons', sym: 'hw2-plant' }, pea: data.pea ? { A: data.pea.A, a: data.pea.a, phen: data.pea.phen, name: data.pea.name, sym: 'hw2-pea', dom: true } : null };
      var SP = SPS.snap, A = SP.A, a = SP.a, PH = SP.phen, GN = [A + A, A + a, a + a];
      function setSp(id){
        var sp = SPS[id] || SPS.snap;
        if(sp === SP) return false;
        SP = sp; A = sp.A; a = sp.a; PH = sp.phen; GN = [A + A, A + a, a + a];
        stage.setAttribute('data-sp', sp.dom ? 'pea' : 'snap');
        if(G){ drawTop(); drawPlants(); drawSigns.k = ''; drawSigns(); }
        return true;
      }
      var S = { n: Math.round(EX.p * N), mode: 'explore', part: null };
      var Q = { n: 5, i: -1, hidden: true, done: false, tried: false, t: null };   // Test yourself, "Set the alleles"
      function nNow(){ return S.mode === 'explore' ? S.n : Q.n; }
      function geno(n, r, c){ return (c < n ? 0 : 1) + (r < n ? 0 : 1); }
      function freq(n){ var p = n / N, q = 1 - p; return { p: p, q: q, f: [p * p, 2 * p * q, q * q], c: [n * n, 2 * n * (N - n), (N - n) * (N - n)] }; }
      function pct(v){ return Math.round(v * 10000 / NN) / 100; }   // plants as a percent of the bed
      function countsText(n){ var c = freq(n).c;
        if(SP.dom) return pct(c[0] + c[1]) + '% ' + PH[0] + ' (' + GN[0] + ' or ' + GN[1] + '), ' + pct(c[2]) + '% ' + PH[2] + ' (' + GN[2] + ').';
        return pct(c[0]) + '% ' + GN[0] + ' ' + PH[0] + ', ' + pct(c[1]) + '% ' + GN[1] + ' ' + PH[1] + ', ' + pct(c[2]) + '% ' + GN[2] + ' ' + PH[2] + '.'; }

      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'hw2'; stage.setAttribute('data-sp', 'snap');
      var head = K.head({ purpose: EX.purpose, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'hw2-scene'; sceneBox.id = T.nid('hw2');
      // three layers: the lawn and the bed (never change during a drag), the plants, and what moves with the knob
      sceneBox.innerHTML = '<svg class="hw2-svg hw2-under" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep">' + DEFS + '<g class="hw2-static"></g></svg>' +
        '<svg class="hw2-svg hw2-bed" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><defs class="hw2-spr"></defs><g class="hw2-plants"></g></svg>' +
        // what moves with the knob (the twine, the gene pool, its labels) and the signs: their own layer, so a drag
        // never repaints the hundred plants under them
        '<svg class="hw2-svg hw2-over" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="hw2-twine"></g><g class="hw2-top"><g class="hw2-toks"></g><g class="hw2-labs"></g></g><g class="hw2-signs"></g></svg>';
      stage.appendChild(sceneBox);
      var under = sceneBox.querySelector('.hw2-under'), svg = sceneBox.querySelector('.hw2-bed'), over = sceneBox.querySelector('.hw2-over'), gStatic = under.querySelector('.hw2-static'), gTwine = over.querySelector('.hw2-twine'), gPlants = svg.querySelector('.hw2-plants'),
        gTop = over.querySelector('.hw2-top'), gTok = over.querySelector('.hw2-toks'), gLab = over.querySelector('.hw2-labs'), toks = [], tokK = 0, gSigns = over.querySelector('.hw2-signs'), layer = K.layer(sceneBox), G = null;
      var lines = document.createElement('div'); lines.className = 'hw2-lines';
      var cause = K.cause({ label: 'Why' });
      lines.appendChild(cause.el); stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

      /* ---- the one control, on the picture: the knob on the back board */
      var cP = K.drag(layer, { key: 'apbio-hw-p', label: 'p, the share of ' + A + ' alleles in the gene pool', min: 0, max: N, step: 1, value: S.n, track: [0, 0, 1, 0], chip: false,
        valuetext: function(v){ var f = freq(v); return 'p = ' + F(f.p, 1) + ', q = ' + F(f.q, 1) + '.' + (S.mode === 'explore' ? ' ' + countsText(v) : ''); },
        onInput: function(v){ if(S.mode === 'explore'){ S.n = v; tourDid('drag'); } else { if(!Q.hidden) return; Q.n = v; } changed(); },
        onEnd: function(){ if(S.mode === 'explore'){ say(sayWords() + ' ' + countsText(S.n)); refHtml(); } } });
      var cue = K.cue(layer, { key: 'apbio-hw', text: EX.cue, side: 'below', at: function(){ return G ? [G.bx0 + G.cw * nNow(), G.ty] : [0, 0]; } });
      function hideCue(used){ if(cue.active()) cue.hide(used); }
      stage.addEventListener('pointerdown', function(){ hideCue(true); }, true);
      stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End|Enter| )/.test(e.key)) hideCue(true); }, true);
      var tour = K.tour({ key: 'apbio-hw', label: 'Show me how', steps: [
        { id: 'drag', text: 'Drag the knob. It sets how many alleles are ' + A + ', in the pollen and in the eggs.', target: function(){ return cP.el.querySelector('.tk2-knob'); } },
        { id: 'read', text: 'Each plant gets one allele from its pollen grain and one from its egg. The signs count the plants.', target: function(){ return gSigns; } },
        { id: 'why', text: 'The line below gives the same shares as p², 2pq and q².', target: function(){ return cause.el; } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      function tourDid(id){ if(tour.active()) tour.did(id); }
      function startTour(){ if(S.mode !== 'explore') return; hideCue(false); tour.start(true); }

      /* ---- the picture follows the control at once, and the change is seen happening. shown[i]: the genotype
         drawn for plant i (-1: planted, not in bloom). A change of p sets when each plant that must change does
         so (the change runs from the allele that flipped, down its column and along its row), and one loop makes
         the flips; the signs count shown[], so a number never runs ahead of the bed. */
      var shown = [], flipAt = [], nodes = [], tw = 0, lastFlip = 0, drawnN = null, sym = 'plant1';
      (function(){ for(var i = 0; i < NN; i++){ shown.push(geno(S.n, Math.floor(i / N), i % N)); flipAt.push(0); } })();
      function busy(){ return !!tw; }
      function href(g){ return '#hw2-s-' + (g < 0 ? 'sprout' : sym + '-' + g); }
      /* The plant images: each drawing in PLANT, coloured for each genotype from this page's colour variables (light
         or dark theme, snapdragon or pea), as one SVG image inside a symbol. Remade when the theme or species changes. */
      var sprKey = '';
      /* Then each image is redrawn once as a bitmap at the size it is shown (vector images are drawn again at every
         size a plant grows through, which made frames wait during a drag). Until then the vector image shows. */
      function toBitmaps(key){
        if(!G || !window.HTMLCanvasElement) return;
        var k = Math.min(4, Math.max(G.sx, G.sy) * (window.devicePixelRatio || 1) * 1.05);
        Array.prototype.forEach.call(svg.querySelectorAll('.hw2-spr image'), function(im){
          var src = im.getAttribute('href'), pic = new Image();
          pic.onload = function(){
            if(sprKey !== key) return;
            try{
              var c = document.createElement('canvas'); c.width = Math.ceil(PBOX[2] * k); c.height = Math.ceil(PBOX[3] * k);
              c.getContext('2d').drawImage(pic, 0, 0, c.width, c.height);
              im.setAttribute('href', c.toDataURL('image/png'));
            }catch(e){}
          };
          pic.src = src;
        });
      }
      function sprites(){
        var cs = getComputedStyle(stage), v = function(n, d){ return (cs.getPropertyValue(n) || '').trim() || d; };
        var cols = [[v('--hw-r'), v('--hw-r-hi'), v('--hw-r-edge', '#7C1218')], [v('--hw-rw'), v('--hw-rw-hi'), '#B5477A'], [v('--hw-w-sh'), v('--hw-w'), v('--hw-w-edge')]];
        if(SP.dom) cols[1] = cols[0];
        var base = '.hw2-shade{fill:#000;fill-opacity:.26}.hw2-stem{fill:none;stroke:' + v('--hw-stem') + ';stroke-width:2.4;stroke-linecap:round}' +
          '.hw2-tendril{fill:none;stroke:' + v('--hw-stem') + ';stroke-width:1.2;stroke-linecap:round}.hw2-leaf{fill:' + v('--hw-leaf') + ';stroke:' + v('--hw-leaf-ink') + ';stroke-width:.7}.hw2-throat{fill:' + v('--hw-throat') + '}';
        var key = SP.sym + '|' + base + '|' + cols.join('|') + '|' + (G ? Math.max(G.sx, G.sy).toFixed(2) : '');
        if(key === sprKey) return false;
        sprKey = key;
        function img(id, draw, c){
          var css = base + (c ? '.hw2-lip,.hw2-bud,.hw2-wing{fill:' + c[0] + ';stroke:' + c[2] + ';stroke-width:.85}.hw2-hood,.hw2-ban{fill:' + c[1] + ';stroke:' + c[2] + ';stroke-width:.75}' : '');
          var src = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + PBOX.join(' ') + '" width="' + PBOX[2] * 2 + '" height="' + PBOX[3] * 2 + '"><style>' + css + '</style>' + PLANT[draw] + '</svg>';
          return '<symbol id="hw2-s-' + id + '" overflow="visible"><image href="data:image/svg+xml,' + encodeURIComponent(src) + '" x="' + PBOX[0] + '" y="' + PBOX[1] + '" width="' + PBOX[2] + '" height="' + PBOX[3] + '"/></symbol>';
        }
        var h = [img('sprout', 'sprout')];
        ['1', '3'].forEach(function(k){ for(var g = 0; g < 3; g++) h.push(img(SP.sym.slice(4) + k + '-' + g, SP.sym.slice(4) + k, cols[g])); });
        svg.querySelector('.hw2-spr').innerHTML = h.join('');
        toBitmaps(key);
        return true;
      }
      function plCls(g, cls){ return 'hw2-pl ' + (g < 0 ? 'is-sprout' : GC[g]) + (cls ? ' ' + cls : ''); }
      function use(g){ return '<use href="' + href(g) + '" class="' + plCls(g) + '"/>'; }
      function shownCounts(){ var c = [0, 0, 0, 0]; for(var i = 0; i < NN; i++) c[shown[i] < 0 ? 3 : shown[i]]++; return c; }
      function target(i){ return S.mode !== 'explore' && Q.hidden ? -1 : geno(nNow(), Math.floor(i / N), i % N); }
      function snap(){ for(var i = 0; i < NN; i++){ shown[i] = target(i); flipAt[i] = 0; if(growAt[i]){ growAt[i] = 0; plantAt(i, 1); } } if(tw){ cancelAnimationFrame(tw); tw = 0; } }
      function crossFade(){
        var g = gPlants.cloneNode(true); g.setAttribute('class', 'hw2-plants hw2-fade'); svg.appendChild(g);
        var done = function(){ if(g.parentNode) g.parentNode.removeChild(g); };
        if(g.animate){ var an = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'linear' }); an.onfinish = done; setTimeout(done, 400); } else done();
      }
      /* from: the n the bed was drawn for (the wave starts at the alleles that flipped); bloom: a planted bed comes
         into flower, back row first. */
      function changed(bloom){
        var n = nNow(), from = drawnN == null ? n : drawnN, lo = Math.min(from, n), hi = Math.max(from, n), t0 = now(), any = false;
        drawTop(from);
        if(K.reduced() || !window.requestAnimationFrame){
          crossFade(); snap(); drawPlants(); drawSigns(); syncWords(); return;
        }
        for(var i = 0; i < NN; i++){
          var r = Math.floor(i / N), c = i % N, g = target(i);
          if(g === shown[i]){ flipAt[i] = 0; continue; }
          var d;
          if(bloom) d = 46 * r + 9 * c;
          else {
            var dc = c >= lo && c < hi ? r * 24 + Math.abs(c - (n < from ? from - 1 : from)) * 34 : 1e9, dr = r >= lo && r < hi ? c * 24 + Math.abs(r - (n < from ? from - 1 : from)) * 34 : 1e9;
            d = Math.min(dc, dr, 420);
          }
          if(!flipAt[i]) flipAt[i] = t0 + d;
          any = true;
        }
        if(any && !tw){ lastFlip = t0; tw = requestAnimationFrame(tick); }
        syncWords();
      }
      function tick(ts){
        var t = now(), pend = false, did = false;
        for(var i = 0; i < NN; i++){
          if(!flipAt[i]){ if(growAt[i] && grow(i, t)) pend = true; continue; }
          if(t >= flipAt[i]){
            var g = target(i), old = shown[i];
            flipAt[i] = 0;
            if(g !== old){
              shown[i] = g; did = true; lastFlip = t;
              // one <use> per plant: the new plant grows in where the old one stood
              var u = nodes[i];
              if(u){ if(href(g) !== href(old)) u.setAttribute('href', href(g)); u.setAttribute("class", plCls(g)); growAt[i] = t; growSt[i] = -1; }
            }
          } else pend = true;
          if(growAt[i] && grow(i, t)) pend = true;
        }
        if(did) drawSigns();
        if(pend || t - lastFlip < 300){ tw = requestAnimationFrame(tick); return; }
        tw = 0; syncWords(); drawSigns(); if(after){ var f = after; after = null; f(); }
      }
      var after = null;
      /* The grow in: three sizes in 240 ms, set as the plant's own transform (an SVG attribute, not a CSS animation:
         a hundred CSS animations made a drag stutter, review round 1). Returns true while still growing. */
      var GROW = [0.55, 0.8, 1], growAt = [], growSt = [];
      function grow(i, t){
        var st = Math.min(2, Math.floor((t - growAt[i]) / 80));
        if(st !== growSt[i]){ growSt[i] = st; plantAt(i, GROW[st]); }
        if(st >= 2){ growAt[i] = 0; return false; }
        return true;
      }
      function plantAt(i, f){
        var g = G, w = nodes[i] && nodes[i].parentNode; if(!g || !w) return;
        var r = Math.floor(i / N), c = i % N;
        w.setAttribute('transform', 'translate(' + n1(g.bx0 + (c + 0.5) * g.cw) + ' ' + n1(g.rows + (r + 1) * g.rh - 3) + ') scale(' + (g.sx * f).toFixed(3) + ' ' + (g.sy * f).toFixed(3) + ')');
      }

      /* ---- words: the cause line. While the bed is still changing it stops at p and q; the three shares are
         added when the plants show them. */
      var wKey = '';
      function chain(){
        var f = freq(S.n), out = [{ t: 'p = ' + F(f.p, 1), role: 'r', say: 'p, the share of ' + A + ' alleles, is ' + F(f.p, 1) }, { t: 'q = ' + F(f.q, 1), role: 'w', join: '+', say: 'q, the share of ' + a + ' alleles, is ' + F(f.q, 1) }];
        if(busy()) return out;
        return out.concat([{ t: 'p² = ' + F(f.f[0], 2), role: 'r', say: 'p squared, the ' + GN[0] + ' share, is ' + F(f.f[0], 2) }, { t: '2pq = ' + F(f.f[1], 2), role: 'rw', join: '+', say: '2 p q, the ' + GN[1] + ' share, is ' + F(f.f[1], 2) },
          { t: 'q² = ' + F(f.f[2], 2), role: 'w', join: '+', say: 'q squared, the ' + GN[2] + ' share, is ' + F(f.f[2], 2) }]);
      }
      function syncWords(){
        if(S.mode !== 'explore') return;
        var k = S.n + '|' + busy();
        if(k === wKey) return;
        wKey = k;
        var list = chain(), sp = cause.el.querySelectorAll('.tk2-cz'), sk = list.map(function(x){ return x.role; }).join();
        // the same pills with new numbers (every step of a drag): only their text changes, nothing is rebuilt
        if(sp.length === list.length && syncWords.sk === sk){ list.forEach(function(x, i){ var t = sp[i].firstChild; if(t && t.data !== x.t) t.data = x.t; }); return; }
        syncWords.sk = sk; cause.set(list);
      }
      function sayWords(){ var l = chain(); return l.map(function(x, i){ return (i ? (x.join === '+' ? ' and ' : ', then ') : '') + x.say; }).join('') + '.'; }

      /* ---------------------------------------------------- layout and drawing */
      function geo(Wd, H){
        var ph = Wd < 520, fs = ph ? 12.5 : 14.5, fsS = ph ? 10.5 : 12.5, tokR = ph ? 9.5 : Wd < 900 ? 11 : 12.5, tb = ph ? 5 : 8, fb = ph ? 9 : 13;
        var eL = ph ? 47 : 78, mr = ph ? 27 : 34, labY = (fs + 10) / 2 + 5, tokY = labY + (fs + 10) / 2 + 5 + tokR, by0 = tokY + tokR + 8 + 17 + tb / 2;
        var signH = ph ? 27 : 32, by1 = H - (fb + 9 + signH + 7), BH = by1 - by0, avail = Wd - eL - mr, BW = Math.min(avail, BH * 2.4), bx0 = eL + (avail - BW) / 2;
        var rh = BH / (N + 0.16), cw = BW / N, hP = Math.min(rh * 0.8, cw * 1.6), sy = hP / 61, wide = cw / rh > 0.85;
        var sx = wide ? clamp(cw * 0.37 / 22, sy * 0.9, sy * 1.55) : clamp(cw * 0.47 / 18, sy * 0.7, sy * 1.2);
        return { W: Wd, H: H, ph: ph, fs: fs, fsS: fsS, tokR: tokR, tb: tb, fb: fb, labY: labY, tokY: tokY, by0: by0, by1: by1, BH: BH, BW: BW, bx0: bx0, bx1: bx0 + BW, rh: rh, cw: cw,
          rows: by0 + 0.16 * rh, sx: sx, sy: sy, wide: wide, ty: by0 - tb / 2, eggX: bx0 - tb - tokR - (ph ? 17 : 12), signH: signH, signY: by1 + fb + 9 + signH / 2 };
      }
      function pill(x, y, text, cls, fs){
        var w = text.length * fs * 0.56 + 18, h = fs + 10;
        return '<g class="hw2-pill ' + cls + '"><rect x="' + n1(x - w / 2) + '" y="' + n1(y - h / 2) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="' + n1(h / 2) + '"/><text x="' + n1(x) + '" y="' + n1(y + fs * 0.36) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(text) + '</text></g>';
      }
      function pillW(text, fs){ return text.length * fs * 0.56 + 18; }
      function showEl(e, on){ if(on) e.removeAttribute('display'); else e.setAttribute('display', 'none'); }
      /* move and reword a pill built by pill(): attributes and the text node only, so nothing is added or removed */
      function setPill(e, on, x, y, text, fs){
        showEl(e, on); if(!on) return;
        var r = e.firstChild, t = e.lastChild, w = pillW(text, fs), h = fs + 10;
        r.setAttribute('x', n1(x - w / 2)); r.setAttribute('y', n1(y - h / 2)); r.setAttribute('width', n1(w)); r.setAttribute('height', n1(h)); r.setAttribute('rx', n1(h / 2));
        t.setAttribute('x', n1(x)); t.setAttribute('y', n1(y + fs * 0.36)); t.style.fontSize = fs + 'px';
        if(t.firstChild.data !== text) t.firstChild.data = text;
      }
      function drawStatic(){
        var g = G, h = [], i, rg = M.rng(4107);
        h.push('<rect class="hw2-lawn" x="0" y="0" width="' + g.W + '" height="' + g.H + '"/>');
        var swd = g.ph ? 46 : 74;
        for(i = 0; i * swd < g.W + g.H; i += 2) h.push('<path class="hw2-stripe" d="M' + n1(i * swd) + ' 0h' + swd + 'l' + n1(-g.H * 0.35) + ' ' + g.H + 'h' + (-swd) + 'z"/>');
        // grass tufts on the lawn, clear of the bed, the gene pool and the signs
        var tufts = Math.round(g.W * g.H / 5200);
        for(i = 0; i < tufts; i++){
          var x = 6 + rg() * (g.W - 12), y = 8 + rg() * (g.H - 12);
          if(x > g.bx0 - g.tb - 2 * g.tokR - 26 && x < g.bx1 + g.tb + 6 && y > g.by0 - g.tb - 6 && y < g.by1 + g.fb + 6) continue;
          if(y < g.by0 - g.tb && x > g.bx0 - 60) continue;
          if(y > g.by1 + g.fb && x > g.bx0 - 60 && x < g.bx1 + 10) continue;
          h.push('<path class="hw2-tuft" d="M' + n1(x - 4) + ' ' + n1(y) + 'l1.5 -6M' + n1(x) + ' ' + n1(y) + 'v-8M' + n1(x + 4) + ' ' + n1(y) + 'l-1.5 -6"/>');
        }
        var fx = g.bx0 - g.tb, fw = g.BW + 2 * g.tb;
        h.push('<rect class="hw2-bedsh" x="' + n1(fx + 3) + '" y="' + n1(g.by0 - g.tb + 6) + '" width="' + n1(fw) + '" height="' + n1(g.BH + g.tb + g.fb + 4) + '" rx="8"/>');
        h.push('<rect class="hw2-frame" x="' + n1(fx) + '" y="' + n1(g.by0 - g.tb) + '" width="' + n1(fw) + '" height="' + n1(g.BH + g.tb + g.fb) + '" rx="5"/>');
        h.push('<rect class="hw2-soil" x="' + n1(g.bx0) + '" y="' + n1(g.by0) + '" width="' + n1(g.BW) + '" height="' + n1(g.BH) + '" rx="2"/>');
        for(i = 0; i < N; i++){ var fy = g.rows + (i + 1) * g.rh - 2; h.push('<path class="hw2-furrow" d="M' + n1(g.bx0 + 3) + ' ' + n1(fy) + 'H' + n1(g.bx1 - 3) + '"/>'); }
        var clods = Math.round(g.BW * g.BH / 900);
        for(i = 0; i < clods; i++) h.push('<ellipse class="hw2-clod' + (rg() < 0.4 ? ' is-hi' : '') + '" cx="' + n1(g.bx0 + 5 + rg() * (g.BW - 10)) + '" cy="' + n1(g.by0 + 6 + rg() * (g.BH - 10)) + '" rx="' + n1(1.2 + rg() * 2.2) + '" ry="' + n1(0.8 + rg() * 1.1) + '"/>');
        h.push('<rect class="hw2-soilsh" x="' + n1(g.bx0) + '" y="' + n1(g.by0) + '" width="' + n1(g.BW) + '" height="6"/>');
        h.push('<rect class="hw2-front" x="' + n1(fx) + '" y="' + n1(g.by1) + '" width="' + n1(fw) + '" height="' + n1(g.fb) + '" rx="3"/><path class="hw2-plank" d="M' + n1(fx + 4) + ' ' + n1(g.by1 + g.fb * 0.5) + 'H' + n1(fx + fw - 4) + '"/>');
        h.push('<path class="hw2-edge" d="M' + n1(fx + 3) + ' ' + n1(g.by0 - g.tb + 1.2) + 'H' + n1(fx + fw - 3) + '"/>');
        // the two captions of the gene pool
        h.push('<text class="hw2-cap" x="' + n1(g.bx0 - (g.ph ? 2 : 8)) + '" y="' + n1(g.tokY + g.fsS * 0.36) + '" text-anchor="end" style="font-size:' + g.fsS + 'px">pollen</text>');
        // "eggs" right under the last egg (at the head of the column the knob covers it when p = 0)
        h.push('<text class="hw2-cap" x="' + n1(g.eggX) + '" y="' + n1(g.rows + (N - 0.5) * g.rh + g.tokR * 0.94 + 3 + g.fsS * 0.8) + '" text-anchor="middle" style="font-size:' + g.fsS + 'px">eggs</text>');
        gStatic.innerHTML = h.join('');
      }
      function tok(x, y, isA, egg, cls){
        var r = G.tokR;
        return '<g class="hw2-tok ' + (isA ? 'is-r' : 'is-w') + (egg ? ' is-egg' : '') + (cls ? ' ' + cls : '') + '" transform="translate(' + n1(x) + ' ' + n1(y) + ')"><g class="hw2-tokb">' + (egg ? '<ellipse rx="' + n1(r * 1.12) + '" ry="' + n1(r * 0.94) + '"/>' : '<circle r="' + n1(r) + '"/>') +
          '<text y="' + n1(r * 0.38) + '" text-anchor="middle" style="font-size:' + n1(r * 1.08) + 'px">' + (isA ? A : a) + '</text></g></g>';
      }
      /* The gene pool, its two labels and the twine: these ARE the control's value, so they follow it at once. */
      function drawTop(from){
        var g = G, n = nNow(), h = [], t = [], i, f = freq(n);
        if(!g) return;
        if(from == null) from = n;
        var lo = Math.min(from, n), hi = Math.max(from, n);
        // the twenty alleles are built once per layout (and species); a change only turns the ones that flipped
        var tk = g.W + '|' + g.H + '|' + A;
        if(drawTop.k !== tk){
          drawTop.k = tk;
          for(i = 0; i < N; i++) h.push(tok(g.bx0 + (i + 0.5) * g.cw, g.tokY, i < n, false, ''));
          for(i = 0; i < N; i++) h.push(tok(g.eggX, g.rows + (i + 0.5) * g.rh, i < n, true, ''));
          gTok.innerHTML = h.join(''); h = []; gLab.innerHTML = '';
          toks = Array.prototype.slice.call(gTok.children);
        } else if(lo < hi){
          tokK = 1 - tokK;
          for(i = lo; i < hi; i++) [toks[i], toks[N + i]].forEach(function(e, j){
            var isA = i < n, tx = e.querySelector('text').firstChild; e.setAttribute('class', 'hw2-tok ' + (isA ? 'is-r' : 'is-w') + (j ? ' is-egg' : '') + (tokK ? ' is-in' : ' is-in2'));
            if(tx.data !== (isA ? A : a)) tx.data = isA ? A : a;
          });
        }
        // p over the R pollen, q over the W pollen (each only while there is something to name)
        var tp = 'p = ' + F(f.p, 1), tq = 'q = ' + F(f.q, 1), wp = pillW(tp, g.fs), wq = pillW(tq, g.fs);
        var xp = clamp(g.bx0 + n * g.cw / 2, wp / 2 + 3, g.W - wp / 2 - 3), xq = clamp(g.bx0 + (n + (N - n) / 2) * g.cw, wq / 2 + 3, g.W - wq / 2 - 3);
        if(n > 0 && n < N && xq - xp < (wp + wq) / 2 + 4){ var mid = (xp + xq) / 2; xp = mid - (wp + 4) / 2; xq = mid + (wq + 4) / 2; }
        if(!gLab.firstChild){
          gLab.innerHTML = '<g class="hw2-lp">' + pill(0, 0, 'p', 'is-r', g.fs) + '</g><g class="hw2-lq">' + pill(0, 0, 'q', 'is-w', g.fs) + '</g>';
          gTwine.innerHTML = '<path class="hw2-string"/><path class="hw2-string"/><circle class="hw2-peg" r="2.6"/><circle class="hw2-peg" r="2.6"/><circle class="hw2-peg" r="2.6"/>';
        }
        setPill(gLab.children[0].firstChild, n > 0, xp, g.labY, tp, g.fs);
        setPill(gLab.children[1].firstChild, n < N, xq, g.labY, tq, g.fs);
        var tw2 = gTwine.children, on = n > 0 && n < N, xk = g.bx0 + n * g.cw, yk = g.rows + n * g.rh - 1.5;
        for(i = 0; i < tw2.length; i++) showEl(tw2[i], on);
        if(on){
          tw2[0].setAttribute('d', 'M' + n1(xk) + ' ' + n1(g.by0 + 1) + 'V' + n1(g.by1 - 1)); tw2[1].setAttribute('d', 'M' + n1(g.bx0 + 1) + ' ' + n1(yk) + 'H' + n1(g.bx1 - 1));
          [[xk, g.by1 - 2], [g.bx0 + 2, yk], [g.bx1 - 2, yk]].forEach(function(c, j){ tw2[2 + j].setAttribute('cx', n1(c[0])); tw2[2 + j].setAttribute('cy', n1(c[1])); });
        }
        drawnN = n;
        var al = S.mode === 'explore' ? 'A bed of ' + NN + ' ' + SP.name + '. p = ' + F(f.p, 1) + ' and q = ' + F(f.q, 1) + ': ' + countsText(n)
          : 'A bed of ' + NN + ' ' + SP.name + ', ' + (Q.hidden ? 'planted but not in bloom. ' : 'in bloom. ') + 'p = ' + F(f.p, 1) + ' and q = ' + F(f.q, 1) + '.' + (Q.hidden ? '' : ' ' + countsText(n));
        if(drawTop.al !== al){ drawTop.al = al; svg.setAttribute('aria-label', al); }
      }
      var boxes = {};
      function plantBox(id){
        if(!boxes[id]){
          var t = document.createElementNS('http://www.w3.org/2000/svg', 'g'); t.setAttribute('visibility', 'hidden'); t.innerHTML = PLANT[id]; over.appendChild(t);
          try{ var b = t.getBBox(); boxes[id] = { x: b.x, y: b.y, width: b.width, height: b.height }; }catch(e){ boxes[id] = { x: -20, y: -62, width: 40, height: 66 }; }
          over.removeChild(t);
        }
        return boxes[id];
      }
      function drawPlants(){
        var g = G, h = [];
        sym = SP.sym.slice(4) + (g.wide ? '3' : '1'); sprites();
        for(var i = 0; i < NN; i++){
          var r = Math.floor(i / N), c = i % N;
          h.push('<g class="hw2-p" transform="translate(' + n1(g.bx0 + (c + 0.5) * g.cw) + ' ' + n1(g.rows + (r + 1) * g.rh - 3) + ') scale(' + g.sx.toFixed(3) + ' ' + g.sy.toFixed(3) + ')">' + use(shown[i]) + '</g>');
        }
        gPlants.innerHTML = h.join('');
        // the drawn box of one plant at full size (plant units times its scale), for the sweep: plants in a column
        // must not touch (review round 1, must fix 2)
        var bb = plantBox(sym);
        gPlants.setAttribute('data-box', [bb.x * g.sx, bb.y * g.sy, bb.width * g.sx, bb.height * g.sy].map(function(v){ return v.toFixed(1); }).join(' '));
        nodes = Array.prototype.map.call(gPlants.children, function(e){ return e.firstChild; });
        for(var j = 0; j < NN; j++) growAt[j] = 0;
      }
      /* The signs in front of the bed count the plants as drawn (snapdragons: one per genotype; peas: one per
         flower colour, purple counting AA and Aa together). Hidden while a planted bed is not in bloom. Each sign is
         sized from its measured text, and one font size per layout fits the longest text a sign can hold. */
      var meas = null, mCache = {};
      function textW(t, fs){
        var k = t + '|' + fs;
        if(mCache[k] == null){
          if(!meas){ meas = document.createElementNS('http://www.w3.org/2000/svg', 'text'); meas.setAttribute('class', 'hw2-meas'); meas.setAttribute('aria-hidden', 'true'); over.appendChild(meas); }
          meas.style.fontSize = fs + 'px'; meas.textContent = t;
          mCache[k] = meas.getComputedTextLength() || t.length * fs * 0.62;
        }
        return mCache[k];
      }
      function signSet(c){
        if(SP.dom) return [{ g: 0, lab: PH[0], n: c[0] + c[1] }, { g: 2, lab: PH[2], n: c[2] }];
        return [0, 1, 2].map(function(i){ return { g: i, lab: GN[i], n: c[i] }; });
      }
      var sw0 = {};
      function signW(lab, num, fs){
        var k = lab + '|' + fs;
        if(!sw0[k]){ var w0 = textW(lab + ' 0%', fs), w1 = textW(lab + ' 100%', fs); sw0[k] = [w0, (w1 - w0) / 2]; }
        return sw0[k][0] + (num.length - 3) * sw0[k][1];
      }
      function signFit(k){
        // the widest a sign's text can be: the longest label with 100%
        var g = G, fs = g.ph ? 13.5 : 16, cap = g.BW / k - 8, dot = fs * 0.5, wMax = 0;
        signSet([0, 0, 0]).forEach(function(s){ wMax = Math.max(wMax, textW(s.lab + ' 100%', fs)); });
        var need = wMax + dot * 2 + 7 + 18;
        if(need > cap) fs = Math.floor(fs * (cap - dot * 2 - 7 - 18) / wMax * 10) / 10;
        return fs;
      }
      function drawSigns(){
        var g = G, c = shownCounts();
        if(!g) return;
        var key = c.join(',') + '|' + g.W + '|' + g.H + '|' + (SP.dom ? 1 : 0) + busy();
        if(drawSigns.k === key) return;
        drawSigns.k = key;
        var set = signSet(c), k = set.length, fs = signFs[k] || (signFs[k] = signFit(k)), dot = fs * 0.5, cap = g.BW / k - 8, y = g.signY;
        var bk = g.W + '|' + g.H + '|' + k + '|' + fs + '|' + A;
        if(drawSigns.b !== bk){
          drawSigns.b = bk;
          gSigns.innerHTML = set.map(function(sg, i){
            var x = g.bx0 + g.BW * (i + 0.5) / k;
            return '<g class="hw2-sign ' + GC[sg.g] + '" data-g="' + sg.g + '"><path class="hw2-stake" d="M' + n1(x) + ' ' + n1(y - g.signH / 2 - 7) + 'V' + n1(y) + '"/><rect y="' + n1(y - g.signH / 2) + '" height="' + g.signH + '" rx="7"/>' +
              '<circle class="hw2-sdot" cy="' + n1(y) + '" r="' + n1(dot) + '"/><text y="' + n1(y + fs * 0.36) + '" style="font-size:' + fs + 'px"><tspan class="hw2-sg">' + esc(sg.lab) + '</tspan> </text></g>';
          }).join('') + '<g class="hw2-car"><rect class="hw2-carbox"/><rect class="hw2-carbox"/>' + pill(0, 0, 'carriers', 'is-car', g.fs) + pill(0, 0, 'carriers', 'is-car', g.fs) + '</g>';
        }
        var on = c[3] < NN, kids = gSigns.children;
        set.forEach(function(sg, i){
          var e = kids[i], x = g.bx0 + g.BW * (i + 0.5) / k, num = ' ' + pct(sg.n) + '%', tw0 = signW(sg.lab, num, fs);
          var cont = dot * 2 + 7 + tw0, pw = Math.min(cap, Math.max(g.ph ? 84 : 120, cont + 18)), x0 = x - cont / 2;
          showEl(e, on); e.setAttribute('data-n', sg.n);
          e.children[1].setAttribute('x', n1(x - pw / 2)); e.children[1].setAttribute('width', n1(pw));
          e.children[2].setAttribute('cx', n1(x0 + dot));
          var t = e.children[3]; t.setAttribute('x', n1(x0 + dot * 2 + 7)); if(t.lastChild.data !== num) t.lastChild.data = num;
        });
        /* peas in bloom, once the bed has settled: name the hidden carriers on BOTH pq plots (A egg with a pollen, top
           right; a egg with A pollen, bottom left), each plot outlined, and both pills say the two together are 2pq, so
           a student who counts the labelled plants gets 2pq and not pq (review recheck 1). A pill runs across its plot,
           or turned along it when the plot is too narrow (a single column). */
        var n = nNow(), cg = kids[k], box = [cg.children[0], cg.children[1]], pills = [cg.children[2], cg.children[3]], pf = g.fs, ph2 = pf + 10;
        var show = on && SP.dom && !c[3] && !busy() && n > 0 && n < N;
        var plots = [[g.bx0, g.rows + n * g.rh, n * g.cw, (N - n) * g.rh], [g.bx0 + n * g.cw, g.rows, (N - n) * g.cw, n * g.rh]];
        var texts = [GN[1] + ': carriers (2pq)', GN[1] + ' (2pq)'];
        plots.forEach(function(pl, j){
          var at = null, x = pl[0], y = pl[1], w = pl[2], h = pl[3], cx = x + w / 2;
          if(show) for(var ti = 0; ti < texts.length && !at; ti++){
            var pw2 = pillW(texts[ti], pf);
            if(w >= pw2 + 6 && h >= ph2 + 2) at = [cx, clamp(y + h / 2 - g.rh * 0.3, y + ph2 / 2 + 1, y + h - ph2 / 2 - 1), texts[ti], 0];
            else if(h >= pw2 + 6 && w >= ph2 + 2) at = [cx, y + h / 2, texts[ti], 1];
          }
          setPill(pills[j], !!at, at ? at[0] : 0, at ? at[1] : 0, at ? at[2] : '', pf);
          if(at && at[3]) pills[j].setAttribute('transform', 'rotate(-90 ' + n1(at[0]) + ' ' + n1(at[1]) + ')'); else pills[j].removeAttribute('transform');
          showEl(box[j], show);
          if(show){ box[j].setAttribute('x', n1(x + 1.5)); box[j].setAttribute('y', n1(y + 1.5)); box[j].setAttribute('width', n1(Math.max(0, w - 3))); box[j].setAttribute('height', n1(Math.max(0, h - 3))); box[j].setAttribute('rx', 4); }
        });
      }
      var signFs = {};
      function layoutNow(){
        if(stage.hidden) return;
        var r = sceneBox.getBoundingClientRect(), Wd = Math.max(280, Math.round(r.width)), H = Math.max(300, Math.round(r.height));
        [under, svg, over].forEach(function(e){ e.setAttribute('viewBox', '0 0 ' + Wd + ' ' + H); e.setAttribute('width', Wd); e.setAttribute('height', H); });
        G = geo(Wd, H); signFs = {}; drawTop.k = '';
        cP.place([G.bx0, G.ty, G.bx1, G.ty]);
        // the pollen row is part of the control: a drag that starts on a pollen grain moves p too
        var gr = cP.el.querySelector('.tk2-groove'), top = G.tokY - G.tokR - 4;
        if(gr){ gr.style.height = n1(G.ty + 14 - top) + 'px'; gr.style.marginTop = n1(top - G.ty) + 'px'; }
        drawStatic(); drawTop(); drawPlants(); drawSigns.k = ''; drawSigns();
        if(cue.active()) cue.place();
      }

      /* ---------------------------------------------------- "?": the numbers behind this setting */
      var ref = document.createElement('div'); ref.className = 'ls-sec hw2-ref';
      function anyHtml(v){
        var p = clamp(M.round(v, 2), 0, 1), q = M.round(1 - p, 2);
        return '<div><dt>q = 1 − p</dt><dd>' + F(q, 2) + '</dd></div><div><dt>p² (' + GN[0] + ')</dt><dd>' + F(p * p, 3) + '</dd></div><div><dt>2pq (' + GN[1] + ')</dt><dd>' + F(2 * p * q, 3) + '</dd></div><div><dt>q² (' + GN[2] + ')</dt><dd>' + F(q * q, 3) + '</dd></div>';
      }
      function refHtml(){
        var f = freq(S.n), rows = [], id = T.nid('hwp');
        for(var n = 0; n <= N; n++){ var x = freq(n); rows.push([F(x.p, 1), F(x.q, 1), F(x.f[0], 2), F(x.f[1], 2), F(x.f[2], 2)]); }
        ref.innerHTML = '<p class="hw2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>' +
          '<h3 class="ls-title-l">This setting: p = ' + F(f.p, 1) + ', q = ' + F(f.q, 1) + '</h3>' +
          '<dl class="bt-readout"><div><dt>p² (' + GN[0] + ', ' + PH[0] + ')</dt><dd>' + F(f.f[0], 2) + '</dd></div><div><dt>2pq (' + GN[1] + ', ' + PH[1] + ')</dt><dd>' + F(f.f[1], 2) + '</dd></div><div><dt>q² (' + GN[2] + ', ' + PH[2] + ')</dt><dd>' + F(f.f[2], 2) + '</dd></div></dl>' +
          '<p class="bt-eq">p² + 2pq + q² = (' + F(f.p, 1) + ')² + 2(' + F(f.p, 1) + ')(' + F(f.q, 1) + ') + (' + F(f.q, 1) + ')² = ' + F(f.f[0], 2) + ' + ' + F(f.f[1], 2) + ' + ' + F(f.f[2], 2) + ' = 1</p>' +
          '<p class="bt-small">A plant is ' + GN[0] + ' only when its pollen grain and its egg both carry ' + A + ': p × p. It is ' + GN[2] + ' when both carry ' + a + ': q × q. It is ' + GN[1] + ' two ways (' + A + ' pollen with a ' + a + ' egg, or ' + a + ' pollen with an ' + A + ' egg): pq + pq = 2pq, the two pink plots.</p>' +
          '<h3 class="ls-title-l">Any p</h3><div class="hw2-any"><label for="' + id + '">p</label><input id="' + id + '" type="number" inputmode="decimal" min="0" max="1" step="0.01" value="' + F(f.p, 2) + '"><dl class="bt-readout" aria-live="polite">' + anyHtml(f.p) + '</dl></div>' +
          '<p class="bt-small">The bed moves in steps of 0.1 so that every plant is a whole plant. The equations hold for any p from 0 to 1.</p>' +
          '<h3 class="ls-title-l">Every setting of the bed</h3>' + T.dataTable(['p (' + A + ')', 'q (' + a + ')', 'p² (' + GN[0] + ')', '2pq (' + GN[1] + ')', 'q² (' + GN[2] + ')'], rows, 'Genotype frequencies for each allele frequency') +
          '<p class="bt-small">2pq is largest at p = q = 0.5. At p = 0 or p = 1 one allele is gone (the other is fixed) and no variation is left at this gene.</p>' +
          '<h3 class="ls-title-l">When this holds</h3><p class="bt-small">The shares p², 2pq and q² are expected only when nothing is changing the gene pool: a very large population, random mating, no mutation, no migration and no natural selection. Then the allele frequencies, and so these shares, stay the same generation after generation. <a class="hw2-next" href="hardy-weinberg-drift.html">See what changes them: drift, selection and migration <span aria-hidden="true">→</span></a></p>' +
          '<p class="bt-small">' + EX.note + '</p>';
      }
      ref.addEventListener('input', function(e){ if(!e.target.matches('.hw2-any input')) return; var v = parseFloat(e.target.value); if(isFinite(v)) ref.querySelector('.hw2-any dl').innerHTML = anyHtml(v); });
      ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(ctx.studio) ctx.studio.close(); if(S.mode !== 'explore' && ctx.studio && ctx.studio.kit2) ctx.studio.kit2.go('explore'); setTimeout(startTour, 60); });

      /* ---------------------------------------------------- Test yourself: set the alleles, then let it bloom */
      var dock = document.createElement('div'); dock.className = 'hw2-target';
      dock.innerHTML = '<div class="hw2-tq"></div><div class="hw2-go"><button type="button" class="btn-press sm">Let it bloom and check</button></div><div class="hw2-fb" role="status" aria-live="polite"></div>';
      var tq = dock.querySelector('.hw2-tq'), goBtn = dock.querySelector('.hw2-go button'), goWrap = dock.querySelector('.hw2-go'), fb = dock.querySelector('.hw2-fb');
      function lockKnob(on){ cP.input.disabled = !!on; cP.el.classList.toggle('is-locked', !!on); }
      function startAt(t){ var ans = t.p.map(function(v){ return Math.round(v * N); }), pool = [5, 3, 7, 4, 6].filter(function(v){ return ans.indexOf(v) < 0; }); return pool[0]; }
      function showTarget(next, again){
        if(!TG.length) return;
        if(next) Q.i = (Q.i + 1) % TG.length;
        if(Q.i < 0) Q.i = 0;
        var t = TG[Q.i];
        Q.t = t; Q.hidden = true; Q.done = false; if(!again){ Q.tried = false; Q.n = startAt(t); }
        after = null;
        setSp(t.sp);
        tq.innerHTML = '<p class="hw2-ask"><b>Target ' + (Q.i + 1) + ' of ' + TG.length + '.</b> ' + t.ask + '</p><p class="bt-small hw2-planted">' + (SP.dom ? 'Pea plants: ' + esc(A) + ' (' + esc(PH[0]) + ') is dominant over ' + esc(a) + ' (' + esc(PH[2]) + '), so ' + GN[0] + ' and ' + GN[1] + ' look the same. ' : 'Snapdragons: ' + GN[0] + ' ' + esc(PH[0]) + ', ' + GN[1] + ' ' + esc(PH[1]) + ', ' + GN[2] + ' ' + esc(PH[2]) + '. ') + 'The bed is planted but not in bloom yet. Drag the knob to set p, then let it bloom.</p>';
        fb.innerHTML = ''; goWrap.hidden = false; goBtn.disabled = false; lockKnob(false);
        cP.value(Q.n); snap(); drawnN = null;
        if(G){ drawTop(); drawPlants(); drawSigns(); }
      }
      /* On a phone the question is above the picture: bring the picture into view for the bloom. */
      function toScene(){
        var b = sceneBox.getBoundingClientRect(), vh = window.innerHeight || 800;
        if(b.top >= 0 && b.bottom <= vh) return false;
        try{ sceneBox.scrollIntoView({ block: 'center', behavior: K.reduced() ? 'auto' : 'smooth' }); }catch(e){ return false; }
        return true;
      }
      function check(){
        var t = Q.t, n = Q.n, f = freq(n), ok = t.p.some(function(v){ return Math.round(v * N) === n; }), first = !Q.tried;
        Q.done = true; Q.tried = true; goBtn.disabled = true; lockKnob(true);
        var away = toScene();
        setTimeout(function(){
          if(Q.t !== t || !Q.done) return;
          Q.hidden = false;
          after = function(){
            if(Q.t !== t) return;
            goWrap.hidden = true; var pl = tq.querySelector('.hw2-planted'); if(pl) pl.hidden = true;
            var got = pct(f.c[t.geno]);
            fb.innerHTML = '<p><span class="bio-mark ' + (ok ? 'ok">Right' : 'no">Not quite') + '</span> ' + (ok ? 'p = ' + F(f.p, 1) + ' gives ' + got + '% ' + PH[t.geno] + '.' : 'p = ' + F(f.p, 1) + ' and q = ' + F(f.q, 1) + ' give ' + got + '% ' + PH[t.geno] + ' (' + ['p²', '2pq', 'q²'][t.geno] + ' = ' + F(f.f[t.geno], 2) + '), not ' + t.pct + '%.') + '</p>' +
              (ok ? '<p>' + esc(t.why) + '</p>' : '<p>' + esc(t.hint) + ' Work back from the share to the allele frequency, then try again.</p>') +
              '<div class="bt-actions">' + (ok ? '' : '<button type="button" class="btn-press sm hw2-again">Try again</button>') + '<button type="button" class="' + (ok ? 'btn-press sm' : 'bt-btn') + ' hw2-nextt">Next target</button>' + (ok ? '' : '<button type="button" class="bt-btn hw2-show">Show the answer</button>') + T.report(SLUG + ':target-' + t.id) + '</div>';
            var ag = fb.querySelector('.hw2-again'), sh = fb.querySelector('.hw2-show');
            if(ag) ag.addEventListener('click', function(){ showTarget(false, true); goBtn.focus(); });
            if(sh) sh.addEventListener('click', function(){ sh.remove(); fb.querySelector('p').insertAdjacentHTML('afterend', '<p><b>Answer: p = ' + t.p.map(function(v){ return F(v, 1); }).join(' or ') + '.</b> ' + esc(t.why) + '</p>'); });
            fb.querySelector('.hw2-nextt').addEventListener('click', function(){ showTarget(true); var q0 = tq.querySelector('.hw2-ask'); q0.setAttribute('tabindex', '-1'); q0.focus(); });
            if(away) setTimeout(function(){ try{ fb.scrollIntoView({ block: 'start', behavior: K.reduced() ? 'auto' : 'smooth' }); }catch(e){} }, 500);
            if(first) T.record(SLUG, [{ id: SLUG + ':target-' + t.id, correct: ok, topic: data.topic, level: 'apply', diff: 2, group: 'target' }]);
          };
          changed(true);
          if(!tw && after){ var fn = after; after = null; fn(); }
        }, away ? 450 : 0);
      }
      goBtn.addEventListener('click', function(){ if(Q.t && !Q.done) check(); });

      /* ---------------------------------------------------- the two modes (the adapter calls shown) */
      function shown_(mode, part){
        S.mode = mode; S.part = part;
        tour.stop(); after = null;
        var ex = mode === 'explore';
        stage.setAttribute('data-view', ex ? 'explore' : 'target');
        head.el.hidden = !ex; cause.el.hidden = !ex; lines.hidden = !ex;
        if(ex){ setSp('snap'); lockKnob(false); cP.value(S.n); snap(); drawnN = null; wKey = ''; syncWords(); refHtml(); }
        else { hideCue(false); if(part === 'target'){ if(Q.i < 0 || Q.done) showTarget(Q.i < 0 || Q.done && Q.tried); else { cP.value(Q.n); snap(); drawnN = null; lockKnob(false); } } }
        if(mode === 'quiz' && part !== 'target') return;
        setTimeout(function(){ layoutNow(); if(ex && !tour.active()) cue.show(); }, 30);
      }

      // The page's own blocks: the intro, the equations and the calculations (the adapter moves them).
      T.skillTool(app, data, { slug: SLUG, kind: 'hw', stage: pstage });
      ctx.kit2 = { stage: stage, ref: ref,
        parts: [{ value: 'target', label: 'Set the alleles', dock: dock, task: { kicker: 'Set the alleles', title: 'Hit the target', todo: 'Drag the knob on the bed, then let it bloom.' } },
          { value: 'practice', label: 'Problems', practice: true }],
        onShow: function(m, p){ shown_(m, p); } };
      cause.set(chain()); refHtml();
      // Without the frame (no Tool Studio on the page) the stage still works on its own, above the calculations.
      if(!ctx.studio){ app.insertBefore(stage, app.firstChild); app.insertBefore(ref, stage.nextSibling); shown_('explore', null); }
      // a theme switch recolours the plant images
      if(window.MutationObserver) new MutationObserver(function(){ if(G) sprites(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ mCache = {}; signFs = {}; sw0 = {}; drawTop.k = ''; drawTop(); drawSigns.k = ''; drawSigns(); });
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(layoutNow, 50); }).observe(sceneBox); }
      else window.addEventListener('resize', layoutNow);
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApBioBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var l2 = document.createElement('link'); l2.rel = 'stylesheet'; l2.href = (window.ApBioBase || '../') + 'assets/tools/hardy-weinberg.css'; document.head.appendChild(l2);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
