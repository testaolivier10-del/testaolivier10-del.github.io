/* Simulator: enzyme activity and inhibition (Unit 3). The model is in
   bio-tool-math.js (ApBioMath.enzyme); the enzymes, ranges, the "How this
   model works" box, the questions and the mini FRQ are data
   (bio/data/tools/enzyme-activity.json). The student sets substrate,
   temperature, pH and an inhibitor, sees the rate curve, runs trials that
   land as points (with a little measurement scatter), reads the same numbers
   in a table, then answers questions about the model. */
(function(){
  'use strict';
  var SLUG = 'enzyme-activity';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  T.mount(SLUG, function(app, data){
    var esc = T.esc, F = T.F;
    var prof = data.profiles[0], view = 's', runs = [], runSeed = 7919;
    var st = { S: data.substrate.value, T: prof.defaults.T, pH: prof.defaults.pH, inhibitor: 'none', I: data.inhibitor.value };
    var RU = data.rateUnit;
    var VIEWS = { s: { key: 'S', label: 'Substrate concentration', unit: data.substrate.unit, min: 0, max: data.substrate.max, step: 5, series: data.series.S },
      t: { key: 'T', label: 'Temperature', unit: '°C', min: 0, max: data.temperature.max, step: 10, series: data.series.T },
      ph: { key: 'pH', label: 'pH', unit: '', min: 0, max: 14, step: 2, series: data.series.pH } };

    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
      '<section class="bt-card" aria-labelledby="ez-h"><h2 id="ez-h">The model</h2><div class="bt-controls"></div>' +
      '<div class="bt-stage two"><div class="bt-fig" aria-hidden="false"></div><div><div class="bt-tabs" role="group" aria-label="Plot the rate against">' +
      Object.keys(VIEWS).map(function(k){ return '<button type="button" class="bt-btn" data-v="' + k + '" aria-pressed="' + (k === view) + '">Rate vs ' + esc(k === 'ph' ? 'pH' : VIEWS[k].label.toLowerCase()) + '</button>'; }).join('') +
      '</div><div class="bt-plotwrap"></div></div></div>' +
      '<dl class="bt-readout"></dl><p class="bt-summary"></p>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm" data-a="run">Run one trial</button><button type="button" class="btn-press sm alt" data-a="series">Run a series</button><button type="button" class="bt-btn" data-a="clear">Clear runs</button></div>' +
      '<p class="bt-small bt-runnote" role="status" aria-live="polite"></p>' +
      '<details class="bt-data"><summary>Data table: your runs and the curve</summary><div class="bt-tables"></div></details></section>' +
      '<section class="bt-card" aria-labelledby="ez-q"><h2 id="ez-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');
    var card = app.querySelector('.bt-card'), ctl = card.querySelector('.bt-controls');
    var say = T.announcer(card.querySelector('.bt-summary'));

    var enzymeSel = T.choiceSelect({ label: 'Enzyme', value: prof.id, options: data.profiles.map(function(p){ return { value: p.id, label: p.name }; }), onChange: function(v){
      prof = data.profiles.filter(function(p){ return p.id === v; })[0];
      sT.set(prof.defaults.T); sPH.set(prof.defaults.pH); st.T = prof.defaults.T; st.pH = prof.defaults.pH; update(true);
    } });
    var inhSel = T.choiceSelect({ label: 'Inhibitor', value: 'none', options: data.inhibitors.map(function(x){ return { value: x.id, label: x.name }; }), onChange: function(v){ st.inhibitor = v; sI.disable(v === 'none'); update(true); } });
    var sS = T.slider({ label: 'Substrate concentration', min: 0, max: data.substrate.max, step: data.substrate.step, value: st.S, unit: data.substrate.unit, decimals: 1, onInput: function(v){ st.S = v; update(); } });
    var sT = T.slider({ label: 'Temperature', min: 0, max: data.temperature.max, step: 1, value: st.T, unit: '°C', decimals: 0, onInput: function(v){ st.T = v; update(); } });
    var sPH = T.slider({ label: 'pH', min: 1, max: 13, step: 0.5, value: st.pH, decimals: 1, onInput: function(v){ st.pH = v; update(); } });
    var sI = T.slider({ label: 'Inhibitor concentration', min: 0, max: data.inhibitor.max, step: data.inhibitor.step, value: st.I, unit: data.inhibitor.unit, decimals: 2, onInput: function(v){ st.I = v; update(); } });
    [enzymeSel, inhSel, sS, sT, sPH, sI].forEach(function(c){ ctl.appendChild(c.el); });
    sI.disable(true);
    var desc = document.createElement('p'); desc.className = 'bt-hint bt-prof'; ctl.appendChild(desc);

    card.querySelectorAll('.bt-tabs .bt-btn').forEach(function(b){
      b.addEventListener('click', function(){
        view = b.getAttribute('data-v');
        card.querySelectorAll('.bt-tabs .bt-btn').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        update(true);
      });
    });
    card.querySelector('[data-a="run"]').addEventListener('click', function(){ run([st[VIEWS[view].key]]); });
    card.querySelector('[data-a="series"]').addEventListener('click', function(){ run(VIEWS[view].series); });
    card.querySelector('[data-a="clear"]').addEventListener('click', function(){ runs = []; card.querySelector('.bt-runnote').textContent = 'Runs cleared.'; update(true); });

    function cond(over){ var c = { S: st.S, T: st.T, pH: st.pH, inhibitor: st.inhibitor, I: st.I }; for(var k in over) c[k] = over[k]; return c; }
    function rateAt(c){ return M.enzyme.rate(prof, c, c.S); }
    function inhName(id){ return data.inhibitors.filter(function(x){ return x.id === id; })[0].name; }
    /* A run: the model's rate with about 3% measurement scatter (seeded). */
    function run(xs){
      var V = VIEWS[view];
      xs.forEach(function(x){
        var c = cond({}); c[V.key] = x;
        var r = M.rng(runSeed + runs.length * 31), noisy = Math.max(0, rateAt(c) * (1 + r.normal(0, 0.03)));
        runs.push({ n: runs.length + 1, enzyme: prof.id, S: c.S, T: c.T, pH: c.pH, inhibitor: c.inhibitor, I: c.inhibitor === 'none' ? 0 : c.I, rate: M.round(noisy, 1) });
      });
      T.event('apbio-sim-run', { tool: SLUG, n: xs.length });
      card.querySelector('.bt-runnote').textContent = xs.length === 1 ? 'Trial ' + runs.length + ': rate ' + F(runs[runs.length - 1].rate, 1) + ' ' + RU + '.' : 'Ran ' + xs.length + ' trials across ' + V.label.toLowerCase() + '. They appear as points on the graph and in the data table.';
      update(true);
    }
    /* Runs that match every setting except the plotted one. */
    function shown(){
      var V = VIEWS[view];
      return runs.filter(function(r){
        return r.enzyme === prof.id && r.inhibitor === st.inhibitor && (st.inhibitor === 'none' || r.I === st.I) &&
          ['S', 'T', 'pH'].every(function(k){ return k === V.key || Math.abs(r[k] - st[k]) < 1e-9; });
      });
    }
    function curve(over, V){
      var pts = [], n = 120;
      for(var i = 0; i <= n; i++){ var x = V.min + (V.max - V.min) * i / n; if(V.key === 'pH' && x < 0.5) continue; var c = cond(over); c[V.key] = x; pts.push([x, rateAt(c)]); }
      return pts;
    }
    function figure(k){
      var hot = st.T > prof.Tm + 2 * prof.w, phOff = M.enzyme.phFactor(prof, st.pH) < 0.25;
      var shape = hot ? 'M60 110 q30 -60 70 -30 q40 -40 60 20 q20 50 -40 60 q-60 20 -90 -50z' : 'M50 120 q0 -70 70 -70 h20 v34 h-24 v30 h24 v0 h20 q60 0 60 50 q0 50 -70 50 h-60 q-40 0 -40 -64z';
      var parts = ['<path class="enz" d="' + shape + '"/>', '<text x="58" y="200">Enzyme' + (hot ? ' (unfolded)' : '') + '</text>'];
      if(!hot && st.S > 0) parts.push('<rect class="sub" x="120" y="88" width="22" height="26" rx="5"/><text x="150" y="80">Substrate</text>');
      if(st.inhibitor === 'competitive' && st.I > 0) parts.push('<rect class="inh" x="214" y="70" width="22" height="26" rx="5"/><text x="208" y="62">Competitive inhibitor</text><text class="note" x="196" y="114">competes for the active site</text>');
      if(st.inhibitor === 'noncompetitive' && st.I > 0) parts.push('<circle class="inh" cx="196" cy="198" r="12"/><text x="214" y="204">Noncompetitive inhibitor</text><text class="note" x="214" y="222">binds elsewhere, changes the shape</text>');
      if(phOff && !hot) parts.push('<text class="note" x="20" y="30">At this pH the active site’s charged groups are in the wrong state.</text>');
      var lab = 'Enzyme diagram: ' + (hot ? 'at this temperature most enzyme molecules are unfolded (denatured), so the active site has lost its shape. ' : 'the active site is a pocket that fits the substrate. ') +
        (st.inhibitor === 'competitive' ? 'A competitive inhibitor resembles the substrate and competes for the active site. ' : st.inhibitor === 'noncompetitive' ? 'A noncompetitive inhibitor binds a different site and changes the enzyme’s shape. ' : '') + (k.tempFactor < 0.5 && !hot ? 'It is cold: molecules move slowly and collide less often.' : '');
      card.querySelector('.bt-fig').innerHTML = '<svg viewBox="0 0 320 240" role="img" aria-label="' + esc(lab) + '">' + parts.join('') + '</svg>';
    }
    function update(now){
      var V = VIEWS[view], k = M.enzyme.params(prof, st), r = rateAt(cond({}));
      desc.textContent = prof.blurb;
      figure(k);
      var ref = st.inhibitor !== 'none' ? curve({ inhibitor: 'none' }, V) : null;
      var cur = curve({}, V), pts = shown();
      var top = Math.max(prof.Vmax, Math.max.apply(null, pts.map(function(p){ return p.rate; }).concat([1])));
      var ymax = T.niceMax(top * 1.05);
      var title = 'Graph of reaction rate against ' + (V.key === 'pH' ? 'pH' : V.label.toLowerCase()) + ' for ' + prof.name + (st.inhibitor !== 'none' ? ' with ' + inhName(st.inhibitor).toLowerCase() + ' (solid) and without it (dashed)' : '') + '. ' + pts.length + ' run' + (pts.length === 1 ? '' : 's') + ' shown as points. The data table below lists the values.';
      card.querySelector('.bt-plotwrap').innerHTML = T.plot({ title: title, x: { label: V.label, unit: V.unit, min: V.min, max: V.max, step: V.step }, y: { label: 'Reaction rate', unit: RU, min: 0, max: ymax, step: T.niceStep(ymax, 5) },
        curves: (ref ? [{ points: ref, cls: 's3', dashed: true }] : []).concat([{ points: cur, cls: 's1' }]),
        points: pts.map(function(p){ return { x: p[V.key], y: p.rate, cls: 's2' }; }), vline: { x: st[V.key] } });
      card.querySelector('.bt-readout').innerHTML = [
        ['Rate now', F(r, 1) + ' ' + RU], ['Vmax (apparent)', F(k.vmax, 1) + ' ' + RU], ['Km (apparent)', F(k.km, 2) + ' ' + data.substrate.unit], ['Rate as % of Vmax', F(k.vmax ? 100 * r / k.vmax : 0, 0) + '%']
      ].map(function(x){ return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('');
      var words = 'At ' + F(st.S, 1) + ' ' + data.substrate.unit + ' substrate, ' + F(st.T, 0) + ' °C and pH ' + F(st.pH, 1) +
        (st.inhibitor === 'none' ? ', with no inhibitor' : ', with ' + F(st.I, 2) + ' ' + data.inhibitor.unit + ' ' + inhName(st.inhibitor).toLowerCase()) +
        ', the rate is ' + F(r, 1) + ' ' + RU + '. Vmax is ' + F(k.vmax, 1) + ' and Km is ' + F(k.km, 2) + ' ' + data.substrate.unit + '. ' +
        (k.tempFactor < 0.3 && st.T > prof.Tm ? 'Most of the enzyme is denatured at this temperature. ' : k.tempFactor < 0.5 ? 'It is too cold for fast collisions. ' : '') +
        (k.phFactor < 0.5 ? 'This pH is far from the enzyme’s best pH. ' : '');
      say(words, now);
      var V2 = V, sample = [];
      for(var i = 0; i <= 8; i++){ var x = V2.min + (V2.max - V2.min) * i / 8; if(V2.key === 'pH' && x < 1) x = 1; var c = cond({}); c[V2.key] = x; var row = [F(x, V2.key === 'S' ? 1 : V2.key === 'pH' ? 1 : 0), F(rateAt(c), 1)]; if(ref){ var c0 = cond({ inhibitor: 'none' }); c0[V2.key] = x; row.push(F(rateAt(c0), 1)); } sample.push(row); }
      card.querySelector('.bt-tables').innerHTML =
        (runs.length ? T.dataTable(['Trial', 'Enzyme', 'Substrate (' + data.substrate.unit + ')', 'Temperature (°C)', 'pH', 'Inhibitor', 'Rate (' + RU + ')'], runs.map(function(p){
          return [String(p.n), esc(data.profiles.filter(function(q){ return q.id === p.enzyme; })[0].short), F(p.S, 1), F(p.T, 0), F(p.pH, 1), p.inhibitor === 'none' ? 'none' : esc(p.inhibitor) + ' (' + F(p.I, 2) + ' ' + data.inhibitor.unit + ')', F(p.rate, 1)];
        }), 'Your runs (' + runs.length + ')') : '<p class="bt-small">No runs yet. Use Run one trial or Run a series.</p>') +
        T.dataTable([esc(V2.label) + (V2.unit ? ' (' + esc(V2.unit) + ')' : ''), 'Model rate (' + RU + ')'].concat(ref ? ['Without inhibitor (' + RU + ')'] : []), sample, 'The curve on the graph, sampled');
    }
    update(true);
    T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
    if(data.frq) T.frq(app, data.frq, SLUG);
  });
})();
