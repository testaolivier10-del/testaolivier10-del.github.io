/* Reserves lab model: ApMacroMath.reservesLab (docs/apmacro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T2, docs/apmacro-briefs/t2.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmacro-tool-checks/reserves-lab.mjs) and the
   test (scripts/test/apmacro-tool-reserves-lab.test.mjs) run exactly this code.

   The economics (docs/apmacro-authoring-guide.md, "The ample reserves
   framework"; needs-author T2 for the judgment calls):
     Ample reserves (how the Fed sets rates now). Reserve supply sits far to
     the right, where reserve demand is flat at the administered rate (the
     interest rate on reserve balances, IORB, with the ON RRP rate just below
     it as a floor and the discount rate above it as a ceiling; the Fed moves
     them together). Raising the administered rates lifts the flat part, so
     the policy rate rises; an open market operation moves reserve supply
     inside the flat part and leaves the rate alone; the reserve requirement
     (zero in the United States since March 2020) does not bind.
     Limited reserves (taught alongside, always labeled). Reserve supply
     crosses reserve demand on its steep part: open market operations and
     discount lending shift reserve supply, a reserve requirement change
     shifts reserve demand, and each moves the policy rate; on the money
     market the money supply shifts the same way. Administered rates are not
     a limited-reserves tool.
     Either way, a higher policy rate raises other interest rates, investment
     and interest-sensitive consumption fall, AD shifts left, and real
     output and the price level fall (unemployment rises); easing reverses it.

     FRAMEWORKS, TOOLS          ids, names, the two actions of each tool
     effect(fw, tool, stance)   stance +1 tighten, -1 ease -> { works, shifts:
                                { reserves: {RD, RS}, money: {MS}, adas: {AD} },
                                rate, inv, ad, output, price, unemp, why, slip }
     START                      each graph's starting offsets per framework
     specs()                    the graph specs the page draws (ApMacroGraph kinds)
     classes(spec)              the end states a graph step tells apart, with the
                                grader's slip for each (ApMacroGrade.graph)
     classify(spec, shifts)     a student's drawn shifts -> the index of its class
     multiplier(x, rr)          the limited-reserves numbers (ApMacroCalc recipes)
     generate(rng, ctx, type)   the drills:
       tool        the framework and the situation named: the stance, the tool,
                   the graph that shows it, then the chain to AD
       shift       shift the right curve on the right graph (a graph step:
                   ApMacroGraph.mount on the page, graded by ApMacroGrade.graph),
                   then what the rate does and what follows
       multiplier  an open market purchase with limited reserves: the money
                   multiplier, the most the money supply can grow, and why it
                   is a maximum */
(function(G){
  'use strict';
  var M = G.ApMacroMath;
  if(!M) return;
  function C(){ return M.Calc(); }
  function GR(){ return M.Graph(); }
  function GD(){ return G.ApMacroGrade; }
  function E(fn, args){ return C().evaluate({ fn: fn, args: args }); }

  var FRAMEWORKS = [
    { id: 'ample', name: 'Ample reserves', short: 'Ample', line: 'Reserves are plentiful: the Fed sets the policy rate with administered rates.' },
    { id: 'limited', name: 'Limited reserves', short: 'Limited', line: 'Reserves are scarce: a small change in reserves moves the policy rate.' }
  ];
  // Each tool's two actions: [tighten (stance +1), ease (stance -1)].
  var TOOLS = [
    { id: 'iorb', name: 'Interest on reserve balances', short: 'IORB rate', acts: ['Raise the IORB rate', 'Lower the IORB rate'], fw: 'ample' },
    { id: 'onrrp', name: 'Overnight reverse repurchase rate', short: 'ON RRP rate', acts: ['Raise the ON RRP rate', 'Lower the ON RRP rate'], fw: 'ample' },
    { id: 'omo', name: 'Open market operations', short: 'Bonds', acts: ['Sell bonds', 'Buy bonds'], fw: 'limited' },
    { id: 'discount', name: 'Discount rate', short: 'Discount rate', acts: ['Raise the discount rate', 'Lower the discount rate'], fw: 'limited' },
    { id: 'rr', name: 'Reserve requirement', short: 'Reserve requirement', acts: ['Raise the reserve requirement', 'Lower the reserve requirement'], fw: 'limited' }
  ];
  function toolOf(id){ return TOOLS.filter(function(t){ return t.id === id; })[0]; }
  function fwOf(id){ return FRAMEWORKS.filter(function(f){ return f.id === id; })[0]; }

  /* Where each graph starts. Ample: RS far right (7), crossing the flat
     part of RD (at 3). Limited: RS at 2, on RD's steep part (3 + 2 x 1.5 =
     6). The money market and AD-AS start at their defaults. */
  var START = { ample: { reserves: {}, money: {}, adas: {} }, limited: { reserves: { RS: -5 }, money: {}, adas: {} } };
  function specs(fw){
    var s = START[fw] || START.ample;
    return {
      reserves: { kind: 'reserves', start: s.reserves },
      money: { kind: 'money', start: s.money },
      adas: { kind: 'adas', start: s.adas }
    };
  }
  function cap(t){ return t.charAt(0).toUpperCase() + t.slice(1); }
  function up(s){ return s > 0 ? 'up' : s < 0 ? 'down' : 'same'; }
  function dn(s){ return up(-s); }

  /* The effect of one action. The graph shifts are one step each; the
     words follow from the graphs (the validator checks they agree). */
  function effect(fw, toolId, stance){
    var t = toolOf(toolId), s = stance > 0 ? 1 : -1, act = t.acts[s > 0 ? 0 : 1];
    var out = { fw: fw, tool: toolId, stance: s, act: act, works: false, shifts: { reserves: {}, money: {}, adas: {} } };
    var tight = s > 0;
    if(fw === 'ample'){
      if(toolId === 'iorb' || toolId === 'onrrp'){
        out.works = true;
        out.shifts.reserves.RD = s;
        out.why = (toolId === 'iorb' ? 'Banks will not lend reserves overnight for less than the Fed pays them on reserve balances, so the IORB rate holds up the flat part of reserve demand. '
          : 'The ON RRP rate is the floor under the policy rate: lenders that cannot earn IORB will not lend for less than the Fed pays them. The Fed moves it together with the IORB rate. ') +
          (tight ? 'Raising it lifts the flat part, and the policy rate rises with it.' : 'Lowering it drops the flat part, and the policy rate falls with it.');
      } else if(toolId === 'omo'){
        out.shifts.reserves.RS = -s;
        out.why = (tight ? 'Selling bonds takes reserves out of banks' : 'Buying bonds adds reserves to banks') + ', so reserve supply shifts ' + (tight ? 'left' : 'right') +
          '. With ample reserves it stays in the flat part of reserve demand, so the policy rate does not move. That is why, in this framework, the Fed changes the administered rates instead.';
        out.slip = 'Buying or selling bonds is the limited-reserves tool. With ample reserves it changes the quantity of reserves but not the policy rate.';
      } else if(toolId === 'discount'){
        out.why = 'The discount rate is the ceiling of the range, above the IORB rate; with ample reserves banks seldom need to borrow from the Fed. The Fed moves it along with the IORB rate, but changing it alone does not move the policy rate.';
        out.slip = 'With ample reserves the discount rate is a backstop, not the tool that sets the policy rate.';
      } else {
        out.why = 'With ample reserves banks hold far more reserves than any requirement (in the United States the requirement has been zero since March 2020), so changing it leaves the policy rate where the administered rates hold it.';
        out.slip = 'The reserve requirement does not bind when reserves are ample.';
      }
    } else {
      if(toolId === 'iorb' || toolId === 'onrrp'){
        out.why = 'Administered rates are the ample-reserves tools. With limited reserves the Fed moves the policy rate by changing the quantity of reserves: open market operations, the discount rate or the reserve requirement.';
        out.slip = 'In a limited-reserves question, use open market operations, the discount rate or the reserve requirement.';
      } else {
        out.works = true;
        out.shifts.money.MS = -s;
        if(toolId === 'omo'){
          out.shifts.reserves.RS = -s;
          out.why = (tight ? 'Selling bonds drains reserves from banks' : 'Buying bonds adds reserves to banks') + ': reserve supply shifts ' + (tight ? 'left' : 'right') + ' on the steep part of reserve demand, so the policy rate ' + (tight ? 'rises' : 'falls') +
            '. Banks have ' + (tight ? 'less' : 'more') + ' to lend, so the money supply shifts ' + (tight ? 'left' : 'right') + ' and the nominal interest rate ' + (tight ? 'rises' : 'falls') + '.';
        } else if(toolId === 'discount'){
          out.shifts.reserves.RS = -s;
          out.why = (tight ? 'A higher discount rate makes borrowing reserves from the Fed costlier, so banks borrow fewer' : 'A lower discount rate makes borrowing reserves from the Fed cheaper, so banks borrow more') +
            ': reserve supply shifts ' + (tight ? 'left' : 'right') + ' and the policy rate ' + (tight ? 'rises' : 'falls') + '. The money supply shifts ' + (tight ? 'left' : 'right') + '.';
        } else {
          out.shifts.reserves.RD = s;
          out.why = (tight ? 'A higher reserve requirement makes banks hold more reserves for each dollar of deposits' : 'A lower reserve requirement frees reserves for lending') +
            ': reserve demand shifts ' + (tight ? 'up' : 'down') + ' and the policy rate ' + (tight ? 'rises' : 'falls') + '. The money multiplier (1 / required reserve ratio) ' + (tight ? 'falls' : 'rises') + ', so the money supply shifts ' + (tight ? 'left' : 'right') + '.';
        }
      }
    }
    var sp = specs(fw);
    var e0 = GR().eq(sp.reserves, {}), e1 = GR().eq(sp.reserves, out.shifts.reserves);
    out.rate = e0 && e1 ? (Math.abs(e1[1] - e0[1]) < 1e-6 ? 'same' : e1[1] > e0[1] ? 'up' : 'down') : 'same';
    if(fw === 'ample' && out.works) out.shifts.money.MS = -s;   // the nominal interest rate follows the policy rate
    if(out.rate !== 'same'){
      out.shifts.adas.AD = out.rate === 'up' ? -1 : 1;
      var o = GR().outcome(sp.adas, out.shifts.adas);
      out.inv = dn(out.rate === 'up' ? 1 : -1); out.ad = out.rate === 'up' ? 'left' : 'right';
      out.output = o.output; out.price = o['price level']; out.unemp = o.output === 'down' ? 'up' : 'down';
      var mo = GR().outcome(sp.money, out.shifts.money);
      out.i = mo['nominal interest rate'];
    } else { out.inv = out.output = out.price = out.unemp = out.i = 'same'; out.ad = 'none'; }
    return out;
  }

  /* --------------------------------------------- graph steps */
  /* The end states a shift step tells apart: one movable curve one way,
     or several curves moved. Each gets the grader's own line, so a slip is
     named exactly as ApMacroGrade.graph names it. */
  function classes(spec){
    var g = GR(), cs = g.curves(spec, {}), mov = spec.movable || cs.map(function(c){ return c.id; }), out = [];
    mov.forEach(function(id){
      var c = g.find(cs, id);
      [1, -1].forEach(function(d){
        var sh = {}; sh[id] = d;
        out.push({ id: id + (d > 0 ? '+' : '-'), shifts: sh, text: cap(g.curveName(id).replace(/^the /, '')) + ' shifted ' + g.dirWord(c.shape, d) });
      });
    });
    if(mov.length > 1){ var both = {}; mov.forEach(function(id){ both[id] = 1; }); out.push({ id: 'several', shifts: both, text: 'More than one curve shifted' }); }
    // "Several" is named without the authored slip lines (they speak of one wrong curve).
    var plain = {}; for(var key in spec) if(key !== 'slips') plain[key] = spec[key];
    out.forEach(function(k){ var r = GD().graph(k.id === 'several' ? plain : spec, { shifts: k.shifts }); k.ok = r.correct; k.note = r.correct ? '' : r.slip; });
    return out;
  }
  function classify(spec, shifts){
    var ks = classes(spec), moved = Object.keys(shifts || {}).filter(function(c){ return shifts[c]; });
    if(!moved.length) return -1;
    if(moved.length > 1){ for(var j = 0; j < ks.length; j++) if(ks[j].id === 'several') return j; return -1; }
    var want = moved[0] + (shifts[moved[0]] > 0 ? '+' : '-');
    for(var i = 0; i < ks.length; i++) if(ks[i].id === want) return i;
    return -1;
  }

  /* ---------------------------------------------- numbers */
  function multiplier(x, rr){
    return { mm: E('moneyMultiplier', [rr]), max: E('maxMoneyChange', [x, rr]), recipes: { mm: { fn: 'moneyMultiplier', args: [rr] }, max: { fn: 'maxMoneyChange', args: [x, rr] } } };
  }

  /* ---------------------------------------------- the drills */
  function choice(key, label, opts, practice, extra){
    var s = { key: key, kind: 'choice', label: label, options: opts.map(function(o){ return o[0]; }), why: opts.map(function(o){ return o[1]; }), correct: 0, practice: practice || '2.A' };
    for(var k in (extra || {})) s[k] = extra[k];
    return s;
  }
  var SITUATION = {
    tight: ['Inflation has run well above the central bank’s 2 percent target for a year, and real output is above full employment.',
      'Prices are rising faster every month and unemployment is below its natural rate: the economy is in an inflationary gap.',
      'Spending has surged, the price level is climbing, and real GDP is above potential output.'],
    ease: ['A recession has begun: unemployment is rising and real output is below full employment.',
      'Spending has fallen, firms are laying workers off, and the economy is in a recessionary gap.',
      'Real GDP has fallen for two quarters and unemployment is above its natural rate.']
  };
  var FW_LINE = {
    ample: 'The central bank operates with <b>ample reserves</b>.',
    limited: 'The central bank operates with <b>limited reserves</b>: reserves are scarce, so a small change in them moves the policy rate.'
  };
  function stanceStep(s){
    var tight = s > 0;
    return choice('stance', 'Which policy fits this situation?', [
      [tight ? 'Contractionary: raise the policy rate.' : 'Expansionary: lower the policy rate.', tight ? 'To pull inflation down the central bank wants less spending, so it raises the policy rate.' : 'To close a recessionary gap the central bank wants more spending, so it lowers the policy rate.'],
      [tight ? 'Expansionary: lower the policy rate.' : 'Contractionary: raise the policy rate.', tight ? 'Lower rates would add spending and push inflation higher. An inflationary gap calls for contractionary policy.' : 'Higher rates would cut spending and deepen the recession. A recessionary gap calls for expansionary policy.'],
      ['No change: monetary policy does not affect real output in the short run.', 'In the short run monetary policy shifts AD, so it does change real output and the price level. Only in the long run is money neutral.']
    ], '2.A');
  }
  function toolStep(r, fw, s, toolId){
    var tight = s > 0, opts = [], k = tight ? 0 : 1, kk = tight ? 1 : 0;
    var t = toolOf(toolId);
    opts.push([t.acts[k] + '.', fw === 'ample' ? 'With ample reserves the administered rates set the policy rate: ' + (tight ? 'raising' : 'lowering') + ' the IORB rate moves the flat part of reserve demand ' + (tight ? 'up' : 'down') + '.'
      : toolId === 'omo' ? (tight ? 'Selling bonds drains reserves' : 'Buying bonds adds reserves') + '; with limited reserves that moves the policy rate ' + (tight ? 'up' : 'down') + '.'
      : toolId === 'discount' ? 'A ' + (tight ? 'higher' : 'lower') + ' discount rate changes how much banks borrow from the Fed, and so the reserves they have; with limited reserves the policy rate ' + (tight ? 'rises' : 'falls') + '.'
      : 'A ' + (tight ? 'higher' : 'lower') + ' reserve requirement changes how much banks can lend (the money multiplier ' + (tight ? 'falls' : 'rises') + '); with limited reserves the policy rate ' + (tight ? 'rises' : 'falls') + '.']);
    var pool = [];
    pool.push([t.acts[kk] + '.', 'That is the right tool used the wrong way: it would ' + (tight ? 'lower' : 'raise') + ' the policy rate.']);
    if(fw === 'ample'){
      pool.push([toolOf('omo').acts[k] + '.', 'Buying or selling bonds is the limited-reserves tool. With ample reserves it moves reserve supply inside the flat part of reserve demand, and the policy rate does not change.']);
      pool.push([toolOf('rr').acts[k] + '.', 'With ample reserves the reserve requirement does not bind (in the United States it has been zero since March 2020), so changing it does not move the policy rate.']);
    } else {
      pool.push([toolOf('iorb').acts[k] + '.', 'The IORB rate is the ample-reserves tool. With limited reserves the policy rate moves with the quantity of reserves: open market operations, the discount rate or the reserve requirement.']);
      var other = r.pick(TOOLS.filter(function(x){ return x.fw === 'limited' && x.id !== toolId; }));
      pool.push([other.acts[kk] + '.', 'A limited-reserves tool, but used the wrong way: it would ' + (tight ? 'lower' : 'raise') + ' the policy rate.']);
    }
    pool.push([tight ? 'Raise income taxes.' : 'Cut income taxes.', 'Taxes are fiscal policy, set by the government. The question asks for a central bank tool.']);
    M.shuffle(r, pool).slice(0, 3).forEach(function(p){ opts.push(p); });
    return choice('tool', 'Which action should the central bank take?', opts, '2.A');
  }
  function graphChoiceStep(fw, s){
    var tight = s > 0;
    if(fw === 'ample') return choice('graph', 'Which graph shows the policy, and how?', [
      ['The reserve market: the flat part of reserve demand shifts ' + (tight ? 'up' : 'down') + '.', 'With ample reserves the policy is drawn on the reserve market: the administered rate sets the flat part of reserve demand, and the policy rate moves with it.'],
      ['The money market: the money supply shifts ' + (tight ? 'left' : 'right') + '.', 'In an ample-reserves question, show the policy on the reserve market graph, where the administered rates set the policy rate. The money market graph is the limited-reserves picture.'],
      ['The reserve market: reserve supply shifts ' + (tight ? 'left' : 'right') + '.', 'With ample reserves, reserve supply sits in the flat part of reserve demand, where shifting it leaves the policy rate alone. A change in the administered rates moves the flat part.'],
      ['The loanable funds market: the supply of loanable funds shifts ' + (tight ? 'left' : 'right') + '.', 'The loanable funds market shows the real interest rate set by saving and borrowing; central bank tools are drawn on the reserve market or the money market.']
    ], '4.C');
    return choice('graph', 'Which graph shows the policy, and how?', [
      ['The money market: the money supply shifts ' + (tight ? 'left' : 'right') + '.', 'With limited reserves the tool changes the quantity of money: the money supply shifts ' + (tight ? 'left' : 'right') + ' and the nominal interest rate ' + (tight ? 'rises' : 'falls') + '.'],
      ['The money market: money demand shifts ' + (tight ? 'left' : 'right') + '.', 'Central bank tools change the money supply. Money demand depends on the price level, real output and the interest rate, not on the Fed’s tools.'],
      ['The reserve market: the flat part of reserve demand shifts ' + (tight ? 'up' : 'down') + '.', 'That is how the ample-reserves graph shows a change in administered rates. This question sets limited reserves, so draw the money market.'],
      ['The money market: the money supply shifts ' + (tight ? 'right' : 'left') + '.', 'Right graph, wrong way: that would ' + (tight ? 'lower' : 'raise') + ' the nominal interest rate.']
    ], '4.C');
  }
  function chainStep(s, key, practice){
    var tight = s > 0, R = tight ? 'rise' : 'fall';
    return choice(key || 'chain', 'What follows in the economy?', [
      ['Interest rates ' + R + ', so investment ' + (tight ? 'falls' : 'rises') + ', AD shifts ' + (tight ? 'left' : 'right') + ', and real output and the price level ' + (tight ? 'fall' : 'rise') + '.', 'Each link in order: the policy rate and other interest rates ' + R + ', interest-sensitive spending (investment, durable goods) ' + (tight ? 'falls' : 'rises') + ', AD shifts ' + (tight ? 'left' : 'right') + ', and real output and the price level ' + (tight ? 'fall; unemployment rises' : 'rise; unemployment falls') + '.'],
      ['Interest rates ' + R + ', so investment ' + (tight ? 'rises' : 'falls') + ', AD shifts ' + (tight ? 'right' : 'left') + ', and real output and the price level ' + (tight ? 'rise' : 'fall') + '.', (tight ? 'Higher' : 'Lower') + ' interest rates make borrowing ' + (tight ? 'costlier, so firms invest less' : 'cheaper, so firms invest more') + '. The direction is backwards.'],
      ['Interest rates ' + R + ', so SRAS shifts ' + (tight ? 'left' : 'right') + ', real output ' + (tight ? 'falls' : 'rises') + ' and the price level ' + (tight ? 'rises' : 'falls') + '.', 'Monetary policy works through spending: it shifts AD, not SRAS.'],
      ['Interest rates ' + R + ' and AD shifts ' + (tight ? 'left' : 'right') + ', but real output does not change in the short run.', 'In the short run a shift in AD changes real output as well as the price level. Money is neutral only in the long run.']
    ], practice || '3.B');
  }

  function genTool(r, c){
    var fw = c.framework || r.pick(['ample', 'limited']), s = r.pick([1, -1]), tight = s > 0;
    var toolId = fw === 'ample' ? 'iorb' : r.pick(c.tools || ['omo', 'discount', 'rr']);
    var t = toolOf(toolId), act = t.acts[tight ? 0 : 1];
    var text = '<p>' + r.pick(SITUATION[tight ? 'tight' : 'ease']) + ' ' + FW_LINE[fw] + '</p>';
    var steps = [stanceStep(s), toolStep(r, fw, s, toolId), graphChoiceStep(fw, s), chainStep(s)];
    var ef = effect(fw, toolId, s);
    var sol = [
      (tight ? 'An inflationary gap calls for contractionary policy: raise the policy rate.' : 'A recessionary gap calls for expansionary policy: lower the policy rate.'),
      (fw === 'ample' ? 'With ample reserves the tool is the administered rate: ' : 'With limited reserves use a tool that changes the quantity of reserves: ') + act.toLowerCase() + '.',
      fw === 'ample' ? 'On the reserve market the flat part of reserve demand shifts ' + (tight ? 'up' : 'down') + ', and the policy rate ' + (tight ? 'rises' : 'falls') + ' with it.' : 'On the money market the money supply shifts ' + (tight ? 'left' : 'right') + ', and the nominal interest rate ' + (tight ? 'rises' : 'falls') + '.',
      'Interest rates ' + (tight ? 'rise' : 'fall') + ' → investment ' + (tight ? 'falls' : 'rises') + ' → AD shifts ' + ef.ad + ' → real output ' + (tight ? 'falls' : 'rises') + ', the price level ' + (tight ? 'falls' : 'rises') + ', unemployment ' + (tight ? 'rises' : 'falls') + '.'
    ];
    return { ctx: c.id, topic: c.topic, type: 'tool', text: text, steps: steps, solution: sol, given: { fw: fw, stance: s, tool: toolId }, figure: { kind: 'show', fw: fw, tool: toolId, stance: s } };
  }

  var BECAUSE = {
    iorb: function(t){ return 'a ' + (t ? 'higher' : 'lower') + ' interest rate on reserve balances'; },
    onrrp: function(t){ return 'a ' + (t ? 'higher' : 'lower') + ' ON RRP rate'; },
    omo: function(t){ return t ? 'an open market sale of bonds' : 'an open market purchase of bonds'; },
    discount: function(t){ return 'a ' + (t ? 'higher' : 'lower') + ' discount rate'; },
    rr: function(t){ return 'a ' + (t ? 'higher' : 'lower') + ' reserve requirement'; }
  };
  /* The shift step: ApMacroTools.drill's "graph" kind (drawn with
     ApMacroGraph, graded by ApMacroGrade.graph, the slip named by the grader
     or the spec's slips). The key stays "shift", as recorded before. */
  function graphStep(spec, label){
    var good = 'Right curve, right way: ' + GR().curveName(spec.key.shifts[0].curve) + ' shifts ' + spec.key.shifts[0].dir + ' with ' + spec.key.because + '.';
    return { key: 'shift', kind: 'graph', spec: spec, label: label, explain: good, practice: '4.C', level: 'apply' };
  }
  function genShift(r, c){
    var fw = c.framework || 'ample', s = r.pick([1, -1]), tight = s > 0, steps, text, spec, sol, toolId;
    if(fw === 'ample'){
      toolId = r.pick(c.tools || ['iorb', 'iorb', 'omo']);
      var t = toolOf(toolId), act = t.acts[tight ? 0 : 1];
      var ef = effect('ample', toolId, s);
      text = '<p>The Federal Reserve operates with <b>ample reserves</b>. It decides to ' + act.charAt(0).toLowerCase() + act.slice(1) + '.</p>';
      var key = toolId === 'omo' ? { curve: 'RS', dir: tight ? 'left' : 'right' } : { curve: 'RD', dir: tight ? 'up' : 'down' };
      spec = { kind: 'reserves', do: ['shift'], movable: ['RD', 'RS'], key: { shifts: [key], because: BECAUSE[toolId](tight) },
        slips: toolId === 'omo' ? { RD: 'Buying or selling bonds changes the quantity of reserves, so it shifts reserve supply; the administered rates, and with them the flat part of reserve demand, stay put.' }
          : { RS: 'A change in an administered rate moves the flat part of reserve demand. Reserve supply stays where it is: the Fed has not bought or sold anything.' } };
      var rate = ef.rate;
      steps = [graphStep(spec, 'On the reserve market, shift the curve this action moves, then Check.'),
        choice('rate', 'What happens to the policy rate?', [
          [rate === 'up' ? 'It rises.' : rate === 'down' ? 'It falls.' : 'It stays the same.', rate === 'same' ? 'Reserve supply moves inside the flat part of reserve demand, where the administered rates hold the policy rate. This is why the Fed does not use bond sales and purchases to set rates with ample reserves.' : 'The policy rate sits on the flat part of reserve demand, so it moves with the administered rate.'],
          [rate === 'up' ? 'It falls.' : rate === 'down' ? 'It rises.' : 'It ' + (tight ? 'rises' : 'falls') + '.', rate === 'same' ? 'That is the limited-reserves result. With ample reserves the crossing stays on the flat part, so the rate does not move.' : 'Backwards: the flat part moved ' + (rate === 'up' ? 'up' : 'down') + ', and the policy rate moves with it.'],
          [rate === 'same' ? 'It ' + (tight ? 'falls' : 'rises') + '.' : 'It stays the same.', rate === 'same' ? 'Reserve supply moving does not lower or raise the rate in the flat part, and certainly not the opposite way.' : 'The crossing is on the flat part, and the flat part moved, so the policy rate changes.']
        ], '3.A')];
      if(rate !== 'same') steps.push(chainStep(s, 'chain', '3.B'));
      else steps.push(choice('next', 'To ' + (tight ? 'raise' : 'lower') + ' the policy rate with ample reserves, what should the Fed do instead?', [
        [toolOf('iorb').acts[tight ? 0 : 1] + ' (with the ON RRP rate).', 'The administered rates set the flat part of reserve demand, so moving them moves the policy rate.'],
        [(tight ? 'Sell' : 'Buy') + ' far more bonds.', 'In the ample range even large operations leave the crossing on the flat part; the rate stays put until reserves are no longer ample.'],
        [toolOf('rr').acts[tight ? 0 : 1] + '.', 'The reserve requirement does not bind when reserves are ample.']
      ], '2.A'));
      sol = [toolId === 'omo' ? (tight ? 'Selling bonds removes reserves, so reserve supply shifts left.' : 'Buying bonds adds reserves, so reserve supply shifts right.') : act + ': the flat part of reserve demand shifts ' + (tight ? 'up' : 'down') + '.',
        rate === 'same' ? 'Reserve supply stays in the flat part of reserve demand, so the policy rate does not change.' : 'The policy rate ' + (tight ? 'rises' : 'falls') + ' with the flat part.',
        rate === 'same' ? 'To change the rate with ample reserves the Fed changes the administered rates (IORB and ON RRP).' : 'Interest rates ' + (tight ? 'rise' : 'fall') + ' → investment ' + (tight ? 'falls' : 'rises') + ' → AD shifts ' + (tight ? 'left' : 'right') + ' → real output and the price level ' + (tight ? 'fall' : 'rise') + '.'];
    } else {
      toolId = r.pick(c.tools || ['omo', 'discount', 'rr']);
      var t2 = toolOf(toolId), act2 = t2.acts[tight ? 0 : 1];
      text = '<p>The central bank operates with <b>limited reserves</b>. It decides to ' + act2.charAt(0).toLowerCase() + act2.slice(1) + '.</p>';
      spec = { kind: 'money', do: ['shift'], movable: ['MD', 'MS'], key: { shifts: [{ curve: 'MS', dir: tight ? 'left' : 'right' }], because: BECAUSE[toolId](tight) },
        slips: { MD: 'Central bank tools change the money supply. Money demand shifts with the price level and real output, not with the Fed’s tools.' } };
      steps = [graphStep(spec, 'On the money market, shift the curve this action moves, then Check.'),
        choice('rate', 'What happens to the nominal interest rate?', [
          [tight ? 'It rises.' : 'It falls.', 'A ' + (tight ? 'smaller' : 'larger') + ' money supply meets the same money demand at a ' + (tight ? 'higher' : 'lower') + ' nominal interest rate.'],
          [tight ? 'It falls.' : 'It rises.', 'Backwards: with the money supply shifted ' + (tight ? 'left' : 'right') + ', the crossing with money demand is ' + (tight ? 'higher' : 'lower') + '.'],
          ['It stays the same.', 'That is the ample-reserves result for bond sales and purchases. With limited reserves the money supply shift moves the rate.']
        ], '3.A'),
        chainStep(s, 'chain', '3.B')];
      sol = [act2 + ': the money supply shifts ' + (tight ? 'left' : 'right') + '.', 'The nominal interest rate ' + (tight ? 'rises' : 'falls') + ' where money demand meets the new money supply.',
        'Investment ' + (tight ? 'falls' : 'rises') + ' → AD shifts ' + (tight ? 'left' : 'right') + ' → real output and the price level ' + (tight ? 'fall' : 'rise') + '.'];
    }
    return { ctx: c.id, topic: c.topic, type: 'shift', text: text, steps: steps, solution: sol, given: { fw: fw, stance: s, tool: toolId }, figure: { kind: 'graph', spec: spec, fw: fw, tool: toolId, stance: s } };
  }

  function money(v){ return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  var RRS = [0.1, 0.2, 0.25];
  var XS = [5, 10, 20, 40, 50, 100];
  function genMultiplier(r, c){
    var rr = r.pick(c.ratios || RRS), x = r.pick(XS), n = multiplier(x, rr), pct = M.round(rr * 100, 0);
    var text = '<p>The central bank operates with <b>limited reserves</b>, and the required reserve ratio is ' + pct + ' percent. It buys $' + x + ' million of government bonds from a commercial bank, paying with new reserves. The bank’s deposits do not change.</p>';
    var mm = M.cell(n.mm, 1e-3, [
      { value: rr, why: 'That is the reserve ratio itself. The money multiplier is 1 divided by the required reserve ratio.' },
      { value: E('div', [1, E('sub', [1, rr])]), why: '1 / (1 − ratio) is the form of the spending multiplier. The money multiplier is 1 / required reserve ratio.' },
      { value: pct, why: 'That is the ratio as a percent. The money multiplier is 1 divided by the ratio as a decimal: 1 / ' + rr + '.' }
    ], 1e-9);
    var mx = M.cell(n.max, 1e-3, [
      { value: x, why: 'That is the new excess reserves, the most this one bank can lend. The banking system can create money up to excess reserves times the money multiplier.' },
      { value: E('mul', [x, rr]), why: 'You multiplied by the reserve ratio. Multiply the excess reserves by the money multiplier (1 / ratio).' },
      { value: E('mul', [E('sub', [1, rr]), n.max]), why: 'All $' + x + ' million is excess reserves here: the bank sold bonds, so its deposits, and its required reserves, did not change.' }
    ], 1e-9);
    var steps = [
      { key: 'mm', kind: 'num', label: 'What is the money multiplier?', cell: mm, d: 0, practice: '3.C', hint: 'Money multiplier = 1 / required reserve ratio (as a decimal).' },
      { key: 'max', kind: 'num', label: 'By how much can the money supply grow, at most?', cell: mx, unit: 'million dollars', d: 0, practice: '3.C', hint: 'Excess reserves times the money multiplier.' },
      choice('most', 'Why is that a maximum, not an exact amount?', [
        ['Banks may keep some excess reserves, and people may hold some of the money they borrow as cash, so less is deposited again and lent.', 'The multiplier assumes every bank lends every excess dollar and every dollar comes back as a deposit. Leaks (excess reserves kept, cash held) make the real change smaller.'],
        ['The required reserve ratio will rise as the money supply grows.', 'The central bank sets the ratio; it does not change because deposits grow.'],
        ['The central bank takes back part of the reserves each round of lending.', 'Nothing is taken back: the leaks are reserves banks choose to keep and cash people choose to hold.']
      ], '1.D')
    ];
    var sol = ['Money multiplier = 1 / ' + rr + ' = ' + M.fmt(n.mm, 3) + '.', 'All $' + x + ' million is new excess reserves, so the money supply can grow by up to ' + x + ' × ' + M.fmt(n.mm, 3) + ' = $' + money(n.max) + ' million.',
      'It is a maximum: excess reserves banks keep and cash people hold make the real change smaller. (This reasoning is the limited-reserves framework.)'];
    return { ctx: c.id, topic: c.topic, type: 'multiplier', text: text, steps: steps, solution: sol, given: { x: x, rr: rr }, recipes: n.recipes, figure: { kind: 'bank', x: x, rr: rr } };
  }

  var GEN = { tool: genTool, shift: genShift, multiplier: genMultiplier };
  M.register('reservesLab', {
    FRAMEWORKS: FRAMEWORKS, TOOLS: TOOLS, START: START, toolOf: toolOf, fwOf: fwOf, specs: specs, effect: effect,
    classes: classes, classify: classify, multiplier: multiplier, SITUATION: SITUATION,
    TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var types = ctx.types || Object.keys(GEN);
      var ty = type && types.indexOf(type) > -1 ? type : r.pick(types);
      return GEN[ty](r, ctx);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
