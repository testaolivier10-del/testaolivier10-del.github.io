/* AD-AS lab model: ApMacroMath.adasLab (docs/apmacro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/apmacro-briefs/t4.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmacro-tool-checks/adas-lab.mjs) and the
   test (scripts/test/apmacro-tool-adas-lab.test.mjs) run exactly this code.

   The economy is the shared AD-AS graph (ApMacroGraph kind "adas"): AD and SRAS
   at 5 plus their shifts a and s, LRAS at full employment (5). The Phillips
   graph beside it (kind "phillips") is tied to it point for point:
     unemployment u = 10 - real GDP  (output above YF: unemployment below the natural rate)
     inflation      = the price-level height (an AD shift moves along SRPC)
     SRPC shift     = -(SRAS shift)  (SRAS left, cost-push: SRPC right)
   so an AD shock moves along SRPC and an SRAS shock shifts it, and long-run
   self-adjustment (nominal wages, so SRAS) shifts SRPC back to LRPC.

     SHOCKS                    the named causes: { id, curve, dir, because, text, link }
     state(a, s)               { eq, gap ('recessionary'|'inflationary'|'none'), gapSize,
                                 srpc, point, longRunS }
     generate(r, ctx, type)    a drill problem for ApMacroTools.drill; types
                               shock, gap, selfadjust, phillips
   A graph step is a choice step that carries `graph` (its ApMacroGraph spec):
   the page grades the student's graph with ApMacroGrade.graph and ticks the
   matching option (0: right, 1: not yet), so drill() records it like any step. */
(function(root){
  'use strict';
  var M = root.ApMacroMath;
  if(!M) return;
  function G(){ return root.ApMacroGraph; }
  function C(){ return root.ApMacroCalc; }

  /* ------------------------------------------------------------ shocks */
  // dir +1: right (an increase), -1: left. `because` feeds the graph slip line
  // ("... shifts short-run aggregate supply"); `link` is the chain in words.
  var SHOCKS = [
    { id: 'confidence-up', curve: 'AD', dir: 1, group: 'Spending', label: 'Consumer confidence rises', because: 'a rise in consumer confidence', text: 'Households grow more confident about their jobs and spend more of their income.', link: 'Consumption (C) rises at every price level, so AD shifts right.' },
    { id: 'gov-up', curve: 'AD', dir: 1, group: 'Spending', label: 'Government spending rises', because: 'more government spending', text: 'The government buys more goods and services (new roads and schools).', link: 'Government purchases (G) are a part of AD, so AD shifts right.' },
    { id: 'tax-cut', curve: 'AD', dir: 1, group: 'Spending', label: 'Personal income taxes are cut', because: 'a cut in personal income taxes', text: 'Personal income taxes are cut, so households keep more of what they earn.', link: 'Disposable income rises, consumption (C) rises, so AD shifts right.' },
    { id: 'abroad-up', curve: 'AD', dir: 1, group: 'Spending', label: 'Incomes abroad rise', because: 'rising incomes abroad', text: 'Incomes rise in the country’s trading partners, so foreigners buy more of its exports.', link: 'Exports and so net exports (X − M) rise, so AD shifts right.' },
    { id: 'expect-up', curve: 'AD', dir: 1, group: 'Spending', label: 'Firms expect higher future sales', because: 'more optimistic business expectations', text: 'Firms expect strong future sales and buy more new equipment.', link: 'Investment (I) rises, so AD shifts right.' },
    { id: 'wealth-down', curve: 'AD', dir: -1, group: 'Spending', label: 'Stock prices crash', because: 'a fall in household wealth', text: 'Stock and house prices fall sharply, so households feel poorer.', link: 'Lower wealth cuts consumption (C), so AD shifts left.' },
    { id: 'gov-down', curve: 'AD', dir: -1, group: 'Spending', label: 'Government spending is cut', because: 'a cut in government spending', text: 'The government cuts its purchases of goods and services.', link: 'Government purchases (G) fall, so AD shifts left.' },
    { id: 'tax-up', curve: 'AD', dir: -1, group: 'Spending', label: 'Personal income taxes rise', because: 'a rise in personal income taxes', text: 'Personal income taxes rise, so households keep less of what they earn.', link: 'Disposable income falls, consumption (C) falls, so AD shifts left.' },
    { id: 'abroad-down', curve: 'AD', dir: -1, group: 'Spending', label: 'A recession abroad', because: 'a recession in trading partners', text: 'A recession hits the country’s main trading partners, so they buy fewer of its exports.', link: 'Exports and so net exports fall, so AD shifts left.' },
    { id: 'rates-up', curve: 'AD', dir: -1, group: 'Spending', label: 'Interest rates rise', because: 'higher interest rates', text: 'Interest rates rise, so borrowing to buy machines and new homes costs more.', link: 'Interest-sensitive investment (I) falls, so AD shifts left.' },
    { id: 'oil-up', curve: 'SRAS', dir: -1, group: 'Costs', label: 'Oil prices jump', because: 'a rise in oil and energy prices', text: 'The price of oil, an input to almost every firm, jumps.', link: 'Production costs rise at every price level, so SRAS shifts left (cost-push).' },
    { id: 'wages-up', curve: 'SRAS', dir: -1, group: 'Costs', label: 'Nominal wages rise', because: 'a rise in nominal wages', text: 'New contracts raise nominal wages across the economy.', link: 'Labor costs rise at every price level, so SRAS shifts left.' },
    { id: 'drought', curve: 'SRAS', dir: -1, group: 'Costs', label: 'A drought ruins harvests', because: 'a negative supply shock', text: 'A severe drought ruins harvests, so raw materials cost more.', link: 'A negative supply shock raises costs, so SRAS shifts left.' },
    { id: 'expect-infl', curve: 'SRAS', dir: -1, group: 'Costs', label: 'Workers expect higher inflation', because: 'higher expected inflation', text: 'Workers and firms expect higher inflation, so they build higher wages and prices into contracts.', link: 'Higher expected inflation raises nominal wages, so SRAS shifts left.' },
    { id: 'oil-down', curve: 'SRAS', dir: 1, group: 'Costs', label: 'Oil prices fall', because: 'a fall in oil and energy prices', text: 'The price of oil and energy falls sharply.', link: 'Production costs fall at every price level, so SRAS shifts right.' },
    { id: 'inputs-down', curve: 'SRAS', dir: 1, group: 'Costs', label: 'Raw materials get cheaper', because: 'lower input prices', text: 'The prices of raw materials and parts fall across the economy.', link: 'Lower input prices cut production costs, so SRAS shifts right.' },
    { id: 'subsidy', curve: 'SRAS', dir: 1, group: 'Costs', label: 'A subsidy cuts business costs', because: 'a subsidy to producers', text: 'The government pays producers a subsidy for every unit they make.', link: 'Lower costs per unit, so SRAS shifts right.' }
  ];
  function shock(id){ for(var i = 0; i < SHOCKS.length; i++) if(SHOCKS[i].id === id) return SHOCKS[i]; return null; }
  var NAME = { AD: 'aggregate demand (AD)', SRAS: 'short-run aggregate supply (SRAS)' };
  function dirWord(d){ return d > 0 ? 'right' : 'left'; }

  /* ------------------------------------------------------------ the model */
  var EPS = 1e-6;
  function adasSpec(){ return { kind: 'adas' }; }
  function state(a, s){
    var e = G().eq(adasSpec(), { AD: a || 0, SRAS: s || 0 });
    var gap = e ? M.round(e[0] - 5, 6) : 0;
    return {
      eq: e, gapSize: gap,
      gap: gap < -EPS ? 'recessionary' : gap > EPS ? 'inflationary' : 'none',
      srpc: -(s || 0), point: e ? [M.round(10 - e[0], 6), e[1]] : null,
      // Long run: nominal wages move until SRAS crosses AD on LRAS.
      longRunS: -(a || 0)
    };
  }

  /* ------------------------------------------------------------ steps */
  function choice(key, label, options, correct, why, practice, extra){
    var s = { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, practice: practice, level: 'apply' };
    for(var k in (extra || {})) s[k] = extra[k];
    return s;
  }
  /* A graph step (see the header): option 0 "right", 1 "not yet". */
  function graphStep(key, label, spec, practice, okWhy){
    return { key: key, kind: 'choice', graph: spec, label: label, fixed: true,
      options: ['The graph shows it', 'The graph is not right yet'], correct: 0,
      why: [okWhy, 'Check the curve, its direction and the new point.'], practice: practice, level: 'apply' };
  }
  function thousands(x){ return M.minus(String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',')); }
  function pickOrder(r, list){ return M.shuffle(r, list); }

  var OUT4 = [['up', 'up'], ['up', 'down'], ['down', 'up'], ['down', 'down']];
  function outText(pl, y){ return 'The price level ' + (pl === 'up' ? 'rises' : 'falls') + ' and real GDP ' + (y === 'up' ? 'rises' : 'falls'); }

  /* --------------------------------------------------- type: shock */
  function genShock(r, ctx){
    var sh = r.pick(SHOCKS), other = sh.curve === 'AD' ? 'SRAS' : 'AD';
    var st = state(sh.curve === 'AD' ? sh.dir : 0, sh.curve === 'SRAS' ? sh.dir : 0);
    var o = G().outcome(adasSpec(), sh.curve === 'AD' ? { AD: sh.dir } : { SRAS: sh.dir });
    var spec = { kind: 'adas', do: ['shift', 'equilibrium'], movable: ['AD', 'SRAS'],
      key: { shifts: [{ curve: sh.curve, dir: dirWord(sh.dir) }], because: sh.because },
      slips: {} };
    spec.slips[other] = other === 'AD'
      ? 'This change hits production costs, not spending: it shifts SRAS, not AD.'
      : 'This change is in spending (C, I, G or net exports): it shifts AD, not SRAS.';
    var ci = -1;
    OUT4.forEach(function(p, i){ if(p[0] === o['price level'] && p[1] === o.output) ci = i; });
    var whyOut = OUT4.map(function(p, i){
      if(i === ci) return outText(p[0], p[1]) + '. ' + (sh.curve === 'AD' ? 'An AD shift moves the price level and real GDP the same way.' : 'An SRAS shift moves them opposite ways' + (sh.dir < 0 ? ': stagflation, higher prices with less output.' : '.'));
      if(sh.curve === 'AD' && p[0] !== p[1]) return 'Opposite moves come from an SRAS shift. Along the upward-sloping SRAS, an AD shift moves both the same way.';
      if(sh.curve === 'SRAS' && p[0] === p[1]) return 'Moving both the same way is what an AD shift does. An SRAS shift moves along AD, which slopes down, so they move opposite ways.';
      return 'Right pairing, wrong direction: follow the shift ' + dirWord(sh.dir) + ' to the new crossing with AD' + (sh.curve === 'AD' ? ' and SRAS' : '') + '.';
    });
    var gapC = st.gap === 'recessionary' ? 0 : 1;
    var gapWhy = [
      st.gap === 'recessionary' ? 'Right: real GDP is now below full employment (left of LRAS), so unemployment is above the natural rate.' : 'Real GDP is now above full employment (right of LRAS), not below it.',
      st.gap === 'inflationary' ? 'Right: real GDP is now above full employment (right of LRAS), so unemployment is below the natural rate.' : 'Real GDP is now below full employment (left of LRAS), not above it.',
      'The shock moved real GDP away from LRAS, so in the short run there is a gap. It closes only in the long run.'
    ];
    return {
      type: 'shock', ctx: ctx.id, topic: ctx.topic,
      text: '<p>The economy starts in long-run equilibrium at full employment. Then: <b>' + sh.text + '</b></p>',
      figure: { spec: spec },
      steps: [
        graphStep('graph', 'On the graph, shift the curve this change moves, then put E2 where the curves cross now.', spec, '4.C', sh.link),
        choice('outcome', 'In the short run, what happens to the price level and real GDP?', OUT4.map(function(p){ return outText(p[0], p[1]); }), ci, whyOut, '3.A'),
        choice('gap', 'Compared with full employment, what does the economy have now?', ['A recessionary gap', 'An inflationary gap', 'No gap: it stays at full employment'], gapC, gapWhy, '2.A')
      ],
      solution: [
        sh.link,
        outText(o['price level'], o.output) + ' at the new short-run equilibrium E2.',
        'Real GDP is ' + (st.gap === 'recessionary' ? 'below' : 'above') + ' full employment (LRAS): a ' + st.gap + ' gap, with unemployment ' + (st.gap === 'recessionary' ? 'above' : 'below') + ' the natural rate.'
      ],
      answer: { curve: sh.curve, dir: sh.dir, outcome: o, gap: st.gap }, shock: sh.id
    };
  }

  /* --------------------------------------------- type: selfadjust */
  function genSelf(r, ctx){
    var sh = r.pick(SHOCKS), start = {}; start[sh.curve] = sh.dir;
    var st = state(start.AD || 0, start.SRAS || 0), rec = st.gap === 'recessionary';
    var wdir = rec ? -1 : 1;   // wages fall in a recession, rise in a boom
    var spec = { kind: 'adas', do: ['shift', 'equilibrium'], movable: ['AD', 'SRAS'], start: start,
      key: { shifts: [{ curve: 'SRAS', dir: rec ? 'right' : 'left' }], because: rec ? 'falling nominal wages and input prices' : 'rising nominal wages and input prices' },
      slips: { AD: 'Self-adjustment works through nominal wages and SRAS. AD stays put unless spending or policy changes.' } };
    var wages = ['Nominal wages and input prices fall', 'Nominal wages and input prices rise', 'Nominal wages stay the same; prices adjust on their own', 'Transfer payments rise and lift spending'];
    var wC = rec ? 0 : 1;
    var wWhy = [
      rec ? 'Right: with unemployment above the natural rate, workers accept lower nominal wages as contracts renew, and input prices fall.' : 'With output above full employment, labor is scarce: nominal wages are bid up, not down.',
      !rec ? 'Right: with unemployment below the natural rate, firms compete for scarce workers, so nominal wages and input prices rise as contracts renew.' : 'With unemployment above the natural rate, workers are plentiful: nominal wages fall, not rise.',
      'Self-adjustment runs through nominal wages: they are sticky in the short run but flexible in the long run.',
      'Transfers are an automatic stabilizer, a policy effect on AD. Self-adjustment is the economy alone, through nominal wages and SRAS.'
    ];
    var pl = rec ? 'down' : 'up', y = rec ? 'up' : 'down', ci = -1;
    OUT4.forEach(function(p, i){ if(p[0] === pl && p[1] === y) ci = i; });
    var whyAdj = OUT4.map(function(p, i){
      if(i === ci) return outText(pl, y) + ' back to full employment as SRAS shifts ' + (rec ? 'right' : 'left') + ' along AD.';
      if(p[0] === p[1]) return 'Both moving the same way is an AD shift. During self-adjustment SRAS moves along a fixed AD, so they move opposite ways.';
      return 'Follow SRAS ' + (rec ? 'right' : 'left') + ' along AD: real GDP heads back to LRAS, ' + (rec ? 'so it rises.' : 'so it falls.');
    });
    var u = ['At the natural rate of unemployment', 'Above the natural rate', 'Below the natural rate', 'At zero unemployment'];
    var uWhy = ['Right: back at full employment (on LRAS), only frictional and structural unemployment remain, so unemployment is at the natural rate.',
      'Above the natural rate is a recessionary gap; the adjustment ends at full employment.',
      'Below the natural rate is an inflationary gap; the adjustment ends at full employment.',
      'Full employment still has frictional and structural unemployment: the natural rate is above zero.'];
    return {
      type: 'selfadjust', ctx: ctx.id, topic: ctx.topic,
      text: '<p>After a shock (' + sh.label.charAt(0).toLowerCase() + sh.label.slice(1) + '), the economy is in a <b>' + st.gap + ' gap</b>, as the graph shows. No fiscal or monetary policy is used.</p>',
      figure: { spec: spec },
      steps: [
        choice('wages', 'Over time, with no policy, what happens to nominal wages and other input prices?', wages, wC, wWhy, '2.B'),
        graphStep('graph', 'Show the long-run adjustment: shift the curve that moves, then put E2 where the curves cross now.', spec, '4.C', 'As nominal wages ' + (rec ? 'fall' : 'rise') + ', production costs ' + (rec ? 'fall' : 'rise') + ', so SRAS shifts ' + (rec ? 'right' : 'left') + ' until it meets AD on LRAS.'),
        choice('adjust', 'During the adjustment, what happens to the price level and real GDP?', OUT4.map(function(p){ return outText(p[0], p[1]); }), ci, whyAdj, '3.A'),
        choice('unemp', 'When the adjustment is over, where is unemployment?', u, 0, uWhy, '1.A')
      ],
      solution: [
        'In a ' + st.gap + ' gap unemployment is ' + (rec ? 'above' : 'below') + ' the natural rate, so nominal wages and input prices ' + (rec ? 'fall' : 'rise') + ' as contracts renew.',
        (rec ? 'Lower' : 'Higher') + ' costs shift SRAS ' + (rec ? 'right' : 'left') + ' (AD does not move: no policy).',
        outText(pl, y) + ', until AD, SRAS and LRAS meet at full employment and unemployment is back at the natural rate.'
      ],
      answer: { gap: st.gap, sras: rec ? 1 : -1 }, shock: sh.id
    };
  }

  /* ---------------------------------------------------- type: gap */
  var YF = [800, 1000, 1200, 1500, 2000, 2400], DY = [40, 50, 60, 80, 100, 120], UN = [4, 4.5, 5, 5.5], DU = [0.5, 1, 1.5, 2];
  function genGap(r, ctx){
    var yf = r.pick(YF), d = r.pick(DY), sign = r() < 0.5 ? -1 : 1, Y = yf + sign * d;
    var un = r.pick(UN), du = r.pick(DU), u = M.round(un - sign * du, 2);
    var gap = C().evaluate({ fn: 'sub', args: [Y, yf] }), cyc = C().evaluate({ fn: 'cyclicalRate', args: [u, un] });
    var rec = gap < 0;
    var spec = { kind: 'adas', start: { AD: rec ? -1 : 1 } };
    var adj = ['Nominal wages fall, so SRAS shifts right', 'Nominal wages rise, so SRAS shifts left', 'AD shifts ' + (rec ? 'right' : 'left') + ' on its own', 'LRAS shifts ' + (rec ? 'left' : 'right') + ' to meet output'];
    var adjWhy = [
      rec ? 'Right: unemployment above the natural rate pushes nominal wages down; lower costs shift SRAS right back to LRAS.' : 'Falling wages go with a recessionary gap. Here output is above full employment, so wages rise.',
      !rec ? 'Right: unemployment below the natural rate bids nominal wages up; higher costs shift SRAS left back to LRAS.' : 'Rising wages go with an inflationary gap. Here output is below full employment, so wages fall.',
      'Self-adjustment never runs through AD: with no policy, nominal wages adjust and SRAS shifts.',
      'LRAS is the economy’s full-employment output; a gap does not move it. SRAS does the moving.'
    ];
    var fmtB = function(x){ return '$' + thousands(x) + ' billion'; };
    return {
      type: 'gap', ctx: ctx.id, topic: ctx.topic,
      text: '<p>Full-employment real GDP is <b>' + fmtB(yf) + '</b> and real GDP is <b>' + fmtB(Y) + '</b>. The natural rate of unemployment is <b>' + un + '%</b> and the actual rate is <b>' + u + '%</b>.</p>',
      figure: { spec: spec, static: true },
      steps: [
        { key: 'gap', kind: 'num', label: 'The output gap is real GDP minus full-employment real GDP. How large is it, in billions of dollars? (Use a minus sign for a shortfall.)', cell: M.cell(gap, 0.001, [{ value: Y, why: 'That is real GDP itself. The gap is real GDP minus full-employment real GDP.' }, { value: Y + yf, why: 'Subtract full-employment real GDP; do not add it.' }]), d: 0, unit: 'billion', practice: '2.B', level: 'apply' },
        choice('kind', 'What kind of gap is this?', ['A recessionary gap', 'An inflationary gap'], rec ? 0 : 1, [
          rec ? 'Right: real GDP is below full employment, left of LRAS.' : 'Real GDP is above full employment here, right of LRAS: that is an inflationary gap.',
          !rec ? 'Right: real GDP is above full employment, right of LRAS.' : 'Real GDP is below full employment here, left of LRAS: that is a recessionary gap.'], '2.A', { fixed: true }),
        { key: 'cyclical', kind: 'num', label: 'Cyclical unemployment is the actual rate minus the natural rate. What is it, in percent? (Negative when unemployment is below the natural rate.)', cell: M.cell(cyc, 0.001, [{ value: u, why: 'That is the actual rate. Cyclical unemployment is what is left after subtracting the natural rate.' }, { value: u + un, why: 'Subtract the natural rate; do not add it.' }], 1e-9), d: 1, unit: '%', practice: '2.B', level: 'apply' },
        choice('adjust', 'With no policy, how does the economy get back to full employment in the long run?', adj, rec ? 0 : 1, adjWhy, '3.A')
      ],
      solution: [
        'Output gap = ' + thousands(Y) + ' \u2212 ' + thousands(yf) + ' = ' + M.minus(String(gap)) + ' billion dollars' + (rec ? ' (a shortfall).' : '.'),
        'Real GDP is ' + (rec ? 'below' : 'above') + ' full employment: a ' + (rec ? 'recessionary' : 'inflationary') + ' gap.',
        'Cyclical unemployment = ' + u + '% − ' + un + '% = ' + M.fmt(cyc, 3) + '%' + (rec ? '' : ' (below the natural rate)') + '.',
        rec ? 'Nominal wages fall, SRAS shifts right, and output returns to full employment at a lower price level.' : 'Nominal wages rise, SRAS shifts left, and output returns to full employment at a higher price level.'
      ],
      answer: { gap: gap, cyclical: cyc, Y: Y, yf: yf, u: u, un: un }
    };
  }

  /* ----------------------------------------------- type: phillips */
  function genPhillips(r, ctx){
    var sh = r.pick(SHOCKS), isAD = sh.curve === 'AD';
    var st = state(isAD ? sh.dir : 0, isAD ? 0 : sh.dir);
    var moves = ['A move up along SRPC: lower unemployment, higher inflation', 'A move down along SRPC: higher unemployment, lower inflation',
      'SRPC shifts right: higher unemployment and higher inflation', 'SRPC shifts left: lower unemployment and lower inflation'];
    var mC = isAD ? (sh.dir > 0 ? 0 : 1) : (sh.dir < 0 ? 2 : 3);
    var mWhy = moves.map(function(t, i){
      if(i === mC) return isAD ? 'Right: an AD shift moves the economy along the short-run Phillips curve, trading unemployment for inflation.' : 'Right: an SRAS shift changes unemployment and inflation the same way, so the whole SRPC shifts (opposite to SRAS).';
      if(isAD && i > 1) return 'An AD shift is a movement along SRPC. A shift of SRPC comes from SRAS (costs and expected inflation).';
      if(!isAD && i < 2) return 'A move along SRPC is what an AD shift does. A supply shock moves inflation and unemployment the same way, so SRPC shifts.';
      return 'Right kind of change, wrong direction: ' + (isAD ? (sh.dir > 0 ? 'more spending lowers unemployment and raises inflation.' : 'less spending raises unemployment and lowers inflation.') : (sh.dir < 0 ? 'SRAS left means higher costs: more inflation and more unemployment.' : 'SRAS right means lower costs: less inflation and less unemployment.'));
    });
    var spec;
    if(isAD){
      spec = { kind: 'phillips', do: ['point'], pointLabel: 'B', key: { point: { on: 'SRPC', x: sh.dir > 0 ? 'down' : 'up', y: sh.dir > 0 ? 'up' : 'down' } } };
    } else {
      spec = { kind: 'phillips', do: ['shift'], movable: ['SRPC', 'LRPC'], key: { shifts: [{ curve: 'SRPC', dir: sh.dir < 0 ? 'right' : 'left' }], because: sh.because },
        slips: { LRPC: 'LRPC sits at the natural rate of unemployment; a short-run supply shock leaves it alone and shifts SRPC.' } };
    }
    var lr = ['Back at the natural rate of unemployment, with inflation higher than at the start', 'Back at the natural rate of unemployment, with inflation lower than at the start',
      'Back at the natural rate of unemployment, with inflation where it started', 'It stays where the shock left it: unemployment stays away from the natural rate'];
    var fy = 5 + (isAD ? sh.dir : 0), lC = fy > 5 ? 0 : fy < 5 ? 1 : 2;
    var lWhy = [
      lC === 0 ? 'Right: people come to expect the higher inflation, nominal wages rise, SRAS shifts left and SRPC shifts right until unemployment is back at the natural rate (on LRPC).' : 'Inflation ends higher only after a lasting rise in AD.',
      lC === 1 ? 'Right: expected inflation falls, nominal wages fall, SRAS shifts right and SRPC shifts left until unemployment is back at the natural rate (on LRPC), at lower inflation.' : 'Inflation ends lower only after a lasting fall in AD.',
      lC === 2 ? 'Right: as nominal wages adjust, SRAS (and with it SRPC) shifts back, so unemployment returns to the natural rate at the starting inflation rate.' : 'After an AD shock the economy reaches LRPC at a different inflation rate: expected inflation has changed.',
      'In the long run unemployment always returns to the natural rate: the long-run Phillips curve is vertical there.'
    ];
    return {
      type: 'phillips', ctx: ctx.id, topic: ctx.topic,
      text: '<p>The economy starts at the natural rate of unemployment (point A, where SRPC meets LRPC). Then: <b>' + sh.text + '</b></p>',
      figure: { spec: spec },
      steps: [
        choice('move', 'What happens on the Phillips curves in the short run?', moves, mC, mWhy, '3.A'),
        graphStep('graph', isAD ? 'On the graph, tap where the economy moves in the short run (point B).' : 'On the graph, shift the curve this shock moves.', spec, '4.C', isAD ? 'Point B is on SRPC, ' + (sh.dir > 0 ? 'up and to the left of A: less unemployment, more inflation.' : 'down and to the right of A: more unemployment, less inflation.') : 'The supply shock shifts SRPC ' + (sh.dir < 0 ? 'right: higher inflation at every unemployment rate.' : 'left: lower inflation at every unemployment rate.')),
        choice('longrun', 'With no policy, where does the economy end up in the long run?', lr, lC, lWhy, '2.B')
      ],
      solution: [
        sh.link,
        isAD ? 'On the Phillips curves this is a movement along SRPC ' + (sh.dir > 0 ? 'up and to the left.' : 'down and to the right.') : 'On the Phillips curves SRPC shifts ' + (sh.dir < 0 ? 'right (stagflation).' : 'left.'),
        lr[lC] + '.'
      ],
      answer: { move: mC, longrun: lC, srpc: st.srpc }, shock: sh.id
    };
  }

  var GEN = { shock: genShock, selfadjust: genSelf, gap: genGap, phillips: genPhillips };
  var TYPES = ['shock', 'selfadjust', 'gap', 'phillips'];
  function generate(r, ctx, type){
    var ok = ctx && ctx.types && ctx.types.length ? ctx.types : TYPES;
    var t = type && ok.indexOf(type) > -1 ? type : r.pick(ok);
    var p = GEN[t](r, ctx || {});
    // Options in a fixed order are fine for two choices; four shuffle on the page.
    return p;
  }

  M.register('adasLab', { SHOCKS: SHOCKS, shock: shock, NAME: NAME, TYPES: TYPES, state: state, generate: generate, pickOrder: pickOrder });
})(typeof window !== 'undefined' ? window : globalThis);
