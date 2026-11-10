/* Game Theory Lab model: ApMicroMath.gameLab (docs/apmicro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/apmicro-briefs/t4.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmicro-tool-checks/game-lab.mjs) and the
   test (scripts/test/apmicro-tool-game-lab.test.mjs) run exactly this code.

   Every matrix fact (best responses, dominant strategies, Nash equilibria,
   the joint-payoff cell, a payoff change) comes from ApMicroMatrix; this file
   only chooses the games and writes the words.

     GAMES                    the Explore games (fixed payoffs, a story each)
     spec(game, change?)      an ApMicroMatrix spec for a game
     analyze(spec)            { dom: [i|null, i|null], comps: [[..], [..]], nash, joint, sums }
     test(spec, i, j)         would either player switch away from cell (i, j)?
                              { nash, moves: [{ player, to, from, gain }] }
     SHAPES                   dilemma, aligned, one, coord, none
     shapeOf(spec)            the shape a matrix has (or null)
     make(r, shape, ctx)      a random 2 x 2 game of that shape (no ties)
     generate(rng, ctx, type) the drills:
       dominant   mark each player's dominant strategy (or none), then pick
                  the argument that proves one of them: both comparisons
       nash       tap every Nash equilibrium (one, two or none), tap the
                  joint-payoff cell, then say whether the two are the same
       best       one player's best response to a given choice, the gain from
                  it, then each player's dominant strategy
       change     a per-unit tax or subsidy changes one player's payoffs: the
                  new payoff, every new Nash equilibrium, what moved */
(function(root){
  'use strict';
  var M = root.ApMicroMath;
  if(!M) return;
  function MX(){ return M.Matrix(); }

  var GAMES = [
    { id: 'price-war', name: 'Price war', short: 'Price war', shape: 'dilemma',
      story: 'Two airlines on one route each choose a low or a high fare. Payoffs are weekly profits in thousands of dollars.',
      players: [{ name: 'Alpha Air', strategies: ['Low fare', 'High fare'] }, { name: 'Beta Jet', strategies: ['Low fare', 'High fare'] }],
      payoffs: [[[30, 30], [70, 10]], [[10, 70], [50, 50]]], policy: { player: 0, strategy: 0 } },
    { id: 'ads', name: 'Advertising', short: 'Advertising', shape: 'one',
      story: 'Two soda makers decide whether to run a TV campaign. Payoffs are monthly profits in thousands of dollars.',
      players: [{ name: 'Fizzco', strategies: ['Advertise', 'Do not'] }, { name: 'Popwell', strategies: ['Advertise', 'Do not'] }],
      payoffs: [[[40, 25], [60, 20]], [[30, 35], [45, 40]]], policy: { player: 1, strategy: 0 } },
    { id: 'standard', name: 'Pick a standard', short: 'Standard', shape: 'coord',
      story: 'Two phone makers each pick a charging plug. Sales are best when both pick the same one. Payoffs are profits in millions of dollars.',
      players: [{ name: 'Northcell', strategies: ['Plug A', 'Plug B'] }, { name: 'Southtel', strategies: ['Plug A', 'Plug B'] }],
      payoffs: [[[50, 40], [10, 15]], [[20, 5], [40, 50]]], policy: { player: 0, strategy: 1 } },
    { id: 'chase', name: 'Sale week', short: 'Sale week', shape: 'none',
      story: 'A large store wants its sale in a different week from a rival; the rival wants the same week, to steal shoppers. Payoffs are profits in thousands of dollars.',
      players: [{ name: 'Mega Mart', strategies: ['Week 1', 'Week 2'] }, { name: 'Shop Hub', strategies: ['Week 1', 'Week 2'] }],
      payoffs: [[[20, 45], [50, 15]], [[55, 10], [25, 40]]], policy: { player: 0, strategy: 0 } }
  ];
  function gameOf(id){ return GAMES.filter(function(g){ return g.id === id; })[0] || GAMES[0]; }
  function copyP(P){ return P.map(function(r){ return r.map(function(c){ return [c[0], c[1]]; }); }); }
  function spec(g, change, does){
    var s = { players: [{ name: g.players[0].name, strategies: g.players[0].strategies.slice() }, { name: g.players[1].name, strategies: g.players[1].strategies.slice() }],
      payoffs: copyP(g.payoffs), do: does || ['nash'] };
    if(g.unit) s.unit = g.unit;
    if(change && change.amount) s.change = { player: change.player, strategy: change.strategy == null ? null : change.strategy, amount: change.amount };
    return s;
  }
  function analyze(s){
    var X = MX(), P = X.payoffs(s);
    return { P: P, dom: [X.dominant(s, 0), X.dominant(s, 1)], comps: [X.comparisons(s, 0), X.comparisons(s, 1)], nash: X.nash(s), joint: X.joint(s),
      best: [[0, 1].map(function(o){ return X.best(s, 0, o); }), [0, 1].map(function(o){ return X.best(s, 1, o); })],
      sums: P.map(function(r){ return r.map(function(c){ return c[0] + c[1]; }); }) };
  }
  // Would a player switch away from (i, j)? A move is one player alone switching to a better strategy.
  function test(s, i, j){
    var X = MX(), P = X.payoffs(s), moves = [];
    var b0 = X.best(s, 0, j)[0], b1 = X.best(s, 1, i)[0];
    if(b0 !== i) moves.push({ player: 0, from: i, to: b0, got: P[i][j][0], gain: P[b0][j][0] });
    if(b1 !== j) moves.push({ player: 1, from: j, to: b1, got: P[i][j][1], gain: P[i][b1][1] });
    return { nash: !moves.length, moves: moves };
  }
  function cellName(s, c){ return '(' + s.players[0].strategies[c[0]] + ', ' + s.players[1].strategies[c[1]] + ')'; }
  function same(a, b){ return a[0] === b[0] && a[1] === b[1]; }

  /* ------------------------------------------------------------ shapes */
  var SHAPES = ['dilemma', 'aligned', 'one', 'coord', 'none'];
  function shapeOf(s){
    var X = MX();
    if(X.check(Object.assign({}, s, { do: ['nash'] })).length) return null;
    var d0 = X.dominant(s, 0), d1 = X.dominant(s, 1), n = X.nash(s), j = X.joint(s);
    if(j.length !== 1) return null;
    if(d0 != null && d1 != null) return same(n[0], j[0]) ? 'aligned' : 'dilemma';
    if(d0 != null || d1 != null) return n.length === 1 ? 'one' : null;
    if(n.length === 2) return 'coord';
    if(!n.length) return 'none';
    return null;
  }
  var VALUES = []; for(var v = 5; v <= 90; v += 5) VALUES.push(v);
  function make(r, shape, ctx){
    for(var t = 0; t < 4000; t++){
      var P = [[[r.pick(VALUES), r.pick(VALUES)], [r.pick(VALUES), r.pick(VALUES)]], [[r.pick(VALUES), r.pick(VALUES)], [r.pick(VALUES), r.pick(VALUES)]]];
      var s = { players: ctx.players.map(function(p){ return { name: p.name, strategies: p.strategies.slice() }; }), payoffs: P, do: ['nash'] };
      if(shapeOf(s) === shape) return s;
    }
    throw new Error('game-lab: no ' + shape + ' game found');
  }
  function with_(s, does, extra){ var o = { players: s.players, payoffs: copyP(s.payoffs), do: does }; for(var k in extra || {}) o[k] = extra[k]; if(s.change && !(extra && 'change' in extra)) o.change = s.change; return o; }

  /* ------------------------------------------------------------ words */
  function money(v){ return String(v); }
  function cmpLine(s, p, o){
    var P = MX().payoffs(s), me = s.players[p], other = s.players[1 - p], pay = function(st){ return p === 0 ? P[st][o][0] : P[o][st][1]; };
    var b = pay(0) > pay(1) ? 0 : 1;
    return 'if ' + other.name + ' chooses ' + other.strategies[o] + ', ' + me.name + ' earns ' + money(pay(b)) + ' from ' + me.strategies[b] + ' and ' + money(pay(1 - b)) + ' from ' + me.strategies[1 - b];
  }
  function bestOf(s, p, o){ return MX().best(s, p, o)[0]; }
  function verdict(s, p){
    var d = MX().dominant(s, p), me = s.players[p];
    return d == null ? me.name + ' has no dominant strategy: its better choice depends on what the other firm does' : me.name + "'s dominant strategy is " + me.strategies[d];
  }
  function proof(s, p){ return cap(cmpLine(s, p, 0)) + '; ' + cmpLine(s, p, 1) + '. So ' + verdict(s, p) + '.'; }
  function cap(t){ return t.charAt(0).toUpperCase() + t.slice(1); }

  /* Choice options: the right argument and the three slips readers report. */
  function proofStep(r, s, p){
    var P = MX().payoffs(s), me = s.players[p], other = s.players[1 - p], d = MX().dominant(s, p);
    var o1 = r.int(0, 1), b1 = bestOf(s, p, o1);
    var pay = function(st, o){ return p === 0 ? P[st][o][0] : P[o][st][1]; };
    // The single largest payoff this player can get, and its row or column.
    var top = -1, topS = 0; [0, 1].forEach(function(st){ [0, 1].forEach(function(o){ if(pay(st, o) > top){ top = pay(st, o); topS = st; } }); });
    var right = proof(s, p);
    var one = cap(cmpLine(s, p, o1)) + '. So ' + me.name + "'s dominant strategy is " + me.strategies[b1] + '.';
    var big = 'The largest payoff ' + me.name + ' can earn, ' + money(top) + ', comes from ' + me.strategies[topS] + ', so ' + me.strategies[topS] + ' is its dominant strategy.';
    var oth = s.players[1 - p], ob = bestOf(s, 1 - p, 0);
    var across = 'In (' + (p === 0 ? me.strategies[b1] + ', ' + other.strategies[o1] : other.strategies[o1] + ', ' + me.strategies[b1]) + ') ' + me.name + ' earns ' + money(pay(b1, o1)) + ' and ' + other.name + ' earns ' + money(p === 0 ? P[b1][o1][1] : P[o1][b1][0]) + ', so ' + me.name + ' does better there and ' + me.strategies[b1] + ' is dominant.';
    void oth; void ob;
    var opts = [right, one, big, across], why = [
      'Right: one comparison for each choice the other firm can make, with the numbers, then the conclusion. ' + (d == null ? 'The two comparisons point to different strategies, so there is no dominant strategy.' : 'Both point to ' + me.strategies[d] + '.'),
      'One comparison is not enough: a dominant strategy must be better whatever the other firm does, so readers want the comparison for each of its choices. ' + right,
      'The largest single payoff does not make a strategy dominant: it has to win the comparison against every choice of the other firm. ' + right,
      'Compare one firm’s own payoffs, holding the other firm’s choice fixed; comparing the two firms’ payoffs in one cell says nothing about a strategy. ' + right
    ];
    // A shape where a slip happens to state a true conclusion stays wrong for its reasoning, but its words must differ.
    var seen = {}, keep = [];
    opts.forEach(function(t, i){ if(!seen[t]){ seen[t] = 1; keep.push(i); } });
    return { options: keep.map(function(i){ return opts[i]; }), why: keep.map(function(i){ return why[i]; }), correct: 0 };
  }

  /* ------------------------------------------------------------ drills */
  var TYPES = ['dominant', 'nash', 'best', 'change'];
  var SHAPES_FOR = { dominant: ['dilemma', 'one', 'coord', 'aligned', 'dilemma', 'one'], nash: ['dilemma', 'coord', 'none', 'one', 'coord', 'dilemma'], best: ['dilemma', 'one', 'coord', 'aligned'], change: ['dilemma', 'one', 'aligned'] };
  function intro(ctx, s){ return '<p>' + ctx.story + ' ' + s.players[0].name + ' chooses the row; in each cell its payoff is listed first.</p>'; }
  function genDominant(r, ctx){
    var s = make(r, r.pick(SHAPES_FOR.dominant), ctx), p = r.int(0, 1), pf = proofStep(r, s, p);
    var steps = [
      { key: 'dominant', kind: 'matrix', practice: '4.A', label: 'Mark each firm’s dominant strategy, or No dominant strategy.', spec: with_(s, ['dominant']),
        explain: proof(s, 0) + ' ' + proof(s, 1) },
      { key: 'proof', kind: 'choice', practice: '2.B', level: 'analyze', label: 'Which argument proves your answer for ' + s.players[p].name + ' the way a reader scores it?', options: pf.options, why: pf.why, correct: pf.correct }
    ];
    return { type: 'dominant', ctx: ctx.id, topic: ctx.topic, text: intro(ctx, s) + '<p>Does either firm have a dominant strategy?</p>', matrix: s, steps: steps,
      solution: [proof(s, 0), proof(s, 1), 'A dominant strategy is proved with both comparisons, one for each choice of the other firm, and the numbers.'] };
  }
  function nashWords(s, list){ return !list.length ? 'no cell is a Nash equilibrium in pure strategies' : list.length === 1 ? 'the Nash equilibrium is ' + cellName(s, list[0]) : 'there are two Nash equilibria, ' + cellName(s, list[0]) + ' and ' + cellName(s, list[1]); }
  function genNash(r, ctx){
    var s = make(r, r.pick(SHAPES_FOR.nash), ctx), A = analyze(s), j = A.joint[0], isN = A.nash.some(function(c){ return same(c, j); });
    var t = test(s, j[0], j[1]), mv = t.moves[0];
    var yes = 'Yes: the cell with the largest combined payoff, ' + cellName(s, j) + ', is a Nash equilibrium: neither firm gains by switching alone.';
    var no = mv ? 'No: at ' + cellName(s, j) + ', ' + s.players[mv.player].name + ' would switch to ' + s.players[mv.player].strategies[mv.to] + ' (' + mv.gain + ' instead of ' + mv.got + '), so the firms do not stay there.' : '';
    var dom = 'No: a Nash equilibrium needs both firms to have a dominant strategy, so only a cell where both play them counts.';
    var sum = 'Yes: a Nash equilibrium is always the cell where the two payoffs add up to the most.';
    var opts = isN ? [yes, dom, 'No: at ' + cellName(s, j) + ' each firm would rather switch, so the firms do not stay there.', 'No: a Nash equilibrium is never the cell with the largest combined payoff, since each firm looks only at its own payoff.'] : [no, yes, dom, sum];
    var why = isN ? ['Right: here the best joint outcome is also stable, since neither firm gains by switching alone.', 'Wrong: a Nash equilibrium needs only that neither player gains by switching alone; dominant strategies are not required (a coordination game has two equilibria and no dominant strategy).', 'Check each firm in that cell: neither earns more by switching alone, so it is an equilibrium.', 'Wrong: a Nash equilibrium can be the joint-payoff cell, as here; nothing rules that out.']
      : ['Right: each firm looks only at its own payoff, so the joint best is not stable when one firm gains by switching alone.', 'Wrong: in ' + cellName(s, j) + ' a firm gains by switching alone, so it is not an equilibrium.', 'Wrong: a Nash equilibrium needs only that neither player gains by switching alone; dominant strategies are not required.', 'Wrong: the largest combined payoff is the joint best, not the equilibrium; each firm compares only its own payoffs.'];
    var steps = [
      { key: 'nash', kind: 'matrix', practice: '4.A', label: 'Tap every Nash equilibrium (or tick No cell is a Nash equilibrium).', spec: with_(s, ['nash']), explain: cap(nashWords(s, A.nash)) + '.' },
      { key: 'joint', kind: 'matrix', practice: '4.A', label: 'Now tap the cell with the largest combined payoff.', spec: with_(s, ['joint']), explain: cellName(s, j) + ' adds to ' + A.sums[j[0]][j[1]] + ', the most.' },
      { key: 'stable', kind: 'choice', practice: '2.B', level: 'analyze', label: 'Do the firms end up in the cell with the largest combined payoff?', options: opts, why: why, correct: 0 }
    ];
    var sol = [];
    for(var i = 0; i < 2; i++) for(var k = 0; k < 2; k++){ var tt = test(s, i, k); sol.push(cellName(s, [i, k]) + ': ' + (tt.nash ? 'neither firm gains by switching alone, so it is a Nash equilibrium.' : tt.moves.map(function(m){ return s.players[m.player].name + ' would switch to ' + s.players[m.player].strategies[m.to] + ' (' + m.gain + ' instead of ' + m.got + ')'; }).join('; ') + '.')); }
    sol.push('So ' + nashWords(s, A.nash) + '. The largest combined payoff is ' + cellName(s, j) + ', ' + A.sums[j[0]][j[1]] + '.');
    return { type: 'nash', ctx: ctx.id, topic: ctx.topic, text: intro(ctx, s) + '<p>Test every cell: would either firm switch alone?</p>', matrix: s, steps: steps, solution: sol };
  }
  function genBest(r, ctx){
    var s = make(r, r.pick(SHAPES_FOR.best), ctx), p = r.int(0, 1), o = r.int(0, 1), P = MX().payoffs(s), b = bestOf(s, p, o);
    var pay = function(st){ return p === 0 ? P[st][o][0] : P[o][st][1]; }, oth = function(st){ return p === 0 ? P[st][o][1] : P[o][st][0]; };
    var gain = pay(b) - pay(1 - b), me = s.players[p], other = s.players[1 - p];
    var mistakes = [
      { value: oth(b) - oth(1 - b), why: 'That compares ' + other.name + '’s payoffs. Hold ' + other.name + '’s choice fixed and compare ' + me.name + '’s own two payoffs.' },
      { value: pay(b) + oth(b) - pay(1 - b) - oth(1 - b), why: 'That compares the combined payoffs. A best response uses only the player’s own payoff.' },
      { value: pay(b), why: 'That is the payoff itself. The gain is the difference between the two payoffs.' }
    ];
    var steps = [
      { key: 'best', kind: 'matrix', practice: '4.A', label: 'Choose ' + me.name + '’s best response if ' + other.name + ' chooses ' + other.strategies[o] + '.', spec: with_(s, ['best'], { ask: { best: { player: p, given: o } } }), explain: cap(cmpLine(s, p, o)) + '.' },
      { key: 'gain', kind: 'num', practice: '3.A', label: 'How much more does ' + me.name + ' earn from that best response than from its other choice (thousands of dollars)?', cell: M.cell(gain, 0.001, mistakes, 0.01), unit: 'thousand dollars' },
      { key: 'dominant', kind: 'matrix', practice: '4.A', label: 'Now mark each firm’s dominant strategy, or No dominant strategy.', spec: with_(s, ['dominant']), explain: proof(s, 0) + ' ' + proof(s, 1) }
    ];
    return { type: 'best', ctx: ctx.id, topic: ctx.topic, text: intro(ctx, s) + '<p>Hold ' + other.name + '’s choice fixed at ' + other.strategies[o] + ' and compare.</p>', matrix: s, steps: steps,
      solution: [cap(cmpLine(s, p, o)) + ', so its best response is ' + me.strategies[b] + ', a gain of ' + pay(b) + ' − ' + pay(1 - b) + ' = ' + gain + '.', proof(s, 0), proof(s, 1)] };
  }
  function changeWords(s0, s1){
    var a = MX().nash(s0), b = MX().nash(s1), sameSet = a.length === b.length && a.every(function(c){ return b.some(function(d){ return same(c, d); }); });
    if(sameSet) return 'The Nash equilibrium stays at ' + cellName(s0, a[0]) + '.';
    if(!b.length) return 'No cell is a Nash equilibrium any more.';
    if(b.length === 1) return 'The Nash equilibrium moves from ' + cellName(s0, a[0]) + ' to ' + cellName(s0, b[0]) + '.';
    return 'There are now two Nash equilibria, ' + cellName(s0, b[0]) + ' and ' + cellName(s0, b[1]) + '.';
  }
  function genChange(r, ctx){
    for(var t = 0; t < 400; t++){
      var s = make(r, r.pick(SHAPES_FOR.change), ctx), p = r.int(0, 1), d = MX().dominant(s, p);
      var k = d != null && r() < 0.8 ? d : r.int(0, 1), tax = r() < 0.75, amt = 5 * r.int(2, 8) * (tax ? -1 : 1);
      var s1 = with_(s, ['nash'], { change: { player: p, strategy: k, amount: amt } });
      if(MX().check(s1).length) continue;
      var moved = changeWords(s, s1).indexOf('stays') < 0;
      if(!moved && r() < 0.7) continue;
      var o = r.int(0, 1), P0 = MX().payoffs(s), cell = p === 0 ? [k, o] : [o, k], old = P0[cell[0]][cell[1]][p], nw = old + amt, otherOld = P0[cell[0]][cell[1]][1 - p];
      var me = s.players[p];
      var mistakes = [
        { value: old, why: 'That is the payoff before the ' + (tax ? 'tax' : 'subsidy') + '. ' + (tax ? 'Subtract' : 'Add') + ' ' + Math.abs(amt) + ' from ' + me.name + '’s payoff.' },
        { value: old - amt, why: 'The ' + (tax ? 'tax lowers' : 'subsidy raises') + ' the payoff: ' + old + (tax ? ' − ' : ' + ') + Math.abs(amt) + '.' },
        { value: otherOld + amt, why: 'That changes the other firm’s payoff. Only ' + me.name + '’s payoff changes.' }
      ];
      var right = changeWords(s, s1), cands = [];
      var a0 = MX().nash(s)[0];
      cands.push('The Nash equilibrium stays at ' + cellName(s, a0) + '.');
      for(var i = 0; i < 2; i++) for(var j = 0; j < 2; j++) if(!same([i, j], a0)) cands.push('The Nash equilibrium moves from ' + cellName(s, a0) + ' to ' + cellName(s, [i, j]) + '.');
      cands.push('No cell is a Nash equilibrium any more.');
      var wrong = M.shuffle(r, cands.filter(function(c){ return c !== right; })).slice(0, 3);
      var A1 = analyze(s1);
      var steps = [
        { key: 'payoff', kind: 'num', practice: '3.A', label: 'What is ' + me.name + '’s payoff in ' + cellName(s, cell) + ' after the ' + (tax ? 'tax' : 'subsidy') + ' (thousands of dollars)?', cell: M.cell(nw, 0.001, mistakes, 0.01), unit: 'thousand dollars' },
        { key: 'nash', kind: 'matrix', practice: '4.A', label: 'The matrix now shows the payoffs after the ' + (tax ? 'tax' : 'subsidy') + '. Tap every Nash equilibrium.', spec: s1, explain: cap(nashWords(s1, A1.nash)) + '.' },
        { key: 'moved', kind: 'choice', practice: '2.B', level: 'analyze', label: 'What did the ' + (tax ? 'tax' : 'subsidy') + ' do?', options: [right].concat(wrong),
          why: [right + ' ' + proof(s1, p)].concat(wrong.map(function(){ return 'Test each cell of the new matrix: ' + cap(nashWords(s1, A1.nash)) + '.'; })), correct: 0 }
      ];
      return { type: 'change', ctx: ctx.id, topic: ctx.topic,
        text: intro(ctx, s) + '<p>The government ' + (tax ? 'taxes' : 'subsidizes') + ' ' + me.name + ' ' + Math.abs(amt) + ' thousand dollars whenever it chooses ' + me.strategies[k] + '.</p>',
        matrix: s, after: s1, change: { player: p, strategy: k, amount: amt }, steps: steps,
        solution: ['Only ' + me.name + '’s payoffs change, and only when it chooses ' + me.strategies[k] + ': ' + old + (tax ? ' − ' : ' + ') + Math.abs(amt) + ' = ' + nw + ' in ' + cellName(s, cell) + '.', 'Before: ' + nashWords(s, MX().nash(s)) + '. After: ' + nashWords(s1, A1.nash) + '.', proof(s1, p)] };
    }
    throw new Error('game-lab: no change problem found');
  }
  function generate(r, ctx, type){
    var t = type || r.pick((ctx.types && ctx.types.length ? ctx.types : TYPES));
    if(t === 'dominant') return genDominant(r, ctx);
    if(t === 'nash') return genNash(r, ctx);
    if(t === 'best') return genBest(r, ctx);
    if(t === 'change') return genChange(r, ctx);
    throw new Error('game-lab: unknown type ' + t);
  }

  M.register('gameLab', { TYPES: TYPES, GAMES: GAMES, SHAPES: SHAPES, gameOf: gameOf, spec: spec, analyze: analyze, test: test, cellName: cellName,
    shapeOf: shapeOf, make: make, proof: proof, verdict: verdict, cmpLine: cmpLine, changeWords: changeWords, nashWords: nashWords, generate: generate });
})(typeof window !== 'undefined' ? window : globalThis);
