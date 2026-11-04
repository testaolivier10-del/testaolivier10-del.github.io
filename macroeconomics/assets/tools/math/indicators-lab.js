/* Economic indicators lab model: ApMacroMath.indicatorsLab (docs/apmacro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T3, docs/apmacro-briefs/t3.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmacro-tool-checks/indicators-lab.mjs) and the
   test (scripts/test/apmacro-tool-indicators-lab.test.mjs) run exactly this code.

   Every number comes from ApMacroCalc (calc() below, a recipe each).

   Explore (the page draws these)
     TX                      transactions, each { id, cat, text, why }: cat C, I,
                             G, X, CM (consumption of an import: in C, then
                             subtracted as M), IM (investment in an import),
                             none (not in this year's US GDP)
     economy(r)              8 transactions with amounts, at least one of each
                             spending kind and three that are not counted
     totals(items)           { C, I, G, X, M, NX, gdp } of a list (gdp from
                             ApMacroCalc.gdp)
     BASKET, YEARS, prices(base)  the CPI basket: cost per year, CPI with the
                             chosen base year, inflation, a nominal and real wage
     NOMINAL                 nominal GDP and the deflator: real GDP per year
     JOBS0, EVENTS, jobEvent(st, id), rates(st)   100 adults, the events that
                             move them, and the rates (ApMacroCalc)
   Test yourself: generate(r, ctx, type), types 'gdp-count', 'gdp-calc' (context
   gdp, topic gdp-circular-flow), 'cpi' (prices, price-indices-inflation),
   'real' (real, real-nominal-gdp), 'unemp', 'utype' (jobs, unemployment).
   Every choice step's key is option 0 (the page shuffles). The PPI is never
   calculated (CED 2.4). */
(function(root){
  'use strict';
  var M = root.ApMacroMath;
  if(!M) return;
  function calc(fn){ return M.Calc().evaluate({ fn: fn, args: [].slice.call(arguments, 1) }); }
  function n(x, d){
    var s = M.fixed(Math.abs(x), d == null ? 2 : d).replace(/\.?0+$/, '');
    if(s === '') s = '0';
    var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (x < 0 && Number(s.replace(/,/g, '')) ? '−' : '') + p.join('.');
  }
  function usd(x, unit){ return (x < 0 ? '−' : '') + '$' + n(Math.abs(x)) + (unit ? ' ' + unit : ''); }
  function money2(x){ return '$' + M.fixed(x, 2); }

  var TYPES = ['gdp-count', 'gdp-calc', 'cpi', 'real', 'unemp', 'utype'];
  var TITLE = { 'gdp-count': 'What counts in GDP', 'gdp-calc': 'GDP by expenditure', cpi: 'CPI and inflation', real: 'Real versus nominal GDP', unemp: 'Unemployment and participation rates', utype: 'Types of unemployment' };
  var CAT = { C: 'Consumption (C)', I: 'Investment (I)', G: 'Government purchases (G)', X: 'Net exports (X − M)', none: 'Not counted in this year\'s US GDP' };
  var CAT_WHY = {
    C: 'Consumption is households buying new final goods and services.',
    I: 'Investment is firms buying new capital (machines, buildings), newly built homes, and goods added to inventories.',
    G: 'Government purchases are goods and services governments buy: salaries, roads, equipment. Transfer payments are not purchases.',
    X: 'Net exports are what the rest of the world buys from US producers minus what the US buys from abroad.',
    none: 'GDP leaves out transfers, financial assets, used goods, intermediate goods, unpaid household work and production in other countries.'
  };

  /* ------------------------------------------------------- transactions */
  var TX = [
    { id: 'fridge', cat: 'C', text: 'A family buys a new refrigerator made in Ohio this year.', why: 'A household buying a new final good: consumption.' },
    { id: 'haircut', cat: 'C', text: 'You pay a barber for a haircut.', why: 'Services count too: a household buying a service is consumption.' },
    { id: 'rent', cat: 'C', text: 'A student pays rent on an apartment.', why: 'Housing services bought by a household: consumption.' },
    { id: 'groceries', cat: 'C', text: 'Households buy groceries at the supermarket.', why: 'Food bought by households is a final good: consumption.' },
    { id: 'dentist', cat: 'C', text: 'A family pays a dentist for a checkup.', why: 'A service bought by a household: consumption.' },
    { id: 'trucks', cat: 'I', text: 'A trucking company buys five new trucks built in the US this year.', why: 'New capital bought by a firm: investment.' },
    { id: 'house', cat: 'I', text: 'A family buys a house that was built this year.', why: 'A newly built home is counted as investment (residential construction), not consumption.', trap: { C: 'A newly built home is the exception: GDP counts it as investment, not consumption.' } },
    { id: 'inventory', cat: 'I', text: 'A furniture maker\'s sofas made this year sit unsold in its warehouse at year end.', why: 'Goods produced but not yet sold are added to inventories, which counts as investment.', trap: { none: 'They were produced in the US this year, so they count: unsold output is inventory investment.' } },
    { id: 'datacenter', cat: 'I', text: 'A tech firm builds a new data center.', why: 'A new building for a business is capital: investment.' },
    { id: 'firefighters', cat: 'G', text: 'A city pays the salaries of its firefighters.', why: 'A government buying workers\' services: government purchases.' },
    { id: 'bridge', cat: 'G', text: 'The state builds a new bridge.', why: 'A government buying a new structure: government purchases.' },
    { id: 'ship', cat: 'G', text: 'The navy buys a new ship from a US shipyard.', why: 'A government buying a new good: government purchases.' },
    { id: 'soybeans', cat: 'X', text: 'A farm in Iowa sells soybeans to a buyer in Japan.', why: 'Made in the US and bought abroad: an export, so it adds to net exports.' },
    { id: 'tourist', cat: 'X', text: 'A tourist from Mexico pays for a hotel stay in Texas.', why: 'A US service bought by a foreign visitor is an export.', trap: { C: 'The buyer is a foreign household, so this is an export, not US consumption.' } },
    { id: 'plane', cat: 'X', text: 'A US aircraft maker sells a new airplane to an airline in India.', why: 'Made in the US and sold abroad: an export.' },
    { id: 'laptops', cat: 'CM', text: 'US households buy new laptops made in China.', why: 'Counted in consumption, then subtracted as an import: it adds nothing to US GDP, because it was not produced here.' },
    { id: 'scanner', cat: 'IM', text: 'A US hospital buys new medical scanners made in Germany.', why: 'Counted in investment, then subtracted as an import: no change in US GDP.' },
    { id: 'socsec', cat: 'none', text: 'The government sends Social Security checks to retirees.', why: 'A transfer payment: nothing is produced in exchange, so it is not a government purchase.', trap: { G: 'Social Security is a transfer payment: the government buys nothing with it, so it is not in G.' } },
    { id: 'ubenefit', cat: 'none', text: 'A laid-off worker receives unemployment benefits.', why: 'A transfer payment: no good or service is produced for it.', trap: { G: 'Unemployment benefits are a transfer payment, not a purchase of a good or service.' } },
    { id: 'stock', cat: 'none', text: 'You buy shares of stock in a company.', why: 'A financial asset changes hands; nothing new is produced.', trap: { I: 'Buying stock is a financial transaction, not investment in the GDP sense (new capital goods).' } },
    { id: 'bond', cat: 'none', text: 'You buy a government savings bond.', why: 'A financial asset, not a good or service.', trap: { I: 'A bond is a financial asset. In GDP, investment means new capital goods.' } },
    { id: 'usedcar', cat: 'none', text: 'You buy a used car from your neighbor.', why: 'The car was counted in GDP the year it was made; reselling it produces nothing new.', trap: { C: 'A used car was counted when it was new. Only new production counts.' } },
    { id: 'flour', cat: 'none', text: 'A bakery buys flour to bake the bread it sells.', why: 'An intermediate good: its value is already in the price of the bread, so counting it would count it twice.', trap: { I: 'Flour used up in the bread is an intermediate good, not capital: counting it would double-count.' } },
    { id: 'cooking', cat: 'none', text: 'A parent cooks dinner at home for the family.', why: 'Unpaid household work is not bought or sold, so GDP leaves it out.' },
    { id: 'mexico', cat: 'none', text: 'A US-owned factory in Mexico makes cars sold in Mexico.', why: 'GDP counts production inside the country: these cars are in Mexico\'s GDP.', trap: { X: 'Nothing crosses the border from the US: the cars are made and sold in Mexico.' } }
  ];
  var byCat = function(c){ return TX.filter(function(t){ return t.cat === c; }); };
  var AMT = { C: [40, 60, 80, 120], I: [30, 40, 50, 70], G: [20, 30, 40, 50], X: [20, 25, 30, 40], CM: [15, 20, 25], IM: [10, 15, 20], none: [10, 20, 30, 50] };

  function economy(r){
    var pick = function(cat){ return r.pick(byCat(cat)); };
    var list = [pick('C'), pick('C'), pick('I'), pick('G'), pick('X'), r() < 0.5 ? pick('CM') : pick('IM')];
    var nones = M.shuffle(r, byCat('none')).slice(0, 3);
    list = list.concat(nones);
    var seen = {};
    list = list.filter(function(t){ if(seen[t.id]) return false; seen[t.id] = 1; return true; });
    return M.shuffle(r, list).map(function(t){ return { id: t.id, cat: t.cat, text: t.text, why: t.why, amt: r.pick(AMT[t.cat]) }; });
  }
  function totals(items){
    var s = { C: 0, I: 0, G: 0, X: 0, M: 0, none: 0 };
    items.forEach(function(t){
      if(t.cat === 'CM'){ s.C += t.amt; s.M += t.amt; }
      else if(t.cat === 'IM'){ s.I += t.amt; s.M += t.amt; }
      else s[t.cat] += t.amt;
    });
    s.NX = calc('netExports', s.X, s.M);
    s.gdp = calc('gdp', s.C, s.I, s.G, s.X, s.M);
    return s;
  }

  /* ------------------------------------------------------------- prices */
  var YEARS = [2021, 2022, 2023, 2024, 2025];
  var BASKET = [
    { id: 'pizza', name: 'Pizzas', q: 10, p: [10, 10.5, 11, 12, 12.5] },
    { id: 'movie', name: 'Movie tickets', q: 4, p: [12, 12, 13, 13.5, 14] },
    { id: 'gas', name: 'Gallons of gas', q: 20, p: [3, 3.5, 3.2, 3.8, 4] }
  ];
  var WAGE = [15, 16, 17.5, 18, 19.5];
  function prices(baseIdx){
    var cost = YEARS.map(function(_, i){ return calc('add', calc('mul', BASKET[0].q, BASKET[0].p[i]), calc('mul', BASKET[1].q, BASKET[1].p[i]), calc('mul', BASKET[2].q, BASKET[2].p[i])); });
    var cpi = cost.map(function(c){ return calc('cpi', c, cost[baseIdx]); });
    var infl = cpi.map(function(c, i){ return i ? calc('inflation', cpi[i - 1], c) : null; });
    var real = WAGE.map(function(w, i){ return calc('realValue', w, cpi[i]); });
    return { cost: cost, cpi: cpi, infl: infl, wage: WAGE.slice(), realWage: real, base: baseIdx };
  }
  var NOMINAL = { gdp: [1000, 1080, 1150, 1180, 1300], deflator: [100, 104, 110, 115, 118] };
  function realGdp(){
    var real = NOMINAL.gdp.map(function(g, i){ return calc('realValue', g, NOMINAL.deflator[i]); });
    return { nominal: NOMINAL.gdp.slice(), deflator: NOMINAL.deflator.slice(), real: real,
      gNom: real.map(function(_, i){ return i ? calc('growth', NOMINAL.gdp[i - 1], NOMINAL.gdp[i]) : null; }),
      gReal: real.map(function(r, i){ return i ? calc('growth', real[i - 1], r) : null; }),
      infl: real.map(function(_, i){ return i ? calc('inflation', NOMINAL.deflator[i - 1], NOMINAL.deflator[i]) : null; }) };
  }

  /* --------------------------------------------------------------- jobs */
  // 100 adults (each dot about 2.6 million people).
  var JOBS0 = { E: 62, uF: 2, uS: 1, uC: 0, nRet: 19, nStu: 10, nOth: 6, nDis: 0 };
  var GROUPS = [
    { id: 'E', name: 'Employed', lf: 1 }, { id: 'uF', name: 'Unemployed: frictional', lf: 1, u: 1 }, { id: 'uS', name: 'Unemployed: structural', lf: 1, u: 1 },
    { id: 'uC', name: 'Unemployed: cyclical', lf: 1, u: 1 }, { id: 'nDis', name: 'Discouraged workers (not in the labor force)' },
    { id: 'nRet', name: 'Retired' }, { id: 'nStu', name: 'Full-time students' }, { id: 'nOth', name: 'Others not looking (caring for family, ...)' }
  ];
  var EVENTS = [
    { id: 'recession', name: 'A recession hits', moves: [['E', 'uC', 4]], say: 'Spending falls and firms lay off workers: cyclical unemployment rises.' },
    { id: 'recovery', name: 'The economy recovers', moves: [['uC', 'E', 99]], say: 'Spending recovers and laid-off workers are rehired: cyclical unemployment goes back to zero.' },
    { id: 'grads', name: 'Students start job hunting', moves: [['nStu', 'uF', 2]], say: 'New graduates join the labor force and search: frictional unemployment rises, and so does the labor force.' },
    { id: 'hired', name: 'Job seekers find matches', moves: [['uF', 'E', 2]], say: 'Searchers find jobs that fit: frictional unemployment falls.' },
    { id: 'automation', name: 'Factories automate', moves: [['E', 'uS', 2]], say: 'Some skills are no longer needed: structural unemployment rises, and the natural rate with it.' },
    { id: 'retrain', name: 'Workers retrain', moves: [['uS', 'E', 2]], say: 'Workers learn the skills employers want: structural unemployment falls.' },
    { id: 'giveup', name: 'Some job seekers give up', moves: [['uC', 'nDis', 2], ['uS', 'nDis', 2], ['uF', 'nDis', 2]], say: 'Discouraged workers stop looking, so they leave the labor force: the unemployment rate falls even though no one found a job.' },
    { id: 'retire', name: 'Workers retire', moves: [['E', 'nRet', 3]], say: 'Retirees leave the labor force: participation falls; the same number of unemployed is now a slightly larger share.' }
  ];
  function jobEvent(st, id){
    var ev = EVENTS.filter(function(e){ return e.id === id; })[0], s = {}, moved = 0;
    for(var k in st) s[k] = st[k];
    if(!ev) return { st: s, moved: 0 };
    var budget = ev.id === 'giveup' ? 2 : Infinity;
    ev.moves.forEach(function(m){ var k = Math.min(m[2], s[m[0]], budget - moved); if(k > 0){ s[m[0]] -= k; s[m[1]] += k; moved += k; } });
    return { st: s, moved: moved, say: ev.say };
  }
  function rates(st){
    var U = st.uF + st.uS + st.uC, lf = calc('laborForce', st.E, U), adults = 100;
    var u = calc('unemploymentRate', U, lf), lfpr = calc('participationRate', lf, adults);
    var nat = calc('naturalRate', calc('pct', st.uF, lf), calc('pct', st.uS, lf));
    return { U: U, lf: lf, adults: adults, u: u, lfpr: lfpr, natural: nat, cyclical: calc('cyclicalRate', u, nat), nilf: calc('sub', adults, lf) };
  }

  /* ----------------------------------------------------------- problems */
  function num(key, label, answer, mistakes, o){
    o = o || {};
    var d = o.d == null ? 2 : o.d, abs = d === 1 ? 0.06 : d === 0 ? 0.5 : 0.006;
    var s = { key: key, kind: 'num', label: label, practice: o.practice || '3.A', level: o.level || 'apply', cell: M.cell(answer, 0.002, mistakes || [], abs), d: d };
    if(o.hint) s.hint = o.hint;
    if(o.unit) s.unit = o.unit;
    return s;
  }
  function choice(key, label, options, why, o){
    o = o || {};
    return { key: key, kind: 'choice', label: label, options: options, why: why, correct: 0, practice: o.practice || '2.A', level: o.level || 'apply' };
  }
  function table(caption, head, rows){
    return '<table class="ind-tbl"><caption>' + caption + '</caption><thead><tr>' + head.map(function(h, i){ return '<th scope="col"' + (i ? ' class="r"' : '') + '>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function(r){ return '<tr>' + r.map(function(c, i){ return i ? '<td class="r">' + c + '</td>' : '<th scope="row">' + c + '</th>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }

  function genCount(r){
    var pool = TX.filter(function(t){ return CAT[t.cat]; });
    var picks = [], cats = ['C', 'I', 'G', 'X', 'none'];
    // three transactions, three different answers
    M.shuffle(r, cats).slice(0, 3).forEach(function(c){ picks.push(r.pick(pool.filter(function(t){ return t.cat === c; }))); });
    var steps = picks.map(function(t, i){
      var others = cats.filter(function(c){ return c !== t.cat; });
      var opts = [t.cat].concat(others);
      return choice('t' + (i + 1), '“' + t.text + '” Where does it go?', opts.map(function(c){ return CAT[c]; }),
        opts.map(function(c, k){ return k === 0 ? 'Right. ' + t.why : ((t.trap && t.trap[c]) || CAT_WHY[c] + ' Here: ' + t.why.charAt(0).toLowerCase() + t.why.slice(1)); }), { practice: '2.A' });
    });
    return { type: 'gdp-count', values: { ids: picks.map(function(t){ return t.id; }) }, text: '<p>GDP adds up spending on final goods and services produced in the country this year: C + I + G + (X − M). Sort each transaction.</p>', steps: steps,
      solution: picks.map(function(t){ return '<b>' + CAT[t.cat] + ':</b> ' + t.text + ' ' + t.why; }) };
  }

  function genCalc(r){
    var C = r.pick([600, 700, 800, 900, 1200]), I = r.pick([150, 200, 250, 300]), G = r.pick([200, 250, 300, 350]);
    var X = r.pick([80, 100, 120, 150]), Mi = r.pick([90, 110, 130, 160, 180]), T = r.pick([60, 90, 120, 150]), S = r.pick([40, 70, 100]);
    if(Mi === X) Mi += 20;
    var nx = calc('netExports', X, Mi), gdp = calc('gdp', C, I, G, X, Mi);
    var rows = M.shuffle(r, [
      ['Consumption', usd(C)], ['Investment', usd(I)], ['Government purchases', usd(G)], ['Exports', usd(X)], ['Imports', usd(Mi)],
      ['Government transfer payments', usd(T)], ['Purchases of stocks and bonds', usd(S)]
    ]);
    var fig = table('This year, in billions of dollars', ['Item', 'Amount'], rows);
    var steps = [
      num('nx', 'Net exports (a deficit is negative)', nx, [
        { value: calc('sub', Mi, X), why: 'You subtracted the wrong way. Net exports are exports minus imports, X − M.' },
        { value: calc('add', X, Mi), why: 'Imports are subtracted: net exports are X − M.' }
      ], { unit: 'billion dollars', practice: '3.A' }),
      num('gdp', 'GDP by the expenditure approach', gdp, [
        { value: calc('add', C, I, G, X, Mi), why: 'You added imports. Imports were produced abroad, so subtract them: C + I + G + (X − M).' },
        { value: calc('add', C, I, G, X), why: 'You left imports in. Use net exports, X − M, not exports alone.' },
        { value: calc('add', gdp, T), why: 'Transfer payments buy nothing new, so they are not in GDP (and not in G).' },
        { value: calc('add', gdp, T, S), why: 'Transfers and stock or bond purchases produce nothing new: leave both out.' },
        { value: calc('add', gdp, S), why: 'Buying stocks and bonds is a financial transaction, not investment in new capital: leave it out.' }
      ], { unit: 'billion dollars', practice: '3.A', level: 'analyze' })
    ];
    return { type: 'gdp-calc', fig: { html: fig }, values: { C: C, I: I, G: G, X: X, M: Mi, T: T, S: S, nx: nx, gdp: gdp }, text: '<p>Use the table to find net exports and GDP for this economy.</p>', steps: steps,
      solution: [
        'Net exports = X − M = ' + usd(X) + ' − ' + usd(Mi) + ' = <b>' + usd(nx, 'billion') + '</b>.',
        'GDP = C + I + G + (X − M) = ' + usd(C) + ' + ' + usd(I) + ' + ' + usd(G) + ' + (' + usd(nx) + ') = <b>' + usd(gdp, 'billion') + '</b>.',
        'Left out: transfer payments (' + usd(T) + ' billion) and stock and bond purchases (' + usd(S) + ' billion). Neither pays for new production.'
      ] };
  }

  var GOODS = [
    { name: 'Sandwiches', q: [5, 10, 20], p: [4, 5, 6, 8] }, { name: 'Bus rides', q: [10, 20, 40], p: [1, 1.5, 2, 2.5] },
    { name: 'Shirts', q: [2, 3, 4], p: [10, 12, 15, 20] }, { name: 'Phone plans', q: [1, 2], p: [30, 40, 50] },
    { name: 'Books', q: [2, 4, 5], p: [8, 10, 12, 15] }, { name: 'Gallons of milk', q: [4, 8, 10], p: [3, 3.5, 4] }
  ];
  function genCpi(r){
    var goods = M.shuffle(r, GOODS).slice(0, 3).map(function(g){
      var p0 = r.pick(g.p), up1 = r.pick([1, 1.05, 1.1, 1.2, 1.25]), up2 = r.pick([0.95, 1, 1.05, 1.1, 1.2, 1.25, 1.5]);
      return { name: g.name, q: r.pick(g.q), p: [p0, M.round(p0 * up1, 2), M.round(p0 * up1 * up2, 2)] };
    });
    var cost = [0, 1, 2].map(function(i){ return calc('add', calc('mul', goods[0].q, goods[0].p[i]), calc('mul', goods[1].q, goods[1].p[i]), calc('mul', goods[2].q, goods[2].p[i])); });
    if(cost[1] === cost[0] || cost[2] === cost[1]) return genCpi(r);
    var y0 = r.pick([2019, 2020, 2021, 2022]), Y = [y0, y0 + 1, y0 + 2];
    var cpi1 = calc('cpi', cost[1], cost[0]), cpi2 = calc('cpi', cost[2], cost[0]), infl = calc('inflation', cpi1, cpi2);
    var fig = table('A typical basket (' + Y[0] + ' is the base year)', ['Good', 'Quantity', 'Price ' + Y[0], 'Price ' + Y[1], 'Price ' + Y[2]],
      goods.map(function(g){ return [g.name, String(g.q), money2(g.p[0]), money2(g.p[1]), money2(g.p[2])]; }));
    var steps = [
      num('cost', 'The cost of the basket in ' + Y[0], cost[0], [
        { value: calc('add', goods[0].p[0], goods[1].p[0], goods[2].p[0]), why: 'You added the prices. The basket cost is each price times its quantity, added up.' }
      ], { unit: 'dollars', practice: '3.A' }),
      num('cpi1', 'The CPI in ' + Y[1], cpi1, [
        { value: calc('sub', cpi1, 100), why: 'That is the percent change since the base year. The CPI itself is (cost this year ÷ cost in the base year) × 100.' },
        { value: calc('div', cost[1], cost[0]), why: 'Multiply the ratio by 100: the CPI is an index with the base year at 100.' },
        { value: calc('cpi', cost[0], cost[1]), why: 'The ratio is upside down. Divide the cost this year by the cost in the base year.' }
      ], { d: 1, practice: '3.A' }),
      num('cpi2', 'The CPI in ' + Y[2], cpi2, [
        { value: calc('sub', cpi2, 100), why: 'That is the percent change since the base year. The CPI is (cost this year ÷ base-year cost) × 100.' },
        { value: calc('cpi', cost[2], cost[1]), why: 'Divide by the cost in the base year, ' + Y[0] + ', not the year before.' }
      ], { d: 1, practice: '3.A' }),
      num('infl', 'The inflation rate from ' + Y[1] + ' to ' + Y[2], infl, [
        { value: calc('sub', cpi2, cpi1), why: 'That is the change in index points. Inflation is a percent: divide the change by the earlier CPI, then × 100.' },
        { value: calc('mul', calc('div', calc('sub', cpi2, cpi1), cpi2), 100), why: 'Divide by the earlier year\'s CPI (' + n(cpi1, 1) + '), not the later one.' },
        { value: calc('sub', cpi2, 100), why: 'That is the inflation since the base year. From ' + Y[1] + ' to ' + Y[2] + ', start from ' + Y[1] + '\'s CPI.' }
      ], { d: 1, unit: '%', practice: '3.C', level: 'analyze', hint: 'Inflation = (new CPI − old CPI) ÷ old CPI × 100' })
    ];
    return { type: 'cpi', fig: { html: fig }, values: { goods: goods, cost: cost, cpi1: cpi1, cpi2: cpi2, infl: infl, years: Y }, text: '<p>Use the basket in the table to find the CPI and the inflation rate.</p>', steps: steps,
      solution: [
        'Basket cost = Σ quantity × price: ' + Y[0] + ' <b>' + money2(cost[0]) + '</b>, ' + Y[1] + ' ' + money2(cost[1]) + ', ' + Y[2] + ' ' + money2(cost[2]) + '.',
        'CPI = cost ÷ base-year cost × 100: ' + Y[1] + ' ' + money2(cost[1]) + ' ÷ ' + money2(cost[0]) + ' × 100 = <b>' + n(cpi1, 1) + '</b>; ' + Y[2] + ' <b>' + n(cpi2, 1) + '</b>. The base year is 100.',
        'Inflation = (' + n(cpi2, 1) + ' − ' + n(cpi1, 1) + ') ÷ ' + n(cpi1, 1) + ' × 100 = <b>' + n(infl, 1) + '%</b>' + (infl < 0 ? ' (deflation: the price level fell).' : '.')
      ] };
  }

  function genReal(r){
    var variant = r() < 0.6 ? 'deflate' : 'deflator', y0 = r.pick([2018, 2020, 2022]);
    if(variant === 'deflate'){
      var d1 = r.pick([100, 105, 110, 120, 125]), d2 = calc('add', d1, r.pick([2, 4, 5, 8, 10]));
      var g1 = r.pick([800, 1000, 1200, 1500, 2000]), g2 = calc('mul', g1, r.pick([1.02, 1.05, 1.08, 1.1, 1.12, 1.15]));
      var r1 = calc('realValue', g1, d1), r2 = calc('realValue', g2, d2), gr = calc('growth', r1, r2);
      var fig = table('Nominal GDP and the GDP deflator (the base year has a deflator of 100)', ['Year', 'Nominal GDP', 'GDP deflator'], [[String(y0), usd(g1) + ' billion', n(d1)], [String(y0 + 1), usd(g2) + ' billion', n(d2)]]);
      var steps = [
        num('r2', 'Real GDP in ' + (y0 + 1), r2, [
          { value: calc('div', calc('mul', g2, d2), 100), why: 'You multiplied by the deflator. To remove price changes, divide: real GDP = nominal GDP ÷ deflator × 100.' },
          { value: calc('div', g2, d2), why: 'Multiply by 100 too: the deflator is an index with the base year at 100.' },
          { value: g2, why: 'That is nominal GDP. Real GDP removes the price change: divide by the deflator, × 100.' }
        ], { unit: 'billion dollars', practice: '3.A' }),
        num('gr', 'The growth rate of real GDP from ' + y0 + ' to ' + (y0 + 1), gr, [
          { value: calc('growth', g1, g2), why: 'That is nominal GDP growth. Real growth uses real GDP in both years, so price changes are left out.' },
          { value: calc('sub', calc('growth', g1, g2), calc('inflation', d1, d2)), why: 'Close, but subtracting inflation from nominal growth is only an estimate. Compute real GDP in both years and take the percent change.' },
          { value: calc('sub', r2, r1), why: 'That is the change in billions. A growth rate is a percent: divide by the first year\'s real GDP, × 100.' }
        ], { d: 1, unit: '%', practice: '3.C', level: 'analyze' })
      ];
      return { type: 'real', fig: { html: fig }, values: { variant: variant, g1: g1, g2: g2, d1: d1, d2: d2, r1: r1, r2: r2, gr: gr }, text: '<p>Use nominal GDP and the GDP deflator to find real GDP and real growth.</p>', steps: steps,
        solution: [
          'Real GDP = nominal ÷ deflator × 100. ' + y0 + ': ' + usd(g1) + ' ÷ ' + n(d1) + ' × 100 = ' + usd(r1) + ' billion; ' + (y0 + 1) + ': ' + usd(g2) + ' ÷ ' + n(d2) + ' × 100 = <b>' + usd(r2, 'billion') + '</b>.',
          'Real growth = (' + usd(r2) + ' − ' + usd(r1) + ') ÷ ' + usd(r1) + ' × 100 = <b>' + n(gr, 1) + '%</b>, against ' + n(calc('growth', g1, g2), 1) + '% nominal growth: the rest was rising prices.'
        ] };
    }
    var real = r.pick([800, 1000, 1200, 1600, 2000]), defl = r.pick([104, 105, 108, 110, 112, 115, 120, 125]), nom = calc('nominalValue', real, defl);
    var dPrev = calc('sub', defl, r.pick([2, 3, 4, 5]));
    var defCalc = calc('deflator', nom, real), infl = calc('inflation', dPrev, defCalc);
    var fig2 = table(String(y0 + 1) + ', in billions of dollars', ['Measure', 'Value'], [['Nominal GDP', usd(nom)], ['Real GDP (base-year prices)', usd(real)], ['GDP deflator in ' + y0, n(dPrev)]]);
    var steps2 = [
      num('defl', 'The GDP deflator in ' + (y0 + 1), defCalc, [
        { value: calc('deflator', real, nom), why: 'The ratio is upside down. The deflator is nominal GDP ÷ real GDP × 100.' },
        { value: calc('div', nom, real), why: 'Multiply by 100: the deflator is an index, with the base year at 100. It is not a percent or a dollar amount.' },
        { value: calc('sub', defCalc, 100), why: 'That is the percent change since the base year, not the deflator itself.' }
      ], { d: 1, practice: '3.A' }),
      num('infl', 'The inflation rate from ' + y0 + ' to ' + (y0 + 1) + ', measured by the deflator', infl, [
        { value: calc('sub', defCalc, dPrev), why: 'That is the change in index points. Divide by the earlier deflator, × 100.' },
        { value: calc('sub', defCalc, 100), why: 'That is the change since the base year, not from ' + y0 + '.' }
      ], { d: 1, unit: '%', practice: '3.C', level: 'analyze' })
    ];
    return { type: 'real', fig: { html: fig2 }, values: { variant: variant, nom: nom, real: real, dPrev: dPrev, defl: defCalc, infl: infl }, text: '<p>Use nominal and real GDP to find the GDP deflator and the inflation rate it shows.</p>', steps: steps2,
      solution: [
        'Deflator = nominal ÷ real × 100 = ' + usd(nom) + ' ÷ ' + usd(real) + ' × 100 = <b>' + n(defCalc, 1) + '</b> (an index: no % sign, no dollars).',
        'Inflation = (' + n(defCalc, 1) + ' − ' + n(dPrev, 1) + ') ÷ ' + n(dPrev, 1) + ' × 100 = <b>' + n(infl, 1) + '%</b>.'
      ] };
  }

  function genUnemp(r){
    var E = r.pick([140, 150, 155, 160, 170]), U = r.pick([5, 6, 8, 9, 10, 12]), Ret = r.pick([40, 45, 50, 55]), Stu = r.pick([15, 20, 25]), D = r.pick([1, 2, 3, 4]);
    var adults = calc('add', E, U, Ret, Stu, D), lf = calc('laborForce', E, U), u = calc('unemploymentRate', U, lf), lfpr = calc('participationRate', lf, adults);
    var fig = table('Adults 16 and over, in millions', ['Group', 'People'], [
      ['Employed (full or part time)', n(E)], ['Without a job and looking for work', n(U)], ['Retired', n(Ret)], ['Full-time students, not looking', n(Stu)], ['Want a job but stopped looking (discouraged)', n(D)]
    ]);
    var steps = [
      num('lf', 'The labor force', lf, [
        { value: calc('add', E, U, D), why: 'Discouraged workers stopped looking, so they are not in the labor force. Labor force = employed + unemployed.' },
        { value: E, why: 'The labor force also includes the unemployed: people without a job who are looking.' },
        { value: adults, why: 'That is every adult. Retirees, students and discouraged workers are not in the labor force.' }
      ], { unit: 'million people', practice: '3.A' }),
      num('u', 'The unemployment rate', u, [
        { value: calc('pct', U, adults), why: 'Divide by the labor force, not by every adult: unemployed ÷ labor force × 100.' },
        { value: calc('pct', calc('add', U, D), calc('add', lf, D)), why: 'Discouraged workers are not counted as unemployed: they are out of the labor force.' },
        { value: calc('pct', U, E), why: 'Divide by the whole labor force (employed + unemployed), not by the employed alone.' }
      ], { d: 1, unit: '%', practice: '3.A' }),
      num('lfpr', 'The labor force participation rate', lfpr, [
        { value: calc('pct', E, adults), why: 'Participation counts the whole labor force, the unemployed too: labor force ÷ adult population × 100.' },
        { value: calc('pct', calc('add', lf, D), adults), why: 'Discouraged workers are not in the labor force.' },
        { value: calc('sub', 100, u), why: 'That is 100 minus the unemployment rate. Participation is labor force ÷ adult population × 100.' }
      ], { d: 1, unit: '%', practice: '3.A' })
    ];
    return { type: 'unemp', fig: { html: fig }, values: { E: E, U: U, Ret: Ret, Stu: Stu, D: D, adults: adults, lf: lf, u: u, lfpr: lfpr }, text: '<p>Use the table to find the labor force, the unemployment rate and the participation rate.</p>', steps: steps,
      solution: [
        'Labor force = employed + unemployed = ' + n(E) + ' + ' + n(U) + ' = <b>' + n(lf) + ' million</b>. Retirees, students and discouraged workers are outside it.',
        'Unemployment rate = ' + n(U) + ' ÷ ' + n(lf) + ' × 100 = <b>' + n(u, 1) + '%</b>.',
        'Participation rate = ' + n(lf) + ' ÷ ' + n(adults) + ' × 100 = <b>' + n(lfpr, 1) + '%</b> (the adult population is everyone in the table, ' + n(adults) + ' million).'
      ] };
  }

  var UTYPE = { frictional: 'Frictional', structural: 'Structural', cyclical: 'Cyclical', none: 'Not unemployed: out of the labor force' };
  var UWHY = {
    frictional: 'Frictional unemployment is the time spent searching between jobs or for a first job, while jobs that fit exist.',
    structural: 'Structural unemployment is a mismatch: the worker\'s skills or location no longer fit the jobs available, often after a change in technology or industry.',
    cyclical: 'Cyclical unemployment comes from a downturn in the business cycle: less spending, so firms need fewer workers.',
    none: 'Someone who is not working and not looking for work is out of the labor force, not unemployed.'
  };
  var USCN = [
    { t: 'frictional', s: 'A nurse quits her job to move to another city and is looking for work there.' },
    { t: 'frictional', s: 'A new college graduate is searching for a first job in her field.' },
    { t: 'frictional', s: 'A worker left a job he disliked and is interviewing for a better one.' },
    { t: 'structural', s: 'A typesetter loses his job because printing is now done digitally, and his skills are no longer in demand.' },
    { t: 'structural', s: 'A coal miner is laid off as the region\'s mines close for good; the open jobs nearby need computer skills.' },
    { t: 'structural', s: 'Bank tellers lose their jobs to apps and kiosks and look for work that needs different skills.' },
    { t: 'cyclical', s: 'In a recession, car sales fall and an auto plant lays off workers until sales recover.' },
    { t: 'cyclical', s: 'During a downturn, a restaurant lays off servers because fewer people eat out.' },
    { t: 'cyclical', s: 'Construction workers lose their jobs when spending falls across the economy.' },
    { t: 'none', s: 'After a long search, a laid-off worker stops looking because she believes no jobs are available.' },
    { t: 'none', s: 'A retired teacher is not working and not looking for work.' }
  ];
  function genUtype(r){
    var a = r.pick(USCN), b = r.pick(USCN.filter(function(x){ return x.t !== a.t; }));
    var steps = [a, b].map(function(sc, i){
      var opts = [sc.t].concat(Object.keys(UTYPE).filter(function(k){ return k !== sc.t; }));
      return choice('s' + (i + 1), '“' + sc.s + '” What kind of unemployment is this?', opts.map(function(k){ return UTYPE[k]; }),
        opts.map(function(k, j){ return j === 0 ? 'Right. ' + UWHY[k] : (k === 'none' ? 'This person is looking for work, so they are in the labor force and unemployed. ' : 'Not ' + k + '. ') + UWHY[sc.t]; }), { practice: '2.A' });
    });
    return { type: 'utype', values: { a: a.t, b: b.t }, text: '<p>Name the kind of unemployment in each case. The natural rate is frictional plus structural; cyclical is on top of it in a downturn.</p>', steps: steps,
      solution: [a, b].map(function(sc){ return '<b>' + UTYPE[sc.t] + ':</b> ' + sc.s + ' ' + UWHY[sc.t]; }) };
  }

  var GEN = { 'gdp-count': genCount, 'gdp-calc': genCalc, cpi: genCpi, real: genReal, unemp: genUnemp, utype: genUtype };
  function generate(r, ctx, type){
    var list = (ctx && ctx.types) || TYPES;
    var t = type && list.indexOf(type) > -1 ? type : r.pick(list);
    var p = GEN[t](r);
    p.ctx = ctx ? ctx.id : t;
    p.topic = ctx ? ctx.topic : 'price-indices-inflation';
    p.title = TITLE[t];
    return p;
  }

  root.ApMacroMath.register('indicatorsLab', { TYPES: TYPES, TITLE: TITLE, CAT: CAT, CAT_WHY: CAT_WHY, TX: TX, n: n, usd: usd, money2: money2,
    economy: economy, totals: totals, YEARS: YEARS, BASKET: BASKET, WAGE: WAGE, prices: prices, NOMINAL: NOMINAL, realGdp: realGdp,
    JOBS0: JOBS0, GROUPS: GROUPS, EVENTS: EVENTS, jobEvent: jobEvent, rates: rates, UTYPE: UTYPE, USCN: USCN, generate: generate });
})(typeof window !== 'undefined' ? window : globalThis);
