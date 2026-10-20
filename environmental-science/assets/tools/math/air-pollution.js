/* Air pollution model: ApEnvMath.airPollution (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T3, docs/apenv-briefs/t3.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/air-pollution.mjs)
   and the test (scripts/test/apenv-tool-air-pollution.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/air-pollution.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/air-pollution.js.

   smogDay(o) -> { hours, NO, NO2, O3, VOC, peaks } a one-box model of a
     city's air over a day, run for four days so the last is a steady day:
       traffic emits NO (most), a little NO2, and VOCs, with rush hours at
         7:30 and 17:30
       sunlight splits NO2:           NO2 + light -> NO + O    O + O2 -> O3
       ozone is used up by NO:        NO + O3 -> NO2 + O2      (titration)
       VOC radicals turn NO into NO2 without using ozone, building through
         the morning's sunlight; that is what lets ozone pile up
       dilution by the mixed layer, deep on a sunny afternoon, shallow at
         night; a thermal inversion caps it (o.inversion)
     So NO peaks with the morning rush, NO2 an hour or two later, ozone in
     the early afternoon, and ozone falls at night (no sunlight, NO eats
     it). The rate constants are fitted so the timing matches the textbook
     curve (and the observed pattern, e.g. EPA's Los Angeles profiles);
     concentrations are illustrative, in ppb.
   inversionProfile(on) -> the temperature with height: normally cooler
     with height; in an inversion a warm layer sits over cool air.
   rainPH(f) -> rain pH for f, the share of a 1970s-scale SO2 and NOx load
     (0 to 1): clean rain about 5.6 (CO2 makes carbonic acid), acid rain
     below that (EPA). lakePH(rain, limestone): illustrative buffering.
   Every number a drill shows comes from ApEnvCalc (M.Calc()), never typed.
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, given }
     types: smog (read the day's curves), inversion, ph (times more acidic),
            reduce (match the fix to the pollutant), pct (percent change in
            emissions) */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  function C(){ return M.Calc(); }
  function ev(fn, args){ return C().evaluate({ fn: fn, args: args }); }

  /* ------------------------------------------------------- smog model */
  var K = { j: 17.58, kt: 1.12, kr: 0.266, ks: 0.92, eNO: 46.6, eNO2: 1.82, lN: 0.0375, bg: 28, dep: 0.02, eV: 58.4, lV: 0.0083, rd: 0.106 };
  function gauss(t, m, s){ var z = (t - m) / s; return Math.exp(-0.5 * z * z); }
  function sunAt(h){ return h > 6 && h < 19 ? Math.sin(Math.PI * (h - 6) / 13) : 0; }
  function trafficAt(h){ return 0.04 + gauss(h, 7.5, 1.0) + 0.6 * gauss(h, 17.5, 1.3) + 0.35 * gauss(h, 12.5, 2.5); }
  function mixAt(h){ return 0.15 + (h > 8 && h < 20 ? 0.6 * Math.sin(Math.PI * (h - 8) / 12) : 0); }
  var cache = {};
  function smogDay(o){
    o = o || {};
    var cars = o.cars == null ? 1 : o.cars, sun = o.cloudy ? 0.3 : (o.sun == null ? 1 : o.sun), inv = !!o.inversion;
    var key = [cars, sun, inv].join('|');
    if(cache[key]) return cache[key];
    var NO = 5, NO2 = 10, O3 = 20, V = 50, R = 0, dt = 0.002, per = 24 / dt, out = { hours: [], NO: [], NO2: [], O3: [], VOC: [] };
    for(var k = 0; k < 4 * per; k++){
      var h = (k * dt) % 24, J = sunAt(h) * sun, E = cars * trafficAt(h), mix = mixAt(h) * (inv ? 0.3 : 1);
      var jN = K.j * J * NO2, tit = K.kt * NO * O3;
      R += (K.kr * J * V - K.rd * R) * dt;
      var conv = R * NO / (NO + K.ks);
      var dNO = K.eNO * E + jN - tit - conv - mix * NO;
      var dNO2 = K.eNO2 * E - jN + tit + conv - K.lN * J * NO2 - mix * NO2;
      // surface uptake of ozone acts on a thinner layer when mixing is shallow
      var dO3 = jN - tit - mix * (O3 - K.bg) - K.dep * (0.75 / mix) * O3;
      var dV = K.eV * E + 3 - K.lV * R * V - mix * V;
      NO += dNO * dt; NO2 += dNO2 * dt; O3 += dO3 * dt; V += dV * dt;
      if(k >= 3 * per && (k - 3 * per) % 50 === 0){
        out.hours.push(M.round((k - 3 * per) * dt, 2)); out.NO.push(Math.max(0, NO)); out.NO2.push(Math.max(0, NO2)); out.O3.push(Math.max(0, O3)); out.VOC.push(Math.max(0, V));
      }
    }
    out.peaks = {};
    ['NO', 'NO2', 'O3', 'VOC'].forEach(function(s){ var i = 0; out[s].forEach(function(v, j){ if(v > out[s][i]) i = j; }); out.peaks[s] = { hour: out.hours[i], value: out[s][i] }; });
    out.at = function(s, h){ var i = Math.max(0, Math.min(out.hours.length - 1, Math.round(h / 0.1))); return out[s][i]; };
    cache[key] = out;
    return out;
  }

  /* --------------------------------------------------- the inversion */
  function inversionProfile(on){
    // [height m, temperature °C]: about −6.5 °C per km normally; with an
    // inversion the air warms from 150 m to 450 m, then cools again.
    var pts = [];
    for(var z = 0; z <= 1200; z += 50){
      var t = on ? (z < 150 ? 8 - 0.0065 * z : z < 450 ? 7 + (z - 150) * 0.02 : 13 - (z - 450) * 0.0065) : 15 - 0.0065 * z;
      pts.push([z, M.round(t, 2)]);
    }
    return { pts: pts, lid: on ? 150 : null, top: on ? 450 : null };
  }

  /* ---------------------------------------------------------- acid rain */
  var PH_CLEAN = 5.6;
  function rainPH(f){ f = Math.max(0, Math.min(1, f)); var h = Math.pow(10, -PH_CLEAN) + 6e-5 * f; return -Math.log(h) / Math.LN10; }
  function lakePH(rain, limestone){ return limestone ? Math.max(rain, Math.min(7.6, 7.6 - (5.6 - rain) * 0.25)) : Math.min(6.8, rain + 0.7); }
  // EPA, "Effects of Acid Rain: Surface Waters": the lowest pH each animal tolerates
  var TOLERANCE = [
    { name: 'Snails', ph: 6.0 }, { name: 'Clams', ph: 6.0 }, { name: 'Bass', ph: 5.5 }, { name: 'Crayfish', ph: 5.5 }, { name: 'Mayfly', ph: 5.5 },
    { name: 'Trout', ph: 5.0 }, { name: 'Salamanders', ph: 5.0 }, { name: 'Perch', ph: 4.5 }, { name: 'Frogs', ph: 4.0 }
  ];

  /* The pollutants, the trap the readers name for each, and the fix. */
  var POLL = {
    NOx: { name: 'nitrogen oxides (NOx)', src: 'engines and power plants', from: 'car engines and power plants (nitrogen and oxygen from the air combine in hot combustion)', fix: 'a catalytic converter in the car’s exhaust (and low-NOx burners at power plants)', acid: true },
    SO2: { name: 'sulfur dioxide (SO₂)', src: 'coal-burning power plants', from: 'burning coal, which contains sulfur', fix: 'a wet scrubber (limestone slurry) in the smokestack, or low-sulfur coal', acid: true },
    PM: { name: 'particulate matter (PM)', src: 'smokestacks, diesel engines and fires', from: 'burning coal and wood, diesel engines, dust', fix: 'an electrostatic precipitator or baghouse filter in the smokestack', acid: false },
    VOC: { name: 'volatile organic compounds (VOCs)', src: 'gasoline, paints and solvents', from: 'gasoline vapor, paints and solvents', fix: 'vapor recovery nozzles at gas pumps, and low-VOC paints', acid: false },
    CO: { name: 'carbon monoxide (CO)', src: 'engines', from: 'incomplete burning of fuel in engines', fix: 'a catalytic converter, which turns CO into CO₂', acid: false },
    O3: { name: 'ground-level ozone (O₃)', secondary: true, from: 'sunlight acting on NOx and VOCs', fix: 'cutting its precursors, NOx and VOCs (catalytic converters, vapor recovery)', acid: false },
    H2SO4: { name: 'sulfuric acid in rain', secondary: true, from: 'SO₂ reacting with water in the air', fix: 'scrubbers that remove SO₂ before it leaves the stack', acid: true }
  };

  /* --------------------------------------------------------- the drills */
  function step(key, label, o){ var s = { key: key, label: label, practice: o.practice || '1.B' }; for(var k in o) if(k !== 'practice') s[k] = o[k]; return s; }
  function choice(key, label, opts, practice){ return step(key, label, { kind: 'choice', practice: practice || '1.B', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 }); }
  function clock(h){ var hh = Math.floor(h), mm = Math.round((h - hh) * 60); if(mm === 60){ hh++; mm = 0; } var ap = hh >= 12 ? 'p.m.' : 'a.m.', h12 = hh % 12 || 12; return h12 + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap; }
  function big(x){ var s = String(x).split('.'); s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return s.join('.'); }

  function genSmog(r, c){
    var cars = r.pick([0.8, 1, 1.2]), day = smogDay({ cars: cars }), order = M.shuffle(r, ['NO', 'NO2', 'O3']);
    var lab = { NO: 'nitric oxide (NO)', NO2: 'nitrogen dioxide (NO₂)', O3: 'ozone (O₃)' };
    var curve = function(s){ return 'Curve ' + (order.indexOf(s) + 1); };
    var pk = day.peaks;
    var opts = order.map(function(s){ return [curve(s) + ' (peaks near ' + clock(pk[s].hour) + ')', s]; });
    var o3 = opts.filter(function(x){ return x[1] === 'O3'; })[0], others = opts.filter(function(x){ return x[1] !== 'O3'; });
    var steps = [
      choice('o3', 'Which curve is ozone?', [[o3[0], 'Ozone forms from NO₂ only in sunlight, and it builds up through the morning, so it peaks in the early afternoon, hours after the rush.']].concat(others.map(function(x){ return [x[0], x[1] === 'NO' ? 'This one peaks with the morning rush hour: it is NO, straight from car exhaust (a primary pollutant).' : 'This one peaks an hour or two after the rush: it is NO₂, made as NO is oxidized; sunlight then splits it to make ozone.']; })), '2.B'),
      choice('first', 'Which pollutant peaks first, and why?', [
        ['NO, because car engines emit it directly during the morning rush hour', 'Hot engines combine nitrogen and oxygen from the air into NO; it is a primary pollutant.'],
        ['Ozone, because the sun rises before the rush hour', 'Ozone needs NO₂ and hours of sunlight; it peaks in the afternoon.'],
        ['NO₂, because sunlight makes it from ozone', 'Sunlight splits NO₂ (making ozone); NO₂ comes from NO, so it peaks after NO.']], '2.B'),
      choice('secondary', 'Which of these is a SECONDARY pollutant?', [
        ['Ozone: it forms in the air from NOx and VOCs in sunlight', 'A secondary pollutant is made by reactions in the atmosphere, not emitted.'],
        ['Nitric oxide (NO): it comes from car exhaust', 'Emitted directly, so it is primary.'],
        ['Volatile organic compounds: they evaporate from gasoline', 'Emitted directly, so they are primary.'],
        ['Carbon monoxide: it comes from engines', 'Emitted directly, so it is primary.']], '1.A'),
      choice('night', 'Why does ozone fall after sunset?', [
        ['No sunlight splits NO₂ to make more, and evening NO from traffic uses ozone up (NO + O₃ → NO₂ + O₂)', 'Without light ozone is only destroyed, not made.'],
        ['Ozone rises into the stratosphere at night', 'Ground-level ozone does not migrate to the ozone layer; it reacts away near the ground.'],
        ['Plants absorb all of it at night', 'Some ozone is taken up by surfaces, but the main reason is the missing sunlight and the NO that destroys it.']], '1.B')
    ];
    return { ctx: c.id, topic: c.topic, type: 'smog', text: '<p>The graph shows three pollutants measured in a sunny city on a weekday. They are labeled only as curves 1, 2 and 3.</p>', steps: steps,
      solution: ['NO peaks with the morning rush (about ' + clock(pk.NO.hour) + '): it is emitted by engines.', 'NO₂ peaks a little later (about ' + clock(pk.NO2.hour) + ') as NO is oxidized.', 'Ozone peaks in the early afternoon (about ' + clock(pk.O3.hour) + '): sunlight splits NO₂ (NO₂ + light → NO + O, then O + O₂ → O₃), and VOCs keep NO from destroying it.', 'Ozone is secondary; NO, VOCs and CO are primary.'],
      given: { cars: cars, order: order, peaks: { NO: pk.NO.hour, NO2: pk.NO2.hour, O3: pk.O3.hour } }, figure: { kind: 'smog', cars: cars, order: order } };
  }

  function genInv(r, c){
    var city = r.pick(c.cities || [{ name: 'Salt Lake City', where: 'in a mountain valley' }]);
    var season = r.pick(['a still winter night', 'a calm, clear night']);
    var steps = [
      choice('what', 'On ' + season + ', a thermal inversion forms over ' + city.name + '. What is a thermal inversion?', [
        ['A layer of warm air sitting on top of cooler air near the ground', 'Normally air gets cooler with height; in an inversion a warm layer sits above the cool air.'],
        ['A layer of cool air sitting on top of warm air near the ground', 'That is the normal situation, which lets warm polluted air rise and mix.'],
        ['A hole in the ozone layer over the city', 'The ozone layer is in the stratosphere and is a different issue; an inversion is a temperature layer near the ground.'],
        ['Warm air rising quickly from the ground', 'That is normal convection, which clears pollution; an inversion stops it.']], '1.A'),
      choice('trap', 'Why does pollution build up during the inversion?', [
        ['The cool air near the ground is denser than the warm air above it, so it cannot rise and mix: pollutants stay trapped near the ground', 'The warm layer acts as a lid.'],
        ['The warm layer above makes new pollutants', 'The inversion makes nothing; it traps what is emitted below it.'],
        ['Cold air speeds up the reactions that make pollutants', 'Cold air slows most reactions; the problem is that the pollutants cannot escape.']], '1.B'),
      choice('where', 'Why is ' + city.name + ' (' + city.where + ') especially prone to inversions?', [
        ['Surrounding mountains block wind, and cold air drains down the slopes and pools in the valley under warmer air', 'Valleys and basins (Salt Lake City, Los Angeles, Mexico City) trap cold air.'],
        ['It is near the equator', 'Inversions form at many latitudes; local landforms and calm, clear nights matter more.'],
        ['Its people use more air conditioning', 'Air conditioning does not form inversions.']], '2.C'),
      choice('health', 'Which health effect is most likely during a long inversion?', [
        ['Asthma attacks and other respiratory problems from trapped particulates and smog', 'Concentrations of PM, NOx and other pollutants rise the longer the lid stays.'],
        ['Skin cancer from more UV light', 'UV is linked to the stratospheric ozone layer, not an inversion.'],
        ['Hearing loss', 'That is noise pollution.']], '7.A')
    ];
    return { ctx: c.id, topic: c.topic, type: 'inversion', text: '<p>' + city.name + ' sits ' + city.where + '. The graph shows the air temperature at different heights above the city.</p>', steps: steps,
      solution: ['Normally air cools with height, so warm polluted air near the ground rises and mixes away.', 'In an inversion a warm layer sits on top of cooler, denser air, which cannot rise: pollution is trapped below the lid.', 'Valleys and calm, clear nights (the ground cools fast) make inversions more common.'],
      given: { city: city.name }, figure: { kind: 'inversion' } };
  }

  function genPH(r, c){
    var a = r.pick([4.0, 4.2, 4.3, 4.5, 4.6, 5.0]), b;
    do { b = r.pick([5.6, 6.0, 6.5, 7.0, 5.5, 5.0]); } while(b - a < 0.9 || Math.abs((b - a) * 10 - Math.round((b - a) * 10)) > 1e-6);
    var d = ev('sub', [b, a]), times = ev('pow', [10, d]);
    var where = r.pick(c.places || ['a lake in the Adirondack Mountains']);
    var text = '<p>Rain falling on ' + where + ' has a pH of <b>' + a.toFixed(1) + '</b>. ' + (b === 5.6 ? 'Normal, unpolluted rain' : 'Rain in a cleaner region') + ' has a pH of <b>' + b.toFixed(1) + '</b>.</p>';
    var setup = '10^(' + b.toFixed(1) + ' - ' + a.toFixed(1) + ')';
    var steps = [
      step('setup', 'Write the setup for how many times more acidic the first rain is.', { kind: 'setup', practice: '6.A', hint: 'Each 1 pH unit is a factor of 10 in hydrogen ion concentration.',
        cell: M.setupCell(setup, { parens: false, mistakes: [{ expr: b.toFixed(1) + ' - ' + a.toFixed(1), why: 'pH is a log scale: a difference of ' + M.fixed(d, 1) + ' units means 10 raised to ' + M.fixed(d, 1) + ', not ' + M.fixed(d, 1) + ' times.' }, { expr: b.toFixed(1) + ' / ' + a.toFixed(1), why: 'Divide the pH values gives nothing useful. Each pH unit is a factor of 10: raise 10 to the difference.' }] }) }),
      step('times', 'How many times more acidic? (Round to a whole number.)', { kind: 'num', practice: '6.C', d: 0, cell: M.cell(times, 0.01, [{ value: d, why: 'That is the difference in pH. Each unit is ×10, so the answer is 10 to that power.' }, { value: 10 * d, why: 'Not 10 times the difference: 10 raised to the difference.' }], 0.5) }),
      choice('cause', 'Which pollutants make rain this acidic?', [
        ['Sulfur dioxide and nitrogen oxides, which form sulfuric and nitric acid', 'Mostly from burning coal (SO₂) and from engines and power plants (NOx).'],
        ['Carbon dioxide from all fuels', 'CO₂ makes clean rain slightly acidic (pH about 5.6); acid rain below that comes from SO₂ and NOx.'],
        ['CFCs from old refrigerators', 'CFCs destroy stratospheric ozone; they do not cause acid rain.'],
        ['Particulate matter and VOCs', 'They cause haze and smog, not acid rain.']], '1.B')
    ];
    if(c.buffer !== false) steps.push(choice('buffer', 'A lake on limestone bedrock gets the same rain as a lake on granite. Which lake’s pH drops less?', [
      ['The limestone lake: calcium carbonate neutralizes the acid', 'Limestone (CaCO₃) is a natural buffer; granite has almost none, so its lakes acidify.'],
      ['The granite lake: granite is harder', 'Hardness does not matter; only rock that can react with acid (limestone) buffers it.'],
      ['Both the same: the rain is the same', 'The bedrock and soil change how much of the acid is neutralized.']], '1.C'));
    return { ctx: c.id, topic: c.topic, type: 'ph', text: text, steps: steps,
      solution: ['pH difference: ' + b.toFixed(1) + ' − ' + a.toFixed(1) + ' = ' + M.fixed(d, 1) + '.', 'Each pH unit is a factor of 10, so 10^' + M.fixed(d, 1) + ' = <b>' + big(M.fixed(times, 0)) + ' times</b> more acidic.', 'SO₂ and NOx form sulfuric and nitric acid; limestone buffers it.'],
      given: { a: a, b: b, times: times }, figure: { kind: 'ph', a: a, b: b } };
  }

  function genReduce(r, c){
    var ids = ['NOx', 'SO2', 'PM', 'VOC', 'CO'], id = r.pick(ids), P = POLL[id];
    // NOx and CO share the catalytic converter, so never offer one as a wrong answer for the other
    var others = M.shuffle(r, ids.filter(function(x){ return x !== id && !(/catalytic/.test(POLL[x].fix) && /catalytic/.test(P.fix)); })).slice(0, 3);
    var steps = [
      choice('fix', 'Which method reduces ' + P.name + ' at its source?', [[P.fix.charAt(0).toUpperCase() + P.fix.slice(1), 'It targets ' + P.name + ', which comes from ' + P.from + '.']].concat(others.map(function(o){ var Q = POLL[o]; return [Q.fix.charAt(0).toUpperCase() + Q.fix.slice(1), 'That reduces ' + Q.name + ', not ' + P.name + '.']; })), '7.B'),
      choice('kind', 'What kind of pollutant is this?', [
        ['Primary: it is emitted directly, from ' + P.src, 'Primary pollutants come straight from a source.'],
        ['Secondary: it forms in the air from other pollutants', 'Secondary pollutants (ozone, sulfuric and nitric acid) form by reactions in the air.'],
        ['Not a pollutant: it occurs naturally', 'Natural sources exist, but at these levels it harms health and ecosystems.']], '1.A'),
      choice('acid', 'Does this pollutant cause acid rain?', P.acid ? [
        ['Yes: it reacts with water in the air to form an acid', id === 'SO2' ? 'SO₂ forms sulfuric acid (H₂SO₄).' : 'NOx forms nitric acid (HNO₃).'],
        ['No: only carbon dioxide makes rain acidic', 'CO₂ makes clean rain only slightly acidic (pH 5.6); SO₂ and NOx cause acid rain.'],
        ['No: it only destroys the ozone layer', 'It is CFCs that destroy stratospheric ozone.']] : [
        ['No: acid rain comes from SO₂ and NOx', 'Only sulfur and nitrogen oxides form the strong acids in acid rain.'],
        ['Yes: every air pollutant makes rain acidic', 'Only SO₂ and NOx form the strong acids.'],
        ['Yes, because it is a greenhouse gas', 'Greenhouse gases warm the climate; they do not cause acid rain (CO₂ only slightly lowers rain pH, to 5.6).']], '1.B')
    ];
    return { ctx: c.id, topic: c.topic, type: 'reduce', text: '<p>A city wants to cut its emissions of ' + P.name + '. They come from ' + P.from + '.</p>', steps: steps,
      solution: ['Fix at the source: ' + P.fix + '.', 'It is a primary pollutant, emitted directly.', P.acid ? 'It causes acid rain.' : 'It does not cause acid rain (that is SO₂ and NOx).'],
      given: { id: id }, figure: { kind: 'reduce', id: id } };
  }

  function genPct(r, c){
    if(!c.series || !c.series.length) throw new Error('air-pollution: a pct context needs its series');
    var S = r.pick(c.series);
    var oldV = S.from, newV = S.to, pc = ev('percentChange', [oldV, newV]);
    var setup = '(' + newV + ' - ' + oldV + ') / ' + oldV + ' * 100';
    var steps = [
      step('setup', 'Write the setup for the percent change from ' + S.y0 + ' to ' + S.y1 + '.', { kind: 'setup', practice: '6.B', hint: 'Percent change = (new − old) / old × 100.',
        cell: M.setupCell(setup, { mustUse: [String(oldV), String(newV)], mistakes: [{ expr: '(' + newV + ' - ' + oldV + ') / ' + newV + ' * 100', why: 'Divide by the OLD value (' + oldV + '), the one you started from.' }, { expr: '(' + oldV + ' - ' + newV + ') / ' + oldV + ' * 100', why: 'New minus old: a decrease comes out negative.' }] }) }),
      step('pct', 'The percent change, with its unit.', { kind: 'unit', practice: '6.C', cell: M.unitCell(pc, '%', { units: ['percent'], mistakes: [{ value: ev('percentChange', [newV, oldV]), why: 'Divide by the old value, ' + oldV + ', not the new one.' }, { value: -pc, why: 'Emissions went down, so the change is negative (new − old).' }] }) }),
      choice('why', 'Which law most explains this drop?', S.law ? S.law : [
        ['The Clean Air Act (its 1990 amendments set a cap-and-trade system for SO₂ from power plants)', 'Power plants had to cut SO₂ (scrubbers, low-sulfur coal) or buy allowances; emissions fell far below the cap.'],
        ['The Montreal Protocol', 'That treaty phased out CFCs to protect the ozone layer.'],
        ['The Clean Water Act', 'That law regulates discharges into water.']], '7.B')
    ];
    return { ctx: c.id, topic: c.topic, type: 'pct', text: '<p>' + S.what + ' fell from <b>' + S.from + ' ' + S.unit + '</b> in ' + S.y0 + ' to <b>' + S.to + ' ' + S.unit + '</b> in ' + S.y1 + ' (' + S.source + ').</p>', steps: steps,
      solution: ['(' + newV + ' − ' + oldV + ') ÷ ' + oldV + ' × 100 = <b>' + M.fixed(pc, 1) + '%</b>.', 'Negative: a decrease. Divide by the old value.'],
      given: { from: oldV, to: newV, pc: pc }, figure: { kind: 'pct', S: S } };
  }

  var GEN = { smog: genSmog, inversion: genInv, ph: genPH, reduce: genReduce, pct: genPct };
  var TYPES = ['smog', 'inversion', 'ph', 'reduce', 'pct'];
  M.register('airPollution', {
    TYPES: TYPES, POLL: POLL, TOLERANCE: TOLERANCE, PH_CLEAN: PH_CLEAN,
    smogDay: smogDay, sunAt: sunAt, trafficAt: trafficAt, inversionProfile: inversionProfile, rainPH: rainPH, lakePH: lakePH, clock: clock,
    generate: function(r, c, type){
      var t = type || r.pick((c && c.types) || TYPES);
      if(!GEN[t]) throw new Error('air-pollution: unknown problem type ' + t);
      return GEN[t](r, c || {});
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
