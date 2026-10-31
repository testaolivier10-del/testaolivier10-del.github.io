/* Taylor lab: the page script (docs/apcalcbc-architecture.md, "Trainers"; spec section 6).
   OWNED BY THIS TOOL ONLY (builder T1). Runs on calculus-bc/tools/taylor-lab.html on top of
   AB's framework (ApCalcTools), plots (ApCalcPlot) and math text (ApCalcTex), with its own
   model ApCalcMath.taylorLab (calculus-bc/assets/tools/math/taylor-lab.js).

   Explore: f (crimson) and its Taylor polynomial P_n (blue) on the stage; the center is a
   point on f you drag along the curve; a second marker on the x-axis is the point where the
   error is measured (the gap between f and P_n drawn there). The shaded band is the Lagrange
   bound P_n(x) +- M|x - c|^(n+1)/(n+1)! (M the largest |f^(n+1)| between c and x), or the
   alternating series bound where it applies; the curve stays inside it. Dock: the function,
   the degree n, the center c and the band. Why: P_n written out term by term, and why the
   bound is what it is. Details: the coefficient table and the numbers.
   Test yourself: ApCalcTools.drill with four kinds (coef, maclaurin, lagrange, altbound);
   each figure grows with the steps (tangent line, then P_2, P_3 ...), a typed polynomial is
   drawn dashed against the function, and the bound appears as a bracket at x. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot;
  if(!T || !M || !M.taylorLab || !P) return;
  var TL = M.taylorLab, esc = T.esc, NS = 'http://www.w3.org/2000/svg';
  function tex(s, o){ return window.ApCalcTex ? window.ApCalcTex.render(s, o || {}) : esc(s); }
  function html(s){ return window.ApCalcTex ? window.ApCalcTex.html(s) : esc(s); }
  function plainTex(s){ return window.ApCalcTex ? window.ApCalcTex.text(s) : s; }
  function r2(v){ return Math.round(v * 100) / 100; }
  function num(v, d){ return isFinite(v) ? T.F(v, d == null ? 3 : d) : '—'; }
  function sig(v){ if(!isFinite(v)) return '—'; var a = Math.abs(v); return a !== 0 && (a < 0.001 || a >= 1e5) ? v.toExponential(2).replace('-', '−') : T.F(v, a < 1 ? 4 : 3); }
  function sigTex(v){ return sig(v).replace('−', '-').replace(/e([+-]?\d+)$/, function(m, e){ return ' \\times 10^{' + (+e) + '}'; }); }

  T.mount('taylor-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'taylor-lab', explore: function(h){ ex = explore(h, data); }, quiz: function(h){ quiz(h, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* Curves as SVG paths, broken where f is undefined or leaves the view far. */
  function pathOf(f, a, b, F, y, n){
    var out = '', pen = false, N = n || 320, lo = y[0] - (y[1] - y[0]) * 2, hi = y[1] + (y[1] - y[0]) * 2;
    for(var i = 0; i <= N; i++){
      var x = a + (b - a) * i / N, v = f(x);
      if(!isFinite(v) || v < lo || v > hi){ pen = false; continue; }
      out += (pen ? 'L' : 'M') + r2(F.sx(x)) + ' ' + r2(F.sy(v)); pen = true;
    }
    return out;
  }
  /* A band between lo(x) and hi(x) where defined: one closed path per run. */
  function bandOf(xs, lo, hi, F, y){
    var out = '', run = [], cl = function(v){ return Math.max(y[0] - (y[1] - y[0]), Math.min(y[1] + (y[1] - y[0]), v)); };
    function flush(){ if(run.length > 1){ out += 'M' + run.map(function(p){ return r2(F.sx(p[0])) + ' ' + r2(F.sy(cl(p[2]))); }).join('L') + 'L' + run.slice().reverse().map(function(p){ return r2(F.sx(p[0])) + ' ' + r2(F.sy(cl(p[1]))); }).join('L') + 'Z'; } run = []; }
    xs.forEach(function(x, i){ if(isFinite(lo[i]) && isFinite(hi[i])) run.push([x, lo[i], hi[i]]); else flush(); });
    flush();
    return out;
  }
  /* A drag handle on an SVG (pointer + keyboard), along x. o: { x, y, F, label, step, clamp(x) -> x, onMove(x), onEnd(), cls } */
  function handle(svg, o){
    var g = document.createElementNS(NS, 'g'), x = o.x, y = o.y, F = o.F;
    g.setAttribute('class', 'tl-handle ' + (o.cls || '')); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'slider');
    g.setAttribute('aria-valuemin', String(o.min)); g.setAttribute('aria-valuemax', String(o.max));
    g.innerHTML = '<circle class="tl-hitc" r="22"/><circle class="tl-halo" r="15"/><circle class="tl-dot" r="' + (o.r || 7) + '"/>';
    svg.appendChild(g);
    function place(){ g.setAttribute('transform', 'translate(' + r2(F.sx(x)) + ' ' + r2(F.sy(y(x))) + ')'); g.setAttribute('aria-valuenow', String(+x.toFixed(2))); g.setAttribute('aria-valuetext', o.label(x)); g.setAttribute('aria-label', o.label(x)); }
    function set(nx, fire){ x = o.clamp(nx); place(); if(fire && o.onMove) o.onMove(x); }
    var on = false;
    function local(e){ var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(); return F.ix((m ? pt.matrixTransform(m.inverse()) : pt).x); }
    g.addEventListener('pointerdown', function(e){ on = true; try{ g.setPointerCapture(e.pointerId); }catch(err){} g.classList.add('is-drag'); e.preventDefault(); e.stopPropagation(); });
    g.addEventListener('pointermove', function(e){ if(on) set(local(e), true); });
    function up(){ if(!on) return; on = false; g.classList.remove('is-drag'); if(o.onEnd) o.onEnd(x); }
    g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    g.addEventListener('keydown', function(e){
      var k = e.key, st = o.step * (e.shiftKey ? 5 : 1);
      if(k === 'ArrowRight' || k === 'ArrowUp') set(x + st, true); else if(k === 'ArrowLeft' || k === 'ArrowDown') set(x - st, true);
      else if(k === 'Home') set(o.min, true); else if(k === 'End') set(o.max, true); else return;
      e.preventDefault(); if(o.onEnd) o.onEnd(x);
    });
    place();
    return { el: g, set: set, get: function(){ return x; } };
  }
  function cTex(c){ return c === 0 ? 'x' : '(x ' + (c < 0 ? '+ ' : '- ') + num(Math.abs(c), 2).replace(/\.?0+$/, '') + ')'; }

  /* =========================================================== explore */
  function explore(host, data){
    var F = TL.funcById('exp'), c = 0, n = 2, xe = 1, band = 'lag', LS = null, touched = false, nid = T.nid('tl'), svg = null, Fr = null, view = null;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem tl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Taylor polynomial explorer</h2>' +
      '<div class="tl-fig"><p class="tl-eq"></p><div class="tl-plot"></div><p class="tl-key" aria-hidden="true"><span class="tl-k-f">f</span><span class="tl-k-p">P<sub>n</sub></span><span class="tl-k-b">error bound</span></p></div>' +
      '<div class="tl-ctl"><div class="tl-chips ls-scroll" role="group" aria-label="Function">' + TL.FUNCS.map(function(f){ return '<button type="button" class="tchip tl-chip" data-id="' + f.id + '" aria-pressed="false" aria-label="' + esc(plainTex(f.tex)) + '">' + esc(f.chip) + '</button>'; }).join('') + '</div>' +
      '<div class="tl-sl"></div><div class="tl-band" role="group" aria-label="Error band"><span class="tl-band-l">Band</span><button type="button" class="tl-bb" data-b="lag" aria-pressed="true">Lagrange</button><button type="button" class="tl-bb" data-b="alt" aria-pressed="false">Alternating</button><button type="button" class="tl-bb" data-b="off" aria-pressed="false">Off</button></div></div>' +
      '<div class="tl-say"></div>' +
      T.moreHtml('<div class="tl-more-b"></div><p class="bt-small">Keyboard: the center on the curve and the error point on the axis are sliders; focus one and use the arrow keys (Shift moves faster, Home and End jump to the ends).</p>', 'where the error is measured') +
      '<div class="tl-coefs"></div><div class="tl-nums"></div><p class="sr-only tl-live"></p></section>';
    var say = T.announcer($('.tl-live'));
    var cue = T.cue('Add terms with the slider and watch the polynomial wrap around the curve. Drag the center along the curve.');
    $('.tl-ctl').insertBefore(cue.el, $('.tl-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var nSl = T.slider({ label: 'Degree n', min: 0, max: 12, step: 1, value: n, decimals: 0, onInput: function(v){ act(); n = v; draw(); speak(); } });
    var cSl = T.slider({ label: 'Center c', min: -2, max: 2, step: 0.1, value: c, decimals: 1, onInput: function(v){ act(); c = v; draw(); speak(); } });
    var xSl = T.slider({ label: 'Error measured at x', min: -3, max: 3, step: 0.05, value: xe, decimals: 2, onInput: function(v){ act(); xe = v; draw(); speak(); } });
    nSl.el.setAttribute('data-ls-primary', '');
    $('.tl-sl').appendChild(nSl.el); $('.tl-sl').appendChild(cSl.el); $('.tl-more-b').appendChild(xSl.el);
    host.querySelectorAll('.tl-chip').forEach(function(b){ b.addEventListener('click', function(){ act(); pick(b.getAttribute('data-id')); }); });
    host.querySelectorAll('.tl-bb').forEach(function(b){ b.addEventListener('click', function(){ act(); band = b.getAttribute('data-b'); syncBand(); draw(); speak(); }); });
    function syncBand(){ [host, LS && LS.root].forEach(function(r){ if(r) r.querySelectorAll('.tl-bb').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-b') === band)); }); }); }
    function pick(id){
      F = TL.funcById(id); view = F.view; c = 0; xe = id === 'ln' ? 0.8 : id === 'geo' ? -0.6 : id === 'sin' || id === 'cos' ? 2 : 1;
      if(id === 'exp' && band === 'alt') xe = -1;
      cSl.input.min = String(F.centers[0]); cSl.input.max = String(F.centers[1]); cSl.set(c);
      xSl.input.min = String(Math.max(view.x[0], F.lo + 0.02)); xSl.input.max = String(Math.min(view.x[1], F.hi - 0.02)); xSl.set(xe);
      [host, LS && LS.root].forEach(function(r){ if(r) r.querySelectorAll('.tl-chip').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-id') === id)); }); });
      build(); speak();
    }
    function build(){
      var box = $('.tl-plot'), w = Math.max(280, Math.round(box.clientWidth || 560)), h = LS && box.clientHeight > 140 ? Math.round(box.clientHeight) : Math.round(Math.min(w * 0.7, 460));
      var spec = { label: 'Graph of ' + plainTex(F.tex) + ' and its Taylor polynomial', width: w, height: Math.max(190, h), x: view.x, y: view.y, xLabel: 'x', yLabel: 'y', piX: !!F.periodic };
      Fr = P.frame(spec);
      box.innerHTML = P.svg(spec).replace('</svg>', '<path class="tl-bandp"/><path class="tl-f"/><path class="tl-p"/><g class="tl-dyn"></g></svg>');
      svg = box.querySelector('svg'); svg.setAttribute('role', 'group');
      var span = view.x[1] - view.x[0];
      Hc = handle(svg, { x: c, y: function(x){ var v = F.f(x); return isFinite(v) ? Math.max(view.y[0], Math.min(view.y[1], v)) : view.y[0]; }, F: Fr, step: 0.1, min: F.centers[0], max: F.centers[1], cls: 'tl-hc', r: 8,
        clamp: function(x){ return Math.max(F.centers[0], Math.min(F.centers[1], Math.round(x * 10) / 10)); }, label: function(x){ return 'Center c = ' + num(x, 1); },
        onMove: function(x){ act(); c = x; cSl.set(c); schedule(); }, onEnd: speak });
      He = handle(svg, { x: xe, y: function(){ return Math.max(view.y[0], Math.min(view.y[1], 0)); }, F: Fr, step: 0.05, min: +xSl.input.min, max: +xSl.input.max, cls: 'tl-he', r: 6,
        clamp: function(x){ return Math.max(+xSl.input.min, Math.min(+xSl.input.max, Math.round(x * 20) / 20)); }, label: function(x){ return 'Error measured at x = ' + num(x, 2); },
        onMove: function(x){ act(); xe = x; xSl.set(xe); schedule(); }, onEnd: speak });
      draw();
    }
    var Hc = null, He = null, raf = 0;
    function schedule(){ if(raf) return; raf = (window.requestAnimationFrame || setTimeout)(function(){ raf = 0; draw(); }); }
    function bandAt(t){
      if(t <= F.lo || t >= F.hi) return null;
      if(band === 'lag') return TL.lagrange(F, c, n, t).bound;
      if(band === 'alt'){ var a = TL.altBound(F, c, n, t); return a ? a.bound : null; }
      return null;
    }
    function draw(){
      if(!svg) return;
      var y = view.y, pf = function(x){ return TL.poly(F, c, n, x); };
      svg.querySelector('.tl-f').setAttribute('d', pathOf(F.f, Math.max(view.x[0], F.lo + 1e-3), Math.min(view.x[1], F.hi - 1e-3), Fr, y, 400));
      svg.querySelector('.tl-p').setAttribute('d', pathOf(pf, view.x[0], view.x[1], Fr, y, 400));
      var xs = [], lo = [], hi = [];
      if(band !== 'off') for(var i = 0; i <= 240; i++){ var t = view.x[0] + (view.x[1] - view.x[0]) * i / 240, b = bandAt(t), p = pf(t); xs.push(t); lo.push(b == null ? NaN : p - b); hi.push(b == null ? NaN : p + b); }
      svg.querySelector('.tl-bandp').setAttribute('d', band === 'off' ? '' : bandOf(xs, lo, hi, Fr, y));
      // the error at xe: the gap between f and P_n, and the bound there
      var fe = F.f(xe), pe = pf(xe), be = bandAt(xe), dyn = [], cl = function(v){ return Math.max(y[0], Math.min(y[1], v)); };
      if(isFinite(fe) && isFinite(pe)){
        dyn.push('<line class="tl-gap" x1="' + r2(Fr.sx(xe)) + '" x2="' + r2(Fr.sx(xe)) + '" y1="' + r2(Fr.sy(cl(fe))) + '" y2="' + r2(Fr.sy(cl(pe))) + '"/>');
        if(be != null) dyn.push('<path class="tl-bbar" d="M' + r2(Fr.sx(xe) + 9) + ' ' + r2(Fr.sy(cl(pe - be))) + 'h6V' + r2(Fr.sy(cl(pe + be))) + 'h-6"/>');
        dyn.push('<circle class="tl-fe" cx="' + r2(Fr.sx(xe)) + '" cy="' + r2(Fr.sy(cl(fe))) + '" r="4"/><circle class="tl-pe" cx="' + r2(Fr.sx(xe)) + '" cy="' + r2(Fr.sy(cl(pe))) + '" r="4"/>');
      }
      var fc = F.f(c);
      if(isFinite(fc)) dyn.push('<line class="tl-cline" x1="' + r2(Fr.sx(c)) + '" x2="' + r2(Fr.sx(c)) + '" y1="' + r2(Fr.sy(cl(fc))) + '" y2="' + r2(Fr.sy(cl(0))) + '"/><text class="tl-clab" x="' + r2(Fr.sx(c)) + '" y="' + r2(Math.min(Fr.h - Fr.pad.b - 6, Fr.sy(cl(0)) + 16)) + '" text-anchor="middle">c</text>');
      svg.querySelector('.tl-dyn').innerHTML = dyn.join('');
      if(Hc){ svg.appendChild(Hc.el); Hc.set(c); } if(He){ svg.appendChild(He.el); He.set(xe); }
      words(fe, pe, be);
    }
    function words(fe, pe, be){
      var err = Math.abs(fe - pe), Ptex = TL.polyTex(F, c, n), ct = num(c, 1).replace(/\.0$/, '').replace('−', '-');
      $('.tl-eq').innerHTML = tex('f(x) = ' + F.tex) + ' <span class="tl-eq-sep">·</span> ' + tex('P_{' + n + '}') + ' about ' + tex('x = ' + ct);
      var bname = band === 'lag' ? 'Lagrange bound' : band === 'alt' ? 'alternating series bound' : '';
      var head = '<b>' + html('At $x = ' + num(xe, 2).replace('−', '-') + '$: error $' + sigTex(err) + '$') + '</b>' + (be != null ? html(', at most $' + sigTex(be) + '$ (' + bname + ').') : band === 'alt' ? '. The alternating bound does not apply here.' : '.');
      var why = '<p>' + html('$P_{' + n + '}(x) = ' + Ptex + '$') + '</p>' +
        '<p>' + html('It has the same value and the same first ' + (n === 1 ? 'derivative' : n + ' derivatives') + ' as $f$ at $x = ' + ct + '$: each term is $\\frac{f^{(k)}(' + ct + ')}{k!}' + cTex(c) + '^k$. More terms match more derivatives, so the polynomial hugs the curve over a wider stretch.') + '</p>';
      if(band === 'lag'){
        var L = TL.lagrange(F, c, n, xe);
        why += '<p>' + html('Lagrange: $|f(x) - P_{' + n + '}(x)| \\le \\frac{M}{' + (n + 1) + '!}' + (c === 0 ? '|x|' : '|x - ' + ct + '|') + '^{' + (n + 1) + '}$, where $M$ is the largest value of $|f^{(' + (n + 1) + ')}|$ between $' + ct + '$ and $x$. At $x = ' + num(xe, 2).replace('−', '-') + '$: $M = ' + sigTex(L.M) + '$, so the bound is $' + sigTex(L.bound) + '$.') + '</p>' +
          '<p>The band grows away from the center like a power of the distance: the curve stays inside it everywhere.</p>';
      } else if(band === 'alt'){
        why += '<p>' + html(F.altNote + ' Where the series alternates and its terms shrink, the error is at most the first nonzero term left out. The band is drawn only there.') + '</p>' + (be == null ? '<p>' + html('At $x = ' + num(xe, 2).replace('−', '-') + '$ ' + (c !== 0 ? 'the center is not 0, so the terms do not alternate in this simple pattern' : 'the terms do not alternate (or do not shrink)') + ': use the Lagrange bound instead.') + '</p>' : '');
      }
      T.explain($('.tl-say'), head, why);
      var cs = TL.coef(F, c, Math.min(n, 12)), rows = cs.map(function(a, k){ return '<tr><td>' + k + '</td><td class="r">' + sig(a * TL.fact(k)) + '</td><td class="r">' + sig(a) + '</td></tr>'; }).join('');
      var co = $('.tl-coefs');
      if(co) co.innerHTML = '<h3 class="ls-title-l">Coefficients</h3><table class="ls-tbl tl-tbl"><caption class="sr-only">Derivatives at the center and the Taylor coefficients</caption><thead><tr><th scope="col">k</th><th scope="col" class="r">f<sup>(k)</sup>(c)</th><th scope="col" class="r">f<sup>(k)</sup>(c) / k!</th></tr></thead><tbody>' + rows + '</tbody></table>';
      var nm = $('.tl-nums');
      if(nm){ var row = function(k, v){ return '<tr><th scope="row">' + k + '</th><td class="r">' + v + '</td></tr>'; };
        nm.innerHTML = '<h3 class="ls-title-l">At x = ' + esc(num(xe, 2)) + '</h3><table class="ls-tbl"><tbody>' + row('f(x)', sig(fe)) + row('P<sub>' + n + '</sub>(x)', sig(pe)) + row('Actual error', sig(Math.abs(fe - pe))) + row('Lagrange bound', sig(TL.lagrange(F, c, n, xe).bound)) + row('Alternating bound', (function(){ var a = TL.altBound(F, c, n, xe); return a ? sig(a.bound) : 'does not apply'; })()) + '</tbody></table>'; }
      if(LS){
        LS.caption(T.sayHead($('.tl-say')), 'explore');
        LS.pills([{ k: 'Error', html: sig(Math.abs(fe - pe)), tone: 'readout' }], 'left', 'explore');
        LS.pills(be != null ? [{ k: 'Bound', html: sig(be), tone: 'accent' }] : [], 'right', 'explore');
      }
    }
    function speak(){ var fe = F.f(xe), pe = TL.poly(F, c, n, xe), b = bandAt(xe); say('Degree ' + n + ' about ' + num(c, 1) + '. At x = ' + num(xe, 2) + ' the error is ' + sig(Math.abs(fe - pe)) + (b != null ? ', bound ' + sig(b) + '.' : '.')); }
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.tl-fig')], dock: [$('.tl-ctl')], why: [$('.tl-say')], details: [$('.tl-nums'), $('.tl-coefs')], moreLabel: 'Where the error is measured' });
      syncBand(); build();
      if(s.mode() === 'explore') s.hint({ target: nSl.input, text: 'Add terms' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(build, 60); }).observe($('.tl-plot')); }
      sp.open();
    }
    pick('exp');
    if(!window.LevlStudio && window.ResizeObserver){ var t2 = null; new ResizeObserver(function(){ clearTimeout(t2); t2 = setTimeout(build, 80); }).observe($('.tl-plot')); }
    return { studio: studio };
  }

  /* ===================================================== test yourself */
  var TITLES = { coef: 'Taylor coefficients', maclaurin: 'A Maclaurin series', lagrange: 'The Lagrange error bound', altbound: 'The alternating series error bound' };
  var METHOD = {
    c2: 'The coefficient of (x − c)^k is the kth derivative at c divided by k!.', c3: 'Divide the third derivative by 3! = 6.',
    P3: 'Term k is f^(k)(c)/k! times (x − c)^k. Keep (x − c), not x.', approx: 'Put the x value into P_3: work with x − c.',
    d2: 'Coefficient times 2! gives f\'\'(c).', d3: 'Coefficient times 3! gives f\'\'\'(c).', ext: 'No linear term means f\'(c) = 0; then the sign of f\'\'(c) decides.',
    how: 'Match the function to a known series and the operation that turns one into the other.',
    co: 'Write the known series, substitute or operate, then read the coefficient.', Pn: 'Write the terms up to the degree asked; no "+ ...".', dm: 'Coefficient of x^m times m!.',
    M: 'Write f^(n+1)(t), then find where it is largest on the interval between the center and x.', B: 'The bound: the first term left out (alternating), or M times |x − c|^(n+1) over (n+1)! (Lagrange).',
    tol: 'Compare the bound with the tolerance: the error is at most the bound.', which: 'Read the series at that x: does it alternate with shrinking terms?',
    why: 'The alternating series bound needs the alternating series test\'s conditions.', N: 'List term sizes until one is below the tolerance.', say: 'An error bound says "at most".'
  };
  function quiz(host, data){
    T.drill(host, data, { slug: 'taylor-lab', noun: 'drill', typeLabel: 'Kind of problem', textOnStage: true,
      types: [{ value: 'coef', label: 'Taylor coefficients' }, { value: 'maclaurin', label: 'Maclaurin series' }, { value: 'lagrange', label: 'Lagrange error bound' }, { value: 'altbound', label: 'Alternating series bound' }],
      generate: function(r, ctx, type){ return TL.generate(r, ctx, type); },
      title: function(p){ return TITLES[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = figure(el, p, api); },
      onStep: function(s, right, api){ if(api.fig && api.fig.after) api.fig.after(s); },
      onTry: function(s, t, api){ return api.fig && api.fig.tryOn ? api.fig.tryOn(s, t) : false; },
      method: function(s, p){ return METHOD[s.key] || ''; }
    });
  }
  function sized(box, draw, ratio){
    var last = '';
    function dims(){
      var st = box.closest && box.closest('.ls-drill-stage'), w = Math.round(box.clientWidth) || 480, h = st ? Math.round(box.clientHeight) : 0;
      if(!st || h < 150) h = Math.round(Math.min(w * (ratio || 0.6), 360));
      return [Math.max(240, w), Math.max(150, h)];
    }
    function go(force){ var d = dims(), k = d.join('x'); if(k === last && !force) return; last = k; draw(d[0], d[1]); }
    draw(480, Math.round(480 * (ratio || 0.6)));
    setTimeout(function(){ go(true); }, 0);
    if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(go, 40); }).observe(box); }
  }
  function figure(el, p){
    var g = p.fig, done = {}, mine = null, W = 480, Hh = 300;
    if(g.kind === 'lag' && !g.f) return null; // a general f: nothing to draw
    if(g.kind === 'alt') return altFig(el, p);
    var curves, view, marks;
    var fOf = { exp: Math.exp, sin: Math.sin, cos: Math.cos, ln: function(x){ return x > -1 ? Math.log(1 + x) : NaN; }, expneg: function(x){ return Math.exp(-x); } };
    function polyF(cs, c){ return function(x){ var s = 0, q = 1; for(var k = 0; k < cs.length; k++){ s += cs[k] * q; q *= (x - c); } return s; }; }
    function setup(){
      if(g.kind === 'coef'){
        var c = g.c, cs = g.cs; view = { x: [c - 1.6, c + 1.6] };
        curves = function(){
          var out = [], tan = polyF(cs.slice(0, 2), c);
          out.push({ f: tan, cls: 'tl-q1', label: 'tangent line' });
          if(cs.length > 4){ if(done.d3 || done.ext) out.push({ f: polyF(cs, c), cls: 'tl-p', label: 'P₄' }); }
          else { if(done.c2) out.push({ f: polyF(cs.slice(0, 3), c), cls: 'tl-q2', label: 'P₂' }); if(done.c3 || done.P3) out.push({ f: polyF(cs, c), cls: 'tl-p', label: 'P₃' }); }
          return out;
        };
        var ys = []; for(var i = 0; i <= 40; i++){ var x = view.x[0] + 3.2 * i / 40; ys.push(polyF(cs, c)(x)); }
        var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), pad = Math.max(1, (hi - lo) * 0.1);
        view.y = [Math.max(lo - pad, cs[0] - 12), Math.min(hi + pad, cs[0] + 12)];
        marks = function(){ var m = [{ at: [c, cs[0]], label: '(' + c + ', ' + num(cs[0], 2).replace(/\.00$/, '') + ')' }]; if(done.approx && g.x1 != null) m.push({ at: [g.x1, polyF(cs, c)(g.x1)], label: 'P₃(' + g.x1 + ')', cls: 'is-p' }); return m; };
      } else if(g.kind === 'mac'){
        var f = M.fn(g.f, ['x']); view = { x: [-2.2, 2.2] };
        var fy = []; for(i = 0; i <= 60; i++){ var v = f(-2.2 + 4.4 * i / 60); if(isFinite(v)) fy.push(v); }
        var l2 = Math.min.apply(null, fy), h2 = Math.max.apply(null, fy); view.y = [Math.max(-4, l2 - 0.5), Math.min(6, h2 + 0.5)]; if(view.y[1] - view.y[0] < 2){ view.y = [view.y[0] - 1, view.y[1] + 1]; }
        curves = function(){ var out = [{ f: function(x){ try{ return f(x); }catch(e){ return NaN; } }, cls: 'tl-f', label: 'f' }]; if(done.Pn) out.push({ f: polyF(g.cs, 0), cls: 'tl-p', label: 'P' + sub(g.n) }); return out; };
        marks = function(){ return []; };
      } else if(g.kind === 'lag' || g.kind === 'talt'){
        var ff = fOf[g.f], n = g.n, x1 = g.x1, cc = g.c || 0, cs2 = [], Fm = TL.funcById(g.f === 'expneg' ? 'exp' : g.f);
        for(var k = 0; k <= n; k++) cs2.push(g.f === 'expneg' ? Math.pow(-1, k) / TL.fact(k) : Fm.d(k, cc) / TL.fact(k));
        var Pf = polyF(cs2, cc); view = { x: [Math.min(cc, x1) - 0.6 * Math.max(0.4, Math.abs(x1 - cc)) - 0.2, Math.max(cc, x1) + 0.6 * Math.max(0.4, Math.abs(x1 - cc)) + 0.2] };
        var vs = []; for(i = 0; i <= 50; i++){ var xx = view.x[0] + (view.x[1] - view.x[0]) * i / 50; vs.push(ff(xx)); vs.push(Pf(xx)); }
        vs = vs.filter(isFinite); var a0 = Math.min.apply(null, vs), b0 = Math.max.apply(null, vs), pd = (b0 - a0) * 0.15 + 0.1; view.y = [a0 - pd, b0 + pd];
        curves = function(){ return [{ f: ff, cls: 'tl-f', label: 'f' }, { f: Pf, cls: 'tl-p', label: 'P' + sub(n) }]; };
        marks = function(){ return [{ at: [x1, Pf(x1)], label: 'x = ' + x1, bracket: done.B ? g.bound : null, fx: ff(x1) }]; };
      }
    }
    var SUBD = '₀₁₂₃₄₅₆₇₈₉';
    function sub(k){ return String(k).split('').map(function(c){ return SUBD[+c]; }).join(''); }
    setup();
    var redraw = function(){};
    function draw(w, h){
      W = w; Hh = h;
      var spec = { label: 'The polynomial and the function in the problem', width: w, height: h, x: view.x, y: view.y, xLabel: 'x', yLabel: 'y' }, Fr = P.frame(spec), out = [];
      curves().forEach(function(cv){ out.push('<path class="' + cv.cls + '" d="' + pathOf(cv.f, view.x[0], view.x[1], Fr, view.y, 260) + '"/>'); });
      if(mine) out.push('<path class="tl-mine" d="' + pathOf(mine, view.x[0], view.x[1], Fr, view.y, 260) + '"/>');
      marks().forEach(function(m){
        var cy = function(v){ return Fr.sy(Math.max(view.y[0], Math.min(view.y[1], v))); };
        if(m.bracket != null){ var bx = Fr.sx(m.at[0]) + 10; out.push('<path class="tl-bbar" d="M' + r2(bx) + ' ' + r2(cy(m.at[1] - m.bracket)) + 'h6V' + r2(cy(m.at[1] + m.bracket)) + 'h-6"/>'); }
        if(m.fx != null && isFinite(m.fx)) out.push('<line class="tl-gap" x1="' + r2(Fr.sx(m.at[0])) + '" x2="' + r2(Fr.sx(m.at[0])) + '" y1="' + r2(cy(m.fx)) + '" y2="' + r2(cy(m.at[1])) + '"/>');
        out.push('<circle class="tl-qm ' + (m.cls || '') + '" cx="' + r2(Fr.sx(m.at[0])) + '" cy="' + r2(cy(m.at[1])) + '" r="5.5"/><text class="tl-qlab" x="' + r2(Fr.sx(m.at[0]) + 9) + '" y="' + r2(cy(m.at[1]) - 9) + '">' + esc(m.label) + '</text>');
      });
      var cvs = curves(), key = cvs.map(function(cv){ return '<span class="' + cv.cls.replace('tl-', 'tl-k-') + '">' + esc(cv.label) + '</span>'; }).join('') + (mine ? '<span class="tl-k-mine">yours</span>' : '');
      el.innerHTML = '<figure class="cd-fig tl-qfig">' + P.svg(spec).replace('</svg>', out.join('') + '</svg>') + '<figcaption class="tl-key">' + key + '</figcaption></figure>';
    }
    sized(el, function(w, h){ redraw = function(){ draw(w, h); }; draw(w, h); }, 0.6);
    return {
      after: function(s){ done[s.key] = true; if(s.kind === 'expr') mine = null; redraw(); },
      tryOn: function(s, t){
        if(s.kind !== 'expr' || !t.fn) return false;
        mine = t.ok || t.shown ? null : t.fn; if(t.ok || t.shown) done[s.key] = true; redraw();
        return t.ok || t.shown ? 'The picture shows the right polynomial.' : 'The picture shows yours, dashed.';
      }
    };
  }
  /* An alternating series: partial sums against the sum, the bound as a bracket at S_N. */
  function altFig(el, p){
    var g = p.fig, A = TL.ALTS[g.id], done = {}, redraw = function(){};
    function draw(w, h){
      var N = Math.max(g.N + 4, 10), sums = [], s = 0, xs = [];
      for(var k = 0; k < N; k++){ var n = A.n0 + k, sg = (g.id === 'f' || g.id === 'lb') ? (n % 2 ? -1 : 1) : (n % 2 ? 1 : -1); s += sg * A.b(n); sums.push(s); xs.push(k + 1); }
      var lo = Math.min.apply(null, sums), hi = Math.max.apply(null, sums), pd = (hi - lo) * 0.18 + 0.02;
      var spec = { label: 'Partial sums of the alternating series', width: w, height: h, x: [0.3, N + 0.7], y: [lo - pd, hi + pd], xLabel: 'terms', yLabel: '', xStep: N > 12 ? 2 : 1 }, Fr = P.frame(spec), out = [];
      if(g.sum != null) out.push('<line class="tl-sum" x1="' + Fr.pad.l + '" x2="' + (Fr.w - Fr.pad.r) + '" y1="' + r2(Fr.sy(g.sum)) + '" y2="' + r2(Fr.sy(g.sum)) + '"/>');
      out.push('<path class="tl-spath" d="' + sums.map(function(v, i){ return (i ? 'L' : 'M') + r2(Fr.sx(i + 1)) + ' ' + r2(Fr.sy(v)); }).join('') + '"/>');
      sums.forEach(function(v, i){ out.push('<circle class="tl-sdot' + (i === g.N - 1 ? ' is-cur' : '') + '" cx="' + r2(Fr.sx(i + 1)) + '" cy="' + r2(Fr.sy(v)) + '" r="' + (i === g.N - 1 ? 6 : 3.6) + '"/>'); });
      var SN = sums[g.N - 1];
      if(done.B){ var b = A.b(A.n0 + g.N), bx = Fr.sx(g.N) + 11; out.push('<path class="tl-bbar" d="M' + r2(bx) + ' ' + r2(Fr.sy(SN - b)) + 'h6V' + r2(Fr.sy(SN + b)) + 'h-6"/>'); }
      out.push('<text class="tl-qlab" x="' + r2(Fr.sx(g.N) + (done.B ? 22 : 9)) + '" y="' + r2(Fr.sy(SN) + 4) + '">S' + String(g.N).split('').map(function(c){ return '₀₁₂₃₄₅₆₇₈₉'[+c]; }).join('') + '</text>');
      el.innerHTML = '<figure class="cd-fig tl-qfig">' + P.svg(spec).replace('</svg>', out.join('') + '</svg>') + '<figcaption class="tl-key"><span class="tl-k-s">partial sums</span>' + (g.sum != null ? '<span class="tl-k-sum">the sum, ' + esc(plainTex(g.sumTex)) + '</span>' : '') + (done.B ? '<span class="tl-k-b">the bound around S' + '</span>' : '') + '</figcaption></figure>';
    }
    sized(el, function(w, h){ redraw = function(){ draw(w, h); }; draw(w, h); }, 0.6);
    return { after: function(s){ done[s.key] = true; redraw(); }, tryOn: function(){ return false; } };
  }
})();
