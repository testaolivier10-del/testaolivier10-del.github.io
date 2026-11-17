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
              in the water column; EPA factsheet on dissolved oxygen, 2021). Compared with the most the water can
              hold (saturation, read to 0.1 mg/L): if even full water cannot hold it, trout cannot breed there.
     SEW_LEVEL the lake below the plant: the share of nitrogen and phosphorus left after the last stage (W.SEWAGE,
              EPA typical values) scaled to the chapter 1 runoff level, raw sewage = the heaviest level, 5.
              A teaching mapping, not a measured one ("?" says so). */
  var HEALTHY = 5, TROUT = 9.5, SEW_T = 20;
  function SEW_LEVEL(i){ return 5 * W.SEWAGE.stages[i].left.nutrients / 100; }
  var CH = [{ value: 'fert', label: 'Fertilizer runoff', short: 'Fertilizer' }, { value: 'heat', label: 'Hot water' }, { value: 'sew', label: 'Sewage' }];
  var STEPS = [{ name: 'Runoff' }, { name: 'Algae bloom' }, { name: 'Algae die' }, { name: 'Decomposers feed' }, { name: 'Oxygen drops' }, { name: 'Dead zone', tone: 'bad' }];
  var STEP_LONG = ['Rain washes fertilizer off the field. Nitrate and phosphate reach the lake.',
    'Nitrate and phosphate usually limit algae. With more of them, algae multiply and turn the surface green.',
    'The bloom shades itself and runs out of nutrients. Huge numbers of algae die and sink.',
    'Aerobic bacteria break down the dead algae on the bottom and use oxygen as they respire.',
    'Decomposers use oxygen faster than the air can put it back into the bottom water.',
    'Below 2 mg/L the water is hypoxic: fish leave or die. This is a dead zone.'];
  var SEW_NAMES = ['No treatment', 'Primary', 'Secondary', 'Tertiary', 'Disinfection'];
  var SEW_DOES = ['', 'solids settle', 'bacteria eat waste', 'removes N and P', 'kills germs'];

  function status(o){ return o < W.HYPOXIC ? { status: 'Dead zone', tone: 'bad' } : o < HEALTHY ? { status: 'Stressed', tone: 'warn' } : { status: 'Healthy', tone: 'good' }; }
  function dark(){ return document.documentElement.getAttribute('data-theme') === 'dark'; }

  /* Colors for the picture (the CSS role colors are in water-pollution.css; these are the blends JS computes). */
  var PAL = {
    light: { sky0: '#BFE0F2', sky1: '#EEF6FA', far: '#B7D2B4', near: '#94BE86', grass: '#78AE48', grass2: '#5C8F35', soil: '#B88C5C', soil2: '#8F6A44', soil3: '#6F5236',
      top: [118, 189, 226], deep: [44, 108, 156], green: [104, 160, 52], murky: [74, 70, 48], bed: '#8C7656', bed2: '#6A583F', silt: '#A08A66',
      alg: [86, 150, 44], algHi: [150, 205, 90], brown: [128, 92, 52], nut: '#E69F00', bac: '#B5509A', bub: 'rgba(255,255,255,.85)', sun: '#F6C445',
      cloud: '#8E9A99', cloud2: '#A9B4B2', rain: '#5A9CCB', conc: '#C9CED0', conc2: '#A4ABAD', steel: '#7B8A90', brick: '#B5654A', roof: '#7A4A3A', warm: [230, 120, 60] },
    dark: { sky0: '#18324A', sky1: '#203A4E', far: '#2D4A3F', near: '#2B4636', grass: '#4E7F33', grass2: '#3D6A28', soil: '#6A5238', soil2: '#53402B', soil3: '#3E3020',
      top: [52, 120, 160], deep: [22, 60, 94], green: [78, 140, 46], murky: [44, 42, 30], bed: '#4E4231', bed2: '#3A3024', silt: '#5E5038',
      alg: [92, 170, 60], algHi: [150, 215, 100], brown: [150, 112, 70], nut: '#F3C04F', bac: '#E08CC8', bub: 'rgba(220,240,255,.7)', sun: '#E8C060',
      cloud: '#4C5A60', cloud2: '#5E6C72', rain: '#7FB6DE', conc: '#5A6468', conc2: '#465054', steel: '#8A9AA0', brick: '#9A5A44', roof: '#6A4436', warm: [240, 140, 80] }
  };
  function mix(a, b, f){ f = clamp(f, 0, 1); return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * f) + ',' + Math.round(a[1] + (b[1] - a[1]) * f) + ',' + Math.round(a[2] + (b[2] - a[2]) * f) + ')'; }
  function mixA(a, b, f){ f = clamp(f, 0, 1); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
  function rnd(seed, n){ var r = M.rng(seed), out = []; for(var i = 0; i < n; i++) out.push([r(), r(), r(), r()]); return out; }
  var R_ALG = rnd(7, 90), R_BAC = rnd(13, 44), R_BUB = rnd(19, 16), R_NUT = rnd(23, 30), R_PLANT = rnd(29, 14), R_PEB = rnd(31, 26), R_RAIN = rnd(37, 40);

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
    return run;
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
    var S = { ch: 'fert', sacks: 3, tLake: 20, day: 0, seen: 0, up: 10, warm: 0, stage: 4, sday: 0, clock: 0 };
    try{ var q0 = new URLSearchParams(location.search).get('ch'); if(q0 === 'heat' || q0 === 'sew') S.ch = q0; }catch(e){}
    var run = prep(W.lake(S.sacks, S.tLake)), sew = prep(W.lake(SEW_LEVEL(S.stage), SEW_T));
    S.sday = Math.round(sew.minDay);
    var LS = null, visible = true, nid = T.nid('wp');

    /* ---- the stage: tabs, scene with its controls, timeline, graph */
    var stage = document.createElement('div'); stage.className = 'wp2-stage';
    var tabs = K.tabs({ label: 'Chapters', items: CH, value: S.ch, onChange: function(v){ setCh(v); } });
    stage.appendChild(tabs.el);
    var sceneBox = document.createElement('div'); sceneBox.className = 'wp2-scene'; sceneBox.id = nid + '-sc';
    sceneBox.innerHTML = '<svg class="wp2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="wp2-static"></g><g class="wp2-dyn"></g></svg>';
    stage.appendChild(sceneBox);
    var svg = sceneBox.querySelector('svg'), gStatic = svg.querySelector('.wp2-static'), gDyn = svg.querySelector('.wp2-dyn');
    var layer = K.layer(sceneBox);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', sceneBox.id); });
    var bar = document.createElement('div'); bar.className = 'wp2-bar';
    var player = K.player({ min: 0, max: W.LAKE_DAYS, speed: 5, get: function(){ return S.day; }, set: function(v){ setDay(v, 'play'); },
      labels: { play: 'Play', pause: 'Pause', again: 'Replay' }, onEnd: function(){ setDay(W.LAKE_DAYS, 'play'); afterRun(); } });
    player.el.setAttribute('aria-label', 'Play the 60 days');
    var dayLab = document.createElement('p'); dayLab.className = 'wp2-day'; dayLab.setAttribute('aria-hidden', 'true');
    var tl = K.timeline({ label: 'The chain, step by step', steps: STEPS, onPick: pickStep });
    var barL = document.createElement('div'); barL.className = 'wp2-barl'; barL.appendChild(player.el); barL.appendChild(dayLab);
    bar.appendChild(barL); bar.appendChild(tl.el);
    stage.appendChild(bar);
    var graphBox = document.createElement('div'); graphBox.className = 'wp2-graph';
    graphBox.innerHTML = '<svg class="wp2-gsvg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"></svg>';
    stage.appendChild(graphBox);
    var gsvg = graphBox.querySelector('svg');
    var scrub = K.scrub(graphBox, { key: 'apenv-wp-graph', chip: false, label: 'Day on the graph', min: 0, max: W.LAKE_DAYS, step: 1, value: 0, rect: [0, 0, 10, 10],
      valuetext: function(v){ return scrubText(v); }, onStart: function(){ player.stop(); }, onInput: function(v){ onScrub(v); } });
    host.appendChild(stage);

    /* ---- on-picture controls (placed by each scene's layout) */
    var cSacks = K.drag(layer, { key: 'apenv-wp-sacks', label: 'Fertilizer sacks on the field', min: 0, max: 5, step: 1, value: S.sacks, track: [0, 0, 1, 0], hint: 'Drag',
      valuetext: function(v){ return v + (v === 1 ? ' sack' : ' sacks') + ' of fertilizer'; }, tag: function(v){ return v + (v === 1 ? ' sack' : ' sacks'); },
      onInput: function(v){ player.stop(); S.sacks = v; newRun(); } });
    var cTemp = K.drag(layer, { key: 'apenv-wp-laket', chip: false, label: 'Lake temperature', min: 10, max: 30, step: 1, value: S.tLake, track: [0, 1, 0, 0], hint: 'Drag',
      valuetext: function(v){ return 'Lake at ' + v + ' degrees Celsius'; }, tag: function(v){ return v + ' °C'; },
      onInput: function(v){ player.stop(); S.tLake = v; newRun(); } });
    var cWarm = K.drag(layer, { key: 'apenv-wp-warm', label: 'How much warmer the outflow makes the river downstream', min: 0, max: 15, step: 1, value: S.warm, track: [0, 1, 0, 0], hint: 'Drag',
      valuetext: function(v){ return 'Downstream ' + v + ' degrees warmer, ' + (S.up + v) + ' degrees Celsius'; }, tag: function(v){ return G && G.ph ? '' : '+' + v + ' °C'; }, tagSide: 'right',
      onInput: function(v){ S.warm = v; heatChanged(); } });
    var cTanks = [0, 1, 2, 3, 4].map(function(i){
      return K.tap(layer, { key: i === 1 ? 'apenv-wp-tank' : null, label: i ? 'Stop after ' + SEW_NAMES[i].toLowerCase() + ' treatment' : 'No treatment: raw sewage to the river', box: [0, 0, 1, 1], pressed: i === S.stage, hint: 'Tap',
        onClick: function(){ setStage(i); } });
    });

    /* ---- the side panel: one loop per chapter */
    var panel = document.createElement('div'); panel.className = 'wp2-panel';
    var read = K.readout({ items: [] });
    var P = {}, C = {};
    P.fert = K.predict({ q: 'Heavy fertilizer runoff reaches the lake. Three weeks later, the fish...', answer: 'leave',
      choices: [{ value: 'better', label: 'do better: more food' }, { value: 'same', label: 'are about the same' }, { value: 'leave', label: 'leave or die' }],
      then: 'Now press Play under the lake.', onPick: function(){ if(S.seen >= 21) judgeFert(); } });
    P.heat = K.predict({ q: 'The plant adds only heat, no chemicals. Downstream, the river can hold...', answer: 'less',
      choices: [{ value: 'more', label: 'more oxygen' }, { value: 'same', label: 'the same oxygen' }, { value: 'less', label: 'less oxygen' }],
      then: 'Now drag the handle on the outflow pipe.', onPick: function(){ if(S.warm > 0) judgeHeat(); } });
    P.sew = K.predict({ q: 'Which stage removes most of the nitrogen and phosphorus?', answer: '3',
      choices: [{ value: '1', label: 'Primary' }, { value: '2', label: 'Secondary' }, { value: '3', label: 'Tertiary' }],
      then: 'Now tap the tanks and watch the N and P.', onPick: function(){ if(S.tapped) judgeSew(); } });
    C.fert = K.challenges({ store: 'apenv-wp-fert', items: [
        { id: 'safe', text: 'Find the most fertilizer the lake can take without a dead zone.' },
        { id: 'warm', text: 'Same fertilizer, warmer lake: is the dead zone longer or shorter? Try 30 °C.' },
        { id: 'link', text: 'Which link in the chain actually uses up the oxygen? Tap it on the timeline.' }],
      done: { text: 'Chapter 1 done.', action: { label: 'Next: 2 Hot water', onClick: function(){ tabs.value('heat'); setCh('heat', true); } } },
      onShow: function(it){ chalBody('fert', it); } });
    C.heat = K.challenges({ store: 'apenv-wp-heat', items: [
        { id: 'trout', text: 'Find the warmest outflow that keeps the river downstream liveable for trout.' },
        { id: 'pct', text: 'Set the outflow to +10 °C. By about what percent does the oxygen the river can hold fall?' }],
      done: { text: 'Chapter 2 done.', action: { label: 'Next: 3 Sewage', onClick: function(){ tabs.value('sew'); setCh('sew', true); } } },
      onShow: function(it){ chalBody('heat', it); } });
    C.sew = K.challenges({ store: 'apenv-wp-sew', items: [
        { id: 'secondary', text: 'Stop after secondary treatment. What happens in the lake below?' },
        { id: 'fewest', text: 'Use the fewest stages that keep the lake below out of a dead zone.' }],
      done: { text: 'All three chapters done.', action: { label: 'Test yourself', onClick: function(){ var m = getModes(); if(m) m.show('quiz', true); } } },
      onShow: function(it){ chalBody('sew', it); } });
    ['fert', 'heat', 'sew'].forEach(function(k){ P[k].el.setAttribute('data-ch', k); C[k].el.setAttribute('data-ch', k); });
    panel.appendChild(P.fert.el); panel.appendChild(P.heat.el); panel.appendChild(P.sew.el);
    panel.appendChild(read.el);
    panel.appendChild(C.fert.el); panel.appendChild(C.heat.el); panel.appendChild(C.sew.el);
    host.appendChild(panel);

    /* ---- "?": the reference for the chapter, and the settings */
    var ref = document.createElement('div'); ref.className = 'ls-sec wp2-ref';
    host.appendChild(ref);
    var sUp = T.slider({ label: 'River temperature upstream', min: 5, max: 20, step: 1, value: S.up, unit: '°C', onInput: function(v){ S.up = v; heatChanged(true); } });
    var setBox = document.createElement('div'); setBox.className = 'wp2-set'; setBox.appendChild(sUp.el);

    /* ------------------------------------------------------- state changes */
    function newRun(){
      run = prep(W.lake(S.sacks, S.tLake));
      S.seen = Math.max(S.day, 0);
      dirtyG = true; words(); refHtml(); checkFert(); draw();
      say('Fertilizer ' + S.sacks + (S.sacks === 1 ? ' sack' : ' sacks') + ', lake at ' + S.tLake + ' °C. ' + dayLine());
    }
    function setDay(v, how){
      S.day = clamp(v, 0, W.LAKE_DAYS);
      if(S.day > S.seen){ S.seen = S.day; dirtyG = true; }
      if(how !== 'scrub') scrub.value(Math.round(S.day));
      dirtyG = true; words();
      if(S.seen >= 21 && P.fert.picked() && !P.fert.settled()) judgeFert();
      if(how !== 'play'){ checkFert(); say(dayLine()); if(!player.playing()) player.paint(); }
      else if(Math.floor(S.day) % 5 === 0) checkFert();
      if(!looping) draw();
    }
    function afterRun(){ checkFert(); say(dayLine() + ' Lowest ' + F(run.min) + ' mg/L on day ' + run.minDay + '.'); }
    function onScrub(v){
      if(S.ch === 'fert') setDay(v, 'scrub');
      else if(S.ch === 'heat'){ var w = clamp(Math.round(v - S.up), 0, 15); if(w !== S.warm){ S.warm = w; cWarm.value(w); heatChanged(); } }
      else { S.sday = v; dirtyG = true; words(); say(sewDayLine()); if(!looping) draw(); }
    }
    function scrubText(v){
      if(S.ch === 'fert') return 'Day ' + v + ', bottom water ' + F(at(run.O, v)) + ' milligrams per liter';
      if(S.ch === 'heat') return v + ' degrees Celsius downstream, holds ' + F(W.osat(v)) + ' milligrams per liter';
      return 'Lake below, day ' + v + ', bottom water ' + F(at(sew.O, v)) + ' milligrams per liter';
    }
    function heatChanged(fromSetting){
      if(fromSetting){ S.warm = clamp(S.warm, 0, 15); }
      dirtyG = true; words(); refHtml();
      if(S.warm > 0 && P.heat.picked() && !P.heat.settled()) judgeHeat();
      checkHeat(); say(heatLine()); if(!looping) draw();
    }
    function setStage(i){
      S.stage = i; S.tapped = true;
      sew = prep(W.lake(SEW_LEVEL(i), SEW_T)); S.sday = Math.round(sew.minDay);
      cTanks.forEach(function(t, k){ t.pressed(k === i); });
      dirtyG = true; words(); refHtml();
      if(P.sew.picked() && !P.sew.settled()) judgeSew();
      checkSew(); say(sewLine()); if(!looping) draw();
    }
    function pickStep(i){
      var day = run.stages[i];
      var cur = C.fert.current();
      if(S.ch === 'fert' && cur && cur.id === 'link'){ answerLink(i); }
      if(day == null){ say(STEPS[i].name + ' is not reached with this much fertilizer.'); return; }
      player.stop(); setDay(day, 'tap');
    }
    function setCh(v, focus){
      if(v === S.ch) return;
      player.stop(); S.ch = v; layoutNow(); syncCh();
      say({ fert: 'Chapter 1, fertilizer runoff. ', heat: 'Chapter 2, hot water. ', sew: 'Chapter 3, sewage. ' }[v] + (v === 'fert' ? dayLine() : v === 'heat' ? heatLine() : sewLine()));
      if(focus){ var t = tabs.el.querySelector('[aria-selected="true"]'); if(t) t.focus(); }
    }
    function syncCh(){
      var c = S.ch;
      stage.setAttribute('data-ch', c);
      panel.querySelectorAll('[data-ch]').forEach(function(e){ e.hidden = e.getAttribute('data-ch') !== c; });
      bar.hidden = c !== 'fert';
      cSacks.hide(c !== 'fert'); cTemp.hide(c !== 'fert'); cWarm.hide(c !== 'heat'); cTanks.forEach(function(t){ t.el.hidden = c !== 'sew'; });
      read.items(c === 'fert' ? [{ k: 'o', label: 'Bottom oxygen' }, { k: 'a', label: 'Algae' }, { k: 'z', label: 'Days in a dead zone' }]
        : c === 'heat' ? [{ k: 'u', label: 'Upstream' }, { k: 'd', label: 'Downstream' }]
        : [{ k: 'n', label: 'N and P left' }, { k: 'o', label: 'Lake below, lowest oxygen' }], c === 'fert' ? 'Right now' : c === 'heat' ? 'Oxygen the river can hold' : 'After the plant');
      var sp = c === 'fert' ? { min: 0, max: W.LAKE_DAYS, v: Math.round(S.day), l: 'Day on the graph' } : c === 'heat' ? { min: S.up, max: S.up + 15, v: S.up + S.warm, l: 'Temperature downstream, on the graph' } : { min: 0, max: W.LAKE_DAYS, v: S.sday, l: 'Day in the lake below, on the graph' };
      scrub.input.setAttribute('aria-label', sp.l);
      scrub.place(null, sp.min, sp.max); scrub.value(sp.v);
      if(LS) LS.task(goal(c), 'explore');
      try{ var u = new URL(location.href); if(c === 'fert') u.searchParams.delete('ch'); else u.searchParams.set('ch', c); history.replaceState(history.state, '', u); }catch(e){}
      dirtyG = true; words(); refHtml(); draw();
    }
    function goal(c){
      return c === 'fert' ? { kicker: 'Goal', title: 'Follow fertilizer from a field to the fish.', todo: 'Drag the sacks on the field, then press Play.' }
        : c === 'heat' ? { kicker: 'Goal', title: 'See what heat alone does to a river.', todo: 'Drag the handle on the outflow pipe.' }
        : { kicker: 'Goal', title: 'Find the stage that protects the lake below.', todo: 'Tap a tank to stop the treatment there.' };
    }

    /* ------------------------------------------------------- words: readout, day line, announcements */
    var sayEl = null;
    function say(t){ read.say(t); }
    function oNow(){ return at(run.O, S.day); }
    function dayLine(){ var o = oNow(), st = status(o); return 'Day ' + Math.round(S.day) + ': bottom water ' + F(o) + ' mg/L, ' + st.status.toLowerCase() + '.'; }
    function heatPts(){ var t0 = S.up, t1 = S.up + S.warm; return { t0: t0, t1: t1, d0: r1(W.osat(t0)), d1: r1(W.osat(t1)) }; }
    function heatLine(){ var h = heatPts(); return 'Upstream ' + h.t0 + ' °C holds up to ' + F(h.d0) + ' mg/L. Downstream ' + h.t1 + ' °C holds up to ' + F(h.d1) + ' mg/L.' + (h.d1 < TROUT ? ' Too little for young trout.' : ''); }
    function sewLine(){ var lf = W.SEWAGE.stages[S.stage].left; return (S.stage ? 'Treated through ' + SEW_NAMES[S.stage].toLowerCase() : 'No treatment') + ': ' + lf.nutrients + '% of the nitrogen and phosphorus left. Lake below: lowest bottom oxygen ' + F(sew.min) + ' mg/L, ' + status(sew.min).status.toLowerCase() + '.'; }
    function sewDayLine(){ return 'Lake below, day ' + S.sday + ': bottom water ' + F(at(sew.O, S.sday)) + ' mg/L.'; }
    function deadSoFar(){ var n = 0; for(var i = 0; i <= Math.floor(S.day); i++) if(run.O[i] < W.HYPOXIC) n++; return n; }
    function words(){
      var c = S.ch;
      if(c === 'fert'){
        var o = oNow(), a = at(run.A, S.day) / run.A[0];
        read.set('o', Object.assign({ value: F(o), unit: 'mg/L' }, status(o)));
        read.set('a', { value: (a < 10 ? F(a) : String(Math.round(a))) + '×', unit: '', sub: a > 3 ? 'times day 0: a bloom' : 'times day 0' });
        var z = deadSoFar();
        read.set('z', { value: String(z), unit: z === 1 ? 'day' : 'days', sub: 'so far, of ' + Math.round(S.day) });
        dayLab.innerHTML = '<b>Day ' + Math.round(S.day) + '</b> of 60';
        var reached = run.stages.map(function(d){ return d != null && S.day >= d - 1e-9; }), cur = W.stageAt(run, S.day);
        var rec = S.sacks > 0 && cur >= 4 && S.day > run.minDay + 2 && oNow() > (run.min + 1.2);
        tl.set({ reached: reached, current: rec ? -1 : cur, sub: run.stages.map(function(d, i){ return d == null ? (S.seen >= W.LAKE_DAYS - 1e-9 ? 'not reached' : '') : S.seen >= d ? 'day ' + d : ''; }), off: run.stages.map(function(d){ return d == null; }) });
      } else if(c === 'heat'){
        var h = heatPts();
        read.set('u', { value: F(h.d0), unit: 'mg/L', sub: 'at ' + h.t0 + ' °C' });
        read.set('d', Object.assign({ value: F(h.d1), unit: 'mg/L', sub: 'at ' + h.t1 + ' °C' + (h.t1 > h.t0 ? ', ' + F(Math.abs(M.Calc().percentChange(h.d0, h.d1)), 0) + '% less' : '') },
          h.d1 >= TROUT ? { status: 'Trout can breed', tone: 'good' } : { status: 'Too little for trout', tone: 'bad' }));
      } else {
        var lf = W.SEWAGE.stages[S.stage].left;
        read.set('n', { value: String(lf.nutrients), unit: '%', sub: S.stage ? 'after ' + SEW_NAMES[S.stage].toLowerCase() : 'no treatment', status: lf.nutrients > 50 ? 'Feeds algae' : 'Mostly removed', tone: lf.nutrients > 50 ? 'warn' : 'good' });
        read.set('o', Object.assign({ value: F(sew.min), unit: 'mg/L', sub: 'on day ' + sew.minDay }, status(sew.min)));
      }
    }

    /* ------------------------------------------------------- predictions */
    function judgeFert(){
      var p = P.fert.picked(), hyp = false; for(var i = 0; i <= 21; i++) if(run.O[i] < W.HYPOXIC) hyp = true;
      var lowest = Math.min.apply(null, run.O.slice(0, 22));
      // the prediction is about heavy runoff: a light run does not settle it
      if(S.sacks < 3 && !hyp){ P.fert.note('This run has only ' + S.sacks + (S.sacks === 1 ? ' sack' : ' sacks') + ' (lowest ' + F(lowest) + ' mg/L). To test your prediction, set 3 or more and play past day 21.'); return; }
      if(hyp) P.fert.result(p === 'leave', (p === 'leave' ? '<b>Your prediction held.</b> ' : '<b>Not quite.</b> ') + 'The bottom water fell to ' + F(lowest) + ' mg/L, a dead zone: decomposers breaking down the dead algae used up the oxygen.');
      else if(lowest >= HEALTHY) P.fert.result(p === 'same', (p === 'same' ? '<b>Your prediction held</b> in this cold lake. ' : '<b>Not in this cold lake.</b> ') + 'At ' + S.tLake + ' °C the oxygen never fell below ' + F(lowest) + ' mg/L: cold water holds more oxygen, and decomposers work slower.');
      else P.fert.result(null, '<b>Partly.</b> The oxygen fell to ' + F(lowest) + ' mg/L: stressed, not a dead zone. Decomposers used oxygen, but not enough to go below 2 mg/L.');
    }
    function judgeHeat(){
      var p = P.heat.picked(), h = heatPts();
      P.heat.result(p === 'less', (p === 'less' ? '<b>Your prediction held.</b> ' : '<b>Not quite.</b> ') + 'At ' + h.t1 + ' °C the river can hold only ' + F(h.d1) + ' mg/L, ' + F(h.d0 - h.d1) + ' less than at ' + h.t0 + ' °C: warmer water holds less gas.');
    }
    function judgeSew(){
      var p = P.sew.picked(), L = W.SEWAGE.stages;
      P.sew.result(p === '3', (p === '3' ? '<b>Right.</b> ' : '<b>Not quite.</b> ') + 'Tertiary treatment takes N and P from ' + L[2].left.nutrients + '% left to ' + L[3].left.nutrients + '%. Primary and secondary leave most of them, so they feed algae downstream.');
    }

    /* ------------------------------------------------------- challenges */
    function note(html, info){ return '<p class="tk2-note' + (info ? ' is-info' : '') + '">' + html + '</p>'; }
    function btnRow(list, onPick, disabled){
      var row = document.createElement('div'); row.className = 'tk2-row';
      list.forEach(function(x){ var b = document.createElement('button'); b.type = 'button'; b.className = 'tk2-btn'; b.textContent = x.label; b.disabled = !!disabled; b.addEventListener('click', function(){ onPick(x.v, b); }); row.appendChild(b); });
      return row;
    }
    function maxSafe(T){ var best = -1; for(var l = 0; l <= 5; l++) if(W.lake(l, T).hypoxicDays === 0) best = l; else break; return best; }
    function chalBody(c, it){
      var Cc = C[c];
      if(!it){ return; }
      if(c === 'fert'){
        if(it.id === 'safe') Cc.body(note('Change the sacks, then play to day 60 each time.', true));
        else if(it.id === 'warm'){
          var box = document.createElement('div');
          box.innerHTML = '<p>Drag the lake thermometer, play, then answer.</p>';
          box.appendChild(btnRow([{ v: 'longer', label: 'Longer' }, { v: 'shorter', label: 'Shorter' }], function(v){
            var lv = Math.max(S.sacks, 3), a = W.lake(lv, 20).hypoxicDays, b = W.lake(lv, 30).hypoxicDays;
            if(v === 'longer') Cc.met('warm', 'Longer. With ' + lv + ' sacks: ' + a + ' days below 2 mg/L at 20 °C, ' + b + ' days at 30 °C. Warm water holds less oxygen, and decomposers work faster.');
            else { var n = box.querySelector('.tk2-note'); if(n) n.remove(); box.insertAdjacentHTML('beforeend', note('Not quite. Set the lake to 30 °C and play it, then count the days in a dead zone.')); }
          }));
          Cc.body(box);
        } else if(it.id === 'link') Cc.body(note('Tap one of the six steps under the lake.', true));
      } else if(c === 'heat'){
        if(it.id === 'trout') Cc.body(note('Young trout need water that can hold at least ' + TROUT + ' mg/L. Watch the downstream gauge.', true));
        else if(it.id === 'pct'){
          var bx = document.createElement('div'), d0 = r1(W.osat(S.up)), d10 = r1(W.osat(S.up + 10)), pc = Math.abs(M.Calc().percentChange(d0, d10)), right = Math.round(pc / 5) * 5;
          var lo = Math.max(5, Math.round(right / 2 / 5) * 5); if(lo === right) lo = Math.max(5, right - 10);
          var hi = Math.round(right * 2.5 / 5) * 5; if(hi === right) hi = right + 15;
          var opts = [right, lo, hi].map(function(v){ return { v: v, label: 'About ' + v + '% less' }; });
          opts.sort(function(a, b){ return a.v - b.v; });
          bx.innerHTML = '<p class="wp2-pct-hint">' + (S.warm === 10 ? 'Read both gauges.' : 'Drag the outflow handle to +10 °C first.') + '</p>';
          bx.appendChild(btnRow(opts, function(v){
            if(S.warm !== 10){ bx.querySelector('.wp2-pct-hint').textContent = 'Drag the outflow handle to +10 °C first.'; return; }
            if(v === right) Cc.met('pct', 'About ' + right + '% less. (' + F(d10) + ' − ' + F(d0) + ') / ' + F(d0) + ' × 100 = ' + T.F(M.Calc().percentChange(d0, d10), 1) + '%.');
            else { var n = bx.querySelector('.tk2-note'); if(n) n.remove(); bx.insertAdjacentHTML('beforeend', note('Not quite. Percent change = (new − old) / old × 100, with the two gauge values.')); }
          }));
          Cc.body(bx);
        }
      } else {
        if(it.id === 'secondary'){
          var sb = document.createElement('div');
          sb.innerHTML = '<p class="wp2-sec-hint">' + (S.stage === 2 ? 'Look at the lake below and its graph.' : 'Tap the secondary tank first.') + '</p>';
          sb.appendChild(btnRow([{ v: 'ok', label: 'It stays healthy' }, { v: 'dead', label: 'A bloom, then a dead zone' }, { v: 'germs', label: 'Only germs reach it' }], function(v){
            if(S.stage !== 2){ sb.querySelector('.wp2-sec-hint').textContent = 'Tap the secondary tank first.'; return; }
            var lv = prep(W.lake(SEW_LEVEL(2), SEW_T));
            if(v === 'dead') Cc.met('secondary', 'A bloom, then a dead zone. ' + W.SEWAGE.stages[2].left.nutrients + '% of the N and P still leaves the plant: algae bloom, die, and decomposers pull the bottom water down to ' + F(lv.min) + ' mg/L.');
            else { var n = sb.querySelector('.tk2-note'); if(n) n.remove(); sb.insertAdjacentHTML('beforeend', note(v === 'ok' ? 'Not quite. Look at the lake’s oxygen graph: where does it go?' : 'Not quite. Disinfection is skipped, so germs remain, but what do the N and P do?')); }
          }));
          Cc.body(sb);
        } else Cc.body(note('Tap the tanks from the left. Watch the lake’s lowest oxygen.', true));
      }
    }
    function answerLink(i){
      var why = ['Runoff brings the nutrients. Nitrate and phosphate do not use up oxygen themselves.',
        'Living algae make oxygen by photosynthesis. The bloom is not what uses it up.',
        'Close. Dead algae sink, but the oxygen is used by what breaks them down next.',
        '', 'That is the result. Which step causes the drop?', 'That is the end of the chain. Which step uses up the oxygen?'];
      if(i === 3){ tl.flash(3, 'good'); C.fert.met('link', 'Decomposers. Aerobic bacteria use oxygen as they break down the dead algae, so the low comes days after the bloom.'); }
      else { tl.flash(i, 'bad'); C.fert.body(note('<b>' + esc(STEPS[i].name) + ':</b> ' + why[i])); }
    }
    function checkFert(){
      var cur = C.fert.current(); if(!cur || cur.id !== 'safe') return;
      if(S.seen < run.minDay + 1) return;
      var safe = run.hypoxicDays === 0, best = maxSafe(S.tLake);
      if(safe && S.sacks === best && best < 5) C.fert.met('safe', S.sacks + (S.sacks === 1 ? ' sack' : ' sacks') + ' at ' + S.tLake + ' °C: the oxygen bottoms out at ' + F(run.min) + ' mg/L. One more sack makes a dead zone.');
      else if(!safe) C.fert.body(note('That made a dead zone (' + run.hypoxicDays + ' days below 2 mg/L). Try fewer sacks.'));
      else if(S.sacks < best) C.fert.body(note('No dead zone with ' + S.sacks + (S.sacks === 1 ? ' sack' : ' sacks') + '. Can the lake take more?', true));
    }
    function checkHeat(){
      var cur = C.heat.current(); if(!cur) return;
      if(cur.id === 'trout'){
        var best = -1; for(var w = 0; w <= 15; w++) if(r1(W.osat(S.up + w)) >= TROUT) best = w;
        if(best < 0){ C.heat.body(note('Even with no warm water, a river at ' + S.up + ' °C cannot hold ' + TROUT + ' mg/L. Set it cooler under “?”.', true)); return; }
        if(S.warm === best) C.heat.met('trout', '+' + best + ' °C: at ' + (S.up + best) + ' °C the river can hold ' + F(r1(W.osat(S.up + best))) + ' mg/L, just enough. One degree warmer and it cannot.');
      } else if(cur.id === 'pct'){ var hb = C.heat.el.querySelector('.wp2-pct-hint'); if(hb) hb.textContent = S.warm === 10 ? 'Read both gauges.' : 'Drag the outflow handle to +10 °C first.'; }
    }
    function checkSew(){
      var cur = C.sew.current(); if(!cur) return;
      if(cur.id === 'secondary'){ var hb = C.sew.el.querySelector('.wp2-sec-hint'); if(hb) hb.textContent = S.stage === 2 ? 'Look at the lake below and its graph.' : 'Tap the secondary tank first.'; }
      else if(cur.id === 'fewest'){
        var few = -1; for(var i = 1; i <= 4; i++) if(W.lake(SEW_LEVEL(i), SEW_T).hypoxicDays === 0){ few = i; break; }
        if(S.stage === few) C.sew.met('fewest', 'Three stages: tertiary takes N and P down to ' + W.SEWAGE.stages[few].left.nutrients + '%, and the lake below stays above 2 mg/L. Disinfection kills germs but does not change N and P.');
        else if(S.stage > few) C.sew.body(note('No dead zone, but can you use fewer stages?', true));
        else C.sew.body(note('Still a dead zone below. Add a stage.'));
      }
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
        cSacks.place([G.sx0, G.plat - 2, G.sx1, G.plat - 2]);
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
      var out = [], w = L.x1 - L.x0, o = at(r.O, d), A = at(r.A, d), Dd = at(r.D, d), N = at(r.N, d), Os = r.osat;
      var film = Math.pow(clamp((A - r.A[0]) / 16, 0, 1), 0.85) * 0.95, murk = Math.pow(clamp(1 - o / Math.max(Os, 1), 0, 1), 1.3);
      var top = mixA(P0.top, P0.green, film), mid = mixA(P0.deep, mixA(P0.green, P0.murky, 0.35), film * 0.7), bot = mixA(P0.deep, P0.murky, murk * 0.92);
      out.push('<defs><linearGradient id="' + id + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + mix(top, top, 0) + '"/><stop offset=".42" stop-color="' + mix(mid, mid, 0) + '"/><stop offset=".62" stop-color="' + mix(bot, bot, 0) + '"/><stop offset="1" stop-color="' + mix(bot, P0.murky, murk * 0.4) + '"/></linearGradient></defs>');
      out.push('<g clip-path="url(#' + id + ')">');
      out.push('<rect x="' + n1(L.x0 - 4) + '" y="' + n1(L.surf) + '" width="' + n1(w + 8) + '" height="' + n1(L.bed - L.surf + 12) + '" fill="url(#' + id + 'w)"/>');
      // light from the surface, dimmed by the bloom
      var lo = 0.2 * (1 - film) * (dark() ? 0.55 : 1);
      if(lo > 0.01) for(var k = 0; k < 4; k++){
        var rx = L.x0 + w * (0.22 + k * 0.2) + Math.sin(t * 0.3 + k) * 6, dep = (L.bed - L.surf) * (0.95 - film * 0.5);
        out.push('<path fill="#fff" opacity="' + (lo * (k % 2 ? 0.7 : 1)).toFixed(3) + '" d="M' + n1(rx) + ' ' + n1(L.surf) + ' L' + n1(rx + 26) + ' ' + n1(L.surf) + ' L' + n1(rx + 8 + dep * 0.3) + ' ' + n1(L.surf + dep) + ' L' + n1(rx - 14 + dep * 0.3) + ' ' + n1(L.surf + dep) + 'Z"/>');
      }
      // bubbles of oxygen in the bottom water, fewer as it falls
      var nb = Math.round(clamp(o / 9.5, 0, 1) * 14), span = L.bed - L.mid;
      for(var b = 0; b < nb; b++){
        var p = R_BUB[b], bx = L.x0 + w * (0.2 + 0.72 * p[0]) + Math.sin(t * 1.5 + b) * 3, by = L.bed - 8 - ((t * (8 + p[1] * 8) + p[2] * span) % span);
        out.push('<circle cx="' + n1(bx) + '" cy="' + n1(by) + '" r="' + n1(1.4 + p[3] * 1.6) + '" fill="none" stroke="' + P0.bub + '" stroke-width="1.1"/>');
      }
      // nutrients washed in: orange specks spreading from the shore, taken up by algae
      var entry = sstep(0, 3, d), nn = Math.round(clamp((N - 0.1) / 5, 0, 1) * 26 * entry);
      for(var q = 0; q < nn; q++){
        var pn = R_NUT[q], nx = L.x0 + 8 + pn[0] * w * clamp(0.15 + d / 4, 0, 0.95) + Math.sin(t + q) * 2, ny = L.surf + 4 + pn[1] * (L.mid - L.surf) * 0.9;
        out.push('<circle cx="' + n1(nx) + '" cy="' + n1(ny) + '" r="1.7" fill="' + P0.nut + '" opacity=".95"/>');
      }
      // the dead layer on the bed (dead algae waiting to be decomposed)
      var dl = clamp(Dd / 24, 0, 1.1) * 12;
      if(dl > 0.6){
        var pts = [], i, x;
        for(i = 0; i <= 30; i++){ x = L.x0 + w * (0.1 + 0.9 * i / 30); pts.push([x, bedY(L, x) - 2 - dl * (0.75 + 0.25 * Math.sin(i * 1.7))]); }
        out.push('<path class="wp2-deadl" d="M' + n1(L.x0 + w * 0.1) + ' ' + n1(bedY(L, L.x0 + w * 0.1)) + ' L' + pts.map(function(pp){ return n1(pp[0]) + ' ' + n1(pp[1]); }).join(' L') + ' L' + n1(L.x1 + 2) + ' ' + n1(L.bed + 14) + ' L' + n1(L.x0 + w * 0.1) + ' ' + n1(L.bed + 14) + 'Z"/>');
      }
      // decomposers (aerobic bacteria): more where there is more to eat, faster in warm water
      var fT = Math.pow(1.07, r.T - 20), nd = Math.round(clamp(Dd * fT / 28, 0, 1.25) * 34);
      for(var c = 0; c < nd; c++){
        var pb = R_BAC[c], cx = L.x0 + w * (0.12 + 0.86 * pb[0]) + Math.sin(t * 2.3 + c * 1.7) * 2.5, cy0 = bedY(L, cx) - 4 - dl - pb[1] * (L.bed - L.mid) * 0.45, cy = cy0 + Math.cos(t * 1.9 + c) * 1.5;
        out.push('<rect class="wp2-bac" x="' + n1(cx - 2.6) + '" y="' + n1(cy - 1.1) + '" width="5.2" height="2.2" rx="1.1" transform="rotate(' + Math.round(pb[2] * 180) + ' ' + n1(cx) + ' ' + n1(cy) + ')"/>');
      }
      // plants on the bed, swaying
      R_PLANT.slice(0, Math.round(w / 60)).forEach(function(p, k){
        var px = L.x0 + w * (0.14 + 0.82 * p[0]), py = bedY(L, px) + 1, h = 18 + p[1] * 26, sw = Math.sin(t * 0.9 + k) * 4;
        out.push('<path class="wp2-weed" d="M' + n1(px) + ' ' + n1(py) + ' C' + n1(px - 3) + ' ' + n1(py - h * 0.4) + ' ' + n1(px + 3 + sw * 0.5) + ' ' + n1(py - h * 0.7) + ' ' + n1(px + sw) + ' ' + n1(py - h) + '"/>');
      });
      // algae clumps: grow toward the peak, then die one by one, turn brown, sink and settle
      var alg = P0.alg, bro = P0.brown;
      for(var a = 0; a < r.nA; a++){
        var pa = R_ALG[a % R_ALG.length], ax = L.x0 + 18 + pa[0] * (w - 70), ay0 = L.surf + 3 + pa[1] * pa[1] * (L.mid - L.surf - 8), dd = r.deaths[a], vis, col, ay = ay0, op = 1;
        if(d <= r.peakDay) vis = A >= r.peakA * (a + 0.5) / r.nA;
        else vis = true;
        if(!vis) continue;
        var sinkP = dd != null && d > dd ? clamp((d - dd) / 2.5, 0, 1) : 0, dying = dd != null && d > dd - 0.6 ? clamp((d - dd + 0.6) / 1.2, 0, 1) : 0;
        if(sinkP > 0){ ay = lerp(ay0, bedY(L, ax) - 5 - dl * 0.6 - pa[2] * 4, Math.pow(sinkP, 1.4)); }
        if(sinkP >= 1) op = clamp(Dd / (r.Dmax * 0.45 || 1), 0, 1);
        if(op < 0.05) continue;
        col = mixA(alg, bro, dying);
        var sc = (L.small ? 0.8 : 1) * (0.8 + pa[3] * 0.6), wob = sinkP > 0 && sinkP < 1 ? Math.sin(t * 3 + a) * 2 : Math.sin(t * 0.8 + a) * 1.2;
        var c1 = mix(col, col, 0), c2 = mix(mixA(col, [20, 60, 20], 0.35), col, 0), hi = mix(mixA(P0.algHi, bro, dying), P0.algHi, 0);
        out.push('<g transform="translate(' + n1(ax + wob) + ' ' + n1(ay) + ') rotate(' + Math.round(pa[2] * 360) + ') scale(' + sc.toFixed(2) + ')" opacity="' + op.toFixed(2) + '">' +
          (a % 3 === 0 ? '<path d="M-9 1 C-5 -3 -2 4 2 0 S8 -3 10 1" fill="none" stroke="' + c2 + '" stroke-width="1.6" stroke-linecap="round"/>' : '') +
          '<circle cx="-3.2" cy=".8" r="3.6" fill="' + c2 + '"/><circle cx="2.6" cy="-.6" r="4" fill="' + c1 + '"/><circle cx="0" cy="3" r="3.2" fill="' + c1 + '"/><circle cx="-1.4" cy="-3" r="2.8" fill="' + c1 + '"/>' +
          '<circle cx="1.8" cy="-1.8" r="1.4" fill="' + hi + '" opacity=".85"/><circle cx="-2.6" cy="1.6" r=".9" fill="' + hi + '" opacity=".6"/></g>');
      }
      // fish: spread out while the water is healthy, crowd the surface and gasp when it is low, leave below 2 mg/L
      var fs = fishState(fk, nFish), tDepth, tOut;
      tOut = 1 - sstep(1.4, 2.4, o);
      fs.forEach(function(st, i){
        var rr = R_RAIN[i + 3], base = 0.25 + rr[0] * 0.6;
        tDepth = o >= HEALTHY ? base : o >= 2.6 ? lerp(0.06 + rr[1] * 0.08, base, sstep(2.6, HEALTHY, o)) : 0.04;
        st.td = tDepth; st.to = tOut; if(st.d == null || !looping){ st.d = tDepth; st.o = tOut; }
        var u = t * (0.25 + rr[2] * 0.15) + rr[3] * 6.28, cxF = L.x0 + w * (0.3 + 0.5 * rr[0]), ax2 = w * (0.12 + rr[1] * 0.12);
        var cu = Math.cos(u), out_ = st.o, fx = cxF + ax2 * Math.sin(u) + out_ * (w * 0.75 + 60), dir = out_ > 0.25 ? 1 : (cu >= 0 ? 1 : -1);
        var sx = dir * Math.max(0.28, out_ > 0.25 ? 1 : Math.sqrt(Math.abs(cu)));
        var depthY = L.surf + 10 + st.d * (bedY(L, fx) - L.surf - 26), fy = depthY + Math.sin(t * 1.3 + i * 2) * 2.2;
        var gasp = o < 3.2 && st.d < 0.15;
        var tail = Math.sin(t * (gasp ? 10 : 6.5) + i) * (8 + 8 * Math.abs(cu)), tilt = gasp ? -16 * dir : Math.sin(u * 2) * 3;
        var s = L.small ? 0.62 : (0.75 + rr[2] * 0.25) * (L.fishS || 1);
        if(fx < L.x1 + 30) out.push(fishSvg(fx, fy, s, sx, tail, tilt, 'fish', 1));
        if(gasp && fx < L.x1){ var rp = (t * 0.9 + i * 0.37) % 1; out.push('<ellipse cx="' + n1(fx + 14 * s * dir) + '" cy="' + n1(L.surf + 1) + '" rx="' + n1(3 + rp * 10) + '" ry="' + n1(1 + rp * 2) + '" fill="none" stroke="#fff" stroke-width="1.2" opacity="' + (0.8 * (1 - rp)).toFixed(2) + '"/>'); }
      });
      // the algae mat on the surface
      if(film > 0.05){
        var mp = [], j, th = film * (L.small ? 9 : 14);
        for(j = 0; j <= 36; j++){ var xx = L.x0 + w * (0.02 + 0.98 * j / 36); mp.push(n1(xx) + ' ' + n1(L.surf + 1.5 + th * (0.55 + 0.45 * Math.sin(j * 2.3 + t * 0.5) * Math.sin(j * 0.7)))); }
        out.push('<path fill="' + mix(mixA(P0.alg, P0.green, 0.4), P0.alg, 0) + '" opacity="' + (0.45 + film * 0.5).toFixed(2) + '" d="M' + n1(L.x0) + ' ' + n1(L.surf) + ' L' + mp.join(' L') + ' L' + n1(L.x1 + 2) + ' ' + n1(L.surf) + 'Z"/>');
        for(j = 0; j < Math.round(film * 40); j++){ var sp = R_ALG[(j * 7) % R_ALG.length]; out.push('<circle cx="' + n1(L.x0 + 6 + sp[0] * (w - 10)) + '" cy="' + n1(L.surf + 1.5 + sp[1] * th * 0.8) + '" r="' + n1(1 + sp[2] * 1.5) + '" fill="' + mix(P0.algHi, P0.algHi, 0) + '" opacity=".7"/>'); }
      }
      out.push('</g>');
      // the surface line, with a glint
      out.push('<path class="wp2-surf" d="M' + n1(L.x0) + ' ' + n1(L.surf) + ' H' + n1(L.x1 + 2) + '"/>');
      return out.join('');
    }

    /* --------------------------------------------------- chapter 1: field and lake */
    function geoFert(Wd, H){
      var ph = Wd < 560, g = { W: Wd, H: H, ph: ph };
      g.surf = Math.round(H * (ph ? 0.4 : 0.4));
      g.lakeL = Math.round(Wd * (ph ? 0.44 : 0.36));
      g.bed = H - (ph ? 10 : 14);
      g.plat = g.surf - Math.round(H * (ph ? 0.12 : 0.14));
      g.platR = g.lakeL - Math.round(Wd * (ph ? 0.1 : 0.075));
      g.L = { x0: g.lakeL, x1: Wd, surf: g.surf, bed: g.bed, mid: g.surf + (g.bed - g.surf) * 0.42, fishS: ph ? 1 : 1.35 };
      g.L.basin = lakeBasin(g.lakeL, Wd, g.surf, g.bed, Wd);
      g.sx0 = 14; g.sx1 = g.platR - (ph ? 12 : 22);
      g.thX = Wd - (ph ? 24 : 36); g.thTop = g.surf - Math.round(H * (ph ? 0.2 : 0.2)); g.thBulb = g.surf + Math.round((g.bed - g.surf) * 0.28);
      g.thY10 = g.thBulb - 16; g.thY30 = g.thTop + 8;
      g.slope = [g.platR, g.plat, g.platR + (g.lakeL - g.platR) * 0.55, g.plat, g.lakeL - (g.lakeL - g.platR) * 0.3, g.surf, g.lakeL, g.surf];
      return g;
    }
    function staticFert(g){
      var P0 = g.P, Wd = g.W, H = g.H, s = g.slope, out = '<defs>' + skyAndHills(g, Wd, H) + fishDefs() +
        '<linearGradient id="wpSoil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P0.soil + '"/><stop offset="1" stop-color="' + P0.soil3 + '"/></linearGradient></defs>';
      out += '<rect width="' + Wd + '" height="' + (g.surf + 4) + '" fill="url(#wpSky)"/>';
      var sunX = Wd * (g.ph ? 0.66 : 0.74), sunY = Math.max(26, g.plat * 0.32);
      out += '<circle cx="' + n1(sunX) + '" cy="' + n1(sunY) + '" r="44" fill="url(#wpSun)"/><circle cx="' + n1(sunX) + '" cy="' + n1(sunY) + '" r="15" fill="' + P0.sun + '"/>';
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
      out += '<text class="wp2-lab" x="12" y="' + n1(g.plat + (g.ph ? 68 : 60)) + '">Farm field</text>';
      out += bedArt(g.L, P0);
      return out;
    }
    function sack(x, y, w, P0){
      var h = w * 1.2;
      return '<g class="wp2-sack" transform="translate(' + n1(x) + ' ' + n1(y) + ')"><path d="M' + n1(-w / 2) + ' 0 C' + n1(-w / 2 - 1) + ' ' + n1(-h * 0.6) + ' ' + n1(-w * 0.42) + ' ' + n1(-h * 0.9) + ' ' + n1(-w * 0.2) + ' ' + n1(-h) +
        ' L' + n1(w * 0.2) + ' ' + n1(-h) + ' C' + n1(w * 0.42) + ' ' + n1(-h * 0.9) + ' ' + n1(w / 2 + 1) + ' ' + n1(-h * 0.6) + ' ' + n1(w / 2) + ' 0Z"/>' +
        '<rect class="wp2-sack-b" x="' + n1(-w / 2 + 1.5) + '" y="' + n1(-h * 0.58) + '" width="' + n1(w - 3) + '" height="' + n1(h * 0.24) + '"/>' +
        '<path class="wp2-sack-t" d="M' + n1(-w * 0.22) + ' ' + n1(-h) + ' l' + n1(w * 0.22) + ' ' + n1(-3) + ' l' + n1(w * 0.22) + ' 3"/></g>';
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
      // the sacks, left of the knob
      var span = g.sx1 - g.sx0, sw = Math.min(g.ph ? 15 : 24, span / 5 * 0.6);
      for(var i = 0; i < S.sacks; i++) out.push(sack(g.sx0 + span * (i + 0.4) / 5, g.plat - 1, sw, P0));
      // runoff stream down the slope
      var ro = S.sacks > 0 ? sstep(0, 0.6, d) * (1 - sstep(4.5, 7, d)) : 0;
      if(ro > 0.02){
        var path = 'M' + n1(s[0] - 6) + ' ' + n1(s[1] + 1) + ' C' + n1(s[2]) + ' ' + n1(s[3] + 1) + ' ' + n1(s[4]) + ' ' + n1(s[5] + 1) + ' ' + n1(s[6] + 6) + ' ' + n1(s[7] + 2);
        out.push('<path d="' + path + '" fill="none" stroke="' + P0.soil2 + '" stroke-width="' + n1(3 + S.sacks * 1.6) + '" stroke-linecap="round" opacity="' + (0.85 * ro).toFixed(2) + '"/>');
        out.push('<path d="' + path + '" fill="none" stroke="' + P0.nut + '" stroke-width="' + n1(1.5 + S.sacks * 0.7) + '" stroke-linecap="round" stroke-dasharray="3 6" stroke-dashoffset="' + n1(-t * 30) + '" opacity="' + ro.toFixed(2) + '"/>');
      }
      out.push(lakeDyn(g.L, run, d, t, P0, 'wpLk1', 'f1', g.ph ? 3 : 5));
      // the lake thermometer (the knob sets it)
      var tf = (S.tLake - 10) / 20, ty = lerp(g.thY10, g.thY30, tf);
      out.push('<g class="wp2-thermo"><rect x="' + n1(g.thX - 5) + '" y="' + n1(g.thTop) + '" width="10" height="' + n1(g.thBulb - g.thTop) + '" rx="5"/><circle cx="' + n1(g.thX) + '" cy="' + n1(g.thBulb) + '" r="9"/>' +
        '<rect class="wp2-thermo-c" x="' + n1(g.thX - 2.2) + '" y="' + n1(ty) + '" width="4.4" height="' + n1(g.thBulb - ty) + '"/><circle class="wp2-thermo-c" cx="' + n1(g.thX) + '" cy="' + n1(g.thBulb) + '" r="6.4"/></g>');
      // labels: the bottom water's oxygen, and the step the day is in, where it happens
      var o = oNow(), st = status(o), L = g.L, cx2 = L.x0 + (L.x1 - L.x0) * (g.ph ? 0.58 : 0.46);
      var chipX = L.x0 + (L.x1 - L.x0) * (g.ph ? 0.12 : 0.13), chipY = L.mid + (g.ph ? 6 : 26);
      out.push(chip(chipX, chipY, 'Bottom water', F(o) + ' mg/L', st.tone, g.ph));
      var cur = W.stageAt(run, d), rec = S.sacks > 0 && cur >= 4 && d > run.minDay + 2 && o > run.min + 1.2;
      if(S.sacks > 0 && d > 0){
        var lab = rec ? 'Oxygen comes back from the air' : ['Runoff carries nutrients in', 'Algae bloom', 'Algae die and sink', 'Decomposers use oxygen', 'Oxygen drops', 'Dead zone'][cur];
        var pos = rec ? [cx2, L.mid - 10] : [[L.x0 + 16, L.surf - 12, 'start'], [cx2, L.surf + (L.mid - L.surf) * 0.55], [cx2, L.mid - 6], [cx2, L.bed - 34], [cx2, L.bed - 40], [cx2, L.mid + (L.bed - L.mid) * (g.ph ? 0.7 : 0.5)]][cur];
        if(lab) out.push(callout(pos[0], pos[1], lab, cur === 5 && !rec ? 'bad' : '', pos[2] || 'middle', g.ph));
      }
      return out.join('');
    }
    function chip(x, y, k, v, tone, ph){
      var w = ph ? 92 : 108, h = ph ? 36 : 40;
      return '<g class="wp2-chip"><rect x="' + n1(x) + '" y="' + n1(y - h / 2) + '" width="' + w + '" height="' + h + '" rx="9"/>' +
        '<text class="wp2-chip-k" x="' + n1(x + 9) + '" y="' + n1(y - h / 2 + (ph ? 14 : 15)) + '">' + esc(k) + '</text>' +
        '<text class="wp2-chip-v' + (tone === 'bad' ? ' is-bad' : '') + '" x="' + n1(x + 9) + '" y="' + n1(y + h / 2 - (ph ? 7 : 8)) + '">' + esc(v) + '</text></g>';
    }
    function callout(x, y, text, tone, anchor, ph){
      return '<text class="wp2-call' + (tone ? ' is-' + tone : '') + (ph ? ' is-ph' : '') + '" x="' + n1(x) + '" y="' + n1(y) + '" text-anchor="' + anchor + '">' + esc(text) + '</text>';
    }

    /* --------------------------------------------------- chapter 2: a power plant on a trout river */
    function geoHeat(Wd, H){
      var ph = Wd < 560, g = { W: Wd, H: H, ph: ph };
      g.hor = Math.round(H * (ph ? 0.24 : 0.26)); g.surf = Math.round(H * (ph ? 0.6 : 0.58)); g.bed = H - (ph ? 8 : 12); g.bank = g.surf - (ph ? 8 : 12);
      g.pcx = Math.round(Wd * (ph ? 0.47 : 0.46)); g.bw = Math.round(Wd * (ph ? 0.2 : 0.13)); g.bh = Math.round(H * (ph ? 0.13 : 0.16));
      g.bx0 = g.pcx - g.bw / 2; g.bx1 = g.pcx + g.bw / 2; g.btop = g.bank - g.bh;
      g.pipeX = g.bx1 + Math.round(Wd * (ph ? 0.05 : 0.03)); g.pipeY = g.btop + g.bh * 0.45;
      g.vX = g.pipeX + (ph ? 18 : 24); g.vY0 = g.bank - 4; g.vY1 = Math.max(g.hor - 10, g.bank - Math.min(ph ? 96 : 130, H * 0.34));
      g.pw = ph ? 104 : 136; g.pH = ph ? 92 : 104;
      g.up = { x0: 0, x1: g.bx0 - (ph ? 26 : 50), inst: Math.round(ph ? 8 + g.pw / 2 : Wd * 0.14) };
      g.dn = { x0: g.pipeX + 12, x1: Wd, inst: Math.round(ph ? Wd - 8 - g.pw / 2 : Wd * 0.84) };
      return g;
    }
    function staticHeat(g){
      var P0 = g.P, Wd = g.W, H = g.H, out = '<defs>' + skyAndHills(g, Wd, H) + fishDefs() +
        '<linearGradient id="wpBank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P0.near + '"/><stop offset="1" stop-color="' + P0.grass2 + '"/></linearGradient>' +
        '<linearGradient id="wpRiv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + mix(P0.top, P0.top, 0) + '"/><stop offset="1" stop-color="' + mix(P0.deep, P0.deep, 0) + '"/></linearGradient></defs>';
      out += '<rect width="' + Wd + '" height="' + (g.hor + 4) + '" fill="url(#wpSky)"/>';
      out += '<circle cx="' + n1(Wd * 0.9) + '" cy="30" r="40" fill="url(#wpSun)"/><circle cx="' + n1(Wd * 0.9) + '" cy="30" r="13" fill="' + P0.sun + '"/>';
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
      out += '<text class="wp2-lab" x="' + n1(g.pcx) + '" y="' + n1(g.btop - 8) + '" text-anchor="middle">Power plant</text>';
      var ix = g.bx0 + g.bw * 0.2;
      out += '<path class="wp2-pipe" d="M' + n1(ix) + ' ' + n1(g.bank - 2) + ' V' + n1(g.surf + 18) + '"/>';
      out += '<path class="wp2-pipe is-warm" d="M' + n1(g.bx1) + ' ' + n1(g.pipeY) + ' H' + n1(g.pipeX) + ' V' + n1(g.surf + 10) + '"/>';
      // the handle's scale beside the outflow pipe: +0 to +15 °C
      out += '<rect class="wp2-vscale" x="' + n1(g.vX - 4) + '" y="' + n1(g.vY1) + '" width="8" height="' + n1(g.vY0 - g.vY1) + '" rx="4"/>';
      [0, 5, 10, 15].forEach(function(v){ var y = lerp(g.vY0, g.vY1, v / 15); out += '<path class="wp2-tick" d="M' + n1(g.vX - 11) + ' ' + n1(y) + ' h5"/>'; });
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
      var pw = g.pw, ph_ = g.pH, x0 = x - pw / 2, y0 = g.ph ? 8 : Math.max(g.hor + 6, g.bank - ph_ - 10), out = '', gx0 = x0 + 12, gx1 = x0 + pw - 12, gy = y0 + ph_ - 36;
      var gv = function(v){ return gx0 + (gx1 - gx0) * clamp(v / 14, 0, 1); };
      out += '<path class="wp2-post" d="M' + n1(x) + ' ' + n1(y0 + ph_) + ' V' + n1(g.bed - 6) + '"/><circle class="wp2-probe" cx="' + n1(x) + '" cy="' + n1(g.bed - 10) + '" r="4"/>';
      out += '<rect class="wp2-panel' + (cap < TROUT ? ' is-low' : '') + '" x="' + n1(x0) + '" y="' + n1(y0) + '" width="' + pw + '" height="' + ph_ + '" rx="12"/>';
      out += '<text class="wp2-pk" x="' + n1(x0 + 12) + '" y="' + n1(y0 + 18) + '">' + esc(name) + '</text>';
      // thermometer glyph and the temperature
      var tx = x0 + 17, tt = y0 + 24, tb = y0 + 41;
      out += '<rect class="wp2-tg" x="' + n1(tx - 3.5) + '" y="' + n1(tt) + '" width="7" height="' + n1(tb - tt) + '" rx="3.5"/><circle class="wp2-tg" cx="' + n1(tx) + '" cy="' + n1(tb) + '" r="5.5"/>' +
        '<rect class="wp2-thermo-c' + (warm ? ' is-warm' : '') + '" x="' + n1(tx - 1.5) + '" y="' + n1(lerp(tb, tt + 2, clamp(tC / 35, 0, 1))) + '" width="3" height="' + n1(tb - lerp(tb, tt + 2, clamp(tC / 35, 0, 1))) + '"/><circle class="wp2-thermo-c' + (warm ? ' is-warm' : '') + '" cx="' + n1(tx) + '" cy="' + n1(tb) + '" r="3.6"/>';
      out += '<text class="wp2-pv is-heat" x="' + n1(x0 + 30) + '" y="' + n1(y0 + 41) + '">' + tC + ' °C</text>';
      // oxygen bar, the trout line and the value
      out += '<rect class="wp2-gbar" x="' + n1(gx0) + '" y="' + n1(gy) + '" width="' + n1(gx1 - gx0) + '" height="9" rx="4.5"/>';
      out += '<rect class="wp2-gbar-f' + (cap < TROUT ? ' is-low' : '') + '" x="' + n1(gx0) + '" y="' + n1(gy) + '" width="' + n1(gv(cap) - gx0) + '" height="9" rx="4.5"/>';
      out += '<path class="wp2-troutl" d="M' + n1(gv(TROUT)) + ' ' + n1(gy - 4) + ' V' + n1(gy + 13) + '"/>' + fishSvg(gv(TROUT) + 9, gy - 7, 0.3, 1, 0, 0, 'trout', 1);
      out += '<text class="wp2-pv is-oxy' + (cap < TROUT ? ' is-bad' : '') + '" x="' + n1(gx0) + '" y="' + n1(gy + 27) + '">' + F(cap) + ' mg/L</text>';
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
      out += '<text class="wp2-lab" x="' + n1(hx + (g.ph ? 92 : 128)) + '" y="' + n1(hy - 6) + '">Town</text>';
      // sewer from the town down to the plant
      var raw = g.tanks[0];
      out += '<path class="wp2-pipe is-sew" d="M' + n1(hx + 40) + ' ' + n1(hy) + ' V' + n1(g.pipeY - (g.ph ? 16 : 22)) + ' H' + n1(raw.x + raw.w * 0.5) + ' V' + n1(raw.y + 4) + '"/>';
      // the lake below: water and bed (its life is drawn each frame)
      out += lakeStatic(g.lake, P0, 'wpLk3') + bedArt(g.lake, P0);
      out += '<text class="wp2-lab" x="' + n1(g.lake.x0 + (g.lake.x1 - g.lake.x0) * 0.55) + '" y="' + n1(g.lake.surf - 10) + '" text-anchor="middle">Lake below</text>';
      return out;
    }
    /* One tank in cutaway; on: used; i: 0 raw inflow, 1 primary, 2 secondary, 3 tertiary, 4 disinfection. */
    function tankArt(tk, i, on, t, P0, ph){
      var out = [], x0 = tk.x, x1 = tk.x + tk.w, y0 = tk.y, y1 = tk.y + tk.h, wl = y0 + tk.h * 0.16, cx = (x0 + x1) / 2, ww = x1 - x0;
      var lf = i ? W.SEWAGE.stages[i].left : W.SEWAGE.stages[0].left, dirt = clamp((lf.solids * 0.5 + lf.bod * 0.5) / 100, 0, 1);
      var water = mixA(P0.top, P0.murky, dirt * 0.9);
      out.push('<g class="wp2-tank' + (on ? '' : ' is-off') + '">');
      out.push('<rect class="wp2-tank-in" x="' + n1(x0) + '" y="' + n1(y0) + '" width="' + n1(ww) + '" height="' + n1(tk.h) + '" rx="4"/>');
      out.push('<rect x="' + n1(x0 + 3) + '" y="' + n1(wl) + '" width="' + n1(ww - 6) + '" height="' + n1(y1 - wl - 3) + '" fill="' + mix(water, water, 0) + '"/>');
      var mv = on && looping ? t : 0;
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
      if(i) out.push('<text class="wp2-tdoes' + (on ? '' : ' is-off') + '" x="' + n1(cx) + '" y="' + n1(y1 + (ph ? 30 : 34)) + '" text-anchor="middle">' + esc(ph ? ['', 'solids', 'organic', 'N and P', 'germs'][i] : SEW_DOES[i]) + '</text>');
      return out.join('');
    }
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
      out.push(lakeDyn(L, sew, S.sday, t, P0, 'wpLk3', 's3', 3));
      var o = at(sew.O, S.sday), st = status(o);
      out.push(chip(L.x0 + (L.x1 - L.x0) * (g.ph ? 0.32 : 0.22), L.mid + (g.ph ? 20 : 26), 'Day ' + S.sday + ', bottom', F(o) + ' mg/L', st.tone, g.ph));
      return out.join('');
    }

    /* ======================================================= the graph (shares the cursor with the scene) */
    function graph(){
      if(!GG) return;
      var Wg = GG.W, Hg = GG.H, ph = Wg < 560, L = ph ? 34 : 46, R = Wg - (ph ? 12 : 22), top = ph ? 56 : 60, bot = Hg - (ph ? 30 : 32), out = [];
      function ln(x1, y1, x2, y2, cls){ return '<line class="' + cls + '" x1="' + n1(x1) + '" y1="' + n1(y1) + '" x2="' + n1(x2) + '" y2="' + n1(y2) + '"/>'; }
      function tx(x, y, s, cls, a){ return '<text class="' + cls + '" x="' + n1(x) + '" y="' + n1(y) + '"' + (a ? ' text-anchor="' + a + '"' : '') + '>' + s + '</text>'; }
      if(S.ch === 'fert' || S.ch === 'sew'){
        var r = S.ch === 'fert' ? run : sew, seen = S.ch === 'fert' ? S.seen : W.LAKE_DAYS, cur = S.ch === 'fert' ? S.day : S.sday;
        var yMax = Math.ceil(r.osat) + 1, x = function(d){ return L + d / W.LAKE_DAYS * (R - L); }, y = function(v){ return bot - v / yMax * (bot - top); }, ya = function(v){ return bot - clamp(v / 45, 0, 1) * (bot - top) * 0.9; };
        out.push('<rect class="wp2-g-hyp" x="' + n1(L) + '" y="' + n1(y(2)) + '" width="' + n1(R - L) + '" height="' + n1(bot - y(2)) + '"/>');
        for(var v = 0; v <= yMax; v += yMax > 12 ? 4 : 2) out.push(ln(L, y(v), R, y(v), 'wp2-g-grid') + tx(L - 6, y(v) + 4, v, 'wp2-g-tk', 'end'));
        for(var dd = 0; dd <= 60; dd += 10) out.push(tx(x(dd), bot + 15, dd, 'wp2-g-tk', 'middle'));
        out.push(tx(R, bot + (ph ? 28 : 29), 'Day', 'wp2-g-ax', 'end'));
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
        out.push(ln(L, y(r.osat), R, y(r.osat), 'wp2-g-sat'));
        out.push(tx(R - 4, y(r.osat) - 5, 'Most it can hold: ' + F(r.osat), 'wp2-g-satt', 'end'));
        out.push(tx(R - 4, y(2) - 5, '2 mg/L: dead zone below', 'wp2-g-hypt', 'end'));
        out.push(ln(L, bot, R, bot, 'wp2-g-axis') + ln(L, top, L, bot, 'wp2-g-axis'));
        // the cursor's values (the cursor line is the kit's)
        if(cur <= seen + 1e-9){
          var ov = at(r.O, cur), cx = x(cur), cy = y(ov), right = cx < R - 120, below = cx > R - 190 || cy - 8 < top + 14;
          out.push('<circle class="wp2-g-dot" cx="' + n1(cx) + '" cy="' + n1(cy) + '" r="5"/><circle class="wp2-g-adot" cx="' + n1(cx) + '" cy="' + n1(ya(at(r.A, cur))) + '" r="4"/>');
          out.push('<text class="wp2-g-val' + (ov < 2 ? ' is-bad' : '') + '" x="' + n1(cx + (right ? 9 : -9)) + '" y="' + n1(clamp(below ? cy + 20 : cy - 8, top + 12, bot - 6)) + '" text-anchor="' + (right ? 'start' : 'end') + '">' + F(ov) + ' mg/L</text>');
        }
        out.push(tx(L, ph ? 14 : 16, (S.ch === 'sew' ? 'Lake below: ' : '') + 'Bottom oxygen (mg/L)', 'wp2-g-ax is-oxy'));
        out.push('<rect class="wp2-g-alg" x="' + n1(R - (ph ? 112 : 132)) + '" y="' + n1(ph ? 5 : 7) + '" width="14" height="10" rx="2"/>' + tx(R, ph ? 14 : 16, 'Algae (relative)', 'wp2-g-ax is-alg', 'end'));
        scrub.place([L, top, R, bot], 0, W.LAKE_DAYS); scrub.value(Math.round(cur));
        gsvg.setAttribute('aria-label', (S.ch === 'sew' ? 'Lake below the plant: ' : '') + 'bottom-water oxygen over 60 days, with the algae shaded and a line at 2 mg/L.' + (sv ? ' Lowest so far ' + F(Math.min.apply(null, r.O.slice(0, sv + 1))) + ' mg/L.' : ' Not run yet.'));
      } else {
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
        (c === 'sew' ? '<li>What each treatment stage leaves: typical rounded values from EPA, “How wastewater treatment plants work”. Real plants vary.</li>' : '') + '</ul>';
      if(c === 'fert'){
        var rows = [0, 5, 10, 15, 20, 30, 40, 50, 60].map(function(d){ return '<tr' + (Math.round(S.day) === d ? ' class="hl"' : '') + '><th scope="row">' + d + '</th><td class="r">' + F(run.N[d], 2) + '</td><td class="r">' + F(run.A[d]) + '</td><td class="r">' + F(run.D[d]) + '</td><td class="r">' + F(run.O[d]) + '</td></tr>'; }).join('');
        h = '<h3 class="ls-title-l">How the lake works</h3>' +
          '<p>A small model of one lake after one storm washes fertilizer in, solved day by day: nutrients feed algae; algae that run out of nutrients die and sink; aerobic decomposers break the dead algae down and use oxygen; oxygen from the air mixes back in toward the most the water can hold. It shows the order and the shape of the chain. It is a teaching model, not a forecast for a real lake.</p>' +
          '<p><b>The chain.</b></p><ol class="wp2-chain">' + STEPS.map(function(s, i){ return '<li><b>' + esc(s.name) + '.</b> ' + esc(STEP_LONG[i]) + '</li>'; }).join('') + '</ol>' +
          '<p><b>Why the oxygen falls late.</b> Living algae make oxygen. The drop comes after they die, when bacteria decompose them on the bottom, and the bottom water mixes little with the air.</p>' +
          '<p><b>Warm lakes suffer more.</b> At ' + S.tLake + ' °C water holds at most ' + F(run.osat) + ' mg/L, and decomposers work faster when it is warm.</p>' +
          '<p><b>Do not mix up.</b> Fertilizers (nitrate, phosphate) cause eutrophication; pesticides are a different pollutant. Thermal pollution is heat (chapter 2).</p>' +
          '<h3 class="ls-title-l">The lake, day by day</h3><p class="bt-small">' + S.sacks + (S.sacks === 1 ? ' sack' : ' sacks') + ', lake at ' + S.tLake + ' °C. Nutrients, algae and dead algae in relative units; oxygen in mg/L.</p>' +
          '<div class="table-wrap" tabindex="0" role="region" aria-label="Lake model by day"><table class="ls-tbl"><thead><tr><th scope="col">Day</th><th scope="col">Nutrients</th><th scope="col">Algae</th><th scope="col">Dead algae</th><th scope="col">Bottom oxygen</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '<p class="bt-small">Lowest bottom oxygen ' + F(run.min) + ' mg/L on day ' + run.minDay + '. Days below 2 mg/L: ' + run.hypoxicDays + '.</p>' + src;
      } else if(c === 'heat'){
        var hp = heatPts();
        h = '<h3 class="ls-title-l">How the river works</h3>' +
          '<p><b>Heat, not chemicals.</b> A power plant takes in river water to cool its machines and returns it warmer. Nothing else is added.</p>' +
          '<p><b>Warm water holds less gas.</b> The curve is the most oxygen fresh water can hold at each temperature (saturation). Real rivers often hold less than that, never more.</p>' +
          '<p><b>Fish are hit twice.</b> Fish are ectotherms: warm water speeds up their metabolism, so they need more oxygen just as the water holds less. Some species cannot survive above a temperature (thermal shock).</p>' +
          '<p><b>Trout here.</b> A trout is shown able to breed where the water can hold at least ' + TROUT + ' mg/L (read to 0.1 mg/L). If even oxygen-full water cannot hold that, trout move to cooler water.</p>' +
          '<h3 class="ls-title-l wp2-set-h">Settings</h3>' +
          '<h3 class="ls-title-l">Oxygen fresh water can hold (USGS, sea level)</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Oxygen saturation by temperature"><table class="ls-tbl"><thead><tr><th scope="col">Temperature</th><th scope="col">Most it can hold</th></tr></thead><tbody>' +
          W.OSAT.map(function(p){ return '<tr><th scope="row">' + p[0] + ' °C</th><td class="r">' + F(p[1]) + ' mg/L</td></tr>'; }).join('') + '</tbody></table></div>' +
          '<p class="bt-small">Between rows the tool reads the curve by straight lines. ' + hp.t0 + ' °C to ' + hp.t1 + ' °C: (' + F(hp.d1) + ' − ' + F(hp.d0) + ') / ' + F(hp.d0) + ' × 100 = ' + T.F(M.Calc().percentChange(hp.d0, hp.d1), 1) + '%.</p>' + src;
      } else {
        h = '<h3 class="ls-title-l">How the plant works</h3>' +
          '<p><b>Why treat sewage?</b> Raw sewage carries solids, organic matter (decomposing it uses oxygen, which is what BOD measures), nitrogen and phosphorus that feed algae, and pathogens.</p>' +
          '<p>' + W.SEWAGE.stages.slice(1).map(function(s){ return '<b>' + esc(s.name) + '.</b> ' + esc(s.how); }).join(' ') + '</p>' +
          '<p><b>The lake below.</b> It runs the chapter 1 lake model at ' + SEW_T + ' °C with the nitrogen and phosphorus left after the last stage, scaled so raw sewage counts as the heaviest fertilizer level (5 sacks): ' + W.SEWAGE.stages.map(function(s, i){ return esc(SEW_NAMES[i].toLowerCase()) + ' ' + s.left.nutrients + '% left, level ' + F(SEW_LEVEL(i), 2); }).join('; ') + '. This scaling is a teaching choice, not a measurement.</p>' +
          '<p><b>Each stage removes a share of what is left,</b> so percentages multiply.</p>' +
          '<h3 class="ls-title-l">Share of the raw load still in the water</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Sewage treatment by stage"><table class="ls-tbl"><thead><tr><th scope="col">After</th>' + W.SEWAGE.parts.map(function(p){ return '<th scope="col">' + esc(p.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          W.SEWAGE.stages.map(function(s, i){ return '<tr' + (i === S.stage ? ' class="hl"' : '') + '><th scope="row">' + esc(s.name) + '</th>' + W.SEWAGE.parts.map(function(p){ return '<td class="r">' + (s.left[p.k] < 1 ? s.left[p.k] : Math.round(s.left[p.k])) + '%</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' + src;
      }
      h += '<p class="bt-small wp2-reset"><button type="button" class="tk2-link" data-wp-reset>Start this chapter’s challenges again</button></p>';
      ref.innerHTML = h;
      if(c === 'heat'){ var hs = ref.querySelector('.wp2-set-h'); if(hs) hs.parentNode.insertBefore(setBox, hs.nextSibling); }
      else if(setBox.parentNode) setBox.parentNode.removeChild(setBox);
    }
    ref.addEventListener('click', function(e){ if(e.target.closest('[data-wp-reset]')){ C[S.ch].reset(); if(LS) LS.close(); } });

    /* ======================================================= placing it in the studio */
    function studio(pane, s){
      LS = s;
      K.on(s);
      if(s.detailsTitle) s.detailsTitle('How it works');
      s.add('stage', stage, { mode: 'explore' });
      s.add('dock', panel, { mode: 'explore' });
      s.add('details', ref, { mode: 'explore' });
      var ab = pane.querySelector('details.tool-about, .tool-about'); if(ab) s.add('about', ab, { mode: 'explore' });
      syncCh(); layoutNow();
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(layoutNow, 50); }).observe(sceneBox); new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(layoutNow, 50); }).observe(graphBox); }
      try{ new MutationObserver(function(){ layoutNow(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
      loop(true);
    }
    syncCh(); words(); refHtml();
    return {
      studio: studio,
      shown: function(on){ visible = on; if(!on) player.stop(); loop(on); if(on) setTimeout(layoutNow, 30); }
    };
  }
  /* One stage of the plant drawn as a real open tank seen in cutaway:
     concrete walls, water whose color is that stage's outflow (brown with
     solids and organic matter, clear once treated), and its working part:
     0 a bar screen catching trash, 1 a settling tank with sludge in its
     hopper, 2 an aeration tank with air diffusers and bacteria, 3 a sand and
     gravel filter, 4 a UV channel with lamps. q: what is left (% of raw). */
  function tank(i, x, y, w, h, on, q, quiet){   // quiet (pass 2): no inner name, only the tank in focus is named
    q = q || W.SEWAGE.stages[i].left;
    var g = [], cx = x + w / 2, wl = y + h * 0.2, x0 = x + 4, x1 = x + w - 4, yb = y + h - 4, dirt = Math.min(1, (q.solids * 0.5 + q.bod * 0.5) / 100);
    var dk = document.documentElement.getAttribute('data-theme') === 'dark';
    var c0 = dk ? [40, 96, 130] : [150, 202, 230], c1 = dk ? [92, 72, 48] : [150, 116, 72];
    var col = 'rgb(' + [0, 1, 2].map(function(k){ return Math.round(c0[k] + (c1[k] - c0[k]) * dirt); }).join(',') + ')';
    function n(v){ return (+v).toFixed(1); }
    g.push('<rect class="wp-tankair" x="' + n(x0) + '" y="' + n(y) + '" width="' + n(x1 - x0) + '" height="' + n(yb - y) + '"/>');
    g.push('<rect class="wp-water" style="fill:' + col + '" x="' + n(x0) + '" y="' + n(wl) + '" width="' + n(x1 - x0) + '" height="' + n(yb - wl) + '"/>');
    g.push('<path class="wp-wave" d="M' + n(x0) + ' ' + n(wl) + ' q' + n((x1 - x0) / 8) + ' -3 ' + n((x1 - x0) / 4) + ' 0 t' + n((x1 - x0) / 4) + ' 0 t' + n((x1 - x0) / 4) + ' 0 t' + n((x1 - x0) / 4) + ' 0"/>');
    if(i === 0){
      var sx = x0 + (x1 - x0) * 0.62;
      for(var k = 0; k < 6; k++) g.push('<line class="wp-bar-s" x1="' + n(sx + k * 3.2) + '" y1="' + n(y + 2) + '" x2="' + n(sx + k * 3.2 - 6) + '" y2="' + n(yb) + '"/>');
      for(var t = 0; t < 7; t++) g.push('<rect class="wp-trash" x="' + n(sx - 8 - (t * 7 % 26)) + '" y="' + n(wl + 6 + (t * 11 % (yb - wl - 14))) + '" width="' + (5 + t % 3 * 2) + '" height="' + (3 + t % 2 * 2) + '" rx="1" transform="rotate(' + (t * 37 % 60 - 30) + ' ' + n(sx - 6 - (t * 7 % 26)) + ' ' + n(wl + 8 + (t * 11 % (yb - wl - 14))) + ')"/>');
      for(var k2 = 0; k2 < 5; k2++) g.push('<circle class="wp-solid" cx="' + n(x0 + 6 + (k2 * 13 % Math.max(8, sx - x0 - 30))) + '" cy="' + n(wl + 10 + (k2 * 17 % (yb - wl - 16))) + '" r="' + (1.6 + k2 % 3) + '"/>');
      if(w > 60 && !quiet) g.push('<text class="wp-tk wp-in2" x="' + n(sx - 4) + '" y="' + n(y + 12) + '" text-anchor="end">screen</text>');
    } else if(i === 1){
      g.push('<path class="wp-sludge" d="M' + n(x0) + ' ' + n(yb - h * 0.16) + ' L' + n(cx) + ' ' + n(yb) + ' L' + n(x1) + ' ' + n(yb - h * 0.16) + ' L' + n(x1) + ' ' + n(yb) + ' L' + n(x0) + ' ' + n(yb) + 'Z"/>');
      g.push('<path class="wp-sludge2" d="M' + n(x0 + 6) + ' ' + n(yb - h * 0.12) + ' Q' + n(cx) + ' ' + n(yb - h * 0.2) + ' ' + n(x1 - 6) + ' ' + n(yb - h * 0.12) + ' L' + n(cx) + ' ' + n(yb - 2) + 'Z"/>');
      for(var a2 = 0; a2 < 3; a2++){ var ax = x0 + (x1 - x0) * (0.25 + a2 * 0.25); g.push('<circle class="wp-solid" cx="' + n(ax) + '" cy="' + n(wl + 10 + a2 * 6) + '" r="2.4"/><path class="wp-arrowdn" d="M' + n(ax) + ' ' + n(wl + 16 + a2 * 6) + ' v' + n(Math.max(8, h * 0.3)) + ' m-3.5 -5 l3.5 5 l3.5 -5"/>'); }
      if(w > 60 && !quiet) g.push('<text class="wp-tk wp-in2" x="' + n(cx) + '" y="' + n(yb - h * 0.2 - 4) + '" text-anchor="middle">sludge</text>');
    } else if(i === 2){
      g.push('<line class="wp-diffuser" x1="' + n(x0 + 4) + '" y1="' + n(yb - 6) + '" x2="' + n(x1 - 4) + '" y2="' + n(yb - 6) + '"/>');
      for(var c = 0; c < 4; c++){ var bx = x0 + (x1 - x0) * (0.15 + c * 0.23); for(var b = 0; b < 5; b++) g.push('<circle class="wp-bubble" cx="' + n(bx + (b % 2 ? 2.5 : -2.5)) + '" cy="' + n(yb - 12 - b * (yb - wl - 16) / 5) + '" r="' + (1.6 + (b + c) % 3 * 0.8) + '"/>'); }
      for(var r = 0; r < 5; r++) g.push('<rect class="wp-bac" x="' + n(x0 + 8 + (r * 29 % Math.max(10, x1 - x0 - 18))) + '" y="' + n(wl + 10 + (r * 23 % Math.max(10, yb - wl - 26))) + '" width="6" height="2.6" rx="1.3"/>');
      if(w > 60 && !quiet) g.push('<text class="wp-tk wp-in2" x="' + n(cx) + '" y="' + n(yb - 12) + '" text-anchor="middle">air in</text>');
    } else if(i === 3){
      var fT = wl + (yb - wl) * 0.4, fM = wl + (yb - wl) * 0.72;
      g.push('<rect class="wp-sand" x="' + n(x0) + '" y="' + n(fT) + '" width="' + n(x1 - x0) + '" height="' + n(fM - fT) + '"/><rect class="wp-gravel" x="' + n(x0) + '" y="' + n(fM) + '" width="' + n(x1 - x0) + '" height="' + n(yb - fM) + '"/>');
      for(var d = 0; d < 14; d++) g.push('<circle class="wp-grain" cx="' + n(x0 + 4 + (d * 17 % Math.max(8, x1 - x0 - 8))) + '" cy="' + n(fM + 4 + (d * 7 % Math.max(4, yb - fM - 7))) + '" r="' + (1.8 + d % 3 * 0.7) + '"/>');
      for(var e = 0; e < 3; e++){ var ex = x0 + (x1 - x0) * (0.25 + e * 0.25); g.push('<path class="wp-drip" d="M' + n(ex) + ' ' + n(wl + 6) + ' v' + n(fT - wl - 10) + ' m-3 -4 l3 4 l3 -4"/>'); }
      if(w > 60 && !quiet) g.push('<text class="wp-tk wp-in2" x="' + n(cx) + '" y="' + n(fT + 12) + '" text-anchor="middle">sand filter</text>');
    } else if(i === 4){
      for(var u = 0; u < 3; u++){ var uy = wl + (yb - wl) * (0.25 + u * 0.27); g.push('<rect class="wp-uv" x="' + n(x0 + 6) + '" y="' + n(uy - 3) + '" width="' + n(x1 - x0 - 12) + '" height="6" rx="3"/>'); for(var v = 0; v < 4; v++){ var vx = x0 + 12 + v * (x1 - x0 - 24) / 3; g.push('<line class="wp-uvr" x1="' + n(vx) + '" x2="' + n(vx) + '" y1="' + n(uy - 5) + '" y2="' + n(uy - 10) + '"/><line class="wp-uvr" x1="' + n(vx) + '" x2="' + n(vx) + '" y1="' + n(uy + 5) + '" y2="' + n(uy + 10) + '"/>'); } }
      if(w > 60 && !quiet) g.push('<text class="wp-tk wp-in2" x="' + n(cx) + '" y="' + n(y + 12) + '" text-anchor="middle">UV lamps</text>');
    }
    g.push('<path class="wp-wall" d="M' + n(x + 2) + ' ' + n(y) + ' V' + n(y + h - 2) + ' H' + n(x + w - 2) + ' V' + n(y) + '"/>');
    return '<g class="wp-tank' + (on ? ' is-on' : ' is-off') + '">' + g.join('') + '</g>';
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
  /* The drill's figure, drawn from the problem's own numbers; a value is
     written on it only once its step is answered, so it never gives a key
     away. */
  function figure(el, p, st){
    st = st || {};
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    var phone = (window.innerWidth || 1280) <= 640, Wd = phone ? 340 : 600, H = T.figSize(Wd, phone ? 280 : 300, { max: g.kind === 'load' ? 0.6 : 0.72 })[1], out = [], label = '';
    var L = 40, R = Wd - 14, top = 30, bot = H - 40;
    if(g.kind === 'lake'){
      var yMax = Math.ceil(g.osat + 1), x = function(d){ return L + d / 60 * (R - L); }, y = function(v){ return bot - v / yMax * (bot - top); }, aMax = 45, ya = function(v){ return bot - Math.min(v, aMax) / aMax * (bot - top) * 0.92; };
      out.push('<rect class="wp-hypo" x="' + L + '" y="' + y(2).toFixed(1) + '" width="' + (R - L) + '" height="' + (bot - y(2)).toFixed(1) + '"/><text class="wp-hypo-t" x="' + (R - 4) + '" y="' + (bot - 5) + '" text-anchor="end">2 mg/L</text>');
      for(var v = 0; v <= yMax; v += 2) out.push('<line class="wp-grid" x1="' + L + '" x2="' + R + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="wp-tk" x="' + (L - 5) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>');
      [0, 10, 20, 30, 40, 50, 60].forEach(function(d){ out.push('<line class="wp-grid" x1="' + x(d).toFixed(1) + '" x2="' + x(d).toFixed(1) + '" y1="' + top + '" y2="' + bot + '"/><text class="wp-tk" x="' + x(d).toFixed(1) + '" y="' + (bot + 15) + '" text-anchor="middle">' + d + '</text>'); });
      out.push('<polygon class="wp-algae-a" points="' + L + ',' + bot + ' ' + g.algae.map(function(q){ return x(q[0]).toFixed(1) + ',' + ya(q[1]).toFixed(1); }).join(' ') + ' ' + R + ',' + bot + '"/>');
      out.push('<polyline class="wp-do" points="' + g.series.map(function(q){ return x(q[0]).toFixed(1) + ',' + y(q[1]).toFixed(1); }).join(' ') + '"/>');
      if(st.try && st.try.key === 'lowest' && isFinite(st.try.v) && st.try.v >= 0 && st.try.v <= yMax) out.push(tryLine(L, R, y(st.try.v), 'Yours: ' + F(st.try.v) + ' mg/L'));
      out.push('<line class="wp-axis" x1="' + L + '" x2="' + R + '" y1="' + bot + '" y2="' + bot + '"/><line class="wp-axis" x1="' + L + '" x2="' + L + '" y1="' + top + '" y2="' + bot + '"/>');
      out.push('<text class="wp-axl wp-c-oxy" x="' + L + '" y="' + (top - 10) + '">Bottom-water oxygen (mg/L)</text><text class="wp-axl wp-c-alg" x="' + R + '" y="' + (top - 10) + '" text-anchor="end">algae (relative)</text><text class="wp-axl" x="' + R + '" y="' + (bot + 30) + '" text-anchor="end">Day</text>');
      label = 'Graph of bottom-water dissolved oxygen over 60 days at ' + g.T + ' °C, with the algae shaded behind it and a line at 2 mg/L. Values every 10 days: ' + g.series.filter(function(q){ return q[0] % 10 === 0; }).map(function(q){ return 'day ' + q[0] + ' ' + F(q[1]) + ' mg/L'; }).join(', ') + '.';
    } else if(g.kind === 'bars'){
      var yM = 10, yy = function(v){ return bot - v / yM * (bot - top); }, bw = (R - L) / 2;
      for(var t = 0; t <= yM; t += 2) out.push('<line class="wp-grid" x1="' + L + '" x2="' + R + '" y1="' + yy(t).toFixed(1) + '" y2="' + yy(t).toFixed(1) + '"/><text class="wp-tk" x="' + (L - 5) + '" y="' + (yy(t) + 4).toFixed(1) + '" text-anchor="end">' + t + '</text>');
      out.push('<rect class="wp-hypo" x="' + L + '" y="' + yy(2).toFixed(1) + '" width="' + (R - L) + '" height="' + (bot - yy(2)).toFixed(1) + '"/>');
      [g.before, g.after].forEach(function(v, i){ var bx = L + i * bw + bw * 0.25, ww = bw * 0.5; out.push('<rect class="wp-bar is-oxy" x="' + bx.toFixed(1) + '" y="' + yy(v).toFixed(1) + '" width="' + ww.toFixed(1) + '" height="' + (bot - yy(v)).toFixed(1) + '"/><text class="wp-lab" x="' + (bx + ww / 2).toFixed(1) + '" y="' + (yy(v) - 6).toFixed(1) + '" text-anchor="middle">' + F(v) + ' mg/L</text><text class="wp-tk" x="' + (bx + ww / 2).toFixed(1) + '" y="' + (bot + 15) + '" text-anchor="middle">' + esc(g.labels[i]) + '</text>'); });
      out.push('<line class="wp-axis" x1="' + L + '" x2="' + R + '" y1="' + bot + '" y2="' + bot + '"/><text class="wp-axl wp-c-oxy" x="' + L + '" y="' + (top - 10) + '">Bottom-water oxygen (mg/L)</text>');
      label = 'Bar graph of bottom-water oxygen: ' + esc(g.labels[0]) + ' ' + F(g.before) + ' mg/L, ' + esc(g.labels[1]) + ' ' + F(g.after) + ' mg/L, with the hypoxic zone below 2 mg/L shaded.';
    } else if(g.kind === 'osat'){
      var xs = function(t){ return L + t / 35 * (R - L); }, ys = function(v){ return bot - v / 16 * (bot - top); };
      for(var a = 0; a <= 16; a += 4) out.push('<line class="wp-grid" x1="' + L + '" x2="' + R + '" y1="' + ys(a).toFixed(1) + '" y2="' + ys(a).toFixed(1) + '"/><text class="wp-tk" x="' + (L - 5) + '" y="' + (ys(a) + 4).toFixed(1) + '" text-anchor="end">' + a + '</text>');
      for(var b = 0; b <= 35; b += 5) out.push('<line class="wp-grid" x1="' + xs(b).toFixed(1) + '" x2="' + xs(b).toFixed(1) + '" y1="' + top + '" y2="' + bot + '"/><text class="wp-tk" x="' + xs(b).toFixed(1) + '" y="' + (bot + 15) + '" text-anchor="middle">' + b + '</text>');
      out.push('<polyline class="wp-osat" points="' + W.OSAT.map(function(q){ return xs(q[0]).toFixed(1) + ',' + ys(q[1]).toFixed(1); }).join(' ') + '"/>');
      W.OSAT.forEach(function(q){ var last = q[0] >= 35; out.push('<circle class="wp-osat-pt" cx="' + xs(q[0]).toFixed(1) + '" cy="' + ys(q[1]).toFixed(1) + '" r="3.5"/><text class="wp-tk" x="' + (xs(q[0]) + (last ? -4 : 4)).toFixed(1) + '" y="' + (ys(q[1]) - 7).toFixed(1) + '"' + (last ? ' text-anchor="end"' : '') + '>' + F(q[1]) + '</text>'); });
      [g.t0, g.t1].forEach(function(t, i){ out.push('<line class="wp-guide ' + (i ? 'is-warm' : '') + '" x1="' + xs(t).toFixed(1) + '" x2="' + xs(t).toFixed(1) + '" y1="' + top + '" y2="' + bot + '"/>'); });
      if(st.try && st.try.key === 'read' && isFinite(st.try.v) && st.try.v >= 0 && st.try.v <= 16) out.push(tryLine(L, R, ys(st.try.v), 'Yours: ' + F(st.try.v) + ' mg/L'));
      out.push('<line class="wp-axis" x1="' + L + '" x2="' + R + '" y1="' + bot + '" y2="' + bot + '"/><line class="wp-axis" x1="' + L + '" x2="' + L + '" y1="' + top + '" y2="' + bot + '"/><text class="wp-axl wp-c-oxy" x="' + L + '" y="' + (top - 10) + '">Oxygen at saturation (mg/L), USGS</text><text class="wp-axl" x="' + R + '" y="' + (bot + 30) + '" text-anchor="end">Temperature (°C)</text>');
      label = 'Oxygen saturation of fresh water against temperature, USGS: ' + W.OSAT.map(function(q){ return q[0] + ' °C ' + F(q[1]) + ' mg/L'; }).join(', ') + '. Dashed lines at ' + g.t0 + ' and ' + g.t1 + ' °C.';
    } else if(g.kind === 'plant'){
      var names = ['Raw sewage', 'Primary', 'Secondary'], vals = [g.bod, st.after1 ? g.a1 : null, st.after2a ? g.a2 : null], gap = phone ? 30 : 60, tw = (Wd - 28 - 2 * gap) / 3, ty = top + 40, th = H * 0.42;
      names.forEach(function(nm, i){
        var x = 14 + i * (tw + gap);
        out.push(tank(i, x, ty, tw, th, true) + '<text class="wp-tname" x="' + (x + tw / 2).toFixed(1) + '" y="' + (ty - 10) + '" text-anchor="middle">' + nm + '</text>');
        out.push('<text class="wp-lab' + (vals[i] == null ? ' wp-muted' : '') + '" x="' + (x + tw / 2).toFixed(1) + '" y="' + (ty + th + 24).toFixed(1) + '" text-anchor="middle">' + (vals[i] != null ? 'BOD ' + F(vals[i]) + ' mg/L' : 'BOD ?') + '</text>');
        if(i < 2){ var ax = x + tw, ay = ty + th * 0.3; out.push('<path class="wp-pipe2" d="M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + ' h' + gap + '"/><text class="wp-tk wp-c-bad" x="' + (ax + gap / 2).toFixed(1) + '" y="' + (ay - 10).toFixed(1) + '" text-anchor="middle">−' + (i ? g.p2 : g.p1) + '%</text>'); }
      });
      label = 'Treatment plant: raw sewage with BOD ' + g.bod + ' mg/L; primary removes ' + g.p1 + '%, secondary removes ' + g.p2 + '% of what is left.' + (st.after1 ? ' After primary ' + F(g.a1) + ' mg/L.' : '') + (st.after2a ? ' After secondary ' + F(g.a2) + ' mg/L.' : '');
    } else if(g.kind === 'load'){
      var mid = Wd * 0.46, wy = top + 64;
      out.push('<path class="wp-soil" d="M14 ' + (top + 30) + ' L' + mid + ' ' + wy + ' L' + mid + ' ' + bot + ' L14 ' + bot + ' Z"/><path class="wp-grass" d="M14 ' + (top + 30) + ' L' + mid + ' ' + wy + '"/>');
      for(var c = 0; c < 6; c++){ var cx = 24 + c * (mid - 40) / 5, cy = top + 30 + (cx - 14) / (mid - 14) * (wy - top - 30); out.push('<g class="wp-crop"><line x1="' + cx.toFixed(1) + '" y1="' + cy.toFixed(1) + '" x2="' + cx.toFixed(1) + '" y2="' + (cy - 16).toFixed(1) + '"/><path d="M' + cx.toFixed(1) + ' ' + (cy - 7).toFixed(1) + ' q-6 -2 -8 -8 M' + cx.toFixed(1) + ' ' + (cy - 11).toFixed(1) + ' q6 -2 8 -8"/></g>'); }
      out.push('<rect class="wp-river" x="' + (mid + 6) + '" y="' + wy + '" width="' + (R - mid - 6) + '" height="' + (bot - wy) + '" rx="10"/>');
      out.push('<path class="wp-runoff" d="M' + (mid * 0.55) + ' ' + (top + 56) + ' Q' + (mid * 0.85) + ' ' + (top + 64) + ' ' + (mid + 30) + ' ' + (wy + 26) + '"/>');
      out.push('<text class="wp-lab wp-c-nut" x="24" y="' + (top + 4) + '">' + g.conc + ' mg/L nitrate</text>');
      out.push('<text class="wp-lab wp-c-oxy" x="' + ((mid + R) / 2).toFixed(1) + '" y="' + (wy + 30) + '" text-anchor="middle">' + String(g.flow).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' L/day</text>');
      if(st.load) out.push('<text class="wp-tag wp-c-nut" x="' + ((mid + R) / 2).toFixed(1) + '" y="' + (wy + 62) + '" text-anchor="middle">' + M.fmt(g.load, 3) + ' kg nitrate/day</text>');
      if(st.reduce) out.push('<text class="wp-tag wp-c-alg" x="' + ((mid + R) / 2).toFixed(1) + '" y="' + (wy + 90) + '" text-anchor="middle">with the fix: ' + M.fmt(g.after, 3) + ' kg/day</text>');
      label = 'Farm runoff carrying ' + g.conc + ' mg/L nitrate into a stream that flows ' + g.flow + ' L per day.' + (st.load ? ' Load ' + M.fmt(g.load, 3) + ' kg per day.' : '');
    }
    el.innerHTML = '<figure class="cd-fig wp-qfig"><svg class="wp-svg" viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + out.join('') + '</svg></figure>';
  }
})();
