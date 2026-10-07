/* Drill: ICE tables (Unit 7). Problems come from ApChemMath.ice.generate
   (chem-tool-math.js), seeded; contexts are data (chem/data/tools/
   ice-table-drills.json); the step-by-step checking is ApChemTools.drill.
   This file draws the ICE table the I, C and E rows are typed into: a real
   table, one labelled text box per cell, with the active row highlighted. */
(function(){
  'use strict';
  var T = window.ApChemTools;
  if(!T) return;
  var TITLE = { findK: 'Find K from equilibrium data', smallx: 'Equilibrium amounts when K is small', square: 'Equilibrium amounts: a perfect square' };
  var ROWS = [['I', 'Initial'], ['C', 'Change'], ['E', 'Equilibrium']];
  T.mount('ice-table-drills', function(app, data){
    T.drill(app, data, {
      slug: 'ice-table-drills',
      generate: function(r, ctx, type){ return window.ApChemMath.ice.generate(r, ctx, type); },
      types: [{ value: 'findK', label: 'Find K' }, { value: 'smallx', label: 'Small K and the 5% check' }, { value: 'square', label: 'Perfect square' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return TITLE[p.type]; },
      extra: function(host, p){
        var plain = function(h){ return String(h).replace(/<[^>]+>/g, ''); };
        var unit = p.Kp ? 'atm' : 'M';
        host.innerHTML = '<div class="table-wrap" tabindex="0" role="region" aria-label="ICE table"><table class="chem-data cd-ice"><caption>ICE table (' + (p.Kp ? 'partial pressures, atm' : 'concentrations, M') + ')</caption><thead><tr><th scope="col">Row</th>' +
          p.species.map(function(s){ return '<th scope="col">' + (p.Kp ? 'P<sub>' + s.html + '</sub>' : '[' + s.html + ']') + '</th>'; }).join('') + '</tr></thead><tbody>' +
          ROWS.map(function(rw){
            return '<tr data-row="' + rw[0] + '"><th scope="row">' + rw[0] + ' <span class="bt-small">' + rw[1] + '</span></th>' + p.species.map(function(s, i){
              return '<td data-i="' + i + '" data-label="' + rw[1] + ' ' + (p.Kp ? 'P ' : '') + plain(s.html) + (rw[0] === 'C' ? ' (in terms of x)' : ' (' + unit + ')') + '"><span class="cd-blank" aria-hidden="true">·</span></td>';
            }).join('') + '</tr>';
          }).join('') + '</tbody></table></div>';
      }
    });
  });
})();
