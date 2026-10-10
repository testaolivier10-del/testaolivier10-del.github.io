/* AP® Chemistry live beaker: window.ApChemBeaker (docs/tools-upgrade.md,
   "Chem live beaker"). A beaker of countable particles with a pH or Q vs K
   readout that animates from one state to the next. Phase 2 wires it into
   the buffer, Q vs K, titration and ICE tools; nothing loads it yet.

     var b = ApChemBeaker.mount(el, {
       species: [{ key: 'HA', label: 'HA', mol: 'HA', name: 'acetic acid' },
                 { key: 'A-', label: 'A⁻', mol: 'A-', name: 'acetate' }],
       readout: 'pH',            // 'pH' | 'qk' | 'none'
       title: 'Acetic acid buffer',
       per: 0.01,                // M per particle (optional; said in the text)
       max: 30,                  // most particles drawn (counts scale down)
       seed: 7                   // particle layout
     });
     b.update({ counts: { HA: 6, 'A-': 4 }, pH: 4.57 });
     b.update({ counts: { A: 3, B: 3, AB: 4 }, Q: 1.8, K: 4 });   // readout 'qk'
     b.destroy();

   species[].mol is an ApChemMath.particles template (A, B, A2, AB, H2O,
   HA, A-, H3O+ ...): atoms drawn with their symbols, so color is never the
   only cue. Without one, a species is a token-colored disc with its label
   (tone 1-6 picks the color). state.note is appended to the description.

   Between states, particles of a species that grows take the places freed
   by a species that shrinks (HA -> A⁻ is drawn where it happens), new ones
   fade in, lost ones fade out, the pH marker or Q marker slides. With
   prefers-reduced-motion the end state is shown at once. The figure caption
   is a polite live region that says the counts and the readout in words.

   ApChemBeaker.pure holds the DOM-free parts (slots, assign, scale, phWord,
   qk, describe), tested in scripts/test/apchem-beaker.test.mjs. */
(function(){
  'use strict';
  var M = window.ApChemMath;
  var W = 300, H = 280, IN = { x0: 40, x1: 260, y0: 76, y1: 250 };

  /* ------------------------------------------------------- pure parts */
  function rng(seed){
    if(M && M.rng) return M.rng(seed);
    var s = (seed >>> 0) || 1;
    return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  /* Particle places inside the liquid: a jittered grid in a seeded order. */
  function slots(n, seed, box){
    box = box || IN;
    var w = box.x1 - box.x0, h = box.y1 - box.y0;
    var cols = Math.max(2, Math.round(Math.sqrt(n * w / h))), rows = Math.max(2, Math.ceil(n / cols));
    while(cols * rows < n) rows++;
    var cw = w / cols, ch = h / rows, r = rng(seed || 1), out = [];
    for(var i = 0; i < cols * rows; i++){
      out.push({ x: +(box.x0 + cw * (i % cols + 0.5) + (r() - 0.5) * cw * 0.16).toFixed(1),
                 y: +(box.y0 + ch * (Math.floor(i / cols) + 0.5) + (r() - 0.5) * ch * 0.16).toFixed(1),
                 a: +((r() - 0.5) * 0.9).toFixed(2) });
    }
    out.cell = Math.min(cw, ch);
    for(var j = out.length - 1; j > 0; j--){ var k = Math.floor(r() * (j + 1)), t = out[j]; out[j] = out[k]; out[k] = t; }
    return out;
  }
  /* Counts above max are scaled down together (each nonzero species keeps at
     least one), so a picture always fits. Returns { counts, factor }. */
  function scale(counts, max){
    var keys = Object.keys(counts || {}), total = 0;
    keys.forEach(function(k){ total += Math.max(0, Math.round(counts[k] || 0)); });
    var out = {};
    if(!max || total <= max){ keys.forEach(function(k){ out[k] = Math.max(0, Math.round(counts[k] || 0)); }); return { counts: out, factor: 1 }; }
    var f = max / total, sum = 0;
    keys.forEach(function(k){ var c = Math.max(0, counts[k] || 0); out[k] = c > 0 ? Math.max(1, Math.floor(c * f)) : 0; sum += out[k]; });
    // Hand the rounding remainder to the largest fractional parts.
    var rest = keys.filter(function(k){ return counts[k] > 0; }).sort(function(a, b){ return (counts[b] * f % 1) - (counts[a] * f % 1); });
    for(var i = 0; sum < max && rest.length; i = (i + 1) % rest.length){ out[rest[i]]++; sum++; }
    return { counts: out, factor: f };
  }
  /* assign(prev, counts, nSlots) -> next: a list of { id, key, slot }.
     Particles keep their slot and id while their species keeps them; a
     species that grows reuses the slots its neighbours just gave up first,
     then empty ones. Ids are stable, so the page can animate by id. */
  function assign(prev, counts, nSlots){
    prev = prev || [];
    var keep = [], freed = [], have = {}, used = {}, nextId = 0;
    prev.forEach(function(p){ nextId = Math.max(nextId, p.id + 1); });
    prev.forEach(function(p){
      have[p.key] = (have[p.key] || 0) + 1;
      if(have[p.key] <= (counts[p.key] || 0)){ keep.push(p); used[p.slot] = 1; }
      else freed.push(p.slot);
    });
    var free = freed.slice();
    for(var s = 0; s < nSlots; s++) if(!used[s] && free.indexOf(s) < 0) free.push(s);
    var out = keep.slice();
    Object.keys(counts).forEach(function(k){
      var n = (counts[k] || 0) - Math.min(have[k] || 0, counts[k] || 0);
      for(var i = 0; i < n && free.length; i++) out.push({ id: nextId++, key: k, slot: free.shift() });
    });
    return out;
  }
  function F(x, d){ var s = M && M.fixed ? M.fixed(x, d) : Number(x).toFixed(d); return s.charAt(0) === '-' ? '−' + s.slice(1) : s; }
  function sci(x){ if(M && M.fmt) return M.fmt(x, 2); return Number(x).toPrecision(2); }
  function phWord(pH){
    if(!isFinite(pH)) return '';
    if(pH < 6.95) return 'acidic';
    if(pH > 7.05) return 'basic';
    return 'neutral';
  }
  /* Q against K: which way the reaction runs. Equal within 1%. */
  function qk(Q, K){
    if(!(isFinite(Q) && isFinite(K)) || K <= 0) return { dir: '', text: '' };
    var r = Q / K;
    if(Math.abs(r - 1) <= 0.01) return { dir: 'eq', sign: '=', text: 'Q = K: the mixture is at equilibrium, so there is no net change.' };
    if(r < 1) return { dir: 'fwd', sign: '<', text: 'Q < K: the forward reaction runs, making products until Q = K.' };
    return { dir: 'rev', sign: '>', text: 'Q > K: the reverse reaction runs, making reactants until Q = K.' };
  }
  function listWords(a){ return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  /* The words for one state: counts by species name, then the readout. */
  function describe(state, o){
    o = o || {};
    var sp = o.species || [], counts = state.counts || {};
    var parts = sp.filter(function(s){ return counts[s.key] > 0; }).map(function(s){ var n = counts[s.key]; return n + ' ' + (s.name || s.label || s.key) + (s.name ? '' : n === 1 ? ' particle' : ' particles'); });
    var t = (o.title ? o.title + ': ' : '') + 'the beaker holds ' + (parts.length ? listWords(parts) : 'no particles of these species') + '.';
    if(state.scaled && state.scaled !== 1) t += ' Particles are scaled down to fit; the ratios are kept.';
    if(o.readout === 'pH' && isFinite(state.pH)) t += ' pH ' + F(state.pH, 2) + ', ' + phWord(state.pH) + '.';
    if(o.readout === 'qk' && isFinite(state.Q) && isFinite(state.K)) t += ' Q = ' + sci(state.Q) + ' and K = ' + sci(state.K) + '. ' + qk(state.Q, state.K).text;
    if(state.note) t += ' ' + state.note;
    return t;
  }

  /* ------------------------------------------------------------ view */
  var uid = 0;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function reduced(){
    try{ if(window.LevlMotion && window.LevlMotion.reduced) return !!window.LevlMotion.reduced(); return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; }
  }
  var NS = 'http://www.w3.org/2000/svg';
  function particleSvg(s, a){
    if(s.mol && M && M.particles && M.particles.mol) return M.particles.mol(s.mol, 0, 0, a || 0);
    var lab = s.label || s.key;
    return '<g class="lb-disc lb-t' + (s.tone || 1) + '"><circle r="11"/><text y="4" text-anchor="middle" font-size="' + (lab.length > 2 ? 8 : 10) + '">' + esc(lab) + '</text></g>';
  }
  function mount(el, opts){
    if(!el) return null;
    var o = Object.assign({ readout: 'pH', max: 30, seed: 7, species: [] }, opts || {});
    var id = 'lb' + (++uid), spByKey = {};
    o.species.forEach(function(s, i){ if(!s.tone) s.tone = (i % 6) + 1; spByKey[s.key] = s; });
    var SL = slots(o.max, o.seed), placed = [], timers = [], alive = true;
    // Shrink particles to the cell so the widest (about 40 units) never overlap.
    var K = Math.min(1, (SL.cell - 2) / 40).toFixed(3);
    el.classList.add('lb');
    el.innerHTML = '<figure class="lb-fig">' +
      '<svg class="lb-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="' + id + '-d">' +
        '<path class="lb-liquid" d="M' + (IN.x0 - 6) + ' ' + (IN.y0 - 12) + 'H' + (IN.x1 + 6) + 'V' + (IN.y1 + 2) + 'Q' + (IN.x1 + 6) + ' ' + (IN.y1 + 14) + ' ' + (IN.x1 - 6) + ' ' + (IN.y1 + 14) + 'H' + (IN.x0 + 6) + 'Q' + (IN.x0 - 6) + ' ' + (IN.y1 + 14) + ' ' + (IN.x0 - 6) + ' ' + (IN.y1 + 2) + 'Z"/>' +
        '<path class="lb-glass" d="M' + (IN.x0 - 14) + ' 34 l8 6 V' + (IN.y1 + 2) + 'Q' + (IN.x0 - 6) + ' ' + (IN.y1 + 22) + ' ' + (IN.x0 + 12) + ' ' + (IN.y1 + 22) + 'H' + (IN.x1 - 12) + 'Q' + (IN.x1 + 6) + ' ' + (IN.y1 + 22) + ' ' + (IN.x1 + 6) + ' ' + (IN.y1 + 2) + 'V40 l6 -6"/>' +
        '<g class="lb-ticks">' + [0, 1, 2].map(function(i){ var y = IN.y0 + 8 + i * 44; return '<path d="M' + (IN.x1 + 6) + ' ' + y + 'h-14"/>'; }).join('') + '</g>' +
        '<g class="lb-parts"></g>' +
      '</svg>' +
      '<div class="lb-side"><div class="lb-read" aria-hidden="true"></div><ul class="lb-legend" aria-hidden="true"></ul></div>' +
      '<figcaption class="lb-desc" id="' + id + '-d"></figcaption></figure>';
    var g = el.querySelector('.lb-parts'), read = el.querySelector('.lb-read'), legend = el.querySelector('.lb-legend'), cap = el.querySelector('.lb-desc');
    var say = window.ApChemTools && window.ApChemTools.announcer ? window.ApChemTools.announcer(cap) : function(t){ cap.textContent = t; };
    if(!(window.ApChemTools && window.ApChemTools.announcer)){ cap.setAttribute('aria-live', 'polite'); cap.setAttribute('role', 'status'); }
    var first = true;

    function readoutHtml(st){
      if(o.readout === 'pH' && isFinite(st.pH)){
        var x = Math.max(0, Math.min(14, st.pH)) / 14 * 100;
        return '<p class="lb-big">pH <b>' + F(st.pH, 2) + '</b> <span>' + phWord(st.pH) + '</span></p>' +
          '<div class="lb-scale"><span class="lb-scale-bar"></span><span class="lb-mark" style="left:' + x.toFixed(1) + '%"></span><span class="lb-scale-l">0</span><span class="lb-scale-m">7</span><span class="lb-scale-r">14</span></div>';
      }
      if(o.readout === 'qk' && isFinite(st.Q) && isFinite(st.K)){
        var c = qk(st.Q, st.K), lq = Math.log10(Math.max(st.Q, 1e-30)), lk = Math.log10(st.K);
        // A log axis centred on K, two decades each way.
        var pos = function(l){ return Math.max(0, Math.min(100, 50 + (l - lk) * 25)); };
        return '<p class="lb-big">Q <b>' + esc(sci(st.Q)) + '</b> ' + c.sign + ' K <b>' + esc(sci(st.K)) + '</b></p>' +
          '<div class="lb-scale lb-qk"><span class="lb-scale-bar"></span><span class="lb-k" style="left:50%"></span><span class="lb-mark" style="left:' + pos(lq).toFixed(1) + '%"></span><span class="lb-scale-l">reactants favored</span><span class="lb-scale-r">products</span></div>' +
          '<p class="lb-dir lb-' + c.dir + '">' + (c.dir === 'fwd' ? 'Forward →' : c.dir === 'rev' ? '← Reverse' : 'At equilibrium') + '</p>';
      }
      return '';
    }
    function update(state){
      if(!alive) return;
      state = state || {};
      var sc = scale(state.counts || {}, o.max), counts = sc.counts, quick = first || reduced();
      var next = assign(placed, counts, SL.length), byId = {};
      next.forEach(function(p){ byId[p.id] = p; });
      // Leaving particles fade out, then go.
      placed.forEach(function(p){
        if(byId[p.id]) return;
        var n = g.querySelector('[data-id="' + p.id + '"]');
        if(!n) return;
        if(quick){ n.remove(); return; }
        n.classList.add('is-out');
        timers.push(setTimeout(function(){ if(n.parentNode) n.remove(); }, 500));
      });
      next.forEach(function(p){
        var s = SL[p.slot], n = g.querySelector('[data-id="' + p.id + '"]');
        var tf = 'translate(' + s.x + 'px,' + s.y + 'px) scale(' + K + ')';
        if(!n){
          n = document.createElementNS(NS, 'g');
          n.setAttribute('class', 'lb-p' + (quick ? '' : ' is-in'));
          n.setAttribute('data-id', p.id);
          n.setAttribute('data-k', p.key);
          n.innerHTML = particleSvg(spByKey[p.key] || { key: p.key }, s.a);
          n.style.transform = tf;
          g.appendChild(n);
          if(!quick) requestAnimationFrame(function(){ requestAnimationFrame(function(){ n.classList.remove('is-in'); }); });
        } else n.style.transform = tf;
      });
      placed = next;
      // Slide the marker from where it was (the readout is redrawn each time).
      var old = read.querySelector('.lb-mark'), from = old && old.style.left;
      read.innerHTML = readoutHtml(state);
      var mk = read.querySelector('.lb-mark');
      if(mk && from && !quick){ var to = mk.style.left; mk.style.transition = 'none'; mk.style.left = from; mk.getBoundingClientRect(); mk.style.transition = ''; mk.style.left = to; }
      legend.innerHTML = o.species.map(function(s){ return '<li><svg viewBox="-16 -16 32 32" class="lb-key">' + particleSvg(s) + '</svg><span>' + esc(s.label || s.key) + '</span> <b>' + (counts[s.key] || 0) + '</b></li>'; }).join('');
      var text = describe({ counts: counts, pH: state.pH, Q: state.Q, K: state.K, note: state.note, scaled: sc.factor }, o);
      say(text, first);
      first = false;
    }
    function destroy(){
      alive = false;
      timers.forEach(clearTimeout);
      el.classList.remove('lb');
      el.innerHTML = '';
    }
    return { update: update, destroy: destroy, el: el };
  }

  /* A demo nothing calls (Phase 2 reference): an acetic acid buffer taking
     strong base, three steps a second apart. ApChemBeaker.demo(el). */
  function demo(el){
    var b = mount(el, { title: 'Acetic acid buffer', readout: 'pH', species: [
      { key: 'HA', label: 'HA', mol: 'HA', name: 'HA (acetic acid)' }, { key: 'A-', label: 'A⁻', mol: 'A-', name: 'A⁻ (acetate)' }] });
    var pKa = 4.74, steps = [[12, 8], [9, 11], [5, 15]], i = 0;
    function go(){ var s = steps[i++]; b.update({ counts: { HA: s[0], 'A-': s[1] }, pH: pKa + Math.log10(s[1] / s[0]) }); if(i < steps.length) setTimeout(go, 1000); }
    go();
    return b;
  }

  window.ApChemBeaker = { mount: mount, demo: demo, pure: { slots: slots, scale: scale, assign: assign, phWord: phWord, qk: qk, describe: describe } };
})();
