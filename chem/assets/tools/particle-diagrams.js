/* Trainer: particle diagrams (Units 3, 4, 7, 8). Pictures are drawn by
   ApChemMath.particles (chem-tool-math.js) from a seed, each an SVG with a
   text alternative written from the counts it draws; the ions, acids and
   reactions are data (chem/data/tools/particle-diagrams.json), and each kind
   of picture is served only once its unit is published. The choice is a
   radio group whose labels are the pictures (ApChemTools.drill). */
(function(){
  'use strict';
  var T = window.ApChemTools;
  if(!T) return;
  var TITLE = { hydration: 'Ions in water', acid: 'Strong and weak acids', limiting: 'Limiting reactant', equilibrium: 'Equilibrium particle counts' };
  T.mount('particle-diagrams', function(app, data){
    var M = window.ApChemMath;
    T.drill(app, data, {
      slug: 'particle-diagrams',
      generate: function(r, ctx){ return M.particles.generate(r, ctx); },
      types: [{ value: 'hydration', label: TITLE.hydration + ' (Unit 3)' }, { value: 'limiting', label: TITLE.limiting + ' (Unit 4)' }, { value: 'equilibrium', label: TITLE.equilibrium + ' (Unit 7)' }, { value: 'acid', label: TITLE.acid + ' (Unit 8)' }],
      typeLabel: 'Kind of picture',
      title: function(p){ return TITLE[p.type]; },
      extra: function(host, p){
        if(p.extra.before) host.innerHTML = '<figure class="cd-fig"><figcaption class="bt-small">' + (p.type === 'limiting' ? 'Before the reaction' : 'Before any reaction') + '</figcaption>' + p.extra.before + '</figure>';
      }
    });
  });
})();
