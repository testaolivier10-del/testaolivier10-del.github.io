/* Age structure model: ApEnvMath.ageStructure (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T1, docs/apenv-briefs/t1.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/age-structure.mjs)
   and the test (scripts/test/apenv-tool-age-structure.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/age-structure.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/age-structure.js.

   Explore: a country you steer through the demographic transition
     STAGES[1..4]            the four stages: typical CBR, CDR, TFR, a pyramid
     pyramid(tfr, survival)  -> { groups, male, female } (% of the population in
                             each 5-year band, 0-4 to 80+): a stable population
                             whose births per woman are tfr and whose survival
                             to each age falls off with the given life expectancy
     shape(pyr)              'expansive' | 'stable' | 'constrictive' from the base
                             against the middle (young share vs the 25-39 share)
     stageOf(cbr, cdr)       the stage those crude rates point to
     growth(cbr, cdr)        ApEnvCalc.naturalIncrease: (CBR - CDR) / 10, in %
     Every percent drawn is the model's number, so the pyramid on the screen is
     the population described.
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, figure, given }
       type 'rate' | 'tfr' | 'shape' | 'stage' | 'dependency' */
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
  function pick(r, a){ return a[Math.floor(r() * a.length)]; }
  function between(r, ab, step){ var s = step || 1, n = Math.round((ab[1] - ab[0]) / s); return M.round(ab[0] + s * Math.floor(r() * (n + 1)), 6); }

  /* --------------------------------------------------------- pyramids */
  var GROUPS = ['0–4', '5–9', '10–14', '15–19', '20–24', '25–29', '30–34', '35–39', '40–44', '45–49', '50–54', '55–59', '60–64', '65–69', '70–74', '75–79', '80+'];
  /* Survival from birth to the start of each band, for a life expectancy e0:
     a child death share that grows as e0 falls, then an adult hazard that
     doubles about every 8 years (Gompertz), scaled with e0. A teaching model,
     not a real life table; it gives the textbook shapes and a believable
     share over 65 (a few % for e0 near 35, about 20% for e0 near 83 with a
     low TFR). Fitted to rounded UN World Population Prospects shares (under 15
     and 65 and over) for a few countries, within about 4 points. */
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
  /* A population's share in each band: births each year grow at the rate the
     TFR implies against replacement (spread over about 34 years), so a
     band of age a holds survivors of births that were smaller by that growth. */
  function pyramid(tfr, e0, sexRatio){
    var surv = survival(e0), g = Math.log(tfr / 2.1) / 34, w = [];
    for(var i = 0; i < GROUPS.length; i++){
      var mid = i * 5 + 2.5, n = surv[i] * Math.exp(-g * mid);
      if(i === GROUPS.length - 1) n = n * 1.6; // 80+ spans more than 5 years
      w.push(n);
    }
    var tot = w.reduce(function(a, b){ return a + b; }, 0), sr = sexRatio == null ? 1.05 : sexRatio;
    var male = [], female = [];
    w.forEach(function(v, i){
      var share = v / tot * 100, age = i * 5, m = sr / (1 + sr);
      // women outlive men: the male share falls with age
      m = Math.max(0.33, m - Math.max(0, age - 50) * 0.0035);
      male.push(M.round(share * m, 2)); female.push(M.round(share * (1 - m), 2));
    });
    return { groups: GROUPS.slice(), male: male, female: female, tfr: tfr, e0: e0 };
  }
  function bandSum(pyr, a, b){ var s = 0; for(var i = a; i <= b; i++) s += pyr.male[i] + pyr.female[i]; return s; }
  /* Under 15, 15-64, 65 and over (the dependency groups), in %. */
  function broad(pyr){ return { young: bandSum(pyr, 0, 2), work: bandSum(pyr, 3, 12), old: bandSum(pyr, 13, 16) }; }
  /* The base against the middle: expansive when the 0-14 bands are much wider
     than 25-39, constrictive when narrower, stable in between. */
  function shape(pyr){
    var young = bandSum(pyr, 0, 2) / 3, mid = bandSum(pyr, 5, 7) / 3, k = young / mid;
    return k > 1.25 ? 'expansive' : k < 0.92 ? 'constrictive' : 'stable';
  }
  var STAGES = {
    1: { name: 'Stage 1: preindustrial', cbr: 40, cdr: 38, tfr: 6.0, e0: 32, what: 'High birth and death rates; the population barely grows.', why: 'Little medicine, clean water or food security; many children die young.' },
    2: { name: 'Stage 2: transitional', cbr: 38, cdr: 14, tfr: 5.2, e0: 55, what: 'Death rates fall fast; birth rates stay high. Rapid growth.', why: 'Better food, sanitation and medicine cut deaths, especially of children, before families change their size.' },
    3: { name: 'Stage 3: industrial', cbr: 20, cdr: 8, tfr: 2.4, e0: 72, what: 'Birth rates fall; growth slows.', why: 'Cities, education and jobs for women, and access to family planning make smaller families the norm.' },
    4: { name: 'Stage 4: postindustrial', cbr: 10, cdr: 10, tfr: 1.6, e0: 81, what: 'Low birth and death rates; little or no growth, sometimes a decline.', why: 'Children are costly, women have careers and education, and people live long.' }
  };
  function stageOf(cbr, cdr){
    var gap = cbr - cdr;
    if(cbr >= 30 && cdr >= 25) return 1;
    if(cbr >= 25 && gap >= 12) return 2;
    if(cbr <= 13 && gap <= 3) return 4;
    return 3;
  }
  function growth(cbr, cdr){ return calc('naturalIncrease', [cbr, cdr]); }

  /* ----------------------------------------------------------- drills */
  var SK = { setup: '6.B', answer: '6.C', year: '6.C', shape: '2.A', stage: '2.B', predict: '5.C', compare: '6.C', why: '5.C', cause: '1.B', read: '5.B' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '5.B' }; for(var k in o) s[k] = o[k]; return s; }
  function setupStep(answer, o){
    o = o || {};
    var X = G.ApEnvExpr, key = X.evaluate(answer, {}, []);
    var ms = (o.mistakes || []).filter(function(m){ var v = X.evaluate(m.expr, {}, []); return v.ok && key.ok && Math.abs(v.value - key.value) > 1e-6 * Math.max(1, Math.abs(key.value)); });
    return step('setup', o.label || 'Write the setup, as you would type it on the exam.', { kind: 'setup', hint: o.hint, cell: M.setupCell(answer, { mustUse: o.mustUse, mistakes: ms }) });
  }
  function answerStep(value, unit, o){
    o = o || {};
    var tol = G.ApEnvGrade.tolerance({ answer: value, places: o.places }), seen = [value];
    var ms = (o.mistakes || []).filter(function(m){ if(!isFinite(m.value) || seen.some(function(v){ return Math.abs(m.value - v) <= 2.5 * tol + 1e-9 * Math.abs(v); })) return false; seen.push(m.value); return true; });
    var opts = { units: o.units, mistakes: ms }; if(o.places != null) opts.places = o.places;
    return step(o.key || 'answer', o.label || 'Now the answer and its unit.', { kind: 'unit', hint: o.hint, cell: M.unitCell(value, unit, opts) });
  }
  function choice(key, label, opts, extra){ var s = step(key, label, { kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 }); for(var k in extra || {}) s[k] = extra[k]; return s; }
  var SHAPE_TXT = {
    expansive: ['Expansive: a wide base that narrows quickly (a triangle).', 'A wide base means many children: high birth rates and fast growth ahead.'],
    stable: ['Stable: about the same width from the base up to middle age (a column).', 'Similar numbers in each young band: births about at replacement, slow or no growth.'],
    constrictive: ['Constrictive: a base narrower than the middle (a vase).', 'Fewer children than young adults: births below replacement, so the population will age and shrink.']
  };
  var TYPES = [
    { value: 'rate', label: 'Growth rate and doubling time' },
    { value: 'tfr', label: 'Total fertility rate' },
    { value: 'shape', label: 'Read a pyramid' },
    { value: 'stage', label: 'Demographic transition' },
    { value: 'dependency', label: 'Young and old shares' }
  ];
  var GEN = {};

  GEN.rate = function(r, c){
    var st = pick(r, c.stages || [2, 3]), S0 = STAGES[st], cbr = Math.max(8, S0.cbr + between(r, [-4, 4], 1)), cdr = Math.max(5, S0.cdr + between(r, [-2, 2], 1));
    if(cbr - cdr < 4) cbr = cdr + 4 + between(r, [0, 6], 1);
    var g = growth(cbr, cdr), td = calc('ruleOf70', [g]), y0 = between(r, [2015, 2025], 1), yr = calc('doublingYear', [y0, g]);
    var text = '<p>' + c.lead.replace('{y0}', y0) + ' Its crude birth rate is ' + cbr + ' per 1,000 people per year and its crude death rate ' + cdr + ' per 1,000. Migration is negligible.</p><p><b>Calculate the growth rate</b> as a percent, then <b>the year</b> its population would double at that rate.</p>';
    var steps = [
      setupStep('(' + cbr + ' - ' + cdr + ') / 10', { mustUse: [String(cbr), String(cdr)], hint: 'Growth rate (%) = (CBR − CDR) / 10, since the rates are per 1,000.',
        mistakes: [{ expr: '(' + cbr + ' - ' + cdr + ') / 100', why: 'Per 1,000 to percent (per 100) is ÷ 10, not ÷ 100.' }, { expr: cbr + ' - ' + cdr, why: 'That is per 1,000 people. Divide by 10 for a percent.' }] }),
      answerStep(g, '%', { units: ['percent'], places: 1, mistakes: [{ value: cbr - cdr, why: 'Divide by 10: the rates are per 1,000 and a percent is per 100.' }, { value: (cbr - cdr) / 100, why: 'Divide by 10, not 100.' }] }),
      step('year', 'In what year would the population double?', { kind: 'num', d: 0, hint: 'Doubling time = 70 ÷ the growth rate in percent; then add it to ' + y0 + '.', cell: M.cell(yr, 1e-6, [{ value: td, why: 'That is the doubling time. Add it to ' + y0 + '.' }, { value: y0 + 70 / (cbr - cdr), why: 'Use the growth rate in percent (' + nf(g, 1) + '), not per 1,000.' }], 0.5) })
    ];
    var sol = ['Growth rate = (' + cbr + ' − ' + cdr + ') / 10 = ' + nf(g, 1) + '% per year.', 'Doubling time = 70 / ' + nf(g, 1) + ' = ' + nf(td, 1) + ' years; ' + y0 + ' + ' + nf(td, 1) + ' = ' + M.fixed(yr, 0) + '.', 'Stage ' + stageOf(cbr, cdr) + ' of the demographic transition: ' + STAGES[stageOf(cbr, cdr)].what];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'rates', cbr: cbr, cdr: cdr, show: 'rates' }, given: { cbr: cbr, cdr: cdr, y0: y0 } };
  };

  GEN.tfr = function(r, c){
    var tfr = M.round(between(r, c.tfr, 0.1), 1), e0 = c.e0 || 75, shapeK = [0.25, 1, 1.1, 0.85, 0.5, 0.15, 0.03], sum = shapeK.reduce(function(a, b){ return a + b; }, 0);
    var asfr = shapeK.map(function(k){ return Math.max(1, Math.round(k / sum * tfr * 1000 / 5)); });
    var t = calc('tfr', [asfr, 5]), above = calc('aboveReplacement', [t]);
    var bands = ['15–19', '20–24', '25–29', '30–34', '35–39', '40–44', '45–49'];
    var text = '<p>' + c.lead + ' The table gives births per 1,000 women in each age group (invented data for practice).</p>' +
      '<table class="env-data as-tbl"><caption>Births per 1,000 women per year</caption><thead><tr><th scope="col">Age</th>' + bands.map(function(b){ return '<td>' + b + '</td>'; }).join('') + '</tr></thead><tbody><tr><th scope="row">Rate</th>' + asfr.map(function(v){ return '<td>' + v + '</td>'; }).join('') + '</tr></tbody></table>' +
      '<p><b>Calculate the total fertility rate</b>, then compare it with replacement level.</p>';
    var steps = [
      setupStep('(' + asfr.join(' + ') + ') * 5 / 1000', { mustUse: asfr.slice(0, 2).map(String), hint: 'TFR = (sum of the rates) × 5 years per group ÷ 1,000.',
        mistakes: [{ expr: '(' + asfr.join(' + ') + ') / 1000', why: 'Multiply by 5: each woman spends 5 years in each age group.' }] }),
      answerStep(t, 'children per woman', { units: ['children/woman', 'births per woman', 'births/woman'], places: 2, mistakes: [{ value: t / 5, why: 'Multiply by 5 (years per age group).' }] }),
      choice('predict', 'With this TFR held for decades, what happens to the pyramid’s base?', above > 0.15 ? [
        ['It widens: each generation of children outnumbers the one before (an expansive pyramid).', 'Right. TFR ' + nf(t, 2) + ' is above replacement (2.1).'],
        ['It narrows: fewer children each generation (a constrictive pyramid).', 'That happens below replacement; ' + nf(t, 2) + ' is above 2.1.'],
        ['It stays the same width (a stable pyramid).', 'That is about replacement level; ' + nf(t, 2) + ' is clearly above 2.1.'],
        ['TFR does not affect the base of the pyramid.', 'The base is the youngest bands: births are exactly what TFR measures.']
      ] : above < -0.15 ? [
        ['It narrows: fewer children each generation (a constrictive pyramid).', 'Right. TFR ' + nf(t, 2) + ' is below replacement (2.1).'],
        ['It widens: each generation of children outnumbers the one before.', 'That needs a TFR above 2.1; this one is ' + nf(t, 2) + '.'],
        ['It stays the same width (a stable pyramid).', 'That is about replacement level; ' + nf(t, 2) + ' is clearly below 2.1.'],
        ['TFR does not affect the base of the pyramid.', 'The base is the youngest bands: births are exactly what TFR measures.']
      ] : [
        ['It stays about the same width (a stable pyramid).', 'Right. TFR ' + nf(t, 2) + ' is close to replacement (2.1).'],
        ['It widens quickly (an expansive pyramid).', 'That needs a TFR well above 2.1.'],
        ['It narrows quickly (a constrictive pyramid).', 'That needs a TFR well below 2.1.'],
        ['TFR does not affect the base of the pyramid.', 'The base is the youngest bands: births are exactly what TFR measures.']
      ])
    ];
    var sh = shape(pyramid(t, e0));
    var sol = ['Sum = ' + nf(asfr.reduce(function(a, b){ return a + b; }, 0)) + '; × 5 ÷ 1,000 = ' + nf(t, 2) + ' children per woman.', 'Replacement level ≈ 2.1: ' + (above > 0.15 ? 'above it, so the base widens' : above < -0.15 ? 'below it, so the base narrows' : 'about at it, so the base holds steady') + '.', 'Even below 2.1, a young population keeps growing for a while (population momentum): many women are still entering their childbearing years.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'pyr', tfr: t, e0: e0, hide: 'shape' }, given: { asfr: asfr, shape: sh } };
  };

  GEN.shape = function(r, c){
    var tfr = M.round(between(r, c.tfr, 0.1), 1), e0 = between(r, c.e0, 1), pyr = pyramid(tfr, e0), sh = shape(pyr);
    var text = '<p>' + c.lead + ' The pyramid shows the share of the population in each 5-year age group (a model country, invented for practice).</p>';
    var order = ['expansive', 'stable', 'constrictive'];
    var steps = [
      choice('shape', 'What shape is this pyramid?', order.map(function(k){ return [SHAPE_TXT[k][0], (k === sh ? 'Right. ' : 'Not this one. Compare the base with the 25–39 bands. ') + SHAPE_TXT[k][1]]; }), { fixed: true }),
      choice('predict', 'What will the population most likely do over the next 30 years (without migration)?', sh === 'expansive' ? [
        ['Grow quickly: the large young bands are about to have children of their own.', 'Right. A wide base means population momentum: many future parents.'],
        ['Shrink, because the base is narrow.', 'The base here is wide, not narrow.'],
        ['Stay the same, because the pyramid is a column.', 'This pyramid narrows quickly from a wide base: it is not a column.'],
        ['Shrink quickly, because most people are old.', 'Most people here are young.']
      ] : sh === 'constrictive' ? [
        ['Age and slowly shrink: fewer young people will become parents than there are parents now.', 'Right. A narrow base means fewer future parents: the population ages and shrinks unless immigration fills the gap.'],
        ['Grow quickly, as the young bands have children.', 'The young bands are narrower than the middle ones: fewer, not more, future parents.'],
        ['Stay exactly the same size.', 'With a base this narrow, the population will shrink over time.'],
        ['Grow because death rates will rise.', 'Rising death rates shrink a population; they do not grow it.']
      ] : [
        ['Stay about the same size: each young band is about as large as the one before.', 'Right. Births about at replacement keep the bands similar.'],
        ['Grow quickly from a very wide base.', 'The base is about as wide as the bands above it.'],
        ['Shrink quickly from a very narrow base.', 'The base is about as wide as the bands above it.'],
        ['Double every 10 years.', 'That would need a very high growth rate and a wide base.']
      ])
    ];
    steps[0].correct = order.indexOf(sh);
    var b = broad(pyr);
    var sol = ['Under 15: ' + nf(b.young, 1) + '%; 15–64: ' + nf(b.work, 1) + '%; 65 and over: ' + nf(b.old, 1) + '%.', SHAPE_TXT[sh][0] + ' ' + SHAPE_TXT[sh][1], 'A pyramid shows the past (who was born when) and the future (who will have children next).'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'pyr', tfr: tfr, e0: e0 }, given: { tfr: tfr, e0: e0, shape: sh } };
  };

  GEN.stage = function(r, c){
    var st = c.stage, S0 = STAGES[st], cbr = S0.cbr + between(r, [-2, 2], 1), cdr = S0.cdr + between(r, [-1, 1], 1);
    if(st === 4) cdr = Math.max(cdr, cbr - 1);
    if(st === 1) cdr = Math.max(cdr, cbr - 4);
    var text = '<p>' + c.lead + ' Its crude birth rate is ' + cbr + ' and its crude death rate ' + cdr + ' per 1,000 people per year.</p>';
    var order = [1, 2, 3, 4];
    var steps = [
      choice('stage', 'Which stage of the demographic transition fits best?', order.map(function(k){ return [STAGES[k].name, (k === st ? 'Right. ' : 'Not this one. ') + STAGES[k].what + (k === st ? '' : ' These rates do not fit it.')]; }), { fixed: true }),
      choice('cause', 'What best explains a country moving out of ' + (st === 1 ? 'stage 1 into stage 2' : st === 2 ? 'stage 2 into stage 3' : st === 3 ? 'stage 3 into stage 4' : 'stage 3 into stage 4') + '?', st === 1 ? [
        ['Better food supply, clean water, sanitation and medicine lower the death rate.', 'Right. Deaths fall first; birth rates stay high for a while, so growth speeds up.'],
        ['Women gain access to education and family planning, lowering the birth rate.', 'That drives the later move from stage 2 to stage 3.'],
        ['The population ages and the death rate rises.', 'That can happen in stage 4 or 5, not at the start of the transition.'],
        ['Emigration lowers the population.', 'The transition is about birth and death rates, not migration.']
      ] : st === 2 ? [
        ['Education and jobs for women, urbanization and access to family planning lower the birth rate.', 'Right. Smaller families become the norm, so births fall toward deaths.'],
        ['Clean water and vaccines lower the death rate.', 'That already happened: it is what started stage 2.'],
        ['A war raises the death rate.', 'That is not part of the transition model.'],
        ['The birth rate rises with industrialization.', 'Industrialization lowers birth rates: children cost more in a city and are not needed as farm labor.']
      ] : [
        ['Children become costly, women have careers, and people marry later, so birth rates fall to about the death rate.', 'Right. Births and deaths both end up low and nearly equal.'],
        ['Clean water and vaccines lower the death rate for the first time.', 'That is the start of stage 2.'],
        ['Death rates rise sharply from disease.', 'Stage 4 has low death rates.'],
        ['Families grow larger as incomes rise.', 'Higher incomes in the model go with smaller families.']
      ])
    ];
    steps[0].correct = order.indexOf(st);
    var g = growth(cbr, cdr);
    var sol = [S0.name + '. ' + S0.what, 'Growth rate = (' + cbr + ' − ' + cdr + ') / 10 = ' + nf(g, 1) + '% per year.', S0.why];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'transition', stage: st, cbr: cbr, cdr: cdr, hide: true }, given: { cbr: cbr, cdr: cdr, stage: st } };
  };

  /* Read the young and old shares off a pyramid's bars; the dependency ratio. */
  GEN.dependency = function(r, c){
    var tfr = M.round(between(r, c.tfr, 0.1), 1), e0 = between(r, c.e0, 1), pyr = pyramid(tfr, e0), b = broad(pyr);
    var young = M.round(b.young, 1), old = M.round(b.old, 1), work = M.round(100 - young - old, 1), dep = calc('mul', [calc('div', [calc('add', [young, old]), work]), 100]);
    var text = '<p>' + c.lead + ' In this model country ' + nf(young, 1) + '% of people are under 15 and ' + nf(old, 1) + '% are 65 or older.</p><p>The dependency ratio compares the people of dependent ages with those of working age: <b>calculate it</b> as dependents per 100 people aged 15–64.</p>';
    var steps = [
      setupStep('(' + young + ' + ' + old + ') / (100 - ' + young + ' - ' + old + ') * 100', { mustUse: [String(young), String(old)], hint: 'Working age = 100 − (under 15) − (65 and over). Ratio = (young + old) / working age × 100.',
        mistakes: [{ expr: '(' + young + ' + ' + old + ') / 100 * 100', why: 'Divide by the working-age share (15–64), not by the whole population.' }, { expr: young + ' / (100 - ' + young + ' - ' + old + ') * 100', why: 'Dependents include the old too: young + old.' }] }),
      answerStep(dep, 'dependents per 100 working-age people', { units: ['per 100', 'dependents per 100', 'per 100 people', 'dependents/100 people'], places: 0, mistakes: [{ value: young + old, why: 'That is per 100 people of all ages. Divide by the working-age share.' }] }),
      choice('why', young > old * 2 ? 'Most of these dependents are children. What does that suggest?' : 'Many of these dependents are old. What does that suggest?', young > old * 2 ? [
        ['Spending on schools and child health, and fast growth as the children become parents.', 'Right. A young population needs schools now and will add many parents soon.'],
        ['Spending mainly on pensions and elder care.', 'That fits an older population; most dependents here are children.'],
        ['A shrinking workforce in the next 20 years.', 'The large young bands will join the workforce: it will grow.'],
        ['A TFR well below replacement.', 'Many children point to a high TFR, not a low one.']
      ] : [
        ['Spending on pensions and health care for the old, with fewer workers to support them.', 'Right. An aging population puts pressure on the working-age group.'],
        ['Spending mainly on new schools.', 'Most dependents here are old, not young.'],
        ['Rapid population growth ahead.', 'An old, narrow-based population tends to shrink, not grow.'],
        ['A very high birth rate.', 'Few children point to a low birth rate.']
      ])
    ];
    var sol = ['Working age = 100 − ' + nf(young, 1) + ' − ' + nf(old, 1) + ' = ' + nf(work, 1) + '%.', 'Dependency ratio = (' + nf(young, 1) + ' + ' + nf(old, 1) + ') / ' + nf(work, 1) + ' × 100 = ' + nf(dep, 0) + ' dependents per 100 people of working age.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'pyr', tfr: tfr, e0: e0, bands: true }, given: { young: young, old: old } };
  };

  function generate(r, ctx, type){
    var t = type && ctx.types && ctx.types.indexOf(type) > -1 ? type : (ctx.types || [])[0];
    var g = GEN[t];
    if(!g) throw new Error('age-structure: no generator for type "' + t + '"');
    var p = g(r, ctx);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = t;
    return p;
  }

  M.register('ageStructure', {
    TYPES: TYPES, GROUPS: GROUPS, STAGES: STAGES, SHAPE_TXT: SHAPE_TXT,
    survival: survival, pyramid: pyramid, broad: broad, shape: shape, stageOf: stageOf, growth: growth, nf: nf,
    generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
