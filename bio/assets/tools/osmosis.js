/* Simulator: osmosis and water potential (Unit 2). The model is in
   bio-tool-math.js (ApBioMath.osmosis); the systems, solutes, ranges, the
   "How this model works" box, the questions and the mini FRQ are data
   (bio/data/tools/osmosis.json). The student puts a potato core, a red blood
   cell or a dialysis bag in a solution, sees ψ = ψs + ψp on both sides with
   the numbers substituted, the direction of net water movement, the cell's
   state (turgid, plasmolyzed, lysed...) and the percent mass change, plots
   mass change against the outside concentration and runs trials. */
(function(){
  'use strict';
  var SLUG = 'osmosis';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  T.mount(SLUG, function(app, data){
    var esc = T.esc, F = T.F;
    var sys = data.systems[0], runs = [], runSeed = 104729;
    var st = { outC: data.outside.value, outSolute: data.solutes[0].id, inC: data.inside.value, T: sys.defaults.T, t: sys.time.value };
    var STATE = data.states;

    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
      '<section class="bt-card" aria-labelledby="os-h"><h2 id="os-h">The model</h2><div class="bt-controls"></div>' +
      '<div class="bt-stage two"><div class="bt-fig"></div><div class="bt-plotwrap"></div></div>' +
      '<dl class="bt-readout"></dl><div class="bt-eqs"></div><p class="bt-summary"></p>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm" data-a="run">Run one trial</button><button type="button" class="btn-press sm alt" data-a="series">Run a concentration series</button><button type="button" class="bt-btn" data-a="clear">Clear runs</button></div>' +
      '<p class="bt-small bt-runnote" role="status" aria-live="polite"></p>' +
      '<details class="bt-data"><summary>Data table: your runs and the curve</summary><div class="bt-tables"></div></details></section>' +
      '<section class="bt-card" aria-labelledby="os-q"><h2 id="os-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');
    var card = app.querySelector('.bt-card'), ctl = card.querySelector('.bt-controls');
    var say = T.announcer(card.querySelector('.bt-summary'));
    function short(k){ return STATE[k].split(':')[0]; }
    function solute(id){ return data.solutes.filter(function(s){ return s.id === id; })[0]; }

    var sysSel = T.choiceSelect({ label: 'What goes in the beaker', value: sys.id, options: data.systems.map(function(s){ return { value: s.id, label: s.name }; }), onChange: function(v){
      sys = data.systems.filter(function(s){ return s.id === v; })[0];
      st.T = sys.defaults.T; sT.set(st.T); st.t = sys.time.value; makeTime(); sIn.disable(sys.kind !== 'bag'); update(true);
    } });
    var solSel = T.choiceSelect({ label: 'Solute in the beaker', value: st.outSolute, options: data.solutes.map(function(s){ return { value: s.id, label: s.name + ' (i = ' + s.i + ')' }; }), onChange: function(v){ st.outSolute = v; update(true); } });
    var sOut = T.slider({ label: 'Beaker concentration', min: 0, max: data.outside.max, step: data.outside.step, value: st.outC, unit: 'M', decimals: 2, onInput: function(v){ st.outC = v; update(); } });
    var sIn = T.slider({ label: 'Sucrose inside the bag', min: 0, max: data.inside.max, step: data.inside.step, value: st.inC, unit: 'M', decimals: 2, onInput: function(v){ st.inC = v; update(); } });
    var sT = T.slider({ label: 'Temperature', min: 0, max: 40, step: 1, value: st.T, unit: '°C', decimals: 0, onInput: function(v){ st.T = v; update(); } });
    [sysSel, solSel, sOut, sIn, sT].forEach(function(c){ ctl.appendChild(c.el); });
    var timeHost = document.createElement('div'); timeHost.className = 'bt-timehost'; ctl.appendChild(timeHost);
    var sTime;
    function makeTime(){
      var tm = sys.time;
      sTime = T.slider({ label: 'Time in the solution', min: 0, max: tm.max, step: tm.step, value: st.t, unit: 'min', decimals: tm.step < 1 ? 2 : 0, onInput: function(v){ st.t = v; update(); }, hint: esc(tm.hint) });
      timeHost.innerHTML = ''; timeHost.appendChild(sTime.el);
    }
    makeTime();
    sIn.disable(sys.kind !== 'bag');
    var note = document.createElement('p'); note.className = 'bt-hint'; ctl.appendChild(note);

    card.querySelector('[data-a="run"]').addEventListener('click', function(){ run([st.outC]); });
    card.querySelector('[data-a="series"]').addEventListener('click', function(){ run(data.series); });
    card.querySelector('[data-a="clear"]').addEventListener('click', function(){ runs = []; card.querySelector('.bt-runnote').textContent = 'Runs cleared.'; update(true); });

    function cond(over){ var s = solute(st.outSolute), c = { outC: st.outC, outI: s.i, inC: st.inC, inI: 1, T: st.T, t: st.t }; for(var k in over) c[k] = over[k]; return c; }
    function sim(over){ return M.osmosis.simulate(sys, cond(over)); }
    function run(cs){
      cs.forEach(function(c){
        var r = sim({ outC: c }), g = M.rng(runSeed + runs.length * 17);
        runs.push({ n: runs.length + 1, sys: sys.id, solute: st.outSolute, C: c, inC: sys.kind === 'bag' ? st.inC : null, T: st.T, t: st.t, lysed: r.lysed, pct: r.lysed ? null : M.round(r.pct + g.normal(0, data.scatter), 1) });
      });
      T.event('apbio-sim-run', { tool: SLUG, n: cs.length });
      var last = runs[runs.length - 1];
      card.querySelector('.bt-runnote').textContent = cs.length === 1 ? 'Trial ' + last.n + ': ' + (last.lysed ? 'the cells burst (lysed).' : 'mass change ' + F(last.pct, 1) + '%.') : 'Ran ' + cs.length + ' trials from 0 to ' + data.outside.max + ' M. They appear as points on the graph and in the data table.';
      update(true);
    }
    function shown(){ return runs.filter(function(r){ return r.sys === sys.id && r.solute === st.outSolute && r.T === st.T && r.t === st.t && !r.lysed && (sys.kind !== 'bag' || r.inC === st.inC); }); }

    /* The picture: beaker, the cell or bag at its final size, the arrow of
       net water movement at the start. */
    function figure(r){
      var p = ['<rect class="beaker" x="20" y="40" width="280" height="200" rx="14"/><rect class="water" x="24" y="70" width="272" height="166" rx="10"/>'];
      var cx = 160, cy = 150, V = r.mass;
      if(sys.kind === 'plant'){
        var s = Math.min(1, Math.sqrt(r.W / sys.W0));
        p.push('<rect class="wall" x="' + (cx - 66) + '" y="' + (cy - 48) + '" width="132" height="96" rx="8"/>');
        p.push('<rect class="memb" x="' + (cx - 60 * s).toFixed(1) + '" y="' + (cy - 42 * s).toFixed(1) + '" width="' + (120 * s).toFixed(1) + '" height="' + (84 * s).toFixed(1) + '" rx="' + (s < 0.98 ? 22 : 6) + '"/>');
        p.push('<text x="' + (cx - 30) + '" y="' + (cy + 66) + '">cell wall</text>');
      } else if(sys.kind === 'animal'){
        if(r.lysed) p.push('<path class="lysed" d="M' + (cx - 60) + ' ' + cy + ' a60 60 0 0 1 100 -38 M' + (cx + 58) + ' ' + (cy + 10) + ' a60 60 0 0 1 -96 44"/><text x="' + (cx - 34) + '" y="' + (cy + 5) + '">burst</text>');
        else {
          var k = Math.cbrt(V), rx = 58 * k * (V < 1 ? 1 : Math.pow(1 / V, 0.25)), ry = 30 * k * (V > 1 ? Math.min(1.9, 1 + (V - 1) * 1.6) : 1);
          if(r.state === 'shriveled'){
            var pts = []; for(var i = 0; i < 28; i++){ var a = i / 28 * Math.PI * 2, rr = i % 2 ? 0.82 : 1; pts.push((cx + Math.cos(a) * rx * rr).toFixed(1) + ',' + (cy + Math.sin(a) * ry * rr).toFixed(1)); }
            p.push('<polygon class="memb" points="' + pts.join(' ') + '"/>');
          } else p.push('<ellipse class="memb" cx="' + cx + '" cy="' + cy + '" rx="' + rx.toFixed(1) + '" ry="' + ry.toFixed(1) + '"/>');
        }
      } else {
        var h = 70 * Math.min(1.3, V), w = 70;
        p.push('<rect class="bag" x="' + (cx - w / 2) + '" y="' + (cy - h / 2).toFixed(1) + '" width="' + w + '" height="' + h.toFixed(1) + '" rx="16"/><line class="wall" x1="' + (cx - 20) + '" x2="' + (cx + 20) + '" y1="' + (cy - h / 2 - 6).toFixed(1) + '" y2="' + (cy - h / 2 - 6).toFixed(1) + '"/>');
      }
      if(r.startDir !== 'none'){
        var into = r.startDir === 'in', y = 96, x1 = into ? 40 : 108, x2 = into ? 98 : 40;
        p.push('<path class="flow" d="M' + x1 + ' ' + y + 'H' + x2 + '"/><path class="flowhead" d="M' + x2 + ' ' + (y - 7) + 'l' + (into ? 12 : -12) + ' 7l' + (into ? -12 : 12) + ' 7z"/>');
        p.push('<text x="' + (into ? 34 : 34) + '" y="' + (y - 12) + '">net water ' + (into ? 'in' : 'out') + '</text>');
      } else p.push('<text x="34" y="92">no net water movement</text>');
      p.push('<text x="24" y="30">' + esc(short(r.state)) + '</text>');
      var lab = sys.name + ' in ' + F(st.outC, 2) + ' M ' + solute(st.outSolute).name + '. At the start, net water movement is ' + (r.startDir === 'in' ? 'into it' : r.startDir === 'out' ? 'out of it' : 'zero') + '. After ' + F(st.t, sys.time.step < 1 ? 2 : 0) + ' minutes it is ' + STATE[r.state] + (r.lysed ? '.' : ', with a mass change of ' + F(r.pct, 1) + '%.');
      card.querySelector('.bt-fig').innerHTML = '<svg viewBox="0 0 320 250" role="img" aria-label="' + esc(lab) + '">' + p.join('') + '</svg>';
    }
    function update(now){
      var c = cond({}), r = sim({}), s = solute(st.outSolute), K = st.T + M.K0;
      note.textContent = sys.note;
      figure(r);
      // the curve: mass change against the beaker concentration
      var cur = [], lysedBelow = null, n = 60;
      for(var i = 0; i <= n; i++){ var C = data.outside.max * i / n, x = sim({ outC: C }); if(x.lysed){ lysedBelow = C; continue; } cur.push([C, x.pct]); }
      var pts = shown();
      var big = Math.max.apply(null, cur.map(function(q){ return Math.abs(q[1]); }).concat(pts.map(function(q){ return Math.abs(q.pct); })).concat([5]));
      var ym = T.niceMax(big * 1.1);
      var title = 'Graph of percent mass change after ' + F(st.t, 0) + ' minutes against ' + s.name + ' concentration in the beaker, from 0 to ' + data.outside.max + ' M, for the ' + sys.name.toLowerCase() + '.' + (lysedBelow != null ? ' Below ' + F(lysedBelow + data.outside.max / n, 2) + ' M the cells burst, so no mass is shown.' : '') + ' ' + pts.length + ' run' + (pts.length === 1 ? '' : 's') + ' shown as points. The data table below lists the values.';
      card.querySelector('.bt-plotwrap').innerHTML = T.plot({ title: title, x: { label: s.name + ' in the beaker', unit: 'M', min: 0, max: data.outside.max, step: 0.2 }, y: { label: 'Mass change', unit: '%', min: -ym, max: ym, step: T.niceStep(2 * ym, 6) },
        curves: [{ points: cur, cls: 's1' }], points: pts.map(function(q){ return { x: q.C, y: q.pct, cls: 's2' }; }), vline: { x: st.outC } });
      card.querySelector('.bt-readout').innerHTML = [
        ['ψ outside', F(r.psiO, 2) + ' bar'], ['ψ inside, start', F(r.start.psi, 2) + ' bar'], ['ψ inside, now', r.lysed ? 'burst' : F(r.end.psi, 2) + ' bar'],
        ['Net water, start', r.startDir === 'in' ? 'into it' : r.startDir === 'out' ? 'out of it' : 'none'], ['Mass change', r.lysed ? 'burst' : F(r.pct, 1) + '%'], ['State', short(r.state)]
      ].map(function(x){ return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('');
      var inS = sys.kind === 'bag' ? 'Inside the bag: ψs = −iCRT = −(1)(' + F(st.inC, 2) + ')(0.0831)(' + K + ') = ' + F(r.start.psiS, 2) + ' bar'
        : 'Inside at the start: ψs = −(' + F(sys.osmIn, 2) + ' osmol/L)(0.0831)(' + K + ') = ' + F(r.start.psiS, 2) + ' bar';
      card.querySelector('.bt-eqs').innerHTML = '<p class="bt-eq">Beaker: ψ = ψs = −iCRT = −(' + s.i + ')(' + F(st.outC, 2) + ' mol/L)(0.0831 L·bar/(mol·K))(' + K + ' K) = ' + F(r.psiO, 2) + ' bar</p>' +
        '<p class="bt-eq">' + inS + '; ψp = ' + F(r.start.psiP, 2) + ' bar; ψ = ψs + ψp = ' + F(r.start.psi, 2) + ' bar</p>';
      var words = sys.name + ' in ' + F(st.outC, 2) + ' M ' + s.name + ' at ' + st.T + ' °C. Outside water potential ' + F(r.psiO, 2) + ' bar; inside at the start ' + F(r.start.psi, 2) + ' bar, so water moves ' +
        (r.startDir === 'in' ? 'in' : r.startDir === 'out' ? 'out' : 'neither way overall') + '. After ' + F(st.t, sys.time.step < 1 ? 2 : 0) + ' minutes: ' + (r.lysed ? 'the cell has burst (lysed).' : STATE[r.state] + ', mass change ' + F(r.pct, 1) + '%' + (r.equilibrium ? ', and the water potentials are now equal.' : '.'));
      say(words, now);
      var sample = [];
      for(var j = 0; j <= 10; j++){ var C2 = data.outside.max * j / 10, y = sim({ outC: C2 }); sample.push([F(C2, 2), y.lysed ? 'burst' : F(y.pct, 1), F(y.psiO, 2)]); }
      card.querySelector('.bt-tables').innerHTML =
        (runs.length ? T.dataTable(['Trial', 'In the beaker', 'Solution', 'Temperature (°C)', 'Time (min)', 'Mass change (%)'], runs.map(function(q){
          var sy = data.systems.filter(function(x){ return x.id === q.sys; })[0];
          return [String(q.n), esc(sy.short) + (q.inC != null ? ' (' + F(q.inC, 2) + ' M inside)' : ''), F(q.C, 2) + ' M ' + esc(solute(q.solute).name), String(q.T), F(q.t, sy.time.step < 1 ? 2 : 0), q.lysed ? 'burst' : F(q.pct, 1)];
        }), 'Your runs (' + runs.length + ')') : '<p class="bt-small">No runs yet. Use Run one trial or Run a concentration series.</p>') +
        T.dataTable(['Beaker (M ' + esc(s.name) + ')', 'Model mass change (%)', 'ψ of the beaker (bar)'], sample, 'The curve on the graph, sampled');
    }
    update(true);
    T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
    if(data.frq) T.frq(app, data.frq, SLUG);
  });
})();
