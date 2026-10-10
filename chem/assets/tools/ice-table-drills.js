/* Drill: ICE tables (Unit 7). Job: set up and solve an ICE table, and see
   what each row means for the mixture.

   Problems come from ApChemMath.ice.generate (chem-tool-math.js), seeded;
   contexts are data (chem/data/tools/ice-table-drills.json); the
   step-by-step checking is ApChemTools.drill. This file draws the ICE table
   the I, C and E rows are typed into (a real table, one labelled text box per
   cell, the active row highlighted) and, beside it, the mixture live:

   - a bar chart of each species' concentration (or pressure): the I bars
     from the I row, arrows from the C row, the E bars from the E row,
     redrawn as each cell is typed (a typed value is drawn hatched until its
     step is checked);
   - a live beaker (ApChemBeaker, readout 'qk') whose particles follow the
     same numbers on one fixed scale, with Q against K: Q of the I row first,
     then Q of the typed E row, closing in on K as the E row comes right.
     For "find K" problems K is the answer, so the gauge appears only once
     the K step is done.
   Every Q is ApChemMath.Q of the typed or checked numbers.

   Explore (the first tab): the same reaction and starting amounts, with x
   on a slider. The E row is written in x and as numbers, the bars and the
   beaker follow, and Q slides toward K; "Solve for x" jumps to the exact
   extent (ApChemMath.solveExtent). The drill is the "Test yourself" tab;
   problem codes (?seed=) open it. */
(function(){
  'use strict';
  var T = window.ApChemTools;
  if(!T) return;
  var TITLE = { findK: 'Find K from equilibrium data', smallx: 'Equilibrium amounts when K is small', square: 'Equilibrium amounts: a perfect square' };
  var ROWS = [['I', 'Initial'], ['C', 'Change'], ['E', 'Equilibrium']];
  var plain = function(h){ return String(h).replace(/<[^>]+>/g, ''); };
  T.mount('ice-table-drills', function(app, data){
    var M = window.ApChemMath;
    T.modes(app, { slug: 'ice-table-drills', labels: ['Explore x', 'Test yourself'], explore: function(h){ explore(h, data, M); }, quiz: function(h){ quiz(h, data, M); } });
  });

  function explore(host, data, M){
    var F = T.F, esc = T.esc, ctxs = data.contexts || [], ci = 0, seed = 1 + Math.floor(Math.random() * 9999), p, sp, x = 0, xlo, xhi, xs, beaker, slider;
    host.innerHTML = '<section class="bt-problem ic-ex" aria-labelledby="icx-h"><div class="tx-head"><h2 id="icx-h" class="bt-eq ic-eqn"></h2><p class="bt-small ic-setup"></p></div>' +
      '<div class="ic-wrap"><div class="ic-live"><figure class="ic-bars"><div class="ic-chart"></div></figure><div class="ic-beaker"></div></div>' +
      '<div class="ic-ctl"><div class="ic-x"></div><div class="bt-buttons"><button type="button" class="btn-press sm ic-solve">Solve for x</button><button type="button" class="bt-btn ic-new">New numbers</button></div>' +
      '<div class="ic-why" aria-hidden="true"></div><div class="ic-tab"></div></div></div><div class="bt-pick ic-pick"></div></section>';
    var pick = host.querySelector('.ic-pick');
    var sel = T.choiceSelect({ label: 'Reaction', options: ctxs.map(function(c, i){ return { value: i, label: M.eqHtml(c.species).replace(/<[^>]+>/g, '') }; }), value: 0, onChange: function(v){ ci = +v; build(); } });
    sel.el.classList.add('bt-inline'); pick.appendChild(sel.el);
    host.querySelector('.ic-new').addEventListener('click', function(){ seed++; build(); });
    host.querySelector('.ic-solve').addEventListener('click', function(){ setX(xs); });
    function build(){
      var c = ctxs[ci], type = c.types.indexOf('findK') > -1 ? 'findK' : c.types[0];
      p = M.ice.generate(M.rng(seed), c, type); sp = p.species;
      xs = p.x;
      // x can run from where a product hits 0 (reverse) to where a reactant does.
      xlo = 0; xhi = Infinity;
      sp.forEach(function(s, i){ if(s.nu < 0) xhi = Math.min(xhi, p.c0[i] / -s.nu); else xlo = Math.max(xlo, -p.c0[i] / s.nu); });
      xhi = M.sig(xhi * 0.999, 3);
      x = 0;
      host.querySelector('.ic-eqn').innerHTML = p.equation + ' &nbsp; ' + (p.Kp ? 'K<sub>p</sub>' : 'K<sub>c</sub>') + ' = ' + M.fmt(p.K, 3);
      host.querySelector('.ic-setup').innerHTML = 'Start: ' + sp.map(function(s, i){ return (p.Kp ? 'P<sub>' + s.html + '</sub>' : '[' + s.html + ']') + ' = ' + M.fmt(p.c0[i], 3) + ' ' + p.unit; }).join(', ') + '. Move x and watch Q.';
      var xh = host.querySelector('.ic-x'); xh.innerHTML = '';
      var step = M.sig(xhi / 200, 1);
      slider = T.slider({ label: 'x, the extent of reaction (' + p.unit + ')', min: 0, max: M.round(Math.floor(xhi / step) * step, 6), step: step, value: 0, decimals: Math.max(2, -Math.floor(Math.log10(step))), onInput: function(v){ x = v; draw(); } });
      xh.appendChild(slider.el);
      if(beaker) beaker.destroy();
      beaker = window.ApChemBeaker.mount(host.querySelector('.ic-beaker'), { species: sp.map(function(s, i){ return { key: 's' + i, label: plain(s.html), name: plain(s.html), tone: i + 1 }; }), readout: 'qk', title: 'The mixture', max: 40, seed: 9 });
      draw();
    }
    function setX(v){ x = v; slider.set(v); draw(); }
    function draw(){
      var E = M.at(sp, p.c0, x), q = M.Q(sp, E), top = Math.max.apply(null, p.c0.concat(M.at(sp, p.c0, xhi), M.at(sp, p.c0, 0))) * 1.15, perP = top / 12;
      host.querySelector('.ic-tab').innerHTML = '<div class="table-wrap" tabindex="0" role="region" aria-label="ICE table"><table class="chem-data cd-ice"><thead><tr><th scope="col">Row</th>' + sp.map(function(s){ return '<th scope="col">' + (p.Kp ? 'P<sub>' + s.html + '</sub>' : '[' + s.html + ']') + '</th>'; }).join('') + '</tr></thead><tbody>' +
        '<tr><th scope="row">I</th>' + p.c0.map(function(v){ return '<td>' + M.fmt(v, 3) + '</td>'; }).join('') + '</tr>' +
        '<tr><th scope="row">C</th>' + sp.map(function(s){ return '<td>' + M.coefText(s.nu) + '</td>'; }).join('') + '</tr>' +
        '<tr class="is-active"><th scope="row">E</th>' + sp.map(function(s, i){ return '<td>' + M.fmt(p.c0[i], 3) + ' ' + (s.nu < 0 ? '−' : '+') + ' ' + (Math.abs(s.nu) > 1 ? Math.abs(s.nu) : '') + 'x<br><b>' + M.fmt(E[i], 3) + '</b></td>'; }).join('') + '</tr></tbody></table></div>';
      var W = 320, H = 170, L = 34, B = 30, Tp = 8, pw = W - L - 8, ph = H - Tp - B, n = sp.length, gw = pw / n, g = [];
      var y = function(v){ return Tp + ph - Math.max(0, Math.min(top, v)) / top * ph; };
      g.push('<line class="axis" x1="' + L + '" x2="' + (L + pw) + '" y1="' + (Tp + ph) + '" y2="' + (Tp + ph) + '"/>');
      for(var i = 0; i < n; i++){
        var cx = L + gw * (i + 0.5), bw = Math.min(30, gw * 0.3);
        g.push('<rect class="ic-bi" x="' + (cx - bw - 3).toFixed(1) + '" y="' + y(p.c0[i]).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (Tp + ph - y(p.c0[i])).toFixed(1) + '"/>');
        g.push('<rect class="ic-be" x="' + (cx + 3).toFixed(1) + '" y="' + y(E[i]).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (Tp + ph - y(E[i])).toFixed(1) + '"/>');
        // The concentration at this x, read straight off the bar (the same value as the E row).
        g.push('<text class="tick" x="' + (cx + 3 + bw / 2).toFixed(1) + '" y="' + (y(E[i]) - 4).toFixed(1) + '" text-anchor="middle">' + M.fmt(E[i], 3) + '</text>');
        g.push('<text class="lbl" x="' + cx.toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(plain(sp[i].html)) + '</text>');
      }
      g.push('<rect class="ic-bi" x="' + L + '" y="2" width="10" height="10"/><text class="tick" x="' + (L + 14) + '" y="11">start</text><rect class="ic-be" x="' + (L + 52) + '" y="2" width="10" height="10"/><text class="tick" x="' + (L + 66) + '" y="11">at this x (M)</text>');
      host.querySelector('.ic-chart').innerHTML = '<svg class="chem-svg ic-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Bars: initial (faint) and at this x (solid): ' + esc(sp.map(function(s, i){ return plain(s.html) + ' ' + M.fmt(p.c0[i], 3) + ' to ' + M.fmt(E[i], 3); }).join('; ')) + '.">' + g.join('') + '</svg>';
      var counts = {}; E.forEach(function(v, i){ counts['s' + i] = Math.round(Math.max(0, v) / perP); });
      beaker.update(q > 0 ? { counts: counts, Q: q, K: p.K } : { counts: counts });
      var r = q / p.K, cl = Math.abs(r - 1) <= 0.01;
      host.querySelector('.ic-why').innerHTML = '<p class="tx-where"><b>' + (q === 0 ? 'x = 0: no products, Q = 0.' : cl ? 'Q = K: this x is the equilibrium.' : r < 1 ? 'Q < K: more x.' : 'Q > K: too far; less x.') + '</b> ' +
        (q === 0 ? 'Nothing has reacted yet, so the forward reaction runs.' : 'Q = ' + p.expr + ' = ' + M.fmt(q, 3) + ' at x = ' + M.fmt(x, 3) + ' ' + p.unit + '. ' + (cl ? 'Every E entry is initial + change with this x; putting them back into the K expression returns K.' : r < 1 ? 'Products are still too low for K: the reaction keeps going forward.' : 'Too much product for K: the real mixture would stop before this x.')) +
        ' K is fixed at this temperature; only Q moves.</p>';
    }
    build();
  }

  function quiz(app, data, M){
    var Q = window.ApChemQuestions, live = null;
    T.drill(app, data, {
      slug: 'ice-table-drills',
      generate: function(r, ctx, type){ return M.ice.generate(r, ctx, type); },
      types: [{ value: 'findK', label: 'Find K' }, { value: 'smallx', label: 'Small K and the 5% check' }, { value: 'square', label: 'Perfect square' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return TITLE[p.type]; },
      extra: function(host, p, api){
        var unit = p.Kp ? 'atm' : 'M';
        host.innerHTML = '<div class="ic-wrap"><div class="table-wrap" tabindex="0" role="region" aria-label="ICE table"><table class="chem-data cd-ice"><caption>ICE table (' + (p.Kp ? 'partial pressures, atm' : 'concentrations, M') + ')</caption><thead><tr><th scope="col">Row</th>' +
          p.species.map(function(s){ return '<th scope="col">' + (p.Kp ? 'P<sub>' + s.html + '</sub>' : '[' + s.html + ']') + '</th>'; }).join('') + '</tr></thead><tbody>' +
          ROWS.map(function(rw){
            return '<tr data-row="' + rw[0] + '"><th scope="row">' + rw[0] + ' <span class="bt-small">' + rw[1] + '</span></th>' + p.species.map(function(s, i){
              return '<td data-i="' + i + '" data-label="' + rw[1] + ' ' + (p.Kp ? 'P ' : '') + plain(s.html) + (rw[0] === 'C' ? ' (in terms of x)' : ' (' + unit + ')') + '"><span class="cd-blank" aria-hidden="true">·</span></td>';
            }).join('') + '</tr>';
          }).join('') + '</tbody></table></div>' +
          '<div class="ic-live"><figure class="ic-bars"><div class="ic-chart"></div><figcaption class="bt-small ic-cap"></figcaption></figure><div class="ic-beaker"></div></div></div>';
        live = view(host, p, M, Q);
        api.area.addEventListener('input', function(e){ if(e.target.classList.contains('cd-cell')) live.read(); });
        live.draw();
      },
      onStep: function(s){ if(live) live.checked(s); }
    });
  }

  function view(host, p, M, Q){
    var F = T.F, esc = T.esc, n = p.species.length, sp = p.species.map(function(s){ return { html: s.html, nu: s.nu }; });
    var rows = { I: arr(), C: arr(), E: arr() }, sure = { I: false, C: false, E: false }, kDone = p.type !== 'findK';
    function arr(){ var a = []; for(var i = 0; i < n; i++) a.push(null); return a; }
    // One scale for the whole problem: the largest amount any row can show.
    var top = Math.max.apply(null, p.c0.concat(p.E)) * 1.15;
    var perP = top / 12;
    var beaker = window.ApChemBeaker.mount(host.querySelector('.ic-beaker'), {
      species: p.species.map(function(s, i){ return { key: 's' + i, label: plain(s.html), name: plain(s.html), tone: i + 1 }; }),
      readout: 'qk', title: 'The mixture', max: 40, seed: 3 });
    function read(){
      ['I', 'C', 'E'].forEach(function(r){
        if(sure[r]) return;
        host.ownerDocument.querySelectorAll('[data-row="' + r + '"] [data-i] input').forEach(function(inp){
          var k = +inp.closest('[data-i]').getAttribute('data-i'), raw = inp.value.trim();
          var x = !raw ? null : r === 'C' ? M.parseCoef(raw) : Q.parseNumber(raw.replace(/\s/g, ''));
          rows[r][k] = raw && isFinite(x) ? x : null;
        });
      });
      draw();
    }
    function checked(s){
      if(s.kind === 'row' || s.kind === 'coef'){ rows[s.row] = s.cells.map(function(c){ return c.answer; }); sure[s.row] = true; }
      if(s.key === 'K') kDone = true;
      draw();
    }
    function draw(){
      var W = 320, H = 190, L = 34, B = 34, Tp = 14, pw = W - L - 8, ph = H - Tp - B, gw = pw / n;
      var y = function(v){ return Tp + ph - Math.max(0, Math.min(top, v)) / top * ph; };
      var g = [], tick = top > 1 ? M.round(top / 2, 1) : M.sig(top / 2, 1);
      g.push('<line class="axis" x1="' + L + '" x2="' + (L + pw) + '" y1="' + (Tp + ph) + '" y2="' + (Tp + ph) + '"/>');
      [0, tick].forEach(function(v){ g.push('<text class="tick" x="' + (L - 4) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + M.fmt(v, 2) + '</text><line class="grid" x1="' + L + '" x2="' + (L + pw) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/>'); });
      var say = [];
      for(var i = 0; i < n; i++){
        var x0 = L + gw * i, bw = Math.min(30, gw * 0.3), cx = x0 + gw / 2;
        var I = rows.I[i], E = rows.E[i], C = rows.C[i];
        if(I != null) g.push('<rect class="ic-bi' + (sure.I ? '' : ' is-typed') + '" x="' + (cx - bw - 3).toFixed(1) + '" y="' + y(I).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (Tp + ph - y(I)).toFixed(1) + '"/>');
        if(E != null) g.push('<rect class="ic-be' + (sure.E ? '' : ' is-typed') + '" x="' + (cx + 3).toFixed(1) + '" y="' + y(E).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (Tp + ph - y(E)).toFixed(1) + '"/>');
        if(C != null && C !== 0) g.push('<text class="ic-arrow ' + (C > 0 ? 'up' : 'down') + '" x="' + cx.toFixed(1) + '" y="' + (Tp + 12) + '" text-anchor="middle">' + (C > 0 ? '▲ ' : '▼ ') + esc(M.coefText(C)) + '</text>');
        g.push('<text class="lbl" x="' + cx.toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle">' + esc(plain(p.species[i].html)) + '</text>');
        say.push(plain(p.species[i].html) + ': ' + (I != null ? 'initial ' + M.fmt(I, 3) : 'initial not typed') + (C != null ? ', change ' + M.coefText(C) : '') + (E != null ? ', equilibrium ' + M.fmt(E, 3) : ''));
      }
      var label = 'Bar chart of ' + (p.Kp ? 'partial pressures in atm' : 'concentrations in M') + ', initial (faint) and equilibrium (solid): ' + say.join('; ') + '.';
      host.querySelector('.ic-chart').innerHTML = '<svg class="chem-svg ic-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + g.join('') + '</svg>';
      // The beaker and the gauge: E row once it is complete, else the I row.
      var useE = rows.E.every(function(v){ return v != null; }), src = useE ? rows.E : rows.I, full = src.every(function(v){ return v != null; });
      var counts = {}; src.forEach(function(v, i){ counts['s' + i] = v != null ? Math.round(Math.max(0, v) / perP) : 0; });
      var q = full && src.every(function(v){ return v >= 0; }) ? M.Q(sp, src) : NaN;
      var showK = kDone && isFinite(q) && q > 0;
      var st = { counts: counts };
      if(showK){ st.Q = q; st.K = p.K; }
      beaker.update(st);
      var cap = host.querySelector('.ic-cap'), r = showK ? q / p.K : NaN;
      cap.innerHTML = (useE ? (sure.E ? 'Equilibrium row checked. ' : 'Your E row so far. ') : 'Initial row. ') +
        (!full ? 'Fill the row to see Q.' : !kDone ? 'Q of this row = ' + M.fmt(q, 3) + '. K is what you are finding.' :
          !isFinite(q) || q === 0 ? 'No products yet: Q = 0, far below K = ' + M.fmt(p.K, 2) + ', so the reaction runs forward.' :
          'Q = ' + M.fmt(q, 3) + ' vs K = ' + M.fmt(p.K, 3) + (Math.abs(r - 1) <= 0.01 ? ': they match, so this row is at equilibrium.' : Math.abs(r - 1) <= 0.04 ? ': within ' + F(100 * Math.abs(r - 1), 1) + '%, which is the rounding of a three-figure row, so this is the equilibrium.' : r < 1 ? ': Q is still below K' + (useE ? ', so these numbers are not yet the equilibrium.' : '.') : ': Q is above K' + (useE ? ', so too much product: recheck x or the signs.' : '.'))) +
        ' One particle ≈ ' + M.fmt(perP, 2) + ' ' + (p.Kp ? 'atm' : 'M') + '.';
    }
    return { read: read, checked: checked, draw: draw };
  }
})();
