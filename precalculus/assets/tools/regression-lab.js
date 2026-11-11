/* Regression lab (simulator, Premium; docs/apprecalc-spec.md section 6). OWNED
   BY THIS TOOL ONLY (builder T1, docs/apprecalc-briefs/t1.md). Model:
   ApPrecalcMath.regressionLab (precalculus/assets/tools/math/regression-lab.js);
   frame: ApPrecalcTools.modes and drill on the Tool Studio.

   Explore: a data set as a scatter, the chosen model's least-squares fit
   through it in the course green, each residual a short stem from the point
   to the model (blue above, orange below), and the residual plot underneath
   with its verdict (scattered, or a pattern). Switch the model and watch the
   residual plot change. Drag the prediction line (or its slider) to read
   the model's value to three decimals; the constants are stored, never
   rounded, and Details lists them in full beside the data, the predictions
   and the residuals.

   Test yourself: linear, exponential and quadratic regressions with a
   prediction (the rounded-constants slip named); a residual and what a
   residual plot says; linear or exponential from differences and ratios. */
(function(){
  'use strict';
  var T = window.ApPrecalcTools, M = window.ApPrecalcMath, P = window.ApPrecalcPlot, X = window.ApPrecalcTex;
  (function(){
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Constants & data');
  })();
  if(!T || !M || !M.regressionLab || M.regressionLab.stub || !P) return;
  var RL = M.regressionLab, esc = T.esc, NS = 'http://www.w3.org/2000/svg';
  function tex(s){ return X ? X.render(s) : esc(s); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function num(v, d){ return RL.n(v, d == null ? 2 : d).replace(/^-/, '−'); }
  function fix3(v){ return M.fixed(v, 3).replace(/^-/, '−'); }

  T.mount('regression-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'regression-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ============================================================ explore */
  function explore(host, data){
    var LS = null;
    var ids = (data.datasets || []).map(function(d){ return d.id; }).filter(function(id){ return RL.DATASETS[id]; });
    if(!ids.length) ids = ['crickets'];
    var st = { id: ids.indexOf('stopping') > -1 ? 'stopping' : ids[0], kind: 'linear', x: 0, touched: false };
    var cache = {};
    function D(){ return RL.DATASETS[st.id]; }
    function dat(){ if(!cache[st.id]) cache[st.id] = RL.data(st.id); return cache[st.id]; }
    function fitNow(){ var d = dat(), k = st.id + ':' + st.kind; if(!(k in cache)) cache[k] = RL.fit(st.kind, d.xs, d.ys); return cache[k]; }
    var cue = T.cue('Pick a model, then read the residual plot under the graph: no pattern means a good fit.');
    host.innerHTML =
      '<section class="bt-problem rl-card" aria-label="Regression lab">' +
        '<div class="rl-stage">' +
          '<p class="rl-eq" aria-live="off"></p>' +
          '<div class="rl-graph-wrap"><svg class="rl-graph" role="group" aria-roledescription="scatter plot"><g class="rl-plot"></g><g class="rl-handles"></g></svg></div>' +
          '<div class="rl-res-wrap"><svg class="rl-res" role="img"></svg></div>' +
        '</div>' +
        '<div class="rl-ctl">' +
          '<div class="rl-sets"></div>' +
          '<div class="rl-models ls-scroll" role="group" aria-label="Model"></div>' +
          '<div class="rl-slot"></div>' +
        '</div>' +
        '<div class="rl-say"></div>' +
        '<div class="rl-det"></div>' +
        '<p class="sr-only rl-live"></p>' +
      '</section>';
    var card = host.querySelector('.rl-card');
    card.insertBefore(cue.el, card.querySelector('.rl-say'));
    var wrap = host.querySelector('.rl-graph-wrap'), svg = host.querySelector('.rl-graph'), plot = svg.querySelector('.rl-plot'), hg = svg.querySelector('.rl-handles');
    var rwrap = host.querySelector('.rl-res-wrap'), rsvg = host.querySelector('.rl-res'), sets = host.querySelector('.rl-sets'), models = host.querySelector('.rl-models');
    var slot = host.querySelector('.rl-slot'), eqEl = host.querySelector('.rl-eq'), det = host.querySelector('.rl-det');
    var say = T.announcer(host.querySelector('.rl-live'));
    var V = null, slider = null, handle = null;
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }
    function xr(){ var d = dat(), a = Math.min.apply(null, d.xs), b = Math.max.apply(null, d.xs), p = (b - a) * 0.06; return [a - p, b + p]; }

    function layout(){
      var d = dat(), w = Math.max(260, Math.round(wrap.clientWidth || 600)), h = Math.max(190, Math.round(wrap.clientHeight || 360));
      var x = xr(), lo = Math.min.apply(null, d.ys), hi = Math.max.apply(null, d.ys), pd = (hi - lo) * 0.14;
      lo = Math.min(lo - pd, lo >= 0 && lo - pd < 0 ? 0 : lo - pd); hi += pd;
      var L = w < 420 ? 42 : 52, R = 14, Tp = 12, B = 30;
      return { w: w, h: h, x: x, y: [lo, hi], L: L, R: R, T: Tp, B: B,
        sx: function(v){ return L + (v - x[0]) / (x[1] - x[0]) * (w - L - R); }, sy: function(v){ return Tp + (hi - v) / (hi - lo) * (h - Tp - B); },
        ix: function(px){ return x[0] + (px - L) / (w - L - R) * (x[1] - x[0]); } };
    }
    function draw(){
      V = layout();
      var d = dat(), F = fitNow(), o = [], Dd = D();
      svg.setAttribute('viewBox', '0 0 ' + V.w + ' ' + V.h);
      o.push('<rect class="rl-bg" x="' + V.L + '" y="' + V.T + '" width="' + (V.w - V.L - V.R) + '" height="' + (V.h - V.T - V.B) + '" rx="8"/>');
      P.ticks(V.x[0], V.x[1], Math.max(4, Math.round((V.w - V.L) / 80))).forEach(function(x){ var px = r1(V.sx(x)); o.push('<line class="rl-grid" x1="' + px + '" y1="' + V.T + '" x2="' + px + '" y2="' + (V.h - V.B) + '"/><text class="rl-tk" x="' + px + '" y="' + (V.h - V.B + 16) + '" text-anchor="middle">' + num(x) + '</text>'); });
      P.ticks(V.y[0], V.y[1], 5).forEach(function(y){ var py = r1(V.sy(y)); o.push('<line class="rl-grid" x1="' + V.L + '" y1="' + py + '" x2="' + (V.w - V.R) + '" y2="' + py + '"/><text class="rl-tk" x="' + (V.L - 6) + '" y="' + (+py + 4) + '" text-anchor="end">' + num(y) + '</text>'); });
      o.push('<text class="rl-axl" x="' + (V.w - V.R - 8) + '" y="' + (V.h - V.B - 8) + '" text-anchor="end">' + esc(Dd.x) + '</text><text class="rl-axl" x="' + (V.L + 8) + '" y="' + (V.T + 16) + '">' + esc(Dd.y) + '</text>');
      if(F){
        // residual stems first, then the model, then the points on top
        d.xs.forEach(function(x, i){ var e = F.res[i]; o.push('<line class="rl-stem ' + (e >= 0 ? 'is-pos' : 'is-neg') + '" x1="' + r1(V.sx(x)) + '" y1="' + r1(V.sy(d.ys[i])) + '" x2="' + r1(V.sx(x)) + '" y2="' + r1(V.sy(clamp(F.f(x), V.y[0], V.y[1]))) + '"/>'); });
        var runs = P.sample(F.f, V.x[0], V.x[1], { y: V.y }, 400);
        o.push('<path class="rl-model" d="' + runs.map(function(r){ return 'M' + r.map(function(q){ return r1(V.sx(q[0])) + ' ' + r1(V.sy(q[1])); }).join('L'); }).join('') + '"/>');
        // the prediction line
        var px = r1(V.sx(st.x)), py = F.f(st.x);
        o.push('<line class="rl-pline" x1="' + px + '" y1="' + V.T + '" x2="' + px + '" y2="' + (V.h - V.B) + '"/>');
        if(isFinite(py) && py >= V.y[0] && py <= V.y[1]){
          var right = +px < V.w * 0.6;
          o.push('<circle class="rl-ppt" cx="' + px + '" cy="' + r1(V.sy(py)) + '" r="5.5"/><text class="rl-plab" x="' + (+px + (right ? 10 : -10)) + '" y="' + r1(V.sy(py) - 10) + '" text-anchor="' + (right ? 'start' : 'end') + '">ŷ = ' + fix3(py) + '</text>');
        }
      }
      d.xs.forEach(function(x, i){ o.push('<circle class="rl-pt" cx="' + r1(V.sx(x)) + '" cy="' + r1(V.sy(d.ys[i])) + '" r="4.6"/>'); });
      plot.innerHTML = o.join('');
      if(!handle) handle = mkHandle();
      handle.setAttribute('transform', 'translate(' + r1(V.sx(st.x)) + ' ' + (V.h - V.B) + ')');
      handle.setAttribute('aria-valuenow', M.fixed(st.x, 2)); handle.setAttribute('aria-valuetext', 'x = ' + num(st.x) + (F ? ', predicted y = ' + fix3(F.f(st.x)) : ''));
      drawRes(F);
      svg.setAttribute('aria-label', Dd.name + ': ' + d.xs.length + ' data points' + (F ? ' with the ' + RL.MODELS[st.kind].name.toLowerCase() + ' regression drawn through them' : '') + '.');
    }
    function drawRes(F){
      var d = dat(), w = Math.max(240, Math.round(rwrap.clientWidth || 600)), h = Math.max(80, Math.round(rwrap.clientHeight || 120)), o = [];
      rsvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      var L = V.L, R = 58, Tp = 20, B = 8;
      var m = F ? Math.max.apply(null, F.res.map(Math.abs)) || 1 : 1, sy = function(v){ return Tp + (m * 1.15 - v) / (m * 2.3) * (h - Tp - B); };
      var sx = function(x){ return L + (x - V.x[0]) / (V.x[1] - V.x[0]) * (w - L - R); };
      o.push('<rect class="rl-bg" x="' + L + '" y="' + Tp + '" width="' + (w - L - R) + '" height="' + (h - Tp - B) + '" rx="6"/>');
      o.push('<line class="rl-rzero" x1="' + L + '" y1="' + r1(sy(0)) + '" x2="' + (w - R) + '" y2="' + r1(sy(0)) + '"/>');
      o.push('<text class="rl-rk" x="' + L + '" y="13">Residual plot</text><text class="rl-tk" x="' + (L - 6) + '" y="' + r1(sy(0) + 4) + '" text-anchor="end">0</text>');
      if(F){
        var P0 = RL.pattern(d.xs, F.res);
        var idx = d.xs.map(function(x, i){ return i; }).sort(function(a, b){ return d.xs[a] - d.xs[b]; });
        o.push('<path class="rl-rline" d="' + idx.map(function(i, j){ return (j ? 'L' : 'M') + r1(sx(d.xs[i])) + ' ' + r1(sy(F.res[i])); }).join('') + '"/>');
        d.xs.forEach(function(x, i){ var e = F.res[i]; o.push('<line class="rl-stem ' + (e >= 0 ? 'is-pos' : 'is-neg') + '" x1="' + r1(sx(x)) + '" y1="' + r1(sy(0)) + '" x2="' + r1(sx(x)) + '" y2="' + r1(sy(e)) + '"/><circle class="rl-rpt ' + (e >= 0 ? 'is-pos' : 'is-neg') + '" cx="' + r1(sx(x)) + '" cy="' + r1(sy(e)) + '" r="4"/>'); });
        o.push('<text class="rl-verdict ' + (P0.pattern ? 'is-bad' : 'is-good') + '" x="' + (w - R) + '" y="13" text-anchor="end">' + (P0.pattern ? 'pattern' : 'no clear pattern') + '</text>');
        rsvg.setAttribute('aria-label', 'Residual plot: ' + (P0.pattern ? 'the residuals show a pattern' : 'the residuals scatter with no clear pattern') + '. Residuals in order of x: ' + idx.map(function(i){ return num(F.res[i]); }).join(', ') + '.');
      } else rsvg.setAttribute('aria-label', 'Residual plot: this model cannot be fit to these data.');
      rsvg.innerHTML = o.join('');
    }
    function mkHandle(){
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'rl-h'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'slider');
      g.setAttribute('aria-label', 'Prediction line: arrow keys move it');
      g.innerHTML = '<circle class="rl-halo" r="18"/><rect class="rl-hdot" x="-9" y="-9" width="18" height="18" rx="9"/><path class="rl-harr" d="M-4 -3l-3 3l3 3M4 -3l3 3l-3 3"/>';
      hg.appendChild(g);
      var on = false;
      function toX(e){ var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(); return V.ix((m ? pt.matrixTransform(m.inverse()) : pt).x); }
      g.addEventListener('pointerdown', function(e){ on = true; try{ g.setPointerCapture(e.pointerId); }catch(er){} g.classList.add('is-drag'); e.preventDefault(); touch(); });
      g.addEventListener('pointermove', function(e){ if(on) setX(toX(e), false); });
      function up(){ if(!on) return; on = false; g.classList.remove('is-drag'); update(true); }
      g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
      g.addEventListener('keydown', function(e){
        var k = e.key, s = stepOf() * (e.shiftKey ? 10 : 1), x = xr();
        if(k === 'ArrowRight' || k === 'ArrowUp') setX(st.x + s, true); else if(k === 'ArrowLeft' || k === 'ArrowDown') setX(st.x - s, true);
        else if(k === 'Home') setX(x[0], true); else if(k === 'End') setX(x[1], true); else return;
        e.preventDefault(); touch();
      });
      return g;
    }
    function stepOf(){ var x = xr(), s = x[1] - x[0]; return s > 40 ? 1 : s > 8 ? 0.1 : 0.05; }
    function setX(x, full){ var r = xr(), k = stepOf(); st.x = clamp(Math.round(x / k) * k, r[0], r[1]); if(slider && Math.abs(slider.value() - st.x) > 1e-9) slider.set(st.x); update(full); }
    function buildSlider(){
      var r = xr(), k = stepOf();
      slider = T.slider({ label: 'Predict at x (' + D().x + ')', min: Math.ceil(r[0] / k) * k, max: Math.floor(r[1] / k) * k, step: k, value: st.x, onInput: function(v){ touch(); setX(v, true); } });
      slot.innerHTML = ''; slot.appendChild(slider.el);
    }
    /* the data set: one menu (pass 3), not seven chips; the models stay chips, the main action */
    var setSel = T.choiceSelect({ label: 'Data', value: st.id, options: ids.map(function(id){ return { value: id, label: RL.DATASETS[id].name }; }),
      onChange: function(v){ touch(); st.id = v; st.kind = 'linear'; var d = dat(); st.x = d.xs[Math.floor(d.xs.length * 0.6)]; buildChips(); buildSlider(); update(true); } });
    setSel.el.classList.add('rl-set');
    function buildChips(){
      if(setSel.el.parentNode !== sets){ sets.innerHTML = ''; sets.appendChild(setSel.el); }
      setSel.set(st.id);
      var d = dat();
      models.innerHTML = RL.MORDER.map(function(k){ var ok = RL.allowed(k, d.xs, d.ys); return '<button type="button" class="bt-btn rl-mchip" data-k="' + k + '" aria-pressed="' + (k === st.kind) + '"' + (ok ? '' : ' disabled title="Needs every ' + (k === 'logarithmic' ? 'x' : 'y') + ' > 0"') + '>' + esc(RL.MODELS[k].name) + '</button>'; }).join('');
    }
    models.addEventListener('click', function(e){ var b = e.target.closest('.rl-mchip'); if(!b || b.disabled) return; touch(); st.kind = b.getAttribute('data-k'); buildChips(); update(true); });

    var lastCap = '';
    function update(full){
      draw();
      var d = dat(), F = fitNow(), Md = RL.MODELS[st.kind], Dd = D(), head, body, P0 = F ? RL.pattern(d.xs, F.res) : null;
      eqEl.innerHTML = F ? '<span class="rl-mname">' + esc(Md.name) + '</span> ' + tex(RL.eqTex(st.kind, F.k)) : esc(Md.name) + ': cannot be fit to these data.';
      if(!F) head = esc(Md.name) + ' cannot be fit here: ' + (st.kind === 'exponential' ? 'ExpReg needs every y > 0.' : 'LnReg needs every x > 0.');
      else head = P0.pattern ? '<b>The residuals show a pattern</b> (long runs above and below 0): the ' + Md.name.toLowerCase() + ' model misses the shape of the data. Try another model.'
        : '<b>The residuals scatter with no clear pattern:</b> the ' + Md.name.toLowerCase() + ' model fits the shape of the data.';
      body = '<p>' + esc(Dd.story) + '</p>' + (F ? '<p>Prediction at ' + esc(Dd.x.replace(/ \(.*\)$/, '')) + ' = ' + num(st.x) + ': ŷ = <b>' + fix3(F.f(st.x)) + '</b>, from the stored constants (Details lists them in full).</p>' : '') +
        '<p class="rl-rule"><b>Reading a residual plot:</b> residual = actual − predicted. Points above the model have positive residuals. A good model leaves residuals that look random; a curve or a wave in them means the model has the wrong shape. Small residuals are not enough on their own.</p>' +
        '<p class="rl-rule"><b>Three decimals:</b> store the constants and round only the final answer. Rounding $b$ in an exponential model first can change the third decimal of a prediction.</p>';
      body = body.replace(/\$[^$]+\$/g, function(m){ return X ? X.html(m) : m; });
      T.explain(host.querySelector('.rl-say') || (LS && LS.root.querySelector('.rl-say')), head, body);
      if(F){
        var rows = d.xs.map(function(x, i){ return [x, d.ys[i], F.f(x), F.res[i]]; });
        det.innerHTML = '<h3 class="ls-title-l">' + esc(Md.name) + ' regression</h3><p>' + tex(Md.form) + '</p><table class="ls-tbl rl-ktbl"><thead><tr><th scope="col">Constant</th><th scope="col" class="r">Three decimals</th><th scope="col" class="r">Stored</th></tr></thead><tbody>' +
          F.k.map(function(c, i){ return '<tr><th scope="row"><i>' + Md.letters[i] + '</i></th><td class="r">' + fix3(c) + '</td><td class="r rl-full">' + M.fixed(c, 10).replace(/^-/, '−') + '</td></tr>'; }).join('') + '</tbody></table>' +
          '<p class="rl-sse">Sum of squared residuals: <b>' + num(F.sse, 3) + '</b>' + (st.kind === 'exponential' ? ' (ExpReg makes the residuals of ln y smallest, so this sum is not the smallest possible for y)' : '') + '</p>' +
          '<h3 class="ls-title-l">' + esc(Dd.name) + '</h3><table class="ls-tbl rl-dtbl"><thead><tr><th scope="col">' + esc(Dd.x) + '</th><th scope="col" class="r">' + esc(Dd.y) + '</th><th scope="col" class="r">Predicted</th><th scope="col" class="r">Residual</th></tr></thead><tbody>' +
          rows.map(function(r){ return '<tr><td>' + num(r[0]) + '</td><td class="r">' + num(r[1]) + '</td><td class="r">' + fix3(r[2]) + '</td><td class="r ' + (r[3] >= 0 ? 'rl-pos' : 'rl-neg') + '">' + fix3(r[3]) + '</td></tr>'; }).join('') + '</tbody></table>';
      } else det.innerHTML = '<p>' + esc(head) + '</p>';
      if(LS){ if(head !== lastCap){ LS.caption(head, 'explore'); lastCap = head; } LS.pills([], 'left', 'explore'); }
      if(full) say(head.replace(/<[^>]+>/g, '') + (F ? ' Prediction: ' + fix3(F.f(st.x)) + '.' : ''));
    }
    if(window.ResizeObserver){
      var last = '';
      new ResizeObserver(function(){ var k = wrap.clientWidth + 'x' + wrap.clientHeight + 'x' + rwrap.clientWidth; if(k !== last){ last = k; draw(); } }).observe(wrap);
    }
    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'pcalc-ls-stage rl-ls-stage'; stage.appendChild(host.querySelector('.rl-stage'));
      s.add('stage', stage, o);
      var dock = document.createElement('div'); dock.className = 'pcalc-ls-dock rl-ls-dock'; dock.appendChild(host.querySelector('.rl-ctl'));
      s.add('dock', dock, o);
      var why = document.createElement('div'); why.className = 'ls-sec pcalc-ls-why rl-ls-why'; why.appendChild(cue.el); why.appendChild(host.querySelector('.rl-say'));
      s.add('why', why, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      var dd = document.createElement('div'); dd.className = 'ls-sec pcalc-ls-det rl-ls-det'; dd.appendChild(det);
      s.add('details', dd, o);
      lastCap = ''; update(true);
      if(s.mode() === 'explore') s.hint({ target: models, text: 'Try each model and watch the residual plot', key: 'apprecalc-regression-lab-models' });
    }
    var d0 = dat(); st.x = d0.xs[Math.floor(d0.xs.length * 0.6)];
    buildChips(); buildSlider(); update(true);
    return { studio: studio };
  }

  /* ============================================================ test yourself */
  function figSize(w, h){
    var W = window.innerWidth || 1280, Hh = window.innerHeight || 800;
    // a phone's quiz stage is short (the data table sits above the plot): a plot drawn taller than its slot is shrunk to fit and its numbers drop to 7px
    if(W <= 640) return [340, Math.round(Math.max(190, Math.min(260, Hh * 0.36 - 70)))];
    if(W <= 999 && Hh <= 540) return [440, Math.round(Math.max(200, Math.min(280, Hh - 130)))];
    return [w, h];
  }
  function figSpec(p){
    var g = p.fig, sz = figSize(560, 360), xs = g.xs, ys = g.ys;
    if(g.resid){
      var f = function(x){ return g.k[0] * x + g.k[1]; }, res = xs.map(function(x, i){ return ys[i] - f(x); }), m = Math.max.apply(null, res.map(Math.abs)) * 1.3 || 1;
      return { label: 'Residual plot for the linear model, residual against x', width: sz[0], height: sz[1], x: [0, xs[xs.length - 1] + 1], y: [-m, m], xStep: 1, xLabel: 'x', yLabel: 'residual',
        points: xs.map(function(x, i){ return { at: [x, res[i]], cls: 's1' }; }) };
    }
    var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), pd = (hi - lo) * 0.15 || 1, span = xs[xs.length - 1] - xs[0];
    var x1 = g.x0 != null ? Math.max(xs[xs.length - 1], g.x0) + span * 0.08 : xs[xs.length - 1] + span * 0.1;
    var spec = { label: 'Scatter plot of the data in the table', width: sz[0], height: sz[1], x: [Math.min(0, xs[0] - span * 0.08), x1], y: [Math.min(0, lo - pd), hi + pd], xLabel: 'x', yLabel: 'y',
      points: xs.map(function(x, i){ return { at: [x, ys[i]], cls: 's1' }; }) };
    if(g.kind && g.k && g.x0 != null){ var F = RL.fnOf(g.kind, g.k), pv = F(g.x0); if(isFinite(pv)) spec.y[1] = Math.max(spec.y[1], pv + pd); spec.y[0] = Math.min(spec.y[0], pv - pd); }
    return spec;
  }
  var METHOD = {
    a: 'Enter the table in two lists, run the regression the question names, and read the constant. Keep every digit.',
    b: 'Read the constant from the same regression output, every digit.',
    p: 'Use the stored regression equation (Y-VARS on a TI calculator) at the new x. Round only the final answer to three decimals.',
    kind: 'b > 1 is growth by (b − 1) × 100% per step; 0 < b < 1 is decay by (1 − b) × 100%.',
    open: 'The sign of the leading coefficient sets which way a parabola opens.',
    res: 'Residual = actual y − predicted y. Predict with the model at that x first.',
    fit: 'Look at the arrangement of the residuals, not their size: random scatter is good, a curve is not.',
    d: 'Later output minus earlier output.',
    q: 'Later output divided by earlier output.',
    model: 'Over equal input steps: constant differences mean linear, constant ratios mean exponential.'
  };
  function quiz(host, data){
    var fig = null, prob = null;
    T.drill(host, data, { slug: 'regression-lab', noun: 'drill',
      types: RL.KINDS.map(function(k){ return { value: k, label: RL.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: RL.generate, title: function(p){ return p.title; },
      extra: function(el, p){
        prob = p;
        var tb = el.parentNode && el.parentNode.querySelector('.bt-context table');
        if(tb){ var tw = document.createElement('div'); tw.className = 'rl-tabwrap'; tw.appendChild(tb.closest('.bt-table-wrap') || tb); el.appendChild(tw); }
        var box = document.createElement('div'); el.appendChild(box);
        fig = T.markedFigure(box, function(){ return figSpec(p); }, 'rl-figwrap');
      },
      method: function(s){ return METHOD[s.key]; },
      onTry: function(s, t){
        var p = prob, g = p.fig;
        if(!fig) return false;
        // a prediction is a point at x0; once right, the fitted model is drawn through the data
        if(s.key === 'p') return T.tryOn(function(){ return fig; }, { pt: { p: g.x0 } })(s, t);
        if(s.key === 'res'){ var v = p.values; return T.tryOn(function(){ return fig; }, { pt: { res: v.x0 } })(s, t); }
        if((s.key === 'kind' || s.key === 'open') && (t.ok || t.shown)){
          fig.marks.set('model', [{ curve: RL.fnOf(g.kind, g.k), who: 'right', label: 'model' }]); fig.redraw();
          return 'The fitted model is drawn through the data.';
        }
        return false;
      } });
  }
})();
