/* Simulator: enzyme activity and inhibition (Unit 3). The model is in
   bio-tool-math.js (ApBioMath.enzyme); the enzymes, ranges, the "How this
   model works" box, the questions and the mini FRQ are data
   (bio/data/tools/enzyme-activity.json). The student sets substrate,
   temperature, pH and an inhibitor, sees the rate curve, runs trials that
   land as points (with a little measurement scatter), reads the same numbers
   in a table, then answers questions about the model.

   Job: see why rate depends on substrate, temperature, pH and inhibitors,
   one enzyme molecule at a time.

   Tools upgrade (U-Bio-sims): the stage is a live canvas of eight enzyme
   molecules in solution. Substrate binds the active site and leaves as two
   product pieces; the product counter and the rate meter run at exactly
   ApBioMath.enzyme.rate; which molecules are drawn unfolded (heat), with a
   closed site (pH), with a competitive inhibitor in the site or a
   noncompetitive one bending it comes from ApBioMath.enzyme.states. Every
   control changes the scene at once. Pause button; reduced motion shows a
   still frame. "Predict, then change" mode: a change to one condition, the
   student predicts rate up / down / about the same, then sees it; recorded
   as enzyme-activity:predict-<change>:dir. */
(function(){
  'use strict';
  var SLUG = 'enzyme-activity';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  /* The live scene (canvas). set({ prof, c, rate, states, unit, label })
     changes it at once; molecules keep their places. Turnover events come at
     a pace proportional to the model's rate (8 molecules at the profile's
     Vmax make about 13 products a second on screen), so the counter and the
     rate meter tell the same story as the graph. */
  window.ApBioEnzymeScene = function(host, M){
    if(!host || !host.getContext && !document.createElement('canvas').getContext) return null;
    var cv = document.createElement('canvas'), g = cv.getContext('2d');
    if(!g) return null;
    cv.className = 'ez-canvas'; cv.setAttribute('role', 'img');
    var wrap = document.createElement('div'); wrap.className = 'ez-wrap'; wrap.appendChild(cv);
    var W = 600, H = 300, dpr = 1, cfg = null, col = {}, raf = 0, last = 0, paused = false, visible = true, made = 0, acc = 0;
    var rnd = M.rng(4242), ENZ = [], SUB = [], INH = [], PROD = [], FLY = [];
    for(var i = 0; i < 8; i++) ENZ.push({ x: 0, y: 0, u: rnd(), v: rnd(), w: rnd(), z: rnd(), ph: rnd() * 6.28, busy: 0, hold: null, angle: (i % 2 ? 1 : -1) * 0.3 });
    function reduced(){ try{ return window.LevlMotion ? window.LevlMotion.reduced() : matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
    function colors(){
      var cs = getComputedStyle(host);
      col.font = (cs.getPropertyValue('--font-ui') || '').trim() || 'sans-serif';
      ['--bio-para', '--bio-para-fill', '--bio-aff', '--bio-aff-fill', '--bio-eff', '--bio-symp', '--bio-symp-fill', '--ink', '--muted', '--white', '--bio-s1', '--line'].forEach(function(k){ col[k] = (cs.getPropertyValue(k) || '').trim() || '#888'; });
    }
    function layout(){
      var w = Math.max(280, host.clientWidth || 600);
      W = Math.min(720, w); H = Math.round(W < 480 ? W * 0.78 : W * 0.5);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
      var cols = W < 480 ? 3 : 4, rows = Math.ceil(8 / cols), top = 20, bot = H - 50;
      ENZ.forEach(function(e, k){
        var r = Math.floor(k / cols), c = k % cols, n = r === rows - 1 ? 8 - cols * (rows - 1) : cols;
        e.x = W * (c + 0.5 + (cols - n) / 2) / cols + (e.u - 0.5) * 14; e.y = top + (bot - top) * (r + 0.5) / rows + (e.v - 0.5) * 10;
      });
      ENZ.R = Math.min(30, W / (cols * 4.6));
    }
    function count(n, arr, make){ while(arr.length < n) arr.push(make()); arr.length = n; }
    function free(){ return { x: 20 + rnd() * (W - 40), y: 20 + rnd() * (H - 70), vx: rnd() - 0.5, vy: rnd() - 0.5, a: rnd() * 6.28 }; }
    function roles(){
      var z = cfg.states;
      ENZ.forEach(function(e){
        e.role = e.u < 1 - z.folded ? 'unfolded' : e.v < 1 - z.phOk ? 'closed' : e.w < z.allosteric ? 'bent' : e.z < z.inhibitor ? 'blocked' : 'ok';
        if(e.role !== 'ok') e.busy = 0;
      });
    }
    function set(c){
      var first = !cfg; cfg = c; colors();
      if(first) layout();
      count(Math.min(42, Math.round(c.c.S * 2.1 + (c.c.S > 0 ? 3 : 0))), SUB, free);
      count(c.c.inhibitor !== 'none' ? Math.min(14, Math.round(c.c.I * 2.8)) : 0, INH, free);
      roles();
      cv.setAttribute('aria-label', c.label);
      if(reduced()) still(); else start();
    }
    /* Reduced motion: one frame, sites filled in proportion. */
    function still(){
      stop();
      ENZ.forEach(function(e){ e.busy = e.role === 'ok' && e.z * 0.999 < cfg.states.substrate ? 0.5 : 0; });
      draw(0);
    }
    function start(){ if(!raf && !paused && visible){ last = 0; raf = requestAnimationFrame(tick); } }
    function stop(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } }
    function tick(ts){
      raf = 0;
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
      step(dt); draw(ts / 1000);
      if(!paused && visible) raf = requestAnimationFrame(tick);
    }
    function wander(p, sp, dt){
      p.vx += (rnd() - 0.5) * 6 * dt; p.vy += (rnd() - 0.5) * 6 * dt;
      var m = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1; p.vx /= m; p.vy /= m;
      p.x += p.vx * sp * dt; p.y += p.vy * sp * dt; p.a += dt * 2;
      if(p.x < 10 || p.x > W - 10) p.vx *= -1; if(p.y < 10 || p.y > H - 56) p.vy *= -1;
      p.x = Math.max(10, Math.min(W - 10, p.x)); p.y = Math.max(10, Math.min(H - 56, p.y));
    }
    function step(dt){
      var z = cfg.states, sp = 26 + 60 * Math.sqrt(Math.max(0.05, z.motion));
      SUB.forEach(function(p){ if(!p.fly) wander(p, sp, dt); });
      INH.forEach(function(p){ wander(p, sp * 0.8, dt); });
      ENZ.forEach(function(e){ e.ph += dt * (e.role === 'unfolded' ? 3 : 1); });
      // turnover events at the model rate
      acc += cfg.rate / cfg.prof.Vmax * 13 * dt;
      while(acc >= 1){
        acc -= 1;
        var ok = ENZ.filter(function(e){ return e.role === 'ok' && !e.busy; });
        var subs = SUB.filter(function(p){ return !p.fly; });
        if(!ok.length || !subs.length){ acc = 0; break; }
        var e = ok[Math.floor(rnd() * ok.length)], best = subs[0], bd = 1e9;
        subs.forEach(function(p){ var d = (p.x - e.x) * (p.x - e.x) + (p.y - e.y) * (p.y - e.y); if(d < bd){ bd = d; best = p; } });
        best.fly = { e: e, t: 0, x0: best.x, y0: best.y }; e.busy = 1;
      }
      SUB.forEach(function(p){
        if(!p.fly) return;
        var f = p.fly; f.t += dt;
        var site = siteOf(f.e), k = Math.min(1, f.t / 0.35);
        p.x = f.x0 + (site.x - f.x0) * k; p.y = f.y0 + (site.y - f.y0) * k;
        if(f.t > 0.65){
          [-1, 1].forEach(function(sg){ PROD.push({ x: site.x, y: site.y, vx: Math.cos(f.e.angle + Math.PI) * 30 + sg * 22, vy: sg * 30, life: 1.6 }); });
          made++; f.e.busy = 0; p.fly = null; var n = free(); p.x = n.x; p.y = n.y; // a new substrate drifts in elsewhere
          if(rnd() < 0.5){ p.x = rnd() < 0.5 ? 12 : W - 12; }
        }
      });
      PROD = PROD.filter(function(q){ q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; return q.life > 0; });
    }
    function siteOf(e){ var R = ENZ.R; return { x: e.x + Math.cos(e.angle) * R * 0.62, y: e.y + Math.sin(e.angle) * R * 0.62 }; }
    /* Substrate: a wedge cut to fit the active-site notch (apex inward).
       A competitive inhibitor is the same wedge (it looks like substrate)
       with a bar across it. */
    function wedgeShape(x, y, a, fill, stroke, bar){
      var R = ENZ.R; g.save(); g.translate(x, y); g.rotate(a || 0); g.fillStyle = fill; g.strokeStyle = stroke; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(-0.3 * R, 0); g.lineTo(0.32 * R, -0.36 * R); g.lineTo(0.32 * R, 0.36 * R); g.closePath(); g.fill(); g.stroke();
      if(bar){ g.lineWidth = 2.4; g.beginPath(); g.moveTo(0.05 * R, -0.3 * R); g.lineTo(0.05 * R, 0.3 * R); g.stroke(); }
      else { g.beginPath(); g.moveTo(0.06 * R, -0.2 * R); g.lineTo(0.06 * R, 0.2 * R); g.stroke(); }
      g.restore();
    }
    function sub(x, y, a, fill, stroke){ wedgeShape(x, y, a, fill, stroke, false); }
    function wedge(x, y, a, fill, stroke){ wedgeShape(x, y, a, fill, stroke, true); }
    function enzyme(e, t){
      var R = ENZ.R, a = e.angle;
      g.save(); g.translate(e.x, e.y);
      g.lineWidth = 2.2; g.strokeStyle = col['--bio-para']; g.fillStyle = col['--bio-para-fill'];
      if(e.role === 'unfolded'){
        g.beginPath();
        for(var k = 0; k <= 40; k++){ var u = k / 40, x = (u - 0.5) * R * 2.4, y = Math.sin(u * 14 + e.ph) * R * 0.32 + Math.sin(u * 5 + e.ph * 0.7) * R * 0.2; if(k) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke(); g.restore(); return;
      }
      g.rotate(a);
      var gap = e.role === 'closed' ? 0.06 : e.role === 'bent' ? 0.2 : 0.42;
      g.beginPath(); g.arc(0, 0, R, gap, Math.PI * 2 - gap); g.lineTo(R * 0.3, 0); g.closePath(); g.fill(); g.stroke();
      if(e.role === 'closed'){ g.fillStyle = col['--ink']; g.font = '800 ' + Math.round(R * 0.5) + 'px sans-serif'; g.textAlign = 'center'; g.fillText('±', -R * 0.35, R * 0.18); }
      if(e.role === 'bent'){ g.save(); g.rotate(-a); wedgeCircle(-Math.cos(a) * R * 1.02, -Math.sin(a) * R * 1.02); g.restore(); }
      if(e.role === 'blocked'){ wedge(R * 0.62, 0, 0, col['--bio-symp-fill'], col['--bio-symp']); }
      if(e.role === 'ok' && e.busy && reduced()) sub(R * 0.62, 0, 0, col['--bio-aff-fill'], col['--bio-aff']);
      g.restore();
    }
    function wedgeCircle(x, y){ g.fillStyle = col['--bio-symp-fill']; g.strokeStyle = col['--bio-symp']; g.lineWidth = 1.8; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); g.stroke(); }
    function draw(t){
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      ENZ.forEach(function(e){ enzyme(e, t); });
      var comp = cfg.c.inhibitor === 'competitive';
      INH.forEach(function(p){ if(comp) wedge(p.x, p.y, p.a, col['--bio-symp-fill'], col['--bio-symp']); else wedgeCircle(p.x, p.y); });
      SUB.forEach(function(p){ sub(p.x, p.y, p.fly ? p.fly.e.angle : p.a, col['--bio-aff-fill'], col['--bio-aff']); });
      PROD.forEach(function(q){ g.globalAlpha = Math.min(1, q.life); g.fillStyle = col['--bio-eff']; g.beginPath(); g.arc(q.x, q.y, 5, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; });
      // rate meter and counter
      var y = H - 22, mw = W - 32, f = Math.min(1, cfg.rate / cfg.prof.Vmax);
      g.fillStyle = col['--line']; roundRect(16, y, mw, 14, 7); g.fill();
      g.fillStyle = col['--bio-s1']; if(f > 0.004) { roundRect(16, y, Math.max(10, mw * f), 14, 7); g.fill(); }
      g.fillStyle = col['--ink']; g.font = '800 13px ' + col.font; g.textAlign = 'left';
      g.fillText('Rate ' + M.fixed(cfg.rate, 1) + ' ' + cfg.unit + (W >= 480 ? ' · ' + Math.round(f * 100) + '% of top speed' : ''), 16, y - 7);
      g.textAlign = 'right'; g.fillStyle = col['--muted']; g.font = '700 12px ' + col.font; g.fillText(reduced() ? 'still (reduced motion)' : 'products: ' + made, W - 16, y - 7);
    }
    function roundRect(x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    if(window.IntersectionObserver) new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if(visible && cfg && !reduced()) start(); else stop(); }).observe(wrap);
    document.addEventListener('visibilitychange', function(){ if(document.hidden) stop(); else if(cfg && !reduced()) start(); });
    window.addEventListener('resize', function(){ if(!cfg) return; layout(); if(reduced() || paused) draw(0); });
    var mo = new MutationObserver(function(){ if(cfg){ colors(); if(reduced() || paused) draw(0); } });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    host.innerHTML = ''; host.appendChild(wrap);
    return { set: set, pause: function(on){ paused = on; if(on) stop(); else if(cfg && !reduced()) start(); }, made: function(){ return made; } };
  };

  T.mount(SLUG, function(app, data, ctx){
    var esc = T.esc, F = T.F;
    var prof = data.profiles[0], view = 's', runs = [], runSeed = 7919;
    var st = { S: data.substrate.value, T: prof.defaults.T, pH: prof.defaults.pH, inhibitor: 'none', I: data.inhibitor.value };
    var RU = data.rateUnit;
    var VIEWS = { s: { key: 'S', label: 'Substrate concentration', unit: data.substrate.unit, min: 0, max: data.substrate.max, step: 5, series: data.series.S },
      t: { key: 'T', label: 'Temperature', unit: '°C', min: 0, max: data.temperature.max, step: 10, series: data.series.T },
      ph: { key: 'pH', label: 'pH', unit: '', min: 0, max: 14, step: 2, series: data.series.pH } };

    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
      '<section class="bt-card ez-card" aria-labelledby="ez-h"><h2 id="ez-h">The model</h2>' +
      '<div class="os-modes" role="group" aria-label="Mode"><button type="button" class="bt-btn" data-m="explore" aria-pressed="true">Explore</button><button type="button" class="bt-btn" data-m="predict" aria-pressed="false">Predict, then change</button></div>' +
      '<div class="ez-bar"><button type="button" class="bt-btn ez-pause" aria-pressed="false">Pause</button><p class="bt-small ez-key"><span class="ez-k sub"></span>substrate <span class="ez-k prod"></span>product <span class="ez-k inh"></span>inhibitor</p></div>' +
      '<div class="os-chal ez-chal" hidden></div>' +
      '<p class="os-why ez-why"></p>' +
      '<div class="bt-controls"></div>' +
      '<div class="ez-plots"><div><div class="bt-tabs" role="group" aria-label="Plot the rate against">' +
      Object.keys(VIEWS).map(function(k){ return '<button type="button" class="bt-btn" data-v="' + k + '" aria-pressed="' + (k === view) + '">Rate vs ' + esc(k === 'ph' ? 'pH' : VIEWS[k].label.toLowerCase()) + '</button>'; }).join('') +
      '</div><div class="bt-plotwrap"></div></div></div>' +
      '<dl class="bt-readout"></dl><p class="bt-summary"></p>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm" data-a="run">Run one trial</button><button type="button" class="btn-press sm alt" data-a="series">Run a series</button><button type="button" class="bt-btn" data-a="clear">Clear runs</button></div>' +
      '<p class="bt-small bt-runnote" role="status" aria-live="polite"></p>' +
      '<details class="bt-data"><summary>Data table: your runs and the curve</summary><div class="bt-tables"></div></details></section>' +
      '<section class="bt-card" aria-labelledby="ez-q"><h2 id="ez-q">Questions about this model</h2><div class="bt-qs bio-qs"></div></section>');
    var card = app.querySelector('.bt-card'), ctl = card.querySelector('.bt-controls');
    if(ctx.stage){ ctx.stage.classList.add('ez-stage'); card.insertBefore(ctx.stage, card.querySelector('.ez-bar')); }
    var scene = window.ApBioEnzymeScene ? window.ApBioEnzymeScene(ctx.stage, M) : null;
    var pauseBtn = card.querySelector('.ez-pause');
    pauseBtn.addEventListener('click', function(){ var on = pauseBtn.getAttribute('aria-pressed') !== 'true'; pauseBtn.setAttribute('aria-pressed', String(on)); pauseBtn.textContent = on ? 'Resume' : 'Pause'; if(scene) scene.pause(on); });
    if(!scene) card.querySelector('.ez-bar').hidden = true;
    try{ if(window.LevlMotion ? window.LevlMotion.reduced() : matchMedia('(prefers-reduced-motion: reduce)').matches) pauseBtn.hidden = true; }catch(e){}
    var say = T.announcer(card.querySelector('.bt-summary'));

    var enzymeSel = T.choiceSelect({ label: 'Enzyme', value: prof.id, options: data.profiles.map(function(p){ return { value: p.id, label: p.name }; }), onChange: function(v){
      prof = data.profiles.filter(function(p){ return p.id === v; })[0];
      sT.set(prof.defaults.T); sPH.set(prof.defaults.pH); st.T = prof.defaults.T; st.pH = prof.defaults.pH; update(true);
    } });
    var inhSel = T.choiceSelect({ label: 'Inhibitor', value: 'none', options: data.inhibitors.map(function(x){ return { value: x.id, label: x.name }; }), onChange: function(v){ st.inhibitor = v; sI.disable(v === 'none'); update(true); } });
    var sS = T.slider({ label: 'Substrate concentration', min: 0, max: data.substrate.max, step: data.substrate.step, value: st.S, unit: data.substrate.unit, decimals: 1, onInput: function(v){ st.S = v; update(); } });
    var sT = T.slider({ label: 'Temperature', min: 0, max: data.temperature.max, step: 1, value: st.T, unit: '°C', decimals: 0, onInput: function(v){ st.T = v; update(); } });
    var sPH = T.slider({ label: 'pH', min: 1, max: 13, step: 0.5, value: st.pH, decimals: 1, onInput: function(v){ st.pH = v; update(); } });
    var sI = T.slider({ label: 'Inhibitor concentration', min: 0, max: data.inhibitor.max, step: data.inhibitor.step, value: st.I, unit: data.inhibitor.unit, decimals: 2, onInput: function(v){ st.I = v; update(); } });
    [enzymeSel, inhSel, sS, sT, sPH, sI].forEach(function(c){ ctl.appendChild(c.el); });
    sI.disable(true);
    var desc = document.createElement('p'); desc.className = 'bt-hint bt-prof'; ctl.appendChild(desc);

    card.querySelectorAll('.bt-tabs .bt-btn').forEach(function(b){
      b.addEventListener('click', function(){
        view = b.getAttribute('data-v');
        card.querySelectorAll('.bt-tabs .bt-btn').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        update(true);
      });
    });
    card.querySelector('[data-a="run"]').addEventListener('click', function(){ run([st[VIEWS[view].key]]); });
    card.querySelector('[data-a="series"]').addEventListener('click', function(){ run(VIEWS[view].series); });
    card.querySelector('[data-a="clear"]').addEventListener('click', function(){ runs = []; card.querySelector('.bt-runnote').textContent = 'Runs cleared.'; update(true); });

    function cond(over){ var c = { S: st.S, T: st.T, pH: st.pH, inhibitor: st.inhibitor, I: st.I }; for(var k in over) c[k] = over[k]; return c; }
    function rateAt(c){ return M.enzyme.rate(prof, c, c.S); }
    function inhName(id){ return data.inhibitors.filter(function(x){ return x.id === id; })[0].name; }
    /* A run: the model's rate with about 3% measurement scatter (seeded). */
    function run(xs){
      var V = VIEWS[view];
      xs.forEach(function(x){
        var c = cond({}); c[V.key] = x;
        var r = M.rng(runSeed + runs.length * 31), noisy = Math.max(0, rateAt(c) * (1 + r.normal(0, 0.03)));
        runs.push({ n: runs.length + 1, enzyme: prof.id, S: c.S, T: c.T, pH: c.pH, inhibitor: c.inhibitor, I: c.inhibitor === 'none' ? 0 : c.I, rate: M.round(noisy, 1) });
      });
      T.event('apbio-sim-run', { tool: SLUG, n: xs.length });
      card.querySelector('.bt-runnote').textContent = xs.length === 1 ? 'Trial ' + runs.length + ': rate ' + F(runs[runs.length - 1].rate, 1) + ' ' + RU + '.' : 'Ran ' + xs.length + ' trials across ' + V.label.toLowerCase() + '. They appear as points on the graph and in the data table.';
      update(true);
    }
    /* Runs that match every setting except the plotted one. */
    function shown(){
      var V = VIEWS[view];
      return runs.filter(function(r){
        return r.enzyme === prof.id && r.inhibitor === st.inhibitor && (st.inhibitor === 'none' || r.I === st.I) &&
          ['S', 'T', 'pH'].every(function(k){ return k === V.key || Math.abs(r[k] - st[k]) < 1e-9; });
      });
    }
    function curve(over, V){
      var pts = [], n = 120;
      for(var i = 0; i <= n; i++){ var x = V.min + (V.max - V.min) * i / n; if(V.key === 'pH' && x < 0.5) continue; var c = cond(over); c[V.key] = x; pts.push([x, rateAt(c)]); }
      return pts;
    }
    /* The words under the scene: what the molecules are doing and why. */
    function figure(k){
      var z = M.enzyme.states(prof, st), r = rateAt(cond({}));
      var w = [];
      if(z.folded < 0.6) w.push('At ' + F(st.T, 0) + ' °C most molecules have unfolded (denatured): the active site has lost its shape, so no substrate fits. (This model treats unfolding as set by the temperature alone; many real enzymes stay unfolded after cooling.)');
      else if(z.motion < 0.5) w.push('It is cold: molecules move slowly, so substrate meets the active site less often and fewer products form each second.');
      if(z.phOk < 0.5) w.push('At pH ' + F(st.pH, 1) + ' the charged groups in most active sites are in the wrong state, so the site no longer binds substrate well (closed sites in the picture).');
      if(st.inhibitor === 'competitive' && st.I > 0) w.push('The competitive inhibitor looks like the substrate and sits in the active site, so it competes: add more substrate and substrate wins more often (Km rises to ' + F(k.km, 2) + ' ' + data.substrate.unit + ', Vmax unchanged).');
      if(st.inhibitor === 'noncompetitive' && st.I > 0) w.push('The noncompetitive inhibitor binds elsewhere and bends the active site, taking those molecules out of action whatever the substrate level (Vmax falls to ' + F(k.vmax, 1) + ', Km unchanged).');
      if(!w.length) w.push(z.substrate > 0.85 ? 'Nearly every active site is busy (saturated): adding substrate barely speeds things up. Only more enzyme would.' : 'Many active sites are empty, waiting for substrate: more substrate means more collisions and a faster rate.');
      card.querySelector('.ez-why').textContent = w.join(' ');
      if(scene) scene.set({ prof: prof, c: cond({}), rate: r, states: z, unit: RU, label: 'Enzyme molecules in solution. ' + w.join(' ') + ' Rate ' + F(r, 1) + ' ' + RU + '.' });
    }
    function update(now){
      var V = VIEWS[view], k = M.enzyme.params(prof, st), r = rateAt(cond({}));
      desc.textContent = prof.blurb;
      figure(k);
      var ref = st.inhibitor !== 'none' ? curve({ inhibitor: 'none' }, V) : null;
      var cur = curve({}, V), pts = shown();
      var top = Math.max(prof.Vmax, Math.max.apply(null, pts.map(function(p){ return p.rate; }).concat([1])));
      var ymax = T.niceMax(top * 1.05);
      var title = 'Graph of reaction rate against ' + (V.key === 'pH' ? 'pH' : V.label.toLowerCase()) + ' for ' + prof.name + (st.inhibitor !== 'none' ? ' with ' + inhName(st.inhibitor).toLowerCase() + ' (solid) and without it (dashed)' : '') + '. ' + pts.length + ' run' + (pts.length === 1 ? '' : 's') + ' shown as points. The data table below lists the values.';
      card.querySelector('.bt-plotwrap').innerHTML = T.plot({ title: title, x: { label: V.label, unit: V.unit, min: V.min, max: V.max, step: V.step }, y: { label: 'Reaction rate', unit: RU, min: 0, max: ymax, step: T.niceStep(ymax, 5) },
        curves: (ref ? [{ points: ref, cls: 's3', dashed: true }] : []).concat([{ points: cur, cls: 's1' }]),
        points: pts.map(function(p){ return { x: p[V.key], y: p.rate, cls: 's2' }; }), vline: { x: st[V.key] } });
      card.querySelector('.bt-readout').innerHTML = [
        ['Rate now', F(r, 1) + ' ' + RU], ['Vmax (apparent)', F(k.vmax, 1) + ' ' + RU], ['Km (apparent)', F(k.km, 2) + ' ' + data.substrate.unit], ['Rate as % of Vmax', F(k.vmax ? 100 * r / k.vmax : 0, 0) + '%']
      ].map(function(x){ return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('');
      var words = 'At ' + F(st.S, 1) + ' ' + data.substrate.unit + ' substrate, ' + F(st.T, 0) + ' °C and pH ' + F(st.pH, 1) +
        (st.inhibitor === 'none' ? ', with no inhibitor' : ', with ' + F(st.I, 2) + ' ' + data.inhibitor.unit + ' ' + inhName(st.inhibitor).toLowerCase()) +
        ', the rate is ' + F(r, 1) + ' ' + RU + '. Vmax is ' + F(k.vmax, 1) + ' and Km is ' + F(k.km, 2) + ' ' + data.substrate.unit + '. ' +
        (k.tempFactor < 0.3 && st.T > prof.Tm ? 'Most of the enzyme is denatured at this temperature. ' : k.tempFactor < 0.5 ? 'It is too cold for fast collisions. ' : '') +
        (k.phFactor < 0.5 ? 'This pH is far from the enzyme’s best pH. ' : '');
      say(words, now);
      var V2 = V, sample = [];
      for(var i = 0; i <= 8; i++){ var x = V2.min + (V2.max - V2.min) * i / 8; if(V2.key === 'pH' && x < 1) x = 1; var c = cond({}); c[V2.key] = x; var row = [F(x, V2.key === 'S' ? 1 : V2.key === 'pH' ? 1 : 0), F(rateAt(c), 1)]; if(ref){ var c0 = cond({ inhibitor: 'none' }); c0[V2.key] = x; row.push(F(rateAt(c0), 1)); } sample.push(row); }
      card.querySelector('.bt-tables').innerHTML =
        (runs.length ? T.dataTable(['Trial', 'Enzyme', 'Substrate (' + data.substrate.unit + ')', 'Temperature (°C)', 'pH', 'Inhibitor', 'Rate (' + RU + ')'], runs.map(function(p){
          return [String(p.n), esc(data.profiles.filter(function(q){ return q.id === p.enzyme; })[0].short), F(p.S, 1), F(p.T, 0), F(p.pH, 1), p.inhibitor === 'none' ? 'none' : esc(p.inhibitor) + ' (' + F(p.I, 2) + ' ' + data.inhibitor.unit + ')', F(p.rate, 1)];
        }), 'Your runs (' + runs.length + ')') : '<p class="bt-small">No runs yet. Use Run one trial or Run a series.</p>') +
        T.dataTable([esc(V2.label) + (V2.unit ? ' (' + esc(V2.unit) + ')' : ''), 'Model rate (' + RU + ')'].concat(ref ? ['Without inhibitor (' + RU + ')'] : []), sample, 'The curve on the graph, sampled');
    }
    /* ------------------------------------ predict, then change */
    var mode = 'explore', chalBox = card.querySelector('.ez-chal'), chalN = 0, chalSeed = 1 + Math.floor(Math.random() * 99999), saved = null;
    /* Changes with a clear answer (rate moves by more than 15% or by less
       than 3%), computed from the model at the challenge's conditions. */
    var CHANGES = [
      { id: 'more-substrate', key: 'S', text: function(a, b){ return 'Raise the substrate from ' + F(a, 1) + ' to ' + F(b, 1) + ' ' + data.substrate.unit + '.'; }, pick: function(g, c){ return Math.min(data.substrate.max, c.S * g.pick([2, 4])); } },
      { id: 'hotter', key: 'T', text: function(a, b){ return 'Heat it from ' + F(a, 0) + ' to ' + F(b, 0) + ' °C.'; }, pick: function(g, c, p){ return Math.min(data.temperature.max, Math.round(p.Tm + g.pick([4, 8, 12]))); } },
      { id: 'cooler', key: 'T', text: function(a, b){ return 'Cool it from ' + F(a, 0) + ' to ' + F(b, 0) + ' °C.'; }, pick: function(g, c){ return Math.max(0, c.T - g.pick([20, 25, 30])); } },
      { id: 'ph', key: 'pH', text: function(a, b){ return 'Change the pH from ' + F(a, 1) + ' to ' + F(b, 1) + '.'; }, pick: function(g, c){ return Math.max(1, Math.min(13, c.pH + g.pick([-4, -3, 3, 4]))); } },
      { id: 'competitive-more-substrate', key: 'S', inh: 'competitive', text: function(a, b){ return 'With a competitive inhibitor present, raise the substrate from ' + F(a, 1) + ' to ' + F(b, 1) + ' ' + data.substrate.unit + '.'; }, pick: function(g, c){ return Math.min(data.substrate.max, c.S * 5); } },
      { id: 'noncompetitive-add', key: 'I', inh: 'noncompetitive', text: function(a, b){ return 'Add noncompetitive inhibitor: from ' + F(a, 2) + ' to ' + F(b, 2) + ' ' + data.inhibitor.unit + '.'; }, pick: function(g){ return g.pick([2, 3, 4]); } },
      { id: 'saturated-more-substrate', key: 'S', sat: true, text: function(a, b){ return 'The enzyme is already working near its top speed. Raise the substrate from ' + F(a, 1) + ' to ' + F(b, 1) + ' ' + data.substrate.unit + '.'; }, pick: function(g, c){ return Math.min(data.substrate.max, c.S + 2); } }
    ];
    function makeChallenge(){
      for(var tries = 0; tries < 300; tries++){
        var g = M.rng(chalSeed + 7919 * (chalN * 300 + tries)), p = g.pick(data.profiles), ch = CHANGES[(chalN + tries) % CHANGES.length];
        var c = { S: ch.sat ? 18 : g.pick([1, 2, 3, 4]), T: p.defaults.T, pH: p.defaults.pH, inhibitor: ch.inh || 'none', I: ch.id === 'noncompetitive-add' ? 0 : 2 };
        var a = c[ch.key], b = M.round(ch.pick(g, c, p), 2);
        if(a === b) continue;
        var c2 = Object.assign({}, c); c2[ch.key] = b;
        var r1 = M.enzyme.rate(p, c, c.S), r2 = M.enzyme.rate(p, c2, c2.S), rel = (r2 - r1) / Math.max(r1, 1e-9);
        var dir = rel > 0.15 ? 'up' : rel < -0.15 ? 'down' : Math.abs(rel) < 0.03 ? 'same' : null;
        if(!dir || r1 < 3) continue;
        return { p: p, ch: ch, c: c, c2: c2, a: a, b: b, r1: r1, r2: r2, dir: dir };
      }
      return null;
    }
    function applyCond(p, c){
      prof = p; enzymeSel.set(p.id); st.S = c.S; st.T = c.T; st.pH = c.pH; st.inhibitor = c.inhibitor; st.I = c.I;
      sS.set(c.S); sT.set(c.T); sPH.set(c.pH); inhSel.set(c.inhibitor); sI.set(c.I); sI.disable(c.inhibitor === 'none');
      update(true);
    }
    function showChallenge(){
      var x = makeChallenge(); chalN++;
      if(!x) return;
      applyCond(x.p, x.c);
      var id = 'ez-c' + chalN, opts = [['up', 'Rate goes up'], ['down', 'Rate goes down'], ['same', 'Rate stays about the same']];
      chalBox.innerHTML = '<p class="os-chal-q"><b>Challenge ' + chalN + '.</b> ' + esc(x.p.name) + ' is running at ' + F(x.r1, 1) + ' ' + RU + ' (watch the scene). ' + esc(x.ch.text(x.a, x.b)) + '</p>' +
        '<fieldset class="os-ask"><legend>What happens to the rate?</legend>' + opts.map(function(o, i){ return '<div class="bt-radio"><input type="radio" name="' + id + '" id="' + id + i + '" value="' + o[0] + '"><label for="' + id + i + '">' + o[1] + '</label></div>'; }).join('') + '</fieldset>' +
        '<div class="bt-actions"><button type="button" class="btn-press sm ez-do">Make the change</button></div><div class="os-chal-fb" role="status" aria-live="polite"></div>';
      chalBox.querySelector('.ez-do').addEventListener('click', function(){
        var pick = chalBox.querySelector('input:checked'), fb = chalBox.querySelector('.os-chal-fb');
        if(!pick){ fb.textContent = 'Pick an answer first.'; return; }
        chalBox.querySelectorAll('input').forEach(function(i){ i.disabled = true; }); this.disabled = true;
        applyCond(x.p, x.c2);
        var ok = pick.value === x.dir, words = { up: 'went up', down: 'went down', same: 'stayed about the same' };
        fb.innerHTML = '<p><span class="bio-mark ' + (ok ? 'ok">Right' : 'no">Not quite') + '</span> The rate ' + words[x.dir] + ': ' + F(x.r1, 1) + ' → ' + F(x.r2, 1) + ' ' + RU + '.</p><p>' + esc(card.querySelector('.ez-why').textContent) + '</p>' +
          '<div class="bt-actions"><button type="button" class="btn-press sm os-next">Next challenge</button>' + T.report(SLUG + ':predict-' + x.ch.id) + '</div>';
        fb.querySelector('.os-next').addEventListener('click', function(){ showChallenge(); var q = chalBox.querySelector('.os-chal-q'); q.setAttribute('tabindex', '-1'); q.focus(); });
        T.record(SLUG, [{ id: SLUG + ':predict-' + x.ch.id + ':dir', correct: ok, topic: 'enzyme-environment', level: 'apply', diff: 2, group: 'predict' }]);
      });
    }
    function setMode(m){
      if(m === mode) return;
      mode = m;
      card.querySelectorAll('[data-m]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-m') === m)); });
      var pred = m === 'predict';
      chalBox.hidden = !pred;
      ['.bt-controls', '.ez-plots', '.bt-readout', '.bt-summary', '.bt-buttons', '.bt-data', '.bt-runnote', '.ez-why'].forEach(function(sel){ var el = card.querySelector(sel); if(el) el.hidden = pred; });
      if(pred){ saved = { p: prof, c: cond({}) }; showChallenge(); }
      else if(saved){ applyCond(saved.p, saved.c); }
    }
    card.querySelectorAll('[data-m]').forEach(function(b){ b.addEventListener('click', function(){ setMode(b.getAttribute('data-m')); }); });

    update(true);
    T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
    if(data.frq) T.frq(app, data.frq, SLUG);
    if(/^#predict/.test(location.hash)) setMode('predict');
  }, { stage: function(){} });
})();
