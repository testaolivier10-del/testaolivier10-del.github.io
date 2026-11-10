/* ApMicroGraph: the economics graphs students draw, shift, label and shade
   (docs/apmicro-architecture.md "Graphs", spec section 5b). Forked from
   AP® Macroeconomics' mac-graph.js, keeping its spec format, checker,
   renderer and grading contract; added: shaded areas graded by region
   identity, curved curves (cost curves, MR, MFC, LRATC, Lorenz), price and
   quantity lines, two panels (market and firm) that stack on a phone, and the
   micro kinds. One file, two halves:

   PURE (no DOM, runs in node: the generator, the content check, the grader
   in mic-grade.js and the tests load this very file)
     KINDS                     ppc, sd, sd-micro (controls, taxes, subsidies,
                               trade and tariffs), costs, pc (market and firm),
                               monopoly, monocomp, labor (market and firm),
                               monopsony, externality, lorenz
     curves(spec, offsets)     every curve after its shifts (followers move
                               with their leader: MR with D, MFC with S_L,
                               AVC with MC)
     y(curve, x)               a curve's height at x (null off its domain)
     eq(spec, offsets)         the market equilibrium [x, y], or null
     outcome(spec, offsets)    { <axis word>: 'up' | 'down' | 'same' }
     named(spec, offsets, name, line)  a named point [x, y] (profit-max, firm,
                               hire, efficient, min-atc ...), or null
     lineAt(spec, state)       the height of the graph's price or wage line
     areas(spec, offsets)      { cells: [{ id, panel, poly }], regions: { name: [cell ids] } }
     keyOffsets, keyResponse, indeterminate, region, labelText, labelOptions,
     labelSlots, slotAnswer, check(spec), svg(spec, state, opts), describe

   DOM (browser)
     mount(host, spec, opts) -> { get(), set(response), reset(), showKey(on), lock(), el }

   The response the grader reads (ApMicroGrade.graph):
     { shifts: { <curve id>: steps }, eq: [x, y] | null, point: [x, y] | null,
       labels: { <slot>: <id> }, line: <y> | null, shade: [<cell id>] }

   Coordinates are 0-10 on both axes of each panel. Straight curves have
   slope -1 or +1 (MR and MFC twice that), so a straight-line equilibrium is
   exact; cost curves come from one cubic total-cost model, so MC passes
   through the minimum of AVC and of ATC exactly. A shift moves a curve by
   whole steps; magnitude is never graded. Areas are named regions made of
   cells; a student shades cells by tapping and is graded on which cells,
   never on pixels. */
(function(root){
  'use strict';

  /* ------------------------------------------------------------ labels */
  var AXIS = {
    price: 'Price', quantity: 'Quantity', priceCost: 'Price and cost', cost: 'Cost', revenue: 'Revenue',
    wage: 'Wage', quantityLabor: 'Quantity of labor', laborers: 'Number of workers', output: 'Quantity of output',
    households: 'Cumulative percentage of households', income: 'Cumulative percentage of income',
    priceLevel: 'Price level', realGdp: 'Real GDP', interest: 'Interest rate', utility: 'Total utility'
  };
  function labelText(id, names){
    names = names || {};
    if(id === 'goodX') return names.x || 'Good A';
    if(id === 'goodY') return names.y || 'Good B';
    return AXIS[id] || id;
  }
  // Curve ids: [short label, subscript, the name used in feedback].
  var CURVE = {
    D: ['D', '', 'demand'], S: ['S', '', 'supply'], MR: ['MR', '', 'marginal revenue'],
    MC: ['MC', '', 'marginal cost'], ATC: ['ATC', '', 'average total cost'], AVC: ['AVC', '', 'average variable cost'],
    AFC: ['AFC', '', 'average fixed cost'], LRATC: ['LRATC', '', 'long-run average total cost'],
    DL: ['D', 'L', 'the demand for labor'], SL: ['S', 'L', 'the supply of labor'], MRP: ['MRP', '', 'marginal revenue product'],
    MFC: ['MFC', '', 'marginal factor cost'], MSB: ['MSB', '', 'marginal social benefit'], MSC: ['MSC', '', 'marginal social cost'],
    MPB: ['MPB', '', 'marginal private benefit'], MPC: ['MPC', '', 'marginal private cost'],
    PPC: ['PPC', '', 'the production possibilities curve'], EQ: ['Line of equality', '', 'the line of perfect equality'],
    LC: ['Lorenz curve', '', 'the Lorenz curve'],
    // lines (spec.line)
    P: ['d = MR = AR = P', '', "the firm's demand curve (d = MR = AR = P)"], W: ['S = MFC = W', '', "the firm's labor supply (S = MFC = W)"],
    Pc: ['P', 'C', 'the price ceiling'], Pf: ['P', 'F', 'the price floor'], PW: ['P', 'W', 'the world price'],
    PT: ['P', 'W + t', 'the world price plus the tariff'], MW: ['W', 'min', 'the minimum wage'], Pr: ['P', 'R', 'the regulated price'],
    // confusions offered in label dropdowns
    AD: ['AD', '', 'aggregate demand'], SRAS: ['SRAS', '', 'short-run aggregate supply'], Dd: ['D', '', 'a downward-sloping demand curve']
  };
  function curveText(spec, id){
    var k = KINDS[spec && spec.kind];
    if(k && k.text){ var t = k.text(spec, id); if(t) return t; }
    return CURVE[id] || [id, '', id];
  }
  function curveName(id, spec){ return (spec ? curveText(spec, id) : CURVE[id] || [id, '', id])[2]; }
  function curveShort(id, spec){ var c = spec ? curveText(spec, id) : CURVE[id] || [id, '']; return c[0] + c[1]; }

  /* ---------------------------------------------------- cost models */
  /* TVC = a q - b q^2 + c q^3, TFC = F: MC = a - 2bq + 3cq^2, AVC = a - bq + cq^2,
     ATC = AVC + F/q. Built from where AVC and ATC bottom out, so MC passes
     through both minima exactly. Fstep: the fixed cost one ATC step adds. */
  function costModel(qv, vmin, qa, amin, Fstep){
    var c = (amin - vmin) / (Math.pow(qa - qv, 2) + 2 * qa * (qa - qv)), b = 2 * c * qv, a = vmin + c * qv * qv, F = 2 * c * qa * qa * (qa - qv);
    return { a: a, b: b, c: c, F: F, Fstep: Fstep };
  }
  var COST = {
    firm: costModel(4.5, 3.6, 5.6, 5, 3),        // perfect competition and the costs graph: min ATC 5 at q 5.6, MC starting above it
    monopoly: costModel(2, 2.5, 3.5, 4, 2),      // monopoly and monopolistic competition
    natural: { a: 2, b: 0, c: 0, F: 12, Fstep: 3 } // natural monopoly: MC flat at 2, ATC = 2 + 12/q falls over the demand range
  };
  function fixedCost(c){ return Math.max(0.4, c.p.F + (c.s || 0) * c.p.Fstep); }   // a lump-sum cost (ATC's own steps) only; a per-unit cost (MC's) leaves it

  /* ------------------------------------------------------------- kinds */
  // Default curves. A def may name: panel (two-panel kinds), follows (moves
  // with that curve and is not movable on its own), fixed (never moves).
  function sdCurves(){ return [{ id: 'D', shape: 'down', at: 5 }, { id: 'S', shape: 'up', at: 5 }]; }
  var EXT = {
    'neg-prod': { social: 'MSC', of: 'S', sign: -1 },   // MSC above MPC: S shifted left by the gap
    'pos-prod': { social: 'MSC', of: 'S', sign: 1 },    // MSC below MPC
    'pos-cons': { social: 'MSB', of: 'D', sign: 1 },    // MSB above MPB: D shifted right by the gap
    'neg-cons': { social: 'MSB', of: 'D', sign: -1 }    // MSB below MPB
  };
  function extOf(spec){ var e = (spec && spec.ext) || {}; return { type: e.type || 'neg-prod', gap: e.gap || 2 }; }
  var POLICIES = ['ceiling', 'floor', 'tax', 'subsidy', 'world', 'tariff'];

  var KINDS = {
    ppc: { title: 'Production possibilities curve', x: 'goodX', y: 'goodY', curves: function(spec){ return [{ id: 'PPC', shape: spec.bow === 'in' ? 'ppcin' : 'ppc', at: 7 }]; }, eq: null, out: null,
      confuse: { x: ['goodY', 'quantity', 'price'], y: ['goodX', 'price', 'quantity'] }, curveConfuse: ['D', 'MC'] },
    sd: { title: 'Supply and demand', x: 'quantity', y: 'price', curves: sdCurves, eq: ['D', 'S'], out: { x: 'quantity', y: 'price' }, mark: ['Q', 'P'],
      confuse: { x: ['realGdp', 'output', 'price'], y: ['priceLevel', 'quantity', 'cost'] }, curveConfuse: ['MR', 'MC'] },
    // Demand alone (the Elasticity Lab, total revenue): a price line spec.line { id: 'P', at } marks a point on it.
    demand: { title: 'Demand', x: 'quantity', y: 'price', curves: function(){ return [{ id: 'D', shape: 'down', at: 5 }]; }, eq: null, out: null,
      text: function(spec, id){ return id === 'P' ? ['P', '', 'the price'] : null; },
      confuse: { x: ['realGdp', 'output', 'price'], y: ['priceLevel', 'quantity', 'cost'] }, curveConfuse: ['S', 'MR'], lineConfuse: ['Dd', 'MR', 'S'],
      points: { 'unit-elastic': 'main', 'at-price': 'main' } },
    'sd-micro': { title: 'Supply and demand', x: 'quantity', y: 'price', curves: sdCurves, eq: ['D', 'S'], out: { x: 'quantity', y: 'price' }, mark: ['Q', 'P'],
      confuse: { x: ['realGdp', 'output', 'price'], y: ['priceLevel', 'quantity', 'cost'] }, curveConfuse: ['MR', 'MC'],
      points: { eq: 'main' } },
    costs: { title: 'Cost curves', x: 'output', y: 'cost',
      curves: function(spec){
        if(spec.set === 'long') return [{ id: 'LRATC', shape: 'lratc', at: 0 }];
        var p = COST.firm, out = [{ id: 'MC', shape: 'mc', at: 0, p: p }, { id: 'ATC', shape: 'atc', at: 0, p: p, costOf: 'MC' }, { id: 'AVC', shape: 'avc', at: 0, p: p, follows: 'MC' }];
        if(spec.afc) out.push({ id: 'AFC', shape: 'afc', at: 0, p: p, follows: 'ATC', costOf: 'MC' });
        return out;
      },
      eq: null, out: null, confuse: { x: ['quantityLabor', 'price', 'cost'], y: ['quantity', 'priceLevel', 'utility'] }, curveConfuse: ['MR', 'D'],
      points: { 'min-atc': 'main', 'min-avc': 'main', 'min-mc': 'main', mes: 'main' } },
    pc: { title: 'Perfect competition: market and firm',
      panels: [{ id: 'market', x: 'quantity', y: 'price', title: 'Market' }, { id: 'firm', x: 'quantity', y: 'priceCost', title: 'Firm' }],
      curves: function(){ var p = COST.firm; return [{ id: 'D', shape: 'down', at: 5, panel: 'market' }, { id: 'S', shape: 'up', at: 5, panel: 'market' },
        { id: 'MC', shape: 'mc', at: 0, p: p, panel: 'firm' }, { id: 'ATC', shape: 'atc', at: 0, p: p, costOf: 'MC', panel: 'firm' }, { id: 'AVC', shape: 'avc', at: 0, p: p, follows: 'MC', panel: 'firm' }]; },
      line: { id: 'P', panel: 'firm', link: true },
      eq: ['D', 'S'], out: { x: 'quantity', y: 'price' }, mark: ['Q', 'P'],
      confuse: { x: ['realGdp', 'priceCost', 'price'], y: ['quantity', 'priceLevel', 'wage'], fx: ['price', 'quantityLabor', 'priceCost'], fy: ['quantity', 'priceLevel', 'wage'] },
      curveConfuse: ['MR', 'AFC'], lineConfuse: ['Dd', 'MR', 'S'],
      points: { market: 'market', firm: 'firm', 'min-atc': 'firm', 'min-avc': 'firm' } },
    monopoly: { title: 'Monopoly', x: 'quantity', y: 'priceCost',
      curves: function(spec){ var p = spec.natural ? COST.natural : COST.monopoly;
        return [{ id: 'D', shape: 'down', at: 5 }, { id: 'MR', shape: 'mr', follows: 'D' }, { id: 'MC', shape: 'mc', at: 0, p: p }, { id: 'ATC', shape: 'atc', at: 0, p: p, costOf: 'MC' }]; },
      eq: null, out: null, confuse: { x: ['output', 'price', 'quantityLabor'], y: ['quantity', 'priceLevel', 'revenue'] }, curveConfuse: ['S', 'AVC'],
      points: { 'profit-max': 'main', 'mr=mc': 'main', allocative: 'main', 'fair-return': 'main', 'revenue-max': 'main' } },
    monocomp: { title: 'Monopolistic competition', x: 'quantity', y: 'priceCost',
      curves: function(spec){ var p = COST.monopoly; return [{ id: 'D', shape: 'down', at: spec.run === 'long' ? tangentAt(p) : 5 }, { id: 'MR', shape: 'mr', follows: 'D' },
        { id: 'MC', shape: 'mc', at: 0, p: p }, { id: 'ATC', shape: 'atc', at: 0, p: p, costOf: 'MC' }]; },
      eq: null, out: null, confuse: { x: ['output', 'price', 'quantityLabor'], y: ['quantity', 'priceLevel', 'revenue'] }, curveConfuse: ['S', 'AVC'],
      points: { 'profit-max': 'main', 'mr=mc': 'main', allocative: 'main', 'min-atc': 'main' } },
    labor: { title: 'Competitive labor market and firm',
      panels: [{ id: 'market', x: 'quantityLabor', y: 'wage', title: 'Labor market' }, { id: 'firm', x: 'quantityLabor', y: 'wage', title: 'Firm' }],
      curves: function(){ return [{ id: 'DL', shape: 'down', at: 5, panel: 'market' }, { id: 'SL', shape: 'up', at: 5, panel: 'market' }, { id: 'MRP', shape: 'down', at: 5, panel: 'firm' }]; },
      line: { id: 'W', panel: 'firm', link: true },
      // mfc: false before MFC is taught (Topic 5.1): the firm's wage line reads S = W.
      text: function(spec, id){ return id === 'W' && spec.mfc === false ? ['S = W', '', "the firm's labor supply at the market wage (S = W)"] : null; },
      eq: ['DL', 'SL'], out: { x: 'quantity of labor', y: 'wage' }, mark: ['Q', 'W'],
      confuse: { x: ['quantity', 'output', 'wage'], y: ['price', 'priceCost', 'quantityLabor'], fx: ['quantity', 'output', 'wage'], fy: ['price', 'priceCost', 'quantityLabor'] },
      curveConfuse: ['D', 'S', 'MFC'], lineConfuse: ['SL', 'MRP', 'MW'],
      points: { market: 'market', firm: 'firm' } },
    monopsony: { title: 'Monopsony', x: 'quantityLabor', y: 'wage',
      curves: function(){ return [{ id: 'SL', shape: 'up', at: 4 }, { id: 'MFC', shape: 'mfc', follows: 'SL' }, { id: 'MRP', shape: 'down', at: 5 }]; },
      eq: null, out: null, confuse: { x: ['quantity', 'output', 'wage'], y: ['price', 'priceCost', 'quantityLabor'] }, curveConfuse: ['DL', 'MC', 'S'],
      points: { hire: 'main', 'mrp=mfc': 'main', competitive: 'main', 'min-wage': 'main' } },
    externality: { title: 'Externality', x: 'quantity', y: 'price',
      curves: function(spec){ var e = extOf(spec), x = EXT[e.type] || EXT['neg-prod'];
        // The social curve sits gap steps from where its private curve starts (spec.start), and never moves after.
        var out = sdCurves(); out.push({ id: x.social, shape: x.of === 'S' ? 'up' : 'down', at: 5 + ((spec.start || {})[x.of] || 0) + x.sign * e.gap, socialOf: x.of, fixed: true }); return out; },
      text: function(spec, id){ var e = extOf(spec), x = EXT[e.type] || EXT['neg-prod'];
        if(id === 'D') return x.social === 'MSB' ? ['D = MPB', '', 'demand (marginal private benefit)'] : ['D = MPB = MSB', '', 'demand (marginal private and social benefit)'];
        if(id === 'S') return x.social === 'MSC' ? ['S = MPC', '', 'supply (marginal private cost)'] : ['S = MPC = MSC', '', 'supply (marginal private and social cost)'];
        return null; },
      eq: ['D', 'S'], out: { x: 'quantity', y: 'price' }, mark: ['Q', 'P'],
      confuse: { x: ['realGdp', 'output', 'price'], y: ['priceLevel', 'quantity', 'cost'] }, curveConfuse: ['MR', 'MC'],
      points: { market: 'main', efficient: 'main' } },
    lorenz: { title: 'Lorenz curve', x: 'households', y: 'income',
      curves: function(){ return [{ id: 'EQ', shape: 'equality', at: 0, fixed: true }, { id: 'LC', shape: 'lorenz', at: 0 }]; },
      eq: null, out: null, confuse: { x: ['income', 'quantity', 'price'], y: ['households', 'price', 'quantity'] }, curveConfuse: ['PPC', 'D'] }
  };
  var TASKS = ['label', 'shift', 'equilibrium', 'point', 'line', 'shade'];
  var VERTICAL_SHIFT = { horizontal: 1, mc: 1, avc: 1, atc: 1, afc: 1, lratc: 1, lorenz: 1 };
  var MAX_STEPS = 3;
  function kindOf(spec){ var k = KINDS[spec && spec.kind]; if(!k) throw new Error('ApMicroGraph: unknown graph kind "' + (spec && spec.kind) + '" (one of ' + Object.keys(KINDS).join(', ') + ')'); return k; }
  function panelsOf(spec){ var k = kindOf(spec); return k.panels || [{ id: 'main', x: k.x, y: spec.kind === 'costs' && spec.line ? 'priceCost' : k.y }]; }   // a cost graph with a price on it (integration u3)
  function defsOf(spec){ return kindOf(spec).curves(spec || {}); }
  function axisOf(shape){ return VERTICAL_SHIFT[shape] ? 'y' : 'x'; }
  function isPpc(shape){ return shape === 'ppc' || shape === 'ppcline' || shape === 'ppcin'; }
  function dirWord(shape, steps){
    if(!steps) return 'none';
    if(isPpc(shape)) return steps > 0 ? 'out' : 'in';
    if(shape === 'lorenz') return steps > 0 ? 'toward equality' : 'away from equality';
    if(VERTICAL_SHIFT[shape]) return steps > 0 ? 'up' : 'down';
    return steps > 0 ? 'right' : 'left';
  }
  function dirSign(shape, dir){
    var plus = isPpc(shape) ? 'out' : VERTICAL_SHIFT[shape] ? 'up' : 'right', minus = isPpc(shape) ? 'in' : VERTICAL_SHIFT[shape] ? 'down' : 'left';
    if(shape === 'lorenz'){ if(dir === 'toward') return 1; if(dir === 'away') return -1; }
    return dir === plus ? 1 : dir === minus ? -1 : 0;
  }
  function movableIds(spec){ return defsOf(spec).filter(function(d){ return !d.follows && !d.fixed; }).map(function(d){ return d.id; }); }

  /* ---------------------------------------------------------- policies */
  // The shifts a policy draws by itself (a tax shifts S left by the tax), unless the student is asked to draw them.
  function fixedOffsets(spec){
    var off = {}, P = spec.policy, does = spec.do || [];
    Object.keys(spec.show || {}).forEach(function(c){ off[c] = spec.show[c]; });
    if(P && does.indexOf('shift') < 0){ if(P.type === 'tax') off.S = (off.S || 0) - taxSteps(spec); if(P.type === 'subsidy') off.S = (off.S || 0) + taxSteps(spec); }
    return off;
  }
  // A per-unit tax or subsidy of `amount` moves S up or down by amount: amount / (the slope of S) steps sideways.
  function taxSteps(spec){ var P = spec.policy || {}, kS = spec.slopes && (spec.kind === 'sd' || spec.kind === 'sd-micro') && spec.slopes.S ? +spec.slopes.S : 1; return (P.amount || 1) / kS; }
  function merge(a, b){ var o = {}, k; for(k in a || {}) o[k] = a[k]; for(k in b || {}) o[k] = (o[k] || 0) + b[k]; for(k in o) if(!o[k]) delete o[k]; return o; }

  /* ---------------------------------------------------------- geometry */
  function lineShares(spec){
    var e = spec.ends, x = e && +e.x > 0 ? +e.x : 1, yv = e && +e.y > 0 ? +e.y : 1, m = Math.max(x, yv);
    return [x / m, yv / m];
  }
  // A monocomp demand at its long-run position: tangent to ATC (the intercept 5 + at is min over q of ATC + q).
  function tangentAt(p){ var best = Infinity; for(var q = 0.3; q <= 10; q += 0.001){ var v = atcBase(p, q, 0, 0) + q; if(v < best) best = v; } return Math.round((best - 5) * 1e6) / 1e6; }
  function atcBase(p, q, o, s){ var F = Math.max(0.4, p.F + s * p.Fstep); return p.a - p.b * q + p.c * q * q + o + F / q; }
  function curves(spec, offsets){
    var start = spec.start || {}, off = offsets || {}, defs = defsOf(spec), line = spec.kind === 'ppc' && spec.linear, sh = line ? lineShares(spec) : null, out = [], by = {};
    defs.forEach(function(d){
      var o = { id: d.id, shape: d.shape, panel: d.panel || 'main', p: d.p, follows: d.follows, fixed: !!d.fixed, at: (d.at || 0) + (start[d.id] || 0) + (off[d.id] || 0), base: (d.at || 0) + (start[d.id] || 0), steps: off[d.id] || 0 };
      if(line && d.shape === 'ppc'){ o.shape = 'ppcline'; o.kx = sh[0]; o.ky = sh[1]; }
      if(spec.slopes && (spec.kind === 'sd' || spec.kind === 'sd-micro') && spec.slopes[d.id] && (d.shape === 'down' || d.shape === 'up')) o.k = +spec.slopes[d.id];
      out.push(o); by[d.id] = o;
    });
    defs.forEach(function(d){
      var o = by[d.id];
      if(d.follows && by[d.follows] && (d.shape === 'mr' || d.shape === 'mfc' || d.shape === 'avc')){ var L = by[d.follows]; o.at = L.at; o.base = L.base; o.steps = L.steps; }
      if(d.costOf || d.shape === 'avc'){ var M = by[d.costOf || d.follows]; o.o = M ? M.at : 0; }
      if(d.shape === 'atc') o.s = o.at;
      if(d.shape === 'afc' && by[d.follows]){ o.s = by[d.follows].at; o.steps = by[d.follows].steps; o.o = by[d.costOf] ? by[d.costOf].at : 0; }
      if(d.shape === 'mc' || d.shape === 'avc') o.o = d.shape === 'mc' ? o.at : o.o;
    });
    // A per-unit cost moves ATC with MC: drawn as a shift, its old place faded (AFC, a fixed cost, stays).
    defs.forEach(function(d){ var o = by[d.id], M = d.costOf && by[d.costOf]; if(d.shape === 'atc' && M && M.steps && !o.steps) o.steps = M.steps; });
    return out;
  }
  function find(list, id){ for(var i = 0; i < list.length; i++) if(list[i].id === id) return list[i]; return null; }
  function y(c, x){
    var v, p = c.p;
    if(c.shape === 'down') v = 5 - K(c) * (x - c.at);
    else if(c.shape === 'up') v = 5 + K(c) * (x - c.at);
    else if(c.shape === 'horizontal') v = c.at;
    else if(c.shape === 'mr') v = 5 + c.at - 2 * x;
    else if(c.shape === 'mfc') v = 5 - c.at + 2 * x;
    else if(c.shape === 'mc'){ if(x < 0) return null; v = p.a - 2 * p.b * x + 3 * p.c * x * x + c.at; }
    else if(c.shape === 'avc'){ if(x < 0.05) return null; v = p.a - p.b * x + p.c * x * x + (c.o || 0); }
    else if(c.shape === 'atc'){ if(x < 0.25) return null; v = p.a - p.b * x + p.c * x * x + (c.o || 0) + fixedCost(c) / x; }
    else if(c.shape === 'afc'){ if(x < 0.25) return null; v = fixedCost(c) / x; }
    else if(c.shape === 'lratc') v = 3 + c.at + 0.1 * Math.pow(x - 5, 2);
    else if(c.shape === 'equality') v = x;
    else if(c.shape === 'lorenz'){ var e = Math.max(1.08, 2.2 - 0.35 * c.at); v = 10 * Math.pow(Math.max(0, x) / 10, e); }
    else if(c.shape === 'ppc'){ if(x < 0 || x > c.at) return null; v = Math.sqrt(c.at * c.at - x * x); }
    else if(c.shape === 'ppcin'){ if(x < 0 || x > c.at) return null; var u = x / c.at; v = c.at * (1 - u) / (1 + 2 * u); }
    else if(c.shape === 'ppcline'){ var X = c.at * c.kx; if(x < 0 || x > X + 1e-9) return null; v = c.at * c.ky * (1 - x / X); }
    else return null;   // vertical: no height function
    return v;
  }
  // The steepness of a straight D or S (spec.slopes on sd and sd-micro; 1 everywhere else).
  function K(c){ return c && c.k ? c.k : 1; }
  function inBox(p){ return p[0] >= -1e-9 && p[0] <= 10 + 1e-9 && p[1] >= -1e-9 && p[1] <= 10 + 1e-9; }
  function r6(v){ return Math.round(v * 1e6) / 1e6; }
  // The x in [lo, hi] where f changes sign (bisection), or null.
  function root0(f, lo, hi){
    var flo = f(lo), fhi = f(hi);
    if(flo == null || fhi == null || isNaN(flo) || isNaN(fhi)) return null;
    if(Math.abs(flo) < 1e-12) return lo; if(Math.abs(fhi) < 1e-12) return hi;
    if(flo * fhi > 0) return null;
    for(var i = 0; i < 80; i++){ var m = (lo + hi) / 2, fm = f(m); if(flo * fm <= 0) hi = m; else { lo = m; flo = fm; } }
    return (lo + hi) / 2;
  }
  // Where a curve is lowest on [lo, hi]: [x, y].
  function lowest(c, lo, hi){
    var bx = null, by = Infinity;
    for(var x = lo; x <= hi + 1e-9; x += 0.01){ var v = y(c, x); if(v != null && v < by){ by = v; bx = x; } }
    if(bx == null) return null;
    var a = Math.max(lo, bx - 0.01), b = Math.min(hi, bx + 0.01);
    for(var i = 0; i < 60; i++){ var m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if(y(c, m1) < y(c, m2)) b = m2; else a = m1; }
    var xm = (a + b) / 2; return [xm, y(c, xm)];
  }
  // A curve's x at height v (on its rising part for U shapes).
  function xAt(c, v){
    if(c.shape === 'vertical') return c.at;
    var lo = 0, hi = 10;
    if(c.shape === 'mc' || c.shape === 'atc' || c.shape === 'avc' || c.shape === 'lratc'){ var m = lowest(c, 0.3, 10); if(m) lo = m[0]; }
    return root0(function(x){ var h = y(c, x); return h == null ? null : h - v; }, lo, hi);
  }
  function cross(a, b, lo, hi){
    if(!a || !b) return null;
    if(a.shape === 'vertical' && b.shape === 'vertical') return null;
    if(a.shape === 'vertical' || b.shape === 'vertical'){ var v = a.shape === 'vertical' ? a : b, o = v === a ? b : a, h = y(o, v.at); return h == null ? null : [v.at, h]; }
    if(a.shape === 'down' && b.shape === 'up'){ if(K(a) === 1 && K(b) === 1) return [(a.at + b.at) / 2, 5 + (a.at - b.at) / 2]; var xk = (K(a) * a.at + K(b) * b.at) / (K(a) + K(b)); return [xk, 5 + K(b) * (xk - b.at)]; }
    if(a.shape === 'up' && b.shape === 'down') return cross(b, a);
    var x = root0(function(t){ var p = y(a, t), q = y(b, t); return p == null || q == null ? null : p - q; }, lo == null ? 0.3 : lo, hi == null ? 10 : hi);
    return x == null ? null : [x, y(a, x)];
  }
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
    (key.shifts || []).forEach(function(s){ var c = find(cs, s.curve); if(c) off[s.curve] = (off[s.curve] || 0) + dirSign(c.shape, s.dir) * (s.steps || 1); });
    return off;
  }

  /* ------------------------------------------------------- lines */
  // The graph's horizontal price or wage line: its id, panel and whether it
  // follows the market (pc, labor), or null when the graph has none.
  function lineDef(spec){
    var k = kindOf(spec), d = k.line ? { id: k.line.id, panel: k.line.panel, link: k.line.link } : null;
    if(spec.line){ d = d || {}; d.id = spec.line.id || d.id; d.panel = spec.line.panel || d.panel || 'main'; d.at = spec.line.at; if(spec.line.at != null && spec.kind !== 'pc' && spec.kind !== 'labor') d.link = false; }
    return d;
  }
  // The line's height: the student's (a line task), else the market's price as drawn (pc, labor), else spec.line.at.
  function lineAt(spec, state){
    var d = lineDef(spec); state = state || {};
    if(!d) return null;
    if((spec.do || []).indexOf('line') > -1 && state.line != null) return state.line;
    if(d.link){ var e = eq(spec, state.shifts || {}); return e ? e[1] : null; }
    return d.at != null ? d.at : null;
  }
  function lineStart(spec){
    var d = lineDef(spec); if(!d) return null;
    if(d.at != null) return d.at;
    var e = eq(spec, {}); return e ? e[1] : 5;
  }

  /* ------------------------------------------------------- named points */
  function named(spec, offsets, name, line){
    var cs = curves(spec, offsets || {}), k = kindOf(spec), g = function(id){ return find(cs, id); }, L = line;
    if(L == null) L = lineAt(spec, { shifts: offsets || {} });
    var D = g('D'), MR = g('MR'), MC = g('MC'), ATC = g('ATC'), p;
    switch(name){
      case 'eq': case 'market': return eq(spec, offsets);
      case 'min-atc': p = ATC && lowest(ATC, 0.3, 10); return p && [r6(p[0]), r6(p[1])];
      case 'min-avc': var A = g('AVC'); p = A && lowest(A, 0.3, 10); return p && [r6(p[0]), r6(p[1])];
      case 'min-mc': p = MC && lowest(MC, 0, 10); return p && [r6(p[0]), r6(p[1])];
      case 'mes': var LR = g('LRATC'); p = LR && lowest(LR, 0, 10); return p && [r6(p[0]), r6(p[1])];
      case 'firm':
        if(spec.kind === 'labor'){ var R = g('MRP'); if(L == null || !R) return null; var xr = xAt(R, L); return xr == null ? null : [r6(xr), r6(L)]; }
        if(!MC || L == null) return null;
        // Below the minimum of AVC the firm shuts down: it produces nothing (integration u3).
        var AV = g('AVC'), mv = AV && lowest(AV, 0.3, 10); if(mv && L < mv[1] - 1e-9) return [0, r6(L)];
        var xf = xAt(MC, L); return xf == null ? null : [r6(xf), r6(L)];
      case 'mr=mc': p = cross(MR, MC, MC && lowest(MC, 0, 10)[0], 10); return p && [r6(p[0]), r6(p[1])];
      case 'profit-max': p = cross(MR, MC, MC && lowest(MC, 0, 10)[0], 10); return p && [r6(p[0]), r6(y(D, p[0]))];
      case 'allocative': p = cross(D, MC, MC && lowest(MC, 0, 10)[0], 10); return p && [r6(p[0]), r6(p[1])];
      case 'revenue-max': if(!MR) return null; var x0 = root0(function(x){ return y(MR, x); }, 0, 10); return x0 == null ? null : [r6(x0), r6(y(D, x0))];
      case 'fair-return': if(!D || !ATC) return null; var xa = null, gap = function(x){ return y(D, x) - y(ATC, x); };
        // The larger quantity where demand meets ATC (scanned from the right).
        for(var xs = 10; xs > 0.35; xs -= 0.05){ var g1 = gap(xs), g0 = gap(xs - 0.05); if(g1 != null && g0 != null && g1 * g0 <= 0){ xa = root0(gap, xs - 0.05, xs); break; } }
        return xa == null ? null : [r6(xa), r6(y(D, xa))];
      case 'hire': var mf = cross(g('MFC'), g('MRP')); return mf && [r6(mf[0]), r6(y(g('SL'), mf[0]))];
      case 'mrp=mfc': var mf2 = cross(g('MFC'), g('MRP')); return mf2 && [r6(mf2[0]), r6(mf2[1])];
      case 'competitive': var cp = cross(g('MRP'), g('SL')); return cp && [r6(cp[0]), r6(cp[1])];
      case 'min-wage': if(L == null) return null; var qs = xAt(g('SL'), L), qd = xAt(g('MRP'), L); if(qs == null || qd == null) return null; return [r6(Math.min(qs, qd)), r6(L)];
      case 'unit-elastic': if(!D) return null; var xu = (5 + D.at) / 2; return [r6(xu), r6(y(D, xu))];   // the midpoint of a straight demand
      case 'at-price': if(!D || L == null) return null; var xp = xAt(D, L); return xp == null ? null : [r6(xp), r6(L)];
      case 'efficient': var e = extOf(spec), X = EXT[e.type] || EXT['neg-prod'], s = g(X.social), o = X.of === 'S' ? g('D') : g('S'); p = cross(X.of === 'S' ? o : s, X.of === 'S' ? s : o); return p && [r6(p[0]), r6(p[1])];
    }
    void k;
    return null;
  }
  function pointPanel(spec, name){ var k = kindOf(spec); return (k.points && k.points[name]) || (k.panels ? k.panels[0].id : 'main'); }

  /* ------------------------------------------------------------- areas */
  /* A band: the cell between a top and a bottom boundary from x0 to x1, each
     boundary a curve or a constant height; sampled, so curved edges (MC, D)
     are followed. */
  function band(top, bot, x0, x1){
    var f = function(b, x){ return typeof b === 'number' ? b : typeof b === 'function' ? b(x) : y(b, x); };
    var n = 24, upper = [], lower = [];
    if(!(x1 > x0 + 1e-6)) return null;
    for(var i = 0; i <= n; i++){ var x = x0 + (x1 - x0) * i / n, t = f(top, x), b = f(bot, x); if(t == null || b == null) return null; upper.push([x, Math.min(10, Math.max(0, t))]); lower.push([x, Math.min(10, Math.max(0, b))]); }
    return upper.concat(lower.reverse());
  }
  function polyArea(poly){ var a = 0; for(var i = 0; i < poly.length; i++){ var p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; }
  /* Every cell of the graph as drawn for a shading item (start, show and the
     policy's own shifts), and the named regions each cell belongs to. */
  function areas(spec, offsets){
    var off = offsets || fixedOffsets(spec), cs0 = curves(spec, {}), cs = curves(spec, off), cells = [], regions = {};
    var add = function(id, poly, panel){ if(poly && polyArea(poly) > 0.02) cells.push({ id: id, poly: poly, panel: panel || 'main' }); };
    var reg = function(name, ids){ var have = cells.map(function(c){ return c.id; }), got = ids.filter(function(i){ return have.indexOf(i) > -1; }); if(got.length) regions[name] = got; };
    // The market before the policy, as drawn: start and spec.show (a shown shift moves the areas too, integration 10).
    var shown = spec.show || {}, csS = curves(spec, shown);
    var D0 = find(csS, 'D'), S0 = find(csS, 'S'), mn = function(a, b){ return function(x){ return Math.min(y(a, x), y(b, x)); }; }, mxf = function(a, b){ return function(x){ return Math.max(y(a, x), y(b, x)); }; };
    if(spec.kind === 'sd-micro' || spec.kind === 'sd'){
      var E = cross(D0, S0), Qe = E[0], Pe = E[1], P = spec.policy;
      if(!P){ add('a', band(D0, Pe, 0, Qe)); add('b', band(Pe, S0, 0, Qe)); reg('cs', ['a']); reg('ps', ['b']); reg('ts', ['a', 'b']); }
      else if(P.type === 'ceiling' || P.type === 'floor' || P.type === 'tax'){
        var Q1 = P.type === 'ceiling' ? xAt(S0, P.at) : P.type === 'floor' ? xAt(D0, P.at) : cross(D0, find(curves(spec, merge(shown, { S: -taxSteps(spec) })), 'S'))[0];
        if(Q1 != null && Q1 < Qe - 1e-6){
          var Pt = y(D0, Q1), Pb = y(S0, Q1);
          add('a', band(D0, Pt, 0, Q1)); add('b', band(Pt, Pe, 0, Q1)); add('c', band(D0, Pe, Q1, Qe)); add('d', band(Pe, Pb, 0, Q1)); add('e', band(Pe, S0, Q1, Qe)); add('f', band(Pb, S0, 0, Q1));
          reg('cs-before', ['a', 'b', 'c']); reg('ps-before', ['d', 'e', 'f']); reg('dwl', ['c', 'e']);
          if(P.type === 'ceiling'){ reg('cs', ['a', 'b', 'd']); reg('ps', ['f']); reg('ts', ['a', 'b', 'd', 'f']); reg('transfer', ['d']); }
          if(P.type === 'floor'){ reg('cs', ['a']); reg('ps', ['b', 'd', 'f']); reg('ts', ['a', 'b', 'd', 'f']); reg('transfer', ['b']); }
          if(P.type === 'tax'){ reg('cs', ['a']); reg('ps', ['f']); reg('tax-revenue', ['b', 'd']); reg('buyer-burden', ['b']); reg('seller-burden', ['d']); }
        }
      } else if(P.type === 'subsidy'){
        var Q2 = cross(D0, find(curves(spec, merge(shown, { S: taxSteps(spec) })), 'S'))[0], Pc = y(D0, Q2), Pp = y(S0, Q2);
        add('a', band(D0, Pe, 0, Qe)); add('b', band(Pe, Pc, 0, Qe)); add('c', band(D0, Pc, Qe, Q2)); add('d', band(Pe, S0, 0, Qe)); add('e', band(Pp, Pe, 0, Qe)); add('f', band(Pp, S0, Qe, Q2)); add('g', band(S0, D0, Qe, Q2));
        reg('cs', ['a', 'b', 'c']); reg('ps', ['d', 'e', 'f']); reg('subsidy-cost', ['b', 'c', 'e', 'f', 'g']); reg('dwl', ['g']); reg('cs-before', ['a']); reg('ps-before', ['d']);
      } else if(P.type === 'world' && P.at < Pe){
        var Qs = xAt(S0, P.at), Qd = xAt(D0, P.at);
        add('a', band(D0, Pe, 0, Qe)); add('b', band(Pe, P.at, 0, Qs)); add('c', band(Pe, S0, Qs, Qe)); add('d', band(mn(D0, S0), P.at, Qs, Qd)); add('e', band(P.at, S0, 0, Qs));
        reg('cs', ['a', 'b', 'c', 'd']); reg('ps', ['e']); reg('gain', ['d']); reg('cs-before', ['a']); reg('ps-before', ['b', 'c', 'e']); reg('ts', ['a', 'b', 'c', 'd', 'e']);
      } else if(P.type === 'world'){
        var Qd2 = xAt(D0, P.at), Qs2 = xAt(S0, P.at);
        add('a', band(D0, P.at, 0, Qd2)); add('b', band(P.at, Pe, 0, Qd2)); add('c', band(D0, Pe, Qd2, Qe)); add('d', band(P.at, mxf(D0, S0), Qd2, Qs2)); add('e', band(Pe, S0, 0, Qe));
        reg('cs', ['a']); reg('ps', ['b', 'c', 'd', 'e']); reg('gain', ['d']); reg('cs-before', ['a', 'b', 'c']); reg('ps-before', ['e']); reg('ts', ['a', 'b', 'c', 'd', 'e']);
      } else if(P.type === 'tariff'){
        var Pw = P.at, Ptf = P.at + (P.amount || 1), qs1 = xAt(S0, Pw), qs2 = xAt(S0, Ptf), qd2 = xAt(D0, Ptf), qd1 = xAt(D0, Pw);
        add('a', band(D0, Ptf, 0, qd2)); add('b', band(Ptf, Pw, 0, qs1)); add('c', band(Ptf, S0, qs1, qs2)); add('d', band(S0, Pw, qs1, qs2)); add('e', band(Ptf, Pw, qs2, qd2)); add('f', band(D0, Pw, qd2, qd1)); add('g', band(Pw, S0, 0, qs1));
        reg('cs', ['a']); reg('ps', ['b', 'c', 'g']); reg('tariff-revenue', ['e']); reg('dwl', ['d', 'f']); reg('cs-before', ['a', 'b', 'c', 'd', 'e', 'f']); reg('ps-before', ['g']);
      }
    } else if(spec.kind === 'pc'){
      var L = lineAt(spec, { shifts: off }), MC = find(cs, 'MC'), ATC = find(cs, 'ATC'), fq = L == null ? null : named(spec, off, 'firm', L), q = fq ? fq[0] : null;
      if(q != null && q > 0){
        var A = y(ATC, q), hi = Math.max(L, A), lo = Math.min(L, A);
        if(Math.abs(L - A) > 0.05) add('a', band(hi, lo, 0, q), 'firm');
        add('b', band(lo, 0, 0, q), 'firm');
        if(L > A + 0.05){ reg('profit', ['a']); reg('tr', ['a', 'b']); reg('tc', ['b']); }
        else if(L < A - 0.05){ reg('loss', ['a']); reg('tr', ['b']); reg('tc', ['a', 'b']); }
        else { reg('tr', ['b']); reg('tc', ['b']); }
      }
    } else if(spec.kind === 'monopoly' || spec.kind === 'monocomp'){
      var D = find(cs, 'D'), MCm = find(cs, 'MC'), ATCm = find(cs, 'ATC'), pm = named(spec, off, 'profit-max'), al = named(spec, off, 'allocative');
      var Pr = spec.kind === 'monopoly' && spec.line && spec.line.at != null ? spec.line.at : null;
      if(pm && Pr != null && Pr < pm[1] - 0.05){
        /* A regulated price (a ceiling Pr below the monopoly price, integration 8): MR is Pr out to demand, so the
           firm sells Q where Pr meets demand or MC, whichever comes first. Same region names, after the regulation:
           cs under demand above Pr, profit or loss between Pr and ATC, dwl between demand and MC out to D = MC. */
        var qd = xAt(D, Pr), qc = xAt(MCm, Pr), Qr = qd == null ? qc : qc == null ? qd : Math.min(qd, qc);
        if(Qr != null){
          var Ar = y(ATCm, Qr), hr = Math.max(Pr, Ar), lr = Math.min(Pr, Ar);
          add('a', band(D, Pr, 0, Qr));
          if(Math.abs(Pr - Ar) > 0.05) add('b', band(hr, lr, 0, Qr));
          add('c', band(lr, 0, 0, Qr));
          if(al && al[0] > Qr + 0.05) add('d', band(D, MCm, Qr, al[0]));
          reg('cs', ['a']); reg('dwl', ['d']);
          if(Pr > Ar + 0.05){ reg('profit', ['b']); reg('tr', ['b', 'c']); reg('tc', ['c']); }
          else if(Pr < Ar - 0.05){ reg('loss', ['b']); reg('tr', ['c']); reg('tc', ['b', 'c']); }
          else { reg('tr', ['c']); reg('tc', ['c']); }
        }
      } else if(pm){
        var Qm = pm[0], Pm = pm[1], Am = y(ATCm, Qm), hm = Math.max(Pm, Am), lm = Math.min(Pm, Am);
        add('a', band(D, Pm, 0, Qm));
        if(Math.abs(Pm - Am) > 0.05) add('b', band(hm, lm, 0, Qm));
        add('c', band(lm, 0, 0, Qm));
        if(al && al[0] > Qm + 0.05) add('d', band(D, MCm, Qm, al[0]));
        reg('cs', ['a']); reg('dwl', ['d']);
        if(Pm > Am + 0.05){ reg('profit', ['b']); reg('tr', ['b', 'c']); reg('tc', ['c']); }
        else if(Pm < Am - 0.05){ reg('loss', ['b']); reg('tr', ['c']); reg('tc', ['b', 'c']); }
        else { reg('tr', ['c']); reg('tc', ['c']); }
      }
    } else if(spec.kind === 'monopsony'){
      var h = named(spec, off, 'hire'), c2 = named(spec, off, 'competitive'), SL = find(cs, 'SL'), MRP = find(cs, 'MRP');
      if(h){ add('a', band(h[1], 0, 0, h[0])); if(c2 && c2[0] > h[0]) add('b', band(MRP, SL, h[0], c2[0])); reg('wage-bill', ['a']); reg('dwl', ['b']); }
    } else if(spec.kind === 'externality'){
      /* The market quantity comes from D and S as shown (a corrective tax or subsidy drawn with spec.show), the social
         curve stays put (integration 10). b: between the social and private curves out to the smaller quantity;
         a (dwl) and c between the two quantities. The external cost counts the units produced (0 to the market
         quantity), the external benefit runs to the efficient quantity, as before; over-correction leaves a dwl on
         the other side and nothing in c. */
      var ex = extOf(spec), X = EXT[ex.type] || EXT['neg-prod'], Dx = find(cs, 'D'), Sx = find(cs, 'S'), Soc = find(cs, X.social);
      var Pv = find(cs0, X.of), Oc = X.of === 'S' ? Dx : Sx, m = cross(Dx, Sx), ef = cross(Soc, Oc);
      if(m && ef){
        var mq = m[0], eq0 = ef[0], lo2 = Math.min(mq, eq0), hi2 = Math.max(mq, eq0), neg = ex.type === 'neg-prod' || ex.type === 'neg-cons', natural = neg ? mq > eq0 : mq < eq0;
        add('b', band(mxf(Soc, Pv), mn(Soc, Pv), 0, lo2));
        if(hi2 - lo2 > 1e-6){ add('a', band(mxf(Soc, Oc), mn(Soc, Oc), lo2, hi2)); if(natural) add('c', band(mxf(Oc, Pv), mn(Oc, Pv), lo2, hi2)); }
        reg('dwl', ['a']); reg(neg ? 'ext-cost' : 'ext-benefit', natural ? ['a', 'b', 'c'] : ['b']);
      }
    } else if(spec.kind === 'demand'){
      // At the price line: a is total revenue (P x Q), b the consumer surplus above it.
      var Dd = find(cs, 'D'), Pd = lineDef(spec) ? lineDef(spec).at : null, Qd = Pd == null ? null : xAt(Dd, Pd);
      if(Qd != null){ add('a', band(Pd, 0, 0, Qd)); add('b', band(Dd, Pd, 0, Qd)); reg('tr', ['a']); reg('cs', ['b']); }
    } else if(spec.kind === 'lorenz'){
      var EQc = find(cs, 'EQ'), LC = find(cs, 'LC');
      add('a', band(EQc, LC, 0, 10)); add('b', band(LC, 0, 0, 10)); reg('gini', ['a']); reg('below', ['b']);
    }
    return { cells: cells, regions: regions };
  }
  // The region words used in feedback and in check messages.
  var REGION = {
    cs: 'consumer surplus', ps: 'producer surplus', ts: 'total surplus', dwl: 'deadweight loss', 'tax-revenue': 'the tax revenue',
    'subsidy-cost': 'the cost of the subsidy to the government', 'tariff-revenue': 'the tariff revenue', 'cs-before': 'consumer surplus before the change',
    'ps-before': 'producer surplus before the change', transfer: 'the surplus moved from one side of the market to the other', gain: 'the gain from trade',
    'buyer-burden': "the buyers' share of the tax", 'seller-burden': "the sellers' share of the tax", profit: 'the economic profit', loss: 'the economic loss',
    tr: 'total revenue', tc: 'total cost', 'wage-bill': 'the wage bill', 'ext-cost': 'the total external cost', 'ext-benefit': 'the total external benefit',
    gini: 'the area between the line of equality and the Lorenz curve', below: 'the area under the Lorenz curve'
  };
  var REGION_HINT = {
    dwl: 'Deadweight loss lies between the demand (or MSB) curve and the supply (or MC, MSC) curve, from the quantity actually traded to the efficient quantity.',
    cs: 'Consumer surplus lies under the demand curve and above the price buyers pay, out to the quantity traded.',
    ps: 'Producer surplus lies above the supply curve and below the price sellers keep, out to the quantity traded.',
    'tax-revenue': 'Tax revenue is the rectangle between the price buyers pay and the price sellers keep, out to the quantity after the tax.',
    'subsidy-cost': 'The cost of a subsidy is the whole rectangle between the price sellers receive and the price buyers pay, out to the NEW, larger quantity.',
    'tariff-revenue': 'Tariff revenue is the rectangle between the world price and the price with the tariff, over the imports after the tariff.',
    profit: 'Profit is the rectangle between the price and ATC at the profit-maximizing quantity, from zero to that quantity.',
    loss: 'A loss is the rectangle between ATC and the price at the quantity where MR = MC, from zero to that quantity.',
    'wage-bill': 'The wage bill is the wage times the workers hired: the rectangle under the wage, out to the number hired.'
  };
  function regionCells(spec, names){
    var R = areas(spec).regions, out = [];
    [].concat(names || []).forEach(function(n){ (R[n] || []).forEach(function(c){ if(out.indexOf(c) < 0) out.push(c); }); });
    return out.sort();
  }

  /* ------------------------------------------------------------- answers */
  function keyLine(spec){
    var K = (spec.key || {}).line || {}, off = keyOffsets(spec);
    if(K.at != null) return K.at;
    if(K.to === 'eq'){ var e = eq(spec, off); return e ? e[1] : null; }
    if(K.to){ var p = named(spec, off, K.to); return p ? p[1] : null; }
    if(K.side){ var e0 = eq(spec, off) || [5, 5]; return K.side === 'above' ? e0[1] + 1.5 : e0[1] - 1.5; }
    return null;
  }
  function slotAnswer(spec, slot){
    var ps = panelsOf(spec);
    if(slot === 'x') return ps[0].x; if(slot === 'y') return ps[0].y;
    if(slot === 'fx') return ps[1] && ps[1].x; if(slot === 'fy') return ps[1] && ps[1].y;
    return slot;
  }
  function keyResponse(spec){
    var does = spec.do || [], key = spec.key || {}, off = keyOffsets(spec), labels = {};
    if(does.indexOf('label') > -1) labelSlots(spec).forEach(function(s){ labels[s] = slotAnswer(spec, s); });
    var r = { shifts: off, eq: does.indexOf('equilibrium') > -1 ? eq(spec, off) : null, point: null, labels: labels, line: null, shade: [] };
    if(does.indexOf('line') > -1) r.line = keyLine(spec);
    if(does.indexOf('shade') > -1) r.shade = regionCells(spec, key.shade);
    var P = key.point;
    if(does.indexOf('point') > -1 && P){
      var allOff = merge(fixedOffsets(spec), off);
      if(P.at) r.point = named(spec, allOff, P.at, does.indexOf('line') > -1 ? r.line : null);
      else if(P.region){ var c = find(curves(spec, {}), 'PPC'), ax = c.shape === 'ppcline' ? c.at * c.kx / 2 : c.shape === 'ppcin' ? c.at * 0.29 : c.at / Math.SQRT2, ay = c.shape === 'ppcline' ? c.at * c.ky / 2 : c.shape === 'ppcin' ? y(c, c.at * 0.29) : c.at / Math.SQRT2;
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
      /* dl: the perpendicular distance to the line. The "on" band is 0.4, narrower on a flat line (8% of the shorter
         intercept, integration u1) and never under 0.2, so a point placed on the quarter-step grid can still be on. */
      var X = c.at * c.kx, Y = c.at * c.ky, dl = (p[0] / X + p[1] / Y - 1) * X * Y / Math.hypot(X, Y), band = Math.max(0.2, Math.min(0.4, 0.08 * Math.min(X, Y)));
      return Math.abs(dl) <= band ? 'on' : dl < 0 ? 'inside' : 'outside';
    }
    if(c.shape === 'ppcin'){
      var dd = distTo(c, p), below = p[0] > c.at || y(c, p[0]) == null ? false : p[1] < y(c, p[0]);
      return dd <= 0.4 ? 'on' : below || (p[0] <= c.at && p[1] < y(c, Math.min(c.at, p[0]))) ? 'inside' : 'outside';
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
  function labelSlots(spec){
    var ps = panelsOf(spec), out = ['x', 'y'];
    if(ps.length > 1) out.push('fx', 'fy');
    defsOf(spec).forEach(function(d){ out.push(d.id); });
    var L = lineDef(spec); if(L && (kindOf(spec).line || ((spec.kind === 'costs' || spec.kind === 'demand') && spec.line))) out.push(L.id);
    return out;
  }
  function labelOptions(spec, slot){
    var k = kindOf(spec), ps = panelsOf(spec);
    if(slot === 'x' || slot === 'y' || slot === 'fx' || slot === 'fy'){ var right = slotAnswer(spec, slot), conf = (k.confuse[slot] || k.confuse[slot.slice(-1)] || []).filter(function(c){ return c !== right; }); if(slot === 'y' && right !== k.y && conf.indexOf(k.y) < 0) conf.unshift(k.y); void ps; return [right].concat(conf.slice(0, 3)); }
    var L = lineDef(spec);
    if(L && slot === L.id) return [L.id].concat(k.lineConfuse || ['Dd', 'MR', 'S']);
    var ids = defsOf(spec).map(function(d){ return d.id; });
    return ids.concat(k.curveConfuse.filter(function(c){ return ids.indexOf(c) < 0; }));
  }
  function optionText(spec, slot, id){
    if(slot === 'x' || slot === 'y' || slot === 'fx' || slot === 'fy') return labelText(id, spec.names);
    var c = curveText(spec, id);
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
    var has = function(t){ return does.indexOf(t) > -1; };
    if(has('point') && has('shift') && !(spec.key && spec.key.point && spec.key.point.at)) bad('graph.do: "point" and "shift" are separate items (except a named point, key.point.at, read off the curves as drawn)');
    if(has('equilibrium') && !has('shift')) bad('graph.do: "equilibrium" marks the new equilibrium after a shift, so it needs "shift"');
    if(has('equilibrium') && !k.eq) bad('graph.do: a ' + spec.kind + ' graph has no market equilibrium (use "point" with key.point.at)');
    if(has('shade') && does.some(function(t){ return t !== 'shade' && t !== 'label'; })) bad('graph.do: "shade" goes with "label" only: draw the graph to shade with start, show or policy');
    var ids = defsOf(spec).map(function(d){ return d.id; }), mov = movableIds(spec);
    Object.keys(spec.start || {}).forEach(function(c){ if(ids.indexOf(c) < 0) bad('graph.start: unknown curve "' + c + '" (a ' + spec.kind + ' graph has ' + ids.join(', ') + ')'); else if(!Number.isInteger(spec.start[c]) || Math.abs(spec.start[c]) > MAX_STEPS) bad('graph.start.' + c + ' is a whole number of steps from -3 to 3'); });
    Object.keys(spec.show || {}).forEach(function(c){ if(mov.indexOf(c) < 0) bad('graph.show: "' + c + '" is not a curve that moves on a ' + spec.kind + ' graph'); else if(!Number.isInteger(spec.show[c]) || Math.abs(spec.show[c]) > MAX_STEPS) bad('graph.show.' + c + ' is a whole number of steps from -3 to 3'); });
    if(spec.kind === 'ppc' && (!spec.names || !spec.names.x || !spec.names.y)) bad('graph.names.x and .y name the two goods of a PPC');
    if(spec.bow !== undefined && (spec.kind !== 'ppc' || spec.bow !== 'in' || spec.linear)) bad('graph.bow: "in" (a bowed-in PPC, decreasing opportunity cost) is for a ppc graph that is not linear');
    if(spec.pointMarks !== undefined && (typeof spec.pointMarks !== 'object' || !['x', 'y'].some(function(a){ return spec.pointMarks[a]; }) || Object.keys(spec.pointMarks).some(function(a){ return ['x', 'y'].indexOf(a) < 0 || !/^[A-Za-z*]{1,3}(_[A-Za-z0-9*]{1,4})?$/.test(String(spec.pointMarks[a])); }))) bad('graph.pointMarks { x: "Q_M", y: "P_M" } marks a placed point on the axes (a letter or two, then _ and its subscript)');
    if(spec.linear !== undefined && (spec.kind !== 'ppc' || typeof spec.linear !== 'boolean')) bad('graph.linear (true: a straight-line PPC, constant opportunity cost) is for a ppc graph');
    if(spec.ends !== undefined && (!spec.linear || !(+spec.ends.x > 0) || !(+spec.ends.y > 0))) bad('graph.ends { x, y } gives a straight PPC\'s intercepts (the most of each good, both positive) and needs linear: true');
    if(spec.policy !== undefined){
      var P = spec.policy || {};
      if(spec.kind !== 'sd-micro') bad('graph.policy is for an sd-micro graph');
      else if(POLICIES.indexOf(P.type) < 0) bad('graph.policy.type is one of ' + POLICIES.join(', '));
      else {
        var e0 = eq(spec, {});
        if((P.type === 'tax' || P.type === 'subsidy' || P.type === 'tariff') && !(Number.isInteger(P.amount) && P.amount >= 1 && P.amount <= 3)) bad('graph.policy.amount is the per-unit ' + P.type + ' in whole steps, 1 to 3');
        if(P.type === 'ceiling' && !(P.at < e0[1] - 0.4 && P.at > 0.4)) bad('graph.policy.at: a binding price ceiling sits below the equilibrium price (' + e0[1] + ') and above 0');
        if(P.type === 'floor' && !(P.at > e0[1] + 0.4 && P.at < 9.6)) bad('graph.policy.at: a binding price floor sits above the equilibrium price (' + e0[1] + ')');
        if((P.type === 'world' || P.type === 'tariff') && !(P.at > 0.4 && P.at < 9.6 && Math.abs(P.at - e0[1]) > 0.4)) bad('graph.policy.at is the world price, away from the domestic equilibrium price (' + e0[1] + ')');
        if(P.type === 'tariff' && !(P.at + (P.amount || 1) < e0[1] - 0.2)) bad('graph.policy: the world price plus the tariff stays below the domestic equilibrium price (the country still imports)');
        if(has('shift') && (P.type === 'tax' || P.type === 'subsidy')) { var ks = ((spec.key || {}).shifts || [])[0]; if(!ks || ks.curve !== 'S') bad('graph.key.shifts: a per-unit ' + P.type + ' on sellers shifts S'); }
      }
    }
    if(spec.slopes !== undefined){
      var SLOPES = [0.5, 1, 2];
      if((spec.kind !== 'sd' && spec.kind !== 'sd-micro') || typeof spec.slopes !== 'object' || !Object.keys(spec.slopes).length || Object.keys(spec.slopes).some(function(c){ return ['D', 'S'].indexOf(c) < 0 || SLOPES.indexOf(spec.slopes[c]) < 0; })) bad('graph.slopes { D, S } sets how steep demand and supply are (0.5, 1 or 2; 1 is the usual 45 degrees) on an sd or sd-micro graph');
      else if(spec.policy && (spec.policy.type === 'tax' || spec.policy.type === 'subsidy')){ var e9 = eq(spec, fixedOffsets(spec)); if(!e9 || !inBox(e9) || e9[0] < 0.5) bad('graph.slopes: with this ' + spec.policy.type + ' the market leaves the graph; use a smaller amount'); }
    }
    if(spec.ext !== undefined && (spec.kind !== 'externality' || !EXT[(spec.ext || {}).type] || (spec.ext.gap != null && !(Number.isInteger(spec.ext.gap) && spec.ext.gap >= 1 && spec.ext.gap <= 3)))) bad('graph.ext { type: ' + Object.keys(EXT).join(' | ') + ', gap: 1-3 } is for an externality graph');
    if(spec.kind === 'externality' && !spec.ext) bad('graph.ext.type names the externality (' + Object.keys(EXT).join(', ') + ')');
    if(spec.run !== undefined && (spec.kind !== 'monocomp' || ['short', 'long'].indexOf(spec.run) < 0)) bad('graph.run (short or long) is for a monocomp graph');
    if(spec.natural !== undefined && (spec.kind !== 'monopoly' || typeof spec.natural !== 'boolean')) bad('graph.natural (true: a natural monopoly, ATC falling over the demand range) is for a monopoly graph');
    if(spec.set !== undefined && (spec.kind !== 'costs' || ['short', 'long'].indexOf(spec.set) < 0)) bad('graph.set (short or long) is for a costs graph');
    if(spec.afc !== undefined && (spec.kind !== 'costs' || spec.set === 'long')) bad('graph.afc draws AFC on a short-run costs graph');
    var key = spec.key || {};
    if(has('shift')){
      if(!Array.isArray(key.shifts) || !key.shifts.length) bad('graph.key.shifts lists each curve that moves and its direction');
      var seen = {};
      (key.shifts || []).forEach(function(s, i){
        var c = find(curves(spec, {}), s.curve);
        if(!c){ bad('graph.key.shifts[' + i + ']: unknown curve "' + s.curve + '"'); return; }
        if(mov.indexOf(s.curve) < 0){ bad('graph.key.shifts[' + i + ']: ' + s.curve + ' moves with ' + (c.follows || 'nothing') + ' and is not shifted on its own'); return; }
        if(seen[s.curve]) bad('graph.key.shifts: ' + s.curve + ' is listed twice'); seen[s.curve] = 1;
        if(!dirSign(c.shape, s.dir)) bad('graph.key.shifts[' + i + ']: ' + s.curve + ' shifts ' + (isPpc(c.shape) ? 'out or in' : c.shape === 'lorenz' ? 'toward or away (from equality)' : VERTICAL_SHIFT[c.shape] ? 'up or down' : 'right or left') + ', not "' + s.dir + '"');
        if(s.steps !== undefined && !(Number.isInteger(s.steps) && s.steps >= 1 && s.steps <= MAX_STEPS)) bad('graph.key.shifts[' + i + '].steps is 1 to 3 (drawn by the key; never graded)');
        var at = c.at + dirSign(c.shape, s.dir) * (s.steps || 1);
        if(!VERTICAL_SHIFT[c.shape] && (at < 1 || at > 9)) bad('graph.key.shifts[' + i + ']: the shifted ' + s.curve + ' leaves the graph; move graph.start');
      });
      if(!key.because || String(key.because).length < 8) bad('graph.key.because names the cause in a few words ("a rise in input costs"), for the slip feedback');
      (key.alt || []).forEach(function(set, j){
        if(!Array.isArray(set) || !set.length){ bad('graph.key.alt[' + j + '] is a list of { curve, dir } shifts'); return; }
        set.forEach(function(s){ var c = find(curves(spec, {}), s.curve); if(!c || !dirSign(c.shape, s.dir)) bad('graph.key.alt[' + j + ']: ' + s.curve + ' ' + s.dir + ' is not a shift of this graph'); });
      });
    }
    if(key.outcome){
      if(!k.out) bad('graph.key.outcome: a ' + spec.kind + ' graph has no market equilibrium');
      else {
        var got = outcome(spec, keyOffsets(spec)) || {}, indet = indeterminate(spec, key.shifts), hold = key.hold || [];
        Object.keys(key.outcome).forEach(function(w){
          if(!(w in got)) bad('graph.key.outcome: "' + w + '" is not an axis of this graph (' + k.out.x + ', ' + k.out.y + ')');
          else if(DIRS.indexOf(key.outcome[w]) < 0) bad('graph.key.outcome.' + w + ' is up, down or same');
          else if(indet.indexOf(w) > -1 && !(hold.indexOf(w) > -1 && key.outcome[w] === 'same')) bad('graph.key.outcome.' + w + ': with these shifts the ' + w + ' depends on their sizes, so leave it out of the key and ask about it in words');
          else if(got[w] !== key.outcome[w]) bad('graph.key.outcome.' + w + ' is "' + key.outcome[w] + '" but the key shifts give "' + got[w] + '"');
        });
      }
    }
    if(key.hold !== undefined && (!Array.isArray(key.hold) || !key.hold.every(function(w){ return key.outcome && key.outcome[w] === 'same'; }))) bad('graph.key.hold lists outcome words the key gives as "same"');
    if(has('equilibrium') && !eq(spec, keyOffsets(spec))) bad('graph: the key shifts leave no equilibrium on the graph');
    if(has('line') || spec.line !== undefined){
      var LD = lineDef(spec);
      if(!LD || !LD.id) bad('graph.line { id, at? } names the price or wage line (P, W, Pc, Pf, PW, MW)');
      else if(!CURVE[LD.id]) bad('graph.line.id "' + LD.id + '" is not a line this engine draws (P, W, Pc, Pf, PW, PT, MW, Pr)');
      if(spec.line && spec.line.at != null && !(spec.line.at >= 0.25 && spec.line.at <= 9.75)) bad('graph.line.at is a height from 0.25 to 9.75');
      if(has('line')){
        var KL = key.line || {}, n = ['at', 'side', 'to'].filter(function(f){ return KL[f] != null; }).length;
        if(n !== 1) bad('graph.key.line gives one of at (a height), side (above or below the equilibrium) or to (eq, or a named point)');
        if(KL.side && ['above', 'below'].indexOf(KL.side) < 0) bad('graph.key.line.side is above or below');
        if(KL.side && !k.eq) bad('graph.key.line.side is measured from the market equilibrium; a ' + spec.kind + ' graph has none');
        if(KL.to && KL.to !== 'eq' && !(k.points && k.points[KL.to])) bad('graph.key.line.to: "' + KL.to + '" is not a named point of a ' + spec.kind + ' graph');
        if(KL.to && keyLine(spec) == null) bad('graph.key.line.to: the key gives no height on this graph');
      }
    }
    if(has('point')){
      var Pt = key.point || {};
      if(!Pt.region && !Pt.on && !Pt.at && !Pt.x && !Pt.y) bad('graph.key.point needs at (a named point), region (a PPC) or on (a curve id)');
      if(Pt.at){
        if(!(k.points && k.points[Pt.at])) bad('graph.key.point.at: "' + Pt.at + '" is not a named point of a ' + spec.kind + ' graph (' + Object.keys(k.points || {}).join(', ') + ')');
        else if(!named(spec, merge(fixedOffsets(spec), keyOffsets(spec)), Pt.at, has('line') ? keyLine(spec) : null)) bad('graph.key.point.at: ' + Pt.at + ' is not on this graph as drawn');
      }
      if(Pt.region && (spec.kind !== 'ppc' || ['inside', 'on', 'outside'].indexOf(Pt.region) < 0)) bad('graph.key.point.region is inside, on or outside, on a ppc graph');
      if(Pt.on && ids.indexOf(Pt.on) < 0) bad('graph.key.point.on: unknown curve "' + Pt.on + '"');
      ['x', 'y'].forEach(function(a){ if(Pt[a] !== undefined && ['up', 'down'].indexOf(Pt[a]) < 0) bad('graph.key.point.' + a + ' is up or down (from the starting equilibrium)'); });
      if((Pt.x || Pt.y) && !k.eq) bad('graph.key.point.x and .y are measured from the equilibrium; a ' + spec.kind + ' graph has none');
    }
    if(has('shade')){
      var R = areas(spec).regions, names = [].concat(key.shade || []);
      if(!names.length) bad('graph.key.shade names the region to shade (' + (Object.keys(R).join(', ') || 'this graph has none') + ')');
      names.forEach(function(nm){ if(!R[nm]) bad('graph.key.shade: "' + nm + '" is not a region of this graph (' + Object.keys(R).join(', ') + ')'); });
    }
    Object.keys(spec.slips || {}).forEach(function(c){ if(c !== 'point' && ids.indexOf(c) < 0 && !REGION[c] && !(lineDef(spec) && lineDef(spec).id === c)) bad('graph.slips: "' + c + '" is not a curve, line, region or point'); else if(String(spec.slips[c]).length < 15) bad('graph.slips.' + c + ' explains the slip in a sentence'); });
    Object.keys(spec.showLabel || {}).forEach(function(c){ var v = spec.showLabel[c]; if(!(spec.show || {})[c]) bad('graph.showLabel.' + c + ': names a curve drawn shifted by graph.show'); else if(typeof v !== 'string' || !v.trim() || v.length > 16) bad('graph.showLabel.' + c + ' is the shifted curve\'s label, 1 to 16 characters ("S + tax")'); });
    (spec.movable || []).forEach(function(c){ if(mov.indexOf(c) < 0) bad('graph.movable: "' + c + '" is not a curve that moves on its own'); });
    (key.shifts || []).forEach(function(s){ if(spec.movable && spec.movable.indexOf(s.curve) < 0) bad('graph.movable leaves out ' + s.curve + ', which the key shifts'); });
    return out;
  }

  /* -------------------------------------------------------------- SVG */
  // 360 wide: the plot keeps Macro's 250 x 226 box, with a right margin for the labels of curves that reach the edge.
  var W = 360, H = 300, L = 50, T = 14, PW = 250, PH = 226;
  function px(x){ return L + x / 10 * PW; }
  function py(v){ return T + (10 - v) / 10 * PH; }
  function f1(v){ return Math.round(v * 10) / 10; }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function pathOf(c){
    if(c.shape === 'vertical') return 'M' + f1(px(c.at)) + ' ' + f1(py(10)) + 'V' + f1(py(0));
    if(c.shape === 'ppcline') return 'M' + f1(px(0)) + ' ' + f1(py(Math.min(10, c.at * c.ky))) + 'L' + f1(px(Math.min(10, c.at * c.kx))) + ' ' + f1(py(0));
    // Straight lines: the two ends of the part inside the box (a short path, a light page).
    if(c.shape === 'down' || c.shape === 'up' || c.shape === 'mr' || c.shape === 'mfc' || c.shape === 'equality' || c.shape === 'horizontal'){
      var y0 = y(c, 0), sl = y(c, 1) - y0, xa = 0, xb = 10;
      if(sl){ var xA = (0 - y0) / sl, xB = (10 - y0) / sl; xa = Math.max(0, Math.min(xA, xB)); xb = Math.min(10, Math.max(xA, xB)); }
      if(xb <= xa) return '';
      return 'M' + f1(px(xa)) + ' ' + f1(py(y(c, xa))) + 'L' + f1(px(xb)) + ' ' + f1(py(y(c, xb)));
    }
    var pts = [], step = 0.1, last = null;
    for(var x = 0; x <= 10 + 1e-9; x += step){ var h = y(c, x); if(h == null) continue;
      // Clip where the curve leaves the box, so a steep curve (MC, ATC near zero) still ends on the edge.
      if(h > 10 + 1e-9 || h < -1e-9){ if(last && last[1] <= 10 && last[1] >= 0){ var xe = root0(function(t){ var v = y(c, t); return v == null ? null : v - (h > 10 ? 10 : 0); }, last[0], x); if(xe != null) pts.push(f1(px(xe)) + ' ' + f1(py(h > 10 ? 10 : 0))); } last = [x, h]; continue; }
      if(last && (last[1] > 10 || last[1] < 0)){ var xs = root0(function(t){ var v = y(c, t); return v == null ? null : v - (last[1] > 10 ? 10 : 0); }, last[0], x); if(xs != null) pts.push(f1(px(xs)) + ' ' + f1(py(last[1] > 10 ? 10 : 0))); }
      pts.push(f1(px(x)) + ' ' + f1(py(h))); last = [x, h]; }
    if(c.shape === 'ppc' && pts.length) pts.push(f1(px(c.at)) + ' ' + f1(py(0)));
    return pts.length ? 'M' + pts.join('L') : '';
  }
  function hpath(v){ return 'M' + f1(px(0)) + ' ' + f1(py(v)) + 'H' + f1(px(10)); }
  // The last point of a curve inside the box (for a curved curve's label).
  function endOf(c){ for(var x = 10; x >= 0.3; x -= 0.02){ var h = y(c, x); if(h != null && h >= 0.2 && h <= 9.7) return [x, h]; } return [9.8, 5]; }
  var LX = 8.6;
  function labelAway(c){
    // Several places along the old curve, tried in order by place() (the first is the old single place).
    if(c.shape === 'down') return [1.8, 1.0, 2.8, 3.8].map(function(x0){ var x = x0, yv = 5 - K(c) * (x - c.at); if(yv > 9.4){ yv = 9.4; x = c.at - 4.4 / K(c) + (x0 - 1.8); } return [px(Math.max(0.3, x)) + 6, py(yv) + 3, 'start']; }).concat(labelAt(c));
    if(c.shape === 'up') return [3.2, 2.2, 4.2, 1.2].map(function(x0){ var x2 = x0, y2 = 5 + K(c) * (x2 - c.at); if(y2 < 0.6){ y2 = 0.6; x2 = c.at - 4.4 / K(c) + (x0 - 3.2); } return [px(Math.max(0.3, x2)) - 7, py(y2) - 3, 'end']; }).concat(labelAt(c));
    if(c.shape === 'vertical') return [px(c.at) - 5, py(0.6), 'end'];
    return labelAt(c, true);
  }
  function labelAt(c, inside){
    if(c.shape === 'vertical') return [px(c.at) + 5, py(9.6) + 6 + (Math.round(c.at) % 2 ? 0 : 15), 'start'];
    // Straight lines offer several places, tried in order (place() keeps the first clear one).
    if(c.shape === 'down'){ var x2 = LX, y2 = 5 - K(c) * (x2 - c.at); if(y2 < 0.5){ y2 = 0.5; x2 = c.at + 4.5 / K(c); }
      var xd = Math.min(9.4, c.at + 2.4), xc = Math.max(0.6, c.at - 3.2);
      return [[px(x2) + 6, py(y2) + 3, 'start'], [px(xd) - 6, py(5 - K(c) * (xd - c.at)) + 15, 'end'], [px(xc) + 7, py(Math.min(9.6, 5 - K(c) * (xc - c.at))) - 2, 'start']]; }
    if(c.shape === 'up'){ var x1 = LX, y1 = 5 + K(c) * (x1 - c.at); if(y1 > 9.6){ y1 = 9.6; x1 = c.at + 4.6 / K(c); }
      var xu = Math.min(9.2, c.at + 3.2);
      return [[px(x1) - 7, py(y1) - 3, 'end'], [px(xu) + 8, py(5 + K(c) * (xu - c.at)) + 13, 'start'], [px(Math.min(9.6, c.at + 4.4 / K(c))) + 8, py(Math.min(9.6, 5 + 4.4)) + 13, 'start']]; }
    if(c.shape === 'ppc'){
      if(inside === 'in'){ var ri = (c.at - 0.45) / Math.SQRT2; return [px(ri) - 2, py(ri) + 12, 'end']; }
      var r = (c.at + 0.45) / Math.SQRT2; return [px(r) + 2, py(r) - 2, 'start']; }
    if(c.shape === 'ppcin'){ var xi = c.at * 0.5, yi = y(c, xi); return inside ? [px(xi) - 4, py(yi) + 13, 'end'] : [px(xi) + 6, py(yi) - 6, 'start']; }
    if(c.shape === 'ppcline'){ var X = c.at * c.kx, Y = c.at * c.ky, n = Math.hypot(X, Y);
      if(inside) return [px(X * 0.64 - 0.5 * Y / n) - 2, py(Y * 0.36 - 0.5 * X / n) + 4, 'end'];
      return [px(X / 2 + 0.45 * Y / n) + 2, py(Y / 2 + 0.45 * X / n) - 2, 'start']; }
    if(c.shape === 'mr'){ var xm = Math.min(9.6, (5 + c.at) / 2), ym = Math.max(0, y(c, xm)); return [px(xm) + 5, py(ym) - 4, 'start']; }
    if(c.shape === 'equality') return [px(4.4), py(5.1), 'end'];
    if(c.shape === 'lorenz') return [6.4, 5.4, 4.4, 7.2].map(function(xl){ return [px(xl) + 4, py(y(c, xl)) + 16, 'start']; });
    if(c.shape === 'horizontal') return [px(0.15), py(c.at) - 5, 'start'];
    // Curved curves (MC, ATC, AVC, AFC, LRATC, MFC): at the curve's end.
    var e = endOf(c);
    if(e[0] >= 9.9) return [[px(10) + 4, py(e[1]) + 4, 'start'], [px(10) - 2, py(e[1]) - 6, 'end']];
    return [[px(e[0]) + 5, py(e[1]) + 6, 'start'], [px(e[0]) - 5, py(e[1]) + 6, 'end']];
  }
  function pairLabels(c, b){
    var right = c.at > b.at, nw = labelAt(c), od = labelAt(b);
    if(c.shape === 'up'){
      var lo = function(q){ var x = Math.min(q.at + 1.6, 8.2), yv = 5 + K(q) * (x - q.at); return [px(x) + 8, py(yv) + 12, 'start']; };
      if(right) nw = lo(c); else od = lo(b);
    } else if(c.shape === 'down'){
      var ll = function(q){ var x = q.at + 3.4, yv = 5 - K(q) * (x - q.at); return [px(x) - 6, py(yv) + 14, 'end']; };
      if(right) od = ll(b); else nw = ll(c);
    } else if(c.shape === 'vertical'){
      nw = right ? [px(c.at) + 5, py(9.6) + 1, 'start'] : [px(c.at) - 5, py(9.6) + 1, 'end'];
      od = right ? [px(b.at) - 5, py(0.6), 'end'] : [px(b.at) + 5, py(0.6), 'start'];
    }
    return [nw, od];
  }
  function curveLabel(t, n, at, cls){
    var sub = t[1] + (n ? n : '');
    return '<text class="mic-gr-clabel ' + (cls || '') + '" x="' + f1(at[0]) + '" y="' + f1(at[1]) + '" text-anchor="' + (at[2] || 'end') + '">' + esc(t[0]) + (sub ? '<tspan class="mic-gr-sub" dy="3">' + esc(sub) + '</tspan>' : '') + '</text>';
  }
  function arrowOf(b, c){
    var d = c.at - b.at;
    if(Math.abs(d) < 0.15) return '';
    var x0, y0, x1, y1;
    if(c.shape === 'vertical'){ y0 = y1 = 7.4; x0 = b.at; x1 = c.at; }
    else if(c.shape === 'down'){ y0 = y1 = 7.6; x0 = b.at - 2.6 / K(b); x1 = c.at - 2.6 / K(c); }
    else if(c.shape === 'up'){ y0 = y1 = 2.4; x0 = b.at - 2.6 / K(b); x1 = c.at - 2.6 / K(c); }
    else if(c.shape === 'ppcline'){ var cs = Math.cos(Math.PI / 3), sn = Math.sin(Math.PI / 3), rb = 1 / (cs / (b.at * b.kx) + sn / (b.at * b.ky)), rc = 1 / (cs / (c.at * c.kx) + sn / (c.at * c.ky)); x0 = rb * cs; y0 = rb * sn; x1 = rc * cs; y1 = rc * sn; }
    else if(c.shape === 'ppc' || c.shape === 'ppcin'){ var k = Math.cos(Math.PI / 3); x0 = b.at * k; y0 = b.at * Math.sin(Math.PI / 3); x1 = c.at * k; y1 = c.at * Math.sin(Math.PI / 3); if(c.shape === 'ppcin'){ x0 = b.at * 0.3; y0 = y(b, x0); x1 = c.at * 0.3; y1 = y(c, x1); } }
    else if(VERTICAL_SHIFT[c.shape]){ x0 = x1 = c.shape === 'lorenz' ? 6 : 8.2; y0 = y(b, x0); y1 = y(c, x1); if(y0 == null || y1 == null) return ''; }
    else return '';
    if(x0 < 0.3 || x1 < 0.3 || y0 < 0 || y1 > 10 || y0 > 10) return '';
    var X0 = px(x0), Y0 = py(y0), X1 = px(x1), Y1 = py(y1), L2 = Math.hypot(X1 - X0, Y1 - Y0), ux = (X1 - X0) / L2, uy = (Y1 - Y0) / L2;
    if(L2 < 9) return '';
    var a = [X0 + ux * 4, Y0 + uy * 4], e = [X1 - ux * 4, Y1 - uy * 4], h = 6;
    return '<path class="mic-gr-arrow" d="M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(e[0]) + ' ' + f1(e[1]) + 'M' + f1(e[0] - ux * h - uy * h * 0.6) + ' ' + f1(e[1] - uy * h + ux * h * 0.6) + 'L' + f1(e[0]) + ' ' + f1(e[1]) + 'L' + f1(e[0] - ux * h + uy * h * 0.6) + ' ' + f1(e[1] - uy * h - ux * h * 0.6) + '"/>';
  }
  function marks(kind, p, n, cls, other, own, keep){
    var m = (KINDS[kind] || {}).mark;
    if(!m || !p) return '';
    own = own || {};
    var sub = function(t, a){ var k = own[a] != null ? own[a] : n; return esc(t) + (k ? '<tspan class="mic-gr-sub" dy="3">' + esc(k) + '</tspan>' : ''); };
    var out = '';
    if(!other || Math.abs(other[0] - p[0]) > 1e-6 || keep){
      var close = other && Math.abs(other[0] - p[0]) < 1 && Math.abs(other[0] - p[0]) > 1e-6, anc = close ? (p[0] < other[0] ? 'end' : 'start') : 'middle', dx = close ? (p[0] < other[0] ? 2 : -2) : 0;
      out += '<text class="mic-gr-mark ' + (cls || '') + '" x="' + f1(px(p[0]) + dx) + '" y="' + (T + PH + 13) + '" text-anchor="' + anc + '">' + sub(m[0], 'x') + '</text>';
    }
    if(!other || Math.abs(other[1] - p[1]) > 1e-6 || keep){
      var closeY = other && Math.abs(other[1] - p[1]) < 0.7 && Math.abs(other[1] - p[1]) > 1e-6, dy = closeY ? (p[1] < other[1] ? 5 : -2) : 4;
      out += '<text class="mic-gr-mark ' + (cls || '') + '" x="' + (L - 4) + '" y="' + f1(py(p[1]) + dy) + '" text-anchor="end">' + sub(m[1], 'y') + '</text>';
    }
    return out;
  }
  // A value mark on an axis: text (main, subscript) at x (horizontal axis) or y (vertical axis).
  function amark(axis, v, t, sub, cls){
    var s = esc(t) + (sub ? '<tspan class="mic-gr-sub" dy="3">' + esc(sub) + '</tspan>' : '');
    return axis === 'x' ? '<text class="mic-gr-mark ' + (cls || '') + '" x="' + f1(px(v)) + '" y="' + (T + PH + 13) + '" text-anchor="middle">' + s + '</text>'
      : '<text class="mic-gr-mark ' + (cls || '') + '" x="' + (L - 4) + '" y="' + f1(py(v) + 4) + '" text-anchor="end">' + s + '</text>';
  }
  /* Axis marks close in value (QE and QT for a one-step tax, PE and PW + t) are pushed apart along their axis after
     drawing, so no two touch (integration T3-1). Marks on the horizontal axis sit at y = T + PH + 13, on the
     vertical axis at x = L - 4; each keeps its anchor, and the run is pulled back inside the picture if it leaves.
     Widths are taken at the bigger phone size (mic.css data-fit), so marks do not touch there either. */
  function spreadMarks(html){
    var re = /<text class="mic-gr-mark([^"]*)" x="([-\d.]+)" y="([-\d.]+)" text-anchor="(\w+)">([\s\S]*?)<\/text>/g, xs = [], ys = [], m;
    var wOf = function(inner){ var sub = (/<tspan[^>]*>([^<]*)<\/tspan>/.exec(inner) || [])[1] || '', main = inner.replace(/<tspan[^>]*>[^<]*<\/tspan>/g, '').replace(/&[a-z#0-9]+;/g, 'x').replace(/<[^>]+>/g, ''); return main.length * 8.2 + sub.replace(/[^A-Z]/g, '').length * 8.8 + sub.replace(/[A-Z]/g, '').length * 5.8; };
    while((m = re.exec(html))){ var o = { s: m[0], cls: m[1], x: +m[2], y: +m[3], a: m[4], inner: m[5], w: wOf(m[5]) }; if(Math.abs(o.y - (T + PH + 13)) < 0.01) xs.push(o); else if(Math.abs(o.x - (L - 4)) < 0.01) ys.push(o); }
    var moved = [];
    var left = function(o){ return o.a === 'end' ? o.x - o.w : o.a === 'middle' ? o.x - o.w / 2 : o.x; };
    xs.sort(function(a, b){ return left(a) - left(b); });
    for(var i = 1; i < xs.length; i++){ var need = left(xs[i - 1]) + xs[i - 1].w + 4 - left(xs[i]); if(need > 0){ xs[i].x += need; moved.push(xs[i]); } }
    if(xs.length){ var last = xs[xs.length - 1], over = left(last) + last.w - (W - 2); if(over > 0) xs.forEach(function(o){ o.x -= over; if(moved.indexOf(o) < 0) moved.push(o); }); }
    ys.sort(function(a, b){ return b.y - a.y; });
    for(var j = 1; j < ys.length; j++){ var gap = ys[j - 1].y - 20 - ys[j].y; if(gap < 0){ ys[j].y += gap; moved.push(ys[j]); } }
    moved.forEach(function(o){ html = html.replace(o.s, '<text class="mic-gr-mark' + o.cls + '" x="' + f1(o.x) + '" y="' + f1(o.y) + '" text-anchor="' + o.a + '">' + o.inner + '</text>'); });
    return html;
  }
  function vguide(x, top, cls){ return '<path class="mic-gr-guide ' + (cls || '') + '" d="M' + f1(px(x)) + ' ' + f1(py(top)) + 'V' + f1(py(0)) + '"/>'; }
  function eName(n){ return 'E' + (n ? '<tspan class="mic-gr-sub" dy="3">' + esc(n) + '</tspan>' : ''); }
  function guides(p, cls){
    return '<path class="mic-gr-guide ' + (cls || '') + '" d="M' + f1(px(0)) + ' ' + f1(py(p[1])) + 'H' + f1(px(p[0])) + 'V' + f1(py(0)) + '"/>';
  }
  function centroid(poly){ var a = 0, cx = 0, cy = 0; for(var i = 0; i < poly.length; i++){ var p = poly[i], q = poly[(i + 1) % poly.length], cr = p[0] * q[1] - q[0] * p[1]; a += cr; cx += (p[0] + q[0]) * cr; cy += (p[1] + q[1]) * cr; } if(Math.abs(a) < 1e-9) return poly[0]; return [cx / (3 * a), cy / (3 * a)]; }
  /* Where a cell's letter goes: the point inside the cell farthest from its
     edges (in screen units), so a thin cell's letter does not sit on a curve. */
  function labelSpot(poly, avoid){
    var P = poly.map(function(q){ return [px(q[0]), py(q[1])]; }), x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    P.forEach(function(q){ x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    function inside(x, y){ var c = false; for(var i = 0, j = P.length - 1; i < P.length; j = i++){ var a = P[i], b = P[j]; if((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
    function edge(x, y){ var m = Infinity; for(var i = 0, j = P.length - 1; i < P.length; j = i++){ var a = P[j], b = P[i], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L)) : 0, ex = a[0] + t * dx - x, ey = a[1] + t * dy - y; m = Math.min(m, ex * ex + ey * ey); } (avoid || []).forEach(function(q){ var ax = q[0] - x, ay = q[1] - y; m = Math.min(m, ax * ax + ay * ay); }); return m; }
    var best = null, bd = -1, N = 24;
    for(var i = 1; i < N; i++) for(var j = 1; j < N; j++){ var x = x0 + (x1 - x0) * i / N, y = y0 + (y1 - y0) * j / N; if(!inside(x, y)) continue; var d = edge(x, y); if(d > bd){ bd = d; best = [x, y]; } }
    if(!best){ var ct = centroid(poly); return [px(ct[0]), py(ct[1])]; }
    return best;
  }
  function polyPath(poly){ return 'M' + poly.map(function(p){ return f1(px(p[0])) + ' ' + f1(py(p[1])); }).join('L') + 'Z'; }

  /* The policy lines and quantity marks of an sd-micro graph, as the exam draws them. */
  function policyLayer(spec, state){
    var P = spec.policy, g = [];
    if(!P) return '';
    var cs0 = curves(spec, {}), D = find(cs0, 'D'), S = find(cs0, 'S');
    var line = function(v, id){ var t = CURVE[id]; g.push('<path class="mic-gr-pline" d="' + hpath(v) + '"/>' + amark('y', v, t[0], t[1])); };
    var qmark = function(x, top, t, sub){ g.push(vguide(x, top)); g.push(amark('x', x, t, sub)); };
    if(P.type === 'ceiling' || P.type === 'floor'){
      line(P.at, P.type === 'ceiling' ? 'Pc' : 'Pf');
      var qs = xAt(S, P.at), qd = xAt(D, P.at);
      if(qs != null) qmark(qs, P.at, 'Q', 'S'); if(qd != null) qmark(qd, P.at, 'Q', 'D');
    } else if(P.type === 'world'){
      line(P.at, 'PW'); var a = xAt(S, P.at), b = xAt(D, P.at); if(a != null) qmark(a, P.at, 'Q', 'S'); if(b != null) qmark(b, P.at, 'Q', 'D');
    } else if(P.type === 'tariff'){
      var t2 = P.at + (P.amount || 1); line(P.at, 'PW'); line(t2, 'PT');
      [[xAt(S, P.at), P.at, 'S1'], [xAt(S, t2), t2, 'S2'], [xAt(D, t2), t2, 'D2'], [xAt(D, P.at), P.at, 'D1']].forEach(function(m){ if(m[0] != null) qmark(m[0], m[1], 'Q', m[2]); });
    } else if((P.type === 'tax' || P.type === 'subsidy') && ((spec.do || []).indexOf('shift') < 0 || (state && state.key))){
      // With a shift task the student draws the shifted S: the after-tax guides would give it away (integration 7).
      var e = cross(D, find(curves(spec, { S: (P.type === 'tax' ? -1 : 1) * taxSteps(spec) }), 'S'));
      if(e){ var pb = y(D, e[0]), ps = y(S, e[0]);
        g.push('<path class="mic-gr-guide" d="M' + f1(px(0)) + ' ' + f1(py(pb)) + 'H' + f1(px(e[0])) + 'V' + f1(py(0)) + 'M' + f1(px(0)) + ' ' + f1(py(ps)) + 'H' + f1(px(e[0])) + '"/>');
        g.push(amark('x', e[0], 'Q', P.type === 'tax' ? 'T' : 'SUB')); g.push(amark('y', pb, 'P', 'B')); g.push(amark('y', ps, 'P', 'S')); }
    }
    return g.join('');
  }

  /* One panel's SVG. state: { shifts, eq, point, labels, line, shade, key,
     focus, n0, n1, curveN, curveN0 (old curves' number, default n0),
    followerOld (false: no label on a follower's old place), oldLabels (false: none on any old curve), marks0,
    labelsShown, letters }. */
  function svgPanel(spec, state, panel, opts){
    var n0 = state.n0 != null ? String(state.n0) : '1', c0 = state.curveN0 != null ? String(state.curveN0) : n0, n1 = state.n1 != null ? String(state.n1) : '2';
    var k = kindOf(spec), shifts = state.shifts || {}, labels = state.labels || {}, does = spec.do || [], pid = panel.id, two = panelsOf(spec).length > 1;
    var xs = pid === 'firm' ? 'fx' : 'x', ys = pid === 'firm' ? 'fy' : 'y';
    var askLabels = does.indexOf('label') > -1 && !state.labelsShown;
    var nm = function(slot, def){ if(askLabels && !labels[slot]) return '?'; return labelText(labels[slot] || def, spec.names); };
    var g = [];
    g.push('<rect class="mic-gr-hit" x="' + L + '" y="' + T + '" width="' + PW + '" height="' + PH + '"/>');
    // Shading cells first, under the curves.
    var shadeTask = does.indexOf('shade') > -1, ar = (shadeTask || state.letters || (state.shade && state.shade.length)) ? areas(spec) : null, on = state.shade || [], keyCells = state.key && does.indexOf('shade') > -1 ? regionCells(spec, (spec.key || {}).shade) : [];
    // Drawn once the shift arrows are known (a letter keeps clear of an arrow, integration u2), under the curves.
    // Each letter placed is an obstacle for the next, so two letters in thin neighboring cells do not touch.
    var drawCells = function(avoid){ var out = [], lets = []; if(ar) ar.cells.filter(function(c){ return c.panel === pid; }).forEach(function(c){
      var cls = 'mic-gr-cell' + (on.indexOf(c.id) > -1 ? ' is-on' : '') + (keyCells.indexOf(c.id) > -1 ? ' is-key' : ''), ct = labelSpot(c.poly, avoid.concat(lets)), g = out;
      lets.push(ct, [ct[0] - 4, ct[1]], [ct[0] + 4, ct[1]], [ct[0], ct[1] - 5], [ct[0], ct[1] + 5]);
      if(!shadeTask && !state.letters && on.indexOf(c.id) < 0) return;   // a picture shading a region (state.shade) shows only it
      g.push('<path class="' + cls + '" data-cell="' + esc(c.id) + '" d="' + polyPath(c.poly) + '"/>' + (shadeTask || state.letters ? '<text class="mic-gr-cletter" x="' + f1(ct[0]) + '" y="' + f1(ct[1] + 4) + '" text-anchor="middle">' + esc(c.id) + '</text>' : ''));
    }); return out.join(''); };
    g.push('<path class="mic-gr-axis" d="M' + L + ' ' + T + 'V' + (T + PH) + 'H' + (L + PW) + '"/>');
    g.push('<text class="mic-gr-alabel" x="' + (L + PW) + '" y="' + (T + PH + 35) + '" text-anchor="end">' + esc(nm(xs, panel.x)) + '</text>');
    g.push('<text class="mic-gr-alabel" transform="translate(' + (L - 34) + ' ' + T + ') rotate(-90)" text-anchor="end">' + esc(nm(ys, panel.y)) + '</text>');
    if(two) g.push('<text class="mic-gr-ptitle" x="' + (L + PW / 2) + '" y="' + (T + 2) + '" text-anchor="middle">' + esc(panel.title) + '</text>');
    var all = curves(spec, {}), allNow = curves(spec, shifts), inP = function(c){ return c.panel === pid; };
    var base = all.filter(inP), now = allNow.filter(inP);
    var e0 = k.eq && find(base, k.eq[0]) ? eq(spec, {}) : null;
    var placed = [], cn = state.curveN != null ? String(state.curveN) : '2';
    // Measured in the site font at 13 px bold: about 11 px a capital (MC 23, ATC 29, AVC 31), 7.5 a small letter
    // or digit, 4 a space, 8 an equals sign; a subscript about 7.
    function cw(s){ var w = 0; String(s).replace(/./g, function(ch){ w += /[A-Z]/.test(ch) ? 11 : ch === ' ' ? 4 : ch === '=' ? 8 : 7.5; return ch; }); return w; }
    function box(t, n, at){ var w = cw(t[0]) + String(t[1] + (n || '')).length * 7, x0 = at[2] === 'end' ? at[0] - w : at[2] === 'middle' ? at[0] - w / 2 : at[0]; return [x0, at[1] - 11, x0 + w, at[1] + 4]; }
    // Labels keep 4 px apart across and 2 px up and down (MC and ATC side by side no longer touch: launch review).
    function hit(a, b){ return a[0] < b[2] + 4 && b[0] < a[2] + 4 && a[1] < b[3] + 2 && b[1] < a[3] + 2; }
    function ptsOf(c){ var pts = []; if(c.shape === 'vertical'){ for(var v = 0; v <= 10; v += 0.25) pts.push([px(c.at), py(v)]); } else for(var x = 0; x <= 10 + 1e-9; x += 0.1){ var h = y(c, x); if(h != null && h >= 0 && h <= 10) pts.push([px(x), py(h)]); } return pts; }
    var lines = now.map(ptsOf);
    var LV = lineAt(spec, state), LDf = lineDef(spec), lineHere = LDf && (LDf.panel || 'main') === pid && LV != null;
    if(lineHere){ var lp = []; for(var lx = 0; lx <= 10; lx += 0.1) lp.push([px(lx), py(LV)]); lines.push(lp); }
    function crosses(bx, skip, set){ return (set || lines).some(function(pts, j){ return (set || j !== skip) && pts.some(function(q){ return q[0] > bx[0] - 1 && q[0] < bx[2] + 1 && q[1] > bx[1] - 1 && q[1] < bx[3] + 1; }); }); }
    /* Soft obstacles: dashed guides and shift arrows. A label avoids them when it can, never at the cost of a curve. */
    var soft = [], seg = function(a, b){ var pts = [], n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3)); for(var i = 0; i <= n; i++) pts.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); return pts; };
    var guideAt = function(p){ if(p){ soft.push(seg([px(0), py(p[1])], [px(p[0]), py(p[1])])); soft.push(seg([px(p[0]), py(p[1])], [px(p[0]), py(0)])); } };
    function place(t, n, at, skip, along){
      var tries = [0, 14, -14, 28, -28], bx, fallback = null, cands = Array.isArray(at[0]) ? at.slice() : [at];
      at = cands[0];
      // A long label that would leave the picture flips to the other side of its point.
      cands.slice().forEach(function(a){ var b0 = box(t, n, a); if(b0[2] > W - 2 && a[2] === 'start') cands.push([a[0] - 12, a[1], 'end']); if(b0[0] < 2 && a[2] === 'end') cands.push([a[0] + 12, a[1], 'start']); });
      // Every candidate at its own height first, then nudged up or down; clear of guides and arrows if it can be.
      var hard = null;
      for(var tt = 0; tt < tries.length; tt++) for(var c = 0; c < cands.length; c++){
        var a2 = [cands[c][0], cands[c][1] + tries[tt], cands[c][2]]; bx = box(t, n, a2);
        if(a2[1] < 12 || a2[1] > T + PH - 2 || bx[2] > W || bx[0] < 0) continue;
        if(placed.some(function(q){ return hit(q, bx); })) continue;
        if(!crosses(bx, skip)){ if(!crosses(bx, -1, soft)){ placed.push(bx); return a2; } if(!hard) hard = [a2, bx]; }
        if(!fallback) fallback = [a2, bx];
      }
      if(hard){ placed.push(hard[1]); return hard[0]; }
      if(fallback){ placed.push(fallback[1]); return fallback[0]; }
      // Nothing near the end fits (two curves leave through the top): walk back along the curve for a clear spot.
      var pts = along || (skip >= 0 && lines[skip]) || [];
      // First clear of every curve, then clear of the other labels only; never outside the picture.
      for(var pass = 0; pass < 2; pass++) for(var q = pts.length - 1; q >= 0; q -= 2) for(var sd = 0; sd < 2; sd++){
        var a3 = [pts[q][0] + (sd ? -8 : 8), pts[q][1] + 4, sd ? 'end' : 'start'], b3 = box(t, n, a3);
        if(a3[1] < 12 || a3[1] > T + PH - 2 || b3[2] > W || b3[0] < 0 || placed.some(function(z){ return hit(z, b3); }) || (!pass && crosses(b3, skip))) continue;
        placed.push(b3); return a3;
      }
      // Still nothing: the first candidate, pulled inside the picture.
      var b4 = box(t, n, at), dx = b4[2] > W - 2 ? W - 2 - b4[2] : b4[0] < 2 ? 2 - b4[0] : 0;
      at = [at[0] + dx, Math.max(12, Math.min(T + PH - 2, at[1])), at[2]]; placed.push(box(t, n, at)); return at;
    }
    // The long line label (d = MR = AR = P) in two lines in the right margin, placed before the curve labels.
    var lineLbl = '';
    if(lineHere){
      var lt0 = askLabels && !labels[LDf.id] ? null : curveText(spec, labels[LDf.id] || LDf.id);
      if(LDf.link || (lt0 && lt0[1] === '' && lt0[0].length > 4)){
        var words = lt0 ? lt0[0].split(' = ') : ['?'], half = Math.ceil(words.length / 2), l1 = words.slice(0, half).join(' = ') + (words.length > 1 ? ' =' : ''), l2 = words.slice(half).join(' = ');
        var ly = Math.max(T + 10, Math.min(T + PH - 16, py(LV) - 4)), lx = Math.min(px(10) + 4, W - 2 - Math.max(l1.length, l2.length) * 6.8);
        placed.push([lx - 2, ly - 14, W, ly + (l2 ? 19 : 6)]);
        lineLbl = '<text class="mic-gr-clabel is-line is-small" x="' + f1(lx) + '" y="' + f1(ly) + '" text-anchor="start">' + esc(l1) + (l2 ? '<tspan x="' + f1(lx) + '" dy="13">' + esc(l2) + '</tspan>' : '') + '</text>';
      }
    }
    // Shift arrows and the dashed guides of the equilibria are soft obstacles for the labels.
    var arrows = now.map(function(c, i){ return c.steps ? arrowOf(base[i], c) : ''; });
    arrows.forEach(function(a){ var m = /^<path class="mic-gr-arrow" d="M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)/.exec(a); if(m) soft.push(seg([+m[1], +m[2]], [+m[3], +m[4]])); });
    if(k.eq && find(base, k.eq[0])){ guideAt(eq(spec, {})); if(state.eq) guideAt(state.eq); }
    var arrowPts = []; soft.forEach(function(pts){ arrowPts = arrowPts.concat(pts); });
    // A letter also keeps clear of a curve drawn across its cell (the S + tax line through the
    // tax revenue rectangle: the cells are cut by the curves as they started).
    var curvePts = []; now.forEach(function(c, i){ if(c.steps) lines[i].forEach(function(q, j){ if(j % 2 === 0) curvePts.push(q); }); });
    g.splice(1, 0, drawCells(arrowPts.filter(function(q, i){ return i % 2 === 0; }).concat(curvePts)));
    var whole = function(c, i){ return c.steps && Math.abs(c.at - base[i].at) >= 1 - 1e-9 && (c.shape === 'up' || c.shape === 'down' || c.shape === 'vertical'); };
    var txt = function(id){ return askLabels && !labels[id] ? null : curveText(spec, labels[id] || id); };
    // A faded curve keeps only the first name of a long label (S1 for S = MPC = MSC, beside the live S = MPC = MSC2),
    // except a curve named by showLabel, whose old name is the point (S = MPC under S + tax).
    var oldTxt = function(id){ var t = txt(id); return t && / = /.test(t[0]) ? [t[0].split(' = ')[0], t[1], t[2]] : t; };
    // spec.showLabel { S: 'S + tax' }: the curve drawn shifted by spec.show reads so, with no number (integration 11).
    var SL = spec.showLabel || {}, own = function(c){ return c.steps && SL[c.id] && (spec.show || {})[c.id] ? [String(SL[c.id]), '', curveName(c.id, spec)] : null; };
    var pos = now.map(function(c, i){
      var t = (txt(c.id) && own(c)) || txt(c.id) || ['?', String(i + 1)];
      return place(t, c.steps && !own(c) ? cn : '', whole(c, i) ? pairLabels(c, base[i])[0] : labelAt(c), i);
    });
    var oldPos = now.map(function(c, i){
      var b = base[i], t = own(c) ? txt(c.id) : oldTxt(c.id);
      if(!c.steps || !t) return null;
      if(state.followerOld === false && c.follows) return null;   // the faded MR1 crowds the axis (integration T2-4)
      if(state.oldLabels === false) return null;   // a narrow stage: faded curves unlabeled (launch, cost lab on a phone)
      return place(t, c0, whole(c, i) ? pairLabels(c, b)[1] : Math.abs(c.at - b.at) < 1 - 1e-9 ? labelAway(b) : labelAt(b, b.shape === 'ppcline' ? c.steps > 0 : (b.shape === 'ppc' || b.shape === 'ppcin') && c.at > b.at ? 'in' : true), -1, ptsOf(b));
    });
    if(state.key){
      var ko = keyOffsets(spec);
      curves(spec, merge(fixedOffsets(spec), ko)).filter(inP).forEach(function(c){ if(!ko[c.id] && !(c.follows && ko[c.follows])) return; var j = now.map(function(q){ return q.id; }).indexOf(c.id), same = j > -1 && Math.abs(now[j].at - c.at) < 1e-9;
        g.push('<path class="mic-gr-curve is-key" d="' + pathOf(c) + '"/>' + (same ? '' : curveLabel(curveText(spec, c.id), cn, place(curveText(spec, c.id), cn, j > -1 && Math.abs(c.at - base[j].at) >= 1 - 1e-9 && whole(c, j) ? pairLabels(c, base[j])[0] : labelAt(c), j), 'is-key'))); });
    }
    now.forEach(function(c, i){
      var moved = !!c.steps, b = base[i], t = txt(c.id), at = pos[i];
      if(moved) g.push('<path class="mic-gr-curve is-old" d="' + pathOf(b) + '"/>' + (t && oldPos[i] ? curveLabel(own(c) ? t : oldTxt(c.id), own(c) ? '' : c0, oldPos[i], 'is-old') : '') + arrows[i]);
      g.push('<g class="mic-gr-c" data-curve="' + esc(c.id) + '"><path class="mic-gr-curve' + (state.focus === c.id ? ' is-focus' : '') + (c.fixed ? ' is-fixed' : '') + '" d="' + pathOf(c) + '"/>' +
        '<path class="mic-gr-grab" d="' + pathOf(c) + '"' + (does.indexOf('shift') < 0 ? ' pointer-events="none"' : '') + '/></g>' + (t ? (own(c) ? curveLabel(own(c), '', at) : curveLabel(t, moved ? cn : '', at)) : '<text class="mic-gr-clabel" x="' + f1(at[0]) + '" y="' + f1(at[1]) + '" text-anchor="' + at[2] + '">?<tspan class="mic-gr-sub" dy="3">' + (i + 1) + '</tspan></text>'));
    });
    if(pid === 'main' || pid === (panelsOf(spec)[0] || {}).id) g.push(policyLayer(spec, state));
    if(spec.linear && spec.ends){ var pc = find(base, 'PPC');
      if(pc && pc.shape === 'ppcline' && !(spec.start && spec.start.PPC)){
        g.push('<text class="mic-gr-mark is-end" x="' + f1(px(pc.at * pc.kx)) + '" y="' + (T + PH + 13) + '" text-anchor="middle">' + esc(spec.ends.x) + '</text>');
        g.push('<text class="mic-gr-mark is-end" x="' + (L - 4) + '" y="' + f1(py(pc.at * pc.ky) + 4) + '" text-anchor="end">' + esc(spec.ends.y) + '</text>');
      } }
    // The price or wage line (d = MR = AR = P on the firm, a regulated price, a minimum wage).
    if(lineHere){
      var lbl = lineLbl;
      g.push('<g class="mic-gr-l" data-line="' + esc(LDf.id) + '"><path class="mic-gr-pline' + (state.focus === 'line' ? ' is-focus' : '') + '" d="' + hpath(LV) + '"/><path class="mic-gr-grab" d="' + hpath(LV) + '"' + (does.indexOf('line') < 0 ? ' pointer-events="none"' : '') + '/></g>' + lbl);
      if(!askLabels){
        var E0g = LDf.link ? eq(spec, {}) : null, moved0 = E0g && state.eq && (Math.abs(state.eq[0] - E0g[0]) > 1e-6 || Math.abs(state.eq[1] - E0g[1]) > 1e-6);
        g.push(amark('y', LV, LDf.link || LDf.id === 'P' || LDf.id === 'W' ? LDf.id : CURVE[LDf.id][0], LDf.link ? (E0g && Math.abs(LV - E0g[1]) > 1e-6 ? n1 : moved0 ? n0 : '') : LDf.id === 'P' || LDf.id === 'W' ? '' : CURVE[LDf.id][1]));
      }
      if(spec.kind === 'demand'){ var dq = named(spec, shifts, 'at-price', LV); if(dq){ g.push(vguide(dq[0], dq[1])); g.push(amark('x', dq[0], 'Q', '')); } }
      // The firm's quantity where the line meets MC (or MRP), with its guide, once known.
      if(LDf.link){ var fp = named(spec, shifts, 'firm', LV); if(fp && fp[0] > 0){ g.push(vguide(fp[0], fp[1])); g.push(amark('x', fp[0], 'q', pid === 'firm' ? 'F' : '')); } else if(fp) g.push(amark('x', 0.9, 'q = 0', '', 'is-end')); }
    }
    // Carry the market price across to the firm (a dashed line to the panel's edge).
    if(two && LDf && LDf.link && LV != null){
      if(pid === 'market') g.push('<path class="mic-gr-guide is-carry" d="M' + f1(px(10)) + ' ' + f1(py(LV)) + 'H' + W + '"/>');
      if(pid === 'firm') g.push('<path class="mic-gr-guide is-carry" d="M0 ' + f1(py(LV)) + 'H' + L + '"/>');
    }
    // Market equilibria (E1, E2).
    function eAt(p, left, below){ return left ? [px(p[0]) - 17, py(p[1]) + (below ? 14 : -3)] : [px(p[0]) + 10, py(p[1]) + 4]; }
    var hasEq = !!e0, two2 = hasEq && state.eq && (Math.abs(state.eq[0] - e0[0]) > 1e-6 || Math.abs(state.eq[1] - e0[1]) > 1e-6);
    if(hasEq){ g.push(guides(e0, 'is-old')); g.push('<circle class="mic-gr-eq is-old" cx="' + f1(px(e0[0])) + '" cy="' + f1(py(e0[1])) + '" r="4"/>');
      if(!askLabels) g.push(marks(spec.kind, e0, two2 ? n0 : '', 'is-old', two2 ? state.eq : null, state.marks0 || (spec.policy ? { x: 'E', y: 'E' } : null), true));
      var e1Left = state.eq && state.eq[0] > e0[0] - 1e-6;
      if(two2){ var a1 = eAt(e0, e1Left, Math.abs(state.eq[0] - e0[0]) < 1e-6 && state.eq[1] > e0[1]); g.push('<text class="mic-gr-plabel is-old" x="' + f1(a1[0]) + '" y="' + f1(a1[1]) + '" text-anchor="' + (e1Left ? 'end' : 'start') + '">' + eName(n0) + '</text>'); } }
    if(hasEq && state.eq){
      var ea = eAt(state.eq, false), right = true, eb = [ea[0], ea[1] - 11, ea[0] + 18, ea[1] + 4];
      if(placed.some(function(q){ return hit(q, eb); })){ right = false; ea = eAt(state.eq, true); }
      g.push(guides(state.eq)); if(two2 && !askLabels) g.push(marks(spec.kind, state.eq, n1, '', e0));
      g.push('<g class="mic-gr-pt" data-pt="eq"><circle class="mic-gr-eq" cx="' + f1(px(state.eq[0])) + '" cy="' + f1(py(state.eq[1])) + '" r="6"/><text class="mic-gr-plabel" x="' + f1(ea[0]) + '" y="' + f1(ea[1]) + '" text-anchor="' + (right ? 'start' : 'end') + '">' + eName(n1) + '</text></g>'); }
    var ptPanel = (spec.key && spec.key.point && spec.key.point.at) ? pointPanel(spec, spec.key.point.at) : (panelsOf(spec)[0] || {}).id;
    if(state.point && ptPanel === pid){
      var PX = px(state.point[0]), PY = py(state.point[1]), plt = String(spec.pointLabel || 'X'), pm = spec.pointMarks;
      // Dashed guides and axis marks for the point (P_M and Q_M, W_M and L_M), as the exam draws them (integration 12).
      if(pm){ g.push(guides(state.point)); ['x', 'y'].forEach(function(a){ if(pm[a]){ var bits = String(pm[a]).split('_'); g.push(amark(a, state.point[a === 'x' ? 0 : 1], bits[0], bits[1] || '')); } }); }
      // The label goes to the first clear corner around the point (no curve, no other label under it).
      var pat = plt.trim() ? place([plt, ''], '', [[PX + 9, PY - 8, 'start'], [PX - 9, PY - 8, 'end'], [PX + 9, PY + 17, 'start'], [PX - 9, PY + 17, 'end'], [PX + 11, PY + 5, 'start'], [PX - 11, PY + 5, 'end']], -1) : [PX + 9, PY - 8, 'start'];
      g.push('<g class="mic-gr-pt" data-pt="point"><circle class="mic-gr-eq is-point" cx="' + f1(PX) + '" cy="' + f1(PY) + '" r="6"/><text class="mic-gr-plabel" x="' + f1(pat[0]) + '" y="' + f1(pat[1]) + '" text-anchor="' + pat[2] + '">' + esc(plt) + '</text></g>'); }
    var label = opts.label || ((two ? panel.title + ' graph' : k.title + ' graph') + ': ' + describe(spec, state, pid));
    return '<svg class="mic-graph-svg" data-panel="' + esc(pid) + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + spreadMarks(g.join('')) + '</svg>';
  }
  function svg(spec, state, opts){
    state = state || {}; opts = opts || {};
    var ps = panelsOf(spec);
    if(state.line == null && (spec.do || []).indexOf('line') > -1 && state.lineStart !== false) state = Object.assign({}, state, { line: lineStart(spec) });
    var shifts = state.shifts, k = kindOf(spec);
    if(state.fixed !== false){ state = Object.assign({}, state, { shifts: merge(fixedOffsets(spec), shifts || {}) }); }
    // A graph with no equilibrium task can still mark the new crossing (spec.showEq, state.showEq): a stimulus after a shift, the pc market.
    if(k.eq && !state.eq && (spec.do || []).indexOf('equilibrium') < 0 && (spec.showEq || state.showEq)){ var e2 = eq(spec, state.shifts); if(e2) state = Object.assign({}, state, { eq: e2 }); }
    if(ps.length === 1) return svgPanel(spec, state, ps[0], opts);
    return '<div class="mic-gr-panels">' + ps.map(function(p){ return svgPanel(spec, state, p, opts); }).join('') + '</div>';
  }
  /* The graph in words, for its text alternative and the live region. */
  function describe(spec, state, panelId){
    state = state || {};
    var k = kindOf(spec), sh = state.shifts || {}, parts = [];
    curves(spec, sh).forEach(function(c){ if(panelId && c.panel !== panelId) return; parts.push(curveName(c.id, spec) + (c.steps ? ' shifted ' + dirWord(c.shape, c.steps) + (Math.abs(c.steps) > 1 ? ' ' + Math.abs(c.steps) + ' steps' : '') : '')); });
    var s = parts.join('; ') + '.';
    var LDf = lineDef(spec), LV = lineAt(spec, state);
    if(LDf && LV != null && (!panelId || (LDf.panel || 'main') === panelId)) s += ' ' + cap(curveName(LDf.id, spec)) + ' at ' + f1(LV) + '.';
    if(spec.policy && (!panelId || panelId === 'main')) s += ' ' + policyWords(spec.policy) + '.';
    if(k.out && (!panelId || (k.panels ? k.panels[0].id === panelId : true))){ var o = outcome(spec, sh); if(o && Object.keys(sh).some(function(c){ return sh[c]; })) s += ' At the new crossing the ' + k.out.y + ' is ' + word(o[k.out.y]) + ' and the ' + k.out.x + ' is ' + word(o[k.out.x]) + '.'; }
    if(state.shade && state.shade.length) s += ' Shaded: area' + (state.shade.length > 1 ? 's ' : ' ') + state.shade.join(', ') + '.';
    return s;
  }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function policyWords(P){
    return P.type === 'ceiling' ? 'A price ceiling at ' + P.at : P.type === 'floor' ? 'A price floor at ' + P.at : P.type === 'tax' ? 'A per-unit tax of ' + (P.amount || 1) + ' on sellers' :
      P.type === 'subsidy' ? 'A per-unit subsidy of ' + (P.amount || 1) + ' to sellers' : P.type === 'world' ? 'The world price at ' + P.at : 'The world price at ' + P.at + ' with a tariff of ' + (P.amount || 1);
  }
  function word(d){ return d === 'up' ? 'higher' : d === 'down' ? 'lower' : 'unchanged'; }

  /* -------------------------------------------------------------- DOM */
  var uid = 0;
  function mount(host, spec, opts){
    opts = opts || {};
    var does = spec.do || [], id = 'gr' + (++uid), has = function(t){ return does.indexOf(t) > -1; };
    var movable = spec.movable || movableIds(spec), LDf = lineDef(spec);
    var st = { shifts: {}, eq: null, point: null, labels: {}, line: null, shade: [], key: false, focus: null };
    function resetState(){ st.shifts = {}; st.labels = {}; st.point = null; st.shade = []; st.line = has('line') ? lineStart(spec) : null; st.eq = has('equilibrium') ? (eq(spec, {}) || [5, 5]).slice() : null; }
    resetState();
    var cellIds = has('shade') ? areas(spec).cells.map(function(c){ return c.id; }) : [];
    host.classList.add('mic-graph');
    if(panelsOf(spec).length > 1) host.classList.add('is-two');
    host.innerHTML = '<div class="mic-gr-stage"></div>' +
      (has('label') ? '<div class="mic-gr-labels">' + labelSlots(spec).map(function(slot, i){
        var sid = id + '-l-' + slot, name = slot === 'x' ? (panelsOf(spec).length > 1 ? 'Market: horizontal axis' : 'Horizontal axis') : slot === 'y' ? (panelsOf(spec).length > 1 ? 'Market: vertical axis' : 'Vertical axis') : slot === 'fx' ? 'Firm: horizontal axis' : slot === 'fy' ? 'Firm: vertical axis' : LDf && slot === LDf.id ? 'Line' : 'Curve ' + (i - (panelsOf(spec).length > 1 ? 3 : 1));
        return '<label for="' + sid + '"><span>' + name + '</span><select id="' + sid + '" data-slot="' + esc(slot) + '"><option value="">Choose a label</option>' +
          labelOptions(spec, slot).map(function(o){ return '<option value="' + esc(o) + '">' + esc(optionText(spec, slot, o)) + '</option>'; }).join('') + '</select></label>';
      }).join('') + '</div>' : '') +
      '<p class="mic-gr-help mic-small" id="' + id + '-h">' + help() + '</p>' +
      '<div class="mic-gr-controls"></div><p class="sr-only" aria-live="polite" id="' + id + '-live"></p>';
    var stage = host.querySelector('.mic-gr-stage'), live = host.querySelector('#' + id + '-live'), controls = host.querySelector('.mic-gr-controls');
    function help(){
      var t = [];
      if(has('shift')) t.push('Drag a curve to shift it, or tab to its handle and use the arrow keys (Home puts it back).');
      if(has('equilibrium')) t.push('Then move E2 to the new equilibrium.');
      if(has('line')) t.push('Drag the line up or down, or use the arrow keys on its handle.');
      if(has('point')) t.push('Tap the graph to place the point, or tab to it and use the arrow keys.');
      if(has('shade')) t.push('Tap each area to shade it (tap again to clear), or use the area buttons.');
      if(has('label')) t.push('Choose each label below the graph.');
      return t.join(' ');
    }
    controls.innerHTML = (has('shift') ? movable.map(function(c){
      return '<button type="button" class="mic-gr-handle" data-curve="' + esc(c) + '" aria-describedby="' + id + '-h">' + esc(curveShort(c, spec)) + ': <span></span></button>';
    }).join('') : '') +
      (has('line') ? '<button type="button" class="mic-gr-handle" data-hline="1" aria-describedby="' + id + '-h">' + esc(curveShort(LDf.id, spec)) + ': <span></span></button>' : '') +
      (has('equilibrium') ? '<button type="button" class="mic-gr-handle" data-pt="eq" aria-describedby="' + id + '-h">E2: <span></span></button>' : '') +
      (has('point') ? '<button type="button" class="mic-gr-handle" data-pt="point" aria-describedby="' + id + '-h">Point: <span></span></button>' : '') +
      cellIds.map(function(c){ return '<button type="button" class="mic-gr-handle mic-gr-cellbtn" data-cellbtn="' + esc(c) + '" aria-pressed="false">Area ' + esc(c) + '</button>'; }).join('') +
      (opts.readonly ? '' : '<button type="button" class="btn-outline sm mic-gr-reset">Start over</button>');
    function curveState(c){ var cs = find(curves(spec, st.shifts), c); return cs.steps ? 'shifted ' + dirWord(cs.shape, cs.steps) + (Math.abs(cs.steps) > 1 ? ' ' + Math.abs(cs.steps) : '') : 'not shifted'; }
    function ptState(p, w){ var q = w === 'eq' && eq(spec, st.shifts); return !p ? 'not placed' : q && Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) < 1e-6 ? 'where the curves cross' : 'placed'; }
    function paint(say){
      stage.innerHTML = svg(spec, st);
      controls.querySelectorAll('[data-curve]').forEach(function(b){ b.querySelector('span').textContent = curveState(b.getAttribute('data-curve')); });
      controls.querySelectorAll('[data-pt]').forEach(function(b){ var w = b.getAttribute('data-pt'); b.querySelector('span').textContent = ptState(st[w], w); });
      controls.querySelectorAll('[data-hline]').forEach(function(b){ b.querySelector('span').textContent = 'at ' + f1(st.line); });
      controls.querySelectorAll('[data-cellbtn]').forEach(function(b){ var on = st.shade.indexOf(b.getAttribute('data-cellbtn')) > -1; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('is-on', on); });
      if(say) live.textContent = say;
      wireSvg();
    }
    function fire(){ var r = get(); if(opts.onChange) opts.onChange(r); try{ host.dispatchEvent(new CustomEvent('micgraph:change', { detail: r })); }catch(e){} }
    function changed(say){ paint(say); fire(); }
    function shift(c, d){
      if(opts.readonly || movable.indexOf(c) < 0) return;
      var cur = st.shifts[c] || 0, nx = d === 0 ? 0 : Math.max(-MAX_STEPS, Math.min(MAX_STEPS, cur + d));
      if(nx === cur) return;
      if(nx) st.shifts[c] = nx; else delete st.shifts[c];
      changed(cap(curveName(c, spec)) + ' ' + curveState(c) + '. ' + describe(spec, st));
    }
    function clamp(v){ return Math.max(0, Math.min(10, Math.round(v * 4) / 4)); }
    function movePt(which, dx, dy){
      if(opts.readonly) return;
      var p = st[which] || [5, 5];
      st[which] = [clamp(p[0] + dx), clamp(p[1] + dy)];
      changed((which === 'eq' ? 'E2 ' : 'Point ') + ptState(st[which], which) + ' (' + st[which].join(', ') + ')');
    }
    function moveLine(v){ if(opts.readonly) return; var nv = Math.max(0.25, Math.min(9.75, clamp(v))); if(nv === st.line) return; st.line = nv; changed(cap(curveName(LDf.id, spec)) + ' at ' + nv); }
    function toggle(c){ if(opts.readonly || cellIds.indexOf(c) < 0) return; var i = st.shade.indexOf(c); if(i > -1) st.shade.splice(i, 1); else st.shade.push(c); st.shade.sort(); changed('Area ' + c + (i > -1 ? ' cleared.' : ' shaded.')); }
    controls.addEventListener('keydown', function(e){
      var b = e.target.closest('.mic-gr-handle'); if(!b) return;
      var c = b.getAttribute('data-curve'), pt = b.getAttribute('data-pt'), key = e.key;
      if(c){
        var d = key === 'Home' ? 0 : /Right|Up/.test(key) ? 1 : /Left|Down/.test(key) ? -1 : null;
        if(d === null) return;
        e.preventDefault(); shift(c, d);
      } else if(b.hasAttribute('data-hline')){
        var dv = key === 'Home' ? 'home' : /Up|Right/.test(key) ? 0.25 : /Down|Left/.test(key) ? -0.25 : null;
        if(dv === null) return; e.preventDefault(); moveLine(dv === 'home' ? lineStart(spec) : st.line + dv);
      } else if(pt){
        var m = { ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0], ArrowUp: [0, 0.5], ArrowDown: [0, -0.5] }[key];
        if(!m) return;
        e.preventDefault(); movePt(pt, m[0], m[1]);
      }
    });
    controls.addEventListener('focusin', function(e){ var b = e.target.closest('[data-curve]'), l = e.target.closest('[data-hline]'); st.focus = b ? b.getAttribute('data-curve') : l ? 'line' : null; paint(); });
    controls.addEventListener('focusout', function(){ st.focus = null; paint(); });
    controls.addEventListener('click', function(e){
      if(e.target.closest('.mic-gr-reset')){ resetState(); changed('Graph reset.'); return; }
      var cb = e.target.closest('[data-cellbtn]'); if(cb) toggle(cb.getAttribute('data-cellbtn'));
    });
    host.querySelectorAll('.mic-gr-labels select').forEach(function(sel){
      sel.addEventListener('change', function(){ var s = sel.getAttribute('data-slot'); if(sel.value) st.labels[s] = sel.value; else delete st.labels[s]; changed(); });
      if(opts.readonly) sel.disabled = true;
    });
    function toData(ev, el){
      var r = el.getBoundingClientRect(), sx = W / r.width, sy = H / r.height;
      return [((ev.clientX - r.left) * sx - L) / PW * 10, 10 - ((ev.clientY - r.top) * sy - T) / PH * 10];
    }
    var drag = null;
    var ptPanel = (spec.key && spec.key.point && spec.key.point.at) ? pointPanel(spec, spec.key.point.at) : (panelsOf(spec)[0] || {}).id;
    function wireSvg(){
      if(opts.readonly) return;
      stage.querySelectorAll('svg').forEach(function(s){
        s.addEventListener('pointerdown', function(ev){
          var g = ev.target.closest('[data-curve]'), p = ev.target.closest('[data-pt]'), ln = ev.target.closest('[data-line]'), cell = ev.target.closest('[data-cell]'), at = toData(ev, s), pid = s.getAttribute('data-panel');
          if(g && has('shift') && movable.indexOf(g.getAttribute('data-curve')) > -1){
            var c = g.getAttribute('data-curve'); drag = { el: s, curve: c, from: at, steps: st.shifts[c] || 0, vert: !!VERTICAL_SHIFT[find(curves(spec, {}), c).shape] };
          } else if(ln && has('line')) drag = { el: s, line: true };
          else if(p) drag = { el: s, pt: p.getAttribute('data-pt') };
          else if(cell && has('shade')){ toggle(cell.getAttribute('data-cell')); ev.preventDefault(); return; }
          else if(has('point') && pid === ptPanel){ st.point = [clamp(at[0]), clamp(at[1])]; drag = { el: s, pt: 'point' }; changed('Point ' + ptState(st.point)); }
          if(drag){ ev.preventDefault(); try{ stage.setPointerCapture(ev.pointerId); }catch(e){} }
        });
      });
    }
    stage.addEventListener('pointermove', function(ev){
      if(!drag) return;
      var el = stage.querySelector('svg[data-panel="' + drag.el.getAttribute('data-panel') + '"]') || drag.el, at = toData(ev, el);
      if(drag.curve){
        var d = Math.round((drag.vert ? at[1] - drag.from[1] : at[0] - drag.from[0]));
        var want = Math.max(-MAX_STEPS, Math.min(MAX_STEPS, drag.steps + d)), cur = st.shifts[drag.curve] || 0;
        if(want !== cur) shift(drag.curve, want - cur);
      } else if(drag.line){ var nv = Math.max(0.25, Math.min(9.75, clamp(at[1]))); if(nv !== st.line){ st.line = nv; paint(); } }
      else { st[drag.pt] = [clamp(at[0]), clamp(at[1])]; paint(); }
    });
    function end(){
      if(drag && (drag.pt || drag.line)) fire();
      if(drag && drag.pt) live.textContent = (drag.pt === 'eq' ? 'E2 ' : 'Point ') + ptState(st[drag.pt], drag.pt) + ' (' + st[drag.pt].join(', ') + ')';
      if(drag && drag.line) live.textContent = cap(curveName(LDf.id, spec)) + ' at ' + st.line;
      drag = null;
    }
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    function get(){
      var r = { shifts: {}, eq: st.eq ? st.eq.slice() : null, point: st.point ? st.point.slice() : null, labels: {}, line: has('line') ? st.line : null, shade: st.shade.slice() };
      for(var c in st.shifts) r.shifts[c] = st.shifts[c];
      for(var l in st.labels) r.labels[l] = st.labels[l];
      return r;
    }
    function set(r){
      r = r || {}; st.shifts = {}; for(var c in (r.shifts || {})) if(r.shifts[c]) st.shifts[c] = r.shifts[c];
      st.labels = {}; for(var l in (r.labels || {})) st.labels[l] = r.labels[l];
      if(r.eq) st.eq = r.eq.slice(); st.point = r.point ? r.point.slice() : null;
      if(r.line != null && has('line')) st.line = r.line;
      st.shade = (r.shade || []).filter(function(x){ return cellIds.indexOf(x) > -1; }).sort();
      host.querySelectorAll('.mic-gr-labels select').forEach(function(sel){ sel.value = st.labels[sel.getAttribute('data-slot')] || ''; });
      paint();
    }
    function lock(){ opts.readonly = true; controls.querySelectorAll('button').forEach(function(b){ if(b.classList.contains('mic-gr-reset')) b.remove(); else b.setAttribute('aria-disabled', 'true'); }); host.querySelectorAll('select').forEach(function(s){ s.disabled = true; }); }
    paint();
    return { el: host, get: get, set: set, reset: function(){ resetState(); paint(); }, showKey: function(on){ st.key = on !== false; paint(); }, lock: lock };
  }

  root.ApMicroGraph = { KINDS: KINDS, TASKS: TASKS, CURVE: CURVE, AXIS: AXIS, COST: COST, REGION: REGION, REGION_HINT: REGION_HINT, POLICIES: POLICIES, EXT: EXT,
    curves: curves, y: y, eq: eq, outcome: outcome, indeterminate: indeterminate, keyOffsets: keyOffsets, keyResponse: keyResponse, keyLine: keyLine,
    fixedOffsets: fixedOffsets, named: named, lineAt: lineAt, lineDef: lineDef, lineStart: lineStart, areas: areas, regionCells: regionCells, polyArea: polyArea,
    region: region, distTo: distTo, dirWord: dirWord, dirSign: dirSign, axisOf: axisOf, curveName: curveName, curveText: curveText, labelText: labelText, labelOptions: labelOptions,
    labelSlots: labelSlots, slotAnswer: slotAnswer, optionText: optionText, panels: panelsOf, movable: movableIds, pointPanel: pointPanel, lowest: lowest, xAt: xAt, cross: cross,
    check: check, svg: svg, describe: describe, mount: mount, find: find,
    px: px, py: py, BOX: { W: W, H: H, L: L, T: T, PW: PW, PH: PH } };
})(typeof window !== 'undefined' ? window : globalThis);
