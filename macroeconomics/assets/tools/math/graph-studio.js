/* Graph studio model: ApMacroMath.graphStudio (docs/apmacro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T1, docs/apmacro-briefs/t1.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmacro-tool-checks/graph-studio.mjs) and the
   test (scripts/test/apmacro-tool-graph-studio.test.mjs) run exactly this code.

   Every graph is an ApMacroGraph spec (mac-graph.js) and every graph step is
   graded by ApMacroGrade.graph; this file only builds the specs, the steps
   and the words around them. The scenarios (what happens, which curve it
   shifts and why) are content in macroeconomics/data/tools/graph-studio.json.

     GRAPHS                      the eight graph kinds in teaching order
     fill(text, words)           "{good}" -> "coffee"
     namesFor(graph, r, data)    { names (the spec's names), words (for text) }
     specOf(sc, names, does)     the ApMacroGraph spec of a scenario
     keyResponse(spec)           a response that earns every point (Show the answer)
     outcomeText(graph, o, nm)   "The price rises and the quantity rises."
     outcomeChoice(r, graph, o, nm)  { options, keys, correct, why }
     moveChoice(sc)              shift or movement along: { options, keys, correct, why }
     generate(r, ctx, type, data)    a drill problem (types draw, shift, move)
     tasksOf(sc, graph, type)    the graded steps of a problem, in order
     linked(graph, shifts)       the linked view (AD-AS -> Phillips, the
                                 mirror currency market) as { spec, state } */
(function(root){
  'use strict';
  if(!root.ApMacroMath) return;
  var M = root.ApMacroMath;
  function GR(){ return root.ApMacroGraph; }

  var GRAPHS = ['ppc', 'sd', 'adas', 'money', 'reserves', 'lf', 'phillips', 'forex'];
  var SHORT = { ppc: 'PPC', sd: 'Supply and demand', adas: 'AD-AS', money: 'Money market', reserves: 'Reserves', lf: 'Loanable funds', phillips: 'Phillips curves', forex: 'Foreign exchange' };
  // Graphs whose drills are free (spec section 6: Explore plus the PPC and
  // supply-and-demand drills); the page also asks ApMacroCore.locked.
  var FREE = { ppc: 1, sd: 1 };
  var TYPES = ['draw', 'shift', 'move'];
  var PRACTICE = { labels: '4.A', shift: '4.C', equilibrium: '4.C', outcome: '3.A', point: '4.B', move: '1.B' };

  function fill(t, w){ return String(t == null ? '' : t).replace(/\{(\w+)\}/g, function(m, k){ return w && w[k] != null ? w[k] : m; }); }
  function cap(s){ s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* The words a scenario's text uses and the names its graph shows. The
     explore view passes the data file's `explore` set; a drill picks one. */
  function namesFor(graph, r, data){
    var sets = (data && data.names && data.names[graph]) || [], w = sets.length ? (r ? r.pick(sets) : sets[0]) : {};
    var names = null;
    if(graph === 'ppc') names = { x: cap(w.x || 'Consumer goods'), y: cap(w.y || 'Capital goods') };
    if(graph === 'forex') names = { currency: w.cur || 'euro', other: w.other || 'dollar' };
    return { names: names, words: w };
  }

  /* A scenario -> ApMacroGraph spec. does: the graph tasks ('label',
     'shift', 'equilibrium', 'point'). The outcome is the graph's own
     (ApMacroGraph.outcome of the key), never typed, and only where an
     equilibrium is marked. alt: an accepted second key (the page grades the
     shift against each and keeps the better). */
  function specOf(sc, names, does, alt){
    var G = GR(), w = names || {};
    var spec = { kind: sc.graph, do: does.slice() };
    if(w.names) spec.names = w.names;
    if(does.indexOf('shift') > -1 && (alt || sc.shifts)){
      spec.key = { shifts: (alt || sc.shifts).map(function(s){ return { curve: s.curve, dir: s.dir }; }), because: fill(sc.because, w.words) };
      if(does.indexOf('equilibrium') > -1){
        // An axis two shifts leave to their sizes is never keyed (mac-graph.js indeterminate).
        var o = G.outcome(spec, G.keyOffsets(spec)), ind = G.indeterminate ? G.indeterminate(spec, spec.key.shifts) : [];
        if(o){ ind.forEach(function(w){ delete o[w]; }); spec.key.outcome = o; }
      }
    }
    if(does.indexOf('point') > -1){ spec.key = { point: JSON.parse(JSON.stringify(sc.point)) }; spec.pointLabel = sc.pointLabel || 'X'; }
    if(sc.slips){ spec.slips = {}; Object.keys(sc.slips).forEach(function(c){ spec.slips[c] = fill(sc.slips[c], w.words); }); }
    return spec;
  }

  /* A response that earns every point of a spec: the key's shifts, E2 at
     the key's crossing, every label right, and a point inside the key's
     region / on the key's curve on the key's side of the equilibrium. */
  function keyPoint(spec){
    var G = GR(), P = (spec.key || {}).point || {}, cs = G.curves(spec, {});
    if(P.region){
      var at = G.find(cs, 'PPC').at, d = P.region === 'inside' ? at * 0.55 : P.region === 'on' ? at : Math.min(9.5 * Math.SQRT2, at + 2.2), t = d / Math.SQRT2;
      return [M.round(t, 2), M.round(t, 2)];
    }
    var e0 = G.eq(spec, {}) || [5, 5], x = e0[0] + (P.x === 'up' ? 1 : P.x === 'down' ? -1 : 0), c = P.on && G.find(cs, P.on);
    if(c && c.shape !== 'vertical'){
      // walk along the curve the way the key says until the y direction holds too
      if(!P.x && P.y){ var probe = G.y(c, e0[0] + 1); x = e0[0] + ((probe > e0[1]) === (P.y === 'up') ? 1 : -1); }
      return [M.round(x, 2), M.round(G.y(c, x), 2)];
    }
    if(c) return [c.at, e0[1] + (P.y === 'up' ? 1 : P.y === 'down' ? -1 : 0)];
    return [x, e0[1] + (P.y === 'up' ? 1 : P.y === 'down' ? -1 : 0)];
  }
  function keyResponse(spec){
    var G = GR(), does = spec.do || [], r = { shifts: {}, eq: null, point: null, labels: {} };
    if(does.indexOf('shift') > -1) r.shifts = G.keyOffsets(spec);
    if(does.indexOf('equilibrium') > -1) r.eq = G.eq(spec, r.shifts);
    if(does.indexOf('point') > -1) r.point = keyPoint(spec);
    G.labelSlots(spec).forEach(function(s){ r.labels[s] = s === 'x' || s === 'y' ? G.KINDS[spec.kind][s] : s; });
    return r;
  }

  /* ----------------------------------------------------- outcome words */
  // How each outcome word reads in a sentence ("the price rises").
  var NOUN = { quantity: 'the quantity', price: 'the price', output: 'real output', 'price level': 'the price level',
    'quantity of money': 'the quantity of money', 'nominal interest rate': 'the nominal interest rate',
    'quantity of reserves': 'the quantity of reserves', 'policy rate': 'the policy rate',
    'quantity of loanable funds': 'the quantity of loanable funds', 'real interest rate': 'the real interest rate',
    'unemployment rate': 'the unemployment rate', 'inflation rate': 'the inflation rate', 'quantity of the currency': 'the quantity of {cur}s traded' };
  var VERB = { up: 'rises', down: 'falls', same: 'stays the same' };
  function phrase(word, d, names){
    var cur = names && names.currency || 'currency';
    if(word === 'value of the currency') return d === 'up' ? 'the ' + cur + ' appreciates' : d === 'down' ? 'the ' + cur + ' depreciates' : 'the value of the ' + cur + ' stays the same';
    return fill(NOUN[word] || ('the ' + word), { cur: cur }) + ' ' + VERB[d];
  }
  // The y word first (price, then quantity), as readers expect it said.
  function order(graph){ var o = GR().KINDS[graph].out; return o ? [o.y, o.x] : []; }
  function outcomeText(graph, o, names){
    var ws = order(graph).filter(function(w){ return o && o[w]; });
    return cap(ws.map(function(w){ return phrase(w, o[w], names); }).join(' and ')) + '.';
  }
  function same(a, b){ return Object.keys(a).every(function(k){ return a[k] === b[k]; }) && Object.keys(b).every(function(k){ return a[k] === b[k]; }); }
  /* Four statements about E2 against E1: the key and the three nearest
     slips (one axis read backwards, the other, both). */
  function outcomeChoice(r, graph, o, names){
    var ws = order(graph), flip = { up: 'down', down: 'up', same: 'up' };
    var cand = [];
    function add(x){ if(!cand.some(function(c){ return same(c, x); }) && !same(x, o)) cand.push(x); }
    var a = {}, b = {}, c = {};
    ws.forEach(function(w, i){ a[w] = i === 0 ? flip[o[w]] : o[w]; b[w] = i === 1 ? flip[o[w]] : o[w]; c[w] = flip[o[w]]; });
    add(a); add(b); add(c);
    // When an axis stays the same, the slips are moving it either way.
    ['up', 'down', 'same'].forEach(function(d0){ ['up', 'down', 'same'].forEach(function(d1){ var x = {}; x[ws[0]] = d0; x[ws[1]] = d1; add(x); }); });
    var keys = [o].concat(cand.slice(0, 3)), order2 = M.shuffle(r, keys.map(function(k, i){ return i; }));
    keys = order2.map(function(i){ return keys[i]; });
    var correct = keys.indexOf(o), dir = function(w, d){ return w === 'value of the currency' ? (d === 'up' ? 'higher' : d === 'down' ? 'lower' : 'the same') : d === 'up' ? 'higher' : d === 'down' ? 'lower' : 'the same'; };
    var axisOf = function(w){ return w === ws[0] ? 'vertical' : 'horizontal'; };
    return {
      options: keys.map(function(k){ return outcomeText(graph, k, names); }), keys: keys, correct: correct,
      why: keys.map(function(k){
        if(k === o) return 'Yes. Follow the dashed lines from E2 to each axis: ' + outcomeText(graph, o, names).replace(/\.$/, '').toLowerCase() + '.';
        var w = ws.filter(function(x){ return k[x] !== o[x]; })[0];
        return 'Read the ' + axisOf(w) + ' axis again: at E2 ' + fill(NOUN[w] || ('the ' + w), { cur: (names && names.currency) || 'currency' }).replace(/^the /, 'the ') + (w === 'value of the currency' ? ' (the value of the ' + ((names && names.currency) || 'currency') + ')' : '') + ' is ' + dir(w, o[w]) + ' than at E1' + (o[w] === 'same' ? '' : '') + '.';
      })
    };
  }

  /* --------------------------------------- shift or movement along */
  var ALONG = { sd: ['D', 'S'], adas: ['AD', 'SRAS'] };
  function moveChoice(sc, words){
    var G = GR(), cs = ALONG[sc.graph] || [], keys = [];
    cs.forEach(function(c){ keys.push({ shift: c }); });
    cs.forEach(function(c){ keys.push({ along: c }); });
    var want = sc.along ? { along: sc.along } : { shift: sc.shifts[0].curve };
    var name = function(c){ return G.curveName(c); };
    var vAxis = sc.graph === 'sd' ? 'the price' : 'the price level';
    return {
      options: keys.map(function(k){ return k.shift ? 'A shift of ' + name(k.shift) : 'A movement along ' + name(k.along); }), keys: keys, fixed: true,
      correct: keys.map(function(k){ return JSON.stringify(k); }).indexOf(JSON.stringify(want)),
      why: keys.map(function(k){
        var right = JSON.stringify(k) === JSON.stringify(want);
        if(right) return sc.along ? 'Yes. Only ' + vAxis + ' changed, and it is on an axis, so the economy slides along ' + name(sc.along) + '.' : 'Yes. ' + cap(fill(sc.because, words)) + ' is not on either axis, so it shifts the whole ' + name(want.shift) + ' curve.';
        if(k.along && !sc.along) return 'A movement along a curve comes only from a change in the variable on its axis (' + vAxis + '). This change is not on an axis, so it shifts a curve.';
        if(k.shift && sc.along) return 'Only ' + vAxis + ' changed, and it is on the vertical axis: that is a movement along a curve, not a shift.';
        if(k.shift) return 'Ask who the change affects: here it is ' + (want.shift === 'D' || want.shift === 'AD' ? 'buyers' : 'sellers') + ', so it shifts ' + name(want.shift) + ', not ' + name(k.shift) + '.';
        return 'The quantity that changes belongs to ' + (sc.along === 'D' || sc.along === 'AD' ? 'buyers' : 'sellers') + ', so the slide is along ' + name(sc.along) + ', not ' + name(k.along) + '.';
      })
    };
  }

  /* ------------------------------------------------------------ drills */
  function hasEq(graph){ return !!GR().KINDS[graph].eq; }
  /* The graded steps of a problem, in order. */
  function tasksOf(sc, type){
    if(type === 'move') return sc.along ? ['move'] : ['move', 'shift'];
    var t = [];
    if(type === 'draw') t.push('labels');
    if(sc.point) t.push('point');
    else { t.push('shift'); if(hasEq(sc.graph) && !sc.noEq) t.push('equilibrium', 'outcome'); }
    return t;
  }
  function doOf(tasks){
    var d = [];
    if(tasks.indexOf('labels') > -1) d.push('label');
    if(tasks.indexOf('shift') > -1) d.push('shift');
    if(tasks.indexOf('equilibrium') > -1) d.push('equilibrium');
    if(tasks.indexOf('point') > -1) d.push('point');
    return d;
  }
  // Which scenarios a context and type can draw on.
  function poolOf(ctx, type, data){
    return ((data && data.scenarios) || []).filter(function(sc){
      if(sc.graph !== ctx.graph || sc.drill === false) return false;
      if(ctx.only && ctx.only.indexOf(sc.id) < 0) return false;
      if(type === 'move') return !!ALONG[sc.graph] && !sc.point && (sc.along || (sc.shifts && sc.shifts.length === 1 && ALONG[sc.graph].indexOf(sc.shifts[0].curve) > -1));
      return !sc.along;
    });
  }
  function typesOf(ctx, data){ return (ctx.types || TYPES).filter(function(t){ return poolOf(ctx, t, data).length > 0; }); }

  var LABELS = {
    labels: 'Label both axes and every curve.',
    shift: 'Shift the curve this change moves, the way it moves it.',
    equilibrium: 'Move E2 to the new equilibrium.',
    outcome: 'Compared with E1, what is true at E2?',
    move: 'Is this a shift of a curve or a movement along one?'
  };
  var HINTS = {
    labels: 'One right name for each axis and curve.',
    shift: 'Drag it, or use its button and the arrow keys.',
    equilibrium: 'Where the curves cross now. Drag E2 or use its button.',
    point: 'Tap the graph, then drag or use the arrow keys.'
  };

  function generate(r, ctx, type, data){
    var types = typesOf(ctx, data);
    if(!types.length) throw new Error('graph-studio: context ' + ctx.id + ' has no scenarios');
    if(!type || types.indexOf(type) < 0) type = r.pick(types);
    var sc = r.pick(poolOf(ctx, type, data)), G = GR();
    var w = namesFor(sc.graph, r, data), words = w.words;
    var tasks = tasksOf(sc, type), does = doOf(tasks);
    // A movement-along problem has no graph task: its graph is only shown.
    var spec = specOf(sc, w, does);
    var alts = (sc.alt || []).map(function(a){ return specOf(sc, w, spec.do, a); });
    var k = G.KINDS[sc.graph], setting = fill(sc.setting || (data.settings && data.settings[sc.graph]) || '', words);
    var cause = fill(sc.cause, words);
    var text = '<p>' + (setting ? '<b>' + esc(setting) + '</b> ' : '') + esc(cause) + '</p>';
    var steps = [];
    tasks.forEach(function(t){
      var s = { key: t, practice: PRACTICE[t], level: t === 'labels' ? 'recall' : 'apply' };
      if(t === 'outcome'){
        var oc = outcomeChoice(r, sc.graph, spec.key.outcome, spec.names);
        s.kind = 'choice'; s.label = LABELS.outcome; s.options = oc.options; s.keys = oc.keys; s.correct = oc.correct; s.why = oc.why;
      } else if(t === 'move'){
        var mc = moveChoice(sc, words);
        s.kind = 'choice'; s.label = LABELS.move; s.options = mc.options; s.keys = mc.keys; s.correct = mc.correct; s.why = mc.why; s.fixed = true;
      } else {
        s.kind = 'graph'; s.task = t === 'labels' ? 'labels' : t;
        s.label = t === 'point' ? 'Place point ' + (spec.pointLabel || 'X') + ': ' + fill(sc.ask || 'where the economy is now.', words) : LABELS[t];
        s.hint = HINTS[t];
      }
      steps.push(s);
    });
    var key = keyResponse(spec), sol = [];
    if(tasks.indexOf('labels') > -1) sol.push('Labels: the vertical axis is ' + G.labelText(k.y, spec.names) + ', the horizontal axis ' + G.labelText(k.x, spec.names) + '; the curves are ' + k.curves.map(function(c){ return G.curveName(c.id) + ' (' + G.CURVE[c.id][0] + G.CURVE[c.id][1] + ')'; }).join(', ') + '.');
    if(type === 'move') sol.push(sc.along ? 'Only a variable on an axis changed, so this is a movement along ' + G.curveName(sc.along) + ', not a shift.' : 'The change is not on an axis, so it shifts a whole curve: ' + G.curveName(sc.shifts[0].curve) + '.');
    if(spec.key && spec.key.shifts) sol.push(cap(fill(sc.because, words)) + ' shifts ' + spec.key.shifts.map(function(s){ return G.curveName(s.curve) + ' ' + s.dir; }).join(' and ') + '.' + (alts.length ? ' (Also accepted: ' + alts.map(function(a){ return a.key.shifts.map(function(s){ return G.curveName(s.curve) + ' ' + s.dir; }).join(' and '); }).join('; ') + '.)' : ''));
    if(tasks.indexOf('equilibrium') > -1) sol.push('E2 is where ' + k.eq.map(function(c){ return G.CURVE[c][0] + G.CURVE[c][1]; }).join(' and ') + ' cross after the shift. ' + outcomeText(sc.graph, spec.key.outcome, spec.names));
    if(sc.point) sol.push('Point ' + (spec.pointLabel || 'X') + ': ' + fill(sc.pointWhy || '', words));
    (sc.why || []).forEach(function(x){ sol.push(fill(x, words)); });
    return { type: type, ctx: ctx.id, topic: sc.topic || ctx.topic, graph: sc.graph, scenario: sc.id, setting: setting, cause: cause,
      text: text, spec: spec, alts: alts, key: key, steps: steps, solution: sol, words: words, pointWhy: sc.point ? fill(sc.pointWhy, words) : '' };
  }

  /* --------------------------------------------- linked second views */
  /* AD-AS -> the Phillips curves: an AD shift is a movement along SRPC, an
     SRAS shift moves SRPC the other way, an LRAS shift moves LRPC the other
     way. Forex -> the mirror market: demand for one currency is supply of
     the other. Returns { spec, state, line } or null. */
  function linked(graph, shifts, names){
    var G = GR(), sh = shifts || {};
    if(graph === 'adas'){
      var a = { kind: 'adas', do: [] }, e0 = G.eq(a, {}), e1 = G.eq(a, sh) || e0;
      var spec = { kind: 'phillips', do: [], pointLabel: 'B' };
      var st = { shifts: {} };
      if(sh.SRAS) st.shifts.SRPC = -sh.SRAS;
      if(sh.LRAS) st.shifts.LRPC = -sh.LRAS;
      var dY = e1[0] - e0[0], moved = Math.abs(dY) > 1e-9 || Math.abs(e1[1] - e0[1]) > 1e-9;
      if(moved){
        var srpc = G.find(G.curves(spec, st.shifts), 'SRPC'), u = 5 - dY;
        st.point = [M.round(u, 3), M.round(G.y(srpc, u), 3)];
      }
      return { spec: spec, state: st };
    }
    if(graph === 'forex'){
      var n = names || { currency: 'euro', other: 'dollar' };
      var sp = { kind: 'forex', do: [], names: { currency: n.other, other: n.currency } }, s2 = { shifts: {} };
      if(sh.D) s2.shifts.S = sh.D;
      if(sh.S) s2.shifts.D = sh.S;
      return { spec: sp, state: s2 };
    }
    return null;
  }

  M.register('graphStudio', {
    GRAPHS: GRAPHS, SHORT: SHORT, FREE: FREE, TYPES: TYPES, PRACTICE: PRACTICE, ALONG: ALONG,
    fill: fill, namesFor: namesFor, specOf: specOf, keyResponse: keyResponse, keyPoint: keyPoint,
    outcomeText: outcomeText, outcomeChoice: outcomeChoice, moveChoice: moveChoice, phrase: phrase,
    tasksOf: tasksOf, doOf: doOf, poolOf: poolOf, typesOf: typesOf, generate: generate, linked: linked
  });
})(typeof window !== 'undefined' ? window : globalThis);
