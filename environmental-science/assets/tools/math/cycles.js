/* Cycles model: ApEnvMath.cycles (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T2, docs/apenv-briefs/t2.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/cycles.mjs)
   and the test (scripts/test/apenv-tool-cycles.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/cycles.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/cycles.js.

   The model
     CYCLES.carbon | nitrogen | phosphorus | water:
       reservoirs [{ id, name, amount, unit?, at: [fx, fy], art }]  placed on
         one shared landscape (fractions of the scene's width and height)
       processes [{ id, from, to, name, flux, agent, what, human?, slow?, n? }]
         n numbers the five nitrogen processes in the order the exam uses
       changes [{ id, name, did, effect }]  human changes a student can switch on
     simulate(cycleId, changeIds, years) -> { years, pools: [{ id: amount }],
       flux: { processId: value } }
       Carbon (GtC, GtC/yr, rounded from IPCC AR6 WG1 chapter 5 and the Global
       Carbon Project): human emissions E (fossil fuels and forest clearing)
       are split as the recent global budget splits them, about 45% staying in
       the air, 25% into the ocean and 30% into land plants and soils;
       planting forests takes carbon out of the air. 1 ppm of CO2 = 2.12 GtC.
       Nitrogen and phosphorus: relative amounts (100 = before any change), a
       linear box model (each flow = rate × the amount in its source), so a
       change works its way around the cycle. Water (km³ and km³/yr, rounded
       from Trenberth et al. 2007): the same box model.
   Drills (every number from ApEnvCalc, never typed)
     TYPES  process, nitrogen, reservoir, human, budget, residence
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, givens, figure } */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  function C(){ return M.Calc(); }
  var PPM = 2.12; // GtC per ppm of atmospheric CO2
  var SPLIT = { air: 0.45, ocean: 0.25, land: 0.30 };

  var CYCLES = {
    carbon: {
      id: 'carbon', name: 'Carbon cycle', unit: 'GtC', funit: 'GtC/yr', topic: 'carbon-cycle', start: 2020,
      reservoirs: [
        { id: 'atm', name: 'Atmosphere', what: 'CO₂ gas', amount: 870, at: [0.5, 0.1] },
        { id: 'plants', name: 'Land plants', what: 'sugars, wood', amount: 450, at: [0.17, 0.3] },
        { id: 'soil', name: 'Soil', what: 'dead matter, humus', amount: 1700, at: [0.2, 0.64] },
        { id: 'fossil', name: 'Fossil fuels', what: 'coal, oil, gas', amount: 930, at: [0.36, 0.9] },
        { id: 'ocean', name: 'Ocean', what: 'dissolved CO₂, carbonate', amount: 38000, at: [0.81, 0.62] },
        { id: 'rock', name: 'Sedimentary rock', what: 'limestone', amount: 60000000, at: [0.8, 0.9], approx: true }
      ],
      processes: [
        { id: 'photo', from: 'atm', to: 'plants', name: 'Photosynthesis', flux: 120, agent: 'Plants, algae and phytoplankton', what: 'take CO₂ from the air and store the carbon in sugars and wood.' },
        { id: 'resp', from: 'plants', to: 'atm', name: 'Respiration', flux: 60, agent: 'Plants and animals', what: 'break down sugars for energy in cellular respiration and release CO₂.' },
        { id: 'death', from: 'plants', to: 'soil', name: 'Death and litter', flux: 60, agent: 'Leaves, wood and dead organisms', what: 'fall to the ground and become soil organic matter.' },
        { id: 'decomp', from: 'soil', to: 'atm', name: 'Decomposition', flux: 60, agent: 'Decomposers (bacteria and fungi)', what: 'break down dead matter and release CO₂ by respiration.' },
        { id: 'uptake', from: 'atm', to: 'ocean', name: 'Ocean uptake', flux: 80, agent: 'The ocean surface', what: 'dissolves CO₂ from the air; extra CO₂ makes seawater more acidic.' },
        { id: 'release', from: 'ocean', to: 'atm', name: 'Ocean release', flux: 80, agent: 'The ocean surface', what: 'releases dissolved CO₂ back to the air.' },
        { id: 'sediment', from: 'ocean', to: 'rock', name: 'Sedimentation', flux: 0.1, slow: true, agent: 'Shells of marine organisms', what: 'settle to the sea floor and over millions of years become limestone.' },
        { id: 'volcano', from: 'rock', to: 'atm', name: 'Volcanoes', flux: 0.1, slow: true, agent: 'Volcanic eruptions', what: 'release CO₂ from rock deep in the Earth.' },
        { id: 'burial', from: 'soil', to: 'fossil', name: 'Burial', flux: 0.01, slow: true, agent: 'Buried dead plants and plankton', what: 'are pressed and heated over millions of years into coal, oil and natural gas.' },
        { id: 'burn', from: 'fossil', to: 'atm', name: 'Combustion', flux: 0, human: true, agent: 'Power plants, cars and factories', what: 'burn fossil fuels, releasing carbon stored for millions of years as CO₂ in a few years.' },
        { id: 'clear', from: 'plants', to: 'atm', name: 'Deforestation', flux: 0, human: true, agent: 'Clearing and burning forests', what: 'releases the carbon in trees as CO₂ and removes a carbon sink.' },
        { id: 'plant', from: 'atm', to: 'plants', name: 'Reforestation', flux: 0, human: true, agent: 'Planting forests', what: 'takes extra CO₂ out of the air as the new trees grow.' }
      ],
      changes: [
        { id: 'fuel', name: 'Burn fossil fuels', proc: 'burn', rate: 9.5, did: 'Burning fossil fuels' },
        { id: 'forest', name: 'Clear forests', proc: 'clear', rate: 1.5, did: 'Clearing forests' },
        { id: 'trees', name: 'Plant forests', proc: 'plant', rate: 1, did: 'Planting forests' }
      ]
    },
    nitrogen: {
      id: 'nitrogen', name: 'Nitrogen cycle', unit: '', funit: '', topic: 'nitrogen-cycle', relative: true,
      reservoirs: [
        { id: 'n2', name: 'Atmosphere', what: 'N₂ gas, 78% of air', amount: 100, at: [0.5, 0.1], fixed: true },
        { id: 'org', name: 'Plants and animals', what: 'proteins, DNA', amount: 100, at: [0.15, 0.3] },
        { id: 'dead', name: 'Wastes, dead matter', what: 'organic nitrogen', amount: 100, at: [0.14, 0.66] },
        { id: 'nh4', name: 'Ammonium in soil', what: 'NH₃ / NH₄⁺', amount: 100, at: [0.4, 0.74] },
        { id: 'no3', name: 'Nitrate in soil', what: 'NO₂⁻ then NO₃⁻', amount: 100, at: [0.58, 0.56] },
        { id: 'water', name: 'Streams and ocean', what: 'dissolved nitrate', amount: 100, at: [0.85, 0.74] }
      ],
      processes: [
        { id: 'fix', n: 1, from: 'n2', to: 'nh4', name: 'Nitrogen fixation', flux: 10, agent: 'Nitrogen-fixing bacteria (in soil and in the root nodules of legumes)', what: 'turn N₂ gas, which plants cannot use, into ammonia (NH₃) and ammonium (NH₄⁺).' },
        { id: 'nitr', n: 2, from: 'nh4', to: 'no3', name: 'Nitrification', flux: 49, agent: 'Nitrifying bacteria in the soil', what: 'turn ammonium into nitrite (NO₂⁻) and then nitrate (NO₃⁻).' },
        { id: 'assim', n: 3, from: 'no3', to: 'org', name: 'Assimilation', flux: 39, agent: 'Plant roots', what: 'take up nitrate (and ammonium) and build it into proteins and DNA; animals get nitrogen by eating plants.' },
        { id: 'waste', from: 'org', to: 'dead', name: 'Death and waste', flux: 39, agent: 'Organisms', what: 'die or release wastes (urine, manure) holding organic nitrogen.' },
        { id: 'ammon', n: 4, from: 'dead', to: 'nh4', name: 'Ammonification', flux: 39, agent: 'Decomposers (bacteria and fungi)', what: 'break down wastes and dead matter and release ammonium (NH₄⁺) into the soil.' },
        { id: 'denit', n: 5, from: 'no3', to: 'n2', name: 'Denitrification', flux: 6, agent: 'Denitrifying bacteria in waterlogged, low-oxygen soil', what: 'turn nitrate back into N₂ gas (and some N₂O, a greenhouse gas).' },
        { id: 'light', from: 'n2', to: 'no3', name: 'Lightning', flux: 1, agent: 'Lightning', what: 'splits N₂ so it forms nitrogen oxides that rain down as nitrate (atmospheric fixation).' },
        { id: 'leach', from: 'no3', to: 'water', name: 'Leaching and runoff', flux: 5, agent: 'Rain and irrigation water', what: 'wash nitrate out of the soil into streams, lakes and the ocean.' },
        { id: 'wdenit', from: 'water', to: 'n2', name: 'Denitrification in water', flux: 5, agent: 'Bacteria in low-oxygen sediments', what: 'return dissolved nitrate to the air as N₂.' },
        { id: 'haber', from: 'n2', to: 'no3', name: 'Synthetic fertilizer', flux: 0, human: true, agent: 'Fertilizer factories (the Haber-Bosch process)', what: 'fix N₂ from the air into ammonia and nitrate fertilizer spread on fields.' }
      ],
      changes: [
        { id: 'fert', name: 'Add fertilizer', proc: 'haber', rate: 20, did: 'Adding fertilizer' },
        { id: 'legume', name: 'Plant legumes', scale: { fix: 2 }, did: 'Planting legumes (beans, clover)' },
        { id: 'flood', name: 'Waterlog the soil', scale: { denit: 3, nitr: 0.7 }, did: 'Waterlogging the soil' }
      ]
    },
    phosphorus: {
      id: 'phosphorus', name: 'Phosphorus cycle', unit: '', funit: '', topic: 'phosphorus-cycle', relative: true, noAir: true,
      reservoirs: [
        { id: 'rock', name: 'Phosphate rock', what: 'sedimentary rock', amount: 100, at: [0.2, 0.9], fixed: true },
        { id: 'soil', name: 'Soil phosphate', what: 'PO₄³⁻', amount: 100, at: [0.4, 0.64] },
        { id: 'org', name: 'Plants and animals', what: 'DNA, ATP, bones', amount: 100, at: [0.17, 0.3] },
        { id: 'ocean', name: 'Ocean and lakes', what: 'dissolved phosphate', amount: 100, at: [0.81, 0.62] },
        { id: 'sed', name: 'Ocean sediments', what: 'settled phosphate', amount: 100, at: [0.8, 0.9] }
      ],
      processes: [
        { id: 'weather', from: 'rock', to: 'soil', name: 'Weathering', flux: 2, agent: 'Rain, wind and chemical weathering', what: 'slowly break down rock and release phosphate into the soil. This is the slow step that limits the cycle.' },
        { id: 'assim', from: 'soil', to: 'org', name: 'Assimilation', flux: 20, agent: 'Plant roots', what: 'take up phosphate for DNA, ATP and cell membranes; animals get it by eating plants.' },
        { id: 'decomp', from: 'org', to: 'soil', name: 'Decomposition', flux: 20, agent: 'Decomposers', what: 'return phosphate from wastes and dead organisms to the soil.' },
        { id: 'runoff', from: 'soil', to: 'ocean', name: 'Runoff', flux: 2, agent: 'Rain and rivers', what: 'carry phosphate from the land to lakes and the ocean.' },
        { id: 'sediment', from: 'ocean', to: 'sed', name: 'Sedimentation', flux: 2, agent: 'Phosphate particles and shells', what: 'settle to the bottom of lakes and the ocean.' },
        { id: 'uplift', from: 'sed', to: 'rock', name: 'Geologic uplift', flux: 2, slow: true, agent: 'Plate tectonics', what: 'lift sea-floor sediments into new rock on land over millions of years.' },
        { id: 'mine', from: 'rock', to: 'soil', name: 'Mining for fertilizer', flux: 0, human: true, agent: 'Phosphate mines', what: 'dig up phosphate rock for fertilizer, moving phosphorus to fields far faster than weathering.' },
        { id: 'sewage', from: 'org', to: 'ocean', name: 'Sewage and detergents', flux: 0, human: true, agent: 'Wastewater', what: 'carries phosphate from human and animal waste and some detergents into lakes and rivers.' }
      ],
      changes: [
        { id: 'mine', name: 'Mine phosphate fertilizer', proc: 'mine', rate: 6, did: 'Spreading mined phosphate fertilizer' },
        { id: 'erode', name: 'Clear land (erosion)', scale: { runoff: 3 }, did: 'Clearing land so soil erodes' },
        { id: 'sewage', name: 'Release sewage', proc: 'sewage', rate: 3, did: 'Releasing sewage' }
      ]
    },
    water: {
      id: 'water', name: 'Water cycle', unit: 'km³', funit: 'km³/yr', topic: 'water-cycle', start: 2020,
      reservoirs: [
        { id: 'atm', name: 'Atmosphere', what: 'water vapor, clouds', amount: 12700, at: [0.5, 0.1] },
        { id: 'ice', name: 'Ice and snow', what: 'glaciers, ice sheets', amount: 26350000, at: [0.15, 0.16] },
        { id: 'soil', name: 'Soil water', what: 'in the root zone', amount: 122000, at: [0.17, 0.62] },
        { id: 'lakes', name: 'Lakes and rivers', what: 'surface fresh water', amount: 180000, at: [0.5, 0.6] },
        { id: 'ground', name: 'Groundwater', what: 'aquifers', amount: 15300000, at: [0.36, 0.89] },
        { id: 'ocean', name: 'Ocean', what: 'salt water, 97% of all water', amount: 1335000000, at: [0.82, 0.66] }
      ],
      processes: [
        { id: 'evap', from: 'ocean', to: 'atm', name: 'Evaporation', flux: 413000, agent: 'Sunlight', what: 'heats the ocean surface and turns liquid water into vapor (salt stays behind).' },
        { id: 'oprecip', from: 'atm', to: 'ocean', name: 'Precipitation on the ocean', flux: 373000, agent: 'Clouds', what: 'release rain and snow when water vapor cools and condenses.' },
        { id: 'lprecip', from: 'atm', to: 'soil', name: 'Precipitation on land', flux: 113000, agent: 'Clouds blown over the land', what: 'rain and snow on the land. Winds carry about 40,000 of the 413,000 km³ evaporated from the ocean inland each year.' },
        { id: 'et', from: 'soil', to: 'atm', name: 'Evapotranspiration', flux: 73000, agent: 'Plants and the sun', what: 'return water to the air: plants transpire through their leaves and soil water evaporates.' },
        { id: 'runoff', from: 'soil', to: 'lakes', name: 'Runoff', flux: 30000, agent: 'Gravity', what: 'moves water over the ground into streams, lakes and rivers.' },
        { id: 'infil', from: 'soil', to: 'ground', name: 'Infiltration', flux: 10000, agent: 'Porous soil and rock', what: 'let water soak down to recharge aquifers.' },
        { id: 'seep', from: 'ground', to: 'lakes', name: 'Groundwater flow', flux: 10000, slow: true, agent: 'Aquifers', what: 'slowly feed springs, rivers and lakes.' },
        { id: 'rivers', from: 'lakes', to: 'ocean', name: 'River flow', flux: 40000, agent: 'Rivers', what: 'carry the land\'s extra water back to the ocean.' },
        { id: 'melt', from: 'ice', to: 'ocean', name: 'Melting', flux: 0, human: true, agent: 'A warming climate', what: 'melts glaciers and ice sheets on land, which raises sea level (melting sea ice does not).' },
        { id: 'pump', from: 'ground', to: 'soil', name: 'Pumping for irrigation', flux: 0, human: true, agent: 'Wells', what: 'pump groundwater faster than infiltration refills it, so the water table drops.' }
      ],
      changes: [
        { id: 'pave', name: 'Pave land (cities)', scale: { infil: 0.3, runoff: 1.6, et: 0.85 }, did: 'Paving land' },
        { id: 'pump', name: 'Pump groundwater', proc: 'pump', rate: 3000, did: 'Pumping groundwater' },
        { id: 'warm', name: 'Warm the climate', proc: 'melt', rate: 500, scale: { evap: 1.04, oprecip: 1.04, lprecip: 1.04, et: 1.04 }, did: 'Warming the climate' }
      ]
    }
  };
  var CYCLE_IDS = ['carbon', 'nitrogen', 'phosphorus', 'water'];

  function byId(list, id){ for(var i = 0; i < list.length; i++) if(list[i].id === id) return list[i]; return null; }
  function proc(cy, id){ return byId(CYCLES[cy].processes, id); }
  function res(cy, id){ return byId(CYCLES[cy].reservoirs, id); }

  /* ------------------------------------------------------- simulation */
  function simulate(cy, changeIds, years){
    var Y = CYCLES[cy], on = {}, Cc = C();
    (changeIds || []).forEach(function(id){ var c = byId(Y.changes, id); if(c) on[id] = c; });
    years = years == null ? 50 : years;
    var pool = {}; Y.reservoirs.forEach(function(r){ pool[r.id] = r.amount; });
    var flux = {}; Y.processes.forEach(function(p){ flux[p.id] = p.flux; });
    var out = { years: years, pools: [clone(pool)], flux: null, cycle: cy };
    if(cy === 'carbon'){
      var E = 0, fuel = on.fuel ? on.fuel.rate : 0, clr = on.forest ? on.forest.rate : 0, pl = on.trees ? on.trees.rate : 0;
      E = fuel + clr;
      flux.burn = fuel; flux.clear = clr; flux.plant = pl;
      for(var y = 1; y <= years; y++){
        pool.atm += Cc.evaluate({ fn: 'percentOf', args: [SPLIT.air * 100, E] }) - pl;
        pool.ocean += Cc.evaluate({ fn: 'percentOf', args: [SPLIT.ocean * 100, E] });
        var land = Cc.evaluate({ fn: 'percentOf', args: [SPLIT.land * 100, E] });
        pool.plants += land / 2 - clr + pl;
        pool.soil += land / 2;
        pool.fossil -= fuel;
        out.pools.push(clone(pool));
      }
      out.sinks = { air: SPLIT.air * E, ocean: SPLIT.ocean * E, land: SPLIT.land * E, emissions: E };
      flux.uptake = Y.processes.filter(function(p){ return p.id === 'uptake'; })[0].flux + SPLIT.ocean * E;
      flux.photo = 120 + SPLIT.land * E + pl;
      out.flux = flux;
      return out;
    }
    // a linear box model: each flow = k × its source's amount; k from the
    // starting amounts and flows (so with no change nothing moves)
    var k = {}, ext = {};
    Y.processes.forEach(function(p){ k[p.id] = p.flux / res(cy, p.from).amount; });
    Object.keys(on).forEach(function(id){
      var c = on[id];
      Object.keys(c.scale || {}).forEach(function(pid){ k[pid] *= c.scale[pid]; });
      if(c.proc) ext[c.proc] = (ext[c.proc] || 0) + c.rate;
    });
    var steps = cy === 'water' ? 400 : 20, dt = 1 / steps;
    function flows(){
      var f = {};
      Y.processes.forEach(function(p){ f[p.id] = ext[p.id] != null ? ext[p.id] : k[p.id] * pool[p.from]; });
      return f;
    }
    for(var t = 1; t <= years; t++){
      for(var s = 0; s < steps; s++){
        var f = flows();
        Y.processes.forEach(function(p){
          var d = f[p.id] * dt;
          if(!res(cy, p.from).fixed) pool[p.from] -= d;
          if(!res(cy, p.to).fixed) pool[p.to] += d;
        });
      }
      out.pools.push(clone(pool));
    }
    out.flux = flows();
    return out;
  }
  function clone(o){ var c = {}; for(var k in o) c[k] = o[k]; return c; }
  function ppm(gtc){ return C().evaluate({ fn: 'div', args: [gtc, PPM] }); }

  /* ------------------------------------------------------- drills */
  var TYPES = ['process', 'nitrogen', 'reservoir', 'human', 'budget', 'residence'];
  function choice(key, label, options, correct, why, practice, extra){
    var s = { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: practice || '1.A' };
    for(var x in extra || {}) s[x] = extra[x];
    return s;
  }
  function plain(s){ return String(s).replace(/<[^>]+>/g, ''); }
  function rname(cy, id){ return res(cy, id).name.toLowerCase(); }
  function lc(s){ return s.charAt(0).toLowerCase() + s.slice(1); }

  /* "Which process moves X from A to B?" and "What does it?" */
  function genProcess(r, ctx){
    var cy = ctx.cycle || 'carbon', Y = CYCLES[cy];
    var pool = Y.processes.filter(function(p){ return !p.human && !/^(waste|wdenit|death)$/.test(p.id) && !(cy === 'carbon' && p.id === 'burial'); });
    var P = r.pick(pool);
    // distractors: other processes of this cycle with different endpoints
    var others = M.shuffle(r, Y.processes.filter(function(q){ return !q.human && q.id !== P.id && q.name !== P.name && !(q.from === P.from && q.to === P.to); }).map(function(q){ return q.name; }))
      .filter(function(n, i, a){ return a.indexOf(n) === i; }).slice(0, 3);
    var opts = [P.name].concat(others);
    var why = opts.map(function(o, i){
      if(!i) return 'Right. ' + P.agent + ' ' + P.what;
      var q = byId(Y.processes, Y.processes.filter(function(x){ return x.name === o; })[0].id);
      return o + ' moves ' + (cy === 'carbon' ? 'carbon' : cy === 'water' ? 'water' : cy) + ' from ' + rname(cy, q.from) + ' to ' + rname(cy, q.to) + ', not from ' + rname(cy, P.from) + ' to ' + rname(cy, P.to) + '.';
    });
    var fromR = res(cy, P.from), toR = res(cy, P.to);
    var text = '<p>In the ' + Y.name.toLowerCase() + ', ' + (cy === 'water' ? 'water' : cy) + ' moves from <b>' + fromR.name.toLowerCase() + '</b> (' + fromR.what + ') to <b>' + toR.name.toLowerCase() + '</b> (' + toR.what + ').</p>';
    var steps = [choice('name', 'Which process is this?', opts, 0, why, '2.A')];
    // the agent, as a second step
    var agents = M.shuffle(r, Y.processes.filter(function(q){ return q.agent !== P.agent && !q.human; }).map(function(q){ return q.agent; })).filter(function(a, i, l){ return l.indexOf(a) === i; }).slice(0, 2);
    var trivial = P.agent.toLowerCase().indexOf(P.name.toLowerCase().slice(0, 6)) > -1;
    if(agents.length === 2 && !trivial){
      var ao = [P.agent].concat(agents);
      steps.push(choice('agent', 'What carries out ' + lc(P.name) + '?', ao, 0, ao.map(function(a, i){ return i ? 'That is what drives ' + lc(Y.processes.filter(function(q){ return q.agent === a; })[0].name) + '.' : 'Right. ' + P.agent + ' ' + P.what; }), '1.A'));
    }
    return { type: 'process', ctx: ctx.id, topic: ctx.topic, text: text, givens: { cycle: cy, process: P.id }, figure: { cycle: cy, ask: P.id, hide: true },
      steps: steps, solution: [P.name + ': ' + P.agent.charAt(0).toLowerCase() + P.agent.slice(1) + ' ' + P.what] };
  }

  /* The nitrogen processes in order: given one step, which comes next? */
  var NORDER = ['fix', 'nitr', 'assim', 'ammon', 'denit'];
  var NCHEM = { fix: 'N₂ gas → ammonium (NH₄⁺)', nitr: 'ammonium (NH₄⁺) → nitrite (NO₂⁻) → nitrate (NO₃⁻)', assim: 'nitrate (NO₃⁻) → proteins and DNA in plants', ammon: 'wastes and dead matter → ammonium (NH₄⁺)', denit: 'nitrate (NO₃⁻) → N₂ gas' };
  function genNitrogen(r, ctx){
    var Y = CYCLES.nitrogen, start = r.int(0, 2), names = NORDER.map(function(id){ return proc('nitrogen', id).name; });
    var steps = [];
    for(var i = start + 1; i <= start + 2; i++){
      var id = NORDER[i], P = proc('nitrogen', id), prev = proc('nitrogen', NORDER[i - 1]);
      var opts = M.shuffle(r, names.filter(function(n){ return n !== P.name && n !== prev.name; })).slice(0, 3);
      opts.splice(r.int(0, 3), 0, P.name);
      var why = opts.map(function(o){
        var q = Y.processes.filter(function(x){ return x.name === o; })[0];
        if(o === P.name) return 'Right. ' + P.name + ': ' + NCHEM[id] + '. ' + P.agent + ' ' + P.what;
        return o + ' is ' + NCHEM[q.id] + '. After ' + lc(prev.name) + ' the nitrogen is ' + (NORDER[i - 1] === 'fix' ? 'ammonium' : NORDER[i - 1] === 'nitr' ? 'nitrate in the soil' : NORDER[i - 1] === 'assim' ? 'in living things, then in their wastes and dead bodies' : 'ammonium again, or nitrate') + '.';
      });
      steps.push(choice('n' + (i + 1), 'After ' + lc(prev.name) + ' (' + NCHEM[prev.id] + '), which process comes next?', opts, opts.indexOf(P.name), why, '2.B', { fixed: true }));
    }
    var chemOpts = ['Nitrogen-fixing bacteria', 'Nitrifying bacteria', 'Denitrifying bacteria', 'Plant roots'];
    var lastId = NORDER[start + 2], cK = { fix: 0, nitr: 1, denit: 2, assim: 3, ammon: -1 }[lastId];
    if(cK >= 0){
      steps.push(choice('who', 'Who carries out ' + lc(proc('nitrogen', lastId).name) + '?', chemOpts, cK, chemOpts.map(function(o, i){
        return i === cK ? 'Right. ' + proc('nitrogen', lastId).agent + ' ' + proc('nitrogen', lastId).what : ['Nitrogen-fixing bacteria turn N₂ gas into ammonium.', 'Nitrifying bacteria turn ammonium into nitrite and nitrate.', 'Denitrifying bacteria turn nitrate back into N₂ gas.', 'Plant roots take up nitrate and ammonium (assimilation).'][i];
      }), '1.A', { fixed: true }));
    }
    var first = proc('nitrogen', NORDER[start]);
    return { type: 'nitrogen', ctx: ctx.id, topic: ctx.topic, text: '<p>Follow one nitrogen atom through the cycle. It has just gone through <b>' + lc(first.name) + '</b> (' + NCHEM[first.id] + ').</p>',
      givens: { start: NORDER[start] }, figure: { cycle: 'nitrogen', numbered: start + 1 },
      steps: steps, solution: ['The order: ' + names.map(function(n, i){ return (i + 1) + '. ' + n; }).join(', ') + '.', NORDER.map(function(id){ return proc('nitrogen', id).name + ': ' + NCHEM[id]; }).join('; ') + '.'] };
  }

  var RES_Q = [
    { cycle: 'phosphorus', label: 'Which cycle has no significant gas phase, so it never passes through the atmosphere?', options: ['Phosphorus', 'Nitrogen', 'Carbon', 'Water'], why: ['Right. Phosphorus has no common gas form; it moves through rock, soil, water and living things, which is why its cycle is so slow.', 'Nitrogen\'s largest reservoir is the atmosphere (N₂ is 78% of air).', 'Carbon cycles through the air as CO₂.', 'Water vapor is a big part of the water cycle.'] },
    { cycle: 'carbon', label: 'Where is most of Earth\'s carbon stored?', options: ['Sedimentary rock (such as limestone)', 'The atmosphere', 'Land plants', 'Fossil fuels'], why: ['Right. Sedimentary rock holds tens of millions of GtC, far more than anything else. Of the reservoirs that exchange carbon quickly, the ocean is largest.', 'The atmosphere holds about 870 GtC, one of the smallest reservoirs.', 'Land plants hold about 450 GtC.', 'Fossil fuel reserves hold about 1,000 GtC.'] },
    { cycle: 'carbon', label: 'Of the reservoirs that trade carbon with the air within years to centuries, which is largest?', options: ['The ocean', 'The atmosphere', 'Land plants', 'Soil'], why: ['Right. The ocean holds about 38,000 GtC, mostly as dissolved CO₂ and carbonate.', 'The atmosphere holds about 870 GtC.', 'Land plants hold about 450 GtC.', 'Soil holds about 1,700 GtC.'] },
    { cycle: 'nitrogen', label: 'Where is most of the nitrogen in the nitrogen cycle?', options: ['The atmosphere, as N₂ gas', 'Soil, as nitrate', 'Living things, as proteins', 'The ocean, as nitrate'], why: ['Right. N₂ is 78% of the air, but most organisms cannot use it until bacteria fix it.', 'Soil nitrate is a small, fast-changing pool.', 'Living things hold a small share.', 'The ocean holds less than the air.'] },
    { cycle: 'water', label: 'Where is most of Earth\'s fresh water?', options: ['Ice caps and glaciers', 'Lakes and rivers', 'The atmosphere', 'Soil'], why: ['Right. About 26 million km³ is frozen; groundwater (about 15 million km³) is next. Lakes and rivers hold well under 1%.', 'Lakes and rivers hold only about 180,000 km³.', 'The atmosphere holds about 13,000 km³ at any moment.', 'Soil holds about 120,000 km³.'] },
    { cycle: 'phosphorus', label: 'Why does phosphorus often limit plant growth in lakes and on land?', options: ['It is released only slowly, by the weathering of rock', 'Plants cannot absorb phosphate', 'Most phosphorus is in the atmosphere', 'Bacteria remove it as a gas'], why: ['Right. Weathering is slow, so little phosphate is available; adding phosphate (fertilizer, sewage) can trigger algal blooms.', 'Plant roots absorb phosphate readily.', 'Phosphorus has no significant atmospheric reservoir.', 'There is no common phosphorus gas; that is nitrogen\'s denitrification.'] },
    { cycle: 'carbon', label: 'Which is a carbon sink: a reservoir that takes in more carbon than it releases?', options: ['A growing forest', 'A coal power plant', 'A burning forest', 'A volcano'], why: ['Right. A growing forest takes in more CO₂ by photosynthesis than it releases by respiration.', 'A power plant is a source: it releases CO₂.', 'A burning forest releases its carbon as CO₂.', 'A volcano is a (small) source of CO₂.'] }
  ];
  function genReservoir(r, ctx){
    var list = RES_Q.filter(function(q){ return !ctx.cycle || q.cycle === ctx.cycle; });
    var a = r.pick(list), b = list.length > 1 ? r.pick(list.filter(function(q){ return q !== a; })) : null;
    var steps = [a, b].filter(Boolean).map(function(q, i){ return choice('r' + (i + 1), q.label, q.options.slice(), 0, q.why.slice(), '1.A'); });
    return { type: 'reservoir', ctx: ctx.id, topic: ctx.topic, text: '<p>Reservoirs are where an element is stored; processes move it between them.</p>',
      givens: { qs: [a, b].filter(Boolean).map(function(q){ return RES_Q.indexOf(q); }) }, figure: { cycle: a.cycle },
      steps: steps, solution: [a.why[0], b ? b.why[0] : ''].filter(Boolean) };
  }

  var HUMAN_Q = {
    carbon: [
      { change: 'fuel', label: 'Burning fossil fuels moves carbon from', options: ['fossil fuels to the atmosphere', 'the atmosphere to fossil fuels', 'the ocean to the atmosphere', 'plants to the soil'], why: ['Right. Carbon stored for millions of years is released as CO₂ within a few years.', 'That is backwards: combustion releases stored carbon.', 'Ocean release is natural; combustion releases fossil carbon.', 'That is death and litter.'] },
      { change: 'fuel', label: 'About how much of the CO₂ released by burning fossil fuels stays in the atmosphere?', options: ['About half', 'All of it', 'None of it', 'About 1%'], why: ['Right. Recently about 45% has stayed in the air; the ocean (about 25%) and land plants and soils (about 30%) take up the rest.', 'The ocean and land plants absorb about half.', 'Atmospheric CO₂ is rising, about 2 ppm a year, so much of it stays.', 'Far more than that stays.'] },
      { change: 'fuel', label: 'As the ocean absorbs more CO₂, what happens to seawater?', options: ['It becomes more acidic (lower pH)', 'It becomes more basic (higher pH)', 'Its salinity rises sharply', 'Nothing changes'], why: ['Right. Dissolved CO₂ forms carbonic acid, so the pH falls (ocean acidification), which harms shell-building organisms.', 'Dissolved CO₂ forms an acid, so the pH falls.', 'CO₂ does not change salinity.', 'The pH falls: ocean acidification.'] },
      { change: 'forest', label: 'Clearing a forest affects the carbon cycle by', options: ['releasing the trees\' carbon and removing a carbon sink', 'storing more carbon in the soil', 'increasing photosynthesis', 'turning CO₂ into fossil fuels'], why: ['Right. Burning or decay releases the stored carbon as CO₂, and the land no longer takes up CO₂ by photosynthesis.', 'Cleared soil usually loses carbon.', 'Fewer trees means less photosynthesis.', 'Fossil fuels form over millions of years.'] }
    ],
    nitrogen: [
      { change: 'fert', label: 'Extra nitrate fertilizer on a field most likely leads to', options: ['nitrate runoff that causes algal blooms', 'more N₂ gas in the air only', 'less nitrate in nearby streams', 'more phosphorus in the soil'], why: ['Right. Nitrate dissolves easily, leaches into water and fuels algal blooms (eutrophication).', 'Some is denitrified, but much leaches into water.', 'More nitrate on land means more in streams.', 'Nitrate fertilizer adds nitrogen, not phosphorus.'] },
      { change: 'legume', label: 'Farmers plant legumes (beans, clover) between crops because', options: ['bacteria in their root nodules fix nitrogen into the soil', 'legumes remove nitrate from the soil', 'legumes perform denitrification', 'legumes add phosphate to the soil'], why: ['Right. Nitrogen-fixing bacteria in the nodules turn N₂ into ammonium, a natural fertilizer.', 'They add usable nitrogen.', 'Denitrification is done by bacteria in waterlogged soil.', 'They fix nitrogen, not phosphorus.'] },
      { change: 'flood', label: 'In waterlogged, low-oxygen soil, which process speeds up?', options: ['Denitrification', 'Nitrification', 'Nitrogen fixation by lightning', 'Assimilation'], why: ['Right. Denitrifying bacteria thrive without oxygen and turn nitrate into N₂ (and some N₂O, a greenhouse gas).', 'Nitrifying bacteria need oxygen; they slow down.', 'Lightning happens in the air.', 'Waterlogged soil does not speed up uptake.'] }
    ],
    phosphorus: [
      { change: 'mine', label: 'Mining phosphate rock for fertilizer', options: ['moves phosphorus to land and water much faster than weathering', 'adds phosphorus to the atmosphere', 'slows the phosphorus cycle', 'turns phosphate into a gas'], why: ['Right. Mining and spreading fertilizer move in years what weathering moves in thousands, and the runoff feeds algal blooms.', 'Phosphorus has no significant gas phase.', 'It speeds it up.', 'Phosphate stays a solid or dissolved ion.'] },
      { change: 'sewage', label: 'Phosphate from sewage reaching a lake most likely causes', options: ['an algal bloom, then low dissolved oxygen', 'more dissolved oxygen', 'acid rain', 'ozone depletion'], why: ['Right. Phosphate is often the limiting nutrient in fresh water, so algae grow fast; when they die, decomposers use up the oxygen.', 'Decomposition of the algae lowers oxygen.', 'Acid rain comes from NOx and SOx.', 'Ozone depletion comes from CFCs.'] }
    ],
    water: [
      { change: 'pave', label: 'Paving land with roads and parking lots', options: ['increases runoff and reduces infiltration', 'increases infiltration into aquifers', 'increases transpiration', 'has no effect on the water cycle'], why: ['Right. Water cannot soak through pavement, so more runs off (flooding, pollution) and less recharges groundwater.', 'Pavement blocks infiltration.', 'Fewer plants means less transpiration.', 'It changes where the water goes.'] },
      { change: 'pump', label: 'Pumping groundwater faster than it is recharged', options: ['lowers the water table', 'raises the water table', 'increases infiltration', 'adds water to aquifers'], why: ['Right. The aquifer is drained faster than rain refills it, so wells must go deeper and land can sink.', 'It falls.', 'Pumping does not change infiltration.', 'It removes water.'] },
      { change: 'warm', label: 'Which of these raises sea level?', options: ['Melting glaciers on land', 'Melting sea ice', 'More evaporation', 'More transpiration'], why: ['Right. Land ice adds new water to the ocean. Thermal expansion of warmer water also raises it.', 'Sea ice already floats, so melting it barely changes sea level.', 'Evaporation moves water out of the ocean.', 'Transpiration moves water from plants to the air.'] }
    ]
  };
  function genHuman(r, ctx){
    var cy = ctx.cycle || 'carbon', list = HUMAN_Q[cy], q = r.pick(list), q2 = r.pick(list.filter(function(x){ return x !== q; }));
    var C0 = byId(CYCLES[cy].changes, q.change);
    var steps = [q, q2].map(function(x, i){ return choice('h' + (i + 1), x.label, x.options.slice(), 0, x.why.slice(), i ? '7.A' : '2.C'); });
    return { type: 'human', ctx: ctx.id, topic: ctx.topic, text: '<p>' + C0.did + ' changes the ' + CYCLES[cy].name.toLowerCase() + '.</p>',
      givens: { cycle: cy, qs: [list.indexOf(q), list.indexOf(q2)] }, figure: { cycle: cy, changes: [q.change] },
      steps: steps, solution: [q.why[0], q2.why[0]] };
  }

  /* The carbon budget: sources minus sinks, then to ppm. */
  function genBudget(r, ctx){
    var Cc = C();
    // Recent years (Global Carbon Project scale); drawn again until the
    // share left in the air is clearly in one band (not near 40% or 60%).
    var ff, luc, oc, ld, f, guard = 0;
    do {
      ff = r.pick([8.5, 9, 9.4, 9.6, 9.8, 10, 10.2]); luc = r.pick([0.8, 1, 1.1, 1.2, 1.4, 1.6]); oc = r.pick([2.4, 2.5, 2.6, 2.8, 2.9, 3]); ld = r.pick([2.6, 2.8, 3, 3.1, 3.3, 3.5]);
      f = (ff + luc - oc - ld) / (ff + luc);
    } while((Math.abs(f - 0.4) < 0.03 || Math.abs(f - 0.6) < 0.03) && guard++ < 50);
    var net = Cc.evaluate({ fn: 'sub', args: [{ fn: 'add', args: [ff, luc] }, { fn: 'add', args: [oc, ld] }] });
    var p = Cc.evaluate({ fn: 'div', args: [net, PPM] });
    var wrongSign = Cc.evaluate({ fn: 'add', args: [ff, luc, oc, ld] });
    var fs = function(x){ return String(x); };
    var text = '<p>In one year, burning fossil fuels released ' + ff + ' GtC and clearing forests released ' + luc + ' GtC. The ocean absorbed ' + oc + ' GtC and land plants and soils absorbed ' + ld + ' GtC. One part per million (ppm) of CO₂ in the atmosphere is 2.12 GtC.</p>';
    return {
      type: 'budget', ctx: ctx.id, topic: ctx.topic, text: text,
      givens: { ff: ff, luc: luc, oc: oc, ld: ld },
      figure: { cycle: 'carbon', budget: { ff: ff, luc: luc, oc: oc, ld: ld } },
      steps: [
        { key: 'setup', kind: 'setup', practice: '6.B', label: 'Write the setup for the carbon the atmosphere gains: sources minus sinks.', hint: 'For example (9 + 1) - (2.5 + 3).',
          cell: M.setupCell('(' + fs(ff) + ' + ' + fs(luc) + ') - (' + fs(oc) + ' + ' + fs(ld) + ')', { mustUse: [fs(ff), fs(luc), fs(oc), fs(ld)], parens: false, times100: false,
            mistakes: [{ expr: fs(ff) + ' + ' + fs(luc) + ' + ' + fs(oc) + ' + ' + fs(ld), why: 'The ocean and land absorb carbon: subtract them (sinks), add only the sources.' }, { expr: fs(ff) + ' - ' + fs(oc) + ' - ' + fs(ld), why: 'Clearing forests is a source too: add it to the fossil fuel carbon.' }] }) },
        { key: 'gain', kind: 'unit', practice: '6.C', label: 'Carbon added to the atmosphere this year, with its unit.',
          cell: M.unitCell(net, 'GtC', { units: ['GtC/yr', 'Gt C', 'Gt', 'Gt/yr'], mistakes: [{ value: wrongSign, why: 'Subtract the sinks (ocean and land); they take carbon out of the air.' }] }) },
        { key: 'ppm', kind: 'unit', practice: '6.C', label: 'The rise in atmospheric CO₂ this year, in ppm.',
          cell: M.unitCell(p, 'ppm', { units: ['ppm/yr', 'ppm per year'], mistakes: [{ value: Cc.evaluate({ fn: 'mul', args: [net, PPM] }), why: 'Divide by 2.12 GtC per ppm: GtC ÷ (GtC/ppm) leaves ppm.' }] }) },
        choice('air', 'What share of the carbon released this year stayed in the atmosphere?', ['Less than half', 'About half', 'More than half'], (function(){ var f = net / (ff + luc); return f < 0.4 ? 0 : f <= 0.6 ? 1 : 2; })(), (function(){ var f = net / (ff + luc), pc = M.fmt(f * 100, 2); return ['It is ' + pc + '% (' + M.fmt(net, 3) + ' of ' + M.fmt(ff + luc, 3) + ' GtC). ' + (f < 0.4 ? 'Right.' : 'Compare the gain with the total released.'), 'It is ' + pc + '%. ' + (f >= 0.4 && f <= 0.6 ? 'Right: about half, as in recent years; the ocean and land took the rest.' : 'Compare the gain with the total released.'), 'It is ' + pc + '%. ' + (f > 0.6 ? 'Right.' : 'Compare the gain with the total released.')]; })(), '5.C', { fixed: true })
      ],
      solution: ['Sources: ' + ff + ' + ' + luc + ' = ' + M.fmt(ff + luc, 4) + ' GtC. Sinks: ' + oc + ' + ' + ld + ' = ' + M.fmt(oc + ld, 4) + ' GtC.', 'Atmosphere gains (' + ff + ' + ' + luc + ') − (' + oc + ' + ' + ld + ') = ' + M.fmt(net, 4) + ' GtC.', M.fmt(net, 4) + ' GtC ÷ 2.12 GtC/ppm = ' + M.fmt(p, 3) + ' ppm.']
    };
  }

  /* Residence time = amount stored ÷ flow through. */
  var RESID = [
    { cycle: 'water', id: 'atm-water', what: 'a water molecule in the atmosphere', store: [12700, 13000, 12900], storeU: 'km³', flow: [496000, 505000, 486000], flowU: 'km³/yr', out: 'days', outName: 'days' },
    { cycle: 'carbon', id: 'atm-carbon', what: 'a carbon atom in the atmosphere (before it is taken up)', store: [860, 870, 880], storeU: 'GtC', flow: [200, 210, 220], flowU: 'GtC/yr', out: 'years', outName: 'years' },
    { cycle: 'water', id: 'lake', what: 'water in a lake', store: [24, 36, 48, 60], storeU: 'km³', flow: [2, 3, 4, 6], flowU: 'km³/yr', out: 'years', outName: 'years' }
  ];
  function genResidence(r, ctx){
    var Cc = C(), list = RESID.filter(function(x){ return !ctx.cycle || x.cycle === ctx.cycle; }), R = r.pick(list.length ? list : RESID);
    var S = r.pick(R.store), F = r.pick(R.flow);
    var yrs = Cc.evaluate({ fn: 'div', args: [S, F] });
    var ans = R.out === 'days' ? Cc.evaluate({ fn: 'convert', args: [yrs, 'yr', 'day'] }) : yrs;
    var big = function(x){ return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
    var text = '<p>A reservoir holds ' + big(S) + ' ' + R.storeU + ', and ' + big(F) + ' ' + R.flowU + ' flows in and out of it. About how long does ' + R.what + ' stay there on average (its residence time)?' + (R.out === 'days' ? ' Give the answer in days.' : '') + '</p>';
    var setupAns = R.out === 'days' ? S + ' / ' + F + ' * 365' : S + ' / ' + F;
    return {
      type: 'residence', ctx: ctx.id, topic: ctx.topic, text: text, givens: { S: S, F: F, out: R.out, id: R.id },
      figure: { cycle: R.cycle },
      steps: [
        { key: 'setup', kind: 'setup', practice: '6.B', label: 'Write the setup: amount stored divided by the flow' + (R.out === 'days' ? ', then years to days.' : '.'), hint: R.out === 'days' ? 'For example 13000 / 500000 * 365.' : 'For example 40 / 5.',
          cell: M.setupCell(setupAns, { mustUse: [String(S), String(F)], parens: false, times100: false, tol: 0.003,
            mistakes: [{ expr: F + ' / ' + S + (R.out === 'days' ? ' * 365' : ''), why: 'Upside down: residence time = amount stored ÷ flow, so the units (' + R.storeU + ') ÷ (' + R.flowU + ') leave years.' }].concat(R.out === 'days' ? [{ expr: S + ' / ' + F, why: 'That is in years. Multiply by 365 days per year.' }] : []) }) },
        { key: 'ans', kind: 'unit', practice: '6.C', label: 'Residence time, with its unit.',
          cell: M.unitCell(ans, R.out, { rel: 0.02, mistakes: [{ value: Cc.evaluate({ fn: 'div', args: [F, S] }) * (R.out === 'days' ? 365 : 1), why: 'Upside down: amount stored ÷ flow.' }].concat(R.out === 'days' ? [{ value: yrs, why: 'That is in years; the question asks for days (× 365).' }] : []) }) }
      ],
      solution: ['Residence time = amount stored ÷ flow = ' + big(S) + ' ' + R.storeU + ' ÷ ' + big(F) + ' ' + R.flowU + ' = ' + M.fmt(yrs, 3) + ' years.'].concat(R.out === 'days' ? [M.fmt(yrs, 3) + ' years × 365 days/year ≈ ' + M.fmt(ans, 3) + ' days.'] : [])
    };
  }

  function generate(r, ctx, type){
    ctx = ctx || {};
    type = type || r.pick(ctx.types || TYPES);
    switch(type){
      case 'process': return genProcess(r, ctx);
      case 'nitrogen': return genNitrogen(r, ctx);
      case 'reservoir': return genReservoir(r, ctx);
      case 'human': return genHuman(r, ctx);
      case 'budget': return genBudget(r, ctx);
      case 'residence': return genResidence(r, ctx);
    }
    throw new Error('cycles: unknown problem type ' + type);
  }

  M.register('cycles', {
    CYCLES: CYCLES, CYCLE_IDS: CYCLE_IDS, PPM: PPM, SPLIT: SPLIT, NORDER: NORDER, NCHEM: NCHEM, RES_Q: RES_Q, HUMAN_Q: HUMAN_Q, RESID: RESID,
    proc: proc, res: res, simulate: simulate, ppm: ppm, TYPES: TYPES, generate: generate, plain: plain
  });
})(typeof window !== 'undefined' ? window : globalThis);
