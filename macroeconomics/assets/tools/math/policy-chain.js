/* Policy chain model: ApMacroMath.policyChain (docs/apmacro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T2, docs/apmacro-briefs/t2.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmacro-tool-checks/policy-chain.mjs) and the
   test (scripts/test/apmacro-tool-policy-chain.test.mjs) run exactly this code.

   A causal chain is a list of links, each a short statement with a
   direction, the graph that shows it (where it has one: an ApMacroGraph
   kind with its shifts) and the traps readers report for that link
   (docs/apmacro-authoring-guide.md, "Causal chains with every link"):
     fiscal       spending or taxes (taxes through disposable income and
                  consumption), AD with the multiplier, output, prices,
                  unemployment
     monetary     ample reserves (IORB, the policy rate) or limited reserves
                  (bonds, the money supply), then interest rates, investment,
                  AD, output and prices
     open         relative real interest rates, financial capital flows, the
                  demand for the currency, appreciation or depreciation, net
                  exports, AD
     crowding     a deficit, government borrowing, the demand for loanable
                  funds, the real interest rate, private investment, the
                  capital stock and long-run growth
     selfadjust   a gap, nominal wages and input prices, SRAS, back to full
                  employment (never AD, never automatic stabilizers)

     FAMILIES                    ids, names, variants, the direction words
     chain(family, variant, dir) -> { title, intro, links: [{ id, say, flip,
                                  traps: [[text, why]], graph?, words }] }
     next(chain, i, rng)         the choice step for link i: the link, the link
                                 after it (skipped a link), the link the wrong
                                 way, and its traps, each with why
     builder(chain, rng)         the "Make it specific" sentence: a slot per link
                                 for ApMacroGrade.specific
     write(chain)                the free-text hints: ApMacroGrade.flags rules
                                 (directional, mechanism) and the words of
                                 each link, so a written chain can be checked
                                 for skipped links (hints only, never a score)
     generate(rng, ctx, type)    the drills: one problem per family, every
                                 link after the first a graded step */
(function(G){
  'use strict';
  var M = G.ApMacroMath;
  if(!M) return;

  var FAMILIES = [
    { id: 'fiscal', name: 'Fiscal policy', short: 'Fiscal', variants: [{ id: 'spend', name: 'Spending' }, { id: 'tax', name: 'Taxes' }], dirs: ['Expansionary', 'Contractionary'] },
    { id: 'monetary', name: 'Monetary policy', short: 'Monetary', variants: [{ id: 'ample', name: 'Ample reserves' }, { id: 'limited', name: 'Limited reserves' }], dirs: ['Expansionary', 'Contractionary'] },
    { id: 'open', name: 'Open economy', short: 'Open economy', variants: [{ id: 'rates', name: 'Real interest rates' }], dirs: ['US rates rise', 'US rates fall'] },
    { id: 'crowding', name: 'Crowding out', short: 'Crowding out', variants: [{ id: 'deficit', name: 'Deficit spending' }], dirs: ['Bigger deficit', 'Smaller deficit'] },
    { id: 'selfadjust', name: 'Self-adjustment', short: 'Self-adjustment', variants: [{ id: 'gap', name: 'No policy' }], dirs: ['Inflationary gap', 'Recessionary gap'] }
  ];
  function familyOf(id){ return FAMILIES.filter(function(f){ return f.id === id; })[0]; }
  // A direction word pair: up when d > 0.
  function w(d, a, b){ return d > 0 ? a : b; }
  function L(id, say, flip, traps, graph, words){ return { id: id, say: say, flip: flip, traps: traps, graph: graph || null, words: words || [] }; }
  function ad(d){ return { kind: 'adas', shifts: { AD: d } }; }
  var FX = { currency: 'dollar', other: 'euro' };

  /* d: +1 expansionary (or the family's first direction word), -1 the other. */
  function chain(family, variant, d){
    d = d > 0 ? 1 : -1;
    var out = outcomeLink(d), links, title, intro;
    if(family === 'fiscal'){
      if(variant === 'tax'){
        title = w(d, 'A tax cut', 'A tax increase');
        intro = w(d, 'The government cuts personal income taxes.', 'The government raises personal income taxes.');
        links = [
          L('policy', w(d, 'Personal income taxes are cut', 'Personal income taxes are raised'), w(d, 'Personal income taxes are raised', 'Personal income taxes are cut'), [], null, ['tax']),
          L('income', w(d, 'Disposable income rises, so consumption rises', 'Disposable income falls, so consumption falls'), w(d, 'Disposable income falls, so consumption falls', 'Disposable income rises, so consumption rises'), [
            [w(d, 'Government purchases rise', 'Government purchases fall'), 'A tax change leaves government purchases alone; it works through households’ disposable income and consumption.'],
            [w(d, 'Interest rates fall, so investment rises', 'Interest rates rise, so investment falls'), 'That is the monetary policy chain. A tax change works through disposable income and consumption.']
          ], null, ['disposable income', 'consumption']),
          L('ad', w(d, 'AD shifts right, by the tax multiplier times the tax cut', 'AD shifts left, by the tax multiplier times the tax increase'), w(d, 'AD shifts left', 'AD shifts right'), [
            [w(d, 'SRAS shifts right', 'SRAS shifts left'), 'A change in income taxes on households changes spending, so it shifts AD, not SRAS.'],
            [w(d, 'AD shifts right by the full spending multiplier times the tax cut', 'AD shifts left by the full spending multiplier times the tax increase'), 'Part of a tax change is saved, so the tax multiplier (MPC / MPS) is smaller than the spending multiplier.']
          ], ad(d), ['AD', 'aggregate demand']),
          out
        ];
      } else {
        title = w(d, 'More government spending', 'Less government spending');
        intro = w(d, 'The government increases its purchases of goods and services.', 'The government cuts its purchases of goods and services.');
        links = [
          L('policy', w(d, 'Government purchases of goods and services increase', 'Government purchases of goods and services decrease'), w(d, 'Government purchases decrease', 'Government purchases increase'), [], null, ['government']),
          L('ad', w(d, 'AD shifts right, by more than the spending change (the multiplier)', 'AD shifts left, by more than the spending cut (the multiplier)'), w(d, 'AD shifts left', 'AD shifts right'), [
            [w(d, 'SRAS shifts right', 'SRAS shifts left'), 'Government purchases are spending on output, so they shift AD, not SRAS.'],
            [w(d, 'The money supply increases', 'The money supply decreases'), 'Fiscal policy is taxes and government spending. The money supply belongs to the central bank.'],
            [w(d, 'AD shifts right by exactly the spending change', 'AD shifts left by exactly the spending cut'), 'Each dollar spent becomes someone’s income and is partly spent again: AD shifts by the multiplier times the change.']
          ], ad(d), ['AD', 'aggregate demand']),
          out
        ];
      }
    } else if(family === 'monetary'){
      var lower = d > 0;
      if(variant === 'limited'){
        title = w(d, 'An open market purchase', 'An open market sale');
        intro = w(d, 'With limited reserves, the central bank buys government bonds on the open market.', 'With limited reserves, the central bank sells government bonds on the open market.');
        links = [
          L('policy', w(d, 'The central bank buys government bonds', 'The central bank sells government bonds'), w(d, 'The central bank sells government bonds', 'The central bank buys government bonds'), [], null, ['bond']),
          L('money', w(d, 'Bank reserves rise, so the money supply increases', 'Bank reserves fall, so the money supply decreases'), w(d, 'The money supply decreases', 'The money supply increases'), [
            [w(d, 'Money demand increases', 'Money demand decreases'), 'Buying or selling bonds changes banks’ reserves, so it shifts the money supply. Money demand depends on income, the price level and the interest rate.'],
            [w(d, 'The demand for loanable funds increases', 'The demand for loanable funds decreases'), 'Open market operations are drawn on the money market: the money supply shifts.']
          ], { kind: 'money', shifts: { MS: d } }, ['money supply']),
          L('rate', w(d, 'The nominal interest rate falls', 'The nominal interest rate rises'), w(d, 'The nominal interest rate rises', 'The nominal interest rate falls'), [
            ['The nominal interest rate stays the same', 'With limited reserves a shift in the money supply moves the interest rate (the ample-reserves result applies only to reserve supply in the flat range).']
          ], { kind: 'money', shifts: { MS: d } }, ['interest rate']),
          investLink(d), adLink(d), out
        ];
      } else {
        title = w(d, 'A lower IORB rate', 'A higher IORB rate');
        intro = w(d, 'With ample reserves, the Fed lowers the interest rate on reserve balances (IORB) and the ON RRP rate.', 'With ample reserves, the Fed raises the interest rate on reserve balances (IORB) and the ON RRP rate.');
        links = [
          L('policy', w(d, 'The Fed lowers the IORB rate', 'The Fed raises the IORB rate'), w(d, 'The Fed raises the IORB rate', 'The Fed lowers the IORB rate'), [], { kind: 'reserves', shifts: { RD: -d } }, ['IORB', 'reserve']),
          L('policy-rate', w(d, 'The policy rate (the federal funds rate) falls', 'The policy rate (the federal funds rate) rises'), w(d, 'The policy rate rises', 'The policy rate falls'), [
            [w(d, 'The supply of reserves shifts right', 'The supply of reserves shifts left'), 'With ample reserves, changing the administered rate moves the flat part of reserve demand; reserve supply does not move.'],
            [w(d, 'The reserve requirement falls', 'The reserve requirement rises'), 'The IORB rate and the reserve requirement are different tools; with ample reserves the requirement does not bind.']
          ], { kind: 'reserves', shifts: { RD: -d } }, ['policy rate', 'federal funds']),
          L('rates', w(d, 'Other interest rates fall, including rates on loans', 'Other interest rates rise, including rates on loans'), w(d, 'Other interest rates rise', 'Other interest rates fall'), [
            [w(d, 'The real interest rate in the loanable funds market rises', 'The real interest rate in the loanable funds market falls'), 'Banks borrow at the policy rate and lend above it, so the rates they charge move the same way as the policy rate.']
          ], { kind: 'money', shifts: { MS: d } }, ['interest rate']),
          investLink(d), adLink(d), out
        ];
      }
    } else if(family === 'open'){
      title = w(d, 'Higher US real interest rates', 'Lower US real interest rates');
      intro = w(d, 'Real interest rates in the United States rise relative to those in the euro area.', 'Real interest rates in the United States fall relative to those in the euro area.');
      var fxD = { kind: 'forex', names: FX, shifts: { D: d } };
      links = [
        L('rates', w(d, 'US real interest rates rise relative to those abroad', 'US real interest rates fall relative to those abroad'), w(d, 'US real interest rates fall', 'US real interest rates rise'), [], null, ['real interest rate']),
        L('capital', w(d, 'Financial capital flows into the United States as foreigners buy more US assets', 'Financial capital flows out of the United States as foreigners buy fewer US assets'),
          w(d, 'Financial capital flows out of the United States', 'Financial capital flows into the United States'), [
          [w(d, 'US exports rise', 'US exports fall'), 'Interest rates move financial capital first. Trade changes later, through the exchange rate.'],
          [w(d, 'US saving falls', 'US saving rises'), 'The question is about where lenders put their funds: higher returns attract foreign financial capital.']
        ], null, ['financial capital', 'capital flow', 'capital inflow', 'capital outflow', 'assets']),
        L('demand', w(d, 'Demand for the dollar increases on the foreign exchange market', 'Demand for the dollar decreases on the foreign exchange market'), w(d, 'Demand for the dollar decreases', 'Demand for the dollar increases'), [
          [w(d, 'The supply of dollars increases', 'The supply of dollars decreases'), 'Foreigners need dollars to buy US assets, so it is the demand for dollars that changes. The supply comes from US holders buying foreign goods and assets.']
        ], fxD, ['demand for the dollar', 'demand for dollars']),
        L('value', w(d, 'The dollar appreciates', 'The dollar depreciates'), w(d, 'The dollar depreciates', 'The dollar appreciates'), [
          ['The dollar’s value stays the same because the euro adjusts instead', 'An exchange rate is one price seen from two sides: if the dollar buys more euros, the euro buys fewer dollars.']
        ], fxD, ['apprecia', 'deprecia', 'value of the dollar']),
        L('nx', w(d, 'US goods cost more abroad and imports cost less, so net exports fall', 'US goods cost less abroad and imports cost more, so net exports rise'), w(d, 'Net exports rise', 'Net exports fall'), [
          [w(d, 'Net exports rise because US goods are worth more', 'Net exports fall because US goods are worth less'), 'A ' + w(d, 'stronger', 'weaker') + ' dollar makes US goods ' + w(d, 'more', 'less') + ' expensive to foreigners: exports ' + w(d, 'fall and imports rise', 'rise and imports fall') + '.']
        ], null, ['net exports', 'exports']),
        L('ad', w(d, 'AD shifts left', 'AD shifts right'), w(d, 'AD shifts right', 'AD shifts left'), [
          [w(d, 'SRAS shifts left', 'SRAS shifts right'), 'Net exports are part of spending (C + I + G + Xn), so they shift AD.']
        ], ad(-d), ['AD', 'aggregate demand'])
      ];
    } else if(family === 'crowding'){
      title = w(d, 'Deficit spending', 'A smaller deficit');
      intro = w(d, 'The government increases its spending without raising taxes, so the budget deficit grows.', 'The government cuts its spending, so the budget deficit shrinks.');
      var lf = { kind: 'lf', shifts: { DLF: d } };
      links = [
        L('deficit', w(d, 'The budget deficit grows', 'The budget deficit shrinks'), w(d, 'The budget deficit shrinks', 'The budget deficit grows'), [], null, ['deficit']),
        L('borrow', w(d, 'The government borrows more, so the demand for loanable funds increases', 'The government borrows less, so the demand for loanable funds decreases'), w(d, 'The demand for loanable funds decreases', 'The demand for loanable funds increases'), [
          [w(d, 'The supply of loanable funds increases', 'The supply of loanable funds decreases'), 'Government borrowing is a demand for loanable funds; the supply comes from saving.'],
          [w(d, 'The money supply increases', 'The money supply decreases'), 'Borrowing from savers does not create money. Crowding out is drawn on the loanable funds market.']
        ], lf, ['loanable funds', 'borrow']),
        L('rate', w(d, 'The real interest rate rises', 'The real interest rate falls'), w(d, 'The real interest rate falls', 'The real interest rate rises'), [
          [w(d, 'The nominal interest rate rises because the money supply falls', 'The nominal interest rate falls because the money supply rises'), 'Nothing happened to the money supply. More government borrowing raises the real interest rate in the loanable funds market.']
        ], lf, ['real interest rate', 'interest rate']),
        L('invest', w(d, 'Private investment falls: it is crowded out', 'Private investment rises: it is crowded in'), w(d, 'Private investment rises', 'Private investment falls'), [
          [w(d, 'Consumption rises because saving earns more', 'Consumption falls because saving earns less'), 'The link readers look for is investment: a ' + w(d, 'higher', 'lower') + ' real interest rate makes borrowing for capital ' + w(d, 'costlier', 'cheaper') + '.']
        ], null, ['investment', 'crowd']),
        L('growth', w(d, 'The capital stock grows more slowly, so long-run growth slows', 'The capital stock grows faster, so long-run growth speeds up'), w(d, 'Long-run growth speeds up', 'Long-run growth slows'), [
          [w(d, 'AD shifts right a second time', 'AD shifts left a second time'), 'Crowding out works through investment in capital, which decides how fast the economy can grow in the long run.'],
          [w(d, 'Unemployment falls to zero', 'Unemployment rises above its natural rate for good'), 'The long-run effect is on the capital stock and growth, not a permanent change in unemployment.']
        ], null, ['capital', 'growth'])
      ];
    } else {
      // selfadjust: d > 0 an inflationary gap, d < 0 a recessionary gap.
      var start = { AD: d };
      var gap = { kind: 'adas', start: start, shifts: {} }, fixd = { kind: 'adas', start: start, shifts: { SRAS: -d } };
      title = w(d, 'An inflationary gap, no policy', 'A recessionary gap, no policy');
      intro = w(d, 'Real output is above full employment and no policy is used.', 'Real output is below full employment and no policy is used.');
      links = [
        L('gap', w(d, 'Real output is above full employment, and unemployment is below its natural rate', 'Real output is below full employment, and unemployment is above its natural rate'), '', [], gap, ['full employment']),
        L('wages', w(d, 'Over time, nominal wages and other input prices rise', 'Over time, nominal wages and other input prices fall'), w(d, 'Nominal wages and other input prices fall', 'Nominal wages and other input prices rise'), [
          [w(d, 'Aggregate demand shifts left on its own', 'Aggregate demand shifts right on its own'), 'Self-adjustment works through wages and input prices, which shift SRAS. AD does not move without a policy or a shock.'],
          [w(d, 'The government cuts spending to close the gap', 'The government raises spending to close the gap'), 'That is fiscal policy. Self-adjustment is what happens with no policy at all.']
        ], gap, ['wage', 'input price']),
        L('sras', w(d, 'SRAS shifts left', 'SRAS shifts right'), w(d, 'SRAS shifts right', 'SRAS shifts left'), [
          [w(d, 'LRAS shifts left', 'LRAS shifts right'), 'Full-employment output does not change when wages adjust. SRAS moves.'],
          [w(d, 'AD shifts left', 'AD shifts right'), 'Wages and input prices are costs of production: they shift SRAS, not AD.']
        ], fixd, ['SRAS', 'short-run aggregate supply']),
        L('back', w(d, 'Real output returns to full employment at a higher price level', 'Real output returns to full employment at a lower price level'), w(d, 'Real output returns to full employment at a lower price level', 'Real output returns to full employment at a higher price level'), [
          [w(d, 'Real output stays above full employment for good', 'Real output stays below full employment for good'), 'In the long run wages adjust until output is back at full employment (LRAS).']
        ], fixd, ['full employment', 'price level'])
      ];
    }
    return { family: family, variant: variant, dir: d, title: title, intro: intro, links: links };
  }
  function investLink(d){
    return L('invest', w(d, 'Investment and interest-sensitive consumption rise', 'Investment and interest-sensitive consumption fall'), w(d, 'Investment falls', 'Investment rises'), [
      [w(d, 'Saving rises, so consumption falls', 'Saving falls, so consumption rises'), 'The link readers look for is spending: ' + w(d, 'cheaper', 'costlier') + ' borrowing ' + w(d, 'raises', 'cuts') + ' investment and purchases of durable goods.'],
      [w(d, 'The dollar appreciates, so net exports fall', 'The dollar depreciates, so net exports rise'), 'That is an open-economy link; the closed-economy chain goes through investment.']
    ], null, ['investment']);
  }
  function adLink(d){
    return L('ad', w(d, 'AD shifts right', 'AD shifts left'), w(d, 'AD shifts left', 'AD shifts right'), [
      [w(d, 'SRAS shifts right', 'SRAS shifts left'), 'Investment and consumption are spending, so they shift AD, not SRAS.']
    ], ad(d), ['AD', 'aggregate demand']);
  }
  function outcomeLink(d){
    return L('outcome', w(d, 'Real output rises, the price level rises and unemployment falls', 'Real output falls, the price level falls and unemployment rises'),
      w(d, 'Real output falls, the price level falls and unemployment rises', 'Real output rises, the price level rises and unemployment falls'), [
      [w(d, 'Real output rises, the price level falls and unemployment falls', 'Real output falls, the price level rises and unemployment rises'), 'Along an upward-sloping SRAS, a shift in AD moves real output and the price level the same way.'],
      [w(d, 'The price level rises but real output stays the same', 'The price level falls but real output stays the same'), 'In the short run a shift in AD changes real output too. Only in the long run does output return to full employment.']
    ], ad(d), ['output', 'price level', 'unemployment']);
  }

  /* The choice step for link i (i >= 1). */
  var SKIP_WHY = function(ch, i){ return 'Not yet: that comes later. First, ' + lc(ch.links[i].say) + '. Name every link in order.'; };
  function lc(t){ return /^[A-Z]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1); }
  function cap(t){ return t.charAt(0).toUpperCase() + t.slice(1); }
  function next(ch, i, r){
    var link = ch.links[i], seen = {}, opts = [];
    function add(t, why){ var k = t.toLowerCase(); if(seen[k]) return; seen[k] = 1; opts.push([cap(t) + '.', why]); }
    add(link.say, rightWhy(ch, i));
    var cands = [];
    if(ch.links[i + 1]) cands.push([ch.links[i + 1].say, SKIP_WHY(ch, i)]);
    if(link.flip) cands.push([link.flip, 'Right link, wrong direction: ' + lc(link.say) + '.']);
    link.traps.forEach(function(t){ cands.push(t); });
    // Fill to four, the skip and the flip first when there is room.
    var head = cands.slice(0, 2), tail = M.shuffle(r, cands.slice(2));
    head.concat(tail).forEach(function(c){ if(opts.length < 4) add(c[0], c[1]); });
    return { key: link.id, kind: 'choice', label: i === 1 ? 'What happens first?' : 'What happens next?', options: opts.map(function(o){ return o[0]; }), why: opts.map(function(o){ return o[1]; }), correct: 0,
      practice: link.id === 'outcome' || link.id === 'back' ? '3.A' : ch.family === 'open' ? '3.B' : '2.A' };
  }
  function rightWhy(ch, i){
    var l = ch.links[i], p = ch.links[i - 1];
    return cap(lc(p.say)) + ', so ' + lc(l.say) + '.';
  }

  /* The "Make it specific" sentence: one blank per link, graded by
     ApMacroGrade.specific (every slot exactly). */
  function builder(ch, r){
    var slots = {}, parts = [cap(ch.links[0].say)];
    ch.links.slice(1).forEach(function(l, k){
      var opts = [[l.say, '']], seen = {}; seen[l.say.toLowerCase()] = 1;
      [l.flip ? [l.flip, 'That is the right link the wrong way.'] : null].concat(l.traps).forEach(function(t){ if(t && !seen[t[0].toLowerCase()] && opts.length < 3){ seen[t[0].toLowerCase()] = 1; opts.push([t[0], t[1]]); } });
      var order = M.shuffle(r, opts.map(function(o, j){ return j; }));
      var name = 'link' + (k + 2);
      slots[name] = { label: 'Link ' + (k + 2), options: order.map(function(j){ return lc(opts[j][0]); }), correct: order.indexOf(0), why: order.map(function(j){ return opts[j][1]; }) };
      parts.push('{' + name + '}');
    });
    return { slots: slots, template: parts.join(' → ') };
  }
  /* The free-text hints for writing the chain out (flags: directional and
     mechanism, both ApMacroGrade.flags rules), and each link's words. */
  function write(ch){
    return { write: { directional: true, mechanism: true }, links: ch.links.map(function(l){ return { id: l.id, say: l.say, words: l.words }; }) };
  }
  /* Which links a written chain names (by their words): hints only. */
  function covered(ch, text){
    var t = ' ' + String(text || '').toLowerCase() + ' ';
    return ch.links.map(function(l){ return l.words.some(function(x){ return t.indexOf(x.toLowerCase()) > -1; }); });
  }

  /* ---------------------------------------------- the drills */
  function generate(r, c, type){
    var fams = c.families || FAMILIES.map(function(f){ return f.id; });
    var fam = type && fams.indexOf(type) > -1 ? type : r.pick(fams), F = familyOf(fam);
    var variant = r.pick(c.variants || F.variants.map(function(v){ return v.id; })), d = r.pick(c.dirs || [1, -1]);
    var ch = chain(fam, variant, d);
    var steps = [];
    for(var i = 1; i < ch.links.length; i++) steps.push(next(ch, i, r));
    var text = '<p>' + ch.intro + ' Build the chain: choose each link in order, from the ' + (fam === 'selfadjust' ? 'gap' : 'change') + ' to the end.</p>';
    var sol = ch.links.map(function(l, k){ return (k ? '→ ' : '') + cap(l.say) + '.'; });
    return { ctx: c.id, topic: c.topic, type: fam, text: text, steps: steps, solution: sol, given: { family: fam, variant: variant, dir: d }, figure: { kind: 'chain' } };
  }

  M.register('policyChain', {
    FAMILIES: FAMILIES, familyOf: familyOf, lc: lc, chain: chain, next: next, builder: builder, write: write, covered: covered,
    TYPES: FAMILIES.map(function(f){ return f.id; }),
    generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
