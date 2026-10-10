/* Drill: buffers and Henderson-Hasselbalch (Unit 8). Job: see why a buffer
   holds its pH, and when it stops.

   Explore: a beaker of HA and A⁻ (10 particles of each; 1 particle = a
   tenth of each form's starting amount) in 100 mL with a pH meter. "+ OH⁻"
   and "+ H₃O⁺" add one particle's worth of NaOH or HCl (no volume change): the strong species reacts completely, so one HA turns into A⁻
   (or back) where it sits, and the pH barely moves until one form runs out;
   past capacity the leftover strong acid or base sets the pH and it jumps.
   Every number is ApChemMath.bufferState: the meter is the exact pH (charge
   balance with water), the worked line is the exam's method
   (Henderson-Hasselbalch inside capacity, the strong excess past it). A
   graph traces pH against what was added, beside the same additions to
   pure water.

   Test yourself: the seeded drills from ApChemMath.buffer.generate (problem
   codes, ?seed=), each with the beaker it describes: the buffer's particles
   in their real ratio, redrawn after the stoichiometry step. Steps are
   checked by ApChemTools.drill (ln for log, the ratio upside down, pKb for
   pKa, no stoichiometry first). */
(function(){
  'use strict';
  var T = window.ApChemTools;
  if(!T) return;
  var TITLE = { ph: 'pH of a buffer', ratio: 'The ratio for a target pH', add: 'Adding strong acid or base', capacity: 'Buffer capacity' };
  T.mount('buffer-drills', function(app, data){
    var M = window.ApChemMath;
    T.modes(app, { slug: 'buffer-drills', labels: ['Explore the buffer', 'Test yourself'], explore: function(h){ explore(h, data, M); }, quiz: function(h){ quiz(h, data, M); } });
  });

  function names(ctx){
    var b = !!ctx.base, a = ctx.acid || {}, B = ctx.base || {};
    return { isBase: b, HA: b ? B.BH : a.HA, A: b ? B.B : a.A, name: b ? B.name : a.name, Ka: b ? 1e-14 / B.Kb : a.Ka };
  }
  function species(n){
    return n.isBase
      ? [{ key: 'HA', label: 'BH⁺', name: n.HA + ' (BH⁺)', tone: 2 }, { key: 'A', label: 'B', name: n.A + ' (B)', tone: 3 }]
      : [{ key: 'HA', label: 'HA', mol: 'HA', name: n.HA + ' (HA)' }, { key: 'A', label: 'A⁻', mol: 'A-', name: n.A + ' (A⁻)' }];
  }

  /* ------------------------------------------------------------ explore */
  function explore(host, data, M){
    var F = T.F, esc = T.esc, ctxs = data.contexts || [];
    var V = 0.100, ci = 0, size = 10, b = 0, hist = [], beaker = null, n;
    host.innerHTML = '<section class="bt-problem bf-card" aria-labelledby="bf-h"><div class="tx-head"><h2 id="bf-h" class="bf-title"></h2><p class="bt-small bf-setup"></p></div>' +
      '<div class="bf-stage"><div class="bf-beaker"></div>' +
      '<div class="bf-side"><div class="bf-btns"><button type="button" class="bf-add bf-oh" data-d="1">+ OH⁻<span class="bf-u">NaOH</span></button><button type="button" class="bf-add bf-h" data-d="-1">+ H₃O⁺<span class="bf-u">HCl</span></button></div>' +
      '<div class="bf-plot"></div></div></div>' +
      '<div class="bf-why" aria-hidden="true"></div>' +
      '<div class="bt-pick bf-pick"></div>' +
      '<p class="bt-small bf-scale"><span class="bf-per"></span> Na⁺, Cl⁻ and water are not drawn. The meter shows the exact pH (water\'s own ions included); the line above it is the method the exam expects.</p></section>';
    var pick = host.querySelector('.bf-pick');
    function inline(s){ s.el.classList.add('bt-inline'); return s.el; }
    pick.appendChild(inline(T.choiceSelect({ label: 'Buffer', options: ctxs.map(function(c, i){ return { value: i, label: names(c).name }; }), value: 0, onChange: function(v){ ci = +v; reset(); } })));
    pick.appendChild(inline(T.choiceSelect({ label: 'Amount of each form', options: [{ value: 5, label: '5 mmol (0.050 M)' }, { value: 10, label: '10 mmol (0.10 M)' }, { value: 20, label: '20 mmol (0.20 M)' }], value: 10, onChange: function(v){ size = +v; reset(); } })));
    pick.insertAdjacentHTML('beforeend', '<button type="button" class="bt-btn bf-reset">Start over</button>');
    pick.querySelector('.bf-reset').addEventListener('click', reset);
    host.querySelectorAll('.bf-add').forEach(function(btn){ btn.addEventListener('click', function(){ b = M.round(b + (+btn.getAttribute('data-d')) * step(), 7); hist.push(b); draw(true); }); });

    function step(){ return size / 10 / 1000; }
    function reset(){
      n = names(ctxs[ci]); b = 0; hist = [0];
      var u = M.fmt(size / 10, 2) + ' mmol ';
      host.querySelector('.bf-oh .bf-u').textContent = u + 'NaOH'; host.querySelector('.bf-h .bf-u').textContent = u + 'HCl';
      host.querySelector('.bf-per').textContent = 'Each particle is ' + u + 'in 100 mL; each tap adds one particle\'s worth.';
      host.querySelector('.bf-title').textContent = n.name + ' buffer';
      host.querySelector('.bf-setup').innerHTML = '100 mL with ' + size + ' mmol ' + esc(n.HA) + ' and ' + size + ' mmol ' + esc(n.A) + '. pK<sub>a</sub> of ' + esc(n.HA) + ' = ' + F(-Math.log10(n.Ka), 2) + '.';
      if(beaker) beaker.destroy();
      beaker = window.ApChemBeaker.mount(host.querySelector('.bf-beaker'), { species: species(n).concat([{ key: 'OH', label: 'OH⁻', name: 'leftover OH⁻', tone: 5 }, { key: 'H3O', label: 'H₃O⁺', mol: 'H3O+', name: 'leftover H₃O⁺' }]), readout: 'pH', title: 'The buffer', max: 28, seed: 11 + ci });
      draw(false);
    }
    function st(x){ return M.bufferState({ Ka: n.Ka, nHA: size / 1000, nA: size / 1000, V: V, b: x }); }
    function mm(x){ return Math.round(x * 1e6) / 1e3; }
    function draw(acted){
      var s = st(b), k = 1 / step(), counts = { HA: Math.round(s.nHA * k), A: Math.round(s.nA * k), OH: Math.round(s.exOH * k), H3O: Math.round(s.exH * k) };
      var prev = hist.length > 1 ? st(hist[hist.length - 2]) : null, d = prev ? s.pH - prev.pH : 0;
      var added = mm(Math.abs(b)), what = b > 0 ? added + ' mmol OH⁻' : b < 0 ? added + ' mmol H₃O⁺' : '';
      beaker.update({ counts: counts, pH: s.pH, note: acted ? (d >= 0 ? 'pH rose by ' : 'pH fell by ') + F(Math.abs(d), 2) + '.' : '' });
      host.querySelector('.bf-why').innerHTML = why(s, d, acted, what);
      plot(s);
      var lim = 16 * step() - 1e-9;
      host.querySelector('.bf-oh').disabled = b >= lim;
      host.querySelector('.bf-h').disabled = b <= -lim;
    }
    function why(s, d, acted, what){
      var pKa = -Math.log10(n.Ka), HA = esc(n.HA), A = esc(n.A), nH = mm(s.nHA), nA = mm(s.nA), out = '', head = '', calc = '';
      var react = b > 0 ? 'OH⁻ + ' + HA + ' → ' + A + ' + H₂O' : b < 0 ? 'H₃O⁺ + ' + A + ' → ' + HA + ' + H₂O' : '';
      if(s.method === 'hh' || s.method === 'hh-edge'){
        head = acted ? 'Buffered: pH ' + (d >= 0 ? 'up' : 'down') + ' only ' + F(Math.abs(d), 2) + '.' : 'Equal amounts: pH = pK<sub>a</sub>.';
        out = react ? 'Each ' + (b > 0 ? 'OH⁻' : 'H₃O⁺') + ' reacts completely (' + react + '), so the strong ' + (b > 0 ? 'base' : 'acid') + ' is used up and only the ratio shifts. '
          : 'Both forms are here: ' + HA + ' can take OH⁻ and ' + A + ' can take H₃O⁺. ';
        calc = 'pH = ' + F(pKa, 2) + ' + log(' + nA + ' / ' + nH + ') = ' + F(s.pHmethod, 2);
        if(s.method === 'hh-edge') out += 'The ratio is outside 0.1 to 10, so the buffer is nearly spent: each addition moves the pH more. ';
      } else if(s.method === 'weak-base' || s.method === 'weak-acid'){
        var wb = s.method === 'weak-base';
        head = 'Capacity reached: no ' + (wb ? HA : A) + ' left.';
        out = 'Only ' + (wb ? A : HA) + ' remains, so this is just a weak ' + (wb ? 'base' : 'acid') + ' solution. The next ' + (wb ? 'OH⁻' : 'H₃O⁺') + ' has nothing to react with. ';
        calc = 'weak ' + (wb ? 'base' : 'acid') + ' at ' + F(mm(wb ? s.nA : s.nHA) / 100, 3) + ' M: pH = ' + F(s.pHmethod, 2);
      } else {
        var base = s.method === 'excess-base', ex = mm(base ? s.exOH : s.exH);
        head = 'Past capacity: pH ' + (acted ? (d >= 0 ? 'jumped ' : 'dropped ') + F(Math.abs(d), 2) : 'set by the excess') + '.';
        out = 'All the ' + (base ? HA : A) + ' is gone, so ' + ex + ' mmol ' + (base ? 'OH⁻' : 'H₃O⁺') + ' stays in solution and sets the pH; the weak ' + (base ? 'base ' + A : 'acid ' + HA) + ' barely matters. ';
        calc = base ? '[OH⁻] = ' + ex + ' mmol ÷ 100 mL = ' + M.fmt(ex / 100, 2) + ' M, pOH = ' + F(14 - s.pHmethod, 2) + ', pH = ' + F(s.pHmethod, 2) : '[H₃O⁺] = ' + ex + ' mmol ÷ 100 mL = ' + M.fmt(ex / 100, 2) + ' M, pH = ' + F(s.pHmethod, 2);
      }
      var exact = Math.abs(s.pH - s.pHmethod) > 0.02 ? ' (the exact pH, with water\'s own ions, is ' + F(s.pH, 2) + ')' : '';
      var water = b ? ' The same ' + what + ' in 100 mL of pure water: pH ' + F(s.water, 2) + '.' : '';
      return '<p class="tx-where"><b>' + head + '</b> ' + out + '<span class="bf-calc">' + calc + exact + '.</span>' + water + '</p>';
    }
    function plot(s){
      var u = size / 10, lim = 16 * u, seen = hist.map(function(h){ return Math.round(h / step()); });
      var lo = Math.min.apply(null, seen), hi = Math.max.apply(null, seen), path = [], water = [];
      for(var k = lo * 4; k <= hi * 4; k++){ var q = st(k * step() / 4); path.push([k * u / 4, q.pH]); water.push([k * u / 4, q.water]); }
      var now = b * 1000;
      var svg = T.plot({ w: 420, h: 250, title: 'pH against mmol of strong base added (negative: strong acid). Buffer pH now ' + F(s.pH, 2) + '; pure water with the same additions ' + F(s.water, 2) + '.',
        x: { label: 'mmol added (− acid, + base)', min: -lim, max: lim, step: T.niceStep(2 * lim, 5) },
        y: { label: 'pH', min: 0, max: 14, step: 2 },
        curves: [{ cls: 's3', points: water, dashed: true }, { cls: 's1', points: path }],
        points: [{ x: now, y: s.pH, cls: 's2' }], vline: { x: 0 } });
      host.querySelector('.bf-plot').innerHTML = svg + '<p class="bt-small bf-key"><span class="bf-k1"></span>this buffer <span class="bf-k2"></span>pure water, same additions</p>';
    }
    reset();
  }

  /* --------------------------------------------------------------- quiz */
  function quiz(app, data, M){
    var beaker = null, cur = null;
    function mountB(host, ctx, title){ return window.ApChemBeaker.mount(host, { species: species(names(ctx)), readout: 'none', title: title, max: 24, seed: 5 }); }
    function counts(nH, nA){ return { HA: Math.round(nH * 1e6), A: Math.round(nA * 1e6) }; }
    T.drill(app, data, {
      slug: 'buffer-drills',
      generate: function(r, ctx, type){ var p = M.buffer.generate(r, ctx, type); p.context = ctx; return p; },
      types: [{ value: 'ph', label: 'pH of a buffer' }, { value: 'ratio', label: 'Ratio for a target pH' }, { value: 'add', label: 'Adding strong acid or base' }, { value: 'capacity', label: 'Buffer capacity' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return TITLE[p.type]; },
      extra: function(host, p){
        cur = p; beaker = null;
        var v = p.values, n = names(p.context);
        if(p.type === 'capacity'){
          host.innerHTML = '<div class="bf-two"><div class="bf-b1"></div><div class="bf-b2"></div></div><p class="bt-small">Same ratio in both; buffer ' + v.high + ' has more of each form. Both beakers use one scale.</p>';
          var big = v.high === 1 ? v.b1 : v.b2, k = 22 / (big.cH + big.cA);
          [['.bf-b1', v.b1, 'Buffer 1'], ['.bf-b2', v.b2, 'Buffer 2']].forEach(function(x){
            mountB(host.querySelector(x[0]), p.context, x[2]).update({ counts: { HA: Math.max(1, Math.round(x[1].cH * k)), A: Math.max(1, Math.round(x[1].cA * k)) } });
          });
          return;
        }
        host.innerHTML = '<div class="bf-qb"></div><p class="bt-small bf-qnote"></p>';
        beaker = mountB(host.querySelector('.bf-qb'), p.context, 'The buffer');
        var note = host.querySelector('.bf-qnote');
        if(p.type === 'ph'){ beaker.update({ counts: counts(v.cH, v.cA) }); note.textContent = 'Drawn in the ratio of the concentrations given: ' + n.A + ' : ' + n.HA + ' = ' + M.fmt(v.cA / v.cH, 3) + '.'; }
        else if(p.type === 'add'){ beaker.update({ counts: counts(v.cH * v.L, v.cA * v.L) }); note.textContent = 'Before the ' + (v.acidAdded ? 'HCl' : 'NaOH') + ' goes in. Do the stoichiometry, then watch the beaker change.'; }
        else { beaker.update({ counts: { HA: 6, A: 6 } }); note.textContent = 'Equal amounts: pH = pKa. Find the ratio the target pH needs.'; }
      },
      onStep: function(s){
        if(!beaker || !cur) return;
        var v = cur.values, n = names(cur.context), nt = app.querySelector('.bf-qnote');
        if(cur.type === 'add' && s.key === 'nH'){
          beaker.update({ counts: counts(v.nH, v.nA), note: 'After the reaction: ' + (v.acidAdded ? 'H₃O⁺ turned ' + n.A + ' into ' + n.HA : 'OH⁻ turned ' + n.HA + ' into ' + n.A) + '.' });
          if(nt) nt.textContent = 'After the reaction: the strong ' + (v.acidAdded ? 'acid' : 'base') + ' is used up; only the ratio changed.';
        }
        if(cur.type === 'ratio' && s.key === 'ratio'){
          var r = v.ratio, t = 12, hA = Math.max(1, Math.round(t * r / (1 + r))), hH = Math.max(1, t - hA);
          beaker.update({ counts: { HA: hH, A: hA }, note: 'Drawn at the ratio ' + M.fmt(r, 2) + '.' });
          if(nt) nt.textContent = 'At pH ' + T.F(v.target, 2) + ': ' + n.A + ' : ' + n.HA + ' = ' + M.fmt(r, 2) + ' (rounded to whole particles).';
        }
      }
    });
  }
})();
