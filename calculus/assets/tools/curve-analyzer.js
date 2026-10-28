/* Curve analyzer (Unit 5, Premium; docs/apcalc-spec.md section 6). Job: read
   a function from its derivatives and justify every feature the way a
   reader accepts it. OWNED BY THIS TOOL ONLY. Model: ApCalcMath.curveAnalyzer
   (calculus/assets/tools/math/curve-analyzer.js); frame: ApCalcTools.modes
   and drill on the Tool Studio; figures: ApCalcPlot.

   Explore, Curves: f, f′ and f″ stacked on one x-axis, always crimson,
   blue and green. A vertical cursor (drag across the graphs, the slider,
   or the arrow keys) reads all three at once. The sign charts of f′ and f″
   build themselves from left to right; critical points (f′ = 0 or
   undefined) and points of inflection are marked on f, each with the
   sentence that justifies it, and the candidates test on the closed
   interval is in "Formulas & numbers". Explore, Optimize: three scenes
   (an open box from a sheet, a fence along a river, a soda can) with a
   slider for the one quantity you choose; the objective and its derivative
   are graphed below the scene.

   Test yourself: increasing and decreasing, relative extrema with the
   first derivative test, absolute extrema by the candidates test,
   concavity and inflection, reading f from the graph of f′, and
   optimization with its justification. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot, X = window.ApCalcTex;
  (function(){
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Formulas & numbers');
  })();
  if(!T || !M || !M.curveAnalyzer || !P) return;
  var CA = M.curveAnalyzer, F = T.F, esc = T.esc;
  function html(s){ return X ? X.html(s) : s; }
  function tex(s, d){ return X ? X.render(s, { display: !!d }) : esc(s); }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function xlabel(x, c){ var s = CA.xs(x); return /\\/.test(s) ? X.text(s) : F(x, 2); }
  function narrow(){ try{ return matchMedia('(max-width: 599.98px)').matches; }catch(e){ return false; } }
  function studioNow(){ var app = document.getElementById('app'); return window.LevlStudio && app && app.getAttribute('data-studio') ? window.LevlStudio.get() : null; }

  T.mount('curve-analyzer', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'curve-analyzer',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.pause(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ============================================================ explore */
  function explore(host, data){
    var LS = null;
    var curves = (data.curves || CA.ORDER).filter(function(id){ return CA.CURVES[id]; });
    var scenes = (data.optimize || []).map(function(s){ return s.id || s; }).filter(function(id){ return CA.SCENES[id]; });
    var st = { view: 'curves', id: curves[0], x: 0, sid: scenes[0] || null, u: 0, reveal: 1, touched: false, gv: null };
    var cue = T.cue('Drag across the graphs: the cursor reads f, f′ and f″ at once.');
    host.innerHTML =
      '<section class="bt-problem ca-card" aria-label="Curve analyzer explorer">' +
        '<div class="ca-stage">' +
          '<div class="ca-curves">' +
            '<div class="ca-graphs-wrap" tabindex="0" role="slider" aria-label="Cursor on the graphs of f, f′ and f″: arrow keys move it"><svg class="ca-graphs" aria-hidden="true"></svg></div>' +
            '<p class="ca-legend" aria-hidden="true"><span class="ca-lg s1">f</span><span class="ca-lg s2">f′</span><span class="ca-lg s3">f″</span><span class="ca-lg ca-lg-crit">critical point</span><span class="ca-lg ca-lg-poi">inflection</span></p>' +
          '</div>' +
          '<div class="ca-opt" hidden>' +
            '<div class="ca-scene-wrap"><svg class="ca-scene" viewBox="0 0 420 230" preserveAspectRatio="xMidYMid meet" role="img"></svg></div>' +
            '<div class="ca-ograph-wrap"><svg class="ca-ograph" aria-hidden="true"></svg></div>' +
          '</div>' +
        '</div>' +
        '<div class="ca-ctl">' +
          (scenes.length ? '<div class="ca-views ls-seg" role="group" aria-label="View"><button type="button" class="bt-mode" data-v="curves" aria-pressed="true">Curves</button><button type="button" class="bt-mode" data-v="opt" aria-pressed="false">Optimize</button></div>' : '') +
          '<div class="ca-chips ls-scroll" role="group" aria-label="Function"></div>' +
          '<div class="ca-gview ls-seg" role="group" aria-label="Graphs shown"><button type="button" class="bt-mode" data-k="all" aria-pressed="true">All three</button><button type="button" class="bt-mode" data-k="f" aria-pressed="false">f only</button><button type="button" class="bt-mode" data-k="fp" aria-pressed="false">f′ only</button><button type="button" class="bt-mode" data-k="fpp" aria-pressed="false">f″ only</button></div>' +
          '<div class="ca-slot"></div>' +
        '</div>' +
        '<div class="ca-say"></div>' +
        '<div class="ca-det"></div>' +
        '<p class="sr-only ca-live"></p>' +
      '</section>';
    var card = host.querySelector('.ca-card');
    card.insertBefore(cue.el, card.querySelector('.ca-say'));
    var gwrap = host.querySelector('.ca-graphs-wrap'), gsvg = host.querySelector('.ca-graphs'), chips = host.querySelector('.ca-chips');
    var curvesEl = host.querySelector('.ca-curves'), optEl = host.querySelector('.ca-opt'), sceneSvg = host.querySelector('.ca-scene'), osvg = host.querySelector('.ca-ograph'), owrap = host.querySelector('.ca-ograph-wrap');
    var viewsEl = host.querySelector('.ca-views'), slot = host.querySelector('.ca-slot');
    var say = T.announcer(host.querySelector('.ca-live'));
    var slider = null, gl = null, ol = null, anim = null, cache = {};
    function cv(){ return CA.CURVES[st.id]; }
    function info(){ if(!cache[st.id]) cache[st.id] = { A: CA.analyze(cv()), feats: CA.features(cv()) }; return cache[st.id]; }
    function sc(){ return CA.SCENES[st.sid]; }
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }
    function $(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); }

    function buildChips(){
      var list = st.view === 'curves' ? curves.map(function(id){ return [id, CA.CURVES[id].name]; }) : scenes.map(function(id){ return [id, CA.SCENES[id].name]; });
      var cur = st.view === 'curves' ? st.id : st.sid;
      chips.innerHTML = list.map(function(c){ return '<button type="button" class="bt-btn ca-chip" data-id="' + c[0] + '" aria-pressed="' + (c[0] === cur) + '">' + esc(c[1]) + '</button>'; }).join('');
      chips.setAttribute('aria-label', st.view === 'curves' ? 'Function' : 'Scene');
    }
    function buildSlider(){
      if(st.view === 'curves'){
        var c = cv();
        slider = T.slider({ label: 'Cursor x', min: c.dom[0], max: c.dom[1], step: 0.01, value: st.x, decimals: 2, onInput: function(v){ setX(v, true); } });
      } else {
        var s = sc();
        slider = T.slider({ label: s.label + ' ' + s.var, min: s.dom[0], max: s.dom[1], step: s.step, value: st.u, unit: s.unit, decimals: s.step < 0.1 ? 2 : s.step < 1 ? 1 : 0, onInput: function(v){ st.u = v; touch(); draw(true); } });
      }
      slot.innerHTML = ''; slot.appendChild(slider.el);
    }
    function setView(v){
      st.view = v; pause();
      if(viewsEl) viewsEl.querySelectorAll('.bt-mode').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); });
      curvesEl.hidden = v !== 'curves'; optEl.hidden = v === 'curves';
      var gvx = host.querySelector('.ca-gview') || (LS && LS.root.querySelector('.ca-gview')); if(gvx) gvx.hidden = v !== 'curves';
      if(v === 'opt' && !st.u){ st.u = sc().start; }
      buildChips(); buildSlider(); gl = null; ol = null; draw(true);
    }
    function setCurve(id){
      pause(); st.id = id; var c = cv(); st.x = c.dom[0] + (c.dom[1] - c.dom[0]) * 0.18;
      buildChips(); buildSlider(); gl = null;
      // the sign charts build themselves, left to right
      st.reveal = 0;
      anim = P.loop(function(dt, t){ st.reveal = Math.min(1, t / 1.4); drawCurves(); if(st.reveal >= 1) return false; }, { duration: 1.4, still: function(){ st.reveal = 1; }, onEnd: function(){ st.reveal = 1; draw(true); } });
      anim.start();
      draw(true);
    }
    function pause(){ if(anim) anim.stop(); if(st.reveal < 1){ st.reveal = 1; } }
    chips.addEventListener('click', function(e){
      var b = e.target.closest('.ca-chip'); if(!b) return; touch();
      if(st.view === 'curves'){ if(b.getAttribute('data-id') !== st.id) setCurve(b.getAttribute('data-id')); }
      else { st.sid = b.getAttribute('data-id'); st.u = sc().start; buildChips(); buildSlider(); ol = null; draw(true); }
    });
    var gviewEl = host.querySelector('.ca-gview');
    gviewEl.addEventListener('click', function(e){
      var b = e.target.closest('.bt-mode'); if(!b) return;
      st.gv = b.getAttribute('data-k'); touch();
      gviewEl.querySelectorAll('.bt-mode').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
      gl = null; draw(false);
    });
    if(viewsEl) viewsEl.addEventListener('click', function(e){ var b = e.target.closest('.bt-mode'); if(b && b.getAttribute('data-v') !== st.view){ touch(); setView(b.getAttribute('data-v')); } });

    /* ------------------------------------------------ the stacked graphs */
    /* On a phone one graph can have the whole stage (the switch in the
       dock), with the sign charts that go with it; elsewhere all three. */
    function phone(){ return !!(LS && LS.root && LS.root.classList.contains('ls-phone')); }
    /* Not chosen yet: all three, except on a phone on its side, where three
       graphs would be slivers: f with both sign charts. */
    function gview(){ return st.gv || (phone() && window.innerWidth > window.innerHeight ? 'f' : 'all'); }
    function rowKeys(){
      var v = phone() ? gview() : 'all';
      var gx = host.querySelector('.ca-gview') || (LS && LS.root.querySelector('.ca-gview'));
      if(gx) gx.querySelectorAll('.bt-mode').forEach(function(x){ x.setAttribute('aria-pressed', String(x.getAttribute('data-k') === gview())); });
      return v === 'f' ? ['f', 'sfp', 'sfpp'] : v === 'fp' ? ['fp', 'sfp'] : v === 'fpp' ? ['fpp', 'sfpp'] : ['f', 'fp', 'sfp', 'fpp', 'sfpp'];
    }
    function layout(){
      var c = cv(), w = Math.max(280, Math.round(gwrap.clientWidth || 600)), h = Math.max(200, Math.round(gwrap.clientHeight || 420));
      // On a phone the sign rows and the gaps are slimmer, so the three graph
      // panels get the height (they were about 130 px each; audit 2026-10).
      var ph = phone(), L = w < 420 ? 40 : 46, R = 12, T0 = ph ? 2 : 6, row = ph ? 18 : w < 420 ? 20 : 22, gap = ph ? 4 : 8, axis = ph ? 22 : 20;
      var ks = rowKeys(), WT = { f: 0.38, fp: 0.31, fpp: 0.31 }, nS = ks.filter(function(k){ return k.charAt(0) === 's'; }).length;
      var wsum = ks.reduce(function(t, k){ return t + (WT[k] || 0); }, 0), avail = h - T0 - axis - nS * row - (ks.length - 1) * gap;
      var FN = { f: c.f, fp: c.fp, fpp: c.fpp };
      var a = c.dom[0], b = c.dom[1], rows = {}, y = T0;
      ks.map(function(k){ return WT[k] ? [k, avail * WT[k] / wsum, FN[k]] : [k, row]; }).forEach(function(r){
        rows[r[0]] = { y0: y, h: r[1] }; y += r[1] + gap;
        if(r[2]){
          var lo = Infinity, hi = -Infinity;
          for(var i = 0; i <= 300; i++){ var v = r[2](a + (b - a) * i / 300); if(isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); } }
          // clip the spikes of f′ and f″ at a cusp to a readable range
          if(c.undef && r[0] !== 'f'){ var lim = r[0] === 'fp' ? 6 : 8; lo = Math.max(lo, -lim); hi = Math.min(hi, lim); }
          lo = Math.min(lo, 0); hi = Math.max(hi, 0); var pad = (hi - lo) * 0.1 || 1;
          rows[r[0]].lo = lo - pad; rows[r[0]].hi = hi + pad; rows[r[0]].fn = r[2];
        }
      });
      return { w: w, h: h, L: L, R: R, pw: w - L - R, rows: rows, ks: ks, top: rows[ks[0]].y0, bot: y - gap, a: a, b: b, axisY: y - gap + 14,
        gx: function(x){ return L + (x - a) / (b - a) * (w - L - R); },
        ix: function(px){ return a + (px - L) / (w - L - R) * (b - a); },
        gy: function(k, v){ var r = rows[k]; return r.y0 + (r.hi - v) / (r.hi - r.lo) * r.h; } };
    }
    function curvePath(g, k){
      var r = g.rows[k], fn = r.fn, n = 360, out = [], run = [];
      for(var i = 0; i <= n; i++){
        var x = g.a + (g.b - g.a) * i / n, v = fn(x);
        if(!isFinite(v) || v > r.hi + (r.hi - r.lo) * 2 || v < r.lo - (r.hi - r.lo) * 2){ if(run.length > 1) out.push(run); run = []; continue; }
        run.push(r1(g.gx(x)) + ' ' + r1(g.gy(k, clamp(v, r.lo, r.hi))));
      }
      if(run.length > 1) out.push(run);
      return out.map(function(rn){ return 'M' + rn.join('L'); }).join('');
    }
    function drawCurves(){
      if(!gl) gl = layout();
      var g = gl, c = cv(), I = info(), A = I.A, o = [], NAME = { f: 'f', fp: 'f′', fpp: 'f″' }, CLS = { f: 's1', fp: 's2', fpp: 's3' };
      gsvg.setAttribute('viewBox', '0 0 ' + g.w + ' ' + g.h);
      var xt = c.piX ? P.piTicks(g.a, g.b) : P.ticks(g.a, g.b, Math.max(4, Math.round(g.pw / 70)));
      ['f', 'fp', 'fpp'].filter(function(k){ return g.rows[k]; }).forEach(function(k){
        var r = g.rows[k];
        o.push('<rect class="ca-panel" x="' + g.L + '" y="' + r1(r.y0) + '" width="' + g.pw + '" height="' + r1(r.h) + '" rx="6"/>');
        xt.forEach(function(v){ var px = r1(g.gx(v)); o.push('<line class="ca-grid" x1="' + px + '" y1="' + r1(r.y0) + '" x2="' + px + '" y2="' + r1(r.y0 + r.h) + '"/>'); });
        P.ticks(r.lo, r.hi, 3).forEach(function(v){ var py = r1(g.gy(k, v)); o.push('<line class="ca-grid' + (Math.abs(v) < 1e-12 ? ' ca-zero' : '') + '" x1="' + g.L + '" y1="' + py + '" x2="' + (g.L + g.pw) + '" y2="' + py + '"/><text class="ca-tk" x="' + (g.L - 5) + '" y="' + (+py + 3.5) + '" text-anchor="end">' + F(v, Math.abs(v) < 10 && Math.abs(v - Math.round(v)) > 1e-9 ? 1 : 0) + '</text>'); });
        o.push('<path class="ca-curve ' + CLS[k] + '" d="' + curvePath(g, k) + '"/>');
        o.push('<text class="ca-pl ' + CLS[k] + '" x="' + (g.L + 6) + '" y="' + r1(r.y0 + 15) + '">' + NAME[k] + '</text>');
      });
      // the closed interval's endpoints on f, and the candidates' winners
      if(g.rows.f) [g.a, g.b].forEach(function(x){ o.push('<circle class="ca-end" cx="' + r1(g.gx(x)) + '" cy="' + r1(g.gy('f', c.f(x))) + '" r="4.5"/>'); });
      // sign charts, revealed left to right
      var rv = st.reveal, clipW = r1(g.pw * rv);
      o.push('<defs><clipPath id="ca-clip"><rect x="' + g.L + '" y="0" width="' + clipW + '" height="' + g.h + '"/></clipPath></defs>');
      [['sfp', A.signFp, function(s){ return s > 0 ? '+  f ↗' : '−  f ↘'; }, 'f′'], ['sfpp', A.signFpp, function(s){ return s > 0 ? '+  ∪' : '−  ∩'; }, 'f″']].filter(function(row){ return g.rows[row[0]]; }).forEach(function(row){
        var r = g.rows[row[0]], segs = row[1];
        o.push('<text class="ca-rowk" x="' + (g.L - 5) + '" y="' + r1(r.y0 + r.h / 2 + 4) + '" text-anchor="end">' + row[3] + '</text>');
        o.push('<g clip-path="url(#ca-clip)">' + segs.map(function(sg){
          var x1 = g.gx(sg.a), x2 = g.gx(sg.b), w = x2 - x1, lab = row[2](sg.s);
          return '<rect class="ca-sg ' + (sg.s > 0 ? 'is-pos' : 'is-neg') + ' ' + (row[0] === 'sfp' ? 'is-fp' : 'is-fpp') + '" x="' + r1(x1 + 1) + '" y="' + r1(r.y0) + '" width="' + r1(Math.max(1, w - 2)) + '" height="' + r.h + '" rx="5"/>' +
            (w > 34 ? '<text class="ca-sgt" x="' + r1((x1 + x2) / 2) + '" y="' + r1(r.y0 + r.h / 2 + 4) + '" text-anchor="middle">' + (w > 70 ? lab : lab.split('  ')[0]) + '</text>' : '');
        }).join('') + '</g>');
      });
      // features: critical points and inflection points
      I.feats.forEach(function(ft){
        var px = r1(g.gx(ft.x)), py = g.rows.f ? r1(g.gy('f', c.f(ft.x))) : 0;
        o.push('<line class="ca-fline" x1="' + px + '" y1="' + r1(g.rows.f ? g.rows.f.y0 + g.rows.f.h : g.top) + '" x2="' + px + '" y2="' + r1(g.bot) + '"/>');
        if(ft.type === 'crit'){
          var fy = g.rows.fp && g.gy('fp', 0); if(g.rows.fp && !ft.undef) o.push('<circle class="ca-z s2" cx="' + px + '" cy="' + r1(fy) + '" r="4"/>');
          if(!g.rows.f) return;
          o.push('<circle class="ca-crit is-' + ft.kind + '" cx="' + px + '" cy="' + py + '" r="5.5"/>');
          var absTag = Math.abs(A.absMax.x - ft.x) < 1e-9 ? ', abs max' : Math.abs(A.absMin.x - ft.x) < 1e-9 ? ', abs min' : '';
          if(A.infl.some(function(z){ return Math.abs(z - ft.x) < 1e-9; })) absTag += ' · inflection';
          // above a maximum (below a minimum); beside it when the panel's edge is too close
          var ly = ft.kind === 'min' ? +py + 17 : +py - 9, fr = g.rows.f, side = ly < fr.y0 + 12 || ly > fr.y0 + fr.h - 2, lx = +px, la = 'middle';
          if(side){ ly = +py + 4; la = px > g.L + g.pw * 0.6 ? 'end' : 'start'; lx = +px + (la === 'start' ? 10 : -10); }
          o.push('<text class="ca-flab" x="' + r1(lx) + '" y="' + r1(ly) + '" text-anchor="' + la + '">' + (ft.kind === 'max' ? 'rel max' : ft.kind === 'min' ? 'rel min' : 'neither') + absTag + '</text>');
        } else {
          if(g.rows.fpp) o.push('<circle class="ca-z s3" cx="' + px + '" cy="' + r1(g.gy('fpp', 0)) + '" r="4"/>');
          if(!g.rows.f) return;
          o.push('<rect class="ca-poi" x="' + (px - 5) + '" y="' + (py - 5) + '" width="10" height="10" transform="rotate(45 ' + px + ' ' + py + ')"/>');
          var withCrit = I.feats.some(function(f2){ return f2.type === 'crit' && Math.abs(f2.x - ft.x) < 1e-9; });
          if(!withCrit) o.push('<text class="ca-flab" x="' + px + '" y="' + r1(+py - 10) + '" text-anchor="middle">inflection</text>');
        }
      });
      // absolute extrema on the closed interval
      [['abs max', A.absMax], ['abs min', A.absMin]].filter(function(p){ return g.rows.f && p[1].role === 'endpoint'; }).forEach(function(p){
        var px = g.gx(p[1].x), py = g.gy('f', p[1].y), right = px < g.L + g.pw * 0.8, top = g.rows.f.y0, bot = top + g.rows.f.h;
        var ty = p[0] === 'abs max' ? (py < top + 24 ? py + 16 : py - 8) : (py > bot - 14 ? py - 10 : py + 16);
        o.push('<text class="ca-abs" x="' + r1(px + (right ? 8 : -8)) + '" y="' + r1(ty) + '" text-anchor="' + (right ? 'start' : 'end') + '">' + p[0] + '</text>');
      });
      // x-axis labels
      xt = xt.filter(function(v){ return g.gx(v) < g.L + g.pw - 18 || v === g.a; });
      o.push('<g class="ca-xaxis">' + xt.map(function(v){ return '<text x="' + r1(g.gx(v)) + '" y="' + r1(g.h - 5) + '" text-anchor="middle">' + (c.piX ? piLab(v) : F(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1)) + '</text>'; }).join('') + '<text class="ca-xl" x="' + (g.L + g.pw) + '" y="' + r1(g.h - 5) + '" text-anchor="end">x</text></g>');
      // cursor
      var cx = r1(g.gx(st.x));
      o.push('<line class="ca-cur" x1="' + cx + '" y1="' + r1(g.top) + '" x2="' + cx + '" y2="' + r1(g.bot) + '"/>');
      ['f', 'fp', 'fpp'].filter(function(k){ return g.rows[k]; }).forEach(function(k){ var v = g.rows[k].fn(st.x); if(isFinite(v) && v >= g.rows[k].lo && v <= g.rows[k].hi) o.push('<circle class="ca-cur-pt ' + CLS[k] + '" cx="' + cx + '" cy="' + r1(g.gy(k, v)) + '" r="5"/>'); });
      gsvg.innerHTML = o.join('');
      var vals = vals3();
      gwrap.setAttribute('aria-valuemin', String(g.a)); gwrap.setAttribute('aria-valuemax', String(g.b)); gwrap.setAttribute('aria-valuenow', M.fixed(st.x, 3));
      gwrap.setAttribute('aria-valuetext', 'x = ' + F(st.x, 2) + ': f = ' + vals.f + ', f′ = ' + vals.fp + ', f″ = ' + vals.fpp);
    }
    function piLab(v){ var k = Math.round(v / (Math.PI / 2)); if(!k) return '0'; return (k % 2 ? (k === 1 ? '' : k) + 'π/2' : (k / 2 === 1 ? '' : k / 2) + 'π'); }
    function vals3(){ var c = cv(), fmt = function(v){ return isFinite(v) ? F(v, 2) : 'undefined'; }; return { f: fmt(c.f(st.x)), fp: fmt(c.fp(st.x)), fpp: fmt(c.fpp(st.x)) }; }
    function near(){ var g = gl, I = info(); if(!g) return null; var best = null; I.feats.forEach(function(ft){ var d = Math.abs(g.gx(ft.x) - g.gx(st.x)); if(d < 9 && (!best || d < best.d)) best = { d: d, ft: ft }; }); return best && best.ft; }
    function setX(x, fromSlider){
      var c = cv(); st.x = clamp(x, c.dom[0], c.dom[1]); touch();
      // snap to a feature when within a few pixels
      var ft = near(); if(ft && !fromSlider) st.x = ft.x;
      draw(true);
    }

    /* ------------------------------------------------ optimization */
    function drawScene(){
      var s = sc(), u = st.u, o = [];
      o.push('<rect class="ca-bg" x="0" y="0" width="420" height="230"/>');
      if(s.id === 'box'){
        var W = 12, k = 13.5, sx = 18, sy = 20, side = W * k, cut = u * k;
        o.push('<rect class="ca-sheet" x="' + sx + '" y="' + sy + '" width="' + side + '" height="' + side + '"/>');
        [[sx, sy], [sx + side - cut, sy], [sx, sy + side - cut], [sx + side - cut, sy + side - cut]].forEach(function(p){ if(cut > 0.5) o.push('<rect class="ca-cut" x="' + r1(p[0]) + '" y="' + r1(p[1]) + '" width="' + r1(cut) + '" height="' + r1(cut) + '"/>'); });
        if(cut > 0.5) o.push('<rect class="ca-fold" x="' + r1(sx + cut) + '" y="' + r1(sy + cut) + '" width="' + r1(side - 2 * cut) + '" height="' + r1(side - 2 * cut) + '"/>');
        o.push('<text class="ca-st" x="' + (sx + side / 2) + '" y="' + (sy + side + 17) + '" text-anchor="middle">12 in sheet</text>');
        if(cut > 6) o.push('<text class="ca-st is-x" x="' + r1(sx + cut / 2) + '" y="' + r1(sy + cut / 2 + 4) + '" text-anchor="middle">x</text>');
        // the folded box, in oblique view
        var b = (W - 2 * u) * 12, hgt = u * 12, d = b * 0.42, ox = 196 + Math.max(0, (210 - b - d) / 2), oy = 200;
        var p = function(x, y){ return r1(x) + ' ' + r1(y); };
        if(b > 1){
          o.push('<path class="ca-box-in" d="M' + p(ox + d, oy - d * 0.6 - hgt) + 'L' + p(ox + d + b, oy - d * 0.6 - hgt) + 'L' + p(ox + d + b, oy - d * 0.6) + 'L' + p(ox + d, oy - d * 0.6) + 'Z"/>');
          o.push('<path class="ca-box-floor" d="M' + p(ox, oy) + 'L' + p(ox + b, oy) + 'L' + p(ox + b + d, oy - d * 0.6) + 'L' + p(ox + d, oy - d * 0.6) + 'Z"/>');
          o.push('<path class="ca-box-side" d="M' + p(ox, oy) + 'L' + p(ox + d, oy - d * 0.6) + 'L' + p(ox + d, oy - d * 0.6 - hgt) + 'L' + p(ox, oy - hgt) + 'Z"/>');
          o.push('<path class="ca-box-side" d="M' + p(ox + b, oy) + 'L' + p(ox + b + d, oy - d * 0.6) + 'L' + p(ox + b + d, oy - d * 0.6 - hgt) + 'L' + p(ox + b, oy - hgt) + 'Z"/>');
          o.push('<path class="ca-box-front" d="M' + p(ox, oy) + 'L' + p(ox + b, oy) + 'L' + p(ox + b, oy - hgt) + 'L' + p(ox, oy - hgt) + 'Z"/>');
          o.push('<text class="ca-st" x="' + r1(ox + b / 2) + '" y="' + (oy + 16) + '" text-anchor="middle">' + F(W - 2 * u, 2) + ' in</text>');
          o.push('<text class="ca-st is-x" x="' + r1(ox - 6) + '" y="' + r1(oy - hgt / 2 + 4) + '" text-anchor="end">x = ' + F(u, 2) + '</text>');
        }
      } else if(s.id === 'fence'){
        var kf = 340 / 240, len = (240 - 2 * u) * kf, dep = u * kf, fx = 40 + (340 - len) / 2, fy = 46;
        o.push('<rect class="ca-river" x="0" y="0" width="420" height="40"/>');
        o.push('<path class="ca-wave" d="M10 14q10 -6 20 0t20 0t20 0M150 24q10 -6 20 0t20 0t20 0M300 12q10 -6 20 0t20 0t20 0"/>');
        o.push('<rect class="ca-bank" x="0" y="40" width="420" height="190"/>');
        if(len > 1 && dep > 1){
          o.push('<rect class="ca-field" x="' + r1(fx) + '" y="' + fy + '" width="' + r1(len) + '" height="' + r1(dep) + '"/>');
          o.push('<path class="ca-fence" d="M' + r1(fx) + ' ' + fy + 'V' + r1(fy + dep) + 'H' + r1(fx + len) + 'V' + fy + '"/>');
          var posts = []; for(var q = 0; q <= 1.0001; q += 0.125){ posts.push([fx, fy + dep * q], [fx + len, fy + dep * q], [fx + len * q, fy + dep]); }
          o.push('<g class="ca-posts">' + posts.map(function(pp){ return '<circle cx="' + r1(pp[0]) + '" cy="' + r1(pp[1]) + '" r="2.2"/>'; }).join('') + '</g>');
          o.push('<text class="ca-st is-x" x="' + r1(fx - 6) + '" y="' + r1(fy + dep / 2 + 4) + '" text-anchor="end">x = ' + F(u, 0) + '</text>');
          o.push('<text class="ca-st" x="' + r1(fx + len / 2) + '" y="' + r1(Math.min(224, fy + dep + 16)) + '" text-anchor="middle">' + F(240 - 2 * u, 0) + ' m</text>');
          o.push('<text class="ca-st ca-area" x="' + r1(fx + len / 2) + '" y="' + r1(fy + dep / 2 + 4) + '" text-anchor="middle">' + (dep > 18 && len > 70 ? 'A = ' + F(s.obj(u), 0) + ' m²' : '') + '</text>');
        }
        o.push('<text class="ca-st ca-rl" x="410" y="26" text-anchor="end">river: no fence</text>');
      } else {
        var kc = 4.3, rr = u * kc, hh = 355 / (Math.PI * u * u) * kc, cx = 130, base = 212, ry = Math.max(3, rr * 0.28);
        hh = Math.min(hh, 196);
        o.push('<line class="ca-table" x1="10" y1="' + (base + 4) + '" x2="260" y2="' + (base + 4) + '"/>');
        o.push('<path class="ca-can" d="M' + r1(cx - rr) + ' ' + r1(base - hh) + 'V' + base + 'A' + r1(rr) + ' ' + r1(ry) + ' 0 0 0 ' + r1(cx + rr) + ' ' + base + 'V' + r1(base - hh) + '"/>');
        o.push('<ellipse class="ca-can-top" cx="' + cx + '" cy="' + r1(base - hh) + '" rx="' + r1(rr) + '" ry="' + r1(ry) + '"/>');
        o.push('<path class="ca-can-band" d="M' + r1(cx - rr) + ' ' + r1(base - hh * 0.62) + 'A' + r1(rr) + ' ' + r1(ry) + ' 0 0 0 ' + r1(cx + rr) + ' ' + r1(base - hh * 0.62) + 'V' + r1(base - hh * 0.38) + 'A' + r1(rr) + ' ' + r1(ry) + ' 0 0 1 ' + r1(cx - rr) + ' ' + r1(base - hh * 0.38) + 'Z"/>');
        o.push('<line class="ca-rad" x1="' + cx + '" y1="' + r1(base - hh) + '" x2="' + r1(cx + rr) + '" y2="' + r1(base - hh) + '"/>');
        o.push('<text class="ca-st is-x" x="' + r1(cx + rr / 2) + '" y="' + r1(base - hh - ry - 6) + '" text-anchor="middle">r = ' + F(u, 2) + '</text>');
        o.push('<text class="ca-st" x="' + r1(cx + rr + 10) + '" y="' + r1(base - hh / 2 + 4) + '" text-anchor="start">h = ' + F(355 / (Math.PI * u * u), 2) + ' cm</text>');
        o.push('<text class="ca-st" x="410" y="70" text-anchor="end">355 cm³</text><text class="ca-st ca-sub" x="410" y="90" text-anchor="end">every can holds</text><text class="ca-st ca-sub" x="410" y="110" text-anchor="end">the same amount</text>');
      }
      sceneSvg.innerHTML = o.join('');
      sceneSvg.setAttribute('aria-label', s.name + ': ' + s.label.toLowerCase() + ' ' + s.var + ' = ' + F(u, 2) + ' ' + s.unit + ', ' + s.what + ' ' + F(s.obj(u), 2) + ' ' + s.ounit + '.');
    }
    function drawOgraph(){
      var s = sc(), w = Math.max(280, Math.round(owrap.clientWidth || 600)), h = Math.max(150, Math.round(owrap.clientHeight || 220));
      var L = w < 420 ? 44 : 52, R = 12, T0 = 6, gap = 10, axis = 20, ph = (h - T0 - axis - gap) / 2, a = s.dom[0], b = s.dom[1], o = [];
      var gx = function(x){ return L + (x - a) / (b - a) * (w - L - R); };
      var rows = {};
      [['obj', s.obj], ['d', s.dobj]].forEach(function(r, i){
        var lo = Infinity, hi = -Infinity;
        for(var j = 0; j <= 200; j++){ var v = r[1](a + (b - a) * j / 200); if(isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); } }
        if(s.id === 'can' && r[0] === 'd'){ lo = Math.max(lo, -120); }
        lo = Math.min(lo, 0); hi = Math.max(hi, 0); var pad = (hi - lo) * 0.1 || 1;
        rows[r[0]] = { y0: T0 + i * (ph + gap), lo: lo - pad, hi: hi + pad, fn: r[1] };
      });
      var gy = function(k, v){ var r = rows[k]; return r.y0 + (r.hi - clamp(v, r.lo, r.hi)) / (r.hi - r.lo) * ph; };
      osvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      [['obj', 's1', s.sym + '(' + s.var + ')'], ['d', 's2', s.sym + '′(' + s.var + ')']].forEach(function(k){
        var r = rows[k[0]];
        o.push('<rect class="ca-panel" x="' + L + '" y="' + r1(r.y0) + '" width="' + (w - L - R) + '" height="' + r1(ph) + '" rx="6"/>');
        P.ticks(r.lo, r.hi, 3).forEach(function(v){ var py = r1(gy(k[0], v)); o.push('<line class="ca-grid' + (Math.abs(v) < 1e-12 ? ' ca-zero' : '') + '" x1="' + L + '" y1="' + py + '" x2="' + (w - R) + '" y2="' + py + '"/><text class="ca-tk" x="' + (L - 5) + '" y="' + (+py + 3.5) + '" text-anchor="end">' + F(v, 0) + '</text>'); });
        var pts = []; for(var j = 0; j <= 240; j++){ var x = a + (b - a) * j / 240; pts.push(r1(gx(x)) + ',' + r1(gy(k[0], r.fn(x)))); }
        o.push('<polyline class="ca-curve ' + k[1] + '" points="' + pts.join(' ') + '"/>');
        o.push('<text class="ca-pl ' + k[1] + '" x="' + (L + 6) + '" y="' + r1(r.y0 + 15) + '">' + k[2] + '</text>');
      });
      var bx = r1(gx(s.best));
      o.push('<line class="ca-fline" x1="' + bx + '" y1="' + T0 + '" x2="' + bx + '" y2="' + r1(T0 + 2 * ph + gap) + '"/>');
      o.push('<circle class="ca-crit is-' + (s.goal === 'max' ? 'max' : 'min') + '" cx="' + bx + '" cy="' + r1(gy('obj', s.obj(s.best))) + '" r="5"/><circle class="ca-z s2" cx="' + bx + '" cy="' + r1(gy('d', 0)) + '" r="4"/>');
      var xt = P.ticks(a, b, Math.max(4, Math.round((w - L - R) / 70))).filter(function(v){ return gx(v) < w - R - (phone() ? 50 : 34) || v === a; });
      o.push('<g class="ca-xaxis">' + xt.map(function(v){ return '<text x="' + r1(gx(v)) + '" y="' + (h - 5) + '" text-anchor="middle">' + F(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1) + '</text>'; }).join('') + (phone() ? '<text class="ca-xl" x="' + (L - 8) + '" y="' + (h - 5) + '" text-anchor="end">' + s.var + ' (' + s.unit + ')</text>' : '<text class="ca-xl" x="' + (w - R) + '" y="' + (h - 5) + '" text-anchor="end">' + s.var + ' (' + s.unit + ')</text>') + '</g>');
      var cx = r1(gx(st.u));
      o.push('<line class="ca-cur" x1="' + cx + '" y1="' + T0 + '" x2="' + cx + '" y2="' + r1(T0 + 2 * ph + gap) + '"/>');
      o.push('<circle class="ca-cur-pt s1" cx="' + cx + '" cy="' + r1(gy('obj', s.obj(st.u))) + '" r="5"/><circle class="ca-cur-pt s2" cx="' + cx + '" cy="' + r1(gy('d', s.dobj(st.u))) + '" r="5"/>');
      osvg.innerHTML = o.join('');
    }

    /* ------------------------------------------------ words */
    var lastCap = '';
    function words(full){
      var head, body, pills = [], det;
      if(st.view === 'curves'){
        var c = cv(), I = info(), A = I.A, ft = near(), fp = c.fp(st.x), fpp = c.fpp(st.x), v = vals3();
        var inc = !isFinite(fp) ? 'f′ is undefined here' : Math.abs(fp) < 1e-9 ? 'f′ = 0 here' : fp > 0 ? 'f′ > 0, so f is increasing' : 'f′ < 0, so f is decreasing';
        var cc = !isFinite(fpp) ? 'f″ is undefined' : Math.abs(fpp) < 1e-9 ? 'f″ = 0' : fpp > 0 ? 'f″ > 0, so f is concave up' : 'f″ < 0, so f is concave down';
        head = ft ? html(ft.text) : esc('At x = ' + xlabel(st.x, c) + ': ' + inc + '; ' + cc + '.');
        // Why, kept short (audit 2026-10: it ran to 200 words): the features
        // and one rule; the candidates test is a table under Formulas & numbers.
        body = '<ol class="ca-feats">' + I.feats.map(function(f2){ return '<li' + (ft === f2 ? ' class="is-on"' : '') + '>' + html(f2.text) + '</li>'; }).join('') + '</ol>' +
          '<p class="ca-rule"><b>Justify in words:</b> name the function that changes sign, from what to what, and where. No sign change, no extremum (or inflection). Absolute extrema: the candidates test, under Formulas & numbers.</p>';
        pills = narrow() || phone() ? [{ html: '<span class="ca-pk s1">f</span> ' + v.f + ' · <span class="ca-pk s2">f′</span> ' + v.fp + ' · <span class="ca-pk s3">f″</span> ' + v.fpp, tone: 'ghost' }]
          : [{ k: 'f', html: v.f, tone: 'readout' }, { k: 'f′', html: '<span class="ca-pv s2">' + v.fp + '</span>', tone: 'readout' }, { k: 'f″', html: '<span class="ca-pv s3">' + v.fpp + '</span>', tone: 'readout' }];
        det = '<h3 class="ls-title-l">' + esc(c.name) + ' on [' + xlabel(c.dom[0], c) + ', ' + xlabel(c.dom[1], c) + ']</h3><table class="ls-tbl ca-ftbl"><tbody>' +
          [['f(x)', c.tex.f], ['f′(x)', c.tex.fp], ['f″(x)', c.tex.fpp]].map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td>' + tex(r[1]) + '</td></tr>'; }).join('') + '</tbody></table>' +
          '<h3 class="ls-title-l">Candidates test</h3><table class="ls-tbl"><thead><tr><th scope="col">x</th><th scope="col">Why a candidate</th><th scope="col" class="r">f(x)</th></tr></thead><tbody>' +
          A.cand.map(function(k){ var tag = k === A.absMax ? ' <b class="ca-tag">absolute max</b>' : k === A.absMin ? ' <b class="ca-tag">absolute min</b>' : ''; return '<tr' + (tag ? ' class="hl"' : '') + '><td>' + tex(CA.xs(k.x)) + '</td><td>' + esc(k.role) + tag + '</td><td class="r">' + F(k.y, 3) + '</td></tr>'; }).join('') + '</tbody></table>' +
          '<h3 class="ls-title-l">Sign of f′ and f″</h3><table class="ls-tbl"><thead><tr><th scope="col">Interval</th><th scope="col">f′</th><th scope="col">f</th></tr></thead><tbody>' +
          A.signFp.map(function(sg){ return '<tr><td>(' + xlabel(sg.a, c) + ', ' + xlabel(sg.b, c) + ')</td><td>' + (sg.s > 0 ? '+' : '−') + '</td><td>' + (sg.s > 0 ? 'increasing' : 'decreasing') + '</td></tr>'; }).join('') + '</tbody></table>' +
          '<table class="ls-tbl"><thead><tr><th scope="col">Interval</th><th scope="col">f″</th><th scope="col">graph of f</th></tr></thead><tbody>' +
          A.signFpp.map(function(sg){ return '<tr><td>(' + xlabel(sg.a, c) + ', ' + xlabel(sg.b, c) + ')</td><td>' + (sg.s > 0 ? '+' : '−') + '</td><td>' + (sg.s > 0 ? 'concave up' : 'concave down') + '</td></tr>'; }).join('') + '</tbody></table>';
      } else {
        var s = sc(), u = st.u, d = s.dobj(u), at = Math.abs(u - s.best) < (s.dom[1] - s.dom[0]) / 120;
        // The sign is read from the value as shown (two decimals): a value that
        // rounds to 0.00 is "about 0", never "0.00 < 0".
        var dr = M.round(d, 2);
        head = at ? html(CA.sceneSentence(s)) : esc(s.sym + '′(' + F(u, 2) + ') ' + (dr > 0 ? '= ' + F(d, 2) + ' > 0: making ' + s.var + ' bigger still adds ' + s.what + '.'
          : dr < 0 ? '= ' + F(d, 2) + ' < 0: making ' + s.var + ' bigger now ' + (s.goal === 'max' ? 'loses ' : 'saves ') + s.what + '.'
          : '≈ 0: the graph of ' + s.sym + ' is flat here. A flat point is only a candidate: check the sign of ' + s.sym + '′ on each side.'));
        body = '<ol class="ca-feats"><li>' + html('Objective: $' + s.tex.obj + '$ for $' + s.var + '$ in $[' + s.dom[0] + ', ' + s.dom[1] + ']$.') + '</li><li>' + html('Its derivative: $' + s.tex.d + '$.') + '</li><li>' + html('Critical point: $' + s.var + ' \\approx ' + CA.n(s.best, 3) + '$, where $' + s.sym + '\'(' + s.var + ') = 0$.') + '</li><li class="is-on">' + html(CA.sceneSentence(s)) + '</li></ol>' +
          '<p class="ca-rule"><b>An optimization answer needs a reason it is the absolute ' + (s.goal === 'max' ? 'maximum' : 'minimum') + ':</b> the only critical point with the right sign change of the derivative, or the candidates test with the endpoints.</p>';
        pills = [{ k: s.var, html: F(u, 2) + ' ' + s.unit, tone: 'readout' }, { k: s.sym, html: F(s.obj(u), 1) + ' ' + s.ounit, tone: 'readout' }].concat(narrow() ? [] : [{ k: s.sym + '′', html: '<span class="ca-pv s2">' + F(d, 2) + '</span>', tone: 'readout' }]);
        var rows = []; for(var j = 0; j <= 6; j++){ var x = s.dom[0] + (s.dom[1] - s.dom[0]) * j / 6; rows.push([x, s.obj(x), s.dobj(x)]); }
        rows.push([s.best, s.obj(s.best), 0]); rows.sort(function(p, q){ return p[0] - q[0]; });
        det = '<h3 class="ls-title-l">' + esc(s.name) + '</h3><table class="ls-tbl ca-ftbl"><tbody><tr><th scope="row">Objective</th><td>' + tex(s.tex.obj) + '</td></tr><tr><th scope="row">Derivative</th><td>' + tex(s.tex.d) + '</td></tr></tbody></table>' +
          '<table class="ls-tbl"><thead><tr><th scope="col">' + s.var + ' (' + s.unit + ')</th><th scope="col" class="r">' + s.sym + ' (' + s.ounit + ')</th><th scope="col" class="r">' + s.sym + '′</th></tr></thead><tbody>' +
          rows.map(function(rw){ var b = Math.abs(rw[0] - s.best) < 1e-9; return '<tr' + (b ? ' class="hl"' : '') + '><td>' + F(rw[0], 3) + '</td><td class="r">' + (isFinite(rw[1]) ? F(rw[1], 3) : '—') + '</td><td class="r">' + (isFinite(rw[2]) ? F(rw[2], 3) : '—') + '</td></tr>'; }).join('') + '</tbody></table>';
      }
      T.explain($('.ca-say'), head, body.replace(/\$[^$]+\$/g, function(m){ return html(m); }));
      $('.ca-det').innerHTML = det;
      if(LS){
        if(head !== lastCap){ LS.caption(head, 'explore'); lastCap = head; }
        LS.pills(pills, 'left', 'explore');
      }
      if(full){ var tmp = document.createElement('div'); tmp.innerHTML = head; tmp.querySelectorAll('annotation').forEach(function(a){ a.remove(); }); say(tmp.textContent.replace(/\s+/g, ' ')); }
    }
    function draw(full){
      if(st.view === 'curves') drawCurves(); else { drawScene(); drawOgraph(); }
      words(full);
      if(slider){ var v = st.view === 'curves' ? st.x : st.u; if(Math.abs(slider.value() - v) > 1e-9) slider.set(v); }
    }

    /* ------------------------------------------------ the cursor */
    (function(){
      function toX(e){ var b = gsvg.getBoundingClientRect(); if(!gl) return st.x; var px = (e.clientX - b.left) * gl.w / b.width; return gl.ix(px); }
      var on = false;
      gsvg.addEventListener('pointerdown', function(e){ pause(); on = true; try{ gsvg.setPointerCapture(e.pointerId); }catch(er){} setX(toX(e)); });
      gsvg.addEventListener('pointermove', function(e){ if(on) setX(toX(e)); });
      gsvg.addEventListener('pointerup', function(){ on = false; });
      gsvg.addEventListener('pointercancel', function(){ on = false; });
      gwrap.addEventListener('keydown', function(e){
        var c = cv(), span = c.dom[1] - c.dom[0], k = e.key, d = k === 'ArrowRight' || k === 'ArrowUp' ? 1 : k === 'ArrowLeft' || k === 'ArrowDown' ? -1 : 0;
        if(k === 'Home'){ e.preventDefault(); return setX(c.dom[0], true); }
        if(k === 'End'){ e.preventDefault(); return setX(c.dom[1], true); }
        if(k === 'PageDown' || k === 'PageUp'){
          // jump to the next feature
          e.preventDefault();
          var fs = info().feats.map(function(f){ return f.x; }), nx = k === 'PageUp' ? fs.filter(function(x){ return x > st.x + 1e-9; })[0] : fs.filter(function(x){ return x < st.x - 1e-9; }).pop();
          if(nx != null){ st.x = nx; touch(); draw(true); }
          return;
        }
        if(!d) return;
        e.preventDefault(); setX(st.x + d * span / (e.shiftKey ? 20 : 200), true);
      });
    })();
    if(window.ResizeObserver){
      var ro = new ResizeObserver(function(){
        var w = Math.round(gwrap.clientWidth), h = Math.round(gwrap.clientHeight), w2 = Math.round(owrap.clientWidth), h2 = Math.round(owrap.clientHeight);
        if(st.view === 'curves' && gl && w === gl.w && h === gl.h) return;
        if(st.view !== 'curves' && ol && w2 === ol[0] && h2 === ol[1]) return;
        gl = null; ol = [w2, h2]; draw(false);
      });
      ro.observe(gwrap); ro.observe(owrap);
    }

    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'calc-ls-stage ca-ls-stage'; stage.appendChild(host.querySelector('.ca-stage'));
      s.add('stage', stage, o);
      var dock = document.createElement('div'); dock.className = 'calc-ls-dock ca-ls-dock'; dock.appendChild(host.querySelector('.ca-ctl'));
      s.add('dock', dock, o);
      var why = document.createElement('div'); why.className = 'ls-sec calc-ls-why ca-ls-why'; why.appendChild(cue.el); why.appendChild(host.querySelector('.ca-say'));
      s.add('why', why, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      var det = document.createElement('div'); det.className = 'ls-sec calc-ls-det ca-ls-det'; det.appendChild(host.querySelector('.ca-det'));
      s.add('details', det, o);
      lastCap = ''; gl = null;
      draw(true);
      if(s.mode() === 'explore' && slider) s.hint({ target: slider.input, text: 'Move the cursor, or drag across the graphs', key: 'apcalc-curve-analyzer-drag' });
    }
    buildChips(); setCurve(st.id);
    return { pause: pause, studio: studio };
  }

  /* ============================================================ test yourself */
  /* The drill figure's size in its own units: on a phone about the stage's
     size in CSS px, so its labels are drawn near their true size. */
  function figSize(w, h){
    var W = window.innerWidth || 1280, Hh = window.innerHeight || 800;
    if(W <= 640) return [340, Math.round(Math.max(260, Math.min(440, Hh * 0.62 - 90)))];
    if(W <= 999 && Hh <= 540) return [440, Math.round(Math.max(220, Math.min(300, Hh - 110)))];
    return [w, h];
  }
  function figSpec(p){
    var f = p.fig, a = f.dom[0], b = f.dom[1], n = 200, ys = [];
    for(var i = 0; i <= n; i++){ var v = f.f(a + (b - a) * i / n); if(isFinite(v)) ys.push(v); }
    var lo = Math.min(0, Math.min.apply(null, ys)), hi = Math.max(0, Math.max.apply(null, ys)), pad = (hi - lo) * 0.12 || 1;
    var cls = f.kind === 'f' || f.kind === 'obj' ? 's1' : f.kind === 'fp' ? 's2' : 's3';
    var yl = { f: 'f(x)', fp: "f′(x)", fpp: "f″(x)", obj: p.scene === 'box' ? 'V(x)' : p.scene === 'fence' ? 'A(x)' : 'S(r)' }[f.kind];
    var sz = figSize(600, 360);
    var spec = { label: f.label + ', for x from ' + CA.n(a, 2) + ' to ' + CA.n(b, 2), width: sz[0], height: sz[1], x: [a, b], y: [lo - pad, hi + pad], xLabel: p.scene === 'can' ? 'r' : 'x', yLabel: yl,
      curves: [{ fn: f.f, domain: [a, b], cls: cls, ends: f.closed ? ['closed', 'closed'] : null }], points: [] };
    if(f.pts){ spec.points = f.pts.map(function(q){ return { at: q, cls: 's2' }; }); spec.yStep = 1; spec.xStep = 1; }
    return spec;
  }
  /* Which steps are places on the figure (ApCalcTools.autoMarks): the
     student's answer is drawn on the graph, dashed, and the right one solid. */
  var MARKS = {
    incdec: { x: { z: 1 }, pick: { inc: 'band' } },
    extrema: { x: { x: 1 }, pick: { other: 'x' } },
    candidates: { y: { max: 1, min: 1 }, pick: { cand: 'x' } },
    concavity: { pick: { where: 'x' } },
    fgraph: { pick: { max: 'x', up: 'band' } },
    optimize: { x: { x: 1, r: 1 }, curve: { obj: 1 }, y: { V: 1, A: 1, S: 1 } }
  };
  var METHOD = {
    z: 'Set f′(x) = 0: each factor of f′ gives a zero. The smaller one is further left on the graph.',
    inc: 'Cut the number line at the zeros of f′, test one x in each piece, and keep the pieces where f′ > 0 (the graph of f′ is above the axis).',
    why: 'A reader wants the function named and its sign or sign change stated, on the interval or at the point.',
    x: 'Find where f′ = 0, then check how the sign of f′ changes there: + to − is a maximum, − to + a minimum.',
    other: 'At that x, read the sign of f′ just left and just right of it. No sign change means no extremum.',
    fp: 'Differentiate term by term with the power rule: x^n becomes n x^(n−1), and a constant becomes 0.',
    cand: 'The candidates are both endpoints and every critical point inside the interval.',
    max: 'Evaluate f at every candidate, then take the largest value (a value of f, not an x).',
    min: 'Evaluate f at every candidate, then take the smallest value (a value of f, not an x).',
    f2: 'Differentiate f′ once more, term by term.',
    where: 'Solve f″(x) = 0, then keep only the zeros where the graph of f″ crosses the axis (changes sign).',
    up: 'f is concave up where f′ is increasing: find the pieces where the graph of f′ rises.',
    infl: 'Count the places where the graph of f′ changes from rising to falling or back.',
    obj: 'Write the quantity from the picture (for a box: length × width × height) in terms of the one variable.',
    r: 'Set the derivative of the objective equal to 0 and solve. Check that the sign changes there.',
    V: 'Put the critical value back into the objective.',
    A: 'Put the critical value back into the objective.',
    S: 'Put the critical value back into the objective.'
  };
  function quiz(host, data){
    var fig = null, kind = '';
    T.drill(host, data, { slug: 'curve-analyzer', noun: 'drill',
      types: CA.KINDS.map(function(k){ return { value: k, label: CA.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: CA.generate, title: function(p){ return p.title; },
      extra: function(el, p, api){
        kind = p.type;
        var box = document.createElement('div'); el.appendChild(box);
        fig = T.markedFigure(box, function(){ return figSpec(p); }, 'ca-figwrap');
        var s = studioNow();
        if(s) setTimeout(function(){ s.caption(String(p.text).replace(/<\/?p[^>]*>/g, ' ').trim(), 'quiz'); }, 0);
      },
      method: function(s, p){ return s.key === 'x' && p.type === 'optimize' ? 'Set the derivative of the objective equal to 0 and solve, inside the domain.' : METHOD[s.key]; },
      onTry: function(s, t, api){
        var o = MARKS[kind] || {}; o = Object.assign({ v: api.problem.scene === 'can' ? 'r' : 'x', f: api.problem.fig.f }, o);
        return T.tryOn(function(){ return fig; }, o)(s, t);
      } });
  }
})();
