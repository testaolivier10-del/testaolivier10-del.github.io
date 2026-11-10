/* Graph Studio page (docs/apmicro-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T1). Mounts into #app with ApMicroTools.mount; the model is
   ApMicroMath.graphStudio (microeconomics/assets/tools/math/graph-studio.js), the
   content microeconomics/data/tools/graph-studio.json (served filtered as
   assets/tool-data/graph-studio.json: a graph or scenario shows once its topic
   is published). The frame is ApMicroTools.modes on the Tool Studio.

   Every graph on this page is drawn by ApMicroGraph.mount / .svg and every
   graph step is graded by ApMicroGrade.graph (no second renderer or grader);
   ApMicroMath.graphStudio.refine only rewords a lost point's note when the
   answer is a known slip (price read from MR, market and efficient quantity
   swapped ...).

   Explore: pick a graph (chips), pick what happens (shifts, a point or line
   to mark, an area to shade), then act on the graph: drag the curve, tap the
   point, drag the line, tap the areas. The picture answers at once (pills
   and a caption on the stage), and Show me draws the answer. With nothing
   picked the graph is free: drag any curve (the firm's line, the monopoly
   point and the market follow), or tap any area to hear its name. Why: the
   cause, the curve or point or area, the result. Details: axes, what shifts
   each curve, the named areas.

   Test yourself: a step drill like ApMicroTools.drill (seeded, first try
   recorded as graph-studio:<context>:<step>, worked solution in Why, Keep
   going). The graph is remounted for each rubric point (labels, shift, E2,
   line, point, shade) so only that point's controls are live, and the rubric
   strip on the stage ticks each point as a reader scores it. The PPC and
   supply-and-demand drills are free; the other graphs ask ApMicroCore.locked
   and show the Premium gate. Problem codes carry the context and kind. */
(function(){
  'use strict';
  var T = window.ApMicroTools, M = window.ApMicroMath, G = window.ApMicroGraph, GR = window.ApMicroGrade;
  if(!T || !M || !M.graphStudio || M.graphStudio.stub || !G || !GR) return;
  var GS = M.graphStudio, esc = T.esc;
  var SLUG = 'graph-studio';
  var TASK = { labels: 'Labels', shift: 'Shift', equilibrium: 'E2', outcome: 'Result', line: 'Line', point: 'Point', shade: 'Shade', move: 'Shift or move', check: 'Reason' };
  var WORD = { quantity: 'Quantity', price: 'Price', wage: 'Wage', 'quantity of labor': 'Workers' };
  var ARROW = { up: '↑', down: '↓', same: '=' }, SAY = { up: 'up', down: 'down', same: 'unchanged' };
  var KINDS = ['', 'draw', 'shift', 'shade', 'mark', 'move'];
  var KIND_LABEL = [{ value: 'draw', label: 'Draw it from scratch (labels first)' }, { value: 'shift', label: 'Shift it and follow the result' },
    { value: 'shade', label: 'Shade the area' }, { value: 'mark', label: 'Mark the point or line' }, { value: 'move', label: 'Shift or movement along?' }];
  var UNITS = [['Unit 1', ['ppc']], ['Unit 2', ['sd', 'policy']], ['Unit 3', ['costs', 'pc']], ['Unit 4', ['monopoly', 'monocomp']], ['Unit 5', ['labor', 'monopsony']], ['Unit 6', ['externality', 'lorenz']]];
  var CTX_NAME = { surplus: 'Consumer and producer surplus', controls: 'Price controls, taxes and subsidies', trade: 'Trade and tariffs' };

  function reduced(){ return T.reduced ? T.reduced() : false; }
  function core(){ return window.ApMicroCore; }
  function locked(topic){ var c = core(); try{ return !!(c && c.locked && c.locked(c.unitOf ? c.unitOf(topic) : '', topic)); }catch(e){ return false; } }
  function capFirst(s){ s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function copy(x){ return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function curveShort(id, spec){ var c = G.curveText(spec, id); return c[0] + c[1]; }
  function moved(sh){ return Object.keys(sh || {}).some(function(c){ return Math.abs(sh[c]) > 1e-9; }); }
  function baseTask(k){ return /^check-/.test(k) ? 'check' : k; }
  function merge(a, b){ var o = {}, k; for(k in a || {}) o[k] = a[k]; for(k in b || {}) o[k] = (o[k] || 0) + b[k]; return o; }
  function regionWord(n){ return G.REGION[n] || n; }
  function list(a){ return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  /* Take a mounted graph's controls (handles, area buttons, label menus) out of
     its host into a dock slot, so the stage holds only the picture. The help
     line stays for screen readers (the handles point at it). */
  function liftControls(host, slot){
    if(!slot) return;
    slot.innerHTML = '';
    var labels = host.querySelector('.mic-gr-labels'), ctl = host.querySelector('.mic-gr-controls'), help = host.querySelector('.mic-gr-help');
    if(help){ help.classList.add('sr-only'); slot.appendChild(help); }
    if(labels) slot.appendChild(labels);
    if(ctl && ctl.children.length) slot.appendChild(ctl);
  }
  /* A spec as one task shows it: only that task's controls live, nothing that
     gives the answer away (a tax's guides while the tax is being drawn). */
  function viewSpec(spec, task){
    var s = copy(spec), t = task === 'labels' ? ['label'] : task === 'equilibrium' ? ['shift', 'equilibrium'] : task ? [task] : [];
    s.do = t;
    if(task === 'equilibrium') s.movable = [];
    if((task === 'shift' || task === 'equilibrium' || task === 'labels') && s.policy && (s.policy.type === 'tax' || s.policy.type === 'subsidy') && (spec.do || []).indexOf('shift') > -1) delete s.policy;
    var K = spec.key || {};
    s.key = {};
    if(task === 'point' && K.point) s.key.point = K.point;
    if(task === 'shade') s.key.shade = K.shade;
    if(task === 'line') s.key.line = K.line;
    if(task !== 'shade') delete s.letters;
    return s;
  }
  function outcomePills(kind, o){
    var k = G.KINDS[kind];
    if(!k.out || !o) return [];
    return [k.out.y, k.out.x].filter(function(w){ return o[w]; }).map(function(w){ return { html: esc(WORD[w] || capFirst(w)) + ' <span aria-hidden="true">' + ARROW[o[w]] + '</span><span class="sr-only"> ' + SAY[o[w]] + '</span>', tone: o[w] === 'same' ? 'ghost' : 'readout' }; });
  }

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
    var nid = T.nid('gsx'), LS = null, touched = false, anim = null;
    var g = graphs[0], sc = null, task = null, spec = null, grade = null, mnt = null, shown = false, last = { shifts: {}, point: null, line: null, shade: [] }, lastCell = null;
    host.innerHTML = '<section class="bt-problem gs-x" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Graph Studio</h2>' +
      '<div class="gs-fig"><figure class="gs-pane gs-main"><div class="gs-host"></div></figure></div>' +
      '<div class="gs-ctl">' +
        '<div class="gs-row gs-grow"><label class="gs-scen-l" for="' + nid + '-g">Graph</label><select class="bt-select gs-gsel" id="' + nid + '-g">' + UNITS.map(function(u){ var xs = graphs.filter(function(x){ return u[1].indexOf(x.id) > -1; }); return xs.length ? '<optgroup label="' + u[0] + '">' + xs.map(function(x){ return '<option value="' + x.id + '">' + esc(GS.SHORT[x.id]) + '</option>'; }).join('') + '</optgroup>' : ''; }).join('') + '</select></div>' +
        '<div class="gs-row" data-ls-primary><label class="gs-scen-l" for="' + nid + '-s">What happens</label><select class="bt-select gs-scen" id="' + nid + '-s"></select>' +
          '<button type="button" class="btn-press sm ls-btn ls-pri gs-show">Show me</button></div>' +
        '<div class="gs-hand"></div><p class="gs-cap" aria-live="polite"></p>' +
      '</div>' +
      '<div class="gs-say"></div>' +
      T.moreHtml('<div class="gs-opts"><button type="button" class="bt-btn gs-drill">Test yourself on this graph</button></div><p class="bt-small">Explore draws every graph free. The PPC and supply-and-demand drills are free too; the other graphs\' drills are part of Premium.</p>', 'practice this graph') +
      '<div class="gs-nums"></div></section>';
    var R = {
      fig: host.querySelector('.gs-fig'), mainHost: host.querySelector('.gs-host'), ctl: host.querySelector('.gs-ctl'), gsel: host.querySelector('.gs-gsel'),
      scen: host.querySelector('.gs-scen'), show: host.querySelector('.gs-show'), hand: host.querySelector('.gs-hand'), cap: host.querySelector('.gs-cap'),
      say: host.querySelector('.gs-say'), nums: host.querySelector('.gs-nums'), prac: host.querySelector('.gs-drill')
    };
    var cue = T.cue('Pick what happens, then act on the graph: drag a curve, tap a point, tap an area.');
    R.ctl.insertBefore(cue.el, R.ctl.firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }

    function scenarios(){ return (data.scenarios || []).filter(function(x){ return x.graph === g.id; }); }
    function words(){ return GS.namesFor(g.id, null, data); }
    function txt(s){ return GS.fill(s, words().words); }
    function opt(x){ return '<option value="' + x.id + '">' + esc(x.title) + '</option>'; }
    function group(label, xs){ return xs.length ? '<optgroup label="' + label + '">' + xs.map(opt).join('') + '</optgroup>' : ''; }
    function pickGraph(id, keepScen){
      stopAnim();
      g = graphs.filter(function(x){ return x.id === id; })[0] || graphs[0];
      R.gsel.value = g.id;
      var xs = scenarios(), free = GS.freeSpec(g.id, data);
      R.scen.innerHTML = '<option value="">' + (free.do.indexOf('shade') > -1 ? 'Free: tap any area to name it' : 'Free draw: shift any curve') + '</option>' +
        group('Shift a curve', xs.filter(function(x){ return x.shifts; })) +
        group('Mark a point or line', xs.filter(function(x){ return !x.shifts && (x.point || x.line); })) +
        group('Shade an area', xs.filter(function(x){ return GS.shadeOnly(x); })) +
        group('Movement along a curve', xs.filter(function(x){ return x.along; }));
      if(!keepScen) sc = null;
      R.scen.value = sc ? sc.id : '';
      remount();
    }
    function pickScen(id){ stopAnim(); sc = scenarios().filter(function(x){ return x.id === id; })[0] || null; remount(); }
    /* The graph for the scenario (or free draw) as Explore shows it. */
    function remount(){
      var w = words();
      if(sc){ task = GS.primaryTask(sc); grade = task === 'move' ? null : GS.taskSpec(sc, w, task); spec = task === 'move' ? (function(){ var s0 = GS.taskSpec(sc, w, 'move'); s0.do = []; return s0; })() : viewSpec(grade, task); }
      else { task = null; grade = null; spec = GS.freeSpec(g.id, data); }
      if(spec.do.indexOf('shade') > -1) spec.letters = true;
      mnt = G.mount(R.mainHost, spec, { onChange: onChange, readonly: task === 'move' });
      liftControls(R.mainHost, R.hand);
      shown = false; lastCell = null; last = { shifts: {}, point: null, line: G.lineDef(spec) && spec.do.indexOf('line') > -1 ? G.lineStart(spec) : null, shade: [] };
      autoMark();
      details(); update();
    }
    // Free draw on a firm graph: the profit-maximizing point (or the hire) follows the curves.
    function autoMark(){
      if(sc || !spec.key || !spec.key.point || !spec.key.point.at) return;
      var p = G.named(spec, merge(G.fixedOffsets(spec), last.shifts), spec.key.point.at);
      mnt.set({ shifts: last.shifts, point: p, labels: {}, eq: null });
    }
    function onChange(r){
      if(anim) return;
      act();
      shown = false;
      var before = last.shade || [];
      last = { shifts: r.shifts, point: r.point, line: r.line, shade: r.shade || [] };
      lastCell = (last.shade.filter(function(c){ return before.indexOf(c) < 0; })[0]) || null;
      var e = G.KINDS[spec.kind].eq && moved(r.shifts) ? G.eq(spec, r.shifts) : null;
      if(e && spec.do.indexOf('shift') > -1){ mnt.set({ shifts: r.shifts, eq: e, point: r.point, labels: {}, line: r.line, shade: r.shade }); }
      autoMark();
      update();
    }
    /* Explore's verdict on the scenario's task, from ApMicroGrade.graph. */
    function verdict(){
      if(!sc || !grade) return null;
      var resp = { shifts: last.shifts, eq: null, point: last.point, labels: {}, line: last.line, shade: last.shade };
      if(task === 'shift'){
        if(!moved(last.shifts)) return null;
        var pt = GR.graph(grade, resp).points.filter(function(p){ return p.id === 'shift'; })[0];
        return { ok: pt.ok, note: pt.ok ? 'Right curve, right way.' : pt.note };
      }
      if(task === 'point'){
        if(!last.point) return null;
        var pp = GR.graph(grade, resp).points.filter(function(p){ return p.id === 'point'; })[0];
        return { ok: pp.ok, note: pp.ok ? 'Right: point ' + (grade.pointLabel || 'X') + ' is ' + txt(sc.point.why) : GS.refine(grade, 'point', resp, pp.note) };
      }
      if(task === 'line'){
        if(last.line == null || Math.abs(last.line - G.lineStart(spec)) < 1e-9) return null;
        var pl = GR.graph(grade, resp).points.filter(function(p){ return p.id === 'line'; })[0];
        return { ok: pl.ok, note: pl.ok ? txt(sc.line.why) : pl.note };
      }
      if(task === 'shade'){
        if(!last.shade.length) return null;
        var want = G.regionCells(grade, grade.key.shade), extra = last.shade.filter(function(c){ return want.indexOf(c) < 0; });
        if(extra.length){
          var regs = GS.cellRegions(grade, extra[0]).filter(function(n){ return [].concat(grade.key.shade).indexOf(n) < 0; });
          return { ok: false, note: 'Area ' + extra[0] + ' is not part of ' + list([].concat(grade.key.shade).map(regionWord)) + (regs.length ? ': it belongs to ' + regionWord(regs[0]) + '.' : '.') };
        }
        if(last.shade.length < want.length) return { part: true, note: last.shade.length + ' of its ' + want.length + ' parts shaded. Keep tapping.' };
        var ps = GR.graph(grade, resp).points.filter(function(p){ return p.id === 'shade'; })[0];
        return { ok: ps.ok, note: ps.ok ? txt(sc.shadeWhy || 'That is the area.') : GS.refine(grade, 'shade', resp, ps.note) };
      }
      return null;
    }
    function askLine(){
      if(task === 'shift') return 'Which curve moves, and which way?';
      if(task === 'point') return 'Tap the graph where point ' + (grade.pointLabel || 'X') + ' belongs: ' + txt(sc.point.ask);
      if(task === 'line') return 'Drag the line where it belongs.';
      if(task === 'shade') return txt(sc.ask || '') + ' Tap each part of it.';
      return 'Is this a shift? Press Show me to see.';
    }
    function update(){
      var k = G.KINDS[spec.kind], sh = last.shifts, o = k.out && moved(sh) ? G.outcome(spec, sh) : null, v = verdict(), cap = '', pills = [];
      if(sc){
        if(shown) cap = '<b>' + esc(sc.title) + '.</b> ' + esc(summary());
        else if(v && v.part) cap = esc(v.note);
        else if(v) cap = (v.ok ? '<b>Yes.</b> ' : '<b>Not yet.</b> ') + esc(v.note) + (v.ok && o && task === 'shift' ? ' ' + esc(GS.outcomeText(spec.kind, o)) : '') + (v.ok ? '' : ' Try again, or press Show me.');
        else cap = esc(txt(sc.cause)) + ' ' + esc(askLine());
        if(shown) pills.push({ html: 'Shown', tone: 'ghost' });
        else if(v && !v.part) pills.push({ html: v.ok ? 'Right' : 'Not yet', tone: v.ok ? 'good' : 'warn' });
      } else if(spec.do.indexOf('shade') > -1){
        if(lastCell){ var rs = GS.cellRegions(spec, lastCell); cap = '<b>Area ' + esc(lastCell) + '</b> is part of ' + esc(rs.length ? list(rs.map(regionWord)) : 'no named area') + '.'; }
        else cap = esc(g.shows) + ' Tap any area to see what it is called.';
      } else {
        cap = moved(sh) ? esc(capFirst(G.describe(spec, { shifts: sh }))) : esc(g.shows) + ' Drag a curve to shift it.';
      }
      if(g.id === 'ppc' && last.point){ var rg = G.region(spec, sh, last.point); if(rg) pills.push({ html: 'X ' + rg + ' the curve', tone: 'readout' }); }
      if(task !== 'move') pills = pills.concat(outcomePills(spec.kind, o), GS.readout(g.id, spec, { shifts: sh }).map(function(x){ return { html: esc(x.text), tone: x.tone }; }));
      if(LS){ LS.caption(cap, 'explore'); LS.pills(pills.slice(0, 3), 'left', 'explore'); }
      R.cap.innerHTML = cap;
      whyBox(o, v);
    }
    function summary(){
      var w = words().words;
      if(task === 'move') return 'Only the price changed: a movement along ' + G.curveName(sc.along) + ', not a shift.';
      if(task === 'point') return 'Point ' + (grade.pointLabel || 'X') + ' is ' + GS.fill(sc.point.why, w);
      if(task === 'line') return GS.fill(sc.line.why, w);
      if(task === 'shade') return GS.fill(sc.shadeWhy || '', w);
      return 'With ' + GS.fill(sc.because, w) + ', ' + grade.key.shifts.map(function(s){ return G.curveName(s.curve, grade) + ' shifts ' + G.dirWord(G.find(G.curves(grade, {}), s.curve).shape, G.dirSign(G.find(G.curves(grade, {}), s.curve).shape, s.dir)); }).join(' and ') + '.' + (grade.key.outcome ? ' ' + GS.outcomeText(grade.kind, grade.key.outcome) : '');
    }
    function whyBox(o, v){
      var head, body = '', w = words().words;
      if(!sc){
        head = esc(g.title) + ': ' + esc(g.shows);
        body = '<p>' + esc(g.movement) + '</p><p>Pick a scenario under What happens to see one change worked through.</p>';
      } else {
        var steps = ['<li><span><b>What happens.</b> ' + esc(txt(sc.cause)) + '</span></li>'];
        if(task === 'move') steps.push('<li><span><b>Shift or movement?</b> Only the price changed, and it is on an axis, so this is a movement along ' + esc(G.curveName(sc.along)) + '.</span></li>');
        else steps.push('<li><span><b>' + (task === 'shift' ? 'Which curve, which way.' : task === 'point' ? 'Where.' : task === 'line' ? 'The line.' : 'The area.') + '</b> ' + esc(summary()) + '</span></li>');
        if(sc.point && task !== 'point') steps.push('<li><span><b>Then the point.</b> ' + esc(GS.fill(sc.point.ask, w)) + ' It is ' + esc(GS.fill(sc.point.why, w)) + '</span></li>');
        if(sc.shade && task !== 'shade') steps.push('<li><span><b>Then the area.</b> ' + esc(GS.fill(sc.shadeWhy || '', w)) + '</span></li>');
        head = '<b>' + esc(sc.title) + '.</b> ' + (v && !v.part ? esc(v.ok ? 'You have it.' : v.note) : 'Try it on the graph first, then read why.');
        body = '<ol class="ls-steps">' + steps.join('') + '</ol>' + (sc.why || []).map(function(x){ return '<p>' + esc(GS.fill(x, w)) + '</p>'; }).join('');
      }
      T.explain(R.say, head, body);
      if(LS && LS.setupRow) LS.setupRow.open();
      void o;
    }
    function details(){
      var rows = g.shifters.map(function(s){ return '<tr><th scope="row">' + esc(curveShort(s.curve, spec)) + '<span class="gs-cname">' + esc(G.curveName(s.curve, spec)) + '</span></th><td><ul>' + s.list.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></td></tr>'; }).join('');
      var ps = G.panels(spec), axes = ps.map(function(p){ return (ps.length > 1 ? esc(p.title) + ': ' : '') + 'vertical <b>' + esc(G.labelText(p.y, spec.names)) + '</b>, horizontal <b>' + esc(G.labelText(p.x, spec.names)) + '</b>'; }).join('. ');
      var areas = '';
      if(spec.do.indexOf('shade') > -1){
        var R2 = G.areas(spec).regions;
        areas = '<h4 class="gs-h4">The named areas</h4><div class="table-wrap" tabindex="0" role="region" aria-label="The named areas"><table class="ls-tbl gs-tbl"><tbody>' + Object.keys(R2).map(function(n){ return '<tr><th scope="row">' + esc(capFirst(regionWord(n))) + '</th><td>Area' + (R2[n].length > 1 ? 's ' : ' ') + esc(list(R2[n])) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }
      R.nums.innerHTML = '<h3 class="ls-title-l">' + esc(g.title) + '</h3><p>' + esc(g.shows) + '</p>' +
        '<h4 class="gs-h4">Axes</h4><p>' + axes + '. ' + esc(g.axes) + '</p>' +
        '<h4 class="gs-h4">What shifts each curve</h4><div class="table-wrap" tabindex="0" role="region" aria-label="What shifts each curve"><table class="ls-tbl gs-tbl"><tbody>' + rows + '</tbody></table></div>' +
        areas + '<h4 class="gs-h4">Reading it</h4><p>' + esc(g.movement) + '</p>';
    }
    /* Show me: the key drawn (a shift animated in about 0.7 s, at once with reduced motion). */
    function stopAnim(){ if(anim){ cancelAnimationFrame(anim); anim = null; } }
    function showMe(){
      if(!sc){ if(LS) LS.caption('Pick a scenario under What happens first; Show me then draws it.', 'explore'); R.scen.focus(); return; }
      act(); stopAnim();
      var key = grade ? GS.keyResponse(grade) : null;
      if(task === 'move'){
        var c = G.find(G.curves(spec, {}), sc.along), e0 = G.eq(spec, {}) || [5, 5], x = e0[0] + (sc.along === 'D' ? 1 : 1) * (sc.shifter === 'own-price-down' ? 1 : 1);
        mnt.set({ shifts: {}, eq: null, point: [x, G.y(c, x)], labels: {} }); shown = true; update(); return;
      }
      if(task !== 'shift'){
        var st = { shifts: {}, eq: null, labels: {}, point: task === 'point' ? key.point : null, line: task === 'line' ? key.line : null, shade: task === 'shade' ? key.shade : [] };
        mnt.set(st); if(task !== 'line') mnt.showKey(true);
        last = { shifts: {}, point: st.point, line: st.line, shade: st.shade }; shown = true; update(); return;
      }
      var to = G.keyOffsets(grade), t0 = null;
      mnt.reset();
      var frame = function(ts){
        if(t0 === null) t0 = ts;
        var f = reduced() ? 1 : Math.min(1, (ts - t0) / 700), e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2, sh = {};
        Object.keys(to).forEach(function(c){ sh[c] = to[c] * e; });
        mnt.set({ shifts: sh, eq: G.KINDS[spec.kind].eq && moved(sh) ? G.eq(spec, sh) : null, point: null, labels: {} });
        if(f < 1) anim = requestAnimationFrame(frame);
        else { anim = null; last = { shifts: to, point: null, line: null, shade: [] }; mnt.set({ shifts: to, eq: G.KINDS[spec.kind].eq ? G.eq(spec, to) : null, point: null, labels: {} }); shown = true; update(); }
      };
      if(reduced()) frame(0); else anim = requestAnimationFrame(frame);
    }
    function onClick(e){
      var b = e.target.closest('button');
      if(!b) return;
      if(b.classList.contains('gs-show')) showMe();
      else if(b.classList.contains('gs-drill')) practise(g.id);
    }
    host.addEventListener('click', onClick);
    R.scen.addEventListener('change', function(){ act(); pickScen(R.scen.value); });
    R.gsel.addEventListener('change', function(){ act(); pickGraph(R.gsel.value); });
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [R.fig], dock: [R.ctl], setup: 'Options', moreLabel: 'More options', why: [R.say], details: [R.nums] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      sp.setup('Practice this graph');
      update();
      if(s.mode() === 'explore') T.hintSlot(s, R.scen, 'Start here: pick what happens, then act on the graph', { before: R.scen.parentNode });
    }
    var g0 = graphs.filter(function(x){ return x.id === 'sd'; })[0] || graphs[0];
    g = g0; sc = scenarios().filter(function(x){ return x.shifts; })[0] || null;
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
    function isLocked(c){ return !GS.FREE[c.graph] && locked(c.topic); }
    function ctxName(c){ return (CTX_NAME[c.id] || GS.SHORT[c.graph]) + (isLocked(c) ? ' (Premium)' : ''); }
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

    /* The code says which context and kind: (context index * 8 + kind) * 100000 + seed. */
    function decode(n){
      var hi = Math.floor(n / 100000), ci = Math.floor(hi / 8), ki = hi % 8, c = contexts[ci] || null, k = KINDS[ki] || '';
      if(c && k && GS.typesOf(c, data).indexOf(k) < 0) k = '';
      return { ctx: c, kind: k, seed: n };
    }
    function encode(ctx, k, r){ return (contexts.indexOf(ctx) * 8 + KINDS.indexOf(k)) * 100000 + r; }
    function choose(){
      var ok = contexts.filter(function(c){ return (!ctxSel || c.id === ctxSel) && (!kind || GS.typesOf(c, data).indexOf(kind) > -1); });
      if(!ctxSel){ var free = ok.filter(function(c){ return !isLocked(c); }); if(free.length) ok = free; }
      if(!ok.length) ok = contexts.filter(function(c){ return !kind || GS.typesOf(c, data).indexOf(kind) > -1; });
      if(!ok.length) ok = contexts;
      var r = fresh(), ctx = ok[Math.floor(Math.random() * ok.length)];
      return encode(ctx, kind && GS.typesOf(ctx, data).indexOf(kind) > -1 ? kind : '', r);
    }
    function pick(gr){
      var c = contexts.filter(function(x){ return x.graph === gr; })[0];
      if(c){ ctxSel = c.id; gsel.value = c.id; code = 0; draw(true); }
    }
    function gate(ctx){
      var c = core(), gt = c && c.gate ? c.gate('tools', SLUG, ctx.topic) : '';
      area.innerHTML = '<div class="bt-prob-head"><h2 id="' + gid + '-h" tabindex="-1">' + esc(ctxName(ctx).replace(/ \(Premium\)$/, '')) + ' drills are part of Premium</h2></div>' + (gt || '<p>These drills are part of Premium.</p>') +
        '<p class="bt-small">The PPC and supply-and-demand drills are free, and Explore draws every graph.</p><div class="bt-actions"><button type="button" class="btn-press sm ls-btn ls-pri gs-free">Practice supply and demand</button></div>';
      area.querySelector('.gs-free').addEventListener('click', function(){ ctxSel = 'sd'; gsel.value = 'sd'; code = 0; draw(true); });
      var sp0 = GS.freeSpec(ctx.graph, data); sp0.do = [];
      stage.innerHTML = '<figure class="gs-qfig"><div class="gs-host"><div class="mic-gr-stage">' + G.svg(sp0, {}) + '</div></div></figure>'; why.innerHTML = ''; det.innerHTML = '';
      if(s){ s.caption('The PPC and supply-and-demand drills are free, and Explore draws this graph for everyone.', 'quiz'); s.pills([{ html: 'Premium', tone: 'accent' }], 'left', 'quiz'); }
    }

    function draw(focus){
      if(!code) code = choose();
      var d = decode(code);
      if(!d.ctx){ code = choose(); d = decode(code); }
      if(gsel.value !== (ctxSel || '')) gsel.value = ctxSel || '';
      if(isLocked(d.ctx)){ gate(d.ctx); return; }
      var r = M.rng(d.seed), p = GS.generate(r, d.ctx, d.kind || undefined, data), results = [], firsts = {};
      // One response per graded spec: the main graph, and the graph to shade.
      var resp = { shifts: {}, eq: null, point: null, labels: {}, line: null, shade: [] }, respS = { shifts: {}, eq: null, point: null, labels: {}, line: null, shade: [] };
      var head = (CTX_NAME[p.ctx] || GS.SHORT[p.graph]) + ': ' + (p.type === 'move' ? 'shift or movement' : p.type === 'draw' ? 'draw it' : p.type === 'shade' ? 'shade it' : p.type === 'mark' ? 'mark it' : 'shift it');
      area.innerHTML = '<div class="bt-prob-head"><h2 id="' + gid + '-h" tabindex="-1">' + esc(head) + '</h2><p class="bt-code">Problem code <b>' + code + '</b> <a href="?seed=' + code + '">Link to this problem</a></p></div>' +
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
          return '<li class="' + cls + '"><span class="gs-rk" aria-hidden="true">' + (st === true ? '✓' : st === false ? '✕' : i + 1) + '</span>' + esc(TASK[baseTask(x.key)]) + '<span class="sr-only">' + (st === true ? ': right the first time' : st === false ? ': not right the first time' : i === cur ? ': now' : '') + '</span></li>';
        }).join('');
      }
      function isShade(x){ return x.spec && x.spec === p.shade; }
      /* The graph as one step shows it: only that step's controls are live. A
         choice step shows the graph as it stands, read only. */
      function show(i){
        var x = p.steps[i] || {}, t = x.kind === 'graph' ? x.task : null, base = x.spec || (p.steps.slice(0, i).filter(function(z){ return z.spec; }).pop() || {}).spec || p.spec;
        var sp = viewSpec(base, t), R0 = base === p.shade ? respS : resp;
        if(t === 'shade' || base === p.shade) sp.letters = true;
        mnt = G.mount(gh, sp, { readonly: !t });
        var st = { shifts: R0.shifts, eq: t === 'equilibrium' ? (R0.eq || G.eq(base, {})) : R0.eq, point: R0.point, labels: t === 'labels' ? {} : R0.labels, line: R0.line, shade: R0.shade };
        mnt.set(st);
        var rs = gh.querySelector('.mic-gr-reset');
        if(rs && t !== 'labels' && t !== 'shift' && t !== 'point' && t !== 'shade' && t !== 'line') rs.remove();
        return mnt;
      }
      function step(i){
        if(i >= p.steps.length) return finish();
        var x = p.steps[i], sid = gid + '-s' + i, tries = 0, done = false, R0 = isShade(x) ? respS : resp;
        paintRubric(i);
        var g2 = show(i);
        var f = el('form', 'bt-part cd-step gs-step');
        f.setAttribute('novalidate', ''); f.setAttribute('aria-labelledby', sid + '-l');
        var hd = '<p class="cd-label" id="' + sid + '-l"><span class="cd-n">Step ' + (i + 1) + ' of ' + p.steps.length + '</span> ' + esc(x.label) + '</p>' + (x.hint ? '<p class="bt-small gs-hint">' + esc(x.hint) + '</p>' : '');
        var body = '';
        if(x.kind === 'choice'){
          var ord = x.fixed ? x.options.map(function(o, k){ return k; }) : window.ApMicroQuestions.shuffle(x.options.map(function(o, k){ return k; }));
          body = '<fieldset class="cd-opts"><legend class="sr-only">' + esc(x.label) + '</legend>' + ord.map(function(k){
            return '<div class="bt-radio cd-opt"><input type="radio" name="' + sid + '" id="' + sid + '-o' + k + '" value="' + k + '"><label for="' + sid + '-o' + k + '">' + esc(x.options[k]) + '</label></div>';
          }).join('') + '</fieldset>';
        } else body = '<div class="gs-stepctl"></div>';
        f.innerHTML = hd + body + '<div class="bt-actions"><button type="submit" class="btn-press sm">Check</button></div><div class="cd-fb" role="status" aria-live="polite"></div>';
        steps.appendChild(f);
        if(x.kind === 'graph') liftControls(gh, f.querySelector('.gs-stepctl'));
        var fb = f.querySelector('.cd-fb');
        f.addEventListener('submit', function(e){ e.preventDefault(); check(); });
        function lockStep(){ done = true; f.querySelectorAll('input').forEach(function(q){ q.disabled = true; }); if(g2 && g2.lock) g2.lock(); }
        function next(right){
          if(firsts[x.key] === undefined) firsts[x.key] = right;
          var bt = baseTask(x.key);
          results.push({ id: SLUG + ':' + p.ctx + ':' + x.key, correct: right, topic: (data.partTopics && data.partTopics[bt]) || p.topic, practice: x.practice, level: x.level || 'apply', diff: 2, group: bt });
          f.querySelector('.bt-actions').innerHTML = '';
          paintRubric(i + 1);
          step(i + 1);
          var nx = steps.lastElementChild;
          if(nx && nx !== f){ var q = nx.querySelector('input:not([disabled]), select:not([disabled]), .mic-gr-handle'); if(q) q.focus(); }
        }
        function current(){
          var r2 = g2.get(), cur = { shifts: R0.shifts, eq: R0.eq, point: R0.point, labels: R0.labels, line: R0.line, shade: R0.shade };
          if(x.task === 'labels') cur.labels = r2.labels;
          if(x.task === 'shift') cur.shifts = r2.shifts;
          if(x.task === 'equilibrium') cur.eq = r2.eq;
          if(x.task === 'point') cur.point = r2.point;
          if(x.task === 'line') cur.line = r2.line;
          if(x.task === 'shade') cur.shade = r2.shade;
          return cur;
        }
        function blankNote(cur){
          if(x.task === 'labels') return G.labelSlots(x.spec).some(function(sl){ return !cur.labels[sl]; }) ? 'Choose a label for every axis, curve and line first.' : '';
          if(x.task === 'shift') return moved(cur.shifts) ? '' : 'Move a curve first: drag it, or use its button and the arrow keys.';
          if(x.task === 'equilibrium'){ var e0 = G.eq(x.spec, {}); return cur.eq && (Math.abs(cur.eq[0] - e0[0]) > 1e-9 || Math.abs(cur.eq[1] - e0[1]) > 1e-9) ? '' : 'Move E2 off E1 first, to where the curves cross now.'; }
          if(x.task === 'point') return cur.point ? '' : 'Place the point first: tap the graph.';
          if(x.task === 'line') return cur.line != null && Math.abs(cur.line - G.lineStart(viewSpec(x.spec, 'line'))) > 1e-9 ? '' : 'Move the line first: drag it, or use its button and the arrow keys.';
          if(x.task === 'shade') return cur.shade && cur.shade.length ? '' : 'Shade the area first: tap each part of it.';
          return '';
        }
        function keep(cur){ if(isShade(x)) respS = cur; else resp = cur; R0 = cur; }
        function reveal(){
          if(x.kind === 'choice'){ var c = f.querySelector('input[value="' + x.correct + '"]'); if(c) c.checked = true; fb.innerHTML = '<span class="mic-mark no">Shown</span> ' + esc(x.why[x.correct].replace(/^Yes\. /, '')); }
          else {
            var cur = current(), K = GS.keyResponse(x.spec);
            if(x.task === 'labels') cur.labels = K.labels;
            if(x.task === 'shift') cur.shifts = K.shifts;
            if(x.task === 'equilibrium') cur.eq = G.eq(x.spec, cur.shifts);
            if(x.task === 'point') cur.point = K.point;
            if(x.task === 'line') cur.line = K.line;
            if(x.task === 'shade') cur.shade = K.shade;
            keep(cur); g2.set(cur);
            if(x.task === 'shift' || x.task === 'point' || x.task === 'shade') g2.showKey(true);
            f.querySelectorAll('select').forEach(function(q){ q.value = cur.labels[q.getAttribute('data-slot')] || ''; });
            fb.innerHTML = '<span class="mic-mark no">Shown</span> ' + esc(shownNote(x.task));
          }
          f.classList.add('is-shown');
          lockStep(); next(false);
        }
        function shownNote(t){
          var sp = x.spec;
          if(t === 'labels') return G.panels(sp).map(function(pn){ return (G.panels(sp).length > 1 ? pn.title + ': ' : '') + 'vertical axis ' + G.labelText(pn.y, sp.names) + ', horizontal axis ' + G.labelText(pn.x, sp.names); }).join('. ') + '.';
          if(t === 'shift') return 'With ' + sp.key.because + ', ' + sp.key.shifts.map(function(z){ return G.curveName(z.curve, sp) + ' shifts ' + (z.dir === 'toward' ? 'toward equality' : z.dir === 'away' ? 'away from equality' : z.dir); }).join(' and ') + ' (dashed in green).';
          if(t === 'equilibrium') return 'E2 sits where the curves cross now.';
          if(t === 'point') return 'Point ' + (sp.pointLabel || 'X') + ' is dashed in green.';
          if(t === 'line') return 'The line is now where it belongs.';
          if(t === 'shade') return 'The area is outlined in green: ' + (G.REGION_HINT[[].concat(sp.key.shade)[0]] || capFirst(regionWord([].concat(sp.key.shade)[0])) + '.');
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
            var pt = GR.graph(x.spec, cur).points.filter(function(z){ return z.id === x.task; })[0];
            ok = pt.ok; note = pt.ok ? okNote(x.task) : GS.refine(x.spec, x.task, cur, pt.note);
            if(ok) keep(cur);
          }
          tries++;
          if(ok){
            f.classList.add('is-right'); f.classList.remove('is-wrong');
            fb.innerHTML = '<span class="mic-mark ok">Correct</span> ' + esc(note);
            if(s) s.pills([{ html: esc(TASK[baseTask(x.key)]) + ' ✓', tone: 'good' }], 'left', 'quiz');
            lockStep(); next(tries === 1); return;
          }
          f.classList.add('is-wrong');
          if(s) s.pills([{ html: esc(TASK[baseTask(x.key)]) + ': not yet', tone: 'warn' }], 'left', 'quiz');
          fb.innerHTML = '<span class="mic-mark no">Not yet</span> ' + esc(note) + '<div class="bt-actions"><button type="button" class="bt-btn cd-show">Show the answer</button></div>';
          fb.querySelector('.cd-show').addEventListener('click', reveal);
          if(firsts[x.key] === undefined) firsts[x.key] = false;
          paintRubric(i);
        }
        function okNote(t){
          if(t === 'labels') return 'Every axis, curve and line is labeled.';
          if(t === 'shift') return 'Right curve, right way.';
          if(t === 'equilibrium') return 'E2 is where the curves cross now.';
          if(t === 'point') return 'That is where it belongs.';
          if(t === 'line') return 'That is where the line belongs.';
          if(t === 'shade') return 'That is exactly the area.';
          return '';
        }
      }
      function finish(){
        paintRubric(-1);
        var right = results.filter(function(z){ return z.correct; }).length;
        var sol = area.querySelector('.bt-solution');
        sol.hidden = false;
        sol.innerHTML = '<h3 tabindex="-1">Worked solution</h3><ol class="bt-steps">' + p.solution.map(function(z){ return '<li>' + esc(z) + '</li>'; }).join('') + '</ol>';
        T.record(SLUG, results);
        T.event('apmicro-drill-check', { tool: SLUG, correct: right, total: results.length });
        var nx = area.querySelector('.bt-next');
        nx.innerHTML = '<p class="bt-result" role="status">' + right + ' of ' + results.length + (results.length === 1 ? ' point' : ' points') + ' right the first time.</p><div class="bt-actions"><button type="button" class="btn-press sm cd-again">New problem</button>' + T.report(SLUG + ':' + p.ctx) + '</div>';
        nx.querySelector('.cd-again').addEventListener('click', function(){ code = 0; draw(true); });
        T.keepGoing(nx, { topic: p.topic, also: results.filter(function(z){ return !z.correct; }).map(function(z){ return z.topic; }) });
        if(s){
          why.innerHTML = ''; why.appendChild(sol);
          s.pills([{ html: right + ' of ' + results.length + ' points', tone: right === results.length ? 'good' : 'warn' }], 'left', 'quiz');
          s.caption('<b>' + right + ' of ' + results.length + ' rubric points right the first time.</b> The worked solution is under Explanation.', 'quiz');
          var again = nx.querySelector('.cd-again'); again.classList.add('ls-btn', 'ls-pri'); again.focus();
        } else sol.querySelector('h3').focus();
      }
      step(0);
      if(s && p.steps.length > 1 && window.LevlStudio && window.LevlStudio.stepper) window.LevlStudio.stepper(steps, { items: ':scope > .cd-step', total: p.steps.length, done: function(){ var nx = area.querySelector(':scope > .bt-next'); return !!(nx && nx.children.length); } });
      if(focus){ var h = area.querySelector('h2'); if(h) h.focus(); }
    }
    if(want && want.graph){ var c0 = contexts.filter(function(x){ return x.graph === want.graph; })[0]; if(c0){ ctxSel = c0.id; gsel.value = c0.id; } }
    draw(false);
    return { pick: pick };
  }
})();
