/* Simulator: signal transduction and amplification (Unit 4). The model is in
   bio-tool-math.js (ApBioMath.signal); its numbers, the steps, the drugs, the
   "How this model works" box, the questions and the mini FRQ are data
   (bio/data/tools/signal-transduction-amplification.json). The student sets
   the epinephrine concentration, when it is washed out and which steps are
   blocked, reads the active molecules at every step at a chosen time (the
   pathway figure and a table), plots any step over time or against the
   dose, and runs trials that land as points (with a little scatter). */
(function(){
  'use strict';
  var SLUG = 'signal-transduction-amplification';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  T.mount(SLUG, function(app, data){
    var esc = T.esc, F = T.F, S = M.signal, P = data.model, fmt = S.fmt;
    var view = 'time', runs = [], runSeed = 4271;
    var st = { L: data.ligand.value, tOff: data.washout.value, readT: data.readTime.value, gprotein: 'normal', antagonist: false, pde: false, pka: false, stage: 'rate' };
    var stageOf = function(id){ return data.stages.filter(function(s){ return s.id === id; })[0]; };

    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
      '<section class="bt-card" aria-labelledby="sg-h"><h2 id="sg-h">The model</h2><div class="bt-controls"></div>' +
      '<div class="bt-stage two"><div class="bt-fig"></div><div><div class="bt-tabs" role="group" aria-label="Graph">' +
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
    [sL, sOff, sRead, gSel].forEach(function(c){ ctl.appendChild(c.el); });
    var fs = document.createElement('fieldset');
    fs.className = 'bt-ctl bt-checks';
    fs.innerHTML = '<legend>Drugs (added at 0 s)</legend>' + data.blocks.map(function(b){
      var id = T.nid('sg-' + b.id);
      return '<div class="bt-check-row"><input type="checkbox" id="' + id + '" data-b="' + esc(b.id) + '"><label for="' + id + '">' + esc(b.name) + '</label></div>';
    }).join('');
    ctl.appendChild(fs);
    ctl.appendChild(stageSel.el);
    fs.querySelectorAll('input').forEach(function(b){ b.addEventListener('change', function(){ st[b.getAttribute('data-b')] = b.checked; update(true); }); });

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
    function figure(a){
      var rowH = 56, ids = S.STAGES, parts = [];
      var tags = { R: st.antagonist ? 'antagonist present' : '', G: st.gprotein === 'on' ? 'locked on' : st.gprotein === 'off' ? 'locked off' : '', cAMP: st.pde ? 'breakdown blocked' : '', PKA: st.pka ? 'inhibitor present' : '' };
      ids.forEach(function(id, i){
        var y = 8 + i * rowH, s = stageOf(id), v = a[id], w = Math.max(0, Math.min(1, Math.log(Math.max(1, v)) / Math.LN10 / 7)) * 150;
        parts.push('<rect class="stp' + (tags[id] ? ' blocked' : '') + '" x="6" y="' + y + '" width="348" height="38" rx="8"/>');
        parts.push('<text x="16" y="' + (y + 16) + '">' + esc(s.short) + '</text>');
        if(tags[id]) parts.push('<text class="note" x="16" y="' + (y + 31) + '">' + esc(tags[id]) + '</text>');
        parts.push('<rect class="cnt" x="196" y="' + (y + 22) + '" width="' + w.toFixed(1) + '" height="9" rx="2"/>');
        parts.push('<text x="346" y="' + (y + 16) + '" text-anchor="end">' + fmt(v) + '</text>');
        if(i < ids.length - 1){
          var prev = v, next = a[ids[i + 1]], ratio = prev >= 1 ? next / prev : 0, amp = stageOf(ids[i + 1]).amplifies;
          parts.push('<path class="arr" d="M30 ' + (y + 39) + 'v15"/><path class="arrh" d="M25 ' + (y + 49) + 'l5 6 5-6z"/>');
          parts.push('<text class="note" x="44" y="' + (y + 51) + '">' + (prev >= 1 ? (ratio >= 10 ? '× ' + fmt(ratio) : ratio >= 0.1 || ratio === 0 ? '× ' + F(ratio, 2) : '1 for every ' + fmt(1 / ratio)) : '—') + (amp ? ' (each one activates or makes many: amplifies)' : ' (binding, one-to-one or less: no gain)') + '</text>');
        }
      });
      var lab = 'The pathway at ' + st.readT + ' s, from receptor to response. ' + ids.map(function(id){ return stageOf(id).name + ': ' + fmt(a[id]) + (tags[id] ? ' (' + tags[id] + ')' : ''); }).join('; ') + '.';
      card.querySelector('.bt-fig').innerHTML = '<svg class="sg-fig" viewBox="0 0 360 ' + (8 + ids.length * rowH - 10) + '" role="img" aria-label="' + esc(lab) + '">' + parts.join('') + '</svg>';
    }
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
