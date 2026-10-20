/* Soil texture model: ApEnvMath.soilTexture (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T2, docs/apenv-briefs/t2.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/soil-texture.mjs)
   and the test (scripts/test/apenv-tool-soil-texture.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/soil-texture.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/soil-texture.js.

   The model
     classify(sand, silt, clay) -> class id. The USDA texture classes by
       their published boundary rules (Soil Survey Manual, USDA Handbook 18,
       2017, ch. 3), the same rules the triangle's lines are drawn from:
       sand + silt + clay = 100 (percent of the mineral fraction, < 2 mm).
     POLYS[class] -> the class's corners as [sand, silt, clay], so the
       triangle is drawn exactly from the rules (the test checks every
       polygon's centre classifies as its class, and the polygons tile the
       triangle).
     props(sand, silt, clay) -> { porosity, permeability, holding, ... }:
       relative 0 to 1 scores (more clay: more total pore space and water
       held but slower drainage; more sand: big pores, fast drainage, little
       water held; loams balance them). Shown as words and bars; the exam
       asks for the direction, not a number.
     infiltration(sand, silt, clay) -> a typical rate in cm/hr from the
       class (ranges after the USDA hydrologic soil groups), for the
       percolation drill.
   Drills (every number from ApEnvCalc, never typed)
     TYPES  classify, missing, porosity, horizons, erosion, percolation
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, givens, figure } */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  function C(){ return M.Calc(); }

  var CLASSES = [
    { id: 'sand', name: 'Sand' }, { id: 'loamy-sand', name: 'Loamy sand' }, { id: 'sandy-loam', name: 'Sandy loam' },
    { id: 'loam', name: 'Loam' }, { id: 'silt-loam', name: 'Silt loam' }, { id: 'silt', name: 'Silt' },
    { id: 'sandy-clay-loam', name: 'Sandy clay loam' }, { id: 'clay-loam', name: 'Clay loam' }, { id: 'silty-clay-loam', name: 'Silty clay loam' },
    { id: 'sandy-clay', name: 'Sandy clay' }, { id: 'silty-clay', name: 'Silty clay' }, { id: 'clay', name: 'Clay' }
  ];
  function nameOf(id){ for(var i = 0; i < CLASSES.length; i++) if(CLASSES[i].id === id) return CLASSES[i].name; return id; }

  /* The USDA rules (Soil Survey Manual 2017, chapter 3, texture class
     definitions). Boundaries belong to the class named first in the manual's
     order below, so every point has exactly one class. */
  function classify(sand, silt, clay){
    var s = sand, si = silt, c = clay;
    if(si + 1.5 * c < 15) return 'sand';
    if(si + 1.5 * c >= 15 && si + 2 * c < 30) return 'loamy-sand';
    if((c >= 7 && c < 20 && s > 52 && si + 2 * c >= 30) || (c < 7 && si < 50 && si + 2 * c >= 30)) return 'sandy-loam';
    if(c >= 7 && c < 27 && si >= 28 && si < 50 && s <= 52) return 'loam';
    if((si >= 50 && c >= 12 && c < 27) || (si >= 50 && si < 80 && c < 12)) return 'silt-loam';
    if(si >= 80 && c < 12) return 'silt';
    if(c >= 20 && c < 35 && si < 28 && s > 45) return 'sandy-clay-loam';
    if(c >= 27 && c < 40 && s > 20 && s <= 45) return 'clay-loam';
    if(c >= 27 && c < 40 && s <= 20) return 'silty-clay-loam';
    if(c >= 35 && s > 45) return 'sandy-clay';
    if(c >= 40 && si >= 40) return 'silty-clay';
    if(c >= 40 && s <= 45 && si < 40) return 'clay';
    return null; // never reached for sand + silt + clay = 100 (the test sweeps every point)
  }

  /* Each class's corners [sand, silt, clay], read off the rules above. */
  var POLYS = {
    'sand': [[100, 0, 0], [85, 15, 0], [90, 0, 10]],
    'loamy-sand': [[85, 15, 0], [70, 30, 0], [85, 0, 15], [90, 0, 10]],
    'sandy-loam': [[70, 30, 0], [50, 50, 0], [43, 50, 7], [52, 41, 7], [52, 28, 20], [80, 0, 20], [85, 0, 15]],
    'loam': [[52, 41, 7], [43, 50, 7], [23, 50, 27], [45, 28, 27], [52, 28, 20]],
    'silt-loam': [[50, 50, 0], [20, 80, 0], [8, 80, 12], [0, 88, 12], [0, 73, 27], [23, 50, 27], [43, 50, 7]],
    'silt': [[20, 80, 0], [0, 100, 0], [0, 88, 12], [8, 80, 12]],
    'sandy-clay-loam': [[80, 0, 20], [52, 28, 20], [45, 28, 27], [45, 20, 35], [65, 0, 35]],
    'clay-loam': [[45, 28, 27], [20, 53, 27], [20, 40, 40], [45, 15, 40]],
    'silty-clay-loam': [[20, 53, 27], [0, 73, 27], [0, 60, 40], [20, 40, 40]],
    'sandy-clay': [[65, 0, 35], [45, 20, 35], [45, 0, 55]],
    'silty-clay': [[20, 40, 40], [0, 60, 40], [0, 40, 60]],
    'clay': [[45, 15, 40], [20, 40, 40], [0, 40, 60], [0, 0, 100], [45, 0, 55]]
  };
  function centroid(id){
    var p = POLYS[id], a = [0, 0, 0];
    p.forEach(function(q){ a[0] += q[0]; a[1] += q[1]; a[2] += q[2]; });
    return [a[0] / p.length, a[1] / p.length, a[2] / p.length];
  }

  /* Typical infiltration (cm/hr) by class, illustrative mid values within
     the USDA hydrologic soil group ranges. */
  var INFIL = { 'sand': 20, 'loamy-sand': 6, 'sandy-loam': 2.5, 'loam': 1.3, 'silt-loam': 0.7, 'silt': 0.5, 'sandy-clay-loam': 0.4, 'clay-loam': 0.2, 'silty-clay-loam': 0.15, 'sandy-clay': 0.12, 'silty-clay': 0.1, 'clay': 0.06 };

  /* Relative properties, 0 to 1. Porosity is a fraction of the volume
     (sand about 0.36, clay about 0.5); permeability is the class's typical
     infiltration rate on a log scale from clay (0) to sand (1), so the word
     always agrees with the class and with the drills; water held and
     nutrients rise with the fine fractions. */
  function props(sand, silt, clay){
    var s = sand / 100, si = silt / 100, c = clay / 100, id = classify(sand, silt, clay);
    var porosity = 0.35 + 0.2 * c + 0.12 * si;
    var perm = (Math.log(INFIL[id]) - Math.log(INFIL.clay)) / (Math.log(INFIL.sand) - Math.log(INFIL.clay));
    var hold = Math.max(0.05, Math.min(1, 0.15 + 0.55 * si + 0.75 * c - 0.15 * s));
    var aer = Math.max(0.05, Math.min(1, 0.2 + 0.8 * s - 0.3 * c));
    var fert = Math.max(0.05, Math.min(1, 0.15 + 0.9 * c + 0.4 * si - 0.25 * Math.max(0, c - 0.45) * 2));
    return { porosity: porosity, permeability: perm, holding: hold, aeration: aer, nutrients: fert, infil: INFIL[id] };
  }
  function word(x){ return x >= 0.7 ? 'high' : x >= 0.4 ? 'medium' : 'low'; }

  /* Drainage against a loam, by class (from the infiltration table: more
     than 1.5 times a loam's rate is faster, less than 1/1.5 is slower). */
  function drainVsLoam(id){ var a = INFIL[id], b = INFIL.loam; return a > b * 1.5 ? 0 : a < b / 1.5 ? 2 : 1; }
  var SANDY = { 'sand': 1, 'loamy-sand': 1, 'sandy-loam': 1 };

  /* ---------------------------------------------------------- drills */
  var TYPES = ['classify', 'missing', 'porosity', 'horizons', 'erosion', 'percolation'];
  function choice(key, label, options, correct, why, practice, extra){
    var s = { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: practice || '2.A' };
    for(var x in extra || {}) s[x] = extra[x];
    return s;
  }
  /* A point well inside a class: from its centroid toward a random corner,
     integers, re-drawn until it is at least 3 points from every boundary
     (so the class is never a boundary call). */
  function pointIn(r, id){
    var c = centroid(id), p = POLYS[id], tries = 0;
    while(tries++ < 200){
      var q = p[r.int(0, p.length - 1)], t = r() * 0.55;
      var cl = Math.round(c[2] + (q[2] - c[2]) * t), sa = Math.round(c[0] + (q[0] - c[0]) * t), si = 100 - cl - sa;
      if(si < 0 || sa < 0 || cl < 0) continue;
      if(classify(sa, si, cl) !== id) continue;
      if(margin(sa, si, cl) < 3) continue;
      return [sa, si, cl];
    }
    var k = c.map(Math.round); k[1] = 100 - k[0] - k[2];
    return k;
  }
  function margin(sa, si, cl){
    var id = classify(sa, si, cl), m = 99;
    for(var d = 1; d <= 3; d++){
      [[d, -d, 0], [-d, d, 0], [d, 0, -d], [-d, 0, d], [0, d, -d], [0, -d, d]].forEach(function(v){
        var a = sa + v[0], b = si + v[1], c = cl + v[2];
        if(a < 0 || b < 0 || c < 0) return;
        if(classify(a, b, c) !== id) m = Math.min(m, d);
      });
    }
    return m === 99 ? 9 : m;
  }
  function distractors(r, id, n){
    var near = { 'sand': ['loamy-sand', 'sandy-loam', 'silt'], 'loamy-sand': ['sand', 'sandy-loam', 'loam'], 'sandy-loam': ['loamy-sand', 'loam', 'sandy-clay-loam'], 'loam': ['sandy-loam', 'silt-loam', 'clay-loam'],
      'silt-loam': ['silt', 'loam', 'silty-clay-loam'], 'silt': ['silt-loam', 'sand', 'silty-clay'], 'sandy-clay-loam': ['sandy-loam', 'clay-loam', 'sandy-clay'], 'clay-loam': ['loam', 'silty-clay-loam', 'sandy-clay-loam'],
      'silty-clay-loam': ['silt-loam', 'clay-loam', 'silty-clay'], 'sandy-clay': ['sandy-clay-loam', 'clay', 'sand'], 'silty-clay': ['silty-clay-loam', 'clay', 'silt'], 'clay': ['silty-clay', 'sandy-clay', 'clay-loam'] }[id];
    return M.shuffle(r, near).slice(0, n);
  }

  function genClassify(r, ctx){
    var pool = ctx.classes || CLASSES.map(function(c){ return c.id; });
    var id = r.pick(pool), pt = pointIn(r, id);
    var opts = [id].concat(distractors(r, id, 3)), order = M.shuffle(r, opts);
    var why = order.map(function(o){
      if(o === id) return 'Right. ' + pt[0] + '% sand, ' + pt[1] + '% silt and ' + pt[2] + '% clay meet in the ' + nameOf(id).toLowerCase() + ' region.';
      return 'Not ' + nameOf(o).toLowerCase() + '. Follow each line from its axis: clay ' + pt[2] + '% runs parallel to the sand side, sand ' + pt[0] + '% parallel to the silt side, silt ' + pt[1] + '% parallel to the clay side; they meet in ' + nameOf(id).toLowerCase() + '.';
    });
    var Cc = C(), sumKey = Cc.evaluate({ fn: 'add', args: [pt[0], pt[1], pt[2]] });
    return {
      type: 'classify', ctx: ctx.id, topic: ctx.topic,
      text: '<p>A soil sample is ' + pt[0] + '% sand, ' + pt[1] + '% silt and ' + pt[2] + '% clay. Use the texture triangle.</p>',
      givens: { sand: pt[0], silt: pt[1], clay: pt[2], cls: id }, figure: { kind: 'triangle', point: pt, reveal: false },
      steps: [
        choice('class', 'What is its texture class?', order.map(nameOf), order.indexOf(id), why, '2.A'),
        (function(){ var k = drainVsLoam(id), w = ['More sand means bigger pores between the grains, so water drains faster than through a loam.', 'This is a loam: the reference.', 'More silt and clay means tiny pores, so water drains more slowly than through a loam, even though the soil holds a lot of it.'];
          return choice('drain', 'Compared with a loam, how fast does water drain through it?', ['Faster', 'About the same', 'Slower'], k, w.map(function(x, i){ return (i === k ? 'Right. ' : 'Not here. ') + w[k]; }), '2.B', { fixed: true }); })()
      ],
      solution: ['Check: ' + pt[0] + ' + ' + pt[1] + ' + ' + pt[2] + ' = ' + sumKey + '%.', 'On the triangle the three lines meet in ' + nameOf(id).toLowerCase() + '.', 'Drainage follows the pore size: sand drains fastest, clay slowest.']
    };
  }

  function genMissing(r, ctx){
    var id = r.pick(ctx.classes || ['loam', 'sandy-loam', 'clay-loam', 'silt-loam', 'sandy-clay-loam', 'silty-clay-loam', 'clay', 'silty-clay']);
    var pt = pointIn(r, id), which = r.pick(['silt', 'clay', 'sand']), names = ['sand', 'silt', 'clay'];
    var idx = names.indexOf(which), known = names.filter(function(n){ return n !== which; });
    var Cc = C(), ans = Cc.evaluate({ fn: 'sub', args: [100, { fn: 'add', args: [pt[names.indexOf(known[0])], pt[names.indexOf(known[1])]] }] });
    var a = pt[names.indexOf(known[0])], b = pt[names.indexOf(known[1])];
    var opts = [id].concat(distractors(r, id, 3)), order = M.shuffle(r, opts);
    return {
      type: 'missing', ctx: ctx.id, topic: ctx.topic,
      text: '<p>A lab finds that a soil is ' + a + '% ' + known[0] + ' and ' + b + '% ' + known[1] + '. The rest is ' + which + '.</p>',
      givens: { sand: pt[0], silt: pt[1], clay: pt[2], which: which, cls: id }, figure: { kind: 'triangle', point: null, reveal: false },
      steps: [
        { key: 'setup', kind: 'setup', practice: '6.B', label: 'Write the setup for the percent ' + which + '.', hint: 'The three percents add up to 100.',
          cell: M.setupCell('100 - ' + a + ' - ' + b, { mustUse: ['100', String(a), String(b)], parens: false, times100: false,
            mistakes: [{ expr: '100 - ' + a, why: 'Subtract both known fractions from 100.' }, { expr: a + ' + ' + b, why: 'That is the part already measured; the ' + which + ' is what is left: 100 minus both.' }] }) },
        { key: 'ans', kind: 'unit', practice: '6.C', label: 'Percent ' + which + ', with its unit.',
          cell: M.unitCell(ans, '%', { mistakes: [{ value: Cc.evaluate({ fn: 'add', args: [a, b] }), why: 'That is the known part. Subtract it from 100.' }] }) },
        choice('class', 'Now place it on the triangle. What is its texture class?', order.map(nameOf), order.indexOf(id), order.map(function(o){ return o === id ? 'Right: ' + pt[0] + '% sand, ' + pt[1] + '% silt, ' + pt[2] + '% clay is ' + nameOf(id).toLowerCase() + '.' : 'Not ' + nameOf(o).toLowerCase() + '. With ' + which + ' = ' + ans + '%, the lines meet in ' + nameOf(id).toLowerCase() + '.'; }), '2.A')
      ],
      solution: [which.charAt(0).toUpperCase() + which.slice(1) + ' = 100 − ' + a + ' − ' + b + ' = ' + ans + '%.', 'Sand ' + pt[0] + '%, silt ' + pt[1] + '%, clay ' + pt[2] + '%: ' + nameOf(id).toLowerCase() + '.']
    };
  }

  var PORO_Q = [
    { label: 'Which soil holds the most water after it drains (highest water-holding capacity)?', options: ['Clay', 'Sand', 'Loamy sand', 'Gravel'], why: ['Right. Clay\'s tiny particles have a huge total surface area and many small pores that hold water tightly.', 'Sand\'s big pores let water drain away.', 'Mostly sand: it drains fast and holds little.', 'Gravel\'s large spaces hold almost no water.'] },
    { label: 'Which soil has the highest permeability (water moves through fastest)?', options: ['Sand', 'Clay', 'Silty clay', 'Silt loam'], why: ['Right. Large particles leave large, connected pores, so water flows through quickly.', 'Clay\'s pores are tiny; water moves very slowly.', 'Silt and clay together: very slow.', 'Fine silt slows water down.'] },
    { label: 'Clay soil has more total pore space than sand. Why does water still move through it more slowly?', options: ['Its pores are much smaller, so water moves through them slowly', 'Clay particles are larger than sand grains', 'Clay has no pores', 'Sand absorbs water into its grains'], why: ['Right. Porosity is the total pore volume; permeability depends on pore size and how well the pores connect.', 'Clay particles are the smallest (under 0.002 mm); sand is the largest (0.05 to 2 mm).', 'Clay is very porous; its pores are just tiny.', 'Water moves between sand grains, not into them.'] },
    { label: 'Why is a loam often the best soil for most crops?', options: ['It drains well yet holds enough water and nutrients', 'It is pure clay, so it holds the most water', 'It is mostly sand, so it never waterlogs', 'It has no organic matter'], why: ['Right. A balance of sand (drainage, air), silt and clay (water and nutrients held) suits most plants.', 'A loam is a mix, not pure clay, and pure clay can waterlog.', 'A loam is a mix of all three.', 'Loams usually have good organic matter.'] },
    { label: 'Which particle size order is right, largest first?', options: ['Sand, silt, clay', 'Clay, silt, sand', 'Silt, sand, clay', 'Sand, clay, silt'], why: ['Right. Sand 0.05 to 2 mm, silt 0.002 to 0.05 mm, clay under 0.002 mm.', 'That is smallest first.', 'Silt is between sand and clay.', 'Clay is the smallest.'] },
    { label: 'A sandy soil drains so fast that crops wilt. What would raise its water-holding capacity?', options: ['Adding organic matter (compost)', 'Adding more sand', 'Removing the topsoil', 'Compacting it with heavy machinery'], why: ['Right. Organic matter (humus) acts like a sponge and also adds nutrients.', 'More sand makes it drain even faster.', 'Topsoil holds most of the organic matter and nutrients.', 'Compaction reduces pore space and harms roots.'] }
  ];
  function genPorosity(r, ctx){
    var a = r.pick(PORO_Q), b = r.pick(PORO_Q.filter(function(q){ return q !== a; }));
    var steps = [a, b].map(function(q, i){ var order = M.shuffle(r, [0, 1, 2, 3]); return choice('p' + (i + 1), q.label, order.map(function(k){ return q.options[k]; }), order.indexOf(0), order.map(function(k){ return q.why[k]; }), i ? '1.B' : '1.A'); });
    return { type: 'porosity', ctx: ctx.id, topic: ctx.topic, text: '<p>Soil texture controls how much water a soil holds and how fast water moves through it.</p>',
      givens: { qs: [PORO_Q.indexOf(a), PORO_Q.indexOf(b)] }, figure: { kind: 'columns' }, steps: steps, solution: [a.why[0], b.why[0]] };
  }

  var HORIZONS = [
    { id: 'O', name: 'O horizon', what: 'Organic matter: leaf litter and humus at the surface' },
    { id: 'A', name: 'A horizon', what: 'Topsoil: humus mixed with minerals, where most roots and organisms live' },
    { id: 'E', name: 'E horizon', what: 'Eluviation zone: water leaches minerals and nutrients down out of it' },
    { id: 'B', name: 'B horizon', what: 'Subsoil: minerals and clay leached from above collect here' },
    { id: 'C', name: 'C horizon', what: 'Partly weathered parent material' },
    { id: 'R', name: 'R horizon', what: 'Bedrock' }
  ];
  function genHorizons(r, ctx){
    var a = r.pick(HORIZONS), b = r.pick(HORIZONS.filter(function(h){ return h !== a; }));
    function step(h, key){
      var opts = M.shuffle(r, [h].concat(M.shuffle(r, HORIZONS.filter(function(x){ return x !== h; })).slice(0, 3)));
      return choice(key, 'Which horizon is this: ' + h.what.charAt(0).toLowerCase() + h.what.slice(1) + '?', opts.map(function(x){ return x.name; }), opts.indexOf(h), opts.map(function(x){ return x === h ? 'Right. The ' + h.name + ' is ' + h.what.charAt(0).toLowerCase() + h.what.slice(1) + '.' : 'The ' + x.name + ' is ' + x.what.charAt(0).toLowerCase() + x.what.slice(1) + '.'; }), '2.A');
    }
    var order = ['O', 'A', 'E', 'B', 'C', 'R'];
    return { type: 'horizons', ctx: ctx.id, topic: ctx.topic, text: '<p>A soil profile shows layers called horizons, from the surface down to bedrock.</p>',
      givens: { a: a.id, b: b.id }, figure: { kind: 'profile', ask: [a.id, b.id] },
      steps: [step(a, 'h1'), step(b, 'h2'), choice('order', 'Which order runs from the surface down?', ['O, A, E, B, C, R', 'A, O, B, E, C, R', 'R, C, B, E, A, O', 'O, A, B, E, R, C'], 0, ['Right. Organic layer, topsoil, leached zone, subsoil, parent material, bedrock.', 'The organic layer (O) is on top of the topsoil (A).', 'That is from the bottom up.', 'The leached zone (E) sits above the subsoil (B) that collects what is leached, and bedrock (R) is at the very bottom.'], '2.A', { fixed: true })],
      solution: ['From the top: ' + order.map(function(id){ return HORIZONS.filter(function(h){ return h.id === id; })[0].name + ' (' + HORIZONS.filter(function(h){ return h.id === id; })[0].what.split(':')[0].toLowerCase() + ')'; }).join(', ') + '.'] };
  }

  var EROSION_Q = [
    { label: 'Which practice best reduces soil erosion on a sloped field?', options: ['Contour plowing (rows that follow the slope\'s contour)', 'Plowing straight up and down the slope', 'Removing the cover crop after harvest', 'Leaving the soil bare over winter'], why: ['Right. Rows across the slope slow the runoff so it cannot carry soil away.', 'Up-and-down rows make channels that speed runoff and erosion.', 'Cover crops hold soil; removing them exposes it.', 'Bare soil is easily eroded by wind and water.'] },
    { label: 'Windbreaks (rows of trees around a field) reduce erosion by', options: ['slowing the wind across the field', 'adding nitrogen to the soil', 'making the soil more acidic', 'increasing runoff'], why: ['Right. Slower wind lifts and carries away less topsoil.', 'That is legumes\' job (nitrogen fixation).', 'Windbreaks do not change pH much.', 'Windbreaks reduce erosion; they do not increase runoff.'] },
    { label: 'No-till agriculture reduces erosion because', options: ['crop residue stays on the surface and roots hold the soil', 'the soil is plowed more deeply', 'fertilizer use goes up', 'the field is left bare'], why: ['Right. Undisturbed soil keeps its structure, and the residue shields it from rain and wind.', 'No-till means no plowing.', 'No-till is about not plowing, not fertilizer.', 'No-till leaves residue covering the soil.'] },
    { label: 'Terracing a steep hillside reduces erosion by', options: ['turning the slope into flat steps that slow runoff', 'making the slope steeper', 'removing all vegetation', 'draining the soil faster downhill'], why: ['Right. Each flat step holds water and soil in place.', 'Terraces make flat steps, not steeper slopes.', 'Vegetation holds soil; terracing does not remove it.', 'Terraces slow water down.'] },
    { label: 'Which is a consequence of losing topsoil to erosion?', options: ['Lower fertility and more sediment in nearby streams', 'Higher fertility', 'More organic matter in the field', 'Clearer streams'], why: ['Right. Topsoil holds most nutrients and organic matter; eroded soil clouds streams and can carry fertilizer with it.', 'Topsoil is the most fertile layer; losing it lowers fertility.', 'Organic matter is lost with the topsoil.', 'Sediment makes streams more turbid.'] }
  ];
  function genErosion(r, ctx){
    var a = r.pick(EROSION_Q), b = r.pick(EROSION_Q.filter(function(q){ return q !== a; }));
    var steps = [a, b].map(function(q, i){ var order = M.shuffle(r, [0, 1, 2, 3]); return choice('e' + (i + 1), q.label, order.map(function(k){ return q.options[k]; }), order.indexOf(0), order.map(function(k){ return q.why[k]; }), '7.B'); });
    return { type: 'erosion', ctx: ctx.id, topic: ctx.topic, text: '<p>Topsoil forms very slowly (centuries for a few centimeters) but can erode in a few seasons.</p>',
      givens: { qs: [EROSION_Q.indexOf(a), EROSION_Q.indexOf(b)] }, figure: { kind: 'profile', ask: [] }, steps: steps, solution: [a.why[0], b.why[0]] };
  }

  /* A percolation (infiltration) test: water level drop over time -> rate. */
  function genPercolation(r, ctx){
    var Cc = C(), id = r.pick(['sand', 'loamy-sand', 'sandy-loam', 'silt-loam', 'clay-loam', 'silty-clay-loam']), rate0 = INFIL[id];
    var mins = SANDY[id] ? r.pick([10, 15, 20, 30, 60]) : r.pick([30, 60, 90, 120]), drop = M.sig(rate0 * mins / 60 * r.pick([0.8, 1, 1.2]), 2);
    if(drop < 0.1) drop = 0.1;
    var hrs = Cc.evaluate({ fn: 'convert', args: [mins, 'min', 'h'] });
    var rate = Cc.evaluate({ fn: 'div', args: [drop, hrs] });
    var perMin = Cc.evaluate({ fn: 'div', args: [drop, mins] });
    var text = '<p>In a percolation test, water in a ring pushed into the soil drops ' + drop + ' cm in ' + mins + ' minutes. What is the infiltration rate in cm per hour?</p>';
    var faster = !!SANDY[id];
    return {
      type: 'percolation', ctx: ctx.id, topic: ctx.topic, text: text, givens: { drop: drop, mins: mins, cls: id },
      figure: { kind: 'ring', drop: drop, mins: mins },
      steps: [
        { key: 'setup', kind: 'setup', practice: '6.B', label: 'Write the setup: the drop divided by the time in hours.', hint: 'For example 3 / (20 / 60), or 3 / 20 * 60.',
          cell: M.setupCell(drop + ' / (' + mins + ' / 60)', { mustUse: [String(drop), String(mins)], parens: false, times100: false,
            mistakes: [{ expr: drop + ' / ' + mins, why: 'That is cm per minute. Convert the minutes to hours (÷ 60) first, or multiply by 60.' }, { expr: mins + ' / ' + drop, why: 'Upside down: a rate is distance ÷ time.' }] }) },
        { key: 'ans', kind: 'unit', practice: '6.C', label: 'Infiltration rate, with its unit.',
          cell: M.unitCell(rate, 'cm/hr', { units: ['cm/h', 'cm per hour'], mistakes: [{ value: perMin, why: 'That is cm per minute; × 60 gives cm per hour.' }] }) },
        choice('soil', 'Is this soil more likely sandy or clayey?', ['Sandy: water soaks in fast', 'Clayey: water soaks in slowly'], faster ? 0 : 1,
          [faster ? 'Right. Over about 2 cm/hr is typical of sandy soils, whose big pores let water in quickly.' : 'Not at this rate. Sandy soils usually take in more than about 2 cm/hr.', faster ? 'Not at this rate. Clay soils usually take in well under 1 cm/hr.' : 'Right. A slow rate points to fine silt and clay particles with tiny pores.'], '5.C', { fixed: true })
      ],
      solution: [mins + ' min = ' + M.fmt(hrs, 3) + ' hr.', 'Rate = ' + drop + ' cm ÷ ' + M.fmt(hrs, 3) + ' hr = ' + M.fmt(rate, 3) + ' cm/hr.', faster ? 'A fast rate: a sandy soil.' : 'A slow rate: more silt and clay.']
    };
  }

  function generate(r, ctx, type){
    ctx = ctx || {};
    type = type || r.pick(ctx.types || TYPES);
    switch(type){
      case 'classify': return genClassify(r, ctx);
      case 'missing': return genMissing(r, ctx);
      case 'porosity': return genPorosity(r, ctx);
      case 'horizons': return genHorizons(r, ctx);
      case 'erosion': return genErosion(r, ctx);
      case 'percolation': return genPercolation(r, ctx);
    }
    throw new Error('soil-texture: unknown problem type ' + type);
  }

  M.register('soilTexture', {
    CLASSES: CLASSES, POLYS: POLYS, HORIZONS: HORIZONS, INFIL: INFIL, PORO_Q: PORO_Q, EROSION_Q: EROSION_Q,
    nameOf: nameOf, classify: classify, centroid: centroid, props: props, word: word, margin: margin, pointIn: pointIn,
    drainVsLoam: drainVsLoam, SANDY: SANDY, TYPES: TYPES, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
