/* Water pollution trainer page (docs/apenv-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T4). Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.waterPollution (environmental-science/assets/tools/math/water-pollution.js), the
   content environmental-science/data/tools/water-pollution.json (served filtered as
   assets/tool-data/water-pollution.json). The frame is ApEnvTools.modes
   (Explore, then Test yourself) on the Tool Studio.

   Explore: one picture, three views (the Scene switch), each a live
   illustration over a graph drawn from the same model numbers:
     Nutrients  a farm field over a lake. Choose the fertilizer runoff and
                press Play: 60 days run, the algae bloom near the surface,
                dead algae sink, decomposers work on the bottom, the bottom
                water darkens as its dissolved oxygen falls and the fish move
                up, then die below 2 mg/L. The chain strip lights each link
                as the model reaches it; the graph under the lake is the
                bottom water's oxygen (blue), the algae (green, relative) and
                the 2 mg/L hypoxic line, with today's marker.
     Heat       a power plant returns cooling water to a river: the warm
                plume, a thermometer each side, and the saturation curve
                (USGS) with both temperatures marked: thermal pollution is
                heat, and warm water holds less oxygen.
     Sewage     a treatment plant, stage by stage: what is left of solids,
                organic matter (BOD), nitrogen and phosphorus, and pathogens
                after each stage, and the river below the outfall.
   Colors by role, the same in every view and in the drills: oxygen blue,
   algae green, dead organic matter brown, nutrients orange, heat
   vermillion (Okabe-Ito; lighter in dark mode). Never color alone: every
   value is labeled.
   Reduced motion: Play shows the end state at once (ApEnvPlot.loop).
   Test yourself: ApEnvTools.drill over the model's generate(), with a stage
   figure drawn from the problem's own numbers. */
(function(){
  'use strict';
  var T = window.ApEnvTools, M = window.ApEnvMath, P = window.ApEnvPlot;
  if(!T || !M || !M.waterPollution) return;
  var W = M.waterPollution, esc = T.esc;
  function F(x, d){ return T.F(x, d == null ? 1 : d); }
  function r1(v){ return Math.round(v * 10) / 10; }
  var LEVELS = ['None', 'Light', 'Moderate', 'Heavy', 'Very heavy', 'Extreme'];
  var VIEWS = [{ v: 'nutrients', label: 'Nutrients' }, { v: 'heat', label: 'Heat' }, { v: 'sewage', label: 'Sewage' }];
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

  T.mount('water-pollution', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'water-pollution',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
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
    var view = 'nutrients', level = 3, day = 0, tLake = 20, showAlgae = true, river = 15, warm = 10, stages = 2;
    var run = W.lake(level, tLake), anim = null, touched = false, LS = null, nid = T.nid('wp');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem wp-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Water pollution</h2>' +
      '<div class="wp-fig"><svg class="wp-svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<div class="wp-ctl">' +
        '<div class="ls-seg wp-views" role="group" aria-label="Scene">' + VIEWS.map(function(x){ return '<button type="button" data-v="' + x.v + '" aria-pressed="false">' + x.label + '</button>'; }).join('') + '</div>' +
        '<div class="wp-grp wp-grp-nutrients"></div>' +
        '<div class="wp-grp wp-grp-heat"></div>' +
        '<div class="wp-grp wp-grp-sewage"></div>' +
        '<div class="wp-go ls-act wp-grp-act"><button type="button" class="btn-press sm ls-btn ls-pri wp-play">Play 60 days</button><button type="button" class="bt-btn wp-reset">Day 0</button></div>' +
      '</div>' +
      '<div class="wp-say"></div>' +
      T.moreHtml('<div class="wp-tl"></div><label class="bt-radio wp-opt"><input type="checkbox" class="wp-algae" checked> Show the algae on the oxygen graph</label><div class="wp-rv"></div>', 'lake and river temperature') +
      '<div class="wp-nums"></div><p class="sr-only wp-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.wp-live'));
    var cue = T.cue('Press Play and follow the chain from fertilizer to a dead zone.');
    $('.wp-ctl').insertBefore(cue.el, $('.wp-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var svg = $('.wp-svg');
    var sLevel = T.slider({ label: 'Fertilizer runoff', min: 0, max: 5, step: 1, value: level, onInput: function(v){ act(); stop(); level = v; run = W.lake(level, tLake); draw(); words(); say('Runoff ' + LEVELS[v].toLowerCase() + '. ' + doLine()); } });
    var sDay = T.slider({ label: 'Day', min: 0, max: W.LAKE_DAYS, step: 1, value: 0, onInput: function(v){ act(); stop(); day = v; draw(); words(); say('Day ' + v + '. ' + doLine()); } });
    labelSlider(sLevel, function(v){ return LEVELS[v]; });
    labelSlider(sDay, function(v){ return 'Day ' + v; });
    $('.wp-grp-nutrients').appendChild(sLevel.el); $('.wp-grp-nutrients').appendChild(sDay.el);
    var sWarm = T.slider({ label: 'Warm water added by the plant', min: 0, max: 15, step: 1, value: warm, unit: '°C', onInput: function(v){ act(); warm = v; draw(); words(); say(heatLine()); } });
    $('.wp-grp-heat').appendChild(sWarm.el);
    var sStage = T.slider({ label: 'Treated through', min: 0, max: 4, step: 1, value: stages, onInput: function(v){ act(); stages = v; draw(); words(); say(sewLine()); } });
    labelSlider(sStage, function(v){ return W.SEWAGE.stages[v].name; });
    $('.wp-grp-sewage').appendChild(sStage.el);
    var sT = T.slider({ label: 'Lake temperature', min: 10, max: 30, step: 1, value: tLake, unit: '°C', onInput: function(v){ act(); stop(); tLake = v; run = W.lake(level, tLake); draw(); words(); say('Lake at ' + v + ' °C. ' + doLine()); } });
    $('.wp-tl').appendChild(sT.el);
    var sR = T.slider({ label: 'River temperature upstream', min: 5, max: 25, step: 1, value: river, unit: '°C', onInput: function(v){ act(); river = v; draw(); words(); say(heatLine()); } });
    $('.wp-rv').appendChild(sR.el);
    function labelSlider(s, fn){
      var out = s.el.querySelector('output'), inp = s.input;
      function show(){ out.textContent = fn(+inp.value); inp.setAttribute('aria-valuetext', fn(+inp.value)); }
      inp.addEventListener('input', show); s.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', show); });
      var set0 = s.set; s.set = function(v, fire){ set0(v, fire); show(); };
      show();
    }
    function onClick(e){
      var b = e.target.closest('.wp-views button');
      if(b){ setView(b.getAttribute('data-v')); return; }
      if(e.target.closest('.wp-play')){ act(); play(); return; }
      if(e.target.closest('.wp-reset')){ act(); stop(); day = 0; sDay.set(0); draw(); words(); return; }
    }
    host.addEventListener('click', onClick);
    $('.wp-algae').addEventListener('change', function(e){ showAlgae = e.target.checked; draw(); });
    function setView(v){
      if(v === view) return;
      act(); stop(); view = v; syncView(); draw(); words();
      say({ nutrients: 'Nutrients scene. ', heat: 'Heat scene. ', sewage: 'Sewage scene. ' }[v] + (v === 'nutrients' ? doLine() : v === 'heat' ? heatLine() : sewLine()));
    }
    function syncView(){
      var root = LS ? LS.root : host;
      root.querySelectorAll('.wp-views button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === view)); });
      ['nutrients', 'heat', 'sewage'].forEach(function(k){ var el = $('.wp-grp-' + k); if(el) el.hidden = k !== view; });
      var go = $('.wp-grp-act'); if(go) go.hidden = view !== 'nutrients';
      var tl = $('.wp-tl'), ao = $('.wp-opt'), rv = $('.wp-rv');
      if(tl) tl.hidden = view !== 'nutrients'; if(ao) ao.hidden = view !== 'nutrients'; if(rv) rv.hidden = view !== 'heat';
      if(LS && LS.setupRow) LS.setupRow.setup(view === 'nutrients' ? 'Lake at ' + tLake + ' °C' : view === 'heat' ? 'River at ' + river + ' °C' : 'Typical plant');
    }
    function stop(){ if(anim){ anim.stop(); anim = null; } var b = $('.wp-play'); if(b) b.textContent = day >= W.LAKE_DAYS ? 'Play again' : 'Play 60 days'; }
    function play(){
      if(anim){ stop(); return; }
      var d0 = day >= W.LAKE_DAYS ? 0 : day, dur = 7 * (W.LAKE_DAYS - d0) / W.LAKE_DAYS;
      var b = $('.wp-play'); if(b) b.textContent = 'Pause';
      anim = P.loop(function(dt, t){ day = Math.min(W.LAKE_DAYS, Math.round(d0 + t / 7 * W.LAKE_DAYS)); sDay.set(day); draw(); return day < W.LAKE_DAYS; },
        { duration: dur, still: function(){ day = W.LAKE_DAYS; sDay.set(day); draw(); }, onEnd: function(){ anim = null; day = W.LAKE_DAYS; sDay.set(day); stop(); draw(); words(); say(doLine() + ' Lowest ' + F(run.min) + ' mg/L on day ' + run.minDay + '.'); } });
      anim.start();
    }

    /* ------------------------------------------------- numbers and words */
    function doNow(){ return run.O[day]; }
    function stageNow(){ return W.stageAt(run, day); }
    function recovering(){ return level > 0 && day > run.minDay && stageNow() >= 4; }
    function doLine(){ var o = doNow(); return 'Day ' + day + ': bottom water ' + F(o) + ' mg/L' + (o < W.HYPOXIC ? ', hypoxic.' : '.'); }
    function heatPts(){ var t0 = river, t1 = Math.min(35, river + warm); return { t0: t0, t1: t1, d0: W.osat(t0), d1: W.osat(t1) }; }
    function heatLine(){ var h = heatPts(); return 'Upstream ' + h.t0 + ' °C holds up to ' + F(h.d0) + ' mg/L; below the plant ' + h.t1 + ' °C holds up to ' + F(h.d1) + ' mg/L, ' + F(Math.abs(M.Calc().percentChange(h.d0, h.d1)), 0) + '% less.'; }
    function sewLine(){ var st = W.SEWAGE.stages[stages]; return 'Treated through ' + st.name.toLowerCase() + ': ' + W.SEWAGE.parts.map(function(p){ return p.name.toLowerCase() + ' ' + pctTxt(st.left[p.k]) + ' left'; }).join(', ') + '.'; }
    function pctTxt(v){ return (v < 1 ? String(v) : String(Math.round(v))) + '%'; }
    function words(){
      var head, sub = '', why = '';
      if(view === 'nutrients'){
        var s = stageNow(), o = doNow(), link = s > -1 ? W.CHAIN[s] : null;
        if(level === 0) head = 'No fertilizer: the algae stay few and the bottom water stays near ' + F(run.osat) + ' mg/L.';
        else if(day === 0) head = LEVELS[level] + ' runoff washes nitrate and phosphate into the lake. Press Play.';
        else if(recovering()){ head = 'Day ' + day + ': recovery. Bottom water ' + F(o) + ' mg/L.'; }
        else head = 'Day ' + day + ': ' + (link ? link.name.toLowerCase() : 'nutrients') + '. Bottom water ' + F(o) + ' mg/L.';
        sub = level === 0 ? 'Add runoff to start the chain.' : recovering() ? 'The lowest point was ' + F(run.min) + ' mg/L on day ' + run.minDay + '. Fewer dead algae are left to decompose, so oxygen from the air wins again.' : link && day > 0 ? link.long : '';
        why = chainWhy();
      } else if(view === 'heat'){
        var h = heatPts();
        head = 'Warm water holds less oxygen: ' + F(h.d0) + ' mg/L at ' + h.t0 + ' °C, ' + F(h.d1) + ' mg/L at ' + h.t1 + ' °C.';
        sub = 'Thermal pollution is the heat itself. No chemical is added.';
        why = heatWhy();
      } else {
        var st = W.SEWAGE.stages[stages];
        head = st.name + (stages ? ' treatment' : '') + ': ' + st.how;
        sub = stages < 3 ? 'Nitrogen and phosphorus still leave the plant: the river below can bloom.' : stages < 4 ? 'Nutrients are mostly gone; pathogens remain until disinfection.' : 'Clean enough to release.';
        why = sewWhy();
      }
      T.explain($('.wp-say'), '<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), why);
      nums();
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), 'explore');
        if(view === 'nutrients'){
          var o2 = doNow();
          LS.pills([{ k: 'Day', html: String(day), tone: 'readout' }], 'left', 'explore');
          LS.pills([{ k: 'Bottom DO', html: F(o2) + ' mg/L', tone: o2 < W.HYPOXIC ? 'bad' : o2 < 5 ? 'warn' : 'good' }], 'right', 'explore');
        } else if(view === 'heat'){
          var hp = heatPts();
          LS.pills([{ k: 'Below the plant', html: hp.t1 + ' °C', tone: 'readout' }], 'left', 'explore');
          LS.pills([{ k: 'Holds', html: F(hp.d1) + ' mg/L', tone: hp.d1 < 8 ? 'warn' : 'good' }], 'right', 'explore');
        } else {
          var lf = W.SEWAGE.stages[stages].left;
          LS.pills([{ k: 'BOD left', html: pctTxt(lf.bod), tone: 'readout' }], 'left', 'explore');
          LS.pills([{ k: 'N and P left', html: pctTxt(lf.nutrients), tone: lf.nutrients > 50 ? 'warn' : 'good' }], 'right', 'explore');
        }
      }
    }
    function chainWhy(){
      return '<p><b>The chain, every link.</b> ' + W.CHAIN.map(function(c, i){ return (i + 1) + '. ' + esc(c.long); }).join(' ') + '</p>' +
        '<p><b>Why oxygen falls late.</b> Living algae make oxygen near the surface. The drop comes after they die: aerobic bacteria respire as they decompose the dead algae on the bottom, and the bottom water mixes little with the air.</p>' +
        '<p><b>Warm lakes suffer more.</b> At ' + tLake + ' °C water holds at most ' + F(run.osat) + ' mg/L, and decomposers work faster when it is warm. Try the lake temperature under More options.</p>' +
        '<p><b>Do not mix up.</b> Fertilizers (nitrate, phosphate) cause eutrophication; pesticides are a different pollutant. Thermal pollution is heat, a separate cause of low oxygen (the Heat scene).</p>';
    }
    function heatWhy(){
      return '<p><b>Heat, not chemicals.</b> A power plant or factory takes in river water to cool its machines and returns it warmer. Nothing is added but heat.</p>' +
        '<p><b>Warm water holds less gas.</b> The curve is how much oxygen fresh water can hold at each temperature (USGS). From 10 °C to 30 °C it falls from 11.3 to 7.6 mg/L.</p>' +
        '<p><b>Fish are hit twice.</b> Fish are ectotherms: warmer water speeds up their metabolism, so they need more oxygen just as the water holds less. Some species also cannot survive above a temperature (thermal shock).</p>';
    }
    function sewWhy(){
      return '<p><b>Why treat sewage?</b> Raw sewage carries organic matter (decomposing it uses oxygen, which is what BOD measures), nitrogen and phosphorus that feed algae, and pathogens.</p>' +
        '<p><b>Four stages.</b> ' + W.SEWAGE.stages.slice(1).map(function(s){ return '<b>' + esc(s.name) + '.</b> ' + esc(s.how); }).join(' ') + '</p>' +
        '<p><b>Each stage removes a share of what is left,</b> so percentages multiply: 35% then 85% removed leaves 0.65 × 0.15 ≈ 10% of the BOD.</p>';
    }
    function nums(){
      var box = $('.wp-nums'), html = '';
      if(view === 'nutrients'){
        var rows = [0, 5, 10, 15, 20, 30, 40, 50, 60].map(function(d){ return '<tr' + (d === day ? ' class="hl"' : '') + '><th scope="row">' + d + '</th><td class="r">' + F(run.N[d], 2) + '</td><td class="r">' + F(run.A[d]) + '</td><td class="r">' + F(run.D[d]) + '</td><td class="r">' + F(run.O[d]) + '</td></tr>'; }).join('');
        html = '<h3 class="ls-title-l">The lake, day by day</h3><p class="bt-small">' + esc(LEVELS[level]) + ' runoff, lake at ' + tLake + ' °C (saturation ' + F(run.osat) + ' mg/L). Nutrients, algae and dead algae in relative units; oxygen in mg/L.</p>' +
          '<div class="table-wrap" tabindex="0" role="region" aria-label="Lake model by day"><table class="ls-tbl"><caption class="sr-only">Lake model values by day</caption><thead><tr><th scope="col">Day</th><th scope="col">Nutrients</th><th scope="col">Algae</th><th scope="col">Dead algae</th><th scope="col">Bottom DO</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '<p class="bt-small">Lowest bottom-water oxygen: ' + F(run.min) + ' mg/L on day ' + run.minDay + '. Days below 2 mg/L: ' + run.hypoxicDays + '.</p>';
      } else if(view === 'heat'){
        var h = heatPts();
        html = '<h3 class="ls-title-l">Oxygen fresh water can hold (USGS, sea level)</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Oxygen saturation by temperature"><table class="ls-tbl"><caption class="sr-only">Saturation by temperature</caption><thead><tr><th scope="col">Temperature</th><th scope="col">Saturation</th></tr></thead><tbody>' +
          W.OSAT.map(function(p){ return '<tr><th scope="row">' + p[0] + ' °C</th><td class="r">' + F(p[1]) + ' mg/L</td></tr>'; }).join('') + '</tbody></table></div>' +
          '<p class="bt-small">Between rows the page reads the curve by straight lines. Percent change from ' + h.t0 + ' °C to ' + h.t1 + ' °C: (' + F(h.d1) + ' − ' + F(h.d0) + ') / ' + F(h.d0) + ' × 100 = ' + T.F(M.Calc().percentChange(h.d0, h.d1), 1) + '%.</p>';
      } else {
        html = '<h3 class="ls-title-l">Share of the raw load still in the water</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Sewage treatment by stage"><table class="ls-tbl"><caption class="sr-only">Percent left after each stage</caption><thead><tr><th scope="col">After</th>' + W.SEWAGE.parts.map(function(p){ return '<th scope="col">' + esc(p.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          W.SEWAGE.stages.map(function(s, i){ return '<tr' + (i === stages ? ' class="hl"' : '') + '><th scope="row">' + esc(s.name) + '</th>' + W.SEWAGE.parts.map(function(p){ return '<td class="r">' + pctTxt(s.left[p.k]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div><p class="bt-small">Typical rounded values (EPA); real plants vary.</p>';
      }
      box.innerHTML = html;
    }

    /* ---------------------------------------------------- the picture */
    function size(){ var rc = $('.wp-fig').getBoundingClientRect(); return [Math.max(300, Math.min(1500, Math.round(rc.width) || 640)), Math.max(320, Math.min(1000, Math.round(rc.height) || 480))]; }
    function draw(){
      var wh = size(), Wd = wh[0], H = wh[1];
      svg.setAttribute('viewBox', '0 0 ' + Wd + ' ' + H); svg.setAttribute('width', Wd); svg.setAttribute('height', H);
      var out = view === 'nutrients' ? lakeScene(Wd, H) : view === 'heat' ? heatScene(Wd, H) : sewScene(Wd, H);
      svg.innerHTML = out.svg;
      svg.setAttribute('aria-label', out.label);
    }
    /* Seeded positions so the picture does not jump between frames. */
    function spots(seed, n){ var r = M.rng(seed), a = []; for(var i = 0; i < n; i++) a.push([r(), r(), r()]); return a; }
    var ALG = spots(7, 70), DEAD = spots(11, 60), BAC = spots(13, 40), FERT = spots(17, 40);

    function lakeScene(Wd, H){
      var phone = Wd < 560, g = [], L = phone ? 8 : 16, R = Wd - (phone ? 8 : 16);
      var sceneH = Math.round(H * (phone ? 0.5 : 0.54)), chainY = sceneH + 6, chainH = phone ? 30 : 34, gTop = chainY + chainH + 34, gBot = H - 64;
      var o = run.O[day], A = run.A[day], D = run.D[day], s = stageNow(), Os = run.osat;
      // sky and field
      var surf = Math.round(sceneH * (phone ? 0.42 : 0.36)), fieldR = L + (R - L) * (phone ? 0.3 : 0.27), lakeL = fieldR - (phone ? 6 : 12), bottom = sceneH - 6;
      g.push('<defs><linearGradient id="wpSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="wp-sky0"/><stop offset="1" class="wp-sky1"/></linearGradient>' +
        '<linearGradient id="wpSurf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:' + waterTop(A) + '"/><stop offset="1" style="stop-color:' + waterMid(A) + '"/></linearGradient>' +
        '<clipPath id="wpLake"><path d="' + lakePath() + '"/></clipPath></defs>');
      g.push('<rect class="wp-skyr" x="0" y="0" width="' + Wd + '" height="' + surf + '" fill="url(#wpSky)"/>');
      g.push('<circle class="wp-sun" cx="' + (R - 34) + '" cy="30" r="14"/>');
      var stormy = level > 0 && day < 6;
      if(stormy){
        var cx = L + (fieldR - L) * 0.5;
        g.push('<g class="wp-cloud"><ellipse cx="' + cx + '" cy="28" rx="' + (phone ? 34 : 46) + '" ry="14"/><ellipse cx="' + (cx - 20) + '" cy="34" rx="22" ry="11"/><ellipse cx="' + (cx + 24) + '" cy="35" rx="20" ry="10"/></g>');
        for(var k = 0; k < 7; k++){ var rx = cx - 34 + k * 11; g.push('<line class="wp-rain" x1="' + rx + '" y1="46" x2="' + (rx - 5) + '" y2="' + (64 + (k % 3) * 6) + '"/>'); }
      }
      // field: a slope down to the lake, crop rows, fertilizer granules
      var fy0 = surf - 46, fy1 = surf + 4;
      g.push('<path class="wp-soil" d="M0 ' + fy0 + ' L' + (fieldR - 30) + ' ' + (fy0 + 10) + ' Q' + fieldR + ' ' + (fy0 + 14) + ' ' + (lakeL + 14) + ' ' + fy1 + ' L' + (lakeL + 30) + ' ' + sceneH + ' L0 ' + sceneH + ' Z"/>');
      g.push('<path class="wp-grass" d="M0 ' + fy0 + ' L' + (fieldR - 30) + ' ' + (fy0 + 10) + ' Q' + fieldR + ' ' + (fy0 + 14) + ' ' + (lakeL + 14) + ' ' + fy1 + '" />');
      var nCrop = Math.max(4, Math.floor((fieldR - L - 30) / 15));
      for(var c = 0; c < nCrop; c++){
        var x = L + 8 + c * 15, y = fy0 + (x / (fieldR - 30)) * 10;
        g.push('<g class="wp-crop"><line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y - 18) + '"/><path d="M' + x + ' ' + (y - 8) + ' q-6 -2 -8 -8 M' + x + ' ' + (y - 12) + ' q6 -2 8 -8"/></g>');
      }
      var nFert = Math.round(level * 6 * (day < 5 ? 1 : Math.max(0, 1 - (day - 5) / 10)));
      FERT.slice(0, nFert).forEach(function(p){ var x = L + 4 + p[0] * (fieldR - L - 20), y = fy0 + (x / (fieldR - 30)) * 10 + 2 + p[1] * 6; g.push('<circle class="wp-fert" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.2"/>'); });
      if(!phone) g.push('<text class="wp-lab" x="' + (L + 4) + '" y="' + (fy0 + 30) + '">Farm field</text>');
      // runoff arrows into the lake
      if(level > 0 && day < 8){
        var op = (day < 4 ? 1 : (8 - day) / 4).toFixed(2);
        for(var a = 0; a < Math.min(3, level); a++){
          var ax = fieldR - 70 + a * 18, ay = fy0 + 14 + a * 3;
          g.push('<path class="wp-runoff" style="opacity:' + op + '" d="M' + ax + ' ' + ay + ' Q' + (ax + 40) + ' ' + (ay + 8) + ' ' + (lakeL + 26 + a * 8) + ' ' + (surf + 10 + a * 6) + '" marker-end="url(#wpArr)"/>');
        }
        g.push('<defs><marker id="wpArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path class="wp-runoff-h" d="M0 0 L10 5 L0 10 z"/></marker></defs>');
        g.push(tag(fieldR - 40, fy0 - 14, 'Fertilizer runoff', 'wp-c-nut', phone ? 'start' : 'middle'));
      }
      // the lake: surface water (tinted by algae) and bottom water (tinted by oxygen)
      var mid = surf + Math.round((bottom - surf) * 0.45);
      g.push('<g clip-path="url(#wpLake)"><rect x="' + lakeL + '" y="' + surf + '" width="' + (R - lakeL + 20) + '" height="' + (mid - surf) + '" fill="url(#wpSurf)"/>' +
        '<rect x="' + lakeL + '" y="' + mid + '" width="' + (R - lakeL + 20) + '" height="' + (bottom - mid + 6) + '" style="fill:' + bottomCol(o, Os) + '"/>');
      // algae near the surface: dots, more as the bloom grows
      var nA = Math.min(ALG.length, Math.round(A * 1.8));
      ALG.slice(0, nA).forEach(function(p){ var x = lakeL + 20 + p[0] * (R - lakeL - 30), y = surf + 3 + p[1] * p[1] * (mid - surf - 6); g.push('<circle class="wp-alga" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (2 + p[2] * 2.2).toFixed(1) + '"/>'); });
      // dead algae sinking and settled
      var nD = D < 1 ? 0 : Math.min(DEAD.length, Math.round(D * 1.5));
      DEAD.slice(0, nD).forEach(function(p, i){ var x = lakeL + 26 + p[0] * (R - lakeL - 40), y = i % 3 ? bottom - 6 - p[1] * 14 : mid - 10 + p[1] * (bottom - mid); g.push('<path class="wp-dead" d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' l4 -2 l2 3 l-5 1 z"/>'); });
      // decomposers on the bottom (bacteria), as many as decomposition is fast
      var nB = D < 1 ? 0 : Math.min(BAC.length, Math.round(0.12 * D * 14));
      BAC.slice(0, nB).forEach(function(p){ var x = lakeL + 30 + p[0] * (R - lakeL - 46), y = bottom - 4 - p[1] * 10; g.push('<rect class="wp-bac" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="6" height="2.6" rx="1.3" transform="rotate(' + Math.round(p[2] * 60 - 30) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>'); });
      // fish: down in the bottom water when it has oxygen, up near the surface when stressed, dead below 2 mg/L
      var fishN = 4;
      for(var fi = 0; fi < fishN; fi++){
        var fx = lakeL + 60 + fi * (R - lakeL - 110) / (fishN - 1), dead = o < W.HYPOXIC && fi < (o < 1 ? 4 : 3), up = o < 4.5;
        var fy = dead ? surf - 2 : up ? surf + 10 + (fi % 2) * 8 : mid + 14 + (fi % 2) * (bottom - mid - 34);
        g.push(fish(fx, fy, dead, fi % 2 === 1));
      }
      g.push('</g>');
      g.push('<path class="wp-shore" d="' + lakePath() + '"/>');
      g.push('<line class="wp-thermo" x1="' + (lakeL + 30) + '" x2="' + (R - 4) + '" y1="' + mid + '" y2="' + mid + '"/>');
      // the oxygen gauge on the bottom water
      var gx = R - (phone ? 92 : 128), gy = mid + 8, gw = phone ? 86 : 120;
      g.push('<g class="wp-gauge"><rect x="' + gx + '" y="' + gy + '" width="' + gw + '" height="' + (phone ? 36 : 40) + '" rx="8"/><text class="wp-gk" x="' + (gx + 8) + '" y="' + (gy + 14) + '">Bottom water</text><text class="wp-gv' + (o < W.HYPOXIC ? ' is-bad' : '') + '" x="' + (gx + 8) + '" y="' + (gy + (phone ? 30 : 33)) + '">' + F(o) + ' mg/L O₂</text></g>');
      if(!phone) g.push('<text class="wp-lab wp-c-oxy" x="' + (lakeL + 34) + '" y="' + (mid - 5) + '">Surface water</text>');
      // the callout for the current link
      if(s > 0 && day > 0 && !recovering()){
        var cxy = s === 1 ? [lakeL + 40 + (R - lakeL) * 0.35, surf + 12] : s === 2 ? [lakeL + 40 + (R - lakeL) * 0.4, mid + 10] : s === 3 ? [lakeL + 60 + (R - lakeL) * 0.3, bottom - 10] : [gx + 10, gy + 20];
        if(s <= 3) g.push(tag(cxy[0], s === 3 ? bottom - 26 : cxy[1] + (s === 1 ? 26 : -6), W.CHAIN[s].name, s === 1 ? 'wp-c-alg' : 'wp-c-dead', 'middle'));
      }
      // the chain strip
      g.push(chainStrip(L, R, chainY, chainH, s, phone));
      // the graph: bottom water oxygen and algae, the hypoxic line, today's marker
      var LoG = layout(Wd, H);
      g.push(doGraph(L, R, gTop, gBot, phone, LoG));
      svg.setAttribute('data-clash', String(LoG.clash())); svg.setAttribute('data-miss', LoG.misses().join(' | '));
      var label = 'Lake below a farm field, ' + LEVELS[level].toLowerCase() + ' fertilizer runoff, day ' + day + ' of ' + W.LAKE_DAYS + '. ' + (s > -1 ? 'Chain reached: ' + W.CHAIN.slice(0, s + 1).map(function(c){ return c.name.toLowerCase(); }).join(', ') + '. ' : '') + 'Bottom water ' + F(o) + ' mg/L dissolved oxygen' + (o < W.HYPOXIC ? ', hypoxic, fish dead.' : o < 4.5 ? ', fish crowd near the surface.' : '.') + ' Graph: lowest ' + F(run.min) + ' mg/L on day ' + run.minDay + '.';
      return { svg: g.join(''), label: label };
      function lakePath(){ return 'M' + lakeL + ' ' + surf + ' L' + (R + 20) + ' ' + surf + ' L' + (R + 20) + ' ' + bottom + ' L' + (lakeL + 70) + ' ' + bottom + ' Q' + (lakeL + 30) + ' ' + bottom + ' ' + lakeL + ' ' + surf + ' Z'; }
    }
    function doGraph(L, R, top, bot, phone, Lo){
      var g = [], yMax = Math.ceil(run.osat + 1), aMax = 45, x0 = L + 30, x1 = R - 8, labs = [];
      var x = function(d){ return x0 + d / W.LAKE_DAYS * (x1 - x0); }, y = function(v){ return bot - v / yMax * (bot - top); }, ya = function(v){ return bot - Math.min(v, aMax) / aMax * (bot - top) * 0.92; };
      var yh = y(W.HYPOXIC);
      g.push('<rect class="wp-hypo" x="' + x0 + '" y="' + yh.toFixed(1) + '" width="' + (x1 - x0) + '" height="' + (bot - yh).toFixed(1) + '"/>');
      for(var v = 0; v <= yMax; v += yMax > 10 ? 4 : 2){ g.push('<line class="wp-grid" x1="' + x0 + '" x2="' + x1 + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="wp-tk" x="' + (x0 - 5) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>'); }
      [0, 10, 20, 30, 40, 50, 60].forEach(function(d){ g.push('<text class="wp-tk" x="' + x(d).toFixed(1) + '" y="' + (bot + 15) + '" text-anchor="middle">' + d + '</text>'); });
      g.push('<line class="wp-sat" x1="' + x0 + '" x2="' + x1 + '" y1="' + y(run.osat).toFixed(1) + '" y2="' + y(run.osat).toFixed(1) + '"/>');
      var doPts = run.days.map(function(d){ return [x(d), y(run.O[d])]; });
      Lo.line(doPts, 3);
      if(showAlgae && level > 0){
        var aPts = run.days.map(function(d){ return [x(d), ya(run.A[d])]; });
        g.push('<polygon class="wp-algae-a" points="' + x0 + ',' + bot + ' ' + aPts.map(function(q){ return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ') + ' ' + x1 + ',' + bot + '"/>');
        Lo.line(aPts, 2);
      }
      var past = [], fut = [];
      run.days.forEach(function(d){ var q = x(d).toFixed(1) + ',' + y(run.O[d]).toFixed(1); if(d <= day) past.push(q); if(d >= day) fut.push(q); });
      if(fut.length > 1) g.push('<polyline class="wp-do is-fut" points="' + fut.join(' ') + '"/>');
      if(past.length > 1) g.push('<polyline class="wp-do" points="' + past.join(' ') + '"/>');
      g.push('<line class="wp-axis" x1="' + x0 + '" x2="' + x1 + '" y1="' + bot + '" y2="' + bot + '"/><line class="wp-axis" x1="' + x0 + '" x2="' + x0 + '" y1="' + top + '" y2="' + bot + '"/>');
      var dx = x(day), dy = y(run.O[day]);
      g.push('<line class="wp-now" x1="' + dx.toFixed(1) + '" x2="' + dx.toFixed(1) + '" y1="' + top + '" y2="' + bot + '"/><circle class="wp-now-pt" cx="' + dx.toFixed(1) + '" cy="' + dy.toFixed(1) + '" r="5.5"/>');
      Lo.rect(dx - 7, dy - 7, dx + 7, dy + 7);
      var PLOT = { x0: x0 + 2, y0: top - 2, x1: x1, y1: bot - 1 }, xsR = steps(x1 - 2, x0 + 120, 24);
      // the hypoxic label: inside the band, toward its right end, clear of both curves
      var ht = phone ? 'Hypoxic: under 2 mg/L' : 'Hypoxic (dead zone): under 2 mg/L', hy = [yh + 13, bot - 4, yh + (bot - yh) / 2 + 4];
      var hp = Lo.place(ht, 11.5, 800, grid(xsR, hy, [x1, yh + 13], 'end'), { within: { x0: x0 + 2, y0: yh + 1, x1: x1, y1: bot }, optional: true }) ||
        Lo.place(phone ? 'Hypoxic below this line' : 'Hypoxic (dead zone) below 2 mg/L', 11.5, 800, grid(xsR, [yh - 4, yh - 18, yh - 32], [x1, yh - 4], 'end'), { within: PLOT });
      if(hp && /below/.test(ht) === false && hp.y < yh) ht = phone ? 'Hypoxic below this line' : 'Hypoxic (dead zone) below 2 mg/L';
      labs.push(bgr(hp, 'wp-lbg') + '<text class="wp-hypo-t" ' + at(hp) + '>' + ht + '</text>');
      var st = 'saturation ' + F(run.osat) + ' mg/L at ' + tLake + ' °C', sp = Lo.place(st, 11.5, 700, grid(xsR, [y(run.osat) - 5, y(run.osat) + 14], [x1, y(run.osat) - 5], 'end'), { within: PLOT });
      labs.push(bgr(sp, 'wp-lbg') + '<text class="wp-tk" ' + at(sp) + '>' + st + '</text>');
      if(showAlgae && level > 0){
        var pk = run.peakDay, apx = x(pk), apy = ya(run.A[pk]);
        var ap = Lo.place('algae', 12.5, 800, [[apx - 8, apy + 6, 'end'], [apx + 8, apy + 4, 'start'], [apx, apy - 8, 'middle']].concat(grid(steps(x0 + 6, x(pk + 20), 16), steps(apy, bot - 4, 8), [apx, apy], 'middle')), { within: PLOT, optional: true });
        if(ap) labs.push('<text class="wp-lab wp-c-alg" ' + at(ap) + '>algae</text>');
      }
      g.push(labs.join(''));
      g.push('<text class="wp-axl wp-c-oxy" x="' + x0 + '" y="' + (top - 10) + '">Bottom-water oxygen (mg/L)</text><text class="wp-axl" x="' + ((x0 + x1) / 2) + '" y="' + (bot + 31) + '" text-anchor="middle">Days after the runoff</text>');
      return g.join('');
    }
    function chainStrip(L, R, y0, h, s, phone){
      var g = [], n = W.CHAIN.length, gap = 4, w = (R - L - gap * (n - 1)) / n;
      W.CHAIN.forEach(function(c, i){
        var x = L + i * (w + gap), on = s >= i && level > 0, cur = s === i && level > 0 && day > 0 && !recovering();
        g.push('<g class="wp-link' + (on ? ' is-on' : '') + (cur ? ' is-cur' : '') + (i === 5 ? ' is-end' : '') + '"><path d="M' + x + ' ' + y0 + ' h' + (w - 6) + ' l6 ' + (h / 2) + ' l-6 ' + (h / 2) + ' h' + (-(w - 6)) + (i ? ' l6 ' + (-h / 2) : '') + ' z"/>' +
          (phone && !cur ? '<text x="' + (x + w / 2 + 2) + '" y="' + (y0 + h / 2 + 4) + '" text-anchor="middle">' + (i + 1) + '</text>' : '<text x="' + (x + w / 2 + 2) + '" y="' + (y0 + h / 2 + 4) + '" text-anchor="middle">' + esc(phone ? shortName(c.name) : c.name) + '</text>') + '</g>');
      });
      return g.join('');
    }
    function shortName(n){ return { 'Algal bloom': 'Bloom', 'Algae die': 'Die-off', 'Decomposition': 'Decay', 'Oxygen falls': 'O₂ falls', 'Dead zone': 'Dead zone', 'Nutrients': 'Nutrients' }[n] || n; }
    function tag(x, y, text, cls, anchor){
      return '<text class="wp-tag ' + (cls || '') + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (anchor || 'middle') + '">' + esc(text) + '</text>';
    }
    function fish(x, y, dead, flip){
      var s = flip ? -1 : 1;
      if(dead) return '<g class="wp-fish is-dead" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s + ' -1)"><path d="M-12 0 Q-2 -7 10 0 Q-2 7 -12 0 Z M-12 0 L-19 -5 L-19 5 Z"/><path class="wp-x" d="M5 -2 l3 3 m0 -3 l-3 3"/></g>';
      return '<g class="wp-fish" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s + ' 1)"><path d="M-12 0 Q-2 -7 10 0 Q-2 7 -12 0 Z M-12 0 L-19 -5 L-19 5 Z"/><circle class="wp-eye" cx="5" cy="-1.5" r="1.3"/></g>';
    }
    function mix(a, b, t){ t = Math.max(0, Math.min(1, t)); return 'rgb(' + [0, 1, 2].map(function(i){ return Math.round(a[i] + (b[i] - a[i]) * t); }).join(',') + ')'; }
    function dark(){ return document.documentElement.getAttribute('data-theme') === 'dark'; }
    function waterTop(A){ return dark() ? mix([40, 92, 128], [36, 112, 62], A / 30) : mix([150, 205, 232], [104, 176, 92], A / 30); }
    function waterMid(A){ return dark() ? mix([28, 70, 104], [30, 84, 52], A / 40) : mix([92, 162, 206], [80, 146, 98], A / 40); }
    function bottomCol(o, Os){ var t = 1 - Math.max(0, Math.min(1, (o - 0.5) / (Os - 0.5))); return dark() ? mix([24, 58, 92], [62, 40, 34], t) : mix([52, 116, 172], [96, 72, 58], t); }

    function heatScene(Wd, H){
      var phone = Wd < 560, g = [], L = phone ? 8 : 16, R = Wd - (phone ? 8 : 16), h = heatPts();
      var sceneH = Math.round(H * (phone ? 0.5 : 0.52)), gTop = sceneH + 34, gBot = H - 64;
      var bank = Math.round(sceneH * 0.38), rTop = bank + 8, rBot = sceneH - 8, plantX = L + (R - L) * 0.42;
      g.push('<defs><linearGradient id="wpPlume" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="wp-pl0"/><stop offset="1" class="wp-pl1"/></linearGradient></defs>');
      g.push('<rect class="wp-skyr2" x="0" y="0" width="' + Wd + '" height="' + bank + '"/>');
      g.push('<rect class="wp-bank" x="0" y="' + (bank - 10) + '" width="' + Wd + '" height="18"/>');
      // power plant: building, stack, cooling-water pipes
      var bx = plantX - 50, by = bank - 70;
      g.push('<g class="wp-plant"><rect x="' + bx + '" y="' + by + '" width="100" height="60" rx="3"/><rect class="wp-stack" x="' + (bx + 70) + '" y="' + (by - 40) + '" width="14" height="40"/><rect class="wp-win" x="' + (bx + 12) + '" y="' + (by + 14) + '" width="14" height="12"/><rect class="wp-win" x="' + (bx + 36) + '" y="' + (by + 14) + '" width="14" height="12"/></g>');
      if(!phone || Wd > 380) g.push('<text class="wp-lab" x="' + plantX + '" y="' + (by - 8) + '" text-anchor="middle">Power plant</text>');
      // river with the warm plume downstream of the outfall
      g.push('<rect class="wp-river" x="0" y="' + rTop + '" width="' + Wd + '" height="' + (rBot - rTop) + '"/>');
      var heatT = warm / 15;
      if(warm > 0) g.push('<path style="opacity:' + (0.25 + 0.7 * heatT).toFixed(2) + '" fill="url(#wpPlume)" d="M' + (plantX + 30) + ' ' + rTop + ' Q' + (plantX + 120) + ' ' + (rTop + (rBot - rTop) * 0.25) + ' ' + R + ' ' + (rTop + (rBot - rTop) * (0.4 + 0.4 * heatT)) + ' L' + (R + 20) + ' ' + rTop + ' Z"/>');
      g.push('<path class="wp-pipe" d="M' + (plantX - 30) + ' ' + (bank - 10) + ' v' + (rTop - bank + 20) + '"/><path class="wp-pipe" d="M' + (plantX + 30) + ' ' + (bank - 10) + ' v' + (rTop - bank + 20) + '"/>');
      g.push('<text class="wp-tk" x="' + (plantX - 34) + '" y="' + (bank + 28) + '" text-anchor="end">intake</text><text class="wp-tk wp-c-heat" x="' + (plantX + 34) + '" y="' + (bank + 28) + '">warm outflow</text>');
      // flow arrows
      for(var k = 0; k < 3; k++){ var ax = L + 20 + k * 40; g.push('<path class="wp-flow" d="M' + ax + ' ' + (rBot - 16) + ' h24 m-6 -4 l6 4 l-6 4"/>'); }
      // thermometers
      g.push(thermo(L + (phone ? 30 : 60), rTop - 4, h.t0, 'Upstream'));
      g.push(thermo(R - (phone ? 40 : 80), rTop - 4, h.t1, 'Downstream'));
      // fish: upstream fine; downstream fewer and higher with heat
      g.push(fish(L + (R - L) * 0.16, rTop + (rBot - rTop) * 0.62, false, false));
      g.push(fish(L + (R - L) * 0.24, rTop + (rBot - rTop) * 0.4, false, false));
      var dn = h.d1 < 7.6 ? 1 : 2;
      for(var f = 0; f < dn; f++) g.push(fish(L + (R - L) * (0.7 + f * 0.1), rTop + (rBot - rTop) * (0.55 - f * 0.2), false, false));
      // the saturation graph
      var x0 = L + 30, x1 = R - 8, yMax = 16, x = function(t){ return x0 + t / 35 * (x1 - x0); }, y = function(v){ return gBot - v / yMax * (gBot - gTop); };
      for(var v = 0; v <= yMax; v += 4) g.push('<line class="wp-grid" x1="' + x0 + '" x2="' + x1 + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="wp-tk" x="' + (x0 - 5) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>');
      for(var t = 0; t <= 35; t += 5) g.push('<text class="wp-tk" x="' + x(t).toFixed(1) + '" y="' + (gBot + 15) + '" text-anchor="middle">' + t + '</text>');
      g.push('<polyline class="wp-osat" points="' + W.OSAT.map(function(p){ return x(p[0]).toFixed(1) + ',' + y(p[1]).toFixed(1); }).join(' ') + '"/>');
      W.OSAT.forEach(function(p){ g.push('<circle class="wp-osat-pt" cx="' + x(p[0]).toFixed(1) + '" cy="' + y(p[1]).toFixed(1) + '" r="3"/>'); });
      var LoH = layout(Wd, H), curve = W.OSAT.map(function(p){ return [x(p[0]), y(p[1])]; }), marks = warm > 0 ? [[h.t0, h.d0, 'wp-c-oxy'], [h.t1, h.d1, 'wp-c-heat']] : [[h.t0, h.d0, 'wp-c-oxy']];
      LoH.line(curve, 3);
      marks.forEach(function(q){ var px = x(q[0]), py = y(q[1]); LoH.line([[px, gBot], [px, py]], 1); LoH.line([[x0, py], [px, py]], 1); LoH.rect(px - 8, py - 8, px + 8, py + 8); });
      marks.forEach(function(q, i){
        var px = x(q[0]), py = y(q[1]);
        g.push('<line class="wp-guide" x1="' + px.toFixed(1) + '" x2="' + px.toFixed(1) + '" y1="' + gBot + '" y2="' + py.toFixed(1) + '"/><line class="wp-guide" x1="' + x0 + '" x2="' + px.toFixed(1) + '" y1="' + py.toFixed(1) + '" y2="' + py.toFixed(1) + '"/>');
        g.push('<circle class="wp-mark ' + (i ? 'is-warm' : 'is-cool') + '" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="6"/>');
      });
      marks.forEach(function(q){
        var px = x(q[0]), py = y(q[1]), t = F(q[1]) + ' mg/L';
        var p = LoH.place(t, 12.5, 800, [[px + 10, py - 10, 'start'], [px + 10, py + 20, 'start'], [px - 10, py - 10, 'end'], [px - 10, py + 20, 'end'], [px + 10, py - 26, 'start'], [px + 10, py + 36, 'start']], { within: { x0: x0 + 2, y0: gTop, x1: x1, y1: gBot - 2 } });
        g.push('<text class="wp-lab ' + q[2] + '" ' + at(p) + '>' + t + '</text>');
      });
      g.push('<line class="wp-axis" x1="' + x0 + '" x2="' + x1 + '" y1="' + gBot + '" y2="' + gBot + '"/><line class="wp-axis" x1="' + x0 + '" x2="' + x0 + '" y1="' + gTop + '" y2="' + gBot + '"/>');
      g.push('<text class="wp-axl wp-c-oxy" x="' + x0 + '" y="' + (gTop - 8) + '">Most oxygen the water can hold (mg/L)</text><text class="wp-axl" x="' + ((x0 + x1) / 2) + '" y="' + (gBot + 31) + '" text-anchor="middle">Water temperature (°C)</text>');
      var label = 'River and power plant. Upstream ' + h.t0 + ' °C, below the plant ' + h.t1 + ' °C. Graph of oxygen saturation against temperature (USGS): ' + F(h.d0) + ' mg/L at ' + h.t0 + ' °C, ' + F(h.d1) + ' mg/L at ' + h.t1 + ' °C.';
      return { svg: g.join(''), label: label };
      function thermo(tx, ty, temp, name){
        var hgt = Math.min(64, bank - 6), frac = Math.max(0.08, Math.min(1, temp / 35));
        return '<g class="wp-thermo-g"><rect class="wp-tube" x="' + (tx - 4) + '" y="' + (ty - hgt) + '" width="8" height="' + hgt + '" rx="4"/><rect class="wp-merc" x="' + (tx - 2) + '" y="' + (ty - hgt * frac) + '" width="4" height="' + (hgt * frac) + '"/><circle class="wp-bulb" cx="' + tx + '" cy="' + ty + '" r="6"/>' +
          '<text class="wp-lab" x="' + (tx + 10) + '" y="' + (ty - hgt + 12) + '">' + temp + ' °C</text>' + (phone ? '' : '<text class="wp-tk" x="' + (tx + 10) + '" y="' + (ty - hgt + 26) + '">' + name + '</text>') + '</g>';
      }
    }

    function sewScene(Wd, H){
      var phone = Wd < 560, g = [], L = phone ? 6 : 16, R = Wd - (phone ? 6 : 16), S = W.SEWAGE, st = S.stages[stages];
      var n = 5, gap = phone ? 6 : 14, rw = phone ? 40 : 70, tw = (R - L - rw - gap * n) / n, ty = phone ? 62 : 66, th = Math.round(H * (phone ? 0.2 : 0.24));
      var NAMES = phone ? ['Raw', 'Primary', 'Second.', 'Tertiary', 'Disinfect'] : ['Raw sewage', 'Primary', 'Secondary', 'Tertiary', 'Disinfection'];
      g.push(phone ? '<text class="wp-axl" x="' + L + '" y="16">Water flows left to right.</text><text class="wp-tk" x="' + L + '" y="31">' + (stages < 4 ? 'Stages after ' + esc(st.name.toLowerCase()) + ' are skipped.' : 'Every stage is used.') + '</text>' : '<text class="wp-axl" x="' + L + '" y="18">Water flows left to right; ' + (stages < 4 ? 'stages after ' + esc(st.name.toLowerCase()) + ' are skipped' : 'every stage is used') + '</text>');
      for(var i = 0; i < n; i++){
        var x = L + i * (tw + gap), on = i <= stages, cur = i === stages;
        g.push('<g class="wp-tank' + (on ? ' is-on' : ' is-off') + (cur ? ' is-cur' : '') + '"><rect x="' + x.toFixed(1) + '" y="' + ty + '" width="' + tw.toFixed(1) + '" height="' + th + '" rx="8"/>' + tankArt(i, x, ty, tw, th, on) +
          '<text class="wp-tname" x="' + (x + tw / 2).toFixed(1) + '" y="' + (ty - 8) + '" text-anchor="middle">' + NAMES[i] + '</text></g>');
        if(i < n) g.push('<path class="wp-pipe2' + (i < stages ? '' : ' is-skip') + '" d="M' + (x + tw).toFixed(1) + ' ' + (ty + th * 0.5) + ' h' + gap + '"/>');
      }
      if(stages < 4){ var sx = L + (stages + 1) * (tw + gap) - gap; g.push('<path class="wp-bypass" d="M' + (sx + gap / 2).toFixed(1) + ' ' + (ty + th + 6) + ' V' + (ty + th + 16) + ' H' + (R - rw / 2).toFixed(1) + ' V' + (ty + th * 0.8) + '"/><text class="wp-tk wp-c-bad" x="' + Math.min(R - 4, Math.max(L + 70, (sx + R - rw / 2) / 2)).toFixed(1) + '" y="' + (ty + th + 30) + '" text-anchor="middle">' + (phone ? 'skipped' : 'skipped: straight to the river') + '</text>'); }
      // the river below the outfall
      var rx = R - rw, lf = st.left, bloom = lf.nutrients > 50, germs = lf.pathogens >= 1;
      g.push('<rect class="wp-river' + (bloom ? ' is-bloom' : '') + '" x="' + rx + '" y="' + ty + '" width="' + rw + '" height="' + th + '" rx="8"/><text class="wp-tname" x="' + (rx + rw / 2) + '" y="' + (ty - 8) + '" text-anchor="middle">River</text>');
      if(bloom) for(var b = 0; b < 8; b++) g.push('<circle class="wp-alga" cx="' + (rx + 8 + (b * 37 % (rw - 14))) + '" cy="' + (ty + 8 + (b * 13 % 18)) + '" r="3"/>');
      if(germs) g.push(phone ? '<g class="wp-germs">' + [0, 1, 2].map(function(k){ return '<circle cx="' + (rx + 10 + k * 10) + '" cy="' + (ty + th - 12 - (k % 2) * 6) + '" r="3"/>'; }).join('') + '</g>' : '<text class="wp-tk wp-c-bad" x="' + (rx + rw / 2) + '" y="' + (ty + th - 8) + '" text-anchor="middle">pathogens</text>');
      // bars: what is left after the chosen stage
      var bTop = ty + th + 70, bBot = H - 64, bw = (R - L - 30) / S.parts.length, x0 = L + 30, y = function(v){ return bBot - v / 100 * (bBot - bTop); };
      g.push('<text class="wp-axl" x="' + L + '" y="' + (bTop - 12) + '">Left in the water after ' + esc(st.name.toLowerCase()) + ' (% of the raw load)</text>');
      [0, 25, 50, 75, 100].forEach(function(v){ g.push('<line class="wp-grid" x1="' + x0 + '" x2="' + (R - 4) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="wp-tk" x="' + (x0 - 5) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>'); });
      var CLS = { solids: 'is-sol', bod: 'is-bod', nutrients: 'is-nut', pathogens: 'is-path' }, SHORT = { solids: 'Solids', bod: 'Organic (BOD)', nutrients: 'N and P', pathogens: 'Pathogens' };
      S.parts.forEach(function(p, j){
        var v = lf[p.k], bx = x0 + j * bw + bw * 0.18, ww = bw * 0.64, raw = 100;
        g.push('<rect class="wp-bar-raw" x="' + bx.toFixed(1) + '" y="' + y(raw).toFixed(1) + '" width="' + ww.toFixed(1) + '" height="' + (bBot - y(raw)).toFixed(1) + '"/>');
        g.push('<rect class="wp-bar ' + CLS[p.k] + '" x="' + bx.toFixed(1) + '" y="' + y(Math.max(v, 0.6)).toFixed(1) + '" width="' + ww.toFixed(1) + '" height="' + (bBot - y(Math.max(v, 0.6))).toFixed(1) + '"/>');
        g.push(v > 85 ? '<text class="wp-lab wp-in" x="' + (bx + ww / 2).toFixed(1) + '" y="' + (y(v) + 18).toFixed(1) + '" text-anchor="middle">' + pctTxt(v) + '</text>' : '<text class="wp-lab" x="' + (bx + ww / 2).toFixed(1) + '" y="' + (y(Math.max(v, 0.6)) - 6).toFixed(1) + '" text-anchor="middle">' + pctTxt(v) + '</text>');
        g.push('<text class="wp-tk" x="' + (bx + ww / 2).toFixed(1) + '" y="' + (bBot + 15) + '" text-anchor="middle">' + (phone ? SHORT[p.k].replace('Organic (BOD)', 'BOD') : SHORT[p.k]) + '</text>');
      });
      g.push('<line class="wp-axis" x1="' + x0 + '" x2="' + (R - 4) + '" y1="' + bBot + '" y2="' + bBot + '"/>');
      return { svg: g.join(''), label: 'Sewage treatment plant, treated through ' + st.name.toLowerCase() + '. ' + sewLine() + (bloom ? ' The river below grows algae.' : '') };
    }

    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.wp-fig')], dock: [$('.wp-ctl')], setup: 'Settings', moreLabel: 'Lake and river temperature', why: [$('.wp-say')], details: [$('.wp-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      syncView(); draw(); words();
      if(s.mode() === 'explore') hintSlot(s, s.root.querySelector('.wp-play'), 'Start here: play the next 60 days', s.root.querySelector('.wp-go'));
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ draw(); }, 60); }).observe($('.wp-fig')); }
      try{ new MutationObserver(function(){ draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
    }
    syncView(); draw(); words();
    return { stop: stop, studio: studio };
  }

  function tankArt(i, x, y, w, h, on){
    var g = [], cx = x + w / 2;
    if(i === 0){ for(var k = 0; k < 6; k++) g.push('<circle class="wp-solid" cx="' + (x + 8 + (k * 23 % (w - 16))).toFixed(1) + '" cy="' + (y + 12 + (k * 17 % (h - 24))).toFixed(1) + '" r="' + (2 + k % 3) + '"/>'); }
    if(i === 1){ g.push('<rect class="wp-sludge" x="' + (x + 4) + '" y="' + (y + h - 16) + '" width="' + (w - 8) + '" height="12" rx="4"/>'); for(var a = 0; a < 3; a++) g.push('<path class="wp-arrowdn" d="M' + (x + w * (0.3 + a * 0.2)).toFixed(1) + ' ' + (y + 12) + ' v' + (h - 40) + ' m-4 -6 l4 6 l4 -6"/>'); if(w > 60) g.push('<text class="wp-tk" x="' + cx.toFixed(1) + '" y="' + (y + h - 20) + '" text-anchor="middle">sludge</text>'); }
    if(i === 2){ for(var b = 0; b < 9; b++) g.push('<circle class="wp-bubble" cx="' + (x + 8 + (b * 19 % (w - 16))).toFixed(1) + '" cy="' + (y + h - 10 - (b * 23 % (h - 22))).toFixed(1) + '" r="' + (2 + b % 3) + '"/>'); for(var c = 0; c < 5; c++) g.push('<rect class="wp-bac" x="' + (x + 10 + (c * 29 % (w - 20))).toFixed(1) + '" y="' + (y + 14 + (c * 31 % (h - 30))).toFixed(1) + '" width="6" height="2.6" rx="1.3"/>'); }
    if(i === 3){ for(var p = 0; p < 4; p++){ var px = x + 10 + p * (w - 20) / 3; g.push('<path class="wp-reed" d="M' + px.toFixed(1) + ' ' + (y + h - 6) + ' q-3 -' + (h * 0.45).toFixed(0) + ' 2 -' + (h * 0.7).toFixed(0) + ' M' + px.toFixed(1) + ' ' + (y + h - 6) + ' q5 -' + (h * 0.35).toFixed(0) + ' 8 -' + (h * 0.5).toFixed(0) + '"/>'); } }
    if(i === 4){ g.push('<rect class="wp-uv" x="' + (cx - 5).toFixed(1) + '" y="' + (y + 10) + '" width="10" height="' + (h - 20) + '" rx="5"/>'); for(var u = 0; u < 4; u++) g.push('<line class="wp-uvr" x1="' + (cx + 8).toFixed(1) + '" x2="' + (cx + 16).toFixed(1) + '" y1="' + (y + 18 + u * (h - 36) / 3).toFixed(1) + '" y2="' + (y + 18 + u * (h - 36) / 3).toFixed(1) + '"/>'); }
    return g.join('');
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'water-pollution', noun: 'drill',
      generate: function(r, ctx, type){ return W.generate(r, ctx, type); },
      types: [{ value: 'chain', label: 'Read the oxygen graph' }, { value: 'dochange', label: 'Percent change in oxygen' }, { value: 'thermal', label: 'Thermal pollution' }, { value: 'sewage', label: 'Sewage treatment' }, { value: 'load', label: 'Nutrient load' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { chain: 'The eutrophication chain', dochange: 'Percent change in dissolved oxygen', thermal: 'Thermal pollution', sewage: 'Sewage treatment', load: 'A nitrate load' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); }
    });
  }
  /* The drill's figure, drawn from the problem's own numbers; a value is
     written on it only once its step is answered, so it never gives a key
     away. */
  function figure(el, p, st){
    st = st || {};
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    var phone = (window.innerWidth || 1280) <= 640, Wd = phone ? 340 : 600, H = phone ? 280 : 300, out = [], label = '';
    var L = 40, R = Wd - 14, top = 30, bot = H - 40;
    if(g.kind === 'lake'){
      var yMax = Math.ceil(g.osat + 1), x = function(d){ return L + d / 60 * (R - L); }, y = function(v){ return bot - v / yMax * (bot - top); }, aMax = 45, ya = function(v){ return bot - Math.min(v, aMax) / aMax * (bot - top) * 0.92; };
      out.push('<rect class="wp-hypo" x="' + L + '" y="' + y(2).toFixed(1) + '" width="' + (R - L) + '" height="' + (bot - y(2)).toFixed(1) + '"/><text class="wp-hypo-t" x="' + (R - 4) + '" y="' + (bot - 5) + '" text-anchor="end">2 mg/L</text>');
      for(var v = 0; v <= yMax; v += 2) out.push('<line class="wp-grid" x1="' + L + '" x2="' + R + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="wp-tk" x="' + (L - 5) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>');
      [0, 10, 20, 30, 40, 50, 60].forEach(function(d){ out.push('<line class="wp-grid" x1="' + x(d).toFixed(1) + '" x2="' + x(d).toFixed(1) + '" y1="' + top + '" y2="' + bot + '"/><text class="wp-tk" x="' + x(d).toFixed(1) + '" y="' + (bot + 15) + '" text-anchor="middle">' + d + '</text>'); });
      out.push('<polygon class="wp-algae-a" points="' + L + ',' + bot + ' ' + g.algae.map(function(q){ return x(q[0]).toFixed(1) + ',' + ya(q[1]).toFixed(1); }).join(' ') + ' ' + R + ',' + bot + '"/>');
      out.push('<polyline class="wp-do" points="' + g.series.map(function(q){ return x(q[0]).toFixed(1) + ',' + y(q[1]).toFixed(1); }).join(' ') + '"/>');
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
      W.OSAT.forEach(function(q){ out.push('<circle class="wp-osat-pt" cx="' + xs(q[0]).toFixed(1) + '" cy="' + ys(q[1]).toFixed(1) + '" r="3.5"/><text class="wp-tk" x="' + (xs(q[0]) + 4).toFixed(1) + '" y="' + (ys(q[1]) - 7).toFixed(1) + '">' + F(q[1]) + '</text>'); });
      [g.t0, g.t1].forEach(function(t, i){ out.push('<line class="wp-guide ' + (i ? 'is-warm' : '') + '" x1="' + xs(t).toFixed(1) + '" x2="' + xs(t).toFixed(1) + '" y1="' + top + '" y2="' + bot + '"/>'); });
      out.push('<line class="wp-axis" x1="' + L + '" x2="' + R + '" y1="' + bot + '" y2="' + bot + '"/><line class="wp-axis" x1="' + L + '" x2="' + L + '" y1="' + top + '" y2="' + bot + '"/><text class="wp-axl wp-c-oxy" x="' + L + '" y="' + (top - 10) + '">Oxygen at saturation (mg/L), USGS</text><text class="wp-axl" x="' + R + '" y="' + (bot + 30) + '" text-anchor="end">Temperature (°C)</text>');
      label = 'Oxygen saturation of fresh water against temperature, USGS: ' + W.OSAT.map(function(q){ return q[0] + ' °C ' + F(q[1]) + ' mg/L'; }).join(', ') + '. Dashed lines at ' + g.t0 + ' and ' + g.t1 + ' °C.';
    } else if(g.kind === 'plant'){
      var names = ['Raw sewage', 'Primary', 'Secondary'], vals = [g.bod, st.after1 ? g.a1 : null, st.after2a ? g.a2 : null], gap = phone ? 30 : 60, tw = (Wd - 28 - 2 * gap) / 3, ty = top + 40, th = H * 0.42;
      names.forEach(function(nm, i){
        var x = 14 + i * (tw + gap);
        out.push('<g class="wp-tank is-on"><rect x="' + x.toFixed(1) + '" y="' + ty + '" width="' + tw.toFixed(1) + '" height="' + th.toFixed(0) + '" rx="8"/>' + tankArt(i, x, ty, tw, th, true) + '</g><text class="wp-tname" x="' + (x + tw / 2).toFixed(1) + '" y="' + (ty - 10) + '" text-anchor="middle">' + nm + '</text>');
        out.push('<text class="wp-lab' + (vals[i] == null ? ' wp-muted' : '') + '" x="' + (x + tw / 2).toFixed(1) + '" y="' + (ty + th + 24).toFixed(1) + '" text-anchor="middle">' + (vals[i] != null ? 'BOD ' + F(vals[i]) + ' mg/L' : 'BOD ?') + '</text>');
        if(i < 2){ var ax = x + tw, ay = ty + th / 2; out.push('<path class="wp-pipe2" d="M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + ' h' + gap + '"/><text class="wp-tk wp-c-bad" x="' + (ax + gap / 2).toFixed(1) + '" y="' + (ay - 10).toFixed(1) + '" text-anchor="middle">−' + (i ? g.p2 : g.p1) + '%</text>'); }
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
