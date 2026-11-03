/* Graph Studio page (docs/apmacro-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T1). Mounts into #app with ApMacroTools.mount; the model is
   ApMacroMath.graphStudio (macroeconomics/assets/tools/math/graph-studio.js), the
   content macroeconomics/data/tools/graph-studio.json (served filtered as
   assets/tool-data/graph-studio.json: a graph or scenario shows once its topic
   is published). The frame is ApMacroTools.modes on the Tool Studio.

   Every graph on this page is drawn by ApMacroGraph.mount / .svg and every
   graph step is graded by ApMacroGrade.graph (no second renderer or grader).

   Explore: pick a graph (chips), pick what happens (a menu of scenarios, or
   free draw), drag the curve you think moves (or its button and the arrow
   keys). E2 follows where the curves cross, the result shows as pills on the
   stage and a caption, and a picked scenario says at once whether you moved
   the right curve the right way. "Show me" animates the shift. AD-AS is
   drawn beside the Phillips curves and the currency market beside its mirror
   market (on a phone: a switch on the stage). Why: the cause, the curve,
   the direction, the result, the chain. Details: the axes, what shifts each
   curve, shift versus movement.

   Test yourself: a step drill like ApMacroTools.drill (seeded, first try
   recorded as graph-studio:<context>:<step>, worked solution in Why, Keep
   going), with graph steps: the graph is remounted for each rubric point
   (labels, shift, E2, point) so only that point's controls are live, and the
   rubric strip on the stage ticks each point the way a reader scores it. The
   PPC, supply-and-demand and shift-or-movement drills are free; the other
   graphs ask ApMacroCore.locked and show the Premium gate. Problem codes
   carry the graph and kind, so a shared link opens the same problem. */
(function(){
  'use strict';
  var T = window.ApMacroTools, M = window.ApMacroMath, G = window.ApMacroGraph, GR = window.ApMacroGrade;
  if(!T || !M || !M.graphStudio || M.graphStudio.stub || !G || !GR) return;
  var GS = M.graphStudio, esc = T.esc;
  var SLUG = 'graph-studio';
  var TASK = { labels: 'Labels', shift: 'Shift', equilibrium: 'E2', outcome: 'Result', point: 'Point', move: 'Shift or move' };
  var WORD = { quantity: 'Quantity', price: 'Price', output: 'Real GDP', 'price level': 'Price level', 'quantity of money': 'Money',
    'nominal interest rate': 'Interest rate', 'quantity of reserves': 'Reserves', 'policy rate': 'Policy rate', 'quantity of loanable funds': 'Loanable funds',
    'real interest rate': 'Real rate', 'unemployment rate': 'Unemployment', 'inflation rate': 'Inflation', 'quantity of the currency': 'Quantity', 'value of the currency': 'Value' };
  var ARROW = { up: '↑', down: '↓', same: '=' }, SAY = { up: 'up', down: 'down', same: 'unchanged' };
  var KIND_LABEL = [{ value: 'draw', label: 'Draw it from scratch (labels first)' }, { value: 'shift', label: 'Shift it and read the result' }, { value: 'move', label: 'Shift or movement along?' }];

  function reduced(){ return T.reduced ? T.reduced() : false; }
  function core(){ return window.ApMacroCore; }
  function locked(topic){ var c = core(); try{ return !!(c && c.locked && c.locked(c.unitOf ? c.unitOf(topic) : '', topic)); }catch(e){ return false; } }
  function capFirst(s){ s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function curveShort(id){ var c = G.CURVE[id] || [id, '']; return c[0] + c[1]; }

  /* Take a mounted graph's controls (handles, label menus) out of its host into
     a dock slot, so the stage holds only the picture. The help line stays for
     screen readers (the handles point at it). */
  function liftControls(host, slot){
    if(!slot) return;
    slot.innerHTML = '';
    var labels = host.querySelector('.mac-gr-labels'), ctl = host.querySelector('.mac-gr-controls'), help = host.querySelector('.mac-gr-help');
    if(help){ help.classList.add('sr-only'); slot.appendChild(help); }
    if(labels) slot.appendChild(labels);
    if(ctl && ctl.children.length) slot.appendChild(ctl);
  }
  function outcomePills(graph, o){
    var k = G.KINDS[graph];
    if(!k.out || !o) return [];
    return [k.out.y, k.out.x].map(function(w){ return { html: esc(WORD[w] || w) + ' <span aria-hidden="true">' + ARROW[o[w]] + '</span><span class="sr-only"> ' + SAY[o[w]] + '</span>', tone: o[w] === 'same' ? 'ghost' : 'readout' }; });
  }
  /* ApMacroGrade.graph words a wrong axis as "The vertical axis of the
     supply and demand is ..." (the kind's title); say it with the graph's
     usual name. Proposed for mac-grade.js in the T1 report. */
  var GNAME = { ppc: 'PPC', sd: 'supply and demand graph', adas: 'AD-AS graph', money: 'money market graph', reserves: 'reserve market graph', lf: 'loanable funds graph', phillips: 'Phillips curve graph', forex: 'foreign exchange graph' };
  function axisNote(n){
    return String(n || '').replace(/^The (horizontal|vertical) axis of the (.+?) is /, function(m, a, t){
      var id = Object.keys(G.KINDS).filter(function(k){ return G.KINDS[k].title.toLowerCase() === t; })[0];
      return 'The ' + a + ' axis of the ' + (GNAME[id] || t) + ' is ';
    });
  }
  function moved(sh){ return Object.keys(sh || {}).some(function(c){ return Math.abs(sh[c]) > 1e-9; }); }

  T.mount(SLUG, function(app, data){
    var ex = null, qz = null, want = { graph: null };
    var md = T.modes(app, { slug: SLUG,
      explore: function(host){ ex = explore(host, data, function(g){ want.graph = g; if(qz) qz.pick(g); md.show('quiz', true); }); },
      quiz: function(host){ qz = quiz(host, data, want); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ============================================================ explore */
  function explore(host, data, practise){
    var graphs = (data.graphs || []).filter(function(g){ return GS.GRAPHS.indexOf(g.id) > -1; });
    var nid = T.nid('gsx'), LS = null, touched = false, anim = null, wide = true, view = 'main';
    var g = graphs[0], sc = null, spec = null, mnt = null, shown = false, last = { shifts: {}, point: null };
    host.innerHTML = '<section class="bt-problem gs-x" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Graph Studio</h2>' +
      '<div class="gs-fig"><div class="gs-sw ls-seg" role="group" aria-label="Which graph to show" hidden></div>' +
        '<div class="gs-views"><figure class="gs-pane gs-main"><div class="gs-host"></div></figure>' +
        '<figure class="gs-pane gs-link" hidden><figcaption class="gs-link-h"></figcaption><div class="gs-link-svg"></div></figure></div></div>' +
      '<div class="gs-ctl">' +
        '<div class="gs-graphs ls-scroll" role="group" aria-label="Graph">' + graphs.map(function(x){ return '<button type="button" class="tchip gs-chip" data-g="' + x.id + '" aria-pressed="false">' + esc(GS.SHORT[x.id]) + '</button>'; }).join('') + '</div>' +
        '<div class="gs-row"><label class="gs-scen-l" for="' + nid + '-s">What happens</label><select class="bt-select gs-scen" id="' + nid + '-s"></select>' +
          '<button type="button" class="btn-press sm ls-btn ls-pri gs-show">Show me</button></div>' +
        '<div class="gs-hand"></div><p class="gs-cap" aria-live="polite"></p>' +
      '</div>' +
      '<div class="gs-say"></div>' +
      T.moreHtml('<div class="gs-opts"><button type="button" class="bt-btn gs-practise">Test yourself on this graph</button></div><p class="bt-small">Explore draws every graph free. The drills for graphs after Unit 2 are part of Premium.</p>', 'practice this graph') +
      '<div class="gs-nums"></div></section>';
    var R = {
      fig: host.querySelector('.gs-fig'), sw: host.querySelector('.gs-sw'), main: host.querySelector('.gs-main'), mainHost: host.querySelector('.gs-host'),
      link: host.querySelector('.gs-link'), linkH: host.querySelector('.gs-link-h'), linkSvg: host.querySelector('.gs-link-svg'),
      ctl: host.querySelector('.gs-ctl'), chips: host.querySelector('.gs-graphs'), scen: host.querySelector('.gs-scen'), show: host.querySelector('.gs-show'),
      hand: host.querySelector('.gs-hand'), cap: host.querySelector('.gs-cap'), say: host.querySelector('.gs-say'), nums: host.querySelector('.gs-nums'),
      prac: host.querySelector('.gs-practise')
    };
    var cue = T.cue('Pick what happens, then drag the curve you think it shifts.');
    R.ctl.insertBefore(cue.el, R.ctl.firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }

    function scenarios(){ return (data.scenarios || []).filter(function(x){ return x.graph === g.id; }); }
    function words(){ return GS.namesFor(g.id, null, data); }
    function scSpec(x){ return GS.specOf(x, words(), x.point ? ['point'] : G.KINDS[x.graph].eq && !x.noEq ? ['shift', 'equilibrium'] : ['shift']); }
    function scText(x){ return GS.fill(x.cause, words().words); }
    function pickGraph(id, keepScen){
      stopAnim();
      g = graphs.filter(function(x){ return x.id === id; })[0] || graphs[0];
      R.chips.querySelectorAll('.gs-chip').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-g') === g.id)); });
      var list = scenarios();
      R.scen.innerHTML = '<option value="">Free draw: shift any curve</option>' +
        '<optgroup label="Shifts">' + list.filter(function(x){ return !x.along && !x.point; }).map(function(x){ return '<option value="' + x.id + '">' + esc(x.title) + '</option>'; }).join('') + '</optgroup>' +
        (list.some(function(x){ return x.point; }) ? '<optgroup label="Place a point">' + list.filter(function(x){ return x.point; }).map(function(x){ return '<option value="' + x.id + '">' + esc(x.title) + '</option>'; }).join('') + '</optgroup>' : '') +
        (list.some(function(x){ return x.along; }) ? '<optgroup label="Movements along a curve">' + list.filter(function(x){ return x.along; }).map(function(x){ return '<option value="' + x.id + '">' + esc(x.title) + '</option>'; }).join('') + '</optgroup>' : '');
      if(!keepScen) sc = null;
      R.scen.value = sc ? sc.id : '';
      var w = words();
      spec = { kind: g.id, do: g.id === 'ppc' || g.id === 'phillips' ? ['shift', 'point'] : ['shift'], pointLabel: g.id === 'phillips' ? 'B' : 'X' };
      if(w.names) spec.names = w.names;
      mnt = G.mount(R.mainHost, spec, { onChange: onChange });
      liftControls(R.mainHost, R.hand);
      var lk = GS.linked(g.id, {}, spec.names);
      view = 'main';
      R.sw.innerHTML = lk ? '<button type="button" data-v="main" aria-pressed="true">' + esc(GS.SHORT[g.id]) + '</button><button type="button" data-v="link" aria-pressed="false">' + esc(g.id === 'adas' ? 'Phillips curves' : 'Mirror market') + '</button>' : '';
      shown = false; last = { shifts: {}, point: null };
      details(); layout(); update();
    }
    function pickScen(id){
      stopAnim();
      sc = scenarios().filter(function(x){ return x.id === id; })[0] || null;
      shown = false;
      mnt.reset(); last = { shifts: {}, point: null };
      update();
    }
    /* Every change: E2 follows the crossing; the caption, pills, linked
       view and Why follow the graph. */
    function onChange(r){
      if(anim) return;
      act();
      shown = false;
      var e = G.KINDS[g.id].eq && moved(r.shifts) ? G.eq(spec, r.shifts) : null;
      mnt.set({ shifts: r.shifts, eq: e, point: r.point, labels: {} });
      last = { shifts: r.shifts, point: r.point };
      update();
    }
    function verdict(){
      if(!sc) return null;
      var sp = scSpec(sc), resp = { shifts: last.shifts, eq: null, point: last.point, labels: {} };
      if(sc.along){
        if(moved(last.shifts)) return { ok: false, note: 'Nothing shifts here: only ' + (g.id === 'sd' ? 'the price' : 'the price level') + ' changed, and it is on an axis, so the economy moves along ' + G.curveName(sc.along) + '.' };
        return null;
      }
      if(sc.point){
        if(!last.point) return null;
        var pt = GR.graph(sp, resp).points.filter(function(p){ return p.id === 'point'; })[0];
        return { ok: pt.ok, note: pt.ok ? 'Right: point ' + (sp.pointLabel || 'X') + ' is ' + GS.fill(sc.pointWhy, words().words) : pt.note };
      }
      if(!moved(last.shifts)) return null;
      var specs = [sp].concat((sc.alt || []).map(function(a){ return GS.specOf(sc, words(), sp.do, a); }));
      var best = null;
      specs.forEach(function(s2){ var p2 = GR.graph(s2, resp).points.filter(function(p){ return p.id === 'shift'; })[0]; if(!best || (p2.ok && !best.ok)) best = p2; });
      return { ok: best.ok, note: best.ok ? 'Right curve, right way.' : best.note };
    }
    function update(){
      var k = G.KINDS[g.id], sh = last.shifts, o = k.out && moved(sh) ? G.outcome(spec, sh) : null, v = verdict(), cap = '', pills = [];
      if(sc){
        if(shown) cap = '<b>' + esc(sc.title) + '.</b> ' + esc(summary());
        else if(v) cap = (v.ok ? '<b>Yes.</b> ' : '<b>Not yet.</b> ') + esc(v.note) + (v.ok && o ? ' ' + esc(GS.outcomeText(g.id, o, spec.names)) : '') + (v.ok ? '' : ' Try again, or press Show me.');
        else cap = esc(scText(sc)) + ' ' + (sc.point ? 'Tap the graph where the economy is.' : sc.along ? 'Is this a shift? Press Show me to see.' : 'Which curve moves, and which way?');
        if(shown) pills.push({ html: 'Shown', tone: 'ghost' });
        else if(v) pills.push({ html: v.ok ? 'Right' : 'Not yet', tone: v.ok ? 'good' : 'warn' });
      } else {
        cap = moved(sh) ? esc(capFirst(G.describe(spec, { shifts: sh }))) : esc(g.shows) + ' Drag a curve to shift it.';
      }
      if(g.id === 'ppc' && last.point){ var rg = G.region(spec, sh, last.point); pills.push({ html: 'X ' + rg + ' the curve', tone: 'readout' }); }
      pills = pills.concat(outcomePills(g.id, o));
      if(LS){ LS.caption(cap, 'explore'); LS.pills(pills, 'left', 'explore'); }
      R.cap.innerHTML = cap;
      linkedView();
      whyBox(o, v);
    }
    function summary(){
      if(sc.along) return 'Only ' + (g.id === 'sd' ? 'the price' : 'the price level') + ' changed: a movement along ' + G.curveName(sc.along) + ' to point X, not a shift.';
      if(sc.point) return 'Point ' + (sc.pointLabel || 'X') + ' is ' + GS.fill(sc.pointWhy, words().words);
      var sp = scSpec(sc);
      return capFirst(GS.fill(sc.because, words().words)) + ' shifts ' + sp.key.shifts.map(function(s){ return G.curveName(s.curve) + ' ' + s.dir; }).join(' and ') + '.' + (sp.key.outcome ? ' ' + GS.outcomeText(g.id, sp.key.outcome, spec.names) : '');
    }
    function whyBox(o, v){
      var head, body = '';
      if(!sc){
        head = esc(g.title) + ': ' + esc(g.shows);
        body = '<p>' + esc(g.movement) + '</p><p>Pick a scenario under What happens to see one change worked through, link by link.</p>';
      } else {
        var w = words().words, sp = scSpec(sc), steps = ['<li><b>What happens.</b> ' + esc(scText(sc)) + '</li>'];
        if(sc.along) steps.push('<li><span><b>Shift or movement?</b> Only a variable on an axis changed, so this is a movement along ' + esc(G.curveName(sc.along)) + '.</span></li>');
        else if(sc.point) steps.push('<li><span><b>Where.</b> Point ' + esc(sc.pointLabel || 'X') + ' is ' + esc(GS.fill(sc.pointWhy, w)) + '</span></li>');
        else {
          steps.push('<li><span><b>Which curve, which way.</b> ' + esc(capFirst(GS.fill(sc.because, w))) + ' shifts ' + esc(sp.key.shifts.map(function(s){ return G.curveName(s.curve) + ' ' + s.dir; }).join(' and ')) + '.</span></li>');
          if(sp.key.outcome) steps.push('<li><span><b>The new equilibrium.</b> E2 is where the curves cross now: ' + esc(GS.outcomeText(g.id, sp.key.outcome, spec.names).toLowerCase()) + '</span></li>');
        }
        head = '<b>' + esc(sc.title) + '.</b> ' + (v ? esc(v.ok ? 'You have it.' : v.note) : 'Try it on the graph first, then read why.');
        body = '<ol class="ls-steps">' + steps.join('') + '</ol>' + (sc.why || []).map(function(x){ return '<p>' + esc(GS.fill(x, w)) + '</p>'; }).join('');
      }
      T.explain(R.say, head, body);
      if(LS && LS.setupRow) LS.setupRow.open();
    }
    function details(){
      var rows = g.shifters.map(function(s){ return '<tr><th scope="row">' + esc(curveShort(s.curve)) + '<span class="gs-cname">' + esc(G.curveName(s.curve)) + '</span></th><td><ul>' + s.list.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></td></tr>'; }).join('');
      var k = G.KINDS[g.id];
      R.nums.innerHTML = '<h3 class="ls-title-l">' + esc(g.title) + '</h3><p>' + esc(g.shows) + '</p>' +
        '<h4 class="gs-h4">Axes</h4><p>Vertical: <b>' + esc(G.labelText(k.y, spec.names)) + '</b>. Horizontal: <b>' + esc(G.labelText(k.x, spec.names)) + '</b>. ' + esc(g.axes) + '</p>' +
        '<h4 class="gs-h4">What shifts each curve</h4><div class="table-wrap" tabindex="0" role="region" aria-label="What shifts each curve"><table class="ls-tbl gs-tbl"><tbody>' + rows + '</tbody></table></div>' +
        '<h4 class="gs-h4">Shift or movement</h4><p>' + esc(g.movement) + '</p>' + (g.link ? '<p>' + esc(g.link) + '</p>' : '');
    }
    function linkedView(){
      var lk = GS.linked(g.id, last.shifts, spec.names);
      if(!lk) return;
      var title = g.id === 'adas' ? 'Phillips curves' : 'The market for ' + G.labelText('fxQuantity', lk.spec.names).replace(/^Quantity of /, '');
      var line = '';
      if(g.id === 'adas'){
        var bits = [];
        if(lk.state.point){ var p = lk.state.point; bits.push('Point B: unemployment ' + (p[0] < 5 ? 'lower' : p[0] > 5 ? 'higher' : 'unchanged') + ', inflation ' + (p[1] > 5 ? 'higher' : p[1] < 5 ? 'lower' : 'unchanged')); }
        if(lk.state.shifts.SRPC) bits.push('SRPC shifted ' + (lk.state.shifts.SRPC > 0 ? 'right' : 'left'));
        if(lk.state.shifts.LRPC) bits.push('LRPC shifted ' + (lk.state.shifts.LRPC > 0 ? 'right' : 'left'));
        line = bits.join('; ');
      } else {
        var o2 = moved(lk.state.shifts) ? G.outcome(lk.spec, lk.state.shifts) : null;
        if(o2) line = 'The ' + lk.spec.names.currency + (o2['value of the currency'] === 'up' ? ' appreciates' : o2['value of the currency'] === 'down' ? ' depreciates' : ' keeps its value');
      }
      R.linkH.innerHTML = '<b>' + esc(title) + '</b>' + (line ? ' <span>' + esc(line) + '</span>' : '');
      R.linkSvg.innerHTML = G.svg(lk.spec, lk.state, { label: title + ' graph, linked to the main graph: ' + G.describe(lk.spec, lk.state) + (line ? ' ' + line + '.' : '') });
      layout();
    }
    function layout(){
      var has = !!GS.linked(g.id, {}, spec && spec.names);
      wide = !R.fig.clientWidth || R.fig.clientWidth >= 620;
      R.fig.classList.toggle('is-wide', has && wide);
      R.sw.hidden = !has || wide;
      R.main.hidden = has && !wide && view !== 'main';
      R.link.hidden = !has || (!wide && view !== 'link');
      R.sw.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === view)); });
    }
    /* Show me: the key's shifts drawn in about 0.7 s (at once with reduced motion). */
    function stopAnim(){ if(anim){ cancelAnimationFrame(anim); anim = null; } }
    function showMe(){
      if(!sc){ if(LS) LS.caption('Pick a scenario under What happens first; Show me then draws it.', 'explore'); R.scen.focus(); return; }
      act(); stopAnim();
      var sp = scSpec(sc);
      if(sc.point || sc.along){
        var p = sc.point ? GS.keyPoint(sp) : alongPoint(sc.along);
        mnt.reset(); mnt.set({ shifts: {}, eq: null, point: p, labels: {} });
        last = { shifts: {}, point: sc.point ? p : null }; shown = true; update(); return;
      }
      var to = G.keyOffsets(sp), from = {}, t0 = null;
      mnt.reset();
      var frame = function(ts){
        if(t0 === null) t0 = ts;
        var f = reduced() ? 1 : Math.min(1, (ts - t0) / 700), e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2, sh = {};
        Object.keys(to).forEach(function(c){ sh[c] = (from[c] || 0) + (to[c] - (from[c] || 0)) * e; });
        mnt.set({ shifts: sh, eq: G.KINDS[g.id].eq && moved(sh) ? G.eq(spec, sh) : null, point: null, labels: {} });
        last = { shifts: sh, point: null };
        linkedView();
        if(f < 1) anim = requestAnimationFrame(frame);
        else { anim = null; last = { shifts: to, point: null }; mnt.set({ shifts: to, eq: G.KINDS[g.id].eq ? G.eq(spec, to) : null, point: null, labels: {} }); shown = true; update(); }
      };
      if(reduced()) frame(0); else anim = requestAnimationFrame(frame);
    }
    // A point moved along a curve by a higher price (or price level).
    function alongPoint(id){
      var c = G.find(G.curves(spec, {}), id), e0 = G.eq(spec, {}) || [5, 5], x = e0[0] + (c.shape === 'down' ? -1 : 1);
      return [x, G.y(c, x)];
    }

    function onClick(e){
      var b = e.target.closest('button');
      if(!b) return;
      if(b.classList.contains('gs-chip')){ act(); pickGraph(b.getAttribute('data-g')); }
      else if(b.classList.contains('gs-show')) showMe();
      else if(b.classList.contains('gs-practise')) practise(g.id);
      else if(b.parentNode === R.sw){ view = b.getAttribute('data-v'); layout(); }
    }
    host.addEventListener('click', onClick);
    R.scen.addEventListener('change', function(){ act(); pickScen(R.scen.value); });
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [R.fig], dock: [R.ctl], setup: 'Options', moreLabel: 'More options', why: [R.say], details: [R.nums] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      sp.setup('Practice this graph');
      update();
      if(s.mode() === 'explore') T.hintSlot(s, R.scen, 'Start here: pick what happens', { before: R.scen.parentNode });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(layout, 40); }).observe(R.fig); }
    }
    var g0 = graphs.filter(function(x){ return x.id === 'sd'; })[0] || graphs[0];
    g = g0; sc = scenarios().filter(function(x){ return !x.along && !x.point; })[0] || null;
    pickGraph(g0.id, true);
    return { studio: studio, stop: stopAnim };
  }

  /* ======================================================= test yourself */
  function seedFromUrl(){ try{ var m = /[?&#]seed=(\d+)/.exec(location.search + location.hash); if(m) return +m[1]; }catch(e){} return 0; }
  function fresh(){ return 10000 + Math.floor(Math.random() * 89999); }
  function quiz(host, data, want){
    var contexts = (data.contexts || []).filter(function(c){ return GS.typesOf(c, data).length; });
    var gid = T.nid('gsq'), code = seedFromUrl(), ctxSel = '', kind = '';
    var fr = T.frame(host, data, { noun: 'drill', hid: gid + '-h', howTitle: 'How this drill works', moreHint: 'the graph and the kind of problem' });
    var area = fr.area, s = T.studioOf(host), only = { mode: 'quiz' };
    var stage = el('div', 'ls-drill-stage gs-qstage'), why = el('div', 'ls-sec ls-drill-why'), det = el('div', 'ls-sec ls-drill-det');
    var bar = el('div', 'gs-qbar');
    function ctxName(c){ return c.id === 'move' ? 'Shift or movement (supply and demand)' : GS.SHORT[c.graph] + (locked(c.topic) ? ' (Premium)' : ''); }
    bar.innerHTML = '<label for="' + gid + '-g">Graph</label><select class="bt-select" id="' + gid + '-g"><option value="">Any graph</option>' + contexts.map(function(c){ return '<option value="' + c.id + '">' + esc(ctxName(c)) + '</option>'; }).join('') + '</select>';
    var gsel = bar.querySelector('select');
    var kinds = KIND_LABEL.filter(function(k){ return contexts.some(function(c){ return GS.typesOf(c, data).indexOf(k.value) > -1; }); });
    T.kindPicker(fr.pick, { label: 'Kind of problem', options: kinds, onChange: function(v){ kind = v; code = 0; draw(true); } });
    if(s){
      s.add('stage', stage, only); s.add('why', why, only); s.add('details', det, only);
      var more = host.querySelector(':scope > .cd-more'), about = host.querySelector(':scope > .bt-about');
      area.classList.add('ls-drill');
      fr.pick.insertBefore(bar, fr.pick.firstChild);
      s.add('dock', area, only);
      if(more) s.add('details', more, only);
      if(about){ about.open = true; s.add('about', about, only); }
    } else { fr.pick.insertBefore(bar, fr.pick.firstChild); }
    gsel.addEventListener('change', function(){ ctxSel = gsel.value; code = 0; draw(true); });

    /* The code says which context and kind: (context index * 4 + kind) * 100000 + seed. */
    function decode(n){
      var hi = Math.floor(n / 100000), ci = Math.floor(hi / 4), ki = hi % 4, c = contexts[ci] || null, k = ['', 'draw', 'shift', 'move'][ki] || '';
      if(c && k && GS.typesOf(c, data).indexOf(k) < 0) k = '';
      return { ctx: c, kind: k, seed: n };
    }
    function encode(ctx, k, r){ return (contexts.indexOf(ctx) * 4 + ['', 'draw', 'shift', 'move'].indexOf(k)) * 100000 + r; }
    function choose(){
      var ok = contexts.filter(function(c){ return (!ctxSel || c.id === ctxSel) && (!kind || GS.typesOf(c, data).indexOf(kind) > -1); });
      if(!ctxSel){ var free = ok.filter(function(c){ return !locked(c.topic); }); if(free.length) ok = free; }
      if(!ok.length) ok = contexts.filter(function(c){ return !kind || GS.typesOf(c, data).indexOf(kind) > -1; });
      var r = fresh(), ctx = ok[Math.floor(Math.random() * ok.length)];
      return encode(ctx, kind && GS.typesOf(ctx, data).indexOf(kind) > -1 ? kind : '', r);
    }
    function pick(gr){
      var c = contexts.filter(function(x){ return x.graph === gr && x.id !== 'move'; })[0];
      if(c){ ctxSel = c.id; gsel.value = c.id; code = 0; draw(true); }
    }
    function gate(ctx){
      var c = core(), g = c && c.gate ? c.gate('tools', SLUG, ctx.topic) : '';
      area.innerHTML = '<div class="bt-prob-head"><h2 id="' + gid + '-h" tabindex="-1">' + esc(GS.SHORT[ctx.graph]) + ' drills are part of Premium</h2></div>' + (g || '<p>These drills are part of Premium.</p>') +
        '<p class="bt-small">The PPC, supply and demand, and shift-or-movement drills are free, and Explore draws every graph.</p><div class="bt-actions"><button type="button" class="btn-press sm ls-btn ls-pri gs-free">Practice supply and demand</button></div>';
      area.querySelector('.gs-free').addEventListener('click', function(){ ctxSel = 'sd'; gsel.value = 'sd'; code = 0; draw(true); });
      stage.innerHTML = ''; why.innerHTML = ''; det.innerHTML = '';
      if(s){ s.caption('Pick a free graph above, or unlock every drill with Premium.', 'quiz'); s.pills([], 'left', 'quiz'); }
    }

    function draw(focus){
      if(!code) code = choose();
      var d = decode(code);
      if(!d.ctx){ code = choose(); d = decode(code); }
      if(gsel.value !== (ctxSel || '')) gsel.value = ctxSel || '';
      if(locked(d.ctx.topic)){ gate(d.ctx); return; }
      var r = M.rng(d.seed), p = GS.generate(r, d.ctx, d.kind || undefined, data), results = [], resp = { shifts: {}, eq: null, point: null, labels: {} }, firsts = {};
      area.innerHTML = '<div class="bt-prob-head"><h2 id="' + gid + '-h" tabindex="-1">' + esc(GS.SHORT[p.graph]) + ': ' + esc(p.type === 'move' ? 'shift or movement' : p.type === 'draw' ? 'draw it' : 'shift it') + '</h2><p class="bt-code">Problem code <b>' + code + '</b> <a href="?seed=' + code + '">Link to this problem</a></p></div>' +
        '<div class="bt-context">' + p.text + '</div><div class="cd-steps"></div><div class="bt-solution" hidden></div><div class="bt-next"></div>';
      var fig = el('figure', 'gs-qfig'), rub = el('ol', 'gs-rubric'), gh = el('div', 'gs-host gs-qhost');
      rub.setAttribute('aria-label', 'Rubric points');
      fig.appendChild(rub); fig.appendChild(gh);
      var steps = area.querySelector('.cd-steps'), mnt = null;
      if(s){
        stage.innerHTML = ''; stage.appendChild(fig);
        det.innerHTML = '<h3 class="ls-title-l">This problem</h3>'; det.appendChild(area.querySelector('.bt-context').cloneNode(true)); det.appendChild(area.querySelector('.bt-code'));
        area.querySelector('.bt-context').classList.add('sr-only');
        area.querySelector('.bt-prob-head h2').classList.add('sr-only');
        why.innerHTML = '<h3 class="ls-title-l">Worked solution</h3><p class="ls-sub">It appears here once every step is answered.</p>';
        s.caption(esc(p.setting ? p.setting + ' ' : '') + esc(p.cause), 'quiz'); s.pills([], 'left', 'quiz');
      } else area.insertBefore(fig, steps);
      function paintRubric(cur){
        rub.innerHTML = p.steps.map(function(x, i){
          var st = firsts[x.key], cls = st === true ? 'is-ok' : st === false ? 'is-no' : i === cur ? 'is-cur' : '';
          return '<li class="' + cls + '"><span class="gs-rk" aria-hidden="true">' + (st === true ? '✓' : st === false ? '✕' : i + 1) + '</span>' + esc(TASK[x.key]) + '<span class="sr-only">' + (st === true ? ': right the first time' : st === false ? ': not right the first time' : i === cur ? ': now' : '') + '</span></li>';
        }).join('');
      }
      /* The graph as one step shows it: only that step's controls are live. */
      function show(i){
        var x = p.steps[i] || {}, t = x.task, d2 = [];
        if(t === 'labels') d2 = ['label'];
        else if(t === 'shift') d2 = ['shift'];
        else if(t === 'equilibrium') d2 = ['shift', 'equilibrium'];
        else if(t === 'point') d2 = ['point'];
        var sp = { kind: p.spec.kind, do: d2, names: p.spec.names, pointLabel: p.spec.pointLabel };
        if(t === 'equilibrium') sp.movable = [];
        if(!sp.names) delete sp.names;
        mnt = G.mount(gh, sp, { readonly: !t });
        var st = { shifts: resp.shifts, eq: t === 'equilibrium' ? (resp.eq || G.eq(p.spec, {})) : resp.eq, point: resp.point, labels: t === 'labels' ? {} : resp.labels };
        mnt.set(st);
        var rs = gh.querySelector('.mac-gr-reset');
        if(rs && t !== 'labels' && t !== 'shift' && t !== 'point') rs.remove();
        return mnt;
      }
      function step(i){
        if(i >= p.steps.length) return finish();
        var x = p.steps[i], sid = gid + '-s' + i, tries = 0, done = false;
        paintRubric(i);
        var g2 = show(i);
        var f = el('form', 'bt-part cd-step gs-step');
        f.setAttribute('novalidate', ''); f.setAttribute('aria-labelledby', sid + '-l');
        var head = '<p class="cd-label" id="' + sid + '-l"><span class="cd-n">Step ' + (i + 1) + ' of ' + p.steps.length + '</span> ' + esc(x.label) + '</p>' + (x.hint ? '<p class="bt-small gs-hint">' + esc(x.hint) + '</p>' : '');
        var body = '';
        if(x.kind === 'choice'){
          var ord = x.fixed ? x.options.map(function(o, k){ return k; }) : window.ApMacroQuestions.shuffle(x.options.map(function(o, k){ return k; }));
          body = '<fieldset class="cd-opts"><legend class="sr-only">' + esc(x.label) + '</legend>' + ord.map(function(k){
            return '<div class="bt-radio cd-opt"><input type="radio" name="' + sid + '" id="' + sid + '-o' + k + '" value="' + k + '"><label for="' + sid + '-o' + k + '">' + esc(x.options[k]) + '</label></div>';
          }).join('') + '</fieldset>';
        } else body = '<div class="gs-stepctl"></div>';
        f.innerHTML = head + body + '<div class="bt-actions"><button type="submit" class="btn-press sm">Check</button></div><div class="cd-fb" role="status" aria-live="polite"></div>';
        steps.appendChild(f);
        if(x.kind === 'graph') liftControls(gh, f.querySelector('.gs-stepctl'));
        var fb = f.querySelector('.cd-fb');
        f.addEventListener('submit', function(e){ e.preventDefault(); check(); });
        function lockStep(){ done = true; f.querySelectorAll('input').forEach(function(q){ q.disabled = true; }); if(g2 && g2.lock) g2.lock(); }
        function next(right){
          if(firsts[x.key] === undefined) firsts[x.key] = right;
          results.push({ id: SLUG + ':' + p.ctx + ':' + x.key, correct: right, topic: (data.partTopics && data.partTopics[x.key]) || p.topic, practice: x.practice, level: x.level || 'apply', diff: 2, group: x.key });
          f.querySelector('.bt-actions').innerHTML = '';
          paintRubric(i + 1);
          step(i + 1);
          var nx = steps.lastElementChild;
          if(nx && nx !== f){ var q = nx.querySelector('input:not([disabled]), select:not([disabled]), .mac-gr-handle'); if(q) q.focus(); }
        }
        // Grade the whole graph so far, then read this step's rubric point.
        function grade(cur){
          if(x.task === 'shift' && p.alts.length){
            var best = null, bestSpec = p.spec;
            [p.spec].concat(p.alts).forEach(function(sp2){ var q = GR.graph(sp2, cur).points.filter(function(z){ return z.id === 'shift'; })[0]; if(!best || (q.ok && !best.ok)){ best = q; bestSpec = sp2; } });
            if(best.ok && bestSpec !== p.spec) useAlt(bestSpec);
            return best;
          }
          return GR.graph(p.spec, cur).points.filter(function(z){ return z.id === x.task; })[0];
        }
        function current(){
          var r2 = g2.get(), cur = { shifts: resp.shifts, eq: resp.eq, point: resp.point, labels: resp.labels };
          if(x.task === 'labels') cur.labels = r2.labels;
          if(x.task === 'shift') cur.shifts = r2.shifts;
          if(x.task === 'equilibrium') cur.eq = r2.eq;
          if(x.task === 'point') cur.point = r2.point;
          return cur;
        }
        function blankNote(cur){
          if(x.task === 'labels') return G.labelSlots(p.spec).some(function(sl){ return !cur.labels[sl]; }) ? 'Choose a label for both axes and every curve first.' : '';
          if(x.task === 'shift') return moved(cur.shifts) ? '' : 'Move a curve first: drag it, or use its button and the arrow keys.';
          if(x.task === 'equilibrium'){ var e0 = G.eq(p.spec, {}); return cur.eq && (Math.abs(cur.eq[0] - e0[0]) > 1e-9 || Math.abs(cur.eq[1] - e0[1]) > 1e-9) ? '' : 'Move E2 off E1 first, to where the curves cross now.'; }
          if(x.task === 'point') return cur.point ? '' : 'Place the point first: tap the graph.';
          return '';
        }
        function keep(cur){ resp = cur; }
        function reveal(){
          var K = p.key;
          if(x.kind === 'choice'){ var c = f.querySelector('input[value="' + x.correct + '"]'); if(c) c.checked = true; fb.innerHTML = '<span class="mac-mark no">Shown</span> ' + esc(x.why[x.correct].replace(/^Yes\. /, '')); }
          else {
            var cur = current();
            if(x.task === 'labels') cur.labels = K.labels;
            if(x.task === 'shift') cur.shifts = K.shifts;
            if(x.task === 'equilibrium') cur.eq = G.eq(p.spec, cur.shifts);
            if(x.task === 'point') cur.point = K.point;
            keep(cur); g2.set(cur);
            if(x.task === 'shift' || x.task === 'point'){ g2.showKey(true); }
            f.querySelectorAll('select').forEach(function(q){ q.value = cur.labels[q.getAttribute('data-slot')] || ''; });
            fb.innerHTML = '<span class="mac-mark no">Shown</span> ' + esc(shownNote(x.task));
          }
          f.classList.add('is-shown');
          lockStep(); next(false);
        }
        function shownNote(t){
          var k = G.KINDS[p.graph];
          if(t === 'labels') return 'Vertical axis: ' + G.labelText(k.y, p.spec.names) + '. Horizontal axis: ' + G.labelText(k.x, p.spec.names) + '.';
          if(t === 'shift') return capFirst(p.spec.key.because) + ' shifts ' + p.spec.key.shifts.map(function(z){ return G.curveName(z.curve) + ' ' + z.dir; }).join(' and ') + ' (dashed in green).';
          if(t === 'equilibrium') return 'E2 sits where the curves cross now.';
          if(t === 'point') return 'Point ' + (p.spec.pointLabel || 'X') + ' is ' + p.pointWhy;
          return '';
        }
        function check(){
          if(done) return;
          var ok, note = '';
          if(x.kind === 'choice'){
            var c = f.querySelector('input:checked');
            if(!c){ fb.innerHTML = '<span class="bt-small">Choose an answer first.</span>'; return; }
            ok = +c.value === x.correct; note = x.why[+c.value];
          } else {
            var cur = current(), b = blankNote(cur);
            if(b){ fb.innerHTML = '<span class="bt-small">' + esc(b) + '</span>'; return; }
            var pt = grade(cur);
            ok = pt.ok; note = pt.ok ? okNote(x.task, cur) : axisNote(pt.note);
            if(ok) keep(cur);
          }
          tries++;
          if(ok){
            f.classList.add('is-right'); f.classList.remove('is-wrong');
            fb.innerHTML = '<span class="mac-mark ok">Correct</span> ' + esc(note);
            if(s) s.pills([{ html: esc(TASK[x.key]) + ' ✓', tone: 'good' }], 'left', 'quiz');
            lockStep(); next(tries === 1); return;
          }
          f.classList.add('is-wrong');
          if(s) s.pills([{ html: esc(TASK[x.key]) + ': not yet', tone: 'warn' }], 'left', 'quiz');
          fb.innerHTML = '<span class="mac-mark no">Not yet</span> ' + esc(note) + '<div class="bt-actions"><button type="button" class="bt-btn cd-show">Show the answer</button></div>';
          fb.querySelector('.cd-show').addEventListener('click', reveal);
          if(firsts[x.key] === undefined) firsts[x.key] = false;
          paintRubric(i);
        }
        function okNote(t, cur){
          if(t === 'labels') return 'Every axis and curve is labeled.';
          if(t === 'shift') return 'Right curve, right way.';
          if(t === 'equilibrium'){ var o = G.outcome(p.spec, cur.shifts); return o ? 'E2 is where the curves cross now.' : ''; }
          if(t === 'point') return 'That is where it belongs.';
          return '';
        }
      }
      /* A student who drew the accepted second key (deficit as less saving):
         the rest of the problem follows that graph, as readers score it. */
      function useAlt(sp2){
        p.spec = sp2;
        p.key = GS.keyResponse(sp2);
        var oc = p.steps.filter(function(z){ return z.key === 'outcome'; })[0];
        if(oc && sp2.key.outcome){ var c2 = GS.outcomeChoice(M.rng(d.seed + 1), p.graph, sp2.key.outcome, sp2.names); oc.options = c2.options; oc.keys = c2.keys; oc.correct = c2.correct; oc.why = c2.why; }
      }
      function finish(){
        paintRubric(-1);
        var right = results.filter(function(z){ return z.correct; }).length;
        var sol = area.querySelector('.bt-solution');
        sol.hidden = false;
        sol.innerHTML = '<h3 tabindex="-1">Worked solution</h3><ol class="bt-steps">' + p.solution.map(function(z){ return '<li>' + esc(z) + '</li>'; }).join('') + '</ol>';
        T.record(SLUG, results);
        T.event('apmacro-drill-check', { tool: SLUG, correct: right, total: results.length });
        var nx = area.querySelector('.bt-next');
        nx.innerHTML = '<p class="bt-result" role="status">' + right + ' of ' + results.length + (results.length === 1 ? ' point' : ' points') + ' right the first time.</p><div class="bt-actions"><button type="button" class="btn-press sm cd-again">New problem</button>' + T.report(SLUG + ':' + p.ctx) + '</div>';
        nx.querySelector('.cd-again').addEventListener('click', function(){ code = 0; draw(true); });
        T.keepGoing(nx, { topic: p.topic, also: results.filter(function(z){ return !z.correct; }).map(function(z){ return z.topic; }) });
        if(s){
          why.innerHTML = ''; why.appendChild(sol);
          s.pills([{ html: right + ' of ' + results.length + ' points', tone: right === results.length ? 'good' : 'warn' }], 'left', 'quiz');
          s.caption('<b>' + right + ' of ' + results.length + ' rubric points right the first time.</b> The worked solution is under Why.', 'quiz');
          var again = nx.querySelector('.cd-again'); again.classList.add('ls-btn', 'ls-pri'); again.focus();
        } else sol.querySelector('h3').focus();
      }
      step(0);
      if(s && p.steps.length > 1 && window.LevlStudio && window.LevlStudio.stepper) window.LevlStudio.stepper(steps, { items: ':scope > .cd-step', total: p.steps.length, done: function(){ var nx = area.querySelector(':scope > .bt-next'); return !!(nx && nx.children.length); } });
      if(focus){ var h = area.querySelector('h2'); if(h) h.focus(); }
    }
    if(want && want.graph){ var c0 = contexts.filter(function(x){ return x.graph === want.graph && x.id !== 'move'; })[0]; if(c0){ ctxSel = c0.id; gsel.value = c0.id; } }
    draw(false);
    return { pick: pick };
  }
})();
