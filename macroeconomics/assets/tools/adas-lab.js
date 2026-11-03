/* AD-AS lab page (docs/apmacro-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T4). The model is ApMacroMath.adasLab (tools/math/adas-lab.js);
   every graph is drawn by ApMacroGraph (mac-graph.js) and every graph step
   graded by ApMacroGrade.graph.

   Explore: the AD-AS graph and, once Unit 5 is open (its "phillips"
   context is served), the Phillips curves beside it, tied point for point.
   Pick a shock: its curve shifts smoothly, the economy moves to a new
   short-run equilibrium, the gap against LRAS is marked, and the Phillips
   point moves along SRPC (an AD shock) or SRPC shifts (an SRAS shock).
   "Run the long run" animates self-adjustment: nominal wages, so SRAS, until
   AD, SRAS and LRAS meet. Curves can also be dragged, or moved with the
   arrow keys from their handles under the graph. The shared ApMacroGraph.svg
   draws every curve; this script adds the annotation layer the exam asks
   for (E1/E2/E3, YF, the gap, shift arrows) in the same coordinates.

   Test yourself: ApMacroTools.drill with the model's four kinds. A graph
   step mounts ApMacroGraph on the stage; its Check grades the drawing with
   ApMacroGrade.graph and ticks the step's hidden option, so drill() records
   it as "adas-lab:<context>:graph" like any step. */
(function(){
  'use strict';
  var T = window.ApMacroTools, M = window.ApMacroMath, A = M && M.adasLab, G = window.ApMacroGraph, GR = window.ApMacroGrade;
  var app = document.getElementById('app');
  if(!T || !A || !G || !app) return;
  if(A.stub){ app.innerHTML = '<p class="mac-soon">This trainer is being built. Meanwhile, read the <a href="../learn.html">free notes</a>.</p>'; return; }
  var esc = T.esc;

  /* The graph's plot box in viewBox units (mac-graph.js draws 320 x 300 with
     the plot at x 50-300, y 14-240, data 0-10 on both axes). */
  function px(x){ return 50 + x * 25; }
  function py(v){ return 14 + (10 - v) * 22.6; }
  function f1(v){ return Math.round(v * 10) / 10; }
  function reduced(){ return T.reduced ? T.reduced() : false; }
  function ease(t){ return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  T.mount('adas-lab', function(app, data){
    var ex = null;
    var hasPC = (data.contexts || []).some(function(c){ return c.id === 'phillips'; });
    T.modes(app, { slug: 'adas-lab',
      explore: function(host){ ex = explore(host, hasPC); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------ annotations */
  function arrowH(x1, x2, y, cls){
    var d = x2 > x1 ? 1 : -1;
    return '<path class="adl-arrow ' + (cls || '') + '" d="M' + f1(x1) + ' ' + f1(y) + 'H' + f1(x2 - d * 1.5) + '"/><path class="adl-head ' + (cls || '') + '" d="M' + f1(x2) + ' ' + f1(y) + 'l' + (-d * 7) + ' -4.5v9z"/>';
  }
  function dot(p, label, cls, side){
    // side: the free wedge between the crossing curves, left or right of the point
    var x = px(p[0]), y = py(p[1]), lx = side === 'left' ? x - 10 : x + 10;
    return '<circle class="mac-gr-eq ' + (cls || '') + '" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + (cls && cls.indexOf('is-old') > -1 ? 4 : 5.5) + '"/>' +
      (label ? '<text class="mac-gr-plabel adl-plabel ' + (cls || '') + '" x="' + f1(lx) + '" y="' + f1(y + 4) + '" text-anchor="' + (side === 'left' ? 'end' : 'start') + '">' + label + '</text>' : '');
  }
  function guides(p, cls){ return '<path class="mac-gr-guide ' + (cls || '') + '" d="M' + f1(px(0)) + ' ' + f1(py(p[1])) + 'H' + f1(px(p[0])) + 'V' + f1(py(0)) + '"/>'; }
  function sub(main, s){ return main + '<tspan class="mac-gr-sub" dy="3">' + s + '</tspan>'; }
  // Color each live curve and its label by curve (CSS: .adl-c-AD ...), so the
  // same color marks SRAS and SRPC, LRAS and LRPC.
  function tag(svg){
    return svg.replace(/(<g class="mac-gr-c" data-curve="(\w+)">[\s\S]*?<\/g>)<text class="mac-gr-clabel /g, '$1<text class="mac-gr-clabel adl-c-$2 ');
  }
  /* The short-run position of a curve that has since moved back (an SRAS shock
     undone by the long run): a faded straight line of ApMacroGraph's shape. */
  function ghost(shape, at, id, n){
    var x0 = Math.max(0, at - 5), x1 = Math.min(10, at + 5), yy = function(x){ return shape === 'up' ? 5 + (x - at) : 5 - (x - at); };
    var lx = x1, ly = yy(x1);
    return '<path class="mac-gr-curve is-old adl-ghost" d="M' + f1(px(x0)) + ' ' + f1(py(yy(x0))) + 'L' + f1(px(x1)) + ' ' + f1(py(yy(x1))) + '"/>' +
      '<text class="mac-gr-clabel is-old" x="' + f1(px(lx) - (shape === 'up' ? 4 : 2)) + '" y="' + f1(py(ly) + (shape === 'up' ? -4 : 2)) + '" text-anchor="end">' + id + '<tspan class="mac-gr-sub" dy="3">' + n + '</tspan></text>';
  }
  function inject(svg, extra){ return svg.replace('</svg>', extra + '</svg>'); }

  /* ------------------------------------------------------------ explore */
  function explore(host, hasPC){
    var st = { a: 0, s: 0, phase: 'start', shock: null, sr: null, anim: null, panel: 'adas', stack: false, labels: true };
    var LS = null, sp = null;
    var shockOpts = [{ value: '', label: 'Choose a shock…' }];
    host.innerHTML =
      '<figure class="adl-fig' + (hasPC ? ' has-pc' : '') + '">' +
        (hasPC ? '<div class="adl-tabs" role="group" aria-label="Which graph"><button type="button" class="tchip adl-tab on" data-p="adas" aria-pressed="true">AD-AS</button><button type="button" class="tchip adl-tab" data-p="pc" aria-pressed="false">Phillips</button></div>' : '') +
        '<div class="adl-panels"><div class="adl-panel adl-p-adas"><div class="adl-svg adl-adas"></div>' +
          '<div class="adl-handles"><button type="button" class="adl-h" data-c="AD" aria-label="Aggregate demand: use the left and right arrow keys to shift it; Home puts it back">AD <span aria-hidden="true">↔</span></button>' +
          '<button type="button" class="adl-h" data-c="SRAS" aria-label="Short-run aggregate supply: use the left and right arrow keys to shift it; Home puts it back">SRAS <span aria-hidden="true">↔</span></button></div></div>' +
        (hasPC ? '<div class="adl-panel adl-p-pc"><div class="adl-svg adl-pc"></div><p class="adl-link">Tied to AD-AS: an AD shift moves along SRPC; an SRAS shift shifts SRPC.</p></div>' : '') +
        '</div><figcaption class="sr-only adl-live"></figcaption></figure>' +
      '<div class="adl-ctl"><div class="adl-shockrow"></div><div class="adl-btns"><button type="button" class="btn-press sm adl-long" disabled>Run the long run</button><button type="button" class="bt-btn adl-reset">Start over</button></div></div>' +
      '<div class="adl-say"></div><div class="adl-nums"></div>' +
      T.moreHtml('<div class="bt-radio"><input type="checkbox" id="adl-stack"><label for="adl-stack">Add each shock to the last one (stack shocks)</label></div>' +
        '<div class="bt-radio"><input type="checkbox" id="adl-lab" checked><label for="adl-lab">Mark E1, E2, Y<sub>F</sub>, the gap and the shift arrows</label></div>' +
        '<p class="bt-small">You can also drag AD or SRAS on the graph, or tab to its handle and use the arrow keys.</p>', 'stack shocks, graph marks');
    var $ = function(sel){ return (LS ? LS.root : host).querySelector(sel) || host.querySelector(sel); };
    var fig = host.querySelector('.adl-fig'), adasEl = host.querySelector('.adl-adas'), pcEl = host.querySelector('.adl-pc');
    var say = T.announcer(host.querySelector('.adl-live'));
    var groups = {};
    A.SHOCKS.forEach(function(s){ (groups[s.curve + (s.dir > 0 ? '+' : '-')] = groups[s.curve + (s.dir > 0 ? '+' : '-')] || []).push(s); });
    var sel = document.createElement('div');
    sel.className = 'bt-ctl bt-select adl-shock';
    sel.innerHTML = '<label for="adl-shock">Shock the economy</label><select id="adl-shock"><option value="">Choose a shock…</option>' +
      [['AD+', 'Spending rises: AD shifts right'], ['AD-', 'Spending falls: AD shifts left'], ['SRAS-', 'Costs rise: SRAS shifts left'], ['SRAS+', 'Costs fall: SRAS shifts right']].map(function(g){
        return '<optgroup label="' + esc(g[1]) + '">' + groups[g[0]].map(function(s){ return '<option value="' + s.id + '">' + esc(s.label) + '</option>'; }).join('') + '</optgroup>';
      }).join('') + '</select>';
    host.querySelector('.adl-shockrow').appendChild(sel);
    var select = sel.querySelector('select'), longBtn = host.querySelector('.adl-long'), resetBtn = host.querySelector('.adl-reset');
    void shockOpts;
    var cue = T.cue('Pick a shock, watch the short run, then run the long run.');
    host.insertBefore(cue.el, host.firstChild);

    /* -------- the two pictures */
    function eqNow(){ return A.state(st.a, st.s); }
    function adasSvg(){
      var S = eqNow(), spec = { kind: 'adas' }, shifts = {};
      if(Math.abs(st.a) > 1e-6) shifts.AD = st.a;
      if(Math.abs(st.s) > 1e-6) shifts.SRAS = st.s;
      var moved = Object.keys(shifts).length > 0;
      var label = 'Aggregate demand and aggregate supply graph: ' + G.describe(spec, { shifts: shifts }) + ' ' + gapSentence(S);
      var svg = tag(G.svg(spec, { shifts: shifts, focus: st.focus }, { label: label })), x = [];
      if(st.labels){
        x.push('<text class="adl-tick" x="' + px(5) + '" y="254" text-anchor="middle">' + sub('Y', 'F') + '</text>');
        // E1's label goes on the side away from the point the economy moved to.
        var away = (st.phase === 'long' && st.sr ? st.sr[0] : S.eq[0]) < 5 ? 'right' : 'left';
        if(moved || (st.phase === 'long' && st.sr)) x.push('<text class="mac-gr-plabel is-old adl-plabel" x="' + f1(px(5) + (away === 'left' ? -10 : 10)) + '" y="' + f1(py(5) + 4) + '" text-anchor="' + (away === 'left' ? 'end' : 'start') + '">E' + '<tspan class="mac-gr-sub" dy="3">1</tspan></text>');
        if(Math.abs(st.a) >= 0.25) x.push(arrowH(px(7.8), px(7.8 + st.a), py(2.2) - 9, 'adl-k-AD'));
        if(Math.abs(st.s) >= 0.25) x.push(arrowH(px(6.6), px(6.6 + st.s), py(6.6) - 9, 'adl-k-SRAS'));
        if(S.gap !== 'none' && Math.abs(S.gapSize) > 0.08){
          var gy = py(0.75);
          x.push('<path class="adl-gap" d="M' + f1(px(S.eq[0])) + ' ' + f1(gy) + 'H' + f1(px(5)) + '"/><path class="adl-gapend" d="M' + f1(px(S.eq[0])) + ' ' + f1(gy - 5) + 'v10M' + f1(px(5)) + ' ' + f1(gy - 5) + 'v10"/>');
          var mid = (px(S.eq[0]) + px(5)) / 2;
          x.push('<text class="adl-gaplabel" x="' + f1(mid) + '" y="' + f1(gy - 8) + '" text-anchor="middle">' + (S.gap === 'recessionary' ? 'Recessionary gap' : 'Inflationary gap') + '</text>');
        }
      }
      var lr = st.phase === 'long' && st.sr;
      if(lr && Math.abs(st.srSras - st.s) > 0.2 && Math.abs(st.srSras) > 0.2) x.push(ghost('up', 5 + st.srSras, 'SRAS', '2'));
      if((moved || lr) && S.eq){
        if(lr) x.push(dot(st.sr, st.labels ? 'E<tspan class="mac-gr-sub" dy="3">2</tspan>' : '', 'is-old', st.sr[0] < 5 ? 'left' : 'right'));
        x.push(guides(S.eq, 'adl-now'), dot(S.eq, st.labels ? 'E<tspan class="mac-gr-sub" dy="3">' + (st.phase === 'long' ? 3 : 2) + '</tspan>' : '', 'adl-now', lr ? (st.sr[0] < 5 ? 'right' : 'left') : S.eq[0] < 5 ? 'left' : 'right'));
      }
      return inject(svg, x.join(''));
    }
    function pcSvg(){
      var S = eqNow(), shifts = {};
      if(Math.abs(S.srpc) > 1e-6) shifts.SRPC = S.srpc;
      var moved = Math.abs(st.a) > 1e-6 || Math.abs(st.s) > 1e-6;
      var letter = st.phase === 'long' ? 'C' : 'B';
      var spec = { kind: 'phillips', pointLabel: letter };
      var label = 'Phillips curves: ' + G.describe(spec, { shifts: shifts }) + ' ' + pcSentence(S);
      var lr = st.phase === 'long' && st.sr;
      var svg = tag(G.svg(spec, { shifts: shifts, point: moved || lr ? S.point : null }, { label: label })), x = [];
      if(lr && Math.abs(st.srSras - st.s) > 0.2 && Math.abs(st.srSras) > 0.2) x.push(ghost('down', 5 - st.srSras, 'SRPC', '2'));
      if(st.labels){
        x.push('<text class="adl-tick" x="' + px(5) + '" y="254" text-anchor="middle">' + sub('u', 'N') + '</text>');
        x.push('<text class="mac-gr-plabel is-old adl-plabel" x="' + f1(px(5) - 7) + '" y="' + f1(py(5) + 17) + '" text-anchor="end">A</text>');
        if(Math.abs(S.srpc) >= 0.25) x.push(arrowH(px(7.8), px(7.8 + S.srpc), py(2.2) - 9, 'adl-k-SRAS'));
      }
      if((moved || lr) && S.point){
        if(lr){ var b = [10 - st.sr[0], st.sr[1]]; x.push(dot(b, st.labels ? 'B' : '', 'is-old')); }
        x.push(guides(S.point, 'adl-now'));
      }
      return inject(svg, x.join(''));
    }
    function gapSentence(S){
      return S.gap === 'none' ? 'Real GDP is at full employment.' : 'Real GDP is ' + (S.gap === 'recessionary' ? 'below' : 'above') + ' full employment: a ' + S.gap + ' gap.';
    }
    function pcSentence(S){
      if(!S.point) return '';
      var u = S.point[0], i = S.point[1];
      return 'Unemployment is ' + (Math.abs(u - 5) < 0.05 ? 'at' : u > 5 ? 'above' : 'below') + ' the natural rate and inflation is ' + (Math.abs(i - 5) < 0.05 ? 'at its starting rate' : i > 5 ? 'higher than at the start' : 'lower than at the start') + '.';
    }
    function draw(){
      adasEl.innerHTML = adasSvg();
      if(pcEl) pcEl.innerHTML = pcSvg();
      var S = eqNow();
      longBtn.disabled = !!st.anim || S.gap === 'none';
      host.querySelectorAll('.adl-h').forEach(function(b){ b.classList.toggle('is-moved', Math.abs(b.getAttribute('data-c') === 'AD' ? st.a : st.s) > 1e-6); });
      if(!st.anim) words();
    }
    function cmp(v, w0){ return Math.abs(v - w0) < 0.05 ? 'same' : v > w0 ? 'up' : 'down'; }
    function words(){
      var S = eqNow(), sh = st.shock && A.shock(st.shock), head, body = [];
      var pl = cmp(S.eq[1], 5), y = cmp(S.eq[0], 5);
      var plW = { up: 'higher', down: 'lower', same: 'unchanged' };
      if(st.phase === 'start'){
        head = 'At full employment: AD, SRAS and LRAS meet at E<sub>1</sub>. <b>Pick a shock</b> to move the economy.';
        body.push('LRAS is vertical at full-employment output Y<sub>F</sub>: in the long run output does not depend on the price level.');
        body.push('A change in spending (C, I, G, net exports) shifts AD. A change in production costs (input prices, nominal wages, expected inflation) shifts SRAS.');
      } else if(st.phase === 'long'){
        head = '<b>Long run:</b> nominal wages ' + (st.srS < 0 ? 'fell' : 'rose') + ', so SRAS shifted ' + (st.srS < 0 ? 'right' : 'left') + '. Back at full employment, the price level is ' + (pl === 'same' ? 'back where it was at E<sub>1</sub>.' : plW[pl] + ' than at E<sub>1</sub>.');
        body.push('In the ' + (st.srS < 0 ? 'recessionary' : 'inflationary') + ' gap unemployment was ' + (st.srS < 0 ? 'above' : 'below') + ' the natural rate, so as wage contracts renewed, nominal wages and other input prices ' + (st.srS < 0 ? 'fell' : 'rose') + '.');
        body.push((st.srS < 0 ? 'Lower' : 'Higher') + ' costs shifted SRAS ' + (st.srS < 0 ? 'right' : 'left') + ' along AD until AD, SRAS and LRAS met (E<sub>3</sub>): real GDP back at Y<sub>F</sub>, unemployment back at the natural rate.');
        body.push('AD did not move: self-adjustment works through nominal wages and SRAS, with no fiscal or monetary policy.');
        if(hasPC) body.push('On the Phillips curves, SRPC shifted ' + (st.srS < 0 ? 'left' : 'right') + ' as expected inflation changed, taking the economy from B to C on LRPC, at the natural rate of unemployment.');
      } else {
        var lead = sh && st.phase === 'short' ? '<b>' + esc(sh.label) + ':</b> ' + esc(sh.curve) + ' shifts ' + (sh.dir > 0 ? 'right' : 'left') + '. ' : '';
        head = lead + 'Price level ' + (pl === 'same' ? 'unchanged' : pl === 'up' ? 'up' : 'down') + ', real GDP ' + (y === 'same' ? 'unchanged' : y === 'up' ? 'up' : 'down') + (S.gap === 'none' ? ', at full employment.' : ': ' + (S.gap === 'recessionary' ? 'a recessionary gap.' : 'an inflationary gap.'));
        if(sh && st.phase === 'short') body.push(esc(sh.text) + ' ' + esc(sh.link));
        body.push('At E<sub>2</sub> the price level is ' + plW[pl] + ' and real GDP is ' + plW[y] + ' than at E<sub>1</sub>.');
        if(S.gap !== 'none') body.push('Real GDP is ' + (S.gap === 'recessionary' ? 'below' : 'above') + ' Y<sub>F</sub>, so unemployment is ' + (S.gap === 'recessionary' ? 'above' : 'below') + ' the natural rate. With no policy, nominal wages will ' + (S.gap === 'recessionary' ? 'fall' : 'rise') + ' and SRAS will shift ' + (S.gap === 'recessionary' ? 'right' : 'left') + ': press <b>Run the long run</b>.');
        if(hasPC){
          var adOnly = Math.abs(st.s) < 1e-6, srOnly = Math.abs(st.a) < 1e-6;
          body.push(adOnly ? 'On the Phillips curves this is a move ' + (st.a > 0 ? 'up along SRPC from A to B: less unemployment, more inflation.' : 'down along SRPC from A to B: more unemployment, less inflation.') :
            srOnly ? 'On the Phillips curves SRPC shifts ' + (st.s < 0 ? 'right: more unemployment and more inflation (stagflation).' : 'left: less unemployment and less inflation.') :
            'On the Phillips curves both happen: SRPC shifts with SRAS, and the AD change moves the economy along it.');
          if(head.length < 200) head += ' ' + (adOnly ? 'Phillips curve: ' + (st.a > 0 ? 'up' : 'down') + ' along SRPC, A to B.' : srOnly ? 'Phillips curve: SRPC shifts ' + (st.s < 0 ? 'right.' : 'left.') : '');
        }
      }
      T.explain(host.querySelector('.adl-say') || $('.adl-say'), head, '<ol class="ls-steps">' + body.map(function(b){ return '<li><span>' + b + '</span></li>'; }).join('') + '</ol>');
      nums(S);
      if(LS){ LS.caption(head, 'explore'); if(sp) sp.open(); }
      say(String(head).replace(/<[^>]+>/g, ''));
    }
    function nums(S){
      var u = S.point[0], i = S.point[1];
      var rows = [
        ['Price level', S.eq[1] > 5.05 ? 'Higher than at E1' : S.eq[1] < 4.95 ? 'Lower than at E1' : 'As at E1'],
        ['Real GDP', S.gap === 'none' ? 'At full employment (YF)' : S.gap === 'recessionary' ? 'Below YF' : 'Above YF'],
        ['Unemployment', Math.abs(u - 5) < 0.05 ? 'At the natural rate' : u > 5 ? 'Above the natural rate' : 'Below the natural rate'],
        ['Output gap', S.gap === 'none' ? 'None' : S.gap === 'recessionary' ? 'Recessionary' : 'Inflationary']
      ];
      if(hasPC) rows.push(['Inflation', Math.abs(i - 5) < 0.05 ? 'At the starting rate' : i > 5 ? 'Higher than at A' : 'Lower than at A']);
      var el = host.querySelector('.adl-nums') || $('.adl-nums');
      el.innerHTML = '<h3 class="ls-title-l">Where the economy is</h3><table class="ls-tbl"><tbody>' + rows.map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<p class="bt-small">The model counts directions, not sizes: each shock moves a curve one step, as on an exam graph.</p>';
    }

    /* -------- motion */
    function tween(to, ms, onEnd, onFrame){
      stopAnim();
      var from = { a: st.a, s: st.s };
      if(reduced() || !window.requestAnimationFrame){ st.a = to.a; st.s = to.s; draw(); if(onEnd) onEnd(); return; }
      var t0 = null;
      st.anim = { id: 0 };
      var stepF = function(ts){
        if(!st.anim) return;
        if(t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / ms), e = ease(k);
        st.a = from.a + (to.a - from.a) * e; st.s = from.s + (to.s - from.s) * e;
        if(onFrame) onFrame(k);
        draw();
        if(k < 1) st.anim.id = requestAnimationFrame(stepF);
        else { st.a = to.a; st.s = to.s; st.anim = null; draw(); if(onEnd) onEnd(); }
      };
      st.anim.id = requestAnimationFrame(stepF);
      draw();
    }
    function stopAnim(){ if(st.anim){ try{ cancelAnimationFrame(st.anim.id); }catch(e){} st.anim = null; } }
    function clamp(v){ return Math.max(-3, Math.min(3, v)); }
    function applyShock(id){
      var sh = A.shock(id);
      if(!sh) return;
      cue.done();
      var base = st.stack && st.phase !== 'start' ? { a: st.a, s: st.s } : { a: 0, s: 0 };
      if(!st.stack){ st.a = 0; st.s = 0; }
      // Explore draws a shock as 2 steps, so E1, E2, the gap and the curve labels read
      // clearly apart; drills use one step (only directions are graded).
      var to = { a: clamp(base.a + (sh.curve === 'AD' ? 2 * sh.dir : 0)), s: clamp(base.s + (sh.curve === 'SRAS' ? 2 * sh.dir : 0)) };
      st.shock = id; st.phase = 'short'; st.sr = null;
      tween(to, 700, function(){ st.sr = eqNow().eq.slice(); words(); });
    }
    function runLong(){
      var S = eqNow();
      if(S.gap === 'none') return;
      cue.done();
      st.sr = S.eq.slice(); st.srS = S.gapSize < 0 ? -1 : 1; st.srSras = st.s;
      var rec = S.gapSize < 0;
      if(LS) LS.caption('Unemployment is ' + (rec ? 'above' : 'below') + ' the natural rate, so nominal wages ' + (rec ? 'fall' : 'rise') + ' as contracts renew… SRAS shifts ' + (rec ? 'right' : 'left') + '.', 'explore');
      say('Long run: nominal wages ' + (rec ? 'fall' : 'rise') + ', SRAS shifts ' + (rec ? 'right' : 'left') + '.', true);
      st.phase = 'long';
      tween({ a: st.a, s: S.longRunS }, 1600);
    }
    function reset(){
      stopAnim(); st.a = 0; st.s = 0; st.phase = 'start'; st.shock = null; st.sr = null; select.value = ''; draw();
    }
    select.addEventListener('change', function(){ if(select.value) applyShock(select.value); });
    longBtn.addEventListener('click', runLong);
    resetBtn.addEventListener('click', reset);
    host.querySelector('#adl-stack').addEventListener('change', function(e){ st.stack = e.target.checked; if(sp) sp.setup(st.stack ? 'Stacked' : 'One at a time'); });
    host.querySelector('#adl-lab').addEventListener('change', function(e){ st.labels = e.target.checked; draw(); });

    /* -------- dragging and the keyboard */
    function manual(){ cue.done(); stopAnim(); if(st.phase !== 'custom'){ st.phase = 'custom'; st.shock = null; st.sr = null; select.value = ''; } }
    function toData(ev){
      var svg = adasEl.querySelector('svg'), r = svg.getBoundingClientRect();
      return [((ev.clientX - r.left) * 320 / r.width - 50) / 25, 10 - ((ev.clientY - r.top) * 300 / r.height - 14) / 22.6];
    }
    var drag = null;
    adasEl.addEventListener('pointerdown', function(ev){
      var p = toData(ev), at = { AD: 5 + st.a, SRAS: 5 + st.s };
      // the nearer of AD and SRAS (in data units), if close enough to grab
      var dAD = Math.abs(p[1] - (5 - (p[0] - at.AD))) / Math.SQRT2, dS = Math.abs(p[1] - (5 + (p[0] - at.SRAS))) / Math.SQRT2;
      var c = dAD <= dS ? 'AD' : 'SRAS', d = Math.min(dAD, dS);
      if(d > 0.7) return;
      manual();
      drag = { c: c, x0: p[0], v0: c === 'AD' ? st.a : st.s };
      st.focus = c;
      try{ adasEl.setPointerCapture(ev.pointerId); }catch(e){}
      ev.preventDefault();
      draw();
    });
    adasEl.addEventListener('pointermove', function(ev){
      if(!drag) return;
      var p = toData(ev), v = clamp(Math.round((drag.v0 + p[0] - drag.x0) * 4) / 4);
      if(drag.c === 'AD') st.a = v; else st.s = v;
      draw();
    });
    function endDrag(){ if(!drag) return; drag = null; st.focus = null; draw(); }
    adasEl.addEventListener('pointerup', endDrag); adasEl.addEventListener('pointercancel', endDrag);
    host.querySelectorAll('.adl-h').forEach(function(b){
      var c = b.getAttribute('data-c');
      b.addEventListener('keydown', function(e){
        var d = e.key === 'Home' ? 0 : /Right|Up/.test(e.key) ? 0.5 : /Left|Down/.test(e.key) ? -0.5 : null;
        if(d === null) return;
        e.preventDefault(); manual();
        var cur = c === 'AD' ? st.a : st.s, v = d === 0 ? 0 : clamp(cur + d);
        if(c === 'AD') st.a = v; else st.s = v;
        draw();
      });
      b.addEventListener('click', function(){ b.focus(); });
      b.addEventListener('focus', function(){ st.focus = c; draw(); });
      b.addEventListener('blur', function(){ st.focus = null; draw(); });
    });

    /* -------- one graph at a time when the stage is narrow */
    function setPanel(p){
      st.panel = p;
      fig.setAttribute('data-panel', p);
      fig.querySelectorAll('.adl-tab').forEach(function(t){ var on = t.getAttribute('data-p') === p; t.classList.toggle('on', on); t.setAttribute('aria-pressed', String(on)); });
    }
    fig.addEventListener('click', function(e){ var t = e.target.closest('.adl-tab'); if(t) setPanel(t.getAttribute('data-p')); });
    function fit(){ fig.classList.toggle('is-narrow', fig.clientWidth > 0 && fig.clientWidth < 600); }
    setPanel('adas');
    if(window.ResizeObserver) new ResizeObserver(fit).observe(fig);
    window.addEventListener('resize', fit);

    function studio(pane, s){
      LS = s;
      sp = T.studioPane(pane, s, { stage: [fig], dock: [host.querySelector('.adl-ctl')], setup: 'Shocks', moreLabel: 'Shocks and graph marks', why: [host.querySelector('.adl-say')], details: [host.querySelector('.adl-nums')] });
      sp.setup('One at a time');
      draw(); fit();
      if(s.mode() === 'explore') T.hintSlot(s, select, 'Start here: pick a shock', { before: sel });
    }
    draw(); fit();
    return { studio: studio, stop: stopAnim };
  }

  /* ------------------------------------------------------ test yourself */
  var live = { p: null, gr: null };
  var MARK = function(k){ return '<span class="adl-gstep" data-key="' + k + '" hidden></span>'; };
  function keyResponse(spec){
    var off = G.keyOffsets(spec), r = { shifts: off, eq: G.eq(spec, off), point: null, labels: {} };
    var P = spec.key && spec.key.point;
    if(P && P.on){ var e0 = G.eq(spec, {}), dx = P.x === 'up' ? 1 : P.x === 'down' ? -1 : 0; r.point = [e0[0] + dx, G.y(G.find(G.curves(spec, {}), P.on), e0[0] + dx)]; }
    return r;
  }
  function quiz(host, data){
    T.drill(host, data, { slug: 'adas-lab', noun: 'drill',
      generate: function(r, ctx, type){
        var p = A.generate(r, ctx, type);
        p.steps.forEach(function(s){ if(s.graph) s.label += MARK(s.key); });
        return p;
      },
      types: [{ value: 'shock', label: 'Short-run shocks' }, { value: 'gap', label: 'Gaps in numbers' }, { value: 'selfadjust', label: 'Long-run self-adjustment' }, { value: 'phillips', label: 'The Phillips curve link' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { shock: 'A short-run shock', gap: 'Reading a gap', selfadjust: 'Long-run self-adjustment', phillips: 'The Phillips curve link' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){
        live.p = p; live.gr = null; api.gr = null;
        if(!p.figure) return;
        var f = document.createElement('figure');
        f.className = 'cd-fig adl-qfig';
        el.appendChild(f);
        if(p.figure.static){
          f.innerHTML = G.svg(p.figure.spec, {}, { label: 'AD-AS graph: the economy where AD meets SRAS, ' + (p.figure.spec.start.AD < 0 ? 'left' : 'right') + ' of LRAS.' });
          return;
        }
        var d = document.createElement('div');
        f.appendChild(d);
        api.gr = live.gr = G.mount(d, p.figure.spec, {});
      },
      onStep: function(s, right, api){
        if(!s.graph || !api.gr) return;
        var g = GR.graph(s.graph, api.gr.get());
        // Wrong or shown: the graph takes the key's shape (drawn as the student's,
        // so later steps read the right picture); right: it stays as drawn.
        if(!g.correct) api.gr.set(keyResponse(s.graph));
        api.gr.lock();
      }
    });
  }
  // A graph step's Check: grade the drawing, tick the hidden option, word the slip.
  document.addEventListener('submit', function(e){
    var f = e.target, mk = f && f.querySelector && f.querySelector('.adl-gstep');
    if(!mk || !live.p || !live.gr) return;
    var s = live.p.steps.filter(function(x){ return x.key === mk.getAttribute('data-key'); })[0];
    if(!s) return;
    var g = GR.graph(s.graph, live.gr.get()), fb = f.querySelector('.cd-fb');
    if(!g.valid){
      e.preventDefault(); e.stopImmediatePropagation();
      if(fb) fb.innerHTML = '<span class="bt-small">' + ((s.graph.do || []).indexOf('point') > -1 ? 'Tap the graph to place the point first.' : (s.graph.do || []).indexOf('label') > -1 ? 'Choose the labels under the graph first.' : 'Move a curve on the graph first: drag it, or tab to its handle and use the arrow keys.') + '</span>';
      return;
    }
    var marks = g.points.map(function(pt){ return '<span class="adl-pt ' + (pt.ok ? 'ok' : 'no') + '">' + esc({ shift: 'Shift', equilibrium: 'New equilibrium', outcome: 'Outcome', labels: 'Labels', point: 'Point' }[pt.id] || pt.id) + (pt.ok ? ' ✓' : ' ✗') + '</span>'; }).join(' ');
    s.why[1] = '<b>' + esc(g.slip || 'Not yet.') + '</b> <span class="adl-pts">' + marks + '</span>';
    s.why[0] = s.why[0].replace(/ <span class="adl-pts">[\s\S]*$/, '') + ' <span class="adl-pts">' + marks + '</span>';
    var r = f.querySelector('input[type=radio][value="' + (g.correct ? 0 : 1) + '"]');
    if(r) r.checked = true;
  }, true);
})();
