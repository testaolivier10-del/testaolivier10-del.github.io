/* Integration methods: the page script (docs/apcalcbc-architecture.md, "Trainers"). OWNED BY THIS
   TOOL ONLY (builder T3). Runs on calculus-bc/tools/integration-methods.html on top of AB's framework
   (ApCalcTools, calculus/assets/tools/calc-tools.js) and plots (ApCalcPlot), with its own
   model ApCalcMath.integrationMethods (calculus-bc/assets/tools/math/integration-methods.js).

   Explore, three scenes:
     Parts: the integrand's area from a to b (drag b) beside the uv picture,
       u plotted against v, where ∫u dv and ∫v du are two areas that fill
       the rectangle uv; the u, dv, du, v card above; the tabular table in
       Details for x²eˣ. More options: what goes wrong with u and dv swapped.
     Partial fractions: f and its two pieces A/(x - a), B/(x - b) drawn
       together; a slider moves x and the readout adds the pieces.
     Improper: the area from a to b (or from b to a, down to 0) as b moves
       toward the trouble, beside the graph of that area against b, which
       levels off at the limit or keeps climbing.
   Test yourself: ApCalcTools.drill over five kinds (parts, tabular,
   partial, improper, choose). The figure builds with the answers: the u/dv
   card fills, the tabular table gets its last entry, signs and diagonals,
   the pieces of a partial fraction appear, the area function of an
   improper integral is drawn with its limit. A wrong expression gets the
   framework's small "yours against the right one" graph. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot;
  if(!T || !M || !M.integrationMethods || !P) return;
  var IM = M.integrationMethods, esc = T.esc, NS = 'http://www.w3.org/2000/svg';
  function tex(s, o){ return window.ApCalcTex ? window.ApCalcTex.render(s, o || {}) : esc(s); }
  function html(s){ return window.ApCalcTex ? window.ApCalcTex.html(s) : esc(s); }
  function r2(v){ return Math.round(v * 100) / 100; }
  function clean(v, d){ return String(+(+v).toFixed(d == null ? 2 : d)).replace('-', '−'); }
  function n3(v){ return clean(v, 3); }
  var uid = 0;
  function pathOf(pts, F){
    var out = '', pen = false;
    pts.forEach(function(p){ if(!isFinite(p[1])){ pen = false; return; } out += (pen ? 'L' : 'M') + r2(F.sx(p[0])) + ' ' + r2(F.sy(p[1])); pen = true; });
    return out;
  }
  function sample(fn, a, b, view, n){
    var pts = [], span = view.y[1] - view.y[0], N = n || 240;
    for(var i = 0; i <= N; i++){ var x = a + (b - a) * i / N, y = fn(x); pts.push([x, isFinite(y) && y > view.y[0] - 2 * span && y < view.y[1] + 2 * span ? y : NaN]); }
    return pts;
  }
  /* The region between a curve and the x-axis from a to b, as a path. */
  function areaPath(fn, a, b, F, view){
    var pts = sample(fn, a, b, view, 160).map(function(p){ return [p[0], isFinite(p[1]) ? Math.max(view.y[0], Math.min(view.y[1], p[1])) : view.y[1]]; });
    return 'M' + r2(F.sx(a)) + ' ' + r2(F.sy(0)) + pts.map(function(p){ return 'L' + r2(F.sx(p[0])) + ' ' + r2(F.sy(p[1])); }).join('') + 'L' + r2(F.sx(b)) + ' ' + r2(F.sy(0)) + 'Z';
  }
  function clip(F){
    var id = 'imc' + (++uid);
    return { id: id, def: '<defs><clipPath id="' + id + '"><rect x="' + F.pad.l + '" y="' + F.pad.t + '" width="' + (F.w - F.pad.l - F.pad.r) + '" height="' + (F.h - F.pad.t - F.pad.b) + '"/></clipPath></defs>' };
  }
  /* A drag handle along the x-axis (pointer + keyboard). */
  function handle(svg, o){
    var g = document.createElementNS(NS, 'g'), x = o.x, F = o.F;
    g.setAttribute('class', 'im-handle'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'slider');
    g.innerHTML = '<circle class="im-hitc" r="22"/><circle class="im-halo" r="16"/><circle class="im-dot" r="8"/>';
    svg.appendChild(g);
    function place(){ g.setAttribute('transform', 'translate(' + r2(F.sx(x)) + ' ' + r2(F.sy(o.y || 0)) + ')'); var t = o.label(x); g.setAttribute('aria-label', t); g.setAttribute('aria-valuetext', t); g.setAttribute('aria-valuenow', String(+x.toFixed(3))); g.setAttribute('aria-valuemin', String(o.min)); g.setAttribute('aria-valuemax', String(o.max)); }
    function set(v, fire){ x = Math.max(o.min, Math.min(o.max, v)); place(); if(fire) o.onMove(x); }
    var on = false;
    function local(e){ var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(); return F.ix((m ? pt.matrixTransform(m.inverse()) : pt).x); }
    g.addEventListener('pointerdown', function(e){ on = true; try{ g.setPointerCapture(e.pointerId); }catch(err){} e.preventDefault(); });
    g.addEventListener('pointermove', function(e){ if(on) set(local(e), true); });
    g.addEventListener('pointerup', function(){ if(on){ on = false; if(o.onEnd) o.onEnd(x); } });
    g.addEventListener('pointercancel', function(){ on = false; });
    g.addEventListener('keydown', function(e){
      var k = e.key, s = (o.max - o.min) / 40 * (e.shiftKey ? 5 : 1);
      if(k === 'ArrowRight' || k === 'ArrowUp') set(x + s, true); else if(k === 'ArrowLeft' || k === 'ArrowDown') set(x - s, true);
      else if(k === 'Home') set(o.min, true); else if(k === 'End') set(o.max, true); else return;
      e.preventDefault(); if(o.onEnd) o.onEnd(x);
    });
    place();
    return { el: g, set: set };
  }

  T.mount('integration-methods', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'integration-methods', explore: function(h){ ex = explore(h, data); }, quiz: function(h){ quiz(h, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* =========================================================== explore */
  var SCENES = [{ id: 'parts', label: 'Parts' }, { id: 'pf', label: 'Partial fractions' }, { id: 'imp', label: 'Improper' }];
  var PCHIP = { xex: 'x eˣ', xcos: 'x cos x', lnx: 'ln x', xlnx: 'x ln x', x2ex: 'x² eˣ' };
  var ICHIP = { p2: '1/x² to ∞', p1: '1/x to ∞', ph: '1/√x to ∞', ex: 'e⁻ˣ to ∞', z2: '1/√x near 0', z1: '1/x² near 0' };
  function explore(host, data){
    var scene = 'parts', pid = 'xex', pg = IM.parts(pid), pb = pg.b0, swap = false;
    var fid = 'b', fg = IM.pfOf(fid), fx = 3.5;
    var iid = 'p2', ig = IM.improper(iid), it = 0.45;     // it in [0, 1]: b on a log scale
    var LS = null, touched = false;
    var nid = T.nid('im');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null) || document.querySelector('#app ' + q); }
    function $$(q){ return document.querySelectorAll(q); }
    host.innerHTML = '<section class="bt-problem im-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Integration methods explorer</h2>' +
      '<div class="im-fig"><div class="im-head"></div><div class="im-plots"><div class="im-p im-p1"></div><div class="im-p im-p2"></div></div></div>' +
      '<div class="im-ctl"><div class="im-scenes" role="group" aria-label="Technique">' + SCENES.map(function(s){ return '<button type="button" class="im-scene" data-s="' + s.id + '" aria-pressed="' + (s.id === scene) + '">' + esc(s.label) + '</button>'; }).join('') + '</div>' +
      '<div class="im-chips ls-scroll" role="group" aria-label="Integral"></div><div class="im-sl"></div></div>' +
      '<div class="im-say"></div>' +
      T.moreHtml('<div class="im-more-b"><label class="bt-check im-swaprow"><input type="checkbox" class="im-swap"> Swap u and dv (see what goes wrong)</label></div><p class="bt-small">Keyboard: focus the point on the x-axis and use the arrow keys (Shift for bigger steps, Home and End for the ends).</p>', 'swap u and dv, keyboard') +
      '<div class="im-nums"></div><p class="sr-only im-live"></p></section>';
    var say = T.announcer($('.im-live'));
    var cue = T.cue('Drag the bound b along the x-axis: the two areas of the parts picture always fill the rectangle uv.');
    $('.im-ctl').insertBefore(cue.el, $('.im-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    host.querySelectorAll('.im-scene').forEach(function(b){ b.addEventListener('click', function(){ act(); setScene(b.getAttribute('data-s')); }); });
    $('.im-swap').addEventListener('change', function(){ swap = this.checked; draw(); });
    var slider = null;
    function setScene(s){
      scene = s;
      $$('.im-scene').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-s') === s)); });
      var row = $('.im-swaprow'); if(row) row.hidden = s !== 'parts';
      chips(); sliderFor(); draw();
    }
    function chips(){
      var box = $('.im-chips'), list = scene === 'parts' ? IM.PARTS.map(function(g){ return [g.id, PCHIP[g.id]]; }) : scene === 'pf' ? IM.PF.map(function(g){ return [g.id, '']; }) : IM.IMPROPER.map(function(g){ return [g.id, ICHIP[g.id]]; });
      var cur = scene === 'parts' ? pid : scene === 'pf' ? fid : iid;
      box.innerHTML = list.map(function(c){
        var g = scene === 'pf' ? IM.pfOf(c[0]) : null;
        return '<button type="button" class="tchip im-chip" data-id="' + c[0] + '" aria-pressed="' + (c[0] === cur) + '"' + (g ? ' aria-label="' + esc(window.ApCalcTex ? window.ApCalcTex.text(g.tex) : g.tex) + '"' : '') + '>' + (g ? tex(g.tex) : esc(c[1])) + '</button>';
      }).join('');
      box.querySelectorAll('.im-chip').forEach(function(b){ b.addEventListener('click', function(){ act(); pick(b.getAttribute('data-id')); }); });
    }
    function pick(id){
      if(scene === 'parts'){ pid = id; pg = IM.parts(id); pb = pg.b0; }
      else if(scene === 'pf'){ fid = id; fg = IM.pfOf(id); fx = Math.max(fg.p, fg.q) + 1.5; }
      else { iid = id; ig = IM.improper(id); it = 0.45; }
      $$('.im-chip').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-id') === id)); });
      sliderFor(); draw();
    }
    function sliderFor(){
      var box = $('.im-sl'); box.innerHTML = ''; slider = null;
      if(scene === 'parts') slider = T.slider({ label: 'Upper bound b', min: pg.b[0], max: Math.max(pg.b[1], pg.b0), step: 0.01, value: pb, decimals: 2, onInput: function(v){ act(); pb = v; draw(); } });
      else if(scene === 'pf'){ var lo = Math.min(fg.p, fg.q) - 3, hi = Math.max(fg.p, fg.q) + 3; slider = T.slider({ label: 'Move x', min: lo, max: hi, step: 0.05, value: fx, decimals: 2, onInput: function(v){ act(); fx = v; draw(); } }); }
      else slider = T.slider({ label: ig.kind === 'inf' ? 'Upper bound b (toward ∞)' : 'Lower bound b (toward 0)', min: 0, max: 1, step: 0.01, value: it, decimals: 2, onInput: function(v){ act(); it = v; draw(); } });
      if(scene === 'imp'){ var out = slider.el.querySelector('output'); slider.el.querySelector('input').addEventListener('input', function(){ out.textContent = bTxt(); }); out.textContent = bTxt(); }
      box.appendChild(slider.el);
    }
    function bTxt(){ var b = bOf(); return 'b = ' + clean(b, b >= 100 ? 0 : b >= 10 ? 1 : b < 0.01 ? 4 : 2); }
    /* b on a log scale: from a + 0.5 out to 10⁴ (to ∞), or from a/2 down to 10⁻⁴ (to 0). */
    function bOf(){ return ig.kind === 'inf' ? ig.a + 0.5 + (Math.pow(10, 4 * it) - 1) : ig.a * Math.pow(10, -4 * it) / 2; }
    function size(box, ratio){
      var w = Math.max(240, Math.round(box.clientWidth || 480)), h = LS && box.clientHeight > 120 ? Math.round(box.clientHeight) : Math.round(Math.min(w * (ratio || 0.75), 460));
      return [w, h];
    }
    function wide(){ var r = LS ? LS.root : host; return (r.clientWidth || 0) > 760; }
    function draw(){
      $('.im-plots').classList.toggle('is-wide', wide() && scene !== 'pf');
      if(scene === 'parts') drawParts(); else if(scene === 'pf') drawPF(); else drawImp();
    }
    /* ----- parts */
    function drawParts(){
      var g = pg, b = pb, Pp = IM.partsPicture(g, b), b1 = $('.im-p1'), b2 = $('.im-p2'), wd = wide();
      b2.hidden = false;
      var bmax = Math.max(g.b[1], g.b0), ymax = 0, ymin = 0;
      for(var i = 0; i <= 100; i++){ var x = g.a + (bmax - g.a) * i / 100, y = g.f(x); ymax = Math.max(ymax, y); ymin = Math.min(ymin, y); }
      var xlo = Math.min(0, g.a - 0.15), view = { x: [xlo, bmax + 0.15], y: [Math.min(ymin * 1.15, -0.1 * ymax), ymax * 1.15] };
      var wh = size(b1, wd ? 0.8 : 0.62), spec = { label: 'Graph of ' + plain(g.tex) + ' with the area from ' + clean(g.a) + ' to b shaded', width: wh[0], height: wh[1], x: view.x, y: view.y, xLabel: 'x', yLabel: 'y' };
      var span1 = view.y[1] - view.y[0]; if(span1 > 0.9 && span1 <= 2.5) spec.yStep = 0.5;   // no quarter steps: "0.75" does not fit left of the axis
      var F = P.frame(spec), C = clip(F), val = Pp.udv;
      b1.innerHTML = P.svg(spec).replace('</svg>', C.def + '<g clip-path="url(#' + C.id + ')"><path class="im-area" d="' + areaPath(g.f, g.a, b, F, view) + '"/><path class="im-f" d="' + pathOf(sample(g.f, Math.max(view.x[0], g.a === 1 ? 0.05 : view.x[0]), view.x[1], view), F) + '"/></g>' +
        '<text class="im-lab im-lab-a" x="' + r2(Math.abs(F.sx((g.a + b) / 2) - F.sx(0)) < 62 ? F.sx(0) + 62 : F.sx((g.a + b) / 2)) + '" y="' + r2(F.sy(view.y[1]) + 16) + '" text-anchor="middle">area = ' + n3(val) + '</text></svg>');
      var s1 = b1.querySelector('svg'); s1.setAttribute('role', 'group');
      handle(s1, { x: b, F: F, min: g.b[0], max: bmax, label: function(v){ return 'Upper bound b = ' + clean(v); }, onMove: function(v){ act(); pb = v; if(slider) slider.set(v); drawParts(); }, onEnd: function(v){ say('b = ' + clean(v) + ': the integral is ' + n3(IM.partsPicture(g, v).udv) + '.'); } });
      // the uv picture: v across, u up
      var vmax = Math.max(Pp.vb, IM.partsPicture(g, bmax).vb) * 1.08, umax = Math.max(Pp.ub, IM.partsPicture(g, bmax).ub) * 1.1;
      var wh2 = size(b2, wd ? 0.8 : 0.62), spec2 = { label: 'The parts picture: u against v, with the areas for the integral of u dv and of v du', width: wh2[0], height: wh2[1], x: [0, vmax], y: [0, umax], xLabel: 'v', yLabel: 'u' };
      if(umax > 0.9 && umax <= 2.5) spec2.yStep = 0.5;
      var F2 = P.frame(spec2), pts = Pp.pts, sx = F2.sx, sy = F2.sy;
      var under = 'M' + r2(sx(Pp.va)) + ' ' + r2(sy(0)) + pts.map(function(p){ return 'L' + r2(sx(p[0])) + ' ' + r2(sy(p[1])); }).join('') + 'L' + r2(sx(Pp.vb)) + ' ' + r2(sy(0)) + 'Z';
      var beside = 'M' + r2(sx(0)) + ' ' + r2(sy(Pp.ua)) + pts.map(function(p){ return 'L' + r2(sx(p[0])) + ' ' + r2(sy(p[1])); }).join('') + 'L' + r2(sx(0)) + ' ' + r2(sy(Pp.ub)) + 'Z';
      var small = Pp.uva > 1e-9 ? '<rect class="im-small" x="' + r2(sx(0)) + '" y="' + r2(sy(Pp.ua)) + '" width="' + r2(sx(Pp.va) - sx(0)) + '" height="' + r2(sy(0) - sy(Pp.ua)) + '"/>' : '';
      var midU = pts[Math.floor(pts.length * 0.55)];
      b2.innerHTML = P.svg(spec2).replace('</svg>', '<path class="im-udv" d="' + under + '"/><path class="im-vdu" d="' + beside + '"/>' + small +
        '<rect class="im-rect" x="' + r2(sx(0)) + '" y="' + r2(sy(Pp.ub)) + '" width="' + r2(sx(Pp.vb) - sx(0)) + '" height="' + r2(sy(0) - sy(Pp.ub)) + '"/>' +
        '<path class="im-uv" d="' + pathOf(pts, F2) + '"/>' +
        // a rectangle too small to hold its three labels lists them beside it instead, one per line
        (sx(Pp.vb) - sx(0) < 170 || sy(0) - sy(Pp.ub) < 52 ?
          '<text class="im-lab" x="' + r2(sx(Pp.vb) + 10) + '" y="' + r2(sy(0) - 42) + '" text-anchor="start">uv = ' + n3(Pp.uvb) + '</text>' +
          '<text class="im-lab im-lab-v" x="' + r2(sx(Pp.vb) + 10) + '" y="' + r2(sy(0) - 25) + '" text-anchor="start">∫v du = ' + n3(Pp.vdu) + '</text>' +
          '<text class="im-lab im-lab-u" x="' + r2(sx(Pp.vb) + 10) + '" y="' + r2(sy(0) - 8) + '" text-anchor="start">∫u dv = ' + n3(Pp.udv) + '</text>' :
        '<text class="im-lab im-lab-u" x="' + r2((sx(Pp.va) + sx(Pp.vb)) / 2 + 6) + '" y="' + r2(sy(0) - 8) + '" text-anchor="middle">∫u dv = ' + n3(Pp.udv) + '</text>' +
        '<text class="im-lab im-lab-v" x="' + r2(sx(0) + 8) + '" y="' + r2(sy(Pp.ub) + 18) + '" text-anchor="start">∫v du = ' + n3(Pp.vdu) + '</text>' +
        '<text class="im-lab" x="' + r2(sx(Pp.vb) - 4) + '" y="' + r2(sy(Pp.ub) - 6) + '" text-anchor="end">uv = ' + n3(Pp.uvb) + '</text>') + '</svg>');
      b2.querySelector('svg').setAttribute('aria-label', 'u against v from x = ' + clean(g.a) + ' to ' + clean(b) + ': the integral of u dv is ' + n3(Pp.udv) + ', the integral of v du is ' + n3(Pp.vdu) + ', together uv = ' + n3(Pp.uvb) + (Pp.uva ? ' minus ' + n3(Pp.uva) : '') + '.');
      var u = swap ? null : g;
      $('.im-head').innerHTML = '<div class="im-uv-card">' + [['u', g.uTex], ['dv', g.dvTex], ['du', g.duTex], ['v', g.vTex]].map(function(c){ return '<div class="im-cell"><span class="im-k">' + c[0] + '</span>' + tex(c[1]) + '</div>'; }).join('') + '</div>' +
        '<p class="im-eq">' + tex('\\int_{' + clean(g.a) + '}^{' + clean(b) + '} ' + g.tex + '\\,dx = \\left[' + g.Ftex + '\\right]_{' + clean(g.a) + '}^{' + clean(b) + '} = ' + n3(val)) + '</p>';
      wordsParts(Pp, b);
    }
    function plain(t){ return window.ApCalcTex ? window.ApCalcTex.text(t) : t; }
    function wordsParts(Pp, b){
      var g = pg, head = '<b>' + n3(Pp.udv) + ' + ' + n3(Pp.vdu) + ' = ' + n3(Pp.uvb - Pp.uva) + ':</b> the two areas fill the rectangle uv' + (Pp.uva > 1e-9 ? ' minus the small one at x = ' + clean(g.a) : '') + '.';
      var why = (swap ? '<p class="im-warn">' + html(g.bad) + '</p>' : '') +
        '<p>Parts is the product rule run backward: ' + tex('(uv)\' = u\'v + uv\'') + ', so ' + tex('\\int u\\,dv = uv - \\int v\\,du') + '. In the picture, ' + tex('u') + ' is plotted against ' + tex('v') + ' as ' + tex('x') + ' runs from ' + clean(g.a) + ' to ' + clean(b) + ': the area under that curve is ' + tex('\\int u\\,dv') + ' (blue, the integral you want), the area beside it is ' + tex('\\int v\\,du') + ' (orange), and together they make the rectangle ' + tex('uv') + '.</p>' +
        '<p>Choose ' + tex('u = ' + g.uTex) + ' because its derivative ' + tex(g.duTex) + ' is simpler, and ' + tex('dv = ' + g.dvTex) + ' because you can integrate it. LIATE (logarithmic, inverse trig, algebraic, trigonometric, exponential) lists good choices of ' + tex('u') + ' first.</p>' +
        (g.tab ? '<p>Here ' + tex('\\int v\\,du = \\int 2xe^x\\,dx') + ' needs parts again; the tabular table in Details does both at once.</p>' : '');
      T.explain($('.im-say'), head, why);
      var nm = $('.im-nums');
      if(nm){
        var row = function(k, v){ return '<tr><th scope="row">' + k + '</th><td class="r">' + v + '</td></tr>'; };
        nm.innerHTML = '<h3 class="ls-title-l">The numbers</h3><table class="ls-tbl"><caption class="sr-only">Parts, numbers</caption><tbody>' +
          row('∫u dv (the integral)', n3(Pp.udv)) + row('∫v du', n3(Pp.vdu)) + row('uv at b', n3(Pp.uvb)) + row('uv at a', n3(Pp.uva)) + '</tbody></table>' +
          (g.tab ? '<h3 class="ls-title-l">Tabular method</h3>' + tabSvg(g.tab.map(function(r){ return r[0]; }), g.tab.map(function(r){ return r[1]; }), ['+', '−', '+'], 3) : '');
      }
      if(LS){
        LS.caption(T.sayHead($('.im-say')), 'explore');
        LS.pills([], 'left', 'explore'); LS.pills([], 'right', 'explore');   // pass 2: the three areas are labeled inside the uv picture
      }
    }
    /* ----- partial fractions */
    function drawPF(){
      var g = fg, b1 = $('.im-p1'), b2 = $('.im-p2'), lo = Math.min(g.p, g.q) - 3, hi = Math.max(g.p, g.q) + 3;
      b2.hidden = true; b2.innerHTML = '';
      var view = { x: [lo, hi], y: [-8, 8] }, wh = size(b1, wide() ? 0.55 : 0.8);
      var f = function(x){ return (g.c * x + g.d) / ((x - g.p) * (x - g.q)); }, f1 = function(x){ return g.A / (x - g.p); }, f2 = function(x){ return g.B / (x - g.q); };
      var spec = { label: 'Graph of the rational function and its two partial fractions', width: wh[0], height: wh[1], x: view.x, y: view.y, xLabel: 'x', yLabel: 'y' };
      var F = P.frame(spec), C = clip(F), y1 = f1(fx), y2 = f2(fx), y = f(fx), ok = isFinite(y) && Math.abs(fx - g.p) > 0.02 && Math.abs(fx - g.q) > 0.02;
      var sm = function(fn){ return pathOf(sample(fn, lo, hi, view, 600).map(function(p, i, all){ return Math.abs(p[0] - g.p) < 0.02 || Math.abs(p[0] - g.q) < 0.02 ? [p[0], NaN] : p; }), F); };
      var parts = '<line class="im-asym" x1="' + r2(F.sx(g.p)) + '" x2="' + r2(F.sx(g.p)) + '" y1="' + F.pad.t + '" y2="' + (F.h - F.pad.b) + '"/><line class="im-asym" x1="' + r2(F.sx(g.q)) + '" x2="' + r2(F.sx(g.q)) + '" y1="' + F.pad.t + '" y2="' + (F.h - F.pad.b) + '"/>' +
        '<path class="im-p1c" d="' + sm(f1) + '"/><path class="im-p2c" d="' + sm(f2) + '"/><path class="im-f" d="' + sm(f) + '"/>';
      if(ok){
        var cy = function(v){ return r2(F.sy(Math.max(view.y[0], Math.min(view.y[1], v)))); };
        parts += '<line class="im-xl" x1="' + r2(F.sx(fx)) + '" x2="' + r2(F.sx(fx)) + '" y1="' + F.pad.t + '" y2="' + (F.h - F.pad.b) + '"/>' +
          '<circle class="im-d1" cx="' + r2(F.sx(fx)) + '" cy="' + cy(y1) + '" r="5"/><circle class="im-d2" cx="' + r2(F.sx(fx)) + '" cy="' + cy(y2) + '" r="5"/><circle class="im-df" cx="' + r2(F.sx(fx)) + '" cy="' + cy(y) + '" r="6"/>';
      }
      b1.innerHTML = P.svg(spec).replace('</svg>', C.def + '<g clip-path="url(#' + C.id + ')">' + parts + '</g></svg>');
      var A = g.A, B = g.B, lp = lin(g.p), lq = lin(g.q);
      $('.im-head').innerHTML = '<p class="im-eq im-big">' + tex(g.tex + ' = \\frac{' + A + '}{' + lp + '} ' + (B < 0 ? '- \\frac{' + (-B) + '}{' + lq + '}' : '+ \\frac{' + B + '}{' + lq + '}')) + '</p>' +
        '<p class="im-legend"><span class="im-key im-key-f"></span>the whole function <span class="im-key im-key-1"></span>' + tex('\\frac{' + A + '}{' + lp + '}') + ' <span class="im-key im-key-2"></span>' + tex('\\frac{' + B + '}{' + lq + '}') + '</p>';
      var head = ok ? '<b>At x = ' + clean(fx) + ': ' + n3(y1) + ' + ' + n3(y2) + ' = ' + n3(y) + '.</b> The two pieces add up to the function everywhere.' : '<b>At x = ' + clean(fx) + ' the function is undefined:</b> a vertical asymptote, where one piece blows up.';
      var N = function(x){ return g.c * x + g.d; };
      var why = '<p>The denominator has two different linear factors, so ' + tex(g.tex + ' = \\frac{A}{' + lp + '} + \\frac{B}{' + lq + '}') + '. Multiply through by the denominator: ' + tex(numTex(g) + ' = A(' + lq + ') + B(' + lp + ')') + '.</p>' +
        '<p><b>Cover-up:</b> put ' + tex('x = ' + g.p) + ' and the ' + tex('B') + ' term vanishes: ' + tex('A = \\frac{' + N(g.p) + '}{' + (g.p - g.q) + '} = ' + A) + '. Put ' + tex('x = ' + g.q) + ': ' + tex('B = \\frac{' + N(g.q) + '}{' + (g.q - g.p) + '} = ' + B) + '.</p>' +
        '<p>Each piece integrates to a logarithm: ' + tex('\\int ' + g.tex + '\\,dx = ' + A + '\\ln|' + lp + '| ' + (B < 0 ? '- ' + (-B) : '+ ' + B) + '\\ln|' + lq + '| + C') + '. Keep the absolute values: the antiderivative works on both sides of each asymptote.</p>' +
        '<p>BC uses distinct linear factors only: no repeated factors and no irreducible quadratics.</p>';
      T.explain($('.im-say'), head, why);
      var nm = $('.im-nums');
      if(nm){ var row = function(k, v){ return '<tr><th scope="row">' + k + '</th><td class="r">' + v + '</td></tr>'; };
        nm.innerHTML = '<h3 class="ls-title-l">At x = ' + clean(fx) + '</h3><table class="ls-tbl"><caption class="sr-only">The two pieces and their sum</caption><tbody>' + row('A/(' + esc(lp) + ')', ok ? n3(y1) : '—') + row('B/(' + esc(lq) + ')', ok ? n3(y2) : '—') + row('Sum = f(x)', ok ? n3(y) : 'undefined') + '</tbody></table>'; }
      if(LS){ LS.caption(T.sayHead($('.im-say')), 'explore'); LS.pills([{ k: 'A', html: String(A), tone: 'readout' }, { k: 'B', html: String(B), tone: 'readout' }], 'left', 'explore'); LS.pills(ok ? [{ k: 'f(x)', html: n3(y), tone: 'ghost' }] : [], 'right', 'explore'); }
    }
    function numTex(g){ return g.c === 0 ? String(g.d) : (g.c === 1 ? '' : g.c === -1 ? '-' : g.c) + 'x' + (g.d ? (g.d < 0 ? ' - ' + (-g.d) : ' + ' + g.d) : ''); }
    function lin(p){ return p === 0 ? 'x' : p > 0 ? 'x - ' + p : 'x + ' + (-p); }
    /* ----- improper */
    function drawImp(){
      var g = ig, b = bOf(), b1 = $('.im-p1'), b2 = $('.im-p2'), wd = wide(), val = IM.partial(g, b);
      b2.hidden = false;
      var view = g.kind === 'inf' ? { x: [0, g.a + 8], y: [0, Math.max(1.2, g.f(g.a) * 1.25)] } : { x: [0, g.a * 1.4], y: [0, 8] };
      var wh = size(b1, wd ? 0.8 : 0.58), spec = { label: 'Graph of ' + plain(g.tex) + ' with the area shaded ' + (g.kind === 'inf' ? 'from ' + g.a + ' to b' : 'from b to ' + g.a), width: wh[0], height: wh[1], x: view.x, y: view.y, xLabel: 'x', yLabel: 'y' };
      if(view.y[1] <= 2.5) spec.yStep = 0.5;   // quarter steps ("0.75") do not fit left of the axis and were set to its right
      var F = P.frame(spec), C = clip(F), lo = g.kind === 'inf' ? g.a : Math.max(b, 1e-4), hi = g.kind === 'inf' ? Math.min(b, view.x[1]) : g.a;
      b1.innerHTML = P.svg(spec).replace('</svg>', C.def + '<g clip-path="url(#' + C.id + ')"><path class="im-area" d="' + areaPath(g.f, lo, hi, F, view) + '"/><path class="im-f" d="' + pathOf(sample(g.f, 0.002, view.x[1], view, 400), F) + '"/></g>' +
        (g.kind === 'inf' && b > view.x[1] ? '<text class="im-lab" x="' + (F.w - F.pad.r - 4) + '" y="' + r2(F.sy(view.y[1] * 0.55)) + '" text-anchor="end">b = ' + clean(b, 0) + ' →</text>' : '') + '</svg>');
      var s1 = b1.querySelector('svg'); s1.setAttribute('role', 'group');
      var hx = g.kind === 'inf' ? Math.min(b, view.x[1] - 0.05) : b;
      handle(s1, { x: hx, F: F, min: g.kind === 'inf' ? g.a + 0.5 : 0.0001, max: g.kind === 'inf' ? view.x[1] - 0.05 : g.a / 2, label: function(){ return 'Bound b = ' + clean(bOf(), 3); },
        onMove: function(v){ act(); it = g.kind === 'inf' ? Math.min(1, Math.log10(Math.max(1, v - g.a + 0.5)) / 4) : Math.min(1, Math.max(0, -Math.log10(2 * v / g.a) / 4)); if(slider) slider.set(it); drawImp(); },
        onEnd: function(){ say('b = ' + clean(bOf(), 3) + ': the area is ' + n3(IM.partial(g, bOf())) + '.'); } });
      // the area as a function of b, on the log scale of the slider
      var tmax = 1, pts = [], top = 0;
      for(var i = 0; i <= 200; i++){ var t = i / 200, bb = g.kind === 'inf' ? g.a + 0.5 + (Math.pow(10, 4 * t) - 1) : g.a * Math.pow(10, -4 * t) / 2, v = IM.partial(g, bb); pts.push([t, v]); top = Math.max(top, v); }
      var lim = isFinite(g.limit) ? g.limit : null, ymax = Math.max(top, lim || 0) * 1.15;
      var wh2 = size(b2, wd ? 0.8 : 0.5), spec2 = { label: 'The area as a function of b, as b moves ' + (g.kind === 'inf' ? 'toward infinity' : 'toward 0'), width: wh2[0], height: wh2[1], x: [0, tmax], y: [0, ymax], xLabel: g.kind === 'inf' ? 'b → ∞' : 'b → 0⁺', yLabel: 'area' };
      var F2 = P.frame(spec2);
      b2.innerHTML = P.svg(spec2).replace('</svg>', (lim != null ? '<line class="im-lim" x1="' + F2.pad.l + '" x2="' + (F2.w - F2.pad.r) + '" y1="' + r2(F2.sy(lim)) + '" y2="' + r2(F2.sy(lim)) + '"/><text class="im-limlab" x="' + (F2.w - F2.pad.r - 4) + '" y="' + r2(F2.sy(lim) - 6) + '" text-anchor="end">limit ' + clean(lim) + '</text>' : '') +
        '<path class="im-ib" d="' + pathOf(pts, F2) + '"/><circle class="im-now" cx="' + r2(F2.sx(it)) + '" cy="' + r2(F2.sy(val)) + '" r="6"/></svg>');
      // the slider's own tick labels are meaningless here: say the b values at the ends instead
      Array.prototype.forEach.call(b2.querySelectorAll('svg text'), function(tx){ if(/^0?\.\d+$|^1$|^0$/.test(tx.textContent) && +tx.getAttribute('y') > F2.sy(0)) tx.textContent = ''; });
      var lims = g.kind === 'inf' ? '\\lim_{b \\to \\infty} \\int_{' + g.a + '}^{b}' : '\\lim_{b \\to 0^+} \\int_{b}^{' + g.a + '}';
      $('.im-head').innerHTML = '<p class="im-eq">' + tex((g.kind === 'inf' ? '\\int_{' + g.a + '}^{\\infty}' : '\\int_{0}^{' + g.a + '}') + ' ' + g.tex + '\\,dx = ' + lims + ' ' + g.tex + '\\,dx') + '</p>';
      var conv = lim != null;
      var head = '<b>b = ' + clean(b, b > 10 ? 0 : 3) + ': area ' + n3(val) + '.</b> ' + (conv ? 'It levels off at ' + clean(lim) + ': the integral converges to ' + clean(lim) + '.' : 'It keeps growing: the integral diverges.');
      var Fb = g.kind === 'inf' ? 'F(b) - F(' + g.a + ')' : 'F(' + g.a + ') - F(b)';
      var why = '<p>An improper integral is a limit of definite integrals: ' + tex(lims + ' ' + g.tex + '\\,dx') + ', with ' + tex('F(x) = ' + g.Ftex) + ' and ' + tex(Fb) + ' for each ' + tex('b') + '. Write the limit to the end; never put ' + tex('\\infty') + ' into ' + tex('F') + '.</p>' +
        (g.kind === 'inf' ? '<p>' + tex('\\int_1^{\\infty} \\frac{1}{x^p}\\,dx') + ' converges exactly when ' + tex('p > 1') + '. An integrand that goes to 0 is not enough: ' + tex('\\frac{1}{x}') + ' does, yet its area grows like ' + tex('\\ln b') + '.</p>'
          : '<p>Here the interval is finite but the integrand is unbounded at 0. ' + tex('\\int_0^1 \\frac{1}{x^p}\\,dx') + ' converges exactly when ' + tex('p < 1') + ': the opposite of the rule at infinity.</p>');
      T.explain($('.im-say'), head, why);
      var nm = $('.im-nums');
      if(nm){ var bs = g.kind === 'inf' ? [10, 100, 1000, 10000] : [0.1, 0.01, 0.001, 0.0001];
        nm.innerHTML = '<h3 class="ls-title-l">The area as b moves</h3><table class="ls-tbl"><caption class="sr-only">The definite integral for several b</caption><thead><tr><th scope="col">b</th><th scope="col" class="r">area</th></tr></thead><tbody>' + bs.map(function(x){ return '<tr><td>' + x + '</td><td class="r">' + n3(IM.partial(g, x)) + '</td></tr>'; }).join('') + '</tbody></table>'; }
      if(LS){ LS.caption(T.sayHead($('.im-say')), 'explore'); LS.pills([{ k: 'b', html: clean(b, b > 10 ? 0 : 3), tone: 'ghost' }, { k: 'Area', html: n3(val), tone: 'readout' }], 'left', 'explore'); LS.pills([{ html: conv ? 'Converges' : 'Diverges', tone: conv ? 'good' : 'warn' }], 'right', 'explore'); }
    }
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.im-fig')], dock: [$('.im-ctl')], why: [$('.im-say')], details: [$('.im-nums')], moreLabel: 'Swap u and dv, keyboard' });
      draw();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.im-handle'), text: 'Drag the bound b' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe($('.im-fig')); }
      sp.open();
    }
    setScene('parts');
    if(!window.LevlStudio && window.ResizeObserver){ var t2 = null; new ResizeObserver(function(){ clearTimeout(t2); t2 = setTimeout(draw, 80); }).observe($('.im-fig')); }
    return { studio: studio };
  }

  /* The tabular table as SVG: D and I columns, the diagonal arrows with
     their signs (shown: how many diagonals to draw). */
  function tabSvg(D, I, signs, shown, o){
    o = o || {};
    var rows = D.length, rh = 46, w = 340, h = 40 + rows * rh, cx1 = 92, cx2 = 248, out = [];
    out.push('<text class="im-th" x="' + cx1 + '" y="22" text-anchor="middle">D (differentiate)</text><text class="im-th" x="' + cx2 + '" y="22" text-anchor="middle">I (integrate)</text>');
    for(var i = 0; i < rows; i++){
      var y = 40 + i * rh + rh / 2;
      out.push('<foreignObject x="' + (cx1 - 70) + '" y="' + (y - 17) + '" width="140" height="34"><div xmlns="http://www.w3.org/1999/xhtml" class="im-cellm">' + tex(D[i]) + '</div></foreignObject>');
      out.push('<foreignObject x="' + (cx2 - 80) + '" y="' + (y - 17) + '" width="160" height="34"><div xmlns="http://www.w3.org/1999/xhtml" class="im-cellm' + (I[i] === '?' ? ' is-q' : '') + '">' + (I[i] === '?' ? '?' : tex(I[i])) + '</div></foreignObject>');
      if(i < rows - 1 && i < shown){
        var y2 = y + rh, sg = signs[i] || '';
        out.push('<line class="im-diag" x1="' + (cx1 + 40) + '" y1="' + (y + 6) + '" x2="' + (cx2 - 52) + '" y2="' + (y2 - 6) + '" marker-end="url(#imArr)"/>');
        out.push('<circle class="im-sgn-c" cx="' + ((cx1 + cx2) / 2 - 6) + '" cy="' + ((y + y2) / 2 - 4) + '" r="12"/><text class="im-sgn" x="' + ((cx1 + cx2) / 2 - 6) + '" y="' + ((y + y2) / 2 + 1) + '" text-anchor="middle">' + esc(sg) + '</text>');
      }
    }
    return '<svg class="calc-plot im-tab" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(o.label || 'Tabular method: the D column ' + D.join(', ') + '; the I column beside it; diagonal products with alternating signs') + '"><defs><marker id="imArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="im-arrh"/></marker></defs>' + out.join('') + '</svg>';
  }

  /* ===================================================== test yourself */
  var QM = T.tries();
  function quiz(host, data){
    T.drill(host, data, { slug: 'integration-methods', noun: 'drill', typeLabel: 'Kind of problem',
      types: [{ value: 'parts', label: 'Integration by parts' }, { value: 'tabular', label: 'Tabular method' }, { value: 'partial', label: 'Partial fractions' }, { value: 'improper', label: 'Improper integrals' }, { value: 'choose', label: 'Which method?' }],
      generate: function(r, ctx, type){ return IM.generate(r, ctx, type); },
      title: function(p){ return { parts: 'Integration by parts', tabular: 'The tabular method', partial: 'Partial fractions', improper: 'An improper integral', choose: 'Which method?' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ QM.clear(); QM.last = {}; QM.F = null; QM.svgEl = null; api.fig = figure(el, p); },
      onStep: function(s, right, api){ if(api.fig && api.fig.after) api.fig.after(s); },
      method: function(s){ return METHOD[s.key] || ''; },
      onTry: function(s, t, api){ return onTry(s, t, api.problem); }
    });
  }
  var METHOD = {
    pu: 'Pick u so that du is simpler (logs, then powers of x), and dv something you can integrate.',
    pv: 'Integrate dv; check by differentiating your v (a chain-rule factor 1/a appears with e^(ax), sin(ax), cos(ax)).',
    pr: 'uv minus the integral of v du: write uv, then integrate v du, and keep the minus sign. Add + C.',
    pd: 'Evaluate the antiderivative at the upper bound minus the lower bound.',
    ti: 'Integrate three times; each time divide by the coefficient of x again, and track the sign of sin and cos.',
    ts: 'The diagonals alternate in sign, starting with +.',
    tr: 'Multiply along each diagonal (D entry times the I entry one row down) and use the signs +, −, +. Add + C.',
    fa: 'Cover up the factor under A and put its zero into what is left.', fb: 'Cover up the factor under B and put its zero into what is left.',
    fr: 'Each piece A/(x − a) integrates to A ln|x − a|. Add + C.',
    is: 'Replace the trouble spot (∞, or the point where the integrand blows up) by b and take a limit.',
    ia: 'Find an antiderivative F, then F(upper) − F(lower) with b as one of the bounds.',
    ic: 'Take the limit of your expression in b: a finite number means it converges.',
    iv: 'Let the b term go to its limit and simplify.',
    cm: 'Look for an inner function whose derivative is there (substitution), a product of unlike functions (parts), a factored rational function (partial fractions), or something algebra simplifies.',
    cr: 'Do the method you chose, then check by differentiating. Add + C.'
  };
  function onTry(s, t, p){
    var g = p.fig, who = t.ok || t.shown ? 'right' : 'yours', k = s.key, N = T.numText;
    if(s.kind !== 'num') return false;
    var val = who === 'right' ? s.cell.answer : t.value, mk = [];
    if(!isFinite(val)) return false;
    if(g.kind === 'improper' && k === 'iv') mk.push({ hline: val, who: who, label: (who === 'yours' ? 'yours: ' : 'limit ') + N(val) });
    else return false;
    if(who === 'yours') QM.last[k] = mk; else if(QM.last[k]) mk = QM.last[k].concat(mk);
    QM.set(k, mk);
    if(QM.svgEl && QM.F){ var gg = QM.svgEl.querySelector('.im-tries'); if(gg) gg.innerHTML = QM.svg(QM.F); }
    return true;
  }
  function sized(box, draw, ratio){
    var last = '';
    function dims(){
      var st = box.closest && box.closest('.ls-drill-stage'), w = Math.round(box.clientWidth) || 480, h = st ? Math.round(box.clientHeight) : 0;
      if(!st || h < 150) h = st ? 150 : Math.round(Math.min(w * (ratio || 0.65), 420));
      return [Math.max(220, w), h];
    }
    function go(force){ var d = dims(), k = d.join('x'); if(k === last && !force) return; last = k; draw(d[0], d[1]); }
    draw(480, Math.round(480 * (ratio || 0.65)));
    setTimeout(function(){ go(true); }, 0);
    if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(go, 40); }).observe(box); }
  }
  function figure(el, p){
    var g = p.fig;
    if(g.kind === 'tabular') return tabFig(el, p);
    if(g.kind === 'partial') return pfFig(el, p);
    if(g.kind === 'improper') return impFig(el, p);
    if(g.kind === 'choose') return chooseFig(el, p);
    return partsFig(el, p);
  }
  function fnx(s){ return M.fn(s, ['x']); }
  function viewOf(fns, a, b){
    var lo = Infinity, hi = -Infinity;
    fns.forEach(function(f){ for(var i = 0; i <= 120; i++){ var y = f(a + (b - a) * i / 120); if(isFinite(y) && Math.abs(y) < 50){ lo = Math.min(lo, y); hi = Math.max(hi, y); } } });
    if(!isFinite(lo)){ lo = -1; hi = 1; }
    lo = Math.min(lo, 0); hi = Math.max(hi, 0); var pad = (hi - lo) * 0.12 || 1;
    return { x: [a, b], y: [lo - pad, hi + pad] };
  }
  /* parts: the u/dv card filling in over the integrand's graph. */
  function partsFig(el, p){
    var g = p.fig, done = {}, f = fnx(g.integrand), last = [480, 300];
    var a = g.A != null ? Math.min(g.A, 0) - 0.2 : (/ln/.test(g.integrand) ? 0.2 : -2), b = g.B != null ? g.B + 0.3 : (/ln/.test(g.integrand) ? 3 : 2);
    if(/ln/.test(g.integrand)) a = Math.max(a, 0.05);
    function draw(w, h){
      last = [w, h];
      var cardH = 74, ph = Math.max(140, h - cardH - 10), view = viewOf([f], a, b);
      var spec = { label: 'Graph of the integrand' + (g.A != null ? ' with the area between the bounds shaded' : ''), width: w, height: ph, x: view.x, y: view.y, xLabel: 'x', yLabel: 'y' };
      var F = P.frame(spec), C = clip(F), sh = g.A != null ? '<path class="im-area' + (done.pd ? ' is-done' : '') + '" d="' + areaPath(f, g.A, g.B, F, view) + '"/>' : '';
      var lab = done.pd ? '<text class="im-lab im-lab-a" x="' + r2(F.sx((g.A + g.B) / 2)) + '" y="' + r2(F.pad.t + 14) + '" text-anchor="middle">area ' + n3(g.value) + '</text>' : '';
      var cell = function(k, v){ return '<div class="im-cell' + (v ? '' : ' is-q') + '"><span class="im-k">' + k + '</span>' + (v ? tex(v) : '?') + '</div>'; };
      var vTex = done.pv ? exprTex(p.steps[1].cell.expr.answer) : '';
      el.innerHTML = '<div class="im-qparts"><div class="im-uv-card">' + cell('u', done.pu ? g.u : '') + cell('dv', done.pu ? g.dv : '') + cell('du', done.pu ? duOf(g) : '') + cell('v', vTex) + '</div>' +
        '<figure class="cd-fig">' + P.svg(spec).replace('</svg>', C.def + '<g clip-path="url(#' + C.id + ')">' + sh + '<path class="im-f" d="' + pathOf(sample(f, view.x[0], view.x[1], view), F) + '"/></g>' + lab + '</svg>') + '</figure></div>';
    }
    sized(el, draw, 0.75);
    return { after: function(s){ done[s.key] = true; draw(last[0], last[1]); } };
  }
  function duOf(g){ return /ln/.test(g.integrand) ? '\\frac{1}{x}\\,dx' : 'dx'; }
  function exprTex(s){ var E = window.ApCalcExpr; try{ return E.toTex(E.parse(s, { vars: ['x'] })); }catch(e){ return s; } }
  function tabFig(el, p){
    var g = p.fig, done = {};
    function draw(){
      var I = [g.I[0], g.I[1], g.I[2], done.ti ? g.I[3] : '?'];
      el.innerHTML = '<figure class="cd-fig im-qtab">' + tabSvg(g.D, I, done.ts ? ['+', '−', '+'] : ['?', '?', '?'], 3, { label: 'Tabular table: D column x squared, 2x, 2, 0; I column ' + (done.ti ? 'complete' : 'with its last entry to find') }) +
        (done.tr ? '<p class="im-eq">' + tex('\\int x^2' + g.I[0] + '\\,dx = x^2\\left(' + g.I[1] + '\\right) - 2x\\left(' + g.I[2] + '\\right) + 2\\left(' + g.I[3] + '\\right) + C') + '</p>' : '') + '</figure>';
    }
    draw();
    return { after: function(s){ done[s.key] = true; draw(); } };
  }
  function pfFig(el, p){
    var g = p.fig, done = {}, last = [480, 320];
    var f = function(x){ return (g.c * x + g.d) / ((x - g.p) * (x - g.q)); };
    function draw(w, h){
      last = [w, h];
      var lo = g.p - 2.5, hi = g.q + 2.5, view = { x: [lo, hi], y: [-8, 8] };
      var spec = { label: 'Graph of the rational function with its two vertical asymptotes' + (done.fb ? ' and its partial fractions' : ''), width: w, height: h, x: view.x, y: view.y, xLabel: 'x', yLabel: 'y' };
      var F = P.frame(spec), C = clip(F);
      var sm = function(fn){ return pathOf(sample(fn, lo, hi, view, 600).map(function(q){ return Math.abs(q[0] - g.p) < 0.02 || Math.abs(q[0] - g.q) < 0.02 ? [q[0], NaN] : q; }), F); };
      var parts = '<line class="im-asym" x1="' + r2(F.sx(g.p)) + '" x2="' + r2(F.sx(g.p)) + '" y1="' + F.pad.t + '" y2="' + (F.h - F.pad.b) + '"/><line class="im-asym" x1="' + r2(F.sx(g.q)) + '" x2="' + r2(F.sx(g.q)) + '" y1="' + F.pad.t + '" y2="' + (F.h - F.pad.b) + '"/>';
      if(done.fa) parts += '<path class="im-p1c" d="' + sm(function(x){ return g.A / (x - g.p); }) + '"/>';
      if(done.fb) parts += '<path class="im-p2c" d="' + sm(function(x){ return g.B / (x - g.q); }) + '"/>';
      parts += '<path class="im-f" d="' + sm(f) + '"/>';
      var labs = '<text class="im-lab" x="' + r2(F.sx(g.p) + 5) + '" y="' + (F.pad.t + 14) + '">x = ' + g.p + '</text><text class="im-lab" x="' + r2(F.sx(g.q) + 5) + '" y="' + (F.pad.t + 30) + '">x = ' + g.q + '</text>';
      el.innerHTML = '<figure class="cd-fig">' + P.svg(spec).replace('</svg>', C.def + '<g clip-path="url(#' + C.id + ')">' + parts + '</g>' + labs + '</svg>') +
        (done.fa || done.fb ? '<p class="im-legend"><span class="im-key im-key-f"></span>whole' + (done.fa ? ' <span class="im-key im-key-1"></span>' + tex('\\frac{' + g.A + '}{' + lin(g.p) + '}') : '') + (done.fb ? ' <span class="im-key im-key-2"></span>' + tex('\\frac{' + g.B + '}{' + lin(g.q) + '}') : '') + '</p>' : '') + '</figure>';
    }
    function lin(q){ return q === 0 ? 'x' : q > 0 ? 'x - ' + q : 'x + ' + (-q); }
    sized(el, draw, 0.7);
    return { after: function(s){ done[s.key] = true; draw(last[0], last[1]); } };
  }
  function impFig(el, p){
    var g = p.fig, done = {}, last = [480, 320], f = fnx(g.f), Fb = M.fn(p.steps[1].cell.expr.answer, ['b']);
    function draw(w, h){
      last = [w, h];
      var two = done.ia, w1 = two && w > 560 ? Math.round(w * 0.55) - 6 : w, h1 = two && w <= 560 ? Math.round(h * 0.55) : h;
      var xmax = g.inf ? g.a + 8 : g.a * 1.3, ytop = g.inf ? Math.max(f(g.a), f(g.a + 0.5)) * 1.3 : f(g.a * 0.12);
      var view = { x: [0, xmax], y: [0, ytop] };
      var spec = { label: 'Graph of the integrand with the region ' + (g.inf ? 'from ' + g.a + ' to infinity' : 'from 0 to ' + g.a) + ' shaded', width: w1, height: h1, x: view.x, y: view.y, xLabel: 'x', yLabel: 'y' };
      var F = P.frame(spec), C = clip(F);
      var reg = g.inf ? areaPath(f, g.a, xmax, F, view) : areaPath(f, 0.004 * g.a, g.a, F, view);
      var out = '<div class="im-qimp' + (two && w > 560 ? ' is-wide' : '') + '"><figure class="cd-fig">' + P.svg(spec).replace('</svg>', C.def + '<g clip-path="url(#' + C.id + ')"><path class="im-area is-fade" d="' + reg + '"/><path class="im-f" d="' + pathOf(sample(f, 0.003, xmax, view, 400), F) + '"/></g>' +
        '<text class="im-lab" x="' + r2(g.inf ? F.w - F.pad.r - 4 : F.sx(0) + 6) + '" y="' + (F.pad.t + 14) + '" text-anchor="' + (g.inf ? 'end' : 'start') + '">' + (g.inf ? 'to ∞ →' : '↑ unbounded at 0') + '</text></svg>') + '</figure>';
      if(two){
        var pts = [], top = 0;
        for(var i = 0; i <= 200; i++){ var t = i / 200, bb = g.inf ? g.a + 0.5 + (Math.pow(10, 4 * t) - 1) : g.a * Math.pow(10, -4 * t) / 2, v = Fb(bb); pts.push([t, v]); if(isFinite(v)) top = Math.max(top, v); }
        var ymax = Math.max(top, g.value || 0) * 1.15 || 1;
        var spec2 = { label: 'The partial integral as a function of b, as b moves ' + (g.inf ? 'toward infinity' : 'toward 0'), width: two && w > 560 ? w - w1 - 12 : w, height: two && w <= 560 ? h - h1 - 8 : h, x: [0, 1], y: [0, ymax], xLabel: g.inf ? 'b → ∞' : 'b → 0⁺', yLabel: 'area' };
        var F2 = P.frame(spec2);
        var limL = done.ic && g.conv ? '<line class="im-lim" x1="' + F2.pad.l + '" x2="' + (F2.w - F2.pad.r) + '" y1="' + r2(F2.sy(g.value)) + '" y2="' + r2(F2.sy(g.value)) + '"/>' : '';
        out += '<figure class="cd-fig">' + P.svg(spec2).replace('</svg>', limL + '<path class="im-ib" d="' + pathOf(pts, F2) + '"/>' + (done.ic ? '<text class="im-limlab" x="' + (F2.w - F2.pad.r - 4) + '" y="' + (F2.pad.t + 14) + '" text-anchor="end">' + (g.conv ? 'converges' : 'diverges') + '</text>' : '') + '<g class="im-tries">' + QM.svg(F2) + '</g></svg>') + '</figure>';
        QM.F = F2;
      }
      el.innerHTML = out + '</div>';
      var svgs = el.querySelectorAll('svg'); QM.svgEl = svgs[svgs.length - 1];
      Array.prototype.forEach.call(el.querySelectorAll('.cd-fig:nth-child(2) svg text'), function(tx){ if(/^(0|0?\.\d+|1)$/.test(tx.textContent) && tx.getAttribute('text-anchor') === 'middle') tx.textContent = ''; });
    }
    sized(el, draw, 0.62);
    return { after: function(s){ done[s.key] = true; draw(last[0], last[1]); } };
  }
  /* which method: the integral, large, with its structure named once chosen. */
  function chooseFig(el, p){
    var g = p.fig, done = {};
    var NOTE = { sub: g.inner ? 'inner function ' + tex('u = ' + exprTex(g.inner)) + ', and its derivative is the other factor' : 'an inner function and its derivative',
      parts: 'a product of unlike functions: no inner derivative to cancel', pf: 'a rational function with distinct linear factors below', alg: 'simplifies to a sum of powers of ' + tex('x') };
    function draw(){
      el.innerHTML = '<figure class="cd-fig im-qchoose"><div class="im-bigint">' + tex('\\int ' + exprTex(g.f) + '\\,dx', { display: true }) + '</div>' +
        (done.cm ? '<p class="im-note"><b>' + esc(IM.METHODS[['sub', 'parts', 'pf', 'alg'].indexOf(g.m)]) + ':</b> ' + NOTE[g.m] + '.</p>' : '<p class="im-note is-q">Look at its structure: what is inside what, and what multiplies what?</p>') +
        (done.cr ? '<p class="im-eq">' + tex('= ' + exprTex(g.F) + ' + C') + '</p>' : '') + '</figure>';
    }
    draw();
    return { after: function(s){ done[s.key] = true; draw(); } };
  }
})();
