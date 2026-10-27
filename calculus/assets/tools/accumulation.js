/* Accumulation (simulator; docs/apcalc-spec.md section 6). OWNED BY THIS TOOL
   ONLY. The model is ApCalcMath.accumulation (calculus/assets/tools/math/
   accumulation.js); plots are ApCalcPlot (calc-plot.js), math text ApCalcTex.

   Explore: g(x) = ∫ from a to x of f(t) dt for f drawn from segments and
   semicircles (exact areas), a formula, or your own formula. Drag x on the
   graph of f (or use the slider): the signed area fills in (two tones), the
   graph of g draws itself beside it, and the tangent to g has slope f(x)
   (FTC part 1). Net change: two limits, the shaded area equals the rise of
   g between them (FTC part 2), shown as a bar. Unit 8: a tank with rate in
   R(t) and rate out D(t); the amount is A(0) + ∫ (R − D).
   Test yourself: ApCalcTools.drill over the model's generate(). */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot, X = window.ApCalcTex;
  if(!T || !M || !M.accumulation || !P) return;
  var A = M.accumulation, esc = T.esc, F = T.F;
  var NS = 'http://www.w3.org/2000/svg';
  function tr(t){ return X ? X.render(t) : esc(t); }
  function fmt(x, d){ return F(x, d == null ? 3 : d); }
  function nf(x){ return M.fmt(M.round(x, 3), 6); }

  T.mount('accumulation', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'accumulation',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* shaded signed area between curve f and a base (0 or g2) from u to v,
     split where the difference changes sign; tone by the sign of what it
     adds (dir = +1 when integrating left to right). */
  function shadePolys(Fr, f, base, u, v, dir){
    if(Math.abs(v - u) < 1e-9) return '';
    var lo = Math.min(u, v), hi = Math.max(u, v), N = 180, out = [], run = [], cur = 0;
    function flush(){
      if(run.length > 1){
        var pts = run.map(function(p){ return Fr.sx(p[0]).toFixed(1) + ',' + Fr.sy(p[1]).toFixed(1); });
        var back = run.slice().reverse().map(function(p){ return Fr.sx(p[0]).toFixed(1) + ',' + Fr.sy(base(p[0])).toFixed(1); });
        out.push('<polygon class="ac-area ' + (cur * dir > 0 ? 'is-pos' : 'is-neg') + '" points="' + pts.concat(back).join(' ') + '"/>');
      }
      run = [];
    }
    for(var i = 0; i <= N; i++){
      var x = lo + (hi - lo) * i / N, y = f(x), b = base(x);
      if(!isFinite(y)) { flush(); continue; }
      var s = y - b > 1e-12 ? 1 : y - b < -1e-12 ? -1 : 0;
      if(s && cur && s !== cur){
        // close at the crossing
        var xp = lo + (hi - lo) * (i - 1) / N, z = M.root(function(t){ return f(t) - base(t); }, xp, x);
        if(isFinite(z)){ run.push([z, base(z)]); flush(); run.push([z, base(z)]); }
        else flush();
      }
      if(s) cur = s;
      run.push([x, y]);
    }
    flush();
    return out.join('');
  }
  function yRange(vals){
    var lo = Math.min.apply(null, vals.concat([0])), hi = Math.max.apply(null, vals.concat([0])), sp = hi - lo || 1;
    return [lo - sp * 0.1, hi + sp * 0.14];
  }
  /* Equal scales on both axes (a semicircle drawn round, grid squares
     square) in a w x h plot: the shorter range is widened about its middle
     to fill the box. With stretch > 1 one unit up may be up to that many
     times one unit across before a range is widened (a short landscape
     stage). ApCalcPlot's margins are 48 px across and 40 down. */
  function equalAxes(xr, yr, w, h, stretch){
    var iw = Math.max(40, w - 48), ih = Math.max(40, h - 40), px = iw / (xr[1] - xr[0]), py = ih / (yr[1] - yr[0]), k = stretch || 1;
    if(py > px * k) py = px * k; else if(px > py * k) px = py * k;
    var cx = (xr[0] + xr[1]) / 2, cy = (yr[0] + yr[1]) / 2, hx = iw / px / 2, hy = ih / py / 2, ppu = Math.min(px, py);
    return { x: [cx - hx, cx + hx], y: [cy - hy, cy + hy], ppu: ppu, step: ppu >= 24 ? 1 : ppu >= 12 ? 2 : 5 };
  }
  function nice(raw){ var p = Math.pow(10, Math.floor(Math.log10(raw))), q = raw / p; return (q <= 1 ? 1 : q <= 2 ? 2 : q <= 2.5 ? 2.5 : q <= 5 ? 5 : 10) * p; }
  /* a tick step that leaves at least 24 px between labels on a short plot */
  function yStepFor(yr, h){ var span = yr[1] - yr[0]; return nice(Math.max(span / 7, span * 24 / Math.max(40, h - 40))); }
  function phone(el){ var r = el && el.closest && el.closest('.ls-root'); return !!(r && r.classList.contains('ls-phone')) || window.innerWidth <= 640; }
  /* A bigger, invisible touch target (44 px) on a drag handle. */
  function hitArea(g){ var c = document.createElementNS(NS, 'circle'); c.setAttribute('r', '22'); c.setAttribute('class', 'ac-hit'); g.insertBefore(c, g.firstChild); }
  /* sized(box, draw): draw(w, h) at a default size, again once the Tool
     Studio has placed the figure, and whenever its box changes, so an SVG is
     drawn at the size it is shown (its text stays readable on a phone). */
  function sized(box, draw){
    var last = '';
    function dims(){
      var st = box.closest && box.closest('.ls-drill-stage'), w = Math.round(box.clientWidth) || 540, h = st ? Math.round(box.clientHeight) : 0;
      return [Math.max(200, w), h];
    }
    function go(force){ var d = dims(), k = d.join('x'); if(k === last && !force) return; last = k; draw(d[0], d[1]); }
    draw(540, 0);
    setTimeout(function(){ go(true); }, 0);
    if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(go, 40); }).observe(box); }
    return function(){ go(true); };
  }
  /* the tank, its level the amount, an inlet sized by R and a drain by D */
  function tankSvg(amt, cap, R, D, rmax, unit, moving, compact){
    if(compact) return tankSmall(amt, cap, R, D, rmax, unit, moving);
    var W = 170, H = 236, x0 = 34, x1 = 140, top = 50, bot = 206, frac = Math.max(0, Math.min(1, amt / cap)), lev = bot - (bot - top) * frac;
    var wIn = 2 + 7 * Math.max(0, R) / rmax, wOut = 2 + 7 * Math.max(0, D) / rmax;
    var ticks = [0, 0.5, 1].map(function(t){ var y = bot - (bot - top) * t; return '<line class="ac-tk" x1="' + (x1 - 9) + '" x2="' + x1 + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><text class="ac-tkt" x="' + (x1 + 4) + '" y="' + (y + 4).toFixed(1) + '">' + M.fmt(cap * t, 3) + '</text>'; }).join('');
    return '<svg class="ac-tank-svg" viewBox="0 0 ' + (W + 14) + ' ' + H + '" role="img" aria-label="Tank holding ' + esc(M.fmt(amt, 4)) + ' ' + esc(unit) + '; water comes in at ' + esc(M.fmt(R, 3)) + ' and drains at ' + esc(M.fmt(D, 3)) + ' ' + esc(unit) + ' per hour">' +
      '<defs><clipPath id="acTankClip"><rect x="' + x0 + '" y="' + top + '" width="' + (x1 - x0) + '" height="' + (bot - top) + '" rx="6"/></clipPath></defs>' +
      '<path class="ac-pipe" d="M2 22 H54 Q62 22 62 30 V40"/><text class="ac-tkt" x="4" y="14">in</text>' +
      '<path class="ac-pour' + (moving ? ' is-on' : '') + '" style="stroke-width:' + wIn.toFixed(1) + '" d="M62 40 V' + lev.toFixed(1) + '"/>' +
      '<g clip-path="url(#acTankClip)"><rect class="ac-water" x="' + x0 + '" y="' + lev.toFixed(1) + '" width="' + (x1 - x0) + '" height="' + (bot - lev + 2).toFixed(1) + '"/><path class="ac-wave" d="M' + x0 + ' ' + lev.toFixed(1) + ' q13 -4 26.5 0 t26.5 0 t26.5 0 t26.5 0"/></g>' +
      '<rect class="ac-tank" x="' + x0 + '" y="' + top + '" width="' + (x1 - x0) + '" height="' + (bot - top) + '" rx="6"/>' + ticks +
      '<path class="ac-pipe" d="M' + (x1 - 20) + ' ' + bot + ' V' + (bot + 14) + ' H' + (W + 10) + '"/><path class="ac-drain' + (moving ? ' is-on' : '') + '" style="stroke-width:' + wOut.toFixed(1) + '" d="M' + (x1 + 4) + ' ' + (bot + 14) + ' H' + (W + 12) + '"/><text class="ac-tkt" x="' + (W - 14) + '" y="' + (bot + 30) + '">out</text>' +
      '<text class="ac-tank-v" x="' + ((x0 + x1) / 2) + '" y="' + Math.min(bot - 8, Math.max(top + 18, lev + 22)).toFixed(1) + '" text-anchor="middle">' + esc(M.fmt(amt, 4)) + ' ' + esc(unit) + '</text></svg>';
  }

  /* The same tank for a narrow box (a phone): no tick numbers, the amount
     in two big lines, sized for a box about 100 px wide. */
  function tankSmall(amt, cap, R, D, rmax, unit, moving){
    var x0 = 10, x1 = 90, top = 40, bot = 168, frac = Math.max(0, Math.min(1, amt / cap)), lev = bot - (bot - top) * frac;
    var wIn = 2 + 6 * Math.max(0, R) / rmax, wOut = 2 + 6 * Math.max(0, D) / rmax, ty = Math.min(bot - 26, Math.max(top + 20, lev + 20));
    return '<svg class="ac-tank-svg is-small" viewBox="0 0 100 196" role="img" aria-label="Tank holding ' + esc(M.fmt(amt, 4)) + ' ' + esc(unit) + '; it comes in at ' + esc(M.fmt(R, 3)) + ' and goes out at ' + esc(M.fmt(D, 3)) + ' ' + esc(unit) + ' per hour">' +
      '<defs><clipPath id="acTankClipS"><rect x="' + x0 + '" y="' + top + '" width="' + (x1 - x0) + '" height="' + (bot - top) + '" rx="6"/></clipPath></defs>' +
      '<path class="ac-pipe" d="M3 18 H24 Q30 18 30 24 V32"/><text class="ac-tkt" x="36" y="22">in</text>' +
      '<path class="ac-pour' + (moving ? ' is-on' : '') + '" style="stroke-width:' + wIn.toFixed(1) + '" d="M30 32 V' + lev.toFixed(1) + '"/>' +
      '<g clip-path="url(#acTankClipS)"><rect class="ac-water" x="' + x0 + '" y="' + lev.toFixed(1) + '" width="' + (x1 - x0) + '" height="' + (bot - lev + 2).toFixed(1) + '"/><path class="ac-wave" d="M' + x0 + ' ' + lev.toFixed(1) + ' q10 -4 20 0 t20 0 t20 0 t20 0"/></g>' +
      '<rect class="ac-tank" x="' + x0 + '" y="' + top + '" width="' + (x1 - x0) + '" height="' + (bot - top) + '" rx="6"/>' +
      '<path class="ac-pipe" d="M70 ' + bot + ' V' + (bot + 12) + ' H97"/><path class="ac-drain' + (moving ? ' is-on' : '') + '" style="stroke-width:' + wOut.toFixed(1) + '" d="M74 ' + (bot + 12) + ' H98"/><text class="ac-tkt" x="40" y="' + (bot + 17) + '" text-anchor="end">out</text>' +
      '<text class="ac-tank-v" x="50" y="' + ty.toFixed(1) + '" text-anchor="middle">' + esc(M.fmt(amt, 4)) + '</text><text class="ac-tank-u" x="50" y="' + (ty + 16).toFixed(1) + '" text-anchor="middle">' + esc(unit) + '</text></svg>';
  }

  /* --------------------------------------------------------- explore */
  function explore(host, data){
    var E = data.explore || {}, items = [];
    (E.graphs || []).forEach(function(g){ items.push({ type: 'graph', it: g }); });
    (E.formulas || []).forEach(function(g){ items.push({ type: 'formula', it: g }); });
    (E.tanks || []).forEach(function(g){ items.push({ type: 'tank', it: g }); });
    var cur = null, a = 0, x = 0, x1 = 0, view = 'build', lo = 0, hi = 0, showAll = false, LS = null, touched = false, anim = null;
    var m = null;   // the current model: { f, G, D, grid, gs, yF, yG, specials, ... }
    var nid = T.nid('ac');
    function $(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); }
    function $$(sel){ var o = Array.prototype.slice.call(host.querySelectorAll(sel)); return LS ? o.concat(Array.prototype.slice.call(LS.root.querySelectorAll(sel))) : o; }
    host.innerHTML = '<section class="bt-problem ac-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Accumulation explorer</h2>' +
      '<div class="ac-fig"><figure class="ac-pane ac-pf"><figcaption class="ac-cap ac-capf"></figcaption><div class="ac-plot ac-fplot"></div></figure>' +
      '<figure class="ac-pane ac-pg"><figcaption class="ac-cap ac-capg"></figcaption><div class="ac-plot ac-gplot"></div></figure><div class="ac-tank" hidden></div></div>' +
      '<div class="ac-ctl"><div class="ac-seg ls-seg" role="group" aria-label="View"><button type="button" data-v="build" aria-pressed="true">Build g(x)</button><button type="button" data-v="net" aria-pressed="false">Net change</button></div>' +
      '<div class="ac-s1"></div><div class="ac-s2"></div>' +
      '<div class="bt-buttons ac-btns"><button type="button" class="bt-btn ac-play" aria-pressed="false">▶ Sweep x across</button></div></div>' +
      '<div class="ac-say"></div>' +
      T.moreHtml('<div class="ac-pick"></div><div class="ac-lim"></div>' +
        '<div class="bt-ctl ac-own"><label for="' + nid + '-own">Or type your own f(t)</label><div class="bt-num-row"><input type="text" id="' + nid + '-own" autocomplete="off" spellcheck="false" placeholder="e.g. sin(t) + t/2" aria-describedby="' + nid + '-ownp"><button type="button" class="bt-btn ac-own-go">Use it</button></div><div class="calc-expr-preview ac-own-p" id="' + nid + '-ownp" aria-live="polite"></div></div>' +
        '<div class="bt-check-row"><input type="checkbox" id="' + nid + '-all"><label for="' + nid + '-all">Show the whole graph of g at once</label></div>', 'another graph, the lower limit, your own f') +
      '<div class="ac-nums"></div><p class="sr-only ac-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.ac-live'));
    var cue = T.cue('Drag the point on the graph of f, or the slider, and watch g build.');
    $('.ac-ctl').insertBefore(cue.el, $('.ac-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var sl = null, sl1 = null;
    var pick = T.choiceSelect({ label: 'Graph of f', options: items.map(function(it, i){ return { value: i, label: (it.type === 'tank' ? 'Unit 8: ' : '') + it.it.name }; }), value: 0, onChange: function(v){ load(items[+v]); } });
    $('.ac-pick').appendChild(pick.el);
    var limSel = null;
    $$('.ac-seg button').forEach(function(b){ b.addEventListener('click', function(){ setView(b.getAttribute('data-v')); act(); }); });
    $('.ac-play').addEventListener('click', function(){ anim ? stop() : play(); });
    $('#' + nid + '-all').addEventListener('change', function(){ showAll = this.checked; build(); });
    var own = $('#' + nid + '-own'), ownP = $('.ac-own-p'), ownT = null;
    own.addEventListener('input', function(){ clearTimeout(ownT); ownT = setTimeout(function(){ var r = own.value.trim() ? M.read(own.value.replace(/\bt\b/g, 'x'), { vars: ['x'] }) : null; ownP.innerHTML = !r ? '' : r.ok ? '<span class="bt-small">Reads as</span> ' + tr(r.tex.replace(/x/g, 't')) : '<span class="calc-expr-err">' + esc(r.error) + '</span>'; }, 150); });
    function useOwn(){
      var s = own.value.trim().replace(/\bt\b/g, 'x'), r = s ? M.read(s, { vars: ['x'] }) : null;
      if(!r || !r.ok){ ownP.innerHTML = '<span class="calc-expr-err">' + esc(r ? r.error : 'Type a function of t first, for example sin(t) + t/2.') + '</span>'; return; }
      var f = M.fn(s), bad = 0; for(var i = 0; i <= 80; i++) if(!isFinite(f(-4 + 8 * i / 80))) bad++;
      if(bad > 2){ ownP.innerHTML = '<span class="calc-expr-err">That function is not defined on all of −4 ≤ t ≤ 4. Try another.</span>'; return; }
      load({ type: 'formula', it: { id: 'own', name: 'Your function', fn: s, tex: 'f(t) = ' + r.tex.replace(/x/g, 't'), x: [-4, 4], a: 0 } });
    }
    $('.ac-own-go').addEventListener('click', useOwn);
    own.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); useOwn(); } });

    function isTank(){ return cur.type === 'tank'; }
    function names(){ return isTank() ? { f: 'R − D', g: 'A', v: 't' } : { f: 'f', g: 'g', v: 'x' }; }
    function model(){
      var it = cur.it, o = {};
      if(cur.type === 'graph'){ var Pc = it.pieces; o.D = A.domain(Pc); o.f = function(t){ return A.val(Pc, t); }; o.G = function(t){ return A.area(Pc, a, t); }; o.specials = A.specials(Pc); o.P = Pc; }
      else if(cur.type === 'formula'){ var f = M.fn(it.fn); o.D = it.x.slice(); o.f = f; o.specials = null; }
      else { var R = M.fn(it.R), Dd = M.fn(it.D); o.D = [0, it.T]; o.R = R; o.Dout = Dd; o.f = function(t){ return R(t) - Dd(t); }; o.specials = null; }
      // g on a grid: cumulative from a, one small integral per cell
      var N = 240, xs = [], gs = [];
      for(var i = 0; i <= N; i++) xs.push(o.D[0] + (o.D[1] - o.D[0]) * i / N);
      if(cur.type === 'graph') gs = xs.map(o.G);
      else {
        var cum = [0]; for(i = 1; i <= N; i++) cum.push(cum[i - 1] + M.integral(o.f, xs[i - 1], xs[i], 1e-12));
        var ia = (a - o.D[0]) / (o.D[1] - o.D[0]) * N, k = Math.floor(ia), base = cum[k] + M.integral(o.f, xs[k], a, 1e-12);
        gs = cum.map(function(c){ return c - base; });
        var f0 = o.f;
        o.G = function(t){ return M.integral(f0, a, t, 1e-11); };
      }
      if(isTank()) { var A0 = it.A0; o.amt = function(t){ return A0 + o.G(t); }; gs = gs.map(function(g){ return A0 + g; }); }
      o.xs = xs; o.gs = gs;
      var fv = [], extra = [];
      xs.forEach(function(t){ var v = o.f(t); if(isFinite(v)) fv.push(v); if(isTank()){ extra.push(o.R(t)); extra.push(o.Dout(t)); } });
      o.yF = isTank() ? yRange(extra) : yRange(fv);
      o.yG = yRange(gs.filter(isFinite));
      o.step = isTank() ? 0.1 : cur.type === 'graph' ? 0.1 : M.round((o.D[1] - o.D[0]) / 200, 3);
      return o;
    }
    function snap(v){ return Math.max(m.D[0], Math.min(m.D[1], M.round(Math.round(v / m.step) * m.step, 6))); }
    function load(item){
      stop(); cur = item; a = isTank() ? 0 : item.it.a;
      m = model();
      // Open with something drawn (audit 2026-10): x part way along, so the
      // shaded area and the start of g are on screen; the trace starts at a.
      var start = isTank() ? 0 : a;
      x = snap(start + (m.D[1] - start) * 0.45); x1 = a; lo = Math.min(start, x); hi = Math.max(start, x);
      if(isTank() && view === 'net') view = 'build';
      setupControls();
      build();
      var sv = LS && LS.root.querySelector('.calc-ls-setup .ls-v'); if(sv) sv.textContent = item.it.name;
    }
    function setupControls(){
      var nm = names();
      $('.ac-s1').innerHTML = ''; $('.ac-s2').innerHTML = '';
      sl = T.slider({ label: view === 'net' ? 'To ' + nm.v + ' =' : (isTank() ? 'Time t (hours)' : 'Upper limit x'), min: m.D[0], max: m.D[1], step: m.step, value: x, decimals: m.step < 0.1 ? 2 : 1, onInput: function(v){ act(); stop(); setX(v); } });
      $('.ac-s1').appendChild(sl.el);
      if(view === 'net'){
        sl1 = T.slider({ label: 'From ' + nm.v + ' =', min: m.D[0], max: m.D[1], step: m.step, value: x1, decimals: m.step < 0.1 ? 2 : 1, onInput: function(v){ act(); stop(); x1 = apart(snap(v), x); if(sl1) sl1.set(x1); if(hx1) hx1.set(x1, axisY(), true); live(); } });
        $('.ac-s2').appendChild(sl1.el);
      } else sl1 = null;
      $$('.ac-seg').forEach(function(s){ s.hidden = isTank(); });
      $$('.ac-seg button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === view)); });
      var lim = $('.ac-lim'); lim.innerHTML = '';
      if(!isTank()){
        var opts = (m.specials || integerPoints()).map(function(v){ return { value: v, label: 'a = ' + nf(v) }; });
        limSel = T.choiceSelect({ label: 'Lower limit a', options: opts, value: a, onChange: function(v){ a = +v; stop(); m = model(); lo = hi = x; build(); } });
        lim.appendChild(limSel.el);
      }
      $('.ac-play').textContent = '▶ Sweep ' + nm.v + ' across';
      $('.ac-tank').hidden = !isTank();
      $('.ac-fig').classList.toggle('has-tank', isTank());
    }
    function integerPoints(){ var out = []; for(var v = Math.ceil(m.D[0]); v <= m.D[1]; v++) out.push(v); return out; }
    function setView(v){ if(v === view) return; view = v; stop(); if(view === 'net'){ x1 = a; if(Math.abs(x - x1) < 1e-9) x = snap(Math.min(m.D[1], x1 + (m.D[1] - m.D[0]) / 3)); } setupControls(); build(); }
    function axisY(){ return Math.max(m.yF[0], Math.min(m.yF[1], 0)); }
    // Net change: the two limits never coincide ("from 7 to 7" is no interval):
    // a limit moved onto the other steps one step past it.
    function apart(v, other){
      if(view !== 'net' || Math.abs(v - other) > 1e-9) return v;
      var up = v + m.step <= m.D[1] + 1e-9 ? v + m.step : v - m.step;
      return snap(up);
    }
    function setX(v){ x = apart(snap(v), x1); lo = Math.min(lo, x); hi = Math.max(hi, x); if(sl) sl.set(x); if(hx) hx.set(x, axisY(), true); live(); }

    /* Build both plots (static parts) for the current size; live() fills in
       the parts that move. */
    var Ff = null, Fg = null, fSvg = null, gSvg = null, hx = null, hx1 = null;
    function size(el){
      var r = el.getBoundingClientRect(), w = Math.round(r.width) || 480, h = Math.round(r.height) || 0;
      w = Math.max(140, Math.min(900, w));
      if(!h || h < 60) h = Math.round(Math.min(340, Math.max(200, w * 0.62)));
      return [w, Math.min(h, 560)];
    }
    function build(){
      var it = cur.it, nm = names(), D = m.D, pad = (D[1] - D[0]) * 0.03;
      var whf = size($('.ac-fplot')), whg = size($('.ac-gplot'));
      // A graph of segments and semicircles is drawn to scale (a semicircle
      // looks round, grid squares are 1 by 1); g shares its x range, so the
      // two graphs line up, one above the other.
      var xr = [D[0] - pad, D[1] + pad], yF = m.yF, st = {};
      if(cur.type === 'graph'){ var eq = equalAxes(xr, m.yF, whf[0], whf[1], whf[0] > 3 * whf[1] ? 2 : 1.5); xr = eq.x; yF = eq.y; st = { xStep: eq.step, yStep: eq.step }; }
      var fspec = { label: isTank() ? 'Rates in and out of the tank against time, with the net amount added so far shaded' : 'Graph of f with the signed area from a to x shaded', width: whf[0], height: whf[1], x: xr, y: yF, piX: !!it.piX, xStep: st.xStep, yStep: st.yStep || yStepFor(yF, whf[1]),
        xLabel: 't', yLabel: isTank() ? 'rate' : 'f', curves: isTank() ? [{ fn: m.R, domain: D, cls: 's2', label: 'R' }, { fn: m.Dout, domain: D, cls: 's4', label: 'D' }] : [{ fn: m.f, domain: D, cls: 's1', label: cur.type === 'graph' ? '' : 'f' }] };
      var gspec = { label: isTank() ? 'Graph of the amount A(t) in the tank, drawn as far as t has gone' : 'Graph of g, the accumulation function, drawn as far as x has gone', width: whg[0], height: whg[1], x: xr, y: m.yG, piX: !!it.piX, xStep: st.xStep, yStep: yStepFor(m.yG, whg[1]),
        xLabel: isTank() ? 't' : 'x', yLabel: isTank() ? 'A' : 'g', curves: showAll ? [{ fn: function(t){ return interp(t); }, domain: D, cls: 's5', dashed: true }] : [] };
      Ff = P.frame(fspec); Fg = P.frame(gspec);
      var fs = P.svg(fspec).replace('<g class="calc-plot-axis">', '<g class="ac-shade"></g><g class="calc-plot-axis">').replace('</svg>', '<g class="ac-fmarks"></g></svg>');
      var gs = P.svg(gspec).replace('<g class="calc-plot-axis">', '<g class="ac-gunder"></g><g class="calc-plot-axis">').replace('</svg>', '<g class="ac-gmarks"></g></svg>');
      $('.ac-fplot').innerHTML = fs; $('.ac-gplot').innerHTML = gs;
      fSvg = $('.ac-fplot svg'); gSvg = $('.ac-gplot svg');
      $('.ac-capf').innerHTML = isTank() ? tr(it.Rtex) + ' <span class="ac-sep">and</span> ' + tr(it.Dtex) : (cur.type === 'graph' ? 'The graph of ' + tr('f') : tr(it.tex));
      $('.ac-capg').innerHTML = isTank() ? tr('A(t) = ' + it.A0 + ' + \\int_0^t \\left(R(s) - D(s)\\right)ds') : tr('g(x) = \\int_{' + nf(a).replace('−', '-') + '}^{x} f(t)\\,dt');
      // the handles: drag along the t-axis of the graph of f
      var yAxis = Math.max(m.yF[0], Math.min(m.yF[1], 0));
      hx = P.draggable(fSvg, Ff, { x: x, y: yAxis, axis: 'x', step: m.step, label: view === 'net' ? 'Upper limit, drag along the axis' : (isTank() ? 'Time t, drag along the axis' : 'x, drag along the axis'), constrain: function(nx){ return [apart(snap(nx), x1), yAxis]; }, onMove: function(nx){ act(); stop(); x = nx; lo = Math.min(lo, x); hi = Math.max(hi, x); if(sl) sl.set(x); live(); } });
      hx.el.classList.add('ac-handle'); hitArea(hx.el); hx.el.setAttribute('aria-valuemin', String(D[0])); hx.el.setAttribute('aria-valuemax', String(D[1]));
      if(view === 'net'){
        hx1 = P.draggable(fSvg, Ff, { x: x1, y: yAxis, axis: 'x', step: m.step, label: 'Lower limit of the net change, drag along the axis', constrain: function(nx){ return [apart(snap(nx), x), yAxis]; }, onMove: function(nx){ act(); stop(); x1 = nx; if(sl1) sl1.set(x1); live(); } });
        hx1.el.classList.add('ac-handle', 'is-from'); hitArea(hx1.el); hx1.el.setAttribute('aria-valuemin', String(D[0])); hx1.el.setAttribute('aria-valuemax', String(D[1]));
      } else hx1 = null;
      if(isTank()) $('.ac-tank').hidden = false;
      live();
    }
    function interp(t){ var D = m.D, N = m.xs.length - 1, u = (t - D[0]) / (D[1] - D[0]) * N, i = Math.max(0, Math.min(N - 1, Math.floor(u))); return m.gs[i] + (m.gs[i + 1] - m.gs[i]) * (u - i); }
    function gAt(t){ return isTank() ? m.amt(t) : m.G(t); }
    function exactAt(t){ return cur.type === 'graph' && Math.abs(t * 2 - Math.round(t * 2)) < 1e-9 ? A.exact(cur.it.pieces, a, t) : null; }
    function valText(t){ var e = exactAt(t), v = gAt(t); return e && e.q ? A.pi(e.p, e.q) + ' ≈ ' + fmt(v) : e ? A.pi(e.p, e.q) : fmt(v); }
    function pathOf(Fr, t0, t1){
      var out = [], N = 160;
      for(var i = 0; i <= N; i++){ var t = t0 + (t1 - t0) * i / N, v = cur.type === 'graph' ? m.G(t) : interp(t); out.push(Fr.sx(t).toFixed(1) + ' ' + Fr.sy(v).toFixed(1)); }
      return 'M' + out.join('L');
    }
    function live(){
      if(!fSvg) return;
      var nm = names(), it = cur.it, fx = m.f(x), gx = gAt(x), D = m.D, yAxis = Math.max(m.yF[0], Math.min(m.yF[1], 0));
      var shade = '', fmarks = '', gunder = '', gmarks = '';
      var u0 = view === 'net' ? x1 : (isTank() ? 0 : a);
      if(isTank()) shade = shadePolys(Ff, m.R, m.Dout, u0, x, 1);
      else shade = shadePolys(Ff, m.f, function(){ return 0; }, u0, x, x >= u0 ? 1 : -1);
      // lower limit marker, x marker
      var mk = function(t, cls, lab){ return '<line class="ac-vl ' + cls + '" x1="' + Ff.sx(t).toFixed(1) + '" x2="' + Ff.sx(t).toFixed(1) + '" y1="' + Ff.pad.t + '" y2="' + (Ff.h - Ff.pad.b) + '"/>' + (lab ? '<text class="ac-vlab ' + cls + '" x="' + (Ff.sx(t) + 4).toFixed(1) + '" y="' + (Ff.h - Ff.pad.b - 5) + '">' + esc(lab) + '</text>' : ''); };
      if(!isTank()) fmarks += mk(view === 'net' ? x1 : a, 'is-a', view === 'net' ? '' : 'a');
      if(isFinite(fx) && !isTank()) fmarks += '<line class="ac-hgt" x1="' + Ff.sx(x).toFixed(1) + '" x2="' + Ff.sx(x).toFixed(1) + '" y1="' + Ff.sy(0).toFixed(1) + '" y2="' + Ff.sy(fx).toFixed(1) + '"/><circle class="ac-fpt" cx="' + Ff.sx(x).toFixed(1) + '" cy="' + Ff.sy(fx).toFixed(1) + '" r="4.5"/>';
      if(isTank()){ fmarks += '<circle class="ac-fpt is-in" cx="' + Ff.sx(x).toFixed(1) + '" cy="' + Ff.sy(m.R(x)).toFixed(1) + '" r="4"/><circle class="ac-fpt is-out" cx="' + Ff.sx(x).toFixed(1) + '" cy="' + Ff.sy(m.Dout(x)).toFixed(1) + '" r="4"/>'; }
      fSvg.querySelector('.ac-shade').innerHTML = shade;
      fSvg.querySelector('.ac-fmarks').innerHTML = fmarks;
      // the graph of g: traced over what has been visited (or all), the point and its tangent
      if(view === 'net'){
        gunder = '<path class="ac-gcurve" d="' + pathOf(Fg, D[0], D[1]) + '"/>';
        var g1 = gAt(x1), g2 = gx, X2 = Fg.sx(x).toFixed(1);
        gmarks = '<line class="ac-run" x1="' + Fg.sx(x1).toFixed(1) + '" x2="' + X2 + '" y1="' + Fg.sy(g1).toFixed(1) + '" y2="' + Fg.sy(g1).toFixed(1) + '"/>' +
          '<line class="ac-bar ' + (g2 >= g1 ? 'is-pos' : 'is-neg') + '" x1="' + X2 + '" x2="' + X2 + '" y1="' + Fg.sy(g1).toFixed(1) + '" y2="' + Fg.sy(g2).toFixed(1) + '"/>' +
          '<circle class="ac-gpt" cx="' + Fg.sx(x1).toFixed(1) + '" cy="' + Fg.sy(g1).toFixed(1) + '" r="4"/><circle class="ac-gpt" cx="' + X2 + '" cy="' + Fg.sy(g2).toFixed(1) + '" r="4.5"/>' +
          '<text class="ac-barlab" x="' + (Fg.sx(x) + (Fg.sx(x) > Fg.w * 0.7 ? -8 : 8)).toFixed(1) + '" y="' + ((Fg.sy(g1) + Fg.sy(g2)) / 2 + 4).toFixed(1) + '" text-anchor="' + (Fg.sx(x) > Fg.w * 0.7 ? 'end' : 'start') + '">' + esc((g2 - g1 >= 0 ? '+' : '−') + nf(Math.abs(g2 - g1))) + '</text>';
      } else {
        var t0 = Math.min(lo, x, isTank() ? 0 : a), t1 = Math.max(hi, x, isTank() ? 0 : a);
        if(t1 > t0) gunder = '<path class="ac-gcurve" d="' + pathOf(Fg, t0, t1) + '"/>';
        var sp = (D[1] - D[0]) * 0.11, sx0 = Math.max(D[0], x - sp), sx1 = Math.min(D[1], x + sp);
        if(isFinite(fx)) gmarks += '<line class="ac-tan" x1="' + Fg.sx(sx0).toFixed(1) + '" y1="' + Fg.sy(gx + fx * (sx0 - x)).toFixed(1) + '" x2="' + Fg.sx(sx1).toFixed(1) + '" y2="' + Fg.sy(gx + fx * (sx1 - x)).toFixed(1) + '"/>';
        if(!isTank()) gmarks += '<circle class="ac-gpt is-a" cx="' + Fg.sx(a).toFixed(1) + '" cy="' + Fg.sy(0).toFixed(1) + '" r="3.5"/>';
        gmarks += '<circle class="ac-gpt" cx="' + Fg.sx(x).toFixed(1) + '" cy="' + Fg.sy(gx).toFixed(1) + '" r="5"/>';
        if(isFinite(fx) && Fg.w >= 300) gmarks += '<text class="ac-tanlab" x="' + Math.min(Fg.w - 6, Fg.sx(sx1) + 2).toFixed(1) + '" y="' + Math.max(12, Math.min(Fg.h - 30, Fg.sy(gx + fx * (sx1 - x)) - 6)).toFixed(1) + '" text-anchor="end">slope ' + esc(fmt(fx, 2)) + '</text>';
      }
      gSvg.querySelector('.ac-gunder').innerHTML = gunder;
      gSvg.querySelector('.ac-gmarks').innerHTML = gmarks;
      if(isTank()){
        var cap = niceCap(Math.max.apply(null, m.gs) * 1.15), rmax = Math.max(m.yF[1], 1);
        var tb = $('.ac-tank');
        tb.innerHTML = tankSvg(gx, cap, m.R(x), m.Dout(x), rmax, it.unitAbbr, !!anim, tb.clientWidth > 0 && tb.clientWidth < 140);
      }
      words();
    }
    function niceCap(v){ var p = Math.pow(10, Math.floor(Math.log10(Math.max(1, v)))), ms = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; for(var i = 0; i < ms.length; i++) if(v <= ms[i] * p) return ms[i] * p; return 10 * p; }

    /* What is happening, in one line, and why. */
    function words(){
      var it = cur.it, fx = m.f(x), gx = gAt(x), nm = names(), head, line, why = '';
      var xs = nf(x), s = fx > 1e-9 ? 1 : fx < -1e-9 ? -1 : 0;
      var slope = M.deriv(m.f, x, 1e-5), ss = Math.abs(slope) < 1e-6 ? 0 : slope > 0 ? 1 : -1;
      if(isTank()){
        var R = m.R(x), Dd = m.Dout(x);
        head = 'At t = ' + xs + ' h: ' + nf(gx) + ' ' + it.unitAbbr + ' in the tank.';
        line = s > 0 ? 'Rising: water comes in faster than it drains (R > D).' : s < 0 ? 'Falling: it drains faster than it fills (R < D).' : 'Level for an instant: R = D.';
        why = '<p>' + esc('A(' + xs + ') = ' + it.A0 + ' + ∫ from 0 to ' + xs + ' of (R − D) = ' + it.A0 + ' + (' + fmt(gx - it.A0) + ') = ' + fmt(gx) + ' ' + it.unit + '.') + '</p>' +
          '<p>' + esc('The amount is the starting amount plus the net amount added. Now R(' + xs + ') = ' + fmt(R) + ' and D(' + xs + ') = ' + fmt(Dd) + ', so A′(' + xs + ') = ' + fmt(R - Dd) + ' ' + it.rateUnit + '.') + '</p>' +
          '<p>The shaded strip between the two rate curves is what has been added so far: the first tone where more comes in than goes out, the second where more drains. The amount is greatest where R − D changes from positive to negative.</p>';
        say(head + ' ' + line);
      } else if(view === 'net'){
        var g1 = gAt(x1), v = gx - g1, from = nf(x1);
        head = '∫ from ' + from + ' to ' + xs + ' of f = ' + fmt(v) + '.';
        line = 'The same as g(' + xs + ') − g(' + from + '): the bar on the graph of g.';
        var parts = cur.type === 'graph' ? A.pieceText(it.pieces, x1, x) : [];
        why = '<p>' + esc('The Fundamental Theorem, part 2: the integral of f from ' + from + ' to ' + xs + ' equals the change in an antiderivative, g(' + xs + ') − g(' + from + ') = ' + fmt(gx) + ' − ' + (g1 < -5e-4 ? '(' + fmt(g1) + ')' : fmt(g1)) + ' = ' + fmt(v) + '. Any antiderivative gives the same difference; g is one of them.') + '</p>' +
          (parts.length ? '<p>' + esc('From the shapes: ' + parts.map(function(q){ return q.what + ' on [' + nf(q.from) + ', ' + nf(q.to) + ']: ' + q.text; }).join('; ') + (x < x1 ? '; the limits run right to left, so flip the sign.' : '.')) + '</p>' : '') +
          '<p>This is net change: the integral of a rate of change gives the total change, area above the axis adding and area below subtracting.</p>';
        say(head + ' ' + line);
      } else {
        head = 'g(' + xs + ') = ' + valText(x) + '.';
        line = s > 0 ? 'g rises here: f(' + xs + ') > 0.' : s < 0 ? 'g falls here: f(' + xs + ') < 0.' : 'f(' + xs + ') = 0: g has a horizontal tangent.';
        var parts2 = cur.type === 'graph' ? A.pieceText(it.pieces, a, x) : [];
        why = '<p>' + esc(x >= a ? 'g(' + xs + ') is the signed area under f from ' + nf(a) + ' to ' + xs + ': area above the axis adds, area below subtracts.' : xs + ' is left of the lower limit ' + nf(a) + ', so g(' + xs + ') = −∫ from ' + xs + ' to ' + nf(a) + ' of f: the area counts with the opposite sign.') + '</p>' +
          (parts2.length ? '<p>' + esc('Shapes: ' + parts2.map(function(q){ return q.what + ' on [' + nf(q.from) + ', ' + nf(q.to) + ']: ' + q.text; }).join('; ') + '.') + '</p>' : '') +
          '<p>' + esc('Fundamental Theorem, part 1: g′(x) = f(x). The tangent to g at x = ' + xs + ' has slope f(' + xs + ') = ' + fmt(fx) + ', so g is ' + (s > 0 ? 'increasing' : s < 0 ? 'decreasing' : 'momentarily level') + ' there.') + '</p>' +
          '<p>' + esc('g″(x) = f′(x): f is ' + (ss > 0 ? 'increasing' : ss < 0 ? 'decreasing' : 'level') + ' at ' + xs + ', so g is ' + (ss > 0 ? 'concave up' : ss < 0 ? 'concave down' : 'neither concave up nor down') + ' there. g has a relative maximum where f changes from positive to negative and a point of inflection where f changes from increasing to decreasing.') + '</p>';
        say(head + ' ' + line);
      }
      T.explain($('.ac-say'), '<b>' + esc(head) + '</b> ' + esc(line), why);
      if(LS){
        if(isTank()){
          LS.pills([{ k: 'A(' + xs + ')', html: nf(gx) + ' ' + esc(it.unitAbbr), tone: 'readout' }], 'left', 'explore');
          LS.pills([{ k: 'A′ = R − D', html: (fx >= 0 ? '+' : '−') + fmt(Math.abs(fx), 2), tone: fx >= 0 ? 'good' : 'warn' }], 'right', 'explore');
        } else if(view === 'net'){
          LS.pills([{ k: '∫ f', html: fmt(gx - gAt(x1)), tone: 'readout' }], 'left', 'explore');
          LS.pills([{ k: 'g(' + xs + ') − g(' + nf(x1) + ')', html: fmt(gx - gAt(x1)), tone: 'ghost' }], 'right', 'explore');
        } else {
          LS.pills([{ k: 'g(' + xs + ')', html: fmt(gx), tone: 'readout' }], 'left', 'explore');
          LS.pills([{ k: 'g′ = f', html: isFinite(fx) ? fmt(fx, 2) : '—', tone: s > 0 ? 'good' : s < 0 ? 'warn' : 'ghost' }], 'right', 'explore');
        }
        LS.caption('<b>' + esc(head) + '</b> ' + esc(line), 'explore');
      }
      nums();
    }
    function nums(){
      var it = cur.it, box = $('.ac-nums'), pts, rows;
      if(isTank()){
        pts = []; for(var t = 0; t <= it.T; t += 2) pts.push(t);
        rows = pts.map(function(t){ return '<tr' + (Math.abs(t - x) < 1e-9 ? ' class="hl"' : '') + '><th scope="row">' + t + '</th><td class="r">' + fmt(m.R(t), 2) + '</td><td class="r">' + fmt(m.Dout(t), 2) + '</td><td class="r">' + fmt(m.amt(t), 2) + '</td></tr>'; }).join('');
        box.innerHTML = '<h3 class="ls-title-l">The tank, hour by hour</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Rates and amount"><table class="ls-tbl"><caption class="sr-only">Rate in, rate out and amount</caption><thead><tr><th scope="col">t (h)</th><th scope="col">R (' + esc(it.unitAbbr) + '/h)</th><th scope="col">D (' + esc(it.unitAbbr) + '/h)</th><th scope="col">A (' + esc(it.unitAbbr) + ')</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '<p class="bt-small">' + esc('A(t) = ' + it.A0 + ' + ∫ from 0 to t of (R(s) − D(s)) ds, in ' + it.unit + '.') + '</p>';
        return;
      }
      pts = cur.type === 'graph' ? m.specials : integerPoints();
      rows = pts.map(function(t){ var fv = m.f(t); return '<tr' + (Math.abs(t - x) < 1e-9 ? ' class="hl"' : '') + '><th scope="row">' + nf(t) + '</th><td class="r">' + (isFinite(fv) ? nf(fv) : '—') + '</td><td class="r">' + esc(valText(t)) + '</td></tr>'; }).join('');
      var read = '';
      if(cur.type === 'graph'){
        var Pc = it.pieces, Z = A.zeros(Pc), mx = Z.filter(function(z){ return z.from > 0 && z.to < 0; }).map(function(z){ return nf(z.x); }), mn = Z.filter(function(z){ return z.from < 0 && z.to > 0; }).map(function(z){ return nf(z.x); }), inf = A.inflections(Pc).map(nf);
        read = '<h3 class="ls-title-l">Reading g from f</h3><ul class="ac-read"><li>' + esc('Relative maximum of g where f changes from + to −: ' + (mx.length ? 'x = ' + mx.join(', ') : 'none')) + '</li><li>' + esc('Relative minimum where f changes from − to +: ' + (mn.length ? 'x = ' + mn.join(', ') : 'none')) + '</li><li>' + esc('Points of inflection where f changes between increasing and decreasing: ' + (inf.length ? 'x = ' + inf.join(', ') : 'none')) + '</li></ul>' +
          '<p class="bt-small">' + esc(A.graphDesc(Pc, 'f')) + '</p>';
      }
      box.innerHTML = '<h3 class="ls-title-l">Values of g</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Values of f and g"><table class="ls-tbl"><caption class="sr-only">f and g at key points</caption><thead><tr><th scope="col">x</th><th scope="col">f(x)</th><th scope="col">g(x)</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + read;
    }
    function play(){
      act();
      var b = $('.ac-play'), D = m.D, from = view === 'net' ? x1 : D[0];
      b.setAttribute('aria-pressed', 'true'); b.textContent = '❚❚ Pause';
      if(T.reduced()){ setX(D[1]); stop(); return; }
      x = from; lo = Math.min(lo, x);
      anim = P.loop(function(dt, t){ var v = from + (D[1] - from) * Math.min(1, t / 5); setX(v); return t < 5; }, { onEnd: function(){ anim = null; resetBtn(); live(); } });
      anim.start();
    }
    function resetBtn(){ var b = $('.ac-play'); if(b && cur){ b.setAttribute('aria-pressed', 'false'); b.textContent = '▶ Sweep ' + names().v + ' across'; } }
    function stop(){ if(anim){ anim.stop(); anim = null; } resetBtn(); }

    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.ac-fig')], dock: [$('.ac-ctl')], setup: 'Graph', moreLabel: 'Graph of f, lower limit, your own f', why: [$('.ac-say')], details: [$('.ac-nums')] });
      sp.setup(cur.it.name);
      build();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.ac-fplot .ac-handle') || s.root.querySelector('.ac-s1 input'), text: 'Drag x along the axis' });
      if(window.ResizeObserver){ var t = null, ro = new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(build, 80); }); ro.observe($('.ac-fplot')); ro.observe($('.ac-gplot')); }
    }
    load(items[0]);
    if(!window.LevlStudio && window.ResizeObserver){ var t2 = null; new ResizeObserver(function(){ clearTimeout(t2); t2 = setTimeout(build, 80); }).observe($('.ac-fig')); }
    return { stop: stop, studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  /* A tank problem's scene: the two rates on [0, T] and the tank at t = 0. */
  function tankFigure(el, k){
    var R = M.fn(k.Rx), D = M.fn(k.Dx), vals = [];
    for(var i = 0; i <= 60; i++){ var t = k.T * i / 60; vals.push(R(t)); vals.push(D(t)); }
    var rmax = Math.max.apply(null, vals);
    el.innerHTML = '<figure class="ac-qfig ac-qtank"><div class="ac-qrow"><div class="ac-qplot"></div><div class="ac-qtk"></div></div><figcaption class="bt-small">Rate in R (blue) and rate out D (orange), in ' + esc(k.rateUnit) + '; the tank at t = 0 holds ' + esc(String(k.A0)) + ' ' + esc(k.unit) + '.</figcaption></figure>';
    var box = el.querySelector('.ac-qplot'), tk = el.querySelector('.ac-qtk');
    redrawFig = sized(box, function(w, h){
      if(!h) h = Math.round(Math.min(300, Math.max(190, w * 0.62))); else h = Math.max(90, h);
      var spec = { label: 'Graphs of the rate in R and the rate out D, in ' + k.rateUnit + ', for t from 0 to ' + k.T + ' ' + k.tUnit, width: w, height: h, x: [-0.2, k.T + 0.2], y: yRange(vals), xStep: 1,
        xLabel: 't', yLabel: 'rate', curves: [{ fn: R, domain: [0, k.T], cls: 's2', label: 'R' }, { fn: D, domain: [0, k.T], cls: 's4', label: 'D' }] };
      box.innerHTML = P.svg(spec).replace(/<\/svg>$/, MK.svg(P.frame(spec)) + '</svg>');
      tk.innerHTML = tankSvg(k.A0, k.A0 * 2, R(0), D(0), rmax, k.unit, false, tk.clientWidth > 0 && tk.clientWidth < 140);
    });
  }
  /* Test yourself is visual (docs/tool-audit-2026-10.md X1): each try is
     drawn on the graph, the student's answer dashed and the right one solid. */
  var MK = T.tries(), redrawFig = function(){};
  function shadeMarks(fn, a, c, label){
    // the signed area from a to c (reversed limits flip the sign), split at the axis
    var lo = Math.min(a, c), hi = Math.max(a, c), sg = c < a ? -1 : 1, out = [], N = 240, run = [], cur = 0, A = 0;
    function flush(){ if(run.length > 1){ out.push({ fill: [[run[0][0], 0]].concat(run, [[run[run.length - 1][0], 0]]), who: 'right', tone: cur * sg > 0 ? 'pos' : 'neg' }); } run = []; }
    for(var i = 0; i <= N; i++){
      var x = lo + (hi - lo) * i / N, y = fn(x), s = y > 1e-9 ? 1 : y < -1e-9 ? -1 : 0;
      if(s && cur && s !== cur){ var z = M.root(fn, x - (hi - lo) / N, x); if(isFinite(z)) run.push([z, 0]); flush(); if(isFinite(z)) run.push([z, 0]); }
      if(s) cur = s;
      run.push([x, y]);
    }
    flush();
    if(label) out.push({ label: label, at: [(lo + hi) / 2, 1e9], who: 'right', anchor: 'middle' });
    return out;
  }
  function markTry(s, t, p){
    var who = t.ok || t.shown ? 'right' : 'yours', k = s.key, mk = [], fn;
    var val = who === 'right' && s.kind === 'num' ? s.cell.answer : t.value, N = function(v){ return T.numText(v); };
    if(p.graph){
      fn = function(x){ return A.val(p.graph, x); };
      var lab = String(s.label).replace(/<[^>]+>/g, '');
      var cOf = /\(([−\-]?\d+(?:\.\d+)?)\)/.exec(lab), c = cOf ? +cOf[1].replace('−', '-') : NaN;
      if(k === 'g1' || k === 'g2' || k === 'h1' || k === 'h2'){
        if(!isFinite(c)) return [];
        var a = p.a;
        if(who === 'right') mk = shadeMarks(fn, a, c, (p.type === 'netgraph' ? 'h(' + N(c) + ') = h(' + N(a) + ') + signed area = ' : 'g(' + N(c) + ') = signed area = ') + N(val));
        mk.push({ vline: c, who: who, label: who === 'yours' ? 'yours: ' + lab.replace(/\s+/g, '') + ' = ' + N(val) : '' });
      } else if(k === 'gp' || k === 'gp2'){
        if(isFinite(c) && isFinite(val)) mk.push({ point: [c, val], who: who, label: (who === 'yours' ? 'yours: ' : 'f(' + N(c) + ') = ') + N(val) });
      } else if(k === 'gpp'){
        if(isFinite(c) && isFinite(val)) mk.push({ tangent: [c, fn(c)], slope: val, half: 1.2, who: who, label: (who === 'yours' ? 'yours: slope ' : 'slope of f = ') + N(val) });
      } else if(k === 'absmax'){
        if(isFinite(val)) mk.push({ label: (who === 'yours' ? 'yours: ' : 'largest h = ') + N(val), at: [A.domain(p.graph)[1], 1e9], who: who, anchor: 'end' });
      } else if(s.kind === 'choice' && t.pick > -1){
        var cm = T.choiceMarks(s.options[t.pick], 'x');
        cm.ivs.forEach(function(iv){ mk.push({ band: iv, who: who, label: who === 'yours' ? 'yours' : '' }); });
        cm.xs.forEach(function(x){ mk.push({ vline: x, who: who, label: 'x = ' + N(x) }); });
      }
    } else if(p.tank){
      var R = M.fn(p.tank.Rx), D = M.fn(p.tank.Dx), Tm = p.tank.T;
      var t1m = /=\s*(\d+)/.exec(String(s.label).replace(/<[^>]+>/g, '')), t1 = t1m ? +t1m[1] : NaN;
      if(k === 'rate' && isFinite(t1)){
        if(who === 'right') mk.push({ line: [[t1, D(t1)], [t1, R(t1)]], who: 'right', label: 'R − D = ' + N(val) });
        else mk.push({ label: 'yours: ' + N(val), at: [t1, -1e9], who: 'yours' });
      } else if(k === 'total'){
        if(who === 'right'){
          // R − D between the curves: in (R above D) and out (D above R)
          var N2 = 120, up = [], dn = [];
          for(var i = 0; i <= N2; i++){ var x = Tm * i / N2; up.push([x, Math.max(R(x), D(x))]); dn.push([x, Math.min(R(x), D(x))]); }
          mk.push({ fill: up.concat(dn.reverse()), who: 'right', tone: 'pos' });
          mk.push({ label: 'A(' + N(Tm) + ') = ' + N(p.tank.A0) + ' + ∫(R − D) = ' + N(val), at: [Tm / 2, 1e9], who: 'right', anchor: 'middle' });
        } else mk.push({ label: 'yours: ' + N(val), at: [Tm, 1e9], who: 'yours', anchor: 'end' });
      } else if(s.kind === 'choice' && t.pick > -1){
        T.choiceMarks(s.options[t.pick], 't').xs.forEach(function(x){ mk.push({ vline: x, who: who, label: 't = ' + N(x) }); });
      }
    }
    return mk;
  }
  function quiz(host, data){
    var o = { slug: 'accumulation', noun: 'drill',
      generate: function(r, ctx, type){ var p = A.generate(r, ctx, type); o.textOnStage = true; return p; },
      // the problems hold real formulas: read on the stage, over the figure
      textOnStage: true,
      types: [{ value: 'values', label: 'Values of g from the graph' }, { value: 'behavior', label: 'Where g rises, peaks and bends' }, { value: 'derivs', label: 'g′ and g″ at a point' }, { value: 'chain', label: 'A variable upper limit (chain rule)' }, { value: 'netgraph', label: 'Net change from a derivative' }, { value: 'tank', label: 'Rate in, rate out (Unit 8)' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { values: 'Values of an accumulation function', behavior: 'Reading g from the graph of f', derivs: 'The derivatives of g', chain: 'A variable limit of integration', netgraph: 'Net change', tank: 'Rate in, rate out' }[p.type] || 'Practice problem'; },
      extra: function(el, p){ MK.clear(); MK.last = {}; redrawFig = function(){}; figure(el, p); },
      method: function(s, p){ return METHOD[s.key] || (p.type === 'behavior' ? METHOD.behavior : ''); },
      onTry: function(s, t, api){
        var mk = markTry(s, t, api.problem), last = MK.last || (MK.last = {});
        if(!mk.length) return false;
        if(!t.ok && !t.shown) last[s.key] = mk; else if(last[s.key]) mk = last[s.key].concat(mk);
        MK.set(s.key, mk); redrawFig();
        return true;
      }
    };
    T.drill(host, data, o);
  }
  var METHOD = {
    g1: 'g(c) is the signed area from the lower limit a to c: add the shapes (triangles, rectangles, half circles), above the axis plus and below minus.',
    g2: 'g(c) is the signed area from a to c. If c is left of a, g(c) = −(the signed area from c to a): add the shapes, then flip the sign.',
    gp: 'By the Fundamental Theorem, g′(x) = f(x): read the height of the graph at that x.',
    gpp: 'g″(x) = f′(x): the slope of the graph of f at that x (rise over run on its segment).',
    zero: 'When the two limits of integration are equal, the integral is 0.',
    deriv: 'Chain rule: put the upper limit into the integrand, then multiply by the derivative of the upper limit.',
    h1: 'h(c) = h(a) + the signed area under h′ from a to c.',
    h2: 'h(c) = h(a) − the signed area under h′ from c to a, when c is left of a.',
    absmax: 'Compare h at the endpoints and where h′ changes from positive to negative; the largest value wins.',
    rate: 'The amount changes at R(t) − D(t): rate in minus rate out at that time.',
    dir: 'Compare R and D at that moment: more in than out means the amount is increasing.',
    total: 'Amount at T = amount at 0 + the integral of R − D from 0 to T.',
    when: 'The amount peaks where R − D changes from positive to negative. Check the endpoints too.',
    behavior: 'g′ = f: g rises where f > 0, peaks where f changes from + to −, and is concave up where f is rising.'
  };
  /* The graph of f (or h′) drawn to scale at the size it is shown: grid
     squares are square, so a semicircle looks round. */
  function figure(el, p){
    if(p.tank){ tankFigure(el, p.tank); return; }
    if(!p.graph){ el.innerHTML = ''; return; }
    var Pc = p.graph, D = A.domain(Pc), vals = [];
    for(var i = 0; i <= 200; i++) vals.push(A.val(Pc, D[0] + (D[1] - D[0]) * i / 200));
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), fn = p.fname || 'f';
    var xr = [D[0] - 0.5, D[1] + 0.5], yr = [Math.floor(lo) - 0.6, Math.ceil(hi) + 0.6];
    el.innerHTML = '<figure class="ac-qfig"><div class="ac-qplot"></div><figcaption class="bt-small">The graph of ' + esc(fn) + ' (grid squares are 1 by 1)' + (p.a != null && p.type !== 'netgraph' ? '; lower limit a = ' + nf(p.a) : '') + '.</figcaption></figure>';
    var box = el.querySelector('.ac-qplot');
    redrawFig = sized(box, function(w, h){
      // off the stage (or before it is placed): as tall as the graph needs
      if(!h) h = Math.round(Math.min(560, 40 + (yr[1] - yr[0]) * Math.min(64, (w - 48) / (xr[1] - xr[0])))); else h = Math.max(90, h);
      var eq = equalAxes(xr, yr, w, h), ph = phone(el);
      // the end of the graph's label sits clear of the end point
      var spec = { label: A.graphDesc(Pc, fn).replace(/′/g, ' prime'), width: w, height: h, x: eq.x, y: eq.y, xStep: 1, yStep: eq.ppu >= 18 ? 1 : 2,
        xLabel: 'x', yLabel: 'y', curves: [{ fn: function(t){ return A.val(Pc, t); }, domain: D, cls: 's1', ends: ['closed', 'closed'], samples: 600 }] };
      var F0 = P.frame(spec), mid = D[0] + (D[1] - D[0]) * 0.12, yl = A.val(Pc, mid);
      box.innerHTML = P.svg(spec).replace('</svg>', '<text class="calc-plot-label ac-fname" x="' + F0.sx(mid).toFixed(1) + '" y="' + (F0.sy(yl) + (yl >= 0 ? -10 : 20)).toFixed(1) + '" text-anchor="middle">' + esc(fn) + '</text>' + MK.svg(F0) + '</svg>');
      box.classList.toggle('is-phone', ph);
    });
  }
})();
