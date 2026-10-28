/* Energy flow model: ApEnvMath.energyFlow (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T2, docs/apenv-briefs/t2.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/energy-flow.mjs)
   and the test (scripts/test/apenv-tool-energy-flow.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/energy-flow.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/energy-flow.js.

   The model
     ECOS                     three ecosystems, each a food chain (one organism
                              per trophic level) and a small food web
     pyramid(eco, gpp, rPct, eff) -> { gpp, r, npp, levels: [{ energy, heat,
                              biomass, number, ... }] }
       GPP minus respiration (r = rPct % of GPP) is NPP, the energy stored in
       the producers (ApEnvCalc.npp). Level k (k = 0 for the producers) holds
       ApEnvCalc.tenPercent(NPP, k, eff) kcal/m²/yr. Standing biomass is that
       energy divided by the level's turnover (kcal of flow per gram of
       standing biomass per year, an illustrative value per organism), and the
       number per hectare is that biomass over one individual's mass. So the
       energy pyramid is always upright, while biomass (the pond: plankton
       turn over in days) or numbers (the forest: one oak feeds thousands of
       caterpillars) can be inverted.
     respond(eco, removedId) -> { id: { effect: 'gone'|'up'|'down'|'same', why } }
       a food web's first, most likely response to losing one species: its
       prey increase, a consumer left with nothing to eat dies out (and so on
       up the web), a predator with other food declines and eats more of that
       other food, and what a released prey eats declines (a trophic cascade).
   Drills (every number from ApEnvCalc, never typed)
     TYPES                    tenpct, reverse, npp, efficiency, pyramid, web
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution,
                              givens, figure } */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  function C(){ return M.Calc(); }

  var LEVEL_NAMES = ['producers', 'primary consumers', 'secondary consumers', 'tertiary consumers', 'quaternary consumers'];
  var LEVEL_SHORT = ['Producers', 'Primary consumers', 'Secondary consumers', 'Tertiary consumers', 'Quaternary consumers'];

  /* Each chain level: the organism (its illustration key), its turnover tb
     (kcal of energy flow per gram of standing biomass per year) and one
     individual's mass in grams. Illustrative values, chosen so each
     ecosystem shows its textbook pyramid shapes. */
  var ECOS = {
    grassland: {
      id: 'grassland', name: 'grassland', title: 'Grassland',
      chain: [
        { id: 'grass', name: 'grass', plural: 'grass plants', tb: 4, mass: 5 },
        { id: 'grasshopper', name: 'grasshopper', plural: 'grasshoppers', tb: 40, mass: 0.5 },
        { id: 'frog', name: 'frog', plural: 'frogs', tb: 20, mass: 20 },
        { id: 'snake', name: 'snake', plural: 'snakes', tb: 15, mass: 200 },
        { id: 'hawk', name: 'hawk', plural: 'hawks', tb: 100, mass: 1000 }
      ],
      web: [
        { id: 'grass', name: 'grass', eats: [] },
        { id: 'grasshopper', name: 'grasshoppers', eats: ['grass'] },
        { id: 'rabbit', name: 'rabbits', eats: ['grass'] },
        { id: 'mouse', name: 'mice', eats: ['grass', 'grasshopper'] },
        { id: 'frog', name: 'frogs', eats: ['grasshopper'] },
        { id: 'snake', name: 'snakes', eats: ['frog', 'mouse'] },
        { id: 'fox', name: 'foxes', eats: ['rabbit', 'mouse'] },
        { id: 'hawk', name: 'hawks', eats: ['rabbit', 'mouse', 'snake'] }
      ]
    },
    pond: {
      id: 'pond', name: 'pond', title: 'Pond',
      chain: [
        { id: 'phyto', name: 'phytoplankton', plural: 'phytoplankton cells', tb: 250, mass: 1e-7 },
        { id: 'zoo', name: 'zooplankton', plural: 'zooplankton', tb: 10, mass: 1e-4 },
        { id: 'minnow', name: 'minnow', plural: 'minnows', tb: 8, mass: 2 },
        { id: 'bass', name: 'bass', plural: 'bass', tb: 4, mass: 500 }
      ],
      web: [
        { id: 'phyto', name: 'phytoplankton', eats: [] },
        { id: 'pondweed', name: 'pondweed', eats: [] },
        { id: 'zoo', name: 'zooplankton', eats: ['phyto'] },
        { id: 'snail', name: 'snails', eats: ['phyto', 'pondweed'] },
        { id: 'minnow', name: 'minnows', eats: ['zoo'] },
        { id: 'sunfish', name: 'sunfish', eats: ['zoo', 'snail'] },
        { id: 'bass', name: 'bass', eats: ['minnow', 'sunfish'] },
        { id: 'heron', name: 'herons', eats: ['minnow', 'sunfish', 'bass'] }
      ]
    },
    forest: {
      id: 'forest', name: 'forest', title: 'Forest',
      chain: [
        { id: 'oak', name: 'oak tree', plural: 'oak trees', tb: 0.2, mass: 2e6 },
        { id: 'caterpillar', name: 'caterpillar', plural: 'caterpillars', tb: 20, mass: 0.5 },
        { id: 'warbler', name: 'warbler', plural: 'warblers', tb: 300, mass: 12 },
        { id: 'owl', name: 'owl', plural: 'owls', tb: 100, mass: 600 }
      ],
      web: [
        { id: 'oak', name: 'oak trees', eats: [] },
        { id: 'caterpillar', name: 'caterpillars', eats: ['oak'] },
        { id: 'deer', name: 'deer', eats: ['oak'] },
        { id: 'mouse', name: 'mice', eats: ['oak', 'caterpillar'] },
        { id: 'warbler', name: 'warblers', eats: ['caterpillar'] },
        { id: 'owl', name: 'owls', eats: ['mouse', 'warbler'] },
        { id: 'wolf', name: 'wolves', eats: ['deer'] }
      ]
    }
  };
  var ECO_IDS = ['grassland', 'pond', 'forest'];

  /* ---------------------------------------------------------- pyramids */
  function pyramid(ecoId, gpp, rPct, eff){
    var E = ECOS[ecoId] || ECOS.grassland, Cc = C();
    eff = eff == null ? 0.1 : eff; rPct = rPct == null ? 50 : rPct;
    var r = Cc.evaluate({ fn: 'percentOf', args: [rPct, gpp] });
    var npp = Cc.evaluate({ fn: 'npp', args: [gpp, r] });
    var levels = E.chain.map(function(o, k){
      var energy = Cc.evaluate({ fn: 'tenPercent', args: [npp, k, eff] });
      var biomass = energy / o.tb;
      return { k: k, n: k + 1, id: o.id, name: o.name, plural: o.plural, level: LEVEL_NAMES[k], levelShort: LEVEL_SHORT[k],
        energy: energy, biomass: biomass, number: biomass * 10000 / o.mass,
        share: Cc.evaluate({ fn: 'fractionOf', args: [energy, npp] }) };
    });
    levels.forEach(function(l, k){ l.lost = k + 1 < levels.length ? l.energy - levels[k + 1].energy : l.energy; });
    return { eco: E, gpp: gpp, r: r, rPct: rPct, npp: npp, eff: eff, levels: levels };
  }
  /* Is a pyramid of this quantity inverted anywhere (a level bigger than the one below)? */
  function inverted(P, key){
    for(var i = 1; i < P.levels.length; i++) if(P.levels[i][key] > P.levels[i - 1][key]) return i;
    return 0;
  }

  /* ---------------------------------------------------------- food webs */
  function webOf(ecoId){ return (ECOS[ecoId] || ECOS.grassland).web; }
  function byId(web, id){ for(var i = 0; i < web.length; i++) if(web[i].id === id) return web[i]; return null; }
  function eatersOf(web, id){ return web.filter(function(s){ return s.eats.indexOf(id) > -1; }); }
  /* Trophic position for drawing: producers 0, else 1 + the highest food's. */
  function webLevels(ecoId){
    var web = webOf(ecoId), lv = {};
    function L(id){
      if(lv[id] != null) return lv[id];
      var s = byId(web, id);
      lv[id] = !s.eats.length ? 0 : 1 + Math.max.apply(null, s.eats.map(L));
      return lv[id];
    }
    web.forEach(function(s){ L(s.id); });
    return lv;
  }
  function respond(ecoId, removed){
    var web = webOf(ecoId), out = {}, X = byId(web, removed);
    if(!X) return out;
    out[removed] = { effect: 'removed', why: 'Removed from the web.' };
    // 1. Consumers left with nothing to eat die out, and so on up the web.
    var gone = {}; gone[removed] = true;
    var changed = true;
    while(changed){
      changed = false;
      web.forEach(function(s){
        if(gone[s.id] || !s.eats.length) return;
        if(s.eats.every(function(f){ return gone[f]; })){
          gone[s.id] = true; changed = true;
          var lost = s.eats.map(function(f){ return byId(web, f).name; });
          out[s.id] = { effect: 'gone', why: 'Every food the ' + s.name + ' eat' + (lost.length > 1 ? 's' : '') + ' (' + lost.join(', ') + ') is gone, so they starve.' };
        }
      });
    }
    function set(id, effect, why, direct){ if(!out[id]) out[id] = { effect: effect, why: why, direct: !!direct }; }
    Object.keys(gone).forEach(function(g){ if(g !== removed) out[g].direct = true; });
    // 2. Direct effects: prey of X (or of a species that died out) are
    // released; eaters of X (or of a species that died out) lose a food.
    Object.keys(gone).forEach(function(g){
      var Gs = byId(web, g);
      Gs.eats.forEach(function(f){ if(!gone[f]) set(f, 'up', 'The ' + byId(web, f).name + ' are no longer eaten by ' + Gs.name + (g === removed ? '' : ', which died out') + ', so more survive.', true); });
      eatersOf(web, g).forEach(function(s){ if(!gone[s.id]) set(s.id, 'down', 'The ' + s.name + ' lose one of their foods (' + Gs.name + (g === removed ? '' : ', which died out') + '), so fewer can be fed.', true); });
    });
    // 3. Indirect, less certain: a hungrier predator eats more of its other
    // food; a released prey eats more of its own food (a trophic cascade).
    eatersOf(web, removed).forEach(function(s){
      if(gone[s.id]) return;
      s.eats.forEach(function(f){ if(f !== removed && !gone[f]) set(f, 'down', 'With fewer ' + X.name + ' to eat, the ' + s.name + ' may eat more ' + byId(web, f).name + '.'); });
    });
    web.forEach(function(s){
      if(!out[s.id] || out[s.id].effect !== 'up') return;
      s.eats.forEach(function(f){ if(!gone[f]) set(f, 'down', 'There are more ' + s.name + ', and they may eat more ' + byId(web, f).name + '.'); });
    });
    web.forEach(function(s){ set(s.id, 'same', 'No direct link to the ' + X.name + ', so little change at first.'); });
    return out;
  }

  /* ---------------------------------------------------------- drills */
  var TYPES = ['tenpct', 'reverse', 'npp', 'efficiency', 'pyramid', 'web'];
  var UNIT = 'kcal/m^2/yr', UNIT_T = 'kcal/m²/yr';
  function big(x){ var s = String(M.fmt(x, 6)); if(/e/.test(s)) return s; var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return p.join('.'); }
  function tenths(n){ var a = []; for(var i = 0; i < n; i++) a.push('0.1'); return a.join(' * '); }
  function tenthsT(n){ var a = []; for(var i = 0; i < n; i++) a.push('0.1'); return a.join(' × '); }
  function tens(n){ var a = []; for(var i = 0; i < n; i++) a.push('10'); return a.join(' * '); }
  function tensT(n){ var a = []; for(var i = 0; i < n; i++) a.push('10'); return a.join(' × '); }
  function ecoOf(ctx){ return ECOS[ctx && ctx.eco] || ECOS.grassland; }
  function choiceStep(key, label, options, correct, why, practice, extra){
    var s = { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: practice || '2.B' };
    for(var k in extra || {}) s[k] = extra[k];
    return s;
  }
  function stepsChoice(n){
    // How many transfers from the producers to level n + 1 (n transfers)?
    var opts = [1, 2, 3, 4], why = opts.map(function(k){
      if(k === n) return 'Right: count the arrows, not the levels. Producers to ' + LEVEL_NAMES[n] + ' is ' + n + ' transfer' + (n > 1 ? 's' : '') + '.';
      if(k === n + 1) return 'That counts the producers as a transfer. The energy starts in the producers; count the arrows: ' + n + '.';
      if(k === n - 1) return 'One short. Each feeding step up is one transfer: producers to primary consumers is the first.';
      return 'Count the feeding steps between the producers and the ' + LEVEL_NAMES[n] + ': ' + n + '.';
    });
    return choiceStep('steps', 'How many transfers does the energy make from the producers to the ' + LEVEL_NAMES[n] + '?', opts.map(String), opts.indexOf(n), why, '6.A', { fixed: true });
  }

  function genTenPct(r, ctx){
    var E = ecoOf(ctx), top = E.chain.length - 1;
    var n = r.int(2, Math.min(top, 4)), e0 = r.pick([1000, 2000, 5000, 8000, 10000, 20000, 25000, 40000, 50000]);
    var Cc = C(), ans = Cc.evaluate({ fn: 'tenPercent', args: [e0, n] });
    var once = Cc.evaluate({ fn: 'tenPercent', args: [e0, n + 1] }), short = Cc.evaluate({ fn: 'tenPercent', args: [e0, n - 1] });
    var org = E.chain[n];
    var text = '<p>In a ' + E.name + ', the producers (' + E.chain[0].name + ') store ' + big(e0) + ' ' + UNIT_T + ' as net primary productivity. Using the 10% rule, how much of that energy reaches the ' + LEVEL_NAMES[n] + ' (' + org.plural + ')?</p>';
    var mOnce = { why: 'That is 10% applied once too often: ' + n + ' transfer' + (n > 1 ? 's' : '') + ' means ' + n + ' factors of 0.1, one per arrow.' };
    var mShort = { why: 'That is one transfer short: the ' + LEVEL_NAMES[n] + ' are ' + n + ' feeding steps above the producers.' };
    return {
      type: 'tenpct', ctx: ctx.id, topic: ctx.topic, text: text,
      givens: { e0: e0, from: 1, to: n + 1, eco: E.id },
      figure: { kind: 'chain', eco: E.id, ask: n, known: { 0: e0 } },
      steps: [
        stepsChoice(n),
        { key: 'setup', kind: 'setup', practice: '6.B', label: 'Write the setup: the producers\' energy times 0.1 for each transfer.', hint: 'For example 5000 * 0.1 * 0.1 for two transfers.',
          cell: M.setupCell(e0 + ' * ' + tenths(n), { mustUse: [String(e0)], parens: false, times100: false,
            mistakes: [{ expr: e0 + ' * ' + tenths(n + 1), why: mOnce.why }, { expr: n > 1 ? e0 + ' * ' + tenths(n - 1) : String(e0), why: mShort.why }, { expr: e0 + ' * 0.9', why: 'The 90% is what is lost at each step. Keep 10% (× 0.1) per transfer.' }] }) },
        { key: 'ans', kind: 'unit', practice: '6.C', label: 'Energy reaching the ' + LEVEL_NAMES[n] + ', with its unit.',
          cell: M.unitCell(ans, UNIT, { mistakes: [{ value: once, why: mOnce.why }, { value: short, why: mShort.why }] }) }
      ],
      solution: [
        'The energy passes ' + n + ' feeding step' + (n > 1 ? 's' : '') + ': producers → ' + LEVEL_NAMES.slice(1, n + 1).join(' → ') + '.',
        'Setup: ' + big(e0) + ' ' + UNIT_T + ' × ' + tenthsT(n) + '.',
        '= ' + big(ans) + ' ' + UNIT_T + ' (that is ' + M.fmt(ans / e0 * 100, 3) + '% of the producers\' energy).',
        'The other ' + M.fmt(100 - ans / e0 * 100, 4) + '% left the chain, mostly as heat from cellular respiration.'
      ]
    };
  }

  function genReverse(r, ctx){
    var E = ecoOf(ctx), top = E.chain.length - 1;
    var n = r.int(2, Math.min(top, 4)), need = r.pick([2, 4, 5, 8, 10, 12, 15, 20, 25, 30, 50]);
    var Cc = C(), ans = Cc.evaluate({ fn: 'div', args: [need, { fn: 'tenPercent', args: [1, n] }] });
    var once = Cc.evaluate({ fn: 'div', args: [need, { fn: 'tenPercent', args: [1, n + 1] }] }), times = Cc.evaluate({ fn: 'tenPercent', args: [need, n] });
    var org = E.chain[n];
    var text = '<p>The ' + org.plural + ' of a ' + E.name + ' are ' + LEVEL_NAMES[n] + '. To survive, they need ' + big(need) + ' ' + UNIT_T + '. If 10% of the energy passes up each level, how much energy must the producers (' + E.chain[0].name + ') store?</p>';
    return {
      type: 'reverse', ctx: ctx.id, topic: ctx.topic, text: text,
      givens: { need: need, steps: n, eco: E.id },
      figure: { kind: 'chain', eco: E.id, ask: 0, known: (function(){ var o = {}; o[n] = need; return o; })() },
      steps: [
        stepsChoice(n),
        { key: 'setup', kind: 'setup', practice: '6.B', label: 'Write the setup. Going down the chain, each level needs 10 times the energy of the one above.', hint: 'For example 20 * 10 * 10, or 20 / (0.1 * 0.1).',
          cell: M.setupCell(need + ' * ' + tens(n), { mustUse: [String(need)], parens: false, times100: false,
            mistakes: [{ expr: need + ' * ' + tenths(n), why: 'That multiplies by 0.1, as if energy went up the chain. Going down to the producers, divide by 0.1 (× 10) for each step.' }, { expr: need + ' * ' + tens(n + 1), why: 'One factor of 10 too many: ' + n + ' transfers, so ' + n + ' factors of 10.' }] }) },
        { key: 'ans', kind: 'unit', practice: '6.C', label: 'Energy the producers must store, with its unit.',
          cell: M.unitCell(ans, UNIT, { mistakes: [{ value: once, why: 'One factor of 10 too many: count the transfers, not the levels.' }, { value: times, why: 'That is smaller than what the ' + org.plural + ' need. Producers must hold more energy than any level above them.' }] }) }
      ],
      solution: [
        'Each level holds only 10% of the level below, so each level below holds 10 times the level above.',
        'Setup: ' + big(need) + ' ' + UNIT_T + ' × ' + tensT(n) + ' (or ' + big(need) + ' ÷ ' + M.fmt(Math.pow(0.1, n), 3) + ').',
        '= ' + big(ans) + ' ' + UNIT_T + '.'
      ]
    };
  }

  function genNpp(r, ctx){
    var E = ecoOf(ctx), Cc = C();
    var gpp = r.pick([4000, 5000, 6000, 8000, 10000, 12000, 15000, 20000, 24000, 30000]);
    // Never 50%: then NPP equals respiration and the answer is a number in the stem.
    var rPct = r.pick([35, 40, 45, 55, 60, 65]);
    var resp = Cc.evaluate({ fn: 'percentOf', args: [rPct, gpp] });
    var npp = Cc.evaluate({ fn: 'npp', args: [gpp, resp] });
    var heatWhy = ['Right. Cellular respiration releases the energy as heat, which leaves the ecosystem; it is never recycled.',
      'Respiration uses up that energy; it is not stored. What the producers store is the NPP.',
      'Consumers get only what the producers store (the NPP), not the energy they burned.',
      'Energy flows one way. Heat cannot be turned back into chemical energy by the ecosystem.'];
    var reverse = r() < 0.4;
    if(reverse){
      var text2 = '<p>Producers in a ' + E.name + ' store ' + big(npp) + ' ' + UNIT_T + ' as net primary productivity (NPP) and use ' + big(resp) + ' ' + UNIT_T + ' in cellular respiration. What is their gross primary productivity (GPP)?</p>';
      return {
        type: 'npp', ctx: ctx.id, topic: ctx.topic, text: text2,
        givens: { npp: npp, r: resp, find: 'gpp', eco: E.id },
        figure: { kind: 'budget', eco: E.id, gpp: null, r: resp, npp: npp },
        steps: [
          { key: 'setup', kind: 'setup', practice: '6.B', label: 'Write the setup for GPP.', hint: 'GPP is everything the producers capture: NPP plus what respiration used.',
            cell: M.setupCell(npp + ' + ' + resp, { mustUse: [String(npp), String(resp)], parens: false, times100: false,
              mistakes: [{ expr: npp + ' - ' + resp, why: 'GPP is the bigger number: NPP + respiration. NPP = GPP − respiration.' }] }) },
          { key: 'ans', kind: 'unit', practice: '6.C', label: 'GPP, with its unit.',
            cell: M.unitCell(gpp, UNIT, { mistakes: [{ value: Cc.evaluate({ fn: 'sub', args: [npp, resp] }), why: 'GPP = NPP + respiration; you subtracted.' }] }) },
          choiceStep('heat', 'Where does the energy the producers used in cellular respiration go?', ['It leaves the ecosystem as heat', 'It is stored in the producers\' biomass', 'It passes to the primary consumers', 'It is recycled back to the producers'], 0, heatWhy, '1.B')
        ],
        solution: ['GPP = NPP + respiration.', 'Setup: ' + big(npp) + ' + ' + big(resp) + ' ' + UNIT_T + '.', '= ' + big(gpp) + ' ' + UNIT_T + '.', 'The respiration energy left as heat; only the NPP is available to consumers.']
      };
    }
    var c1 = Cc.evaluate({ fn: 'tenPercent', args: [npp, 1] });
    var text = '<p>Producers in a ' + E.name + ' capture ' + big(gpp) + ' ' + UNIT_T + ' of solar energy in photosynthesis (gross primary productivity, GPP). They use ' + big(resp) + ' ' + UNIT_T + ' in their own cellular respiration. What is their net primary productivity (NPP), and how much energy reaches the primary consumers?</p>';
    return {
      type: 'npp', ctx: ctx.id, topic: ctx.topic, text: text,
      givens: { gpp: gpp, r: resp, find: 'npp', eco: E.id },
      figure: { kind: 'budget', eco: E.id, gpp: gpp, r: resp, npp: null },
      steps: [
        { key: 'setup', kind: 'setup', practice: '6.B', label: 'Write the setup for NPP.', hint: 'NPP is what is left after the producers\' own respiration.',
          cell: M.setupCell(gpp + ' - ' + resp, { mustUse: [String(gpp), String(resp)], parens: false, times100: false,
            mistakes: [{ expr: gpp + ' + ' + resp, why: 'Respiration is used up, not added: NPP = GPP − respiration.' }, { expr: gpp + ' * 0.1', why: 'The 10% rule is for transfers between levels. NPP is GPP minus the producers\' respiration.' }] }) },
        { key: 'ans', kind: 'unit', practice: '6.C', label: 'NPP, with its unit.',
          cell: M.unitCell(npp, UNIT, { mistakes: [{ value: Cc.evaluate({ fn: 'add', args: [gpp, resp] }), why: 'NPP = GPP − respiration; you added.' }] }) },
        { key: 'prim', kind: 'unit', practice: '6.C', label: 'Energy reaching the primary consumers (10% rule), with its unit.', hint: 'Take 10% of the NPP: NPP × 0.1.',
          cell: M.unitCell(c1, UNIT, { mistakes: [{ value: Cc.evaluate({ fn: 'tenPercent', args: [gpp, 1] }), why: 'Consumers can only eat what the producers stored: take 10% of the NPP, not of the GPP.' }] }) },
        choiceStep('heat', 'Where does the energy the producers used in cellular respiration go?', ['It leaves the ecosystem as heat', 'It is stored in the producers\' biomass', 'It passes to the primary consumers', 'It is recycled back to the producers'], 0, heatWhy, '1.B')
      ],
      solution: ['NPP = GPP − respiration.', 'Setup: ' + big(gpp) + ' − ' + big(resp) + ' ' + UNIT_T + ' = ' + big(npp) + ' ' + UNIT_T + '.', 'Primary consumers: ' + big(npp) + ' × 0.1 = ' + big(c1) + ' ' + UNIT_T + '.', 'The respiration energy left as heat; it is never recycled.']
    };
  }

  function genEfficiency(r, ctx){
    var E = ecoOf(ctx), Cc = C(), k = r.int(0, E.chain.length - 2);
    var ea = r.pick([2000, 2500, 4000, 5000, 6000, 8000, 10000, 12000]), pct = r.pick([4, 5, 6, 8, 12, 14, 15, 16, 18, 20]);
    if(k > 0) ea = ea / 10;
    var eb = Cc.evaluate({ fn: 'percentOf', args: [pct, ea] });
    var ans = Cc.evaluate({ fn: 'fractionOf', args: [eb, ea] });
    var lo = E.chain[k], hi = E.chain[k + 1];
    var text = '<p>Researchers measured the energy in two levels of a ' + E.name + ' food chain: the ' + lo.plural + ' (' + LEVEL_NAMES[k] + ') hold ' + big(ea) + ' ' + UNIT_T + ', and the ' + hi.plural + ' that eat them hold ' + big(eb) + ' ' + UNIT_T + '. What percent of the energy was passed on?</p>';
    var cmp = pct > 10 ? 0 : 1;
    return {
      type: 'efficiency', ctx: ctx.id, topic: ctx.topic, text: text,
      givens: { ea: ea, eb: eb, eco: E.id },
      figure: { kind: 'pair', eco: E.id, k: k, ea: ea, eb: eb },
      steps: [
        { key: 'setup', kind: 'setup', practice: '6.B', label: 'Write the setup for the transfer efficiency, as a percent.', hint: 'The part passed on over what was there, times 100.',
          cell: M.setupCell(eb + ' / ' + ea + ' * 100', { mustUse: [String(eb), String(ea)],
            mistakes: [{ expr: ea + ' / ' + eb + ' * 100', why: 'Upside down: divide the energy passed on (the higher level) by the energy available (the lower level).' }] }) },
        { key: 'ans', kind: 'unit', practice: '6.C', label: 'Transfer efficiency, with its unit.',
          cell: M.unitCell(ans, '%', { mistakes: [{ value: Cc.evaluate({ fn: 'fractionOf', args: [ea, eb] }), why: 'Upside down: higher level ÷ lower level × 100.' }] }) },
        choiceStep('cmp', 'Compared with the 10% rule of thumb, this transfer is', ['more efficient than 10%', 'less efficient than 10%'], cmp,
          [pct > 10 ? 'Right: ' + pct + '% is above 10%. The 10% rule is an average; real transfers range from about 5% to 20%.' : 'Look again: ' + pct + '% is below 10%, so less energy passed than the rule of thumb.',
           pct > 10 ? 'Look again: ' + pct + '% is above 10%, so more energy passed than the rule of thumb.' : 'Right: ' + pct + '% is below 10%. The 10% rule is an average; real transfers range from about 5% to 20%.'], '5.C', { fixed: true })
      ],
      solution: ['Efficiency = energy passed on ÷ energy available × 100.', 'Setup: ' + big(eb) + ' ÷ ' + big(ea) + ' × 100.', '= ' + M.fmt(ans, 4) + '%.']
    };
  }

  var INV = {
    pond: { key: 'biomass', what: 'biomass', opts: [
      ['Phytoplankton reproduce so fast that a small standing biomass can feed a larger biomass of zooplankton', 'Right. A biomass pyramid shows what is there at one moment. Phytoplankton are eaten and replaced within days, so a small standing crop feeds more zooplankton. Energy over a year still drops at each step.'],
      ['Zooplankton make their own food by photosynthesis', 'Zooplankton are consumers: they eat the phytoplankton.'],
      ['Energy increases as it moves up a pond food chain', 'Energy always decreases up a food chain; about 90% leaves each level, mostly as heat.'],
      ['The 10% rule does not apply in water', 'The rule applies in every ecosystem: about 10% of the energy passes each step.']] },
    forest: { key: 'number', what: 'numbers', opts: [
      ['One large oak tree feeds thousands of small caterpillars', 'Right. A pyramid of numbers counts individuals, not their size. One oak holds enough energy for thousands of tiny caterpillars, so that level is wider than the producer level.'],
      ['Caterpillars are producers, so they outnumber the trees', 'Caterpillars are primary consumers; they eat oak leaves.'],
      ['Energy increases as it moves up a forest food chain', 'Energy always decreases up a food chain; about 90% leaves each level, mostly as heat.'],
      ['Oak trees eat caterpillars', 'The arrows point from food to eater: caterpillars eat oak leaves.']] }
  };
  function genPyramid(r, ctx){
    var E = INV[(ctx || {}).eco] ? ecoOf(ctx) : ECOS.pond, I = INV[E.id];
    var text = '<p>The figure shows the pyramid of ' + I.what + ' for a ' + E.name + '. The second level is wider than the first: the pyramid is inverted at its base.</p>';
    var ewhy = ['Right. Energy is lost at every transfer (mostly as heat from respiration), so each level gets less energy than the one below. An energy pyramid is never inverted.',
      'No. A level cannot receive more energy than the level below it holds; energy is lost at every transfer.',
      'No. Even with fast turnover, the energy flowing through each level per year still drops at each step.'];
    return {
      type: 'pyramid', ctx: ctx.id, topic: ctx.topic, text: text,
      givens: { eco: E.id, key: I.key },
      figure: { kind: 'pyramid', eco: E.id, key: I.key },
      steps: [
        choiceStep('why', 'Why can this pyramid be inverted?', I.opts.map(function(o){ return o[0]; }), 0, I.opts.map(function(o){ return o[1]; }), '2.B'),
        choiceStep('energy', 'Could the energy pyramid of this ' + E.name + ' be inverted?', ['No, never', 'Yes, whenever the ' + I.what + ' pyramid is', 'Yes, when the producers reproduce quickly'], 0, ewhy, '2.B')
      ],
      solution: ['Pyramids of biomass and numbers show what is there at one moment, so they can be inverted.', 'An energy pyramid shows the energy flowing through each level per year. Energy is lost at each transfer, so it is always upright.']
    };
  }

  var EFFECT_OPTS = ['Increase', 'Decrease', 'Die out', 'Stay about the same'];
  var EFFECT_IDX = { up: 0, down: 1, gone: 2, same: 3 };
  function webQuestions(ecoId){
    // every (removed, other) pair whose first effect is clear in this model
    var web = webOf(ecoId), out = [];
    web.forEach(function(x){
      var res = respond(ecoId, x.id);
      web.forEach(function(y){ if(y.id !== x.id && res[y.id] && res[y.id].direct) out.push({ x: x.id, y: y.id, effect: res[y.id].effect, why: res[y.id].why }); });
    });
    return out;
  }
  function genWeb(r, ctx){
    var E = ecoOf(ctx), web = E.web, all = webQuestions(E.id);
    var xs = web.map(function(s){ return s.id; }).filter(function(id){
      var qs = all.filter(function(q){ return q.x === id; });
      return qs.length >= 2 && qs.some(function(q){ return q.effect !== qs[0].effect; });
    });
    var x = r.pick(xs);
    var qs = M.shuffle(r, all.filter(function(q){ return q.x === x; }));
    var a = qs[0], b = qs.filter(function(q){ return q.effect !== a.effect; })[0];
    var X = byId(web, x);
    function step(q, key){
      var Y = byId(web, q.y), c = EFFECT_IDX[q.effect];
      var why = EFFECT_OPTS.map(function(o, i){ return i === c ? 'Right. ' + q.why : 'Follow the arrows into and out of the ' + Y.name + '. ' + q.why; });
      return choiceStep(key, 'What most likely happens to the ' + Y.name + ' first?', EFFECT_OPTS.slice(), c, why, '2.B', { fixed: true });
    }
    var text = '<p>In this ' + E.name + ' food web, each arrow points from a food to the organism that eats it. A disease wipes out the ' + X.name + '.</p>';
    return {
      type: 'web', ctx: ctx.id, topic: ctx.topic, text: text,
      givens: { eco: E.id, x: x, ys: [a.y, b.y] },
      figure: { kind: 'web', eco: E.id, removed: x, ask: [a.y, b.y] },
      steps: [step(a, 'w1'), step(b, 'w2')],
      solution: [a.why, b.why, 'Real webs can also adjust later (animals switch foods, numbers recover); these are the first, most likely effects.']
    };
  }

  function generate(r, ctx, type){
    ctx = ctx || {};
    type = type || r.pick(ctx.types || TYPES);
    switch(type){
      case 'tenpct': return genTenPct(r, ctx);
      case 'reverse': return genReverse(r, ctx);
      case 'npp': return genNpp(r, ctx);
      case 'efficiency': return genEfficiency(r, ctx);
      case 'pyramid': return genPyramid(r, ctx);
      case 'web': return genWeb(r, ctx);
    }
    throw new Error('energy-flow: unknown problem type ' + type);
  }

  M.register('energyFlow', {
    ECOS: ECOS, ECO_IDS: ECO_IDS, LEVEL_NAMES: LEVEL_NAMES, LEVEL_SHORT: LEVEL_SHORT, UNIT: UNIT, UNIT_T: UNIT_T,
    pyramid: pyramid, inverted: inverted, webOf: webOf, webLevels: webLevels, respond: respond, webQuestions: webQuestions,
    big: big, TYPES: TYPES, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
