/* Simulator: energy flow through a food chain (Unit 8). The model is in
   bio-tool-math.js (ApBioMath.energyFlow): GPP, producer respiration and
   NPP, the fraction stored at each level, respiration heat, energy to
   decomposers, biomass from each level's turnover, and a persistent toxin's
   concentration per level. The defaults, ranges, ecosystems, the "How this
   model works" box, the questions and the mini FRQ are data
   (bio/data/tools/energy-flow.json). Two modes: energy and biomass, and
   biomagnification. Pyramids are drawn as labeled bars (every number is
   written on the figure), with widths to scale or on a log scale.

   Job: see why so little energy reaches the top of a food chain.

   Tools upgrade (U-Bio-sims, lighter version): a flow stage first in the
   card. Each level is a box (width on a log scale of the energy it absorbs);
   energy blocks travel up the arrows to the next level (arrow width and
   block rate from the energy passed on), heat peels off each level to the
   side, and what is never eaten drops to the decomposers. Tap a level (or
   use its button) to see where its energy went: one 100% bar split into
   heat, passed on and to decomposers, from ApBioMath.energyFlow. Reduced
   motion: no moving blocks. */
(function(){
  'use strict';
  var SLUG = 'energy-flow';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  T.mount(SLUG, function(app, data, ctx){
    var esc = T.esc, E = M.energyFlow, D = data.defaults, RG = data.ranges, NAMES = data.levelNames;
    var st = { mode: 'energy', eco: data.ecosystems[0].id, gpp: D.gpp, prodResp: D.prodResp, eff: D.eff, resp: D.resp, levels: D.levels, c0: D.c0, retain: D.retain, scale: 'log' };
    var runs = [], ctl = {};
    var MODES = [['energy', 'Energy and biomass'], ['toxin', 'Biomagnification of a persistent toxin (from Topic 8.7)']];

    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
      '<section class="bt-card ef-card" aria-labelledby="ef-h"><h2 id="ef-h">The model</h2>' +
      '<div class="bt-fig ef-flowfig"></div><p class="bt-small">Tap a level to see where its energy went.</p><div class="ef-where os-why" role="status" aria-live="polite"></div>' +
      '<fieldset class="bt-modes"><legend>Show</legend>' + MODES.map(function(m){
        var id = 'ef-mode-' + m[0];
        return '<div class="bt-radio"><input type="radio" name="ef-mode" id="' + id + '" value="' + m[0] + '"' + (m[0] === st.mode ? ' checked' : '') + '><label for="' + id + '">' + esc(m[1]) + '</label></div>';
      }).join('') + '</fieldset>' +
      '<div class="bt-controls ef-ctl"></div>' +
      '<div class="ef-levels"><div class="bt-buttons"><button type="button" class="bt-btn" data-a="less">Remove the top level</button><button type="button" class="bt-btn" data-a="more">Add a level</button></div><p class="bt-small ef-lvnote" role="status" aria-live="polite"></p></div>' +
      '<div><h3 class="ef-sub">Food chain (each arrow: is eaten by)</h3><ol class="ef-chain"></ol></div>' +
      '<div class="bt-tabs" role="group" aria-label="Bar widths"><button type="button" class="bt-btn" data-s="log" aria-pressed="true">Widths on a log scale</button><button type="button" class="bt-btn" data-s="linear" aria-pressed="false">Widths to scale</button></div>' +
      '<div class="bt-stage two ef-stage"><div class="bt-fig ef-fig1"></div><div class="bt-fig ef-fig2"></div></div><p class="bt-small ef-key"></p>' +
      '<dl class="bt-readout ef-out"></dl><div class="ef-explain"><h3>What is happening</h3><ol></ol></div><p class="bt-summary"></p>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm" data-a="run">Run one trial</button><button type="button" class="btn-press sm alt" data-a="series">Run a series of fractions passed on</button><button type="button" class="bt-btn" data-a="clear">Clear runs</button></div>' +
      '<p class="bt-small bt-runnote" role="status" aria-live="polite"></p>' +
      '<details class="bt-data"><summary>Data tables: your runs and every level</summary><div class="bt-tables"></div></details></section>' +
      '<section class="bt-card" aria-labelledby="ef-q"><h2 id="ef-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');
    var card = app.querySelector('.bt-card');
    var say = T.announcer(card.querySelector('.bt-summary'));
    var lvnote = card.querySelector('.ef-lvnote');

    card.querySelectorAll('input[name="ef-mode"]').forEach(function(r){
      r.addEventListener('change', function(){ if(r.checked){ st.mode = r.value; enable(); update(true); } });
    });
    card.querySelectorAll('[data-s]').forEach(function(b){
      b.addEventListener('click', function(){
        st.scale = b.getAttribute('data-s');
        card.querySelectorAll('[data-s]').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        update(true);
      });
    });
    card.querySelector('[data-a="less"]').addEventListener('click', function(){ setLevels(st.levels - 1); });
    card.querySelector('[data-a="more"]').addEventListener('click', function(){ setLevels(st.levels + 1); });
    card.querySelector('[data-a="run"]').addEventListener('click', function(){ run(false); });
    card.querySelector('[data-a="series"]').addEventListener('click', function(){ run(true); });
    card.querySelector('[data-a="clear"]').addEventListener('click', function(){ runs = []; card.querySelector('.bt-runnote').textContent = 'Runs cleared.'; update(true); });

    /* ------------------------------------------------------- helpers */
    function eco(){ return data.ecosystems.filter(function(e){ return e.id === st.eco; })[0]; }
    function cond(o){ var c = { gpp: st.gpp, prodResp: st.prodResp, eff: st.eff, resp: st.resp, levels: st.levels, c0: st.c0, retain: st.retain, pb: eco().pb, kcalPerG: data.kcalPerG }; for(var k in o || {}) c[k] = o[k]; return c; }
    function num(x, d){ var v = Number(M.fixed(x, d || 0)); return v.toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
    function sig(x){ var d = x >= 100 ? 0 : x >= 10 ? 1 : x >= 1 ? 2 : 3; return num(x, d); }
    function pct(f, d){ return M.fixed(f * 100, d || 0) + '%'; }
    function lname(i){ return NAMES[i] + ' (' + eco().organisms[i].toLowerCase() + ')'; }
    function maxResp(eff){ return Math.floor((1 - eff) * 100 / 5 + 1e-9) * 5 / 100; }
    function setText(){ return eco().label.toLowerCase() + ', GPP ' + num(st.gpp) + ' kcal/m²/yr, producer respiration ' + pct(st.prodResp) + ', ' + pct(st.eff) + ' passed on, consumer respiration ' + pct(st.resp) + ', ' + st.levels + ' levels'; }

    /* ------------------------------------------------------ controls */
    function build(){
      var host = card.querySelector('.ef-ctl');
      ctl.eco = T.choiceSelect({ label: 'Ecosystem', value: st.eco, options: data.ecosystems.map(function(e){ return { value: e.id, label: e.label + ' (' + e.organisms.slice(0, 2).join(', ').toLowerCase() + ', …)' }; }),
        onChange: function(v){ st.eco = v; update(true); } });
      ctl.gpp = T.slider({ label: 'Gross primary productivity (GPP)', min: RG.gpp.min, max: RG.gpp.max, step: RG.gpp.step, value: st.gpp, unit: 'kcal/m²/yr', decimals: 0, onInput: function(v){ st.gpp = v; update(); } });
      ctl.prodResp = T.slider({ label: 'Producer respiration (share of GPP)', min: RG.prodResp.min * 100, max: RG.prodResp.max * 100, step: RG.prodResp.step * 100, value: Math.round(st.prodResp * 100), unit: '%', decimals: 0,
        onInput: function(v){ st.prodResp = v / 100; update(); } });
      ctl.eff = T.slider({ label: 'Fraction passed on to the next level', min: RG.eff.min * 100, max: RG.eff.max * 100, step: RG.eff.step * 100, value: Math.round(st.eff * 100), unit: '%', decimals: 0,
        hint: 'The share of the level below’s stored energy that a level stores.', onInput: function(v){ st.eff = v / 100; capResp(); update(); } });
      ctl.resp = T.slider({ label: 'Consumer respiration (share of energy absorbed)', min: RG.resp.min * 100, max: RG.resp.max * 100, step: RG.resp.step * 100, value: Math.round(st.resp * 100), unit: '%', decimals: 0,
        hint: 'Lost as heat. At most 100% minus the fraction passed on.', onInput: function(v){ st.resp = v / 100; capResp(); update(); } });
      ctl.c0 = T.slider({ label: 'Toxin in producers', min: RG.c0.min, max: RG.c0.max, step: RG.c0.step, value: st.c0, unit: 'ppm', decimals: 2, onInput: function(v){ st.c0 = v; update(); } });
      ctl.retain = T.slider({ label: 'Toxin kept from absorbed food', min: RG.retain.min * 100, max: RG.retain.max * 100, step: RG.retain.step * 100, value: Math.round(st.retain * 100), unit: '%', decimals: 0,
        onInput: function(v){ st.retain = v / 100; update(); } });
      [ctl.eco, ctl.gpp, ctl.prodResp, ctl.eff, ctl.resp, ctl.c0, ctl.retain].forEach(function(c){ host.appendChild(c.el); });
      enable();
    }
    function capResp(){
      var mx = maxResp(st.eff);
      if(st.resp > mx + 1e-9){
        st.resp = mx; ctl.resp.set(Math.round(mx * 100));
        lvnote.textContent = 'Consumer respiration lowered to ' + pct(mx) + ': with ' + pct(st.eff) + ' passed on, a level cannot absorb more than the level below stores.';
      }
    }
    function enable(){
      var tox = st.mode === 'toxin';
      ctl.c0.el.hidden = !tox; ctl.retain.el.hidden = !tox;
      card.querySelector('[data-a="less"]').disabled = st.levels <= RG.levels.min;
      card.querySelector('[data-a="more"]').disabled = st.levels >= RG.levels.max;
    }
    function setLevels(n){
      n = Math.max(RG.levels.min, Math.min(RG.levels.max, n));
      var added = n > st.levels;
      st.levels = n; enable();
      lvnote.textContent = (added ? 'Added ' : 'Removed. Top level is now ') + lname(n - 1) + '. The chain has ' + n + ' levels.';
      var b = card.querySelector(added ? '[data-a="more"]' : '[data-a="less"]');
      if(b.disabled) card.querySelector(added ? '[data-a="less"]' : '[data-a="more"]').focus();
      update(true);
    }

    /* ------------------------------------------------------- figures */
    function widthOf(v, vals){
      var W = 280, max = Math.max.apply(null, vals);
      if(!(v > 0)) return 0;
      if(st.scale === 'linear') return Math.max(2, W * v / max);
      var lo = Math.min.apply(null, vals.filter(function(x){ return x > 0; })), span = Math.log10(max) - Math.log10(lo);
      return W * (0.12 + 0.88 * (span > 0 ? (Math.log10(v) - Math.log10(lo)) / span : 1));
    }
    function pyramid(title, unit, cls, vals, labels, extra, inverted){
      var row = 50, h = 34 + row * vals.length, p = ['<text class="ef-ttl" x="160" y="18" text-anchor="middle">' + esc(title) + '</text>'];
      // producers at the bottom
      vals.forEach(function(v, i){
        var y = h - row * (i + 1), w = widthOf(v, vals);
        p.push('<text class="ef-lab" x="160" y="' + (y + 12) + '" text-anchor="middle">' + esc(labels[i] + ': ' + sig(v) + ' ' + unit + (extra && extra[i] ? ' (' + extra[i] + ')' : '')) + '</text>');
        p.push('<rect class="ef-bar ' + cls + '" x="' + (160 - w / 2).toFixed(1) + '" y="' + (y + 18) + '" width="' + w.toFixed(1) + '" height="22" rx="3"/>');
      });
      var desc = title + (st.scale === 'log' ? ' (bar widths on a log scale)' : ' (bar widths to scale)') + ', producers at the bottom: ' + vals.map(function(v, i){ return labels[i] + ' ' + sig(v) + ' ' + unit + (extra && extra[i] ? ' (' + extra[i] + ')' : ''); }).join('; ') + '.' + (inverted ? ' ' + inverted : '');
      return '<svg class="ef-pyr" viewBox="0 0 320 ' + h + '" role="img" aria-label="' + esc(desc) + '">' + p.join('') + '</svg>';
    }

    /* ------------------------------------------------------- the flow */
    var pickLevel = null;
    function flow(s){
      var L = s.levels, n = L.length, rowH = 66, H = 40 + n * rowH, Wd = 400, cx = 170, p = [];
      var lmax = Math.log10(Math.max.apply(null, L.map(function(x){ return x.inE; }))), lmin = Math.log10(Math.max(1e-3, Math.min.apply(null, L.map(function(x){ return x.inE; }))));
      var bw = function(v){ var span = Math.max(1, lmax - lmin); return 70 + 110 * Math.max(0, (Math.log10(Math.max(v, 1e-3)) - lmin) / span); };
      var aw = function(v){ return Math.max(1.5, Math.min(18, 2 + 3 * Math.log10(Math.max(1, v)))); };
      p.push('<rect class="ef-dec" x="' + (Wd - 92) + '" y="' + (H - 54) + '" width="86" height="44" rx="10"/><text class="ef-lab" x="' + (Wd - 49) + '" y="' + (H - 36) + '" text-anchor="middle">decomposers</text><text class="ef-lab" x="' + (Wd - 49) + '" y="' + (H - 20) + '" text-anchor="middle">' + num(s.decomp) + '</text>');
      p.push('<text class="ef-lab ef-sun" x="' + cx + '" y="' + (H - 6) + '" text-anchor="middle">☀ GPP ' + num(s.gpp) + ' kcal/m²/yr</text>');
      L.forEach(function(x, i){
        var y = H - 26 - (i + 1) * rowH + 14, w = bw(x.inE), sel = pickLevel === i;
        // heat to the left, decomposers to the right-down, passed on upward
        var hw = aw(x.heat);
        p.push('<path class="ef-heat" stroke-width="' + hw.toFixed(1) + '" d="M' + (cx - w / 2) + ' ' + (y + 26) + ' c-10 -8 -14 8 -24 0 s-14 -8 -24 0 s-14 -8 -24 0"/>');
        p.push('<text class="ef-heatlab" x="4" y="' + (y + 10) + '">heat ' + sig(x.heat) + '</text>');
        if(x.decomp > 0){ var dw = aw(x.decomp); p.push('<path class="ef-down" stroke-width="' + dw.toFixed(1) + '" d="M' + (cx + w / 2) + ' ' + (y + 24) + ' L' + (Wd - 60) + ' ' + (H - 56) + '"/>'); }
        if(i < n - 1){
          var uw = aw(x.passed), y2 = y - rowH + 40;
          p.push('<path class="ef-up" stroke-width="' + uw.toFixed(1) + '" d="M' + cx + ' ' + y + ' V' + (y2 + 2) + '"/>');
          var nb = Math.max(1, Math.min(4, Math.round(1 + Math.log10(Math.max(1, x.passed)) / 1.5)));
          for(var b = 0; b < nb; b++) p.push('<rect class="ef-block" x="' + (cx - 4) + '" y="' + (y - 8) + '" width="8" height="8" rx="2" style="--rise:' + (y2 - y + 8) + 'px;animation-delay:-' + (b * 1.6 / nb).toFixed(2) + 's"/>');
          p.push('<text class="ef-heatlab ef-uplab" x="' + (cx + 10) + '" y="' + ((y + y2) / 2 + 4) + '">' + sig(x.passed) + ' eaten</text>');
        }
        p.push('<g class="ef-lvl' + (sel ? ' sel' : '') + '" data-lv="' + i + '" role="button" tabindex="0" aria-pressed="' + sel + '" aria-label="' + esc(lname(i) + ': absorbs ' + sig(x.inE) + ' kcal/m²/yr. Tap to see where it went.') + '"><rect class="ef-box" x="' + (cx - w / 2).toFixed(1) + '" y="' + y + '" width="' + w.toFixed(1) + '" height="40" rx="8"/>' +
          '<text class="ef-lab" x="' + cx + '" y="' + (y + 17) + '" text-anchor="middle">' + esc(eco().organisms[i]) + '</text><text class="ef-num" x="' + cx + '" y="' + (y + 33) + '" text-anchor="middle">' + sig(x.inE) + (i ? ' in' : ' captured') + '</text></g>');
      });
      var desc = 'Energy flow, producers at the bottom: ' + L.map(function(x, i){ return eco().organisms[i] + ' take in ' + sig(x.inE) + ', lose ' + sig(x.heat) + ' as heat' + (i < n - 1 ? ', pass ' + sig(x.passed) + ' up' : '') + ', ' + sig(x.decomp) + ' to decomposers'; }).join('; ') + ' (kcal/m²/yr).';
      var host = card.querySelector('.ef-flowfig');
      host.innerHTML = '<svg class="ef-flow" viewBox="0 0 ' + Wd + ' ' + H + '" role="group" aria-label="' + esc(desc) + '">' + p.join('') + '</svg>';
      where(s);
    }
    function where(s){
      var box = card.querySelector('.ef-where');
      if(pickLevel == null || pickLevel >= s.levels.length){ box.innerHTML = ''; return; }
      var x = s.levels[pickLevel], tot = x.inE, parts = [['heat', 'Heat (respiration)', x.heat], ['up', pickLevel < s.levels.length - 1 ? 'Eaten by the next level' : 'Eaten by no one (top level)', x.passed], ['dec', 'To decomposers (never eaten or absorbed, wastes, dead bodies)', x.decomp]];
      box.innerHTML = '<p class="ef-wh"><b>' + esc(lname(pickLevel)) + '</b> took in ' + sig(tot) + ' kcal/m²/yr. Where it went:</p><div class="ef-split" aria-hidden="true">' + parts.map(function(q){ var f = q[2] / tot; return f > 0.0005 ? '<span class="ef-sp ' + q[0] + '" style="flex:' + f.toFixed(4) + '">' + (f >= 0.12 ? pct(f) : '') + '</span>' : ''; }).join('') + '</div>' +
        '<ul class="ef-whl">' + parts.map(function(q){ return '<li><span class="ef-k ' + q[0] + '"></span>' + esc(q[1]) + ': ' + sig(q[2]) + ' (' + pct(q[2] / tot, q[2] / tot < 0.01 ? 2 : 0) + ')</li>'; }).join('') + '</ul>' +
        '<p class="bt-small">' + (pickLevel === 0 ? 'Producer respiration takes ' + pct(st.prodResp) + ' of GPP; what is left is NPP, the most any consumer could ever get.' : 'Only the part eaten by the next level moves up; respiration heat leaves the ecosystem for good, which is why energy flows one way and is not recycled.') + '</p>';
    }
    function tapLevel(i){ pickLevel = pickLevel === i ? null : i; update(true); var g = card.querySelector('.ef-flowfig [data-lv="' + i + '"]'); if(g) g.focus(); }
    card.querySelector('.ef-flowfig').addEventListener('click', function(e){ var g = e.target.closest && e.target.closest('.ef-lvl'); if(g) tapLevel(+g.getAttribute('data-lv')); });
    card.querySelector('.ef-flowfig').addEventListener('keydown', function(e){ var g = e.target.closest && e.target.closest('.ef-lvl'); if(g && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); tapLevel(+g.getAttribute('data-lv')); } });

    /* ------------------------------------------------------- explain */
    function explain(s){
      var L = s.levels, out = [], top = L[L.length - 1];
      out.push('Producers (' + eco().organisms[0].toLowerCase() + ') capture ' + num(s.gpp) + ' kcal/m²/yr in photosynthesis (GPP). Their own cellular respiration releases ' + num(L[0].heat) + ' as heat, leaving NPP = ' + num(s.gpp) + ' − ' + num(L[0].heat) + ' = ' + num(s.npp) + ' kcal/m²/yr stored in new tissue.');
      for(var i = 1; i < L.length; i++){
        out.push(NAMES[i] + ' (' + eco().organisms[i].toLowerCase() + ') absorb ' + sig(L[i].inE) + ' of the ' + sig(L[i - 1].stored) + ' kcal stored below; ' + sig(L[i - 1].decomp) + ' is never eaten or absorbed and goes to decomposers. ' +
          'They burn ' + pct(st.resp) + ' of what they absorb in respiration (' + sig(L[i].heat) + ' lost as heat) and store ' + sig(L[i].stored) + ', which is ' + pct(st.eff) + ' of the level below.');
      }
      out.push('The top level stores ' + sig(top.stored) + ' kcal/m²/yr, ' + pct(s.topShare, s.topShare < 0.01 ? 2 : 1) + ' of NPP; when its members die, that energy goes to decomposers. In all, ' + num(s.heat) + ' kcal/m²/yr leaves as heat from respiration and ' + num(s.decomp) + ' goes to decomposers, which add up to the GPP.');
      var bm = L.map(function(x){ return x.biomass; }), inv = bm.some(function(b, i){ return i && b > bm[i - 1]; });
      out.push(inv ? 'Biomass: in this ecosystem a level can hold more mass than the level below, because the lower level (' + eco().organisms[0].toLowerCase() + ') is replaced many times a year. The energy pyramid still narrows at every step.'
        : 'Biomass: every level holds less mass than the one below, so the biomass pyramid narrows upward like the energy pyramid.');
      if(st.mode === 'toxin') out.push('Toxin: each level keeps ' + pct(st.retain) + ' of the toxin in the food it absorbs but burns ' + pct(st.resp) + ' of that food, so its concentration is ' + pct(st.retain) + ' ÷ (1 − ' + pct(st.resp) + ') = ' + M.fixed(s.factor, 2) + ' times its food’s: from ' + sig(L[0].conc) + ' ppm in producers to ' + sig(top.conc) + ' ppm at the top.');
      return out;
    }

    /* -------------------------------------------------------- update */
    function run(series){
      var es = series ? [0.05, 0.1, 0.15, 0.2] : [st.eff], skipped = [];
      es.forEach(function(e){
        if(st.resp > 1 - e + 1e-9){ skipped.push(pct(e)); return; }
        var s = E.simulate(cond({ eff: e })), top = s.levels[s.levels.length - 1];
        runs.push({ n: runs.length + 1, eco: eco().label, levels: st.levels, gpp: st.gpp, prodResp: st.prodResp, eff: e, resp: st.resp, npp: s.npp, top: top.stored, topB: top.biomass, heat: s.heat, conc: st.mode === 'toxin' ? top.conc : null });
      });
      T.event('apbio-sim-run', { tool: SLUG, n: es.length - skipped.length });
      var l = runs[runs.length - 1];
      card.querySelector('.bt-runnote').textContent = series ? 'Ran 5%, 10%, 15% and 20% passed on' + (skipped.length ? ' (skipped ' + skipped.join(', ') + ': consumer respiration too high for that fraction)' : '') + '. They are in the data table of runs.'
        : 'Trial ' + l.n + ': NPP ' + num(l.npp) + ', top level stores ' + sig(l.top) + ' kcal/m²/yr and holds ' + sig(l.topB) + ' g/m².';
      update(true);
    }
    function update(now){
      var s = E.simulate(cond()), L = s.levels, tox = st.mode === 'toxin';
      var labels = L.map(function(x, i){ return eco().organisms[i]; });
      flow(s);
      card.querySelector('.ef-chain').innerHTML = L.map(function(x, i){ return '<li><b>' + esc(eco().organisms[i]) + '</b> <span class="bt-small">' + esc(NAMES[i].toLowerCase()) + '</span></li>'; }).join('');
      card.querySelector('.ef-chain').setAttribute('aria-label', 'Food chain: ' + labels.join(', eaten by ') + '.');
      var energy = pyramid('Energy stored (kcal/m²/yr)', 'kcal', 'en', L.map(function(x){ return x.stored; }), labels, L.map(function(x){ return 'heat ' + sig(x.heat); }));
      var bm = L.map(function(x){ return x.biomass; }), inv = bm.some(function(b, i){ return i && b > bm[i - 1]; });
      var second = tox ? pyramid('Toxin concentration (ppm)', 'ppm', 'tx', L.map(function(x){ return x.conc; }), labels, null, 'The bars widen upward: the toxin is most concentrated at the top.')
        : pyramid('Biomass (g/m², dry)', 'g/m²', 'bm', bm, labels, null, inv ? 'Not a pyramid: a level holds more biomass than the level below it.' : '');
      card.querySelector('.ef-fig1').innerHTML = energy;
      card.querySelector('.ef-fig2').innerHTML = second;
      card.querySelector('.ef-key').textContent = 'Each bar is one trophic level, producers at the bottom; the number above it is its value' + (st.scale === 'log' ? '. Log scale: each equal step in width is the same multiple, so small levels stay visible.' : '. To scale: bar width is proportional to the value, so the top levels shrink to slivers.') +
        ' On the energy pyramid, "heat" is the energy that level lost in respiration (kcal/m²/yr).';
      var top = L[L.length - 1];
      var rows = [['GPP', num(s.gpp) + ' kcal/m²/yr'], ['Producer respiration (heat)', num(L[0].heat)], ['NPP', num(s.npp) + ' (' + pct(s.npp / s.gpp) + ' of GPP)'],
        ['Stored by the top level', sig(top.stored) + ' (' + pct(s.topShare, s.topShare < 0.01 ? 2 : 1) + ' of NPP)'], ['All heat from respiration', num(s.heat)], ['To decomposers', num(s.decomp)]];
      if(tox) rows.push(['Toxin at the top', sig(top.conc) + ' ppm'], ['Rise per level', '× ' + M.fixed(s.factor, 2)]);
      card.querySelector('.ef-out').innerHTML = rows.map(function(x){ return '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('');
      card.querySelector('.ef-explain ol').innerHTML = explain(s).map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('');
      say(setText() + '. NPP ' + num(s.npp) + '; stored per level: ' + L.map(function(x, i){ return eco().organisms[i] + ' ' + sig(x.stored); }).join(', ') + ' kcal/m²/yr; biomass ' + bm.map(sig).join(', ') + ' g/m²' + (tox ? '; toxin ' + L.map(function(x){ return sig(x.conc); }).join(', ') + ' ppm' : '') + '.', now);
      var cols = ['Trophic level', 'Absorbed (kcal/m²/yr)', 'Lost as heat', 'Not eaten or absorbed: to decomposers', 'Stored in new tissue', 'Biomass (g/m²)'].concat(tox ? ['Toxin (ppm)'] : []);
      var lrows = L.map(function(x, i){ return [esc(lname(i)), (i ? sig(x.inE) : num(x.inE) + ' (GPP)'), sig(x.heat), sig(x.decomp), sig(x.stored), sig(x.biomass)].concat(tox ? [sig(x.conc)] : []); });
      card.querySelector('.bt-tables').innerHTML =
        (runs.length ? T.dataTable(['Trial', 'Ecosystem', 'Levels', 'GPP', 'Producer respiration', 'Passed on', 'Consumer respiration', 'NPP', 'Top level stores (kcal/m²/yr)', 'Top level biomass (g/m²)', 'Top level toxin (ppm)'], runs.map(function(r){
          return [String(r.n), esc(r.eco), String(r.levels), num(r.gpp), pct(r.prodResp), pct(r.eff), pct(r.resp), num(r.npp), sig(r.top), sig(r.topB), r.conc == null ? '—' : sig(r.conc)];
        }), 'Your runs (' + runs.length + ')') : '<p class="bt-small">No runs yet. Use Run one trial or Run a series.</p>') +
        T.dataTable(cols, lrows, 'Every level: ' + esc(setText()) + ' (energy in kcal/m²/yr)');
    }
    build();
    update(true);
    T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
    if(data.frq) T.frq(app, data.frq, SLUG);
  });
})();
