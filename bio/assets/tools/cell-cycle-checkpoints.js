/* Simulator: cell cycle checkpoints (Unit 4). The model is in
   bio-tool-math.js (ApBioMath.cellCycle); its numbers, the mutations, the
   outputs, the "How this model works" box, the questions and the mini FRQ
   are data (bio/data/tools/cell-cycle-checkpoints.json). The student sets
   growth factor, DNA damage, mutations and a spindle poison, reads the dish
   at a chosen hour (the cycle figure, a readout and tables), plots any output
   over time, the DNA content histogram, or an output against growth factor,
   and runs trials that land as points. */
(function(){
  'use strict';
  var SLUG = 'cell-cycle-checkpoints';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  T.mount(SLUG, function(app, data){
    var esc = T.esc, F = T.F, C = M.cellCycle, P = data.model;
    var view = 'time', runs = [];
    var st = { gf: data.growthFactor.value, damage: data.damage.value, readT: data.readTime.value, p53: false, rb: false, cycd: false, ras: false, spindle: false, out: 'pctG1' };
    var outOf = function(id){ return data.outputs.filter(function(o){ return o.id === id; })[0]; };
    var KEYS = data.mutations.map(function(m){ return m.id; }).concat(data.drugs.map(function(d){ return d.id; }));
    var BIN_SHORT = ['2', '2–2.5', '2.5–3', '3–3.5', '3.5–4', '4'];

    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
      '<section class="bt-card" aria-labelledby="cc-h"><h2 id="cc-h">The model</h2><div class="bt-controls"></div>' +
      '<div class="bt-stage two"><div class="bt-fig"></div><div><div class="bt-tabs" role="group" aria-label="Graph">' +
      '<button type="button" class="bt-btn" data-v="time" aria-pressed="true">Over time</button><button type="button" class="bt-btn" data-v="hist" aria-pressed="false">DNA content</button><button type="button" class="bt-btn" data-v="gf" aria-pressed="false">Against growth factor</button>' +
      '</div><div class="bt-plotwrap"></div></div></div>' +
      '<dl class="bt-readout"></dl><p class="bt-summary"></p>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm" data-a="run">Run one trial</button><button type="button" class="btn-press sm alt" data-a="series">Run a series</button><button type="button" class="bt-btn" data-a="clear">Clear runs</button></div>' +
      '<p class="bt-small bt-runnote" role="status" aria-live="polite"></p>' +
      '<details class="bt-data"><summary>Data tables: your runs, the dish over time and the DNA content</summary><div class="bt-tables"></div></details></section>' +
      '<section class="bt-card" aria-labelledby="cc-q"><h2 id="cc-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');
    var card = app.querySelector('.bt-card'), ctl = card.querySelector('.bt-controls');
    var say = T.announcer(card.querySelector('.bt-summary'));

    var sGF = T.slider({ label: 'Growth factor', min: data.growthFactor.min, max: data.growthFactor.max, step: data.growthFactor.step, value: st.gf, unit: data.growthFactor.unit, decimals: 0, hint: '100% keeps every normal cell cycling.', onInput: function(v){ st.gf = v; update(); } });
    var sDam = T.slider({ label: 'DNA damage', min: data.damage.min, max: data.damage.max, step: data.damage.step, value: st.damage, unit: data.damage.unit, decimals: 1, hint: 'The share of undamaged cells that get damaged DNA each hour.', onInput: function(v){ st.damage = v; update(); } });
    var sRead = T.slider({ label: 'Read the dish at', min: data.readTime.min, max: data.readTime.max, step: data.readTime.step, value: st.readT, unit: 'h', decimals: 0, onInput: function(v){ st.readT = v; update(); } });
    var outSel = T.choiceSelect({ label: 'Output to plot', value: st.out, options: data.outputs.map(function(o){ return { value: o.id, label: o.name }; }), onChange: function(v){ st.out = v; update(true); } });
    [sGF, sDam, sRead].forEach(function(c){ ctl.appendChild(c.el); });
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
    function figure(a){
      var cx = 130, cy = 165, r = 95, tot = P.G1 + P.S + P.G2 + P.M, deg = function(h){ return 360 * h / tot; };
      var g1e = deg(P.G1), se = g1e + deg(P.S), g2e = se + deg(P.G2);
      var pct = function(x){ return F(100 * x / a.N, 1) + '%'; };
      var parts = [
        '<path class="ph g1" d="' + arc(cx, cy, r, 0, g1e - 1) + '"/>', '<path class="ph s" d="' + arc(cx, cy, r, g1e + 1, se - 1) + '"/>',
        '<path class="ph g2" d="' + arc(cx, cy, r, se + 1, g2e - 1) + '"/>', '<path class="ph m" d="' + arc(cx, cy, r, g2e + 1, 359.5) + '"/>'
      ];
      var lab = function(ang, rr, txt){ var t = (ang - 90) * Math.PI / 180; return '<text x="' + (cx + rr * Math.cos(t)).toFixed(1) + '" y="' + (cy + rr * Math.sin(t) + 4).toFixed(1) + '" text-anchor="middle">' + txt + '</text>'; };
      parts.push(lab(g1e / 2, 55, 'G1 ' + pct(a.G1)), lab((g1e + se) / 2, 55, 'S ' + pct(a.S)), lab((se + g2e) / 2, 58, 'G2 ' + pct(a.G2)), lab(355, 64, 'M ' + pct(a.M)));
      var tick = function(ang, hold, name){ var t = (ang - 90) * Math.PI / 180, x1 = cx + (r - 16) * Math.cos(t), y1 = cy + (r - 16) * Math.sin(t), x2 = cx + (r + 16) * Math.cos(t), y2 = cy + (r + 16) * Math.sin(t);
        return '<line class="ckp' + (hold ? ' hold' : '') + '" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>' + lab(ang, r + 28, name); };
      parts.push(tick(g1e, a.held1 >= 0.5, 'G1 checkpoint'), tick(g2e, a.held2 >= 0.5, ''), tick(358, a.heldM >= 0.5, ''));
      parts.push('<text x="' + (cx - 18) + '" y="' + (cy - r - 22) + '" text-anchor="end">G2 checkpoint</text><text x="' + (cx + 8) + '" y="' + (cy - r - 22) + '">M checkpoint</text>');
      parts.push('<rect class="g0" x="252" y="70" width="96" height="44" rx="8"/><text x="300" y="88" text-anchor="middle">G0</text><text x="300" y="106" text-anchor="middle">' + pct(a.G0) + '</text>');
      var n = function(x){ return F(x, 0); };
      var lines = [
        'G1 checkpoint: ' + (a.held1 >= 0.5 ? 'holding ' + n(a.held1) + ' damaged cells' : 'no cells held'),
        'G2 checkpoint: ' + (a.held2 >= 0.5 ? 'holding ' + n(a.held2) + ' damaged cells' : 'no cells held'),
        'M checkpoint: ' + (a.heldM >= 0.5 ? 'holding ' + n(a.heldM) + ' cells (no spindle)' : 'no cells held')
      ];
      lines.forEach(function(l, i){ parts.push('<text class="note" x="10" y="' + (305 + i * 18) + '">' + esc(l) + '</text>'); });
      parts.push('<text class="note" x="252" y="134">' + grp(a.N) + ' cells</text>');
      var desc = 'The cell cycle at ' + st.readT + ' h, ' + setText(st) + ': ' + pct(a.G0) + ' of cells in G0, ' + pct(a.G1) + ' in G1, ' + pct(a.S) + ' in S, ' + pct(a.G2) + ' in G2 and ' + pct(a.M) + ' in M, out of ' + grp(a.N) + ' cells. ' + lines.join('. ') + '.';
      card.querySelector('.bt-fig').innerHTML = '<svg class="cc-fig" viewBox="0 0 360 362" role="img" aria-label="' + esc(desc) + '">' + parts.join('') + '</svg>';
    }
    function sameSet(r){ return r.damage === st.damage && r.readT === st.readT && KEYS.every(function(k){ return r[k] === st[k]; }); }
    function update(now){
      var s = sim(), a = C.at(s, st.readT), ref = mutated() ? sim(NOMUT) : null, o = outOf(st.out), spec, title;
      figure(a);
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
  });
})();
