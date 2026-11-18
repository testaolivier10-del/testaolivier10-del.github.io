/* Energy flow, tools v2 (docs/tools-v2-bio-energy-flow-brief.md; the standard: docs/tools-v2-standard.md), on the
   shared kit (assets/course/tool-kit2.js) through the course adapter ApBioTools.studioKit2.
   The model is ApBioMath.energyFlow (bio-tool-math.js); the chain, the ranges, the questions and the mini FRQ are
   data (bio/data/tools/energy-flow.json; Explore's own settings are its "explore" block).

   THE ONE IDEA: energy enters an ecosystem through its producers, and only a small share passes to each next
   trophic level; the rest leaves as heat, so higher levels support fewer organisms.

   Two modes (the rule for every tool): EXPLORE is for playing with it, TEST YOURSELF is where you get quizzed.
   Explore: nothing locked, nothing graded, no side panel. A purpose line with a small "Show me how" link, then the
   picture: a grassland under the sun with its food chain left to right (grasses, grasshoppers, frogs, snakes). Each
   plant or animal drawn stands for the same energy stored in a year (explore.perOrganism), so the counts ARE the
   energy. ONE main control on the picture, "Share passed on" (5 to 20%), and one quiet one beside the sun,
   "Sunlight" (the energy the grass captures). INSTANT RESPONSE: a drag changes every level that instant: animals
   appear or leave, the heat rising at each step grows or shrinks, each level's energy is written under it, and
   when the top level gets less than one animal's worth it stands empty ("too little energy"). One loop chases the
   setting level by level, so the change is seen running up the chain; the numbers are read from what is drawn.
   The line under the picture is the CAUSE LINE (K.cause), one colour per idea:
   "10,000 kcal in grass -> 10% passed on -> 90% lost as heat -> 1 snake" (the count is added once it is drawn).
   A small "Watch it happen" button builds the chain from the sun up, one level at a time, and ends on a takeaway.
   One control never moves another.
   Test yourself: the page's stimulus questions and the mini FRQ (their ids are unchanged).
   "?": the numbers behind this setting (GPP, producer respiration, NPP, every level's heat, decomposers, stored
   energy and biomass), the pyramids of energy and biomass, the open ocean's inverted biomass pyramid, a persistent
   toxin up the same chain, and the share passed on from 5 to 20%.
   One colour per idea, everywhere: energy gold, heat vermillion. Every value is also written, so colour is never
   the only cue. Reduced motion: the result at once with a short cross fade; Watch it happen goes straight to the
   takeaway. */
(function(){
  'use strict';
  var SLUG = 'energy-flow';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T || !M) return;
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function n1(v){ return (+v).toFixed(1); }
  function rng(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ------------------------------------------------------------ the drawn organisms (feet at 0,0; about 40 wide) */
  var DEFS = '<defs>' +
    '<linearGradient id="ef2g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ef2s-sky0"/><stop offset="1" class="ef2s-sky1"/></linearGradient>' +
    '<radialGradient id="ef2g-sun" cx=".5" cy=".5" r=".5"><stop offset="0" class="ef2s-sun0"/><stop offset=".45" class="ef2s-sun0"/><stop offset="1" class="ef2s-sun1"/></radialGradient>' +
    '<linearGradient id="ef2g-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ef2s-ray0"/><stop offset="1" class="ef2s-ray1"/></linearGradient>' +
    '<linearGradient id="ef2g-depth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ef2s-dp0"/><stop offset=".5" class="ef2s-dp1"/><stop offset="1" class="ef2s-dp2"/></linearGradient>' +
    '<linearGradient id="ef2g-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ef2s-so0"/><stop offset="1" class="ef2s-so1"/></linearGradient>' +
    '<g id="ef2-hop"><path class="ef2-hleg" d="M-18 0L-13 -19L-3 -9"/><path class="ef2-hfem" d="M-13.5 -19.5L-1 -10L-6 -6.5Z"/><path class="ef2-hleg is-thin" d="M7 -6L9 0M1 -6L0 0"/>' +
      '<ellipse class="ef2-hbody" cx="-2" cy="-9" rx="14" ry="4.6"/><path class="ef2-hwing" d="M-16 -10.5Q-4 -16.5 9 -11.5Q-4 -9 -16 -10.5Z"/>' +
      '<circle class="ef2-hbody" cx="13" cy="-11" r="4.7"/><circle class="ef2-eye" cx="14.7" cy="-12.3" r="1.4"/><path class="ef2-hleg is-thin" d="M15 -15Q19 -23 25 -22"/></g>' +
    '<g id="ef2-frog"><path class="ef2-fleg" d="M-17 -1h-7"/><ellipse class="ef2-fdark" cx="-10" cy="-6" rx="9.5" ry="6.2" transform="rotate(-22 -10 -6)"/>' +
      '<path class="ef2-fbody" d="M-15 0Q-21 -14 -7 -20Q5 -26 14 -19Q21 -13 19 -5Q18 0 10 0Z"/><path class="ef2-fbelly" d="M-4 0Q0 -9 12 -8Q18 -7 18 -3Q17 0 10 0Z"/>' +
      '<path class="ef2-fleg" d="M9 -7L11 -1h6"/><circle class="ef2-fbody" cx="9" cy="-21" r="4.6"/><circle class="ef2-eyew" cx="9.6" cy="-21.6" r="2.7"/><circle class="ef2-eye" cx="10.2" cy="-21.6" r="1.5"/>' +
      '<path class="ef2-fmouth" d="M9 -12Q15 -10.5 19.5 -13"/></g>' +
    '<g id="ef2-snake"><path class="ef2-sedge" d="M-29 -2C-20 -15 -11 7 0 -4C8 -12 13 3 21 -9"/><path class="ef2-sbody" d="M-29 -2C-20 -15 -11 7 0 -4C8 -12 13 3 21 -9"/>' +
      '<path class="ef2-spat" d="M-29 -2C-20 -15 -11 7 0 -4C8 -12 13 3 21 -9"/><path class="ef2-stongue" d="M28.5 -13.5l5 -2.2M28.5 -13.5l5.2 .8"/>' +
      '<ellipse class="ef2-shead" cx="23.5" cy="-11.5" rx="6.2" ry="4.2" transform="rotate(-24 23.5 -11.5)"/><circle class="ef2-eye" cx="25.2" cy="-13" r="1.2"/></g>' +
    '</defs>';
  var KIND = ['grass', 'hop', 'frog', 'snake'];
  var ASPECT = [0, 0.62, 0.72, 0.5];   // sprite height / width

  function boot(){
    var K = window.LevlKit2;
    T.mount(SLUG, function(app, data, ctx){
      var esc = T.esc, E = M.energyFlow, EX = data.explore, D = data.defaults;
      var ECO = data.ecosystems.filter(function(e){ return e.id === EX.eco; })[0], NL = EX.levels, PER = EX.perOrganism;
      var ORG = ECO.organisms.slice(0, NL), ONE = EX.names;   // ONE[i] = [singular, plural]
      var S = { gpp: EX.gpp.value, eff: EX.eff.value, mode: 'explore' };
      var view = { e: [0, 0, 0, 0], h: [0, 0, 0, 0], play: null, clock: 0 }, prev = null, gest = false, took = false;
      function cond(o){ var c = { gpp: S.gpp, prodResp: D.prodResp, eff: S.eff, resp: D.resp, levels: NL, c0: D.c0, retain: D.retain, pb: ECO.pb, kcalPerG: data.kcalPerG }; for(var k in o || {}) c[k] = o[k]; return c; }
      var cache = {};
      function sim(gpp, eff){ var k = gpp + '|' + eff; return cache[k] || (cache[k] = E.simulate(cond({ gpp: gpp, eff: eff }))); }
      function target(){ return sim(S.gpp, S.eff).levels.map(function(L){ return L.stored; }); }
      /* A level's energy as it is written (rounded as fmt writes it), and the plants or animals drawn for it: the
         count is taken from the written number, so the two can never disagree, even in the middle of a change. */
      function disp(v){ return v >= 99.5 ? Math.round(v) : v >= 9.95 ? Math.round(v) : Math.round(v * 10) / 10; }
      function count(e){ return Math.floor(disp(e) / PER + 1e-6); }
      var MAXE = (function(){ var s = sim(EX.gpp.max, EX.eff.max); return s.levels.map(function(L){ return L.stored; }); })();
      var MAXN = MAXE.map(count), HMAX = MAXE[0] * (1 - EX.eff.min);
      function fmt(v){ var d = disp(v); return v >= 9.95 ? d.toLocaleString('en-US') : d.toFixed(1); }
      function pct(){ return Math.round(S.eff * 100); }
      function nOf(i, n){ return n.toLocaleString('en-US') + ' ' + ONE[i][n === 1 ? 0 : 1]; }

      // The page's own blocks (the adapter moves them): About, the questions and the mini FRQ.
      app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
        '<section class="bt-card" aria-labelledby="ef-q"><h2 id="ef-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');

      /* ---------------------------------------------------- the stage */
      var stage = document.createElement('div'); stage.className = 'ef2';
      var head = K.head({ purpose: EX.purpose, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
      stage.appendChild(head.el);
      var sceneBox = document.createElement('div'); sceneBox.className = 'ef2-scene'; sceneBox.id = T.nid('ef2');
      sceneBox.innerHTML = '<svg class="ef2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep">' + DEFS +
        '<g class="ef2-static"></g><g class="ef2-rays"></g></svg>' +
        // each level's plants or animals are a layer of their own, and so is what changes every frame: a change
        // then repaints only the layer it touches (the meadow is 1,500 shapes)
        KIND.map(function(k){ return '<svg class="ef2-svg ef2-lay is-' + k + '" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"></svg>'; }).join('') +
        '<svg class="ef2-svg ef2-lay ef2-top" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="ef2-dyn"></g></svg>';
      stage.appendChild(sceneBox);
      var svg = sceneBox.querySelector('svg'), gStatic = svg.querySelector('.ef2-static'), gRays = svg.querySelector('.ef2-rays'), gDyn = sceneBox.querySelector('.ef2-dyn');
      var LAYS = [].slice.call(sceneBox.querySelectorAll('.ef2-lay')), OL = LAYS.slice(0, NL);
      var layer = K.layer(sceneBox), G = null;
      var lines = document.createElement('div'); lines.className = 'ef2-lines';
      var cause = K.cause({ label: 'Why' });
      var player = K.player({ min: 0, max: 1, speed: 1 / 6.4, labels: { play: 'Watch it happen', pause: 'Pause', again: 'Watch again' },
        get: function(){ return view.play == null ? 0 : view.play; },
        set: function(v){ view.play = v; view.clock = now(); replayView(); syncWords(); draw(); },
        before: function(){
          hideCue(true); tourDid('watch'); stopTween(); prev = null; took = false;
          if(K.reduced()){ snap(); took = true; syncWords(); draw(); say(takeaway()); return false; }
          view.play = 0; replayView(); syncWords();
        },
        onEnd: function(){ view.play = null; snap(); took = true; syncWords(); draw(); player.paint(); say(takeaway()); } });
      player.el.classList.add('is-sm');
      lines.appendChild(cause.el); lines.appendChild(player.el);
      stage.appendChild(lines);
      var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
      stage.appendChild(live);
      function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

      /* ---- the controls, on the picture: the share passed on (the main one) and the sunlight (quiet) */
      function topLine(gpp, eff){ var n = count(sim(gpp, eff).levels[NL - 1].stored); return 'The top of the chain has ' + nOf(NL - 1, n) + '.'; }
      var cEff = K.drag(layer, { key: 'apbio-energy-flow-eff', label: 'Share of energy passed on to the next level', min: EX.eff.min * 100, max: EX.eff.max * 100, step: EX.eff.step * 100, value: Math.round(S.eff * 100), track: [0, 0, 1, 0], chip: false,
        valuetext: function(v){ return v + ' percent passed on, ' + (100 - v) + ' percent lost as heat. ' + topLine(S.gpp, v / 100); }, tag: function(v){ return v + '%'; },
        onInput: function(v){ begin(); stopPlay(); S.eff = v / 100; took = false; changed(); tourDid('drag'); },
        onEnd: function(){ gest = false; say(cause.text()); refHtml(); } });
      var cSun = K.drag(layer, { key: 'apbio-energy-flow-sun', label: 'Sunlight: the energy the grass captures', min: EX.gpp.min, max: EX.gpp.max, step: EX.gpp.step, value: S.gpp, track: [0, 0, 1, 0], quiet: true,
        valuetext: function(v){ return 'The grass captures ' + v.toLocaleString('en-US') + ' kilocalories per square meter per year and stores ' + fmt(sim(v, S.eff).npp) + '. ' + topLine(v, S.eff); },
        onInput: function(v){ prev = null; stopPlay(); S.gpp = v; took = false; changed(); tourDid('sun'); },
        onEnd: function(){ say(cause.text()); refHtml(); } });
      var cue = K.cue(layer, { key: 'apbio-energy-flow', text: 'Drag the share', side: 'right', at: function(){ return G ? [knobX(S.eff), G.ty] : [0, 0]; } });
      function knobX(eff){ return G.tx0 + (G.tx1 - G.tx0) * ((eff - EX.eff.min) / (EX.eff.max - EX.eff.min)); }
      function hideCue(used){ if(cue.active()) cue.hide(used); }
      stage.addEventListener('pointerdown', function(){ hideCue(true); }, true);
      stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End|Enter| )/.test(e.key)) hideCue(true); }, true);
      var tour = K.tour({ key: 'apbio-energy-flow', label: 'Show me how', steps: [
        { id: 'drag', text: 'Drag the share passed on. Every level changes at once.', target: function(){ return cEff.el.querySelector('.tk2-knob'); } },
        { id: 'sun', text: 'Drag the sunlight to change the energy coming in.', target: function(){ return cSun.el.querySelector('.tk2-knob'); } },
        { id: 'watch', text: 'Press Watch it happen to follow the energy up the chain.', target: function(){ return player.el; } }],
        onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
      function tourDid(id){ if(tour.active()) tour.did(id); }
      function startTour(){ if(S.mode !== 'explore') return; hideCue(false); tour.start(true); }

      /* ---- the picture follows the controls at once, and every change is seen happening. One loop chases the
         setting: the grass moves toward what this sunlight gives it, and each level above moves toward the share of
         the level below as it is drawn, so a change runs up the chain. The numbers, the animals and the heat are
         all read from the same values (view), so they cannot disagree. Reduced motion: the result at once with a
         short cross fade. */
      var tw = 0, lastTs = 0, calmT = 0, calm = true, wKey = '';
      function now(){ return window.performance ? performance.now() : Date.now(); }
      function begin(){ if(gest) return; gest = true; prev = { eff: S.eff }; }
      function stopTween(){ if(tw){ cancelAnimationFrame(tw); tw = 0; } lastTs = 0; clearTimeout(calmT); calm = true; }
      function stopPlay(){ if(view.play != null){ player.stop(); view.play = null; player.reset && player.reset(); } }
      function heats(){ for(var j = 1; j < NL; j++) view.h[j] = view.e[j - 1] * (1 - S.eff); }
      function snap(){ view.e = target(); heats(); }
      function busy(){ return view.play != null || !!tw || !calm; }
      function ease(x){ x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
      /* A frame of the replay: the chain builds from the sun up, one level at a time. */
      function replayView(){
        var tg = target(), st = view.play * NL;
        for(var i = 0; i < NL; i++){ var f = ease(st - i); view.e[i] = tg[i] * f; view.h[i] = i ? tg[i - 1] * (1 - S.eff) * f : 0; }
      }
      function crossFade(){
        var g = document.createElement('div'); g.className = 'ef2-fade';
        LAYS.forEach(function(l){ g.appendChild(l.cloneNode(true)); }); sceneBox.insertBefore(g, layer.el);
        var done = function(){ if(g.parentNode) g.parentNode.removeChild(g); };
        if(g.animate){ var an = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'linear' }); an.onfinish = done; setTimeout(done, 400); } else done();
      }
      function changed(){
        if(K.reduced() || !window.requestAnimationFrame){
          stopTween(); stage.classList.add('is-rm'); crossFade(); snap(); syncWords(); draw(); return;
        }
        stage.classList.remove('is-rm');
        clearTimeout(calmT); calm = false;
        if(!tw){ lastTs = 0; tw = requestAnimationFrame(tick); }
        syncWords(); draw();
      }
      function tick(ts){
        var dt = lastTs ? Math.min(0.3, (ts - lastTs) / 1000) : 0.016, a = 1 - Math.exp(-dt / 0.13), tg = target(), done = true; lastTs = ts; view.clock = ts;
        for(var i = 0; i < NL; i++){
          var want = i ? S.eff * view.e[i - 1] : tg[0], d = want - view.e[i];
          if(Math.abs(d) <= Math.max(0.004 * want, 0.02)) view.e[i] = want; else { view.e[i] += d * a; done = false; }
        }
        if(done) view.e = tg;
        heats();
        if(done){ tw = 0; lastTs = 0; calmT = setTimeout(function(){ calm = true; syncWords(); draw(); }, 340); }   // the last animals finish coming in or leaving
        else tw = requestAnimationFrame(tick);
        syncWords(); draw();
      }

      /* ---- the words: the cause line, read from the picture */
      function takeaway(){ return 'Only ' + pct() + '% of the energy moves up each step. The rest leaves as heat, so the top feeds the fewest animals.'; }
      function chain(){
        var p = [{ t: fmt(view.e[0]) + ' kcal in grass', role: 'energy', say: 'The grass stores ' + fmt(view.e[0]) + ' kilocalories' },
          { t: pct() + '% passed on', role: 'energy', say: pct() + ' percent is passed on at each step' }, { t: (100 - pct()) + '% lost as heat', role: 'heat', say: (100 - pct()) + ' percent is lost as heat' }];
        if(!busy()){ var n = count(view.e[NL - 1]); p.push({ t: nOf(NL - 1, n), role: 'ink', say: 'the top of the chain has ' + nOf(NL - 1, n) }); }
        return p;
      }
      function words(){ if(took) cause.take(takeaway()); else cause.set(chain()); }
      function syncWords(){
        var k = fmt(view.e[0]) + '|' + S.eff + '|' + busy() + '|' + count(view.e[NL - 1]) + '|' + took;
        if(k !== wKey){ wKey = k; words(); }
      }

      /* ---------------------------------------------------- layout */
      function geo(W, H){
        var ph = W < 560, ctl = ph ? 116 : 114, f = ph ? [0.31, 0.27, 0.22, 0.2] : [0.34, 0.26, 0.22, 0.18], bx = [0], i;
        for(i = 0; i < NL; i++) bx.push(i === NL - 1 ? W : Math.round(bx[i] + W * f[i]));
        var fs = W < 380 ? 10.5 : ph ? 11 : W < 900 ? 12.5 : 14, fsS = ph ? 10.5 : 12;
        // one line per label when the widest ("Grasshoppers 15,000 kcal") fits its place; else the name over the value
        var two = false;
        for(i = 0; i < NL; i++){ var need = wid(ORG[i], fs) + wid('15,000 kcal', fs) + 34; if(need > bx[i + 1] - bx[i] - 8) two = true; }
        var lb = two ? fs * 2 + 22 : fs + 24, yB = H - ctl, gy1 = yB - lb;
        var sky = ph ? 118 : clamp(Math.round((yB - lb) * 0.34), 124, 190), gy0 = sky, back = ph ? 24 : 30;
        var sunR = ph ? 19 : 30, sunX = ph ? 34 : 70, sunY = ph ? 34 : 62;
        var sx0 = sunX + sunR + (ph ? 30 : 46), slen = clamp(W * 0.17, 84, 190), sy = ph ? 28 : 46;
        var half = Math.min(380, (W - (ph ? 70 : 170)) / 2);
        var zones = [];
        for(i = 0; i < NL; i++) zones.push({ x0: bx[i], x1: bx[i + 1], cx: (bx[i] + bx[i + 1]) / 2 });
        return { W: W, H: H, ph: ph, ctl: ctl, bx: bx, zones: zones, two: two, lb: lb, yB: yB, gy0: gy0, gy1: gy1, back: back, fs: fs, fsS: fsS,
          sunX: sunX, sunY: sunY, sunR: sunR, sx0: sx0, sx1: sx0 + slen, sy: sy, pmax: Math.max(30, gy0 - (sy + (ph ? 46 : 58))),
          al: ph ? 20 : 40, tx0: W / 2 - half, tx1: W / 2 + half, ty: yB + (ph ? 58 : 56) };
      }
      /* The width of a word as it will be drawn (labels are sized and kept apart by measuring, not by guessing). */
      var mctx = null, mfam = '';
      function wid(t, fs){
        try{
          if(!mctx){ mctx = document.createElement('canvas').getContext('2d'); mfam = getComputedStyle(svg).fontFamily || 'sans-serif'; }
          mctx.font = '900 ' + fs + 'px ' + mfam; return mctx.measureText(t).width;
        }catch(e){ return t.length * fs * 0.6; }
      }
      function edge(i, y){ return i === 0 ? 0 : i === NL ? G.W : G.bx[i] + 7 * Math.sin((y - G.gy0) / 34 + i * 1.7); }
      function pill(x, y, lines, cls, fs, x0min, x1max){
        var w = 0, h = lines.length * (fs + 3) + 9, out = '';
        lines.forEach(function(l){ w = Math.max(w, wid(l.t, fs) + (G.ph ? 13 : 20)); });
        var x0 = clamp(x - w / 2, x0min == null ? 3 : x0min, (x1max == null ? G.W - 3 : x1max) - w);
        lines.forEach(function(l, k){ out += '<text class="' + (l.c || '') + '" x="' + n1(x0 + w / 2) + '" y="' + n1(y - h / 2 + 4.5 + (k + 1) * (fs + 3) - 3.2) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(l.t) + '</text>'; });
        return '<g class="ef2-pill ' + cls + '"><rect x="' + n1(x0) + '" y="' + n1(y - h / 2) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="' + n1(Math.min(h / 2, 13)) + '"/>' + out + '</g>';
      }

      /* Where each plant and animal stands: fixed places, spread evenly at any count (the first n are shown). */
      var ORGS = [];   // per level: { els: [node by rank], shown }
      function places(i, rect, size){
        var n = MAXN[i], r = rng(77 + i * 131), pts = [], w = rect.x1 - rect.x0, h = rect.y1 - rect.y0, k;
        if(i === 0){
          // a meadow: a jittered grid, shown in a shuffled order so that it thickens evenly
          var cols = Math.max(4, Math.round(Math.sqrt(n * w / h))), rows = Math.ceil(n / cols);
          for(k = 0; k < cols * rows; k++){ var c = k % cols, q = Math.floor(k / cols); pts.push([rect.x0 + (c + 0.15 + 0.7 * r()) * w / cols, rect.y0 + (q + 0.15 + 0.7 * r()) * h / rows]); }
          for(k = pts.length - 1; k > 0; k--){ var j = Math.floor(r() * (k + 1)), t = pts[k]; pts[k] = pts[j]; pts[j] = t; }
          return pts.slice(0, n);
        }
        // animals: each new one stands as far from the others as it can
        pts.push([rect.x0 + w * 0.5, rect.y0 + h * 0.56]);
        while(pts.length < n){
          var best = null, bd = -1;
          for(var cnd = 0; cnd < 14; cnd++){
            var p = [rect.x0 + r() * w, rect.y0 + r() * h], dmin = 1e9;
            for(k = 0; k < pts.length; k++){ var dx = p[0] - pts[k][0], dy = (p[1] - pts[k][1]) * (i === NL - 1 ? 2.4 : 1.5), dd = dx * dx + dy * dy; if(dd < dmin) dmin = dd; }
            if(dmin > bd){ bd = dmin; best = p; }
          }
          pts.push(best);
        }
        return pts;
      }
      function buildOrgs(){
        var meta = [];
        for(var i = 0; i < NL; i++){
          var z = G.zones[i], gh = G.gy1 - G.gy0, wz = z.x1 - z.x0, area = wz * gh;
          var size = i === 0 ? clamp(1.2 * Math.sqrt(area / MAXN[0]), 5, 11) : clamp([0, 0.98, 0.84, 0.58][i] * Math.sqrt(area / MAXN[i]), 6, [0, 19, 30, 56][i]);
          var hh = i === 0 ? size * 1.7 : size * ASPECT[i], padX = (i === 0 ? size * 0.5 : size * 0.55) + (G.ph ? 5 : 9);
          var rect = { x0: z.x0 + padX + (i ? 3 : 0), x1: z.x1 - padX - (i < NL - 1 ? 3 : 0), y0: G.gy0 + G.back + hh * 0.9, y1: G.gy1 - 3 };
          var pts = places(i, rect, size), r = rng(9 + i * 53), order = pts.map(function(p, k){ return { p: p, k: k, v: r() }; });
          order.sort(function(a, b){ return a.p[1] - b.p[1]; });   // far ones first, so near ones overlap them
          var parts = order.map(function(o){
            var dep = 0.8 + 0.2 * (o.p[1] - rect.y0) / Math.max(1, rect.y1 - rect.y0), s = size * dep;
            if(i === 0){
              var x = o.p[0], y = o.p[1], hgt = s * (1.35 + 0.7 * o.v), lean = (o.v - 0.5) * s * 0.9, wd = s * 0.2;
              var d = 'M' + n1(x - wd) + ' ' + n1(y) + 'Q' + n1(x - wd + lean * 0.2) + ' ' + n1(y - hgt * 0.6) + ' ' + n1(x + lean) + ' ' + n1(y - hgt) + 'Q' + n1(x + wd + lean * 0.3) + ' ' + n1(y - hgt * 0.5) + ' ' + n1(x + wd) + ' ' + n1(y) + 'Z' +
                'M' + n1(x - wd * 2.2) + ' ' + n1(y) + 'Q' + n1(x - s * 0.5) + ' ' + n1(y - hgt * 0.4) + ' ' + n1(x - s * 0.62) + ' ' + n1(y - hgt * 0.68) + 'Q' + n1(x - s * 0.2) + ' ' + n1(y - hgt * 0.3) + ' ' + n1(x - wd * 0.4) + ' ' + n1(y) + 'Z' +
                'M' + n1(x + wd * 0.4) + ' ' + n1(y) + 'Q' + n1(x + s * 0.3) + ' ' + n1(y - hgt * 0.35) + ' ' + n1(x + s * 0.6) + ' ' + n1(y - hgt * 0.6) + 'Q' + n1(x + s * 0.5) + ' ' + n1(y - hgt * 0.2) + ' ' + n1(x + wd * 2.2) + ' ' + n1(y) + 'Z';
              return '<path class="ef2-o ef2-sp is-' + (o.k % 3) + '" data-k="' + o.k + '" d="' + d + '"/>';
            }
            var sc = s / 40, flip = o.v < 0.3 ? -1 : 1;
            return '<g transform="translate(' + n1(o.p[0]) + ' ' + n1(o.p[1]) + ') scale(' + (sc * flip).toFixed(3) + ' ' + sc.toFixed(3) + ')"><use class="ef2-o" data-k="' + o.k + '" href="#ef2-' + KIND[i] + '"/></g>';
          });
          OL[i].innerHTML = parts.join('');
          meta.push({ rect: rect, size: size });
        }
        ORGS = meta.map(function(m, i){
          var els = []; OL[i].querySelectorAll('.ef2-o').forEach(function(e){ els[+e.getAttribute('data-k')] = e; });
          return { els: els, shown: 0, rect: m.rect, size: m.size };
        });
      }
      function showOrgs(){
        for(var i = 0; i < NL; i++){
          var o = ORGS[i], n = Math.min(o.els.length, count(view.e[i])), k;
          if(n > o.shown) for(k = o.shown; k < n; k++) o.els[k].classList.add('is-on');
          else for(k = n; k < o.shown; k++) o.els[k].classList.remove('is-on');
          o.shown = n;
        }
      }

      /* ---------------------------------------------------- drawing */
      function drawStatic(){
        var g = G, p = [], W = g.W, i, y;
        p.push('<rect class="ef2-sky" x="0" y="0" width="' + W + '" height="' + (g.gy0 + 2) + '"/>');
        // far hills: a calm cue for "a grassland", nothing to read
        var hy = g.gy0, hh = g.ph ? 16 : 30;
        p.push('<path class="ef2-hill is-far" d="M0 ' + hy + 'V' + n1(hy - hh * 0.5) + 'C' + n1(W * 0.16) + ' ' + n1(hy - hh * 1.5) + ' ' + n1(W * 0.3) + ' ' + n1(hy - hh * 0.2) + ' ' + n1(W * 0.47) + ' ' + n1(hy - hh * 0.8) + 'S' + n1(W * 0.8) + ' ' + n1(hy - hh * 1.5) + ' ' + W + ' ' + n1(hy - hh * 0.5) + 'V' + hy + 'Z"/>');
        p.push('<path class="ef2-hill" d="M0 ' + hy + 'V' + n1(hy - hh * 0.25) + 'C' + n1(W * 0.2) + ' ' + n1(hy - hh * 0.7) + ' ' + n1(W * 0.4) + ' ' + n1(hy - hh * 0.05) + ' ' + n1(W * 0.6) + ' ' + n1(hy - hh * 0.45) + 'S' + n1(W * 0.9) + ' ' + n1(hy - hh * 0.75) + ' ' + W + ' ' + n1(hy - hh * 0.2) + 'V' + hy + 'Z"/>');
        // the ground: one patch per level, each its own kind of ground
        for(i = 0; i < NL; i++){
          var d = 'M' + n1(edge(i, g.gy0)) + ' ' + g.gy0;
          for(y = g.gy0; y <= g.yB; y += 10) d += 'L' + n1(edge(i + 1, Math.min(y, g.yB))) + ' ' + Math.min(y, g.yB);
          d += 'L' + n1(edge(i + 1, g.yB)) + ' ' + g.yB;
          for(y = g.yB; y >= g.gy0; y -= 10) d += 'L' + n1(edge(i, y)) + ' ' + y;
          p.push('<path class="ef2-ground is-' + KIND[i] + '" d="' + d + 'Z"/>');
        }
        // the frogs' pond and the snakes' rocks, at the back of their patches
        var zf = g.zones[2], zs = g.zones[3], pw = (zf.x1 - zf.x0) * 0.5, py = g.gy0 + g.back + (g.ph ? 8 : 12);
        p.push('<ellipse class="ef2-pond" cx="' + n1(zf.cx + pw * 0.12) + '" cy="' + n1(py) + '" rx="' + n1(pw * 0.5) + '" ry="' + n1(g.ph ? 6 : 9) + '"/><path class="ef2-pondshine" d="M' + n1(zf.cx - pw * 0.15) + ' ' + n1(py - 2) + 'h' + n1(pw * 0.3) + '"/>');
        var rw = (zs.x1 - zs.x0) * 0.2, ry = g.gy0 + g.back + (g.ph ? 6 : 10);
        p.push('<path class="ef2-rock" d="M' + n1(zs.cx + rw * 0.3) + ' ' + n1(ry + 5) + 'q' + n1(rw * 0.2) + ' ' + n1(-rw * 0.75) + ' ' + n1(rw * 0.8) + ' ' + n1(-rw * 0.55) + 't' + n1(rw * 0.9) + ' ' + n1(rw * 0.55) + 'Z"/><path class="ef2-rock is-2" d="M' + n1(zs.cx - rw * 1.3) + ' ' + n1(ry + 6) + 'q' + n1(rw * 0.3) + ' ' + n1(-rw * 0.5) + ' ' + n1(rw * 0.7) + ' ' + n1(-rw * 0.4) + 't' + n1(rw * 0.6) + ' ' + n1(rw * 0.4) + 'Z"/>');
        p.push('<rect class="ef2-depth" x="0" y="' + g.gy0 + '" width="' + W + '" height="' + (g.yB - g.gy0) + '"/>');
        // the strip the main control lies on
        p.push('<rect class="ef2-soil" x="0" y="' + g.yB + '" width="' + W + '" height="' + (g.H - g.yB) + '"/><path class="ef2-soiledge" d="M0 ' + (g.yB + 0.75) + 'H' + W + '"/>');
        p.push('<text class="ef2-end" x="' + n1(g.tx0) + '" y="' + n1(g.ty + 39) + '" text-anchor="middle" style="font-size:' + g.fsS + 'px">' + Math.round(EX.eff.min * 100) + '%</text><text class="ef2-end" x="' + n1(g.tx1) + '" y="' + n1(g.ty + 39) + '" text-anchor="middle" style="font-size:' + g.fsS + 'px">' + Math.round(EX.eff.max * 100) + '%</text>');
        p.push(pill(g.W / 2, g.ty + 35, [{ t: 'Share passed on', b: 1 }], 'is-energy is-name', g.ph ? 13 : 15));
        // the sun and the name of its control
        p.push('<circle class="ef2-sunglow" cx="' + g.sunX + '" cy="' + g.sunY + '" r="' + n1(g.sunR * 1.9) + '"/><circle class="ef2-sun" cx="' + g.sunX + '" cy="' + g.sunY + '" r="' + g.sunR + '"/>');
        p.push('<path class="ef2-suntrack" d="M' + n1(g.sx0) + ' ' + g.sy + 'H' + n1(g.sx1) + '"/><circle class="ef2-sunend" cx="' + n1(g.sx0 - (g.ph ? 9 : 12)) + '" cy="' + g.sy + '" r="' + (g.ph ? 3 : 3.5) + '"/><circle class="ef2-sunend" cx="' + n1(g.sx1 + (g.ph ? 12 : 16)) + '" cy="' + g.sy + '" r="' + (g.ph ? 6 : 7.5) + '"/>');
        p.push('<text class="ef2-sunname" x="' + n1((g.sx0 + g.sx1) / 2) + '" y="' + n1(g.sy + (g.ph ? 40 : 42)) + '" text-anchor="middle" style="font-size:' + (g.ph ? 12 : 13.5) + 'px">Sunlight</text>');
        gStatic.innerHTML = p.join('');
      }
      function plume(x, y0, h, ph){
        var s = Math.sqrt(clamp(h / HMAX, 0, 1)), Hp = G.pmax * s, wp = Hp * 0.6, out = '';
        if(Hp < 2.5) return { html: '', top: y0, w: 0, Hp: 0 };
        var sw = clamp(1.1 + 3.1 * s, 1.1, 4.2), nW = Hp < 14 ? 1 : 3;
        for(var k = 0; k < nW; k++){
          var ox = nW === 1 ? 0 : (k - 1) * wp * 0.36, top = Hp * (k === 1 || nW === 1 ? 1 : 0.8), amp = Math.max(1.2, wp * 0.085), seg = Math.max(2, Math.round(top / 9)), d = '';
          for(var q = 0; q <= seg; q++){ var yy = y0 - (top - sw * 2.2) * q / seg, xx = x + ox + amp * Math.sin(q / seg * Math.PI * 2.4 + k * 2 + ph) * Math.min(1, q / 2); d += (q ? 'L' : 'M') + n1(xx) + ' ' + n1(yy); }
          var tx = x + ox + amp * Math.sin(Math.PI * 2.4 + k * 2 + ph), ty = y0 - top, hw = sw * 1.5 + 1.2;
          out += '<path class="ef2-heat" stroke-width="' + n1(sw) + '" d="' + d + '"/><path class="ef2-heat-h" d="M' + n1(tx) + ' ' + n1(ty) + 'l' + n1(-hw) + ' ' + n1(hw * 1.5) + 'h' + n1(hw * 2) + 'Z"/>';
        }
        return { html: out, top: y0 - Hp, w: wp, Hp: Hp };
      }
      function draw(){
        if(!G) return;
        var g = G, p = [], i, tg = target(), live = busy(), ph = live && !K.reduced() ? view.clock * 0.007 : 0, rp = view.play != null;
        showOrgs();
        // sunlight: beams from the sun into the grass, stronger with more of it
        var z0 = g.zones[0], sunF = clamp(view.e[0] / MAXE[0], 0, 1), rays = '';
        for(i = 0; i < 4; i++){
          var xa = z0.x0 + (z0.x1 - z0.x0) * (0.2 + i * 0.22), xb = xa + (z0.x1 - z0.x0) * 0.13, ang = Math.atan2(g.gy0 + g.back - g.sunY, (xa + xb) / 2 - g.sunX), ox = Math.cos(ang) * g.sunR * 1.25, oy = Math.sin(ang) * g.sunR * 1.25;
          rays += '<path class="ef2-ray" d="M' + n1(g.sunX + ox - oy * 0.14) + ' ' + n1(g.sunY + oy + ox * 0.14) + 'L' + n1(xa) + ' ' + n1(g.gy0 + g.back + 6) + 'L' + n1(xb) + ' ' + n1(g.gy0 + g.back + 6) + 'L' + n1(g.sunX + ox + oy * 0.14) + ' ' + n1(g.sunY + oy - ox * 0.14) + 'Z"/>';
        }
        var rk = g.W + '|' + g.H + '|' + sunF.toFixed(2);
        if(draw.rk !== rk){
          draw.rk = rk; gRays.innerHTML = rays; gRays.setAttribute('opacity', (0.12 + 0.88 * sunF).toFixed(2));
          var glow = gStatic.querySelector('.ef2-sunglow'); if(glow) glow.setAttribute('opacity', (0.3 + 0.7 * sunF).toFixed(2));
        }
        // each step: most of the energy leaves as heat (up), a little goes on (the gold arrow)
        for(var j = 1; j < NL; j++){
          var x = g.bx[j], pl = plume(x, g.gy0 - 1, view.h[j], ph + j);
          p.push(pl.html);
          if(pl.Hp > 0){
            var lx = x + pl.w * 0.5 + 6, ly = Math.min(g.gy0 - 5, g.gy0 - pl.Hp * 0.5 + 4);
            p.push('<text class="ef2-heat-t" x="' + n1(lx) + '" y="' + n1(ly) + '" style="font-size:' + (g.ph ? 11.5 : 13) + 'px">heat</text>');
          }
          var pass = view.e[j], ay = g.gy0 + (g.ph ? 12 : 15);
          if(pass > 0.05){
            var aw = clamp(Math.sqrt(pass / MAXE[1]) * (g.ph ? 9 : 14), 1.6, 14), hl = aw * 0.8 + 5, x0 = x - (g.ph ? 5 : 8), x1 = x0 + g.al;
            p.push('<path class="ef2-pass" stroke-width="' + n1(aw) + '" d="M' + n1(x0) + ' ' + ay + 'H' + n1(x1 - hl) + '"/><path class="ef2-pass-h" d="M' + n1(x1) + ' ' + ay + 'l' + n1(-hl) + ' ' + n1(-hl * 0.72 - aw * 0.2) + 'v' + n1(hl * 1.44 + aw * 0.4) + 'Z"/>');
            if(live && !K.reduced()){ var u = (view.clock / 520 + j * 0.3) % 1; p.push('<circle class="ef2-spark" cx="' + n1(x0 + (x1 - x0 - hl) * u) + '" cy="' + ay + '" r="' + n1(Math.max(1.6, aw * 0.3)) + '"/>'); }
            p.push(pill(x - (g.ph ? 5 : 8) + g.al + 4 + (g.ph ? 17 : 22), ay, [{ t: pct() + '%', b: 1 }], 'is-energy is-chip', g.ph ? 10.5 : 12.5, x - 2, g.zones[j].x1));
          }
        }
        // each level's name and the energy it stores, under it; they wait for the picture in the replay
        for(i = 0; i < NL; i++){
          var z = g.zones[i], e = view.e[i];
          if(rp && e <= 0) continue;
          var ly2 = g.gy1 + g.lb / 2, name = { t: ORG[i], b: 1, c: 'ef2-nm' }, val = { t: fmt(e) + ' kcal', b: 1, c: 'ef2-val' };
          if(g.two) p.push(pill(z.cx, ly2, [name, val], 'is-level', g.fs, z.x0 + 2, z.x1 - 2));
          else {
            var w1 = wid(name.t, g.fs), w2 = wid(val.t, g.fs), w = w1 + w2 + 34, h = g.fs + 13, xl = clamp(z.cx - w / 2, z.x0 + 2, z.x1 - 2 - w);
            p.push('<g class="ef2-pill is-level"><rect x="' + n1(xl) + '" y="' + n1(ly2 - h / 2) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="' + n1(h / 2) + '"/><text class="ef2-nm" x="' + n1(xl + 11) + '" y="' + n1(ly2 + g.fs * 0.36) + '" style="font-size:' + g.fs + 'px">' + esc(name.t) + '</text>' +
              '<text class="ef2-val" x="' + n1(xl + w - 11) + '" y="' + n1(ly2 + g.fs * 0.36) + '" text-anchor="end" style="font-size:' + g.fs + 'px">' + esc(val.t) + '</text></g>');
          }
          // a level with less than one animal's worth of energy stands empty, and says why
          if(i && !rp && count(e) === 0 && count(tg[i]) === 0 && ORGS[i]){
            var r = ORGS[i].rect, fsE = g.ph ? 10 : 12.5, narrow = wid('too little energy', fsE) + 24 > z.x1 - z.x0;
            p.push(pill(z.cx, (r.y0 + r.y1) / 2, narrow ? [{ t: 'too little', b: 1 }, { t: 'energy', b: 1 }] : [{ t: 'too little energy', b: 1 }], 'is-none', fsE, z.x0 + 2, z.x1 - 2));
          }
        }
        // where the share was before this change: a tick on the track, never a second knob
        if(prev && Math.abs(prev.eff - S.eff) > 1e-9 && !rp){
          var bxp = knobX(prev.eff);
          p.push('<path class="ef2-mark" d="M' + n1(bxp) + ' ' + n1(g.ty - 9) + 'V' + n1(g.ty + 9) + '"/>');
          if(Math.abs(bxp - knobX(S.eff)) > 58) p.push('<text class="ef2-markt" x="' + n1(bxp) + '" y="' + n1(g.ty - 14) + '" text-anchor="middle" style="font-size:' + (g.ph ? 10.5 : 11.5) + 'px">before</text>');
        }
        var dh = p.join(''); if(draw.dh !== dh){ draw.dh = dh; gDyn.innerHTML = dh; }
        var cnt = view.e.map(count), al = 'A grassland food chain under the sun, left to right. ' + ORG.map(function(nm, k){ return nm + ' store ' + fmt(view.e[k]) + ' kilocalories per square meter per year, ' + nOf(k, cnt[k]) + ' drawn'; }).join('; ') +
          '. At each step ' + pct() + ' percent of the energy is passed on and ' + (100 - pct()) + ' percent leaves as heat.';
        if(draw.al !== al){ draw.al = al; svg.setAttribute('aria-label', al); }
      }
      function layoutNow(){
        if(stage.hidden) return;
        var r = sceneBox.getBoundingClientRect(), W = Math.max(280, Math.round(r.width)), H = Math.max(300, Math.round(r.height));
        if(G && G.W === W && G.H === H){ draw(); return; }
        [svg].concat(LAYS).forEach(function(x){ x.setAttribute('viewBox', '0 0 ' + W + ' ' + H); x.setAttribute('width', W); x.setAttribute('height', H); });
        draw.rk = draw.dh = null;
        G = geo(W, H);
        cEff.place([G.tx0, G.ty, G.tx1, G.ty]); cSun.place([G.sx0, G.sy, G.sx1, G.sy]);
        drawStatic();
        stage.classList.add('is-build'); buildOrgs(); showOrgs(); draw();
        if(window.requestAnimationFrame) requestAnimationFrame(function(){ requestAnimationFrame(function(){ stage.classList.remove('is-build'); }); }); else stage.classList.remove('is-build');
        if(cue.active()) cue.place();
      }

      /* ---------------------------------------------------- "?": the numbers behind this setting */
      var ref = document.createElement('div'); ref.className = 'ls-sec ef2-ref';
      function num(x){ return Math.round(x).toLocaleString('en-US'); }
      function sig(x){ var d = x >= 100 ? 0 : x >= 10 ? 1 : x >= 1 ? 2 : 3; return Number(M.fixed(x, d)).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
      function pyramid(title, unit, cls, vals, labels, note){
        var row = 52, h = 36 + row * vals.length, Wp = 280, max = Math.max.apply(null, vals), q = ['<text class="ef-ttl" x="160" y="20" text-anchor="middle">' + esc(title) + '</text>'], A = window.ApBioArt;
        vals.forEach(function(v, i){
          var y = h - row * (i + 1), w = v > 0 ? Math.max(2, Wp * v / max) : 0;
          q.push('<rect class="ef-bar ' + cls + '" x="' + (160 - w / 2).toFixed(1) + '" y="' + (y + 22) + '" width="' + w.toFixed(1) + '" height="30" rx="' + Math.min(4, w / 2).toFixed(1) + '"/>');
          if(A && A.has(labels[i])) q.push(A.icon(labels[i], 160 - Math.max(w, 30) / 2 - 16, y + 37, 24, 'ef-o l' + i));
          q.push('<text class="ef-lab" x="160" y="' + (y + 16) + '" text-anchor="middle">' + esc(labels[i] + ': ' + sig(v) + ' ' + unit) + '</text>');
        });
        var desc = title + ' (bar widths to scale), producers at the bottom: ' + vals.map(function(v, i){ return labels[i] + ' ' + sig(v) + ' ' + unit; }).join('; ') + '.' + (note ? ' ' + note : '');
        return '<svg class="ef-pyr" viewBox="-10 0 340 ' + h + '" role="img" aria-label="' + esc(desc) + '">' + q.join('') + '</svg>';
      }
      function refHtml(){
        var s = sim(S.gpp, S.eff), L = s.levels, top = L[NL - 1], NAMES = data.levelNames, p = Math.round(S.eff * 100);
        var water = data.ecosystems.filter(function(e){ return e.id === 'water'; })[0];
        var sw = water ? E.simulate(cond({ pb: water.pb })) : null;
        var series = []; for(var e = EX.eff.min; e <= EX.eff.max + 1e-9; e += 0.05) series.push(M.round(e, 2));
        ref.innerHTML = '<p class="ef2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>' +
          '<h3 class="ls-title-l">This setting: ' + num(S.gpp) + ' kcal/m²/yr captured, ' + p + '% passed on</h3>' +
          '<dl class="bt-readout"><div><dt>Captured by the grass (GPP)</dt><dd>' + num(s.gpp) + ' kcal/m²/yr</dd></div><div><dt>Grass respiration (heat)</dt><dd>' + num(L[0].heat) + '</dd></div>' +
          '<div><dt>Stored in the grass (NPP)</dt><dd>' + num(s.npp) + '</dd></div><div><dt>Stored by the top level</dt><dd>' + sig(top.stored) + ' (' + M.fixed(s.topShare * 100, s.topShare < 0.01 ? 2 : 1) + '% of NPP)</dd></div>' +
          '<div><dt>All heat from respiration</dt><dd>' + num(s.heat) + '</dd></div><div><dt>To decomposers</dt><dd>' + num(s.decomp) + '</dd></div></dl>' +
          '<p class="bt-small">' + esc(EX.note) + '</p>' +
          '<h3 class="ls-title-l">Where each level’s energy goes</h3>' +
          T.dataTable(['Trophic level', 'Takes in (kcal/m²/yr)', 'Lost as heat in respiration', 'Not eaten or absorbed: to decomposers', 'Stored in new tissue', 'Drawn in the picture', 'Biomass (g/m²)'], L.map(function(x, i){
            return [esc(NAMES[i] + ' (' + ORG[i].toLowerCase() + ')'), i ? sig(x.inE) : num(x.inE) + ' (GPP)', sig(x.heat), sig(x.decomp), sig(x.stored), String(count(x.stored)), sig(x.biomass)]; }), 'Every level at this setting') +
          '<p class="bt-small">Of the energy a level stores, ' + p + '% ends up stored in the next level. The other ' + (100 - p) + '% is lost on the way: part is never eaten or absorbed and goes to decomposers, and the level that eats the rest uses ' + Math.round(D.resp * 100) + '% of what it absorbs in cellular respiration. Decomposers respire too, so all of it leaves the ecosystem as heat in the end, which is why the picture draws the whole loss as heat. The grass also loses ' + Math.round(D.prodResp * 100) + '% of the energy it captures as heat from its own respiration before any animal eats.</p>' +
          '<h3 class="ls-title-l">The pyramids</h3><div class="bt-stage two ef-stage"><div class="bt-fig">' + pyramid('Energy stored (kcal/m²/yr)', 'kcal', 'en', L.map(function(x){ return x.stored; }), ORG) + '</div><div class="bt-fig">' +
          pyramid('Biomass (g/m², dry)', 'g/m²', 'bm', L.map(function(x){ return x.biomass; }), ORG) + '</div></div>' +
          (sw ? '<p class="bt-small">A pyramid of energy always narrows upward. A pyramid of biomass usually does, but not always. In the open ocean the producers (phytoplankton) are eaten and replaced about ' + water.pb[0] + ' times a year, so a small mass of them feeds a larger mass of zooplankton:</p>' +
            '<div class="bt-stage two ef-stage"><div class="bt-fig">' + pyramid('Open ocean: energy stored (kcal/m²/yr)', 'kcal', 'en', sw.levels.map(function(x){ return x.stored; }), water.organisms.slice(0, NL)) + '</div><div class="bt-fig">' +
            pyramid('Open ocean: biomass (g/m², dry)', 'g/m²', 'bm', sw.levels.map(function(x){ return x.biomass; }), water.organisms.slice(0, NL), 'Not a pyramid: the zooplankton hold more biomass than the phytoplankton below them.') + '</div></div>' : '') +
          '<h3 class="ls-title-l">Passing on more, or less</h3>' +
          T.dataTable(['Share passed on'].concat(ORG.map(function(nm){ return nm + ' store (kcal/m²/yr)'; })).concat([ORG[NL - 1] + ' drawn']), series.map(function(ef){ var x = sim(S.gpp, ef).levels; return [Math.round(ef * 100) + '%'].concat(x.map(function(l){ return sig(l.stored); })).concat([String(count(x[NL - 1].stored))]); }), 'This sunlight, four shares') +
          '<h3 class="ls-title-l">A toxin that is not broken down (Topic 8.7)</h3>' +
          T.dataTable(['Trophic level', 'Toxin in its tissue (ppm)'], L.map(function(x, i){ return [esc(ORG[i]), sig(x.conc)]; }), 'Biomagnification up this chain') +
          '<p class="bt-small">Energy thins out up a food chain, but a toxin the body cannot break down does the opposite. Each level keeps the toxin from all the food it absorbs while it burns ' + Math.round(D.resp * 100) + '% of that food in respiration, so its concentration is ' + M.fixed(s.factor, 0) + ' times its food’s: from ' + sig(L[0].conc) + ' ppm in the grass to ' + sig(top.conc) + ' ppm in the ' + ORG[NL - 1].toLowerCase() + '.</p>';
      }
      ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(ctx.studio) ctx.studio.close(); if(S.mode !== 'explore' && ctx.studio && ctx.studio.kit2) ctx.studio.kit2.go('explore'); setTimeout(startTour, 60); });

      /* ---------------------------------------------------- the two modes */
      function shown(mode){
        S.mode = mode;
        if(mode !== 'explore'){ hideCue(false); stopPlay(); stopTween(); return; }
        prev = null; gest = false; took = false; stopTween(); snap(); wKey = ''; syncWords(); refHtml();
        setTimeout(function(){ layoutNow(); if(!tour.active()) cue.show(); }, 30);
      }
      ctx.kit2 = { stage: stage, ref: ref, questionsLabel: 'Food chain questions', onShow: function(m){ shown(m); } };
      snap(); words(); refHtml();
      T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
      if(data.frq) T.frq(app, data.frq, SLUG);
      // Without the frame (no Tool Studio on the page) the stage still works on its own, above the questions.
      if(!ctx.studio){ app.insertBefore(stage, app.firstChild); app.insertBefore(ref, stage.nextSibling); shown('explore'); }
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(layoutNow, 50); }).observe(sceneBox); }
      else window.addEventListener('resize', layoutNow);
    }, { studio: { kit2: function(ctx){ return ctx.kit2; } } });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApBioBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var l2 = document.createElement('link'); l2.rel = 'stylesheet'; l2.href = (window.ApBioBase || '../') + 'assets/tools/energy-flow.css'; document.head.appendChild(l2);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; document.head.appendChild(sc);
  }
})();
