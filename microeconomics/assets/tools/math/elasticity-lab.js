/* Elasticity Lab model: ApMicroMath.elasticityLab (docs/apmicro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T3, docs/apmicro-briefs/t3.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmicro-tool-checks/elasticity-lab.mjs) and the
   test (scripts/test/apmicro-tool-elasticity-lab.test.mjs) run exactly this code.

   The demand curve is ApMicroGraph's straight D (slope -1 in graph units,
   0-10 on both axes) with a scale: kP dollars per graph unit of price, kQ
   units per graph unit of quantity, so demand meets the price axis at
   10 kP and the quantity axis at 10 kQ. Along it the point elasticity is
   |Ed| = P / (choke - P) (graph height over graph quantity): elastic above
   the midpoint, unit elastic at it, inelastic below, and total revenue
   P x Q is largest at the midpoint. Every number a drill keys comes from an
   ApMicroCalc recipe (pctChange, midpointPct, priceElasticity,
   midpointElasticity, incomeElasticity, crossElasticity, totalRevenue).

     demand(s)               { choke, qmax } for a scale { kP, kQ }
     at(s, p)                { p, q, tr, e } on demand at price p (dollars)
     arc(s, p1, p2, method)  the percent changes and |Ed| between two prices
                             (method 'start' or 'midpoint'), and the two TRs
     word(e)                 'elastic' | 'inelastic' | 'unit elastic'
     shift(e, pct, q0)       the new quantity at the same price when income
                             (or the other good's price) changes pct percent
     GOODS                   the goods of the income and cross-price kinds
     generate(r, ctx, type)  a drill problem for ApMicroTools.drill; types
                             coef, trtest, range, income, cross
   A graph step is ApMicroTools.drill's "graph" kind (an sd graph whose
   demand curve the student shifts), graded by ApMicroGrade.graph. */
(function(root){
  'use strict';
  var M = root.ApMicroMath;
  if(!M) return;
  function C(){ return root.ApMicroCalc; }
  function ev(fn, args){ return C().evaluate({ fn: fn, args: args }); }
  var R6 = function(v){ return Math.round(v * 1e6) / 1e6; };

  /* ------------------------------------------------------------ the curve */
  function demand(s){ return { choke: 10 * s.kP, qmax: 10 * s.kQ }; }
  function at(s, p){
    var d = demand(s), q = R6((d.choke - p) / s.kP * s.kQ);
    return { p: p, q: q, tr: ev('totalRevenue', [p, q]), e: q > 0 ? R6(p / (d.choke - p)) : Infinity };
  }
  function arc(s, p1, p2, method){
    var a = at(s, p1), b = at(s, p2), mid = method === 'midpoint';
    return {
      a: a, b: b, method: mid ? 'midpoint' : 'start',
      pq: ev(mid ? 'midpointPct' : 'pctChange', [a.q, b.q]),
      pp: ev(mid ? 'midpointPct' : 'pctChange', [p1, p2]),
      e: ev(mid ? 'midpointElasticity' : 'priceElasticity', [a.q, b.q, p1, p2])
    };
  }
  function word(e){ return Math.abs(e - 1) < 1e-9 ? 'unit elastic' : e > 1 ? 'elastic' : 'inelastic'; }
  function shift(e, pct, q0){ return R6(q0 * (1 + e * pct / 100)); }

  /* ------------------------------------------------------------ text */
  function money(x){ var r = M.round(x, 2), s = Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(Math.abs(r))) : Math.abs(r).toFixed(2); return (r < 0 ? '−' : '') + '$' + s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function n(x){ var r = M.round(x, 2); return M.minus(String(Math.abs(r - Math.round(r)) < 1e-9 ? Math.round(r) : r)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function signed(x, d){ var s = M.fixed(x, d == null ? 2 : d); return (x > 0 ? '+' : '') + M.minus(s); }
  function dec(x){ return Math.abs(x - Math.round(x)) < 1e-9 ? 0 : Math.abs(x * 10 - Math.round(x * 10)) < 1e-9 ? 1 : 2; }

  /* ------------------------------------------------------------ steps */
  function numStep(key, label, answer, mistakes, practice, o){
    o = o || {};
    var d = o.d != null ? o.d : dec(answer), abs = d === 0 ? 0.0001 : d === 1 ? 0.051 : 0.011;
    var s = { key: key, kind: 'num', label: label, cell: M.cell(answer, 0.002, mistakes, abs), unit: o.unit || '', d: d, practice: practice, level: o.level || 'apply' };
    if(o.hint) s.hint = o.hint;
    return s;
  }
  function choice(key, label, options, correct, why, practice){ return { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: practice, level: 'apply' }; }
  function deal(r, opts){
    var idx = M.shuffle(r, opts.map(function(x, i){ return i; }));
    return { options: idx.map(function(i){ return opts[i][0]; }), why: idx.map(function(i){ return opts[i][1]; }), correct: idx.indexOf(0) };
  }
  function shiftStep(key, label, dir, because, okWhy, practice){
    var spec = { kind: 'sd', do: ['shift'], movable: ['D', 'S'], key: { shifts: [{ curve: 'D', dir: dir }], because: because },
      slips: { S: 'Income and the prices of related goods change what buyers want: they shift demand, not supply.' } };
    return { key: key, kind: 'graph', spec: spec, label: label, explain: okWhy, practice: practice, level: 'apply' };
  }
  function classOpts(e, ctxWord){
    var w = word(e);
    return [
      ['Elastic: |Ed| is greater than 1', w === 'elastic' ? 'Right. |Ed| = ' + M.fixed(e, 2) + ' > 1: quantity demanded changes by a larger percent than price' + ctxWord + '.' : 'Elastic means |Ed| > 1. Here |Ed| = ' + M.fixed(e, 2) + '.'],
      ['Inelastic: |Ed| is less than 1', w === 'inelastic' ? 'Right. |Ed| = ' + M.fixed(e, 2) + ' < 1: quantity demanded changes by a smaller percent than price' + ctxWord + '.' : 'Inelastic means |Ed| < 1. Here |Ed| = ' + M.fixed(e, 2) + '.'],
      ['Unit elastic: |Ed| equals 1', w === 'unit elastic' ? 'Right. The two percent changes are equal in size, so |Ed| = 1.' : 'Unit elastic means the two percent changes are the same size. Here |Ed| = ' + M.fixed(e, 2) + '.'],
      ['Perfectly inelastic: |Ed| is 0', 'Perfectly inelastic means quantity demanded does not change at all when price changes. Here it did.']
    ];
  }
  function orderFor(opts, key){ var i = opts.map(function(o){ return o[0]; }).indexOf(key); var o = opts.slice(); var k = o.splice(i, 1)[0]; return [k].concat(o); }

  /* ------------------------------------------------------------ goods */
  var GOODS = {
    necessity: [{ g: 'bus passes', e: 0.4 }, { g: 'store-brand rice', e: 0.2 }, { g: 'electricity', e: 0.5 }, { g: 'haircuts', e: 0.6 }],
    luxury: [{ g: 'boat rentals', e: 2 }, { g: 'concert tickets', e: 1.5 }, { g: 'restaurant meals', e: 1.6 }, { g: 'ski trips', e: 2.5 }],
    inferior: [{ g: 'instant noodles', e: -0.5 }, { g: 'used textbooks', e: -0.4 }, { g: 'bus rides', e: -0.6 }, { g: 'canned beans', e: -0.8 }],
    substitute: [{ x: 'tea', y: 'coffee', e: 0.6, p: 4 }, { x: 'scooter rentals', y: 'bike rentals', e: 1.2, p: 20 }, { x: 'butter', y: 'margarine', e: 0.8, p: 4 }, { x: 'train tickets', y: 'bus tickets', e: 0.4, p: 10 }],
    complement: [{ x: 'printer ink', y: 'printers', e: -0.8, p: 200 }, { x: 'hot dog buns', y: 'hot dogs', e: -1.2, p: 5 }, { x: 'phone cases', y: 'phones', e: -0.6, p: 400 }, { x: 'ski lift passes', y: 'ski boots', e: -0.4, p: 200 }],
    unrelated: [{ x: 'socks', y: 'garden hoses', e: 0, p: 20 }, { x: 'pencils', y: 'motor oil', e: 0, p: 10 }]
  };

  /* -------------------------------------------- type: coef (|Ed| from two points) */
  var SCALES = [[1, 10], [2, 10], [2, 20], [5, 10], [1, 100], [4, 50]];
  function genCoef(r, ctx){
    var s, p1, p2, A, B, tries = 0, method;
    do {
      var sc = r.pick(SCALES); s = { kP: sc[0], kQ: sc[1] };
      var g1 = r.pick([1, 2, 3, 4, 6, 7, 8, 9]), g2 = g1 + r.pick([-1, 1]);
      p1 = g1 * s.kP; p2 = g2 * s.kP;
      method = r() < 0.3 ? 'midpoint' : 'start';
      A = arc(s, p1, p2, method); B = arc(s, p1, p2, method === 'midpoint' ? 'start' : 'midpoint');
    } while((g2 < 1 || g2 > 9 || word(A.e) !== word(B.e) || Math.abs(A.e - 1) < 0.15 || Math.abs(A.e - B.e) < 0.03) && ++tries < 80);
    var good = r.pick(['kelp bars', 'museum passes', 'phone chargers', 'gym day passes', 'sunscreen', 'board games']), rise = p2 > p1, mid = method === 'midpoint';
    var text = '<p>When the price of ' + good + ' ' + (rise ? 'rises' : 'falls') + ' from <b>' + money(p1) + '</b> to <b>' + money(p2) + '</b>, the quantity demanded ' + (rise ? 'falls' : 'rises') + ' from <b>' + n(A.a.q) + '</b> to <b>' + n(A.b.q) + '</b> a week.</p>' +
      '<p class="bt-small">' + (mid ? '<b>Use the midpoint method:</b> divide each change by the average of the two values.' : '<b>Use the starting values:</b> divide each change by the value before the change.') + '</p>';
    var other = mid ? 'the starting-value' : 'the midpoint';
    var cls = deal(r, orderFor(classOpts(A.e, ''), word(A.e) === 'elastic' ? 'Elastic: |Ed| is greater than 1' : 'Inelastic: |Ed| is less than 1'));
    var steps = [
      numStep('pq', 'The percent change in quantity demanded (with its sign).', A.pq, [
        { value: B.pq, why: 'That is ' + other + ' percent change. This problem uses ' + (mid ? 'the midpoint method: divide by the average quantity.' : 'the starting values: divide by the first quantity.') },
        { value: ev('pctChange', [A.b.q, A.a.q]), why: 'Divide by the starting quantity (' + n(A.a.q) + '), not the new one.' }
      ], '3.A', { unit: '%', hint: mid ? '%ΔQ = (Q₂ − Q₁) ÷ ((Q₁ + Q₂) ÷ 2) × 100' : '%ΔQ = (Q₂ − Q₁) ÷ Q₁ × 100' }),
      numStep('pp', 'The percent change in price (with its sign).', A.pp, [
        { value: B.pp, why: 'That is ' + other + ' percent change. This problem uses ' + (mid ? 'the midpoint method.' : 'the starting values.') }
      ], '3.A', { unit: '%' }),
      numStep('e', 'The price elasticity of demand, |Ed|.', A.e, [
        { value: R6(1 / A.e), why: 'Upside down: elasticity is the percent change in quantity divided by the percent change in price.' },
        { value: -A.e, why: 'Price elasticity of demand is reported as an absolute value: drop the minus sign, which only says price and quantity move in opposite directions.' },
        { value: B.e, why: 'That is ' + other + ' value. This problem uses ' + (mid ? 'the midpoint method.' : 'the starting values.') }
      ], '3.A'),
      choice('class', 'So between these two prices, demand is:', cls.options, cls.correct, cls.why, '2.B')
    ];
    return {
      type: 'coef', ctx: ctx.id, topic: ctx.topic, text: text,
      figure: { demand: s, points: [{ p: p1, label: 'A' }, { p: p2, label: 'B' }] },
      steps: steps,
      solution: [
        '%ΔQ = ' + (mid ? '(' + n(A.b.q) + ' − ' + n(A.a.q) + ') ÷ ' + n((A.a.q + A.b.q) / 2) : '(' + n(A.b.q) + ' − ' + n(A.a.q) + ') ÷ ' + n(A.a.q)) + ' × 100 = ' + signed(A.pq, 1) + '%.',
        '%ΔP = ' + (mid ? '(' + money(p2) + ' − ' + money(p1) + ') ÷ ' + money((p1 + p2) / 2) : '(' + money(p2) + ' − ' + money(p1) + ') ÷ ' + money(p1)) + ' × 100 = ' + signed(A.pp, 1) + '%.',
        '|Ed| = |' + M.minus(M.fixed(A.pq, 1)) + ' ÷ ' + M.minus(M.fixed(A.pp, 1)) + '| = ' + M.fixed(A.e, 2) + ': ' + word(A.e) + '.',
        'On a straight demand curve this matches the rule: above the midpoint (' + money(demand(s).choke / 2) + ') demand is elastic, below it inelastic.'
      ],
      answer: { s: s, p1: p1, p2: p2, method: method, A: A }
    };
  }

  /* -------------------------------------------- type: trtest (the total revenue test) */
  function genTr(r, ctx){
    var sc = r.pick(SCALES), s = { kP: sc[0], kQ: sc[1] }, upper = r() < 0.5;
    var g = upper ? r.pick([[8, 7], [9, 8], [8, 6], [7, 6]]) : r.pick([[3, 2], [4, 3], [4, 2], [2, 1]]);
    var cut = r() < 0.6, pa = (cut ? g[0] : g[1]) * s.kP, pb = (cut ? g[1] : g[0]) * s.kP, A = at(s, pa), B = at(s, pb);
    var good = r.pick(['yoga classes', 'phone cases', 'bike tune-ups', 'water filters', 'notebooks', 'rain boots']);
    var rows = [9, 8, 7, 6, 5, 4, 3, 2, 1].map(function(k){ return at(s, k * s.kP); });
    var table = '<table class="ls-tbl el-tbl"><caption>Weekly demand for ' + good + ' (invented data)</caption><thead><tr><th scope="col">Price</th><th scope="col">Quantity demanded</th></tr></thead><tbody>' +
      rows.map(function(x){ return '<tr' + (x.p === pa || x.p === pb ? ' class="is-pick"' : '') + '><th scope="row">' + money(x.p) + '</th><td>' + n(x.q) + '</td></tr>'; }).join('') + '</tbody></table>';
    var trUp = B.tr > A.tr, elastic = upper;
    var text = '<p>A seller of ' + good + ' ' + (cut ? 'cuts' : 'raises') + ' the price from <b>' + money(pa) + '</b> to <b>' + money(pb) + '</b>. The table is its demand schedule.</p>';
    var trC = deal(r, [
      [trUp ? 'Total revenue rises' : 'Total revenue falls', 'Right: from ' + money(A.tr) + ' to ' + money(B.tr) + '.'],
      [trUp ? 'Total revenue falls' : 'Total revenue rises', 'Compare price × quantity at each price: ' + money(A.tr) + ' before, ' + money(B.tr) + ' after.'],
      ['Total revenue does not change', 'Revenue stays the same only when demand is unit elastic. Here it goes from ' + money(A.tr) + ' to ' + money(B.tr) + '.']
    ]);
    var clsC = deal(r, [
      [elastic ? 'Elastic: price and total revenue move in opposite directions' : 'Inelastic: price and total revenue move in the same direction',
        elastic ? 'Right. The price ' + (cut ? 'fell' : 'rose') + ' and revenue ' + (trUp ? 'rose' : 'fell') + ': opposite directions, so the quantity response outweighs the price change.' : 'Right. The price ' + (cut ? 'fell' : 'rose') + ' and revenue ' + (trUp ? 'rose' : 'fell') + ': the same direction, so the price change outweighs the quantity response.'],
      [elastic ? 'Inelastic: price and total revenue move in opposite directions' : 'Elastic: price and total revenue move in the same direction', 'Turn the rule around: when price and revenue move in opposite directions demand is elastic; in the same direction, inelastic.'],
      ['Unit elastic: total revenue changed', 'Unit elastic is the case where revenue does not change.'],
      [elastic ? 'Inelastic: quantity changed by fewer units than price' : 'Elastic: quantity changed by more units than price', 'Compare percent changes (or use the total revenue test), never raw units: units and dollars cannot be compared.']
    ]);
    var steps = [
      numStep('tr1', 'Total revenue at ' + money(pa) + ', in dollars.', A.tr, [{ value: A.p + A.q, why: 'Total revenue is price times quantity, not price plus quantity.' }], '3.A', { unit: 'dollars', hint: 'TR = P × Q' }),
      numStep('tr2', 'Total revenue at ' + money(pb) + ', in dollars.', B.tr, [{ value: B.p + B.q, why: 'Total revenue is price times quantity, not price plus quantity.' }], '3.A', { unit: 'dollars' }),
      choice('dir', 'What happens to total revenue?', trC.options, trC.correct, trC.why, '2.A'),
      choice('class', 'By the total revenue test, demand in this price range is:', clsC.options, clsC.correct, clsC.why, '2.B')
    ];
    return {
      type: 'trtest', ctx: ctx.id, topic: ctx.topic, text: text, table: table,
      steps: steps,
      solution: [
        'TR at ' + money(pa) + ' = ' + money(pa) + ' × ' + n(A.q) + ' = ' + money(A.tr) + '. TR at ' + money(pb) + ' = ' + money(pb) + ' × ' + n(B.q) + ' = ' + money(B.tr) + '.',
        'The price ' + (cut ? 'fell' : 'rose') + ' and total revenue ' + (trUp ? 'rose' : 'fell') + ': ' + (elastic ? 'opposite directions, so demand is elastic here.' : 'the same direction, so demand is inelastic here.'),
        'Both prices are ' + (upper ? 'above' : 'below') + ' the midpoint of this straight demand curve (' + money(demand(s).choke / 2) + '), where demand is ' + (upper ? 'elastic' : 'inelastic') + '.'
      ],
      answer: { s: s, pa: pa, pb: pb, A: A, B: B, elastic: elastic, trUp: trUp }
    };
  }

  /* -------------------------------------------- type: range (elasticity along the line) */
  function genRange(r, ctx){
    var sc = r.pick(SCALES), s = { kP: sc[0], kQ: sc[1] }, d = demand(s);
    var gA = r.pick([7, 8, 9]), gB = r.pick([1, 2, 3]), pA = gA * s.kP, pB = gB * s.kP, ask = r.pick(['A', 'B']);
    var pt = ask === 'A' ? at(s, pA) : at(s, pB), el = ask === 'A';
    var text = '<p>The graph shows a straight-line demand curve that meets the price axis at <b>' + money(d.choke) + '</b> and the quantity axis at <b>' + n(d.qmax) + '</b>. Point A is at ' + money(pA) + ', point B at ' + money(pB) + '.</p>';
    var cls = deal(r, orderFor(classOpts(pt.e, ' at this point').map(function(o){ return [o[0], o[1].replace(/Here \|Ed\| = [\d.]+\./, 'At point ' + ask + ' the price is ' + (el ? 'above' : 'below') + ' the midpoint.')]; }), el ? 'Elastic: |Ed| is greater than 1' : 'Inelastic: |Ed| is less than 1'));
    var advC = deal(r, [
      [el ? 'Cut the price: in the elastic range a lower price raises total revenue' : 'Raise the price: in the inelastic range a higher price raises total revenue',
        el ? 'Right. Above the midpoint quantity responds more than price, so a price cut raises P × Q, up to the midpoint.' : 'Right. Below the midpoint quantity responds less than price, so a price rise raises P × Q, up to the midpoint.'],
      [el ? 'Raise the price: a higher price always raises total revenue' : 'Cut the price: a lower price always raises total revenue', 'It depends on elasticity. At point ' + ask + ' demand is ' + (el ? 'elastic' : 'inelastic') + ', so the price should move ' + (el ? 'down' : 'up') + ' toward the midpoint.'],
      ['Keep the price: total revenue is already at its largest', 'Total revenue is largest only at the midpoint (' + money(d.choke / 2) + '), where demand is unit elastic.'],
      [el ? 'Raise the price: the curve is steep here' : 'Cut the price: the curve is flat here', 'The slope of a straight line is the same everywhere. What changes along it is elasticity, because P/Q changes.']
    ]);
    var steps = [
      numStep('mid', 'At what price is demand unit elastic, in dollars?', d.choke / 2, [
        { value: d.choke, why: 'That is where demand meets the price axis. Unit elasticity is at the midpoint, halfway down.' },
        { value: d.qmax / 2, why: 'That is the midpoint quantity. The question asks for the price there.' }
      ], '3.A', { unit: 'dollars', hint: 'On a straight demand curve, unit elasticity is at the midpoint.' }),
      numStep('qmax', 'At what quantity is total revenue largest?', d.qmax / 2, [
        { value: d.qmax, why: 'At that quantity the price is zero, so revenue is zero. Revenue peaks at the midpoint.' },
        { value: d.choke / 2, why: 'That is the price at the midpoint. The question asks for the quantity.' }
      ], '3.A', { unit: 'units' }),
      choice('class', 'At point ' + ask + ', demand is:', cls.options, cls.correct, cls.why, '2.B'),
      choice('advice', 'A seller at point ' + ask + ' wants more total revenue. What should it do?', advC.options, advC.correct, advC.why, '2.C')
    ];
    return {
      type: 'range', ctx: ctx.id, topic: ctx.topic, text: text,
      figure: { demand: s, points: [{ p: pA, label: 'A' }, { p: pB, label: 'B' }], ranges: true },
      steps: steps,
      solution: [
        'The midpoint is halfway along the line: price ' + money(d.choke / 2) + ', quantity ' + n(d.qmax / 2) + '. Demand is unit elastic there and total revenue is largest.',
        'Point ' + ask + ' (' + money(pt.p) + ', ' + n(pt.q) + ' units) is ' + (el ? 'above' : 'below') + ' the midpoint, so demand is ' + (el ? 'elastic' : 'inelastic') + ' there (|Ed| = P ÷ (' + money(d.choke) + ' − P) = ' + M.fixed(pt.e, 2) + ').',
        'To raise total revenue, move the price toward the midpoint: ' + (el ? 'cut it.' : 'raise it.')
      ],
      answer: { s: s, ask: ask, pA: pA, pB: pB, pt: pt }
    };
  }

  /* -------------------------------------------- type: income */
  function genIncome(r, ctx){
    var kind, gd, pct, q1, q2, tries = 0;
    do {
      kind = r.pick(['necessity', 'luxury', 'inferior']); gd = r.pick(GOODS[kind]); pct = r.pick([10, 20, 25]) * (r() < 0.75 ? 1 : -1); q1 = r.pick([200, 400, 500, 800, 1000]);
      q2 = shift(gd.e, pct, q1);
    } while((Math.abs(q2 - Math.round(q2)) > 1e-9 || q2 <= 0) && ++tries < 80);
    var i1 = r.pick([40000, 50000, 60000, 80000]), i2 = R6(i1 * (1 + pct / 100)), e = ev('incomeElasticity', [q1, q2, i1, i2]);
    var next = r() < 0.5 ? 1 : -1, dir = (e > 0 ? 1 : -1) * next > 0 ? 'right' : 'left';
    var text = '<p>When average household income ' + (pct > 0 ? 'rises' : 'falls') + ' from <b>' + money(i1) + '</b> to <b>' + money(i2) + '</b> a year, the quantity of ' + gd.g + ' demanded at the same price ' + (q2 > q1 ? 'rises' : 'falls') + ' from <b>' + n(q1) + '</b> to <b>' + n(q2) + '</b> a month. Use the starting values.</p>';
    var opts = [
      ['A normal good and a necessity: income elasticity between 0 and 1', 'A necessity has a positive income elasticity below 1: buyers buy more as income rises, but by a smaller percent.'],
      ['A normal good and a luxury: income elasticity above 1', 'A luxury has an income elasticity above 1: the quantity demanded grows by a larger percent than income.'],
      ['An inferior good: income elasticity below 0', 'An inferior good has a negative income elasticity: buyers buy less of it as income rises.'],
      ['Price inelastic: the elasticity is less than 1 in absolute value', 'This is income elasticity, so its sign is the answer: it says whether the good is normal or inferior, not how buyers react to its price.']
    ];
    var key = kind === 'necessity' ? 0 : kind === 'luxury' ? 1 : 2;
    opts[key][1] = 'Right. ' + opts[key][1];
    var cls = deal(r, orderFor(opts, opts[key][0]));
    var steps = [
      numStep('e', 'The income elasticity of demand (with its sign).', e, [
        { value: -e, why: 'Check the sign. Income elasticity keeps its sign: quantity and income ' + (e > 0 ? 'moved the same way, so it is positive.' : 'moved in opposite directions, so it is negative.') },
        { value: R6(1 / e), why: 'Upside down: income elasticity is the percent change in quantity divided by the percent change in income.' }
      ], '3.A', { hint: 'Income elasticity = %ΔQ ÷ %ΔIncome, keeping the sign.' }),
      choice('class', 'So ' + gd.g + ' are:', cls.options, cls.correct, cls.why, '2.B'),
      shiftStep('graph', 'Next year income ' + (next > 0 ? 'rises' : 'falls') + '. Show what happens in the market for ' + gd.g + ': shift the curve that moves.', dir, (next > 0 ? 'a rise in income' : 'a fall in income') + ' for ' + (e > 0 ? 'a normal good' : 'an inferior good'),
        (e > 0 ? 'A normal good: ' : 'An inferior good: ') + 'income ' + (next > 0 ? 'up' : 'down') + ' means buyers want ' + (dir === 'right' ? 'more' : 'less') + ' at every price, so demand shifts ' + dir + '.', '4.C')
    ];
    return {
      type: 'income', ctx: ctx.id, topic: ctx.topic, text: text,
      steps: steps,
      solution: [
        '%ΔQ = (' + n(q2) + ' − ' + n(q1) + ') ÷ ' + n(q1) + ' × 100 = ' + signed(ev('pctChange', [q1, q2]), 1) + '%; %ΔIncome = ' + signed(pct, 0) + '%.',
        'Income elasticity = ' + signed(ev('pctChange', [q1, q2]), 1) + ' ÷ ' + signed(pct, 0) + ' = ' + signed(e, 2) + ': ' + (kind === 'inferior' ? 'negative, an inferior good.' : kind === 'luxury' ? 'above 1, a normal good and a luxury.' : 'between 0 and 1, a normal good and a necessity.'),
        'So when income ' + (next > 0 ? 'rises' : 'falls') + ', demand for ' + gd.g + ' shifts ' + dir + '.'
      ],
      answer: { kind: kind, e: e, q1: q1, q2: q2, i1: i1, i2: i2, next: next, dir: dir }
    };
  }

  /* -------------------------------------------- type: cross */
  function genCross(r, ctx){
    var kind, gd, pct, q1, q2, tries = 0;
    do {
      kind = r() < 0.1 ? 'unrelated' : r.pick(['substitute', 'complement']); gd = r.pick(GOODS[kind]); pct = r.pick([10, 20, 25]) * (r() < 0.7 ? 1 : -1); q1 = r.pick([200, 400, 500, 800, 1000]);
      q2 = shift(gd.e, pct, q1);
    } while((Math.abs(q2 - Math.round(q2)) > 1e-9 || q2 <= 0) && ++tries < 80);
    var py1 = gd.p, py2 = R6(py1 * (1 + pct / 100)), e = ev('crossElasticity', [q1, q2, py1, py2]);
    var next = r() < 0.5 ? 1 : -1, dir = e > 0 ? (next > 0 ? 'right' : 'left') : (next > 0 ? 'left' : 'right');
    var text = '<p>When the price of <b>' + gd.y + '</b> ' + (pct > 0 ? 'rises' : 'falls') + ' from ' + money(py1) + ' to ' + money(py2) + ', the quantity of <b>' + gd.x + '</b> demanded ' + (q2 === q1 ? 'stays at ' + n(q1) : (q2 > q1 ? 'rises' : 'falls') + ' from ' + n(q1) + ' to ' + n(q2)) + ' a week. Use the starting values.</p>';
    var opts = [
      ['Substitutes: the cross-price elasticity is positive', 'Substitutes have a positive cross-price elasticity: when one gets more expensive, buyers switch to the other.'],
      ['Complements: the cross-price elasticity is negative', 'Complements have a negative cross-price elasticity: when one gets more expensive, buyers use less of both.'],
      ['Unrelated: the cross-price elasticity is zero', 'Unrelated goods have a cross-price elasticity of zero: one price does not move the other quantity.'],
      ['Complements: the cross-price elasticity is positive', 'The sign is reversed: a positive cross-price elasticity means substitutes, a negative one complements.']
    ];
    var key = kind === 'substitute' ? 0 : kind === 'complement' ? 1 : 2;
    opts[key][1] = 'Right. ' + opts[key][1];
    var cls = deal(r, orderFor(opts, opts[key][0]));
    var steps = [
      numStep('e', 'The cross-price elasticity of demand for ' + gd.x + ' (with its sign).', e, e === 0 ? [] : [
        { value: -e, why: 'Check the sign. The price of ' + gd.y + ' and the quantity of ' + gd.x + ' moved ' + (e > 0 ? 'the same way, so it is positive.' : 'in opposite directions, so it is negative.') },
        { value: R6(1 / e), why: 'Upside down: divide the percent change in the quantity of ' + gd.x + ' by the percent change in the price of ' + gd.y + '.' }
      ], '3.A', { hint: 'Cross-price elasticity = %ΔQ of ' + gd.x + ' ÷ %ΔP of ' + gd.y + ', keeping the sign.', d: e === 0 ? 0 : undefined }),
      choice('class', 'So ' + gd.x + ' and ' + gd.y + ' are:', cls.options, cls.correct, cls.why, '2.B')
    ];
    if(kind !== 'unrelated') steps.push(shiftStep('graph', 'Next month the price of ' + gd.y + ' ' + (next > 0 ? 'rises' : 'falls') + '. Shift the curve that moves in the market for ' + gd.x + '.', dir,
      (next > 0 ? 'a rise' : 'a fall') + ' in the price of a ' + (kind === 'substitute' ? 'substitute' : 'complement'),
      (kind === 'substitute' ? 'Substitutes: ' : 'Complements: ') + 'a ' + (next > 0 ? 'higher' : 'lower') + ' price of ' + gd.y + ' means buyers want ' + (dir === 'right' ? 'more' : 'fewer') + ' ' + gd.x + ' at every price, so demand shifts ' + dir + '.', '4.C'));
    return {
      type: 'cross', ctx: ctx.id, topic: ctx.topic, text: text,
      steps: steps,
      solution: [
        '%ΔQ of ' + gd.x + ' = ' + signed(ev('pctChange', [q1, q2]), 1) + '%; %ΔP of ' + gd.y + ' = ' + signed(pct, 0) + '%.',
        'Cross-price elasticity = ' + signed(e, 2) + ': ' + (kind === 'substitute' ? 'positive, so substitutes.' : kind === 'complement' ? 'negative, so complements.' : 'zero, so unrelated.'),
        kind === 'unrelated' ? 'The price of ' + gd.y + ' does not move demand for ' + gd.x + '.' : 'So a ' + (next > 0 ? 'rise' : 'fall') + ' in the price of ' + gd.y + ' shifts demand for ' + gd.x + ' ' + dir + '.'
      ],
      answer: { kind: kind, e: e, q1: q1, q2: q2, py1: py1, py2: py2, next: next, dir: dir }
    };
  }

  var GEN = { coef: genCoef, trtest: genTr, range: genRange, income: genIncome, cross: genCross };
  var TYPES = Object.keys(GEN);
  function generate(r, ctx, type){
    var list = ctx.types || TYPES, t = type && list.indexOf(type) > -1 ? type : r.pick(list);
    return GEN[t](r, ctx);
  }

  M.register('elasticityLab', { TYPES: TYPES, GOODS: GOODS, SCALES: SCALES, demand: demand, at: at, arc: arc, word: word, shift: shift, money: money, n: n, signed: signed, generate: generate });
})(typeof window !== 'undefined' ? window : globalThis);
