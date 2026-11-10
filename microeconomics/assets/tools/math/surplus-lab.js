/* Surplus and Policy Lab model: ApMicroMath.surplusLab (docs/apmicro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T3, docs/apmicro-briefs/t3.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmicro-tool-checks/surplus-lab.mjs) and the
   test (scripts/test/apmicro-tool-surplus-lab.test.mjs) run exactly this code.

   The market is ApMicroGraph's sd-micro graph: D and S straight, slope -1 and
   +1 in graph units (0-10 on both axes), D and S moved by whole steps with
   `start` (0, -1 or -2, so demand meets the price axis inside the box and
   supply starts at a price of zero or more). A market adds a scale: kP
   dollars per graph unit of price, kQ units per graph unit of quantity. So
   every dollar value is a graph point times its scale, and every area is
   ApMicroCalc's (consumerSurplus, producerSurplus, taxRevenue, subsidyCost,
   tariffRevenue, dwl, trapezoid, triangle) on those dollars: the area the
   picture shades and the number agree (the test multiplies each region's
   polygon area from ApMicroGraph.areas by kP x kQ and gets the same value).

     POLICIES                    none, ceiling, floor, tax, subsidy, world, tariff
     market(m)                   { choke, floor, slope, qe, pe } in dollars and units
     spec(m, pol)                the sd-micro spec (pol in dollars: { type, at?, amount? })
     values(m, pol)              every area and quantity in dollars and units
     partition(spec)             cell -> the area it is colored as (cs, ps, rev, gain, dwl)
     incidence(o)                a tax on a linear market Qd = a - bP, Qs = c + dP
     generate(r, ctx, type)      a drill problem for ApMicroTools.drill; types
                                 surplus, control, tax, incidence, subsidy, trade, tariff

   A graph step is ApMicroTools.drill's "graph" kind with a shade task: drill()
   grades it with ApMicroGrade.graph (exact cells, the slip named) and records
   it as "surplus-lab:<context>:<step>". */
(function(root){
  'use strict';
  var M = root.ApMicroMath;
  if(!M) return;
  function G(){ return root.ApMicroGraph; }
  function C(){ return root.ApMicroCalc; }
  var R6 = function(v){ return Math.round(v * 1e6) / 1e6; };

  /* ------------------------------------------------------------ market */
  var POLICIES = ['none', 'ceiling', 'floor', 'tax', 'subsidy', 'world', 'tariff'];
  function start(m){ var s = {}; if(m.sD) s.D = m.sD; if(m.sS) s.S = m.sS; return s; }
  // pol in dollars -> the engine's policy in graph units
  function spec(m, pol){
    var sp = { kind: 'sd-micro' }, st = start(m);
    if(Object.keys(st).length) sp.start = st;
    if(pol && pol.type && pol.type !== 'none'){
      var P = { type: pol.type };
      if(pol.at != null) P.at = R6(pol.at / m.kP);
      if(pol.amount != null) P.amount = R6(pol.amount / m.kP);
      sp.policy = P;
    }
    return sp;
  }
  // A drawable policy graph (the engine's checker, with a task so it reads the policy rules).
  function bad(sp){ return G().check(Object.assign({}, sp, { do: ['label'] })).length > 0; }
  function curvesOf(m){ var cs = G().curves(spec(m), {}); return { D: G().find(cs, 'D'), S: G().find(cs, 'S') }; }
  function market(m){
    var c = curvesOf(m), e = G().eq(spec(m), {});
    return { choke: R6(G().y(c.D, 0) * m.kP), floor: R6(G().y(c.S, 0) * m.kP), slope: m.kP / m.kQ, qe: R6(e[0] * m.kQ), pe: R6(e[1] * m.kP), eqG: e };
  }
  // dollars <-> graph
  function qAtD(m, p){ return R6(G().xAt(curvesOf(m).D, p / m.kP) * m.kQ); }
  function qAtS(m, p){ return R6(G().xAt(curvesOf(m).S, p / m.kP) * m.kQ); }
  function pD(m, q){ return R6(G().y(curvesOf(m).D, q / m.kQ) * m.kP); }
  function pS(m, q){ return R6(G().y(curvesOf(m).S, q / m.kQ) * m.kP); }
  function ev(fn, args){ return C().evaluate({ fn: fn, args: args }); }

  /* Every value a policy produces, each from its ApMicroCalc recipe. */
  function values(m, pol){
    var k = market(m), t = (pol && pol.type) || 'none', v = { type: t, choke: k.choke, floor: k.floor, qe: k.qe, pe: k.pe };
    v.cs0 = ev('consumerSurplus', [k.qe, k.choke, k.pe]); v.ps0 = ev('producerSurplus', [k.qe, k.pe, k.floor]); v.ts0 = ev('add', [v.cs0, v.ps0]);
    v.rev = 0; v.dwl = 0; v.gain = 0;
    if(t === 'none'){ v.q = k.qe; v.cs = v.cs0; v.ps = v.ps0; }
    else if(t === 'ceiling'){
      var pc = pol.at, qs = qAtS(m, pc), qd = qAtD(m, pc), pt = pD(m, qs);
      v.at = pc; v.qs = qs; v.qd = qd; v.q = qs; v.pdem = pt;
      v.shortage = ev('shortage', [qd, qs]);
      v.cs = ev('trapezoid', [ev('sub', [k.choke, pc]), ev('sub', [pt, pc]), qs]);
      v.ps = ev('producerSurplus', [qs, pc, k.floor]);
      v.dwl = ev('dwl', [ev('sub', [k.qe, qs]), ev('sub', [pt, pc])]);
      v.transfer = ev('rectangle', [qs, ev('sub', [k.pe, pc])]);
    } else if(t === 'floor'){
      var pf = pol.at, qd2 = qAtD(m, pf), qs2 = qAtS(m, pf), psup = pS(m, qd2);
      v.at = pf; v.qs = qs2; v.qd = qd2; v.q = qd2; v.psup = psup;
      v.surplusQty = ev('surplusQty', [qs2, qd2]);
      v.cs = ev('consumerSurplus', [qd2, k.choke, pf]);
      // PS under the floor: a trapezoid with parallel sides (Pf - floor) at Q = 0 and (Pf - S(Qd)) at Qd.
      v.ps = ev('trapezoid', [ev('sub', [pf, k.floor]), ev('sub', [pf, psup]), qd2]);
      v.dwl = ev('dwl', [ev('sub', [k.qe, qd2]), ev('sub', [pf, psup])]);
      v.transfer = ev('rectangle', [qd2, ev('sub', [pf, k.pe])]);
    } else if(t === 'tax'){
      var tx = pol.amount, qt = R6((G().eq(spec(m), { S: -tx / m.kP }) || [0])[0] * m.kQ), pb = pD(m, qt), ps = R6(pb - tx);
      v.amount = tx; v.q = qt; v.pb = pb; v.psell = ps;
      v.cs = ev('consumerSurplus', [qt, k.choke, pb]);
      v.ps = ev('producerSurplus', [qt, ps, k.floor]);
      v.rev = ev('taxRevenue', [tx, qt]);
      v.dwl = ev('dwl', [ev('sub', [k.qe, qt]), tx]);
      var inc = C().incidence(k.pe, pb, ps); v.buyers = R6(inc.buyers); v.sellers = R6(inc.sellers);
    } else if(t === 'subsidy'){
      var sb = pol.amount, q2 = R6((G().eq(spec(m), { S: sb / m.kP }) || [0])[0] * m.kQ), pbu = pD(m, q2), pse = R6(pbu + sb);
      v.amount = sb; v.q = q2; v.pb = pbu; v.psell = pse;
      v.cs = ev('consumerSurplus', [q2, k.choke, pbu]);
      v.ps = ev('producerSurplus', [q2, pse, k.floor]);
      v.rev = ev('subsidyCost', [sb, q2]);
      v.dwl = ev('dwl', [ev('sub', [q2, k.qe]), sb]);
    } else if(t === 'world'){
      var pw = pol.at, wd = qAtD(m, pw), ws = qAtS(m, pw);
      v.at = pw; v.qd = wd; v.qs = ws; v.q = wd;
      v.cs = ev('consumerSurplus', [wd, k.choke, pw]);
      v.ps = ev('producerSurplus', [ws, pw, k.floor]);
      if(pw < k.pe){ v.imports = ev('imports', [wd, ws]); v.gain = ev('triangle', [v.imports, ev('sub', [k.pe, pw])]); }
      else { v.exports = ev('exports', [ws, wd]); v.gain = ev('triangle', [v.exports, ev('sub', [pw, k.pe])]); }
    } else if(t === 'tariff'){
      var w = pol.at, tf = pol.amount, pt2 = R6(w + tf), d1 = qAtD(m, w), s1 = qAtS(m, w), d2 = qAtD(m, pt2), s2 = qAtS(m, pt2);
      v.at = w; v.amount = tf; v.pt = pt2; v.qd1 = d1; v.qs1 = s1; v.qd2 = d2; v.qs2 = s2; v.q = d2;
      v.imports1 = ev('imports', [d1, s1]); v.imports = ev('imports', [d2, s2]);
      v.cs = ev('consumerSurplus', [d2, k.choke, pt2]);
      v.ps = ev('producerSurplus', [s2, pt2, k.floor]);
      v.rev = ev('tariffRevenue', [tf, v.imports]);
      v.dwlS = ev('dwl', [ev('sub', [s2, s1]), tf]); v.dwlD = ev('dwl', [ev('sub', [d1, d2]), tf]);
      v.dwl = ev('add', [v.dwlS, v.dwlD]);
    }
    // Total surplus: buyers and sellers, plus revenue the government collects, minus what a subsidy costs it.
    v.ts = ev('add', [v.cs, v.ps, t === 'tax' || t === 'tariff' ? v.rev : 0, t === 'subsidy' ? -v.rev : 0]);
    return v;
  }

  /* The color of each cell in the "all areas" view: the first of these
     regions that holds it (a subsidy's cost overlaps CS and PS, so it is
     drawn as its own outline, not a fill). */
  var ORDER = ['dwl', 'tax-revenue', 'tariff-revenue', 'gain', 'cs', 'ps'];
  var CLASS = { dwl: 'dwl', 'tax-revenue': 'rev', 'tariff-revenue': 'rev', 'subsidy-cost': 'rev', gain: 'gain', cs: 'cs', ps: 'ps' };
  function partition(sp){
    var R = G().areas(sp).regions, out = {};
    G().areas(sp).cells.forEach(function(c){
      for(var i = 0; i < ORDER.length; i++) if((R[ORDER[i]] || []).indexOf(c.id) > -1){ out[c.id] = CLASS[ORDER[i]]; return; }
    });
    return out;
  }

  /* ------------------------------------------------------ incidence */
  /* A per-unit tax t on sellers in Qd = a - bP, Qs = c + dP (ApMicroCalc
     linearMarket before and after: with the tax Qs = c + d(P - t)). */
  function incidence(o){
    var before = C().linearMarket(o.a, o.b, o.c, o.d), after = C().linearMarket(o.a, o.b, o.c - o.d * o.t, o.d);
    var pb = R6(after.p), ps = R6(after.p - o.t), inc = C().incidence(R6(before.p), pb, ps);
    return { p0: R6(before.p), q0: R6(before.q), pb: pb, ps: ps, q1: R6(after.q), buyers: R6(inc.buyers), sellers: R6(inc.sellers), buyerShare: R6(inc.buyerShare), ed: R6(o.b * before.p / before.q), es: R6(o.d * before.p / before.q) };
  }

  /* ------------------------------------------------------ text helpers */
  function money(x){ var r = M.round(x, 2), s = Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : r.toFixed(2); return (r < 0 ? '−' : '') + '$' + s.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function units(x){ var r = M.round(x, 2); return String(Math.abs(r - Math.round(r)) < 1e-9 ? Math.round(r) : r).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function sub(a, s){ return a + '<sub>' + s + '</sub>'; }

  /* ------------------------------------------------------ steps */
  function numStep(key, label, answer, mistakes, practice, o){
    o = o || {};
    var s = { key: key, kind: 'num', label: label, cell: M.cell(answer, 1e-4, mistakes, 0.006), unit: o.unit || '', d: o.d != null ? o.d : (Math.abs(answer - Math.round(answer)) < 1e-9 ? 0 : 2), practice: practice, level: o.level || 'apply' };
    if(o.hint) s.hint = o.hint;
    return s;
  }
  function choice(key, label, options, correct, why, practice){ return { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: practice, level: 'apply' }; }
  function shadeStep(key, label, sp, region, practice, okWhy, slips){
    var g = JSON.parse(JSON.stringify(sp));
    g.do = ['shade']; g.key = { shade: region }; g.letters = true;
    if(slips && Object.keys(slips).length) g.slips = slips;
    return { key: key, kind: 'graph', spec: g, label: label, explain: okWhy, practice: practice, level: 'apply' };
  }
  // Options in a random order with the key tracked.
  function deal(r, opts){
    var idx = M.shuffle(r, opts.map(function(x, i){ return i; }));
    return { options: idx.map(function(i){ return opts[i][0]; }), why: idx.map(function(i){ return opts[i][1]; }), correct: idx.indexOf(0) };
  }

  /* ------------------------------------------------------ the markets */
  var GOODS = [
    { one: 'kelp bar', many: 'kelp bars' }, { one: 'bike lock', many: 'bike locks' }, { one: 'rain poncho', many: 'rain ponchos' },
    { one: 'solar lantern', many: 'solar lanterns' }, { one: 'phone case', many: 'phone cases' }, { one: 'water filter', many: 'water filters' },
    { one: 'notebook', many: 'notebooks' }, { one: 'yoga mat', many: 'yoga mats' }, { one: 'hand fan', many: 'hand fans' }
  ];
  var SCALES = [[2, 10], [2, 20], [4, 10], [2, 100], [10, 10], [4, 50], [6, 10]];
  function drawMarket(r){
    var sc = r.pick(SCALES);
    return { sD: r.pick([0, -1, -2]), sS: r.pick([0, -1, -2]), kP: sc[0], kQ: sc[1], good: r.pick(GOODS) };
  }
  // The values the graph marks, as a legend under the figure.
  function baseLegend(m, k){
    return [['D', 'meets the price axis at ' + money(k.choke)], ['S', 'meets the price axis at ' + money(k.floor)], [sub('P', 'E') + ', ' + sub('Q', 'E'), money(k.pe) + ', ' + units(k.qe) + ' units']];
  }
  function fig(m, sp, rows, alt){ return { spec: sp, legend: rows, alt: alt }; }

  /* ------------------------------------------------- type: surplus */
  function genSurplus(r, ctx){
    var m = drawMarket(r), k = market(m), v = values(m, { type: 'none' }), sp = spec(m), g = m.good;
    var first = r.pick(['cs', 'ps']);
    var text = '<p>The graph shows the market for ' + g.many + ' with no government policy. Each unit on the quantity axis is a ' + g.one + '; prices are in dollars.</p>';
    var steps = [
      shadeStep('shade', 'Shade ' + (first === 'cs' ? 'consumer surplus' : 'producer surplus') + '.', sp, first, '4.B',
        first === 'cs' ? 'Consumer surplus is the triangle under demand and above the price, out to the quantity traded.' : 'Producer surplus is the triangle above supply and below the price, out to the quantity traded.',
        first === 'cs' ? { ps: 'That is producer surplus, the area above supply. Consumer surplus is under demand and above the price.' } : { cs: 'That is consumer surplus, the area under demand. Producer surplus is above supply and below the price.' }),
      numStep('cs', 'Calculate consumer surplus, in dollars.', v.cs, [
        { value: k.qe * (k.choke - k.pe), why: 'That is the whole rectangle. Consumer surplus is a triangle: multiply by one half.' },
        { value: v.ps, why: 'That is producer surplus. Consumer surplus uses the demand curve: from ' + money(k.choke) + ' down to the price.' },
        { value: 0.5 * k.qe * k.choke, why: 'The height is the price-axis intercept of demand minus the price, not the intercept alone.' }
      ], '3.A', { unit: 'dollars', hint: 'Consumer surplus = ½ × quantity × (where demand meets the price axis − price).' }),
      numStep('ps', 'Calculate producer surplus, in dollars.', v.ps, [
        { value: k.qe * (k.pe - k.floor), why: 'That is the whole rectangle. Producer surplus is a triangle: multiply by one half.' },
        { value: v.cs, why: 'That is consumer surplus. Producer surplus lies above the supply curve, below the price.' },
        { value: 0.5 * k.qe * k.pe, why: 'The height is the price minus where supply meets the price axis (' + money(k.floor) + ').' }
      ], '3.A', { unit: 'dollars' })
    ];
    if(Math.abs(k.floor) < 1e-9) steps[2].cell.mistakes = steps[2].cell.mistakes.filter(function(x){ return !/meets the price axis \(/.test(x.why); });
    return {
      type: 'surplus', ctx: ctx.id, topic: ctx.topic, text: text,
      figure: fig(m, sp, baseLegend(m, k), 'Supply and demand for ' + g.many + ' crossing at ' + money(k.pe) + ' and ' + units(k.qe) + ' units.'),
      steps: steps,
      solution: [
        'At the equilibrium, ' + units(k.qe) + ' ' + g.many + ' sell at ' + money(k.pe) + '.',
        'Consumer surplus = ½ × ' + units(k.qe) + ' × (' + money(k.choke) + ' − ' + money(k.pe) + ') = ' + money(v.cs) + '.',
        'Producer surplus = ½ × ' + units(k.qe) + ' × (' + money(k.pe) + ' − ' + money(k.floor) + ') = ' + money(v.ps) + '.',
        'Total surplus is ' + money(v.ts) + ', the largest it can be: every unit whose value to buyers is at least its cost is traded.'
      ],
      answer: { m: m, v: v, first: first }
    };
  }

  /* ------------------------------------------------- type: control */
  function genControl(r, ctx){
    var m, k, kind, gap, sp, at, tries = 0;
    do {
      m = drawMarket(r); k = market(m); kind = r.pick(['ceiling', 'floor']); gap = r.pick([1, 1.5, 2]);
      at = kind === 'ceiling' ? k.eqG[1] - gap : k.eqG[1] + gap;
      sp = spec(m, { type: kind, at: at * m.kP });
    } while((bad(sp) || !(at - (-m.sS) >= 1) || !(10 + m.sD - at >= 1)) && ++tries < 60);
    var v = values(m, { type: kind, at: at * m.kP }), g = m.good, ceil = kind === 'ceiling';
    var word = ceil ? 'ceiling' : 'floor', gapQ = ceil ? v.shortage : v.surplusQty;
    var text = '<p>The government sets a price ' + word + ' of <b>' + money(v.at) + '</b> in the market for ' + g.many + '. Without it, ' + units(k.qe) + ' would sell at ' + money(k.pe) + '.</p>';
    var kindC = deal(r, [
      [ceil ? 'A shortage: quantity demanded is greater than quantity supplied' : 'A surplus: quantity supplied is greater than quantity demanded',
        ceil ? 'Right. Below the equilibrium price buyers want ' + units(v.qd) + ' but sellers offer only ' + units(v.qs) + '.' : 'Right. Above the equilibrium price sellers offer ' + units(v.qs) + ' but buyers want only ' + units(v.qd) + '.'],
      [ceil ? 'A surplus: quantity supplied is greater than quantity demanded' : 'A shortage: quantity demanded is greater than quantity supplied',
        ceil ? 'A ceiling below the equilibrium price makes sellers offer less and buyers want more: a shortage, not a surplus.' : 'A floor above the equilibrium price makes buyers want less and sellers offer more: a surplus, not a shortage.'],
      [ceil ? 'A shortage: supply is greater than demand' : 'A surplus: demand is greater than supply',
        'Compare quantities, not curves: the curves do not move. It is quantity ' + (ceil ? 'demanded' : 'supplied') + ' that is greater at this price.'],
      ['Neither: the market still clears at ' + money(k.pe), 'The ' + word + ' is binding: it sits ' + (ceil ? 'below' : 'above') + ' the equilibrium price, so the price cannot get to ' + money(k.pe) + '.']
    ]);
    var steps = [
      choice('kind', 'At the ' + word + ', what does the market have?', kindC.options, kindC.correct, kindC.why, '2.B'),
      numStep('gap', 'How many units is the ' + (ceil ? 'shortage' : 'surplus') + '?', gapQ, [
        { value: Math.abs(k.qe - (ceil ? v.qs : v.qd)), why: 'Measure from quantity supplied to quantity demanded at the ' + word + ', not from the equilibrium quantity.' },
        { value: ceil ? v.qd : v.qs, why: 'That is one quantity. The ' + (ceil ? 'shortage' : 'surplus') + ' is the gap between quantity demanded and quantity supplied.' }
      ], '3.A', { unit: 'units' }),
      shadeStep('shade', 'Shade the deadweight loss of the price ' + word + '.', sp, 'dwl', '4.B',
        'The deadweight loss is the triangle between demand and supply from the quantity traded (' + units(v.q) + ') out to the equilibrium quantity (' + units(k.qe) + ').',
        { transfer: 'That rectangle is surplus moved from ' + (ceil ? 'sellers to buyers' : 'buyers to sellers') + ', not lost. The loss is the triangle of trades that no longer happen.' }),
      numStep('dwl', 'Calculate the deadweight loss, in dollars.', v.dwl, [
        { value: 2 * v.dwl, why: 'That is the rectangle around the triangle. Multiply by one half.' },
        { value: v.transfer, why: 'That is the rectangle of surplus that changes hands. Deadweight loss is the triangle between demand and supply.' },
        { value: 0.5 * gapQ * Math.abs(v.at - k.pe), why: 'The base is the units no longer traded (equilibrium quantity minus the quantity traded), not the whole ' + (ceil ? 'shortage' : 'surplus') + '.' }
      ], '3.A', { unit: 'dollars', hint: 'DWL = ½ × (units no longer traded) × (the gap between demand and supply at the quantity traded).' })
    ];
    var wedge = ceil ? v.pdem - v.at : v.at - v.psup;
    return {
      type: 'control', ctx: ctx.id, topic: ctx.topic, text: text,
      figure: fig(m, sp, baseLegend(m, k).concat([[ceil ? sub('P', 'C') : sub('P', 'F'), money(v.at)], [sub('Q', 'S') + ', ' + sub('Q', 'D'), units(v.qs) + ' and ' + units(v.qd) + ' units']]), 'A price ' + word + ' at ' + money(v.at) + ' on the market for ' + g.many + '.'),
      steps: steps,
      solution: [
        'At ' + money(v.at) + ' buyers want ' + units(v.qd) + ' and sellers offer ' + units(v.qs) + ': a ' + (ceil ? 'shortage' : 'surplus') + ' of ' + units(gapQ) + ' units.',
        'Only ' + units(v.q) + ' units are traded (the smaller quantity), so ' + units(k.qe - v.q) + ' units that were worth more to buyers than they cost are not traded.',
        'At ' + units(v.q) + ' units the gap between demand and supply is ' + money(wedge) + '. DWL = ½ × ' + units(k.qe - v.q) + ' × ' + money(wedge) + ' = ' + money(v.dwl) + '.'
      ],
      answer: { m: m, v: v, kind: kind }
    };
  }

  /* ------------------------------------------------- type: tax */
  function genTax(r, ctx){
    var m, k, a, sp, tries = 0;
    do { m = drawMarket(r); k = market(m); a = r.pick([1, 2, 3]); sp = spec(m, { type: 'tax', amount: a * m.kP }); } while((bad(sp) || k.eqG[0] - a / 2 < 1) && ++tries < 60);
    var v = values(m, { type: 'tax', amount: a * m.kP }), g = m.good;
    var text = '<p>The government puts a tax of <b>' + money(v.amount) + ' per unit</b> on sellers of ' + g.many + '. Before the tax, ' + units(k.qe) + ' sold at ' + money(k.pe) + '.</p>';
    var steps = [
      shadeStep('shade-rev', 'Shade the tax revenue.', sp, 'tax-revenue', '4.B', 'Tax revenue is the rectangle between the price buyers pay (' + money(v.pb) + ') and the price sellers keep (' + money(v.psell) + '), out to the quantity after the tax (' + units(v.q) + ').',
        { dwl: 'That triangle is the deadweight loss: the trades the tax stops. Tax revenue is the rectangle between the two prices, out to the quantity after the tax.', 'buyer-burden': 'That is only the buyers’ part of the tax. Tax revenue also includes the sellers’ part below the old price.', 'seller-burden': 'That is only the sellers’ part of the tax. Tax revenue also includes the buyers’ part above the old price.' }),
      numStep('rev', 'Calculate the tax revenue, in dollars.', v.rev, [
        { value: v.amount * k.qe, why: 'Tax revenue uses the quantity after the tax (' + units(v.q) + '), not the quantity before it.' },
        { value: v.pb * v.q, why: 'That is what buyers spend. Tax revenue is only the tax per unit times the units sold.' },
        { value: 0.5 * v.amount * v.q, why: 'Tax revenue is a rectangle, not a triangle: no one half.' }
      ], '3.A', { unit: 'dollars', hint: 'Tax revenue = tax per unit × quantity after the tax.' }),
      shadeStep('shade-dwl', 'Now shade the deadweight loss of the tax.', sp, 'dwl', '4.B', 'The deadweight loss is the triangle between demand and supply from the quantity after the tax out to the old equilibrium quantity.',
        { 'tax-revenue': 'That is the tax revenue, which goes to the government: it is not lost. The loss is the triangle of trades the tax stops.' }),
      numStep('dwl', 'Calculate the deadweight loss, in dollars.', v.dwl, [
        { value: 2 * v.dwl, why: 'A deadweight loss triangle is half of its rectangle: multiply by one half.' },
        { value: 0.5 * v.amount * v.q, why: 'The base is the drop in quantity (' + units(k.qe) + ' − ' + units(v.q) + '), not the quantity after the tax.' },
        { value: v.rev, why: 'That is the tax revenue. The deadweight loss is the triangle beside it.' }
      ], '3.A', { unit: 'dollars', hint: 'DWL = ½ × (the drop in quantity) × (the tax per unit).' }),
      numStep('burden', 'Of the ' + money(v.amount) + ' tax, how much more per unit do buyers now pay than before?', v.buyers, [
        { value: v.amount, why: 'Buyers do not pay the whole tax: the price they pay rose from ' + money(k.pe) + ' to ' + money(v.pb) + '. Sellers bear the rest.' },
        { value: v.pb, why: 'That is the whole price buyers pay. The question asks how much it rose.' }
      ], '3.A', { unit: 'dollars' })
    ];
    return {
      type: 'tax', ctx: ctx.id, topic: ctx.topic, text: text,
      figure: fig(m, sp, baseLegend(m, k).concat([[sub('P', 'B') + ', ' + sub('P', 'S'), money(v.pb) + ' paid by buyers, ' + money(v.psell) + ' kept by sellers'], [sub('Q', 'T'), units(v.q) + ' units after the tax']]), 'A per-unit tax shifts supply up by ' + money(v.amount) + '.'),
      steps: steps,
      solution: [
        'The tax shifts supply up by ' + money(v.amount) + '. The new quantity is ' + units(v.q) + '; buyers pay ' + money(v.pb) + ' and sellers keep ' + money(v.psell) + '.',
        'Tax revenue = ' + money(v.amount) + ' × ' + units(v.q) + ' = ' + money(v.rev) + '.',
        'DWL = ½ × (' + units(k.qe) + ' − ' + units(v.q) + ') × ' + money(v.amount) + ' = ' + money(v.dwl) + '.',
        'Buyers pay ' + money(v.buyers) + ' more per unit and sellers keep ' + money(v.sellers) + ' less. Here demand and supply are equally steep, so the tax splits evenly; the less elastic side bears more.'
      ],
      answer: { m: m, v: v }
    };
  }

  /* ------------------------------------------------- type: incidence */
  function genIncidence(r, ctx){
    var o, I, tries = 0;
    do {
      var b = r.pick([1, 2, 3, 4]), d = r.pick([1, 2, 3, 4]), k = r.pick([1, 2]), p0 = r.pick([10, 12, 15, 20, 24, 30]), q0 = r.pick([60, 80, 90, 120]);
      o = { a: q0 + b * p0, b: b, c: q0 - d * p0, d: d, t: (b + d) * k };
      I = incidence(o);
    } while((!(I.q1 > 0) || o.c < -o.d * 1000 || Math.abs(I.p0 - Math.round(I.p0)) > 1e-9) && ++tries < 60);
    var g = r.pick(GOODS), even = o.b === o.d, buyersMore = o.b < o.d;
    var rows = [I.p0 - 4, I.p0 - 2, I.p0, I.p0 + 2, I.p0 + 4].filter(function(p){ return p > 0; }).map(function(p){ return { p: p, qd: o.a - o.b * p, qs: o.c + o.d * p }; });
    var table = '<table class="ls-tbl sl-tbl"><caption>Market for ' + g.many + ' (invented data)</caption><thead><tr><th scope="col">Price</th><th scope="col">Quantity demanded</th><th scope="col">Quantity supplied</th></tr></thead><tbody>' +
      rows.map(function(x){ return '<tr' + (x.p === I.p0 ? ' class="is-eq"' : '') + '><th scope="row">' + money(x.p) + '</th><td>' + units(x.qd) + '</td><td>' + units(x.qs) + '</td></tr>'; }).join('') + '</tbody></table>';
    var text = '<p>Demand for ' + g.many + ' is Q<sub>d</sub> = ' + o.a + ' − ' + (o.b === 1 ? '' : o.b) + 'P and supply is Q<sub>s</sub> = ' + (o.c < 0 ? '−' + (-o.c) + ' + ' : o.c === 0 ? '' : o.c + ' + ') + (o.d === 1 ? '' : o.d) + 'P. The government puts a tax of <b>' + money(o.t) + ' per unit</b> on sellers, so sellers keep P − ' + o.t + ' of each sale.</p>';
    var whoC = deal(r, [
      even ? ['They split it evenly: demand and supply are equally elastic here', 'Right. Each quantity changes by the same amount per dollar, so at the starting point the two elasticities are equal and the tax splits evenly.'] :
        buyersMore ? ['Buyers, because demand is less elastic than supply', 'Right. Quantity demanded changes by ' + o.b + ' per dollar and quantity supplied by ' + o.d + ', so demand is less elastic: buyers cannot easily cut back, and they bear more.'] :
          ['Sellers, because supply is less elastic than demand', 'Right. Quantity supplied changes by ' + o.d + ' per dollar and quantity demanded by ' + o.b + ', so supply is less elastic: sellers cannot easily cut back, and they bear more.'],
      even ? ['Buyers, because demand is less elastic than supply', 'Here the two quantities change by the same amount per dollar, so neither side is less elastic: the tax splits evenly.'] :
        buyersMore ? ['Sellers, because supply is less elastic than demand', 'Supply is the more elastic side here (' + o.d + ' units per dollar against ' + o.b + '), so sellers can cut back more easily and bear less.'] :
          ['Buyers, because demand is less elastic than supply', 'Demand is the more elastic side here (' + o.b + ' units per dollar against ' + o.d + '), so buyers can cut back more easily and bear less.'],
      ['Sellers, because the tax is collected from them', 'Who sends the tax to the government does not decide who bears it. The burden falls more on the less elastic side.'],
      even ? ['Sellers, because supply is less elastic than demand', 'Here the two quantities change by the same amount per dollar, so neither side is less elastic: the tax splits evenly.'] : ['They split it evenly whatever the elasticities', 'The split depends on elasticity: the less elastic side bears more of the tax.']
    ]);
    var steps = [
      numStep('p0', 'Before the tax, what is the equilibrium price?', I.p0, [{ value: I.q0, why: 'That is the equilibrium quantity. Set Qₑ equal to Qₛ and solve for P.'.replace('Qₑ', 'Qd').replace('Qₛ', 'Qs') }], '3.A', { unit: 'dollars' }),
      numStep('pb', 'After the tax, what price do buyers pay?', I.pb, [
        { value: I.p0 + o.t, why: 'Buyers do not pay the whole tax: as the price rises they buy less, so sellers absorb part of it.' },
        { value: I.p0 + o.t / 2, why: 'An even split happens only when demand and supply are equally elastic. Solve Qd = ' + o.a + ' − ' + o.b + 'P against Qs = ' + o.c + ' + ' + o.d + '(P − ' + o.t + ').' },
        { value: I.ps, why: 'That is the price sellers keep (the buyers’ price minus the tax).' }
      ].filter(function(x){ return !(even && Math.abs(x.value - I.pb) < 1e-9); }), '3.A', { unit: 'dollars', hint: 'With the tax, supply is Qs = ' + o.c + ' + ' + o.d + '(P − ' + o.t + '). Set it equal to demand.' }),
      choice('who', 'Who bears more of this tax?', whoC.options, whoC.correct, whoC.why, '2.B')
    ];
    return {
      type: 'incidence', ctx: ctx.id, topic: ctx.topic, text: text, table: table,
      steps: steps,
      solution: [
        'Before the tax: ' + o.a + ' − ' + o.b + 'P = ' + o.c + ' + ' + o.d + 'P, so P = ' + money(I.p0) + ' and Q = ' + units(I.q0) + '.',
        'With the tax sellers keep P − ' + o.t + ': ' + o.a + ' − ' + o.b + 'P = ' + o.c + ' + ' + o.d + '(P − ' + o.t + '), so buyers pay ' + money(I.pb) + ' and sellers keep ' + money(I.ps) + '.',
        'Buyers pay ' + money(I.buyers) + ' more per unit; sellers keep ' + money(I.sellers) + ' less: buyers bear ' + M.fmt(I.buyerShare, 3) + '% of the tax.',
        even ? 'The quantities respond equally to price, so the split is even.' : 'The less elastic side (' + (buyersMore ? 'demand' : 'supply') + ') bears more: it cannot cut back as easily when its price changes.'
      ],
      answer: { o: o, I: I }
    };
  }

  /* ------------------------------------------------- type: subsidy */
  function genSubsidy(r, ctx){
    var m, k, a, sp, tries = 0;
    do { m = drawMarket(r); k = market(m); a = r.pick([1, 2, 3]); sp = spec(m, { type: 'subsidy', amount: a * m.kP }); } while((bad(sp) || k.eqG[0] + a / 2 > 9 || k.eqG[1] - a / 2 < 0.6) && ++tries < 60);
    var v = values(m, { type: 'subsidy', amount: a * m.kP }), g = m.good;
    var text = '<p>The government pays sellers of ' + g.many + ' a subsidy of <b>' + money(v.amount) + ' per unit</b>. Before the subsidy, ' + units(k.qe) + ' sold at ' + money(k.pe) + '.</p>';
    var whyC = deal(r, [
      ['The extra units cost more to make than buyers value them', 'Right. Beyond ' + units(k.qe) + ' units, supply (the cost of each unit) is above demand (its value to buyers): those trades lose value.'],
      ['Fewer units are traded than at the equilibrium', 'A subsidy raises the quantity traded, to ' + units(v.q) + '. The loss comes from units that should not be made.'],
      ['Buyers pay a higher price than before', 'Buyers pay less with a subsidy (' + money(v.pb) + ' instead of ' + money(k.pe) + ').'],
      ['The government spends money on the subsidy', 'Spending moves money from taxpayers to buyers and sellers. Only part of it, the triangle beyond the equilibrium quantity, is lost.']
    ]);
    var steps = [
      shadeStep('shade-cost', 'Shade the cost of the subsidy to the government.', sp, 'subsidy-cost', '4.B', 'The cost is the whole rectangle between the price sellers receive (' + money(v.psell) + ') and the price buyers pay (' + money(v.pb) + '), out to the new, larger quantity (' + units(v.q) + ').',
        { dwl: 'That triangle is the deadweight loss, only part of the cost. The cost is the whole rectangle between the two prices, out to the new quantity.', cs: 'That is consumer surplus after the subsidy. The cost is the rectangle between the price sellers receive and the price buyers pay.' }),
      numStep('cost', 'Calculate the cost of the subsidy, in dollars.', v.rev, [
        { value: v.amount * k.qe, why: 'Use the new, larger quantity (' + units(v.q) + '): the government pays the subsidy on every unit sold after it.' },
        { value: v.psell * v.q, why: 'That is everything sellers receive. The subsidy cost is only the subsidy per unit times the units sold.' },
        { value: 0.5 * v.amount * v.q, why: 'The cost is a rectangle, not a triangle: no one half.' }
      ], '3.A', { unit: 'dollars', hint: 'Cost = subsidy per unit × the new quantity.' }),
      shadeStep('shade-dwl', 'Now shade the deadweight loss of the subsidy.', sp, 'dwl', '4.B', 'The deadweight loss is the triangle beyond the equilibrium quantity, between supply (above) and demand (below), out to the new quantity.',
        { 'subsidy-cost': 'That is the whole cost of the subsidy. Most of it moves to buyers and sellers; only the triangle beyond the equilibrium quantity is lost.' }),
      numStep('dwl', 'Calculate the deadweight loss, in dollars.', v.dwl, [
        { value: 2 * v.dwl, why: 'A deadweight loss triangle is half of its rectangle: multiply by one half.' },
        { value: v.rev, why: 'That is the whole cost of the subsidy. The loss is only the triangle beyond the equilibrium quantity.' }
      ], '3.A', { unit: 'dollars', hint: 'DWL = ½ × (the rise in quantity) × (the subsidy per unit).' }),
      choice('why', 'Why does the subsidy cause a deadweight loss?', whyC.options, whyC.correct, whyC.why, '2.B')
    ];
    return {
      type: 'subsidy', ctx: ctx.id, topic: ctx.topic, text: text,
      figure: fig(m, sp, baseLegend(m, k).concat([[sub('P', 'S') + ', ' + sub('P', 'B'), money(v.psell) + ' received by sellers, ' + money(v.pb) + ' paid by buyers'], [sub('Q', 'SUB'), units(v.q) + ' units with the subsidy']]), 'A per-unit subsidy shifts supply down by ' + money(v.amount) + '.'),
      steps: steps,
      solution: [
        'The subsidy shifts supply down by ' + money(v.amount) + '. The quantity rises to ' + units(v.q) + '; buyers pay ' + money(v.pb) + ' and sellers receive ' + money(v.psell) + '.',
        'Cost = ' + money(v.amount) + ' × ' + units(v.q) + ' = ' + money(v.rev) + ': the rectangle between the two prices out to the new quantity.',
        'DWL = ½ × (' + units(v.q) + ' − ' + units(k.qe) + ') × ' + money(v.amount) + ' = ' + money(v.dwl) + ': the units past ' + units(k.qe) + ' cost more than buyers value them.'
      ],
      answer: { m: m, v: v }
    };
  }

  /* ------------------------------------------------- type: trade */
  var COUNTRIES = ['Kestavia', 'Orlund', 'Pellaro'];
  function genTrade(r, ctx){
    var m, k, gap, sp, at, tries = 0;
    do { m = drawMarket(r); k = market(m); gap = r.pick([1, 1.5, 2]); at = k.eqG[1] - gap; sp = spec(m, { type: 'world', at: at * m.kP }); } while((bad(sp) || at - (-m.sS) < 1) && ++tries < 60);
    var v = values(m, { type: 'world', at: at * m.kP }), g = m.good, land = r.pick(COUNTRIES);
    var text = '<p>' + land + ' opens its market for ' + g.many + ' to free trade at a world price of <b>' + money(v.at) + '</b>. With no trade, ' + units(k.qe) + ' sold at ' + money(k.pe) + '.</p>';
    var psC = deal(r, [
      ['Domestic producers lose surplus and domestic consumers gain more than producers lose', 'Right. Producer surplus shrinks to the triangle below ' + money(v.at) + '; consumer surplus grows by more, so total surplus rises by the gain from trade.'],
      ['Both domestic producers and domestic consumers gain', 'Domestic producers now sell fewer units at a lower price: their surplus falls.'],
      ['Domestic producers gain because they can sell to the world', 'At a world price below the domestic price the country imports: domestic producers sell less, at a lower price.'],
      ['Total surplus falls because domestic firms sell less', 'Consumers gain more than producers lose: total surplus rises by the gain from trade.']
    ]);
    var steps = [
      numStep('imports', 'How many ' + g.many + ' does ' + land + ' import?', v.imports, [
        { value: k.qe - v.qs, why: 'Imports are quantity demanded minus quantity supplied at the world price, not the drop from the equilibrium quantity.' },
        { value: v.qd, why: 'That is all the ' + g.many + ' bought. Domestic sellers supply ' + units(v.qs) + ' of them; imports are the rest.' }
      ], '3.A', { unit: 'units' }),
      shadeStep('shade', 'Shade the gain in total surplus from trade.', sp, 'gain', '4.B', 'The gain from trade is the triangle between demand and supply above the world price, from the domestic quantity supplied to the quantity demanded.',
        { 'cs-before': 'That is consumer surplus before trade. The gain is the new triangle between demand and supply above the world price.', ps: 'That is producer surplus after trade. The gain is the triangle between demand and supply above the world price.' }),
      numStep('gain', 'Calculate the gain in total surplus from trade, in dollars.', v.gain, [
        { value: 2 * v.gain, why: 'The gain is a triangle: multiply by one half.' },
        { value: v.imports * (k.pe - v.at), why: 'That is the rectangle around the triangle. Multiply by one half.' }
      ], '3.A', { unit: 'dollars' }),
      choice('who', 'Compared with no trade, what happens to surplus?', psC.options, psC.correct, psC.why, '2.B')
    ];
    return {
      type: 'trade', ctx: ctx.id, topic: ctx.topic, text: text,
      figure: fig(m, sp, baseLegend(m, k).concat([[sub('P', 'W'), money(v.at) + ', the world price'], [sub('Q', 'S') + ', ' + sub('Q', 'D'), units(v.qs) + ' and ' + units(v.qd) + ' units']]), 'A world price of ' + money(v.at) + ' below the domestic equilibrium price.'),
      steps: steps,
      solution: [
        'At ' + money(v.at) + ' buyers want ' + units(v.qd) + ' and domestic sellers offer ' + units(v.qs) + ', so imports are ' + units(v.imports) + '.',
        'Gain from trade = ½ × ' + units(v.imports) + ' × (' + money(k.pe) + ' − ' + money(v.at) + ') = ' + money(v.gain) + '.',
        'Producer surplus falls to ' + money(v.ps) + ' and consumer surplus rises to ' + money(v.cs) + ': total surplus rises from ' + money(v.ts0) + ' to ' + money(v.ts) + '.'
      ],
      answer: { m: m, v: v, land: land }
    };
  }

  /* ------------------------------------------------- type: tariff */
  function genTariff(r, ctx){
    var m, k, gap, a, sp, at, tries = 0;
    do { m = drawMarket(r); k = market(m); a = r.pick([1, 2]); gap = r.pick([2.5, 3]); at = k.eqG[1] - gap; sp = spec(m, { type: 'tariff', at: at * m.kP, amount: a * m.kP }); } while((bad(sp) || at - (-m.sS) < 0.75) && ++tries < 80);
    var v = values(m, { type: 'tariff', at: at * m.kP, amount: a * m.kP }), g = m.good, land = r.pick(COUNTRIES);
    var text = '<p>' + land + ' imports ' + g.many + ' at a world price of ' + money(v.at) + '. It now puts a tariff of <b>' + money(v.amount) + ' per unit</b> on imports, so the domestic price rises to ' + money(v.pt) + '.</p>';
    var steps = [
      numStep('imports', 'After the tariff, how many ' + g.many + ' does ' + land + ' import?', v.imports, [
        { value: v.imports1, why: 'That is imports before the tariff. At ' + money(v.pt) + ' buyers want fewer and domestic sellers offer more.' },
        { value: v.qd2, why: 'That is all the ' + g.many + ' bought. Imports are quantity demanded minus domestic quantity supplied.' }
      ], '3.A', { unit: 'units' }),
      shadeStep('shade-rev', 'Shade the tariff revenue.', sp, 'tariff-revenue', '4.B', 'Tariff revenue is the rectangle between the world price and the price with the tariff, over the imports after the tariff.',
        { dwl: 'Those two triangles are the deadweight loss. Tariff revenue is the rectangle between them, over the imports after the tariff.' }),
      numStep('rev', 'Calculate the tariff revenue, in dollars.', v.rev, [
        { value: v.amount * v.imports1, why: 'Use the imports after the tariff (' + units(v.imports) + '), not before it.' },
        { value: v.amount * v.qd2, why: 'The tariff is paid only on imports, not on what domestic sellers supply.' }
      ], '3.A', { unit: 'dollars', hint: 'Tariff revenue = tariff per unit × imports after the tariff.' }),
      shadeStep('shade-dwl', 'Now shade the deadweight loss of the tariff.', sp, 'dwl', '4.B', 'The deadweight loss is two triangles: on the left, units now made at home at a cost above the world price; on the right, purchases buyers give up.',
        { 'tariff-revenue': 'That is the tariff revenue, which goes to the government. The loss is the two triangles beside it.' }),
      numStep('dwl', 'Calculate the deadweight loss, in dollars.', v.dwl, [
        { value: v.dwlS, why: 'That is only the triangle on the supply side. Add the one on the demand side.' },
        { value: v.dwlD, why: 'That is only the triangle on the demand side. Add the one on the supply side.' },
        { value: 2 * v.dwl, why: 'Each triangle is half of its rectangle: multiply by one half.' }
      ].filter(function(x, i, a){ return a.findIndex(function(y){ return Math.abs(y.value - x.value) < 1e-9; }) === i; }), '3.A', { unit: 'dollars' })
    ];
    return {
      type: 'tariff', ctx: ctx.id, topic: ctx.topic, text: text,
      figure: fig(m, sp, baseLegend(m, k).concat([[sub('P', 'W') + ', ' + sub('P', 'W + t'), money(v.at) + ' and ' + money(v.pt)], [sub('Q', 'S1') + ', ' + sub('Q', 'S2') + ', ' + sub('Q', 'D2') + ', ' + sub('Q', 'D1'), [v.qs1, v.qs2, v.qd2, v.qd1].map(units).join(', ') + ' units']]), 'A tariff of ' + money(v.amount) + ' on a world price of ' + money(v.at) + '.'),
      steps: steps,
      solution: [
        'At ' + money(v.pt) + ' buyers want ' + units(v.qd2) + ' and domestic sellers offer ' + units(v.qs2) + ': imports fall from ' + units(v.imports1) + ' to ' + units(v.imports) + '.',
        'Tariff revenue = ' + money(v.amount) + ' × ' + units(v.imports) + ' = ' + money(v.rev) + '.',
        'DWL = ½ × ' + units(v.qs2 - v.qs1) + ' × ' + money(v.amount) + ' + ½ × ' + units(v.qd1 - v.qd2) + ' × ' + money(v.amount) + ' = ' + money(v.dwl) + '.'
      ],
      answer: { m: m, v: v, land: land }
    };
  }

  var GEN = { surplus: genSurplus, control: genControl, tax: genTax, incidence: genIncidence, subsidy: genSubsidy, trade: genTrade, tariff: genTariff };
  var TYPES = Object.keys(GEN);
  function generate(r, ctx, type){
    var t = type && GEN[type] ? type : r.pick(ctx.types || TYPES);
    if((ctx.types || TYPES).indexOf(t) < 0) t = r.pick(ctx.types || TYPES);
    return GEN[t](r, ctx);
  }

  M.register('surplusLab', {
    POLICIES: POLICIES, TYPES: TYPES, GOODS: GOODS, SCALES: SCALES, COUNTRIES: COUNTRIES,
    spec: spec, market: market, values: values, partition: partition, incidence: incidence,
    money: money, units: units, qAtD: qAtD, qAtS: qAtS, pD: pD, pS: pS, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
