/* Limit explorer (trainer; docs/apcalc-spec.md section 6). OWNED BY THIS TOOL
   ONLY. The model is ApCalcMath.limitExplorer (tools/math/limit-explorer.js);
   math text is ApCalcTex; the frame is ApCalcTools.modes (Explore, then Test
   yourself) on the Tool Studio.

   Explore: pick a function from the gallery and zoom in on x = a (the
   slider, its - and + buttons, the mouse wheel or a pinch on the graph, or
   Play). Two tracers ride the curve toward a, one from each side, each
   with an arrow along the curve; the table of values gains a row each time
   the zoom passes a power of ten (the rows are exactly where the tracers
   pass); the continuity checklist decides each of its three conditions as
   soon as the zoom is deep enough to see it. "Fill the hole" redefines f(a)
   as the limit. Limits at infinity zoom out instead.
     stage    the graph (drawn here at the stage's real size, so text stays
              crisp) and, beside or under it, the table and the checklist
     dock     the gallery chips, the zoom, Play and Fill
     caption  what the two sides are doing right now
     Why      the reasoning for this function
     Details  the formula, every row of the table, the limits and the
              sentence that justifies the conclusion
   Test yourself: ApCalcTools.drill over the model's twelve kinds; a graph
   or table figure goes on the stage, drawn from the problem's own
   functions. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot;
  if(!T || !M || !M.limitExplorer || !P) return;
  var LE = M.limitExplorer, esc = T.esc;
  var NS = 'http://www.w3.org/2000/svg';
  function X(){ return window.ApCalcTex; }
  function tx(s){ return X() ? X().html(String(s)) : String(s); }
  function tm(t, display){ return X() ? X().render(t, { display: !!display }) : esc(t); }
  function minus(s){ return String(s).replace(/^-/, '−'); }
  function r2(v){ return Math.round(v * 100) / 100; }

  /* Text with its formulas in words, for screen readers (an option that is
     only a formula has no name otherwise). */
  function plainOf(s){ return String(s).replace(/\$\$([\s\S]*?)\$\$|\$([^$]*)\$/g, function(m, a, b){ return X() ? X().text(a || b) : (a || b); }); }
  /* Problems carry TeX between $...$; render every string the drill shows. */
  function texify(p){
    p.text = tx(p.text);
    p.solution = p.solution.map(tx);
    p.steps.forEach(function(s){
      s.label = tx(s.label);
      if(s.hint) s.hint = tx(s.hint);
      // Wrapped, so text and formulas stay one line in a flex label.
      if(s.options) s.options = s.options.map(function(o){ return /\$/.test(o) ? '<span class="le-opt" aria-hidden="true">' + tx(o) + '</span><span class="sr-only">' + esc(plainOf(o)) + '</span>' : '<span class="le-opt">' + tx(o) + '</span>'; });
      if(s.why) s.why = s.why.map(tx);
      if(s.cell && s.cell.mistakes) s.cell.mistakes.forEach(function(m){ m.why = tx(m.why); });
    });
    return p;
  }

  T.mount('limit-explorer', function(app, data){
    var ex = explorer(data);
    T.modes(app, {
      slug: 'limit-explorer',
      explore: ex.build,
      quiz: function(pane){
        T.drill(pane, data, {
          slug: 'limit-explorer', noun: 'drill', typeLabel: 'Kind of problem', textOnStage: true,
          types: LE.TYPES.map(function(t){ return { value: t.value, label: t.label }; }),
          generate: function(r, ctx, type){ return texify(LE.generate(r, ctx, type)); },
          extra: figure,
          title: function(p){ var t = LE.TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Practice problem'; }
        });
      },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } },
      onShow: function(m){ if(m === 'explore') ex.redraw(); }
    });
  });

  /* ------------------------------------------------ the drill's figure */
  function figure(host, p){
    if(!p.fig) return;
    var fig = document.createElement('figure');
    fig.className = 'cd-fig le-fig';
    host.appendChild(fig);
    if(p.fig.table){
      // Two halves side by side, each read top to bottom. A limit table's
      // halves are the two sides of a: purple from the left, orange from
      // the right.
      var tb = p.fig.table, xs = tb.cols.slice(1), ys = tb.rows[0].slice(1), A = tb.a, h = Math.ceil(xs.length / 2);
      var aT = A == null ? '' : (A < 0 ? '{' + A + '}' : String(A));
      var half = function(from, to, side){
        var cap = A == null ? '' : '<caption class="' + side + '">' + tx('$x \\to ' + aT + (side === 'l' ? '^-' : '^+') + '$') + '</caption>';
        return '<table class="le-vtab' + (side ? ' ' + side : '') + '">' + cap + '<thead><tr><th scope="col">' + tx(tb.cols[0]) + '</th><th scope="col">' + tx(tb.rows[0][0]) + '</th></tr></thead><tbody>' +
          xs.slice(from, to).map(function(x, i){ return '<tr><th scope="row">' + tx(x) + '</th><td>' + tx(ys[from + i]) + '</td></tr>'; }).join('') + '</tbody></table>';
      };
      fig.classList.add('le-tfig');
      fig.innerHTML = '<div class="le-vtabs" role="group" aria-label="Table of values">' + half(0, h, A == null ? '' : 'l') + half(h, xs.length, A == null ? '' : 'r') + '</div>';
      if(!p.fig.plot) return;
      // A table with a picture of its points (IVT): the plot beside it.
      fig.classList.add('le-fig2');
      var pf = document.createElement('div');
      pf.className = 'le-fig2-plot';
      fig.appendChild(pf);
      fig = pf;
    }
    var spec = p.fig.plot;
    // Drawn at the size it is shown, so labels keep their size.
    function fit(){
      if(!fig.isConnected) return;
      var r = fig.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
      if(fig.classList.contains('le-fig2-plot')) h = Math.min(h, Math.round(w * 0.8));
      spec.width = Math.max(240, Math.min(900, w || 420));
      spec.height = Math.max(140, Math.min(620, h > 60 ? h : spec.width * 0.66));
      fig.innerHTML = P.svg(spec);
    }
    fig.innerHTML = P.svg(spec);
    requestAnimationFrame(function(){ requestAnimationFrame(fit); });
    if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(fit, 60); }).observe(fig); }
  }

  /* ================================================== Explore */
  function explorer(data){
    var cur = LE.GALLERY[0], z = 0, filled = false, LS = null, built = false;
    var el = {}, play = null, drawn = false;

    function build(pane){
      el.pane = pane;
      // The stage: graph, table, checklist.
      el.stage = document.createElement('div');
      el.stage.className = 'le-stage';
      el.stage.innerHTML = '<div class="le-graph" role="img" aria-roledescription="graph"></div>' +
        '<div class="le-side"><div class="le-tablebox"></div><div class="le-checkbox"></div></div>';
      el.graph = el.stage.querySelector('.le-graph');
      el.table = el.stage.querySelector('.le-tablebox');
      el.check = el.stage.querySelector('.le-checkbox');
      // The dock: gallery, zoom, actions.
      el.chips = document.createElement('div');
      el.chips.className = 'le-gallery';
      el.chips.innerHTML = '<p class="le-lbl" id="le-gal-l">Function</p><div class="ls-scroll le-chips" role="group" aria-labelledby="le-gal-l">' + LE.GALLERY.map(function(g){
        return '<button type="button" class="ls-chip le-chip" data-id="' + g.id + '" aria-pressed="false">' + esc(g.short) + '</button>';
      }).join('') + '</div>';
      el.zoom = document.createElement('div');
      el.zoom.className = 'le-zoom';
      el.zoom.innerHTML = '<label class="le-lbl" for="le-z"><span class="le-zl">Zoom in on x = 1</span> <output class="le-zv" for="le-z">1×</output></label>' +
        '<div class="le-zrow"><button type="button" class="bt-step le-zb" data-d="-1" aria-label="Zoom out">−</button>' +
        '<input type="range" id="le-z" min="0" max="4" step="0.05" value="0">' +
        '<button type="button" class="bt-step le-zb" data-d="1" aria-label="Zoom in">+</button>' +
        '<button type="button" class="ls-btn ls-pri le-play" aria-label="Play the zoom"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path class="le-ic-play" d="M6 4l10 6-10 6z"/><path class="le-ic-pause" d="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z"/></svg><span class="le-play-t">Play</span></button></div>';
      el.range = el.zoom.querySelector('input');
      // Fill sits with the checklist it changes.
      el.fill = document.createElement('button');
      el.fill.type = 'button'; el.fill.className = 'ls-btn le-fill'; el.fill.hidden = true;
      el.fill.setAttribute('aria-pressed', 'false');
      el.fill.textContent = 'Fill the hole';
      el.stage.querySelector('.le-side').appendChild(el.fill);
      el.play = el.zoom.querySelector('.le-play');
      el.cue = T.cue('Drag the zoom to close in on x = 1. Watch both tracers and the table.');
      // Why and Details.
      el.why = document.createElement('div');
      el.why.className = 'le-why';
      el.det = document.createElement('div');
      el.det.className = 'le-det';
      el.say = document.createElement('p');
      el.say.className = 'sr-only';
      el.say.setAttribute('aria-live', 'polite');
      [el.cue.el, el.stage, el.chips, el.zoom, el.why, el.det, el.say].forEach(function(x){ pane.appendChild(x); });
      wire();
      select(LE.GALLERY[0].id, true);
      built = true;
    }

    /* Tool Studio: stage, dock, Why, Details. */
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [el.stage], dock: [el.chips, el.zoom], why: [el.why], details: [el.det] });
      if(s.mode() === 'explore') s.hint({ target: el.range, text: 'Drag to zoom in' });
      render(true);
      redraw();
    }

    function wire(){
      el.chips.addEventListener('click', function(e){ var b = e.target.closest('.le-chip'); if(b) select(b.getAttribute('data-id')); });
      el.range.addEventListener('input', function(){ stopPlay(); setZ(+el.range.value); });
      el.zoom.querySelectorAll('.le-zb').forEach(function(b){
        b.addEventListener('click', function(){ stopPlay(); setZ(Math.round((z + (+b.getAttribute('data-d')) * 0.5) * 2) / 2); });
      });
      el.play.addEventListener('click', function(){ if(play && play.running()) stopPlay(); else startPlay(); });
      el.fill.addEventListener('click', function(){ filled = !filled; el.fill.setAttribute('aria-pressed', String(filled)); el.fill.textContent = filled ? 'Undo' : cur.id === 'move' ? 'Move the point to the limit' : 'Fill the hole'; el.cue.done(); render(true); });
      // Mouse wheel and pinch zoom on the graph.
      el.graph.addEventListener('wheel', function(e){ e.preventDefault(); stopPlay(); setZ(z - Math.sign(e.deltaY) * Math.min(0.25, Math.abs(e.deltaY) / 400)); }, { passive: false });
      var pts = {}, base = null;
      function dist(){ var k = Object.keys(pts); if(k.length < 2) return 0; var a = pts[k[0]], b = pts[k[1]]; return Math.hypot(a[0] - b[0], a[1] - b[1]); }
      el.graph.addEventListener('pointerdown', function(e){ pts[e.pointerId] = [e.clientX, e.clientY]; if(Object.keys(pts).length === 2){ base = { d: dist(), z: z }; stopPlay(); } });
      el.graph.addEventListener('pointermove', function(e){
        if(!pts[e.pointerId]) return;
        pts[e.pointerId] = [e.clientX, e.clientY];
        if(base && base.d > 10){ var d = dist(); if(d > 0) setZ(base.z + Math.log10(d / base.d) * 1.5); }
      });
      function up(e){ delete pts[e.pointerId]; if(Object.keys(pts).length < 2) base = null; }
      el.graph.addEventListener('pointerup', up); el.graph.addEventListener('pointercancel', up); el.graph.addEventListener('pointerleave', up);
      // The layout follows the stage's own width (a Why drawer narrows it):
      // wide = graph beside the table; compact = one table row, one-line checklist.
      function fitStage(){
        var w = el.stage.getBoundingClientRect().width;
        if(!w) return;
        el.stage.classList.toggle('le-wide', w >= 700);
        el.stage.classList.toggle('le-compact', w < 520);
      }
      if(window.ResizeObserver){
        var t = null;
        new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 40); }).observe(el.graph);
        new ResizeObserver(fitStage).observe(el.stage);
      } else window.addEventListener('resize', function(){ fitStage(); draw(); });
      requestAnimationFrame(fitStage);
    }
    function startPlay(){
      if(z >= 3.99) setZ(0);
      var z0 = z, dur = (4 - z0) * 1.1 + 0.3;
      el.cue.done();
      el.play.classList.add('is-on'); el.play.setAttribute('aria-label', 'Pause'); el.play.querySelector('.le-play-t').textContent = 'Pause';
      play = P.loop(function(dt, t){ setZ(Math.min(4, z0 + (4 - z0) * Math.min(1, t / dur))); }, { duration: dur, onEnd: function(){ setZ(4); stopPlay(); } });
      play.start();
    }
    function stopPlay(){ if(play){ play.stop(); play = null; } if(el.play){ el.play.classList.remove('is-on'); el.play.setAttribute('aria-label', 'Play the zoom'); el.play.querySelector('.le-play-t').textContent = 'Play'; } }
    function setZ(v){
      z = Math.max(0, Math.min(4, v));
      el.range.value = String(M.round(z, 2));
      el.cue.done();
      render(false);
    }
    function select(id, quiet){
      stopPlay();
      cur = LE.entry(id) || LE.GALLERY[0]; filled = false; z = 0; el.range.value = '0';
      el.chips.querySelectorAll('.le-chip').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-id') === cur.id)); });
      var fill = el.fill;
      fill.hidden = cur.fill == null;
      fill.setAttribute('aria-pressed', 'false');
      fill.textContent = cur.id === 'move' ? 'Move the point to the limit' : 'Fill the hole';
      var inf = cur.a === 'inf', at = inf ? '' : 'x = ' + cur.a;
      el.zoom.querySelector('.le-zl').textContent = inf ? 'Zoom out toward ±∞' : 'Zoom in on ' + at;
      el.range.setAttribute('aria-label', inf ? 'Zoom out toward plus and minus infinity' : 'Zoom in on ' + at);
      el.cue.el.querySelector('.bt-cue-t').textContent = inf ? 'Drag the zoom to look further and further out. Watch where both ends level off.' : 'Drag the zoom to close in on ' + at + '. Watch both tracers and the table.';
      render(true);
      if(!quiet) el.cue.done();
    }

    /* ------------------------------------------------ number text */
    function fmtX(x, k){
      if(cur.a === 'inf') return minus(Math.abs(x) >= 1000 ? String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(x));
      return minus(M.fixed(x, Math.max(0, k)));
    }
    function fmtY(y, k){
      if(!isFinite(y)) return 'undefined';
      if(Math.abs(y) >= 1e4) return minus(String(Math.round(y)).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
      var d = Math.abs(y) >= 10 ? 2 : cur.kind === 'oscillating' ? 4 : Math.min(6, k + 2);
      return minus(M.fixed(y, Math.max(3, d)));
    }
    function limText(v){ return v === Infinity ? '∞' : v === -Infinity ? '−∞' : isNaN(v) ? 'no single value' : minus(LE.tn(v).replace(/\\frac\{(\d+)\}\{(\d+)\}/, '$1/$2')); }

    /* ------------------------------------------------ the state, in words */
    function state(){
      var ck = LE.check(cur, filled), deep = z >= 1.95, inf = cur.a === 'inf';
      var a = inf ? null : cur.a, v = LE.view(cur, z), h = v.h;
      var yl = inf ? cur.f(-h) : cur.f(a - h), yr = inf ? cur.f(h) : cur.f(a + h);
      return { ck: ck, deep: deep, inf: inf, a: a, v: v, h: h, yl: yl, yr: yr };
    }
    function caption(st){
      var e = cur, L = st.ck.limit;
      if(st.inf) return st.deep ? '<b>Both ends level off at y = ' + limText(e.hasym) + '.</b> lim f(x) = ' + limText(e.hasym) + ' as x → ∞ and as x → −∞.' : 'Zoom out: as |x| grows, f(x) gets closer and closer to one height.';
      if(!st.deep) return 'Left ≈ ' + fmtY(st.yl, 1) + ', right ≈ ' + fmtY(st.yr, 1) + '. Keep zooming in.';
      if(e.kind === 'oscillating') return '<b>No limit.</b> The values keep swinging between −1 and 1, however close you get.';
      if(e.kind === 'infinite') return '<b>No finite limit.</b> f(x) → −∞ from the left and +∞ from the right: a vertical asymptote.';
      if(!L.exists) return '<b>No limit.</b> The left side heads for ' + limText(L.left) + ', the right for ' + limText(L.right) + '.';
      return '<b>The limit is ' + limText(L.two) + '.</b> Both sides head for ' + limText(L.two) + (st.ck.defined ? (st.ck.equal ? ', and f(' + st.a + ') = ' + limText(st.ck.value) + ' too.' : ', but f(' + st.a + ') = ' + limText(st.ck.value) + '.') : ', though f(' + st.a + ') is not defined.');
    }
    var TYPE_WORD = { continuous: 'Continuous', removable: 'Removable discontinuity', jump: 'Jump discontinuity', infinite: 'Infinite discontinuity', oscillating: 'Oscillating: no limit' };

    function render(fresh){
      var st = state();
      el.zoom.querySelector('.le-zv').textContent = LE.zoomLabel(z);
      el.range.setAttribute('aria-valuetext', LE.zoomLabel(z));
      draw(st);
      table(st);
      checklist(st);
      if(fresh || !el.whyDone || el.whyDone !== cur.id + filled){ why(st); details(st); el.whyDone = cur.id + filled; }
      else details(st, true);
      var cap = caption(st);
      if(LS){
        LS.caption(cap, 'explore');
        LS.pills([], 'left', 'explore');
      } else el.say.innerHTML = cap;
    }

    /* ------------------------------------------------ the graph */
    /* Ticks at 1, 2 or 5 times a power of ten, with the decimals that step needs. */
    function niceTicks(a, b, n){
      var raw = (b - a) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
      var st = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p, out = [];
      for(var k = Math.ceil(a / st - 1e-9); k * st <= b + 1e-9 * st; k++) out.push(k * st);
      return { ticks: out, d: Math.max(0, -Math.floor(Math.log10(st) + 1e-9)) };
    }
    function draw(st){
      if(!el.graph || !el.graph.isConnected) return;
      st = st && st.ck ? st : state();
      var box = el.graph.getBoundingClientRect(), W = Math.round(box.width), H = Math.round(box.height);
      if(W < 50 || H < 50){ W = W < 50 ? 560 : W; H = H < 50 ? Math.round(W * 0.62) : H; }
      var v = st.v, e = cur, inf = st.inf, small = W < 480;
      // Where the y window follows the zoom (a curve through a point), keep
      // the picture's proportions: one unit of y about as long as one of x.
      if(!inf && (e.kind === 'removable') && st.ck.limit.exists){
        var asp = (H - 44) / Math.max(1, W - 70), hw = (v.x[1] - v.x[0]) / 2, yc = (v.y[0] + v.y[1]) / 2, hy = Math.max((v.y[1] - v.y[0]) / 2, hw * asp);
        v = { x: v.x, y: [yc - hy, yc + hy], h: v.h };
      }
      var xs = niceTicks(v.x[0], v.x[1], Math.max(4, Math.floor(W / (small ? 64 : 90)))), ys = niceTicks(v.y[0], v.y[1], Math.max(4, Math.floor(H / (H < 260 ? 34 : 55))));
      var xt = xs.ticks, yt = ys.ticks;
      var big = function(t){ return minus(String(Math.round(t)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')); };
      var ylab = function(y){ return Math.abs(y) >= 1e4 ? big(y) : minus(M.fixed(y, ys.d)); };
      var xlab = function(x){ return Math.abs(x) >= 1e4 ? big(x) : minus(M.fixed(x, xs.d)); };
      var padL = 14 + 7.2 * Math.max.apply(null, yt.map(function(y){ return ylab(y).length; })), padR = 14, padT = 14, padB = 30;
      var iw = W - padL - padR, ih = H - padT - padB;
      var sx = function(x){ return padL + (x - v.x[0]) / (v.x[1] - v.x[0]) * iw; };
      var sy = function(y){ return padT + (v.y[1] - y) / (v.y[1] - v.y[0]) * ih; };
      var F = { x: v.x, y: v.y, sx: sx, sy: sy };
      var o = [];
      o.push('<defs><clipPath id="le-clip"><rect x="' + padL + '" y="' + padT + '" width="' + iw + '" height="' + ih + '"/></clipPath>' +
        '<marker id="le-ah-l" viewBox="0 0 10 10" refX="7" refY="5" markerUnits="userSpaceOnUse" markerWidth="15" markerHeight="15" orient="auto"><path class="le-ah l" d="M0 0L10 5L0 10z"/></marker>' +
        '<marker id="le-ah-r" viewBox="0 0 10 10" refX="7" refY="5" markerUnits="userSpaceOnUse" markerWidth="15" markerHeight="15" orient="auto"><path class="le-ah r" d="M0 0L10 5L0 10z"/></marker></defs>');
      // grid
      o.push('<g class="le-grid">' + xt.map(function(x){ return '<line x1="' + r2(sx(x)) + '" y1="' + padT + '" x2="' + r2(sx(x)) + '" y2="' + (padT + ih) + '"/>'; }).join('') +
        yt.map(function(y){ return '<line x1="' + padL + '" y1="' + r2(sy(y)) + '" x2="' + (padL + iw) + '" y2="' + r2(sy(y)) + '"/>'; }).join('') + '</g>');
      // axes: y = 0 and x = 0 where in view, else the frame edges
      var ax = v.y[0] <= 0 && v.y[1] >= 0 ? sy(0) : null, ay = v.x[0] <= 0 && v.x[1] >= 0 ? sx(0) : null;
      o.push('<rect class="le-frame" x="' + padL + '" y="' + padT + '" width="' + iw + '" height="' + ih + '"/>');
      o.push('<g class="le-axis">' + (ax != null ? '<line x1="' + padL + '" y1="' + r2(ax) + '" x2="' + (padL + iw) + '" y2="' + r2(ax) + '"/>' : '') + (ay != null ? '<line x1="' + r2(ay) + '" y1="' + padT + '" x2="' + r2(ay) + '" y2="' + (padT + ih) + '"/>' : '') + '</g>');
      o.push('<g class="le-ticks">' + xt.map(function(x){ return '<text x="' + r2(sx(x)) + '" y="' + (padT + ih + 18) + '" text-anchor="middle">' + xlab(x) + '</text>'; }).join('') +
        yt.map(function(y){ return '<text x="' + (padL - 6) + '" y="' + r2(sy(y) + 4) + '" text-anchor="end">' + ylab(y) + '</text>'; }).join('') + '</g>');
      var g = ['<g clip-path="url(#le-clip)">'];
      // guides: x = a, y = L (or both one-sided heights), asymptotes
      if(!inf) g.push('<line class="le-guide" x1="' + r2(sx(e.a)) + '" y1="' + padT + '" x2="' + r2(sx(e.a)) + '" y2="' + (padT + ih) + '"/>');
      [e.left, e.right].filter(function(y, i, arr){ return isFinite(y) && arr.indexOf(y) === i; }).forEach(function(y){ if(!e.hasym) g.push('<line class="le-guide h" x1="' + padL + '" y1="' + r2(sy(y)) + '" x2="' + (padL + iw) + '" y2="' + r2(sy(y)) + '"/>'); });
      if(e.hasym != null) g.push('<line class="le-asym" x1="' + padL + '" y1="' + r2(sy(e.hasym)) + '" x2="' + (padL + iw) + '" y2="' + r2(sy(e.hasym)) + '"/>');
      if(e.vasym != null) g.push('<line class="le-asym" x1="' + r2(sx(e.vasym)) + '" y1="' + padT + '" x2="' + r2(sx(e.vasym)) + '" y2="' + (padT + ih) + '"/>');
      // squeeze bounds
      if(e.bounds) e.bounds.forEach(function(b){ g.push('<path class="le-bound" d="' + pathOf(P.sample(b, v.x[0], v.x[1], F, 80), sx, sy) + '"/>'); });
      // the curve
      if(e.dense){
        // sin(1/x) has period about 2πx² near 0: where that is under four
        // pixels the swings cannot be drawn one by one, so that strip is a
        // band between the curve's bounds (−1 and 1, or ±|x|) and the curve
        // is drawn sample by sample outside it.
        var px = (v.x[1] - v.x[0]) / iw, xc = Math.sqrt(4 * px / (2 * Math.PI)), lo = e.bounds ? e.bounds[0] : function(){ return -1; }, hi = e.bounds ? e.bounds[1] : function(){ return 1; };
        var band = [], bk = 60, i;
        for(i = 0; i <= bk; i++){ var bx = e.a - xc + 2 * xc * i / bk; band.push(r2(sx(bx)) + ',' + r2(sy(hi(bx)))); }
        for(i = bk; i >= 0; i--){ var bx2 = e.a - xc + 2 * xc * i / bk; band.push(r2(sx(bx2)) + ',' + r2(sy(lo(bx2)))); }
        g.push('<polygon class="le-band" points="' + band.join(' ') + '"/>');
        var bw = sx(Math.min(v.x[1], e.a + xc)) - sx(Math.max(v.x[0], e.a - xc));
        if(bw > 150) g.push('<text class="le-bandlabel" x="' + r2(sx(e.a)) + '" y="' + r2(Math.max(padT + 16, sy(hi(e.a + Math.min(xc, v.x[1] - e.a) * 0.9)) - 8)) + '" text-anchor="middle">too many swings to draw one by one</text>');
        var seg = function(x0, x1){
          if(x1 <= x0) return '';
          var m = Math.min(4000, Math.ceil((x1 - x0) / px * 3)), d = [];
          for(var j = 0; j <= m; j++){ var x = x0 + (x1 - x0) * j / m, y = e.f(x); if(isFinite(y)) d.push(r2(sx(x)) + ' ' + r2(sy(y))); }
          return d.length > 1 ? 'M' + d.join('L') : '';
        };
        g.push('<path class="le-curve" d="' + seg(v.x[0], e.a - xc) + seg(e.a + xc, v.x[1]) + '"/>');
      } else {
        g.push('<path class="le-curve" d="' + pathOf(P.sample(e.f, v.x[0], v.x[1], F, Math.max(300, W)), sx, sy) + '"/>');
      }
      // the trails: an arrow along the curve to each tracer
      var h = v.h;
      var trail = function(x0, x1, cls){
        var pts = [], k = e.dense ? 240 : 40;
        for(var i = 0; i <= k; i++){ var x = x0 + (x1 - x0) * i / k, y = e.f(x); if(isFinite(y)) pts.push([x, y]); }
        if(pts.length < 2) return '';
        var sp = pts.map(function(q){ return [sx(q[0]), sy(Math.max(v.y[0] - (v.y[1] - v.y[0]), Math.min(v.y[1] + (v.y[1] - v.y[0]), q[1])))]; });
        // Stop 11 px short of the tracer, so the arrowhead shows in front of it.
        var cut = 11, end = sp[sp.length - 1];
        while(sp.length > 2 && Math.hypot(sp[sp.length - 2][0] - end[0], sp[sp.length - 2][1] - end[1]) < cut) sp.pop();
        var q0 = sp[sp.length - 2], d = Math.hypot(end[0] - q0[0], end[1] - q0[1]);
        if(d > cut){ sp[sp.length - 1] = [end[0] - (end[0] - q0[0]) * cut / d, end[1] - (end[1] - q0[1]) * cut / d]; }
        else sp.pop();
        if(sp.length < 2) return '';
        return '<path class="le-trail ' + cls + '" marker-end="url(#le-ah-' + cls + ')" d="M' + sp.map(function(q){ return r2(q[0]) + ' ' + r2(q[1]); }).join('L') + '"/>';
      };
      var xl = inf ? -h : e.a - h, xr = inf ? h : e.a + h;
      if(e.dense){
        // A wild curve: the arrows run along a strip above the bottom edge.
        var yb = padT + ih - 12, arrow = function(x0, x1, cls){ var a0 = sx(x0), a1 = sx(x1) + (x1 > x0 ? -9 : 9); return '<path class="le-trail flat ' + cls + '" marker-end="url(#le-ah-' + cls + ')" d="M' + r2(a0) + ' ' + yb + 'L' + r2(a1) + ' ' + yb + '"/><line class="le-drop ' + cls + '" x1="' + r2(sx(x1)) + '" y1="' + yb + '" x2="' + r2(sx(x1)) + '" y2="' + r2(Math.max(padT, Math.min(padT + ih, sy(cur.f(x1))))) + '"/>'; };
        g.push(arrow(Math.max(v.x[0], e.a - 2.4 * h), e.a - h, 'l'), arrow(Math.min(v.x[1], e.a + 2.4 * h), e.a + h, 'r'));
      }
      else if(inf){ g.push(trail(-h * 0.35, xl, 'l'), trail(h * 0.35, xr, 'r')); }
      else { g.push(trail(Math.max(v.x[0], e.a - 2.4 * h), xl, 'l'), trail(Math.min(v.x[1], e.a + 2.4 * h), xr, 'r')); }
      g.push('</g>');
      o = o.concat(g);
      // points at x = a
      var ck = st.ck, val = ck.value, L = ck.limit, inY = function(y){ return y >= v.y[0] && y <= v.y[1]; };
      if(!inf){
        var dots = [];
        if(e.kind === 'jump'){ dots.push([e.left, true]); dots.push([e.right, false]); }
        else if(isFinite(L.two) && !(val != null && Math.abs(val - L.two) < 1e-12)) dots.push([L.two, true]);
        if(val != null && !(e.kind === 'jump' && val === e.right)) dots.push([val, false]);
        if(e.kind === 'jump') dots[1][1] = false;
        dots.forEach(function(d){
          if(inY(d[0])) o.push('<circle class="le-pt' + (d[1] ? ' is-open' : '') + '" cx="' + r2(sx(e.a)) + '" cy="' + r2(sy(d[0])) + '" r="5.5"/>');
          else if(!d[1]){
            // f(a) is off the window: say where it went
            var up = d[0] > v.y[1], yy = up ? padT + 4 : padT + ih - 4;
            o.push('<g class="le-off"><path d="M' + r2(sx(e.a) - 6) + ' ' + r2(yy + (up ? 9 : -9)) + 'L' + r2(sx(e.a)) + ' ' + r2(yy) + 'L' + r2(sx(e.a) + 6) + ' ' + r2(yy + (up ? 9 : -9)) + '"/><text x="' + r2(sx(e.a) + 10) + '" y="' + r2(yy + (up ? 12 : -4)) + '">f(' + e.a + ') = ' + limText(d[0]) + (up ? ' (above)' : ' (below)') + '</text></g>');
          }
        });
      }
      // tracers
      [[xl, cur.f(xl), 'l'], [xr, cur.f(xr), 'r']].forEach(function(q){
        if(isFinite(q[1]) && inY(q[1]) && q[0] > v.x[0] && q[0] < v.x[1]) o.push('<circle class="le-tracer ' + q[2] + '" cx="' + r2(sx(q[0])) + '" cy="' + r2(sy(q[1])) + '" r="7"/>');
      });
      // labels
      o.push('<text class="le-axlabel" x="' + (padL + iw - 4) + '" y="' + (padT + ih - 6) + '" text-anchor="end">x</text>');
      if(e.bounds){ o.push('<text class="le-blabel" x="' + r2(sx(v.x[1]) - 6) + '" y="' + r2(sy(Math.abs(v.x[1])) + 16) + '" text-anchor="end">y = |x|</text><text class="le-blabel" x="' + r2(sx(v.x[1]) - 6) + '" y="' + r2(sy(-Math.abs(v.x[1])) - 8) + '" text-anchor="end">y = −|x|</text>'); }
      if(e.hasym != null) o.push('<text class="le-blabel" x="' + (padL + 8) + '" y="' + r2(sy(e.hasym) - 7) + '">y = ' + e.hasym + '</text>');
      var label = (cur.name + '. ' + (inf ? 'Window from x = ' + xlab(v.x[0]) + ' to ' + xlab(v.x[1]) : 'Zoomed ' + LE.zoomLabel(z) + ' on x = ' + e.a + ', window from ' + xlab(v.x[0]) + ' to ' + xlab(v.x[1])) + '. Left tracer at x = ' + xlab(xl) + ', f = ' + fmtY(st.yl, 3) + '; right tracer at x = ' + xlab(xr) + ', f = ' + fmtY(st.yr, 3) + '.').replace(/−/g, 'minus ');
      el.graph.setAttribute('aria-label', label);
      el.graph.innerHTML = '<svg class="le-svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true" focusable="false">' + o.join('') + '</svg>';
      drawn = true;
    }
    function pathOf(runs, sx, sy){ return runs.map(function(r){ return 'M' + r.map(function(p){ return r2(sx(p[0])) + ' ' + r2(sy(p[1])); }).join('L'); }).join(''); }

    /* ------------------------------------------------ the table */
    function rowsHtml(rows, all){
      var inf = cur.a === 'inf', near = Math.round(z);
      return '<table class="le-tab"><caption class="sr-only">Values of f approaching ' + (inf ? 'plus and minus infinity' : 'x = ' + cur.a + ' from each side') + '</caption><thead><tr>' +
        '<th scope="col" class="l">x</th><th scope="col" class="l">f(x)</th><th scope="col" class="r">x</th><th scope="col" class="r">f(x)</th></tr></thead><tbody>' +
        rows.map(function(r, i){
          var k = inf ? 0 : r.k, now = Math.min(near + (inf ? 1 : 0), rows.length - 1);
          var cls = all ? '' : i === now ? ' class="is-now"' : i === now - 1 ? ' class="is-prev"' : '';
          return '<tr' + cls + '><td class="l">' + fmtX(r.xl, k) + '</td><td class="l v">' + fmtY(r.fl, k) + '</td><td class="r">' + fmtX(r.xr, k) + '</td><td class="r v">' + fmtY(r.fr, k) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }
    function table(st){
      var rows = LE.rows(cur, z), inf = st.inf;
      el.table.innerHTML = '<p class="le-th"><span class="le-pdot l" aria-hidden="true"></span>' + (inf ? 'x → −∞' : 'From the left') + '<span class="le-th-r"><span class="le-pdot r" aria-hidden="true"></span>' + (inf ? 'x → ∞' : 'From the right') + '</span></p>' + rowsHtml(rows, false);
    }

    /* ------------------------------------------------ the checklist */
    function checklist(st){
      if(st.inf){
        el.check.innerHTML = '<p class="le-ch-h">End behavior</p><ul class="le-check">' +
          '<li class="' + (st.deep ? 'yes' : 'wait') + '"><span class="le-tk" aria-hidden="true"></span><span>lim<sub>x→∞</sub> f(x)</span><b>' + (st.deep ? limText(cur.right) : 'zoom out') + '</b></li>' +
          '<li class="' + (st.deep ? 'yes' : 'wait') + '"><span class="le-tk" aria-hidden="true"></span><span>lim<sub>x→−∞</sub> f(x)</span><b>' + (st.deep ? limText(cur.left) : 'zoom out') + '</b></li></ul>' +
          '<p class="le-verdict' + (st.deep ? ' is-on' : '') + '">' + (st.deep ? 'Horizontal asymptote y = ' + cur.hasym : 'Zoom out to 100× to decide') + '</p>';
        return;
      }
      var ck = st.ck, a = cur.a, deep = st.deep;
      var item = function(state, txt, ans, short){ return '<li class="' + state + '"><span class="le-tk" aria-hidden="true"></span><span class="le-full">' + txt + '</span><span class="le-short" aria-hidden="true">' + short + '</span><b>' + ans + '<span class="sr-only">' + (state === 'yes' ? ' (condition holds)' : state === 'no' ? ' (condition fails)' : '') + '</span></b></li>'; };
      var s1 = ck.defined ? 'yes' : 'no', s2 = !deep ? 'wait' : ck.exists ? 'yes' : 'no', s3 = !deep || !ck.defined || !ck.exists ? (deep && (!ck.defined || !ck.exists) ? 'skip' : 'wait') : ck.equal ? 'yes' : 'no';
      el.check.innerHTML = '<p class="le-ch-h">Continuous at x = ' + a + '?</p><ol class="le-check">' +
        item(s1, 'f(' + a + ') is defined', ck.defined ? '= ' + limText(ck.value) : 'no', 'defined') +
        item(s2, 'the limit exists', !deep ? 'zoom in' : ck.exists ? '= ' + limText(ck.limit.two) : 'no', 'limit') +
        item(s3, 'they are equal', s3 === 'wait' ? 'zoom in' : s3 === 'skip' ? '—' : ck.equal ? 'yes' : 'no', 'equal') + '</ol>' +
        '<p class="le-verdict' + (deep ? ' is-on ' + (ck.continuous ? 'good' : 'bad') : '') + '">' + (deep ? TYPE_WORD[ck.type] + (filled ? ' (filled)' : '') : 'Zoom in to 100× to decide') + '</p>';
    }

    /* ------------------------------------------------ Why and Details */
    function why(st){
      var e = cur, ck = st.ck, a = e.a;
      var rule = e.a === 'inf' ? '<p>A limit at infinity asks where f(x) heads as x grows without bound. For a rational function, compare the highest powers on top and bottom.</p>'
        : '<p>The limit as x → ' + a + ' depends only on values of f near ' + a + ', never on f(' + a + ') itself. It exists when the limit from the left and the limit from the right are the same number.</p>';
      var fillTxt = e.fill != null ? '<p>' + (e.id === 'move' ? 'Press “Move the point to the limit”' : 'Press “Fill the hole”') + ' to redefine f(' + a + ') = ' + limText(e.fill) + '. Then all three conditions hold: the discontinuity was removable.</p>' : '';
      T.explain(el.why, '<b>' + esc(e.name) + '.</b> ' + esc(e.say), rule + fillTxt + (e.bounds ? '<p>The squeeze theorem: if g(x) ≤ f(x) ≤ h(x) near a and g and h have the same limit L there, f has limit L too.</p>' : '') +
        (e.kind === 'oscillating' ? '<p>A table can fool you here: at x = 1/π, 1/(2π), 1/(3π), … every value is exactly 0. Other x values near 0 give 1 or −1. The graph shows the truth: no single height.</p>' : ''));
      if(LS) LS.why && el.why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
    }
    function justify(st){
      var e = cur, ck = st.ck, a = e.a;
      if(st.inf) return 'Since the leading terms of the top and bottom are 2x² and x², lim f(x) = 2 as x → ∞ and as x → −∞, so y = 2 is a horizontal asymptote.';
      if(ck.continuous) return 'f(' + a + ') = ' + limText(ck.value) + ' and lim f(x) = ' + limText(ck.limit.two) + ' as x → ' + a + ', so lim f(x) = f(' + a + ') and f is continuous at x = ' + a + '.';
      if(!ck.defined) return 'f is not continuous at x = ' + a + ' because f(' + a + ') is not defined.';
      if(!ck.exists) return 'f is not continuous at x = ' + a + ' because lim f(x) as x → ' + a + ' does not exist (the one-sided limits are ' + limText(e.left) + ' and ' + limText(e.right) + ').';
      return 'f is not continuous at x = ' + a + ' because lim f(x) = ' + limText(ck.limit.two) + ' as x → ' + a + ' but f(' + a + ') = ' + limText(ck.value) + '.';
    }
    function details(st, onlyTable){
      var e = cur;
      if(!onlyTable || !el.det.firstChild){
        el.det.innerHTML = '<h3 class="ls-title-l">The function</h3><div class="le-formula">' + tm(e.tex, true) + '</div>' +
          (e.fill != null && filled ? '<p class="bt-small">Filled: f(' + e.a + ') is now defined as ' + limText(e.fill) + '.</p>' : '') +
          '<h3 class="ls-h">The limits</h3><table class="ls-tbl le-lims"><tbody>' +
          (st.inf ? '<tr><th scope="row">as x → −∞</th><td>' + limText(e.left) + '</td></tr><tr><th scope="row">as x → ∞</th><td>' + limText(e.right) + '</td></tr>'
            : '<tr><th scope="row">from the left, x → ' + e.a + '⁻</th><td>' + limText(e.left) + '</td></tr><tr><th scope="row">from the right, x → ' + e.a + '⁺</th><td>' + limText(e.right) + '</td></tr>' +
              '<tr><th scope="row">two-sided</th><td>' + (st.ck.limit.exists ? limText(st.ck.limit.two) : 'does not exist') + '</td></tr><tr><th scope="row">f(' + e.a + ')</th><td>' + (st.ck.defined ? limText(st.ck.value) : 'not defined') + '</td></tr>') +
          '</tbody></table><h3 class="ls-h">How to say it</h3><p class="le-just"></p><h3 class="ls-h">Every row of the table so far</h3><div class="le-dtab"></div>';
      }
      el.det.querySelector('.le-just').textContent = justify(st);
      el.det.querySelector('.le-dtab').innerHTML = rowsHtml(LE.rows(cur, z), true);
    }

    function redraw(){ if(built) requestAnimationFrame(function(){ draw(); }); }
    return { build: build, studio: studio, redraw: redraw };
  }
})();
