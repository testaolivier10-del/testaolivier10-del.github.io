/* Polynomials and rationals (simulator, Unit 1, Premium; docs/apprecalc-spec.md section 6).
   OWNED BY THIS TOOL ONLY (builder T2, docs/apprecalc-briefs/t2.md). The model is
   ApPrecalcMath.polyRational (precalculus/assets/tools/math/poly-rational.js): every
   number and sentence here comes from it; math text is ApPrecalcTex, curve
   sampling ApPrecalcPlot.sample, the frame ApPrecalcTools.modes and drill on
   the Tool Studio.

   Explore: the function is built from its factors. Each factor has a colour,
   the same in the formula, on its pin on the x-axis, in the dock and in the
   tables. Drag a pin (or use the arrow keys) to move the factor; tap a
   factor in the dock to make it a zero, an asymptote or a hole and to set its
   multiplicity. The stage shows the curve (broken at asymptotes), zeros that
   cross or touch, vertical asymptotes with arrows for both one-sided limits,
   holes as open circles, the horizontal or slant asymptote, and the sign
   chart under the graph. The caption reads the chosen factor in words and
   limit notation; Why lists every feature; Formulas & tables holds the
   factored and expanded forms, the feature table and the sign chart.

   Test yourself: ApPrecalcTools.drill over the model's six kinds (zeros and
   multiplicity, polynomial end behavior, horizontal asymptotes, zeros of a
   rational function, vertical asymptotes, holes). The figure builds as you
   answer: each feature appears once its step is answered, the curve at the
   end, and a wrong x-value is drawn dashed where you put it. */
(function(){
  'use strict';
  (function(){ var app = document.getElementById('app'); if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Formulas & tables'); })();
  var T = window.ApPrecalcTools, M = window.ApPrecalcMath, P = window.ApPrecalcPlot;
  if(!T || !M || !M.polyRational || M.polyRational.stub || !P) return;
  var PR = M.polyRational, esc = T.esc;
  function X(){ return window.ApPrecalcTex; }
  function tx(s){ return X() ? X().html(String(s)) : esc(s); }
  function tm(t, d){ return X() ? X().render(t, { display: !!d }) : esc(t); }
  function words(t){ return X() && X().text ? X().text(t) : t; }
  function r1(v){ return Math.round(v * 10) / 10; }
  function mn(s){ return String(s).replace(/-/g, '−'); }
  // a label: halves as decimals (like the factors), anything else exact
  function lab(v){ return mn(Math.abs(v * 2 - Math.round(v * 2)) < 1e-9 ? PR.n(v) : PR.typed(v)); }
  var XW = [-6, 6], MAXF = 5;
  var KIND_WORD = { num: 'Zero', den: 'Asymptote', hole: 'Hole' };

  /* ------------------------------------------------ layout and drawing */
  function niceY(v){
    var steps = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200];
    for(var i = 0; i < steps.length; i++) if(v <= steps[i]) return steps[i];
    return 200;
  }
  function yRange(spec, R){
    var f = sOf(spec), feats = [0].concat(R.zeros.map(function(z){ return z.x; }), R.vas.map(function(v){ return v.x; }), R.holes.map(function(h){ return h.x; }));
    var a = Math.max(XW[0], Math.min.apply(null, feats) - 1.6), b = Math.min(XW[1], Math.max.apply(null, feats) + 1.6), ys = [];
    for(var i = 0; i <= 240; i++){
      var x = a + (b - a) * i / 240;
      if(R.vas.some(function(v){ return Math.abs(x - v.x) < 0.6; })) continue;
      var y = f(x); if(isFinite(y)) ys.push(Math.abs(y));
    }
    ys.sort(function(p, q){ return p - q; });
    // a polynomial: its largest value in the window of its features; a rational
    // function: most of its values (the branches by an asymptote run off anyway)
    var top = !ys.length ? 1 : R.vas.length ? ys[Math.floor(ys.length * 0.8)] : ys[ys.length - 1];
    top = Math.max(top, 2.5);
    R.holes.forEach(function(h){ top = Math.max(top, Math.abs(h.y) * 1.15); });
    if(R.end.kind === 'ha') top = Math.max(top, Math.abs(R.end.ha) * 1.6);
    var Y = niceY(top * 1.2);
    return [-Y, Y];
  }
  function layout(w, h, yr, o){
    o = o || {};
    var ph = w < 420, L = ph ? 30 : 38, Rr = 12, T0 = 10, strip = o.signs === false ? 0 : (ph ? 22 : 26), lab = 18;
    var B = h - lab - (strip ? strip + 8 : 0);
    var G = { w: w, h: h, L: L, R: w - Rr, T: T0, B: B, strip: strip, sy0: B + lab + 2, x: XW, y: yr, phone: ph };
    G.sx = function(v){ return L + (v - XW[0]) / (XW[1] - XW[0]) * (G.R - L); };
    G.sy = function(v){ return T0 + (yr[1] - v) / (yr[1] - yr[0]) * (B - T0); };
    G.ix = function(px){ return XW[0] + (px - L) / (G.R - L) * (XW[1] - XW[0]); };
    G.iy = function(py){ return yr[1] - (py - T0) / (B - T0) * (yr[1] - yr[0]); };
    return G;
  }
  // colour index per factor (stable while the factor exists)
  function fOf(spec){ return spec._f || PR.fn(spec); }
  function sOf(spec){ return spec._f || PR.simple(spec); }
  function cls(f){ return 'pr-c' + ((f.c || 0) % 5 + 1); }
  /* The scene: o.show = { curve, zeros, vas, holes, end, signs } (default all),
     o.marks = [{ x } | { y, at }] student tries (dashed), o.factors for colours. */
  function scene(G, spec, R, o){
    o = o || {}; var S = o.show || {}, on = function(k){ return S[k] !== false; }, out = [], f = fOf(spec);
    var colorAt = function(x){ var hit = (spec.factors || []).filter(function(g){ return g.r === x; })[0]; return hit ? cls(hit) : 'pr-c0'; };
    var yt = P.ticks(G.y[0], G.y[1], G.phone ? 4 : 6), xt = P.ticks(XW[0], XW[1], 12, G.phone ? 2 : 1).filter(function(v){ return Math.abs(v) < XW[1] - 1e-9; });
    out.push('<rect class="pr-bg" x="' + G.L + '" y="' + G.T + '" width="' + r1(G.R - G.L) + '" height="' + r1(G.B - G.T) + '" rx="8"/>');
    out.push('<g class="pr-grid">' + xt.map(function(v){ return '<line x1="' + r1(G.sx(v)) + '" y1="' + G.T + '" x2="' + r1(G.sx(v)) + '" y2="' + G.B + '"/>'; }).join('') +
      yt.map(function(v){ return '<line x1="' + G.L + '" y1="' + r1(G.sy(v)) + '" x2="' + G.R + '" y2="' + r1(G.sy(v)) + '"/>'; }).join('') + '</g>');
    var ax = r1(G.sy(0)), ay = r1(G.sx(0));
    out.push('<g class="pr-axis"><line x1="' + G.L + '" y1="' + ax + '" x2="' + G.R + '" y2="' + ax + '"/><line x1="' + ay + '" y1="' + G.T + '" x2="' + ay + '" y2="' + G.B + '"/></g>');
    out.push('<g class="pr-tk">' + xt.filter(function(v){ return v !== 0; }).map(function(v){ return '<text x="' + r1(G.sx(v)) + '" y="' + r1(G.B + 14) + '" text-anchor="middle">' + mn(v) + '</text>'; }).join('') +
      yt.filter(function(v){ return v !== 0; }).map(function(v){ return '<text x="' + (G.L - 5) + '" y="' + r1(G.sy(v) + 4) + '" text-anchor="end">' + mn(v) + '</text>'; }).join('') + '</g>');
    // asymptotes first, under the curve
    if(on('end') && R.end.kind === 'ha' && R.rational){
      var hy = r1(G.sy(R.end.ha));
      out.push('<line class="pr-ha" x1="' + G.L + '" y1="' + hy + '" x2="' + G.R + '" y2="' + hy + '"/>');
      out.push('<text class="pr-lab pr-lab-ha" x="' + (G.R - 4) + '" y="' + r1(+hy + (R.end.ha >= 0 ? -6 : 14)) + '" text-anchor="end">y = ' + mn(PR.typed(R.end.ha)) + '</text>');
    }
    if(on('end') && R.slant){
      var sl = function(x){ return R.slant.m * x + R.slant.b; }, runs = P.sample(sl, XW[0], XW[1], G, 2);
      if(runs.length){ var a0 = runs[0][0], a1 = runs[0][runs[0].length - 1]; out.push('<line class="pr-ha" x1="' + r1(G.sx(a0[0])) + '" y1="' + r1(G.sy(a0[1])) + '" x2="' + r1(G.sx(a1[0])) + '" y2="' + r1(G.sy(a1[1])) + '"/>'); }
      out.push('<text class="pr-lab pr-lab-ha" x="' + (G.R - 4) + '" y="' + (G.T + 14) + '" text-anchor="end">slant y = ' + mn(PR.typed(R.slant.m)) + 'x ' + (R.slant.b < 0 ? '− ' + mn(PR.typed(-R.slant.b)) : '+ ' + PR.typed(R.slant.b)) + '</text>');
    }
    var labY = [];
    if(on('vas')) R.vas.forEach(function(v){
      var px = r1(G.sx(v.x)), c = colorAt(v.x);
      out.push('<line class="pr-va ' + c + '" x1="' + px + '" y1="' + G.T + '" x2="' + px + '" y2="' + G.B + '"/>');
      var ly = G.T + 13; labY.forEach(function(q){ if(Math.abs(q - px) < 46) ly += 15; }); labY.push(+px);
      out.push('<text class="pr-lab ' + c + '" x="' + r1(+px + 5) + '" y="' + ly + '">x = ' + lab(v.x) + '</text>');
      // the one-sided limits: an arrow on each side, up for ∞, down for −∞
      [['l', v.left, -1], ['r', v.right, 1]].forEach(function(sd){
        var x = +px + sd[2] * 9, up = sd[1] > 0, y = up ? G.T + 30 : G.B - 10;
        out.push('<path class="pr-arrow ' + c + '" d="M' + r1(x - 4) + ' ' + r1(up ? y + 6 : y - 6) + 'L' + r1(x) + ' ' + r1(y) + 'L' + r1(x + 4) + ' ' + r1(up ? y + 6 : y - 6) + '"/>');
      });
    });
    if(on('curve')){
      var runs2 = P.sample(f, XW[0], XW[1], G, 520);
      out.push('<path class="pr-curve" d="' + runs2.map(function(rn){ return 'M' + rn.map(function(p){ return r1(G.sx(p[0])) + ' ' + r1(G.sy(p[1])); }).join('L'); }).join('') + '"/>');
      if(on('end') && R.end.kind !== 'ha'){
        [['l', R.end.left, G.L + 10], ['r', R.end.right, G.R - 10]].forEach(function(e){
          var up = e[1] > 0, y = up ? G.T + 12 : G.B - 12, x = e[2];
          out.push('<text class="pr-end" x="' + r1(x) + '" y="' + r1(y + 4) + '" text-anchor="middle" aria-hidden="true">' + (up ? '▲' : '▼') + '</text>');
        });
      }
    }
    if(on('zeros')) R.zeros.forEach(function(z){
      if(o.pins) return;   // the pin is the zero
      out.push('<circle class="pr-zero ' + colorAt(z.x) + '" cx="' + r1(G.sx(z.x)) + '" cy="' + ax + '" r="5.5"/>');
    });
    if(on('holes')) R.holes.forEach(function(h){
      if(h.y < G.y[0] || h.y > G.y[1]) return;
      var hx = r1(G.sx(h.x)), hyy = r1(G.sy(h.y));
      out.push('<line class="pr-hole-drop ' + colorAt(h.x) + '" x1="' + hx + '" y1="' + ax + '" x2="' + hx + '" y2="' + hyy + '"/>');
      out.push('<circle class="pr-hole ' + colorAt(h.x) + '" cx="' + hx + '" cy="' + hyy + '" r="5.5"/>');
      if(!G.phone || !o.pins) out.push('<text class="pr-lab ' + colorAt(h.x) + '" x="' + r1(+hx + 9) + '" y="' + r1(+hyy - 8) + '">(' + mn(h.x) + ', ' + mn(PR.typed(h.y)) + ')</text>');
    });
    (o.marks || []).forEach(function(m){
      if(m.x != null){ var mx = r1(G.sx(Math.max(XW[0], Math.min(XW[1], m.x)))); out.push('<line class="cd-yours pr-mark" x1="' + mx + '" y1="' + G.T + '" x2="' + mx + '" y2="' + G.B + '"/><text class="cd-yours pr-mark-t" x="' + r1(+mx + 5) + '" y="' + r1(G.B - 8) + '">yours</text>'); }
      else if(m.y != null && m.y >= G.y[0] && m.y <= G.y[1]){ var my = r1(G.sy(m.y)), mxx = r1(G.sx(m.at)); out.push('<circle class="cd-yours pr-mark" cx="' + mxx + '" cy="' + my + '" r="6"/><text class="cd-yours pr-mark-t" x="' + r1(+mxx + 9) + '" y="' + r1(+my + 4) + '">yours</text>'); }
    });
    // the sign chart under the graph, on the same x-scale
    if(G.strip && on('signs')){
      var y0 = G.sy0, hh = G.strip;
      out.push('<g class="pr-signs"><text class="pr-sk" x="' + (G.L - 5) + '" y="' + r1(y0 + hh / 2 + 4) + '" text-anchor="end">sign</text>');
      R.signs.forEach(function(sg){
        var a = Math.max(XW[0], sg.a), b = Math.min(XW[1], sg.b); if(b <= a) return;
        var x1 = G.sx(a), x2 = G.sx(b), wd = x2 - x1;
        out.push('<rect class="pr-sg ' + (sg.s > 0 ? 'is-pos' : 'is-neg') + '" x="' + r1(x1 + 1) + '" y="' + r1(y0) + '" width="' + r1(Math.max(1, wd - 2)) + '" height="' + hh + '" rx="6"/>');
        if(wd > 16) out.push('<text class="pr-sgt" x="' + r1((x1 + x2) / 2) + '" y="' + r1(y0 + hh / 2 + 5) + '" text-anchor="middle">' + (sg.s > 0 ? '+' : '−') + '</text>');
      });
      R.zeros.forEach(function(z){ out.push('<circle class="pr-scut ' + colorAt(z.x) + '" cx="' + r1(G.sx(z.x)) + '" cy="' + r1(y0 + hh / 2) + '" r="4.5"/>'); });
      R.vas.forEach(function(v){ var px = r1(G.sx(v.x)); out.push('<line class="pr-scut-va ' + colorAt(v.x) + '" x1="' + px + '" y1="' + r1(y0 - 2) + '" x2="' + px + '" y2="' + r1(y0 + hh + 2) + '"/>'); });
      R.holes.forEach(function(h){ out.push('<circle class="pr-scut-h ' + colorAt(h.x) + '" cx="' + r1(G.sx(h.x)) + '" cy="' + r1(y0 + hh / 2) + '" r="4"/>'); });
      out.push('</g>');
    }
    return out.join('');
  }
  function srText(spec, R){
    var parts = [words(PR.tex(spec)) + '.'];
    R.zeros.forEach(function(z){ parts.push('Zero at x = ' + z.x + ', multiplicity ' + z.m + ', ' + (z.cross ? 'crosses.' : 'touches.')); });
    R.vas.forEach(function(v){ parts.push('Vertical asymptote x = ' + v.x + ': left side to ' + (v.left > 0 ? 'infinity' : 'negative infinity') + ', right side to ' + (v.right > 0 ? 'infinity.' : 'negative infinity.')); });
    R.holes.forEach(function(h){ parts.push('Hole at (' + h.x + ', ' + PR.typed(h.y) + ').'); });
    parts.push(words(PR.endText(R).replace(/\$([^$]*)\$/g, function(m, t){ return words(t); })));
    return parts.join(' ');
  }
  /* The formula with each factor in its colour: lead · top / bottom. */
  function formulaHtml(spec, name){
    var top = [], bot = [], fs = (spec.factors || []).slice().sort(function(p, q){ return p.r - q.r; });
    function piece(f, m){ var t = PR.lin(f.r); if(m > 1) t = (t === 'x' ? 'x' : t) + '^{' + m + '}'; return '<span class="pr-fx ' + cls(f) + '">' + tm(t) + '</span>'; }
    fs.forEach(function(f){ if(f.where === 'hole'){ top.push(piece(f, 1)); bot.push(piece(f, 1)); } else (f.where === 'den' ? bot : top).push(piece(f, f.m)); });
    var a = spec.a, lead = a === 1 && (top.length || bot.length) ? '' : a === -1 && (top.length || bot.length) ? tm('-') : tm(PR.n(a));
    var body = bot.length ? '<span class="pr-frac"><span class="pr-num">' + (top.join('') || tm('1')) + '</span><span class="pr-den">' + bot.join('') + '</span></span>' : top.join('');
    return '<span class="pr-formula-in" aria-hidden="true">' + tm((name || 'f') + '(x) =') + ' ' + lead + body + '</span><span class="sr-only">' + esc(words(PR.tex(spec, name))) + '</span>';
  }
  function fitSvg(wrap, svg, draw){
    var last = '';
    function go(){ var w = Math.max(260, Math.round(wrap.clientWidth || 600)), h = Math.max(220, Math.round(wrap.clientHeight || 380)); if(w + 'x' + h === last) return; last = w + 'x' + h; draw(w, h); }
    if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(go, 40); }).observe(wrap); }
    return { now: function(){ last = ''; go(); } };
  }

  T.mount('poly-rational', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'poly-rational',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } },
      onShow: function(m){ if(m === 'explore' && ex) ex.redraw(); } });
  });

  /* ============================================================ explore */
  function explore(host, data){
    var presets = (data.presets || []).map(function(p){ return p.id; }).filter(function(id){ return PR.PRESETS[id]; });
    if(!presets.length) presets = PR.PRESET_ORDER.slice();
    var st = { spec: null, sel: 0, touched: false, next: 0 }, LS = null;
    var cue = T.cue('Drag a colored pin along the x-axis, or tap a factor below to make it a zero, an asymptote or a hole.');
    host.innerHTML =
      '<section class="bt-problem pr-card" aria-label="Polynomial and rational function builder">' +
        '<div class="pr-stage">' +
          '<p class="pr-formula"></p>' +
          '<div class="pr-plotwrap"><svg class="pr-svg" role="group" aria-roledescription="graph"><g class="pr-layer"></g></svg></div>' +
          '<p class="pr-legend" aria-hidden="true"><span class="pr-lg pr-lg-z">zero pin</span><span class="pr-lg pr-lg-v">asymptote pin</span><span class="pr-lg pr-lg-h">hole pin</span><span class="pr-lg pr-lg-s">sign of f</span></p>' +
        '</div>' +
        '<div class="pr-ctl">' +
          '<div class="pr-chips ls-scroll" role="group" aria-label="Factors"></div>' +
          '<div class="pr-edit" role="group" aria-label="The chosen factor">' +
            '<div class="pr-kind ls-seg" role="group" aria-label="Where the factor goes"><button type="button" class="bt-mode" data-k="num">Zero</button><button type="button" class="bt-mode" data-k="den">Asymptote</button><button type="button" class="bt-mode" data-k="hole">Hole</button></div>' +
            '<div class="pr-mult" role="group" aria-label="Multiplicity"><button type="button" class="bt-step pr-m-" aria-label="Lower multiplicity">−</button><span class="pr-mv" aria-live="polite"></span><button type="button" class="bt-step pr-m+" aria-label="Raise multiplicity">+</button></div>' +
            '<button type="button" class="bt-btn pr-del" aria-label="Remove this factor">Remove</button>' +
          '</div>' +
        '</div>' +
        '<div class="pr-say"></div>' +
        '<div class="pr-det"></div>' +
        T.moreHtml('<div class="pr-presets" role="group" aria-label="Start from"></div><div class="pr-aslot"></div>') +
        '<p class="sr-only pr-live"></p>' +
      '</section>';
    var card = host.querySelector('.pr-card');
    card.insertBefore(cue.el, card.querySelector('.pr-say'));
    var svg = host.querySelector('.pr-svg'), layer = host.querySelector('.pr-layer'), wrap = host.querySelector('.pr-plotwrap'), chips = host.querySelector('.pr-chips');
    var say = T.announcer(host.querySelector('.pr-live')), pins = [], G = null;
    var aSl = T.slider({ label: 'Leading coefficient a', min: -3, max: 3, step: 0.25, value: 1, decimals: 2, onInput: function(v){ if(Math.abs(v) < 1e-9) v = v >= 0 ? 0.25 : -0.25; st.spec.a = v; touch(); draw(true); } });
    host.querySelector('.pr-aslot').appendChild(aSl.el);
    var presetsEl = host.querySelector('.pr-presets');
    presetsEl.innerHTML = '<p class="bt-small">Start from</p>' + presets.map(function(id){ return '<button type="button" class="bt-btn pr-pre" data-id="' + id + '">' + esc(PR.PRESETS[id].name) + '</button>'; }).join('');
    presetsEl.addEventListener('click', function(e){ var b = e.target.closest('.pr-pre'); if(b){ touch(); load(b.getAttribute('data-id')); say('Started from: ' + PR.PRESETS[b.getAttribute('data-id')].name + '.'); } });
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }
    function load(id){
      st.spec = PR.clone(PR.PRESETS[id].spec); st.next = 0;
      st.spec.factors.forEach(function(f){ f.c = st.next++; });
      st.sel = 0; aSl.set(st.spec.a);
      presetsEl.querySelectorAll('.pr-pre').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-id') === id)); });
      buildPins(); draw(true);
    }
    function sel(){ return st.spec.factors[st.sel]; }
    function free(x, me){ return !st.spec.factors.some(function(f){ return f !== me && f.r === x; }); }
    function snap(x){ return Math.max(-5.5, Math.min(5.5, Math.round(x * 2) / 2)); }

    /* pins: one draggable handle per factor, on the x-axis */
    var live = { x: XW, sx: function(v){ return G ? G.sx(v) : 0; }, sy: function(v){ return G ? G.sy(v) : 0; }, ix: function(p){ return G ? G.ix(p) : 0; }, iy: function(p){ return G ? G.iy(p) : 0; } };
    function pinLabel(f){ return 'Factor ' + words(PR.lin(f.r)) + ', ' + KIND_WORD[f.where].toLowerCase() + (f.where !== 'hole' && f.m > 1 ? ' of multiplicity ' + f.m : '') + ': position on the x-axis'; }
    function buildPins(){
      pins.forEach(function(p){ if(p.h.el.parentNode) p.h.el.parentNode.removeChild(p.h.el); });
      pins = [];
      if(!G) return;
      st.spec.factors.forEach(function(f, i){
        var h = P.draggable(svg, live, { x: f.r, y: 0, axis: 'x', step: 0.5, label: pinLabel(f),
          constrain: function(nx){ var v = snap(nx); return [free(v, f) ? v : f.r, 0]; },
          onMove: function(nx){ if(nx !== f.r){ f.r = nx; touch(); st.sel = st.spec.factors.indexOf(f); draw(false); } },
          onEnd: function(){ draw(true); } });
        h.el.classList.add('pr-pin', cls(f), 'is-' + f.where);
        h.el.addEventListener('focus', function(){ if(st.sel !== st.spec.factors.indexOf(f)){ st.sel = st.spec.factors.indexOf(f); draw(false); } });
        pins.push({ f: f, h: h });
      });
    }
    function placePins(){
      pins.forEach(function(p){
        p.h.set(p.f.r, 0, true);
        p.h.el.setAttribute('aria-label', pinLabel(p.f));
        p.h.el.setAttribute('aria-valuemin', '-5.5'); p.h.el.setAttribute('aria-valuemax', '5.5');
        p.h.el.setAttribute('aria-valuetext', 'x = ' + p.f.r);
        p.h.el.classList.toggle('is-sel', p.f === sel());
        ['num', 'den', 'hole'].forEach(function(k){ p.h.el.classList.toggle('is-' + k, p.f.where === k); });
      });
    }

    /* the dock */
    function chipsHtml(){
      return st.spec.factors.map(function(f, i){
        var t = PR.lin(f.r); if(f.where !== 'hole' && f.m > 1) t = t + '^{' + f.m + '}';
        var sub = f.where === 'hole' ? 'hole' : f.where === 'den' ? 'asymptote' : 'zero';
        return '<button type="button" class="pr-chip ' + cls(f) + '" data-i="' + i + '" aria-pressed="' + (i === st.sel) + '" aria-label="' + esc(words(PR.lin(f.r)) + ', ' + sub + (f.where !== 'hole' && f.m > 1 ? ' of multiplicity ' + f.m : '')) + '">' +
          '<span class="pr-chip-m" aria-hidden="true">' + tm(t) + '</span><span class="pr-chip-k" aria-hidden="true">' + sub + '</span></button>';
      }).join('') + (st.spec.factors.length < MAXF ? '<button type="button" class="pr-chip pr-add" aria-label="Add a factor"><span class="pr-chip-m" aria-hidden="true">+</span><span class="pr-chip-k">factor</span></button>' : '');
    }
    chips.addEventListener('click', function(e){
      var b = e.target.closest('.pr-chip'); if(!b) return; touch();
      if(b.classList.contains('pr-add')){
        var x = [0, 1, -1, 2, -2, 3, -3, 4, -4, 0.5, -0.5, 1.5, -1.5, 5, -5].filter(function(v){ return free(v); })[0];
        if(x == null) return;
        st.spec.factors.push({ r: x, m: 1, where: 'num', c: st.next++ }); st.sel = st.spec.factors.length - 1;
        buildPins(); draw(true); say('Added the factor ' + words(PR.lin(x)) + ' as a zero.');
        var nb = chips.querySelector('[data-i="' + st.sel + '"]'); if(nb) nb.focus();
        return;
      }
      st.sel = +b.getAttribute('data-i'); draw(true);
    });
    var kindEl = host.querySelector('.pr-kind');
    kindEl.addEventListener('click', function(e){
      var b = e.target.closest('.bt-mode'); if(!b || !sel()) return; touch();
      sel().where = b.getAttribute('data-k'); if(sel().where === 'hole') sel().m = 1;
      draw(true);
    });
    host.querySelector('.pr-m-').addEventListener('click', function(){ var f = sel(); if(f && f.where !== 'hole' && f.m > 1){ f.m--; touch(); draw(true); } });
    host.querySelector('.pr-m\\+').addEventListener('click', function(){ var f = sel(); if(f && f.where !== 'hole' && f.m < 3){ f.m++; touch(); draw(true); } });
    host.querySelector('.pr-del').addEventListener('click', function(){
      if(!sel()) return; touch(); var w = words(PR.lin(sel().r));
      st.spec.factors.splice(st.sel, 1); st.sel = Math.max(0, Math.min(st.sel, st.spec.factors.length - 1));
      buildPins(); draw(true); say('Removed the factor ' + w + '.');
    });
    function dock(){
      var f = sel(), fc = chips.querySelector(':focus'), fi = fc ? fc.getAttribute('data-i') : null;
      chips.innerHTML = chipsHtml();
      if(fi != null){ var again = chips.querySelector('[data-i="' + fi + '"]'); if(again) again.focus(); }
      var edit = $('.pr-edit');
      edit.hidden = !f;
      if(!f) return;
      kindEl.querySelectorAll('.bt-mode').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === f.where)); });
      $('.pr-mv').innerHTML = f.where === 'hole' ? '<span class="bt-small">once each</span>' : '<b>×' + f.m + '</b><span class="sr-only"> multiplicity</span>';
      $('.pr-m-').disabled = f.where === 'hole' || f.m <= 1; $('.pr-m\\+').disabled = f.where === 'hole' || f.m >= 3;
      edit.className = 'pr-edit ' + cls(f);
    }
    function $(s){ return host.querySelector(s) || (LS ? LS.root.querySelector(s) : null); }

    /* words */
    var lastCap = '';
    function featureOf(f, R){
      var z = R.zeros.filter(function(q){ return q.x === f.r; })[0], v = R.vas.filter(function(q){ return q.x === f.r; })[0], h = R.holes.filter(function(q){ return q.x === f.r; })[0];
      return z ? PR.zeroText(z) : v ? PR.vaText(v) : h ? PR.holeText(h) : '';
    }
    function words2(R){
      var f = sel(), head = f ? featureOf(f, R) : PR.endText(R);
      var items = [PR.endText(R)].concat(st.spec.factors.slice().sort(function(p, q){ return p.r - q.r; }).map(function(g){ return '<span class="pr-dot ' + cls(g) + '" aria-hidden="true"></span>' + featureOf(g, R); }));
      if(R.slant) items.push('Slant asymptote $y = ' + PR.n(R.slant.m) + 'x ' + (R.slant.b < 0 ? '- ' + PR.n(-R.slant.b) : '+ ' + PR.n(R.slant.b)) + '$: the quotient when the numerator is divided by the denominator.');
      var body = '<ol class="pr-feats">' + items.map(function(t){ return '<li>' + tx(t) + '</li>'; }).join('') + '</ol>' +
        '<p class="pr-rule"><b>Asymptote or hole?</b> Cancel common factors first. A factor that cancels is a hole; a factor left in the denominator is a vertical asymptote, and each side needs its own one-sided limit.</p>' +
        '<p class="pr-rule"><b>Cross or touch?</b> Odd multiplicity crosses the $x$-axis, even multiplicity touches it and turns back.</p>';
      T.explain($('.pr-say'), tx(head), tx(body));
      var pills = [{ k: 'degree', html: R.rational ? R.degN + ' over ' + R.degD : String(R.degN), tone: 'readout' }];
      if(R.end.kind === 'ha') pills.push({ k: R.rational ? 'HA' : 'f', html: 'y = ' + mn(PR.typed(R.end.ha)), tone: 'readout' });
      else pills.push({ k: 'ends', html: (R.end.left > 0 ? '↖' : '↙') + ' ' + (R.end.right > 0 ? '↗' : '↘'), tone: 'readout' });
      if(R.yint != null && isFinite(R.yint) && !(G && G.phone)) pills.push({ k: 'f(0)', html: mn(PR.typed(R.yint)), tone: 'readout' });
      if(LS){ if(head !== lastCap){ LS.caption(tx(head), 'explore'); lastCap = head; } LS.pills(pills, 'left', 'explore'); }
      // Details
      var A = PR.analyze(st.spec);
      var rows = st.spec.factors.slice().sort(function(p, q){ return p.r - q.r; }).map(function(g){
        var z = A.zeros.filter(function(q){ return q.x === g.r; })[0], v = A.vas.filter(function(q){ return q.x === g.r; })[0], h = A.holes.filter(function(q){ return q.x === g.r; })[0];
        var what = z ? 'zero, ' + (z.cross ? 'crosses' : 'touches') : v ? 'vertical asymptote' : h ? 'hole at y = ' + mn(PR.typed(h.y)) : 'cancels';
        var lims = v ? tm(PR.limTex(PR.n(v.x) + '^{-}', PR.infTex(v.left))) + '<br>' + tm(PR.limTex(PR.n(v.x) + '^{+}', PR.infTex(v.right))) : h ? tm(PR.limTex(PR.n(h.x), PR.frac(h.y))) : '';
        return '<tr><td><span class="pr-dot ' + cls(g) + '" aria-hidden="true"></span>' + tm(PR.lin(g.r)) + '</td><td>' + (g.where === 'hole' ? 'top and bottom' : (g.where === 'den' ? 'bottom' : 'top') + (g.m > 1 ? ', ×' + g.m : '')) + '</td><td>' + esc(what) + '</td><td>' + lims + '</td></tr>';
      }).join('');
      var signRows = A.signs.map(function(sg){ return '<tr><td>' + tm('(' + (isFinite(sg.a) ? PR.n(sg.a) : '-\\infty') + ', ' + (isFinite(sg.b) ? PR.n(sg.b) : '\\infty') + ')') + '</td><td class="r">' + mn(PR.n(sg.at)) + '</td><td class="r">' + mn(M.fixed(PR.simple(st.spec)(sg.at), 3)) + '</td><td>' + (sg.s > 0 ? '+' : '−') + '</td></tr>'; }).join('');
      $('.pr-det').innerHTML = '<h3 class="ls-title-l">The function</h3><p class="pr-dform">' + tm(PR.tex(st.spec), true) + '</p><p class="pr-dform">' + tm(PR.expanded(st.spec), true) + '</p>' +
        (rows ? '<h3 class="ls-title-l">Each factor</h3>' + T.wrapTables('<table class="ls-tbl pr-tbl"><caption class="sr-only">Each factor</caption><thead><tr><th scope="col">Factor</th><th scope="col">Where</th><th scope="col">Feature</th><th scope="col">Limits</th></tr></thead><tbody>' + rows + '</tbody></table>') : '') +
        '<h3 class="ls-title-l">Sign chart</h3>' + T.wrapTables('<table class="ls-tbl"><caption class="sr-only">Sign chart</caption><thead><tr><th scope="col">Interval</th><th scope="col" class="r">Test x</th><th scope="col" class="r">f(test x)</th><th scope="col">Sign</th></tr></thead><tbody>' + signRows + '</tbody></table>') +
        '<p class="bt-small">The sign can change only at a zero of odd multiplicity or an asymptote of odd power. A hole never changes it.</p>';
      return head;
    }
    function draw(full){
      var R = PR.analyze(st.spec);
      var w = Math.max(260, Math.round(wrap.clientWidth || 600)), h = Math.max(220, Math.round(wrap.clientHeight || 380));
      var first = !G;
      G = layout(w, h, yRange(st.spec, R));
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      layer.innerHTML = scene(G, st.spec, R, { pins: true });
      if(first || pins.length !== st.spec.factors.length) buildPins();
      placePins();
      svg.setAttribute('aria-label', 'Graph of ' + srText(st.spec, R));
      $('.pr-formula').innerHTML = formulaHtml(st.spec);
      dock();
      var head = words2(R);
      if(full){ var d = document.createElement('div'); d.innerHTML = tx(head); say(T.plainText(d)); }
    }
    var fit = fitSvg(wrap, svg, function(){ G = null; draw(false); });
    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'pcalc-ls-stage pr-ls-stage'; stage.appendChild(host.querySelector('.pr-stage')); s.add('stage', stage, o);
      var dk = document.createElement('div'); dk.className = 'pcalc-ls-dock pr-ls-dock'; dk.appendChild(host.querySelector('.pr-ctl')); s.add('dock', dk, o);
      var why = document.createElement('div'); why.className = 'ls-sec pcalc-ls-why pr-ls-why'; why.appendChild(cue.el); why.appendChild(host.querySelector('.pr-say')); s.add('why', why, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      var det = document.createElement('div'); det.className = 'ls-sec pcalc-ls-det pr-ls-det'; det.appendChild(host.querySelector('.pr-det'));
      var more = host.querySelector('details.bt-more'); if(more){ more.open = true; more.classList.add('pcalc-ls-more'); det.appendChild(more); }
      s.add('details', det, o);
      lastCap = ''; G = null; draw(false);
      if(s.mode() === 'explore' && pins[0]) s.hint({ target: pins[0].h.el, text: 'Drag a pin along the x-axis', key: 'apprecalc-poly-rational-pin' });
    }
    load(presets[0]);
    return { studio: studio, redraw: function(){ G = null; fit.now(); } };
  }

  /* ============================================================ test yourself */
  function texify(p){
    p.text = '<p>' + tx(p.text) + '</p>'; p.solution = p.solution.map(tx);
    p.steps.forEach(function(s){
      s.label = tx(s.label); if(s.hint) s.hint = tx(s.hint);
      if(s.options) s.options = s.options.map(function(o){ return '<span class="pr-opt">' + tx(o) + '</span>'; });
      if(s.why) s.why = s.why.map(tx);
      if(s.cell && s.cell.mistakes) s.cell.mistakes.forEach(function(m){ m.why = tx(m.why); });
    });
    return p;
  }
  // Which features each kind's steps reveal on the figure, and which steps are x-values.
  var REVEAL = {
    zeros: { touch: ['zeros'], pass: ['curve', 'end', 'signs'] },
    end: { right: ['curve'], left: ['end', 'zeros', 'signs'] },
    ha: { ha: ['end'], lim: ['curve', 'vas', 'zeros', 'holes', 'signs'] },
    rzeros: { zero: ['zeros'], sign: ['signs', 'vas'], at: ['holes', 'curve', 'end'] },
    va: { x: ['vas'], right: ['curve', 'zeros', 'end', 'signs'] },
    hole: { hx: [], hy: ['holes'], va: ['vas', 'curve', 'zeros', 'end', 'signs'] }
  };
  var XSTEP = { touch: 1, zero: 1, x: 1, hx: 1, va: 1 };
  var METHOD = {
    deg: 'Add the exponents of every factor; a factor without an exponent counts 1.',
    touch: 'Find the factor with an even exponent. Its zero is where the graph touches and turns back.',
    pass: 'Odd multiplicity crosses; 1 crosses like a line, 3 or more flattens as it crosses.',
    lead: 'Multiply the constant in front by the x-coefficient of each factor (a factor written c − x contributes −1).',
    right: 'Leading term a·xⁿ: for large positive x its sign is the sign of a.',
    left: 'For large negative x, xⁿ is positive when n is even and negative when n is odd; then multiply by the sign of a.',
    compare: 'The degree is the highest power of x on each line.',
    ha: 'Denominator higher: y = 0. Equal: the ratio of the leading coefficients. Numerator higher: none.',
    lim: 'Write the end behavior as lim as x → ∞ of r(x) = the value (or ∞, −∞).',
    zero: 'Cancel common factors first; a zero makes the numerator 0 and the denominator not 0.',
    sign: 'Pick a test value in each interval and find the sign of every factor there.',
    at: 'A factor on both lines cancels: hole. A factor left in the denominator: asymptote.',
    x: 'The denominator is 0 and the numerator is not.',
    hx: 'The hole is where the canceled factor is 0.',
    hy: 'Cancel the common factor, then put the hole\'s x into what is left.',
    va: 'Look for the factor left in the denominator after canceling.'
  };
  function quiz(host, data){
    var cur = null;
    T.drill(host, data, { slug: 'poly-rational', noun: 'drill', typeLabel: 'Problem type',
      types: PR.KINDS.map(function(k){ return { value: k, label: PR.TITLE[k] }; }),
      generate: function(r, ctx, type){ return texify(PR.generate(r, ctx, type)); },
      title: function(p){ return p.title; },
      extra: function(el, p){ cur = figure(el, p); },
      onStep: function(s){ if(cur) cur.reveal(s.key); },
      onTry: function(s, t){ if(!cur) return false; if(t.shown || t.ok) return false; if(XSTEP[s.key] && isFinite(t.value)){ cur.mark({ x: t.value }); return true; } if(s.key === 'hy' && isFinite(t.value)){ cur.mark({ y: t.value, at: cur.p.values.h }); return true; } return false; },
      method: function(s){ return METHOD[s.key] || ''; }
    });
  }
  function figure(el, p){
    var spec = p.fig || (p.poly ? polySpec(p.poly) : null);
    // each factor its own colour, as in Explore
    if(p.fig) spec = { a: p.fig.a, factors: p.fig.factors.map(function(f, i){ return { r: f.r, m: f.m, where: f.where, c: i }; }) };
    var box = document.createElement('div'); box.className = 'pr-figwrap';
    box.innerHTML = '<p class="pr-formula pr-fig-formula"></p><div class="pr-plotwrap pr-fig-plot"><svg class="pr-svg" role="img"><g class="pr-layer"></g></svg></div>';
    el.appendChild(box);
    var shown = { curve: false, zeros: false, vas: false, holes: false, end: false, signs: false }, marks = [], svg = box.querySelector('svg'), wrap = box.querySelector('.pr-fig-plot');
    var formula = box.querySelector('.pr-fig-formula');
    var m = /<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/.exec(p.text);
    formula.innerHTML = m ? tm(m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'), true) : '';
    function draw(){
      if(!spec){ svg.innerHTML = ''; return; }
      var R = spec.analyze ? spec.R : PR.analyze(spec.spec || spec), sp = spec.spec || spec;
      var w = Math.max(260, Math.round(wrap.clientWidth || 420)), h = Math.max(200, Math.round(wrap.clientHeight || 300));
      var G = layout(w, h, yRange(sp, R), { signs: true });
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svg.querySelector('.pr-layer').innerHTML = scene(G, sp, R, { show: shown, marks: marks });
      var vis = Object.keys(shown).filter(function(k){ return shown[k]; });
      svg.setAttribute('aria-label', vis.length ? 'Graph so far: ' + srText(sp, R) : 'Empty axes: the graph builds as you answer.');
    }
    fitSvg(wrap, svg, draw).now();
    setTimeout(draw, 0);
    return { p: p,
      reveal: function(key){ (REVEAL[p.type][key] || []).forEach(function(k){ shown[k] = true; }); marks = []; if(key === p.steps[p.steps.length - 1].key) Object.keys(shown).forEach(function(k){ shown[k] = true; }); draw(); },
      mark: function(mk){ marks = [mk]; draw(); } };
  }
  // The horizontal-asymptote problems give polynomials by coefficients: a spec-like
  // object the scene can draw (its own fn, no factors).
  function polySpec(poly){
    var ev = function(c, x){ return c.reduce(function(a, k, i){ return a + k * Math.pow(x, i); }, 0); };
    var f = function(x){ return ev(poly.num, x) / ev(poly.den, x); };
    var nd = poly.num.length - 1, k = poly.den.length - 1, lead = poly.num[nd] / poly.den[k];
    var zs = M.roots(function(x){ return ev(poly.num, x); }, -6, 6, 600), ps = M.roots(function(x){ return ev(poly.den, x); }, -6, 6, 600);
    var vas = ps.map(function(x){ var l = f(x - 1e-6), r = f(x + 1e-6); return { x: x, left: l > 0 ? 1 : -1, right: r > 0 ? 1 : -1, k: 1 }; });
    var end = nd < k ? { kind: 'ha', ha: 0 } : nd === k ? { kind: 'ha', ha: lead } : { kind: 'grow', left: (nd - k) % 2 ? -Math.sign(lead) : Math.sign(lead), right: Math.sign(lead) };
    var cuts = zs.concat(ps).sort(function(a, b){ return a - b; }), edges = [-Infinity].concat(cuts, [Infinity]), signs = [];
    for(var i = 0; i < edges.length - 1; i++){ var a = edges[i], b = edges[i + 1], at = !isFinite(a) && !isFinite(b) ? 0 : !isFinite(a) ? b - 1 : !isFinite(b) ? a + 1 : (a + b) / 2; signs.push({ a: a, b: b, s: f(at) > 0 ? 1 : -1, at: at }); }
    var R = { zeros: zs.map(function(x){ return { x: x, m: 1, cross: true }; }), vas: vas, holes: [], end: end, slant: null, signs: signs, rational: true };
    // a stand-in spec that carries its own evaluation (fOf, sOf)
    return { analyze: true, R: R, spec: { a: 1, factors: [], _f: f } };
  }
})();
