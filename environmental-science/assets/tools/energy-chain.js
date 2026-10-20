/* Energy chain trainer page (docs/apenv-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T3). Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.energyChain (environmental-science/assets/tools/math/energy-chain.js), the
   content environmental-science/data/tools/energy-chain.json (served filtered as
   assets/tool-data/energy-chain.json).

   Explore, two views:
     Follow the energy  100 units of energy from the resource to the outlet:
                        a flow band (its width is the energy left) through
                        illustrated stages (fuel, boiler or reactor or rotor,
                        turbine, generator, power lines, home), with each
                        step's waste heat peeling off below it. Tap a stage
                        (or Tab to it) for what it loses and why. Control: the
                        source chips. Details: a month of a home's
                        electricity traced back to its fuel and CO2.
     Compare sources    bars across the six sources for one measure (life-
                        cycle CO2, efficiency, capacity factor), with tags for
                        dispatchable and intermittent.
   Test yourself: ApEnvTools.drill over the model's generate(), each problem
   with a figure from its own numbers. */
(function(){
  'use strict';
  var T = window.ApEnvTools, M = window.ApEnvMath;
  if(!T || !M || !M.energyChain) return;
  var E = M.energyChain, esc = T.esc;
  function n2(x){ return (+x).toFixed(1); }
  function f0(x){ return T.F(x, 0); }
  function f1(x){ return T.F(x, 1); }
  function big(x){ var s = String(x).split('.'); s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return s.join('.'); }
  function txt(x, y, s, cls, anchor){ return '<text class="' + (cls || 'ech-t') + '" x="' + n2(x) + '" y="' + n2(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + s + '</text>'; }

  T.mount('energy-chain', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'energy-chain',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ============================================== stage illustrations
     Each draws a small picture centered at (x, y), size s (about 1 = 40 px). */
  var ICON = {
    coal: function(x, y, s){ var o = '<g class="ech-ic ech-ic-coal">'; [[-10, 6, 9], [4, 7, 10], [-3, -4, 9], [11, -2, 7], [-14, -6, 6]].forEach(function(r){ o += '<path d="M' + n2(x + r[0] * s - r[2] * s) + ' ' + n2(y + r[1] * s) + 'l' + n2(r[2] * s * 0.6) + ' ' + n2(-r[2] * s * 0.9) + 'l' + n2(r[2] * s * 1.1) + ' ' + n2(r[2] * s * 0.2) + 'l' + n2(r[2] * s * 0.4) + ' ' + n2(r[2] * s * 0.8) + 'z"/>'; }); return o + '</g>'; },
    gas: function(x, y, s){ return '<g class="ech-ic ech-ic-gas"><path d="M' + n2(x) + ' ' + n2(y - 18 * s) + 'c' + n2(10 * s) + ' ' + n2(10 * s) + ' ' + n2(14 * s) + ' ' + n2(18 * s) + ' ' + n2(8 * s) + ' ' + n2(28 * s) + 'c-' + n2(4 * s) + ' ' + n2(6 * s) + ' -' + n2(12 * s) + ' ' + n2(6 * s) + ' -' + n2(16 * s) + ' 0c-' + n2(6 * s) + ' -' + n2(10 * s) + ' ' + n2(2 * s) + ' -' + n2(18 * s) + ' ' + n2(8 * s) + ' -' + n2(28 * s) + 'z"/><path class="ech-ic-in" d="M' + n2(x) + ' ' + n2(y - 2 * s) + 'c' + n2(5 * s) + ' ' + n2(5 * s) + ' ' + n2(6 * s) + ' ' + n2(10 * s) + ' ' + n2(2 * s) + ' ' + n2(14 * s) + 'c-' + n2(2 * s) + ' ' + n2(2 * s) + ' -' + n2(5 * s) + ' ' + n2(2 * s) + ' -' + n2(6 * s) + ' 0c-' + n2(2 * s) + ' -' + n2(4 * s) + ' ' + n2(1 * s) + ' -' + n2(9 * s) + ' ' + n2(4 * s) + ' -' + n2(14 * s) + 'z"/></g>'; },
    nuclear: function(x, y, s){ var o = '<g class="ech-ic ech-ic-nuc"><circle cx="' + n2(x) + '" cy="' + n2(y) + '" r="' + n2(4 * s) + '"/>'; for(var i = 0; i < 3; i++){ var a = i * 60; o += '<ellipse cx="' + n2(x) + '" cy="' + n2(y) + '" rx="' + n2(17 * s) + '" ry="' + n2(6.5 * s) + '" transform="rotate(' + a + ' ' + n2(x) + ' ' + n2(y) + ')" class="ech-orb"/>'; } return o + '</g>'; },
    hydro: function(x, y, s){ return '<g class="ech-ic ech-ic-hydro"><path class="ech-dam" d="M' + n2(x - 4 * s) + ' ' + n2(y - 18 * s) + 'h' + n2(8 * s) + 'l' + n2(6 * s) + ' ' + n2(36 * s) + 'h-' + n2(20 * s) + 'z"/><path class="ech-water" d="M' + n2(x - 22 * s) + ' ' + n2(y - 12 * s) + 'h' + n2(18 * s) + 'v' + n2(30 * s) + 'h-' + n2(18 * s) + 'z"/></g>'; },
    wind: function(x, y, s){ var o = '<g class="ech-ic ech-ic-wind"><path class="ech-mast" d="M' + n2(x - 1.6 * s) + ' ' + n2(y + 20 * s) + 'L' + n2(x - 0.8 * s) + ' ' + n2(y - 6 * s) + 'h' + n2(1.6 * s) + 'L' + n2(x + 1.6 * s) + ' ' + n2(y + 20 * s) + 'z"/>'; for(var i = 0; i < 3; i++){ var a = (i * 120 - 90) * Math.PI / 180, b = a + 0.22; o += '<path class="ech-blade" d="M' + n2(x) + ' ' + n2(y - 7 * s) + 'L' + n2(x + Math.cos(a) * 18 * s) + ' ' + n2(y - 7 * s + Math.sin(a) * 18 * s) + 'L' + n2(x + Math.cos(b) * 7 * s) + ' ' + n2(y - 7 * s + Math.sin(b) * 7 * s) + 'z"/>'; } return o + '<circle cx="' + n2(x) + '" cy="' + n2(y - 7 * s) + '" r="' + n2(2.2 * s) + '"/></g>'; },
    solar: function(x, y, s){ var o = '<g class="ech-ic ech-ic-solar"><path class="ech-panel" d="M' + n2(x - 18 * s) + ' ' + n2(y + 10 * s) + 'L' + n2(x - 10 * s) + ' ' + n2(y - 10 * s) + 'h' + n2(28 * s) + 'L' + n2(x + 14 * s) + ' ' + n2(y + 10 * s) + 'z"/>'; for(var i = 1; i < 4; i++) o += '<line class="ech-grid-l" x1="' + n2(x - 18 * s + i * 8 * s) + '" y1="' + n2(y + 10 * s) + '" x2="' + n2(x - 10 * s + i * 7 * s) + '" y2="' + n2(y - 10 * s) + '"/>'; return o + '<line class="ech-grid-l" x1="' + n2(x - 14 * s) + '" y1="' + n2(y) + '" x2="' + n2(x + 16 * s) + '" y2="' + n2(y) + '"/></g>'; },
    boil: function(x, y, s){ return '<g class="ech-ic ech-ic-boil"><rect class="ech-metal" x="' + n2(x - 12 * s) + '" y="' + n2(y - 16 * s) + '" width="' + n2(24 * s) + '" height="' + n2(32 * s) + '" rx="' + n2(4 * s) + '"/><path class="ech-flame" d="M' + n2(x) + ' ' + n2(y + 12 * s) + 'c-' + n2(7 * s) + ' -' + n2(2 * s) + ' -' + n2(7 * s) + ' -' + n2(9 * s) + ' 0 -' + n2(16 * s) + 'c' + n2(1 * s) + ' ' + n2(5 * s) + ' ' + n2(6 * s) + ' ' + n2(6 * s) + ' ' + n2(5 * s) + ' ' + n2(10 * s) + 'c' + n2(2 * s) + ' ' + n2(3 * s) + ' ' + n2(0) + ' ' + n2(5 * s) + ' -' + n2(5 * s) + ' ' + n2(6 * s) + 'z"/><path class="ech-stack" d="M' + n2(x + 5 * s) + ' ' + n2(y - 16 * s) + 'v-' + n2(8 * s) + 'h' + n2(5 * s) + 'v' + n2(8 * s) + '"/></g>'; },
    core: function(x, y, s){ return '<g class="ech-ic ech-ic-core"><path class="ech-metal" d="M' + n2(x - 12 * s) + ' ' + n2(y + 16 * s) + 'v-' + n2(22 * s) + 'a' + n2(12 * s) + ' ' + n2(12 * s) + ' 0 0 1 ' + n2(24 * s) + ' 0v' + n2(22 * s) + 'z"/>' + [-6, 0, 6].map(function(d){ return '<rect class="ech-rod" x="' + n2(x + d * s - 1.5 * s) + '" y="' + n2(y - 4 * s) + '" width="' + n2(3 * s) + '" height="' + n2(16 * s) + '"/>'; }).join('') + '</g>'; },
    burn: function(x, y, s){ return ICON.boil(x, y, s); },
    pen: function(x, y, s){ return '<g class="ech-ic"><path class="ech-pipe" d="M' + n2(x - 16 * s) + ' ' + n2(y - 14 * s) + 'Q' + n2(x) + ' ' + n2(y - 12 * s) + ' ' + n2(x + 4 * s) + ' ' + n2(y + 4 * s) + 'L' + n2(x + 16 * s) + ' ' + n2(y + 14 * s) + '"/></g>'; },
    turb: function(x, y, s){ var o = '<g class="ech-ic ech-ic-turb"><circle class="ech-metal" cx="' + n2(x) + '" cy="' + n2(y) + '" r="' + n2(15 * s) + '"/>'; for(var i = 0; i < 8; i++){ var a = i * Math.PI / 4; o += '<path class="ech-vane" d="M' + n2(x) + ' ' + n2(y) + 'Q' + n2(x + Math.cos(a + 0.5) * 9 * s) + ' ' + n2(y + Math.sin(a + 0.5) * 9 * s) + ' ' + n2(x + Math.cos(a) * 13 * s) + ' ' + n2(y + Math.sin(a) * 13 * s) + '"/>'; } return o + '<circle class="ech-hub" cx="' + n2(x) + '" cy="' + n2(y) + '" r="' + n2(3 * s) + '"/></g>'; },
    rotor: function(x, y, s){ return ICON.wind(x, y + 4 * s, s); },
    gear: function(x, y, s){ var o = '<g class="ech-ic"><circle class="ech-metal" cx="' + n2(x) + '" cy="' + n2(y) + '" r="' + n2(11 * s) + '"/>'; for(var i = 0; i < 10; i++){ var a = i * Math.PI / 5; o += '<rect class="ech-metal" x="' + n2(x + Math.cos(a) * 13 * s - 2.5 * s) + '" y="' + n2(y + Math.sin(a) * 13 * s - 2.5 * s) + '" width="' + n2(5 * s) + '" height="' + n2(5 * s) + '"/>'; } return o + '<circle class="ech-hub" cx="' + n2(x) + '" cy="' + n2(y) + '" r="' + n2(4 * s) + '"/></g>'; },
    cell: function(x, y, s){ return ICON.solar(x, y, s); },
    inv: function(x, y, s){ return '<g class="ech-ic"><rect class="ech-metal" x="' + n2(x - 13 * s) + '" y="' + n2(y - 11 * s) + '" width="' + n2(26 * s) + '" height="' + n2(22 * s) + '" rx="' + n2(3 * s) + '"/><path class="ech-wave" d="M' + n2(x - 8 * s) + ' ' + n2(y) + 'q' + n2(4 * s) + ' -' + n2(8 * s) + ' ' + n2(8 * s) + ' 0t' + n2(8 * s) + ' 0"/></g>'; },
    gen: function(x, y, s){ return '<g class="ech-ic ech-ic-gen"><rect class="ech-metal" x="' + n2(x - 15 * s) + '" y="' + n2(y - 11 * s) + '" width="' + n2(30 * s) + '" height="' + n2(22 * s) + '" rx="' + n2(8 * s) + '"/><path class="ech-bolt" d="M' + n2(x + 2 * s) + ' ' + n2(y - 9 * s) + 'l-' + n2(7 * s) + ' ' + n2(10 * s) + 'h' + n2(5 * s) + 'l-' + n2(2 * s) + ' ' + n2(8 * s) + 'l' + n2(7 * s) + ' -' + n2(10 * s) + 'h-' + n2(5 * s) + 'z"/></g>'; },
    grid: function(x, y, s){ return '<g class="ech-ic ech-ic-grid"><path class="ech-tower" d="M' + n2(x - 8 * s) + ' ' + n2(y + 18 * s) + 'L' + n2(x - 2 * s) + ' ' + n2(y - 16 * s) + 'h' + n2(4 * s) + 'L' + n2(x + 8 * s) + ' ' + n2(y + 18 * s) + 'M' + n2(x - 12 * s) + ' ' + n2(y - 10 * s) + 'h' + n2(24 * s) + 'M' + n2(x - 9 * s) + ' ' + n2(y - 2 * s) + 'h' + n2(18 * s) + 'M' + n2(x - 6 * s) + ' ' + n2(y + 8 * s) + 'l' + n2(12 * s) + ' -' + n2(10 * s) + 'M' + n2(x + 6 * s) + ' ' + n2(y + 8 * s) + 'l-' + n2(12 * s) + ' -' + n2(10 * s) + '"/></g>'; },
    home: function(x, y, s){ return '<g class="ech-ic ech-ic-home"><path class="ech-house" d="M' + n2(x - 15 * s) + ' ' + n2(y - 1 * s) + 'L' + n2(x) + ' ' + n2(y - 15 * s) + 'L' + n2(x + 15 * s) + ' ' + n2(y - 1 * s) + 'v' + n2(17 * s) + 'h-' + n2(30 * s) + 'z"/><rect class="ech-window" x="' + n2(x - 4 * s) + '" y="' + n2(y + 3 * s) + '" width="' + n2(8 * s) + '" height="' + n2(8 * s) + '"/></g>'; }
  };

  /* The flow. Wide screens: stages left to right, waste heat dropping
     below. Phones: stages top to bottom, waste heat peeling off to the
     right. Drawn in abstract coordinates (a along the flow, c across it)
     and mapped to x, y by P(). */
  var SHORT = { 'Steam turbine': 'Turbine', 'Gas and steam turbines': 'Turbines', 'Water turbine': 'Turbine', 'Rotor blades': 'Rotor', 'Solar cells': 'Cells', 'Power lines': 'Power lines', 'Your outlet': 'Your outlet' };
  function flowSvg(W, H, id, sel, o){
    o = o || {};
    var c = E.chain(id, 100), S = E.SOURCES[id], n = c.stages.length + 2, out = [], vert = W < 560;
    var A0, A1, mid, bandMax, cEnd;
    if(vert){ A0 = 14; A1 = H - 10; bandMax = Math.min(W * 0.26, 100); mid = W * 0.5; cEnd = W - 34; }
    else { A0 = 20; A1 = W - 20; bandMax = Math.min(H * 0.3, 150); mid = 100 + bandMax / 2; cEnd = H - 92; }
    var step = (A1 - A0) / n;
    function at(i){ return A0 + step * (i + 0.5); }
    function P(a, cc){ return vert ? n2(cc) + ' ' + n2(a) : n2(a) + ' ' + n2(cc); }
    function hOf(e){ return Math.max(2.5, bandMax * e / 100); }
    function T2(a, cc, s, cls, anchor){ return vert ? txt(cc, a, s, cls, anchor) : txt(a, cc, s, cls, anchor); }
    // the first piece: the resource
    out.push('<path class="ech-band" d="M' + P(at(0), mid - hOf(100) / 2) + 'L' + P(at(1), mid - hOf(100) / 2) + 'L' + P(at(1), mid + hOf(100) / 2) + 'L' + P(at(0), mid + hOf(100) / 2) + 'Z"/>');
    c.stages.forEach(function(s, i){
      var xa = at(i + 1), xb = at(i + 2), xm = (xa + xb) / 2, h0 = hOf(s.ein), h1 = hOf(s.eout), w = hOf(s.waste);
      if(s.waste > 0.05){
        var y0 = mid - h0 / 2 + h1, wx = xa + Math.min(step * 0.42, 34), aw = Math.max(5, w * 0.6), tip = wx - w / 2;
        out.push('<path class="ech-waste' + (sel === i ? ' is-sel' : '') + '" d="M' + P(xa, y0) + 'C' + P(xa + step * 0.3, y0) + ' ' + P(wx, y0 + 10) + ' ' + P(wx, Math.max(y0 + 12, cEnd - 10)) + 'L' + P(wx - w, Math.max(y0 + 12, cEnd - 10)) + 'C' + P(wx - w, y0 + w + 6) + ' ' + P(xa + step * 0.15, mid + h0 / 2) + ' ' + P(xa, mid + h0 / 2) + 'Z"/>');
        out.push('<path class="ech-wastehead" d="M' + P(tip - aw, cEnd - 10) + 'L' + P(tip + aw, cEnd - 10) + 'L' + P(tip, cEnd) + 'Z"/>');
        out.push(vert ? txt(cEnd + 4, tip + 4, f0(s.waste), 'ech-t ech-wv', 'start') : txt(tip, cEnd + 14, f0(s.waste), 'ech-t ech-wv', 'middle'));
      }
      out.push('<path class="ech-band" d="M' + P(xa, mid - h0 / 2) + 'C' + P(xm, mid - h0 / 2) + ' ' + P(xm, mid - h1 / 2) + ' ' + P(xb, mid - h1 / 2) + 'L' + P(xb, mid + h1 / 2) + 'C' + P(xm, mid + h1 / 2) + ' ' + P(xm, mid - h0 / 2 + h1) + ' ' + P(xa, mid - h0 / 2 + h1) + 'Z"/>');
    });
    out.push(vert ? txt(cEnd + 4, A0 + 2, 'Heat', 'ech-t ech-s ech-c-heat', 'start') : txt(A0, cEnd + 14, 'Waste heat', 'ech-t ech-s ech-c-heat'));
    // the stage labels and tap targets
    var labels = [{ name: S.name, k: S.icon, e: 100 }].concat(c.stages.map(function(s){ return { name: s.name, k: s.id === 'grid' ? 'grid' : s.id, e: s.eout, eff: s.eff }; })).concat([{ name: 'Your outlet', k: 'home', e: c.delivered }]);
    labels.forEach(function(l, i){
      var a = at(i), isStage = i > 0 && i < n - 1, on = sel === i - 1 && isStage, g = '';
      g += '<g class="ech-node' + (on ? ' is-sel' : '') + (isStage ? ' is-tap' : '') + '"' + (isStage ? ' data-i="' + (i - 1) + '" tabindex="' + (o.static ? '-1' : '0') + '" role="button" aria-pressed="' + on + '" aria-label="' + esc(l.name + ': ' + Math.round(l.eff * 100) + '% efficient. Show what it loses.') + '"' : '') + '>';
      if(vert){
        g += '<rect class="ech-hit" x="2" y="' + n2(a - step / 2 + 2) + '" width="' + n2(mid - bandMax / 2 - 6) + '" height="' + n2(step - 4) + '" rx="10"/>';
        g += (ICON[l.k] || ICON.gen)(24, a, 0.66);
        g += txt(48, a - (isStage ? 2 : -4), esc(SHORT[l.name] || l.name), 'ech-t ech-name');
        if(isStage) g += txt(48, a + 14, Math.round(l.eff * 100) + '% efficient', 'ech-t ech-eff ech-s');
      } else {
        g += '<rect class="ech-hit" x="' + n2(a - step / 2 + 2) + '" y="8" width="' + n2(step - 4) + '" height="' + n2(mid + bandMax / 2 + 26) + '" rx="10"/>';
        g += (ICON[l.k] || ICON.gen)(a, 50, 0.85);
        g += txt(a, 22, esc(l.name), 'ech-t ech-name', 'middle');
        if(isStage) g += txt(a, mid + bandMax / 2 + 18, Math.round(l.eff * 100) + '%', 'ech-t ech-eff', 'middle');
      }
      g += '</g>';
      out.push(g);
      var hv = Math.max(hOf(l.e), 14);
      if(!vert && i > 0 && i < n - 1 && hOf(l.e) < 30) hv = hOf(l.e) + 4;
      out.push(i === 0 ? T2((at(0) + at(1)) / 2, mid + (vert ? 0 : 5), '100', 'ech-t ech-ev ech-on-band', 'middle') : (vert ? txt(mid + hOf(l.e) / 2 + 6, a + 5, f0(l.e), 'ech-t ech-ev', 'start') : txt(a, mid - hv / 2 - 6, f0(l.e), 'ech-t ech-ev', 'middle')));
    });
    // where the 100 units end up (wide screens with room)
    if(!vert && H - cEnd > 80){
      var by = cEnd + 50, bx = A0, bw = A1 - A0, x = bx, parts = [{ v: c.delivered, cls: 'ech-band', t: 'Reaches you ' + f0(c.delivered) }].concat(c.stages.filter(function(s){ return s.waste > 0.05; }).map(function(s){ return { v: s.waste, cls: 'ech-waste', t: (SHORT[s.name] || s.name) + ' ' + f0(s.waste), sel: c.stages.indexOf(s) === sel }; }));
      out.push(txt(bx, by - 8, 'Where the 100 units end up', 'ech-t ech-b'));
      parts.forEach(function(p){ var ww = bw * p.v / 100; out.push('<rect class="' + p.cls + (p.sel ? ' is-sel' : '') + '" x="' + n2(x) + '" y="' + n2(by) + '" width="' + n2(Math.max(1, ww - 2)) + '" height="22" rx="4"/>'); if(ww > p.t.length * 6.6 + 8) out.push(txt(x + ww / 2, by + 15, p.t, 'ech-t ech-s ech-b ' + (p.cls === 'ech-band' ? 'ech-on-band' : 'ech-on-heat'), 'middle')); x += ww; });
    }
    return '<svg class="ech-svg" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc('Energy chain for ' + S.name.toLowerCase() + ': of 100 units of energy, ' + c.stages.map(function(s){ return s.name.toLowerCase() + ' passes ' + f1(s.eout); }).join(', ') + '; ' + f1(c.delivered) + ' reach the outlet, ' + f1(100 - c.delivered) + ' leave as heat.') + '" xmlns="http://www.w3.org/2000/svg">' + out.join('') + '</svg>';
  }

  var MEASURES = [
    { id: 'life', label: 'CO₂ per kWh', unit: 'g CO₂-eq per kWh, life cycle (IPCC median)', get: function(S){ return S.life; }, max: 900, low: true },
    { id: 'eff', label: 'Efficiency', unit: '% of the resource’s energy that reaches your outlet', get: function(S, id){ return E.chain(id, 100).total; }, max: 100 },
    { id: 'cf', label: 'Capacity factor', unit: '% of the year at full output (EIA, recent U.S. average)', get: function(S){ return S.cf; }, max: 100 }
  ];
  function compareSvg(W, H, mid, sel){
    var Mz = MEASURES.filter(function(m){ return m.id === mid; })[0], out = [], phone = W < 560;
    var L = phone ? 112 : 130, R = W - (phone ? 46 : 70), top = 34, rowH = (H - top - 18) / E.ORDER.length;
    out.push(txt(L, 18, esc(Mz.unit), 'ech-t ech-s ech-muted'));
    [0, 0.25, 0.5, 0.75, 1].forEach(function(f){ var x = L + (R - L) * f; out.push('<line class="ech-gl" x1="' + n2(x) + '" x2="' + n2(x) + '" y1="' + top + '" y2="' + n2(H - 16) + '"/>'); });
    E.ORDER.forEach(function(id, i){
      var S = E.SOURCES[id], v = Mz.get(S, id), y = top + rowH * i, bh = Math.min(26, rowH * 0.5), w = (R - L) * v / Mz.max;
      out.push('<g class="ech-row' + (id === sel ? ' is-sel' : '') + '">');
      out.push((ICON[S.icon])(phone ? 14 : 20, y + rowH / 2, phone ? 0.45 : 0.6));
      out.push(txt(phone ? 30 : 42, y + rowH / 2 + (phone ? 0 : 5), esc(phone ? ({ gas: 'Gas', solar: 'Solar' })[id] || S.name : S.name), 'ech-t ech-rown'));
      if(phone) out.push(txt(30, y + rowH / 2 + 14, S.intermittent ? 'Intermittent' : 'On demand', 'ech-t ech-s ' + (S.intermittent ? 'ech-c-warn' : 'ech-muted')));
      out.push('<rect class="ech-bar ech-bar-' + (S.co2 > 0 ? 'fossil' : 'clean') + '" x="' + L + '" y="' + n2(y + (rowH - bh) / 2) + '" width="' + n2(Math.max(2, w)) + '" height="' + n2(bh) + '" rx="4"/>');
      out.push(txt(L + Math.max(2, w) + 6, y + rowH / 2 + 5, f0(v), 'ech-t ech-ev'));
      var tags = (S.intermittent ? 'Intermittent' : 'On demand');
      if(!phone) out.push(txt(R + 64, y + rowH / 2 + 5, tags, 'ech-t ech-s ' + (S.intermittent ? 'ech-c-warn' : 'ech-muted'), 'end'));
      out.push('</g>');
    });
    return '<svg class="ech-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(Mz.label + ' by source: ' + E.ORDER.map(function(id){ return E.SOURCES[id].name + ' ' + f0(Mz.get(E.SOURCES[id], id)); }).join(', ') + '.') + '" xmlns="http://www.w3.org/2000/svg">' + out.join('') + '</svg>';
  }

  /* ======================================================= explore */
  var WHY = {
    boil: 'Burning coal heats water in the boiler’s tubes to high-pressure steam. Some heat escapes with the hot exhaust up the stack.',
    burn: 'Natural gas burns in the gas turbine’s combustor; almost all its chemical energy becomes heat in the hot gas.',
    core: 'Uranium-235 nuclei split (fission) and release heat that makes steam. No burning, so no CO₂ at the plant.',
    turb: 'The biggest loss in any heat engine. Steam (or hot gas) spins the turbine, but most of the heat must be dumped to cooling water or the air: the second law of thermodynamics. A combined-cycle gas plant reuses its exhaust heat in a second, steam turbine, which is why it beats coal.',
    gen: 'A spinning magnet inside coils of wire makes electricity (electromagnetic induction). Generators lose only a few percent as heat.',
    grid: 'Current in long wires heats them (resistance), so about 5% is lost between the plant and you. High voltage lowers the loss.',
    pen: 'Water from behind the dam falls through a large pipe, the penstock; friction takes a little.',
    rotor: 'The blades catch part of the wind’s kinetic energy. Some wind must pass through to keep flowing, so no turbine can catch more than 59% (the Betz limit).',
    gear: 'A gearbox speeds up the slow rotor for the generator; friction costs a few percent.',
    cell: 'Solar cells turn about 20% of the sunlight that hits them into DC electricity; the rest is reflected or heats the panel.',
    inv: 'An inverter changes the panels’ direct current to the alternating current the grid uses.'
  };
  function explore(host, data){
    var LS = null, nid = T.nid('ech'), touched = false;
    var st = { view: 'flow', id: 'coal', sel: null, measure: 'life', kwh: 900 };
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem ech-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Energy chain explorer</h2>' +
      '<div class="ech-fig"></div>' +
      '<div class="ech-ctl">' +
        '<div class="ech-views ls-seg" role="group" aria-label="View"><button type="button" class="ech-view" data-v="flow" aria-pressed="true">Energy flow</button><button type="button" class="ech-view" data-v="cmp" aria-pressed="false">Compare</button></div>' +
        '<div class="ech-srcs ls-scroll" role="group" aria-label="Power source">' + E.ORDER.map(function(id){ return '<button type="button" class="tchip ech-src" data-id="' + id + '" aria-pressed="false">' + esc(E.SOURCES[id].name) + '</button>'; }).join('') + '</div>' +
        '<div class="ech-meas ls-scroll" role="group" aria-label="Measure" hidden>' + MEASURES.map(function(m){ return '<button type="button" class="tchip ech-m" data-m="' + m.id + '" aria-pressed="false">' + esc(m.label) + '</button>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="ech-say"></div>' +
      T.moreHtml('<div class="ech-home"></div>', 'a home’s month of electricity') +
      '<div class="ech-nums"></div><p class="sr-only ech-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.ech-live'));
    var cue = T.cue('Pick a power source, then tap a step to see where its energy goes.');
    $('.ech-ctl').insertBefore(cue.el, $('.ech-ctl').firstChild);
    var sK = T.slider({ label: 'Electricity used at home', min: 100, max: 2000, step: 100, value: st.kwh, unit: 'kWh', onInput: function(v){ st.kwh = v; words(); } });
    $('.ech-home').appendChild(sK.el);
    $('.ech-home').insertAdjacentHTML('beforeend', '<div class="ech-homeout"></div>');
    function act(){ if(!touched){ touched = true; cue.done(); } }
    function size(){ var rc = $('.ech-fig').getBoundingClientRect(), w = Math.round(rc.width) || 640, h = Math.round(rc.height) || 0; if(!h || h < 220) h = Math.round(Math.max(300, Math.min(480, w * 0.62))); return [Math.max(300, Math.min(1400, w)), Math.min(800, h)]; }
    function draw(){
      var wh = size();
      $('.ech-fig').innerHTML = st.view === 'flow' ? flowSvg(wh[0], wh[1], st.id, st.sel) : compareSvg(wh[0], wh[1], st.measure, st.id);
      words();
    }
    function words(){
      var c = E.chain(st.id, 100), S = E.SOURCES[st.id], head, why, pills = [], right = [];
      if(st.view === 'flow'){
        var s = st.sel != null ? c.stages[st.sel] : null;
        head = s ? s.name + ': ' + Math.round(s.eff * 100) + '% efficient. Of ' + f1(s.ein) + ' units in, ' + f1(s.eout) + ' go on and ' + f1(s.waste) + ' leave as ' + s.lost + '.' : S.name + ': of 100 units of energy, ' + f1(c.delivered) + ' reach your outlet. The other ' + f1(100 - c.delivered) + ' leave as heat along the way.';
        pills = [{ k: 'To you', html: f1(c.total) + '%', tone: 'readout' }];
        right = [{ k: 'CO₂', html: S.co2 ? T.F(S.co2, 2) + ' lb/kWh' : 'none at plant', tone: S.co2 ? 'warn' : 'good' }];
        why = (s ? '<p><b>' + esc(s.name) + '.</b> ' + esc(WHY[s.id] || '') + '</p>' : '') +
          '<p><b>Efficiencies multiply.</b> Each step passes on only its share of what it receives, so the whole chain is the product: ' + c.stages.map(function(x){ return T.F(x.eff, 3).replace(/0+$/, ''); }).join(' × ') + ' × 100 = ' + f1(c.total) + '%. The chain is always less efficient than its weakest step.</p>' +
          '<p><b>Energy is not destroyed</b> (the first law of thermodynamics): every unit that does not reach you is still there, as low-temperature heat in the air and water. It is just too spread out to do useful work (the second law).</p>' +
          (S.heatRate ? '<p><b>The heat rate.</b> U.S. ' + S.name.toLowerCase() + ' plants burn about ' + big(S.heatRate) + ' BTU of fuel for each kWh (EIA, 2024). One kWh is 3,412 BTU, so the plant is 3,412 ÷ ' + big(S.heatRate) + ' = ' + f1(E.heatRateEff(S.heatRate)) + '% efficient.</p>' : '') +
          '<p><b>Trade-offs.</b> ' + ({ coal: 'Cheap, reliable and dispatchable, but the most CO₂ per kWh, plus SO₂, NOx, mercury and particulates; mining scars land (strip mining, mountaintop removal).', gas: 'About half the CO₂ of coal per kWh and quick to ramp up and down, but still a fossil fuel; methane leaks (a strong greenhouse gas) and fracking’s water use and contamination risks.', nuclear: 'No CO₂ or air pollution at the plant and runs over 90% of the time, but radioactive waste that stays dangerous for thousands of years, thermal pollution from its cooling water, high cost, and rare but serious accidents.', hydro: 'No fuel and very efficient, but dams flood land, block fish migration, trap sediment and change water temperature downstream.', wind: 'No fuel or emissions while running, but intermittent (only when the wind blows), and turbines can kill birds and bats.', solar: 'No fuel or emissions while running, but intermittent (no output at night), with mining for panel materials and large land areas for big farms.' })[st.id] + '</p>';
      } else {
        var Mz = MEASURES.filter(function(m){ return m.id === st.measure; })[0];
        head = ({ life: 'Over their whole life cycle, coal and natural gas release far more CO₂ per kWh than nuclear, wind, hydro or solar.', eff: 'Hydro turns the most of its resource into electricity; fossil and nuclear plants lose most of theirs as waste heat.', cf: 'Nuclear runs at full output over 90% of the year; wind and solar only when the wind blows or the sun shines.' })[st.measure];
        pills = [{ k: 'Measure', html: esc(Mz.label), tone: 'readout' }];
        why = '<p><b>CO₂ per kWh.</b> Life-cycle numbers include mining, building the plant and its fuel, not just the smokestack, which is why wind and solar are not zero. Fossil fuels are still 10 to 70 times higher.</p>' +
          '<p><b>Efficiency is not everything.</b> Solar panels turn only about 20% of sunlight into electricity, but sunlight is free and endless; coal is about 32% efficient and its fuel is burned for good.</p>' +
          '<p><b>Capacity factor and dispatch.</b> A plant that can be turned up when demand rises (coal, gas, nuclear, hydro) is dispatchable. Wind and solar are intermittent, so a grid that relies on them needs storage (batteries, pumped hydro) or backup.</p>';
      }
      T.explain($('.ech-say'), '<b>' + esc(head) + '</b>', why);
      // a month at home
      var fuelE = E.need(st.id, st.kwh), lbCO2 = S.co2 ? M.Calc().evaluate({ fn: 'emissions', args: [st.kwh / E.LOSS, S.co2] }) : 0;
      var fuelLine = S.fuelPer ? '<li>About <b>' + f0(st.kwh / E.LOSS * S.fuelPer.v) + ' ' + esc(S.fuelPer.unit) + '</b> burned (EIA: ' + S.fuelPer.v + ' per kWh generated)</li>' : '';
      var ho = $('.ech-homeout');
      if(ho) ho.innerHTML = '<ul class="ech-homelist"><li>The plant must make ' + big(f0(st.kwh / E.LOSS)) + ' kWh (5% is lost in the lines)</li><li>That takes <b>' + big(f0(fuelE)) + ' kWh</b> = <b>' + big(f0(fuelE * E.BTU_KWH / 1e6)) + ' million BTU</b> of ' + esc(S.fuel) + '</li>' + fuelLine + '<li>CO₂ at the plant: <b>' + (S.co2 ? big(f0(lbCO2)) + ' lb' : 'none') + '</b></li></ul>';
      $('.ech-nums').innerHTML = '<h3 class="ls-title-l">Step by step (100 units in)</h3><table class="ls-tbl"><thead><tr><th scope="col">Step</th><th scope="col">Efficiency</th><th scope="col">Passes on</th><th scope="col">Waste heat</th></tr></thead><tbody>' +
        c.stages.map(function(s){ return '<tr><th scope="row">' + esc(s.name) + '</th><td class="r">' + Math.round(s.eff * 1000) / 10 + '%</td><td class="r">' + f1(s.eout) + '</td><td class="r">' + f1(s.waste) + '</td></tr>'; }).join('') +
        '<tr><th scope="row">Whole chain</th><td class="r">' + f1(c.total) + '%</td><td class="r">' + f1(c.delivered) + '</td><td class="r">' + f1(100 - c.delivered) + '</td></tr></tbody></table>' +
        '<h3 class="ls-title-l">Units that come up</h3><table class="ls-tbl"><tbody><tr><th scope="row">1 kWh</th><td>3,412 BTU = 3.6 million J</td></tr><tr><th scope="row">1 W</th><td>1 J per second (power is a rate)</td></tr><tr><th scope="row">kW × hours</th><td>kWh (energy is an amount)</td></tr><tr><th scope="row">1 short ton</th><td>2,000 lb</td></tr><tr><th scope="row">1 metric ton</th><td>1,000 kg</td></tr></tbody></table>';
      if(LS){ LS.caption('<b>' + esc(head) + '</b>', 'explore'); LS.pills(pills, 'left', 'explore'); LS.pills(right, 'right', 'explore'); }
      sync();
    }
    function sync(){
      var root = LS ? LS.root : host;
      root.querySelectorAll('.ech-src').forEach(function(b){ var on = b.getAttribute('data-id') === st.id; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
      root.querySelectorAll('.ech-view').forEach(function(b){ var on = b.getAttribute('data-v') === st.view; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
      root.querySelectorAll('.ech-m').forEach(function(b){ var on = b.getAttribute('data-m') === st.measure; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
      var ms = root.querySelector('.ech-meas'), ss = root.querySelector('.ech-srcs');
      if(ms) ms.hidden = st.view !== 'cmp';
      if(ss) ss.hidden = st.view !== 'flow';
    }
    function pick(i){ st.sel = st.sel === i ? null : i; act(); draw(); var n = $('.ech-node[data-i="' + st.sel + '"]'); if(n) n.focus(); say($('.ech-say .bt-say-h').textContent); }
    function onClick(e){
      var b = e.target.closest('.ech-src'); if(b){ st.id = b.getAttribute('data-id'); st.sel = null; act(); draw(); say($('.ech-say .bt-say-h').textContent); return; }
      var v = e.target.closest('.ech-view'); if(v){ st.view = v.getAttribute('data-v'); act(); draw(); say($('.ech-say .bt-say-h').textContent); return; }
      var m = e.target.closest('.ech-m'); if(m){ st.measure = m.getAttribute('data-m'); act(); draw(); say($('.ech-say .bt-say-h').textContent); return; }
      var n = e.target.closest('.ech-node.is-tap'); if(n){ pick(+n.getAttribute('data-i')); }
    }
    function onKey(e){ var n = e.target.closest && e.target.closest('.ech-node.is-tap'); if(n && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); pick(+n.getAttribute('data-i')); } }
    host.addEventListener('click', onClick); host.addEventListener('keydown', onKey);
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.ech-fig')], dock: [$('.ech-ctl')], why: [$('.ech-say')], details: [$('.ech-nums')] });
      host.removeEventListener('click', onClick); host.removeEventListener('keydown', onKey);
      s.root.addEventListener('click', onClick); s.root.addEventListener('keydown', onKey);
      draw();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.ech-src[data-id="gas"]'), text: 'Start here: pick a source' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe($('.ech-fig')); }
    }
    draw();
    return { studio: studio };
  }

  /* ================================================== test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'energy-chain', noun: 'drill',
      generate: function(r, ctx, type){ return E.generate(r, ctx, type); },
      types: [{ value: 'chain', label: 'Efficiency of a chain' }, { value: 'fuel', label: 'Fuel needed, kWh to BTU' }, { value: 'heatrate', label: 'Heat rate to efficiency' }, { value: 'co2', label: 'Carbon dioxide from kWh' }, { value: 'power', label: 'Watts, hours and cost' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { chain: 'How much reaches the home?', fuel: 'How much fuel?', co2: 'How much carbon dioxide?', power: 'Watts to kilowatt-hours', heatrate: 'From heat rate to efficiency' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); }
    });
  }
  function figure(el, p, st){
    var g = p.figure, phone = (window.innerWidth || 1280) <= 640, W = phone ? 360 : 640, H = phone ? 300 : 300, svg = '';
    if(!g){ el.innerHTML = ''; return; }
    if(g.kind === 'chain'){
      // the problem's own efficiencies as a band; values appear once found
      var e = 100, L = 16, R = W - 16, n = g.effs.length, cw = (R - L) / (n + 1), mid = 120, bm = phone ? 64 : 80, o = [];
      var names = E.SOURCES[g.source].stages.map(function(s){ return s.name; }).concat(['Power lines']);
      for(var i = 0; i < n; i++){
        var x0 = L + cw * i, x1 = x0 + cw, e1 = e * g.effs[i], h0 = bm * e / 100, h1 = bm * e1 / 100;
        o.push('<path class="ech-band" d="M' + n2(x0) + ' ' + n2(mid - h0 / 2) + 'L' + n2(x1) + ' ' + n2(mid - h0 / 2) + 'L' + n2(x1) + ' ' + n2(mid - h0 / 2 + h1) + 'L' + n2(x0) + ' ' + n2(mid - h0 / 2 + h1) + 'Z"/>');
        o.push('<path class="ech-waste" d="M' + n2(x1) + ' ' + n2(mid - h0 / 2 + h1) + 'L' + n2(x1) + ' ' + n2(mid + h0 / 2) + 'L' + n2(x1 - 4) + ' ' + n2(H - 40) + 'L' + n2(x1 - 4 - (h0 - h1) * 0.6) + ' ' + n2(H - 40) + 'Z" opacity=".75"/>');
        o.push(txt(x0 + cw / 2, mid - bm / 2 - 30, esc(phone ? names[i].split(' ').slice(-1)[0] : names[i]), 'ech-t ech-name', 'middle'));
        o.push(txt(x0 + cw / 2, mid - bm / 2 - 12, Math.round(g.effs[i] * 1000) / 10 + '%', 'ech-t ech-eff', 'middle'));
        e = e1;
      }
      o.push(txt(R - 4, mid + 4, st.total ? f1(e) + '%' : '?', 'ech-t ech-ev', 'end'));
      svg = '<svg class="ech-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('A band of energy narrowing through ' + n + ' steps: ' + g.effs.map(function(x, k){ return names[k] + ' ' + Math.round(x * 1000) / 10 + '%'; }).join(', ') + (st.total ? '; ' + f1(e) + '% is left.' : '.')) + '">' + o.join('') + '</svg>';
    } else if(g.kind === 'need' || g.kind === 'heat'){
      var eff = g.kind === 'heat' ? (st.eff ? E.heatRateEff(g.hr) : null) : g.eff, Wd = W, o2 = [], bx = 30, bw = Wd - 60, by = 60, bh = 54;
      o2.push(txt(bx, 40, g.kind === 'heat' ? 'Fuel energy in: ' + big(g.hr) + ' BTU for each kWh' : 'Fuel energy in', 'ech-t ech-b'));
      o2.push('<rect class="ech-waste" x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="8"/>');
      if(eff != null) o2.push('<rect class="ech-band" x="' + bx + '" y="' + by + '" width="' + n2(bw * eff / 100) + '" height="' + bh + '" rx="8"/>' + txt(bx + bw * eff / 200, by + bh / 2 + 5, 'Electricity ' + f0(eff) + '%', 'ech-t ech-b ech-on-band', 'middle') + txt(bx + bw * (1 + eff / 100) / 2, by + bh / 2 + 5, 'Waste heat ' + f0(100 - eff) + '%', 'ech-t ech-b ech-on-heat', 'middle'));
      else o2.push(txt(bx + bw / 2, by + bh / 2 + 5, 'Electricity ? %   Waste heat ? %', 'ech-t ech-b ech-on-heat', 'middle'));
      if(g.kind === 'need') o2.push(txt(bx, by + bh + 30, 'Electricity out: ' + big(g.kwh) + ' kWh' + (st.fuel ? '; fuel in: ' + big(f0(g.kwh / (g.eff / 100))) + ' kWh' : ''), 'ech-t'));
      o2.push((ICON[E.SOURCES[g.source].icon])(Wd - 40, 30, 0.7));
      svg = '<svg class="ech-svg" viewBox="0 0 ' + Wd + ' 190" role="img" aria-label="' + esc('A bar for the fuel energy, split into electricity and waste heat' + (eff != null ? ': ' + f0(eff) + '% electricity.' : '.')) + '">' + o2.join('') + '</svg>';
    } else if(g.kind === 'co2' || g.kind === 'power'){
      var o3 = [], items = g.kind === 'co2' ? [['coal', 2.31], ['gas', 0.96], ['nuclear', 0], ['wind', 0]] : null;
      if(items){
        o3.push(txt(20, 26, 'CO₂ at the plant, lb per kWh (EIA, 2023)', 'ech-t ech-b'));
        items.forEach(function(it, k){ var y = 50 + k * 36, w = (W - 190) * it[1] / 2.5; o3.push((ICON[E.SOURCES[it[0]].icon])(32, y + 10, 0.5)); o3.push(txt(56, y + 15, esc(E.SOURCES[it[0]].name), 'ech-t')); o3.push('<rect class="ech-bar ech-bar-' + (it[1] ? 'fossil' : 'clean') + (it[0] === g.source ? ' is-sel' : '') + '" x="150" y="' + y + '" width="' + n2(Math.max(2, w)) + '" height="20" rx="4"/>'); o3.push(txt(156 + Math.max(2, w), y + 15, it[1] ? T.F(it[1], 2) : '0 at the plant', 'ech-t ech-ev')); });
        svg = '<svg class="ech-svg" viewBox="0 0 ' + W + ' 200" role="img" aria-label="CO2 per kWh: coal 2.31 lb, natural gas 0.96 lb, nuclear and wind 0 at the plant.">' + o3.join('') + '</svg>';
      } else {
        // a meter: power (the rate) times hours
        o3.push(txt(20, 28, big(g.w) + ' W for ' + g.h + ' h a day, ' + g.days + ' days', 'ech-t ech-b'));
        var cols = Math.min(g.days, 30), cw2 = (W - 40) / cols;
        for(var d = 0; d < cols; d++){ var hh = 120 * g.h / 24; o3.push('<rect class="ech-day" x="' + n2(20 + d * cw2 + 1) + '" y="50" width="' + n2(cw2 - 2) + '" height="120" rx="2"/><rect class="ech-band" x="' + n2(20 + d * cw2 + 1) + '" y="' + n2(170 - hh) + '" width="' + n2(cw2 - 2) + '" height="' + n2(hh) + '" rx="2"/>'); }
        o3.push(txt(20, 192, (g.days > 30 ? 'First 30 of ' + g.days + ' days; ' : '') + 'shaded: hours on each day', 'ech-t ech-s ech-muted'));
        svg = '<svg class="ech-svg" viewBox="0 0 ' + W + ' 200" role="img" aria-label="' + esc('Each day as a column of 24 hours, ' + g.h + ' of them shaded: the device is on.') + '">' + o3.join('') + '</svg>';
      }
    }
    el.innerHTML = '<figure class="cd-fig ech-qfig">' + svg + '</figure>';
  }
})();
