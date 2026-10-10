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
    T.modes(app, { slug: 'q-vs-k', labels: ['Explore Q and K', 'Test yourself'], explore: function(h){ explore(h, data, M); }, quiz: function(h){ quiz(h, data, M); } });
  });

  function explore(host, data, M){
    var F = T.F, esc = T.esc;
    var ctxs = (data.contexts || []).filter(function(c){ return c.mode === 'particles'; });
    if(!ctxs.length){ host.innerHTML = '<p class="chem-soon">The particle reactions arrive with their unit.</p>'; return; }
    var ci = 0, seed = 1 + Math.floor(Math.random() * 9999), ctx, sp, K, n, V = 1, beaker = null, busy = false, last = null;
    host.innerHTML = '<section class="bt-problem qk-card" aria-labelledby="qk-h"><div class="tx-head"><h2 id="qk-h" class="qk-eq bt-eq"></h2><p class="bt-small qk-setup"></p></div>' +
      '<div class="qk-stage"><div class="qk-beaker"></div><div class="qk-side"><div class="qk-amts" role="group" aria-label="Change the amounts"></div><div class="qk-vol"></div>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm qk-run">Let it react</button><button type="button" class="bt-btn qk-new">New mixture</button></div></div></div>' +
      '<div class="qk-why" aria-hidden="true"></div><div class="bt-pick qk-pick"></div></section>';
    var pick = host.querySelector('.qk-pick');
    if(ctxs.length > 1){
      var sel = T.choiceSelect({ label: 'Reaction', options: ctxs.map(function(c, i){ return { value: i, label: M.eqHtml(c.species).replace(/<[^>]+>/g, '') }; }), value: 0, onChange: function(v){ ci = +v; seed++; build(); } });
      sel.el.classList.add('bt-inline'); pick.appendChild(sel.el);
    }
    host.querySelector('.qk-new').addEventListener('click', function(){ seed++; build(); });
    host.querySelector('.qk-run').addEventListener('click', run);
    var volS = T.slider({ label: 'Volume of the vessel', min: 0.5, max: 2, step: 0.25, value: 1, unit: 'L', decimals: 2, onInput: function(v){ V = v; draw('Volume now ' + F(V, 2) + ' L.'); } });
    host.querySelector('.qk-vol').appendChild(volS.el);

    function dn(){ var s = 0; sp.forEach(function(x){ if(M.inQ(x)) s += x.nu; }); return s; }
    function build(){
      ctx = ctxs[ci]; sp = ctx.species;
      var p = M.qk.generate(M.rng(seed), ctx);
      K = p.K; V = 1; volS.set(1);
      n = p.counts.map(function(c){ return c * ctx.per; });
      host.querySelector('.qk-eq').innerHTML = M.eqHtml(sp) + ' &nbsp; K<sub>c</sub> = ' + M.fmt(K, 2);
      host.querySelector('.qk-setup').textContent = 'Gases in a sealed vessel at constant temperature. Each particle is ' + M.fmt(ctx.per, 2) + ' mol, so at 1.00 L each particle is ' + M.fmt(ctx.per, 2) + ' M.';
      if(beaker) beaker.destroy();
      beaker = window.ApChemBeaker.mount(host.querySelector('.qk-beaker'), { species: sp.map(function(s){ return { key: s.draw, label: s.html, mol: s.draw, name: s.html }; }), readout: 'qk', title: 'The vessel', max: 36, seed: seed });
      host.querySelector('.qk-amts').innerHTML = sp.map(function(s, i){
        return '<div class="qk-amt"><span class="qk-n">' + s.html + '</span><button type="button" class="bt-step" data-i="' + i + '" data-d="-1" aria-label="Remove one ' + esc(s.html) + '">−</button><b class="qk-c" data-i="' + i + '"></b><button type="button" class="bt-step" data-i="' + i + '" data-d="1" aria-label="Add one ' + esc(s.html) + '">+</button></div>';
      }).join('');
      host.querySelectorAll('.qk-amt .bt-step').forEach(function(b){ b.addEventListener('click', function(){
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
      host.querySelectorAll('.qk-c').forEach(function(el){ var j = +el.getAttribute('data-i'); el.textContent = c[sp[j].draw]; });
      host.querySelectorAll('.qk-amt .bt-step[data-d="-1"]').forEach(function(b){ b.disabled = busy || c[sp[+b.getAttribute('data-i')].draw] <= 0; });
      host.querySelectorAll('.qk-amt .bt-step[data-d="1"]').forEach(function(b){ b.disabled = busy || c[sp[+b.getAttribute('data-i')].draw] >= 14; });
      beaker.update({ counts: c, Q: ok ? q : (sp.some(function(s, j){ return s.nu < 0 && n[j] <= 0; }) ? Infinity : 0), K: K, note: note });
      host.querySelector('.qk-run').disabled = busy;
      host.querySelector('.qk-why').innerHTML = why(q, ok, note, i, d);
      last = q;
    }
    function why(q, ok, note, i, d){
      var conc = sp.map(function(s, j){ var c = n[j] / ctx.per, whole = Math.abs(c - Math.round(c)) < 1e-6;
        return '[' + s.html + '] = ' + (whole ? Math.round(c) + ' × ' + M.fmt(ctx.per, 2) + ' mol' : M.fmt(n[j], 3) + ' mol') + ' ÷ ' + F(V, 2) + ' L = ' + M.fmt(n[j] / V, 3) + ' M'; }).join('; ');
      if(!ok){
        var noR = sp.some(function(s, j){ return s.nu < 0 && n[j] <= 0; });
        return '<p class="tx-where"><b>' + (noR ? 'A reactant is at zero.' : 'A product is at zero.') + '</b> ' + (noR ? 'Q has a zero on the bottom, so Q is larger than any K: only the reverse reaction can run.' : 'Q = 0, below any K: the forward reaction must run.') + '</p>';
      }
      var c = window.ApChemBeaker.pure.qk(q, K), g = dn();
      var head = c.dir === 'eq' ? 'Q = K: at equilibrium.' : c.dir === 'fwd' ? 'Q < K: it will run forward.' : 'Q > K: it will run in reverse.';
      var body = 'Q = ' + M.exprHtml(sp) + ' = ' + M.fmt(q, 3) + ', K = ' + M.fmt(K, 2) + '. ';
      var toK = c.dir === 'fwd' ? 'The reaction makes products until Q rises to K.' : c.dir === 'rev' ? 'The reaction makes reactants until Q falls to K.' : 'Forward and reverse rates are equal: no net change.';
      if(note && /Volume/.test(note)){
        body += g === 0 ? 'Volume cancels here: the gas moles are the same on both sides (Δn = 0), so every concentration changes by the same factor and Q does not move. '
          : 'Δn(gas) = ' + (g > 0 ? '+' : '') + g + ', so the volume changes Q: Q scales as (1/V)<sup>' + g + '</sup>. ' + (g > 0 ? 'A smaller volume raises Q, so the mixture shifts toward the side with fewer gas particles (reactants).' : 'A smaller volume lowers Q, so the mixture shifts toward the side with fewer gas particles (products).') + ' ';
        body += toK;
      } else if(i != null){
        var prod = sp[i].nu > 0, up = (d > 0) === prod;
        body += (d > 0 ? 'Adding ' : 'Removing ') + (prod ? 'a product' : 'a reactant') + (up ? ' raised Q. ' : ' lowered Q. ') + toK;
      } else body += toK;
      return '<p class="tx-where"><b>' + head + '</b> ' + body + '<span class="bt-small qk-conc">' + conc + '.</span></p>';
    }
    function run(){
      if(busy) return;
      var target = M.equilibrate(sp, n, V, K), from = n.slice(), steps = T.reduced() ? 1 : 8, k = 0;
      var moved = Math.max.apply(null, target.map(function(t, j){ return Math.abs(t - from[j]); }));
      if(moved < 1e-9){ draw('Already at equilibrium: nothing changes.'); return; }
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
        var w = host.querySelector('.qk-why');
        w.insertAdjacentHTML('beforeend', '<p class="bt-small qk-ran">Equilibrium amounts: ' + ex + '.' + (whole ? '' : ' These are not whole particles, so the picture rounds to the nearest one; the readout uses the exact amounts.') + ' At equilibrium the reaction has not stopped: forward and reverse run at the same rate.</p>');
        n = target;
        void c;
      };
      tick();
    }
    build();
  }

  function quiz(app, data, M){
    T.drill(app, data, {
      slug: 'q-vs-k',
      generate: function(r, ctx){ return M.qk.generate(r, ctx); },
      types: [{ value: 'numbers', label: 'Concentrations and pressures' }, { value: 'particles', label: 'Particle pictures' }],
      typeLabel: 'Show the mixture as',
      title: function(p){ return p.mode === 'particles' ? 'Count the particles, then compare Q with K' : 'Compare Q with K'; },
      extra: function(host, p){
        if(p.mode !== 'particles') return;
        var counts = {}, names = {};
        p.species.forEach(function(s, i){ if(s.draw){ counts[s.draw] = p.counts[i]; names[s.draw] = s.html + (p.counts[i] === 1 ? ' particle' : ' particles'); } });
        host.innerHTML = '<figure class="cd-fig">' + M.particles.box(counts, p.counts.join('') * 7 + 11, { w: 300, h: 190, names: names }) +
          '<figcaption class="bt-small">Each particle represents ' + M.fmt(p.per, 2) + ' ' + p.unit + '.</figcaption></figure>';
      }
    });
  }
})();
