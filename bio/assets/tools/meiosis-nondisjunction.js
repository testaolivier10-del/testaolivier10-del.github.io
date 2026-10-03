/* Simulator: meiosis and nondisjunction (Unit 5). The model is in
   bio-tool-math.js (ApBioMath.meiosis); the pair counts, the step texts, the
   "How this model works" box, the questions and the mini FRQ are data
   (bio/data/tools/meiosis-nondisjunction.json). The student picks 2n = 4 or
   6, crossing over, each pair's metaphase I orientation and a nondisjunction
   (meiosis I or II, which pair), steps one cell from G1 to four gametes,
   reads every cell in words, the gametes and zygotes in a table, the
   comparison with mitosis, and plots chromosomes and DNA per cell. */
(function(){
  'use strict';
  var SLUG = 'meiosis-nondisjunction';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  T.mount(SLUG, function(app, data){
    var esc = T.esc, F = T.F, Me = M.meiosis;
    var view = 'count', runs = [], series = null;
    var st = { k: data.pairs.value, cross: false, orient: [0, 0, 0, 0], nd: 'none', ndPair: 0, ndCell: 0, step: 0 };
    var LEN = [46, 36, 26, 20], W = 360;

    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
      '<section class="bt-card" aria-labelledby="mei-h"><h2 id="mei-h">The model</h2><div class="bt-controls"></div>' +
      '<div class="mei-stepper"><button type="button" class="bt-btn" data-a="back">Back</button><button type="button" class="btn-press sm" data-a="next">Next step</button><div class="mei-stepsel"></div></div>' +
      '<div class="mei-stephead"><h3 class="mei-steptitle" tabindex="-1"></h3><p class="mei-steptext"></p></div>' +
      '<div class="bt-stage two"><div><div class="bt-fig"></div><div class="mei-words"></div></div><div><div class="bt-tabs" role="group" aria-label="Graph">' +
      '<button type="button" class="bt-btn" data-v="count" aria-pressed="true">Chromosomes per cell</button><button type="button" class="bt-btn" data-v="dna" aria-pressed="false">DNA per cell</button>' +
      '</div><div class="bt-plotwrap"></div></div></div>' +
      '<dl class="bt-readout"></dl><p class="bt-summary"></p>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm" data-a="run">Record these gametes</button><button type="button" class="btn-press sm alt" data-a="series">Try every line-up</button><button type="button" class="bt-btn" data-a="clear">Clear runs</button></div>' +
      '<p class="bt-small bt-runnote" role="status" aria-live="polite"></p>' +
      '<div class="mei-results"></div>' +
      '<details class="bt-data"><summary>Data tables: your runs and every cell at each step</summary><div class="bt-tables"></div></details></section>' +
      '<section class="bt-card" aria-labelledby="mei-q"><h2 id="mei-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');
    var card = app.querySelector('.bt-card'), ctl = card.querySelector('.bt-controls');
    var say = T.announcer(card.querySelector('.bt-summary'));

    /* ---------------------------------------------------- controls */
    var pairSel = T.choiceSelect({ label: 'Cell', value: st.k, options: data.pairs.options.map(function(o){ return { value: o.value, label: o.label }; }), onChange: function(v){
      st.k = +v; if(st.ndPair >= st.k) st.ndPair = 0; series = null; buildOrient(); buildNdPair(); update(true);
    } });
    ctl.appendChild(pairSel.el);
    var cofs = document.createElement('fieldset');
    cofs.className = 'bt-ctl bt-checks';
    var coId = T.nid('mei-co');
    cofs.innerHTML = '<legend>Prophase I</legend><div class="bt-check-row"><input type="checkbox" id="' + coId + '"><label for="' + coId + '">Crossing over (one per pair)</label></div>';
    cofs.querySelector('input').addEventListener('change', function(e){ st.cross = e.target.checked; series = null; update(true); });
    ctl.appendChild(cofs);
    var orFs = document.createElement('fieldset');
    orFs.className = 'bt-ctl bt-checks mei-orient';
    ctl.appendChild(orFs);
    function buildOrient(){
      orFs.innerHTML = '<legend>Metaphase I: which homolog faces cell 1</legend>';
      for(var i = 0; i < st.k; i++) (function(i){
        var s = T.choiceSelect({ label: 'Pair ' + (i + 1), value: st.orient[i], options: [{ value: 0, label: 'Maternal (' + (i + 1) + 'M) toward cell 1' }, { value: 1, label: 'Paternal (' + (i + 1) + 'P) toward cell 1' }], onChange: function(v){ st.orient[i] = +v; update(true); } });
        orFs.appendChild(s.el);
      })(i);
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bt-btn'; b.textContent = 'Next line-up';
      b.addEventListener('click', function(){
        var n = 0, i; for(i = 0; i < st.k; i++) n += st.orient[i] << i;
        n = (n + 1) % Math.pow(2, st.k);
        for(i = 0; i < st.k; i++) st.orient[i] = (n >> i) & 1;
        orFs.querySelectorAll('select').forEach(function(s, j){ s.value = String(st.orient[j]); });
        card.querySelector('.bt-runnote').textContent = 'Line-up ' + (n + 1) + ' of ' + Math.pow(2, st.k) + ': ' + orientText() + '.';
        update(true);
      });
      orFs.appendChild(b);
    }
    var ndSel = T.choiceSelect({ label: 'Nondisjunction', value: 'none', options: [
      { value: 'none', label: 'None: every pair separates' }, { value: 'I', label: 'In meiosis I (homologs stay together)' },
      { value: 'II-0', label: 'In meiosis II, cell 1 (sisters stay together)' }, { value: 'II-1', label: 'In meiosis II, cell 2 (sisters stay together)' }
    ], onChange: function(v){
      st.nd = v === 'none' ? 'none' : v === 'I' ? 'I' : 'II'; st.ndCell = v === 'II-1' ? 1 : 0;
      series = null; ndPairWrap.hidden = st.nd === 'none'; update(true);
    } });
    ctl.appendChild(ndSel.el);
    var ndPairWrap = document.createElement('div');
    ndPairWrap.hidden = true;
    ctl.appendChild(ndPairWrap);
    function buildNdPair(){
      var opts = []; for(var i = 0; i < st.k; i++) opts.push({ value: i, label: 'Pair ' + (i + 1) });
      var s = T.choiceSelect({ label: 'Pair that fails to separate', value: st.ndPair, options: opts, onChange: function(v){ st.ndPair = +v; series = null; update(true); } });
      ndPairWrap.innerHTML = ''; ndPairWrap.appendChild(s.el);
    }
    buildOrient(); buildNdPair();

    var stepSel = T.choiceSelect({ label: 'Go to step', value: 0, options: data.stages.map(function(s, i){ return { value: i, label: (i + 1) + '. ' + s.name }; }), onChange: function(v){ go(+v); } });
    card.querySelector('.mei-stepsel').appendChild(stepSel.el);
    card.querySelector('[data-a="back"]').addEventListener('click', function(){ go(st.step - 1); });
    card.querySelector('[data-a="next"]').addEventListener('click', function(){ go(st.step + 1); });
    function go(i){
      st.step = Math.max(0, Math.min(data.stages.length - 1, i));
      stepSel.set(st.step);
      update(true);
    }
    card.querySelectorAll('.bt-tabs .bt-btn').forEach(function(b){
      b.addEventListener('click', function(){
        view = b.getAttribute('data-v');
        card.querySelectorAll('.bt-tabs .bt-btn').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        update(true);
      });
    });
    card.querySelector('[data-a="run"]').addEventListener('click', function(){ record(); });
    card.querySelector('[data-a="series"]').addEventListener('click', function(){
      series = Me.series(cond());
      T.event('apbio-sim-run', { tool: SLUG, n: series.lineups });
      card.querySelector('.bt-runnote').textContent = 'Tried all ' + series.meiosisI + ' metaphase I line-ups' + (st.cross ? ' and, for each, every way the sister chromatids can line up in meiosis II (' + F(series.lineups, 0) + ' in all)' : '') + ': ' + series.kinds + ' different gametes. 2' + sup(st.k) + ' = ' + Math.pow(2, st.k) + '.';
      update(true);
    });
    card.querySelector('[data-a="clear"]').addEventListener('click', function(){ runs = []; card.querySelector('.bt-runnote').textContent = 'Runs cleared.'; update(true); });

    /* ------------------------------------------------------ model */
    function cond(){ return { pairs: st.k, cross: st.cross, orient: st.orient.slice(0, st.k), nd: st.nd, ndPair: st.ndPair, ndCell: st.ndCell }; }
    function sup(n){ return String(n).split('').map(function(d){ return '⁰¹²³⁴⁵⁶⁷⁸⁹'.charAt(+d); }).join(''); }
    function orientText(){ var a = []; for(var i = 0; i < st.k; i++) a.push((i + 1) + (st.orient[i] ? 'P' : 'M')); return a.join(', ') + ' toward cell 1'; }
    function ndText(){
      if(st.nd === 'none') return 'no nondisjunction';
      return 'pair ' + (st.ndPair + 1) + ' fails to separate in meiosis ' + (st.nd === 'I' ? 'I' : 'II, cell ' + (st.ndCell + 1));
    }
    function setText(){ return '2n = ' + (2 * st.k) + ', crossing over ' + (st.cross ? 'on' : 'off') + ', ' + ndText(); }
    function tipWord(t){ return t.tip !== t.from ? (t.tip === 'M' ? ' with an M tip' : ' with a P tip') : ''; }
    function chromWords(ch){
      var nm = (ch.pair + 1) + ch.from;
      if(ch.c.length === 1) return nm + tipWord(ch.c[0]);
      var a = tipWord(ch.c[0]), b = tipWord(ch.c[1]);
      return nm + ' (2 sister chromatids' + (a || b ? ': ' + (a ? 'one' + a : 'one unchanged') + ', ' + (b ? 'one' + b : 'one unchanged') : '') + ')';
    }
    function nLabel(n){ var d = n - st.k; return d === 0 ? 'n' : d > 0 ? 'n+' + d : 'n−' + (-d); }

    /* ------------------------------------------------------ figure */
    var lens = function(p){ return LEN[p] || 20; };
    function chromatid(x, cy, t, w){
      var L = lens(t.pair), top = cy - 0.45 * L, tip = 0.3 * L;
      var cls = function(f){ return f === 'M' ? 'mei-m' : 'mei-p'; };
      var fill = function(f){ return f === 'P' ? ' fill="url(#mei-stripe)"' : ''; };
      return '<rect class="' + cls(t.tip) + '"' + fill(t.tip) + ' x="' + x.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + w + '" height="' + tip.toFixed(1) + '" rx="2"/>' +
        '<rect class="' + cls(t.from) + '"' + fill(t.from) + ' x="' + x.toFixed(1) + '" y="' + (top + tip).toFixed(1) + '" width="' + w + '" height="' + (L - tip).toFixed(1) + '" rx="2"/>' +
        '<rect class="mei-out" x="' + x.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + w + '" height="' + L + '" rx="3"/>';
    }
    var CW = 8, SG = 2;
    function widthOf(ch){ return ch.c.length * CW + (ch.c.length - 1) * SG; }
    /* One chromosome with its centromere and label, left edge at x. */
    function chrom(x, cy, ch, ly){
      var s = '';
      ch.c.forEach(function(t, i){ s += chromatid(x + i * (CW + SG), cy, t, CW); });
      var w = widthOf(ch);
      s += '<circle class="mei-cen" cx="' + (x + w / 2).toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (ch.c.length > 1 ? 3.2 : 2.4) + '"/>';
      s += '<text class="mei-lab" x="' + (x + w / 2).toFixed(1) + '" y="' + (ly || cy + 0.55 * lens(ch.pair) + 12).toFixed(1) + '" text-anchor="middle">' + (ch.pair + 1) + ch.from + '</text>';
      return s;
    }
    /* Chromosomes in a row, centered at cx, centromeres on line cy. Paired
       homologs (prophase I) sit together; gaps separate the rest. */
    function row(list, cx, cy, gapIn, groupBy){
      var groups = [], cur = null;
      list.forEach(function(ch){ if(groupBy && cur && cur[0].pair === ch.pair) cur.push(ch); else { cur = [ch]; groups.push(cur); } });
      var gw = groups.map(function(g){ return g.reduce(function(n, ch){ return n + widthOf(ch); }, 0) + (g.length - 1) * 3; });
      var tot = gw.reduce(function(a, b){ return a + b; }, 0) + (groups.length - 1) * gapIn, x = cx - tot / 2, s = '', ly = cy + 0.55 * maxLen(list) + 12;
      groups.forEach(function(g, i){ var xx = x; g.forEach(function(ch){ s += chrom(xx, cy, ch, ly); xx += widthOf(ch) + 3; }); x += gw[i] + gapIn; });
      return s;
    }
    function cellBox(x, y, w, h, title){
      return '<rect class="mei-cell" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + Math.min(36, h / 3) + '"/>' + (title ? '<text class="mei-ttl" x="' + (x + w / 2) + '" y="' + (y + 16) + '" text-anchor="middle">' + esc(title) + '</text>' : '');
    }
    function maxLen(list){ return Math.max.apply(null, list.map(function(ch){ return lens(ch.pair); }).concat([20])); }
    /* Rows along a plate (metaphase): one row per item, each item drawn by fn(cy). */
    function figure(r){
      var s = r.stages[st.step], id = s.id, out = [], H;
      var defs = '<defs><pattern id="mei-stripe" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="mei-pbg" width="5" height="5"/><rect class="mei-pst" width="2" height="5"/></pattern></defs>';
      if(id === 'g1' || id === 's' || id === 'pro1'){
        var list = s.cells[0], ml = maxLen(list);
        H = ml + 70;
        out.push(cellBox(20, 6, W - 40, H - 12, ''));
        out.push(row(list, W / 2, 6 + 22 + 0.45 * ml, id === 'pro1' ? 16 : 12, id === 'pro1'));
        if(id === 'pro1') out.push('<text class="mei-note" x="' + (W / 2) + '" y="' + (H - 12) + '" text-anchor="middle">' + (st.cross ? 'Homologs paired; nonsister chromatids swapped tips' : 'Homologs paired; no crossing over') + '</text>');
      } else if(id === 'meta1' || id === 'ana1'){
        var k = st.k, rows = [], y = 34;
        for(var i = 0; i < k; i++){
          rows.push({ pair: i, y: y + 0.45 * lens(i) }); y += lens(i) + 22;
        }
        H = y + 18;
        out.push(cellBox(20, 6, W - 40, H - 12, ''));
        out.push('<text class="mei-pole" x="30" y="24">cell 1 side</text><text class="mei-pole" x="' + (W - 30) + '" y="24" text-anchor="end">cell 2 side</text>');
        if(id === 'meta1'){
          out.push('<line class="mei-plate" x1="' + (W / 2) + '" x2="' + (W / 2) + '" y1="14" y2="' + (H - 14) + '"/>');
          rows.forEach(function(rw){
            var L = s.sides[0][rw.pair], R = s.sides[1][rw.pair];
            out.push(chrom(W / 2 - 2 - widthOf(L), rw.y, L) + chrom(W / 2 + 2, rw.y, R));
          });
        } else {
          var c1 = s.cells[0], c2 = s.cells[1];
          rows.forEach(function(rw){
            var l = c1.filter(function(ch){ return ch.pair === rw.pair; }), rr = c2.filter(function(ch){ return ch.pair === rw.pair; });
            var x = 44; l.forEach(function(ch){ out.push(chrom(x, rw.y, ch)); x += widthOf(ch) + 8; });
            x = W - 44; rr.slice().reverse().forEach(function(ch){ x -= widthOf(ch); out.push(chrom(x, rw.y, ch)); x -= 8; });
            if(!rr.length || !l.length) out.push('<text class="mei-note" x="' + (W / 2) + '" y="' + (rw.y + 4) + '" text-anchor="middle">pair ' + (rw.pair + 1) + ' did not separate</text>');
          });
        }
      } else if(id === 'mei1' || id === 'meta2' || id === 'ana2'){
        var cw = (W - 30) / 2, items = r.stages[5].cells;
        if(id === 'mei1'){
          var ml2 = maxLen(items[0].concat(items[1]));
          H = ml2 + 76;
          [0, 1].forEach(function(ci){ var x0 = 10 + ci * (cw + 10); out.push(cellBox(x0, 6, cw, H - 12, 'Cell ' + (ci + 1) + ': ' + items[ci].length + ' chromosomes')); out.push(row(items[ci], x0 + cw / 2, 36 + 0.45 * ml2, 10)); });
        } else {
          var heights = [0, 1].map(function(ci){ var yy = 30; items[ci].forEach(function(ch){ yy += lens(ch.pair) + 22; }); return yy; });
          H = Math.max(heights[0], heights[1]) + 14;
          [0, 1].forEach(function(ci){
            var x0 = 10 + ci * (cw + 10), mid = x0 + cw / 2, yy = 30;
            out.push(cellBox(x0, 6, cw, H - 12, 'Cell ' + (ci + 1)));
            if(id === 'meta2') out.push('<line class="mei-plate" x1="' + mid + '" x2="' + mid + '" y1="24" y2="' + (H - 14) + '"/>');
            items[ci].forEach(function(ch){
              var cy = yy + 0.45 * lens(ch.pair) + 6;
              if(id === 'meta2') out.push(chrom(mid - widthOf(ch) / 2, cy, ch));
              else {
                var t0 = ch.c[0], t1 = ch.c[1], together = st.nd === 'II' && st.ndCell === ci && st.ndPair === ch.pair;
                if(together){ out.push(chrom(x0 + 14, cy, { pair: ch.pair, from: ch.from, c: [t0] }) + chrom(x0 + 14 + CW + 6, cy, { pair: ch.pair, from: ch.from, c: [t1] }) + '<text class="mei-note" x="' + (mid + 8) + '" y="' + (cy + 4) + '">sisters did not separate</text>'); }
                else out.push(chrom(x0 + 14, cy, { pair: ch.pair, from: t0.from, c: [t0] }) + chrom(x0 + cw - 14 - CW, cy, { pair: ch.pair, from: t1.from, c: [t1] }));
              }
              yy += lens(ch.pair) + 22;
            });
          });
        }
      } else {
        var gw = (W - 30) / 2, gh = maxLen([].concat.apply([], s.cells)) + 64;
        H = 2 * gh + 22;
        s.cells.forEach(function(cell, gi){
          var x0 = 10 + (gi % 2) * (gw + 10), y0 = 6 + Math.floor(gi / 2) * (gh + 10), g = r.gametes[gi];
          out.push(cellBox(x0, y0, gw, gh, 'Gamete ' + (gi + 1) + ': ' + g.n + ' (' + g.label + ')'));
          if(cell.length) out.push(row(cell, x0 + gw / 2, y0 + 30 + 0.45 * maxLen(cell), 10));
          else out.push('<text class="mei-note" x="' + (x0 + gw / 2) + '" y="' + (y0 + gh / 2) + '" text-anchor="middle">no chromosomes</text>');
        });
      }
      return '<svg class="mei-fig" viewBox="0 0 ' + W + ' ' + Math.round(H) + '" role="img" aria-label="' + esc(words(r).join(' ')) + '">' + defs + out.join('') + '</svg>';
    }
    /* Every cell at this step in words: the figure's text twin. */
    function words(r){
      var s = r.stages[st.step], id = s.id, d = data.stages[st.step], out = ['Step ' + (st.step + 1) + ', ' + d.name + ', ' + setText() + '.'];
      var desc = function(cell){ return cell.length ? cell.map(chromWords).join('; ') : 'no chromosomes'; };
      if(id === 'meta1') for(var i = 0; i < st.k; i++) out.push('Pair ' + (i + 1) + ': ' + chromWords(s.sides[0][i]) + ' faces cell 1, ' + chromWords(s.sides[1][i]) + ' faces cell 2.');
      else if(id === 'ana1') out.push('Moving to the cell 1 side: ' + desc(s.cells[0]) + '.', 'Moving to the cell 2 side: ' + desc(s.cells[1]) + '.');
      else if(id === 'ana2') [0, 1, 2, 3].forEach(function(g){ out.push('In cell ' + (g < 2 ? 1 : 2) + ', moving toward gamete ' + (g + 1) + ': ' + desc(s.cells[g]) + '.'); });
      else if(id === 'gametes') s.cells.forEach(function(c, g){ out.push('Gamete ' + (g + 1) + ', ' + c.length + ' chromosomes (' + r.gametes[g].label + '): ' + desc(c) + '.'); });
      else s.cells.forEach(function(c, ci){ out.push((s.cells.length > 1 ? 'Cell ' + (ci + 1) : 'The cell') + ', ' + c.length + ' chromosomes' + (id === 'pro1' ? ', homologs paired' : '') + ': ' + desc(c) + '.'); });
      return out;
    }
    function gameteText(g){ return g.chromosomes.length ? g.chromosomes.map(chromWords).join(', ') : 'none'; }
    function zygoteText(g){ return g.zygote + ' (' + g.zlabel + (g.trisomy >= 0 ? ', trisomy for pair ' + (g.trisomy + 1) : g.monosomy >= 0 ? ', monosomy for pair ' + (g.monosomy + 1) : '') + ')'; }
    function record(){
      var r = Me.simulate(cond());
      runs.push({ n: runs.length + 1, text: setText() + '; ' + orientText(), g: r.gametes.map(function(g){ return g.n + ' (' + g.label + ')'; }), kinds: r.kinds });
      T.event('apbio-sim-run', { tool: SLUG, n: 1 });
      card.querySelector('.bt-runnote').textContent = 'Run ' + runs.length + ': gametes with ' + r.gametes.map(function(g){ return g.n; }).join(', ') + ' chromosomes; ' + r.kinds + ' kind' + (r.kinds === 1 ? '' : 's') + ' of gamete.';
      update(true);
    }

    /* ------------------------------------------------------ update */
    var STAGE_PTS = [['G1', 0], ['After S', 1], ['After meiosis I', 5], ['Gametes', 8]];
    function update(now){
      var r = Me.simulate(cond()), s = r.stages[st.step], d = data.stages[st.step], mi = Me.mitosis({ pairs: st.k });
      card.querySelector('.mei-steptitle').textContent = 'Step ' + (st.step + 1) + ' of ' + data.stages.length + ': ' + d.name;
      card.querySelector('.mei-steptext').textContent = d.text;
      card.querySelector('[data-a="back"]').disabled = st.step === 0;
      card.querySelector('[data-a="next"]').disabled = st.step === data.stages.length - 1;
      card.querySelector('.bt-fig').innerHTML = figure(r);
      card.querySelector('.mei-words').innerHTML = '<p class="bt-small">In words</p><ul>' + words(r).slice(1).map(function(w){ return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' +
        '<p class="bt-small mei-key">Key: maternal homologs are solid orange-red and labeled M; paternal homologs are blue with stripes and labeled P. A tip in the other style came from crossing over.</p>';
      // the plot: chromosomes or DNA per cell at four points, with mitosis dashed
      var isN = view === 'count', pts = [], ymax = isN ? 2 * st.k + 2 : 5;
      STAGE_PTS.forEach(function(p, xi){
        var stg = r.stages[p[1]], vals = isN ? stg.counts : stg.dna;
        vals.forEach(function(v, ci){ var line = stg.cells.length === 4 ? (ci < 2 ? 0 : 1) : ci; pts.push({ x: xi, y: v, cls: line ? 's4' : 's1', square: !!line }); });
      });
      var mitosis = isN ? [[0, 2 * st.k], [1, 2 * st.k], [2, mi.counts[0]]] : [[0, mi.dna[0]], [1, mi.dna[1]], [2, mi.dna[2]]];
      var ptsText = STAGE_PTS.map(function(p){ var stg = r.stages[p[1]], v = isN ? stg.counts : stg.dna; return p[0] + ' ' + v.map(function(x){ return F(x, isN ? 0 : 2); }).join(' and '); }).join('; ');
      var spec = { title: (isN ? 'Chromosomes' : 'DNA units') + ' per cell through meiosis, ' + setText() + '. Circles: cell 1 and its gametes; squares: cell 2 and its gametes; dashed line: mitosis of the same cell. Values: ' + ptsText + '.',
        x: { label: 'Stage', unit: '', categories: STAGE_PTS.map(function(p){ return p[0]; }) },
        y: { label: isN ? 'Chromosomes per cell' : 'DNA per cell', unit: isN ? '' : 'units, G1 = 2', min: 0, max: ymax, step: isN && ymax > 6 ? 2 : 1 },
        curves: [{ points: mitosis, cls: 's3', dashed: true }], points: pts };
      card.querySelector('.bt-plotwrap').innerHTML = T.plot(spec) + '<p class="bt-small">Circles: cell 1 and gametes 1-2. Squares: cell 2 and gametes 3-4. Dashed line: mitosis of the same cell.</p>';
      var kinds = r.gametes.map(function(g){ return g.label; });
      card.querySelector('.bt-readout').innerHTML = [
        ['Cells at this step', String(s.id === 'ana1' ? 1 : s.id === 'ana2' ? 2 : s.cells.length)],
        ['Chromosomes per cell', s.id === 'ana1' ? F(2 * st.k, 0) + ' (separating)' : s.id === 'ana2' ? r.stages[5].counts.join(' / ') + ' (separating)' : s.counts.join(' / ')],
        ['DNA per cell (G1 = 2)', (s.id === 'ana1' ? [4] : s.id === 'ana2' ? r.stages[5].dna : s.dna).map(function(x){ return F(x, 2).replace(/\.?0+$/, ''); }).join(' / ')],
        ['Gametes', kinds.join(', ')],
        ['Possible gametes (2' + sup(st.k) + ')', String(r.combos)],
        ['Kinds this cell made', String(r.kinds)]
      ].map(function(x){ return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('');
      say(data.stages[st.step].name + ', ' + setText() + '. ' + words(r).slice(1).join(' ') + ' Gametes: ' + r.gametes.map(function(g, i){ return 'gamete ' + (i + 1) + ' ' + g.n + ' (' + g.label + ')'; }).join(', ') + '.', now);
      // results: the four gametes and zygotes, the 2^n line, and mitosis
      var res = T.dataTable(['Gamete', 'Chromosomes', 'Number', 'Zygote with a normal gamete (n = ' + st.k + ')'], r.gametes.map(function(g, i){
        return [String(i + 1), esc(gameteText(g)), g.n + ' (' + g.label + ')', esc(zygoteText(g))];
      }), 'The four gametes (' + esc(setText()) + ')');
      res += '<p class="mei-combos">Independent assortment alone: 2' + sup(st.k) + ' = <b>' + r.combos + '</b> possible gametes with ' + st.k + ' pairs; this one cell made <b>' + r.kinds + '</b> kind' + (r.kinds === 1 ? '' : 's') + '. In humans, n = ' + data.humanN + ': 2' + sup(data.humanN) + ' = ' + F(Math.pow(2, data.humanN), 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' +
        (series ? ' Every line-up together: <b>' + series.kinds + '</b> different gametes.' : '') + '</p>';
      var mlabel = mi.counts.map(function(n){ return n + ' (2n)'; }).join(', ');
      res += T.dataTable(['', 'Mitosis of this cell', 'Meiosis of this cell'], [
        ['Divisions', '1', '2'],
        ['Cells made', '2', '4'],
        ['Chromosomes per cell', mlabel, r.gametes.map(function(g){ return g.n + ' (' + g.label + ')'; }).join(', ')],
        ['Homologs pair; crossing over', 'No', st.cross ? 'Yes (on)' : 'Yes in real cells (off in this run)'],
        ['Cells identical to each other', mi.identical ? 'Yes, and to the parent cell' : 'No', r.kinds === 1 ? 'Yes' : 'No: ' + r.kinds + ' kinds']
      ], 'Compared with mitosis');
      card.querySelector('.mei-results').innerHTML = res;
      // data tables
      var rowsAll = [];
      r.stages.forEach(function(stg, i){ stg.cells.forEach(function(c, ci){ rowsAll.push([esc((i + 1) + '. ' + data.stages[i].name + (stg.cells.length > 1 ? ', ' + (stg.id === 'ana2' || stg.id === 'gametes' ? 'gamete ' : stg.id === 'ana1' ? 'side ' : 'cell ') + (ci + 1) : '')), String(c.length), F(stg.dna[ci], 2), esc(c.map(chromWords).join('; ') || 'none')]); }); });
      card.querySelector('.bt-tables').innerHTML =
        (runs.length ? T.dataTable(['Run', 'Settings', 'Gamete 1', 'Gamete 2', 'Gamete 3', 'Gamete 4', 'Kinds of gametes'], runs.map(function(x){ return [String(x.n), esc(x.text)].concat(x.g).concat([String(x.kinds)]); }), 'Your runs (' + runs.length + ')') : '<p class="bt-small">No runs yet. Use Record these gametes.</p>') +
        T.dataTable(['Step and cell', 'Chromosomes', 'DNA (units)', 'Chromosomes in the cell'], rowsAll, 'Every cell at each step (' + esc(setText()) + ')');
    }
    update(true);
    T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
    if(data.frq) T.frq(app, data.frq, SLUG);
  });
})();
