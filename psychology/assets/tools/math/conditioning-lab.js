/* Conditioning lab model: ApPsychMath.conditioningLab (docs/appsych-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/appsych-briefs/t3.md). Pure functions, no
   DOM, so the validator (scripts/lib/appsych-tool-checks/conditioning-lab.mjs)
   and the test (scripts/test/appsych-tool-conditioning-lab.test.mjs) run
   exactly this code.

   Two teaching models, said so on the page (illustrative numbers, the
   published shapes):
   Classical conditioning. A trial is "tone + food" (pairing), "tone alone"
     or a rest. The strength of the tone-food association V moves toward 1
     on a pairing and toward 0 on tone alone (the Rescorla-Wagner update
     with one rate), so acquisition rises fast then levels and extinction
     falls the same way. A rest after extinction brings part of the response
     back: spontaneous recovery. The CR (drops of saliva) is 12 x V, so a
     student reads a real-looking graph.
   Operant schedules. A rat in a Skinner box presses a lever; a seeded run
     of one simulated session decides when each press is reinforced under the
     schedule, and the cumulative record (total presses against time) is
     drawn from the presses themselves: fixed-ratio pause-then-run steps,
     variable-ratio steep and steady, fixed-interval scallops, variable-
     interval slow and steady. The response rates are typical relative
     rates, not data from one study (Ferster & Skinner, 1957, for the
     shapes).

     classical(trials, opts) -> { v: [...], cr: [...] } strength and CR per trial
     SCHEDULES                 { k, name, short, ratio|interval, fixed }
     session(k, seed, minutes) -> { presses: [t...], rewards: [t...] } in seconds
     cumulative(presses, minutes, step) -> [[minute, total], ...]
     SCENARIOS                 fresh classical conditioning stories (UCS, UCR,
                               NS/CS, CR) for the label drill
     OPERANT                   operant stories with the consequence: what is
                               added or removed, and whether the behavior
                               goes up or down
     generate(rng, ctx, type)  the drills:
       labels    a fresh story: name the UCS, the CS, the CR (and the UCR)
       phases    a classical record: read the CR, name the phase (acquisition,
                 extinction, spontaneous recovery), the mean CR of a block
       schedule  a scenario: which schedule, which cumulative record shape,
                 which is most resistant to extinction
       operant   a consequence: positive or negative, reinforcement or
                 punishment (negative reinforcement is not punishment) */
(function(G){
  'use strict';
  var M = G.ApPsychMath;
  if(!M) return;
  function S(){ return M.Stats(); }
  function E(fn, args){ return S().evaluate({ fn: fn, args: args }); }

  /* ------------------------------------------------- classical model */
  var RATE = 0.3, MAXCR = 12, RECOVER = 0.45;
  /* trials: a list of 'pair' | 'tone' | 'rest'. Returns V after each trial
     and the CR the tone alone would bring then (pairing trials too: the
     drops measured as the tone starts, before the food). A 'rest' moves
     V up toward RECOVER of its last peak (spontaneous recovery). */
  function classical(trials){
    var V = 0, peak = 0, v = [], cr = [];
    (trials || []).forEach(function(t){
      if(t === 'pair'){ V = V + RATE * (1 - V); if(V > peak) peak = V; }
      else if(t === 'tone'){ V = V + RATE * (0 - V); }
      else if(t === 'rest'){ var target = RECOVER * peak; if(V < target) V = V + (target - V) * 0.9; }
      v.push(V); cr.push(MAXCR * V);
    });
    return { v: v, cr: cr };
  }

  /* --------------------------------------------------- operant model */
  var SCHEDULES = [
    { k: 'fr', name: 'Fixed-ratio', short: 'FR 30', fixed: true, ratio: 30, how: 'a reward after every 30th press', shape: 'Steady runs of pressing with a short pause after each reward (stair steps)' },
    { k: 'vr', name: 'Variable-ratio', short: 'VR 30', fixed: false, ratio: 30, how: 'a reward after 30 presses on average, a different number each time', shape: 'The steepest line, steady with almost no pauses' },
    { k: 'fi', name: 'Fixed-interval', short: 'FI 60 s', fixed: true, interval: 60, how: 'the first press after each 60 seconds is rewarded', shape: 'Scallops: few presses after a reward, faster and faster as the time comes near' },
    { k: 'vi', name: 'Variable-interval', short: 'VI 60 s', fixed: false, interval: 60, how: 'the first press after a varying time (60 seconds on average) is rewarded', shape: 'A slow, steady line with no pauses' }
  ];
  function schedOf(k){ return SCHEDULES.filter(function(s){ return s.k === k; })[0]; }
  /* One simulated session, second by second. Rates are presses per second:
     FR and VR are high (ratio schedules pay for responding), FR pauses after
     each reward; FI rises from near zero to fast across each interval; VI is
     moderate and steady. Variable requirements are drawn from a uniform
     range around the mean so the average is the schedule's number. */
  function session(k, seed, minutes){
    var r = M.rng(seed || 1), sc = schedOf(k), T = (minutes || 10) * 60, presses = [], rewards = [];
    var count = 0, need = sc.ratio ? (sc.fixed ? sc.ratio : r.int(2, 2 * sc.ratio - 2)) : 0, last = 0, avail = sc.interval ? (sc.fixed ? sc.interval : 6 + r() * (2 * sc.interval - 12)) : 0, pauseTo = 0;
    for(var t = 0; t < T; t += 0.5){
      var rate;
      if(k === 'fr') rate = t < pauseTo ? 0 : 1.5;
      else if(k === 'vr') rate = 1.7;
      else if(k === 'fi'){ var f = Math.min(1, (t - last) / sc.interval); rate = 0.02 + 1.3 * Math.pow(f, 2.4); }
      else rate = 0.55;
      if(r() < rate * 0.5){
        presses.push(t); count++;
        var win = false;
        if(sc.ratio && count >= need){ win = true; count = 0; need = sc.fixed ? sc.ratio : r.int(2, 2 * sc.ratio - 2); }
        if(sc.interval && t - last >= avail){ win = true; avail = sc.fixed ? sc.interval : 6 + r() * (2 * sc.interval - 12); }
        if(win){ rewards.push(t); last = t; if(k === 'fr') pauseTo = t + 8 + r() * 8; }
      }
    }
    return { presses: presses, rewards: rewards, minutes: minutes || 10 };
  }
  function cumulative(presses, minutes, step){
    step = step || 0.25; var out = [], i = 0;
    for(var m = 0; m <= minutes + 1e-9; m += step){ while(i < presses.length && presses[i] <= m * 60) i++; out.push([M.round(m, 2), i]); }
    return out;
  }

  /* ---------------------------------------------------------- stories */
  var SCENARIOS = [
    { k: 'dentist', who: 'Ana', ucs: 'the drill touching a nerve', ucr: 'flinching in pain', cs: 'the whine of the dentist’s drill', cr: 'flinching at the whine', story: 'Every time the dentist’s drill touched a nerve, Ana flinched in pain. The drill always whined first. Now Ana flinches as soon as she hears the whine, before anything touches her tooth.' },
    { k: 'taste', who: 'Marco', ucs: 'the stomach virus', ucr: 'nausea from the virus', cs: 'the taste of the mango smoothie', cr: 'nausea at the taste of mango smoothie', story: 'Marco drank a mango smoothie an hour before a stomach virus made him sick to his stomach. He knows the virus caused it, but now the taste of a mango smoothie makes him nauseous.' },
    { k: 'alarm', who: 'Priya', ucs: 'the loud fire alarm', ucr: 'jumping and a racing heart', cs: 'the click the speaker makes', cr: 'a racing heart at the click', story: 'In Priya’s dorm the fire alarm speaker clicks just before the blaring alarm goes off during drills, and the blare makes her jump. Now her heart races when she hears the click, even if no alarm follows.' },
    { k: 'cat', who: 'Theo', ucs: 'the taste of the canned food', ucr: 'salivating at the food', cs: 'the whir of the can opener', cr: 'salivating at the whir', story: 'Theo’s cat gets canned food every evening, and the food in its mouth makes it salivate. The can opener always whirs just before. Now the cat licks its lips and salivates at the whir of the can opener, even when Theo is opening beans.' },
    { k: 'perfume', who: 'Grace', ucs: 'a hug from her grandmother', ucr: 'feeling warm and calm', cs: 'the smell of her grandmother’s perfume', cr: 'feeling calm at that smell', story: 'Grace’s grandmother always wore the same perfume and hugged her tightly whenever they met, which made Grace feel warm and calm. Years later, a stranger walks by wearing that perfume and Grace suddenly feels calm.' },
    { k: 'ringtone', who: 'Diego', ucs: 'being yelled at by his boss', ucr: 'anxiety from the yelling', cs: 'his boss’s ringtone', cr: 'anxiety at the ringtone', story: 'Diego’s boss often called to yell at him, which made him anxious. His phone played a special ringtone for her calls. Now Diego feels anxious whenever he hears that ringtone, even on someone else’s phone.' }
  ];
  /* Operant consequences: [behavior, consequence, added or removed, up or down]. */
  var OPERANT = [
    { b: 'buckles the seatbelt', c: 'the car’s beeping stops', add: false, up: true, who: 'A driver' },
    { b: 'cleans her room', c: 'her parents give her extra screen time', add: true, up: true, who: 'Maya' },
    { b: 'texts during class', c: 'the teacher takes his phone for the day', add: false, up: false, who: 'Jordan' },
    { b: 'talks back', c: 'he is given extra chores', add: true, up: false, who: 'Eli' },
    { b: 'takes an aspirin for a headache', c: 'the headache goes away', add: false, up: true, who: 'Sam' },
    { b: 'finishes homework early', c: 'her mother stops reminding her to do it', add: false, up: true, who: 'Lena' },
    { b: 'touches the hot stove', c: 'he gets a painful burn', add: true, up: false, who: 'A toddler' },
    { b: 'comes home after curfew', c: 'her parents take away her car keys for a week', add: false, up: false, who: 'Rina' },
    { b: 'answers a question in class', c: 'the teacher praises him', add: true, up: true, who: 'Malik' },
    { b: 'leaves a dirty dish on the table', c: 'a roommate leaves an angry note', add: true, up: false, who: 'Chris' }
  ];
  var OP_NAMES = { 'true,true': 'Positive reinforcement', 'false,true': 'Negative reinforcement', 'true,false': 'Positive punishment', 'false,false': 'Negative punishment' };

  /* ----------------------------------------------------------- drills */
  // Practice skills: 1.A apply a concept to a scenario; 3.A read a graph;
  // 3.B calculate central tendency.
  var SK = { ucs: '1.A', ucr: '1.A', cs: '1.A', cr: '1.A', read: '3.A', phase: '1.A', mean: '3.B', recov: '1.A', sched: '1.A', shape: '3.A', resist: '1.A', addrem: '1.A', updown: '1.A', name: '1.A' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '1.A' }; for(var k in o) s[k] = o[k]; return s; }
  function num(key, label, answer, d, o){
    o = o || {};
    var abs = Math.max(o.abs || 0, 0.6 * Math.pow(10, -d));
    return step(key, label, { kind: 'num', d: d, unit: o.unit, hint: o.hint, cell: M.cell(answer, 1e-6, o.mistakes || [], abs) });
  }
  function choice(key, label, opts){
    return step(key, label, { kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 });
  }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function f1(x){ return M.minus(M.fixed(x, 1)); }

  function genLabels(r, c){
    var pool = c.scenes ? SCENARIOS.filter(function(s){ return c.scenes.indexOf(s.k) > -1; }) : SCENARIOS, sc = r.pick(pool);
    var all = { ucs: sc.ucs, ucr: sc.ucr, cs: sc.cs, cr: sc.cr };
    var NAMES = { ucs: 'unconditioned stimulus (UCS)', ucr: 'unconditioned response (UCR)', cs: 'conditioned stimulus (CS)', cr: 'conditioned response (CR)' };
    var WHY = {
      ucs: 'The UCS triggers the response with no learning: ' + sc.ucs + '.',
      ucr: 'The UCR is the unlearned response to the UCS: ' + sc.ucr + '.',
      cs: 'The CS was neutral at first and now triggers the response because it was paired with the UCS: ' + sc.cs + '.',
      cr: 'The CR is the learned response to the CS alone: ' + sc.cr + '.'
    };
    function ask(key, q){
      var opts = [[cap(all[key]) + '.', WHY[key]]];
      ['ucs', 'ucr', 'cs', 'cr'].filter(function(k){ return k !== key; }).forEach(function(k){ opts.push([cap(all[k]) + '.', 'That is the ' + NAMES[k] + '. ' + WHY[k]]); });
      return choice(key, q, opts);
    }
    var order = M.shuffle(r, ['ucs', 'cs', 'cr']).concat(r() < 0.5 ? ['ucr'] : []);
    var Q = { ucs: 'What is the unconditioned stimulus (UCS)?', ucr: 'What is the unconditioned response (UCR)?', cs: 'What is the conditioned stimulus (CS)?', cr: 'What is the conditioned response (CR)?' };
    var text = '<p>' + sc.story + '</p>';
    var steps = order.map(function(k){ return ask(k, Q[k]); });
    var sol = [
      'UCS: ' + sc.ucs + ' (no learning needed). UCR: ' + sc.ucr + '.',
      'CS: ' + sc.cs + ' (neutral until it was paired with the UCS). CR: ' + sc.cr + '.',
      'The UCR and CR are the same kind of response: what differs is what triggers it, the UCS (unlearned) or the CS (learned).'
    ];
    return { ctx: c.id, topic: c.topic, type: 'labels', text: text, steps: steps, solution: sol, given: { scene: sc.k, order: order },
      figure: { kind: 'labels', scene: sc.k } };
  }

  /* A classical record: acquisition, extinction, a rest, then tone-alone again. */
  function record(r, c){
    var nA = r.pick([8, 10]), nE = r.pick([8, 10]), trials = [];
    for(var i = 0; i < nA; i++) trials.push('pair');
    for(var j = 0; j < nE; j++) trials.push('tone');
    trials.push('rest');
    for(var k = 0; k < 3; k++) trials.push('tone');
    var cr = classical(trials).cr.map(function(v){ return Math.max(0, Math.round(v + (r() - 0.5) * 1.2)); });
    return { trials: trials, cr: cr, nA: nA, nE: nE };
  }
  function genPhases(r, c){
    var rec = record(r, c), tr = rec.trials, cr = rec.cr;
    // Trials are numbered without the rest (the rest is a day off between sessions).
    var pts = [], num_ = 0, restAt = 0;
    tr.forEach(function(t, i){ if(t === 'rest'){ restAt = num_; return; } num_++; pts.push([num_, cr[i], t]); });
    var block = pts.slice(0, 4).map(function(q){ return q[1]; }), lastA = pts.slice(rec.nA - 4, rec.nA).map(function(q){ return q[1]; });
    var which = r.pick(['acq', 'ext', 'rec']), ask = which === 'acq' ? pts[2] : which === 'ext' ? pts[rec.nA + 3] : pts[restAt];
    var NAMES = { acq: 'Acquisition', ext: 'Extinction', rec: 'Spontaneous recovery' };
    var WHYS = {
      acq: 'The tone is being paired with food, and the CR grows trial by trial.',
      ext: 'The tone comes with no food, so the CR weakens trial by trial.',
      rec: 'After a rest, the extinguished CR comes back, weaker than before: the association was suppressed, not erased.'
    };
    var text = '<p>' + c.lead + ' The graph shows the drops of saliva the dog produced when the tone sounded on each trial. On trials 1 to ' + rec.nA + ' the tone was followed by food; on trials ' + (rec.nA + 1) + ' to ' + (rec.nA + rec.nE) + ' the tone sounded alone. The dog then rested for a day, and the tone sounded alone again on trials ' + (restAt + 1) + ' to ' + (restAt + 3) + ' (invented data for practice).</p>';
    var phaseOpts = [[NAMES[which] + '.', WHYS[which]]].concat(['acq', 'ext', 'rec'].filter(function(k){ return k !== which; }).map(function(k){
      return [NAMES[k] + '.', k === 'rec' ? 'Spontaneous recovery is the return of the CR after a rest. On trial ' + ask[0] + ' ' + (which === 'acq' ? 'the tone is still being paired with food.' : 'no rest has come yet.') :
        k === 'ext' ? (which === 'rec' ? 'Extinction is the fading during tone-alone trials before the rest. Trial ' + ask[0] + ' is the first after the rest.' : 'On trial ' + ask[0] + ' the tone is still followed by food, so the response is being learned, not extinguished.') :
        'Acquisition is learning while the tone is paired with food. On trial ' + ask[0] + ' no food follows the tone.'];
    })).concat([['Generalization.', 'Generalization is responding to a stimulus similar to the CS. Here it is the same tone throughout.']]);
    var mean = E('mean', [lastA]);
    var steps = [
      num('read', 'How many drops did the dog produce on trial ' + ask[0] + '?', ask[1], 0, { hint: 'Find trial ' + ask[0] + ' on the x-axis and read up.' }),
      choice('phase', 'Which part of classical conditioning does trial ' + ask[0] + ' show?', phaseOpts),
      num('mean', 'What is the mean number of drops on the last four acquisition trials (' + (rec.nA - 3) + ' to ' + rec.nA + ')?', mean, 2, { hint: 'Add the four values and divide by 4.', mistakes: [
        { value: E('sum', [lastA]), why: 'That is the sum. Divide by 4.' }, { value: E('mean', [block]), why: 'That is trials 1 to 4. The question asks for trials ' + (rec.nA - 3) + ' to ' + rec.nA + '.' }] }),
      choice('recov', 'What does the jump after the rest show?', [
        ['Extinction suppressed the response but did not erase the learning.', 'Spontaneous recovery: after a pause the CR returns, weaker, so the association was still there.'],
        ['The dog learned the association again from scratch.', 'No food was given after the rest, so nothing new was paired. The old learning came back.'],
        ['Extinction erased the learning completely.', 'If it had been erased, the CR could not come back without new pairings.'],
        ['The tone became an unconditioned stimulus.', 'The tone is still a learned (conditioned) stimulus; it never triggers salivation without learning.']
      ])
    ];
    var sol = [
      'Trial ' + ask[0] + ': ' + ask[1] + ' drops, during ' + NAMES[which].toLowerCase() + '.',
      'Last four acquisition trials: (' + lastA.join(' + ') + ') ÷ 4 = ' + String(M.round(mean, 2)) + ' drops.',
      'After the rest the CR returns but is weaker than at the end of acquisition: spontaneous recovery, so extinction is new learning that suppresses the CR, not forgetting.'
    ];
    return { ctx: c.id, topic: c.topic, type: 'phases', text: text, steps: steps, solution: sol,
      given: { pts: pts.map(function(q){ return [q[0], q[1]]; }), kinds: pts.map(function(q){ return q[2]; }), nA: rec.nA, nE: rec.nE, restAt: restAt, ask: ask[0], which: which },
      figure: { kind: 'phases', pts: pts.map(function(q){ return [q[0], q[1]]; }), nA: rec.nA, nE: rec.nE, restAt: restAt } };
  }

  var SCHED_STORIES = {
    fr: ['A factory worker is paid $5 for every 20 shirts she finishes.', 'A coffee shop stamps a card and gives a free drink after every 10th purchase.', 'A student earns a sticker for every 5 math problems completed.'],
    vr: ['A gambler plays a slot machine that pays out after an unpredictable number of plays.', 'A salesperson closes a sale on some calls but never knows which call will work.', 'A child begs for candy at the store; sometimes the parent gives in after one request, sometimes after many.'],
    fi: ['A patient can press a button for pain medication, but the pump only delivers a dose for the first press after each 15-minute lockout.', 'Mail is delivered at noon every day; checking the mailbox finds new mail only on the first check after noon, and Jae checks more and more often as noon nears.', 'A website posts new grades every Monday at 9 a.m.; refreshing the page shows new grades only the first time after each posting, and a student refreshes more and more as Monday morning nears.'],
    vi: ['A fisher casts a line; a fish bites after varying stretches of time.', 'A student checks a social media app for new messages that arrive at unpredictable times.', 'A caller keeps redialing a busy help line; the line frees up after unpredictable stretches of time, and only the first call after it frees gets through.']
  };
  function genSchedule(r, c){
    var k = r.pick(c.schedules || ['fr', 'vr', 'fi', 'vi']), sc = schedOf(k), story = r.pick(SCHED_STORIES[k]);
    var text = '<p>' + story + '</p>';
    var WRONG = {
      fr: 'Fixed-ratio means a reward after a set number of responses.',
      vr: 'Variable-ratio means a reward after an unpredictable number of responses.',
      fi: 'Fixed-interval means the first response after a set time is rewarded.',
      vi: 'Variable-interval means the first response after an unpredictable time is rewarded.'
    };
    var SHAPES = { fr: 'Stair steps: fast runs with a pause after each reward.', vr: 'The steepest, steady line with almost no pauses.', fi: 'Scallops: slow after each reward, speeding up as the time nears.', vi: 'A slow, steady line with no pauses.' };
    var key = sc.ratio ? 'responses' : 'time';
    var steps = [
      choice('sched', 'Which reinforcement schedule is this?', [[sc.name + '.', 'The reward depends on ' + (sc.ratio ? 'the number of responses' : 'the time that has passed') + ', and that ' + (sc.fixed ? 'number is set' : 'number changes unpredictably') + '. ' + WRONG[k]]].concat(
        SCHEDULES.filter(function(s){ return s.k !== k; }).map(function(s){ return [s.name + '.', (s.ratio ? 'Ratio' : 'Interval') + ' schedules depend on ' + (s.ratio ? 'how many responses' : 'how much time') + '; here the reward depends on ' + key + ', ' + (sc.fixed ? 'and the requirement is fixed.' : 'and the requirement keeps changing.')]; }))),
      choice('shape', 'Which cumulative record would this behavior make?', [[SHAPES[k], sc.shape + '.']].concat(SCHEDULES.filter(function(s){ return s.k !== k; }).map(function(s){ return [SHAPES[s.k], 'That is the ' + s.name.toLowerCase() + ' record.']; }))),
      choice('resist', 'If the rewards stopped completely, which schedule would keep this kind of behavior going longest?', [
        ['A variable schedule, because the learner cannot tell when a reward is coming.', 'Partial, unpredictable reinforcement (especially variable-ratio) is the most resistant to extinction: a long run without reward is normal.'],
        ['Continuous reinforcement, because every response was rewarded.', 'Continuous reinforcement is learned fastest but extinguished fastest: the very first unrewarded response is noticed.'],
        ['A fixed schedule, because the learner knows exactly when to respond.', 'Predictable rewards make their absence easy to notice, so fixed schedules extinguish faster than variable ones.'],
        ['None: every schedule extinguishes at the same rate.', 'Schedules differ a lot in resistance to extinction; variable schedules last longest.']
      ])
    ];
    var sol = [
      'The reward depends on ' + key + ' (a ' + (sc.ratio ? 'ratio' : 'interval') + ' schedule), and the requirement is ' + (sc.fixed ? 'fixed' : 'variable') + ': ' + sc.name.toLowerCase() + '.',
      'Its record: ' + SHAPES[k].charAt(0).toLowerCase() + SHAPES[k].slice(1),
      'Variable schedules, variable-ratio most of all, resist extinction best.'
    ];
    return { ctx: c.id, topic: c.topic, type: 'schedule', text: text, steps: steps, solution: sol, given: { k: k },
      figure: { kind: 'schedule', k: k } };
  }

  function genOperant(r, c){
    var o = r.pick(c.items ? OPERANT.filter(function(x, i){ return c.items.indexOf(i) > -1; }) : OPERANT), name = OP_NAMES[o.add + ',' + o.up];
    var text = '<p>' + o.who + ' ' + o.b + ', and ' + o.c + '. After this happens a few times, the behavior becomes ' + (o.up ? 'more' : 'less') + ' frequent.</p>';
    var all = ['Positive reinforcement', 'Negative reinforcement', 'Positive punishment', 'Negative punishment'];
    var WHY = {
      'Positive reinforcement': 'Something pleasant is added, and the behavior increases.',
      'Negative reinforcement': 'Something unpleasant is removed, and the behavior increases.',
      'Positive punishment': 'Something unpleasant is added, and the behavior decreases.',
      'Negative punishment': 'Something pleasant is removed, and the behavior decreases.'
    };
    function slip(x){
      if(x === 'Negative reinforcement' && /punishment/.test(name)) return 'Negative reinforcement increases a behavior (something unpleasant is taken away). Here the behavior decreases, so this is punishment.';
      if(/punishment/.test(x) && name === 'Negative reinforcement') return 'Negative does not mean bad: it means something is removed. Removing something unpleasant makes the behavior more frequent, so this is reinforcement, not punishment.';
      if(/Positive/.test(x) !== /Positive/.test(name)) return 'Positive means something is added; negative means something is removed. Here ' + o.c + ': something is ' + (o.add ? 'added' : 'removed') + '.';
      return 'Reinforcement increases a behavior; punishment decreases it. Here the behavior becomes ' + (o.up ? 'more' : 'less') + ' frequent.';
    }
    var steps = [
      choice('addrem', 'Is something added or removed after the behavior?', [
        [o.add ? 'Added: ' + o.c + '.' : 'Removed: ' + o.c + '.', o.add ? 'Positive means added.' : 'Negative means removed.'],
        [o.add ? 'Removed.' : 'Added.', 'Look at what happens: ' + o.c + '. Something is ' + (o.add ? 'added' : 'taken away') + '.']
      ]),
      choice('updown', 'Is the behavior being reinforced or punished?', [
        [o.up ? 'Reinforced, because it becomes more frequent.' : 'Punished, because it becomes less frequent.', o.up ? 'Reinforcement always increases a behavior, whether something is added or removed.' : 'Punishment always decreases a behavior, whether something is added or removed.'],
        [o.up ? 'Punished, because something ' + (o.add ? 'is added' : 'is taken away') + '.' : 'Reinforced, because something ' + (o.add ? 'is added' : 'is taken away') + '.', 'Adding or removing decides positive or negative. Reinforced or punished depends only on what happens to the behavior: here it becomes ' + (o.up ? 'more' : 'less') + ' frequent.']
      ]),
      choice('name', 'Which operant conditioning term fits?', [[name + '.', WHY[name]]].concat(all.filter(function(x){ return x !== name; }).map(function(x){ return [x + '.', slip(x)]; })))
    ];
    var sol = [
      (o.add ? 'Added' : 'Removed') + ' (' + o.c + '), so it is ' + (o.add ? 'positive' : 'negative') + '.',
      'The behavior becomes ' + (o.up ? 'more' : 'less') + ' frequent, so it is ' + (o.up ? 'reinforcement' : 'punishment') + '.',
      name + '.' + (name === 'Negative reinforcement' ? ' Negative reinforcement is not punishment: it increases a behavior.' : '')
    ];
    return { ctx: c.id, topic: c.topic, type: 'operant', text: text, steps: steps, solution: sol, given: { add: o.add, up: o.up, name: name },
      figure: { kind: 'operant', add: o.add, up: o.up, b: o.b, c: o.c, who: o.who } };
  }

  var GEN = { labels: genLabels, phases: genPhases, schedule: genSchedule, operant: genOperant };
  M.register('conditioningLab', {
    RATE: RATE, MAXCR: MAXCR, RECOVER: RECOVER, classical: classical, SCHEDULES: SCHEDULES, schedOf: schedOf, session: session, cumulative: cumulative,
    SCENARIOS: SCENARIOS, OPERANT: OPERANT, OP_NAMES: OP_NAMES, SCHED_STORIES: SCHED_STORIES,
    TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var types = ctx.types || Object.keys(GEN);
      var ty = type && types.indexOf(type) > -1 ? type : r.pick(types);
      return GEN[ty](r, ctx);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
