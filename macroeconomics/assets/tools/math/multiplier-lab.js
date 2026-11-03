/* Multiplier lab model: ApMacroMath.multiplierLab (docs/apmacro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T3, docs/apmacro-briefs/t3.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmacro-tool-checks/multiplier-lab.mjs) and the
   test (scripts/test/apmacro-tool-multiplier-lab.test.mjs) run exactly this code.

   Every number comes from ApMacroCalc (through calc() below, a recipe each).

   Explore (the page draws these)
     ripple(kind, mpc, amt, n)  the spending rounds of a change: kind 'G'
                                (purchases change amt), 'T' (taxes change amt:
                                the first round is -MPC x amt), 'BB' (both
                                rise by amt). { rounds: [{ g, t, net }], total,
                                mult, shown }
     gap(kind, gapSize, mpc, tool, change)   closing a gap: { mult, effect,
                                need, frac (how far AD moved toward full
                                employment: 1 = closed), dir }
     money(scn, rr, X, n)       limited reserves: { req, ex, mm, dm, now,
                                rounds: [loan amounts] } for scn 'cash', 'buyBank',
                                'buyPublic', 'sellBank'
   Test yourself: generate(r, ctx, type) -> a problem for ApMacroTools.drill,
   types 'multiplier', 'total' (context spending, topic multipliers), 'gap'
   (context gap, topic fiscal-policy), 'money' (context money, topic
   banking-money-supply). Every choice step's key is option 0 (the page
   shuffles). */
(function(root){
  'use strict';
  var M = root.ApMacroMath;
  if(!M) return;
  function calc(fn){ return M.Calc().evaluate({ fn: fn, args: [].slice.call(arguments, 1) }); }

  var MPCS = [0.5, 0.75, 0.8, 0.9], RRS = [0.1, 0.2, 0.25];
  var TYPES = ['multiplier', 'total', 'gap', 'money'];
  var TITLE = { multiplier: 'The multipliers from the MPC', total: 'A change in spending or taxes', gap: 'Close the output gap', money: 'Money creation (limited reserves)' };

  /* ------------------------------------------------------------ text */
  // 13.3333 -> "13.33", 40 -> "40", 1200 -> "1,200"; a real minus sign.
  function n(x, d){
    var s = M.fixed(Math.abs(x), d == null ? 2 : d).replace(/\.?0+$/, '');
    if(s === '') s = '0';
    var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (x < 0 && Number(s.replace(/,/g, '')) ? '−' : '') + p.join('.');
  }
  function usd(x, unit){ return (x < 0 ? '−' : '') + '$' + n(Math.abs(x)) + (unit ? ' ' + unit : ''); }
  function pctOf(x){ return n(x * 100) + '%'; }
  function cents(x){ return n(x * 100) + ' cents'; }

  /* ---------------------------------------------------------- explore */
  function ripple(kind, mpc, amt, nr){
    nr = nr || 8;
    var k = calc('spendingMultiplier', mpc), kt = calc('taxMultiplier', mpc), rounds = [], gsum = 0, tsum = 0;
    for(var i = 0; i < nr; i++){
      var g = kind === 'T' ? 0 : calc('mul', amt, calc('pow', mpc, i));
      var t = kind === 'G' ? 0 : calc('mul', -amt, calc('pow', mpc, i + 1));
      rounds.push({ g: g, t: t, net: calc('add', g, t) });
      gsum += g; tsum += t;
    }
    var total = kind === 'G' ? calc('totalChange', amt, k) : kind === 'T' ? calc('totalChange', amt, kt) : calc('add', calc('totalChange', amt, k), calc('totalChange', amt, kt));
    return { rounds: rounds, total: total, mult: kind === 'G' ? k : kind === 'T' ? kt : calc('balancedBudgetMultiplier', mpc), k: k, kt: kt, shown: gsum + tsum };
  }
  /* kind 'recessionary' | 'inflationary'; tool 'G' | 'T'; change: the
     student's change in purchases or taxes (a cut is negative). */
  function gap(kind, size, mpc, tool, change){
    var m = tool === 'G' ? calc('spendingMultiplier', mpc) : calc('taxMultiplier', mpc);
    var signedGap = kind === 'recessionary' ? size : -size;           // the change in real GDP needed
    var effect = calc('totalChange', change, m), need = calc('gapChange', signedGap, m);
    return { mult: m, effect: effect, need: need, gapNeeded: signedGap, frac: calc('div', effect, signedGap), dir: need > 0 ? 'raise' : 'cut' };
  }
  var SCN = {
    cash: 'A customer deposits cash in a checking account',
    buyBank: 'The Fed buys bonds from a commercial bank',
    buyPublic: 'The Fed buys bonds from the public, who deposit the payment',
    sellBank: 'The Fed sells bonds to a commercial bank'
  };
  function money(scn, rr, X, nr){
    nr = nr || 8;
    var deposit = scn === 'cash' || scn === 'buyPublic' ? X : 0;
    var req = calc('requiredReserves', deposit, rr);
    var ex = scn === 'cash' || scn === 'buyPublic' ? calc('excessReserves', X, X, rr) : scn === 'buyBank' ? X : -X;
    var mm = calc('moneyMultiplier', rr), loans = calc('maxMoneyChange', ex, rr);
    var now = scn === 'buyPublic' ? X : 0;                              // new money the moment it happens
    var rounds = [];
    for(var i = 0; i < nr; i++) rounds.push(calc('mul', ex, calc('pow', calc('sub', 1, rr), i)));
    return { req: req, ex: ex, mm: mm, loans: loans, now: now, dm: calc('add', now, loans), rounds: rounds, deposit: deposit };
  }

  /* ---------------------------------------------------------- problems */
  function num(key, label, answer, mistakes, o){
    o = o || {};
    var s = { key: key, kind: 'num', label: label, practice: o.practice || '3.C', level: o.level || 'apply', cell: M.cell(answer, 0.004, mistakes || [], 0.006), d: 2 };
    if(o.hint) s.hint = o.hint;
    if(o.unit) s.unit = o.unit;
    return s;
  }
  function choice(key, label, options, why, o){
    o = o || {};
    return { key: key, kind: 'choice', label: label, options: options, why: why, correct: 0, practice: o.practice || '1.D', level: o.level || 'apply' };
  }
  var MULT_SLIP = 'You multiplied the gap by the multiplier. Divide: the policy change times the multiplier must equal the gap, so the change is the gap ÷ the multiplier.';

  function mpcText(mpc, giveMps){
    var mps = calc('mps', mpc);
    return giveMps ? 'Households save ' + cents(mps) + ' of each extra dollar of income (MPS = ' + n(mps) + ').'
      : 'Households spend ' + cents(mpc) + ' of each extra dollar of income (MPC = ' + n(mpc) + ').';
  }
  var SIMPLE = ' Use the simple multiplier model: a constant price level, no income taxes and no imports.';

  function genMultiplier(r){
    var mpc = r.pick(MPCS), giveMps = r() < 0.4, amt = r.pick([10, 20, 25, 40, 50, 100]);
    var mps = calc('mps', mpc), k = calc('spendingMultiplier', mpc), kt = calc('taxMultiplier', mpc);
    var gUp = calc('totalChange', amt, k), tUp = calc('totalChange', amt, kt), net = calc('add', gUp, tUp);
    var text = '<p>' + mpcText(mpc, giveMps) + SIMPLE + '</p>';
    var steps = [
      num('k', 'The spending multiplier', k, [
        { value: calc('div', 1, mpc), why: 'You divided 1 by the MPC. The spending multiplier is 1 ÷ MPS, that is 1 ÷ (1 − MPC).' },
        { value: calc('div', mpc, mps), why: 'That is the size of the tax multiplier (MPC ÷ MPS). The spending multiplier is 1 ÷ MPS.' },
        { value: mps, why: 'That is the MPS itself. The multiplier is 1 divided by it.' }
      ], { hint: 'Spending multiplier = 1 ÷ MPS', practice: '3.A' }),
      num('kt', 'The tax multiplier (type its sign)', kt, [
        { value: -kt, why: 'Right size, wrong sign. A tax increase lowers spending, so the tax multiplier is negative: −MPC ÷ MPS.' },
        { value: -k, why: 'The tax multiplier is one smaller in size than the spending multiplier: −MPC ÷ MPS. Only the MPC share of a tax change is spent in the first round.' },
        { value: k, why: 'That is the spending multiplier. The tax multiplier is −MPC ÷ MPS: negative, and one smaller in size.' }
      ], { hint: 'Tax multiplier = −MPC ÷ MPS', practice: '3.A' }),
      choice('bb', 'Government purchases and taxes both rise by ' + usd(amt, 'billion') + '. What is the largest change in real GDP?', [
        'Real GDP rises by ' + usd(net, 'billion'),
        'Real GDP does not change',
        'Real GDP rises by ' + usd(gUp, 'billion'),
        'Real GDP falls by ' + usd(-tUp, 'billion')
      ], [
        'Right. Purchases add ' + usd(amt) + ' × ' + n(k) + ' = ' + usd(gUp) + ' billion; the tax rise takes away ' + usd(amt) + ' × ' + n(-kt) + ' = ' + usd(-tUp) + ' billion. The net change is ' + usd(net) + ' billion, the size of the change itself.',
        'They do not cancel. All of the new purchases are spent in the first round, but only the MPC share of the tax rise comes out of spending, so the purchases win by ' + usd(net) + ' billion.',
        'That counts only the purchases. The tax rise also lowers consumption: subtract ' + usd(amt) + ' × ' + n(-kt) + ' = ' + usd(-tUp) + ' billion.',
        'That counts only the tax rise. The purchases add ' + usd(gUp) + ' billion, which is more.'
      ], { practice: '2.C', level: 'analyze' })
    ];
    return { type: 'multiplier', values: { mpc: mpc, mps: mps, giveMps: giveMps, amt: amt, k: k, kt: kt, net: net }, text: text, steps: steps,
      solution: [
        (giveMps ? 'MPS = ' + n(mps) + ', so MPC = 1 − ' + n(mps) + ' = ' + n(mpc) + '.' : 'MPC = ' + n(mpc) + ', so MPS = 1 − ' + n(mpc) + ' = ' + n(mps) + '.'),
        'Spending multiplier = 1 ÷ MPS = 1 ÷ ' + n(mps) + ' = <b>' + n(k) + '</b>.',
        'Tax multiplier = −MPC ÷ MPS = −' + n(mpc) + ' ÷ ' + n(mps) + ' = <b>' + n(kt) + '</b>: negative, and one smaller in size.',
        'Purchases and taxes both up ' + usd(amt) + ' billion: ' + usd(gUp) + ' − ' + usd(-tUp) + ' = <b>' + usd(net, 'billion') + '</b>. Equal changes in purchases and taxes change real GDP by the amount of the change.'
      ] };
  }

  var TOTAL_CASES = [
    { id: 'G+', tool: 'G', sign: 1, say: function(a){ return 'The government raises its purchases by ' + usd(a, 'billion') + '.'; } },
    { id: 'G-', tool: 'G', sign: -1, say: function(a){ return 'The government cuts its purchases by ' + usd(a, 'billion') + '.'; } },
    { id: 'I-', tool: 'G', sign: -1, say: function(a){ return 'Business investment spending falls by ' + usd(a, 'billion') + '.'; } },
    { id: 'T-', tool: 'T', sign: -1, say: function(a){ return 'The government cuts taxes by ' + usd(a, 'billion') + '.'; } },
    { id: 'T+', tool: 'T', sign: 1, say: function(a){ return 'The government raises taxes by ' + usd(a, 'billion') + '.'; } }
  ];
  function genTotal(r){
    var cs = r.pick(TOTAL_CASES), mpc = r.pick(cs.tool === 'T' ? MPCS.slice(1) : MPCS), giveMps = r() < 0.3, amt = r.pick([5, 10, 20, 25, 40, 50]);
    var k = calc('spendingMultiplier', mpc), kt = calc('taxMultiplier', mpc), m = cs.tool === 'G' ? k : kt, size = calc('abs', m);
    var change = calc('mul', cs.sign, amt), dy = calc('totalChange', change, m);
    var other = cs.tool === 'G' ? calc('abs', kt) : k;
    var text = '<p>' + cs.say(amt) + ' ' + mpcText(mpc, giveMps) + SIMPLE + '</p>';
    var dyMist = [
      { value: calc('div', dy, calc('mul', m, m)), why: 'You divided by the multiplier. Here the change in spending is given, so multiply it. Divide only when you start from a gap and want the policy.' },
      { value: change, why: 'That is only the first round. Each round of spending becomes someone\'s income, and the MPC share of it is spent again: multiply by the multiplier.' },
      { value: -dy, why: 'Right size, wrong direction. ' + (cs.tool === 'T' ? 'A tax cut raises disposable income and spending, so real GDP rises; a tax rise lowers it.' : 'Less spending lowers real GDP; more spending raises it.') }
    ];
    if(cs.tool === 'T') dyMist.unshift({ value: calc('mul', -cs.sign, amt, k), why: 'You used the spending multiplier. Only the MPC share of a tax change is spent in the first round, so use the tax multiplier, MPC ÷ MPS = ' + n(-kt) + '.' });
    var steps = [
      num('m', 'The size of the multiplier for this change', size, [
        { value: other, why: cs.tool === 'G' ? 'That is the tax multiplier. A change in purchases or investment is spent in full in the first round: use 1 ÷ MPS.' : 'That is the spending multiplier. A tax change works through consumption, and only the MPC share is spent at first: use MPC ÷ MPS.' },
        { value: calc('div', 1, mpc), why: 'You divided by the MPC. Divide by the MPS: 1 − MPC.' }
      ], { hint: cs.tool === 'G' ? 'Spending multiplier = 1 ÷ MPS' : 'Tax multiplier size = MPC ÷ MPS', practice: '3.A' }),
      num('dy', 'The largest change in real GDP (type a fall as a negative number)', dy, dyMist, { unit: 'billion dollars', practice: '3.C' })
    ];
    return { type: 'total', values: { mpc: mpc, amt: amt, change: change, tool: cs.tool, cs: cs.id, k: k, kt: kt, dy: dy }, text: text, steps: steps,
      solution: [
        'MPS = 1 − ' + n(mpc) + ' = ' + n(calc('mps', mpc)) + '.',
        cs.tool === 'G' ? 'A change in purchases or investment uses the spending multiplier: 1 ÷ MPS = <b>' + n(k) + '</b>.' : 'A tax change uses the tax multiplier: −MPC ÷ MPS = <b>' + n(kt) + '</b>.',
        'Change in real GDP = change × multiplier = ' + usd(change) + ' × ' + n(m) + ' = <b>' + usd(dy, 'billion') + '</b>' + (dy > 0 ? ' (a rise).' : ' (a fall).'),
        'This is the largest change: rising prices and other leakages make the real effect smaller.'
      ] };
  }

  function genGap(r){
    // MPC 0.5 makes the tax multiplier 1, where dividing and multiplying the gap agree: not for a tax drill.
    var kind = r() < 0.5 ? 'recessionary' : 'inflationary', tool = r() < 0.55 ? 'G' : 'T', mpc = r.pick(tool === 'T' ? MPCS.slice(1) : MPCS);
    var size = r.pick([20, 40, 50, 60, 80, 90, 100, 120, 150, 180, 200]), yf = r.pick([800, 1000, 1200, 1500, 1800, 2000, 2400]);
    var y = kind === 'recessionary' ? yf - size : yf + size;
    var g = gap(kind, size, mpc, tool, 0), k = calc('spendingMultiplier', mpc), kt = calc('taxMultiplier', mpc);
    var mSize = calc('abs', g.mult), need = calc('abs', g.need);
    var up = kind === 'recessionary';
    var text = '<p>Real GDP is ' + usd(y, 'billion') + ' and full-employment real GDP is ' + usd(yf, 'billion') + '. The MPC is ' + n(mpc) + '. The government will close the gap by changing ' + (tool === 'G' ? 'its purchases' : 'taxes') + ' alone.' + SIMPLE + '</p>';
    var sizeMist = [
      { value: calc('mul', size, mSize), why: MULT_SLIP },
      { value: size, why: 'That is the whole gap. The multiplier makes a smaller change enough: divide the gap by the multiplier.' }
    ];
    if(tool === 'T') sizeMist.push({ value: calc('gapChange', size, k), why: 'You divided by the spending multiplier. A tax change uses the tax multiplier, MPC ÷ MPS = ' + n(-kt) + ', so taxes must change by more than purchases would.' });
    else sizeMist.push({ value: calc('gapChange', size, calc('abs', kt)), why: 'You divided by the tax multiplier. Purchases use the spending multiplier, 1 ÷ MPS = ' + n(k) + '.' });
    var dirs = tool === 'G' ? ['Increase government purchases', 'Decrease government purchases'] : ['Cut taxes', 'Raise taxes'];
    if(!up) dirs.reverse();
    var steps = [
      choice('kind', 'What kind of gap is this, and how big is it?', [
        (up ? 'A recessionary gap of ' : 'An inflationary gap of ') + usd(size, 'billion'),
        (up ? 'An inflationary gap of ' : 'A recessionary gap of ') + usd(size, 'billion'),
        (up ? 'A recessionary gap of ' : 'An inflationary gap of ') + usd(y, 'billion'),
        'No gap: the economy is at full employment'
      ], [
        'Right: real GDP is ' + (up ? 'below' : 'above') + ' full employment, and the distance between ' + usd(y) + ' and ' + usd(yf) + ' billion is ' + usd(size, 'billion') + '.',
        'Look at which is bigger. Real GDP is ' + (up ? 'below' : 'above') + ' full employment, so the gap is ' + (up ? 'recessionary' : 'inflationary') + '.',
        'The gap is the distance between real GDP and full-employment real GDP: ' + usd(size, 'billion') + ', not the level of real GDP.',
        'Real GDP and full-employment real GDP differ by ' + usd(size, 'billion') + ', so there is a gap.'
      ], { practice: '2.A' }),
      choice('dir', 'Which way should ' + (tool === 'G' ? 'purchases' : 'taxes') + ' change?', dirs, [
        up ? 'Right: a recessionary gap needs more aggregate demand, so ' + (tool === 'G' ? 'purchases rise' : 'taxes fall, which raises disposable income and consumption') + '.' : 'Right: an inflationary gap needs less aggregate demand, so ' + (tool === 'G' ? 'purchases fall' : 'taxes rise, which lowers disposable income and consumption') + '.',
        up ? 'That lowers aggregate demand and makes a recessionary gap worse. Real GDP must rise.' : 'That raises aggregate demand and makes an inflationary gap worse. Real GDP must fall.'
      ], { practice: '1.D' }),
      num('m', 'The size of the ' + (tool === 'G' ? 'spending' : 'tax') + ' multiplier', mSize, [
        { value: tool === 'G' ? calc('abs', kt) : k, why: tool === 'G' ? 'That is the tax multiplier. Purchases use 1 ÷ MPS.' : 'That is the spending multiplier. Taxes use MPC ÷ MPS.' },
        { value: calc('div', 1, mpc), why: 'You divided by the MPC. Divide by the MPS: 1 − MPC.' }
      ], { hint: tool === 'G' ? 'Spending multiplier = 1 ÷ MPS' : 'Tax multiplier size = MPC ÷ MPS', practice: '3.A' }),
      num('size', 'How much should ' + (tool === 'G' ? 'purchases' : 'taxes') + ' change? (type the size, in billions)', need, sizeMist, { unit: 'billion dollars', hint: 'Change = gap ÷ multiplier', practice: '3.C', level: 'analyze' })
    ];
    return { type: 'gap', values: { kind: kind, tool: tool, mpc: mpc, size: size, y: y, yf: yf, mult: g.mult, need: g.need }, text: text, steps: steps,
      solution: [
        'The gap: real GDP of ' + usd(y, 'billion') + ' is ' + usd(size, 'billion') + ' ' + (up ? 'below' : 'above') + ' full employment (' + usd(yf, 'billion') + '), ' + (up ? 'a recessionary' : 'an inflationary') + ' gap.',
        '<b>Direction first:</b> ' + (up ? 'raise' : 'lower') + ' aggregate demand, so ' + (tool === 'G' ? (up ? 'increase' : 'decrease') + ' government purchases' : (up ? 'cut' : 'raise') + ' taxes') + '.',
        'Multiplier: ' + (tool === 'G' ? '1 ÷ MPS = 1 ÷ ' + n(calc('mps', mpc)) + ' = ' + n(k) : 'MPC ÷ MPS = ' + n(mpc) + ' ÷ ' + n(calc('mps', mpc)) + ' = ' + n(mSize)) + '.',
        '<b>Divide the gap:</b> ' + usd(size) + ' ÷ ' + n(mSize) + ' = <b>' + usd(need, 'billion') + '</b>. Check: ' + usd(need) + ' × ' + n(mSize) + ' = ' + usd(size) + ' billion, the gap.'
      ] };
  }

  function genMoney(r){
    var scn = r.pick(['cash', 'buyBank', 'buyPublic', 'sellBank']), rr = r.pick(RRS), X = r.pick([100, 200, 400, 500, 1000, 2000]);
    var m = money(scn, rr, X), mm = m.mm;
    var unit = 'million dollars', sell = scn === 'sellBank';
    var say = {
      cash: 'A customer deposits ' + usd(X, 'million') + ' in cash into her checking account at a bank.',
      buyBank: 'The Federal Reserve buys ' + usd(X, 'million') + ' of government bonds from a commercial bank.',
      buyPublic: 'The Federal Reserve buys ' + usd(X, 'million') + ' of government bonds from the public, and the sellers deposit the payment in their checking accounts.',
      sellBank: 'The Federal Reserve sells ' + usd(X, 'million') + ' of government bonds to a commercial bank, which pays from its reserves.'
    }[scn];
    var text = '<p>' + say + ' The required reserve ratio is ' + pctOf(rr) + '. Use the limited-reserves model: banks hold no excess reserves to begin with, lend out all new excess reserves, and every loan is redeposited (no one holds more cash).</p>';
    var exMist = [], dmMist = [];
    if(scn === 'cash' || scn === 'buyPublic'){
      exMist.push({ value: X, why: 'Not all of the new deposit is excess. The bank must keep ' + pctOf(rr) + ' of it as required reserves: excess = ' + usd(X) + ' − ' + usd(m.req) + '.' });
      exMist.push({ value: m.req, why: 'That is the required part. Excess reserves are what is left over: the new reserves minus the required reserves.' });
    }
    if(scn === 'buyBank') exMist.push({ value: calc('mul', X, calc('sub', 1, rr)), why: 'The bank\'s deposits did not change, so none of the new reserves is required: all ' + usd(X) + ' million is excess.' });
    if(sell) exMist.push({ value: X, why: 'Right size, wrong direction: the bank paid with its reserves, so its excess reserves fall. Type a fall as a negative number.' });
    if(scn === 'cash'){
      dmMist.push({ value: calc('div', X, rr), why: 'That counts the cash deposit itself. Cash moving into a checking account does not change the money supply at first: only the new loans add money.' });
      dmMist.push({ value: m.ex, why: 'That is only the first bank\'s loan. Each loan is redeposited and lent again: multiply the excess reserves by the money multiplier.' });
    }
    if(scn === 'buyBank') dmMist.push({ value: calc('div', calc('mul', X, calc('sub', 1, rr)), rr), why: 'All of the new reserves are excess (the bank\'s deposits did not change), so the full ' + usd(X) + ' million is multiplied.' });
    if(scn === 'buyPublic'){
      dmMist.push({ value: m.loans, why: 'You left out the new deposits themselves. The sellers\' ' + usd(X) + ' million in checking accounts is new money too: add it to the loans.' });
      dmMist.push({ value: X, why: 'That is only the new deposit. Banks lend the excess reserves, and the loans are redeposited: add ' + usd(m.ex) + ' × ' + n(mm) + ' of loans.' });
    }
    if(sell){
      dmMist.push({ value: -m.dm, why: 'Right size, wrong direction. Selling bonds drains reserves, so the money supply can fall by this much: type a negative number.' });
      dmMist.push({ value: m.ex, why: 'That is only the first round. Multiply the fall in excess reserves by the money multiplier.' });
    }
    dmMist.push({ value: calc('mul', m.ex, rr), why: 'You multiplied by the reserve ratio. Multiply by the money multiplier, 1 ÷ ' + n(rr) + ' = ' + n(mm) + '.' });
    var steps = [
      num('ex', 'The change in the bank\'s excess reserves (a fall is negative)', m.ex, exMist, { unit: unit, practice: '3.C' }),
      num('mm', 'The money multiplier', mm, [
        { value: calc('div', 1, calc('sub', 1, rr)), why: 'You used 1 ÷ (1 − ratio). The money multiplier is 1 ÷ the required reserve ratio.' },
        { value: rr, why: 'That is the reserve ratio. The money multiplier is 1 divided by it.' },
        { value: calc('mul', rr, 100), why: 'That is the ratio as a percent. The money multiplier is 1 ÷ ' + n(rr) + '.' }
      ], { hint: 'Money multiplier = 1 ÷ required reserve ratio', practice: '3.A' }),
      num('dm', 'The largest possible change in the money supply (a fall is negative)', m.dm, dmMist, { unit: unit, practice: '3.C', level: 'analyze' })
    ];
    var sol = [];
    if(scn === 'cash') sol.push('The deposit adds ' + usd(X) + ' million of reserves; ' + pctOf(rr) + ' of it, ' + usd(m.req) + ' million, is required, so excess reserves rise by <b>' + usd(m.ex, 'million') + '</b>.');
    if(scn === 'buyBank') sol.push('The Fed pays the bank with ' + usd(X) + ' million of new reserves. Its deposits do not change, so all of it is excess: <b>' + usd(m.ex, 'million') + '</b>.');
    if(scn === 'buyPublic') sol.push('Deposits rise by ' + usd(X) + ' million (new money right away); the bank must hold ' + usd(m.req) + ' million, so excess reserves rise by <b>' + usd(m.ex, 'million') + '</b>.');
    if(sell) sol.push('The bank pays with ' + usd(X) + ' million of its reserves, so its excess reserves fall by that much: <b>' + usd(m.ex, 'million') + '</b>.');
    sol.push('Money multiplier = 1 ÷ ' + n(rr) + ' = <b>' + n(mm) + '</b>.');
    if(scn === 'cash') sol.push('Loans can create ' + usd(m.ex) + ' × ' + n(mm) + ' = <b>' + usd(m.dm, 'million') + '</b> of new money. The deposit itself adds nothing: the cash was already money.');
    if(scn === 'buyBank') sol.push('Largest change in the money supply: ' + usd(m.ex) + ' × ' + n(mm) + ' = <b>' + usd(m.dm, 'million') + '</b>.');
    if(scn === 'buyPublic') sol.push('Largest change: the ' + usd(X) + ' million deposit plus ' + usd(m.ex) + ' × ' + n(mm) + ' = ' + usd(m.loans) + ' million of loans = <b>' + usd(m.dm, 'million') + '</b> (that is ' + usd(X) + ' × ' + n(mm) + ').');
    if(sell) sol.push('Largest change: ' + usd(m.ex) + ' × ' + n(mm) + ' = <b>' + usd(m.dm, 'million') + '</b>, a fall.');
    sol.push('This is the limited-reserves model. With ample reserves, the Fed sets its policy rate with administered rates instead, and the money multiplier does not describe what banks do.');
    return { type: 'money', values: { scn: scn, rr: rr, X: X, ex: m.ex, mm: mm, dm: m.dm, req: m.req }, text: text, steps: steps, solution: sol };
  }

  var GEN = { multiplier: genMultiplier, total: genTotal, gap: genGap, money: genMoney };
  function generate(r, ctx, type){
    var list = (ctx && ctx.types) || TYPES;
    var t = type && list.indexOf(type) > -1 ? type : r.pick(list);
    var p = GEN[t](r);
    p.ctx = ctx ? ctx.id : t;
    p.topic = ctx ? ctx.topic : 'multipliers';
    p.title = TITLE[t];
    return p;
  }

  root.ApMacroMath.register('multiplierLab', { TYPES: TYPES, TITLE: TITLE, MPCS: MPCS, RRS: RRS, SCN: SCN, n: n, usd: usd,
    ripple: ripple, gap: gap, money: money, generate: generate });
})(typeof window !== 'undefined' ? window : globalThis);
