/* Energy chain model: ApEnvMath.energyChain (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T3, docs/apenv-briefs/t3.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/energy-chain.mjs)
   and the test (scripts/test/apenv-tool-energy-chain.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/energy-chain.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/energy-chain.js.

   SOURCES. Plant efficiency from EIA heat rates (Electric Power Annual 2024,
   table 8.1: coal 10,777, natural gas 7,754, nuclear 10,443 BTU/kWh;
   efficiency = 3,412 / heat rate). CO2 at the plant: EIA, 2023 (coal 2.31,
   natural gas 0.96 lb/kWh). Fuel per kWh: EIA, 2022 (coal 1.14 lb, natural
   gas 7.42 cubic feet). Grid losses: about 5% (EIA). Life-cycle emissions:
   IPCC AR5 WGIII Annex III medians (g CO2-eq/kWh). The stage split inside a
   plant (boiler, turbine, generator) is typical, chosen so the product is
   within 0.5 percentage points of the EIA figure.
   Every number a drill shows comes from ApEnvCalc (M.Calc()), never typed.
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, given }
     types: chain (overall efficiency), fuel (fuel energy needed, kWh to BTU),
            co2 (kWh to pounds or tons of CO2), power (W and hours to kWh and
            cost), heatrate (heat rate to efficiency) */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  function C(){ return M.Calc(); }
  function ev(fn, args){ return C().evaluate({ fn: fn, args: args }); }
  var BTU_KWH = 3412;      // 1 kWh = 3,412 BTU (rounded as the course uses it; ApEnvCalc's exact 3,412.14)
  var LOSS = 0.95;         // the grid delivers about 95%

  /* Each source: the stages from the resource to the busbar (the plant's
     wires), each { id, name, eff, lost: where the loss goes }; the grid
     stage is added by chain(). */
  var SOURCES = {
    coal: { name: 'Coal', fuel: 'coal', heatRate: 10777, co2: 2.31, life: 820, cf: 42, fuelPer: { v: 1.14, unit: 'lb of coal' }, dispatch: true, intermittent: false,
      stages: [{ id: 'boil', name: 'Boiler', eff: 0.88, lost: 'hot exhaust gases up the stack' }, { id: 'turb', name: 'Steam turbine', eff: 0.37, lost: 'heat dumped in the cooling water (the condenser)' }, { id: 'gen', name: 'Generator', eff: 0.98, lost: 'friction and heat in the generator' }],
      resource: 'Chemical energy in coal', icon: 'coal' },
    gas: { name: 'Natural gas', fuel: 'natural gas', heatRate: 7754, co2: 0.96, life: 490, cf: 60, fuelPer: { v: 7.42, unit: 'cubic feet of gas' }, dispatch: true, intermittent: false,
      stages: [{ id: 'burn', name: 'Combustion', eff: 0.99, lost: 'unburned fuel and heat' }, { id: 'turb', name: 'Gas and steam turbines', eff: 0.455, lost: 'heat in the exhaust and cooling water' }, { id: 'gen', name: 'Generator', eff: 0.98, lost: 'friction and heat in the generator' }],
      resource: 'Chemical energy in methane', icon: 'gas' },
    nuclear: { name: 'Nuclear', fuel: 'uranium', heatRate: 10443, co2: 0, life: 12, cf: 93, fuelPer: null, dispatch: true, intermittent: false,
      stages: [{ id: 'core', name: 'Reactor', eff: 0.995, lost: 'heat lost from the reactor vessel' }, { id: 'turb', name: 'Steam turbine', eff: 0.335, lost: 'heat dumped in the cooling water (the cooling tower)' }, { id: 'gen', name: 'Generator', eff: 0.98, lost: 'friction and heat in the generator' }],
      resource: 'Nuclear energy in uranium-235', icon: 'nuclear' },
    hydro: { name: 'Hydro', fuel: 'falling water', heatRate: null, co2: 0, life: 24, cf: 37, fuelPer: null, dispatch: true, intermittent: false,
      stages: [{ id: 'pen', name: 'Penstock', eff: 0.97, lost: 'friction in the pipe' }, { id: 'turb', name: 'Water turbine', eff: 0.93, lost: 'turbulence and friction' }, { id: 'gen', name: 'Generator', eff: 0.98, lost: 'heat in the generator' }],
      resource: 'Potential energy of water behind the dam', icon: 'hydro' },
    wind: { name: 'Wind', fuel: 'wind', heatRate: null, co2: 0, life: 11, cf: 33, fuelPer: null, dispatch: false, intermittent: true,
      stages: [{ id: 'rotor', name: 'Rotor blades', eff: 0.45, lost: 'wind that passes through (no turbine can catch more than 59%, the Betz limit)' }, { id: 'gear', name: 'Gearbox', eff: 0.96, lost: 'friction' }, { id: 'gen', name: 'Generator', eff: 0.95, lost: 'heat in the generator and power electronics' }],
      resource: 'Kinetic energy of the wind', icon: 'wind' },
    solar: { name: 'Solar panels', fuel: 'sunlight', heatRate: null, co2: 0, life: 48, cf: 24, fuelPer: null, dispatch: false, intermittent: true,
      stages: [{ id: 'cell', name: 'Solar cells', eff: 0.20, lost: 'sunlight reflected or turned into heat in the panel' }, { id: 'inv', name: 'Inverter', eff: 0.97, lost: 'heat in the inverter (DC to AC)' }],
      resource: 'Sunlight on the panels', icon: 'solar' }
  };
  var ORDER = ['coal', 'gas', 'nuclear', 'hydro', 'wind', 'solar'];

  /* The whole chain for a source: each stage's energy in and out for a given
     input, the grid, and the totals. All products through ApEnvCalc. */
  function chain(id, input){
    var S = SOURCES[id], st = S.stages.concat([{ id: 'grid', name: 'Power lines', eff: LOSS, lost: 'heat in the wires (resistance)' }]);
    var e = input, out = [];
    st.forEach(function(s){ var o = ev('mul', [e, s.eff]); out.push({ id: s.id, name: s.name, eff: s.eff, lost: s.lost, ein: e, eout: o, waste: ev('sub', [e, o]) }); e = o; });
    var plant = ev('chainEfficiency', S.stages.map(function(s){ return s.eff; }));
    var total = ev('chainEfficiency', st.map(function(s){ return s.eff; }));
    return { id: id, source: S, stages: out, input: input, delivered: e, plant: plant, total: total };
  }
  /* The fuel energy needed to deliver kWh at the outlet. */
  function need(id, kwh){ var c = chain(id, 1); return ev('inputNeeded', [kwh, c.total]); }
  function heatRateEff(hr){ return ev('efficiency', [BTU_KWH, hr]); }

  /* ---------------------------------------------------------- drills */
  function step(key, label, o){ var s = { key: key, label: label, practice: o.practice || '6.B' }; for(var k in o) if(k !== 'practice') s[k] = o[k]; return s; }
  function choice(key, label, opts, practice){
    return step(key, label, { kind: 'choice', practice: practice || '1.B', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 });
  }
  function big(x){ var s = String(x).split('.'); s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return s.join('.'); }
  function num(x){ return String(+(+x).toPrecision(12)); }
  /* n significant figures with thousands commas, never an exponent: 4,874,000 */
  function nice(x, n){ var v = M.sig(x, n || 4), d = Math.max(0, (n || 4) - 1 - Math.floor(Math.log10(Math.abs(v) || 1))); return big(v.toFixed(Math.min(6, d)).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')); }

  var PLANTS = [
    { id: 'coal', effs: [[0.85, 0.88, 0.90], [0.35, 0.37, 0.38, 0.40], [0.95, 0.98, 0.99]] },
    { id: 'gas', effs: [[0.98, 0.99], [0.42, 0.45, 0.48], [0.97, 0.98]] },
    { id: 'nuclear', effs: [[0.99, 1.0], [0.33, 0.34, 0.35], [0.97, 0.98]] }
  ];
  function genChain(r, c){
    var P = r.pick(PLANTS), S = SOURCES[P.id], e = P.effs.map(function(a){ return r.pick(a); }), g = r.pick([0.92, 0.94, 0.95]);
    var effs = e.concat([g]), names = S.stages.map(function(s){ return s.name.toLowerCase(); }).concat(['power lines']);
    var total = ev('chainEfficiency', effs);
    var E0 = r.pick([1000, 2000, 5000, 10000, 50000]);
    var del = ev('percentOf', [total, E0]);
    var setup = effs.map(num).join(' * ') + ' * 100';
    var text = '<p>Energy from ' + S.fuel + ' passes through each step below on its way to a home.</p><ul class="ech-list">' + effs.map(function(x, i){ return '<li>' + names[i].charAt(0).toUpperCase() + names[i].slice(1) + ': ' + M.fixed(x * 100, (x * 100) % 1 ? 1 : 0) + '% efficient</li>'; }).join('') + '</ul>';
    var sum = effs.reduce(function(a, b){ return a + b; }, 0) / effs.length * 100;
    var steps = [
      step('setup', 'Write the setup for the overall efficiency, as a percent.', { kind: 'setup', practice: '6.A', hint: 'Efficiencies in a chain multiply. Write each as a decimal.',
        cell: M.setupCell(setup, { mistakes: [
          { expr: effs.map(num).join(' + '), why: 'Efficiencies in a chain multiply: each step keeps only its fraction of what the step before passed on.' },
          { expr: '(' + effs.map(num).join(' + ') + ') / ' + effs.length + ' * 100', why: 'Averaging the steps is not the chain. Multiply them: each step works on what is left.' }] }) }),
      step('total', 'The overall efficiency, with its unit.', { kind: 'unit', practice: '6.C', cell: M.unitCell(total, '%', { mistakes: [{ value: sum, why: 'That is the average of the steps. Multiply the efficiencies.' }].filter(function(m){ return Math.abs(m.value - total) > 1; }) }) }),
      step('delivered', 'If the ' + S.fuel + ' holds ' + big(E0) + ' kWh of energy, how much reaches the home?', { kind: 'unit', practice: '6.C', hint: 'Energy delivered = energy in × the overall efficiency (as a decimal).', cell: M.unitCell(del, 'kWh', { mistakes: [{ value: ev('mul', [E0, total]), why: 'Change the percent to a decimal first: ' + M.fixed(total, 1) + '% is ' + M.fixed(total / 100, 3) + '.' }] }) }),
      choice('where', 'Where is most of the energy lost?', [
        ['As waste heat at the ' + names[1] + ' (only ' + M.fixed(e[1] * 100, 0) + '% gets through)', 'A heat engine must reject heat to its cooling water (the second law of thermodynamics), so the turbine stage loses the most.'],
        ['In the power lines', 'The grid loses only about ' + M.fixed((1 - g) * 100, 0) + '%.'],
        ['In the generator', 'Generators are very efficient (about ' + M.fixed(e[2] * 100, 0) + '%).'],
        ['It is destroyed', 'Energy is never destroyed (the first law): it leaves as heat that is too spread out to use.']], '1.B')
    ];
    return { ctx: c.id, topic: c.topic, type: 'chain', text: text, steps: steps,
      solution: ['Multiply the efficiencies as decimals: ' + effs.map(num).join(' × ') + ' × 100 = <b>' + M.fixed(total, 1) + '%</b>.', 'Delivered: ' + M.fixed(total, 1) + '% of ' + big(E0) + ' kWh = ' + M.fixed(total / 100, 4) + ' × ' + big(E0) + ' = <b>' + nice(del, 4) + ' kWh</b>.', 'Most is lost as waste heat at the turbine, rejected to the cooling water.'],
      given: { effs: effs, E0: E0, source: P.id }, figure: { kind: 'chain', source: P.id, effs: effs } };
  }

  function genFuel(r, c){
    var id = r.pick(['coal', 'gas', 'nuclear']), S = SOURCES[id], eff = r.pick(id === 'gas' ? [40, 44, 45, 50] : [30, 32, 33, 35]);
    var kwh = r.pick([500, 900, 1200, 2000, 10000]), who = kwh === 900 ? 'a typical US home uses in a month' : kwh === 10000 ? 'a small school uses in a week' : 'a household uses';
    var fuel = ev('inputNeeded', [kwh, eff]);
    var btu = ev('mul', [fuel, BTU_KWH]);
    var s1 = num(kwh) + ' kWh / ' + num(eff / 100);
    var fuelR = M.sig(fuel, 6), fuelS = num(fuelR);
    var s2 = fuelS + ' kWh * 3412 BTU/kWh';
    var text = '<p>A ' + S.name.toLowerCase() + ' plant turns ' + eff + '% of the energy in its ' + S.fuel + ' into electricity. A home needs <b>' + big(kwh) + ' kWh</b> of electricity. (Ignore the power lines here. 1 kWh = 3,412 BTU.)</p>';
    var steps = [
      step('setup', 'Write the setup for the fuel energy the plant must burn, in kWh.', { kind: 'setup', practice: '6.A', hint: 'Energy in = energy out ÷ efficiency (as a decimal).',
        cell: M.setupCell(s1, { unit: 'kWh', mistakes: [{ expr: num(kwh) + ' kWh * ' + num(eff / 100), why: 'Multiplying gives less than the home uses. The plant must burn MORE energy than it delivers: divide by the efficiency.' }] }) }),
      step('fuel', 'The fuel energy, with its unit.', { kind: 'unit', practice: '6.C', cell: M.unitCell(fuel, 'kWh', { mistakes: [{ value: ev('mul', [kwh, eff / 100]), why: 'Divide by the efficiency: the fuel energy must be larger than the electricity.' }] }) }),
      step('setup2', 'Write the setup to convert that to BTU, with units that cancel.', { kind: 'setup', practice: '6.B', hint: 'Use the factor 3412 BTU/kWh so kWh cancels.',
        // tol: the student carries the fuel energy from the step before, rounded (4444.4 or 4444 for 4444.44)
        cell: M.setupCell(s2, { unit: 'BTU', bind: {}, tol: 0.002, mistakes: [{ expr: fuelS + ' kWh / (3412 BTU/kWh)', why: 'Upside down: write the factor so kWh is on the bottom and cancels, leaving BTU.' }] }) }),
      step('btu', 'The fuel energy in BTU, with its unit.', { kind: 'unit', practice: '6.C', cell: M.unitCell(ev('mul', [fuelR, BTU_KWH]), 'BTU', { mistakes: [{ value: ev('div', [fuelR, BTU_KWH]), why: 'You divided. Multiply by 3,412 BTU per kWh so the kWh cancel.' }, { value: ev('mul', [kwh, BTU_KWH]), why: 'That converts the electricity, not the fuel energy. Use the fuel energy from the step before.' }] }) })
    ];
    return { ctx: c.id, topic: c.topic, type: 'fuel', text: text, steps: steps,
      solution: ['Fuel energy = ' + big(kwh) + ' kWh ÷ ' + num(eff / 100) + ' = <b>' + nice(fuel, 4) + ' kWh</b>.', 'In BTU: ' + nice(fuel, 6) + ' kWh × 3,412 BTU/kWh = <b>' + nice(fuelR * BTU_KWH, 4) + ' BTU</b> (the kWh cancel).', 'The other ' + (100 - eff) + '% leaves the plant as waste heat.'],
      given: { kwh: kwh, eff: eff, fuel: fuel, btu: fuelR * BTU_KWH, source: id }, figure: { kind: 'need', source: id, eff: eff, kwh: kwh } };
  }

  function genCo2(r, c){
    var id = r.pick(['coal', 'gas']), S = SOURCES[id], kwh = r.pick([600, 900, 1000, 1500, 2000, 12000]);
    var f = S.co2, lb = ev('emissions', [kwh, f]);
    var s1 = num(kwh) + ' kWh * ' + num(f) + ' lb/kWh';
    var tons = ev('div', [lb, 2000]);
    var text = '<p>A ' + S.name.toLowerCase() + ' power plant releases about <b>' + num(f) + ' lb of CO₂ per kWh</b> it generates (EIA, 2023). A family uses <b>' + big(kwh) + ' kWh</b> of its electricity. (1 short ton = 2,000 lb.)</p>';
    var other = id === 'coal' ? 'gas' : 'coal', fo = SOURCES[other].co2;
    var steps = [
      step('setup', 'Write the setup for the CO₂ released, with units that cancel.', { kind: 'setup', practice: '6.B', hint: 'Multiply the kWh by the lb of CO₂ per kWh, so kWh cancels.',
        cell: M.setupCell(s1, { unit: 'lb', mistakes: [{ expr: num(kwh) + ' kWh / (' + num(f) + ' lb/kWh)', why: 'Upside down: multiply by lb per kWh so kWh cancels.' }] }) }),
      step('lb', 'The CO₂ released, with its unit.', { kind: 'unit', practice: '6.C', cell: M.unitCell(lb, 'lb', { units: ['lb CO2', 'pounds', 'pounds of CO2', 'lbs'], mistakes: [{ value: ev('div', [kwh, f]), why: 'Multiply: each kWh releases ' + num(f) + ' lb.' }] }) }),
      step('tons', 'The CO₂ in short tons, with its unit.', { kind: 'unit', practice: '6.C', hint: '1 short ton = 2,000 lb, so divide the pounds by 2,000.', cell: M.unitCell(tons, 'ton', { units: ['tons', 'short tons', 'short ton', 'tons CO2'], mistakes: [{ value: ev('mul', [lb, 2000]), why: 'Divide by 2,000 lb per ton: tons are bigger, so the number gets smaller.' }, { value: ev('div', [lb, 1000]), why: 'A short ton is 2,000 lb, not 1,000.' }] }) }),
      choice('switch', 'If the same electricity came from ' + SOURCES[other].name.toLowerCase() + ' (' + num(fo) + ' lb/kWh) instead, the CO₂ would', [
        [id === 'coal' ? 'Fall by more than half: gas has fewer carbon atoms per unit of energy and its plants are more efficient' : 'More than double: coal has more carbon per unit of energy and its plants are less efficient', 'Natural gas (CH₄) releases about half as much CO₂ per kWh as coal. It is lower carbon, not zero carbon.'],
        ['Not change: all fossil fuels release the same CO₂', 'Fuels differ in carbon per unit of energy and plants differ in efficiency.'],
        [id === 'coal' ? 'Drop to zero: natural gas is a clean fuel' : 'Fall, because coal plants have scrubbers', id === 'coal' ? 'Burning methane still makes CO₂, about 0.96 lb per kWh.' : 'Scrubbers remove SO₂, not CO₂.']], '7.C')
    ];
    return { ctx: c.id, topic: c.topic, type: 'co2', text: text, steps: steps,
      solution: [big(kwh) + ' kWh × ' + num(f) + ' lb CO₂/kWh = <b>' + nice(lb, 6) + ' lb CO₂</b> (kWh cancel).', nice(lb, 6) + ' lb × 1 ton/2,000 lb = <b>' + nice(tons, 4) + ' tons</b>.', 'From ' + SOURCES[other].name.toLowerCase() + ': ' + big(kwh) + ' × ' + num(fo) + ' = ' + nice(ev('emissions', [kwh, fo]), 6) + ' lb.'],
      given: { kwh: kwh, f: f, lb: lb, tons: tons, source: id }, figure: { kind: 'co2', source: id, kwh: kwh } };
  }

  var DEVICES = [
    { name: 'an incandescent bulb', w: 60, h: [4, 5, 6] }, { name: 'an LED bulb', w: 9, h: [4, 5, 6] }, { name: 'a laptop', w: 50, h: [3, 6, 8] },
    { name: 'a space heater', w: 1500, h: [2, 3, 4] }, { name: 'a refrigerator', w: 150, h: [24] }, { name: 'a TV', w: 100, h: [3, 4, 5] }
  ];
  function genPower(r, c){
    var D = r.pick(DEVICES), h = r.pick(D.h), days = r.pick([30, 365]), price = r.pick([0.12, 0.15, 0.17, 0.20]);
    // day × h/day × W × kW/W: the units cancel to kWh (ApEnvCalc.chain checks it)
    var kwh = C().evaluate({ fn: 'chain', args: [days, 'day', [[h, 'h', 1, 'day'], [D.w, 'W', 1, ''], [1, 'kW', 1000, 'W']]], pick: 'value' });
    var cost = ev('cost', [kwh, price]);
    var s1 = num(D.w) + ' W * ' + h + ' h/day * ' + days + ' day * 1 kW / 1000 W';
    var text = '<p>' + D.name.charAt(0).toUpperCase() + D.name.slice(1) + ' draws <b>' + big(D.w) + ' W</b> and runs <b>' + h + ' hours a day</b> for <b>' + days + ' days</b>. Electricity costs <b>$' + M.fixed(price, 2) + ' per kWh</b>.</p>';
    var steps = [
      step('setup', 'Write the setup for the energy used in kWh, with units that cancel.', { kind: 'setup', practice: '6.B', hint: 'Energy = power × time. Change W to kW with 1 kW / 1000 W.',
        cell: M.setupCell(s1, { unit: 'kW*h', mistakes: [{ expr: num(D.w) + ' W * ' + h + ' h/day * ' + days + ' day', why: 'That is in watt-hours. Divide by 1,000 W per kW to get kWh.' }] }) }),
      step('kwh', 'The energy used, with its unit.', { kind: 'unit', practice: '6.C', cell: M.unitCell(kwh, 'kWh', { units: ['kW h', 'kW*h', 'kilowatt-hours'], mistakes: [{ value: ev('mul', [D.w, h, days]), why: 'That is watt-hours (Wh). 1 kWh = 1,000 Wh.' }, { value: ev('mul', [D.w, h, ev('div', [1, 1000])]), why: 'That is one day. Multiply by the ' + days + ' days.' }] }) }),
      step('cost', 'The cost, in dollars.', { kind: 'unit', practice: '6.C', hint: 'Cost = kWh × the price per kWh.', cell: M.unitCell(cost, '$', { units: ['dollars', 'dollar', 'USD'], places: 2, mistakes: [{ value: ev('div', [kwh, price]), why: 'Multiply: kWh × $ per kWh leaves $.' }] }) })
    ];
    return { ctx: c.id, topic: c.topic, type: 'power', text: text, steps: steps,
      solution: [big(D.w) + ' W × ' + h + ' h/day × ' + days + ' days × 1 kW/1,000 W = <b>' + nice(kwh, 5) + ' kWh</b>.', nice(kwh, 5) + ' kWh × $' + M.fixed(price, 2) + '/kWh = <b>$' + M.fixed(cost, 2) + '</b>.', 'W is a rate (power); kWh is an amount (energy).'],
      given: { w: D.w, h: h, days: days, price: price, kwh: kwh, cost: cost }, figure: { kind: 'power', w: D.w, h: h, days: days } };
  }

  function genHeat(r, c){
    var id = r.pick(['coal', 'gas', 'nuclear']), S = SOURCES[id];
    var hr = r.pick(id === 'gas' ? [6800, 7000, 7500, 7754, 8000] : id === 'coal' ? [9500, 10000, 10500, 10777, 11000] : [10000, 10443, 10500]);
    var eff = ev('efficiency', [BTU_KWH, hr]);
    var s1 = '3412 / ' + hr + ' * 100';
    var text = '<p>Power plants report a <b>heat rate</b>: the fuel energy burned for each kWh of electricity. A ' + S.name.toLowerCase() + ' plant has a heat rate of <b>' + big(hr) + ' BTU/kWh</b>. One kWh of electricity is 3,412 BTU.</p>';
    var steps = [
      step('setup', 'Write the setup for the plant’s efficiency, as a percent.', { kind: 'setup', practice: '6.A', hint: 'Efficiency = energy out ÷ energy in × 100.',
        cell: M.setupCell(s1, { mistakes: [{ expr: hr + ' / 3412 * 100', why: 'Upside down: efficiency is what comes out (3,412 BTU of electricity) over what goes in (' + big(hr) + ' BTU of fuel).' }] }) }),
      step('eff', 'The efficiency, with its unit.', { kind: 'unit', practice: '6.C', cell: M.unitCell(eff, '%') }),
      choice('lower', 'A newer plant has a LOWER heat rate. It', [
        ['Is more efficient: it burns less fuel for each kWh', 'Less fuel in for the same electricity out means a higher efficiency and less CO₂ per kWh.'],
        ['Is less efficient: it makes less heat', 'The heat rate is fuel in per kWh out, so lower is better.'],
        ['Makes less electricity', 'The heat rate is per kWh; it says nothing about how much the plant makes.']], '5.C')
    ];
    return { ctx: c.id, topic: c.topic, type: 'heatrate', text: text, steps: steps,
      solution: ['Efficiency = 3,412 BTU ÷ ' + big(hr) + ' BTU × 100 = <b>' + M.fixed(eff, 1) + '%</b>.', 'The other ' + M.fixed(100 - eff, 1) + '% is waste heat.', 'Lower heat rate, higher efficiency.'],
      given: { hr: hr, eff: eff, source: id }, figure: { kind: 'heat', source: id, hr: hr } };
  }

  var GEN = { chain: genChain, fuel: genFuel, co2: genCo2, power: genPower, heatrate: genHeat };
  var TYPES = ['chain', 'fuel', 'co2', 'power', 'heatrate'];
  M.register('energyChain', {
    TYPES: TYPES, SOURCES: SOURCES, ORDER: ORDER, BTU_KWH: BTU_KWH, LOSS: LOSS,
    chain: chain, need: need, heatRateEff: heatRateEff,
    generate: function(r, c, type){
      var t = type || r.pick((c && c.types) || TYPES);
      if(!GEN[t]) throw new Error('energy-chain: unknown problem type ' + t);
      return GEN[t](r, c || {});
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
