/* Water pollution trainer page, v2 (docs/tools-v2-water-pollution-brief.md: the flagship of the v2 tool pattern;
   docs/apenv-spec.md section 6). OWNED BY THIS TOOL ONLY. Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.waterPollution (environmental-science/assets/tools/math/water-pollution.js), the content
   environmental-science/data/tools/water-pollution.json. The frame is ApEnvTools.modes (Explore, then Test yourself)
   on the Tool Studio; Explore is built from the shared v2 kit (assets/course/tool-kit2.js, LevlKit2).

   Explore: three chapters, named tabs on the stage.
     1 Fertilizer runoff  a farm field over a lake. Drag the fertilizer sacks (0 to 5) and the lake's thermometer
                          (10 to 30 °C) on the picture, press Play (or drag along the graph): rain washes the
                          fertilizer in, the surface turns green, the algae die, turn brown and sink, decomposers
                          multiply on the bed, the bottom water's oxygen bubbles thin out and darken, the fish rise,
                          gasp at the surface and leave below 2 mg/L, and come back as the air puts oxygen back.
                          The six named links light on the timeline as the day reaches them; the graph (bottom
                          oxygen, algae, 2 mg/L and saturation) shares the day cursor and is revealed as days pass.
     2 Hot water          a power plant on a trout river. Drag the handle on the outflow pipe (+0 to +15 °C):
                          the plume warms the river below the plant; a thermometer and an oxygen gauge each side
                          show what the water can hold (USGS); the trout stay or swim up out of the warm water.
                          The graph is the saturation curve with both points; dragging along it sets the outflow.
     3 Sewage             town, plant and the lake below. Tap a tank to make it the last stage used: the
                          skipped tanks grey out, a bypass pipe carries the flow round them, and the lake below
                          runs the chapter 1 model with the nitrogen and phosphorus left (scaled to a runoff
                          level, SEW_LEVEL); its oxygen graph and picture share a cursor.
   Side panel (each chapter): the goal (s.task), Predict, a live Readout and one Challenge at a time.
   "?": how the model works, the sources, the tables and the settings, as a sheet over the stage.
   Colors by role (oxygen blue, algae green, dead matter brown, nutrients orange, heat vermillion; Okabe-Ito,
   lighter in dark mode). Every value is also written, so color is never the only cue.
   Reduced motion: no ambient motion; Play jumps to the end; the scene still shows every state.
   Test yourself: ApEnvTools.drill over the model's generate(), with a figure drawn from the problem's numbers. */
(function(){
  'use strict';
  var T = window.ApEnvTools, M = window.ApEnvMath, K = window.LevlKit2;
  if(!T || !M || !M.waterPollution) return;
  var W = M.waterPollution, esc = T.esc;
  function F(x, d){ return T.F(x, d == null ? 1 : d); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, f){ return a + (b - a) * f; }
  function sstep(a, b, x){ var f = clamp((x - a) / (b - a), 0, 1); return f * f * (3 - 2 * f); }
  function n1(v){ return (+v).toFixed(1); }

  /* New numbers (sources in "?" and in docs/tools-v2-water-pollution-brief.md, Build notes):
     HEALTHY  5 mg/L: most aquatic animals need about 5 mg/L or more to thrive (Chesapeake Bay Program,
              "Dissolved oxygen"). Below it the readout says Stressed; below W.HYPOXIC (2 mg/L), Dead zone.
     TROUT    9.5 mg/L: EPA's 1986 dissolved oxygen criteria for coldwater fish, early life stages (7-day mean
              in the water column; EPA factsheet on dissolved oxygen, 2021). What young trout NEED is oxygen in
              the water; the tool compares it with the most the water can HOLD (saturation, read to 0.1 mg/L):
              where even full water holds less than 9.5 mg/L, trout cannot breed there.
     SEW_LEVEL the lake below the plant: the share of nitrogen and phosphorus left after the last stage (W.SEWAGE,
              EPA typical values) scaled to the chapter 1 runoff level, raw sewage = the heaviest level, 5; and the
              organic matter (BOD) left goes in as an oxygen demand on day 0 (W.lake's third argument, W.BOD_D).
              A teaching mapping, not a measured one ("?" says so). */
  var HEALTHY = 5, TROUT = 9.5, SEW_T = 20, ALG_MAX = 120, Y_MAX = 12;
  function SEW_LEVEL(i){ return 5 * W.SEWAGE.stages[i].left.nutrients / 100; }
  function sewRun(i){ return prep(W.lake(SEW_LEVEL(i), SEW_T, W.SEWAGE.stages[i].left.bod)); }
  var CH = [{ value: 'fert', label: 'Fertilizer runoff', short: 'Fertilizer' }, { value: 'heat', label: 'Hot water' }, { value: 'sew', label: 'Sewage' }];
  var STEPS = [{ name: 'Runoff' }, { name: 'Algae bloom' }, { name: 'Algae die' }, { name: 'Decomposers feed' }, { name: 'Oxygen drops' }, { name: 'Dead zone', tone: 'bad' }];
  var STEP_LONG = ['Rain washes fertilizer off the field. Nitrate and phosphate reach the lake.',
    'Nitrate and phosphate usually limit algae. With more of them, algae multiply and turn the surface green.',
    'The bloom shades itself and runs out of nutrients. Huge numbers of algae die, turn brown and sink.',
    'Aerobic bacteria break down the dead algae on the bottom. They use oxygen as they respire.',
    'Decomposers use oxygen faster than the air can put it back into the bottom water.',
    'Below 2 mg/L the water is hypoxic: fish leave or die. This is a dead zone.'];
  var SEW_STEPS = ['Outfall', 'Algae bloom', 'Algae die', 'Decomposers feed', 'Oxygen drops', 'Dead zone'];
  var SEW_LONG = ['Treated water leaves the plant for the lake, with whatever N, P and organic matter the plant left in it.',
    STEP_LONG[1], STEP_LONG[2],
    'Aerobic bacteria break down the dead algae, and any organic matter (BOD) the plant left, using oxygen as they respire.',
    STEP_LONG[4], STEP_LONG[5]];
  var REC_LONG = 'Most of the dead algae are gone, so decomposers slow down and the air puts oxygen back into the water.';
  var SEW_NAMES = ['No treatment', 'Primary', 'Secondary', 'Tertiary', 'Disinfection'];
  var SEW_DOES = ['', 'solids settle', 'bacteria eat waste', 'removes N and P', 'kills germs'];
  var SEW_DOES_S = ['', 'solids', 'organic', 'N and P', 'germs'];

  function status(o){ return o < W.HYPOXIC ? { status: 'Dead zone', tone: 'bad' } : o < HEALTHY ? { status: 'Stressed', tone: 'warn' } : { status: 'Healthy', tone: 'good' }; }
  function dark(){ return document.documentElement.getAttribute('data-theme') === 'dark'; }
  function sk(n){ return n + (n === 1 ? ' sack' : ' sacks'); }
  /* Oxygen as written everywhere (readout, scene, graph, words): one decimal, but two right around the 2 mg/L line,
     so a value just under it never reads "2.0" next to "Dead zone". */
  function fO(o){ return o >= 1.95 && o < 2.05 ? T.F(o, 2) : T.F(o, 1); }
  function narrow(){ try{ return matchMedia('(max-width: 999.98px)').matches; }catch(e){ return false; } }

  /* Colors for the picture (the CSS role colors are in water-pollution.css; these are the blends JS computes). */
  var PAL = {
    light: { sky0: '#BFE0F2', sky1: '#EEF6FA', far: '#B7D2B4', near: '#94BE86', grass: '#78AE48', grass2: '#5C8F35', soil: '#B88C5C', soil2: '#8F6A44', soil3: '#6F5236',
      top: [118, 189, 226], deep: [44, 108, 156], green: [92, 158, 40], mat: [70, 140, 30], murky: [74, 70, 48], bed: '#8C7656', bed2: '#6A583F', silt: '#A08A66',
      alg: [86, 150, 44], algHi: [150, 205, 90], brown: [120, 84, 44], nut: '#E69F00', bac: '#B5509A', bub: 'rgba(255,255,255,.95)', sun: '#F6C445',
      cloud: '#8E9A99', cloud2: '#A9B4B2', rain: '#5A9CCB', conc: '#C9CED0', conc2: '#A4ABAD', steel: '#7B8A90', brick: '#B5654A', roof: '#7A4A3A', warm: [230, 120, 60] },
    dark: { sky0: '#18324A', sky1: '#203A4E', far: '#2D4A3F', near: '#2B4636', grass: '#4E7F33', grass2: '#3D6A28', soil: '#6A5238', soil2: '#53402B', soil3: '#3E3020',
      top: [52, 120, 160], deep: [22, 60, 94], green: [74, 140, 40], mat: [84, 150, 44], murky: [44, 42, 30], bed: '#4E4231', bed2: '#3A3024', silt: '#5E5038',
      alg: [92, 170, 60], algHi: [150, 215, 100], brown: [150, 108, 64], nut: '#F3C04F', bac: '#E08CC8', bub: 'rgba(225,242,255,.9)', sun: '#E8E2C8',
      cloud: '#4C5A60', cloud2: '#5E6C72', rain: '#7FB6DE', conc: '#5A6468', conc2: '#465054', steel: '#8A9AA0', brick: '#9A5A44', roof: '#6A4436', warm: [240, 140, 80] }
  };
  function mix(a, b, f){ f = clamp(f, 0, 1); return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * f) + ',' + Math.round(a[1] + (b[1] - a[1]) * f) + ',' + Math.round(a[2] + (b[2] - a[2]) * f) + ')'; }
  function mixA(a, b, f){ f = clamp(f, 0, 1); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
  function rnd(seed, n){ var r = M.rng(seed), out = []; for(var i = 0; i < n; i++) out.push([r(), r(), r(), r()]); return out; }
  var R_ALG = rnd(7, 90), R_BAC = rnd(13, 44), R_BUB = rnd(19, 20), R_NUT = rnd(23, 30), R_PLANT = rnd(29, 14), R_PEB = rnd(31, 26), R_RAIN = rnd(37, 40);

  /* A model value on a fractional day (straight lines between the model's daily values). */
  function at(arr, d){ var i = Math.floor(d), f = d - i; if(i >= arr.length - 1) return arr[arr.length - 1]; if(i < 0) return arr[0]; return arr[i] + (arr[i + 1] - arr[i]) * f; }

  /* Per run: what the picture needs beyond the model's own arrays (when each algae clump dies, the largest dead pool). */
  function prep(run){
    var peakA = run.peakA, nA = Math.round(clamp(peakA / 30, 0.08, 1.3) * 64), deaths = [];
    for(var k = 0; k < nA; k++){
      var thr = peakA * (1 - (k + 0.5) / nA), dd = null;
      for(var i = Math.max(1, Math.round(run.peakDay)); i < run.days.length; i++) if(run.A[i] < thr){ var a0 = run.A[i - 1], a1 = run.A[i]; dd = i - 1 + (a0 - thr) / ((a0 - a1) || 1); break; }
      deaths.push(dd);
    }
    var Dmax = 0; run.D.forEach(function(v){ if(v > Dmax) Dmax = v; });
    run.nA = nA; run.deaths = deaths; run.Dmax = Dmax;
    var fh = -1; for(var j = 0; j < run.O.length; j++) if(run.O[j] < W.HYPOXIC){ fh = j; break; }
    run.firstHyp = fh;
    return run;
  }
  /* The step a run is in on a day, with recovery: once the low is past and the water is back above 2 mg/L, the
     scene, the timeline and the readout all say the lake is recovering (one rule, so they agree). */
  function phase(r, d){
    var cur = W.stageAt(r, d), o = at(r.O, d);
    var rec = cur >= 4 && d > r.minDay + 0.5 && o >= W.HYPOXIC && o > r.min + 0.4;
    return { cur: cur, rec: rec, o: o };
  }

  /* A fertilizer bag: a filled sack with a folded, stitched top and a printed label (N-P-K), so it reads as fertilizer. */
  function sack(x, y, w, P0){
    var h = w * 1.3, lab = w >= 31;
    return '<g class="wp2-sack" transform="translate(' + n1(x) + ' ' + n1(y) + ')">' +
      '<path class="wp2-sack-bag" d="M' + n1(-w * 0.5) + ' 0 C' + n1(-w * 0.56) + ' ' + n1(-h * 0.35) + ' ' + n1(-w * 0.5) + ' ' + n1(-h * 0.78) + ' ' + n1(-w * 0.44) + ' ' + n1(-h * 0.88) +
        ' L' + n1(w * 0.44) + ' ' + n1(-h * 0.88) + ' C' + n1(w * 0.5) + ' ' + n1(-h * 0.78) + ' ' + n1(w * 0.56) + ' ' + n1(-h * 0.35) + ' ' + n1(w * 0.5) + ' 0Z"/>' +
      '<path class="wp2-sack-top" d="M' + n1(-w * 0.46) + ' ' + n1(-h * 0.86) + ' L' + n1(-w * 0.4) + ' ' + n1(-h) + ' L' + n1(w * 0.4) + ' ' + n1(-h) + ' L' + n1(w * 0.46) + ' ' + n1(-h * 0.86) + 'Z"/>' +
      '<path class="wp2-sack-st" d="M' + n1(-w * 0.4) + ' ' + n1(-h * 0.93) + ' H' + n1(w * 0.4) + '"/>' +
      '<rect class="wp2-sack-b" x="' + n1(-w * 0.38) + '" y="' + n1(-h * 0.66) + '" width="' + n1(w * 0.76) + '" height="' + n1(h * 0.38) + '" rx="2"/>' +
      (lab ? '<text class="wp2-sack-t" x="0" y="' + n1(-h * 0.41) + '" text-anchor="middle" font-size="' + n1(Math.min(9, w * 0.3)) + '">N-P-K</text>'
        : '<text class="wp2-sack-t" x="0" y="' + n1(-h * 0.41) + '" text-anchor="middle" font-size="' + n1(w * 0.33) + '">NPK</text>') + '</g>';
  }
  /* One tank in cutaway; on: used; i: 0 raw inflow, 1 primary, 2 secondary, 3 tertiary, 4 disinfection. */
  function tankArt0(tk, i, on, t, P0, ph, moving){
    var out = [], x0 = tk.x, x1 = tk.x + tk.w, y0 = tk.y, y1 = tk.y + tk.h, wl = y0 + tk.h * 0.16, cx = (x0 + x1) / 2, ww = x1 - x0;
    var lf = i ? W.SEWAGE.stages[i].left : W.SEWAGE.stages[0].left, dirt = clamp((lf.solids * 0.5 + lf.bod * 0.5) / 100, 0, 1);
    var water = mixA(P0.top, P0.murky, dirt * 0.9);
    out.push('<g class="wp2-tank' + (on ? '' : ' is-off') + '">');
    out.push('<rect class="wp2-tank-in" x="' + n1(x0) + '" y="' + n1(y0) + '" width="' + n1(ww) + '" height="' + n1(tk.h) + '" rx="4"/>');
    out.push('<rect x="' + n1(x0 + 3) + '" y="' + n1(wl) + '" width="' + n1(ww - 6) + '" height="' + n1(y1 - wl - 3) + '" fill="' + mix(water, water, 0) + '"/>');
    var mv = on && moving ? t : 0;
    if(i === 0){
      for(var k = 0; k < 7; k++){ var px = x0 + 6 + (k * 13 % Math.max(8, ww - 12)), py = wl + 6 + ((k * 17 + mv * 10) % Math.max(8, y1 - wl - 12)); out.push('<circle cx="' + n1(px) + '" cy="' + n1(py) + '" r="' + n1(1.6 + k % 3) + '" fill="' + P0.soil2 + '"/>'); }
    } else if(i === 1){
      out.push('<path fill="' + P0.soil2 + '" d="M' + n1(x0 + 3) + ' ' + n1(y1 - tk.h * 0.2) + ' Q' + n1(cx) + ' ' + n1(y1 - tk.h * 0.05) + ' ' + n1(x1 - 3) + ' ' + n1(y1 - tk.h * 0.2) + ' V' + n1(y1 - 3) + ' H' + n1(x0 + 3) + 'Z"/>');
      for(var a = 0; a < 4; a++){ var ax = x0 + ww * (0.2 + a * 0.2), ay = wl + 8 + ((a * 9 + mv * 8) % Math.max(10, tk.h * 0.45)); out.push('<circle cx="' + n1(ax) + '" cy="' + n1(ay) + '" r="2.4" fill="' + P0.soil2 + '"/>'); }
    } else if(i === 2){
      out.push('<path stroke="' + P0.steel + '" stroke-width="3" d="M' + n1(x0 + 6) + ' ' + n1(y1 - 7) + ' H' + n1(x1 - 6) + '"/>');
      for(var c = 0; c < 4; c++) for(var b = 0; b < 4; b++){ var by = y1 - 12 - ((b * (tk.h * 0.18) + mv * 26) % (y1 - wl - 16)); out.push('<circle cx="' + n1(x0 + ww * (0.15 + c * 0.23) + (b % 2 ? 2 : -2)) + '" cy="' + n1(by) + '" r="' + n1(1.6 + b % 2) + '" fill="none" stroke="' + P0.bub + '" stroke-width="1.1"/>'); }
      for(var r = 0; r < 6; r++) out.push('<rect class="wp2-bac" x="' + n1(x0 + 8 + (r * 23 % Math.max(10, ww - 18)) + Math.sin(mv * 2 + r) * 2) + '" y="' + n1(wl + 10 + (r * 19 % Math.max(10, y1 - wl - 26))) + '" width="5.2" height="2.2" rx="1.1"/>');
    } else if(i === 3){
      var fT = wl + (y1 - wl) * 0.45;
      out.push('<rect fill="' + P0.silt + '" x="' + n1(x0 + 3) + '" y="' + n1(fT) + '" width="' + n1(ww - 6) + '" height="' + n1(y1 - fT - 3) + '"/>');
      for(var gq = 0; gq < 12; gq++) out.push('<circle cx="' + n1(x0 + 6 + (gq * 17 % Math.max(8, ww - 12))) + '" cy="' + n1(fT + 5 + (gq * 7 % Math.max(4, y1 - fT - 10))) + '" r="2" fill="' + P0.bed2 + '"/>');
      for(var nq = 0; nq < 6; nq++) out.push('<circle cx="' + n1(x0 + 8 + (nq * 29 % Math.max(10, ww - 16))) + '" cy="' + n1(fT + 2 + (nq % 3) * 3) + '" r="2" fill="' + P0.nut + '"/>');
    } else if(i === 4){
      for(var u = 0; u < 3; u++){ var uy = wl + (y1 - wl) * (0.25 + u * 0.27); out.push('<rect class="wp2-uv" x="' + n1(x0 + 7) + '" y="' + n1(uy - 3) + '" width="' + n1(ww - 14) + '" height="6" rx="3"/>'); }
    }
    out.push('<path class="wp2-wall" d="M' + n1(x0) + ' ' + n1(y0) + ' V' + n1(y1) + ' H' + n1(x1) + ' V' + n1(y0) + '"/>');
    out.push('</g>');
    // names under the tank (and what it does)
    var nm = i ? SEW_NAMES[i] : (ph ? 'Raw' : 'Raw sewage'), nmS = ph && i === 4 ? 'Disinfect' : nm;
    out.push('<text class="wp2-tname' + (on ? '' : ' is-off') + (ph ? ' is-ph' : '') + '" x="' + n1(cx) + '" y="' + n1(y1 + (ph ? 16 : 18)) + '" text-anchor="middle">' + esc(nmS) + '</text>');
    // what the tank does, dark text on a white pill (readable on the green bank, and on a skipped tank too)
    if(i){
      var dt = ph ? SEW_DOES_S[i] : SEW_DOES[i], pw = Math.min(ww + (ph ? 6 : 8), dt.length * (ph ? 6.6 : 7) + 14), py = y1 + (ph ? 22 : 25);
      out.push('<rect class="wp2-tpill' + (on ? '' : ' is-off') + '" x="' + n1(cx - pw / 2) + '" y="' + n1(py) + '" width="' + n1(pw) + '" height="' + (ph ? 17 : 19) + '" rx="' + (ph ? 8.5 : 9.5) + '"/>' +
        '<text class="wp2-tdoes' + (on ? '' : ' is-off') + '" x="' + n1(cx) + '" y="' + n1(py + (ph ? 12.5 : 14)) + '" text-anchor="middle">' + esc(dt) + '</text>');
    }
    return out.join('');
  }
  /* --------------------------------------------------------------- mount */
  T.mount('water-pollution', function(app, data){
    var ex = null, modes = null;
    modes = T.modes(app, { slug: 'water-pollution',
      explore: function(host){ ex = explore(host, data, function(){ return modes; }); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(ex) ex.shown(m === 'explore'); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ================================================================ Explore */
  function explore(host, data, getModes){
    var S = { ch: 'fert', sacks: 3, tLake: 20, day: 0, seen: 0, up: 10, warm: 0, stage: 4, sday: 0, sseen: 0, clock: 0, tapped: false, sawDead: false, skipPredict: {} };
    try{ var q0 = new URLSearchParams(location.search).get('ch'); if(q0 === 'heat' || q0 === 'sew') S.ch = q0; }catch(e){}
    var run = prep(W.lake(S.sacks, S.tLake)), sew = sewRun(S.stage);
    var ghost = { fert: null, sew: null };          // the last run, drawn faint on the graph
    var runs = { warm: {} };                         // chapter 1 challenge 2: days in a dead zone per temperature, from runs seen to day 60
    var LS = null, visible = true, nid = T.nid('wp');

    /* ---- the stage: goal (phone), tabs, scene with its controls, step line, timeline, graph */
    var stage = document.createElement('div'); stage.className = 'wp2-stage';
    var goalEl = document.createElement('div'); goalEl.className = 'wp2-goal'; goalEl.setAttribute('aria-hidden', 'true');
    stage.appendChild(goalEl);
    var tabs = K.tabs({ label: 'Chapters', items: CH, value: S.ch, onChange: function(v){ setCh(v); } });
    stage.appendChild(tabs.el);
    var sceneBox = document.createElement('div'); sceneBox.className = 'wp2-scene'; sceneBox.id = nid + '-sc';
    sceneBox.innerHTML = '<svg class="wp2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="wp2-static"></g><g class="wp2-dyn"></g></svg>';
    stage.appendChild(sceneBox);
    var svg = sceneBox.querySelector('svg'), gStatic = svg.querySelector('.wp2-static'), gDyn = svg.querySelector('.wp2-dyn');
    var layer = K.layer(sceneBox);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', sceneBox.id); });
    // a key to what the small things in the lake are (algae, dead algae, decomposers, oxygen, nutrients)
    var legend = document.createElement('ul'); legend.className = 'wp2-legend'; legend.setAttribute('aria-label', 'Key to the lake');
    legend.innerHTML = '<li><i class="is-alg"></i>Algae</li><li><i class="is-dead"></i>Dead algae</li><li><i class="is-bac"></i>Decomposer bacteria</li><li><i class="is-bub"></i>Oxygen</li><li><i class="is-nut"></i>Nitrate and phosphate</li>';
    stage.appendChild(legend);
    var bar = document.createElement('div'); bar.className = 'wp2-bar';
    var player = K.player({ min: 0, max: W.LAKE_DAYS, hold: 2.4,
      speed: function(v){ var r = S.ch === 'sew' ? sew : run, end = r.firstHyp > -1 ? r.firstHyp + 2 : (r.stages[4] != null ? r.stages[4] + 4 : 18); return v < end ? 1.15 : 6; },
      // a hold at each step's day (and one just after day 0 for the runoff itself), so each link can be watched
      stops: function(){ var r = S.ch === 'sew' ? sew : run; if(r.stages[0] == null) return []; return [0.6].concat(r.stages.filter(function(d){ return d != null && d > 0.6; })).filter(function(d, i, a){ return a.indexOf(d) === i; }); },
      get: function(){ return S.ch === 'sew' ? S.sday : S.day; },
      set: function(v){ if(S.ch === 'sew') setSday(v, 'play'); else setDay(v, 'play'); },
      before: function(){ return beforePlay(); },
      onHold: function(){ words(); },
      labels: { play: 'Play', pause: 'Pause', again: 'Replay' }, onEnd: function(){ if(S.ch === 'sew') setSday(W.LAKE_DAYS, 'play'); else setDay(W.LAKE_DAYS, 'play'); afterRun(); } });
    player.el.setAttribute('aria-label', 'Play the 60 days, step by step');
    var speedB = K.speed({ label: 'Play twice as fast', onChange: function(x){ player.rate(x); } });
    var dayLab = document.createElement('p'); dayLab.className = 'wp2-day'; dayLab.setAttribute('aria-hidden', 'true');
    var tl = K.timeline({ label: 'The chain, step by step', steps: STEPS.map(function(x){ return { name: x.name, tone: x.tone }; }), onPick: pickStep });
    var barL = document.createElement('div'); barL.className = 'wp2-barl';
    var barB = document.createElement('div'); barB.className = 'wp2-barb'; barB.appendChild(player.el); barB.appendChild(speedB.el);
    barL.appendChild(barB); barL.appendChild(dayLab);
    bar.appendChild(barL); bar.appendChild(tl.el);
    stage.appendChild(bar);
    // the step the day is in, named, with its one line why (held about 2 s at each step during Play)
    var whyEl = document.createElement('p'); whyEl.className = 'wp2-why';
    stage.appendChild(whyEl);
    var predSlot = document.createElement('div'); predSlot.className = 'wp2-predslot';
    stage.appendChild(predSlot);
    var graphBox = document.createElement('div'); graphBox.className = 'wp2-graph';
    graphBox.innerHTML = '<svg class="wp2-gsvg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"></svg>';
    stage.appendChild(graphBox);
    var ghostEl = document.createElement('p'); ghostEl.className = 'wp2-ghost'; ghostEl.hidden = true;
    stage.appendChild(ghostEl);
    var gsvg = graphBox.querySelector('svg');
    var scrub = K.scrub(graphBox, { key: 'apenv-wp-graph', chip: false, label: 'Day on the graph', min: 0, max: W.LAKE_DAYS, step: 1, value: 0, rect: [0, 0, 10, 10],
      valuetext: function(v){ return scrubText(v); }, onStart: function(){ player.stop(); }, onInput: function(v){ onScrub(v); } });
    host.appendChild(stage);

    /* ---- on-picture controls (placed by each scene's layout) */
    var cSacks = K.drag(layer, { key: 'apenv-wp-sacks', label: 'Fertilizer sacks on the field', min: 0, max: 5, step: 1, value: S.sacks, track: [0, 0, 1, 0], hint: 'Drag',
      valuetext: function(v){ return sk(v) + ' of fertilizer'; }, tag: function(v){ return sk(v); },
      onInput: function(v){ player.stop(); S.sacks = v; newRun(); } });
    // the lake's thermometer is a control only for challenge 2 (and after); before that it is drawn, at 20 °C
    var cTemp = K.drag(layer, { key: 'apenv-wp-laket', label: 'Lake temperature', min: 10, max: 30, step: 1, value: S.tLake, track: [0, 1, 0, 0], hint: 'Drag',
      valuetext: function(v){ return 'Lake at ' + v + ' degrees Celsius'; }, tag: function(v){ return v + ' °C'; },
      onInput: function(v){ player.stop(); S.tLake = v; newRun(); } });
    var cWarm = K.drag(layer, { key: 'apenv-wp-warm', label: 'How much warmer the outflow makes the river downstream', min: 0, max: 15, step: 1, value: S.warm, track: [0, 1, 0, 0], hint: 'Drag',
      valuetext: function(v){ return 'Downstream ' + v + ' degrees warmer, ' + (S.up + v) + ' degrees Celsius'; }, tag: function(v){ return '+' + v + ' °C'; }, tagSide: 'left',
      onInput: function(v){ S.warm = v; heatChanged(); }, onEnd: function(){ heatSettled(); } });
    var cTanks = [0, 1, 2, 3, 4].map(function(i){
      return K.tap(layer, { key: i === 1 ? 'apenv-wp-tank' : null, label: i ? 'Stop after ' + SEW_NAMES[i].toLowerCase() + ' treatment' : 'No treatment: raw sewage to the lake', box: [0, 0, 1, 1], pressed: i === S.stage, hint: 'Tap',
        onClick: function(){ setStage(i); } });
    });

    /* ---- the side panel: one loop per chapter */
    var panel = document.createElement('div'); panel.className = 'wp2-panel';
    var read = K.readout({ items: [] });
    var P = {}, C = {}, TR = { fert: K.tries({ label: 'Runs you checked' }), heat: K.tries({ label: 'Outflows you checked' }), sew: K.tries({ label: 'Plants you checked' }) };
    P.fert = K.predict({ q: 'Heavy fertilizer runoff reaches the lake. Three weeks later, the fish...', answer: 'leave',
      choices: [{ value: 'better', label: 'do better: more food' }, { value: 'same', label: 'are about the same' }, { value: 'leave', label: 'leave or die' }],
      then: 'Now press Play under the lake.', onPick: function(){ placePredict(); goalNow(); if(S.seen >= 21) judgeFert(); } });
    P.heat = K.predict({ q: 'The plant adds only heat, no chemicals. Downstream, the river can hold...', answer: 'less',
      choices: [{ value: 'more', label: 'more oxygen' }, { value: 'same', label: 'the same oxygen' }, { value: 'less', label: 'less oxygen' }],
      then: 'Now drag the handle on the outflow pipe.', onPick: function(){ placePredict(); goalNow(); if(S.warm > 0) judgeHeat(); } });
    P.sew = K.predict({ q: 'Which stage removes most of the nitrogen and phosphorus?', answer: '3',
      choices: [{ value: '1', label: 'Primary' }, { value: '2', label: 'Secondary' }, { value: '3', label: 'Tertiary' }],
      then: 'Now tap the tanks and watch the N and P left.', onPick: function(){ placePredict(); goalNow(); if(S.tapped) judgeSew(); } });
    C.fert = K.challenges({ store: 'apenv-wp-fert2', items: [
        { id: 'safe', text: 'Find the most fertilizer the lake can take without a dead zone.' },
        { id: 'warm', text: 'Keep 3 sacks. Does a warmer lake have a longer or a shorter dead zone?' },
        { id: 'link', text: 'Which link in the chain uses up most of the oxygen? Tap it on the timeline.' },
        { id: 'order', text: 'Explain it back: tap the six steps in order.' }],
      onAll: function(){ P.fert.fold(true); goalNow(); tempShown(); },
      done: { title: 'Chapter 1 done.', text: 'Fertilizer feeds an algal bloom; when the algae die, decomposers use up the oxygen breaking them down, and below 2 mg/L the lake is a dead zone.',
        action: { label: 'Next: 2 Hot water', onClick: function(){ tabs.value('heat'); setCh('heat', true); } } },
      onReset: function(){ TR.fert.clear(); runs.warm = {}; },
      onShow: function(it){ P.fert.fold(it.id !== 'safe'); chalBody('fert', it); goalNow(); } });
    C.heat = K.challenges({ store: 'apenv-wp-heat2', items: [
        { id: 'trout', text: 'Find the warmest outflow that keeps the river downstream liveable for young trout.' },
        { id: 'pct', text: 'Set the outflow to +10 °C. By about what percent does the oxygen the river can hold fall?' }],
      onAll: function(){ P.heat.fold(true); goalNow(); },
      done: { title: 'Chapter 2 done.', text: 'Heat alone, with no chemical added, lowers the oxygen water can hold, so cold water fish such as trout lose the river below the plant.',
        action: { label: 'Next: 3 Sewage', onClick: function(){ tabs.value('sew'); setCh('sew', true); } } },
      onReset: function(){ TR.heat.clear(); },
      onShow: function(it){ P.heat.fold(it.id !== 'trout'); chalBody('heat', it); goalNow(); words(); } });
    C.sew = K.challenges({ store: 'apenv-wp-sew2', items: [
        { id: 'secondary', text: 'Stop after secondary treatment and play the lake below. What happens?' },
        { id: 'fewest', text: 'Use the fewest stages that keep the lake below out of a dead zone.' }],
      onAll: function(){ P.sew.fold(true); goalNow(); },
      done: { title: 'All three chapters done.', text: 'Sewage brings the same N and P as fertilizer, plus organic matter that uses oxygen directly: secondary treatment removes the organic matter, tertiary the N and P that start the bloom chain.',
        action: { label: 'Test yourself', onClick: function(){ var m = getModes(); if(m) m.show('quiz', true); } } },
      onReset: function(){ TR.sew.clear(); },
      onShow: function(it){ P.sew.fold(it.id !== 'secondary'); chalBody('sew', it); goalNow(); } });
    ['fert', 'heat', 'sew'].forEach(function(k){ P[k].el.setAttribute('data-ch', k); C[k].el.setAttribute('data-ch', k); });
    panel.appendChild(P.fert.el); panel.appendChild(P.heat.el); panel.appendChild(P.sew.el);
    panel.appendChild(read.el);
    panel.appendChild(C.fert.el); panel.appendChild(C.heat.el); panel.appendChild(C.sew.el);
    host.appendChild(panel);

    /* ---- "?": the reference for the chapter, and the settings */
    var ref = document.createElement('div'); ref.className = 'ls-sec wp2-ref';
    host.appendChild(ref);
    var sUp = T.slider({ label: 'River temperature upstream', min: 5, max: 20, step: 1, value: S.up, unit: '°C', onInput: function(v){ S.up = v; TR.heat.clear(); heatChanged(true); } });
    var setBox = document.createElement('div'); setBox.className = 'wp2-set'; setBox.appendChild(sUp.el);

    /* ------------------------------------------------------- state changes */
    function newRun(){
      if(S.seen > 0) ghost.fert = { O: run.O, upto: S.seen, label: sk(run.level) + ', ' + run.T + ' °C' };
      run = prep(W.lake(S.sacks, S.tLake));
      S.seen = 0; S.day = 0; player.reset();
      dirtyG = true; words(); refHtml(); chalSync(); draw();
      say(sk(S.sacks) + ', lake at ' + S.tLake + ' °C. Press Play, or drag along the graph.');
    }
    function setDay(v, how){
      S.day = clamp(v, 0, W.LAKE_DAYS);
      if(S.day > S.seen){ S.seen = S.day; dirtyG = true; }
      if(run.firstHyp > -1 && S.seen >= run.firstHyp) S.sawDead = true;
      if(how !== 'scrub') scrub.value(Math.round(S.day));
      dirtyG = true;
      if(S.seen >= 21 && !P.fert.settled() && (P.fert.picked() || S.skipPredict.fert || S.seen >= W.LAKE_DAYS - 1e-9)) judgeFert();
      if(S.seen >= W.LAKE_DAYS - 1e-9) seenAll();
      words();
      if(how !== 'play'){ say(dayLine()); if(!player.playing()) player.paint(); }
      if(!looping) draw();
    }
    function setSday(v, how){
      S.sday = clamp(v, 0, W.LAKE_DAYS);
      if(S.sday > S.sseen) S.sseen = S.sday;
      if(how !== 'scrub') scrub.value(Math.round(S.sday));
      dirtyG = true; words();
      if(S.sseen >= W.LAKE_DAYS - 1e-9) chalSync();
      if(how !== 'play'){ say(sewDayLine()); if(!player.playing()) player.paint(); }
      if(!looping) draw();
    }
    // a run seen to day 60 (Play or the graph): chapter 1 challenge 2 keeps it
    function seenAll(){
      if(S.sacks === 3 && (S.tLake === 20 || S.tLake === 30)){ runs.warm[S.tLake] = run.hypoxicDays; }
      chalSync();
    }
    function afterRun(){ if(S.ch === 'sew') say(sewDayLine() + ' Lowest ' + F(sew.min) + ' mg/L on day ' + sew.minDay + '.'); else say(dayLine() + ' Lowest ' + F(run.min) + ' mg/L on day ' + run.minDay + '.'); }
    function onScrub(v){
      if(S.ch === 'fert') setDay(v, 'scrub');
      else if(S.ch === 'heat'){ var w = clamp(Math.round(v - S.up), 0, 15); if(w !== S.warm){ S.warm = w; cWarm.value(w); heatChanged(); } }
      else setSday(v, 'scrub');
    }
    function scrubText(v){
      if(S.ch === 'fert') return 'Day ' + v + ', bottom water ' + fO(at(run.O, v)) + ' milligrams per liter';
      if(S.ch === 'heat') return v + ' degrees Celsius downstream, holds ' + F(W.osat(v)) + ' milligrams per liter';
      return 'Lake below, day ' + v + ', bottom water ' + fO(at(sew.O, v)) + ' milligrams per liter';
    }
    // Play before a prediction: the choices come first (under Play on a phone); a second press plays anyway
    function beforePlay(){
      var p = P[S.ch];
      if(S.ch !== 'heat' && !p.picked() && !p.settled() && !S.skipPredict[S.ch]){
        S.skipPredict[S.ch] = true; placePredict(true);
        p.nudge('Predict first: tap one. (Press Play again to skip.)');
        if(narrow()) try{ p.el.scrollIntoView({ block: 'nearest', behavior: K.reduced() ? 'auto' : 'smooth' }); }catch(e){}
        return false;
      }
      if(S.ch === 'fert' && S.seen >= W.LAKE_DAYS - 1e-9 && S.day >= W.LAKE_DAYS - 1e-9){ S.day = 0; }
      return true;
    }
    function heatChanged(fromSetting){
      if(fromSetting){ S.warm = clamp(S.warm, 0, 15); }
      dirtyG = true; words(); refHtml();
      if(P.heat.settled()) judgeHeat();
      chalSync(); say(heatLine()); if(!looping) draw();
    }
    function heatSettled(){
      if(S.warm > 0 && P.heat.picked()) judgeHeat();
      else if(S.warm > 0 && !P.heat.settled()){ P.heat.result(null, ''); judgeHeat(); }
    }
    function setStage(i){
      if(S.sseen > 0) ghost.sew = { O: sew.O, upto: S.sseen, label: SEW_NAMES[S.stage] };
      S.stage = i; S.tapped = true;
      sew = sewRun(i); S.sday = 0; S.sseen = 0; player.stop(); player.reset();
      cTanks.forEach(function(t, k){ t.pressed(k === i); });
      dirtyG = true; words(); refHtml();
      if(!P.sew.settled()){ if(P.sew.picked()) judgeSew(); else { var L3 = W.SEWAGE.stages; P.sew.result(null, '<b>No prediction this time.</b> Tertiary treatment removes most of the N and P (' + L3[2].left.nutrients + '% left after secondary, ' + L3[3].left.nutrients + '% after tertiary).'); P.sew.fold(true); placePredict(); } }
      chalSync(); say(sewLine()); if(!looping) draw();
    }
    function pickStep(i){
      var r = S.ch === 'sew' ? sew : run, day = r.stages[i];
      var cur = C.fert.current();
      if(S.ch === 'fert' && cur && cur.id === 'link' && !C.fert.isMet('link')){ answerLink(i); }
      if(day == null){ say((S.ch === 'sew' ? SEW_STEPS : STEPS.map(function(x){ return x.name; }))[i] + ' is not reached in this run.'); return; }
      player.stop();
      if(S.ch === 'sew') setSday(day, 'tap'); else setDay(day, 'tap');
    }
    function setCh(v, focus){
      if(v === S.ch) return;
      player.stop(); player.reset(); S.ch = v; layoutNow(); syncCh();
      say({ fert: 'Chapter 1, fertilizer runoff. ', heat: 'Chapter 2, hot water. ', sew: 'Chapter 3, sewage. ' }[v] + (v === 'fert' ? dayLine() : v === 'heat' ? heatLine() : sewLine()));
      if(focus){ var t = tabs.el.querySelector('[aria-selected="true"]'); if(t) t.focus(); }
    }
    function syncCh(){
      var c = S.ch;
      stage.setAttribute('data-ch', c);
      panel.querySelectorAll('[data-ch]').forEach(function(e){ e.hidden = e.getAttribute('data-ch') !== c; });
      bar.hidden = c === 'heat'; whyEl.hidden = c === 'heat'; legend.hidden = c === 'heat';
      tl.names(c === 'sew' ? SEW_STEPS : STEPS.map(function(x){ return x.name; }));
      tl.el.setAttribute('aria-label', c === 'sew' ? 'The chain in the lake below, step by step' : 'The chain, step by step');
      cSacks.hide(c !== 'fert'); cWarm.hide(c !== 'heat'); cTanks.forEach(function(t){ t.el.hidden = c !== 'sew'; });
      tempShown();
      read.items(c === 'fert' ? [{ k: 'o', label: 'Bottom O₂' }, { k: 'a', label: 'Algae' }, { k: 'z', label: 'Dead zone' }]
        : c === 'heat' ? [{ k: 'u', label: 'Upstream' }, { k: 'd', label: 'Downstream' }]
        : [{ k: 'n', label: 'N and P left' }, { k: 'b', label: 'BOD left' }, { k: 'o', label: 'Lake below' }], c === 'fert' ? 'Right now' : c === 'heat' ? 'Most oxygen the river can hold' : 'After the plant');
      var sp = c === 'fert' ? { min: 0, max: W.LAKE_DAYS, v: Math.round(S.day), l: 'Day on the graph' } : c === 'heat' ? { min: S.up, max: S.up + 15, v: S.up + S.warm, l: 'Temperature downstream, on the graph' } : { min: 0, max: W.LAKE_DAYS, v: S.sday, l: 'Day in the lake below, on the graph' };
      scrub.input.setAttribute('aria-label', sp.l);
      scrub.place(null, sp.min, sp.max); scrub.value(sp.v);
      placePredict();
      if(LS && LS.detailsTitle) LS.detailsTitle(c === 'fert' ? 'How the lake works' : c === 'heat' ? 'How the river works' : 'How the plant works');
      goalNow(true);
      try{ var u = new URL(location.href); if(c === 'fert') u.searchParams.delete('ch'); else u.searchParams.set('ch', c); history.replaceState(history.state, '', u); }catch(e){}
      dirtyG = true; words(); refHtml(); draw();
    }
    // the thermometer's handle: only once challenge 2 is open (or met); until then the lake's thermometer is drawn
    function tempShown(){
      var on = S.ch === 'fert' && (C.fert.isMet('warm') || (C.fert.current() && C.fert.current().id === 'warm') || !C.fert.current());
      cTemp.hide(!on); S.tempOn = on;
      if(!on && S.tLake !== 20 && S.ch === 'fert'){ S.tLake = 20; cTemp.value(20); run = prep(W.lake(S.sacks, 20)); S.seen = 0; S.day = 0; }
    }
    // Predict lives under Play on a phone or tablet until it is answered (so it comes before the run), else in the panel
    function placePredict(force){
      ['fert', 'heat', 'sew'].forEach(function(k){
        var p = P[k], under = narrow() && k !== 'heat' && !p.picked() && !p.settled();
        var host_ = under ? predSlot : panel;
        if(p.el.parentNode !== host_){ if(host_ === panel) panel.insertBefore(p.el, read.el); else predSlot.appendChild(p.el); }
        p.el.hidden = k !== S.ch;
      });
      predSlot.hidden = !predSlot.querySelector('.tk2-predict:not([hidden])');
    }
    var goalKey = '';
    function goalNow(force){
      var c = S.ch, cur = C[c].current(), p = P[c], g;
      var title = c === 'fert' ? 'Follow fertilizer from a field to the fish.' : c === 'heat' ? 'See what heat alone does to a river.' : 'Find the stage that protects the lake below.';
      var todo;
      if(!cur) todo = c === 'sew' ? 'All chapters done. Try Test yourself.' : 'Chapter done. Next: ' + (c === 'fert' ? '2 Hot water.' : '3 Sewage.');
      else if(!p.picked() && !p.settled()) todo = c === 'heat' ? 'Pick a prediction, then drag the handle on the outflow pipe.' : c === 'sew' ? 'Pick a prediction, then tap a tank.' : 'Pick a prediction, then press Play.';
      else if(c === 'fert' && S.seen < 21 && !P.fert.settled() && !C.fert.isMet('safe')) todo = 'Press Play and watch each step of the chain.';
      else if(c === 'sew' && S.sseen < 1 && cur.id === 'secondary' && S.stage === 2) todo = 'Press Play under the lake and watch the chain.';
      else todo = { safe: 'Change the sacks, then press Check.', warm: 'Run the lake at 20 °C and at 30 °C.', link: 'Tap the step that uses up the oxygen.', order: 'Put the six steps in order.',
        trout: 'Drag the outflow handle, then press Check.', pct: 'Set +10 °C and read both gauges.', secondary: 'Tap Secondary, then press Play under the lake.', fewest: 'Tap a tank, then press Check.' }[cur.id];
      g = { kicker: 'Goal', title: title, todo: todo };
      var key = c + '|' + todo;
      if(key === goalKey && !force) return;
      goalKey = key;
      goalEl.innerHTML = '<b>' + esc(title) + '</b> <span>' + esc(todo) + '</span>';
      if(LS) LS.task(g, 'explore');
    }

    /* ------------------------------------------------------- words: readout, step line, announcements */
    function say(t){ read.say(t); }
    function oNow(){ return at(run.O, S.day); }
    function dayLine(){ var o = oNow(), st = status(o); return 'Day ' + Math.round(S.day) + ': bottom water ' + fO(o) + ' mg/L, ' + st.status.toLowerCase() + '.'; }
    function heatPts(){ var t0 = S.up, t1 = S.up + S.warm; return { t0: t0, t1: t1, d0: r1(W.osat(t0)), d1: r1(W.osat(t1)) }; }
    function pctLess(h){ return Math.abs(M.Calc().percentChange(h.d0, h.d1)); }
    function heatLine(){ var h = heatPts(); return 'Upstream ' + h.t0 + ' °C holds up to ' + F(h.d0) + ' mg/L. Downstream ' + h.t1 + ' °C holds up to ' + F(h.d1) + ' mg/L.' + (h.d1 < TROUT ? ' Less than young trout need.' : ''); }
    function sewLine(){ var lf = W.SEWAGE.stages[S.stage].left; return (S.stage ? 'Treated through ' + SEW_NAMES[S.stage].toLowerCase() : 'No treatment') + ': ' + lf.nutrients + '% of the nitrogen and phosphorus and ' + lf.bod + '% of the organic matter left. Press Play to follow the lake below.'; }
    function sewDayLine(){ var o = at(sew.O, S.sday); return 'Lake below, day ' + Math.round(S.sday) + ': bottom water ' + fO(o) + ' mg/L, ' + status(o).status.toLowerCase() + '.'; }
    function deadSoFar(r, d){ var n = 0; for(var i = 0; i <= Math.floor(d); i++) if(r.O[i] < W.HYPOXIC) n++; return n; }
    function algSub(r, d){
      var A = at(r.A, d), q = A / r.A[0];
      if(q > 3 && A >= 0.5 * r.peakA) return d <= r.peakDay ? 'a bloom' : 'bloom dying';
      if(d > r.peakDay && q > 1.5) return 'after bloom';
      return '';
    }
    function words(){
      var c = S.ch;
      if(c === 'fert'){
        var o = oNow(), a = at(run.A, S.day) / run.A[0];
        read.set('o', Object.assign({ value: fO(o), unit: 'mg/L' }, status(o)));
        read.set('a', { value: a < 10 ? F(a) : String(Math.round(a)), unit: '× day 0', sub: algSub(run, S.day) });
        var z = deadSoFar(run, S.day);
        read.set('z', { value: String(z), unit: z === 1 ? 'day' : 'days', sub: S.day < 0.5 && S.seen < 0.5 ? 'press Play' : 'by day ' + Math.round(S.day) });
        dayLab.innerHTML = '<b>Day ' + Math.round(S.day) + '</b> of 60';
        stepUi(run, S.day, S.seen, STEP_LONG, STEPS.map(function(x){ return x.name; }), S.sacks > 0);
      } else if(c === 'heat'){
        var h = heatPts(), pc = C.heat.current(), hidePct = pc && pc.id === 'pct' && !C.heat.isMet('pct');
        read.set('u', { value: F(h.d0), unit: 'mg/L', sub: 'at ' + h.t0 + ' °C' });
        read.set('d', Object.assign({ value: F(h.d1), unit: 'mg/L', sub: 'at ' + h.t1 + ' °C' + (h.t1 > h.t0 && !hidePct ? ', ' + F(pctLess(h), 0) + '% less' : '') },
          h.d1 >= TROUT ? { status: 'Trout can breed', tone: 'good' } : { status: 'Too little for trout', tone: 'bad' }));
      } else {
        var lf = W.SEWAGE.stages[S.stage].left, so = at(sew.O, S.sday);
        read.set('n', { value: String(lf.nutrients), unit: '%', status: lf.nutrients > 50 ? 'Feeds algae' : 'Removed', tone: lf.nutrients > 50 ? 'warn' : 'good' });
        read.set('b', { value: String(lf.bod), unit: '%', status: lf.bod > 30 ? 'Uses oxygen' : 'Removed', tone: lf.bod > 30 ? 'warn' : 'good' });
        read.set('o', Object.assign({ value: fO(so), unit: 'mg/L' }, status(so)));
        dayLab.innerHTML = '<b>Day ' + Math.round(S.sday) + '</b> of 60';
        stepUi(sew, S.sday, S.sseen, SEW_LONG, SEW_STEPS, true);
      }
      goalNow();
    }
    // the timeline and the step line, from one rule (phase) shared with the scene
    function stepUi(r, d, seen, LONG, NAMES, any){
      var ph = phase(r, d), held = player.holding();
      var reached = r.stages.map(function(x){ return x != null && d >= x - 1e-9; });
      tl.set({ reached: reached, current: ph.rec ? -1 : ph.cur, sub: r.stages.map(function(x){ return x == null ? (seen >= W.LAKE_DAYS - 1e-9 ? 'not reached' : '') : seen >= x ? 'day ' + x : ''; }), off: r.stages.map(function(x){ return x == null; }) });
      var h;
      if(!any) h = '<b>No fertilizer.</b> Nothing feeds the algae, so the chain never starts.';
      else if(d < 0.01 && seen < 0.5) h = '<b>Press Play</b> to watch the chain one step at a time, or tap a step.';
      else if(ph.rec) h = '<b>Recovery.</b> ' + REC_LONG;
      else if(ph.cur < 0) h = '';
      else h = '<b>' + (ph.cur + 1) + ' ' + esc(NAMES[ph.cur]) + '.</b> ' + esc(LONG[ph.cur]);
      if(S.ch === 'sew' && !ph.rec && ph.cur >= 0 && ph.cur < 2 && r.bod > 30 && d > 0.5) h += ' <span class="wp2-why-x">Bacteria are already eating the sewage’s organic matter, so the oxygen falls even before the bloom.</span>';
      whyEl.innerHTML = h;
      whyEl.classList.toggle('is-hold', held != null);
      whyEl.classList.toggle('is-bad', !ph.rec && ph.cur === 5 && ph.o < W.HYPOXIC);
    }

    /* ------------------------------------------------------- predictions */
    function judgeFert(){
      var p = P.fert.picked(), hyp = false;
      if(!p){ var lw = Math.min.apply(null, run.O.slice(0, 22)); P.fert.result(null, '<b>No prediction this time.</b> ' + (lw < W.HYPOXIC ? 'The bottom water fell to ' + F(lw) + ' mg/L, a dead zone: decomposers breaking down the dead algae used up the oxygen.' : 'The lowest bottom oxygen by day 21 was ' + F(lw) + ' mg/L.')); placePredict(); goalNow(); return; } for(var i = 0; i <= 21; i++) if(run.O[i] < W.HYPOXIC) hyp = true;
      var lowest = Math.min.apply(null, run.O.slice(0, 22));
      // the prediction is about heavy runoff: a light run does not settle it
      if(S.sacks < 3 && !hyp){ P.fert.note('This run has only ' + sk(S.sacks) + ' (lowest ' + F(lowest) + ' mg/L). To test your prediction, set 3 or more and play past day 21.'); return; }
      if(hyp) P.fert.result(p === 'leave', (p === 'leave' ? '<b>Held.</b> ' : '<b>Not quite.</b> ') + 'The bottom water fell to ' + F(lowest) + ' mg/L, a dead zone: decomposers breaking down the dead algae used up the oxygen.');
      else if(lowest >= HEALTHY) P.fert.result(p === 'same', (p === 'same' ? '<b>Held</b> in this cold lake. ' : '<b>Not in this cold lake.</b> ') + 'At ' + S.tLake + ' °C the oxygen never fell below ' + F(lowest) + ' mg/L: cold water holds more oxygen, and decomposers work slower.');
      else P.fert.result(null, '<b>Partly.</b> The oxygen fell to ' + F(lowest) + ' mg/L: stressed, not a dead zone. Decomposers used oxygen, but not enough to go below 2 mg/L.');
      goalNow();
    }
    function judgeHeat(){
      var p = P.heat.picked(), h = heatPts(), held = p ? p === 'less' : null, lead = !p ? '<b>No prediction this time.</b> ' : held ? '<b>Held.</b> ' : '<b>Not quite.</b> ';
      if(!p && !P.heat.settled()) return;
      if(S.warm === 0){ if(P.heat.settled()) P.heat.result(held, lead + 'With no warm water both sides hold ' + F(h.d0) + ' mg/L. Drag the handle up to see the difference.'); return; }
      P.heat.result(held, lead + 'At ' + h.t1 + ' °C the river can hold only ' + F(h.d1) + ' mg/L, ' + F(pctLess(h), 0) + '% less than upstream at ' + h.t0 + ' °C: warmer water holds less gas.');
      goalNow();
    }
    function judgeSew(){
      var p = P.sew.picked(), L = W.SEWAGE.stages;
      P.sew.result(p === '3', (p === '3' ? '<b>Right.</b> ' : '<b>Not quite.</b> ') + 'Tertiary treatment takes N and P from ' + L[2].left.nutrients + '% left to ' + L[3].left.nutrients + '%. Primary and secondary leave most of them, so they feed algae downstream.');
      goalNow();
    }

    /* ------------------------------------------------------- challenges */
    function note(html, info){ return '<p class="tk2-note' + (info ? ' is-info' : '') + '">' + html + '</p>'; }
    function btn(label, onClick, cls){ var b = document.createElement('button'); b.type = 'button'; b.className = 'tk2-btn' + (cls ? ' ' + cls : ''); b.innerHTML = label; b.addEventListener('click', function(){ onClick(b); }); return b; }
    function btnRow(list, onPick){
      var row = document.createElement('div'); row.className = 'tk2-row'; row.setAttribute('data-ls-allchips', '');
      list.forEach(function(x){ row.appendChild(btn(esc(x.label), function(b){ onPick(x.v, b); })); });
      return row;
    }
    function maxSafe(Tc){ var best = -1; for(var l = 0; l <= 5; l++) if(W.lake(l, Tc).hypoxicDays === 0) best = l; else break; return best; }
    var CB = {};   // the open challenge's live bits (its check button, its message line)
    function msg(c, html, info){ var m = CB[c] && CB[c].msg; if(m) m.innerHTML = html ? note(html, info) : ''; }
    function chalBody(c, it){
      var Cc = C[c]; CB[c] = {};
      if(!it){ tempShown(); return; }
      var box = document.createElement('div'); box.className = 'wp2-cb';
      var m = document.createElement('div'); m.className = 'wp2-msg'; CB[c].msg = m;
      if(c === 'fert'){
        if(it.id === 'safe'){
          box.innerHTML = '<p class="wp2-intro">Change the sacks on the field, then press Check. It plays that run to day 60 and keeps the result.</p>';
          var cb = btn('', function(){ checkSafe(); }, 'tk2-btn-pri'); CB.fert.check = cb; box.appendChild(cb);
          box.appendChild(TR.fert.el); box.appendChild(m);
        } else if(it.id === 'warm'){
          if(S.sacks !== 3){ S.sacks = 3; cSacks.value(3); newRun(); box.innerHTML = '<p class="wp2-set3">The field is set to 3 sacks again.</p>'; }
          box.insertAdjacentHTML('beforeend', '<p class="wp2-wi">Drag the thermometer on the lake to 20 °C, then 30 °C. Play each run to day 60, or press Check.</p>');
          var cw = btn('', function(){ revealRun(); }, 'tk2-btn-pri'); CB.fert.check = cw; box.appendChild(cw); CB.fert.intro = box.querySelector('.wp2-wi');
          var slots = document.createElement('ul'); slots.className = 'tk2-tries wp2-slots'; CB.fert.slots = slots; box.appendChild(slots);
          var q = document.createElement('div'); q.className = 'wp2-q'; CB.fert.q = q; q.hidden = true;
          q.innerHTML = '<p><b>Why is it longer at 30 °C?</b></p>';
          var why = { a: 'Warm water holds less oxygen, and decomposers work faster.', b: 'Warm water carries more fertilizer into the lake.', c: 'Heat kills the decomposer bacteria.' };
          var wrong = { b: 'Both runs had 3 sacks. What does heat do to oxygen and to bacteria?', c: 'Heat speeds decomposers up. And how much oxygen can warm water hold?' };
          q.appendChild(btnRow([{ v: 'b', label: why.b }, { v: 'a', label: why.a }, { v: 'c', label: why.c }], function(v, b){
            if(v === 'a') Cc.met('warm', 'Longer: ' + runs.warm[20] + ' days in a dead zone at 20 °C, ' + runs.warm[30] + ' days at 30 °C in your runs. Warm water holds less oxygen to start with, and decomposers work faster, so they use it up sooner.');
            else { b.disabled = true; b.classList.add('is-no'); msg('fert', wrong[v]); }
          }));
          box.appendChild(q); box.appendChild(m);
        } else if(it.id === 'link'){
          box.appendChild(m); m.innerHTML = note('Tap one of the six steps under the lake.', true);
        } else if(it.id === 'order'){
          var names = STEPS.map(function(x){ return x.name; });
          var ord = K.order({ items: names, why: function(i, pos){ return names[i] + ' comes later. ' + (pos ? 'What happens right after ' + names[pos - 1].toLowerCase() + '?' : 'What starts the chain?'); },
            onDone: function(){ Cc.met('order', 'Runoff, algae bloom, algae die, decomposers feed, oxygen drops, dead zone. The oxygen is used up by the decomposers, days after the bloom.'); } });
          box.innerHTML = '<p class="wp2-ordh">Tap the first step, then the next, until all six are in order.</p>';
          box.appendChild(ord.el);
        }
      } else if(c === 'heat'){
        if(it.id === 'trout'){
          box.innerHTML = '<p class="wp2-intro">Young trout need at least ' + TROUT + ' mg/L. Warm the river until even full water cannot hold that much. Press Check at each outflow you want to test.</p>';
          var ct = btn('', function(){ checkTrout(); }, 'tk2-btn-pri'); CB.heat.check = ct; box.appendChild(ct);
          box.appendChild(TR.heat.el); box.appendChild(m);
        } else if(it.id === 'pct'){
          box.innerHTML = '<p class="wp2-pct-hint"></p>'; CB.heat.hint = box.firstChild;
          var h10 = { d0: r1(W.osat(S.up)), d1: r1(W.osat(S.up + 10)) }, pc = pctLess(h10), right = Math.round(pc / 5) * 5;
          var lo = Math.max(5, Math.round(right / 2 / 5) * 5); if(lo === right) lo = Math.max(5, right - 10);
          var hi = Math.round(right * 2.5 / 5) * 5; if(hi === right) hi = right + 15;
          var opts = [right, lo, hi].map(function(v){ return { v: v, label: 'About ' + v + '% less' }; }).sort(function(a, b){ return a.v - b.v; });
          var row = btnRow(opts, function(v, b){
            if(S.warm !== 10){ msg('heat', 'Drag the outflow handle to +10 °C first.', true); return; }
            if(v === right) Cc.met('pct', 'About ' + right + '% less. (' + F(h10.d1) + ' − ' + F(h10.d0) + ') / ' + F(h10.d0) + ' × 100 = ' + T.F(M.Calc().percentChange(h10.d0, h10.d1), 1) + '%.');
            else { b.disabled = true; b.classList.add('is-no'); msg('heat', 'Not quite. Percent change = (new − old) / old × 100, with the two gauge values.'); }
          });
          CB.heat.row = row; box.appendChild(row); box.appendChild(m);
        }
      } else {
        if(it.id === 'secondary'){
          box.innerHTML = '<p class="wp2-sec-hint"></p>'; CB.sew.hint = box.firstChild;
          var sq = btnRow([{ v: 'ok', label: 'It stays healthy' }, { v: 'fast', label: 'Oxygen falls at once, with no bloom' }, { v: 'dead', label: 'A bloom, then a dead zone' }], function(v, b){
            if(v === 'dead') Cc.met('secondary', 'A bloom, then a dead zone. Secondary removed most of the organic matter (' + W.SEWAGE.stages[2].left.bod + '% left), so the oxygen did not fall at once, but ' + W.SEWAGE.stages[2].left.nutrients + '% of the N and P still reached the lake: algae bloomed and died, and decomposers pulled the bottom water down to ' + F(sew.min) + ' mg/L.');
            else { b.disabled = true; b.classList.add('is-no'); msg('sew', v === 'ok' ? 'Not quite. Look at the lake’s oxygen line: where does it go after the bloom?' : 'That is what organic matter (BOD) does, and secondary removed most of it. Look at the algae first: what do the N and P left do?'); }
          });
          CB.sew.row = sq; box.appendChild(sq); box.appendChild(m);
        } else {
          box.innerHTML = '<p class="wp2-intro">Tap a tank to stop the treatment there, then press Check. It plays the lake below to day 60 and keeps the result.</p>';
          var cs = btn('', function(){ checkFewest(); }, 'tk2-btn-pri'); CB.sew.check = cs; box.appendChild(cs);
          box.appendChild(TR.sew.el); box.appendChild(m);
        }
      }
      Cc.body(box);
      tempShown(); chalSync();
    }
    // keep the open challenge's buttons and lines in step with the scene (never solves it: only Check or an answer does)
    function chalSync(){ ['fert', 'heat', 'sew'].forEach(chalSync1); }
    function chalSync1(c){
      var cur = C[c] && C[c].current(), cb = CB[c] || {};
      if(!cur || C[c].isMet(cur.id)) return;
      if(c === 'fert'){
        if(cur.id === 'safe' && cb.check) cb.check.innerHTML = 'Check ' + esc(sk(S.sacks));
        if(cur.id === 'warm'){
          if(cb.check){ cb.check.innerHTML = S.sacks === 3 ? 'Check this run (' + S.tLake + ' °C)' : 'Set 3 sacks first'; cb.check.disabled = S.sacks !== 3 || (S.tLake !== 20 && S.tLake !== 30); if(S.sacks === 3 && S.tLake !== 20 && S.tLake !== 30) cb.check.innerHTML = 'Set 20 °C or 30 °C'; }
          if(cb.slots) cb.slots.innerHTML = [20, 30].map(function(t){ var v = runs.warm[t]; return '<li class="is-' + (v == null ? 'info' : v ? 'bad' : 'good') + '">' + K.icon(v == null ? 'arrows' : 'check') + '<span><b>' + t + ' °C:</b> ' + (v == null ? 'not run to day 60 yet' : v + ' days in a dead zone') + '</span></li>'; }).join('');
          var both = runs.warm[20] != null && runs.warm[30] != null;
          if(cb.q) cb.q.hidden = !both;
          if(cb.check) cb.check.hidden = both; if(cb.intro) cb.intro.hidden = both;
          var s3 = CB.fert.q && CB.fert.q.parentNode && CB.fert.q.parentNode.querySelector('.wp2-set3'); if(s3 && both) s3.hidden = true;
        }
      } else if(c === 'heat'){
        if(cur.id === 'trout' && cb.check) cb.check.innerHTML = 'Check +' + S.warm + ' °C';
        if(cur.id === 'pct' && cb.hint) cb.hint.textContent = S.warm === 10 ? 'Read both gauges, then pick.' : 'Drag the outflow handle to +10 °C first.';
        if(cur.id === 'pct' && cb.row) cb.row.querySelectorAll('button:not(.is-no)').forEach(function(b){ b.disabled = S.warm !== 10; });
      } else {
        if(cur.id === 'secondary'){
          var ready = S.stage === 2 && S.sseen >= W.LAKE_DAYS - 1e-9;
          if(cb.hint) cb.hint.textContent = S.stage !== 2 ? 'Tap the secondary tank first.' : ready ? 'Look at the lake below and its graph, then pick.' : 'Now press Play under the lake (or drag along its graph to day 60).';
          if(cb.row) cb.row.querySelectorAll('button:not(.is-no)').forEach(function(b){ b.disabled = !ready; });
        }
        if(cur.id === 'fewest' && cb.check) cb.check.innerHTML = 'Check: stop after ' + esc(S.stage ? SEW_NAMES[S.stage].toLowerCase() : 'no treatment');
      }
    }
    // Check: play the run to day 60 at once and show its worst day
    function revealRun(){
      player.stop();
      if(S.ch === 'sew'){ S.sseen = W.LAKE_DAYS; setSday(sew.minDay, 'tap'); }
      else { S.seen = W.LAKE_DAYS; seenAll(); setDay(run.minDay, 'tap'); }
    }
    function tidy(c){ P[c].fold(true); var it = C[c].el.querySelector('.wp2-intro'); if(it && TR[c].el.children.length) it.hidden = true; }
    function checkSafe(){
      revealRun();
      var Tc = S.tLake, key = S.sacks + '@' + Tc, dead = run.hypoxicDays > 0;
      TR.fert.add(key, '<b>' + sk(S.sacks) + (Tc !== 20 ? ' at ' + Tc + ' °C' : '') + ':</b> ' + (dead ? 'a dead zone for ' + run.hypoxicDays + ' days' : 'lowest ' + F(run.min) + ' mg/L, no dead zone'), dead ? 'bad' : 'good');
      tidy('fert');
      var best = maxSafe(Tc), a = TR.fert.get(best + '@' + Tc), b = TR.fert.get((best + 1) + '@' + Tc);
      if(best >= 0 && a && (best === 5 || b)){
        var rb = W.lake(best, Tc), rn = best < 5 ? W.lake(best + 1, Tc) : null;
        C.fert.met('safe', sk(best) + ' is the most. With ' + sk(best) + ' the oxygen bottoms out at ' + F(rb.min) + ' mg/L; ' + (rn ? 'with ' + sk(best + 1) + ' it falls below 2 mg/L for ' + rn.hypoxicDays + ' days.' : 'even the most runoff here makes no dead zone.'));
        return;
      }
      if(dead) msg('fert', 'That made a dead zone. Try fewer sacks.');
      else if(S.sacks < best) msg('fert', 'No dead zone with ' + sk(S.sacks) + '. Can the lake take more?', true);
      else msg('fert', 'No dead zone. Is it the most? Check one more sack.', true);
    }
    function checkTrout(){
      var h = heatPts(), ok = h.d1 >= TROUT, key = String(S.warm);
      TR.heat.add(key, '<b>+' + S.warm + ' °C (' + h.t1 + ' °C):</b> holds ' + F(h.d1) + ' mg/L, ' + (ok ? 'enough for young trout' : 'less than young trout need'), ok ? 'good' : 'bad');
      tidy('heat');
      var best = -1; for(var w = 0; w <= 15; w++) if(r1(W.osat(S.up + w)) >= TROUT) best = w;
      if(best < 0){ msg('heat', 'Even with no warm water, a river at ' + S.up + ' °C cannot hold ' + TROUT + ' mg/L. Set it cooler under “?”.', true); return; }
      if(TR.heat.has(String(best)) && (best === 15 || TR.heat.has(String(best + 1)))){
        C.heat.met('trout', '+' + best + ' °C is the warmest: at ' + (S.up + best) + ' °C full water holds ' + F(r1(W.osat(S.up + best))) + ' mg/L, just enough.' + (best < 15 ? ' At +' + (best + 1) + ' °C it holds ' + F(r1(W.osat(S.up + best + 1))) + ', less than young trout need.' : ''));
        return;
      }
      msg('heat', ok ? (S.warm < best ? 'Still enough. Can the river take warmer water?' : 'Enough. Is it the warmest? Check one degree warmer.') : 'Too warm for young trout. Try a cooler outflow.', ok);
    }
    function checkFewest(){
      revealRun();
      var i = S.stage, dead = sew.hypoxicDays > 0;
      TR.sew.add(String(i), '<b>' + esc(SEW_NAMES[i]) + ':</b> ' + (dead ? 'a dead zone for ' + sew.hypoxicDays + ' days' : 'lowest ' + F(sew.min) + ' mg/L, no dead zone'), dead ? 'bad' : 'good');
      tidy('sew');
      var few = -1; for(var k = 0; k <= 4; k++) if(sewRun(k).hypoxicDays === 0){ few = k; break; }
      if(TR.sew.has(String(few)) && TR.sew.has(String(few - 1))){
        C.sew.met('fewest', 'Tertiary: three stages. It takes N and P down to ' + W.SEWAGE.stages[few].left.nutrients + '%, and the lake below stays above 2 mg/L (lowest ' + F(sewRun(few).min) + ' mg/L). Stopping after secondary still gave a dead zone. Disinfection kills germs but does not change N and P.');
        return;
      }
      msg('sew', dead ? 'Still a dead zone below. Add a stage.' : i > few ? 'No dead zone, but can you use fewer stages?' : 'No dead zone. Is it the fewest? Check one stage less.', !dead);
    }
    function answerLink(i){
      var why = ['Runoff brings the nutrients. Nitrate and phosphate do not use up oxygen themselves.',
        'Living algae mostly make oxygen by day (a dense bloom uses some at night). The big drop comes later. Which step causes it?',
        'Close. Dead algae sink, but the oxygen is used by what breaks them down next.',
        '', 'That is the result. Which step causes the drop?', 'That is the end of the chain. Which step uses up the oxygen?'];
      if(i === 3){ tl.flash(3, 'good'); C.fert.met('link', 'Decomposers. Aerobic bacteria use most of the oxygen as they break down the dead algae, so the low comes days after the bloom.'); }
      else { tl.flash(i, 'bad'); msg('fert', '<b>' + esc(STEPS[i].name) + ':</b> ' + why[i]); }
    }
    /* ======================================================= the picture */
    var G = null, GG = null, dirtyG = true, looping = false, raf = 0, lastT = 0, FISH = {};
    function box(el){ var r = el.getBoundingClientRect(); return [Math.max(300, Math.round(r.width) || 640), Math.max(200, Math.round(r.height) || 380)]; }
    function layoutNow(){
      var wh = box(sceneBox), Wd = wh[0], H = wh[1], P0 = PAL[dark() ? 'dark' : 'light'];
      svg.setAttribute('viewBox', '0 0 ' + Wd + ' ' + H); svg.setAttribute('width', Wd); svg.setAttribute('height', H);
      G = S.ch === 'fert' ? geoFert(Wd, H) : S.ch === 'heat' ? geoHeat(Wd, H) : geoSew(Wd, H);
      G.P = P0;
      gStatic.innerHTML = S.ch === 'fert' ? staticFert(G) : S.ch === 'heat' ? staticHeat(G) : staticSew(G);
      if(S.ch === 'fert'){
        // phone: the sacks stand in a pile, so the knob runs along the soil just under the field (tag to its right)
        if(G.ph) cSacks.place([G.sx0 + 6, G.plat + 30, G.sx1, G.plat + 30], 'right'); else cSacks.place([G.sx0, G.plat - 2, G.sx1, G.plat - 2], null);
        cTemp.place([G.thX, G.thY10, G.thX, G.thY30]);
      } else if(S.ch === 'heat') cWarm.place([G.vX, G.vY0, G.vX, G.vY1]);
      else G.tanks.forEach(function(tk, i){ cTanks[i].place([tk.x - 3, tk.y - 3, tk.w + 6, tk.h + 6]); });
      var gw = box(graphBox);
      gsvg.setAttribute('viewBox', '0 0 ' + gw[0] + ' ' + gw[1]); gsvg.setAttribute('width', gw[0]); gsvg.setAttribute('height', gw[1]);
      GG = { W: gw[0], H: gw[1] };
      dirtyG = true; draw();
    }
    function draw(){
      if(!G) return;
      var t = S.clock;
      gDyn.innerHTML = S.ch === 'fert' ? dynFert(G, t) : S.ch === 'heat' ? dynHeat(G, t) : dynSew(G, t);
      svg.setAttribute('aria-label', S.ch === 'fert' ? 'A farm field above a lake. ' + dayLine() + ' ' + STEP_LONG[Math.max(0, W.stageAt(run, S.day))]
        : S.ch === 'heat' ? 'A power plant on a trout river, upstream on the left, downstream on the right. ' + heatLine() : 'A town, a sewage plant and the lake below. ' + sewLine());
      if(dirtyG){ dirtyG = false; graph(); }
    }
    function tick(ts){
      if(!looping) return;
      var dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 0; lastT = ts;
      S.clock += dt; ease(dt); draw();
      raf = requestAnimationFrame(tick);
    }
    function loop(on){
      on = on && visible && !K.reduced() && !document.hidden;
      if(on === looping) return;
      looping = on; lastT = 0;
      if(on) raf = requestAnimationFrame(tick); else { cancelAnimationFrame(raf); ease(10); draw(); }
    }
    document.addEventListener('visibilitychange', function(){ loop(true); });

    /* --------------------------------------------------- shared art */
    function skyAndHills(g, Wd, H, horizon){
      var P0 = g.P;
      return '<linearGradient id="wpSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P0.sky0 + '"/><stop offset="1" stop-color="' + P0.sky1 + '"/></linearGradient>' +
        '<radialGradient id="wpSun"><stop offset="0" stop-color="' + P0.sun + '" stop-opacity=".55"/><stop offset="1" stop-color="' + P0.sun + '" stop-opacity="0"/></radialGradient>';
    }
    function hills(Wd, horizon, P0, H){
      var a = horizon, out = '';
      out += '<path fill="' + P0.far + '" d="M0 ' + n1(a - H * 0.06) + ' C' + n1(Wd * 0.18) + ' ' + n1(a - H * 0.14) + ' ' + n1(Wd * 0.32) + ' ' + n1(a - H * 0.03) + ' ' + n1(Wd * 0.5) + ' ' + n1(a - H * 0.09) + ' S' + n1(Wd * 0.82) + ' ' + n1(a - H * 0.16) + ' ' + Wd + ' ' + n1(a - H * 0.07) + ' V' + n1(a + 2) + ' H0Z"/>';
      out += '<path fill="' + P0.near + '" d="M0 ' + n1(a - H * 0.015) + ' C' + n1(Wd * 0.22) + ' ' + n1(a - H * 0.07) + ' ' + n1(Wd * 0.4) + ' ' + n1(a + 1) + ' ' + n1(Wd * 0.62) + ' ' + n1(a - H * 0.045) + ' S' + n1(Wd * 0.9) + ' ' + n1(a - H * 0.02) + ' ' + Wd + ' ' + n1(a - H * 0.035) + ' V' + n1(a + 2) + ' H0Z"/>';
      // a few far trees on the near hills
      var r = M.rng(41);
      for(var i = 0; i < Math.round(Wd / 70); i++){
        var x = Wd * (0.38 + 0.6 * r()), y = a - H * 0.02 - r() * H * 0.02, s = 5 + r() * 5;
        out += '<path fill="' + P0.grass2 + '" opacity=".75" d="M' + n1(x) + ' ' + n1(y - s * 2.2) + ' C' + n1(x + s) + ' ' + n1(y - s * 1.6) + ' ' + n1(x + s * 1.1) + ' ' + n1(y - s * 0.2) + ' ' + n1(x) + ' ' + n1(y) + ' C' + n1(x - s * 1.1) + ' ' + n1(y - s * 0.2) + ' ' + n1(x - s) + ' ' + n1(y - s * 1.6) + ' ' + n1(x) + ' ' + n1(y - s * 2.2) + 'Z"/>';
      }
      return out;
    }
    /* The sun by day (light theme); a moon in the dark theme, so the night sky never has a sun in it. */
    function sunOrMoon(x, y, P0){
      if(!dark()) return '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="44" fill="url(#wpSun)"/><circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="15" fill="' + P0.sun + '"/>';
      return '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="30" fill="url(#wpSun)" opacity=".45"/><circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="13" fill="' + P0.sun + '"/><circle cx="' + n1(x + 6) + '" cy="' + n1(y - 4) + '" r="11.5" fill="' + P0.sky0 + '"/>' +
        [[-60, -6], [40, -14], [-28, 18], [70, 12], [-90, 20]].map(function(p){ return '<circle cx="' + n1(x + p[0]) + '" cy="' + n1(Math.max(6, y + p[1])) + '" r="1.2" fill="#E8EEF4" opacity=".75"/>'; }).join('');
    }
    function fishDefs(){
      return '<linearGradient id="wpFish" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="wp2-f0"/><stop offset=".55" class="wp2-f1"/><stop offset="1" class="wp2-f2"/></linearGradient>' +
        '<linearGradient id="wpTrout" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="wp2-t0"/><stop offset=".5" class="wp2-t1"/><stop offset="1" class="wp2-t2"/></linearGradient>';
    }
    /* A fish seen from the side, facing right at scale 1 (about 36 by 16): body, forked tail that beats, dorsal and
       pectoral fins, gill line and eye. sx is the turn (negative faces left; near 0 it is end on). */
    function fishSvg(x, y, s, sx, tail, tilt, kind, op){
      var trout = kind === 'trout';
      return '<g class="wp2-fish' + (trout ? ' is-trout' : '') + '" transform="translate(' + n1(x) + ' ' + n1(y) + ') rotate(' + n1(tilt) + ') scale(' + (s * sx).toFixed(3) + ' ' + s.toFixed(3) + ')" opacity="' + op.toFixed(2) + '">' +
        '<path class="wp2-fin" d="M-15 0 L-26 -8 C-23.5 -3 -23.5 3 -26 8 Z" transform="rotate(' + n1(tail) + ' -15 0)"/>' +
        '<path class="wp2-fin" d="M-3 -7.5 C0 -13 7 -12.5 9 -7 Z"/>' +
        '<path class="wp2-fb" d="M18 0 C14 -7.5 2 -9.5 -8 -6.5 C-13 -4.5 -16 -2 -17 0 C-16 2 -13 4.5 -8 6.5 C2 9.5 14 7.5 18 0 Z" fill="url(#' + (trout ? 'wpTrout' : 'wpFish') + ')"/>' +
        (trout ? '<path class="wp2-stripe" d="M15 0.5 C6 -0.5 -6 -0.5 -15 0.6" /><g class="wp2-spots"><circle cx="2" cy="-4" r=".9"/><circle cx="-4" cy="-3" r=".9"/><circle cx="-9" cy="-2.6" r=".8"/><circle cx="6" cy="-4.6" r=".8"/></g>' : '') +
        '<path class="wp2-gill" d="M9 -4.5 C7 -1.5 7 1.5 9 4.5"/>' +
        '<path class="wp2-fin wp2-pec" d="M5 2.5 C3 6.5 -1 7.5 -3.5 6.5 C-1 5 1.5 3.5 5 2.5Z"/>' +
        '<circle class="wp2-eye" cx="12.6" cy="-1.8" r="2.1"/><circle class="wp2-pupil" cx="13" cy="-1.8" r="1.1"/></g>';
    }
    /* Eased fish state: depth (0 surface to 1 bed), out (0 here to 1 gone), so a scrub or a jump is followed smoothly. */
    function fishState(key, n){ if(!FISH[key]){ FISH[key] = []; for(var i = 0; i < n; i++) FISH[key].push({ d: null, o: null, gx: 0 }); } return FISH[key]; }
    function ease(dt){
      var k = 1 - Math.exp(-dt * 2.2);
      Object.keys(FISH).forEach(function(key){ FISH[key].forEach(function(st){ if(st.td != null) st.d += (st.td - st.d) * k; if(st.to != null) st.o += (st.to - st.o) * k * 0.6; }); });
    }

    /* The lake: water in two layers, light, nutrients, algae clumps that grow, die, sink and settle, the dead layer
       on the bed, decomposers, oxygen bubbles, plants and fish. L: the geometry; r: a prepped run; d: the day. */
    function lakeBasin(x0, x1, surf, bed, Wd){
      var w = x1 - x0, dep = bed - surf;
      return 'M' + n1(x0) + ' ' + n1(surf) + ' C' + n1(x0 + w * 0.04) + ' ' + n1(surf + dep * 0.5) + ' ' + n1(x0 + w * 0.07) + ' ' + n1(bed - 2) + ' ' + n1(x0 + w * 0.17) + ' ' + n1(bed) +
        ' C' + n1(x0 + w * 0.35) + ' ' + n1(bed + 3) + ' ' + n1(x0 + w * 0.55) + ' ' + n1(bed - 4) + ' ' + n1(x0 + w * 0.72) + ' ' + n1(bed - 1) + ' S' + n1(x1 - 10) + ' ' + n1(bed - 6) + ' ' + n1(x1 + 2) + ' ' + n1(bed - 5) +
        ' V' + n1(surf) + ' Z';
    }
    function bedY(L, x){ // the bed's height under x (close to the basin curve)
      var w = L.x1 - L.x0, f = (x - L.x0) / w;
      if(f < 0.17) return L.surf + (L.bed - L.surf) * sstep(0, 0.17, f);
      return L.bed - 2 + Math.sin(f * 9) * 2 - (f > 0.8 ? (f - 0.8) * 20 : 0);
    }
    function lakeStatic(L, P0, id){
      var out = '<clipPath id="' + id + '"><path d="' + L.basin + '"/></clipPath>';
      // the bed: silt over darker sediment, pebbles and two rocks
      out += '<path fill="' + P0.bed2 + '" d="' + L.basin + '" transform="translate(0 6)"/>';
      out += '<g clip-path="url(#' + id + ')"><rect x="' + n1(L.x0 - 4) + '" y="' + n1(L.surf) + '" width="' + n1(L.x1 - L.x0 + 8) + '" height="' + n1(L.bed - L.surf + 10) + '" class="wp2-wbase"/></g>';
      return out;
    }
    function bedArt(L, P0){
      var out = '', w = L.x1 - L.x0;
      // silt band along the bed
      var pts = [], i, x;
      for(i = 0; i <= 40; i++){ x = L.x0 + w * (0.06 + 0.94 * i / 40); pts.push([x, bedY(L, x)]); }
      out += '<path fill="' + P0.silt + '" d="M' + pts.map(function(p){ return n1(p[0]) + ' ' + n1(p[1] - 3); }).join(' L') + ' L' + n1(L.x1 + 2) + ' ' + n1(L.bed + 12) + ' L' + n1(L.x0 + w * 0.06) + ' ' + n1(L.bed + 12) + 'Z"/>';
      out += '<path fill="' + P0.bed + '" d="M' + pts.map(function(p){ return n1(p[0]) + ' ' + n1(p[1] + 1); }).join(' L') + ' L' + n1(L.x1 + 2) + ' ' + n1(L.bed + 14) + ' L' + n1(L.x0 + w * 0.06) + ' ' + n1(L.bed + 14) + 'Z"/>';
      R_PEB.forEach(function(p, k){
        var px = L.x0 + w * (0.12 + 0.86 * p[0]), py = bedY(L, px) + 1 + p[1] * 3, rx = 1.6 + p[2] * 3.2;
        out += '<ellipse cx="' + n1(px) + '" cy="' + n1(py) + '" rx="' + n1(rx) + '" ry="' + n1(rx * 0.62) + '" fill="' + (k % 3 ? P0.bed2 : P0.soil) + '" opacity=".85"/>';
      });
      [0.32, 0.66].forEach(function(f, k){
        var rx = L.x0 + w * f, ry = bedY(L, rx), s = k ? 12 : 16;
        out += '<path fill="' + P0.conc2 + '" d="M' + n1(rx - s) + ' ' + n1(ry + 2) + ' C' + n1(rx - s) + ' ' + n1(ry - s * 0.7) + ' ' + n1(rx + s * 0.6) + ' ' + n1(ry - s * 0.9) + ' ' + n1(rx + s) + ' ' + n1(ry + 2) + 'Z"/>' +
          '<path fill="' + P0.conc + '" opacity=".6" d="M' + n1(rx - s * 0.6) + ' ' + n1(ry - s * 0.35) + ' C' + n1(rx - s * 0.2) + ' ' + n1(ry - s * 0.75) + ' ' + n1(rx + s * 0.4) + ' ' + n1(ry - s * 0.7) + ' ' + n1(rx + s * 0.55) + ' ' + n1(ry - s * 0.4) + 'Z"/>';
      });
      return out;
    }
    function lakeDyn(L, r, d, t, P0, id, fk, nFish){
      var out = [], w = L.x1 - L.x0, o = at(r.O, d), A = at(r.A, d), Dd = at(r.D, d), N = at(r.N, d), Os = r.osat, res = { brown: false, bac: null };
      // film: how green the surface is (the bloom); browned: how much of it has died back after the peak
      var film = Math.pow(clamp((A - r.A[0]) / 12, 0, 1), 0.8), browned = d > r.peakDay ? clamp(1 - A / (r.peakA || 1), 0, 1) : 0, murk = Math.pow(clamp(1 - o / Math.max(Os, 1), 0, 1), 1.3);
      var green = mixA(P0.green, P0.brown, browned * 0.55);
      var top = mixA(P0.top, green, film * 0.92), mid = mixA(P0.deep, mixA(green, P0.murky, 0.4), film * 0.6), bot = mixA(P0.deep, P0.murky, murk * 0.92);
      out.push('<defs><linearGradient id="' + id + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + mix(top, top, 0) + '"/><stop offset=".3" stop-color="' + mix(top, mid, 0.5) + '"/><stop offset=".5" stop-color="' + mix(mid, mid, 0) + '"/><stop offset=".64" stop-color="' + mix(bot, bot, 0) + '"/><stop offset="1" stop-color="' + mix(bot, P0.murky, murk * 0.4) + '"/></linearGradient></defs>');
      out.push('<g clip-path="url(#' + id + ')">');
      out.push('<rect x="' + n1(L.x0 - 4) + '" y="' + n1(L.surf) + '" width="' + n1(w + 8) + '" height="' + n1(L.bed - L.surf + 12) + '" fill="url(#' + id + 'w)"/>');
      // light from the surface, dimmed by the bloom
      var lo = 0.2 * (1 - film) * (dark() ? 0.55 : 1);
      if(lo > 0.01) for(var k = 0; k < 4; k++){
        var rx = L.x0 + w * (0.22 + k * 0.2) + Math.sin(t * 0.3 + k) * 6, dep = (L.bed - L.surf) * (0.95 - film * 0.5);
        out.push('<path fill="#fff" opacity="' + (lo * (k % 2 ? 0.7 : 1)).toFixed(3) + '" d="M' + n1(rx) + ' ' + n1(L.surf) + ' L' + n1(rx + 26) + ' ' + n1(L.surf) + ' L' + n1(rx + 8 + dep * 0.3) + ' ' + n1(L.surf + dep) + ' L' + n1(rx - 14 + dep * 0.3) + ' ' + n1(L.surf + dep) + 'Z"/>');
      }
      // oxygen in the bottom water: round bubbles with a shine, fewer as it falls (none in a dead zone)
      var nb = Math.round(clamp((o - 1) / 8.5, 0, 1) * 18), span = L.bed - L.mid - 6, br = L.small ? 0.75 : 1;
      for(var b = 0; b < nb; b++){
        var p = R_BUB[b], bx = L.x0 + w * (0.2 + 0.72 * p[0]) + Math.sin(t * 1.5 + b) * 3, by = L.bed - 10 - ((t * (7 + p[1] * 7) + p[2] * span) % span), rr0 = (2.4 + p[3] * 2.2) * br;
        out.push('<circle class="wp2-bub" cx="' + n1(bx) + '" cy="' + n1(by) + '" r="' + n1(rr0) + '" stroke="' + P0.bub + '"/><circle cx="' + n1(bx - rr0 * 0.35) + '" cy="' + n1(by - rr0 * 0.35) + '" r="' + n1(rr0 * 0.28) + '" fill="' + P0.bub + '"/>');
      }
      // nutrients washed in: orange specks spreading from the shore, taken up by algae
      var entry = sstep(0, 3, d), nn = Math.round(clamp((N - 0.1) / 5, 0, 1) * 26 * entry);
      for(var q = 0; q < nn; q++){
        var pn = R_NUT[q], nx = L.x0 + 8 + pn[0] * w * clamp(0.15 + d / 4, 0, 0.95) + Math.sin(t + q) * 2, ny = L.surf + 4 + pn[1] * (L.mid - L.surf) * 0.9;
        out.push('<circle cx="' + n1(nx) + '" cy="' + n1(ny) + '" r="1.9" fill="' + P0.nut + '" opacity=".95"/>');
      }
      // the dead layer on the bed (dead algae waiting to be decomposed)
      var dl = clamp(Dd / 24, 0, 1.1) * 12;
      if(dl > 0.6){
        var pts = [], i, x;
        for(i = 0; i <= 30; i++){ x = L.x0 + w * (0.1 + 0.9 * i / 30); pts.push([x, bedY(L, x) - 2 - dl * (0.75 + 0.25 * Math.sin(i * 1.7))]); }
        out.push('<path class="wp2-deadl" d="M' + n1(L.x0 + w * 0.1) + ' ' + n1(bedY(L, L.x0 + w * 0.1)) + ' L' + pts.map(function(pp){ return n1(pp[0]) + ' ' + n1(pp[1]); }).join(' L') + ' L' + n1(L.x1 + 2) + ' ' + n1(L.bed + 14) + ' L' + n1(L.x0 + w * 0.1) + ' ' + n1(L.bed + 14) + 'Z"/>');
      }
      // decomposers (aerobic bacteria): more where there is more to eat, faster in warm water
      var fT = Math.pow(1.07, r.T - 20), nd = Math.round(clamp(Dd * fT / 28, 0, 1.25) * 34), bestB = null;
      for(var c = 0; c < nd; c++){
        var pb = R_BAC[c], cx = L.x0 + w * (0.12 + 0.86 * pb[0]) + Math.sin(t * 2.3 + c * 1.7) * 2.5, cy0 = bedY(L, cx) - 4 - dl - pb[1] * (L.bed - L.mid) * 0.45, cy = cy0 + Math.cos(t * 1.9 + c) * 1.5;
        out.push('<rect class="wp2-bac" x="' + n1(cx - 3.2) + '" y="' + n1(cy - 1.4) + '" width="6.4" height="2.8" rx="1.4" transform="rotate(' + Math.round(pb[2] * 180) + ' ' + n1(cx) + ' ' + n1(cy) + ')"/>');
        var tx0 = L.x0 + w * 0.5; if(!bestB || Math.abs(cx - tx0) < Math.abs(bestB[0] - tx0)) bestB = [cx, cy];
      }
      if(nd >= 5) res.bac = bestB;
      // plants on the bed, swaying
      R_PLANT.slice(0, Math.round(w / 60)).forEach(function(p, k){
        var px = L.x0 + w * (0.14 + 0.82 * p[0]), py = bedY(L, px) + 1, h = 18 + p[1] * 26, sw = Math.sin(t * 0.9 + k) * 4;
        out.push('<path class="wp2-weed" d="M' + n1(px) + ' ' + n1(py) + ' C' + n1(px - 3) + ' ' + n1(py - h * 0.4) + ' ' + n1(px + 3 + sw * 0.5) + ' ' + n1(py - h * 0.7) + ' ' + n1(px + sw) + ' ' + n1(py - h) + '"/>');
      });
      // algae clumps: grow toward the peak near the surface, then die one by one, turn brown, sink and settle
      var alg = P0.alg, bro = P0.brown;
      for(var a = 0; a < r.nA; a++){
        var pa = R_ALG[a % R_ALG.length], ax = L.x0 + 18 + pa[0] * (w - 70), ay0 = L.surf + 4 + pa[1] * pa[1] * pa[1] * (L.mid - L.surf - 8), dd = r.deaths[a], vis, col, ay = ay0, op = 1;
        if(d <= r.peakDay) vis = A >= r.peakA * (a + 0.5) / r.nA;
        else vis = true;
        if(!vis) continue;
        var sinkP = dd != null && d > dd ? clamp((d - dd) / 2.5, 0, 1) : 0, dying = dd != null && d > dd - 1.4 ? clamp((d - dd + 1.4) / 1.2, 0, 1) : 0;
        if(sinkP > 0){ ay = lerp(ay0, bedY(L, ax) - 5 - dl * 0.6 - pa[2] * 4, Math.pow(sinkP, 1.4)); }
        if(sinkP >= 1) op = clamp(Dd / (r.Dmax * 0.45 || 1), 0, 1);
        if(op < 0.05) continue;
        if(dying > 0.5 && sinkP < 1) res.brown = true;
        col = mixA(alg, bro, dying);
        var sc = (L.small ? 0.8 : 1) * (0.8 + pa[3] * 0.6), wob = sinkP > 0 && sinkP < 1 ? Math.sin(t * 3 + a) * 2 : Math.sin(t * 0.8 + a) * 1.2;
        var c1 = mix(col, col, 0), c2 = mix(mixA(col, [20, 60, 20], 0.35 * (1 - dying)), col, 0), hi = mix(mixA(P0.algHi, bro, dying), P0.algHi, 0);
        out.push('<g transform="translate(' + n1(ax + wob) + ' ' + n1(ay) + ') rotate(' + Math.round(pa[2] * 360) + ') scale(' + sc.toFixed(2) + ')" opacity="' + op.toFixed(2) + '">' +
          (a % 3 === 0 ? '<path d="M-9 1 C-5 -3 -2 4 2 0 S8 -3 10 1" fill="none" stroke="' + c2 + '" stroke-width="1.6" stroke-linecap="round"/>' : '') +
          '<circle cx="-3.2" cy=".8" r="3.6" fill="' + c2 + '"/><circle cx="2.6" cy="-.6" r="4" fill="' + c1 + '"/><circle cx="0" cy="3" r="3.2" fill="' + c1 + '"/><circle cx="-1.4" cy="-3" r="2.8" fill="' + c1 + '"/>' +
          (dying < 0.5 ? '<circle cx="1.8" cy="-1.8" r="1.4" fill="' + hi + '" opacity=".85"/><circle cx="-2.6" cy="1.6" r=".9" fill="' + hi + '" opacity=".6"/>' : '') + '</g>');
      }
      // fish: spread out while the water is healthy, crowd the surface and gasp when it is low, leave below 2 mg/L
      var fs = fishState(fk, nFish), tDepth, tOut, fR = L.fishR || 0.8;
      tOut = 1 - sstep(1.4, 2.4, o);
      fs.forEach(function(st, i){
        var rr = R_RAIN[i + 3], base = 0.25 + rr[0] * 0.6;
        tDepth = o >= HEALTHY ? base : o >= 2.6 ? lerp(0.06 + rr[1] * 0.08, base, sstep(2.6, HEALTHY, o)) : 0.04;
        st.td = tDepth; st.to = tOut; if(st.d == null || !looping){ st.d = tDepth; st.o = tOut; }
        var u = t * (0.25 + rr[2] * 0.15) + rr[3] * 6.28, ax2 = w * (0.08 + rr[1] * 0.08), cxF = L.x0 + w * 0.24 + ax2 + (w * (fR - 0.24) - 2 * ax2) * rr[0];
        var cu = Math.cos(u), out_ = st.o, fx = cxF + ax2 * Math.sin(u) + out_ * (w * 0.75 + 60), dir = out_ > 0.25 ? 1 : (cu >= 0 ? 1 : -1);
        var sx = dir * Math.max(0.28, out_ > 0.25 ? 1 : Math.sqrt(Math.abs(cu)));
        var depthY = L.surf + 10 + st.d * (bedY(L, fx) - L.surf - 26), fy = depthY + Math.sin(t * 1.3 + i * 2) * 2.2;
        var gasp = o < 3.2 && st.d < 0.15;
        var tail = Math.sin(t * (gasp ? 10 : 6.5) + i) * (8 + 8 * Math.abs(cu)), tilt = gasp ? -16 * dir : Math.sin(u * 2) * 3;
        var s = L.small ? 0.62 : (0.75 + rr[2] * 0.25) * (L.fishS || 1);
        if(fx < L.x1 + 30) out.push(fishSvg(fx, fy, s, sx, tail, tilt, 'fish', 1));
        if(gasp && fx < L.x1){ var rp = (t * 0.9 + i * 0.37) % 1; out.push('<ellipse cx="' + n1(fx + 14 * s * dir) + '" cy="' + n1(L.surf + 1) + '" rx="' + n1(3 + rp * 10) + '" ry="' + n1(1 + rp * 2) + '" fill="none" stroke="#fff" stroke-width="1.2" opacity="' + (0.8 * (1 - rp)).toFixed(2) + '"/>'); }
      });
      // the algae mat on the surface: thick and green at the bloom, thinning and browning as it dies back
      if(film > 0.04){
        var mp = [], j, th = film * (1 - browned * 0.6) * (L.small ? 12 : 20);
        for(j = 0; j <= 40; j++){ var xx = L.x0 + w * (0.02 + 0.98 * j / 40); mp.push(n1(xx) + ' ' + n1(L.surf + 1.5 + th * (0.6 + 0.4 * Math.sin(j * 2.3 + t * 0.5) * Math.sin(j * 0.7)))); }
        var matC = mixA(P0.mat, P0.brown, browned * 0.8);
        out.push('<path fill="' + mix(matC, matC, 0) + '" opacity="' + (0.55 + film * 0.4).toFixed(2) + '" d="M' + n1(L.x0) + ' ' + n1(L.surf) + ' L' + mp.join(' L') + ' L' + n1(L.x1 + 2) + ' ' + n1(L.surf) + 'Z"/>');
        for(j = 0; j < Math.round(film * (1 - browned) * 46); j++){ var sp = R_ALG[(j * 7) % R_ALG.length]; out.push('<circle cx="' + n1(L.x0 + 6 + sp[0] * (w - 10)) + '" cy="' + n1(L.surf + 1.5 + sp[1] * th * 0.8) + '" r="' + n1(1.2 + sp[2] * 1.8) + '" fill="' + mix(P0.algHi, P0.algHi, 0) + '" opacity=".75"/>'); }
      }
      out.push('</g>');
      // the surface line, with a glint
      out.push('<path class="wp2-surf" d="M' + n1(L.x0) + ' ' + n1(L.surf) + ' H' + n1(L.x1 + 2) + '"/>');
      res.svg = out.join('');
      return res;
    }

    /* --------------------------------------------------- chapter 1: field and lake */
    function geoFert(Wd, H){
      var ph = Wd < 560, g = { W: Wd, H: H, ph: ph };
      g.surf = Math.round(H * 0.4);
      g.lakeL = Math.round(Wd * (ph ? 0.47 : 0.36));
      g.bed = H - (ph ? 10 : 14);
      g.plat = g.surf - Math.round(H * (ph ? 0.12 : 0.14));
      g.platR = g.lakeL - Math.round(Wd * (ph ? 0.07 : 0.075));
      // the fish keep to the middle of the lake, clear of the thermometer at its right edge
      g.L = { x0: g.lakeL, x1: Wd, surf: g.surf, bed: g.bed, mid: g.surf + (g.bed - g.surf) * 0.42, fishS: ph ? 1 : 1.35, fishR: ph ? 0.72 : 0.8 };
      g.L.basin = lakeBasin(g.lakeL, Wd, g.surf, g.bed, Wd);
      g.sx0 = ph ? 10 : 14; g.sx1 = g.platR - (ph ? 8 : 22);
      g.thX = Wd - (ph ? 22 : 36); g.thTop = g.surf - Math.round(H * 0.2); g.thBulb = g.surf + Math.round((g.bed - g.surf) * 0.28);
      g.thY10 = g.thBulb - 16; g.thY30 = g.thTop + 8;
      g.slope = [g.platR, g.plat, g.platR + (g.lakeL - g.platR) * 0.55, g.plat, g.lakeL - (g.lakeL - g.platR) * 0.3, g.surf, g.lakeL, g.surf];
      return g;
    }
    function staticFert(g){
      var P0 = g.P, Wd = g.W, H = g.H, s = g.slope, out = '<defs>' + skyAndHills(g, Wd, H) + fishDefs() +
        '<linearGradient id="wpSoil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P0.soil + '"/><stop offset="1" stop-color="' + P0.soil3 + '"/></linearGradient></defs>';
      out += '<rect width="' + Wd + '" height="' + (g.surf + 4) + '" fill="url(#wpSky)"/>';
      out += sunOrMoon(Wd * (g.ph ? 0.7 : 0.74), Math.max(26, g.plat * 0.32), P0);
      out += hills(Wd, g.surf, P0, H);
      out += lakeStatic(g.L, P0, 'wpLk1');
      // the field: soil in cross-section under a grassy plateau that slopes to the shore
      var soil = 'M0 ' + n1(g.plat) + ' H' + n1(s[0]) + ' C' + s.slice(2).map(n1).join(' ') + ' C' + n1(g.lakeL + (Wd - g.lakeL) * 0.04) + ' ' + n1(g.surf + (g.bed - g.surf) * 0.5) + ' ' + n1(g.lakeL + (Wd - g.lakeL) * 0.07) + ' ' + n1(g.bed - 2) + ' ' + n1(g.lakeL + (Wd - g.lakeL) * 0.17) + ' ' + n1(g.bed) + ' V' + H + ' H0Z';
      out += '<path d="' + soil + '" fill="url(#wpSoil)"/>';
      for(var k = 1; k < 4; k++){ var y = g.plat + (H - g.plat) * k / 4; out += '<path d="M0 ' + n1(y) + ' C' + n1(g.platR * 0.4) + ' ' + n1(y - 4) + ' ' + n1(g.platR * 0.8) + ' ' + n1(y + 5) + ' ' + n1(Math.min(g.lakeL - 4, g.platR + 30 + k * 6)) + ' ' + n1(y + 2) + '" fill="none" stroke="' + P0.soil2 + '" stroke-width="1.2" opacity=".5"/>'; }
      out += '<path d="M0 ' + n1(g.plat) + ' H' + n1(s[0]) + ' C' + s.slice(2).map(n1).join(' ') + '" fill="none" stroke="' + P0.grass + '" stroke-width="7" stroke-linecap="round"/>';
      out += '<path d="M0 ' + n1(g.plat - 2) + ' H' + n1(s[0]) + '" fill="none" stroke="' + P0.grass2 + '" stroke-width="2" opacity=".6"/>';
      // corn rows behind the sacks
      for(var x = 10; x < g.platR - 6; x += (g.ph ? 11 : 13)){
        var hh = (g.ph ? 15 : 19) + ((x * 7) % 7);
        out += '<g class="wp2-crop"><path d="M' + x + ' ' + n1(g.plat - 3) + ' V' + n1(g.plat - hh) + '"/><path d="M' + x + ' ' + n1(g.plat - hh * 0.45) + ' q-7 -3 -9 -10 M' + x + ' ' + n1(g.plat - hh * 0.65) + ' q7 -3 9 -10 M' + x + ' ' + n1(g.plat - hh * 0.85) + ' q-5 -3 -6 -8"/></g>';
      }
      // the field's name sits low in the soil, clear of the sacks' handle and its hint
      out += '<text class="wp2-lab" x="12" y="' + n1(g.plat + (H - g.plat) * 0.62) + '">Farm field</text>';
      out += bedArt(g.L, P0);
      return out;
    }
    function cubic(s, f){ var u = 1 - f; return [u * u * u * s[0] + 3 * u * u * f * s[2] + 3 * u * f * f * s[4] + f * f * f * s[6], u * u * u * s[1] + 3 * u * u * f * s[3] + 3 * u * f * f * s[5] + f * f * f * s[7]]; }
    function dynFert(g, t){
      var P0 = g.P, out = [], d = S.day, s = g.slope;
      // storm: a cloud over the field, rain while the runoff runs
      var rain = d > 0 && d < 5 ? 1 : d >= 5 && d < 7 ? 1 - (d - 5) / 2 : 0, cloudOp = d > 0 && d < 7 ? sstep(0, 0.4, d) * (1 - sstep(5, 7, d)) : 0;
      if(cloudOp > 0.01){
        var cx = Math.max(56, g.platR * 0.3), cy = Math.max(26, g.plat * 0.3);
        out.push('<g opacity="' + cloudOp.toFixed(2) + '">');
        if(rain > 0) R_RAIN.forEach(function(p, k){ var rx = cx - 44 + p[0] * 88, ry = cy + 10 + ((t * 160 + p[1] * 120) % Math.max(20, g.plat - cy - 6)); out.push('<path stroke="' + P0.rain + '" stroke-width="1.5" stroke-linecap="round" opacity="' + (0.75 * rain).toFixed(2) + '" d="M' + n1(rx) + ' ' + n1(ry) + ' l-2 7"/>'); });
        out.push('<g fill="' + P0.cloud + '"><ellipse cx="' + n1(cx) + '" cy="' + n1(cy) + '" rx="40" ry="15"/><ellipse cx="' + n1(cx - 24) + '" cy="' + n1(cy + 4) + '" rx="22" ry="12"/><ellipse cx="' + n1(cx + 26) + '" cy="' + n1(cy + 5) + '" rx="20" ry="11"/><ellipse cx="' + n1(cx - 6) + '" cy="' + n1(cy - 9) + '" rx="22" ry="13" fill="' + P0.cloud2 + '"/></g></g>');
      }
      // fertilizer granules on the field, washed off by the rain
      var left = 1 - sstep(0.3, 4, d), ng = Math.round(S.sacks * 7 * left);
      for(var k = 0; k < ng; k++){ var p = R_NUT[k % R_NUT.length], gx = 8 + p[0] * (g.platR - 4), gy = g.plat + 1 + p[1] * 3; out.push('<circle cx="' + n1(gx) + '" cy="' + n1(gy) + '" r="1.8" fill="' + P0.nut + '"/>'); }
      // the sacks, in a row left of the knob (they overlap a little when the field is narrow)
      var span = g.sx1 - g.sx0, sw;
      if(g.ph){
        // a pile: three on the ground, two on top
        sw = 30;
        for(var i = 0; i < S.sacks; i++){ var row = i < 3 ? 0 : 1, col = row ? i - 3 : i; out.push(sack(g.sx0 + sw * 0.5 + col * (sw + 3) + row * (sw + 3) * 0.5, g.plat - 1 - row * sw * 1.12, sw, P0)); }
      } else {
        sw = Math.min(32, span / 5 * 0.86);
        for(var j = 0; j < S.sacks; j++) out.push(sack(g.sx0 + sw * 0.5 + (span - sw) * j / 5, g.plat - 1, sw, P0));
      }
      // runoff stream down the slope
      var ro = S.sacks > 0 ? sstep(0, 0.6, d) * (1 - sstep(4.5, 7, d)) : 0;
      if(ro > 0.02){
        var path = 'M' + n1(s[0] - 6) + ' ' + n1(s[1] + 1) + ' C' + n1(s[2]) + ' ' + n1(s[3] + 1) + ' ' + n1(s[4]) + ' ' + n1(s[5] + 1) + ' ' + n1(s[6] + 6) + ' ' + n1(s[7] + 2);
        out.push('<path d="' + path + '" fill="none" stroke="' + P0.soil2 + '" stroke-width="' + n1(3 + S.sacks * 1.6) + '" stroke-linecap="round" opacity="' + (0.85 * ro).toFixed(2) + '"/>');
        out.push('<path d="' + path + '" fill="none" stroke="' + P0.nut + '" stroke-width="' + n1(1.5 + S.sacks * 0.7) + '" stroke-linecap="round" stroke-dasharray="3 6" stroke-dashoffset="' + n1(-t * 30) + '" opacity="' + ro.toFixed(2) + '"/>');
      }
      var lk = lakeDyn(g.L, run, d, t, P0, 'wpLk1', 'f1', g.ph ? 3 : 5);
      out.push(lk.svg);
      // the lake thermometer (its handle appears for challenge 2; until then it shows the lake's temperature)
      var tf = (S.tLake - 10) / 20, ty = lerp(g.thY10, g.thY30, tf);
      out.push('<g class="wp2-thermo"><rect x="' + n1(g.thX - 5) + '" y="' + n1(g.thTop) + '" width="10" height="' + n1(g.thBulb - g.thTop) + '" rx="5"/><circle cx="' + n1(g.thX) + '" cy="' + n1(g.thBulb) + '" r="9"/>' +
        '<rect class="wp2-thermo-c" x="' + n1(g.thX - 2.2) + '" y="' + n1(ty) + '" width="4.4" height="' + n1(g.thBulb - ty) + '"/><circle class="wp2-thermo-c" cx="' + n1(g.thX) + '" cy="' + n1(g.thBulb) + '" r="6.4"/></g>');
      if(!S.tempOn) out.push('<text class="wp2-lab" x="' + n1(g.thX - 12) + '" y="' + n1(g.thTop + 12) + '" text-anchor="end">Lake ' + S.tLake + ' °C</text>');
      // labels: the bottom water's oxygen (anchored to the bed), and the step the day is in, where it happens
      var ph = phase(run, d), o = ph.o, st = status(o), L = g.L, w = L.x1 - L.x0, cx2 = L.x0 + w * (g.ph ? 0.6 : 0.56);
      var bx = L.x0 + w * (g.ph ? 0.14 : 0.16), byB = bedY(L, bx + 30);
      out.push(chip(bx, byB - (g.ph ? 46 : 52), 'Bottom water', fO(o) + ' mg/L', st.tone, g.ph, [bx + 30, byB - 10]));
      if(S.sacks > 0 && d > 0){
        var cur = ph.cur, lab = null, pos = null, lead = null;
        if(ph.rec){ lab = 'Oxygen comes back from the air'; pos = [cx2, L.mid - 8]; }
        else if(cur === 0){ lab = 'Runoff carries nutrients in'; pos = [L.x0 + 16, L.surf - 12, 'start']; }
        else if(cur === 1){ lab = 'Algae bloom: the surface turns green'; pos = [cx2, L.surf + (L.mid - L.surf) * 0.62]; }
        else if(cur === 2){ if(lk.brown) { lab = 'Algae die, turn brown and sink'; pos = [cx2, L.mid - 2]; } else { lab = 'Algae bloom: the surface turns green'; pos = [cx2, L.surf + (L.mid - L.surf) * 0.62]; } }
        else if(cur === 3 || cur === 4){
          lab = cur === 3 ? 'Decomposer bacteria use oxygen' : 'Oxygen drops in the bottom water';
          pos = [cx2, L.mid - 4];
          if(lk.bac) lead = [cx2, L.mid + 2, lk.bac[0], lk.bac[1]];
        }
        else if(cur === 5 && o < W.HYPOXIC){ lab = 'Dead zone: below 2 mg/L'; pos = [cx2, g.ph ? L.mid - 4 : L.mid + (L.bed - L.mid) * 0.36]; }
        else if(cur === 5){ lab = 'Oxygen drops in the bottom water'; pos = [cx2, L.mid - 4]; }
        if(lead) out.push('<path class="wp2-lead" d="M' + n1(lead[0]) + ' ' + n1(lead[1]) + ' L' + n1(lead[2]) + ' ' + n1(lead[3]) + '"/><circle class="wp2-lead-d" cx="' + n1(lead[2]) + '" cy="' + n1(lead[3]) + '" r="2.4"/>');
        if(lab && g.ph) lab = { 'Runoff carries nutrients in': 'Runoff carries nutrients', 'Algae bloom: the surface turns green': 'Algae bloom', 'Algae die, turn brown and sink': 'Algae die and sink',
          'Decomposer bacteria use oxygen': 'Decomposers use oxygen', 'Oxygen drops in the bottom water': 'Oxygen drops', 'Dead zone: below 2 mg/L': 'Dead zone', 'Oxygen comes back from the air': 'Oxygen comes back' }[lab] || lab;
        if(lab) out.push(callout(pos[0], pos[1], lab, cur === 5 && !ph.rec && o < W.HYPOXIC ? 'bad' : '', pos[2] || 'middle', g.ph));
      }
      return out.join('');
    }
    /* A value card in the scene (the readout's number, the same value); lead: [x, y] a short line to what it measures. */
    function chip(x, y, k, v, tone, ph, lead){
      var w = ph ? 96 : 112, h = ph ? 38 : 42, out = '<g class="wp2-chip">';
      if(lead) out += '<path class="wp2-lead" d="M' + n1(x + w * 0.5) + ' ' + n1(y + h / 2) + ' L' + n1(lead[0]) + ' ' + n1(lead[1]) + '"/><circle class="wp2-lead-d" cx="' + n1(lead[0]) + '" cy="' + n1(lead[1]) + '" r="2.6"/>';
      return out + '<rect x="' + n1(x) + '" y="' + n1(y - h / 2) + '" width="' + w + '" height="' + h + '" rx="9"/>' +
        '<text class="wp2-chip-k" x="' + n1(x + 9) + '" y="' + n1(y - h / 2 + (ph ? 14 : 15)) + '">' + esc(k) + '</text>' +
        '<text class="wp2-chip-v' + (tone === 'bad' ? ' is-bad' : '') + '" x="' + n1(x + 9) + '" y="' + n1(y + h / 2 - (ph ? 7 : 8)) + '">' + esc(v) + '</text></g>';
    }
    function callout(x, y, text, tone, anchor, ph){
      return '<text class="wp2-call' + (tone ? ' is-' + tone : '') + (ph ? ' is-ph' : '') + '" x="' + n1(x) + '" y="' + n1(y) + '" text-anchor="' + anchor + '">' + esc(text) + '</text>';
    }

    /* --------------------------------------------------- chapter 2: a power plant on a trout river */
    function geoHeat(Wd, H){
      var ph = Wd < 560, g = { W: Wd, H: H, ph: ph };
      g.hor = Math.round(H * (ph ? 0.24 : 0.26)); g.surf = Math.round(H * (ph ? 0.66 : 0.58)); g.bed = H - (ph ? 8 : 12); g.bank = g.surf - (ph ? 8 : 12);
      g.pcx = Math.round(Wd * (ph ? 0.47 : 0.46)); g.bw = Math.round(Wd * (ph ? 0.2 : 0.13)); g.bh = Math.round(H * (ph ? 0.13 : 0.16));
      g.bx0 = g.pcx - g.bw / 2; g.bx1 = g.pcx + g.bw / 2; g.btop = g.bank - g.bh;
      g.pipeX = g.bx1 + Math.round(Wd * (ph ? 0.06 : 0.035)); g.pipeY = g.btop + g.bh * 0.45;
      // the handle's scale stands on the outflow pipe's elbow, so the handle is ON the pipe it sets
      g.vX = g.pipeX; g.vY0 = g.pipeY - 12; g.vY1 = Math.max(ph ? 128 : 16, g.vY0 - Math.min(ph ? 96 : 130, H * 0.34));
      g.pw = ph ? 132 : 176; g.pH = ph ? 102 : 116;
      g.up = { x0: 0, x1: g.bx0 - (ph ? 26 : 50), inst: Math.round(ph ? 8 + g.pw / 2 : Wd * 0.14) };
      g.dn = { x0: g.pipeX + 12, x1: Wd, inst: Math.round(ph ? Wd - 8 - g.pw / 2 : Wd * 0.84) };
      return g;
    }
    function staticHeat(g){
      var P0 = g.P, Wd = g.W, H = g.H, out = '<defs>' + skyAndHills(g, Wd, H) + fishDefs() +
        '<linearGradient id="wpBank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P0.near + '"/><stop offset="1" stop-color="' + P0.grass2 + '"/></linearGradient>' +
        '<linearGradient id="wpRiv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + mix(P0.top, P0.top, 0) + '"/><stop offset="1" stop-color="' + mix(P0.deep, P0.deep, 0) + '"/></linearGradient></defs>';
      out += '<rect width="' + Wd + '" height="' + (g.hor + 4) + '" fill="url(#wpSky)"/>';
      if(!g.ph) out += sunOrMoon(Wd * 0.62, 30, P0);
      out += hills(Wd, g.hor, P0, H);
      out += '<rect y="' + n1(g.hor) + '" width="' + Wd + '" height="' + n1(g.surf - g.hor + 2) + '" fill="url(#wpBank)"/>';
      // the river in cutaway: water, then its stony bed
      out += '<rect y="' + n1(g.surf) + '" width="' + Wd + '" height="' + n1(g.bed - g.surf) + '" fill="url(#wpRiv)"/>';
      out += '<path fill="' + P0.bed + '" d="M0 ' + n1(g.bed - 4) + ' C' + n1(Wd * 0.25) + ' ' + n1(g.bed - 9) + ' ' + n1(Wd * 0.5) + ' ' + n1(g.bed + 1) + ' ' + n1(Wd * 0.75) + ' ' + n1(g.bed - 6) + ' S' + n1(Wd * 0.95) + ' ' + n1(g.bed - 2) + ' ' + Wd + ' ' + n1(g.bed - 5) + ' V' + H + ' H0Z"/>';
      for(var k = 0; k < Math.round(Wd / 18); k++){ var x = (k * 37.3) % Wd, r = 2 + (k * 13 % 5); out += '<ellipse cx="' + n1(x) + '" cy="' + n1(g.bed - 3 + (k % 3)) + '" rx="' + r + '" ry="' + n1(r * 0.6) + '" fill="' + (k % 2 ? P0.bed2 : P0.conc2) + '"/>'; }
      // the plant: building, cooling tower, intake (upstream) and outflow (downstream) pipes
      var tw = g.bw * 0.62, tx = g.bx0 - tw * 0.15, th = g.bh * 1.55;
      out += '<path class="wp2-tower" d="M' + n1(tx - tw / 2) + ' ' + n1(g.bank) + ' C' + n1(tx - tw * 0.28) + ' ' + n1(g.bank - th * 0.5) + ' ' + n1(tx - tw * 0.3) + ' ' + n1(g.bank - th * 0.8) + ' ' + n1(tx - tw * 0.36) + ' ' + n1(g.bank - th) +
        ' H' + n1(tx + tw * 0.36) + ' C' + n1(tx + tw * 0.3) + ' ' + n1(g.bank - th * 0.8) + ' ' + n1(tx + tw * 0.28) + ' ' + n1(g.bank - th * 0.5) + ' ' + n1(tx + tw / 2) + ' ' + n1(g.bank) + 'Z"/>';
      out += '<rect class="wp2-bldg" x="' + n1(g.bx0) + '" y="' + n1(g.btop) + '" width="' + n1(g.bw) + '" height="' + n1(g.bh) + '" rx="3"/>';
      out += '<path class="wp2-roof" d="M' + n1(g.bx0 - 3) + ' ' + n1(g.btop) + ' H' + n1(g.bx1 + 3) + ' V' + n1(g.btop + 6) + ' H' + n1(g.bx0 - 3) + 'Z"/>';
      for(var wi = 0; wi < 3; wi++) out += '<rect class="wp2-win" x="' + n1(g.bx0 + g.bw * (0.14 + wi * 0.27)) + '" y="' + n1(g.btop + g.bh * 0.3) + '" width="' + n1(g.bw * 0.16) + '" height="' + n1(g.bh * 0.22) + '" rx="1.5"/>';
      out += '<text class="wp2-lab' + (g.ph ? ' is-sm' : '') + '" x="' + n1(g.pcx) + '" y="' + n1(g.btop + g.bh * 0.86) + '" text-anchor="middle">Power plant</text>';
      var ix = g.bx0 + g.bw * 0.2;
      out += '<path class="wp2-pipe" d="M' + n1(ix) + ' ' + n1(g.bank - 2) + ' V' + n1(g.surf + 18) + '"/>';
      out += '<path class="wp2-pipe is-warm" d="M' + n1(g.bx1) + ' ' + n1(g.pipeY) + ' H' + n1(g.pipeX) + ' V' + n1(g.surf + 10) + '"/>';
      // the handle's scale on the outflow pipe: +0 to +15 °C, with its name at the top
      out += '<path class="wp2-pipe is-warm" d="M' + n1(g.vX) + ' ' + n1(g.pipeY) + ' V' + n1(g.vY0 + 2) + '" stroke-width="4"/>';
      out += '<rect class="wp2-vscale" x="' + n1(g.vX - 5) + '" y="' + n1(g.vY1) + '" width="10" height="' + n1(g.vY0 - g.vY1) + '" rx="5"/>';
      [0, 5, 10, 15].forEach(function(v){ var y = lerp(g.vY0, g.vY1, v / 15); out += '<path class="wp2-tick" d="M' + n1(g.vX + 8) + ' ' + n1(y) + ' h6"/><text class="wp2-tk" x="' + n1(g.vX + 17) + '" y="' + n1(y + 4) + '">+' + v + '</text>'; });
      // zone names on the bank
      // flow arrow on the water: the river runs left to right
      out += '<path class="wp2-flowa" d="M' + n1(Wd * 0.03) + ' ' + n1(g.surf + 16) + ' h' + (g.ph ? 26 : 36) + ' m-7 -5 l7 5 l-7 5"/>';
      // weeds and stones on the river bed
      for(var q = 0; q < Math.round(Wd / 90); q++){ var wx = (q * 83.7 + 30) % Wd, wh = 14 + (q * 7 % 12); out += '<path class="wp2-weed" d="M' + n1(wx) + ' ' + n1(g.bed - 4) + ' C' + n1(wx - 3) + ' ' + n1(g.bed - wh * 0.5) + ' ' + n1(wx + 4) + ' ' + n1(g.bed - wh * 0.7) + ' ' + n1(wx + 1) + ' ' + n1(g.bed - wh) + '"/>'; }
      return out;
    }
    /* A monitoring station on the bank, its probe in the river: the water's temperature, and a bar for the most
       oxygen it can hold with the line young trout need. */
    function station(x, g, name, tC, cap, warm){
      var pw = g.pw, ph_ = g.pH, x0 = x - pw / 2, y0 = g.ph ? 8 : Math.max(g.hor + 6, g.bank - ph_ - 10), out = '', gx0 = x0 + 12, gx1 = x0 + pw - 12, gy = y0 + ph_ - 50, bh = g.ph ? 14 : 16;
      var gv = function(v){ return gx0 + (gx1 - gx0) * clamp(v / 14, 0, 1); }, low = cap < TROUT;
      out += '<path class="wp2-post" d="M' + n1(x) + ' ' + n1(y0 + ph_) + ' V' + n1(g.bed - 6) + '"/><circle class="wp2-probe" cx="' + n1(x) + '" cy="' + n1(g.bed - 10) + '" r="4"/>';
      out += '<rect class="wp2-panel' + (low ? ' is-low' : '') + '" x="' + n1(x0) + '" y="' + n1(y0) + '" width="' + pw + '" height="' + ph_ + '" rx="12"/>';
      out += '<text class="wp2-pk' + (g.ph ? ' is-sm' : '') + '" x="' + n1(x0 + (g.ph ? 9 : 12)) + '" y="' + n1(y0 + 19) + '">' + esc(name) + '</text>';
      // thermometer glyph and the temperature, top right
      var tx = x0 + pw - 66, tt = y0 + 7, tb = y0 + 22;
      if(!g.ph) out += '<rect class="wp2-tg" x="' + n1(tx - 3.5) + '" y="' + n1(tt) + '" width="7" height="' + n1(tb - tt) + '" rx="3.5"/><circle class="wp2-tg" cx="' + n1(tx) + '" cy="' + n1(tb) + '" r="5"/>' +
        '<rect class="wp2-thermo-c' + (warm ? ' is-warm' : '') + '" x="' + n1(tx - 1.5) + '" y="' + n1(lerp(tb, tt + 2, clamp(tC / 35, 0, 1))) + '" width="3" height="' + n1(tb - lerp(tb, tt + 2, clamp(tC / 35, 0, 1))) + '"/><circle class="wp2-thermo-c' + (warm ? ' is-warm' : '') + '" cx="' + n1(tx) + '" cy="' + n1(tb) + '" r="3.4"/>';
      out += '<text class="wp2-pv is-heat' + (g.ph ? ' is-sm' : '') + '" x="' + n1(x0 + pw - (g.ph ? 9 : 12)) + '" y="' + n1(y0 + 21) + '" text-anchor="end">' + tC + ' °C</text>';
      // the most oxygen it can hold: a big bar, with young trout's need marked on it (a tall tick and a trout)
      out += '<text class="wp2-pk2" x="' + n1(gx0) + '" y="' + n1(gy - 9) + '">Can hold</text>';
      out += '<rect class="wp2-gbar" x="' + n1(gx0) + '" y="' + n1(gy) + '" width="' + n1(gx1 - gx0) + '" height="' + bh + '" rx="' + bh / 2 + '"/>';
      out += '<rect class="wp2-gbar-f' + (low ? ' is-low' : '') + '" x="' + n1(gx0) + '" y="' + n1(gy) + '" width="' + n1(gv(cap) - gx0) + '" height="' + bh + '" rx="' + bh / 2 + '"/>';
      out += '<path class="wp2-troutl" d="M' + n1(gv(TROUT)) + ' ' + n1(gy - 6) + ' V' + n1(gy + bh + 6) + '"/>' + fishSvg(gv(TROUT) + 12, gy - 11, 0.42, 1, 0, 0, 'trout', 1);
      out += '<text class="wp2-pv is-oxy' + (low ? ' is-bad' : '') + '" x="' + n1(gx0) + '" y="' + n1(gy + bh + 22) + '">' + F(cap) + ' mg/L</text>';
      if(!g.ph) out += '<text class="wp2-pk2' + (low ? ' is-bad' : '') + '" x="' + n1(gx1) + '" y="' + n1(gy + bh + 21) + '" text-anchor="end">' + (low ? 'too little' : 'trout OK') + '</text>';
      return out;
    }
    function dynHeat(g, t){
      var P0 = g.P, out = [], Wd = g.W, h = heatPts(), wf = S.warm / 15;
      // the warm plume: warm water is lighter, so it spreads along the surface downstream
      if(S.warm > 0){
        var c0 = mix(P0.warm, P0.warm, 0), dep = g.bed - g.surf;
        out.push('<defs><linearGradient id="wpPl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c0 + '" stop-opacity="' + (0.2 + wf * 0.5).toFixed(2) + '"/><stop offset="1" stop-color="' + c0 + '" stop-opacity="0"/></linearGradient></defs>');
        out.push('<path fill="url(#wpPl)" d="M' + n1(g.pipeX - 10) + ' ' + n1(g.surf) + ' C' + n1(g.pipeX - 6) + ' ' + n1(g.surf + dep * 0.55) + ' ' + n1(g.pipeX + 40) + ' ' + n1(g.surf + dep * (0.35 + wf * 0.25)) + ' ' + n1(Wd * 0.75) + ' ' + n1(g.surf + dep * (0.25 + wf * 0.2)) + ' S' + n1(Wd) + ' ' + n1(g.surf + dep * (0.22 + wf * 0.18)) + ' ' + n1(Wd + 2) + ' ' + n1(g.surf + dep * (0.22 + wf * 0.18)) + ' V' + n1(g.surf) + 'Z"/>');
        for(var k = 0; k < 4; k++){ var ph2 = ((t * 0.3 + k / 4) % 1); out.push('<path d="M' + n1(g.pipeX + 10 + k * 22 + ph2 * 30) + ' ' + n1(g.surf - 2 - ph2 * 12) + ' q4 -5 0 -10" fill="none" stroke="' + c0 + '" stroke-width="1.6" stroke-linecap="round" opacity="' + (wf * 0.8 * (1 - ph2)).toFixed(2) + '"/>'); }
      }
      // flow: soft ripples drifting downstream
      for(var f = 0; f < 7; f++){ var fy = g.surf + (g.bed - g.surf) * (0.18 + (f % 4) * 0.2), fx = ((t * (16 + f * 3) + f * 173) % (Wd + 120)) - 60; out.push('<path class="wp2-flow" d="M' + n1(fx) + ' ' + n1(fy) + ' q12 -4 24 0 t24 0"/>'); }
      // steam from the cooling tower
      var tw = g.bw * 0.62, tx = g.bx0 - tw * 0.15, ttop = g.bank - g.bh * 1.55;
      for(var s = 0; s < 4; s++){ var p = (t * 0.12 + s / 4) % 1; out.push('<circle cx="' + n1(tx + Math.sin(p * 4 + s) * 6 + p * 18) + '" cy="' + n1(ttop - 6 - p * 40) + '" r="' + n1(8 + p * 14) + '" class="wp2-steam" opacity="' + (0.7 * (1 - p)).toFixed(2) + '"/>'); }
      // trout: two above the plant, two below; below the plant they swim up out of water that cannot hold enough
      var fs = fishState('h', 4), ok0 = h.d0 >= TROUT, ok1 = h.d1 >= TROUT;
      fs.forEach(function(st, i){
        var rr = R_RAIN[i + 11], down = i >= 2, zone = down ? g.dn : g.up;
        var target = down ? (ok1 ? 0 : ok0 ? 1 : 2) : (ok0 ? 0 : 2);   // 0 stay, 1 swim upstream, 2 leave the picture
        st.to = target; if(st.o == null || !looping) st.o = target;
        var u = t * (0.3 + rr[2] * 0.15) + rr[3] * 6.28, cu = Math.cos(u), span = Math.max(30, (zone.x1 - zone.x0) * 0.32);
        var homeX = zone.x0 + (zone.x1 - zone.x0) * (i % 2 ? 0.62 : 0.28) + rr[0] * 20, upX = g.up.x0 + (g.up.x1 - g.up.x0) * (i % 2 ? 0.75 : 0.45) + rr[1] * 16, goneX = -60;
        var o = st.o, cx = o <= 1 ? lerp(homeX, upX, o) : lerp(upX, goneX, o - 1);
        var moving = Math.abs(o - target) > 0.05, x = cx + (moving ? 0 : span * 0.5 * Math.sin(u)), dir = moving ? (target > o ? -1 : 1) : (cu >= 0 ? 1 : -1);
        var sx = dir * (moving ? 1 : Math.max(0.28, Math.sqrt(Math.abs(cu)))), y = g.surf + (g.bed - g.surf) * (0.35 + rr[1] * 0.35) + Math.sin(t * 1.2 + i) * 2;
        if(x > -40) out.push(fishSvg(x, y, g.ph ? 0.8 : 1.15, sx, Math.sin(t * 7 + i) * 12, Math.sin(u * 2) * 3, 'trout', 1));
      });
      out.push(station(g.up.inst, g, 'Upstream', h.t0, h.d0, false));
      out.push(station(g.dn.inst, g, 'Downstream', h.t1, h.d1, S.warm > 0));
      out.push('<path class="wp2-surf" d="M0 ' + n1(g.surf) + ' H' + Wd + '"/>');
      return out.join('');
    }

    /* --------------------------------------------------- chapter 3: town, plant, lake below */
    function geoSew(Wd, H){
      var ph = Wd < 560, g = { W: Wd, H: H, ph: ph };
      g.hor = Math.round(H * (ph ? 0.12 : 0.2));
      if(ph){
        g.tTop = Math.round(H * 0.25); g.tH = Math.round(H * 0.25); g.px0 = 6; g.px1 = Wd - 24;
        g.lake = { x0: Math.round(Wd * 0.16), x1: Wd, surf: Math.round(H * 0.7), bed: H - 8, small: true };
      } else {
        g.tTop = Math.round(H * 0.33); g.tH = Math.round(H * 0.38); g.px0 = Math.round(Wd * 0.025); g.px1 = Math.round(Wd * 0.63);
        g.lake = { x0: Math.round(Wd * 0.69), x1: Wd, surf: Math.round(H * 0.44), bed: H - 12, small: true };
      }
      g.lake.mid = g.lake.surf + (g.lake.bed - g.lake.surf) * 0.42; g.lake.basin = lakeBasin(g.lake.x0, g.lake.x1, g.lake.surf, g.lake.bed, Wd);
      var rawW = ph ? 40 : 60, gap = ph ? 8 : 16, n = 4, tw = (g.px1 - g.px0 - rawW - gap * n) / n;
      g.tanks = [{ x: g.px0, y: g.tTop + g.tH * 0.18, w: rawW, h: g.tH * 0.82, raw: true }];
      for(var i = 0; i < n; i++) g.tanks.push({ x: g.px0 + rawW + gap * (i + 1) + tw * i, y: g.tTop, w: tw, h: g.tH });
      g.pipeY = g.tTop + g.tH * 0.3;
      g.outX = ph ? Wd - 12 : g.px1 + Math.round(Wd * 0.025);
      return g;
    }
    function staticSew(g){
      var P0 = g.P, Wd = g.W, H = g.H, out = '<defs>' + skyAndHills(g, Wd, H) + fishDefs() + '<linearGradient id="wpBank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P0.near + '"/><stop offset="1" stop-color="' + P0.grass2 + '"/></linearGradient></defs>';
      out += '<rect width="' + Wd + '" height="' + (g.hor + 4) + '" fill="url(#wpSky)"/>';
      out += hills(Wd, g.hor, P0, H);
      out += '<rect y="' + n1(g.hor) + '" width="' + Wd + '" height="' + n1(H - g.hor) + '" fill="url(#wpBank)"/>';
      // town: a few houses on the left of the horizon
      var hx = g.ph ? 10 : 16, hy = g.hor + (g.ph ? 20 : 26);
      for(var k = 0; k < (g.ph ? 3 : 4); k++){
        var x = hx + k * (g.ph ? 26 : 30), w = g.ph ? 20 : 24, h = (g.ph ? 14 : 18) + (k % 2) * 4, y = hy - (k % 2) * 3;
        out += '<rect class="wp2-house" x="' + x + '" y="' + n1(y - h) + '" width="' + w + '" height="' + h + '"/><path class="wp2-hroof" d="M' + (x - 3) + ' ' + n1(y - h) + ' L' + n1(x + w / 2) + ' ' + n1(y - h - w * 0.5) + ' L' + (x + w + 3) + ' ' + n1(y - h) + 'Z"/>' +
          '<rect class="wp2-win" x="' + n1(x + w * 0.35) + '" y="' + n1(y - h * 0.65) + '" width="' + n1(w * 0.3) + '" height="' + n1(h * 0.3) + '"/>';
      }
      out += '<text class="wp2-lab" x="' + n1(hx + (g.ph ? 84 : 124)) + '" y="' + n1(hy - (g.ph ? 26 : 30)) + '">Town</text>';
      // sewer from the town down to the plant
      var raw = g.tanks[0];
      out += '<path class="wp2-pipe is-sew" d="M' + n1(hx + 40) + ' ' + n1(hy) + ' V' + n1(g.pipeY - (g.ph ? 16 : 22)) + ' H' + n1(raw.x + raw.w * 0.5) + ' V' + n1(raw.y + 4) + '"/>';
      // the lake below: water and bed (its life is drawn each frame)
      out += lakeStatic(g.lake, P0, 'wpLk3') + bedArt(g.lake, P0);
      out += '<text class="wp2-lab" x="' + n1(g.lake.x0 + (g.lake.x1 - g.lake.x0) * 0.55) + '" y="' + n1(g.lake.surf - 10) + '" text-anchor="middle">Lake below</text>';
      return out;
    }
    function tankArt(tk, i, on, t, P0, ph){ return tankArt0(tk, i, on, t, P0, ph, looping); }
    function dynSew(g, t){
      var P0 = g.P, out = [], last = S.stage, tk = g.tanks;
      // pipes between used tanks; the bypass over the skipped ones
      for(var i = 0; i < tk.length; i++){
        out.push(tankArt(tk[i], i, i <= last, t, P0, g.ph));
        if(i < tk.length - 1){ var a = tk[i], b = tk[i + 1]; out.push('<path class="wp2-pipe' + (i < last ? ' is-sew' : ' is-off') + '" d="M' + n1(a.x + a.w) + ' ' + n1(g.pipeY) + ' H' + n1(b.x) + '"/>'); }
      }
      var from = tk[last], by = g.tTop - (g.ph ? 12 : 16), outY = g.ph ? g.lake.surf - 26 : g.pipeY;
      var outPath = last < 4 ? 'M' + n1(from.x + from.w * 0.5) + ' ' + n1(from.y) + ' V' + n1(by) + ' H' + n1(g.outX) + ' V' + n1(outY) : 'M' + n1(from.x + from.w) + ' ' + n1(g.pipeY) + ' H' + n1(g.outX) + ' V' + n1(outY);
      out.push('<path class="wp2-pipe is-sew' + (last < 4 ? ' is-bypass' : '') + '" d="' + outPath + '"/>');
      out.push('<path class="wp2-flowp" d="' + outPath + '" stroke-dashoffset="' + n1(-t * 24) + '"/>');
      if(last < 4) out.push('<text class="wp2-tk wp2-bylab" x="' + n1((from.x + from.w * 0.5 + g.outX) / 2) + '" y="' + n1(by - 6) + '" text-anchor="middle">' + (last ? 'skips the rest' : 'skips the plant') + '</text>');
      // the river from the outfall into the lake below
      var L = g.lake, rv = g.ph ? 'M' + n1(g.outX) + ' ' + n1(outY) + ' V' + n1(L.surf + 3)
        : 'M' + n1(g.outX) + ' ' + n1(outY) + ' V' + n1(L.surf - 8) + ' C' + n1(g.outX) + ' ' + n1(L.surf) + ' ' + n1(L.x0) + ' ' + n1(L.surf) + ' ' + n1(L.x0 + 30) + ' ' + n1(L.surf + 3);
      var nut = W.SEWAGE.stages[last].left.nutrients / 100;
      out.push('<path d="' + rv + '" fill="none" stroke="' + mix(P0.top, P0.murky, nut * 0.5) + '" stroke-width="' + (g.ph ? 7 : 9) + '" stroke-linecap="round"/>');
      out.push('<path d="' + rv + '" fill="none" stroke="' + P0.nut + '" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="2 9" stroke-dashoffset="' + n1(-t * 24) + '" opacity="' + clamp(nut * 1.4, 0, 1).toFixed(2) + '"/>');
      var lk = lakeDyn(L, sew, S.sday, t, P0, 'wpLk3', 's3', 3);
      out.push(lk.svg);
      var ph = phase(sew, S.sday), o = ph.o, st = status(o), cxL = L.x0 + (L.x1 - L.x0) * (g.ph ? 0.32 : 0.24), byL = bedY(L, cxL + 30);
      out.push(chip(cxL, byL - (g.ph ? 40 : 46), 'Bottom water', fO(o) + ' mg/L', st.tone, g.ph, [cxL + 30, byL - 8]));
      if(S.sday > 0 && ph.cur === 5 && o < W.HYPOXIC) out.push(callout(L.x0 + (L.x1 - L.x0) * 0.58, L.surf + (L.bed - L.surf) * 0.3, 'Dead zone', 'bad', 'middle', true));
      return out.join('');
    }

    /* ======================================================= the graph (shares the cursor with the scene) */
    function graph(){
      if(!GG) return;
      var Wg = GG.W, Hg = GG.H, ph = Wg < 560, L = ph ? 34 : 46, R = Wg - (ph ? 12 : 22), top = ph ? 50 : 58, bot = Hg - (ph ? 30 : 32), out = [];
      function ln(x1, y1, x2, y2, cls){ return '<line class="' + cls + '" x1="' + n1(x1) + '" y1="' + n1(y1) + '" x2="' + n1(x2) + '" y2="' + n1(y2) + '"/>'; }
      function tx(x, y, s, cls, a){ return '<text class="' + cls + '" x="' + n1(x) + '" y="' + n1(y) + '"' + (a ? ' text-anchor="' + a + '"' : '') + '>' + s + '</text>'; }
      if(S.ch === 'fert' || S.ch === 'sew'){
        // one fixed scale for every run (0 to 12 mg/L; algae 0 to 120 times day 0 on the right), so runs compare
        R = Wg - (ph ? 34 : 50);
        var r = S.ch === 'fert' ? run : sew, seen = S.ch === 'fert' ? S.seen : S.sseen, cur = S.ch === 'fert' ? S.day : S.sday, gh = ghost[S.ch];
        var yMax = Y_MAX, x = function(d){ return L + d / W.LAKE_DAYS * (R - L); }, y = function(v){ return bot - clamp(v, 0, yMax) / yMax * (bot - top); }, ya = function(v){ return bot - clamp(v / r.A[0] / ALG_MAX, 0, 1) * (bot - top); };
        out.push('<rect class="wp2-g-hyp" x="' + n1(L) + '" y="' + n1(y(2)) + '" width="' + n1(R - L) + '" height="' + n1(bot - y(2)) + '"/>');
        // the top line (12) has no number: the cursor's knob sits over that corner
        for(var v = 0; v <= yMax; v += ph ? 4 : 2) out.push(ln(L, y(v), R, y(v), 'wp2-g-grid') + (v < yMax ? tx(L - 6, y(v) + 4, v, 'wp2-g-tk', 'end') : ''));
        for(var av = 0; av < ALG_MAX; av += 40) out.push(tx(R + 6, bot - av / ALG_MAX * (bot - top) + 4, av, 'wp2-g-tk is-alg', 'start'));
        for(var dd = 0; dd <= 60; dd += 10) out.push(tx(x(dd), bot + 15, dd, 'wp2-g-tk', 'middle'));
        out.push(tx(R, bot + (ph ? 28 : 29), 'Day', 'wp2-g-ax', 'end'));
        // the last run, faint (what changed?)
        if(gh && gh.upto > 0){ var gp = []; for(var gi = 0; gi <= Math.min(60, Math.round(gh.upto)); gi++) gp.push(n1(x(gi)) + ',' + n1(y(gh.O[gi]))); out.push('<polyline class="wp2-g-ghost" points="' + gp.join(' ') + '"/>'); }
        var sv = Math.round(Math.min(seen, W.LAKE_DAYS));
        if(sv > 0){
          var ap = [], op = [];
          for(var i = 0; i <= sv; i++){ ap.push(n1(x(i)) + ',' + n1(ya(r.A[i]))); op.push(n1(x(i)) + ',' + n1(y(r.O[i]))); }
          if(seen > sv && sv < 60){ ap.push(n1(x(seen)) + ',' + n1(ya(at(r.A, seen)))); op.push(n1(x(seen)) + ',' + n1(y(at(r.O, seen)))); }
          out.push('<polygon class="wp2-g-alg" points="' + n1(x(0)) + ',' + n1(bot) + ' ' + ap.join(' ') + ' ' + n1(x(Math.min(seen, 60))) + ',' + n1(bot) + '"/>');
          out.push('<polyline class="wp2-g-algl" points="' + ap.join(' ') + '"/>');
          out.push('<polyline class="wp2-g-do" points="' + op.join(' ') + '"/>');
        } else out.push('<circle class="wp2-g-dot" cx="' + n1(x(0)) + '" cy="' + n1(y(r.O[0])) + '" r="4"/>');
        if(seen < 60){
          out.push('<rect class="wp2-g-fog" x="' + n1(x(Math.max(seen, 0)) + 1) + '" y="' + n1(top) + '" width="' + n1(Math.max(0, R - x(Math.max(seen, 0)) - 1)) + '" height="' + n1(bot - top) + '"/>');
          if(seen < 0.5) out.push(tx((x(Math.max(seen, 0)) + R) / 2, (top + bot) / 2 + 4, ph ? 'Press Play or drag here' : 'Press Play, or drag along the graph', 'wp2-g-fogt', 'middle'));
        }
        var satY = y(r.osat), hypY = y(2);
        out.push(ln(L, satY, R, satY, 'wp2-g-sat'));
        out.push(tx(R - 4, satY - 5, (ph ? 'Most it holds: ' : 'Most it can hold: ') + F(r.osat), 'wp2-g-satt', 'end'));
        out.push(tx(R - 4, hypY - 5, ph ? 'Dead zone below 2' : '2 mg/L: dead zone below', 'wp2-g-hypt', 'end'));
        out.push(ln(L, bot, R, bot, 'wp2-g-axis') + ln(L, top, L, bot, 'wp2-g-axis') + ln(R, top, R, bot, 'wp2-g-axis is-alg'));
        // the cursor's value, placed clear of the line labels at the right and of the axis
        if(cur <= seen + 1e-9){
          var ov = at(r.O, cur), cx = x(cur), cy = y(ov), lw = 64, right = cx < R - lw - 14;
          var ly = cy - 9;
          if(ly < top + 12) ly = cy + 20;
          if(ly > bot - 6) ly = cy - 9;
          var lx0 = right ? cx + 9 : cx - 9 - lw, lx1 = lx0 + lw, labW = ph ? 112 : 150;
          [satY - 5, hypY - 5].forEach(function(yy){ if(Math.abs(ly - yy) < 14 && lx1 > R - 4 - labW){ ly = yy > cy ? yy - 16 : yy + 18; } });
          ly = clamp(ly, top + 12, bot - 6);
          out.push('<circle class="wp2-g-dot" cx="' + n1(cx) + '" cy="' + n1(cy) + '" r="5"/><circle class="wp2-g-adot" cx="' + n1(cx) + '" cy="' + n1(ya(at(r.A, cur))) + '" r="4"/>');
          out.push('<text class="wp2-g-val' + (ov < 2 ? ' is-bad' : '') + '" x="' + n1(right ? cx + 9 : cx - 9) + '" y="' + n1(ly) + '" text-anchor="' + (right ? 'start' : 'end') + '">' + fO(ov) + ' mg/L</text>');
        }
        out.push(tx(L, ph ? 14 : 16, ph ? (S.ch === 'sew' ? 'Lake below: O₂, mg/L' : 'Bottom oxygen, mg/L') : (S.ch === 'sew' ? 'Lake below: ' : '') + 'Bottom oxygen (mg/L)', 'wp2-g-ax is-oxy'));
        out.push('<rect class="wp2-g-alg" x="' + n1(Wg - (ph ? 138 : 158)) + '" y="' + n1(ph ? 5 : 7) + '" width="14" height="10" rx="2"/>' + tx(Wg - 4, ph ? 14 : 16, 'Algae, × day 0', 'wp2-g-ax is-alg', 'end'));
        scrub.place([L, top, R, bot], 0, W.LAKE_DAYS); scrub.value(Math.round(cur));
        gsvg.setAttribute('aria-label', (S.ch === 'sew' ? 'Lake below the plant: ' : '') + 'bottom-water oxygen over 60 days on a 0 to 12 mg/L scale, with the algae shaded (times its day 0 amount, right axis) and a line at 2 mg/L.' + (sv ? ' Lowest so far ' + F(Math.min.apply(null, r.O.slice(0, sv + 1))) + ' mg/L.' : ' Not run yet.') + (gh && gh.upto > 0 ? ' A faint line shows your last run, ' + gh.label + '.' : ''));
        ghostEl.hidden = !(gh && gh.upto > 0);
        if(gh && gh.upto > 0) ghostEl.innerHTML = '<i aria-hidden="true"></i>Faint line: your last run (' + esc(gh.label) + ')';
      } else {
        ghostEl.hidden = true;
        var h = heatPts(), xs = function(t){ return L + t / 35 * (R - L); }, ys = function(v){ return bot - v / 16 * (bot - top); };
        for(var a = 0; a <= 16; a += 4) out.push(ln(L, ys(a), R, ys(a), 'wp2-g-grid') + tx(L - 6, ys(a) + 4, a, 'wp2-g-tk', 'end'));
        for(var b = 0; b <= 35; b += 5) out.push(tx(xs(b), bot + 15, b, 'wp2-g-tk', 'middle'));
        out.push(tx(R, bot + (ph ? 28 : 29), 'Temperature (°C)', 'wp2-g-ax', 'end'));
        out.push('<rect class="wp2-g-band" x="' + n1(xs(h.t0)) + '" y="' + n1(top) + '" width="' + n1(xs(h.t0 + 15) - xs(h.t0)) + '" height="' + n1(bot - top) + '"/>');
        out.push(ln(L, ys(TROUT), R, ys(TROUT), 'wp2-g-trout') + tx(R - 4, ys(TROUT) - 6, 'Young trout need ' + TROUT, 'wp2-g-troutt', 'end'));
        out.push('<polyline class="wp2-g-osat" points="' + W.OSAT.map(function(q){ return n1(xs(q[0])) + ',' + n1(ys(q[1])); }).join(' ') + '"/>');
        W.OSAT.forEach(function(q){ out.push('<circle class="wp2-g-pt" cx="' + n1(xs(q[0])) + '" cy="' + n1(ys(q[1])) + '" r="2.6"/>'); });
        out.push(ln(L, bot, R, bot, 'wp2-g-axis') + ln(L, top, L, bot, 'wp2-g-axis'));
        out.push('<circle class="wp2-g-up" cx="' + n1(xs(h.t0)) + '" cy="' + n1(ys(h.d0)) + '" r="6"/>');
        out.push(tx(xs(h.t0) + 9, ys(h.d0) - 11, 'Upstream: ' + F(h.d0), 'wp2-g-val is-oxy', 'start'));
        out.push('<circle class="wp2-g-dn' + (h.d1 < TROUT ? ' is-bad' : '') + '" cx="' + n1(xs(h.t1)) + '" cy="' + n1(ys(h.d1)) + '" r="6"/>');
        if(S.warm > 0) out.push(tx(xs(h.t1) + (xs(h.t1) > R - 150 ? -10 : 12), ys(h.d1) + 22, 'Downstream: ' + F(h.d1), 'wp2-g-val is-heat', xs(h.t1) > R - 150 ? 'end' : 'start'));
        out.push(tx(L, ph ? 14 : 16, 'Most oxygen fresh water can hold (mg/L), USGS', 'wp2-g-ax is-oxy'));
        scrub.place([xs(h.t0), top, xs(h.t0 + 15), bot], h.t0, h.t0 + 15);
        scrub.value(h.t1);
        gsvg.setAttribute('aria-label', 'Saturation curve: the most oxygen fresh water can hold against temperature. Upstream ' + h.t0 + ' °C, ' + F(h.d0) + ' mg/L; downstream ' + h.t1 + ' °C, ' + F(h.d1) + ' mg/L. Young trout need ' + TROUT + ' mg/L.');
      }
      gsvg.innerHTML = out.join('');
    }

    /* ======================================================= "?": how it works, sources, tables, settings */
    function refHtml(){
      var c = S.ch, h = '';
      var src = '<h3 class="ls-title-l">Sources</h3><ul class="wp2-src">' +
        '<li>Oxygen fresh water can hold at each temperature: USGS dissolved oxygen solubility tables, sea level, rounded to 0.1 mg/L.</li>' +
        '<li>Below 2 mg/L the water is hypoxic, a dead zone: USGS, “Dissolved oxygen and water” (citing CENR 2000).</li>' +
        '<li>About 5 mg/L or more for most aquatic animals to thrive (the “Healthy” line): Chesapeake Bay Program, “Dissolved oxygen”.</li>' +
        (c !== 'fert' ? '<li>Young trout need 9.5 mg/L: EPA freshwater criteria for coldwater fish, early life stages, 7 day mean (EPA 1986; EPA factsheet on dissolved oxygen, 2021). Adult trout: 6.5 mg/L, 30 day mean.</li>' : '') +
        (c === 'sew' ? '<li>What each treatment stage leaves: typical rounded values from EPA, “How wastewater treatment plants work”. Real plants vary.</li>' +
          '<li>Organic matter (BOD) uses oxygen as bacteria break it down: USGS, “Biological oxygen demand (BOD) and water”; EPA, “Indicators: dissolved oxygen”.</li>' : '') + '</ul>';
      if(c === 'fert'){
        var rows = [0, 5, 10, 15, 20, 30, 40, 50, 60].map(function(d){ return '<tr' + (Math.round(S.day) === d ? ' class="hl"' : '') + '><th scope="row">' + d + '</th><td class="r">' + F(run.N[d], 2) + '</td><td class="r">' + F(run.A[d] / run.A[0]) + '×</td><td class="r">' + F(run.D[d]) + '</td><td class="r">' + F(run.O[d]) + '</td></tr>'; }).join('');
        h = '<p>A small model of one lake after one storm washes fertilizer in, solved day by day: nutrients feed algae; algae that run out of nutrients die and sink; aerobic decomposers break the dead algae down and use oxygen; oxygen from the air mixes back in toward the most the water can hold. It shows the order and the shape of the chain. It is a teaching model, not a forecast for a real lake.</p>' +
          '<h3 class="ls-title-l">The chain</h3><ol class="wp2-chain">' + STEPS.map(function(s, i){ return '<li><b>' + esc(s.name) + '.</b> ' + esc(STEP_LONG[i]) + '</li>'; }).join('') + '</ol>' +
          '<p><b>Why the oxygen falls late.</b> Living algae make oxygen by day. Most of the drop comes after they die, when bacteria decompose them on the bottom, and the bottom water mixes little with the air. A dense bloom also uses some oxygen at night (it respires in the dark), which can cause night time dips; this model leaves that out and counts the decomposers, which use most of it.</p>' +
          '<p><b>Warm lakes suffer more.</b> At ' + S.tLake + ' °C water holds at most ' + F(run.osat) + ' mg/L, and decomposers work faster when it is warm.</p>' +
          '<p><b>Do not mix up.</b> Fertilizers (nitrate, phosphate) cause eutrophication; pesticides are a different pollutant. Thermal pollution is heat (chapter 2).</p>' +
          '<h3 class="ls-title-l">The lake, day by day</h3><p class="bt-small">' + sk(S.sacks) + ', lake at ' + S.tLake + ' °C. Nutrients and dead algae in relative units; algae as times its day 0 amount (the graph’s right axis); oxygen in mg/L.</p>' +
          '<div class="table-wrap" tabindex="0" role="region" aria-label="Lake model by day"><table class="ls-tbl"><thead><tr><th scope="col">Day</th><th scope="col">Nutrients</th><th scope="col">Algae</th><th scope="col">Dead algae</th><th scope="col">Bottom oxygen</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '<p class="bt-small">Lowest bottom oxygen ' + F(run.min) + ' mg/L on day ' + run.minDay + '. Days below 2 mg/L: ' + run.hypoxicDays + '.</p>' + src;
      } else if(c === 'heat'){
        var hp = heatPts();
        h = '<p><b>Heat, not chemicals.</b> A power plant takes in river water to cool its machines and returns it warmer. Nothing else is added.</p>' +
          '<p><b>Warm water holds less gas.</b> The curve is the most oxygen fresh water can hold at each temperature (saturation). Real rivers often hold less than that, never more.</p>' +
          '<p><b>Fish are hit twice.</b> Fish are ectotherms: warm water speeds up their metabolism, so they need more oxygen just as the water holds less. Some species cannot survive above a temperature (thermal shock).</p>' +
          '<p><b>What trout need, and what the water can hold.</b> Young trout need at least ' + TROUT + ' mg/L of dissolved oxygen. Above about 18 °C, the river cannot hold that much even when it is full of oxygen, so trout cannot breed there. (The tool reads the curve to 0.1 mg/L.)</p>' +
          '<h3 class="ls-title-l wp2-set-h">Settings</h3>' +
          '<h3 class="ls-title-l">Oxygen fresh water can hold (USGS, sea level)</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Oxygen saturation by temperature"><table class="ls-tbl"><thead><tr><th scope="col">Temperature</th><th scope="col">Most it can hold</th></tr></thead><tbody>' +
          W.OSAT.map(function(p){ return '<tr><th scope="row">' + p[0] + ' °C</th><td class="r">' + F(p[1]) + ' mg/L</td></tr>'; }).join('') + '</tbody></table></div>' +
          '<p class="bt-small">Between rows the tool reads the curve by straight lines. ' + hp.t0 + ' °C to ' + hp.t1 + ' °C: (' + F(hp.d1) + ' − ' + F(hp.d0) + ') / ' + F(hp.d0) + ' × 100 = ' + T.F(M.Calc().percentChange(hp.d0, hp.d1), 1) + '%.</p>' + src;
      } else {
        h = '<p><b>Why treat sewage?</b> Raw sewage carries solids, organic matter (bacteria use oxygen as they break it down, which is what BOD, biochemical oxygen demand, measures), nitrogen and phosphorus that feed algae, and pathogens.</p>' +
          '<h3 class="ls-title-l">The stages</h3><ol class="wp2-stages">' + W.SEWAGE.stages.slice(1).map(function(s){ return '<li><b>' + esc(s.name) + '.</b> ' + esc(s.how) + '</li>'; }).join('') + '</ol>' +
          '<p><b>Each stage removes a share of what is left,</b> so percentages multiply.</p>' +
          '<h3 class="ls-title-l">The lake below</h3><ul class="wp2-src">' +
            '<li>It runs the chapter 1 lake model at ' + SEW_T + ' °C, the same chain, played the same way.</li>' +
            '<li><b>Nitrogen and phosphorus</b> left after the last stage are scaled so raw sewage counts as the heaviest fertilizer level (5 sacks): ' + W.SEWAGE.stages.map(function(s, i){ return esc(SEW_NAMES[i].toLowerCase()) + ' ' + s.left.nutrients + '%, level ' + F(SEW_LEVEL(i), 2); }).join('; ') + '.</li>' +
            '<li><b>Organic matter (BOD)</b> left goes in on day 0 as dead organic matter for the decomposers, ' + W.BOD_D + ' relative units for raw sewage: ' + W.SEWAGE.stages.map(function(s, i){ return esc(SEW_NAMES[i].toLowerCase()) + ' ' + s.left.bod + '%'; }).join(', ') + '. Bacteria start using oxygen at once, so raw and primary effluent pull the oxygen down within days, before any bloom; secondary removes most of it.</li>' +
            '<li>These scalings are teaching choices, not measurements: the order of the stages and the shape of the result are what to take away.</li></ul>' +
          '<h3 class="ls-title-l">Share of the raw load still in the water</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Sewage treatment by stage"><table class="ls-tbl"><thead><tr><th scope="col">After</th>' + W.SEWAGE.parts.map(function(p){ return '<th scope="col">' + esc(p.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          W.SEWAGE.stages.map(function(s, i){ return '<tr' + (i === S.stage ? ' class="hl"' : '') + '><th scope="row">' + esc(s.name) + '</th>' + W.SEWAGE.parts.map(function(p){ return '<td class="r">' + (s.left[p.k] < 1 ? s.left[p.k] : Math.round(s.left[p.k])) + '%</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' + src;
      }
      h += '<p class="bt-small wp2-reset"><button type="button" class="tk2-link" data-wp-reset>Start this chapter’s challenges again</button></p>';
      ref.innerHTML = h;
      if(c === 'heat'){ var hs = ref.querySelector('.wp2-set-h'); if(hs) hs.parentNode.insertBefore(setBox, hs.nextSibling); }
      else if(setBox.parentNode) setBox.parentNode.removeChild(setBox);
    }
    ref.addEventListener('click', function(e){ if(e.target.closest('[data-wp-reset]')){ C[S.ch].reset(); tempShown(); if(LS) LS.close(); } });

    /* ======================================================= placing it in the studio */
    function studio(pane, s){
      LS = s;
      K.on(s);
      s.add('stage', stage, { mode: 'explore' });
      s.add('dock', panel, { mode: 'explore' });
      s.add('details', ref, { mode: 'explore' });
      var ab = pane.querySelector('details.tool-about, .tool-about'); if(ab) s.add('about', ab, { mode: 'explore' });
      syncCh(); layoutNow();
      if(window.ResizeObserver){ var tm = null, re = function(){ clearTimeout(tm); tm = setTimeout(function(){ placePredict(); layoutNow(); }, 50); }; new ResizeObserver(re).observe(sceneBox); new ResizeObserver(re).observe(graphBox); }
      try{ new MutationObserver(function(){ layoutNow(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
      loop(true);
    }
    syncCh(); words(); refHtml();
    return {
      studio: studio,
      shown: function(on){ visible = on; if(!on) player.stop(); loop(on); if(on) setTimeout(layoutNow, 30); }
    };
  }
  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'water-pollution', noun: 'drill',
      generate: function(r, ctx, type){ return W.generate(r, ctx, type); },
      types: [{ value: 'chain', label: 'Read the oxygen graph' }, { value: 'dochange', label: 'Percent change in oxygen' }, { value: 'thermal', label: 'Thermal pollution' }, { value: 'sewage', label: 'Sewage treatment' }, { value: 'load', label: 'Nutrient load' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { chain: 'The eutrophication chain', dochange: 'Percent change in dissolved oxygen', thermal: 'Thermal pollution', sewage: 'Sewage treatment', load: 'A nitrate load' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; api.st.try = null; figure(api.fig, api.problem, api.st); },
      // a wrong reading is drawn on the graph as a red line at the student's value
      onTry: function(s, att, api){ api.st.try = { key: s.key, v: att.value }; figure(api.fig, api.problem, api.st); },
      refit: function(api){ figure(api.fig, api.problem, api.st); }
    });
  }
  /* The student's wrong reading: a dashed red line across the graph. */
  function tryLine(L, R, y, text){
    return '<line class="wp-try" x1="' + L + '" x2="' + R + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><text class="wp-try-t" x="' + (R - 4) + '" y="' + (y - 6).toFixed(1) + '" text-anchor="end">' + esc(text) + '</text>';
  }
  /* The drill's figure, drawn from the problem's own numbers in the Explore's style (the same graph, the same tanks,
     sacks, field and river); a value is written on it only once its step is answered, so it never gives a key away. */
  function figure(el, p, st){
    st = st || {};
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    var phone = (window.innerWidth || 1280) <= 640, Wd = phone ? 340 : 600, H = T.figSize(Wd, phone ? 280 : 300, { max: g.kind === 'load' ? 0.46 : 0.72 })[1], out = [], label = '';
    var P0 = PAL[document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'];
    var L = 40, R = Wd - 14, top = 34, bot = H - 40;
    function ln(x1, y1, x2, y2, cls){ return '<line class="' + cls + '" x1="' + n1(x1) + '" y1="' + n1(y1) + '" x2="' + n1(x2) + '" y2="' + n1(y2) + '"/>'; }
    function tx(x, y, t, cls, an){ return '<text class="' + cls + '" x="' + n1(x) + '" y="' + n1(y) + '"' + (an ? ' text-anchor="' + an + '"' : '') + '>' + t + '</text>'; }
    if(g.kind === 'lake'){
      // the Explore's lake graph: oxygen 0 to 12 mg/L, algae as times its day 0 amount on the right
      R = Wd - 40;
      var yMax = Math.max(12, Math.ceil(g.osat + 1)), A0 = g.algae[0][1] || 1, aMax = 120, x = function(d){ return L + d / 60 * (R - L); }, y = function(v){ return bot - v / yMax * (bot - top); }, ya = function(v){ return bot - Math.min(v / A0, aMax) / aMax * (bot - top); };
      out.push('<rect class="wp2-g-hyp" x="' + L + '" y="' + n1(y(2)) + '" width="' + (R - L) + '" height="' + n1(bot - y(2)) + '"/>');
      for(var v = 0; v <= yMax; v += 2) out.push(ln(L, y(v), R, y(v), 'wp2-g-grid') + tx(L - 6, y(v) + 4, v, 'wp2-g-tk', 'end'));
      for(var av = 0; av <= aMax; av += 40) out.push(tx(R + 6, bot - av / aMax * (bot - top) + 4, av, 'wp2-g-tk is-alg', 'start'));
      [0, 10, 20, 30, 40, 50, 60].forEach(function(d){ out.push(tx(x(d), bot + 15, d, 'wp2-g-tk', 'middle')); });
      out.push('<polygon class="wp2-g-alg" points="' + L + ',' + bot + ' ' + g.algae.map(function(q){ return n1(x(q[0])) + ',' + n1(ya(q[1])); }).join(' ') + ' ' + R + ',' + bot + '"/>');
      out.push('<polyline class="wp2-g-algl" points="' + g.algae.map(function(q){ return n1(x(q[0])) + ',' + n1(ya(q[1])); }).join(' ') + '"/>');
      out.push(ln(L, y(g.osat), R, y(g.osat), 'wp2-g-sat') + tx(R - 4, y(g.osat) - 5, 'Most it can hold: ' + F(g.osat), 'wp2-g-satt', 'end'));
      out.push('<polyline class="wp2-g-do" points="' + g.series.map(function(q){ return n1(x(q[0])) + ',' + n1(y(q[1])); }).join(' ') + '"/>');
      out.push(tx(R - 4, y(2) - 5, '2 mg/L: dead zone below', 'wp2-g-hypt', 'end'));
      if(st.try && st.try.key === 'lowest' && isFinite(st.try.v) && st.try.v >= 0 && st.try.v <= yMax) out.push(tryLine(L, R, y(st.try.v), 'Yours: ' + F(st.try.v) + ' mg/L'));
      out.push(ln(L, bot, R, bot, 'wp2-g-axis') + ln(L, top, L, bot, 'wp2-g-axis') + ln(R, top, R, bot, 'wp2-g-axis is-alg'));
      out.push(tx(L, top - 14, 'Bottom oxygen (mg/L)', 'wp2-g-ax is-oxy') + tx(Wd - 4, top - 14, 'Algae, × day 0', 'wp2-g-ax is-alg', 'end') + tx(R, bot + 30, 'Day', 'wp2-g-ax', 'end'));
      label = 'Graph of bottom-water dissolved oxygen over 60 days at ' + g.T + ' °C, with the algae shaded behind it (times its day 0 amount, right axis) and a line at 2 mg/L. Values every 10 days: ' + g.series.filter(function(q){ return q[0] % 10 === 0; }).map(function(q){ return 'day ' + q[0] + ' ' + F(q[1]) + ' mg/L'; }).join(', ') + '.';
    } else if(g.kind === 'bars'){
      var yM = 12, yy = function(v){ return bot - v / yM * (bot - top); }, bw = (R - L) / 2;
      out.push('<rect class="wp2-g-hyp" x="' + L + '" y="' + n1(yy(2)) + '" width="' + (R - L) + '" height="' + n1(bot - yy(2)) + '"/>');
      for(var t = 0; t <= yM; t += 2) out.push(ln(L, yy(t), R, yy(t), 'wp2-g-grid') + tx(L - 6, yy(t) + 4, t, 'wp2-g-tk', 'end'));
      [g.before, g.after].forEach(function(v, i){ var bx = L + i * bw + bw * 0.25, ww = bw * 0.5, low = v < 2;
        out.push('<rect class="wp2-gbar-f' + (low ? ' is-low' : '') + '" x="' + n1(bx) + '" y="' + n1(yy(v)) + '" width="' + n1(ww) + '" height="' + n1(bot - yy(v)) + '" rx="6"/>' + tx(bx + ww / 2, yy(v) - 7, F(v) + ' mg/L', 'wp2-g-val' + (low ? ' is-bad' : ''), 'middle') + tx(bx + ww / 2, bot + 16, esc(g.labels[i]), 'wp2-g-tk', 'middle')); });
      out.push(tx(R - 4, yy(2) - 5, '2 mg/L: dead zone below', 'wp2-g-hypt', 'end'));
      out.push(ln(L, bot, R, bot, 'wp2-g-axis') + ln(L, top, L, bot, 'wp2-g-axis') + tx(L, top - 14, 'Bottom oxygen (mg/L)', 'wp2-g-ax is-oxy'));
      label = 'Bar graph of bottom-water oxygen: ' + esc(g.labels[0]) + ' ' + F(g.before) + ' mg/L, ' + esc(g.labels[1]) + ' ' + F(g.after) + ' mg/L, with the hypoxic zone below 2 mg/L shaded.';
    } else if(g.kind === 'osat'){
      // the Explore's saturation curve, with the two temperatures marked (values appear only as the table is read)
      var xs = function(t){ return L + t / 35 * (R - L); }, ys = function(v){ return bot - v / 16 * (bot - top); };
      for(var a = 0; a <= 16; a += 4) out.push(ln(L, ys(a), R, ys(a), 'wp2-g-grid') + tx(L - 6, ys(a) + 4, a, 'wp2-g-tk', 'end'));
      for(var bb = 0; bb <= 35; bb += 5) out.push(tx(xs(bb), bot + 15, bb, 'wp2-g-tk', 'middle'));
      out.push('<rect class="wp2-g-band" x="' + n1(xs(g.t0)) + '" y="' + top + '" width="' + n1(xs(g.t1) - xs(g.t0)) + '" height="' + (bot - top) + '"/>');
      out.push('<polyline class="wp2-g-osat" points="' + W.OSAT.map(function(q){ return n1(xs(q[0])) + ',' + n1(ys(q[1])); }).join(' ') + '"/>');
      W.OSAT.forEach(function(q){ var last = q[0] >= 35; out.push('<circle class="wp2-g-pt" cx="' + n1(xs(q[0])) + '" cy="' + n1(ys(q[1])) + '" r="3.4"/>' + tx(xs(q[0]) + (last ? -5 : 5), ys(q[1]) - 8, F(q[1]), 'wp2-g-tk', last ? 'end' : null)); });
      [g.t0, g.t1].forEach(function(t, i){ out.push('<line class="wp-guide ' + (i ? 'is-warm' : '') + '" x1="' + n1(xs(t)) + '" x2="' + n1(xs(t)) + '" y1="' + top + '" y2="' + bot + '"/>' + tx(xs(t), top - 4, t + ' °C', 'wp2-g-val ' + (i ? 'is-heat' : 'is-oxy'), 'middle')); });
      if(st.try && st.try.key === 'read' && isFinite(st.try.v) && st.try.v >= 0 && st.try.v <= 16) out.push(tryLine(L, R, ys(st.try.v), 'Yours: ' + F(st.try.v) + ' mg/L'));
      out.push(ln(L, bot, R, bot, 'wp2-g-axis') + ln(L, top, L, bot, 'wp2-g-axis') + tx(L, top - 18, 'Most oxygen fresh water can hold (mg/L), USGS', 'wp2-g-ax is-oxy') + tx(R, bot + 30, 'Temperature (°C)', 'wp2-g-ax', 'end'));
      label = 'Oxygen saturation of fresh water against temperature, USGS: ' + W.OSAT.map(function(q){ return q[0] + ' °C ' + F(q[1]) + ' mg/L'; }).join(', ') + '. Dashed lines at ' + g.t0 + ' and ' + g.t1 + ' °C.';
    } else if(g.kind === 'plant'){
      // the Explore's tanks: raw inflow, primary, secondary, each named, with the BOD under it once worked out
      var names = ['Raw sewage', 'Primary', 'Secondary'], vals = [g.bod, st.after1 ? g.a1 : null, st.after2a ? g.a2 : null], gap = phone ? 26 : 56, tw = (Wd - 28 - 2 * gap) / 3, ty = top + 22, th = Math.min(H * 0.46, tw * 1.05);
      names.forEach(function(nm, i){
        var x0 = 14 + i * (tw + gap), cx = x0 + tw / 2;
        out.push(tankArt0({ x: x0, y: ty, w: tw, h: th }, i, true, 0, P0, true, false).replace(/<text[^>]*>[^<]*<\/text>|<rect class="wp2-tpill[^>]*\/>/g, ''));
        out.push(tx(cx, ty - 8, nm, 'wp2-tname', 'middle'));
        out.push('<rect class="wp2-tpill" x="' + n1(cx - 58) + '" y="' + n1(ty + th + 10) + '" width="116" height="24" rx="12"/>' + tx(cx, ty + th + 27, vals[i] != null ? 'BOD ' + F(vals[i]) + ' mg/L' : 'BOD ?', 'wp2-tdoes' + (vals[i] == null ? ' is-q' : ''), 'middle'));
        if(i < 2){ var ax = x0 + tw, ay = ty + th * 0.3; out.push('<path class="wp2-pipe is-sew" d="M' + n1(ax) + ' ' + n1(ay) + ' h' + gap + '"/>' + tx(ax + gap / 2, ay - 10, '−' + (i ? g.p2 : g.p1) + '%', 'wp2-g-val is-bad', 'middle')); }
      });
      label = 'Treatment plant: raw sewage with BOD ' + g.bod + ' mg/L; primary removes ' + g.p1 + '%, secondary removes ' + g.p2 + '% of what is left.' + (st.after1 ? ' After primary ' + F(g.a1) + ' mg/L.' : '') + (st.after2a ? ' After secondary ' + F(g.a2) + ' mg/L.' : '');
    } else if(g.kind === 'load'){
      // the Explore's field: fertilizer sacks on a field, the runoff down the slope into a stream
      var fieldY = top + 40, mid = Wd * 0.48, wy = fieldY + 34;
      out.push('<rect x="0" y="0" width="' + Wd + '" height="' + n1(fieldY + 6) + '" fill="' + P0.sky1 + '"/>');
      out.push('<path fill="' + P0.soil + '" d="M0 ' + fieldY + ' H' + n1(mid - 60) + ' C' + n1(mid - 30) + ' ' + fieldY + ' ' + n1(mid - 20) + ' ' + wy + ' ' + n1(mid + 6) + ' ' + wy + ' V' + H + ' H0Z"/>');
      out.push('<path fill="none" stroke="' + P0.grass + '" stroke-width="6" stroke-linecap="round" d="M0 ' + fieldY + ' H' + n1(mid - 60) + ' C' + n1(mid - 30) + ' ' + fieldY + ' ' + n1(mid - 20) + ' ' + wy + ' ' + n1(mid + 6) + ' ' + wy + '"/>');
      for(var c = 0; c < 3; c++) out.push(sack(24 + c * 34, fieldY - 1, 30, P0));
      for(var cr = 130; cr < mid - 70; cr += 13) out.push('<g class="wp2-crop"><path d="M' + cr + ' ' + (fieldY - 3) + ' V' + (fieldY - 20) + '"/><path d="M' + cr + ' ' + (fieldY - 10) + ' q-7 -3 -9 -10 M' + cr + ' ' + (fieldY - 14) + ' q7 -3 9 -10"/></g>');
      out.push('<rect x="' + n1(mid + 6) + '" y="' + n1(wy) + '" width="' + n1(Wd - mid - 6) + '" height="' + n1(H - wy) + '" fill="' + mix(P0.top, P0.deep, 0.4) + '"/><path class="wp2-surf" d="M' + n1(mid + 6) + ' ' + n1(wy) + ' H' + Wd + '"/>');
      out.push('<path fill="none" stroke="' + P0.nut + '" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 6" d="M' + n1(mid - 70) + ' ' + n1(fieldY + 2) + ' C' + n1(mid - 30) + ' ' + n1(fieldY + 4) + ' ' + n1(mid - 18) + ' ' + n1(wy + 2) + ' ' + n1(mid + 30) + ' ' + n1(wy + 10) + '"/>');
      out.push(tx(14, top - 6, g.conc + ' mg/L nitrate in the runoff', 'wp-lab wp-c-nut'));
      out.push(tx((mid + R) / 2, wy + 30, 'Stream: ' + String(g.flow).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' L/day', 'wp-lab', 'middle'));
      if(st.load) out.push(tx((mid + R) / 2, wy + 58, M.fmt(g.load, 3) + ' kg nitrate/day', 'wp-tag wp-c-nut', 'middle'));
      if(st.reduce) out.push(tx((mid + R) / 2, wy + 84, 'with the fix: ' + M.fmt(g.after, 3) + ' kg/day', 'wp-tag wp-c-alg', 'middle'));
      label = 'Farm field with fertilizer sacks; runoff carrying ' + g.conc + ' mg/L nitrate into a stream that flows ' + g.flow + ' L per day.' + (st.load ? ' Load ' + M.fmt(g.load, 3) + ' kg per day.' : '');
    }
    el.innerHTML = '<figure class="cd-fig wp-qfig wp2-qfig"><svg class="wp-svg" viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + out.join('') + '</svg></figure>';
  }
})();
