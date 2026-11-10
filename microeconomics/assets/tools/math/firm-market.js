/* Firm and Market Lab model: ApMicroMath.firmMarket (docs/apmicro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T2, docs/apmicro-briefs/t2.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmicro-tool-checks/firm-market.mjs) and the
   test (scripts/test/apmicro-tool-firm-market.test.mjs) run exactly this code.

   Every picture is an ApMicroGraph kind: `pc` (the market beside the firm,
   the price carried across as d = MR = AR = P), `monopoly` and `monocomp`.
   The explore states read every point off the engine (named points and
   areas), so the words always match the picture:
     pcState(d, s)        { P, Q, q, atc, avc, profit, kind: 'profit'|'loss'|'zero', minAtc, minAvc }
                          for market demand and supply offsets d, s (graph units)
     pcLongRun(d)         the supply offset that brings the price back to the
                          minimum of ATC (entry or exit)
     monoState(spec, off) { Q, P, mc, atc, profit, alloc: [Q, P] } on a monopoly
                          or monocomp graph: Q where MR = MC, P from demand
     longRunD()           the demand offset of a monopolistically competitive
                          firm in the long run (demand tangent to ATC)
     generate(r, ctx, type)  a drill problem for ApMicroTools.drill; types
       quantity   a price taker's table: MR = P, the output where P = MC, TR and profit; the firm's q on the graph
       shutdown   price against AVC and ATC: profit or loss, produce or shut down; shade the profit or loss
       longrun    the long-run chain with every link: price, profit, entry or exit, supply, the new long run
       monopoly   a monopoly table: MR, Q where MR = MC, P from demand, profit; the profit-max point and the profit area
       monocomp   monopolistic competition: short-run profit, entry, demand shifts left, long-run zero profit
   Every number a drill shows comes from ApMicroCalc. */
(function(root){
  'use strict';
  var M = root.ApMicroMath;
  if(!M) return;
  function C(){ return root.ApMicroCalc; }
  function G(){ return root.ApMicroGraph; }
  function ev(fn){ var a = Array.prototype.slice.call(arguments, 1); return fn === 'costTable' ? C()[fn].apply(null, a) : C().evaluate({ fn: fn, args: a }); }
  function r6(v){ return Math.round(v * 1e6) / 1e6; }

  /* ------------------------------------------------------------ explore states */
  function pcState(d, s){
    var spec = { kind: 'pc' }, off = {};
    if(d) off.D = d; if(s) off.S = s;
    var cs = G().curves(spec, off), e = G().eq(spec, off), f = G().named(spec, off, 'firm');
    var ATC = G().find(cs, 'ATC'), AVC = G().find(cs, 'AVC');
    var atc = f ? G().y(ATC, f[0]) : null, avc = f ? G().y(AVC, f[0]) : null;
    var minAtc = G().named(spec, off, 'min-atc'), minAvc = G().named(spec, off, 'min-avc');
    var P = e ? e[1] : null, q = f ? f[0] : null;
    var gap = P - atc;
    return { P: P, Q: e ? e[0] : null, q: q, atc: atc, avc: avc, profit: q != null ? r6(gap * q) : null,
      kind: Math.abs(gap) < 0.05 ? 'zero' : gap > 0 ? 'profit' : 'loss', minAtc: minAtc, minAvc: minAvc, shut: P < minAvc[1] - 1e-9 };
  }
  // S = 5 + (x - 5 - s), D = 5 - (x - 5 - d): the crossing price is 5 + (d - s) / 2,
  // so the price is back at min ATC when s = d - 2 (minATC - 5).
  function pcLongRun(d){ var m = G().named({ kind: 'pc' }, {}, 'min-atc'); return r6(d - 2 * (m[1] - 5)); }
  function monoState(spec, off){
    off = off || {};
    var pm = G().named(spec, off, 'profit-max'), mm = G().named(spec, off, 'mr=mc'), al = G().named(spec, off, 'allocative');
    if(!pm) return null;
    var atc = G().y(G().find(G().curves(spec, off), 'ATC'), pm[0]), gap = pm[1] - atc;
    return { Q: pm[0], P: pm[1], mc: mm[1], atc: atc, profit: r6(gap * pm[0]), kind: Math.abs(gap) < 0.05 ? 'zero' : gap > 0 ? 'profit' : 'loss', alloc: al };
  }
  function longRunD(){ return G().curves({ kind: 'monocomp', run: 'long' }, {}).filter(function(c){ return c.id === 'D'; })[0].at - 5; }

  /* ------------------------------------------------------------ helpers */
  var GOODS = [
    { what: 'tomatoes', one: 'crate of tomatoes', unit: 'crates' }, { what: 'wheat', one: 'bushel of wheat', unit: 'bushels' },
    { what: 'plain T-shirts', one: 'T-shirt', unit: 'T-shirts' }, { what: 'paper clips', one: 'box of paper clips', unit: 'boxes' },
    { what: 'eggs', one: 'dozen eggs', unit: 'dozens' }, { what: 'copper wire', one: 'spool of wire', unit: 'spools' }
  ];
  var MONO = [
    { who: 'the only water utility in a valley town', unit: 'thousand gallons', one: 'thousand gallons' },
    { who: 'a firm holding the patent on a new allergy drug', unit: 'cases', one: 'case' },
    { who: 'the only ferry line to an island', unit: 'tickets', one: 'ticket' },
    { who: 'the sole maker of a patented bike lock', unit: 'locks', one: 'lock' }
  ];
  var MCOMP = ['a coffee shop on a busy street', 'a hair salon', 'a pizza place with its own recipes', 'a yoga studio', 'a bakery known for its bagels'];
  function money(x, d){ var s = M.fixed(Math.abs(x), d == null ? 2 : d); return (x < 0 ? '−$' : '$') + s; }
  function m0(x){ return Math.abs(x - Math.round(x)) < 1e-9 ? (x < 0 ? '−$' : '$') + Math.abs(Math.round(x)) : money(x); }
  function num(key, label, answer, mistakes, d, practice, extra){
    var s = { key: key, kind: 'num', label: label, cell: M.cell(answer, 0.004, mistakes, 0.006), d: d == null ? 2 : d, unit: (extra && extra.unit) || '', practice: practice || '2.B', level: 'apply' };
    if(extra && extra.hint) s.hint = extra.hint;
    return s;
  }
  function choice(key, label, options, correct, why, practice, extra){
    var s = { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: practice || '2.A', level: 'apply' };
    for(var k in (extra || {})) s[k] = extra[k];
    return s;
  }
  function graphStep(key, label, spec, practice, okWhy){ return { key: key, kind: 'graph', spec: spec, label: label, explain: okWhy, practice: practice || '4.A', level: 'apply' }; }
  function tableHtml(cols, rows, caption, mark){
    return '<table class="fm-qtable"><caption>' + caption + '</caption><thead><tr>' + cols.map(function(c){ return '<th scope="col">' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function(rw, i){ return '<tr' + (mark === i ? ' class="is-ask"' : '') + '>' + rw.map(function(v, k){ return k ? '<td>' + v + '</td>' : '<th scope="row">' + v + '</th>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }

  /* --------------------------------------------------- type: quantity */
  function pcTable(r){
    for(var guard = 0; guard < 400; guard++){
      var mmin = r.int(3, 8), k = r.int(1, 2), mc = [], i;
      mc[k] = mmin;
      for(i = k - 1; i >= 0; i--) mc[i] = mc[i + 1] + r.int(1, 3);
      for(i = k + 1; i < 7; i++) mc[i] = mc[i - 1] + r.int(2, 4);
      var tfc = r.pick([10, 15, 20, 25, 30, 40]), q = [0], tc = [tfc];
      for(i = 0; i < 7; i++){ q.push(i + 1); tc.push(ev('add', tc[i], mc[i])); }
      var P = r.int(mc[k + 1] + 1, mc[6] - 1);
      // no row with MC equal to the price, so the rule picks one output
      if(mc.indexOf(P) > -1) continue;
      var t = ev('costTable', q, tc, tfc), qs = ev('profitMaxQ', q, P, t.mc);
      if(qs < k + 2 || qs > 6) continue;
      return { q: q, tc: tc, tfc: tfc, P: P, t: t, qs: qs };
    }
    throw new Error('firm-market: no price-taker table');
  }
  function genQuantity(r, ctx){
    var g = r.pick(GOODS), T = pcTable(r), t = T.t, qs = T.qs, P = T.P;
    var tr = ev('totalRevenue', P, qs), prof = ev('profit', tr, T.tc[qs]);
    var rows = T.q.map(function(x, i){ return [String(x), m0(T.tc[i])]; });
    var spec = { kind: 'pc', show: { D: 1 }, do: ['point'], key: { point: { at: 'firm' } }, pointLabel: 'q*' };
    return {
      type: 'quantity', ctx: ctx.id, topic: ctx.topic,
      text: '<p>A firm in a perfectly competitive market for ' + g.what + ' can sell as many as it likes at the market price of <b>' + m0(P) + '</b> a ' + g.one + '. Its total cost each day is in the table.</p>',
      figure: { table: tableHtml(['Output (' + g.unit + ')', 'Total cost'], rows, 'Daily output and total cost') },
      steps: [
        choice('mr', 'What is the firm’s marginal revenue from one more ' + g.one + '?', ['The market price, ' + m0(P) + ', for every unit', 'Less than the price, and falling as it sells more', 'The price times its output', 'Zero: it cannot change the price'], 0,
          ['Right: a price taker sells every extra unit at the market price, so MR = P = AR. Its demand curve is horizontal: d = MR = AR = P.',
           'That is true for a monopoly, which must lower its price to sell more. A price taker sells every unit at the market price.',
           'That is total revenue. Marginal revenue is the extra revenue from one more unit.',
           'The firm cannot change the price, but each extra unit still brings in the price.'], '1.B'),
        num('q', 'How many ' + g.unit + ' maximize the firm’s profit?', qs, [
          { value: qs - 1, why: 'Unit ' + qs + ' still has MC (' + m0(t.mc[qs]) + ') at or below the price, so it adds to profit. Produce every unit whose MC is at most P = MR.' },
          { value: qs + 1, why: 'Unit ' + (qs + 1) + ' costs ' + m0(t.mc[qs + 1]) + ', more than the price it sells for, so it lowers profit.' },
          { value: T.q[t.atc.indexOf(Math.min.apply(null, t.atc.slice(1)))], why: 'That is where ATC is lowest. A price taker produces where P = MR = MC, not at the bottom of ATC.' }
        ], 0, '2.B', { unit: g.unit, hint: 'MC of each unit is the change in total cost. Produce each unit whose MC is at most the price.' }),
        num('tr', 'What is the firm’s total revenue at that output?', tr, [{ value: ev('totalRevenue', P, qs + 1), why: 'Use the profit-maximizing output, ' + qs + '.' }], 0, '2.B', { unit: 'dollars' }),
        num('profit', 'What is the firm’s profit at that output?', prof, [
          { value: tr, why: 'That is total revenue. Profit = TR − TC.' },
          { value: ev('sub', tr, ev('variableCost', T.tc[qs], T.tfc)), why: 'Subtract total cost, fixed cost included, not only variable cost.' }
        ], 0, '2.B', { unit: 'dollars' }),
        graphStep('graph', 'The market price has risen. On the firm’s graph, tap the firm’s profit-maximizing quantity at the new price (q*).', spec, '4.A',
          'The firm takes the market price as its d = MR = AR = P line and produces where that line crosses MC.')
      ],
      solution: [
        'A price taker sells each unit at the market price, so MR = P = ' + m0(P) + '.',
        'MC of each unit is the change in TC: ' + t.mc.slice(1).map(function(v, i){ return 'unit ' + (i + 1) + ': ' + m0(v); }).join(', ') + '.',
        'Produce every unit with MC at most ' + m0(P) + ': output ' + qs + ' (unit ' + (qs + 1) + ' would cost ' + m0(t.mc[qs + 1]) + ').',
        'TR = ' + m0(P) + ' × ' + qs + ' = ' + m0(tr) + '; profit = TR − TC = ' + m0(tr) + ' − ' + m0(T.tc[qs]) + ' = ' + m0(prof) + '.'
      ],
      answer: { q: T.q, tc: T.tc, P: P, qs: qs, tr: tr, profit: prof }
    };
  }

  /* --------------------------------------------------- type: shutdown */
  function genShutdown(r, ctx){
    var g = r.pick(GOODS), cse = r.pick(['profit', 'loss', 'shut']);
    var q = r.pick([20, 40, 50, 80, 100]), atc = r.int(10, 30), P, avc;
    if(cse === 'profit'){ P = atc + r.int(2, 6); avc = atc - r.int(3, 6); }
    else if(cse === 'loss'){ avc = atc - r.int(4, 8); P = avc + r.int(1, atc - avc - 1); }
    else { avc = atc - r.int(3, 6); P = avc - r.int(1, 3); }
    var tfc = ev('mul', ev('sub', atc, avc), q), prof = ev('unitProfit', P, atc, q);
    var lossShut = ev('neg', tfc);
    // The pc graph's price stays above min AVC within its steps, so a shut-down case is
    // asked on the cost curves: the shutdown point.
    var spec = cse === 'shut' ? { kind: 'costs', do: ['point'], key: { point: { at: 'min-avc' } } }
      : { kind: 'pc', start: { D: cse === 'profit' ? 1 : -1 }, do: ['shade'], key: { shade: cse === 'profit' ? 'profit' : 'loss' } };
    var opts = ['Keep producing: it earns an economic profit', 'Keep producing in the short run: P covers AVC, so it loses less than its fixed cost', 'Shut down: P is below AVC, so producing loses more than the fixed cost'];
    var ci = cse === 'profit' ? 0 : cse === 'loss' ? 1 : 2;
    var why = [
      ci === 0 ? 'Right: P is above ATC, so each unit earns more than its average cost.' : 'P is below ATC here, so there is no economic profit.',
      ci === 1 ? 'Right: P is below ATC (a loss) but above AVC, so each unit pays its variable cost and part of the fixed cost. Shutting down would lose all of the fixed cost, ' + m0(tfc) + '.' : ci === 0 ? 'P is above ATC: the firm earns a profit, not a loss.' : 'P is below AVC: the firm does not even cover its variable cost, so producing loses more than shutting down.',
      ci === 2 ? 'Right: P is below AVC, so every unit loses more than its variable cost. Shutting down limits the loss to the fixed cost, ' + m0(tfc) + '.' : 'Shut down only when P is below AVC (the minimum of AVC). Here P covers AVC.'
    ];
    return {
      type: 'shutdown', ctx: ctx.id, topic: ctx.topic,
      text: '<p>A perfectly competitive firm sells ' + g.what + ' at the market price of <b>' + m0(P) + '</b>. At its profit-maximizing output, <b>' + q + ' ' + g.unit + '</b>, its average total cost is <b>' + m0(atc) + '</b> and its average variable cost is <b>' + m0(avc) + '</b>.</p>',
      figure: { table: tableHtml(['Measure', 'Value'], [['Price (P = MR)', m0(P)], ['Output (q)', String(q)], ['ATC at q', m0(atc)], ['AVC at q', m0(avc)]], 'The firm at its output where P = MC') },
      steps: [
        num('profit', 'What is the firm’s economic profit (a loss is negative)?', prof, [
          { value: ev('neg', prof), why: 'Check the sign: profit = (P − ATC) × q, negative when P is below ATC.' },
          { value: ev('unitProfit', P, avc, q), why: 'That uses AVC. Economic profit compares P with ATC, which includes the fixed cost: (P − ATC) × q.' },
          { value: ev('sub', P, atc), why: 'That is the profit per unit. Multiply by the output, ' + q + '.' }
        ], 0, '2.B', { unit: 'dollars', hint: 'Profit = (P − ATC) × q.' }),
        num('tfc', 'What is the firm’s total fixed cost? (ATC − AVC is the average fixed cost.)', tfc, [{ value: ev('sub', atc, avc), why: 'That is AFC, the fixed cost per unit. Multiply by the output for the total fixed cost.' }], 0, '2.B', { unit: 'dollars' }),
        choice('decide', 'What should the firm do in the short run?', opts, ci, why, '2.A', { fixed: true }),
        cse === 'shut' ? graphStep('graph', 'On a firm’s cost curves, tap the point below which the firm shuts down.', spec, '4.A', 'The shutdown point is the minimum of AVC, where MC crosses AVC: below that price the firm makes nothing.')
          : graphStep('graph', cse === 'profit' ? 'A firm like this one earns a profit at the market price. Shade the firm’s economic profit.' : 'A firm like this one takes a loss at the market price. Shade the firm’s economic loss.', spec, '4.B',
          cse === 'profit' ? 'Profit is the rectangle between the price line and ATC at q, from zero to q.' : 'The loss is the rectangle between ATC and the price line at q, from zero to q.')
      ],
      solution: [
        'Profit = (P − ATC) × q = (' + m0(P) + ' − ' + m0(atc) + ') × ' + q + ' = ' + m0(prof) + '.',
        'TFC = (ATC − AVC) × q = (' + m0(atc) + ' − ' + m0(avc) + ') × ' + q + ' = ' + m0(tfc) + '.',
        ci === 0 ? 'P is above ATC: keep producing and earn the profit.' : ci === 1 ? 'P is between AVC and ATC: producing loses ' + m0(-prof) + ', less than the ' + m0(tfc) + ' lost by shutting down. Keep producing in the short run.' : 'P is below AVC: producing loses ' + m0(-prof) + ', more than the fixed cost of ' + m0(tfc) + '. Shut down (loss ' + m0(lossShut) + ').'
      ],
      answer: { P: P, q: q, atc: atc, avc: avc, profit: prof, tfc: tfc, decide: cse }
    };
  }

  /* --------------------------------------------------- type: longrun */
  var LR_UP = ['A popular health report says ' + '%g%' + ' are good for you, and buyers want more of them at every price.', 'Incomes rise and ' + '%g%' + ' are a normal good, so buyers want more at every price.'];
  var LR_DOWN = ['A cheaper substitute for ' + '%g%' + ' comes on the market, and buyers want fewer at every price.', 'Tastes shift away from ' + '%g%' + ', and buyers want fewer at every price.'];
  function genLongRun(r, ctx){
    var g = r.pick(GOODS), up = r() < 0.5, text = r.pick(up ? LR_UP : LR_DOWN).replace('%g%', g.what);
    var dir = up ? 1 : -1;
    var spec = { kind: 'pc', show: { D: dir }, do: ['shift'], movable: ['D', 'S'],
      key: { shifts: [{ curve: 'S', dir: up ? 'right' : 'left' }], because: up ? 'firms entering the market' : 'firms leaving the market', outcome: { price: up ? 'down' : 'up' } },
      slips: { D: 'Entry and exit change the number of sellers, so market supply shifts. Demand already changed; it does not shift again.' } };
    var c1 = ['Rises', 'Falls', 'Stays the same'], i1 = up ? 0 : 1;
    var w1 = [up ? 'Right: higher demand raises the market price, and each firm takes the new price.' : 'Lower demand lowers the market price, not raises it.', !up ? 'Right: lower demand lowers the market price, and each firm takes the new price.' : 'Higher demand raises the market price, not lowers it.', 'Demand shifted, so the equilibrium price changes in the short run.'];
    var c2 = ['An economic profit: P is above ATC', 'An economic loss: P is below ATC', 'Zero economic profit: P equals the lowest ATC'], i2 = up ? 0 : 1;
    var w2 = [up ? 'Right: the firm started at zero profit (P = min ATC); a higher price is now above ATC.' : 'The price fell below the lowest ATC, so the firm takes a loss.', !up ? 'Right: the firm started at zero profit (P = min ATC); a lower price is now below ATC.' : 'The price rose above the lowest ATC, so the firm earns a profit.', 'That is where the firm started and where it ends in the long run; right after the change the price is ' + (up ? 'above' : 'below') + ' ATC.'];
    var c3 = ['New firms enter, because existing firms earn an economic profit', 'Firms exit, because they take economic losses', 'Firms enter because demand rose', 'No firm enters or exits: the price adjusts by itself'], i3 = up ? 0 : 1;
    var w3 = [up ? 'Right: economic profit, not demand itself, is the signal that draws new firms in (no barriers to entry).' : 'There are losses here, so firms leave; they do not enter.', !up ? 'Right: losses push firms out of the market in the long run.' : 'There are profits here, so firms enter; they do not leave.', 'Firms enter because of economic profit, not because demand rose. Demand matters only through the price and profit it brings.', 'The market price only returns to the lowest ATC because entry or exit shifts market supply.'];
    var c4 = ['At the minimum of ATC, the same price as before the change', 'Above the minimum of ATC, at the new higher price', 'Below the minimum of ATC', 'At the minimum of AVC'], i4 = 0;
    var w4 = ['Right: ' + (up ? 'entry' : 'exit') + ' continues until profit is zero again, at P = min ATC (constant-cost industry).', 'A price above min ATC still gives profits, so more firms would enter.', 'A price below min ATC gives losses, so more firms would leave.', 'Min AVC is the shutdown price, a short-run idea. In the long run every cost is variable: firms need P = min ATC.'];
    var c5 = ['Larger than at the start, with more firms', 'Smaller than at the start, with fewer firms', 'The same as at the start'], i5 = up ? 0 : 1;
    var w5 = [up ? 'Right: the price is back where it started but there are more firms, each making the same output, so the market quantity is larger.' : 'With fewer firms each making the same output, the market quantity is smaller.', !up ? 'Right: the price is back where it started but there are fewer firms, so the market quantity is smaller.' : 'With more firms each making the same output, the market quantity is larger.', 'Each firm makes the same output as before, but the number of firms changed.'];
    return {
      type: 'longrun', ctx: ctx.id, topic: ctx.topic,
      text: '<p>The perfectly competitive market for ' + g.what + ' starts in long-run equilibrium: each firm earns zero economic profit. Then: <b>' + text + '</b></p>',
      figure: {},
      steps: [
        choice('price', 'In the short run, what happens to the market price?', c1, i1, w1, '3.A', { fixed: true }),
        choice('profit', 'In the short run, what does a typical firm earn?', c2, i2, w2, '2.A', { fixed: true }),
        choice('entry', 'What happens next, in the long run?', c3, i3, w3, '1.B'),
        graphStep('graph', 'The graph shows the market after the change in demand. Show the long-run adjustment: shift the curve that ' + (up ? 'entry' : 'exit') + ' moves.', spec, '4.C',
          (up ? 'Entry adds sellers: market supply shifts right' : 'Exit removes sellers: market supply shifts left') + ' until the price is back at the minimum of ATC and the firm earns zero profit.'),
        choice('lrprice', 'Where does the market price end up in the long run?', c4, i4, w4, '3.A'),
        choice('lrq', 'Compared with the start, the market quantity in the long run is:', c5, i5, w5, '3.A', { fixed: true })
      ],
      solution: [
        'Demand ' + (up ? 'rises' : 'falls') + ', so the market price ' + (up ? 'rises' : 'falls') + ' and each firm takes the new price.',
        'P is now ' + (up ? 'above' : 'below') + ' ATC: an economic ' + (up ? 'profit' : 'loss') + '.',
        (up ? 'Profit draws new firms in' : 'Losses push firms out') + ': market supply shifts ' + (up ? 'right' : 'left') + '.',
        'The price ' + (up ? 'falls' : 'rises') + ' back to the minimum of ATC: zero economic profit again, each firm at the same output.',
        'The market quantity is ' + (up ? 'larger' : 'smaller') + ', with ' + (up ? 'more' : 'fewer') + ' firms.'
      ],
      answer: { up: up }
    };
  }

  /* --------------------------------------------------- type: monopoly */
  function monoTable(r){
    for(var guard = 0; guard < 400; guard++){
      var b = r.pick([2, 3, 4]), a = r.int(8, 14) * b, mc0 = r.int(2, 6), q = [], p = [], tc = [], i;
      var tfc = r.pick([10, 20, 30, 40]);
      for(i = 0; i <= 7; i++){ q.push(i); p.push(ev('sub', a, ev('mul', b, i))); }
      var mc = [null];
      for(i = 1; i <= 7; i++) mc.push(mc0 + r.int(0, 2) * (i > 2 ? 1 : 0) + (i - 1) * r.pick([1, 2]));
      // MC rises with every unit in this table
      for(i = 2; i <= 7; i++) if(mc[i] <= mc[i - 1]) mc[i] = mc[i - 1] + 1;
      tc.push(tfc); for(i = 1; i <= 7; i++) tc.push(ev('add', tc[i - 1], mc[i]));
      var trc = p.map(function(pp, i){ return ev('totalRevenue', pp, q[i]); });
      var mr = trc.map(function(v, i){ return i ? ev('marginalRevenue', trc[i - 1], v, q[i - 1], q[i]) : null; });
      if(mr.some(function(v, i){ return i && v === mc[i]; })) continue;
      var qs = ev('profitMaxQ', q, mr, mc);
      if(qs < 2 || qs > 5) continue;
      var prof = ev('profit', trc[qs], tc[qs]);
      if(prof <= 0) continue;
      return { q: q, p: p, tc: tc, tfc: tfc, mc: mc, mr: mr, tr: trc, qs: qs, profit: prof };
    }
    throw new Error('firm-market: no monopoly table');
  }
  function genMonopoly(r, ctx){
    var f = r.pick(MONO), T = monoTable(r), qs = T.qs, P = T.p[qs];
    var rows = T.q.map(function(x, i){ return [String(x), m0(T.p[i]), m0(T.tc[i])]; });
    var spec1 = { kind: 'monopoly', do: ['point'], key: { point: { at: 'profit-max' } }, pointLabel: 'M' };
    var spec2 = { kind: 'monopoly', do: ['shade'], key: { shade: 'profit' }, slips: { cs: 'That is consumer surplus, under demand and above the price. Profit is between the price and ATC, out to the quantity the monopolist makes.', dwl: 'That is the deadweight loss, between demand and MC beyond the monopoly quantity. Profit is the rectangle between P and ATC.' } };
    var k = qs;
    return {
      type: 'monopoly', ctx: ctx.id, topic: ctx.topic,
      text: '<p>' + f.who.charAt(0).toUpperCase() + f.who.slice(1) + ' is a monopoly. The table shows the price it can charge for each quantity (its demand) and its total cost.</p>',
      figure: { table: tableHtml(['Quantity', 'Price', 'Total cost'], rows, 'Demand and total cost', k) },
      steps: [
        num('mr', 'What is the marginal revenue of unit ' + k + '?', T.mr[k], [
          { value: T.p[k], why: 'That is the price. A monopolist must lower the price on every unit to sell one more, so MR is below the price: MR = ΔTR ÷ ΔQ.' },
          { value: T.tr[k], why: 'That is total revenue. MR is the change in total revenue from one more unit.' }
        ], 0, '2.B', { unit: 'dollars', hint: 'TR = P × Q. MR = ΔTR ÷ ΔQ.' }),
        num('q', 'What quantity maximizes the monopolist’s profit?', qs, [
          { value: (function(){ var x = 0; for(var i = 1; i <= 7; i++) if(T.p[i] >= T.mc[i]) x = i; return x; })(), why: 'That is where price is at least MC: the allocatively efficient quantity. A monopolist stops where MR = MC, a smaller quantity.' }
        ], 0, '2.B', { unit: f.unit, hint: 'Produce each unit whose MR is at least its MC (MC = the change in total cost).' }),
        num('p', 'What price does it charge?', P, [
          { value: T.mr[qs], why: 'That is MR at the profit-maximizing quantity. The price comes from the demand curve: go up from Q to demand.' },
          { value: T.mc[qs], why: 'That is MC at that quantity. Price comes from demand, above MR and MC.' }
        ], 0, '2.B', { unit: 'dollars' }),
        num('profit', 'What is its profit?', T.profit, [
          { value: T.tr[qs], why: 'That is total revenue. Profit = TR − TC.' },
          { value: ev('profit', ev('totalRevenue', T.mr[qs], qs), T.tc[qs]), why: 'Total revenue uses the price from demand, not MR.' }
        ], 0, '2.B', { unit: 'dollars' }),
        graphStep('graph', 'On a monopoly graph, tap the monopolist’s profit-maximizing price and quantity (point M).', spec1, '4.A',
          'Find Q where MR crosses MC, then go straight up to the demand curve for the price.'),
        graphStep('graph2', 'Shade the monopolist’s economic profit.', spec2, '4.B', 'Profit is the rectangle between the price and ATC at the monopoly quantity, from zero to that quantity.')
      ],
      solution: [
        'TR = P × Q; MR = ΔTR ÷ ΔQ: ' + T.mr.slice(1).map(function(v, i){ return 'unit ' + (i + 1) + ': ' + m0(v); }).join(', ') + '.',
        'MC = ΔTC: ' + T.mc.slice(1).map(function(v, i){ return 'unit ' + (i + 1) + ': ' + m0(v); }).join(', ') + '.',
        'Produce each unit with MR at least MC: Q = ' + qs + ' (unit ' + (qs + 1) + ' has MR ' + m0(T.mr[qs + 1]) + ' below MC ' + m0(T.mc[qs + 1]) + ').',
        'Price from demand at Q = ' + qs + ': ' + m0(P) + '. Profit = TR − TC = ' + m0(T.tr[qs]) + ' − ' + m0(T.tc[qs]) + ' = ' + m0(T.profit) + '.'
      ],
      answer: { q: T.q, p: T.p, tc: T.tc, k: k, qs: qs, P: P, profit: T.profit }
    };
  }

  /* --------------------------------------------------- type: monocomp */
  function genMonocomp(r, ctx){
    var who = r.pick(MCOMP);
    var spec1 = { kind: 'monocomp', run: 'short', do: ['shade'], key: { shade: 'profit' } };
    var spec2 = { kind: 'monocomp', run: 'short', do: ['shift'], movable: ['D', 'MC', 'ATC'], key: { shifts: [{ curve: 'D', dir: 'left' }], because: 'new firms entering and taking some of its customers' },
      slips: { MC: 'Entry takes customers away; it does not change this firm’s costs. Its demand (and MR with it) shifts left.', ATC: 'Entry takes customers away; it does not change this firm’s costs. Its demand (and MR with it) shifts left.' } };
    var c1 = ['New firms enter, attracted by the profit', 'Firms exit', 'Nothing changes: the firm has a unique product', 'The government sets the price at ATC'];
    var w1 = ['Right: entry is easy in monopolistic competition, so economic profit draws in new firms with similar products.', 'Firms exit when there are losses; here the firm earns a profit.', 'Product differentiation gives some market power, but no barrier stops new firms with similar products.', 'No regulation is involved; entry does the work.'];
    var c2 = ['P = ATC (zero economic profit) and P > MC', 'P = MC = minimum ATC', 'P > ATC (a profit that lasts)', 'P = MR'];
    var w2 = ['Right: demand ends tangent to ATC, so P = ATC and profit is zero, but P is still above MC: not allocatively efficient.', 'That is perfect competition. A monopolistically competitive firm still faces a downward-sloping demand, so P > MC and it is not at minimum ATC.', 'Entry continues until profit is zero.', 'Price comes from demand; MR is below the price.'];
    var c3 = ['To the left of the minimum of ATC: excess capacity', 'At the minimum of ATC: productively efficient', 'To the right of the minimum of ATC'];
    var w3 = ['Right: tangent on the falling part of ATC, the firm makes less than the output with the lowest ATC: excess capacity.', 'That is perfect competition in the long run. A downward-sloping demand touches ATC on its falling part, left of the minimum.', 'Demand slopes down, so it touches ATC where ATC is still falling, left of the minimum.'];
    return {
      type: 'monocomp', ctx: ctx.id, topic: ctx.topic,
      text: '<p>' + who.charAt(0).toUpperCase() + who.slice(1) + ' is one of many sellers of similar but not identical products. Right now it earns an economic profit, as the graph shows.</p>',
      figure: {},
      steps: [
        graphStep('graph', 'Shade the firm’s economic profit.', spec1, '4.B', 'Profit is the rectangle between the price (on demand, above Q where MR = MC) and ATC at that Q.'),
        choice('entry', 'What happens in the long run?', c1, 0, w1, '1.B'),
        graphStep('graph2', 'Show the long-run change on the firm’s graph: shift the curve that moves.', spec2, '4.C', 'Entry takes away customers, so the firm’s demand (and its MR) shifts left until demand just touches ATC.'),
        choice('lr', 'In the long run, at the firm’s profit-maximizing output:', c2, 0, w2, '2.A'),
        choice('cap', 'Where is the firm’s long-run output compared with the minimum of ATC?', c3, 0, w3, '2.A', { fixed: true })
      ],
      solution: [
        'Short run: Q where MR = MC, P up on demand, P above ATC: a profit, the rectangle (P − ATC) × Q.',
        'Profit draws new firms with similar products into the market (no barriers to entry).',
        'Each firm’s demand (and MR) shifts left as customers spread over more sellers.',
        'Long run: demand is tangent to ATC, so P = ATC and profit is zero; P > MC and output is left of minimum ATC (excess capacity).'
      ],
      answer: {}
    };
  }

  var GEN = { quantity: genQuantity, shutdown: genShutdown, longrun: genLongRun, monopoly: genMonopoly, monocomp: genMonocomp };
  var TYPES = ['quantity', 'shutdown', 'longrun', 'monopoly', 'monocomp'];
  function generate(r, ctx, type){
    ctx = ctx || {};
    var ok = ctx.types && ctx.types.length ? ctx.types : TYPES;
    var t = type && ok.indexOf(type) > -1 ? type : r.pick(ok);
    return GEN[t](r, ctx);
  }

  M.register('firmMarket', { pcState: pcState, pcLongRun: pcLongRun, monoState: monoState, longRunD: longRunD, TYPES: TYPES, generate: generate, money: money, m0: m0,
    pcTable: pcTable, monoTable: monoTable });
})(typeof window !== 'undefined' ? window : globalThis);
