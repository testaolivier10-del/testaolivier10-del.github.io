/* Cost Curve Lab model: ApMicroMath.costLab (docs/apmicro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T2, docs/apmicro-briefs/t2.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmicro-tool-checks/cost-lab.mjs) and the
   test (scripts/test/apmicro-tool-cost-lab.test.mjs) run exactly this code.

   Explore: one firm's cost table, worker by worker, drawn on ApMicroGraph's
   `costs` graph (with AFC). The graph's curves come from one cubic total cost
   model (ApMicroGraph.COST.firm: TVC = a x - b x^2 + c x^3 in graph units),
   so MC passes exactly through the minimum of AVC and of ATC. The table is
   that same firm counted in dollars and units: output Q = 10 x, cost per unit
   in dollars = the graph's height. With a wage of $60 the total product of
   each worker is where the model's variable cost reaches 60 L (rounded to a
   whole unit: EXPLORE.tp), so every row of the table lands on the curves the
   engine draws, within rounding. A fixed cost TFC moves ATC and AFC only (an
   ATC offset of (TFC / 10 - F) / Fstep); a cost per unit of output m
   (materials, a per-unit tax) moves MC, AVC and ATC up by m (an MC and ATC
   offset of m).

     EXPLORE                    { wage, labor[], tp[], tfc, mats }  the explore firm
     table(o)                   every column of the explore table, each cell from
                                ApMicroCalc: { labor, tp, mp, tfc, tvc, tc, mc, afc, avc, atc }
     offsets(tfc, mats)         the costs graph's offsets for that firm { MC, ATC }
     minRow(col)                the row with the smallest value of a column (rows 1+)
     generate(r, ctx, type)     a drill problem for ApMicroTools.drill; types
                                table (MP and MC from a labor table), mc (MC,
                                ATC and AFC from an output table, label the
                                curves), min (the minimums of AVC and ATC, and
                                where MC crosses them), shutdown (the shutdown
                                and break-even prices), fixed (a fixed cost or a
                                per-unit cost: which curves move)
   Every number a drill shows comes from ApMicroCalc; every graph is an
   ApMicroGraph spec graded by ApMicroGrade.graph. */
(function(root){
  'use strict';
  var M = root.ApMicroMath;
  if(!M) return;
  function C(){ return root.ApMicroCalc; }
  function G(){ return root.ApMicroGraph; }
  // A number from its ApMicroCalc recipe; a table (an object result) from the recipe's function itself.
  function ev(fn){ var a = Array.prototype.slice.call(arguments, 1); return fn === 'costTable' || fn === 'productTable' ? C()[fn].apply(null, a) : C().evaluate({ fn: fn, args: a }); }

  /* ------------------------------------------------------------ explore */
  // tp: where 10 (a x - b x^2 + c x^3) = 60 L on the engine's firm model, x = Q / 10,
  // rounded to a whole unit (the test recomputes them).
  var EXPLORE = { wage: 60, labor: [0, 1, 2, 3, 4, 5, 6, 7, 8], tp: [0, 13, 32, 50, 62, 70, 77, 83, 88], tfc: 80, mats: 0 };
  function table(o){
    o = o || {};
    var w = o.wage != null ? o.wage : EXPLORE.wage, tfc = o.tfc != null ? o.tfc : EXPLORE.tfc, m = o.mats || 0;
    var L = EXPLORE.labor, tp = EXPLORE.tp;
    var pt = ev('productTable', L, tp);
    var tvc = L.map(function(l, i){ return ev('add', ev('wageBill', w, l), ev('mul', m, tp[i])); });
    var tc = tvc.map(function(v){ return ev('totalCost', tfc, v); });
    var ct = ev('costTable', tp, tc, tfc);
    return { wage: w, mats: m, labor: L.slice(), tp: tp.slice(), mp: pt.mp, tfc: tfc, tvc: ct.tvc, tc: ct.tc, mc: ct.mc, afc: ct.afc, avc: ct.avc, atc: ct.atc };
  }
  function offsets(tfc, mats){
    var p = G().COST.firm, m = mats || 0;
    return { MC: M.round(m, 6), ATC: M.round(m + (tfc / 10 - p.F) / p.Fstep, 6) };
  }
  function minRow(col){
    var best = -1;
    for(var i = 1; i < col.length; i++) if(col[i] != null && (best < 0 || col[i] < col[best] - 1e-9)) best = i;
    return best;
  }

  /* ------------------------------------------------------------ firms */
  var FIRMS = [
    { what: 'ceramic mugs', one: 'mug' }, { what: 'skateboards', one: 'skateboard' }, { what: 'scented candles', one: 'candle' },
    { what: 'wool scarves', one: 'scarf' }, { what: 'bird feeders', one: 'bird feeder' }, { what: 'kelp bars', one: 'kelp bar' },
    { what: 'phone cases', one: 'phone case' }, { what: 'loaves of bread', one: 'loaf' }
  ];
  function money(x, d){ var s = M.fixed(x, d == null ? 2 : d); return (x < 0 ? '−$' + s.slice(1) : '$' + s); }
  function m0(x){ return Math.abs(x - Math.round(x)) < 1e-9 ? '$' + Math.round(x) : money(x); }

  /* ------------------------------------------------------------ steps */
  function num(key, label, answer, mistakes, d, practice, extra){
    var s = { key: key, kind: 'num', label: label, cell: M.cell(answer, 0.004, mistakes, 0.006), d: d == null ? 2 : d, unit: extra && extra.unit || '', practice: practice || '2.B', level: 'apply' };
    if(extra && extra.hint) s.hint = extra.hint;
    return s;
  }
  function choice(key, label, options, correct, why, practice, extra){
    var s = { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: practice || '2.A', level: 'apply' };
    for(var k in (extra || {})) s[k] = extra[k];
    return s;
  }
  function graphStep(key, label, spec, practice, okWhy){
    return { key: key, kind: 'graph', spec: spec, label: label, explain: okWhy, practice: practice || '4.A', level: 'apply' };
  }

  /* -------------------------------------------- an output-based table */
  /* Output rises by dq a row (never 1, so "divide by the change in output"
     matters); MC per unit is U-shaped (whole dollars), TFC a round number.
     Drawn until AVC and ATC each have one lowest row, the ATC one later. */
  function outputTable(r){
    for(var guard = 0; guard < 400; guard++){
      var dq = r.pick([5, 10, 20]), mmin = r.int(2, 6), k = r.int(1, 2), mc = [], i;
      // falling to the low point k, then rising faster
      for(i = 0; i < 6; i++) mc[i] = 0;
      mc[k] = mmin;
      for(i = k - 1; i >= 0; i--) mc[i] = mc[i + 1] + r.int(1, 3);
      for(i = k + 1; i < 6; i++) mc[i] = mc[i - 1] + r.int(1, 4) + (i > k + 2 ? 1 : 0);
      var tfc = r.pick([30, 40, 50, 60, 80, 100, 120]) * dq / 10;
      var q = [0], tc = [tfc];
      for(i = 0; i < 6; i++){ q.push(ev('mul', dq, i + 1)); tc.push(ev('add', tc[i], ev('mul', mc[i], dq))); }
      var t = ev('costTable', q, tc, tfc);
      var ra = minRow(t.avc), rt = minRow(t.atc);
      if(ra < 1 || rt <= ra || rt >= 6) continue;
      // one clear lowest row each (no near ties), so "the minimum" has one answer
      var gapA = t.avc.slice(1).filter(function(v, j){ return j + 1 !== ra; }).every(function(v){ return v - t.avc[ra] > 0.05; });
      var gapT = t.atc.slice(1).filter(function(v, j){ return j + 1 !== rt; }).every(function(v){ return v - t.atc[rt] > 0.05; });
      if(!gapA || !gapT) continue;
      return { q: q, tc: tc, tfc: tfc, dq: dq, t: t, minAvc: ra, minAtc: rt };
    }
    throw new Error('cost-lab: no output table');
  }
  /* A labor table: wage w, MP rising then falling (divisors of w, so MC is a
     whole number of dollars), output = total product. */
  var DIV = { 60: [3, 4, 5, 6, 10, 12, 15, 20, 30], 120: [4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40] };
  function laborTable(r){
    for(var guard = 0; guard < 400; guard++){
      var w = r.pick([60, 120]), d = DIV[w], n = 6, peak = r.int(1, 2), mp = [], i;
      var top = r.int(Math.max(peak + 1, 4), d.length - 1), j = top;
      mp[peak] = d[top];
      for(i = peak - 1; i >= 0; i--){ j = j - r.int(1, 2); if(j < 0) break; mp[i] = d[j]; }
      if(i >= 0) continue;
      j = top;
      for(i = peak + 1; i < n; i++){ j = j - r.int(1, 2); if(j < 0) break; mp[i] = d[j]; }
      if(i < n) continue;
      var L = [0], tp = [0];
      for(i = 0; i < n; i++){ L.push(i + 1); tp.push(ev('add', tp[i], mp[i])); }
      var tfc = r.pick([50, 60, 80, 100, 120, 150]);
      var tvc = L.map(function(l){ return ev('wageBill', w, l); }), tc = tvc.map(function(v){ return ev('totalCost', tfc, v); });
      var t = ev('costTable', tp, tc, tfc), pt = ev('productTable', L, tp);
      return { w: w, L: L, tp: tp, mp: pt.mp, tfc: tfc, t: t };
    }
    throw new Error('cost-lab: no labor table');
  }
  function tableHtml(cols, rows, caption, active){
    return '<table class="cl-qtable"><caption>' + caption + '</caption><thead><tr>' + cols.map(function(c){ return '<th scope="col"' + (c.cls ? ' class="' + c.cls + '"' : '') + '>' + c.h + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function(rw, i){ return '<tr' + (active != null && active.indexOf(i) > -1 ? ' class="is-ask"' : '') + '>' + rw.map(function(v, k){ return k ? '<td>' + v + '</td>' : '<th scope="row">' + v + '</th>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  var GSPEC = function(extra){ var s = { kind: 'costs' }; for(var k in extra) s[k] = extra[k]; return s; };

  /* --------------------------------------------- type: table (labor) */
  function genTable(r, ctx){
    var f = r.pick(FIRMS), T = laborTable(r), t = T.t, k = r.int(2, 5);
    var mp = T.mp[k], tvc = t.tvc[k], mc = t.mc[k], avc = t.avc[k];
    var rows = T.L.map(function(l, i){ return [String(l), String(T.tp[i])]; });
    return {
      type: 'table', ctx: ctx.id, topic: ctx.topic,
      text: '<p>A small firm makes ' + f.what + '. Each worker is paid <b>' + m0(T.w) + '</b> a day, and the firm’s fixed cost is <b>' + m0(T.tfc) + '</b> a day. The table shows how many ' + f.what + ' it makes a day (total product, TP) with each number of workers.</p>',
      figure: { table: tableHtml([{ h: 'Workers (L)' }, { h: 'Total product (TP)' }], rows, 'Workers and daily output', [k - 1, k]), spec: GSPEC({ do: ['point'], key: { point: { at: 'min-mc' } } }) },
      steps: [
        num('mp', 'What is the marginal product of worker ' + k + ' (the extra output that worker adds)?', mp, [
          { value: T.tp[k], why: 'That is total product with ' + k + ' workers. Marginal product is the change in TP: TP with ' + k + ' workers minus TP with ' + (k - 1) + '.' },
          { value: ev('averageProduct', T.tp[k], k), why: 'That is the average product (TP ÷ L). Marginal product is the change in TP from one more worker.' }
        ], 0, '2.B', { unit: f.what }),
        num('tvc', 'What is total variable cost (TVC) with ' + k + ' workers?', tvc, [
          { value: t.tc[k], why: 'That adds the fixed cost: it is total cost. Variable cost is only what changes with output, here the wages.' },
          { value: T.w, why: 'That is one worker’s wage. TVC is the wage times the number of workers.' }
        ], 0, '2.B', { unit: 'dollars' }),
        num('mc', 'What is the marginal cost of a ' + f.one + ' made by worker ' + k + '?', mc, [
          { value: T.w, why: 'You found the change in total cost but did not divide by the change in output. MC = ΔTC ÷ ΔQ, and output rose by ' + mp + ', not by 1.' },
          { value: ev('mul', T.w, mp), why: 'Divide the extra cost by the extra output; do not multiply. MC = ΔTC ÷ ΔQ.' },
          { value: avc, why: 'That is average variable cost (TVC ÷ Q). Marginal cost uses the changes: ΔTC ÷ ΔQ.' },
          { value: t.atc[k], why: 'That is average total cost (TC ÷ Q). Marginal cost uses the changes: ΔTC ÷ ΔQ.' }
        ], 2, '2.B', { unit: 'dollars', hint: 'MC = ΔTC ÷ ΔQ. Here the extra cost is one more worker’s wage.' }),
        num('avc', 'What is average variable cost (AVC) with ' + k + ' workers?', avc, [
          { value: t.atc[k], why: 'That includes the fixed cost: it is ATC. AVC = TVC ÷ Q.' },
          { value: ev('div', tvc, k), why: 'That divides by the number of workers. AVC is cost per unit of output: TVC ÷ Q, with Q = ' + T.tp[k] + '.' }
        ], 2, '2.B', { unit: 'dollars' }),
        graphStep('graph', 'Marginal cost falls while marginal product rises, then rises once marginal product falls (diminishing marginal returns). On this firm’s cost curves, tap the point where marginal cost is lowest.', GSPEC({ do: ['point'], key: { point: { at: 'min-mc' } } }), '4.A',
          'MC is lowest where marginal product is highest: after that, diminishing marginal returns set in, each worker adds less output, and each extra unit costs more.')
      ],
      solution: [
        'MP of worker ' + k + ' = ' + T.tp[k] + ' − ' + T.tp[k - 1] + ' = ' + mp + ' ' + f.what + '.',
        'TVC = wage × workers = ' + m0(T.w) + ' × ' + k + ' = ' + m0(tvc) + '.',
        'MC = ΔTC ÷ ΔQ = ' + m0(T.w) + ' ÷ ' + mp + ' = ' + money(mc) + ' a ' + f.one + '. (The fixed cost does not change, so ΔTC is one more wage.)',
        'AVC = TVC ÷ Q = ' + m0(tvc) + ' ÷ ' + T.tp[k] + ' = ' + money(avc) + '.',
        'Marginal cost is lowest where marginal product peaks; diminishing marginal returns make MC rise after that.'
      ],
      answer: { w: T.w, L: T.L, tp: T.tp, tfc: T.tfc, k: k, mp: mp, tvc: tvc, mc: mc, avc: avc }
    };
  }

  function outputRows(O){ var t = O.t; return O.q.map(function(q, i){ return [String(q), m0(O.tc[i])]; }); }

  /* --------------------------------------------- type: mc (output table) */
  function genMc(r, ctx){
    var f = r.pick(FIRMS), O = outputTable(r), t = O.t, k = r.int(2, 5);
    var mc = t.mc[k], atc = t.atc[k], afc = t.afc[k], dTC = ev('sub', O.tc[k], O.tc[k - 1]);
    var spec = GSPEC({ do: ['label'], afc: true });
    return {
      type: 'mc', ctx: ctx.id, topic: ctx.topic,
      text: '<p>A firm makes ' + f.what + '. The table gives its total cost (TC) a week at each output. At zero output its cost is all fixed cost.</p>',
      figure: { table: tableHtml([{ h: 'Output (Q)' }, { h: 'Total cost (TC)' }], outputRows(O), 'Weekly output and total cost', [k - 1, k]), spec: spec },
      steps: [
        num('tfc', 'What is the firm’s total fixed cost (TFC)?', O.tfc, [{ value: O.tc[6], why: 'That is total cost at the largest output. Fixed cost is the cost at zero output, which never changes.' }], 0, '2.B', { unit: 'dollars' }),
        num('mc', 'What is the marginal cost of a ' + f.one + ' when output rises from ' + O.q[k - 1] + ' to ' + O.q[k] + '?', mc, [
          { value: dTC, why: 'That is the change in total cost. Divide it by the change in output (' + O.dq + ' units): MC = ΔTC ÷ ΔQ.' },
          { value: atc, why: 'That is average total cost at ' + O.q[k] + ' units (TC ÷ Q). Marginal cost uses the changes: ΔTC ÷ ΔQ.' },
          { value: ev('div', dTC, O.q[k]), why: 'Divide by the change in output (' + O.dq + '), not by the output itself.' }
        ], 2, '2.B', { unit: 'dollars', hint: 'MC = ΔTC ÷ ΔQ.' }),
        num('atc', 'What is average total cost (ATC) at ' + O.q[k] + ' ' + f.what + '?', atc, [
          { value: t.avc[k], why: 'That leaves out the fixed cost: it is AVC. ATC = TC ÷ Q.' },
          { value: O.tc[k], why: 'That is total cost. Average total cost is cost per unit: TC ÷ Q.' }
        ], 2, '2.B', { unit: 'dollars' }),
        num('afc', 'What is average fixed cost (AFC) at ' + O.q[k] + ' ' + f.what + '?', afc, [
          { value: O.tfc, why: 'That is total fixed cost. AFC = TFC ÷ Q, which falls as output rises.' },
          { value: ev('sub', atc, mc), why: 'AFC is ATC minus AVC (or TFC ÷ Q), not ATC minus MC.' }
        ], 2, '2.B', { unit: 'dollars' }),
        graphStep('graph', 'Label the axes and every curve of a firm’s short-run cost graph.', spec, '4.A',
          'MC is the curve that crosses both AVC and ATC at their lowest points; AFC keeps falling as fixed cost spreads over more units, and the gap between ATC and AVC is AFC.')
      ],
      solution: [
        'TFC is the cost at zero output: ' + m0(O.tfc) + '.',
        'MC = ΔTC ÷ ΔQ = (' + m0(O.tc[k]) + ' − ' + m0(O.tc[k - 1]) + ') ÷ (' + O.q[k] + ' − ' + O.q[k - 1] + ') = ' + m0(dTC) + ' ÷ ' + O.dq + ' = ' + money(mc) + '.',
        'ATC = TC ÷ Q = ' + m0(O.tc[k]) + ' ÷ ' + O.q[k] + ' = ' + money(atc) + '.',
        'AFC = TFC ÷ Q = ' + m0(O.tfc) + ' ÷ ' + O.q[k] + ' = ' + money(afc) + '.',
        'On the graph: Cost on the vertical axis, Quantity of output on the horizontal; MC through the minimums of AVC and ATC; AFC falling throughout.'
      ],
      answer: { q: O.q, tc: O.tc, tfc: O.tfc, k: k, mc: mc, atc: atc, afc: afc }
    };
  }

  /* --------------------------------------------- type: min */
  function genMin(r, ctx){
    var f = r.pick(FIRMS), O = outputTable(r), t = O.t, ra = O.minAvc, rt = O.minAtc;
    var rows = O.q.map(function(q, i){ return [String(q), m0(O.tc[i]), i ? money(t.avc[i]) : '', i ? money(t.atc[i]) : '', i ? money(t.mc[i]) : '']; });
    var opts = ['MC is below ATC, so each extra unit pulls the average down', 'MC is above ATC, so each extra unit pulls the average down', 'MC equals ATC at every output up to the minimum', 'AFC is rising, so ATC falls'];
    var why = ['Right: when the marginal unit costs less than the average, it pulls the average down; once MC is above ATC, it pulls the average up. So MC crosses ATC at its minimum.',
      'A marginal unit that costs more than the average pulls the average up, not down.',
      'MC and ATC are equal only at one output: the bottom of ATC.',
      'AFC falls as output rises (the fixed cost is spread over more units).'];
    var spec = GSPEC({ do: ['point'], key: { point: { at: 'min-atc' } } });
    return {
      type: 'min', ctx: ctx.id, topic: ctx.topic,
      text: '<p>A firm makes ' + f.what + '. Its cost table is below: average variable cost (AVC), average total cost (ATC) and marginal cost (MC) for each output. MC is for the rise to that row from the row above.</p>',
      figure: { table: tableHtml([{ h: 'Q' }, { h: 'TC' }, { h: 'AVC', cls: 'cl-c-AVC' }, { h: 'ATC', cls: 'cl-c-ATC' }, { h: 'MC', cls: 'cl-c-MC' }], rows, 'Output, costs and averages'), spec: spec },
      steps: [
        num('qavc', 'At what output is average variable cost lowest?', O.q[ra], [{ value: O.q[minRow(t.mc)], why: 'That is where marginal cost is lowest. AVC keeps falling as long as MC is below it, so its minimum comes later.' }, { value: O.q[rt], why: 'That is where ATC is lowest. AVC bottoms out first: ATC still falls a while longer as fixed cost spreads.' }], 0, '2.A', { unit: 'units' }),
        num('qatc', 'At what output is average total cost lowest?', O.q[rt], [{ value: O.q[ra], why: 'That is the minimum of AVC. ATC bottoms out at a larger output, because AFC keeps falling.' }, { value: O.q[minRow(t.mc)], why: 'That is the minimum of MC. ATC is lowest where MC rises through it.' }], 0, '2.A', { unit: 'units' }),
        choice('why', 'Up to its lowest point, why does ATC fall?', opts, 0, why, '1.B'),
        graphStep('graph', 'On the firm’s cost curves, tap the point where marginal cost crosses average total cost.', spec, '4.A',
          'MC crosses ATC at the lowest point of ATC (and AVC at the lowest point of AVC): that is where the average stops falling and starts rising.')
      ],
      solution: [
        'Read down the AVC column: it is lowest, ' + money(t.avc[ra]) + ', at ' + O.q[ra] + ' units.',
        'Read down the ATC column: it is lowest, ' + money(t.atc[rt]) + ', at ' + O.q[rt] + ' units, a larger output than the AVC minimum.',
        'While MC is below an average it pulls the average down; once MC is above it, it pulls the average up. So MC crosses AVC and ATC at their minimums.'
      ],
      answer: { q: O.q, tc: O.tc, tfc: O.tfc, qavc: O.q[ra], qatc: O.q[rt] }
    };
  }

  /* --------------------------------------------- type: shutdown */
  function genShutdown(r, ctx){
    var f = r.pick(FIRMS), O = outputTable(r), t = O.t, ra = O.minAvc, rt = O.minAtc;
    var lo = t.avc[ra], hi = t.atc[rt], cse = r.pick(['shut', 'loss', 'profit']), P;
    for(var guard = 0; guard < 50; guard++){
      if(cse === 'shut') P = Math.max(1, Math.floor(lo) - r.int(0, 1));
      else if(cse === 'loss') P = Math.round((lo + hi) / 2);
      else P = Math.ceil(hi) + r.int(0, 2);
      if(cse === 'shut' && P < lo - 0.25) break;
      if(cse === 'loss' && P > lo + 0.25 && P < hi - 0.25) break;
      if(cse === 'profit' && P > hi + 0.25) break;
      cse = cse === 'loss' ? 'profit' : cse;
    }
    var rows = O.q.map(function(q, i){ return [String(q), i ? money(t.avc[i]) : '', i ? money(t.atc[i]) : '']; });
    var opts = ['Shut down now: the price is below the lowest AVC', 'Keep producing at a loss: the price covers AVC but not ATC', 'Keep producing and earn an economic profit: the price is above the lowest ATC'];
    var ci = cse === 'shut' ? 0 : cse === 'loss' ? 1 : 2;
    var why = [
      ci === 0 ? 'Right: below the lowest AVC, every unit loses more than its variable cost. Shutting down limits the loss to the fixed cost.' : 'The price is above the lowest AVC, so producing covers the variable cost and some of the fixed cost. Shutting down would lose all of the fixed cost.',
      ci === 1 ? 'Right: the price covers average variable cost, so each unit pays something toward the fixed cost. The firm loses less by producing than by shutting down (in the short run).' : ci === 0 ? 'The price is below the lowest AVC: producing does not even cover the wages and materials, so the firm loses more than its fixed cost.' : 'The price is above the lowest ATC, so the firm can earn a profit, not a loss.',
      ci === 2 ? 'Right: the price is above the minimum of ATC, so at the output where P = MC, price is above average total cost: an economic profit.' : 'An economic profit needs a price above the lowest ATC. Compare the price with the bottom of the ATC column.'
    ];
    var spec = GSPEC({ do: ['point'], key: { point: { at: 'min-avc' } } });
    return {
      type: 'shutdown', ctx: ctx.id, topic: ctx.topic,
      text: '<p>A price-taking firm makes ' + f.what + '. Its average costs are below. The market price is <b>' + m0(P) + '</b> a ' + f.one + '.</p>',
      figure: { table: tableHtml([{ h: 'Q' }, { h: 'AVC', cls: 'cl-c-AVC' }, { h: 'ATC', cls: 'cl-c-ATC' }], rows, 'Output and average costs'), spec: spec },
      steps: [
        num('shut', 'Below what price does this firm shut down in the short run?', lo, [{ value: hi, why: 'That is the lowest ATC, the break-even price. A firm keeps producing below it as long as the price covers AVC: the shutdown price is the minimum of AVC.' }], 2, '2.B', { unit: 'dollars' }),
        num('even', 'What is the break-even price (zero economic profit)?', hi, [{ value: lo, why: 'That is the lowest AVC, the shutdown price. Breaking even needs the price to cover all costs: the minimum of ATC.' }], 2, '2.B', { unit: 'dollars' }),
        choice('decide', 'At a price of ' + m0(P) + ', what does the firm do in the short run?', opts, ci, why, '2.A', { fixed: true }),
        graphStep('graph', 'On the firm’s cost curves, tap the shutdown point.', spec, '4.A',
          'The shutdown point is the minimum of AVC, where MC crosses AVC. Below that price the firm makes nothing; above it, it produces where P = MC.')
      ],
      solution: [
        'Shutdown price = the lowest AVC = ' + money(lo) + ' (at ' + O.q[ra] + ' units).',
        'Break-even price = the lowest ATC = ' + money(hi) + ' (at ' + O.q[rt] + ' units).',
        'At ' + m0(P) + ': ' + (ci === 0 ? 'below ' + money(lo) + ', so it shuts down and loses only its fixed cost, ' + m0(O.tfc) + '.' : ci === 1 ? 'between the two, so it keeps producing at a loss in the short run (it would lose its whole fixed cost, ' + m0(O.tfc) + ', by shutting down).' : 'above ' + money(hi) + ', so it earns an economic profit.')
      ],
      answer: { q: O.q, tc: O.tc, tfc: O.tfc, P: P, shut: lo, even: hi, decide: cse }
    };
  }

  /* --------------------------------------------- type: fixed */
  var LUMP = [
    { up: 1, text: 'The firm’s landlord raises its monthly rent by', because: 'a higher rent (a fixed cost)' },
    { up: 1, text: 'The town adds a yearly license fee, the same whatever the firm makes, of', because: 'a lump-sum fee (a fixed cost)' },
    { up: -1, text: 'The firm refinances a loan, cutting its fixed interest payment by', because: 'a lower fixed cost' },
    { up: 1, text: 'The firm buys insurance it must pay whatever it makes, costing', because: 'a higher fixed cost' }
  ];
  var PER = [
    { up: 1, text: 'The government puts a per-unit tax on each item the firm sells of', because: 'a per-unit tax (a variable cost)' },
    { up: 1, text: 'The price of the materials in each item rises by', because: 'a higher input price per unit (a variable cost)' },
    { up: -1, text: 'A cheaper supplier cuts the cost of the materials in each item by', because: 'cheaper materials (a lower variable cost)' }
  ];
  function genFixed(r, ctx){
    var f = r.pick(FIRMS), O = outputTable(r), t = O.t, lump = r() < 0.6, ch = lump ? r.pick(LUMP) : r.pick(PER), k = r.int(2, 5);
    var amt = lump ? r.pick([20, 30, 40, 60]) * O.dq / 10 : r.pick([1, 2, 3]);
    // A cut never takes a cost below zero: a fixed cost cut is at most half of TFC, a per-unit cut below the lowest MC.
    if(ch.up < 0 && lump) amt = Math.min(amt, O.tfc / 2);
    if(ch.up < 0 && !lump) amt = Math.min(amt, Math.min.apply(null, t.mc.slice(1)) - 1);
    var dir = ch.up > 0 ? 'up' : 'down';
    var shifts = lump ? [{ curve: 'ATC', dir: dir }] : [{ curve: 'MC', dir: dir }, { curve: 'ATC', dir: dir }];
    var spec = GSPEC({ do: ['shift'], movable: ['MC', 'ATC'], key: { shifts: shifts, because: ch.because },
      slips: lump ? { MC: 'A fixed cost is the same at every output, so it adds nothing to the cost of one more unit: MC (and AVC) stay put. Only ATC (and AFC) move.' } : {} });
    var newTfc = lump ? ev('add', O.tfc, ch.up * amt) : O.tfc;
    var newTc = O.tc.map(function(c, i){ return lump ? ev('add', c, ch.up * amt) : ev('add', c, ev('mul', ch.up * amt, O.q[i])); });
    var t2 = ev('costTable', O.q, newTc, newTfc);
    var mcOpts = ['MC is unchanged at every output', 'MC rises at every output', 'MC falls at every output', 'MC rises at low outputs and falls at high outputs'];
    var mcC = lump ? 0 : ch.up > 0 ? 1 : 2;
    var mcWhy = [
      lump ? 'Right: a fixed cost does not change with output, so the extra cost of one more unit is the same as before.' : 'A per-unit cost is paid on every extra unit, so the extra cost of one more unit changes by that amount.',
      !lump && ch.up > 0 ? 'Right: every extra unit now costs ' + m0(amt) + ' more, so MC rises by ' + m0(amt) + ' at every output.' : lump ? 'A fixed cost is the same at every output; it adds nothing to the cost of one more unit.' : 'The cost of each unit falls here, so MC falls.',
      !lump && ch.up < 0 ? 'Right: every extra unit now costs ' + m0(amt) + ' less, so MC falls by ' + m0(amt) + ' at every output.' : lump ? 'A fixed cost is the same at every output; it adds nothing to the cost of one more unit.' : 'The cost of each unit rises here, so MC rises.',
      'The change is the same for every unit (or for none), so it cannot move MC one way at some outputs and the other way at others.'
    ];
    var newAtc = t2.atc[k];
    return {
      type: 'fixed', ctx: ctx.id, topic: ctx.topic,
      text: '<p>A firm makes ' + f.what + '; its total cost table is below. ' + ch.text + ' <b>' + m0(amt) + '</b>' + (lump ? '.' : ' a ' + f.one + '.') + '</p>',
      figure: { table: tableHtml([{ h: 'Output (Q)' }, { h: 'Total cost (TC)' }], outputRows(O), 'Total cost before the change', [k]), spec: spec },
      steps: [
        choice('mc', 'What happens to the firm’s marginal cost?', mcOpts, mcC, mcWhy, '3.A'),
        graphStep('graph', 'Show the change on the firm’s cost curves: shift each curve that moves (AVC moves with MC, AFC with ATC).', spec, '4.C',
          lump ? 'A fixed cost moves ATC (and AFC) only: MC and AVC do not depend on fixed cost.' : 'A per-unit cost raises the cost of every unit: MC, AVC and ATC all shift ' + dir + ' by the amount per unit.'),
        num('atc', 'After the change, what is average total cost at ' + O.q[k] + ' ' + f.what + '?', newAtc, [
          { value: t.atc[k], why: 'That is ATC before the change. Add the change to total cost first, then divide by Q.' },
          lump ? { value: ev('add', t.atc[k], ch.up * amt), why: 'A fixed cost is spread over every unit: ATC changes by the fee ÷ Q, not by the whole fee.' } : { value: ev('add', t.atc[k], ch.up * amt * O.q[k]), why: 'The per-unit cost adds ' + m0(amt) + ' to the cost of each unit, so ATC changes by ' + m0(amt) + ', not by ' + m0(amt) + ' × Q.' }
        ], 2, '2.B', { unit: 'dollars' })
      ],
      solution: [
        lump ? 'The ' + (ch.up > 0 ? 'higher' : 'lower') + ' cost is fixed: the same at every output, so MC and AVC do not change.' : 'The cost is paid on every unit, so MC and AVC (and ATC) ' + (ch.up > 0 ? 'rise' : 'fall') + ' by ' + m0(amt) + ' at every output.',
        lump ? 'ATC = AVC + AFC, and AFC = TFC ÷ Q changes, so ATC (and AFC) shift ' + dir + ', MC still crossing the new ATC at its new minimum.' : 'MC and ATC both shift ' + dir + '; the new MC crosses the new ATC at its new minimum.',
        'New TC at ' + O.q[k] + ' units = ' + m0(newTc[k]) + ', so ATC = ' + m0(newTc[k]) + ' ÷ ' + O.q[k] + ' = ' + money(newAtc) + '.'
      ],
      answer: { q: O.q, tc: O.tc, tfc: O.tfc, k: k, lump: lump, up: ch.up, amt: amt, atc: newAtc }
    };
  }

  var GEN = { table: genTable, mc: genMc, min: genMin, shutdown: genShutdown, fixed: genFixed };
  var TYPES = ['table', 'mc', 'min', 'shutdown', 'fixed'];
  function generate(r, ctx, type){
    ctx = ctx || {};
    var ok = ctx.types && ctx.types.length ? ctx.types : TYPES;
    var t = type && ok.indexOf(type) > -1 ? type : r.pick(ok);
    return GEN[t](r, ctx);
  }

  M.register('costLab', { EXPLORE: EXPLORE, table: table, offsets: offsets, minRow: minRow, FIRMS: FIRMS, TYPES: TYPES, generate: generate, money: money, m0: m0,
    outputTable: outputTable, laborTable: laborTable });
})(typeof window !== 'undefined' ? window : globalThis);
