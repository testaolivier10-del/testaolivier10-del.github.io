/* Foreign exchange lab page (docs/apmacro-spec.md section 6). OWNED BY THIS
   TOOL ONLY (builder T4). The model is ApMacroMath.forexLab
   (tools/math/forex-lab.js); every graph is drawn by ApMacroGraph (kind
   "forex") and every graph step graded by ApMacroGrade.graph.

   Explore: the market for one currency beside its mirror, the market for the
   other, each with its axis the right way round (the price of a currency in
   units of the other per unit of it). Pick what changes: the curve it moves
   shifts in the first market and the other curve shifts the same way in the
   mirror, one currency appreciates while the other depreciates (the rates on
   the axes are 1 / each other), and the strip under the graphs follows the
   change to net exports and, for interest rates and policy, to financial
   capital flows. Curves can be dragged, or moved with the arrow keys from
   their handles. Colors link the views: demand for X and supply of Y (the
   same trades) share one color, supply of X and demand for Y the other.

   Test yourself: ApMacroTools.drill with the model's four kinds; a graph step
   is drill's "graph" kind, mounted on the stage figure (graphHost), recorded
   as "forex-lab:<context>:graph". */
(function(){
  'use strict';
  var T = window.ApMacroTools, M = window.ApMacroMath, F = M && M.forexLab, G = window.ApMacroGraph, GR = window.ApMacroGrade, C = window.ApMacroCalc;
  var app = document.getElementById('app');
  if(!T || !F || !G || !app) return;
  if(F.stub){ app.innerHTML = '<p class="mac-soon">This trainer is being built. Meanwhile, read the <a href="../learn.html">free notes</a>.</p>'; return; }
  var esc = T.esc, pl = F.plural, cap = F.cap;

  // The plot box of ApMacroGraph's 320 x 300 viewBox, from the shared renderer.
  var px = G.px, py = G.py;
  function f1(v){ return Math.round(v * 10) / 10; }
  function reduced(){ return T.reduced ? T.reduced() : false; }
  function ease(t){ return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function fmtRate(v){ return v >= 10 ? M.fixed(v, 1) : v >= 1 ? M.fixed(v, 2) : M.fmt(v, 3); }

  T.mount('forex-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'forex-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  function tag(svg){ return svg.replace(/(<g class="mac-gr-c" data-curve="(\w+)">[\s\S]*?<\/g>)<text class="mac-gr-clabel /g, '$1<text class="mac-gr-clabel fxl-c-$2 '); }
  function inject(svg, extra){ return svg.replace('</svg>', extra + '</svg>'); }

  /* ------------------------------------------------------------ explore */
  function explore(host){
    var pairs = F.PAIRS.filter(function(p){ return ['euro|dollar', 'dollar|euro', 'peso|dollar', 'pound|euro', 'dollar|pound', 'rupee|dollar'].indexOf(p[0] + '|' + p[1]) > -1; });
    var st = { pair: pairs[0], d: 0, s: 0, shock: null, anim: null, panel: 'x', nums: true };
    var LS = null, sp = null;
    host.innerHTML =
      '<figure class="fxl-fig">' +
        '<div class="fxl-tabs" role="group" aria-label="Which market"><button type="button" class="tchip fxl-tab on" data-p="x" aria-pressed="true"></button><button type="button" class="tchip fxl-tab" data-p="y" aria-pressed="false"></button></div>' +
        '<div class="fxl-panels"><div class="fxl-panel fxl-p-x"><p class="fxl-ph"></p><div class="fxl-svg fxl-sx"></div>' +
          '<div class="fxl-handles"><button type="button" class="fxl-h" data-c="D"></button><button type="button" class="fxl-h" data-c="S"></button></div></div>' +
        '<div class="fxl-panel fxl-p-y"><p class="fxl-ph"></p><div class="fxl-svg fxl-sy"></div><p class="fxl-mirror">The mirror market: it follows the first one.</p></div></div>' +
        '<div class="fxl-strip" aria-hidden="true"></div>' +
        '<figcaption class="sr-only fxl-live"></figcaption></figure>' +
      '<div class="fxl-ctl"><div class="fxl-shockrow"></div><div class="fxl-btns"><button type="button" class="bt-btn fxl-reset">Start over</button></div></div>' +
      '<div class="fxl-say"></div><div class="fxl-nums"></div>' +
      T.moreHtml('<div class="bt-ctl bt-select"><label for="fxl-pair">Currencies</label><select id="fxl-pair">' + pairs.map(function(p, i){ return '<option value="' + i + '">The market for ' + pl(p[0]) + ' (and for ' + pl(p[1]) + ')</option>'; }).join('') + '</select></div>' +
        '<div class="bt-radio"><input type="checkbox" id="fxl-num" checked><label for="fxl-num">Show exchange rates as numbers (illustrative)</label></div>' +
        '<p class="bt-small">You can also drag demand or supply in the first market, or tab to its handle and use the arrow keys.</p>', 'currencies, rates as numbers');
    var $ = function(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); };
    var fig = host.querySelector('.fxl-fig'), sx = host.querySelector('.fxl-sx'), sy = host.querySelector('.fxl-sy'), strip = host.querySelector('.fxl-strip');
    var say = T.announcer(host.querySelector('.fxl-live'));
    var sel = document.createElement('div');
    sel.className = 'bt-ctl bt-select fxl-shock';
    // The one control that starts everything: on a phone the studio keeps it on screen (it sat under the fold).
    sel.setAttribute('data-ls-primary', '');
    host.querySelector('.fxl-shockrow').appendChild(sel);
    var cue = T.cue('Pick what changes, then read both markets.');
    host.insertBefore(cue.el, host.firstChild);

    function names(){ var p = st.pair; return { X: p[0], Y: p[1], H: F.CUR[p[0]], Fo: F.CUR[p[1]], base: p[2][Math.min(1, p[2].length - 1)] }; }
    function buildSelect(){
      var n = names(), groups = {};
      F.SHOCKS.forEach(function(s){ (groups[s.group] = groups[s.group] || []).push(s); });
      sel.innerHTML = '<label for="fxl-shock">What changes?</label><select id="fxl-shock"><option value="">Choose a change…</option>' +
        Object.keys(groups).map(function(g){ return '<optgroup label="' + esc(g) + '">' + groups[g].map(function(s){ return '<option value="' + s.id + '">' + esc(label(s, n)) + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select>';
      sel.querySelector('select').addEventListener('change', function(e){ if(e.target.value) apply(e.target.value); });
    }
    // The shock's label with the places named ("Incomes rise in the United States").
    function label(s, n){
      var H = n.H.place, Fo = n.Fo.place;
      var L = { 'tastes-f': cap(n.Fo.people) + ' want more ' + n.H.adj + ' goods', 'tastes-f-down': n.H.adj + ' goods go out of fashion in ' + Fo, 'tastes-h': cap(n.H.people) + ' want more ' + n.Fo.adj + ' goods',
        'income-f': 'Incomes rise in ' + Fo, 'income-f-down': 'A recession in ' + Fo, 'income-h': 'Incomes rise in ' + H, 'prices-h': 'Prices rise faster in ' + H, 'prices-f': 'Prices rise faster in ' + Fo,
        tourism: 'More tourists from ' + Fo + ' visit ' + H, 'rate-h': 'Real interest rate rises in ' + H, 'rate-h-down': 'Real interest rate falls in ' + H, 'rate-f': 'Real interest rate rises in ' + Fo,
        'mp-h-tight': cap(n.H.bank) + ' raises rates', 'mp-h-easy': cap(n.H.bank) + ' cuts rates', 'deficit-h': 'Bigger budget deficit in ' + H, 'mp-f-tight': cap(n.Fo.bank) + ' raises rates' };
      return L[s.id] || s.label;
    }
    function heads(){
      var n = names();
      fig.querySelector('.fxl-tab[data-p=x]').textContent = cap(pl(n.X));
      fig.querySelector('.fxl-tab[data-p=y]').textContent = cap(pl(n.Y));
      var ph = fig.querySelectorAll('.fxl-ph');
      ph[0].innerHTML = 'The market for <b>' + pl(n.X) + '</b>';
      ph[1].innerHTML = 'The market for <b>' + pl(n.Y) + '</b>';
      var h = fig.querySelectorAll('.fxl-h');
      h[0].innerHTML = 'D <span aria-hidden="true">↔</span>'; h[0].setAttribute('aria-label', 'Demand for ' + pl(n.X) + ': use the left and right arrow keys to shift it; Home puts it back');
      h[1].innerHTML = 'S <span aria-hidden="true">↔</span>'; h[1].setAttribute('aria-label', 'Supply of ' + pl(n.X) + ': use the left and right arrow keys to shift it; Home puts it back');
    }
    function eqX(){ return G.eq({ kind: 'forex', names: { currency: 'x', other: 'y' } }, { D: st.d, S: st.s }); }

    /* -------- the two markets */
    function market(which){
      var n = names(), X = which === 'x' ? n.X : n.Y, Y = which === 'x' ? n.Y : n.X;
      // The mirror market: demand for X is supply of Y and supply of X is demand for Y.
      var sh = which === 'x' ? { D: st.d, S: st.s } : { D: st.s, S: st.d }, shifts = {};
      if(Math.abs(sh.D) > 1e-6) shifts.D = sh.D;
      if(Math.abs(sh.S) > 1e-6) shifts.S = sh.S;
      var spec = { kind: 'forex', names: { currency: X, other: Y } }, e = G.eq(spec, shifts), moved = Object.keys(shifts).length > 0;
      var r0 = which === 'x' ? n.base : C.evaluate({ fn: 'inverseRate', args: [n.base] }), r1 = F.rate(r0, e[1]);
      var label = 'The market for ' + pl(X) + ', priced in ' + pl(Y) + ' per ' + X + ': ' + G.describe(spec, { shifts: shifts }) + (moved ? ' The ' + X + (e[1] > 5 ? ' appreciates' : e[1] < 5 ? ' depreciates' : ' keeps its value') + (st.nums ? ', from ' + fmtRate(r0) + ' to ' + fmtRate(r1) + ' ' + pl(Y) + ' per ' + X : '') + '.' : '');
      // The shared renderer draws the shift arrows, E1 and E2 and their axis marks (XR1, Q1 ...).
      var svg = tag(G.svg(spec, { shifts: shifts, eq: moved ? e : null, focus: which === 'x' ? st.focus : null }, { label: label })), x = [];
      svg = svg.replace(/>E([12])<\/text>/g, '>E<tspan class="mac-gr-sub" dy="3">$1</tspan></text>');
      if(st.nums){
        x.push('<text class="fxl-rate is-old" x="' + f1(px(0) + 5) + '" y="' + f1(py(5) + (moved && e[1] > 5 ? 14 : -5)) + '">' + fmtRate(r0) + '</text>');
        if(moved && Math.abs(e[1] - 5) > 0.05) x.push('<text class="fxl-rate" x="' + f1(px(0) + 5) + '" y="' + f1(py(e[1]) + (e[1] > 5 ? -5 : 14)) + '">' + fmtRate(r1) + '</text>');
      }
      return { svg: inject(svg, x.join('')), e: e, r0: r0, r1: r1, X: X, Y: Y };
    }
    function draw(){
      var a = market('x'), b = market('y');
      sx.innerHTML = a.svg; sy.innerHTML = b.svg;
      fig.querySelectorAll('.fxl-h').forEach(function(h){ h.classList.toggle('is-moved', Math.abs(h.getAttribute('data-c') === 'D' ? st.d : st.s) > 1e-6); });
      stripHtml(a, b);
      if(!st.anim) words(a, b);
    }
    function valueWord(e){ return e[1] > 5 + 1e-6 ? 'up' : e[1] < 5 - 1e-6 ? 'down' : 'same'; }
    function stripHtml(a, b){
      var n = names(), v = valueWord(a.e);
      if(v === 'same'){ strip.innerHTML = '<span class="fxl-chip">' + cap(n.X) + ' and ' + n.Y + ' at their starting values</span>'; return; }
      var up = v === 'up';
      strip.innerHTML = '<span class="fxl-chip ' + (up ? 'is-up' : 'is-down') + '"><b>' + cap(n.X) + ' ' + (up ? 'appreciates ↑' : 'depreciates ↓') + '</b>' + (st.nums ? ' ' + fmtRate(a.r0) + ' → ' + fmtRate(a.r1) + '<span class="fxl-unit"> ' + pl(n.Y) + ' per ' + n.X + '</span>' : '') + '</span>' +
        '<span class="fxl-chip ' + (up ? 'is-down' : 'is-up') + '"><b>' + cap(n.Y) + ' ' + (up ? 'depreciates ↓' : 'appreciates ↑') + '</b>' + (st.nums ? ' ' + fmtRate(b.r0) + ' → ' + fmtRate(b.r1) + '<span class="fxl-unit"> ' + pl(n.X) + ' per ' + n.Y + '</span>' : '') + '</span>';
    }
    function words(a, b){
      var n = names(), sh = st.shock && F.shock(st.shock), v = valueWord(a.e), head, body = [], up = v === 'up';
      if(!sh && v === 'same' && !st.d && !st.s){
        head = 'Two markets, one exchange rate. <b>Pick what changes</b> and watch both.';
        body.push('In the market for ' + pl(n.X) + ' the price is in ' + pl(n.Y) + ' per ' + n.X + ' (' + G.labelText('fxPrice', { currency: n.X, other: n.Y }) + '). In the market for ' + pl(n.Y) + ' it is ' + pl(n.X) + ' per ' + n.Y + '.');
        body.push('Demand for ' + pl(n.X) + ' comes from ' + n.Fo.people + ' (and anyone else) buying ' + n.H.adj + ' goods, services and assets. Supply of ' + pl(n.X) + ' comes from ' + n.H.people + ' buying foreign ones.');
        body.push('Buying ' + pl(n.X) + ' with ' + pl(n.Y) + ' is selling ' + pl(n.Y) + ': the demand for ' + pl(n.X) + ' is the supply of ' + pl(n.Y) + ', drawn in the same color.');
      } else {
        var lead = sh ? '<b>' + esc(label(sh, n)) + ':</b> ' + (sh.curve === 'D' ? 'demand for ' : 'supply of ') + pl(n.X) + ' shifts ' + (sh.dir > 0 ? 'right' : 'left') + '. ' : '';
        head = lead + (v === 'same' ? 'The value of the ' + n.X + ' is unchanged.' : 'The ' + n.X + ' ' + (up ? 'appreciates' : 'depreciates') + ' and the ' + n.Y + ' ' + (up ? 'depreciates' : 'appreciates') + '.');
        if(sh) body.push(esc(sh.t(n.H, n.Fo, n.X, n.Y)) + ' ' + esc(sh.l(n.H, n.Fo, n.X, n.Y)));
        if(sh) body.push('In the mirror market, ' + (sh.curve === 'D' ? 'the supply of ' : 'the demand for ') + pl(n.Y) + ' shifts ' + (sh.dir > 0 ? 'right' : 'left') + ': ' + (sh.curve === 'D' ? 'to get ' + pl(n.X) + ', buyers sell ' + pl(n.Y) + '.' : 'selling ' + pl(n.X) + ' is buying ' + pl(n.Y) + '.'));
        if(v !== 'same'){
          body.push('The price of the ' + n.X + ' ' + (up ? 'rises' : 'falls') + (st.nums ? ' (from ' + fmtRate(a.r0) + ' to ' + fmtRate(a.r1) + ' ' + pl(n.Y) + ' per ' + n.X + ')' : '') + ', so the price of the ' + n.Y + ', its inverse, ' + (up ? 'falls' : 'rises') + (st.nums ? ' (from ' + fmtRate(b.r0) + ' to ' + fmtRate(b.r1) + ')' : '') + '.');
          body.push('Through the exchange rate, other things equal: ' + n.H.adj + ' goods get ' + (up ? 'pricier' : 'cheaper') + ' for buyers abroad and imports get ' + (up ? 'cheaper' : 'pricier') + ', so net exports of ' + n.H.place + ' tend to ' + (up ? 'fall (AD shifts left)' : 'rise (AD shifts right)') + ', and those of ' + n.Fo.place + ' to ' + (up ? 'rise' : 'fall') + '.');
        }
        if(sh && sh.set === 'policy') body.push((sh.curve === 'D' ? (sh.dir > 0 ? 'More financial capital flows into ' + n.H.place : 'Less financial capital flows into ' + n.H.place) : 'Financial capital flows out of ' + n.H.place + ' toward ' + n.Fo.place) + ': investors follow the higher real interest rate, and buying assets abroad takes that country\u2019s currency.');
      }
      T.explain($('.fxl-say'), head, '<ol class="ls-steps">' + body.map(function(x){ return '<li><span>' + x + '</span></li>'; }).join('') + '</ol>');
      nums(a, b);
      if(LS){ LS.caption(head, 'explore'); if(sp) sp.open(); }
      say(String(head).replace(/<[^>]+>/g, ''));
    }
    function nums(a, b){
      var n = names(), el = $('.fxl-nums');
      el.innerHTML = '<h3 class="ls-title-l">The two prices</h3><table class="ls-tbl"><thead><tr><th scope="col">Price</th><th scope="col" class="r">Start</th><th scope="col" class="r">Now</th></tr></thead><tbody>' +
        '<tr><th scope="row">' + cap(n.X) + ' (' + pl(n.Y) + ' per ' + n.X + ')</th><td class="r">' + fmtRate(a.r0) + '</td><td class="r">' + fmtRate(a.r1) + '</td></tr>' +
        '<tr><th scope="row">' + cap(n.Y) + ' (' + pl(n.X) + ' per ' + n.Y + ')</th><td class="r">' + fmtRate(b.r0) + '</td><td class="r">' + fmtRate(b.r1) + '</td></tr></tbody></table>' +
        '<p class="bt-small">Each price is 1 divided by the other. The rates are illustrative; the graph counts directions, not sizes.</p>';
    }

    /* -------- motion */
    function stopAnim(){ if(st.anim){ try{ cancelAnimationFrame(st.anim.id); }catch(e){} st.anim = null; } }
    function tween(to, ms){
      stopAnim();
      var from = { d: st.d, s: st.s };
      if(reduced() || !window.requestAnimationFrame){ st.d = to.d; st.s = to.s; draw(); return; }
      var t0 = null;
      st.anim = { id: 0 };
      var f = function(ts){
        if(!st.anim) return;
        if(t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / ms), e = ease(k);
        st.d = from.d + (to.d - from.d) * e; st.s = from.s + (to.s - from.s) * e;
        if(k < 1){ draw(); st.anim.id = requestAnimationFrame(f); } else { st.d = to.d; st.s = to.s; st.anim = null; draw(); }
      };
      st.anim.id = requestAnimationFrame(f);
    }
    function clamp(v){ return Math.max(-3, Math.min(3, v)); }
    function apply(id){
      var sh = F.shock(id); if(!sh) return;
      cue.done(); st.shock = id; st.d = 0; st.s = 0;
      // two steps, so E1, E2 and the curve labels read clearly apart
      tween({ d: sh.curve === 'D' ? 2 * sh.dir : 0, s: sh.curve === 'S' ? 2 * sh.dir : 0 }, 700);
    }
    function reset(){ stopAnim(); st.d = 0; st.s = 0; st.shock = null; var s = $('#fxl-shock'); if(s) s.value = ''; draw(); }
    host.querySelector('.fxl-reset').addEventListener('click', reset);
    host.querySelector('#fxl-pair').addEventListener('change', function(e){
      st.pair = pairs[+e.target.value]; var keep = st.shock; heads(); buildSelect(); if(keep) $('#fxl-shock').value = keep; draw();
      if(sp) sp.setup(cap(pl(st.pair[0])) + ' and ' + pl(st.pair[1]));
    });
    host.querySelector('#fxl-num').addEventListener('change', function(e){ st.nums = e.target.checked; draw(); });

    /* -------- drag and keys, in the first market */
    function manual(){ cue.done(); stopAnim(); if(st.shock){ st.shock = null; var s = $('#fxl-shock'); if(s) s.value = ''; } }
    function toData(ev){ var r = sx.querySelector('svg').getBoundingClientRect(); return [((ev.clientX - r.left) * 320 / r.width - 50) / 25, 10 - ((ev.clientY - r.top) * 300 / r.height - 14) / 22.6]; }
    var drag = null;
    sx.addEventListener('pointerdown', function(ev){
      var p = toData(ev), dD = Math.abs(p[1] - (5 - (p[0] - 5 - st.d))) / Math.SQRT2, dS = Math.abs(p[1] - (5 + (p[0] - 5 - st.s))) / Math.SQRT2;
      var c = dD <= dS ? 'D' : 'S';
      if(Math.min(dD, dS) > 0.7) return;
      manual(); drag = { c: c, x0: p[0], v0: c === 'D' ? st.d : st.s }; st.focus = c;
      try{ sx.setPointerCapture(ev.pointerId); }catch(e){}
      ev.preventDefault(); draw();
    });
    sx.addEventListener('pointermove', function(ev){
      if(!drag) return;
      var p = toData(ev), v = clamp(Math.round((drag.v0 + p[0] - drag.x0) * 4) / 4);
      if(drag.c === 'D') st.d = v; else st.s = v;
      draw();
    });
    function endDrag(){ if(!drag) return; drag = null; st.focus = null; draw(); }
    sx.addEventListener('pointerup', endDrag); sx.addEventListener('pointercancel', endDrag);
    fig.querySelectorAll('.fxl-h').forEach(function(b){
      var c = b.getAttribute('data-c');
      b.addEventListener('keydown', function(e){
        var d = e.key === 'Home' ? 0 : /Right|Up/.test(e.key) ? 0.5 : /Left|Down/.test(e.key) ? -0.5 : null;
        if(d === null) return;
        e.preventDefault(); manual();
        var cur = c === 'D' ? st.d : st.s, v = d === 0 ? 0 : clamp(cur + d);
        if(c === 'D') st.d = v; else st.s = v;
        draw();
      });
      b.addEventListener('click', function(){ b.focus(); });
      b.addEventListener('focus', function(){ st.focus = c; draw(); });
      b.addEventListener('blur', function(){ st.focus = null; draw(); });
    });

    /* -------- narrow stage: one market at a time */
    function setPanel(p){
      st.panel = p; fig.setAttribute('data-panel', p);
      fig.querySelectorAll('.fxl-tab').forEach(function(t){ var on = t.getAttribute('data-p') === p; t.classList.toggle('on', on); t.setAttribute('aria-pressed', String(on)); });
    }
    fig.addEventListener('click', function(e){ var t = e.target.closest('.fxl-tab'); if(t) setPanel(t.getAttribute('data-p')); });
    function fit(){ fig.classList.toggle('is-narrow', fig.clientWidth > 0 && fig.clientWidth < 600); }
    setPanel('x'); heads(); buildSelect();
    if(window.ResizeObserver) new ResizeObserver(fit).observe(fig);
    window.addEventListener('resize', fit);

    function studio(pane, s){
      LS = s;
      sp = T.studioPane(pane, s, { stage: [fig], dock: [host.querySelector('.fxl-ctl')], setup: 'Currencies', moreLabel: 'Currencies and rates', why: [host.querySelector('.fxl-say')], details: [host.querySelector('.fxl-nums')] });
      sp.setup(cap(pl(st.pair[0])) + ' and ' + pl(st.pair[1]));
      draw(); fit();
      if(s.mode() === 'explore') T.hintSlot(s, sel.querySelector('select'), 'Start here: pick what changes', { before: sel });
    }
    draw(); fit();
    return { studio: studio, stop: stopAnim };
  }

  /* ------------------------------------------------------ test yourself */
  /* Graph steps are ApMacroTools.drill's "graph" kind, mounted on the stage
     figure (graphHost hands drill the mount). */
  function quiz(host, data){
    T.drill(host, data, { slug: 'forex-lab', noun: 'drill',
      generate: function(r, ctx, type){ return F.generate(r, ctx, type); },
      types: [{ value: 'axis', label: 'Read the exchange rate' }, { value: 'shift', label: 'Shift the right curve' }, { value: 'nx', label: 'Net exports' }, { value: 'flows', label: 'Interest rates and capital flows' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { axis: 'Reading the exchange rate', shift: 'Which curve shifts?', nx: 'Exchange rates and net exports', flows: 'Real interest rates and capital flows' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){
        api.gr = null;
        if(!p.figure) return;
        var f = document.createElement('figure');
        f.className = 'cd-fig fxl-qfig';
        var d = document.createElement('div');
        f.appendChild(d); el.appendChild(f);
        api.gr = G.mount(d, p.figure.spec, {});
      },
      graphHost: function(s, api){ return api.gr; },
      onStep: function(s, right, api){
        if(s.kind !== 'graph' || !api.gr) return;
        if(!GR.graph(s.spec, api.gr.get()).correct) api.gr.set(G.keyResponse(s.spec));
      }
    });
  }
})();
