/* Climate change model: ApEnvMath.climateChange (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/apenv-briefs/t4.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/climate-change.mjs)
   and the test (scripts/test/apenv-tool-climate-change.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/climate-change.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/climate-change.js.

   The science (CED 9.1-9.7), kept apart where students mix it up:
     GREENHOUSE EFFECT (troposphere, infrared). Sunlight (mostly visible)
       passes through; the surface warms and emits infrared; greenhouse gases
       (water vapor, CO2, CH4, N2O, CFCs) absorb infrared and re-emit some of
       it back down.
       forcing(ppm)   5.35 × ln(C / 280) W/m² (Myhre et al. 1998, the IPCC
                      expression), 280 ppm the preindustrial level
       warming(ppm)   forcing × λ, λ set so a doubling gives 3 °C (IPCC AR6
                      best estimate of equilibrium climate sensitivity)
     OZONE LAYER (stratosphere, ultraviolet). Ozone at about 15-35 km
       absorbs UV-B and UV-C. Chlorine from CFCs destroys it catalytically:
       Cl + O3 -> ClO + O2, then ClO + O -> Cl + O2, so one chlorine atom
       destroys many ozone molecules.
       ozone(cfc)     a column in Dobson units, 300 DU with no CFCs, down to
                      120 DU at the most (an ozone hole is under 220 DU)
       uvb(du)        UV-B at the surface relative to 300 DU, (300/DU)^1.2
                      (a radiation amplification factor of about 1.2)
       The ozone hole is not the cause of global warming, and CO2 does not
       destroy ozone (CFCs are also greenhouse gases: said where it matters).
     OCEAN ACIDIFICATION. CO2 + H2O -> H2CO3 -> H+ + HCO3-; the extra H+
       combines with carbonate (CO3 2-), so shells and coral (calcium
       carbonate) are harder to build and can dissolve.
       ph(ppm)        8.2 − 0.6 × log10(C / 280), a simple fit: about 8.1 at
                      420 ppm (NOAA: surface pH fell about 0.1 since 1850)
       hFactor(ph0, ph1) 10^(ph0 − ph1): how many times more H+ ions
     SEA LEVEL. Melting land ice (glaciers, Greenland, Antarctica) adds water
       to the ocean; warming water expands (thermal expansion). Melting sea
       ice does not raise sea level: floating ice already displaces its own
       weight of water.
       expansion(beta, depth, dT) beta × depth × dT, beta 0.00021 per °C
                      (seawater near 20 °C), a simplified model
       GREENLAND 7.4 m of sea-level equivalent (IPCC AR6), ANTARCTICA 58 m
     GWP (100-year, IPCC AR5): CO2 1, CH4 28, N2O 265, CFC-12 10,200.
   Every number a drill shows comes from ApEnvCalc (M.Calc()), never typed.
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, given, figure }
     types: gases (greenhouse effect vs ozone layer, three choices), co2
     (percent change in CO2), ph (acidification: times more H+, percent,
     the chemistry), sealevel (thermal expansion in cm; which ice raises sea
     level), gwp (CO2 equivalent). */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  function C(){ return M.Calc(); }
  function E(recipe){ return C().evaluate(recipe); }

  var PRE = 280, ECS = 3, LAMBDA = ECS / (5.35 * Math.log(2));
  function forcing(ppm){ return 5.35 * Math.log(ppm / PRE); }
  function warming(ppm){ return LAMBDA * forcing(ppm); }
  function ozone(cfc){ cfc = Math.max(0, Math.min(1, cfc)); return 300 - 180 * cfc; }
  function uvb(du){ return Math.pow(300 / du, 1.2); }
  function ph(ppm){ return 8.2 - 0.6 * Math.log10(ppm / PRE); }
  function hFactor(ph0, ph1){ return E({ fn: 'pow', args: [10, { fn: 'sub', args: [ph0, ph1] }] }); }
  function expansion(beta, depth, dT){ return E({ fn: 'mul', args: [beta, depth, dT] }); }
  var BETA = 0.00021, GREENLAND = 7.4, ANTARCTICA = 58;
  var GWP = { CO2: 1, CH4: 28, N2O: 265, 'CFC-12': 10200 };
  var GAS_NAME = { CO2: 'carbon dioxide (CO₂)', CH4: 'methane (CH₄)', N2O: 'nitrous oxide (N₂O)', 'CFC-12': 'CFC-12' };

  /* ----------------------------------------------------------- drills */
  var SK = { g1: '1.A', g2: '1.B', g3: '1.B', setup: '6.B', answer: '6.C', times: '6.C', tset: '6.B', why: '1.B', shell: '1.C', exp: '6.B', cm: '6.C', ice: '1.B', gset: '6.B', co2e: '6.C', worst: '1.A' };
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
  function f(x, d){ return M.fixed(x, d); }
  function fm(x, d){ return M.minus(M.fixed(x, d)); }
  function big(x){ return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* The two systems, as question pools. Each item: [prompt, right, why
     right, [wrong, why]...]. Three are drawn per problem (one from each
     pool), so the same mix-ups come round in a new order. */
  var POOL = {
    ghg: [
      ['What do greenhouse gases absorb?', 'Infrared radiation given off by Earth\'s surface', 'Right. The surface, warmed by sunlight, gives off infrared; greenhouse gases absorb it and send some back down.',
        [['Ultraviolet radiation from the Sun', 'Absorbing UV is the job of the ozone layer in the stratosphere. Greenhouse gases absorb infrared.'], ['Visible light from the Sun', 'Most visible sunlight passes straight through the atmosphere to the surface.'], ['Radio waves from space', 'Greenhouse gases trap infrared (heat) radiation.']]],
      ['Which gas is a greenhouse gas but does not deplete stratospheric ozone?', 'Carbon dioxide (CO₂)', 'Right. CO₂ traps infrared but does not destroy ozone.',
        [['CFC-12', 'CFCs do both: they are greenhouse gases and they release the chlorine that destroys ozone.'], ['Sulfur dioxide (SO₂)', 'SO₂ is an acid-rain gas, not a greenhouse gas.'], ['Particulate matter (PM2.5)', 'Particulates are air pollutants; they are not greenhouse gases.']]],
      ['Which change would strengthen the greenhouse effect?', 'Burning fossil fuels, which adds CO₂', 'Right. More CO₂ absorbs more of the infrared leaving the surface.',
        [['Banning CFCs to protect the ozone layer', 'Banning CFCs helps the ozone layer recover (and removes a strong greenhouse gas), so it does not strengthen warming.'], ['Adding sulfur dioxide from coal plants', 'SO₂ is not a greenhouse gas; its aerosols even reflect sunlight. It causes acid rain.'], ['A larger hole in the ozone layer', 'The ozone hole lets in more UV; it is not what drives global warming.']]],
      ['Where does the greenhouse effect mainly happen?', 'In the troposphere, the lowest layer of the atmosphere', 'Right. Most water vapor and CO₂ are in the troposphere, where they absorb infrared from the surface.',
        [['In the ozone layer in the stratosphere', 'That is where ozone absorbs UV. The greenhouse effect is mostly in the lower atmosphere.'], ['Only in the ocean', 'The ocean stores heat, but the greenhouse effect is in the atmosphere.'], ['In space, just above the atmosphere', 'Greenhouse gases are in the atmosphere, mostly the troposphere.']]]
    ],
    ozone: [
      ['What does the stratospheric ozone layer absorb?', 'Ultraviolet (UV-B and UV-C) radiation from the Sun', 'Right. Ozone protects living things from harmful UV.',
        [['Infrared radiation from Earth\'s surface', 'That is what greenhouse gases absorb in the lower atmosphere.'], ['Carbon dioxide from the air', 'Ozone is a gas; it does not absorb CO₂.'], ['All sunlight, so the surface stays cool', 'Ozone absorbs mostly UV; visible light passes through.']]],
      ['How do CFCs destroy stratospheric ozone?', 'UV light frees chlorine atoms, and each chlorine atom breaks down many ozone molecules', 'Right. Cl + O₃ → ClO + O₂, then ClO + O → Cl + O₂: the chlorine is freed again and keeps going.',
        [['CFCs trap infrared, and the heat melts the ozone', 'CFCs do trap infrared, but ozone is destroyed chemically by chlorine, not by heat.'], ['CFCs react with CO₂ to form a hole', 'CO₂ is not part of ozone destruction. Chlorine from CFCs is.'], ['CFCs block sunlight, so no new ozone forms', 'The damage is chemical: chlorine atoms break ozone molecules apart.']]],
      ['What is the main health effect of a thinner ozone layer?', 'More UV-B reaches the ground: more skin cancer and cataracts', 'Right. Less ozone lets more UV-B through.',
        [['The air at the surface gets warmer', 'Warming comes from greenhouse gases trapping infrared. Ozone loss is about UV.'], ['More asthma from smog', 'Smog is ground-level ozone, a different problem from the stratospheric layer.'], ['Sea level rises', 'Sea level rises from land ice melt and thermal expansion, not ozone loss.']]],
      ['Which policy was made to protect the ozone layer?', 'The Montreal Protocol, which phased out CFCs', 'Right. Since the Montreal Protocol (1987), the ozone layer has begun to recover.',
        [['The Kyoto Protocol, which phased out CFCs', 'Kyoto (and later Paris) set limits on greenhouse gases. CFCs were phased out by the Montreal Protocol.'], ['The Clean Water Act', 'That law protects water quality in the United States.'], ['A carbon tax', 'A carbon tax targets CO₂ and climate. Ozone protection came from phasing out CFCs.']]]
    ],
    both: [
      ['A student says, "The hole in the ozone layer is the main cause of global warming." What is wrong?', 'Warming is from greenhouse gases trapping infrared; the ozone hole lets in more UV', 'Right. They are two different problems with two different kinds of radiation.',
        [['Nothing: more sunlight through the hole heats Earth', 'The extra radiation is UV, a small amount of energy. Warming comes from infrared trapped by greenhouse gases.'], ['The ozone hole cools Earth, so it cancels warming', 'Neither is the cause of the other. Keep them apart: infrared and greenhouse gases; UV and ozone.'], ['Ozone holes only happen over the ocean', 'The ozone hole is over Antarctica in spring, and it is not what drives global warming.']]],
      ['Ozone near the ground and ozone in the stratosphere are the same molecule. Which is right?', 'Stratospheric ozone is helpful (blocks UV); ground-level ozone is a harmful pollutant in smog', 'Right. Same molecule, different place: "good up high, bad nearby".',
        [['Both are harmful pollutants', 'Stratospheric ozone protects us from UV.'], ['Both are helpful, because ozone blocks UV', 'Ground-level ozone irritates lungs and damages crops: a secondary pollutant in photochemical smog.'], ['Ground-level ozone repairs the ozone hole', 'Ozone near the ground stays near the ground; it does not refill the stratosphere.']]],
      ['Which pair is matched correctly?', 'Greenhouse gases: infrared; ozone layer: ultraviolet', 'Right. Keep the radiation straight and the two systems stay apart.',
        [['Greenhouse gases: ultraviolet; ozone layer: infrared', 'Swapped. Greenhouse gases absorb infrared; ozone absorbs ultraviolet.'], ['Both absorb infrared', 'The ozone layer is known for absorbing UV.'], ['Both absorb visible light', 'Most visible light passes through to the surface.']]]
    ]
  };
  function poolStep(r, key, item){
    var opts = [[item[1], item[2]]].concat(item[3]);
    return choice(key, item[0], opts);
  }
  function genGases(r, c){
    var a = r.pick(POOL.ghg), b = r.pick(POOL.ozone), d = r.pick(POOL.both);
    var order = c.lead ? c.lead : 'Keep the greenhouse effect and the ozone layer apart.';
    var text = '<p>' + order + ' Two different systems: greenhouse gases absorb <b>infrared</b> leaving Earth\'s surface (mostly in the troposphere); the ozone layer absorbs the Sun\'s <b>ultraviolet</b> (in the stratosphere).</p>';
    var steps = [poolStep(r, 'g1', a), poolStep(r, 'g2', b), poolStep(r, 'g3', d)];
    var sol = ['Greenhouse effect: sunlight passes through, the surface emits infrared, greenhouse gases (H₂O, CO₂, CH₄, N₂O, CFCs) absorb it and re-emit some back down.',
      'Ozone depletion: UV frees chlorine from CFCs; each Cl atom destroys many O₃ molecules (Cl + O₃ → ClO + O₂; ClO + O → Cl + O₂), so more UV-B reaches the ground. Fixed by the Montreal Protocol.',
      'Not the same: the ozone hole does not cause global warming, and CO₂ does not destroy ozone.'];
    return { ctx: c.id, topic: c.topic, type: 'gases', text: text, steps: steps, solution: sol, given: { items: [a[0], b[0], d[0]] }, figure: { kind: 'atmos' } };
  }

  function genCo2(r, c){
    var y0 = r.pick(c.y0 || [1960, 1980, 1990]), y1 = r.pick(c.y1 || [2015, 2020, 2024]);
    var C0 = { 1850: 285, 1960: 317, 1970: 326, 1980: 339, 1990: 354, 2000: 370 }[y0] || 317, C1 = { 2010: 390, 2015: 401, 2020: 414, 2024: 425 }[y1] || 414;
    var ans = E({ fn: 'percentChange', args: [C0, C1] });
    var text = '<p>' + c.lead + ' Atmospheric CO₂ measured at Mauna Loa was about ' + C0 + ' ppm in ' + y0 + ' and about ' + C1 + ' ppm in ' + y1 + ' (NOAA annual means, rounded).</p>';
    var steps = [
      setup('setup', 'Write the setup for the percent change in CO₂ from ' + y0 + ' to ' + y1 + ', with brackets.', '(' + C1 + ' - ' + C0 + ') / ' + C0 + ' * 100', { mustUse: [String(C0), String(C1)], hint: '(new − old) / old × 100.',
        mistakes: [{ expr: '(' + C1 + ' - ' + C0 + ') / ' + C1 + ' * 100', why: 'Divide by the old value, ' + C0 + ' ppm in ' + y0 + '.' }] }),
      unit('answer', 'Now the answer with its unit.', ans, '%', { places: 1, hint: 'Round to 0.1.', mistakes: [{ value: E({ fn: 'div', args: [ans, 100] }), why: 'Multiply by 100 to turn the fraction into a percent.' }] }),
      choice('why', 'What is the main cause of this rise?', [
        ['Burning fossil fuels and clearing forests', 'Right. Fossil fuel combustion adds CO₂, and cutting forests removes a carbon sink.'],
        ['The hole in the ozone layer', 'The ozone hole is caused by CFCs and lets in UV. It does not add CO₂.'],
        ['Volcanoes erupting more often', 'Volcanoes release far less CO₂ each year than human activity.'],
        ['Warmer oceans releasing all their CO₂', 'The ocean is taking up CO₂ overall (that is why it is acidifying).']
      ])
    ];
    var sol = ['(' + C1 + ' − ' + C0 + ') / ' + C0 + ' × 100 = ' + f(ans, 1) + '%.', 'The rise comes from fossil fuels and deforestation; the yearly wiggle on the Keeling Curve is Northern Hemisphere plants growing in summer.'];
    return { ctx: c.id, topic: c.topic, type: 'co2', text: text, steps: steps, solution: sol, given: { C0: C0, C1: C1 }, figure: { kind: 'keeling', y0: y0, y1: y1, C0: C0, C1: C1 } };
  }

  function genPh(r, c){
    var ph0 = r.pick(c.ph0 || [8.2, 8.2, 8.1]), drop = r.pick(c.drops || [0.1, 0.2, 0.3]), ph1 = M.round(ph0 - drop, 1);
    var times = hFactor(ph0, ph1), pct = E({ fn: 'mul', args: [{ fn: 'sub', args: [times, 1] }, 100] });
    var text = '<p>' + c.lead + ' The surface water\'s pH falls from ' + f(ph0, 1) + ' to ' + f(ph1, 1) + '. Each 1.0 drop in pH means 10 times as many hydrogen ions (H⁺).</p>';
    var steps = [
      setup('tset', 'Write the setup for how many times more H⁺ ions the water holds.', '10^(' + f(ph0, 1) + ' - ' + f(ph1, 1) + ')', { mustUse: [f(ph0, 1), f(ph1, 1)], hint: 'Times more H⁺ = 10^(old pH − new pH).',
        mistakes: [{ expr: '10 * (' + f(ph0, 1) + ' - ' + f(ph1, 1) + ')', why: 'The pH scale is logarithmic: use 10 to the power of the drop, not 10 times the drop.' },
          { expr: '10^(' + f(ph1, 1) + ' - ' + f(ph0, 1) + ')', why: 'That gives a number below 1. A lower pH means more H⁺, so raise 10 to old minus new.' }] }),
      num('times', 'Now the number: how many times more H⁺?', times, 2, { hint: 'Round to 0.01.', mistakes: [{ value: E({ fn: 'mul', args: [10, drop] }), why: '10 × the drop is not right: pH is a power of ten. Use 10^drop.' }] }),
      unit('answer', 'So by what percent did the H⁺ concentration increase?', pct, '%', { places: 0, hint: 'Times more → (times − 1) × 100.',
        mistakes: [{ value: E({ fn: 'mul', args: [times, 100] }), why: 'That is the new level as a percent of the old. The increase is (times − 1) × 100.' }, { value: E({ fn: 'percentChange', args: [ph0, ph1] }), why: 'That is the percent change in the pH number. The question asks about H⁺ ions, which change by a power of ten.' }] }),
      choice('shell', 'Why does this harm corals and shellfish?', [
        ['The extra H⁺ combines with carbonate ions, so less carbonate is left to build calcium carbonate shells and skeletons', 'Right. CO₂ + H₂O → H₂CO₃ → H⁺ + HCO₃⁻, and H⁺ + CO₃²⁻ → HCO₃⁻: carbonate is used up, and shells can even dissolve.'],
        ['The water gets warmer, which melts their shells', 'Warming causes coral bleaching, a separate stress. Acidification is chemistry: carbonate is used up.'],
        ['UV from the ozone hole dissolves their shells', 'UV and the ozone layer are a different problem. Acidification comes from CO₂ dissolving in seawater.'],
        ['The ocean becomes acidic, below pH 7', 'The ocean is still basic (above pH 7). "Acidification" means its pH is falling toward acidic.']
      ])
    ];
    var sol = ['10^(' + f(ph0, 1) + ' − ' + f(ph1, 1) + ') = 10^' + f(drop, 1) + ' = ' + f(times, 2) + ' times as many H⁺ ions.',
      '(' + f(times, 2) + ' − 1) × 100 = ' + f(pct, 0) + '% more H⁺.',
      'CO₂ dissolves: CO₂ + H₂O → H₂CO₃ → H⁺ + HCO₃⁻. The H⁺ takes up carbonate (CO₃²⁻), which corals, oysters and pteropods need for calcium carbonate.'];
    return { ctx: c.id, topic: c.topic, type: 'ph', text: text, steps: steps, solution: sol, given: { ph0: ph0, ph1: ph1 }, figure: { kind: 'ph', ph0: ph0, ph1: ph1 } };
  }

  function genSea(r, c){
    var depth = r.pick(c.depth || [500, 700, 1000]), dT = r.pick(c.dT || [0.3, 0.4, 0.5, 0.6, 0.8]);
    var m = expansion(BETA, depth, dT), cm = E({ fn: 'convert', args: [m, 'm', 'cm'] });
    var text = '<p>' + c.lead + ' In a simplified model, seawater expands by ' + BETA + ' of its depth for each 1 °C of warming. Suppose the top ' + depth + ' m of the ocean warms by ' + dT + ' °C.</p>';
    var steps = [
      setup('exp', 'Write the setup for the rise in sea level, in meters.', BETA + ' * ' + depth + ' * ' + dT, { mustUse: [String(BETA), String(depth), String(dT)], hint: 'Rise = expansion per °C × depth × warming.' }),
      unit('cm', 'Now give the rise in centimeters, with the unit.', cm, 'cm', { places: 1, hint: '1 m = 100 cm.', mistakes: [{ value: m, why: 'That is the rise in meters. Multiply by 100 for centimeters.' }] }),
      choice('ice', 'Which of these would NOT raise sea level?', [
        ['Melting of floating Arctic sea ice', 'Right. Sea ice already floats, displacing its own weight of water, so melting it barely changes sea level.'],
        ['Melting of the Greenland ice sheet', 'Greenland\'s ice sits on land. Its meltwater adds to the ocean (about 7.4 m if it all melted).'],
        ['Mountain glaciers melting into rivers', 'Glaciers are land ice: their water ends up in the ocean and raises it.'],
        ['The ocean warming and expanding', 'That is thermal expansion, the calculation above. It does raise sea level.']
      ])
    ];
    var sol = ['Rise = ' + BETA + ' × ' + depth + ' m × ' + dT + ' = ' + M.fmt(m, 3) + ' m = ' + f(cm, 1) + ' cm.',
      'Sea level rises from thermal expansion and from land ice (glaciers, Greenland, Antarctica) melting into the ocean. Floating sea ice already displaces its weight, so its melting barely changes sea level (it does reduce albedo, which speeds warming).'];
    return { ctx: c.id, topic: c.topic, type: 'sealevel', text: text, steps: steps, solution: sol, given: { depth: depth, dT: dT }, figure: { kind: 'sea', depth: depth, dT: dT, cm: cm } };
  }

  function genGwp(r, c){
    var gas = r.pick(c.gases || ['CH4', 'N2O']), q = r.pick(c.tonnes || [20, 40, 50, 120, 250]), g = GWP[gas];
    var co2e = E({ fn: 'mul', args: [q, g] });
    var text = '<p>' + c.lead + ' It releases ' + q + ' tonnes of ' + GAS_NAME[gas] + ' a year. Over 100 years, one tonne of ' + gas.replace('4', '₄').replace('2O', '₂O') + ' traps about ' + big(g) + ' times as much heat as one tonne of CO₂ (its global warming potential, IPCC).</p>';
    var steps = [
      setup('gset', 'Write the setup for the emissions in tonnes of CO₂ equivalent.', q + ' tonnes * ' + g, { mustUse: [String(q), String(g)], hint: 'Mass of gas × GWP.',
        mistakes: [{ expr: q + ' tonnes / ' + g, why: 'Multiply by the GWP: each tonne counts as ' + big(g) + ' tonnes of CO₂.' }] }),
      unit('co2e', 'Now the answer with its unit.', co2e, 'tonnes', { units: ['t', 'metric tons', 'tonnes CO2e', 't CO2e', 'tonnes of CO2e'], hint: 'In tonnes of CO₂ equivalent.' }),
      choice('worst', 'Per tonne released, which gas has the largest global warming potential?', [
        ['CFC-12', 'Right. CFC-12\'s GWP is about 10,200: CFCs are powerful greenhouse gases as well as ozone destroyers.'],
        ['Carbon dioxide (CO₂)', 'CO₂ has a GWP of 1 by definition. It matters most because we release so much of it.'],
        ['Methane (CH₄)', 'Methane is about 28 times CO₂, far less than CFCs or N₂O.'],
        ['Water vapor', 'Water vapor is the most abundant greenhouse gas, but its amount follows temperature; it is not given a GWP like emitted gases.']
      ])
    ];
    var sol = [q + ' tonnes × ' + big(g) + ' = ' + big(co2e) + ' tonnes of CO₂ equivalent.', 'GWP (100-year, IPCC AR5): CO₂ 1, CH₄ 28, N₂O 265, CFC-12 10,200. A small mass of a high-GWP gas can matter as much as a large mass of CO₂.'];
    return { ctx: c.id, topic: c.topic, type: 'gwp', text: text, steps: steps, solution: sol, given: { gas: gas, q: q }, figure: { kind: 'gwp', gas: gas, q: q, co2e: co2e } };
  }

  var GEN = { gases: genGases, co2: genCo2, ph: genPh, sealevel: genSea, gwp: genGwp };
  M.register('climateChange', {
    PRE: PRE, ECS: ECS, forcing: forcing, warming: warming, ozone: ozone, uvb: uvb, ph: ph, hFactor: hFactor, expansion: expansion,
    BETA: BETA, GREENLAND: GREENLAND, ANTARCTICA: ANTARCTICA, GWP: GWP, POOL: POOL,
    TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var types = ctx.types || Object.keys(GEN);
      var ty = type && types.indexOf(type) > -1 ? type : r.pick(types);
      return GEN[ty](r, ctx);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
