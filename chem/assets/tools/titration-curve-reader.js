/* Trainer: titration curve reader (Unit 8). Job: see what is in the flask at
   every point of a titration, and read the curve from that.

   Explore: a burette slider (and buttons, a Run button, a tap on the graph)
   adds titrant; the curve draws itself up to the current volume (every
   point ApChemMath.titration.pH, the exact charge balance), the live beaker
   shows the species present (counts proportional to millimoles,
   ApChemMath.titration.species), the liquid takes the chosen indicator's
   color across its real transition range, and the half-equivalence and
   equivalence points are marked once passed, with what they mean.

   Test yourself: the five-step reader (unchanged): the student marks the
   equivalence and half-equivalence points with a marker that moves by
   slider, typed volume, arrow keys or a tap on the graph, reads pKa, picks
   an indicator from the table and names the species at a marked point.
   Steps are checked by ApChemTools.drill; problem codes (?seed=) open here. */
(function(){
  'use strict';
  var T = window.ApChemTools;
  if(!T) return;
  var KIND = { sa: 'Strong acid with strong base', wa: 'Weak acid with strong base', wb: 'Weak base with strong acid', di: 'Diprotic acid with strong base' };
  // Indicator colors (acid form, base form, the mixed color between, as
  // words and RGB). Phenolphthalein's acid form is colorless (alpha 0).
  var COLORS = {
    'Methyl orange': { a: [224, 69, 58, 1], b: [242, 197, 49, 1], words: ['red', 'orange', 'yellow'] },
    'Methyl red': { a: [217, 54, 62, 1], b: [240, 210, 58, 1], words: ['red', 'orange', 'yellow'] },
    'Bromothymol blue': { a: [235, 210, 59, 1], b: [47, 111, 214, 1], words: ['yellow', 'green', 'blue'] },
    'Phenolphthalein': { a: [224, 57, 155, 0], b: [224, 57, 155, 1], words: ['colorless', 'faint pink', 'pink'] },
    'Alizarin yellow R': { a: [240, 212, 58, 1], b: [216, 69, 47, 1], words: ['yellow', 'orange', 'red'] }
  };
  // plot() geometry (chem-tools.js): left 66, right 16, top 16, bottom 56.
  var W = 560, H = 330, L = 66, PW = W - 66 - 16, PT = 16, PH = H - 16 - 56;

  T.mount('titration-curve-reader', function(app, data){
    var M = window.ApChemMath;
    var ex = null;
    T.modes(app, { slug: 'titration-curve-reader', labels: ['Explore the titration', 'Test yourself'], explore: function(host){ ex = explore(host, data, M); }, quiz: function(host){ quiz(host, data, M); }, onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); } });
  });

  /* ------------------------------------------------------------ explore */
  function explore(host, data, M){
    var F = T.F, esc = T.esc, TT = M.titration;
    var ctxs = data.contexts || [], kinds = ['wa', 'sa', 'wb', 'di'].filter(function(k){ return ctxs.some(function(c){ return c.kind === k; }); });
    var kind = kinds[0], seed = 1000 + Math.floor(Math.random() * 9000), p, ctx, v = 0, ind = 0, beaker = null, timer = null, lastRegion = '';
    host.innerHTML = '<section class="bt-problem tx-card" aria-labelledby="tx-h"><div class="tx-head"><h2 id="tx-h" class="tx-title"></h2><p class="tx-setup bt-small"></p></div>' +
      '<div class="tx-stage"><figure class="tx-graph"><div class="tx-plot"></div></figure>' +
      '<div class="tx-beaker"></div>' +
      '<div class="tx-ctl"></div></div>' +
      '<div class="tx-meaning" aria-hidden="true"></div>' +
      '<div class="tx-ind"></div>' +
      '<div class="tx-pick bt-pick"></div><p class="bt-small tx-scale"></p></section>';
    var pick = host.querySelector('.tx-pick');
    if(kinds.length > 1) T.kindPicker(pick, { label: 'Titration', options: kinds.map(function(k){ return { value: k, label: KIND[k] }; }), value: kind, mixed: KIND[kind], onChange: function(val){ kind = val || kinds[0]; seed++; build(); } })
      .select.querySelector('option[value=""]').remove();
    var indSel = T.choiceSelect({ label: 'Indicator', options: TT.INDICATORS.map(function(d, i){ return { value: i, label: d.name }; }), value: 0, onChange: function(val){ ind = +val; draw(); } });
    indSel.el.classList.add('bt-inline');
    pick.appendChild(indSel.el);
    var ctl = host.querySelector('.tx-ctl'), slider = null;
    pick.insertAdjacentHTML('beforeend', '<button type="button" class="bt-btn tx-new">New numbers</button>');
    host.querySelector('.tx-new').addEventListener('click', function(){ seed++; build(); });

    function build(){
      stop();
      var pool = ctxs.filter(function(c){ return c.kind === kind; });
      ctx = pool[seed % pool.length];
      p = TT.generate(M.rng(seed), ctx);
      ind = p.indicator; indSel.set(ind);
      v = 0; lastRegion = '';
      host.querySelector('.tx-title').textContent = KIND[kind];
      host.querySelector('.tx-setup').innerHTML = 'Flask: ' + M.fmt(p.sys.Va, 3) + ' mL of ' + M.fmt(p.sys.Ca, 3) + ' M ' + esc(ctx.analyte) + '. Burette: ' + M.fmt(p.sys.Ct, 3) + ' M ' + esc(ctx.titrant) + '.';
      ctl.innerHTML = '';
      slider = T.slider({ label: 'Volume of ' + ctx.titrant + ' added', min: 0, max: p.vmax, step: 0.05, value: 0, unit: 'mL', decimals: 2, onInput: function(x){ stop(); v = x; draw(); } });
      ctl.appendChild(slider.el);
      ctl.insertAdjacentHTML('beforeend', '<div class="bt-buttons tx-btns"><button type="button" class="bt-btn tx-run" aria-pressed="false">▶ Run</button><button type="button" class="bt-btn" data-add="1">+1 mL</button><button type="button" class="bt-btn" data-add="0.05">+1 drop</button><button type="button" class="bt-btn" data-add="reset">Start over</button></div>');
      ctl.querySelectorAll('[data-add]').forEach(function(b){ b.addEventListener('click', function(){
        stop(); var a = b.getAttribute('data-add'); setV(a === 'reset' ? 0 : v + (+a));
      }); });
      ctl.querySelector('.tx-run').addEventListener('click', function(){ timer ? stop() : run(); });
      if(beaker) beaker.destroy();
      beaker = window.ApChemBeaker.mount(host.querySelector('.tx-beaker'), { species: speciesList(), readout: 'pH', title: 'The flask', max: 32, seed: seed });
      var n0 = p.sys.Ca * p.sys.Va;
      host.querySelector('.tx-scale').innerHTML = 'Each particle stands for ' + M.fmt(n0 / per(), 2) + ' mmol. Not drawn: water and the spectator ' + (kind === 'sa' ? 'ions Na⁺ and Cl⁻' : kind === 'wb' ? 'ion Cl⁻' : 'ion Na⁺') + '. A species with less than half a particle\'s worth shows as 0.';
      draw();
    }
    function per(){ return kind === 'di' ? 12 : 16; }
    function speciesList(){
      var oh = { key: 'OH', label: 'OH⁻', name: 'OH⁻', tone: 5 }, h3o = { key: 'H3O', label: 'H₃O⁺', mol: 'H3O+', name: 'H₃O⁺' };
      if(kind === 'sa') return [h3o, oh];
      if(kind === 'wb') return [{ key: 'B', label: 'B', name: ctx.B + ' (B)', tone: 3 }, { key: 'BH', label: 'BH⁺', name: ctx.BH + ' (BH⁺)', tone: 2 }, h3o, oh];
      if(kind === 'di') return [{ key: 'H2A', label: 'H₂A', name: 'H₂A', tone: 1 }, { key: 'HA', label: 'HA⁻', name: 'HA⁻', tone: 4 }, { key: 'A', label: 'A²⁻', name: 'A²⁻', tone: 2 }, h3o, oh];
      return [{ key: 'HA', label: 'HA', mol: 'HA', name: ctx.HA + ' (HA)' }, { key: 'A', label: 'A⁻', mol: 'A-', name: ctx.A + ' (A⁻)' }, h3o, oh];
    }
    function setV(x){ v = Math.max(0, Math.min(p.vmax, M.round(x, 2))); slider.set(v); draw(); }
    function run(){
      if(v >= p.vmax - 1e-9) v = 0;
      var b = ctl.querySelector('.tx-run'); b.setAttribute('aria-pressed', 'true'); b.textContent = '❚❚ Pause';
      var slow = T.reduced(), dv = slow ? 1 : p.vmax / 320;
      timer = setInterval(function(){
        // Slow down near an equivalence point so the jump can be watched.
        var near = p.eqs.some(function(e){ return Math.abs(v - e) < 1.2; });
        v = Math.min(p.vmax, v + (near && !slow ? dv / 3 : dv)); slider.set(v); draw();
        if(v >= p.vmax - 1e-9) stop();
      }, slow ? 500 : 40);
    }
    function stop(){
      if(!timer) return;
      clearInterval(timer); timer = null;
      var b = ctl.querySelector('.tx-run'); if(b){ b.setAttribute('aria-pressed', 'false'); b.textContent = '▶ Run'; }
    }

    function landmarks(){
      var e = p.eqs, out = [];
      if(p.half != null) out.push({ v: p.half, label: kind === 'di' ? '½ eq 1' : '½ eq', what: 'pH = pK' + (kind === 'di' ? 'a1' : 'a') });
      out.push({ v: e[0], label: kind === 'di' ? 'eq 1' : 'eq', what: 'equivalence' });
      if(kind === 'di'){ out.push({ v: p.half2, label: '½ eq 2', what: 'pH = pKa2' }); out.push({ v: e[1], label: 'eq 2', what: 'second equivalence' }); }
      return out;
    }
    function sx(x){ return L + x / p.vmax * PW; }
    function sy(y){ return PT + PH - Math.max(0, Math.min(14, y)) / 14 * PH; }
    function draw(){
      if(!p) return;
      var pH = TT.pH(p.sys, v), tol = Math.max(0.1, 0.02 * p.eqs[0]);
      var pts = p.curve.filter(function(q){ return q[0] <= v; });
      pts.push([v, pH]);
      var passed = landmarks().filter(function(m){ return v >= m.v - tol; });
      var svg = T.plot({ w: W, h: H, title: 'Titration curve so far: pH against volume of ' + ctx.titrant + ' added, drawn from 0 to ' + F(v, 1) + ' mL of ' + p.vmax + '. pH now ' + F(pH, 2) + '.' + (passed.length ? ' Marked: ' + passed.map(function(m){ return m.what + ' at ' + F(m.v, 1) + ' mL, pH ' + F(TT.pH(p.sys, m.v), 2); }).join('; ') + '.' : ''),
        x: { label: 'Volume of ' + ctx.titrant + ' added', unit: 'mL', min: 0, max: p.vmax, step: T.niceStep(p.vmax, 6) },
        y: { label: 'pH', min: 0, max: 14, step: 2 },
        curves: [{ cls: 's1', points: pts }],
        points: passed.map(function(m){ return { x: m.v, y: TT.pH(p.sys, m.v), cls: 's3', square: true }; }).concat([{ x: v, y: pH, cls: 's2' }]) });
      // Labels for the passed landmarks, and the indicator's range as a band.
      var d = TT.INDICATORS[ind], band = '<rect class="tx-band" x="' + L + '" width="' + PW + '" y="' + sy(d.hi).toFixed(1) + '" height="' + (sy(d.lo) - sy(d.hi)).toFixed(1) + '"/>' +
        '<text class="tx-band-t" x="' + (L + PW - 6) + '" y="' + (sy(d.hi) + 13).toFixed(1) + '" text-anchor="end">' + esc(d.name) + '</text>';
      var labs = passed.map(function(m){ var x = sx(m.v), y = sy(TT.pH(p.sys, m.v)), up = kind === 'wb' ? 1 : -1; return '<text class="tx-lm" x="' + (x + 8).toFixed(1) + '" y="' + (y + up * -14 + 4).toFixed(1) + '">' + m.label + '</text>'; }).join('');
      svg = svg.replace(/(<line class="axis")/, band + '$1').replace('</svg>', labs + '</svg>');
      var plot = host.querySelector('.tx-plot');
      plot.innerHTML = svg;
      plot.querySelector('svg').addEventListener('click', function(e){
        var b = this.getBoundingClientRect(), x = (e.clientX - b.left) * W / b.width;
        stop(); setV((x - L) / PW * p.vmax);
      });
      // The beaker: counts proportional to millimoles.
      var s = TT.species(p.sys, v), k = per() / (p.sys.Ca * p.sys.Va), counts = {};
      speciesList().forEach(function(sp){ counts[sp.key] = Math.round((s[sp.key] || 0) * k); });
      var reg = TT.region(p.sys, v), m = meaning(reg, pH, s);
      beaker.update({ counts: counts, pH: pH, note: reg !== lastRegion ? m.short : '' });
      lastRegion = reg;
      paint(pH);
      host.querySelector('.tx-meaning').innerHTML = '<p class="tx-where"><b>' + m.head + '</b> ' + m.text + '</p>';
    }
    function paint(pH){
      var d = TT.INDICATORS[ind], c = COLORS[d.name], t = Math.max(0, Math.min(1, (pH - d.lo) / (d.hi - d.lo)));
      var mix = c.a.map(function(x, i){ return x + (c.b[i] - x) * t; });
      var liq = host.querySelector('.lb-liquid');
      if(liq) liq.style.fill = 'rgba(' + Math.round(mix[0]) + ',' + Math.round(mix[1]) + ',' + Math.round(mix[2]) + ',' + (0.85 * mix[3]).toFixed(2) + ')';
      var word = t <= 0 ? c.words[0] : t >= 1 ? c.words[2] : c.words[1];
      var lo = TT.cross(p.sys, kind === 'wb' ? d.hi : d.lo, p.vmax), hi = TT.cross(p.sys, kind === 'wb' ? d.lo : d.hi, p.vmax), last = p.eqs[p.eqs.length - 1];
      var range = lo === Infinity ? 'never reaches its range on this curve' : hi === 0 ? 'is past its range before any titrant is added' :
        'changes color between ' + (lo === 0 ? '0' : F(lo, 2)) + ' and ' + (hi === Infinity ? 'past ' + p.vmax : F(hi, 2)) + ' mL';
      var fit = lo <= last && last <= hi ? 'Its range holds the equivalence pH (' + F(p.phEq, 2) + '), so the color change marks the end point.'
        : hi < last ? 'That is before the equivalence point at ' + F(last, 1) + ' mL: it would change too early.' : 'That is after the equivalence point at ' + F(last, 1) + ' mL: it would change too late.';
      var steep = lo !== Infinity && hi !== 0 && Math.max(Math.abs(lo - last), Math.abs(hi - last)) <= 0.1 && !(lo <= last && last <= hi) ? ' On a jump this steep, that is within two drops, so it would still work in practice.' : '';
      host.querySelector('.tx-ind').innerHTML = '<p class="tx-ind-p"><span class="tx-swatch" style="background:rgba(' + Math.round(mix[0]) + ',' + Math.round(mix[1]) + ',' + Math.round(mix[2]) + ',' + mix[3].toFixed(2) + ')"></span><b>' + esc(d.name) + ' is ' + word + ' now.</b> Its range is pH ' + F(d.lo, 1) + ' to ' + F(d.hi, 1) + ' (' + c.words[0] + ' to ' + c.words[2] + '); on this curve it ' + range + '. ' + fit + steep + '</p>';
    }
    function meaning(reg, pH, s){
      var e = p.eqs, nm = function(x){ return esc(x); };
      var HA = ctx.HA, A = ctx.A, pk = p.pKa != null ? F(p.pKa, 2) : '', at = F(v, 1) + ' mL, pH ' + F(pH, 2) + '.';
      var W = {
        sa: {
          start: ['Start.', 'HCl is a strong acid, fully ionized: the flask is H₃O⁺ and Cl⁻. pH = −log of the acid concentration.'],
          before: ['Excess H₃O⁺.', 'Each OH⁻ added removes one H₃O⁺ (H₃O⁺ + OH⁻ → 2 H₂O). The pH is set by the H₃O⁺ still left, so it rises slowly until almost all of it is gone.'],
          eq: ['Equivalence point.', 'Moles of OH⁻ added = moles of HCl at the start. Only Na⁺ and Cl⁻ are left, and neither reacts with water: pH 7.00 at exactly ' + F(e[0], 2) + ' mL. Within two drops of it the pH is still mid-jump.'],
          after: ['Excess OH⁻.', 'Every H₃O⁺ is gone, so each OH⁻ added stays. The leftover OH⁻ sets the pH.']
        },
        wa: {
          start: ['Start: a weak acid.', nm(HA) + ' is mostly un-ionized; only a little H₃O⁺ forms, so the pH starts higher than a strong acid\'s.'],
          'acid-rich': ['Buffer region, more HA than A⁻.', 'Each OH⁻ added turns one ' + nm(HA) + ' into ' + nm(A) + ' (HA + OH⁻ → A⁻ + H₂O). With both forms present the pH barely moves: pH < pK<sub>a</sub>.'],
          half: ['Half-equivalence point.', 'Half the acid has been converted, so [HA] = [A⁻] and pH = pK<sub>a</sub> = ' + pk + '. This is how pK<sub>a</sub> is read off a curve.'],
          'base-rich': ['Buffer region, more A⁻ than HA.', 'pH > pK<sub>a</sub> now. The HA is running out, so each drop moves the pH more: the jump is coming.'],
          eq: ['Equivalence point.', 'Moles of OH⁻ added = moles of ' + nm(HA) + ' at the start. All of it is ' + nm(A) + ', a weak base, so the pH is above 7 (' + F(p.phEqs[0], 2) + ' at exactly ' + F(e[0], 2) + ' mL; within two drops of it the pH is still mid-jump).'],
          after: ['Excess OH⁻.', 'No HA is left to react, so added OH⁻ stays and sets the pH. ' + nm(A) + ' barely matters now.']
        },
        wb: {
          start: ['Start: a weak base.', nm(ctx.B) + ' is mostly un-ionized; a little OH⁻ forms, so the pH starts above 7 but below a strong base\'s.'],
          'acid-rich': ['Buffer region, more B than BH⁺.', 'Each H₃O⁺ added turns one ' + nm(ctx.B) + ' into ' + nm(ctx.BH) + '. With both forms present the pH falls slowly: pH > pK<sub>a</sub> of ' + nm(ctx.BH) + '.'],
          half: ['Half-equivalence point.', '[B] = [BH⁺], so pH = pK<sub>a</sub> of ' + nm(ctx.BH) + ' = ' + pk + ' (and pK<sub>b</sub> = 14.00 − ' + pk + ').'],
          'base-rich': ['Buffer region, more BH⁺ than B.', 'pH < pK<sub>a</sub> now. The base is running out, so each drop moves the pH more: the drop is coming.'],
          eq: ['Equivalence point.', 'Moles of H₃O⁺ added = moles of ' + nm(ctx.B) + ' at the start. All of it is ' + nm(ctx.BH) + ', a weak acid, so the pH is below 7 (' + F(p.phEqs[0], 2) + ' at exactly ' + F(e[0], 2) + ' mL; within two drops of it the pH is still mid-jump).'],
          after: ['Excess H₃O⁺.', 'No base is left, so added H₃O⁺ stays and sets the pH.']
        },
        di: {
          start: ['Start.', 'H₂A is a weak acid, mostly un-ionized.'],
          b1a: ['First buffer region.', 'OH⁻ removes the first proton: H₂A → HA⁻. More H₂A than HA⁻, so pH < pK<sub>a1</sub>.'],
          half1: ['First half-equivalence point.', '[H₂A] = [HA⁻], so pH = pK<sub>a1</sub> = ' + pk + '.'],
          b1b: ['First buffer, running out.', 'More HA⁻ than H₂A; the first jump is coming.'],
          eq1: ['First equivalence point.', 'Each H₂A has lost one proton: the flask is mostly HA⁻ (pH ' + F(p.phEqs[0], 2) + ' at exactly ' + F(e[0], 2) + ' mL).'],
          b2a: ['Second buffer region.', 'Now OH⁻ removes the second proton: HA⁻ → A²⁻. pH < pK<sub>a2</sub>.'],
          half2: ['Second half-equivalence point.', '[HA⁻] = [A²⁻], so pH = pK<sub>a2</sub> = ' + F(p.pKa2, 2) + '.'],
          b2b: ['Second buffer, running out.', 'More A²⁻ than HA⁻; the second jump is coming.'],
          eq2: ['Second equivalence point.', 'Twice the first volume: each molecule has lost both protons. A²⁻ is a weak base, so pH ' + F(p.phEqs[1], 2) + ' at exactly ' + F(e[1], 2) + ' mL.'],
          after: ['Excess OH⁻.', 'Both protons are gone, so added OH⁻ stays and sets the pH.']
        }
      }[kind][reg];
      return { head: W[0], text: W[1] + ' <span class="tx-at">' + at + '</span>', short: (W[0] + ' ' + W[1]).replace(/<[^>]+>/g, '') };
    }
    build();
    return { stop: stop };
  }

  /* --------------------------------------------------------------- quiz */
  function quiz(app, data, M){
    var F = T.F, cur = null, marker = null, marks = [], api = null;
    function draw(){
      var p = cur, host = app.querySelector('.tc-plot');
      if(!host) return;
      var pts = [];
      marks.forEach(function(m){ pts.push({ x: m.v, y: M.titration.pH(p.sys, m.v), cls: 's3', square: true }); });
      if(p.point && p.showPoint) pts.push({ x: p.point.v, y: p.point.pH, cls: 's4' });
      if(marker != null) pts.push({ x: marker, y: M.titration.pH(p.sys, marker), cls: 's2' });
      host.innerHTML = T.plot({ w: W, h: H, title: 'Titration curve: pH against volume of ' + p.titrant + ' added, from 0 to ' + p.vmax + ' mL. ' + (marker != null ? 'Marker at ' + F(marker, 1) + ' mL, pH ' + F(M.titration.pH(p.sys, marker), 2) + '.' : ''),
        x: { label: 'Volume of ' + p.titrant + ' added', unit: 'mL', min: 0, max: p.vmax, step: T.niceStep(p.vmax, 6) },
        y: { label: 'pH', min: 0, max: 14, step: 2 },
        curves: [{ cls: 's1', points: p.curve }], points: pts, vline: marker != null ? { x: marker, cls: 's2' } : null });
      var svg = host.querySelector('svg');
      svg.addEventListener('click', function(e){
        if(!api || !api.setVol) return;
        var b = svg.getBoundingClientRect(), x = (e.clientX - b.left) * W / b.width;
        api.setVol((x - L) / PW * p.vmax);
      });
      var out = app.querySelector('.tc-read');
      if(out) out.textContent = marker != null ? 'Marker: ' + F(marker, 1) + ' mL, pH ' + F(M.titration.pH(p.sys, marker), 2) : '';
    }
    T.drill(app, data, {
      slug: 'titration-curve-reader',
      generate: function(r, ctx){ var p = M.titration.generate(r, ctx); p.titrant = ctx.titrant; return p; },
      types: [{ value: 'sa', label: KIND.sa }, { value: 'wa', label: KIND.wa }, { value: 'wb', label: KIND.wb }, { value: 'di', label: KIND.di }],
      typeLabel: 'Kind of titration',
      title: function(p){ return KIND[p.sys.kind]; },
      newLabel: 'New curve',
      extra: function(host, p, a){
        cur = p; marker = null; marks = []; api = a; p.showPoint = false;
        host.innerHTML = '<figure class="tc-fig"><div class="tc-plot"></div><figcaption class="bt-small tc-read" aria-hidden="true"></figcaption></figure>' +
          T.dataTable(['Indicator', 'Color change range (pH)'], M.titration.INDICATORS.map(function(d){ return [d.name, F(d.lo, 1) + ' to ' + F(d.hi, 1)]; }), 'Indicators');
        draw();
      },
      onVol: function(v){ marker = v; draw(); },
      onStep: function(s){
        if(s.kind === 'vol'){ marks.push({ v: s.cell.answer }); marker = null; }
        // The species question that follows marks its point on the curve.
        if(s.key === 'indicator') cur.showPoint = true;
        draw();
      }
    });
  }
})();
