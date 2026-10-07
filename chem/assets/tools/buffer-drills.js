/* Drill: buffers and Henderson-Hasselbalch (Unit 8). Problems come from
   ApChemMath.buffer.generate (chem-tool-math.js), seeded; the weak acids and
   bases are data (chem/data/tools/buffer-drills.json); the step-by-step
   checking with targeted feedback (ln for log, the ratio upside down, pKb
   for pKa, no stoichiometry first) is ApChemTools.drill. */
(function(){
  'use strict';
  var T = window.ApChemTools;
  if(!T) return;
  var TITLE = { ph: 'pH of a buffer', ratio: 'The ratio for a target pH', add: 'Adding strong acid or base', capacity: 'Buffer capacity' };
  T.mount('buffer-drills', function(app, data){
    T.drill(app, data, {
      slug: 'buffer-drills',
      generate: function(r, ctx, type){ return window.ApChemMath.buffer.generate(r, ctx, type); },
      types: [{ value: 'ph', label: 'pH of a buffer' }, { value: 'ratio', label: 'Ratio for a target pH' }, { value: 'add', label: 'Adding strong acid or base' }, { value: 'capacity', label: 'Buffer capacity' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return TITLE[p.type]; }
    });
  });
})();
