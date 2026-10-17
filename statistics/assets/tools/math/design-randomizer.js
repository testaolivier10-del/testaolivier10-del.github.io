/* Design randomizer model: ApStatMath.designRandomizer (docs/apstat-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apstat-tool-checks/design-randomizer.mjs) and the test
   (scripts/test/apstat-tool-design-randomizer.test.mjs) run exactly this code.

   Explore
     units(scene) -> [{ i, label, row, col, block, pair, base }]: the fixed
       experimental units of a scene; block is the lurking group (sunny or
       shady pots, younger or older volunteers), pair the matched pair (two
       neighbors in the same block), base each unit's own response without
       any treatment (made once from the scene's seed)
     DESIGNS: cr (completely randomized), block (randomized block), pairs
       (matched pairs), none (no random assignment: the scene's own rule)
     assign(r, U, design, scene) -> ['A'|'B' per unit] (equal groups)
     run(r, U, tr, scene, o) -> { y, meanA, meanB, diff, bal } one experiment:
       y = base + effect (treatment A) + placebo (A, when not blind) + noise
     many(r, U, design, scene, k, o) -> { diffs, bals }
   Test yourself
     generate(r, ctx, type) -> { ctx, topic, type, text, steps, solution }
       types: design (name the design), variables (explanatory, response,
       units, treatments), scope (cause and effect, generalize), procedure
       (random assignment slot by slot), confound (confounding, blinding)
   Every random choice comes from the seeded generator. */
(function(){
  'use strict';
  var M = window.ApStatMath;
  if(!M) return;

  var DESIGNS = ['cr', 'block', 'pairs', 'none'];
  var NAME = { cr: 'completely randomized design', block: 'randomized block design', pairs: 'matched pairs design', none: 'no random assignment' };
  var SHORT = { cr: 'Completely randomized', block: 'Blocked', pairs: 'Matched pairs', none: 'Not random' };

  function mean(a){ var s = 0; for(var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  function sd(a){ var m = mean(a), s = 0; for(var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return Math.sqrt(s / (a.length - 1)); }
  function cap(s){ s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  function list(a){ return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  /* ------------------------------------------------------- the units */
  /* scene: { id, rows, cols, seed, base, sd, lurk: { by: 'row', rows: [..], shift },
     effect, noise, placebo?, decimals }. Units sit in rows; the lurking
     group is a set of rows; pairs are left-right neighbours in a row. */
  var cache = {};
  function units(sc){
    var key = sc.id + ':' + sc.seed;
    if(cache[key]) return cache[key];
    var r = M.rng(sc.seed), U = [];
    for(var y = 0; y < sc.rows; y++) for(var x = 0; x < sc.cols; x++){
      var b = sc.lurk.rows.indexOf(y) > -1 ? 1 : 0, i = U.length;
      U.push({ i: i, label: i + 1, row: y, col: x, block: b, pair: y * Math.ceil(sc.cols / 2) + Math.floor(x / 2),
        base: M.round(sc.base + b * sc.lurk.shift + M.normal(r, 0, sc.sd), sc.decimals == null ? 1 : sc.decimals) });
    }
    if(sc.ages){ U.forEach(function(u){ u.age = u.block ? r.int(sc.ages[1][0], sc.ages[1][1]) : r.int(sc.ages[0][0], sc.ages[0][1]); }); }
    cache[key] = U;
    return U;
  }

  function half(r, ids){ var s = M.shuffle(r, ids); return s.slice(0, Math.floor(s.length / 2)); }
  function assign(r, U, design, sc){
    var tr = U.map(function(){ return 'B'; }), A = [];
    if(design === 'cr') A = half(r, U.map(function(u){ return u.i; }));
    else if(design === 'block') [0, 1].forEach(function(b){ A = A.concat(half(r, U.filter(function(u){ return u.block === b; }).map(function(u){ return u.i; }))); });
    else if(design === 'pairs'){
      var pairs = {};
      U.forEach(function(u){ (pairs[u.pair] = pairs[u.pair] || []).push(u.i); });
      Object.keys(pairs).forEach(function(k){ var p = pairs[k]; A.push(p[r() < 0.5 ? 0 : 1]); });
    } else {
      // no random assignment: the scene's rule (the gardener, the volunteers)
      // puts treatment A on the lurking group first, give or take one or two
      var order = U.map(function(u){ return { i: u.i, k: (u.block === sc.none.favors ? 0 : 1) + (r() < sc.none.slip ? 1 : 0) + r() * 0.5 }; }).sort(function(a, b){ return a.k - b.k; });
      A = order.slice(0, Math.floor(U.length / 2)).map(function(x){ return x.i; });
    }
    A.forEach(function(i){ tr[i] = 'A'; });
    return tr;
  }
  function run(r, U, tr, sc, o){
    o = o || {};
    var y = U.map(function(u){
      var v = u.base + (tr[u.i] === 'A' ? sc.effect : 0) + (o.unblind && sc.placebo && tr[u.i] === 'A' ? sc.placebo : 0) + M.normal(r, 0, sc.noise);
      return M.round(v, sc.decimals == null ? 1 : sc.decimals);
    });
    var a = [], b = [], bal = { A: 0, B: 0 };
    U.forEach(function(u){ if(tr[u.i] === 'A'){ a.push(y[u.i]); if(u.block === 1) bal.A++; } else { b.push(y[u.i]); if(u.block === 1) bal.B++; } });
    return { y: y, meanA: mean(a), meanB: mean(b), diff: mean(a) - mean(b), bal: bal };
  }
  function many(r, U, design, sc, k, o){
    var diffs = [], bals = [];
    for(var j = 0; j < k; j++){ var tr = assign(r, U, design, sc), res = run(r, U, tr, sc, o); diffs.push(res.diff); bals.push(res.bal.A - res.bal.B); }
    return { diffs: diffs, bals: bals };
  }

  /* -------------------------------------------------- test yourself */
  function pick(r, a){ return a[Math.floor(r() * a.length)]; }
  function choiceStep(key, label, practice, opts, extra){
    var s = { key: key, kind: 'choice', label: label, practice: practice, options: [], why: [], correct: -1 };
    opts.forEach(function(o, i){ s.options.push(o.t); s.why.push(o.why); if(o.ok) s.correct = i; });
    if(extra) for(var k in extra) s[k] = extra[k];
    return s;
  }
  var D_ALL = ['cr', 'block', 'pairs', 'obs'];
  var D_NAME = { cr: 'Completely randomized design', block: 'Randomized block design', pairs: 'Matched pairs design', obs: 'Observational study, not an experiment' };
  function studyText(c, d, r){
    var n = c.N, h = n / 2;
    if(d === 'cr') return 'The researchers randomly assign ' + h + ' of the ' + n + ' ' + c.units + ' to ' + c.tA + ' and the other ' + h + ' to ' + c.tB + ', then ' + c.measure + '.';
    if(d === 'block') return 'The researchers first separate the ' + n + ' ' + c.units + ' by ' + c.blockVar + ' (' + list(c.blocks) + '). Within each group, half are randomly assigned to ' + c.tA + ' and half to ' + c.tB + '. Then they ' + c.measure + '.';
    if(d === 'pairs') return c.selfPairs ? c.selfPairs : 'The researchers put the ' + n + ' ' + c.units + ' into ' + h + ' pairs of ' + c.pairsHow + '. In each pair, a coin flip decides which ' + c.unit + ' gets ' + c.tA + '; the other gets ' + c.tB + '. Then they ' + c.measure + '.';
    return c.obs;
  }
  function genDesign(r, ctx){
    var d = ctx.selfPairs ? 'pairs' : pick(r, D_ALL);
    var WHY = {
      cr: 'Every ' + ctx.unit + ' was assigned at random to a treatment in one step, with no grouping first.',
      block: 'The ' + ctx.units + ' were grouped by ' + ctx.blockVar + ' first, and random assignment happened separately inside each group (block).',
      pairs: ctx.selfPairs ? 'Each ' + ctx.unit + ' gets both treatments, and chance decides which way round: each ' + ctx.unit + ' is its own pair.' : 'The ' + ctx.units + ' were paired by ' + ctx.pairsHow + ', and chance decided which one in each pair got each treatment.',
      obs: 'Nobody imposed the treatments: the ' + ctx.units + ' ended up in groups on their own. That is an observational study.'
    };
    var NOT = {
      cr: 'A completely randomized design assigns every ' + ctx.unit + ' at random in one step. Here the assignment was ' + (d === 'obs' ? 'not random at all.' : 'done within groups.'),
      block: 'A block design groups similar ' + ctx.units + ' first and randomizes within each group.' + (d === 'pairs' ? ' Pairs are blocks of size two, so matched pairs is the more exact name here.' : ''),
      pairs: 'Matched pairs randomizes within pairs of similar ' + ctx.units + ' (or each ' + ctx.unit + ' gets both treatments).',
      obs: 'Here the researchers did impose the treatments at random, so it is an experiment.'
    };
    var opts = D_ALL.map(function(k){ return { t: D_NAME[k], ok: k === d, why: k === d ? WHY[k] : NOT[k] }; });
    var steps = [choiceStep('design', 'What kind of study is this?', '2.A', opts)], sol = [D_NAME[d] + '. ' + WHY[d]];
    if(d === 'block'){
      steps.push(choiceStep('blockwhy', 'Why block by ' + ctx.blockVar + '?', '2.B', [
        { t: cap(ctx.blockVar) + ' likely affects ' + ctx.response + ', so comparing treatments within each block removes that variation', ok: true, why: 'Blocks hold the other variable steady, so the treatment comparison is more precise.' },
        { t: 'To make the sample random', ok: false, why: 'Blocking is about assignment, not about choosing who is in the study.' },
        { t: 'So the results can be generalized to everyone', ok: false, why: 'Generalizing needs random sampling, which blocking does not give.' },
        { t: 'Because ' + ctx.blockVar + ' is the explanatory variable', ok: false, why: 'The explanatory variable is the treatment (' + ctx.explanatory + '). The block variable is another variable that is controlled.' }
      ]));
      sol.push('Blocking by ' + ctx.blockVar + ' compares like with like: ' + ctx.blockWhy);
    } else if(d === 'pairs'){
      steps.push(choiceStep('pairwhy', 'What is the advantage of this design over a completely randomized one?', '2.B', [
        { t: 'Each comparison is between very similar ' + (ctx.selfPairs ? 'conditions (the same ' + ctx.unit + ')' : ctx.units) + ', so differences in ' + ctx.response + ' are more likely due to the treatment', ok: true, why: 'Pairing removes the unit to unit variation from the comparison.' },
        { t: 'It needs no random assignment', ok: false, why: 'Matched pairs still randomizes, within each pair.' },
        { t: 'It lets the results generalize to a larger population', ok: false, why: 'Only random sampling does that.' },
        { t: 'It removes the need for a control group', ok: false, why: 'Both treatments are still compared.' }
      ]));
      sol.push('Pairing compares like with like, so the treatment difference stands out from the natural variation.');
    } else if(d === 'obs'){
      steps.push(choiceStep('conclude', 'Can this study show that ' + ctx.tA + ' causes a change in ' + ctx.response + '?', '4.B', [
        { t: 'No: the groups formed on their own, so ' + ctx.lurk + ' could explain the difference', ok: true, why: 'Without random assignment, a confounding variable may differ between the groups.' },
        { t: 'Yes, if the difference is large', ok: false, why: 'A large difference can still come from a confounding variable.' },
        { t: 'Yes, because the ' + ctx.units + ' were measured carefully', ok: false, why: 'Careful measurement does not remove confounding.' },
        { t: 'No, because the sample is too small', ok: false, why: 'Size is not the issue: without random assignment, no cause and effect conclusion.' }
      ]));
      sol.push('Observational: ' + ctx.lurk + ' is a possible confounding variable, so no cause and effect conclusion.');
    } else {
      steps.push(choiceStep('purpose', 'What does random assignment do here?', '2.B', [
        { t: 'It makes the groups roughly alike in every other variable, so a difference in ' + ctx.response + ' can be attributed to the treatment', ok: true, why: 'Chance spreads ' + ctx.lurk + ' and everything else evenly between the groups, on average.' },
        { t: 'It lets the results generalize to all ' + ctx.population, ok: false, why: 'That needs random SAMPLING. Random assignment allows cause and effect.' },
        { t: 'It guarantees the two groups are identical', ok: false, why: 'Chance gives groups that are similar on average, not identical.' },
        { t: 'It removes the need to measure ' + ctx.response, ok: false, why: 'The response is still measured in both groups.' }
      ]));
      sol.push('Random assignment balances other variables between the groups on average, which is what allows a cause and effect conclusion.');
    }
    return { ctx: ctx.id, topic: d === 'obs' ? 'investigative-questions' : ctx.topic, type: 'design', text: '<p>' + ctx.lead + ' ' + studyText(ctx, d, r) + '</p>', steps: steps, solution: sol, figure: { design: d } };
  }

  function genVariables(r, ctx){
    var text = '<p>' + ctx.lead + ' ' + studyText(ctx, ctx.selfPairs ? 'pairs' : 'cr', r) + '</p>';
    var steps = [
      choiceStep('explanatory', 'What is the explanatory variable?', '2.A', [
        { t: cap(ctx.explanatory), ok: true, why: 'The explanatory variable is what the researchers change on purpose: ' + ctx.explanatory + '.' },
        { t: cap(ctx.response), ok: false, why: 'That is what is measured, the response variable.' },
        { t: cap(ctx.blockVar), ok: false, why: 'That is another variable that may matter, not the one the researchers set.' },
        { t: 'The ' + ctx.N + ' ' + ctx.units, ok: false, why: 'Those are the experimental units, not a variable.' }
      ]),
      choiceStep('response', 'What is the response variable?', '2.A', [
        { t: cap(ctx.response), ok: true, why: 'The response is the outcome measured on every unit: ' + ctx.response + '.' },
        { t: cap(ctx.explanatory), ok: false, why: 'That is set by the researchers, the explanatory variable.' },
        { t: 'Which group each ' + ctx.unit + ' is in', ok: false, why: 'Group is the treatment, which is the explanatory side.' },
        { t: cap(ctx.blockVar), ok: false, why: 'That is not what the study measures as its outcome.' }
      ]),
      choiceStep('units', 'What are the experimental units?', '2.A', [
        { t: 'The ' + ctx.N + ' ' + ctx.units, ok: true, why: 'Units are what the treatments are applied to.' + (ctx.human ? ' People as units are called subjects.' : '') },
        { t: cap(ctx.tA) + ' and ' + ctx.tB, ok: false, why: 'Those are the treatments.' },
        { t: 'All ' + ctx.population, ok: false, why: 'That is a population. The units are the ' + ctx.units + ' actually in the study.' },
        { t: 'The measurements of ' + ctx.response, ok: false, why: 'Those are the values of the response variable.' }
      ]),
      choiceStep('treatments', 'What are the treatments?', '2.A', [
        { t: cap(ctx.tA) + ' and ' + ctx.tB, ok: true, why: 'A treatment is a specific condition applied to the units. ' + (ctx.control ? cap(ctx.tB) + ' is the control.' : '') },
        { t: 'Only ' + ctx.tA, ok: false, why: 'Both conditions compared are treatments, including the comparison (control) one.' },
        { t: 'The ' + ctx.N + ' ' + ctx.units, ok: false, why: 'Those are the units.' },
        { t: cap(ctx.response), ok: false, why: 'That is the response.' }
      ])
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'variables', text: text, steps: steps,
      solution: ['Explanatory variable: ' + ctx.explanatory + '.', 'Response variable: ' + ctx.response + '.', 'Experimental units: the ' + ctx.N + ' ' + ctx.units + '.', 'Treatments: ' + ctx.tA + ' and ' + ctx.tB + '.'] };
  }

  function genScope(r, ctx){
    var sampled = r() < 0.5, assigned = r() < 0.6;
    var who = sampled ? ctx.sampleRandom : ctx.sampleVol;
    var how = assigned ? (ctx.assignText || 'Each is randomly assigned to ' + ctx.tA + ' or ' + ctx.tB + '.') : ctx.selfSelect;
    var text = '<p>' + ctx.lead + ' ' + who + ' ' + how + ' ' + result(ctx) + '</p>';
    var cause = choiceStep('cause', 'Can we conclude that ' + ctx.tA + ' caused the difference?', '4.B', [
      { t: 'Yes, because the treatments were randomly assigned', ok: assigned, why: assigned ? 'Random assignment makes the groups alike in other variables, so the treatment is the likely cause.' : 'There was no random assignment here.' },
      { t: 'No, because the treatments were not randomly assigned', ok: !assigned, why: !assigned ? 'The ' + ctx.units + ' chose their group, so ' + ctx.lurk + ' could explain the difference.' : 'They were randomly assigned here.' },
      { t: 'Yes, because the ' + ctx.units + ' were randomly selected', ok: false, why: 'Random selection allows generalizing, not cause and effect. Cause needs random ASSIGNMENT.' },
      { t: 'No, because the ' + ctx.units + ' were not randomly selected', ok: false, why: 'Random selection is about generalizing. Cause and effect depends on random assignment.' }
    ], { fixed: true });
    var gen = choiceStep('generalize', 'To whom can the result be generalized?', '4.B', [
      { t: 'To all ' + ctx.population, ok: sampled, why: sampled ? 'The ' + ctx.units + ' were a random sample of ' + ctx.population + ', so the result extends to them.' : 'The ' + ctx.units + ' were not randomly selected from all ' + ctx.population + '.' },
      { t: 'Only to ' + ctx.units + ' like the ones in the study', ok: !sampled, why: !sampled ? 'These ' + ctx.units + ' were not randomly selected, so they may differ from the population: the result is limited to ' + ctx.units + ' like these.' : 'Here the units were randomly sampled, so we can go further.' },
      { t: 'To everyone, because the groups were randomly assigned', ok: false, why: 'Random assignment allows cause and effect, not generalizing.' },
      { t: 'To no one, because the study is too small', ok: false, why: 'Scope depends on how units were chosen, not on size alone.' }
    ], { fixed: true });
    return { ctx: ctx.id, topic: 'investigative-questions', type: 'scope', text: text, steps: [cause, gen],
      solution: [(assigned ? 'Random assignment, so a cause and effect conclusion is reasonable.' : 'No random assignment, so no cause and effect: ' + ctx.lurk + ' could be confounding.'), (sampled ? 'Random sampling, so the result generalizes to all ' + ctx.population + '.' : 'No random sampling, so the result applies only to ' + ctx.units + ' like these.')],
      figure: { sampled: sampled, assigned: assigned } };
  }

  function genProcedure(r, ctx){
    var N = ctx.N, h = N / 2, U = ctx.units;
    var steps = [
      choiceStep('label', 'Step 1: <b>label</b>.', '2.B', [
        { t: 'Label the ' + U + ' from 1 to ' + N + '.', ok: true, why: 'Each unit needs its own number.' },
        { t: 'Label the ' + U + ' 1 and 2 for the two treatments.', ok: false, why: 'That decides treatments before anything random happens. Label every unit 1 to ' + N + '.' },
        { t: 'Label the first ' + h + ' ' + U + ' to arrive.', ok: false, why: 'Order of arrival is not random. Label all ' + N + '.' },
        { t: 'No labels are needed.', ok: false, why: 'Random numbers can only choose units that have numbers.' }
      ]),
      choiceStep('generate', 'Step 2: <b>generate</b>.', '2.B', [
        { t: 'Use a random number generator to produce ' + h + ' different integers from 1 to ' + N + ', ignoring repeats.', ok: true, why: 'Exactly ' + h + ' different labels, one group, from the whole range.' },
        { t: 'Use a random number generator to produce integers from 1 to ' + N + '.', ok: false, why: 'Say how many (' + h + '), and that repeats are ignored.' },
        { t: 'Flip a coin for each ' + ctx.unit + ': heads gets ' + ctx.tA + '.', ok: false, why: 'Random, but the groups may not have ' + h + ' each. The step should give equal groups.' },
        { t: 'Use a random number generator to produce ' + h + ' integers from 1 to ' + h + '.', ok: false, why: 'Integers 1 to ' + h + ' can only reach half the labels.' }
      ]),
      choiceStep('assign', 'Step 3: <b>assign</b>.', '2.B', [
        { t: 'The ' + U + ' with those labels get ' + ctx.tA + '; the other ' + h + ' get ' + ctx.tB + '.', ok: true, why: 'Tie the numbers back to the units and say what everyone else gets.' },
        { t: 'The ' + U + ' with those labels get ' + ctx.tA + '.', ok: false, why: 'Say what the other ' + h + ' get: ' + ctx.tB + '.' },
        { t: 'The researcher decides who gets ' + ctx.tA + ' from the list.', ok: false, why: 'A person choosing undoes the randomization.' },
        ctx.human ? { t: 'The ' + U + ' who want ' + ctx.tA + ' get it.', ok: false, why: 'Letting units choose is not random assignment.' }
          : { t: 'The first ' + h + ' ' + U + ' on the list get ' + ctx.tA + '.', ok: false, why: 'The order of a list is not random: whatever put those ' + U + ' first could also affect ' + ctx.response + '.' }
      ]),
      choiceStep('why', 'Why randomize at all?', '2.B', [
        { t: 'To make the groups roughly alike in other variables, such as ' + ctx.lurk + ', so the treatment can be called the cause', ok: true, why: 'That is the purpose of random assignment.' },
        { t: 'So the results apply to all ' + ctx.population, ok: false, why: 'That is random SAMPLING. Random assignment is about cause and effect.' },
        { t: 'To make the experiment double blind', ok: false, why: 'Blinding is about who knows the treatments, not how they are assigned.' },
        { t: 'To get more ' + U + ' into the study', ok: false, why: 'Randomizing does not change how many units there are.' }
      ])
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'procedure', text: '<p>' + ctx.lead + ' The researchers have ' + N + ' ' + U + ' and want ' + h + ' in each treatment group: ' + ctx.tA + ' and ' + ctx.tB + '. Build the random assignment one step at a time.</p>', steps: steps,
      solution: ['Label the ' + U + ' from 1 to ' + N + '.', 'Generate ' + h + ' different random integers from 1 to ' + N + ' (ignore repeats).', 'Those ' + U + ' get ' + ctx.tA + '; the remaining ' + h + ' get ' + ctx.tB + '.', 'Randomizing balances other variables, like ' + ctx.lurk + ', between the groups.'] };
  }

  function result(ctx){ return ctx.result || 'The group that got ' + ctx.tA + ' shows a clearly greater ' + ctx.response + '.'; }
  function genConfound(r, ctx){
    if(ctx.blind && r() < 0.5) return genBlind(r, ctx);
    var steps = [choiceStep('confound', 'Which is a confounding variable here?', '2.A', [
      { t: cap(ctx.lurk), ok: true, why: 'It is related to which group a ' + ctx.unit + ' is in AND to ' + ctx.response + ', so its effect is mixed up with the treatment’s.' },
      { t: cap(ctx.response), ok: false, why: 'That is the response variable itself.' },
      { t: cap(ctx.explanatory), ok: false, why: 'That is the explanatory variable.' },
      { t: 'The number of ' + ctx.units, ok: false, why: 'Size is not a variable that differs between the groups.' }
    ])];
    return { ctx: ctx.id, topic: 'investigative-questions', type: 'confound', text: '<p>' + ctx.lead + ' ' + ctx.obs + ' ' + result(ctx) + '</p>', steps: steps, solution: ['Confounding: ' + ctx.obsWhy] };
  }
  function genBlind(r, ctx){
    var b = ctx.blind;
    var steps = [choiceStep('blind', 'How is this experiment blinded?', '2.B', [
      { t: 'Double blind', ok: b.kind === 'double', why: b.kind === 'double' ? 'Neither the subjects nor the people measuring the response know who got which treatment.' : 'Double blind needs BOTH the subjects and the evaluators not to know.' },
      { t: 'Single blind', ok: b.kind === 'single', why: b.kind === 'single' ? 'One side does not know (' + b.who + '), the other does.' : 'Single blind means exactly one side does not know.' },
      { t: 'Not blind', ok: false, why: 'Here at least one side does not know the treatments.' },
      { t: 'It cannot be blind with only two treatments', ok: false, why: 'Blinding works with any number of treatments.' }
    ], { fixed: true })];
    steps.push(choiceStep('blindwhy', 'Why does the blinding matter here?', '2.B', [
      { t: cap(b.why), ok: true, why: 'Knowing the treatment can change behavior or judgment, which would mix with the treatment effect.' },
      { t: 'It makes the groups the same size', ok: false, why: 'Group sizes come from the assignment, not from blinding.' },
      { t: 'It lets the results generalize to all ' + ctx.population, ok: false, why: 'Generalizing needs random sampling.' },
      { t: 'It replaces random assignment', ok: false, why: 'Blinding and random assignment do different jobs; good experiments use both.' }
    ]));
    return { ctx: ctx.id, topic: ctx.topic, type: 'confound', text: '<p>' + ctx.lead + ' ' + studyText(ctx, 'cr', r) + ' ' + b.text + '</p>', steps: steps,
      solution: [(b.kind === 'double' ? 'Double blind' : 'Single blind') + ': ' + b.why + '.', b.placebo ? 'The placebo pill looks the same as the real one, so taking a pill is not what differs between the groups.' : 'Blinding keeps expectations from mixing with the treatment effect.'] };
  }

  var GEN = { design: genDesign, variables: genVariables, scope: genScope, procedure: genProcedure, confound: genConfound };
  var TYPES = ['design', 'variables', 'scope', 'procedure', 'confound'];
  function generate(r, ctx, type){
    var ok = (ctx.types || TYPES).filter(function(t){ return GEN[t]; });
    var t = type && ok.indexOf(type) > -1 ? type : pick(r, ok);
    return GEN[t](r, ctx);
  }

  M.register('designRandomizer', {
    DESIGNS: DESIGNS, NAME: NAME, SHORT: SHORT, TYPES: TYPES, D_NAME: D_NAME,
    units: units, assign: assign, run: run, many: many, mean: mean, sd: sd, generate: generate
  });
})();
