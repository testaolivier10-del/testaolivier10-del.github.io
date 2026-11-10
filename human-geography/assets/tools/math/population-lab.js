/* Population lab model: ApHugMath.populationLab (docs/aphug-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T3, docs/aphug-briefs/t3.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/aphug-tool-checks/population-lab.mjs) and the
   test (scripts/test/aphug-tool-population-lab.test.mjs) run exactly this code.

   Loaded on human-geography/tools/population-lab.html after hug-calc.js
   (ApHugCalc), hug-grade.js and tools/hug-tool-math.js (M.rng, M.cell,
   M.unitCell), before tools/population-lab.js. Every country here is
   invented (Country P and its neighbors): no real figure goes stale (spec
   decision 7), and no real country is placed in a stage.

   Explore: one invented country you steer through the demographic transition
     STAGES[1..5]           typical teaching values for each stage of the
                            demographic transition model (CBR, CDR, TFR, life
                            expectancy) and what the stage means
     pyramid(tfr, e0)       -> { groups, male, female } (% of the population in
                            each 5-year group, 0-4 to 80+): a stable population
                            whose women average tfr children and whose people
                            survive to each age at life expectancy e0
     broad(pyr)             { young, work, old }: % under 15, 15-64, 65 and over
     shape(pyr)             'expansive' | 'stationary' | 'constrictive'
     stageOf(cbr, cdr)      ApHugCalc.transitionStage(...).stage: the stage the
                            rates are CONSISTENT with (words, never "is in")
     rni(cbr, cdr), doubling(rni), dependency(b)   ApHugCalc recipes
     needs(b)               what the age structure means for schools, jobs and care
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, figure, given }
       type 'rates' | 'growth' | 'dependency' | 'stage' | 'shape' | 'cohort'
     A figure is a spec for ApHugPlot (kind pyramid) or { kind: 'dtm', cbr, cdr }
     drawn by the page; it never gives a key away before its step. */
(function(G){
  'use strict';
  var M = G.ApHugMath;
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
  function pick(r, a){ return a[Math.floor(r() * a.length)]; }
  function between(r, ab, step){ var s = step || 1, n = Math.round((ab[1] - ab[0]) / s); return M.round(ab[0] + s * Math.floor(r() * (n + 1)), 6); }

  /* --------------------------------------------------------- pyramids */
  var GROUPS = ['0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80+'];
  /* Survival from birth to the start of each group, for a life expectancy e0:
     a child death share that grows as e0 falls, then an adult hazard that
     rises with age (Gompertz), scaled with e0. A teaching model, not a real
     life table (ported from AP® Environmental Science's age-structure
     trainer): it gives the textbook shapes and believable shares of children
     and of people 65 and over. */
  function survival(e0){
    var child = Math.max(0.006, Math.min(0.42, (80 - e0) / 180)), mod = Math.exp((76 - e0) / 18), out = [], s = 1;
    for(var i = 0; i < GROUPS.length; i++){
      out.push(s);
      var age = i * 5 + 2.5, h = 0.0006 * mod + 0.00007 * Math.exp(0.095 * age) * Math.min(3, mod);
      var q = i === 0 ? child : i === 1 ? child * 0.18 : 1 - Math.exp(-5 * h);
      s = s * (1 - Math.min(0.97, q));
    }
    return out;
  }
  /* A stable population: births grow at the rate set by the net reproduction
     rate (daughters per woman who survive to have children: TFR x 0.488 x the
     share surviving to about age 27), over a generation of about 29 years, so
     a group of age a holds survivors of births that were smaller by that
     growth. With high child deaths a high TFR gives slow growth (stage 1). */
  function nrr(tfr, e0){ var s = survival(e0); return tfr * 0.488 * (s[5] + s[6]) / 2; }
  function pyramid(tfr, e0){
    var surv = survival(e0), g = Math.log(nrr(tfr, e0)) / 29, w = [];
    for(var i = 0; i < GROUPS.length; i++){
      var n = surv[i] * Math.exp(-g * (i * 5 + 2.5));
      if(i === GROUPS.length - 1) n = n * 1.6; // 80+ spans more than 5 years
      w.push(n);
    }
    var tot = w.reduce(function(a, b){ return a + b; }, 0), male = [], female = [];
    w.forEach(function(v, i){
      // About 105 boys are born for every 100 girls; women outlive men.
      var share = v / tot * 100, m = Math.max(0.36, 1.05 / 2.05 - Math.max(0, i * 5 - 50) * 0.0035);
      male.push(M.round(share * m, 2)); female.push(M.round(share * (1 - m), 2));
    });
    return { groups: GROUPS.slice(), male: male, female: female, tfr: tfr, e0: e0 };
  }
  function bandSum(pyr, a, b){ var s = 0; for(var i = a; i <= b; i++) s += pyr.male[i] + pyr.female[i]; return s; }
  /* Under 15, 15-64, 65 and over (the dependency groups), in %. */
  function broad(pyr){ return { young: bandSum(pyr, 0, 2), work: bandSum(pyr, 3, 12), old: bandSum(pyr, 13, 16) }; }
  /* The base against the middle: expansive when the 0-14 groups are much
     wider than 25-39, constrictive when narrower, stationary in between. */
  var SHAPE_K = { hi: 1.25, lo: 0.92 };
  function baseRatio(pyr){ return (bandSum(pyr, 0, 2) / 3) / (bandSum(pyr, 5, 7) / 3); }
  function shape(pyr){ var k = baseRatio(pyr); return k > SHAPE_K.hi ? 'expansive' : k < SHAPE_K.lo ? 'constrictive' : 'stationary'; }
  var SHAPES = {
    expansive: { name: 'Expansive', look: 'a wide base that narrows quickly toward the top', means: 'many children: a high birth rate, and fast growth ahead as the children become parents' },
    stationary: { name: 'Stationary', look: 'nearly straight sides from the base to middle age', means: 'each group of children about as large as the last: births near replacement, slow or no growth' },
    constrictive: { name: 'Constrictive', look: 'a base narrower than the middle', means: 'fewer children than young adults: births below replacement, so the population ages and will shrink without immigration' }
  };

  /* --------------------------------------------- the demographic transition */
  /* Teaching values, not any country's data. Each pair of rates is
     consistent with its own stage by ApHugCalc.transitionStage. */
  var STAGES = {
    1: { name: 'Stage 1', tag: 'high and close', cbr: 40, cdr: 36, tfr: 6.0, e0: 32,
      what: 'Birth and death rates are both high, so the population barely grows.',
      why: 'Without clean water, steady food or modern medicine, many children die young, and families have many children.' },
    2: { name: 'Stage 2', tag: 'deaths fall', cbr: 38, cdr: 14, tfr: 5.4, e0: 55,
      what: 'The death rate falls fast while the birth rate stays high: rapid growth.',
      why: 'Better food supply, clean water, sanitation and vaccines lower deaths, especially of children, before families change their size.' },
    3: { name: 'Stage 3', tag: 'births fall', cbr: 22, cdr: 8, tfr: 2.6, e0: 70,
      what: 'The birth rate falls toward a low death rate, so growth slows.',
      why: 'As people move to cities, more girls finish school, more women work for wages and family planning is available, smaller families become the norm.' },
    4: { name: 'Stage 4', tag: 'low and close', cbr: 11, cdr: 9, tfr: 1.8, e0: 80,
      what: 'Both rates are low and close together: little or no natural increase.',
      why: 'Children cost more to raise than they add to family income, people marry later and live long.' },
    5: { name: 'Stage 5', tag: 'deaths exceed births', cbr: 8, cdr: 11, tfr: 1.3, e0: 84,
      what: 'The birth rate falls below the death rate: natural decrease.',
      why: 'Very low fertility for decades leaves fewer young adults to have children, while a large older population raises the death rate. Not every model includes this stage.' }
  };
  function stageOf(cbr, cdr){ return C().transitionStage({ cbr: cbr, cdr: cdr }).stage; }
  function rni(cbr, cdr){ return calc('rni', [cbr, cdr]); }
  function doubling(r){ return r > 0 ? calc('doublingTime', [r]) : null; }
  function dependency(b){ return { total: calc('dependency', [b.young, b.old, b.work]), youth: calc('youthDependency', [b.young, b.work]), elderly: calc('elderlyDependency', [b.old, b.work]) }; }
  /* What the age structure means for schools, jobs and care (spec section 6). */
  function needs(b){
    var y = b.young, o = b.old;
    return {
      schools: y >= 30 ? 'A large share of children: more schools, teachers and child health care are needed now.' : y >= 20 ? 'A steady number of children: school places hold about level.' : 'Few children: schools may close or merge as each class is smaller than the last.',
      jobs: y >= 30 ? 'Each year more young people reach working age than retire: many new jobs are needed.' : o >= 18 ? 'More workers retire than young people start work: labor shortages, later retirement or immigration.' : 'The working-age share is large: a chance for faster economic growth if there are jobs.',
      care: o >= 18 ? 'A large older share: more pensions, health care and elder care, paid for by fewer workers.' : o >= 10 ? 'The older share is growing: pension and care costs start to rise.' : 'Few older people: elder care is a small cost for now.'
    };
  }

  /* ----------------------------------------------------------- drills */
  // Skill ids from the CED (docs/aphug-ced-map.json, practices).
  var SK = { cbr: '3.A', cdr: '3.A', rni: '3.A', dbl: '3.C', nmr: '3.A', total: '3.A', youth: '3.A', elderly: '3.A', ratio: '3.A', migrate: '3.C', needs: '3.E', stage: '2.E', cause: '1.B', shape: '3.B', future: '3.E', read: '3.B', born: '3.C', cause2: '2.B' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '3.B' }; for(var k in o) s[k] = o[k]; return s; }
  /* A typed number shown to d decimals. Every cell also names the sign slip
     in our own words (the shared fallback names a z score). */
  function num(key, label, answer, d, mistakes, o){
    o = o || {};
    var abs = d === 0 ? 0.51 : d === 1 ? 0.051 : 0.0051, ms = (mistakes || []).concat([{ value: -answer, why: 'The size is right but the sign is wrong.' }]);
    return step(key, label, { kind: 'num', d: d, unit: o.unit, hint: o.hint, cell: M.cell(answer, 1e-9, ms, abs) });
  }
  function choice(key, label, opts, extra){ var s = step(key, label, { kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 }); for(var k in extra || {}) s[k] = extra[k]; return s; }
  var TYPES = [
    { value: 'rates', label: 'Birth, death and growth rates' },
    { value: 'growth', label: 'Doubling time and migration' },
    { value: 'dependency', label: 'Dependency ratios' },
    { value: 'stage', label: 'Transition stage from the rates' },
    { value: 'shape', label: 'Read a pyramid’s shape' },
    { value: 'cohort', label: 'Bulges, notches and sex ratio' }
  ];
  var NAMES = ['Country P', 'Country Q', 'Country R', 'Country S', 'Country T'];
  function country(r){ return pick(r, NAMES); }
  /* Pyramid spec for ApHugPlot: % of the population, or millions. */
  function pyrSpec(pyr, o){
    o = o || {};
    var k = o.scale || 1, L = pyr.male.map(function(v){ return M.round(v * k, 2); }), R = pyr.female.map(function(v){ return M.round(v * k, 2); });
    var top = Math.max.apply(null, L.concat(R)), mx = o.max || [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50].filter(function(v){ return v >= top * 1.04; })[0];
    return { kind: 'pyramid', label: o.label || 'Population pyramid of an invented country by age and sex: males on the left, females on the right', groups: pyr.groups.slice(), left: L, right: R, max: mx, xLabel: o.xLabel || 'Percent of the population', leftLabel: 'Male', rightLabel: 'Female', width: 300 };
  }

  var GEN = {};
  /* Counts to rates: CBR, CDR, RNI as a percent, and the doubling time. The
     gap CBR - CDR is one of a few values so 70 / RNI is a whole number. */
  var GAPS = [5, 7, 10, 14, 20, 25, 35];
  GEN.rates = function(r, c){
    var name = country(r), pop = pick(r, c.pops || [4, 5, 8, 10, 20, 25, 40, 50]), gap = pick(r, c.gaps || GAPS);
    var cdr = between(r, c.cdr || [6, 14], 1), cbr = cdr + gap;
    if(cbr > 48){ cdr = Math.max(5, 48 - gap); cbr = cdr + gap; }
    var births = cbr * pop * 1000, deaths = cdr * pop * 1000, R = rni(cbr, cdr), T2 = doubling(R), y = between(r, [2024, 2026], 1);
    var text = '<p>' + name + ' (invented) had ' + nf(pop) + ' million people in ' + y + '. That year it recorded ' + nf(births) + ' births and ' + nf(deaths) + ' deaths. Assume no migration.</p>' +
      '<p><b>Work out the crude birth and death rates</b> (per 1,000 people), the <b>rate of natural increase</b> as a percent, then the <b>doubling time</b>.</p>';
    var steps = [
      num('cbr', 'Crude birth rate (births per 1,000 people)', cbr, 0, [{ value: births / (pop * 1e6), why: 'That is births per person. Multiply by 1,000 to get births per 1,000 people.' }, { value: births / (pop * 1e6) * 100, why: 'Per 1,000, not per 100: multiply births per person by 1,000.' }, { value: births / pop, why: 'Use the population in people (' + nf(pop) + ' million = ' + nf(pop * 1e6) + '), not in millions.' }],
        { unit: 'per 1,000', hint: 'CBR = births ÷ population × 1,000.' }),
      num('cdr', 'Crude death rate (deaths per 1,000 people)', cdr, 0, [{ value: deaths / (pop * 1e6), why: 'That is deaths per person. Multiply by 1,000.' }, { value: cbr, why: 'That is the birth rate. Use the deaths this time.' }], { unit: 'per 1,000', hint: 'CDR = deaths ÷ population × 1,000.' }),
      num('rni', 'Rate of natural increase (RNI), as a percent', R, 1, [{ value: cbr - cdr, why: 'That is natural increase per 1,000 people. A percent is per 100, so divide by 10.' }, { value: (cbr - cdr) / 100, why: 'Divide by 10, not by 100: the rates are per 1,000 and a percent is per 100.' }, { value: (cbr + cdr) / 10, why: 'Subtract the death rate from the birth rate; do not add them.' }],
        { unit: '%', hint: 'RNI (%) = (CBR − CDR) ÷ 10.' }),
      num('dbl', 'Doubling time at this RNI (rule of 70), in years', T2, 0, [{ value: 70 / (cbr - cdr), why: 'Use the RNI as a percent (' + nf(R, 1) + '), not per 1,000 (' + (cbr - cdr) + ').' }, { value: 70 * R, why: 'Divide 70 by the RNI; do not multiply.' }, { value: R / 70, why: 'It is 70 ÷ RNI, not RNI ÷ 70.' }, { value: 100 / R, why: 'The rule uses 70, not 100.' }],
        { unit: 'years', hint: 'Doubling time ≈ 70 ÷ RNI (%).' })
    ];
    var sol = ['CBR = ' + nf(births) + ' ÷ ' + nf(pop * 1e6) + ' × 1,000 = ' + cbr + ' births per 1,000 people.', 'CDR = ' + nf(deaths) + ' ÷ ' + nf(pop * 1e6) + ' × 1,000 = ' + cdr + ' deaths per 1,000 people.',
      'RNI = (' + cbr + ' − ' + cdr + ') ÷ 10 = ' + nf(R, 1) + '% a year. Migration is not part of the RNI.', 'Doubling time ≈ 70 ÷ ' + nf(R, 1) + ' = ' + nf(T2) + ' years, if the RNI stayed the same.'];
    return { text: text, steps: steps, solution: sol, figure: null, given: { pop: pop, births: births, deaths: deaths, cbr: cbr, cdr: cdr } };
  };

  /* Rates to doubling time, then migration: the RNI leaves migration out,
     the growth rate does not (the CR 2023 slip). */
  GEN.growth = function(r, c){
    var name = country(r), gap = pick(r, c.gaps || GAPS), cdr = between(r, [6, 12], 1), cbr = cdr + gap, nmr = pick(r, c.nmr || [-4, -3, -2, 2, 3, 4, 5]);
    var R = rni(cbr, cdr), T2 = doubling(R), gr = calc('div', [calc('growthRate', [cbr, cdr, nmr]), 10]);
    var text = '<p>' + name + ' (invented) has a crude birth rate of ' + cbr + ' and a crude death rate of ' + cdr + ' per 1,000 people a year. Its net migration rate is ' + (nmr > 0 ? '+' : '−') + Math.abs(nmr) + ' per 1,000 (' + (nmr > 0 ? 'more people move in than out' : 'more people move out than in') + ').</p>';
    var up = nmr > 0;
    var steps = [
      num('rni', 'Rate of natural increase, as a percent', R, 1, [{ value: gr, why: 'That includes migration. The RNI counts only births and deaths.' }, { value: cbr - cdr, why: 'That is per 1,000. Divide by 10 for a percent.' }], { unit: '%', hint: 'RNI (%) = (CBR − CDR) ÷ 10.' }),
      num('dbl', 'Doubling time from the RNI (rule of 70), in years', T2, 0, [{ value: 70 / (cbr - cdr), why: 'Use the RNI as a percent, not per 1,000.' }, { value: 70 * R, why: 'Divide 70 by the RNI.' }, { value: 70 / gr, why: 'This step asks for the doubling time from natural increase alone, so use the RNI.' }], { unit: 'years', hint: '70 ÷ RNI (%).' }),
      num('nmr', 'Growth rate with migration, as a percent', gr, 1, [{ value: R, why: 'That is the RNI. Add the net migration rate before you divide by 10.' }, { value: (cbr - cdr - nmr) / 10, why: 'Net migration is ' + (up ? 'added' : 'negative, so it lowers growth') + ': growth = (CBR − CDR + net migration) ÷ 10.' }, { value: cbr - cdr + nmr, why: 'That is per 1,000. Divide by 10 for a percent.' }],
        { unit: '%', hint: 'Growth (%) = (CBR − CDR + net migration rate) ÷ 10.' }),
      choice('migrate', 'Which statement is accurate for ' + name + '?', [
        ['The population grows ' + (up ? 'faster' : 'more slowly') + ' than its RNI alone shows, because of migration.', 'Right. The RNI is ' + nf(R, 1) + '%; with migration the population grows ' + nf(gr, 1) + '% a year.'],
        ['Migration changes the RNI to ' + nf(gr, 1) + '%.', 'The RNI counts births and deaths only. Migration changes the growth rate, not the RNI.'],
        ['Migration has no effect on how fast the population grows.', 'People moving ' + (up ? 'in add to' : 'out take away from') + ' the population, so the growth rate changes.'],
        ['The doubling time is now 70 ÷ ' + (cbr - cdr + nmr) + '.', 'The rule of 70 divides by a percent, not by a rate per 1,000.']
      ])
    ];
    var sol = ['RNI = (' + cbr + ' − ' + cdr + ') ÷ 10 = ' + nf(R, 1) + '% a year.', 'Doubling time ≈ 70 ÷ ' + nf(R, 1) + ' = ' + nf(T2) + ' years from natural increase alone.',
      'Growth with migration = (' + cbr + ' − ' + cdr + (up ? ' + ' : ' − ') + Math.abs(nmr) + ') ÷ 10 = ' + nf(gr, 1) + '% a year.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'dtm', cbr: cbr, cdr: cdr }, given: { cbr: cbr, cdr: cdr, nmr: nmr } };
  };

  /* Read the three age groups (millions), then the ratios and what they mean. */
  GEN.dependency = function(r, c){
    var name = country(r), tfr = M.round(between(r, c.tfr, 0.1), 1), e0 = between(r, c.e0, 1), pyr = pyramid(tfr, e0), b = broad(pyr), pop = pick(r, c.pops || [20, 30, 40, 50, 60]);
    var y = Math.round(b.young * pop / 100), o = Math.max(1, Math.round(b.old * pop / 100)), w = pop - y - o;
    var D = { young: y, old: o, work: w }, dep = dependency(D), nd = needs({ young: 100 * y / pop, old: 100 * o / pop });
    var young = y > o * 2;
    var text = '<p>The pyramid shows ' + name + ' (invented), ' + nf(pop) + ' million people. Its people are ' + nf(y) + ' million under 15, ' + nf(w) + ' million aged 15 to 64 and ' + nf(o) + ' million aged 65 and over.</p>' +
      '<p><b>Work out the dependency ratios</b>: dependents per 100 people of working age (15 to 64).</p>';
    var steps = [
      num('total', 'Total dependency ratio', dep.total, 0, [{ value: 100 * (y + o) / pop, why: 'Divide by the working-age group (' + nf(w) + ' million), not the whole population.' }, { value: 100 * w / (y + o), why: 'That is upside down: dependents go on top, workers below.' }, { value: dep.youth, why: 'That is only the children. The total ratio adds the people 65 and over.' }],
        { unit: 'per 100', hint: '(under 15 + 65 and over) ÷ (15 to 64) × 100.' }),
      num('youth', 'Youth dependency ratio', dep.youth, 0, [{ value: 100 * y / pop, why: 'Divide by the working-age group, not the whole population.' }, { value: dep.elderly, why: 'That is the older group. Use the people under 15.' }], { unit: 'per 100', hint: 'under 15 ÷ (15 to 64) × 100.' }),
      num('elderly', 'Elderly dependency ratio', dep.elderly, 0, [{ value: 100 * o / pop, why: 'Divide by the working-age group, not the whole population.' }, { value: dep.youth, why: 'That is the children. Use the people 65 and over.' }], { unit: 'per 100', hint: '65 and over ÷ (15 to 64) × 100.' }),
      choice('needs', 'What does this age structure mean for ' + name + '?', young ? [
        [nd.schools, 'Right. Most dependents here are children (youth ratio ' + nf(dep.youth) + ' against elderly ' + nf(dep.elderly) + ').'],
        ['The main cost is pensions and elder care for a large older group.', 'The elderly ratio is only ' + nf(dep.elderly) + '. Most dependents are children.'],
        ['The workforce will shrink as few young people reach working age.', 'The large under-15 group will reach working age soon: the workforce will grow.'],
        ['A dependency ratio this high means the population is shrinking.', 'A high youth ratio goes with growth, not decline.']
      ] : [
        [nd.care, 'Right. The elderly ratio (' + nf(dep.elderly) + ') is high next to the youth ratio (' + nf(dep.youth) + ').'],
        ['Many new schools are needed for a fast-growing number of children.', 'The youth ratio is ' + nf(dep.youth) + ': children are not the main group of dependents.'],
        ['Many more young people will start work than will retire.', 'The young groups are small, so fewer people start work than retire.'],
        ['A dependency ratio this high means the birth rate is very high.', 'Here the dependents are mostly older people, which goes with a low birth rate.']
      ])
    ];
    var sol = ['Working age: ' + nf(w) + ' million. Dependents: ' + nf(y) + ' + ' + nf(o) + ' = ' + nf(y + o) + ' million.',
      'Total = ' + nf(y + o) + ' ÷ ' + nf(w) + ' × 100 ≈ ' + nf(dep.total) + '; youth = ' + nf(y) + ' ÷ ' + nf(w) + ' × 100 ≈ ' + nf(dep.youth) + '; elderly = ' + nf(o) + ' ÷ ' + nf(w) + ' × 100 ≈ ' + nf(dep.elderly) + ' per 100 people of working age.',
      'Schools: ' + nd.schools + ' Jobs: ' + nd.jobs + ' Care: ' + nd.care];
    var fig = pyrSpec(pyr, { scale: pop / 100, xLabel: 'Millions of people', label: 'Population pyramid of ' + name + ' (invented) in millions of people by age and sex' });
    return { text: text, steps: steps, solution: sol, figure: { kind: 'pyramid', spec: fig }, given: { young: y, old: o, work: w } };
  };

  /* Rates to a stage: rates drawn well inside each stage's band (the model's
     own thresholds), so the stage is never a judgment call. */
  var STAGE_RANGES = { 1: { b: [37, 44], d: [27, 33] }, 2: { b: [34, 44], d: [8, 15] }, 3: { b: [18, 26], d: [6, 10] }, 4: { b: [10, 13], d: [9, 11] }, 5: { b: [7, 9], d: [10, 13] } };
  GEN.stage = function(r, c){
    var name = country(r), st = c.stage || pick(r, [1, 2, 3, 4, 5]), R0 = STAGE_RANGES[st], cbr = between(r, R0.b, 1), cdr = between(r, R0.d, 1);
    if(st === 1) cdr = Math.min(cdr, cbr - 2);
    if(st === 4){ cdr = Math.min(cdr, cbr - 1); if(cbr - cdr > 3) cdr = cbr - 2; }
    if(st === 5) cdr = Math.max(cdr, cbr + 2);
    var text = '<p>' + name + ' (invented) has a crude birth rate of ' + cbr + ' and a crude death rate of ' + cdr + ' per 1,000 people a year. The dots show them on the demographic transition model.</p>';
    var order = [1, 2, 3, 4, 5];
    var steps = [
      choice('stage', 'These rates are consistent with which stage of the demographic transition model?', order.map(function(k){ return [STAGES[k].name + ': ' + STAGES[k].tag, (k === st ? 'Right. ' : 'Not this one. ') + STAGES[k].what + (k === st ? '' : ' A birth rate of ' + cbr + ' and a death rate of ' + cdr + ' do not fit it.')]; }), { fixed: true, correct: st - 1 }),
      choice('cause', st === 1 ? 'What would move ' + name + ' toward stage 2?' : st === 2 ? 'What would move ' + name + ' toward stage 3?' : st === 3 ? 'What would move ' + name + ' toward stage 4?' : st === 4 ? 'What could move ' + name + ' toward stage 5?' : 'Why are deaths higher than births in ' + name + '?', st === 1 ? [
        ['Clean water, a steadier food supply and vaccines lower the death rate.', 'Right. In the model, deaths fall first while births stay high, so growth speeds up.'],
        ['More girls finish school and family planning spreads, lowering the birth rate.', 'That drives the later move from stage 2 to stage 3.'],
        ['A large older population raises the death rate.', 'That fits the end of the model (stage 5), not its start.'],
        ['More people emigrate.', 'The model is built from birth and death rates; migration is left out of it.']
      ] : st === 2 ? [
        ['Urbanization, schooling and paid work for women, and family planning lower the birth rate.', 'Right. Smaller families become the norm, so births fall toward the low death rate.'],
        ['Clean water and vaccines lower the death rate.', 'That already happened: it is what started stage 2.'],
        ['The birth rate rises as farms need more workers.', 'In the model the birth rate falls in stage 3; it does not rise.'],
        ['Deaths rise above births.', 'That is stage 5, at the far end of the model.']
      ] : st === 3 ? [
        ['Children cost more to raise, people marry later and fertility falls close to the death rate.', 'Right. Both rates end up low and close together.'],
        ['Clean water and vaccines lower the death rate for the first time.', 'That is the start of stage 2.'],
        ['The death rate rises sharply from disease.', 'Stage 4 has a low death rate.'],
        ['Families grow larger as incomes rise.', 'In the model, higher incomes go with smaller families.']
      ] : st === 4 ? [
        ['Decades of very low fertility leave fewer parents, while a large older group raises the death rate.', 'Right. Deaths can then pass births: natural decrease.'],
        ['The birth rate rises back above 30 per 1,000.', 'That would move the country away from stage 5, not toward it.'],
        ['Vaccines lower the death rate for the first time.', 'That is the start of stage 2.'],
        ['Immigration raises the RNI.', 'The RNI counts births and deaths only; migration does not change it.']
      ] : [
        ['Fertility has been low for decades, so there are few young parents and many older people.', 'Right. A large older population raises the death rate while births stay low.'],
        ['The death rate is high because there is no clean water or medicine.', 'That describes stage 1. Here the birth rate is the very low one.'],
        ['Many people are emigrating.', 'Births and deaths alone give these rates; migration is not part of them.'],
        ['Families are having more children than before.', 'Then the birth rate would rise above the death rate.']
      ])
    ];
    var R = rni(cbr, cdr);
    var sol = ['Birth rate ' + cbr + ', death rate ' + cdr + ': ' + STAGES[st].what + ' These rates are consistent with ' + STAGES[st].name.toLowerCase() + ' of the model.',
      'RNI = (' + cbr + ' − ' + cdr + ') ÷ 10 = ' + nf(R, 1) + '% a year.', STAGES[st].why,
      'A model is a simplification: it was built from European history, leaves migration out, and countries move through it at different speeds.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'dtm', cbr: cbr, cdr: cdr }, given: { cbr: cbr, cdr: cdr, stage: st } };
  };

  /* Read a model pyramid's shape, then what it means. */
  GEN.shape = function(r, c){
    var name = country(r), tfr = M.round(between(r, c.tfr, 0.1), 1), e0 = between(r, c.e0, 1), pyr = pyramid(tfr, e0), sh = shape(pyr), b = broad(pyr), nd = needs(b);
    var text = '<p>The pyramid shows ' + name + ' (invented): the share of the population in each 5-year age group.</p>';
    var order = ['expansive', 'stationary', 'constrictive'];
    var steps = [
      choice('shape', 'What shape is this pyramid?', order.map(function(k){ var S = SHAPES[k]; return [S.name + ': ' + S.look + '.', (k === sh ? 'Right. ' : 'Not this one. Compare the bottom three bars with the bars for ages 25 to 39. ') + 'It means ' + S.means + '.']; }), { fixed: true, correct: order.indexOf(sh) }),
      choice('future', 'What will ' + name + ' most likely need in the next 20 years?', sh === 'expansive' ? [
        ['More schools now, then many new jobs as the large young groups reach working age.', 'Right. ' + nd.schools],
        ['Mainly pensions and elder care.', 'Only ' + nf(b.old, 0) + '% are 65 or over; the large groups are children.'],
        ['Fewer schools, because each class is smaller than the last.', 'The base is wide: each class is larger than the last.'],
        ['Immigration to replace a shrinking workforce.', 'The workforce here will grow as the children grow up.']
      ] : sh === 'constrictive' ? [
        ['More elder care and pensions, with fewer young workers to pay for them.', 'Right. ' + nd.care],
        ['Many new schools for a fast-growing number of children.', 'The base is narrow: there are fewer children each year.'],
        ['Many new jobs for a flood of young workers.', 'The young groups are small, so fewer people start work than retire.'],
        ['Nothing will change, because the shape is stable.', 'A base narrower than the middle means the population will age and shrink.']
      ] : [
        ['About the same number of school places, with the older share slowly rising.', 'Right. Each young group is about as large as the last, while people live long.'],
        ['Many more schools for a fast-growing number of children.', 'The base is about as wide as the groups above it.'],
        ['Rapid decline as most people are over 65.', 'Only ' + nf(b.old, 0) + '% are 65 or over.'],
        ['A doubling of the workforce within 10 years.', 'That needs a much wider base.']
      ])
    ];
    var sol = ['Under 15: ' + nf(b.young, 1) + '%; 15 to 64: ' + nf(b.work, 1) + '%; 65 and over: ' + nf(b.old, 1) + '%.', SHAPES[sh].name + ' pyramid: ' + SHAPES[sh].look + '. It shows ' + SHAPES[sh].means + '.',
      'Schools: ' + nd.schools + ' Jobs: ' + nd.jobs + ' Care: ' + nd.care,
      'A pyramid shows shares by age and sex, not how many people live there.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'pyramid', spec: pyrSpec(pyr, { label: 'Population pyramid of ' + name + ' (invented), percent of the population by age and sex' }) }, given: { tfr: tfr, e0: e0, shape: sh } };
  };

  /* A bulge (a baby boom), a notch (a war, famine or epidemic, or a policy that
     cut births) or extra men of working age (labor migration). */
  GEN.cohort = function(r, c){
    var name = country(r), kind = pick(r, c.kinds || ['boom', 'notch', 'men']), year = between(r, [2024, 2026], 1);
    var pyr = pyramid(between(r, [1.7, 2.2], 0.1), between(r, [74, 80], 1));
    var lo = kind === 'men' ? 4 : between(r, [4, 9], 1), hi = lo + 1; // two 5-year groups: a ten-year cohort
    var male = pyr.male.slice(), female = pyr.female.slice(), kf = kind === 'boom' ? 1.45 : kind === 'notch' ? 0.62 : 1;
    if(kind === 'men'){ for(var i = 4; i <= 8; i++) male[i] = M.round(male[i] * 1.9, 2); }
    else for(var j = lo; j <= hi; j++){ male[j] = M.round(male[j] * kf, 2); female[j] = M.round(female[j] * kf, 2); }
    var P = { groups: pyr.groups, male: male, female: female };
    var ageLo = lo * 5, ageHi = hi * 5 + 4, born0 = year - ageHi, born1 = year - ageLo;
    var text = '<p>The pyramid shows ' + name + ' (invented) in ' + year + ', as a percent of the population.</p>';
    var steps = [], sol = [];
    if(kind === 'men'){
      var gi = 5, popK = between(r, [2, 6], 1) * 1000, mN = Math.round(male[gi] / (male[gi] + female[gi]) * popK), fN = popK - mN, sr = calc('sexRatio', [mN, fN]);
      text += '<p>In the 25-29 group there are ' + nf(mN) + ' thousand males and ' + nf(fN) + ' thousand females.</p>';
      steps.push(choice('read', 'What stands out in this pyramid?', [
        ['Far more males than females at working ages, 20 to 44.', 'Right. The male bars from 20 to 44 are much longer than the female bars.'],
        ['A baby boom: one ten-year group is larger than those on either side, for both sexes.', 'A boom makes both sides wider. Here only the male side is wider.'],
        ['A notch: one ten-year group is smaller on both sides.', 'No group is smaller on both sides here.'],
        ['A very wide base from a high birth rate.', 'The base is about as wide as the groups above it.']
      ]));
      steps.push(num('ratio', 'Sex ratio of the 25-29 group (males per 100 females)', sr, 0, [{ value: 100 * fN / mN, why: 'That is females per 100 males. Put males on top.' }, { value: mN / fN, why: 'Multiply by 100: the sex ratio is males per 100 females.' }], { unit: 'per 100', hint: 'males ÷ females × 100.' }));
      steps.push(choice('cause2', 'Which process best explains this pattern?', [
        ['Labor migration: many men moved to ' + name + ' for work, for example in construction.', 'Right. Migrants who come for jobs are often young adult men, which swells the male side at working ages.'],
        ['A baby boom about 30 years before ' + year + '.', 'A boom adds both boys and girls, so both sides would widen.'],
        ['A war that killed many young men.', 'That would make the male side shorter, not longer.'],
        ['A high birth rate.', 'Births add children at the base, not adults at ages 20 to 44.']
      ]));
      sol = ['The male bars at ages 20 to 44 are much longer than the female bars: far more working-age men than women.', 'Sex ratio = ' + nf(mN) + ' ÷ ' + nf(fN) + ' × 100 ≈ ' + nf(sr) + ' males per 100 females (about 105 at birth is typical).', 'Young adult men moving in for work produce this shape. Their families may stay in the home country.'];
      return { text: text, steps: steps, solution: sol, figure: { kind: 'pyramid', spec: pyrSpec(P, { label: 'Population pyramid of ' + name + ' (invented) with far more males than females at ages 20 to 44' }) }, given: { kind: kind, mN: mN, fN: fN, year: year } };
    }
    var boom = kind === 'boom', grp = P.groups[lo] + ' and ' + P.groups[hi];
    steps.push(choice('read', 'What stands out in this pyramid?', boom ? [
      ['A bulge: the ' + grp + ' groups are larger than the groups on either side.', 'Right. Both the male and the female bars widen for those ten years of age.'],
      ['A notch: the ' + grp + ' groups are smaller than the groups on either side.', 'Look again: those bars are longer than their neighbors, not shorter.'],
      ['Far more males than females at working ages.', 'Both sides widen together here, so it is not a gap between the sexes.'],
      ['A base wider than any other group.', 'The widest bars are in the middle, not at the base.']
    ] : [
      ['A notch: the ' + grp + ' groups are smaller than the groups on either side.', 'Right. Both the male and the female bars shrink for those ten years of age.'],
      ['A bulge: the ' + grp + ' groups are larger than the groups on either side.', 'Look again: those bars are shorter than their neighbors, not longer.'],
      ['Far more males than females at working ages.', 'Both sides shrink together here, so it is not a gap between the sexes.'],
      ['A base wider than any other group.', 'The notch is in the middle of the pyramid, not at the base.']
    ], { fixed: false }));
    var span = function(a, b){ return a + ' to ' + b; };
    steps.push(choice('born', 'The people in those groups are ' + ageLo + ' to ' + ageHi + ' years old in ' + year + '. When were they born?', [
      ['About ' + span(born0, born1), 'Right. Birth year ≈ ' + year + ' − age: ' + year + ' − ' + ageHi + ' = ' + born0 + ' and ' + year + ' − ' + ageLo + ' = ' + born1 + '.'],
      ['About ' + span(born0 + 10, born1 + 10), 'Subtract the ages from ' + year + ': the oldest in the group was born in ' + born0 + '.'],
      ['About ' + span(born0 - 10, born1 - 10), 'Subtract the ages from ' + year + ': the youngest in the group was born in ' + born1 + '.'],
      ['In ' + year + ', the year of the pyramid.', 'A pyramid shows the past: each group was born age years before ' + year + '.']
    ]));
    steps.push(choice('cause2', boom ? 'Which event best fits a bulge like this?' : 'Which event best fits a notch like this?', boom ? [
      ['Births rose for about ten years, for example after a war ended or as a large group of parents had children.', 'Right. A baby boom leaves a larger cohort that moves up the pyramid as it ages.'],
      ['A war or epidemic killed many people of those ages.', 'That would make a notch, not a bulge.'],
      ['Emigration of young adults.', 'People leaving would shrink those groups.'],
      ['A policy that limited births.', 'Fewer births would make a notch.']
    ] : [
      ['Births fell for about ten years, for example during a war, famine or crisis, or under a policy that limited births.', 'Right. Fewer births leave a smaller cohort that moves up the pyramid as it ages.'],
      ['A baby boom.', 'A boom makes a bulge, not a notch.'],
      ['Immigration of young adults.', 'People arriving would add to those groups, not shrink them.'],
      ['A rising life expectancy.', 'Longer lives widen the top of the pyramid, not one middle cohort.']
    ]));
    sol = ['The ' + grp + ' groups are ' + (boom ? 'larger' : 'smaller') + ' than those on either side, for both sexes: a ' + (boom ? 'bulge' : 'notch') + '.',
      'Aged ' + ageLo + ' to ' + ageHi + ' in ' + year + ', they were born about ' + born0 + ' to ' + born1 + '.',
      boom ? 'A boom moves up the pyramid: about 20 to 30 years later it brings an "echo" as the boom generation has children.' : 'A small cohort moves up the pyramid: later it means fewer workers, and fewer parents, for those years.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'pyramid', spec: pyrSpec(P, { label: 'Population pyramid of ' + name + ' (invented) with ' + (boom ? 'a bulge' : 'a notch') + ' in the middle ages' }) }, given: { kind: kind, lo: lo, hi: hi, year: year, ageLo: ageLo, ageHi: ageHi } };
  };

  function generate(r, ctx, type){
    var t = type && ctx.types && ctx.types.indexOf(type) > -1 ? type : (ctx.types || [])[0];
    var g = GEN[t];
    if(!g) throw new Error('population-lab: no generator for type "' + t + '"');
    var p = g(r, ctx);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = t;
    return p;
  }

  M.register('populationLab', {
    TYPES: TYPES, GROUPS: GROUPS, STAGES: STAGES, SHAPES: SHAPES, SHAPE_K: SHAPE_K, STAGE_RANGES: STAGE_RANGES, GAPS: GAPS,
    survival: survival, nrr: nrr, pyramid: pyramid, broad: broad, shape: shape, baseRatio: baseRatio, stageOf: stageOf,
    rni: rni, doubling: doubling, dependency: dependency, needs: needs, pyrSpec: pyrSpec, nf: nf,
    generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
