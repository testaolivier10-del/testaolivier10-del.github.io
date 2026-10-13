/* Motion lab (Units 4 and 8, Premium; docs/apcalc-spec.md section 6). Job: a
   car on a straight road with its position, velocity and acceleration graphs
   linked, so direction, speeding up and slowing down, displacement and total
   distance are seen, not memorized. OWNED BY THIS TOOL ONLY. Model:
   ApCalcMath.motionLab (calculus/assets/tools/math/motion-lab.js); frame:
   ApCalcTools.modes and drill on the Tool Studio; figures: ApCalcPlot.

   Explore: pick a motion. "Position given" (Unit 4): x(t) is the formula,
   v = x′ and a = v′. "Velocity given" (Unit 8, shown once Unit 8 is
   published): v(t) and x(0) are given, and x(t) builds up as x(0) plus the
   signed area under v, with the displacement and the total distance (area
   of |v|) counted as time runs. Press Play, drag across the graphs, or use
   the time slider. Speeding-up stretches (v and a share a sign) are tinted,
   slowing-down stretches hatched, the same on every graph; direction
   changes (v changes sign) are marked. The car shows it all: it faces its
   direction, brake lights come on when it slows, a dot trail shows its
   spacing.

   Test yourself: seeded problems (velocity and acceleration from position,
   speeding up or slowing down with the sign reasoning, changes of
   direction, displacement and distance by calculator, distance from a
   velocity graph), each with its graph. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot, X = window.ApCalcTex;
  (function(){
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Formulas & numbers');
  })();
  if(!T || !M || !M.motionLab || !P) return;
  var ML = M.motionLab, F = T.F, esc = T.esc;
  function tex(s, d){ return X ? X.render(s, { display: !!d }) : esc(s); }
  function html(s){ return X ? X.html(s) : s; }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function sg(x, d){ var s = F(x, d == null ? 2 : d); return x > 0 && Number(M.fixed(x, d == null ? 2 : d)) !== 0 ? '+' + s : s; }
  function storeGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function storeSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }

  T.mount('motion-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'motion-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.pause(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ============================================================ explore */
  function explore(host, data){
    var LS = null;
    var ids = (data.motions || []).map(function(m){ return m.id; }).filter(function(id){ return ML.MOTIONS[id]; });
    if(!ids.length) ids = ['cubic', 'quad', 'wave', 'surge'];
    var hasV = ids.some(function(id){ return ML.MOTIONS[id].mode === 'v'; });
    var st = { id: ids[0], t: 0, playing: false, touched: false };
    var saved = storeGet('apcalc_motionlab_motion'); if(saved && ids.indexOf(saved) > -1) st.id = saved;
    var cache = {};
    function mo(){ return ML.MOTIONS[st.id]; }
    function info(){
      if(!cache[st.id]){ var m = mo(); cache[st.id] = { tb: ML.table(m, 480), an: ML.analyze(m) }; }
      return cache[st.id];
    }
    var cue = T.cue('Press Play, or drag across the graphs to move through time.');
    host.innerHTML =
      '<section class="bt-problem ml-card" aria-label="Motion lab explorer">' +
        '<div class="ml-stage">' +
          '<div class="ml-track-wrap"><svg class="ml-track" role="img"></svg></div>' +
          '<div class="ml-graphs-wrap" tabindex="0" role="slider" aria-label="Time on the graphs: arrow keys move it" aria-valuemin="0"><svg class="ml-graphs" aria-hidden="true"></svg></div>' +
          '<p class="ml-legend" aria-hidden="true"><span class="ml-lg ml-lg-x">x</span><span class="ml-lg ml-lg-v">v</span><span class="ml-lg ml-lg-a">a</span><span class="ml-lg ml-lg-up">speeding up</span><span class="ml-lg ml-lg-dn">slowing down</span><span class="ml-lg ml-lg-turn">turns</span></p>' +
        '</div>' +
        '<div class="ml-ctl">' +
          (hasV ? '<div class="ml-modes ls-seg" role="group" aria-label="What is given"><button type="button" class="bt-mode" data-g="x" aria-pressed="true">Position given</button><button type="button" class="bt-mode" data-g="v" aria-pressed="false">Velocity given</button></div>' : '') +
          '<div class="ml-chips ls-scroll" role="group" aria-label="Motion"></div>' +
          '<div class="ml-time"><button type="button" class="bt-btn ls-btn ls-pri ml-play">Play</button><div class="ml-slot"></div></div>' +
        '</div>' +
        '<div class="ml-say"></div>' +
        '<div class="ml-det"></div>' +
        '<p class="sr-only ml-live"></p>' +
      '</section>';
    var card = host.querySelector('.ml-card');
    card.insertBefore(cue.el, card.querySelector('.ml-say'));
    var track = host.querySelector('.ml-track'), graphs = host.querySelector('.ml-graphs'), gwrap = host.querySelector('.ml-graphs-wrap');
    var chips = host.querySelector('.ml-chips'), modesEl = host.querySelector('.ml-modes'), playBtn = host.querySelector('.ml-play');
    var say = T.announcer(host.querySelector('.ml-live'));
    var slider = T.slider({ label: 'Time t', min: 0, max: 5, step: 0.01, value: 0, unit: 's', decimals: 2, onInput: function(v){ pause(); setT(v); } });
    host.querySelector('.ml-slot').appendChild(slider.el);
    var loop = null, gl = null, tl = null;

    function narrow(){ try{ return matchMedia('(max-width: 599.98px)').matches; }catch(e){ return false; } }
    function chipsFor(g){
      // On a phone one row holds every motion (no room for the switch above it).
      chips.innerHTML = ids.filter(function(id){ return narrow() || ML.MOTIONS[id].mode === g; }).map(function(id){
        return '<button type="button" class="bt-btn ml-chip" data-id="' + id + '" aria-pressed="' + (id === st.id) + '">' + esc(ML.MOTIONS[id].name) + '</button>';
      }).join('');
      var on = chips.querySelector('[aria-pressed="true"]');
      if(on) chips.scrollLeft = Math.max(0, on.offsetLeft - chips.offsetLeft - 16);
    }
    function setMotion(id){
      pause(); st.id = id; st.t = 0; storeSet('apcalc_motionlab_motion', id);
      var m = mo();
      if(modesEl) modesEl.querySelectorAll('.bt-mode').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-g') === m.mode)); });
      chipsFor(m.mode);
      slider.input.max = String(m.T); slider.set(0);
      gwrap.setAttribute('aria-valuemax', M.fixed(m.T, 2));
      gl = null; tl = null; draw(true);
    }
    chips.addEventListener('click', function(e){ var b = e.target.closest('.ml-chip'); if(b){ touch(); setMotion(b.getAttribute('data-id')); } });
    if(modesEl) modesEl.addEventListener('click', function(e){ var b = e.target.closest('.bt-mode'); if(!b) return; var g = b.getAttribute('data-g'); if(g === mo().mode) return; touch(); setMotion(ids.filter(function(id){ return ML.MOTIONS[id].mode === g; })[0]); });
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }
    function setT(t){ st.t = clamp(t, 0, mo().T); touch(); draw(true); }

    /* ---------------------------------------------- the road and the car */
    function trackLayout(){
      var w = Math.max(280, Math.round(track.clientWidth || 600)), h = w < 520 ? 84 : 112;
      var tb = info().tb, lo = Math.min.apply(null, tb.x), hi = Math.max.apply(null, tb.x);
      var span = Math.max(2, hi - lo), pad = span * 0.12; lo = Math.floor(lo - pad); hi = Math.ceil(hi + pad);
      return { w: w, h: h, lo: lo, hi: hi, L: 22, R: w - 22, road: h - 30, sx: function(x){ return 22 + (x - lo) / (hi - lo) * (w - 44); } };
    }
    function drawTrack(){
      if(!tl) tl = trackLayout();
      var g = tl, m = mo(), t = st.t, x = ML.xAt(m, t), v = m.v(t), a = m.a(t), tb = info().tb, o = [];
      track.setAttribute('viewBox', '0 0 ' + g.w + ' ' + g.h);
      o.push('<rect class="ml-sky" x="0" y="0" width="' + g.w + '" height="' + g.h + '"/>');
      o.push('<rect class="ml-road" x="0" y="' + (g.road - 4) + '" width="' + g.w + '" height="14" rx="3"/>');
      o.push('<line class="ml-lane" x1="0" y1="' + (g.road + 3) + '" x2="' + g.w + '" y2="' + (g.road + 3) + '"/>');
      var tk = P.ticks(g.lo, g.hi, Math.max(4, Math.round(g.w / 70)));
      o.push('<g class="ml-ticks">' + tk.map(function(v){ var px = r1(g.sx(v)); return '<line x1="' + px + '" y1="' + (g.road + 12) + '" x2="' + px + '" y2="' + (g.road + 17) + '"/><text x="' + px + '" y="' + (g.road + 28) + '" text-anchor="middle">' + F(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1) + '</text>'; }).join('') + '</g>');
      // the dot trail: where the car was every 0.25 s
      var dots = [];
      for(var s = 0; s <= t + 1e-9; s += 0.25){ var k = Math.round(s / m.T * (tb.t.length - 1)); dots.push('<circle cx="' + r1(g.sx(tb.x[k])) + '" cy="' + (g.road + 3) + '" r="2.6"/>'); }
      o.push('<g class="ml-trail">' + dots.join('') + '</g>');
      // the car
      var cx = g.sx(x), dir = v < -1e-9 ? -1 : 1, d = ML.describe(m, t), cw = 46, ch = 18, by = g.road - 6;
      var wheelA = (g.sx(x) - g.sx(0)) / 6 * 180 / Math.PI;
      var wheel = function(wx){ return '<g transform="translate(' + wx + ' ' + (by + 1) + ') rotate(' + r1(wheelA % 360) + ')"><circle class="ml-tyre" r="6"/><line class="ml-spoke" x1="-4" y1="0" x2="4" y2="0"/><line class="ml-spoke" x1="0" y1="-4" x2="0" y2="4"/></g>'; };
      var car = '<g transform="translate(' + r1(cx) + ' 0) scale(' + dir + ' 1)">' +
        (d.state === 'up' ? '<g class="ml-speed"><line x1="-36" y1="' + (by - 14) + '" x2="-50" y2="' + (by - 14) + '"/><line x1="-34" y1="' + (by - 7) + '" x2="-54" y2="' + (by - 7) + '"/><line x1="-36" y1="' + by + '" x2="-48" y2="' + by + '"/></g>' : '') +
        '<path class="ml-body" d="M' + (-cw / 2) + ' ' + (by - 2) + 'v-8q0 -4 4 -4h8l8 -8h14q4 0 7 4l6 6q4 1 4 6v4z"/>' +
        '<path class="ml-glass" d="M-5 ' + (by - 14) + 'l6 -6h8q2 0 4 3l3 3z"/>' +
        '<rect class="ml-brake' + (d.state === 'down' ? ' is-on' : '') + '" x="' + (-cw / 2 - 1) + '" y="' + (by - 10) + '" width="4" height="5" rx="1"/>' +
        '<rect class="ml-head" x="' + (cw / 2 - 3) + '" y="' + (by - 8) + '" width="4" height="4" rx="1"/>' +
        wheel(-cw / 2 + 10) + wheel(cw / 2 - 10) + '</g>';
      o.push(car);
      // v and a arrows over the car, scaled to this motion's largest values
      var vmax = Math.max.apply(null, tb.v.map(Math.abs)) || 1, amax = Math.max.apply(null, tb.a.map(Math.abs)) || 1, len = Math.min(70, g.w / 6);
      o.push(arrow(cx, by - 34, cx + v / vmax * len, 'ml-av', 'v'));
      o.push(arrow(cx, by - 46, cx + a / amax * len, 'ml-aa', 'a'));
      track.innerHTML = o.join('');
      track.setAttribute('aria-label', 'A car on a road marked in meters, at x = ' + F(x, 2) + ' at t = ' + F(t, 2) + ' s. ' + d.head);
    }
    function arrow(x1, y, x2, cls, lab){
      if(Math.abs(x2 - x1) < 3) return '<g class="' + cls + '"><circle cx="' + r1(x1) + '" cy="' + y + '" r="2.5"/><text x="' + r1(x1 + 6) + '" y="' + (y + 4) + '">' + lab + ' = 0</text></g>';
      var dx = x2 - x1, s = dx > 0 ? 1 : -1, hx = x2 - s * 7;
      return '<g class="' + cls + '"><line x1="' + r1(x1) + '" y1="' + y + '" x2="' + r1(hx) + '" y2="' + y + '"/><path d="M' + r1(x2) + ' ' + y + 'L' + r1(hx) + ' ' + (y - 4.5) + 'L' + r1(hx) + ' ' + (y + 4.5) + 'Z"/>' +
        '<text x="' + r1(x2 + s * 5) + '" y="' + (y + 4) + '" text-anchor="' + (s > 0 ? 'start' : 'end') + '">' + lab + '</text></g>';
    }

    /* ---------------------------------------------------- the graphs */
    function graphsLayout(){
      var w = Math.max(280, Math.round(gwrap.clientWidth || 600)), h = Math.max(240, Math.round(gwrap.clientHeight || 330));
      var L = w < 420 ? 40 : 48, R = 12, top = 6, gap = 10, bottom = 24, ph = (h - top - bottom - 2 * gap) / 3;
      var m = mo(), tb = info().tb, rows = {};
      ['x', 'v', 'a'].forEach(function(k, i){
        var ys = tb[k], lo = Math.min(0, Math.min.apply(null, ys)), hi = Math.max(0, Math.max.apply(null, ys));
        if(m.pts && k === 'a'){ lo = Math.min(lo, -0.5); hi = Math.max(hi, 0.5); }
        var pad = (hi - lo) * 0.1 || 1; lo -= pad; hi += pad;
        rows[k] = { y0: top + i * (ph + gap), lo: lo, hi: hi };
      });
      return { w: w, h: h, L: L, R: R, ph: ph, rows: rows, pw: w - L - R, bottom: h - bottom,
        gx: function(t){ return L + t / m.T * (w - L - R); },
        gy: function(k, y){ var r = rows[k]; return r.y0 + (r.hi - y) / (r.hi - r.lo) * ph; } };
    }
    function drawGraphs(){
      if(!gl) gl = graphsLayout();
      var g = gl, m = mo(), I = info(), tb = I.tb, an = I.an, t = st.t, vMode = m.mode === 'v', o = [];
      graphs.setAttribute('viewBox', '0 0 ' + g.w + ' ' + g.h);
      o.push('<defs><pattern id="ml-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" class="ml-hatch-l"/></pattern></defs>');
      var NAME = { x: 'x (m)', v: 'v (m/s)', a: 'a (m/s²)' }, CLS = { x: 's1', v: 's2', a: 's3' };
      ['x', 'v', 'a'].forEach(function(k){
        var r = g.rows[k], y0 = r.y0, y1 = r.y0 + g.ph;
        o.push('<rect class="ml-panel" x="' + g.L + '" y="' + r1(y0) + '" width="' + g.pw + '" height="' + r1(g.ph) + '" rx="6"/>');
        // speeding-up / slowing-down bands
        an.intervals.forEach(function(iv){
          if(iv.kind !== 'up' && iv.kind !== 'down') return;
          o.push('<rect class="ml-band ' + (iv.kind === 'up' ? 'is-up' : 'is-dn') + '" x="' + r1(g.gx(iv.a)) + '" y="' + r1(y0) + '" width="' + r1(g.gx(iv.b) - g.gx(iv.a)) + '" height="' + r1(g.ph) + '"' + (iv.kind === 'down' ? ' fill="url(#ml-hatch)"' : '') + '/>');
        });
        var yt = P.ticks(r.lo, r.hi, 3);
        yt.forEach(function(v){ var py = r1(g.gy(k, v)); o.push('<line class="ml-grid' + (Math.abs(v) < 1e-12 ? ' ml-zero' : '') + '" x1="' + g.L + '" y1="' + py + '" x2="' + (g.L + g.pw) + '" y2="' + py + '"/><text class="ml-tk" x="' + (g.L - 5) + '" y="' + (+py + 3.5) + '" text-anchor="end">' + F(v, Math.abs(v) < 10 && Math.abs(v - Math.round(v)) > 1e-9 ? 1 : 0) + '</text>'); });
        o.push('<text class="ml-pl ' + CLS[k] + '" x="' + (g.L + 6) + '" y="' + r1(y0 + 14) + '">' + NAME[k] + '</text>');
        // v mode: the signed area under v from 0 to t
        if(vMode && k === 'v' && t > 0){
          var pos = [], neg = [], n = tb.t.length - 1, iT = Math.round(t / m.T * n);
          for(var i = 0; i <= iT; i++){ var vv = tb.v[i]; pos.push([tb.t[i], Math.max(0, vv)]); neg.push([tb.t[i], Math.min(0, vv)]); }
          pos.push([t, Math.max(0, m.v(t))]); neg.push([t, Math.min(0, m.v(t))]);
          var poly = function(list, cls){ return '<polygon class="ml-area ' + cls + '" points="' + r1(g.gx(0)) + ',' + r1(g.gy('v', 0)) + ' ' + list.map(function(p){ return r1(g.gx(p[0])) + ',' + r1(g.gy('v', p[1])); }).join(' ') + ' ' + r1(g.gx(t)) + ',' + r1(g.gy('v', 0)) + '"/>'; };
          o.push(poly(pos, 'is-pos')); o.push(poly(neg, 'is-neg'));
        }
        // the curve (in v mode, x builds up to t)
        var upto = vMode && k === 'x' ? Math.round(t / m.T * (tb.t.length - 1)) : tb.t.length - 1, pts = [];
        var runs = [], run = [];
        for(var j = 0; j <= upto; j++){
          if(m.pts && k === 'a' && j > 0 && Math.abs(tb.a[j] - tb.a[j - 1]) > 1e-9){ runs.push(run); run = []; }
          run.push(r1(g.gx(tb.t[j])) + ',' + r1(g.gy(k, tb[k][j])));
        }
        runs.push(run);
        runs.forEach(function(rn){ if(rn.length > 1) o.push('<polyline class="ml-curve ' + CLS[k] + '" points="' + rn.join(' ') + '"/>'); });
        if(vMode && k === 'x' && t < m.T) o.push('<text class="ml-note" x="' + r1(Math.min(g.gx(t) + 8, g.L + g.pw - 4)) + '" y="' + r1(y0 + g.ph - 8) + '" text-anchor="' + (g.gx(t) > g.L + g.pw * 0.7 ? 'end' : 'start') + '">x(t) = x(0) + area under v</text>');
        void y1;
      });
      // direction changes, on every panel
      an.turns.forEach(function(z){
        var px = r1(g.gx(z));
        o.push('<line class="ml-turn" x1="' + px + '" y1="' + r1(g.rows.x.y0) + '" x2="' + px + '" y2="' + r1(g.rows.a.y0 + g.ph) + '"/>');
        o.push('<circle class="ml-turn-pt" cx="' + px + '" cy="' + r1(g.gy('v', 0)) + '" r="4"/>');
        if(!vMode || z <= t) o.push('<circle class="ml-turn-pt is-x" cx="' + px + '" cy="' + r1(g.gy('x', ML.xAt(m, z))) + '" r="4"/>');
      });
      // the time axis
      var tt = P.ticks(0, m.T, Math.max(4, Math.round(g.pw / 70)));
      tt = tt.filter(function(v){ return g.gx(v) < g.L + g.pw - 34 || v === 0; });
      o.push('<g class="ml-taxis">' + tt.map(function(v){ var px = r1(g.gx(v)); return '<text x="' + px + '" y="' + (g.h - 7) + '" text-anchor="middle">' + F(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1) + '</text>'; }).join('') + '<text class="ml-tl" x="' + (g.L + g.pw) + '" y="' + (g.h - 7) + '" text-anchor="end">t (s)</text></g>');
      // the cursor
      var cx = r1(g.gx(t));
      o.push('<line class="ml-cur" x1="' + cx + '" y1="' + r1(g.rows.x.y0) + '" x2="' + cx + '" y2="' + r1(g.rows.a.y0 + g.ph) + '"/>');
      [['x', ML.xAt(m, t)], ['v', m.v(t)], ['a', m.a(t)]].forEach(function(p){ o.push('<circle class="ml-cur-pt ' + CLS[p[0]] + '" cx="' + cx + '" cy="' + r1(g.gy(p[0], p[1])) + '" r="5"/>'); });
      graphs.innerHTML = o.join('');
      gwrap.setAttribute('aria-valuenow', M.fixed(t, 2));
      gwrap.setAttribute('aria-valuetext', 't = ' + F(t, 2) + ' s: x = ' + F(ML.xAt(m, t), 2) + ' m, v = ' + F(m.v(t), 2) + ' m/s, a = ' + F(m.a(t), 2) + ' m/s²');
    }

    /* ---------------------------------------------------- words */
    var lastCap = '';
    function words(full){
      var m = mo(), t = st.t, I = info(), an = I.an, d = ML.describe(m, t), x = ML.xAt(m, t), v = m.v(t), a = m.a(t);
      var disp = x - ML.xAt(m, 0), dist = ML.distTo(m, t);
      var body = '<ul class="ml-why">' +
        '<li><b>Direction</b> comes from the sign of $v$: ' + (v > 1e-9 ? '$v(t) > 0$, so the car moves right.' : v < -1e-9 ? '$v(t) < 0$, so the car moves left.' : '$v(t) = 0$ for an instant.') + '</li>' +
        '<li><b>Speed</b> grows when $v$ and $a$ share a sign and shrinks when their signs differ' + (Math.abs(v) > 1e-9 && Math.abs(a) > 1e-6 ? ': here $v ' + (v > 0 ? '> 0' : '< 0') + '$ and $a ' + (a > 0 ? '> 0' : '< 0') + '$, so the car is ' + (v * a > 0 ? 'speeding up' : 'slowing down') + '.' : '.') + ' The sign of $a$ alone never decides it.</li>' +
        '<li><b>Direction changes</b> happen only where $v$ changes sign' + (an.turns.length ? ': at $t \\approx ' + an.turns.map(function(z){ return M.fixed(z, 2); }).join('$ and $t \\approx ') + '$.' : '. This motion never turns around.') + (an.stops.length ? ' Where $v = 0$ without a change of sign, the car only pauses.' : '') + '</li>' +
        (m.mode === 'v' ? '<li><b>Position from velocity:</b> $x(t) = x(0) + \\int_0^t v(s)\\,ds$. Area above the axis moves the car right, area below moves it left. Total distance adds every area as positive: $\\int_0^t |v(s)|\\,ds$.</li>' : '<li><b>From the formula:</b> $v(t) = x\'(t) = ' + m.tex.v + '$ and $a(t) = v\'(t) = ' + m.tex.a + '$.</li>') +
        '</ul>';
      T.explain(host.querySelector('.ml-say') || (LS && LS.root.querySelector('.ml-say')), d.head, html(body));
      details(m, t, x, v, a, disp, dist, an);
      if(LS){ if(d.head !== lastCap){ LS.caption(esc(d.head), 'explore'); lastCap = d.head; } }
      pills();
      if(full) say(d.head);
    }
    function pills(){
      var m = mo(), t = st.t, x = ML.xAt(m, t), v = m.v(t), a = m.a(t), disp = x - ML.xAt(m, 0), dist = m.mode === 'v' ? ML.distTo(m, t) : 0;
      if(LS){
        var narrow = false; try{ narrow = matchMedia('(max-width: 599.98px)').matches; }catch(e){}
        var pills = narrow ? [{ html: '<span class="ml-pk s1">x</span> ' + F(x, 2) + ' · <span class="ml-pk s2">v</span> ' + F(v, 2) + ' · <span class="ml-pk s3">a</span> ' + F(a, 2), tone: 'ghost' }]
          : [{ k: 'x', html: F(x, 2) + ' m', tone: 'readout' }, { k: 'v', html: F(v, 2) + ' m/s', tone: 'readout' }, { k: 'a', html: F(a, 2) + ' m/s²', tone: 'readout' }];
        LS.pills(pills, 'left', 'explore');
        var right = [{ html: 't = ' + F(t, 2) + ' s', tone: st.playing ? 'accent' : 'ghost' }];
        if(m.mode === 'v') right = [{ html: 'Δx ' + F(disp, 2) + ' · distance ' + F(dist, 2), tone: 'ghost' }].concat(narrow ? [] : right);
        LS.pills(right, 'right', 'explore');
      }
    }
    function details(m, t, x, v, a, disp, dist, an){
      var rows = m.mode === 'x'
        ? [['Position', '$x(t) = ' + m.tex.x + '$'], ['Velocity', '$v(t) = x\'(t) = ' + m.tex.v + '$'], ['Acceleration', '$a(t) = v\'(t) = ' + m.tex.a + '$']]
        : m.pts ? [['Velocity', 'the graph: straight pieces through ' + m.pts.map(function(p){ return '(' + p[0] + ', ' + p[1] + ')'; }).join(', ')], ['Start', '$x(0) = ' + m.x0 + '$'], ['Position', '$x(t) = ' + m.x0 + ' + \\int_0^t v(s)\\,ds$']]
        : [['Velocity', '$v(t) = ' + m.tex.v + '$'], ['Acceleration', '$a(t) = v\'(t) = ' + m.tex.a + '$'], ['Start', '$x(0) = ' + m.x0 + '$'], ['Position', '$x(t) = ' + m.x0 + ' + \\int_0^t v(s)\\,ds$' + (m.calc ? ' (no elementary antiderivative: a calculator integrates it)' : '')]];
      var ivs = an.intervals.filter(function(iv){ return iv.kind === 'up' || iv.kind === 'down' || iv.kind === 'steady'; }).map(function(iv){
        return '<tr><td>' + F(iv.a, 2) + ' to ' + F(iv.b, 2) + '</td><td>' + (iv.kind === 'up' ? 'Speeding up' : iv.kind === 'down' ? 'Slowing down' : 'Steady speed') + '</td><td>' + (iv.kind === 'steady' ? 'a = 0' : 'v ' + (m.v((iv.a + iv.b) / 2) > 0 ? '> 0' : '< 0') + ', a ' + (m.a((iv.a + iv.b) / 2) > 0 ? '> 0' : '< 0')) + '</td></tr>';
      }).join('');
      var el = host.querySelector('.ml-det') || (LS && LS.root.querySelector('.ml-det'));
      el.innerHTML = '<h3 class="ls-title-l">' + esc(m.name) + ', 0 ≤ t ≤ ' + F(m.T, 2) + ' s</h3><table class="ls-tbl ml-ftbl"><tbody>' + rows.map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td>' + html(r[1]) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<h3 class="ls-title-l">At t = ' + F(t, 2) + ' s</h3><table class="ls-tbl"><tbody>' +
        [['Position x', F(x, 3) + ' m'], ['Velocity v', F(v, 3) + ' m/s'], ['Speed |v|', F(Math.abs(v), 3) + ' m/s'], ['Acceleration a', F(a, 3) + ' m/s²'], ['Displacement since t = 0', F(disp, 3) + ' m'], ['Distance traveled since t = 0', F(dist, 3) + ' m']]
          .map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td class="r">' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<h3 class="ls-title-l">Speeding up and slowing down</h3><table class="ls-tbl"><thead><tr><th scope="col">t (s)</th><th scope="col">Speed</th><th scope="col">Signs</th></tr></thead><tbody>' + ivs + '</tbody></table>' +
        '<p class="bt-small">Direction changes: ' + (an.turns.length ? an.turns.map(function(z){ return 't ≈ ' + F(z, 3) + ' s'; }).join(', ') : 'none') + '. Numbers for a velocity given by a formula are integrated numerically (adaptive Simpson); straight pieces exactly.</p>';
    }

    /* ---------------------------------------------------- time */
    function draw(full){
      drawTrack(); drawGraphs();
      if(full || !st.playing || (st.t * 5 | 0) !== draw.q){ draw.q = st.t * 5 | 0; words(full); }
      else pills();
      if(Math.abs(slider.value() - st.t) > 1e-6) slider.set(st.t);
    }
    function play(){
      var m = mo();
      if(st.t >= m.T - 1e-6) st.t = 0;
      st.playing = true; touch(); playBtn.textContent = 'Pause';
      loop = P.loop(function(dt){ st.t = Math.min(mo().T, st.t + dt); draw(false); if(st.t >= mo().T) return false; },
        { still: function(){ st.t = mo().T; }, onEnd: function(){ st.playing = false; playBtn.textContent = 'Play'; draw(true); } });
      loop.start();
    }
    function pause(){ if(loop) loop.stop(); if(st.playing){ st.playing = false; playBtn.textContent = 'Play'; draw(true); } }
    playBtn.addEventListener('click', function(){ if(st.playing) pause(); else play(); });
    (function(){
      function toT(e){ var b = graphs.getBoundingClientRect(); if(!gl) return 0; var px = (e.clientX - b.left) * gl.w / b.width; return clamp((px - gl.L) / gl.pw * mo().T, 0, mo().T); }
      var on = false;
      graphs.addEventListener('pointerdown', function(e){ pause(); on = true; try{ graphs.setPointerCapture(e.pointerId); }catch(er){} setT(toT(e)); });
      graphs.addEventListener('pointermove', function(e){ if(on) setT(toT(e)); });
      graphs.addEventListener('pointerup', function(){ on = false; });
      graphs.addEventListener('pointercancel', function(){ on = false; });
      gwrap.addEventListener('keydown', function(e){
        var k = e.key, d = k === 'ArrowRight' || k === 'ArrowUp' ? 1 : k === 'ArrowLeft' || k === 'ArrowDown' ? -1 : 0;
        if(k === 'Home'){ e.preventDefault(); pause(); return setT(0); }
        if(k === 'End'){ e.preventDefault(); pause(); return setT(mo().T); }
        if(!d) return;
        e.preventDefault(); pause(); setT(st.t + d * (e.shiftKey ? 0.5 : 0.05));
      });
    })();
    if(window.ResizeObserver){
      var ro = new ResizeObserver(function(){
        var w1 = Math.round(track.clientWidth), w2 = Math.round(gwrap.clientWidth), h2 = Math.round(gwrap.clientHeight);
        if(tl && w1 === tl.w && gl && w2 === gl.w && h2 === gl.h) return;
        tl = null; gl = null; draw(false);
      });
      ro.observe(track.parentNode); ro.observe(gwrap);
    }

    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'calc-ls-stage ml-ls-stage'; stage.appendChild(host.querySelector('.ml-stage'));
      s.add('stage', stage, o);
      var dock = document.createElement('div'); dock.className = 'calc-ls-dock ml-ls-dock'; dock.appendChild(host.querySelector('.ml-ctl'));
      s.add('dock', dock, o);
      var why = document.createElement('div'); why.className = 'ls-sec calc-ls-why ml-ls-why'; why.appendChild(cue.el); why.appendChild(host.querySelector('.ml-say'));
      s.add('why', why, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      var det = document.createElement('div'); det.className = 'ls-sec calc-ls-det ml-ls-det'; det.appendChild(host.querySelector('.ml-det'));
      s.add('details', det, o);
      lastCap = ''; tl = null; gl = null;
      draw(true);
      if(s.mode() === 'explore') s.hint({ target: playBtn, text: 'Press Play, or drag across the graphs', key: 'apcalc-motion-lab-play' });
    }
    setMotion(st.id);
    return { pause: pause, studio: studio };
  }

  /* ============================================================ test yourself */
  function figure(p){
    var f = p.fig, Tm = f.T, n = 160, ys = [];
    for(var i = 0; i <= n; i++) ys.push(f.f(Tm * i / n));
    var lo = Math.min(0, Math.min.apply(null, ys)), hi = Math.max(0, Math.max.apply(null, ys)), pad = (hi - lo) * 0.12 || 1;
    var spec = { label: f.label + ', for t from 0 to ' + Tm, width: 600, height: 360, x: [0, Tm], y: [lo - pad, hi + pad], xLabel: 't', yLabel: f.kind === 'x' ? 'x(t)' : 'v(t)', xStep: Tm > 6 ? 2 : 1,
      curves: [{ fn: f.f, domain: [0, Tm], cls: f.kind === 'x' ? 's1' : 's2' }], points: [] };
    if(f.pts) spec.points = f.pts.map(function(q){ return { at: q, cls: 's2' }; });
    if(f.mark != null) spec.points.push({ at: [f.mark, f.f(f.mark)], cls: f.kind === 'x' ? 's1' : 's2', label: 't = ' + ML.n(f.mark) });
    if(f.pts){ spec.yStep = 1; }
    try{ return '<div class="ml-figwrap">' + P.svg(spec) + '</div>'; }catch(e){ return ''; }
  }
  /* The Tool Studio captions a problem with its text's textContent, which
     would read each formula twice (MathML plus its TeX annotation). The
     annotation is only for the build's ordering check, so drop it here. */
  function plainCaption(area, p){
    if(area) area.querySelectorAll('.bt-context annotation').forEach(function(a){ a.remove(); });
    // and on the Tool Studio, caption with the formulas rendered (after the frame sets its own)
    var s = area && window.LevlStudio && window.LevlStudio.get && document.getElementById('app').getAttribute('data-studio') ? window.LevlStudio.get() : null;
    if(s && p) setTimeout(function(){ s.caption(String(p.text).replace(/<\/?p[^>]*>/g, ' ').trim(), 'quiz'); }, 0);
  }
  function quiz(host, data){
    T.drill(host, data, { slug: 'motion-lab', noun: 'drill',
      types: ML.KINDS.map(function(k){ return { value: k, label: ML.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: ML.generate, title: function(p){ return p.title; },
      extra: function(el, p, api){ el.innerHTML = figure(p); plainCaption(api.area, p); } });
  }
})();
