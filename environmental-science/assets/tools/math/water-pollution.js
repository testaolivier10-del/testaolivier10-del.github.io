/* Water pollution model: ApEnvMath.waterPollution (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/apenv-briefs/t4.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/water-pollution.mjs)
   and the test (scripts/test/apenv-tool-water-pollution.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/water-pollution.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/water-pollution.js.

   The science (CED 8.5 eutrophication, 8.6 thermal pollution, 8.11 sewage
   treatment), kept in one place so the picture, the graph and the drills
   agree:
     OSAT        dissolved oxygen at saturation in fresh water at sea level,
                 mg/L, every 5 °C (USGS DO tables, rounded to 0.1 mg/L).
                 Warmer water holds less gas: thermal pollution is heat.
     osat(T)     read off that table by straight lines between its points
     lake(level, T)
                 a small daily model of one lake after one pulse of
                 fertilizer runoff: nutrients feed an algal bloom, the algae
                 die, decomposers (aerobic bacteria) respire as they break the
                 dead algae down, and the bottom water's dissolved oxygen
                 falls. Reaeration pulls the oxygen back toward saturation,
                 which is lower in warm water. Units: day, mg/L for oxygen,
                 relative units for nutrients, algae and dead matter (an
                 explanatory model, not a forecast; Details says so).
                 -> { days, O, A, D, N, base, stages, min, minDay, peakDay, hypoxicDays }
     HYPOXIC     2 mg/L: the usual line for a dead zone (NOAA, EPA)
     CHAIN       the six links: nutrients, bloom, die-off, decomposition,
                 oxygen falls, dead zone
     SEWAGE      primary, secondary, tertiary, disinfection: what each
                 removes, as typical rounded percentages of the raw load left
     Every number a drill shows comes from ApEnvCalc (M.Calc()), never typed.
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, given, figure }
     types: chain (read the oxygen graph and the cause), dochange (percent
     change in dissolved oxygen: setup, then answer with unit), thermal (read
     saturation off the table, the percent drop, why), sewage (BOD through two
     stages, which stage removes what), load (a nutrient load in kg/day by
     dimensional analysis). */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  function C(){ return M.Calc(); }
  function E(recipe){ return C().evaluate(recipe); }

  var OSAT = [[0, 14.6], [5, 12.8], [10, 11.3], [15, 10.1], [20, 9.1], [25, 8.3], [30, 7.6], [35, 7.0]];
  function osat(T){
    if(T <= OSAT[0][0]) return OSAT[0][1];
    for(var i = 1; i < OSAT.length; i++){
      var a = OSAT[i - 1], b = OSAT[i];
      if(T <= b[0]) return a[1] + (T - a[0]) * (b[1] - a[1]) / (b[0] - a[0]);
    }
    return OSAT[OSAT.length - 1][1];
  }
  var HYPOXIC = 2;

  /* The lake. level 0 to 5 (fertilizer runoff: none to extreme), T in °C.
     Daily values from a fixed-step integration (dt 0.02 day), so the same
     inputs always give the same curve. */
  var LAKE_DAYS = 60;
  function lake(level, T){
    level = Math.max(0, Math.min(5, +level || 0));
    T = T == null ? 20 : T;
    var Os = osat(T), fT = Math.pow(1.07, T - 20), K = 0.15, y = 0.1, dt = 0.02, per = Math.round(1 / dt);
    var N = 0.1 + level, A = 0.4, D = 0.4, O = Os * 0.92;
    var days = [], Os_ = [], As = [], Ds = [], Ns = [];
    for(var i = 0; i <= LAKE_DAYS * per; i++){
      if(i % per === 0){ days.push(i / per); Os_.push(O); As.push(A); Ds.push(D); Ns.push(N); }
      var lim = N / (N + K);
      var grow = fT * lim * A * (1 - A / 60);
      var die = (0.04 + 0.5 * (1 - lim)) * A;
      var dec = 0.12 * fT * D;
      N += (-y * grow + 0.5 * y * dec) * dt; if(N < 0) N = 0;
      A += (grow - die) * dt;
      D += (die - dec) * dt;
      O += (0.12 * (Os - O) - 0.55 * dec) * dt; if(O < 0) O = 0;
    }
    var r = { level: level, T: T, osat: Os, days: days, O: Os_, A: As, D: Ds, N: Ns };
    var mi = 0, pa = 0, pd = 0;
    for(var k = 1; k < days.length; k++){ if(Os_[k] < Os_[mi] - 1e-9) mi = k; if(As[k] > As[pa]) pa = k; if(Ds[k] > Ds[pd]) pd = k; }
    r.min = Os_[mi]; r.minDay = days[mi]; r.peakDay = days[pa]; r.peakA = As[pa]; r.deadDay = days[pd];
    r.hypoxicDays = Os_.filter(function(o){ return o < HYPOXIC; }).length;
    r.stages = stagesOf(r);
    return r;
  }
  /* When each link of the chain is reached (the day), or null if it never
     is: the picture's chain strip and the "Start here" caption use it. */
  function stagesOf(r){
    if(r.level <= 0) return [null, null, null, null, null, null];
    var A0 = r.A[0], first = function(f){ for(var i = 0; i < r.days.length; i++) if(f(i)) return r.days[i]; return null; };
    var bloom = first(function(i){ return r.A[i] > 3 * A0; });
    var die = bloom == null ? null : r.peakDay;
    var dec = die == null ? null : first(function(i){ return r.days[i] > die && r.D[i] > 0.5 * r.D[r.days.indexOf(r.deadDay)]; });
    var fall = first(function(i){ return r.O[i] < r.osat * 0.92 - 1.5; });
    var dead = first(function(i){ return r.O[i] < HYPOXIC; });
    var out = [0, bloom, die, dec, fall, dead];
    for(var k = 1; k < out.length; k++) if(out[k] != null && out[k - 1] != null && out[k] < out[k - 1]) out[k] = out[k - 1];
    for(var j = 1; j < out.length; j++) if(out[j - 1] == null) out[j] = null;
    return out;
  }
  /* The link reached by a given day (index 0 to 5), or -1 for a lake with no runoff. */
  function stageAt(r, day){
    var s = r.stages, at = -1;
    for(var i = 0; i < s.length; i++) if(s[i] != null && day >= s[i]) at = i;
    return at;
  }
  var CHAIN = [
    { k: 'nutrients', name: 'Nutrients', long: 'Fertilizer runoff adds nitrate and phosphate, nutrients that usually limit algae.' },
    { k: 'bloom', name: 'Algal bloom', long: 'With the limiting nutrient supplied, algae multiply fast and turn the surface green.' },
    { k: 'dieoff', name: 'Algae die', long: 'The bloom shades itself and uses up the nutrients, so huge numbers of algae die and sink.' },
    { k: 'decomp', name: 'Decomposition', long: 'Aerobic bacteria break down the dead algae and use dissolved oxygen as they respire.' },
    { k: 'dofall', name: 'Oxygen falls', long: 'Decomposers use oxygen faster than the air and the remaining algae can replace it.' },
    { k: 'dead', name: 'Dead zone', long: 'Below 2 mg/L (hypoxic) fish and other animals suffocate or leave: a dead zone.' }
  ];

  /* Sewage treatment, typical rounded percentages of the raw load still in
     the water after each stage (EPA, "How Wastewater Treatment Plants
     Work"; real plants vary). */
  var SEWAGE = {
    parts: [
      { k: 'solids', name: 'Solids' },
      { k: 'bod', name: 'Organic matter (BOD)' },
      { k: 'nutrients', name: 'Nitrogen and phosphorus' },
      { k: 'pathogens', name: 'Pathogens' }
    ],
    stages: [
      { k: 'raw', name: 'Raw sewage', left: { solids: 100, bod: 100, nutrients: 100, pathogens: 100 }, how: 'Water from toilets, sinks and drains: solids, organic matter that bacteria can break down, nitrogen and phosphorus, and pathogens.' },
      { k: 'primary', name: 'Primary', left: { solids: 40, bod: 65, nutrients: 85, pathogens: 75 }, how: 'Physical: screens catch large objects and grit settles; in settling tanks solids sink as sludge. About 60% of the solids and a third of the organic matter are removed.' },
      { k: 'secondary', name: 'Secondary', left: { solids: 15, bod: 15, nutrients: 70, pathogens: 10 }, how: 'Biological: air is bubbled in so aerobic bacteria break down the dissolved organic matter. About 85% of the organic matter is gone after this stage.' },
      { k: 'tertiary', name: 'Tertiary', left: { solids: 5, bod: 5, nutrients: 15, pathogens: 5 }, how: 'Extra (ecological or chemical) treatment that removes nitrogen and phosphorus, so the outflow does not feed algae downstream.' },
      { k: 'disinfect', name: 'Disinfection', left: { solids: 5, bod: 5, nutrients: 15, pathogens: 0.01 }, how: 'Chlorine, ultraviolet light or ozone kills the remaining pathogens before the water is released.' }
    ]
  };

  /* ----------------------------------------------------------- drills */
  var SK = { bloom: '1.B', cause: '1.B', lowest: '5.A', lag: '5.C', dead: '5.C', setup: '6.B', answer: '6.C', hyp: '5.C', read: '5.A', why: '1.C',
    after1: '6.C', after2: '6.B', after2a: '6.C', stage: '1.B', loadset: '6.B', load: '6.C', reduce: '7.F' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '6.B' }; for(var k in o) s[k] = o[k]; return s; }
  function num(key, label, answer, d, o){
    o = o || {};
    var abs = Math.max(o.abs || 0, 0.6 * Math.pow(10, -d));
    return step(key, label, { kind: 'num', d: d, unit: o.unit, hint: o.hint, cell: M.cell(answer, 1e-6, o.mistakes || [], abs) });
  }
  function choice(key, label, opts){
    return step(key, label, { kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 });
  }
  // A mistake that would read as the key (a 50% cut: removed = left) is dropped.
  function unit(key, label, answer, u, o){
    o = o || {};
    var ms = (o.mistakes || []).filter(function(m){ return isFinite(m.value) && !M.near(m.value, answer, 0.03, 0.06); });
    return step(key, label, { kind: 'unit', hint: o.hint, cell: M.unitCell(answer, u, { mistakes: ms.length ? ms : undefined, places: o.places, units: o.units }) });
  }
  function setup(key, label, expr, o){ o = o || {}; return step(key, label, { kind: 'setup', hint: o.hint, cell: M.setupCell(expr, o) }); }
  function between(r, ab, d){ return M.round(ab[0] + r() * (ab[1] - ab[0]), d); }
  function f(x, d){ return M.fixed(x, d); }
  function fm(x, d){ return M.minus(M.fixed(x, d)); }
  function big(x){ return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function pc(old, nw){ return E({ fn: 'percentChange', args: [old, nw] }); }

  function genChain(r, c){
    var level = r.pick(c.levels || [3, 4, 5]), T = r.pick(c.temps || [20, 22, 25]), run = lake(level, T);
    var series = run.days.map(function(d, i){ return [d, M.round(run.O[i], 1)]; });
    var algae = run.days.map(function(d, i){ return [d, M.round(run.A[i], 1)]; });
    var mins = E({ fn: 'min', args: series.map(function(p){ return p[1]; }) });
    var aPeak = 0, oLow = 0;
    algae.forEach(function(p, i){ if(p[1] > algae[aPeak][1]) aPeak = i; });
    series.forEach(function(p, i){ if(p[1] < series[oLow][1]) oLow = i; });
    var hyp = mins < HYPOXIC;
    var text = '<p>' + c.lead + ' The graph shows the dissolved oxygen (DO) in the bottom water for the ' + LAKE_DAYS + ' days after a heavy rain washes fertilizer in, with the algae drawn behind it.</p>';
    var steps = [
      choice('bloom', 'Which change comes first after the fertilizer arrives?', [
        ['The algae multiply into a bloom.', 'Right. Nitrate and phosphate are the nutrients that usually limit algae, so the algae grow first; everything after follows from that.'],
        ['Dissolved oxygen falls at once.', 'Not at once: the graph stays near saturation for the first days. The oxygen falls later, when dead algae are decomposed.'],
        ['The nitrate poisons the fish.', 'At these levels the harm is indirect: the nutrients feed algae, and the chain ends with too little oxygen.'],
        ['The water warms up.', 'That is thermal pollution, which is heat. Fertilizer adds nutrients, not heat.']
      ]),
      num('lowest', 'Read the graph: what is the lowest dissolved oxygen in the bottom water?', mins, 1, { unit: 'mg/L', abs: 0.35, hint: 'To the nearest 0.1 mg/L. Read the bottom of the blue curve.' }),
      choice('lag', 'The oxygen low comes about ' + Math.max(1, Math.round(run.minDay - run.peakDay)) + ' days after the algae peak. Why the delay?', [
        ['The algae must die and sink before decomposers can break them down, and decomposition takes days.', 'Right. Oxygen falls while bacteria respire as they decompose the dead algae, so the low lags the bloom.'],
        ['Living algae use up the oxygen at night, and that takes days to add up.', 'Living algae make more oxygen than they use. The big drop comes from decomposing the dead bloom.'],
        ['Oxygen dissolves slowly, so the graph is just slow to react.', 'The curve follows what uses oxygen. Here that is decomposition, which starts only after the algae die.'],
        ['The fertilizer reacts with the oxygen once it sinks.', 'Fertilizer does not use up oxygen by itself. It feeds the algae whose decomposition does.']
      ]),
      choice('dead', hyp ? 'At its low point, is the bottom water a dead zone?' : 'At its low point, is the bottom water a dead zone?', hyp ? [
        ['Yes: it falls below 2 mg/L, so it is hypoxic and most fish die or leave.', 'Right. Below about 2 mg/L water is called hypoxic: a dead zone.'],
        ['No: there is still some oxygen in the water.', 'A dead zone does not need zero oxygen. Below about 2 mg/L most fish and shellfish cannot survive.'],
        ['No: dead zones only happen in the ocean.', 'Lakes, rivers and bays can all have hypoxic dead zones.'],
        ['Yes: any drop in oxygen makes a dead zone.', 'Some drop is normal. The line for a dead zone is about 2 mg/L.']
      ] : [
        ['No: it stays above 2 mg/L, so the water is stressed but not hypoxic.', 'Right. The oxygen falls, but not below the 2 mg/L hypoxic line, so this is not a dead zone yet.'],
        ['Yes: any drop in oxygen makes a dead zone.', 'Some drop is normal. A dead zone means hypoxic water, below about 2 mg/L.'],
        ['Yes: the algae bloom itself is the dead zone.', 'The bloom is the cause. The dead zone is the low-oxygen water that follows, below about 2 mg/L.'],
        ['No: dead zones only happen in the ocean.', 'Lakes and bays have them too. This one stays above 2 mg/L, which is why it is not a dead zone.']
      ])
    ];
    var sol = [
      'The chain: fertilizer adds nutrients → algal bloom → algae die → aerobic decomposers break them down and use oxygen → dissolved oxygen falls → below 2 mg/L, a dead zone.',
      'The lowest bottom-water DO on the graph is ' + f(mins, 1) + ' mg/L, on about day ' + series[oLow][0] + '; the algae peak on about day ' + algae[aPeak][0] + '.',
      hyp ? f(mins, 1) + ' mg/L is below 2 mg/L: hypoxic, a dead zone.' : f(mins, 1) + ' mg/L stays above 2 mg/L: stressed, not hypoxic.'
    ];
    return { ctx: c.id, topic: c.topic, type: 'chain', text: text, steps: steps, solution: sol,
      given: { level: level, T: T, series: series, algae: algae },
      figure: { kind: 'lake', series: series, algae: algae, osat: M.round(run.osat, 1), T: T } };
  }

  function genDoChange(r, c){
    var before = between(r, c.before || [7.5, 9.5], 1), after = between(r, c.after || [0.8, 3.5], 1);
    var ans = pc(before, after), hyp = after < HYPOXIC;
    var text = '<p>' + c.lead + ' In ' + (c.when0 || 'May') + ' the bottom water held ' + f(before, 1) + ' mg/L of dissolved oxygen. In ' + (c.when1 || 'August') + ', after an algal bloom died off, it held ' + f(after, 1) + ' mg/L.</p>';
    var key = '(' + f(after, 1) + ' - ' + f(before, 1) + ') / ' + f(before, 1) + ' * 100';
    var steps = [
      setup('setup', 'Write the setup for the percent change in dissolved oxygen, with brackets.', key, { mustUse: [f(before, 1), f(after, 1)], hint: 'Percent change = (new − old) / old × 100.',
        mistakes: [
          { expr: '(' + f(before, 1) + ' - ' + f(after, 1) + ') / ' + f(before, 1) + ' * 100', why: 'That is the percent decrease as a positive number. Percent change is new minus old, so a fall comes out negative.' },
          { expr: '(' + f(after, 1) + ' - ' + f(before, 1) + ') / ' + f(after, 1) + ' * 100', why: 'Divide by the old value (' + f(before, 1) + ' mg/L), the one you start from, not the new one.' }
        ] }),
      unit('answer', 'Now the answer with its unit.', ans, '%', { places: 1, hint: 'Round to 0.1. The unit is %.',
        mistakes: [{ value: E({ fn: 'mul', args: [ans, -1] }), why: 'The size is right, but dissolved oxygen fell, so the percent change is negative.' }, { value: E({ fn: 'div', args: [ans, 100] }), why: 'Multiply by 100 to turn the fraction into a percent.' }] }),
      choice('hyp', 'Which statement fits the ' + (c.when1 || 'August') + ' reading?', hyp ? [
        ['It is below 2 mg/L: hypoxic, a dead zone where most fish cannot live.', 'Right. ' + f(after, 1) + ' mg/L is below the 2 mg/L hypoxic line.'],
        ['It is still healthy, because some oxygen is left.', 'A dead zone does not need zero oxygen: below about 2 mg/L most animals cannot survive.'],
        ['The low oxygen was caused by warm water from the algae.', 'Algae do not heat the water. The oxygen was used up by decomposers breaking down the dead algae.'],
        ['The low oxygen means the algae are still growing fast.', 'Growing algae add oxygen. The low comes after they die and decompose.']
      ] : [
        ['It is stressed but above 2 mg/L, so not yet hypoxic.', 'Right. ' + f(after, 1) + ' mg/L is low, but not below the 2 mg/L hypoxic line.'],
        ['It is a dead zone, because oxygen fell by more than half.', 'A dead zone is defined by the level, below about 2 mg/L, not by the size of the drop.'],
        ['The low oxygen was caused by warm water from the algae.', 'Algae do not heat the water. Decomposers breaking down dead algae used the oxygen.'],
        ['The low oxygen means the algae are still growing fast.', 'Growing algae add oxygen. The low comes after they die and decompose.']
      ])
    ];
    var sol = [
      'Percent change = (new − old) / old × 100 = (' + f(after, 1) + ' − ' + f(before, 1) + ') / ' + f(before, 1) + ' × 100 = ' + fm(ans, 1) + '%.',
      'Negative, because the oxygen fell. ' + (hyp ? f(after, 1) + ' mg/L is below 2 mg/L: hypoxic.' : f(after, 1) + ' mg/L is above 2 mg/L: low but not hypoxic.')
    ];
    return { ctx: c.id, topic: c.topic, type: 'dochange', text: text, steps: steps, solution: sol,
      given: { before: before, after: after }, figure: { kind: 'bars', before: before, after: after, labels: [c.when0 || 'May', c.when1 || 'August'] } };
  }

  function genThermal(r, c){
    var t0 = r.pick(c.from || [10, 15]), dT = r.pick(c.rise || [10, 15]), t1 = t0 + dT;
    if(t1 > 35){ t1 = 35; }
    var d0 = osat(t0), d1 = osat(t1), ans = pc(d0, d1);
    var text = '<p>' + c.lead + ' Water that cooled the plant is returned to the ' + (c.water || 'river') + ', warming it from ' + t0 + ' °C to ' + t1 + ' °C. The graph gives the most dissolved oxygen fresh water can hold at each temperature (USGS values).</p>';
    var steps = [
      num('read', 'Read the graph: how much oxygen can the water hold at ' + t0 + ' °C?', d0, 1, { unit: 'mg/L', hint: 'Find ' + t0 + ' °C on the curve.', mistakes: [{ value: d1, why: 'That is the value at ' + t1 + ' °C. Start from the cooler water, before the plant warms it.' }] }),
      setup('setup', 'Write the setup for the percent change in oxygen the water can hold, ' + t0 + ' °C to ' + t1 + ' °C.', '(' + f(d1, 1) + ' - ' + f(d0, 1) + ') / ' + f(d0, 1) + ' * 100', { mustUse: [f(d0, 1), f(d1, 1)], hint: 'Read both values from the table first.',
        mistakes: [{ expr: '(' + f(d0, 1) + ' - ' + f(d1, 1) + ') / ' + f(d0, 1) + ' * 100', why: 'Percent change is new minus old, so a loss comes out negative.' },
          { expr: '(' + f(d1, 1) + ' - ' + f(d0, 1) + ') / ' + f(d1, 1) + ' * 100', why: 'Divide by the old value, the oxygen at ' + t0 + ' °C.' }] }),
      unit('answer', 'Now the answer with its unit.', ans, '%', { places: 1, hint: 'Round to 0.1.', mistakes: [{ value: E({ fn: 'mul', args: [ans, -1] }), why: 'Warmer water holds less oxygen, so the change is negative.' }] }),
      choice('why', 'Why does the warm water hold less oxygen?', [
        ['Gases dissolve less in warmer water, so oxygen leaves it.', 'Right. Thermal pollution is heat itself: warmer water holds less dissolved oxygen, while fish need more as their metabolism speeds up.'],
        ['The plant adds chemicals that use up the oxygen.', 'Thermal pollution is heat, not chemicals. The same water, only warmer, holds less oxygen.'],
        ['The heat kills the algae that make the oxygen.', 'The table is about how much gas the water can hold, whatever lives in it: warmer water holds less.'],
        ['Warm water carries nitrate that feeds algae.', 'That is nutrient pollution (eutrophication). Thermal pollution is the heat itself.']
      ])
    ];
    var sol = [
      'From the graph: ' + f(d0, 1) + ' mg/L at ' + t0 + ' °C and ' + f(d1, 1) + ' mg/L at ' + t1 + ' °C.',
      'Percent change = (' + f(d1, 1) + ' − ' + f(d0, 1) + ') / ' + f(d0, 1) + ' × 100 = ' + f(ans, 1) + '%.',
      'Gases are less soluble in warm water, so thermal pollution lowers dissolved oxygen just as fish need more of it.'
    ];
    return { ctx: c.id, topic: c.topic, type: 'thermal', text: text, steps: steps, solution: sol,
      given: { t0: t0, t1: t1, table: OSAT.map(function(p){ return p.slice(); }) }, figure: { kind: 'osat', t0: t0, t1: t1 } };
  }

  function genSewage(r, c){
    var bod = r.pick(c.bod || [180, 200, 220, 240, 250]), p1 = r.pick([30, 35]), p2 = r.pick([80, 85, 90]);
    var a1 = E({ fn: 'mul', args: [bod, { fn: 'sub', args: [1, { fn: 'div', args: [p1, 100] }] }] });
    var a2 = E({ fn: 'mul', args: [a1, { fn: 'sub', args: [1, { fn: 'div', args: [p2, 100] }] }] });
    var stage = r.pick(['nutrients', 'pathogens', 'organic', 'solids']);
    var Q = {
      nutrients: ['Which stage removes most of the nitrogen and phosphorus?', 'Tertiary treatment', 'Right. Tertiary treatment removes nitrogen and phosphorus, so the outflow does not cause eutrophication downstream.'],
      pathogens: ['Which stage is designed to kill pathogens?', 'Disinfection with chlorine, ozone or UV light', 'Right. Disinfection kills the bacteria and viruses left after the other stages.'],
      organic: ['In which stage do bacteria break down the dissolved organic matter?', 'Secondary treatment', 'Right. Secondary treatment is biological: aerobic bacteria break down organic matter while air is bubbled in.'],
      solids: ['Which stage lets solids settle out as sludge?', 'Primary treatment', 'Right. Primary treatment is physical: screens and settling tanks remove solids.']
    }[stage];
    var all = { 'Primary treatment': 'Primary treatment is physical: screens and settling remove solids, not dissolved nutrients or most pathogens.',
      'Secondary treatment': 'Secondary treatment is biological: bacteria break down organic matter. It removes only some nitrogen and phosphorus.',
      'Tertiary treatment': 'Tertiary treatment removes nitrogen and phosphorus; it is the extra step many plants skip.',
      'Disinfection with chlorine, ozone or UV light': 'Disinfection kills pathogens at the end; it does not remove solids or nutrients.' };
    var opts = [[Q[1], Q[2]]].concat(Object.keys(all).filter(function(k){ return k !== Q[1]; }).map(function(k){ return [k, all[k]]; }));
    var text = '<p>' + c.lead + ' Raw sewage enters with a BOD of ' + bod + ' mg/L. Primary treatment removes ' + p1 + '% of the BOD; secondary treatment removes ' + p2 + '% of what is left.</p>';
    var keyExpr = f(a1, 1) + ' * (1 - ' + (p2 / 100) + ')';
    var steps = [
      unit('after1', 'What is the BOD after primary treatment?', a1, 'mg/L', { hint: 'Removing ' + p1 + '% leaves ' + (100 - p1) + '%.', mistakes: [{ value: E({ fn: 'percentOf', args: [p1, bod] }), why: 'That is the BOD removed. The question asks what is left: ' + (100 - p1) + '% of ' + bod + ' mg/L.' }] }),
      setup('after2', 'Write the setup for the BOD left after secondary treatment.', keyExpr, { mustUse: [f(a1, 1)], hint: 'Start from the BOD after primary treatment, not the raw value.',
        mistakes: [{ expr: bod + ' * (1 - ' + (p2 / 100) + ')', why: 'Secondary treatment works on what primary treatment left (' + f(a1, 1) + ' mg/L), not on the raw ' + bod + ' mg/L.' },
          { expr: bod + ' * (1 - ' + (p1 / 100) + ' - ' + (p2 / 100) + ')', why: 'Percent removals in a row multiply; they do not add. Each stage removes a share of what is left.' },
          { expr: f(a1, 1) + ' * ' + (p2 / 100), why: 'That is the BOD removed in secondary treatment. Keep the ' + (100 - p2) + '% that is left.' }] }),
      unit('after2a', 'Now the answer with its unit.', a2, 'mg/L', { hint: 'Round to 0.1.' }),
      choice('stage', Q[0], opts)
    ];
    var sol = [
      'After primary: ' + bod + ' × (1 − ' + (p1 / 100) + ') = ' + f(a1, 1) + ' mg/L.',
      'After secondary: ' + f(a1, 1) + ' × (1 − ' + (p2 / 100) + ') = ' + M.fmt(a2, 3) + ' mg/L. Each stage removes a share of what is left, so the shares multiply.',
      Q[2]
    ];
    return { ctx: c.id, topic: c.topic, type: 'sewage', text: text, steps: steps, solution: sol,
      given: { bod: bod, p1: p1, p2: p2, stage: stage }, figure: { kind: 'plant', bod: bod, a1: a1, a2: a2, p1: p1, p2: p2 } };
  }

  function genLoad(r, c){
    var conc = r.pick(c.conc || [4, 6, 8, 10, 12]), flow = r.pick(c.flow || [200000, 250000, 400000, 500000]), cut = r.pick(c.cut || [40, 50, 60, 75]);
    var load = E({ fn: 'div', args: [{ fn: 'mul', args: [conc, flow] }, 1000000] });
    var after = E({ fn: 'mul', args: [load, { fn: 'sub', args: [1, { fn: 'div', args: [cut, 100] }] }] });
    var text = '<p>' + c.lead + ' The water carries ' + conc + ' mg/L of nitrate, and ' + big(flow) + ' L flow in each day. (1 kg = 1,000,000 mg.)</p>';
    var key = conc + ' mg/L * ' + flow + ' L/day * 1 kg / 1000000 mg';
    var steps = [
      setup('loadset', 'Write the setup for the nitrate load in kg per day, with units that cancel.', key, { unit: 'kg/day', mustUse: [String(conc), String(flow)], hint: 'mg/L × L/day gives mg/day; then × 1 kg / 1,000,000 mg.',
        mistakes: [{ expr: conc + ' mg/L * ' + flow + ' L/day', why: 'That is the load in mg per day. Convert to kg with × 1 kg / 1,000,000 mg.' }] }),
      unit('load', 'Now the load with its unit.', load, 'kg/day', { units: ['kg/d', 'kilograms per day'], places: 1, hint: 'Round to 0.1.' }),
      unit('reduce', c.fix + ' would cut the nitrate reaching the water by ' + cut + '%. How much nitrate would still arrive each day?', after, 'kg/day', { units: ['kg/d'], places: 1, hint: 'Cutting ' + cut + '% leaves ' + (100 - cut) + '%.',
        mistakes: [{ value: E({ fn: 'percentOf', args: [cut, load] }), why: 'That is the amount removed. The question asks what still arrives: ' + (100 - cut) + '% of the load.' }] })
    ];
    var sol = [
      conc + ' mg/L × ' + big(flow) + ' L/day × 1 kg / 1,000,000 mg = ' + M.fmt(load, 3) + ' kg/day (L and mg cancel).',
      'After a ' + cut + '% cut: ' + M.fmt(load, 3) + ' × (1 − ' + (cut / 100) + ') = ' + M.fmt(after, 3) + ' kg/day. ' + c.how
    ];
    return { ctx: c.id, topic: c.topic, type: 'load', text: text, steps: steps, solution: sol,
      given: { conc: conc, flow: flow, cut: cut }, figure: { kind: 'load', conc: conc, flow: flow, load: load, after: after, cut: cut, fix: c.fix } };
  }

  var GEN = { chain: genChain, dochange: genDoChange, thermal: genThermal, sewage: genSewage, load: genLoad };
  M.register('waterPollution', {
    OSAT: OSAT, osat: osat, HYPOXIC: HYPOXIC, LAKE_DAYS: LAKE_DAYS, lake: lake, stageAt: stageAt, CHAIN: CHAIN, SEWAGE: SEWAGE,
    TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var types = ctx.types || Object.keys(GEN);
      var ty = type && types.indexOf(type) > -1 ? type : r.pick(types);
      return GEN[ty](r, ctx);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
