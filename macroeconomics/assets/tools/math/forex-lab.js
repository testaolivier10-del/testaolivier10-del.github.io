/* Foreign exchange lab model: ApMacroMath.forexLab (docs/apmacro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/apmacro-briefs/t4.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmacro-tool-checks/forex-lab.mjs) and the
   test (scripts/test/apmacro-tool-forex-lab.test.mjs) run exactly this code.

   The market for currency X (ApMacroGraph kind "forex", names { currency: X,
   other: Y}): the vertical axis is the price of X in Ys per X (authoring guide,
   "the foreign exchange axis ratio"). H is X's home economy, F is Y's.
     demand for Xs  = F's residents buying H's goods, services and assets
     supply of Xs   = H's residents buying F's goods, services and assets
   The mirror market for Y moves the other curve the same way (more demand for
   Xs is more supply of Ys), so X appreciates exactly when Y depreciates.

     CUR, PAIRS                the currencies and the pairs drills use
     SHOCKS                    { id, set, curve, dir, group, label, text(H,F,X,Y), because, link }
     mirror(curve)             D <-> S
     value(curve, dir)         +1 X appreciates, -1 depreciates
     rate(base, y)             the price of X shown at height y (display only)
     generate(r, ctx, type)    a drill problem; types axis, shift, nx, flows
   A graph step is ApMacroTools.drill's "graph" kind ({ kind: 'graph', spec, explain }). */
(function(root){
  'use strict';
  var M = root.ApMacroMath;
  if(!M) return;
  function C(){ return root.ApMacroCalc; }

  var CUR = {
    dollar: { place: 'the United States', people: 'Americans', adj: 'American', bank: 'the Federal Reserve' },
    euro: { place: 'the euro area', people: 'Europeans', adj: 'European', bank: 'the European Central Bank' },
    peso: { place: 'Mexico', people: 'Mexicans', adj: 'Mexican', bank: 'the Bank of Mexico' },
    pound: { place: 'the United Kingdom', people: 'British households', adj: 'British', bank: 'the Bank of England' },
    rupee: { place: 'India', people: 'Indians', adj: 'Indian', bank: 'the Reserve Bank of India' }
  };
  // [currency X, other Y, prices of X in Ys per X near today's (illustrative), item prices in Xs]
  var PAIRS = [
    ['euro', 'dollar', [1, 1.1, 1.2, 1.25], [20, 40, 50, 100]],
    ['dollar', 'euro', [0.8, 0.9, 0.95, 1], [20, 50, 100, 200]],
    ['peso', 'dollar', [0.04, 0.05, 0.0625], [200, 400, 1000]],
    ['dollar', 'peso', [16, 18, 20, 25], [10, 20, 50]],
    ['pound', 'euro', [1.1, 1.15, 1.2, 1.25], [20, 40, 100]],
    ['euro', 'pound', [0.8, 0.85, 0.9], [20, 40, 100]],
    ['rupee', 'dollar', [0.0115, 0.012, 0.0125], [800, 2000, 4000]],
    ['dollar', 'pound', [0.75, 0.8, 0.85], [20, 50, 100]]
  ];
  /* The drills' currencies (graded content uses invented countries and
     currencies, docs/apmacro-authoring-guide.md "Invented countries"): the
     same pairs and price ranges as the real ones above, which only the
     Explore view uses, labeled illustrative. */
  var DRILL_CUR = {
    kor: { place: 'Korvania', people: 'Korvanians', adj: 'Korvanian', bank: 'the Bank of Korvania' },
    sel: { place: 'Seluna', people: 'Selunans', adj: 'Selunan', bank: 'the Bank of Seluna' },
    varo: { place: 'Vashtia', people: 'Vashtians', adj: 'Vashtian', bank: 'the Bank of Vashtia' },
    ruv: { place: 'Ruvelle', people: 'Ruvellans', adj: 'Ruvellan', bank: 'the Bank of Ruvelle' },
    nim: { place: 'Nimbria', people: 'Nimbrians', adj: 'Nimbrian', bank: 'the Bank of Nimbria' }
  };
  var DRILL_PAIRS = [
    ['sel', 'kor', [1, 1.1, 1.2, 1.25], [20, 40, 50, 100]],
    ['kor', 'sel', [0.8, 0.9, 0.95, 1], [20, 50, 100, 200]],
    ['varo', 'kor', [0.04, 0.05, 0.0625], [200, 400, 1000]],
    ['kor', 'varo', [16, 18, 20, 25], [10, 20, 50]],
    ['ruv', 'sel', [1.1, 1.15, 1.2, 1.25], [20, 40, 100]],
    ['sel', 'ruv', [0.8, 0.85, 0.9], [20, 40, 100]],
    ['nim', 'kor', [0.0115, 0.012, 0.0125], [800, 2000, 4000]],
    ['kor', 'ruv', [0.75, 0.8, 0.85], [20, 50, 100]]
  ];
  function pairOf(X, Y){ for(var i = 0; i < PAIRS.length; i++) if(PAIRS[i][0] === X && PAIRS[i][1] === Y) return PAIRS[i]; return null; }
  function poss(place){ return place + (/s$/.test(place) ? '\u2019' : '\u2019s'); }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function pl(w){ return /s$/.test(w) ? w : w + 's'; }

  /* ------------------------------------------------------------ shocks */
  // In the market for X. set: 'goods' (tastes, incomes, price levels) or
  // 'policy' (interest rates and policy). `t(H, F, X, Y)` writes the scenario;
  // `l` the link in the chain.
  var SHOCKS = [
    { id: 'tastes-f', set: 'goods', curve: 'D', dir: 1, group: 'Tastes', label: 'Foreign tastes shift toward its goods',
      t: function(H, F){ return F.people + ' develop a taste for ' + H.adj + ' goods and buy more of them.'; }, because: 'more foreign buying of its goods',
      l: function(H, F, X){ return F.people + ' need more ' + pl(X) + ' to pay for ' + H.adj + ' goods, so the demand for ' + pl(X) + ' shifts right.'; } },
    { id: 'tastes-f-down', set: 'goods', curve: 'D', dir: -1, group: 'Tastes', label: 'Its goods go out of fashion abroad',
      t: function(H, F){ return H.adj + ' goods go out of fashion with ' + F.people + ', who buy fewer of them.'; }, because: 'less foreign buying of its goods',
      l: function(H, F, X){ return F.people + ' need fewer ' + pl(X) + ', so the demand for ' + pl(X) + ' shifts left.'; } },
    { id: 'tastes-h', set: 'goods', curve: 'S', dir: 1, group: 'Tastes', label: 'Its residents want more foreign goods',
      t: function(H, F){ return H.people + ' want more ' + F.adj + ' goods and buy more of them.'; }, because: 'more buying of foreign goods by its residents',
      l: function(H, F, X, Y){ return 'To pay, ' + H.people + ' sell ' + pl(X) + ' for ' + pl(Y) + ', so the supply of ' + pl(X) + ' shifts right.'; } },
    { id: 'income-f', set: 'goods', curve: 'D', dir: 1, group: 'Incomes', label: 'Incomes rise abroad',
      t: function(H, F){ return 'Real incomes rise in ' + F.place + ', so ' + F.people + ' buy more imports, ' + H.adj + ' goods among them.'; }, because: 'rising incomes abroad',
      l: function(H, F, X){ return 'More ' + H.adj + ' exports means more demand for ' + pl(X) + ': the demand curve shifts right.'; } },
    { id: 'income-f-down', set: 'goods', curve: 'D', dir: -1, group: 'Incomes', label: 'A recession abroad',
      t: function(H, F){ return 'A recession cuts real incomes in ' + F.place + ', so ' + F.people + ' buy fewer imports, ' + H.adj + ' goods among them.'; }, because: 'falling incomes abroad',
      l: function(H, F, X){ return 'Fewer ' + H.adj + ' exports means less demand for ' + pl(X) + ': the demand curve shifts left.'; } },
    { id: 'income-h', set: 'goods', curve: 'S', dir: 1, group: 'Incomes', label: 'Incomes rise at home',
      t: function(H, F){ return 'Real incomes rise in ' + H.place + ', so ' + H.people + ' buy more imports from ' + F.place + '.'; }, because: 'rising incomes at home',
      l: function(H, F, X, Y){ return H.people + ' sell ' + pl(X) + ' to buy the ' + pl(Y) + ' they pay with, so the supply of ' + pl(X) + ' shifts right.'; } },
    { id: 'prices-h', set: 'goods', curve: 'D', dir: -1, group: 'Price levels', label: 'Its price level rises faster',
      t: function(H, F){ return 'The price level in ' + H.place + ' rises faster than in ' + F.place + ', so ' + F.people + ' buy fewer of the now pricier ' + H.adj + ' goods.'; }, because: 'relatively higher prices at home',
      l: function(H, F, X){ return F.people + ' need fewer ' + pl(X) + ', so the demand for ' + pl(X) + ' shifts left.'; } },
    { id: 'prices-f', set: 'goods', curve: 'S', dir: -1, group: 'Price levels', label: 'Prices rise faster abroad',
      t: function(H, F){ return 'The price level in ' + F.place + ' rises faster than in ' + H.place + ', so ' + H.people + ' buy fewer of the now pricier ' + F.adj + ' goods.'; }, because: 'relatively higher prices abroad',
      l: function(H, F, X){ return H.people + ' sell fewer ' + pl(X) + ', so the supply of ' + pl(X) + ' shifts left.'; } },
    { id: 'tourism', set: 'goods', curve: 'D', dir: 1, group: 'Tastes', label: 'More foreign tourists visit',
      t: function(H, F){ return 'More tourists from ' + F.place + ' spend their holidays in ' + H.place + '.'; }, because: 'more foreign tourists',
      l: function(H, F, X){ return 'Tourists pay in ' + pl(X) + ', so the demand for ' + pl(X) + ' shifts right.'; } },
    { id: 'rate-h', set: 'policy', curve: 'D', dir: 1, group: 'Real interest rates', label: 'Its real interest rate rises',
      t: function(H, F){ return 'The real interest rate in ' + H.place + ' rises relative to ' + F.place + ', so ' + F.adj + ' investors buy more ' + H.adj + ' bonds.'; }, because: 'a higher real interest rate at home',
      l: function(H, F, X){ return 'Financial capital flows into ' + H.place + ': investors need ' + pl(X) + ' to buy its bonds, so the demand for ' + pl(X) + ' shifts right.'; } },
    { id: 'rate-h-down', set: 'policy', curve: 'D', dir: -1, group: 'Real interest rates', label: 'Its real interest rate falls',
      t: function(H, F){ return 'The real interest rate in ' + H.place + ' falls relative to ' + F.place + ', so ' + F.adj + ' investors buy fewer ' + H.adj + ' bonds.'; }, because: 'a lower real interest rate at home',
      l: function(H, F, X){ return 'Less financial capital flows into ' + H.place + ', so the demand for ' + pl(X) + ' shifts left.'; } },
    { id: 'rate-f', set: 'policy', curve: 'S', dir: 1, group: 'Real interest rates', label: 'Real interest rates rise abroad',
      t: function(H, F){ return 'The real interest rate in ' + F.place + ' rises relative to ' + H.place + ', so ' + H.adj + ' investors buy more ' + F.adj + ' bonds.'; }, because: 'a higher real interest rate abroad',
      l: function(H, F, X, Y){ return 'Financial capital flows out of ' + H.place + ': investors sell ' + pl(X) + ' for ' + pl(Y) + ', so the supply of ' + pl(X) + ' shifts right.'; } },
    { id: 'mp-h-tight', set: 'policy', curve: 'D', dir: 1, group: 'Policy', label: 'Its central bank raises rates',
      t: function(H, F){ return cap(H.bank) + ' raises its policy rate (contractionary monetary policy), so real interest rates in ' + H.place + ' rise and ' + F.adj + ' investors buy more ' + H.adj + ' bonds.'; }, because: 'contractionary monetary policy at home',
      l: function(H, F, X){ return 'Higher real interest rates draw financial capital into ' + H.place + ', so the demand for ' + pl(X) + ' shifts right.'; } },
    { id: 'mp-h-easy', set: 'policy', curve: 'D', dir: -1, group: 'Policy', label: 'Its central bank cuts rates',
      t: function(H, F){ return cap(H.bank) + ' cuts its policy rate (expansionary monetary policy), so real interest rates in ' + H.place + ' fall and ' + F.adj + ' investors buy fewer ' + H.adj + ' bonds.'; }, because: 'expansionary monetary policy at home',
      l: function(H, F, X){ return 'Lower real interest rates draw less financial capital into ' + H.place + ', so the demand for ' + pl(X) + ' shifts left.'; } },
    { id: 'deficit-h', set: 'policy', curve: 'D', dir: 1, group: 'Policy', label: 'Its government borrows more',
      t: function(H, F){ return 'The government of ' + H.place + ' runs a larger budget deficit; its borrowing raises the real interest rate there, so ' + F.adj + ' investors buy more ' + H.adj + ' bonds.'; }, because: 'a higher real interest rate from government borrowing',
      l: function(H, F, X){ return 'Higher real interest rates draw financial capital into ' + H.place + ', so the demand for ' + pl(X) + ' shifts right.'; } },
    { id: 'mp-f-tight', set: 'policy', curve: 'S', dir: 1, group: 'Policy', label: 'The other central bank raises rates',
      t: function(H, F){ return cap(F.bank) + ' raises its policy rate, so real interest rates in ' + F.place + ' rise and ' + H.adj + ' investors buy more ' + F.adj + ' bonds.'; }, because: 'higher real interest rates abroad',
      l: function(H, F, X, Y){ return H.adj + ' investors sell ' + pl(X) + ' for ' + pl(Y) + ', so the supply of ' + pl(X) + ' shifts right.'; } }
  ];
  function shock(id){ for(var i = 0; i < SHOCKS.length; i++) if(SHOCKS[i].id === id) return SHOCKS[i]; return null; }
  function mirror(curve){ return curve === 'D' ? 'S' : 'D'; }
  function value(curve, dir){ return curve === 'D' ? dir : -dir; }
  /* The price of X drawn at height y (5 is the starting rate). The mirror market
     sits at 10 - y, so its price is exactly 1 / this one. Display only. */
  var K = 0.1;
  function rate(base, y){ return base * Math.exp(K * (y - 5)); }

  /* ------------------------------------------------------------ steps */
  function choice(key, label, options, correct, why, practice, extra){
    var s = { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: practice, level: 'apply' };
    for(var k in (extra || {})) s[k] = extra[k];
    return s;
  }
  /* A graph step: ApMacroTools.drill's "graph" kind (drawn with
     ApMacroGraph, graded by ApMacroGrade.graph); explain is shown when right. */
  function graphStep(key, label, spec, practice, okWhy){
    return { key: key, kind: 'graph', spec: spec, label: label, explain: okWhy, practice: practice, level: 'apply' };
  }
  function setup(r){
    var p = r.pick(DRILL_PAIRS);
    return { X: p[0], Y: p[1], H: DRILL_CUR[p[0]], F: DRILL_CUR[p[1]], rates: p[2], amounts: p[3] };
  }
  function curveText(c, d, X){ return (c === 'D' ? 'Demand for ' : 'Supply of ') + pl(X) + ' shifts ' + (d > 0 ? 'right' : 'left'); }
  function valueChoice(z, v){
    var X = z.X, Y = z.Y;
    var opts = ['The ' + X + ' appreciates against the ' + Y, 'The ' + X + ' depreciates against the ' + Y, 'The value of the ' + X + ' does not change'];
    var why = [
      v > 0 ? 'Right: the price of the ' + X + ' (' + pl(Y) + ' per ' + X + ') rises, so one ' + X + ' buys more ' + pl(Y) + '.' : 'The price of the ' + X + ' falls here: one ' + X + ' buys fewer ' + pl(Y) + '. That is a depreciation.',
      v < 0 ? 'Right: the price of the ' + X + ' (' + pl(Y) + ' per ' + X + ') falls, so one ' + X + ' buys fewer ' + pl(Y) + '.' : 'The price of the ' + X + ' rises here: one ' + X + ' buys more ' + pl(Y) + '. That is an appreciation.',
      'The shift moves the equilibrium price of the ' + X + ', and a currency’s price is its value.'
    ];
    return { opts: opts, why: why, correct: v > 0 ? 0 : 1 };
  }
  function shiftSpec(z, sh){
    var spec = { kind: 'forex', names: { currency: z.X, other: z.Y }, do: ['shift', 'equilibrium'], movable: ['D', 'S'],
      key: { shifts: [{ curve: sh.curve, dir: sh.dir > 0 ? 'right' : 'left' }], because: sh.because }, slips: {} };
    spec.slips[mirror(sh.curve)] = sh.curve === 'D'
      ? 'Here the change is in what ' + z.F.people + ' buy from ' + z.H.place + ': they pay with ' + pl(z.X) + ', so it is the demand for ' + pl(z.X) + '.'
      : 'Here the change is in what ' + z.H.people + ' buy from ' + z.F.place + ': they sell ' + pl(z.X) + ' to pay, so it is the supply of ' + pl(z.X) + '.';
    return spec;
  }

  /* --------------------------------------------------- type: shift */
  function genShift(r, ctx){
    var z = setup(r), set = ctx.set || 'goods';
    var list = SHOCKS.filter(function(s){ return s.set === set; }), sh = r.pick(list);
    var X = z.X, Y = z.Y, v = value(sh.curve, sh.dir), spec = shiftSpec(z, sh), vc = valueChoice(z, v);
    var mc = mirror(sh.curve), mo = [['D', 1], ['D', -1], ['S', 1], ['S', -1]], mC = -1;
    mo.forEach(function(o, i){ if(o[0] === mc && o[1] === sh.dir) mC = i; });
    var mWhy = mo.map(function(o, i){
      if(i === mC) return sh.curve === 'D'
        ? 'Right: to get ' + pl(X) + ', ' + z.F.people + ' pay with ' + pl(Y) + ', so ' + (sh.dir > 0 ? 'more' : 'less') + ' demand for ' + pl(X) + ' is ' + (sh.dir > 0 ? 'more' : 'less') + ' supply of ' + pl(Y) + '. The ' + Y + ' ' + (v > 0 ? 'depreciates' : 'appreciates') + '.'
        : 'Right: ' + z.H.people + ' sell ' + pl(X) + ' to buy ' + pl(Y) + ', so ' + (sh.dir > 0 ? 'more' : 'less') + ' supply of ' + pl(X) + ' is ' + (sh.dir > 0 ? 'more' : 'less') + ' demand for ' + pl(Y) + '. The ' + Y + ' ' + (v > 0 ? 'depreciates' : 'appreciates') + '.';
      if(o[0] === sh.curve) return 'The mirror market shows the other curve: ' + (sh.curve === 'D' ? 'demand for ' + pl(X) + ' is supply of ' + pl(Y) : 'supply of ' + pl(X) + ' is demand for ' + pl(Y)) + '.';
      return 'Right curve, wrong direction: the ' + Y + ' must move opposite to the ' + X + '; if one appreciates, the other depreciates.';
    });
    return {
      type: 'shift', ctx: ctx.id, topic: ctx.topic,
      text: '<p>The graph is the market for ' + pl(X) + ' (priced in ' + pl(Y) + ' per ' + X + '). <b>' + sh.t(z.H, z.F, X, Y) + '</b></p>',
      figure: { spec: spec },
      steps: [
        graphStep('graph', 'Shift the curve this change moves in the market for ' + pl(X) + ', then put E2 where the curves cross now.', spec, '4.C', sh.l(z.H, z.F, X, Y)),
        choice('value', 'What happens to the value of the ' + X + '?', vc.opts, vc.correct, vc.why, '3.A'),
        choice('mirror', 'In the market for ' + pl(Y) + ', which curve shifts?', mo.map(function(o){ return curveText(o[0], o[1], Y); }), mC, mWhy, '3.B')
      ],
      solution: [
        sh.l(z.H, z.F, X, Y),
        'The price of the ' + X + ' ' + (v > 0 ? 'rises: the ' + X + ' appreciates.' : 'falls: the ' + X + ' depreciates.'),
        'In the mirror market ' + curveText(mc, sh.dir, Y).toLowerCase() + ', so the ' + Y + ' ' + (v > 0 ? 'depreciates' : 'appreciates') + '.'
      ],
      answer: { curve: sh.curve, dir: sh.dir, value: v, mirror: mc, X: X, Y: Y }, shock: sh.id
    };
  }

  /* ---------------------------------------------------- type: axis */
  function genAxis(r, ctx){
    var z = setup(r), X = z.X, Y = z.Y, RATES = z.rates;
    var i1 = r.int(0, RATES.length - 1), i2 = i1; while(i2 === i1) i2 = r.int(0, RATES.length - 1);
    var p1 = RATES[i1], p2 = RATES[i2], up = p2 > p1, A = r.pick(z.amounts);
    var inv = C().evaluate({ fn: 'inverseRate', args: [p2] }), inv1 = C().evaluate({ fn: 'inverseRate', args: [p1] });
    var cost = C().evaluate({ fn: 'convert', args: [A, p2] });
    var spec = { kind: 'forex', names: { currency: X, other: Y }, do: ['label'] };
    var dirs = ['The ' + X + ' appreciated and the ' + Y + ' depreciated', 'The ' + X + ' depreciated and the ' + Y + ' appreciated', 'Both currencies appreciated', 'Neither changed in value: only the quantity changed'];
    var dWhy = [
      up ? 'Right: one ' + X + ' now buys more ' + pl(Y) + ' (' + p2 + ' instead of ' + p1 + '), and so one ' + Y + ' buys fewer ' + pl(X) + '.' : 'The price of the ' + X + ' fell from ' + p1 + ' to ' + p2 + ' ' + pl(Y) + ': one ' + X + ' buys fewer ' + pl(Y) + ', a depreciation.',
      !up ? 'Right: one ' + X + ' now buys fewer ' + pl(Y) + ' (' + p2 + ' instead of ' + p1 + '), and so one ' + Y + ' buys more ' + pl(X) + '.' : 'The price of the ' + X + ' rose from ' + p1 + ' to ' + p2 + ' ' + pl(Y) + ': one ' + X + ' buys more ' + pl(Y) + ', an appreciation.',
      'Two currencies cannot both gain against each other: the price of one is the inverse of the price of the other.',
      'The price on the axis changed, and a currency’s price is its value.'
    ];
    var fx = function(x){ return M.fmt(x, 4); };
    return {
      type: 'axis', ctx: ctx.id, topic: ctx.topic,
      text: '<p>In the market for ' + pl(X) + ', the price of the ' + X + ' moves from <b>' + p1 + '</b> to <b>' + p2 + ' ' + pl(Y) + ' per ' + X + '</b>.</p>',
      figure: { spec: spec },
      steps: [
        graphStep('graph', 'Label the market for ' + pl(X) + ': both axes and both curves (the menus under the graph).', spec, '4.A', 'The price of the ' + X + ' is in ' + pl(Y) + ' per ' + X + ', and the quantity is ' + pl(X) + ': this is the market for ' + pl(X) + '.'),
        choice('dir', 'What happened to the two currencies?', dirs, up ? 0 : 1, dWhy, '1.A'),
        { key: 'inverse', kind: 'num', label: 'What is the new price of the ' + Y + ', in ' + pl(X) + ' per ' + Y + '?', cell: M.cell(inv, 0.005, [{ value: p2, why: 'That is the price of the ' + X + '. The price of the ' + Y + ' is its inverse: 1 ÷ ' + p2 + '.' }, { value: inv1, why: 'That is the inverse of the old rate. Use the new price, ' + p2 + '.' }]), unit: pl(X) + ' per ' + Y, practice: '2.B', level: 'apply' },
        { key: 'convert', kind: 'num', label: 'At the new rate, how many ' + pl(Y) + ' does a buyer in ' + z.F.place + ' pay for a ' + A + '-' + X + ' ' + z.H.adj + ' good?', cell: M.cell(cost, 0.005, [{ value: A / p2, why: 'Dividing flips the ratio. The rate is ' + pl(Y) + ' per ' + X + ', so multiply ' + pl(X) + ' by it: ' + A + ' × ' + p2 + '.' }, { value: A * p1, why: 'That uses the old rate. Use the new price of the ' + X + ', ' + p2 + '.' }]), unit: pl(Y), practice: '2.B', level: 'apply' }
      ],
      solution: [
        'Vertical axis: price of the ' + X + ' (' + pl(Y) + ' per ' + X + '); horizontal axis: quantity of ' + pl(X) + '; demand slopes down, supply up.',
        'The price of the ' + X + ' ' + (up ? 'rose' : 'fell') + ', so the ' + X + (up ? ' appreciated' : ' depreciated') + ' and the ' + Y + (up ? ' depreciated' : ' appreciated') + '.',
        'Price of the ' + Y + ' = 1 ÷ ' + p2 + ' = ' + fx(inv) + ' ' + pl(X) + ' per ' + Y + '.',
        'Cost = ' + A + ' ' + pl(X) + ' × ' + p2 + ' ' + pl(Y) + ' per ' + X + ' = ' + fx(cost) + ' ' + pl(Y) + '.'
      ],
      answer: { p1: p1, p2: p2, inverse: inv, cost: cost, A: A, X: X, Y: Y }
    };
  }

  /* ------------------------------------------------------ type: nx */
  function genNx(r, ctx){
    var z = setup(r), X = z.X, Y = z.Y, v = r() < 0.5 ? 1 : -1, H = z.H, F = z.F;
    var ex = ['They cost more, so its exports fall', 'They cost less, so its exports rise', 'Nothing changes: their prices in ' + pl(X) + ' did not move'];
    var exWhy = [
      v > 0 ? 'Right: each ' + X + ' now costs buyers more ' + pl(Y) + ', so ' + H.adj + ' goods are pricier abroad and exports fall.' : 'With a weaker ' + X + ', buyers abroad need fewer ' + pl(Y) + ' per ' + X + ': ' + H.adj + ' goods get cheaper for them.',
      v < 0 ? 'Right: each ' + X + ' now costs buyers fewer ' + pl(Y) + ', so ' + H.adj + ' goods are cheaper abroad and exports rise.' : 'With a stronger ' + X + ', buyers abroad need more ' + pl(Y) + ' per ' + X + ': ' + H.adj + ' goods get pricier for them.',
      'Buyers abroad pay in their own currency: the price in ' + pl(Y) + ' changes with the exchange rate even when the price in ' + pl(X) + ' does not.'
    ];
    var im = ['Imports rise', 'Imports fall', 'Imports do not change'];
    var imWhy = [
      v > 0 ? 'Right: a stronger ' + X + ' buys more ' + pl(Y) + ', so ' + F.adj + ' goods are cheaper for ' + H.people + '.' : 'A weaker ' + X + ' buys fewer ' + pl(Y) + ': imports from ' + F.place + ' get pricier, so they fall.',
      v < 0 ? 'Right: a weaker ' + X + ' buys fewer ' + pl(Y) + ', so ' + F.adj + ' goods are pricier for ' + H.people + '.' : 'A stronger ' + X + ' buys more ' + pl(Y) + ': imports from ' + F.place + ' get cheaper, so they rise.',
      'The exchange rate changes what imports cost in ' + pl(X) + ', so the amount bought changes.'
    ];
    var nx = ['Net exports fall, so AD shifts left', 'Net exports rise, so AD shifts right', 'Net exports fall, but AD does not change', 'Net exports rise, so SRAS shifts right'];
    var nxC = v > 0 ? 0 : 1;
    var nxWhy = [
      v > 0 ? 'Right: fewer exports and more imports cut net exports (X − M), a part of AD, so AD shifts left.' : 'A weaker currency makes exports cheaper and imports pricier: net exports rise.',
      v < 0 ? 'Right: more exports and fewer imports raise net exports (X − M), a part of AD, so AD shifts right.' : 'A stronger currency makes exports pricier and imports cheaper: net exports fall.',
      'Net exports are a part of AD (C + I + G + X − M), so a change in them shifts AD.',
      'Net exports are spending, so they move AD, not SRAS.'
    ];
    return {
      type: 'nx', ctx: ctx.id, topic: ctx.topic,
      text: '<p>The ' + X + ' <b>' + (v > 0 ? 'appreciates' : 'depreciates') + '</b> against the ' + Y + '. Think about trade between ' + H.place + ' and ' + F.place + ', other things equal.</p>',
      figure: null,
      steps: [
        choice('exports', 'What happens to the price of ' + H.adj + ' goods for buyers in ' + F.place + ', and so to exports?', ex, v > 0 ? 0 : 1, exWhy, '3.A'),
        choice('imports', 'What happens to imports into ' + H.place + ' from ' + F.place + '?', im, v > 0 ? 0 : 1, imWhy, '3.A', { fixed: true }),
        choice('nxad', 'So what happens to ' + poss(H.place) + ' net exports and aggregate demand?', nx, nxC, nxWhy, '3.B')
      ],
      solution: [
        'A ' + (v > 0 ? 'stronger' : 'weaker') + ' ' + X + ' makes ' + H.adj + ' goods ' + (v > 0 ? 'pricier' : 'cheaper') + ' abroad: exports ' + (v > 0 ? 'fall' : 'rise') + '.',
        'It makes ' + F.adj + ' goods ' + (v > 0 ? 'cheaper' : 'pricier') + ' for ' + H.people + ': imports ' + (v > 0 ? 'rise' : 'fall') + '.',
        'Net exports ' + (v > 0 ? 'fall, so AD shifts left' : 'rise, so AD shifts right') + '.'
      ],
      answer: { value: v, X: X, Y: Y }
    };
  }

  /* --------------------------------------------------- type: flows */
  /* A real interest rate change moves both sides of the market: foreign
     investors buy more (or fewer) of its bonds, which is demand for X, and
     its own investors buy fewer (or more) foreign bonds, which is supply of
     X. The exam accepts either, so this kind says only that the rate
     changed and keys both (key.alt): the value, flow and net export steps
     are the same either way. */
  function genFlows(r, ctx){
    var z = setup(r), X = z.X, Y = z.Y, H = z.H, F = z.F, d = r() < 0.5 ? 1 : -1;
    var sh = shock(d > 0 ? 'rate-h' : 'rate-h-down'), spec = shiftSpec(z, sh), v = value('D', d), vc = valueChoice(z, v);
    spec.key.alt = [[{ curve: 'S', dir: d > 0 ? 'left' : 'right' }]];
    spec.slips = { S: 'Both curves can show it: ' + F.adj + ' investors buying ' + (d > 0 ? 'more' : 'fewer') + ' ' + H.adj + ' bonds shift the demand for ' + pl(X) + ' ' + (d > 0 ? 'right' : 'left') + ', and ' + H.adj + ' investors buying ' + (d > 0 ? 'fewer' : 'more') + ' foreign bonds shift the supply of ' + pl(X) + ' ' + (d > 0 ? 'left' : 'right') + '. Shifting supply ' + (d > 0 ? 'right' : 'left') + ' would move the price the wrong way.' };
    var either = sh.l(H, F, X, Y) + ' (Or: ' + H.adj + ' investors buy ' + (d > 0 ? 'fewer' : 'more') + ' foreign bonds, so the supply of ' + pl(X) + ' shifts ' + (d > 0 ? 'left' : 'right') + '; either way the ' + X + ' ' + (v > 0 ? 'appreciates' : 'depreciates') + '.)';
    var fl = ['More flows into ' + H.place + ': ' + F.adj + ' investors buy more ' + H.adj + ' assets', 'Less flows into ' + H.place + ' (a net outflow): ' + F.adj + ' investors buy fewer ' + H.adj + ' assets', 'No change: interest rates affect only trade in goods'];
    var flWhy = [
      d > 0 ? 'Right: a higher real return draws foreign saving, so financial capital flows into ' + H.place + ' (a financial account inflow).' : 'A lower real return makes ' + H.adj + ' assets less attractive: less capital flows in, not more.',
      d < 0 ? 'Right: a lower real return makes ' + H.adj + ' assets less attractive, so less financial capital flows into ' + H.place + '.' : 'A higher real return makes ' + H.adj + ' assets more attractive: capital flows in, not out.',
      'Investors move financial capital toward higher real interest rates; buying foreign assets needs foreign currency.'
    ];
    var nx = ['Net exports fall', 'Net exports rise', 'Net exports do not change'];
    var nxWhy = [
      v > 0 ? 'Right: the ' + X + ' appreciated, so ' + H.adj + ' exports cost more abroad and imports cost less: net exports fall.' : 'A weaker ' + X + ' makes exports cheaper abroad: net exports rise.',
      v < 0 ? 'Right: the ' + X + ' depreciated, so ' + H.adj + ' exports cost less abroad and imports cost more: net exports rise.' : 'A stronger ' + X + ' makes exports pricier abroad: net exports fall.',
      'The exchange rate changed, and with it the prices of exports and imports.'
    ];
    return {
      type: 'flows', ctx: ctx.id, topic: ctx.topic,
      text: '<p><b>The real interest rate in ' + H.place + ' ' + (d > 0 ? 'rises' : 'falls') + ' relative to ' + F.place + '.</b> The graph is the market for ' + pl(X) + '.</p>',
      figure: { spec: spec },
      steps: [
        choice('flow', 'Which way does financial capital flow?', fl, d > 0 ? 0 : 1, flWhy, '2.A', { fixed: true }),
        graphStep('graph', 'Show the change in the market for ' + pl(X) + ': shift a curve, then put E2 where the curves cross now.', spec, '4.C', either),
        choice('value', 'What happens to the value of the ' + X + '?', vc.opts, vc.correct, vc.why, '3.A'),
        choice('nx', 'Through the exchange rate, what happens to ' + poss(H.place) + ' net exports?', nx, v > 0 ? 0 : 1, nxWhy, '3.B', { fixed: true })
      ],
      solution: [
        'Real interest rate in ' + H.place + ' ' + (d > 0 ? 'up' : 'down') + ' → financial capital ' + (d > 0 ? 'flows in' : 'inflow falls') + '.',
        either,
        'The ' + X + ' ' + (v > 0 ? 'appreciates' : 'depreciates') + ' → ' + H.adj + ' net exports ' + (v > 0 ? 'fall' : 'rise') + '.'
      ],
      answer: { dir: d, value: v, X: X, Y: Y }, shock: sh.id
    };
  }

  var GEN = { axis: genAxis, shift: genShift, nx: genNx, flows: genFlows };
  var TYPES = ['axis', 'shift', 'nx', 'flows'];
  function generate(r, ctx, type){
    var ok = ctx && ctx.types && ctx.types.length ? ctx.types : TYPES;
    var t = type && ok.indexOf(type) > -1 ? type : r.pick(ok);
    return GEN[t](r, ctx || {});
  }

  M.register('forexLab', { CUR: CUR, PAIRS: PAIRS, DRILL_CUR: DRILL_CUR, DRILL_PAIRS: DRILL_PAIRS, SHOCKS: SHOCKS, shock: shock, mirror: mirror, value: value, rate: rate, K: K, plural: pl, cap: cap, pairOf: pairOf, TYPES: TYPES, generate: generate });
})(typeof window !== 'undefined' ? window : globalThis);
