/* Borders lab model: ApHugMath.bordersLab (docs/aphug-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/aphug-briefs/t4.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/aphug-tool-checks/borders-lab.mjs) and the
   test (scripts/test/aphug-tool-borders-lab.test.mjs) run exactly this code.

   What it knows:
     TYPES_B   the six boundary types the CED names (4.4): antecedent,
               subsequent, consequent, superimposed, geometric, relict. A
               boundary is antecedent or subsequent by WHEN it was drawn, and
               may also be consequent, superimposed, geometric or relict:
               one boundary can fit more than one type.
     story(f)  an invented boundary history from its facts { first:
               'line' | 'people', extra: 'consequent' | 'superimposed' |
               'geometric' | 'relict', drawn, settled } -> sentences
     SHAPES    compact, elongated, prorupted, perforated, fragmented (an
               older classification many classes still teach; the current
               CED does not list it), each with an outline and its usual
               challenge
     FORCES    centripetal and centrifugal scenes in Country A, and the CED's
               devolution factors (4.8)
     ZONES     UNCLOS 1982 zones measured from the baseline: territorial sea
               to 12 nautical miles, contiguous zone to 24, exclusive
               economic zone to 200, the high seas beyond
     REAL      four real boundaries for Explore (one mark on a region base map), worded with
               dates and as "often classed as"; no disputed place is marked

   generate(r, ctx, type) -> one drill problem for ApHugTools.drill:
     boundary   an invented history and its map: antecedent or subsequent,
                then which other type it also is
     shape      an invented outline: its shape, then its usual challenge
     forces     a scene: centripetal or centrifugal, then the devolution factor
                or the outcome the CED ties to it
     sea        the zones as a model item, a ship's distance (the rights there),
                and an overlap of two EEZs worked with ApHugCalc */
(function(root){
  'use strict';
  var M = root.ApHugMath;
  if(!M) return;
  function Calc(){ return root.ApHugCalc; }

  /* ------------------------------------------------------ boundary types */
  var BTYPES = {
    antecedent: { name: 'Antecedent boundary', def: 'An antecedent boundary was drawn before many people lived in the area.' },
    subsequent: { name: 'Subsequent boundary', def: 'A subsequent boundary was drawn after people had settled the area, as the cultural landscape took shape.' },
    consequent: { name: 'Consequent boundary', def: 'A consequent boundary is drawn to follow a cultural divide, such as where one language or religion gives way to another.' },
    superimposed: { name: 'Superimposed boundary', def: 'A superimposed boundary is forced on an area by an outside power, often cutting across the groups who live there.' },
    geometric: { name: 'Geometric boundary', def: 'A geometric boundary is a straight line, such as a line of latitude or longitude, that ignores the land and the people.' },
    relict: { name: 'Relict boundary', def: 'A relict boundary no longer works as a border, but traces of it remain in the landscape.' }
  };
  var EXTRA = ['consequent', 'superimposed', 'geometric', 'relict'];
  // A consequent or superimposed line comes after the people it follows or cuts.
  var EXTRA_FIRST = { consequent: ['people'], superimposed: ['people'], geometric: ['line', 'people'], relict: ['line', 'people'] };
  var FEATURE = { geometric: 'a straight survey line', consequent: 'the line where most people stop speaking Ardic and start speaking Bessan', superimposed: 'a line drawn by the outside empire of Corvia', relict: 'an old line' };

  /* The story of a boundary from its facts. Years and names are invented. */
  function story(f){
    var s = [];
    var drawn = f.drawn, settled = f.settled;
    var who = f.extra === 'superimposed' ? 'officials of Corvia, an empire that ruled both lands from far away,' : 'Country A and Country B';
    var line = f.extra === 'geometric' ? 'a straight line along the 41st parallel, across hills and rivers alike' :
      f.extra === 'consequent' ? 'the line where most villages speak Ardic on one side and Bessan on the other' :
      f.extra === 'superimposed' ? 'a line through the middle of the lands of the Ardic people, who live on both sides of it' :
      'a line along the Tarn valley';
    if(f.first === 'line'){
      s.push('In ' + drawn + ', ' + who + ' agreed on a border: ' + line + '.');
      s.push('Almost no one lived there then; farm towns grew up on both sides after ' + settled + '.');
    } else {
      s.push('Farm towns spread across the area from about ' + settled + '.');
      s.push('In ' + drawn + ', ' + (f.extra === 'superimposed' ? who + ' drew a border: ' + line : who + ' agreed on a border: ' + line) + '.');
    }
    if(f.extra === 'relict') s.push('In ' + (drawn + 50) + ' the two countries joined into one. The old border no longer divides them, but a line of old customs posts still stands along it.');
    return s;
  }
  var WHEN_SLIP = {
    antecedent: 'Subsequent means drawn after people settled. Here the border came first, in {d}, and the towns grew later, after {s}.',
    subsequent: 'Antecedent means drawn before many people lived there. Here the towns were there from about {s}, before the border of {d}.'
  };
  var EXTRA_SLIP = {
    consequent: { superimposed: 'Superimposed means an outside power drew it. Here the two countries agreed on it themselves; it follows the language divide.', geometric: 'A geometric line ignores the people. This one bends to follow where the languages change.', relict: 'A relict border no longer works. Nothing here says the border was given up.' },
    superimposed: { consequent: 'A consequent line follows a cultural divide. This one cuts through one people\'s land, so it ignores the divide.', geometric: 'Nothing says it is straight. What stands out is that an outside empire drew it across one people\'s land.', relict: 'A relict border no longer works. Nothing here says it was given up.' },
    geometric: { consequent: 'A consequent line follows a cultural divide. A straight survey line ignores both the land and the people.', superimposed: 'Superimposed means an outside power drew it. Here the two countries agreed on it.', relict: 'A relict border no longer works. Nothing says this one was given up.' },
    relict: { consequent: 'Nothing says the line followed a cultural divide. What matters is that it no longer divides anyone: the two countries joined.', superimposed: 'Superimposed means an outside power drew it. The clue here is that it stopped being a border but left traces.', geometric: 'Nothing says the line is straight. The clue is that it no longer works as a border but left traces.' }
  };

  /* ---------------------------------------------------------- state shapes */
  // Outlines on a 200 x 140 box (the page scales them).
  var SHAPES = {
    compact: { name: 'Compact', def: 'A compact state is about as wide as it is long, so no part is far from the center.', challenge: 'Few: short distances make it easier to govern and to connect.', real: 'Poland is often given as an example.',
      d: ['M60 30 L120 18 L165 40 L178 85 L150 120 L95 128 L48 106 L35 66 Z'] },
    elongated: { name: 'Elongated', def: 'An elongated state is long and thin.', challenge: 'Places at the far ends are hard to reach and govern from the capital.', real: 'Chile is the usual example.',
      d: ['M18 70 L40 58 L80 54 L120 50 L160 44 L188 50 L184 66 L150 74 L110 82 L70 86 L30 90 Z'] },
    prorupted: { name: 'Prorupted', def: 'A prorupted state is compact with one long arm, a proruption, reaching out.', challenge: 'The arm is hard to defend and connect, though it may reach a river, a sea or a resource.', real: 'Thailand and Namibia are often given as examples.',
      d: ['M30 30 L95 22 L120 50 L112 92 L72 108 L36 92 L22 60 Z M112 64 L186 70 L186 82 L110 82 Z'] },
    perforated: { name: 'Perforated', def: 'A perforated state completely surrounds another state.', challenge: 'The state inside depends on the one around it for trade and transport.', real: 'South Africa, which surrounds Lesotho, is the usual example.',
      d: ['M40 22 L150 18 L180 64 L160 118 L60 124 L24 78 Z', 'M88 58 L118 56 L126 80 L98 90 L82 78 Z'], hole: 1 },
    fragmented: { name: 'Fragmented', def: 'A fragmented state is split into pieces, such as islands, with no land link between them.', challenge: 'The pieces are hard to connect, so trade, travel and a shared identity are harder.', real: 'Indonesia and the Philippines are often given as examples.',
      d: ['M20 70 L48 52 L72 66 L60 96 L28 96 Z', 'M84 40 L112 30 L130 50 L110 70 L88 62 Z', 'M120 86 L150 76 L168 94 L146 112 L122 106 Z', 'M160 30 L184 26 L190 46 L170 54 Z'] }
  };
  var SHAPE_IDS = Object.keys(SHAPES);

  /* -------------------------------------------------------------- forces */
  var FACTORS = {
    physical: { name: 'Physical division', def: 'Mountains, seas or distance cut a region off from the rest of the state.' },
    separatism: { name: 'Ethnic separatism', def: 'An ethnic group wants its own state or self-rule for its region.' },
    terrorism: { name: 'Terrorism', def: 'A group uses violence against people to force political change.' },
    economic: { name: 'Economic and social problems', def: 'Unequal wealth, jobs or services make one region feel left out.' },
    irredentism: { name: 'Irredentism', def: 'A state claims land in another state because people there share its culture.' },
    cleansing: { name: 'Ethnic cleansing', def: 'Forcing an ethnic group out of an area, or killing its members, so another group controls it.' }
  };
  var FIDS = ['physical', 'separatism', 'terrorism', 'economic', 'irredentism'];
  var OUTCOMES = {
    cohesion: 'Stronger cultural cohesion: people feel part of one nation',
    infra: 'Fairer infrastructure: roads and services reach every region',
    failed: 'A failed state: the government loses control of its territory',
    uneven: 'Uneven development: some regions grow rich while others fall behind'
  };
  var SCENES = [
    { force: 'centripetal', out: 'infra', t: 'Country A builds a railway that links every provincial capital to the capital city, with the same fares for all.' },
    { force: 'centripetal', out: 'cohesion', t: 'Every school in Country A teaches the same national history, and a holiday honors the founding of the country.' },
    { force: 'centripetal', out: 'cohesion', t: 'Country A\'s national football team, with players from every province, reaches a world final; crowds celebrate in every region.' },
    { force: 'centripetal', out: 'infra', t: 'Country A uses taxes from the rich Capital Region to build clinics and schools in the poorest provinces.' },
    { force: 'centrifugal', factor: 'separatism', t: 'Most people in the Eastern Plains speak Bessan, not the national language. A Bessan movement has asked for its own state since 1990.' },
    { force: 'centrifugal', factor: 'physical', t: 'The Western Uplands are cut off from the capital by mountains for five months a year, and people there say the government forgets them.' },
    { force: 'centrifugal', factor: 'economic', t: 'Almost every new factory and road in Country A is in the Capital Region; incomes in the Southern Forest have fallen for ten years.' },
    { force: 'centrifugal', factor: 'irredentism', t: 'Country B claims the Lake District of Country A, because most people there speak Country B\'s language.' },
    { force: 'centrifugal', factor: 'terrorism', t: 'An armed group bombs rail lines in the South Coast to try to force the government out of the province.' }
  ];

  /* --------------------------------------------------------------- the sea */
  // UNCLOS (1982): limits in nautical miles from the baseline.
  var ZONES = [
    { id: 'ts', name: 'Territorial sea', to: 12, rights: 'The coastal state\'s laws apply, as on land; foreign ships may pass through peacefully (innocent passage).' },
    { id: 'cz', name: 'Contiguous zone', to: 24, rights: 'The coastal state may enforce its customs, tax, immigration and health laws.' },
    { id: 'eez', name: 'Exclusive economic zone', to: 200, rights: 'The coastal state controls the fish, oil, gas and other resources; ships of every country may sail through.' },
    { id: 'hs', name: 'High seas', to: Infinity, rights: 'No state controls them; they are open to every country (international waters).' }
  ];
  function zoneAt(nm){ for(var i = 0; i < ZONES.length; i++) if(nm <= ZONES[i].to) return ZONES[i]; return ZONES[3]; }
  function seaModel(){
    return { layout: 'stages', title: 'Zones of the sea, from the coast outward (UNCLOS)', unit: 'zone',
      slots: [{ id: 'z1', name: 'Baseline to 12 nautical miles' }, { id: 'z2', name: '12 to 24 nautical miles' }, { id: 'z3', name: '24 to 200 nautical miles' }, { id: 'z4', name: 'Beyond 200 nautical miles' }],
      pieces: [{ id: 'ts', text: 'Territorial sea' }, { id: 'cz', text: 'Contiguous zone' }, { id: 'eez', text: 'Exclusive economic zone' }, { id: 'hs', text: 'High seas' }, { id: 'dmz', text: 'Demilitarized zone' }],
      key: { z1: 'ts', z2: 'cz', z3: 'eez', z4: 'hs' },
      slips: [{ piece: 'eez', slot: 'z1', why: 'The EEZ reaches out to 200 nautical miles. The first 12, where the state\'s laws apply in full, are the territorial sea.' },
        { piece: 'ts', slot: 'z3', why: 'The territorial sea is only the first 12 nautical miles. Out to 200 is the exclusive economic zone.' },
        { piece: 'dmz', slot: 'z4', why: 'A demilitarized zone is a strip where armies may not go, usually on land. Beyond 200 nautical miles are the high seas.' }] };
  }
  var SHIPS = [
    { what: 'a foreign cargo ship sailing straight through without stopping', ask: 'What may Country A do?' },
    { what: 'a foreign fishing boat hauling in nets', ask: 'Who controls the fish there?' },
    { what: 'a boat that Country A\'s coast guard suspects of smuggling goods past customs', ask: 'What may Country A do?' }
  ];
  function shipAnswer(z, ship){
    if(ship === 1){ return z.id === 'hs' ? 'No state: the fish of the high seas are open to every country' : 'Country A: the resources within 200 nautical miles are its own'; }
    if(ship === 2){ return z.id === 'ts' || z.id === 'cz' ? 'Stop and search it to enforce its customs laws' : 'Not enforce customs here: that power ends at 24 nautical miles'; }
    return z.id === 'ts' ? 'Let it pass peacefully: foreign ships have innocent passage' : 'Nothing: ships of every country may sail through';
  }

  /* --------------------------------------------------------- real cases */
  var REAL = [
    { mark: 'A', base: 'north-america', at: [-110, 49], name: 'Canada and the United States, west of the Great Lakes', types: ['geometric', 'antecedent'], text: 'Agreed in 1818 and 1846 along the 49th parallel, a line of latitude, before most settlers arrived in the West. Often classed as geometric and antecedent.' },
    { mark: 'B', base: 'europe', at: [10.6, 51.4], name: 'The former border between East and West Germany', types: ['relict'], text: 'Drawn between occupation zones after 1945 and fortified until 1989. Germany reunified in 1990; parts of the fence and watchtowers remain as memorials. A relict boundary.' },
    { mark: 'C', base: 'north-africa-sw-asia', at: [14, 22.5], name: 'Straight borders across the Sahara (Libya, Niger, Algeria)', types: ['geometric', 'superimposed'], text: 'Drawn by European colonial powers in the late 1800s and early 1900s (for example, an 1899 agreement between Britain and France), with little regard for the peoples who lived there. Often classed as geometric and superimposed.' },
    { mark: 'D', base: 'south-asia', at: [74.4, 30.6], name: 'India and Pakistan in Punjab', types: ['superimposed', 'consequent'], text: 'Drawn in 1947 by a commission of the departing British government, told to follow, with other factors, where areas with a Muslim majority met areas without one. Often classed as superimposed and consequent.' }
  ];

  /* ------------------------------------------------------------ helpers */
  function opt(t, ok, why){ return { t: t, ok: ok, why: why }; }
  function choice(key, label, opts, practice, level, fixed){
    var c = -1; opts.forEach(function(o, i){ if(o.ok) c = i; });
    var s = { key: key, kind: 'choice', label: label, options: opts.map(function(o){ return o.t; }), why: opts.map(function(o){ return (o.ok ? 'Yes. ' : 'Not this one. ') + o.why; }), correct: c, practice: practice || '1.A', level: level || 'apply' };
    if(fixed) s.fixed = true;
    return s;
  }
  function shuffled(r, list){ return M.shuffle(r, list.slice()); }

  /* ------------------------------------------------------------ types */
  function genBoundary(r, ctx){
    var extra = r.pick(EXTRA), first = r.pick(EXTRA_FIRST[extra]);
    var settled = r.int(17, 18) * 100 + r.pick([10, 20, 30, 40, 50, 60]);
    var drawn = first === 'line' ? settled - r.pick([30, 40, 50, 60]) : settled + r.pick([40, 50, 60, 70, 80]);
    if(first === 'line' && drawn >= settled) settled = drawn + 40;
    if(first === 'people' && drawn <= settled) drawn = settled + 40;
    var f = { first: first, extra: extra, drawn: drawn, settled: settled };
    var when = first === 'line' ? 'antecedent' : 'subsequent';
    var s1 = choice('when', 'Was this border drawn before or after most people settled there?', ['antecedent', 'subsequent'].map(function(k){
      return opt(BTYPES[k].name + (k === 'antecedent' ? ': drawn before' : ': drawn after'), k === when, k === when ? BTYPES[k].def : WHEN_SLIP[when].replace('{d}', drawn).replace('{s}', settled));
    }), '1.D', 'apply', true);
    var s2 = choice('extra', 'A boundary can fit more than one type. Which other type does this one fit?', EXTRA.map(function(k){
      return opt(BTYPES[k].name, k === extra, k === extra ? BTYPES[k].def : EXTRA_SLIP[extra][k]);
    }), '1.D', 'analyze', true);
    var s3 = choice('function', 'What does this border most likely do today?', relictOrNot(extra), '2.B', 'analyze');
    return {
      type: 'boundary', ctx: ctx.id, topic: ctx.topic, given: f,
      text: '<p>Invented case. ' + story(f).join(' ') + '</p>',
      steps: [s1, s2, s3],
      solution: [BTYPES[when].name + ': ' + (first === 'line' ? 'drawn in ' + drawn + ', before the towns that grew after ' + settled + '.' : 'the towns were there from about ' + settled + ', before the border of ' + drawn + '.'),
        'It is also ' + article(BTYPES[extra].name) + '. ' + BTYPES[extra].def,
        extra === 'relict' ? 'It no longer divides two states; its traces are part of the cultural landscape.' : 'It still divides two states, so it controls who and what crosses.'],
      figure: { kind: 'boundary', facts: f }
    };
  }
  function relictOrNot(extra){
    var rel = extra === 'relict';
    return [
      opt('It still divides two states and controls who and what crosses', !rel, !rel ? 'Nothing says the border was given up, so it still works as a border.' : 'The two countries joined, so it no longer divides anyone.'),
      opt('It no longer divides states, but its traces remain in the landscape', rel, rel ? 'That is what makes it relict: the customs posts still stand.' : 'Nothing says the countries joined or the border was given up.'),
      opt('It was never a real border, only a line on a map', false, 'It was agreed and used as a border; the story says so.'),
      opt('It moves each year with where people live', false, 'Borders do not move by themselves; changing one takes an agreement or force.')
    ];
  }
  function article(s){ return (/^[AEIOU]/i.test(s) ? 'an ' : 'a ') + s.toLowerCase(); }

  function genShape(r, ctx){
    var k = r.pick(SHAPE_IDS), S = SHAPES[k];
    var flip = r() < 0.5, rot = r.pick([0, 0, 90, 180]);
    var s1 = choice('shape', 'Which shape is this invented state?', SHAPE_IDS.map(function(id){
      return opt(SHAPES[id].name, id === k, SHAPES[id].def + (id === k ? '' : ' That does not match this outline.'));
    }), '2.A', 'apply', true);
    var others = SHAPE_IDS.filter(function(id){ return id !== k; });
    var s2 = choice('challenge', 'What challenge does a state with this shape most often face?', [k].concat(shuffled(r, others).slice(0, 3)).map(function(id){
      return opt(SHAPES[id].challenge, id === k, id === k ? S.def : 'That fits a ' + SHAPES[id].name.toLowerCase() + ' state. ' + SHAPES[id].def);
    }), '2.B', 'analyze');
    return {
      type: 'shape', ctx: ctx.id, topic: ctx.topic, given: { shape: k },
      text: '<p>Invented case. The outline shows an invented state' + (k === 'perforated' ? ' and the smaller state inside it (shaded lighter)' : '') + '. State shapes are an older way to classify states; the current course framework does not list them, but many classes still use them.</p>',
      steps: [s1, s2],
      solution: [S.name + '. ' + S.def, S.challenge, S.real],
      figure: { kind: 'shape', shape: k, flip: flip, rot: rot }
    };
  }

  function genForces(r, ctx){
    var sc = r.pick(SCENES), cp = sc.force === 'centripetal';
    var s1 = choice('force', 'Is this a centripetal or a centrifugal force for Country A?', [
      opt('Centripetal: it pulls the state together', cp, cp ? 'A centripetal force unifies the people of a state.' : 'A centripetal force unites people. This one divides a region from the rest of the state.'),
      opt('Centrifugal: it pulls the state apart', !cp, !cp ? 'A centrifugal force divides a state.' : 'A centrifugal force divides people. This one gives every region something in common.')
    ], '1.D', 'apply', true);
    var s2;
    if(cp){
      var outs = ['cohesion', 'infra', 'failed', 'uneven'];
      s2 = choice('outcome', 'Which outcome does this force most likely lead to?', outs.map(function(o){
        return opt(OUTCOMES[o], o === sc.out, o === sc.out ? 'Centripetal forces such as this can lead to it.' : o === 'failed' || o === 'uneven' ? 'That is an outcome of centrifugal forces, the opposite of this one.' : 'That is also a centripetal outcome, but this scene is about ' + (sc.out === 'infra' ? 'roads and services reaching every region.' : 'a shared identity.'));
      }), '2.C', 'analyze');
    } else {
      var picks = [sc.factor].concat(shuffled(r, FIDS.filter(function(x){ return x !== sc.factor; })).slice(0, 3));
      s2 = choice('factor', 'Which devolution factor does the scene show?', picks.map(function(x){
        return opt(FACTORS[x].name, x === sc.factor, FACTORS[x].def + (x === sc.factor ? '' : ' That is not what the scene describes.'));
      }), '1.D', 'apply');
    }
    return {
      type: 'forces', ctx: ctx.id, topic: ctx.topic, given: { force: sc.force, factor: sc.factor || null, out: sc.out || null },
      text: '<p>Invented case. ' + sc.t + '</p>',
      steps: [s1, s2],
      solution: [cp ? 'Centripetal: it unifies the state.' : 'Centrifugal: it divides the state.', cp ? OUTCOMES[sc.out] + '.' : FACTORS[sc.factor].name + '. ' + FACTORS[sc.factor].def + ' Devolution moves power from the central government to regions, and can end in breakup.'],
      figure: { kind: 'forces', force: sc.force }
    };
  }

  function genSea(r, ctx){
    var C = Calc(), shipI = r.int(0, 2), nm = r.pick([6, 9, 18, 20, 40, 90, 150, 180, 230, 260]);
    if(shipI === 2 && nm > 24 && r() < 0.5) nm = r.pick([10, 18, 20]);
    var z = zoneAt(nm), ship = SHIPS[shipI], right = shipAnswer(z, shipI);
    var all = [];
    ZONES.forEach(function(zz){ var a = shipAnswer(zz, shipI); if(all.indexOf(a) < 0) all.push(a); });
    var fills = { 0: 'Board it and seize the cargo', 1: 'Whoever catches the fish first', 2: 'Close the sea to all ships' };
    all.push(fills[shipI]);
    if(shipI === 0) all.push('Charge a fee for passing');
    all = all.slice(0, 4);
    var s2 = choice('ship', 'Country A\'s coast guard sees ' + ship.what + ' ' + nm + ' nautical miles from Country A\'s baseline. ' + ship.ask, all.map(function(a){
      return opt(a, a === right, a === right ? nm + ' nautical miles out is in the ' + z.name.toLowerCase() + '. ' + z.rights : nm + ' nautical miles out is in the ' + z.name.toLowerCase() + '. ' + z.rights);
    }), '2.B', 'apply');
    var D = r.pick([220, 240, 260, 280, 320, 340, 360, 380]);
    var ov = C.evaluate({ fn: 'sub', args: [{ fn: 'mul', args: [2, 200] }, D] });
    var s3 = { key: 'overlap', kind: 'num', label: 'Country A and Country B face each other across a sea ' + D + ' nautical miles wide. Each claims an exclusive economic zone of 200 nautical miles. How many nautical miles wide is the strip both claim?', hint: 'Add the two zones, then subtract the width of the sea.', unit: 'nautical miles', d: 0, practice: '2.A', level: 'apply',
      cell: M.cell(ov, 0.0005, [{ value: C.evaluate({ fn: 'sub', args: [D, 200] }), why: 'That is how far Country A\'s zone ends from Country B\'s coast. Add both zones (400) and subtract the width of the sea.' }, { value: C.evaluate({ fn: 'div', args: [D, 2] }), why: 'That is the halfway line, often used to split an overlap. The question asks how wide the overlap is.' }, { value: 400, why: 'That is the two zones together. Subtract the width of the sea.' }], 0.5) };
    return {
      type: 'sea', ctx: ctx.id, topic: ctx.topic, given: { nm: nm, ship: shipI, D: D },
      text: '<p>Invented case. Country A has a long coast. The UN Convention on the Law of the Sea (UNCLOS, 1982) sets zones measured from a coast\'s baseline in nautical miles (one nautical mile is about 1.85 km).</p>',
      steps: [{ key: 'zones', kind: 'model', label: 'Place each zone of the sea, from the coast outward.', model: seaModel(), practice: '1.A', level: 'recall' }, s2, s3],
      solution: ['From the baseline: territorial sea to 12 nautical miles, contiguous zone to 24, exclusive economic zone to 200, then the high seas.',
        nm + ' nautical miles out is in the ' + z.name.toLowerCase() + '. ' + z.rights,
        'Overlap = 200 + 200 − ' + D + ' = ' + M.fixed(ov, 0) + ' nautical miles. The two states must agree on a line; a line halfway between the coasts is common.'],
      figure: { kind: 'sea', nm: nm }
    };
  }

  var GEN = { boundary: genBoundary, shape: genShape, forces: genForces, sea: genSea };
  var TYPES = Object.keys(GEN);
  function generate(r, ctx, type){
    var t = type || r.pick(ctx.types || TYPES);
    if(!GEN[t]) throw new Error('borders-lab: unknown type ' + t);
    return GEN[t](r, ctx);
  }

  M.register('bordersLab', {
    BTYPES: BTYPES, EXTRA: EXTRA, EXTRA_FIRST: EXTRA_FIRST, FEATURE: FEATURE, SHAPES: SHAPES, SHAPE_IDS: SHAPE_IDS, FACTORS: FACTORS, FIDS: FIDS,
    OUTCOMES: OUTCOMES, SCENES: SCENES, ZONES: ZONES, SHIPS: SHIPS, REAL: REAL,
    story: story, zoneAt: zoneAt, seaModel: seaModel, shipAnswer: shipAnswer, TYPES: TYPES, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
