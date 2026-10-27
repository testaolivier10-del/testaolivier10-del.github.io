/* Dose and response trainer page (docs/apenv-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T4). Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.doseResponse (environmental-science/assets/tools/math/dose-response.js), the
   content environmental-science/data/tools/dose-response.json (served filtered as
   assets/tool-data/dose-response.json). The frame is ApEnvTools.modes
   (Explore, then Test yourself) on the Tool Studio.

   Explore, three scenes (the Scene switch):
     Dose        100 test mice beside the dose-response curve. Drag along the
                 curve (or the Dose slider): the mice that die at that dose
                 turn grey, the readout gives the percent, and the threshold
                 (no effect) and the LD50 (half died) are marked with their
                 guides. Pick one of three invented chemicals; "Compare all
                 three" draws every curve: lower LD50, more toxic.
     Food chain  biomagnification: water, zooplankton, small fish, large
                 fish, fish-eating bird, each with its concentration in ppm
                 (dots and a log-scale bar), "× factor" on every arrow.
     One fish    bioaccumulation: one fish over its life, intake faster than
                 excretion, its tissue concentration rising with age.
   The two words are kept apart by scene and by color: biomagnification
   (across trophic levels) and bioaccumulation (one organism, over time).
   Test yourself: ApEnvTools.drill over the model's generate(), with a stage
   figure from the problem's own numbers that reveals a value only after its
   step is answered. */
(function(){
  'use strict';
  var T = window.ApEnvTools, M = window.ApEnvMath, P = window.ApEnvPlot;
  if(!T || !M || !M.doseResponse) return;
  var D = M.doseResponse, esc = T.esc;
  function F(x, d){ return T.F(x, d == null ? 0 : d); }
  function big(x){ return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function ppm(x){ return D.dec(x) + ' ppm'; }
  var VIEWS = [{ v: 'dose', label: 'Dose' }, { v: 'chain', label: 'Food chain' }, { v: 'fish', label: 'One fish' }];
  /* Label placement. Each label tries its candidate spots in order and takes
     the first that clears the lines drawn (rays, curves), the boxes already
     taken (labels, art), the picture's edges, an optional area it must stay
     in, and the Enlarge button's corner (bottom right, 52 x 48). A label with
     no clear spot is counted; the scene writes the count to the svg's
     data-clash, which the browser sweep checks at every slider extreme. */
  var MEAS = null;
  function textW(t, size, weight){
    try{
      if(!MEAS) MEAS = document.createElement('canvas').getContext('2d');
      MEAS.font = (weight || 800) + ' ' + size + 'px ' + ((getComputedStyle(document.body).getPropertyValue('--font-ui') || '').trim() || 'sans-serif');
      return MEAS.measureText(String(t)).width;
    }catch(e){ return String(t).length * size * 0.58; }
  }
  function boxOf(x, y, w, size, a){ var x0 = a === 'end' ? x - w : a === 'middle' ? x - w / 2 : x; return { x0: x0 - 3, x1: x0 + w + 3, y0: y - size * 0.82 - 2, y1: y + size * 0.24 + 2 }; }
  function layout(W, H, o){
    o = o || {};
    var lines = [], rects = [], clash = 0, misses = [], ENL = o.enl === false ? null : { x0: W - 52, y0: H - 48, x1: W, y1: H };
    function over(a, b){ return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1; }
    function hit(b, ax, ay, bx, by, pad){
      var x0 = b.x0 - pad, x1 = b.x1 + pad, y0 = b.y0 - pad, y1 = b.y1 + pad, dx = bx - ax, dy = by - ay, t0 = 0, t1 = 1;
      var p = [-dx, dx, -dy, dy], q = [ax - x0, x1 - ax, ay - y0, y1 - ay];
      for(var i = 0; i < 4; i++){
        if(p[i] === 0){ if(q[i] < 0) return false; }
        else { var r = q[i] / p[i]; if(p[i] < 0){ if(r > t1) return false; if(r > t0) t0 = r; } else { if(r < t0) return false; if(r < t1) t1 = r; } }
      }
      return true;
    }
    function ok(b, within){
      var A = within || { x0: 1, y0: 1, x1: W - 1, y1: H - 1 };
      if(b.x0 < A.x0 || b.y0 < A.y0 || b.x1 > A.x1 || b.y1 > A.y1) return false;
      if(ENL && over(b, ENL)) return false;
      for(var i = 0; i < rects.length; i++) if(over(b, rects[i])) return false;
      for(var j = 0; j < lines.length; j++){ var L = lines[j]; for(var k = 1; k < L.p.length; k++) if(hit(b, L.p[k - 1][0], L.p[k - 1][1], L.p[k][0], L.p[k][1], L.pad)) return false; }
      return true;
    }
    return {
      line: function(pts, pad){ if(pts && pts.length > 1) lines.push({ p: pts, pad: pad == null ? 2 : pad }); },
      rect: function(x0, y0, x1, y1){ rects.push({ x0: Math.min(x0, x1), y0: Math.min(y0, y1), x1: Math.max(x0, x1), y1: Math.max(y0, y1) }); },
      place: function(text, size, weight, cands, opt){
        opt = opt || {};
        var w = textW(text, size, weight), pick = null;
        for(var i = 0; i < cands.length; i++){ var c = cands[i], b = boxOf(c[0], c[1], w, size, c[2]); if(ok(b, opt.within)){ pick = { x: c[0], y: c[1], a: c[2] || 'start', b: b }; break; } }
        if(!pick){ if(opt.optional) return null; clash++; misses.push(text); var c0 = cands[0]; pick = { x: c0[0], y: c0[1], a: c0[2] || 'start', b: boxOf(c0[0], c0[1], w, size, c0[2]) }; }
        rects.push(pick.b); pick.w = w; return pick;
      },
      box: function(w, h, cands, opt){
        opt = opt || {};
        for(var i = 0; i < cands.length; i++){ var b = { x0: cands[i][0], y0: cands[i][1], x1: cands[i][0] + w, y1: cands[i][1] + h }; if(ok(b, opt.within)){ rects.push(b); return b; } }
        clash++; var f = { x0: cands[0][0], y0: cands[0][1], x1: cands[0][0] + w, y1: cands[0][1] + h }; rects.push(f); return f;
      },
      clash: function(){ return clash; }, misses: function(){ return misses; }
    };
  }
  /* Candidate spots on a grid, nearest a point first. */
  function grid(xs, ys, near, a){
    var out = [];
    ys.forEach(function(y){ xs.forEach(function(x){ out.push([x, y, a || 'middle']); }); });
    if(near) out.sort(function(p, q){ return Math.hypot(p[0] - near[0], p[1] - near[1]) - Math.hypot(q[0] - near[0], q[1] - near[1]); });
    return out;
  }
  function steps(a, b, n){ var out = []; for(var i = 0; i <= n; i++) out.push(a + (b - a) * i / n); return out; }
  function at(p){ return 'x="' + p.x.toFixed(1) + '" y="' + p.y.toFixed(1) + '" text-anchor="' + p.a + '"'; }
  function bgr(p, cls){ return '<rect class="' + cls + '" x="' + p.b.x0.toFixed(1) + '" y="' + p.b.y0.toFixed(1) + '" width="' + (p.b.x1 - p.b.x0).toFixed(1) + '" height="' + (p.b.y1 - p.b.y0).toFixed(1) + '" rx="4"/>'; }

  T.mount('dose-response', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'dose-response',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* The first-run tip sits just above its target; an empty slot is opened
     there while the tip shows, so it never covers another control. */
  function hintSlot(s, target, text, before){
    if(!target) return;
    var slot = document.createElement('div');
    slot.className = 'env-tipslot'; slot.setAttribute('aria-hidden', 'true');
    (before || target).parentNode.insertBefore(slot, before || target);
    var h = s.hint({ target: target, text: text });
    if(!h){ slot.remove(); return; }
    var EV = ['pointerdown', 'keydown', 'input', 'change'];
    function done(e){ if(e && e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return; slot.remove(); EV.forEach(function(t){ s.root.removeEventListener(t, done, true); }); if(h.place) h.place(); }
    EV.forEach(function(t){ s.root.addEventListener(t, done, true); });
    if(h.place) h.place();
  }

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var E = data.explore || {}, view = 'dose', chem = 0, dose = 20, all = false, factor = 10, age = 4, c0 = E.c0 || 0.00002;
    var FACT = E.factors || [2, 5, 10, 20], touched = false, LS = null, nid = T.nid('dr');
    var CH = D.CHEMICALS, LD = CH.map(function(c){ return D.ld50(c.points); }), TH = CH.map(function(c){ return D.threshold(c.points); });
    var MAXD = CH[0].points[CH[0].points.length - 1][0];
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem dr-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Dose and response</h2>' +
      '<div class="dr-fig"><svg class="dr-svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<div class="dr-ctl">' +
        '<div class="ls-seg dr-views" role="group" aria-label="Scene">' + VIEWS.map(function(x){ return '<button type="button" data-v="' + x.v + '" aria-pressed="false">' + x.label + '</button>'; }).join('') + '</div>' +
        '<div class="dr-grp dr-grp-dose"><div class="ls-seg dr-chems" role="group" aria-label="Chemical">' + CH.map(function(c, i){ return '<button type="button" data-c="' + i + '" aria-pressed="false">' + esc(c.name.split(' ')[0]) + ' ' + esc(c.name.split(' ')[1]) + '</button>'; }).join('') + '</div></div>' +
        '<div class="dr-grp dr-grp-chain"></div><div class="dr-grp dr-grp-fish"></div>' +
      '</div>' +
      '<div class="dr-say"></div>' +
      T.moreHtml('<label class="bt-radio dr-opt"><input type="checkbox" class="dr-all"> Compare all three chemicals on one graph</label><p class="bt-small">The three chemicals are invented for practice.</p>', 'compare chemicals') +
      '<div class="dr-nums"></div><p class="sr-only dr-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.dr-live'));
    var cue = T.cue('Drag along the curve: find the dose where half the mice die.');
    $('.dr-ctl').insertBefore(cue.el, $('.dr-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var svg = $('.dr-svg');
    var sDose = T.slider({ label: 'Dose', min: 0, max: MAXD, step: 1, value: dose, unit: 'mg/kg', onInput: function(v){ act(); dose = v; draw(); words(); say(doseLine()); } });
    $('.dr-grp-dose').appendChild(sDose.el);
    var sF = T.slider({ label: 'Concentration factor per step up', min: 0, max: FACT.length - 1, step: 1, value: FACT.indexOf(factor) > -1 ? FACT.indexOf(factor) : 0, onInput: function(v){ act(); factor = FACT[v]; draw(); words(); say(chainLine()); } });
    relabel(sF, function(v){ return '× ' + FACT[v]; });
    factor = FACT[+sF.input.value];
    $('.dr-grp-chain').appendChild(sF.el);
    var sA = T.slider({ label: 'Age of the fish', min: 0, max: 12, step: 1, value: age, unit: 'years', onInput: function(v){ act(); age = v; draw(); words(); say(fishLine()); } });
    $('.dr-grp-fish').appendChild(sA.el);
    function relabel(s, fn){
      var out = s.el.querySelector('output'), inp = s.input;
      function show(){ out.textContent = fn(+inp.value); inp.setAttribute('aria-valuetext', fn(+inp.value)); }
      inp.addEventListener('input', show); s.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', show); });
      var set0 = s.set; s.set = function(v, fire){ set0(v, fire); show(); }; show();
    }
    function onClick(e){
      var b = e.target.closest('.dr-views button');
      if(b){ setView(b.getAttribute('data-v')); return; }
      var c = e.target.closest('.dr-chems button');
      if(c){ act(); chem = +c.getAttribute('data-c'); sync(); draw(); words(); say(CH[chem].name + '. LD50 ' + LD[chem] + ' mg/kg. ' + doseLine()); }
    }
    host.addEventListener('click', onClick);
    $('.dr-all').addEventListener('change', function(e){ act(); all = e.target.checked; draw(); words(); });
    function setView(v){ if(v === view) return; act(); view = v; sync(); draw(); words(); say(v === 'dose' ? doseLine() : v === 'chain' ? chainLine() : fishLine()); }
    function sync(){
      var root = LS ? LS.root : host;
      root.querySelectorAll('.dr-views button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === view)); });
      root.querySelectorAll('.dr-chems button').forEach(function(b){ b.setAttribute('aria-pressed', String(+b.getAttribute('data-c') === chem)); });
      ['dose', 'chain', 'fish'].forEach(function(k){ var el = $('.dr-grp-' + k); if(el) el.hidden = k !== view; });
      var o = $('.dr-opt'); if(o) o.hidden = view !== 'dose';
      if(LS && LS.setupRow) LS.setupRow.setup(view === 'dose' ? (all ? 'All three chemicals' : CH[chem].name) : view === 'chain' ? 'Water ' + ppm(c0) : 'Lake trout');
    }

    /* ------------------------------------------------- numbers and words */
    function resp(i, d){ return D.responseAt(CH[i].points, d == null ? dose : d); }
    function doseLine(){ var r = resp(chem); return CH[chem].name + ' at ' + dose + ' mg/kg: ' + Math.round(r) + ' of 100 mice die' + (dose <= TH[chem] ? ' (at or below the threshold, no effect seen).' : Math.abs(dose - LD[chem]) < 0.5 ? ', the LD50.' : '.'); }
    function levels(){ return D.chainLevels(c0, factor); }
    function chainLine(){ var L = levels(); return 'Factor ' + factor + ' per step. ' + D.CHAIN.map(function(c, i){ return c.name + ' ' + ppm(L[i]); }).join(', ') + '.'; }
    var CMAX = 1.2;
    function fishC(a){ return D.accumulate(CMAX, a); }
    function fishLine(){ return 'A ' + age + '-year-old trout holds ' + F(fishC(age), 2) + ' ppm mercury in its tissue.'; }
    function words(){
      var head, sub = '', why;
      if(view === 'dose'){
        var r = resp(chem);
        head = dose + ' mg/kg: ' + Math.round(r) + '% of the mice die.';
        sub = dose <= TH[chem] ? 'At or below the threshold (' + TH[chem] + ' mg/kg): no effect seen.' : Math.abs(dose - LD[chem]) < 0.5 ? 'This is the LD50: the dose that kills half the test population.' : r < 50 ? 'Keep going: the LD50 is where the curve crosses 50%.' : 'Past the LD50 (' + LD[chem] + ' mg/kg): most of the test population dies.';
        if(all) sub += ' Lowest LD50, most toxic: ' + CH[0].name + '.';
        why = doseWhy();
      } else if(view === 'chain'){
        var L = levels();
        head = 'Biomagnification: ' + ppm(L[0]) + ' in the water becomes ' + ppm(L[4]) + ' in the bird.';
        sub = 'That is ' + big(Math.round(L[4] / L[0])) + ' times the water, a factor of ' + factor + ' at each of 4 steps (' + factor + '^4).';
        why = chainWhy();
      } else {
        head = 'Bioaccumulation: at ' + age + ' years this trout holds ' + F(fishC(age), 2) + ' ppm.';
        sub = 'It takes in mercury faster than it gets rid of it, so the amount in one fish rises with age.';
        why = fishWhy();
      }
      T.explain($('.dr-say'), '<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), why);
      nums();
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), 'explore');
        if(view === 'dose'){
          LS.pills([{ k: 'Dose', html: dose + ' mg/kg', tone: 'readout' }], 'left', 'explore');
          LS.pills([{ k: 'Died', html: Math.round(resp(chem)) + '%', tone: resp(chem) >= 50 ? 'bad' : resp(chem) > 0 ? 'warn' : 'good' }], 'right', 'explore');
        } else if(view === 'chain'){
          LS.pills([{ k: 'Each step', html: '× ' + factor, tone: 'readout' }], 'left', 'explore');
          LS.pills([{ k: 'Bird', html: ppm(levels()[4]), tone: 'warn' }], 'right', 'explore');
        } else {
          LS.pills([{ k: 'Age', html: age + ' yr', tone: 'readout' }], 'left', 'explore');
          LS.pills([{ k: 'In its tissue', html: F(fishC(age), 2) + ' ppm', tone: fishC(age) > 0.3 ? 'warn' : 'good' }], 'right', 'explore');
        }
      }
    }
    function doseWhy(){
      return '<p><b>The dose-response curve.</b> A toxicity test gives groups of animals increasing doses (mg of chemical per kg of body mass) and records the percent that respond. Here the response is death.</p>' +
        '<p><b>Threshold.</b> Below some dose there is no observed effect: the flat start of the curve. For ' + esc(CH[chem].name) + ' that is ' + TH[chem] + ' mg/kg.</p>' +
        '<p><b>LD50</b> is the dose that kills 50% of the test population: across from 50% on the y-axis to the curve, then down. ' + esc(CH[chem].name) + ': ' + LD[chem] + ' mg/kg. <b>A lower LD50 means a more toxic chemical</b>, because less of it kills half the animals. Of the three, ' + esc(CH[0].name) + ' (' + LD[0] + ' mg/kg) is the most toxic.</p>' +
        '<p><b>Per kg.</b> Doses are per kg of body mass, so a small animal or a child is harmed by a smaller total amount: multiply by body mass for the whole dose.</p>';
    }
    function chainWhy(){
      return '<p><b>Why concentrations rise.</b> Persistent, fat-soluble chemicals (DDT, mercury, PCBs) are stored in fat instead of being excreted. Each predator eats many prey and keeps nearly all of their chemical, while most of the prey\'s mass is used for energy (the 10% rule).</p>' +
        '<p><b>Count the steps.</b> With a factor of ' + factor + ' per step, 4 steps from water to bird multiply by ' + factor + '^4 = ' + big(Math.pow(factor, 4)) + '. Top predators carry the most: DDT thinned the eggshells of ospreys, eagles and pelicans.</p>' +
        '<p><b>Keep the words apart.</b> <span class="dr-k-mag">Biomagnification</span>: the increase from one trophic level to the next. <span class="dr-k-acc">Bioaccumulation</span>: the build-up in one organism over its life (the One fish scene).</p>';
    }
    function fishWhy(){
      return '<p><b>Bioaccumulation</b> happens inside one organism: every day it takes in a little of a persistent chemical with its food and water, and gets rid of it more slowly, so the amount in its tissue rises with age.</p>' +
        '<p><b>Why it matters.</b> Older, larger fish carry more mercury, so fish advisories tell people (especially pregnant women and children) to eat fewer large, long-lived fish such as tuna and swordfish.</p>' +
        '<p><b>Not the same as biomagnification</b>, which compares different trophic levels (the Food chain scene).</p>';
    }
    function nums(){
      var box = $('.dr-nums'), h = '';
      if(view === 'dose'){
        var show = all ? [0, 1, 2] : [chem];
        h = '<h3 class="ls-title-l">Test results: percent of the test population that died</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Dose-response test results"><table class="ls-tbl"><caption class="sr-only">Percent responding at each dose</caption><thead><tr><th scope="col">Dose (mg/kg)</th>' + show.map(function(i){ return '<th scope="col">' + esc(CH[i].name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          CH[0].points.map(function(p, k){ return '<tr><th scope="row">' + p[0] + '</th>' + show.map(function(i){ return '<td class="r">' + CH[i].points[k][1] + '%</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
          '<p class="bt-small">' + show.map(function(i){ return esc(CH[i].name) + ': threshold ' + TH[i] + ' mg/kg, LD50 ' + LD[i] + ' mg/kg'; }).join('; ') + '. Invented data for practice.</p>';
      } else if(view === 'chain'){
        var L = levels();
        h = '<h3 class="ls-title-l">Concentration at each trophic level</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Concentrations up the food chain"><table class="ls-tbl"><caption class="sr-only">ppm at each level</caption><thead><tr><th scope="col">Level</th><th scope="col">Setup</th><th scope="col">ppm</th></tr></thead><tbody>' +
          D.CHAIN.map(function(c, i){ return '<tr><th scope="row">' + esc(c.name) + '</th><td>' + D.dec(c0) + ' × ' + factor + '^' + i + '</td><td class="r">' + D.dec(L[i]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      } else {
        h = '<h3 class="ls-title-l">Mercury in one trout, by age</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Mercury by age"><table class="ls-tbl"><caption class="sr-only">ppm by age</caption><thead><tr><th scope="col">Age (years)</th><th scope="col">ppm in tissue</th></tr></thead><tbody>' +
          [0, 1, 2, 4, 6, 8, 10, 12].map(function(a){ return '<tr' + (a === age ? ' class="hl"' : '') + '><th scope="row">' + a + '</th><td class="r">' + F(fishC(a), 2) + '</td></tr>'; }).join('') + '</tbody></table></div><p class="bt-small">An explanatory curve (intake faster than excretion, leveling off), not data from a real lake.</p>';
      }
      box.innerHTML = h;
    }

    /* ---------------------------------------------------- the picture */
    function size(){ var rc = $('.dr-fig').getBoundingClientRect(); return [Math.max(300, Math.min(1500, Math.round(rc.width) || 640)), Math.max(320, Math.min(1000, Math.round(rc.height) || 480))]; }
    var GEO = null;
    function draw(){
      var wh = size(), Wd = wh[0], H = wh[1];
      svg.setAttribute('viewBox', '0 0 ' + Wd + ' ' + H); svg.setAttribute('width', Wd); svg.setAttribute('height', H);
      var out = view === 'dose' ? doseScene(Wd, H) : view === 'chain' ? chainScene(Wd, H) : fishScene(Wd, H);
      svg.innerHTML = out.svg; svg.setAttribute('aria-label', out.label);
      svg.classList.toggle('is-drag', view === 'dose');
    }
    var ORDER = M.shuffle(M.rng(23), Array.apply(null, Array(100)).map(function(_, i){ return i; }));
    function doseScene(Wd, H){
      var phone = Wd < 640, g = [];
      // On a phone the 100 mice sit 10 to a row beside a key, about twice the old size (tool-audit: mice 12 px).
      var gridBox = phone ? { x: 8, y: 8, w: Wd - 16, h: Math.round(H * 0.46) } : { x: 16, y: 16, w: Math.round(Wd * 0.34), h: H - 32 };
      var plot = phone ? { x0: 46, x1: Wd - 14, y0: gridBox.y + gridBox.h + 40, y1: H - 64 } : { x0: gridBox.x + gridBox.w + 64, x1: Wd - 20, y0: 44, y1: H - 64 };
      // the mice
      var cols = 10, rows = 100 / cols, cw = gridBox.w / cols, chh = (gridBox.h - 26 - (phone ? 0 : 22)) / rows, sz = Math.min(cw, chh);
      var deadN = Math.round(resp(chem));
      g.push('<text class="dr-h" x="' + gridBox.x + '" y="' + (gridBox.y + 12) + '">100 test mice, ' + dose + ' mg/kg</text><text class="dr-h dr-c-bad" x="' + (gridBox.x + gridBox.w) + '" y="' + (gridBox.y + 12) + '" text-anchor="end">' + deadN + ' died</text>');
      var gx = gridBox.x + (gridBox.w - cols * sz) / 2, gy = gridBox.y + 22 + (gridBox.h - 26 - (phone ? 0 : 22) - rows * sz) / 2;
      // a key, so dead and alive differ by shape and word, not only by colour
      var kx = phone ? gx + cols * sz + 8 : gridBox.x + 4, ky = phone ? gy + sz * 1.2 : gy + rows * sz + 16, ks = phone ? Math.max(14, sz * 0.86) : sz * 0.7;
      if(phone && gx > 70){ kx = gridBox.x + 2; gx = gridBox.x + gridBox.w - cols * sz; }
      g.push(mouse(kx + ks * 0.6, ky, ks, false) + '<text class="dr-key" x="' + (kx + ks * 1.4) + '" y="' + (ky + 4) + '">alive</text>' +
        mouse(kx + ks * 0.6, ky + ks * 1.6, ks, true) + '<text class="dr-key" x="' + (kx + ks * 1.4) + '" y="' + (ky + ks * 1.6 + 4) + '">died</text>');
      for(var k = 0; k < 100; k++){
        var c = k % cols, rr = Math.floor(k / cols), dead = ORDER.indexOf(k) < deadN;
        g.push(mouse(gx + (c + 0.5) * sz, gy + (rr + 0.55) * sz, sz * 0.86, dead));
      }
      // the curve(s)
      var X = function(d){ return plot.x0 + d / MAXD * (plot.x1 - plot.x0); }, Y = function(v){ return plot.y1 - v / 100 * (plot.y1 - plot.y0); };
      GEO = { X: X, plot: plot };
      [0, 25, 50, 75, 100].forEach(function(v){ g.push('<line class="dr-grid" x1="' + plot.x0 + '" x2="' + plot.x1 + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="dr-tk" x="' + (plot.x0 - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '%</text>'); });
      for(var d = 0; d <= MAXD; d += (phone ? 40 : 20)) g.push('<text class="dr-tk" x="' + X(d).toFixed(1) + '" y="' + (plot.y1 + 16) + '" text-anchor="middle">' + d + '</text>');
      // threshold band
      var th = TH[chem];
      g.push('<rect class="dr-thband" x="' + plot.x0 + '" y="' + plot.y0 + '" width="' + (X(th) - plot.x0).toFixed(1) + '" height="' + (plot.y1 - plot.y0) + '"/><text class="dr-tk dr-c-good" x="' + (plot.x0 + 4) + '" y="' + (plot.y0 + 14) + '">' + (X(th) - plot.x0 > 60 ? 'no effect' : '') + '</text>');
      var show = all ? [0, 1, 2] : [chem];
      show.forEach(function(i){
        var pts = CH[i].points;
        g.push('<polyline class="dr-curve dr-' + CH[i].cls + (i === chem ? ' is-sel' : '') + '" points="' + pts.map(function(p){ return X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join(' ') + '"/>');
        pts.forEach(function(p){ g.push('<circle class="dr-pt dr-' + CH[i].cls + '" cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="' + (i === chem ? 3.4 : 2.6) + '"/>'); });
        if(all){ var lx = X(LD[i]); g.push('<line class="dr-ldl dr-' + CH[i].cls + '" x1="' + lx.toFixed(1) + '" x2="' + lx.toFixed(1) + '" y1="' + Y(50).toFixed(1) + '" y2="' + plot.y1 + '"/>'); }
      });
      // LD50 guides for the chosen chemical; labels placed clear of the curves and each other
      var L = LD[chem], lx = X(L), ly = Y(50), Lo = layout(Wd, H), INP = { x0: plot.x0 + 2, y0: plot.y0 - 2, x1: plot.x1, y1: plot.y1 - 6 };
      show.forEach(function(i){ Lo.line(CH[i].points.map(function(p){ return [X(p[0]), Y(p[1])]; }), 3); });
      Lo.line([[plot.x0, ly], [lx, ly], [lx, plot.y1]], 1);
      g.push('<path class="dr-guide" d="M' + plot.x0 + ' ' + ly.toFixed(1) + ' H' + lx.toFixed(1) + ' V' + plot.y1 + '"/>');
      g.push('<circle class="dr-ld" cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="6"/>');
      g.push('<path class="dr-thmark" d="M' + X(th).toFixed(1) + ' ' + (plot.y1 - 10) + ' V' + (plot.y1 + 2) + '"/>');
      var dx = X(dose), dy = Y(resp(chem));
      g.push('<line class="dr-now" x1="' + dx.toFixed(1) + '" x2="' + dx.toFixed(1) + '" y1="' + plot.y0 + '" y2="' + plot.y1 + '"/><circle class="dr-now-pt" cx="' + dx.toFixed(1) + '" cy="' + dy.toFixed(1) + '" r="7"/>');
      Lo.rect(lx - 8, ly - 8, lx + 8, ly + 8); Lo.rect(dx - 9, dy - 9, dx + 9, dy + 9); Lo.rect(plot.x0 - 40, plot.y1 + 2, plot.x1 + 10, plot.y1 + 40);
      var rt = Math.round(resp(chem)) + '%', right = dx > (plot.x0 + plot.x1) / 2;
      var rp = Lo.place(rt, 16, 900, [[dx + (right ? -12 : 12), dy - 10, right ? 'end' : 'start'], [dx + (right ? 12 : -12), dy - 10, right ? 'start' : 'end'], [dx + (right ? -12 : 12), dy + 22, right ? 'end' : 'start'], [dx + (right ? 12 : -12), dy + 22, right ? 'start' : 'end'], [dx, dy - 16, 'middle'], [dx, dy + 28, 'middle']].concat(grid(steps(plot.x0 + 20, plot.x1 - 4, 16), steps(plot.y0 + 16, plot.y1 - 4, 10), [dx, dy], 'middle')), { within: INP });
      var lp = Lo.place('LD50 = ' + L + ' mg/kg', 13.5, 900, [[lx + 10, ly + 18, 'start'], [lx + 10, ly + 34, 'start'], [lx - 10, ly - 10, 'end'], [lx + 10, ly + 50, 'start'], [lx - 10, ly - 26, 'end']].concat(grid(steps(plot.x0 + 10, plot.x1 - 4, 16), steps(ly - 60, ly + 80, 12), [lx, ly], 'start')), { within: INP });
      var tt = 'threshold ' + th, tx = X(th);
      var tp = Lo.place(tt, 12.5, 800, [[tx, plot.y1 - 14, 'middle'], [tx + 4, plot.y1 - 14, 'start'], [tx + 4, plot.y1 - 30, 'start'], [tx - 4, plot.y1 - 30, 'end'], [tx + 4, plot.y1 - 46, 'start']].concat(grid(steps(plot.x0 + 4, plot.x1 - 4, 16), steps(plot.y1 - 14, plot.y1 - 120, 8), [tx, plot.y1 - 14], 'start')), { within: INP });
      g.push(bgr(tp, 'dr-lbg') + '<text class="dr-lab dr-c-good" ' + at(tp) + '>' + tt + '</text>');
      g.push(bgr(lp, 'dr-lbg') + '<text class="dr-tag" ' + at(lp) + '>LD50 = ' + L + ' mg/kg</text>');
      g.push('<text class="dr-read" ' + at(rp) + '>' + rt + '</text>');
      if(all) show.forEach(function(i){ if(i === chem) return; var x2 = X(LD[i]), y2 = Y(50), t = CH[i].name.split(' ')[1] + ' ' + LD[i];
        var q = Lo.place(t, 12.5, 800, [[x2 + 6, y2 + 16, 'start'], [x2 + 6, y2 + 32, 'start'], [x2 + 6, y2 + 48, 'start'], [x2 - 6, y2 + 16, 'end'], [x2 + 6, y2 + 64, 'start']].concat(grid(steps(plot.x0 + 10, plot.x1 - 4, 16), steps(y2, plot.y1 - 4, 10), [x2, y2], 'start')), { within: INP });
        g.push(bgr(q, 'dr-lbg') + '<text class="dr-lab dr-c-' + CH[i].cls + '" ' + at(q) + '>' + t + '</text>'); });
      svg.setAttribute('data-clash', String(Lo.clash())); svg.setAttribute('data-miss', Lo.misses().join(' | '));
      g.push('<line class="dr-axis" x1="' + plot.x0 + '" x2="' + plot.x1 + '" y1="' + plot.y1 + '" y2="' + plot.y1 + '"/><line class="dr-axis" x1="' + plot.x0 + '" x2="' + plot.x0 + '" y1="' + plot.y0 + '" y2="' + plot.y1 + '"/>');
      if(!phone) g.push('<text class="dr-axl" transform="translate(' + (plot.x0 - 40) + ' ' + ((plot.y0 + plot.y1) / 2).toFixed(1) + ') rotate(-90)" text-anchor="middle">Died (% of the test mice)</text>');
      g.push('<text class="dr-axl" x="' + plot.x0 + '" y="' + (plot.y0 - 12) + '">Percent of test population that died</text><text class="dr-axl" x="' + ((plot.x0 + plot.x1) / 2) + '" y="' + (plot.y1 + 34) + '" text-anchor="middle">Dose (mg per kg of body mass)</text>');
      var label = 'Dose-response curve for ' + CH[chem].name + ' (invented data): threshold ' + th + ' mg/kg, LD50 ' + L + ' mg/kg. At ' + dose + ' mg/kg, ' + deadN + ' of 100 mice died.' + (all ? ' All three curves: LD50 ' + CH.map(function(c, i){ return c.name + ' ' + LD[i]; }).join(', ') + ' mg/kg.' : '');
      return { svg: g.join(''), label: label };
    }
    function mouse(cx, cy, s, dead){
      var k = s / 20;
      // a dead mouse lies on its back with an X for its eye
      return '<g class="dr-mouse' + (dead ? ' is-dead' : '') + '" transform="translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') scale(' + k.toFixed(3) + ')' + (dead ? ' rotate(180)' : '') + '"><path class="dr-tail" d="M-7 2 q-5 1 -4 -5"/><ellipse cx="0" cy="2" rx="7.5" ry="5"/><circle cx="6.5" cy="-1.5" r="3.6"/><circle class="dr-ear" cx="5" cy="-4.6" r="2.1"/>' +
        (dead ? '<path class="dr-x" d="M6.2 -3.2 l2.4 2.4 m0 -2.4 l-2.4 2.4"/><path class="dr-legs" d="M-4 7 v3 M3 7 v3"/>' : '<circle class="dr-eye" cx="8" cy="-2" r=".9"/>') + '</g>';
    }
    function chainScene(Wd, H){
      var phone = Wd < 640, g = [], L = levels(), n = 5, pad = phone ? 8 : 24, colW = (Wd - 2 * pad) / n;
      var artY = phone ? 60 : 80, artH = phone ? Math.min(90, H * 0.22) : Math.min(140, H * 0.28), barTop = artY + artH + (phone ? 64 : 70), barBot = H - (phone ? 46 : 54);
      g.push('<text class="dr-h dr-c-mag" x="' + pad + '" y="22">Biomagnification: across trophic levels</text><text class="dr-tk" x="' + pad + '" y="40">Each step up: × ' + factor + '</text>');
      var lo = -5, hi = 1, LY = function(v){ var l = Math.log10(v); return barBot - (l - lo) / (hi - lo) * (barBot - barTop); };
      [-5, -4, -3, -2, -1, 0, 1].forEach(function(e){ g.push('<line class="dr-grid" x1="' + pad + '" x2="' + (Wd - pad) + '" y1="' + LY(Math.pow(10, e)).toFixed(1) + '" y2="' + LY(Math.pow(10, e)).toFixed(1) + '"/>'); if(!phone || Math.abs(e) % 2 === 1) g.push('<text class="dr-tk" x="' + (pad + 2) + '" y="' + (LY(Math.pow(10, e)) - 3).toFixed(1) + '">' + D.dec(Math.pow(10, e)) + '</text>'); });
      D.CHAIN.forEach(function(c, i){
        var cx = pad + colW * (i + 0.5);
        g.push(art(c.k, cx, artY + artH / 2, Math.min(colW * (c.k === 'large' || c.k === 'bird' ? 0.56 : 0.7), artH), L[i]));
        g.push('<text class="dr-name" x="' + cx.toFixed(1) + '" y="' + (artY + artH + 18) + '" text-anchor="middle">' + esc(phone ? ({ 'Fish-eating bird': 'Bird', 'Zooplankton': 'Zooplankton', 'Small fish': 'Small fish', 'Large fish': 'Large fish', 'Water': 'Water' })[c.name] : c.name) + '</text>');
        g.push('<text class="dr-val" x="' + cx.toFixed(1) + '" y="' + (artY + artH + (phone ? 36 : 38)) + '" text-anchor="middle">' + D.dec(L[i]) + (phone ? '' : ' ppm') + '</text>');
        var bw = Math.min(46, colW * 0.42), by = LY(L[i]);
        g.push('<rect class="dr-bar dr-lv' + i + '" x="' + (cx - bw / 2).toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (barBot - by).toFixed(1) + '" rx="4"/>');
        if(i < n - 1){ var ax = cx + colW * 0.5; g.push('<path class="dr-arrow" d="M' + (ax - 12).toFixed(1) + ' ' + (artY + artH / 2) + ' h24 m-6 -5 l6 5 l-6 5"/><text class="dr-x" x="' + ax.toFixed(1) + '" y="' + (artY + artH / 2 - 10) + '" text-anchor="middle">×' + factor + '</text>'); }
      });
      g.push('<line class="dr-axis" x1="' + pad + '" x2="' + (Wd - pad) + '" y1="' + barBot + '" y2="' + barBot + '"/><text class="dr-axl" x="' + (Wd / 2) + '" y="' + (barBot + 22) + '" text-anchor="middle">' + (phone ? 'ppm (log scale)' : 'ppm, each gridline 10 times the one below (log scale)') + '</text>');
      return { svg: g.join(''), label: 'Food chain from water to a fish-eating bird. ' + chainLine() };
    }
    function dots(cx, cy, r, v){ var n = Math.max(1, Math.min(24, Math.round((Math.log10(v) + 5.3) * 4))), out = '', rr = M.rng(31); for(var i = 0; i < n; i++){ var a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * r; out += '<circle class="dr-tox" cx="' + (cx + Math.cos(a) * d).toFixed(1) + '" cy="' + (cy + Math.sin(a) * d * 0.6).toFixed(1) + '" r="1.8"/>'; } return out; }
    function art(k, cx, cy, s, v){
      var u = s / 100, t = 'translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') scale(' + u.toFixed(3) + ')';
      if(k === 'water') return '<g transform="' + t + '"><path class="dr-drop" d="M0 -42 C18 -14 30 2 30 16 a30 30 0 0 1 -60 0 C-30 2 -18 -14 0 -42 Z"/></g>' + dots(cx, cy + 6 * u, 16 * u, v);
      if(k === 'plankton') return '<g transform="' + t + '" class="dr-zoo"><ellipse cx="0" cy="0" rx="16" ry="24"/><path d="M-14 -16 q-26 -14 -30 -30 M14 -16 q26 -14 30 -30 M-10 20 l-8 16 M10 20 l8 16 M0 24 l0 18"/><circle class="dr-eye" cx="0" cy="-12" r="4"/></g>' + dots(cx, cy, 10 * u, v);
      if(k === 'small') return '<g transform="' + t + ' scale(0.7)" class="dr-fish"><path d="M-40 0 Q-6 -26 36 0 Q-6 26 -40 0 Z M-40 0 L-62 -18 L-62 18 Z"/><circle class="dr-eye" cx="22" cy="-5" r="4"/></g>' + dots(cx, cy, 18 * u, v);
      if(k === 'large') return '<g transform="' + t + '" class="dr-fish is-big"><path d="M-44 0 Q-6 -30 44 0 Q-6 30 -44 0 Z M-44 0 L-68 -22 L-68 22 Z M-6 -20 l12 -16 l10 14"/><circle class="dr-eye" cx="28" cy="-6" r="4.5"/></g>' + dots(cx, cy, 24 * u, v);
      return '<g transform="' + t + '" class="dr-bird"><path d="M-36 6 Q-6 -16 26 -2 L44 -8 L34 4 Q10 24 -26 18 Z"/><path class="dr-wing" d="M-14 0 Q-2 -40 22 -44 Q8 -20 6 2 Z"/><path class="dr-beak" d="M44 -8 L58 -4 L42 -2 Z"/><circle class="dr-eye" cx="36" cy="-6" r="3"/></g>' + dots(cx, cy + 4 * u, 22 * u, v);
    }
    function fishScene(Wd, H){
      var phone = Wd < 640, g = [], pad = phone ? 10 : 24;
      var top = phone ? Math.round(H * 0.36) : 40, artW = phone ? Wd - 2 * pad : Math.round(Wd * 0.4);
      var plot = phone ? { x0: 46, x1: Wd - 14, y0: top + 40, y1: H - 64 } : { x0: pad + artW + 70, x1: Wd - 20, y0: 60, y1: H - 64 };
      g.push('<text class="dr-h dr-c-acc" x="' + pad + '" y="22">Bioaccumulation: one organism, over time</text>');
      // the fish, growing with age, with intake and excretion arrows
      var cy = phone ? top / 2 + 14 : H * 0.42, cx = pad + artW * (phone ? 0.45 : 0.42), sc = 0.55 + 0.45 * Math.min(1, age / 12), u = Math.min(artW / 190, (phone ? top : H) / 150) * sc;
      g.push('<g class="dr-fish is-big" transform="translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') scale(' + u.toFixed(3) + ')"><path d="M-60 0 Q-8 -40 60 0 Q-8 40 -60 0 Z M-60 0 L-92 -30 L-92 30 Z M-8 -27 l16 -20 l14 18"/><circle class="dr-eye" cx="38" cy="-8" r="6"/></g>');
      g.push(dots(cx, cy, 44 * u, Math.max(1e-5, fishC(age) / 50)));
      var nose = cx + 60 * u, tail = cx - 92 * u;
      g.push('<path class="dr-in" d="M' + (nose + 40).toFixed(1) + ' ' + cy.toFixed(1) + ' H' + (nose + 6).toFixed(1) + ' m7 -6 l-7 6 l7 6"/><text class="dr-lab dr-c-acc" x="' + (nose + 44).toFixed(1) + '" y="' + (cy + 4).toFixed(1) + '">' + (phone ? 'food in' : 'mercury in with food') + '</text>');
      g.push('<path class="dr-out" d="M' + (tail - 4).toFixed(1) + ' ' + (cy + 18).toFixed(1) + ' h-18 m5 -4 l-5 4 l5 4"/><text class="dr-tk" x="' + Math.max(pad, tail - 22).toFixed(1) + '" y="' + (cy + 38).toFixed(1) + '">' + (phone ? 'out, slowly' : 'excreted slowly') + '</text>');
      g.push('<text class="dr-name" x="' + cx.toFixed(1) + '" y="' + (cy + 54 * u + 22).toFixed(1) + '" text-anchor="middle">Lake trout, ' + age + ' year' + (age === 1 ? '' : 's') + ' old</text>');
      // the curve
      var X = function(a){ return plot.x0 + a / 12 * (plot.x1 - plot.x0); }, Y = function(v){ return plot.y1 - v / 1.4 * (plot.y1 - plot.y0); };
      [0, 0.4, 0.8, 1.2].forEach(function(v){ g.push('<line class="dr-grid" x1="' + plot.x0 + '" x2="' + plot.x1 + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="dr-tk" x="' + (plot.x0 - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>'); });
      for(var a = 0; a <= 12; a += 2) g.push('<text class="dr-tk" x="' + X(a).toFixed(1) + '" y="' + (plot.y1 + 16) + '" text-anchor="middle">' + a + '</text>');
      var pts = []; for(var t = 0; t <= 12.001; t += 0.25) pts.push(X(t).toFixed(1) + ',' + Y(fishC(t)).toFixed(1));
      g.push('<polyline class="dr-acc" points="' + pts.join(' ') + '"/>');
      var ax = X(age), ay = Y(fishC(age)), LoF = layout(Wd, H), rt = F(fishC(age), 2) + ' ppm', IN = { x0: plot.x0 + 2, y0: plot.y0, x1: plot.x1, y1: plot.y1 - 8 };
      LoF.line(pts.map(function(q){ return q.split(',').map(Number); }), 3); LoF.rect(ax - 9, ay - 9, ax + 9, ay + 9); LoF.rect(plot.x0 - 30, plot.y1, plot.x1 + 10, plot.y1 + 40);
      g.push('<line class="dr-now" x1="' + ax.toFixed(1) + '" x2="' + ax.toFixed(1) + '" y1="' + plot.y0 + '" y2="' + plot.y1 + '"/><circle class="dr-now-pt is-acc" cx="' + ax.toFixed(1) + '" cy="' + ay.toFixed(1) + '" r="7"/>');
      var rp = LoF.place(rt, 16, 900, [[ax + 12, ay + 24, 'start'], [ax - 12, ay + 24, 'end'], [ax + 12, ay - 12, 'start'], [ax - 12, ay - 12, 'end'], [ax, ay + 32, 'middle']].concat(grid(steps(plot.x0 + 30, plot.x1 - 4, 14), steps(plot.y0 + 16, plot.y1 - 10, 14), [ax, ay], 'start')), { within: IN });
      g.push('<text class="dr-read" ' + at(rp) + '>' + rt + '</text>');
      g.push('<line class="dr-axis" x1="' + plot.x0 + '" x2="' + plot.x1 + '" y1="' + plot.y1 + '" y2="' + plot.y1 + '"/><line class="dr-axis" x1="' + plot.x0 + '" x2="' + plot.x0 + '" y1="' + plot.y0 + '" y2="' + plot.y1 + '"/>');
      g.push('<text class="dr-axl" x="' + plot.x0 + '" y="' + (plot.y0 - 12) + '">Mercury in its tissue (ppm)</text><text class="dr-axl" x="' + ((plot.x0 + plot.x1) / 2) + '" y="' + (plot.y1 + 34) + '" text-anchor="middle">Age of the fish (years)</text>');
      return { svg: g.join(''), label: 'One lake trout at ' + age + ' years old, with mercury taken in faster than it is excreted. ' + fishLine() + ' The curve rises with age and levels off.' };
    }
    // drag along the dose curve
    var dragging = false;
    function setFrom(e){
      if(!GEO || view !== 'dose') return false;
      var rc = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, x = (e.clientX - rc.left) * vb.width / rc.width, y = (e.clientY - rc.top) * vb.height / rc.height;
      if(y < GEO.plot.y0 - 20 || y > GEO.plot.y1 + 30 || x < GEO.plot.x0 - 20) return false;
      var d = Math.round(Math.max(0, Math.min(MAXD, (x - GEO.plot.x0) / (GEO.plot.x1 - GEO.plot.x0) * MAXD)));
      if(d !== dose){ dose = d; sDose.set(d); draw(); words(); }
      return true;
    }
    svg.addEventListener('pointerdown', function(e){ if(setFrom(e)){ act(); dragging = true; try{ svg.setPointerCapture(e.pointerId); }catch(x){} e.preventDefault(); } });
    svg.addEventListener('pointermove', function(e){ if(dragging) setFrom(e); });
    function up(){ if(dragging){ dragging = false; say(doseLine()); } }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);

    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.dr-fig')], dock: [$('.dr-ctl')], primary: [sDose.el, sF.el, sA.el], setup: 'Showing', moreLabel: 'Compare chemicals', why: [$('.dr-say')], details: [$('.dr-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      sync(); draw(); words();
      if(s.mode() === 'explore') s.hint({ target: sDose.input, text: 'Start here: raise the dose, or drag along the curve' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe($('.dr-fig')); }
    }
    sync(); draw(); words();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'dose-response', noun: 'drill',
      generate: function(r, ctx, type){ return D.generate(r, ctx, type); },
      types: [{ value: 'read', label: 'Read LD50 off a curve' }, { value: 'dose', label: 'Dose from mg/kg' }, { value: 'magnify', label: 'Biomagnification' }, { value: 'compare', label: 'Compare toxicity' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { read: 'Read the dose-response curve', dose: 'A dose for one animal', magnify: 'Up the food chain', compare: 'Which is more toxic?' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; api.st.try = null; figure(api.fig, api.problem, api.st); },
      // a wrong reading is drawn on the curve beside where the answer lies
      onTry: function(s, att, api){ api.st.try = { key: s.key, v: att.value }; figure(api.fig, api.problem, api.st); }
    });
  }
  function figure(el, p, st){
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    st = st || {};
    var phone = (window.innerWidth || 1280) <= 640, Wd = phone ? 340 : 600, H = phone ? 300 : 320, out = [], label = '';
    var L = 48, R = Wd - 16, top = 30, bot = H - 44;
    if(g.kind === 'curve'){
      var mx = g.points[g.points.length - 1][0], X = function(d){ return L + d / mx * (R - L); }, Y = function(v){ return bot - v / 100 * (bot - top); };
      [0, 25, 50, 75, 100].forEach(function(v){ out.push('<line class="dr-grid" x1="' + L + '" x2="' + R + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="dr-tk" x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '%</text>'); });
      g.points.forEach(function(q, i){ if(i % (phone && g.points.length > 10 ? 2 : 1) === 0) out.push('<line class="dr-grid" x1="' + X(q[0]).toFixed(1) + '" x2="' + X(q[0]).toFixed(1) + '" y1="' + top + '" y2="' + bot + '"/><text class="dr-tk" x="' + X(q[0]).toFixed(1) + '" y="' + (bot + 16) + '" text-anchor="middle">' + q[0] + '</text>'); });
      out.push('<polyline class="dr-curve dr-a is-sel" points="' + g.points.map(function(q){ return X(q[0]).toFixed(1) + ',' + Y(q[1]).toFixed(1); }).join(' ') + '"/>');
      g.points.forEach(function(q){ out.push('<circle class="dr-pt dr-a" cx="' + X(q[0]).toFixed(1) + '" cy="' + Y(q[1]).toFixed(1) + '" r="3.4"/>'); });
      var tr = st.try && isFinite(st.try.v) && (st.try.key === 'ld50' || st.try.key === 'threshold') ? Math.max(0, Math.min(mx, st.try.v)) : null;
      if(tr != null){
        // the student's dose, read up to the curve: where it lands shows the percent it really gives
        var yy = null;
        for(var q = 1; q < g.points.length; q++){ var a = g.points[q - 1], b = g.points[q]; if(tr >= a[0] && tr <= b[0]){ yy = a[1] + (b[1] - a[1]) * (tr - a[0]) / ((b[0] - a[0]) || 1); break; } }
        if(yy == null) yy = g.points[g.points.length - 1][1];
        out.push('<path class="dr-try" d="M' + X(tr).toFixed(1) + ' ' + bot + ' V' + Y(yy).toFixed(1) + ' H' + L + '"/><circle class="dr-try-pt" cx="' + X(tr).toFixed(1) + '" cy="' + Y(yy).toFixed(1) + '" r="5.5"/>' +
          '<text class="dr-try-t" x="' + Math.min(R - 4, X(tr) + 8).toFixed(1) + '" y="' + (Y(yy) - 10).toFixed(1) + '"' + (X(tr) > R - 120 ? ' text-anchor="end"' : '') + '>Yours: ' + T.F(tr, 0) + ' mg/kg → ' + T.F(yy, 0) + '% died</text>');
      }
      if(st.ld50){ var ld = D.ld50(g.points); out.push('<path class="dr-guide" d="M' + L + ' ' + Y(50).toFixed(1) + ' H' + X(ld).toFixed(1) + ' V' + bot + '"/><circle class="dr-ld" cx="' + X(ld).toFixed(1) + '" cy="' + Y(50).toFixed(1) + '" r="6"/><text class="dr-tag" x="' + (X(ld) + 9).toFixed(1) + '" y="' + (Y(50) + 18).toFixed(1) + '">LD50 = ' + ld + ' mg/kg</text>'); }
      if(st.threshold){ var th = D.threshold(g.points); out.push('<rect class="dr-thband" x="' + L + '" y="' + top + '" width="' + (X(th) - L).toFixed(1) + '" height="' + (bot - top) + '"/><text class="dr-lab dr-c-good" x="' + X(th).toFixed(1) + '" y="' + (bot - 8) + '" text-anchor="middle">threshold ' + th + '</text>'); }
      out.push('<line class="dr-axis" x1="' + L + '" x2="' + R + '" y1="' + bot + '" y2="' + bot + '"/><line class="dr-axis" x1="' + L + '" x2="' + L + '" y1="' + top + '" y2="' + bot + '"/><text class="dr-axl" x="' + L + '" y="' + (top - 12) + '">Percent that died</text><text class="dr-axl" x="' + ((L + R) / 2) + '" y="' + (bot + 34) + '" text-anchor="middle">Dose of ' + esc(g.chem) + ' (mg/kg)</text>');
      label = 'Dose-response curve for ' + g.chem + ': ' + g.points.map(function(q){ return q[0] + ' mg/kg ' + q[1] + '%'; }).join(', ') + '.';
    } else if(g.kind === 'body'){
      var cx = Wd / 2, cy = H * 0.45;
      out.push('<g class="dr-scale"><rect x="' + (cx - 90) + '" y="' + (cy + 40) + '" width="180" height="22" rx="6"/><text x="' + cx + '" y="' + (cy + 56) + '" text-anchor="middle">' + g.kg + ' kg</text></g>');
      out.push(animal(g.animal, cx, cy, Math.min(1.6, 0.9 + g.kg / 40)));
      out.push('<text class="dr-lab" x="' + cx + '" y="' + (top) + '" text-anchor="middle">LD50 ' + g.ld50 + ' mg per kg of body mass</text>');
      if(st.answer) out.push('<text class="dr-tag" x="' + cx + '" y="' + (H - 20) + '" text-anchor="middle">Whole-body LD50 dose: ' + big(g.ld50 * g.kg) + ' mg</text>');
      label = 'A ' + g.kg + ' kg ' + g.animal + ' on a scale; LD50 ' + g.ld50 + ' mg/kg.';
    } else if(g.kind === 'chain'){
      var n = g.lv + 1, cw = (Wd - 20) / n, lvAll = D.chainLevels(g.c0, g.f);
      for(var i = 0; i < n; i++){
        var x = 10 + cw * (i + 0.5), k = i === 0 ? 'water' : i === n - 1 ? (/osprey|bird|eagle/.test(g.names[i]) ? 'bird' : 'large') : i === 1 ? 'plankton' : 'small';
        out.push(art(k, x, H * 0.4, Math.min(cw * 0.85, 90), lvAll[i]));
        out.push('<text class="dr-name" x="' + x.toFixed(1) + '" y="' + (H * 0.4 + 56) + '" text-anchor="middle">' + esc(phone && g.names[i].length > 10 ? g.names[i].split(' ').pop() : g.names[i]) + '</text>');
        var known = i === 0 || (i === n - 1 && st.top);
        out.push('<text class="dr-val' + (known ? '' : ' dr-muted') + '" x="' + x.toFixed(1) + '" y="' + (H * 0.4 + 76) + '" text-anchor="middle">' + (known ? D.dec(lvAll[i]) + ' ppm' : '?') + '</text>');
        if(i < n - 1) out.push('<text class="dr-x" x="' + (x + cw / 2).toFixed(1) + '" y="' + (H * 0.4 - 50) + '" text-anchor="middle">×' + g.f + '</text>');
      }
      label = 'Food chain: ' + g.names.slice(0, n).join(', ') + '; water ' + D.dec(g.c0) + ' ppm, times ' + g.f + ' each step.';
    } else if(g.kind === 'compare'){
      var art2 = function(t){ var mx2 = Math.max(g.ld[0], g.ld[1]) * 1.15, Y2 = function(v){ return bot - v / mx2 * (bot - top - 10); }, bw = (R - L) / 2; for(var j = 0; j < 2; j++){ var bx = L + j * bw + bw * 0.25, ww = bw * 0.5; t.push('<rect class="dr-bar dr-lv' + (j ? 2 : 4) + '" x="' + bx.toFixed(1) + '" y="' + Y2(g.ld[j]).toFixed(1) + '" width="' + ww.toFixed(1) + '" height="' + (bot - Y2(g.ld[j])).toFixed(1) + '" rx="4"/><text class="dr-lab" x="' + (bx + ww / 2).toFixed(1) + '" y="' + (Y2(g.ld[j]) - 6).toFixed(1) + '" text-anchor="middle">' + big(g.ld[j]) + ' mg/kg</text><text class="dr-name" x="' + (bx + ww / 2).toFixed(1) + '" y="' + (bot + 18) + '" text-anchor="middle">' + esc(g.names[j]) + '</text>'); } t.push('<line class="dr-axis" x1="' + L + '" x2="' + R + '" y1="' + bot + '" y2="' + bot + '"/><text class="dr-axl" x="' + L + '" y="' + (top - 8) + '">Oral LD50 in rats (mg/kg)' + (st.which ? ': lower bar, more toxic' : '') + '</text>'); };
      art2(out);
      label = 'Bar graph of LD50: ' + g.names[0] + ' ' + g.ld[0] + ' mg/kg, ' + g.names[1] + ' ' + g.ld[1] + ' mg/kg.';
    }
    el.innerHTML = '<figure class="cd-fig dr-qfig"><svg class="dr-svg" viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + out.join('') + '</svg></figure>';
    function art(k, cx, cy, s, v){
      var u = s / 100, t = 'translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') scale(' + u.toFixed(3) + ')';
      if(k === 'water') return '<g transform="' + t + '"><path class="dr-drop" d="M0 -42 C18 -14 30 2 30 16 a30 30 0 0 1 -60 0 C-30 2 -18 -14 0 -42 Z"/></g>';
      if(k === 'plankton') return '<g transform="' + t + '" class="dr-zoo"><ellipse cx="0" cy="0" rx="16" ry="24"/><path d="M-14 -16 q-26 -14 -30 -30 M14 -16 q26 -14 30 -30 M-10 20 l-8 16 M10 20 l8 16"/><circle class="dr-eye" cx="0" cy="-12" r="4"/></g>';
      if(k === 'small') return '<g transform="' + t + ' scale(0.7)" class="dr-fish"><path d="M-40 0 Q-6 -26 36 0 Q-6 26 -40 0 Z M-40 0 L-62 -18 L-62 18 Z"/><circle class="dr-eye" cx="22" cy="-5" r="4"/></g>';
      if(k === 'large') return '<g transform="' + t + '" class="dr-fish is-big"><path d="M-44 0 Q-6 -30 44 0 Q-6 30 -44 0 Z M-44 0 L-68 -22 L-68 22 Z"/><circle class="dr-eye" cx="28" cy="-6" r="4.5"/></g>';
      return '<g transform="' + t + '" class="dr-bird"><path d="M-36 6 Q-6 -16 26 -2 L44 -8 L34 4 Q10 24 -26 18 Z"/><path class="dr-wing" d="M-14 0 Q-2 -40 22 -44 Q8 -20 6 2 Z"/><path class="dr-beak" d="M44 -8 L58 -4 L42 -2 Z"/><circle class="dr-eye" cx="36" cy="-6" r="3"/></g>';
    }
  }
  function animal(kind, cx, cy, k){
    var t = 'translate(' + cx + ' ' + cy + ') scale(' + k.toFixed(2) + ')';
    if(kind === 'duck') return '<g class="dr-animal" transform="' + t + '"><ellipse cx="0" cy="12" rx="40" ry="22"/><circle cx="30" cy="-14" r="15"/><path class="dr-beak" d="M43 -16 L62 -12 L43 -8 Z"/><circle class="dr-eye" cx="34" cy="-17" r="2.6"/></g>';
    return '<g class="dr-animal" transform="' + t + '"><ellipse cx="0" cy="4" rx="42" ry="20"/><circle cx="44" cy="-14" r="15"/><path d="M50 -28 l10 -10 l2 14 Z"/><path d="M58 -10 l14 2 l-12 6 Z"/><rect x="-34" y="18" width="8" height="22" rx="3"/><rect x="-14" y="18" width="8" height="22" rx="3"/><rect x="14" y="18" width="8" height="22" rx="3"/><rect x="30" y="18" width="8" height="22" rx="3"/><path class="dr-tail2" d="M-40 0 q-18 -6 -20 -24"/><circle class="dr-eye" cx="48" cy="-16" r="2.6"/></g>';
  }
})();
