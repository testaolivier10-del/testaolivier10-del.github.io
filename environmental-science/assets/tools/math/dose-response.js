/* Dose and response model: ApEnvMath.doseResponse (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/apenv-briefs/t4.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/dose-response.mjs)
   and the test (scripts/test/apenv-tool-dose-response.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/dose-response.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/dose-response.js.

   The science (CED 8.8 bioaccumulation and biomagnification, 8.12 LD50,
   8.13 the dose-response curve):
     curve(ld50, hill, step, n)
                 a dose-response test as measured points [[dose mg/kg, % of
                 the test population that died], ...], doses 0, step, 2 step
                 ...; the responses follow a sigmoid (Hill) curve, rounded to
                 whole percents, with one point at exactly 50% (so LD50 can be
                 read off), and responses under 2% recorded as 0 (no effect
                 seen: the doses up to the threshold).
     responseAt(points, dose)  the % read off the curve by straight lines
                 between the points (as ApEnvCalc.doseAt reads the dose)
     ld50(points)              ApEnvCalc.ld50: the dose at 50% response
     threshold(points)         the highest tested dose with no response
     CHEMICALS   three invented substances for the Explore view (invented
                 data for practice, labeled as such on the page)
     CHAIN       a food chain, water to top predator, for biomagnification
     chainLevels(c0, factor)   ppm at each level: c0 × factor^level
                 (ApEnvCalc.biomagnify)
     accumulate(cMax, years)   one fish's tissue concentration with age, an
                 explanatory curve cMax × (1 − 0.7^years): it takes in the
                 toxin faster than it can excrete it (bioaccumulation)
     Every number a drill shows comes from ApEnvCalc (M.Calc()), never typed.
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, given, figure }
     types: read (LD50 and threshold off a curve, toxicity compared),
     dose (a whole-body dose from mg/kg: setup and answer with unit; what
     LD50 does and does not mean), magnify (ppm up a food chain: setup,
     answer with unit, the magnification factor, the two words kept apart),
     compare (two LD50 values: which is more toxic and how many times). */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  function C(){ return M.Calc(); }
  function E(recipe){ return C().evaluate(recipe); }

  /* A sigmoid test: ld50 a multiple of step (k steps), so one point is 50%. */
  function curve(ld50, hill, step, n){
    var pts = [];
    for(var i = 0; i <= n; i++){
      var d = M.round(i * step, 6), r;
      if(d === 0) r = 0;
      else if(Math.abs(d - ld50) < 1e-9) r = 50;
      else { r = Math.round(100 / (1 + Math.pow(ld50 / d, hill))); if(r < 2) r = 0; if(r > 99 && d > ld50) r = 100; }
      if(d < ld50 && r >= 50) r = 49;
      if(d > ld50 && r <= 50) r = 51;
      if(pts.length && r < pts[pts.length - 1][1]) r = pts[pts.length - 1][1];
      pts.push([d, r]);
    }
    return pts;
  }
  function responseAt(points, dose){
    var p = points;
    if(dose <= p[0][0]) return p[0][1];
    for(var i = 1; i < p.length; i++) if(dose <= p[i][0]) return p[i - 1][1] + (dose - p[i - 1][0]) * (p[i][1] - p[i - 1][1]) / (p[i][0] - p[i - 1][0]);
    return p[p.length - 1][1];
  }
  function ld50(points){ return E({ fn: 'ld50', args: [points] }); }
  function threshold(points){
    var t = 0;
    for(var i = 0; i < points.length; i++) if(points[i][1] === 0) t = points[i][0]; else break;
    return t;
  }

  var CHEMICALS = [
    { id: 'x', name: 'Insecticide X', use: 'kills crop insects', points: curve(40, 4, 10, 16), cls: 'a' },
    { id: 'y', name: 'Herbicide Y', use: 'kills weeds', points: curve(100, 5, 10, 16), cls: 'b' },
    { id: 'z', name: 'Solvent Z', use: 'cleans metal parts', points: curve(160, 6, 10, 16), cls: 'c' }
  ];

  var CHAIN = [
    { k: 'water', name: 'Water' },
    { k: 'plankton', name: 'Zooplankton' },
    { k: 'small', name: 'Small fish' },
    { k: 'large', name: 'Large fish' },
    { k: 'bird', name: 'Fish-eating bird' }
  ];
  function chainLevels(c0, factor){ return CHAIN.map(function(x, i){ return E({ fn: 'biomagnify', args: [c0, factor, i] }); }); }
  function accumulate(cMax, years){ return cMax * (1 - Math.pow(0.7, years)); }

  /* ----------------------------------------------------------- drills */
  var SK = { ld50: '5.A', threshold: '5.A', toxic: '5.C', setup: '6.B', answer: '6.C', perkg: '6.C', means: '1.B', top: '6.C', topset: '6.B', factor: '6.C', word: '1.A', which: '5.C', times: '6.C' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '6.B' }; for(var k in o) s[k] = o[k]; return s; }
  function num(key, label, answer, d, o){
    o = o || {};
    var abs = Math.max(o.abs || 0, 0.6 * Math.pow(10, -d));
    return step(key, label, { kind: 'num', d: d, unit: o.unit, hint: o.hint, cell: M.cell(answer, 1e-6, o.mistakes || [], abs) });
  }
  function choice(key, label, opts){ return step(key, label, { kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 }); }
  function unit(key, label, answer, u, o){
    o = o || {};
    var ms = (o.mistakes || []).filter(function(m){ return isFinite(m.value) && !M.near(m.value, answer, 0.03, 1e-12); });
    return step(key, label, { kind: 'unit', hint: o.hint, cell: M.unitCell(answer, u, { mistakes: ms.length ? ms : undefined, places: o.places, units: o.units }) });
  }
  function setup(key, label, expr, o){ o = o || {}; return step(key, label, { kind: 'setup', hint: o.hint, cell: M.setupCell(expr, o) }); }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function the(s){ return /^(the|a|an) /i.test(s) || /^[A-Z]/.test(s) ? s : s === 'mercury' ? s : 'the ' + s; }
  function big(x){ return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  /* A concentration as plain decimals, never as 1e-5 (the parser reads both). */
  function dec(x){ var s = String(+x.toPrecision(6)); if(/e/.test(s)) s = x.toFixed(10).replace(/0+$/, ''); return s; }

  function genRead(r, c){
    var stp = r.pick(c.steps || [10, 20, 25, 50]), k = r.int(3, 6), L = stp * k, hill = r.pick([3, 4, 5]), n = Math.max(8, k * 2);
    var pts = curve(L, hill, stp, n), key = ld50(pts), thr = threshold(pts);
    var other = M.round(L * r.pick([0.4, 0.5, 2, 2.5, 3]), 0), more = key < other;
    var text = '<p>' + c.lead + ' ' + c.who + ' were given doses of ' + c.chem + ', and the percent that died at each dose is plotted.</p>';
    var steps = [
      num('ld50', 'Read the LD50 of ' + c.chem + ' off the curve.', key, 0, { unit: 'mg/kg', abs: stp * 0.15, hint: 'Find 50% on the y-axis, go across to the curve, then down to the dose.',
        mistakes: [{ value: pts[pts.length - 1][0], why: 'That is the highest dose tested. LD50 is the dose at which 50% of the test population dies.' }, { value: 50, why: '50 is the percent on the y-axis. LD50 is the dose (x-axis) where the curve reaches 50%.' }] }),
      num('threshold', 'What is the threshold dose, the highest dose tested with no deaths?', thr, 0, { unit: 'mg/kg', abs: stp * 0.15, hint: 'Follow the curve from 0 until it starts to rise.',
        mistakes: [{ value: key, why: 'That is the LD50. The threshold is lower: the largest dose with no observed response.' }] }),
      choice('toxic', 'Another chemical has an LD50 of ' + big(other) + ' mg/kg in the same test. Which is more toxic?', more ? [
        [cap(c.chem) + ', because it kills half the animals at a lower dose.', 'Right. A lower LD50 means less of the chemical is needed to kill half the population: more toxic.'],
        ['The other chemical, because its LD50 number is larger.', 'A larger LD50 means more of the chemical is needed to kill half: less toxic.'],
        ['They are equally toxic, since both kill 50% at their LD50.', 'Both kill 50% at their LD50, but at different doses. The lower dose marks the more toxic one.'],
        ['It cannot be told without the threshold doses.', 'LD50 values are the standard way to compare toxicity: lower is more toxic.']
      ] : [
        ['The other chemical, because it kills half the animals at a lower dose.', 'Right. ' + big(other) + ' mg/kg is lower than ' + key + ' mg/kg, so the other chemical is more toxic.'],
        [cap(c.chem) + ', because its curve is the one shown.', 'Compare the LD50 values: the lower one, ' + big(other) + ' mg/kg, is more toxic.'],
        ['They are equally toxic, since both kill 50% at their LD50.', 'Both kill 50% at their LD50, but at different doses. The lower dose marks the more toxic one.'],
        [cap(c.chem) + ', because a larger LD50 means a stronger poison.', 'It is the other way round: a larger LD50 means more is needed to kill half, so less toxic.']
      ])
    ];
    var sol = ['From 50% on the y-axis across to the curve and down: LD50 = ' + key + ' mg/kg.',
      'The curve stays at 0% up to ' + thr + ' mg/kg: that is the threshold, the highest dose with no response.',
      'Lower LD50 = more toxic: ' + (more ? c.chem + ' (' + key + ' mg/kg) is more toxic than the other (' + big(other) + ' mg/kg).' : 'the other chemical (' + big(other) + ' mg/kg) is more toxic than ' + c.chem + ' (' + key + ' mg/kg).')];
    return { ctx: c.id, topic: c.topic, type: 'read', text: text, steps: steps, solution: sol,
      given: { points: pts, other: other }, figure: { kind: 'curve', points: pts, chem: c.chem, step: stp } };
  }

  function genDose(r, c){
    var L = r.pick(c.ld50 || [50, 120, 150, 200, 250, 300]), kg = r.pick(c.kg || [4, 10, 20, 25, 30]);
    var total = E({ fn: 'doseFor', args: [L, kg] });
    var ate = M.round(total * r.pick([0.2, 0.5, 1.5, 2]), 0), perkg = E({ fn: 'div', args: [ate, kg] });
    var text = '<p>' + c.lead + ' The oral LD50 of ' + c.chem + ' in ' + c.animal + 's is ' + L + ' mg/kg of body mass. A ' + kg + ' kg ' + c.animal + ' is exposed.</p>';
    var key = L + ' mg/kg * ' + kg + ' kg';
    var steps = [
      setup('setup', 'Write the setup for the whole-body dose equal to the LD50 for this ' + c.animal + ', with units.', key, { unit: 'mg', mustUse: [String(L), String(kg)], hint: 'Dose (mg/kg) × body mass (kg): the kg cancel.',
        mistakes: [{ expr: L + ' / ' + kg, why: 'Multiply: mg per kg × kg gives mg. Dividing gives mg per kg squared, which is not a dose.' }] }),
      unit('answer', 'Now the dose with its unit.', total, 'mg', { hint: 'In mg.', mistakes: [{ value: E({ fn: 'div', args: [L, kg] }), why: 'Multiply the dose per kg by the body mass; do not divide.' }] }),
      num('perkg', 'The ' + c.animal + ' actually takes in ' + big(ate) + ' mg. What dose is that per kg of body mass?', perkg, 1, { unit: 'mg/kg', hint: 'Divide by the body mass.',
        mistakes: [{ value: E({ fn: 'mul', args: [ate, kg] }), why: 'Divide the total by the body mass to get mg per kg.' }] }),
      choice('means', 'Which statement about this ' + c.animal + ' is correct?', [
        [perkg >= L ? 'It received at least the LD50, a dose that killed half of a test population, so it is at serious risk, but death is not certain.' : 'It received less than the LD50, so it is less likely to die than the animals in the test, but harm is still possible.',
          'Right. LD50 describes a test population: at that dose half died. One animal may be more or less sensitive.'],
        [perkg >= L ? 'It will certainly die, because the dose is above the LD50.' : 'It is completely safe, because the dose is below the LD50.', 'LD50 is a population measure. ' + (perkg >= L ? 'At the LD50 half the test animals survived.' : 'Below the LD50 some test animals still died, and harm short of death is possible.')],
        ['It has a 50% chance of dying whatever the dose, because LD stands for 50%.', 'LD50 is the dose that killed 50% of the test population. The risk depends on the dose received.'],
        ['LD50 does not apply, because it is measured per kg.', 'Measuring per kg is what lets the same LD50 apply to animals of any size: multiply by body mass.']
      ])
    ];
    var sol = ['Whole-body LD50 dose = ' + L + ' mg/kg × ' + kg + ' kg = ' + big(total) + ' mg (the kg cancel).',
      'Its dose: ' + big(ate) + ' mg / ' + kg + ' kg = ' + M.fmt(perkg, 3) + ' mg/kg, ' + (perkg >= L ? 'at or above' : 'below') + ' the LD50 of ' + L + ' mg/kg.',
      'LD50 is the dose that kills 50% of a test population. It describes a population, so it cannot say for sure what happens to one animal.'];
    return { ctx: c.id, topic: c.topic, type: 'dose', text: text, steps: steps, solution: sol,
      given: { ld50: L, kg: kg, ate: ate }, figure: { kind: 'body', kg: kg, ld50: L, animal: c.animal } };
  }

  function genMagnify(r, c){
    var c0 = r.pick(c.c0 || [0.00002, 0.00003, 0.00005, 0.0001]), f = r.pick(c.factors || [10]), lv = r.int(3, 4);
    var top = E({ fn: 'biomagnify', args: [c0, f, lv] }), mid = E({ fn: 'biomagnify', args: [c0, f, 1] });
    var names = c.levels || CHAIN.map(function(x){ return x.name.toLowerCase(); });
    var text = '<p>' + c.lead + ' The water holds ' + dec(c0) + ' ppm of ' + c.chem + '. In this food chain the concentration is multiplied by about ' + f + ' at each step up: ' + names.slice(0, lv + 1).join(' → ') + '.</p>';
    var key = dec(c0) + ' ppm * ' + f + '^' + lv;
    var steps = [
      setup('topset', 'Write the setup for the concentration in the ' + names[lv] + ' (' + lv + ' steps up from the water).', key, { unit: 'ppm', mustUse: [dec(c0)], hint: 'Multiply by ' + f + ' once for each step: ' + f + '^' + lv + '.',
        mistakes: [{ expr: dec(c0) + ' ppm * ' + f + ' * ' + lv, why: 'The factor multiplies at each step, so it is ' + f + '^' + lv + ', not ' + f + ' × ' + lv + '.' },
          { expr: dec(c0) + ' ppm * ' + f + '^' + (lv + 1), why: 'Count the steps up from the water: the ' + names[lv] + ' is ' + lv + ' steps up, not ' + (lv + 1) + '.' },
          { expr: dec(c0) + ' ppm * ' + f + '^' + (lv - 1), why: 'Count every step from the water: the ' + names[lv] + ' is ' + lv + ' steps up.' }] }),
      unit('top', 'Now the concentration with its unit.', top, 'ppm', { hint: 'You may type it as a decimal or as 2e-1.',
        mistakes: [{ value: E({ fn: 'mul', args: [c0, f, lv] }), why: 'Multiply by ' + f + ' at every step (' + f + '^' + lv + '), not by ' + f + ' × ' + lv + '.' }] }),
      num('factor', 'How many times more concentrated is ' + the(c.chem) + ' in the ' + names[lv] + ' than in the ' + names[1] + '?', E({ fn: 'magnification', args: [top, mid] }), 0, { hint: 'Divide the higher concentration by the lower one.',
        mistakes: [{ value: E({ fn: 'magnification', args: [top, c0] }), why: 'That compares with the water. The question compares with the ' + names[1] + '.' }] }),
      choice('word', 'Which word names what happens across this food chain?', [
        ['Biomagnification: the concentration rises at each trophic level, because each predator eats many prey that each hold the chemical.', 'Right. Biomagnification is the increase from one trophic level to the next, up a food chain.'],
        ['Bioaccumulation: the concentration rises at each trophic level.', 'Bioaccumulation is the build-up in one organism over its life. The increase from level to level is biomagnification.'],
        ['Biomagnification: the chemical builds up in one fish as it gets older.', 'That is bioaccumulation, in one organism over time. Biomagnification is across trophic levels.'],
        ['Eutrophication: the nutrients rise at each trophic level.', 'Eutrophication is nutrient enrichment of water. Fat-soluble toxins rising up a food chain is biomagnification.']
      ])
    ];
    var sol = ['Each step up multiplies the concentration by ' + f + ': ' + dec(c0) + ' ppm × ' + f + '^' + lv + ' = ' + dec(top) + ' ppm in the ' + names[lv] + '.',
      'Compared with the ' + names[1] + ' (' + dec(mid) + ' ppm): ' + dec(top) + ' / ' + dec(mid) + ' = ' + big(M.round(top / mid, 0)) + ' times.',
      'Persistent, fat-soluble chemicals (DDT, mercury, PCBs) are stored in fat rather than excreted. A predator eats many prey, so it takes in all of theirs: biomagnification. Within one animal, the build-up over its life is bioaccumulation.'];
    return { ctx: c.id, topic: c.topic, type: 'magnify', text: text, steps: steps, solution: sol,
      given: { c0: c0, f: f, lv: lv }, figure: { kind: 'chain', c0: c0, f: f, lv: lv, names: names } };
  }

  function genCompare(r, c){
    var a = r.pick(c.a || [5, 10, 20, 25]), mult = r.pick([4, 5, 10, 20, 50]), b = a * mult, names = r.pick([[c.chems[0], c.chems[1]], [c.chems[1], c.chems[0]]]);
    var aFirst = names[0] === c.chems[0];
    var L1 = aFirst ? a : b, L2 = aFirst ? b : a, lowName = aFirst ? names[0] : names[1], highName = aFirst ? names[1] : names[0];
    var text = '<p>' + c.lead + ' In the same rat test, ' + cap(names[0]) + ' has an oral LD50 of ' + big(L1) + ' mg/kg and ' + names[1] + ' has an LD50 of ' + big(L2) + ' mg/kg.</p>';
    var steps = [
      choice('which', 'Which chemical is more toxic?', [
        [cap(lowName) + ', the one with the lower LD50.', 'Right. Less of it is needed to kill half of the rats.'],
        [cap(highName) + ', the one with the higher LD50.', 'A higher LD50 means more is needed to kill half: less toxic.'],
        ['Neither: LD50 values cannot be compared.', 'LD50 values from the same kind of test are the standard way to compare toxicity.'],
        ['Both are equally toxic, because each LD50 kills half the rats.', 'Each kills half at its own LD50, but one needs a much smaller dose.']
      ]),
      num('times', 'How many times more toxic is ' + lowName + ', by LD50?', E({ fn: 'div', args: [b, a] }), 0, { hint: 'Divide the larger LD50 by the smaller.',
        mistakes: [{ value: E({ fn: 'sub', args: [b, a] }), why: 'That is the difference. "How many times" means divide.' }] })
    ];
    var sol = ['Lower LD50 = more toxic: ' + cap(lowName) + ' (' + big(a) + ' mg/kg).', big(b) + ' / ' + big(a) + ' = ' + mult + ': it takes ' + mult + ' times as much ' + highName + ' to kill half of the rats.'];
    return { ctx: c.id, topic: c.topic, type: 'compare', text: text, steps: steps, solution: sol,
      given: { L1: L1, L2: L2, names: names }, figure: { kind: 'compare', names: names, ld: [L1, L2] } };
  }

  var GEN = { read: genRead, dose: genDose, magnify: genMagnify, compare: genCompare };
  M.register('doseResponse', {
    curve: curve, responseAt: responseAt, ld50: ld50, threshold: threshold, CHEMICALS: CHEMICALS, CHAIN: CHAIN, chainLevels: chainLevels, accumulate: accumulate, dec: dec,
    cap: cap, TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var types = ctx.types || Object.keys(GEN);
      var ty = type && types.indexOf(type) > -1 ? type : r.pick(types);
      return GEN[ty](r, ctx);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
