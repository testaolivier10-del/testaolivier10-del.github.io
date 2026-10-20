/* Earth and climate model: ApEnvMath.earthClimate (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T3, docs/apenv-briefs/t3.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/earth-climate.mjs)
   and the test (scripts/test/apenv-tool-earth-climate.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/earth-climate.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/earth-climate.js.

   The science (sources in the data file's howItWorks):
     declination(day, tilt)    the sun's overhead latitude: tilt × sin(2π(284 + n)/365)
                               (Cooper 1969; tilt 23.44°)
     noonAngle(lat, decl)      90 − |lat − decl| (the sun's height at noon)
     dayLength(lat, decl)      24/π × acos(−tan φ tan δ), in hours (0 or 24 near the poles)
     insolation(lat, decl)     daily mean sunlight on 1 m² of level ground at the top of the
                               atmosphere, W/m² (solar constant 1361 W/m², Earth-sun distance
                               taken as average)
     band(lat)                 the circulation cell, surface wind and vertical motion at a latitude
     rainShadow(o)             a parcel over a mountain: 10 °C/km while dry, 6 °C/km in cloud,
                               cloud base 125 m per °C of (T − dew point) (Espy), back down at 10 °C/km
     enso(a)                   the Pacific for a Niño 3.4 anomaly a (°C): ≥ +0.5 El Niño,
                               ≤ −0.5 La Niña (NOAA's thresholds)
   Every number a drill shows comes from ApEnvCalc (M.Calc()), never typed.
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, given }
     types: sun (noon sun angle), seasons, cells, shadow (rain shadow), enso */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  function C(){ return M.Calc(); }
  function ev(fn, args){ return C().evaluate({ fn: fn, args: args }); }
  var TILT = 23.44, S0 = 1361, RAD = Math.PI / 180;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MDAY = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

  /* ------------------------------------------------------------ the sun */
  function declination(n, tilt){ return (tilt == null ? TILT : tilt) * Math.sin(2 * Math.PI * (284 + n) / 365); }
  function noonAngle(lat, decl){ return 90 - Math.abs(lat - decl); }
  function hourAngle(lat, decl){
    var x = -Math.tan(lat * RAD) * Math.tan(decl * RAD);
    if(x <= -1) return Math.PI; if(x >= 1) return 0;
    return Math.acos(x);
  }
  function dayLength(lat, decl){ return 24 / Math.PI * hourAngle(lat, decl); }
  function insolation(lat, decl){
    var h0 = hourAngle(lat, decl), p = lat * RAD, d = decl * RAD;
    return Math.max(0, S0 / Math.PI * (h0 * Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.sin(h0)));
  }
  function dateOf(n){
    var m = 11; while(m > 0 && MDAY[m] >= n) m--;
    return { month: m, day: n - MDAY[m], text: MONTHS[m] + ' ' + (n - MDAY[m]) };
  }
  function latText(l){ var a = Math.abs(l); return (a % 1 ? M.fixed(a, 1) : String(a)) + '°' + (l > 0 ? 'N' : l < 0 ? 'S' : ''); }

  /* ------------------------------------------------- circulation cells */
  /* Surface winds and vertical motion (three cells per hemisphere). from: the
     compass direction the wind blows FROM (winds are named for it). */
  function band(lat){
    var a = Math.abs(lat), N = lat >= 0;
    if(a < 30) return { cell: 'Hadley', wind: (N ? 'Northeast' : 'Southeast') + ' trade winds', from: N ? 'NE' : 'SE', toEq: true,
      rises: 0, sinks: 30, edge: a < 5 ? 'rise' : a > 25 ? 'sink' : '' };
    if(a < 60) return { cell: 'Ferrel', wind: 'Westerlies', from: N ? 'SW' : 'NW', toEq: false, rises: 60, sinks: 30, edge: a < 35 ? 'sink' : a > 55 ? 'rise' : '' };
    return { cell: 'Polar', wind: 'Polar easterlies', from: N ? 'NE' : 'SE', toEq: true, rises: 60, sinks: 90, edge: a < 65 ? 'rise' : a > 85 ? 'sink' : '' };
  }
  /* What the air does at a latitude: rising air cools, its water vapor condenses (rain);
     sinking air warms and dries (deserts). */
  function verticalAt(lat){
    var a = Math.abs(lat);
    if(a < 10 || (a > 50 && a < 70)) return 'rise';
    if((a > 20 && a < 40) || a > 80) return 'sink';
    return '';
  }

  /* ------------------------------------------------------- rain shadow */
  var DRY = 10, WET = 6;
  function dewPoint(T, rh){ var a = 17.625, b = 243.04, g = Math.log(rh / 100) + a * T / (b + T); return b * g / (a - g); }
  function relHum(T, Td){ var a = 17.625, b = 243.04; return 100 * Math.exp(a * Td / (b + Td) - a * T / (b + T)); }
  function rainShadow(o){
    var T0 = o.T0 == null ? 25 : o.T0, H = o.H, rh = o.rh == null ? 75 : o.rh;
    var Td = dewPoint(T0, rh), lcl = 0.125 * (T0 - Td);           // km
    var cloud = H > lcl, hc = Math.min(H, lcl);
    var Tc = T0 - DRY * hc, Ttop = Tc - (cloud ? WET * (H - lcl) : 0);
    // Saturated at the top, the dew point is the temperature; unsaturated air
    // carries its dew point down about 2 °C per km (the 125 m per °C rule).
    var TdTop = cloud ? Ttop : Td - 2 * H, Tlee = Ttop + DRY * H, TdLee = TdTop + 2 * H;
    return { T0: T0, rh: rh, Td: Td, lcl: lcl, cloud: cloud, H: H, Tc: Tc, Ttop: Ttop, Tlee: Tlee, rhLee: Math.min(100, relHum(Tlee, TdLee)), warmer: Tlee - T0 };
  }

  /* ------------------------------------------------- El Niño, La Niña */
  function enso(a){
    a = Math.max(-2.5, Math.min(2.5, a));
    var state = a >= 0.5 ? 'nino' : a <= -0.5 ? 'nina' : 'neutral';
    return {
      a: a, state: state, name: state === 'nino' ? 'El Niño' : state === 'nina' ? 'La Niña' : 'Neutral',
      trade: Math.max(0.05, 1 - 0.45 * a),            // trade wind strength, 1 = normal
      upwell: Math.max(0.05, Math.min(1.9, 1 - 0.45 * a)),
      rainX: Math.max(0.1, Math.min(0.62, 0.2 + 0.2 * a)),   // rising air: 0 = west Pacific, 1 = South America
      dW: 165 - 25 * a, dE: Math.max(18, 55 + 45 * a),       // thermocline depth, m (west, east)
      sstE: 24.5 + a, sstW: 29 - 0.25 * a                    // sea surface °C (illustrative)
    };
  }

  /* --------------------------------------------------------- the drills */
  var PL = [
    { name: 'Quito, Ecuador', lat: 0 }, { name: 'Singapore', lat: 1 }, { name: 'Bangkok, Thailand', lat: 14 },
    { name: 'Miami, Florida', lat: 26 }, { name: 'Cairo, Egypt', lat: 30 }, { name: 'Los Angeles, California', lat: 34 },
    { name: 'Denver, Colorado', lat: 40 }, { name: 'Minneapolis, Minnesota', lat: 45 }, { name: 'London, England', lat: 51 },
    { name: 'Anchorage, Alaska', lat: 61 }, { name: 'Sydney, Australia', lat: -34 }, { name: 'Buenos Aires, Argentina', lat: -35 },
    { name: 'Lima, Peru', lat: -12 }, { name: 'Perth, Australia', lat: -32 }, { name: 'Wellington, New Zealand', lat: -41 }
  ];
  var DATES = [
    { id: 'jun', text: 'June solstice (about June 21)', decl: 23.5, where: 'the Tropic of Cancer, 23.5°N' },
    { id: 'dec', text: 'December solstice (about December 21)', decl: -23.5, where: 'the Tropic of Capricorn, 23.5°S' },
    { id: 'eq', text: 'March equinox (about March 20)', decl: 0, where: 'the equator, 0°' }
  ];
  function step(key, label, o){ var s = { key: key, label: label, practice: o.practice || '1.B' }; for(var k in o) if(k !== 'practice') s[k] = o[k]; return s; }
  function choice(key, label, opts, practice){
    // opts[0] is right; the page shuffles.
    return step(key, label, { kind: 'choice', practice: practice || '1.B', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 });
  }
  function n1(x){ return M.fixed(x, 1).replace(/\.0$/, ''); }
  function sgn(x){ return x < 0 ? '(' + n1(x) + ')' : n1(x); }

  function genSun(r, c){
    var pls = PL.filter(function(p){ return !c.places || c.places.indexOf(p.name) > -1; });
    var P = r.pick(pls), D = r.pick(DATES), lat = P.lat, d = D.decl;
    var dist = ev('max', [ev('sub', [lat, d]), ev('sub', [d, lat])]);
    var ang = ev('sub', [90, dist]);
    var same = (lat >= 0) === (d >= 0) || d === 0 || lat === 0;
    var A = Math.abs(lat), Dd = Math.abs(d);
    var degs = same ? (A >= Dd ? n1(A) + ' - ' + n1(Dd) : n1(Dd) + ' - ' + n1(A)) : n1(A) + ' + ' + n1(Dd);
    var setup = d === 0 ? '90 - ' + n1(A) : lat === 0 ? '90 - ' + n1(Dd) : '90 - (' + degs + ')';
    var ms = [];
    if(d !== 0 && lat !== 0){
      var wrongDist = same ? A + Dd : Math.abs(A - Dd);
      ms.push({ expr: same ? '90 - (' + n1(A) + ' + ' + n1(Dd) + ')' : '90 - (' + n1(Math.max(A, Dd)) + ' - ' + n1(Math.min(A, Dd)) + ')',
        why: same ? 'The sun is overhead in the same hemisphere as ' + P.name + ', so subtract the latitudes to get the distance between them.' : 'The sun is overhead in the other hemisphere, so the distance between the two latitudes is their sum.' });
      if(Math.abs(wrongDist - A) > 0.01) ms.push({ expr: '90 - ' + n1(A), why: 'That is the noon sun at an equinox. Count the degrees from ' + latText(lat) + ' to where the sun is overhead (' + latText(d) + ').' });
    }
    var text = '<p>On the ' + D.text + ', the noon sun is directly overhead at ' + D.where + '. ' + P.name + ' is at about ' + latText(lat) + '.</p><p>How high is the sun above the horizon at noon in ' + P.name + '?</p>';
    var hl = ev('round', [dayLength(lat, d), 1]);
    var dl = d === 0 || lat === 0 ? 'eq' : (lat > 0) === (d > 0) ? 'long' : 'short';
    var steps = [
      step('setup', 'Write the setup for the noon sun angle, in degrees.', { kind: 'setup', practice: '6.B', hint: 'Noon sun angle = 90 − (degrees between your latitude and where the sun is overhead).',
        cell: M.setupCell(setup, { mustUse: [n1(A === 0 ? Dd : A)], mistakes: ms }) }),
      step('angle', 'The noon sun angle, with its unit.', { kind: 'unit', practice: '6.C',
        cell: M.unitCell(ang, '°', { units: ['degrees', 'degree', 'deg'], mistakes: [{ value: ev('sub', [90, A]), why: 'That ignores where the sun is overhead today. Use the distance between the two latitudes.' }].filter(function(m){ return Math.abs(m.value - ang) > 0.5; }) }) }),
      choice('day', 'On this date, how long is the day in ' + P.name + '?',
        dl === 'eq' ? [['About 12 hours', 'At an equinox (and always at the equator) day and night are each about 12 hours everywhere, because the circle between day and night cuts every latitude in half.'], ['Longer than 12 hours', 'Days are longer than 12 hours only in the hemisphere tilted toward the sun.'], ['Shorter than 12 hours', 'Days are shorter than 12 hours only in the hemisphere tilted away from the sun.']]
        : dl === 'long' ? [['Longer than 12 hours (about ' + n1(hl) + ' hours)', 'This hemisphere is tilted toward the sun, so most of each latitude circle is in daylight.'], ['About 12 hours', 'Only at the equinoxes, or at the equator, is the day 12 hours long.'], ['Shorter than 12 hours', 'Short days come with the hemisphere tilted away from the sun; here it is tilted toward it.']]
        : [['Shorter than 12 hours (about ' + n1(hl) + ' hours)', 'This hemisphere is tilted away from the sun, so most of each latitude circle is in darkness.'], ['About 12 hours', 'Only at the equinoxes, or at the equator, is the day 12 hours long.'], ['Longer than 12 hours', 'Long days come with the hemisphere tilted toward the sun; here it is tilted away.']], '1.B'),
      choice('spread', 'Compared with sunlight from directly overhead, how does this noon sunlight heat the ground?',
        ang >= 89.5 ? [['The same: the sun is directly overhead, so its light is as concentrated as it gets', 'At a 90° sun angle a beam covers the smallest possible area.'], ['Less: it is spread over a larger area', 'Only a lower sun spreads its beam out; this sun is overhead.'], ['More: the light passes through more atmosphere', 'More atmosphere would weaken the light, and overhead light passes through the least.']]
        : [['Less: the same beam is spread over a larger area of ground', 'A sun ' + n1(ang) + '° above the horizon spreads each beam over 1/sin(' + n1(ang) + '°) = ' + M.fixed(1 / Math.sin(ang * RAD), 2) + ' times the area, and its light also crosses more atmosphere.'], ['More: a lower sun is closer to the ground', 'The sun is about 150 million km away; its angle, not the distance, changes the heating.'], ['The same: sunlight has the same strength everywhere', 'The beam is the same, but tilted ground receives it over a larger area, so each square meter gets less.']], '2.B')
    ];
    var sol = [
      'Degrees between ' + P.name + ' (' + latText(lat) + ') and the overhead sun (' + latText(d) + '): ' + (d === 0 ? n1(A) : lat === 0 ? n1(Dd) : degs.replace(' - ', ' − ') + ' = ' + n1(dist)) + '°.',
      'Noon sun angle = 90° − ' + n1(dist) + '° = <b>' + n1(ang) + '°</b>.',
      dl === 'eq' ? 'Day and night are each about 12 hours.' : 'The day is ' + (dl === 'long' ? 'longer' : 'shorter') + ' than 12 hours (about ' + n1(hl) + ' h): this hemisphere is tilted ' + (dl === 'long' ? 'toward' : 'away from') + ' the sun.',
      ang >= 89.5 ? 'The sun is overhead: its light is as concentrated as possible.' : 'A lower sun spreads the same beam over more ground, so each square meter is heated less.'
    ];
    return { ctx: c.id, topic: c.topic, type: 'sun', text: text, steps: steps, solution: sol, given: { lat: lat, decl: d, place: P.name, dl: dl }, figure: { kind: 'sun', lat: lat, decl: d, angle: ang } };
  }

  function genSeasons(r, c){
    var m = r.pick([{ m: 6, name: 'July', far: true }, { m: 0, name: 'January', far: false }]);
    var P = r.pick(PL.filter(function(p){ return Math.abs(p.lat) >= 26; })), N = P.lat > 0;
    var nSummer = m.m === 6;                       // July: NH tilted toward the sun
    var summerHere = nSummer === N;
    var text = '<p>It is ' + m.name + ' in ' + P.name + ' (' + latText(P.lat) + '). In ' + m.name + ' Earth is ' + (m.far ? 'near its farthest point from the sun (early July)' : 'near its closest point to the sun (early January)') + '.</p>';
    var steps = [
      choice('cause', 'What causes Earth’s seasons?', [
        ['Earth’s axis is tilted 23.5° and keeps pointing the same way as Earth orbits, so each hemisphere takes turns leaning toward the sun', 'The tilt changes the sun angle and the day length through the year. That is the cause.'],
        ['Earth is closer to the sun in summer and farther in winter', 'Earth is closest in early January, during the Northern Hemisphere’s winter, and its distance changes by only about 3%.'],
        ['The sun gives off more energy in summer', 'The sun’s output is nearly constant through the year (it varies about 0.1%).'],
        ['Earth spins faster in summer', 'Earth’s spin is the same all year; a day is about 24 hours in every season.']], '1.A'),
      choice('season', 'What season is it in ' + P.name + '?', summerHere ? [
        ['Summer: this hemisphere is tilted toward the sun', 'In ' + m.name + ' the ' + (N ? 'Northern' : 'Southern') + ' Hemisphere leans toward the sun, whatever the distance.'],
        ['Winter: Earth is ' + (m.far ? 'far from' : 'close to') + ' the sun', 'Distance is not the cause. The tilt toward or away from the sun decides the season.'],
        ['Winter: this hemisphere is tilted away from the sun', 'In ' + m.name + ' it is the ' + (N ? 'Southern' : 'Northern') + ' Hemisphere that leans away.']
      ] : [
        ['Winter: this hemisphere is tilted away from the sun', 'In ' + m.name + ' the ' + (N ? 'Northern' : 'Southern') + ' Hemisphere leans away from the sun, whatever the distance.'],
        ['Summer: Earth is ' + (m.far ? 'far from' : 'close to') + ' the sun', 'Distance is not the cause. The tilt toward or away from the sun decides the season.'],
        ['Summer: this hemisphere is tilted toward the sun', 'In ' + m.name + ' it is the ' + (N ? 'Southern' : 'Northern') + ' Hemisphere that leans toward the sun.']
      ], '1.B'),
      choice('why', 'Why is the ' + (summerHere ? 'summer' : 'winter') + ' ' + (summerHere ? 'warmer' : 'colder') + ' here?', summerHere ? [
        ['The noon sun is higher, so sunlight is more concentrated, and days are longer than 12 hours', 'Both effects add more energy to each square meter of ground each day.'],
        ['The ground is closer to the sun', 'A few thousand kilometers of tilt is nothing next to 150 million km. The angle matters, not the distance.'],
        ['There are more hours of darkness to store heat', 'Summer days are longer, not shorter.']
      ] : [
        ['The noon sun is lower, so sunlight is spread over more ground, and days are shorter than 12 hours', 'Both effects give each square meter of ground less energy each day.'],
        ['The ground is farther from the sun', 'A few thousand kilometers of tilt is nothing next to 150 million km. The angle matters, not the distance.'],
        ['The sun gives off less energy in winter', 'The sun’s output is nearly constant; the angle and day length change.']
      ], '1.B')
    ];
    return { ctx: c.id, topic: c.topic, type: 'seasons', text: text, steps: steps,
      solution: ['Seasons come from the 23.5° tilt of Earth’s axis, which keeps pointing the same way through the orbit.', 'In ' + m.name + ' the ' + (nSummer ? 'Northern' : 'Southern') + ' Hemisphere leans toward the sun, so ' + P.name + ' has ' + (summerHere ? 'summer' : 'winter') + '.', 'Earth is ' + (m.far ? 'farthest from' : 'closest to') + ' the sun in early ' + m.name + ': distance is not what makes seasons.'],
      given: { place: P.name, lat: P.lat, month: m.m, summer: summerHere }, figure: { kind: 'seasons', month: m.m } };
  }

  var BANDS = [
    { lat: 5, where: 'over the Amazon rainforest near the equator' }, { lat: -3, where: 'over the Congo Basin near the equator' },
    { lat: 15, where: 'from a ship in the Caribbean Sea' }, { lat: -15, where: 'from a ship in the South Pacific' },
    { lat: 30, where: 'over the Sahara' }, { lat: -28, where: 'over the Kalahari' },
    { lat: 45, where: 'over Oregon' }, { lat: -45, where: 'from a ship in the Southern Ocean' },
    { lat: 62, where: 'over southern Alaska' }, { lat: 75, where: 'over northern Greenland' }
  ];
  function genCells(r, c){
    var B = r.pick(BANDS), lat = B.lat, b = band(lat), v = verticalAt(lat), N = lat >= 0, A = Math.abs(lat);
    var steps = [];
    if(v){
      steps.push(choice('air', 'At about ' + latText(lat) + ', what does the air do?', v === 'rise' ? [
        ['It rises: surface winds meet and warm, moist air is pushed up', A < 10 ? 'Near the equator the strongest sunlight heats the air, and the trade winds of both hemispheres meet, so air rises.' : 'Near 60° the cold polar easterlies meet the milder westerlies, and the warmer air is pushed up.'],
        ['It sinks: cool, dry air comes down from high up', 'Air sinks near 30° and at the poles, not here.'],
        ['It stays still, so there is no weather', 'Air is always moving in the circulation cells.']
      ] : [
        ['It sinks: air that lost its water higher up comes down and warms', A > 80 ? 'Cold, dense air sinks over the poles.' : 'Air that rose at the equator and rained out flows poleward aloft and sinks near 30°.'],
        ['It rises: surface winds meet and push air up', 'Air rises near the equator and near 60°, not here.'],
        ['It stays still, so there is no weather', 'Air is always moving in the circulation cells.']
      ], '1.B'));
      steps.push(choice('climate', 'So the climate here is mostly', v === 'rise' ? [
        ['Wet: rising air cools, and its water vapor condenses into clouds and rain', 'Cooling air holds less water vapor, so it rains.'],
        ['Dry: rising air warms and holds more water', 'Rising air expands and cools; it does not warm.'],
        ['Dry: the wind blows the clouds away', 'Rising air makes clouds here; that is why these belts are wet.']
      ] : [
        ['Dry: sinking air is compressed and warms, so clouds evaporate', 'That is why most large deserts sit near 30°N and 30°S, and why the poles are cold deserts.'],
        ['Wet: sinking air brings rain down', 'Rain needs rising, cooling air. Sinking air warms and dries.'],
        ['Wet: the ocean is close by', 'Nearby water helps only where air rises and cools.']
      ], '1.C'));
    }
    var wrongWind = b.cell === 'Ferrel' ? (N ? 'Northeast trade winds' : 'Southeast trade winds') : 'Westerlies';
    steps.push(choice('wind', 'Which surface wind blows at about ' + latText(lat) + '?', [
      [b.wind + ', from the ' + ({ NE: 'northeast', SE: 'southeast', SW: 'southwest', NW: 'northwest' })[b.from], b.cell === 'Hadley' ? 'Surface air flows back toward the equator and is turned to the ' + (N ? 'right' : 'left') + ' by Earth’s rotation, so it comes from the ' + (N ? 'northeast' : 'southeast') + '.' : b.cell === 'Ferrel' ? 'Surface air flows toward the pole and is turned to the ' + (N ? 'right' : 'left') + ', so it comes from the west.' : 'Cold air flows away from the pole and is turned to the ' + (N ? 'right' : 'left') + ', so it comes from the east.'],
      [wrongWind, wrongWind + ' blow ' + (b.cell === 'Ferrel' ? 'between the equator and 30°' : 'between 30° and 60°') + '.'],
      [b.cell === 'Hadley' ? (N ? 'Northwest' : 'Southwest') + ' winds, turned left by Earth’s rotation' : 'Winds from due ' + (b.toEq ? (N ? 'north' : 'south') : (N ? 'south' : 'north')) + ', not turned at all', b.cell === 'Hadley' ? 'Earth’s rotation turns winds to the right in the Northern Hemisphere and to the left in the Southern (the Coriolis effect).' : 'Earth’s rotation turns moving air (the Coriolis effect), so the winds blow at an angle.']
    ], '2.B'));
    steps.push(choice('cell', 'Which circulation cell is this latitude in?', [
      [b.cell + ' cell', b.cell === 'Hadley' ? 'The Hadley cell runs from the equator to about 30°.' : b.cell === 'Ferrel' ? 'The Ferrel cell runs from about 30° to 60°.' : 'The polar cell runs from about 60° to the pole.'],
      [(b.cell === 'Hadley' ? 'Ferrel' : 'Hadley') + ' cell', (b.cell === 'Hadley' ? 'The Ferrel cell runs from 30° to 60°.' : 'The Hadley cell runs from the equator to 30°.')],
      [(b.cell === 'Polar' ? 'Ferrel' : 'Polar') + ' cell', (b.cell === 'Polar' ? 'The Ferrel cell runs from 30° to 60°.' : 'The polar cell runs from 60° to the pole.')]
    ], '2.A'));
    return { ctx: c.id, topic: c.topic, type: 'cells', text: '<p>A weather balloon is launched ' + B.where + ' (about ' + latText(lat) + ').</p>', steps: steps,
      solution: [latText(lat) + ' is in the ' + b.cell + ' cell.', v ? 'Air ' + (v === 'rise' ? 'rises here, cools and drops its water: a wet belt.' : 'sinks here, warms and dries: a dry belt.') : 'Air moves along the surface here, between the rising and sinking edges of the cell.', 'Surface wind: ' + b.wind.toLowerCase() + ' (named for where they come from), bent by Earth’s rotation.'],
      given: { lat: lat, cell: b.cell, vertical: v, wind: b.wind }, figure: { kind: 'cells', lat: lat } };
  }

  function genShadow(r, c){
    var T0 = r.pick([20, 22, 24, 25, 26, 28, 30]), hc = r.pick([0.5, 1, 1.5]), H = r.pick([2, 2.5, 3, 3.5, 4].filter(function(h){ return h > hc + 0.4; }));
    var top = ev('sub', [T0, ev('add', [ev('mul', [10, hc]), ev('mul', [6, ev('sub', [H, hc])])])]);
    var lee = ev('add', [top, ev('mul', [10, H])]);
    var nm = r.pick(c.ranges || [{ range: 'the Sierra Nevada', wet: 'west', dry: 'Nevada’s Great Basin' }]);
    var text = '<p>Moist ocean air at ' + T0 + ' °C blows up the ' + nm.wet + ' side of ' + nm.range + ', a ' + n1(H) + ' km high range. Clouds form at ' + n1(hc) + ' km.</p>' +
      '<p>Rising air cools about <b>10 °C per km</b> until clouds form, then about <b>6 °C per km</b> in the cloud. Sinking air warms <b>10 °C per km</b>.</p>';
    var s1 = n1(T0) + ' - 10 * ' + n1(hc) + ' - 6 * (' + n1(H) + ' - ' + n1(hc) + ')';
    var s2 = n1(top) + ' + 10 * ' + n1(H);
    var steps = [
      step('setup', 'Write the setup for the temperature at the summit, in °C.', { kind: 'setup', practice: '6.B', hint: 'Cool 10 °C per km up to the cloud base, then 6 °C per km to the top.',
        cell: M.setupCell(s1, { mustUse: [n1(T0), n1(H)], mistakes: [
          { expr: n1(T0) + ' - 10 * ' + n1(H), why: 'Above the cloud base the air cools only about 6 °C per km: condensing water releases heat.' },
          { expr: n1(T0) + ' - 6 * ' + n1(H), why: 'Below the cloud base the air is dry and cools 10 °C per km. Use 6 °C per km only inside the cloud.' }] }) }),
      step('top', 'The temperature at the summit, with its unit.', { kind: 'unit', practice: '6.C', cell: M.unitCell(top, '°C', { units: ['C', 'degrees C', 'degrees Celsius', 'celsius', 'deg C'] }) }),
      step('setup2', 'The air then sinks to sea level on the ' + (nm.wet === 'west' ? 'east' : 'west') + ' side. Write the setup for its temperature there.', { kind: 'setup', practice: '6.B',
        cell: M.setupCell(s2, { mustUse: [n1(H)], mistakes: [{ expr: n1(top) + ' + 6 * ' + n1(H), why: 'The air lost its water as rain on the way up, so it sinks as dry air and warms 10 °C per km.' }] }) }),
      step('lee', 'The temperature at sea level on the far side, with its unit.', { kind: 'unit', practice: '6.C', cell: M.unitCell(lee, '°C', { units: ['C', 'degrees C', 'degrees Celsius', 'celsius', 'deg C'], mistakes: [{ value: T0, why: 'The air does not return to its starting temperature: it lost water (and gained heat) in the cloud.' }] }) }),
      choice('desert', 'Why is ' + nm.dry + ' a desert?', [
        ['The air dropped its water as rain on the ' + nm.wet + ' side, then sank, warmed and dried: a rain shadow', 'Warm, dry sinking air on the far side gives a rain shadow desert.'],
        ['The mountains block the sunlight', 'Mountains block moisture, not sunlight.'],
        ['The air is colder there, so it cannot rain', 'The air is ' + n1(lee - T0) + ' °C warmer on the far side, and warm air that is sinking makes no clouds.']
      ], '1.C')
    ];
    return { ctx: c.id, topic: c.topic, type: 'shadow', text: text, steps: steps,
      solution: ['Up to the cloud base: ' + n1(T0) + ' − 10 × ' + n1(hc) + ' = ' + n1(T0 - 10 * hc) + ' °C.', 'In the cloud to the top: − 6 × (' + n1(H) + ' − ' + n1(hc) + ') gives <b>' + n1(top) + ' °C</b> at the summit.', 'Down the far side, dry: ' + n1(top) + ' + 10 × ' + n1(H) + ' = <b>' + n1(lee) + ' °C</b>, ' + n1(lee - T0) + ' °C warmer than it started.', 'Its water fell on the ' + nm.wet + ' side, so the far side is a rain shadow.'],
      given: { T0: T0, hc: hc, H: H, top: top, lee: lee }, figure: { kind: 'shadow', T0: T0, hc: hc, H: H } };
  }

  function genEnso(r, c){
    var kind = r.pick(['nino', 'nina', 'neutral', 'nino', 'nina']), vals, mean;
    for(var g = 0; g < 50; g++){
      var base = kind === 'nino' ? r.pick([0.8, 1.0, 1.2, 1.5, 1.8]) : kind === 'nina' ? -r.pick([0.8, 1.0, 1.2, 1.4]) : r.pick([-0.2, 0, 0.1, 0.2]);
      vals = [0, 1, 2].map(function(){ return M.round(base + (r.int(-3, 3)) / 10, 1); });
      mean = ev('div', [ev('add', vals), 3]);
      var st = mean >= 0.5 ? 'nino' : mean <= -0.5 ? 'nina' : 'neutral';
      if(st === kind && Math.abs(Math.abs(mean) - 0.5) > 0.1) break;
    }
    var mo = r.pick([['October', 'November', 'December'], ['November', 'December', 'January'], ['December', 'January', 'February']]);
    var setup = '(' + vals.map(function(v, i){ return i ? (v < 0 ? '- ' + n1(-v) : '+ ' + n1(v)) : n1(v); }).join(' ') + ') / 3';
    var text = '<p>NOAA watches the sea surface temperature in the central and eastern equatorial Pacific (the Niño 3.4 region). The table gives how far each month was from normal.</p>' +
      '<table class="ec-tbl"><caption>Niño 3.4 sea surface temperature anomaly (invented data for practice)</caption><thead><tr>' + mo.map(function(m){ return '<th scope="col">' + m + '</th>'; }).join('') + '</tr></thead><tbody><tr>' + vals.map(function(v){ return '<td>' + (v > 0 ? '+' : v < 0 ? '−' : '') + M.fixed(Math.abs(v), 1) + ' °C</td>'; }).join('') + '</tr></tbody></table>';
    var name = kind === 'nino' ? 'El Niño' : kind === 'nina' ? 'La Niña' : 'neutral';
    var bare = ev('add', [vals[0], vals[1], ev('div', [vals[2], 3])]);
    var steps = [
      step('setup', 'Write the setup for the 3-month average anomaly.', { kind: 'setup', practice: '6.B', cell: M.setupCell(setup, { mustUse: vals.map(function(v){ return n1(Math.abs(v)); }), parens: false,
        mistakes: Math.abs(bare - mean) > 0.01 ? [{ expr: vals.map(function(v, i){ return i ? (v < 0 ? '- ' + n1(-v) : '+ ' + n1(v)) : n1(v); }).join(' ') + ' / 3', why: 'Add all three first, in brackets, then divide: without brackets only the last month is divided by 3.' }] : [] }) }),
      step('mean', 'The average anomaly (°C), to 2 decimal places.', { kind: 'num', practice: '6.C', d: 2, cell: M.cell(mean, 0.005, [], 0.006) }),
      choice('state', 'What are conditions in the Pacific?', [
        [kind === 'nino' ? 'El Niño: the average is +0.5 °C or more' : kind === 'nina' ? 'La Niña: the average is −0.5 °C or less' : 'Neutral: the average is between −0.5 °C and +0.5 °C', 'NOAA calls it El Niño when the 3-month average is +0.5 °C or warmer, and La Niña at −0.5 °C or cooler.'],
        [kind === 'nino' ? 'La Niña: the water is warmer than normal' : 'El Niño: the water is ' + (kind === 'nina' ? 'cooler' : 'near') + ' normal', 'El Niño means warmer than normal water in the east Pacific; La Niña means cooler.'],
        [kind === 'neutral' ? 'La Niña: one month was below normal' : 'Neutral: one month alone is not enough', kind === 'neutral' ? 'The 3-month average decides, not one month.' : 'The 3-month average is past the ±0.5 °C threshold.']
      ], '5.C')
    ];
    if(kind !== 'neutral') steps.push(choice('effect', 'Which change goes with ' + name + '?', kind === 'nino' ? [
      ['Trade winds weaken, upwelling off Peru slows, and the anchovy catch falls', 'Less cold, nutrient-rich water rises off South America, so plankton and fish decline; Peru gets heavy rain while Indonesia and Australia get drought.'],
      ['Trade winds strengthen and push more warm water west', 'That is La Niña.'],
      ['More cold water upwells off Peru, so fishing improves', 'Upwelling weakens in El Niño; it is La Niña that brings more.'],
      ['Indonesia and Australia get heavier rain than normal', 'In El Niño the rising, rainy air moves east toward the central Pacific, so Indonesia and Australia tend to be dry.']
    ] : [
      ['Trade winds strengthen, more cold water upwells off Peru, and Indonesia and Australia get heavy rain', 'Strong trade winds pile warm water in the west, where the air rises and rains.'],
      ['Trade winds weaken and warm water spreads east', 'That is El Niño.'],
      ['Upwelling off Peru stops and fish catches fall', 'That happens in El Niño; La Niña brings more upwelling.'],
      ['The southern United States usually gets a wetter winter', 'La Niña usually brings a drier winter to the southern United States; El Niño a wetter one.']
    ], '1.C'));
    return { ctx: c.id, topic: c.topic, type: 'enso', text: text, steps: steps,
      solution: ['Average: ' + setup.replace(/ - /g, ' − ').replace('/', '÷') + ' = <b>' + M.fixed(mean, 2) + ' °C</b>.', 'Threshold: +0.5 °C or more is El Niño, −0.5 °C or less is La Niña, so this is <b>' + name + '</b>.', kind === 'nino' ? 'El Niño: weak trade winds, warm water spreads east, upwelling off Peru weakens.' : kind === 'nina' ? 'La Niña: strong trade winds, cold upwelling off Peru, warm water and rain in the west Pacific.' : 'Neutral: normal trade winds and upwelling.'],
      given: { vals: vals, mean: mean, state: kind }, figure: { kind: 'enso', a: mean } };
  }

  var GEN = { sun: genSun, seasons: genSeasons, cells: genCells, shadow: genShadow, enso: genEnso };
  var TYPES = ['sun', 'seasons', 'cells', 'shadow', 'enso'];
  M.register('earthClimate', {
    TYPES: TYPES, TILT: TILT, S0: S0, MONTHS: MONTHS, MDAY: MDAY, DRY: DRY, WET: WET, PLACES: PL,
    declination: declination, noonAngle: noonAngle, dayLength: dayLength, insolation: insolation, dateOf: dateOf, latText: latText,
    band: band, verticalAt: verticalAt, dewPoint: dewPoint, relHum: relHum, rainShadow: rainShadow, enso: enso,
    generate: function(r, c, type){
      var t = type || r.pick((c && c.types) || TYPES);
      if(!GEN[t]) throw new Error('earth-climate: unknown problem type ' + t);
      return GEN[t](r, c || {});
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
