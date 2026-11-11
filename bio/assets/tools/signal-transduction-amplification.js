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

   Tools upgrade (U-Bio-sims), redrawn in the tool review of 2026-11: the
   stage is the cascade inside a liver cell (drawFig), one row of drawn
   molecules per step on a powers-of-ten scale, so the funnel widens where a
   step amplifies. Rows with a drug are buttons: tap the receptors
   (antagonist), the G proteins (normal, locked on, locked off), cAMP (PDE
   inhibitor) or PKA (PKA inhibitor). Counts tween from the old to the new
   values down the cascade. "Play 0 to 300 s" sweeps the read time so the
   signal rises and, after washout, ends; the tool opens at 0 s. Checkboxes
   and selects stay as the keyboard path. Reduced motion: no tween, and
   Play jumps to the end state. */
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
      '<p class="bt-first">Press Play, then tap any step to see its count or block it.</p>' +
      '<div class="bt-fig sg-stagefig bt-hero"></div><p class="bt-small">Tap a step to bring it into focus: its name, its count and how much it multiplies the step above. Steps marked ⊘ can be blocked with a drug from the focused step (the G proteins cycle normal, locked on, locked off). Each row draws 3 more molecules for every 10 times as many.</p>' +
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
    /* The cascade in the cell (tool review 2026-11: the amplification was
       only numbers in a ladder of boxes, clipped on a phone). One picture,
       top to bottom: epinephrine outside, the receptors in the membrane,
       then a row of drawn molecules per step inside the cell. Each row
       holds 3 molecule drawings for every power of ten (counts on a powers
       of ten scale, said in the key), so the rows widen where a step
       amplifies and pinch where it only passes the signal on (G protein to
       adenylyl cyclase, cAMP to PKA), and a shaded funnel joins them. A row
       with a fixed pool (receptors, G proteins, enzymes) shows the rest of
       its pool as faint rings. The count and the step's gain are labels.
       Play fills the funnel from the top down (the model's own lags); a
       blocked row is marked and every row below it drains. Rows with a ⊘
       are buttons (the same drugs as the checkboxes). */
    function hexP(cx, cy, r, rot){ var d = ''; for(var i = 0; i < 6; i++){ var t = i / 6 * Math.PI * 2 + (rot || 0); d += (i ? 'L' : 'M') + (cx + r * Math.cos(t)).toFixed(1) + ' ' + (cy + r * Math.sin(t)).toFixed(1); } return d + 'Z'; }
    function pentP(cx, cy, r, rot){ var d = ''; for(var i = 0; i < 5; i++){ var t = i / 5 * Math.PI * 2 + (rot || 0); d += (i ? 'L' : 'M') + (cx + r * Math.cos(t)).toFixed(1) + ' ' + (cy + r * Math.sin(t)).toFixed(1); } return d + 'Z'; }
    function epi(x, y, cls){ return '<g class="' + (cls || 'sgs-epi') + '"><path d="' + hexP(x, y, 5, 0) + '"/><path class="t" d="M' + (x + 5) + ' ' + y + 'l6 -3l5 3M' + (x - 2.5) + ' ' + (y - 4.3) + 'l-2 -4M' + (x - 5) + ' ' + y + 'l-4 0"/></g>'; }
    var W = 400, CX = 200, SP = 15, PER = 3, MAXK = 21, ROWS = { G: 86, AC: 144, cAMP: 202, PKA: 260, PhK: 318, GP: 376, rate: 434 }, YR = 51, FH = 548;
    var TOT = { R: 'Rtot', G: 'Gtot', AC: 'ACtot', PKA: 'PKAtot', PhK: 'Ktot', GP: 'Ptot' };
    function kOf(v){ return Math.max(0, Math.min(MAXK, PER * Math.log(1 + Math.max(0, v)) / Math.LN10)); }
    function f1(v){ return (Math.round(v * 10) / 10).toString(); }
    /* One molecule drawing per stage, centered on x, y (about 12 px). */
    function mol(id, x, y, cls){
      var c = cls ? ' ' + cls : '';
      switch(id){
        case 'R': return '<g class="sgm-r' + c + '"><rect x="' + f1(x - 5) + '" y="' + (y - 12) + '" width="10" height="24" rx="4"/><path d="M' + f1(x - 2) + ' ' + (y - 10) + 'v20M' + f1(x + 2) + ' ' + (y - 10) + 'v20"/></g>';
        case 'G': return '<g class="sgm-g' + c + '"><circle cx="' + f1(x - 1.5) + '" cy="' + y + '" r="5.2"/><circle class="gtp" cx="' + f1(x + 3.8) + '" cy="' + (y - 3.6) + '" r="2.2"/></g>';
        case 'AC': return '<g class="sgm-ac' + c + '"><rect x="' + f1(x - 6) + '" y="' + (y - 5) + '" width="12" height="10" rx="3.5"/></g>';
        case 'cAMP': return '<g class="sgm-c' + c + '"><path d="' + hexP(x - 2.6, y, 3.6, Math.PI / 6) + pentP(x + 3.2, y, 3.1, Math.PI) + '"/></g>';
        case 'PKA': return '<g class="sgm-p' + c + '"><ellipse cx="' + f1(x) + '" cy="' + y + '" rx="6" ry="5"/></g>';
        case 'PhK': return '<g class="sgm-k' + c + '"><path d="M' + f1(x) + ' ' + (y - 6) + 'l6 6-6 6-6-6z"/><circle class="ph" cx="' + f1(x + 4) + '" cy="' + (y - 4) + '" r="2"/></g>';
        case 'GP': return '<g class="sgm-gp' + c + '"><circle cx="' + f1(x) + '" cy="' + y + '" r="5.6"/><circle class="ph" cx="' + f1(x + 4.2) + '" cy="' + (y - 4) + '" r="2"/></g>';
        default: return '<g class="sgm-glc' + c + '"><path d="' + hexP(x, y, 5.2, Math.PI / 6) + '"/></g>';
      }
    }
    /* A row of molecules: k drawn (the last one partly, by opacity) over the faint rings of the pool. */
    function rowMols(id, y, k, kt){
      var o = '', n = Math.ceil(k - 1e-6), m = Math.max(n, Math.ceil(kt || 0));
      for(var j = n; j < m; j++) o += '<circle class="sg-ring" cx="' + f1(CX + (j - (m - 1) / 2) * SP) + '" cy="' + y + '" r="5"/>';
      for(var i = 0; i < n; i++){
        var x = CX + (i - (m - 1) / 2) * SP, op = i === n - 1 ? k - Math.floor(k - 1e-6) : 1;
        o += op < 0.999 ? '<g opacity="' + Math.max(0.2, op).toFixed(2) + '">' + mol(id, x, y) + '</g>' : mol(id, x, y);
      }
      return { svg: o, hw: Math.max(m, 1) * SP / 2 + 6 };
    }
    var SHORT = { R: 'Bound receptors', G: 'Active G proteins', AC: 'Active adenylyl cyclase', cAMP: 'cAMP', PKA: 'Active PKA', PhK: 'Active phosphorylase kinase', GP: 'Active glycogen phosphorylase', rate: 'Glucose released per second' };
    function gainText(a, i){
      var ids = S.STAGES, prev = a[ids[i]], next = a[ids[i + 1]], ratio = prev >= 1 ? next / prev : 0, amp = stageOf(ids[i + 1]).amplifies, to = ids[i + 1];
      if(prev < 1) return { t: '', amp: false };
      if(next < 0.5) return { t: '× 0: blocked here, so nothing passes on', amp: false };
      var r = ratio >= 10 ? '× ' + fmt(ratio) : ratio >= 0.1 || ratio === 0 ? '× ' + F(ratio, 2) : '1 for every ' + fmt(1 / ratio);
      // PKA: the count ratio is not the binding ratio (each PKA binds 4 cAMP; most cAMP in the cell is free)
      if(to === 'PKA') return { t: r + ': no gain (each PKA needs 4 cAMP bound)', amp: false };
      if(!amp) return { t: r + ': one-to-one binding, no gain', amp: false };
      return { t: r + (ratio >= 1 ? ': each one activates or makes many' : ': blocked'), amp: ratio >= 1 };
    }
    var nowT = 0;
    function drawFig(a, target){
      // a phone draws 400 wide (readable at 390 px); wider stages get room for bigger text
      W = document.querySelector('.ls-root.ls-phone') ? 400 : 520; CX = W / 2;
      var ids = S.STAGES, s = [], tags = { R: st.antagonist ? 'antagonist' : '', G: st.gprotein === 'on' ? 'locked on' : st.gprotein === 'off' ? 'locked off' : '', cAMP: st.pde ? 'breakdown blocked' : '', PKA: st.pka ? 'inhibitor' : '' };
      var stopAt = st.gprotein === 'off' ? 'G' : st.pka ? 'PKA' : ''; // the antagonist competes, so it lowers the signal rather than stopping it
      var washed = st.tOff < data.washout.max && nowT >= st.tOff;
      // compartments and membrane
      s.push('<rect class="sgs-out" x="0" y="0" width="' + W + '" height="42"/><rect class="sgs-in" x="0" y="62" width="' + W + '" height="' + (FH - 62) + '"/>');
      var heads = '', tails = '';
      for(var x = 3; x < W; x += 7){ heads += '<circle cx="' + x + '" cy="43" r="3.2"/><circle cx="' + x + '" cy="60" r="3.2"/>'; tails += 'M' + (x - 1) + ' 46v5M' + (x + 1) + ' 46v5M' + (x - 1) + ' 57v-5M' + (x + 1) + ' 57v-5'; }
      s.push('<path class="sgs-tail" d="' + tails + '"/><g class="sgs-head">' + heads + '</g>');
      s.push('<text class="sgs-lab" x="8" y="13">outside the liver cell</text><text class="sgs-lab" x="' + (W - 8) + '" y="76" text-anchor="end">inside the cell</text>');
      // epinephrine in the fluid: more drawn at higher concentration; gone after washout
      var nE = washed || st.L <= 0 ? 0 : Math.max(1, Math.min(7, Math.round(1 + Math.log(st.L) / Math.LN10 * 2.4)));
      [[30, 20], [72, 27], [114, 19], [52, 30], [94, 30], [136, 27], [12, 28]].slice(0, nE).forEach(function(q){ s.push(epi(CX + q[0], q[1])); });
      s.push('<text class="sgs-lab r" x="' + (W - 8) + '" y="13" text-anchor="end">' + (washed ? 'epinephrine washed out' : 'epinephrine ' + F(st.L, 0) + ' nM') + '</text>');
      // the funnel: each row's half-width
      var rowY = function(id){ return id === 'R' ? YR : ROWS[id] + 31; }, rows = {}, edge = [];
      ids.forEach(function(id){ var kt = TOT[id] ? kOf(P[TOT[id]]) : 0; rows[id] = rowMols(id, rowY(id), kOf(a[id]), kt); var k = kOf(a[id]); edge.push([rowY(id), Math.max(10, k * SP / 2 + 6)]); });
      var fl = '', fr = '';
      edge.forEach(function(e, i){ fl += (i ? 'L' : 'M') + f1(CX - e[1]) + ' ' + e[0]; });
      for(var e2 = edge.length - 1; e2 >= 0; e2--) fr += 'L' + f1(CX + edge[e2][1]) + ' ' + edge[e2][0];
      s.push('<path class="sg-funnel" d="' + fl + fr + 'Z"/>');
      // rows
      ids.forEach(function(id, i){
        var top = id === 'R' ? 26 : ROWS[id], tap = TAP[id], lab = id === 'R' ? 34 : top + 12, body = '';
        var on = id === focus;
        if(id !== 'R') body += '<rect class="sg-row" x="4" y="' + top + '" width="' + (W - 8) + '" height="44" rx="8"/>';
        else body += '<rect class="sg-row" x="4" y="22" width="' + (W - 8) + '" height="44" rx="8"/>';
        body += '<g class="sg-mols">' + rows[id].svg + '</g>';
        // one step in focus (pass 2, 2026-11-10): only it carries its name and count; a blocked step keeps its tag
        if(on) body += '<text class="sg-n" x="12" y="' + lab + '">' + esc(SHORT[id]) + '<tspan class="sg-v" dx="8">' + fmt(a[id]) + '</tspan></text>';
        else if(tags[id]) body += '<text class="sg-n sg-tapmark" x="12" y="' + lab + '">⊘ ' + esc(tags[id]) + '</text>';
        // the antagonist sits on the receptors that epinephrine cannot reach (the faint ones)
        if(id === 'R' && st.antagonist){ var nb = Math.ceil(kOf(a.R) - 1e-6), mt = Math.max(nb, Math.ceil(kOf(P.Rtot))); for(var q = nb; q < mt; q++) body += '<rect class="sgs-ant" x="' + f1(CX + (q - (mt - 1) / 2) * SP - 5) + '" y="' + (YR - 18) + '" width="10" height="6" rx="2"/>'; }
        if(id === 'PKA' && st.pka) body += '<path class="sgs-ant" d="' + hexP(CX + rows[id].hw + 4, rowY(id), 5, 0) + '"/>';
        if(stopAt === id) body += '<path class="sg-stop" d="M20 ' + (rowY(id) + (id === 'R' ? 18 : 15)) + 'H' + (W - 20) + '"/>';
        if(on && tap){
          var bl = id === 'G' ? (st.gprotein === 'normal' ? '⊘ Lock' : st.gprotein === 'on' ? 'Locked on ▸' : 'Locked off ▸') : tags[id] ? 'Remove drug' : '⊘ Block', bw = bl.length * 6.6 + 18;
          body += '<g class="sg-blk" data-blk="' + id + '" role="button" tabindex="0" aria-pressed="' + !!tags[id] + '" aria-label="' + esc(stageOf(id).short + ': ' + (tags[id] || 'not blocked') + '. ' + (id === 'G' ? 'Change the G protein.' : tags[id] ? 'Remove the drug.' : 'Block this step.')) + '"><rect x="' + f1(W - 10 - bw) + '" y="' + (lab - 13) + '" width="' + f1(bw) + '" height="19" rx="9.5"/><text x="' + f1(W - 10 - bw / 2) + '" y="' + (lab + 1) + '" text-anchor="middle">' + esc(bl) + '</text></g>';
        }
        s.push('<g class="sg-tap' + (on ? ' on' : '') + (tags[id] ? ' blocked' : '') + '" data-tap="' + id + '" role="button" tabindex="0" aria-current="' + on + '" aria-label="' + esc(stageOf(id).short + ': ' + fmt(a[id]) + (tags[id] ? ' (' + tags[id] + ')' : '') + (on ? '. In focus.' : '. Tap to focus this step.')) + '">' + body + '</g>');
        if(i < ids.length - 1){
          var g = gainText(a, i), gy = ROWS[ids[i + 1]] - 4;
          s.push('<path class="sg-chev' + (g.amp ? ' amp' : '') + '" d="M' + 17 + ' ' + (gy - 5) + 'l5 4 5-4"/>');
          if(g.t && ids[i + 1] === focus) s.push('<text class="sg-gain' + (g.amp ? ' amp' : '') + '" x="32" y="' + gy + '">' + esc(g.t) + '</text>');
        }
      });
      // glycogen: the granule the glucose comes off
      var br = '', gy2 = 504;
      [[0, 0], [-9, -5], [9, -5], [-14, 4], [14, 5], [-5, 9], [6, 10], [0, -10], [-18, -3], [19, -3], [-22, 6], [22, 7]].forEach(function(q){ br += '<circle cx="' + (CX + q[0]) + '" cy="' + (gy2 + q[1]) + '" r="4.6"/>'; });
      s.push('<path class="sg-chev" d="M' + (CX - 5) + ' 486l5 -4 5 4"/><g class="sgs-gly">' + br + '</g><text class="sgs-name" x="' + (CX + 34) + '" y="' + (gy2 + 4) + '">glycogen</text>');
      s.push('<text class="sg-key" x="12" y="' + (FH - 10) + '">3 more drawn in a row = 10 times as many</text>');
      var fin = target || a;
      var lab2 = 'The cascade in a liver cell at ' + nowT + ' s, from the receptor in the membrane to glucose release. ' + ids.map(function(id){ return stageOf(id).name + ': ' + fmt(fin[id]) + (tags[id] ? ' (' + tags[id] + ')' : ''); }).join('; ') + '.';
      figEl.innerHTML = '<svg class="sg-fig sg-cell" viewBox="0 0 ' + W + ' ' + FH + '" role="group" aria-label="' + esc(lab2) + '">' + s.join('') + '</svg>';
      var f2 = target ? null : figEl.querySelector(lastSel); if(f2 && refocus){ refocus = false; f2.focus(); }
    }
    var lastTap = null, lastSel = null, refocus = false, focus = 'R';
    /* Focus a step: it lights up, the rest dim; Play walks the focus down. */
    function setFocus(id, keyFocus){
      focus = id; lastSel = '[data-tap="' + id + '"]'; refocus = !!keyFocus;
      if(shownA) drawFig(shownA, null);
    }
    function tapRung(id){
      var what;
      if(id === 'G'){ var order = ['normal', 'on', 'off'], n = order[(order.indexOf(st.gprotein) + 1) % 3]; st.gprotein = n; gSel.set(n); what = n === 'on' ? 'G protein locked on: it keeps activating adenylyl cyclase even with no hormone (like cholera toxin), so the signal never ends.' : n === 'off' ? 'G protein locked off: it cannot pick up GTP, so nothing after the receptor turns on, however much epinephrine there is.' : 'G protein back to normal.'; }
      else { var k = TAP[id]; st[k] = !st[k]; var box = fs.querySelector('[data-b="' + k + '"]'); if(box) box.checked = st[k];
        what = k === 'antagonist' ? (st[k] ? 'Receptor antagonist: it sits in the binding site, so epinephrine cannot bind and every step after drains.' : 'Antagonist removed.')
          : k === 'pde' ? (st[k] ? 'Phosphodiesterase inhibitor: cAMP is no longer broken down, so it piles up and the signal lasts after washout.' : 'PDE inhibitor removed.')
          : (st[k] ? 'PKA inhibitor: cAMP still rises, but PKA cannot act, so everything after PKA drains.' : 'PKA inhibitor removed.'); }
      lastTap = id; lastSel = '[data-blk="' + id + '"]'; refocus = true;
      card.querySelector('.sg-why').textContent = what;
      update(true);
    }
    function onTap(e, key){
      var b = e.target.closest && e.target.closest('.sg-blk');
      if(b){ e.stopPropagation(); tapRung(b.getAttribute('data-blk')); return true; }
      var g = e.target.closest && e.target.closest('.sg-tap');
      if(g){ setFocus(g.getAttribute('data-tap'), key); return true; }
      return false;
    }
    figEl.addEventListener('click', function(e){ onTap(e, false); });
    figEl.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ if(onTap(e, true)) e.preventDefault(); return; }
      var g = e.target.closest && e.target.closest('.sg-tap'), ids = S.STAGES;
      if(g && (e.key === 'ArrowDown' || e.key === 'ArrowUp')){ e.preventDefault(); var i = ids.indexOf(g.getAttribute('data-tap')) + (e.key === 'ArrowDown' ? 1 : -1); if(i >= 0 && i < ids.length) setFocus(ids[i], true); }
    });
    var sweepT = 0;
    card.querySelector('[data-a="sweep"]').addEventListener('click', function(){
      if(sweepT){ cancelAnimationFrame(sweepT); sweepT = 0; }
      if(reducedM()){ focus = 'rate'; sRead.set(P.tEnd, true); return; }
      var sim = S.simulate(P, cond({})), t0 = null, D = 7000, clock = card.querySelector('.sg-clock');
      var go = function(ts){
        if(t0 == null) t0 = ts;
        var u = Math.min(1, (ts - t0) / D), t = Math.round(u * P.tEnd / 5) * 5, a = S.at(sim, t);
        if(tw){ cancelAnimationFrame(tw); tw = 0; }
        focus = S.STAGES[Math.min(S.STAGES.length - 1, Math.floor(u / 0.33 * S.STAGES.length))];
        nowT = t; drawFig(a, null); shownA = a;
        clock.textContent = 't = ' + t + ' s';
        if(u < 1) sweepT = requestAnimationFrame(go); else { sweepT = 0; sRead.set(t, true); }
      };
      sweepT = requestAnimationFrame(go);
    });
    function update(now){
      var sim = S.simulate(P, cond({})), a = S.at(sim, st.readT), ref = drugged() ? S.simulate(P, cond(NODRUG)) : null;
      var offTxt = st.tOff >= data.washout.max ? 'never' : st.tOff + ' s';
      sOff.el.querySelector('output').textContent = offTxt; sOff.input.setAttribute('aria-valuetext', offTxt);
      nowT = st.readT; figure(a);
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
  }, {
    // Tool Studio (docs/tools-calm.md; bio-tools.js studioSim)
    studio: { sim: true, live: '.sg-why', primary: 1, why: ['.sg-stagefig + p.bt-small'],
      hint: { target: '.os-play .btn-press', text: 'Press Play to start the cascade' },
      pills: function(g){ return [{ k: 'Glucose out', html: g.ro(0).replace(/ per s$/, '/s'), tone: 'readout' }]; },
      pillsR: function(){ return []; } } });
})();
