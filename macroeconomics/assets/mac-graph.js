/* ApMacroGraph: the economics graphs students draw, shift and label
   (docs/apmacro-architecture.md, "graph items"). One file, two halves:

   PURE (no DOM, runs in node: the generator, the content check, the grader
   in mac-grade.js and the tests load this very file)
     KINDS                     the nine graphs: ppc, sd (supply and demand),
                               adas, money (money market), reserves (reserve
                               market, ample reserves), lf (loanable funds),
                               phillips, forex (foreign exchange)
     curves(spec, offsets)     every curve of the graph after its shifts
     y(curve, x)               a curve's height at x (null off the graph)
     eq(spec, offsets)         the equilibrium [x, y] of the kind's pair, or null
     outcome(spec, offsets)    { <axis word>: 'up' | 'down' | 'same' } against the start
     keyOffsets(spec)          the key's end state, each key shift one step
     indeterminate(spec, set)  the outcome axes a set of two or more shifts
                               leaves to the sizes ([] for one shift)
     keyResponse(spec)         the response a full-credit answer gives (key shifts, E2, labels, point)
     region(spec, offsets, p)  'inside' | 'on' | 'outside' the PPC
     labelText(id, names)      an axis label as shown ("Nominal interest rate")
     labelOptions(spec, slot)  the choices a label dropdown offers (ids)
     check(spec)               problems with an authored spec (content check)
     svg(spec, state, opts)    the graph as an SVG string (build time and runtime)

   DOM (browser)
     mount(host, spec, opts) -> { get(), set(response), reset(), showKey(on), el }
       Every movable curve can be dragged (mouse, pen, touch) or focused and
       moved with the arrow keys (one step at a time; Home puts it back); the
       new equilibrium point and a placed point move with the arrows (half a
       step) or by dragging; axis and curve labels are dropdowns under the
       graph. opts.onChange(response) hears every change; opts.readonly.

   The response the grader reads (ApMacroGrade.graph):
     { shifts: { <curve id>: steps }, eq: [x, y] | null, point: [x, y] | null,
       labels: { x: <label id>, y: <label id>, <curve id>: <curve id> } }

   Coordinates are 0-10 on both axes. A curve has a shape and a position
   `at`; a shift moves `at` by whole steps: right or left for down, up,
   vertical and ppc shapes (ppc: out or in), up or down for horizontal and
   reserve-demand shapes. Lines have slope -1 or +1, so every equilibrium is
   exact. Magnitude is never graded, only which curve moved and which way,
   and where the new equilibrium sits relative to the old one. */
(function(root){
  'use strict';

  /* ------------------------------------------------------------ labels */
  var AXIS = {
    price: 'Price', quantity: 'Quantity', priceLevel: 'Price level', realGdp: 'Real GDP', nominalGdp: 'Nominal GDP',
    nominalRate: 'Nominal interest rate', realRate: 'Real interest rate', policyRate: 'Policy interest rate',
    quantityMoney: 'Quantity of money', quantityLf: 'Quantity of loanable funds', quantityReserves: 'Quantity of reserves',
    inflation: 'Inflation rate', unemployment: 'Unemployment rate'
  };
  // Currency names whose plural is the same word (the yen, not "yens").
  var SAME_PLURAL = { yen: 1, yuan: 1, won: 1, rand: 1, baht: 1, renminbi: 1, kip: 1, riel: 1 };
  function plural(w){ return /s$/.test(w) || SAME_PLURAL[String(w).toLowerCase()] ? w : w + 's'; }
  function labelText(id, names){
    names = names || {};
    var cur = names.currency || 'euro', other = names.other || 'dollar';
    if(id === 'fxPrice') return 'Price of the ' + cur + ' (' + plural(other) + ' per ' + cur + ')';
    if(id === 'fxPriceFlipped') return 'Price of the ' + cur + ' (' + plural(cur) + ' per ' + other + ')';
    if(id === 'fxQuantity') return 'Quantity of ' + plural(cur);
    if(id === 'goodX') return names.x || 'Good A';
    if(id === 'goodY') return names.y || 'Good B';
    return AXIS[id] || id;
  }
  // Curve ids, their short label (main, subscript) and the name used in feedback.
  var CURVE = {
    D: ['D', '', 'demand'], S: ['S', '', 'supply'], AD: ['AD', '', 'aggregate demand'], SRAS: ['SRAS', '', 'short-run aggregate supply'],
    LRAS: ['LRAS', '', 'long-run aggregate supply'], MD: ['MD', '', 'money demand'], MS: ['MS', '', 'money supply'],
    DLF: ['D', 'LF', 'the demand for loanable funds'], SLF: ['S', 'LF', 'the supply of loanable funds'],
    RD: ['D', 'R', 'the demand for reserves'], RS: ['S', 'R', 'the supply of reserves'],
    SRPC: ['SRPC', '', 'the short-run Phillips curve'], LRPC: ['LRPC', '', 'the long-run Phillips curve'], PPC: ['PPC', '', 'the production possibilities curve']
  };
  function curveName(id){ return (CURVE[id] || [id, '', id])[2]; }
  function curveShort(id){ var c = CURVE[id] || [id, '']; return c[0] + c[1]; }

  /* ------------------------------------------------------------- kinds */
  // out: the words the outcome uses for the x and the y of the equilibrium.
  // confuse: the wrong labels a dropdown offers beside the right one (the
  // slips readers report: nominal for real, a flipped exchange rate, the
  // price of one good for the price level).
  var KINDS = {
    ppc: { title: 'Production possibilities curve', x: 'goodX', y: 'goodY', curves: [{ id: 'PPC', shape: 'ppc', at: 7 }], eq: null, out: null,
      confuse: { x: ['goodY', 'quantity', 'price'], y: ['goodX', 'price', 'quantity'] }, curveConfuse: ['LRAS', 'D'] },
    sd: { title: 'Supply and demand', x: 'quantity', y: 'price', curves: [{ id: 'D', shape: 'down', at: 5 }, { id: 'S', shape: 'up', at: 5 }], eq: ['D', 'S'], out: { x: 'quantity', y: 'price' },
      confuse: { x: ['realGdp', 'quantityMoney', 'price'], y: ['priceLevel', 'quantity', 'nominalRate'] }, curveConfuse: ['AD', 'SRAS'] },
    adas: { title: 'Aggregate demand and aggregate supply', x: 'realGdp', y: 'priceLevel',
      curves: [{ id: 'AD', shape: 'down', at: 5 }, { id: 'SRAS', shape: 'up', at: 5 }, { id: 'LRAS', shape: 'vertical', at: 5 }], eq: ['AD', 'SRAS'], out: { x: 'output', y: 'price level' },
      confuse: { x: ['quantity', 'nominalGdp', 'unemployment'], y: ['price', 'inflation', 'nominalRate'] }, curveConfuse: ['D', 'S'] },
    money: { title: 'Money market', x: 'quantityMoney', y: 'nominalRate', curves: [{ id: 'MD', shape: 'down', at: 5 }, { id: 'MS', shape: 'vertical', at: 5 }], eq: ['MD', 'MS'], out: { x: 'quantity of money', y: 'nominal interest rate' },
      confuse: { x: ['quantityLf', 'quantityReserves', 'realGdp'], y: ['realRate', 'price', 'inflation'] }, curveConfuse: ['DLF', 'SLF'] },
    reserves: { title: 'Market for bank reserves (ample reserves)', x: 'quantityReserves', y: 'policyRate', curves: [{ id: 'RD', shape: 'rdemand', at: 3 }, { id: 'RS', shape: 'vertical', at: 7 }], eq: ['RD', 'RS'], out: { x: 'quantity of reserves', y: 'policy rate' },
      confuse: { x: ['quantityMoney', 'quantityLf', 'realGdp'], y: ['realRate', 'price', 'inflation'] }, curveConfuse: ['MD', 'MS'] },
    lf: { title: 'Loanable funds market', x: 'quantityLf', y: 'realRate', curves: [{ id: 'DLF', shape: 'down', at: 5 }, { id: 'SLF', shape: 'up', at: 5 }], eq: ['DLF', 'SLF'], out: { x: 'quantity of loanable funds', y: 'real interest rate' },
      confuse: { x: ['quantityMoney', 'realGdp', 'quantity'], y: ['nominalRate', 'priceLevel', 'policyRate'] }, curveConfuse: ['MD', 'MS'] },
    phillips: { title: 'Phillips curves', x: 'unemployment', y: 'inflation', curves: [{ id: 'SRPC', shape: 'down', at: 5 }, { id: 'LRPC', shape: 'vertical', at: 5 }], eq: ['SRPC', 'LRPC'], out: { x: 'unemployment rate', y: 'inflation rate' },
      confuse: { x: ['realGdp', 'quantity', 'inflation'], y: ['priceLevel', 'nominalRate', 'unemployment'] }, curveConfuse: ['AD', 'SRAS'] },
    forex: { title: 'Foreign exchange market', x: 'fxQuantity', y: 'fxPrice', curves: [{ id: 'D', shape: 'down', at: 5 }, { id: 'S', shape: 'up', at: 5 }], eq: ['D', 'S'], out: { x: 'quantity of the currency', y: 'value of the currency' },
      confuse: { x: ['quantity', 'quantityMoney', 'realGdp'], y: ['fxPriceFlipped', 'price', 'realRate'] }, curveConfuse: ['AD', 'MS'] }
  };
  var TASKS = ['label', 'shift', 'equilibrium', 'point'];
  var VERTICAL_SHIFT = { horizontal: 1, rdemand: 1 };
  var MAX_STEPS = 3;
  function kindOf(spec){ var k = KINDS[spec && spec.kind]; if(!k) throw new Error('ApMacroGraph: unknown graph kind "' + (spec && spec.kind) + '" (one of ' + Object.keys(KINDS).join(', ') + ')'); return k; }
  function axisOf(shape){ return VERTICAL_SHIFT[shape] ? 'y' : 'x'; }
  // A straight-line PPC (spec.linear, constant opportunity cost) has shape
  // 'ppcline'; both PPC shapes shift out or in.
  function isPpc(shape){ return shape === 'ppc' || shape === 'ppcline'; }
  function dirWord(shape, steps){
    if(!steps) return 'none';
    if(isPpc(shape)) return steps > 0 ? 'out' : 'in';
    if(VERTICAL_SHIFT[shape]) return steps > 0 ? 'up' : 'down';
    return steps > 0 ? 'right' : 'left';
  }
  function dirSign(shape, dir){
    var plus = isPpc(shape) ? 'out' : VERTICAL_SHIFT[shape] ? 'up' : 'right', minus = isPpc(shape) ? 'in' : VERTICAL_SHIFT[shape] ? 'down' : 'left';
    return dir === plus ? 1 : dir === minus ? -1 : 0;
  }

  /* ---------------------------------------------------------- geometry */
  /* A straight PPC's intercepts as shares of `at`: spec.ends { x, y } (the
     most of each good, in the problem's own units) sets the ratio, the
     larger one reaching `at`; without ends both reach `at`. */
  function lineShares(spec){
    var e = spec.ends, x = e && +e.x > 0 ? +e.x : 1, y = e && +e.y > 0 ? +e.y : 1, m = Math.max(x, y);
    return [x / m, y / m];
  }
  function curves(spec, offsets){
    var k = kindOf(spec), start = spec.start || {}, off = offsets || {}, line = spec.kind === 'ppc' && spec.linear, sh = line ? lineShares(spec) : null;
    return k.curves.map(function(c){
      var o = { id: c.id, shape: c.shape, at: c.at + (start[c.id] || 0) + (off[c.id] || 0), base: c.at + (start[c.id] || 0), steps: off[c.id] || 0 };
      if(line && c.shape === 'ppc'){ o.shape = 'ppcline'; o.kx = sh[0]; o.ky = sh[1]; }
      return o;
    });
  }
  function find(list, id){ for(var i = 0; i < list.length; i++) if(list[i].id === id) return list[i]; return null; }
  function y(c, x){
    var v;
    if(c.shape === 'down') v = 5 - (x - c.at);
    else if(c.shape === 'up') v = 5 + (x - c.at);
    else if(c.shape === 'horizontal') v = c.at;
    else if(c.shape === 'rdemand') v = x < 4 ? c.at + (4 - x) * 1.5 : c.at;
    else if(c.shape === 'ppc'){ if(x < 0 || x > c.at) return null; v = Math.sqrt(c.at * c.at - x * x); }
    else if(c.shape === 'ppcline'){ var X = c.at * c.kx; if(x < 0 || x > X + 1e-9) return null; v = c.at * c.ky * (1 - x / X); }
    else return null;   // vertical: no height function
    return v;
  }
  function inBox(p){ return p[0] >= -1e-9 && p[0] <= 10 + 1e-9 && p[1] >= -1e-9 && p[1] <= 10 + 1e-9; }
  function cross(a, b){
    if(a.shape === 'vertical' && b.shape === 'vertical') return null;
    if(a.shape === 'vertical' || b.shape === 'vertical'){ var v = a.shape === 'vertical' ? a : b, o = v === a ? b : a, h = y(o, v.at); return h == null ? null : [v.at, h]; }
    if(a.shape === 'down' && b.shape === 'up') return [(a.at + b.at) / 2, 5 + (a.at - b.at) / 2];
    if(a.shape === 'up' && b.shape === 'down') return cross(b, a);
    // Monotone curves otherwise: bisection on the gap.
    var f = function(x){ return y(a, x) - y(b, x); }, lo = 0, hi = 10;
    if(f(lo) * f(hi) > 0) return null;
    for(var i = 0; i < 60; i++){ var m = (lo + hi) / 2; if(f(lo) * f(m) <= 0) hi = m; else lo = m; }
    return [(lo + hi) / 2, y(a, (lo + hi) / 2)];
  }
  function r6(v){ return Math.round(v * 1e6) / 1e6; }
  function eq(spec, offsets){
    var k = kindOf(spec);
    if(!k.eq) return null;
    var cs = curves(spec, offsets), p = cross(find(cs, k.eq[0]), find(cs, k.eq[1]));
    return p && inBox(p) ? [r6(p[0]), r6(p[1])] : null;
  }
  function cmp(a, b){ return Math.abs(a - b) < 1e-6 ? 'same' : a > b ? 'up' : 'down'; }
  function outcome(spec, offsets){
    var k = kindOf(spec);
    if(!k.out) return null;
    var e0 = eq(spec, {}), e1 = eq(spec, offsets);
    if(!e0 || !e1) return null;
    var o = {}; o[k.out.x] = cmp(e1[0], e0[0]); o[k.out.y] = cmp(e1[1], e0[1]);
    return o;
  }
  /* The outcome axes two or more shifts leave to their sizes: the answers
     at a half or a whole step each disagree. set: [{ curve, dir }] or
     { curve: steps }. */
  function indeterminate(spec, set){
    var k = kindOf(spec), cs = curves(spec, {}), sign = {};
    if(!k.out || !set) return [];
    if(Array.isArray(set)) set.forEach(function(s){ var c = find(cs, s.curve); if(c && dirSign(c.shape, s.dir)) sign[s.curve] = dirSign(c.shape, s.dir); });
    else Object.keys(set).forEach(function(c){ if(set[c]) sign[c] = set[c] > 0 ? 1 : -1; });
    var ids = Object.keys(sign);
    if(ids.length < 2) return [];
    var seen = {}, n = Math.pow(2, ids.length);
    for(var m = 0; m < n; m++){
      var off = {};
      ids.forEach(function(c, i){ off[c] = sign[c] * ((m >> i) & 1 ? 0.5 : 1); });
      var o = outcome(spec, off);
      if(!o) continue;
      Object.keys(o).forEach(function(w){ (seen[w] = seen[w] || {})[o[w]] = 1; });
    }
    return Object.keys(seen).filter(function(w){ return Object.keys(seen[w]).length > 1; });
  }
  function keyOffsets(spec){
    var off = {}, cs = curves(spec, {}), key = (spec && spec.key) || {};
    (key.shifts || []).forEach(function(s){ var c = find(cs, s.curve); if(c) off[s.curve] = (off[s.curve] || 0) + dirSign(c.shape, s.dir); });
    return off;
  }
  /* The response a full-credit answer gives (the key drawn as a student
     would): the key's shifts, E2 where the shifted curves cross, every
     label right, and the point the key asks for. Used to check that a key
     grades right (tool validators) and to show the key as the student's
     own graph after a miss (the AD-AS and forex labs). */
  function keyResponse(spec){
    var k = kindOf(spec), does = spec.do || [], key = spec.key || {}, off = keyOffsets(spec), labels = {};
    if(does.indexOf('label') > -1) labelSlots(spec).forEach(function(s){ labels[s] = s === 'x' || s === 'y' ? k[s] : s; });
    var r = { shifts: off, eq: does.indexOf('equilibrium') > -1 ? eq(spec, off) : null, point: null, labels: labels };
    var P = key.point;
    if(does.indexOf('point') > -1 && P){
      if(P.region){ var c = find(curves(spec, {}), 'PPC'), ax = c.shape === 'ppcline' ? c.at * c.kx / 2 : c.at / Math.SQRT2, ay = c.shape === 'ppcline' ? c.at * c.ky / 2 : c.at / Math.SQRT2;
        r.point = P.region === 'on' ? [r6(ax), r6(ay)] : P.region === 'inside' ? [r6(ax / 2), r6(ay / 2)] : [Math.min(10, r6(ax + 1.5)), Math.min(10, r6(ay + 1.5))]; }
      else if(P.on){ var e0 = eq(spec, {}) || [5, 5], dx = P.x === 'up' ? 1 : P.x === 'down' ? -1 : 0, cv = find(curves(spec, {}), P.on);
        r.point = cv.shape === 'vertical' ? [cv.at, e0[1] + (P.y === 'up' ? 1 : P.y === 'down' ? -1 : 0)] : [e0[0] + dx, y(cv, e0[0] + dx)]; }
      else { var e1 = eq(spec, {}) || [5, 5]; r.point = [e1[0] + (P.x === 'up' ? 1 : P.x === 'down' ? -1 : 0), e1[1] + (P.y === 'up' ? 1 : P.y === 'down' ? -1 : 0)]; }
    }
    return r;
  }
  function region(spec, offsets, p){
    var c = find(curves(spec, offsets), 'PPC');
    if(!c || !p) return null;
    if(c.shape === 'ppcline'){
      // Signed distance from the line x / X + y / Y = 1 (negative inside).
      var X = c.at * c.kx, Y = c.at * c.ky, dl = (p[0] / X + p[1] / Y - 1) * X * Y / Math.hypot(X, Y);
      return Math.abs(dl) <= 0.4 ? 'on' : dl < 0 ? 'inside' : 'outside';
    }
    var d = Math.sqrt(p[0] * p[0] + p[1] * p[1]);
    return Math.abs(d - c.at) <= 0.4 ? 'on' : d < c.at ? 'inside' : 'outside';
  }
  function distTo(c, p){
    if(c.shape === 'vertical') return Math.abs(p[0] - c.at);
    var best = Infinity;
    for(var x = 0; x <= 10 + 1e-9; x += 0.02){ var h = y(c, x); if(h == null) continue; var d = Math.hypot(p[0] - x, p[1] - h); if(d < best) best = d; }
    return best;
  }

  /* ------------------------------------------------------------- labels */
  function labelOptions(spec, slot){
    var k = kindOf(spec);
    if(slot === 'x' || slot === 'y') return [k[slot]].concat(k.confuse[slot]);
    var ids = k.curves.map(function(c){ return c.id; });
    return ids.concat(k.curveConfuse.filter(function(c){ return ids.indexOf(c) < 0; }));
  }
  function labelSlots(spec){ return ['x', 'y'].concat(kindOf(spec).curves.map(function(c){ return c.id; })); }
  function optionText(spec, slot, id){
    if(slot === 'x' || slot === 'y') return labelText(id, spec.names);
    var c = CURVE[id] || [id, ''];
    return c[0] + (c[1] ? ' (' + c[1] + ')' : '') + ': ' + c[2];
  }

  /* ------------------------------------------------------- the checker */
  var DIRS = ['up', 'down', 'same'];
  function check(spec){
    var out = [], bad = function(m){ out.push(m); };
    if(!spec || typeof spec !== 'object') return ['graph: needs a graph object'];
    var k = KINDS[spec.kind];
    if(!k) return ['graph.kind must be one of ' + Object.keys(KINDS).join(', ')];
    var does = spec.do || [];
    if(!Array.isArray(does) || !does.length) bad('graph.do lists the tasks: ' + TASKS.join(', '));
    does.forEach(function(t){ if(TASKS.indexOf(t) < 0) bad('graph.do: unknown task "' + t + '"'); });
    if(does.indexOf('point') > -1 && does.indexOf('shift') > -1) bad('graph.do: "point" and "shift" are separate items');
    if(does.indexOf('equilibrium') > -1 && does.indexOf('shift') < 0) bad('graph.do: "equilibrium" marks the new equilibrium after a shift, so it needs "shift"');
    if(does.indexOf('equilibrium') > -1 && !k.eq) bad('graph.do: a ' + spec.kind + ' graph has no equilibrium');
    var ids = k.curves.map(function(c){ return c.id; });
    Object.keys(spec.start || {}).forEach(function(c){ if(ids.indexOf(c) < 0) bad('graph.start: unknown curve "' + c + '" (a ' + spec.kind + ' graph has ' + ids.join(', ') + ')'); else if(!Number.isInteger(spec.start[c]) || Math.abs(spec.start[c]) > 2) bad('graph.start.' + c + ' is a whole number of steps from -2 to 2'); });
    if(spec.kind === 'ppc' && (!spec.names || !spec.names.x || !spec.names.y)) bad('graph.names.x and .y name the two goods of a PPC');
    if(spec.linear !== undefined && (spec.kind !== 'ppc' || typeof spec.linear !== 'boolean')) bad('graph.linear (true: a straight-line PPC, constant opportunity cost) is for a ppc graph');
    if(spec.ends !== undefined && (!spec.linear || !(+spec.ends.x > 0) || !(+spec.ends.y > 0))) bad('graph.ends { x, y } gives a straight PPC\'s intercepts (the most of each good, both positive) and needs linear: true');
    if(spec.kind === 'forex' && (!spec.names || !spec.names.currency || !spec.names.other)) bad('graph.names.currency and .other name the two currencies (the market is for the currency)');
    var key = spec.key || {};
    if(does.indexOf('shift') > -1){
      if(!Array.isArray(key.shifts) || !key.shifts.length) bad('graph.key.shifts lists each curve that moves and its direction');
      var seen = {};
      (key.shifts || []).forEach(function(s, i){
        var c = find(curves(spec, {}), s.curve);
        if(!c){ bad('graph.key.shifts[' + i + ']: unknown curve "' + s.curve + '"'); return; }
        if(seen[s.curve]) bad('graph.key.shifts: ' + s.curve + ' is listed twice'); seen[s.curve] = 1;
        if(!dirSign(c.shape, s.dir)) bad('graph.key.shifts[' + i + ']: ' + s.curve + ' shifts ' + (isPpc(c.shape) ? 'out or in' : VERTICAL_SHIFT[c.shape] ? 'up or down' : 'right or left') + ', not "' + s.dir + '"');
        var at = c.at + dirSign(c.shape, s.dir);
        if(at < 1 || at > 9) bad('graph.key.shifts[' + i + ']: the shifted ' + s.curve + ' leaves the graph; move graph.start');
      });
      if(!key.because || String(key.because).length < 8) bad('graph.key.because names the cause in a few words ("a rise in input costs"), for the slip feedback');
      // key.alt: other accepted shift sets (ApMacroGrade.graph keeps the best).
      (key.alt || []).forEach(function(set, j){
        if(!Array.isArray(set) || !set.length){ bad('graph.key.alt[' + j + '] is a list of { curve, dir } shifts'); return; }
        set.forEach(function(s){ var c = find(curves(spec, {}), s.curve); if(!c || !dirSign(c.shape, s.dir)) bad('graph.key.alt[' + j + ']: ' + s.curve + ' ' + s.dir + ' is not a shift of this graph'); });
      });
    }
    if(key.outcome){
      if(!k.out) bad('graph.key.outcome: a ' + spec.kind + ' graph has no equilibrium');
      else {
        var got = outcome(spec, keyOffsets(spec)) || {}, indet = indeterminate(spec, key.shifts), hold = key.hold || [];
        Object.keys(key.outcome).forEach(function(w){
          if(!(w in got)) bad('graph.key.outcome: "' + w + '" is not an axis of this graph (' + k.out.x + ', ' + k.out.y + ')');
          else if(DIRS.indexOf(key.outcome[w]) < 0) bad('graph.key.outcome.' + w + ' is up, down or same');
          else if(indet.indexOf(w) > -1 && !(hold.indexOf(w) > -1 && key.outcome[w] === 'same')) bad('graph.key.outcome.' + w + ': with these shifts the ' + w + ' depends on their sizes, so leave it out of the key and ask about it in words' + (key.outcome[w] === 'same' ? ' (a long-run story that ends where it started on this axis lists it in key.hold)' : ''));
          else if(got[w] !== key.outcome[w]) bad('graph.key.outcome.' + w + ' is "' + key.outcome[w] + '" but the key shifts give "' + got[w] + '"' + ((key.shifts || []).length > 1 ? ' (with equal shifts; an outcome that depends on the sizes is left out)' : ''));
        });
      }
    }
    if(key.hold !== undefined){
      if(!Array.isArray(key.hold) || !key.hold.every(function(w){ return key.outcome && key.outcome[w] === 'same'; })) bad('graph.key.hold lists outcome words the key gives as "same" (the long run returns to where it started on that axis)');
    }
    if(does.indexOf('equilibrium') > -1 && !eq(spec, keyOffsets(spec))) bad('graph: the key shifts leave no equilibrium on the graph');
    if(does.indexOf('point') > -1){
      var P = key.point || {};
      if(!P.region && !P.on) bad('graph.key.point needs region (inside, on, outside a PPC) or on (a curve id)');
      if(P.region && (spec.kind !== 'ppc' || ['inside', 'on', 'outside'].indexOf(P.region) < 0)) bad('graph.key.point.region is inside, on or outside, on a ppc graph');
      if(P.on && ids.indexOf(P.on) < 0) bad('graph.key.point.on: unknown curve "' + P.on + '"');
      ['x', 'y'].forEach(function(a){ if(P[a] !== undefined && ['up', 'down'].indexOf(P[a]) < 0) bad('graph.key.point.' + a + ' is up or down (from the starting equilibrium)'); });
      if((P.x || P.y) && !k.eq) bad('graph.key.point.x and .y are measured from the equilibrium; a ' + spec.kind + ' graph has none');
    }
    Object.keys(spec.slips || {}).forEach(function(c){ if(ids.indexOf(c) < 0) bad('graph.slips: unknown curve "' + c + '"'); else if(String(spec.slips[c]).length < 15) bad('graph.slips.' + c + ' explains the slip in a sentence'); });
    (spec.movable || []).forEach(function(c){ if(ids.indexOf(c) < 0) bad('graph.movable: unknown curve "' + c + '"'); });
    (key.shifts || []).forEach(function(s){ if(spec.movable && spec.movable.indexOf(s.curve) < 0) bad('graph.movable leaves out ' + s.curve + ', which the key shifts'); });
    return out;
  }

  /* -------------------------------------------------------------- SVG */
  var W = 320, H = 300, L = 50, T = 14, PW = 250, PH = 226;
  function px(x){ return L + x / 10 * PW; }
  function py(v){ return T + (10 - v) / 10 * PH; }
  function f1(v){ return Math.round(v * 10) / 10; }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function pathOf(c){
    if(c.shape === 'vertical') return 'M' + f1(px(c.at)) + ' ' + f1(py(10)) + 'V' + f1(py(0));
    if(c.shape === 'ppcline') return 'M' + f1(px(0)) + ' ' + f1(py(Math.min(10, c.at * c.ky))) + 'L' + f1(px(Math.min(10, c.at * c.kx))) + ' ' + f1(py(0));
    var pts = [];
    for(var x = 0; x <= 10 + 1e-9; x += 0.05){ var h = y(c, x); if(h != null && h >= -1e-9 && h <= 10 + 1e-9) pts.push(f1(px(x)) + ' ' + f1(py(h))); }
    if(c.shape === 'ppc' && pts.length) pts.push(f1(px(c.at)) + ' ' + f1(py(0)));
    return pts.length ? 'M' + pts.join('L') : '';
  }
  /* Where a curve's label sits, and its anchor. Lines have slope -1 or +1,
     so labels read at one x (8.6) sit a whole step apart in height when a
     curve shifts a step: D1 and D2, SRAS1 and SRAS2 never touch, and none
     sits on the x axis (the Phase 0 note: D1 and D2 crowded the corner).
     Down curves: right of the line, low; up curves: left of (above) the
     line, high; vertical curves: right of the line at the top, the old and
     new one staggered; the PPC: just outside the curve at 45 degrees. */
  var LX = 8.6;
  /* away: where the old curve of a shift smaller than a step is labeled
     (an animated or partly dragged shift), so SRAS1 and SRAS2 do not sit
     on top of each other: down curves high on the left, up curves low on
     the left, vertical curves at the foot. */
  function labelAway(c){
    if(c.shape === 'down'){ var x = 1.8, yv = 5 - (x - c.at); if(yv > 9.4){ yv = 9.4; x = c.at - 4.4; } return [px(Math.max(0.3, x)) + 6, py(yv) + 3, 'start']; }
    if(c.shape === 'up'){ var x2 = 3.2, y2 = 5 + (x2 - c.at); if(y2 < 0.6){ y2 = 0.6; x2 = c.at - 4.4; } return [px(Math.max(0.3, x2)) - 7, py(y2) - 3, 'end']; }
    if(c.shape === 'vertical') return [px(c.at) - 5, py(0.6), 'end'];
    return labelAt(c, true);
  }
  function labelAt(c, inside){
    if(c.shape === 'vertical') return [px(c.at) + 5, py(9.6) + 6 + (Math.round(c.at) % 2 ? 0 : 15), 'start'];
    if(c.shape === 'down'){ var x2 = LX, y2 = 5 - (x2 - c.at); if(y2 < 0.5){ y2 = 0.5; x2 = c.at + 4.5; } return [px(x2) + 6, py(y2) + 3, 'start']; }
    if(c.shape === 'up'){ var x1 = LX, y1 = 5 + (x1 - c.at); if(y1 > 9.6){ y1 = 9.6; x1 = c.at + 4.6; } return [px(x1) - 7, py(y1) - 3, 'end']; }
    if(c.shape === 'ppc'){ var r = (c.at + 0.45) / Math.SQRT2; return [px(r) + 2, py(r) - 2, 'start']; }
    // A straight PPC: outside the line at its middle; the old line of a shift
    // (inside) is labeled inside it, further along, so PPC1 and PPC2 never touch.
    if(c.shape === 'ppcline'){ var X = c.at * c.kx, Y = c.at * c.ky, n = Math.hypot(X, Y);
      if(inside) return [px(X * 0.64 - 0.5 * Y / n) - 2, py(Y * 0.36 - 0.5 * X / n) + 4, 'end'];
      return [px(X / 2 + 0.45 * Y / n) + 2, py(Y / 2 + 0.45 * X / n) - 2, 'start']; }
    return [px(9.6), py(c.at) - 6, 'end'];
  }
  /* A whole-step shift labels the pair on their outer sides (the right one
     as labelAt, the left one left of its line; an old vertical at its
     foot), never between them. Returns [new, old]. */
  function pairLabels(c, b){
    var right = c.at > b.at, nw = labelAt(c), od = labelAt(b);
    if(c.shape === 'up'){
      var lo = function(q){ var x = Math.min(q.at + 1.6, 8.2), yv = 5 + (x - q.at); return [px(x) + 8, py(yv) + 12, 'start']; };
      if(right) nw = lo(c); else od = lo(b);
    } else if(c.shape === 'down'){
      var ll = function(q){ var x = q.at + 3.4, yv = 5 - (x - q.at); return [px(x) - 6, py(yv) + 14, 'end']; };
      if(right) od = ll(b); else nw = ll(c);
    } else if(c.shape === 'vertical'){
      nw = right ? [px(c.at) + 5, py(9.6) + 1, 'start'] : [px(c.at) - 5, py(9.6) + 1, 'end'];
      od = right ? [px(b.at) - 5, py(0.6), 'end'] : [px(b.at) + 5, py(0.6), 'start'];
    }
    return [nw, od];
  }
  function curveLabel(id, n, at, cls){
    var c = CURVE[id] || [id, ''], sub = c[1] + (n ? n : '');
    return '<text class="mac-gr-clabel ' + (cls || '') + '" x="' + f1(at[0]) + '" y="' + f1(at[1]) + '" text-anchor="' + (at[2] || 'end') + '">' + esc(c[0]) + (sub ? '<tspan class="mac-gr-sub" dy="3">' + esc(sub) + '</tspan>' : '') + '</text>';
  }
  /* The arrow that shows a shift's direction (authoring guide: "a shift
     shows its direction with an arrow"), drawn between the old and the new
     curve away from the equilibrium. */
  function arrowOf(b, c){
    var d = c.at - b.at;
    if(Math.abs(d) < 0.15) return '';
    var x0, y0, x1, y1;
    if(c.shape === 'vertical'){ y0 = y1 = 7.4; x0 = b.at; x1 = c.at; }   // below the staggered labels at the top
    else if(c.shape === 'down'){ y0 = y1 = 7.6; x0 = b.at - 2.6; x1 = c.at - 2.6; }
    else if(c.shape === 'up'){ y0 = y1 = 2.4; x0 = b.at - 2.6; x1 = c.at - 2.6; }
    else if(c.shape === 'ppcline'){ var cs = Math.cos(Math.PI / 3), sn = Math.sin(Math.PI / 3), rb = 1 / (cs / (b.at * b.kx) + sn / (b.at * b.ky)), rc = 1 / (cs / (c.at * c.kx) + sn / (c.at * c.ky)); x0 = rb * cs; y0 = rb * sn; x1 = rc * cs; y1 = rc * sn; }
    else if(c.shape === 'ppc'){ var k = Math.cos(Math.PI / 3); x0 = b.at * k; y0 = b.at * Math.sin(Math.PI / 3); x1 = c.at * k; y1 = c.at * Math.sin(Math.PI / 3); }
    else { x0 = x1 = 5.6; y0 = b.at; y1 = c.at; }   // the flat part of reserve demand: clear of E1, E2 and the DR labels
    if(x0 < 0.3 || x1 < 0.3 || y0 < 0 || y1 > 10) return '';
    var X0 = px(x0), Y0 = py(y0), X1 = px(x1), Y1 = py(y1), L2 = Math.hypot(X1 - X0, Y1 - Y0), ux = (X1 - X0) / L2, uy = (Y1 - Y0) / L2;
    // stop short of both curves, with a head at the new one
    var a = [X0 + ux * 4, Y0 + uy * 4], e = [X1 - ux * 4, Y1 - uy * 4], h = 6;
    return '<path class="mac-gr-arrow" d="M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(e[0]) + ' ' + f1(e[1]) + 'M' + f1(e[0] - ux * h - uy * h * 0.6) + ' ' + f1(e[1] - uy * h + ux * h * 0.6) + 'L' + f1(e[0]) + ' ' + f1(e[1]) + 'L' + f1(e[0] - ux * h + uy * h * 0.6) + ' ' + f1(e[1] - uy * h - ux * h * 0.6) + '"/>';
  }
  /* The value marks on the axes at E1 and E2 (P1, P2; Q1, Q2), as readers
     ask for them; left out while the axes are still to be labeled, since
     they would give the labels away. */
  var MARK = { sd: ['Q', 'P'], adas: ['Y', 'PL'], money: ['M', 'i'], reserves: ['R', 'i'], lf: ['Q', 'r'], phillips: ['u', '\u03c0'], forex: ['Q', 'XR'] };
  // other: the other equilibrium's point, so two marks less than a step
  // apart on an axis sit on either side instead of on top of each other.
  // own: { x, y } subscripts that replace n on one axis (E1 on LRAS is YF,
  // on LRPC uN). keep: print a mark the other point shares (the same
  // output at E1 and E3) once, here, instead of leaving it out.
  function marks(kind, p, n, cls, other, own, keep){
    var m = MARK[kind];
    if(!m || !p) return '';
    own = own || {};
    var sub = function(t, a){ var k = own[a] != null ? own[a] : n; return esc(t) + (k ? '<tspan class="mac-gr-sub" dy="3">' + esc(k) + '</tspan>' : ''); };
    var out = '';
    if(!other || Math.abs(other[0] - p[0]) > 1e-6 || keep){
      var close = other && Math.abs(other[0] - p[0]) < 1 && Math.abs(other[0] - p[0]) > 1e-6, anc = close ? (p[0] < other[0] ? 'end' : 'start') : 'middle', dx = close ? (p[0] < other[0] ? 2 : -2) : 0;
      out += '<text class="mac-gr-mark ' + (cls || '') + '" x="' + f1(px(p[0]) + dx) + '" y="' + (T + PH + 13) + '" text-anchor="' + anc + '">' + sub(m[0], 'x') + '</text>';
    }
    if(!other || Math.abs(other[1] - p[1]) > 1e-6 || keep){
      var closeY = other && Math.abs(other[1] - p[1]) < 0.7 && Math.abs(other[1] - p[1]) > 1e-6, dy = closeY ? (p[1] < other[1] ? 5 : -2) : 4;
      out += '<text class="mac-gr-mark ' + (cls || '') + '" x="' + (L - 4) + '" y="' + f1(py(p[1]) + dy) + '" text-anchor="end">' + sub(m[1], 'y') + '</text>';
    }
    return out;
  }
  function eName(n){ return 'E' + (n ? '<tspan class="mac-gr-sub" dy="3">' + esc(n) + '</tspan>' : ''); }
  function guides(p, cls){
    return '<path class="mac-gr-guide ' + (cls || '') + '" d="M' + f1(px(0)) + ' ' + f1(py(p[1])) + 'H' + f1(px(p[0])) + 'V' + f1(py(0)) + '"/>';
  }
  /* state: { shifts, eq, point, labels, key: bool (draw the key's end curves),
     focus: curve id, n0, n1, curveN, marks0 }. n0 and n1 name the start and
     the current point (default 1 and 2: E1 and E2, P1 and P2); a long-run
     story passes n1 '3' for E3, PL3 and Y3. Curves are D1 and D2 (n0 and
     curveN, default 2) whatever the point is called. marks0 gives the
     start's axis marks their own subscripts ({ x: 'F' }: YF on an AD-AS
     graph, { x: 'N' }: uN on the Phillips curves). opts.label: accessible name. */
  function svg(spec, state, opts){
    state = state || {}; opts = opts || {};
    var n0 = state.n0 != null ? String(state.n0) : '1', n1 = state.n1 != null ? String(state.n1) : '2';
    var k = kindOf(spec), shifts = state.shifts || {}, labels = state.labels || {}, does = spec.do || [];
    var askLabels = does.indexOf('label') > -1 && !state.labelsShown;
    var nm = function(slot){ if(askLabels && !labels[slot]) return '?'; return labelText(labels[slot] || k[slot], spec.names); };
    var g = [];
    g.push('<rect class="mac-gr-hit" x="' + L + '" y="' + T + '" width="' + PW + '" height="' + PH + '"/>');
    g.push('<path class="mac-gr-axis" d="M' + L + ' ' + T + 'V' + (T + PH) + 'H' + (L + PW) + '"/>');
    // The axis titles sit clear of the value marks (P1, Q1) beside the axes.
    g.push('<text class="mac-gr-alabel" x="' + (L + PW) + '" y="' + (T + PH + 31) + '" text-anchor="end">' + esc(nm('x')) + '</text>');
    g.push('<text class="mac-gr-alabel" transform="translate(' + (L - 34) + ' ' + T + ') rotate(-90)" text-anchor="end">' + esc(nm('y')) + '</text>');
    var base = curves(spec, {}), now = curves(spec, shifts);
    var e0 = eq(spec, {});
    // Curve labels: the current curves first, then the starting curves of a
    // shift, then the key's; a label that would overlap one already placed
    // (SRAS2 under LRAS at the top, two labels of a small shift) moves down
    // or up a line. The curves keep their own subscripts (AD2, SRAS2) even
    // when the point is E3 (state.n1).
    var placed = [], cn = state.curveN != null ? String(state.curveN) : '2';
    function box(id, n, at){ var c = CURVE[id] || [id, ''], w = String(c[0]).length * 7.8 + String(c[1] + (n || '')).length * 5.4, x0 = at[2] === 'end' ? at[0] - w : at[2] === 'middle' ? at[0] - w / 2 : at[0]; return [x0, at[1] - 11, x0 + w, at[1] + 4]; }
    function hit(a, b){ return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]; }
    // The current curves as points, so a label is not drawn across another curve's line.
    var lines = now.map(function(c){ var pts = []; if(c.shape === 'vertical'){ for(var v = 0; v <= 10; v += 0.25) pts.push([px(c.at), py(v)]); } else for(var x = 0; x <= 10 + 1e-9; x += 0.1){ var h = y(c, x); if(h != null && h >= 0 && h <= 10) pts.push([px(x), py(h)]); } return pts; });
    function crosses(bx, skip){ return lines.some(function(pts, j){ return j !== skip && pts.some(function(q){ return q[0] > bx[0] - 1 && q[0] < bx[2] + 1 && q[1] > bx[1] - 1 && q[1] < bx[3] + 1; }); }); }
    function place(id, n, at, skip){
      var tries = [0, 14, -14, 28, -28], bx, fallback = null;
      for(var t = 0; t < tries.length; t++){
        var a2 = [at[0], at[1] + tries[t], at[2]]; bx = box(id, n, a2);
        if(a2[1] < 12 || a2[1] > T + PH - 2) continue;
        if(placed.some(function(q){ return hit(q, bx); })) continue;
        if(!crosses(bx, skip)){ placed.push(bx); return a2; }
        if(!fallback) fallback = [a2, bx];
      }
      if(fallback){ placed.push(fallback[1]); return fallback[0]; }
      placed.push(box(id, n, at)); return at;
    }
    var whole = function(c, i){ return c.steps && Math.abs(c.at - base[i].at) >= 1 - 1e-9 && c.shape !== 'ppc' && c.shape !== 'ppcline' && c.shape !== 'rdemand'; };
    var pos = now.map(function(c, i){
      var lab = askLabels && !labels[c.id] ? null : (labels[c.id] || c.id);
      return place(lab || '?', c.steps ? cn : String(i + 1), whole(c, i) ? pairLabels(c, base[i])[0] : labelAt(c), i);
    });
    var oldPos = now.map(function(c, i){
      var b = base[i], lab = askLabels && !labels[c.id] ? null : (labels[c.id] || c.id);
      if(!c.steps || !lab) return null;
      return place(lab, n0, whole(c, i) ? pairLabels(c, b)[1] : Math.abs(c.at - b.at) < 1 - 1e-9 ? labelAway(b) : labelAt(b, b.shape === 'ppcline' && c.steps > 0), -1);
    });
    if(state.key){
      var ko = keyOffsets(spec);
      // The key's curve, dashed in the success color, labeled as the answer's new curve (SRAS2), not "SRASkey".
      curves(spec, ko).forEach(function(c){ if(!ko[c.id]) return; var j = now.map(function(q){ return q.id; }).indexOf(c.id), same = j > -1 && Math.abs(now[j].at - c.at) < 1e-9;
        g.push('<path class="mac-gr-curve is-key" d="' + pathOf(c) + '"/>' + (same ? '' : curveLabel(c.id, cn, place(c.id, cn, Math.abs(c.at - base[j].at) >= 1 - 1e-9 ? pairLabels(c, base[j])[0] : labelAt(c), j), 'is-key'))); });
    }
    now.forEach(function(c, i){
      var moved = !!c.steps, b = base[i], lab = askLabels && !labels[c.id] ? null : (labels[c.id] || c.id), at = pos[i];
      if(moved) g.push('<path class="mac-gr-curve is-old" d="' + pathOf(b) + '"/>' + (lab ? curveLabel(lab, n0, oldPos[i], 'is-old') : '') + arrowOf(b, c));
      g.push('<g class="mac-gr-c" data-curve="' + esc(c.id) + '"><path class="mac-gr-curve' + (state.focus === c.id ? ' is-focus' : '') + '" d="' + pathOf(c) + '"/>' +
        '<path class="mac-gr-grab" d="' + pathOf(c) + '"/></g>' + (lab ? curveLabel(lab, moved ? cn : '', at) : '<text class="mac-gr-clabel" x="' + f1(at[0]) + '" y="' + f1(at[1]) + '" text-anchor="' + at[2] + '">?<tspan class="mac-gr-sub" dy="3">' + (i + 1) + '</tspan></text>'));
    });
    // A straight PPC with spec.ends: the starting curve's intercepts as numbers
    // on the axes (the most of each good), as the exam's trade graphs show them.
    if(spec.linear && spec.ends){ var pc = find(base, 'PPC');
      if(pc && pc.shape === 'ppcline' && !(spec.start && spec.start.PPC)){
        g.push('<text class="mac-gr-mark is-end" x="' + f1(px(pc.at * pc.kx)) + '" y="' + (T + PH + 13) + '" text-anchor="middle">' + esc(spec.ends.x) + '</text>');
        g.push('<text class="mac-gr-mark is-end" x="' + (L - 4) + '" y="' + f1(py(pc.at * pc.ky) + 4) + '" text-anchor="end">' + esc(spec.ends.y) + '</text>');
      } }
    // E1 and E2 with their axis marks; the E2 label goes on the side away
    // from a vertical curve just right of it (LRAS, LRPC, MS, RS).
    // E labels clear of the lines: right, level with the point; left, in the
    // wedge over the guide (under it when the other point is straight above);
    // above the flat part of reserve demand.
    function flatAt(p){ return now.concat(base).some(function(c){ return c.shape === 'rdemand' && p[0] >= 4 - 1e-9 && Math.abs(p[1] - c.at) < 1e-6; }); }
    function eAt(p, left, below){
      if(flatAt(p)) return [px(p[0]) + (left ? -8 : 8), py(p[1]) + (below ? 15 : -8)];
      return left ? [px(p[0]) - 17, py(p[1]) + (below ? 14 : -3)] : [px(p[0]) + 10, py(p[1]) + 4];
    }
    var two = state.eq && e0 && (Math.abs(state.eq[0] - e0[0]) > 1e-6 || Math.abs(state.eq[1] - e0[1]) > 1e-6);
    if(e0){ g.push(guides(e0, 'is-old')); g.push('<circle class="mac-gr-eq is-old" cx="' + f1(px(e0[0])) + '" cy="' + f1(py(e0[1])) + '" r="4"/>');
      if(!askLabels) g.push(marks(spec.kind, e0, two ? n0 : '', 'is-old', two ? state.eq : null, state.marks0, true));
      // E1 on the side away from E2 (left of it when the new point is straight above or below, as on LRAS).
      var e1Left = state.eq && state.eq[0] > e0[0] - 1e-6;
      if(two){ var a1 = eAt(e0, e1Left, flatAt(e0) ? state.eq[1] > e0[1] : Math.abs(state.eq[0] - e0[0]) < 1e-6 && state.eq[1] > e0[1]); g.push('<text class="mac-gr-plabel is-old" x="' + f1(a1[0]) + '" y="' + f1(a1[1]) + '" text-anchor="' + (e1Left ? 'end' : 'start') + '">' + eName(n0) + '</text>'); } }
    if(state.eq){
      var vNear = now.some(function(c){ return c.shape === 'vertical' && c.at > state.eq[0] + 0.05 && c.at - state.eq[0] < 1.4; });
      var right = !vNear, ea = eAt(state.eq, !right), lx = ea[0], ly = ea[1];
      // E2's label goes left if it would sit on a curve label (DR beside E2 on the flat part).
      if(right){ var eb = [lx, ly - 11, lx + 18, ly + 4]; if(placed.some(function(q){ return hit(q, eb); })){ right = false; ea = eAt(state.eq, true); lx = ea[0]; ly = ea[1]; } }
      g.push(guides(state.eq)); if(two && !askLabels) g.push(marks(spec.kind, state.eq, n1, '', e0));
      g.push('<g class="mac-gr-pt" data-pt="eq"><circle class="mac-gr-eq" cx="' + f1(px(state.eq[0])) + '" cy="' + f1(py(state.eq[1])) + '" r="6"/><text class="mac-gr-plabel" x="' + f1(lx) + '" y="' + f1(ly) + '" text-anchor="' + (right ? 'start' : 'end') + '">' + eName(n1) + '</text></g>'); }
    if(state.point){
      var pNear = now.some(function(c){ return c.shape === 'vertical' && c.at > state.point[0] + 0.05 && c.at - state.point[0] < 1.4; });
      g.push('<g class="mac-gr-pt" data-pt="point"><circle class="mac-gr-eq is-point" cx="' + f1(px(state.point[0])) + '" cy="' + f1(py(state.point[1])) + '" r="6"/><text class="mac-gr-plabel" x="' + f1(px(state.point[0]) + (pNear ? -9 : 9)) + '" y="' + f1(py(state.point[1]) - 8) + '" text-anchor="' + (pNear ? 'end' : 'start') + '">' + esc(spec.pointLabel || 'X') + '</text></g>'); }
    var label = opts.label || (k.title + ' graph: ' + describe(spec, state));
    return '<svg class="mac-graph-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + g.join('') + '</svg>';
  }
  /* The graph in words, for its text alternative and the live region. */
  function describe(spec, state){
    state = state || {};
    var k = kindOf(spec), sh = state.shifts || {}, parts = [];
    curves(spec, sh).forEach(function(c){ parts.push(curveName(c.id) + (c.steps ? ' shifted ' + dirWord(c.shape, c.steps) + (Math.abs(c.steps) > 1 ? ' ' + Math.abs(c.steps) + ' steps' : '') : '')); });
    var s = parts.join('; ') + '.';
    if(k.out){ var o = outcome(spec, sh); if(o && Object.keys(sh).some(function(c){ return sh[c]; })) s += ' At the new crossing the ' + k.out.y + ' is ' + word(o[k.out.y]) + ' and the ' + k.out.x + ' is ' + word(o[k.out.x]) + '.'; }
    return s;
  }
  function word(d){ return d === 'up' ? 'higher' : d === 'down' ? 'lower' : 'unchanged'; }

  /* -------------------------------------------------------------- DOM */
  var uid = 0;
  function mount(host, spec, opts){
    opts = opts || {};
    var k = kindOf(spec), does = spec.do || [], id = 'gr' + (++uid);
    var movable = spec.movable || k.curves.map(function(c){ return c.id; });
    var st = { shifts: {}, eq: null, point: null, labels: {}, key: false, focus: null };
    function resetState(){ st.shifts = {}; st.labels = {}; st.point = null; st.eq = does.indexOf('equilibrium') > -1 ? (eq(spec, {}) || [5, 5]).slice() : null; }
    resetState();
    host.classList.add('mac-graph');
    host.innerHTML = '<div class="mac-gr-stage"></div>' +
      (does.indexOf('label') > -1 ? '<div class="mac-gr-labels">' + labelSlots(spec).map(function(slot){
        var sid = id + '-l-' + slot, name = slot === 'x' ? 'Horizontal axis' : slot === 'y' ? 'Vertical axis' : 'Curve ' + (labelSlots(spec).indexOf(slot) - 1);
        return '<label for="' + sid + '"><span>' + name + '</span><select id="' + sid + '" data-slot="' + esc(slot) + '"><option value="">Choose a label</option>' +
          labelOptions(spec, slot).map(function(o){ return '<option value="' + esc(o) + '">' + esc(optionText(spec, slot, o)) + '</option>'; }).join('') + '</select></label>';
      }).join('') + '</div>' : '') +
      '<p class="mac-gr-help mac-small" id="' + id + '-h">' + help() + '</p>' +
      '<div class="mac-gr-controls"></div><p class="sr-only" aria-live="polite" id="' + id + '-live"></p>';
    var stage = host.querySelector('.mac-gr-stage'), live = host.querySelector('#' + id + '-live'), controls = host.querySelector('.mac-gr-controls');
    function help(){
      var t = [];
      if(does.indexOf('shift') > -1) t.push('Drag a curve to shift it, or tab to its handle and use the arrow keys (Home puts it back).');
      if(does.indexOf('equilibrium') > -1) t.push('Then move E2 to the new equilibrium.');
      if(does.indexOf('point') > -1) t.push('Tap the graph to place the point, or tab to it and use the arrow keys.');
      if(does.indexOf('label') > -1) t.push('Choose each label below the graph.');
      return t.join(' ');
    }
    // Handles live outside the SVG image (role="img" hides its children), as
    // buttons over it, so they are real focusable controls.
    controls.innerHTML = (does.indexOf('shift') > -1 ? movable.map(function(c){
      return '<button type="button" class="mac-gr-handle" data-curve="' + esc(c) + '" aria-describedby="' + id + '-h">' + esc(curveShort(c)) + ': <span></span></button>';
    }).join('') : '') +
      (does.indexOf('equilibrium') > -1 ? '<button type="button" class="mac-gr-handle" data-pt="eq" aria-describedby="' + id + '-h">E2: <span></span></button>' : '') +
      (does.indexOf('point') > -1 ? '<button type="button" class="mac-gr-handle" data-pt="point" aria-describedby="' + id + '-h">Point: <span></span></button>' : '') +
      (opts.readonly ? '' : '<button type="button" class="btn-outline sm mac-gr-reset">Start over</button>');
    function curveState(c){ var cs = find(curves(spec, st.shifts), c); return cs.steps ? 'shifted ' + dirWord(cs.shape, cs.steps) + (Math.abs(cs.steps) > 1 ? ' ' + Math.abs(cs.steps) : '') : 'not shifted'; }
    function ptState(p, w){ var q = w === 'eq' && eq(spec, st.shifts); return !p ? 'not placed' : q && Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) < 1e-6 ? 'where the curves cross' : 'placed'; }
    function paint(say){
      stage.innerHTML = svg(spec, st);
      controls.querySelectorAll('[data-curve]').forEach(function(b){ b.querySelector('span').textContent = curveState(b.getAttribute('data-curve')); });
      controls.querySelectorAll('[data-pt]').forEach(function(b){ var w = b.getAttribute('data-pt'); b.querySelector('span').textContent = ptState(st[w], w); });
      if(say) live.textContent = say;
      wireSvg();
    }
    // Every change by the student: opts.onChange, and a "macgraph:change"
    // event on the host (detail: the response), so a page that did not make
    // the mount (ApMacroTools.drill's graph step) can listen too.
    function fire(){ var r = get(); if(opts.onChange) opts.onChange(r); try{ host.dispatchEvent(new CustomEvent('macgraph:change', { detail: r })); }catch(e){} }
    function changed(say){ paint(say); fire(); }
    function shift(c, d){
      if(opts.readonly || movable.indexOf(c) < 0) return;
      var cur = st.shifts[c] || 0, nx = d === 0 ? 0 : Math.max(-MAX_STEPS, Math.min(MAX_STEPS, cur + d));
      if(nx === cur) return;
      if(nx) st.shifts[c] = nx; else delete st.shifts[c];
      changed(curveName(c) + ' ' + curveState(c) + '. ' + describe(spec, st));
    }
    function clamp(v){ return Math.max(0, Math.min(10, Math.round(v * 4) / 4)); }
    function movePt(which, dx, dy){
      if(opts.readonly) return;
      var p = st[which] || [5, 5];
      st[which] = [clamp(p[0] + dx), clamp(p[1] + dy)];
      changed((which === 'eq' ? 'E2 ' : 'Point ') + ptState(st[which], which) + ' (' + st[which].join(', ') + ')');
    }
    controls.addEventListener('keydown', function(e){
      var b = e.target.closest('.mac-gr-handle'); if(!b) return;
      var c = b.getAttribute('data-curve'), pt = b.getAttribute('data-pt'), key = e.key;
      if(c){
        var vert = VERTICAL_SHIFT[find(curves(spec, {}), c).shape];
        var d = key === 'Home' ? 0 : /Right|Up/.test(key) ? 1 : /Left|Down/.test(key) ? -1 : null;
        if(d === null) return;
        e.preventDefault(); void vert; shift(c, d);
      } else if(pt){
        var m = { ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0], ArrowUp: [0, 0.5], ArrowDown: [0, -0.5] }[key];
        if(!m) return;
        e.preventDefault(); movePt(pt, m[0], m[1]);
      }
    });
    controls.addEventListener('focusin', function(e){ var b = e.target.closest('[data-curve]'); st.focus = b ? b.getAttribute('data-curve') : null; paint(); });
    controls.addEventListener('focusout', function(){ st.focus = null; paint(); });
    controls.addEventListener('click', function(e){ if(e.target.closest('.mac-gr-reset')){ resetState(); changed('Graph reset.'); } });
    host.querySelectorAll('.mac-gr-labels select').forEach(function(sel){
      sel.addEventListener('change', function(){ var s = sel.getAttribute('data-slot'); if(sel.value) st.labels[s] = sel.value; else delete st.labels[s]; changed(); });
      if(opts.readonly) sel.disabled = true;
    });
    // Pointer: drag a curve along its shift axis (whole steps) or a point.
    function toData(ev){
      var r = stage.firstChild.getBoundingClientRect(), sx = W / r.width, sy = H / r.height;
      return [((ev.clientX - r.left) * sx - L) / PW * 10, 10 - ((ev.clientY - r.top) * sy - T) / PH * 10];
    }
    var drag = null;
    function wireSvg(){
      if(opts.readonly) return;
      var s = stage.firstChild;
      s.addEventListener('pointerdown', function(ev){
        var g = ev.target.closest('[data-curve]'), p = ev.target.closest('[data-pt]'), at = toData(ev);
        if(g && does.indexOf('shift') > -1 && movable.indexOf(g.getAttribute('data-curve')) > -1){
          var c = g.getAttribute('data-curve'); drag = { curve: c, from: at, steps: st.shifts[c] || 0, vert: !!VERTICAL_SHIFT[find(curves(spec, {}), c).shape] };
        } else if(p) drag = { pt: p.getAttribute('data-pt') };
        else if(does.indexOf('point') > -1){ st.point = [clamp(at[0]), clamp(at[1])]; drag = { pt: 'point' }; changed('Point ' + ptState(st.point)); }
        if(drag){ ev.preventDefault(); try{ stage.setPointerCapture(ev.pointerId); }catch(e){} }
      });
    }
    stage.addEventListener('pointermove', function(ev){
      if(!drag) return;
      var at = toData(ev);
      if(drag.curve){
        var d = Math.round((drag.vert ? at[1] - drag.from[1] : at[0] - drag.from[0]));
        var want = Math.max(-MAX_STEPS, Math.min(MAX_STEPS, drag.steps + d)), cur = st.shifts[drag.curve] || 0;
        if(want !== cur) shift(drag.curve, want - cur);
      } else { st[drag.pt] = [clamp(at[0]), clamp(at[1])]; paint(); }
    });
    function end(){ if(drag && drag.pt) fire(); if(drag && drag.pt) live.textContent = (drag.pt === 'eq' ? 'E2 ' : 'Point ') + ptState(st[drag.pt], drag.pt) + ' (' + st[drag.pt].join(', ') + ')'; drag = null; }
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    function get(){
      var r = { shifts: {}, eq: st.eq ? st.eq.slice() : null, point: st.point ? st.point.slice() : null, labels: {} };
      for(var c in st.shifts) r.shifts[c] = st.shifts[c];
      for(var l in st.labels) r.labels[l] = st.labels[l];
      return r;
    }
    function set(r){
      r = r || {}; st.shifts = {}; for(var c in (r.shifts || {})) if(r.shifts[c]) st.shifts[c] = r.shifts[c];
      st.labels = {}; for(var l in (r.labels || {})) st.labels[l] = r.labels[l];
      if(r.eq) st.eq = r.eq.slice(); st.point = r.point ? r.point.slice() : null;
      host.querySelectorAll('.mac-gr-labels select').forEach(function(sel){ sel.value = st.labels[sel.getAttribute('data-slot')] || ''; });
      paint();
    }
    function lock(){ opts.readonly = true; controls.querySelectorAll('button').forEach(function(b){ if(b.classList.contains('mac-gr-reset')) b.remove(); else b.setAttribute('aria-disabled', 'true'); }); host.querySelectorAll('select').forEach(function(s){ s.disabled = true; }); }
    paint();
    return { el: host, get: get, set: set, reset: function(){ resetState(); paint(); }, showKey: function(on){ st.key = on !== false; paint(); }, lock: lock };
  }

  root.ApMacroGraph = { KINDS: KINDS, TASKS: TASKS, CURVE: CURVE, AXIS: AXIS, curves: curves, y: y, eq: eq, outcome: outcome, indeterminate: indeterminate, keyOffsets: keyOffsets, keyResponse: keyResponse,
    region: region, distTo: distTo, dirWord: dirWord, dirSign: dirSign, axisOf: axisOf, curveName: curveName, labelText: labelText, labelOptions: labelOptions,
    labelSlots: labelSlots, optionText: optionText, check: check, svg: svg, describe: describe, mount: mount, find: find,
    // The plot box in viewBox units (320 x 300), so a page can draw on top of the SVG in its coordinates.
    px: px, py: py, BOX: { W: W, H: H, L: L, T: T, PW: PW, PH: PH }, plural: plural };
})(typeof window !== 'undefined' ? window : globalThis);
