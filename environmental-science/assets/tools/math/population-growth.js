/* Population growth model: ApEnvMath.populationGrowth (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T1, docs/apenv-briefs/t1.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/population-growth.mjs)
   and the test (scripts/test/apenv-tool-population-growth.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/population-growth.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/population-growth.js.

   Explore (one population on an island, deer by default)
     simulate(o) -> { t: [...], n: [...], peak, peakT, low, kind }
       o: { model: 'exp' | 'log' | 'over', r (per year, as a fraction), K, n0,
       years, lag (overshoot: the years the herd takes to feel the crowding),
       crash (overshoot: the carrying capacity after the range is damaged, as
       a fraction of K) }. Yearly steps (a discrete model):
         exp   N(t+1) = N + rN                      (ApEnvCalc.exponential per year)
         log   N(t+1) = N + rN(1 - N/K)             (the logistic curve)
         over  N(t+1) = N + rN(1 - N(t - lag)/K')   a lagged logistic (lag 2 years): the herd
               overshoots K, overgrazes, and K' falls to crash × K once N passes K,
               so the population dies back below the old K
     phase(N, K, model) -> 'lag' | 'exponential' | 'slowing' | 'at K' | 'overshoot' | 'dieback'
     doublingTime(r)      ApEnvCalc.ruleOf70(r × 100)
   Survivorship (kept apart from r and K on purpose)
     CURVES { I, II, III }: survivors out of 1,000 at each tenth of the
     maximum life span (the classic idealized shapes, on a log scale)
   r- and K-selected traits
     TRAITS: [{ trait, r, K }]
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, figure, given }
       type 'doubling' | 'project' | 'logistic' | 'phase' | 'survivorship' | 'rk' */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  function C(){ return M.Calc(); }
  function calc(fn, args){ return C().evaluate({ fn: fn, args: args }); }
  function nf(x, d){
    var s = M.fixed(x, d == null ? 0 : d);
    if(s.indexOf('.') > -1) s = s.replace(/0+$/, '').replace(/\.$/, '');
    var neg = s.charAt(0) === '-'; if(neg) s = s.slice(1);
    var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '−' : '') + p.join('.');
  }
  function raw(x){ return String(+Number(x).toPrecision(12)); }
  function pick(r, a){ return a[Math.floor(r() * a.length)]; }
  function between(r, ab, step){ var s = step || 1, n = Math.round((ab[1] - ab[0]) / s); return M.round(ab[0] + s * Math.floor(r() * (n + 1)), 6); }

  /* -------------------------------------------------------- the model */
  function simulate(o){
    var r = o.r, K = o.K, n0 = o.n0, Y = o.years || 40, lag = o.lag || 2, crash = o.crash == null ? 0.55 : o.crash;
    var t = [0], n = [n0], Kt = [K], Keff = K, passed = false;
    for(var y = 1; y <= Y; y++){
      var N = n[y - 1], next;
      if(o.model === 'exp') next = calc('exponential', [N, r * 100, 1]);
      else if(o.model === 'log') next = N + r * N * (1 - N / K);
      else {
        // Overshoot: the herd responds to its numbers lag years ago, and once it
        // passes K it eats the range down, so the land supports fewer (K').
        if(!passed && N > K) passed = true;
        if(passed) Keff = Math.max(K * crash, Keff - (Keff - K * crash) * 0.35);
        var past = n[Math.max(0, y - 1 - lag)];
        next = N + r * N * (1 - past / Keff);
      }
      next = Math.max(0, next);
      t.push(y); n.push(next); Kt.push(o.model === 'over' ? Keff : K);
    }
    var peak = 0, peakT = 0; n.forEach(function(v, i){ if(v > peak){ peak = v; peakT = i; } });
    var low = Infinity, lowT = peakT; n.forEach(function(v, i){ if(i > peakT && v < low){ low = v; lowT = i; } });
    // The crash: from the peak down to its first trough.
    var troughT = peakT; while(troughT < Y && n[troughT + 1] <= n[troughT]) troughT++;
    return { t: t, n: n, K: Kt, peak: peak, peakT: peakT, troughT: troughT, low: isFinite(low) ? low : peak, lowT: lowT, model: o.model };
  }
  /* What phase a population is in: read from where N sits against K and how it is changing. */
  function phase(sim, i){
    var N = sim.n[i], K0 = sim.K[0];
    if(sim.model === 'exp') return N < K0 * 0.05 ? 'lag' : 'exponential';
    if(sim.model === 'over'){
      if(i > sim.peakT && i <= sim.troughT) return 'dieback';
      if(i <= sim.peakT && N > K0) return 'overshoot';
      // After the crash the herd regrows toward the damaged range's lower K.
      if(i > sim.peakT){ var Kn = sim.K[i]; return N < Kn * 0.5 ? 'exponential' : N < Kn * 0.9 ? 'slowing' : 'at K'; }
    }
    if(N < K0 * 0.12) return 'lag';
    if(N < K0 * 0.5) return 'exponential';
    if(N < K0 * 0.95) return 'slowing';
    return 'at K';
  }
  function doublingTime(r){ return calc('ruleOf70', [r * 100]); }

  /* ---------------------------------------------------- survivorship */
  /* Survivors out of 1,000 at each tenth of the maximum life span (x = 0..10),
     the idealized textbook shapes: I late loss, II a constant rate, III early loss. */
  var CURVES = {
    I: [1000, 990, 980, 970, 950, 920, 870, 780, 600, 280, 1],
    II: [1000, 501, 251, 126, 63, 32, 16, 8, 4, 2, 1],
    III: [1000, 40, 18, 12, 9, 7, 5.5, 4, 3, 2, 1]
  };
  var CURVE_INFO = {
    I: { name: 'Type I', what: 'Most survive to old age; deaths come late in life.', who: ['humans', 'elephants', 'whales', 'great apes'], care: 'few offspring and a lot of parental care' },
    II: { name: 'Type II', what: 'A steady death rate at every age: the same share dies each year.', who: ['songbirds', 'lizards', 'squirrels', 'hydras'], care: 'deaths that do not depend much on age (predation, accidents)' },
    III: { name: 'Type III', what: 'Most die very young; the few that make it live a long time.', who: ['oysters', 'sea turtles', 'frogs', 'oak trees', 'cod'], care: 'huge numbers of offspring and little or no parental care' }
  };

  /* ------------------------------------------------- r and K traits */
  var TRAITS = [
    { trait: 'Number of offspring', r: 'many', K: 'few' },
    { trait: 'Size of offspring', r: 'small', K: 'large' },
    { trait: 'Parental care', r: 'little or none', K: 'a lot' },
    { trait: 'Age at first reproduction', r: 'early', K: 'late' },
    { trait: 'Life span', r: 'short', K: 'long' },
    { trait: 'Population over time', r: 'booms and crashes', K: 'stays near K' },
    { trait: 'After a disturbance', r: 'rebounds fast', K: 'recovers slowly' },
    { trait: 'As an invasive species', r: 'often', K: 'rarely' }
  ];

  /* --------------------------------------------------------- drills */
  var SK = { setup: '6.B', answer: '6.C', year: '6.C', k: '5.B', phase: '5.B', why: '5.C', curve: '5.B', link: '1.A', rk: '1.A', trait: '1.B', read: '5.B' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '5.B' }; for(var k in o) s[k] = o[k]; return s; }
  function setupStep(answer, o){
    o = o || {};
    var X = G.ApEnvExpr, key = X.evaluate(answer, {}, o.units || []);
    var ms = (o.mistakes || []).filter(function(m){ var v = X.evaluate(m.expr, {}, o.units || []); return v.ok && key.ok && Math.abs(v.value - key.value) > 1e-6 * Math.max(1, Math.abs(key.value)); });
    return step('setup', o.label || 'Write the setup, as you would type it on the exam.', { kind: 'setup', hint: o.hint, cell: M.setupCell(answer, { mustUse: o.mustUse, mistakes: ms, units: o.units, unit: o.unit }) });
  }
  function answerStep(value, unit, o){
    o = o || {};
    var tol = G.ApEnvGrade.tolerance({ answer: value, places: o.places }), seen = [value];
    var ms = (o.mistakes || []).filter(function(m){ if(!isFinite(m.value) || seen.some(function(v){ return Math.abs(m.value - v) <= 2.5 * tol + 1e-9 * Math.abs(v); })) return false; seen.push(m.value); return true; });
    var opts = { units: o.units, mistakes: ms }; if(o.places != null) opts.places = o.places;
    return step(o.key || 'answer', o.label || 'Now the answer and its unit.', { kind: 'unit', hint: o.hint, cell: M.unitCell(value, unit, opts) });
  }
  function numStep(key, label, value, o){ o = o || {}; return step(key, label, { kind: 'num', d: o.d == null ? 0 : o.d, unit: o.unit, hint: o.hint, cell: M.cell(value, o.rel == null ? 1e-6 : o.rel, o.mistakes || [], o.abs == null ? 0.5 : o.abs) }); }
  function choice(key, label, opts, extra){ var s = step(key, label, { kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 }); for(var k in extra || {}) s[k] = extra[k]; return s; }

  var TYPES = [
    { value: 'doubling', label: 'Doubling time and the year' },
    { value: 'project', label: 'Projecting exponential growth' },
    { value: 'logistic', label: 'Reading a logistic curve' },
    { value: 'phase', label: 'Overshoot and dieback' },
    { value: 'survivorship', label: 'Survivorship curves' },
    { value: 'rk', label: 'r- and K-selected traits' }
  ];
  var GEN = {};

  GEN.doubling = function(r, c){
    var rate = pick(r, c.rates || [1, 1.4, 2, 2.5, 3.5, 5, 7]), y0 = between(r, c.years || [2010, 2024], 1), n0 = between(r, c.pop, c.popStep || 10);
    var td = calc('ruleOf70', [rate]), yr = calc('doublingYear', [y0, rate]);
    var text = '<p>' + c.lead.replace('{n0}', nf(n0)).replace('{y0}', y0).replace('{rate}', nf(rate, 2)) + '</p><p>Use the rule of 70: <b>find the doubling time</b>, then <b>the year</b> the ' + c.noun + ' reaches ' + nf(2 * n0) + '.</p>';
    var steps = [
      setupStep('70 / ' + raw(rate), { mustUse: ['70', raw(rate)], hint: 'Doubling time = 70 ÷ (growth rate in percent).',
        mistakes: [{ expr: '70 / ' + raw(rate / 100), why: 'Use the rate in percent (' + nf(rate, 2) + '), not as a decimal.' }, { expr: raw(rate) + ' / 70', why: 'The other way up: 70 on top.' }] }),
      answerStep(td, 'yr', { units: ['years', 'year'], places: 1, mistakes: [{ value: 70 / (rate / 100), why: 'Use the rate in percent, not as a decimal.' }] }),
      numStep('year', 'In what year does it reach ' + nf(2 * n0) + '?', yr, { hint: 'Add the doubling time to the start year.', mistakes: [{ value: td, why: 'That is the doubling time. Add it to ' + y0 + '.' }] })
    ];
    var sol = ['Doubling time = 70 / ' + nf(rate, 2) + ' = ' + nf(td, 1) + ' years.', 'Year = ' + y0 + ' + ' + nf(td, 1) + ' = ' + M.fixed(yr, 0) + '.', 'The rule of 70 is for exponential growth at a steady rate; a population near its carrying capacity slows down and takes longer.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'sim', model: 'exp', r: rate / 100, n0: n0, K: n0 * 6, years: Math.ceil(td * 1.6), mark: td, y0: y0, noun: c.noun }, given: { rate: rate, y0: y0 } };
  };

  GEN.project = function(r, c){
    var rate = pick(r, c.rates || [2, 2.5, 3.5, 5, 7, 10]), td = calc('ruleOf70', [rate]), k = between(r, [2, 4], 1), t = td * k, n0 = between(r, c.pop, c.popStep || 10);
    var ans = calc('afterDoublings', [n0, t, td]);
    var y0 = between(r, c.years || [2010, 2024], 1);
    var text = '<p>' + c.lead.replace('{n0}', nf(n0)).replace('{y0}', y0).replace('{rate}', nf(rate, 2)) + '</p><p>Resources are unlimited for now. <b>Estimate the ' + c.noun + ' after ' + nf(t, 1) + ' years</b> using the rule of 70.</p>';
    var steps = [
      numStep('k', 'How many doubling times is ' + nf(t, 1) + ' years?', k, { abs: 0.01, hint: 'Doubling time = 70 ÷ ' + nf(rate, 2) + '. Then divide the years by it.', mistakes: [{ value: t / rate, why: 'Divide by the doubling time (70 / ' + nf(rate, 2) + ' = ' + nf(td, 1) + ' years), not by the rate.' }] }),
      setupStep(raw(n0) + ' * 2^' + k, { mustUse: [raw(n0)], hint: 'Each doubling multiplies by 2: start × 2^(number of doublings).',
        mistakes: [{ expr: raw(n0) + ' * 2 * ' + k, why: k + ' doublings is × 2^' + k + ' = × ' + Math.pow(2, k) + ', not × 2 × ' + k + '.' }, { expr: raw(n0) + ' * ' + k, why: 'Doubling ' + k + ' times multiplies by 2^' + k + '.' }] }),
      answerStep(ans, c.unit, { units: c.units, mistakes: [{ value: n0 * 2 * k, why: 'Doubling ' + k + ' times is × ' + Math.pow(2, k) + ', not × ' + (2 * k) + '.' }] })
    ];
    var sol = ['Doubling time = 70 / ' + nf(rate, 2) + ' = ' + nf(td, 1) + ' years; ' + nf(t, 1) + ' / ' + nf(td, 1) + ' = ' + k + ' doublings.', nf(n0) + ' × 2^' + k + ' = ' + nf(ans) + ' ' + c.unitWord + '.', 'This J-curve keeps going only while resources are unlimited. Real populations meet a carrying capacity.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'sim', model: 'exp', r: Math.pow(2, 1 / td) - 1, n0: n0, K: ans * 2, years: Math.ceil(t), marks: k, td: td, noun: c.noun, ans: ans }, given: { n0: n0, rate: rate, k: k } };
  };

  /* A logistic curve: read K off it, the phase at a year, and where growth is fastest. */
  GEN.logistic = function(r, c){
    var K = between(r, c.K, c.KStep || 100), n0 = Math.round(K * between(r, [4, 10], 1) / 100), rr = between(r, [0.3, 0.6], 0.05), years = 30;
    var sim = simulate({ model: 'log', r: rr, K: K, n0: n0, years: years });
    var half = 0; for(var i = 0; i < sim.n.length; i++) if(sim.n[i] >= K / 2){ half = i; break; }
    var tu = c.tu || 'year';
    var text = '<p>' + c.lead + ' The graph shows the ' + c.noun + ' each ' + tu + ' after ' + c.start + ' (a model, invented numbers for practice).</p>';
    var steps = [
      numStep('k', 'Read the carrying capacity (K) from the graph, in ' + c.unitWord + ':', K, { rel: 0.06, abs: 0, hint: 'K is the level the curve flattens out at.', mistakes: [{ value: K / 2, why: 'That is half of K, where growth is fastest. K is where the curve levels off.' }] }),
      choice('phase', 'At about what point is the population growing fastest?', [
        ['Around ' + nf(K / 2) + ' ' + c.unitWord + ', half the carrying capacity.', 'Right. Growth (the slope) is steepest at K/2: there are many breeders and still plenty of resources.'],
        ['At the very start, when there are only ' + nf(n0) + '.', 'The rate per individual is highest then, but there are few breeders, so the number added each year is small.'],
        ['At the carrying capacity, ' + nf(K) + '.', 'At K births and deaths balance: the population stops growing.'],
        ['It grows at the same speed the whole time.', 'That would be a straight line. A logistic curve speeds up, then slows as it nears K.']
      ]),
      choice('why', 'Why does the curve level off?', [
        ['Limiting resources (food, space, water) raise the death rate and lower the birth rate as the population nears K.', 'Right. Density-dependent factors grow stronger as the population grows, until births equal deaths.'],
        ['The animals stop reproducing once they reach a set number.', 'Reproduction slows because resources run short, not because of a fixed limit in the animals.'],
        ['The carrying capacity keeps rising with the population.', 'K is set by the resources of the habitat; here it stays the same.'],
        ['Exponential growth always stops after a set time.', 'Growth slows because of limiting resources, not after a set time.']
      ])
    ];
    var sol = ['K = ' + nf(K) + ' ' + c.unitWord + ' (where the curve flattens).', 'Fastest growth at K/2 ≈ ' + nf(K / 2) + ', about ' + tu + ' ' + half + ' on this graph.', 'This S-curve (logistic growth) starts like the J-curve, then slows as limiting resources take hold.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'sim', model: 'log', r: rr, K: K, n0: n0, years: years, hideK: true, noun: c.noun, unit: c.unitWord, tu: tu }, given: { K: K, n0: n0, r: rr } };
  };

  /* Overshoot: name the phases and say why the land supports fewer afterward. */
  GEN.phase = function(r, c){
    var K = between(r, c.K, c.KStep || 100), n0 = Math.round(K * 0.06), rr = between(r, [0.4, 0.6], 0.05), lag = 2;
    var sim = simulate({ model: 'over', r: rr, K: K, n0: n0, years: 40, lag: lag, crash: 0.55 });
    var text = '<p>' + c.lead + ' The graph follows the herd for 40 years (a model, invented numbers for practice). The dashed line is the carrying capacity the range had at the start, ' + nf(K) + ' ' + c.unitWord + '.</p>';
    var steps = [
      numStep('read', 'About how many ' + c.unitWord + ' were there at the peak?', sim.peak, { rel: 0.08, abs: 0, hint: 'Read the highest point of the curve.' }),
      choice('phase', 'What happened when the population went above the dashed line?', [
        ['Overshoot: it went past the carrying capacity, used up resources faster than they grew back, and then died back.', 'Right. Above K, the herd ate the range faster than it regrew; food ran short and the population crashed.'],
        ['The carrying capacity rose to make room for more ' + c.unitWord + '.', 'K is set by the range’s food and space. Overgrazing lowers it; it does not rise.'],
        ['It reached a stable equilibrium at the peak.', 'A peak above K is not stable: the herd falls back.'],
        ['It switched from K-selected to r-selected.', 'A species’ reproductive strategy does not switch. This is overshoot and dieback.']
      ]),
      choice('why', 'After the dieback the herd settles below the old line. Why?', [
        ['Overgrazing damaged the range, so it now supports fewer ' + c.unitWord + ': the carrying capacity went down.', 'Right. During overshoot the herd degraded its own resources, lowering K for years after.'],
        ['The herd forgot how to find food.', 'The cause is the habitat, not the animals’ behavior: the range was eaten down.'],
        ['Births stopped completely.', 'Births continue; deaths outnumber them until the herd fits what the damaged range can feed.'],
        ['The dashed line is wrong.', 'The dashed line is the starting K. The damaged range has a lower K now.']
      ])
    ];
    var sol = ['Peak ≈ ' + nf(sim.peak) + ' ' + c.unitWord + ', above K = ' + nf(K) + '.', 'Overshoot: births kept outrunning deaths for a few years after the herd passed K, because the effects of crowding come with a delay.', 'Dieback: food ran out, deaths outnumbered births, and the overgrazed range now supports about ' + nf(sim.K[sim.K.length - 1]) + '.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'sim', model: 'over', r: rr, K: K, n0: n0, years: 40, lag: lag, crash: 0.55, noun: c.noun, unit: c.unitWord }, given: { K: K, n0: n0, r: rr, lag: lag } };
  };

  /* Survivorship: match the species to its curve; never mix it up with r and K. */
  GEN.survivorship = function(r, c){
    var type = c.curve, info = CURVE_INFO[type], sp = c.species, others = ['I', 'II', 'III'].filter(function(x){ return x !== type; });
    var text = '<p>' + c.lead + '</p><p>The graph shows the three survivorship curves (survivors out of 1,000, on a log scale, against age as a share of the longest life span).</p>';
    var steps = [
      choice('curve', 'Which curve fits ' + sp + '?', [
        [info.name + ': ' + info.what, 'Right. ' + c.why],
        [CURVE_INFO[others[0]].name + ': ' + CURVE_INFO[others[0]].what, 'Not this one. ' + c.why],
        [CURVE_INFO[others[1]].name + ': ' + CURVE_INFO[others[1]].what, 'Not this one. ' + c.why]
      ], { fixed: true }),
      choice('link', 'Which statement is true?', [
        ['Survivorship curves show when individuals die; r- and K-selection describe how they reproduce. They are related, not the same thing.', 'Right. Many K-selected species have Type I curves and many r-selected species have Type III, but a Type II species can be either, and the two ideas answer different questions.'],
        ['A Type III curve means a species is K-selected.', 'Backward and too strong: Type III (early deaths) usually goes with r-selected species, and it is a tendency, not a rule.'],
        ['Survivorship curves and r- and K-selection are two names for the same idea.', 'This is the mix-up the exam readers report. Survivorship is about death by age; r and K are about reproduction.'],
        ['Every Type I species is r-selected.', 'Type I (late deaths) usually goes with K-selected species, such as humans and elephants.']
      ])
    ];
    // The curve options read in order I, II, III; each why names the reason for this species.
    var order = ['I', 'II', 'III'], opts = steps[0].options.slice(), whys = steps[0].why.slice(), right = opts[0];
    var byType = {}; byType[type] = [opts[0], whys[0]]; byType[others[0]] = [opts[1], whys[1]]; byType[others[1]] = [opts[2], whys[2]];
    steps[0].options = order.map(function(t){ return byType[t][0]; }); steps[0].why = order.map(function(t){ return byType[t][1]; }); steps[0].correct = order.indexOf(type);
    var sol = [sp.charAt(0).toUpperCase() + sp.slice(1) + ': ' + info.name + '. ' + c.why, 'Type I: late deaths (much care). Type II: a constant rate. Type III: early deaths (many offspring, little care).', 'Survivorship is about WHEN they die; r and K are about HOW they reproduce.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'surv', show: type }, given: { type: type, right: right } };
  };

  /* r and K: classify a species from its traits. */
  GEN.rk = function(r, c){
    var isR = c.strategy === 'r', t = c.traits;
    var text = '<p>' + c.lead + '</p><ul class="pg-traits">' + t.map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ul>';
    var steps = [
      choice('rk', 'Is this species mostly r-selected or K-selected?', isR ? [
        ['r-selected', 'Right. Many small offspring, early breeding and little care are r-selected traits.'],
        ['K-selected', 'K-selected species have few, large offspring with a lot of care; these traits point the other way.']
      ] : [
        ['K-selected', 'Right. Few large offspring, late breeding and a lot of care are K-selected traits.'],
        ['r-selected', 'r-selected species have many small offspring with little care; these traits point the other way.']
      ], { fixed: true }),
      choice('trait', 'Which prediction fits this species best?', isR ? [
        ['After a flood wipes out much of the population, it rebounds within a few seasons.', 'Right. A high biotic potential lets r-selected populations recover fast.'],
        ['It is at high risk of extinction from hunting because it recovers slowly.', 'That fits K-selected species, which breed slowly.'],
        ['Its numbers stay steady near the carrying capacity year after year.', 'r-selected populations tend to boom and crash.'],
        ['Most individuals live to old age.', 'Most r-selected offspring die young (a Type III pattern is common).']
      ] : [
        ['It recovers slowly after a population crash, so it is at higher risk from hunting or habitat loss.', 'Right. Few offspring and late breeding mean a slow recovery.'],
        ['It quickly takes over new habitats as an invasive species.', 'Fast spread fits r-selected species; K-selected ones breed too slowly.'],
        ['Its numbers swing wildly with the seasons.', 'K-selected populations tend to stay near the carrying capacity.'],
        ['Most of its young die in the first weeks of life.', 'K-selected species invest a lot in each young, so most survive (Type I is common).']
      ])
    ];
    var sol = [(isR ? 'r-selected' : 'K-selected') + ': ' + c.why, 'r-selected: many small offspring, early, little care, boom and crash, fast recovery. K-selected: few large offspring, late, much care, near K, slow recovery.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'traits', strategy: c.strategy, name: c.name }, given: { strategy: c.strategy } };
  };

  function generate(r, ctx, type){
    var t = type && ctx.types && ctx.types.indexOf(type) > -1 ? type : (ctx.types || [])[0];
    var g = GEN[t];
    if(!g) throw new Error('population-growth: no generator for type "' + t + '"');
    var p = g(r, ctx);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = t;
    return p;
  }

  M.register('populationGrowth', {
    TYPES: TYPES, CURVES: CURVES, CURVE_INFO: CURVE_INFO, TRAITS: TRAITS,
    simulate: simulate, phase: phase, doublingTime: doublingTime, nf: nf,
    generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
