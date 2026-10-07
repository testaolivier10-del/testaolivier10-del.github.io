/* Trainer: Q vs K (Unit 7). Problems come from ApChemMath.qk.generate,
   seeded; contexts are data (chem/data/tools/q-vs-k.json). In particle mode
   the mixture is drawn as a countable box (ApChemMath.particles.box, an SVG
   with a text alternative listing the counts). Steps: Q, the comparison,
   the direction, and the justification that earns the point. */
(function(){
  'use strict';
  var T = window.ApChemTools;
  if(!T) return;
  T.mount('q-vs-k', function(app, data){
    var M = window.ApChemMath;
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
  });
})();
