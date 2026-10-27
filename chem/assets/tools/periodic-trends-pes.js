/* Trainer: periodic trends and photoelectron spectra (Unit 1, topics 1.5-1.7).
   Job: see a trend across the whole table, then explain any one comparison
   with Coulomb's law, and read an atom's photoelectron spectrum.

   Explore: a periodic table colored by the chosen trend (atomic radius,
   first ionization energy, electronegativity, electron affinity; measured
   values from the data file, sources in its "sources" field). Phones open
   on the main groups (the eight columns the exam asks about), with the
   transition metals one tap away. Tap an element: its photoelectron
   spectrum (H to Kr; peaks labeled by subshell, heights = electrons), its
   configuration, a shell picture and the rough effective nuclear charge.
   "Compare" picks a second element and gives the reasoning that names both
   atoms, or says why the data break the simple rule (the ionization dips,
   fluorine's electron affinity, gallium's radius). "Across and down" draws
   the selected element's period and group as bars.

   Test yourself: seeded predict-then-reveal problems
   (ApChemMath.trends.generate): which is larger or higher and the
   explanation that earns the point, the ionization dips, ions, identify the
   element from its spectrum, and compare two spectra. Checked by
   ApChemTools.drill; problem codes (?seed=) open here. */
(function(){
  'use strict';
  var T = window.ApChemTools;
  if(!T) return;
  T.mount('periodic-trends-pes', function(app, data){
    var M = window.ApChemMath;
    var ex = null;
    T.modes(app, { slug: 'periodic-trends-pes', labels: ['Explore the table', 'Test yourself'], explore: function(h){ ex = explore(h, data, M); }, quiz: function(h){ quiz(h, data, M); },
      studio: { explore: function(pane, s){ if(ex) ex.studio(pane, s); } } });
  });

  var KEYS = ['r', 'ie', 'en', 'ea'];
  // Ground states that break the Aufbau order (NIST), main table: the CED
  // excludes them from testing; the page says so when one is chosen.
  var AUFBAU_X = [24, 29, 41, 42, 44, 45, 46, 47, 78, 79, 103];
  // Heavy p-block metals whose measured (metallic) radii run against the
  // across-a-period trend: In < Sn and Tl < Pb < Bi. The values are right for
  // their source (see "sources"), but coloring them on the same scale tells a
  // student the trend fails there, so on the radius table they are greyed out
  // and explained instead (audit 2026-10).
  var ODD_R = [49, 50, 81, 82, 83];
  var ODD_R_WHY = 'Indium, tin, thallium, lead and bismuth are greyed out on the radius table. Their radii are measured in the solid metal, where the atoms bond and pack in different ways from one metal to the next, so the numbers do not fall smoothly across the period (indium comes out smaller than tin, thallium smaller than lead). Test yourself never asks you to compare two elements where the data break the rule. Ionization energy still rises across from indium to tin to antimony and from thallium to lead; the heaviest elements have other exceptions too (bismuth comes out just below lead).';
  var LABEL = { r: 'Atomic radius', ie: 'Ionization energy', en: 'Electronegativity', ea: 'Electron affinity' };
  var SHORT = { r: 'Radius', ie: 'Ionization', en: 'Electroneg.', ea: 'Electron aff.' };
  function valText(el, key, unit){
    var v = el[key];
    if(key === 'ea' && v == null && el.ie != null) return 'no stable anion';
    if(v == null) return key === 'r' && el.g === 18 ? 'not compared' : 'no data';
    var s = key === 'en' ? v.toFixed(2) : key === 'ea' && v < 10 ? String(v) : String(Math.round(v));
    return s + (unit === false ? '' : key === 'r' ? ' pm' : key === 'en' ? '' : ' kJ/mol');
  }

  /* ------------------------------------------------------------ explore */
  function explore(host, data, M){
    var TR = M.trends, esc = T.esc, els = data.elements, byZ = {}, bySym = {};
    els.forEach(function(e){ byZ[e.z] = e; bySym[e.s] = e; });
    var LS = null, SP = null;
    function $(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); }
    var key = 'r', sel = byZ[11], other = null, comparing = false, full = false, view = 'pes', narrowView = 'table';
    // Under 1000 px the table and the spectrum take turns on the stage (a
    // phone cannot show both at a readable size); wider, they sit side by side.
    var mqN = null; try{ mqN = matchMedia('(max-width: 999.98px)'); }catch(e){}
    function narrow(){ return !!(mqN && mqN.matches); }
    if(mqN && mqN.addEventListener) mqN.addEventListener('change', function(){ draw(); });
    try{ full = matchMedia('(min-width: 700px)').matches; }catch(e){}
    host.innerHTML = '<section class="bt-problem ptx-card" aria-labelledby="ptx-h"><h2 id="ptx-h" class="sr-only">Periodic table colored by a trend</h2>' +
      '<div class="ptx-stage" data-v="table"><div class="ptx-tabs" role="group" aria-label="What to show">' +
      '<button type="button" class="ptx-tab ptx-tab-t" data-v="table" aria-pressed="true">Table</button><button type="button" class="ptx-tab" data-v="pes" aria-pressed="false">Spectrum</button><button type="button" class="ptx-tab" data-v="bars" aria-pressed="false">Across and down</button></div>' +
      '<div class="ptx-tablebox"><div class="ptx-table"></div><div class="ptx-legend"></div></div><div class="ptx-panel"><div class="ptx-view"></div></div></div>' +
      '<div class="ptx-ctl"><div class="ptx-keys" role="group" aria-label="Trend to show">' + KEYS.map(function(k){ return '<button type="button" class="ptx-key" data-k="' + k + '" aria-pressed="' + (k === key) + '">' + LABEL[k] + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="bt-btn ptx-cmp" aria-pressed="false">Compare two elements</button></div>' +
      '<div class="ptx-why"></div><div class="ptx-el"></div>' +
      T.moreHtml('<div class="bt-ctl ptx-opt"><label class="bt-radio"><input type="checkbox" class="ptx-full"' + (full ? ' checked' : '') + '> Show the transition metals and periods 6 and 7</label></div>' +
        '<div class="bt-ctl ptx-opt"><label class="bt-radio"><input type="checkbox" class="ptx-vals" checked> Show values on the table</label></div>' +
        '<div class="ptx-src bt-small"></div>', 'more of the table, values, sources') + '</section>';
    var start = T.cue('Pick a trend, then tap an element to see its spectrum.');
    host.querySelector('.ptx-ctl').insertBefore(start.el, host.querySelector('.ptx-keys'));
    var showVals = true;
    host.querySelectorAll('.ptx-key').forEach(function(b){ b.addEventListener('click', function(){ key = b.getAttribute('data-k'); start.done(); draw(); }); });
    host.querySelector('.ptx-cmp').addEventListener('click', function(){ comparing = !comparing; if(!comparing) other = null; else if(narrow()){ narrowView = 'table'; } draw(); });
    host.querySelector('.ptx-full').addEventListener('change', function(e){ full = e.target.checked; if(!full && !TR.mainGroup(sel) && sel.z !== 1) sel = byZ[11]; draw(); });
    host.querySelector('.ptx-vals').addEventListener('change', function(e){ showVals = e.target.checked; draw(); });
    function setView(v){ if(v !== 'table') view = v; narrowView = v; draw(); }
    host.querySelectorAll('.ptx-tab').forEach(function(b){ b.addEventListener('click', function(){ setView(b.getAttribute('data-v')); }); });
    host.querySelector('.ptx-src').innerHTML = '<b>Where the numbers come from.</b> ' + Object.keys(data.sources || {}).filter(function(k){ return k !== 'ions'; }).map(function(k){ return esc(data.sources[k]); }).join(' ');

    function cols(){ return full ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] : [1, 2, 13, 14, 15, 16, 17, 18]; }
    function periods(){ return full ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6]; }
    function shown(){ var c = cols(), p = periods(); return els.filter(function(e){ return e.g != null && c.indexOf(e.g) > -1 && p.indexOf(e.p) > -1; }); }
    function scale(){
      var v = shown().map(function(e){ return e[key]; }).filter(function(x){ return x != null; });
      var lo = key === 'ea' ? 0 : Math.min.apply(null, v), hi = Math.max.apply(null, v);
      return { lo: lo, hi: hi, t: function(x){ return Math.max(0, Math.min(1, (x - lo) / (hi - lo || 1))); } };
    }
    /* The table: one SVG, cells as buttons (Enter/Space selects, arrows move). */
    function tableSvg(){
      // Main groups: cells a little wider than tall, so six periods, the
      // legend and the spectrum fit one phone stage.
      var c = cols(), p = periods(), cw = full ? 40 : 46, ch = full ? 46 : 48, gap = 3, W = c.length * (cw + gap) + 4, H = p.length * (ch + gap) + 18, sc = scale();
      var g = [];
      c.forEach(function(gr, i){ g.push('<text class="ptx-gn" x="' + (2 + i * (cw + gap) + cw / 2) + '" y="11" text-anchor="middle">' + gr + '</text>'); });
      shown().forEach(function(e){
        var i = c.indexOf(e.g), j = p.indexOf(e.p), x = 2 + i * (cw + gap), y = 20 + j * (ch + gap), v = e[key], odd = key === 'r' && ODD_R.indexOf(e.z) > -1, t = v == null || odd ? null : sc.t(v);
        var cls = 'ptx-cell' + (odd ? ' is-odd' : t == null ? ' is-none' : t > 0.55 ? ' is-dark' : '') + (e === sel ? ' is-sel' : '') + (e === other ? ' is-other' : '');
        var vt = v == null ? (key === 'ea' && e.ie != null ? 'none' : '–') : key === 'en' ? v.toFixed(1) : Math.round(v);
        g.push('<g class="' + cls + '" data-z="' + e.z + '" role="button" tabindex="' + (e === sel ? 0 : -1) + '" aria-pressed="' + (e === sel || e === other) + '" aria-label="' + esc(e.n + ', ' + LABEL[key].toLowerCase() + ' ' + valText(e, key)) + '">' +
          '<rect x="' + x + '" y="' + y + '" width="' + cw + '" height="' + ch + '" rx="7"' + (t == null ? '' : ' style="--t:' + t.toFixed(3) + '"') + '/>' +
          (full ? '<text class="ptx-z" x="' + (x + 4) + '" y="' + (y + 10) + '">' + e.z + '</text>' : '') +
          '<text class="ptx-s" x="' + (x + cw / 2) + '" y="' + (y + (showVals ? ch * (full ? 0.56 : 0.52) : ch * 0.64)) + '" text-anchor="middle">' + e.s + '</text>' +
          (showVals ? '<text class="ptx-v" x="' + (x + cw / 2) + '" y="' + (y + ch - (full ? 6 : 5)) + '" text-anchor="middle">' + vt + '</text>' : '') + '</g>');
      });
      if(full){ var x6 = 2 + 2 * (cw + gap); [[6, '57–71'], [7, '89–103']].forEach(function(r){ var y6 = 16 + p.indexOf(r[0]) * (ch + gap); g.push('<g class="ptx-cell is-gap" aria-hidden="true"><rect x="' + x6 + '" y="' + y6 + '" width="' + cw + '" height="' + ch + '" rx="7"/><text class="ptx-v" x="' + (x6 + cw / 2) + '" y="' + (y6 + ch / 2 + 4) + '" text-anchor="middle">' + r[1] + '</text></g>'); }); }
      return '<svg class="chem-svg ptx-svg' + (full ? ' is-full' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Periodic table, groups numbered across the top, colored by ' + LABEL[key].toLowerCase() + ': darker means ' + (key === 'r' ? 'larger' : 'higher') + '. Use the arrow keys to move, Enter to choose.">' + g.join('') + '</svg>';
    }
    function legend(){
      var sc = scale(), u = key === 'r' ? ' pm' : key === 'en' ? '' : ' kJ/mol', f = function(x){ return key === 'en' ? x.toFixed(1) : Math.round(x); };
      return '<span class="ptx-lg-k">' + LABEL[key] + (key === 'ea' ? ' (energy released)' : '') + '</span><span class="ptx-lg-bar" aria-hidden="true"></span><span class="ptx-lg-n">' + f(sc.lo) + '</span><span class="ptx-lg-n is-hi">' + f(sc.hi) + u + '</span>' +
        (key === 'ea' || key === 'r' || key === 'en' ? '<span class="ptx-lg-none"><i aria-hidden="true"></i>' + (key === 'ea' ? 'no stable anion' : key === 'r' ? 'noble gases: no comparable radius' : 'no value') + '</span>' : '') +
        (key === 'r' ? '<span class="ptx-lg-none ptx-lg-odd"><i aria-hidden="true"></i>In, Sn, Tl, Pb, Bi: measured radii break the trend (tap one)</span>' : '');
    }
    /* Across and down: the selected element's period and group as bars. */
    function barsSvg(){
      var narrowB = narrow(), key2 = key, row = els.filter(function(e){ return e.p === sel.p && e.g != null && (full || TR.mainGroup(e)); }).sort(function(a, b){ return a.g - b.g; });
      var col = sel.g == null ? [] : els.filter(function(e){ return e.g === sel.g && e.p <= 6; }).sort(function(a, b){ return a.p - b.p; });
      function chart(list, title, w){
        var vals = list.map(function(e){ return e[key2]; }).filter(function(v){ return v != null; }), mx = Math.max.apply(null, vals.concat([1]));
        var H = narrowB ? 128 : 170, B = 30, T0 = 34, bw = Math.min(30, (w - 10) / Math.max(1, list.length) - 4), p = ['<text class="ptx-bt" x="4" y="14">' + title + '</text>'];
        list.forEach(function(e, i){
          var v = e[key2], x = 6 + i * ((w - 10) / list.length) + ((w - 10) / list.length - bw) / 2, h = v == null ? 0 : (H - B - T0) * v / mx, y = H - B - h;
          p.push('<g class="ptx-bar' + (e === sel ? ' is-sel' : '') + (e === other ? ' is-other' : '') + '"><rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0, h).toFixed(1) + '" rx="3"/>' +
            (v == null ? '<text class="ptx-bv" x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - B - 4) + '" text-anchor="middle">–</text>' : '<text class="ptx-bv" x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 3).toFixed(1) + '" text-anchor="middle">' + (key2 === 'en' ? v.toFixed(1) : Math.round(v)) + '</text>') +
            '<text class="ptx-bs" x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - B + 14) + '" text-anchor="middle">' + e.s + '</text></g>');
        });
        p.push('<line class="ptx-ba" x1="4" x2="' + (w - 4) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/>');
        return '<svg class="chem-svg ptx-bars" viewBox="0 0 ' + w + ' ' + H + '" role="img" aria-label="' + esc(title + ': ' + list.map(function(e){ return e.s + ' ' + valText(e, key2); }).join(', ')) + '">' + p.join('') + '</svg>';
      }
      return '<div class="ptx-bars2">' + chart(row, 'Across period ' + sel.p, Math.max(260, row.length * 30)) + (col.length > 1 ? chart(col, 'Down group ' + sel.g, 260) : '') + '</div>' +
        '<p class="ptx-cap bt-small">' + LABEL[key] + (key === 'r' ? ' (pm)' : key === 'en' ? ' (Pauling)' : ' (kJ/mol)') + '. A dash: ' + (key === 'ea' ? 'no stable anion.' : 'no comparable value.') + '</p>';
    }
    function elBlock(e){
      var conf = TR.parseConf(e.conf), core = TR.coreCount(e), n = TR.outerShell(e);
      var rows = KEYS.map(function(k){ return '<tr' + (k === key ? ' class="hl"' : '') + '><th scope="row">' + LABEL[k] + '</th><td class="r">' + valText(e, k) + (k === 'r' && e.rk ? ' <span class="bt-small">(' + (e.rk === 'm' ? 'metallic' : 'covalent') + ')</span>' : '') + (k === 'ea' && e.eaEst ? ' <span class="bt-small">(estimate)</span>' : '') + '</td></tr>'; }).join('');
      return '<h3 class="ls-title-l ptx-elh">' + esc(e.n) + ' <span class="ptx-sym">' + e.s + '</span></h3>' +
        '<p class="ptx-conf"><b>' + TR.confHtml(e.conf) + '</b>' + (/\[/.test(e.conf) ? ' <span class="bt-small">= ' + conf.map(function(x){ return x[0] + '<sup>' + x[1] + '</sup>'; }).join(' ') + '</span>' : '') + '</p>' +
        (AUFBAU_X.indexOf(e.z) > -1 ? '<p class="bt-small ptx-exc">This configuration is an exception to the usual filling order (measured, not predicted). The exam does not ask for exceptions like this one.</p>' : '') +
        '<div class="ptx-elrow"><div class="ptx-shell">' + TR.shellSvg(e, { size: 200 }) + '<p class="bt-small">Shells, schematic: not to scale.</p></div>' +
        '<table class="ls-tbl ptx-tbl"><caption class="sr-only">' + esc(e.n) + ' in numbers</caption><tbody>' +
        '<tr><th scope="row">Protons</th><td class="r">' + e.z + '</td></tr>' +
        '<tr><th scope="row">Core electrons</th><td class="r">' + core + '</td></tr>' +
        '<tr><th scope="row">Outer shell</th><td class="r">n = ' + n + '</td></tr>' +
        (TR.mainGroup(e) ? '<tr><th scope="row">Effective nuclear charge, rough</th><td class="r">+' + TR.zeffRough(e) + '</td></tr>' : '') + rows + '</tbody></table></div>' +
        (TR.mainGroup(e) ? '<p class="bt-small">Rough effective nuclear charge = protons − core electrons, the estimate the exam uses. Real values are lower: outer electrons also shield each other a little.</p>'
          : '<p class="bt-small">The rough effective nuclear charge (protons − core electrons) is used for main-group atoms only: in a transition metal the d electrons are partly inner and partly outer, so the simple count does not work.</p>');
    }
    /* What the picture says, in words: the trend for one element, or the
       comparison of two (the reasoning that earns the point, or why the data
       break the simple rule). */
    function exception(a, b){
      var z = [a.z, b.z].sort(function(x, y){ return x - y; }).join('-'), K = key;
      if(K === 'ie' && /^(4-5|12-13|30-31|20-31|38-49|48-49)$/.test(z)) return 'The higher-Z atom loses its electron from a p subshell, which is higher in energy than the filled s subshell and partly shielded by it, so it is easier to remove.';
      if(K === 'ie' && /^(7-8|15-16|33-34|51-52)$/.test(z)) return 'The higher-Z atom has a p⁴ subshell: two of its p electrons share one orbital, and their repulsion makes one of them easier to remove.';
      var lo2 = a.p === 2 ? a : b.p === 2 ? b : null, hi3 = lo2 === a ? b : a;
      if(K === 'ea' && lo2 && hi3.p === 3 && a.g === b.g && lo2.ea != null && hi3.ea != null && lo2.ea < hi3.ea) return lo2.n + ' is a small atom: an added electron goes into shell 2, crowded close to the electrons already there. That electron-electron repulsion cancels part of the attraction to the nucleus, so less energy is released than for ' + hi3.n.toLowerCase() + ', whose added electron goes into the larger shell 3. The same happens for every period 2 element against the one below it (B and Al, C and Si, O and S, F and Cl).';
      if(K === 'ea' && /^(9-17)$/.test(z)) return 'Fluorine is so small that an added electron is crowded in with the other seven in shell 2; the electron-electron repulsion makes less energy released than for chlorine.';
      if(K === 'ea' && (a.ea == null || b.ea == null)) return (a.ea == null ? a : b).n + ' does not form a stable anion: an added electron would have to go into a new, higher-energy subshell' + ((a.ea == null ? a : b).g === 15 ? ' or pair up in a half-filled p subshell' : '') + '.';
      if(K === 'ea' && (a.g === 15 || b.g === 15)) return 'Nitrogen-group atoms have half-filled p subshells; an added electron must pair up, and the repulsion lowers the energy released.';
      if(K === 'r' && /^(49-50|81-82|50-51|82-83|81-83|49-51)$/.test(z)) return ODD_R_WHY + ' (Sb and Te are measured as covalent radii, not metallic, so a step from a metal to them also mixes two kinds of radius.)';
      if(K === 'r' && /^(13-31)$/.test(z)) return 'Gallium comes after the ten 3d electrons. d electrons shield poorly, so gallium\'s outer electrons feel a larger effective nuclear charge than the simple group trend expects, and gallium ends up slightly smaller than aluminum.';
      if(K === 'ie' && /^(13-31|31-49)$/.test(z)) return 'The poorly shielding d electrons before gallium (and indium) raise the effective nuclear charge, so the simple down-a-group drop does not hold here.';
      return 'The simple rule is a guide; here other effects (subshells, paired electrons, poorly shielding d electrons) are larger than the trend.';
    }
    function sayText(){
      var P = TR.PROP[key];
      if(comparing && other){
        var a = sel, b = other, va = a[key], vb = b[key];
        if(va == null || vb == null) return { head: '<b>' + a.s + ' ' + valText(a, key) + ', ' + b.s + ' ' + valText(b, key) + '.</b>', body: '<p>' + exception(a, b) + '</p>' };
        if(va === vb) return { head: '<b>Same value:</b> ' + a.s + ' and ' + b.s + ' are both ' + valText(a, key) + '.', body: '<p>The measured values are equal to the precision given' + (key === 'en' ? ' (Pauling electronegativities are rounded to two decimal places)' : '') + '. When two values tie, explain the comparison with Coulomb\'s law anyway: outer shell n = ' + TR.outerShell(a) + ' vs ' + TR.outerShell(b) + ', rough effective nuclear charge +' + TR.zeffRough(a) + ' vs +' + TR.zeffRough(b) + '; here the effects cancel.</p>' };
        var big = va > vb ? a : b, small = big === a ? b : a, rule = TR.ruleSays(a, b, key), sameCore = TR.coreCount(a) === TR.coreCount(b);
        if(key === 'r' && a.rk === 'c' && b.rk === 'c' && Math.abs(va - vb) <= 2) return { head: '<b>About the same:</b> ' + a.s + ' ' + valText(a, key) + ', ' + b.s + ' ' + valText(b, key) + '.', body: '<p>These are covalent radii: half the length of a single bond between two of the atoms. A bond\'s length also depends on what else the atoms are doing, so neighbors can come out within a picometer or two of each other, or even slightly reversed. ' + (rule ? 'The trend across the period still holds over several elements: ' + TR.why(a, b, key) : '') + '</p>' };
        var head = '<b>' + big.s + ' ' + (key === 'r' ? 'is larger' : 'is higher') + ':</b> ' + big.s + ' ' + valText(big, key) + ', ' + small.s + ' ' + valText(small, key) + '.';
        if(rule && rule !== big) return { head: head + ' An exception.', body: '<p>The across/down rule predicts ' + rule.s + '. ' + exception(a, b) + '</p>' };
        if(rule && (a.g === b.g || sameCore)) return { head: head, body: '<p>' + TR.why(a, b, key) + '</p><p class="bt-small">This is the explanation that earns the point: both atoms, the protons, the shell (distance) and the core electrons (shielding).</p>' };
        return { head: head, body: '<p>' + a.s + ' and ' + b.s + ' are not in one period or one group of the main groups' + (a.p === b.p && !sameCore ? ' (or their cores differ: ' + TR.coreCount(a) + ' vs ' + TR.coreCount(b) + ' core electrons)' : '') + ', so the simple rule does not decide this one. Compare them with Coulomb\'s law: outer shell n = ' + TR.outerShell(a) + ' vs ' + TR.outerShell(b) + ', rough effective nuclear charge +' + TR.zeffRough(a) + ' vs +' + TR.zeffRough(b) + '.</p>' };
      }
      if(comparing) return { head: '<b>Tap a second element</b> to compare it with ' + sel.n + '.', body: '' };
      var e = sel, v = valText(e, key);
      var row = els.filter(function(x){ return x.p === e.p && TR.mainGroup(x) && x[key] != null; }).sort(function(a, b){ return a.g - b.g; });
      var col = e.g ? els.filter(function(x){ return x.g === e.g && x.p <= 6 && x[key] != null; }).sort(function(a, b){ return a.p - b.p; }) : [];
      var span = function(l){ return l.length > 1 ? l[0].s + ' ' + valText(l[0], key) + ' to ' + l[l.length - 1].s + ' ' + valText(l[l.length - 1], key) : ''; };
      var cause = key === 'r' ? 'Across a period each element adds a proton but no shell, so the larger effective nuclear charge pulls the outer shell closer. Down a group each element adds a shell, so the outer electrons are farther out.'
        : key === 'ie' ? 'Across a period the effective nuclear charge rises at about the same distance, so the outer electron is held more tightly. Down a group the outer electron is in a higher shell, farther out and better shielded, so it is easier to remove.'
        : key === 'en' ? 'Electronegativity follows the same pull: a large effective nuclear charge acting at a short distance attracts bonding electrons strongly (fluorine), a small one at a long distance weakly (cesium).'
        : 'An added electron is attracted by the effective nuclear charge; more energy is released where that pull is strong and close (the halogens). Atoms whose next electron must start a new subshell or pair up release little or none, so this trend is the least regular.';
      if(key === 'r' && ODD_R.indexOf(e.z) > -1) cause = ODD_R_WHY + ' ' + cause;
      return { head: '<b>' + esc(e.n) + ': ' + LABEL[key].toLowerCase() + ' ' + v + '.</b>', body: '<p>' + (row.length > 1 ? 'Across period ' + e.p + ': ' + span(row) + '. ' : '') + (col.length > 1 ? 'Down group ' + e.g + ': ' + span(col) + '. ' : '') + '</p><p>' + cause + '</p>' +
        (e.pes ? '<p>Its spectrum has ' + e.pes.length + ' peak' + (e.pes.length === 1 ? '' : 's') + ', one per occupied subshell. The left-most (' + e.pes[0][0] + ', ' + e.pes[0][1] + ' MJ/mol) is the most tightly held; the right-most (' + e.pes[e.pes.length - 1][0] + ', ' + e.pes[e.pes.length - 1][1] + ' MJ/mol) is the first ionization energy, ' + e.ie + ' kJ/mol. Heights count electrons: ' + e.pes.map(function(p){ return p[2]; }).join(', ') + '.</p>' : '') };
    }
    function draw(){
      $$('.ptx-key').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === key)); });
      var cmp = $('.ptx-cmp'); cmp.setAttribute('aria-pressed', String(comparing)); cmp.textContent = comparing ? (other ? 'Done comparing' : 'Cancel compare') : 'Compare two elements';
      $('.ptx-table').innerHTML = tableSvg();
      $('.ptx-stage').classList.toggle('is-full', full);
      $('.ptx-legend').innerHTML = legend();
      var pv = $('.ptx-view');
      var cur = narrow() ? narrowView : view;
      $('.ptx-stage').setAttribute('data-v', cur);
      $$('.ptx-tab').forEach(function(b){ var v = b.getAttribute('data-v'); b.setAttribute('aria-pressed', String(v === cur)); if(v === 'pes') b.textContent = sel.s + ' spectrum'; });
      // The spectrum fills its box on a phone (T.fitBox), so its labels keep
      // their size; the shell picture sits beside or under it.
      var head = '<figcaption class="ptx-pesh"><b>' + esc(sel.n) + '</b> ' + TR.confHtml(sel.conf) + '</figcaption>';
      var fb = T.fitBox(pv, 560, 236, { w: 300, h: 200 }), ph = fb.fit ? Math.max(200, Math.min(fb.h * 0.62, 340)) : full ? 200 : 300;
      pv.innerHTML = view === 'bars' ? barsSvg() : sel.pes ? '<figure class="ptx-pes">' + head + TR.pesSvg(sel, { w: fb.fit ? fb.w : 560, h: ph }) + '</figure>' +
          '<div class="ptx-shellrow">' + TR.shellSvg(sel, { size: 180 }) + '<p class="bt-small">Tap a peak or an electron to match a subshell in both pictures. Shell picture: schematic, not to scale. ' + (sel.pes.length > 1 ? 'Each peak is one subshell; its height is the number of electrons in it.' : '') + '</p></div>'
        : '<p class="ptx-nopes"><b>' + esc(sel.n) + '</b> ' + TR.confHtml(sel.conf) + '<br>Spectra are drawn for hydrogen to krypton, the atoms the exam uses. Pick one of those to see its peaks.</p>';
      var w = sayText();
      T.explain($('.ptx-why'), w.head, w.body);
      $('.ptx-el').innerHTML = elBlock(sel);
      wire();
      if(LS) studioDraw(w);
    }
    function $$(s){ var a = [].slice.call(host.querySelectorAll(s)); return LS ? a.concat([].slice.call(LS.root.querySelectorAll(s))) : a; }
    function pick(e){
      if(!e) return;
      start.done();
      if(comparing && e !== sel){ other = e; if(narrow()) narrowView = view === 'pes' && !(sel.pes && e.pes) ? 'bars' : view; }
      else { sel = e; other = null; if(narrow()){ narrowView = view; } }
      draw();
      var c = $('.ptx-cell[data-z="' + (comparing && other ? other.z : sel.z) + '"]'); if(c && c.getBoundingClientRect().width && document.activeElement && document.activeElement.closest && document.activeElement.closest('.ptx-svg')) c.focus();
      if(narrow() && narrowView !== 'table'){ var tb = $('.ptx-tab[data-v="table"]'); if(tb && document.activeElement && document.activeElement.closest && document.activeElement.closest('.ptx-svg')) tb.focus(); }
    }
    function wire(){
      var svg = $('.ptx-svg'); if(!svg) return;
      svg.addEventListener('click', function(ev){ var g = ev.target.closest('.ptx-cell[data-z]'); if(g) pick(byZ[+g.getAttribute('data-z')]); });
      svg.addEventListener('keydown', function(ev){
        var g = ev.target.closest('.ptx-cell[data-z]'); if(!g) return;
        var e = byZ[+g.getAttribute('data-z')];
        if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); pick(e); return; }
        var c = cols(), dc = { ArrowLeft: -1, ArrowRight: 1 }[ev.key] || 0, dp = { ArrowUp: -1, ArrowDown: 1 }[ev.key] || 0;
        if(!dc && !dp) return;
        ev.preventDefault();
        var list = shown(), ci = c.indexOf(e.g), p = e.p, nx = null;
        for(var k = 1; k < 18 && !nx; k++){
          var tg = c[ci + dc * k], tp = p + dp * k;
          nx = list.filter(function(x){ return dc ? (x.p === p && x.g === tg) : (x.g === e.g && x.p === tp); })[0] || null;
          if(dc && tg == null) break;
          if(dp && (tp < 1 || tp > 7)) break;
        }
        if(nx){ g.setAttribute('tabindex', '-1'); var n2 = svg.querySelector('.ptx-cell[data-z="' + nx.z + '"]'); n2.setAttribute('tabindex', '0'); n2.focus(); }
      });
      // Tap a peak or an electron: highlight that subshell in both pictures.
      $$('.pes-pk, .sh-e').forEach(function(n){ n.addEventListener('click', function(){ var s = n.getAttribute('data-sub'); $$('[data-sub]').forEach(function(m){ m.classList.toggle('is-mark', m.getAttribute('data-sub') === s); }); }); });
    }
    /* Tool Studio: the trend and the selected element as pills, the verdict
       as the caption; the element card in Details. */
    function studioDraw(w){
      LS.pills([{ k: sel.s, html: valText(sel, key), tone: 'readout' }].concat(other ? [{ k: other.s, html: valText(other, key), tone: 'ghost' }] : []), 'left', 'explore');
      LS.pills([{ html: comparing ? (other ? 'Comparing' : 'Pick a second') : LABEL[key], tone: comparing ? 'accent' : 'ghost' }], 'right', 'explore');
      LS.caption(T.sayHead($('.ptx-why')), 'explore');
      SP.setup(full ? 'Whole table' : 'Main groups');
      SP.open();
    }
    function studio(pane, s){
      LS = s;
      $('.ptx-cmp').classList.add('ls-btn');
      SP = T.studioPane(pane, s, { stage: [$('.ptx-stage')], dock: [$('.ptx-keys'), $('.ptx-cmp')], setup: 'Table', moreLabel: 'More of the table, values on the cells, sources',
        why: [$('.ptx-why')], details: [$('.ptx-el')] });
      draw();
      T.watchBox($('.ptx-view'), draw);
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.ptx-cell.is-sel'), text: 'Tap any element' });
    }
    draw();
    return { studio: studio };
  }

  /* --------------------------------------------------------------- quiz */
  function quiz(app, data, M){
    var TR = M.trends, byZ = {};
    data.elements.forEach(function(e){ byZ[e.z] = e; });
    T.drill(app, data, {
      slug: 'periodic-trends-pes',
      generate: function(r, ctx){ return TR.generate(r, ctx, data.elements, data.ions); },
      types: [{ value: 'radius', label: 'Atomic radius' }, { value: 'ie', label: 'Ionization energy' }, { value: 'ie-dip', label: 'Ionization energy dips' }, { value: 'en', label: 'Electronegativity' },
        { value: 'ion', label: 'Ions' }, { value: 'pes-id', label: 'Identify from a spectrum' }, { value: 'pes-cmp', label: 'Compare two spectra' }],
      typeLabel: 'Kind of question',
      title: function(p){ return p.type === 'pes-id' ? 'Read the spectrum' : 'Predict, then explain'; },
      extra: function(host, p){
        if(p.type === 'pes-id'){
          // No subshell labels: naming the peaks is the second step.
          host.innerHTML = '<figure class="cd-fig ptx-qfig">' + TR.pesSvg(byZ[p.el], { w: phoneW() ? 380 : 560, h: phoneW() ? 380 : 240, labels: false, noSub: true, label: 'Photoelectron spectrum of an unknown atom: ' + byZ[p.el].pes.map(function(k){ return 'a peak at ' + k[1] + ' MJ/mol with relative height ' + k[2]; }).join('; ') + '.' }) + '<figcaption class="bt-small">Binding energy on a log scale, decreasing to the right. Peak heights are relative numbers of electrons.</figcaption></figure>';
          return;
        }
        if(p.type === 'pes-cmp'){
          // Both spectra on one shared axis, so the 1s peaks line up.
          var A = byZ[p.pair[0]], Bq = byZ[p.pair[1]], hiE = Math.max(A.pes[0][1], Bq.pes[0][1]) * 2.2, loE = 0.1, ph2 = phoneW() ? 230 : 170, pw2 = phoneW() ? 380 : 560;
          host.innerHTML = '<figure class="cd-fig ptx-qfig ptx-two">' + [A, Bq].map(function(e){
            return '<div class="ptx-twoone"><p class="ptx-pesh"><b>' + T.esc(e.n) + '</b> ' + TR.confHtml(e.conf) + '</p>' + TR.pesSvg(e, { w: pw2, h: ph2, hi: hiE, lo: loE }) + '</div>';
          }).join('') + '<figcaption class="bt-small">Same energy axis for both. Heights are relative numbers of electrons.</figcaption></figure>';
          return;
        }
        if(p.pair){
          var a = byZ[p.pair[0]], b = byZ[p.pair[1]];
          host.innerHTML = '<figure class="cd-fig ptx-qfig">' + miniTable([a, b]) + '<figcaption class="bt-small">Where the two elements sit on the table.</figcaption></figure>';
        }
      }
    });
    function phoneW(){ return (window.innerWidth || 1000) < 640; }
    function miniTable(mark){
      var c = [1, 2, 13, 14, 15, 16, 17, 18], cw = 40, ch = 40, g = [];
      data.elements.filter(function(e){ return e.g != null && c.indexOf(e.g) > -1 && e.p <= 6; }).forEach(function(e){
        var x = c.indexOf(e.g) * (cw + 3) + 2, y = (e.p - 1) * (ch + 3) + 2, on = mark.indexOf(e) > -1;
        g.push('<g class="ptx-cell' + (on ? ' is-sel' : ' is-quiet') + '"><rect x="' + x + '" y="' + y + '" width="' + cw + '" height="' + ch + '" rx="6"/><text class="ptx-s" x="' + (x + cw / 2) + '" y="' + (y + ch / 2 + 5) + '" text-anchor="middle">' + e.s + '</text></g>');
      });
      return '<svg class="chem-svg ptx-svg ptx-mini" viewBox="0 0 ' + (8 * 43 + 2) + ' ' + (6 * 43 + 2) + '" role="img" aria-label="The main groups of the periodic table with ' + mark.map(function(e){ return e.n; }).join(' and ') + ' highlighted.">' + g.join('') + '</svg>';
    }
  }
})();
