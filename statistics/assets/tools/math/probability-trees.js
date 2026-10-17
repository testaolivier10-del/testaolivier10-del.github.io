/* Probability trees model: ApStatMath.probabilityTrees (docs/apstat-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apstat-tool-checks/probability-trees.mjs) and the test
   (scripts/test/apstat-tool-probability-trees.test.mjs) run exactly this code.

   Explore
     joint(pA, pBgA, pBgNA) -> { AB, AnB, nAB, nAnB, A, B, nA, nB, AorB,
       BgA, AgB, BgnA, AgnB, indep }: every probability of two events from the
       tree's three numbers (multiplication rule on each path, addition over
       paths, conditional = joint / marginal)
     QS[q] -> { num: [cells], den: [cells] | null }: which outcomes a question
       counts (numerator) and which it is limited to (the slice, denominator)
     value(J, q), venn(pA, pB, pAB, box) -> { rA, rB, d, ... }: two circles
       whose areas are in proportion to P(A) and P(B), overlapping in
       P(A and B) (circle intersection solved by bisection)
     simulate(r, J, k) -> k outcomes ('AB' | 'AnB' | 'nAB' | 'nAnB')
     estimate(outcomes, q, upto) -> the relative frequency of q in the first
       upto trials (conditional: within the slice)
   Test yourself
     generate(r, ctx, type) -> { ctx, topic, type, text, steps, solution, figure }
       types: tree (P(A and B), P(B), then the reversed conditional P(A | B)),
       table (from two-way counts: P(A), P(A and B), P(A or B), P(B | A) and
       an independence check), rules (addition rule, mutually exclusive,
       independent from P(A), P(B), P(A and B))
   Probabilities are shown and keyed to 4 decimal places. */
(function(){
  'use strict';
  var M = window.ApStatMath;
  if(!M) return;

  var CELLS = ['AB', 'AnB', 'nAB', 'nAnB'];
  var QS = {
    A: { num: ['AB', 'AnB'], den: null }, B: { num: ['AB', 'nAB'], den: null },
    nA: { num: ['nAB', 'nAnB'], den: null }, nB: { num: ['AnB', 'nAnB'], den: null },
    AB: { num: ['AB'], den: null }, AorB: { num: ['AB', 'AnB', 'nAB'], den: null },
    AnB: { num: ['AnB'], den: null }, nAB: { num: ['nAB'], den: null }, nAnB: { num: ['nAnB'], den: null },
    BgA: { num: ['AB'], den: ['AB', 'AnB'] }, AgB: { num: ['AB'], den: ['AB', 'nAB'] },
    BgnA: { num: ['nAB'], den: ['nAB', 'nAnB'] }, AgnB: { num: ['AnB'], den: ['AnB', 'nAnB'] }
  };

  function joint(pA, pBgA, pBgNA){
    var J = { AB: pA * pBgA, AnB: pA * (1 - pBgA), nAB: (1 - pA) * pBgNA, nAnB: (1 - pA) * (1 - pBgNA) };
    J.A = pA; J.nA = 1 - pA; J.B = J.AB + J.nAB; J.nB = 1 - J.B;
    J.AorB = J.A + J.B - J.AB;
    J.BgA = pBgA; J.BgnA = pBgNA;
    J.AgB = J.B > 0 ? J.AB / J.B : NaN; J.AgnB = J.nB > 0 ? J.AnB / J.nB : NaN;
    J.indep = Math.abs(pBgA - pBgNA) < 1e-9;
    return J;
  }
  function value(J, q){
    var Q = QS[q], n = 0, d = 0;
    Q.num.forEach(function(c){ n += J[c]; });
    if(!Q.den) return n;
    Q.den.forEach(function(c){ d += J[c]; });
    return d > 0 ? n / d : NaN;
  }

  /* ---------------------------------------------------------- Venn */
  function lens(r1, r2, d){
    if(d >= r1 + r2) return 0;
    if(d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) * Math.min(r1, r2);
    var a = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1)), b = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
    return a + b - 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
  }
  /* box: { w, h } the sample space; circle areas = p * w * h when they fit
     (scale 1), else every area is scaled down by the same factor. */
  function venn(pA, pB, pAB, box){
    var area = box.w * box.h, s = 1, rA, rB;
    for(var k = 0; k < 40; k++){
      rA = Math.sqrt(pA * area * s / Math.PI); rB = Math.sqrt(pB * area * s / Math.PI);
      if(2 * Math.max(rA, rB) <= 0.92 * box.h && rA + rB <= 0.92 * box.w) break;
      s *= 0.92;
    }
    var target = pAB * area * s, lo = Math.abs(rA - rB), hi = rA + rB, d;
    if(target <= 1e-12) d = hi + Math.min(rA, rB) * 0.25;
    else if(target >= lens(rA, rB, lo) - 1e-9) d = lo;
    else { for(var j = 0; j < 80; j++){ d = (lo + hi) / 2; if(lens(rA, rB, d) > target) lo = d; else hi = d; } d = (lo + hi) / 2; }
    return { rA: rA, rB: rB, d: d, scale: s, overlap: lens(rA, rB, d) / (area * s) };
  }

  /* ---------------------------------------------------- simulation */
  function simulate(r, J, k){
    var out = [];
    for(var i = 0; i < k; i++){
      var a = r() < J.A, b = r() < (a ? J.BgA : J.BgnA);
      out.push(a ? (b ? 'AB' : 'AnB') : (b ? 'nAB' : 'nAnB'));
    }
    return out;
  }
  function estimate(outs, q, upto){
    var Q = QS[q], n = 0, d = 0, N = upto == null ? outs.length : Math.min(upto, outs.length);
    for(var i = 0; i < N; i++){ var c = outs[i]; if(Q.num.indexOf(c) > -1) n++; if(!Q.den || Q.den.indexOf(c) > -1) d++; }
    return { n: n, d: d, p: d ? n / d : NaN };
  }

  /* -------------------------------------------------- test yourself */
  function pick(r, a){ return a[Math.floor(r() * a.length)]; }
  function F4(x){ return M.fixed(x, 4); }
  function probCell(answer, mistakes){
    // the course's prob tolerance (docs/apstat-spec.md section 7): 0.002, or 1% when below 0.1
    return answer < 0.1 ? M.cell(answer, 0.01, mistakes, 0) : M.cell(answer, 0, mistakes, 0.002);
  }
  function numStep(key, label, practice, answer, mistakes, hint){
    var s = { key: key, kind: 'num', label: label, practice: practice, cell: probCell(answer, mistakes || []), d: 4 };
    if(hint) s.hint = hint;
    return s;
  }
  function choiceStep(key, label, practice, opts, extra){
    var s = { key: key, kind: 'choice', label: label, practice: practice, options: [], why: [], correct: -1 };
    opts.forEach(function(o, i){ s.options.push(o.t); s.why.push(o.why); if(o.ok) s.correct = i; });
    if(extra) for(var k in extra) s[k] = extra[k];
    return s;
  }
  function between(r, lohi, d){ var k = Math.pow(10, d || 2); return Math.round((lohi[0] + r() * (lohi[1] - lohi[0])) * k) / k; }
  function ev(c, k){ return c.ev[k]; }

  function genTree(r, ctx){
    var pA = between(r, ctx.pA), pBgA = between(r, ctx.pBgA), pBgNA = between(r, ctx.pBgNA);
    if(Math.abs(pBgA - pBgNA) < 0.05) pBgNA = Math.max(0.01, Math.min(0.99, M.round(pBgA + (pBgA > 0.5 ? -0.2 : 0.2), 2)));
    var J = joint(pA, pBgA, pBgNA), E = ctx.ev;
    var text = '<p>' + ctx.lead + ' ' + cap(ctx.tree.a) + ' P(A) = ' + pA + '. ' + cap(ctx.tree.ba) + ' P(B | A) = ' + pBgA + ', and ' + ctx.tree.bna + ' P(B | not A) = ' + pBgNA + '. Here A is "' + E.A + '" and B is "' + E.B + '".</p>';
    var steps = [
      numStep('AB', 'Find P(A and B), the probability that ' + ctx.who + ' ' + E.A + ' and ' + E.B + '.', '3.C', J.AB, [
        { value: pA + pBgA, why: 'Adding is for "or". Along a branch of the tree, multiply: P(A) × P(B | A).' },
        { value: pBgA, why: 'That is P(B | A), the branch alone. Multiply by P(A) to get the path.' }
      ], 'Multiply along the path: P(A) × P(B | A).'),
      numStep('B', 'Find P(B), the probability that ' + ctx.who + ' ' + E.B + '.', '3.C', J.B, [
        { value: (pBgA + pBgNA) / 2, why: 'Averaging the two branches ignores that A and not A are not equally likely. Weight each by its probability.' },
        { value: pBgA + pBgNA, why: 'Add the two PATHS that end in B, not the two branch probabilities: P(A)P(B | A) + P(not A)P(B | not A).' },
        { value: J.AB, why: 'That is only the path through A. Add the path through not A.' }
      ], 'Add every path that ends in B.'),
      numStep('AgB', 'Find P(A | B): of those who ' + E.Bp + ', the probability they ' + E.Ap + '.', '3.C', J.AgB, [
        { value: pBgA, why: 'That is P(B | A), the other direction. P(A | B) = P(A and B) ÷ P(B).' },
        { value: J.AB, why: 'That is P(A and B). Divide by P(B) to keep only the B slice.' },
        { value: J.AB / pA, why: 'Dividing by P(A) gives P(B | A) back. For P(A | B), divide by P(B).' }
      ], 'P(A | B) = P(A and B) ÷ P(B).')
    ];
    return { ctx: ctx.id, topic: 'conditional-probability', type: 'tree', text: text, steps: steps,
      solution: ['P(A and B) = P(A) × P(B | A) = ' + pA + ' × ' + pBgA + ' = ' + F4(J.AB) + '.',
        'P(B) = P(A)P(B | A) + P(not A)P(B | not A) = ' + pA + ' × ' + pBgA + ' + ' + M.fixed(1 - pA, 2) + ' × ' + pBgNA + ' = ' + F4(J.B) + '.',
        'P(A | B) = P(A and B) ÷ P(B) = ' + F4(J.AB) + ' ÷ ' + F4(J.B) + ' = ' + F4(J.AgB) + '. Compare with P(B | A) = ' + pBgA + ': the two directions are different questions.'],
      figure: { pA: pA, pBgA: pBgA, pBgNA: pBgNA } };
  }

  function genTable(r, ctx){
    var N = pick(r, ctx.totals), pA = between(r, ctx.pA), pBgA = between(r, ctx.pBgA), pBgNA = between(r, ctx.pBgNA);
    var nA = Math.round(N * pA), nAB = Math.round(nA * pBgA), nnAB = Math.round((N - nA) * pBgNA);
    var indep = r() < 0.3;
    if(indep){
      // an independent table: row and column totals whose product is a
      // multiple of N, every cell positive, as near the drawn shares as can be
      var nA0 = nA, nB0 = Math.round(N * pBgA), found = null;
      for(var dA = 0; dA <= 40 && !found; dA++) for(var sA = -1; sA <= 1 && !found; sA += 2){
        var a = nA0 + sA * dA;
        if(a < 2 || a > N - 2) continue;
        for(var dB = 0; dB <= 40 && !found; dB++) for(var sB = -1; sB <= 1 && !found; sB += 2){
          var bb = nB0 + sB * dB, ab = a * bb / N;
          if(bb < 2 || bb > N - 2 || ab !== Math.floor(ab)) continue;
          if(ab > 0 && a - ab > 0 && bb - ab > 0 && N - a - bb + ab > 0) found = [a, bb, ab];
        }
      }
      if(found){ nA = found[0]; nAB = found[2]; nnAB = found[1] - found[2]; } else indep = false;
    }
    if(!indep){ nAB = Math.max(1, Math.min(nA - 1, nAB)); nnAB = Math.max(1, Math.min(N - nA - 1, nnAB)); }
    if(!indep && nAB * (N - nA) === nnAB * nA) nnAB += nnAB < N - nA ? 1 : -1;
    var T = { AB: nAB, AnB: nA - nAB, nAB: nnAB, nAnB: N - nA - nnAB, N: N };
    T.A = nA; T.B = nAB + nnAB; T.nA = N - nA; T.nB = N - T.B;
    var E = ctx.ev, P = function(n){ return n / N; };
    var isIndep = T.AB * T.N === T.A * T.B;
    var steps = [
      numStep('A', 'Find P(A): a randomly chosen ' + ctx.one + ' ' + E.A + '.', '3.C', P(T.A), [{ value: T.A / T.B, why: 'Divide by the grand total, ' + N + ', not by a column total.' }]),
      numStep('AB', 'Find P(A and B).', '3.C', P(T.AB), [{ value: T.AB / T.A, why: 'That divides by the A row total, which is P(B | A). "And" uses the grand total.' }, { value: T.AB / T.B, why: 'That divides by the B column, which is P(A | B). "And" uses the grand total.' }]),
      numStep('AorB', 'Find P(A or B).', '3.C', P(T.A + T.B - T.AB), [{ value: P(T.A + T.B), why: 'The ' + T.AB + ' in both were counted twice. Subtract P(A and B) once.' }, { value: P(T.AB), why: 'That is "and". "Or" counts everyone in A, in B, or in both.' }], 'P(A or B) = P(A) + P(B) − P(A and B).'),
      numStep('BgA', 'Find P(B | A): among those who ' + E.Ap + ', the share who ' + E.Bp + '.', '3.C', T.AB / T.A, [{ value: P(T.AB), why: 'That is P(A and B). Given A means the A row is the whole: divide by ' + T.A + '.' }, { value: T.AB / T.B, why: 'That is P(A | B). Given A: slice the A row.' }], 'Slice the A row: its count of B over its total.'),
      choiceStep('indep', 'Are A and B independent?', '4.B', [
        { t: 'Yes: P(B | A) equals P(B)', ok: isIndep, why: isIndep ? 'P(B | A) = ' + F4(T.AB / T.A) + ' and P(B) = ' + F4(P(T.B)) + ': knowing A does not change the chance of B.' : 'Check the numbers: P(B | A) = ' + F4(T.AB / T.A) + ' but P(B) = ' + F4(P(T.B)) + '.' },
        { t: 'No: P(B | A) is not equal to P(B)', ok: !isIndep, why: !isIndep ? 'P(B | A) = ' + F4(T.AB / T.A) + ' but P(B) = ' + F4(P(T.B)) + ', so knowing A changes the chance of B.' : 'Here they are equal: ' + F4(T.AB / T.A) + ' both.' },
        { t: 'No: they can both happen, so they are not independent', ok: false, why: 'That confuses independent with mutually exclusive. Events that can happen together can still be independent.' },
        { t: 'Yes: they are mutually exclusive', ok: false, why: 'Mutually exclusive events (with positive probabilities) are never independent, and these overlap anyway.' }
      ], { fixed: true })
    ];
    var hdr = '<table class="stat-data pt-qtable"><caption>' + ctx.tableCap + ' (' + N + ' ' + ctx.many + ')</caption><thead><tr><th scope="col"></th><th scope="col">' + cap(E.B) + ' (B)</th><th scope="col">' + cap(E.nB) + '</th><th scope="col">Total</th></tr></thead><tbody>' +
      '<tr><th scope="row">' + cap(E.A) + ' (A)</th><td>' + T.AB + '</td><td>' + T.AnB + '</td><td>' + T.A + '</td></tr>' +
      '<tr><th scope="row">' + cap(E.nA) + '</th><td>' + T.nAB + '</td><td>' + T.nAnB + '</td><td>' + T.nA + '</td></tr>' +
      '<tr><th scope="row">Total</th><td>' + T.B + '</td><td>' + T.nB + '</td><td>' + N + '</td></tr></tbody></table>';
    return { ctx: ctx.id, topic: 'conditional-probability', type: 'table', text: '<p>' + ctx.tableLead + ' One ' + ctx.one + ' is chosen at random. Let A be "' + E.A + '" and B be "' + E.B + '".</p>', steps: steps,
      solution: ['P(A) = ' + T.A + '/' + N + ' = ' + F4(P(T.A)) + '.', 'P(A and B) = ' + T.AB + '/' + N + ' = ' + F4(P(T.AB)) + '.', 'P(A or B) = (' + T.A + ' + ' + T.B + ' − ' + T.AB + ')/' + N + ' = ' + F4(P(T.A + T.B - T.AB)) + '.', 'P(B | A) = ' + T.AB + '/' + T.A + ' = ' + F4(T.AB / T.A) + '.', isIndep ? 'P(B | A) = P(B) = ' + F4(P(T.B)) + ', so A and B are independent.' : 'P(B | A) = ' + F4(T.AB / T.A) + ' is not P(B) = ' + F4(P(T.B)) + ', so A and B are not independent.'],
      figure: { table: T }, table: { html: hdr } };
  }
  function gcd(a, b){ while(b){ var t = b; b = a % b; a = t; } return a; }

  function genRules(r, ctx){
    var kind = pick(r, ['overlap', 'indep', 'disjoint']);
    var pA = between(r, [0.2, 0.6]), pB = between(r, [0.15, 0.5]), pAB;
    if(kind === 'disjoint'){ pAB = 0; if(pA + pB > 0.95) pB = M.round(0.9 - pA, 2); }
    else if(kind === 'indep') pAB = M.round(pA * pB, 4);
    else { pAB = M.round(Math.min(pA, pB) * between(r, [0.2, 0.8]), 2); if(Math.abs(pAB - pA * pB) < 0.01) pAB = M.round(pAB + 0.03, 2); }
    var E = ctx.rules[kind === 'disjoint' ? 'disjoint' : 'both'], orV = pA + pB - pAB, isIndep = Math.abs(pAB - pA * pB) < 1e-9, isME = pAB === 0;
    var text = '<p>' + ctx.lead + ' For a randomly chosen ' + ctx.one + ', A is "' + E.A + '" and B is "' + E.B + '". P(A) = ' + pA + ', P(B) = ' + pB + ' and P(A and B) = ' + pAB + '.</p>';
    var steps = [
      numStep('AorB', 'Find P(A or B).', '3.C', orV, [{ value: pA + pB, why: 'That counts the overlap twice. Subtract P(A and B).' }, { value: pA * pB, why: 'Multiplying is for "and" (and only when independent). "Or" uses the addition rule.' }], 'P(A or B) = P(A) + P(B) − P(A and B).'),
      choiceStep('me', 'Are A and B mutually exclusive?', '4.B', [
        { t: 'Yes, because P(A and B) = 0', ok: isME, why: isME ? 'They cannot happen together.' : 'P(A and B) = ' + pAB + ', not 0.' },
        { t: 'No, because P(A and B) is not 0', ok: !isME, why: !isME ? 'They can happen together: P(A and B) = ' + pAB + '.' : 'Here P(A and B) is 0.' },
        { t: 'Yes, because P(A or B) is less than 1', ok: false, why: 'Mutually exclusive is about P(A and B) = 0, not P(A or B).' },
        { t: 'It cannot be told from these numbers', ok: false, why: 'P(A and B) is given, and that settles it.' }
      ], { fixed: true }),
      choiceStep('indep', 'Are A and B independent?', '4.B', [
        { t: 'Yes, because P(A) × P(B) = P(A and B)', ok: isIndep, why: isIndep ? pA + ' × ' + pB + ' = ' + F4(pA * pB) + ', which is P(A and B).' : pA + ' × ' + pB + ' = ' + F4(pA * pB) + ', not ' + pAB + '.' },
        { t: 'No, because P(A) × P(B) is not P(A and B)', ok: !isIndep, why: !isIndep ? pA + ' × ' + pB + ' = ' + F4(pA * pB) + ', but P(A and B) = ' + pAB + '.' : 'Here the product does equal P(A and B).' },
        { t: 'Yes, because they are mutually exclusive', ok: false, why: 'Mutually exclusive events with positive probabilities are dependent: knowing one happened rules out the other.' },
        { t: 'No, because they can happen at the same time', ok: false, why: 'Happening together is allowed for independent events. Check P(A) × P(B) against P(A and B).' }
      ], { fixed: true })
    ];
    return { ctx: ctx.id, topic: 'independence-unions', type: 'rules', text: text, steps: steps,
      solution: ['P(A or B) = ' + pA + ' + ' + pB + ' − ' + pAB + ' = ' + F4(orV) + '.', isME ? 'P(A and B) = 0, so they are mutually exclusive.' : 'P(A and B) = ' + pAB + ' > 0, so they are not mutually exclusive.', 'P(A) × P(B) = ' + F4(pA * pB) + (isIndep ? ' = P(A and B): independent.' : ' ≠ P(A and B) = ' + pAB + ': not independent.')],
      figure: { pA: pA, pB: pB, pAB: pAB } };
  }
  function cap(s){ s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }

  var GEN = { tree: genTree, table: genTable, rules: genRules };
  var TYPES = ['tree', 'table', 'rules'];
  function generate(r, ctx, type){
    var ok = (ctx.types || TYPES).filter(function(t){ return GEN[t]; });
    var t = type && ok.indexOf(type) > -1 ? type : pick(r, ok);
    return GEN[t](r, ctx);
  }

  M.register('probabilityTrees', {
    CELLS: CELLS, QS: QS, TYPES: TYPES,
    joint: joint, value: value, lens: lens, venn: venn, simulate: simulate, estimate: estimate, generate: generate
  });
})();
