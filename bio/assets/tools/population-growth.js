/* Simulator: population growth (Unit 8). The model is in bio-tool-math.js
   (ApBioMath.population): exponential dN/dt = r_max·N and logistic
   dN/dt = r_max·N·(K − N)/K, stepped with Euler's method; density-independent
   events and a change in K. The defaults, slider ranges, events, the
   "How this model works" box, the questions and the mini FRQ are data
   (bio/data/tools/population-growth.json). The student sets the model and
   its numbers, reads N, dN/dt and the per-capita rate at any time (two
   graphs, a readout and a numbered explanation), and runs trials into a
   data table.

   Job: see why a population grows fast, then slows as it nears K, and how a
   disaster or a new K changes the course.

   Tools upgrade (U-Bio-sims, lighter version): a field stage first in the
   card: one dot per individual (one dot per 10, 100 ... above 600 dots, said
   on the field), the carrying capacity as a dashed fence of space (the field
   fills it as N approaches K), new births since the year before glowing, and
   a flood that wipes the share it removes. Play runs the year from 0 to the
   end; drag the year marker on the N graph (or use the slider) to scrub.
   "Flood" and "Frost" toggle the data's events from the stage. */
(function(){
  'use strict';
  var SLUG = 'population-growth';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  T.mount(SLUG, function(app, data, ctx){
    var esc = T.esc, F = T.F, Pop = M.population, D = data.defaults, RG = data.ranges;
    var st = { model: D.model, N0: D.N0, r: D.r, K: D.K, dt: D.dt, tEnd: D.tEnd, readT: D.readT, view: 'rate',
      events: data.events.map(function(e){ return { id: e.id, label: e.label, on: false, t: e.t, f: e.f }; }),
      kc: { on: false, t: data.kChange.t, K: data.kChange.K } };
    var runs = [], ctl = {};
    var MODELS = [['log', 'Logistic: dN/dt = rmaxN(K − N)/K'], ['exp', 'Exponential: dN/dt = rmaxN']];

    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
      '<section class="bt-card pg-card" aria-labelledby="pg-h"><h2 id="pg-h">The model</h2>' +
      '<p class="bt-first">Press Play the years and watch the population fill its space.</p>' +
      '<div class="bt-fig pg-field bt-hero"></div>' +
      '<div class="os-play pg-play"><button type="button" class="btn-press sm" data-a="play">Play the years</button><span class="pg-evbtns"></span><p class="os-clock pg-clock" aria-hidden="true"></p></div>' +
      '<fieldset class="bt-modes bt-more"><legend>Growth model</legend>' + MODELS.map(function(m){
        var id = 'pg-model-' + m[0];
        return '<div class="bt-radio"><input type="radio" name="pg-model" id="' + id + '" value="' + m[0] + '"' + (m[0] === st.model ? ' checked' : '') + '><label for="' + id + '">' + esc(m[1]) + '</label></div>';
      }).join('') + '</fieldset>' +
      '<div class="bt-controls pg-main" data-primary="2"></div>' +
      '<fieldset class="bt-ctl pg-events bt-more"><legend>Events (optional)</legend><div class="bt-controls pg-ev"></div></fieldset>' +
      '<div class="bt-controls pg-read bt-num"></div>' +
      '<div class="bt-stage two bt-num"><div><h3 class="pg-gh">Population size over time</h3><p class="bt-small">Drag across the graph to move the year.</p><div class="pg-plot-n"></div><p class="bt-small pg-key-n"></p></div>' +
      '<div><div class="bt-tabs" role="group" aria-label="Second graph">' +
      '<button type="button" class="bt-btn" data-v="rate" aria-pressed="true">dN/dt against N</button><button type="button" class="bt-btn" data-v="percap" aria-pressed="false">Per-capita rate against N</button>' +
      '</div><div class="pg-plot-r"></div><p class="bt-small pg-key-r"></p></div></div>' +
      '<dl class="bt-readout pg-out"></dl><div class="pg-explain bt-num"><h3>What is happening</h3><ol></ol></div><p class="bt-summary"></p>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm" data-a="run">Run one trial</button><button type="button" class="btn-press sm alt" data-a="series">Run a series of r<sub>max</sub> values</button><button type="button" class="bt-btn" data-a="clear">Clear runs</button></div>' +
      '<p class="bt-small bt-runnote" role="status" aria-live="polite"></p>' +
      '<details class="bt-data"><summary>Data tables: your runs and the time course</summary><div class="bt-tables"></div></details></section>' +
      '<section class="bt-card" aria-labelledby="pg-q"><h2 id="pg-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');
    var card = app.querySelector('.bt-card');
    var say = T.announcer(card.querySelector('.bt-summary'));

    card.querySelectorAll('input[name="pg-model"]').forEach(function(r){
      r.addEventListener('change', function(){ if(r.checked){ st.model = r.value; enable(); update(true); } });
    });
    card.querySelectorAll('.bt-tabs .bt-btn').forEach(function(b){
      b.addEventListener('click', function(){
        st.view = b.getAttribute('data-v');
        card.querySelectorAll('.bt-tabs .bt-btn').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        update(true);
      });
    });
    card.querySelector('[data-a="run"]').addEventListener('click', function(){ run(false); });
    card.querySelector('[data-a="series"]').addEventListener('click', function(){ run(true); });
    card.querySelector('[data-a="clear"]').addEventListener('click', function(){ runs = []; card.querySelector('.bt-runnote').textContent = 'Runs cleared.'; update(true); });

    /* ------------------------------------------------------- helpers */
    function isLog(){ return st.model === 'log'; }
    function cond(r){
      return { model: st.model, N0: st.N0, r: r == null ? st.r : r, K: st.K, dt: st.dt, tEnd: st.tEnd, nMax: data.model.nMax,
        disasters: st.events.filter(function(e){ return e.on; }).map(function(e){ return { t: e.t, f: e.f }; }),
        kChange: isLog() && st.kc.on ? { t: st.kc.t, K: st.kc.K } : null };
    }
    function n0(x){ return Math.round(x).toLocaleString('en-US'); }
    function pct(f){ return Math.round(f * 100) + '%'; }
    function axisMax(v){ return T.niceMax(Math.max(v, 1) * 1.05); }
    function evText(){
      var on = st.events.filter(function(e){ return e.on; }).map(function(e){ return e.label.toLowerCase() + ' at year ' + e.t + ' removes ' + pct(e.f); });
      if(isLog() && st.kc.on) on.push('K becomes ' + n0(st.kc.K) + ' at year ' + st.kc.t);
      return on.length ? on.join('; ') : 'no events';
    }
    function setText(){ return (isLog() ? 'logistic' : 'exponential') + ', N₀ = ' + st.N0 + ', rmax = ' + F(st.r, 2) + ' per year' + (isLog() ? ', K = ' + n0(st.K) : '') + ', Δt = ' + st.dt + ' year'; }

    /* ------------------------------------------------------ controls */
    function build(){
      var main = card.querySelector('.pg-main'), ev = card.querySelector('.pg-ev'), rd = card.querySelector('.pg-read');
      ctl.N0 = T.slider({ label: 'Starting size, N₀', min: RG.N0.min, max: RG.N0.max, step: RG.N0.step, value: st.N0, unit: 'individuals', decimals: 0, onInput: function(v){ st.N0 = v; update(); } });
      ctl.r = T.slider({ label: 'Maximum per-capita growth rate, rmax', min: RG.r.min, max: RG.r.max, step: RG.r.step, value: st.r, unit: 'per year', decimals: 2, onInput: function(v){ st.r = v; update(); } });
      ctl.K = T.slider({ label: 'Carrying capacity, K', min: RG.K.min, max: RG.K.max, step: RG.K.step, value: st.K, unit: 'individuals', decimals: 0, hint: 'Logistic growth only.', onInput: function(v){ st.K = v; update(); } });
      ctl.dt = T.choiceSelect({ label: 'Time step, Δt', value: String(st.dt), options: RG.dt.map(function(x){ return { value: String(x), label: x + ' year' + (x === 1 ? '' : 's') + (x === 1 ? ' (coarse)' : x === 0.1 ? ' (close to the smooth curve)' : '') }; }),
        onChange: function(v){ st.dt = +v; update(); } });
      ctl.tEnd = T.slider({ label: 'Run length', min: RG.tEnd.min, max: RG.tEnd.max, step: RG.tEnd.step, value: st.tEnd, unit: 'years', decimals: 0,
        onInput: function(v){ st.tEnd = v; readRange(); update(); } });
      [ctl.r, ctl.K, ctl.N0, ctl.dt, ctl.tEnd].forEach(function(c){ main.appendChild(c.el); });
      st.events.forEach(function(e){
        var box = document.createElement('div');
        box.className = 'bt-ctl pg-evbox';
        var id = T.nid('pg-ev');
        box.innerHTML = '<div class="bt-check-row"><input type="checkbox" id="' + id + '"><label for="' + id + '">' + esc(e.label) + ': a density-independent event</label></div>';
        var cb = box.querySelector('input');
        var t = T.slider({ label: e.label + ' at year', min: 1, max: RG.tEnd.max, step: 1, value: e.t, unit: '', decimals: 0, onInput: function(v){ e.t = v; update(); } });
        var f = T.choiceSelect({ label: 'Share of the population it removes', value: String(e.f), options: data.fractions.map(function(x){ return { value: String(x), label: pct(x) }; }), onChange: function(v){ e.f = +v; update(); } });
        cb.addEventListener('change', function(){ e.on = cb.checked; t.disable(!e.on); f.select.disabled = !e.on; update(true); });
        t.disable(true); f.select.disabled = true;
        box.appendChild(t.el); box.appendChild(f.el);
        ev.appendChild(box);
      });
      var kb = document.createElement('div');
      kb.className = 'bt-ctl pg-evbox';
      var kid = T.nid('pg-kc');
      kb.innerHTML = '<div class="bt-check-row"><input type="checkbox" id="' + kid + '"><label for="' + kid + '">' + esc(data.kChange.label) + ' (logistic only)</label></div>';
      ctl.kcb = kb.querySelector('input');
      ctl.kt = T.slider({ label: 'K changes at year', min: 1, max: RG.tEnd.max, step: 1, value: st.kc.t, unit: '', decimals: 0, onInput: function(v){ st.kc.t = v; update(); } });
      ctl.kK = T.slider({ label: 'New carrying capacity', min: RG.K.min, max: RG.K.max, step: RG.K.step, value: st.kc.K, unit: 'individuals', decimals: 0, onInput: function(v){ st.kc.K = v; update(); } });
      ctl.kcb.addEventListener('change', function(){ st.kc.on = ctl.kcb.checked; enable(); update(true); });
      kb.appendChild(ctl.kt.el); kb.appendChild(ctl.kK.el);
      ev.appendChild(kb);
      ctl.read = readSlider();
      rd.appendChild(ctl.read.el);
      enable();
    }
    function readSlider(){
      return T.slider({ label: 'Read the population at year', min: 0, max: st.tEnd, step: 1, value: st.readT, unit: '', decimals: 0,
        hint: 'Moves the marker on both graphs and the readout below.', onInput: function(v){ st.readT = v; update(); } });
    }
    function readRange(){
      if(st.readT > st.tEnd) st.readT = st.tEnd;
      var old = ctl.read, focus = document.activeElement && old.el.contains(document.activeElement);
      ctl.read = readSlider();
      old.el.parentNode.replaceChild(ctl.read.el, old.el);
      if(focus) ctl.read.input.focus();
    }
    function enable(){
      ctl.K.disable(!isLog());
      ctl.kcb.disabled = !isLog();
      ctl.kt.disable(!(isLog() && st.kc.on)); ctl.kK.disable(!(isLog() && st.kc.on));
    }

    /* ------------------------------------------------------- explain */
    function explain(p, sim){
      var out = [], c = cond();
      if(isLog()){
        out.push('At year ' + F(p.t, 0) + ' there are ' + n0(p.N) + ' individuals and the carrying capacity is ' + n0(p.K) + ', so (K − N)/K = ' + F((p.K - p.N) / p.K, 3) + '.');
        if(p.N < p.K) out.push('Each individual adds r<sub>max</sub> × (K − N)/K = ' + F(c.r, 2) + ' × ' + F((p.K - p.N) / p.K, 3) + ' = ' + F(p.perCap, 3) + ' individuals per year (the per-capita rate). ' +
          (p.N < p.K / 2 ? 'Resources are still plentiful, so it is close to r<sub>max</sub>.' : 'Competition for limited resources has pulled it well below r<sub>max</sub>.'));
        else if(p.N > p.K + 1e-6) out.push('N is above K, so (K − N)/K is negative: deaths outnumber births and the per-capita rate is ' + F(p.perCap, 3) + ' per year.');
        else out.push('N has reached K: births equal deaths, so the per-capita rate is 0.');
        out.push('dN/dt = per-capita rate × N = ' + F(p.perCap, 3) + ' × ' + n0(p.N) + ' = ' + F(p.dNdt, 1) + ' individuals per year. ' +
          (p.N < p.K ? (p.N < p.K / 2 ? 'N is below K/2 = ' + n0(p.K / 2) + ', so growth is still speeding up.' : 'N is above K/2 = ' + n0(p.K / 2) + ', so growth is slowing down.') : ''));
      } else {
        out.push('At year ' + F(p.t, 0) + ' there are ' + n0(p.N) + ' individuals. Nothing is in short supply, so each one adds r<sub>max</sub> = ' + F(c.r, 2) + ' individuals per year, whatever N is.');
        out.push('dN/dt = r<sub>max</sub> × N = ' + F(c.r, 2) + ' × ' + n0(p.N) + ' = ' + F(p.dNdt, 1) + ' individuals per year: the bigger the population, the faster it grows, so the curve keeps getting steeper.');
      }
      out.push('Next step: N(t + Δt) = N + dN/dt × Δt = ' + n0(p.N) + ' + ' + F(p.dNdt, 1) + ' × ' + st.dt + ' = ' + n0(Math.max(0, p.N + p.dNdt * st.dt)) + '.');
      sim.points.forEach(function(q){
        if(q.pre != null && q.t <= p.t + 1e-9) out.push('At year ' + F(q.t, 0) + ' an event removed ' + q.hit.map(pct).join(' and ') + ' of the population (' + n0(q.pre) + ' to ' + n0(q.N) + '). It took the same share whatever N was, so it is density-independent.' +
          (isLog() ? ' With fewer individuals sharing the resources, the per-capita rate rose afterward.' : ''));
      });
      if(sim.stopped != null) out.push('The population passed ' + n0(data.model.nMax) + ' at year ' + F(sim.stopped, 1) + ', so the run stops there.');
      return out;
    }

    /* -------------------------------------------------------- update */
    function summary(sim){
      var ps = sim.points, last = ps[ps.length - 1], top = ps.reduce(function(a, b){ return b.dNdt > a.dNdt ? b : a; }, ps[0]);
      var half = null;
      if(isLog()) for(var i = 0; i < ps.length; i++) if(ps[i].N >= ps[i].K / 2){ half = ps[i].t; break; }
      return { last: last, top: top, half: half };
    }
    function run(series){
      var rs = series ? [0.25, 0.5, 0.75, 1] : [st.r];
      rs.forEach(function(r){
        var sim = Pop.simulate(cond(r)), s = summary(sim);
        runs.push({ n: runs.length + 1, model: isLog() ? 'Logistic' : 'Exponential', N0: st.N0, r: r, K: isLog() ? n0(st.K) : '—', dt: st.dt, ev: evText(),
          end: s.last.N, endT: s.last.t, top: s.top.dNdt, topN: s.top.N, half: s.half });
      });
      T.event('apbio-sim-run', { tool: SLUG, n: rs.length });
      var l = runs[runs.length - 1];
      card.querySelector('.bt-runnote').textContent = series ? 'Ran rmax = 0.25, 0.50, 0.75 and 1.00 per year. They are in the data table of runs.'
        : 'Trial ' + l.n + ': N = ' + n0(l.end) + ' at year ' + F(l.endT, 1) + '; fastest growth ' + F(l.top, 1) + ' per year at N = ' + n0(l.topN) + '.';
      update(true);
    }
    /* ------------------------------------------------- the field */
    var FW = 400, FH = 200, field = card.querySelector('.pg-field'), slots = null;
    function slotList(){
      if(slots) return slots;
      var g = M.rng(9091), out = [];
      for(var i = 0; i < 600; i++) out.push([g(), g(), g()]);
      return (slots = out);
    }
    function drawField(sim, t){
      var p = Pop.at(sim, t), prev = Pop.at(sim, Math.max(0, t - 1)), log = isLog();
      var Kmax = log ? Math.max(st.K, st.kc.on ? st.kc.K : 0) : 0;
      var big = Math.max(p.N, Kmax, 1), per = 1;
      while(big / per > 600) per *= 10;
      var nDots = Math.round(p.N / per), nPrev = Math.round(prev.N / per);
      // the habitat: K takes the whole field when K is the larger capacity; N fills a share of it
      var area = log ? Math.min(1, p.K / per / 600 * (600 / Math.max(1, Kmax / per))) : 1;
      var fw = FW * Math.sqrt(log ? p.K / Math.max(1, Kmax) : 1), fh = FH * Math.sqrt(log ? p.K / Math.max(1, Kmax) : 1);
      var spanDots = log ? Math.max(1, Kmax / per) : Math.max(nDots, 1), cap = log ? Math.round(p.K / per) : 600;
      var sl = slotList(), out = [];
      // one rabbit drawing (ApBioArt) reused for every individual; grass tufts on the field
      var A = window.ApBioArt, sym = A ? '<defs><symbol id="pg-rab" viewBox="-12 -12 24 24" overflow="visible">' + A.icon('rabbit', 0, 0, 24, '') + '</symbol></defs>' : '';
      out.push(sym + '<rect class="pg-ground" x="0" y="0" width="' + FW + '" height="' + FH + '" rx="12"/>');
      if(A){ var tg = M.rng(77), tufts = ''; for(var tt = 0; tt < 26; tt++){ var tx = 8 + tg() * (FW - 16), ty = 10 + tg() * (FH - 20); tufts += 'M' + tx.toFixed(1) + ' ' + ty.toFixed(1) + 'l-2 -5M' + tx.toFixed(1) + ' ' + ty.toFixed(1) + 'l0 -6M' + tx.toFixed(1) + ' ' + ty.toFixed(1) + 'l2 -5'; } out.push('<path class="pg-tuft" d="' + tufts + '"/>'); }
      if(log) out.push('<rect class="pg-fence" x="' + ((FW - fw) / 2).toFixed(1) + '" y="' + ((FH - fh) / 2).toFixed(1) + '" width="' + fw.toFixed(1) + '" height="' + fh.toFixed(1) + '" rx="10"/><text class="pg-flab" x="' + ((FW + fw) / 2 - 6).toFixed(1) + '" y="' + ((FH - fh) / 2 + 14).toFixed(1) + '" text-anchor="end">K = ' + n0(p.K) + '</text>');
      // dots: first nDots slots, placed inside the fence (or the whole field for exponential, scaled to what is drawn)
      var bw = log ? fw : FW, bh = log ? fh : FH;
      for(var i = 0; i < Math.min(600, nDots); i++){
        var q = sl[i], x = (FW - bw) / 2 + 6 + q[0] * (bw - 12), y = (FH - bh) / 2 + 6 + q[1] * (bh - 12);
        var rs = nDots > 300 ? 8 : nDots > 120 ? 10 : 13, flip = q[2] > 0.5;
        out.push(A ? '<use href="#pg-rab" class="pg-ind' + (i >= nPrev ? ' new' : '') + '" x="' + (x - rs / 2).toFixed(1) + '" y="' + (y - rs / 2).toFixed(1) + '" width="' + rs + '" height="' + rs + '"' + (flip ? ' transform="translate(' + (2 * x).toFixed(1) + ' 0) scale(-1 1)"' : '') + '/>'
          : '<circle class="pg-ind' + (i >= nPrev ? ' new' : '') + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (per > 1 ? 3.4 : 2.8) + '"/>');
      }
      var hit = sim.points.filter(function(z){ return z.pre != null && z.t <= t + 1e-9 && z.t > t - 1.5; })[0];
      if(hit) out.push('<rect class="pg-floodfx" x="0" y="0" width="' + FW + '" height="' + FH + '" rx="12"/><text class="pg-flab pg-hit" x="' + (FW / 2) + '" y="' + (FH / 2) + '" text-anchor="middle">' + esc(hit.hit.map(pct).join(' + ')) + ' lost</text>');
      var lab = 'Year ' + F(t, 0) + ': N = ' + n0(p.N) + (log ? ' of K = ' + n0(p.K) + (p.N >= p.K * 0.95 ? ', the habitat is full' : p.N > p.K / 2 ? ', crowding slows growth' : ', plenty of room') : '') + (per > 1 ? '. One rabbit drawn is ' + per + ' individuals.' : '.');
      out.push('<text class="pg-flab" x="8" y="' + (FH - 8) + '">' + esc('Year ' + F(t, 0) + ' · N = ' + n0(p.N) + (per > 1 ? ' · 1 drawn = ' + per : '')) + '</text>');
      field.innerHTML = '<svg class="pg-fieldsvg" viewBox="0 0 ' + FW + ' ' + FH + '" role="img" aria-label="' + esc(lab) + '">' + out.join('') + '</svg>';
      card.querySelector('.pg-clock').textContent = '';
    }
    function evButtons(){
      var host = card.querySelector('.pg-evbtns');
      host.innerHTML = st.events.map(function(e, i){ return '<button type="button" class="bt-btn pg-evb" data-ev="' + i + '" aria-pressed="' + e.on + '">' + esc(e.label) + ' at year ' + e.t + '</button>'; }).join('');
    }
    card.querySelector('.pg-evbtns').addEventListener('click', function(e){
      var b = e.target.closest('.pg-evb'); if(!b) return;
      var ev = st.events[+b.getAttribute('data-ev')], cb = card.querySelectorAll('.pg-ev .pg-evbox input[type=checkbox]')[+b.getAttribute('data-ev')];
      if(cb){ cb.checked = !ev.on; cb.dispatchEvent(new Event('change', { bubbles: true })); }
      var again = card.querySelector('.pg-evb[data-ev="' + b.getAttribute('data-ev') + '"]'); if(again) again.focus();
    });
    var playT = 0;
    function reducedM(){ try{ return window.LevlMotion ? window.LevlMotion.reduced() : matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
    card.querySelector('[data-a="play"]').addEventListener('click', function(){
      if(playT){ cancelAnimationFrame(playT); playT = 0; }
      if(reducedM()){ ctl.read.set(st.tEnd, true); return; }
      var sim = Pop.simulate(cond()), t0 = null, D = 5000;
      var go = function(ts){ if(t0 == null) t0 = ts; var u = Math.min(1, (ts - t0) / D), t = Math.round(u * st.tEnd);
        if(t !== st.readT){ ctl.read.set(t, true); } else drawField(sim, t);
        if(u < 1) playT = requestAnimationFrame(go); else playT = 0; };
      ctl.read.set(0, true);
      playT = requestAnimationFrame(go);
    });
    /* Drag the year marker on the N graph (pointer); keyboard: the slider. */
    var plotN = card.querySelector('.pg-plot-n'), dragging = false;
    function yearAt(e){
      var svg = plotN.querySelector('svg'); if(!svg) return null;
      var b = svg.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * 560, t = (x - 66) / (560 - 82) * st.tEnd;
      return Math.max(0, Math.min(st.tEnd, Math.round(t)));
    }
    plotN.addEventListener('pointerdown', function(e){ var t = yearAt(e); if(t == null) return; dragging = true; try{ plotN.setPointerCapture(e.pointerId); }catch(er){} ctl.read.set(t, true); e.preventDefault(); });
    plotN.addEventListener('pointermove', function(e){ if(!dragging) return; var t = yearAt(e); if(t != null && t !== st.readT) ctl.read.set(t, true); });
    plotN.addEventListener('pointerup', function(){ dragging = false; });
    plotN.addEventListener('pointercancel', function(){ dragging = false; });

    function update(now){
      var c = cond(), sim = Pop.simulate(c), p = Pop.at(sim, st.readT), ps = sim.points, log = isLog();
      drawField(sim, st.readT); evButtons();
      // graph 1: N over time
      var curve = [];
      ps.forEach(function(q){ if(q.pre != null) curve.push([q.t, q.pre]); curve.push([q.t, q.N]); });
      var Ks = log ? ps.map(function(q){ return [q.t, q.K]; }) : [];
      var topN = Math.max.apply(null, curve.map(function(q){ return q[1]; }).concat(Ks.map(function(q){ return q[1]; })));
      var yN = axisMax(topN);
      var evPts = ps.filter(function(q){ return q.pre != null; });
      var xStep = st.tEnd <= 30 ? 5 : 10;
      card.querySelector('.pg-plot-n').innerHTML = T.plot({
        title: 'Graph of population size N against time, ' + setText() + ', ' + evText() + '. N goes from ' + n0(ps[0].N) + ' at year 0 to ' + n0(ps[ps.length - 1].N) + ' at year ' + F(ps[ps.length - 1].t, 1) +
          (log ? '; the dashed line is K' : '') + '. At year ' + st.readT + ', marked by a vertical line, N = ' + n0(p.N) + '. The data table below lists the values.',
        x: { label: 'Time', unit: 'years', min: 0, max: st.tEnd, step: xStep }, y: { label: 'Population size, N', unit: 'individuals', min: 0, max: yN, step: T.niceStep(yN, 5) },
        curves: [{ points: curve, cls: 's1' }].concat(log ? [{ points: Ks, cls: 's2', dashed: true }] : []),
        points: evPts.map(function(q){ return { x: q.t, y: q.N, cls: 's3', square: true }; }).concat([{ x: p.t, y: p.N, cls: 's1' }]),
        vline: { x: st.readT } });
      card.querySelector('.pg-key-n').textContent = 'Solid line: N. ' + (log ? 'Dashed line: carrying capacity K. ' : '') + (evPts.length ? 'Squares: N just after each event. ' : '') + 'Vertical line and dot: the year you read.';
      // graph 2: dN/dt or per-capita rate against N
      var Kr = p.K, xN = axisMax(Math.max(topN, log ? Math.max(st.K, st.kc.on ? st.kc.K : 0) : 0)), samples = [];
      for(var i = 0; i <= 120; i++) samples.push(xN * i / 120);
      var f = st.view === 'rate' ? function(N, K){ return Pop.rate(st.model, st.r, K, N); } : function(N, K){ return Pop.perCap(st.model, st.r, K, N); };
      var Klist = log ? [Kr].concat(st.kc.on && Math.abs(st.kc.K - Kr) > 1e-9 ? [Kr === st.K ? st.kc.K : st.K] : []) : [Kr];
      var curves2 = Klist.map(function(K, j){ return { points: samples.map(function(N){ return [N, f(N, K)]; }), cls: j ? 's2' : 's1', dashed: !!j }; });
      var ys = [].concat.apply([], curves2.map(function(cv){ return cv.points.map(function(q){ return q[1]; }); })).concat([st.view === 'rate' ? p.dNdt : p.perCap]);
      var yMaxV = Math.max.apply(null, ys), yMinV = Math.min.apply(null, ys);
      var yTop = axisMax(Math.max(yMaxV, 1e-6)), yBot = yMinV < 0 ? -T.niceMax(-yMinV) : 0;
      // keep the negative part readable: clip it at the size of the positive part
      if(yBot < -yTop) yBot = -yTop;
      var pv = st.view === 'rate' ? p.dNdt : p.perCap, unit2 = st.view === 'rate' ? 'individuals per year' : 'per year';
      var peak = Pop.peak(st.r, Kr);
      card.querySelector('.pg-plot-r').innerHTML = T.plot({
        title: (st.view === 'rate' ? 'Graph of dN/dt against N' : 'Graph of the per-capita growth rate against N') + ', ' + setText() + '. ' +
          (log ? (st.view === 'rate' ? 'A hump: zero at N = 0 and at K = ' + n0(Kr) + ', highest (' + F(peak.dNdt, 1) + ' per year) at N = K/2 = ' + n0(peak.N) + ', marked by a vertical line, and negative above K.'
                                     : 'A straight line falling from rmax = ' + F(st.r, 2) + ' at N = 0 to 0 at K = ' + n0(Kr) + ', negative above K.')
               : (st.view === 'rate' ? 'A straight line through the origin with slope rmax = ' + F(st.r, 2) + '.' : 'A flat line at rmax = ' + F(st.r, 2) + ' per year.')) +
          (Klist.length > 1 ? ' The dashed curve is for the other carrying capacity, ' + n0(Klist[1]) + '.' : '') +
          ' The dot is the population at year ' + st.readT + ': N = ' + n0(p.N) + ', value ' + F(pv, st.view === 'rate' ? 1 : 3) + ' ' + unit2 + '.',
        x: { label: 'Population size, N', unit: 'individuals', min: 0, max: xN, step: T.niceStep(xN, 5) },
        y: { label: st.view === 'rate' ? 'dN/dt' : 'Per-capita rate', unit: unit2, min: yBot, max: yTop, step: T.niceStep(yTop - yBot, 6) },
        curves: curves2, points: [{ x: p.N, y: pv, cls: 's1' }], vline: log && st.view === 'rate' ? { x: Kr / 2 } : null });
      card.querySelector('.pg-key-r').textContent = (st.view === 'rate' ? 'Solid curve: dN/dt from the equation for K = ' + n0(Kr) + '. ' : 'Solid line: the per-capita rate for K = ' + n0(Kr) + '. ') +
        (Klist.length > 1 ? 'Dashed: for K = ' + n0(Klist[1]) + '. ' : '') + (log && st.view === 'rate' ? 'Vertical line: K/2. ' : '') + 'Dot: the year you read.';
      // readout
      var rows = [['Year', F(p.t, 0)], ['Population size, N', n0(p.N)]];
      if(log) rows.push(['Carrying capacity, K', n0(p.K)]);
      rows.push(['dN/dt', F(p.dNdt, 1) + ' per year'], ['Per-capita rate', F(p.perCap, 3) + ' per year']);
      if(log) rows.push(['Fastest growth', F(peak.dNdt, 1) + ' per year at N = ' + n0(peak.N)]);
      card.querySelector('.pg-out').innerHTML = rows.map(function(x){ return '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('');
      card.querySelector('.pg-explain ol').innerHTML = explain(p, sim).map(function(t){ return '<li>' + t + '</li>'; }).join('');
      say(setText() + ', ' + evText() + '. At year ' + st.readT + ': N = ' + n0(p.N) + (log ? ' of K = ' + n0(p.K) : '') + ', dN/dt = ' + F(p.dNdt, 1) + ' per year, per-capita rate ' + F(p.perCap, 3) + ' per year.', now);
      // tables
      var every = st.tEnd > 40 ? 2 : 1;
      var trows = ps.filter(function(q){ return Math.abs(q.t / every - Math.round(q.t / every)) < 1e-6 || q.pre != null; }).map(function(q){
        return [F(q.t, q.t % 1 ? 2 : 0), n0(q.N)].concat(log ? [n0(q.K)] : []).concat([F(q.dNdt, 1), F(q.perCap, 3), q.pre != null ? 'event: ' + n0(q.pre) + ' to ' + n0(q.N) : '']);
      });
      card.querySelector('.bt-tables').innerHTML =
        (runs.length ? T.dataTable(['Trial', 'Model', 'N₀', 'rmax (per year)', 'K', 'Δt (years)', 'Events', 'N at the end', 'Fastest dN/dt (per year)', 'N at fastest growth', 'Year N reached K/2'], runs.map(function(r){
          return [String(r.n), r.model, String(r.N0), F(r.r, 2), r.K, String(r.dt), esc(r.ev), n0(r.end) + ' (year ' + F(r.endT, 1) + ')', F(r.top, 1), n0(r.topN), r.half == null ? '—' : F(r.half, 1)];
        }), 'Your runs (' + runs.length + ')') : '<p class="bt-small">No runs yet. Use Run one trial or Run a series.</p>') +
        T.dataTable(['Year', 'N (individuals)'].concat(log ? ['K'] : []).concat(['dN/dt (per year)', 'Per-capita rate (per year)', 'Event']), trows,
          'Time course: ' + esc(setText()) + ', ' + esc(evText()) + (every > 1 ? ' (every ' + every + ' years)' : ''));
    }
    build();
    update(true);
    T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
    if(data.frq) T.frq(app, data.frq, SLUG);
  });
})();
