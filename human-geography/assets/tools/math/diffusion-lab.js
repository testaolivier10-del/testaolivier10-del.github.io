/* Diffusion lab model: ApHugMath.diffusionLab (docs/aphug-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/aphug-briefs/t4.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/aphug-tool-checks/diffusion-lab.mjs) and the
   test (scripts/test/aphug-tool-diffusion-lab.test.mjs) run exactly this code.

   The map: Country A (human-geography/figures/base/country-a.json, an invented
   country of eight provinces, 600 x 400) with a fixed network of 36 places
   (PLACES): the capital, 4 large cities, 9 towns and 22 villages. Every
   picture this trainer draws is on it, so nothing claims to be a real place.

     spread(kind, hearth, dest?) -> { kind, hearth, steps: { placeId: 1..4 },
       changed: { placeId: true }, arrows: [[fromId, toId]], last }
       relocation    people carry the trait from the hearth to far cities; the
                     places between never get it (steps 1 and 2)
       contagious    nearest places first, outward by distance (Step 2 within R px,
                     Step 3 within 2R, Step 4 within 3R)
       hierarchical  by size: the hearth, then the capital and large cities,
                     then towns, then villages, wherever they are
       stimulus      outward like contagious, but every place after the hearth
                     takes the idea and changes it (changed)
       mixed         hierarchical to the large cities, then contagious around
                     each one (real diffusion mixes types)
     moves(kind, ...) -> the migration pictures: { from, to, via?, factors }
     generate(r, ctx, type) -> one drill problem for ApHugTools.drill:
       diffusion   read a diffusion map: the hearth (a letter), the type, a real
                   case of the same type
       mixed       a map that mixes types: which two, and in what order
       migration   a move with three factors on the map: push, pull, and an
                   intervening obstacle or opportunity; the kind of cause
       kinds       forced or voluntary, then the kind of migration (refugee,
                   asylum seeker, internally displaced person, step, chain,
                   guest worker, transhumance, rural-to-urban)
       ravenstein  an invented survey of moves (a table and flows on the map):
                   a number with ApHugCalc, then the law it shows
   Every problem keeps the facts its keys come from in `given`, so the
   validator recomputes each key without this file's answer. */
(function(root){
  'use strict';
  var M = root.ApHugMath;
  if(!M) return;
  function Calc(){ return root.ApHugCalc; }

  /* ------------------------------------------------------------ the map */
  // Rank 1 the capital, 2 large city, 3 town, 4 village. x, y in Country A's pixels.
  var PLACES = [
    { id: 'cap', x: 345, y: 205, rank: 1 },
    { id: 'n1', x: 165, y: 92, rank: 2 }, { id: 'n2', x: 445, y: 80, rank: 2 }, { id: 'n3', x: 118, y: 222, rank: 2 }, { id: 'n4', x: 478, y: 292, rank: 2 },
    { id: 't1', x: 245, y: 62, rank: 3 }, { id: 't2', x: 352, y: 58, rank: 3 }, { id: 't3', x: 505, y: 168, rank: 3 }, { id: 't4', x: 250, y: 160, rank: 3 },
    { id: 't5', x: 205, y: 238, rank: 3 }, { id: 't6', x: 228, y: 322, rank: 3 }, { id: 't7', x: 385, y: 318, rank: 3 }, { id: 't8', x: 398, y: 165, rank: 3 }, { id: 't9', x: 470, y: 228, rank: 3 },
    { id: 'v1', x: 100, y: 72, rank: 4 }, { id: 'v2', x: 205, y: 42, rank: 4 }, { id: 'v3', x: 295, y: 38, rank: 4 }, { id: 'v4', x: 402, y: 45, rank: 4 },
    { id: 'v5', x: 535, y: 205, rank: 4 }, { id: 'v6', x: 432, y: 198, rank: 4 }, { id: 'v7', x: 82, y: 175, rank: 4 }, { id: 'v8', x: 150, y: 270, rank: 4 },
    { id: 'v9', x: 74, y: 236, rank: 4 }, { id: 'v11', x: 300, y: 232, rank: 4 }, { id: 'v12', x: 288, y: 292, rank: 4 }, { id: 'v13', x: 192, y: 345, rank: 4 },
    { id: 'v14', x: 258, y: 352, rank: 4 }, { id: 'v15', x: 338, y: 348, rank: 4 }, { id: 'v16', x: 430, y: 338, rank: 4 }, { id: 'v17', x: 522, y: 268, rank: 4 },
    { id: 'v18', x: 362, y: 282, rank: 4 }, { id: 'v19', x: 485, y: 125, rank: 4 }, { id: 'v20', x: 318, y: 98, rank: 4 }, { id: 'v21', x: 135, y: 132, rank: 4 },
    { id: 'v22', x: 165, y: 205, rank: 4 }, { id: 'v23', x: 505, y: 322, rank: 4 }
  ];
  var BY = {}; PLACES.forEach(function(p){ BY[p.id] = p; });
  // The province each place is in (Country A's feature ids), for the stories.
  var PROVINCE = { north: 'the Northern Hills', northeast: 'the Lake District', east: 'the Eastern Plains', capital: 'the Capital Region', west: 'the Western Uplands', central: 'the Central Valley', south: 'the Southern Forest', coast: 'the South Coast' };
  var POLY = {
    north: [[60, 40], [250, 20], [300, 120], [180, 160], [70, 140]],
    northeast: [[250, 20], [470, 30], [520, 110], [400, 150], [300, 120]],
    east: [[520, 110], [560, 230], [430, 260], [400, 150]],
    capital: [[300, 120], [400, 150], [430, 260], [320, 270], [260, 200]],
    west: [[70, 140], [180, 160], [260, 200], [200, 290], [50, 260]],
    central: [[180, 160], [300, 120], [260, 200]],
    south: [[200, 290], [260, 200], [320, 270], [300, 370], [160, 360]],
    coast: [[320, 270], [430, 260], [560, 230], [540, 340], [300, 370]]
  };
  function inPoly(pt, poly){
    var c = false;
    for(var i = 0, j = poly.length - 1; i < poly.length; j = i++){
      var a = poly[i], b = poly[j];
      if(((a[1] > pt[1]) !== (b[1] > pt[1])) && (pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0])) c = !c;
    }
    return c;
  }
  function provinceOf(id){ var p = BY[id]; for(var k in POLY) if(inPoly([p.x, p.y], POLY[k])) return k; return null; }
  function dist(a, b){ var p = BY[a], q = BY[b]; return Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y)); }
  var RANK = { 1: 'the capital', 2: 'a large city', 3: 'a town', 4: 'a village' };

  /* ---------------------------------------------------------- spreading */
  var R_CONTAGIOUS = 100, R_NEAR = 82;
  function spread(kind, hearth, dest){
    var steps = {}, changed = {}, arrows = [];
    if(!BY[hearth]) throw new Error('diffusion-lab: no place ' + hearth);
    if(kind === 'contagious' || kind === 'stimulus'){
      PLACES.forEach(function(p){ var d = dist(hearth, p.id), s = d === 0 ? 1 : 1 + Math.ceil(d / R_CONTAGIOUS); if(s <= 4) steps[p.id] = s; });
      if(kind === 'stimulus') Object.keys(steps).forEach(function(id){ if(steps[id] > 1) changed[id] = true; });
    } else if(kind === 'hierarchical'){
      PLACES.forEach(function(p){ steps[p.id] = p.id === hearth ? 1 : p.rank <= 2 ? 2 : p.rank; });
    } else if(kind === 'relocation'){
      steps[hearth] = 1;
      (dest || []).forEach(function(d){ steps[d] = 2; arrows.push([hearth, d]); });
    } else if(kind === 'mixed'){
      steps[hearth] = 1;
      PLACES.forEach(function(p){ if(p.rank <= 2 && p.id !== hearth) steps[p.id] = 2; });
      [3, 4].forEach(function(s){
        PLACES.forEach(function(p){
          if(steps[p.id]) return;
          var near = Object.keys(steps).some(function(id){ return steps[id] < s && dist(id, p.id) <= R_NEAR; });
          if(near) steps[p.id] = s;
        });
      });
    } else throw new Error('diffusion-lab: unknown spread ' + kind);
    var last = Math.max.apply(null, Object.keys(steps).map(function(k){ return steps[k]; }));
    return { kind: kind, hearth: hearth, steps: steps, changed: changed, arrows: arrows, last: last };
  }
  // Hearths that show each kind cleanly (checked over every place by the test).
  var HEARTHS = {
    contagious: ['v1', 'v7', 'v9', 'v13', 'v14', 'v5', 'v17', 'v23', 'v4', 't1', 't6', 't3'],
    stimulus: ['v1', 'v7', 'v13', 'v5', 'v17', 'v23', 'v4', 't1', 't6', 't3'],
    hierarchical: ['cap', 'n1', 'n2', 'n3', 'n4'],
    relocation: ['v1', 'v7', 'v9', 'v13', 'v22', 'v5', 'v17', 'v23', 'v4', 't3'],
    mixed: ['cap', 'n1', 'n4']
  };
  function farCities(h){ return PLACES.filter(function(p){ return p.rank <= 2 && dist(h, p.id) >= 260; }).map(function(p){ return p.id; }); }

  /* ---------------------------------------------------------- the words */
  var KINDS = {
    relocation: { name: 'Relocation diffusion', short: 'Relocation', family: 'relocation',
      def: 'Relocation diffusion is a trait carried to a new place by people who move there.',
      clue: 'It appears only in places far away, where the people who carried it settled, and not in the places between.' },
    contagious: { name: 'Contagious diffusion', short: 'Contagious', family: 'expansion',
      def: 'Contagious diffusion spreads from place to nearby place, like a ripple, whatever their size.',
      clue: 'It reaches the nearest places first and moves outward step by step.' },
    hierarchical: { name: 'Hierarchical diffusion', short: 'Hierarchical', family: 'expansion',
      def: 'Hierarchical diffusion spreads from the largest or most connected places down to smaller ones.',
      clue: 'It jumps to the biggest places first, skipping smaller places in between.' },
    stimulus: { name: 'Stimulus diffusion', short: 'Stimulus', family: 'expansion',
      def: 'Stimulus diffusion spreads the idea behind a trait, but people change the trait to fit their own culture.',
      clue: 'Places take the idea but change it, so the version they use differs from the hearth\'s.' }
  };
  var ORDER = ['relocation', 'contagious', 'hierarchical', 'stimulus'];
  // Why a wrong pick is wrong, by [picked][right]: the slip, named.
  var SLIP = {
    relocation: {
      contagious: 'Relocation needs people to move and carry the trait to a far place. Here it spread to the places next door first, while the hearth kept it.',
      hierarchical: 'Relocation would skip to wherever the movers settled. Here it went to every large city, then down the sizes, while the hearth kept it.',
      stimulus: 'Relocation keeps the trait the same and carries it with people. Here neighbors took the idea and changed it.'
    },
    contagious: {
      relocation: 'Contagious diffusion fills in the places next to the hearth. Here the places between the hearth and the far cities never got it: people carried it there.',
      hierarchical: 'Contagious diffusion goes to the nearest places first. Here large cities far away got it at Step 2 while villages next to the hearth waited until Step 4.',
      stimulus: 'The ripple pattern fits, but look at the symbols: after the hearth, every place has a changed version. That is stimulus diffusion.'
    },
    hierarchical: {
      relocation: 'Hierarchical diffusion would reach every large city and then the towns. Here only one or two far cities got it, carried by people who moved.',
      contagious: 'Hierarchical diffusion jumps by size. Here it moved by distance: a village near the hearth got it before a large city far away.',
      stimulus: 'It moved by distance, not by size, and places changed the trait. That is stimulus diffusion.'
    },
    stimulus: {
      relocation: 'Stimulus diffusion changes the trait as it spreads outward. Here the trait stayed the same and was carried to far cities by people who moved.',
      contagious: 'Stimulus diffusion changes the trait. Here every place has the same trait as the hearth: the symbols are all the same.',
      hierarchical: 'Stimulus diffusion changes the trait. Here every place has the same trait, and it moved down the sizes of places.'
    }
  };
  // A real case of each kind (well-known textbook cases, worded to stay true).
  var REAL = {
    relocation: 'Immigrants from Italy brought pizza to cities in the United States in the late 1800s and early 1900s.',
    contagious: 'An infectious disease passes from person to person through a neighborhood.',
    hierarchical: 'A new fashion is shown first in a few large world cities, then reaches smaller cities, then towns.',
    stimulus: 'In India, where many people do not eat beef, fast-food chains sell burgers made of potato or paneer.'
  };
  var TRAITS = [
    { t: 'a new style of dance music', c: 'local musicians play it on their own instruments' },
    { t: 'a mobile payment app', c: 'local shops use the idea in a version that works without the internet' },
    { t: 'a no-till way of planting grain', c: 'farmers keep the idea but plant beans instead' },
    { t: 'a new slang word', c: 'people keep the idea but make their own word from their own dialect' },
    { t: 'a street food of fried grain cakes', c: 'cooks keep the idea but use cassava flour' },
    { t: 'a style of metal roof', c: 'builders keep the idea but use local clay tiles' },
    { t: 'a new board game', c: 'players keep the idea but change the rules and pieces' },
    { t: 'a fashion for bright, patterned scarves', c: 'people keep the idea but weave scarves in local patterns' }
  ];
  var LETTERS = ['A', 'B', 'C', 'D'];

  /* ------------------------------------------------------------ helpers */
  function opt(t, ok, why){ return { t: t, ok: ok, why: why }; }
  function choice(key, label, opts, practice, level, fixed){
    var c = -1; opts.forEach(function(o, i){ if(o.ok) c = i; });
    var s = { key: key, kind: 'choice', label: label, options: opts.map(function(o){ return o.t; }), why: opts.map(function(o){ return (o.ok ? 'Yes. ' : 'Not this one. ') + o.why; }), correct: c, practice: practice || '1.A', level: level || 'apply' };
    if(fixed) s.fixed = true;
    return s;
  }
  function shuffled(r, list){ return M.shuffle ? M.shuffle(r, list.slice()) : list.slice(); }
  function pickN(r, list, n){ return shuffled(r, list).slice(0, n); }

  /* Letters: the hearth plus three other places, each with a different first
     step where possible, spread out so no two letters crowd (40 px apart). */
  function letterPlaces(r, sp, extra){
    var others = PLACES.filter(function(p){ return p.id !== sp.hearth && dist(p.id, sp.hearth) >= 60; });
    var pool = shuffled(r, others), chosen = [sp.hearth];
    var want = extra || [];
    want.forEach(function(id){ if(chosen.indexOf(id) < 0 && dist(id, sp.hearth) >= 40) chosen.push(id); });
    pool.forEach(function(p){
      if(chosen.length >= 4) return;
      if(chosen.every(function(id){ return dist(id, p.id) >= 60; })) chosen.push(p.id);
    });
    var order = shuffled(r, chosen), out = {};
    order.forEach(function(id, i){ out[LETTERS[i]] = id; });
    return out;
  }
  function stepWord(sp, id){ var s = sp.steps[id]; return s ? 'got it at Step ' + s : 'does not have it yet'; }

  /* ------------------------------------------------------------ types */
  function genDiffusion(r, ctx){
    var kind = r.pick(ORDER), hearth = r.pick(HEARTHS[kind]), dest = null;
    if(kind === 'relocation'){ var far = farCities(hearth); dest = pickN(r, far, Math.min(2, far.length)); }
    var sp = spread(kind, hearth, dest), trait = r.pick(TRAITS);
    var letters = letterPlaces(r, sp, dest);
    var hearthL = LETTERS.filter(function(l){ return letters[l] === hearth; })[0];
    var info = KINDS[kind];
    var stepHearth = choice('hearth', 'Which place is the hearth, where ' + trait.t + ' began?', LETTERS.map(function(l){
      var id = letters[l];
      return opt('Place ' + l, id === hearth, id === hearth ? 'Place ' + l + ' is the only place shaded for Step 1: that is where it started.' : 'Place ' + l + ' ' + stepWord(sp, id) + ', so it did not start there. The hearth is the place shaded for Step 1.');
    }), '2.A', 'apply', true);
    var stepType = choice('type', 'Which type of diffusion does the map show?', ORDER.map(function(k){
      return opt(KINDS[k].name, k === kind, k === kind ? info.clue : SLIP[k][kind]);
    }), '1.D', 'analyze', true);
    var stepFam = choice('family', 'Is this relocation diffusion or expansion diffusion?', [
      opt('Relocation: people carried it away to a new place', info.family === 'relocation', info.family === 'relocation' ? 'The trait moved with people; the places between never got it.' : 'Relocation means the trait moves with people who move. Here it spread outward from the hearth while the hearth kept it: expansion.'),
      opt('Expansion: it spread outward and the hearth kept it', info.family === 'expansion', info.family === 'expansion' ? 'Contagious, hierarchical and stimulus diffusion are all kinds of expansion diffusion: the trait spreads while staying strong in the hearth.' : 'Expansion would fill in places as it spreads. Here it skipped everything between the hearth and the far cities: people carried it, so it is relocation.')
    ], '1.A', 'apply', true);
    var stepReal = choice('example', 'Which real case spread the same way?', ORDER.map(function(k){
      return opt(REAL[k], k === kind, k === kind ? 'That is ' + KINDS[k].name.toLowerCase() + ' too. ' + info.def : 'That case is ' + KINDS[k].name.toLowerCase() + '. ' + KINDS[k].def);
    }), '1.D', 'apply');
    var text = '<p>Invented case on the map of Country A. ' + cap(trait.t) + ' spread through the country in ' + sp.last + ' steps. Each place is shaded by the step when it first had it' +
      (kind === 'stimulus' ? '; a diamond means the place took the idea but changed it (' + trait.c + ')' : '') + (kind === 'relocation' ? '; arrows show where people moved' : '') + '.</p>';
    return {
      type: 'diffusion', ctx: ctx.id, topic: ctx.topic,
      given: { kind: kind, hearth: hearth, dest: dest, letters: letters },
      text: text,
      steps: [stepHearth, stepType, stepFam, stepReal],
      solution: ['The hearth is Place ' + hearthL + ': it is the only place shaded for Step 1.', info.name + '. ' + info.clue + ' ' + info.def,
        info.family === 'relocation' ? 'Relocation diffusion: the trait moved with people, so places on the way did not get it.' : 'Expansion diffusion: contagious, hierarchical and stimulus diffusion all spread outward while the hearth keeps the trait.',
        'A real case of the same type: ' + REAL[kind]],
      figure: { kind: 'spread', spread: sp, letters: letters }
    };
  }
  var MIX = [
    { id: 'hc', t: 'Hierarchical first, then contagious', ok: true },
    { id: 'ch', t: 'Contagious first, then hierarchical', why: 'Look at Step 2: the large cities all got it at once, however far away. Jumping by size is hierarchical, and that came first.' },
    { id: 'rc', t: 'Relocation first, then contagious', why: 'Relocation would put it only where movers settled. Here every large city got it at Step 2, then the places around each one.' },
    { id: 'hs', t: 'Hierarchical first, then stimulus', why: 'Stimulus would show changed versions (diamonds). Every place here has the same trait; it spread outward from each city by distance.' }
  ];
  function genMixed(r, ctx){
    var hearth = r.pick(HEARTHS.mixed), sp = spread('mixed', hearth), trait = r.pick(TRAITS);
    var letters = letterPlaces(r, sp), hearthL = LETTERS.filter(function(l){ return letters[l] === hearth; })[0];
    var near = PLACES.filter(function(p){ return sp.steps[p.id] === 3; }).length;
    var stepHearth = choice('hearth', 'Which place is the hearth, where ' + trait.t + ' began?', LETTERS.map(function(l){
      var id = letters[l];
      return opt('Place ' + l, id === hearth, id === hearth ? 'It is the only place shaded for Step 1.' : 'Place ' + l + ' ' + stepWord(sp, id) + '. The hearth is the place shaded for Step 1.');
    }), '2.A', 'apply', true);
    var stepMix = choice('mix', 'Real diffusion often mixes types. Which mix does this map show?', MIX.map(function(x){ return opt(x.t, !!x.ok, x.ok ? 'At Step 2 every large city had it, wherever it was (hierarchical); then it spread to the places near each city (contagious).' : x.why); }), '2.A', 'analyze', true);
    var stepWhy = choice('why', 'Why did the places near each large city get it at Step 3?', [
      opt('People nearby saw it and took it up: distance decay, the pull of nearness', true, 'Contagious spread depends on contact, and contact falls with distance (distance decay), so the nearest places go first.'),
      opt('People from those places all moved to the hearth', false, 'Moving to the hearth would not spread it to the places around each city. Contact with a nearby city did.'),
      opt('The government ordered every village to adopt it', false, 'An order from above could spread a trait, but nothing in the case says so; the map shows spread by nearness.'),
      opt('Smaller places always adopt before large ones', false, 'In hierarchical spread, large places come first. Here the small places came after the cities.')
    ], '1.B', 'analyze');
    return {
      type: 'mixed', ctx: ctx.id, topic: ctx.topic, given: { hearth: hearth, letters: letters, near: near },
      text: '<p>Invented case on the map of Country A. ' + cap(trait.t) + ' spread through the country in ' + sp.last + ' steps. Each place is shaded by the step when it first had it.</p>',
      steps: [stepHearth, stepMix, stepWhy],
      solution: ['The hearth is Place ' + hearthL + '.', 'Hierarchical first: every large city had it at Step 2, however far away. Then contagious: at Steps 3 and 4 it reached the places near each city.', 'Contagious spread follows contact, which falls with distance: distance decay.'],
      figure: { kind: 'spread', spread: sp, letters: letters }
    };
  }

  /* ---------------------------------------------------------- migration */
  var NAMES = ['Amara', 'Tomas', 'Lina', 'Kofi', 'Mei', 'Ravi', 'Sofia', 'Yusuf', 'Ana', 'Jonah', 'Priya', 'Mateo', 'Nadia', 'Kenji', 'Zara', 'Ibrahim', 'Elena', 'Kwame', 'Hana', 'Diego'];
  var CAUSE = ['economic', 'political', 'environmental', 'cultural'];
  var CAUSE_WHY = {
    economic: 'Economic causes are about jobs, pay, land and the cost of living.',
    political: 'Political causes are about laws, governments, rights, conflict and borders.',
    environmental: 'Environmental causes are about climate, water, soil and natural hazards.',
    cultural: 'Cultural causes are about language, religion, family ties and ways of life.'
  };
  // {o} origin province, {d} destination province, {m} a province between, {n} the name.
  var FACTORS = {
    push: [
      { k: 'economic', t: 'The sawmill where {n} worked in {o} closed, and there are no other jobs.' },
      { k: 'economic', t: 'Rents in {o} doubled in two years, and {n}\'s pay stayed the same.' },
      { k: 'environmental', t: 'Three years of drought dried up the wells in {o}.' },
      { k: 'environmental', t: 'Floods covered {n}\'s fields in {o} two years in a row.' },
      { k: 'political', t: 'A new provincial law in {o} bans the newspaper {n} writes for.' },
      { k: 'cultural', t: 'Schools in {o} have stopped teaching in {n}\'s home language.' }
    ],
    pull: [
      { k: 'economic', t: 'Factories in {d} are hiring and pay twice as much as {n} earns now.' },
      { k: 'economic', t: 'Farmland in {d} is cheap to rent.' },
      { k: 'environmental', t: '{d} has reliable rain and a mild climate.' },
      { k: 'political', t: 'In {d}, journalists can report freely.' },
      { k: 'cultural', t: 'In {d} there is a large community that speaks {n}\'s language, with its own schools.' }
    ],
    obstacle: [
      { k: 'environmental', t: 'The only road between {o} and {d} crosses mountains and closes all winter.' },
      { k: 'economic', t: 'The bus fare from {o} to {d} costs three months of {n}\'s pay.' },
      { k: 'political', t: 'A checkpoint on the road through {m} turns back people without a travel permit.' }
    ],
    opportunity: [
      { k: 'economic', t: 'On the way, {n} stops in {m}, where a new port is hiring, and stays there.' },
      { k: 'economic', t: 'Halfway, in {m}, {n} finds a job at a new mine and settles there.' },
      { k: 'environmental', t: 'On the way, {n} finds good farmland with water in {m} and settles there.' }
    ]
  };
  var ROLE = {
    push: { name: 'Push factor', def: 'A push factor is a reason to leave the place where you live.', where: 'origin' },
    pull: { name: 'Pull factor', def: 'A pull factor is a reason to move to a new place.', where: 'destination' },
    obstacle: { name: 'Intervening obstacle', def: 'An intervening obstacle is something between the two places that makes the move harder.', where: 'between' },
    opportunity: { name: 'Intervening opportunity', def: 'An intervening opportunity is a chance on the way that makes the migrant stop short of the destination.', where: 'between' }
  };
  var ROLE_SLIP = {
    push: { pull: 'A pull factor draws people to where they go. This one is at the place they leave, so it pushes.', obstacle: 'An obstacle is between the places. This is at the origin: it pushes people to leave.', opportunity: 'An intervening opportunity is a reason to stop on the way. This one is at the origin and pushes people out.' },
    pull: { push: 'A push factor is at the place people leave. This one is at the destination and draws them there.', obstacle: 'An obstacle makes the trip harder. This makes the destination attractive: it pulls.', opportunity: 'An intervening opportunity lies between the places. This is at the destination itself.' },
    obstacle: { push: 'It does not make people leave; it is on the way and makes the move harder.', pull: 'It does not draw people anywhere; it stands in the way of the move.', opportunity: 'An opportunity makes people stop and stay. This makes the trip harder, so it is an obstacle.' },
    opportunity: { push: 'It is not at the origin. It is a chance on the way that makes the migrant stop.', pull: 'It is not at the destination the migrant set out for. It is on the way, and it ends the trip early.', obstacle: 'An obstacle blocks or slows the move. This one is a chance that makes the migrant stay on the way.' }
  };
  // Origin, between and destination provinces along routes in Country A.
  var ROUTES = [
    { o: 'west', m: 'central', d: 'capital' }, { o: 'north', m: 'central', d: 'capital' }, { o: 'south', m: 'capital', d: 'northeast' },
    { o: 'west', m: 'capital', d: 'east' }, { o: 'north', m: 'capital', d: 'coast' }, { o: 'east', m: 'capital', d: 'west' },
    { o: 'coast', m: 'capital', d: 'north' }, { o: 'northeast', m: 'capital', d: 'south' }
  ];
  // Province centers for the pictures (Country A's own centroids).
  var CENTER = { north: [172.8, 89.4], northeast: [385.2, 79.4], east: [478.7, 187.7], capital: [345.3, 200.5], west: [145.3, 216], central: [246.7, 160], south: [251.9, 302.4], coast: [431.7, 304.4] };
  function fill(t, v){ return t.replace(/\{n\}/g, v.n).replace(/\{o\}/g, v.o).replace(/\{d\}/g, v.d).replace(/\{m\}/g, v.m); }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function roleStep(key, label, right){
    return choice(key, label, ['push', 'pull', 'obstacle', 'opportunity'].map(function(k){
      return opt(ROLE[k].name, k === right, k === right ? ROLE[k].def : ROLE_SLIP[right][k]);
    }), '2.B', 'apply', true);
  }
  function causeStep(key, label, right){
    return choice(key, label, CAUSE.map(function(k){ return opt(cap(k), k === right, CAUSE_WHY[k] + (k === right ? '' : ' That is not what this factor is about.')); }), '1.A', 'apply', true);
  }
  function genMigration(r, ctx){
    var rt = r.pick(ROUTES), n = r.pick(NAMES), v = { n: n, o: PROVINCE[rt.o], d: PROVINCE[rt.d], m: PROVINCE[rt.m] };
    var mid = r() < 0.5 ? 'obstacle' : 'opportunity';
    var push = r.pick(FACTORS.push), pull = r.pick(FACTORS.pull.filter(function(f){ return f.k !== push.k || f.k === 'economic'; })), between = r.pick(FACTORS[mid]);
    // Number the three factors in a seeded order so the question is never "always 1".
    var fs = shuffled(r, [{ role: 'push', f: push, at: rt.o }, { role: 'pull', f: pull, at: rt.d }, { role: mid, f: between, at: rt.m }]);
    var tag = {}; fs.forEach(function(x, i){ x.num = i + 1; tag[x.role] = x; });
    var askA = fs[0], askB = fs.filter(function(x){ return x !== askA; })[r.int(0, 1)];
    var askC = r.pick(fs);
    var story = '<p>Invented case. ' + n + ' lives in ' + v.o + ' and thinks about moving to ' + v.d + '. The map numbers three factors:</p><ol class="dl-factors">' +
      fs.map(function(x){ return '<li>' + esc(cap(fill(x.f.t, v))) + '</li>'; }).join('') + '</ol>' + (mid === 'opportunity' ? '' : '<p>' + n + ' makes the move anyway.</p>');
    return {
      type: 'migration', ctx: ctx.id, topic: ctx.topic,
      given: { roles: fs.map(function(x){ return x.role; }), causes: fs.map(function(x){ return x.f.k; }), askA: askA.num, askB: askB.num, askC: askC.num, mid: mid },
      text: story,
      steps: [roleStep('roleA', 'What is factor ' + askA.num + '?', askA.role), roleStep('roleB', 'What is factor ' + askB.num + '?', askB.role),
        causeStep('cause', 'What kind of cause is factor ' + askC.num + '?', askC.f.k)],
      solution: [
        'Factor ' + askA.num + ' is ' + article(ROLE[askA.role].name) + '. ' + ROLE[askA.role].def,
        'Factor ' + askB.num + ' is ' + article(ROLE[askB.role].name) + '. ' + ROLE[askB.role].def,
        'Factor ' + askC.num + ' is ' + (askC.f.k === 'economic' || askC.f.k === 'environmental' ? 'an ' : 'a ') + askC.f.k + ' cause. ' + CAUSE_WHY[askC.f.k]
      ],
      figure: { kind: 'move', from: rt.o, to: rt.d, via: rt.m, stop: mid === 'opportunity', tags: fs.map(function(x){ return { num: x.num, at: x.at, role: x.role }; }) }
    };
  }
  function article(s){ return (/^[AEIOU]/i.test(s) ? 'an ' : 'a ') + s.toLowerCase(); }

  /* Kinds of migration (CED 2.11). Each scene names its clue. */
  var MKINDS = {
    refugee: { name: 'Refugee', forced: true, def: 'A refugee has fled across an international border because of persecution, war or violence and is protected under international law.' },
    asylum: { name: 'Asylum seeker', forced: true, def: 'An asylum seeker has asked another country for protection and is waiting for a decision.' },
    idp: { name: 'Internally displaced person', forced: true, def: 'An internally displaced person was forced to flee home but is still inside the same country.' },
    step: { name: 'Step migration', forced: false, def: 'Step migration is a move made in stages, often from a village to a town to a city.' },
    chain: { name: 'Chain migration', forced: false, def: 'Chain migration is moving to a place because relatives or people from your home moved there first.' },
    guest: { name: 'Guest worker', forced: false, def: 'A guest worker moves to another country to work for a set time, with permission, and is expected to go home.' },
    transhumance: { name: 'Transhumance', forced: false, def: 'Transhumance is herders moving their animals with the seasons, often between mountain pastures and valleys.' },
    rural: { name: 'Rural-to-urban migration', forced: false, def: 'Rural-to-urban migration is moving from the countryside to a city, usually within one country.' }
  };
  var MSCENES = [
    { k: 'refugee', t: 'Fighting reached {n}\'s town in {o}. {n} crossed the border into Country B, where the government recognized {n} as needing protection.' },
    { k: 'asylum', t: 'After being jailed twice for joining a protest in {o}, {n} flew to Country B and asked for protection. A court there has not yet decided {n}\'s case.' },
    { k: 'idp', t: 'A dam burst and flooded {n}\'s village in {o}. {n} now lives in a camp in {d}, still inside Country A.' },
    { k: 'idp', t: 'Armed groups burned farms near {n}\'s home in {o}. {n}\'s family fled to a relative\'s house in {d}, in the same country.' },
    { k: 'step', t: '{n} left a village in {o} for a town in the same province, then two years later moved on to the capital.' },
    { k: 'chain', t: '{n}\'s older brother moved to a city in Country B ten years ago. {n} followed him, and now two cousins plan to join them.' },
    { k: 'guest', t: '{n} signed a two-year contract to build roads in Country B. The work permit ends with the contract, and {n} plans to return to {o}.' },
    { k: 'transhumance', t: 'Each summer, {n}\'s family drives its sheep up to the mountain pastures of {o}, and each autumn back down to the valley farms.' },
    { k: 'rural', t: '{n} left the family farm in {o} to look for factory work in the capital city.' }
  ];
  function genKinds(r, ctx){
    var rt = r.pick(ROUTES), n = r.pick(NAMES), v = { n: n, o: PROVINCE[rt.o], d: PROVINCE[rt.d], m: PROVINCE[rt.m] };
    var sc = r.pick(MSCENES), K = MKINDS[sc.k];
    var same = Object.keys(MKINDS).filter(function(k){ return k !== sc.k && MKINDS[k].forced === K.forced; });
    var other = Object.keys(MKINDS).filter(function(k){ return MKINDS[k].forced !== K.forced; });
    var opts = [sc.k].concat(pickN(r, same, 2), pickN(r, other, 1));
    var stepF = choice('forced', 'Is this forced or voluntary migration?', [
      opt('Forced migration', K.forced, K.forced ? 'The person had to leave to stay safe: that is forced migration.' : 'Nothing forced this move. The person chose it, for work, family or a way of life.'),
      opt('Voluntary migration', !K.forced, !K.forced ? 'The person chose to move: that is voluntary migration.' : 'The person left because of danger or disaster, not by choice: that is forced migration.')
    ], '1.A', 'apply', true);
    var stepK = choice('kind', 'Which kind of migration is it?', opts.map(function(k){
      var slip = k === 'refugee' && sc.k === 'asylum' ? ' Here no decision has been made yet, so the person is still an asylum seeker.' :
        k === 'asylum' && sc.k === 'refugee' ? ' Here the government already recognized the need for protection: a refugee.' :
        k === 'refugee' && sc.k === 'idp' ? ' This person is still inside the same country.' :
        k === 'step' && sc.k === 'chain' ? ' Step migration is about stages of the move. Here the clue is family who went first.' :
        k === 'chain' && sc.k === 'step' ? ' Chain migration follows family who went first. Here the clue is the stages: village, town, city.' : '';
      return opt(MKINDS[k].name, k === sc.k, MKINDS[k].def + slip);
    }), '1.D', 'apply');
    return {
      type: 'kinds', ctx: ctx.id, topic: ctx.topic, given: { kind: sc.k, options: opts },
      text: '<p>Invented case. ' + esc(cap(fill(sc.t, v))) + '</p>',
      steps: [stepF, stepK],
      solution: [K.forced ? 'Forced: the person left because of danger or disaster.' : 'Voluntary: the person chose to move.', K.name + '. ' + K.def],
      figure: null
    };
  }

  /* Ravenstein's laws (CED 2.8), as usually taught from his 1885 and 1889
     papers on British data. The tool shows each law with its limits. */
  var LAWS = {
    short: { name: 'Most migrants move only a short distance.' },
    steps: { name: 'Migration often happens in steps.' },
    centers: { name: 'Long-distance migrants usually head for big centers of trade and industry.' },
    counter: { name: 'Each migration flow produces a smaller counterflow back.' },
    women: { name: 'Women migrate more within their own country; men more often go abroad.' }
  };
  var LAW_IDS = Object.keys(LAWS);
  function lawStep(right){
    var others = LAW_IDS.filter(function(k){ return k !== right; });
    return choice('law', 'Which of Ravenstein\'s laws do these data illustrate?', [right].concat(others.slice(0, 3)).map(function(k){
      return opt(LAWS[k].name, k === right, k === right ? 'The data show exactly this.' : 'That is one of Ravenstein\'s laws, but these data are about something else.');
    }), '3.C', 'analyze');
  }
  function genRavenstein(r, ctx){
    var v = r.pick(['short', 'counter', 'centers', 'women']), C = Calc(), province = r.pick(['west', 'north', 'south', 'east']), P = PROVINCE[province];
    var text, step, sol, given, flows;
    if(v === 'short'){
      // Counts in hundreds, chosen so the share is a whole percent.
      var total = r.pick([20, 25, 40, 50]) * 100, a = total * r.int(55, 75) / 100;
      var b = Math.round((total - a) * r.int(55, 75) / 100), c = total - a - b;
      var pct = C.evaluate({ fn: 'share', args: [a, total] });
      step = { key: 'pct', kind: 'num', label: 'What percent of all the moves were under 50 km?', hint: 'Divide the moves under 50 km by all the moves, then multiply by 100.', unit: '%', d: 0, practice: '3.B', level: 'apply',
        cell: M.cell(pct, 0.005, [{ value: C.evaluate({ fn: 'share', args: [a, b + c] }), why: 'You divided by the other moves only. Divide by all the moves: ' + fmtN(a) + ' + ' + fmtN(b) + ' + ' + fmtN(c) + '.' }, { value: C.evaluate({ fn: 'share', args: [c, total] }), why: 'That is the share of moves over 200 km. The question asks for moves under 50 km.' }], 0.51) };
      text = '<p>Invented survey for practice: where adults who moved in one year from ' + P + ' went.</p>' + table(['Distance moved', 'People'], [['Under 50 km', fmtN(a)], ['50 to 200 km', fmtN(b)], ['Over 200 km', fmtN(c)], ['All moves', fmtN(total)]]);
      sol = ['Percent = ' + fmtN(a) + ' / ' + fmtN(total) + ' × 100 = ' + M.fixed(pct, 0) + '%.', 'Most moves were short: Ravenstein\'s first law, most migrants move only a short distance.'];
      given = { v: v, a: a, b: b, c: c }; flows = flowsShort(province, a, b, c);
    } else if(v === 'counter'){
      var out = r.int(8, 18) * 1000, back = r.int(2, 5) * 1000;
      var net = C.evaluate({ fn: 'sub', args: [out, back] });
      step = { key: 'net', kind: 'num', label: 'What was the net gain of people for the Capital Region from this pair of flows?', hint: 'Net migration is the people who came minus the people who left.', unit: 'people', d: 0, practice: '3.B', level: 'apply',
        cell: M.cell(net, 0.0005, [{ value: C.evaluate({ fn: 'add', args: [out, back] }), why: 'You added the two flows. Net migration subtracts the flow out from the flow in.' }, { value: -net, why: 'The size is right but the sign is wrong: more people came to the capital than left it, so it gained.' }], 0.5) };
      text = '<p>Invented survey for practice: in one year, ' + fmtN(out) + ' people moved from ' + P + ' to the Capital Region, and ' + fmtN(back) + ' moved from the Capital Region to ' + P + '.</p>';
      sol = ['Net gain = ' + fmtN(out) + ' − ' + fmtN(back) + ' = ' + fmtN(net) + ' people.', 'A flow to the capital came with a smaller flow back: Ravenstein\'s law of counterflows.'];
      given = { v: v, out: out, back: back }; flows = [{ from: CENTER[province], to: CENTER.capital, w: out }, { from: CENTER.capital, to: CENTER[province], w: back, back: true }];
    } else if(v === 'centers'){
      var far = r.pick([2, 3, 4, 5]) * 100, big = far * r.int(70, 90) / 100;
      var p2 = C.evaluate({ fn: 'share', args: [big, far] });
      step = { key: 'pct', kind: 'num', label: 'What percent of the long-distance movers went to the capital or a large city?', hint: 'Divide the movers to the capital or a large city by all long-distance movers, then multiply by 100.', unit: '%', d: 0, practice: '3.B', level: 'apply',
        cell: M.cell(p2, 0.005, [{ value: C.evaluate({ fn: 'share', args: [far - big, far] }), why: 'That is the share that went to towns and villages. The question asks about the capital and large cities.' }, { value: C.evaluate({ fn: 'share', args: [big, far - big] }), why: 'You divided by the other movers only. Divide by all long-distance movers.' }], 0.51) };
      text = '<p>Invented survey for practice: ' + fmtN(far) + ' people moved more than 200 km from ' + P + ' in one year. Of them, ' + fmtN(big) + ' went to the capital or a large city; the rest went to towns and villages.</p>';
      sol = ['Percent = ' + fmtN(big) + ' / ' + fmtN(far) + ' × 100 = ' + M.fixed(p2, 0) + '%.', 'Long-distance movers went mostly to big centers: Ravenstein\'s law about long-distance migrants.'];
      given = { v: v, far: far, big: big }; flows = flowsCenters(province, big, far - big);
    } else {
      var within = r.pick([10, 20, 40]) * 100, w = within * r.int(56, 68) / 100, abroad = r.pick([10, 20]) * 100, wa = abroad * r.int(30, 42) / 100;
      var p3 = C.evaluate({ fn: 'share', args: [w, within] });
      step = { key: 'pct', kind: 'num', label: 'What percent of the people who moved within Country A were women?', hint: 'Divide the women who moved within the country by everyone who moved within it, then multiply by 100.', unit: '%', d: 0, practice: '3.B', level: 'apply',
        cell: M.cell(p3, 0.005, [{ value: C.evaluate({ fn: 'share', args: [within - w, within] }), why: 'That is the share of men. The question asks about women.' }, { value: C.evaluate({ fn: 'share', args: [w, within + abroad] }), why: 'You divided by every mover. Divide only by the people who moved within Country A.' }], 0.51) };
      text = '<p>Invented survey for practice: people who left ' + P + ' in one year.</p>' + table(['Moved', 'Women', 'Men', 'All'], [['Within Country A', fmtN(w), fmtN(within - w), fmtN(within)], ['To another country', fmtN(wa), fmtN(abroad - wa), fmtN(abroad)]]);
      sol = ['Percent = ' + fmtN(w) + ' / ' + fmtN(within) + ' × 100 = ' + M.fixed(p3, 0) + '%.', 'More women than men moved within the country, and fewer went abroad: Ravenstein\'s law about women and men.'];
      given = { v: v, w: w, within: within, wa: wa, abroad: abroad }; flows = null;
    }
    return {
      type: 'ravenstein', ctx: ctx.id, topic: ctx.topic, given: given,
      text: text, steps: [step, lawStep(v)], solution: sol.concat(['Ravenstein built his laws from British census data of the 1880s. Many still fit, but long-distance and international moves are far more common since then.']),
      figure: flows ? { kind: 'flows', flows: flows, from: province } : null
    };
  }
  function flowsShort(prov, a, b, c){
    // Many short arrows from the province's center to its own towns, a few longer, one long to the capital.
    var o = CENTER[prov], near = PLACES.filter(function(p){ return Math.hypot(p.x - o[0], p.y - o[1]) < 80 && p.rank <= 4; }).slice(0, 3);
    var mid = PLACES.filter(function(p){ var d = Math.hypot(p.x - o[0], p.y - o[1]); return d >= 120 && d < 220 && p.rank <= 3; }).slice(0, 2);
    var out = near.map(function(p){ return { from: o, to: [p.x, p.y], w: a / Math.max(1, near.length) }; });
    mid.forEach(function(p){ out.push({ from: o, to: [p.x, p.y], w: b / Math.max(1, mid.length) }); });
    var farP = PLACES.filter(function(p){ return p.rank <= 2 && Math.hypot(p.x - o[0], p.y - o[1]) >= 250; })[0] || BY.cap;
    out.push({ from: o, to: [farP.x, farP.y], w: c });
    return out;
  }
  function flowsCenters(prov, big, small){
    var o = CENTER[prov];
    var bigs = PLACES.filter(function(p){ return p.rank <= 2 && Math.hypot(p.x - o[0], p.y - o[1]) >= 200; }).slice(0, 2);
    var smalls = PLACES.filter(function(p){ return p.rank >= 3 && Math.hypot(p.x - o[0], p.y - o[1]) >= 200; }).slice(0, 2);
    return bigs.map(function(p){ return { from: o, to: [p.x, p.y], w: big / bigs.length }; }).concat(smalls.map(function(p){ return { from: o, to: [p.x, p.y], w: small / Math.max(1, smalls.length) }; }));
  }
  function fmtN(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function esc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function table(cols, rows){ return '<table class="dl-table"><thead><tr>' + cols.map(function(c){ return '<th scope="col">' + c + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function(rw){ return '<tr>' + rw.map(function(c, i){ return i ? '<td>' + c + '</td>' : '<th scope="row">' + c + '</th>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'; }

  var GEN = { diffusion: genDiffusion, mixed: genMixed, migration: genMigration, kinds: genKinds, ravenstein: genRavenstein };
  var TYPES = Object.keys(GEN);
  function generate(r, ctx, type){
    var t = type || r.pick(ctx.types || TYPES);
    if(!GEN[t]) throw new Error('diffusion-lab: unknown type ' + t);
    return GEN[t](r, ctx);
  }

  M.register('diffusionLab', {
    PLACES: PLACES, BY: BY, POLY: POLY, PROVINCE: PROVINCE, CENTER: CENTER, RANK: RANK, KINDS: KINDS, ORDER: ORDER, SLIP: SLIP, REAL: REAL,
    HEARTHS: HEARTHS, TRAITS: TRAITS, ROLE: ROLE, FACTORS: FACTORS, MKINDS: MKINDS, MSCENES: MSCENES, LAWS: LAWS, ROUTES: ROUTES, MIX: MIX,
    R_CONTAGIOUS: R_CONTAGIOUS, R_NEAR: R_NEAR,
    dist: dist, inPoly: inPoly, provinceOf: provinceOf, spread: spread, farCities: farCities, fmtN: fmtN,
    TYPES: TYPES, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
