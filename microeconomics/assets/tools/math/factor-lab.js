/* Factor Market Lab model: ApMicroMath.factorLab (docs/apmicro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/apmicro-briefs/t4.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmicro-tool-checks/factor-lab.mjs) and the
   test (scripts/test/apmicro-tool-factor-lab.test.mjs) run exactly this code.

   Every number comes from ApMicroCalc (marginalProduct, mrp, mrc, hireCount,
   wageBill, perDollar, leastCost); every graph is an ApMicroGraph spec.

     TP, P0, W0                 the Explore firm: total product by worker, the
                                starting product price and wage
     competitive(P, W)          { rows: [{ L, tp, mp, mrp }], hire, bill, shifts }
     MONO                       the Explore monopsonist: wage = a + b L, MRP = c - d L
     monopsony(mw)              { rows: [{ L, w, tlc, mfc, mrp }], hire, wage, bill, comp }
                                with a minimum wage mw (0: none)
     laborSpec(P, W), monoSpec(mw)   the ApMicroGraph specs Explore draws
     generate(rng, ctx, type)   the drills:
       hire       a product table: MP, MRP = MP x P, how many to hire (MRP = MRC)
       derived    the product price changes (MRP and the firm's labor demand
                  shift; a graph step) or labor supply changes (the market
                  wage moves); the new MRP; the chain with every link
       monopsony  a wage table: MFC, workers hired (MRP = MFC), the wage read
                  from supply, then the graph (the hiring point or the wage bill)
       leastcost  MPL / w against MPK / r: which input gets the next dollar */
(function(root){
  'use strict';
  var M = root.ApMicroMath;
  if(!M) return;
  function C(){ return M.Calc(); }
  function E(fn, args){ return C().evaluate({ fn: fn, args: args }); }

  /* ------------------------------------------------- Explore models */
  var TP = [0, 10, 19, 27, 34, 40, 45, 49, 52], P0 = 4, W0 = 20;
  function rowsOf(tp, P){
    var out = [];
    for(var L = 1; L < tp.length; L++){ var mp = E('marginalProduct', [tp[L - 1], tp[L], L - 1, L]); out.push({ L: L, tp: tp[L], mp: mp, mrp: E('mrp', [mp, P]) }); }
    return out;
  }
  function competitive(P, W){
    var rows = rowsOf(TP, P), hire = E('hireCount', [rows.map(function(r){ return r.mrp; }), W]);
    return { rows: rows, hire: hire, bill: E('wageBill', [W, hire]), shifts: { MRP: Math.max(-3, Math.min(3, P - P0)), SL: Math.max(-3, Math.min(3, Math.round((W0 - W) / 4))) } };
  }
  // The Explore monopsonist: supply wage 2L + 4, MRP 40 - 2L (dollars), so the
  // table matches ApMicroGraph's monopsony graph at L = 2x and dollars = 4y.
  var MONO = { a: 4, b: 2, c: 40, d: 2, n: 10 };
  function monoRows(m, mw){
    var rows = [], prev = 0;
    for(var L = 1; L <= m.n; L++){
      var w = m.a + m.b * L, paid = Math.max(mw || 0, w), tlc = E('wageBill', [paid, L]);
      rows.push({ L: L, w: w, paid: paid, tlc: tlc, mfc: E('mrc', [prev, tlc, L - 1, L]), mrp: m.c - m.d * L });
      prev = tlc;
    }
    return rows;
  }
  function monopsony(mw, m){
    m = m || MONO;
    var rows = monoRows(m, mw), hire = E('hireCount', [rows.map(function(r){ return r.mrp; }), rows.map(function(r){ return r.mfc; })]);
    // A worker is hired only if someone will work at that wage: with a minimum wage, no more than supply offers at it.
    var comp = E('hireCount', [monoRows(m, 0).map(function(r){ return r.mrp; }), monoRows(m, 0).map(function(r){ return r.w; })]);
    var r0 = rows[hire - 1];
    return { rows: rows, hire: hire, wage: r0.paid, bill: E('wageBill', [r0.paid, hire]), comp: comp, compWage: m.a + m.b * comp };
  }
  function laborSpec(c){ return { kind: 'labor', do: ['label'], show: {} , _shifts: c.shifts }; }
  function monoSpec(mw){ var s = { kind: 'monopsony', do: ['shade'], key: { shade: 'wage-bill' } }; if(mw) s.line = { id: 'MW', at: mw / 4 }; return s; }

  /* ------------------------------------------------- drills */
  var TYPES = ['hire', 'derived', 'monopsony', 'leastcost'];
  function money(v){ return '$' + M.fmt(v, 4); }
  function cell(a, mistakes){ return M.cell(a, 0.001, mistakes, 0.005); }
  function concave(r, n){
    for(var t = 0; t < 200; t++){
      var mp = [], v = r.int(12, 20);
      for(var i = 0; i < n; i++){ mp.push(v); v -= r.int(1, 3); if(v < 1) break; }
      if(mp.length === n){ var tp = [0]; mp.forEach(function(x){ tp.push(tp[tp.length - 1] + x); }); return tp; }
    }
    return [0, 15, 28, 39, 48, 55, 60, 63];
  }
  function tableHtml(cols, rows, cap){
    return '<table class="mic-data fl-qt"><caption>' + cap + '</caption><thead><tr>' + cols.map(function(c){ return '<th scope="col">' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function(r){ return '<tr>' + r.map(function(v, i){ return i ? '<td>' + v + '</td>' : '<th scope="row">' + v + '</th>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function genHire(r, ctx){
    var tp = concave(r, 7), P = r.pick([2, 3, 4, 5, 6]), rows = rowsOf(tp, P), mrps = rows.map(function(x){ return x.mrp; });
    var at = r.int(2, 5), W = mrps[at] - r.pick([0, P, 0]);
    if(E('hireCount', [mrps, W]) >= mrps.length) W = mrps[at];
    var hire = E('hireCount', [mrps, W]), k = r.int(2, 6), mp = rows[k - 1].mp, mrpK = rows[k - 1].mrp;
    var strict = mrps.filter(function(v){ return v > W; }).length, noP = E('hireCount', [rows.map(function(x){ return x.mp; }), W]);
    var steps = [
      { key: 'mp', kind: 'num', practice: '3.A', label: 'What is the marginal product of worker ' + k + '?', cell: cell(mp, [{ value: tp[k], why: 'That is total product with ' + k + ' workers. Marginal product is the change: ' + tp[k] + ' − ' + tp[k - 1] + '.' }, { value: tp[k] / k, why: 'That is average product (TP ÷ L). Marginal product is the change in total product from one more worker.' }]), unit: ctx.unit },
      { key: 'mrp', kind: 'num', practice: '3.A', label: 'What is the marginal revenue product of worker ' + k + '?', cell: cell(mrpK, [{ value: tp[k] * P, why: 'That is total revenue (TP × P). MRP is the marginal product times the price: ' + mp + ' × ' + money(P) + '.' }, { value: mp, why: 'That is the marginal product in ' + ctx.unit + '. Multiply by the price to get dollars.' }, { value: mp * W, why: 'MRP uses the product price, not the wage: MP × P.' }]), unit: 'dollars' },
      { key: 'hire', kind: 'num', practice: '3.B', level: 'analyze', label: 'At a wage of ' + money(W) + ', how many workers does the firm hire?', cell: cell(hire, [
        { value: strict, why: 'Hire a worker whose MRP equals the wage too: the rule is MRP = MRC, so the last worker hired has MRP at least the wage.' },
        { value: noP, why: 'Compare the wage with MRP (MP × P), not with marginal product.' },
        { value: tp.length - 1, why: 'Hiring every worker ignores cost: stop where the next worker’s MRP falls below the wage.' }]), unit: 'workers' }
    ];
    var cols = ['Workers', 'Total product (' + ctx.unit + ')'], trs = tp.slice(1).map(function(v, i){ return [i + 1, v]; });
    return { type: 'hire', ctx: ctx.id, topic: ctx.topic, given: { tp: tp, P: P, W: W, k: k },
      table: tableHtml(cols, trs, ctx.firm + ': output by number of workers'),
      text: '<p>' + ctx.firm + ' sells ' + ctx.good + ' in a perfectly competitive market at ' + money(P) + ' each and hires workers in a perfectly competitive labor market at ' + money(W) + ' a day.</p>',
      steps: steps, solution: [
        'MP of worker ' + k + ' = ' + tp[k] + ' − ' + tp[k - 1] + ' = ' + mp + ' ' + ctx.unit + '.',
        'MRP = MP × P = ' + mp + ' × ' + money(P) + ' = ' + money(mrpK) + ' (a competitive seller’s MR is the price).',
        'MRP by worker: ' + mrps.map(money).join(', ') + '. Hire while MRP is at least the wage ' + money(W) + ' (MRP = MRC): ' + hire + ' workers.'] };
  }
  var CHAIN = { up: ['rises', 'raises', 'right', 'more'], down: ['falls', 'lowers', 'left', 'fewer'] };
  function genDerived(r, ctx){
    var price = r() < 0.6, up = r() < 0.5, d = up ? 'up' : 'down', w = CHAIN[d];
    var tp = concave(r, 6), P = r.pick([3, 4, 5]), P1 = up ? P + r.pick([1, 2]) : P - r.pick([1, 2]), k = r.int(2, 5), mp = tp[k] - tp[k - 1], mrp1 = E('mrp', [mp, P1]);
    var steps = [], text, sol;
    if(price){
      var cause = up ? 'demand for ' + ctx.good + ' rises' : 'demand for ' + ctx.good + ' falls';
      text = '<p>' + ctx.firm + ' sells ' + ctx.good + ' in a perfectly competitive market and hires in a large, perfectly competitive labor market. The ' + cause + ', and the market price moves from ' + money(P) + ' to ' + money(P1) + '.</p>';
      steps.push({ key: 'shift', kind: 'graph', practice: '4.B', label: 'Show the change on the firm’s graph.', spec: { kind: 'labor', do: ['shift'], movable: ['DL', 'SL', 'MRP'],
        key: { shifts: [{ curve: 'MRP', dir: up ? 'right' : 'left' }], because: 'a change in the product price' },
        slips: { SL: 'Labor supply has not changed: the product price moves the firm’s MRP, its demand for labor.', DL: 'Only this firm’s view matters here: its MRP (its labor demand) shifts; the large labor market and its wage do not move.' } },
        explain: 'MRP = MP × P, so a ' + (up ? 'higher' : 'lower') + ' price shifts MRP ' + w[2] + '.' });
      steps.push({ key: 'newmrp', kind: 'num', practice: '3.A', label: 'Worker ' + k + ' has a marginal product of ' + mp + ' ' + ctx.unit + '. What is that worker’s MRP at the new price?', cell: cell(mrp1, [{ value: E('mrp', [mp, P]), why: 'That is MRP at the old price. Use the new price: ' + mp + ' × ' + money(P1) + '.' }, { value: tp[k] * P1, why: 'That uses total product. MRP is the marginal product times the price.' }]), unit: 'dollars' });
      var good = 'Product demand ' + w[0] + ' → product price ' + w[0] + ' → MRP (MP × P) ' + w[0] + ' → the firm’s labor demand shifts ' + w[2] + ' → it hires ' + w[3] + ' workers at the same wage.';
      var opts = [good,
        'Product demand ' + w[0] + ' → the firm hires ' + w[3] + ' workers.',
        'Product demand ' + w[0] + ' → product price ' + w[0] + ' → the wage ' + w[0] + ' → the firm hires ' + CHAIN[up ? 'down' : 'up'][3] + ' workers.',
        'Product demand ' + w[0] + ' → labor supply shifts ' + w[2] + ' → the firm hires ' + w[3] + ' workers.'];
      steps.push({ key: 'chain', kind: 'choice', practice: '2.C', level: 'analyze', label: 'Which explanation earns the derived-demand point?', options: opts, correct: 0,
        why: ['Right: every link, with MRP between the product price and labor demand.', 'Too short: readers want the links, product price and MRP, between product demand and hiring.', 'The firm takes the wage from a large market: the wage does not change, its MRP does.', 'The product market moves the firm’s labor demand (MRP), not labor supply.'] });
      sol = ['Labor demand is derived from product demand: MRP = MP × P.', 'Worker ' + k + ': ' + mp + ' × ' + money(P1) + ' = ' + money(mrp1) + '.', good];
    } else {
      var sup = up ? 'Many workers move away from the area, so the supply of workers falls' : 'Many new workers move into the area, so the supply of workers rises';
      text = '<p>' + ctx.firm + ' is one of many employers in a perfectly competitive labor market. ' + sup + '.</p>';
      steps.push({ key: 'shift', kind: 'graph', practice: '4.B', label: 'Show the change in the labor market.', spec: { kind: 'labor', do: ['shift', 'equilibrium'], movable: ['DL', 'SL', 'MRP'],
        key: { shifts: [{ curve: 'SL', dir: up ? 'left' : 'right' }], because: 'a change in the number of workers', outcome: { wage: up ? 'up' : 'down', 'quantity of labor': up ? 'down' : 'up' } },
        slips: { DL: 'The number of workers changed, not the demand for them: shift labor supply.', MRP: 'The firm’s MRP has not changed; the wage it takes from the market has.' } },
        explain: 'Labor supply shifts ' + (up ? 'left' : 'right') + ', so the market wage ' + (up ? 'rises' : 'falls') + '.' });
      steps.push({ key: 'firm', kind: 'choice', practice: '2.B', level: 'analyze', label: 'What happens at ' + ctx.firm + '?', correct: 0,
        options: ['The wage ' + (up ? 'rises' : 'falls') + ', so it hires ' + (up ? 'fewer' : 'more') + ' workers, moving along its MRP curve.', 'The wage ' + (up ? 'rises' : 'falls') + ' and its MRP curve shifts ' + (up ? 'left' : 'right') + '.', 'Nothing: the firm is a wage taker, so its hiring stays the same.', 'The wage ' + (up ? 'falls' : 'rises') + ', so it hires ' + (up ? 'more' : 'fewer') + ' workers.'],
        why: ['Right: the firm hires where MRP equals the new wage, a move along MRP.', 'MRP depends on MP and the product price, neither of which changed: the firm moves along it.', 'A wage taker still responds to the wage it takes: it hires where MRP equals the new wage.', 'Fewer workers to hire push the wage up, not down (and the reverse).'] });
      sol = ['Labor supply shifts ' + (up ? 'left' : 'right') + ': the market wage ' + (up ? 'rises' : 'falls') + ' and market employment ' + (up ? 'falls' : 'rises') + '.', 'The firm takes the new wage and hires where MRP equals it: ' + (up ? 'fewer' : 'more') + ' workers, a move along its MRP curve.'];
    }
    return { type: 'derived', ctx: ctx.id, topic: ctx.topic, given: { price: price, up: up, P: P, P1: P1, k: k, mp: mp }, text: text, steps: steps, solution: sol };
  }
  function genMono(r, ctx){
    for(var t = 0; t < 400; t++){
      var m = { a: r.pick([4, 6, 8, 10]), b: r.pick([1, 2, 3]), c: 10 * r.int(4, 8), d: r.pick([2, 3, 4, 5]), n: 8 };
      var res = monopsony(0, m);
      if(res.hire < 2 || res.hire > 6 || res.comp <= res.hire || res.comp > 8 || m.c - m.d * 8 <= 0) continue;
      var rows = res.rows, k = r.int(2, 6), mf = rows[k - 1].mfc, form = r() < 0.5 ? 'point' : 'shade';
      var steps = [
        { key: 'mfc', kind: 'num', practice: '3.A', label: 'What is the marginal factor cost (MFC) of worker ' + k + '?', cell: cell(mf, [{ value: rows[k - 1].w, why: 'That is the wage. A monopsonist must raise the wage for every worker to hire one more, so MFC = change in total labor cost: ' + money(rows[k - 1].tlc) + ' − ' + money(rows[k - 2].tlc) + '.' }, { value: rows[k - 1].tlc, why: 'That is the total labor cost. MFC is the change in it from one more worker.' }]), unit: 'dollars' },
        { key: 'hire', kind: 'num', practice: '3.B', level: 'analyze', label: 'How many workers does the monopsonist hire?', cell: cell(res.hire, [{ value: res.comp, why: 'That compares MRP with the wage, as a competitive firm would. A monopsonist hires where MRP = MFC.' }]), unit: 'workers' },
        { key: 'wage', kind: 'num', practice: '3.B', level: 'analyze', label: 'What wage does it pay?', cell: cell(rows[res.hire - 1].w, [{ value: rows[res.hire - 1].mfc, why: 'That is MFC. The wage is read from the labor supply schedule at the number hired.' }, { value: rows[res.hire - 1].mrp, why: 'That is MRP. The monopsonist pays only what workers need to supply that many hours: read the wage from labor supply.' }]), unit: 'dollars' }
      ];
      steps.push(form === 'point' ? { key: 'graph', kind: 'graph', practice: '4.A', label: 'On the graph, place the point that shows the monopsonist’s wage and number of workers.', spec: { kind: 'monopsony', do: ['point'], key: { point: { at: 'hire' } }, pointLabel: 'X' }, explain: 'Go to where MRP = MFC for the number hired, then down to labor supply for the wage.' }
        : { key: 'graph', kind: 'graph', practice: '4.A', label: 'Shade the monopsonist’s total wage bill.', spec: { kind: 'monopsony', do: ['shade'], key: { shade: 'wage-bill' } }, explain: 'The wage bill is the wage (from labor supply) times the number hired: the rectangle under the wage.' });
      var trs = rows.map(function(x){ return [x.L, money(x.w), money(x.mrp)]; });
      return { type: 'monopsony', ctx: ctx.id, topic: ctx.topic, given: { m: m, k: k },
        table: tableHtml(['Workers', 'Wage needed to attract them', 'MRP'], trs, ctx.firm + ': the labor supply it faces and its MRP'),
        text: '<p>' + ctx.firm + ' is the only employer in ' + ctx.town + ' (a monopsony). To hire one more worker it must raise the wage for all of its workers.</p>', steps: steps,
        solution: ['Total labor cost = wage × workers; MFC is its change: worker ' + k + ' costs ' + money(rows[k - 1].tlc) + ' − ' + money(rows[k - 2].tlc) + ' = ' + money(mf) + '.',
          'MFC by worker: ' + rows.map(function(x){ return money(x.mfc); }).join(', ') + '. Hire while MRP ≥ MFC: ' + res.hire + ' workers.',
          'The wage is read from labor supply at ' + res.hire + ' workers: ' + money(rows[res.hire - 1].w) + ', below MRP and below the competitive wage. A competitive market would hire ' + res.comp + '.'] };
    }
    throw new Error('factor-lab: no monopsony table');
  }
  function genLeast(r, ctx){
    var w = r.pick([10, 12, 15, 20, 25]), rr = r.pick([20, 30, 40, 50]), a = r.pick([0.5, 1, 1.5, 2, 2.5, 3, 4]), b;
    do { b = r.pick([0.5, 1, 1.5, 2, 2.5, 3, 4]); } while(r() < 0.25 ? false : b === a);
    var mpl = a * w, mpk = b * rr, lp = function(k){ return C().evaluate({ fn: 'leastCost', args: [mpl, w, mpk, rr], pick: k }); }, lc = { labor: lp('labor'), capital: lp('capital'), gap: lp('gap') }, gap = lc.gap;
    var pick = Math.abs(gap) < 1e-9 ? 2 : gap > 0 ? 0 : 1;
    var big = mpl > mpk ? 0 : mpk > mpl ? 1 : -1, cheap = w < rr ? 0 : 1;
    var opts = ['Spend the next dollar on labor: it adds more output per dollar.', 'Spend the next dollar on capital: it adds more output per dollar.', 'Neither: output per dollar is equal, so this mix is the least-cost combination.',
      big > -1 && big !== pick ? 'Spend it on ' + (big ? 'capital' : 'labor') + ', since its marginal product is larger.' : 'Spend it on ' + (cheap ? 'capital' : 'labor') + ', since it has the lower price per unit.'];
    var why = [0, 1, 2, 3].map(function(i){ return (i === pick ? 'Right: ' : '') + 'MP per dollar: labor ' + M.fmt(lc.labor, 3) + ' (' + mpl + ' \u00f7 ' + w + '), capital ' + M.fmt(lc.capital, 3) + ' (' + mpk + ' \u00f7 ' + rr + ').' + (i === 3 ? ' Compare output per dollar, not marginal product or price alone.' : ''); });
    return { type: 'leastcost', ctx: ctx.id, topic: ctx.topic, given: { mpl: mpl, w: w, mpk: mpk, r: rr },
      text: '<p>' + ctx.firm + ' uses workers and machines. The last worker hired adds ' + mpl + ' ' + ctx.unit + ' and costs ' + money(w) + ' an hour; the last machine adds ' + mpk + ' ' + ctx.unit + ' and rents for ' + money(rr) + ' an hour.</p>',
      steps: [
        { key: 'labor', kind: 'num', practice: '3.A', label: 'Marginal product of labor per dollar (MPL ÷ wage)?', cell: cell(lc.labor, [{ value: w / mpl, why: 'Upside down: divide the marginal product by the wage.' }]), unit: ctx.unit + ' per dollar' },
        { key: 'capital', kind: 'num', practice: '3.A', label: 'Marginal product of capital per dollar (MPK ÷ rental rate)?', cell: cell(lc.capital, [{ value: rr / mpk, why: 'Upside down: divide the marginal product by the rental rate.' }]), unit: ctx.unit + ' per dollar' },
        { key: 'next', kind: 'choice', practice: '2.B', level: 'analyze', label: 'Where should the next dollar go?', options: opts, why: why, correct: pick }
      ],
      solution: ['MPL ÷ w = ' + mpl + ' ÷ ' + w + ' = ' + M.fmt(lc.labor, 3) + '; MPK ÷ r = ' + mpk + ' ÷ ' + rr + ' = ' + M.fmt(lc.capital, 3) + '.',
        'The least-cost rule: MPL / w = MPK / r. ' + (pick === 2 ? 'They are equal, so this mix already makes the output at the least cost.' : 'Shift spending toward ' + (pick === 0 ? 'labor' : 'capital') + ' until the two are equal (its marginal product falls as it is used more).')] };
  }
  function generate(r, ctx, type){
    var t = type || r.pick(ctx.types && ctx.types.length ? ctx.types : TYPES);
    if(t === 'hire') return genHire(r, ctx);
    if(t === 'derived') return genDerived(r, ctx);
    if(t === 'monopsony') return genMono(r, ctx);
    if(t === 'leastcost') return genLeast(r, ctx);
    throw new Error('factor-lab: unknown type ' + t);
  }

  M.register('factorLab', { TYPES: TYPES, TP: TP, P0: P0, W0: W0, MONO: MONO, rowsOf: rowsOf, competitive: competitive, monoRows: monoRows, monopsony: monopsony,
    laborSpec: laborSpec, monoSpec: monoSpec, money: money, generate: generate });
})(typeof window !== 'undefined' ? window : globalThis);
