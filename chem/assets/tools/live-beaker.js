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
    var cols = Math.max(2, Math.round(Math.sqrt(n * w / h / 1.5))), rows = Math.max(2, Math.ceil(n / cols));
    while(cols * rows < n) rows++;
    var cw = w / cols, ch = h / rows, r = rng(seed || 1), out = [];
    for(var i = 0; i < cols * rows; i++){
      out.push({ x: +(box.x0 + cw * (i % cols + 0.5) + (r() - 0.5) * cw * 0.16).toFixed(1),
                 y: +(box.y0 + ch * (Math.floor(i / cols) + 0.5) + (r() - 0.5) * ch * 0.16).toFixed(1),
                 a: +((r() - 0.5) * 0.9).toFixed(2) });
    }
    out.cell = Math.min(cw, ch); out.cw = cw; out.ch = ch;
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
  // A formula as typed (H₂, NO₂) to an ApChemMath.particles template key.
  function molKey(s){
    var k = String(s.label || s.key || '').replace(/[₀-₉]/g, function(c){ return String(c.charCodeAt(0) - 8320); });
    return M && M.particles && M.particles.has && M.particles.has(k) ? k : '';
  }
  function particleSvg(s, a){
    var mk = s.mol || molKey(s);
    if(mk && M && M.particles && M.particles.mol) return M.particles.mol(mk, 0, 0, a || 0);
    var lab = s.label || s.key, r = 11;
    // A species with no atom template is one shaded sphere with its formula.
    return '<g class="lb-disc lb-t' + (s.tone || 1) + '"><circle r="' + r + '"/>' +
      '<path class="lb-shade" d="M-7.8 7.8A11 11 0 0 0 7.8 -7.8A12.6 12.6 0 0 1 -7.8 7.8Z"/>' +
      '<ellipse class="lb-hi" cx="-4" cy="-4.4" rx="4" ry="2.6" transform="rotate(-35 -4 -4.4)"/>' +
      '<text y="' + (lab.length > 2 ? 3 : 3.6) + '" text-anchor="middle" font-size="' + (lab.length > 3 ? 7 : lab.length > 2 ? 8 : 10) + '">' + esc(lab) + '</text></g>';
  }
  /* Places inside a curved region (the magnifier lens of the flask view): a
     staggered grid just fine enough to hold n, in a seeded order. */
  function regionSlots(n, seed, inside, bx){
    var d = Math.max(bx.x1 - bx.x0, bx.y1 - bx.y0), pts = [];
    for(var guard = 0; guard < 80; guard++){
      pts = [];
      for(var row = 0, y = bx.y0 + d / 2; y < bx.y1; y += d * 0.88, row++)
        for(var x = bx.x0 + d / 2 + (row % 2 ? d / 2 : 0); x < bx.x1; x += d) if(inside(x, y)) pts.push([x, y]);
      if(pts.length >= n) break;
      d *= 0.94;
    }
    var r = rng(seed || 1), out = pts.map(function(q){ return { x: +(q[0] + (r() - 0.5) * d * 0.14).toFixed(1), y: +(q[1] + (r() - 0.5) * d * 0.14).toFixed(1), a: +((r() - 0.5) * 0.9).toFixed(2) }; });
    for(var j = out.length - 1; j > 0; j--){ var k = Math.floor(r() * (j + 1)), t = out[j]; out[j] = out[k]; out[k] = t; }
    out.cell = d * 0.94;
    return out;
  }
  function f1(x){ return (+x).toFixed(1); }

  /* Glassware. Every vessel is drawn from a few shared parts: a glass body
     (pale fill, a crisp edge and two highlight streaks), the liquid with its
     meniscus, and printed graduations. Colors are theme tokens (chem-tools.css).
     vessel: 'beaker' (default; a graduated beaker), 'gas' (a stoppered gas
     jar, no liquid) or 'flask' (an Erlenmeyer flask under a burette on a
     stand, with a magnifier that shows the particles). */
  function glassBeaker(gas){
    var x0 = IN.x0 - 6, x1 = IN.x1 + 6, yb = IN.y1 + 14, top = gas ? 44 : 34;
    var body = 'M' + (x0 - 2) + ' ' + top + ' V' + (yb - 14) + ' Q' + (x0 - 2) + ' ' + (yb + 2) + ' ' + (x0 + 14) + ' ' + (yb + 2) + ' H' + (x1 - 14) + ' Q' + (x1 + 2) + ' ' + (yb + 2) + ' ' + (x1 + 2) + ' ' + (yb - 14) + ' V' + top;
    var lip = gas ? '' : '<path class="lb-glass-edge" d="M' + (x0 - 2) + ' ' + top + ' q-3 -4 -9 -6 M' + (x1 + 2) + ' ' + top + ' q3 -2 5 -4"/>';
    var surf = 64, liquid = gas
      ? '<rect class="lb-gas" x="' + x0 + '" y="' + (top + 4) + '" width="' + (x1 - x0) + '" height="' + (yb - top - 4) + '" rx="12"/>'
      : '<path class="lb-water" d="M' + x0 + ' ' + (surf - 3) + ' Q' + ((x0 + x1) / 2) + ' ' + (surf + 5) + ' ' + x1 + ' ' + (surf - 3) + ' V' + (yb - 14) + ' Q' + x1 + ' ' + yb + ' ' + (x1 - 14) + ' ' + yb + ' H' + (x0 + 14) + ' Q' + x0 + ' ' + yb + ' ' + x0 + ' ' + (yb - 14) + 'Z"/>' +
        '<path class="lb-liquid" d="M' + x0 + ' ' + (surf - 3) + ' Q' + ((x0 + x1) / 2) + ' ' + (surf + 5) + ' ' + x1 + ' ' + (surf - 3) + ' V' + (yb - 14) + ' Q' + x1 + ' ' + yb + ' ' + (x1 - 14) + ' ' + yb + ' H' + (x0 + 14) + ' Q' + x0 + ' ' + yb + ' ' + x0 + ' ' + (yb - 14) + 'Z"/>' +
        '<path class="lb-meniscus" d="M' + (x0 + 1) + ' ' + (surf - 3) + ' Q' + ((x0 + x1) / 2) + ' ' + (surf + 5) + ' ' + (x1 - 1) + ' ' + (surf - 3) + '"/>';
    var grads = '', labs = ['250', '200', '150', '100', '50'];
    for(var i = 0; i < (gas ? 0 : 5); i++){
      var y = 70 + i * 38;
      grads += '<path d="M' + (x1 - 4) + ' ' + y + 'h-18' + (i < 4 ? 'M' + (x1 - 4) + ' ' + (y + 19) + 'h-9' : '') + '"/><text x="' + (x1 - 26) + '" y="' + (y + 3.5) + '" text-anchor="end">' + labs[i] + '</text>';
    }
    var stopper = gas ? '<path class="lb-stopper" d="M' + (150 - 34) + ' 46 h68 l-6 -16 h-56 Z"/><rect class="lb-stopper" x="' + (150 - 40) + '" y="22" width="80" height="10" rx="4"/>' +
      '<path class="lb-glass-edge" d="M' + (x0 - 2) + ' ' + top + ' H' + (150 - 34) + ' M' + (150 + 34) + ' ' + top + ' H' + (x1 + 2) + '"/>' : '';
    return {
      back: '<path class="lb-glass-fill" d="' + body + 'Z"/>' + liquid,
      front: '<g class="lb-grad">' + grads + (gas ? '' : '<text class="lb-cap" x="' + (x0 + 12) + '" y="' + (yb - 10) + '">' + 'mL' + '</text>') + '</g>' +
        '<path class="lb-glass" d="' + body + '"/>' + lip + stopper +
        '<path class="lb-shine" d="M' + (x0 + 8) + ' ' + (top + 20) + ' V' + (yb - 30) + '"/><path class="lb-shine lb-shine2" d="M' + (x0 + 16) + ' ' + (top + 28) + ' V' + (top + 70) + '"/>'
    };
  }
  // Flask view geometry (viewBox 460 x 360).
  var FL = { cx: 104, neckL: 88, neckR: 120, shoulder: 206, foot: 322, bottom: 340, surf: 262, loupe: { x: 104, y: 300, r: 16 }, lens: { x: 350, y: 184, r: 132 } };
  function flaskHalf(y){ return 16 + (y - FL.shoulder) / (FL.foot - FL.shoulder) * 66; }
  function tangents(a, b){
    // The two outer tangent lines of circles a and b (for the magnifier).
    var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy), th = Math.atan2(dy, dx), al = Math.acos((a.r - b.r) / d), out = [];
    [1, -1].forEach(function(sg){ var t = th + sg * al; out.push([a.x + a.r * Math.cos(t), a.y + a.r * Math.sin(t), b.x + b.r * Math.cos(t), b.y + b.r * Math.sin(t)]); });
    return out;
  }
  function glassFlask(id){
    var hw = flaskHalf(FL.surf), lx = FL.cx - hw + 2, rx = FL.cx + hw - 2;
    var body = 'M' + FL.neckL + ' 172 V' + FL.shoulder + ' L22 ' + FL.foot + ' Q16 ' + FL.bottom + ' 36 ' + FL.bottom + ' H172 Q192 ' + FL.bottom + ' 186 ' + FL.foot + ' L' + FL.neckR + ' ' + FL.shoulder + ' V172';
    var liq = 'M' + f1(lx) + ' ' + FL.surf + ' L24.6 ' + (FL.foot - 1) + ' Q19.5 ' + (FL.bottom - 3) + ' 36 ' + (FL.bottom - 3) + ' H172 Q188.5 ' + (FL.bottom - 3) + ' 183.4 ' + (FL.foot - 1) + ' L' + f1(rx) + ' ' + FL.surf + ' Q' + FL.cx + ' ' + (FL.surf + 7) + ' ' + f1(lx) + ' ' + FL.surf + 'Z';
    var L = FL.lens, lo = FL.loupe, tg = tangents(lo, L);
    var grads = '';
    for(var i = 0; i <= 12; i++){ var y = 12 + i * 10; grads += '<path d="M98 ' + y + 'h' + (i % 5 === 0 ? 7 : 4) + '"/>'; }
    var stand = '<rect class="lb-stand" x="8" y="' + FL.bottom + '" width="196" height="12" rx="3"/><rect class="lb-stand" x="17" y="4" width="7" height="' + (FL.bottom - 4) + '" rx="2"/>' +
      '<rect class="lb-stand" x="24" y="44" width="72" height="6" rx="2"/><rect class="lb-clamp" x="92" y="38" width="24" height="18" rx="4"/>';
    var burette = '<rect class="lb-glass-fill" x="98" y="2" width="12" height="132" rx="3"/>' +
      '<rect class="lb-titrant" x="99.5" y="8" width="9" height="125" rx="1.5"/>' +
      '<g class="lb-grad lb-bgrad">' + grads + '</g>' +
      '<rect class="lb-glass" x="98" y="2" width="12" height="132" rx="3"/>' +
      '<rect class="lb-cock" x="95" y="132" width="18" height="11" rx="2.5"/><rect class="lb-cock-h" x="84" y="135" width="40" height="5" rx="2.5"/>' +
      '<path class="lb-glass" d="M100 143 L102.6 166 H105.4 L108 143"/>' +
      '<circle class="lb-drop" cx="104" cy="170" r="3.2"/>';
    var flask = '<path class="lb-glass-fill" d="' + body + 'Z"/>' +
      '<path class="lb-water" d="' + liq + '"/><path class="lb-liquid" d="' + liq + '"/>' +
      '<path class="lb-meniscus" d="M' + f1(lx + 1) + ' ' + FL.surf + ' Q' + FL.cx + ' ' + (FL.surf + 7) + ' ' + f1(rx - 1) + ' ' + FL.surf + '"/>' +
      '<path class="lb-glass" d="' + body + '"/><rect class="lb-glass lb-lip" x="84" y="168" width="40" height="6" rx="3"/>' +
      '<path class="lb-shine" d="M' + (FL.neckL + 5) + ' 180 V' + (FL.shoulder - 2) + ' M' + (FL.neckL - 8) + ' ' + (FL.shoulder + 20) + ' L36 ' + (FL.foot - 10) + '"/>';
    var lens = '<path class="lb-lead" d="M' + f1(tg[0][0]) + ' ' + f1(tg[0][1]) + 'L' + f1(tg[0][2]) + ' ' + f1(tg[0][3]) + 'M' + f1(tg[1][0]) + ' ' + f1(tg[1][1]) + 'L' + f1(tg[1][2]) + ' ' + f1(tg[1][3]) + '"/>' +
      '<circle class="lb-loupe" cx="' + lo.x + '" cy="' + lo.y + '" r="' + lo.r + '"/>' +
      '<circle class="lb-lens-bg" cx="' + L.x + '" cy="' + L.y + '" r="' + L.r + '"/><circle class="lb-liquid lb-lens-tint" cx="' + L.x + '" cy="' + L.y + '" r="' + L.r + '"/>';
    var lensFront = '<circle class="lb-lens-ring" cx="' + L.x + '" cy="' + L.y + '" r="' + L.r + '"/><path class="lb-lens-shine" d="M' + f1(L.x - L.r * 0.8) + ' ' + f1(L.y - L.r * 0.36) + ' A' + (L.r - 10) + ' ' + (L.r - 10) + ' 0 0 1 ' + f1(L.x - L.r * 0.3) + ' ' + f1(L.y - L.r * 0.82) + '"/>' +
      '<text class="lb-lens-cap" x="' + L.x + '" y="' + (L.y + L.r + 22) + '" text-anchor="middle">particle view of the flask</text>';
    return { back: stand + burette + flask + lens, front: lensFront };
  }
  function mount(el, opts){
    if(!el) return null;
    var o = Object.assign({ readout: 'pH', max: 30, seed: 7, species: [], vessel: 'beaker' }, opts || {});
    var id = 'lb' + (++uid), spByKey = {}, flask = o.vessel === 'flask';
    o.species.forEach(function(s, i){ if(!s.tone) s.tone = (i % 6) + 1; spByKey[s.key] = s; });
    var L = FL.lens, SL = flask ? regionSlots(o.max, o.seed, function(x, y){ var dx = x - L.x, dy = y - L.y; return dx * dx + dy * dy <= (L.r - 19) * (L.r - 19); }, { x0: L.x - L.r, x1: L.x + L.r, y0: L.y - L.r, y1: L.y + L.r }) : slots(o.max, o.seed);
    var placed = [], timers = [], alive = true;
    // Size particles to the cell so the widest (about 32 units) never overlap.
    // Molecules are wider than tall (a diatomic is about 36 x 20 units), so
    // the cell's width and height limit the size separately.
    var K = (flask ? Math.min(1.3, (SL.cell - 1) / 32) : Math.min(1.05, (SL.cw - 3) / 36, (SL.ch - 3) / 22)).toFixed(3);
    var art = flask ? glassFlask(id) : glassBeaker(o.vessel === 'gas');
    el.classList.add('lb');
    if(flask) el.classList.add('lb-is-flask');
    el.innerHTML = '<figure class="lb-fig">' +
      '<svg class="lb-svg lb-v-' + esc(o.vessel) + '" viewBox="0 0 ' + (flask ? '486 376' : W + ' ' + H) + '" role="img" aria-labelledby="' + id + '-d">' +
        art.back + '<g class="lb-parts"></g>' + art.front +
      '</svg>' +
      '<div class="lb-side"><div class="lb-read" aria-hidden="true"></div><ul class="lb-legend" aria-hidden="true"></ul></div>' +
      '<figcaption class="lb-desc" id="' + id + '-d"></figcaption></figure>';
    var g = el.querySelector('.lb-parts'), read = el.querySelector('.lb-read'), legend = el.querySelector('.lb-legend'), cap = el.querySelector('.lb-desc');
    var say = window.ApChemTools && window.ApChemTools.announcer ? window.ApChemTools.announcer(cap) : function(t){ cap.textContent = t; };
    if(!(window.ApChemTools && window.ApChemTools.announcer)){ cap.setAttribute('aria-live', 'polite'); cap.setAttribute('role', 'status'); }
    var first = true, lastBur = null;

    function phScale(pH){
      var x = Math.max(0, Math.min(14, pH)) / 14 * 100, t = '';
      for(var i = 0; i <= 14; i++) t += '<i style="left:' + (i / 14 * 100).toFixed(2) + '%"' + (i % 7 === 0 ? ' class="lb-tk7"' : '') + '></i>';
      return '<div class="lb-scale lb-ph"><span class="lb-scale-bar"></span><span class="lb-tks">' + t + '</span><span class="lb-mark" style="left:' + x.toFixed(1) + '%"></span>' +
        '<span class="lb-scale-l">0 acidic</span><span class="lb-scale-m">7</span><span class="lb-scale-r">basic 14</span></div>';
    }
    function readoutHtml(st){
      if(o.readout === 'pH' && isFinite(st.pH)){
        return '<div class="lb-meter"><span class="lb-meter-k">pH</span><b class="lb-meter-v">' + F(st.pH, 2) + '</b><span class="lb-meter-w lb-w-' + phWord(st.pH) + '">' + phWord(st.pH) + '</span></div>' + phScale(st.pH);
      }
      if(o.readout === 'qk' && isFinite(st.Q) && isFinite(st.K)){
        var c = qk(st.Q, st.K), lq = Math.log10(Math.max(st.Q, 1e-30)), lk = Math.log10(st.K);
        // A log axis centred on K, two decades each way.
        var pos = function(l){ return Math.max(0, Math.min(100, 50 + (l - lk) * 25)); }, t = '';
        ['÷100', '÷10', '', '×10', '×100'].forEach(function(w, i){ t += '<i style="left:' + (i * 25) + '%"' + (i === 2 ? ' class="lb-tk7"' : '') + '></i>' + (i === 0 || i === 4 ? '<em class="lb-e' + i + '" style="left:' + (i * 25) + '%">' + w + '</em>' : ''); });
        return '<div class="lb-meter lb-meter-qk"><span class="lb-meter-k">Q</span><b class="lb-meter-v">' + esc(sci(st.Q)) + '</b><span class="lb-meter-sign">' + c.sign + '</span><span class="lb-meter-k">K</span><b class="lb-meter-v">' + esc(sci(st.K)) + '</b></div>' +
          '<div class="lb-scale lb-qk lb-' + c.dir + '"><span class="lb-scale-bar"></span><span class="lb-tks">' + t + '</span><span class="lb-k" style="left:50%"><b>K</b></span><span class="lb-mark" style="left:' + pos(lq).toFixed(1) + '%"><b>Q</b></span></div>' +
          '<p class="lb-dir lb-' + c.dir + '">' + (c.dir === 'fwd' ? 'Q < K: runs forward →' : c.dir === 'rev' ? '← Q > K: runs in reverse' : 'Q = K: at equilibrium') + '</p>';
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
      // The burette drains as titrant goes in; a drop falls when it does.
      if(flask && isFinite(state.burette)){
        var f = Math.max(0, Math.min(1, state.burette)), tr = el.querySelector('.lb-titrant'), top = 8 + f * 118;
        tr.setAttribute('y', top.toFixed(1)); tr.setAttribute('height', (133 - top).toFixed(1));
        if(lastBur != null && f > lastBur + 1e-9 && !reduced()){
          var dr = el.querySelector('.lb-drop'); dr.classList.remove('is-dripping'); dr.getBoundingClientRect(); dr.classList.add('is-dripping');
        }
        lastBur = f;
      }
      // Slide the marker from where it was (the readout is redrawn each time).
      var old = read.querySelector('.lb-mark'), from = old && old.style.left;
      read.innerHTML = readoutHtml(state);
      var mk = read.querySelector('.lb-mark');
      if(mk && from && !quick){ var to = mk.style.left; mk.style.transition = 'none'; mk.style.left = from; mk.getBoundingClientRect(); mk.style.transition = ''; mk.style.left = to; }
      legend.innerHTML = o.species.map(function(s){ return '<li><svg viewBox="-17 -17 34 34" class="lb-key">' + particleSvg(s) + '</svg><span>' + esc(s.label || s.key) + '</span> <b>' + (counts[s.key] || 0) + '</b></li>'; }).join('');
      var text = describe({ counts: counts, pH: state.pH, Q: state.Q, K: state.K, note: state.note, scaled: sc.factor }, o);
      say(text, first);
      first = false;
    }
    function destroy(){
      alive = false;
      timers.forEach(clearTimeout);
      el.classList.remove('lb', 'lb-is-flask');
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

  window.ApChemBeaker = { mount: mount, demo: demo, pure: { slots: slots, regionSlots: regionSlots, scale: scale, assign: assign, phWord: phWord, qk: qk, describe: describe } };
})();
