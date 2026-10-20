/* Calculation studio model: ApEnvMath.calculationStudio (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T1, docs/apenv-briefs/t1.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/calculation-studio.mjs)
   and the test (scripts/test/apenv-tool-calculation-studio.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/calculation-studio.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/calculation-studio.js.

   Every number a student sees as a key comes from ApEnvCalc (calc(fn, args)).

   Explore: the unit chain (dimensional analysis)
     CHAINS[id]                    a scenario: start { value, unit }, target
                                   unit, tray of factor tiles [num, numUnit,
                                   den, denUnit] (some shown upside down) and
                                   one distractor
     chainState(scn, start, tiles) -> { rows, left, leftText, value, done,
                                   wrongWay, extra, setup }: which units cancel
                                   (pairs, in order), what is left, the running
                                   value (ApEnvCalc.mul / div) and the typed
                                   setup a student would write in Bluebook
     words(x)                      { comma, words, sci }: one number three ways
   Drills
     TYPES                         every calculation type of spec section 7
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution,
                                   figure, given }
       steps: setup (typed, brackets and units), unit (number and unit, two
       boxes), num (a year or a count of half-lives), choice. */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  function C(){ return M.Calc(); }
  function calc(fn, args){ return C().evaluate({ fn: fn, args: args }); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ------------------------------------------------------------ numbers */
  /* A number as text: thousands commas, at most d decimals, no trailing zeros. */
  function nf(x, d){
    var s = M.fixed(x, d == null ? 3 : d);
    if(s.indexOf('.') > -1) s = s.replace(/0+$/, '').replace(/\.$/, '');
    var neg = s.charAt(0) === '-'; if(neg) s = s.slice(1);
    var p = s.split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '−' : '') + p.join('.');
  }
  /* The same number as a setup token (no commas: the setup box reads 5000000 or 5e6). */
  function raw(x){ return String(+Number(x).toPrecision(12)); }
  var SCALE = [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']];
  var SUPD = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function sup(n){ return String(n).split('').map(function(c){ return SUPD[c] || c; }).join(''); }
  function sci(x, n){
    if(!x) return '0';
    var e = Math.floor(Math.log10(Math.abs(x)) + 1e-12), m = +(x / Math.pow(10, e)).toPrecision(n || 3);
    if(Math.abs(m) >= 10){ m = +(m / 10).toPrecision(n || 3); e++; }
    return String(m) + ' × 10' + sup(e);
  }
  /* One number three ways: 2,500,000 = 2.5 million = 2.5 × 10⁶. */
  function words(x){
    var a = Math.abs(x), w = null;
    for(var i = 0; i < SCALE.length; i++) if(a >= SCALE[i][0]){ var v = x / SCALE[i][0]; if(Math.abs(v - +v.toPrecision(4)) < 1e-9 * Math.abs(v)){ w = nf(v, 3) + ' ' + SCALE[i][1]; break; } }
    return { comma: nf(x, 3), words: w, sci: sci(x, 4) };
  }
  function pick(r, a){ return a[Math.floor(r() * a.length)]; }
  function between(r, ab, step){ var s = step || 1, n = Math.round((ab[1] - ab[0]) / s); return M.round(ab[0] + s * Math.floor(r() * (n + 1)), 6); }

  /* ------------------------------------------------------ explore: chains */
  /* Units are tokens: 'kg CO2' is one token (the gas is part of the unit), a
     product of tokens is written with '*'. A tile [num, numUnit, den, denUnit]
     reads "num numUnit per den denUnit"; flipped, the other way up. */
  var CHAINS = {
    plant: { id: 'plant', label: 'Power plant', scene: 'plant',
      title: 'A coal power plant',
      ask: 'How many metric tons of CO₂ does it release?',
      start: { min: 1000000, max: 10000000, step: 500000, value: 5000000, unit: 'kWh', what: 'electricity generated in a year' },
      target: 'tonne CO2',
      tray: [
        { id: 'ef', f: [0.9, 'kg CO2', 1, 'kWh'], flip: true, note: 'The plant releases 0.9 kg of CO₂ for each kWh.' },
        { id: 't', f: [1, 'tonne CO2', 1000, 'kg CO2'], flip: true, note: 'One metric ton is 1,000 kg.' },
        { id: 'btu', f: [3412, 'BTU', 1, 'kWh'], decoy: true, note: '1 kWh is 3,412 BTU. True, but it does not lead to CO₂.' }
      ] },
    car: { id: 'car', label: 'Commute', scene: 'car',
      title: 'A commuter car',
      ask: 'How many kg of CO₂ does it release each year?',
      start: { min: 4000, max: 24000, step: 1000, value: 12000, unit: 'mi/yr', what: 'miles driven each year' },
      target: 'kg CO2/yr',
      tray: [
        { id: 'mpg', f: [30, 'mi', 1, 'gal'], flip: false, note: 'The car goes 30 miles on 1 gallon. Turn it over so miles cancel.' },
        { id: 'ef', f: [8.9, 'kg CO2', 1, 'gal'], flip: false, note: 'Burning 1 gallon of gasoline releases 8.9 kg of CO₂.' },
        { id: 'l', f: [3.785, 'L', 1, 'gal'], decoy: true, note: '1 gallon is 3.785 liters. True, but liters are not asked for.' }
      ] },
    home: { id: 'home', label: 'Household water', scene: 'home',
      title: 'A household’s water',
      ask: 'How many liters does the household use in a year?',
      start: { min: 50, max: 600, step: 10, value: 300, unit: 'gal/day', what: 'water used each day' },
      target: 'L/yr',
      tray: [
        { id: 'l', f: [3.785, 'L', 1, 'gal'], flip: true, note: '1 gallon is 3.785 liters.' },
        { id: 'y', f: [365, 'day', 1, 'yr'], flip: false, note: 'A year has 365 days.' },
        { id: 'ac', f: [1, 'ha', 2.47, 'acre'], decoy: true, note: '1 hectare is 2.47 acres. True, but it measures land, not water.' }
      ] },
    bulbs: { id: 'bulbs', label: 'Lighting', scene: 'bulbs',
      title: 'A school’s light bulbs',
      ask: 'How many kWh do they use in a year?',
      start: { min: 5, max: 60, step: 1, value: 20, unit: 'bulb', what: 'incandescent bulbs' },
      target: 'kW*h/yr',
      tray: [
        { id: 'w', f: [60, 'W', 1, 'bulb'], flip: false, note: 'Each bulb uses 60 W while it is on.' },
        { id: 'h', f: [5, 'h', 1, 'day'], flip: false, note: 'The lights are on 5 hours a day.' },
        { id: 'y', f: [365, 'day', 1, 'yr'], flip: true, note: 'A year has 365 days.' },
        { id: 'k', f: [1, 'kW', 1000, 'W'], flip: true, note: '1 kW is 1,000 W.' }
      ] }
  };
  var PRETTY = { 'kg CO2': 'kg CO₂', 'tonne CO2': 'metric ton CO₂', 'm2': 'm²', 'km2': 'km²', 'mi/yr': 'mi/yr', 'kW*h': 'kWh', 'kW*h/yr': 'kWh/yr', 'gal/day': 'gal/day', 'L/yr': 'L/yr', 'kg CO2/yr': 'kg CO₂/yr' };
  function pretty(u){ return PRETTY[u] || String(u).replace(/CO2/g, 'CO₂'); }
  // Setup spelling of a token (ApEnvExpr reads tonne, kg CO2, bulbs ...).
  var TYPED = { 'tonne CO2': 'tonne CO2', bulb: 'bulbs' };
  function typed(u){ return TYPED[u] || u; }
  /* A unit string "a*b/c*d" -> tokens with signs. */
  function tokens(u, sign){
    var out = [], parts = String(u || '').split('/');
    parts.forEach(function(p, i){ p.split('*').map(function(t){ return t.trim(); }).filter(Boolean).forEach(function(t){ out.push({ u: t, s: (i ? -1 : 1) * (sign || 1) }); }); });
    return out;
  }
  function sameUnits(a, b){
    var k = {}; a.forEach(function(t){ k[t.u] = (k[t.u] || 0) + t.s; }); b.forEach(function(t){ k[t.u] = (k[t.u] || 0) - t.s; });
    return Object.keys(k).every(function(x){ return !k[x]; });
  }
  function unitText(ts){
    var top = [], bot = [];
    ts.forEach(function(t){ (t.s > 0 ? top : bot).push(t.u); });
    var join = function(a){ var s = a.join('·'); return s === 'kW·h' ? 'kWh' : s.replace('kW·h', 'kWh'); };
    return (top.length ? pretty(join(top)) : '1') + (bot.length ? '/' + pretty(join(bot)) : '');
  }
  /* The chain as the student built it: start, then tiles in order. Units
     cancel in pairs (the first open unit of the same name and opposite
     power), as a student strikes them on paper. */
  function chainState(scn, startValue, tiles){
    var rows = [], open = [], pairN = 0;
    function place(row, part, list){
      list.forEach(function(t, j){
        var cell = { u: t.u, s: t.s, row: row, part: part, j: j, pair: null };
        for(var i = 0; i < open.length; i++){ var o = open[i]; if(o.u === t.u && o.s === -t.s && o.pair === null){ o.pair = cell.pair = ++pairN; open.splice(i, 1); break; } }
        if(cell.pair === null) open.push(cell);
        rows[row][part].push(cell);
      });
    }
    var st = tokens(scn.start.unit, 1);
    rows.push({ id: 'start', value: startValue, top: [], bot: [], num: startValue, den: 1 });
    place(0, 'top', st.filter(function(t){ return t.s > 0; }));
    place(0, 'bot', st.filter(function(t){ return t.s < 0; }));
    var args = [startValue];
    tiles.forEach(function(tl, k){
      var tr = scn.tray.filter(function(x){ return x.id === tl.id; })[0];
      if(!tr) return;
      var f = tr.f, up = tl.flipped ? [f[2], f[3], f[0], f[1]] : f;
      rows.push({ id: tr.id, num: up[0], den: up[2], top: [], bot: [], flipped: !!tl.flipped, decoy: !!tr.decoy, note: tr.note });
      place(k + 1, 'top', tokens(up[1], 1));
      place(k + 1, 'bot', tokens(up[3], -1).map(function(t){ return t; }));
      args.push(up[0]); args.push(up[2]);
    });
    // The running value: start × num / den × ...  (ApEnvCalc arithmetic)
    var num = [args[0]], den = [];
    for(var i = 1; i < args.length; i += 2){ num.push(args[i]); den.push(args[i + 1]); }
    var value = calc('div', [calc('mul', num), den.length ? calc('mul', den) : 1]);
    var left = [];
    open.forEach(function(c){ left.push({ u: c.u, s: c.s }); });
    var tgt = tokens(scn.target, 1), done = sameUnits(left, tgt);
    // A placed tile the other way up from the key does not cancel what it should.
    var key = {}; keyOrder(scn).forEach(function(k){ key[k.id] = k.flipped; });
    var wrongWay = tiles.filter(function(tl){ return tl.id in key && !!tl.flipped !== key[tl.id]; }).map(function(tl){ return tl.id; });
    var decoys = tiles.filter(function(tl){ var tr = scn.tray.filter(function(x){ return x.id === tl.id; })[0]; return tr && tr.decoy; }).map(function(tl){ return tl.id; });
    var setup = raw(startValue) + ' ' + typed(scn.start.unit) + rows.slice(1).map(function(r){ var tr = scn.tray.filter(function(x){ return x.id === r.id; })[0], f = r.flipped ? [tr.f[2], tr.f[3], tr.f[0], tr.f[1]] : tr.f; return ' * ' + raw(f[0]) + ' ' + typed(f[1]).replace('*', ' ') + ' / ' + raw(f[2]) + ' ' + typed(f[3]).replace('*', ' '); }).join('');
    return { rows: rows, left: left, leftText: unitText(left), target: tgt, targetText: unitText(tgt), value: value, done: done, wrongWay: wrongWay, decoys: decoys, setup: setup };
  }
  /* The key: the tray's real factors, each the right way up, in an order where
     every factor's bottom unit is already there to cancel (ApEnvCalc.chain's
     rule). flipped: true means the tray shows it upside down. */
  function keyOrder(scn){
    var have = {}, out = [], rest = scn.tray.filter(function(t){ return !t.decoy; }).slice(), guard = 0;
    tokens(scn.start.unit, 1).forEach(function(t){ have[t.u] = (have[t.u] || 0) + t.s; });
    while(rest.length && guard++ < 20){
      for(var i = 0; i < rest.length; i++){
        var tr = rest[i], ways = [[tr.f, false], [[tr.f[2], tr.f[3], tr.f[0], tr.f[1]], true]];
        var ok = null;
        ways.forEach(function(w){ if(ok) return; var den = tokens(w[0][3], 1); if(den.every(function(t){ return (have[t.u] || 0) > 0; })) ok = w; });
        // a numerator-side cancel (a unit with a negative power, like /yr against day/yr) counts too
        if(!ok) ways.forEach(function(w){ if(ok) return; var num = tokens(w[0][1], 1); if(num.every(function(t){ return (have[t.u] || 0) < 0; })) ok = w; });
        if(ok){
          tokens(ok[0][1], 1).concat(tokens(ok[0][3], -1)).forEach(function(t){ have[t.u] = (have[t.u] || 0) + t.s; });
          out.push({ id: tr.id, flipped: ok[1] });
          rest.splice(i, 1); i = -1; break;
        }
      }
      // A rate that cancels nothing yet (5 h per day) goes in as written; a later factor cancels it.
      if(i !== -1 && rest.length){ var f0 = rest.shift(); tokens(f0.f[1], 1).concat(tokens(f0.f[3], -1)).forEach(function(t){ have[t.u] = (have[t.u] || 0) + t.s; }); out.push({ id: f0.id, flipped: false }); }
    }
    return out;
  }
  /* The key's value: the start times each real factor the right way up
     (ApEnvCalc arithmetic). The test recomputes it with ApEnvCalc.chain. */
  function keyFactors(scn){
    return keyOrder(scn).map(function(k){ var tr = scn.tray.filter(function(x){ return x.id === k.id; })[0]; return k.flipped ? [tr.f[2], tr.f[3], tr.f[0], tr.f[1]] : tr.f.slice(); });
  }
  function chainKey(scn, startValue){
    var v = startValue == null ? scn.start.value : startValue;
    keyFactors(scn).forEach(function(f){ v = calc('mul', [v, calc('div', [f[0], f[2]])]); });
    return v;
  }

  /* ------------------------------------------------------- drill steps */
  var SK = { setup: '6.B', answer: '6.C', year: '6.C', n: '6.B', read: '5.B', why: '1.B', compare: '6.C', sci: '6.A', trend: '5.B' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '6.B' }; for(var k in o) s[k] = o[k]; return s; }
  /* A typed setup: answer is the exam setup (brackets, × 100, units). */
  function setupStep(answer, o){
    o = o || {};
    // A slip that happens to give the key's value (2 × 2 = 2²) is not a slip here.
    var bind = o.bind || (/CO2/.test(answer) ? { CO2: 1 } : undefined), X = G.ApEnvExpr, key = X.evaluate(answer, bind || {}, o.units || []);
    var ms = (o.mistakes || []).filter(function(m){ var v = X.evaluate(m.expr, bind || {}, o.units || []); return v.ok && key.ok && Math.abs(v.value - key.value) > 1e-6 * Math.max(1, Math.abs(key.value)); });
    var opts = { bind: bind, mustUse: o.mustUse, mistakes: ms, units: o.units, unit: o.unit, requireUnits: o.requireUnits };
    return step('setup', o.label || 'Write the setup, as you would type it on the exam.', { kind: 'setup', hint: o.hint, cell: M.setupCell(answer, opts) });
  }
  /* The answer with its unit, two boxes graded apart. */
  function answerStep(value, unit, o){
    o = o || {};
    var tol = G.ApEnvGrade.tolerance({ answer: value, places: o.places });
    var seen = [value], opts = { units: o.units, mistakes: (o.mistakes || []).filter(function(m){
      if(!isFinite(m.value) || seen.some(function(v){ return Math.abs(m.value - v) <= 2.5 * tol + 1e-9 * Math.abs(v); })) return false;
      seen.push(m.value); return true; }) };
    if(o.places != null) opts.places = o.places;
    return step(o.key || 'answer', o.label || 'Now the answer and its unit.', { kind: 'unit', hint: o.hint, cell: M.unitCell(value, unit, opts) });
  }
  function numStep(key, label, value, o){
    o = o || {};
    return step(key, label, { kind: 'num', d: o.d == null ? 0 : o.d, unit: o.unit, hint: o.hint, cell: M.cell(value, o.rel == null ? 1e-6 : o.rel, o.mistakes || [], o.abs == null ? 0.5 : o.abs) });
  }
  /* A choice: options[0] is the right one (the drill shuffles them). */
  function choice(key, label, opts){
    return step(key, label, { kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 });
  }
  var NO_COMMA = 'Type numbers without commas (5000000 or 5e6).';
  function hintUnits(list){ return NO_COMMA + ' Units after each number: ' + list + '.'; }

  /* ------------------------------------------------------- the 18 types */
  var TYPES = [
    { value: 'pct-change', label: 'Percent change' },
    { value: 'pct-of', label: 'Percent of a quantity' },
    { value: 'doubling', label: 'Rule of 70 and "in what year"' },
    { value: 'growth', label: 'Growth rate from birth and death rates' },
    { value: 'projection', label: 'Growth projections' },
    { value: 'ten-percent', label: 'The 10% rule' },
    { value: 'npp', label: 'GPP, respiration and NPP' },
    { value: 'half-life', label: 'Half-life' },
    { value: 'convert', label: 'Unit conversions' },
    { value: 'per-capita', label: 'Per capita and density' },
    { value: 'efficiency', label: 'Efficiency and energy chains' },
    { value: 'cost', label: 'Cost and emissions savings' },
    { value: 'emissions', label: 'Emissions by dimensional analysis' },
    { value: 'dose', label: 'LD50 and whole-body doses' },
    { value: 'biomag', label: 'Biomagnification' },
    { value: 'tfr', label: 'Total fertility rate' },
    { value: 'water', label: 'Water use per area' },
    { value: 'scale', label: 'Scale words and powers of ten' }
  ];
  var GEN = {};

  /* Percent change: (new - old) / old × 100 */
  GEN['pct-change'] = function(r, c){
    var old = between(r, c.from, c.step || 1), p = 0, guard = 0;
    while(Math.abs(p) < 4 && guard++ < 40) p = between(r, c.pct, 1);
    var nw = M.round(old * (1 + p / 100), c.d || 0);
    if(nw === old) nw = old + (c.step || 1);
    var y0 = between(r, c.years || [2012, 2018], 1), y1 = y0 + between(r, [3, 8], 1);
    var ans = calc('percentChange', [old, nw]), u = c.noun;
    var text = '<p>' + c.lead + ' In ' + y0 + ' there were ' + nf(old) + ' ' + u + '; in ' + y1 + ' there were ' + nf(nw) + '.</p><p><b>Calculate the percent change</b> in ' + c.what + ' from ' + y0 + ' to ' + y1 + '.</p>';
    var steps = [
      setupStep('(' + raw(nw) + ' - ' + raw(old) + ') / ' + raw(old) + ' * 100', { mustUse: [raw(old), raw(nw)], hint: 'Percent change = (new − old) / old × 100. Keep the brackets.',
        mistakes: [{ expr: '(' + raw(nw) + ' - ' + raw(old) + ') / ' + raw(nw) + ' * 100', why: 'Divide by the old value (' + nf(old) + '), the year you start from, not the new one.' },
          { expr: raw(nw) + ' / ' + raw(old) + ' * 100', why: 'That is the new value as a percent of the old one. Subtract first: (new − old), then divide by old.' }] }),
      answerStep(ans, '%', { units: ['percent'], places: 1, hint: 'One decimal place is enough. A decrease is negative.',
        mistakes: [{ value: calc('percentChange', [nw, old]) * -1, why: 'You divided by the new value. Percent change divides by the old value.' }, { value: nw / old * 100, why: 'That is new ÷ old × 100, not the change. Subtract first.' }] })
    ];
    var sol = ['Setup: (new − old) / old × 100 = (' + nf(nw) + ' − ' + nf(old) + ') / ' + nf(old) + ' × 100.', '= ' + nf(nw - old) + ' / ' + nf(old) + ' × 100 = ' + nf(ans, 1) + '%' + (ans < 0 ? ' (a decrease).' : ' (an increase).'),
      'Readers want the brackets: without them, a calculator divides first and gives a different number.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'bars', bars: [{ label: String(y0), value: old }, { label: String(y1), value: nw }], unit: u, ask: 'Percent change?', result: nf(ans, 1) + '%', change: true }, given: { old: old, nw: nw } };
  };

  /* Percent of a quantity: pct / 100 × quantity */
  GEN['pct-of'] = function(r, c){
    var q = between(r, c.q, c.qStep || 1), pct = between(r, c.pct, c.pStep || 1);
    var ans = calc('percentOf', [pct, q]);
    var text = '<p>' + c.lead.replace('{q}', nf(q)).replace('{pct}', nf(pct)) + '</p><p><b>Calculate</b> ' + c.ask + '</p>';
    var steps = [
      setupStep(raw(pct) + ' / 100 * ' + raw(q), { mustUse: [raw(q)], hint: 'Turn the percent into a decimal (÷ 100), then multiply.' }),
      answerStep(ans, c.unit, { units: c.units, mistakes: [{ value: pct * q, why: 'Divide the percent by 100 first: ' + nf(pct) + '% is ' + nf(pct / 100, 4) + '.' }, { value: q - ans, why: 'That is the part that is NOT ' + nf(pct) + '%. The question asks for the ' + nf(pct) + '% part.' }] })
    ];
    var sol = ['Setup: ' + nf(pct) + ' / 100 × ' + nf(q) + ' ' + c.unitWord + ' = ' + nf(pct / 100, 4) + ' × ' + nf(q) + '.', '= ' + nf(ans) + ' ' + c.unitWord + '.', 'Calculator-free: 10% is the number with the decimal moved one place left; build other percents from it.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'bars', bars: [{ label: 'All', value: q }, { label: nf(pct) + '%', value: ans, hide: true }], unit: c.unitWord, ask: nf(pct) + '% of it?', result: nf(ans) + ' ' + c.unitWord }, given: { q: q, pct: pct } };
  };

  /* Rule of 70 doubling time, then the year */
  var RATES70 = [0.7, 1, 1.4, 1.75, 2, 2.5, 3.5];
  GEN.doubling = function(r, c){
    var rate = pick(r, c.rates || RATES70), y0 = between(r, c.years || [2015, 2025], 1), n0 = between(r, c.pop, c.popStep || 1);
    var td = calc('ruleOf70', [rate]), yr = calc('doublingYear', [y0, rate]);
    var text = '<p>' + c.lead.replace('{n0}', nf(n0)).replace('{y0}', y0).replace('{rate}', nf(rate)) + '</p><p><b>Use the rule of 70</b> to find the doubling time, then <b>the year</b> the ' + c.what + ' reaches ' + nf(2 * n0) + (c.scale ? ' ' + c.scale : '') + '.</p>';
    var steps = [
      setupStep('70 / ' + raw(rate), { mustUse: ['70', raw(rate)], hint: 'Doubling time = 70 ÷ the growth rate in percent (not as a decimal).',
        mistakes: [{ expr: '70 / ' + raw(rate / 100), why: 'Use the rate as a percent (' + nf(rate) + '), not as a decimal (' + nf(rate / 100, 4) + ').' }, { expr: raw(rate) + ' / 70', why: 'The other way up: 70 on top, the rate below.' }] }),
      answerStep(td, 'yr', { units: ['years', 'year'], mistakes: [{ value: 70 / (rate / 100), why: 'Use the rate as a percent (' + nf(rate) + '), not as a decimal.' }] }),
      numStep('year', 'In what year does it double?', yr, { hint: 'Read the question to the end: add the doubling time to the start year.',
        mistakes: [{ value: td, why: 'That is the doubling time. The question asks for the year: ' + y0 + ' + ' + nf(td) + '.' }] })
    ];
    var sol = ['Doubling time = 70 / ' + nf(rate) + ' = ' + nf(td, 1) + ' years.', 'Year = ' + y0 + ' + ' + nf(td, 1) + ' = ' + M.fixed(yr, 0) + '.', 'Readers take the point off when the doubling time is given as the year: read "in what year" to the end.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'timeline', y0: y0, n0: n0, td: td, scale: c.scale || '', noun: c.what }, given: { rate: rate, y0: y0, n0: n0 } };
  };

  /* Growth rate: (CBR - CDR) / 10, or with migration */
  GEN.growth = function(r, c){
    if(c.migration){
      var N = between(r, c.pop, c.popStep || 1000), b = between(r, c.b, 10), d = between(r, c.d, 10), im = between(r, c.im, 10), em = between(r, c.em, 10);
      var g = calc('growthRate', [b, d, im, em, N]);
      var text = '<p>' + c.lead.replace('{N}', nf(N)) + ' In one year there were ' + nf(b) + ' births, ' + nf(d) + ' deaths, ' + nf(im) + ' people moving in and ' + nf(em) + ' moving out.</p><p><b>Calculate the population growth rate</b> as a percent.</p>';
      var key = '((' + raw(b) + ' + ' + raw(im) + ') - (' + raw(d) + ' + ' + raw(em) + ')) / ' + raw(N) + ' * 100';
      var steps = [
        setupStep(key, { mustUse: [raw(b), raw(d), raw(im), raw(em), raw(N)], hint: 'Growth rate = [(births + immigration) − (deaths + emigration)] / population × 100.',
          mistakes: [{ expr: '(' + raw(b) + ' - ' + raw(d) + ') / ' + raw(N) + ' * 100', why: 'Count migration too: people moving in add, people moving out subtract.' },
            { expr: '((' + raw(b) + ' + ' + raw(em) + ') - (' + raw(d) + ' + ' + raw(im) + ')) / ' + raw(N) + ' * 100', why: 'Immigration (moving in) adds to the population; emigration (moving out) subtracts.' }] }),
        answerStep(g, '%', { units: ['percent'], places: 2, mistakes: [{ value: (b - d) / N * 100, why: 'That leaves out migration. Add immigration and subtract emigration.' }] })
      ];
      var sol = ['(' + nf(b) + ' + ' + nf(im) + ') − (' + nf(d) + ' + ' + nf(em) + ') = ' + nf(b + im - d - em) + ' more people in the year.', nf(b + im - d - em) + ' / ' + nf(N) + ' × 100 = ' + nf(g, 2) + '% per year.'];
      return { text: text, steps: steps, solution: sol, figure: { kind: 'flows', N: N, b: b, d: d, im: im, em: em, result: nf(g, 2) + '%' }, given: { b: b, d: d, im: im, em: em, N: N } };
    }
    var cbr = between(r, c.cbr, 1), cdr = between(r, c.cdr, 1), guard = 0;
    while(cbr - cdr < 3 && guard++ < 30){ cbr = between(r, c.cbr, 1); cdr = between(r, c.cdr, 1); }
    var gr = calc('naturalIncrease', [cbr, cdr]), td = calc('ruleOf70', [gr]);
    var text2 = '<p>' + c.lead + ' Its crude birth rate is ' + cbr + ' per 1,000 people per year and its crude death rate is ' + cdr + ' per 1,000.</p><p><b>Calculate the rate of natural increase</b> as a percent, then its <b>doubling time</b>.</p>';
    var steps2 = [
      setupStep('(' + cbr + ' - ' + cdr + ') / 10', { mustUse: [String(cbr), String(cdr)], hint: 'Rates are per 1,000; a percent is per 100, so divide (CBR − CDR) by 10.',
        mistakes: [{ expr: '(' + cbr + ' - ' + cdr + ') / 100', why: 'The rates are per 1,000 people. Per 1,000 to percent (per 100) is ÷ 10, not ÷ 100.' }] }),
      answerStep(gr, '%', { units: ['percent'], places: 1, mistakes: [{ value: cbr - cdr, why: 'That is per 1,000. Divide by 10 for a percent.' }] }),
      answerStep(td, 'yr', { key: 'year', label: 'Doubling time by the rule of 70, with its unit.', units: ['years'], places: 0, mistakes: [{ value: 70 / (cbr - cdr), why: 'Use the growth rate in percent (' + nf(gr, 1) + '), not per 1,000.' }] })
    ];
    var sol2 = ['Natural increase = (CBR − CDR) / 10 = (' + cbr + ' − ' + cdr + ') / 10 = ' + nf(gr, 1) + '% per year.', 'Doubling time = 70 / ' + nf(gr, 1) + ' = ' + nf(td, 1) + ' years.'];
    return { text: text2, steps: steps2, solution: sol2, figure: { kind: 'rates', cbr: cbr, cdr: cdr, result: nf(gr, 1) + '%' }, given: { cbr: cbr, cdr: cdr } };
  };

  /* Projections: doublings (n0 × 2^(t / Td)) or yearly compounding */
  GEN.projection = function(r, c){
    if(c.form === 'yearly'){
      var n0 = between(r, c.pop, c.popStep || 1), rate = between(r, c.rate, 1), t = between(r, c.t || [2, 4], 1);
      var ans = calc('exponential', [n0, rate, t]);
      var text = '<p>' + c.lead.replace('{n0}', nf(n0)).replace('{rate}', nf(rate)) + '</p><p><b>Calculate</b> the ' + c.what + ' after ' + t + ' years, growing ' + nf(rate) + '% each year.</p>';
      var steps = [
        setupStep(raw(n0) + ' * (1 + ' + raw(rate / 100) + ')^' + t, { mustUse: [raw(n0), String(t)], hint: 'Each year multiplies by (1 + rate). Raise it to the number of years.',
          mistakes: [{ expr: raw(n0) + ' * (1 + ' + raw(rate / 100) + ' * ' + t + ')', why: 'That adds the same amount every year. Growth compounds: multiply by (1 + rate) once per year.' }, { expr: raw(n0) + ' * ' + raw(rate / 100) + '^' + t, why: 'Multiply by (1 + rate), not by the rate alone.' }] }),
        answerStep(ans, c.unit, { units: c.units, places: 0, mistakes: [{ value: n0 * (1 + rate / 100 * t), why: 'That is simple (linear) growth. Each year grows on the year before.' }] })
      ];
      var sol = ['Each year multiplies by 1 + ' + nf(rate / 100, 3) + ' = ' + nf(1 + rate / 100, 3) + '.', nf(n0) + ' × ' + nf(1 + rate / 100, 3) + '^' + t + ' = ' + nf(ans, 0) + ' ' + c.unitWord + '.'];
      return { text: text, steps: steps, solution: sol, figure: { kind: 'growth', n0: n0, rate: rate, t: t, yearly: true, unit: c.unitWord, result: nf(ans, 0) }, given: { n0: n0, rate: rate, t: t } };
    }
    var rateD = pick(r, c.rates || [1, 1.4, 1.75, 2, 2.5, 3.5]), td = calc('ruleOf70', [rateD]), k = between(r, c.doublings || [2, 3], 1), tt = td * k;
    var p0 = between(r, c.pop, c.popStep || 1), ansD = calc('afterDoublings', [p0, tt, td]);
    var textD = '<p>' + c.lead.replace('{n0}', nf(p0)).replace('{rate}', nf(rateD)) + '</p><p>If the rate stays the same, <b>estimate the ' + c.what + ' ' + nf(tt) + ' years from now</b>. Use the rule of 70.</p>';
    var stepsD = [
      numStep('n', 'How many doubling times fit in ' + nf(tt) + ' years?', k, { abs: 0.01, hint: 'Doubling time = 70 ÷ rate; then years ÷ doubling time.', mistakes: [{ value: tt / rateD, why: 'Divide by the doubling time (70 / ' + nf(rateD) + ' = ' + nf(td) + ' years), not by the rate.' }] }),
      setupStep(raw(p0) + ' * 2^(' + raw(tt) + ' / ' + raw(td) + ')', { mustUse: [raw(p0)], hint: 'Each doubling multiplies by 2: start × 2^(number of doublings).',
        mistakes: [{ expr: raw(p0) + ' * 2 * ' + k, why: 'Doubling ' + k + ' times is × 2 × 2' + (k > 2 ? ' × 2' : '') + ' = × 2^' + k + ', not × 2 × ' + k + '.' }] }),
      answerStep(ansD, c.unit, { units: c.units, mistakes: [{ value: p0 * 2 * k, why: 'Doubling ' + k + ' times multiplies by 2^' + k + ' = ' + Math.pow(2, k) + ', not by 2 × ' + k + '.' }] })
    ];
    stepsD[1].cell.setup.mustUse = [raw(p0)];
    var solD = ['Doubling time = 70 / ' + nf(rateD) + ' = ' + nf(td) + ' years, so ' + nf(tt) + ' years is ' + k + ' doublings.', nf(p0) + ' × 2^' + k + ' = ' + nf(p0) + ' × ' + Math.pow(2, k) + ' = ' + nf(ansD) + ' ' + c.unitWord + '.'];
    return { text: textD, steps: stepsD, solution: solD, figure: { kind: 'growth', n0: p0, td: td, k: k, unit: c.unitWord, result: nf(ansD) }, given: { n0: p0, rate: rateD, t: tt, k: k } };
  };

  /* The 10% rule */
  GEN['ten-percent'] = function(r, c){
    var E = between(r, c.energy, c.energyStep || 1000), lv = c.levels, to = between(r, [2, Math.min(4, lv.length - 1)], 1), n = to;
    var ans = calc('tenPercent', [E, n]);
    var text = '<p>' + c.lead.replace('{E}', nf(E)) + '</p><p>Using the 10% rule, <b>calculate the energy available to the ' + lv[to] + '</b>.</p>';
    var times = []; for(var i = 0; i < n; i++) times.push('0.1');
    var steps = [
      setupStep(raw(E) + ' ' + c.unit + ' * ' + times.join(' * '), { unit: c.unit, mustUse: [raw(E)], hint: 'One × 0.1 for each step up from the producers. ' + hintUnits(c.unit),
        mistakes: [{ expr: raw(E) + ' ' + c.unit + ' * ' + times.concat(['0.1']).join(' * '), why: 'One step too many: from producers to ' + lv[to] + ' is ' + n + ' steps, so × 0.1 only ' + n + ' times.' },
          { expr: raw(E) + ' ' + c.unit + (n > 1 ? ' * ' + times.slice(1).join(' * ') : ''), why: 'One step too few: count the arrows from the producers to the ' + lv[to] + ' (' + n + ').' }] }),
      answerStep(ans, c.unit, { units: c.units, mistakes: [{ value: E * Math.pow(0.1, n + 1), why: 'The 10% rule applied once too often. Count the steps: ' + n + '.' }, { value: E * Math.pow(0.1, n - 1), why: 'One step too few. ' + lv[0] + ' to ' + lv[to] + ' is ' + n + ' steps.' }, { value: E * 0.1 * n, why: 'Each step keeps 10% of the step before: multiply by 0.1 each time, not 0.1 × ' + n + '.' }] }),
      choice('why', 'Why does only about 10% of the energy pass to the next level?', [
        ['Most of it is used for the organisms’ own life processes (cellular respiration) and lost as heat.', 'Right. Organisms use most of the energy they take in to live; it leaves as heat, which no consumer can eat.'],
        ['Energy is destroyed at each step of the food chain.', 'Energy is never destroyed (first law of thermodynamics); it is converted, mostly to heat.'],
        ['The consumers above eat only 10% of the organisms below.', 'Not the main reason: even what is eaten is mostly used for respiration and lost as heat.'],
        ['Energy is recycled back to the producers.', 'Matter cycles; energy flows one way and leaves as heat. It does not return to the producers.']
      ])
    ];
    var sol = [lv[0] + ' to ' + lv[to] + ' is ' + n + ' step' + (n > 1 ? 's' : '') + ': ' + nf(E) + ' × 0.1' + (n > 1 ? '^' + n : '') + ' = ' + nf(ans, 2) + ' ' + c.unit + '.', 'Calculator-free: × 0.1 moves the decimal one place left per step.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'levels', levels: lv.slice(0, to + 1), values: lv.slice(0, to + 1).map(function(_, i){ return calc('tenPercent', [E, i]); }), unit: c.unit, ask: to }, given: { E: E, n: n } };
  };

  /* GPP, respiration and NPP */
  GEN.npp = function(r, c){
    var g = between(r, c.gpp, c.step || 100), resp = Math.round(g * between(r, [35, 70], 1) / 1000) * 10, mode = pick(r, ['npp', 'gpp', 'r']);
    var npp = calc('npp', [g, resp]), u = c.unit;
    var text, steps, sol, ask, key, ans;
    if(mode === 'npp'){
      text = '<p>' + c.lead + ' Its gross primary productivity (GPP) is ' + nf(g) + ' ' + u + ' and its producers use ' + nf(resp) + ' ' + u + ' in cellular respiration.</p><p><b>Calculate the net primary productivity</b> (NPP).</p>';
      key = raw(g) + ' - ' + raw(resp); ans = npp; ask = 'NPP';
      steps = [setupStep(key, { mustUse: [raw(g), raw(resp)], hint: 'NPP = GPP − respiration.', mistakes: [{ expr: raw(g) + ' + ' + raw(resp), why: 'NPP is what is LEFT after respiration: subtract it.' }] }),
        answerStep(ans, u, { units: c.units, mistakes: [{ value: g + resp, why: 'NPP = GPP − respiration, not plus.' }] })];
    } else if(mode === 'gpp'){
      text = '<p>' + c.lead + ' Its net primary productivity (NPP) is ' + nf(npp) + ' ' + u + ' and its producers use ' + nf(resp) + ' ' + u + ' in cellular respiration.</p><p><b>Calculate the gross primary productivity</b> (GPP).</p>';
      key = raw(npp) + ' + ' + raw(resp); ans = calc('gpp', [npp, resp]); ask = 'GPP';
      steps = [setupStep(key, { mustUse: [raw(npp), raw(resp)], hint: 'GPP = NPP + respiration.', mistakes: [{ expr: raw(npp) + ' - ' + raw(resp), why: 'GPP is the total captured: NPP plus what respiration used.' }] }),
        answerStep(ans, u, { units: c.units, mistakes: [{ value: npp - resp, why: 'GPP = NPP + respiration.' }] })];
    } else {
      text = '<p>' + c.lead + ' Its GPP is ' + nf(g) + ' ' + u + ' and its NPP is ' + nf(npp) + ' ' + u + '.</p><p><b>Calculate the energy its producers use in cellular respiration.</b></p>';
      key = raw(g) + ' - ' + raw(npp); ans = calc('sub', [g, npp]); ask = 'Respiration';
      steps = [setupStep(key, { mustUse: [raw(g), raw(npp)], hint: 'Respiration = GPP − NPP.', mistakes: [{ expr: raw(g) + ' + ' + raw(npp), why: 'Respiration is the part of GPP that is not left as NPP: GPP − NPP.' }] }),
        answerStep(ans, u, { units: c.units, mistakes: [{ value: g + npp, why: 'Respiration = GPP − NPP.' }] })];
    }
    steps.push(choice('why', 'Which one is the energy available to primary consumers?', [
      ['NPP: what the producers store as new biomass after their own respiration.', 'Right. NPP is the producers’ energy left over, stored in biomass that herbivores can eat.'],
      ['GPP: all the energy the producers capture.', 'Producers use part of GPP for their own respiration; only NPP is left in biomass for consumers.'],
      ['Respiration: the energy producers use to live.', 'That energy leaves as heat; consumers cannot eat it.'],
      ['Sunlight: all the solar energy that reaches the plants.', 'Producers capture only a small part of the sunlight (GPP), and keep less (NPP).']
    ]));
    sol = ['NPP = GPP − respiration, so GPP = NPP + respiration.', ask + ' = ' + key.replace(/ - /g, ' − ') + ' = ' + nf(ans) + ' ' + u + '.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'npp', gpp: g, resp: resp, npp: npp, unit: u, ask: mode }, given: { gpp: g, resp: resp, mode: mode } };
  };

  /* Half-life: amount × 0.5^(t / half-life) */
  GEN['half-life'] = function(r, c){
    var hl = c.hl, n = between(r, c.n || [2, 5], 1), t = hl * n, a = between(r, c.amount, c.amountStep || 10);
    var left = calc('halfLifeLeft', [a, hl, t]), nh = calc('halfLives', [t, hl]);
    var text = '<p>' + c.lead.replace('{a}', nf(a)) + ' Its half-life is ' + nf(hl) + ' ' + c.tu + '.</p><p><b>Calculate how much is left</b> after ' + nf(t) + ' ' + c.tu + '.</p>';
    var steps = [
      numStep('n', 'How many half-lives pass in ' + nf(t) + ' ' + c.tu + '?', nh, { abs: 0.01, mistakes: [{ value: t * hl, why: 'Divide the time by the half-life: ' + nf(t) + ' / ' + nf(hl) + '.' }] }),
      setupStep(raw(a) + ' ' + c.unit + ' * 0.5^' + n, { unit: c.unit, mustUse: [raw(a)], hint: 'Each half-life halves it: amount × 0.5^(number of half-lives). ' + hintUnits(c.unit),
        mistakes: [{ expr: raw(a) + ' ' + c.unit + ' / (2 * ' + n + ')', why: 'Halving ' + n + ' times is ÷ 2^' + n + ' = ÷ ' + Math.pow(2, n) + ', not ÷ (2 × ' + n + ').' }, { expr: raw(a) + ' ' + c.unit + ' * 0.5^' + (n - 1), why: 'Count the half-lives again: ' + nf(t) + ' / ' + nf(hl) + ' = ' + n + '.' }] }),
      answerStep(left, c.unit, { units: c.units, mistakes: [{ value: a / (2 * n), why: 'Halving ' + n + ' times is ÷ ' + Math.pow(2, n) + ', not ÷ ' + (2 * n) + '.' }, { value: a - left, why: 'That is how much decayed. The question asks what is left.' }] })
    ];
    var sol = [nf(t) + ' / ' + nf(hl) + ' = ' + n + ' half-lives.', nf(a) + ' × 0.5^' + n + ' = ' + nf(a) + ' / ' + Math.pow(2, n) + ' = ' + nf(left, 3) + ' ' + c.unit + '.', 'Calculator-free: halve it ' + n + ' times: ' + [a].concat([1, 2, 3, 4, 5].slice(0, n).map(function(k){ return a / Math.pow(2, k); })).map(function(x){ return nf(x, 3); }).join(' → ') + '.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'decay', a: a, hl: hl, n: n, unit: c.unit, tu: c.tu }, given: { a: a, hl: hl, t: t } };
  };

  /* Chains of conversion factors: convert, emissions, water ... */
  function chainProblem(r, c, o){
    var v = between(r, c.start, c.startStep || 1), fs = c.factors.map(function(f){ return f.slice(); });
    var res = C().chain(v, c.startUnit, fs.map(function(f){ return [f[0], f[1], f[2], f[3]]; }));
    var setup = raw(v) + ' ' + c.startTyped + fs.map(function(f){ return ' * ' + raw(f[0]) + ' ' + f[4] + ' / ' + raw(f[2]) + ' ' + f[5]; }).join('');
    var wrong = raw(v) + ' ' + c.startTyped + fs.map(function(f, i){ return i === c.flipAt ? ' * ' + raw(f[2]) + ' ' + f[5] + ' / ' + raw(f[0]) + ' ' + f[4] : ' * ' + raw(f[0]) + ' ' + f[4] + ' / ' + raw(f[2]) + ' ' + f[5]; }).join('');
    var wrongV = v; fs.forEach(function(f, i){ wrongV = i === (c.flipAt || 0) ? wrongV * f[2] / f[0] : wrongV * f[0] / f[2]; });
    var text = '<p>' + c.lead.replace('{v}', nf(v)) + '</p><p><b>' + c.ask + '</b></p>';
    var steps = [
      setupStep(setup, { unit: c.setupUnit, units: c.extraUnits, mustUse: [raw(v)], hint: hintUnits(c.typedList),
        mistakes: [{ expr: wrong, why: 'A factor is upside down, so its units do not cancel. Put the unit you want to cancel on the bottom.' }] }),
      answerStep(res.value, c.answerUnit, { units: c.units, places: c.places, mistakes: [{ value: wrongV, why: 'A conversion factor is upside down. Check that each unit cancels.' }] })
    ];
    var sol = ['Line up the factors so each unit cancels: ' + nf(v) + ' ' + c.startShow + fs.map(function(f){ return ' × (' + nf(f[0]) + ' ' + f[6] + ' / ' + nf(f[2]) + ' ' + f[7] + ')'; }).join('') + '.', '= ' + nf(res.value, c.places == null ? 2 : c.places) + ' ' + c.answerShow + '.'];
    if(c.tip) sol.push(c.tip);
    return { text: text, steps: steps, solution: sol, figure: { kind: 'chain', start: { v: v, u: c.startShow }, factors: fs.map(function(f){ return { n: f[0], nu: f[6], d: f[2], du: f[7] }; }), result: nf(res.value, c.places == null ? 2 : c.places) + ' ' + c.answerShow }, given: { v: v, factors: fs.map(function(f){ return [f[0], f[1], f[2], f[3]]; }), startUnit: c.startUnit } };
  }
  GEN.convert = function(r, c){ return chainProblem(r, c); };
  GEN.emissions = function(r, c){ return chainProblem(r, c); };
  GEN.water = function(r, c){
    if(c.chain) return chainProblem(r, c);
    var vol = between(r, c.volume, c.volStep || 1000), area = between(r, c.area, 1), ans = calc('waterPerArea', [vol, area]);
    var text = '<p>' + c.lead.replace('{vol}', nf(vol)).replace('{area}', nf(area)) + '</p><p><b>Calculate the water used per ' + c.areaWord + '.</b></p>';
    var steps = [
      setupStep(raw(vol) + ' ' + c.vu + ' / ' + raw(area) + ' ' + c.au, { unit: c.vu + '/' + c.au, mustUse: [raw(vol), raw(area)], hint: 'Per area: divide the volume by the area. ' + hintUnits(c.vu + ', ' + c.au),
        mistakes: [{ expr: raw(area) + ' ' + c.au + ' / ' + raw(vol) + ' ' + c.vu, why: '"Per ' + c.areaWord + '" puts the ' + c.areaWord + 's on the bottom: volume / area.' }] }),
      answerStep(ans, c.vu + '/' + c.au, { units: c.units, mistakes: [{ value: area / vol, why: 'Volume over area, not area over volume.' }] })
    ];
    var sol = ['Water per ' + c.areaWord + ' = ' + nf(vol) + ' ' + c.vShow + ' / ' + nf(area) + ' ' + c.aShow + ' = ' + nf(ans, 1) + ' ' + c.vShow + ' per ' + c.areaWord + '.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'chain', start: { v: vol, u: c.vShow }, factors: [{ n: 1, nu: '', d: area, du: c.aShow }], result: nf(ans, 1) + ' ' + c.vShow + '/' + c.aShow }, given: { vol: vol, area: area } };
  };

  /* Per capita and density */
  GEN['per-capita'] = function(r, c){
    var tot = between(r, c.total, c.totalStep || 1) * (c.totalScale || 1), N = between(r, c.pop, c.popStep || 1) * (c.popScale || 1);
    var ans = c.density ? calc('density', [tot, N]) : calc('perCapita', [tot, N]);
    var w1 = words(tot), w2 = words(N);
    var text = '<p>' + c.lead.replace('{total}', c.useWords && w1.words ? w1.words : nf(tot)).replace('{pop}', c.useWords && w2.words ? w2.words : nf(N)) + '</p><p><b>' + c.ask + '</b></p>';
    var steps = [
      setupStep(raw(tot) + ' ' + c.tu + ' / ' + raw(N) + ' ' + c.nu, { unit: c.tu + '/' + c.nu, units: c.extraUnits, mustUse: [raw(tot), raw(N)], hint: (c.useWords ? 'A million is 10^6 (1e6); a billion is 10^9 (1e9). ' : '') + hintUnits(c.tu + ', ' + c.nu),
        mistakes: [{ expr: raw(N) + ' ' + c.nu + ' / ' + raw(tot) + ' ' + c.tu, why: '"Per ' + c.perWord + '" puts the ' + c.perWord + ' count on the bottom.' }] }),
      answerStep(ans, c.answerUnit, { units: c.units, places: c.places, mistakes: [{ value: N / tot, why: 'Divide the total by the number of ' + c.perWord + 's, not the other way.' }] })
    ];
    var sol = [(c.useWords ? nf(tot) + ' = ' + (w1.words || w1.sci) + ' and ' + nf(N) + ' = ' + (w2.words || w2.sci) + '. ' : '') + 'Per ' + c.perWord + ' = ' + nf(tot) + ' / ' + nf(N) + ' = ' + nf(ans, c.places == null ? 2 : c.places) + ' ' + c.answerShow + '.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'chain', start: { v: tot, u: c.tShow }, factors: [{ n: 1, nu: '', d: N, du: c.nShow }], result: nf(ans, c.places == null ? 2 : c.places) + ' ' + c.answerShow }, given: { tot: tot, N: N } };
  };

  /* Efficiency: overall efficiency of a chain, or the input needed */
  GEN.efficiency = function(r, c){
    var es = c.stages.map(function(s){ return between(r, s.eff, 1); });
    var overall = calc('chainEfficiency', es);
    if(c.form === 'input'){
      var out = between(r, c.out, c.outStep || 10), need = calc('inputNeeded', [out, overall]);
      var text = '<p>' + c.lead + ' ' + c.stages.map(function(s, i){ return s.name + ' ' + es[i] + '%'; }).join(', ') + '.</p><p><b>Overall efficiency</b>, then <b>' + c.ask.replace('{out}', nf(out)) + '</b></p>';
      var steps = [
        setupStep(es.map(function(e){ return raw(e / 100); }).join(' * ') + ' * 100', { mustUse: es.map(function(e){ return raw(e / 100); }), hint: 'Multiply the efficiencies as decimals, then × 100 for a percent.',
          mistakes: [{ expr: '(' + es.join(' + ') + ') / ' + es.length, why: 'Efficiencies in a chain multiply; they do not average.' }] }),
        answerStep(overall, '%', { units: ['percent'], places: 1, mistakes: [{ value: es.reduce(function(a, b){ return a + b; }, 0) / es.length, why: 'Efficiencies in a chain multiply, they do not average: each step keeps only part of what reached it.' }] }),
        answerStep(need, c.unit, { key: 'compare', label: c.ask.replace('{out}', nf(out)) + ' With its unit.', units: c.units, mistakes: [{ value: out * overall / 100, why: 'The input must be LARGER than the output: divide by the efficiency (as a decimal).' }] })
      ];
      var sol = ['Overall = ' + es.map(function(e){ return nf(e / 100, 2); }).join(' × ') + ' × 100 = ' + nf(overall, 1) + '%.', 'Input = output / efficiency = ' + nf(out) + ' / ' + nf(overall / 100, 4) + ' = ' + nf(need, 0) + ' ' + c.unit + '.'];
      return { text: text, steps: steps, solution: sol, figure: { kind: 'stages', stages: c.stages.map(function(s, i){ return { name: s.name, eff: es[i] }; }), overall: overall }, given: { es: es, out: out } };
    }
    var text2 = '<p>' + c.lead + ' ' + c.stages.map(function(s, i){ return s.name + ' ' + es[i] + '%'; }).join(', ') + '.</p><p><b>Calculate the overall efficiency</b> from ' + c.from + ' to ' + c.to + '.</p>';
    var steps2 = [
      setupStep(es.map(function(e){ return raw(e / 100); }).join(' * ') + ' * 100', { mustUse: es.map(function(e){ return raw(e / 100); }), hint: 'Multiply the efficiencies as decimals, then × 100.',
        mistakes: [{ expr: '(' + es.join(' + ') + ') / ' + es.length, why: 'Efficiencies in a chain multiply; they do not average.' }] }),
      answerStep(overall, '%', { units: ['percent'], places: 1, mistakes: [{ value: es.reduce(function(a, b){ return a + b; }, 0) / es.length, why: 'Efficiencies multiply, they do not average.' }, { value: Math.min.apply(null, es), why: 'The overall efficiency is lower than the weakest step: multiply them all.' }] }),
      choice('why', 'Where does the rest of the energy go?', [
        ['Mostly to waste heat at each step.', 'Right. Each conversion loses energy as heat (second law of thermodynamics), so the losses multiply.'],
        ['It is destroyed at each step.', 'Energy is never destroyed; it is converted to forms we cannot use, mostly heat.'],
        ['It is stored in the power lines.', 'Power lines lose a little energy as heat; they do not store it.'],
        ['It is turned back into fuel.', 'No step turns energy back into fuel; the losses leave as heat.']
      ])
    ];
    var sol2 = ['Overall = ' + es.map(function(e){ return nf(e / 100, 2); }).join(' × ') + ' × 100 = ' + nf(overall, 1) + '%.', 'Only ' + nf(overall, 1) + '% of the ' + c.from + ' energy ends as ' + c.to + '.'];
    return { text: text2, steps: steps2, solution: sol2, figure: { kind: 'stages', stages: c.stages.map(function(s, i){ return { name: s.name, eff: es[i] }; }), overall: overall }, given: { es: es } };
  };

  /* Cost and emissions savings: (before - after) × price */
  GEN.cost = function(r, c){
    var before = between(r, c.before, c.step || 10), cut = between(r, c.cut, c.step || 10), price = between(r, c.price, c.priceStep || 0.01);
    var st = c.step || 10; cut = Math.min(cut, Math.floor(before * 0.7 / st) * st);
    var after = before - cut;
    price = M.round(price, 2);
    var per = c.per, perN = c.perN;
    var save = calc('savings', [before, after, price]), yearly = calc('mul', [save, perN]);
    var text = '<p>' + c.lead.replace('{before}', nf(before)).replace('{after}', nf(after)) + ' ' + c.priceText.replace('{price}', (c.money ? '$' + M.fixed(price, 2) : nf(price))) + '</p><p><b>' + c.ask + '</b></p>';
    var key = '(' + raw(before) + ' - ' + raw(after) + ') ' + c.qu + '/' + per + ' * ' + perN + ' ' + per + '/yr * ' + raw(price) + ' ' + c.pu + '/' + c.qu;
    var steps = [
      setupStep(key, { unit: c.pu + '/yr', units: [per], mustUse: [raw(before), raw(after), raw(price)], hint: 'Saved = (before − after) × ' + perN + ' ' + per + 's × price. ' + hintUnits(c.qu + ', ' + per + ', yr, ' + c.pu),
        mistakes: [{ expr: raw(before) + ' ' + c.qu + '/' + per + ' * ' + perN + ' ' + per + '/yr * ' + raw(price) + ' ' + c.pu + '/' + c.qu, why: 'That is the whole ' + (c.money ? 'bill' : 'amount') + ' before the change. The saving uses the difference: (before − after).' }] }),
      answerStep(yearly, c.answerUnit, { units: c.units, places: 2, hint: c.money ? 'Type the number only (no $), then "dollars" or $ as the unit.' : '', mistakes: [{ value: save, why: 'That is one ' + per + '. The question asks for a year: × ' + perN + '.' }, { value: before * perN * price, why: 'Use the difference (before − after), not the before value.' }] })
    ];
    var sol = ['Saved each ' + per + ': ' + nf(before) + ' − ' + nf(after) + ' = ' + nf(cut) + ' ' + c.quShow + '.', 'Per year: ' + nf(cut) + ' × ' + perN + ' × ' + nf(price) + ' = ' + (c.money ? '$' + M.fixed(yearly, 2) : nf(yearly, 2) + ' ' + c.answerShow) + '.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'bars', bars: [{ label: 'Before', value: before }, { label: 'After', value: after }], unit: c.quShow + ' per ' + per, ask: 'Saved per year?', result: c.money ? '$' + M.fixed(yearly, 2) : nf(yearly, 2) + ' ' + c.answerShow, change: false, saving: true }, given: { before: before, after: after, price: price, perN: perN } };
  };

  /* LD50 read from a dose-response table, then a whole-body dose */
  GEN.dose = function(r, c){
    var ld = between(r, c.ld50, c.ldStep || 5), pts = [[0, 0], [M.round(ld * 0.4, 1), 10], [M.round(ld * 0.7, 1), 25], [ld, 50], [M.round(ld * 1.4, 1), 75], [M.round(ld * 2, 1), 95]];
    var read = C().ld50(pts), kg = between(r, c.mass, 1), dose = calc('doseFor', [read, kg]);
    var text = '<p>' + c.lead + ' The table gives the percent of test ' + c.animals + ' that died at each dose.</p>' +
      '<table class="env-data cs-tbl"><caption>Dose and response (invented data for practice)</caption><thead><tr><th scope="col">Dose (mg/kg)</th>' + pts.map(function(p){ return '<td>' + nf(p[0], 1) + '</td>'; }).join('') + '</tr></thead><tbody><tr><th scope="row">Died (%)</th>' + pts.map(function(p){ return '<td>' + p[1] + '</td>'; }).join('') + '</tr></tbody></table>' +
      '<p>Read the LD<sub>50</sub>, then <b>calculate the dose</b> that would be lethal to half of a group of ' + kg + ' kg ' + c.target + '.</p>';
    var steps = [
      numStep('read', 'LD<sub>50</sub> from the table, in mg/kg:', read, { d: 1, abs: 0.05 * read, unit: 'mg/kg', mistakes: [{ value: pts[4][0], why: 'That dose killed 75%. LD50 is the dose that kills 50%.' }] }),
      setupStep(raw(read) + ' mg/kg * ' + kg + ' kg', { unit: 'mg', mustUse: [raw(read), String(kg)], hint: 'Dose = (mg per kg) × body mass. The kg cancel. ' + hintUnits('mg/kg, kg'),
        mistakes: [{ expr: raw(read) + ' mg/kg / ' + kg + ' kg', why: 'Multiply by the body mass so the kg cancel; dividing leaves mg/kg².' }] }),
      answerStep(dose, 'mg', { units: ['milligrams'], mistakes: [{ value: read / kg, why: 'Multiply by the mass: mg/kg × kg = mg.' }] })
    ];
    var sol = ['LD50: the dose where 50% died = ' + nf(read, 1) + ' mg/kg.', nf(read, 1) + ' mg/kg × ' + kg + ' kg = ' + nf(dose, 1) + ' mg (' + nf(dose / 1000, 3) + ' g).', 'A lower LD50 means a more toxic substance: less of it kills half.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'curve', points: pts, ld: read }, given: { pts: pts, kg: kg } };
  };

  /* Biomagnification: concentration × factor^steps */
  GEN.biomag = function(r, c){
    var c0 = pick(r, c.c0), f = pick(r, c.factor || [10]), n = between(r, [2, Math.min(4, c.chain.length - 1)], 1);
    var ans = calc('biomagnify', [c0, f, n]);
    var text = '<p>' + c.lead.replace('{c0}', nf(c0, 6)) + ' At each step up the food chain the concentration is about ' + f + ' times higher.</p><p>Food chain: ' + c.chain.join(' → ') + '. <b>Estimate the concentration in the ' + c.chain[n] + '.</b></p>';
    var steps = [
      setupStep(raw(c0) + ' ppm * ' + f + '^' + n, { unit: 'ppm', mustUse: [raw(c0)], hint: 'One × ' + f + ' for each step up from the ' + c.chain[0] + '. ' + hintUnits('ppm'),
        mistakes: [{ expr: raw(c0) + ' ppm * ' + f + ' * ' + n, why: 'The factor multiplies at every step: × ' + f + '^' + n + ', not × ' + f + ' × ' + n + '.' }, { expr: raw(c0) + ' ppm * ' + f + '^' + (n + 1), why: 'Count the steps from the ' + c.chain[0] + ': ' + n + '.' }] }),
      answerStep(ans, 'ppm', { units: ['parts per million'], mistakes: [{ value: c0 * f * n, why: 'Biomagnification multiplies at each step: × ' + f + '^' + n + '.' }, { value: c0 * Math.pow(f, n + 1), why: 'One step too many. Count from the ' + c.chain[0] + '.' }] }),
      choice('why', 'Why does the concentration rise up the food chain?', [
        ['The toxin is fat-soluble and not excreted, and each predator eats many prey that each carry it.', 'Right. Persistent, fat-soluble toxins stay in tissue, so each level takes in the load of many organisms below it.'],
        ['Each organism makes more of the toxin as it grows.', 'Organisms do not make the toxin; they take it in and keep it.'],
        ['Top predators drink more contaminated water.', 'Most of the dose comes from food, not water: the prey already hold it.'],
        ['The toxin gets more concentrated as it breaks down.', 'Persistent toxins break down slowly; their concentration rises because they build up, not because they break down.']
      ])
    ];
    var sol = [nf(c0, 6) + ' ppm × ' + f + '^' + n + ' = ' + nf(c0, 6) + ' × ' + nf(Math.pow(f, n)) + ' = ' + nf(ans, 6) + ' ppm.', 'This rise up a food chain is biomagnification; build-up inside ONE organism over its life is bioaccumulation.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'levels', levels: c.chain.slice(0, n + 1), values: c.chain.slice(0, n + 1).map(function(_, i){ return calc('biomagnify', [c0, f, i]); }), unit: 'ppm', ask: n, up: true }, given: { c0: c0, f: f, n: n } };
  };

  /* Total fertility rate from age-specific rates */
  var BANDS = ['15–19', '20–24', '25–29', '30–34', '35–39', '40–44', '45–49'];
  GEN.tfr = function(r, c){
    var shape = c.shape || [0.25, 1, 1.1, 0.85, 0.5, 0.15, 0.03], level = between(r, c.level, 5);
    var asfr = shape.map(function(s){ return Math.max(1, Math.round(s * level / 5) * 5); });
    var t = calc('tfr', [asfr, 5]), above = calc('aboveReplacement', [t]);
    var text = '<p>' + c.lead + ' The table gives births per 1,000 women in each 5-year age group (invented data for practice).</p>' +
      '<table class="env-data cs-tbl"><caption>Births per 1,000 women per year</caption><thead><tr><th scope="col">Age</th>' + BANDS.map(function(b){ return '<td>' + b + '</td>'; }).join('') + '</tr></thead><tbody><tr><th scope="row">Rate</th>' + asfr.map(function(v){ return '<td>' + v + '</td>'; }).join('') + '</tr></tbody></table>' +
      '<p><b>Calculate the total fertility rate</b> (TFR): the average number of children a woman would have over her life at these rates.</p>';
    var steps = [
      setupStep('(' + asfr.join(' + ') + ') * 5 / 1000', { mustUse: asfr.map(String).slice(0, 2), hint: 'Add the rates, × 5 (each group is 5 years long), ÷ 1,000 (rates are per 1,000 women).',
        mistakes: [{ expr: '(' + asfr.join(' + ') + ') / 1000', why: 'Each age group lasts 5 years: multiply the sum by 5.' }, { expr: '(' + asfr.join(' + ') + ') * 5 / 100', why: 'The rates are per 1,000 women: divide by 1,000.' }] }),
      answerStep(t, 'children per woman', { units: ['children/woman', 'births per woman', 'births/woman', 'child per woman'], places: 2, mistakes: [{ value: t / 5, why: 'Multiply by 5: each woman spends 5 years in each age group.' }] }),
      choice('compare', 'Compare it with replacement level (about 2.1).', above > 0.05 ? [
        ['Above replacement: the population will tend to grow.', 'Right. ' + nf(t, 2) + ' > 2.1, so each generation is larger than the one before.'],
        ['Below replacement: the population will tend to shrink.', nf(t, 2) + ' is more than 2.1.'],
        ['At replacement: the population will stay the same size.', 'Replacement is about 2.1; ' + nf(t, 2) + ' is clearly above it.'],
        ['TFR cannot be compared with replacement level.', 'It can: replacement level is a TFR, about 2.1 children per woman.']
      ] : above < -0.05 ? [
        ['Below replacement: in the long run the population will tend to shrink.', 'Right. ' + nf(t, 2) + ' < 2.1, so each generation is smaller (unless migration makes up the gap).'],
        ['Above replacement: the population will tend to grow.', nf(t, 2) + ' is less than 2.1.'],
        ['At replacement: the population will stay the same size.', 'Replacement is about 2.1; ' + nf(t, 2) + ' is below it.'],
        ['TFR cannot be compared with replacement level.', 'It can: replacement level is a TFR, about 2.1 children per woman.']
      ] : [
        ['About at replacement: in the long run the population will level off.', 'Right. ' + nf(t, 2) + ' is close to 2.1.'],
        ['Far above replacement: rapid growth.', nf(t, 2) + ' is close to 2.1, not far above it.'],
        ['Far below replacement: rapid decline.', nf(t, 2) + ' is close to 2.1, not far below it.'],
        ['TFR cannot be compared with replacement level.', 'It can: replacement level is a TFR, about 2.1 children per woman.']
      ])
    ];
    var sol = ['Sum of the rates = ' + nf(asfr.reduce(function(a, b){ return a + b; }, 0)) + ' births per 1,000 women.', '× 5 years per group ÷ 1,000 = ' + nf(t, 2) + ' children per woman.', 'Replacement level is about 2.1 (2 to replace the parents, plus a little for children who die young).'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'tfr', asfr: asfr, bands: BANDS, tfr: t }, given: { asfr: asfr } };
  };

  /* Scale words: a per-capita value with givens in words, then scientific notation */
  GEN.scale = function(r, c){
    var tm = between(r, c.total, c.totalStep || 0.1), pm = between(r, c.pop, c.popStep || 1);
    var tot = M.round(tm * c.totalScale, 0), N = M.round(pm * c.popScale, 0), ans = calc('perCapita', [tot, N]);
    var text = '<p>' + c.lead.replace('{total}', nf(tm, 2) + ' ' + c.totalWord).replace('{pop}', nf(pm, 1) + ' ' + c.popWord) + '</p><p><b>' + c.ask + '</b></p>';
    var steps = [
      setupStep(raw(tot) + ' ' + c.tu + ' / ' + raw(N) + ' people', { unit: c.tu + '/person', mustUse: [raw(tot), raw(N)], hint: nf(1, 0) + ' ' + c.totalWord + ' = ' + sci(c.totalScale) + ' (' + raw(c.totalScale).replace('e+', 'e') + '); 1 ' + c.popWord + ' = ' + sci(c.popScale) + '. ' + hintUnits(c.tu + ', people'),
        mistakes: [{ expr: raw(tm) + ' ' + c.tu + ' / ' + raw(pm) + ' people', why: 'Write out the scale words: ' + nf(tm, 2) + ' ' + c.totalWord + ' is ' + raw(tm) + ' × 10^' + Math.round(Math.log10(c.totalScale)) + ', and ' + nf(pm, 1) + ' ' + c.popWord + ' is ' + raw(pm) + ' × 10^' + Math.round(Math.log10(c.popScale)) + '.' }] }),
      answerStep(ans, c.tu + '/person', { units: c.units, mistakes: [{ value: tm / pm, why: 'The scale words do not cancel: a ' + c.totalWord + ' over a ' + c.popWord + ' is 10^' + Math.round(Math.log10(c.totalScale / c.popScale)) + '.' }] }),
      choice('sci', 'Which is ' + nf(ans, 0) + ' ' + c.tShow + ' per person in scientific notation (3 figures)?', (function(){
        var e = Math.floor(Math.log10(ans) + 1e-12), m = +(ans / Math.pow(10, e)).toPrecision(3);
        return [[m + ' × 10' + sup(e), 'Right. Move the decimal point ' + e + ' places.'],
          [m + ' × 10' + sup(e + 1), 'One power of ten too many: count the places the decimal point moves (' + e + ').'],
          [m + ' × 10' + sup(e - 1), 'One power of ten too few: count the places the decimal point moves (' + e + ').'],
          [String(+(m * 10).toPrecision(4)) + ' × 10' + sup(e - 2), 'That is 10 times too small: ' + String(+(m * 10).toPrecision(4)) + ' × 10' + sup(e - 2) + ' = ' + m + ' × 10' + sup(e - 1) + '.']];
      })())
    ];
    var sol = [nf(tm, 2) + ' ' + c.totalWord + ' = ' + nf(tot) + ' = ' + sci(tot) + '; ' + nf(pm, 1) + ' ' + c.popWord + ' = ' + nf(N) + ' = ' + sci(N) + '.', 'Per person = ' + sci(tot) + ' / ' + sci(N) + ' = ' + nf(ans, 0) + ' ' + c.tShow + '.', 'Calculator-free: divide the numbers, subtract the powers of ten.'];
    return { text: text, steps: steps, solution: sol, figure: { kind: 'scale', tot: tot, N: N, ans: ans, tu: c.tShow }, given: { tot: tot, N: N } };
  };

  function generate(r, ctx, type){
    var t = type && ctx.types && ctx.types.indexOf(type) > -1 ? type : (ctx.types || [])[0];
    var g = GEN[t];
    if(!g) throw new Error('calculation-studio: no generator for type "' + t + '"');
    var p = g(r, ctx);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = t;
    return p;
  }

  M.register('calculationStudio', {
    TYPES: TYPES, CHAINS: CHAINS, BANDS: BANDS, RATES70: RATES70,
    nf: nf, raw: raw, sci: sci, words: words, pretty: pretty, tokens: tokens, unitText: unitText,
    chainState: chainState, keyOrder: keyOrder, keyFactors: keyFactors, chainKey: chainKey,
    generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
