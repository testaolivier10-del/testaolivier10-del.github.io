/* Simulator: lac and trp operons (Unit 6). The model is in bio-tool-math.js
   (ApBioMath.operon); its rates, the gene options, the starting media, the
   "How this model works" box, the questions and the mini FRQ are data
   (bio/data/tools/operons.json). Three modes: the lac operon, the trp operon
   and, marked "going further", a lac merodiploid (chromosome + F′). The
   student sets the medium and the genes, reads where the repressor, CAP and
   RNA polymerase sit (figure, readout and a numbered explanation), follows
   mRNA and enzyme after the medium changes at 0 min, compares every medium,
   and runs trials into a data table.

   Job: see how the repressor, the inducer or corepressor, and CAP decide
   whether the genes are read, and spot a mutant from what it does.

   Tools upgrade (U-Bio-sims): the operon figure is the stage, first in the
   card. A tray of sugar (or tryptophan) chips: drag one into the cell or tap
   it to add or remove it. Tap a gene or the operator on the DNA to mutate
   it (cycles through the data's options; the selects stay as the keyboard
   path). The repressor slides on or off the operator and mRNA ribbons stream
   off the genes at a rate set by the model (reduced motion: still). "Which
   mutant is this?": a hidden strain's steady-state levels in every medium
   (computed by ApBioMath.operon, like the strain tables in the questions);
   the student picks the genotype; recorded as operons:mutant-<genotype>:a. */
(function(){
  'use strict';
  var SLUG = 'operons';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  T.mount(SLUG, function(app, data, ctx){
    var esc = T.esc, F = T.F, O = M.operon, P = data.model;
    var WT_LAC = { I: '+', O: '+', Z: '+' }, WT_TRP = { R: '+', O: '+' };
    var st = { mode: 'lac', view: 'time', glucose: false, lactose: true, trp: true, startLac: 'gl', startTrp: 'notrp', readT: data.readTime.value,
      lac: [Object.assign({}, WT_LAC)], mero: [Object.assign({}, WT_LAC), Object.assign({}, WT_LAC)], trpG: [Object.assign({}, WT_TRP)] };
    var runs = [];
    var MODES = [['lac', 'lac operon (inducible)'], ['trp', 'trp operon (repressible)'], ['mero', 'Going further: lac with a second copy on F′ (beyond the course)']];
    var COPY_NAMES = ['Chromosome', 'F′ plasmid'];

    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
      '<section class="bt-card" aria-labelledby="op-h"><h2 id="op-h">The model</h2>' +

      '<div class="os-modes" role="group" aria-label="Mode"><button type="button" class="bt-btn" data-q="explore" aria-pressed="true">Explore</button><button type="button" class="bt-btn" data-q="quiz" aria-pressed="false">Which mutant is this?</button></div>' +
      '<div class="op-further" hidden>' + data.goingFurther + '</div>' +
      '<div class="op-tray" role="group" aria-label="In the medium"></div>' +
      '<div class="bt-fig op-stagefig"></div><p class="bt-small op-taphint">Tap a gene or the operator to mutate it (the DNA scrolls sideways on a phone). Drag a chip into the cell, or tap it, to change the medium.</p>' +
      '<fieldset class="bt-modes"><legend>Operon</legend>' + MODES.map(function(m){
        var id = 'op-mode-' + m[0];
        return '<div class="bt-radio"><input type="radio" name="op-mode" id="' + id + '" value="' + m[0] + '"' + (m[0] === st.mode ? ' checked' : '') + '><label for="' + id + '">' + esc(m[1]) + '</label></div>';
      }).join('') + '</fieldset>' +
      '<div class="os-chal op-chal" hidden></div>' +
      '<div class="bt-controls"></div>' +
      '<div class="op-lower"><div><div class="bt-tabs" role="group" aria-label="Graph">' +
      '<button type="button" class="bt-btn" data-v="time" aria-pressed="true">Time course</button><button type="button" class="bt-btn" data-v="media" aria-pressed="false">Every medium</button>' +
      '</div><div class="bt-plotwrap"></div><p class="bt-small op-key"></p></div></div>' +
      '<dl class="bt-readout op-read"></dl><div class="op-explain"><h3>What is happening</h3><ol></ol></div><p class="bt-summary"></p>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm" data-a="run">Run one trial</button><button type="button" class="btn-press sm alt" data-a="series">Run every medium</button><button type="button" class="bt-btn" data-a="clear">Clear runs</button></div>' +
      '<p class="bt-small bt-runnote" role="status" aria-live="polite"></p>' +
      '<details class="bt-data"><summary>Data tables: your runs and the time course</summary><div class="bt-tables"></div></details></section>' +
      '<section class="bt-card" aria-labelledby="op-q"><h2 id="op-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');
    var card = app.querySelector('.bt-card'), ctl = card.querySelector('.bt-controls');
    var say = T.announcer(card.querySelector('.bt-summary'));

    card.querySelectorAll('input[name="op-mode"]').forEach(function(r){
      r.addEventListener('change', function(){ if(r.checked){ st.mode = r.value; controls(); update(true); } });
    });
    card.querySelectorAll('.bt-tabs .bt-btn').forEach(function(b){
      b.addEventListener('click', function(){
        st.view = b.getAttribute('data-v');
        card.querySelectorAll('.bt-tabs .bt-btn').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        update(true);
      });
    });
    card.querySelector('[data-a="run"]').addEventListener('click', function(){ run(false); });
    card.querySelector('[data-a="series"]').addEventListener('click', function(){ run(true); });
    card.querySelector('[data-a="clear"]').addEventListener('click', function(){ runs = []; card.querySelector('.bt-runnote').textContent = 'Runs cleared.'; update(true); });

    /* ------------------------------------------------ state helpers */
    function isTrp(){ return st.mode === 'trp'; }
    function copies(){ return st.mode === 'trp' ? st.trpG : st.mode === 'mero' ? st.mero : st.lac; }
    function starts(){ return isTrp() ? data.trpStarts : data.lacStarts; }
    function startOf(){ var id = isTrp() ? st.startTrp : st.startLac; return starts().filter(function(s){ return s.id === id; })[0]; }
    function cond(medium){
      var m = medium || (isTrp() ? { trp: st.trp } : { glucose: st.glucose, lactose: st.lactose });
      return isTrp() ? { mode: 'trp', trp: !!m.trp, copies: copies() } : { mode: 'lac', glucose: !!m.glucose, lactose: !!m.lactose, copies: copies() };
    }
    function mediumText(c){
      if(c.mode === 'trp') return c.trp ? 'tryptophan' : 'no tryptophan';
      return c.glucose && c.lactose ? 'glucose and lactose' : c.glucose ? 'glucose, no lactose' : c.lactose ? 'lactose, no glucose' : 'neither sugar';
    }
    function geneLabel(g, k){
      var genes = isTrp() ? data.trpGenes : data.lacGenes, def = genes.filter(function(x){ return x.id === g; })[0];
      return def.options.filter(function(o){ return o.value === k[g]; })[0].label.split(':')[0];
    }
    function genoText(){
      var gs = (isTrp() ? data.trpGenes : data.lacGenes).map(function(x){ return x.id; });
      var one = function(k){ var muts = gs.filter(function(g){ return k[g] !== '+'; }).map(function(g){ return geneLabel(g, k); }); return muts.length ? muts.join(' ') : 'wild type'; };
      if(st.mode === 'mero') return 'chromosome ' + one(st.mero[0]) + ' / F′ ' + one(st.mero[1]);
      return one(copies()[0]);
    }
    function lvl(x){ return x >= 50 ? 'high' : x >= 5 ? 'low' : 'a trickle'; }

    /* ------------------------------------------------------ controls */
    function controls(){
      ctl.innerHTML = '';
      card.querySelector('.op-further').hidden = st.mode !== 'mero';
      var fs = document.createElement('fieldset');
      fs.className = 'bt-ctl bt-checks';
      var boxes = isTrp() ? [['trp', 'Tryptophan in the medium']] : [['glucose', 'Glucose in the medium'], ['lactose', 'Lactose in the medium']];
      fs.innerHTML = '<legend>Medium from 0 min</legend>' + boxes.map(function(b){
        var id = T.nid('op-' + b[0]);
        return '<div class="bt-check-row"><input type="checkbox" id="' + id + '" data-k="' + b[0] + '"' + (st[b[0]] ? ' checked' : '') + '><label for="' + id + '">' + esc(b[1]) + '</label></div>';
      }).join('');
      fs.querySelectorAll('input').forEach(function(b){ b.addEventListener('change', function(){ st[b.getAttribute('data-k')] = b.checked; update(); }); });
      ctl.appendChild(fs);
      var start = T.choiceSelect({ label: 'Before 0 min the cells grew with', value: isTrp() ? st.startTrp : st.startLac,
        options: starts().map(function(s){ return { value: s.id, label: s.label }; }),
        onChange: function(v){ if(isTrp()) st.startTrp = v; else st.startLac = v; update(); } });
      ctl.appendChild(start.el);
      var genes = isTrp() ? data.trpGenes : data.lacGenes;
      copies().forEach(function(k, ci){
        var g = document.createElement('fieldset');
        g.className = 'bt-ctl op-genes';
        g.innerHTML = '<legend>' + (st.mode === 'mero' ? esc(COPY_NAMES[ci]) + ' genes' : 'Genes') + '</legend>';
        genes.forEach(function(def){
          var s = T.choiceSelect({ label: (st.mode === 'mero' ? COPY_NAMES[ci] + ': ' : '') + def.label, value: k[def.id], options: def.options,
            onChange: function(v){ k[def.id] = v; update(true); } });
          g.appendChild(s.el);
        });
        ctl.appendChild(g);
      });
      var read = T.slider({ label: 'Read the cells at', min: data.readTime.min, max: data.readTime.max, step: data.readTime.step, value: st.readT, unit: 'min', decimals: 0,
        hint: 'The medium changes at 0 min. Negative times are before the change.', onInput: function(v){ st.readT = v; update(); } });
      ctl.appendChild(read.el);
    }

    /* ---------------------------------------------- words for a state */
    function repWords(r, c){
      if(c.mode === 'trp') return { none: 'none made', cantbind: 'cannot bind the Oᶜ operator', bound: 'bound to the operator (with tryptophan)', inactive: 'made, but cannot bind without tryptophan' }[r];
      return { none: 'none made', cantbind: 'cannot bind the Oᶜ operator', super: 'super-repressor bound to the operator', bound: 'bound to the operator', released: 'released by allolactose' }[r];
    }
    function polWords(x){ return { blocked: 'blocked by the repressor', strong: 'binds strongly (CAP–cAMP helps)', weak: 'binds weakly (no CAP)', binds: 'binds and transcribes' }[x]; }
    function explain(s, c){
      var out = [], cs = c.copies, mero = cs.length > 1, where = function(i){ return mero ? ' on the ' + (i ? 'F′ plasmid' : 'chromosome') : ''; };
      if(c.mode === 'trp'){
        if(s.repressor === 'none') out.push('<i>trpR</i>⁻: no repressor is made, so nothing can bind the operator, with or without tryptophan.');
        else if(c.trp) out.push('Tryptophan is present. It binds the repressor as a corepressor, and the repressor changes shape so it can bind the operator.');
        else out.push('There is no tryptophan. The repressor alone has the wrong shape to bind the operator.');
        if(s.copies[0].rep === 'cantbind') out.push('The operator is Oᶜ: its DNA sequence is changed, so the repressor cannot bind it' + (c.trp ? ', even with tryptophan.' : '.'));
        out.push(s.copies[0].rnap === 'blocked' ? 'The repressor on the operator blocks RNA polymerase: only a trickle of mRNA (' + F(s.m, 0) + '), so the cell almost stops making the enzymes that build tryptophan.'
          : 'RNA polymerase binds the promoter and transcribes the five genes into one mRNA (' + F(s.m, 0) + '), so the cell makes the enzymes that build tryptophan.');
        return out;
      }
      out.push(c.glucose ? 'Glucose is present, so the cAMP level stays low and CAP does not bind next to the promoter.'
        : 'Glucose is absent, so cAMP builds up. CAP–cAMP binds next to the promoter, where it helps RNA polymerase bind.');
      if(s.repressor === 'none') out.push((mero ? 'Neither <i>lacI</i> copy' : '<i>lacI</i>⁻: the gene') + ' makes no working repressor, so nothing binds the operator, with or without lactose.');
      else if(s.repressor === 'super') out.push('The <i>lacI</i>ˢ super-repressor cannot bind allolactose, so it stays on the operator' + (c.lactose ? ' even though lactose is present' : '') + '.' +
        (mero ? ' The repressor protein moves through the cell, so it binds every normal operator, on both DNA copies (it acts in trans).' : ''));
      else {
        out.push(c.lactose ? 'Lactose is present, so allolactose binds the repressor. The repressor changes shape and lets go of the operator.'
          : 'There is no lactose, so there is no allolactose: the repressor stays on the operator.');
        if(mero && cs.some(function(k){ return k.I === '-'; })) out.push('One <i>lacI</i> copy is <i>lacI</i>⁻, but the working repressor from the other copy moves through the cell and binds both operators (it acts in trans).');
      }
      s.copies.forEach(function(x, i){ if(x.rep === 'cantbind') out.push('The operator' + where(i) + ' is Oᶜ: no repressor can bind it, so that copy is never blocked' + (mero ? ', while the other copy is still controlled (an operator acts in cis, only on its own DNA).' : '.')); });
      s.copies.forEach(function(x, i){
        out.push((mero ? (i ? 'F′ copy: ' : 'Chromosome copy: ') : '') + (x.rnap === 'blocked' ? 'the repressor on the operator blocks RNA polymerase, so only a trickle of mRNA is made (' + F(x.rate, 0) + ').'
          : x.rnap === 'strong' ? 'RNA polymerase binds strongly with CAP’s help and transcribes the operon fast (' + F(x.rate, 0) + ').'
          : 'RNA polymerase can bind, but without CAP it binds weakly, so a low level of mRNA is made (' + F(x.rate, 0) + ').'));
      });
      cs.forEach(function(k, i){ if(k.Z === '-') out.push('<i>lacZ</i>⁻' + where(i) + ': its mRNA is made, but the β-galactosidase translated from it does not work.'); });
      out.push('Working β-galactosidase at steady state: ' + F(s.e, 0) + (s.e > 0 ? '. Ribosomes translate the mRNA, so the enzyme follows the mRNA, but more slowly.' : '.'));
      return out;
    }

    /* -------------------------------------------------------- figure */
    function rowSvg(s, c, ci, y0){
      var p = [], y = y0 + 112, trp = c.mode === 'trp', k = c.copies[ci], x = s.copies[ci];
      var box = function(x1, x2, cls, label, dashed, gene){
        var b = '<rect class="op-box ' + cls + (dashed ? ' mut' : '') + '" x="' + x1 + '" y="' + (y - 14) + '" width="' + (x2 - x1) + '" height="28" rx="4"/><text x="' + ((x1 + x2) / 2) + '" y="' + (y + 5) + '" text-anchor="middle">' + label + '</text>';
        if(!gene || qmode === 'quiz') return b;
        return '<g class="op-tapg" data-gene="' + gene + '" data-ci="' + ci + '" role="button" tabindex="0" aria-label="' + esc(geneTapLabel(gene, k)) + '"><rect class="op-hit" x="' + (x1 - 2) + '" y="' + (y - 20) + '" width="' + (x2 - x1 + 4) + '" height="40" rx="6"/>' + b + '</g>';
      };
      var title = trp ? 'trp operon' : st.mode === 'mero' ? COPY_NAMES[ci] : 'lac operon';
      p.push('<text class="op-ttl" x="8" y="' + (y0 + 18) + '">' + esc(title) + ': mRNA ' + F(x.rate, 0) + ' (' + lvl(x.rate) + ')</text>');
      p.push('<line class="op-dna" x1="6" y1="' + y + '" x2="594" y2="' + y + '"/>');
      var reg = trp ? (k.R === '-' ? 'trpR⁻' : 'trpR') : (k.I === '-' ? 'lacI⁻' : k.I === 's' ? 'lacIˢ' : 'lacI');
      p.push(box(8, 84, 'gene reg', reg, trp ? k.R === '-' : k.I !== '+', trp ? 'R' : 'I'));
      p.push('<text class="op-note" x="46" y="' + (y + 32) + '" text-anchor="middle">' + (trp ? (k.R === '-' ? 'no repressor' : 'repressor gene') : (k.I === '-' ? 'no repressor' : k.I === 's' ? 'super-repressor' : 'repressor gene')) + '</text>');
      var pr0 = trp ? 100 : 160, pr1 = trp ? 190 : 225, op1 = pr1 + 56, genes = trp ? ['trpE', 'trpD', 'trpC', 'trpB', 'trpA'] : ['lacZ', 'lacY', 'lacA'];
      if(!trp) p.push(box(100, 160, 'cap', 'CAP site'));
      p.push(box(pr0, pr1, 'prom', 'Promoter'));
      p.push(box(pr1, op1, 'oper', k.O === 'c' ? 'Oᶜ' : 'Operator', k.O === 'c', 'O'));
      var gx = op1, gw = trp ? 60 : [110, 90, 80];
      genes.forEach(function(g, i){ var w = trp ? gw : gw[i]; var mut = !trp && g === 'lacZ' && k.Z === '-'; p.push(box(gx, gx + w, 'gene', mut ? 'lacZ⁻' : g, mut, !trp && g === 'lacZ' ? 'Z' : '')); gx += w; });
      var ocx = (pr1 + op1) / 2, pcx = (pr0 + pr1) / 2;
      // CAP–cAMP
      if(!trp && s.cap) p.push('<rect class="op-cap" x="100" y="' + (y - 46) + '" width="60" height="28" rx="12"/><text class="op-tight" x="130" y="' + (y - 28) + '" text-anchor="middle">CAP–cAMP</text>');
      else if(!trp) p.push('<text class="op-note" x="130" y="' + (y - 26) + '" text-anchor="middle">no CAP</text>');
      // RNA polymerase
      var on = x.rnap !== 'blocked', py = on ? y - 32 : y - 66;
      p.push('<ellipse class="op-pol' + (x.rnap === 'weak' ? ' weak' : '') + '" cx="' + pcx + '" cy="' + py + '" rx="32" ry="15"/><text x="' + pcx + '" y="' + (py + 4) + '" text-anchor="middle">RNA pol</text>');
      if(!on) p.push('<text class="op-note" x="' + pcx + '" y="' + (y - 36) + '" text-anchor="middle">blocked</text>');
      else if(x.rnap === 'weak') p.push('<text class="op-note" x="' + pcx + '" y="' + (y - 56) + '" text-anchor="middle">binds weakly</text>');
      // repressor
      var repShape = function(cx, cy, label, extra){
        var r = '<path class="op-rep" d="M' + (cx - 34) + ' ' + (cy + 12) + 'h18l4 -6h24l4 6h18v-26h-68z"/><text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle">' + label + '</text>';
        if(extra) r += '<circle class="op-small" cx="' + (cx + 40) + '" cy="' + (cy - 10) + '" r="9"/><text class="op-note" x="' + (cx + 52) + '" y="' + (cy - 6) + '">' + extra + '</text>';
        return r;
      };
      var floatX = op1 + 40, fy = y0 + 46, onOp = x.rep === 'bound' || x.rep === 'super';
      // the repressor slides between the operator and its floating spot
      var prevOn = prevRep[ci], dxy = prevOn == null || prevOn === onOp || x.rep === 'none' ? null : onOp ? [floatX - ocx, fy - (y - 30)] : [ocx - floatX, (y - 30) - fy];
      prevRep[ci] = x.rep === 'none' ? null : onOp;
      var wrapRep = function(inner){ return '<g class="op-repg' + (dxy ? ' op-slide' : '') + '"' + (dxy ? ' style="--dx:' + dxy[0].toFixed(0) + 'px;--dy:' + dxy[1].toFixed(0) + 'px"' : '') + '>' + inner + '</g>'; };
      if(onOp) p.push(wrapRep(repShape(ocx, y - 30, 'Repressor', trp ? 'Trp' : '')) + (x.rep === 'super' ? '<text class="op-note" x="' + (op1 + 6) + '" y="' + (y - 26) + '">super-repressor: ignores allolactose</text>' : ''));
      else if(x.rep === 'released') p.push(wrapRep(repShape(floatX, fy, 'Repressor', 'allolactose')));
      else if(x.rep === 'inactive') p.push(wrapRep(repShape(floatX, fy, 'Repressor', '')) + '<text class="op-note" x="' + (floatX + 40) + '" y="' + (fy + 4) + '">no Trp: cannot bind</text>');
      else if(x.rep === 'cantbind') p.push(wrapRep(repShape(floatX, fy, 'Repressor', '')) + '<text class="op-note" x="' + (floatX + 40) + '" y="' + (fy + 4) + '">cannot bind Oᶜ</text>');
      else p.push('<text class="op-note" x="' + ocx + '" y="' + (y - 26) + '" text-anchor="middle">no repressor</text>');
      // mRNA
      var mx0 = op1, mx1 = gx;
      if(x.rate >= 5){
        var d = 'M' + mx0 + ' ' + (y + 30), n = Math.floor((mx1 - mx0) / 20);
        for(var i = 0; i < n; i++) d += ' q5 -' + (x.rate >= 50 ? 7 : 4) + ' 10 0 t10 0';
        p.push('<path class="op-mrna' + (x.rate >= 50 ? ' hi' : '') + '" d="' + d + '"/>');
        // ribbons peeling off: how many and how often from the model's rate
        var nr = x.rate >= 50 ? 4 : 1, dur = x.rate >= 50 ? 2.4 : 4.8;
        for(var j = 0; j < nr; j++) p.push('<path class="op-ribbon" style="animation-duration:' + dur + 's;animation-delay:-' + (j * dur / nr).toFixed(2) + 's" d="M' + (mx0 + 6) + ' ' + (y + 26) + ' q8 -6 16 0 t16 0 t16 0 t16 0"/>');
      } else p.push('<line class="op-mrna trickle" x1="' + mx0 + '" y1="' + (y + 30) + '" x2="' + (mx0 + 40) + '" y2="' + (y + 30) + '"/>');
      p.push('<text class="op-note" x="' + mx0 + '" y="' + (y + 52) + '">mRNA ' + F(x.rate, 0) + ' (' + lvl(x.rate) + ')' + (trp ? '' : k.Z === '-' ? ', no working enzyme' : '') + '</text>');
      return p.join('');
    }
    function figure(s, c){
      var h = 180 * c.copies.length + 6, svg = '';
      c.copies.forEach(function(k, i){ svg += rowSvg(s, c, i, i * 180); });
      var desc = 'Diagram of the ' + (c.mode === 'trp' ? 'trp' : 'lac') + ' operon, ' + genoText() + ', in ' + mediumText(c) + '. ' +
        s.copies.map(function(x, i){ return (c.copies.length > 1 ? COPY_NAMES[i] + ': ' : '') + 'repressor ' + repWords(x.rep, c) + '; ' + (c.mode === 'lac' ? (x.cap ? 'CAP–cAMP bound; ' : 'no CAP bound; ') : '') + 'RNA polymerase ' + polWords(x.rnap) + '; mRNA ' + F(x.rate, 0) + ' (' + lvl(x.rate) + ')'; }).join('. ') + '.';
      card.querySelector('.op-stagefig').innerHTML = '<svg class="op-fig" viewBox="0 0 600 ' + h + '" role="group" aria-label="' + esc(desc) + '"><rect class="op-cellbg" x="1" y="1" width="598" height="' + (h - 2) + '" rx="22"/>' + svg + '</svg>';
      tray();
    }

    /* -------------------------------------------------------- update */
    function course(){ return O.course(P, cond(startOf()), cond()); }
    function run(all){
      var media = all ? starts() : [null];
      media.forEach(function(m){
        var c = cond(m), s = O.state(P, c);
        runs.push({ n: runs.length + 1, mode: st.mode, geno: genoText(), medium: mediumText(c), rep: s.copies.map(function(x){ return repWords(x.rep, c); }).join(' / '), m: s.m, e: s.e });
      });
      T.event('apbio-sim-run', { tool: SLUG, n: media.length });
      var last = runs[runs.length - 1];
      card.querySelector('.bt-runnote').textContent = all ? 'Ran ' + media.length + ' media for ' + genoText() + '. They are in the data table of runs.'
        : 'Trial ' + last.n + ', ' + last.geno + ' in ' + last.medium + ': mRNA ' + F(last.m, 0) + ', enzyme ' + F(last.e, 0) + ' at steady state.';
      update(true);
    }
    function update(now){
      var c = cond(), s = O.state(P, c), co = course(), a = O.at(co, st.readT), trp = isTrp(), enzName = trp ? 'Trp enzymes' : 'β-galactosidase';
      figure(s, c);
      var spec, key;
      if(st.view === 'time'){
        var top = Math.max.apply(null, co.points.map(function(q){ return Math.max(q.m, q.e); }));
        var ymax = Math.max(100, T.niceMax(top * 1.05));
        spec = { title: 'Graph of ' + (trp ? 'trp' : 'lac') + ' mRNA (solid line) and ' + enzName + ' (dashed line) from ' + P.tStart + ' to ' + P.tEnd + ' min, ' + genoText() + ', moved from ' + mediumText(cond(startOf())) + ' to ' + mediumText(c) + ' at 0 min. At ' + st.readT + ' min, marked by a vertical line: mRNA ' + F(a.m, 1) + ', enzyme ' + F(a.e, 1) + '. The data table below lists the values.',
          x: { label: 'Time after the change', unit: 'min', min: P.tStart, max: P.tEnd, step: 15 }, y: { label: 'Level', unit: 'relative', min: 0, max: ymax, step: T.niceStep(ymax, 5) },
          curves: [{ points: co.points.map(function(q){ return [q.t, q.m]; }), cls: 's1' }, { points: co.points.map(function(q){ return [q.t, q.e]; }), cls: 's2', dashed: true }], vline: { x: st.readT } };
        key = 'Solid line: mRNA. Dashed line: ' + enzName + ' (working enzyme). Vertical line: the time you read.';
      } else {
        var ss = starts().map(function(m){ return { m: m, s: O.state(P, cond(m)) }; });
        var top2 = Math.max.apply(null, ss.map(function(q){ return Math.max(q.s.m, q.s.e); }));
        var ymax2 = Math.max(100, T.niceMax(top2 * 1.05));
        spec = { title: 'Bar graph of steady-state mRNA in every medium, ' + genoText() + ', with ' + enzName + ' as square points: ' + ss.map(function(q){ return q.m.label + ', mRNA ' + F(q.s.m, 0) + ' and enzyme ' + F(q.s.e, 0); }).join('; ') + '.',
          x: { label: 'Medium', unit: '', categories: ss.map(function(q){ return q.m.short; }) },
          y: { label: 'Steady-state level', unit: 'relative', min: 0, max: ymax2, step: T.niceStep(ymax2, 5) },
          bars: ss.map(function(q){ return { name: q.m.label, value: q.s.m, cls: 's1' }; }),
          points: ss.map(function(q, i){ return { x: i, y: q.s.e, cls: 's2', square: true }; }) };
        key = 'Bars: mRNA. Squares: ' + enzName + ' (working enzyme). Each medium kept until the levels stop changing.';
      }
      card.querySelector('.bt-plotwrap').innerHTML = T.plot(spec);
      card.querySelector('.op-key').textContent = key;
      var per = function(f){ return s.copies.map(function(x, i){ return (s.copies.length > 1 ? (i ? 'F′: ' : 'Chr.: ') : '') + f(x); }).join('; '); };
      var rows = [['Repressor', per(function(x){ return repWords(x.rep, c); })]];
      if(!trp) rows.push(['CAP–cAMP', s.cap ? 'bound (glucose absent, cAMP high)' : 'not bound (glucose present, cAMP low)']);
      rows.push(['RNA polymerase', per(function(x){ return polWords(x.rnap); })], ['mRNA at ' + st.readT + ' min', F(a.m, 1)], [enzName + ' at ' + st.readT + ' min', F(a.e, 1)], ['Steady state (mRNA / enzyme)', F(s.m, 0) + ' / ' + F(s.e, 0)]);
      card.querySelector('.bt-readout').innerHTML = rows.map(function(x){ return '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('');
      card.querySelector('.op-explain ol').innerHTML = explain(s, c).map(function(t){ return '<li>' + t + '</li>'; }).join('');
      say((trp ? 'trp' : 'lac') + ' operon, ' + genoText() + ', ' + mediumText(c) + ': repressor ' + per(function(x){ return repWords(x.rep, c); }) + '; RNA polymerase ' + per(function(x){ return polWords(x.rnap); }) +
        '. At ' + st.readT + ' min after the change from ' + mediumText(cond(startOf())) + ': mRNA ' + F(a.m, 1) + ', enzyme ' + F(a.e, 1) + ' (steady state ' + F(s.m, 0) + ' and ' + F(s.e, 0) + ').', now);
      var trows = co.points.filter(function(q){ return q.t % 5 === 0 || q.t === 2; }).map(function(q){ return [String(q.t), F(q.m, 1), F(q.e, 1)]; });
      card.querySelector('.bt-tables').innerHTML =
        (runs.length ? T.dataTable(['Trial', 'Operon', 'Genes', 'Medium', 'Repressor', 'mRNA (relative)', 'Enzyme (relative)'], runs.map(function(r){
          return [String(r.n), r.mode === 'trp' ? 'trp' : r.mode === 'mero' ? 'lac, two copies' : 'lac', esc(r.geno), esc(r.medium), esc(r.rep), F(r.m, 0), F(r.e, 0)];
        }), 'Your runs at steady state (' + runs.length + ')') : '<p class="bt-small">No runs yet. Use Run one trial or Run every medium.</p>') +
        T.dataTable(['Time (min)', 'mRNA (relative)', enzName + ' (relative)'], trows, 'Time course: ' + esc(genoText()) + ', ' + esc(mediumText(cond(startOf()))) + ' to ' + esc(mediumText(c)) + ' at 0 min');
    }
    /* ------------------------------------- tray, taps and drags */
    var prevRep = [], qmode = 'explore';
    var trayEl = card.querySelector('.op-tray'), figEl = card.querySelector('.op-stagefig');
    function geneTapLabel(g, k){
      var defs = isTrp() ? data.trpGenes : data.lacGenes, def = defs.filter(function(x){ return x.id === g; })[0];
      var cur = def.options.filter(function(o){ return o.value === k[g]; })[0];
      return def.label + ': ' + cur.label + '. Tap to change.';
    }
    function cycleGene(g, ci){
      var defs = isTrp() ? data.trpGenes : data.lacGenes, def = defs.filter(function(x){ return x.id === g; })[0], k = copies()[ci];
      var i = def.options.map(function(o){ return o.value; }).indexOf(k[g]);
      k[g] = def.options[(i + 1) % def.options.length].value;
      controls(); update(true);
      card.querySelector('.bt-runnote').textContent = (copies().length > 1 ? COPY_NAMES[ci] + ': ' : '') + def.options[(i + 1) % def.options.length].label + '.';
      var again = figEl.querySelector('[data-gene="' + g + '"][data-ci="' + ci + '"]'); if(again) again.focus();
    }
    figEl.addEventListener('click', function(e){ var g = e.target.closest && e.target.closest('.op-tapg'); if(g) cycleGene(g.getAttribute('data-gene'), +g.getAttribute('data-ci')); });
    figEl.addEventListener('keydown', function(e){ var g = e.target.closest && e.target.closest('.op-tapg'); if(g && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); cycleGene(g.getAttribute('data-gene'), +g.getAttribute('data-ci')); } });
    function chips(){ return isTrp() ? [['trp', 'Tryptophan', 'Trp']] : [['lactose', 'Lactose', 'Lac'], ['glucose', 'Glucose', 'Glc']]; }
    function tray(){
      if(qmode === 'quiz'){ trayEl.hidden = true; return; }
      trayEl.hidden = false;
      trayEl.innerHTML = '<span class="op-tray-h">Medium:</span>' + chips().map(function(c){ return '<button type="button" class="op-chip' + (st[c[0]] ? ' in' : '') + '" data-chip="' + c[0] + '" aria-pressed="' + !!st[c[0]] + '"><span class="op-mol" aria-hidden="true">' + c[2] + '</span>' + c[1] + (st[c[0]] ? ' ✓' : '') + '</button>'; }).join('');
    }
    function setChip(k, on){
      if(!!st[k] === on) return;
      st[k] = on; controls(); update(true);
      var c = chips().filter(function(x){ return x[0] === k; })[0];
      card.querySelector('.bt-runnote').textContent = c[1] + (on ? ' added' : ' removed') + '. ' + card.querySelector('.op-explain li').textContent;
    }
    var drag = null;
    trayEl.addEventListener('pointerdown', function(e){
      var b = e.target.closest('.op-chip'); if(!b) return;
      drag = { k: b.getAttribute('data-chip'), x: e.clientX, y: e.clientY, moved: false, ghost: null, b: b };
    });
    window.addEventListener('pointermove', function(e){
      if(!drag) return;
      if(!drag.moved && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
      if(!drag.moved){ drag.moved = true; drag.ghost = drag.b.cloneNode(true); drag.ghost.className += ' op-ghost'; document.body.appendChild(drag.ghost); try{ drag.b.releasePointerCapture(e.pointerId); }catch(er){} }
      drag.ghost.style.left = (e.clientX - 40) + 'px'; drag.ghost.style.top = (e.clientY - 22) + 'px';
      var r = figEl.getBoundingClientRect(), over = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
      figEl.classList.toggle('op-dropok', over);
      e.preventDefault();
    }, { passive: false });
    window.addEventListener('pointerup', function(e){
      if(!drag) return;
      var d = drag; drag = null;
      figEl.classList.remove('op-dropok');
      if(d.ghost) d.ghost.remove();
      if(!d.moved){ setChip(d.k, !st[d.k]); return; }
      var r = figEl.getBoundingClientRect(), over = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
      setChip(d.k, over);
    });
    trayEl.addEventListener('click', function(e){ var b = e.target.closest('.op-chip'); if(b && e.detail === 0) setChip(b.getAttribute('data-chip'), !st[b.getAttribute('data-chip')]); });

    /* -------------------------------------- which mutant is this? */
    var quizBox = card.querySelector('.op-chal'), qN = 0, qSeed = 1 + Math.floor(Math.random() * 99999), saveCopies = null;
    var LAC_STRAINS = [['wt', 'Wild type', { I: '+', O: '+', Z: '+' }], ['lacI-', 'lacI⁻ (no working repressor)', { I: '-', O: '+', Z: '+' }], ['lacIs', 'lacIˢ (super-repressor)', { I: 's', O: '+', Z: '+' }], ['Oc', 'Oᶜ (operator cannot bind repressor)', { I: '+', O: 'c', Z: '+' }], ['lacZ-', 'lacZ⁻ (no working β-galactosidase)', { I: '+', O: '+', Z: '-' }]];
    var TRP_STRAINS = [['trp-wt', 'Wild type', { R: '+', O: '+' }], ['trpR-', 'trpR⁻ (no repressor)', { R: '-', O: '+' }], ['trp-Oc', 'Oᶜ (operator cannot bind repressor)', { R: '+', O: 'c' }]];
    function newQuiz(){
      if(st.mode === 'mero'){ card.querySelector('#op-mode-lac').click(); return; }
      var g = M.rng(qSeed + 7919 * qN), list = isTrp() ? TRP_STRAINS : LAC_STRAINS, pick = list[(qN + g.int(0, list.length - 1)) % list.length]; qN++;
      var media = starts(), enzName = isTrp() ? 'trp mRNA' : 'β-galactosidase';
      var vals = media.map(function(m){ var c = cond(m); c.copies = [pick[2]]; var s = O.state(P, c); return isTrp() ? { m: s.m, e: s.m } : { m: s.m, e: s.e }; });
      var tbl = T.dataTable(['Medium', 'mRNA (relative)', enzName + ' (relative)'], media.map(function(m, i){ return [esc(m.label), F(vals[i].m, 0), F(vals[i].e, 0)]; }), 'Strain X at steady state (wild type fully on = 100)');
      if(isTrp()) tbl = T.dataTable(['Medium', 'trp mRNA (relative)'], media.map(function(m, i){ return [esc(m.label), F(vals[i].m, 0)]; }), 'Strain X at steady state (wild type fully on = 100)');
      var id = 'opq' + qN;
      quizBox.innerHTML = '<p class="os-chal-q" tabindex="-1"><b>Strain X (' + qN + ').</b> Each medium was kept until the levels stopped changing. Which strain is it?</p>' + tbl +
        '<fieldset class="os-ask"><legend>Strain X is…</legend>' + list.map(function(x, i){ return '<div class="bt-radio"><input type="radio" name="' + id + '" id="' + id + i + '" value="' + x[0] + '"><label for="' + id + i + '">' + esc(x[1]) + '</label></div>'; }).join('') + '</fieldset>' +
        '<div class="bt-actions"><button type="button" class="btn-press sm op-qcheck">Check</button></div><div class="os-chal-fb" role="status" aria-live="polite"></div>';
      // the stage is hidden until the answer, then shows strain X
      quizBox.querySelector('.op-qcheck').addEventListener('click', function(){
        var a = quizBox.querySelector('input:checked'), fb = quizBox.querySelector('.os-chal-fb');
        if(!a){ fb.textContent = 'Pick a strain first.'; return; }
        quizBox.querySelectorAll('input,button').forEach(function(x){ x.disabled = true; });
        var ok = a.value === pick[0];
        var why = { wt: 'Normal control: on only with lactose; high only without glucose (CAP). The tiny level with no lactose is the leak past the repressor.',
          'lacI-': 'On even with no lactose: there is no repressor to block RNA polymerase. Glucose still lowers it (CAP still matters).',
          lacIs: 'Never on, even in lactose: the super-repressor cannot bind allolactose, so it never leaves the operator.',
          Oc: 'On even with no lactose, like lacI⁻: the repressor is made but cannot grip the changed operator. Only a merodiploid (going further) tells Oᶜ from lacI⁻ (cis against trans).',
          'lacZ-': 'mRNA is made normally (switching works), but no working β-galactosidase: the mutation is in the enzyme gene, not the switch.',
          'trp-wt': 'Normal: tryptophan binds the repressor as a corepressor, so it binds the operator and the operon goes off.',
          'trpR-': 'On even with tryptophan: no repressor, so nothing can block RNA polymerase.',
          'trp-Oc': 'On even with tryptophan: the repressor–tryptophan complex cannot bind the changed operator.' }[pick[0]];
        if(pick[0] === 'lacI-' || pick[0] === 'Oc') ok = a.value === 'lacI-' || a.value === 'Oc';
        if(pick[0] === 'trpR-' || pick[0] === 'trp-Oc') ok = a.value === 'trpR-' || a.value === 'trp-Oc';
        fb.innerHTML = '<p><span class="bio-mark ' + (ok ? 'ok">Right' : 'no">Not quite') + '</span> It is ' + esc(pick[1]) + '. ' + esc(why) + (pick[0] === 'lacI-' || pick[0] === 'Oc' ? ' (lacI⁻ and Oᶜ both count here: these levels cannot tell them apart.)' : pick[0] === 'trpR-' || pick[0] === 'trp-Oc' ? ' (trpR⁻ and Oᶜ both count here: these levels cannot tell them apart.)' : '') + '</p><p class="bt-small">The figure now shows strain X: tap the chips to see it in each medium.</p><div class="bt-actions"><button type="button" class="btn-press sm os-next">Next strain</button>' + T.report(SLUG + ':mutant-' + pick[0]) + '</div>';
        copies()[0] = Object.assign({}, pick[2]); qmodeShow(true);
        fb.querySelector('.os-next').addEventListener('click', function(){ qmodeShow(false); newQuiz(); quizBox.querySelector('.os-chal-q').focus(); });
        T.record(SLUG, [{ id: SLUG + ':mutant-' + pick[0] + ':a', correct: ok, topic: data.topic, level: 'analyze', diff: 2, group: 'mutant' }]);
      });
      copies()[0] = Object.assign({}, isTrp() ? WT_TRP : WT_LAC); qmodeShow(false);
    }
    function qmodeShow(reveal){ qmode = reveal ? 'reveal' : 'quiz'; figEl.hidden = !reveal; controls(); update(true); if(reveal) tray(); }
    function setQ(m){
      card.querySelectorAll('[data-q]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-q') === m)); });
      var q = m === 'quiz';
      quizBox.hidden = !q;
      ['.bt-controls', '.op-lower', '.bt-readout', '.op-explain', '.bt-summary', '.bt-buttons', '.bt-data', '.bt-runnote', '.op-taphint'].forEach(function(sel){ var el = card.querySelector(sel); if(el) el.hidden = q; });
      if(q){ saveCopies = { lac: st.lac.map(function(k){ return Object.assign({}, k); }), trpG: st.trpG.map(function(k){ return Object.assign({}, k); }) }; qmode = 'quiz'; newQuiz(); }
      else { qmode = 'explore'; figEl.hidden = false; if(saveCopies){ st.lac = saveCopies.lac; st.trpG = saveCopies.trpG; } controls(); update(true); }
    }
    card.querySelectorAll('[data-q]').forEach(function(b){ b.addEventListener('click', function(){ if(b.getAttribute('aria-pressed') !== 'true') setQ(b.getAttribute('data-q')); }); });

    controls();
    update(true);
    T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
    if(data.frq) T.frq(app, data.frq, SLUG);
    if(/^#mutant/.test(location.hash)) setQ('quiz');
  });
})();
