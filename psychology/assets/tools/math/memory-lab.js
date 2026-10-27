/* Memory lab model: ApPsychMath.memoryLab (docs/appsych-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/appsych-briefs/t3.md). Pure functions, no
   DOM, so the validator (scripts/lib/appsych-tool-checks/memory-lab.mjs) and
   the test (scripts/test/appsych-tool-memory-lab.test.mjs) run exactly this
   code.

   The explore pane's curves are small teaching models, said so on the page:
   they reproduce the published shapes (the serial position curve and its
   lost recency after a filled delay, Murdock 1962 and Glanzer & Cunitz 1966;
   the forgetting curve, Ebbinghaus 1885; the spacing effect) but are not
   fitted to any one study, and no number on them is presented as measured.
   Every statistic a student computes or reads (a percent recalled, a mean, a
   drop in points) comes from ApPsychStats.

     WORDS                    concrete nouns for the list a student learns
     list(seed, n)            n words, seeded
     recallP(pos, n, delayed) the model's chance of recalling position pos
                              (1-based) of an n-word list, immediate or after
                              a 30-second filled delay
     simulate(seed, k, n, delayed) -> { hits: [[0|1 per position] per learner],
                              pct: percent recalled per position (ApPsychStats
                              mean x 100) }
     score(words, typed)      which positions a student's typed words recall
                              (case, plurals and small typos forgiven)
     retention(reviews, t)    the model's percent retained on day t after
                              learning on day 0 with reviews on the given days
     curve(reviews, days)     [[day, percent], ...] every 0.1 day
     PRESETS                  the review schedules on the Forgetting scene
     SCENES                   the interference stories (older and newer
                              learning, what intrudes)
     generate(rng, ctx, type) the drills:
       serial        a serial position table: primacy, the mean of the last
                     positions, what a delay does to recency and why
       spacing       massed vs distributed study: the variable, both means,
                     the conclusion
       interference  a fresh story: which memory is being retrieved, then
                     proactive or retroactive
       forgetting    a forgetting curve table: drops in points, the shape,
                     what flattens it */
(function(G){
  'use strict';
  var M = G.ApPsychMath;
  if(!M) return;
  function S(){ return M.Stats(); }
  function E(fn, args){ return S().evaluate({ fn: fn, args: args }); }

  var WORDS = ['apple', 'bridge', 'candle', 'dolphin', 'engine', 'feather', 'garden', 'hammer', 'island', 'jacket', 'kettle', 'ladder',
    'mirror', 'needle', 'orange', 'pencil', 'rabbit', 'saddle', 'tiger', 'violin', 'window', 'zipper', 'basket', 'camera',
    'desert', 'forest', 'guitar', 'helmet', 'lemon', 'magnet', 'pillow', 'rocket', 'spoon', 'tunnel', 'wallet', 'anchor'];
  function list(seed, n){ return M.shuffle(M.rng(seed || 1), WORDS).slice(0, n || 12); }

  /* The serial position model: a floor, a primacy bump from extra rehearsal
     of the first items, and a recency bump from the last items still in
     short-term memory, which a 30-second filled delay removes. */
  function recallP(pos, n, delayed){
    var base = 0.28, prim = 0.5 * Math.exp(-(pos - 1) / 1.6), rec = delayed ? 0.04 * Math.exp(-(n - pos) / 1.2) : 0.62 * Math.exp(-(n - pos) / 1.3);
    return Math.min(0.97, base + prim + rec);
  }
  function simulate(seed, k, n, delayed){
    var r = M.rng(seed || 1), hits = M.repeat(k, function(){ return M.repeat(n, function(i){ return r() < recallP(i + 1, n, delayed) ? 1 : 0; }); });
    var pct = M.repeat(n, function(i){ return E('mul', [100, E('mean', [hits.map(function(h){ return h[i]; })])]); });
    return { hits: hits, pct: pct };
  }
  /* Forgiving match: case, a trailing s, one wrong letter in a word of 5+. */
  function norm(w){ return String(w || '').toLowerCase().replace(/[^a-z]/g, '').replace(/s$/, ''); }
  function near1(a, b){
    if(a === b) return true;
    if(Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 4) return false;
    var i = 0, j = 0, edits = 0;
    while(i < a.length && j < b.length){
      if(a[i] === b[j]){ i++; j++; continue; }
      if(++edits > 1) return false;
      if(a.length > b.length) i++; else if(b.length > a.length) j++; else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }
  function score(words, typed){
    var got = words.map(function(){ return 0; }), extra = [];
    (typed || []).forEach(function(t){
      var n = norm(t), k = -1;
      words.forEach(function(w, i){ if(k < 0 && !got[i] && near1(norm(w), n)) k = i; });
      if(k > -1) got[k] = 1; else if(n) extra.push(t);
    });
    return { hits: got, extra: extra, n: E('sum', [got.length ? got : [0]]) };
  }

  /* The forgetting model: retention = 20 + 80 x e^(-t / s) percent, where t
     is the time since the last study. Learning on day 0 gives s = 1.2 days;
     each review brings retention back to 100% and multiplies s by
     1 + 4 x (the share forgotten at that moment), so a review after some
     forgetting (spaced) strengthens the memory far more than one right after
     the last (massed). The shape follows Ebbinghaus (1885) and the spacing
     effect; the numbers are illustrative, and the page says so. */
  var S0 = 1.2, GAIN = 4, FLOOR = 20;
  function rawR(dt, s){ return FLOOR + (100 - FLOOR) * Math.exp(-dt / s); }
  function stateAt(reviews, t){
    var rs = (reviews || []).filter(function(d){ return d <= t; }).slice().sort(function(a, b){ return a - b; });
    var last = 0, s = S0;
    rs.forEach(function(d){ var R = rawR(d - last, s); s = s * (1 + GAIN * (1 - R / 100)); last = d; });
    return { last: last, s: s };
  }
  function retention(reviews, t){ var st = stateAt(reviews, t); return rawR(t - st.last, st.s); }
  function curve(reviews, days){
    var out = [];
    for(var i = 0; i <= days * 10; i++){ var t = i / 10; out.push([t, retention(reviews, t)]); }
    return out;
  }
  var PRESETS = [
    { k: 'none', name: 'No review', reviews: [] },
    { k: 'massed', name: 'Massed: three reviews on day 1', reviews: [1, 1.04, 1.08] },
    { k: 'spaced', name: 'Spaced: days 1, 3 and 7', reviews: [1, 3, 7] },
    { k: 'wide', name: 'Spaced wider: days 2, 6 and 14', reviews: [2, 6, 14] }
  ];

  /* Interference stories: an older and a newer learning of similar material. */
  var SCENES = [
    { k: 'locker', what: 'locker combinations', old: '24-8-31', nw: '17-5-40', learnOld: 'used the combination 24-8-31 on a gym locker all last year', learnNew: 'got a new locker this year with the combination 17-5-40',
      askOld: 'Helping a friend who now has last year’s locker', askNew: 'Standing at the new locker' },
    { k: 'spanish', what: 'words for “library”', old: 'biblioteca', nw: 'bibliothèque', learnOld: 'learned the Spanish word biblioteca in middle school', learnNew: 'learned the French word bibliothèque this semester',
      askOld: 'On a Spanish quiz', askNew: 'On a French quiz' },
    { k: 'phone', what: 'phone numbers', old: 'the old number', nw: 'the new number', learnOld: 'had the same phone number for six years', learnNew: 'switched to a new phone number last month',
      askOld: 'Filling in a form that asks for the number the family had until last month', askNew: 'Giving a friend the current number' },
    { k: 'route', what: 'routes to school', old: 'the old route', nw: 'the new route', learnOld: 'walked one route to school for years', learnNew: 'moved this summer and learned a new route',
      askOld: 'Visiting the old neighborhood and trying to walk the old route', askNew: 'Walking to school this fall' }
  ];

  /* ----------------------------------------------------------- drills */
  // Practice skills (docs/appsych-ced-map.json): 1.A apply a concept to a
  // scenario; 2.B experimental design; 3.A read a table or graph; 3.B
  // calculate and interpret central tendency.
  var SK = { primacy: '3.A', lastmean: '3.B', delay: '1.A', why: '1.A', iv: '2.B', spaced: '3.B', massed: '3.B', concl: '1.A',
    which: '1.A', kind: '1.A', drop1: '3.B', drop2: '3.B', shape: '3.A', fix: '1.A' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '1.A' }; for(var k in o) s[k] = o[k]; return s; }
  function num(key, label, answer, d, o){
    o = o || {};
    var abs = Math.max(o.abs || 0, 0.6 * Math.pow(10, -d));
    return step(key, label, { kind: 'num', d: d, unit: o.unit, hint: o.hint, cell: M.cell(answer, 1e-6, o.mistakes || [], abs) });
  }
  function choice(key, label, opts){
    return step(key, label, { kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 });
  }
  function f1(x){ return M.minus(M.fixed(x, 1)); }
  function n0(x){ return String(Math.round(x)); }

  function pctOf(r, k, p){ var cnt = Math.max(0, Math.min(k, Math.round(k * p + (r() - 0.5) * k * 0.12))); return E('div', [E('mul', [cnt, 100]), k]); }
  function mid(a){ return E('mean', [a.slice(3, 7)]); }
  function shapeOk(imm, del){
    var f = function(a){ return E('mean', [a.slice(0, 3)]); }, l = function(a){ return E('mean', [a.slice(7)]); };
    return f(imm) >= mid(imm) + 15 && l(imm) >= mid(imm) + 20 && l(imm) - l(del) >= 25 && l(del) <= mid(del) + 8 && Math.abs(f(imm) - f(del)) <= 12 && imm[0] > mid(imm) && del[0] > mid(del);
  }
  function genSerial(r, c){
    var n = 10, k = r.pick(c.groups || [20, 25, 50]), imm, del;
    // Counts out of k from the model with a little noise, kept only when
    // the table shows the textbook shape (so the keys hold for every seed).
    for(var g = 0; g < 300; g++){
      imm = M.repeat(n, function(i){ return pctOf(r, k, recallP(i + 1, n, false)); });
      del = M.repeat(n, function(i){ return pctOf(r, k, recallP(i + 1, n, true)); });
      if(shapeOk(imm, del)) break;
    }
    var last3 = imm.slice(n - 3), mean3 = E('mean', [last3]), dlast = del.slice(n - 3);
    var text = '<p>' + c.lead + ' Each of ' + k + ' participants heard ' + n + ' unrelated words, one every two seconds. One group wrote down every word they could remember at once; another group first counted backward by threes for 30 seconds. The table gives the percent of participants who recalled the word in each position (invented data for practice).</p>';
    var steps = [
      choice('primacy', 'Which part of the immediate-recall curve shows the primacy effect?', [
        ['Positions 1 to 3, recalled more than the middle of the list.', 'The first words get the most rehearsal, so more of them reach long-term memory.'],
        ['Positions 8 to 10, recalled more than the middle of the list.', 'High recall at the end of the list is the recency effect. Primacy is the beginning.'],
        ['Positions 4 to 7, recalled least.', 'The middle is the low point between the two effects, not an effect of its own.'],
        ['Every position equally: the curve is flat.', 'The curve is U-shaped: the beginning and the end beat the middle.']
      ]),
      num('lastmean', 'What is the mean percent recalled for positions 8, 9 and 10 in the immediate group?', mean3, 1, { unit: '%', hint: 'Add the three percents and divide by 3.', mistakes: [
        { value: E('sum', [last3]), why: 'That is the sum. Divide by 3, the number of positions.' },
        { value: E('mean', [dlast]), why: 'That is the delayed group. The question asks for the immediate group.' }] }),
      choice('delay', 'What did the 30-second counting task do to the last positions, and why?', [
        ['It removed the recency effect: the last words were held in short-term memory, and counting displaced them.', 'The counting task fills short-term memory, so the end of the list loses its advantage, while the beginning (already in long-term memory) keeps it.'],
        ['It removed the primacy effect: counting erased long-term memory.', 'Look at positions 1 to 3: they stay high after the delay. The first words were already in long-term memory.'],
        ['Nothing: the delayed curve has the same shape.', 'Compare positions 8 to 10: they fall from about ' + n0(mean3) + '% to about ' + n0(E('mean', [dlast])) + '%.'],
        ['It caused proactive interference from the numbers.', 'The task fills short-term memory; the loss is at the end of the list only, which is the recency effect disappearing.']
      ])
    ];
    var sol = [
      'Primacy: positions 1 to 3 (' + imm.slice(0, 3).join('%, ') + '%) beat the middle; recency: positions 8 to 10.',
      'Mean of positions 8 to 10, immediate group: (' + last3.join(' + ') + ') ÷ 3 = ' + f1(mean3) + '%.',
      'After 30 seconds of counting, positions 8 to 10 fall to ' + dlast.join('%, ') + '%: the recency effect is gone, the primacy effect stays (the pattern Glanzer and Cunitz reported in 1966).'
    ];
    return { ctx: c.id, topic: c.topic, type: 'serial', text: text, steps: steps, solution: sol,
      given: { k: k, imm: imm, del: del }, figure: { kind: 'serial', imm: imm, del: del } };
  }

  function genSpacing(r, c){
    var n = r.pick([5, 6]), lo = c.max * 0.35, hi = c.max * 0.95, base = r.int(Math.round(c.max * 0.4), Math.round(c.max * 0.55)), gain = r.int(Math.round(c.max * 0.15), Math.round(c.max * 0.3));
    function grp(mu){
      for(var g = 0; g < 200; g++){
        var d = M.repeat(n, function(){ return Math.max(0, Math.min(c.max, Math.round(mu + (r() - 0.5) * c.max * 0.3))); });
        if((E('sum', [d]) * 10) % n === 0) return d;
      }
      return M.repeat(n, function(){ return Math.round(mu); });
    }
    var massed, spaced, ms, ss;
    for(var g = 0; g < 100; g++){
      massed = grp(base); spaced = grp(base + gain); ms = E('mean', [massed]); ss = E('mean', [spaced]);
      if(ss - ms >= 0.1 * c.max) break;
    }
    var text = '<p>' + c.lead + ' Volunteers were randomly assigned to two groups. Both studied the same ' + c.material + ' for ' + c.minutes + ' minutes in all: the massed group in one session, the spaced group in ' + c.sessions + ' sessions on different days. A week later everyone took the same test (score out of ' + c.max + '; invented data for practice).</p>' +
      '<p class="ml-data">Massed: ' + massed.join(', ') + '<br>Spaced: ' + spaced.join(', ') + '</p>';
    var steps = [
      choice('iv', 'What is the independent variable?', [
        ['Whether study time was massed in one session or spread over ' + c.sessions + ' days.', 'That is what the researcher changed between the randomly assigned groups.'],
        ['The test score a week later.', 'The score is what was measured: the dependent variable.'],
        ['The ' + c.minutes + ' minutes of study.', 'Total time was kept the same in both groups (a controlled variable), so it cannot explain a difference.'],
        ['The ' + c.material + '.', 'Both groups studied the same material: it was controlled, not manipulated.']
      ]),
      num('spaced', 'What is the mean score of the spaced group?', ss, 1, { hint: 'Add the ' + n + ' scores and divide by ' + n + '.', mistakes: [
        { value: E('sum', [spaced]), why: 'That is the sum. Divide by ' + n + '.' }, { value: E('median', [spaced]), why: 'That is the median. The mean is the sum divided by ' + n + '.' }] }),
      num('massed', 'What is the mean score of the massed group?', ms, 1, { hint: 'Add the ' + n + ' scores and divide by ' + n + '.', mistakes: [
        { value: E('sum', [massed]), why: 'That is the sum. Divide by ' + n + '.' }, { value: E('median', [massed]), why: 'That is the median. The mean is the sum divided by ' + n + '.' }] }),
      choice('concl', 'Which conclusion do these results support?', [
        ['Spreading study over several days improved test scores: the spacing effect.', 'The spaced group scored higher on average (' + f1(ss) + ' vs ' + f1(ms) + '), and random assignment lets the researchers attribute the difference to the schedule.'],
        ['Cramming works better because the material is fresh.', 'The massed group scored lower a week later (' + f1(ms) + ' vs ' + f1(ss) + ').'],
        ['Studying longer improves memory.', 'Both groups studied for the same ' + c.minutes + ' minutes. Only the schedule differed.'],
        ['The results apply to every student because the groups were randomly assigned.', 'Random assignment supports cause, not generalizing. Whether the result holds for other people depends on who the volunteers were (age, school, culture), not on how the groups were formed or how many there were.']
      ])
    ];
    var sol = [
      'Independent variable: massed (one session) or spaced (' + c.sessions + ' days); dependent variable: the test score a week later.',
      'Spaced mean = (' + spaced.join(' + ') + ') ÷ ' + n + ' = ' + f1(ss) + '. Massed mean = (' + massed.join(' + ') + ') ÷ ' + n + ' = ' + f1(ms) + '.',
      'The spaced group remembered more: the spacing effect (distributed practice beats massed practice for the same total time).'
    ];
    return { ctx: c.id, topic: c.topic, type: 'spacing', text: text, steps: steps, solution: sol,
      given: { massed: massed, spaced: spaced, max: c.max }, figure: { kind: 'groups', massed: massed, spaced: spaced, max: c.max } };
  }

  function genInterference(r, c){
    var sc = r.pick(c.scenes ? SCENES.filter(function(s){ return c.scenes.indexOf(s.k) > -1; }) : SCENES), who = r.pick(c.people || ['Jada', 'Marcus', 'Elena', 'Kofi']);
    var testOld = r() < 0.5, kind = testOld ? 'retroactive' : 'proactive';
    var target = testOld ? sc.old : sc.nw, intr = testOld ? sc.nw : sc.old;
    var text = '<p>' + who + ' ' + sc.learnOld + ', then ' + sc.learnNew + '. ' + (testOld ? sc.askOld : sc.askNew) + ', ' + who + ' keeps coming up with ' + intr + ' instead of ' + target + '.</p>';
    var steps = [
      choice('which', 'Which memory is ' + who + ' trying to retrieve?', [
        [testOld ? 'The older one, learned first.' : 'The newer one, learned second.', 'Look at what ' + who + ' is asked for: ' + target + '.'],
        [testOld ? 'The newer one, learned second.' : 'The older one, learned first.', 'That is the memory that gets in the way, not the one ' + who + ' wants.']
      ]),
      choice('kind', 'Which kind of forgetting is this?', [
        [testOld ? 'Retroactive interference: new learning disrupts recall of older learning.' : 'Proactive interference: older learning disrupts recall of newer learning.', testOld ? 'The newer memory works backward in time on the older one: retro means backward.' : 'The older memory works forward in time on the newer one: pro means forward.'],
        [testOld ? 'Proactive interference: older learning disrupts recall of newer learning.' : 'Retroactive interference: new learning disrupts recall of older learning.', 'Name it by which memory is being retrieved. ' + who + ' wants the ' + (testOld ? 'older' : 'newer') + ' one, and the ' + (testOld ? 'newer' : 'older') + ' one intrudes: that is ' + kind + '.'],
        ['Encoding failure: the information never entered long-term memory.', who + ' did learn it and the other memory keeps intruding, so it was encoded; the trouble is at retrieval.'],
        ['The misinformation effect: misleading information after an event changed the memory.', 'The misinformation effect is about memories of events altered by later suggestions. Here two learned answers compete.']
      ])
    ];
    var sol = [
      who + ' is retrieving the ' + (testOld ? 'older' : 'newer') + ' memory (' + target + '), and the ' + (testOld ? 'newer' : 'older') + ' one (' + intr + ') intrudes.',
      testOld ? 'New learning interfering backward with old: retroactive interference.' : 'Old learning interfering forward with new: proactive interference.',
      'Interference is worst when the two memories are similar, as two ' + sc.what + ' are.'
    ];
    return { ctx: c.id, topic: c.topic, type: 'interference', text: text, steps: steps, solution: sol,
      given: { scene: sc.k, testOld: testOld }, figure: { kind: 'interf', testOld: testOld, old: sc.old, nw: sc.nw, what: sc.what } };
  }

  var DAYS = [0, 1, 2, 7, 14, 30];
  function genForgetting(r, c){
    // Percent retained, a power-law decay (the shape of Ebbinghaus's
    // curve) with a little noise: whole numbers, always falling.
    var a = r.pick(c.decay || [0.4, 0.45, 0.5]), pts = [], prev = 101;
    for(var g = 0; g < 100; g++){
      pts = []; prev = 101;
      DAYS.forEach(function(d){ var v = d === 0 ? 100 : Math.round(100 * Math.pow(1 + d, -a) + (r() - 0.5) * 4); v = Math.min(prev - 1, v); pts.push([d, v]); prev = v; });
      if(pts[0][1] - pts[1][1] > 2 * (pts[3][1] - pts[4][1])) break;
    }
    var d1 = E('sub', [pts[0][1], pts[1][1]]), d2 = E('sub', [pts[3][1], pts[4][1]]);
    var text = '<p>' + c.lead + ' The table shows the percent of the material the group still remembered after each delay (invented data for practice).</p>';
    var steps = [
      num('drop1', 'How many percentage points were lost between day 0 and day 1?', d1, 0, { hint: 'Day 0 percent minus day 1 percent.', mistakes: [{ value: pts[1][1], why: 'That is the percent still remembered on day 1. The question asks how much was lost.' }] }),
      num('drop2', 'How many percentage points were lost between day 7 and day 14?', d2, 0, { hint: 'Day 7 percent minus day 14 percent.', mistakes: [{ value: pts[4][1], why: 'That is the percent still remembered on day 14. Subtract it from day 7.' }] }),
      choice('shape', 'What do the two drops show about forgetting?', [
        ['Most forgetting happens soon after learning, then it levels off.', 'One day cost ' + n0(d1) + ' points, a whole week later only ' + n0(d2) + ': the shape Ebbinghaus first measured.'],
        ['Forgetting happens at a steady rate.', 'A steady rate would make the two drops similar. Compare ' + n0(d1) + ' points in one day with ' + n0(d2) + ' in seven.'],
        ['Most forgetting happens weeks later.', 'The biggest loss is in the first day.'],
        ['Memories are lost completely after a week.', 'Some material is still remembered on day 30 (' + pts[5][1] + '%).']
      ]),
      choice('fix', 'Which plan would most likely keep more of the material by day 30?', [
        ['Testing yourself on it on days 1, 3 and 7.', 'Spaced retrieval practice: each review after some forgetting makes the memory last longer (the spacing and testing effects).'],
        ['Rereading it three times in a row on day 0.', 'Massed rereading feels fluent but adds little: the reviews come before any forgetting.'],
        ['Studying it once for longer on day 0.', 'More time in one session is still massed practice.'],
        ['Waiting until day 29 and cramming.', 'Cramming helps for a test the next day; it does not keep material for weeks.']
      ])
    ];
    var sol = [
      'Day 0 to day 1: ' + pts[0][1] + ' − ' + pts[1][1] + ' = ' + n0(d1) + ' points. Day 7 to day 14: ' + pts[3][1] + ' − ' + pts[4][1] + ' = ' + n0(d2) + ' points.',
      'Forgetting is fast at first and then slows: the forgetting curve.',
      'Spaced retrieval practice flattens it.'
    ];
    return { ctx: c.id, topic: c.topic, type: 'forgetting', text: text, steps: steps, solution: sol,
      given: { pts: pts }, figure: { kind: 'forget', pts: pts } };
  }

  var GEN = { serial: genSerial, spacing: genSpacing, interference: genInterference, forgetting: genForgetting };
  M.register('memoryLab', {
    WORDS: WORDS, list: list, recallP: recallP, simulate: simulate, score: score, norm: norm, shapeOk: shapeOk,
    retention: retention, curve: curve, FLOOR: FLOOR, PRESETS: PRESETS, SCENES: SCENES, DAYS: DAYS, S0: S0, GAIN: GAIN,
    TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var types = ctx.types || Object.keys(GEN);
      var ty = type && types.indexOf(type) > -1 ? type : r.pick(types);
      return GEN[ty](r, ctx);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
