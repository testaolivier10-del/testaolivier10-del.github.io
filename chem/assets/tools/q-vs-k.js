/* Trainer: Q vs K (Unit 7). Job: predict which way a mixture reacts by
   comparing Q with K, and see it happen.

   Explore: a sealed vessel of particles for a reaction from the data file
   (particle contexts; K and the starting counts from ApChemMath.qk.generate,
   seeded). The student adds or removes particles of any species and changes
   the volume; Q (ApChemMath.Q on count × per ÷ V) jumps on the log scale
   around K at once, with the direction in words. Volume changes Q only when
   the gas moles differ between the sides (Δn ≠ 0), and the page says why.
   Run lets the particles react: the net reaction runs until Q = K
   (ApChemMath.equilibrate, exact amounts; drawn to the nearest particle).

   Test yourself: the four-step drill (Q, the comparison, the direction, the
   justification that earns the point), seeded by ApChemMath.qk.generate
   (problem codes, ?seed=), checked by ApChemTools.drill. In particle mode
   the mixture is a countable box (ApChemMath.particles.box). */
(function(){
  'use strict';
  var T = window.ApChemTools;
  if(!T) return;
  T.mount('q-vs-k', function(app, data){
    var M = window.ApChemMath;
    var ex = null;
    T.modes(app, { slug: 'q-vs-k', labels: ['Explore Q and K', 'Test yourself'], explore: function(h){ ex = explore(h, data, M); }, quiz: function(h){ quiz(h, data, M); },
      studio: { explore: function(pane, s){ if(ex) ex.studio(pane, s); } } });
  });

  function explore(host, data, M){
    var F = T.F, esc = T.esc;
    // Lookups reach the Tool Studio too, where these parts move (studio()).
    var LS = null, SP = null;
    function $(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); }
    function $$(sel){ var a = [].slice.call(host.querySelectorAll(sel)); return LS ? a.concat([].slice.call(LS.root.querySelectorAll(sel))) : a; }
    var ctxs = (data.contexts || []).filter(function(c){ return c.mode === 'particles'; });
    if(!ctxs.length){ host.innerHTML = '<p class="chem-soon">The particle reactions arrive with their unit.</p>'; return; }
    var ci = 0, seed = 1 + Math.floor(Math.random() * 9999), ctx, sp, K, n, V = 1, beaker = null, busy = false, last = null;
    host.innerHTML = '<section class="bt-problem qk-card" aria-labelledby="qk-h"><div class="tx-head"><h2 id="qk-h" class="qk-eq bt-eq"></h2><p class="bt-small qk-setup"></p></div>' +
      '<div class="qk-stage"><div class="qk-beaker"></div><div class="qk-side"><div class="qk-amts" role="group" aria-label="Change the amounts"></div>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm qk-run">Let it react</button></div><div class="qk-why"></div></div></div>' +
      T.moreHtml('<div class="qk-vol"></div><div class="bt-pick qk-pick"></div><div class="bt-buttons"><button type="button" class="bt-btn qk-new">New mixture</button></div>', 'volume of the vessel, another reaction, new mixture') + '</section>';
    var pick = $('.qk-pick'), start = T.cue('Tap + or − to add or remove particles, then press Let it react.');
    host.querySelector('.qk-side').insertBefore(start.el, host.querySelector('.qk-amts'));
    if(ctxs.length > 1){
      var sel = T.choiceSelect({ label: 'Reaction', options: ctxs.map(function(c, i){ return { value: i, label: M.eqHtml(c.species).replace(/<[^>]+>/g, '') }; }), value: 0, onChange: function(v){ ci = +v; seed++; build(); } });
      sel.el.classList.add('bt-inline'); pick.appendChild(sel.el);
    }
    $('.qk-new').addEventListener('click', function(){ seed++; build(); });
    $('.qk-run').addEventListener('click', run);
    var volS = T.slider({ label: 'Volume of the vessel', min: 0.5, max: 2, step: 0.25, value: 1, unit: 'L', decimals: 2, onInput: function(v){ V = v; draw('Volume now ' + F(V, 2) + ' L.'); } });
    $('.qk-vol').appendChild(volS.el);

    function dn(){ var s = 0; sp.forEach(function(x){ if(M.inQ(x)) s += x.nu; }); return s; }
    function build(){
      ctx = ctxs[ci]; sp = ctx.species;
      var p = M.qk.generate(M.rng(seed), ctx);
      K = p.K; V = 1; volS.set(1);
      n = p.counts.map(function(c){ return c * ctx.per; });
      $('.qk-eq').innerHTML = M.eqHtml(sp) + ' &nbsp; K<sub>c</sub> = ' + M.fmt(K, 2);
      $('.qk-setup').textContent = 'Gases in a sealed vessel at constant temperature. Each particle is ' + M.fmt(ctx.per, 2) + ' mol, so at 1.00 L each particle is ' + M.fmt(ctx.per, 2) + ' M.';
      if(beaker) beaker.destroy();
      beaker = window.ApChemBeaker.mount($('.qk-beaker'), { species: sp.map(function(s){ return { key: s.draw, label: s.html, mol: s.draw, name: s.html }; }), readout: 'qk', title: 'The vessel', max: 36, seed: seed, vessel: 'gas' });
      $('.qk-amts').innerHTML = sp.map(function(s, i){
        return '<div class="qk-amt"><span class="qk-n">' + s.html + '</span><button type="button" class="bt-step" data-i="' + i + '" data-d="-1" aria-label="Remove one ' + esc(s.html) + '">−</button><b class="qk-c" data-i="' + i + '"></b><button type="button" class="bt-step" data-i="' + i + '" data-d="1" aria-label="Add one ' + esc(s.html) + '">+</button></div>';
      }).join('');
      $$('.qk-amt .bt-step').forEach(function(b){ b.addEventListener('click', function(){
        if(busy) return;
        var i = +b.getAttribute('data-i'), d = +b.getAttribute('data-d');
        n[i] = Math.max(0, Math.round(n[i] / ctx.per) + d) * ctx.per;  // back to whole particles
        draw((d > 0 ? 'Added one ' : 'Removed one ') + sp[i].html + '.', i, d);
      }); });
      last = null;
      draw('');
    }
    function counts(){ var c = {}; sp.forEach(function(s, i){ c[s.draw] = Math.round(n[i] / ctx.per); }); return c; }
    function Qnow(){ return M.Q(sp, M.concOf(n, V)); }
    function draw(note, i, d){
      var q = Qnow(), ok = sp.every(function(s, j){ return !M.inQ(s) || n[j] > 0; }), c = counts();
      $$('.qk-c').forEach(function(el){ var j = +el.getAttribute('data-i'); el.textContent = c[sp[j].draw]; });
      $$('.qk-amt .bt-step[data-d="-1"]').forEach(function(b){ b.disabled = busy || c[sp[+b.getAttribute('data-i')].draw] <= 0; });
      $$('.qk-amt .bt-step[data-d="1"]').forEach(function(b){ b.disabled = busy || c[sp[+b.getAttribute('data-i')].draw] >= 14; });
      beaker.update({ counts: c, Q: ok ? q : (sp.some(function(s, j){ return s.nu < 0 && n[j] <= 0; }) ? Infinity : 0), K: K, note: note });
      $('.qk-run').disabled = busy;
      if(note) start.done();
      var w = why(q, ok, note, i, d);
      T.explain($('.qk-why'), w.head, w.body);
      last = q;
      if(LS) studioDraw(q, ok);
    }
    function why(q, ok, note, i, d){
      var conc = sp.map(function(s, j){ var c = n[j] / ctx.per, whole = Math.abs(c - Math.round(c)) < 1e-6;
        return '[' + s.html + '] = ' + (whole ? Math.round(c) + ' × ' + M.fmt(ctx.per, 2) + ' mol' : M.fmt(n[j], 3) + ' mol') + ' ÷ ' + F(V, 2) + ' L = ' + M.fmt(n[j] / V, 3) + ' M'; }).join('; ');
      if(!ok){
        var noR = sp.some(function(s, j){ return s.nu < 0 && M.inQ(s) && n[j] <= 0; }), noP = sp.some(function(s, j){ return s.nu > 0 && M.inQ(s) && n[j] <= 0; });
        if(noR && noP) return { head: '<b>A reactant and a product are both at zero.</b>', body: '<p>Q is not defined, and neither direction can run: each needs a species that is not there.</p>' };
        return { head: '<b>' + (noR ? 'A reactant is at zero.' : 'A product is at zero.') + '</b>', body: '<p>' + (noR ? 'Q has a zero on the bottom, so Q is larger than any K: only the reverse reaction can run.' : 'Q = 0, below any K: the forward reaction must run.') + '</p>' };
      }
      var c = window.ApChemBeaker.pure.qk(q, K), g = dn();
      var head = c.dir === 'eq' ? 'Q = K: at equilibrium.' : c.dir === 'fwd' ? 'Q < K: it will run forward.' : 'Q > K: it will run in reverse.';
      var body = 'Q = ' + M.exprHtml(sp) + ' = ' + M.fmt(q, 3) + ', K = ' + M.fmt(K, 2) + '. ';
      var toK = c.dir === 'fwd' ? 'The reaction makes products until Q rises to K.' : c.dir === 'rev' ? 'The reaction makes reactants until Q falls to K.' : 'Forward and reverse rates are equal: no net change.';
      if(note && /Volume/.test(note)){
        body += g === 0 ? 'Volume cancels here: the gas moles are the same on both sides (Δn = 0), so every concentration changes by the same factor and Q does not move. '
          : 'Δn(gas) = ' + (g > 0 ? '+' : '') + g + ', so the volume changes Q: Q scales as (1/V)<sup>' + g + '</sup>. ' + (g > 0 ? 'A smaller volume raises Q and a larger one lowers it. Starting from equilibrium, compressing the vessel makes Q > K, so the mixture shifts toward the side with fewer gas particles (reactants).' : 'A smaller volume lowers Q and a larger one raises it. Starting from equilibrium, compressing the vessel makes Q < K, so the mixture shifts toward the side with fewer gas particles (products).') + ' Which way it goes now depends on Q against K. ';
        body += toK;
      } else if(i != null){
        var prod = sp[i].nu > 0, up = (d > 0) === prod;
        body += (d > 0 ? 'Adding ' : 'Removing ') + (prod ? 'a product' : 'a reactant') + (up ? ' raised Q. ' : ' lowered Q. ') + toK;
      } else body += toK;
      return { head: '<b>' + head + '</b> ' + (c.dir === 'fwd' ? 'Q = ' + M.fmt(q, 3) + ' is below K.' : c.dir === 'rev' ? 'Q = ' + M.fmt(q, 3) + ' is above K.' : ''), body: '<p>' + body + '</p><p class="bt-small qk-conc">' + conc + '.</p>' };
    }
    function run(){
      if(busy) return;
      var target = M.equilibrate(sp, n, V, K), from = n.slice(), steps = T.reduced() ? 1 : 8, k = 0;
      var moved = Math.max.apply(null, target.map(function(t, j){ return Math.abs(t - from[j]); }));
      if(moved < 1e-9){ draw(sp.every(function(s, j){ return !M.inQ(s) || n[j] > 0; }) ? 'Already at equilibrium: nothing changes.' : 'Nothing can react: a species each direction needs is at zero.'); return; }
      busy = true;
      var tick = function(){
        k++;
        var f = k / steps;
        n = from.map(function(a, j){ return a + (target[j] - a) * f; });
        if(k < steps){ draw(''); setTimeout(tick, 140); return; }
        n = target; busy = false;
        var c = counts(), ex = sp.map(function(s, j){ return s.html + ' ' + M.fmt(n[j], 3) + ' mol'; }).join(', ');
        var whole = sp.every(function(s, j){ return Math.abs(n[j] / ctx.per - Math.round(n[j] / ctx.per)) < 0.02; });
        draw('Reacted until Q = K.');
        var w = $('.qk-why .bt-why-b');
        w.insertAdjacentHTML('afterbegin', '<p class="bt-small qk-ran">Equilibrium amounts: ' + ex + '.' + (whole ? '' : ' These are not whole particles, so the picture rounds to the nearest one; the readout uses the exact amounts.') + ' At equilibrium the reaction has not stopped: forward and reverse run at the same rate.</p>');
        n = target;
        void c;
      };
      tick();
    }
    /* Tool Studio: Q and K as pills, the direction on the right, the log
       gauge under the vessel; the verdict as the caption. */
    function studioDraw(q, ok){
      var c = ok ? window.ApChemBeaker.pure.qk(q, K) : null;
      LS.pills([{ k: 'Q', html: ok ? M.fmt(q, 3) : sp.some(function(s, j){ return s.nu < 0 && M.inQ(s) && n[j] <= 0; }) ? '∞' : '0', tone: 'readout' }, { k: 'K', html: M.fmt(K, 2), tone: 'ghost' }], 'left', 'explore');
      LS.pills([!c ? { html: 'Q undefined', tone: 'warn' } : c.dir === 'fwd' ? { html: 'Runs forward →', tone: 'accent' } : c.dir === 'rev' ? { html: '← Runs in reverse', tone: 'warn' } : { html: 'At equilibrium', tone: 'good' }], 'right', 'explore');
      LS.caption(T.sayHead($('.qk-why')), 'explore');
      SP.setup(F(V, 2) + ' L vessel');
      SP.open();
      var lg = LS.root.querySelector('.chem-ls-stage .lb-legend'), parts = LS.root.querySelector('.qk-ls-parts');
      if(lg && parts){ parts.innerHTML = '<h3 class="ls-h">Particles in the vessel</h3>'; parts.appendChild(lg); }
    }
    /* Tool Studio arrangement: the equation, the vessel and its Q-K gauge on
       the stage; the + and − amounts and Let it react in the dock; why it
       shifts in Why; the setup, the particle counts, the volume, another
       reaction and a new mixture in Details. */
    function studio(pane, s){
      LS = s;
      var parts = document.createElement('div'); parts.className = 'qk-ls-parts';
      var btn = $('.qk-run'); btn.classList.add('ls-btn', 'ls-pri');
      SP = T.studioPane(pane, s, { stage: [$('.qk-eq'), $('.qk-beaker')], dock: [$('.qk-amts'), btn], setup: 'Setup', moreLabel: 'Volume of the vessel, another reaction, new mixture',
        why: [$('.qk-why'), $('.qk-setup')], details: [parts] });
      draw('');
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.qk-amt .bt-step[data-d="1"]'), text: 'Tap + to add a particle' });
    }
    build();
    return { studio: studio };
  }

  function quiz(app, data, M){
    T.drill(app, data, {
      slug: 'q-vs-k',
      generate: function(r, ctx){ return M.qk.generate(r, ctx); },
      types: [{ value: 'numbers', label: 'Concentrations and pressures' }, { value: 'particles', label: 'Particle pictures' }],
      typeLabel: 'Show the mixture as',
      title: function(p){ return p.mode === 'particles' ? 'Count the particles, then compare Q with K' : 'Compare Q with K'; },
      extra: function(host, p){
        var fig = '';
        if(p.mode === 'particles'){
          var counts = {}, names = {};
          p.species.forEach(function(s, i){ if(s.draw){ counts[s.draw] = p.counts[i]; names[s.draw] = s.html + (p.counts[i] === 1 ? ' particle' : ' particles'); } });
          fig = '<figure class="cd-fig">' + M.particles.box(counts, p.counts.join('') * 7 + 11, { w: 300, h: 190, names: names }) +
            '<figcaption class="bt-small">Each particle represents ' + M.fmt(p.per, 2) + ' ' + p.unit + '.</figcaption></figure>';
        }
        // The Q-K bar from Explore: K in the middle; Q appears once it is
        // calculated (the student's own Q too, when it was off).
        host.innerHTML = fig + '<div class="qk-qbar lb" aria-live="polite">' + qkBar(p, null, null) + '</div>';
      },
      onStep: function(s, right, api){
        if(s.key !== 'Q') return;
        var bar = api.area.querySelector('.qk-qbar') || document.querySelector('.qk-qbar'); if(!bar) return;
        var inp = api.area.querySelector('.cd-step .cd-num input'), mine = inp && window.ApChemQuestions ? window.ApChemQuestions.parseNumber(inp.dataset.first || inp.value) : NaN;
        bar.innerHTML = qkBar(api.problem, right ? null : mine, true);
      }
    });
    // Remember the first number the student typed for Q, so the bar can draw
    // it next to the right one after Show the answer fills the box in. On the
    // document: the Tool Studio moves the drill out of app.
    document.addEventListener('submit', function(e){
      var inp = e.target.querySelector && e.target.querySelector('.cd-num input');
      if(inp && !inp.dataset.first && inp.value.trim()) inp.dataset.first = inp.value;
    }, true);
    function qkBar(p, mine, shown){
      var lk = Math.log10(p.K), pos = function(q){ return Math.max(0, Math.min(100, 50 + (Math.log10(Math.max(q, 1e-30)) - lk) * 25)); };
      var t = ''; ['÷100', '÷10', '', '×10', '×100'].forEach(function(w, i){ t += '<i style="left:' + (i * 25) + '%"' + (i === 2 ? ' class="lb-tk7"' : '') + '></i>' + (i === 0 || i === 4 ? '<em class="lb-e' + i + '" style="left:' + (i * 25) + '%">' + w + '</em>' : ''); });
      var dir = p.dir === 'f' ? 'fwd' : p.dir === 'r' ? 'rev' : 'eq', bad = shown && isFinite(mine) && mine > 0 && Math.abs(mine / p.Q - 1) > 0.05;
      return '<p class="qk-qbar-h"><b>Q against K</b> <span class="bt-small">' + (shown ? 'log scale: each step is ×10' : 'Q appears here once you calculate it.') + '</span></p>' +
        '<div class="lb-scale lb-qk lb-' + (shown ? dir : 'eq') + '"><span class="lb-scale-bar"></span><span class="lb-tks">' + t + '</span><span class="lb-k" style="left:50%"><b>K</b></span>' +
        (shown ? '<span class="lb-mark" style="left:' + pos(p.Q).toFixed(1) + '%"><b>Q</b></span>' : '') +
        (bad ? '<span class="lb-mark qk-mine" style="left:' + pos(mine).toFixed(1) + '%"><b>yours</b></span>' : '') + '</div>' +
        (bad ? '<p class="bt-small qk-mine-t">Your Q, ' + M.fmt(mine, 3) + ', is on the dashed mark; the right Q is ' + M.fmt(p.Q, 3) + '.</p>' : '');
    }
  }
})();
