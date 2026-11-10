/* Externality Lab model: ApMicroMath.externalityLab (docs/apmicro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/apmicro-briefs/t4.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmicro-tool-checks/externality-lab.mjs) and the
   test (scripts/test/apmicro-tool-externality-lab.test.mjs) run exactly this code.

   Graphs are ApMicroGraph `externality` specs (D and S with slope -1 and +1,
   the social curve fixed `gap` steps away); numbers come from ApMicroCalc
   (dwl, triangle). A step on the graph is `qk` units of quantity and `pk`
   dollars, so the market quantity is 5 qk, the efficient one (5 -/+ gap/2) qk,
   the external cost or benefit per unit gap pk and the deadweight loss
   1/2 x (gap/2 qk) x (gap pk).

     KINDS                      the four externalities: which curve the policy
                                moves, which way, and its name (a tax or subsidy,
                                on producers or consumers)
     state(type, gap, t)        { market, efficient, dq, wedge, dwl } in graph units,
                                after a corrective policy of t steps (t = gap fixes it)
     specA(type, gap, t)        the picture: the private curve shifted by the policy
     specB(type, gap, t)        the picture as a shading spec (key: the deadweight loss
                                left after the policy; null when none). The engine shades
                                from the curves as shown, so this is specA with do shade.
     publicTable(people, mc)    a public good: sum of marginal benefits per unit and the
                                efficient number of units (the last whose sum is at least MC)
     generate(rng, ctx, type)   the drills:
       quantity  name the externality, place the efficient point, compare quantities
       dwl       shade the deadweight loss, its size, which way it points
       fix       the corrective tax or subsidy: which, how much per unit, the shift
       public    a public good: summed marginal benefit, the efficient quantity,
                 the free rider */
(function(root){
  'use strict';
  var M = root.ApMicroMath;
  if(!M) return;
  function C(){ return M.Calc(); }
  function E(fn, args){ return C().evaluate({ fn: fn, args: args }); }

  var KINDS = {
    'neg-prod': { name: 'negative production externality', curve: 'S', dir: -1, policy: 'a per-unit tax on producers', short: 'Tax on sellers', social: 'MSC', more: true, cost: true },
    'pos-prod': { name: 'positive production externality', curve: 'S', dir: 1, policy: 'a per-unit subsidy to producers', short: 'Subsidy to sellers', social: 'MSC', more: false, cost: false },
    'pos-cons': { name: 'positive consumption externality', curve: 'D', dir: 1, policy: 'a per-unit subsidy to consumers', short: 'Subsidy to buyers', social: 'MSB', more: false, cost: false },
    'neg-cons': { name: 'negative consumption externality', curve: 'D', dir: -1, policy: 'a per-unit tax on consumers', short: 'Tax on buyers', social: 'MSB', more: true, cost: true }
  };
  var FLIP = { 'neg-prod': 'pos-prod', 'pos-prod': 'neg-prod', 'pos-cons': 'neg-cons', 'neg-cons': 'pos-cons' };
  // In graph units: the market quantity after a policy of t steps, the efficient quantity, what is left.
  function state(type, gap, t){
    var K = KINDS[type], market = 5 + K.dir * (t || 0) / 2, efficient = 5 + (K.more ? -1 : 1) * gap / 2, left = Math.abs(gap - (t || 0));
    return { market: market, efficient: efficient, dq: Math.abs(market - efficient), wedge: left, dwl: E('dwl', [Math.abs(market - efficient), left]) };
  }
  function specA(type, gap, t, does){
    var K = KINDS[type], s = { kind: 'externality', ext: { type: type, gap: gap }, do: does || ['label'] };
    if(t){ s.show = {}; s.show[K.curve] = K.dir * t; }
    return s;
  }
  function specB(type, gap, t){
    // The picture itself, asked to shade: ApMicroGraph.areas follows the shown policy shift (integration 10).
    if(!(gap - (t || 0))) return null;
    var s = specA(type, gap, t, ['shade']); s.key = { shade: 'dwl' };
    return s;
  }

  /* --------------------------------------------- public goods */
  function publicTable(people, mc){
    var n = people[0].mb.length, rows = [];
    for(var u = 0; u < n; u++){ var sum = 0; people.forEach(function(p){ sum += p.mb[u]; }); rows.push({ unit: u + 1, mbs: people.map(function(p){ return p.mb[u]; }), sum: sum }); }
    var eff = E('hireCount', [rows.map(function(r){ return r.sum; }), mc]);
    var alone = people.map(function(p){ return E('hireCount', [p.mb, mc]); });
    return { rows: rows, efficient: eff, alone: alone };
  }
  var PEOPLE = [{ name: 'Ana', mb: [30, 22, 16, 10, 6] }, { name: 'Ben', mb: [24, 18, 12, 8, 4] }, { name: 'Cy', mb: [18, 14, 10, 6, 2] }];

  /* --------------------------------------------- drills */
  var TYPES = ['quantity', 'dwl', 'fix', 'public'];
  function money(v){ return '$' + M.fmt(v, 4); }
  function cell(a, mistakes){ return M.cell(a, 0.001, mistakes, 0.005); }
  function pickNum(r, ctx){ return { gap: r.int(1, 3), pk: r.pick(ctx.pk || [2, 4, 5]), qk: r.pick(ctx.qk || [10, 20]) }; }
  function nums(ctx, type, n){
    var s = state(type, n.gap, 0);
    return { Qm: s.market * n.qk, Qe: s.efficient * n.qk, ext: n.gap * n.pk, dwl: E('dwl', [s.dq * n.qk, n.gap * n.pk]), Pm: 5 * n.pk };
  }
  function story(ctx, n, v){
    var K = KINDS[ctx.ext];
    return '<p>' + ctx.story + ' Each ' + ctx.one + ' ' + (K.cost ? 'imposes an external cost' : 'gives an external benefit') + ' of ' + money(v.ext) + (K.cost ? ' on ' : ' to ') + ctx.who + '. Without any policy, the market sells ' + v.Qm + ' ' + ctx.unit + '.</p>';
  }
  var TYPE_OPTS = ['neg-prod', 'pos-prod', 'pos-cons', 'neg-cons'];
  function genQuantity(r, ctx){
    var n = pickNum(r, ctx), v = nums(ctx, ctx.ext, n), K = KINDS[ctx.ext], askMarket = r() < 0.3;
    var steps = [
      { key: 'type', kind: 'choice', practice: '1.B', label: 'What kind of externality is this?', options: TYPE_OPTS.map(function(t){ return cap(KINDS[t].name); }), fixed: true, correct: TYPE_OPTS.indexOf(ctx.ext),
        why: TYPE_OPTS.map(function(t){ var k = KINDS[t]; return (t === ctx.ext ? 'Right: ' : '') + 'A ' + k.name + ' means ' + (k.curve === 'S' ? 'producing' : 'using') + ' the good ' + (k.cost ? 'harms' : 'helps') + ' others, so ' + k.social + ' lies ' + (k.social === 'MSC' ? (k.cost ? 'above' : 'below') + ' supply (MPC)' : (k.cost ? 'below' : 'above') + ' demand (MPB)') + '.'; }) },
      { key: 'point', kind: 'graph', practice: '4.A', label: askMarket ? 'Place the point that shows the market outcome.' : 'Place the point that shows the socially efficient outcome.', spec: { kind: 'externality', ext: { type: ctx.ext, gap: n.gap }, do: ['point'], key: { point: { at: askMarket ? 'market' : 'efficient' } }, pointLabel: askMarket ? 'M' : 'E*' },
        explain: askMarket ? 'The market ignores the externality: it settles where D (MPB) meets S (MPC).' : 'Efficient: where ' + (K.social === 'MSB' ? 'MSB meets S (MPC = MSC)' : 'D (MPB = MSB) meets MSC') + '.' },
      { key: 'compare', kind: 'choice', practice: '2.B', level: 'analyze', label: 'Compare the market quantity with the efficient quantity.', correct: 0,
        options: ['The market makes ' + (K.more ? 'more' : 'less') + ' than is efficient (' + v.Qm + ' against ' + v.Qe + ' ' + ctx.unit + '): ' + (K.more ? 'overproduction' : 'underproduction') + '.', 'The market makes ' + (K.more ? 'less' : 'more') + ' than is efficient.', 'The market quantity is efficient, since buyers and sellers agree on it.', 'The market makes ' + (K.more ? 'more' : 'less') + ' than is efficient, at the quantity where MSB = MSC.'],
        why: ['Right: buyers and sellers ignore the ' + (K.cost ? 'cost' : 'benefit') + ' to ' + ctx.who + ', so they trade ' + (K.more ? 'too much' : 'too little') + '.', 'Backwards: an external ' + (K.cost ? 'cost' : 'benefit') + ' left out of the deal makes the market trade ' + (K.more ? 'too much' : 'too little') + '.', 'Agreement between buyer and seller leaves out ' + ctx.who + ': the market quantity is not efficient.', 'MSB = MSC is the efficient quantity, not the market one; the market is where MPB = MPC.'] }
    ];
    return { type: 'quantity', ctx: ctx.id, topic: ctx.topic, given: n, nums: v, text: story(ctx, n, v), steps: steps,
      solution: ['A ' + K.name + ': ' + K.social + ' lies ' + (K.social === 'MSC' ? (K.cost ? 'above' : 'below') + ' S = MPC' : (K.cost ? 'below' : 'above') + ' D = MPB') + ' by ' + money(v.ext) + ' a unit.', 'Market: MPB = MPC at ' + v.Qm + ' ' + ctx.unit + '. Efficient: MSB = MSC at ' + v.Qe + '.', 'So the market ' + (K.more ? 'overproduces' : 'underproduces') + ' by ' + Math.abs(v.Qm - v.Qe) + '.'] };
  }
  function genDwl(r, ctx){
    var n = pickNum(r, ctx), v = nums(ctx, ctx.ext, n), K = KINDS[ctx.ext], dq = Math.abs(v.Qm - v.Qe);
    var steps = [
      { key: 'shade', kind: 'graph', practice: '4.A', label: 'Shade the deadweight loss.', spec: { kind: 'externality', ext: { type: ctx.ext, gap: n.gap }, do: ['shade'], key: { shade: 'dwl' }, slips: { 'ext-cost': 'That is the whole external cost at the market quantity. The deadweight loss is only the triangle between the market and efficient quantities.', 'ext-benefit': 'That is the whole external benefit at the market quantity. The deadweight loss is only the triangle between the market and efficient quantities.' } },
        explain: 'The deadweight loss is the triangle between ' + (K.social === 'MSC' ? 'MSC and D' : 'MSB and S') + ', from the market quantity to the efficient one.' },
      { key: 'size', kind: 'num', practice: '3.A', label: 'How large is the deadweight loss?', unit: 'dollars', d: 2, cell: cell(v.dwl, [
        { value: dq * v.ext, why: 'That is the rectangle. A triangle is half of base times height: ½ × ' + dq + ' × ' + money(v.ext) + '.' },
        { value: E('triangle', [v.Qm, v.ext]), why: 'The base is the gap between the market and efficient quantities (' + dq + '), not the whole market quantity.' },
        { value: v.Qm * v.ext, why: 'That is the external ' + (K.cost ? 'cost' : 'benefit') + ' of every unit sold. The deadweight loss covers only the units between the two quantities, and it is a triangle.' }]) },
      { key: 'point', kind: 'choice', practice: '2.B', level: 'analyze', label: 'Which way does the deadweight loss triangle point?', correct: 0,
        options: ['Its tip is at the efficient quantity, ' + v.Qe + '; its base is at the market quantity, ' + v.Qm + '.', 'Its tip is at the market quantity, ' + v.Qm + '; its base is at the efficient quantity, ' + v.Qe + '.', 'It is a rectangle from zero to the market quantity.', 'It lies between demand and supply to the left of the market quantity.'],
        why: ['Right: the social and private curves meet at the efficient quantity, and the gap between them widens out to the market quantity, where the externality is ' + money(v.ext) + ' a unit.', 'The curves that bound it cross at the efficient quantity: that is where the tip is.', 'A rectangle would be the whole external ' + (K.cost ? 'cost' : 'benefit') + '; the loss is only the triangle between the two quantities.', 'Left of the market quantity buyers and sellers both gain; the loss is between the market and efficient quantities.'] }
    ];
    return { type: 'dwl', ctx: ctx.id, topic: ctx.topic, given: n, nums: v, text: story(ctx, n, v), steps: steps,
      solution: ['Efficient quantity: ' + v.Qe + '; market quantity: ' + v.Qm + '.', 'DWL = ½ × ' + dq + ' × ' + money(v.ext) + ' = ' + money(v.dwl) + '.', 'The triangle points toward the efficient quantity, where ' + (K.social === 'MSC' ? 'MSC meets D' : 'MSB meets S') + '.'] };
  }
  function genFix(r, ctx){
    var n = pickNum(r, ctx), v = nums(ctx, ctx.ext, n), K = KINDS[ctx.ext], pol = TYPE_OPTS.map(function(t){ return KINDS[t].policy; });
    var opts = ['A per-unit tax on producers', 'A per-unit subsidy to producers', 'A per-unit subsidy to consumers', 'A per-unit tax on consumers'];
    var steps = [
      { key: 'policy', kind: 'choice', practice: '2.B', label: 'Which policy, aimed at the side of the market that creates the externality, moves the market to the efficient quantity?', options: opts, fixed: true, correct: pol.indexOf(K.policy),
        why: opts.map(function(o, i){ var t = TYPE_OPTS[i]; return t === ctx.ext ? 'Right: it ' + (K.curve === 'S' ? 'shifts supply' : 'shifts demand') + ' ' + (K.dir < 0 ? 'left' : 'right') + ' until the private curve matches the social one.' : 'That ' + (KINDS[t].dir < 0 ? 'cuts' : 'raises') + ' the quantity' + (KINDS[t].dir === K.dir ? ', the right direction (a per-unit ' + (K.cost ? 'tax' : 'subsidy') + ' of the same size on either side would reach the efficient quantity), but the question asks for the side that creates the externality: the ' + (K.curve === 'S' ? 'producers' : 'consumers') + '.' : ', the wrong way: the market already makes ' + (K.more ? 'too much' : 'too little') + '.'); }) },
      { key: 'amount', kind: 'num', practice: '3.A', label: 'How large should it be per unit?', unit: 'dollars', cell: cell(v.ext, [{ value: v.Pm, why: 'That is the market price. The corrective tax or subsidy equals the external ' + (K.cost ? 'cost' : 'benefit') + ' per unit.' }, { value: v.dwl, why: 'That is the deadweight loss. The corrective amount is the external ' + (K.cost ? 'cost' : 'benefit') + ' per unit, the vertical gap between the curves.' }, { value: v.ext / 2, why: 'Use the whole vertical gap between the private and social curves.' }]) },
      { key: 'shift', kind: 'graph', practice: '4.B', label: 'Show the policy on the graph.', spec: { kind: 'externality', ext: { type: ctx.ext, gap: n.gap }, do: ['shift'], key: { shifts: [{ curve: K.curve, dir: K.dir < 0 ? 'left' : 'right', steps: n.gap }], because: K.policy, outcome: { quantity: K.dir < 0 ? 'down' : 'up' } },
        slips: K.curve === 'S' ? { D: 'The policy is on producers: it moves supply (their marginal private cost), not demand.' } : { S: 'The policy is on consumers: it moves demand (their marginal private benefit), not supply.' } },
        explain: cap(K.policy) + ' of ' + money(v.ext) + ' shifts ' + (K.curve === 'S' ? 'supply' : 'demand') + ' ' + (K.dir < 0 ? 'left' : 'right') + ' onto ' + K.social + ', so the market quantity becomes the efficient ' + v.Qe + '.' }
    ];
    return { type: 'fix', ctx: ctx.id, topic: ctx.topic, given: n, nums: v, text: story(ctx, n, v), steps: steps,
      solution: ['A ' + K.name + ': the market makes ' + (K.more ? 'too much' : 'too little') + '.', 'The fix (a Pigouvian ' + (K.cost ? 'tax' : 'subsidy') + '): ' + K.policy + ' equal to the external ' + (K.cost ? 'cost' : 'benefit') + ', ' + money(v.ext) + ' a unit.', 'It shifts ' + (K.curve === 'S' ? 'supply' : 'demand') + ' ' + (K.dir < 0 ? 'left' : 'right') + ' to ' + K.social + ', moving the quantity from ' + v.Qm + ' to ' + v.Qe + ' and removing the deadweight loss.'] };
  }
  function genPublic(r, ctx){
    for(var t = 0; t < 300; t++){
      var people = ctx.people.map(function(nm){ var v = 2 * r.int(9, 18), mb = []; for(var u = 0; u < 4; u++){ mb.push(v); v = Math.max(2, v - 2 * r.int(2, 5)); } return { name: nm, mb: mb }; });
      var mc = 2 * r.int(12, 30), tb = publicTable(people, mc);
      if(tb.efficient < 1 || tb.efficient > 3 || tb.alone.some(function(a){ return a > 0; }) && r() < 0.6) continue;
      var k = r.int(1, 4), sumK = tb.rows[k - 1].sum, maxAlone = Math.max.apply(null, tb.alone);
      if(maxAlone >= tb.efficient) continue;
      var steps = [
        { key: 'sum', kind: 'num', practice: '3.A', label: 'What is the marginal social benefit of unit ' + k + '?', unit: 'dollars', cell: cell(sumK, [{ value: tb.rows[k - 1].mbs[0], why: 'That is one person’s benefit. A public good is shared: everyone enjoys the same unit, so add the benefits of all three (a vertical sum).' }, { value: Math.max.apply(null, tb.rows[k - 1].mbs), why: 'Add every person’s benefit from the unit, not just the largest.' }]) },
        { key: 'eff', kind: 'num', practice: '3.B', level: 'analyze', label: 'How many ' + ctx.unit + ' are efficient?', unit: ctx.unit, cell: cell(tb.efficient, [{ value: maxAlone, why: 'That is what one person would buy alone, comparing only their own benefit with the cost. Compare the summed benefit with the cost.' }, { value: tb.rows.filter(function(x){ return x.sum > 0; }).length, why: 'Stop where the summed benefit falls below the marginal cost of ' + money(mc) + '.' }]) },
        { key: 'free', kind: 'choice', practice: '2.B', level: 'analyze', label: 'Why would a private seller provide fewer, if any?', correct: 0,
          options: ['It is nonexcludable: people can use it without paying, so each waits for others to pay (the free-rider problem).', 'It is rival: once one person uses it, the others cannot.', 'Its marginal cost is higher for a private seller than for the government.', 'People do not value it: the summed benefit is below the cost for every unit.'],
          why: ['Right: since no one can be kept from using it, few pay, so a private market underprovides it.', 'A public good is nonrival: one person’s use does not reduce what others get.', 'The cost is the same whoever pays; the problem is collecting payment.', 'The summed benefit covers the cost for ' + tb.efficient + ' ' + ctx.unit + ', so people do value them.'] }
      ];
      var cols = [ctx.unitOne].concat(people.map(function(p){ return p.name + '’s MB'; }));
      var html = '<table class="mic-data xl-qt"><caption>Marginal benefit of each ' + ctx.unitOne.toLowerCase() + ' to each resident (dollars)</caption><thead><tr>' + cols.map(function(c){ return '<th scope="col">' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
        tb.rows.map(function(x){ return '<tr><th scope="row">' + x.unit + '</th>' + x.mbs.map(function(m){ return '<td>' + money(m) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
      return { type: 'public', ctx: ctx.id, topic: ctx.topic, given: { people: people, mc: mc, k: k }, table: html,
        text: '<p>' + ctx.story + ' Each ' + ctx.unitOne.toLowerCase() + ' costs ' + money(mc) + ' to provide. The three residents are the only ones who benefit.</p>', steps: steps,
        solution: ['A public good is nonrival, so each unit serves everyone: marginal social benefit is the sum of the marginal benefits. Unit ' + k + ': ' + tb.rows[k - 1].mbs.map(money).join(' + ') + ' = ' + money(sumK) + '.',
          'Summed benefits: ' + tb.rows.map(function(x){ return money(x.sum); }).join(', ') + '. Provide units while the sum is at least ' + money(mc) + ': ' + tb.efficient + '.',
          'Alone, no one buys more than ' + maxAlone + ': each compares only their own benefit with the cost and hopes others pay (free riders).'] };
    }
    throw new Error('externality-lab: no public goods table');
  }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function generate(r, ctx, type){
    var t = type || r.pick(ctx.types && ctx.types.length ? ctx.types : TYPES);
    if(t === 'quantity') return genQuantity(r, ctx);
    if(t === 'dwl') return genDwl(r, ctx);
    if(t === 'fix') return genFix(r, ctx);
    if(t === 'public') return genPublic(r, ctx);
    throw new Error('externality-lab: unknown type ' + t);
  }

  M.register('externalityLab', { TYPES: TYPES, KINDS: KINDS, FLIP: FLIP, PEOPLE: PEOPLE, state: state, specA: specA, specB: specB, publicTable: publicTable, money: money, generate: generate });
})(typeof window !== 'undefined' ? window : globalThis);
