/* Simulator: cell cycle checkpoints (Unit 4). The model is in
   bio-tool-math.js (ApBioMath.cellCycle); its numbers, the mutations, the
   outputs, the "How this model works" box, the questions and the mini FRQ
   are data (bio/data/tools/cell-cycle-checkpoints.json). The student sets
   growth factor, DNA damage, mutations and a spindle poison, reads the dish
   at a chosen hour (the cycle figure, a readout and tables), plots any output
   over time, the DNA content histogram, or an output against growth factor,
   and runs trials that land as points.

   Job: see what each checkpoint checks, and what goes wrong when one fails.

   Tools upgrade (U-Bio-sims): the cycle ring is the stage, above the
   controls. Cells are dots flowing round the ring (dots per phase in
   proportion to the model's counts; flow speed from its division rate),
   held cells pile up beside their checkpoint, resting cells sit in G0. Each
   checkpoint is a button on the ring: tap it to read what it checks and what
   it is doing right now. "Find the broken checkpoint": a mystery dish (a
   lost p53, a G1 checkpoint that ignores growth factor, a spindle poison, or
   normal cells) runs on the ring; the student taps the checkpoint at fault
   and picks what is wrong; recorded as cell-cycle-checkpoints:find-<case>:a. */
(function(){
  'use strict';
  var SLUG = 'cell-cycle-checkpoints';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  T.mount(SLUG, function(app, data, ctx){
    var esc = T.esc, F = T.F, C = M.cellCycle, P = data.model;
    var view = 'time', runs = [];
    var st = { gf: data.growthFactor.value, damage: data.damage.value, readT: data.readTime.value, p53: false, rb: false, cycd: false, ras: false, spindle: false, out: 'pctG1' };
    var outOf = function(id){ return data.outputs.filter(function(o){ return o.id === id; })[0]; };
    var KEYS = data.mutations.map(function(m){ return m.id; }).concat(data.drugs.map(function(d){ return d.id; }));
    var BIN_SHORT = ['2', '2–2.5', '2.5–3', '3–3.5', '3.5–4', '4'];

    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
      '<section class="bt-card cc-card" aria-labelledby="cc-h"><h2 id="cc-h">The model</h2>' +
      '<div class="os-modes" role="group" aria-label="Mode"><button type="button" class="bt-btn" data-m="explore" aria-pressed="true">Explore</button><button type="button" class="bt-btn" data-m="find" aria-pressed="false">Find the broken checkpoint</button></div>' +
      '<div class="bt-fig cc-ringfig bt-hero"></div><p class="bt-first cc-tip">Tap a checkpoint on the ring to see what it checks.</p><div class="cc-gate os-why" role="status" aria-live="polite"></div>' +
      '<div class="os-chal cc-chal" hidden></div>' +
      '<div class="bt-controls" data-primary="2"></div>' +
      '<div class="cc-plots bt-num"><div><div class="bt-tabs" role="group" aria-label="Graph">' +
      '<button type="button" class="bt-btn" data-v="time" aria-pressed="true">Over time</button><button type="button" class="bt-btn" data-v="hist" aria-pressed="false">DNA content</button><button type="button" class="bt-btn" data-v="gf" aria-pressed="false">Against growth factor</button>' +
      '</div><div class="bt-plotwrap"></div></div></div>' +
      '<dl class="bt-readout"></dl><p class="bt-summary"></p>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm" data-a="run">Run one trial</button><button type="button" class="btn-press sm alt" data-a="series">Run a series</button><button type="button" class="bt-btn" data-a="clear">Clear runs</button></div>' +
      '<p class="bt-small bt-runnote" role="status" aria-live="polite"></p>' +
      '<details class="bt-data"><summary>Data tables: your runs, the dish over time and the DNA content</summary><div class="bt-tables"></div></details></section>' +
      '<section class="bt-card" aria-labelledby="cc-q"><h2 id="cc-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');
    var card = app.querySelector('.bt-card'), ctl = card.querySelector('.bt-controls');
    var fig = card.querySelector('.cc-ringfig'), gateBox = card.querySelector('.cc-gate'), chalBox = card.querySelector('.cc-chal');
    var mode = 'explore', gateSel = null, last = null, find = null;
    var say = T.announcer(card.querySelector('.bt-summary'));

    var sGF = T.slider({ label: 'Growth factor', min: data.growthFactor.min, max: data.growthFactor.max, step: data.growthFactor.step, value: st.gf, unit: data.growthFactor.unit, decimals: 0, hint: '100% keeps every normal cell cycling.', onInput: function(v){ st.gf = v; update(); } });
    var sDam = T.slider({ label: 'DNA damage', min: data.damage.min, max: data.damage.max, step: data.damage.step, value: st.damage, unit: data.damage.unit, decimals: 1, hint: 'The share of undamaged cells that get damaged DNA each hour.', onInput: function(v){ st.damage = v; update(); } });
    var sRead = T.slider({ label: 'Read the dish at', min: data.readTime.min, max: data.readTime.max, step: data.readTime.step, value: st.readT, unit: 'h', decimals: 0, onInput: function(v){ st.readT = v; update(); } });
    var outSel = T.choiceSelect({ label: 'Output to plot', value: st.out, options: data.outputs.map(function(o){ return { value: o.id, label: o.name }; }), onChange: function(v){ st.out = v; update(true); } });
    ctl.appendChild(sGF.el);
    function checks(legend, list){
      var fs = document.createElement('fieldset');
      fs.className = 'bt-ctl bt-checks';
      fs.innerHTML = '<legend>' + esc(legend) + '</legend>' + list.map(function(m){
        var id = T.nid('cc-' + m.id);
        return '<div class="bt-check-row"><input type="checkbox" id="' + id + '" data-k="' + esc(m.id) + '"><label for="' + id + '">' + esc(m.name) + '</label></div>';
      }).join('');
      fs.querySelectorAll('input').forEach(function(b){ b.addEventListener('change', function(){ st[b.getAttribute('data-k')] = b.checked; update(true); }); });
      ctl.appendChild(fs);
    }
    checks('Mutations (from 0 h)', data.mutations);
    [sDam, sRead].forEach(function(c){ ctl.appendChild(c.el); });
    checks('Drug (from 0 h)', data.drugs);
    ctl.appendChild(outSel.el);

    card.querySelectorAll('.bt-tabs .bt-btn').forEach(function(b){
      b.addEventListener('click', function(){
        view = b.getAttribute('data-v');
        card.querySelectorAll('.bt-tabs .bt-btn').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        update(true);
      });
    });
    card.querySelector('[data-a="run"]').addEventListener('click', function(){ run([st.gf]); });
    card.querySelector('[data-a="series"]').addEventListener('click', function(){ run(data.series); });
    card.querySelector('[data-a="clear"]').addEventListener('click', function(){ runs = []; card.querySelector('.bt-runnote').textContent = 'Runs cleared.'; update(true); });

    /* The model's condition: growth factor and damage as fractions, p53 working unless lost. */
    function cond(over){
      var c = { gf: st.gf / 100, damage: st.damage / 100, p53: !st.p53, rb: st.rb, cycd: st.cycd, ras: st.ras, spindle: st.spindle };
      for(var k in over) c[k] = over[k];
      return c;
    }
    function mutated(){ return st.p53 || st.rb || st.cycd || st.ras; }
    var NOMUT = { p53: true, rb: false, cycd: false, ras: false };
    function sim(over){ return C.simulate(P, cond(over || {})); }
    function setText(o){
      var d = [];
      data.mutations.forEach(function(m){ if(o[m.id]) d.push(m.name.replace(/ \(.*\)$/, '')); });
      if(o.spindle) d.push('spindle poison');
      return d.length ? d.join(', ') : 'normal cells';
    }
    function val(a, id){ return a[id]; }
    function lc(s){ return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
    function grp(x){ return F(x, 0).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    function show(a, id){ var o = outOf(id); return o.d === 0 ? grp(val(a, id)) : F(val(a, id), o.d); }
    function run(gfs){
      gfs.forEach(function(g){
        var a = C.at(sim({ gf: g / 100 }), st.readT), r = { n: runs.length + 1, gf: g, damage: st.damage, readT: st.readT, v: {} };
        KEYS.forEach(function(k){ r[k] = st[k]; });
        data.outputs.forEach(function(o){ r.v[o.id] = a[o.id]; });
        runs.push(r);
      });
      T.event('apbio-sim-run', { tool: SLUG, n: gfs.length });
      var last = runs[runs.length - 1];
      card.querySelector('.bt-runnote').textContent = gfs.length === 1 ? 'Trial ' + last.n + ' at ' + st.readT + ' h: ' + F(last.v.divRate, 2) + ' divisions per 100 cells per hour, ' + F(last.v.pctG1, 1) + '% of cells in G1 or G0.' : 'Ran ' + gfs.length + ' dishes from 0% to 100% growth factor. They appear as points on the graph against growth factor and in the data table.';
      if(gfs.length > 1 && view !== 'gf') card.querySelector('[data-v="gf"]').click(); else update(true);
    }
    function arc(cx, cy, r, a0, a1){
      var p = function(a){ var t = (a - 90) * Math.PI / 180; return (cx + r * Math.cos(t)).toFixed(1) + ' ' + (cy + r * Math.sin(t)).toFixed(1); };
      return 'M' + p(a0) + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p(a1);
    }
    /* ------------------------------------------------ the ring */
    var CX = 200, CY = 192, R = 118, TOT = P.G1 + P.S + P.G2 + P.M, NDOT = 72;
    function deg(h){ return 360 * h / TOT; }
    var A1 = deg(P.G1), AS = A1 + deg(P.S), A2 = AS + deg(P.G2);
    var SEG = [['G1', 0, A1], ['S', A1, AS], ['G2', AS, A2], ['M', A2, 360]];
    function pol(ang, r){ var t = (ang - 90) * Math.PI / 180; return [CX + r * Math.cos(t), CY + r * Math.sin(t)]; }
    var GATES = { g1: { ang: A1, name: 'G1 checkpoint' }, g2: { ang: A2, name: 'G2 checkpoint' }, m: { ang: 358, name: 'M checkpoint' } };
    /* What each gate checks and what it is doing now (from the model's counts). */
    function gateText(k, a, o){
      var n = function(x){ return F(x, 0); };
      if(k === 'g1'){
        var sig = o.rb || o.cycd || o.ras;
        return 'G1 checkpoint: checks for DNA damage (p53) and for a growth signal (Rb holds the cycle until growth factor, through cyclin D–CDK, releases it). ' +
          (o.p53 ? 'p53 is lost, so damaged cells are not stopped here. ' : a.held1 >= 0.5 ? 'Now holding ' + n(a.held1) + ' cells with damaged DNA while they repair or die by apoptosis. ' : 'No damaged cells to hold right now. ') +
          (sig ? 'The growth-signal check is broken (' + setText({ rb: o.rb, cycd: o.cycd, ras: o.ras }) + '): cells pass whatever the growth factor, so none rest in G0.' : (F(100 * a.G0 / a.N, 0) + '% of cells rest in G0, waiting for growth factor.'));
      }
      if(k === 'g2') return 'G2 checkpoint: checks that DNA was copied completely and is undamaged before mitosis. ' + (a.held2 >= 0.5 ? 'Now holding ' + n(a.held2) + ' damaged cells' + (o.p53 ? '; without p53 the hold does not last, so some slip into M still damaged.' : '.') : 'No cells held right now.');
      return 'M checkpoint (spindle checkpoint): checks that every chromosome is attached to the spindle before the chromatids separate. ' + (o.spindle ? 'The spindle poison stops a spindle forming, so the checkpoint is holding ' + n(a.heldM) + ' cells in M: it is working, and the cells cannot divide.' : 'Every chromosome attaches, so cells pass and divide.');
    }
    /* A strip of cells as they look in each phase (under the ring): G0 a
       flattened resting cell; G1 a small cell, loose chromatin; S chromatin
       being copied (doubled threads), a duplicated centrosome; G2 a larger
       cell, two centrosomes; M a metaphase cell, condensed sister-chromatid
       chromosomes on the plate with spindle fibers from two poles. */
    function chromo(x, y, a, h, cls){ // an X-shaped replicated chromosome: two chromatids joined at a centromere
      var r = (a * 180 / Math.PI).toFixed(0);
      return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + r + ')" class="cc-chr ' + (cls || '') + '"><path d="M-' + (h * 1.25) + ' -2.2Q0 -0.6 ' + (h * 1.25) + ' -2.2M-' + (h * 1.25) + ' 2.2Q0 0.6 ' + (h * 1.25) + ' 2.2"/><circle r="1.4"/></g>';
    }
    function phaseCell(k, x, y){
      var s = [];
      if(k === 'G0'){
        s.push('<path class="cc-cm" d="M' + (x - 32) + ' ' + (y + 4) + 'C' + (x - 22) + ' ' + (y - 14) + ' ' + (x + 20) + ' ' + (y - 16) + ' ' + (x + 32) + ' ' + (y - 2) + 'C' + (x + 26) + ' ' + (y + 12) + ' ' + (x - 18) + ' ' + (y + 16) + ' ' + (x - 32) + ' ' + (y + 4) + 'Z"/>');
        s.push('<ellipse class="cc-nu" cx="' + (x - 2) + '" cy="' + y + '" rx="10" ry="6.5"/><circle class="cc-nl" cx="' + x + '" cy="' + (y - 1) + '" r="2"/>');
      } else {
        var R0 = k === 'G1' ? 19 : k === 'S' ? 21 : 24, nr = k === 'G1' ? 9 : k === 'S' ? 10.5 : 11.5;
        s.push('<circle class="cc-cm" cx="' + x + '" cy="' + y + '" r="' + R0 + '"/>');
        if(k === 'M'){
          // spindle from two poles to the chromosomes on the plate
          var poles = [[x - 19, y], [x + 19, y]], ys = [-11, -4, 4, 11];
          poles.forEach(function(p){ ys.forEach(function(dy){ s.push('<path class="cc-sp" d="M' + p[0] + ' ' + p[1] + 'L' + x + ' ' + (y + dy) + '"/>'); }); s.push('<path class="cc-sp" d="M' + p[0] + ' ' + p[1] + 'l' + (p[0] < x ? -3 : 3) + ' -6M' + p[0] + ' ' + p[1] + 'l' + (p[0] < x ? -3 : 3) + ' 6"/>'); s.push('<circle class="cc-cs" cx="' + p[0] + '" cy="' + p[1] + '" r="2.4"/>'); });
          ys.forEach(function(dy, n){ s.push(chromo(x, y + dy, Math.PI / 2 + 0.12 * (n % 2 ? 1 : -1), 2.7, n % 2 ? 'b' : '')); });
        } else {
          s.push('<circle class="cc-nu" cx="' + x + '" cy="' + y + '" r="' + nr + '"/>');
          // chromatin: loose threads (one copy in G1; S partly doubled; G2 fully doubled, a little more compact)
          var tangle = function(ph, frac){ var d = '', n = Math.round(90 * frac); for(var i = 0; i <= n; i++){ var t = i / 90 * Math.PI * 2, rr = nr * (0.32 + 0.38 * Math.abs(Math.sin(2.5 * t + ph))); d += (i ? 'L' : 'M') + (x + rr * Math.cos(3 * t + ph)).toFixed(1) + ' ' + (y + rr * Math.sin(2 * t + ph * 0.5)).toFixed(1); } return d; };
          var th = tangle(0.3, 1);
          s.push('<path class="cc-chrt" d="' + th + '"/>');
          if(k !== 'G1') s.push('<path class="cc-chrt b" transform="translate(1.1 1.1)" d="' + tangle(0.3, k === 'S' ? 0.45 : 1) + '"/>');
          s.push('<circle class="cc-nl" cx="' + (x + 2) + '" cy="' + (y - 1) + '" r="2.4"/>');
          // centrosome (a pair of centrioles) beside the nucleus: one in G1, duplicated from S on
          var cs = k === 'G1' ? [[x + nr + 3.5, y - nr + 2]] : [[x + nr + 3, y - nr + 1], [x + nr + 5.5, y - nr + 6]];
          cs.forEach(function(c){ s.push('<g class="cc-cen" transform="translate(' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + ')"><rect x="-2.2" y="-0.9" width="4.4" height="1.8" rx=".8"/><rect x="-0.9" y="-2.2" width="1.8" height="4.4" rx=".8" transform="translate(1.6 1.6)"/></g>'); });
        }
      }
      return s.join('');
    }
    function figure(a, o, hide){
      o = o || st; last = { a: a, o: o, hide: hide };
      var parts = [];
      SEG.forEach(function(sg, i){ parts.push('<path class="ph ' + ['g1', 's', 'g2', 'm'][i] + '" d="' + arc(CX, CY, R, sg[1] + 1, sg[2] - 1) + '"/>'); });
      var pct = function(x){ return F(100 * x / a.N, 0) + '%'; };
      var lab = function(ang, rr, txt, cls){ var q = pol(ang, rr); return '<text' + (cls ? ' class="' + cls + '"' : '') + ' x="' + q[0].toFixed(1) + '" y="' + (q[1] + 4).toFixed(1) + '" text-anchor="middle">' + txt + '</text>'; };
      parts.push(lab(A1 / 2, R + 30, 'G1 ' + pct(a.G1), 'cc-ph'), lab((A1 + AS) / 2, R + 30, 'S ' + pct(a.S), 'cc-ph'), lab((AS + A2) / 2, R + 34, 'G2 ' + pct(a.G2), 'cc-ph'), lab(344, R - 30, 'M ' + pct(a.M), 'cc-ph'));
      parts.push('<g class="cc-dots"></g>');
      // G0 pool: resting cells gather in the middle
      parts.push('<circle class="g0" cx="' + CX + '" cy="' + CY + '" r="52"/>' + phaseCell('G0', CX, CY - 22) + '<text x="' + CX + '" y="' + (CY + 6) + '" text-anchor="middle">G0 ' + pct(a.G0) + '</text><g class="cc-g0"></g>');
      // what a cell looks like in each phase
      var strip = [['G0', 'G0'], ['G1', 'G1'], ['S', 'S'], ['G2', 'G2'], ['M', 'M']];
      parts.push('<line class="cc-sep" x1="20" x2="380" y1="' + (CY + R + 46) + '" y2="' + (CY + R + 46) + '"/>');
      strip.forEach(function(q, i){ var x = 40 + i * 80, y = CY + R + 84; parts.push('<g class="cc-pc"><g transform="translate(' + x + ' ' + y + ') scale(1.22) translate(' + (-x) + ' ' + (-y) + ')">' + phaseCell(q[0], x, y) + '</g><text class="cc-pcl" x="' + x + '" y="' + (y + 44) + '" text-anchor="middle">' + q[1] + '</text></g>'); });
      parts.push('<text class="note" x="' + CX + '" y="16" text-anchor="middle">' + grp(a.N) + ' cells' + (hide ? '' : ' · ' + F(a.divRate, 2) + ' divisions per 100 cells per h') + '</text>');
      // gates as buttons
      Object.keys(GATES).forEach(function(k){
        var gt = GATES[k], held = k === 'g1' ? a.held1 : k === 'g2' ? a.held2 : a.heldM, p1 = pol(gt.ang, R - 18), p2 = pol(gt.ang, R + 18), lb = k === 'g1' ? pol(gt.ang + 4, R + 40) : pol(gt.ang + (k === 'm' ? 6 : -6), R + 30);
        var on = held >= 0.5, sel = gateSel === k;
        parts.push('<g class="cc-gatebtn' + (sel ? ' sel' : '') + '" data-g="' + k + '" role="button" tabindex="0" aria-pressed="' + sel + '" aria-label="' + esc(gt.name + (on ? ', holding ' + F(held, 0) + ' cells' : '')) + '">' +
          '<circle class="cc-hit" cx="' + pol(gt.ang, R)[0].toFixed(1) + '" cy="' + pol(gt.ang, R)[1].toFixed(1) + '" r="24"/>' +
          '<line class="ckp' + (on ? ' hold' : '') + '" x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) + '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1) + '"/>' +
          '<text class="cc-glab" x="' + lb[0].toFixed(1) + '" y="' + (lb[1] + 4).toFixed(1) + '" text-anchor="' + (k === 'g1' ? 'middle' : k === 'g2' ? 'end' : 'start') + '">' + gt.name.replace(' checkpoint', '') + ' check' + (on ? ': ' + F(held, 0) + ' held' : '') + '</text></g>');
      });
      var desc = (hide ? 'Mystery dish: ' : 'The cell cycle at ' + st.readT + ' h, ' + setText(o) + ': ') + pct(a.G0) + ' of cells in G0, ' + pct(a.G1) + ' in G1, ' + pct(a.S) + ' in S, ' + pct(a.G2) + ' in G2 and ' + pct(a.M) + ' in M, out of ' + grp(a.N) + ' cells. Held: ' + F(a.held1, 0) + ' at G1, ' + F(a.held2, 0) + ' at G2, ' + F(a.heldM, 0) + ' at M.';
      fig.innerHTML = '<svg class="cc-fig cc-ring" viewBox="0 0 400 488" role="group" aria-label="' + esc(desc) + '">' + parts.join('') + '</svg>';
      fig.querySelectorAll('.cc-gatebtn').forEach(function(g){
        var go = function(){ pickGate(g.getAttribute('data-g')); };
        g.addEventListener('click', go);
        g.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
      });
      buildDots(a);
      if(gateSel && mode === 'explore') gateBox.textContent = gateText(gateSel, a, o);
    }
    /* Dots: NDOT cells shared out by phase; held ones stack outside the ring
       at their gate; G0 ones sit in the box. Positions move each frame. */
    var dots = [], spin = 0, rafId = 0, visible = true;
    function buildDots(a){
      var share = function(x){ return Math.round(NDOT * x / a.N); };
      var h1 = Math.min(10, share(a.held1)), h2 = Math.min(10, share(a.held2)), hm = Math.min(16, share(a.heldM));
      var nG = { G1: share(a.G1 - a.held1), S: share(a.S), G2: share(a.G2 - a.held2), M: share(a.M - a.heldM) };
      dots = [];
      SEG.forEach(function(sg){ var n = nG[sg[0]]; for(var i = 0; i < n; i++) dots.push({ seg: sg, u: (i + 0.5) / n }); });
      var pile = function(k, n){ for(var i = 0; i < n; i++) dots.push({ gate: k, i: i }); };
      pile('g1', h1); pile('g2', h2); pile('m', hm);
      var g0 = Math.min(14, share(a.G0)); for(var j = 0; j < g0; j++) dots.push({ g0: j });
      spin = Math.max(0, Math.min(0.12, a.divRate / 2.7 * 0.06));
      drawDots(0);
      kick();
    }
    function drawDots(tm){
      var g = fig.querySelector('.cc-dots'), g0 = fig.querySelector('.cc-g0');
      if(!g) return;
      var out = [], out0 = [];
      dots.forEach(function(d){
        var x, y;
        if(d.seg){ var u = (d.u + tm * spin) % 1, ang = d.seg[1] + 2 + (d.seg[2] - d.seg[1] - 4) * u, q = pol(ang, R); x = q[0]; y = q[1]; }
        else if(d.gate){ var gt = GATES[d.gate], row = Math.floor(d.i / 4), col = d.i % 4, q2 = pol(d.gate === 'm' ? 10 : d.gate === 'g2' ? gt.ang - 16 : gt.ang - 5, R - 30 - row * 9); x = q2[0] + (col - 1.5) * 9; y = q2[1]; }
        else { x = CX - 30 + (d.g0 % 7) * 10; y = CY + 20 + Math.floor(d.g0 / 7) * 10; }
        var c = '<g class="cc-cell' + (d.gate ? ' held' : '') + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (d.g0 != null ? 3.6 : 4.4) + '"/><circle class="n" cx="' + (x + 0.6).toFixed(1) + '" cy="' + (y - 0.4).toFixed(1) + '" r="' + (d.g0 != null ? 1.4 : 1.8) + '"/></g>';
        if(d.g0 != null) out0.push(c); else out.push(c);
      });
      g.innerHTML = out.join(''); g0.innerHTML = out0.join('');
    }
    function reducedM(){ try{ return window.LevlMotion ? window.LevlMotion.reduced() : matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
    function kick(){
      if(rafId || reducedM() || !visible || !window.requestAnimationFrame) return;
      var t0 = performance.now();
      var loop = function(ts){ rafId = 0; if(!visible) return; drawDots((ts - t0) / 1000); rafId = requestAnimationFrame(loop); };
      rafId = requestAnimationFrame(loop);
    }
    if(window.IntersectionObserver) new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if(visible) kick(); }).observe(fig);
    function pickGate(k){
      gateSel = gateSel === k && mode === 'explore' ? null : k;
      if(mode === 'find'){ findPick(k); return; }
      gateBox.textContent = gateSel ? gateText(gateSel, last.a, last.o) : '';
      fig.querySelectorAll('.cc-gatebtn').forEach(function(g){ var on = g.getAttribute('data-g') === gateSel; g.classList.toggle('sel', on); g.setAttribute('aria-pressed', String(on)); });
    }

    /* --------------------------- find the broken checkpoint */
    var CASES = [
      { id: 'p53', gate: 'g1', fault: 'damage', set: function(g){ return { gf: 1, damage: g.pick([0.02, 0.03, 0.04]), p53: false, rb: false, cycd: false, ras: false, spindle: false }; } },
      { id: 'growth', gate: 'g1', fault: 'signal', set: function(g){ var w = g.pick(['rb', 'cycd', 'ras']), c = { gf: g.pick([0, 0.1, 0.2]), damage: g.pick([0, 0.01]), p53: true, rb: false, cycd: false, ras: false, spindle: false }; c[w] = true; c.which = w; return c; } },
      { id: 'spindle', gate: 'm', fault: 'working', set: function(g){ return { gf: 1, damage: 0, p53: true, rb: false, cycd: false, ras: false, spindle: true }; } },
      { id: 'normal', gate: 'none', fault: 'none', set: function(g){ return { gf: g.pick([0.1, 0.2, 1]), damage: g.pick([0.01, 0.02]), p53: true, rb: false, cycd: false, ras: false, spindle: false }; } }
    ];
    var FAULTS = {
      g1: [['damage', 'It lets cells with damaged DNA into S phase'], ['signal', 'It lets cells divide without growth factor'], ['ok', 'Nothing: it is working']],
      g2: [['damage', 'It lets cells with damaged DNA into mitosis'], ['ok', 'Nothing: it is working']],
      m: [['broken', 'It lets chromatids separate before every chromosome is attached'], ['working', 'Nothing: it is holding cells that have no spindle, which is its job']],
      none: [['none', 'Every checkpoint is working normally']]
    };
    var findN = 0, findSeed = 1 + Math.floor(Math.random() * 99999);
    function newFind(){
      var g = M.rng(findSeed + 7919 * findN), cs = CASES[(findN + g.int(0, 3)) % 4]; findN++;
      var c = cs.set(g), a = C.at(C.simulate(P, c), 24);
      find = { cs: cs, c: c, a: a, gate: null, done: false };
      gateSel = null;
      figure(a, { p53: !c.p53, rb: c.rb, cycd: c.cycd, ras: c.ras, spindle: c.spindle }, true);
      var clue = [['Growth factor', F(c.gf * 100, 0) + '%'], ['DNA damage', F(c.damage * 100, 1) + '% per h'], ['Cells after 24 h (from 1,000)', grp(a.N)], ['In G0', F(100 * a.G0 / a.N, 0) + '%'], ['Divisions by cells with damaged DNA', F(a.pctDivDam, 1) + '%'], ['Held at G1 / G2 / M', F(a.held1, 0) + ' / ' + F(a.held2, 0) + ' / ' + F(a.heldM, 0)]];
      chalBox.innerHTML = '<p class="os-chal-q" tabindex="-1"><b>Mystery dish ' + findN + '.</b> Something may be wrong with these cells, read 24 h after plating. Tap the checkpoint at fault on the ring (or "All working"), then say what is wrong.</p>' +
        '<dl class="bt-readout">' + clue.map(function(x){ return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') + '</dl>' +
        '<div class="bt-actions"><button type="button" class="bt-btn cc-none">All working</button></div><div class="cc-find-q"></div><div class="os-chal-fb" role="status" aria-live="polite"></div>';
      chalBox.querySelector('.cc-none').addEventListener('click', function(){ findPick('none'); });
      gateBox.textContent = '';
    }
    function findPick(k){
      if(!find || find.done) return;
      find.gate = k; gateSel = k === 'none' ? null : k;
      figure(find.a, last.o, true);
      var q = chalBox.querySelector('.cc-find-q'), id = 'ccf' + findN;
      q.innerHTML = '<fieldset class="os-ask"><legend>' + (k === 'none' ? 'All working' : esc(GATES[k].name)) + ': what is wrong?</legend>' + FAULTS[k].map(function(f, i){ return '<div class="bt-radio"><input type="radio" name="' + id + '" id="' + id + i + '" value="' + f[0] + '"><label for="' + id + i + '">' + esc(f[1]) + '</label></div>'; }).join('') + '</fieldset><div class="bt-actions"><button type="button" class="btn-press sm cc-check">Check</button></div>';
      q.querySelector('.cc-check').addEventListener('click', function(){
        var pick = q.querySelector('input:checked'), fb = chalBox.querySelector('.os-chal-fb');
        if(!pick){ fb.textContent = 'Pick what is wrong first.'; return; }
        find.done = true;
        q.querySelectorAll('input,button').forEach(function(x){ x.disabled = true; });
        var cs = find.cs, ok = (k === cs.gate || (cs.id === 'p53' && k === 'g2')) && pick.value === cs.fault;
        var o = { p53: !find.c.p53, rb: find.c.rb, cycd: find.c.cycd, ras: find.c.ras, spindle: find.c.spindle };
        var ans = cs.id === 'p53' ? 'p53 is lost. The G1 checkpoint no longer stops cells with damaged DNA (and the G2 hold does not last), so ' + F(find.a.pctDivDam, 0) + '% of divisions are by damaged cells and none die by apoptosis.'
          : cs.id === 'growth' ? setText(o).replace(/^./, function(x){ return x.toUpperCase(); }) + '. The G1 checkpoint ignores the growth-factor signal, so with only ' + F(find.c.gf * 100, 0) + '% growth factor no cells rest in G0 and the dish keeps growing: the start of a tumor.'
          : cs.id === 'spindle' ? 'A spindle poison. No checkpoint is broken: with no spindle no chromosome can attach, so the M checkpoint holds ' + F(find.a.heldM, 0) + ' cells in M and none divide. That is how such drugs stop cancer cells.'
          : 'Normal cells. Damaged cells are held and repaired or removed, and cells without enough growth factor rest in G0.';
        fb.innerHTML = '<p><span class="bio-mark ' + (ok ? 'ok">Right' : 'no">Not quite') + '</span> ' + esc(ans) + '</p><div class="bt-actions"><button type="button" class="btn-press sm os-next">Next dish</button>' + T.report(SLUG + ':find-' + cs.id) + '</div>';
        gateSel = cs.gate === 'none' ? null : cs.gate;
        figure(find.a, o, false);
        if(gateSel) gateBox.textContent = gateText(gateSel, find.a, o);
        fb.querySelector('.os-next').addEventListener('click', function(){ newFind(); chalBox.querySelector('.os-chal-q').focus(); });
        T.record(SLUG, [{ id: SLUG + ':find-' + cs.id + ':a', correct: ok, topic: data.topic, level: 'analyze', diff: 2, group: 'find' }]);
      });
    }
    function setMode(m){
      if(m === mode) return;
      mode = m;
      card.querySelectorAll('[data-m]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-m') === m)); });
      var f = m === 'find';
      chalBox.hidden = !f;
      ['.bt-controls', '.cc-plots', '.bt-readout', '.bt-summary', '.bt-buttons', '.bt-data', '.bt-runnote', '.cc-tip'].forEach(function(sel){ card.querySelectorAll(sel).forEach(function(el){ if(!chalBox.contains(el)) el.hidden = f; }); });
      gateSel = null; gateBox.textContent = '';
      if(f) newFind(); else { find = null; update(true); }
    }
    card.querySelectorAll('[data-m]').forEach(function(b){ b.addEventListener('click', function(){ setMode(b.getAttribute('data-m')); }); });
    function sameSet(r){ return r.damage === st.damage && r.readT === st.readT && KEYS.every(function(k){ return r[k] === st[k]; }); }
    function update(now){
      var s = sim(), a = C.at(s, st.readT), ref = mutated() ? sim(NOMUT) : null, o = outOf(st.out), spec, title;
      if(mode === 'explore') figure(a);
      var refWord = ref ? ' (solid) and normal cells under the same conditions (dashed)' : '';
      if(view === 'time'){
        var pts = function(x){ return x.map(function(e){ return [e.t, e[o.id]]; }); };
        var top = Math.max.apply(null, s.map(function(e){ return e[o.id]; }).concat(ref ? ref.map(function(e){ return e[o.id]; }) : []).concat([o.unit === '%' ? 0 : 1]));
        var ymax = o.unit === '%' || o.unit === '% of divisions' ? (top > 50 ? 100 : T.niceMax(Math.max(top * 1.1, 1))) : T.niceMax(top * 1.05);
        title = 'Graph of ' + lc(o.name) + ' over 72 hours, ' + setText(st) + refWord + '. The vertical line marks ' + st.readT + ' h. The data table below lists the values.';
        spec = { title: title, x: { label: 'Time', unit: 'h', min: 0, max: P.tEnd, step: 12 }, y: { label: o.name, unit: o.unit, min: 0, max: ymax, step: T.niceStep(ymax, 5) },
          curves: (ref ? [{ points: pts(ref), cls: 's3', dashed: true }] : []).concat([{ points: pts(s), cls: 's1' }]), vline: { x: st.readT } };
      } else if(view === 'hist'){
        var hp = a.hist.map(function(x){ return 100 * x / a.N; }), ra = ref ? C.at(ref, st.readT) : null;
        title = 'Bar graph of the percent of cells holding each amount of DNA at ' + st.readT + ' h, ' + setText(st) + (ra ? ', with normal cells under the same conditions as square points' : '') + ': ' + BIN_SHORT.map(function(b, i){ return b + ' units ' + F(hp[i], 1) + '%'; }).join(', ') + '.';
        spec = { title: title, x: { label: 'DNA per cell', unit: 'units, G1 = 2', categories: BIN_SHORT }, y: { label: 'Cells', unit: '%', min: 0, max: 100, step: 20 },
          bars: hp.map(function(v, i){ return { name: BIN_SHORT[i], value: v, cls: 's1' }; }),
          points: ra ? ra.hist.map(function(x, i){ return { x: i, y: 100 * x / ra.N, cls: 's3', square: true }; }) : [] };
      } else {
        var gx = [], cur = [], refc = [];
        for(var g = 0; g <= 100; g += 5) gx.push(g);
        gx.forEach(function(g){ cur.push([g, C.at(sim({ gf: g / 100 }), st.readT)[o.id]]); if(ref) refc.push([g, C.at(sim({ gf: g / 100, p53: true, rb: false, cycd: false, ras: false }), st.readT)[o.id]]); });
        var shown = runs.filter(sameSet);
        var top2 = Math.max.apply(null, cur.concat(refc).map(function(q){ return q[1]; }).concat(shown.map(function(r){ return r.v[o.id]; })).concat([1]));
        var ymax2 = o.unit === '%' ? (top2 > 50 ? 100 : T.niceMax(top2 * 1.1)) : T.niceMax(top2 * 1.05);
        title = 'Graph of ' + lc(o.name) + ' at ' + st.readT + ' h against growth factor, ' + setText(st) + refWord + '. ' + shown.length + ' run' + (shown.length === 1 ? '' : 's') + ' shown as points. The data table below lists the values.';
        spec = { title: title, x: { label: 'Growth factor', unit: '%', min: 0, max: 100, step: 20 }, y: { label: o.name, unit: o.unit, min: 0, max: ymax2, step: T.niceStep(ymax2, 5) },
          curves: (ref ? [{ points: refc, cls: 's3', dashed: true }] : []).concat([{ points: cur, cls: 's1' }]),
          points: shown.map(function(r){ return { x: r.gf, y: r.v[o.id], cls: 's2' }; }), vline: { x: st.gf } };
      }
      card.querySelector('.bt-plotwrap').innerHTML = T.plot(spec);
      card.querySelector('.bt-readout').innerHTML = [
        ['Cells', show(a, 'N')], ['G1 or G0 / S / G2 or M', F(a.pctG1, 0) + ' / ' + F(a.pctS, 0) + ' / ' + F(a.pctG2M, 0) + '%'], ['Divisions per 100 cells per hour', show(a, 'divRate')],
        ['Divisions by damaged cells', show(a, 'pctDivDam') + '%'], ['Damaged divisions per hour', show(a, 'divDam')], ['Died by apoptosis since 0 h', show(a, 'cumDied')]
      ].map(function(x){ return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('');
      var words = 'At ' + st.readT + ' h, ' + setText(st) + ', ' + F(st.gf, 0) + '% growth factor, DNA damage ' + F(st.damage, 1) + '% per hour: ' + show(a, 'N') + ' cells; ' +
        F(a.pctG1, 1) + '% in G1 or G0, ' + F(a.pctS, 1) + '% in S, ' + F(a.pctG2M, 1) + '% in G2 or M. ' + show(a, 'divRate') + ' divisions per 100 cells per hour' +
        (st.damage > 0 ? ', ' + show(a, 'pctDivDam') + '% of them by cells with damaged DNA; ' + show(a, 'cumDied') + ' cells have died by apoptosis' : '') + '.';
      say(words, now);
      var ids = ['N', 'pctG1', 'pctS', 'pctG2M', 'divRate', 'divDam', 'pctDivDam', 'pctDam', 'cumDied'];
      var head = function(id){ var q = outOf(id); return esc(q.name) + ' (' + esc(q.unit) + ')'; };
      var rows = [];
      for(var t = 0; t <= P.tEnd; t += 6){ var b = C.at(s, t); rows.push([String(t)].concat(ids.map(function(id){ return show(b, id); }))); }
      var ra2 = ref ? C.at(ref, st.readT) : null;
      card.querySelector('.bt-tables').innerHTML =
        (runs.length ? T.dataTable(['Trial', 'Growth factor (%)', 'Damage (% per h)', 'Read at (h)', 'Cells'].concat(ids.slice(1).map(head)), runs.map(function(r){
          return [String(r.n) + ': ' + esc(setText(r)), F(r.gf, 0), F(r.damage, 1), String(r.readT)].concat(ids.map(function(id){ return show(r.v, id); }));
        }), 'Your runs (' + runs.length + ')') : '<p class="bt-small">No runs yet. Use Run one trial or Run a series.</p>') +
        T.dataTable(['Time (h)'].concat(ids.map(head)), rows, 'The dish over time (model, ' + esc(setText(st)) + ')') +
        T.dataTable(['DNA per cell (units)', 'Cells (%)'].concat(ra2 ? ['Normal cells (%)'] : []), data.histBins.map(function(bn, i){ return [esc(bn), F(100 * a.hist[i] / a.N, 1)].concat(ra2 ? [F(100 * ra2.hist[i] / ra2.N, 1)] : []); }), 'DNA content at ' + st.readT + ' h');
    }
    update(true);
    T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
    if(data.frq) T.frq(app, data.frq, SLUG);
    if(/^#find/.test(location.hash)) setMode('find');
  });
})();
