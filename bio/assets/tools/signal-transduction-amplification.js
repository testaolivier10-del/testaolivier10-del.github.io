/* Simulator: signal transduction and amplification (Unit 4). The model is in
   bio-tool-math.js (ApBioMath.signal); its numbers, the steps, the drugs, the
   "How this model works" box, the questions and the mini FRQ are data
   (bio/data/tools/signal-transduction-amplification.json). The student sets
   the epinephrine concentration, when it is washed out and which steps are
   blocked, reads the active molecules at every step at a chosen time (the
   pathway figure and a table), plots any step over time or against the
   dose, and runs trials that land as points (with a little scatter).

   Job: see how one hormone molecule becomes millions of glucose units, and
   what each blocked step does to everything after it.

   Tools upgrade (U-Bio-sims, lighter version): the cascade is the stage,
   first in the card. Each rung with a drug is a button: tap the receptor
   (antagonist), the G protein (normal, locked on, locked off), cAMP (PDE
   inhibitor) or PKA (PKA inhibitor). Counts tween from the old to the new
   values down the cascade (drain or flood, each rung a little after the one
   above), with a log bar of dots per rung. "Play 0 to 300 s" sweeps the read
   time so the signal rises and, after washout, ends. Checkboxes and selects
   stay as the keyboard path. Reduced motion: no tween. */
(function(){
  'use strict';
  var SLUG = 'signal-transduction-amplification';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  T.mount(SLUG, function(app, data){
    var esc = T.esc, F = T.F, S = M.signal, P = data.model, fmt = S.fmt;
    var view = 'time', runs = [], runSeed = 4271;
    var st = { L: data.ligand.value, tOff: data.washout.value, readT: data.readTime.value, gprotein: 'normal', antagonist: false, pde: false, pka: false, stage: 'rate' };
    var fs;
    var stageOf = function(id){ return data.stages.filter(function(s){ return s.id === id; })[0]; };

    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
      '<section class="bt-card sg-card" aria-labelledby="sg-h"><h2 id="sg-h">The model</h2>' +
      '<p class="bt-first">Press Play to send epinephrine down the cascade, then tap a rung to block it.</p>' +
      '<div class="bt-fig sg-stagefig bt-hero"></div><p class="bt-small">Tap a rung with a ⊘ to block it (tap the G protein to cycle normal, locked on, locked off).</p>' +
      '<div class="os-play"><button type="button" class="btn-press sm" data-a="sweep">Play 0 to 300 s</button><p class="os-clock sg-clock" aria-hidden="true"></p></div>' +
      '<p class="os-why sg-why" role="status" aria-live="polite"></p>' +
      '<div class="bt-controls" data-primary="2"></div>' +
      '<div class="sg-lower bt-num"><div><div class="bt-tabs" role="group" aria-label="Graph">' +
      '<button type="button" class="bt-btn" data-v="time" aria-pressed="true">Over time</button><button type="button" class="bt-btn" data-v="dose" aria-pressed="false">Against epinephrine concentration</button>' +
      '</div><div class="bt-plotwrap"></div></div></div>' +
      '<dl class="bt-readout"></dl><p class="bt-summary"></p>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm" data-a="run">Run one trial</button><button type="button" class="btn-press sm alt" data-a="series">Run a series</button><button type="button" class="bt-btn" data-a="clear">Clear runs</button></div>' +
      '<p class="bt-small bt-runnote" role="status" aria-live="polite"></p>' +
      '<details class="bt-data"><summary>Data tables: your runs, the pathway over time and the dose curve</summary><div class="bt-tables"></div></details></section>' +
      '<section class="bt-card" aria-labelledby="sg-q"><h2 id="sg-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');
    var card = app.querySelector('.bt-card'), ctl = card.querySelector('.bt-controls');
    var say = T.announcer(card.querySelector('.bt-summary'));

    var sL = T.slider({ label: 'Epinephrine concentration', min: data.ligand.min, max: data.ligand.max, step: data.ligand.step, value: st.L, unit: data.ligand.unit, decimals: 0, onInput: function(v){ st.L = v; update(); } });
    var sOff = T.slider({ label: 'Wash out epinephrine at', min: data.washout.min, max: data.washout.max, step: data.washout.step, value: st.tOff, unit: 's', decimals: 0, hint: 'At ' + data.washout.max + ' s it stays for the whole run.', onInput: function(v){ st.tOff = v; update(); } });
    var sRead = T.slider({ label: 'Read the counts at', min: data.readTime.min, max: data.readTime.max, step: data.readTime.step, value: st.readT, unit: 's', decimals: 0, onInput: function(v){ st.readT = v; update(); } });
    var gSel = T.choiceSelect({ label: 'G protein', value: 'normal', options: data.gprotein.map(function(g){ return { value: g.id, label: g.name }; }), onChange: function(v){ st.gprotein = v; update(true); } });
    var stageSel = T.choiceSelect({ label: 'Step to plot', value: st.stage, options: data.stages.map(function(s){ return { value: s.id, label: s.name }; }), onChange: function(v){ st.stage = v; update(true); } });
    fs = document.createElement('fieldset');
    fs.className = 'bt-ctl bt-checks';
    fs.innerHTML = '<legend>Drugs (added at 0 s)</legend>' + data.blocks.map(function(b){
      var id = T.nid('sg-' + b.id);
      return '<div class="bt-check-row"><input type="checkbox" id="' + id + '" data-b="' + esc(b.id) + '"><label for="' + id + '">' + esc(b.name) + '</label></div>';
    }).join('');
    [sL.el, fs, sOff.el, sRead.el, gSel.el, stageSel.el].forEach(function(x){ ctl.appendChild(x); });
    fs.querySelectorAll('input').forEach(function(b){ b.addEventListener('change', function(){ st[b.getAttribute('data-b')] = b.checked; card.querySelector('.sg-why').textContent = ''; update(true); }); });

    card.querySelectorAll('.bt-tabs .bt-btn').forEach(function(b){
      b.addEventListener('click', function(){
        view = b.getAttribute('data-v');
        card.querySelectorAll('.bt-tabs .bt-btn').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        update(true);
      });
    });
    card.querySelector('[data-a="run"]').addEventListener('click', function(){ run([st.L]); });
    card.querySelector('[data-a="series"]').addEventListener('click', function(){ run(data.series); });
    card.querySelector('[data-a="clear"]').addEventListener('click', function(){ runs = []; card.querySelector('.bt-runnote').textContent = 'Runs cleared.'; update(true); });

    function cond(over){ var c = { L: st.L, tOff: st.tOff, gprotein: st.gprotein, antagonist: st.antagonist, pde: st.pde, pka: st.pka }; for(var k in over) c[k] = over[k]; return c; }
    var NODRUG = { gprotein: 'normal', antagonist: false, pde: false, pka: false };
    function lc(s){ return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
    function drugged(){ return st.gprotein !== 'normal' || st.antagonist || st.pde || st.pka; }
    function drugText(c){
      var d = [];
      if(c.antagonist) d.push('receptor antagonist');
      if(c.gprotein === 'on') d.push('G protein locked on');
      if(c.gprotein === 'off') d.push('G protein locked off');
      if(c.pde) d.push('phosphodiesterase inhibitor');
      if(c.pka) d.push('PKA inhibitor');
      return d.length ? d.join(', ') : 'no drugs';
    }
    function sameDrugs(r){ return r.gprotein === st.gprotein && r.antagonist === st.antagonist && r.pde === st.pde && r.pka === st.pka; }
    /* A run: every step's count at the read time, each with about 3% measurement scatter (seeded). */
    function run(Ls){
      Ls.forEach(function(L){
        var a = S.at(S.simulate(P, cond({ L: L, tEnd: Math.max(st.readT, 1) })), st.readT), r = M.rng(runSeed + runs.length * 31), v = {};
        S.STAGES.forEach(function(k){ v[k] = Math.max(0, a[k] * (1 + r.normal(0, 0.03))); });
        runs.push({ n: runs.length + 1, L: L, tOff: st.tOff, readT: st.readT, gprotein: st.gprotein, antagonist: st.antagonist, pde: st.pde, pka: st.pka, v: v });
      });
      T.event('apbio-sim-run', { tool: SLUG, n: Ls.length });
      var last = runs[runs.length - 1];
      card.querySelector('.bt-runnote').textContent = Ls.length === 1 ? 'Trial ' + last.n + ': glucose release ' + fmt(last.v.rate) + ' per second at ' + st.readT + ' s.' : 'Ran ' + Ls.length + ' trials from 0 to ' + data.ligand.max + ' ' + data.ligand.unit + ' epinephrine. They appear as points on the graph against epinephrine concentration and in the data table.';
      if(Ls.length > 1 && view !== 'dose') card.querySelector('[data-v="dose"]').click(); else update(true);
    }
    function scaleFor(max){ return max >= 1e6 ? { k: 1e6, word: 'millions' } : max >= 1e4 ? { k: 1e3, word: 'thousands' } : { k: 1, word: '' }; }
    function yLabel(stage, sc){
      var s = stageOf(stage);
      return s.id === 'rate' ? 'Glucose units per second' + (sc.word ? ' (' + sc.word + ')' : '') : s.short + (sc.word ? ' (' + sc.word + ' per cell)' : ' (per cell)');
    }
    var shownA = null, tw = 0, figEl = card.querySelector('.sg-stagefig');
    function reducedM(){ try{ return window.LevlMotion ? window.LevlMotion.reduced() : matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
    var TAP = { R: 'antagonist', G: 'gprotein', cAMP: 'pde', PKA: 'pka' };
    function figure(a){
      if(tw){ cancelAnimationFrame(tw); tw = 0; }
      var from = shownA, to = a;
      if(!from || reducedM()){ drawFig(to, null); shownA = to; return; }
      var t0 = null, D = 900, ids = S.STAGES;
      var step = function(ts){
        if(t0 == null) t0 = ts;
        var u = (ts - t0) / D, mid = {};
        ids.forEach(function(id, i){ var f = Math.max(0, Math.min(1, u * 1.6 - i * 0.08)); f = f * f * (3 - 2 * f); var lo = Math.log(1 + from[id]), hi = Math.log(1 + to[id]); mid[id] = Math.exp(lo + (hi - lo) * f) - 1; });
        drawFig(mid, to);
        if(u < 1.6) tw = requestAnimationFrame(step); else { tw = 0; drawFig(to, null); }
      };
      shownA = to;
      tw = requestAnimationFrame(step);
    }
    /* The cell-surface scene above the ladder: epinephrine outside, a lipid
       bilayer, the 7-helix receptor, the G protein (α with GDP or GTP, and
       βγ), adenylyl cyclase, cAMP molecules, PKA (two regulatory and two
       catalytic subunits that come apart when cAMP binds) and a glycogen
       granule shedding glucose. Every level comes from the same counts as
       the ladder: f = active / total. */
    var SH = 214;
    function frac(v, tot){ return Math.max(0, Math.min(1, v / tot)); }
    function hexP(cx, cy, r, rot){ var d = ''; for(var i = 0; i < 6; i++){ var t = i / 6 * Math.PI * 2 + (rot || 0); d += (i ? 'L' : 'M') + (cx + r * Math.cos(t)).toFixed(1) + ' ' + (cy + r * Math.sin(t)).toFixed(1); } return d + 'Z'; }
    function pentP(cx, cy, r, rot){ var d = ''; for(var i = 0; i < 5; i++){ var t = i / 5 * Math.PI * 2 + (rot || 0); d += (i ? 'L' : 'M') + (cx + r * Math.cos(t)).toFixed(1) + ' ' + (cy + r * Math.sin(t)).toFixed(1); } return d + 'Z'; }
    function camp(x, y){ return '<path class="sgs-camp" d="' + hexP(x, y, 4.2, Math.PI / 6) + pentP(x + 6.6, y, 3.6, Math.PI) + '"/><circle class="sgs-pho" cx="' + (x + 1) + '" cy="' + (y + 7.4) + '" r="2.4"/>'; }
    function epi(x, y, cls){ return '<g class="' + (cls || 'sgs-epi') + '"><path d="' + hexP(x, y, 5, 0) + '"/><path class="t" d="M' + (x + 5) + ' ' + y + 'l6 -3l5 3M' + (x - 2.5) + ' ' + (y - 4.3) + 'l-2 -4M' + (x - 5) + ' ' + y + 'l-4 0"/></g>'; }
    function scene(a){
      var s = [], yT = 62, yB = 86, f = { R: frac(a.R, P.Rtot), G: frac(a.G, P.Gtot * 0.2), AC: frac(a.AC, P.ACtot), PKA: frac(a.PKA, P.PKAtot), GP: frac(a.GP, P.Ptot) };
      // compartments
      s.push('<rect class="sgs-out" x="0" y="0" width="360" height="' + yT + '"/><rect class="sgs-in" x="0" y="' + yB + '" width="360" height="' + (SH - yB) + '" rx="0"/>');
      s.push('<text class="sgs-lab" x="8" y="14">outside the liver cell</text><text class="sgs-lab" x="8" y="' + (SH - 8) + '">cytoplasm</text>');
      // bilayer: heads in two rows, tails between
      var heads = '', tails = '';
      for(var x = 3; x < 360; x += 7){ heads += '<circle cx="' + x + '" cy="' + (yT + 3) + '" r="3.2"/><circle cx="' + x + '" cy="' + (yB - 3) + '" r="3.2"/>'; tails += 'M' + (x - 1) + ' ' + (yT + 6) + 'v7M' + (x + 1) + ' ' + (yT + 6) + 'v7M' + (x - 1) + ' ' + (yB - 6) + 'v-7M' + (x + 1) + ' ' + (yB - 6) + 'v-7'; }
      s.push('<path class="sgs-tail" d="' + tails + '"/><g class="sgs-head">' + heads + '</g>');
      // receptor (GPCR): seven helices across the membrane
      var rx = 52;
      s.push('<path class="sgs-loop" d="M' + (rx - 21) + ' ' + (yT - 2) + 'q4 -10 8 0q4 -10 8 0q4 -10 8 0M' + (rx - 15) + ' ' + (yB + 2) + 'q4 10 8 0q4 10 8 0q4 10 8 0q6 14 14 6"/>');
      for(var h = 0; h < 7; h++) s.push('<rect class="sgs-rec" x="' + (rx - 24 + h * 7) + '" y="' + (yT - 6) + '" width="6.5" height="' + (yB - yT + 12) + '" rx="3"/>');
      if(st.antagonist) s.push('<path class="sgs-ant" d="M' + (rx - 9) + ' ' + (yT - 22) + 'h18v10h-18z"/><text class="sgs-tag" x="' + (rx + 14) + '" y="' + (yT - 14) + '">antagonist</text>');
      else if(st.L > 0 || f.R > 0.01) s.push('<g opacity="' + Math.max(0.15, Math.min(1, f.R * 1.6)).toFixed(2) + '">' + epi(rx - 4, yT - 16) + '</g>');
      if(st.L > 0) [[110, 22], [150, 36], [200, 18], [250, 30], [300, 16]].slice(0, Math.max(1, Math.min(5, Math.round(st.L / 20)))).forEach(function(q){ s.push(epi(q[0], q[1])); });
      s.push('<text class="sgs-name" x="' + rx + '" y="' + (yB + 30) + '" text-anchor="middle">receptor</text>');
      // G protein: α (GDP or GTP) and βγ on the inner face
      var gx = 112, gOn = f.G > 0.15 || st.gprotein === 'on', gOff = st.gprotein === 'off';
      s.push('<path class="sgs-g a' + (gOn ? ' on' : '') + '" d="M' + (gx - 16) + ' ' + (yB + 4) + 'c-6 10 -2 24 12 24c12 0 18 -10 14 -22z"/>');
      s.push('<ellipse class="sgs-g b" cx="' + (gx + 16) + '" cy="' + (yB + 14) + '" rx="10" ry="8"/><ellipse class="sgs-g c" cx="' + (gx + 25) + '" cy="' + (yB + 6) + '" rx="5" ry="3.5"/>');
      s.push('<text class="sgs-mini" x="' + (gx - 6) + '" y="' + (yB + 21) + '" text-anchor="middle">' + (gOn && !gOff ? 'GTP' : 'GDP') + '</text>');
      s.push('<text class="sgs-name" x="' + (gx + 4) + '" y="' + (yB + 44) + '" text-anchor="middle">G protein' + (st.gprotein !== 'normal' ? ' (' + (gOff ? 'locked off' : 'locked on') + ')' : '') + '</text>');
      // adenylyl cyclase: two membrane bundles and a cytosolic catalytic core
      var ax = 186;
      for(var k = 0; k < 2; k++) for(var j = 0; j < 3; j++) s.push('<rect class="sgs-ac" x="' + (ax - 22 + k * 26 + j * 6) + '" y="' + (yT - 4) + '" width="5.5" height="' + (yB - yT + 8) + '" rx="2.6"/>');
      s.push('<path class="sgs-ac core' + (f.AC > 0.1 ? ' on' : '') + '" d="M' + (ax - 18) + ' ' + (yB + 4) + 'c-6 16 8 26 18 20c10 6 24 -4 18 -20z"/>');
      s.push('<text class="sgs-name" x="' + ax + '" y="' + (yB + 44) + '" text-anchor="middle">adenylyl cyclase</text>');
      if(gOn && !gOff) s.push('<path class="sgs-flow" d="M' + (gx + 2) + ' ' + (yB + 30) + 'Q' + ((gx + ax) / 2) + ' ' + (yB + 38) + ' ' + (ax - 14) + ' ' + (yB + 18) + '"/>');
      // cAMP molecules: a log count so 10 and 2 million both read
      var nC = Math.max(0, Math.min(16, Math.round((Math.log(1 + a.cAMP) / Math.LN10 - 3) * 4)));
      var cp = [[178, 150], [196, 162], [214, 146], [232, 160], [166, 172], [204, 182], [226, 178], [244, 140], [188, 134], [250, 170], [160, 152], [220, 196], [180, 192], [238, 192], [256, 152], [172, 134]];
      for(var c = 0; c < nC; c++) s.push(camp(cp[c][0], cp[c][1]));
      s.push('<text class="sgs-name" x="206" y="' + (SH - 8) + '" text-anchor="middle">cAMP' + (st.pde ? ' (PDE blocked)' : '') + '</text>');
      // PKA: R2C2; catalytic subunits drift off as it activates
      var px = 296, py = yB + 34, d = (st.pka ? 0 : f.PKA) * 18;
      s.push('<ellipse class="sgs-pr" cx="' + (px - 7) + '" cy="' + py + '" rx="7" ry="11"/><ellipse class="sgs-pr" cx="' + (px + 7) + '" cy="' + py + '" rx="7" ry="11"/>');
      s.push('<ellipse class="sgs-pc' + (d > 4 ? ' on' : '') + '" cx="' + (px - 20 - d * 0.6) + '" cy="' + (py + d * 0.5) + '" rx="8" ry="7"/><ellipse class="sgs-pc' + (d > 4 ? ' on' : '') + '" cx="' + (px + 20 + d * 0.6) + '" cy="' + (py + d * 0.5) + '" rx="8" ry="7"/>');
      if(st.pka) s.push('<path class="sgs-ant" d="' + hexP(px + 20, py - 9, 4, 0) + '"/>');
      s.push('<text class="sgs-name" x="' + px + '" y="' + (yB + 64) + '" text-anchor="middle">PKA' + (st.pka ? ' (inhibited)' : '') + '</text>');
      // glycogen granule and the glucose it sheds (count from the rate)
      var gx2 = 312, gy2 = 178, br = '';
      [[0, 0], [-8, -5], [8, -5], [-12, 4], [12, 5], [-4, 9], [5, 10], [0, -10], [-15, -4], [16, -3]].forEach(function(q){ br += '<circle cx="' + (gx2 + q[0]) + '" cy="' + (gy2 + q[1]) + '" r="4.2"/>'; });
      s.push('<g class="sgs-gly">' + br + '</g>');
      var nG = Math.max(0, Math.min(6, Math.round((Math.log(1 + a.rate) / Math.LN10 - 2) * 1.4)));
      for(var gq = 0; gq < nG; gq++) s.push('<path class="sgs-glc" d="' + hexP(gx2 - 30 - gq * 12, gy2 - 18 + (gq % 2) * 9, 4.6, Math.PI / 6) + '"/>');
      s.push('<text class="sgs-name" x="' + (gx2 + 2) + '" y="' + (SH - 8) + '" text-anchor="middle">glycogen</text>');
      return s.join('');
    }
    function drawFig(a, target){
      var rowH = 56, ids = S.STAGES, parts = [];
      var tags = { R: st.antagonist ? 'antagonist present' : '', G: st.gprotein === 'on' ? 'locked on' : st.gprotein === 'off' ? 'locked off' : '', cAMP: st.pde ? 'breakdown blocked' : '', PKA: st.pka ? 'inhibitor present' : '' };
      ids.forEach(function(id, i){
        var y = SH + 12 + i * rowH, s = stageOf(id), v = a[id], dec = Math.max(0, Math.min(7, Math.log(Math.max(1, v)) / Math.LN10));
        var tap = TAP[id], body = '<rect class="stp' + (tags[id] ? ' blocked' : '') + '" x="6" y="' + y + '" width="348" height="38" rx="8"/>' +
          '<text x="16" y="' + (y + 16) + '">' + esc(s.short) + (tap ? ' <tspan class="sg-tapmark">' + (tags[id] ? '⊘ ' + esc(tags[id]) : '⊘') + '</tspan>' : '') + '</text>';
        for(var k = 0; k < 7; k++){ var f = Math.max(0, Math.min(1, dec - k)); body += '<circle class="sg-dot" cx="' + (200 + k * 14) + '" cy="' + (y + 27) + '" r="5"/>' + (f > 0 ? '<circle class="sg-dotf" cx="' + (200 + k * 14) + '" cy="' + (y + 27) + '" r="' + (5 * Math.sqrt(f)).toFixed(2) + '"/>' : ''); }
        body += '<text x="346" y="' + (y + 16) + '" text-anchor="end">' + fmt(v) + '</text>';
        if(tap) parts.push('<g class="sg-tap" data-tap="' + id + '" role="button" tabindex="0" aria-pressed="' + !!tags[id] + '" aria-label="' + esc(s.short + ': ' + (tags[id] || 'not blocked') + '. ' + (id === 'G' ? 'Tap to change the G protein.' : tags[id] ? 'Tap to remove the drug.' : 'Tap to block this step.')) + '">' + body + '</g>');
        else parts.push(body);
        if(i < ids.length - 1){
          var prev = v, next = a[ids[i + 1]], ratio = prev >= 1 ? next / prev : 0, amp = stageOf(ids[i + 1]).amplifies;
          parts.push('<path class="arr' + (amp ? ' amp' : '') + '" d="M30 ' + (y + 39) + 'v15"/><path class="arrh" d="M25 ' + (y + 49) + 'l5 6 5-6z"/>');
          parts.push('<text class="note" x="44" y="' + (y + 51) + '">' + (prev >= 1 ? (ratio >= 10 ? '× ' + fmt(ratio) : ratio >= 0.1 || ratio === 0 ? '× ' + F(ratio, 2) : '1 for every ' + fmt(1 / ratio)) : '—') + (amp ? ' (each one activates or makes many: amplifies)' : ' (binding, one-to-one or less: no gain)') + '</text>');
        }
      });
      var fin = target || a;
      var lab = 'The pathway at ' + st.readT + ' s, from receptor to response. ' + ids.map(function(id){ return stageOf(id).name + ': ' + fmt(fin[id]) + (tags[id] ? ' (' + tags[id] + ')' : ''); }).join('; ') + '.';
      figEl.innerHTML = '<svg class="sg-fig" viewBox="0 0 360 ' + (SH + 12 + ids.length * rowH - 10) + '" role="group" aria-label="' + esc(lab) + '"><g class="sgs" aria-hidden="true">' + scene(a) + '</g>' + parts.join('') + '</svg>';
      var f2 = target ? null : figEl.querySelector('[data-tap="' + lastTap + '"]'); if(f2 && refocus){ refocus = false; f2.focus(); }
    }
    var lastTap = null, refocus = false;
    function tapRung(id){
      var what;
      if(id === 'G'){ var order = ['normal', 'on', 'off'], n = order[(order.indexOf(st.gprotein) + 1) % 3]; st.gprotein = n; gSel.set(n); what = n === 'on' ? 'G protein locked on: it keeps activating adenylyl cyclase even with no hormone (like cholera toxin), so the signal never ends.' : n === 'off' ? 'G protein locked off: it cannot pick up GTP, so nothing after the receptor turns on, however much epinephrine there is.' : 'G protein back to normal.'; }
      else { var k = TAP[id]; st[k] = !st[k]; var box = fs.querySelector('[data-b="' + k + '"]'); if(box) box.checked = st[k];
        what = k === 'antagonist' ? (st[k] ? 'Receptor antagonist: it sits in the binding site, so epinephrine cannot bind and every step after drains.' : 'Antagonist removed.')
          : k === 'pde' ? (st[k] ? 'Phosphodiesterase inhibitor: cAMP is no longer broken down, so it piles up and the signal lasts after washout.' : 'PDE inhibitor removed.')
          : (st[k] ? 'PKA inhibitor: cAMP still rises, but PKA cannot act, so everything after PKA drains.' : 'PKA inhibitor removed.'); }
      lastTap = id; refocus = true;
      card.querySelector('.sg-why').textContent = what;
      update(true);
    }
    figEl.addEventListener('click', function(e){ var g = e.target.closest && e.target.closest('.sg-tap'); if(g) tapRung(g.getAttribute('data-tap')); });
    figEl.addEventListener('keydown', function(e){ var g = e.target.closest && e.target.closest('.sg-tap'); if(g && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); tapRung(g.getAttribute('data-tap')); } });
    var sweepT = 0;
    card.querySelector('[data-a="sweep"]').addEventListener('click', function(){
      if(sweepT){ cancelAnimationFrame(sweepT); sweepT = 0; }
      if(reducedM()){ sRead.set(P.tEnd, true); return; }
      var sim = S.simulate(P, cond({})), t0 = null, D = 5000, clock = card.querySelector('.sg-clock');
      var go = function(ts){
        if(t0 == null) t0 = ts;
        var u = Math.min(1, (ts - t0) / D), t = Math.round(u * P.tEnd / 5) * 5, a = S.at(sim, t);
        if(tw){ cancelAnimationFrame(tw); tw = 0; }
        drawFig(a, null); shownA = a;
        clock.textContent = 't = ' + t + ' s' + (t >= st.tOff && st.tOff < data.washout.max ? ' (washed out at ' + st.tOff + ' s)' : '');
        if(u < 1) sweepT = requestAnimationFrame(go); else { sweepT = 0; sRead.set(t, true); }
      };
      sweepT = requestAnimationFrame(go);
    });
    function update(now){
      var sim = S.simulate(P, cond({})), a = S.at(sim, st.readT), ref = drugged() ? S.simulate(P, cond(NODRUG)) : null;
      var offTxt = st.tOff >= data.washout.max ? 'never' : st.tOff + ' s';
      sOff.el.querySelector('output').textContent = offTxt; sOff.input.setAttribute('aria-valuetext', offTxt);
      figure(a);
      var stage = st.stage, sname = stageOf(stage).name, title, spec;
      if(view === 'time'){
        var top = Math.max.apply(null, sim[stage].concat(ref ? ref[stage] : []).concat([1])), sc = scaleFor(top), ymax = T.niceMax(top / sc.k * 1.05);
        var pts = function(s){ return s.t.map(function(t, i){ return [t, s[stage][i] / sc.k]; }); };
        title = 'Graph of ' + lc(sname) + ' over time, ' + drugText(st) + (ref ? ' (solid) and with no drugs (dashed)' : '') + '. Epinephrine ' + F(st.L, 0) + ' nM added at 0 s' + (st.tOff < data.washout.max ? ' and washed out at ' + st.tOff + ' s' : '') + '. The vertical line marks the read time, ' + st.readT + ' s. The data table below lists the values.';
        spec = { title: title, x: { label: 'Time', unit: 's', min: 0, max: P.tEnd, step: 50 }, y: { label: yLabel(stage, sc), unit: '', min: 0, max: ymax, step: T.niceStep(ymax, 5) },
          curves: (ref ? [{ points: pts(ref), cls: 's3', dashed: true }] : []).concat([{ points: pts(sim), cls: 's1' }]), vline: { x: st.readT } };
      } else {
        var xs = [], cur = [], refc = [];
        for(var i = 0; i <= 40; i++) xs.push(data.ligand.max * i / 40);
        var endT = Math.max(st.readT, 1);
        xs.forEach(function(L){
          cur.push([L, S.at(S.simulate(P, cond({ L: L, tEnd: endT })), st.readT)[stage]]);
          if(drugged()) refc.push([L, S.at(S.simulate(P, cond({ L: L, tEnd: endT, gprotein: 'normal', antagonist: false, pde: false, pka: false })), st.readT)[stage]]);
        });
        var shown = runs.filter(function(r){ return sameDrugs(r) && r.tOff === st.tOff && r.readT === st.readT; });
        var top2 = Math.max.apply(null, cur.concat(refc).map(function(p){ return p[1]; }).concat(shown.map(function(r){ return r.v[stage]; })).concat([1])), sc2 = scaleFor(top2), ymax2 = T.niceMax(top2 / sc2.k * 1.05);
        var dv = function(p){ return [p[0], p[1] / sc2.k]; };
        title = 'Graph of ' + lc(sname) + ' at ' + st.readT + ' s against epinephrine concentration, ' + drugText(st) + (refc.length ? ' (solid) and with no drugs (dashed)' : '') + '. ' + shown.length + ' run' + (shown.length === 1 ? '' : 's') + ' shown as points. The data table below lists the values.';
        spec = { title: title, x: { label: 'Epinephrine', unit: 'nM', min: 0, max: data.ligand.max, step: 50 }, y: { label: yLabel(stage, sc2), unit: '', min: 0, max: ymax2, step: T.niceStep(ymax2, 5) },
          curves: (refc.length ? [{ points: refc.map(dv), cls: 's3', dashed: true }] : []).concat([{ points: cur.map(dv), cls: 's1' }]),
          points: shown.map(function(r){ return { x: r.L, y: r.v[stage] / sc2.k, cls: 's2' }; }), vline: { x: st.L } };
      }
      card.querySelector('.bt-plotwrap').innerHTML = T.plot(spec);
      var perR = a.R >= 1 ? a.rate / a.R : 0;
      card.querySelector('.bt-readout').innerHTML = [
        ['Glucose release at ' + st.readT + ' s', fmt(a.rate) + ' per s'], ['cAMP at ' + st.readT + ' s', fmt(a.cAMP)], ['Glucose released by ' + st.readT + ' s', fmt(a.glucose)], ['Glucose per second per bound receptor', a.R >= 1 ? fmt(perR) : '—']
      ].map(function(x){ return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('');
      var ended = st.tOff < st.readT;
      var words = 'At ' + st.readT + ' s, with ' + F(st.L, 0) + ' nM epinephrine' + (ended ? ' washed out at ' + st.tOff + ' s' : '') + ' and ' + drugText(st) + ': ' +
        S.STAGES.map(function(id){ return fmt(a[id]) + ' ' + lc(stageOf(id).short); }).join(', ') + '. ' +
        (a.R >= 1 && a.rate >= 1 ? 'Each bound receptor leads to about ' + fmt(perR) + ' glucose units per second. ' : '') +
        (ended && a.rate < 0.02 * S.at(sim, st.tOff).rate ? 'The signal has ended. ' : '');
      say(words, now);
      var rows = [];
      for(var t = 0; t <= P.tEnd; t += 10){ var b = S.at(sim, t); rows.push([String(t)].concat(S.STAGES.map(function(id){ return fmt(b[id]); }))); }
      var doseRows = data.series.map(function(L){ var b = S.at(S.simulate(P, cond({ L: L, tEnd: Math.max(st.readT, 1) })), st.readT); return [F(L, 0), fmt(b[stage])]; });
      card.querySelector('.bt-tables').innerHTML =
        (runs.length ? T.dataTable(['Trial', 'Epinephrine (nM)', 'Washout (s)', 'Read at (s)', 'Drugs'].concat(S.STAGES.map(function(id){ return esc(stageOf(id).short); })), runs.map(function(r){
          return [String(r.n), F(r.L, 0), r.tOff >= data.washout.max ? 'never' : String(r.tOff), String(r.readT), esc(drugText(r))].concat(S.STAGES.map(function(id){ return fmt(r.v[id]); }));
        }), 'Your runs (' + runs.length + ')') : '<p class="bt-small">No runs yet. Use Run one trial or Run a series.</p>') +
        T.dataTable(['Time (s)'].concat(S.STAGES.map(function(id){ return esc(stageOf(id).short); })), rows, 'The pathway over time (model, ' + esc(drugText(st)) + ')') +
        T.dataTable(['Epinephrine (nM)', esc(sname) + ' at ' + st.readT + ' s'], doseRows, 'The dose curve, sampled');
    }
    update(true);
    T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
    if(data.frq) T.frq(app, data.frq, SLUG);
  });
})();
