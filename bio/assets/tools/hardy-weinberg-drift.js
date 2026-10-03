/* Simulator: Hardy-Weinberg and genetic drift (Unit 7). The model is in
   bio-tool-math.js (ApBioMath.popgen, seeded by ApBioMath.rng); the
   defaults, population sizes, rates, scenarios, "How this model works"
   box, questions and mini FRQ are data (bio/data/tools/
   hardy-weinberg-drift.json). The student sets p, N, fitnesses, mutation,
   migration, non-random mating and a bottleneck or founder event, runs
   replicate populations from a visible, typeable seed, follows p in every
   replicate, reads one generation's genotypes against Hardy-Weinberg with a
   chi-square test, and records runs into a data table. */
(function(){
  'use strict';
  var SLUG = 'hardy-weinberg-drift';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  T.mount(SLUG, function(app, data){
    var esc = T.esc, F = T.F, G = M.popgen;
    var st = JSON.parse(JSON.stringify(data.defaults));
    st.readGen = st.gens; st.rep = 0;
    var sim = null, runs = [], timer = null;
    var GENO = ['AA', 'Aa', 'aa'];

    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
      '<section class="bt-card" aria-labelledby="hw-h"><h2 id="hw-h">The model</h2>' +
      '<div class="hw-top"></div><div class="bt-controls hw-controls"></div>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm" data-a="new">Run with a new seed</button><button type="button" class="btn-press sm alt" data-a="record">Record this run</button>' +
      '<button type="button" class="btn-press sm alt" data-a="series">Compare population sizes</button><button type="button" class="bt-btn" data-a="clear">Clear runs</button></div>' +
      '<p class="bt-small bt-runnote" role="status" aria-live="polite"></p>' +
      '<div class="bt-stage two"><div><h3>Frequency of A in every population</h3><div class="hw-plot-p"></div><p class="bt-small hw-key"></p></div>' +
      '<div><h3 class="hw-gh">Genotypes against Hardy-Weinberg</h3><div class="hw-plot-g"></div><p class="bt-small">Bars: observed genotype frequencies. Squares: Hardy-Weinberg expectation (p², 2pq, q²) from the same generation\'s p.</p></div></div>' +
      '<div class="bt-controls hw-read"></div>' +
      '<dl class="bt-readout hw-readout"></dl><div class="hw-chi"></div><p class="bt-summary"></p>' +
      '<details class="bt-data"><summary>Data tables: your runs, each population\'s fate, and p by generation</summary><div class="bt-tables"></div></details></section>' +
      '<section class="bt-card" aria-labelledby="hw-q"><h2 id="hw-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');
    var card = app.querySelector('.bt-card'), ctl = card.querySelector('.hw-controls'), readCtl = card.querySelector('.hw-read');
    var say = T.announcer(card.querySelector('.bt-summary'));
    var note = function(t){ card.querySelector('.bt-runnote').textContent = t; };

    card.querySelector('[data-a="new"]').addEventListener('click', function(){ st.seed = 1 + Math.floor(Math.random() * 99999); seedInput.value = String(st.seed); compute(); note('New seed ' + st.seed + '. Type it in the Seed box any time to repeat this run.'); });
    card.querySelector('[data-a="record"]').addEventListener('click', function(){ record(cfg(), 'this run'); });
    card.querySelector('[data-a="series"]').addEventListener('click', function(){
      [10, 50, 200, 1000].forEach(function(n){ record(Object.assign(cfg(), { N: n }), 'series'); });
      note('Recorded the current settings at N = 10, 50, 200 and 1000 (seed ' + st.seed + '). See the data table of runs.');
    });
    card.querySelector('[data-a="clear"]').addEventListener('click', function(){ runs = []; note('Runs cleared.'); draw(true); });

    /* --------------------------------------------------------- helpers */
    function cfg(){ return { p0: st.p0, N: st.N, gens: st.gens, reps: st.reps, seed: st.seed, w: st.w.slice(), u: st.u, v: st.v, m: st.m, pm: st.pm, F: st.F, event: st.event ? Object.assign({}, st.event) : null }; }
    function sizeText(n){ return n > 0 ? String(n) : 'very large (no drift)'; }
    function eventText(e){ if(!e) return 'none'; return e.len === 1 && e.kind === 'founder' ? 'founder event at generation ' + e.gen + ' (' + e.size + ' founders)' : 'bottleneck at generation ' + e.gen + ': ' + e.size + ' adults for ' + e.len + ' generation' + (e.len === 1 ? '' : 's'); }
    function forcesText(c){
      var f = [];
      if(c.w[0] !== 1 || c.w[1] !== 1 || c.w[2] !== 1) f.push('fitness ' + c.w.map(function(x){ return F(x, 2); }).join(', '));
      if(c.u || c.v) f.push('mutation u = ' + c.u + ', v = ' + c.v);
      if(c.m) f.push(Math.round(c.m * 100) + '% migrants with p = ' + F(c.pm, 2));
      if(c.F) f.push('F = ' + F(c.F, 2));
      if(c.event) f.push(eventText(c.event));
      return f.length ? f.join('; ') : 'no selection, mutation, migration or inbreeding';
    }
    function fateWord(f){ return { fixed: 'A fixed', lost: 'A lost', poly: 'both alleles present', extinct: 'died out' }[f]; }
    function schedule(){ clearTimeout(timer); timer = setTimeout(compute, 250); }
    function set(k){ return function(v){ st[k] = v; schedule(); }; }

    /* ------------------------------------------------------- controls */
    var seedInput;
    function controls(){
      var top = card.querySelector('.hw-top');
      top.innerHTML = '';
      var pre = T.choiceSelect({ label: 'Start from a scenario', value: '', options: [{ value: '', label: 'Choose a scenario…' }].concat(data.presets.map(function(p){ return { value: p.id, label: p.label }; })),
        onChange: function(v){
          var p = data.presets.filter(function(x){ return x.id === v; })[0]; if(!p) return;
          Object.keys(p.set).forEach(function(k){ st[k] = JSON.parse(JSON.stringify(p.set[k])); });
          if(st.event && !st.event.kind) st.event.kind = 'bottleneck';
          st.readGen = st.gens; st.rep = 0;
          controls(); compute(true);
          note('Scenario: ' + p.label + '.');
        } });
      top.appendChild(pre.el);
      ctl.innerHTML = '';
      var fs = function(legend, cls){ var f = document.createElement('fieldset'); f.className = 'bt-ctl hw-group' + (cls ? ' ' + cls : ''); f.innerHTML = '<legend>' + esc(legend) + '</legend>'; ctl.appendChild(f); return f; };
      var pop = fs('Population');
      pop.appendChild(T.slider({ label: 'Starting frequency of A (p)', min: 0, max: 1, step: 0.01, value: st.p0, onInput: set('p0') }).el);
      pop.appendChild(T.choiceSelect({ label: 'Adults per generation (N)', value: st.N, options: data.sizes.map(function(n){ return { value: n, label: sizeText(n) }; }), onChange: function(v){ st.N = +v; schedule(); } }).el);
      pop.appendChild(T.slider({ label: 'Generations', min: 10, max: 300, step: 10, value: st.gens, onInput: function(v){ var atEnd = st.readGen >= st.gens; st.gens = v; if(atEnd || st.readGen > v) st.readGen = v; schedule(); } }).el);
      pop.appendChild(T.slider({ label: 'Replicate populations', min: 1, max: 20, step: 1, value: st.reps, onInput: function(v){ st.reps = v; if(st.rep >= v) st.rep = 0; schedule(); } }).el);
      var sid = T.nid('hw-seed'), sd = document.createElement('div');
      sd.className = 'bt-ctl hw-seed';
      sd.innerHTML = '<label for="' + sid + '">Seed (the same seed and settings always give the same runs)</label><input type="number" id="' + sid + '" min="1" max="999999" step="1" inputmode="numeric" value="' + st.seed + '">';
      seedInput = sd.querySelector('input');
      seedInput.addEventListener('change', function(){ var v = Math.max(1, Math.min(999999, Math.round(+seedInput.value) || 1)); seedInput.value = String(v); st.seed = v; compute(); note('Seed set to ' + v + '.'); });
      pop.appendChild(sd);
      var sel = fs('Selection: fitness of each genotype');
      GENO.forEach(function(g, i){ sel.appendChild(T.slider({ label: g + ' fitness', min: 0, max: 1, step: 0.05, value: st.w[i], onInput: function(v){ st.w[i] = v; schedule(); } }).el); });
      var mut = fs('Mutation per allele per generation');
      var rateOpts = data.rates.map(function(r){ return { value: r, label: r ? String(r) : 'none' }; });
      mut.appendChild(T.choiceSelect({ label: 'A → a (u)', value: st.u, options: rateOpts, onChange: function(v){ st.u = +v; schedule(); } }).el);
      mut.appendChild(T.choiceSelect({ label: 'a → A (v)', value: st.v, options: rateOpts, onChange: function(v){ st.v = +v; schedule(); } }).el);
      var mig = fs('Migration (gene flow)');
      mig.appendChild(T.slider({ label: 'Migrants\' share of the gene pool (m)', min: 0, max: 0.5, step: 0.01, value: st.m, onInput: set('m') }).el);
      mig.appendChild(T.slider({ label: 'Frequency of A among migrants', min: 0, max: 1, step: 0.05, value: st.pm, onInput: set('pm') }).el);
      var mat = fs('Mating');
      mat.appendChild(T.slider({ label: 'Non-random mating: share of matings between relatives (F)', min: 0, max: 1, step: 0.05, value: st.F, onInput: set('F'), hint: '0 = random mating. F lowers heterozygotes to 2pq(1 − F) without changing p.' }).el);
      var ev = fs('Bottleneck or founder event', 'hw-event');
      ev.insertAdjacentHTML('beforeend', '<div class="bt-buttons"><button type="button" class="bt-btn" data-e="bottleneck">Add a bottleneck</button><button type="button" class="bt-btn" data-e="founder">Add a founder event</button>' + (st.event ? '<button type="button" class="bt-btn" data-e="none">Remove the event</button>' : '') + '</div>' +
        '<p class="bt-small">' + (st.event ? 'Now: ' + esc(eventText(st.event)) + '.' : 'No event. A bottleneck shrinks the population for a while; a founder event starts a new population from a few individuals.') + '</p>');
      ev.querySelectorAll('[data-e]').forEach(function(b){
        b.addEventListener('click', function(){
          var k = b.getAttribute('data-e');
          if(k === 'none') st.event = null;
          else {
            var g = st.event ? st.event.gen : Math.max(1, Math.round(st.gens * 0.3));
            st.event = k === 'founder' ? { kind: 'founder', gen: g, size: st.event ? st.event.size : 5, len: 1 } : { kind: 'bottleneck', gen: g, size: st.event ? st.event.size : 5, len: st.event && st.event.kind === 'bottleneck' ? st.event.len : 3 };
          }
          controls(); compute(true);
          note(st.event ? 'Added: ' + eventText(st.event) + '.' : 'Event removed.');
          var again = ctl.querySelector('.hw-event [data-e="' + k + '"]') || ctl.querySelector('.hw-event [data-e]'); if(again) again.focus();
        });
      });
      if(st.event){
        ev.appendChild(T.slider({ label: 'Event starts at generation', min: 1, max: st.gens, step: 1, value: Math.min(st.event.gen, st.gens), onInput: function(v){ st.event.gen = v; schedule(); } }).el);
        ev.appendChild(T.choiceSelect({ label: st.event.kind === 'founder' ? 'Number of founders' : 'Adults during the bottleneck', value: st.event.size, options: [2, 3, 5, 10, 20, 50].map(function(n){ return { value: n, label: String(n) }; }), onChange: function(v){ st.event.size = +v; schedule(); } }).el);
        if(st.event.kind !== 'founder') ev.appendChild(T.slider({ label: 'Bottleneck lasts', min: 1, max: 20, step: 1, value: st.event.len, unit: 'generations', onInput: function(v){ st.event.len = v; schedule(); } }).el);
      }
      readControls();
    }
    function readControls(){
      readCtl.innerHTML = '';
      readCtl.appendChild(T.slider({ label: 'Read generation', min: 0, max: st.gens, step: 1, value: Math.min(st.readGen, st.gens), onInput: function(v){ st.readGen = v; draw(); } }).el);
      var opts = []; for(var r = 0; r < st.reps; r++) opts.push({ value: r, label: 'Population ' + (r + 1) });
      readCtl.appendChild(T.choiceSelect({ label: 'Population to read (drawn dashed)', value: st.rep, options: opts, onChange: function(v){ st.rep = +v; draw(); } }).el);
    }

    /* -------------------------------------------------------- running */
    function compute(now){
      var oldGens = sim ? sim.c.gens : null, oldReps = sim ? sim.c.reps : null;
      if(st.readGen > st.gens) st.readGen = st.gens;
      sim = G.simulate(cfg());
      if(oldGens !== st.gens || oldReps !== st.reps) readControls();
      draw(now !== false);
    }
    function record(c, how){
      var s = G.simulate(c), mean = s.reps.reduce(function(a, r){ return a + r.p[c.gens]; }, 0) / s.reps.length;
      runs.push({ n: runs.length + 1, c: c, f: s.fates, mean: mean });
      T.event('apbio-sim-run', { tool: SLUG, n: 1 });
      if(how !== 'series') note('Run ' + runs.length + ' recorded: N = ' + sizeText(c.N) + ', seed ' + c.seed + ', ' + c.gens + ' generations: A fixed in ' + s.fates.fixed + ', lost in ' + s.fates.lost + ', both present in ' + s.fates.poly + ' of ' + c.reps + '.');
      draw(true);
    }

    /* --------------------------------------------------------- drawing */
    function draw(now){
      var c = sim.c, t = Math.min(st.readGen, c.gens), rep = sim.reps[Math.min(st.rep, sim.reps.length - 1)];
      var g = rep.g[t], n = rep.n[t], p = rep.p[t], q = 1 - p, hw = [p * p, 2 * p * q, q * q];
      var stepX = T.niceStep(c.gens, 6);
      var curves = sim.reps.map(function(r, i){ return { points: r.p.map(function(v, k){ return [k, v]; }), cls: i === st.rep ? 's2' : 's1', dashed: i === st.rep }; });
      var sel = curves.splice(Math.min(st.rep, curves.length - 1), 1); curves = curves.concat(sel);
      var f = sim.fates, fateLine = 'A fixed in ' + f.fixed + ', lost in ' + f.lost + ', both alleles present in ' + f.poly + (f.extinct ? ', died out in ' + f.extinct : '') + ' of ' + c.reps + ' population' + (c.reps === 1 ? '' : 's') + ' at generation ' + c.gens;
      var meanT = sim.reps.reduce(function(a, r){ return a + r.p[t]; }, 0) / sim.reps.length;
      card.querySelector('.hw-plot-p').innerHTML = T.plot({ h: 300,
        title: 'Line graph of the frequency of A (p) over ' + c.gens + ' generations in ' + c.reps + ' population' + (c.reps === 1 ? '' : 's') + ' of N = ' + sizeText(c.N) + ', seed ' + c.seed + ', starting at p = ' + F(c.p0, 2) + '; ' + forcesText(c) + '. Population ' + (st.rep + 1) + ' is dashed. ' + fateLine + '. At generation ' + t + ', marked by a vertical line, population ' + (st.rep + 1) + ' has p = ' + F(p, 3) + ' and the mean p of all populations is ' + F(meanT, 3) + '.',
        x: { label: 'Generation', unit: '', min: 0, max: c.gens, step: stepX }, y: { label: 'Frequency of A (p)', unit: '', min: 0, max: 1, step: 0.2 },
        curves: curves, vline: { x: t } });
      card.querySelector('.hw-key').textContent = 'Each solid line is one population; population ' + (st.rep + 1) + ' is the dashed line. The vertical line marks generation ' + t + '.' + (c.event ? ' Event: ' + eventText(c.event) + '.' : '') + (c.N > 0 || c.event ? '' : ' With a very large population there is no drift, so every population follows the same line.');
      card.querySelector('.hw-gh').textContent = 'Genotypes in generation ' + t + ', population ' + (st.rep + 1);
      card.querySelector('.hw-plot-g').innerHTML = T.plot({ h: 300,
        title: 'Bar graph of genotype frequencies in generation ' + t + ' of population ' + (st.rep + 1) + ', with Hardy-Weinberg expectations as squares: ' + GENO.map(function(x, i){ return x + ' observed ' + F(g[i], 3) + ', expected ' + F(hw[i], 3); }).join('; ') + '.',
        x: { label: 'Genotype', unit: '', categories: GENO }, y: { label: 'Frequency', unit: '', min: 0, max: 1, step: 0.2 },
        bars: GENO.map(function(x, i){ return { name: x, value: g[i], cls: 's1' }; }), points: GENO.map(function(x, i){ return { x: i, y: hw[i], cls: 's2', square: true }; }) });
      var adults = n > 0 ? String(n) : (rep.extinct != null && t >= rep.extinct ? '0 (died out)' : 'very large');
      var rows = [['Generation', String(t) + ' of ' + c.gens], ['Adults this generation', adults], ['p (A) / q (a)', F(p, 3) + ' / ' + F(q, 3)],
        ['Observed AA / Aa / aa', g.map(function(x){ return F(x, 3); }).join(' / ')], ['Hardy-Weinberg p² / 2pq / q²', hw.map(function(x){ return F(x, 3); }).join(' / ')],
        ['Mean p, all populations', F(meanT, 3)], ['Fates at generation ' + c.gens, f.fixed + ' fixed, ' + f.lost + ' lost, ' + f.poly + ' both' + (f.extinct ? ', ' + f.extinct + ' died out' : '')], ['Seed', String(c.seed)]];
      card.querySelector('.hw-readout').innerHTML = rows.map(function(x){ return '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('');
      var chiText = chiBlock(g, n, t);
      say('Population ' + (st.rep + 1) + ', generation ' + t + ': p = ' + F(p, 3) + '; genotypes AA ' + F(g[0], 3) + ', Aa ' + F(g[1], 3) + ', aa ' + F(g[2], 3) + ' against Hardy-Weinberg ' + hw.map(function(x){ return F(x, 3); }).join(', ') + '. ' + chiText + ' ' + fateLine + '. Seed ' + c.seed + '.', now);
      tables(c);
    }
    function chiBlock(g, n, t){
      var box = card.querySelector('.hw-chi');
      if(!(n > 0)){
        box.innerHTML = '<h3>Chi-square against Hardy-Weinberg</h3><p class="bt-small">A chi-square test needs counts of individuals. Choose a population size (N) to test a generation.</p>';
        return 'No chi-square: the population is very large.';
      }
      var x = G.chi(g, n);
      if(x.chi2 == null){
        box.innerHTML = '<h3>Chi-square against Hardy-Weinberg, generation ' + t + '</h3><p class="bt-small">One allele is fixed, so every individual has the same genotype and Hardy-Weinberg expects exactly that: there is nothing to test.</p>';
        return 'One allele is fixed, so there is no chi-square test.';
      }
      var dec = function(r){ return r ? 'the difference is significant: reject Hardy-Weinberg' : 'the difference is not significant: consistent with Hardy-Weinberg'; };
      var same = x.reject1 === x.reject2;
      var concl = 'χ² = ' + F(x.chi2, 2) + '. With 2 degrees of freedom (critical value ' + F(x.crit2, 2) + '), ' + dec(x.reject2) + '. With 1 degree of freedom (critical value ' + F(x.crit1, 2) + '), ' + dec(x.reject1) + '.' +
        (same ? '' : ' The two rules disagree here, so say which one you used.') + (x.small ? ' At least one expected count is below 5, so the test is unreliable.' : '');
      box.innerHTML = '<h3>Chi-square against Hardy-Weinberg, generation ' + t + '</h3>' +
        T.dataTable(['Genotype', 'Observed (o)', 'Expected (e)', '(o − e)² / e'], GENO.map(function(k, i){ return [k, String(x.obs[i]), F(x.exp[i], 2), F(x.terms[i], 3)]; }).concat([['Total', String(x.n), F(x.n, 2), F(x.chi2, 3)]]),
          'Observed and expected counts, population ' + (st.rep + 1) + ', p = ' + F(x.p, 4)) + '<p class="hw-concl">' + esc(concl) + '</p>';
      return concl;
    }
    function tables(c){
      var html = runs.length ? T.dataTable(['Run', 'N', 'Start p', 'Settings', 'Seed', 'Generations', 'A fixed', 'A lost', 'Both present', 'Mean final p'], runs.map(function(r){
        return [String(r.n), esc(sizeText(r.c.N)), F(r.c.p0, 2), esc(forcesText(r.c)), String(r.c.seed), String(r.c.gens), String(r.f.fixed), String(r.f.lost), String(r.f.poly), F(r.mean, 3)];
      }), 'Your recorded runs (' + runs.length + ')') : '<p class="bt-small">No recorded runs yet. Use Record this run or Compare population sizes.</p>';
      html += T.dataTable(['Population', 'Final p', 'Fate', 'Generation fixed or lost'], sim.reps.map(function(r, i){
        return [String(i + 1), F(r.p[c.gens], 3), esc(fateWord(r.fate)), r.end != null ? String(r.end) : '—'];
      }), 'Each population at generation ' + c.gens + ' (seed ' + c.seed + ')');
      var every = Math.max(1, T.niceStep(c.gens, 10)), rows = [];
      for(var t = 0; t <= c.gens; t += every) rows.push([String(t)].concat(sim.reps.map(function(r){ return F(r.p[t], 3); })));
      if((c.gens % every) !== 0) rows.push([String(c.gens)].concat(sim.reps.map(function(r){ return F(r.p[c.gens], 3); })));
      html += T.dataTable(['Generation'].concat(sim.reps.map(function(r, i){ return 'Pop. ' + (i + 1); })), rows, 'Frequency of A (p) by generation');
      card.querySelector('.bt-tables').innerHTML = html;
    }

    controls();
    compute(true);
    T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
    if(data.frq) T.frq(app, data.frq, SLUG);
  });
})();
