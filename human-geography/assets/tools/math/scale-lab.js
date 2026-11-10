/* Scale lab model: ApHugMath.scaleLab (docs/aphug-architecture.md, "Tools";
   docs/aphug-spec.md sections 3.3 and 6). OWNED BY THIS TOOL ONLY (builder T2):
   no other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/aphug-tool-checks/scale-lab.mjs)
   and the test (scripts/test/aphug-tool-scale-lab.test.mjs) run exactly this code.

   Two meanings of "scale" (the skills-scale lesson's words):
     scale of analysis  the size of the unit each value describes: global (the
                        world), regional (a group of countries), national (one
                        country), local (part of a country: subnational)
     map scale          the ratio between the map and the ground (1:50,000);
                        a large-scale map shows a small area in detail
   The rule the 2025 readers wrote (framework.md section 7, the 38% point):
   the scale of analysis is the scale of the DATA, never the size of the map.

   Every value here is invented (seeded), on real outlines (world, regions)
   or on Country A (invented), and every map says so. No real figure.

     dataset(r, variable?)   one invented data set at four scales:
                             { variable, world, regions[], provinces[], national }
                             (national = the provinces weighted by population, ApHugCalc)
     views(ds)               the four views: { scale, base, spec, unit, says, hides, range }
     ladder()                the map-scale ladder (denominators, km per cm, what a 10 cm map shows)
     generate(r, ctx, type)  a seeded drill for ApHugTools.drill:
       identify   the unit each value describes, then the scale (never the map's size)
       across     one country's provinces: the gap a national figure hides, and
                  which question needs which scale
       chain      an authored link across scales (global cause, local effect)
       limit      a source at the wrong scale for a question, and its limitation
       mapscale   a map distance to ground km (ApHugCalc.mapToGround), larger vs smaller scale */
(function(G){
  'use strict';
  var M = G.ApHugMath;
  if(!M) return;
  function C(){ return G.ApHugCalc; }
  function ev(fn, args){ return C().evaluate({ fn: fn, args: args }); }

  var TYPES = ['identify', 'across', 'chain', 'limit', 'mapscale'];
  var TYPE_LABEL = {
    identify: 'Name the scale of the data',
    across: 'One country, two scales',
    chain: 'Links across scales',
    limit: 'A source at the wrong scale',
    mapscale: 'Map scale: ratios and large vs small'
  };
  var TYPE_TOPIC = { identify: 'scales-of-analysis', across: 'scales-of-analysis', chain: 'scales-of-analysis', limit: 'scales-of-analysis', mapscale: 'skills-scale' };

  /* ------------------------------------------------------------ the scales */
  var SCALES = ['global', 'regional', 'national', 'local'];
  var SCALE_NAME = { global: 'Global', regional: 'Regional', national: 'National', local: 'Local (subnational)' };
  var SCALE_WORD = { global: 'global', regional: 'regional', national: 'national', local: 'local (subnational)' };
  // What one value describes at each scale (the step "each value describes").
  var UNIT = { global: 'the whole world', regional: 'a world region (a group of countries)', national: 'one country', local: 'one province (part of a country)' };
  var UNIT_SHORT = { global: 'the whole world', regional: 'a world region', national: 'one country', local: 'one province' };
  // The area a whole map covers, by base (the slip: naming this as the scale).
  var EXTENT = { world: 'the whole world', region: 'one world region', 'country-a': 'one whole country' };
  var EXTENT_SCALE = { world: 'global', region: 'regional', 'country-a': 'national' };

  var REGIONS = [
    { id: 'north-america', name: 'North America' },
    { id: 'latin-america', name: 'Latin America and the Caribbean' },
    { id: 'europe', name: 'Europe' },
    { id: 'russia-central-asia', name: 'Russia and Central Asia' },
    { id: 'north-africa-sw-asia', name: 'North Africa and Southwest Asia' },
    { id: 'sub-saharan-africa', name: 'Sub-Saharan Africa' },
    { id: 'south-asia', name: 'South Asia' },
    { id: 'east-asia', name: 'East Asia' },
    { id: 'southeast-asia', name: 'Southeast Asia' },
    { id: 'oceania', name: 'Australia and Oceania' }
  ];
  // Region bases a national drill map can use (enough countries to read).
  var REGION_BASES = ['europe', 'latin-america', 'sub-saharan-africa', 'north-africa-sw-asia', 'southeast-asia', 'south-asia'];
  // Country A (figures/base/country-a.json): its eight provinces. The Capital
  // Region is the dense core; the Southern Forest and Northern Hills are the
  // most rural (an invented country for practice).
  var PROVINCES = [
    { id: 'capital', name: 'Capital Region', lo: 62, hi: 88, pop: [30, 46] },
    { id: 'coast', name: 'South Coast', lo: 38, hi: 58, pop: [12, 20] },
    { id: 'central', name: 'Central Valley', lo: 30, hi: 50, pop: [10, 18] },
    { id: 'east', name: 'Eastern Plains', lo: 18, hi: 36, pop: [6, 12] },
    { id: 'northeast', name: 'Lake District', lo: 16, hi: 34, pop: [4, 9] },
    { id: 'west', name: 'Western Uplands', lo: 8, hi: 24, pop: [3, 7] },
    { id: 'north', name: 'Northern Hills', lo: 5, hi: 18, pop: [2, 6] },
    { id: 'south', name: 'Southern Forest', lo: 3, hi: 14, pop: [2, 5] }
  ];
  // Invented variables (benign, with no well-known real values to confuse).
  var VARIABLES = [
    { id: 'walk', name: 'Share of people who walk to work or school', short: 'walk to work or school', need: 'Which province should get new sidewalks first?' },
    { id: 'bike', name: 'Share of people who ride a bicycle each week', short: 'ride a bicycle each week', need: 'Which province should get new bike lanes first?' },
    { id: 'bus', name: 'Share of people who take a bus to work or school', short: 'take a bus to work or school', need: 'Which province should get new bus routes first?' }
  ];
  var CLASSES = ['Under 25%', '25% to 49%', '50% to 74%', '75% or more'];
  function classOf(v){ return Math.max(0, Math.min(3, Math.floor(v / 25))); }
  function pct(v){ return M.fixed(v, 0) + '%'; }
  function varOf(id){ for(var i = 0; i < VARIABLES.length; i++) if(VARIABLES[i].id === id) return VARIABLES[i]; return VARIABLES[0]; }

  /* ------------------------------------------------------------ a data set */
  function provinces(r){
    return PROVINCES.map(function(p){ return { id: p.id, name: p.name, value: r.int(p.lo, p.hi), pop: r.int(p.pop[0], p.pop[1]) / 10 }; });
  }
  // Country A's national value: the provinces weighted by population (ApHugCalc).
  function nationalOf(provs){
    var tot = ev('sum', [provs.map(function(p){ return p.pop; })]);
    var w = ev('sum', [provs.map(function(p){ return ev('mul', [p.value, p.pop]); })]);
    return ev('div', [w, tot]);
  }
  function dataset(r, variable){
    var v = variable ? varOf(variable) : r.pick(VARIABLES), regs, guard = 0;
    do {
      regs = REGIONS.map(function(g){ return { id: g.id, name: g.name, value: r.int(8, 80) }; });
      guard++;
    } while(guard < 50 && (range(regs) < 35 || !regs.some(function(g){ return g.value >= 50; }) || !regs.some(function(g){ return g.value < 25; })));
    var lo = Math.min.apply(null, regs.map(function(g){ return g.value; })), hi = Math.max.apply(null, regs.map(function(g){ return g.value; }));
    var provs = provinces(r);
    return { variable: v.id, name: v.name, short: v.short, need: v.need, world: r.int(lo + 8, hi - 8), regions: regs, provinces: provs, national: nationalOf(provs) };
  }
  function range(list){ var xs = list.map(function(x){ return x.value; }); return Math.max.apply(null, xs) - Math.min.apply(null, xs); }
  function top(list){ return list.slice().sort(function(a, b){ return b.value - a.value; })[0]; }
  function bottom(list){ return list.slice().sort(function(a, b){ return a.value - b.value; })[0]; }

  /* ------------------------------------------------------------ map specs */
  // World features that carry no value on a by-country map (accuracy-risks.md
  // section 4: no value on a disputed place).
  function worldByRegion(base, ds, label){
    var vals = {};
    base.features.forEach(function(f){ var g = ds.regions.filter(function(x){ return x.id === f.r; })[0]; if(g) vals[f.id] = classOf(g.value); });
    return { base: 'world', render: 'choropleth', invented: true, label: label, legendTitle: ds.name + ' (percent), one value per world region', classes: CLASSES, values: vals,
      disputedOk: 'regional data: every place in a world region gets that region\'s shade; it says nothing about who governs it' };
  }
  function byCountry(base, r, center, spread){
    var vals = {};
    base.features.forEach(function(f){ if(f.context || f.disputed) return; vals[f.id] = Math.max(0, Math.min(3, center(f) + r.int(-spread, spread))); });
    return vals;
  }
  function views(ds){
    var nat = M.round(ds.national, 0), provVals = {}, marks = [];
    ds.provinces.forEach(function(p){ provVals[p.id] = classOf(p.value); marks.push({ at: p.id, text: pct(p.value) }); });
    var natVals = {}; ds.provinces.forEach(function(p){ natVals[p.id] = classOf(nat); });
    var tr = top(ds.regions), br = bottom(ds.regions), tp = top(ds.provinces), bp = bottom(ds.provinces);
    return [
      { scale: 'global', base: 'world', unit: UNIT.global,
        spec: { base: 'world', render: 'reference', invented: true, label: 'World map with one value for the whole world: ' + pct(ds.world) + ' (invented data)' },
        value: ds.world, range: 0,
        says: 'One number for the whole world: ' + pct(ds.world) + ' ' + ds.short + '.',
        hides: 'It hides every difference between regions, countries and places: a single number has no pattern to map.' },
      { scale: 'regional', base: 'world', unit: UNIT.regional,
        spec: null, range: range(ds.regions),
        says: 'Highest: ' + tr.name + ' (' + pct(tr.value) + '). Lowest: ' + br.name + ' (' + pct(br.value) + '). A gap of ' + range(ds.regions) + ' points.',
        hides: 'Each region\'s value is shared by all its countries, so the map hides the differences between countries inside a region.' },
      { scale: 'national', base: 'country-a', unit: UNIT.national,
        spec: { base: 'country-a', render: 'choropleth', invented: true, label: 'Country A shaded as one unit: one national value of ' + pct(nat) + ' (invented data)', legendTitle: ds.name + ' (percent), one value for the whole country', classes: CLASSES, values: natVals, marks: [{ at: [300, 205], text: pct(nat) }] },
        value: nat, range: 0,
        says: 'Country A: ' + pct(nat) + '. One number for the whole country (its provinces weighted by population).',
        hides: 'The whole country gets one shade, so the gap between its provinces disappears from view.' },
      { scale: 'local', base: 'country-a', unit: UNIT.local,
        spec: { base: 'country-a', render: 'choropleth', invented: true, label: 'Country A shaded by province: from ' + pct(bp.value) + ' in the ' + bp.name + ' to ' + pct(tp.value) + ' in the ' + tp.name + ' (invented data)', legendTitle: ds.name + ' (percent), one value per province', classes: CLASSES, values: provVals, marks: marks },
        range: range(ds.provinces),
        says: 'Highest: ' + tp.name + ' (' + pct(tp.value) + '). Lowest: ' + bp.name + ' (' + pct(bp.value) + '). A gap of ' + range(ds.provinces) + ' points inside one country.',
        hides: 'Each province is still an average: one province\'s value hides the differences between its towns and neighborhoods.' }
    ];
  }
  function regionalSpec(base, ds){ return worldByRegion(base, ds, 'World map shaded by world region, from ' + pct(bottom(ds.regions).value) + ' to ' + pct(top(ds.regions).value) + ' (invented data)'); }

  /* ------------------------------------------------------------ map scale */
  var LADDER = [
    { denom: 5000, shows: 'a few streets', what: 'every house and path' },
    { denom: 25000, shows: 'a neighborhood', what: 'streets, parks and single buildings' },
    { denom: 100000, shows: 'a city', what: 'main roads, rivers and districts' },
    { denom: 1000000, shows: 'part of a country', what: 'towns, highways and lakes' },
    { denom: 5000000, shows: 'a whole country', what: 'provinces and the largest cities' },
    { denom: 100000000, shows: 'about half of the world', what: 'continents and countries only' }
  ];
  function ladder(){
    return LADDER.map(function(l){ var km = ev('mapToGround', [1, l.denom]); return { denom: l.denom, kmPerCm: km, across: ev('mul', [10, km]), shows: l.shows, what: l.what }; });
  }
  function ratio(d){ return '1:' + grp(d); }
  function grp(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function km(x){ return x >= 1 ? grp(M.round(x, 2)).replace(/(\.\d*?)0+$/, '$1') : M.fmt(x, 3); }

  /* ------------------------------------------------------------ drills */
  function choiceStep(key, label, options, correct, why, practice, o){
    var s = { kind: 'choice', key: key, label: label, options: options, correct: correct, why: why, practice: practice };
    if(o && o.fixed) s.fixed = true;
    if(o && o.hint) s.hint = o.hint;
    return s;
  }
  // A fixed-order scale choice: global, regional, national, local.
  function scaleStep(key, label, right, slip, o){
    o = o || {};
    return choiceStep(key, label, SCALES.map(function(s){ return SCALE_NAME[s]; }), SCALES.indexOf(right), SCALES.map(function(s){
      if(s === right) return o.right || 'Right: ' + (o.unitText || UNIT[right]) + ' is the ' + SCALE_WORD[right] + ' scale.';
      if(slip && s === slip.scale) return slip.why;
      return (o.unitText ? 'This is about ' + o.unitText : 'Each value describes ' + UNIT[right]) + ', which is the ' + SCALE_WORD[right] + ' scale, not the ' + SCALE_WORD[s] + ' scale.';
    }), o.practice || '5.A', { fixed: true, hint: o.hint });
  }

  /* identify: the unit each value describes, then the scale. Six cases. */
  var CASES = [
    { id: 'world-country', base: 'world', data: 'national' },
    { id: 'world-region', base: 'world', data: 'regional' },
    { id: 'world-one', base: 'world', data: 'global' },
    { id: 'region-country', base: 'region', data: 'national' },
    { id: 'a-province', base: 'country-a', data: 'local' },
    { id: 'a-one', base: 'country-a', data: 'national' }
  ];
  function identify(r, ctx, bases){
    var cs = r.pick(ctx.cases ? CASES.filter(function(c){ return ctx.cases.indexOf(c.id) > -1; }) : CASES);
    var ds = dataset(r), v = varOf(ds.variable), baseId = cs.base === 'region' ? r.pick(REGION_BASES) : cs.base, base = bases && bases[baseId];
    var spec, extentText = EXTENT[cs.base], regionName = cs.base === 'region' ? REGIONS.filter(function(g){ return g.id === baseId; })[0].name : '';
    if(cs.base === 'region') extentText = 'one world region (' + regionName + ')';
    if(cs.id === 'world-country'){
      var rc = {}; ds.regions.forEach(function(g){ rc[g.id] = classOf(g.value); });
      spec = { base: 'world', render: 'choropleth', invented: true, label: 'World map with every country shaded by its own value of the ' + v.short + ' share (invented data)', legendTitle: v.name + ' (percent)', classes: CLASSES, values: base ? byCountry(base, r, function(f){ return rc[f.r] != null ? rc[f.r] : 1; }, 1) : {} };
    } else if(cs.id === 'world-region'){
      spec = base ? regionalSpec(base, ds) : null;
      if(spec) spec.legendTitle = v.name + ' (percent)';
    } else if(cs.id === 'world-one'){
      spec = { base: 'world', render: 'reference', invented: true, label: 'World map with one value for the whole world: ' + pct(ds.world) + ' (invented data)' };
    } else if(cs.id === 'region-country'){
      var c0 = r.int(0, 3);
      spec = { base: baseId, render: 'choropleth', invented: true, label: 'Map of ' + regionName + ' with each country shaded by its own value (invented data)', legendTitle: v.name + ' (percent)', classes: CLASSES, values: base ? byCountry(base, r, function(){ return c0; }, 2) : {} };
    } else if(cs.id === 'a-province'){
      var pv = {}, mk = []; ds.provinces.forEach(function(p){ pv[p.id] = classOf(p.value); mk.push({ at: p.id, text: pct(p.value) }); });
      spec = { base: 'country-a', render: 'choropleth', invented: true, label: 'Country A with each of its eight provinces shaded by its own value (invented data)', legendTitle: v.name + ' (percent)', classes: CLASSES, values: pv, marks: mk };
    } else {
      var nat = M.round(ds.national, 0), nv = {}; ds.provinces.forEach(function(p){ nv[p.id] = classOf(nat); });
      spec = { base: 'country-a', render: 'choropleth', invented: true, label: 'Country A shaded as one unit with one value for the whole country, ' + pct(nat) + ' (invented data)', legendTitle: v.name + ' (percent)', classes: CLASSES, values: nv, marks: [{ at: [300, 205], text: pct(nat) }] };
    }
    var data = cs.data, extentScale = EXTENT_SCALE[cs.base];
    var unitOpts = SCALES.map(function(s){ return UNIT[s]; });
    var unitWhy = SCALES.map(function(s){
      if(s === data) return 'Right. ' + (data === 'global' ? 'There is one value, and it describes ' + UNIT.global + '.' : 'Each shaded area is ' + UNIT_SHORT[data] + ', so each value describes ' + UNIT_SHORT[data] + '.');
      if(s === extentScale) return 'That is the area the whole map covers (' + extentText + '). Look at what each shaded area is: ' + UNIT_SHORT[data] + '.';
      return 'Look at the shading and the legend again: each value is for ' + UNIT_SHORT[data] + ', not ' + UNIT_SHORT[s] + '.';
    });
    var slip = extentScale !== data ? { scale: extentScale, why: 'The map shows ' + extentText + ', but the scale of analysis is the scale of the data, not the size of the map. Each value is for ' + UNIT_SHORT[data] + ': the ' + SCALE_WORD[data] + ' scale.' } : null;
    var steps = [
      choiceStep('unit', 'What does each value on this map describe?', unitOpts, SCALES.indexOf(data), unitWhy, '5.A', { fixed: true }),
      scaleStep('scale', 'So what is the scale of analysis of these data?', data, slip, { right: 'Right: data for ' + UNIT_SHORT[data] + ' are at the ' + SCALE_WORD[data] + ' scale' + (slip ? ', even though the map shows ' + extentText + '.' : '.') })
    ];
    var what = data === 'global' ? 'The map gives one value for the whole world: ' + pct(ds.world) + '.' : 'The map shows the ' + v.short + ' share.';
    return {
      type: 'identify', ctx: ctx.id, topic: ctx.topic, case: cs.id, data: data, baseId: baseId, extent: cs.base, map: spec,
      text: '<p><b>Invented data for practice.</b> ' + what + ' Read the legend first: what is one shaded area?</p>',
      steps: steps,
      solution: [
        'The map covers ' + extentText + '.',
        data === 'global' ? 'There is one value, for the whole world.' : 'Each shaded area is ' + UNIT_SHORT[data] + ', so each value describes ' + UNIT_SHORT[data] + '.',
        'The scale of analysis is the scale of the data: ' + SCALE_WORD[data] + '.' + (slip ? ' Not ' + SCALE_WORD[extentScale] + ': that is only the size of the map.' : '')
      ]
    };
  }

  /* across: Country A's provinces and its national figure. */
  var QUESTION_AT = {
    global: 'How has the world total changed since 2000?',
    regional: 'Which world region has the highest share?',
    national: 'How does Country A compare with other countries?',
    local: null
  };
  function across(r, ctx){
    var ds = dataset(r), v = varOf(ds.variable), nat = M.round(ds.national, 0), tp = top(ds.provinces), bp = bottom(ds.provinces), gap = ev('sub', [tp.value, bp.value]);
    var mis = [
      { value: ev('sub', [tp.value, nat]), why: 'That is the gap between the ' + tp.name + ' and the national figure. The question asks for the highest province minus the lowest province.' },
      { value: ev('sub', [nat, bp.value]), why: 'That is the gap between the national figure and the ' + bp.name + '. Use the highest province minus the lowest province.' }
    ];
    var hide = [
      { t: 'The national figure averages every province, so it hides the gap between them.', w: 'Right. One number for the whole country is an average of its provinces (weighted by their populations), so the ' + tp.name + ' and the ' + bp.name + ' both disappear into ' + pct(nat) + '.' },
      { t: 'The national figure leaves out the ' + tp.name + '.', w: 'Every province is counted in the national figure. It is an average, so it hides the ' + tp.name + '\'s high value rather than leaving it out.' },
      { t: 'The national figure is drawn at a smaller map scale.', w: 'Map scale is how much a map shrinks the ground; it does not change a number. The national figure is an average of the provinces.' },
      { t: 'The provinces are at the global scale.', w: 'Provinces are parts of one country: the local (subnational) scale, not the global scale.' }
    ];
    var ask = r.pick(SCALES), qs = {}, qWhy = [];
    SCALES.forEach(function(s){ qs[s] = s === 'local' ? v.need : QUESTION_AT[s]; });
    var qOpts = SCALES.map(function(s){ return qs[s]; });
    SCALES.forEach(function(s){
      qWhy.push(s === ask ? 'Right: this question is about ' + UNIT_SHORT[s] + ', so it needs ' + SCALE_WORD[s] + ' data.' : 'This question is about ' + UNIT_SHORT[s] + ': it needs ' + SCALE_WORD[s] + ' data, not ' + SCALE_WORD[ask] + ' data.');
    });
    var rows = ds.provinces.slice().sort(function(a, b){ return b.value - a.value; });
    return {
      type: 'across', ctx: ctx.id, topic: ctx.topic, ds: ds, national: nat,
      table: { caption: v.name + ' in Country A, by province (invented data for practice)', cols: ['Province', 'Share (%)', 'People (millions)'], rows: rows.map(function(p){ return [p.name, M.fixed(p.value, 0), M.fixed(p.pop, 1)]; }) },
      text: '<p><b>Invented data for practice.</b> Country A reports one national figure: ' + pct(nat) + ' of its people ' + v.short + '. The table gives the same data for each of its eight provinces.</p>',
      steps: [
        { kind: 'num', key: 'gap', label: 'How many percentage points separate the highest province from the lowest?', unit: 'points', d: 0, cell: M.cell(gap, 0, mis, 0.5), practice: '3.D', hint: 'Highest province minus lowest province.' },
        choiceStep('hide', 'Why does the national figure (' + pct(nat) + ') not describe the ' + tp.name + ' (' + pct(tp.value) + ')?', hide.map(function(h){ return h.t; }), 0, hide.map(function(h){ return h.w; }), '5.B'),
        choiceStep('which', 'Which question needs ' + SCALE_WORD[ask] + ' data to answer?', qOpts, SCALES.indexOf(ask), qWhy, '5.C')
      ],
      solution: [
        'The gap: ' + tp.value + ' − ' + bp.value + ' = ' + gap + ' percentage points (the ' + tp.name + ' and the ' + bp.name + ').',
        'The national figure weights each province by its people: ' + pct(nat) + '. It is an average, so it hides the gap.',
        'The question "' + qs[ask] + '" is about ' + UNIT_SHORT[ask] + ', so it needs ' + SCALE_WORD[ask] + ' data.'
      ]
    };
  }

  /* chain: an authored link from one scale to another (data file contexts). */
  function chain(r, ctx){
    var c = ctx.chain;
    var opts = [{ t: c.link, w: 'Right. ' + c.linkWhy }].concat(c.wrong.map(function(x){ return { t: x.text, w: x.why }; }));
    return {
      type: 'chain', ctx: ctx.id, topic: ctx.topic,
      text: '<p>' + c.setup + '</p>',
      steps: [
        scaleStep('from', 'At what scale is the cause, "' + c.cause.text + '"?', c.cause.scale, null, { unitText: c.cause.unit, practice: '5.A' }),
        scaleStep('to', 'At what scale is the effect, "' + c.effect.text + '"?', c.effect.scale, null, { unitText: c.effect.unit, practice: '5.A' }),
        choiceStep('link', 'Which sentence explains how the ' + SCALE_WORD[c.cause.scale] + ' cause leads to the ' + SCALE_WORD[c.effect.scale] + ' effect?', opts.map(function(o){ return o.t; }), 0, opts.map(function(o){ return o.w; }), '5.B')
      ],
      solution: ['The cause, ' + c.cause.text + ', is ' + SCALE_WORD[c.cause.scale] + ': it is about ' + c.cause.unit + '.', 'The effect, ' + c.effect.text + ', is ' + SCALE_WORD[c.effect.scale] + ': it is about ' + c.effect.unit + '.', 'The link, with every step: ' + c.link]
    };
  }

  /* limit: a source at the wrong scale for a question. */
  // cover: how much ground the whole source covers (3 world, 2 several
  // countries, 1 one country, 0 one city).
  var SOURCES = [
    { id: 'world-total', text: 'one number for the whole world from a world survey', scale: 'global', cover: 3, unit: 'the whole world' },
    { id: 'region-table', text: 'a table with one value for each of the ten world regions', scale: 'regional', cover: 3, unit: 'a world region (a group of countries)' },
    { id: 'world-map', text: 'a world map shaded country by country', scale: 'national', cover: 3, unit: 'one country' },
    { id: 'national', text: 'Country A\'s national census total', scale: 'national', cover: 1, unit: 'one country' },
    { id: 'province-map', text: 'a map of Country A shaded province by province', scale: 'local', cover: 1, unit: 'one province (part of a country)' },
    { id: 'one-city', text: 'a household survey from one city in Country A', scale: 'local', cover: 0, unit: 'one city (part of a country)' }
  ];
  /* A source fits a question badly in exactly one way: its units are too big
     (coarse), or it covers too little ground (partial). Pairs with both or
     neither are never asked. */
  function misfit(q, src){
    if(src.scale === q.scale) return null;
    var coarse = SCALES.indexOf(src.scale) < SCALES.indexOf(q.scale), partial = src.cover < q.cover;
    return coarse !== partial ? (coarse ? 'coarse' : 'partial') : null;
  }
  var LIMIT_COARSE = 'Each value in the source covers a bigger area than the question asks about, so it hides the differences inside that area.';
  var LIMIT_FINE = 'The source covers only part of the area the question asks about, so it cannot speak for the whole of it.';
  var LIMIT_MAP = 'The source\'s map scale is too small, so its numbers are less accurate.';
  var LIMIT_NONE = 'The source is at the scale the question needs, so scale is not a limitation.';
  function limit(r, ctx){
    var q = r.pick(ctx.questions.filter(function(x){ return SOURCES.some(function(s){ return misfit(x, s); }); }));
    var src = r.pick(SOURCES.filter(function(s){ return misfit(q, s); }));
    var need = q.scale, have = src.scale, coarse = misfit(q, src) === 'coarse';
    var opts = [
      { t: coarse ? LIMIT_COARSE : LIMIT_FINE, w: 'Right. The question needs ' + SCALE_WORD[need] + ' data and the source is ' + SCALE_WORD[have] + ': ' + (coarse ? 'each of its values is too big a unit, so the differences the question is about are averaged away.' : 'it covers less ground than the question asks about, so it cannot stand for the whole.') },
      { t: coarse ? LIMIT_FINE : LIMIT_COARSE, w: coarse ? 'The source covers the whole area; the problem is that each value is for a unit bigger than the question asks about.' : 'The source\'s units are small enough; the problem is that it covers only part of the area the question asks about.' },
      { t: LIMIT_MAP, w: 'Map scale (the ratio) does not make a number more or less accurate. The limitation is the scale of analysis: the unit each value describes.' },
      { t: LIMIT_NONE, w: coarse ? 'The question needs ' + SCALE_WORD[need] + ' data, but the source is ' + SCALE_WORD[have] + '.' : 'The source\'s units are small enough, but it covers only ' + (src.cover ? 'one country' : 'one city') + ', less ground than the question asks about.' }
    ];
    var srcUnit = src.unit;
    return {
      type: 'limit', ctx: ctx.id, topic: ctx.topic, need: need, have: have, source: src.id,
      text: '<p>A planner asks: <b>' + q.text + '</b></p><p>The only source is ' + src.text + '.</p>',
      steps: [
        scaleStep('need', 'What scale of data does the question need?', need, null, { unitText: q.unit, practice: '5.A' }),
        scaleStep('have', 'What is the scale of analysis of the source?', have, null, { unitText: srcUnit, practice: '5.A' }),
        choiceStep('limit', 'What is the limitation of this source for this question?', opts.map(function(o){ return o.t; }), 0, opts.map(function(o){ return o.w; }), '3.F')
      ],
      solution: ['The question is about ' + q.unit + ': it needs ' + SCALE_WORD[need] + ' data.', 'Each value in the source describes ' + srcUnit + ': ' + SCALE_WORD[have] + ' data.', coarse ? LIMIT_COARSE : LIMIT_FINE]
    };
  }

  /* mapscale: a map distance to ground km, then larger vs smaller scale. */
  var DENOMS = [10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000, 2000000, 5000000];
  function mapscale(r, ctx){
    var d = r.pick(DENOMS), cm = r.pick([2, 3, 4, 5, 6, 8]), ans = ev('mapToGround', [cm, d]);
    var mis = [
      { value: ev('mul', [cm, d]), why: 'That is the ground distance in centimeters. Divide by 100,000 to get kilometers (100 cm in a meter, 1,000 m in a kilometer).' },
      { value: ev('div', [ev('mul', [cm, d]), 100]), why: 'That is the ground distance in meters. Divide by 1,000 more to get kilometers.' },
      { value: ev('div', [ev('mul', [cm, d]), 1000]), why: 'There are 100,000 cm in a kilometer, not 1,000.' },
      { value: ev('div', [d, ev('mul', [cm, 100000])]), why: 'Multiply the map distance by the denominator: every centimeter on the map stands for ' + grp(d) + ' cm on the ground.' }
    ];
    var pair = M.shuffle(r, DENOMS.filter(function(x){ return x !== d; })).slice(0, 2).sort(function(a, b){ return a - b; });
    var flip = r() < 0.5, m1 = flip ? pair[1] : pair[0], m2 = flip ? pair[0] : pair[1];
    var larger = m1 < m2 ? 0 : 1;
    var lw = ['Map 1 (' + ratio(m1) + ')', 'Map 2 (' + ratio(m2) + ')'];
    var why = [0, 1].map(function(i){
      var me = i === 0 ? m1 : m2;
      return i === larger ? 'Right. The smaller denominator (' + grp(me) + ') shrinks the ground less, so the map shows a smaller area in more detail: a larger scale.' :
        'A larger denominator (' + grp(me) + ') means each centimeter stands for more ground: a smaller-scale map that shows a bigger area with less detail.';
    });
    var ask = r() < 0.5 ? 'detail' : 'area';
    var dOpts = lw.slice(), dCorrect = ask === 'detail' ? larger : 1 - larger;
    var dWhy = [0, 1].map(function(i){
      return i === dCorrect ? (ask === 'detail' ? 'Right: the larger-scale map shows a small area in detail, such as the streets of one town.' : 'Right: the smaller-scale map covers more ground, such as a whole country, with less detail.') :
        (ask === 'detail' ? 'This is the smaller-scale map: it covers more ground with less detail, so a town\'s streets would be too small to show.' : 'This is the larger-scale map: it shows a small area in detail, so it covers less ground.');
    });
    return {
      type: 'mapscale', ctx: ctx.id, topic: ctx.topic, denom: d, cm: cm, m1: m1, m2: m2,
      text: '<p>A map has a scale of <b>' + ratio(d) + '</b>: 1 cm on the map stands for ' + grp(d) + ' cm on the ground. On it, two towns are ' + cm + ' cm apart.</p>',
      steps: [
        { kind: 'num', key: 'ground', label: 'How far apart are the towns on the ground, in kilometers?', unit: 'km', cell: M.cell(ans, 1e-3, mis, 1e-6), practice: '3.A', hint: 'Map cm × ' + grp(d) + ' gives ground cm; 100,000 cm make 1 km.' },
        choiceStep('larger', 'Map 1 is ' + ratio(m1) + ' and Map 2 is ' + ratio(m2) + '. Which is the larger-scale map?', lw, larger, why, '3.A', { fixed: true }),
        choiceStep('detail', ask === 'detail' ? 'Which of the two maps could show the streets of one town?' : 'Which of the two maps covers more ground?', dOpts, dCorrect, dWhy, '3.A', { fixed: true })
      ],
      solution: [
        cm + ' cm × ' + grp(d) + ' = ' + grp(cm * d) + ' cm on the ground; ÷ 100,000 = ' + km(ans) + ' km.',
        ratio(Math.min(m1, m2)) + ' has the smaller denominator, so it is the larger-scale map (small area, more detail).',
        'Large scale: small area, much detail. Small scale: large area, little detail. The words describe the ratio, not the area.'
      ]
    };
  }

  function generate(r, ctx, type, bases){
    type = type || (ctx.types && ctx.types.length ? r.pick(ctx.types) : 'identify');
    if(TYPES.indexOf(type) < 0) throw new Error('scaleLab: unknown type ' + type);
    if(ctx.types && ctx.types.indexOf(type) < 0) throw new Error('scaleLab: context ' + ctx.id + ' has no ' + type + ' problems');
    if(type === 'identify') return identify(r, ctx, bases || G.ApHugScaleBases);
    if(type === 'across') return across(r, ctx);
    if(type === 'chain') return chain(r, ctx);
    if(type === 'limit') return limit(r, ctx);
    return mapscale(r, ctx);
  }

  M.register('scaleLab', {
    TYPES: TYPES, TYPE_LABEL: TYPE_LABEL, TYPE_TOPIC: TYPE_TOPIC, SCALES: SCALES, SCALE_NAME: SCALE_NAME, SCALE_WORD: SCALE_WORD,
    UNIT: UNIT, UNIT_SHORT: UNIT_SHORT, REGIONS: REGIONS, REGION_BASES: REGION_BASES, PROVINCES: PROVINCES, VARIABLES: VARIABLES,
    CLASSES: CLASSES, CASES: CASES, SOURCES: SOURCES, misfit: misfit, LIMIT: { coarse: LIMIT_COARSE, fine: LIMIT_FINE, map: LIMIT_MAP, none: LIMIT_NONE },
    classOf: classOf, pct: pct, grp: grp, km: km, ratio: ratio, dataset: dataset, nationalOf: nationalOf, views: views, regionalSpec: regionalSpec,
    ladder: ladder, top: top, bottom: bottom, range: range, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
