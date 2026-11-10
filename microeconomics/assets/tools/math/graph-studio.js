/* Graph Studio model: ApMicroMath.graphStudio (docs/apmicro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T1, docs/apmicro-briefs/t1.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmicro-tool-checks/graph-studio.mjs) and the
   test (scripts/test/apmicro-tool-graph-studio.test.mjs) run exactly this code.

   Every graph is an ApMicroGraph spec (mic-graph.js) and every graph step is
   graded by ApMicroGrade.graph; this file only builds the specs, the steps
   and the words around them. The scenarios (what happens, which curve it
   moves, which point or area the exam asks for) are content in
   microeconomics/data/tools/graph-studio.json.

     GRAPHS, KIND, SHORT, FREE   the eleven graphs (graph id -> engine kind)
     fill(text, words)           "{good}" -> "coffee"
     namesFor(graph, r, data)    { names (the spec's names), words (for text) }
     tasksOf(sc, type)           the graded steps of a problem, in order
     mainSpec(sc, w, tasks)      the spec the label, shift, E2, line and point
                                 steps are graded on (null when none)
     shadeSpec(sc, w, label)     the spec the shade step is graded on: the
                                 graph as it stands after the earlier steps
     taskSpec(sc, w, task)       the spec of one task alone (Explore)
     freeSpec(graph, data)       Explore's free-draw spec for a graph
     outcomeChoice(r, kind, o, names)  { options, keys, correct, why }
     moveChoice(sc, words)       shift or movement along
     refine(spec, task, resp, note)  the reader's slip named more exactly
                                 (price read from MR, the market and efficient
                                 quantity swapped, wage read from MRP ...)
     readout(graph, spec, state) Explore's pills: what the picture says now
     cellRegions(spec, cell, off) the named areas a cell belongs to
     generate(r, ctx, type, data) a drill problem (types draw, shift, shade,
                                 mark, move) */
(function(root){
  'use strict';
  if(!root.ApMicroMath) return;
  var M = root.ApMicroMath;
  function GR(){ return root.ApMicroGraph; }

  var GRAPHS = ['ppc', 'sd', 'policy', 'costs', 'pc', 'monopoly', 'monocomp', 'labor', 'monopsony', 'externality', 'lorenz'];
  var KIND = { ppc: 'ppc', sd: 'sd', policy: 'sd-micro', costs: 'costs', pc: 'pc', monopoly: 'monopoly', monocomp: 'monocomp',
    labor: 'labor', monopsony: 'monopsony', externality: 'externality', lorenz: 'lorenz' };
  var SHORT = { ppc: 'PPC', sd: 'Supply and demand', policy: 'Surplus and policy', costs: 'Cost curves', pc: 'Perfect competition',
    monopoly: 'Monopoly', monocomp: 'Monopolistic competition', labor: 'Labor market', monopsony: 'Monopsony', externality: 'Externality', lorenz: 'Lorenz curve' };
  // Graphs whose drills are free (spec section 6: Explore plus the PPC and
  // supply-and-demand drills); the page asks ApMicroCore.locked for the rest.
  var FREE = { ppc: 1, sd: 1 };
  var TYPES = ['draw', 'shift', 'shade', 'mark', 'move'];
  var PRACTICE = { labels: '4.A', shift: '4.C', equilibrium: '4.C', outcome: '3.A', line: '4.B', point: '4.B', shade: '4.B', move: '1.B', check: '2.B' };

  function fill(t, w){ return String(t == null ? '' : t).replace(/\{(\w+)\}/g, function(m, k){ return w && w[k] != null ? w[k] : m; }); }
  function cap(s){ s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function copy(x){ return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function kindOf(sc){ return KIND[sc.graph]; }
  function baseTask(t){ return /^check-/.test(t) ? 'check' : t; }

  /* The words a scenario's text uses and the names its graph shows. The
     explore view passes no rng (the first set); a drill picks one. */
  function namesFor(graph, r, data){
    var sets = (data && data.names && data.names[graph]) || [], w = sets.length ? (r ? r.pick(sets) : sets[0]) : {};
    var names = null;
    if(graph === 'ppc') names = { x: cap(w.x || 'Consumer goods'), y: cap(w.y || 'Capital goods') };
    return { names: names, words: w };
  }

  /* ------------------------------------------------------------ specs */
  function hasEq(sc){ return !!GR().KINDS[kindOf(sc)].eq && !sc.noEq; }
  function shadeOnly(sc){ return !!sc.shade && !sc.shifts && !sc.line && !sc.point; }
  /* The graded steps of a problem, in order. */
  function tasksOf(sc, type){
    if(type === 'move') return sc.along ? ['move'] : ['move', 'shift'];
    var t = [];
    if(type === 'draw') t.push('labels');
    if(sc.shifts){ t.push('shift'); if(hasEq(sc)){ t.push('equilibrium'); if(!sc.noOutcome) t.push('outcome'); } }
    if(sc.line) t.push('line');
    if(sc.point) t.push('point');
    if(sc.shade) t.push('shade');
    (sc.check || []).forEach(function(c, i){ t.push('check-' + (i + 1)); });
    return t;
  }
  function start(sc, w){
    var spec = { kind: kindOf(sc), do: [] }, ex = copy(sc.spec) || {};
    Object.keys(ex).forEach(function(k){ spec[k] = ex[k]; });
    if(w && w.names) spec.names = w.names;
    return spec;
  }
  function slipsOf(sc, w, keep){
    if(!sc.slips) return null;
    var o = {}, n = 0;
    Object.keys(sc.slips).forEach(function(c){ if(!keep || keep(c)){ o[c] = fill(sc.slips[c], w && w.words); n++; } });
    return n ? o : null;
  }
  /* The spec the label, shift, E2, line and point steps share (one rubric
     point each, as readers score one graph), or null for a shade-only
     scenario (its labels go with the shade). */
  function mainSpec(sc, w, tasks){
    var G = GR(), does = [];
    var has = function(t){ return tasks.indexOf(t) > -1; };
    if(has('labels') && !shadeOnly(sc)) does.push('label');
    if(has('shift')) does.push('shift');
    if(has('equilibrium')) does.push('equilibrium');
    if(has('line')) does.push('line');
    if(has('point')) does.push('point');
    if(!does.length) return null;
    var spec = start(sc, w);
    spec.do = does;
    if(sc.line && sc.line.id) spec.line = { id: sc.line.id, at: sc.line.at };
    var key = {};
    if(has('shift')){
      key.shifts = sc.shifts.map(function(s){ var o = { curve: s.curve, dir: s.dir }; if(s.steps) o.steps = s.steps; return o; });
      key.because = fill(sc.because, w && w.words);
      if(has('equilibrium')){
        spec.key = key;
        var o = G.outcome(spec, G.keyOffsets(spec)), ind = G.indeterminate(spec, key.shifts);
        if(o){ ind.forEach(function(x){ delete o[x]; }); key.outcome = o; }
      }
    }
    if(has('line')) key.line = copy(sc.line.key);
    if(has('point')){ key.point = copy(sc.point.key); spec.pointLabel = sc.point.label || 'X'; }
    spec.key = key;
    var sl = slipsOf(sc, w, function(c){ return !G.REGION[c]; });
    if(sl) spec.slips = sl;
    return spec;
  }
  /* The graph as it stands after the earlier steps, to shade: the key's
     shifts drawn (a tax or subsidy draws its own), the policy a line step
     placed (shadeWith), and the area to shade as the key. */
  function shadeSpec(sc, w, withLabel){
    var G = GR(), spec = start(sc, w), P = spec.policy;
    if(sc.shifts && !(P && (P.type === 'tax' || P.type === 'subsidy'))){
      var tmp = start(sc, w); tmp.do = ['shift']; tmp.key = { shifts: sc.shifts };
      var off = G.keyOffsets(tmp);
      if(Object.keys(off).length){ spec.show = spec.show || {}; Object.keys(off).forEach(function(c){ spec.show[c] = (spec.show[c] || 0) + off[c]; }); }
    }
    Object.keys(sc.shadeWith || {}).forEach(function(k){ spec[k] = copy(sc.shadeWith[k]); });
    spec.do = (withLabel ? ['label'] : []).concat(['shade']);
    spec.key = { shade: copy(sc.shade) };
    spec.letters = true;
    var sl = slipsOf(sc, w, function(c){ return !!G.REGION[c]; });
    if(sl) spec.slips = sl;
    return spec;
  }
  /* One task alone, for Explore: the spec a scenario is tried on. */
  function primaryTask(sc){ return sc.along ? 'move' : sc.shifts ? 'shift' : sc.line ? 'line' : sc.point ? 'point' : 'shade'; }
  function taskSpec(sc, w, task){
    if(task === 'shade') return shadeSpec(sc, w, false);
    if(task === 'move'){ var s0 = start(sc, w); s0.do = ['shift']; return s0; }
    var t = task === 'shift' ? (hasEq(sc) ? ['shift', 'equilibrium'] : ['shift']) : [task];
    var sp = mainSpec(sc, w, t);
    return sp;
  }
  function freeSpec(graph, data){
    var g = ((data && data.graphs) || []).filter(function(x){ return x.id === graph; })[0] || {}, f = copy(g.free) || {};
    var spec = { kind: KIND[graph], do: f.do || ['shift'] };
    Object.keys(f).forEach(function(k){ if(k !== 'do' && k !== 'mark') spec[k] = f[k]; });
    var w = namesFor(graph, null, data);
    if(w.names) spec.names = w.names;
    if(f.mark){ spec.key = { point: { at: f.mark } }; spec.pointLabel = f.markLabel || 'M'; }
    if(spec.do.indexOf('shade') > -1) spec.letters = true;
    return spec;
  }
  /* The key's response, with a point "on" a PPC drawn away from the curve's
     own label (the engine's key point sits on the 45-degree line, where the
     label PPC is). Still graded "on" (the validator checks). */
  function keyResponse(spec){
    var G = GR(), r = G.keyResponse(spec), P = (spec.key || {}).point;
    if(r.point && P && P.region === 'on' && spec.kind === 'ppc'){
      var c = G.find(G.curves(spec, {}), 'PPC');
      if(c.shape === 'ppc') r.point = [M.round(c.at * 0.8, 3), M.round(c.at * 0.6, 3)];
    }
    return r;
  }

  /* ----------------------------------------------------- outcome words */
  var NOUN = { quantity: 'the quantity', price: 'the price', wage: 'the wage', 'quantity of labor': 'the number of workers hired' };
  var VERB = { up: 'rises', down: 'falls', same: 'stays the same' };
  function phrase(word, d){ return (NOUN[word] || ('the ' + word)) + ' ' + VERB[d]; }
  function order(kind){ var o = GR().KINDS[kind].out; return o ? [o.y, o.x] : []; }
  function outcomeText(kind, o){
    var ws = order(kind).filter(function(w){ return o && o[w]; });
    return cap(ws.map(function(w){ return phrase(w, o[w]); }).join(' and ')) + '.';
  }
  function same(a, b){ return Object.keys(a).every(function(k){ return a[k] === b[k]; }) && Object.keys(b).every(function(k){ return a[k] === b[k]; }); }
  /* Four statements about E2 against E1: the key and the three nearest
     slips (one axis read backwards, the other, both). */
  function outcomeChoice(r, kind, o, names){
    var ws = order(kind), flip = { up: 'down', down: 'up', same: 'up' }, cand = [];
    function add(x){ if(!cand.some(function(c){ return same(c, x); }) && !same(x, o)) cand.push(x); }
    var a = {}, b = {}, c = {};
    ws.forEach(function(w, i){ a[w] = i === 0 ? flip[o[w]] : o[w]; b[w] = i === 1 ? flip[o[w]] : o[w]; c[w] = flip[o[w]]; });
    add(a); add(b); add(c);
    ['up', 'down', 'same'].forEach(function(d0){ ['up', 'down', 'same'].forEach(function(d1){ var x = {}; x[ws[0]] = d0; x[ws[1]] = d1; add(x); }); });
    var keys = [o].concat(cand.slice(0, 3)), ord = M.shuffle(r, keys.map(function(k, i){ return i; }));
    keys = ord.map(function(i){ return keys[i]; });
    var dir = function(d){ return d === 'up' ? 'higher' : d === 'down' ? 'lower' : 'the same'; };
    void names;
    return {
      options: keys.map(function(k){ return outcomeText(kind, k); }), keys: keys, correct: keys.indexOf(o),
      why: keys.map(function(k){
        if(k === o) return 'Yes. Follow the dashed lines from E2 to each axis: ' + outcomeText(kind, o).replace(/\.$/, '').toLowerCase() + '.';
        var w = ws.filter(function(x){ return k[x] !== o[x]; })[0];
        return 'Read the ' + (w === ws[0] ? 'vertical' : 'horizontal') + ' axis again: at E2 ' + (NOUN[w] || 'the ' + w) + ' is ' + dir(o[w]) + ' than at E1.';
      })
    };
  }

  /* --------------------------------------- shift or movement along */
  var ALONG = { sd: ['D', 'S'] };
  function moveChoice(sc, words){
    var G = GR(), cs = ALONG[sc.graph] || [], keys = [];
    cs.forEach(function(c){ keys.push({ shift: c }); });
    cs.forEach(function(c){ keys.push({ along: c }); });
    var want = sc.along ? { along: sc.along } : { shift: sc.shifts[0].curve };
    var name = function(c){ return G.curveName(c); };
    return {
      options: keys.map(function(k){ return k.shift ? 'A shift of ' + name(k.shift) : 'A movement along ' + name(k.along); }), keys: keys, fixed: true,
      correct: keys.map(function(k){ return JSON.stringify(k); }).indexOf(JSON.stringify(want)),
      why: keys.map(function(k){
        var right = JSON.stringify(k) === JSON.stringify(want);
        if(right) return sc.along ? 'Yes. Only the price changed, and it is on an axis, so the market slides along ' + name(sc.along) + '.' : 'Yes. That change, ' + fill(sc.because, words) + ', is not on either axis, so it shifts the whole ' + name(want.shift) + ' curve.';
        if(k.along && !sc.along) return 'A movement along a curve comes only from a change in the price, the variable on the vertical axis. This change is not on an axis, so it shifts a curve.';
        if(k.shift && sc.along) return 'Only the price changed, and it is on the vertical axis: that is a movement along a curve, not a shift.';
        if(k.shift) return 'Ask who the change affects: here it is ' + (want.shift === 'D' ? 'buyers' : 'sellers') + ', so it shifts ' + name(want.shift) + ', not ' + name(k.shift) + '.';
        return 'The quantity that changes here belongs to ' + (sc.along === 'D' ? 'buyers' : 'sellers') + ', so the slide is along ' + name(sc.along) + ', not ' + name(k.along) + '.';
      })
    };
  }

  /* ------------------------------------------------- slips, named exactly */
  var NEAR = 0.3;
  function near(p, q){ return !!(p && q) && Math.abs(p[0] - q[0]) <= NEAR && Math.abs(p[1] - q[1]) <= NEAR; }
  function merge(a, b){ var o = {}, k; for(k in a || {}) o[k] = a[k]; for(k in b || {}) o[k] = (o[k] || 0) + b[k]; for(k in o) if(!o[k]) delete o[k]; return o; }
  /* A placed point that lands on another named point is the reader-report
     slip by name: [the point asked, the point placed, the sentence]. */
  var POINT_SLIP = [
    ['profit-max', 'mr=mc', 'That is where MR = MC: the right quantity, but the price is read straight up on the demand curve, not on MR or MC.'],
    ['profit-max', 'allocative', 'That is where demand meets MC, the allocatively efficient point. A monopolist makes less: the quantity where MR = MC, priced from demand.'],
    ['allocative', 'profit-max', 'That is the profit-maximizing point (MR = MC, priced from demand). The allocatively efficient point is where demand meets MC, at a larger quantity.'],
    ['hire', 'mrp=mfc', 'That is where MRP = MFC: the right number of workers, but the wage is read down on the labor supply curve, not on MFC or MRP.'],
    ['hire', 'competitive', 'That is the competitive outcome, where MRP meets labor supply. A monopsonist hires fewer, where MRP = MFC, and pays the wage on the supply curve.'],
    ['competitive', 'hire', 'That is the monopsony outcome. A competitive labor market settles where MRP meets labor supply, with more workers at a higher wage.'],
    ['efficient', 'market', 'That is the market quantity, where the private curves cross. The efficient quantity is where marginal social benefit equals marginal social cost.'],
    ['market', 'efficient', 'That is the efficient quantity (MSB = MSC). The market ignores the externality, so it settles where the private curves cross.'],
    ['min-avc', 'min-atc', 'That is the bottom of ATC, the break-even price. The shutdown point is the bottom of AVC, where MC crosses it.'],
    ['min-atc', 'min-avc', 'That is the bottom of AVC, the shutdown point. MC crosses ATC at the bottom of ATC, further right and higher.'],
    ['firm', 'min-atc', 'That is the bottom of ATC. The firm produces where its price line crosses MC, which is the bottom of ATC only when price equals it.'],
    ['fair-return', 'allocative', 'That is the socially optimal price (P = MC), which would make a natural monopoly lose money. The fair-return price is where demand meets ATC.']
  ];
  /* refine(spec, task, resp, note) -> the note, made exact when the
     response is a known slip. Used after ApMicroGrade.graph marks a point
     wrong; the grade itself never changes. */
  function refine(spec, task, resp, note){
    var G = GR(), K = spec.key || {};
    try{
      if(task === 'point' && K.point && K.point.at && resp.point){
        var off = merge(G.fixedOffsets(spec), resp.shifts || {}), line = (spec.do || []).indexOf('line') > -1 ? resp.line : null;
        for(var i = 0; i < POINT_SLIP.length; i++){
          var s = POINT_SLIP[i];
          if(s[0] !== K.point.at) continue;
          var k = G.KINDS[spec.kind];
          if(!(k.points && (k.points[s[1]] || s[1] === 'market'))) continue;
          var q = G.named(spec, off, s[1], line);
          if(near(resp.point, q)) return s[2];
        }
        // The right quantity read at the wrong height (MR, MC, ATC): price from demand.
        var want = G.named(spec, off, K.point.at, line);
        if(want && Math.abs(resp.point[0] - want[0]) <= NEAR && Math.abs(resp.point[1] - want[1]) > NEAR){
          if(K.point.at === 'profit-max') return 'Right quantity, wrong height: the price is read up on the demand curve above the quantity where MR = MC.';
          if(K.point.at === 'hire') return 'Right number of workers, wrong height: the wage is read on the labor supply curve above that number.';
        }
      }
      if(task === 'shade' && K.shade === 'subsidy-cost' && resp.shade && resp.shade.length){
        // The rectangle stopped at the old quantity (8% of students).
        var A = G.areas(spec), e0 = G.eq(spec, {}), want2 = G.regionCells(spec, 'subsidy-cost');
        var leftOf = want2.filter(function(c){ var cell = A.cells.filter(function(x){ return x.id === c; })[0]; return cell && mean(cell.poly) < e0[0]; });
        if(same1(resp.shade, leftOf)) return 'That rectangle stops at the old quantity. The cost of a subsidy runs out to the new, larger quantity: shade the cells out to it too.';
      }
      if(task === 'shade' && K.shade === 'dwl' && spec.policy && spec.policy.type === 'subsidy' && resp.shade && resp.shade.length){
        var cs = G.regionCells(spec, 'subsidy-cost');
        if(resp.shade.every(function(c){ return cs.indexOf(c) > -1; }) && !resp.shade.some(function(c){ return G.regionCells(spec, 'dwl').indexOf(c) > -1; })) return 'Those cells are part of what the subsidy costs. The deadweight loss is only the triangle beyond the efficient quantity, between supply and demand, where each unit costs more than buyers value it.';
      }
    }catch(e){ /* a refinement never breaks grading */ }
    return note;
  }
  function mean(poly){ var s = 0; poly.forEach(function(p){ s += p[0]; }); return s / poly.length; }
  function same1(a, b){ a = a.slice().sort(); b = b.slice().sort(); return a.length === b.length && a.every(function(x, i){ return x === b[i]; }); }

  /* ------------------------------------------------- explore readouts */
  /* The cells of a graph and the named areas each one is part of (Explore:
     tap any area to learn what it is). */
  function cellRegions(spec, cell, off){
    var R = GR().areas(spec, off).regions;
    return Object.keys(R).filter(function(n){ return R[n].indexOf(cell) > -1; });
  }
  function status(P, A){ return P > A + 0.05 ? 'profit' : P < A - 0.05 ? 'loss' : 'even'; }
  var STATUS = { profit: 'Economic profit', loss: 'Economic loss', even: 'Breaking even' };
  /* What the picture says now, as short pills: [{ text, tone }]. */
  function readout(graph, spec, state){
    var G = GR(), sh = merge(G.fixedOffsets(spec), (state && state.shifts) || {}), out = [], cs = G.curves(spec, sh), f = function(id){ return G.find(cs, id); };
    try{
      if(graph === 'pc'){
        var L = G.lineAt(spec, { shifts: sh }), q = G.named(spec, sh, 'firm', L), mv = G.named(spec, sh, 'min-avc');
        if(q){
          if(mv && L < mv[1] - 0.05) out.push({ text: 'Below min AVC: shut down', tone: 'warn' });
          else { var st = status(L, G.y(f('ATC'), q[0])); out.push({ text: STATUS[st], tone: st === 'profit' ? 'good' : st === 'loss' ? 'warn' : 'accent' }); }
        }
      } else if(graph === 'monopoly' || graph === 'monocomp'){
        var pm = G.named(spec, sh, 'profit-max');
        if(pm){ var st2 = status(pm[1], G.y(f('ATC'), pm[0])); out.push({ text: STATUS[st2], tone: st2 === 'profit' ? 'good' : st2 === 'loss' ? 'warn' : 'accent' }); }
      } else if(graph === 'costs' && spec.set !== 'long'){
        out.push({ text: 'MC crosses AVC and ATC at their lowest points', tone: 'accent' });
      } else if(graph === 'monopsony'){
        var h = G.named(spec, sh, 'hire'), c = G.named(spec, sh, 'competitive');
        if(h && c) out.push({ text: 'Fewer workers, lower wage than competition', tone: 'accent' });
      } else if(graph === 'lorenz'){
        var s = (state && state.shifts && state.shifts.LC) || 0;
        if(s) out.push({ text: s > 0 ? 'More equal' : 'Less equal', tone: 'accent' });
      }
    }catch(e){ /* the picture still draws */ }
    return out;
  }

  /* ------------------------------------------------------------ drills */
  // Which scenarios a context and type can draw on.
  function poolOf(ctx, type, data){
    return ((data && data.scenarios) || []).filter(function(sc){
      if(sc.graph !== ctx.graph || sc.drill === false) return false;
      if(ctx.topics && ctx.topics.indexOf(sc.topic) < 0) return false;
      if(type === 'move') return !!ALONG[sc.graph] && (!!sc.along || (sc.shifts && sc.shifts.length === 1));
      if(sc.along) return false;
      if(type === 'draw') return true;
      if(type === 'shift') return !!sc.shifts;
      if(type === 'shade') return shadeOnly(sc);
      if(type === 'mark') return !sc.shifts && !!(sc.line || sc.point);
      return false;
    });
  }
  function typesOf(ctx, data){ return (ctx.types || TYPES).filter(function(t){ return poolOf(ctx, t, data).length > 0; }); }

  var LABELS = {
    labels: 'Label both axes and every curve.',
    shift: 'Shift the curve this change moves, the way it moves it.',
    equilibrium: 'Move E2 to the new market equilibrium.',
    outcome: 'Compared with E1, what is true at E2?',
    move: 'Is this a shift of a curve or a movement along one?'
  };
  var HINTS = {
    labels: 'One right name for each axis, curve and line.',
    shift: 'Drag it, or use its button and the arrow keys.',
    equilibrium: 'Where the curves cross now. Drag E2 or use its button.',
    point: 'Tap the graph, then drag or use the arrow keys.',
    line: 'Drag the line up or down, or use its button and the arrow keys.',
    shade: 'Tap each part of the area (tap again to clear), or use the area buttons.'
  };
  var LINE_ASK = {
    P: 'Draw the firm\'s demand curve, d = MR = AR = P, at the market price.',
    W: 'Draw the wage line the firm faces, at the market wage.',
    Pc: 'Draw a binding price ceiling.',
    Pf: 'Draw a binding price floor.'
  };
  function shadeAsk(sc, words){
    if(sc.ask) return fill(sc.ask, words);
    var G = GR();
    return 'Shade ' + [].concat(sc.shade).map(function(n){ return G.REGION[n] || n; }).join(' and ') + '.';
  }
  function stepOf(t, sc, w, main, shade, r){
    var G = GR(), b = baseTask(t), s = { key: t, practice: PRACTICE[b], level: b === 'labels' ? 'recall' : b === 'check' || b === 'outcome' ? 'analyze' : 'apply' };
    if(b === 'outcome'){
      var oc = outcomeChoice(r, main.kind, main.key.outcome, main.names);
      s.kind = 'choice'; s.label = LABELS.outcome; s.options = oc.options; s.keys = oc.keys; s.correct = oc.correct; s.why = oc.why;
    } else if(b === 'move'){
      var mc = moveChoice(sc, w.words);
      s.kind = 'choice'; s.label = LABELS.move; s.options = mc.options; s.keys = mc.keys; s.correct = mc.correct; s.why = mc.why; s.fixed = true;
    } else if(b === 'check'){
      var ch = sc.check[+t.split('-')[1] - 1], idx = M.shuffle(r, ch.options.map(function(o, i){ return i; }));
      s.kind = 'choice'; s.label = fill(ch.label, w.words); s.options = idx.map(function(i){ return fill(ch.options[i], w.words); });
      s.why = idx.map(function(i){ return fill(ch.why[i], w.words); }); s.correct = idx.indexOf(ch.correct || 0); s.fixed = true;
    } else {
      s.kind = 'graph'; s.task = b;
      s.spec = b === 'shade' || (b === 'labels' && !main) ? shade : main;
      if(b === 'point') s.label = 'Place point ' + (main.pointLabel || 'X') + ': ' + fill(sc.point.ask, w.words);
      else if(b === 'line') s.label = sc.line.ask ? fill(sc.line.ask, w.words) : LINE_ASK[G.lineDef(main).id] || 'Draw the line.';
      else if(b === 'shade') s.label = shadeAsk(sc, w.words);
      else if(b === 'shift' && sc.askShift) s.label = fill(sc.askShift, w.words);
      else s.label = LABELS[b];
      s.hint = HINTS[b];
    }
    return s;
  }
  function solutionOf(sc, w, tasks, main, shade){
    var G = GR(), words = w.words, sol = [], k = G.KINDS[kindOf(sc)];
    if(tasks.indexOf('labels') > -1){
      var sp = main && main.do.indexOf('label') > -1 ? main : shade, ps = G.panels(sp);
      var ax = ps.map(function(p){ return (ps.length > 1 ? p.title + ': ' : '') + 'vertical axis ' + G.labelText(p.y, sp.names) + ', horizontal axis ' + G.labelText(p.x, sp.names); }).join('; ');
      var cvs = G.labelSlots(sp).filter(function(x){ return !/^f?[xy]$/.test(x); }).map(function(c){ return G.curveName(c, sp) + ' (' + G.curveText(sp, c)[0] + G.curveText(sp, c)[1] + ')'; });
      sol.push('Labels: ' + ax + '. The curves and lines are ' + cvs.join(', ') + '.');
    }
    if(tasks.indexOf('move') > -1) sol.push(sc.along ? 'Only the price changed, so this is a movement along ' + G.curveName(sc.along) + ', not a shift.' : 'The change is not on an axis, so it shifts a whole curve: ' + G.curveName(sc.shifts[0].curve) + '.');
    if(main && main.key.shifts) sol.push('With ' + fill(sc.because, words) + ', ' + main.key.shifts.map(function(s){ return G.curveName(s.curve, main) + ' shifts ' + (s.dir === 'toward' ? 'toward equality' : s.dir === 'away' ? 'away from equality' : s.dir); }).join(' and ') + '.');
    if(tasks.indexOf('equilibrium') > -1) sol.push('E2 is where ' + k.eq.map(function(c){ return G.CURVE[c][0] + G.CURVE[c][1]; }).join(' and ') + ' cross after the shift. ' + outcomeText(main.kind, main.key.outcome));
    if(sc.line && sc.line.why) sol.push(fill(sc.line.why, words));
    if(sc.point) sol.push('Point ' + (main.pointLabel || 'X') + ': ' + fill(sc.point.why, words));
    if(sc.shade) sol.push(fill(sc.shadeWhy || '', words) || (cap(G.REGION[[].concat(sc.shade)[0]]) + '. ' + (G.REGION_HINT[[].concat(sc.shade)[0]] || '')));
    (sc.why || []).forEach(function(x){ sol.push(fill(x, words)); });
    return sol.filter(Boolean);
  }

  function generate(r, ctx, type, data){
    var types = typesOf(ctx, data);
    if(!types.length) throw new Error('graph-studio: context ' + ctx.id + ' has no scenarios');
    if(!type || types.indexOf(type) < 0) type = r.pick(types);
    var sc = r.pick(poolOf(ctx, type, data));
    var w = namesFor(sc.graph, r, data), words = w.words, tasks = tasksOf(sc, type);
    var main = type === 'move' ? (sc.along ? null : mainSpec(sc, w, ['shift'])) : mainSpec(sc, w, tasks);
    var shade = tasks.indexOf('shade') > -1 ? shadeSpec(sc, w, type === 'draw' && shadeOnly(sc)) : null;
    // A movement-along problem shows its graph only.
    var view = main || shade || (function(){ var s0 = start(sc, w); s0.do = []; return s0; })();
    var setting = fill(sc.setting || (data.settings && data.settings[sc.graph]) || '', words), cause = fill(sc.cause, words);
    var text = '<p>' + (setting ? '<b>' + esc(setting) + '</b> ' : '') + esc(cause) + '</p>';
    var steps = tasks.map(function(t){ return stepOf(t, sc, w, main, shade, r); });
    return { type: type, ctx: ctx.id, topic: sc.topic || ctx.topic, graph: sc.graph, kind: kindOf(sc), scenario: sc.id, setting: setting, cause: cause,
      text: text, spec: view, main: main, shade: shade, steps: steps, solution: solutionOf(sc, w, tasks, main, shade), words: words };
  }

  M.register('graphStudio', {
    GRAPHS: GRAPHS, KIND: KIND, SHORT: SHORT, FREE: FREE, TYPES: TYPES, PRACTICE: PRACTICE, ALONG: ALONG, POINT_SLIP: POINT_SLIP,
    fill: fill, namesFor: namesFor, tasksOf: tasksOf, mainSpec: mainSpec, shadeSpec: shadeSpec, taskSpec: taskSpec, primaryTask: primaryTask,
    freeSpec: freeSpec, keyResponse: keyResponse, shadeOnly: shadeOnly, hasEq: hasEq,
    outcomeText: outcomeText, outcomeChoice: outcomeChoice, moveChoice: moveChoice, phrase: phrase,
    refine: refine, readout: readout, cellRegions: cellRegions, poolOf: poolOf, typesOf: typesOf, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
