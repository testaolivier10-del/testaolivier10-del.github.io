/* Climate change trainer page (docs/apenv-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T4). Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.climateChange (environmental-science/assets/tools/math/climate-change.js), the
   content environmental-science/data/tools/climate-change.json (served filtered as
   assets/tool-data/climate-change.json). The frame is ApEnvTools.modes
   (Explore, then Test yourself) on the Tool Studio.

   Explore, three scenes (the Scene switch):
     Atmosphere  one cross-section with the two systems in their own layers,
                 never mixed: the troposphere below, where CO2 molecules
                 catch the infrared (long red waves) rising from the ground and
                 send some back down; the stratosphere above, where ozone
                 stops the Sun's ultraviolet (short purple waves) and chlorine
                 from CFCs breaks ozone up. Two sliders, CO2 and CFC use, each
                 changes only its own layer. Under the picture, side by side,
                 the greenhouse readout (long-run warming against CO2) and the
                 ozone readout (UV-B at the ground against ozone).
     Ocean pH    CO2 dissolving into the sea, the carbonate chemistry, the pH
                 scale, the carbonate ions a shell needs, and the shell itself.
     Sea level   a coast with land ice, floating sea ice and a town: warm the
                 ocean (thermal expansion), melt land ice, melt the sea ice
                 (sea level does not change), with a glass-of-water inset.
   Colors by role: infrared vermillion, ultraviolet purple, sunlight yellow,
   ozone blue, CO2 dark grey with red oxygen, chlorine green (Okabe-Ito,
   lighter in dark mode); every value is also written.
   Test yourself: ApEnvTools.drill over the model's generate(), with a stage
   figure from the problem's own numbers. */
(function(){
  'use strict';
  var T = window.ApEnvTools, M = window.ApEnvMath;
  if(!T || !M || !M.climateChange) return;
  var K = M.climateChange, esc = T.esc;
  function F(x, d){ return T.F(x, d == null ? 1 : d); }
  function big(x){ return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  var VIEWS = [{ v: 'air', label: 'Atmosphere' }, { v: 'ocean', label: 'Ocean pH' }, { v: 'sea', label: 'Sea level' }];
  var CFC_LABEL = function(v){ return v === 0 ? 'None' : v < 0.35 ? 'Low' : v < 0.7 ? 'High' : 'Very high'; };

  T.mount('climate-change', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'climate-change',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------- shared art */
  function wave(x0, y0, x1, y1, amp, len){
    var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, n = Math.max(8, Math.round(L / 3)), pts = [];
    for(var i = 0; i <= n; i++){ var t = i / n * L, a = amp * Math.sin(t / len * 2 * Math.PI); pts.push((x0 + ux * t + nx * a).toFixed(1) + ',' + (y0 + uy * t + ny * a).toFixed(1)); }
    return pts.join(' ');
  }
  function head(x, y, ang, cls){ var a = ang, s = 7; return '<path class="cc-head ' + cls + '" d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' l' + (-s * Math.cos(a - 0.45)).toFixed(1) + ' ' + (-s * Math.sin(a - 0.45)).toFixed(1) + ' l' + (s * Math.cos(a - 0.45) - s * Math.cos(a + 0.45)).toFixed(1) + ' ' + (s * Math.sin(a - 0.45) - s * Math.sin(a + 0.45)).toFixed(1) + ' z"/>'; }
  function ray(cls, x0, y0, x1, y1, amp, len, w){ return '<polyline class="cc-ray ' + cls + '" style="stroke-width:' + (w || 2.4).toFixed(1) + '" points="' + wave(x0, y0, x1, y1, amp, len) + '"/>' + head(x1, y1, Math.atan2(y1 - y0, x1 - x0), cls); }
  function co2(x, y, s){ s = s || 1; return '<g class="cc-co2" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s + ')"><circle class="o" cx="-6" cy="0" r="3.4"/><circle class="c" cx="0" cy="0" r="3.4"/><circle class="o" cx="6" cy="0" r="3.4"/></g>'; }
  function o3(x, y, s){ s = s || 1; return '<g class="cc-o3" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s + ')"><circle cx="-5" cy="2" r="3.2"/><circle cx="0" cy="-2.4" r="3.2"/><circle cx="5" cy="2" r="3.2"/></g>'; }
  function cl(x, y){ return '<circle class="cc-cl" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.6"/>'; }
  function spots(seed, n){ var r = M.rng(seed), a = []; for(var i = 0; i < n; i++) a.push([r(), r()]); return a; }
  var CO2P = spots(5, 60), O3P = spots(9, 70), CLP = spots(13, 20);

  /* The atmosphere cross-section, from a state { ppm, cfc }. */
  function atmos(Wd, H, st, phone, simple){
    var g = [], du = K.ozone(st.cfc), uv = K.uvb(du), fo = K.forcing(st.ppm), dT = K.warming(st.ppm);
    var ground = Math.round(H * 0.86), strTop = Math.round(H * 0.08), strBot = Math.round(H * 0.34), tropTop = Math.round(H * 0.42);
    var L = phone ? 6 : 12, R = Wd - (phone ? 6 : 12), labX = phone ? L + 6 : L + 12;
    g.push('<rect class="cc-space" x="0" y="0" width="' + Wd + '" height="' + strTop + '"/>');
    g.push('<rect class="cc-strat" x="0" y="' + strTop + '" width="' + Wd + '" height="' + (tropTop - strTop) + '"/>');
    g.push('<rect class="cc-trop" x="0" y="' + tropTop + '" width="' + Wd + '" height="' + (ground - tropTop) + '"/>');
    g.push('<rect class="cc-ozband" x="0" y="' + (strTop + 6) + '" width="' + Wd + '" height="' + (strBot - strTop - 6) + '" style="opacity:' + (0.25 + 0.55 * (du - 100) / 200).toFixed(2) + '"/>');
    g.push('<line class="cc-tropo" x1="0" x2="' + Wd + '" y1="' + tropTop + '" y2="' + tropTop + '"/>');
    // ground: hills, houses, trees
    g.push('<path class="cc-ground" d="M0 ' + ground + ' Q' + (Wd * 0.25) + ' ' + (ground - 10) + ' ' + (Wd * 0.5) + ' ' + (ground - 2) + ' T' + Wd + ' ' + (ground - 6) + ' V' + H + ' H0 Z"/>');
    for(var t = 0; t < (phone ? 4 : 7); t++){ var tx = Wd * (0.56 + t * (phone ? 0.1 : 0.06)), ty = ground - 4; g.push('<g class="cc-tree"><rect x="' + (tx - 1.5).toFixed(1) + '" y="' + (ty - 8) + '" width="3" height="10"/><circle cx="' + tx.toFixed(1) + '" cy="' + (ty - 13) + '" r="7"/></g>'); }
    var hx = Wd * 0.18; g.push('<g class="cc-house"><rect x="' + hx.toFixed(1) + '" y="' + (ground - 18) + '" width="22" height="16"/><path d="M' + (hx - 3).toFixed(1) + ' ' + (ground - 18) + ' l14 -11 l14 11 z"/></g>');
    // the sun
    var sx = phone ? 34 : 54, sy = strTop + (phone ? -2 : 4);
    g.push('<circle class="cc-sun" cx="' + sx + '" cy="' + sy + '" r="' + (phone ? 20 : 26) + '"/>');
    // molecules: ozone in its layer (fewer with CFCs), chlorine, CO2 in the troposphere
    var nO3 = Math.round((phone ? 26 : 46) * (du - 60) / 240), nCl = Math.round((phone ? 8 : 14) * st.cfc), nCO2 = Math.round((phone ? 10 : 18) * Math.min(4.3, st.ppm / 280));
    O3P.slice(0, nO3).forEach(function(p){ g.push(o3(L + 70 + p[0] * (R - L - 80), strTop + 12 + p[1] * (strBot - strTop - 20), phone ? 0.85 : 1)); });
    CLP.slice(0, nCl).forEach(function(p){ g.push(cl(L + 80 + p[0] * (R - L - 90), strTop + 14 + p[1] * (strBot - strTop - 24))); });
    CO2P.slice(0, nCO2).forEach(function(p){ g.push(co2(L + 50 + p[0] * (R - L - 60), tropTop + 14 + p[1] * (ground - tropTop - 50), phone ? 0.8 : 1)); });
    // visible sunlight: passes straight through to the ground
    var vis = [0.32, 0.5];
    vis.forEach(function(f){ var x1 = Wd * f; g.push('<line class="cc-vis" x1="' + (sx + 18) + '" y1="' + (sy + 12) + '" x2="' + x1.toFixed(1) + '" y2="' + (ground - 6) + '"/>' + head(x1, ground - 6, Math.atan2(ground - 6 - sy - 12, x1 - sx - 18), 'cc-h-vis')); });
    // ultraviolet: stopped in the ozone layer; UV-B through, stronger as ozone thins
    var uvs = phone ? [0.3, 0.46] : [0.24, 0.36, 0.48];
    uvs.forEach(function(f){ var x1 = Wd * f, y1 = strTop + (strBot - strTop) * 0.55; g.push(ray('cc-uv', sx + 22, sy + 4, x1, y1, 3, 7, 2.2) + '<circle class="cc-stop" cx="' + x1.toFixed(1) + '" cy="' + y1.toFixed(1) + '" r="5"/>'); });
    var uvw = 1 + 2.4 * (uv - 1) + 0.6, ux = Wd * (phone ? 0.58 : 0.6);
    g.push('<g style="opacity:' + Math.min(1, 0.35 + 0.65 * (uv - 1) / 1.5 + 0.25).toFixed(2) + '">' + ray('cc-uv', sx + 22, sy + 8, ux, ground - 8, 3, 7, Math.min(6, uvw)) + '</g>');
    // infrared: from the ground; some escapes, some is absorbed by CO2 and sent back down
    var share = Math.min(4, 1 + Math.round(3 * fo / K.forcing(1200))), irX = phone ? [0.68, 0.78, 0.88, 0.95] : [0.7, 0.77, 0.84, 0.91];
    irX.forEach(function(f, i){
      var x0 = Wd * f, y0 = ground - 6;
      if(i < share){ var ya = tropTop + (ground - tropTop) * (0.35 + 0.1 * (i % 2)); g.push(ray('cc-ir', x0, y0, x0 - 8, ya, 4, 16, 2.6) + '<circle class="cc-hit" cx="' + (x0 - 8).toFixed(1) + '" cy="' + ya.toFixed(1) + '" r="6"/>' + '<path class="cc-back" d="M' + (x0 - 12).toFixed(1) + ' ' + (ya + 6).toFixed(1) + ' q-18 ' + ((y0 - ya) * 0.4).toFixed(1) + ' -10 ' + (y0 - ya - 14).toFixed(1) + '"/>' + head(x0 - 22, y0 - 8, Math.PI / 2 + 0.2, 'cc-h-ir')); }
      else g.push(ray('cc-ir', x0, y0, x0 + 10, strTop - 4, 4, 16, 2.6));
    });
    // layer labels (left), boxed so they read over anything
    if(!simple){
      g.push('<text class="cc-layer" x="' + labX + '" y="' + (strBot - 8) + '">' + (phone ? 'Stratosphere' : 'Stratosphere, 15 to 35 km: the ozone layer') + '</text>');
      g.push('<text class="cc-layer" x="' + labX + '" y="' + (ground - 30) + '">' + (phone ? 'Troposphere' : 'Troposphere, 0 to 12 km: greenhouse gases') + '</text>');
      // key
      var kx = R - (phone ? 120 : 210), ky = strTop - (phone ? 6 : 0) + 4;
      if(!phone) g.push('<g class="cc-key"><rect x="' + (kx - 8) + '" y="' + (ky - 2) + '" width="' + (R - kx + 2) + '" height="58" rx="8"/>' +
        '<polyline class="cc-ray cc-uv" points="' + wave(kx, ky + 10, kx + 34, ky + 10, 3, 7) + '"/><text class="cc-keyt" x="' + (kx + 42) + '" y="' + (ky + 14) + '">Ultraviolet (from the Sun)</text>' +
        '<polyline class="cc-ray cc-ir" points="' + wave(kx, ky + 28, kx + 34, ky + 28, 4, 16) + '"/><text class="cc-keyt" x="' + (kx + 42) + '" y="' + (ky + 32) + '">Infrared (from the ground)</text>' +
        '<line class="cc-vis" x1="' + kx + '" x2="' + (kx + 34) + '" y1="' + (ky + 46) + '" y2="' + (ky + 46) + '"/><text class="cc-keyt" x="' + (kx + 42) + '" y="' + (ky + 50) + '">Visible sunlight</text></g>');
      // callouts on the action
      g.push('<text class="cc-call cc-c-uv" x="' + (Wd * 0.36).toFixed(1) + '" y="' + (strTop + 2 + (phone ? 10 : 0)) + '" text-anchor="middle">' + (phone ? 'O₃ absorbs UV' : 'Ozone absorbs UV') + '</text>');
      g.push('<text class="cc-call cc-c-ir" x="' + (Wd * (phone ? 0.74 : 0.78)).toFixed(1) + '" y="' + (tropTop + 18) + '" text-anchor="middle">' + (phone ? 'CO₂ traps IR' : 'CO₂ absorbs infrared') + '</text>');
      if(nCl) g.push('<text class="cc-call cc-c-cl" x="' + (Wd * 0.66).toFixed(1) + '" y="' + (strBot + 16) + '" text-anchor="middle">' + (phone ? 'Cl breaks O₃' : 'Cl + O₃ → ClO + O₂, and Cl is freed again') + '</text>');
      g.push('<text class="cc-call cc-c-uv" x="' + (ux + 8).toFixed(1) + '" y="' + (ground - 24) + '">UV-B ×' + F(uv, 2) + '</text>');
      g.push('<g class="cc-thermo"><rect x="' + (Wd * 0.44 - 4).toFixed(1) + '" y="' + (ground - 58) + '" width="8" height="46" rx="4"/><rect class="cc-merc" x="' + (Wd * 0.44 - 2).toFixed(1) + '" y="' + (ground - 14 - 36 * Math.min(1, 0.25 + dT / 7)).toFixed(1) + '" width="4" height="' + (36 * Math.min(1, 0.25 + dT / 7)).toFixed(1) + '"/><circle cx="' + (Wd * 0.44).toFixed(1) + '" cy="' + (ground - 12) + '" r="6"/></g><text class="cc-call cc-c-ir" x="' + (Wd * 0.44 + 10).toFixed(1) + '" y="' + (ground - 46) + '">+' + F(dT, 1) + ' °C</text>');
    }
    return { svg: g.join(''), du: du, uv: uv, fo: fo, dT: dT };
  }

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var EX = data.explore || {}, YRS = EX.years || [[1850, 285], [2024, 425]];
    var view = 'air', ppm = 425, cfc = 0.25, ocean = 425, warmC = 1, landPct = 0, seaIce = false, touched = false, LS = null, nid = T.nid('cc');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem cc-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Climate change</h2>' +
      '<div class="cc-fig"><svg class="cc-svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<div class="cc-ctl">' +
        '<div class="ls-seg cc-views" role="group" aria-label="Scene">' + VIEWS.map(function(x){ return '<button type="button" data-v="' + x.v + '" aria-pressed="false">' + x.label + '</button>'; }).join('') + '</div>' +
        '<div class="cc-grp cc-grp-air"></div><div class="cc-grp cc-grp-ocean"></div><div class="cc-grp cc-grp-sea"><button type="button" class="bt-btn cc-meltbtn" aria-pressed="false">Melt the floating sea ice</button></div>' +
      '</div>' +
      '<div class="cc-say"></div>' +
      T.moreHtml('<p class="ls-lbl cc-pl">CO₂ in a given year (NOAA)</p><div class="cc-years ls-scroll" role="group" aria-label="CO2 in a given year">' + YRS.map(function(y){ return '<button type="button" class="tchip cc-year" data-ppm="' + y[1] + '">' + y[0] + ': ' + y[1] + ' ppm</button>'; }).join('') + '<button type="button" class="tchip cc-year" data-ppm="560">Doubled: 560 ppm</button></div>' +
        '<p class="ls-lbl cc-pl">CFCs</p><div class="cc-cfcs ls-scroll" role="group" aria-label="CFC history"><button type="button" class="tchip cc-cfcp" data-c="0">Before 1930: none</button><button type="button" class="tchip cc-cfcp" data-c="0.9">1990s peak</button><button type="button" class="tchip cc-cfcp" data-c="0.5">Today: recovering</button></div>', 'years, CFC history') +
      '<div class="cc-nums"></div><p class="sr-only cc-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.cc-live'));
    var cue = T.cue('Raise CO₂, then add CFCs. Watch which layer each one changes.');
    $('.cc-ctl').insertBefore(cue.el, $('.cc-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var svg = $('.cc-svg');
    var sCO2 = T.slider({ label: 'CO₂ in the air', min: 280, max: 1200, step: 5, value: ppm, unit: 'ppm', onInput: function(v){ act(); ppm = v; ocean = v; sOc.set(v); draw(); words(); say(airLine()); } });
    var sCFC = T.slider({ label: 'CFC use', min: 0, max: 1, step: 0.05, value: cfc, onInput: function(v){ act(); cfc = v; draw(); words(); say(airLine()); } });
    relabel(sCFC, function(v){ return CFC_LABEL(v); });
    $('.cc-grp-air').appendChild(sCO2.el); $('.cc-grp-air').appendChild(sCFC.el);
    var sOc = T.slider({ label: 'CO₂ in the air', min: 280, max: 1200, step: 5, value: ocean, unit: 'ppm', onInput: function(v){ act(); ocean = v; ppm = v; sCO2.set(v); draw(); words(); say(oceanLine()); } });
    $('.cc-grp-ocean').appendChild(sOc.el);
    var sW = T.slider({ label: 'Ocean warming (top 700 m)', min: 0, max: 3, step: 0.1, value: warmC, unit: '°C', onInput: function(v){ act(); warmC = v; draw(); words(); say(seaLine()); } });
    var sL = T.slider({ label: 'Greenland ice sheet melted', min: 0, max: 100, step: 5, value: landPct, unit: '%', onInput: function(v){ act(); landPct = v; draw(); words(); say(seaLine()); } });
    var sea = $('.cc-grp-sea'); sea.insertBefore(sL.el, sea.firstChild); sea.insertBefore(sW.el, sea.firstChild);
    function relabel(s, fn){
      var out = s.el.querySelector('output'), inp = s.input;
      function show(){ out.textContent = fn(+inp.value); inp.setAttribute('aria-valuetext', fn(+inp.value)); }
      inp.addEventListener('input', show); s.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', show); });
      var set0 = s.set; s.set = function(v, fire){ set0(v, fire); show(); }; show();
    }
    function onClick(e){
      var b = e.target.closest('.cc-views button'); if(b){ setView(b.getAttribute('data-v')); return; }
      var y = e.target.closest('.cc-year'); if(y){ act(); ppm = ocean = +y.getAttribute('data-ppm'); sCO2.set(ppm); sOc.set(ppm); draw(); words(); say(view === 'ocean' ? oceanLine() : airLine()); return; }
      var c = e.target.closest('.cc-cfcp'); if(c){ act(); cfc = +c.getAttribute('data-c'); sCFC.set(cfc); draw(); words(); say(airLine()); return; }
      if(e.target.closest('.cc-meltbtn')){ act(); seaIce = !seaIce; sync(); draw(); words(); say(seaIce ? 'The floating sea ice melted. Sea level did not change.' : 'Sea ice back.'); }
    }
    host.addEventListener('click', onClick);
    function setView(v){ if(v === view) return; act(); view = v; sync(); draw(); words(); say(v === 'air' ? airLine() : v === 'ocean' ? oceanLine() : seaLine()); }
    function sync(){
      var root = LS ? LS.root : host;
      root.querySelectorAll('.cc-views button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === view)); });
      ['air', 'ocean', 'sea'].forEach(function(k){ var el = $('.cc-grp-' + k); if(el) el.hidden = k !== view; });
      var si = $('.cc-meltbtn'); if(si){ si.setAttribute('aria-pressed', String(seaIce)); si.textContent = seaIce ? 'Bring the sea ice back' : 'Melt the floating sea ice'; }
      root.querySelectorAll('.cc-cfcs, .cc-pl:nth-of-type(2)').forEach(function(x){ x.hidden = view !== 'air'; });
      if(LS && LS.setupRow) LS.setupRow.setup(view === 'sea' ? 'Model values' : 'Choose a year');
    }

    /* ------------------------------------------------- numbers and words */
    function airLine(){ var du = K.ozone(cfc); return 'CO₂ ' + ppm + ' ppm: long-run warming +' + F(K.warming(ppm), 1) + ' °C. CFCs ' + CFC_LABEL(cfc).toLowerCase() + ': ozone ' + Math.round(du) + ' DU, UV-B at the ground ×' + F(K.uvb(du), 2) + '.'; }
    function phNow(){ return K.ph(ocean); }
    function oceanLine(){ var p = phNow(); return 'CO₂ ' + ocean + ' ppm: ocean pH ' + F(p, 2) + ', ' + F(K.hFactor(8.2, p), 2) + ' times the hydrogen ions of 1850.'; }
    function seaParts(){ var th = K.expansion(K.BETA, 700, warmC), li = landPct / 100 * K.GREENLAND; return { th: th, li: li, si: 0, tot: th + li }; }
    function seaLine(){ var s = seaParts(); return 'Sea level +' + F(s.tot, 2) + ' m: thermal expansion ' + F(s.th, 2) + ' m, Greenland ice ' + F(s.li, 2) + ' m' + (seaIce ? ', melted sea ice 0 m.' : '.'); }
    function words(){
      var head, sub = '', why;
      if(view === 'air'){
        var du = K.ozone(cfc);
        head = 'CO₂ ' + ppm + ' ppm: more infrared trapped, long-run warming +' + F(K.warming(ppm), 1) + ' °C.';
        sub = cfc ? 'CFCs: chlorine thins the ozone layer to ' + Math.round(du) + ' DU' + (du < 220 ? ' (an ozone hole)' : '') + ', so more UV-B reaches the ground. A separate problem from warming.' : 'No CFCs: the ozone layer is whole at 300 DU.';
        why = airWhy();
      } else if(view === 'ocean'){
        var p = phNow();
        head = 'Ocean pH ' + F(p, 2) + ' at ' + ocean + ' ppm CO₂: ' + F(K.hFactor(8.2, p), 2) + ' times the H⁺ of 1850.';
        sub = 'The extra H⁺ uses up carbonate, the building block of shells and coral. The ocean is still basic (above 7), but less so.';
        why = oceanWhy();
      } else {
        var s = seaParts();
        head = 'Sea level +' + F(s.tot, 2) + ' m.';
        sub = seaIce ? 'The floating sea ice melted and sea level did not change: it already displaced its own weight of water.' : 'From warming water expanding and land ice melting into the sea. Try melting the floating sea ice.';
        why = seaWhy();
      }
      T.explain($('.cc-say'), '<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), why);
      nums();
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), 'explore');
        if(view === 'air'){
          var d2 = K.ozone(cfc);
          LS.pills([{ k: 'Greenhouse', html: '+' + F(K.warming(ppm), 1) + ' °C', tone: K.warming(ppm) > 2 ? 'bad' : K.warming(ppm) > 0.5 ? 'warn' : 'good' }], 'left', 'explore');
          LS.pills([{ k: 'Ozone', html: Math.round(d2) + ' DU', tone: d2 < 220 ? 'bad' : d2 < 280 ? 'warn' : 'good' }], 'right', 'explore');
        } else if(view === 'ocean'){
          LS.pills([{ k: 'pH', html: F(phNow(), 2), tone: phNow() < 8 ? 'bad' : phNow() < 8.15 ? 'warn' : 'good' }], 'left', 'explore');
          LS.pills([{ k: 'H⁺', html: '×' + F(K.hFactor(8.2, phNow()), 2), tone: 'readout' }], 'right', 'explore');
        } else {
          var sp = seaParts();
          LS.pills([{ k: 'Sea level', html: '+' + F(sp.tot, 2) + ' m', tone: sp.tot > 1 ? 'bad' : sp.tot > 0.2 ? 'warn' : 'good' }], 'left', 'explore');
          LS.pills(seaIce ? [{ k: 'Sea ice', html: '+0 m', tone: 'readout' }] : [], 'right', 'explore');
        }
      }
    }
    function airWhy(){
      return '<p><b>Greenhouse effect (lower layer, infrared).</b> Sunlight, mostly visible light, passes through the air and warms the ground. The warm ground gives off infrared. Greenhouse gases (water vapor, CO₂, methane, nitrous oxide, CFCs) absorb infrared and send part of it back down, so the surface stays warmer. More CO₂, more infrared caught: global warming.</p>' +
        '<p><b>Ozone layer (upper layer, ultraviolet).</b> Ozone (O₃) in the stratosphere absorbs most UV-B and UV-C. UV light frees chlorine from CFCs; one chlorine atom destroys many ozone molecules (Cl + O₃ → ClO + O₂, then ClO + O → Cl + O₂). Less ozone, more UV-B at the ground: skin cancer, cataracts, crop damage. The Montreal Protocol (1987) phased out CFCs, and the layer is recovering.</p>' +
        '<p><b>Never mix them up.</b> The ozone hole does not cause global warming, and CO₂ does not destroy ozone. One overlap: CFCs are also strong greenhouse gases.</p>' +
        '<p><b>The numbers.</b> Extra energy trapped: 5.35 × ln(' + ppm + ' / 280) = ' + F(K.forcing(ppm), 2) + ' W/m². Long-run warming assumes 3 °C for a doubling of CO₂ (IPCC best estimate); it is reached decades after the CO₂ rises.</p>';
    }
    function oceanWhy(){
      return '<p><b>The chemistry.</b> The ocean absorbs about a quarter of the CO₂ we emit. CO₂ + H₂O → H₂CO₃ (carbonic acid) → H⁺ + HCO₃⁻. More H⁺ means lower pH.</p>' +
        '<p><b>Shells.</b> The extra H⁺ combines with carbonate (CO₃²⁻ + H⁺ → HCO₃⁻). Corals, oysters, clams and pteropods need carbonate to build calcium carbonate (CaCO₃), so they grow more slowly, and shells can dissolve.</p>' +
        '<p><b>A log scale.</b> Each 1.0 drop in pH is 10 times as many H⁺ ions; a drop of 0.1 is 10^0.1 ≈ 1.26 times, about 26% more. Surface ocean pH has fallen from about 8.2 to about 8.1 since 1850 (NOAA).</p>';
    }
    function seaWhy(){
      return '<p><b>What raises sea level.</b> (1) Thermal expansion: warmer water takes up more space. (2) Land ice melting into the sea: mountain glaciers, the Greenland ice sheet (about 7.4 m if it all melted) and the Antarctic ice sheet (about 58 m).</p>' +
        '<p><b>What does not.</b> Floating sea ice (Arctic sea ice, ice shelves already afloat) already displaces its own weight of water, like an ice cube in a glass: when it melts, the level stays the same. Losing it still matters: dark water absorbs more sunlight than white ice (lower albedo), which speeds warming.</p>' +
        '<p><b>Thermal expansion here:</b> 0.00021 × 700 m × ' + F(warmC, 1) + ' °C = ' + F(K.expansion(K.BETA, 700, warmC), 3) + ' m, a simplified model.</p>';
    }
    function nums(){
      var box = $('.cc-nums'), h = '';
      if(view === 'air'){
        h = '<h3 class="ls-title-l">Two systems, side by side</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Greenhouse effect and ozone layer compared"><table class="ls-tbl"><caption class="sr-only">Greenhouse effect and ozone layer</caption><thead><tr><th scope="col"></th><th scope="col">Greenhouse effect</th><th scope="col">Ozone layer</th></tr></thead><tbody>' +
          '<tr><th scope="row">Where</th><td>Troposphere</td><td>Stratosphere</td></tr><tr><th scope="row">Radiation</th><td>Infrared, from the ground</td><td>Ultraviolet, from the Sun</td></tr><tr><th scope="row">Gases</th><td>H₂O, CO₂, CH₄, N₂O, CFCs</td><td>O₃, destroyed by Cl from CFCs</td></tr><tr><th scope="row">Problem</th><td>Global warming</td><td>More UV-B at the ground</td></tr><tr><th scope="row">Policy</th><td>Kyoto Protocol, Paris Agreement</td><td>Montreal Protocol</td></tr>' +
          '<tr><th scope="row">Now</th><td>' + ppm + ' ppm: ' + F(K.forcing(ppm), 2) + ' W/m², +' + F(K.warming(ppm), 1) + ' °C long run</td><td>' + Math.round(K.ozone(cfc)) + ' DU: UV-B ×' + F(K.uvb(K.ozone(cfc)), 2) + '</td></tr></tbody></table></div>';
      } else if(view === 'ocean'){
        h = '<h3 class="ls-title-l">pH by CO₂ (simple model)</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Ocean pH by CO2"><table class="ls-tbl"><caption class="sr-only">pH and H+ by CO2</caption><thead><tr><th scope="col">CO₂ (ppm)</th><th scope="col">pH</th><th scope="col">H⁺ vs 1850</th></tr></thead><tbody>' +
          [280, 350, 425, 560, 800, 1000, 1200].map(function(c){ var p = K.ph(c); return '<tr' + (c === ocean ? ' class="hl"' : '') + '><th scope="row">' + c + '</th><td class="r">' + F(p, 2) + '</td><td class="r">×' + F(K.hFactor(8.2, p), 2) + '</td></tr>'; }).join('') + '</tbody></table></div><p class="bt-small">pH = 8.2 − 0.6 × log₁₀(CO₂ / 280), a fit to about 8.1 at today\'s 420 ppm; not a forecast.</p>';
      } else {
        var s = seaParts();
        h = '<h3 class="ls-title-l">Where the rise comes from</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Sea level contributions"><table class="ls-tbl"><caption class="sr-only">Contributions</caption><thead><tr><th scope="col">Source</th><th scope="col">Rise</th></tr></thead><tbody><tr><th scope="row">Thermal expansion</th><td class="r">' + F(s.th, 3) + ' m</td></tr><tr><th scope="row">Greenland ice (land)</th><td class="r">' + F(s.li, 2) + ' m</td></tr><tr><th scope="row">Floating sea ice</th><td class="r">0 m</td></tr><tr><th scope="row">Total</th><td class="r">' + F(s.tot, 2) + ' m</td></tr></tbody></table></div><p class="bt-small">Greenland 7.4 m and Antarctica 58 m if fully melted (IPCC AR6). Expansion: 0.00021 per °C over the top 700 m.</p>';
      }
      box.innerHTML = h;
    }

    /* ---------------------------------------------------- the pictures */
    function size(){ var rc = $('.cc-fig').getBoundingClientRect(); return [Math.max(300, Math.min(1500, Math.round(rc.width) || 640)), Math.max(320, Math.min(1000, Math.round(rc.height) || 480))]; }
    function draw(){
      var wh = size(), Wd = wh[0], H = wh[1], phone = Wd < 640;
      svg.setAttribute('viewBox', '0 0 ' + Wd + ' ' + H); svg.setAttribute('width', Wd); svg.setAttribute('height', H);
      var o = view === 'air' ? airScene(Wd, H, phone) : view === 'ocean' ? oceanScene(Wd, H, phone) : seaScene(Wd, H, phone);
      svg.innerHTML = o.svg; svg.setAttribute('aria-label', o.label);
    }
    function airScene(Wd, H, phone){
      var top = Math.round(H * (phone ? 0.66 : 0.68)), a = atmos(Wd, top, { ppm: ppm, cfc: cfc }, phone), g = [a.svg];
      // the two readouts, side by side
      var gap = phone ? 10 : 24, pw = (Wd - 3 * gap) / 2, y0 = top + (phone ? 30 : 34), y1 = H - (phone ? 26 : 30);
      g.push(mini(gap, y0, pw, y1, phone ? 'Warming' : 'Greenhouse: warming vs CO₂', 'cc-c-ir', 280, 1200, 0, 6, function(c){ return K.warming(c); }, ppm, '+' + F(a.dT, 1) + ' °C', 'ppm', phone));
      g.push(mini(2 * gap + pw, y0, pw, y1, phone ? 'UV-B at ground' : 'Ozone: UV-B at the ground', 'cc-c-uv', 0, 1, 0.8, 3.2, function(c){ return K.uvb(K.ozone(c)); }, cfc, '×' + F(a.uv, 2) + ' (' + Math.round(a.du) + ' DU)', 'CFC use', phone));
      return { svg: g.join(''), label: 'Atmosphere cross-section. Troposphere: CO₂ at ' + ppm + ' ppm absorbs infrared from the ground and sends some back down; long-run warming +' + F(a.dT, 1) + ' °C. Stratosphere: ozone at ' + Math.round(a.du) + ' Dobson units absorbs ultraviolet' + (cfc ? '; chlorine from CFCs is breaking it down' : '') + '; UV-B at the ground ' + F(a.uv, 2) + ' times normal.' };
    }
    function mini(x, y0, w, y1, title, cls, a, b, lo, hi, fn, now, read, xl, phone){
      var g = [], L = x + (phone ? 6 : 30), R = x + w - 6, T0 = y0 + 18, B0 = y1 - 14, X = function(v){ return L + (v - a) / (b - a) * (R - L); }, Y = function(v){ return B0 - (v - lo) / (hi - lo) * (B0 - T0); };
      g.push('<rect class="cc-panel" x="' + x + '" y="' + (y0 - 22) + '" width="' + w + '" height="' + (y1 - y0 + 34) + '" rx="12"/>');
      g.push('<text class="cc-mh ' + cls + '" x="' + (x + 10) + '" y="' + (y0 - 4) + '">' + title + '</text>');
      var pts = []; for(var i = 0; i <= 60; i++){ var v = a + (b - a) * i / 60; pts.push(X(v).toFixed(1) + ',' + Y(fn(v)).toFixed(1)); }
      g.push('<line class="cc-axis" x1="' + L + '" x2="' + R + '" y1="' + B0 + '" y2="' + B0 + '"/><polyline class="cc-mcurve ' + cls + '" points="' + pts.join(' ') + '"/>');
      var px = X(now), py = Y(fn(now));
      g.push('<circle class="cc-mpt ' + cls + '" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="6"/><text class="cc-mread" x="' + (px > (L + R) / 2 ? px - 9 : px + 9).toFixed(1) + '" y="' + (py - 8).toFixed(1) + '" text-anchor="' + (px > (L + R) / 2 ? 'end' : 'start') + '">' + read + '</text>');
      g.push('<text class="cc-tk" x="' + L + '" y="' + (B0 + 13) + '">' + (xl === 'ppm' ? (phone ? '280' : '280 ppm') : 'none') + '</text><text class="cc-tk" x="' + R + '" y="' + (B0 + 13) + '" text-anchor="end">' + (xl === 'ppm' ? (phone ? '1,200' : '1,200 ppm') : (phone ? 'high' : 'very high CFCs')) + '</text>');
      return g.join('');
    }
    function oceanScene(Wd, H, phone){
      var g = [], p = phNow(), sea = Math.round(H * 0.3), bot = H - 8, L = phone ? 8 : 16, R = Wd - (phone ? 8 : 16);
      g.push('<rect class="cc-sky" x="0" y="0" width="' + Wd + '" height="' + sea + '"/><rect class="cc-sea" x="0" y="' + sea + '" width="' + Wd + '" height="' + (bot - sea) + '" style="fill:' + seaCol(p) + '"/>');
      g.push('<path class="cc-wave" d="' + (function(){ var d = 'M0 ' + sea; for(var x = 0; x <= Wd; x += 20) d += ' Q' + (x + 5) + ' ' + (sea - 4) + ' ' + (x + 10) + ' ' + sea + ' T' + (x + 20) + ' ' + sea; return d; })() + '"/>');
      // CO2 in the air and dissolving
      var n = Math.round((phone ? 6 : 10) * ocean / 280);
      CO2P.slice(0, Math.min(40, n)).forEach(function(q){ g.push(co2(L + 20 + q[0] * (Wd * 0.5), 18 + q[1] * (sea - 40), phone ? 0.9 : 1.1)); });
      for(var i = 0; i < 3; i++){ var ax = Wd * (0.12 + i * 0.12); g.push('<path class="cc-diss" d="M' + ax + ' ' + (sea - 26) + ' v40 m-5 -6 l5 6 l5 -6"/>'); }
      // the reactions
      var rx = phone ? L + 6 : Wd * 0.06, ry = sea + (phone ? 34 : 44), lh = phone ? 22 : 28;
      [['CO₂ + H₂O → H₂CO₃', 'carbonic acid'], ['H₂CO₃ → H⁺ + HCO₃⁻', 'hydrogen ions: pH falls'], ['H⁺ + CO₃²⁻ → HCO₃⁻', 'carbonate used up']].forEach(function(r, k){ g.push('<text class="cc-eq" x="' + rx + '" y="' + (ry + k * lh) + '">' + r[0] + '</text>' + (phone ? '' : '<text class="cc-eqn" x="' + (rx + 190) + '" y="' + (ry + k * lh) + '">' + r[1] + '</text>')); });
      // pH scale
      var sx0 = phone ? L + 10 : Wd * 0.06, sx1 = phone ? R - 10 : Wd * 0.55, sy = phone ? ry + 3 * lh + 30 : bot - 60, lo = 7.6, hi = 8.3, X = function(v){ return sx0 + (v - lo) / (hi - lo) * (sx1 - sx0); };
      g.push('<defs><linearGradient id="ccPh" x1="0" x2="1"><stop offset="0" class="cc-ph0"/><stop offset="1" class="cc-ph1"/></linearGradient></defs><rect x="' + sx0 + '" y="' + sy + '" width="' + (sx1 - sx0) + '" height="14" rx="7" fill="url(#ccPh)"/>');
      [7.6, 7.8, 8.0, 8.2].forEach(function(v){ g.push('<text class="cc-tk cc-on" x="' + X(v).toFixed(1) + '" y="' + (sy + 30) + '" text-anchor="middle">' + v.toFixed(1) + '</text>'); });
      g.push('<text class="cc-tk cc-on" x="' + sx0 + '" y="' + (sy - 8) + '">more acidic</text><text class="cc-tk cc-on" x="' + sx1 + '" y="' + (sy - 8) + '" text-anchor="end">more basic</text>');
      g.push('<path class="cc-phmark" d="M' + X(8.2).toFixed(1) + ' ' + (sy - 2) + ' v18"/><path class="cc-phnow" d="M' + X(p).toFixed(1) + ' ' + (sy - 6) + ' l-7 -10 h14 z"/><text class="cc-read cc-on" x="' + X(p).toFixed(1) + '" y="' + (sy - 20) + '" text-anchor="middle">pH ' + F(p, 2) + '</text>');
      // the shell and the carbonate around it
      var shx = phone ? Wd * 0.72 : Wd * 0.78, shy = phone ? sea + 40 : sea + (bot - sea) * 0.42, ss = phone ? 0.8 : 1.3, eat = Math.max(0, Math.min(1, (8.2 - p) / 0.5));
      var nC = Math.round((phone ? 10 : 16) * (1 - 0.75 * eat));
      spots(41, 16).slice(0, nC).forEach(function(q){ var a = q[0] * Math.PI * 2, d = (60 + q[1] * 50) * ss; g.push('<text class="cc-carb" x="' + (shx + Math.cos(a) * d).toFixed(1) + '" y="' + (shy + Math.sin(a) * d * 0.7).toFixed(1) + '" text-anchor="middle">CO₃²⁻</text>'); });
      g.push(shell(shx, shy, ss, eat));
      if(!phone) g.push('<text class="cc-lab cc-on" x="' + shx + '" y="' + (shy + 78 * ss) + '" text-anchor="middle">' + (eat < 0.15 ? 'A healthy shell' : eat < 0.6 ? 'Thinner shell: less carbonate' : 'Shell dissolving') + '</text>');
      return { svg: g.join(''), label: 'CO₂ at ' + ocean + ' ppm dissolving into the ocean. pH ' + F(p, 2) + ' on a scale from 7.6 to 8.3; ' + F(K.hFactor(8.2, p), 2) + ' times the hydrogen ions of 1850. Fewer carbonate ions around a ' + (eat < 0.15 ? 'healthy' : eat < 0.6 ? 'thinning' : 'dissolving') + ' shell.' };
    }
    function seaCol(p){ var t = Math.max(0, Math.min(1, (8.2 - p) / 0.5)); var dk = document.documentElement.getAttribute('data-theme') === 'dark'; var a = dk ? [22, 74, 112] : [62, 140, 196], b = dk ? [44, 72, 70] : [104, 140, 132]; return 'rgb(' + [0, 1, 2].map(function(i){ return Math.round(a[i] + (b[i] - a[i]) * t); }).join(',') + ')'; }
    function shell(x, y, s, eat){
      var ribs = '', n = 7;
      for(var i = 0; i < n; i++){ var a = Math.PI * (0.12 + 0.76 * i / (n - 1)); ribs += '<line x1="0" y1="20" x2="' + (Math.cos(a) * -46).toFixed(1) + '" y2="' + (20 - Math.sin(a) * 52).toFixed(1) + '"/>'; }
      var holes = ''; spots(51, 9).slice(0, Math.round(eat * 9)).forEach(function(q){ holes += '<circle class="cc-hole" cx="' + ((q[0] - 0.5) * 70).toFixed(1) + '" cy="' + (q[1] * -40).toFixed(1) + '" r="' + (3 + q[0] * 4).toFixed(1) + '"/>'; });
      return '<g class="cc-shell" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s + ')" style="opacity:' + (1 - 0.35 * eat).toFixed(2) + '"><path d="M-50 18 Q-56 -30 0 -40 Q56 -30 50 18 Q0 30 -50 18 Z"/><g class="cc-ribs">' + ribs + '</g>' + holes + '<rect class="cc-hinge" x="-10" y="16" width="20" height="10" rx="3"/></g>';
    }
    function seaScene(Wd, H, phone){
      var g = [], s = seaParts(), L = phone ? 6 : 14, R = Wd - (phone ? 6 : 14);
      var base = Math.round(H * (phone ? 0.5 : 0.56)), scale = (phone ? 0.24 : 0.3) * H / 8, lvl = base - s.tot * scale;
      var shore = Wd * 0.44;
      g.push('<rect class="cc-sky" x="0" y="0" width="' + Wd + '" height="' + H + '"/>');
      // the sea and the old level
      g.push('<rect class="cc-sea" x="' + (shore - 60) + '" y="' + lvl.toFixed(1) + '" width="' + (Wd - shore + 60) + '" height="' + (H - lvl).toFixed(1) + '"/>');
      g.push('<line class="cc-oldlvl" x1="' + (shore - 40) + '" x2="' + R + '" y1="' + base + '" y2="' + base + '"/><text class="cc-tk" x="' + (R - 4) + '" y="' + (base + 14) + '" text-anchor="end">today\'s sea level</text>');
      // land with the ice sheet
      var land = 'M0 ' + (base - 70) + ' L' + (shore - 120) + ' ' + (base - 50) + ' Q' + (shore - 50) + ' ' + (base - 30) + ' ' + shore + ' ' + (base + 30) + ' L' + shore + ' ' + H + ' L0 ' + H + ' Z';
      g.push('<path class="cc-land" d="' + land + '"/>');
      var iceH = 60 * (1 - landPct / 100);
      if(iceH > 1) g.push('<path class="cc-icesheet" d="M' + (L + 4) + ' ' + (base - 70) + ' Q' + (L + 60) + ' ' + (base - 70 - iceH * 1.6) + ' ' + (shore - 150) + ' ' + (base - 54) + ' Z"/>');
      if(!phone || Wd > 360) g.push('<text class="cc-lab" x="' + (L + 10) + '" y="' + (base - 80 - iceH * 1.2) + '">' + (phone ? 'Land ice' : 'Land ice (an ice sheet)') + '</text>');
      if(landPct > 0) for(var m = 0; m < 3; m++){ var mx = shore - 140 + m * 30; g.push('<path class="cc-melt" d="M' + mx + ' ' + (base - 50 + m * 6) + ' q12 10 ' + (40 - m * 6) + ' ' + (30 - m * 4) + '"/>'); }
      // houses on the coast
      for(var hI = 0; hI < 3; hI++){ var hx = shore - 100 + hI * 30, hy = base - 34 + hI * 12, wet = lvl < hy + 4; g.push('<g class="cc-house' + (wet ? ' is-wet' : '') + '"><rect x="' + hx + '" y="' + (hy - 14) + '" width="18" height="14"/><path d="M' + (hx - 2) + ' ' + (hy - 14) + ' l11 -9 l11 9 z"/></g>'); }
      // warm water band
      if(warmC > 0){ var wh2 = 30 + warmC * 10; g.push('<rect class="cc-warm" x="' + shore + '" y="' + lvl.toFixed(1) + '" width="' + (R - shore) + '" height="' + wh2.toFixed(1) + '" style="opacity:' + Math.min(0.9, 0.3 + warmC * 0.2).toFixed(2) + '"/><text class="cc-lab" x="' + (shore + 10) + '" y="' + (lvl + wh2 / 2 + 4).toFixed(1) + '">' + (phone ? 'warmer water' : 'warmer water expands') + '</text>'); }
      // floating sea ice
      if(!seaIce){ var ix = shore + (R - shore) * 0.45; g.push('<path class="cc-seaice" d="M' + ix + ' ' + (lvl - 9).toFixed(1) + ' h90 l10 9 l-8 14 h-96 l-6 -14 z"/><text class="cc-lab" x="' + (ix + 45) + '" y="' + (lvl - 16).toFixed(1) + '" text-anchor="middle">' + (phone ? 'Sea ice' : 'Floating sea ice') + '</text>'); }
      else { var ix2 = shore + (R - shore) * 0.45; g.push('<text class="cc-lab cc-c-good" x="' + (ix2 + 45) + '" y="' + (lvl - 12).toFixed(1) + '" text-anchor="middle">sea ice melted: +0 m</text>'); }
      // the stacked bar of contributions
      var by = H - (phone ? 70 : 80), bx0 = L + 8, bx1 = R - 8, bs = (bx1 - bx0) / 8, segs = [['Thermal expansion', s.th, 'cc-b-th'], ['Land ice', s.li, 'cc-b-li']], at = bx0;
      g.push('<rect class="cc-panel" x="' + L + '" y="' + (by - 34) + '" width="' + (R - L) + '" height="' + (H - by + 28) + '" rx="12"/><text class="cc-mh" x="' + (L + 10) + '" y="' + (by - 14) + '">Sea level rise: +' + F(s.tot, 2) + ' m</text>');
      g.push('<rect class="cc-track" x="' + bx0 + '" y="' + by + '" width="' + (bx1 - bx0) + '" height="16" rx="5"/>');
      segs.forEach(function(q){ var w = q[1] * bs; if(w > 0.5) g.push('<rect class="' + q[2] + '" x="' + at.toFixed(1) + '" y="' + by + '" width="' + w.toFixed(1) + '" height="16"/>'); at += w; });
      for(var t = 0; t <= 8; t += (phone ? 2 : 1)) g.push('<text class="cc-tk" x="' + (bx0 + t * bs).toFixed(1) + '" y="' + (by + 30) + '" text-anchor="middle">' + t + ' m</text>');
      g.push('<text class="cc-tk cc-c-th" x="' + bx0 + '" y="' + (by + 46) + '">■ expansion ' + F(s.th, 2) + ' m</text><text class="cc-tk cc-c-li" x="' + ((bx0 + bx1) / 2) + '" y="' + (by + 46) + '" text-anchor="middle">■ land ice ' + F(s.li, 2) + ' m</text><text class="cc-tk" x="' + bx1 + '" y="' + (by + 46) + '" text-anchor="end">sea ice: 0 m</text>');
      // glass of water inset
      if(seaIce && !phone){ var gx = R - 110, gy = 24; g.push('<g class="cc-glass"><rect class="cc-panel" x="' + (gx - 10) + '" y="' + (gy - 10) + '" width="112" height="112" rx="10"/><path class="cc-glassw" d="M' + (gx + 16) + ' ' + (gy + 40) + ' h60 l-4 46 h-52 z"/><path class="cc-glasso" d="M' + (gx + 12) + ' ' + (gy + 8) + ' l8 82 h52 l8 -82"/><line class="cc-oldlvl" x1="' + (gx + 10) + '" x2="' + (gx + 82) + '" y1="' + (gy + 40) + '" y2="' + (gy + 40) + '"/><text class="cc-tk" x="' + (gx + 46) + '" y="' + (gy + 4) + '" text-anchor="middle">ice cube melted:</text><text class="cc-tk" x="' + (gx + 46) + '" y="' + (gy + 100) + '" text-anchor="middle">same level</text></g>'); }
      return { svg: g.join(''), label: 'Coast with land ice, a town and floating sea ice. Sea level up ' + F(s.tot, 2) + ' m: thermal expansion ' + F(s.th, 2) + ' m, land ice ' + F(s.li, 2) + ' m' + (seaIce ? '; the floating sea ice melted and added 0 m.' : '.') };
    }

    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.cc-fig')], dock: [$('.cc-ctl')], setup: 'Presets', moreLabel: 'Years and CFC history', why: [$('.cc-say')], details: [$('.cc-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      sync(); draw(); words();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.cc-grp-air input[type=range]'), text: 'Start here: add CO₂' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe($('.cc-fig')); }
      try{ new MutationObserver(function(){ draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
    }
    sync(); draw(); words();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'climate-change', noun: 'drill',
      generate: function(r, ctx, type){ return K.generate(r, ctx, type); },
      types: [{ value: 'gases', label: 'Greenhouse effect vs ozone' }, { value: 'co2', label: 'Percent change in CO₂' }, { value: 'ph', label: 'Ocean acidification' }, { value: 'sealevel', label: 'Sea level' }, { value: 'gwp', label: 'CO₂ equivalent' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { gases: 'Two systems, never mixed', co2: 'The Keeling Curve', ph: 'Ocean acidification', sealevel: 'Sea level rise', gwp: 'Global warming potential' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st, data); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st, data); }
    });
  }
  function figure(el, p, st, data){
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    var phone = (window.innerWidth || 1280) <= 640, Wd = phone ? 340 : 600, H = phone ? 320 : 330, out = [], label = '', L = 52, R = Wd - 18, top = 34, bot = H - 46;
    if(g.kind === 'atmos'){
      var a = atmos(Wd, H, { ppm: 425, cfc: 0.3 }, phone, false);
      out.push(a.svg); label = 'Atmosphere: ozone in the stratosphere absorbs ultraviolet from the Sun; greenhouse gases in the troposphere absorb infrared from the ground.';
    } else if(g.kind === 'keeling'){
      var yrs = ((data && data.explore && data.explore.years) || []).slice();
      [[g.y0, g.C0], [g.y1, g.C1]].forEach(function(q){ if(!yrs.some(function(y){ return y[0] === q[0]; })) yrs.push(q); });
      yrs.sort(function(a, b){ return a[0] - b[0]; });
      var X = function(y){ return L + (y - 1850) / (2030 - 1850) * (R - L); }, Y = function(v){ return bot - (v - 260) / (440 - 260) * (bot - top); };
      [280, 320, 360, 400, 440].forEach(function(v){ out.push('<line class="cc-grid" x1="' + L + '" x2="' + R + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="cc-tk" x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>'); });
      [1850, 1900, 1950, 2000].forEach(function(y){ out.push('<text class="cc-tk" x="' + X(y).toFixed(1) + '" y="' + (bot + 16) + '" text-anchor="middle">' + y + '</text>'); });
      out.push('<polyline class="cc-mcurve cc-c-co2" points="' + yrs.map(function(q){ return X(q[0]).toFixed(1) + ',' + Y(q[1]).toFixed(1); }).join(' ') + '"/>');
      yrs.forEach(function(q){ var sel = q[0] === g.y0 || q[0] === g.y1; out.push('<circle class="cc-kpt' + (sel ? ' is-sel' : '') + '" cx="' + X(q[0]).toFixed(1) + '" cy="' + Y(q[1]).toFixed(1) + '" r="' + (sel ? 6 : 3.5) + '"/>' + (sel ? '<text class="cc-mread" x="' + (X(q[0]) - 8).toFixed(1) + '" y="' + (Y(q[1]) - 10).toFixed(1) + '" text-anchor="end">' + q[0] + ': ' + q[1] + ' ppm</text>' : '')); });
      if(st.answer) out.push('<text class="cc-tag" x="' + R + '" y="' + (bot - 10) + '" text-anchor="end">+' + F((g.C1 - g.C0) / g.C0 * 100, 1) + '%</text>');
      out.push('<line class="cc-axis" x1="' + L + '" x2="' + R + '" y1="' + bot + '" y2="' + bot + '"/><text class="cc-axl" x="' + L + '" y="' + (top - 12) + '">Atmospheric CO₂ (ppm), NOAA</text>');
      label = 'Atmospheric CO₂: ' + yrs.map(function(q){ return q[0] + ' ' + q[1] + ' ppm'; }).join(', ') + '.';
    } else if(g.kind === 'ph'){
      var lo = 7.0, hi = 8.6, Xp = function(v){ return L + (v - lo) / (hi - lo) * (R - L); }, y = H * 0.42;
      out.push('<defs><linearGradient id="ccPhQ" x1="0" x2="1"><stop offset="0" class="cc-ph0"/><stop offset="1" class="cc-ph1"/></linearGradient></defs><rect x="' + L + '" y="' + y + '" width="' + (R - L) + '" height="18" rx="9" fill="url(#ccPhQ)"/>');
      for(var v = 7.0; v <= 8.61; v += 0.2) out.push('<text class="cc-tk" x="' + Xp(v).toFixed(1) + '" y="' + (y + 36) + '" text-anchor="middle">' + v.toFixed(1) + '</text>');
      out.push('<text class="cc-tk" x="' + L + '" y="' + (y - 34) + '">7 is neutral</text>');
      [[g.ph0, 'before', 'cc-c-b'], [g.ph1, 'after', 'cc-c-ir']].forEach(function(q, i){ var x = Xp(q[0]); out.push('<path class="cc-phnow ' + q[2] + '" d="M' + x.toFixed(1) + ' ' + (y - 4) + ' l-8 -12 h16 z"/><text class="cc-mread" x="' + x.toFixed(1) + '" y="' + (y - 22 - i * 16) + '" text-anchor="middle">' + q[1] + ': ' + q[0].toFixed(1) + '</text>'); });
      if(st.times) out.push('<text class="cc-tag" x="' + ((L + R) / 2) + '" y="' + (H - 30) + '" text-anchor="middle">×' + F(Math.pow(10, g.ph0 - g.ph1), 2) + ' as many H⁺ ions</text>');
      label = 'pH scale from 7.0 to 8.6: before ' + g.ph0 + ', after ' + g.ph1 + '.';
    } else if(g.kind === 'sea'){
      var cx = Wd / 2, wt = H * 0.32, deep = H - 40, warm = wt + (deep - wt) * 0.5;
      out.push('<rect class="cc-sea" x="' + (L - 30) + '" y="' + wt + '" width="' + (R - L + 30) + '" height="' + (deep - wt) + '" rx="6"/><rect class="cc-warm" x="' + (L - 30) + '" y="' + wt + '" width="' + (R - L + 30) + '" height="' + (warm - wt) + '" style="opacity:.5"/>');
      out.push('<text class="cc-lab cc-on" x="' + (L - 20) + '" y="' + (wt + 22) + '">top ' + g.depth + ' m warms ' + g.dT + ' °C</text><path class="cc-dim" d="M' + (R - 14) + ' ' + wt + ' V' + warm + '"/><text class="cc-tk cc-on" x="' + (R - 20) + '" y="' + ((wt + warm) / 2 + 4) + '" text-anchor="end">' + g.depth + ' m</text>');
      out.push('<line class="cc-oldlvl" x1="' + (L - 30) + '" x2="' + R + '" y1="' + wt + '" y2="' + wt + '"/><text class="cc-tk" x="' + (L - 30) + '" y="' + (wt - 8) + '">sea level now</text>');
      if(st.cm) out.push('<path class="cc-rise" d="M' + cx + ' ' + wt + ' v-26 m-6 8 l6 -8 l6 8"/><text class="cc-tag" x="' + (cx + 10) + '" y="' + (wt - 14) + '">+' + F(g.cm, 1) + ' cm</text>');
      label = 'Ocean column: the top ' + g.depth + ' m warms ' + g.dT + ' °C.' + (st.cm ? ' Sea level rises ' + F(g.cm, 1) + ' cm.' : '');
    } else if(g.kind === 'gwp'){
      var gases = ['CO2', 'CH4', 'N2O'], bw = (R - L) / 3, lg = function(v){ return Math.log10(v); }, Yg = function(v){ return bot - lg(v) / 3 * (bot - top); };
      [1, 10, 100, 1000].forEach(function(v){ out.push('<line class="cc-grid" x1="' + L + '" x2="' + R + '" y1="' + Yg(v).toFixed(1) + '" y2="' + Yg(v).toFixed(1) + '"/><text class="cc-tk" x="' + (L - 6) + '" y="' + (Yg(v) + 4).toFixed(1) + '" text-anchor="end">' + big(v) + '</text>'); });
      gases.forEach(function(k, i){ var v = K.GWP[k], bx = L + i * bw + bw * 0.25, w = bw * 0.5, yy = Yg(Math.max(v, 1.2)); out.push('<rect class="cc-gbar' + (k === g.gas ? ' is-sel' : '') + '" x="' + bx.toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (bot - yy).toFixed(1) + '" rx="4"/><text class="cc-mread" x="' + (bx + w / 2).toFixed(1) + '" y="' + (yy - 6).toFixed(1) + '" text-anchor="middle">' + big(v) + '</text><text class="cc-name" x="' + (bx + w / 2).toFixed(1) + '" y="' + (bot + 16) + '" text-anchor="middle">' + k.replace('4', '₄').replace('2O', '₂O').replace('O2', 'O₂') + '</text>'); });
      out.push('<line class="cc-axis" x1="' + L + '" x2="' + R + '" y1="' + bot + '" y2="' + bot + '"/><text class="cc-axl" x="' + L + '" y="' + (top - 12) + '">Global warming potential, 100 years (log scale)</text>');
      if(st.co2e) out.push('<text class="cc-tag" x="' + R + '" y="' + (top + 8) + '" text-anchor="end">' + big(g.co2e) + ' t CO₂e</text>');
      label = 'Global warming potential over 100 years: CO₂ 1, CH₄ 28, N₂O 265.';
    }
    el.innerHTML = '<figure class="cd-fig cc-qfig"><svg class="cc-svg" viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + out.join('') + '</svg></figure>';
  }
})();
