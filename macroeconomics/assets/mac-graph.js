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
  function plural(w){ return /s$/.test(w) ? w : w + 's'; }
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
  function dirWord(shape, steps){
    if(!steps) return 'none';
    if(shape === 'ppc') return steps > 0 ? 'out' : 'in';
    if(VERTICAL_SHIFT[shape]) return steps > 0 ? 'up' : 'down';
    return steps > 0 ? 'right' : 'left';
  }
  function dirSign(shape, dir){
    var plus = shape === 'ppc' ? 'out' : VERTICAL_SHIFT[shape] ? 'up' : 'right', minus = shape === 'ppc' ? 'in' : VERTICAL_SHIFT[shape] ? 'down' : 'left';
    return dir === plus ? 1 : dir === minus ? -1 : 0;
  }

  /* ---------------------------------------------------------- geometry */
  function curves(spec, offsets){
    var k = kindOf(spec), start = spec.start || {}, off = offsets || {};
    return k.curves.map(function(c){ return { id: c.id, shape: c.shape, at: c.at + (start[c.id] || 0) + (off[c.id] || 0), base: c.at + (start[c.id] || 0), steps: off[c.id] || 0 }; });
  }
  function find(list, id){ for(var i = 0; i < list.length; i++) if(list[i].id === id) return list[i]; return null; }
  function y(c, x){
    var v;
    if(c.shape === 'down') v = 5 - (x - c.at);
    else if(c.shape === 'up') v = 5 + (x - c.at);
    else if(c.shape === 'horizontal') v = c.at;
    else if(c.shape === 'rdemand') v = x < 4 ? c.at + (4 - x) * 1.5 : c.at;
    else if(c.shape === 'ppc'){ if(x < 0 || x > c.at) return null; v = Math.sqrt(c.at * c.at - x * x); }
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
  function keyOffsets(spec){
    var off = {}, cs = curves(spec, {}), key = (spec && spec.key) || {};
    (key.shifts || []).forEach(function(s){ var c = find(cs, s.curve); if(c) off[s.curve] = (off[s.curve] || 0) + dirSign(c.shape, s.dir); });
    return off;
  }
  function region(spec, offsets, p){
    var c = find(curves(spec, offsets), 'PPC');
    if(!c || !p) return null;
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
    if(spec.kind === 'forex' && (!spec.names || !spec.names.currency || !spec.names.other)) bad('graph.names.currency and .other name the two currencies (the market is for the currency)');
    var key = spec.key || {};
    if(does.indexOf('shift') > -1){
      if(!Array.isArray(key.shifts) || !key.shifts.length) bad('graph.key.shifts lists each curve that moves and its direction');
      var seen = {};
      (key.shifts || []).forEach(function(s, i){
        var c = find(curves(spec, {}), s.curve);
        if(!c){ bad('graph.key.shifts[' + i + ']: unknown curve "' + s.curve + '"'); return; }
        if(seen[s.curve]) bad('graph.key.shifts: ' + s.curve + ' is listed twice'); seen[s.curve] = 1;
        if(!dirSign(c.shape, s.dir)) bad('graph.key.shifts[' + i + ']: ' + s.curve + ' shifts ' + (c.shape === 'ppc' ? 'out or in' : VERTICAL_SHIFT[c.shape] ? 'up or down' : 'right or left') + ', not "' + s.dir + '"');
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
        var got = outcome(spec, keyOffsets(spec)) || {};
        Object.keys(key.outcome).forEach(function(w){
          if(!(w in got)) bad('graph.key.outcome: "' + w + '" is not an axis of this graph (' + k.out.x + ', ' + k.out.y + ')');
          else if(DIRS.indexOf(key.outcome[w]) < 0) bad('graph.key.outcome.' + w + ' is up, down or same');
          else if(got[w] !== key.outcome[w]) bad('graph.key.outcome.' + w + ' is "' + key.outcome[w] + '" but the key shifts give "' + got[w] + '"' + ((key.shifts || []).length > 1 ? ' (with equal shifts; an outcome that depends on the sizes is left out)' : ''));
        });
      }
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
  function labelAt(c){
    if(c.shape === 'vertical') return [px(c.at) + 5, py(9.6) + 6 + (Math.round(c.at) % 2 ? 0 : 15), 'start'];
    if(c.shape === 'down'){ var x2 = LX, y2 = 5 - (x2 - c.at); if(y2 < 0.5){ y2 = 0.5; x2 = c.at + 4.5; } return [px(x2) + 6, py(y2) + 3, 'start']; }
    if(c.shape === 'up'){ var x1 = LX, y1 = 5 + (x1 - c.at); if(y1 > 9.6){ y1 = 9.6; x1 = c.at + 4.6; } return [px(x1) - 7, py(y1) - 3, 'end']; }
    if(c.shape === 'ppc'){ var r = (c.at + 0.45) / Math.SQRT2; return [px(r) + 2, py(r) - 2, 'start']; }
    return [px(9.6), py(c.at) - 6, 'end'];
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
    if(c.shape === 'vertical'){ y0 = y1 = 8.4; x0 = b.at; x1 = c.at; }
    else if(c.shape === 'down'){ y0 = y1 = 7.6; x0 = b.at - 2.6; x1 = c.at - 2.6; }
    else if(c.shape === 'up'){ y0 = y1 = 2.4; x0 = b.at - 2.6; x1 = c.at - 2.6; }
    else if(c.shape === 'ppc'){ var k = Math.cos(Math.PI / 3); x0 = b.at * k; y0 = b.at * Math.sin(Math.PI / 3); x1 = c.at * k; y1 = c.at * Math.sin(Math.PI / 3); }
    else { x0 = x1 = 8.2; y0 = b.at; y1 = c.at; }
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
  function marks(kind, p, n, cls, other){
    var m = MARK[kind];
    if(!m || !p) return '';
    var sub = function(t){ return esc(t) + (n ? '<tspan class="mac-gr-sub" dy="3">' + n + '</tspan>' : ''); };
    var out = '';
    if(!other || Math.abs(other[0] - p[0]) > 1e-6){
      var close = other && Math.abs(other[0] - p[0]) < 1, anc = close ? (p[0] < other[0] ? 'end' : 'start') : 'middle', dx = close ? (p[0] < other[0] ? 2 : -2) : 0;
      out += '<text class="mac-gr-mark ' + (cls || '') + '" x="' + f1(px(p[0]) + dx) + '" y="' + (T + PH + 13) + '" text-anchor="' + anc + '">' + sub(m[0]) + '</text>';
    }
    if(!other || Math.abs(other[1] - p[1]) > 1e-6){
      var closeY = other && Math.abs(other[1] - p[1]) < 0.7, dy = closeY ? (p[1] < other[1] ? 5 : -2) : 4;
      out += '<text class="mac-gr-mark ' + (cls || '') + '" x="' + (L - 4) + '" y="' + f1(py(p[1]) + dy) + '" text-anchor="end">' + sub(m[1]) + '</text>';
    }
    return out;
  }
  function guides(p, cls){
    return '<path class="mac-gr-guide ' + (cls || '') + '" d="M' + f1(px(0)) + ' ' + f1(py(p[1])) + 'H' + f1(px(p[0])) + 'V' + f1(py(0)) + '"/>';
  }
  /* state: { shifts, eq, point, labels, key: bool (draw the key's end curves),
     focus: curve id }. opts.label: accessible name. */
  function svg(spec, state, opts){
    state = state || {}; opts = opts || {};
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
    if(state.key){
      var ko = keyOffsets(spec);
      curves(spec, ko).forEach(function(c){ if(ko[c.id]) g.push('<path class="mac-gr-curve is-key" d="' + pathOf(c) + '"/>' + curveLabel(c.id, 'key', labelAt(c), 'is-key')); });
    }
    now.forEach(function(c, i){
      var moved = !!c.steps, b = base[i], lab = askLabels && !labels[c.id] ? null : (labels[c.id] || c.id);
      if(moved) g.push('<path class="mac-gr-curve is-old" d="' + pathOf(b) + '"/>' + (lab ? curveLabel(lab, '1', labelAt(b), 'is-old') : '') + arrowOf(b, c));
      g.push('<g class="mac-gr-c" data-curve="' + esc(c.id) + '"><path class="mac-gr-curve' + (state.focus === c.id ? ' is-focus' : '') + '" d="' + pathOf(c) + '"/>' +
        '<path class="mac-gr-grab" d="' + pathOf(c) + '"/></g>' + (lab ? curveLabel(lab, moved ? '2' : '', labelAt(c)) : '<text class="mac-gr-clabel" x="' + f1(labelAt(c)[0]) + '" y="' + f1(labelAt(c)[1]) + '" text-anchor="' + labelAt(c)[2] + '">?<tspan class="mac-gr-sub" dy="3">' + (i + 1) + '</tspan></text>'));
    });
    // E1 and E2 with their axis marks; the E2 label goes on the side away
    // from a vertical curve just right of it (LRAS, LRPC, MS, RS).
    var two = state.eq && e0 && (Math.abs(state.eq[0] - e0[0]) > 1e-6 || Math.abs(state.eq[1] - e0[1]) > 1e-6);
    if(e0){ g.push(guides(e0, 'is-old')); g.push('<circle class="mac-gr-eq is-old" cx="' + f1(px(e0[0])) + '" cy="' + f1(py(e0[1])) + '" r="4"/>');
      if(!askLabels) g.push(marks(spec.kind, e0, two ? '1' : '', 'is-old', two ? state.eq : null));
      if(two) g.push('<text class="mac-gr-plabel is-old" x="' + f1(px(e0[0]) + (state.eq[0] > e0[0] ? -8 : 8)) + '" y="' + f1(py(e0[1]) + (state.eq[1] > e0[1] ? 15 : -8)) + '" text-anchor="' + (state.eq[0] > e0[0] ? 'end' : 'start') + '">E1</text>'); }
    if(state.eq){
      var vNear = now.some(function(c){ return c.shape === 'vertical' && c.at > state.eq[0] + 0.05 && c.at - state.eq[0] < 1.4; });
      var right = !vNear, lx = px(state.eq[0]) + (right ? 9 : -9);
      g.push(guides(state.eq)); if(two && !askLabels) g.push(marks(spec.kind, state.eq, '2', '', e0));
      g.push('<g class="mac-gr-pt" data-pt="eq"><circle class="mac-gr-eq" cx="' + f1(px(state.eq[0])) + '" cy="' + f1(py(state.eq[1])) + '" r="6"/><text class="mac-gr-plabel" x="' + f1(lx) + '" y="' + f1(py(state.eq[1]) - 8) + '" text-anchor="' + (right ? 'start' : 'end') + '">E2</text></g>'); }
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
    function ptState(p){ return p ? 'at ' + p[0] + ', ' + p[1] : 'not placed'; }
    function paint(say){
      stage.innerHTML = svg(spec, st);
      controls.querySelectorAll('[data-curve]').forEach(function(b){ b.querySelector('span').textContent = curveState(b.getAttribute('data-curve')); });
      controls.querySelectorAll('[data-pt]').forEach(function(b){ b.querySelector('span').textContent = ptState(st[b.getAttribute('data-pt')]); });
      if(say) live.textContent = say;
      wireSvg();
    }
    function changed(say){ paint(say); if(opts.onChange) opts.onChange(get()); }
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
      changed((which === 'eq' ? 'E2 ' : 'Point ') + ptState(st[which]));
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
    function end(){ if(drag && drag.pt && opts.onChange) opts.onChange(get()); if(drag && drag.pt) live.textContent = (drag.pt === 'eq' ? 'E2 ' : 'Point ') + ptState(st[drag.pt]); drag = null; }
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

  root.ApMacroGraph = { KINDS: KINDS, TASKS: TASKS, CURVE: CURVE, AXIS: AXIS, curves: curves, y: y, eq: eq, outcome: outcome, keyOffsets: keyOffsets,
    region: region, distTo: distTo, dirWord: dirWord, dirSign: dirSign, axisOf: axisOf, curveName: curveName, labelText: labelText, labelOptions: labelOptions,
    labelSlots: labelSlots, optionText: optionText, check: check, svg: svg, describe: describe, mount: mount, find: find };
})(typeof window !== 'undefined' ? window : globalThis);
