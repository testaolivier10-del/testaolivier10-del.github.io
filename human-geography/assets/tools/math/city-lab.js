/* City lab model: ApHugMath.cityLab (docs/aphug-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/aphug-briefs/t4.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/aphug-tool-checks/city-lab.mjs) and the
   test (scripts/test/aphug-tool-city-lab.test.mjs) run exactly this code.

   What it knows (every number invented for practice, chosen to work by hand):
     FARM, TOWN  bid-rent lines, bid = A - a x distance (per hectare a year,
                 distance in km from the market or the city center). The
                 land goes to the highest bid at each distance (bid-rent
                 theory), so the lines' upper edge gives von Thunen's rings
                 (FARM: dairy and market gardens, forest, grain, ranching) and
                 the city's land-use bands (TOWN: commerce, industry, homes).
     rings(uses, o) -> [{ id, from, to }] the winner at every distance, with
                 o.transport (x the slopes), o.fridge (dairy's slope halved),
                 o.price (x dairy's A)
     CITY        the seven city models the CED names (6.5): concentric zone,
                 sector, multiple nuclei, galactic city, and the Latin
                 American, Southeast Asian and African models (their authors
                 are not named, spec decision 8), each with its numbered zones,
                 the clues that identify it and one limit
     GOODS       goods by order (low order: small range and threshold; high
                 order: large) for central place theory
   generate(r, ctx, type) -> one drill problem for ApHugTools.drill:
     rings     place von Thunen's rings (a model item), then a change to the model
     bidrent   two bid-rent lines: each bid at a distance (ApHugCalc), then which
               use gets the land there
     models    a city described by its clues: which model, then its limit (the
               concentric zone model also as a model item)
     central   range and threshold: people within range (ApHugCalc), whether the
               store can open, then the good with the largest range
     ranksize  the rank-size rule (ApHugCalc rankSize), then rank-size or a
               primate city */
(function(root){
  'use strict';
  var M = root.ApHugMath;
  if(!M) return;
  function Calc(){ return root.ApHugCalc; }

  /* ------------------------------------------------------------ bid rent */
  var FARM = [
    { id: 'dairy', name: 'Dairy and market gardens', short: 'Dairy, vegetables', A: 400, a: 40, why: 'Milk and vegetables spoil fast and earn a lot per hectare, so they pay most to be close to market.' },
    { id: 'forest', name: 'Forest (wood and fuel)', short: 'Forest', A: 300, a: 15, why: 'Wood was heavy and costly to haul by cart, so in von Thünen\'s model it grows near the town.' },
    { id: 'grain', name: 'Grain and field crops', short: 'Grain', A: 180, a: 5, why: 'Grain keeps well and is lighter for its value, so it can be grown farther out.' },
    { id: 'ranch', name: 'Ranching and livestock', short: 'Ranching', A: 100, a: 2.5, why: 'Animals walk themselves to market and need much land, so ranching takes the cheapest land farthest out.' }
  ];
  var TOWN = [
    { id: 'retail', name: 'Shops and offices', short: 'Shops, offices', A: 1000, a: 200, why: 'Shops and offices gain most from being where the most people pass, so they bid most for the center.' },
    { id: 'industry', name: 'Industry and warehouses', short: 'Industry', A: 700, a: 100, why: 'Industry needs access and space; it bids less than shops at the center but more than homes just outside it.' },
    { id: 'homes', name: 'Homes', short: 'Homes', A: 300, a: 20, why: 'Homes need space more than access, so they win the cheaper land farther out.' }
  ];
  function bid(u, d, o){
    o = o || {};
    var A = u.A * (u.id === 'dairy' && o.price ? o.price : 1), a = u.a * (o.transport || 1) * (u.id === 'dairy' && o.fridge ? 0.5 : 1);
    return A - a * d;
  }
  // The winner at each distance, scanned in steps of 0.05 km (each band's limits to 0.05 km).
  function rings(uses, o){
    var out = [], step = 0.05, d = 0, maxD = 0;
    uses.forEach(function(u){ maxD = Math.max(maxD, bid(u, 0, o) / (u.a * (o && o.transport || 1) * (u.id === 'dairy' && o && o.fridge ? 0.5 : 1))); });
    for(; d <= maxD + 1e-9; d = Math.round((d + step) * 100) / 100){
      var best = null, bv = 0;
      uses.forEach(function(u){ var b = bid(u, d, o); if(b > bv + 1e-9){ bv = b; best = u.id; } });
      if(!best) break;
      if(!out.length || out[out.length - 1].id !== best) out.push({ id: best, from: d, to: d });
      out[out.length - 1].to = d;
    }
    return out;
  }
  function cross(u, v){ return (u.A - v.A) / (u.a - v.a); }
  function useBy(list, id){ return list.filter(function(u){ return u.id === id; })[0]; }

  /* --------------------------------------------------------- city models */
  var CITY = {
    concentric: { name: 'Concentric zone model', who: 'Burgess', full: 'Concentric zone model (Burgess)', layout: 'rings',
      zones: ['Central business district (CBD)', 'Zone of transition: factories, old housing', 'Working-class homes', 'Middle-class homes', 'Commuter zone'],
      clues: 'rings around one downtown: factories and old housing just outside it, then homes that get wealthier with every ring outward, then commuters at the edge',
      limit: 'It was built on one city (Chicago in the 1920s), before most people had cars, and ignores roads and rail lines that pull growth outward in wedges.',
      based: 'Chicago in the 1920s' },
    sector: { name: 'Sector model', who: 'Hoyt', full: 'Sector model (Hoyt)', layout: 'sectors',
      zones: ['Central business district (CBD)', 'Wholesale and light manufacturing', 'Low-income homes', 'Middle-income homes', 'High-income homes'],
      clues: 'wedges that run out from downtown along rail lines and roads: factories along one railway with low-income homes beside them, and one wedge of wealthy homes that keeps growing outward',
      limit: 'It is still centered on one downtown, and it does not explain cities with several centers or the growth of edge cities.',
      based: 'rent data from US cities in the 1930s' },
    nuclei: { name: 'Multiple nuclei model', who: 'Harris and Ullman', full: 'Multiple nuclei model (Harris and Ullman)', layout: 'free',
      zones: ['Central business district (CBD)', 'Wholesale and light manufacturing', 'Low-income homes', 'Middle-income homes', 'High-income homes', 'Heavy manufacturing', 'Outlying business district', 'Residential suburb', 'Industrial suburb'],
      clues: 'several separate centers, such as an airport with offices, a university district and a port with heavy industry, each drawing related land uses around it',
      limit: 'It shows that a city has several centers but does not predict where new centers will form or how big they grow.',
      based: 'US cities in the 1940s, as cars spread' },
    galactic: { name: 'Galactic city model', who: '', full: 'Galactic city model', layout: 'free',
      zones: ['Old central city and CBD', 'Ring road (beltway)', 'Edge cities at highway junctions', 'Suburban homes', 'Airport and business parks'],
      clues: 'an old downtown inside a highway ring road, with edge cities of offices and malls where highways meet the ring, and suburbs spread between them',
      limit: 'It describes car-based metropolitan areas in the United States and fits cities with strong public transit or little highway building less well.',
      based: 'US metropolitan areas after 1960' },
    latin: { name: 'Latin American city model', who: '', full: 'Latin American city model', layout: 'free',
      zones: ['CBD and market', 'Commercial spine with wealthy homes', 'Zone of maturity', 'Zone of in situ accretion', 'Peripheral squatter settlements', 'Disamenity sector', 'Industrial park'],
      clues: 'a strong downtown with a wide avenue running out of it lined by shops and wealthy homes, rings of homes that get poorer farther out, and informal settlements on the edge',
      limit: 'Many Latin American cities have grown edge cities, gated suburbs and new transit, so the rings blur; it is a general pattern, not the plan of one city.',
      based: 'cities in Latin America' },
    seasian: { name: 'Southeast Asian city model', who: '', full: 'Southeast Asian city model', layout: 'free',
      zones: ['Port zone', 'Western commercial zone', 'Immigrant merchant commercial zone', 'Government zone', 'Mixed land use', 'Middle-income suburbs', 'Squatter areas', 'Market gardening and industrial estates'],
      clues: 'the old colonial port as the focus, with no single strong downtown but separate commercial zones near it, and mixed land uses with farms and industrial estates on the edge',
      limit: 'It rests on cities that grew as colonial ports; inland capitals and fast-growing cities since then do not all fit it.',
      based: 'colonial port cities of Southeast Asia' },
    african: { name: 'African city model', who: '', full: 'African city model', layout: 'free',
      zones: ['Colonial CBD', 'Traditional CBD', 'Market zone', 'Ethnic and mixed neighborhoods', 'Mining and manufacturing zone', 'Informal satellite townships'],
      clues: 'three centers: a colonial downtown of high-rises, a traditional downtown, and an open-air market zone, with ethnic neighborhoods around them and informal townships on the edge',
      limit: 'Africa\'s cities differ widely in history and size; cities that were never colonial capitals or that have grown fast since independence fit it less well.',
      based: 'cities across Sub-Saharan Africa' }
  };
  var CITY_IDS = Object.keys(CITY);
  // A model name mid-sentence: lower case, except the place words (Latin American, Southeast Asian, African).
  function lcModel(n){ return /^(Latin|Southeast|African)/.test(n) ? n : n.charAt(0).toLowerCase() + n.slice(1); }
  var CITY_SLIP = {
    concentric: 'The concentric zone model has rings around one downtown, with income rising outward.',
    sector: 'The sector model has wedges along transport routes from one downtown.',
    nuclei: 'The multiple nuclei model has several separate centers.',
    galactic: 'The galactic city model has edge cities at highway junctions on a ring road.',
    latin: 'The Latin American city model has a commercial spine with wealthy homes, and poorer rings outward to squatter settlements.',
    seasian: 'The Southeast Asian city model centers on the old port, with no single strong downtown.',
    african: 'The African city model has three centers: colonial, traditional and a market zone.'
  };

  /* ------------------------------------------------------ central places */
  var GOODS = [
    { id: 'bread', name: 'A bakery', order: 'low', range: 2, threshold: 1000 },
    { id: 'gas', name: 'A gas station', order: 'low', range: 5, threshold: 2000 },
    { id: 'clothes', name: 'A clothing store', order: 'middle', range: 20, threshold: 30000 },
    { id: 'cars', name: 'A car dealership', order: 'high', range: 50, threshold: 100000 },
    { id: 'heart', name: 'A heart surgery center', order: 'high', range: 150, threshold: 1000000 }
  ];
  var TOWNS = ['Arden', 'Belmont', 'Corvale', 'Dunmore', 'Eastby', 'Fenwick', 'Garrow', 'Holmfield'];

  /* ------------------------------------------------------------ helpers */
  function opt(t, ok, why){ return { t: t, ok: ok, why: why }; }
  function choice(key, label, opts, practice, level, fixed){
    var c = -1; opts.forEach(function(o, i){ if(o.ok) c = i; });
    var s = { key: key, kind: 'choice', label: label, options: opts.map(function(o){ return o.t; }), why: opts.map(function(o){ return (o.ok ? 'Yes. ' : 'Not this one. ') + o.why; }), correct: c, practice: practice || '1.A', level: level || 'apply' };
    if(fixed) s.fixed = true;
    return s;
  }
  function shuffled(r, list){ return M.shuffle(r, list.slice()); }
  function fmtN(n){ var s = String(Math.round(n * 100) / 100); var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return p.join('.'); }
  function bidRecipe(u, d){ return { fn: 'sub', args: [u.A, { fn: 'mul', args: [u.a, d] }] }; }

  /* ------------------------------------------------------------ types */
  function vtModel(){
    return { layout: 'rings', title: 'Von Thünen\'s rings around one market town', center: 'Market', unit: 'ring',
      slots: FARM.map(function(u, i){ return { id: 'r' + (i + 1) }; }),
      pieces: FARM.map(function(u){ return { id: u.id, text: u.name }; }).concat([{ id: 'factory', text: 'Factories' }]),
      key: { r1: 'dairy', r2: 'forest', r3: 'grain', r4: 'ranch' },
      slips: [{ piece: 'grain', slot: 'r2', why: 'In von Thünen\'s model the forest ring comes second: wood was heavy and costly to haul, so it grew close to town, and grain (lighter for its value) went farther out.' },
        { piece: 'ranch', slot: 'r1', why: 'Ranching needs the most land and its animals walk to market, so it takes the cheapest land, farthest out.' },
        { piece: 'factory', slot: 'r1', why: 'Von Thünen\'s model is about farm land use around a market town; factories are not part of it.' }] };
  }
  var CHANGES = [
    { id: 'fridge', t: 'Refrigerated trucks let milk travel far without spoiling.', right: 'The dairy ring spreads farther from the market', why: 'Cheaper transport for milk flattens dairy\'s bid-rent line, so dairy can outbid other uses farther out.' },
    { id: 'road', t: 'A new highway cuts the cost of hauling every crop.', right: 'Every ring spreads outward from the market', why: 'Lower transport costs flatten every bid-rent line, so each use can pay for land farther away.' },
    { id: 'river', t: 'A navigable river crosses the plain, and boats haul goods for less than carts.', right: 'The rings stretch out along the river', why: 'Land along the river is cheaper to ship from, so each ring reaches farther along it: the plain is no longer the same in every direction.' },
    { id: 'town', t: 'A second market town grows on the far side of the plain.', right: 'The new town grows its own set of rings', why: 'Each market draws its own rings; von Thünen assumed only one, which is a limit of the model.' }
  ];
  function genRings(r, ctx){
    var ch = r.pick(CHANGES);
    var wrongs = CHANGES.filter(function(x){ return x.id !== ch.id; }).map(function(x){ return x.right; }).concat(['The rings stay exactly where they were']);
    var opts = [ch.right].concat(shuffled(r, wrongs).slice(0, 3));
    return {
      type: 'rings', ctx: ctx.id, topic: ctx.topic, given: { change: ch.id },
      text: '<p>Von Thünen\'s model (1826) imagines one market town on a flat, even plain where farmers pay to haul their goods to market by cart. Each farm grows whatever pays the most rent after the cost of transport.</p>',
      steps: [{ key: 'place', kind: 'model', label: 'Place the four land uses in von Thünen\'s rings, from the market outward.', model: vtModel(), practice: '1.A', level: 'apply' },
        choice('change', 'Now this changes: ' + ch.t + ' What happens to the rings?', opts.map(function(o){ var src = CHANGES.filter(function(x){ return x.right === o; })[0]; return opt(o, o === ch.right, o === ch.right ? ch.why : src ? 'That would follow from a different change (' + src.t.charAt(0).toLowerCase() + src.t.slice(1, -1) + ').' : 'Transport costs set the rings, so changing them moves the rings.'); }), '1.E', 'analyze')],
      solution: ['From the market: 1 dairy and market gardens, 2 forest, 3 grain and field crops, 4 ranching. ' + FARM.map(function(u){ return u.why; }).join(' '), ch.why],
      figure: { kind: 'rings', change: ch.id }
    };
  }
  function genBidrent(r, ctx){
    var C = Calc(), farm = ctx.id !== 'city', uses = farm ? FARM : TOWN;
    var i = r.int(0, uses.length - 2), u = uses[i], v = uses[i + 1];
    var x = cross(u, v), zeroU = u.A / u.a;
    // A distance where both bid more than 0, on either side of the crossing, never at it.
    var cand = []; var whole = u.a % 1 === 0 && v.a % 1 === 0;
    for(var d = 1; d < Math.min(zeroU, v.A / v.a); d++) if(Math.abs(d - x) > 0.4 && (whole || d % 2 === 0)) cand.push(d);
    var d0 = r.pick(cand), bu = C.evaluate(bidRecipe(u, d0)), bv = C.evaluate(bidRecipe(v, d0)), win = bu > bv ? u : v, lose = win === u ? v : u;
    var unit = farm ? 'per hectare a year' : 'per square meter a year';
    var center = farm ? 'the market' : 'the city center';
    function cell(w){ var b = C.evaluate(bidRecipe(w, d0)); return M.cell(b, 0.0005, [{ value: w.A, why: 'That is the bid at ' + center + ' itself. Subtract the fall in the bid over ' + d0 + ' km.' }, { value: w.a * d0, why: 'That is how much the bid falls over ' + d0 + ' km. Subtract it from the bid at ' + center + '.' }, { value: w.A + w.a * d0, why: 'The bid falls with distance: subtract, do not add.' }], 0.5); }
    return {
      type: 'bidrent', ctx: ctx.id, topic: ctx.topic, given: { farm: farm, u: u.id, v: v.id, d: d0 },
      text: '<p>Invented numbers for practice. Bid rent is what each land use can pay for land, in dollars ' + unit + '. ' + u.name + ' bid $' + fmtN(u.A) + ' at ' + center + ', falling $' + fmtN(u.a) + ' for every km away. ' + v.name + ' bid $' + fmtN(v.A) + ', falling $' + fmtN(v.a) + ' a km.</p>',
      steps: [
        { key: 'bidU', kind: 'num', label: 'What is the bid for ' + u.name.toLowerCase() + ' at ' + d0 + ' km?', hint: 'Bid = bid at ' + center + ' − fall per km × distance.', unit: '$', d: 0, practice: '3.B', level: 'apply', cell: cell(u) },
        { key: 'bidV', kind: 'num', label: 'What is the bid for ' + v.name.toLowerCase() + ' at ' + d0 + ' km?', hint: 'Same rule with its own numbers.', unit: '$', d: 0, practice: '3.B', level: 'apply', cell: cell(v) },
        choice('wins', 'Who most likely uses the land at ' + d0 + ' km?', [
          opt(win.name, true, 'It bids more there ($' + fmtN(Math.max(bu, bv)) + ' against $' + fmtN(Math.min(bu, bv)) + '), and land goes to the highest bidder. ' + win.why),
          opt(lose.name, false, 'It bids less there ($' + fmtN(Math.min(bu, bv)) + ' against $' + fmtN(Math.max(bu, bv)) + '). Land goes to the highest bid, not to the use that bids most at ' + center + '.'),
          opt('Both share it equally', false, 'Two bids are equal only where the lines cross, at ' + fmtN(x) + ' km. At ' + d0 + ' km one bids more.'),
          opt('No one: the land is too far out', false, 'Both still bid more than $0 at ' + d0 + ' km.')
        ], '2.C', 'analyze', true)],
      solution: [u.name + ': ' + fmtN(u.A) + ' − ' + fmtN(u.a) + ' × ' + d0 + ' = ' + fmtN(bu) + '.', v.name + ': ' + fmtN(v.A) + ' − ' + fmtN(v.a) + ' × ' + d0 + ' = ' + fmtN(bv) + '.', 'The bid for ' + win.name.toLowerCase() + ' is higher than the bid for ' + lose.name.toLowerCase() + ' at ' + d0 + ' km. The lines cross at ' + fmtN(x) + ' km: that is where one ' + (farm ? 'ring' : 'zone') + ' gives way to the next.'],
      figure: { kind: 'bidrent', farm: farm, u: u.id, v: v.id, d: d0 }
    };
  }
  function genModels(r, ctx){
    var k = r.pick(CITY_IDS), Cm = CITY[k], others = shuffled(r, CITY_IDS.filter(function(x){ return x !== k; })).slice(0, 3);
    var opts = [k].concat(others);
    var steps = [choice('model', 'Which city model does this description fit best?', opts.map(function(x){
      return opt(CITY[x].full, x === k, x === k ? CITY_SLIP[x] : CITY_SLIP[x] + ' That is not what the description shows.');
    }), '1.D', 'apply')];
    var lim = shuffled(r, CITY_IDS.filter(function(x){ return x !== k; })).slice(0, 3);
    steps.push(choice('limit', 'Which is a limit of the ' + lcModel(Cm.name) + '?', [k].concat(lim).map(function(x){
      return opt(CITY[x].limit, x === k, x === k ? 'Every model simplifies; this is where this one fails.' : 'That is a limit of the ' + lcModel(CITY[x].name) + ', not this one.');
    }), '1.E', 'analyze'));
    if(k === 'concentric') steps.splice(1, 0, { key: 'zones', kind: 'model', label: 'Place the zones of the concentric zone model, from the center outward.', practice: '1.A', level: 'apply', model: burgessModel() });
    return {
      type: 'models', ctx: ctx.id, topic: ctx.topic, given: { model: k },
      text: '<p>Invented description of a city. A geographer maps it and finds ' + Cm.clues + '.</p>',
      steps: steps,
      solution: [Cm.full + ': ' + Cm.clues + '.'].concat(k === 'concentric' ? ['From the center: ' + Cm.zones.join(', ') + '.'] : []).concat(['A limit: ' + Cm.limit]),
      figure: { kind: 'city', model: k, reveal: false }
    };
  }
  function burgessModel(){
    var Z = CITY.concentric.zones;
    return { layout: 'rings', title: 'Concentric zone model', unit: 'zone',
      slots: Z.map(function(z, i){ return { id: 'z' + (i + 1), name: i === 0 ? 'Center' : 'Ring ' + i + (i === 1 ? ' (next to the center)' : i === 4 ? ' (outermost)' : '') }; }),
      pieces: [{ id: 'cbd', text: 'CBD' }, { id: 'trans', text: 'Zone of transition' }, { id: 'work', text: 'Working-class homes' }, { id: 'mid', text: 'Middle-class homes' }, { id: 'comm', text: 'Commuter zone' }, { id: 'edge', text: 'Edge city' }],
      key: { z1: 'cbd', z2: 'trans', z3: 'work', z4: 'mid', z5: 'comm' },
      slips: [{ piece: 'comm', slot: 'z2', why: 'Commuters live farthest out in this model. Just outside the CBD is the zone of transition, with factories and old, crowded housing.' },
        { piece: 'edge', slot: 'z5', why: 'Edge cities belong to the galactic city model, built around highways. The outermost ring here is the commuter zone.' }] };
  }
  function genCentral(r, ctx){
    var C = Calc(), g = r.pick(GOODS.slice(0, 4)), town = r.pick(TOWNS);
    // Close to the threshold, never on it: about half the cases can open.
    // The area is the circle the range draws (pi r squared, rounded), so the numbers fit together.
    var area = Math.round(Math.PI * g.range * g.range), dens = Math.max(1, Math.round(g.threshold * r.pick([0.5, 0.8, 1.2, 1.5, 2]) / area));
    var people = C.evaluate({ fn: 'mul', args: [area, dens] });
    var ok = people >= g.threshold;
    var steps = [
      { key: 'people', kind: 'num', label: 'How many people live within its range around ' + town + '?', hint: 'People = area within range × people per square km.', unit: 'people', d: 0, practice: '3.B', level: 'apply',
        cell: M.cell(people, 0.0005, [{ value: C.evaluate({ fn: 'div', args: [area, dens] }), why: 'You divided. Multiply the area by the people per square km.' }, { value: C.evaluate({ fn: 'add', args: [area, dens] }), why: 'You added. Multiply the area by the people per square km.' }], 0.5) },
      choice('open', 'Can ' + g.name.toLowerCase() + ' make a profit in ' + town + '?', [
        opt('Yes: the people within its range meet its threshold', ok, ok ? fmtN(people) + ' people within range is at least the threshold of ' + fmtN(g.threshold) + '.' : 'Only ' + fmtN(people) + ' people live within range, fewer than the threshold of ' + fmtN(g.threshold) + '.'),
        opt('No: too few people live within its range', !ok, !ok ? fmtN(people) + ' is below the threshold of ' + fmtN(g.threshold) + ', so it cannot get enough customers.' : fmtN(people) + ' people is at least the threshold of ' + fmtN(g.threshold) + ', so it has enough customers.')
      ], '2.C', 'apply', true),
      choice('order', 'In central place theory, which of these has the largest range and threshold?', shuffled(r, ['bread', 'gas', 'clothes', 'heart']).map(function(id){
        var x = GOODS.filter(function(q){ return q.id === id; })[0];
        return opt(x.name, id === 'heart', id === 'heart' ? 'A high-order service: people travel far for it, and it needs a huge market, so only the largest cities have one.' : x.name + ' is a ' + x.order + '-order good: people travel less far for it, and it needs fewer customers.');
      }), '1.A', 'apply')
    ];
    return {
      type: 'central', ctx: ctx.id, topic: ctx.topic, given: { good: g.id, area: area, dens: dens, threshold: g.threshold },
      text: '<p>Invented numbers for practice. ' + g.name + ' needs at least ' + fmtN(g.threshold) + ' people to make a profit (its threshold). Shoppers will travel up to ' + g.range + ' km for it (its range). Around the town of ' + town + ', about ' + fmtN(area) + ' square km lie within that range (a circle reaching ' + g.range + ' km out from the town), with ' + dens + ' people per square km.</p>',
      steps: steps,
      solution: ['People = ' + fmtN(area) + ' × ' + dens + ' = ' + fmtN(people) + '.', ok ? 'That meets the threshold of ' + fmtN(g.threshold) + ', so it can open.' : 'That is below the threshold of ' + fmtN(g.threshold) + ', so it cannot make a profit there; shoppers go to a larger central place.', 'High-order goods and services, such as heart surgery, have the largest range and threshold; low-order goods, such as bread, the smallest.'],
      figure: { kind: 'central', range: g.range, ok: ok }
    };
  }
  function genRanksize(r, ctx){
    var C = Calc(), P1 = r.pick([4, 6, 8, 12]) * 1e6, rank = r.pick([2, 3, 4]), primate = r() < 0.5;
    var exp = C.evaluate({ fn: 'rankSize', args: [P1, rank] });
    var cities = [P1];
    var second = P1 * r.pick([0.12, 0.15, 0.18]);
    for(var i = 2; i <= 4; i++) cities.push(Math.round((primate ? second * [1, 0.7, 0.5][i - 2] : P1 / i * r.pick([0.95, 1, 1.05])) / 1e5) * 1e5);
    cities.sort(function(a, b){ return b - a; });
    var mil = function(n){ return M.fixed(n / 1e6, 1).replace(/\.0$/, '') + ' million'; };
    var steps = [
      { key: 'expected', kind: 'num', label: 'By the rank-size rule, how many people should the city of rank ' + rank + ' have, in millions?', hint: 'The nth city has 1/n the population of the largest.', unit: 'million', d: 1, practice: '3.B', level: 'apply',
        cell: M.cell(exp / 1e6, 0.005, [{ value: P1 * rank / 1e6, why: 'You multiplied by the rank. Divide the largest city by the rank.' }, { value: (P1 - P1 / rank) / 1e6, why: 'That is how many fewer people it has than the largest. The question asks for its own size.' }], 0.051) },
      choice('pattern', 'What pattern do the four cities show?', [
        opt('They roughly follow the rank-size rule', !primate, !primate ? 'Each city is close to the largest city divided by its rank.' : 'The largest city is far more than twice the second: that is a primate city, not the rank-size rule.'),
        opt('The largest is a primate city', primate, primate ? 'The largest city is more than three times the size of the second, far more than the rule predicts: a primate city dominates the country.' : 'The second city is about half the largest, as the rule predicts; no city dominates.'),
        opt('Every city is about the same size', false, 'The sizes fall steeply from the largest; they are not equal.'),
        opt('The smallest city is the most important', false, 'The table shows size, and the largest city is the biggest by far.')
      ], '3.C', 'analyze', true),
      choice('why', primate ? 'What most often explains a primate city?' : 'What does a rank-size pattern usually suggest about a country?', primate ? [
        opt('Government, trade and jobs are concentrated in one city, often a former colonial capital', true, 'Primate cities often grew as the single center of power and trade.'),
        opt('Every region of the country has a large city', false, 'That would give a rank-size pattern, not one dominant city.'),
        opt('The country has no cities over 1 million', false, 'The largest city here has ' + mil(P1) + '.'),
        opt('Farming employs everyone in the largest city', false, 'Large cities are centers of services and industry, not farming.')
      ] : [
        opt('Its cities form a connected hierarchy, with services spread among many cities', true, 'A rank-size pattern suggests a well-developed urban hierarchy rather than one dominant city.'),
        opt('One city holds almost all of the country\'s power and wealth', false, 'That describes a primate city.'),
        opt('Most people live in the largest city', false, 'Most city dwellers here live outside the largest city.'),
        opt('The cities are all the same size', false, 'The sizes fall with rank, they are not equal.')
      ], '2.B', 'analyze')
    ];
    return {
      type: 'ranksize', ctx: ctx.id, topic: ctx.topic, given: { P1: P1, rank: rank, cities: cities, primate: primate },
      text: '<p>Invented country for practice. Its four largest cities:</p><table class="cl-table"><thead><tr><th scope="col">Rank</th><th scope="col">Population</th></tr></thead><tbody>' + cities.map(function(c, j){ return '<tr><th scope="row">' + (j + 1) + '</th><td>' + mil(c) + '</td></tr>'; }).join('') + '</tbody></table>',
      steps: steps,
      solution: ['Rank-size rule: ' + mil(P1) + ' / ' + rank + ' = ' + M.fixed(exp / 1e6, 1).replace(/\.0$/, '') + ' million.', primate ? 'The largest city is more than three times the second: a primate city.' : 'Each city is close to the largest divided by its rank: the rank-size rule fits.', primate ? 'Primate cities often hold the government, trade and jobs of a whole country.' : 'A rank-size pattern suggests a connected urban hierarchy.'],
      figure: { kind: 'ranksize', cities: cities, primate: primate }
    };
  }

  var GEN = { rings: genRings, bidrent: genBidrent, models: genModels, central: genCentral, ranksize: genRanksize };
  var TYPES = Object.keys(GEN);
  function generate(r, ctx, type){
    var t = type || r.pick(ctx.types || TYPES);
    if(!GEN[t]) throw new Error('city-lab: unknown type ' + t);
    return GEN[t](r, ctx);
  }

  M.register('cityLab', {
    FARM: FARM, TOWN: TOWN, CITY: CITY, CITY_IDS: CITY_IDS, GOODS: GOODS, CHANGES: CHANGES,
    bid: bid, rings: rings, cross: cross, useBy: useBy, vtModel: vtModel, burgessModel: burgessModel, fmtN: fmtN,
    TYPES: TYPES, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
