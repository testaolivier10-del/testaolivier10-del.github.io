/* Trainer: equilibrium and kinetics at the particle level (Units 5 and 7).
   Job: see why a mixture shifts (Q against K), why heating speeds a
   reaction (more collisions with at least Ea), and what a catalyst does and
   does not change.

   The model (ApChemMath.eqk, pure and tested; data and sources in
   chem/data/tools/equilibrium-kinetics.json): the forward and reverse rates
   follow the rate laws of the balanced equation with Arrhenius rate
   constants, kr = kf / Kc, so the net reaction stops exactly at Q = K; K
   follows van 't Hoff from the real ΔH°. Every molecule drawn is a fixed
   amount (per mol/L at 1.00 L), so the picture, the graph and the numbers
   agree. Molecules move with speeds from a Maxwell distribution for their
   own mass at the vessel's temperature (lighter ones faster) and bounce
   elastically off each other and the walls; each reaction event is drawn
   where a pair (or a molecule) reacts, with a spark.

   Explore: the vessel on the stage with the Q-K gauge, the concentration
   graph and the energy distribution (Maxwell-Boltzmann with Ea marked and
   the tail above Ea magnified). Dock: temperature, volume, amounts, the
   catalyst and "Challenge me" (predict the shift, then watch it run).

   Test yourself: seeded three-step problems (ApChemMath.eqk.generate): what
   changes (Q or K), the direction of the shift, and the rates right after.
   After the last step the same stress is applied to a live vessel. */
(function(){
  'use strict';
  var T = window.ApChemTools;
  if(!T) return;
  T.mount('equilibrium-kinetics', function(app, data){
    var M = window.ApChemMath;
    var ex = null;
    T.modes(app, { slug: 'equilibrium-kinetics', labels: ['Explore the vessel', 'Test yourself'], explore: function(h){ ex = explore(h, data, M); }, quiz: function(h){ quiz(h, data, M); },
      onShow: function(m){ if(ex) ex.active(m === 'explore'); },
      studio: { explore: function(pane, s){ if(ex) ex.studio(pane, s); } } });
  });

  /* Atom colors as the course's particle pictures (chem-tools.css .pt-atom). */
  var ATOM = { N: ['#5677E0', '#fff'], O: ['#EE5A4F', '#fff'], H: ['#F4F6F8', '#10161a'], I: ['#8E4FB8', '#fff'], Cl: ['#6CCB5F', '#10161a'] };
  var LINE = ['#0072B2', '#D55E00', '#009E73'];   // series colors (Okabe-Ito), also dashed differently
  var DASH = [[], [7, 4], [2, 3]];
  function css(v, fb){ try{ var s = getComputedStyle(document.documentElement).getPropertyValue(v).trim(); return s || fb; }catch(e){ return fb; } }

  /* ------------------------------------------------------------- Sim
     One vessel: state, particles, drawing, the graph. Used by Explore and
     by the quiz's live figure. */
  function Sim(rx, o){
    var M = window.ApChemMath, E = M.eqk, sp = rx.species, per = rx.per;
    var s = { rx: rx, T: rx.T[2], V: rx.V[2], cat: false, play: true, speed: 1, t: 0 };
    // Integer counts B (molecules) + a running extent X (in molecules).
    /* Whole molecules are drawn, but the chemistry runs on exact amounts:
       B is the rounded start, X the exact extent from it to equilibrium (so
       Q = K exactly at the start), k the extent drawn so far. */
    var B, X, k;
    function settle(){
      // Whole-molecule starting counts chosen so the counts on screen give
      // Q within a few percent of K (students count particles to find Q).
      B = (rx.counts || E.equilibrium(rx, rx.start, s.T).map(function(c){ return Math.max(1, Math.round(c * s.V / per)); })).slice();
      X = M.solveExtent(sp, B.map(function(b){ return b * per / s.V; }), E.Kc(rx, s.T)) * s.V / per; k = Math.round(X);
    }
    settle();
    function n(){ return B.map(function(b, i){ return b + sp[i].nu * X; }); }
    function drawn(){ return B.map(function(b, i){ return b + sp[i].nu * k; }); }
    function conc(){ return n().map(function(x){ return x * per / s.V; }); }
    s.conc = conc; s.drawn = drawn;
    s.K = function(){ return E.Kc(rx, s.T); };
    s.Q = function(){ var c = conc(); return sp.some(function(x, i){ return x.nu < 0 && c[i] <= 0; }) ? Infinity : E.Q(rx, c); };
    s.rates = function(){ return E.rates(rx, conc(), s.T, s.cat); };
    // History for the graph: [t, c...], with marks for each change.
    var hist = [], marks = [];
    function log(){ hist.push([s.t].concat(conc())); if(hist.length > 1600) hist.splice(0, hist.length - 1600); }
    s.hist = hist; s.marks = marks;
    s.mark = function(label){ marks.push([s.t, label]); if(marks.length > 12) marks.shift(); };
    log();

    /* ---- particles */
    var P = [], W = 300, H = 200, scale = 1, cv = null, ctx = null, sparks = [], rng = M.rng(7 + rx.id.length);
    var TEMPL = M.particles.templ;
    function sigma(i){ return 0.075 * Math.sqrt(s.T / sp[i].M) / Math.sqrt(330 / 46); }   // box widths per second, per axis
    function gauss(){ var u = 1 - rng(), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    function radius(i){ var t = TEMPL[sp[i].draw] || []; var rr = 0; t.forEach(function(a){ rr = Math.max(rr, Math.hypot(a.dx, a.dy) + (a.r || 9)); }); return rr; }
    function newP(i, x, y){ var sg = sigma(i); return { i: i, x: x, y: y, vx: gauss() * sg, vy: gauss() * sg, a: rng() * 6.28, w: (rng() - 0.5) * 2, r: radius(i) }; }
    // The vessel's share of the width: the largest volume fills 96% of the
    // picture, so the default 1.00 L of a 0.50-2.00 L range fills 48%... too
    // little on a phone; the picture is cropped instead to 1.25 x the
    // largest volume used so far (the piston and its rod stay visible).
    function boxW(){ return 0.96 * s.V / rx.V[1] / crop(); }
    var cropV = rx.V[2] * 1.3;
    function crop(){ cropV = Math.max(cropV, Math.min(rx.V[1], s.V * 1.3)); return Math.min(1, cropV / rx.V[1]); }
    function seed(){
      P = [];
      drawn().forEach(function(c, i){ for(var j = 0; j < c; j++) P.push(newP(i, rng() * boxW(), rng())); });
    }
    seed();
    function countOf(i){ var c = 0; P.forEach(function(p){ if(p.i === i) c++; }); return c; }
    function nearestPair(a, b){
      var best = null, bd = 1e9;
      P.forEach(function(p){ if(p.i !== a) return; P.forEach(function(q){ if(q === p || q.i !== b) return; var d = Math.hypot(p.x - q.x, (p.y - q.y) * H / W); if(d < bd){ bd = d; best = [p, q]; } }); });
      return best;
    }
    function spark(x, y){ sparks.push({ x: x, y: y, t: 0 }); }
    /* One reaction event in direction dir (+1 forward, −1 reverse), drawn
       where it happens: the reacting molecules disappear and the products
       appear at their place, flying apart. */
    function event(dir){
      var from = [], to = [];
      sp.forEach(function(x, i){ var m = Math.abs(x.nu); for(var j = 0; j < m; j++) (dir * x.nu < 0 ? from : to).push(i); });
      var used = [];
      if(from.length === 1){ var c = P.filter(function(p){ return p.i === from[0]; }); if(!c.length) return; used = [c[Math.floor(rng() * c.length)]]; }
      else { var pr = nearestPair(from[0], from[1]); if(!pr) return; used = pr; }
      // The event is drawn at the nearer of the two (a schematic: the model
      // decides how many react from the rate law, not from these flights).
      var cx = used.reduce(function(a, p){ return a + p.x; }, 0) / used.length, cy = used.reduce(function(a, p){ return a + p.y; }, 0) / used.length;
      P = P.filter(function(p){ return used.indexOf(p) < 0; });
      to.forEach(function(i, j){ var q = newP(i, cx + (j - (to.length - 1) / 2) * 0.03, cy); if(to.length > 1){ var d = j ? 1 : -1; q.vx = Math.abs(q.vx) * d + d * 0.04; } P.push(q); });
      spark(cx, cy); s.events++;
    }
    function syncEvents(){
      var target = Math.round(X);
      // Never draw a negative count.
      var lo = -Infinity, hi = Infinity;
      sp.forEach(function(x, i){ if(x.nu < 0) hi = Math.min(hi, Math.floor(B[i] / -x.nu)); else lo = Math.max(lo, -Math.floor(B[i] / x.nu)); });
      target = Math.max(lo, Math.min(hi, target));
      var guard = 0;
      while(k < target && guard++ < 40){ k++; event(1); }
      while(k > target && guard++ < 80){ k--; event(-1); }
    }
    /* Dynamic equilibrium, drawn. Besides the NET change (syncEvents), both
       directions keep happening: forward and reverse events are drawn at
       rates in the true ratio f : r (so at Q = K they are equal), scaled to a
       watchable total of about EVT per second that grows with the real total
       rate (more when hotter or with a catalyst, capped). A forward event
       followed later by a reverse one leaves the counts where the chemistry
       says, because each drawn exchange is a pair: a forward event is owed a
       reverse one and the other way round, settled as they come. */
    var owe = 0, rateRef = null;
    function exchange(dt){
      var r = E.rates(rx, conc(), s.T, s.cat), tot = r.f + r.r;
      if(!(tot > 0)) return;
      if(rateRef == null) rateRef = tot;
      var EVT = Math.max(0.6, Math.min(6, 1.6 * Math.pow(tot / rateRef, 0.35)));
      var nF = EVT * dt * r.f / tot, nR = EVT * dt * r.r / tot;
      if(rng() < nF && canGo(1)){ event(1); owe -= 1; }
      if(rng() < nR && canGo(-1)){ event(-1); owe += 1; }
      // Settle the pairs so the drawn counts stay on the exact amounts.
      // Settle within about half a second, so a count you read is right.
      if(owe > 0 && canGo(1) && rng() < dt * 2.5){ event(1); owe -= 1; }
      else if(owe < 0 && canGo(-1) && rng() < dt * 2.5){ event(-1); owe += 1; }
    }
    function canGo(dir){ var d = P.reduce(function(m, p){ m[p.i] = (m[p.i] || 0) + 1; return m; }, {}); return sp.every(function(x, i){ return dir * x.nu >= 0 || (d[i] || 0) >= Math.abs(x.nu); }); }
    s.resetRate = function(){ rateRef = null; };
    s.picture = function(){ return sp.map(function(x, i){ return countOf(i); }); };
    s.events = 0;
    /* Physics: free flight, elastic collisions (equal radii scaled to the
       picture, real masses), walls; a weak thermostat keeps the speed
       distribution at T after reactions add molecules. */
    function move(dt){
      var bw = boxW(), ar = H / W;
      P.forEach(function(p){
        p.x += p.vx * dt; p.y += p.vy * dt / ar; p.a += p.w * dt;
        var rx2 = p.r * scale / W, ry2 = p.r * scale / H;
        if(p.x < rx2){ p.x = rx2; p.vx = Math.abs(p.vx); } if(p.x > bw - rx2){ p.x = bw - rx2; p.vx = -Math.abs(p.vx); }
        if(p.y < ry2){ p.y = ry2; p.vy = Math.abs(p.vy); } if(p.y > 1 - ry2){ p.y = 1 - ry2; p.vy = -Math.abs(p.vy); }
      });
      for(var a = 0; a < P.length; a++) for(var b = a + 1; b < P.length; b++){
        var p = P[a], q = P[b], dx = (q.x - p.x) * W, dy = (q.y - p.y) * H, d = Math.hypot(dx, dy), md = (p.r + q.r) * scale * 0.9;
        if(d > 0 && d < md){
          var nx = dx / d, ny = dy / d, rv = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
          if(rv < 0){ var m1 = sp[p.i].M, m2 = sp[q.i].M, j = 2 * rv / (m1 + m2); p.vx += j * m2 * nx; p.vy += j * m2 * ny; q.vx -= j * m1 * nx; q.vy -= j * m1 * ny; }
          var push = (md - d) / 2 / W; p.x -= nx * push; q.x += nx * push; p.y -= ny * push * W / H; q.y += ny * push * W / H;
        }
      }
      // Walls last, so a push from a collision never leaves a molecule outside.
      P.forEach(function(p){ var rx2 = p.r * scale / W, ry2 = p.r * scale / H; p.x = Math.max(rx2, Math.min(bw - rx2, p.x)); p.y = Math.max(ry2, Math.min(1 - ry2, p.y)); });
      if(rng() < dt * 2 && P.length){ var r = P[Math.floor(rng() * P.length)], sg = sigma(r.i); r.vx = gauss() * sg; r.vy = gauss() * sg; }
    }
    /* ---- drawing */
    function mol(p){
      var t = TEMPL[sp[p.i].draw] || [];
      var c = Math.cos(p.a), sn = Math.sin(p.a);
      t.slice().sort(function(u, v){ return (u.z || 0) - (v.z || 0); }).forEach(function(at){
        var x = p.x * W + (at.dx * c - at.dy * sn) * scale, y = p.y * H + (at.dx * sn + at.dy * c) * scale, r = (at.r || 9) * scale, col = ATOM[at.el] || ['#7DB8EE', '#10161a'];
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = col[0]; ctx.fill();
        ctx.lineWidth = Math.max(0.8, scale * 0.9); ctx.strokeStyle = 'rgba(20,28,30,.55)'; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.38, r * 0.34, r * 0.22, -0.6, 0, 6.2832); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fill();
        if(r >= 6.5){ ctx.fillStyle = col[1]; ctx.font = '800 ' + Math.round(r * (at.el.length > 1 ? 0.95 : 1.15)) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(at.el, x, y + 0.5); }
      });
    }
    function draw(){
      if(!ctx) return;
      var dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var bw = boxW() * W, tint = rx.tint, c = conc();
      // The gas color is real: brown NO₂, violet I₂ (deeper with concentration).
      var a = tint ? Math.min(0.6, 0.08 + c[tint.species] / tint.per * 0.9) : 0;
      ctx.fillStyle = css('--paper', '#F3F6F5'); ctx.fillRect(0, 0, bw, H);
      if(a > 0){ ctx.fillStyle = 'rgba(' + tint.rgb.join(',') + ',' + a.toFixed(3) + ')'; ctx.fillRect(0, 0, bw, H); }
      // Piston and the space beyond it.
      ctx.fillStyle = css('--line', '#D9E2DF'); ctx.fillRect(bw, 0, W - bw, H);
      ctx.fillStyle = css('--muted', '#526C66'); ctx.fillRect(bw, 0, Math.max(5, W * 0.014), H);
      ctx.fillRect(bw, H / 2 - 4, W - bw, 8);
      ctx.strokeStyle = css('--ink', '#1F2A28'); ctx.lineWidth = 2; ctx.strokeRect(1, 1, bw - 1, H - 2);
      P.forEach(mol);
      sparks = sparks.filter(function(k2){ return k2.t < 0.5; });
      sparks.forEach(function(k2){
        var x = k2.x * W, y = k2.y * H, r = (8 + 40 * k2.t) * scale;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.strokeStyle = 'rgba(240,170,20,' + (1 - k2.t * 2).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.stroke();
        for(var j = 0; j < 6; j++){ var an = j * 1.047; ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * r * 0.5, y + Math.sin(an) * r * 0.5); ctx.lineTo(x + Math.cos(an) * r * 0.9, y + Math.sin(an) * r * 0.9); ctx.stroke(); }
      });
    }
    /* Molecule size: the drawn molecules fill about a fifth of the vessel at
       its largest content, so a crowded vessel still reads as a gas. */
    function fitScale(){
      var area = 0; P.forEach(function(p){ area += Math.PI * p.r * p.r; });
      var room = boxW() * W * H * 0.2;
      scale = Math.max(0.42, Math.min(1.15, Math.sqrt(room / Math.max(area, 1))));
    }
    s.fitScale = function(){ fitScale(); };
    s.attach = function(canvas){
      cv = canvas; ctx = canvas.getContext('2d');
      var fit = function(){
        var b = canvas.parentNode.getBoundingClientRect(), w = Math.max(200, b.width), h = Math.max(140, b.height || w * 0.6);
        var dpr = window.devicePixelRatio || 1;
        W = w; H = h; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
        fitScale();
        draw();
      };
      fit();
      if(window.ResizeObserver){ new ResizeObserver(function(){ fit(); }).observe(canvas.parentNode); }
      window.addEventListener('resize', fit);
    };

    /* ---- time */
    var last = 0, raf = 0, listeners = [], acc = 0, still = T.reduced();
    s.on = function(fn){ listeners.push(fn); };
    function tick(now){
      raf = requestAnimationFrame(tick);
      if(!last){ last = now; return; }
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if(!s.play || !s.visible()) return;
      var sim = dt * s.speed;
      // The chemistry: small steps toward Q = K.
      var c = conc(), stepN = 4;
      for(var j = 0; j < stepN; j++){
        var r = E.step(rx, c, s.T, s.cat, sim / stepN);
        var dx = (r.c[0] - c[0]) / sp[0].nu * s.V / per; X += dx; c = r.c;
      }
      s.t += sim;
      syncEvents();
      exchange(dt);
      if(!still) move(dt);
      if((refit += dt) > 1){ refit = 0; var s0 = scale; fitScale(); scale = s0 + (scale - s0) * 0.5; }
      acc += dt; if(acc > 0.1){ acc = 0; log(); listeners.forEach(function(f){ f(); }); }
      sparks.forEach(function(k2){ k2.t += dt; });
      draw();
    }
    s.visible = function(){ return !cv || cv.getBoundingClientRect().width > 0; };
    s.start = function(){ if(!raf) raf = requestAnimationFrame(tick); };
    s.stop = function(){ cancelAnimationFrame(raf); raf = 0; last = 0; };
    /* ---- changes */
    // Before adding or removing whole molecules: fold the extent into B and
    // keep the fractional remainder as the new extent, so no amount jumps.
    function rebase(){ var d = drawn(); X = X - k; k = 0; B = d; }
    s.setT = function(t){
      var f = Math.sqrt(t / s.T); s.T = t;
      P.forEach(function(p){ p.vx *= f; p.vy *= f; });
      log();
    };
    s.setV = function(v){ s.V = v; var bw = boxW(); P.forEach(function(p){ if(p.x > bw) p.x = bw * (0.3 + 0.65 * rng()); }); log(); };
    var refit = 0;
    s.add = function(i, d){
      rebase();
      if(d > 0){ for(var j = 0; j < d; j++){ B[i]++; P.push(newP(i, boxW() * (0.85 + 0.1 * rng()), rng())); } }
      else { for(var m = 0; m < -d && B[i] > 0; m++){ B[i]--; var c2 = P.filter(function(p){ return p.i === i; }); var gone = c2[Math.floor(rng() * c2.length)]; P = P.filter(function(p){ return p !== gone; }); } }
      log(); draw();
    };
    s.setCat = function(on){ s.cat = !!on; };
    s.reset = function(){ s.T = rx.T[2]; s.V = rx.V[2]; s.cat = false; settle(); s.t = 0; hist.length = 0; marks.length = 0; seed(); log(); draw(); };
    /* A stress as the quiz and the challenges name it. */
    s.apply = function(stress){
      var sp2 = sp, first = function(sign){ for(var i = 0; i < sp2.length; i++) if(sign * sp2[i].nu > 0) return i; return 0; };
      if(stress === 'heat') s.setT(Math.min(rx.T[1], s.T + 30));
      else if(stress === 'cool') s.setT(Math.max(rx.T[0], s.T - 30));
      else if(stress === 'addR'){ var i = first(-1); s.add(i, Math.max(3, Math.round(drawn()[i] * 0.6))); }
      else if(stress === 'removeR'){ var j2 = first(-1); s.add(j2, -Math.round(drawn()[j2] * 0.6)); }
      else if(stress === 'addP'){ var k2 = first(1); s.add(k2, Math.max(3, Math.round(drawn()[k2] * 0.6))); }
      else if(stress === 'removeP'){ var l = first(1); s.add(l, -Math.round(drawn()[l] * 0.6)); }
      else if(stress === 'compress') s.setV(Math.max(rx.V[0], s.V / 2));
      else if(stress === 'expand') s.setV(Math.min(rx.V[1], s.V * 2));
      else if(stress === 'catalyst') s.setCat(true);
      s.mark({ heat: 'heated', cool: 'cooled', addR: '+ ' + sp[first(-1)].html, removeR: '− ' + sp[first(-1)].html, addP: '+ ' + sp[first(1)].html, removeP: '− ' + sp[first(1)].html, compress: 'compressed', expand: 'expanded', catalyst: 'catalyst' }[stress] || stress);
    };
    s.describe = function(){ var d = drawn(); return 'The vessel holds ' + M.list(sp.map(function(x, i){ return d[i] + ' ' + x.html; })) + ' at ' + Math.round(s.T) + ' K in ' + M.fmt(s.V, 2) + ' L.'; };
    return s;
  }

  /* ------------------------------------------------------- pictures */
  function graphSvg(s, w, h){
    var M = window.ApChemMath, sp = s.rx.species, hist = s.hist, L = 44, R = 10, Tp = 12, B = 34, pw = w - L - R, ph = h - Tp - B;
    if(!hist.length) return '';
    var t1 = Math.max(10, hist[hist.length - 1][0]), t0 = Math.max(0, t1 - 30);
    var vis = hist.filter(function(r){ return r[0] >= t0; });
    var mx = 0; vis.forEach(function(r){ for(var i = 1; i < r.length; i++) mx = Math.max(mx, r[i]); });
    mx = T.niceMax(mx * 1.1 || 0.1); var st = T.niceStep(mx, 4);
    var X = function(t){ return L + (t - t0) / (t1 - t0) * pw; }, Y = function(c){ return Tp + ph - c / mx * ph; };
    var p = [];
    for(var v = 0; v <= mx + 1e-9; v += st) p.push('<line class="ek-grid" x1="' + L + '" x2="' + (L + pw) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="ek-tick" x="' + (L - 5) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + M.fmt(v, 2) + '</text>');
    var tst = t1 - t0 > 20 ? 10 : 5;
    for(var tt = Math.ceil(t0 / tst) * tst; tt <= t1; tt += tst) p.push('<text class="ek-tick" x="' + X(tt).toFixed(1) + '" y="' + (Tp + ph + 14) + '" text-anchor="middle">' + tt + '</text>');
    s.marks.forEach(function(m){ if(m[0] < t0) return; var x = X(m[0]).toFixed(1); p.push('<line class="ek-mark" x1="' + x + '" x2="' + x + '" y1="' + Tp + '" y2="' + (Tp + ph) + '"/><text class="ek-markt" x="' + (+x + 3) + '" y="' + (Tp + 10) + '">' + m[1] + '</text>'); });
    var labY = [];
    sp.forEach(function(x, i){
      var pts = vis.map(function(r){ return X(r[0]).toFixed(1) + ',' + Y(r[i + 1]).toFixed(1); }).join(' ');
      p.push('<polyline class="ek-line" points="' + pts + '" stroke="' + LINE[i] + '"' + (DASH[i].length ? ' stroke-dasharray="' + DASH[i].join(' ') + '"' : '') + '/>');
      var lastR = vis[vis.length - 1];
      var ly = Y(lastR[i + 1]) - 5;
      labY.forEach(function(o){ if(Math.abs(o - ly) < 14) ly = o > ly ? o - 14 : o + 14; });
      ly = Math.max(Tp + 10, Math.min(Tp + ph - 3, ly)); labY.push(ly);
      p.push('<text class="ek-lab" x="' + (X(lastR[0]) - 4).toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="end" fill="' + LINE[i] + '">[' + x.html + ']</text>');
    });
    p.push('<line class="ek-axis" x1="' + L + '" x2="' + (L + pw) + '" y1="' + (Tp + ph) + '" y2="' + (Tp + ph) + '"/><line class="ek-axis" x1="' + L + '" x2="' + L + '" y1="' + Tp + '" y2="' + (Tp + ph) + '"/>');
    p.push('<text class="ek-axl" x="' + (L + pw / 2) + '" y="' + (h - 4) + '" text-anchor="middle">Time (s, scaled)</text><text class="ek-axl" transform="translate(12 ' + (Tp + ph / 2) + ') rotate(-90)" text-anchor="middle">Concentration (M)</text>');
    var c = s.conc();
    return '<svg class="chem-svg ek-graph" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + T.esc('Concentration against time. Now ' + sp.map(function(x, i){ return x.html + ' ' + M.fmt(c[i], 3) + ' M'; }).join(', ') + '.') + '">' + p.join('') + '</svg>';
  }
  /* The energy distribution at T (solid) and at the starting temperature
     (dashed), on the real scale: x from 0 to 1.2 Ea. The tail above Ea is
     too small to see at true height, so it is also drawn magnified by a
     fixed power of ten (fixed per reaction, so heating visibly grows it). */
  function mbSvg(s, w, h, mag){
    var M = window.ApChemMath, E = M.eqk, rx = s.rx, L = 14, R = 10, Tp = 16, B = 34, pw = w - L - R, ph = h - Tp - B;
    var Ea = rx.Ea, Eac = E.Ea(rx, true), xmax = Ea * 1.2, T0 = rx.T[2], Tn = s.T;
    var X = function(e){ return L + e / xmax * pw; }, peak = E.mb(R2(T0) / 2, T0) * 1.08;
    function R2(t){ return 8.314 * t / 1000; }
    var Y = function(f){ return Tp + ph - Math.min(1, f / peak) * ph; };
    var curve = function(t, k){ var pts = []; for(var j = 0; j <= 300; j++){ var e = xmax * Math.pow(j / 300, 2.2); pts.push(X(e).toFixed(1) + ',' + Y(E.mb(e, t) * k).toFixed(1)); } return pts.join(' '); };
    var tail = function(t, e0){ var pts = [X(e0).toFixed(1) + ',' + (Tp + ph)]; for(var j = 0; j <= 60; j++){ var e = e0 + (xmax - e0) * j / 60; pts.push(X(e).toFixed(1) + ',' + Y(E.mb(e, t) * mag).toFixed(1)); } pts.push(X(xmax).toFixed(1) + ',' + (Tp + ph)); return pts.join(' '); };
    var eaUse = s.cat ? Eac : Ea, share = E.mbAbove(eaUse, Tn), share0 = E.mbAbove(Ea, T0), exp = Math.round(Math.log10(mag));
    var p = [];
    p.push('<polygon class="ek-tail" points="' + tail(Tn, eaUse) + '"/>');
    p.push('<polyline class="ek-mb ek-mbx" points="' + curve(Tn, mag) + '" clip-path="url(#ekclip)"/>');
    p.push('<clipPath id="ekclip"><rect x="' + X(Ea * 0.55) + '" y="' + Tp + '" width="' + (X(xmax) - X(Ea * 0.55)) + '" height="' + ph + '"/></clipPath>');
    if(Math.abs(Tn - T0) > 0.5) p.push('<polyline class="ek-mb ek-mb0" points="' + curve(T0, 1) + '"/>');
    p.push('<polyline class="ek-mb" points="' + curve(Tn, 1) + '"/>');
    p.push('<line class="ek-ea" x1="' + X(Ea).toFixed(1) + '" x2="' + X(Ea).toFixed(1) + '" y1="' + Tp + '" y2="' + (Tp + ph) + '"/><text class="ek-eat" x="' + X(Ea).toFixed(1) + '" y="' + (Tp - 6) + '" text-anchor="' + (s.cat ? 'start' : 'middle') + '">Ea ' + Ea + '</text>');
    if(s.cat) p.push('<line class="ek-ea is-cat" x1="' + X(Eac).toFixed(1) + '" x2="' + X(Eac).toFixed(1) + '" y1="' + Tp + '" y2="' + (Tp + ph) + '"/><text class="ek-eat is-cat" x="' + (X(Eac) - 3).toFixed(1) + '" y="' + (Tp - 6) + '" text-anchor="end">catalyst ' + Eac + '</text>');
    // The magnification note sits under the plot, left of the Ea line, where no curve runs.
    p.push('<text class="ek-magt" x="' + (X(Ea * 0.62)).toFixed(1) + '" y="' + (Tp + ph * 0.42).toFixed(1) + '" text-anchor="middle">tail drawn ×10' + M.sup(exp) + ' →</text>');
    p.push('<text class="ek-most" x="' + (X(R2(Tn) * 0.5) + 10).toFixed(1) + '" y="' + (Tp + 8) + '">most molecules</text>');
    p.push('<line class="ek-axis" x1="' + L + '" x2="' + (L + pw) + '" y1="' + (Tp + ph) + '" y2="' + (Tp + ph) + '"/>');
    var st = xmax > 120 ? 50 : 20;
    for(var e2 = 0; e2 <= xmax; e2 += st) p.push('<text class="ek-tick" x="' + X(e2).toFixed(1) + '" y="' + (Tp + ph + 14) + '" text-anchor="middle">' + e2 + '</text>');
    p.push('<text class="ek-axl" x="' + (L + pw / 2) + '" y="' + (h - 4) + '" text-anchor="middle">Kinetic energy of a molecule (kJ/mol)</text>');
    return { svg: '<svg class="chem-svg ek-mbsvg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + T.esc('Maxwell-Boltzmann distribution of molecular kinetic energy at ' + Math.round(Tn) + ' K. Share of molecules with at least the activation energy: ' + M.fmt(share, 2) + '.') + '">' + p.join('') + '</svg>', share: share, share0: share0 };
  }
  function gaugeHtml(s){
    var M = window.ApChemMath, q = s.Q(), K = s.K(), lq = isFinite(q) && q > 0 ? Math.log10(q) : null, lk = Math.log10(K);
    var span = 3, pos = function(l){ return Math.max(0, Math.min(100, 50 + (l - lk) / span * 50)); };
    var qp = lq == null ? (q === Infinity ? 100 : 0) : pos(lq), close = lq != null && Math.abs(lq - lk) < 0.0022;
    var dir = close ? 'At equilibrium: Q = K' : lq != null && lq < lk ? 'Q < K: net forward →' : '← Q > K: net reverse';
    return '<div class="ek-gauge" role="img" aria-label="' + T.esc('Q = ' + (isFinite(q) ? M.fmt(q, 3) : 'infinite') + ', K = ' + M.fmt(K, 3) + '. ' + dir) + '">' +
      '<div class="ek-gtrack"><span class="ek-gk" style="left:50%"><b>K</b></span><span class="ek-gq' + (close ? ' is-eq' : '') + '" style="left:' + qp.toFixed(1) + '%"><b>Q</b></span></div>' +
      '<p class="ek-gdir">' + dir + '</p></div>';
  }

  /* ------------------------------------------------------------ explore */
  function explore(host, data, M){
    var E = M.eqk, esc = T.esc, LS = null, SP = null, ri = 0, rx = data.reactions[0], sim = null, tab = 'graph', ch = null;
    function $(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); }
    function $$(sel){ var a = [].slice.call(host.querySelectorAll(sel)); return LS ? a.concat([].slice.call(LS.root.querySelectorAll(sel))) : a; }
    host.innerHTML = '<section class="bt-problem ek-card" aria-labelledby="ek-h"><h2 id="ek-h" class="ek-eq bt-eq"></h2>' +
      '<div class="ek-stage"><div class="ek-vessel"><canvas class="ek-canvas" role="img" aria-label="The vessel"></canvas></div><div class="ek-gaugebox"></div>' +
      '<div class="ek-tabs" role="group" aria-label="Graph to show"><span class="ek-tabs-k" aria-hidden="true">Graph</span><button type="button" class="ek-tab" data-v="graph" aria-pressed="true">Concentrations</button><button type="button" class="ek-tab" data-v="mb" aria-pressed="false">Collision energies</button><button type="button" class="ek-tab" data-v="rates" aria-pressed="false">Rates</button></div>' +
      '<div class="ek-plot"></div></div>' +
      '<div class="ek-ctl"><div class="ek-temp"></div><div class="ek-vol"></div><div class="ek-amts" role="group" aria-label="Add or remove molecules"></div>' +
      '<div class="bt-buttons ek-btns"><button type="button" class="bt-btn ek-cat" aria-pressed="false">Add a catalyst</button><button type="button" class="bt-btn ek-play" aria-pressed="true">❚❚ Pause</button></div>' +
      '<button type="button" class="btn-press sm ek-chal">Challenge me: predict, then run</button><div class="ek-chalbox" hidden></div></div>' +
      '<div class="ek-why"></div><div class="ek-nums"></div>' +
      T.moreHtml('<div class="ek-pick"></div><div class="ek-speed"></div><div class="bt-buttons"><button type="button" class="bt-btn ek-reset">Start over at equilibrium</button></div><p class="bt-small ek-src"></p>', 'another reaction, speed of time, start over, sources') + '</section>';
    var start = T.cue('Drag the temperature, or add molecules, and watch which way the mixture shifts.');
    host.querySelector('.ek-ctl').insertBefore(start.el, host.querySelector('.ek-temp'));
    if(data.reactions.length > 1){
      var rs = T.choiceSelect({ label: 'Reaction', options: data.reactions.map(function(r, i){ return { value: i, label: M.eqHtml(r.species.map(function(x){ return { html: x.html, nu: x.nu }; })) }; }), value: 0, onChange: function(v){ ri = +v; build(); } });
      rs.el.classList.add('bt-inline'); $('.ek-pick').appendChild(rs.el);
    }
    var spd = T.choiceSelect({ label: 'Speed of time', options: [{ value: 0.25, label: '¼ speed' }, { value: 1, label: 'Normal' }, { value: 4, label: '4 × faster' }, { value: 16, label: '16 × faster' }], value: 1, onChange: function(v){ sim.speed = +v; } });
    spd.el.classList.add('bt-inline'); $('.ek-speed').appendChild(spd.el);
    $('.ek-src').innerHTML = '<b>Where the numbers come from.</b> ' + Object.keys(data.sources).map(function(k){ return esc(data.sources[k]); }).join(' ');
    var tS = null, vS = null, mag = 1;
    function build(){
      if(sim) sim.stop();
      rx = data.reactions[ri];
      $('.ek-eq').innerHTML = M.eqHtml(rx.species.map(function(x){ return { html: x.html, nu: x.nu, phase: 'g' }; })) + ' <span class="ek-dh">ΔH° = ' + (rx.dH > 0 ? '+' : '−') + Math.abs(rx.dH) + ' kJ/mol</span>';
      var cnv = document.createElement('canvas'); cnv.className = 'ek-canvas'; cnv.setAttribute('role', 'img');
      var vb = $('.ek-vessel'); vb.innerHTML = ''; vb.appendChild(cnv);
      sim = Sim(rx, {}); sim.speed = +spd.value();
      host.__sim = sim;   // for the browser checks (events at equilibrium)
      sim.attach(cnv);
      // The tail magnification: the power of ten that makes the tail above
      // Ea at the starting temperature about a quarter of the peak height.
      var T0 = rx.T[2], pk = E.mb(8.314 * T0 / 2000, T0), tl = E.mb(rx.Ea * 1.02, T0);
      mag = Math.pow(10, Math.round(Math.log10(0.25 * pk / tl)));
      $('.ek-temp').innerHTML = ''; $('.ek-vol').innerHTML = '';
      tS = T.slider({ label: 'Temperature', min: rx.T[0], max: rx.T[1], step: rx.Tstep, value: rx.T[2], unit: 'K', decimals: 0, onInput: function(v){ sim.setT(v); after('T'); } });
      vS = T.slider({ label: 'Volume of the vessel', min: rx.V[0], max: rx.V[1], step: 0.25, value: rx.V[2], unit: 'L', decimals: 2, onInput: function(v){ var dv = v < sim.V ? -1 : 1; sim.setV(v); after('V', dv); } });
      $('.ek-temp').appendChild(tS.el); $('.ek-vol').appendChild(vS.el);
      $('.ek-amts').innerHTML = rx.species.map(function(x, i){
        return '<div class="ek-amt"><span class="ek-n">' + x.html + '</span><button type="button" class="bt-step" data-i="' + i + '" data-d="-3" aria-label="Remove 3 ' + esc(x.html) + '">−</button><b class="ek-c" data-i="' + i + '"></b><button type="button" class="bt-step" data-i="' + i + '" data-d="3" aria-label="Add 3 ' + esc(x.html) + '">+</button></div>';
      }).join('');
      $$('.ek-amt .bt-step').forEach(function(b){ b.addEventListener('click', function(){ var i = +b.getAttribute('data-i'), d = +b.getAttribute('data-d'); sim.add(i, d); sim.mark((d > 0 ? '+ ' : '− ') + rx.species[i].html); after('amt', i, d); }); });
      $('.ek-cat').setAttribute('aria-pressed', 'false'); $('.ek-cat').textContent = 'Add a catalyst';
      sim.on(paint);
      sim.start();
      ch = null; $('.ek-chalbox').hidden = true;
      paint(); explainNow('');
    }
    $('.ek-cat').addEventListener('click', function(){ sim.setCat(!sim.cat); this.setAttribute('aria-pressed', String(sim.cat)); this.textContent = sim.cat ? 'Remove the catalyst' : 'Add a catalyst'; if(sim.cat) sim.mark('catalyst'); after('cat'); });
    $('.ek-play').addEventListener('click', function(){ sim.play = !sim.play; this.setAttribute('aria-pressed', String(sim.play)); this.textContent = sim.play ? '❚❚ Pause' : '▶ Play'; });
    $('.ek-reset').addEventListener('click', function(){ sim.reset(); tS.set(rx.T[2]); vS.set(rx.V[2]); $('.ek-cat').setAttribute('aria-pressed', 'false'); $('.ek-cat').textContent = 'Add a catalyst'; explainNow(''); paint(); });
    $$('.ek-tab').forEach(function(b){ b.addEventListener('click', function(){ tab = b.getAttribute('data-v'); paint(); }); });
    $('.ek-chal').addEventListener('click', challenge);

    var lastNote = '';
    function after(what, i, d){ start.done(); explainNow(what, i, d); paint(); }
    /* What just happened, in words: Q against K, and the particle-level why. */
    function explainNow(what, i, d){
      var q = sim.Q(), K = sim.K(), g = E.dn(rx), endo = rx.dH > 0, f = M.fmt;
      var dir = !isFinite(q) ? 'r' : Math.abs(Math.log(q / K)) < 0.005 ? 'eq' : q < K ? 'f' : 'r';
      var head = dir === 'eq' ? 'At equilibrium: Q = K.' : dir === 'f' ? 'Q < K: the mixture shifts forward.' : 'Q > K: the mixture shifts in reverse.';
      var body = '';
      if(what === 'T') body = 'Temperature changes K, not Q. The forward reaction is ' + (endo ? 'endothermic' : 'exothermic') + ' (ΔH° = ' + (rx.dH > 0 ? '+' : '−') + Math.abs(rx.dH) + ' kJ/mol), so K ' + (endo ? 'rises' : 'falls') + ' as the temperature rises: K = ' + f(K, 3) + ' at ' + Math.round(sim.T) + ' K. Both directions also run faster when it is hotter, because a larger share of collisions has at least E<sub>a</sub>.';
      else if(what === 'V'){
        var smaller = i < 0;
        body = 'Changing the volume changes every concentration by the same factor. ' + (g === 0 ? 'Both sides have the same number of gas molecules (Δn = 0), so Q does not change and there is no shift.'
          : 'Δn(gas) = ' + (g > 0 ? '+' : '') + g + ', so Q changes: a ' + (smaller ? 'smaller' : 'larger') + ' volume pushes Q ' + ((g > 0) === smaller ? 'up' : 'down') + ' and the mixture shifts toward the side with ' + (smaller ? 'fewer' : 'more') + ' gas molecules (' + ((g > 0) === smaller ? 'reactants' : 'products') + '). K stays ' + f(K, 3) + '.');
      }
      else if(what === 'amt'){
        var prod = rx.species[i].nu > 0, add = d > 0;
        var rateNow = add && !prod ? 'the forward rate jumps (more reactant molecules to collide).' : add && prod ? 'the reverse rate jumps (more product molecules to collide).' : !add && prod ? 'the reverse rate drops (fewer product molecules).' : 'the forward rate drops (fewer reactant molecules).';
        body = (add ? 'Adding ' : 'Removing ') + (prod ? 'a product' : 'a reactant') + ' changes Q, not K. ' + (add === prod ? 'Q went up, so the mixture uses up products until Q falls back to K.' : 'Q went down, so the mixture makes products until Q rises back to K.') + ' Right after the change, ' + rateNow;
      }
      else if(what === 'cat') body = sim.cat ? 'The catalyst lowers E<sub>a</sub> by ' + rx.catDrop + ' kJ/mol for both directions, so both rates rise by the same factor (×' + f(Math.exp(rx.catDrop * 1000 / (8.314 * sim.T)), 2) + ' here). Equilibrium is reached sooner, but Q and K do not change, so the position does not shift.' : 'Without the catalyst both directions slow down by the same factor; the equilibrium position is the same.';
      else body = 'Every molecule you see is ' + f(rx.per, 2) + ' mol/L at 1.00 L. Molecules move faster when it is hotter (lighter ones fastest) and react only when a collision has at least E<sub>a</sub>. At equilibrium both reactions still run, at equal rates.';
      body += ' Q = ' + (isFinite(q) ? f(q, 3) : '∞') + ', K = ' + f(K, 3) + '.';
      lastNote = head;
      T.explain($('.ek-why'), '<b>' + head + '</b>', '<p>' + body + '</p>');
      if(LS){ LS.caption(T.sayHead($('.ek-why')), 'explore'); SP && SP.open(); }
    }
    var lastDir = '';
    function paint(){
      if(!sim) return;
      var d = sim.picture(), c = sim.conc(), q = sim.Q(), K = sim.K(), r = sim.rates();
      $$('.ek-c').forEach(function(el){ el.textContent = d[+el.getAttribute('data-i')]; });
      $$('.ek-amt [data-d="-3"]').forEach(function(b){ b.disabled = d[+b.getAttribute('data-i')] < 3; });
      $$('.ek-amt [data-d="3"]').forEach(function(b){ b.disabled = d[+b.getAttribute('data-i')] > 60; });
      $('.ek-gaugebox').innerHTML = gaugeHtml(sim);
      $$('.ek-tab').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === tab)); });
      var box = $('.ek-plot'), bb = box.getBoundingClientRect(), narrow = (window.innerWidth || 1000) < 1000;
      // On a phone the graph takes what is left of the stage, so nothing in
      // the stage scrolls; on a desktop it keeps a 2:1 shape.
      var stg = LS && narrow ? LS.root.querySelector('.ls-stage') : null, room = stg ? stg.getBoundingClientRect().bottom - bb.top - 26 : 0;
      var w = Math.max(280, Math.round(bb.width || 520)), h = narrow ? Math.max(150, Math.min(240, Math.round(room || 170))) : Math.max(170, Math.min(280, Math.round(w * 0.5)));
      if(tab === 'graph') box.innerHTML = graphSvg(sim, w, h);
      else if(tab === 'mb'){ var m = mbSvg(sim, w, h - 22, mag); box.innerHTML = '<p class="ek-share">At least E<sub>a</sub>: <b>' + M.fmt(m.share, 2) + '</b> of molecules' + (Math.abs(m.share / m.share0 - 1) > 0.02 ? ' (×' + M.fmt(m.share / m.share0, 2) + ' vs ' + rx.T[2] + ' K' + (sim.cat ? ' without catalyst' : '') + ')' : '') + '</p>' + m.svg; }
      else box.innerHTML = ratesHtml(r);
      $('.ek-nums').innerHTML = '<h3 class="ls-title-l">The numbers</h3><table class="ls-tbl"><caption class="sr-only">The vessel in numbers</caption><tbody>' +
        rx.species.map(function(x, i){ return '<tr><th scope="row">[' + x.html + ']</th><td class="r">' + M.fmt(c[i], 3) + ' M (' + d[i] + ' drawn)</td></tr>'; }).join('') +
        '<tr><th scope="row">Q = ' + M.exprHtml(rx.species) + '</th><td class="r">' + (isFinite(q) ? M.fmt(q, 3) : '∞') + '</td></tr><tr><th scope="row">K<sub>c</sub> at ' + Math.round(sim.T) + ' K</th><td class="r">' + M.fmt(K, 3) + '</td></tr>' +
        '<tr><th scope="row">K<sub>p</sub> at ' + Math.round(sim.T) + ' K</th><td class="r">' + M.fmt(E.Kp(rx, sim.T), 3) + '</td></tr>' +
        '<tr><th scope="row">E<sub>a</sub> forward</th><td class="r">' + E.Ea(rx, sim.cat) + ' kJ/mol' + (sim.cat ? ' (catalyst)' : '') + '</td></tr>' +
        '<tr><th scope="row">Time</th><td class="r">' + M.fmt(sim.t, 3) + ' s (scaled)</td></tr></tbody></table>' +
        '<p class="bt-small">Each molecule drawn = ' + M.fmt(rx.per, 2) + ' mol, so concentration = count × ' + M.fmt(rx.per, 2) + ' mol ÷ volume. The picture rounds to whole molecules; Q, K and the graph use the exact amounts, so counting can differ from them by a few percent. The flights and bounces are real physics, but which molecules react is drawn by the model (from the rate laws), not from these exact collisions. ' + (rx.tint ? esc(rx.tint.what) + ', so the gas color follows that concentration.' : '') + '</p>';
      $('.ek-canvas').setAttribute('aria-label', sim.describe());
      var lq = isFinite(q) ? Math.log(q / K) : 9, dir = Math.abs(lq) < 0.005 ? 'eq' : lq < 0 ? 'f' : 'r';
      if(dir !== lastDir && lastDir){ if(dir === 'eq') explainNow('reached'); }
      lastDir = dir;
      if(LS) studioDraw(q, K, dir);
      if(ch && ch.running && dir === 'eq') finishChallenge();
    }
    function ratesHtml(r){
      var mx = Math.max(r.f, r.r, 1e-12), f = function(v){ return (100 * v / mx).toFixed(1); };
      return '<div class="ek-rates" role="img" aria-label="' + esc('Forward rate ' + window.ApChemMath.fmt(r.f, 2) + ', reverse rate ' + window.ApChemMath.fmt(r.r, 2) + ' M per second (scaled).') + '">' +
        '<div class="ek-rate"><span>Forward</span><i style="width:' + f(r.f) + '%"></i><b>' + window.ApChemMath.fmt(r.f, 2) + '</b></div>' +
        '<div class="ek-rate is-r"><span>Reverse</span><i style="width:' + f(r.r) + '%"></i><b>' + window.ApChemMath.fmt(r.r, 2) + '</b></div>' +
        '<p class="bt-small">Rates in M per scaled second, from the rate laws: forward = k<sub>f</sub>' + rx.species.filter(function(x){ return x.nu < 0; }).map(function(x){ return '[' + x.html + ']' + (x.nu < -1 ? '<sup>' + -x.nu + '</sup>' : ''); }).join('') + ', reverse = k<sub>r</sub>' + rx.species.filter(function(x){ return x.nu > 0; }).map(function(x){ return '[' + x.html + ']' + (x.nu > 1 ? '<sup>' + x.nu + '</sup>' : ''); }).join('') + '. At equilibrium the bars are equal: both reactions still run.</p></div>';
    }
    /* Challenge me: a random stress; predict the shift first, then it runs. */
    function challenge(){
      var ctx = data.contexts.filter(function(c){ return c.reaction === rx.id; })[0], r = M.rng(Date.now() % 100000);
      sim.reset(); tS.set(rx.T[2]); vS.set(rx.V[2]); $('.ek-cat').setAttribute('aria-pressed', 'false'); $('.ek-cat').textContent = 'Add a catalyst';
      var p = E.generate(r, ctx, rx), dirStep = p.steps[1];
      ch = { p: p, running: false };
      var box = $('.ek-chalbox'); box.hidden = false;
      box.innerHTML = '<p class="ek-chq"><b>' + esc(E.STRESS[p.stress]) + (/add|remove/.test(p.stress) ? '' : '') + '.</b> Which way will the mixture shift?</p><div class="ek-chopts">' + dirStep.options.map(function(o, i){ return '<button type="button" class="bt-btn ek-cho" data-i="' + i + '">' + esc(o) + '</button>'; }).join('') + '</div><div class="ek-chfb" role="status" aria-live="polite"></div>';
      box.querySelectorAll('.ek-cho').forEach(function(b){ b.addEventListener('click', function(){
        if(ch.running) return;
        var i = +b.getAttribute('data-i'), ok = i === dirStep.correct;
        box.querySelectorAll('.ek-cho').forEach(function(x){ x.disabled = true; x.classList.toggle('is-pick', x === b); });
        ch.ok = ok; ch.running = true;
        sim.apply(p.stress);
        if(p.stress === 'heat' || p.stress === 'cool') tS.set(sim.T);
        if(p.stress === 'compress' || p.stress === 'expand') vS.set(sim.V);
        if(p.stress === 'catalyst'){ $('.ek-cat').setAttribute('aria-pressed', 'true'); $('.ek-cat').textContent = 'Remove the catalyst'; }
        box.querySelector('.ek-chfb').innerHTML = '<span class="chem-mark ' + (ok ? 'ok">You predicted it' : 'no">Watch what happens') + '</span> Running…';
        explainNow({ heat: 'T', cool: 'T', compress: 'V', expand: 'V', catalyst: 'cat' }[p.stress] || 'amt', p.stress === 'compress' ? -1 : p.stress === 'expand' ? 1 : /R$/.test(p.stress) ? rx.species.findIndex(function(x){ return x.nu < 0; }) : rx.species.findIndex(function(x){ return x.nu > 0; }), /^add/.test(p.stress) ? 1 : -1);
        tab = 'graph'; paint();
        if(p.dir === 'none') setTimeout(finishChallenge, 1500);
        T.event('apchem-tool-challenge', { tool: 'equilibrium-kinetics', correct: ok });
      }); });
      paint();
      if(LS) LS.caption('<b>Challenge:</b> ' + esc(E.STRESS[p.stress]) + '. Predict the shift.', 'explore');
    }
    function finishChallenge(){
      if(!ch || ch.done) return; ch.done = true; ch.running = false;
      var p = ch.p, box = $('.ek-chalbox'), key = p.steps[1];
      box.querySelector('.ek-chfb').innerHTML = '<span class="chem-mark ' + (ch.ok ? 'ok">Right' : 'no">Not quite') + '</span> ' + key.why[key.correct] + ' <button type="button" class="bt-btn ek-again">Another challenge</button>';
      box.querySelector('.ek-again').addEventListener('click', challenge);
    }
    function studioDraw(q, K, dir){
      var wide = (window.innerWidth || 1000) >= 1000;
      LS.pills([{ k: 'Q', html: isFinite(q) ? M.fmt(q, 3) : '∞', tone: 'readout' }, { k: 'K', html: M.fmt(K, 3), tone: 'ghost' }].concat(wide ? [{ k: 'T', html: Math.round(sim.T) + ' K', tone: 'ghost' }] : []), 'left', 'explore');
      LS.pills([dir === 'eq' ? { html: 'Q = K', tone: 'good' } : dir === 'f' ? { html: 'Forward →', tone: 'accent' } : { html: '← Reverse', tone: 'warn' }], 'right', 'explore');
      SP.setup(rx.id === 'n2o4' ? 'N₂O₄ ⇌ 2 NO₂' : 'H₂ + I₂ ⇌ 2 HI');
    }
    function studio(pane, s){
      LS = s;
      var chal = $('.ek-chal'); chal.classList.add('ls-btn', 'ls-pri');
      SP = T.studioPane(pane, s, { stage: [$('.ek-eq'), $('.ek-stage')], dock: [$('.ek-temp'), $('.ek-amts'), $('.ek-btns'), chal, $('.ek-chalbox')], setup: 'Volume, reaction', moreLabel: 'Volume, another reaction, speed of time, start over, sources',
        why: [$('.ek-why')], details: [$('.ek-vol'), $('.ek-nums')] });
      explainNow('');
      paint();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.ek-temp input[type=range]'), text: 'Drag to heat or cool' });
    }
    build();
    return { studio: studio, active: function(on){ if(!sim) return; if(on) sim.start(); else sim.stop(); } };
  }

  /* --------------------------------------------------------------- quiz */
  function quiz(app, data, M){
    var E = M.eqk, sims = [];
    T.drill(app, data, {
      slug: 'equilibrium-kinetics',
      generate: function(r, ctx){ return E.generate(r, ctx, data.reactions.filter(function(x){ return x.id === ctx.reaction; })[0]); },
      types: data.contexts.map(function(c){ var rx = data.reactions.filter(function(x){ return x.id === c.reaction; })[0]; return { value: c.id, label: M.eqHtml(rx.species.map(function(x){ return { html: x.html, nu: x.nu }; })) }; }),
      typeLabel: 'Reaction',
      title: function(){ return 'Predict, then run it'; },
      extra: function(host, p, api){
        sims.forEach(function(s){ s.stop(); }); sims = [];
        var rx = data.reactions.filter(function(x){ return x.id === p.reaction; })[0];
        host.innerHTML = '<figure class="cd-fig ek-qfig"><div class="ek-vessel"><canvas class="ek-canvas" role="img"></canvas></div><div class="ek-gaugebox"></div><div class="ek-plot"></div><figcaption class="bt-small ek-qcap">At equilibrium. The change is applied after your last answer.</figcaption></figure>';
        var sim = Sim(rx, {}); sims.push(sim);
        sim.attach(host.querySelector('canvas'));
        var paint = function(){ host.querySelector('.ek-gaugebox').innerHTML = gaugeHtml(sim); var b = host.querySelector('.ek-plot').getBoundingClientRect(); host.querySelector('.ek-plot').innerHTML = graphSvg(sim, Math.max(280, Math.round(b.width || 480)), 170); host.querySelector('canvas').setAttribute('aria-label', sim.describe()); };
        sim.on(paint); sim.start(); paint();
        api.sim = sim;
      },
      onStep: function(s, right, api){
        if(s.key !== 'rate' || !api.sim) return;
        api.sim.apply(api.problem.stress);
        var cap = api.area.closest('.ls-root') ? document.querySelector('.ek-qcap') : api.area.querySelector('.ek-qcap');
        if(cap) cap.textContent = E.STRESS[api.problem.stress] + ': watch the mixture ' + (api.problem.dir === 'f' ? 'shift forward.' : api.problem.dir === 'r' ? 'shift in reverse.' : 'stay where it is.');
      }
    });
  }
})();
