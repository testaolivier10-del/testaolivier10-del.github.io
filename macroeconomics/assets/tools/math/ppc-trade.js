/* PPC and trade model: ApMacroMath.ppcTrade (docs/apmacro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T3, docs/apmacro-briefs/t3.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmacro-tool-checks/ppc-trade.mjs) and the
   test (scripts/test/apmacro-tool-ppc-trade.test.mjs) run exactly this code.

   Numbers come from ApMacroCalc (calc() below); the bowed-out PPC is
   ApMacroGraph's `ppc` kind (its region() says inside, on or outside), the
   straight-line PPCs of the trade view are data (two countries' outputs),
   drawn by the page with ApMacroPlot.

   Explore
     PPC_EVENTS, ppcSpec(names)   the events that shift the PPC or move the point
     ppcAt(x, eff, shift)         the point on (eff 1) or inside (eff < 1) the
                                  PPC at x, in graph units (0-10)
     marginal(x, shift)           the units of the other good given up for the
                                  next unit (graph units x 10)
     SCENARIOS, trade(sc, t, on)  two countries' outputs: opportunity costs,
                                  comparative advantage, the terms that help
                                  both, and consumption before and after trade
   Test yourself: generate(r, ctx, type), types 'ppc-point', 'ppc-oc' (context
   ppc, topic opportunity-cost-ppc), 'output', 'input', 'terms' (context trade,
   topic comparative-advantage). Every choice step's key is option 0. */
(function(root){
  'use strict';
  var M = root.ApMacroMath;
  if(!M) return;
  function calc(fn){ return M.Calc().evaluate({ fn: fn, args: [].slice.call(arguments, 1) }); }
  function n(x, d){
    var s = M.fixed(Math.abs(x), d == null ? 2 : d).replace(/\.?0+$/, '');
    if(s === '') s = '0';
    return (x < 0 && Number(s) ? '−' : '') + s;
  }

  var TYPES = ['ppc-point', 'ppc-oc', 'output', 'input', 'terms'];
  var TITLE = { 'ppc-point': 'Points and shifts on a PPC', 'ppc-oc': 'Opportunity cost from a PPC table', output: 'Comparative advantage from output', input: 'Comparative advantage from inputs', terms: 'Terms of trade that help both' };

  /* ------------------------------------------------------------- PPC */
  var R0 = 7;   // ApMacroGraph's PPC: a quarter circle of radius 7 (+1 per step)
  function ppcSpec(names, start){ var s = { kind: 'ppc', names: names, do: ['point'] }; if(start) s.start = { PPC: start }; return s; }
  function ppcAt(x, eff, shift){
    var r = R0 + (shift || 0), xx = Math.max(0, Math.min(r, x));
    return [M.round(xx * (eff == null ? 1 : eff), 4), M.round(Math.sqrt(r * r - xx * xx) * (eff == null ? 1 : eff), 4)];
  }
  // Units of the y good given up when x rises by 1 graph unit (shown x 10).
  function marginal(x, shift){
    var r = R0 + (shift || 0), a = Math.min(r, x), b = Math.min(r, x + 1);
    return calc('mul', calc('sub', Math.sqrt(r * r - a * a), Math.sqrt(r * r - b * b)), 10);
  }
  var PPC_EVENTS = [
    { id: 'tech', name: 'Better technology', shift: 1, eff: null, say: 'New technology lets the same resources make more of both goods: the PPC shifts out.' },
    { id: 'workers', name: 'More workers', shift: 1, eff: null, say: 'More labor is more resources: the PPC shifts out (economic growth).' },
    { id: 'disaster', name: 'A disaster destroys factories', shift: -1, eff: null, say: 'Less capital means less can be made of both goods: the PPC shifts in.' },
    { id: 'recession', name: 'A recession', shift: 0, eff: 0.7, say: 'Workers and machines sit idle. Nothing about the resources changed, so the PPC stays put; the economy moves to a point inside it.' },
    { id: 'recover', name: 'Full employment again', shift: 0, eff: 1, say: 'Idle resources go back to work: the economy moves back onto its PPC.' }
  ];

  /* ------------------------------------------------------------ trade */
  var SCENARIOS = [
    { id: 'wheat', goods: ['Wheat', 'Cloth'], unit: 'tons', A: { name: 'Avalon', x: 40, y: 20 }, B: { name: 'Brio', x: 30, y: 30 } },
    { id: 'cars', goods: ['Cars', 'Computers'], unit: 'thousand', A: { name: 'Corvia', x: 60, y: 30 }, B: { name: 'Dalmar', x: 20, y: 20 } },
    { id: 'tea', goods: ['Tea', 'Rice'], unit: 'tons', A: { name: 'Estra', x: 24, y: 8 }, B: { name: 'Fenna', x: 10, y: 10 } }
  ];
  /* sc: { goods, A: { name, x, y }, B }; t: the price of one unit of the x
     good, in units of the y good; on: specialize and trade. The country with
     the lower opportunity cost of x makes only x and trades q units of it
     (half its x, or less if the other country could not pay at the highest
     terms shown) for y; the other makes only y. */
  function trade(sc, t, on){
    var ocA = calc('opportunityCost', sc.A.y, sc.A.x), ocB = calc('opportunityCost', sc.B.y, sc.B.x);
    var xer = ocA < ocB ? 'A' : 'B', yer = xer === 'A' ? 'B' : 'A', X = sc[xer], Y = sc[yer];
    var lo = Math.min(ocA, ocB), hi = Math.max(ocA, ocB);
    // the amount of the x good traded: half of the exporter's output, or less
    // when the other country could not pay for it at the highest terms shown
    var q = calc('min', calc('div', X.x, 2), Math.floor(Y.y / (1.6 * hi)));
    var res = { ocA: ocA, ocB: ocB, ocAy: calc('opportunityCost', sc.A.x, sc.A.y), ocBy: calc('opportunityCost', sc.B.x, sc.B.y), xer: xer, yer: yer, lo: lo, hi: hi, q: q,
      absX: sc.A.x === sc.B.x ? null : sc.A.x > sc.B.x ? 'A' : 'B', absY: sc.A.y === sc.B.y ? null : sc.A.y > sc.B.y ? 'A' : 'B',
      tMax: calc('mul', hi, 1.6), tMin: calc('mul', lo, 0.5) };
    res.before = { A: [calc('div', sc.A.x, 2), calc('div', sc.A.y, 2)], B: [calc('div', sc.B.x, 2), calc('div', sc.B.y, 2)] };
    var after = {};
    after[xer] = [calc('sub', X.x, q), calc('mul', q, t)];
    after[yer] = [q, calc('sub', Y.y, calc('mul', q, t))];
    // what each could have had on its own PPC at the same amount of the x good
    var selfX = calc('mul', calc('sub', X.x, after[xer][0]), xer === 'A' ? ocA : ocB);              // y the x-exporter could make alone at that x
    var selfY = calc('sub', Y.y, calc('mul', q, yer === 'A' ? ocA : ocB));                           // y the y-exporter could keep alone while making q of x
    res.after = after;
    res.gain = {};
    res.gain[xer] = calc('sub', after[xer][1], selfX);
    res.gain[yer] = calc('sub', after[yer][1], selfY);
    res.both = t > lo + 1e-9 && t < hi - 1e-9;
    res.on = !!on;
    res.t = t;
    return res;
  }

  /* --------------------------------------------------------- problems */
  function num(key, label, answer, mistakes, o){
    o = o || {};
    var s = { key: key, kind: 'num', label: label, practice: o.practice || '3.A', level: o.level || 'apply', cell: M.cell(answer, 0.004, mistakes || [], 0.006), d: 2 };
    if(o.hint) s.hint = o.hint;
    if(o.unit) s.unit = o.unit;
    return s;
  }
  function choice(key, label, options, why, o){
    o = o || {};
    return { key: key, kind: 'choice', label: label, options: options, why: why, correct: 0, practice: o.practice || '1.D', level: o.level || 'apply' };
  }
  var PAIRS = [['Robots', 'Pizzas'], ['Tractors', 'Wheat'], ['Computers', 'Shirts'], ['Machines', 'Bread'], ['Houses', 'Apples']];
  var NAMES = ['Avalon', 'Brio', 'Corvia', 'Dalmar', 'Estra', 'Fenna', 'Galen', 'Halvar'];
  var GOODS = [['Wheat', 'Cloth'], ['Cars', 'Computers'], ['Tea', 'Rice'], ['Shirts', 'Shoes'], ['Fish', 'Lumber'], ['Cheese', 'Wine']];
  var REGION = {
    on: 'On the PPC: efficient, with every resource in use',
    inside: 'Inside the PPC: possible, but resources sit idle or are wasted',
    outside: 'Outside the PPC: not possible with today\'s resources and technology'
  };
  var REGION_WHY = {
    on: 'Points on the curve use every resource fully: the economy cannot make more of one good without making less of the other.',
    inside: 'A point inside the curve means unemployed or badly used resources: the economy could make more of both goods.',
    outside: 'A point outside the curve needs more resources or better technology than the economy has now.'
  };
  var MOVE = { out: 'The PPC shifts outward', in: 'The PPC shifts inward', inside: 'No shift: the economy moves to a point inside the PPC', along: 'No shift: the economy moves along its PPC' };
  var MOVE_WHY = {
    out: 'More resources or better technology let the economy make more of both goods: the curve shifts out.',
    in: 'Lost resources mean less of both goods can be made: the curve shifts in.',
    inside: 'Idle resources are still there, so the curve does not move; output falls to a point inside it.',
    along: 'Choosing a different mix of the two goods with the same resources is a movement along the curve.'
  };
  var MOVE_NOT = {
    out: 'An outward shift needs more resources or better technology.',
    in: 'An inward shift needs lost resources, such as destroyed capital.',
    inside: 'A point inside the curve comes from idle resources, as in a recession.',
    along: 'A move along the curve is a choice of a different mix with the same resources.'
  };
  var PPC_SCN = [
    { m: 'out', s: function(g){ return 'A new technology raises productivity in making both ' + g[0].toLowerCase() + ' and ' + g[1].toLowerCase() + '.'; } },
    { m: 'out', s: function(){ return 'Many new workers join the labor force.'; } },
    { m: 'in', s: function(){ return 'A severe flood destroys many factories and much farmland.'; } },
    { m: 'inside', s: function(){ return 'A recession leaves many workers unemployed and factories idle.'; } },
    { m: 'along', s: function(g){ return 'The country chooses to make more ' + g[0].toLowerCase() + ' and less ' + g[1].toLowerCase() + '.'; } }
  ];
  function genPoint(r){
    var g = r.pick(PAIRS), region = r.pick(['on', 'inside', 'outside']), th = r.pick([25, 35, 45, 55, 65]) * Math.PI / 180;
    var rad = region === 'on' ? R0 : region === 'inside' ? r.pick([3.5, 4, 4.5]) : r.pick([8.5, 9]);
    var pt = [M.round(rad * Math.cos(th), 2), M.round(rad * Math.sin(th), 2)];
    var spec = { kind: 'ppc', names: { x: g[0], y: g[1] }, do: ['point'], pointLabel: 'X' };
    var keys = ['on', 'inside', 'outside'].filter(function(k){ return k !== region; });
    var sc = r.pick(PPC_SCN), moves = ['out', 'in', 'inside', 'along'].filter(function(k){ return k !== sc.m; });
    var steps = [
      choice('region', 'Where is point X, and what does it mean?', [REGION[region]].concat(keys.map(function(k){ return REGION[k]; })),
        [region].concat(keys).map(function(k, i){ return i === 0 ? 'Right. ' + REGION_WHY[k] : 'Look again: X is ' + (region === 'on' ? 'on' : region) + ' the curve. ' + REGION_WHY[region]; }), { practice: '2.A' }),
      choice('event', sc.s(g) + ' What happens on the PPC graph?', [MOVE[sc.m]].concat(moves.map(function(k){ return MOVE[k]; })),
        [sc.m].concat(moves).map(function(k, i){ return i === 0 ? 'Right. ' + MOVE_WHY[k] : MOVE_NOT[k] + ' Here: ' + MOVE_WHY[sc.m].charAt(0).toLowerCase() + MOVE_WHY[sc.m].slice(1); }), { practice: '1.D', level: 'analyze' }),
      choice('shape', 'Why is this PPC bowed out from the origin?', [
        'Resources are not equally good at making both goods, so each extra unit of ' + g[0].toLowerCase() + ' costs more ' + g[1].toLowerCase(),
        'The opportunity cost of ' + g[0].toLowerCase() + ' is the same at every point',
        'The economy has unemployed resources',
        'Technology improves over time'
      ], [
        'Right: increasing opportunity cost bows the curve out. A straight-line PPC means a constant opportunity cost.',
        'A constant opportunity cost gives a straight-line PPC, not a bowed one.',
        'Unemployment puts the economy inside the curve; it does not change the curve\'s shape.',
        'Better technology shifts the curve out; the bowed shape comes from increasing opportunity cost.'
      ], { practice: '1.A' })
    ];
    return { type: 'ppc-point', fig: { graph: spec, point: pt }, values: { region: region, point: pt, move: sc.m, goods: g }, text: '<p>The graph shows an economy\'s production possibilities curve for ' + g[0].toLowerCase() + ' and ' + g[1].toLowerCase() + ', with its current output at point X.</p>', steps: steps,
      solution: [
        'Point X is <b>' + region + '</b> the PPC. ' + REGION_WHY[region],
        '<b>' + MOVE[sc.m] + '.</b> ' + MOVE_WHY[sc.m],
        'The bowed-out shape shows increasing opportunity cost: resources suited to one good are moved to the other.'
      ] };
  }

  function genOc(r){
    var g = r.pick(PAIRS), sx = r.pick([1, 2, 5, 10]), a = r.pick([1, 2, 3, 4]), b = r.pick([0, 0, 1, 2]);
    var incs = [a, a + b, a + 2 * b, a + 3 * b].map(function(v){ return v * (sx === 1 ? 1 : sx === 2 ? 2 : 5); });
    var ys = [incs.reduce(function(s, v){ return s + v; }, 0)];
    incs.forEach(function(v){ ys.push(ys[ys.length - 1] - v); });
    var xs = [0, 1, 2, 3, 4].map(function(i){ return i * sx; }), L = ['A', 'B', 'C', 'D', 'E'], i = r.int(0, 3);
    var gave = calc('sub', ys[i], ys[i + 1]), gained = calc('sub', xs[i + 1], xs[i]), per = calc('opportunityCost', gave, gained);
    var x0 = g[0].toLowerCase(), y0 = g[1].toLowerCase();
    var fig = '<table class="ppc-tbl"><caption>Production possibilities</caption><thead><tr><th scope="col">Point</th>' + L.map(function(l){ return '<th scope="col" class="r">' + l + '</th>'; }).join('') + '</tr></thead><tbody>' +
      '<tr><th scope="row">' + g[0] + '</th>' + xs.map(function(v){ return '<td class="r">' + v + '</td>'; }).join('') + '</tr><tr><th scope="row">' + g[1] + '</th>' + ys.map(function(v){ return '<td class="r">' + v + '</td>'; }).join('') + '</tr></tbody></table>';
    var plot = { label: 'The production possibilities in the table, plotted as a curve', width: 360, height: 250, x: [0, xs[4] * 1.1], y: [0, ys[0] * 1.12], xLabel: g[0], yLabel: g[1],
      lines: xs.slice(1).map(function(x, k){ return { seg: true, through: [[xs[k], ys[k]], [x, ys[k + 1]]], cls: 's1' }; }),
      points: xs.map(function(x, k){ return { at: [x, ys[k]], cls: 's1', label: L[k] }; }) };
    var shape = b === 0 ? 'same' : 'up';
    var steps = [
      num('gave', 'Moving from point ' + L[i] + ' to point ' + L[i + 1] + ', how many ' + y0 + ' are given up?', gave, [
        { value: ys[i + 1], why: 'That is how many ' + y0 + ' are left at ' + L[i + 1] + '. The cost is the drop: ' + ys[i] + ' − ' + ys[i + 1] + '.' },
        { value: gained, why: 'That is how many more ' + x0 + ' you get. The cost is what you give up: ' + y0 + '.' }
      ], { unit: y0, practice: '3.A' }),
      num('per', 'The opportunity cost of one more unit of ' + x0 + ' between ' + L[i] + ' and ' + L[i + 1] + ' (in ' + y0 + ')', per, [
        { value: calc('opportunityCost', gained, gave), why: 'That is upside down: it is the cost of one ' + y0.replace(/s$/, '') + ' in ' + x0 + '. For one unit of ' + x0 + ', divide the ' + y0 + ' given up by the ' + x0 + ' gained.' },
        { value: gave, why: 'That is the cost of all ' + gained + ' extra ' + x0 + '. Divide by ' + gained + ' for one unit.' }
      ], { hint: 'Given up ÷ gained', practice: '3.A' }),
      choice('shape', 'What happens to the opportunity cost of ' + x0 + ' as more ' + x0 + ' is made?', [
        shape === 'up' ? 'It rises: the PPC is bowed out' : 'It stays the same: the PPC is a straight line',
        shape === 'up' ? 'It stays the same: the PPC is a straight line' : 'It rises: the PPC is bowed out',
        'It falls: the PPC bows in toward the origin'
      ], [
        shape === 'up' ? 'Right: each step gives up more ' + y0 + ' (' + incs.join(', ') + '), so the cost rises and the curve bows out.' : 'Right: each step gives up the same ' + incs[0] + ' ' + y0 + ', so the PPC is a straight line.',
        shape === 'up' ? 'Each step gives up more ' + y0 + ' than the last (' + incs.join(', ') + '), so the cost is rising.' : 'Each step gives up the same amount (' + incs[0] + '), so the cost is constant.',
        'The ' + y0 + ' given up per step ' + (shape === 'up' ? 'grows' : 'stays the same') + ' (' + incs.join(', ') + '); it never shrinks.'
      ], { practice: '2.B' })
    ];
    return { type: 'ppc-oc', fig: { html: fig, plot: plot }, values: { xs: xs, ys: ys, i: i, gave: gave, gained: gained, per: per, shape: shape, goods: g }, text: '<p>The table lists five points on a country\'s production possibilities curve.</p>', steps: steps,
      solution: [
        'From ' + L[i] + ' to ' + L[i + 1] + ': ' + x0 + ' rise from ' + xs[i] + ' to ' + xs[i + 1] + ' and ' + y0 + ' fall from ' + ys[i] + ' to ' + ys[i + 1] + ': <b>' + gave + ' ' + y0 + '</b> given up.',
        'Per unit: ' + gave + ' ÷ ' + gained + ' = <b>' + n(per) + ' ' + y0 + '</b> for each extra unit of ' + x0 + '.',
        shape === 'up' ? 'The amounts given up per step (' + incs.join(', ') + ') rise: increasing opportunity cost, a bowed-out PPC.' : 'The amount given up per step is always ' + incs[0] + ': constant opportunity cost, a straight-line PPC.'
      ] };
  }

  // Two countries whose opportunity costs differ (and are four-function friendly).
  function countries(r){
    var nm = M.shuffle(r, NAMES).slice(0, 2), goods = r.pick(GOODS);
    var opts = [10, 12, 15, 20, 24, 30, 40, 60];
    var a, b, guard = 0;
    do {
      a = { name: nm[0], x: r.pick(opts), y: r.pick(opts) };
      b = { name: nm[1], x: r.pick(opts), y: r.pick(opts) };
      var oa = a.y / a.x, ob = b.y / b.x;
      var nice = function(v){ return Math.abs(v * 100 - Math.round(v * 100)) < 1e-9; };
    } while((Math.abs(oa - ob) < 0.15 || !nice(oa) || !nice(ob) || !nice(1 / oa) || !nice(1 / ob)) && ++guard < 400);
    return { A: a, B: b, goods: goods };
  }
  function outTable(c, unit){
    return '<table class="ppc-tbl"><caption>Most each country can make with all its resources' + (unit ? ' (' + unit + ')' : '') + '</caption><thead><tr><th scope="col">Country</th><th scope="col" class="r">' + c.goods[0] + '</th><th scope="col" class="r">' + c.goods[1] + '</th></tr></thead><tbody>' +
      [c.A, c.B].map(function(k){ return '<tr><th scope="row">' + k.name + '</th><td class="r">' + k.x + '</td><td class="r">' + k.y + '</td></tr>'; }).join('') + '</tbody></table>';
  }
  function outPlot(c){
    var mx = Math.max(c.A.x, c.B.x) * 1.12, my = Math.max(c.A.y, c.B.y) * 1.15;
    return { label: 'Straight-line production possibilities curves of ' + c.A.name + ' and ' + c.B.name, width: 360, height: 250, x: [0, mx], y: [0, my], xLabel: c.goods[0], yLabel: c.goods[1],
      lines: [{ seg: true, through: [[0, c.A.y], [c.A.x, 0]], cls: 's1' }, { seg: true, through: [[0, c.B.y], [c.B.x, 0]], cls: 's2' }],
      legend: [{ name: c.A.name, cls: 's1' }, { name: c.B.name, cls: 's2' }] };
  }
  function genOutput(r){
    var c = countries(r), X = c.goods[0].toLowerCase(), Y = c.goods[1].toLowerCase();
    var ocA = calc('opportunityCost', c.A.y, c.A.x), ocB = calc('opportunityCost', c.B.y, c.B.x);
    var ca = ocA < ocB ? c.A : c.B, other = ca === c.A ? c.B : c.A;
    var absX = c.A.x === c.B.x ? null : c.A.x > c.B.x ? c.A : c.B;
    var steps = [
      num('ocA', 'In ' + c.A.name + ', the opportunity cost of 1 unit of ' + X + ' (in ' + Y + ')', ocA, [
        { value: calc('opportunityCost', c.A.x, c.A.y), why: 'That is upside down: it is the cost of one unit of ' + Y + '. With output data, one ' + X + ' costs ' + Y + ' ÷ ' + X + ' = ' + c.A.y + ' ÷ ' + c.A.x + '.' }
      ], { hint: 'Output data: the other good ÷ this good', practice: '3.A' }),
      num('ocB', 'In ' + c.B.name + ', the opportunity cost of 1 unit of ' + X + ' (in ' + Y + ')', ocB, [
        { value: calc('opportunityCost', c.B.x, c.B.y), why: 'That is upside down: one ' + X + ' costs ' + Y + ' ÷ ' + X + ' = ' + c.B.y + ' ÷ ' + c.B.x + '.' }
      ], { practice: '3.A' }),
      choice('ca', 'Which country has the comparative advantage in ' + X + '?', [ca.name, other.name, 'Neither: comparative advantage needs one country to make more of both goods'], [
        'Right: ' + ca.name + ' gives up less ' + Y + ' for each unit of ' + X + ' (' + n(Math.min(ocA, ocB)) + ' against ' + n(Math.max(ocA, ocB)) + ').',
        other.name + '\'s opportunity cost of ' + X + ' is higher (' + n(Math.max(ocA, ocB)) + ' ' + Y + ').' + (absX === other ? ' It makes more ' + X + ' (an absolute advantage), but comparative advantage goes to the lower opportunity cost.' : ''),
        'Comparative advantage only needs the opportunity costs to differ, which they do. Making more of both is absolute advantage.'
      ], { practice: '2.B' }),
      choice('spec', 'If they specialize and trade, what should ' + other.name + ' make?', [c.goods[1], c.goods[0], 'Some of each good'], [
        'Right: ' + other.name + ' has the lower opportunity cost of ' + Y + ' (' + n(other === c.A ? 1 / ocA : 1 / ocB) + ' ' + X + ' per unit, against ' + n(ca === c.A ? 1 / ocA : 1 / ocB) + '), so it specializes in ' + Y + '.',
        ca.name + ' makes ' + X + ' at the lower cost, so ' + other.name + ' should make the other good.',
        'The gains from trade come from each country specializing in the good it makes at the lower opportunity cost.'
      ], { practice: '1.D', level: 'analyze' })
    ];
    return { type: 'output', fig: { html: outTable(c), plot: outPlot(c) }, values: { c: c, ocA: ocA, ocB: ocB, ca: ca.name }, text: '<p>' + c.A.name + ' and ' + c.B.name + ' each use all their resources to make ' + X + ' or ' + Y + '. The table shows the most each could make of one good if it made none of the other.</p>', steps: steps,
      solution: [
        c.A.name + ': 1 ' + X + ' costs ' + c.A.y + ' ÷ ' + c.A.x + ' = <b>' + n(ocA) + ' ' + Y + '</b>. ' + c.B.name + ': ' + c.B.y + ' ÷ ' + c.B.x + ' = <b>' + n(ocB) + ' ' + Y + '</b>.',
        '<b>' + ca.name + '</b> has the lower opportunity cost of ' + X + ', so the comparative advantage in ' + X + '; ' + other.name + ' has it in ' + Y + '.',
        'Absolute advantage (who makes more) does not decide trade: ' + (absX ? absX.name + ' can make more ' + X + '.' : 'they make the same amount of ' + X + '.')
      ] };
  }

  function genInput(r){
    var nm = M.shuffle(r, NAMES).slice(0, 2), goods = r.pick(GOODS), X = goods[0].toLowerCase(), Y = goods[1].toLowerCase(), hours = [1, 2, 3, 4, 5, 6, 8, 10], a, b, guard = 0;
    do { a = { name: nm[0], hx: r.pick(hours), hy: r.pick(hours) }; b = { name: nm[1], hx: r.pick(hours), hy: r.pick(hours) }; }
    while((Math.abs(a.hx / a.hy - b.hx / b.hy) < 0.15 || a.hx === a.hy && b.hx === b.hy) && ++guard < 400);
    var ocA = calc('opportunityCost', a.hx, a.hy), ocB = calc('opportunityCost', b.hx, b.hy);
    var ca = ocA < ocB ? a : b, other = ca === a ? b : a;
    var fig = '<table class="ppc-tbl"><caption>Hours of labor to make one unit</caption><thead><tr><th scope="col">Country</th><th scope="col" class="r">1 unit of ' + X + '</th><th scope="col" class="r">1 unit of ' + Y + '</th></tr></thead><tbody>' +
      [a, b].map(function(k){ return '<tr><th scope="row">' + k.name + '</th><td class="r">' + k.hx + ' h</td><td class="r">' + k.hy + ' h</td></tr>'; }).join('') + '</tbody></table>';
    var steps = [
      num('ocA', 'In ' + a.name + ', the opportunity cost of 1 unit of ' + X + ' (in ' + Y + ')', ocA, [
        { value: calc('opportunityCost', a.hy, a.hx), why: 'That is the output-data rule used on input data. With hours per unit, the hours spent on one ' + X + ' (' + a.hx + ') could make ' + a.hx + ' ÷ ' + a.hy + ' units of ' + Y + '.' }
      ], { hint: 'Input data: this good\'s hours ÷ the other good\'s hours', practice: '3.A' }),
      num('ocB', 'In ' + b.name + ', the opportunity cost of 1 unit of ' + X + ' (in ' + Y + ')', ocB, [
        { value: calc('opportunityCost', b.hy, b.hx), why: 'Upside down. With hours per unit, one ' + X + ' costs ' + b.hx + ' ÷ ' + b.hy + ' units of ' + Y + '.' }
      ], { practice: '3.A' }),
      choice('ca', 'Which country has the comparative advantage in ' + X + '?', [ca.name, other.name, 'Whichever country needs fewer hours to make ' + X], [
        'Right: ' + ca.name + ' gives up less ' + Y + ' for each ' + X + ' (' + n(Math.min(ocA, ocB)) + ' against ' + n(Math.max(ocA, ocB)) + ').',
        other.name + ' gives up more ' + Y + ' (' + n(Math.max(ocA, ocB)) + ') for each unit of ' + X + '.',
        'Fewer hours is absolute advantage. Comparative advantage compares opportunity costs: hours for ' + X + ' ÷ hours for ' + Y + '.'
      ], { practice: '2.B', level: 'analyze' })
    ];
    return { type: 'input', fig: { html: fig }, values: { a: a, b: b, ocA: ocA, ocB: ocB, ca: ca.name, goods: goods }, text: '<p>The table shows how many hours of labor ' + a.name + ' and ' + b.name + ' need to make one unit of each good (input data).</p>', steps: steps,
      solution: [
        'Input data: an hour spent on one good is an hour not spent on the other. In ' + a.name + ', one ' + X + ' takes ' + a.hx + ' h, enough for ' + a.hx + ' ÷ ' + a.hy + ' = <b>' + n(ocA) + ' ' + Y + '</b>.',
        'In ' + b.name + ': ' + b.hx + ' ÷ ' + b.hy + ' = <b>' + n(ocB) + ' ' + Y + '</b>.',
        '<b>' + ca.name + '</b> has the lower opportunity cost of ' + X + ': the comparative advantage. (With output data the ratio is the other way: ' + Y + ' made ÷ ' + X + ' made.)'
      ] };
  }

  function genTerms(r){
    var c = countries(r), X = c.goods[0].toLowerCase(), Y = c.goods[1].toLowerCase();
    var ocA = calc('opportunityCost', c.A.y, c.A.x), ocB = calc('opportunityCost', c.B.y, c.B.x);
    var lo = Math.min(ocA, ocB), hi = Math.max(ocA, ocB), xer = ocA < ocB ? c.A : c.B, yer = xer === c.A ? c.B : c.A;
    var mid = calc('div', calc('add', lo, hi), 2), good = M.round(mid, 2);
    if(!(good > lo && good < hi)) good = mid;
    var below = M.round(calc('mul', lo, 0.5), 2), above = M.round(calc('mul', hi, 1.5), 2);
    var t = function(v){ return '1 ' + X.replace(/s$/, '') + ' for ' + n(v) + ' ' + Y; };
    var steps = [
      choice('exp', 'Which country should export ' + X + '?', [xer.name, yer.name], [
        'Right: ' + xer.name + ' makes ' + X + ' at the lower opportunity cost (' + n(lo) + ' ' + Y + ' per unit, against ' + n(hi) + ').',
        yer.name + ' gives up more ' + Y + ' for each unit of ' + X + ' (' + n(hi) + '), so it should export ' + Y + ' instead.'
      ], { practice: '2.B' }),
      choice('tot', 'Which terms of trade make both countries better off?', [t(good), t(below), t(above), t(lo)], [
        'Right: ' + n(good) + ' is between the two opportunity costs, ' + n(lo) + ' and ' + n(hi) + '. ' + xer.name + ' gets more ' + Y + ' than it could make itself, and ' + yer.name + ' pays less ' + Y + ' than making ' + X + ' would cost it.',
        'Below ' + n(lo) + ', ' + xer.name + ' would get fewer ' + Y + ' than it gives up making ' + X + ': it loses. Terms must lie between the two opportunity costs.',
        'Above ' + n(hi) + ', ' + yer.name + ' would pay more ' + Y + ' than it would give up making ' + X + ' itself: it loses.',
        'At exactly ' + n(lo) + ', ' + xer.name + ' gains nothing: it gets the same as it could make itself. Both gain only strictly between ' + n(lo) + ' and ' + n(hi) + '.'
      ], { practice: '1.D', level: 'analyze' })
    ];
    return { type: 'terms', fig: { html: outTable(c), plot: outPlot(c) }, values: { c: c, lo: lo, hi: hi, good: good, below: below, above: above, xer: xer.name }, text: '<p>' + c.A.name + ' and ' + c.B.name + ' can make ' + X + ' or ' + Y + '. The table shows the most each could make of one good with all its resources.</p>', steps: steps,
      solution: [
        'Opportunity cost of 1 ' + X.replace(/s$/, '') + ': ' + c.A.name + ' ' + c.A.y + ' ÷ ' + c.A.x + ' = ' + n(ocA) + ' ' + Y + '; ' + c.B.name + ' ' + c.B.y + ' ÷ ' + c.B.x + ' = ' + n(ocB) + ' ' + Y + '.',
        '<b>' + xer.name + '</b> exports ' + X + ' (lower cost); ' + yer.name + ' exports ' + Y + '.',
        'Both gain when the price of 1 ' + X.replace(/s$/, '') + ' is <b>between ' + n(lo) + ' and ' + n(hi) + ' ' + Y + '</b>, such as ' + n(good) + '.'
      ] };
  }

  var GEN = { 'ppc-point': genPoint, 'ppc-oc': genOc, output: genOutput, input: genInput, terms: genTerms };
  function generate(r, ctx, type){
    var list = (ctx && ctx.types) || TYPES;
    var ty = type && list.indexOf(type) > -1 ? type : r.pick(list);
    var p = GEN[ty](r);
    p.ctx = ctx ? ctx.id : ty;
    p.topic = ctx ? ctx.topic : 'comparative-advantage';
    p.title = TITLE[ty];
    return p;
  }

  root.ApMacroMath.register('ppcTrade', { TYPES: TYPES, TITLE: TITLE, R0: R0, n: n, ppcSpec: ppcSpec, ppcAt: ppcAt, marginal: marginal, PPC_EVENTS: PPC_EVENTS,
    SCENARIOS: SCENARIOS, trade: trade, REGION: REGION, MOVE: MOVE, generate: generate });
})(typeof window !== 'undefined' ? window : globalThis);
