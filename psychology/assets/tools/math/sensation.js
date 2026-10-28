/* Sensation and perception model: ApPsychMath.sensation (docs/appsych-architecture.md,
   "Tools"). OWNED BY THIS TOOL ONLY (builder T2, docs/appsych-briefs/t2.md):
   no other tool edits this file, and this tool edits no shared file. Pure
   functions and tables, no DOM, so the validator (scripts/lib/appsych-tool-
   checks/sensation.mjs) and the test (scripts/test/appsych-tool-sensation.
   test.mjs) run exactly this code.

   The science (CED 1.6 and 2.1), kept in one place so the pictures, the
   numbers and the drills agree. Every number comes from ApPsychStats.
     sdt(d, c)       signal detection theory: on each trial the listener's
                     internal sense of "something there" is a normal curve
                     (noise alone centered at 0, signal plus noise at d, both
                     SD 1); they say "yes" when it passes their criterion c.
                     -> { hit, miss, fa, cr } as percents of signal and of
                     noise trials (ApPsychStats.cdf)
     detect(I, T, s) the share of trials a stimulus of intensity I is
                     detected when the absolute threshold is T (a logistic
                     psychometric curve: 50% at T)
     jnd(I, k)       Weber's law: the just noticeable difference is a
                     constant fraction k of the stimulus (WEBER: typical
                     textbook fractions for each sense)
     AFTER           opponent pairs (red-green, blue-yellow, black-white):
                     after staring at a color, its opponent is seen
     DEPTH, GESTALT  the cues and principles the CED lists, with what each
                     looks like in a picture
     ADAPT           sensory adaptation cases (and what is not adaptation)
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, given, figure }
     types: sdt (classify trials as hits, misses, false alarms and correct
     rejections; compute a hit or false-alarm rate; what a stricter or more
     lenient criterion does), weber (compute a JND, then decide whether a
     change will be noticed), threshold (read the absolute threshold from
     detection data), afterimage (which color, which theory), adapt (sensory
     adaptation and theories of vision and hearing), depth (name the depth
     cue in a picture), gestalt (name the principle in a figure). */
(function(G){
  'use strict';
  var M = G.ApPsychMath;
  if(!M) return;
  function S(){ return M.Stats(); }
  function E(recipe){ return S().evaluate(recipe); }

  /* ------------------------------------------------ signal detection */
  function sdt(d, c){
    var hit = E({ fn: 'mul', args: [100, { fn: 'sub', args: [1, { fn: 'cdf', args: [{ fn: 'sub', args: [c, d] }] }] }] });
    var fa = E({ fn: 'mul', args: [100, { fn: 'sub', args: [1, { fn: 'cdf', args: [c] }] }] });
    return { d: d, c: c, hit: hit, miss: E({ fn: 'sub', args: [100, hit] }), fa: fa, cr: E({ fn: 'sub', args: [100, fa] }) };
  }
  function pdf(x, mu){ var z = x - (mu || 0); return Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); }
  /* The detection curve: percent detected at intensity I, threshold T,
     slope s (intensity units per logistic unit). */
  function detect(I, T, s){ return 100 / (1 + Math.exp(-(I - T) / (s || 1))); }

  /* ------------------------------------------------ Weber's law */
  var WEBER = {
    weight: { name: 'lifted weight', k: 0.02, unit: 'g', pct: 2 },
    brightness: { name: 'brightness', k: 0.08, unit: 'lumens', pct: 8 },
    loudness: { name: 'loudness', k: 0.05, unit: 'units', pct: 5 },
    pitch: { name: 'pitch', k: 0.003, unit: 'Hz', pct: 0.3 },
    salt: { name: 'saltiness', k: 0.08, unit: 'mg', pct: 8 }
  };
  function jnd(I, k){ return E({ fn: 'mul', args: [I, k] }); }

  /* ------------------------------------------------ afterimages */
  var AFTER = { red: 'green', green: 'red', blue: 'yellow', yellow: 'blue', black: 'white', white: 'black' };
  var HEX = { red: '#D7263D', green: '#1B9E4B', blue: '#1F5FBF', yellow: '#F5C518', black: '#111111', white: '#FFFFFF' };

  /* ------------------------------------------------ depth and Gestalt */
  var DEPTH = {
    'relative-size': { name: 'Relative size', kind: 'monocular', look: 'Two things you know are the same size: the one with the smaller image looks farther away.' },
    interposition: { name: 'Interposition', kind: 'monocular', look: 'One object blocks part of another, so the blocked one looks farther away.' },
    'linear-perspective': { name: 'Linear perspective', kind: 'monocular', look: 'Parallel lines, like the edges of a road, seem to meet in the distance.' },
    'texture-gradient': { name: 'Texture gradient', kind: 'monocular', look: 'Surface detail is coarse and clear up close, and finer and denser farther away.' },
    'relative-clarity': { name: 'Relative clarity', kind: 'monocular', look: 'Hazy, blurry objects look farther away than sharp, clear ones.' },
    'retinal-disparity': { name: 'Retinal disparity', kind: 'binocular', look: 'Each eye sees a slightly different image; the bigger the difference, the closer the object.' },
    convergence: { name: 'Convergence', kind: 'binocular', look: 'The eyes turn inward more to look at something close; the brain reads that strain as distance.' }
  };
  var GESTALT = {
    closure: { name: 'Closure', look: 'Filling in gaps to see a whole shape.' },
    'figure-ground': { name: 'Figure-ground', look: 'Seeing an object (the figure) stand out from its surroundings (the ground).' },
    proximity: { name: 'Proximity', look: 'Grouping things that are close together.' },
    similarity: { name: 'Similarity', look: 'Grouping things that look alike.' }
  };
  /* Scenes the drills draw: each shows one cue or principle. */
  var DEPTH_SCENES = [
    { id: 'road', cue: 'linear-perspective', text: 'A painting shows a straight road whose two edges come together at a point on the horizon.' },
    { id: 'trees', cue: 'relative-size', text: 'A photo shows two oak trees of the same kind; one looks small and the other large, so the small one seems far away.' },
    { id: 'hills', cue: 'interposition', text: 'In a drawing, a barn hides part of a silo, so the silo seems to be behind the barn.' },
    { id: 'field', cue: 'texture-gradient', text: 'A field of flowers looks coarse and detailed near the bottom of a photo and turns into a fine, dense blur toward the top.' },
    { id: 'mountains', cue: 'relative-clarity', text: 'On a hazy day, the mountains that look faint and bluish seem much farther away than the sharp, clear ones.' },
    { id: 'vr', cue: 'retinal-disparity', text: 'A virtual-reality headset shows each eye a slightly different picture of the same scene, and objects suddenly look three-dimensional.' },
    { id: 'finger', cue: 'convergence', text: 'Bring a finger slowly toward your nose: your eyes cross more and more, and you can feel how close it is.' }
  ];
  var GESTALT_SCENES = [
    { id: 'kanizsa', law: 'closure', text: 'Three black circles, each with a wedge cut out, are arranged so that you see a white triangle that is not actually drawn.' },
    { id: 'vase', law: 'figure-ground', text: 'In a famous picture you see either a white vase or two dark faces in profile, switching back and forth.' },
    { id: 'pairs', law: 'proximity', text: 'Eight dots are spaced so that they look like four pairs, because each two dots sit close together.' },
    { id: 'rows', law: 'similarity', text: 'In a grid of evenly spaced dots, the rows alternate between filled and hollow dots, so you see rows rather than columns.' }
  ];
  var ADAPT = [
    { id: 'pool', kind: 'adapt', text: 'Maya jumps into a cool pool and gasps. Ten minutes later the water feels comfortable, though its temperature has not changed.' },
    { id: 'perfume', kind: 'adapt', text: 'Ben stops smelling his own cologne a few minutes after putting it on, but his friends still notice it.' },
    { id: 'watch', kind: 'adapt', text: 'Ana no longer feels her watch on her wrist after wearing it for a while.' },
    { id: 'fridge', kind: 'habituate', text: 'A new hum from the refrigerator annoys Leo at first, but after a week he stops paying attention to it, though he can still hear it if he listens.' }
  ];
  var THEORY = [
    { id: 'rg-blind', key: 'trichromatic', text: 'Jamal cannot tell red from green apples. One of the three types of cones in his retinas does not work normally.' },
    { id: 'flag', key: 'opponent', text: 'After staring at a green, black and yellow flag, Priya looks at a white wall and sees a red, white and blue flag.' },
    { id: 'night', key: 'rods', text: 'Walking outside on a moonless night, Sam can see shapes but no colors, and sees a faint star better by looking slightly to the side of it.' },
    { id: 'detail', key: 'cones', text: 'Reading small print in bright light, Lena uses the center of her retina, packed with the cells that see fine detail and color.' },
    { id: 'high', key: 'place', text: 'A high-pitched whistle makes hair cells near the base of the cochlea vibrate most.' },
    { id: 'low', key: 'frequency', text: 'A very low hum makes the whole basilar membrane vibrate, and the auditory nerve fires at the same rate as the sound wave.' },
    { id: 'phantom', key: 'phantom', text: 'Months after his leg was amputated, Carlos still feels sharp pain in his missing foot.' },
    { id: 'rub', key: 'gate', text: 'After bumping her elbow, Ruth rubs it hard, and the pain eases.' }
  ];
  var THEORY_NAME = { trichromatic: 'Trichromatic theory', opponent: 'Opponent-process theory', rods: 'Rods', cones: 'Cones', place: 'Place theory', frequency: 'Frequency theory', phantom: 'Phantom limb sensation', gate: 'Gate-control theory' };
  var THEORY_WHY = {
    trichromatic: 'Three kinds of cones (red, green and blue sensitive) combine to give every color; if one kind fails, some colors look alike.',
    opponent: 'Cells are paired as red-green, blue-yellow and black-white; tiring one side by staring makes its opponent show up as an afterimage.',
    rods: 'Rods work in dim light and see no color; there are more of them away from the center of the retina.',
    cones: 'Cones need bright light and give color and fine detail; they are packed in the fovea.',
    place: 'Different pitches make different places on the basilar membrane vibrate most: high pitches near the base.',
    frequency: 'For low pitches, the nerve fires at the same rate as the sound wave (volley theory extends this to higher pitches).',
    phantom: 'The brain still has a map of the missing limb and can produce sensations, including pain, from it.',
    gate: 'Signals from touch and rubbing can close a “gate” in the spinal cord, so fewer pain signals reach the brain.'
  };
  var THEORY_NEAR = { trichromatic: ['opponent', 'cones', 'rods'], opponent: ['trichromatic', 'rods', 'cones'], rods: ['cones', 'trichromatic', 'opponent'], cones: ['rods', 'trichromatic', 'opponent'],
    place: ['frequency', 'gate', 'trichromatic'], frequency: ['place', 'gate', 'opponent'], phantom: ['gate', 'place', 'opponent'], gate: ['phantom', 'frequency', 'place'] };

  /* ----------------------------------------------------------- drills */
  var SK = { outcome: '1.A', rate: '3.B', criterion: '1.A', jnd: '3.B', notice: '1.A', thresh: '3.A', what: '1.A', color: '1.A', theory: '1.A', kind: '1.A', cue: '1.A', law: '1.A', mono: '1.A', other: '1.A' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '1.A' }; for(var k in o) s[k] = o[k]; return s; }
  function num(key, label, answer, d, o){
    o = o || {};
    var abs = Math.max(o.abs || 0, 0.6 * Math.pow(10, -d));
    return step(key, label, { kind: 'num', d: d, unit: o.unit, hint: o.hint, cell: M.cell(answer, 1e-9, o.mistakes || [], abs) });
  }
  function choice(key, label, opts){ return step(key, label, { kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 }); }
  function f(x, d){ return M.fixed(x, d); }

  var OUTCOME = {
    hit: ['A hit', 'The signal was there and they said yes: a hit.'],
    miss: ['A miss', 'The signal was there but they said no: a miss.'],
    fa: ['A false alarm', 'No signal, but they said yes: a false alarm.'],
    cr: ['A correct rejection', 'No signal, and they said no: a correct rejection.']
  };
  function genSdt(r, c){
    var set = r.pick(c.settings || [{ who: 'a radiologist', sig: 'a small tumor on a scan', yes: 'reports a tumor' }]);
    var trials = r.int(c.trials ? c.trials[0] : 40, c.trials ? c.trials[1] : 60), sigN = Math.round(trials / 2), noiseN = trials - sigN;
    var hits = r.int(Math.round(sigN * 0.55), sigN - 2), fas = r.int(1, Math.round(noiseN * 0.35));
    var misses = sigN - hits, crs = noiseN - fas;
    var outcome = r.pick(['hit', 'miss', 'fa', 'cr']);
    var cases = { hit: 'The signal is present and ' + set.who + ' ' + set.yes + '.', miss: 'The signal is present, but ' + set.who + ' does not notice it.', fa: 'There is no signal, but ' + set.who + ' ' + set.yes + ' anyway.', cr: 'There is no signal, and ' + set.who + ' correctly says nothing is there.' };
    var text = '<p>' + (c.lead ? c.lead + ' ' : '') + 'In ' + trials + ' trials, ' + set.who + ' looks for ' + set.sig + '. The signal is present on ' + sigN + ' trials and absent on ' + noiseN + '. Results (invented): ' + hits + ' hits, ' + misses + ' misses, ' + fas + ' false alarms and ' + crs + ' correct rejections.</p>';
    var steps = [];
    var oth = ['hit', 'miss', 'fa', 'cr'].filter(function(k){ return k !== outcome; });
    steps.push(choice('outcome', 'On one trial: ' + cases[outcome] + ' Which outcome is this?', [[OUTCOME[outcome][0], 'Right. ' + OUTCOME[outcome][1]]].concat(oth.map(function(k){ return [OUTCOME[k][0], OUTCOME[k][1] + ' That is not this trial.']; }))));
    var askHit = r() < 0.5;
    var rate = askHit ? E({ fn: 'mul', args: [100, { fn: 'div', args: [hits, sigN] }] }) : E({ fn: 'mul', args: [100, { fn: 'div', args: [fas, noiseN] }] });
    steps.push(num('rate', askHit ? 'What is the hit rate, as a percent of the trials with the signal? (Round to a whole percent.)' : 'What is the false-alarm rate, as a percent of the trials without the signal? (Round to a whole percent.)', E({ fn: 'round', args: [rate, 0] }), 0, { unit: '%', abs: 0.6,
      hint: askHit ? 'Hits divided by the trials with the signal, times 100.' : 'False alarms divided by the trials without the signal, times 100.',
      mistakes: askHit ? [{ value: E({ fn: 'round', args: [{ fn: 'mul', args: [100, { fn: 'div', args: [hits, trials] }] }, 0] }), why: 'Divide by the ' + sigN + ' trials that had the signal, not by all ' + trials + '.' }, { value: E({ fn: 'round', args: [{ fn: 'mul', args: [100, { fn: 'div', args: [hits, { fn: 'add', args: [hits, fas] }] }] }, 0] }), why: 'The hit rate compares hits with misses (the signal trials), not with false alarms.' }]
        : [{ value: E({ fn: 'round', args: [{ fn: 'mul', args: [100, { fn: 'div', args: [fas, trials] }] }, 0] }), why: 'Divide by the ' + noiseN + ' trials without the signal, not by all ' + trials + '.' }, { value: E({ fn: 'round', args: [{ fn: 'mul', args: [100, { fn: 'div', args: [crs, noiseN] }] }, 0] }), why: 'That is the correct-rejection rate. False alarms are the yes answers when nothing was there.' }] }));
    var strict = r() < 0.5;
    steps.push(choice('criterion', strict ? 'False alarms are costly here, so ' + set.who + ' decides to say yes only when very sure (a stricter criterion). What happens?' : 'Missing a real signal is the worst outcome here, so ' + set.who + ' decides to say yes whenever unsure (a more lenient criterion). What happens?', strict ? [
      ['Fewer false alarms, but more misses.', 'Right. A stricter criterion means saying yes less often: fewer false alarms and fewer hits, so more misses.'],
      ['More hits and fewer misses.', 'Saying yes less often cannot raise hits. A stricter criterion trades hits for fewer false alarms.'],
      ['Both hits and false alarms rise.', 'That is a more lenient criterion. Being stricter lowers both.'],
      ['Their senses become sharper.', 'Changing the criterion is a decision, not sharper senses: the signal is just as hard to see.']
    ] : [
      ['More hits, but also more false alarms.', 'Right. A lenient criterion means saying yes more often: more hits (fewer misses) and more false alarms.'],
      ['More hits and fewer false alarms.', 'Saying yes more often raises false alarms too. Only a stronger signal or sharper senses can raise hits alone.'],
      ['Fewer false alarms, but more misses.', 'That is a stricter criterion.'],
      ['Their senses become sharper.', 'The criterion is a decision about when to say yes; it does not change what they can sense.']
    ]));
    var sol = [
      'Hit rate = ' + hits + ' / ' + sigN + ' × 100 = ' + f(E({ fn: 'mul', args: [100, { fn: 'div', args: [hits, sigN] }] }), 1) + '%. False-alarm rate = ' + fas + ' / ' + noiseN + ' × 100 = ' + f(E({ fn: 'mul', args: [100, { fn: 'div', args: [fas, noiseN] }] }), 1) + '%.',
      'Signal detection theory: whether we report a faint signal depends on how strong it is and on our criterion (expectations, motivation, costs), not on a fixed threshold alone.'
    ];
    return { ctx: c.id, topic: c.topic, type: 'sdt', text: text, steps: steps, solution: sol,
      given: { hits: hits, misses: misses, fas: fas, crs: crs, sigN: sigN, noiseN: noiseN, outcome: outcome, askHit: askHit, strict: strict },
      figure: { kind: 'sdtgrid', hits: hits, misses: misses, fas: fas, crs: crs } };
  }

  function genWeber(r, c){
    var sense = r.pick(c.senses || ['weight']), W = WEBER[sense], base = r.pick(c.bases || [50, 100, 200, 250, 500]);
    var I = sense === 'pitch' ? r.pick([200, 500, 1000, 2000]) : base, j = jnd(I, W.k);
    var add = r.pick([E({ fn: 'mul', args: [j, 0.5] }), E({ fn: 'mul', args: [j, 1.5] }), E({ fn: 'mul', args: [j, 2] }), E({ fn: 'mul', args: [j, 0.4] })]);
    add = M.round(add, j < 2 ? 2 : 1);
    var noticed = add >= j - 1e-9;
    var unit = W.unit, what = sense === 'weight' ? 'a ' + I + ' ' + unit + ' weight' : sense === 'pitch' ? 'a ' + I + ' Hz tone' : I + ' ' + unit + ' of ' + W.name;
    var text = '<p>' + (c.lead ? c.lead + ' ' : '') + 'For ' + W.name + ', the Weber fraction is about ' + W.pct + '% (a textbook value; it varies between people). A participant starts with ' + what + '.</p>';
    var d = j < 1 ? 2 : 1;
    var steps = [
      num('jnd', 'By Weber’s law, what is the just noticeable difference for ' + what + '?', j, d, { unit: unit, abs: Math.pow(10, -d) * 0.6, hint: 'JND = Weber fraction × the starting stimulus: ' + W.pct + '% of ' + I + '.',
        mistakes: [{ value: W.pct, why: 'That is the Weber fraction itself. The JND is that fraction of the starting stimulus: ' + W.pct + '% of ' + I + '.' }, { value: E({ fn: 'add', args: [I, j] }), why: 'That is the new stimulus. The JND is only the change: ' + W.pct + '% of ' + I + '.' }] }),
      choice('notice', 'The stimulus is increased by ' + add + ' ' + unit + '. Will the participant notice the change at least half the time?', noticed ? [
        ['Yes: ' + add + ' ' + unit + ' is at least the JND.', 'Right. A change as large as the JND is noticed at least half the time.'],
        ['No: the change must be the same size for every stimulus.', 'Weber’s law says the opposite: the JND grows in proportion to the stimulus.'],
        ['No: changes smaller than ' + W.pct + ' ' + unit + ' are never noticed.', 'The fraction is a percent of the stimulus, not a fixed amount in ' + unit + '.'],
        ['It depends only on the absolute threshold.', 'The absolute threshold is about detecting a stimulus at all. Noticing a change is the difference threshold (JND).']
      ] : [
        ['No: ' + add + ' ' + unit + ' is smaller than the JND.', 'Right. A change smaller than the JND is noticed less than half the time.'],
        ['Yes: any change in the stimulus is noticed.', 'Only changes of at least the JND are noticed reliably. This one is smaller.'],
        ['Yes, because ' + add + ' is more than ' + W.pct + '.', 'Compare ' + add + ' ' + unit + ' with the JND in ' + unit + ' (' + M.fmt(j, 3) + '), not with the percent.'],
        ['It depends only on the absolute threshold.', 'Noticing a change is the difference threshold (JND), not the absolute threshold.']
      ])
    ];
    var sol = ['JND = ' + W.pct + '% × ' + I + ' = ' + M.fmt(j, 3) + ' ' + unit + '.', 'The change of ' + add + ' ' + unit + ' is ' + (noticed ? 'at least' : 'less than') + ' the JND, so it is ' + (noticed ? 'noticed at least half the time.' : 'usually not noticed.') + ' Double the stimulus and the JND doubles too.'];
    return { ctx: c.id, topic: c.topic, type: 'weber', text: text, steps: steps, solution: sol,
      given: { sense: sense, I: I, k: W.k, add: add }, figure: { kind: 'weber', sense: sense, I: I, add: add } };
  }

  function genThreshold(r, c){
    var T = r.pick(c.thresholds || [6, 8, 10, 12, 14]), step0 = r.pick([2, 4]), lvls = [];
    for(var i = -3; i <= 3; i++) lvls.push(T + i * step0);
    var slope = step0 * 0.55, pct = lvls.map(function(I){ return Math.round(detect(I, T, slope)); });
    var what = r.pick(c.stimuli || [{ s: 'a faint tone', u: 'dB' }]);
    var text = '<p>' + (c.lead ? c.lead + ' ' : '') + 'A participant hears ' + what.s + ' at seven intensities, many times each, and says whether they detected it. The table gives the percent of trials detected (invented data).</p>' +
      '<table class="ls-tbl"><caption>Percent of trials detected</caption><thead><tr><th scope="col">Intensity (' + what.u + ')</th>' + lvls.map(function(I){ return '<th scope="col">' + I + '</th>'; }).join('') + '</tr></thead><tbody><tr><th scope="row">Detected</th>' + pct.map(function(p){ return '<td>' + p + '%</td>'; }).join('') + '</tr></tbody></table>';
    var steps = [
      num('thresh', 'What is the absolute threshold, in ' + what.u + '?', T, 0, { unit: what.u, abs: 0.5, hint: 'The intensity detected on half (50%) of the trials.',
        mistakes: [{ value: lvls[lvls.length - 1], why: 'That intensity is detected almost every time. The absolute threshold is where detection is 50%.' }, { value: lvls[0], why: 'That intensity is rarely detected. The absolute threshold is where detection is 50%.' }] }),
      choice('what', 'Which statement about the absolute threshold is correct?', [
        ['It is the weakest stimulus detected half the time.', 'Right. Detection rises gradually, so the threshold is defined at 50%.'],
        ['It is the weakest stimulus ever detected.', 'Detection rises gradually; a stimulus far below threshold is still caught now and then by chance.'],
        ['It is the smallest change between two stimuli that can be noticed.', 'That is the difference threshold (the JND).'],
        ['It is the same for every person and every day.', 'Thresholds differ between people and change with fatigue, expectations and attention.']
      ])
    ];
    return { ctx: c.id, topic: c.topic, type: 'threshold', text: text, steps: steps, solution: ['Detection is 50% at ' + T + ' ' + what.u + ', so the absolute threshold is ' + T + ' ' + what.u + '.', 'Below threshold a stimulus is not detected most of the time; above it, most of the time.'],
      given: { levels: lvls, pct: pct, T: T }, figure: { kind: 'psycho', levels: lvls, pct: pct, unit: what.u } };
  }

  var COLORS = ['red', 'green', 'blue', 'yellow'];
  function genAfterimage(r, c){
    var col = r.pick(c.colors || COLORS), opp = AFTER[col];
    var text = '<p>' + (c.lead ? c.lead + ' ' : '') + 'Kiara stares at a ' + col + ' square for 40 seconds, then looks at a plain white page.</p>';
    var steps = [
      choice('color', 'What color does she see in the afterimage?', [[cap(opp), 'Right. ' + cap(col) + ' and ' + opp + ' are an opponent pair: tiring the ' + col + ' side lets ' + opp + ' show.']].concat(COLORS.filter(function(k){ return k !== opp; }).slice(0, 3).map(function(k){ return [cap(k), k === col ? 'An afterimage is not the same color: it is the opponent color, ' + opp + '.' : cap(k) + ' is not ' + col + '’s opponent; the pairs are red-green and blue-yellow.']; }))),
      choice('theory', 'Which theory explains this afterimage?', [
        ['Opponent-process theory', 'Right. ' + THEORY_WHY.opponent],
        ['Trichromatic theory', 'Three cone types explain color mixing and most color blindness, but not why the afterimage is the opponent color.'],
        ['Place theory', 'Place theory is about hearing pitch.'],
        ['Gate-control theory', 'Gate-control theory is about pain.']
      ])
    ];
    return { ctx: c.id, topic: c.topic, type: 'afterimage', text: text, steps: steps, solution: ['Staring tires the ' + col + ' side of the ' + col + '-' + opp + ' opponent cells. On white, the ' + opp + ' side wins for a moment: a ' + opp + ' afterimage.', 'The two theories work together: trichromatic at the cones, opponent-process further along the visual pathway.'],
      given: { color: col }, figure: { kind: 'after', color: col } };
  }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  function genAdapt(r, c){
    if(r() < 0.45){
      var a = r.pick(ADAPT), isA = a.kind === 'adapt';
      var steps = [choice('kind', 'Which concept best explains this?', isA ? [
        ['Sensory adaptation', 'Right. Under constant stimulation the receptors respond less, so the sensation fades.'],
        ['Habituation', 'Habituation is paying less attention to a stimulus you can still sense. Here the sense itself fades.'],
        ['The absolute threshold', 'The stimulus is still well above threshold; the receptors simply respond less over time.'],
        ['Sensory interaction', 'Sensory interaction is one sense affecting another, like smell and taste. Only one sense is involved here.']
      ] : [
        ['Habituation', 'Right. He can still hear it if he listens: his attention, not his ears, stopped responding.'],
        ['Sensory adaptation', 'In adaptation the receptors themselves respond less. He can still hear the hum when he tries, so it is habituation.'],
        ['The just noticeable difference', 'Nothing changed in the stimulus; he simply stopped attending to it.'],
        ['Selective attention to a louder sound', 'There is no other sound here; he habituated to a repeated one.']
      ])];
      return { ctx: c.id, topic: c.topic, type: 'adapt', text: '<p>' + (c.lead ? c.lead + ' ' : '') + a.text + '</p>', steps: steps, solution: [isA ? 'Sensory adaptation: constant stimulation, less response from the receptors.' : 'Habituation: less attention to a repeated stimulus that can still be sensed.'],
        given: { case: a.id, kind: a.kind }, figure: null };
    }
    var t = r.pick(THEORY.filter(function(x){ return !c.theories || c.theories.indexOf(x.key) > -1; }));
    var steps2 = [choice('theory', 'Which concept best explains this?', [[THEORY_NAME[t.key], 'Right. ' + THEORY_WHY[t.key]]].concat(THEORY_NEAR[t.key].map(function(k){ return [THEORY_NAME[k], THEORY_WHY[k] + ' That does not fit here.']; })))];
    return { ctx: c.id, topic: c.topic, type: 'adapt', text: '<p>' + (c.lead ? c.lead + ' ' : '') + t.text + '</p>', steps: steps2, solution: [THEORY_NAME[t.key] + ': ' + THEORY_WHY[t.key]],
      given: { case: t.id, key: t.key }, figure: null };
  }

  var DEPTH_NEAR = { 'relative-size': ['relative-clarity', 'linear-perspective', 'interposition'], interposition: ['relative-size', 'texture-gradient', 'linear-perspective'], 'linear-perspective': ['texture-gradient', 'relative-size', 'convergence'],
    'texture-gradient': ['linear-perspective', 'relative-clarity', 'relative-size'], 'relative-clarity': ['texture-gradient', 'relative-size', 'interposition'], 'retinal-disparity': ['convergence', 'linear-perspective', 'relative-size'], convergence: ['retinal-disparity', 'relative-size', 'interposition'] };
  function genDepth(r, c){
    var sc = r.pick(DEPTH_SCENES.filter(function(x){ return !c.scenes || c.scenes.indexOf(x.id) > -1; })), cue = sc.cue, D = DEPTH[cue];
    var steps = [
      choice('cue', 'Which depth cue is this?', [[D.name, 'Right. ' + D.look]].concat(DEPTH_NEAR[cue].map(function(k){ return [DEPTH[k].name, DEPTH[k].look + ' That is not what this scene shows.']; }))),
      choice('mono', 'Is it a monocular or a binocular cue?', D.kind === 'monocular' ? [
        ['Monocular: it works with one eye.', 'Right. A single picture or one eye is enough, which is why painters can use it.'],
        ['Binocular: it needs both eyes.', 'This cue works in a flat picture seen with one eye, so it is monocular.'],
        ['Neither: it is a Gestalt principle.', 'Gestalt principles group things into wholes; depth cues tell distance.'],
        ['Both, equally.', 'Binocular cues need two eyes (retinal disparity, convergence). This one works with one.']
      ] : [
        ['Binocular: it needs both eyes.', 'Right. It depends on the two eyes working together.'],
        ['Monocular: it works with one eye.', 'With one eye closed this cue disappears: it is binocular.'],
        ['Neither: it is a Gestalt principle.', 'Gestalt principles group things into wholes; depth cues tell distance.'],
        ['Both, equally.', 'It needs both eyes, so it is binocular.']
      ])
    ];
    return { ctx: c.id, topic: c.topic, type: 'depth', text: '<p>' + (c.lead ? c.lead + ' ' : '') + sc.text + '</p>', steps: steps, solution: [D.name + ' (' + D.kind + '): ' + D.look],
      given: { scene: sc.id, cue: cue }, figure: { kind: 'depth', cue: cue } };
  }
  function genGestalt(r, c){
    var sc = r.pick(GESTALT_SCENES), law = sc.law, Gs = GESTALT[law];
    var steps = [choice('law', 'Which Gestalt principle explains what you see?', [[Gs.name, 'Right. ' + Gs.look]].concat(Object.keys(GESTALT).filter(function(k){ return k !== law; }).map(function(k){ return [GESTALT[k].name, GESTALT[k].look + ' That is not this figure.']; })))];
    steps.push(choice('other', 'Gestalt principles are an example of what kind of processing?', [
      ['Top-down: the brain organizes parts into meaningful wholes.', 'Right. “The whole is different from the sum of its parts”: the brain imposes organization.'],
      ['Bottom-up only: the eye records exactly what is there.', 'The triangle or the grouping is not in the light alone; the brain adds the organization.'],
      ['Sensory adaptation.', 'Adaptation is fading response to constant stimulation.'],
      ['A depth cue.', 'Depth cues tell distance; Gestalt principles group parts into wholes.']
    ]));
    return { ctx: c.id, topic: c.topic, type: 'gestalt', text: '<p>' + (c.lead ? c.lead + ' ' : '') + sc.text + '</p>', steps: steps, solution: [Gs.name + ': ' + Gs.look],
      given: { scene: sc.id, law: law }, figure: { kind: 'gestalt', law: law } };
  }

  var GEN = { sdt: genSdt, weber: genWeber, threshold: genThreshold, afterimage: genAfterimage, adapt: genAdapt, depth: genDepth, gestalt: genGestalt };
  M.register('sensation', {
    sdt: sdt, pdf: pdf, detect: detect, WEBER: WEBER, jnd: jnd, AFTER: AFTER, HEX: HEX,
    DEPTH: DEPTH, GESTALT: GESTALT, DEPTH_SCENES: DEPTH_SCENES, GESTALT_SCENES: GESTALT_SCENES, ADAPT: ADAPT, THEORY: THEORY, THEORY_NAME: THEORY_NAME, THEORY_WHY: THEORY_WHY,
    TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var types = ctx.types || Object.keys(GEN);
      var ty = type && types.indexOf(type) > -1 ? type : r.pick(types);
      return GEN[ty](r, ctx);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
